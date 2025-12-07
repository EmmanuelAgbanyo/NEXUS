
import React, { useState } from 'react';
import { Card, SectionHeader, Button, Badge } from '../../components/ui/UtilityComponents';
import { Download, Upload, Database, FileSpreadsheet, AlertTriangle, CheckCircle, RefreshCw, Clock, HardDrive, Shield, Search, FileText, ChevronRight, Cloud, MoreHorizontal, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'export' | 'import' | 'backup';

// Mock Data for Backups
const INITIAL_BACKUPS = [
    { id: 'bk_001', date: '2025-04-10 23:00:00', size: '45.2 MB', type: 'Automated', status: 'Healthy' },
    { id: 'bk_002', date: '2025-04-03 23:00:00', size: '44.8 MB', type: 'Automated', status: 'Healthy' },
    { id: 'bk_003', date: '2025-03-27 23:00:00', size: '42.1 MB', type: 'Manual', status: 'Healthy' },
];

const EXPORT_MODULES = [
    { id: 'coa', name: 'Chart of Accounts', format: 'CSV', lastExport: 'Never', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'journals', name: 'Posted Journals', format: 'CSV', lastExport: '2025-04-10', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'users', name: 'User Directory', format: 'Excel', lastExport: '2025-03-15', icon: Shield, color: 'text-violet-600 bg-violet-50' },
    { id: 'audit', name: 'Audit Logs', format: 'JSON', lastExport: '2025-04-11', icon: Database, color: 'text-amber-600 bg-amber-50' },
    { id: 'gl', name: 'General Ledger', format: 'Excel', lastExport: 'Never', icon: HardDrive, color: 'text-blue-600 bg-blue-50' },
];

export const DataManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('export');
    const [searchTerm, setSearchTerm] = useState('');

    // Import State
    const [importType, setImportType] = useState('journals');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importStatus, setImportStatus] = useState<'idle' | 'scanning' | 'ready' | 'success'>('idle');
    const [scanResult, setScanResult] = useState({ rows: 0, errors: 0 });

    // Backup State
    const [backups, setBackups] = useState(INITIAL_BACKUPS);
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);

    // --- Actions ---

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImportFile(e.target.files[0]);
            setImportStatus('idle');
        }
    };

    const runImportScan = () => {
        if (!importFile) return;
        setImportStatus('scanning');
        setTimeout(() => {
            setScanResult({ rows: 142, errors: 0 }); // Mock result
            setImportStatus('ready');
        }, 1500);
    };

    const executeImport = () => {
        setImportStatus('success');
        setTimeout(() => {
            setImportFile(null);
            setImportStatus('idle');
            alert("Data imported successfully into the system.");
        }, 1000);
    };

    const createBackup = () => {
        setIsCreatingBackup(true);
        setTimeout(() => {
            const newBackup = {
                id: `bk_${Math.floor(Math.random() * 1000)}`,
                date: new Date().toISOString().replace('T', ' ').substring(0, 19),
                size: '45.3 MB',
                type: 'Manual',
                status: 'Healthy'
            };
            setBackups([newBackup, ...backups]);
            setIsCreatingBackup(false);
        }, 2000);
    };

    const tabs = [
        { id: 'export', label: 'Data Export', icon: Download },
        { id: 'import', label: 'Bulk Import', icon: Upload },
        { id: 'backup', label: 'Backup & Restore', icon: Database },
    ];

    const filteredExports = EXPORT_MODULES.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-8 min-h-[600px]">
            <SectionHeader 
                title="Data Lifecycle Engine" 
                description="Centralized control for data migration, backups, and compliance reporting."
                action={
                     <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-500">
                        <Cloud size={14} /> Server Status: Online
                     </div>
                }
            />

            {/* Liquid Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-1">
                <div className="bg-slate-100/80 p-1.5 rounded-xl flex gap-1 relative">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`
                                relative px-5 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 outline-none z-10
                                ${activeTab === tab.id ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}
                            `}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeDataTab"
                                    className="absolute inset-0 bg-white shadow-sm border border-slate-200/50 rounded-lg"
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
                
                {activeTab === 'export' && (
                     <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Filter modules..." 
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                            <Command size={10} className="text-slate-300"/> 
                            <span className="text-[10px] text-slate-300 font-bold">K</span>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                >
                    {/* --- EXPORT TAB --- */}
                    {activeTab === 'export' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredExports.map((mod, idx) => (
                                        <motion.div 
                                            key={mod.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Card className="group hover:border-indigo-300 transition-colors cursor-pointer">
                                                <div className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mod.color}`}>
                                                            <mod.icon size={22} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{mod.name}</h4>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <Badge type="neutral">{mod.format}</Badge>
                                                                <span className="text-xs text-slate-400">Last: {mod.lastExport}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full w-10 h-10 p-0 flex items-center justify-center">
                                                        <Download size={18} />
                                                    </Button>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                    <div className="relative z-10">
                                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                                            <Shield size={20} className="text-emerald-400"/>
                                        </div>
                                        <h4 className="font-bold mb-2">Secure Export</h4>
                                        <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                            Sensitive PII fields are automatically hashed upon export. All download events are logged in the immutable audit trail.
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono bg-black/20 p-2 rounded">
                                            <CheckCircle size={12} className="text-emerald-500"/> Encryption: AES-256
                                        </div>
                                    </div>
                                </div>
                                <Card className="p-5">
                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Activity</h5>
                                    <div className="space-y-4">
                                        {[1, 2].map((_, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                                                    MT
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">Full GL Dump</p>
                                                    <p className="text-xs text-slate-500">2 hours ago</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* --- IMPORT TAB --- */}
                    {activeTab === 'import' && (
                        <div className="max-w-3xl mx-auto">
                            <Card className="overflow-hidden shadow-lg border-slate-200">
                                <div className="bg-slate-50 border-b border-slate-100 p-8 text-center">
                                    <div className="inline-flex p-3 bg-white rounded-2xl shadow-sm mb-4">
                                        <Upload className="text-indigo-600" size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">Bulk Data Import</h3>
                                    <p className="text-slate-500 text-sm mt-1">Update system records via standardized templates</p>
                                </div>

                                <div className="p-8 space-y-8">
                                    {/* Step Indicators */}
                                    <div className="flex items-center justify-center gap-4 text-sm font-medium text-slate-400 mb-8">
                                        <span className={`flex items-center gap-2 ${importStatus === 'idle' ? 'text-indigo-600' : ''}`}>
                                            <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs border-current">1</span> Upload
                                        </span>
                                        <div className="w-12 h-px bg-slate-200"></div>
                                        <span className={`flex items-center gap-2 ${importStatus === 'scanning' ? 'text-indigo-600' : ''}`}>
                                            <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs border-current">2</span> Validate
                                        </span>
                                        <div className="w-12 h-px bg-slate-200"></div>
                                        <span className={`flex items-center gap-2 ${importStatus === 'success' ? 'text-emerald-600' : ''}`}>
                                            <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs border-current">3</span> Finish
                                        </span>
                                    </div>

                                    {importStatus === 'success' ? (
                                        <div className="text-center py-8 animate-in zoom-in-95">
                                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                                                <CheckCircle size={40} />
                                            </div>
                                            <h4 className="text-2xl font-bold text-slate-900 mb-2">Import Successful</h4>
                                            <p className="text-slate-500 mb-8">142 records have been processed and indexed.</p>
                                            <Button onClick={() => { setImportStatus('idle'); setImportFile(null); }}>Process Another File</Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Target Entity</label>
                                                    <select 
                                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                        value={importType}
                                                        onChange={(e) => setImportType(e.target.value)}
                                                    >
                                                        <option value="journals">Journal Entries</option>
                                                        <option value="coa">Chart of Accounts</option>
                                                        <option value="vendors">Vendor Master</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Template</label>
                                                    <button className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-between group">
                                                        <span>Download .XLSX</span>
                                                        <Download size={16} className="text-slate-400 group-hover:text-indigo-600"/>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="relative group">
                                                <div className={`
                                                    border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300
                                                    ${importFile ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
                                                `}>
                                                    <input 
                                                        type="file" 
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        onChange={handleFileUpload}
                                                        accept=".csv, .xlsx"
                                                    />
                                                    
                                                    {importFile ? (
                                                        <div className="animate-in fade-in zoom-in-95">
                                                            <FileSpreadsheet size={40} className="mx-auto text-emerald-500 mb-4" />
                                                            <p className="font-bold text-slate-800">{importFile.name}</p>
                                                            <p className="text-xs text-slate-500 mt-1">{(importFile.size / 1024).toFixed(1)} KB • Ready to scan</p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                                <Cloud size={28} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                                            </div>
                                                            <p className="font-semibold text-slate-700">Click or drag file here</p>
                                                            <p className="text-xs text-slate-400 mt-1">Max file size: 10MB</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {importStatus === 'idle' && (
                                                <Button 
                                                    className="w-full py-3 text-base" 
                                                    disabled={!importFile} 
                                                    onClick={runImportScan}
                                                >
                                                    Start Validation Scan
                                                </Button>
                                            )}

                                            {importStatus === 'scanning' && (
                                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                                                    <RefreshCw className="animate-spin mx-auto text-indigo-600 mb-3" size={24} />
                                                    <p className="font-medium text-slate-700">Analyzing data structure...</p>
                                                    <p className="text-xs text-slate-500 mt-1">Checking COA codes and date formats</p>
                                                </div>
                                            )}

                                            {importStatus === 'ready' && (
                                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-2">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2 bg-white rounded-full shadow-sm text-emerald-600">
                                                            <CheckCircle size={24} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-emerald-900">Validation Passed</h4>
                                                            <p className="text-sm text-emerald-800 mt-1">
                                                                <strong>{scanResult.rows} records</strong> valid. No critical errors found.
                                                            </p>
                                                            <div className="mt-4 flex gap-3">
                                                                <Button onClick={executeImport} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">Confirm & Import</Button>
                                                                <Button variant="ghost" onClick={() => { setImportFile(null); setImportStatus('idle'); }}>Cancel</Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* --- BACKUP TAB --- */}
                    {activeTab === 'backup' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h4 className="font-bold text-slate-700">Restore Points</h4>
                                        <Button size="sm" onClick={createBackup} disabled={isCreatingBackup}>
                                            {isCreatingBackup ? <RefreshCw className="animate-spin" size={14} /> : <Database size={14} />}
                                            {isCreatingBackup ? 'Snapshotted...' : 'Create Snapshot'}
                                        </Button>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-3">Timestamp (UTC)</th>
                                                <th className="px-6 py-3">Size</th>
                                                <th className="px-6 py-3">Trigger</th>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {backups.map(bk => (
                                                <tr key={bk.id} className="group hover:bg-indigo-50/30 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-slate-700 flex items-center gap-3">
                                                        <div className="p-1.5 bg-slate-100 rounded text-slate-500 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                                                            <Clock size={14} />
                                                        </div>
                                                        {bk.date}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">{bk.size}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${bk.type === 'Automated' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-violet-50 text-violet-700 border-violet-200'}`}>
                                                            {bk.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge type="success">{bk.status}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                                                            <MoreHorizontal size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Card>
                            </div>
                            <div className="space-y-6">
                                <Card className="p-6 border-l-4 border-l-indigo-500">
                                    <h4 className="font-bold text-slate-800 mb-4">Retention Policy</h4>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between pb-2 border-b border-slate-100">
                                            <span className="text-slate-500">Daily Snapshots</span>
                                            <span className="font-mono font-bold text-slate-700">30 Days</span>
                                        </div>
                                        <div className="flex justify-between pb-2 border-b border-slate-100">
                                            <span className="text-slate-500">Monthly Archives</span>
                                            <span className="font-mono font-bold text-slate-700">7 Years</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Storage Region</span>
                                            <span className="font-mono font-bold text-slate-700">us-east-1</span>
                                        </div>
                                    </div>
                                </Card>
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
                                    <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                                    <div>
                                        <h5 className="text-sm font-bold text-amber-800 mb-1">Disaster Recovery</h5>
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            Initiating a restore will trigger a system-wide lock. All sessions will be terminated during the rollback process.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
