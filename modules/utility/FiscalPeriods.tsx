
import React, { useState } from 'react';
import { Card, SectionHeader, Button, Badge } from '../../components/ui/UtilityComponents';
import { PeriodStatus, FiscalPeriod } from '../../types';
import { Calendar, AlertTriangle, CheckCircle, Clock, Sparkles, Loader2, Settings } from 'lucide-react';
import { analyzePolicyImpact } from '../../services/geminiService';
import { ModernInput } from '../../components/ui/ModernInput';
import { ProfessionalDropdown } from '../../components/ui/ProfessionalDropdown';

const INITIAL_PERIODS: FiscalPeriod[] = [
    { id: 'p1', name: 'Period 1 (Jan)', startDate: '2025-01-01', endDate: '2025-01-31', status: PeriodStatus.CLOSED },
    { id: 'p2', name: 'Period 2 (Feb)', startDate: '2025-02-01', endDate: '2025-02-28', status: PeriodStatus.CLOSED },
    { id: 'p3', name: 'Period 3 (Mar)', startDate: '2025-03-01', endDate: '2025-03-31', status: PeriodStatus.CLOSED },
    { id: 'p4', name: 'Period 4 (Apr)', startDate: '2025-04-01', endDate: '2025-04-30', status: PeriodStatus.OPEN },
    { id: 'p5', name: 'Period 5 (May)', startDate: '2025-05-01', endDate: '2025-05-31', status: PeriodStatus.FUTURE },
];

const MONTHS = [
    { id: '1', label: 'January' },
    { id: '2', label: 'February' },
    { id: '3', label: 'March' },
    { id: '4', label: 'April' },
    { id: '5', label: 'May' },
    { id: '6', label: 'June' },
    { id: '7', label: 'July' },
    { id: '8', label: 'August' },
    { id: '9', label: 'September' },
    { id: '10', label: 'October' },
    { id: '11', label: 'November' },
    { id: '12', label: 'December' },
];

export const FiscalPeriods: React.FC = () => {
    const [periods, setPeriods] = useState<FiscalPeriod[]>(INITIAL_PERIODS);
    const [testDate, setTestDate] = useState('');
    const [startMonth, setStartMonth] = useState('1');
    
    // Policy Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [policyAnalysis, setPolicyAnalysis] = useState<string | null>(null);

    const toggleStatus = (id: string) => {
        setPeriods(periods.map(p => {
            if (p.id === id) {
                const nextStatus = p.status === PeriodStatus.OPEN ? PeriodStatus.CLOSED : PeriodStatus.OPEN;
                return { ...p, status: nextStatus };
            }
            return p;
        }));
    };

    const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\D/g, ''); 
        if (v.length > 8) v = v.slice(0, 8);
        let formatted = v;
        if (v.length > 4) {
            formatted = `${v.slice(0, 2)}-${v.slice(2, 4)}-${v.slice(4)}`;
        } else if (v.length > 2) {
            formatted = `${v.slice(0, 2)}-${v.slice(2)}`;
        }
        setTestDate(formatted);
    };
    
    const handleAnalyzePolicy = async () => {
        setIsAnalyzing(true);
        const description = "Allowing users to backdate transactions into closed periods within a 5-day grace period.";
        const result = await analyzePolicyImpact(description);
        setPolicyAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="space-y-6">
            <SectionHeader 
                title="Fiscal Policy & Period Control" 
                description="Manage open/closed periods and enforce date formats system-wide."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                <Calendar size={18} /> Fiscal Year 2025
                            </h4>
                            <span className="text-xs text-slate-500">Current System Date: {new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-medium text-slate-500">Period Name</th>
                                        <th className="px-6 py-3 font-medium text-slate-500">Date Range</th>
                                        <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                                        <th className="px-6 py-3 font-medium text-slate-500 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {periods.map(p => (
                                        <tr key={p.id} className={p.status === PeriodStatus.OPEN ? 'bg-indigo-50/30' : ''}>
                                            <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                                            <td className="px-6 py-4 font-mono text-slate-600 text-xs">
                                                {p.startDate} <span className="text-slate-300 mx-1">→</span> {p.endDate}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge type={
                                                    p.status === PeriodStatus.OPEN ? 'success' : 
                                                    p.status === PeriodStatus.CLOSED ? 'error' : 'neutral'
                                                }>{p.status}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {p.status !== PeriodStatus.FUTURE && (
                                                    <button 
                                                        onClick={() => toggleStatus(p.id)}
                                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                                                    >
                                                        {p.status === PeriodStatus.OPEN ? 'Close Period' : 'Re-open'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                     <Card className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="text-indigo-500" size={20} />
                            <h4 className="font-semibold text-slate-800">Date Engine Test</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                            System enforces <strong>DD-MM-YYYY</strong>. Dashes are inserted automatically.
                        </p>
                        <div className="relative">
                            <ModernInput 
                                label="Transaction Date (DD-MM-YYYY)"
                                value={testDate}
                                onChange={handleDateInput}
                                maxLength={10}
                                icon={<Calendar size={18} />}
                            />
                            {testDate.length === 10 && (
                                <div className="absolute right-3 top-4 text-emerald-500">
                                    <CheckCircle size={20} />
                                </div>
                            )}
                        </div>
                        <div className="mt-1 p-2 bg-slate-100 rounded text-xs text-slate-500 font-mono">
                            System Timestamp (UTC): {new Date().toISOString()}
                        </div>
                     </Card>

                     <Card className="p-5 border-l-4 border-l-indigo-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Settings className="text-slate-600" size={18} />
                                <h4 className="font-semibold text-slate-800">Company Policies</h4>
                            </div>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={handleAnalyzePolicy}
                                disabled={isAnalyzing}
                                className="text-[10px] bg-amber-50 text-amber-700 hover:bg-amber-100 h-7"
                            >
                                {isAnalyzing ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10} />}
                                {isAnalyzing ? '...' : 'Analyze Risk'}
                            </Button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-1">
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fiscal Year Start</label>
                                 <ProfessionalDropdown 
                                    options={MONTHS} 
                                    value={startMonth} 
                                    onChange={(val) => setStartMonth(val as string)} 
                                    placeholder="Select Month"
                                 />
                                 <p className="text-[10px] text-slate-400 mt-1">Defines the opening balance date for financial reporting.</p>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="text-amber-500" size={16} />
                                    <span className="font-bold text-sm text-slate-700">Backdating Control</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Allow Backdating</span>
                                        <div className="w-10 h-5 bg-indigo-600 rounded-full relative cursor-pointer">
                                            <div className="w-3 h-3 bg-white rounded-full absolute right-1 top-1"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Grace Period (Days)</label>
                                        <input type="number" value={5} className="w-full mt-1 border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500" readOnly />
                                        <p className="text-xs text-slate-400 mt-1">Users can post to closed periods within this window.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {policyAnalysis && (
                            <div className="mt-4 p-3 bg-white/80 border border-amber-200 rounded text-xs text-slate-700 leading-relaxed shadow-sm animate-in fade-in slide-in-from-top-2">
                                <h5 className="font-bold text-amber-800 mb-1 flex items-center gap-1">
                                    <Sparkles size={10} /> AI Risk Assessment
                                </h5>
                                {policyAnalysis.split('\n').filter(line => line.trim()).map((line, i) => (
                                    <p key={i} className="mb-1 last:mb-0">{line}</p>
                                ))}
                            </div>
                        )}
                     </Card>
                </div>
            </div>
        </div>
    );
};
