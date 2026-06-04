import logging
from datetime import datetime
from langchain_core.messages import SystemMessage, HumanMessage
from .state import AgentState
from .utils import get_model
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)

async def generate_brief_node(state: AgentState):
    """Generate a content brief based on top performance and trends."""
    model = get_model()
    
    top_posts = state.get("context", {}).get("top_posts", [])
    system_prompt_template = load_prompt("brief_generator_system.txt")
    
    top_posts_summary = "\n".join([f"- {p['content_text'][:100]}... (Reach: {p['total_reach']}, Engagement: {p['total_engagements']})" for p in top_posts])
    
    prompt = system_prompt_template.format(
        top_posts_summary=top_posts_summary,
        channels=", ".join(state.get("context", {}).get("target_channels", ["social"]))
    )
    
    response = await model.ainvoke([SystemMessage(content=prompt), HumanMessage(content="Generate a content brief.")])
    
    import json
    import re
    
    try:
        json_match = re.search(r'\{.*\}', response.content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            return {
                "brief": data
            }
    except Exception as e:
        logger.error(f"Error parsing brief agent response: {e}")
    
    return {
        "brief": {
            "topic": "Error",
            "reasoning": "Failed to generate brief"
        }
    }

def create_brief_gen_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("generate_brief", generate_brief_node)
    workflow.set_entry_point("generate_brief")
    workflow.add_edge("generate_brief", END)
    return workflow.compile()

content_brief_agent = create_brief_gen_graph()
