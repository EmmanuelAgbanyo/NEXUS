
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartOfAccounts } from './ChartOfAccounts';
import { UserManagement } from './UserManagement';
import { FiscalPeriods } from './FiscalPeriods';
import { DataManagement } from './DataManagement';
import { CurrencyManagement } from './CurrencyManagement';
import { SystemHealth } from './SystemHealth';
import { Integrations } from './Integrations';
import { AuditLogs } from './AuditLogs';
import { 
    Settings, Users, Calendar, Coins, HardDrive, 
    Activity, Shield, Link, Search, ChevronRight, LayoutGrid, ChevronDown, Command 
} from 'lucide-react';

// Configuration Structure
const SETTINGS_MENU = [
    {
        category: 'Organization',
        items: [
            { id: 'coa', label: 'Chart of Accounts', icon: Settings, component: ChartOfAccounts, description: 'Manage ledger accounts and structure' },
            { id: 'fiscal', label: 'Fiscal Policies', icon: Calendar, component: FiscalPeriods, description: 'Year-end, periods, and date rules' },
            { id: 'currency', label: 'Multi-Currency', icon: Coins, component: CurrencyManagement, description: 'Exchange rates and base currency' },
        ]
    },
    {
        category: 'Access & Security',
        items: [
            { id: 'users', label: 'Users & Roles', icon: Users, component: UserManagement, description: 'Role-based access control (RBAC)' },
            { id: 'audit', label: 'Audit Logs', icon: Shield, component: AuditLogs, description: 'System-wide event tracking' },
        ]
    },
    {
        category: 'System',
        items: [
            { id: 'health', label: 'System Health', icon: Activity, component: SystemHealth, description: 'Server status and API metrics' },
            { id: 'integrations', label: 'Integrations', icon: Link, component: Integrations, description: 'Banking and 3rd party apps' },
            { id: 'data', label: 'Data Management', icon: HardDrive, component: DataManagement, description: 'Backup, Import/Export tools' },
        ]
    }
];

interface SettingsGroupProps {
    group: typeof SETTINGS_MENU[0];
    activeId: string;
    setActiveId: (id: string) => void;
    isExpanded: boolean;
    toggle: () => void;
    isSearching: boolean;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ 
    group, 
    activeId, 
    setActiveId, 
    isExpanded, 
    toggle, 
    isSearching 
}) => {
    // If searching, always show items if they exist in filtered set
    const showItems = isSearching || isExpanded;

    return (
        <motion.div 
            layout
            initial={false}
            animate={{ 
                backgroundColor: isExpanded ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0)',
                boxShadow: isExpanded ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
                scale: isExpanded ? 1.02 : 1,
                marginBottom: isExpanded ? 16 : 8,
                marginTop: isExpanded ? 8 : 0,
                borderRadius: 16
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`overflow-hidden transition-colors border ${isExpanded ? 'border-indigo-100/50' : 'border-transparent'}`}
        >
            <button 
                onClick={toggle}
                className={`w-full flex items-center justify-between px-6 py-4 text-[11px] font-bold uppercase tracking-widest transition-colors group ${isSearching ? 'cursor-default' : 'cursor-pointer'} ${isExpanded ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-500'}`}
            >
                <span className="group-hover:translate-x-1 transition-transform duration-300">{group.category}</span>
                {!isSearching && (
                    <motion.div
                        animate={{ rotate: showItems ? 0 : -90 }}
                        transition={{ duration: 0.3, type: "spring" }}
                    >
                        <ChevronDown 
                            size={14} 
                            className={`${isExpanded ? 'text-indigo-500' : 'text-slate-300 group-hover:text-indigo-400'}`}
                        />
                    </motion.div>
                )}
            </button>
            
            <AnimatePresence initial={false}>
                {showItems && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                        <div className="space-y-1 px-3 pb-4">
                            {group.items.map((item: any) => (
                                <motion.button
                                    key={item.id}
                                    onClick={() => setActiveId(item.id)}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    layout
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors duration-200 group relative overflow-hidden
                                        ${activeId === item.id 
                                            ? 'text-white shadow-lg shadow-indigo-500/30' // bg handled by layoutId
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm'
                                        }
                                    `}
                                >
                                    {activeId === item.id && (
                                        <motion.div
                                            layoutId="activeSettingsItem"
                                            className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <item.icon 
                                        size={18} 
                                        strokeWidth={activeId === item.id ? 2.5 : 2}
                                        className={`relative z-10 transition-colors duration-200 ${activeId === item.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} 
                                    />
                                    <span className={`relative z-10 transition-colors duration-200 ${activeId === item.id ? 'text-white' : ''}`}>
                                        {item.label}
                                    </span>
                                    {activeId === item.id && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="ml-auto relative z-10"
                                        >
                                            <ChevronRight size={14} className="text-indigo-100" />
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export const UtilityModule: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
    const [activeId, setActiveId] = useState(initialTab || 'coa');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Initialize with first category open
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Organization': true,
        'Access & Security': false,
        'System': false
    });

    useEffect(() => {
        if (initialTab) {
            setActiveId(initialTab);
            // Auto expand the category containing the tab
            const group = SETTINGS_MENU.find(g => g.items.some(i => i.id === initialTab));
            if (group) {
                setExpandedCategories(prev => ({ ...prev, [group.category]: true }));
            }
        }
    }, [initialTab]);

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const allItems = SETTINGS_MENU.flatMap(group => group.items);
    const activeItem = allItems.find(item => item.id === activeId) || allItems[0];
    const ActiveComponent = activeItem.component;

    const filteredMenu = SETTINGS_MENU.map(group => ({
        ...group,
        items: group.items.filter(item => 
            item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(group => group.items.length > 0);

    const isSearching = searchTerm.length > 0;

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-slate-50/50 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-inter">
            {/* Sidebar Console */}
            <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="p-5">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input 
                            type="text"
                            placeholder="Search configuration..."
                            className="w-full pl-10 pr-8 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm group-hover:border-indigo-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm ? (
                             <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">✕</div>
                             </button>
                        ) : (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] text-slate-400 font-mono">
                                    <Command size={8} /> K
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {filteredMenu.map((group) => (
                        <SettingsGroup 
                            key={group.category}
                            group={group}
                            activeId={activeId}
                            setActiveId={setActiveId}
                            isExpanded={expandedCategories[group.category]}
                            toggle={() => toggleCategory(group.category)}
                            isSearching={isSearching}
                        />
                    ))}
                    
                    {filteredMenu.length === 0 && (
                        <div className="px-6 py-12 text-center opacity-60">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                <Search size={20} />
                            </div>
                            <p className="text-sm font-medium text-slate-600">No settings found</p>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                            <LayoutGrid size={14} />
                            <span>System v2.4.0</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-emerald-600">Online</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white relative">
                {/* Header Context */}
                <div className="h-20 border-b border-slate-100 flex items-center justify-between px-8 bg-white/90 backdrop-blur-xl shrink-0 z-10 sticky top-0">
                     <div className="flex flex-col justify-center h-full">
                        <motion.div 
                            key={activeItem.description}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"
                        >
                            <span>Settings</span>
                            <ChevronRight size={10} />
                            <span className="text-indigo-500">{SETTINGS_MENU.find(g => g.items.some(i => i.id === activeId))?.category}</span>
                        </motion.div>
                        <motion.h2 
                            key={activeItem.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2"
                        >
                            {activeItem.label}
                        </motion.h2>
                     </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200">
                     <AnimatePresence mode="wait">
                        <motion.div
                            key={activeId}
                            initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="max-w-5xl mx-auto pb-20"
                        >
                            <ActiveComponent />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
