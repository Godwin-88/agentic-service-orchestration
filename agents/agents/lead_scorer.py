import logging
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage
from .state import AgentState
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)

from utils.db import AsyncSessionLocal
from tools.db_queries import create_task, create_lead_note
from .utils import get_model, load_prompt

async def score_lead_node(state: AgentState):
    """Analyze lead data and interaction history to produce a score."""
    model = get_model()

    context = state.get("context", {})
    history = context.get("interaction_history", [])
    interests = context.get("content_interests", [])
    lead_id = state.get("lead_id")

    system_prompt_template = load_prompt("lead_scorer_system.txt")

    prompt = system_prompt_template.format(
        email=state.get("email", "unknown"),
        source=context.get("source_channel", "unknown"),
        history=", ".join(history),
        interests=", ".join(interests)
    )

    
    response = await model.ainvoke([SystemMessage(content=prompt), HumanMessage(content="Score this lead.")])
    
    import json
    import re
    
    try:
        json_match = re.search(r'\{.*\}', response.content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            score = data.get("score", 0)
            
            # Agentic CRM Action: If score is high, create a task and a note
            if score > 70 and lead_id:
                async with AsyncSessionLocal() as db:
                    await create_task(
                        db, 
                        lead_id, 
                        title=f"High Priority Follow-up: {state.get('email')}",
                        description=f"AI Scored as {data.get('stage')} ({score}). Reasoning: {data.get('reasoning')}",
                        task_type="call",
                        priority="high"
                    )
                    await create_lead_note(
                        db,
                        lead_id,
                        content=f"AI Agent classified lead as {data.get('stage')} with score {score}. Recommended action: {data.get('recommended_action')}"
                    )

            return {
                "score": score,
                "stage": data.get("stage", "cold"),
                "reasoning": data.get("reasoning", ""),
                "recommended_action": data.get("recommended_action", ""),
                "confidence": data.get("confidence", 0.5)
            }
    except Exception as e:
        logger.error(f"Error parsing agent response: {e}")
    
    return {
        "score": 0,
        "stage": "error",
        "reasoning": "Failed to parse agent output",
        "recommended_action": "manual_review",
        "confidence": 0
    }

def create_lead_scorer_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("score_lead", score_lead_node)
    
    workflow.set_entry_point("score_lead")
    workflow.add_edge("score_lead", END)
    
    return workflow.compile()

lead_scorer_agent = create_lead_scorer_graph()
