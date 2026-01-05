
import { SupportTicket, SupportCategory, TicketPriority, TicketStatus } from '../types';

export const supportService = {
    createTicket: async (ticket: Partial<SupportTicket>): Promise<SupportTicket> => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const newTicket: SupportTicket = {
                    id: `ticket-${Date.now()}`,
                    userId: ticket.userId!,
                    userRole: ticket.userRole!,
                    userEmail: ticket.userEmail!,
                    userName: ticket.userName!,
                    category: ticket.category || 'OTHER',
                    subject: ticket.subject || 'Support Request',
                    description: ticket.description || '',
                    status: 'OPEN',
                    priority: 'MEDIUM',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    metaData: ticket.metaData
                };
                resolve(newTicket);
            }, 800);
        });
    },

    updateTicketStatus: async (ticketId: string, status: TicketStatus, adminNotes?: string): Promise<void> => {
        // Simulate API
        return new Promise((resolve) => setTimeout(resolve, 500));
    }
};
