#!/usr/bin/env python3
"""
FastAPI application for LangGraph-based AI agents.
"""

import os
import logging
import json
import re
import httpx
from contextlib import asynccontextmanager
from typing import Any, Dict, Optional, List
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import text

# Configuration
from dotenv import load_dotenv

load_dotenv()

# Configure logging
LOG_LEVEL_STR = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_LEVEL = getattr(logging, LOG_LEVEL_STR, logging.INFO)

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Environment variables
AGENT_API_KEY = os.getenv("AGENT_API_KEY", "change_me")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/marketing_hub")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# ================================================================
# Database and Agent Initialization
# ================================================================

from utils.db import AsyncSessionLocal, engine
from tools.db_queries import get_top_performing_posts, get_lead_context
from agents import (
    lead_scorer_agent,
    content_brief_agent,
    whatsapp_agent,
    anomaly_diagnostics_agent,
    contact_builder_agent,
    opp_qualifier_agent,
    proposal_drafter_agent,
    nba_agent,
    retention_agent,
    case_manager_agent,
    chat_agent
)

# ... (rest of imports)


# ================================================================
# Request/Response Models
# ================================================================

class AgentResponse(BaseModel):
    crm_response: Dict[str, Any]

class CRMBuildContactRequest(BaseModel):
    lead_id: str
    lead_details: Dict[str, Any]
    existing_contacts: List[Dict[str, Any]] = Field(default_factory=list)

class CRMQualifyOppRequest(BaseModel):
    contact_id: str
    contact_profile: Dict[str, Any]
    history: List[Dict[str, Any]] = Field(default_factory=list)
    firmographics: Dict[str, Any] = Field(default_factory=dict)

class CRMDraftProposalRequest(BaseModel):
    opportunity_id: str
    opportunity_details: Dict[str, Any]
    pain_points: List[str] = Field(default_factory=list)
    products: List[Dict[str, Any]] = Field(default_factory=list)

class CRMNBARequest(BaseModel):
    contact_id: str
    contact_profile: Dict[str, Any]
    last_interaction: Dict[str, Any] = Field(default_factory=dict)
    opportunities: List[Dict[str, Any]] = Field(default_factory=list)

class CRMRetentionRequest(BaseModel):
    contact_id: str
    activity_metrics: Dict[str, Any]
    sentiment_summary: Dict[str, Any]
    rfm_segment: str

class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "Digital Marketing Hub - Agents"
    environment: str = ENVIRONMENT
    version: str = "0.1.0"

class LeadScoringRequest(BaseModel):
    lead_id: str = Field(..., description="UUID of the lead to score")
    email: str = Field(..., description="Lead email")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    source_channel: str = Field(..., description="Social platform lead came from")
    interaction_history: List[str] = Field(default_factory=list)
    content_interests: List[str] = Field(default_factory=list)

class LeadScoringResponse(BaseModel):
    lead_id: str
    score: float = Field(..., ge=0, le=100, description="Lead score (0-100)")
    stage: str = Field(..., description="Lead stage classification")
    reasoning: str
    recommended_action: str
    confidence: float = Field(..., ge=0, le=1)

class ContentBriefRequest(BaseModel):
    lookback_days: int = Field(default=30, ge=7, le=90)
    target_channels: List[str] = Field(default_factory=lambda: ["facebook", "instagram", "tiktok"])
    force_topic: Optional[str] = None

class ContentBriefResponse(BaseModel):
    topic: str
    hook: str
    content_format: str
    target_channels: List[str]
    call_to_action: str
    estimated_performance_band: str
    reasoning: str
    generated_at: str

class WhatsAppMessageRequest(BaseModel):
    thread_id: str = Field(..., description="WhatsApp conversation thread ID")
    message: str = Field(..., description="Incoming message text")
    sender_phone: str
    lead_id: Optional[str] = None

class WhatsAppMessageResponse(BaseModel):
    thread_id: str
    response_message: Optional[str] = None
    intent_classification: str
    sentiment: str
    requires_human_handoff: bool
    handoff_reason: Optional[str] = None
    confidence: float

