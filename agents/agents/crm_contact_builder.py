import logging
import json
import re
from langchain_core.messages import SystemMessage, HumanMessage
from .state import AgentState
from .utils import get_model, load_prompt
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)

async def build_contact_node(state: AgentState):
    model = get_model()
    prompt_template = load_prompt("crm_contact_builder.txt")
    
    prompt = prompt_template.format(
        lead_details=json.dumps(state.get("context", {}).get("lead_details", {})),
        existing_contacts=json.dumps(state.get("context", {}).get("existing_contacts", []))
    )
    
    response = await model.ainvoke([SystemMessage(content=prompt), HumanMessage(content="Build/Merge contact profile.")])
    
    try:
        json_match = re.search(r'\{.*\}', response.content, re.DOTALL)
        if json_match:
            return {"crm_response": json.loads(json_match.group())}
    except Exception as e:
        logger.error(f"Error parsing G1 response: {e}")
    
    return {"crm_response": {"action": "error", "reasoning": "Parse failure"}}

def create_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("build_contact", build_contact_node)
    workflow.set_entry_point("build_contact")
    workflow.add_edge("build_contact", END)
    return workflow.compile()

contact_builder_agent = create_graph()
