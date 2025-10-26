# agent/chains.py
import os, re, json, datetime
from typing import Tuple, Optional, List, Dict, Any

import httpx
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic

from schemas import AgentPlanRequest, PlanResponse
from tools.weather import weather_summary

# =========================
# 0) Environment & LLM init
# =========================
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path, override=True)

ANTHROPIC_API_KEY = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
if not ANTHROPIC_API_KEY.startswith("sk-ant-"):
    raise RuntimeError(
        "❌ Anthropic API key not found or invalid. "
        "Set ANTHROPIC_API_KEY in agent/.env (starts with sk-ant-)."
    )

ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022")

llm = ChatAnthropic(
    model=ANTHROPIC_MODEL,
    anthropic_api_key=ANTHROPIC_API_KEY,
    temperature=0.3,
    max_tokens=2200,   # room for JSON
)

# =========================
# 1) Tavily lightweight client
# =========================
TAVILY_API_KEY = (os.getenv("TAVILY_API_KEY") or "").strip()

def tavily_search(
    q: str,
    max_results: int = 8,
    depth: str = "advanced",
    include: Optional[List[str]] = None,
    exclude: Optional[List[str]] = None,
    include_answer: bool = True,
    timeout_s: int = 20,
) -> Dict[str, Any]:
    """
    Minimal Tavily REST call.
    Returns a dict: { query, answer, results: [ {title,url,content,score,...}, ... ] }
    """
    if not TAVILY_API_KEY:
        print("[TAVILY] No API key configured.")
        return {"query": q, "answer": "", "results": []}

    payload = {
        "api_key": TAVILY_API_KEY,
        "query": q,
        "search_depth": depth,
        "max_results": max_results,
        "include_answer": include_answer,
        "include_domains": include or [],
        "exclude_domains": exclude or [],
    }

    try:
        with httpx.Client(timeout=timeout_s) as c:
            r = c.post("https://api.tavily.com/search", json=payload)
            r.raise_for_status()
            data = r.json() or {}
            # ---------- DEBUG ----------
            print("\n" + "="*80)
            print(f"[TAVILY RAW] Query: {q}")
            # Print a pretty but bounded preview
            try:
                print(json.dumps(data, indent=2)[:3000])
            except Exception:
                print(str(data)[:3000])
            print("="*80 + "\n")
            # ---------------------------
            # Ensure shape
            data.setdefault("query", q)
            data.setdefault("answer", "")
            data.setdefault("results", [])
            return data
    except Exception as e:
        print(f"[TAVILY ERROR] {e}")
        return {"query": q, "answer": "", "results": []}

def tavily_snippet(query: str, *, max_len: int = 1800, **search_kwargs) -> str:
    """
    Fetch richer Tavily snippets including title, score, and URLs.
    Gives the LLM explicit structured input so it can extract real entities.
    DEBUG: prints summary lines and the final snippet size.
    """
    data = tavily_search(query, **search_kwargs)  # returns dict
    answer = data.get("answer") or ""
    results = data.get("results") or []

    lines = []
    if answer:
        lines.append(f"Summary from Tavily: {answer.strip()}")

    for idx, item in enumerate(results[:8], start=1):
        title = item.get("title") or ""
        content = item.get("content") or ""
        url = item.get("url") or ""
        score = item.get("score", None)
        score_str = f"{score:.2f}" if isinstance(score, (int, float)) else "N/A"
        lines.append(
            f"- #{idx} TITLE: {title}\n  SCORE: {score_str}\n  EXCERPT: {content[:500]}\n  SOURCE: {url}"
        )

    snippet = "\n".join(lines)[:max_len] or "No web results found."

    # ---------- DEBUG ----------
    print("[TAVILY SNIPPET] Built snippet for query:")
    print(f"  {query}")
    print(f"  Lines: {len(lines)}, Length: {len(snippet)} chars")
    print("  Preview:")
    print("  " + "\n  ".join(snippet.splitlines()[:6]))
    print("-"*80)
    # ---------------------------

    return snippet

# =========================
# 2) Helpers
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

def _date_range(start: str, end: str) -> List[str]:
    """Inclusive ISO date range; fallback to 2 days if parsing fails."""
    try:
        s = datetime.date.fromisoformat(start)
        e = datetime.date.fromisoformat(end)
        if e < s:
            e = s
        days = []
        cur = s
        while cur <= e and len(days) < 10:
            days.append(cur.isoformat())
            cur = cur + datetime.timedelta(days=1)
        if not days:
            days = [s.isoformat()]
        return days
    except Exception:
        today = datetime.date.today().isoformat()
        return [today, (datetime.date.today() + datetime.timedelta(days=1)).isoformat()]

# =========================
# 3) Anonymous Chat (web + weather + LLM)
# =========================
def general_chat(question: str) -> str:
    """
    Non-logged-in flow:
    - Tavily snippet (quick grounding)
    - Weather hint if month+city detected
    - Concise 3–6 sentence answer
    """
    print("\n[GENERAL_CHAT] Q:", question)

    ctx_parts = []
    web = tavily_snippet(question)
    if web:
        ctx_parts.append("Web:\n" + web)

    # Weather context if "in/for <city>" + month present
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
        except Exception as e:
            print("[GENERAL_CHAT] Weather summary error:", e)

    system = (
        "You are TripMate, a concise travel assistant.\n"
        "Use the context if helpful. Answer in 3–6 sentences. Be specific and practical."
    )
    user = (("Context:\n" + "\n\n".join(ctx_parts) + "\n\n") if ctx_parts else "") + f"Question: {question}\nAnswer:"

    print(f"[GENERAL_CHAT] Context blocks: {len(ctx_parts)}, total length: {len(user)} chars")

    try:
        resp = llm.invoke(system + "\n\n" + user)
        text = resp.content if hasattr(resp, "content") else str(resp)
        ans = _clean_concise(text)
        print("[GENERAL_CHAT] Answer preview:", ans[:200], "...")
        return ans
    except Exception as e:
        print(f"[TripMate ERROR] Claude invocation failed: {e}")
        return "Sorry, I had trouble answering that."

