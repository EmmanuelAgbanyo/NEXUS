
import React, { useState } from 'react';
import { Card, SectionHeader, Button, Badge } from '../../components/ui/UtilityComponents';
import { JournalEntry, JournalStatus, JournalType } from '../../types';
import { Search, Filter, RotateCcw, X, FileText, ChevronRight, Clock, Calendar, Sparkles, Loader2, User, Hash, ArrowRight, CheckCircle2 } from 'lucide-react';
import { explainJournalTransaction } from '../../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

interface JournalEnquiryProps {
    entries: JournalEntry[];
    onReverse: (original: JournalEntry) => void;
}

export const JournalEnquiry: React.FC<JournalEnquiryProps> = ({ entries, onReverse }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const filtered = entries.filter(e => {
        const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              e.journalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              e.reference.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || e.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleSelectEntry = (entry: JournalEntry) => {
        if (selectedEntry?.journalNumber === entry.journalNumber) {
            setSelectedEntry(null);
        } else {
            setSelectedEntry(entry);
            setAiInsight(null);
        }
    };

    const handleReverse = (entry: JournalEntry) => {
        if (window.confirm(`Reverse ${entry.journalNumber}? This will create a contra-entry.`)) {
            onReverse(entry);
        }
    };
    
    const handleAiAudit = async (entry: JournalEntry) => {
        setIsAiLoading(true);
        const insight = await explainJournalTransaction(entry);
        setAiInsight(insight);
        setIsAiLoading(false);
    };

    return (
        <div className="flex h-[calc(100vh-14rem)] gap-6 relative">
            {/* LEFT PANE: LIST */}
            <div className={`flex-1 flex flex-col transition-all duration-500 ${selectedEntry ? 'w-1/2 hidden md:flex' : 'w-full'}`}>
                <Card className="p-4 shadow-sm border-slate-200 mb-4 shrink-0">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2 justify-between">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search journals..." 
                                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" className="border-slate-300 bg-white">
                                    <Filter size={16} />
                                </Button>
                            </div>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {['All', JournalStatus.POSTED, JournalStatus.DRAFT, JournalStatus.REVERSED].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1 text-xs font-bold rounded-full border transition-all whitespace-nowrap
                                        ${filterStatus === status 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}
                                    `}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card className="flex-1 overflow-hidden shadow-md border-slate-200 flex flex-col">
                    <div className="overflow-y-auto flex-1 p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Journal #</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Description</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700 text-right">Amount</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(entry => (
                                    <tr 
                                        key={entry.journalNumber}
                                        onClick={() => handleSelectEntry(entry)}
                                        className={`cursor-pointer transition-colors border-l-4 
                                            ${selectedEntry?.journalNumber === entry.journalNumber 
                                                ? 'bg-indigo-50 border-l-indigo-600' 
                                                : 'border-l-transparent hover:bg-slate-50 hover:border-l-slate-300'}
                                        `}
                                    >
                                        <td className="px-4 py-3 font-mono font-medium text-indigo-700 text-xs">{entry.journalNumber}</td>
                                        <td className="px-4 py-3 text-slate-600 text-xs">{entry.transactionDate}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800 truncate max-w-[150px]">{entry.reference}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{entry.description}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-medium text-slate-800">
                                            {entry.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-2">
                                            <ChevronRight size={16} className={`transition-transform text-slate-400 ${selectedEntry?.journalNumber === entry.journalNumber ? 'rotate-90 text-indigo-600' : ''}`} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <Search size={32} className="mb-2 opacity-50"/>
                                <p>No entries found</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* RIGHT PANE: DETAIL VOUCHER */}
            <AnimatePresence mode="popLayout">
                {selectedEntry && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: '50%' }}
                        exit={{ opacity: 0, x: 20, width: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="flex flex-col h-full bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative"
                    >
                         {/* Header ToolBar */}
                        <div className="h-14 border-b border-slate-200 flex justify-between items-center px-6 bg-slate-50/80 backdrop-blur-sm shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Voucher View</span>
                                {selectedEntry.status === JournalStatus.POSTED && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">POSTED</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedEntry(null)}>
                                    <X size={18} />
                                </Button>
                            </div>
                        </div>

                        {/* Scrollable Voucher Body */}
                        <div className="flex-1 overflow-y-auto p-8 relative bg-[#fdfdfd]">
                            {/* Watermark/Stamp */}
                            {selectedEntry.status === JournalStatus.POSTED && (
                                <div className="absolute top-10 right-10 pointer-events-none opacity-20 rotate-[-15deg] border-4 border-emerald-600 text-emerald-600 px-4 py-2 text-4xl font-black uppercase tracking-widest z-0 mix-blend-multiply">
                                    POSTED
                                </div>
                            )}

                            {/* Voucher Header */}
                            <div className="mb-8 relative z-10">
                                <h2 className="text-3xl font-bold text-slate-900 mb-1">{selectedEntry.journalNumber}</h2>
                                <p className="text-slate-500 font-medium mb-6">{selectedEntry.description}</p>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date</span>
                                        <span className="font-mono text-sm font-semibold text-slate-800 flex items-center gap-1">
                                            <Calendar size={12} /> {selectedEntry.transactionDate}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Period</span>
                                        <span className="font-mono text-sm font-semibold text-slate-800">{selectedEntry.period}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reference</span>
                                        <span className="font-mono text-sm font-semibold text-slate-800">{selectedEntry.reference}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total</span>
                                        <span className="font-mono text-sm font-semibold text-slate-800">
                                            {selectedEntry.currency} {selectedEntry.totalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Lines Table */}
                            <div className="border border-slate-200 rounded-lg overflow-hidden mb-8 shadow-sm">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-2 text-left w-20">Account</th>
                                            <th className="px-4 py-2 text-left">Description</th>
                                            <th className="px-4 py-2 text-right w-28">Debit</th>
                                            <th className="px-4 py-2 text-right w-28">Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {selectedEntry.lines.map((line, i) => (
                                            <tr key={i} className="hover:bg-indigo-50/10">
                                                <td className="px-4 py-3 font-mono text-indigo-600 font-bold">{line.accountId}</td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-800">{line.accountName}</div>
                                                    {line.costCenter && <div className="text-[10px] text-slate-400 mt-0.5">CC: {line.costCenter}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-700">
                                                    {line.debit > 0 ? line.debit.toLocaleString('en-US', {minimumFractionDigits: 2}) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-700">
                                                    {line.credit > 0 ? line.credit.toLocaleString('en-US', {minimumFractionDigits: 2}) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-700">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-2 text-right uppercase text-[10px] text-slate-400">Totals</td>
                                            <td className="px-4 py-2 text-right font-mono">{selectedEntry.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                            <td className="px-4 py-2 text-right font-mono">{selectedEntry.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Audit & AI Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Audit Timeline */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                        <Clock size={12} /> Audit Trail
                                    </h4>
                                    <div className="space-y-4 pl-2 border-l border-slate-200 ml-1">
                                        <div className="relative pl-4">
                                            <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                                            <p className="text-xs text-slate-800 font-medium">Posted to Ledger</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{new Date(selectedEntry.postingDate).toLocaleString()}</p>
                                        </div>
                                        <div className="relative pl-4">
                                            <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                                            <p className="text-xs text-slate-800 font-medium">Created by {selectedEntry.userId}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">Session ID: #88291</p>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Actions */}
                                <div>
                                    <h4 className="text-xs font-bold text-indigo-500 uppercase mb-3 flex items-center gap-2">
                                        <Sparkles size={12} /> Intelligence
                                    </h4>
                                    {!aiInsight ? (
                                        <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            className="w-full text-xs bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100"
                                            onClick={() => handleAiAudit(selectedEntry)}
                                            disabled={isAiLoading}
                                        >
                                            {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} 
                                            {isAiLoading ? 'Analyzing...' : 'Audit this Transaction'}
                                        </Button>
                                    ) : (
                                        <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-800 leading-relaxed shadow-sm">
                                            {aiInsight}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                            {selectedEntry.status === JournalStatus.POSTED && (
                                <Button size="sm" variant="danger" className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-none" onClick={() => handleReverse(selectedEntry)}>
                                    <RotateCcw size={14} /> Reverse Entry
                                </Button>
                            )}
                            <Button size="sm" onClick={() => alert("Printing voucher...")}>
                                Print Voucher
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
