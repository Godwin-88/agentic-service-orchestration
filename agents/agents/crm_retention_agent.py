import logging
import json
import re
from langchain_core.messages import SystemMessage, HumanMessage
from .state import AgentState
from .utils import get_model, load_prompt
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)

async def retention_node(state: AgentState):
    model = get_model()
    prompt_template = load_prompt("crm_retention_agent.txt")
    
    prompt = prompt_template.format(
        activity_metrics=json.dumps(state.get("context", {}).get("activity_metrics", {})),
        sentiment_summary=json.dumps(state.get("context", {}).get("sentiment_summary", {})),
        rfm_segment=state.get("context", {}).get("rfm_segment", "unknown")
    )
    
    response = await model.ainvoke([SystemMessage(content=prompt), HumanMessage(content="Evaluate retention risk.")])
    
    try:
        json_match = re.search(r'\{.*\}', response.content, re.DOTALL)
        if json_match:
            return {"crm_response": json.loads(json_match.group())}
    except Exception as e:
        logger.error(f"Error parsing J1 response: {e}")
    
    return {"crm_response": {"churn_probability": 0, "reasoning": "Parse failure"}}

def create_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("retention", retention_node)
    workflow.set_entry_point("retention")
    workflow.add_edge("retention", END)
    return workflow.compile()

retention_agent = create_graph()
