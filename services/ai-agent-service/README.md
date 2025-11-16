# TripMate AI Agent Service

AI-powered travel concierge agent for RedNest that generates personalized itineraries, activity recommendations, restaurant suggestions, and packing checklists.

## Setup Instructions

### 1. API Keys Configuration

You need to add your API keys to the `.env` file in the root directory (where docker-compose.yml is located).

**Create or update `.env` file in `/Users/deva/DATA236/`:**

```env
# Anthropic API Key
# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Tavily API Key  
# Get from: https://tavily.com/
TAVILY_API_KEY=tvly-your-key-here

# Note: Weather API uses open-meteo.com (free, no key needed)
```

### 2. How to Get API Keys

#### Anthropic API Key
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

#### Tavily API Key
1. Go to https://tavily.com/
2. Sign up for an account
3. Navigate to API section
4. Create a new API key
5. Copy the key (starts with `tvly-`)

#### Weather API
**No API key needed!** We use open-meteo.com which is completely free and doesn't require registration.

### 3. Running the Service

The service will be automatically started when you run:

```bash
docker-compose up -d --build
```

Or to build just this service:

```bash
docker-compose build ai-agent-service
docker-compose up -d ai-agent-service
```

### 4. Testing the Service

Once running, test the health endpoint:

```bash
curl http://localhost:3006/health
```

Or visit in browser: http://localhost:3006

### 5. API Documentation

Once the service is running, visit:
- Swagger UI: http://localhost:3006/docs
- ReDoc: http://localhost:3006/redoc

## Service Endpoints

### GET `/api/ai-agent/bookings/{traveler_id}`
Get upcoming bookings (accepted and pending) for a traveler

### POST `/api/ai-agent/generate-itinerary`
Generate itinerary for a booking or manual input

### POST `/api/ai-agent/chat`
General chat endpoint for questions

## Development

### Local Development (without Docker)

1. Create virtual environment:
```bash
cd services/ai-agent-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file in `services/ai-agent-service/`:
```env
PORT=3006
MONGODB_URI=your-mongodb-uri
ANTHROPIC_API_KEY=your-key
TAVILY_API_KEY=your-key
OPENWEATHER_API_KEY=your-key
BOOKING_SERVICE_URL=http://localhost:3005
PROPERTY_SERVICE_URL=http://localhost:3004
TRAVELER_SERVICE_URL=http://localhost:3002
CORS_ORIGIN=http://localhost:3000
```

4. Run the service:
```bash
uvicorn src.main:app --reload --port 3006
```

## Project Structure

```
services/ai-agent-service/
├── Dockerfile
├── requirements.txt
├── README.md
├── .env.template
└── src/
    ├── main.py
    ├── config/
    │   ├── settings.py
    │   └── database.py
    ├── models/
    │   └── itinerary.py
    ├── agents/
    │   ├── trip_agent.py (Phase 2)
    │   └── tools/ (Phase 2)
    ├── services/
    │   ├── booking_service.py
    │   └── property_service.py
    ├── controllers/
    │   └── agent_controller.py
    └── routes/
        └── agent_routes.py
```

## Current Status

✅ **Phase 1 Complete**: Service setup, Docker configuration, basic endpoints
⏳ **Phase 2**: LangChain integration with AI agent logic
⏳ **Phase 3**: Frontend integration

