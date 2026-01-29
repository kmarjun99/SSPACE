from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from typing import List
from datetime import datetime
import uuid

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.message import Message as MessageModel, Conversation as ConversationModel
from pydantic import BaseModel

router = APIRouter(prefix="/messages", tags=["messages"])


# Pydantic schemas
class MessageCreate(BaseModel):
    receiver_id: str
    content: str
    venue_id: str | None = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    sender_role: str
    receiver_id: str
    receiver_name: str
    receiver_role: str
    content: str
    timestamp: str
    read: bool
    venue_id: str | None = None
    venue_name: str | None = None

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    participant_ids: List[str]
    participants: List[dict]
    last_message: MessageResponse | None = None
    unread_count: int
    venue_id: str | None = None
    venue_name: str | None = None

    class Config:
        from_attributes = True


@router.post("/send", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a message to another user"""
    
    # Verify receiver exists
    receiver_result = await db.execute(select(User).where(User.id == message_data.receiver_id))
    receiver = receiver_result.scalar_one_or_none()
    
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Find or create conversation
    conv_result = await db.execute(
        select(ConversationModel).where(
            or_(
                and_(
                    ConversationModel.participant1_id == current_user.id,
                    ConversationModel.participant2_id == message_data.receiver_id
                ),
                and_(
                    ConversationModel.participant1_id == message_data.receiver_id,
                    ConversationModel.participant2_id == current_user.id
                )
            )
        )
    )
    conversation = conv_result.scalar_one_or_none()
    
    if not conversation:
        # Create new conversation
        conversation = ConversationModel(
            id=str(uuid.uuid4()),
            participant1_id=current_user.id,
            participant2_id=message_data.receiver_id,
            venue_id=message_data.venue_id,
            created_at=datetime.utcnow()
        )
        db.add(conversation)
        await db.flush()
    
    # Create message
    message = MessageModel(
        id=str(uuid.uuid4()),
        conversation_id=conversation.id,
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        content=message_data.content,
        timestamp=datetime.utcnow(),
        read=False
    )
    db.add(message)
    
    # Update conversation last message time
    conversation.last_message_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(message)
    
    # Create notification for receiver (optional - don't fail if notification fails)
    try:
        from app.routers.notifications import create_notification
        await create_notification(
            db=db,
            user_id=message_data.receiver_id,
            title=f"New message from {current_user.name}",
            message=message_data.content[:100] + "..." if len(message_data.content) > 100 else message_data.content,
            notification_type="info",
            message_id=message.id
        )
    except Exception as e:
        print(f"Failed to create notification: {e}")
        # Continue anyway - notification is not critical
    
    return MessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        sender_name=current_user.name,
        sender_role=current_user.role,
        receiver_id=message.receiver_id,
        receiver_name=receiver.name,
        receiver_role=receiver.role,
        content=message.content,
        timestamp=message.timestamp.isoformat(),
        read=message.read,
        venue_id=conversation.venue_id
    )


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all conversations for current user"""
    
    result = await db.execute(
        select(ConversationModel)
        .where(
            or_(
                ConversationModel.participant1_id == current_user.id,
                ConversationModel.participant2_id == current_user.id
            )
        )
        .order_by(desc(ConversationModel.last_message_at))
    )
    conversations = result.scalars().all()
    
    response_list = []
    for conv in conversations:
        # Get other participant
        other_user_id = conv.participant2_id if conv.participant1_id == current_user.id else conv.participant1_id
        other_user_result = await db.execute(select(User).where(User.id == other_user_id))
        other_user = other_user_result.scalar_one_or_none()
        
        if not other_user:
            continue
        
        # Get last message
        last_msg_result = await db.execute(
            select(MessageModel)
            .where(MessageModel.conversation_id == conv.id)
            .order_by(desc(MessageModel.timestamp))
            .limit(1)
        )
        last_message = last_msg_result.scalar_one_or_none()
        
        # Count unread messages
        unread_result = await db.execute(
            select(func.count(MessageModel.id))
            .where(
                and_(
                    MessageModel.conversation_id == conv.id,
                    MessageModel.receiver_id == current_user.id,
                    MessageModel.read == False
                )
            )
        )
        unread_count = unread_result.scalar()
        
        # Get sender info for last message
        last_msg_response = None
        if last_message:
            sender_result = await db.execute(select(User).where(User.id == last_message.sender_id))
            sender = sender_result.scalar_one_or_none()
            receiver_result = await db.execute(select(User).where(User.id == last_message.receiver_id))
            receiver = receiver_result.scalar_one_or_none()
            
            if sender and receiver:
                last_msg_response = MessageResponse(
                    id=last_message.id,
                    conversation_id=last_message.conversation_id,
                    sender_id=last_message.sender_id,
                    sender_name=sender.name,
                    sender_role=sender.role,
                    receiver_id=last_message.receiver_id,
                    receiver_name=receiver.name,
                    receiver_role=receiver.role,
                    content=last_message.content,
                    timestamp=last_message.timestamp.isoformat(),
                    read=last_message.read
                )
        
        response_list.append(ConversationResponse(
            id=conv.id,
            participant_ids=[conv.participant1_id, conv.participant2_id],
            participants=[
                {
                    "id": current_user.id,
                    "name": current_user.name,
                    "role": current_user.role,
                    "avatarUrl": getattr(current_user, 'avatar_url', None)
                },
                {
                    "id": other_user.id,
                    "name": other_user.name,
                    "role": other_user.role,
                    "avatarUrl": getattr(other_user, 'avatar_url', None)
                }
            ],
            last_message=last_msg_response,
            unread_count=unread_count or 0,
            venue_id=conv.venue_id
        ))
    
    return response_list


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all messages in a conversation"""
    
    # Verify user is part of conversation
    conv_result = await db.execute(
        select(ConversationModel).where(ConversationModel.id == conversation_id)
    )
    conversation = conv_result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if current_user.id not in [conversation.participant1_id, conversation.participant2_id]:
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")
    
    # Get messages
    result = await db.execute(
        select(MessageModel)
        .where(MessageModel.conversation_id == conversation_id)
        .order_by(MessageModel.timestamp)
    )
    messages = result.scalars().all()
    
    response_list = []
    for msg in messages:
        sender_result = await db.execute(select(User).where(User.id == msg.sender_id))
        sender = sender_result.scalar_one_or_none()
        receiver_result = await db.execute(select(User).where(User.id == msg.receiver_id))
        receiver = receiver_result.scalar_one_or_none()
        
        if sender and receiver:
            response_list.append(MessageResponse(
                id=msg.id,
                conversation_id=msg.conversation_id,
                sender_id=msg.sender_id,
                sender_name=sender.name,
                sender_role=sender.role,
                receiver_id=msg.receiver_id,
                receiver_name=receiver.name,
                receiver_role=receiver.role,
                content=msg.content,
                timestamp=msg.timestamp.isoformat(),
                read=msg.read
            ))
    
    return response_list


@router.put("/{message_id}/read")
async def mark_message_read(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a message as read"""
    
    result = await db.execute(
        select(MessageModel).where(MessageModel.id == message_id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    message.read = True
    await db.commit()
    
    return {"status": "success"}


@router.put("/conversations/{conversation_id}/read")
async def mark_conversation_read(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all messages in conversation as read"""
    
    result = await db.execute(
        select(MessageModel)
        .where(
            and_(
                MessageModel.conversation_id == conversation_id,
                MessageModel.receiver_id == current_user.id,
                MessageModel.read == False
            )
        )
    )
    messages = result.scalars().all()
    
    for msg in messages:
        msg.read = True
    
    await db.commit()
    
    return {"status": "success", "marked_read": len(messages)}


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get total unread message count"""
    
    result = await db.execute(
        select(func.count(MessageModel.id))
        .where(
            and_(
                MessageModel.receiver_id == current_user.id,
                MessageModel.read == False
            )
        )
    )
    count = result.scalar()
    
    return {"count": count or 0}


@router.post("/conversations/start")
async def start_conversation(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start or get existing conversation with a user"""
    
    participant_id = data.get("participant_id")
    venue_id = data.get("venue_id")
    
    if not participant_id:
        raise HTTPException(status_code=400, detail="participant_id required")
    
    # Check if conversation exists
    result = await db.execute(
        select(ConversationModel).where(
            or_(
                and_(
                    ConversationModel.participant1_id == current_user.id,
                    ConversationModel.participant2_id == participant_id
                ),
                and_(
                    ConversationModel.participant1_id == participant_id,
                    ConversationModel.participant2_id == current_user.id
                )
            )
        )
    )
    conversation = result.scalar_one_or_none()
    
    if conversation:
        # Return existing conversation
        other_user_id = conversation.participant2_id if conversation.participant1_id == current_user.id else conversation.participant1_id
        other_user_result = await db.execute(select(User).where(User.id == other_user_id))
        other_user = other_user_result.scalar_one_or_none()
        
        return ConversationResponse(
            id=conversation.id,
            participant_ids=[conversation.participant1_id, conversation.participant2_id],
            participants=[
                {
                    "id": current_user.id,
                    "name": current_user.name,
                    "role": current_user.role,
                    "avatarUrl": getattr(current_user, 'avatar_url', None)
                },
                {
                    "id": other_user.id,
                    "name": other_user.name,
                    "role": other_user.role,
                    "avatarUrl": getattr(other_user, 'avatar_url', None)
                }
            ] if other_user else [],
            last_message=None,
            unread_count=0,
            venue_id=conversation.venue_id
        )
    
    # Create new conversation
    conversation = ConversationModel(
        id=str(uuid.uuid4()),
        participant1_id=current_user.id,
        participant2_id=participant_id,
        venue_id=venue_id,
        created_at=datetime.utcnow(),
        last_message_at=datetime.utcnow()
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    
    other_user_result = await db.execute(select(User).where(User.id == participant_id))
    other_user = other_user_result.scalar_one_or_none()
    
    return ConversationResponse(
        id=conversation.id,
        participant_ids=[conversation.participant1_id, conversation.participant2_id],
        participants=[
            {
                "id": current_user.id,
                "name": current_user.name,
                "role": current_user.role,
                "avatarUrl": getattr(current_user, 'avatar_url', None)
            },
            {
                "id": other_user.id,
                "name": other_user.name,
                "role": other_user.role,
                "avatarUrl": getattr(other_user, 'avatar_url', None)
            }
        ] if other_user else [],
        last_message=None,
        unread_count=0,
        venue_id=conversation.venue_id
    )
