import logging
from langchain_core.messages import SystemMessage, HumanMessage
from .state import AgentState
from .utils import get_model
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)

async def diagnose_anomaly_node(state: AgentState):
    """Diagnose a detected anomaly and suggest actions."""
    model = get_model()
    
    anomaly = state.get("context", {}).get("anomaly", {})
    system_prompt_template = load_prompt("anomaly_diagnostics_system.txt")
    
    prompt = system_prompt_template.format(
        channel_id=anomaly.get("channel_id"),
        anomaly_type=anomaly.get("anomaly_type"),
        metric_name=anomaly.get("metric_name"),
        expected=anomaly.get("expected_value"),
        actual=anomaly.get("actual_value"),
        description=anomaly.get("anomaly_description")
    )
    
    response = await model.ainvoke([SystemMessage(content=prompt), HumanMessage(content="Diagnose this anomaly.")])
    
    import json
    import re
    
    try:
        json_match = re.search(r'\{.*\}', response.content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            return {
                "diagnostic": data
            }
    except Exception as e:
        logger.error(f"Error parsing diagnostic agent response: {e}")
    
    return {
        "diagnostic": {
            "diagnostic_summary": "Error diagnosing anomaly",
            "root_cause_hypothesis": "Unknown",
            "recommended_actions": ["Manual investigation"],
            "severity": "high",
            "confidence": 0
        }
    }

def create_anomaly_agent_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("diagnose", diagnose_anomaly_node)
    workflow.set_entry_point("diagnose")
    workflow.add_edge("diagnose", END)
    return workflow.compile()

anomaly_diagnostics_agent = create_anomaly_agent_graph()
