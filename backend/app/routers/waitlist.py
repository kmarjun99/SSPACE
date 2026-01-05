from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.waitlist import WaitlistEntry
from app.models.reading_room import Cabin, CabinStatus
from app.schemas.waitlist import WaitlistEntryCreate, WaitlistEntryResponse
from app.models.user import User
from app.deps import get_current_user

router = APIRouter(prefix="/waitlist", tags=["waitlist"])

@router.post("/", response_model=WaitlistEntryResponse)
async def join_waitlist(
    entry: WaitlistEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if cabin is occupied
    result = await db.execute(select(Cabin).where(Cabin.id == entry.cabin_id))
    cabin = result.scalars().first()
    if not cabin:
        raise HTTPException(status_code=404, detail="Cabin not found")
        
    if cabin.status == CabinStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Cabin is available, you can book it directly")

    # Check if already in waitlist
    existing = await db.execute(select(WaitlistEntry).where(
        (WaitlistEntry.user_id == current_user.id) & 
        (WaitlistEntry.cabin_id == entry.cabin_id)
    ))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Already in waitlist for this cabin")

    new_entry = WaitlistEntry(
        user_id=current_user.id,
        cabin_id=entry.cabin_id,
        reading_room_id=entry.reading_room_id
    )
    db.add(new_entry)
    await db.commit()
    await db.refresh(new_entry)
    return new_entry
