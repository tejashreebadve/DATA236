from fastapi import HTTPException
from typing import List, Dict, Optional
from src.models.itinerary import (
    GenerateItineraryRequest,
    ItineraryResponse,
    ChatRequest,
    ChatResponse,
    Preferences
)
from src.services.booking_service import get_traveler_bookings, get_booking_by_id
from src.services.property_service import get_property_by_id
from src.agents.trip_agent import TripAgent
import logging

logger = logging.getLogger(__name__)

# Lazy initialization of agent (only when first used)
_trip_agent = None

def get_trip_agent():
    """Get or create the trip agent (singleton)"""
    global _trip_agent
    if _trip_agent is None:
        try:
            _trip_agent = TripAgent()
            logger.info("TripAgent initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing TripAgent: {e}", exc_info=True)
            raise
    return _trip_agent


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
        logger.error(f"Error getting traveler bookings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch bookings: {str(e)}")


async def generate_itinerary(request: GenerateItineraryRequest) -> ItineraryResponse:
    """
    Generate itinerary based on booking or manual input using AI agent
    """
    try:
        # Extract booking context if bookingId provided
        booking = None
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
            start_date = booking.get("startDate")
            end_date = booking.get("endDate")
            guests = booking.get("guests", 1)
        else:
            # Manual input
            if not all([request.location, request.startDate, request.endDate, request.guests]):
                raise HTTPException(
                    status_code=400,
                    detail="location, startDate, endDate, and guests are required when bookingId is not provided"
                )
            
            location_str = request.location
            start_date = request.startDate
            end_date = request.endDate
            guests = request.guests
        
        # Extract preferences from natural language input if provided
        preferences_dict = {
            "budget": request.preferences.budget,
            "interests": request.preferences.interests or [],
            "mobilityNeeds": request.preferences.mobilityNeeds,
            "dietaryFilters": request.preferences.dietaryFilters or [],
            "familyFriendly": request.preferences.familyFriendly
        }
        
        # If natural language input provided, extract additional preferences
        if request.preferences.naturalLanguageInput:
            agent = get_trip_agent()
            extracted = agent.extract_preferences(request.preferences.naturalLanguageInput)
            # Merge extracted preferences (extracted takes precedence)
            preferences_dict.update(extracted)
            # Merge arrays
            if extracted.get("interests"):
                preferences_dict["interests"] = list(set(preferences_dict["interests"] + extracted["interests"]))
            if extracted.get("dietaryFilters"):
                preferences_dict["dietaryFilters"] = list(set(preferences_dict["dietaryFilters"] + extracted["dietaryFilters"]))
        
        # Normalize date formats to YYYY-MM-DD for weather API
        from datetime import datetime
        def normalize_date(date_str):
            """Convert ISO date string to YYYY-MM-DD format"""
            if not date_str:
                return None
            try:
                # Try parsing ISO format
                if isinstance(date_str, str) and 'T' in date_str:
                    dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    return dt.strftime('%Y-%m-%d')
                # If already in YYYY-MM-DD format, return as is
                elif isinstance(date_str, str) and len(date_str) == 10:
                    return date_str
                else:
                    return str(date_str)[:10]  # Take first 10 chars
            except:
                return str(date_str)[:10] if date_str else None
        
        start_date_normalized = normalize_date(start_date)
        end_date_normalized = normalize_date(end_date)
        
        # Generate itinerary using AI agent
        agent = get_trip_agent()
        result = await agent.generate_itinerary(
            location=location_str,
            start_date=start_date_normalized or start_date,
            end_date=end_date_normalized or end_date,
            guests=guests,
            preferences=preferences_dict,
            booking_context=booking
        )
        
        logger.info(f"Generated itinerary result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        logger.info(f"Itinerary days count: {len(result.get('itinerary', {}).get('days', [])) if isinstance(result.get('itinerary'), dict) else 0}")
        
        # Validate and fix result structure before creating response
        try:
            # Ensure itinerary structure exists
            if "itinerary" not in result:
                result = {"itinerary": result, "metadata": result.get("metadata", {})}
            
            itinerary_data = result.get("itinerary", {})
            
            # Validate and fix packing checklist
            if "packingChecklist" in itinerary_data and isinstance(itinerary_data["packingChecklist"], list):
                fixed_packing = []
                for idx, item in enumerate(itinerary_data["packingChecklist"]):
                    if isinstance(item, dict):
                        # Ensure required fields exist
                        if "items" not in item or not isinstance(item.get("items"), list):
                            logger.warning(f"Fixing packing checklist item {idx}: missing or invalid 'items' field")
                            item["items"] = []
                        if "category" not in item:
                            logger.warning(f"Fixing packing checklist item {idx}: missing 'category' field")
                            item["category"] = f"Category {idx + 1}"
                        fixed_packing.append(item)
                    else:
                        logger.warning(f"Skipping invalid packing checklist item {idx}: {type(item)}")
                itinerary_data["packingChecklist"] = fixed_packing
            
            # Validate and fix restaurants
            if "restaurants" in itinerary_data and isinstance(itinerary_data["restaurants"], list):
                fixed_restaurants = []
                for idx, restaurant in enumerate(itinerary_data["restaurants"]):
                    if isinstance(restaurant, dict):
                        # Ensure required fields exist
                        if "name" not in restaurant:
                            restaurant["name"] = f"Restaurant {idx + 1}"
                        if "address" not in restaurant:
                            restaurant["address"] = "Address not specified"
                        if "cuisine" not in restaurant:
                            restaurant["cuisine"] = "Various"
                        if "priceTier" not in restaurant:
                            restaurant["priceTier"] = "medium"
                        fixed_restaurants.append(restaurant)
                    else:
                        logger.warning(f"Skipping invalid restaurant {idx}: {type(restaurant)}")
                itinerary_data["restaurants"] = fixed_restaurants
            
            # Validate and fix days
            if "days" in itinerary_data and isinstance(itinerary_data["days"], list):
                fixed_days = []
                for idx, day in enumerate(itinerary_data["days"]):
                    if isinstance(day, dict):
                        # Ensure required fields exist
                        if "date" not in day:
                            logger.warning(f"Fixing day {idx}: missing 'date' field")
                            day["date"] = ""  # Will be set by the agent if missing
                        # Ensure time blocks exist
                        for time_block in ["morning", "afternoon", "evening"]:
                            if time_block not in day:
                                day[time_block] = {"activities": []}
                            elif not isinstance(day[time_block], dict):
                                day[time_block] = {"activities": []}
                            elif "activities" not in day[time_block]:
                                day[time_block]["activities"] = []
                        fixed_days.append(day)
                    else:
                        logger.warning(f"Skipping invalid day {idx}: {type(day)}")
                itinerary_data["days"] = fixed_days
            
            # Update result with fixed data
            result["itinerary"] = itinerary_data
            
            # Create response with validated data
            response = ItineraryResponse(**result)
            logger.info(f"Successfully created ItineraryResponse with {len(response.itinerary.days)} days, {len(response.itinerary.restaurants)} restaurants, {len(response.itinerary.packingChecklist)} packing items")
            return response
        except Exception as e:
            logger.error(f"Error creating ItineraryResponse: {e}", exc_info=True)
            logger.error(f"Result structure: {result}")
            # Try to create a minimal valid response as fallback
            try:
                fallback_result = {
                    "itinerary": {
                        "days": result.get("itinerary", {}).get("days", []) if isinstance(result.get("itinerary"), dict) else result.get("days", []),
                        "restaurants": result.get("itinerary", {}).get("restaurants", []) if isinstance(result.get("itinerary"), dict) else result.get("restaurants", []),
                        "packingChecklist": result.get("itinerary", {}).get("packingChecklist", []) if isinstance(result.get("itinerary"), dict) else result.get("packingChecklist", [])
                    },
                    "metadata": result.get("metadata", {
                        "location": location_str,
                        "dates": {
                            "start": start_date_normalized or start_date,
                            "end": end_date_normalized or end_date
                        }
                    })
                }
                # Apply same fixes to fallback
                itinerary_data = fallback_result["itinerary"]
                if "packingChecklist" in itinerary_data:
                    itinerary_data["packingChecklist"] = [
                        {**item, "items": item.get("items", []) if isinstance(item.get("items"), list) else []}
                        for item in itinerary_data["packingChecklist"]
                        if isinstance(item, dict)
                    ]
                response = ItineraryResponse(**fallback_result)
                logger.warning("Created ItineraryResponse using fallback structure")
                return response
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {fallback_error}")
                raise HTTPException(status_code=500, detail=f"Failed to validate itinerary response: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating itinerary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate itinerary: {str(e)}")


async def chat(request: ChatRequest) -> ChatResponse:
    """
    Handle general chat requests using AI agent
    """
    try:
        agent = get_trip_agent()
        result = await agent.chat(
            message=request.message,
            context=request.context
        )
        
        return ChatResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process chat: {str(e)}")

