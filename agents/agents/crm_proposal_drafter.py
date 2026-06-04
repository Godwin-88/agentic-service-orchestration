import logging
import json
import re
from langchain_core.messages import SystemMessage, HumanMessage
from .state import AgentState
from .utils import get_model, load_prompt
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)

async def draft_proposal_node(state: AgentState):
    model = get_model()
    prompt_template = load_prompt("crm_proposal_drafter.txt")
    
    prompt = prompt_template.format(
        opportunity_details=json.dumps(state.get("context", {}).get("opportunity_details", {})),
        pain_points=json.dumps(state.get("context", {}).get("pain_points", [])),
        products=json.dumps(state.get("context", {}).get("products", []))
    )
    
    response = await model.ainvoke([SystemMessage(content=prompt), HumanMessage(content="Draft proposal.")])
    
    try:
        json_match = re.search(r'\{.*\}', response.content, re.DOTALL)
        if json_match:
            return {"crm_response": json.loads(json_match.group())}
    except Exception as e:
        logger.error(f"Error parsing H2 response: {e}")
    
    return {"crm_response": {"sections": [], "reasoning": "Parse failure"}}

def create_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("draft_proposal", draft_proposal_node)
    workflow.set_entry_point("draft_proposal")
    workflow.add_edge("draft_proposal", END)
    return workflow.compile()

proposal_drafter_agent = create_graph()
