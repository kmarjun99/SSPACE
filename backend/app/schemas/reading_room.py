from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.reading_room import CabinStatus, ListingStatus

class CabinBase(BaseModel):
    number: str
    floor: int
    amenities: Optional[str] = None
    price: float
    status: CabinStatus = CabinStatus.AVAILABLE
    zone: Optional[str] = None
    row_label: Optional[str] = None

class CabinCreate(CabinBase):
    pass


class CabinUpdate(BaseModel):
    status: Optional[CabinStatus] = None
    price: Optional[float] = None
    amenities: Optional[str] = None
    current_occupant_id: Optional[str] = None

class CabinResponse(CabinBase):
    id: str
    reading_room_id: str
    current_occupant_id: Optional[str] = None
    zone: Optional[str] = None
    row_label: Optional[str] = None
    # Hold system fields
    held_by_user_id: Optional[str] = None
    hold_expires_at: Optional[str] = None

    class Config:
        from_attributes = True

class ReadingRoomBase(BaseModel):
    name: str
    address: str
    description: Optional[str] = None
    images: Optional[str] = None # JSON string
    amenities: Optional[str] = None
    contact_phone: Optional[str] = None
    price_start: Optional[float] = None
    # Location
    city: Optional[str] = None
    area: Optional[str] = None
    locality: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_id: Optional[str] = None  # Reference to locations master table

class ReadingRoomCreate(ReadingRoomBase):
    pass

class ReadingRoomUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    images: Optional[str] = None
    amenities: Optional[str] = None
    contact_phone: Optional[str] = None
    price_start: Optional[float] = None
    city: Optional[str] = None
    area: Optional[str] = None
    locality: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_id: Optional[str] = None  # Reference to locations master table
    status: Optional[ListingStatus] = None

class ReadingRoomResponse(ReadingRoomBase):
    id: str
    owner_id: str
    is_sponsored: bool = False
    is_verified: bool = False
    status: ListingStatus = ListingStatus.DRAFT
    image_url: Optional[str] = None # Computed prop
    created_at: Optional[datetime] = None  # Submission date
    _distance: Optional[float] = None # Calculated field
    # cabins: List[CabinResponse] = [] # Optional, might avoid loading all cabins by default

    class Config:
        from_attributes = True
