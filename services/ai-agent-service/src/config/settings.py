from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Service Configuration
    PORT: int = 3006
    ENVIRONMENT: str = "development"
    
    # MongoDB
    MONGODB_URI: str
    
    # API Keys
    ANTHROPIC_API_KEY: str
    TAVILY_API_KEY: str
    # Note: Weather uses open-meteo.com (free, no API key required)
    
    # External Services
    BOOKING_SERVICE_URL: str = "http://booking-service:3005"
    PROPERTY_SERVICE_URL: str = "http://property-service:3004"
    TRAVELER_SERVICE_URL: str = "http://traveler-service:3002"
    
    # CORS
    CORS_ORIGIN: str = "http://localhost:3000"
    
    class Config:
        # Read from environment variables first (Docker sets these from .env file in root)
        # Environment variables take precedence over .env file
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = 'utf-8'
        # Pydantic Settings automatically reads from environment variables first


# Initialize settings
settings = Settings()

# Debug: Log if API keys are loaded (but don't log the actual keys)
logger = __import__('logging').getLogger(__name__)
if settings.ANTHROPIC_API_KEY:
    logger.info("Anthropic API key loaded (length: {})".format(len(settings.ANTHROPIC_API_KEY)))
else:
    logger.warning("Anthropic API key NOT loaded!")
    
if settings.TAVILY_API_KEY:
    logger.info("Tavily API key loaded (length: {})".format(len(settings.TAVILY_API_KEY)))
else:
    logger.warning("Tavily API key NOT loaded!")

