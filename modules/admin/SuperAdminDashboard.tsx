
import React, { useState, useEffect } from 'react';
import { Card, SectionHeader, Button, Badge, Switch } from '../../components/ui/UtilityComponents';
import { ModernInput } from '../../components/ui/ModernInput';
import { Company, OnboardingToken, User, Role } from '../../types';
import { authService } from '../../services/authService';
import { Building, Plus, CheckCircle, Copy, Loader2, RefreshCw, X, Users, Activity, Power, ShieldAlert, Edit, Search, MoreHorizontal, ArrowRight, Eye, Key, LayoutGrid, Server, Globe, Lock, Unlock, RotateCcw, Clock, ScrollText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';

const HealthGauge = ({ score }: { score: number }) => {
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (score / 100) * circumference;
    const color = score > 80 ? 'text-emerald-500' : score > 50 ? 'text-amber-500' : 'text-red-500';

    return (
        <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="50%" cy="50%" r="40" className="stroke-slate-100" strokeWidth="8" fill="transparent" />
                <circle 
                    cx="50%" cy="50%" r="40" 
                    className={`${color} transition-all duration-1000 ease-out`} 
                    strokeWidth="8" 
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${color}`}>{score}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
            </div>
        </div>
    );
};

export const SuperAdminDashboard: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showProvisionModal, setShowProvisionModal] = useState(false);
    
    // Manage Tenant State
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [companyUsers, setCompanyUsers] = useState<User[]>([]);
    const [companyLogs, setCompanyLogs] = useState<any[]>([]);
    const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'config' | 'users' | 'logs'>('overview');
    
    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isImpersonating, setIsImpersonating] = useState(false);
    const { addToast } = useToast();

    // Provision Form State
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        features: { gl: true, ap: true, ar: true, payroll: false, inventory: false }
    });

    // Provision Success State
    const [successData, setSuccessData] = useState<OnboardingToken | null>(null);

    useEffect(() => {
        loadCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompany) {
            setCompanyUsers(authService.getCompanyUsers(selectedCompany.id));
            setCompanyLogs(authService.getTenantLogs(selectedCompany.id));
        }
    }, [selectedCompany]);

    const loadCompanies = () => {
        setCompanies(authService.getCompanies());
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.domain) return;
        setIsLoading(true);
        const result = await authService.createCompany(formData.name, formData.domain, formData.features);
        
        if (result.success && result.tokenData) {
            setSuccessData(result.tokenData);
            loadCompanies();
            addToast('Company provisioned successfully', 'success');
        } else {
            addToast('Failed to create company. Domain might be taken.', 'error');
        }
        setIsLoading(false);
    };

    const copyLink = () => {
        if (successData) {
            const url = `${window.location.origin}?token=${successData.token}`;
            navigator.clipboard.writeText(url);
            addToast('Onboarding link copied to clipboard', 'info');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            domain: '',
            features: { gl: true, ap: true, ar: true, payroll: false, inventory: false }
        });
        setSuccessData(null);
        setShowProvisionModal(false);
    };

    const toggleCompanyStatus = async (company: Company) => {
        const newStatus = company.status === 'Active' ? 'Suspended' : 'Active';
        if (window.confirm(`Are you sure you want to ${newStatus === 'Active' ? 'Activate' : 'Suspend'} ${company.name}?`)) {
            await authService.updateCompanyStatus(company.id, newStatus);
            loadCompanies();
            if (selectedCompany) setSelectedCompany({ ...selectedCompany, status: newStatus });
            addToast(`Tenant ${newStatus === 'Active' ? 'Activated' : 'Suspended'}`, newStatus === 'Active' ? 'success' : 'warning');
        }
    };

    const handleImpersonate = async (companyId: string) => {
        if (!window.confirm("WARNING: You are about to sign in as the Tenant Admin. This action will be logged. Continue?")) return;
        setIsImpersonating(true);
        const result = await authService.impersonateTenant(companyId);
        if (result.success) {
            addToast("Shadow session active. Redirecting...", "success");
            window.location.reload(); 
        } else {
            addToast(result.error || "Impersonation failed", "error");
            setIsImpersonating(false);
        }
    };

    const handleFeatureToggle = async (key: keyof Company['features']) => {
        if (!selectedCompany) return;
        const updatedFeatures = { ...selectedCompany.features, [key]: !selectedCompany.features[key] };
        await authService.updateCompanyFeatures(selectedCompany.id, updatedFeatures);
        
        const updatedCompany = { ...selectedCompany, features: updatedFeatures };
        setSelectedCompany(updatedCompany);
        setCompanies(companies.map(c => c.id === selectedCompany.id ? updatedCompany : c));
        addToast(`Module ${key.toUpperCase()} ${updatedFeatures[key] ? 'Enabled' : 'Disabled'}`, 'info');
    };

    const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'reset') => {
        if (action === 'ban' || action === 'unban') {
            const status = action === 'ban' ? 'Suspended' : 'Active';
            await authService.adminUpdateUserStatus(userId, status);
            setCompanyUsers(companyUsers.map(u => u.id === userId ? {...u, status} : u));
            addToast(`User ${status}`, 'info');
        } else if (action === 'reset') {
            const tempPass = await authService.adminResetPassword(userId);
            prompt("User Password Reset. Copy temporary password:", tempPass);
            addToast('Password reset successfully', 'success');
        }
    };

    const filteredCompanies = companies.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats
    const totalTenants = companies.length;
    const activeTenants = companies.filter(c => c.status === 'Active').length;
    const totalUsers = companies.reduce((acc, curr) => acc + (authService.getCompanyUsers(curr.id).length || 0), 0);

    return (
        <div className="space-y-8 relative h-full">
            {/* Top Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-slate-900 text-white border-slate-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Total Organizations</p>
                            <h3 className="text-2xl font-bold mt-1">{totalTenants}</h3>
                        </div>
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><Building size={20}/></div>
                    </div>
                </Card>
                <Card className="p-4 bg-white border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">System Health</p>
                            <div className="flex items-center gap-2 mt-1">
                                <h3 className="text-2xl font-bold text-emerald-600">99.9%</h3>
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                            </div>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Activity size={20}/></div>
                    </div>
                </Card>
                <Card className="p-4 bg-white border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Total Seats</p>
                            <h3 className="text-2xl font-bold mt-1 text-slate-800">{totalUsers}</h3>
                        </div>
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Users size={20}/></div>
                    </div>
                </Card>
                <Card className="p-4 bg-white border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Pending Setups</p>
                            <h3 className="text-2xl font-bold mt-1 text-amber-600">{companies.filter(c => c.status === 'Provisioning').length}</h3>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Loader2 size={20}/></div>
                    </div>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search tenants by name or domain..." 
                        className="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => setShowProvisionModal(true)} className="bg-indigo-900 hover:bg-indigo-800 shadow-lg shadow-indigo-900/20">
                    <Plus size={16} className="mr-2"/> Provision New Tenant
                </Button>
            </div>

            {/* Tenant Data Grid */}
            <Card className="overflow-hidden border-slate-200 shadow-md">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Organization</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Health</th>
                            <th className="px-6 py-4">Users</th>
                            <th className="px-6 py-4">Modules Enabled</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredCompanies.map(company => {
                            const userCount = authService.getCompanyUsers(company.id).length;
                            const activeModules = Object.values(company.features).filter(Boolean).length;
                            const healthScore = company.status === 'Active' ? 95 : 20; // Simulated score
                            
                            return (
                                <tr key={company.id} className="group hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => setSelectedCompany(company)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-600 border border-slate-200 shadow-sm">
                                                {company.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{company.name}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Globe size={10} /> {company.domain}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge type={company.status === 'Active' ? 'success' : company.status === 'Suspended' ? 'error' : 'warning'}>{company.status}</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <div className={`w-2 h-2 rounded-full ${healthScore > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                            <span className="text-xs font-medium text-slate-600">{healthScore}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ width: `${(userCount / company.maxUsers) * 100}%` }}></div>
                                            </div>
                                            <span className="text-xs font-medium text-slate-600">{userCount}/{company.maxUsers}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                            {activeModules} Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                            <ArrowRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredCompanies.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    No organizations found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>

            {/* --- MANAGE TENANT SIDEBAR --- */}
            <AnimatePresence>
                {selectedCompany && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                            onClick={() => setSelectedCompany(null)}
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200"
                        >
                            {/* Slide-over Header */}
                            <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center text-3xl font-bold text-slate-700">
                                            {selectedCompany.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">{selectedCompany.name}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge type={selectedCompany.status === 'Active' ? 'success' : 'error'}>{selectedCompany.status}</Badge>
                                                <span className="text-sm text-slate-500 font-mono bg-slate-200/50 px-2 py-0.5 rounded">{selectedCompany.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedCompany(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                                        <X size={20} />
                                    </button>
                                </div>
                                
                                {/* Detail Tabs */}
                                <div className="flex gap-1 bg-slate-200/50 p-1 rounded-lg">
                                    {['overview', 'config', 'users', 'logs'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveDetailTab(tab as any)}
                                            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${activeDetailTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {tab === 'config' ? 'Modules' : tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                                {activeDetailTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                                                <HealthGauge score={selectedCompany.status === 'Active' ? 98 : 45} />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">API Calls</h5>
                                                    <div className="text-2xl font-bold text-slate-800">24.5k</div>
                                                    <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                                                        <Activity size={10} /> +12% this week
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Users</h5>
                                                    <div className="text-2xl font-bold text-slate-800">{companyUsers.length}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium mt-1">of {selectedCompany.maxUsers} License Limit</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                            <h4 className="text-sm font-bold text-slate-800 mb-4">Lifecycle Management</h4>
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div>
                                                    <div className="text-sm font-medium text-slate-700">Account Status</div>
                                                    <div className="text-xs text-slate-500">Controls login access for all users</div>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant={selectedCompany.status === 'Active' ? 'danger' : 'primary'}
                                                    onClick={() => toggleCompanyStatus(selectedCompany)}
                                                >
                                                    {selectedCompany.status === 'Active' ? <><Power size={14} className="mr-2"/> Suspend</> : <><RefreshCw size={14} className="mr-2"/> Activate</>}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeDetailTab === 'config' && (
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-sm text-blue-800 mb-6">
                                            <LayoutGrid size={20} className="shrink-0" />
                                            <div>
                                                <p className="font-bold">Feature Management</p>
                                                <p className="text-xs opacity-80">Enabling modules updates the tenant's license and UI instantly.</p>
                                            </div>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                                            {Object.entries(selectedCompany.features).map(([key, enabled]) => (
                                                <div key={key} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                    <div>
                                                        <h5 className="font-bold text-slate-800 uppercase text-sm">{key}</h5>
                                                        <p className="text-xs text-slate-500">Core module access</p>
                                                    </div>
                                                    <Switch checked={enabled} onChange={() => handleFeatureToggle(key as any)} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeDetailTab === 'users' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-slate-700 text-sm">Directory ({companyUsers.length})</h4>
                                            <Button 
                                                size="sm" 
                                                variant="secondary" 
                                                className="text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 w-full md:w-auto"
                                                onClick={() => handleImpersonate(selectedCompany.id)}
                                                disabled={isImpersonating}
                                            >
                                                {isImpersonating ? <Loader2 className="animate-spin" size={14}/> : <Key size={14} />} 
                                                <span className="ml-2">Impersonate Admin</span>
                                            </Button>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3">User</th>
                                                        <th className="px-4 py-3">Role</th>
                                                        <th className="px-4 py-3">Status</th>
                                                        <th className="px-4 py-3 text-right">Control</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {companyUsers.map(user => (
                                                        <tr key={user.id} className="hover:bg-slate-50 group">
                                                            <td className="px-4 py-3">
                                                                <div className="font-medium text-slate-800">{user.fullName}</div>
                                                                <div className="text-[10px] text-slate-500">{user.email}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600">{user.role}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-0.5 rounded font-bold ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                                    {user.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button 
                                                                        onClick={() => handleUserAction(user.id, user.status === 'Active' ? 'ban' : 'unban')}
                                                                        className={`p-1.5 rounded transition-colors ${user.status === 'Active' ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                                        title={user.status === 'Active' ? "Suspend User" : "Activate User"}
                                                                    >
                                                                        {user.status === 'Active' ? <Lock size={14}/> : <Unlock size={14}/>}
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleUserAction(user.id, 'reset')}
                                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                                        title="Reset Password"
                                                                    >
                                                                        <RotateCcw size={14}/>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {companyUsers.length === 0 && (
                                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No users initialized.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeDetailTab === 'logs' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-bold text-slate-700 text-sm">Audit Trail</h4>
                                            <span className="text-xs text-slate-400">Last 30 days</span>
                                        </div>
                                        <div className="relative pl-4 space-y-6 border-l border-slate-200 ml-2">
                                            {companyLogs.map((log) => (
                                                <div key={log.id} className="relative">
                                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white"></div>
                                                    <p className="text-xs font-bold text-slate-700">{log.action}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{log.details}</p>
                                                </div>
                                            ))}
                                            {companyLogs.length === 0 && <p className="text-xs text-slate-400 italic pl-2">No activity recorded.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- PROVISIONING MODAL --- */}
            <AnimatePresence>
                {showProvisionModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                        >
                            {!successData ? (
                                <>
                                    <div className="p-6 border-b border-slate-100 bg-slate-50">
                                        <h3 className="font-bold text-xl text-slate-800">New Tenant Provisioning</h3>
                                        <p className="text-sm text-slate-500">Configure company profile and module access.</p>
                                    </div>
                                    <div className="p-8 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <ModernInput 
                                                label="Company Name" 
                                                value={formData.name} 
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                            />
                                            <ModernInput 
                                                label="Domain (e.g. acme.com)" 
                                                value={formData.domain} 
                                                onChange={e => setFormData({...formData, domain: e.target.value})}
                                            />
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Module Access</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {Object.entries(formData.features).map(([key, val]) => (
                                                    <div key={key} className="p-3 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50">
                                                        <span className="text-sm font-bold uppercase text-slate-700">{key}</span>
                                                        <Switch checked={val} onChange={(c) => setFormData({...formData, features: {...formData.features, [key]: c}})} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                                        <Button variant="ghost" onClick={() => setShowProvisionModal(false)}>Cancel</Button>
                                        <Button onClick={handleCreate} disabled={isLoading} className="bg-indigo-600 w-40">
                                            {isLoading ? <Loader2 className="animate-spin"/> : 'Provision Tenant'}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="p-10 text-center">
                                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 animate-in zoom-in">
                                        <CheckCircle size={40} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Tenant Successfully Created</h2>
                                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                        Secure onboarding credentials generated. Share the link below with the company administrator.
                                    </p>
                                    
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-left mb-8 space-y-4 shadow-inner">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Temp Admin Email</label>
                                            <div className="font-mono text-sm font-bold text-slate-800">{successData.email}</div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Temp Password</label>
                                            <div className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded">
                                                {successData.tempPasswordRaw}
                                            </div>
                                            <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><RefreshCw size={10}/> Expiring in 7 days</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Onboarding Link</label>
                                            <div className="flex gap-2 mt-1">
                                                <input 
                                                    readOnly 
                                                    value={`${window.location.origin}?token=${successData.token}`}
                                                    className="flex-1 text-xs bg-white border border-slate-200 rounded px-3 py-2 text-slate-500 outline-none font-mono"
                                                />
                                                <Button size="sm" onClick={copyLink} className="h-full"><Copy size={14}/></Button>
                                            </div>
                                        </div>
                                    </div>

                                    <Button onClick={resetForm} className="w-full shadow-lg shadow-indigo-200">Done</Button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
