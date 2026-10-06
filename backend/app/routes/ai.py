"""
AI Tutor & Socratic Recommendation Routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, Dict, Any

from ..db.database import get_db
from ..db.models import BKTTopicMastery, Level
from ..ai.gemini_service import gemini_service

router = APIRouter(prefix="/api/v1/ai", tags=["AI Socratic Tutor"])


class SocraticHintRequest(BaseModel):
    spice_telemetry: Dict[str, Any]
    target_goal: Dict[str, Any]
    user_query: str
    topic_tag: Optional[str] = "Circuit Analysis"


class AdaptivePracticeRequest(BaseModel):
    track: Optional[str] = "EEE"


@router.post("/socratic-hint")
async def get_socratic_hint(payload: SocraticHintRequest):
    """
    Generates Socratic guidance from Spike the Rhino based on ground truth simulation measurements.
    """
    guidance = await gemini_service.get_socratic_guidance(
        spice_telemetry=payload.spice_telemetry,
        target_goal=payload.target_goal,
        user_query=payload.user_query,
        topic_tag=payload.topic_tag or "Circuit Analysis",
    )
    return {
        "persona": "Spike the Engineering Rhino",
        "guidance": guidance,
    }


@router.post("/generate-practice")
async def generate_practice_drill(
    payload: AdaptivePracticeRequest,
    user_id: Optional[str] = "00000000-0000-0000-0000-000000000001",
    db: AsyncSession = Depends(get_db)
):
    """
    Finds the user's lowest BKT mastery topic and generates an adaptive review drill.
    """
    track = payload.track.upper()
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
