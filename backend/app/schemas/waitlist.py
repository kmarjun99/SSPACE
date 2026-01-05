from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WaitlistEntryBase(BaseModel):
    cabin_id: str
    reading_room_id: str

class WaitlistEntryCreate(WaitlistEntryBase):
    pass

class WaitlistEntryResponse(WaitlistEntryBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str # 'info', 'success', 'warning', 'error'
    read: bool = False

class NotificationCreate(NotificationBase):
    user_id: str

class NotificationResponse(NotificationBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True
