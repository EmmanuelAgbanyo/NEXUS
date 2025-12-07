
import React, { useState } from 'react';
import { Card, SectionHeader, Badge, Input } from '../../components/ui/UtilityComponents';
import { AuditLogEntry } from '../../types';
import { Search, FileText, User, Calendar, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

const INITIAL_LOGS: AuditLogEntry[] = [
    { id: 'LOG-9921', action: 'Update Rate', module: 'Currency', user: 'Marcus Thorne', timestamp: '2025-04-12 14:30:22', details: 'Updated EUR rate to 0.9250', status: 'Success' },
    { id: 'LOG-9920', action: 'Create User', module: 'Access Control', user: 'Alexandra Chen', timestamp: '2025-04-12 11:15:00', details: 'Created user account for S. Oconnell', status: 'Success' },
    { id: 'LOG-9919', action: 'Post Journal', module: 'GL', user: 'System Auto', timestamp: '2025-04-12 09:00:00', details: 'Auto-posted recurring rent journal JE-10022', status: 'Warning' },
    { id: 'LOG-9918', action: 'Export Data', module: 'Data Mgmt', user: 'Marcus Thorne', timestamp: '2025-04-11 16:45:12', details: 'Exported User Directory to CSV', status: 'Success' },
    { id: 'LOG-9917', action: 'Delete Account', module: 'COA', user: 'Alexandra Chen', timestamp: '2025-04-10 10:22:05', details: 'Failed attempt to delete system account 10000', status: 'Failed' },
];

export const AuditLogs: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const logs = INITIAL_LOGS.filter(l => 
        l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.module.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <SectionHeader 
                title="System Audit Trail" 
                description="Immutable record of all configuration changes and sensitive actions."
            />

            <Card>
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                     <div className="relative w-72">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search logs..." 
                            className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                        Showing {logs.length} events
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                                <th className="px-6 py-3 font-medium text-slate-500">Event Info</th>
                                <th className="px-6 py-3 font-medium text-slate-500">Module</th>
                                <th className="px-6 py-3 font-medium text-slate-500">User</th>
                                <th className="px-6 py-3 font-medium text-slate-500 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        {log.status === 'Success' && <ShieldCheck size={18} className="text-emerald-500" />}
                                        {log.status === 'Warning' && <AlertTriangle size={18} className="text-amber-500" />}
                                        {log.status === 'Failed' && <XCircle size={18} className="text-red-500" />}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-800">{log.action}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-xs">{log.details}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge type="neutral">{log.module}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                            {log.user.charAt(0)}
                                        </div>
                                        {log.user}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-500 text-xs">
                                        {log.timestamp}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
