import logging
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from .state import AgentState
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)

from utils.db import AsyncSessionLocal

async def case_manager_node(state: AgentState):
    """Analyze inbound messages to determine if a support case should be created."""
    context = state.get("context", {})
    message = context.get("message", "")
    thread_id = context.get("thread_id", "")
    
    # Simple logic to determine if this is a support issue
    # In production, this would use a classification prompt/agent
    is_support = any(word in message.lower() for word in ["issue", "help", "broken", "error", "support"])
    
    if is_support:
        # Create a case in the DB
        async with AsyncSessionLocal() as db:
            from sqlalchemy import text
            # This is a simplified query; requires mapping thread_id to account/contact
            await db.execute(text("INSERT INTO cases (subject, description, status) VALUES (:subject, :description, 'new')"), 
                             {"subject": f"Support issue: {message[:50]}", "description": message})
            await db.commit()
            
        return {"action": "case_created", "status": "new"}
    
    return {"action": "none", "status": "none"}

def create_case_manager_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("manage_case", case_manager_node)
    workflow.set_entry_point("manage_case")
    workflow.add_edge("manage_case", END)
    return workflow.compile()

case_manager_agent = create_case_manager_graph()
