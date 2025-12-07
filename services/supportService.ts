
import { SupportTicket, TicketStatus, User } from '../types';
import { getChatResponse } from './geminiService';
import { authService } from './authService';
import { saveToCloud, loadFromCloud } from '../src/utils/cloudStorage.js';

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
        const tickets = await supportService.getAllTickets();
        tickets.push(newTicket);
        await saveToCloud(TICKETS_KEY, tickets);

        return newTicket;
    },

    getAllTickets: async (): Promise<SupportTicket[]> => {
        const stored = await loadFromCloud(TICKETS_KEY);
        return stored ? (stored as SupportTicket[]) : [];
    },

    getCompanyTickets: async (companyId: string): Promise<SupportTicket[]> => {
        const allTickets = await supportService.getAllTickets();
        return allTickets.filter(t => t.companyId === companyId);
    },

    getUserTickets: async (userId: string): Promise<SupportTicket[]> => {
        const allTickets = await supportService.getAllTickets();
        return allTickets.filter(t => t.userId === userId);
    },

    // Admin Reply
    respondToTicket: async (ticketId: string, response: string) => {
        const tickets = await supportService.getAllTickets();
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
        await saveToCloud(TICKETS_KEY, updated);
    },

    deleteTicket: async (ticketId: string) => {
        const tickets = await supportService.getAllTickets();
        const filtered = tickets.filter(t => t.id !== ticketId);
        await saveToCloud(TICKETS_KEY, filtered);
    }
};
