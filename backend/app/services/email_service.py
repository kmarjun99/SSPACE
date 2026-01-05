from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from typing import List, Optional
import os
from pathlib import Path

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", ""),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
    MAIL_FROM=os.getenv("MAIL_FROM", "noreply@studyspace.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=Path(__file__).parent.parent / 'templates' / 'email'
)

fm = FastMail(conf)


async def send_booking_confirmation_email(
    recipient_email: EmailStr,
    recipient_name: str,
    booking_details: dict
):
    """
    Send booking confirmation email to user
    
    Args:
        recipient_email: User's email address
        recipient_name: User's name
        booking_details: Dictionary containing:
            - venue_name: Name of the venue/accommodation
            - booking_type: 'cabin' or 'accommodation'
            - start_date: Booking start date
            - end_date: Booking end date
            - amount: Total amount paid
            - transaction_id: Payment transaction ID
            - venue_address: Address of the venue
            - cabin_number: Cabin/room number (optional)
    """
    try:
        message = MessageSchema(
            subject="Booking Confirmation - StudySpace",
            recipients=[recipient_email],
            template_body={
                "recipient_name": recipient_name,
                **booking_details
            },
            subtype=MessageType.html
        )
        
        await fm.send_message(message, template_name="booking_confirmation.html")
        return True
    except Exception as e:
        print(f"Failed to send booking confirmation email: {e}")
        return False


async def send_booking_extension_email(
    recipient_email: EmailStr,
    recipient_name: str,
    extension_details: dict
):
    """
    Send booking extension confirmation email
    
    Args:
        recipient_email: User's email address
        recipient_name: User's name
        extension_details: Dictionary containing:
            - venue_name: Name of the venue
            - old_end_date: Original end date
            - new_end_date: New end date
            - extension_amount: Additional amount paid
            - total_amount: Total booking amount
            - days_extended: Number of days extended
    """
    try:
        message = MessageSchema(
            subject="Booking Extended - StudySpace",
            recipients=[recipient_email],
            template_body={
                "recipient_name": recipient_name,
                **extension_details
            },
            subtype=MessageType.html
        )
        
        await fm.send_message(message, template_name="booking_extension.html")
        return True
    except Exception as e:
        print(f"Failed to send booking extension email: {e}")
        return False


async def send_inquiry_response_email(
    recipient_email: EmailStr,
    recipient_name: str,
    inquiry_details: dict
):
    """
    Send inquiry response notification to user
    
    Args:
        recipient_email: User's email address
        recipient_name: User's name
        inquiry_details: Dictionary containing:
            - venue_name: Name of the venue
            - venue_owner: Owner's name
            - original_question: User's original question
            - response: Venue owner's response
            - venue_phone: Contact phone number
    """
    try:
        message = MessageSchema(
            subject="Your Inquiry Has Been Answered - StudySpace",
            recipients=[recipient_email],
            template_body={
                "recipient_name": recipient_name,
                **inquiry_details
            },
            subtype=MessageType.html
        )
        
        await fm.send_message(message, template_name="inquiry_response.html")
        return True
    except Exception as e:
        print(f"Failed to send inquiry response email: {e}")
        return False


async def send_new_inquiry_notification_email(
    recipient_email: EmailStr,
    recipient_name: str,
    inquiry_details: dict
):
    """
    Send notification to venue owner about new inquiry
    
    Args:
        recipient_email: Venue owner's email
        recipient_name: Venue owner's name
        inquiry_details: Dictionary containing:
            - venue_name: Name of the venue
            - student_name: Student's name
            - student_email: Student's email
            - student_phone: Student's phone (optional)
            - question: The inquiry question
            - inquiry_date: Date of inquiry
    """
    try:
        message = MessageSchema(
            subject="New Inquiry for Your Venue - StudySpace",
            recipients=[recipient_email],
            template_body={
                "recipient_name": recipient_name,
                **inquiry_details
            },
            subtype=MessageType.html
        )
        
        await fm.send_message(message, template_name="new_inquiry_notification.html")
        return True
    except Exception as e:
        print(f"Failed to send new inquiry notification email: {e}")
        return False