# =========================
# 4) Logged-in Structured Planner (JSON)
# =========================
def plan_with_context(req: AgentPlanRequest) -> PlanResponse:
    """
    Generate a full travel plan based on booking (dates, city, guests) and
    optional free-text ask. Automatically fuses Tavily and weather context.
    Adds detailed DEBUG prints at each step.
    """
    # --- 1. Basic fields ---
    city   = req.booking.location
    start  = req.booking.start[:10] if isinstance(req.booking.start, str) else str(req.booking.start)
    end    = req.booking.end[:10]   if isinstance(req.booking.end, str)   else str(req.booking.end)
    guests = int(req.booking.guests or 1)
    party  = getattr(req.booking, "partyType", "group")
    ask    = (getattr(req, "ask", "") or "").strip()

    print("\n" + "#"*90)
    print("[PLAN] Booking:", {"city": city, "start": start, "end": end, "guests": guests, "partyType": party})
    print("[PLAN] User ask:", ask)
    print("#"*90 + "\n")

    # --- 2. Context from Tavily + weather ---
    poi_query = (
        f"Best things to do in {city} between {start} and {end}. "
        f"Include addresses and note kid-friendly or wheelchair-friendly if relevant. "
        f"Hints from user: {ask[:250]}"
    )
    food_query = (
        f"Best restaurants in {city} between {start} and {end}. "
        f"Prefer options matching dietary hints from: {ask[:250]}"
    )

    poi_snip = tavily_snippet(poi_query, max_len=1800, include_answer=True)
    food_snip = tavily_snippet(food_query, max_len=1800, include_answer=True)

    try:
        wx = weather_summary(f"{city} | {start} to {end}")
    except Exception as e:
        print("[PLAN] Weather error:", e)
        wx = "Weather data unavailable."

    print("[PLAN] Snippet lengths → POIs:", len(poi_snip), "Food:", len(food_snip))
    print("[PLAN] Weather summary length:", len(wx) if isinstance(wx, str) else 0)

    # --- 3. Strong system prompt (JSON-only) ---
    system = (
        "You are TripMate, an expert AI travel planner.\n"
        "You will receive:\n"
        "- A booking (city, dates, guests)\n"
        "- A free-text traveler request\n"
        "- Tavily web data with TITLE, CONTENT EXCERPTS, URL, and SCORE (as a structured text block)\n"
        "- Weather summary\n\n"
        "Your job:\n"
        "1. Infer traveler preferences (budget, interests, mobility, dietary) from the free text if present.\n"
        "2. Use Tavily 'content' excerpts to extract REAL places and restaurants (do NOT just repeat article titles).\n"
        "3. Produce strictly valid JSON with keys:\n"
        "{\n"
        "  \"itinerary\": [ { \"date\": string, \"morning\": [Activity], \"afternoon\": [Activity], \"evening\": [Activity] } ],\n"
        "  \"activities\": [Activity],\n"
        "  \"restaurants\": [Activity],\n"
        "  \"packing\": [string]\n"
        "}\n"
        "Activity = { \"title\": string, \"address\": string, \"priceTier\": \"$\"|\"$$\"|\"$$$\"|\"$$$$\", "
        "\"duration\": string, \"tags\": [string], \"flags\": {\"wheelchair\": boolean, \"childFriendly\": boolean} }\n"
        "Generate at least 2 itinerary days (or all between start and end), with 1–2 items per block, grounded by Tavily.\n"
        "Weather should influence packing and indoor/outdoor timing.\n"
        "Return ONLY the JSON — no commentary."
    )

    user = (
        f"BOOKING:\n"
        f"City: {city}\nDates: {start} → {end}\nGuests: {guests}\nParty type: {party}\n\n"
        f"USER TEXT:\n{ask or '(none)'}\n\n"
        f"TAVILY – PLACES (structured lines):\n{poi_snip}\n\n"
        f"TAVILY – RESTAURANTS (structured lines):\n{food_snip}\n\n"
        f"WEATHER:\n{wx}\n\n"
        "Return ONLY the JSON object."
    )

    print("[PLAN] Prompt sizes → system:", len(system), "user:", len(user))

    # --- 4. LLM call and parse ---
    try:
        resp = llm.invoke(system + "\n\n" + user)
        raw = resp.content if hasattr(resp, "content") else str(resp)

        print("[PLAN] RAW LLM (first 1200 chars):")
        print(raw[:1200])
        if len(raw) > 1200:
            print("... [truncated] ...")

        data = json.loads(raw)

        # Light repair: if a block is string, wrap into activity object
        for day in data.get("itinerary", []):
            for block in ("morning", "afternoon", "evening"):
                if isinstance(day.get(block), str):
                    day[block] = [{"title": day[block], "address": "", "priceTier": "$$", "duration": "1-2h", "tags": [], "flags": {"wheelchair": False, "childFriendly": True}}]

        parsed = PlanResponse(**data)
        print("[PLAN] Parsed PlanResponse OK.")
        return parsed

    except Exception as e:
        print(f"[TripMate ERROR] JSON parse failed: {e}")
        # Empty but valid response (no deterministic synthesis)
        fallback_pack = []
        if isinstance(wx, str) and wx:
            fallback_pack.append(wx)
        return PlanResponse(itinerary=[], activities=[], restaurants=[], packing=fallback_pack)