from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import date


class Coordinates(BaseModel):
    lat: float
    lng: float


class Activity(BaseModel):
    title: str
    address: str
    coordinates: Optional[Coordinates] = None
    priceTier: str = Field(..., description="low|medium|high|luxury")
    duration: str = ""  # Default to empty string if not provided
    tags: List[str] = []
    wheelchairAccessible: bool = False
    childFriendly: bool = False
    description: Optional[str] = None


class TimeBlock(BaseModel):
    activities: List[Activity] = []


class DayPlan(BaseModel):
    date: str
    morning: TimeBlock = TimeBlock()
    afternoon: TimeBlock = TimeBlock()
    evening: TimeBlock = TimeBlock()


class Restaurant(BaseModel):
    name: str
    address: str
    cuisine: str = ""  # Default to empty string if not provided
    priceTier: str = "medium"  # Default to medium if not provided
    dietaryOptions: List[str] = []
    rating: Optional[float] = None
    description: Optional[str] = None
    coordinates: Optional[Coordinates] = None


class PackingItem(BaseModel):
    category: str
    items: List[str] = []  # Default to empty list if not provided
    weatherBased: bool = False


class Itinerary(BaseModel):
    days: List[DayPlan] = []
    restaurants: List[Restaurant] = []
    packingChecklist: List[PackingItem] = []


class ItineraryMetadata(BaseModel):
    location: str
    dates: Dict[str, str]
    weatherForecast: Optional[Dict] = None


class ItineraryResponse(BaseModel):
    itinerary: Itinerary
    metadata: ItineraryMetadata


class Preferences(BaseModel):
    budget: Optional[str] = Field(None, description="low|medium|high|luxury")
    interests: List[str] = []
    mobilityNeeds: Optional[str] = Field(None, description="none|wheelchair|limited")
    dietaryFilters: List[str] = []
    familyFriendly: bool = False
    naturalLanguageInput: Optional[str] = None


class GenerateItineraryRequest(BaseModel):
    bookingId: Optional[str] = None
    location: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    guests: Optional[int] = None
    preferences: Preferences


class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict] = None


class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[Dict]] = None

