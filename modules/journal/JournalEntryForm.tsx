
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge } from '../../components/ui/UtilityComponents';
import { ModernInput } from '../../components/ui/ModernInput';
import { ProfessionalDropdown } from '../../components/ui/ProfessionalDropdown';
import { JournalType, JournalLine, AccountType, JournalEntry, JournalStatus, COAAccount } from '../../types';
import { Plus, Trash2, Save, Send, AlertCircle, Calculator, Search, CheckCircle, Clock, CalendarDays, Globe, Undo, Redo, Sparkles, Loader2, FileText, Hash, Coins, ChevronDown, RefreshCw } from 'lucide-react';
import { suggestJournalLines } from '../../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { loadFromCloud } from '../../utils/cloudStorage';

// Constants
const MIN_DESC_LENGTH = 10; 

// Enhanced Currency Options
const CURRENCY_OPTIONS = [
    { id: 'USD', label: 'USD', description: 'US Dollar (Base)' },
    { id: 'EUR', label: 'EUR', description: 'Euro - 0.92' },
    { id: 'GBP', label: 'GBP', description: 'British Pound - 0.79' },
    { id: 'GHS', label: 'GHS', description: 'Ghanaian Cedi - 13.50' },
    { id: 'CAD', label: 'CAD', description: 'Canadian Dollar - 1.35' },
    { id: 'SGD', label: 'SGD', description: 'Singapore Dollar - 1.34' },
];

// --- Helper Components ---

const SystemClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-600 bg-white/50 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
            <Globe size={10} />
            <span>{time.toLocaleTimeString()} UTC</span>
        </div>
    );
};

