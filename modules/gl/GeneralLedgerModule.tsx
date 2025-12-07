
import React, { useState } from 'react';
import { GLInquiry } from './GLInquiry';
import { TrialBalanceView } from './TrialBalanceView';
import { SectionHeader } from '../../components/ui/UtilityComponents';
import { BookOpen, Layers, Search, Calendar, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PeriodProgress = () => {
    // Mock progress calculation
    const totalDays = 31;
    const currentDay = 12;
    const progress = (currentDay / totalDays) * 100;

    return (
        <div className="w-48">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Period 03 Progress</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-slate-400 font-medium">
                <span>Day {currentDay}</span>
                <span>19 Days Left</span>
            </div>
        </div>
    );
};

export const GeneralLedgerModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'inquiry' | 'trial'>('inquiry');
    const [drillDownAccount, setDrillDownAccount] = useState<string | undefined>(undefined);

    const handleDrillDown = (accountCode: string) => {
        setDrillDownAccount(accountCode);
        setActiveTab('inquiry');
    };

    const tabs = [
        { id: 'inquiry', label: 'Account Inquiry', icon: Search },
        { id: 'trial', label: 'Trial Balance', icon: Layers },
    ];

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Command Header */}
            <div className="bg-white border-b border-slate-200 pb-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm border border-indigo-100">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">General Ledger</h2>
                            <p className="text-sm text-slate-500 mt-1">Financial master record & transaction analysis.</p>
                            
                            <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                    <Clock size={12} /> Last Close: <span className="font-bold text-slate-700">Feb 28, 2025</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                    <AlertCircle size={12} /> Next Cutoff: <span className="font-bold text-slate-700">Apr 05, 2025</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 self-end md:self-center">
                        <PeriodProgress />
                        
                        {/* Fiscal Context Badge */}
                        <div className="hidden md:flex flex-col items-end">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Period</p>
                            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50/50 rounded-xl border border-emerald-100 backdrop-blur-sm">
                                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shadow-sm">
                                    <Calendar size={16} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-800">03-2025 (Mar)</span>
                                        <span className="relative flex h-2.5 w-2.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Open for Posting</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liquid Navigation Bar */}
                <div className="mt-6 flex items-center justify-between">
                    <div className="bg-slate-100/80 p-1.5 rounded-xl flex gap-1 border border-slate-200/60 shadow-inner w-fit">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id as 'inquiry' | 'trial'); if(tab.id === 'trial') setDrillDownAccount(undefined); }}
                                className={`
                                    relative px-6 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 outline-none z-10 group
                                    ${activeTab === tab.id ? 'text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                                `}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="active-gl-tab"
                                        className="absolute inset-0 bg-white border border-slate-200/50 rounded-lg"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    <tab.icon size={14} className={`transition-colors ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} /> 
                                    {tab.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative rounded-2xl bg-white shadow-sm border border-slate-200">
                <AnimatePresence mode="wait">
                    {activeTab === 'inquiry' ? (
                        <motion.div 
                            key="inquiry"
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3, ease: "circOut" }}
                            className="h-full absolute inset-0"
                        >
                            <GLInquiry initialAccountFilter={drillDownAccount} />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="trial"
                            initial={{ opacity: 0, x: 10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3, ease: "circOut" }}
                            className="h-full absolute inset-0"
                        >
                            <TrialBalanceView onDrillDown={handleDrillDown} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
