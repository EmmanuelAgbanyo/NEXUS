
import React, { useState } from 'react';
import { Card, Button } from '../../components/ui/UtilityComponents';
import { TrialBalanceLine, AccountType } from '../../types';
import { ChevronRight, TrendingUp, TrendingDown, Minus, Search, ArrowRight, Download, Loader2, Check, BarChart2, Eye, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { dataService } from '../../services/dataService';
import { useToast } from '../../components/ui/Toast';

// Mock TB Data (would typically come from aggregated journals in localStorage)
const MOCK_TB: TrialBalanceLine[] = [
    { accountCode: '10000', accountName: 'Assets', type: AccountType.ASSET, currentDebit: 1500000, currentCredit: 0, currentNet: 1500000, priorNet: 1400000, variance: 100000, variancePercent: 7.14, level: 0, hasChildren: true },
    { accountCode: '10100', accountName: 'Current Assets', type: AccountType.ASSET, currentDebit: 250000, currentCredit: 0, currentNet: 250000, priorNet: 200000, variance: 50000, variancePercent: 25.0, level: 1, hasChildren: true },
    { accountCode: '10110', accountName: 'Cash in Bank', type: AccountType.ASSET, currentDebit: 150000, currentCredit: 0, currentNet: 150000, priorNet: 120000, variance: 30000, variancePercent: 25.0, level: 2, hasChildren: false },
    { accountCode: '10120', accountName: 'Petty Cash', type: AccountType.ASSET, currentDebit: 5000, currentCredit: 0, currentNet: 5000, priorNet: 5000, variance: 0, variancePercent: 0.0, level: 2, hasChildren: false },
    { accountCode: '30000', accountName: 'Liabilities', type: AccountType.LIABILITY, currentDebit: 0, currentCredit: 450000, currentNet: -450000, priorNet: -400000, variance: -50000, variancePercent: 12.5, level: 0, hasChildren: true },
    { accountCode: '50000', accountName: 'Expenses', type: AccountType.EXPENSE, currentDebit: 125000, currentCredit: 0, currentNet: 125000, priorNet: 110000, variance: 15000, variancePercent: 13.6, level: 0, hasChildren: true },
    { accountCode: '50100', accountName: 'Rent Expense', type: AccountType.EXPENSE, currentDebit: 12000, currentCredit: 0, currentNet: 12000, priorNet: 12000, variance: 0, variancePercent: 0.0, level: 1, hasChildren: false },
];

interface TrialBalanceViewProps {
    onDrillDown: (accountCode: string) => void;
}

export const TrialBalanceView: React.FC<TrialBalanceViewProps> = ({ onDrillDown }) => {
    const { addToast } = useToast();
    
    // Max value for scaling bars
    const maxVal = Math.max(...MOCK_TB.map(r => Math.abs(r.currentNet)));

    const handleExport = () => {
        try {
            dataService.downloadCSV(MOCK_TB, 'Trial_Balance_Report');
            addToast('Trial Balance exported successfully', 'success');
        } catch(e) {
            addToast('Export failed', 'error');
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Toolbar */}
            <div className="px-6 py-3 border-b border-slate-200 flex justify-between items-center sticky top-0 z-20 bg-white/95 backdrop-blur shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="relative group w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                        <input 
                            className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl w-full outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                            placeholder="Filter hierarchy..."
                        />
                    </div>
                </div>
                <Button 
                    size="sm" variant="secondary" 
                    onClick={handleExport}
                    className="border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
                >
                    <Download size={14} className="mr-2" /> Export Report
                </Button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto bg-white">
                <table className="w-full text-left text-sm border-separate border-spacing-0">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 border-b border-slate-200 w-96">Account Structure</th>
                            <th className="px-6 py-3 border-b border-slate-200 text-right w-48">Net Balance</th>
                            <th className="px-6 py-3 border-b border-slate-200 text-right w-32">Prior Period</th>
                            <th className="px-6 py-3 border-b border-slate-200 text-right w-32">Variance</th>
                            <th className="px-6 py-3 border-b border-slate-200 text-center w-24">Trend</th>
                            <th className="px-6 py-3 border-b border-slate-200 w-24"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {MOCK_TB.map((row) => (
                            <motion.tr 
                                key={row.accountCode}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className={`
                                    group transition-colors relative hover:bg-slate-50
                                    ${row.level === 0 ? 'bg-slate-50/40' : ''}
                                `}
                            >
                                <td className="px-6 py-3">
                                    <div className="flex items-center" style={{ paddingLeft: `${row.level * 24}px` }}>
                                        {/* Visual Connection Line */}
                                        {row.level > 0 && (
                                            <div className="absolute left-6 top-0 bottom-0 border-l border-dashed border-slate-200" style={{ left: `${24 + (row.level * 10)}px` }}></div>
                                        )}
                                        
                                        {row.hasChildren ? (
                                            <ChevronRight size={14} className="text-slate-400 mr-2" />
                                        ) : (
                                            <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full mr-3"></div>
                                        )}
                                        
                                        <div>
                                            <div className={`font-mono text-[10px] ${row.level === 0 ? 'text-slate-400 font-bold' : 'text-indigo-400'}`}>{row.accountCode}</div>
                                            <div className={`text-sm truncate ${row.level === 0 ? 'font-bold text-slate-800' : 'text-slate-600 font-medium'}`}>{row.accountName}</div>
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="px-6 py-3 text-right relative h-full align-middle">
                                    {/* Gradient Data Bar */}
                                    <div className="absolute inset-y-3 left-4 right-0 pointer-events-none opacity-20">
                                        <div 
                                            className="h-full rounded-r bg-gradient-to-r from-transparent to-indigo-600 transition-all duration-700 ease-out"
                                            style={{ width: `${(Math.abs(row.currentNet) / maxVal) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`relative z-10 font-mono font-medium ${row.level === 0 ? 'text-base font-bold' : ''}`}>
                                        {row.currentNet.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </span>
                                </td>

                                <td className="px-6 py-3 text-right font-mono text-slate-400 text-xs">
                                    {row.priorNet.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </td>
                                
                                <td className="px-6 py-3 text-right font-mono text-xs">
                                    <span className={row.variance > 0 ? 'text-emerald-600 font-bold' : row.variance < 0 ? 'text-red-500 font-bold' : 'text-slate-300'}>
                                        {row.variance > 0 ? '+' : ''}{row.variance.toLocaleString(undefined, {minimumFractionDigits: 0})}
                                    </span>
                                </td>
                                
                                <td className="px-6 py-3 text-center">
                                    {row.variance !== 0 ? (
                                        <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${row.variance > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {row.variance > 0 ? <TrendingUp size={10} className="mr-1"/> : <TrendingDown size={10} className="mr-1"/>}
                                            {Math.abs(row.variancePercent).toFixed(1)}%
                                        </div>
                                    ) : (
                                        <Minus size={12} className="text-slate-200 mx-auto"/>
                                    )}
                                </td>

                                <td className="px-6 py-3 text-right">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                                        <button 
                                            onClick={() => onDrillDown(row.accountCode)}
                                            className="p-1.5 rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors" 
                                            title="Drill Down"
                                        >
                                            <Search size={14} />
                                        </button>
                                        <button className="p-1.5 rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors" title="View Trend">
                                            <History size={14} />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
