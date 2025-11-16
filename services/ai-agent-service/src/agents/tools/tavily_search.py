from langchain_community.tools.tavily_search import TavilySearchResults
from src.config.settings import settings
import logging
import os

logger = logging.getLogger(__name__)


def get_tavily_tool():
    """
    Initialize and return Tavily search tool for LangChain
    """
    try:
        # Set API key as environment variable (Tavily tool reads from env)
        os.environ["TAVILY_API_KEY"] = settings.TAVILY_API_KEY
        
        tool = TavilySearchResults(
            max_results=5,
            search_depth="advanced"
        )
        return tool
    except Exception as e:
        logger.error(f"Error initializing Tavily tool: {e}")
        raise


async def search_tavily(query: str, max_results: int = 5) -> list:
    """
    Search using Tavily API directly (for non-LangChain use cases)
    """
    try:
        from tavily import TavilyClient
        
        client = TavilyClient(api_key=settings.TAVILY_API_KEY)
        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=max_results
        )
        
        results = []
        for result in response.get("results", []):
            results.append({
                "title": result.get("title", ""),
                "url": result.get("url", ""),
                "content": result.get("content", ""),
                "score": result.get("score", 0)
            })
        
        return results
    except Exception as e:
        logger.error(f"Error in Tavily search: {e}")
        return []

