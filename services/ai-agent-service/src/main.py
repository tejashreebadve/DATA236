from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config.settings import settings
from src.config.database import connect_to_mongo, close_mongo_connection
from src.routes.agent_routes import router as agent_router
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="TripMate AI Agent Service",
    description="AI-powered travel concierge agent for RedNest",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agent_router)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting TripMate AI Agent Service...")
    try:
        connect_to_mongo()
        logger.info("Service started successfully")
    except Exception as e:
        logger.error(f"Failed to start service: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down TripMate AI Agent Service...")
    close_mongo_connection()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "TripMate AI Agent Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}

