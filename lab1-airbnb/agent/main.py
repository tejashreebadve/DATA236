from fastapi import FastAPI
from pydantic import BaseModel
from datetime import date
import os

try:
    from tavily import TavilyClient
    tav = TavilyClient(os.getenv("TAVILY_API_KEY")) if os.getenv("TAVILY_API_KEY") else None
except Exception:
    tav = None

app = FastAPI(title="AI Concierge Agent")

class Preferences(BaseModel):
    budget: str | None = None          # e.g., "low", "mid", "high"
    interests: list[str] | None = None # e.g., ["museums","beach"]
    mobility_needs: str | None = None  # e.g., "wheelchair", "kids"
    dietary: list[str] | None = None   # e.g., ["vegan","halal"]

class Booking(BaseModel):
    location: str
    start_date: date
    end_date: date
    party_type: str | None = None      # family, couple, solo
    guests: int | None = 2

class AgentRequest(BaseModel):
    booking: Booking
    preferences: Preferences

@app.post("/concierge")
def concierge(req: AgentRequest):
    # Optional live search (guarded)
    events = []
    if tav:
        q = f"events in {req.booking.location} between {req.booking.start_date} and {req.booking.end_date}"
        try:
            events = tav.search(q, max_results=5).get("results", [])
        except Exception:
            events = []

    # Minimal heuristic planner (replace with LangChain LLM if you like)
    plan = []
    day = req.booking.start_date
    while day <= req.booking.end_date:
        plan.append({
            "date": str(day),
            "morning": "Local cafe + walking tour",
            "afternoon": "Museum or landmark aligned to interests",
            "evening": "Dinner + stroll at a popular district"
        })
        day = date.fromordinal(day.toordinal() + 1)

    activity_cards = [
        {"title":"City Museum","address":"Central Ave","price_tier":"$$","duration":"2-3h",
         "tags":["museum","indoor"],"wheelchair_friendly":True,"child_friendly":True},
        {"title":"Riverside Park","address":"River Rd","price_tier":"$","duration":"1-2h",
         "tags":["outdoor","scenic"],"wheelchair_friendly":True,"child_friendly":True}
    ]

    restaurants = [
        {"name":"Green Fork","dietary":["vegan","gluten-free"],"address":"Market St","price_tier":"$$"},
        {"name":"Family Diner","dietary":["kids-menu"],"address":"Oak St","price_tier":"$"}
    ]

    packing = ["Comfortable shoes","Reusable water bottle","Light jacket"]

    return {
        "plan": plan,
        "activity_cards": activity_cards,
        "restaurants": restaurants,
        "events": events,
        "packing_checklist": packing
    }
