import logging
import json
import re
from langchain_core.messages import SystemMessage, HumanMessage
from .state import AgentState
from .utils import get_model, load_prompt
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)

async def qualify_opp_node(state: AgentState):
    model = get_model()
    prompt_template = load_prompt("crm_opp_qualifier.txt")
    
    prompt = prompt_template.format(
        contact_profile=json.dumps(state.get("context", {}).get("contact_profile", {})),
        history=json.dumps(state.get("context", {}).get("history", [])),
        firmographics=json.dumps(state.get("context", {}).get("firmographics", {}))
    )
    
    response = await model.ainvoke([SystemMessage(content=prompt), HumanMessage(content="Qualify opportunity.")])
    
    try:
        json_match = re.search(r'\{.*\}', response.content, re.DOTALL)
        if json_match:
            return {"crm_response": json.loads(json_match.group())}
    except Exception as e:
        logger.error(f"Error parsing H1 response: {e}")
    
    return {"crm_response": {"qualified": False, "rationale": "Parse failure"}}

def create_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("qualify_opp", qualify_opp_node)
    workflow.set_entry_point("qualify_opp")
    workflow.add_edge("qualify_opp", END)
    return workflow.compile()

opp_qualifier_agent = create_graph()
