import httpx
from typing import Optional, Dict
from src.config.settings import settings
import logging

logger = logging.getLogger(__name__)

PROPERTY_SERVICE_URL = settings.PROPERTY_SERVICE_URL


async def get_property_by_id(property_id: str) -> Optional[Dict]:
    """
    Fetch property details from property-service
    """
    try:
        url = f"{PROPERTY_SERVICE_URL}/api/property/{property_id}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
            
    except httpx.HTTPError as e:
        logger.error(f"Error fetching property {property_id}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching property: {e}")
        return None

