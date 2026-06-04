import os
import logging
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

logger = logging.getLogger(__name__)

def get_model(model_name: str = None):
    """
    Get an LLM model based on environment configuration.
    Supports OpenAI, Anthropic, and Groq (via OpenAI-compatible API).
    """
    provider = os.getenv("LLM_PROVIDER", "openai").lower()
    
    if provider == "groq":
        logger.info("Using Groq (OpenAI-compatible) provider")
        return ChatOpenAI(
            model=model_name or "llama-3.3-70b-versatile",
            openai_api_key=os.getenv("GROQ_API_KEY"),
            openai_api_base=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
            temperature=0
        )
    elif provider == "anthropic":
        logger.info("Using Anthropic provider")
        return ChatAnthropic(
            model=model_name or "claude-3-5-sonnet-20240620", 
            temperature=0
        )
def load_prompt(filename: str) -> str:
    """Load a prompt from the prompts directory."""
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", filename)
    try:
        with open(prompt_path, "r") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Error loading prompt {filename}: {e}")
        return ""