class AnomalyDiagnosticsRequest(BaseModel):
    channel_id: str
    anomaly_type: str
    metric_name: str
    expected_value: float
    actual_value: float
    lookback_days: int = Field(default=30)

class AnomalyDiagnosticsResponse(BaseModel):
    channel_id: str
    anomaly_type: str
    diagnostic_summary: str
    root_cause_hypothesis: str
    recommended_actions: List[str]
    severity: str
    confidence: float

# ================================================================
# Authentication
# ================================================================

def verify_api_key(x_api_key: str = Header(...)) -> str:
    """Verify incoming API key matches configured key."""
    if x_api_key != AGENT_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    return x_api_key

# ================================================================
# FastAPI Application Setup
# ================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info(f"Starting Digital Marketing Hub Agents Service (env: {ENVIRONMENT})")
    yield
    await engine.dispose()
    logger.info("Shutting down agents service")

app = FastAPI(
    title="Digital Marketing Hub - AI Agents",
    description="LangGraph-based agents for marketing automation and intelligence",
    version="0.1.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ENVIRONMENT == "development" else ["https://app.example.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================================================
# N8N Proxy Configuration
# ================================================================

# Mapping workflow IDs to their N8n webhook URLs
N8N_WEBHOOK_MAP = {
    "linkedin-ingestion": "http://marketing_hub_n8n:5678/webhook/ingest-linkedin-nightly",
    "whatsapp-opt-in": "http://marketing_hub_n8n:5678/webhook/whatsapp-opt-in-flow",
    "publish-meta": "http://marketing_hub_n8n:5678/webhook/publish-to-meta",
    "publish-linkedin": "http://marketing_hub_n8n:5678/webhook/publish-to-linkedin",
    # Add more mappings here
}

class CreatePostRequest(BaseModel):
    channel_id: str
    content: str
    scheduled_at: str

@app.post("/agents/content/create-post", tags=["content"])
async def create_post(request: CreatePostRequest, api_key: str = Depends(verify_api_key)):
    # Persist post to DB
    from utils.db import get_db
    db = get_db()
    # Assuming channel_id needs to be a UUID
    query = """
    INSERT INTO posts (channel_id, content_text, scheduled_at, status) 
    VALUES (:channel_id::uuid, :content, :scheduled_at::timestamptz, 'draft') 
    RETURNING id
    """
    result = await db.fetch_val(query, request.dict())
    return {"status": "success", "post_id": result}

@app.post("/agents/content/approve-post", tags=["content"])
async def approve_post(request: Dict[str, Any], api_key: str = Depends(verify_api_key)):
    # request should contain { post_id: uuid, status: 'approved' | 'rejected' }
    post_id = request.get("post_id")
    status = request.get("status")
    
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    from utils.db import get_db
    db = get_db()
    
    query = "UPDATE posts SET approval_status = :status WHERE id = :post_id"
    await db.execute(query, {"status": status, "post_id": post_id})
    return {"status": "success"}

@app.get("/health", tags=["health"])
async def health_check() -> HealthResponse:
    return HealthResponse(environment=ENVIRONMENT)

@app.get("/status", tags=["health"])
async def status_check(api_key: str = Depends(verify_api_key)) -> Dict[str, Any]:
    return {
        "status": "operational",
        "service": "Digital Marketing Hub - Agents",
        "environment": ENVIRONMENT,
        "agents_available": ["lead_scorer", "content_brief_gen", "whatsapp_conversational", "anomaly_diagnostics", "crm_agents"],
    }

@app.post("/agents/crm/build-contact", response_model=AgentResponse, tags=["crm"])
async def build_contact(request: CRMBuildContactRequest, api_key: str = Depends(verify_api_key)):
    result = await contact_builder_agent.ainvoke({"context": request.dict()})
    return AgentResponse(crm_response=result["crm_response"])

@app.post("/agents/crm/qualify-opportunity", response_model=AgentResponse, tags=["crm"])
async def qualify_opp(request: CRMQualifyOppRequest, api_key: str = Depends(verify_api_key)):
    result = await opp_qualifier_agent.ainvoke({"context": request.dict()})
    return AgentResponse(crm_response=result["crm_response"])

@app.post("/agents/crm/draft-proposal", response_model=AgentResponse, tags=["crm"])
async def draft_proposal(request: CRMDraftProposalRequest, api_key: str = Depends(verify_api_key)):
    result = await proposal_drafter_agent.ainvoke({"context": request.dict()})
    return AgentResponse(crm_response=result["crm_response"])

@app.post("/agents/crm/next-best-action", response_model=AgentResponse, tags=["crm"])
async def get_nba(request: CRMNBARequest, api_key: str = Depends(verify_api_key)):
    result = await nba_agent.ainvoke({"context": request.dict()})
    return AgentResponse(crm_response=result["crm_response"])

@app.post("/agents/crm/retention-check", response_model=AgentResponse, tags=["crm"])
async def retention_check(request: CRMRetentionRequest, api_key: str = Depends(verify_api_key)):
    result = await retention_agent.ainvoke({"context": request.dict()})
    return AgentResponse(crm_response=result["crm_response"])

@app.post("/agents/score-lead", response_model=LeadScoringResponse, tags=["marketing"])
async def score_lead(request: LeadScoringRequest, api_key: str = Depends(verify_api_key)):
    async with AsyncSessionLocal() as db:
        lead_data = await get_lead_context(db, request.lead_id)
        context = {
            "source_channel": lead_data.get("source_channel", request.source_channel),
            "interaction_history": lead_data.get("interaction_history", request.interaction_history),
            "content_interests": lead_data.get("content_interests", request.content_interests)
        }
        result = await lead_scorer_agent.ainvoke({
            "lead_id": request.lead_id,
            "email": lead_data.get("email", request.email),
            "context": context
        })
        result["lead_id"] = request.lead_id
        return LeadScoringResponse(**result)

@app.post("/agents/generate-brief", response_model=ContentBriefResponse, tags=["marketing"])
async def generate_content_brief(request: ContentBriefRequest, api_key: str = Depends(verify_api_key)):
    async with AsyncSessionLocal() as db:
        top_posts = await get_top_performing_posts(db, limit=10)
        context = {"top_posts": top_posts, "target_channels": request.target_channels}
        result = await content_brief_agent.ainvoke({"context": context})
        brief = result["brief"]
        return ContentBriefResponse(**brief, generated_at=datetime.utcnow().isoformat())

@app.post("/agents/whatsapp-message", response_model=WhatsAppMessageResponse, tags=["marketing"])
async def process_whatsapp_message(request: WhatsAppMessageRequest, api_key: str = Depends(verify_api_key)):
    async with AsyncSessionLocal() as db:
        query = text("""
            SELECT direction, content 
            FROM whatsapp_messages wm
            JOIN whatsapp_conversations wc ON wm.conversation_id = wc.id
            WHERE wc.thread_id = :thread_id
            ORDER BY wm.created_at DESC LIMIT 10
        """)
        result = await db.execute(query, {"thread_id": request.thread_id})
        history = [dict(row._mapping) for row in result]
        history.reverse()
        result = await whatsapp_agent.ainvoke({"context": {"message": request.message, "history": history}})
        return WhatsAppMessageResponse(**result["whatsapp_response"], thread_id=request.thread_id)

@app.post("/agents/diagnose-anomaly", response_model=AnomalyDiagnosticsResponse, tags=["marketing"])
async def diagnose_anomaly(request: AnomalyDiagnosticsRequest, api_key: str = Depends(verify_api_key)):
    context = {"anomaly": request.dict()}
    result = await anomaly_diagnostics_agent.ainvoke({"context": context})
    return AnomalyDiagnosticsResponse(**result["diagnostic"], channel_id=request.channel_id, anomaly_type=request.anomaly_type)

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=ENVIRONMENT == "development")

@app.post("/agents/crm/chat", response_model=AgentResponse, tags=["crm"])
async def chat_with_agent(request: Dict[str, Any], api_key: str = Depends(verify_api_key)):
    result = await chat_agent.ainvoke({"context": request})
    return AgentResponse(crm_response=result)
