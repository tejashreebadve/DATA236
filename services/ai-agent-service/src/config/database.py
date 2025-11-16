from pymongo import MongoClient
from src.config.settings import settings
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Synchronous client for initial connection check
client: Optional[MongoClient] = None
database = None


def connect_to_mongo():
    """Create database connection"""
    global client, database
    try:
        client = MongoClient(settings.MONGODB_URI)
        database = client.get_database()
        # Test connection
        client.admin.command('ping')
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise


def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")


def get_database():
    """Get database instance"""
    return database

