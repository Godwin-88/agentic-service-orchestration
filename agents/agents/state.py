from typing import Annotated, Sequence, TypedDict, Union
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END
import operator

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    lead_id: str
    context: dict
    score: float
    stage: str
    reasoning: str
    recommended_action: str
    confidence: float
