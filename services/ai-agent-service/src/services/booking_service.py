import httpx
from typing import List, Dict, Optional
from src.config.settings import settings
import logging
from datetime import datetime, timezone
from dateutil import parser as date_parser

logger = logging.getLogger(__name__)

BOOKING_SERVICE_URL = settings.BOOKING_SERVICE_URL


async def get_traveler_bookings(traveler_id: str, status: Optional[str] = None) -> List[Dict]:
    """
    Fetch bookings for a traveler from booking-service
    Returns both 'accepted' and 'pending' bookings that are in the future
    """
    try:
        url = f"{BOOKING_SERVICE_URL}/api/booking/traveler/{traveler_id}"
        if status:
            url += f"?status={status}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            bookings = response.json()
            
            # Filter for future bookings only (accepted or pending)
            # Use UTC timezone-aware datetime for comparison
            now = datetime.now(timezone.utc)
            today = now.date()  # Get today's date for comparison
            future_bookings = []
            
            for booking in bookings:
                # Only include accepted and pending bookings
                if booking.get("status") not in ["accepted", "pending"]:
                    continue
                
                # Check if booking is in the future (or today)
                start_date_str = booking.get("startDate")
                if start_date_str:
                    try:
                        # Parse date string - handle various formats
                        if isinstance(start_date_str, str):
                            # Try parsing with dateutil which handles ISO format better
                            try:
                                start_date = date_parser.parse(start_date_str)
                            except:
                                # Fallback to fromisoformat
                                start_date_str_clean = start_date_str.replace('Z', '+00:00')
                                start_date = datetime.fromisoformat(start_date_str_clean)
                        else:
                            start_date = start_date_str
                        
                        # Ensure timezone-aware datetime
                        if start_date.tzinfo is None:
                            # If naive, assume UTC
                            start_date = start_date.replace(tzinfo=timezone.utc)
                        
                        # Compare dates only (not times) - include today and future bookings
                        start_date_only = start_date.date()
                        if start_date_only >= today:
                            future_bookings.append(booking)
                    except Exception as e:
                        logger.warning(f"Error parsing date for booking {booking.get('_id')}: {e}")
                        # Include booking anyway if date parsing fails (better to show than hide)
                        future_bookings.append(booking)
                else:
                    # If no start date, include it (shouldn't happen but be safe)
                    future_bookings.append(booking)
            
            # Sort by start date (earliest first)
            future_bookings.sort(key=lambda x: x.get("startDate", ""))
            
            return future_bookings
            
    except httpx.HTTPError as e:
        logger.error(f"Error fetching bookings from booking-service: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching bookings: {e}")
        raise


async def get_booking_by_id(booking_id: str) -> Optional[Dict]:
    """
    Fetch a specific booking by ID
    """
    try:
        url = f"{BOOKING_SERVICE_URL}/api/booking/{booking_id}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
            
    except httpx.HTTPError as e:
        logger.error(f"Error fetching booking {booking_id}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching booking: {e}")
        return None

