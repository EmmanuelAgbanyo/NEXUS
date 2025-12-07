
import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/ui/UtilityComponents';
import { ModernInput } from '../../components/ui/ModernInput';
import { ProfessionalDropdown } from '../../components/ui/ProfessionalDropdown';
import { JournalType, JournalEntry, JournalStatus, GLTransaction, GLFilterPreset } from '../../types';
import { Search, Filter, Download, FileSpreadsheet, Calendar, DollarSign, Hash, Layers, RefreshCw, ChevronDown, Clock, Bookmark, BarChart3, Grid as GridIcon, AlertTriangle, Loader2, FileJson, FileType, Check, FileText, User, X, ChevronRight, ShieldCheck, ArrowRight, ChevronsLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GLAnalytics } from './GLAnalytics';
import { authService } from '../../services/authService';
import { dataService } from '../../services/dataService';
import { useToast } from '../../components/ui/Toast';

// ... (Constants, FilterSection, Props interfaces kept same) ...
const DEMO_GL_DATA: JournalEntry[] = [
    // ... (Keep existing mock data for fallback) ...
    {
        journalNumber: 'JE-100452',
        reference: 'PAYROLL-JAN',
        transactionDate: '2025-01-25',
        postingDate: '2025-01-25T14:30:00.000Z',
        type: JournalType.GENERAL,
        description: 'Monthly payroll processing for January',
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

const FISCAL_PERIODS = [
    { id: '2024-12', label: 'Period 12 2024 (Dec)', value: '2024-12-01' },
    { id: '2025-01', label: 'Period 01 2025 (Jan)', value: '2025-01-01' },
    { id: '2025-02', label: 'Period 02 2025 (Feb)', value: '2025-02-01' },
    { id: '2025-03', label: 'Period 03 2025 (Mar)', value: '2025-03-01' },
];

const FilterSection = ({ title, children, defaultOpen = true }: { title: string, children?: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-slate-100 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-indigo-600 transition-colors"
            >
                {title}
                <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pb-4 space-y-3">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const GLInquiry: React.FC<{ initialAccountFilter?: string }> = ({ initialAccountFilter }) => {
    // View & Layout
    const [viewMode, setViewMode] = useState<'grid' | 'analytics'>('grid');
    const [showFilters, setShowFilters] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState<GLTransaction | null>(null);
    const [glData, setGlData] = useState<JournalEntry[]>([]);
    const { addToast } = useToast();

    // Export State
    const [isExporting, setIsExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Filter States
    const [filterMode, setFilterMode] = useState<'period' | 'date'>('period');
    const [periodFrom, setPeriodFrom] = useState('2025-01');
    const [periodTo, setPeriodTo] = useState('2025-03');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [accountFilter, setAccountFilter] = useState(initialAccountFilter || '');
    const [typeFilter, setTypeFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [costCenterFilter, setCostCenterFilter] = useState('');
    
    useEffect(() => {
        if (initialAccountFilter) setAccountFilter(initialAccountFilter);
    }, [initialAccountFilter]);

    useEffect(() => {
        const user = authService.getSession();
        if (user) {
            const stored = localStorage.getItem('nexus_journals');
            if (stored) {
                setGlData(JSON.parse(stored));
            } else if (user.companyId === '1') {
                setGlData(DEMO_GL_DATA);
            } else {
                setGlData([]);
            }
        }
    }, []);

    // Data Processing (Memoized transactions flatten logic - same as before)
    const transactions: GLTransaction[] = useMemo(() => {
        const flat: GLTransaction[] = [];
        glData.forEach(entry => {
            if (entry.status !== JournalStatus.POSTED) return;
            const isWeekend = new Date(entry.transactionDate).getDay() === 0 || new Date(entry.transactionDate).getDay() === 6;
            const isHighValue = entry.totalAmount > 100000;
            const isException = isWeekend || isHighValue;
            const exceptionReason = isWeekend ? 'Weekend Posting' : isHighValue ? 'High Value > 100k' : '';

            entry.lines.forEach(line => {
                flat.push({
                    id: `${entry.journalNumber}-${line.id}`,
                    journalNumber: entry.journalNumber,
                    transactionDate: entry.transactionDate,
                    postingDate: entry.postingDate,
                    accountCode: line.accountId,
                    accountName: line.accountName,
                    description: line.description || entry.description,
                    type: entry.type,
                    debit: line.debit,
                    credit: line.credit,
                    balance: 0,
                    userId: entry.userId,
                    costCenter: line.costCenter,
                    currency: entry.currency,
                    isException,
                    exceptionReason
                });
            });
        });
        return flat.sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
    }, [glData]);

    const filteredData = useMemo(() => {
        return transactions.filter(tx => {
            if (filterMode === 'date') {
                if (dateFrom && tx.transactionDate < dateFrom) return false;
                if (dateTo && tx.transactionDate > dateTo) return false;
            } else {
                const txPeriod = tx.transactionDate.substring(0, 7);
                if (periodFrom && txPeriod < periodFrom) return false;
                if (periodTo && txPeriod > periodTo) return false;
            }

            if (accountFilter && !tx.accountCode.includes(accountFilter) && !tx.accountName.toLowerCase().includes(accountFilter.toLowerCase())) return false;
            if (typeFilter && tx.type !== typeFilter) return false;
            if (userFilter && !tx.userId.toLowerCase().includes(userFilter.toLowerCase())) return false;
            if (costCenterFilter && !tx.costCenter?.toLowerCase().includes(costCenterFilter.toLowerCase())) return false;
            
            const amount = Math.max(tx.debit, tx.credit);
            if (minAmount && amount < parseFloat(minAmount)) return false;
            if (maxAmount && amount > parseFloat(maxAmount)) return false;

            return true;
        });
    }, [transactions, filterMode, periodFrom, periodTo, dateFrom, dateTo, accountFilter, typeFilter, userFilter, minAmount, maxAmount, costCenterFilter]);

    const totals = useMemo(() => {
        const debit = filteredData.reduce((acc, curr) => acc + curr.debit, 0);
        const credit = filteredData.reduce((acc, curr) => acc + curr.credit, 0);
        return { debit, credit, net: debit - credit };
    }, [filteredData]);

    const handleExport = (format: string) => {
        setShowExportMenu(false);
        setIsExporting(true);
        try {
            const data = dataService.prepareGLExport(filteredData);
            if (format === 'CSV' || format === 'Excel') {
                dataService.downloadCSV(data, 'GL_Report');
            } else if (format === 'JSON') {
                dataService.downloadJSON(data, 'GL_Report');
            }
            addToast(`Report downloaded successfully`, 'success');
        } catch(e) {
            addToast('Export failed', 'error');
        }
        setIsExporting(false);
    };

    const sidebarVariants = {
        open: { width: 320, opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 } },
        closed: { width: 0, opacity: 0, x: -20, transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 } }
    };

    return (
        <div className="flex flex-col lg:flex-row h-full bg-white relative overflow-hidden">
            {/* ... (Sidebar and Layout identical to previous version, just ensuring full component return) ... */}
            <AnimatePresence mode="wait">
                {showFilters && (
                    <motion.div 
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={sidebarVariants}
                        className="shrink-0 flex flex-col border-r border-slate-200 h-full bg-slate-50/80 backdrop-blur-sm z-30 overflow-hidden"
                    >
                       {/* Sidebar Content (Query Builder) */}
                       <div className="p-5 h-full overflow-y-auto scrollbar-thin w-[320px]">
                            <div className="flex items-center justify-between mb-6 text-slate-800 pb-2 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm"><Filter size={14} /></div>
                                    <h3 className="font-bold text-sm">Query Builder</h3>
                                </div>
                                <button 
                                    onClick={() => setShowFilters(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200/50 rounded-md transition-colors"
                                    title="Collapse Sidebar"
                                >
                                    <PanelLeftClose size={16} />
                                </button>
                            </div>

                            <FilterSection title="Time Horizon">
                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex mb-3 bg-slate-100 p-0.5 rounded-lg">
                                        <button onClick={() => setFilterMode('period')} className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${filterMode === 'period' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-400'}`}>Fiscal Period</button>
                                        <button onClick={() => setFilterMode('date')} className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${filterMode === 'date' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-400'}`}>Custom Date</button>
                                    </div>
                                    {filterMode === 'period' ? (
                                        <div className="space-y-2">
                                            <ProfessionalDropdown options={FISCAL_PERIODS} value={periodFrom} onChange={setPeriodFrom} placeholder="From" className="w-full"/>
                                            <div className="flex justify-center"><ChevronDown size={12} className="text-slate-300"/></div>
                                            <ProfessionalDropdown options={FISCAL_PERIODS} value={periodTo} onChange={setPeriodTo} placeholder="To" className="w-full"/>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <ModernInput type="date" label="Start" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="mb-0" />
                                            <ModernInput type="date" label="End" value={dateTo} onChange={e => setDateTo(e.target.value)} className="mb-0" />
                                        </div>
                                    )}
                                </div>
                            </FilterSection>

                            <FilterSection title="Entity & Type">
                                <ModernInput label="Account Code / Name" icon={<Hash size={14}/>} value={accountFilter} onChange={e => setAccountFilter(e.target.value)} className="mb-0"/>
                                <div className="mt-3 relative z-20">
                                    <ProfessionalDropdown label="Journal Type" placeholder="All Types" options={[{ id: '', label: 'All Types' }, ...Object.values(JournalType).map(t => ({ id: t, label: t }))]} value={typeFilter} onChange={(val) => setTypeFilter(val as string)}/>
                                </div>
                            </FilterSection>

                            <FilterSection title="Dimensions & Values">
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <ModernInput label="Min $" type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="mb-0"/>
                                    <ModernInput label="Max $" type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="mb-0"/>
                                </div>
                                <ModernInput label="Cost Center" icon={<Layers size={14}/>} value={costCenterFilter} onChange={e => setCostCenterFilter(e.target.value)} className="mb-0"/>
                                <ModernInput label="User ID" icon={<User size={14}/>} value={userFilter} onChange={e => setUserFilter(e.target.value)} className="mb-0"/>
                            </FilterSection>

                            <Button onClick={() => {
                                setAccountFilter(''); setTypeFilter(''); setMinAmount(''); setCostCenterFilter(''); setUserFilter('');
                            }} variant="ghost" className="w-full mt-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-dashed border-slate-300">
                                <RefreshCw size={12} /> Reset All
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col h-full bg-white relative z-10 min-w-0">
                {/* Toolbar */}
                <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className={`transition-colors ${!showFilters ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                            {showFilters ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                            <span className="ml-2 hidden sm:inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                        </Button>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            {accountFilter && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">Account: {accountFilter} <X size={10} className="cursor-pointer" onClick={() => setAccountFilter('')}/></span>}
                            {filteredData.length > 0 && <span className="text-xs text-slate-500 font-medium">{filteredData.length} records found</span>}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                                <GridIcon size={12} /> Data
                            </button>
                            <button onClick={() => setViewMode('analytics')} className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${viewMode === 'analytics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                                <BarChart3 size={12} /> Insights
                            </button>
                        </div>
                        <div className="relative">
                            <Button variant="secondary" size="sm" className="h-8 shadow-none border-slate-200" onClick={() => setShowExportMenu(!showExportMenu)} disabled={isExporting}>
                                {isExporting ? <Loader2 className="animate-spin" size={14}/> : <Download size={14} />} 
                                <span className="ml-2">Export</span>
                            </Button>
                            <AnimatePresence>
                                {showExportMenu && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 p-1 z-50">
                                        {['Excel', 'CSV', 'JSON'].map(fmt => (
                                            <button key={fmt} onClick={() => handleExport(fmt)} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg">
                                                {fmt} Format
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Grid Area */}
                <div className="flex-1 overflow-auto bg-white relative">
                    {transactions.length === 0 && viewMode === 'grid' ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="bg-slate-50 p-4 rounded-full mb-3">
                                <Search size={24} className="opacity-50"/>
                            </div>
                            <p className="font-medium">No posted transactions found</p>
                            <p className="text-xs mt-1">Start by creating journal entries.</p>
                        </div>
                    ) : viewMode === 'analytics' ? (
                        <div className="p-8"><GLAnalytics transactions={filteredData} /></div>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 w-10"></th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Journal ID</th>
                                    <th className="px-4 py-3">Account</th>
                                    <th className="px-4 py-3 w-64">Description</th>
                                    <th className="px-4 py-3 text-right">Debit</th>
                                    <th className="px-4 py-3 text-right">Credit</th>
                                    <th className="px-4 py-3 text-center">User</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence>
                                {filteredData.map((tx) => (
                                    <motion.tr 
                                        key={tx.id} 
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        onClick={() => setSelectedTransaction(tx)}
                                        className={`
                                            cursor-pointer transition-colors border-l-4 group
                                            ${selectedTransaction?.id === tx.id ? 'bg-indigo-50 border-l-indigo-600' : 'hover:bg-slate-50 border-l-transparent'}
                                            ${tx.isException ? 'bg-amber-50/40' : ''}
                                        `}
                                    >
                                        <td className="px-4 py-2.5 text-center">
                                            {tx.isException && <AlertTriangle size={14} className="text-amber-500" />}
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-slate-600 text-xs">{tx.transactionDate}</td>
                                        <td className="px-4 py-2.5 font-mono text-indigo-600 font-bold text-xs group-hover:underline">{tx.journalNumber}</td>
                                        <td className="px-4 py-2.5">
                                            <div className="font-bold text-slate-700 text-xs">{tx.accountCode}</div>
                                            <div className="text-[10px] text-slate-400 truncate w-32">{tx.accountName}</div>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate text-xs">{tx.description}</td>
                                        <td className="px-4 py-2.5 text-right font-mono text-slate-700">{tx.debit > 0 ? tx.debit.toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}</td>
                                        <td className="px-4 py-2.5 text-right font-mono text-slate-700">{tx.credit > 0 ? tx.credit.toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}</td>
                                        <td className="px-4 py-2.5 text-center text-[10px]"><span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{tx.userId}</span></td>
                                    </motion.tr>
                                ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Live Reconciliation Strip */}
                <div className="h-12 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filtered Totals</span>
                    <div className="flex gap-8 font-mono text-sm">
                        <div className="flex gap-2 items-center">
                            <span className="text-slate-400 text-xs">DR</span>
                            <span className="font-bold text-emerald-400">{totals.debit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className="text-slate-400 text-xs">CR</span>
                            <span className="font-bold text-emerald-400">{totals.credit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-700"></div>
                        <div className="flex gap-2 items-center">
                            <span className="text-slate-400 text-xs">NET</span>
                            <span className={totals.net === 0 ? 'text-slate-200' : 'text-amber-400'}>{totals.net.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DIGITAL VOUCHER PANE --- */}
            <AnimatePresence>
                {selectedTransaction && (
                    <motion.div 
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="absolute right-0 top-0 bottom-0 w-[450px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col"
                    >
                        {/* ... (Voucher Content kept same) ... */}
                        <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/80 backdrop-blur-sm">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                <FileText size={16} className="text-indigo-600"/> Digital Voucher
                            </h4>
                            <button onClick={() => setSelectedTransaction(null)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-[#fcfcfc]">
                            <div className="mb-6 p-4 bg-white border border-slate-100 rounded-xl shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-10 -mt-10"></div>
                                <h2 className="text-2xl font-bold text-slate-800 font-mono mb-1">{selectedTransaction.journalNumber}</h2>
                                <Badge type="success">POSTED</Badge>
                                <p className="text-sm text-slate-600 mt-4 leading-relaxed">{selectedTransaction.description}</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Line Detail</h5>
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-sm">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-500">Account</span>
                                            <span className="font-bold text-slate-800">{selectedTransaction.accountCode}</span>
                                        </div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-500">Classification</span>
                                            <span className="text-slate-700">{selectedTransaction.accountName}</span>
                                        </div>
                                        <div className="border-t border-slate-200 my-2"></div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-indigo-700 uppercase">{selectedTransaction.debit > 0 ? 'Debit' : 'Credit'}</span>
                                            <span className="font-mono text-lg font-bold text-slate-900">
                                                {Math.max(selectedTransaction.debit, selectedTransaction.credit).toLocaleString(undefined, {style: 'currency', currency: 'USD'})}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
