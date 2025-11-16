from fastapi import HTTPException
from typing import List, Dict, Optional
from src.models.itinerary import (
    GenerateItineraryRequest,
    ItineraryResponse,
    ChatRequest,
    ChatResponse
)
from src.services.booking_service import get_traveler_bookings, get_booking_by_id
from src.services.property_service import get_property_by_id
import logging

logger = logging.getLogger(__name__)


async def get_traveler_upcoming_bookings(traveler_id: str) -> List[Dict]:
    """
    Get upcoming bookings (accepted and pending) for a traveler
    """
    try:
        # Get both accepted and pending bookings
        accepted = await get_traveler_bookings(traveler_id, status="accepted")
        pending = await get_traveler_bookings(traveler_id, status="pending")
        
        # Combine and return
        all_bookings = accepted + pending
        
        # Enrich with property details
        enriched_bookings = []
        for booking in all_bookings:
            property_id = booking.get("propertyId")
            if isinstance(property_id, dict):
                # Already populated
                enriched_bookings.append(booking)
            elif isinstance(property_id, str):
                # Need to fetch property details
                property_data = await get_property_by_id(property_id)
                if property_data:
                    booking["propertyId"] = property_data
                enriched_bookings.append(booking)
            else:
                enriched_bookings.append(booking)
        
        return enriched_bookings
        
    except Exception as e:
        logger.error(f"Error getting traveler bookings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch bookings")


async def generate_itinerary(request: GenerateItineraryRequest) -> ItineraryResponse:
    """
    Generate itinerary based on booking or manual input
    TODO: Implement actual AI agent logic in Phase 2
    """
    # Placeholder implementation - will be replaced in Phase 2
    if request.bookingId:
        booking = await get_booking_by_id(request.bookingId)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        property_id = booking.get("propertyId")
        if isinstance(property_id, str):
            property_data = await get_property_by_id(property_id)
        else:
            property_data = property_id
        
        location = property_data.get("location", {}) if property_data else {}
        location_str = f"{location.get('city', '')}, {location.get('country', '')}"
        
        return ItineraryResponse(
            itinerary={
                "days": [],
                "restaurants": [],
                "packingChecklist": []
            },
            metadata={
                "location": location_str,
                "dates": {
                    "start": booking.get("startDate"),
                    "end": booking.get("endDate")
                }
            }
        )
    else:
        # Manual input
        if not all([request.location, request.startDate, request.endDate, request.guests]):
            raise HTTPException(
                status_code=400,
                detail="location, startDate, endDate, and guests are required when bookingId is not provided"
            )
        
        return ItineraryResponse(
            itinerary={
                "days": [],
                "restaurants": [],
                "packingChecklist": []
            },
            metadata={
                "location": request.location,
                "dates": {
                    "start": request.startDate,
                    "end": request.endDate
                }
            }
        )


async def chat(request: ChatRequest) -> ChatResponse:
    """
    Handle general chat requests
    TODO: Implement actual AI agent logic in Phase 2
    """
    # Placeholder implementation - will be replaced in Phase 2
    return ChatResponse(
        response=f"Thank you for your question: {request.message}. This feature will be available in Phase 2.",
        sources=[]
    )

