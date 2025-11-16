from pydantic_settings import BaseSettings
from typing import Optional


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
        env_file = ".env"
        case_sensitive = True


settings = Settings()

