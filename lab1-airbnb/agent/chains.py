import os, re, json
from typing import Tuple, Optional, List, Dict

import httpx
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic

from schemas import AgentPlanRequest, PlanResponse
from tools.weather import weather_summary


# =========================
# 0) Load environment early
# =========================
# Ensures this works no matter where uvicorn is started from
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path, override=True)

# Validate Anthropic key before proceeding
ANTHROPIC_API_KEY = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
if not ANTHROPIC_API_KEY.startswith("sk-ant-"):
    raise RuntimeError(
        "❌ Anthropic API key not found or invalid. "
        "Please set ANTHROPIC_API_KEY in agent/.env (starts with sk-ant-)."
    )

# =========================
# 1) LLM: Claude 3.5 Haiku
# =========================
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022")
llm = ChatAnthropic(
    model=ANTHROPIC_MODEL,
    anthropic_api_key=ANTHROPIC_API_KEY,
    temperature=0.3,
    max_tokens=900,  # generous but bounded
)

# =========================
# 2) Tavily lightweight client (no LC tool import to avoid version churn)
# =========================
TAVILY_API_KEY = (os.getenv("TAVILY_API_KEY") or "").strip()

def tavily_search(q: str, max_results: int = 3) -> List[Dict]:
    """Minimal Tavily REST call that works regardless of LangChain tool versions."""
    if not TAVILY_API_KEY:
        return []
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": TAVILY_API_KEY,
        "query": q,
        "search_depth": "basic",
        "max_results": max_results,
        "include_domains": [],
        "exclude_domains": [],
        "include_answer": False,
    }
    try:
        with httpx.Client(timeout=15) as c:
            r = c.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
            return data.get("results", []) or []
    except Exception:
        return []

def tavily_snippet(q: str, max_len: int = 600) -> str:
    res = tavily_search(q, max_results=3)
    if not res:
        return ""
    chunks = []
    for item in res[:3]:
        title = item.get("title") or ""
        content = item.get("content") or ""
        url = item.get("url") or ""
        chunks.append(f"- {title}: {content[:220]}… ({url})")
    s = "\n".join(chunks)
    return s[:max_len]


# =========================
# 3) Helpers
# =========================
MONTHS = [
    "january","february","march","april","may","june","july",
    "august","september","october","november","december"
]
MON_ABBR = ["jan","feb","mar","apr","may","jun","jul","aug","sep","sept","oct","nov","dec"]

def _extract_month(q: str) -> Tuple[Optional[int], Optional[str]]:
    ql = q.lower()
    for i, m in enumerate(MONTHS, 1):
        if m in ql: return i, m
    for i, a in enumerate(MON_ABBR, 1):
        if re.search(rf"\b{a}\b", ql): return i, a
    return None, None

def _clean_concise(text: str) -> str:
    if not isinstance(text, str):
        return str(text)
    t = text.strip()
    t = re.sub(r"^\s*(Answer|Summary|Final Answer)\s*[:\-]\s*", "", t, flags=re.I)
    return t if len(t) <= 1200 else t[:1200].rsplit(" ", 1)[0] + "…"


# =========================
# 4) Anonymous Chat (web + weather + LLM)
# =========================
def general_chat(question: str) -> str:
    """
    Non-logged-in flow:
    - Try one quick Tavily search.
    - Try a weather hint if a month + city are detected.
    - Ask Claude to produce a concise, practical answer (3–6 sentences).
    """
    ctx_parts = []

    # Web context
    web = tavily_snippet(question)
    if web:
        ctx_parts.append("Web:\n" + web)

    # Weather context
    wx_text = ""
    mn, _ = _extract_month(question)
    cm = re.search(r"(?:in|for)\s+([A-Za-z][A-Za-z\s\-,]+)", question)
    if mn and cm:
        city = cm.group(1).strip().rstrip(".?")
        start, end = f"2025-{mn:02d}-05", f"2025-{mn:02d}-10"
        try:
            wx_text = weather_summary(f"{city} | {start} to {end}")
            if wx_text:
                ctx_parts.append("Weather:\n" + wx_text)
        except Exception:
            pass

    system = (
        "You are TripMate, a concise travel assistant.\n"
        "Use the context if helpful. Answer in 3–6 sentences. Be specific and practical."
    )
    user = (("Context:\n" + "\n\n".join(ctx_parts) + "\n\n") if ctx_parts else "") + f"Question: {question}\nAnswer:"
    try:
        resp = llm.invoke(system + "\n\n" + user)
        return _clean_concise(resp.content if hasattr(resp, "content") else str(resp))
    except Exception as e:
        print(f"[TripMate ERROR] Claude invocation failed: {e}")
        return f"Sorry, I had trouble answering that."


# =========================
# 5) Logged-in Structured Planner (JSON)
# =========================
def plan_with_context(req: AgentPlanRequest) -> PlanResponse:
    """
    Creates a detailed JSON itinerary based on booking, preferences, and free-text ask.
    Returns a valid PlanResponse, best-effort even if any web/weather step fails.
    """
    city   = req.booking.location
    start  = req.booking.start
    end    = req.booking.end
    guests = req.booking.guests

    interests = " ".join(req.preferences.interests) if req.preferences.interests else "top attractions"
    diet      = req.preferences.diet or "restaurants"
    budget    = req.preferences.budget or "$$"

    # Web snippets
    search_pois = tavily_snippet(
        f"Best {interests} in {city}; accessibility wheelchair/kid-friendly; suitable for {req.booking.partyType}; budget {budget}."
    ) or "Web search unavailable."
    search_food = tavily_snippet(
        f"Best {diet} restaurants in {city}; budget {budget}; kid-friendly if possible."
    ) or "Web search unavailable."

    # Weather summary
    try:
        wx = weather_summary(f"{city} | {start} to {end}")
    except Exception:
        wx = "Weather data unavailable."

    # Prompt to JSON
    system = (
        "You are TripMate, a travel concierge.\n"
        "Return ONLY valid JSON with keys: itinerary (array of days; each has morning/afternoon/evening arrays "
        "of activity cards), activities (flat array), restaurants (flat array), packing (array of strings).\n"
        "Each activity/restaurant card: {title, address, priceTier ($-$$$$), duration, tags[], "
        "flags: {wheelchair:boolean, childFriendly:boolean}}.\n"
        "Keep output compact and realistic."
    )
    user = (
        f"Booking: {start} to {end}, {guests} guests, location: {city}, partyType={req.booking.partyType}.\n"
        f"Preferences: budget={budget}, interests={req.preferences.interests or []}, "
        f"mobility={req.preferences.mobility or 'none'}, diet={req.preferences.diet or 'none'}.\n"
        f"Free-text ask: {req.ask or 'n/a'}\n\n"
        f"Weather summary:\n{wx}\n\n"
        f"POIs (web):\n{search_pois}\n\n"
        f"Restaurants (web):\n{search_food}\n\n"
        "Return ONLY the JSON."
    )

    try:
        resp = llm.invoke(system + "\n\n" + user)
        text = resp.content if hasattr(resp, "content") else str(resp)
        data = json.loads(text)
        return PlanResponse(**data)
    except Exception as e:
        print(f"[TripMate ERROR] Plan generation failed: {e}")
        packing = []
        if isinstance(wx, str) and wx:
            packing.append(wx)
        return PlanResponse(
            itinerary=[],
            activities=[],
            restaurants=[],
            packing=packing or ["comfortable shoes", "reusable water bottle"],
        )