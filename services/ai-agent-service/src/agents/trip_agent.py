from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import Tool
from langchain_core.messages import HumanMessage, AIMessage
from src.config.settings import settings
from src.agents.tools.tavily_search import get_tavily_tool
from src.agents.tools.weather_tool import weather_summary, get_weather_forecast
from typing import Dict, List, Optional
import logging
import json

logger = logging.getLogger(__name__)


class TripAgent:
    """
    LangChain agent for generating travel itineraries
    """
    
    def __init__(self):
        """Initialize the agent with LLM and tools"""
        self.llm = ChatAnthropic(
            model="claude-3-5-haiku-20241022",
            temperature=0.7,
            api_key=settings.ANTHROPIC_API_KEY,
            max_tokens=4096
        )
        
        # Initialize tools
        self.tavily_tool = get_tavily_tool()
        
        # Create weather tool for LangChain
        self.weather_tool = Tool(
            name="get_weather_forecast",
            description="Get weather forecast and packing suggestions for a city and date range. Input format: 'City, CountryCode | YYYY-MM-DD to YYYY-MM-DD'",
            func=weather_summary
        )
        
        # Combine all tools
        self.tools = [self.tavily_tool, self.weather_tool]
        
        # Create agent prompt (tool calling format for LangChain 0.2.x with Claude)
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are TripMate, an expert travel concierge AI assistant for RedNest. 
Your role is to help travelers plan amazing trips by creating detailed, personalized itineraries.

When creating an itinerary, consider:
1. User preferences (budget, interests, dietary needs, mobility requirements, family-friendly)
2. Location context (city, country, local culture)
3. Travel dates and duration
4. Number of guests
5. Weather conditions for the travel dates
6. Local attractions, restaurants, and events

You have access to:
- Web search (Tavily) for finding current information about attractions, restaurants, events
- Weather forecast tool for packing suggestions

Always provide:
- Day-by-day itinerary (morning, afternoon, evening blocks)
- Activity recommendations with addresses, prices, duration, accessibility info
- Restaurant recommendations filtered by dietary needs
- Weather-aware packing checklist

Be specific, practical, and considerate of user preferences. Format your responses as structured JSON when generating itineraries.

Use the available tools to gather information before creating the itinerary."""),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Create agent using tool calling pattern (works with Claude)
        self.agent = create_tool_calling_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self.prompt
        )
        
        # Create agent executor
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            max_iterations=10,
            handle_parsing_errors=True
        )
    
    def extract_preferences(self, natural_language_input: str) -> Dict:
        """
        Extract structured preferences from natural language input
        """
        extraction_prompt = f"""Extract travel preferences from this user input: "{natural_language_input}"

Return a JSON object with these fields:
- budget: "low" | "medium" | "high" | "luxury" (or null if not specified)
- interests: array of strings like ["adventure", "culture", "food", "nature", "shopping", "nightlife"]
- mobilityNeeds: "none" | "wheelchair" | "limited" (or null if not specified)
- dietaryFilters: array of strings like ["vegan", "vegetarian", "gluten-free", "halal", "kosher"]
- familyFriendly: boolean (true if mentions kids, children, family)

Only include fields that are explicitly mentioned or clearly implied. Return valid JSON only."""

        try:
            response = self.llm.invoke([HumanMessage(content=extraction_prompt)])
            content = response.content.strip()
            
            # Try to extract JSON from response
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0].strip()
            else:
                json_str = content
            
            preferences = json.loads(json_str)
            return preferences
        except Exception as e:
            logger.error(f"Error extracting preferences: {e}")
            # Return default preferences
            return {
                "budget": None,
                "interests": [],
                "mobilityNeeds": None,
                "dietaryFilters": [],
                "familyFriendly": False
            }
    
    async def generate_itinerary(
        self,
        location: str,
        start_date: str,
        end_date: str,
        guests: int,
        preferences: Dict,
        booking_context: Optional[Dict] = None
    ) -> Dict:
        """
        Generate a complete itinerary using the agent
        """
        try:
            # Build context for the agent
            context_parts = [
                f"Location: {location}",
                f"Travel dates: {start_date} to {end_date}",
                f"Number of guests: {guests}",
            ]
            
            if preferences.get("budget"):
                context_parts.append(f"Budget: {preferences['budget']}")
            if preferences.get("interests"):
                context_parts.append(f"Interests: {', '.join(preferences['interests'])}")
            if preferences.get("dietaryFilters"):
                context_parts.append(f"Dietary needs: {', '.join(preferences['dietaryFilters'])}")
            if preferences.get("mobilityNeeds"):
                context_parts.append(f"Mobility needs: {preferences['mobilityNeeds']}")
            if preferences.get("familyFriendly"):
                context_parts.append("Family-friendly: Yes")
            
            context = "\n".join(context_parts)
            
            # Create agent prompt
            agent_input = f"""Create a detailed day-by-day travel itinerary with the following requirements:

