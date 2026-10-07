"""
AI Tutor & Socratic Recommendation Routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from ..db.database import get_db
from ..db.models import BKTTopicMastery, Level, LevelNote, KnowledgeQuest
from ..services.socratic_tutor import socratic_tutor
from ..ai.gemini_service import gemini_service

router = APIRouter(prefix="/api/v1/ai", tags=["AI Socratic Tutor"])


class SocraticHintRequest(BaseModel):
    message: Optional[str] = None
    user_query: Optional[str] = None
    active_view: Optional[str] = "WORKBENCH"  # WORKBENCH, LEVEL_NOTES, KNOWLEDGE_QUEST
    context_id: Optional[str] = ""
    spice_telemetry: Optional[Dict[str, Any]] = Field(default_factory=dict)
    target_goal: Optional[Dict[str, Any]] = Field(default_factory=dict)
    topic_tag: Optional[str] = "Circuit Analysis"
    notes_context: Optional[Dict[str, Any]] = None
    quest_context: Optional[Dict[str, Any]] = None


class AdaptivePracticeRequest(BaseModel):
    track: Optional[str] = "EEE"


@router.post("/socratic-hint")
@router.post("/chat")
async def get_socratic_hint(payload: SocraticHintRequest, db: AsyncSession = Depends(get_db)):
    """
    Generates Socratic guidance from Spike the Rhino with multi-class intent classification.
    Dynamic persona prevents context leaks for casual greetings or off-topic questions.
    """
    query = payload.message or payload.user_query or ""
    active_view = (payload.active_view or "WORKBENCH").upper()
    context_id = payload.context_id or ""

    notes_ctx = payload.notes_context
    quest_ctx = payload.quest_context

    # Auto-fetch level notes if active view is LEVEL_NOTES and context_id provided
    if active_view == "LEVEL_NOTES" and context_id and not notes_ctx:
        res = await db.execute(select(LevelNote).where(LevelNote.level_id == context_id))
        db_note = res.scalars().first()
        if db_note:
            notes_ctx = {
                "title": db_note.title,
                "summary": db_note.summary,
                "formulas_rules": db_note.formulas_rules,
                "worked_example": db_note.worked_example,
                "real_world_connection": db_note.real_world_connection,
            }

    # Auto-fetch knowledge quest if active view is KNOWLEDGE_QUEST and context_id provided
    if active_view == "KNOWLEDGE_QUEST" and context_id and not quest_ctx:
        # context_id can be module index e.g. "1" or level id
        try:
            m_idx = int(context_id)
            res = await db.execute(select(KnowledgeQuest).where(KnowledgeQuest.module_index == m_idx))
            db_quest = res.scalars().first()
            if db_quest:
                quest_ctx = {
                    "title": db_quest.title,
                    "recap_summary": db_quest.recap_summary,
                    "key_formulas": db_quest.key_formulas,
                    "concept_breakdown": db_quest.concept_breakdown,
                }
        except ValueError:
            pass

    response = await socratic_tutor.generate_response(
        message=query,
        active_view=active_view,
        context_id=context_id,
        spice_telemetry=payload.spice_telemetry or {},
        target_goal=payload.target_goal or {},
        topic_tag=payload.topic_tag or "Circuit Analysis",
        notes_context=notes_ctx,
        quest_context=quest_ctx,
    )

    return response


@router.post("/generate-practice")
async def generate_practice_drill(
    payload: AdaptivePracticeRequest,
    user_id: Optional[str] = "00000000-0000-0000-0000-000000000001",
    db: AsyncSession = Depends(get_db)
):
    """
    Finds the user's lowest BKT mastery topic and generates an adaptive review drill.
    """
    track = payload.track.upper() if payload.track else "EEE"
    mastery_res = await db.execute(
        select(BKTTopicMastery)
        .where(BKTTopicMastery.user_id == user_id, BKTTopicMastery.track == track)
        .order_by(BKTTopicMastery.p_mastery.asc())
        .limit(1)
    )
    lowest_topic = mastery_res.scalars().first()

    topic_tag = lowest_topic.topic_tag if lowest_topic else "Ohm's Law & Circuit Analysis"
    curr_p = lowest_topic.p_mastery if lowest_topic else 0.30

    drill = await gemini_service.generate_adaptive_drill(topic_tag, curr_p)
    drill["target_topic"] = topic_tag
    drill["current_mastery"] = curr_p
    return drill
