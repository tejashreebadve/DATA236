from fastapi import APIRouter, HTTPException
from typing import List, Dict
from src.controllers.agent_controller import (
    get_traveler_upcoming_bookings,
    generate_itinerary,
    chat
)
from src.models.itinerary import (
    GenerateItineraryRequest,
    ItineraryResponse,
    ChatRequest,
    ChatResponse
)

router = APIRouter(prefix="/api/ai-agent", tags=["AI Agent"])


@router.get("/bookings/{traveler_id}", response_model=Dict[str, List])
async def get_bookings(traveler_id: str):
    """
    Get upcoming bookings (accepted and pending) for a traveler
    """
    try:
        bookings = await get_traveler_upcoming_bookings(traveler_id)
        return {"bookings": bookings}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-itinerary", response_model=ItineraryResponse)
async def create_itinerary(request: GenerateItineraryRequest):
    """
    Generate itinerary for a booking or manual input
    """
    try:
        return await generate_itinerary(request)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    General chat endpoint for non-logged-in users or follow-up questions
    """
    try:
        return await chat(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

