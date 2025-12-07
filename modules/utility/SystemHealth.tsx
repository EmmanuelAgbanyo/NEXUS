
import React from 'react';
import { Card, SectionHeader, Badge } from '../../components/ui/UtilityComponents';
import { SystemMetric } from '../../types';
import { Activity, Server, Database, Globe, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';

const METRICS: SystemMetric[] = [
    { label: 'API Gateway Latency', value: '45ms', status: 'Healthy', trend: 'stable' },
    { label: 'Database Connection Pool', value: '12/50', status: 'Healthy', trend: 'up' },
    { label: 'Background Job Queue', value: '0 Pending', status: 'Healthy', trend: 'stable' },
    { label: 'Storage Usage (S3)', value: '45.2 GB', status: 'Healthy', trend: 'up' },
];

export const SystemHealth: React.FC = () => {
    return (
        <div className="space-y-6">
            <SectionHeader 
                title="System Health & Status" 
                description="Real-time monitoring of infrastructure, API performance, and database integrity."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {METRICS.map((metric, idx) => (
                    <Card key={idx} className="p-4 border-l-4 border-l-emerald-500">
                        <div className="flex justify-between items-start mb-2">
                            <h5 className="text-xs font-bold text-slate-500 uppercase">{metric.label}</h5>
                            <Activity size={14} className="text-emerald-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-800">{metric.value}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle size={10} /> {metric.status}
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Server size={18} className="text-indigo-600"/> Server Status
                    </h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded shadow-sm text-indigo-600"><Globe size={16}/></div>
                                <div>
                                    <div className="font-medium text-sm text-slate-700">US-East-1 Region</div>
                                    <div className="text-xs text-slate-500">Primary App Server</div>
                                </div>
                            </div>
                            <Badge type="success">Operational</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded shadow-sm text-indigo-600"><Database size={16}/></div>
                                <div>
                                    <div className="font-medium text-sm text-slate-700">RDS PostgreSQL</div>
                                    <div className="text-xs text-slate-500">v15.3 (Replica active)</div>
                                </div>
                            </div>
                            <Badge type="success">Operational</Badge>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded shadow-sm text-indigo-600"><Cpu size={16}/></div>
                                <div>
                                    <div className="font-medium text-sm text-slate-700">AI Inference Engine</div>
                                    <div className="text-xs text-slate-500">Gemini 1.5 Flash</div>
                                </div>
                            </div>
                            <Badge type="info">Idle</Badge>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500"/> Recent Alerts
                    </h4>
                    <div className="space-y-3">
                        <div className="flex gap-3 text-sm p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                             <div>
                                 <p className="text-slate-700 font-medium">High Memory Usage (85%)</p>
                                 <p className="text-slate-500 text-xs">Worker Node #4 • 15 mins ago</p>
                             </div>
                        </div>
                        <div className="flex gap-3 text-sm p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                             <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0"></div>
                             <div>
                                 <p className="text-slate-700 font-medium">Scheduled Backup Completed</p>
                                 <p className="text-slate-500 text-xs">System • 2 hours ago</p>
                             </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
