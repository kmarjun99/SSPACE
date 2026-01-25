import axios from 'axios';
import { Message, Conversation } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class MessagingService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    };
  }

  // Get all conversations for current user
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await axios.get(`${API_URL}/messages/conversations`, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      throw error;
    }
  }

  // Get messages in a specific conversation
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const response = await axios.get(
        `${API_URL}/messages/conversations/${conversationId}/messages`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(receiverId: string, content: string, venueId?: string): Promise<Message> {
    try {
      const response = await axios.post(
        `${API_URL}/messages/send`,
        {
          receiver_id: receiverId,
          content,
          venue_id: venueId,
        },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Mark message as read
  async markAsRead(messageId: string): Promise<void> {
    try {
      await axios.put(
        `${API_URL}/messages/${messageId}/read`,
        {},
        this.getAuthHeaders()
      );
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      throw error;
    }
  }

  // Mark all messages in conversation as read
  async markConversationAsRead(conversationId: string): Promise<void> {
    try {
      await axios.put(
        `${API_URL}/messages/conversations/${conversationId}/read`,
        {},
        this.getAuthHeaders()
      );
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await axios.get(`${API_URL}/messages/unread-count`, this.getAuthHeaders());
      return response.data.count;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }

  // Start conversation with venue owner
  async startConversationWithOwner(ownerId: string, venueId?: string): Promise<Conversation> {
    try {
      const response = await axios.post(
        `${API_URL}/messages/conversations/start`,
        {
          participant_id: ownerId,
          venue_id: venueId,
        },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }
  }
}

export const messagingService = new MessagingService();
