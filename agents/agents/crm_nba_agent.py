import logging
import json
import re
from langchain_core.messages import SystemMessage, HumanMessage
from .state import AgentState
from .utils import get_model, load_prompt
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)

async def nba_node(state: AgentState):
    model = get_model()
    prompt_template = load_prompt("crm_nba_agent.txt")
    
    prompt = prompt_template.format(
        contact_profile=json.dumps(state.get("context", {}).get("contact_profile", {})),
        last_interaction=json.dumps(state.get("context", {}).get("last_interaction", {})),
        opportunities=json.dumps(state.get("context", {}).get("opportunities", []))
    )
    
    response = await model.ainvoke([SystemMessage(content=prompt), HumanMessage(content="Determine next best action.")])
    
    try:
        json_match = re.search(r'\{.*\}', response.content, re.DOTALL)
        if json_match:
            return {"crm_response": json.loads(json_match.group())}
    except Exception as e:
        logger.error(f"Error parsing I1 response: {e}")
    
    return {"crm_response": {"action_type": "none", "reasoning": "Parse failure"}}

def create_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("nba", nba_node)
    workflow.set_entry_point("nba")
    workflow.add_edge("nba", END)
    return workflow.compile()

nba_agent = create_graph()
