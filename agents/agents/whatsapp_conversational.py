import logging
from langchain_core.messages import SystemMessage, HumanMessage
from .state import AgentState
from .utils import get_model
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)

async def analyze_whatsapp_node(state: AgentState):
    """Analyze incoming WhatsApp message and generate a response."""
    model = get_model()
    
    message = state.get("context", {}).get("message", "")
    history = state.get("context", {}).get("history", [])
    system_prompt_template = load_prompt("whatsapp_agent_system.txt")
    
    history_str = "\n".join([f"{'User' if m['direction'] == 'inbound' else 'Agent'}: {m['content']}" for m in history])
    
    prompt = system_prompt_template.format(
        history=history_str,
        message=message
    )
    
    response = await model.ainvoke([SystemMessage(content=prompt), HumanMessage(content="Process this message.")])
    
    import json
    import re
    
    try:
        json_match = re.search(r'\{.*\}', response.content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            return {
                "whatsapp_response": data
            }
    except Exception as e:
        logger.error(f"Error parsing whatsapp agent response: {e}")
    
    return {
        "whatsapp_response": {
            "response_message": "I'm sorry, I'm having trouble processing your message.",
            "intent_classification": "error",
            "sentiment": "neutral",
            "requires_human_handoff": True,
            "handoff_reason": "agent_error",
            "confidence": 0
        }
    }

def create_whatsapp_agent_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("analyze_message", analyze_whatsapp_node)
    workflow.set_entry_point("analyze_message")
    workflow.add_edge("analyze_message", END)
    return workflow.compile()

whatsapp_agent = create_whatsapp_agent_graph()
