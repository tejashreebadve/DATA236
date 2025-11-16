import httpx
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


def weather_summary(city_and_dates: str) -> str:
    """
    Given 'City, CC | YYYY-MM-DD to YYYY-MM-DD', returns concise weather info & packing suggestions.
    
    Args:
        city_and_dates: Format "City, CountryCode | YYYY-MM-DD to YYYY-MM-DD"
    
    Returns:
        String with weather summary and packing suggestions
    """
    try:
        city, span = [s.strip() for s in city_and_dates.split("|")]
        start, end = [s.strip() for s in span.split("to")]
    except Exception as e:
        logger.error(f"Error parsing city_and_dates format: {e}")
        return "Format error. Use: 'City, CountryCode | YYYY-MM-DD to YYYY-MM-DD'"

    try:
        with httpx.Client(timeout=20.0, headers={"User-Agent": "RedNest-TripMate/1.0"}) as client:
            # Geocode city using OpenStreetMap Nominatim
            geocode_response = client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": city, "format": "json", "limit": 1}
            )
            geocode_response.raise_for_status()
            geocode_data = geocode_response.json()
            
            if not geocode_data:
                return f"Could not geocode {city}"
            
            lat, lon = float(geocode_data[0]["lat"]), float(geocode_data[0]["lon"])
            
            # Get weather forecast from open-meteo.com
            weather_response = client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
                    "timezone": "auto",
                    "start_date": start,
                    "end_date": end
                }
            )
            weather_response.raise_for_status()
            weather_data = weather_response.json().get("daily", {})
            
            if not weather_data:
                return f"Could not fetch weather data for {city}"
            
            # Parse weather data
            temps_max = weather_data.get("temperature_2m_max", [])
            temps_min = weather_data.get("temperature_2m_min", [])
            precip_prob = weather_data.get("precipitation_probability_max", [])
            weather_codes = weather_data.get("weathercode", [])
            dates = weather_data.get("time", [])
            
            # Build summary
            summary_parts = [f"Weather forecast for {city} ({start} to {end}):"]
            
            if dates and temps_max and temps_min:
                avg_max = sum(temps_max) / len(temps_max) if temps_max else 0
                avg_min = sum(temps_min) / len(temps_min) if temps_min else 0
                avg_precip = sum(precip_prob) / len(precip_prob) if precip_prob else 0
                
                summary_parts.append(f"Average temperature: {avg_min:.1f}°C to {avg_max:.1f}°C")
                summary_parts.append(f"Average precipitation probability: {avg_precip:.0f}%")
                
                # Packing suggestions
                packing_suggestions = []
                if avg_max > 25:
                    packing_suggestions.append("lightweight clothing, shorts, t-shirts")
                    packing_suggestions.append("sunscreen, hat, sunglasses")
                elif avg_max < 10:
                    packing_suggestions.append("warm clothing, jacket, layers")
                    packing_suggestions.append("gloves, scarf (if very cold)")
                else:
                    packing_suggestions.append("layered clothing, light jacket")
                
                if avg_precip > 50:
                    packing_suggestions.append("umbrella, waterproof jacket")
                elif avg_precip > 30:
                    packing_suggestions.append("light rain protection")
                
                if packing_suggestions:
                    summary_parts.append(f"Packing suggestions: {', '.join(packing_suggestions)}")
            
            return "\n".join(summary_parts)
            
    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching weather: {e}")
        return f"Error fetching weather data: {str(e)}"
    except Exception as e:
        logger.error(f"Unexpected error in weather_summary: {e}")
        return f"Error processing weather request: {str(e)}"


def get_weather_forecast(location: str, start_date: str, end_date: str) -> Dict:
    """
    Get detailed weather forecast for location and date range.
    
    Args:
        location: City name with country code (e.g., "Barcelona, ES")
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
    
    Returns:
        Dictionary with weather data
    """
    city_and_dates = f"{location} | {start_date} to {end_date}"
    summary = weather_summary(city_and_dates)
    
    return {
        "summary": summary,
        "location": location,
        "startDate": start_date,
        "endDate": end_date
    }