// Autocomplete Table Input
const AccountTableSelect = ({ value, onChange, options, autoFocus }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState(value);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSearch(value);
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filtered = options.filter((o: any) => o.code.includes(search) || o.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="relative w-full h-full" ref={wrapperRef}>
            <input
                className="w-full h-full bg-transparent border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-3 py-2 text-sm font-mono text-indigo-700 font-bold outline-none transition-all placeholder:text-slate-300 rounded-md hover:bg-slate-50 focus:bg-white"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
                onFocus={() => setIsOpen(true)}
                placeholder="Select..."
                autoFocus={autoFocus}
            />
            <AnimatePresence>
                {isOpen && filtered.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute z-50 left-0 top-full mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                    >
                        {filtered.map((opt: any) => (
                            <div 
                                key={opt.code} 
                                className="px-3 py-2 text-xs hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0"
                                onClick={() => { onChange(opt.code); setIsOpen(false); }}
                            >
                                <div className="flex justify-between font-bold text-slate-700">
                                    <span>{opt.code}</span>
                                    <span className={`text-[10px] text-white px-1.5 rounded ${opt.type === 'Asset' ? 'bg-indigo-400' : opt.type === 'Liability' ? 'bg-amber-400' : 'bg-slate-400'}`}>
                                        {opt.type}
                                    </span>
                                </div>
                                <div className="text-slate-500 truncate">{opt.name}</div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Form State ---

interface JournalFormState {
    type: JournalType;
    reference: string;
    date: string;
    description: string;
    currency: string;
    exchangeRate: number;
    reportingCurrency: string;
    lines: JournalLine[];
}

const INITIAL_STATE: JournalFormState = {
    type: JournalType.GENERAL,
    reference: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    description: '',
    currency: 'USD',
    exchangeRate: 1.0,
    reportingCurrency: 'USD',
    lines: [
        { id: '1', accountId: '', accountName: '', debit: 0, credit: 0 },
        { id: '2', accountId: '', accountName: '', debit: 0, credit: 0 },
    ]
};

export const JournalEntryForm: React.FC<{ onPost: (entry: JournalEntry) => void }> = ({ onPost }) => {
    const [history, setHistory] = useState<JournalFormState[]>([INITIAL_STATE]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const [coa, setCoa] = useState<COAAccount[]>([]);
    
    // AI
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [aiMessage, setAiMessage] = useState('');

    const formState = history[currentIndex];
    const { type, reference, date, description, currency, exchangeRate, reportingCurrency, lines } = formState;

    useEffect(() => {
        // Load COA from system persistence
        const loadCOA = async () => {
            const stored = await loadFromCloud('nexus_coa');
            if (stored) {
                setCoa(stored as COAAccount[]);
            }
        };
        loadCOA();
    }, []);

    // Helpers
    const updateState = (newState: JournalFormState) => {
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    };

    const undo = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);
    const redo = () => currentIndex < history.length - 1 && setCurrentIndex(currentIndex + 1);

    // Grid Logic
    const updateLine = (id: string, field: keyof JournalLine, value: any) => {
        const newLines = lines.map(line => {
            if (line.id === id) {
                const updated = { ...line, [field]: value };
                if (field === 'accountId') {
                    const acc = coa.find(a => a.code === value);
                    updated.accountName = acc ? acc.name : '';
                }
                // Exclusive Debit/Credit
                if (field === 'debit' && value > 0) updated.credit = 0;
                if (field === 'credit' && value > 0) updated.debit = 0;
                return updated;
            }
            return line;
        });
        updateState({ ...formState, lines: newLines });
    };

    const addLine = () => {
        const newLine = { id: Math.random().toString(), accountId: '', accountName: '', debit: 0, credit: 0 };
        updateState({ ...formState, lines: [...lines, newLine] });
    };

    const removeLine = (id: string) => {
        if (lines.length > 2) updateState({ ...formState, lines: lines.filter(l => l.id !== id) });
    };

    // AI Auto Fill
    const handleAiAutoFill = async () => {
        setIsAiProcessing(true);
        setAiMessage('Generating...');
        try {
            const result = await suggestJournalLines(description, coa);
            if (result && result.lines) {
                const newLines = result.lines.map((l: any) => {
                    const acc = coa.find(a => a.code === l.accountCode);
                    return {
                        id: Math.random().toString(),
                        accountId: l.accountCode,
                        accountName: acc?.name || '',
                        debit: l.debit || 0,
                        credit: l.credit || 0,
                        costCenter: acc?.type === AccountType.EXPENSE ? 'AI-GEN' : undefined
                    };
                });
                updateState({...formState, lines: newLines});
            }
        } catch(e) {}
        setIsAiProcessing(false);
    };

    // Calc
    const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
    const imbalance = totalDebit - totalCredit;
    const isBalanced = Math.abs(imbalance) < 0.01;

    // Validate
    const validate = () => {
        const errs = [];
        if (!reference) errs.push("Reference required");
        if (!description) errs.push("Description required");
        if (!isBalanced) errs.push("Entry not balanced");
        setErrors(errs);
        return errs.length === 0;
    };

    const handlePost = (status: JournalStatus) => {
        if (!validate()) return;
        const entry: JournalEntry = {
            journalNumber: `JE-${Math.floor(Math.random() * 100000)}`,
            reference, transactionDate: date, postingDate: new Date().toISOString(),
            type, description, currency, exchangeRate, reportingCurrency,
            status, userId: 'ADM', period: '01-2025', lines, totalAmount: totalDebit
        };
        onPost(entry);
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] max-w-7xl mx-auto">
            {/* 1. Header Control Bar */}
            <div className="sticky top-0 z-40 mb-6">
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-lg shadow-slate-200/50 rounded-2xl p-2 flex justify-between items-center px-4">
                    <div className="flex items-center gap-4">
                         <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            <button onClick={undo} disabled={currentIndex === 0} className="p-1.5 hover:bg-white rounded-md text-slate-500 disabled:opacity-30 transition-all"><Undo size={14} /></button>
                            <button onClick={redo} disabled={currentIndex === history.length - 1} className="p-1.5 hover:bg-white rounded-md text-slate-500 disabled:opacity-30 transition-all"><Redo size={14} /></button>
                         </div>
                         <div className="h-4 w-px bg-slate-200"></div>
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700 text-sm">Draft Journal</span>
                            <Badge type="neutral">Unsaved</Badge>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                         {errors.length > 0 && (
                             <div className="flex items-center gap-2 text-red-600 text-xs font-bold animate-pulse">
                                 <AlertCircle size={14} /> {errors[0]}
                             </div>
                         )}
                         <SystemClock />
                    </div>
                </div>
            </div>

            {/* 2. Journal Header Form */}
            <Card className="mb-6 border-slate-200 shadow-sm p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                         <div className="space-y-1">
                             <label className="text-xs font-bold text-slate-500 uppercase">Journal Type</label>
                             <ProfessionalDropdown 
                                options={Object.values(JournalType).map(t => ({id: t, label: t}))}
                                value={type}
                                onChange={(v) => updateState({...formState, type: v as JournalType})}
                             />
                         </div>
                         <ModernInput 
                            label="Reference #" 
                            value={reference}
                            onChange={(e) => updateState({...formState, reference: e.target.value})}
                            icon={<Hash size={14} />}
                            className="mb-0"
                         />
                    </div>
                    <div className="relative">
                        <ModernInput 
                            label="Narrative" 
                            value={description}
                            onChange={(e) => updateState({...formState, description: e.target.value})}
                            className="mb-0"
                        />
                        <button 
                            onClick={handleAiAutoFill}
                            disabled={isAiProcessing || !description}
                            className="absolute right-2 top-3 p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                        >
                            {isAiProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            Auto-Fill
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col justify-between">
                     <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Valuation</label>
                         <div className="flex items-center justify-between mb-3 gap-2">
                             <div className="w-40 relative z-20">
                                <ProfessionalDropdown 
                                    options={CURRENCY_OPTIONS}
                                    value={currency}
                                    onChange={(v) => updateState({...formState, currency: v as string})}
                                    placeholder="Currency"
                                />
                             </div>
                             <div className="text-right flex-1">
                                 <div className="text-xs text-slate-400">Rate to {reportingCurrency}</div>
                                 <input 
                                    type="number"
                                    value={exchangeRate}
                                    onChange={(e) => updateState({...formState, exchangeRate: parseFloat(e.target.value)})}
                                    className="text-right font-mono font-bold bg-transparent border-b border-slate-300 w-full focus:border-indigo-500 outline-none"
                                 />
                             </div>
                         </div>
                     </div>
                     <div className="pt-4 border-t border-slate-200">
                         <div className="flex justify-between items-center">
                             <span className="text-sm font-semibold text-slate-600">Total ({reportingCurrency})</span>
                             <span className="font-mono font-bold text-lg text-indigo-700">{(totalDebit * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                         </div>
                     </div>
                </div>
            </Card>

            {/* 3. High-Velocity Grid */}
            <Card className="flex-1 overflow-visible border-slate-200 shadow-md flex flex-col relative">
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <FileText size={16} className="text-indigo-500" /> Transaction Lines
                    </h3>
                    <Button size="sm" variant="secondary" onClick={addLine} className="h-8 text-xs">
                        <Plus size={14} /> Add Line (Ctrl+Enter)
                    </Button>
                </div>
                
                <div className="overflow-x-auto pb-20">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-white text-slate-400 font-semibold text-[10px] uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-2 w-12 text-center">#</th>
                                <th className="px-4 py-2 w-32">Account</th>
                                <th className="px-4 py-2 w-48">Description</th>
                                <th className="px-4 py-2 w-32">Cost Center</th>
                                <th className="px-4 py-2 w-32 text-right">Debit</th>
                                <th className="px-4 py-2 w-32 text-right">Credit</th>
                                <th className="px-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            <AnimatePresence>
                            {lines.map((line, idx) => (
                                <motion.tr 
                                    key={line.id}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="group hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-4 py-2 text-center text-slate-300 font-mono text-xs">{idx + 1}</td>
                                    <td className="px-2 py-1">
                                        <AccountTableSelect 
                                            value={line.accountId}
                                            onChange={(val: string) => updateLine(line.id, 'accountId', val)}
                                            options={coa}
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                         <div className="px-3 py-2 text-xs font-medium text-slate-500 truncate h-9 flex items-center bg-transparent group-hover:bg-white rounded transition-colors">
                                            {line.accountName || '-'}
                                         </div>
                                    </td>
                                    <td className="px-2 py-1">
                                        <input 
                                            className="w-full bg-transparent hover:bg-white focus:bg-white border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded px-2 py-1.5 text-xs text-slate-600 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="-"
                                            value={line.costCenter || ''}
                                            onChange={(e) => updateLine(line.id, 'costCenter', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <input 
                                            type="number"
                                            className="w-full bg-transparent hover:bg-white focus:bg-white border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded px-2 py-1.5 text-right font-mono text-xs font-medium text-slate-700 outline-none transition-all"
                                            value={line.debit || ''}
                                            onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value))}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <input 
                                            type="number"
                                            className="w-full bg-transparent hover:bg-white focus:bg-white border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded px-2 py-1.5 text-right font-mono text-xs font-medium text-slate-700 outline-none transition-all"
                                            value={line.credit || ''}
                                            onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value))}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                        <button onClick={() => removeLine(line.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Sticky Balance Footer */}
                <div className={`
                    sticky bottom-4 mx-4 mb-4 rounded-xl shadow-xl border p-4 flex justify-between items-center transition-all duration-300
                    ${isBalanced ? 'bg-emerald-900/90 border-emerald-800 text-emerald-50 backdrop-blur-md' : 'bg-white/90 border-slate-200 backdrop-blur-md text-slate-800'}
                `}>
                    <div className="flex gap-8 items-center">
                        <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isBalanced ? 'text-emerald-300' : 'text-slate-400'}`}>Total Debit</span>
                            <span className="font-mono text-xl font-bold">{totalDebit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isBalanced ? 'text-emerald-300' : 'text-slate-400'}`}>Total Credit</span>
                            <span className="font-mono text-xl font-bold">{totalCredit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className={`h-8 w-px ${isBalanced ? 'bg-emerald-700' : 'bg-slate-200'}`}></div>
                        <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isBalanced ? 'text-emerald-300' : 'text-amber-500'}`}>Difference</span>
                            <span className={`font-mono text-xl font-bold ${isBalanced ? 'text-emerald-300' : 'text-amber-500'}`}>
                                {imbalance.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="secondary" className="bg-white/10 text-white border-transparent hover:bg-white/20" onClick={() => handlePost(JournalStatus.DRAFT)}>
                            Save Draft
                        </Button>
                        <Button 
                            className={`${isBalanced ? 'bg-white text-emerald-900 hover:bg-emerald-50' : 'bg-slate-800 text-white hover:bg-slate-900'} shadow-none border-0`}
                            onClick={() => handlePost(JournalStatus.POSTED)}
                            disabled={!isBalanced}
                        >
                            Post to Ledger <Send size={16} className="ml-2" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
