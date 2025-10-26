from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# ---------- Core booking & request models ----------

class Booking(BaseModel):
    id: Optional[int] = None
    location: str
    start: str
    end: str
    guests: int
    # Client doesn’t have to send this; default on server
    partyType: Optional[str] = "group"

class Preferences(BaseModel):
    # Present for compatibility (ignored by current logic)
    budget: Optional[str] = None
    interests: List[str] = Field(default_factory=list)
    mobility: Literal["none", "wheelchair", "limited"] = "none"
    diet: Optional[str] = None

class AgentPlanRequest(BaseModel):
    booking: Booking
    preferences: Preferences = Preferences()
    ask: Optional[str] = None

class GeneralChatRequest(BaseModel):
    question: str

class GeneralChatResponse(BaseModel):
    answer: str


# ---------- Planner response models (used by plan_with_context) ----------

class Flags(BaseModel):
    wheelchair: bool = False
    childFriendly: bool = False

class Activity(BaseModel):
    title: str
    address: str = ""
    priceTier: Literal["$", "$$", "$$$", "$$$$"] = "$$"
    duration: str = ""
    tags: List[str] = Field(default_factory=list)
    flags: Flags = Field(default_factory=Flags)

class DayBlock(BaseModel):
    date: str
    morning: List[Activity] = Field(default_factory=list)
    afternoon: List[Activity] = Field(default_factory=list)
    evening: List[Activity] = Field(default_factory=list)

class PlanResponse(BaseModel):
    itinerary: List[DayBlock] = Field(default_factory=list)
    activities: List[Activity] = Field(default_factory=list)
    restaurants: List[Activity] = Field(default_factory=list)
    packing: List[str] = Field(default_factory=list)