
import { SupportTicket, TicketStatus, User } from '../types';
import { getChatResponse } from './geminiService';
import { authService } from './authService';

const TICKETS_KEY = 'nexus_support_tickets';

export const supportService = {
    
    createTicket: async (query: string, user: User): Promise<SupportTicket> => {
        // 1. Get AI Response first
        const aiResponse = await getChatResponse(query);
        
        // 2. Create Ticket Object
        const newTicket: SupportTicket = {
            id: `TKT-${Math.floor(Math.random() * 100000)}`,
            userId: user.id,
            userName: user.fullName,
            companyId: user.companyId,
            query,
            response: aiResponse,
            status: 'Bot_Handled',
            timestamp: new Date().toISOString(),
            isAiResponse: true
        };

        // 3. Persist
        const tickets = supportService.getAllTickets();
        tickets.push(newTicket);
        localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));

        return newTicket;
    },

    getAllTickets: (): SupportTicket[] => {
        const stored = localStorage.getItem(TICKETS_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    getCompanyTickets: (companyId: string): SupportTicket[] => {
        return supportService.getAllTickets().filter(t => t.companyId === companyId);
    },

    getUserTickets: (userId: string): SupportTicket[] => {
        return supportService.getAllTickets().filter(t => t.userId === userId);
    },

    // Admin Reply
    respondToTicket: (ticketId: string, response: string) => {
        const tickets = supportService.getAllTickets();
        const updated = tickets.map(t => {
            if (t.id === ticketId) {
                return { 
                    ...t, 
                    response, 
                    status: 'Resolved' as TicketStatus, // Explicit cast
                    isAiResponse: false 
                };
            }
            return t;
        });
        localStorage.setItem(TICKETS_KEY, JSON.stringify(updated));
    },

    deleteTicket: (ticketId: string) => {
        const tickets = supportService.getAllTickets();
        const filtered = tickets.filter(t => t.id !== ticketId);
        localStorage.setItem(TICKETS_KEY, JSON.stringify(filtered));
    }
};
