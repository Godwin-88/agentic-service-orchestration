import logging
from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from .state import AgentState
from langgraph.graph import StateGraph, END
from .utils import get_model as get_llm

logger = logging.getLogger(__name__)

async def chat_node(state: AgentState):
    """Reason over contact context and user query."""
    context = state.get("context", {})
    query = context.get("query", "")
    contact_data = context.get("contact_data", {})
    
    model = get_llm()
    
    prompt = f"""You are a helpful CRM assistant. Use the following context about the contact to answer the user query.
    
    Contact Context: {contact_data}
    
    User Query: {query}
    """
    
    response = await model.ainvoke([SystemMessage(content=prompt), HumanMessage(content=query)])
    
    return {"response": response.content}

def create_chat_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("chat", chat_node)
    workflow.set_entry_point("chat")
    workflow.add_edge("chat", END)
    return workflow.compile()

chat_agent = create_chat_graph()
