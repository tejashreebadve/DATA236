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
        
        # Create weather tool wrapper that handles LangChain's argument format
        def weather_tool_wrapper(input_str):
            """Wrapper to handle LangChain's tool calling format"""
            # Handle different input formats from LangChain
            if isinstance(input_str, list):
                # If it's a list, take the first element
                input_str = input_str[0] if input_str else ""
            elif isinstance(input_str, dict):
                # If it's a dict, try to extract the string value
                input_str = input_str.get("input", input_str.get("query", str(input_str)))
            # Ensure it's a string
            input_str = str(input_str) if input_str else ""
            return weather_summary(input_str)
        
        # Create weather tool for LangChain
        self.weather_tool = Tool(
            name="get_weather_forecast",
            description="""Get weather forecast and packing suggestions for a city and date range. 
            Input should be a single string in the format: 'City, CountryCode | YYYY-MM-DD to YYYY-MM-DD'
            Example: 'Chicago, US | 2025-11-27 to 2025-11-29'""",
            func=weather_tool_wrapper
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
            # Build context for the agent with enhanced location information
            # Ensure location is clear and unambiguous
            location_context = location
            if location and ',' in location:
                # Location already formatted, use as-is
                location_context = location
            else:
                # If location is just a city name, add context
                location_context = f"{location} (verify country if ambiguous)"
            
            context_parts = [
                f"Location: {location_context}",
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
            
            # Enhance location in prompt to handle ambiguity
            location_prompt = location
            if ',' in location:
                parts = [p.strip() for p in location.split(',')]
                if len(parts) >= 2:
                    city = parts[0]
                    country = parts[-1]
                    # Add clarification for known ambiguous cases
                    indian_cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat']
                    if city in indian_cities and country not in ['India', 'IN']:
                        location_prompt = f"{city}, India (IMPORTANT: {city} is in India, not {country}. Use India as the country.)"
                    else:
                        location_prompt = location
            
            # Create agent prompt
            agent_input = f"""Create a detailed day-by-day travel itinerary with the following requirements:

{context}

IMPORTANT LOCATION NOTE: If the location seems ambiguous (e.g., a city name doesn't match the country provided), use your knowledge to determine the correct location. For example:
- Mumbai, Delhi, Pune, Bangalore, Hyderabad, Chennai, Kolkata are cities in India
- If you see "Mumbai, United States" or similar, the correct location is "Mumbai, India"
- Always verify the country matches the city based on your knowledge

Please provide:
1. A day-by-day plan with morning, afternoon, and evening activities
2. For each activity: title, address, price tier (low/medium/high/luxury), duration, tags, wheelchair accessibility, child-friendliness
3. Restaurant recommendations filtered by dietary needs
4. Weather-aware packing checklist

Use web search to find current information about:
- Top attractions in {location_prompt}
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
            
            # Parse response - handle different output formats from LangChain
            output = result.get("output", "")
            
            logger.info(f"Raw output type: {type(output)}, value preview: {str(output)[:200] if output else 'None'}")
            
            # Convert output to string if it's a list (LangChain message format)
            if isinstance(output, list):
                # Extract text from content blocks
                text_parts = []
                for item in output:
                    if isinstance(item, dict):
                        if "text" in item:
                            text_value = item["text"]
                            # Handle case where text itself might be a list
                            if isinstance(text_value, list):
                                text_parts.append(" ".join(str(t) for t in text_value))
                            else:
                                text_parts.append(str(text_value))
                        elif "content" in item:
                            content_value = item["content"]
                            if isinstance(content_value, list):
                                text_parts.append(" ".join(str(c) for c in content_value))
                            else:
                                text_parts.append(str(content_value))
                        else:
                            text_parts.append(str(item))
                    elif hasattr(item, "content"):
                        # AIMessage object
                        content = item.content
                        if isinstance(content, list):
                            text_parts.append(" ".join(str(c) for c in content))
                        else:
                            text_parts.append(str(content))
                    else:
                        text_parts.append(str(item))
                response_text = " ".join(text_parts).strip()
            elif hasattr(output, "content"):
                # AIMessage object directly
                content = output.content
                if isinstance(content, list):
                    response_text = " ".join(str(c) for c in content).strip()
                else:
                    response_text = str(content) if content else ""
            elif isinstance(output, dict):
                # If it's a dict, try to get text or convert to string
                text_or_content = output.get("text", output.get("content", str(output)))
                if isinstance(text_or_content, list):
                    response_text = " ".join(str(t) for t in text_or_content).strip()
                else:
                    response_text = str(text_or_content)
            else:
                # It's already a string (or convert to string to be safe)
                response_text = str(output) if output else ""
            
            # Final safety check - ensure response_text is definitely a string
            if not isinstance(response_text, str):
                logger.error(f"response_text is still not a string after conversion! type: {type(response_text)}, value: {response_text}")
                # Force conversion
                if isinstance(response_text, list):
                    response_text = " ".join(str(item) for item in response_text).strip()
                else:
                    response_text = str(response_text)
            
            logger.info(f"Final response_text type: {type(response_text)}, length: {len(response_text) if isinstance(response_text, str) else 'N/A'}")
            
            # Normalize date formats to YYYY-MM-DD for weather API
            from datetime import datetime
            def normalize_date(date_str):
                """Convert ISO date string to YYYY-MM-DD format"""
                if not date_str:
                    return None
                try:
                    if isinstance(date_str, str) and 'T' in date_str:
                        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        return dt.strftime('%Y-%m-%d')
                    elif isinstance(date_str, str) and len(date_str) == 10:
                        return date_str
                    else:
                        return str(date_str)[:10]
                except:
                    return str(date_str)[:10] if date_str else None
            
            start_date_normalized = normalize_date(start_date)
            end_date_normalized = normalize_date(end_date)
            
            # Try to extract JSON from response
            logger.info(f"Attempting to extract JSON from response_text (first 500 chars): {response_text[:500]}")
            itinerary_json = self._extract_json_from_response(response_text)
            logger.info(f"Extracted itinerary_json keys: {list(itinerary_json.keys()) if isinstance(itinerary_json, dict) else 'Not a dict'}")
            
            # Get weather forecast (use normalized dates)
            weather_data = get_weather_forecast(location, start_date_normalized or start_date, end_date_normalized or end_date)
            
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
            # Ensure response_text is a string
            if not isinstance(response_text, str):
                logger.warning(f"response_text is not a string in _extract_json_from_response, type: {type(response_text)}")
                response_text = str(response_text)
            
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
            
            # Clean up common JSON issues from LLM output
            import re
            # Fix unquoted numeric values with temperature units
            # The issue: "high": 48°F, needs to become "high": "48°F",
            # First, let's find and fix temperature values more aggressively
            # Pattern: Match any number followed by any degree symbol (various Unicode) and F/C
            # Match: colon, whitespace, number, degree symbol (any variant), F or C, then comma or closing brace
            # Use a more permissive pattern that handles various degree symbols
            degree_symbols = r'[°º\u00B0\u02DA\u2218]'  # Various degree symbol Unicode variants
            json_str = re.sub(
                rf':\s*(\d+(?:\.\d+)?)({degree_symbols})([CF])(?=\s*[,}}])',
                r': "\1\2\3"',
                json_str,
                flags=re.UNICODE
            )
            # Also handle cases without degree symbol: numberF or numberC
            json_str = re.sub(
                r':\s*(\d+(?:\.\d+)?)([CF])(?=\s*[,}])',
                r': "\1\2"',
                json_str
            )
            
            # Log cleaned JSON for debugging
            logger.info(f"Cleaned JSON (first 1000 chars): {json_str[:1000]}")
            # Check if temperature values are still unquoted (check for pattern without quotes)
            if re.search(r':\s*\d+[°º\u00B0\u02DA\u2218]?[CF](?=\s*[,}])', json_str):
                logger.warning(f"Temperature values may still be unquoted! Checking snippet: {json_str[200:600]}")
            
            # Try to parse JSON
            try:
                parsed = json.loads(json_str)
                
                # Map LLM output structure to our expected structure
                # LLM might return different keys, so we need to map them
                result = {
                    "days": [],
                    "restaurants": [],
                    "packingChecklist": []
                }
                
                # Extract days if present
                if "days" in parsed:
                    result["days"] = parsed["days"]
                elif "itinerary" in parsed and "days" in parsed["itinerary"]:
                    result["days"] = parsed["itinerary"]["days"]
                
                # Extract restaurants if present
                if "restaurants" in parsed:
                    result["restaurants"] = parsed["restaurants"]
                elif "itinerary" in parsed and "restaurants" in parsed["itinerary"]:
                    result["restaurants"] = parsed["itinerary"]["restaurants"]
                
                # Extract packing checklist if present
                if "packingChecklist" in parsed:
                    result["packingChecklist"] = parsed["packingChecklist"]
                elif "packing" in parsed:
                    result["packingChecklist"] = parsed["packing"]
                elif "itinerary" in parsed and "packingChecklist" in parsed["itinerary"]:
                    result["packingChecklist"] = parsed["itinerary"]["packingChecklist"]
                
                # Validate and fix packing checklist items - ensure all have 'items' field
                if result.get("packingChecklist"):
                    fixed_packing = []
                    for item in result["packingChecklist"]:
                        if isinstance(item, dict):
                            # Ensure 'items' field exists and is a list
                            if "items" not in item or not isinstance(item.get("items"), list):
                                item["items"] = item.get("items", []) if isinstance(item.get("items"), list) else []
                            # Ensure 'category' exists
                            if "category" not in item:
                                item["category"] = item.get("category", "General")
                            fixed_packing.append(item)
                        else:
                            # Skip invalid items
                            logger.warning(f"Skipping invalid packing checklist item: {item}")
                    result["packingChecklist"] = fixed_packing
                
                return result
                
            except json.JSONDecodeError as parse_error:
                logger.warning(f"JSON parse error after cleanup, trying to fix: {parse_error}")
                logger.warning(f"Problematic JSON snippet (around error): {json_str[max(0, parse_error.pos-100):parse_error.pos+100]}")
                
                # Try a more aggressive cleanup
                # Remove any text before first { and after last }
                start = json_str.find('{')
                end = json_str.rfind('}') + 1
                if start >= 0 and end > start:
                    json_str = json_str[start:end]
                
                # Fix common issues: trailing commas, etc.
                import re
                # Remove trailing commas before closing braces/brackets
                json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
                # Fix single quotes to double quotes (but be careful with already-quoted strings)
                # Only replace single quotes that are not inside double-quoted strings
                # Simple approach: replace single quotes around keys/values that look like they should be double-quoted
                json_str = re.sub(r"'([^']+)':", r'"\1":', json_str)  # Fix keys
                json_str = re.sub(r':\s*\'([^\']+)\'', r': "\1"', json_str)  # Fix string values
                
                # Try parsing again
                try:
                    parsed = json.loads(json_str)
                    # Map structure as above
                    result = {
                        "days": parsed.get("days", []),
                        "restaurants": parsed.get("restaurants", []),
                        "packingChecklist": parsed.get("packingChecklist", [])
                    }
                    
                    # Validate and fix packing checklist items
                    if result.get("packingChecklist"):
                        fixed_packing = []
                        for item in result["packingChecklist"]:
                            if isinstance(item, dict):
                                if "items" not in item or not isinstance(item.get("items"), list):
                                    item["items"] = []
                                if "category" not in item:
                                    item["category"] = "General"
                                fixed_packing.append(item)
                        result["packingChecklist"] = fixed_packing
                    
                    logger.info(f"Successfully parsed JSON after aggressive cleanup: {len(result['days'])} days, {len(result.get('packingChecklist', []))} packing items")
                    return result
                except json.JSONDecodeError as e2:
                    logger.error(f"Failed to parse JSON even after aggressive cleanup: {e2}")
                    logger.error(f"JSON string (first 2000 chars): {json_str[:2000]}")
                    # Try using json5 or a more lenient parser as last resort
                    # For now, try to extract just the days array manually
                    try:
                        # Look for "days": [ pattern and extract manually
                        days_match = re.search(r'"days"\s*:\s*\[(.*?)\]', json_str, re.DOTALL)
                        if days_match:
                            logger.warning("Attempting manual extraction of days array")
                            # This is a fallback - return what we can extract
                            return {
                                "days": [],  # Will be populated if we can parse
                                "restaurants": [],
                                "packingChecklist": []
                            }
                    except:
                        pass
                    raise parse_error
                    
        except Exception as e:
            logger.error(f"Error parsing JSON from response: {e}")
            logger.error(f"Response text (first 1000 chars): {response_text[:1000]}")
            # Return empty structure with valid format
            return {
                "days": [],
                "restaurants": [],
                "packingChecklist": []  # Empty but valid list
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

