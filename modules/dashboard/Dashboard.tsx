
import React from 'react';
import { Card, Button } from '../../components/ui/UtilityComponents';
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, ArrowUpRight, ArrowRight, Clock, Plus, FileText, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
    onNavigate: (module: string, tab?: string) => void;
}

const Sparkline = ({ data, color }: { data: number[], color: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    
    // Normalize points to SVG coordinates (0-100 width, 0-30 height)
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 30 - ((val - min) / range) * 30;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="100" height="30" viewBox="0 0 100 30" className="overflow-visible">
            <path d={`M ${points}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="100" cy={30 - ((data[data.length-1] - min) / range) * 30} r="3" fill={color} />
        </svg>
    );
};

const KPICard = ({ title, value, change, trend, data, icon: Icon, color, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay }}
    >
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500`}>
                <Icon size={100} className={color} />
            </div>
            
            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('600', '50')} ${color}`}>
                    <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {change}
                </div>
            </div>
            
            <div className="relative z-10">
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight mb-1">{value}</h3>
                <p className="text-sm font-medium text-slate-500 mb-6">{title}</p>
                <div className="flex justify-between items-end">
                    <Sparkline data={data} color={trend === 'up' ? '#10b981' : '#ef4444'} />
                    <span className="text-[10px] text-slate-400 font-medium">Last 7 days</span>
                </div>
            </div>
        </div>
    </motion.div>
);

const ActivityItem = ({ title, time, user, type }: any) => (
    <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm
            ${type === 'journal' ? 'bg-indigo-100 text-indigo-600' : 
              type === 'user' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}
        `}>
            {type === 'journal' ? <DollarSign size={18} /> : 
             type === 'user' ? <Users size={18} /> : <Activity size={18} />}
        </div>
        <div className="flex-1 min-w-0">
            <h5 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{title}</h5>
            <p className="text-xs text-slate-500 mt-0.5">by {user}</p>
        </div>
        <div className="text-xs font-medium text-slate-400 flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-100">
            <Clock size={10} /> {time}
        </div>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    return (
        <div className="space-y-8 pb-10">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                    title="Total Revenue" 
                    value="$2.4M" 
                    change="+12.5%" 
                    trend="up" 
                    data={[40, 35, 55, 60, 58, 75, 80]} 
                    icon={DollarSign} 
                    color="text-emerald-600"
                    delay={0}
                />
                <KPICard 
                    title="Operating Expenses" 
                    value="$850k" 
                    change="-2.1%" 
                    trend="down" 
                    data={[60, 58, 55, 50, 48, 45, 42]} 
                    icon={Activity} 
                    color="text-indigo-600"
                    delay={0.1}
                />
                <KPICard 
                    title="Net Profit Margin" 
                    value="28%" 
                    change="+5.4%" 
                    trend="up" 
                    data={[20, 22, 21, 25, 26, 27, 28]} 
                    icon={TrendingUp} 
                    color="text-violet-600"
                    delay={0.2}
                />
                <KPICard 
                    title="Pending Journals" 
                    value="12" 
                    change="+3" 
                    trend="up" 
                    data={[5, 8, 4, 3, 6, 8, 12]} 
                    icon={Clock} 
                    color="text-amber-600"
                    delay={0.3}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Section */}
                <div className="lg:col-span-2">
                    <Card className="h-full min-h-[400px] p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Financial Performance</h3>
                                <p className="text-sm text-slate-500">Revenue vs Expenses (YTD)</p>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button className="px-3 py-1 text-xs font-bold text-slate-600 bg-white shadow-sm rounded-md">12M</button>
                                <button className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-800">6M</button>
                                <button className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-800">30D</button>
                            </div>
                        </div>
                        
                        {/* Mock Chart Visualization */}
                        <div className="flex-1 flex items-end justify-between gap-2 px-4 relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
                                <div className="border-t border-slate-200 w-full h-px"></div>
                                <div className="border-t border-slate-200 w-full h-px"></div>
                                <div className="border-t border-slate-200 w-full h-px"></div>
                                <div className="border-t border-slate-200 w-full h-px"></div>
                                <div className="border-t border-slate-200 w-full h-px"></div>
                            </div>
                            
                            {[45, 60, 55, 70, 65, 80, 75, 85, 90, 85, 95, 100].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative z-10">
                                    <div className="w-full bg-emerald-500 rounded-t-sm transition-all duration-500 hover:bg-emerald-400" style={{ height: `${h * 0.6}%` }}></div>
                                    <div className="w-full bg-indigo-500 rounded-t-sm transition-all duration-500 hover:bg-indigo-400" style={{ height: `${h * 0.35}%` }}></div>
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap z-20 transition-opacity">
                                        Jan {i+1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Sidebar: Quick Actions & Activity */}
                <div className="space-y-6">
                    <Card className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl shadow-indigo-200">
                        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => onNavigate('journals', 'new')}
                                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-left transition-colors group"
                            >
                                <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Plus size={18} />
                                </div>
                                <span className="text-xs font-bold block">New Journal</span>
                            </button>
                            <button 
                                onClick={() => onNavigate('utility', 'users')}
                                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-left transition-colors group"
                            >
                                <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Users size={18} />
                                </div>
                                <span className="text-xs font-bold block">Add User</span>
                            </button>
                            <button 
                                onClick={() => onNavigate('reports')}
                                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-left transition-colors group"
                            >
                                <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <FileText size={18} />
                                </div>
                                <span className="text-xs font-bold block">Run Reports</span>
                            </button>
                            <button 
                                onClick={() => onNavigate('gl')}
                                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-left transition-colors group"
                            >
                                <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <PieChart size={18} />
                                </div>
                                <span className="text-xs font-bold block">GL Inquiry</span>
                            </button>
                        </div>
                    </Card>

                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h4 className="font-bold text-slate-700 text-sm">Recent Activity</h4>
                            <button className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                                View All <ArrowRight size={12} />
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            <ActivityItem 
                                title="Posted Journal JE-1022" 
                                user="A. Chen" 
                                time="10m ago" 
                                type="journal" 
                            />
                            <ActivityItem 
                                title="New User Created" 
                                user="Sys Admin" 
                                time="2h ago" 
                                type="user" 
                            />
                            <ActivityItem 
                                title="Currency Rates Updated" 
                                user="System" 
                                time="5h ago" 
                                type="system" 
                            />
                             <ActivityItem 
                                title="Backup Completed" 
                                user="System" 
                                time="1d ago" 
                                type="system" 
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
