from sqlalchemy import Column, String, DateTime, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from datetime import datetime, timedelta, timezone
from app.database import Base


class OTP(Base):
    __tablename__ = "otps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_email = Column(String, nullable=False, index=True)
    user_phone = Column(String, nullable=True)
    otp_code = Column(String(6), nullable=False)
    otp_type = Column(String, nullable=False)  # 'registration', 'password_reset', 'phone_verification'
    is_verified = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    def is_expired(self):
        return datetime.now(timezone.utc) > self.expires_at
    
    def is_valid(self, code: str) -> bool:
        """Check if OTP is valid (not expired, not verified, code matches)"""
        if self.is_expired():
            return False
        if self.is_verified:
            return False
        if self.attempts >= 5:  # Maximum 5 attempts
            return False
        return self.otp_code == code


class PasswordReset(Base):
    __tablename__ = "password_resets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_email = Column(String, nullable=False, index=True)
    reset_token = Column(String, nullable=False, unique=True, index=True)
    otp_code = Column(String(6), nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    def is_expired(self):
        return datetime.now(timezone.utc) > self.expires_at
