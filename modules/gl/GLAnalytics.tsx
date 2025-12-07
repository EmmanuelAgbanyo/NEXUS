import React from 'react';
import { Card } from '../../components/ui/UtilityComponents';
import { GLTransaction } from '../../types';
import { motion } from 'framer-motion';

interface GLAnalyticsProps {
    transactions: GLTransaction[];
}

const SimplePieChart = ({ data, colors }: { data: { label: string, value: number }[], colors: string[] }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    let currentAngle = 0;

    return (
        <div className="flex items-center gap-8 justify-center">
            <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
                    {data.map((slice, i) => {
                        if (slice.value === 0) return null;
                        const sliceAngle = (slice.value / total) * 360;
                        const x1 = 50 + 50 * Math.cos(Math.PI * currentAngle / 180);
                        const y1 = 50 + 50 * Math.sin(Math.PI * currentAngle / 180);
                        const x2 = 50 + 50 * Math.cos(Math.PI * (currentAngle + sliceAngle) / 180);
                        const y2 = 50 + 50 * Math.sin(Math.PI * (currentAngle + sliceAngle) / 180);
                        
                        const largeArc = sliceAngle > 180 ? 1 : 0;
                        
                        const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;
                        currentAngle += sliceAngle;

                        return (
                            <motion.path 
                                key={i} 
                                d={pathData} 
                                fill={colors[i % colors.length]} 
                                stroke="white" 
                                strokeWidth="2"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: i * 0.1, type: "spring" }}
                                className="hover:opacity-90 cursor-pointer transition-opacity"
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center bg-white/95 rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-sm backdrop-blur-sm"
                    >
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                        <span className="text-sm font-bold text-slate-800">{(total / 1000).toFixed(1)}k</span>
                    </motion.div>
                </div>
            </div>
            <div className="space-y-3">
                {data.map((slice, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: colors[i % colors.length] }}></div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">{slice.label}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{((slice.value / total) * 100).toFixed(1)}% <span className="mx-1 text-slate-300">|</span> ${slice.value.toLocaleString()}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const SimpleTrendLine = ({ data, color }: { data: number[], color: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 80 - 10;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-32 mt-4 relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
                        <stop offset="100%" stopColor={color} stopOpacity="0"/>
                    </linearGradient>
                </defs>
                <motion.path 
                    d={`M 0 100 L ${points} L 100 100 Z`} 
                    fill="url(#trendGradient)" 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                />
                <motion.path 
                    d={`M ${points}`} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
                {data.map((val, i) => {
                     const x = (i / (data.length - 1)) * 100;
                     const y = 100 - ((val - min) / range) * 80 - 10;
                     return (
                         <motion.circle
                            key={i}
                            cx={x} cy={y} r="2" fill="white" stroke={color} strokeWidth="2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1 + (i * 0.1) }}
                         />
                     );
                })}
            </svg>
        </div>
    );
};

export const GLAnalytics: React.FC<GLAnalyticsProps> = ({ transactions }) => {
    // 1. Expense Composition
    const expenses = transactions.filter(t => t.accountCode.startsWith('5') || t.accountCode.startsWith('6'));
    
    // Explicitly type the accumulator using generic to avoid TSX generic ambiguity
    const expenseByCat = expenses.reduce((acc, curr) => {
        const cat = curr.accountName.split(' ')[0];
        const currentAmount = acc[cat] ?? 0;
        acc[cat] = currentAmount + curr.debit;
        return acc;
    }, {} as Record<string, number>);
    
    const expenseData = Object.entries(expenseByCat)
        .map(([label, value]) => ({ label, value: value as number }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 4);

    // 2. Volume Trend
    const trendData = [10, 15, 8, 25, 20, 35, 30]; 

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            <Card className="p-6 border border-slate-200 shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        Cost Allocation
                    </h4>
                    <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded">YTD Analysis</span>
                </div>
                <SimplePieChart data={expenseData} colors={['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe']} />
            </Card>

            <Card className="p-6 border border-slate-200 shadow-md">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            Transaction Velocity
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Posting volume per fiscal week</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">+12.5%</span>
                </div>
                <SimpleTrendLine data={trendData} color="#10b981" />
                <div className="flex justify-between text-[10px] text-slate-400 mt-4 font-mono uppercase tracking-widest">
                    <span>Week 01</span>
                    <span>Week 07</span>
                </div>
            </Card>
        </div>
    );
};