{context}

Please provide:
1. A day-by-day plan with morning, afternoon, and evening activities
2. For each activity: title, address, price tier (low/medium/high/luxury), duration, tags, wheelchair accessibility, child-friendliness
3. Restaurant recommendations filtered by dietary needs
4. Weather-aware packing checklist

Use web search to find current information about:
- Top attractions in {location}
- Best restaurants (considering dietary filters)
- Local events during {start_date} to {end_date}
- Weather patterns

Format your response as a detailed JSON structure matching this schema:
{{
  "days": [
    {{
      "date": "YYYY-MM-DD",
      "morning": {{
        "activities": [
          {{
            "title": "...",
            "address": "...",
            "priceTier": "medium",
            "duration": "2-3 hours",
            "tags": ["culture", "architecture"],
            "wheelchairAccessible": true,
            "childFriendly": true,
            "description": "..."
          }}
        ]
      }},
      "afternoon": {{"activities": []}},
      "evening": {{"activities": []}}
    }}
  ],
  "restaurants": [
    {{
      "name": "...",
      "address": "...",
      "cuisine": "...",
      "priceTier": "high",
      "dietaryOptions": ["vegan", "vegetarian"],
      "rating": 4.5,
      "description": "..."
    }}
  ],
  "packingChecklist": [
    {{
      "category": "Clothing",
      "items": ["..."],
      "weatherBased": true
    }}
  ]
}}"""

            # Execute agent
            result = await self.agent_executor.ainvoke({
                "input": agent_input,
                "chat_history": []
            })
            
            # Parse response
            response_text = result.get("output", "")
            
            # Try to extract JSON from response
            itinerary_json = self._extract_json_from_response(response_text)
            
            # Get weather forecast
            weather_data = get_weather_forecast(location, start_date, end_date)
            
            return {
                "itinerary": itinerary_json,
                "metadata": {
                    "location": location,
                    "dates": {
                        "start": start_date,
                        "end": end_date
                    },
                    "weatherForecast": weather_data
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating itinerary: {e}", exc_info=True)
            raise
    
    def _extract_json_from_response(self, response_text: str) -> Dict:
        """
        Extract JSON from agent response (may be wrapped in markdown or text)
        """
        try:
            # Try to find JSON in the response
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0].strip()
            else:
                # Try to find JSON object in the text
                start_idx = response_text.find("{")
                end_idx = response_text.rfind("}") + 1
                if start_idx >= 0 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                else:
                    json_str = response_text
            
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON from response: {e}")
            logger.error(f"Response text: {response_text[:500]}")
            # Return empty structure
            return {
                "days": [],
                "restaurants": [],
                "packingChecklist": []
            }
    
    async def chat(self, message: str, context: Optional[Dict] = None) -> Dict:
        """
        Handle general chat queries
        """
        try:
            result = await self.agent_executor.ainvoke({
                "input": message,
                "chat_history": []
            })
            
            output = result.get("output", "")
            
            # Handle different output formats from LangChain
            # LangChain 0.2.x returns AIMessage objects or content blocks
            if isinstance(output, list):
                # Extract text from content blocks (LangChain message format)
                text_parts = []
                for item in output:
                    if isinstance(item, dict):
                        # Check for different possible formats
                        if "text" in item:
                            text_parts.append(item["text"])
                        elif "content" in item:
                            text_parts.append(item["content"])
                        else:
                            # Try to convert the whole dict to string
                            text_parts.append(str(item))
                    elif hasattr(item, "content"):
                        # AIMessage object
                        text_parts.append(item.content)
                    else:
                        text_parts.append(str(item))
                response_text = " ".join(text_parts).strip()
            elif hasattr(output, "content"):
                # AIMessage object directly
                response_text = output.content
            elif isinstance(output, dict):
                # If it's a dict, try to get text or convert to string
                response_text = output.get("text", output.get("content", str(output)))
            else:
                # It's already a string
                response_text = str(output) if output else "I apologize, but I couldn't generate a response."
            
            # Ensure we have a valid string
            if not response_text or not isinstance(response_text, str):
                response_text = "I apologize, but I couldn't generate a response."
            
            # Try to extract sources if Tavily was used
            sources = []
            # Note: Tavily tool results are in agent_scratchpad, but for simplicity
            # we'll just return the response. In production, you'd extract sources from scratchpad.
            
            return {
                "response": response_text,
                "sources": sources if sources else None
            }
        except Exception as e:
            logger.error(f"Error in chat: {e}", exc_info=True)
            # Return a safe error response
            return {
                "response": f"I apologize, but I encountered an error: {str(e)}",
                "sources": None
            }

