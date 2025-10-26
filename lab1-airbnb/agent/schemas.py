from pydantic import BaseModel
from typing import List, Optional, Tuple, Literal
from datetime import date

class BookingIn(BaseModel):
    id: Optional[int] = None
    location: str
    start: date
    end: date
    partyType: Literal["solo","couple","family","friends","business"] = "family"
    guests: int = 2

class Preferences(BaseModel):
    budget: Optional[Literal["$","$$","$$$","$$$$"]] = "$$"
    interests: List[str] = []
    mobility: Optional[Literal["none","wheelchair","limited"]] = "none"
    diet: Optional[str] = None

class AgentPlanRequest(BaseModel):
    booking: BookingIn
    preferences: Preferences
    ask: Optional[str] = None

class Card(BaseModel):
    title: str
    address: Optional[str] = None
    geo: Optional[Tuple[float,float]] = None
    priceTier: Optional[str] = None
    duration: Optional[str] = None
    tags: List[str] = []

class DayPlan(BaseModel):
    date: date
    morning: List[Card] = []
    afternoon: List[Card] = []
    evening: List[Card] = []

class PlanResponse(BaseModel):
    itinerary: List[DayPlan]
    activities: List[Card]
    restaurants: List[Card]
    packing: List[str]

class GeneralChatRequest(BaseModel):
    question: str

class GeneralChatResponse(BaseModel):
    answer: str