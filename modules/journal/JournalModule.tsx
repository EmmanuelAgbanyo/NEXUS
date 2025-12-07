
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JournalEntryForm } from './JournalEntryForm';
import { JournalEnquiry } from './JournalEnquiry';
import { JournalUpload } from './JournalUpload';
import { PlusCircle, Search, UploadCloud, TrendingUp, AlertCircle, FileCheck, BarChart3 } from 'lucide-react';
import { JournalEntry, JournalStatus, JournalType } from '../../types';
import { Card } from '../../components/ui/UtilityComponents';
import { authService } from '../../services/authService';
import { saveToCloud, loadFromCloud } from '../../utils/cloudStorage';

const JOURNALS_KEY = 'nexus_journals';

// Mock DB - Only for Company ID '1' (Demo)
const DEMO_JOURNALS: JournalEntry[] = [
    {
        journalNumber: 'JE-100452',
        reference: 'PAYROLL-JAN',
        transactionDate: '2025-01-25',
        postingDate: '2025-01-25T14:30:00.000Z',
        type: JournalType.GENERAL,
        description: 'Monthly payroll processing for January 2025 including tax and benefits allocations',
        currency: 'USD',
        exchangeRate: 1,
        reportingCurrency: 'USD',
        status: JournalStatus.POSTED,
        userId: 'SYS-ADMIN',
        period: '01-2025',
        totalAmount: 125000,
        lines: [
            { id: '1', accountId: '50100', accountName: 'Salaries Expense', debit: 125000, credit: 0, costCenter: 'HR' },
            { id: '2', accountId: '10110', accountName: 'Cash in Bank', debit: 0, credit: 125000 }
        ]
    }
];

export const JournalModule: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'new');
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Initial Data Load
    useEffect(() => {
        const loadInitialData = async () => {
            const user = await authService.getSession();
            const stored = await loadFromCloud(JOURNALS_KEY);
            let loadedEntries: JournalEntry[] = stored ? (stored as JournalEntry[]) : [];

            if (user) {
                // If no data exists and it's the demo company, seed it
                if (loadedEntries.length === 0 && user.companyId === '1') {
                    loadedEntries = DEMO_JOURNALS;
                    await saveToCloud(JOURNALS_KEY, loadedEntries);
                }
                setEntries(loadedEntries);
            }
        };
        loadInitialData();
    }, []);

    const saveEntries = async (newEntries: JournalEntry[]) => {
        setEntries(newEntries);
        await saveToCloud(JOURNALS_KEY, newEntries);
    };

    // Sync with prop navigation
    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    // Reset scroll when tab changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
        // Reload persistence on tab change to catch uploads
        const reloadEntries = async () => {
            const stored = await loadFromCloud(JOURNALS_KEY);
            if (stored) setEntries(stored as JournalEntry[]);
        };
        reloadEntries();
    }, [activeTab]);

    // Calculate Quick Stats
    const postedCount = entries.filter(e => e.status === JournalStatus.POSTED).length;
    const totalVolume = entries.reduce((acc, curr) => acc + curr.totalAmount, 0);

    const handlePost = async (entry: JournalEntry) => {
        const updated = [entry, ...entries];
        await saveEntries(updated);
        setActiveTab('enquiry');
    };

    const handleReverse = async (original: JournalEntry) => {
        const reversalLines = original.lines.map(l => ({
            ...l,
            id: Math.random().toString(),
            debit: l.credit,
            credit: l.debit
        }));

        const reversal: JournalEntry = {
            ...original,
            journalNumber: `JE-${Math.floor(200000 + Math.random() * 900000)}`,
            reference: `REV-${original.journalNumber}`,
            description: `Reversal of Journal ${original.journalNumber} - ${original.description.substring(0, 50)}...`,
            type: JournalType.REVERSAL,
            status: JournalStatus.POSTED,
            lines: reversalLines,
            postingDate: new Date().toISOString(),
            transactionDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-') 
        };

        await saveEntries([reversal, ...entries]);
    };

    const tabs = [
        { id: 'new', label: 'New Entry', icon: PlusCircle },
        { id: 'upload', label: 'Bulk Import', icon: UploadCloud },
        { id: 'enquiry', label: 'Journal Enquiry', icon: Search },
    ];

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Dashboard Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-500 shrink-0">
                 <Card className="p-4 bg-white border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                        <FileCheck size={80} className="text-indigo-600" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm">
                            <FileCheck size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Posted Journals</p>
                            <h3 className="text-2xl font-bold text-slate-800">{postedCount}</h3>
                        </div>
                    </div>
                 </Card>

                 <Card className="p-4 bg-white border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                        <BarChart3 size={80} className="text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Volume</p>
                            <h3 className="text-2xl font-bold text-slate-800">${(totalVolume / 1000).toFixed(1)}k</h3>
                        </div>
                    </div>
                 </Card>

                 <Card className="p-4 bg-white border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                     <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                        <AlertCircle size={80} className="text-amber-600" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shadow-sm">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending Approval</p>
                            <h3 className="text-2xl font-bold text-slate-800">0</h3>
                        </div>
                    </div>
                 </Card>
            </div>

            {/* Animated Tab Navigation */}
            <div className="flex justify-center md:justify-start shrink-0">
                <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 border border-slate-200 shadow-inner">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                relative px-6 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                                ${activeTab === tab.id ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'}
                            `}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="active-journal-tab"
                                    className="absolute inset-0 bg-white shadow-sm border border-slate-200/60 rounded-lg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <tab.icon size={16} className={activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'} /> 
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div 
                className="flex-1 overflow-hidden relative min-h-[500px]" 
                ref={scrollContainerRef}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                        transition={{ duration: 0.3 }}
                        className="h-full flex flex-col overflow-auto pr-2"
                    >
                        {activeTab === 'new' && <JournalEntryForm onPost={handlePost} />}
                        {activeTab === 'upload' && <JournalUpload />}
                        {activeTab === 'enquiry' && <JournalEnquiry entries={entries} onReverse={handleReverse} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
