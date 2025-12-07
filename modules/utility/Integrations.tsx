
import React, { useState } from 'react';
import { Card, SectionHeader, Button, Badge } from '../../components/ui/UtilityComponents';
import { IntegrationApp } from '../../types';
import { Link2, ExternalLink, RefreshCw, Check, Power, AlertCircle } from 'lucide-react';

const INITIAL_APPS: IntegrationApp[] = [
    { id: '1', name: 'Stripe Payments', category: 'Payment', status: 'Connected', lastSync: '10 mins ago' },
    { id: '2', name: 'Chase Bank Feed', category: 'Banking', status: 'Connected', lastSync: '1 hour ago' },
    { id: '3', name: 'Slack Notifications', category: 'Communication', status: 'Disconnected' },
    { id: '4', name: 'AWS S3 Backup', category: 'Storage', status: 'Connected', lastSync: '1 day ago' },
    { id: '5', name: 'Avalara Tax', category: 'Banking', status: 'Pending' },
];

export const Integrations: React.FC = () => {
    const [apps, setApps] = useState<IntegrationApp[]>(INITIAL_APPS);

    const toggleConnection = (id: string) => {
        setApps(apps.map(app => {
            if (app.id === id) {
                return { 
                    ...app, 
                    status: app.status === 'Connected' ? 'Disconnected' : 'Connected',
                    lastSync: app.status === 'Connected' ? undefined : 'Just now'
                };
            }
            return app;
        }));
    };

    return (
        <div className="space-y-6">
            <SectionHeader 
                title="Integrations & Connections" 
                description="Manage secure connections to banking institutions, payment gateways, and third-party APIs."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apps.map(app => (
                    <Card key={app.id} className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm
                                    ${app.status === 'Connected' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}
                                `}>
                                    {app.name.charAt(0)}
                                </div>
                                <Badge type={
                                    app.status === 'Connected' ? 'success' : 
                                    app.status === 'Pending' ? 'warning' : 'neutral'
                                }>
                                    {app.status}
                                </Badge>
                            </div>
                            <h4 className="font-bold text-slate-800">{app.name}</h4>
                            <p className="text-xs text-slate-500 mb-4">{app.category} Integration</p>
                            
                            {app.status === 'Connected' && (
                                <div className="text-xs text-slate-500 flex items-center gap-1 mb-6">
                                    <RefreshCw size={12} /> Synced {app.lastSync}
                                </div>
                            )}
                             {app.status === 'Disconnected' && (
                                <div className="text-xs text-slate-400 flex items-center gap-1 mb-6 italic">
                                    <Power size={12} /> Connection inactive
                                </div>
                            )}
                             {app.status === 'Pending' && (
                                <div className="text-xs text-amber-600 flex items-center gap-1 mb-6">
                                    <AlertCircle size={12} /> Configuration required
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex gap-2">
                             <Button 
                                size="sm" 
                                variant={app.status === 'Connected' ? 'secondary' : 'primary'} 
                                className="w-full"
                                onClick={() => toggleConnection(app.id)}
                            >
                                {app.status === 'Connected' ? 'Disconnect' : 'Connect'}
                            </Button>
                            <Button size="sm" variant="ghost" className="px-2 text-slate-400 hover:text-indigo-600">
                                <ExternalLink size={16} />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
