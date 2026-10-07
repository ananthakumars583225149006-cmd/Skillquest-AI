"""
Authentication & Google OAuth Profile Sync Routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from ..db.database import get_db
from ..db.models import Profile, UserMascotInventory, UserCourseProgress, MascotOutfit

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


class GoogleSyncRequest(BaseModel):
    id: str
    email: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None


@router.post("/google-sync")
async def sync_google_user(payload: GoogleSyncRequest, db: AsyncSession = Depends(get_db)):
    """
    Called after Supabase Google OAuth sign-in to ensure profile, starting inventory,
    and course progress are initialized in the database.
    """
    user_id = payload.id
    email = payload.email
    username = payload.username or email.split("@")[0]

    # Check if profile already exists
    res = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = res.scalars().first()

    if not profile:
        # Check if email taken under different ID
        email_check = await db.execute(select(Profile).where(Profile.email == email))
        existing_email_profile = email_check.scalars().first()
        if existing_email_profile:
            profile = existing_email_profile
        else:
            # Find default outfit
            outfit_res = await db.execute(select(MascotOutfit).where(MascotOutfit.code == "EEE_HIGH_VOLTAGE"))
            default_outfit = outfit_res.scalars().first()
            outfit_id = default_outfit.id if default_outfit else None

            profile = Profile(
                id=user_id,
                email=email,
                username=username,
                avatar_url=payload.avatar_url,
                active_track="EEE",
                xp=0,
                spark_coins=100,
                streak_days=1,
                hearts=5,
                max_hearts=5,
                equipped_outfit_id=outfit_id,
                current_league="Bronze",
            )
            db.add(profile)
            await db.flush()

            # Initialize starting course progress for all 3 tracks
            for trk in ["EEE", "CSE", "ECE"]:
                prog = UserCourseProgress(
                    user_id=profile.id,
                    track=trk,
                    unlocked_level_number=1,
                    completed_level_ids=[],
                    stars_earned_json={},
                )
                db.add(prog)

            # Grant default outfit in inventory
            if outfit_id:
                inv = UserMascotInventory(user_id=profile.id, outfit_id=outfit_id)
                db.add(inv)

            await db.commit()
    else:
        # Update avatar or username if provided
        if payload.avatar_url and not profile.avatar_url:
            profile.avatar_url = payload.avatar_url
            await db.commit()

    return {
        "status": "success",
        "user_id": profile.id,
        "email": profile.email,
        "username": profile.username,
        "avatar_url": profile.avatar_url,
        "active_track": profile.active_track,
    }


@router.get("/current-user")
async def get_current_user_meta(
    user_id: Optional[str] = "00000000-0000-0000-0000-000000000001",
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = res.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": profile.id,
        "email": profile.email,
        "username": profile.username,
        "avatar_url": profile.avatar_url,
        "active_track": profile.active_track,
    }
