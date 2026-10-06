"""
Mascot & Wardrobe catalog routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from ..db.database import get_db
from ..db.models import MascotOutfit, UserMascotInventory, Profile

router = APIRouter(prefix="/api/v1/mascot", tags=["Mascot & Wardrobe"])


class OutfitActionRequest(BaseModel):
    outfit_id: str


@router.get("/outfits")
async def get_outfits(user_id: Optional[str] = "00000000-0000-0000-0000-000000000001", db: AsyncSession = Depends(get_db)):
    profile_res = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = profile_res.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    outfits_res = await db.execute(select(MascotOutfit).order_by(MascotOutfit.price_coins.asc()))
    outfits = outfits_res.scalars().all()

    inv_res = await db.execute(select(UserMascotInventory.outfit_id).where(UserMascotInventory.user_id == user_id))
    unlocked_ids = set(inv_res.scalars().all())

    catalog = []
    for o in outfits:
        is_unlocked = (o.id in unlocked_ids) or o.is_default
        is_equipped = (profile.equipped_outfit_id == o.id)
        catalog.append({
            "id": o.id,
            "code": o.code,
            "name": o.name,
            "description": o.description,
            "category": o.category,
            "image_layer_url": o.image_layer_url,
            "price_coins": o.price_coins,
            "unlock_required_badge": o.unlock_required_badge,
            "is_unlocked": is_unlocked,
            "is_equipped": is_equipped,
        })

    return {
        "outfits": catalog,
        "equipped_outfit_id": profile.equipped_outfit_id,
        "spark_coins": profile.spark_coins,
    }


@router.post("/buy-outfit")
async def buy_outfit(payload: OutfitActionRequest, user_id: Optional[str] = "00000000-0000-0000-0000-000000000001", db: AsyncSession = Depends(get_db)):
    profile_res = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = profile_res.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    outfit_res = await db.execute(select(MascotOutfit).where(MascotOutfit.id == payload.outfit_id))
    outfit = outfit_res.scalars().first()
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")

    # Check if already owned
    inv_check = await db.execute(
        select(UserMascotInventory).where(
            UserMascotInventory.user_id == user_id,
            UserMascotInventory.outfit_id == outfit.id
        )
    )
    if inv_check.scalars().first():
        return {"message": "Outfit already unlocked!", "is_unlocked": True}

    if profile.spark_coins < outfit.price_coins:
        raise HTTPException(status_code=400, detail="Insufficient Spark Coins to purchase outfit")

    # Deduct coins and grant outfit
    profile.spark_coins -= outfit.price_coins
    new_inv = UserMascotInventory(user_id=user_id, outfit_id=outfit.id)
    session_add = db.add(new_inv)
    await db.commit()

    return {
        "message": f"Successfully purchased {outfit.name}!",
        "outfit_id": outfit.id,
        "remaining_coins": profile.spark_coins,
    }


@router.post("/equip")
async def equip_outfit(payload: OutfitActionRequest, user_id: Optional[str] = "00000000-0000-0000-0000-000000000001", db: AsyncSession = Depends(get_db)):
    profile_res = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = profile_res.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    outfit_res = await db.execute(select(MascotOutfit).where(MascotOutfit.id == payload.outfit_id))
    outfit = outfit_res.scalars().first()
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")

    # Validate ownership unless default
    if not outfit.is_default:
        inv_check = await db.execute(
            select(UserMascotInventory).where(
                UserMascotInventory.user_id == user_id,
                UserMascotInventory.outfit_id == outfit.id
            )
        )
        if not inv_check.scalars().first():
            raise HTTPException(status_code=403, detail="You must unlock this outfit before equipping.")

    profile.equipped_outfit_id = outfit.id
    await db.commit()

    return {
        "message": f"Spike equipped {outfit.name}!",
        "equipped_outfit_id": outfit.id,
        "equipped_outfit_code": outfit.code,
    }
