from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from schemas import (
    GeneralChatRequest, GeneralChatResponse,
    AgentPlanRequest, PlanResponse
)
from chains import general_chat, plan_with_context
from db import fetch_upcoming_bookings


app = FastAPI(title="StayBnB AI Concierge (LangChain + Ollama)")

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}


# ---------- Anonymous mode ----------
@app.post("/ai/chat", response_model=GeneralChatResponse)
def ai_chat(body: GeneralChatRequest):
    """
    General open chat for non-logged-in users (web + weather search).
    """
    try:
        answer = general_chat(body.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(500, f"Agent error: {e}")


# ---------- Logged-in bookings ----------
@app.get("/ai/bookings")
def ai_bookings(user_id: int = Query(..., description="Traveler user id")):
    try:
        return {"bookings": fetch_upcoming_bookings(user_id)}
    except Exception as e:
        raise HTTPException(500, f"DB error: {e}")


# ---------- Logged-in planner ----------
@app.post("/ai/plan", response_model=PlanResponse)
def ai_plan(body: AgentPlanRequest):
    try:
        return plan_with_context(body)
    except Exception as e:
        raise HTTPException(500, f"Planner error: {e}")