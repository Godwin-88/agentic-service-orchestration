import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

async def get_lead_context(db: AsyncSession, lead_id: str) -> Dict[str, Any]:
    """Fetch lead context including source channel, interaction history, and content interests."""
    query = text("""
        SELECT
            l.id, l.email, l.first_name, l.last_name, l.source_channel,
            COALESCE(
                (SELECT array_agg(content) FROM (
                    SELECT wm.content FROM whatsapp_messages wm
                    JOIN whatsapp_conversations wc ON wm.conversation_id = wc.id
                    WHERE wc.lead_id = l.id
                    ORDER BY wm.created_at DESC
                    LIMIT 10
                ) AS recent_interactions),
                ARRAY[]::text[]
            ) AS interaction_history,
            ARRAY[]::text[] AS content_interests
        FROM leads l
        WHERE l.id = :lead_id
    """)
    result = await db.execute(query, {"lead_id": lead_id})
    row = result.fetchone()
    if row is None:
        return {}
    return dict(row._mapping)

async def get_top_performing_posts(db: AsyncSession, limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch top performing posts from the database."""
    query = text("""
        SELECT p.id, p.content_text, p.post_type, 
               SUM(pm.reach) as total_reach, 
               SUM(pm.engagements) as total_engagements
        FROM posts p
        JOIN post_metrics pm ON p.id = pm.post_id
        WHERE p.status = 'published'
        GROUP BY p.id
        ORDER BY total_engagements DESC
        LIMIT :limit
    """)
    
    result = await db.execute(query, {"limit": limit})
    return [dict(row._mapping) for row in result]

async def create_task(db: AsyncSession, lead_id: str, title: str, description: str, task_type: str = "manual_review", priority: str = "medium", assigned_to: str = None) -> str:
    """Create a task in the CRM."""
    query = text("""
        INSERT INTO tasks (lead_id, title, description, task_type, priority, assigned_to, created_by)
        VALUES (:lead_id, :title, :description, :task_type, :priority, :assigned_to, 'agent')
        RETURNING id
    """)
    
    result = await db.execute(query, {
        "lead_id": lead_id,
        "title": title,
        "description": description,
        "task_type": task_type,
        "priority": priority,
        "assigned_to": assigned_to
    })
    await db.commit()
    row = result.fetchone()
    return str(row[0]) if row else None

async def create_lead_note(db: AsyncSession, lead_id: str, content: str, author: str = "agent") -> str:
    """Create a note on a lead."""
    query = text("""
        INSERT INTO lead_notes (lead_id, content, author)
        VALUES (:lead_id, :content, :author)
        RETURNING id
    """)
    
    result = await db.execute(query, {
        "lead_id": lead_id,
        "content": content,
        "author": author
    })
    await db.commit()
    row = result.fetchone()
    return str(row[0]) if row else None
