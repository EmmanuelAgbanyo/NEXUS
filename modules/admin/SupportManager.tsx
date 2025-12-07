
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/ui/UtilityComponents';
import { supportService } from '../../services/supportService';
import { SupportTicket } from '../../types';
import { MessageSquare, CheckCircle, Search, User, Clock, Trash2, Send, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export const SupportManager: React.FC = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [filter, setFilter] = useState<'All' | 'Open' | 'Resolved'>('All');
    const [replyText, setReplyText] = useState('');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    useEffect(() => {
        loadTickets();
        // Poll for new tickets every 10s
        const interval = setInterval(loadTickets, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadTickets = async () => {
        const allTickets = await supportService.getAllTickets();
        setTickets(allTickets);
    };

    const handleReply = async (id: string) => {
        if (!replyText.trim()) return;
        await supportService.respondToTicket(id, replyText);
        setReplyText('');
        setSelectedTicketId(null);
        await loadTickets();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this ticket history?')) {
            await supportService.deleteTicket(id);
            await loadTickets();
            if (selectedTicketId === id) setSelectedTicketId(null);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (filter === 'All') return true;
        if (filter === 'Resolved') return t.status === 'Resolved';
        return t.status !== 'Resolved';
    });

    // Sort by newest
    filteredTickets.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex gap-2">
                    {['All', 'Open', 'Resolved'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="text-xs text-slate-400">Auto-refreshing every 10s</div>
            </div>

            <div className="flex gap-6 h-[600px]">
                {/* List */}
                <div className="w-1/3 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    {filteredTickets.map(ticket => (
                        <motion.div
                            key={ticket.id}
                            layout
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md
                                ${selectedTicketId === ticket.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300' : 'bg-white border-slate-200 hover:border-indigo-200'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-slate-700 text-xs">{ticket.userName}</span>
                                <Badge type={ticket.status === 'Resolved' ? 'success' : 'warning'}>{ticket.status}</Badge>
                            </div>
                            <p className="text-sm text-slate-800 line-clamp-2 font-medium mb-2">{ticket.query}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <Clock size={10} /> {new Date(ticket.timestamp).toLocaleTimeString()}
                                {ticket.isAiResponse && <span className="flex items-center gap-1 text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded"><Bot size={10}/> AI</span>}
                            </div>
                        </motion.div>
                    ))}
                    {filteredTickets.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            <MessageSquare size={32} className="mx-auto mb-2 opacity-30"/>
                            <p>No tickets found</p>
                        </div>
                    )}
                </div>

                {/* Detail */}
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    {selectedTicketId ? (
                        (() => {
                            const ticket = tickets.find(t => t.id === selectedTicketId);
                            if (!ticket) return null;
                            return (
                                <>
                                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800">Support Request #{ticket.id}</h3>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><User size={12}/> {ticket.userName}</span>
                                                <span>•</span>
                                                <span>Tenant ID: {ticket.companyId}</span>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(ticket.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                <User size={20} className="text-slate-500"/>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm max-w-lg">
                                                <p className="text-slate-800 text-sm leading-relaxed">{ticket.query}</p>
                                                <p className="text-[10px] text-slate-400 mt-2 text-right">{new Date(ticket.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {ticket.response && (
                                            <div className="flex gap-4 flex-row-reverse">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white ${ticket.isAiResponse ? 'bg-gradient-to-br from-purple-500 to-indigo-500' : 'bg-slate-800'}`}>
                                                    {ticket.isAiResponse ? <Bot size={20} /> : <User size={20}/>}
                                                </div>
                                                <div className={`p-4 rounded-2xl rounded-tr-none border shadow-sm max-w-lg text-sm leading-relaxed
                                                    ${ticket.isAiResponse ? 'bg-indigo-50 border-indigo-100 text-slate-800' : 'bg-slate-800 text-slate-100 border-slate-700'}
                                                `}>
                                                    <p>{ticket.response}</p>
                                                    {ticket.isAiResponse && <Badge type="info" className="mt-2 bg-white/50 border-indigo-200">AI Generated</Badge>}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 border-t border-slate-200 bg-white">
                                        <div className="relative">
                                            <textarea 
                                                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none pr-12"
                                                rows={3}
                                                placeholder="Type an override reply..."
                                                value={replyText}
                                                onChange={e => setReplyText(e.target.value)}
                                            />
                                            <button 
                                                onClick={() => handleReply(ticket.id)}
                                                disabled={!replyText.trim()}
                                                className="absolute right-3 bottom-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            );
                        })()
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <MessageSquare size={48} className="mb-4 opacity-20"/>
                            <p>Select a ticket to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
