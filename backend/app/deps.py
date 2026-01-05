from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.config import settings
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")



async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    import os
    try:
        # Debug: Log the actual token received
        with open("debug_log.txt", "a") as f: 
            f.write(f"Received token: '{token}' (length: {len(token)})\n")
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            credentials_exception.detail = "Token payload missing sub (email)"
            with open("debug_log.txt", "a") as f: f.write("Token missing sub\n")
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError as e:
        credentials_exception.detail = f"JWT Error: {str(e)}"
        with open("debug_log.txt", "a") as f: f.write(f"JWT Error: {str(e)} | Token: '{token[:50] if token else 'NONE'}...'\n")
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.email == token_data.email))
    user = result.scalars().first()
    if user is None:
        credentials_exception.detail = f"User not found for email: {token_data.email}"
        with open("debug_log.txt", "a") as f: f.write(f"User not found: {token_data.email}\n")
        raise credentials_exception
    
    # Simple log
    # with open("debug_log.txt", "a") as f: f.write(f"Auth success for: {user.email}\n")
    return user

async def get_current_active_user(current_user: Annotated[User, Depends(get_current_user)]):
    # If we had an 'active' field we would check it here
    return current_user


# OAuth2 scheme with auto_error=False to support optional auth
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

async def get_current_user_optional(token: Annotated[str | None, Depends(oauth2_scheme_optional)], db: AsyncSession = Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        token_data = TokenData(email=email)
    except JWTError:
        return None
    
    result = await db.execute(select(User).where(User.email == token_data.email))
    user = result.scalars().first()
    return user

async def get_current_admin(current_user: Annotated[User, Depends(get_current_user)]):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user

async def get_current_super_admin(current_user: Annotated[User, Depends(get_current_user)]):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges (Super Admin required)",
        )
    return current_user
