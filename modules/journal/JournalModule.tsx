
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JournalEntryForm } from './JournalEntryForm';
import { JournalEnquiry } from './JournalEnquiry';
import { JournalUpload } from './JournalUpload';
import { PlusCircle, Search, UploadCloud, TrendingUp, AlertCircle, FileCheck, BarChart3 } from 'lucide-react';
import { JournalEntry, JournalStatus } from '../../types';
import { Card } from '../../components/ui/UtilityComponents';
import { journalService } from '../../services/journalService';

export const JournalModule: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'new');
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Load Data via Service
    useEffect(() => {
        loadData();
    }, [activeTab]); // Reload on tab switch to catch updates

    const loadData = async () => {
        const data = await journalService.getAll();
        setEntries(data);
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
    }, [activeTab]);

    // Calculate Quick Stats
    const postedCount = entries.filter(e => e.status === JournalStatus.POSTED).length;
    const totalVolume = entries.reduce((acc, curr) => acc + curr.totalAmount, 0);

    const handlePost = async (entry: JournalEntry) => {
        await journalService.save(entry);
        await loadData();
        setActiveTab('enquiry');
    };

    const handleReverse = async (original: JournalEntry) => {
        await journalService.reverse(original);
        await loadData();
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
