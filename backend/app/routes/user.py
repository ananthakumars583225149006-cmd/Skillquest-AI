"""
User profile and preferences routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from ..db.database import get_db
from ..db.models import Profile, UserCourseProgress, MascotOutfit

router = APIRouter(prefix="/api/v1/user", tags=["User"])


class TrackUpdateRequest(BaseModel):
    track: str  # EEE, CSE, ECE


@router.get("/profile")
async def get_user_profile(user_id: Optional[str] = "00000000-0000-0000-0000-000000000001", db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    # Get equipped outfit code
    equipped_code = "EEE_HIGH_VOLTAGE"
    if profile.equipped_outfit_id:
        outfit_res = await db.execute(select(MascotOutfit).where(MascotOutfit.id == profile.equipped_outfit_id))
        outfit = outfit_res.scalars().first()
        if outfit:
            equipped_code = outfit.code

    return {
        "id": profile.id,
        "email": profile.email,
        "username": profile.username,
        "active_track": profile.active_track,
        "xp": profile.xp,
        "spark_coins": profile.spark_coins,
        "streak_days": profile.streak_days,
        "hearts": profile.hearts,
        "max_hearts": profile.max_hearts,
        "equipped_outfit_code": equipped_code,
        "equipped_outfit_id": profile.equipped_outfit_id,
        "current_league": profile.current_league,
    }


@router.post("/active-track")
async def set_active_track(payload: TrackUpdateRequest, user_id: Optional[str] = "00000000-0000-0000-0000-000000000001", db: AsyncSession = Depends(get_db)):
    track = payload.track.upper()
    if track not in ["EEE", "CSE", "ECE"]:
        raise HTTPException(status_code=400, detail="Invalid track. Must be EEE, CSE, or ECE.")

    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    profile.active_track = track
    await db.commit()
    return {"message": f"Active track changed to {track}", "active_track": track}
