
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, FileText, Users, PieChart, Layers, Database, LogOut, BookOpen, ChevronLeft, ChevronRight, Bell, Search, Menu, Command, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeModule: string;
  setActiveModule: (module: string) => void;
  onLogout: () => void;
  userRole: Role | null;
}

const SidebarItem = ({ icon: Icon, label, id, active, onClick, collapsed }: any) => (
  <motion.div 
    layout
    variants={{
      hidden: { opacity: 0, x: -20 },
      show: { opacity: 1, x: 0 }
    }}
    className="relative group mb-1"
  >
    <motion.button
      onClick={() => onClick(id)}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-200 relative
        ${collapsed ? 'justify-center' : ''}
        ${!active ? 'hover:bg-slate-800/50' : ''}
      `}
    >
      {active && (
        <motion.div
          layoutId="activeSidebar"
          className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-lg shadow-indigo-900/20"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
        >
           {/* Subtle highlight sheen */}
           <div className="absolute inset-0 bg-white/10 rounded-xl" />
        </motion.div>
      )}
      
      <span className={`relative z-10 flex items-center justify-center transition-colors duration-200 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      </span>
      
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span 
            initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -5, filter: 'blur(4px)' }}
            transition={{ duration: 0.2 }}
            className={`relative z-10 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
    
    {/* Tooltip for collapsed state */}
    <AnimatePresence>
      {collapsed && (
        <div className="hidden group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-4 z-50">
          <motion.div 
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl border border-slate-700 whitespace-nowrap"
          >
            {label}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-700"></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </motion.div>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeModule, setActiveModule, onLogout, userRole }) => {
  const [collapsed, setCollapsed] = useState(false);

  // Staggered animation for menu items
  const navContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden font-inter">
      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-slate-900 h-full flex flex-col shadow-2xl z-30 relative shrink-0"
      >
        {/* Toggle Button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-900/50 z-50 border-2 border-slate-900 hover:bg-indigo-500 transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </motion.button>

        {/* Logo Section */}
        <div className={`p-6 flex items-center gap-3 ${collapsed ? 'justify-center' : ''} transition-all relative z-20 overflow-hidden`}>
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.6, ease: "circOut" }}
            className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50 shrink-0 cursor-pointer"
          >
            <Layers className="text-white" size={20} />
          </motion.div>
          
          <AnimatePresence>
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-lg font-bold text-white tracking-tight">Nexus</h1>
                <p className="text-[10px] text-indigo-300 font-medium tracking-widest uppercase">Quantum Ledger</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <motion.nav 
          variants={navContainerVariants}
          initial="hidden"
          animate="show"
          className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide"
        >
          {userRole === Role.SUPER_ADMIN && (
             <>
               <div className="mb-2 px-3">
                  {!collapsed && <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Owner Controls</h3>}
               </div>
               <SidebarItem icon={Building} label="Tenant Manager" id="companies" active={activeModule === 'companies'} onClick={setActiveModule} collapsed={collapsed} />
               <div className="my-4 border-t border-slate-800/50 mx-3"></div>
             </>
          )}

          <SidebarItem icon={LayoutDashboard} label="Dashboard" id="dashboard" active={activeModule === 'dashboard'} onClick={setActiveModule} collapsed={collapsed} />
          <SidebarItem icon={BookOpen} label="Journal Entries" id="journals" active={activeModule === 'journals'} onClick={setActiveModule} collapsed={collapsed} />
          <SidebarItem icon={FileText} label="General Ledger" id="gl" active={activeModule === 'gl'} onClick={setActiveModule} collapsed={collapsed} />
          <SidebarItem icon={Settings} label="Configuration" id="utility" active={activeModule === 'utility'} onClick={setActiveModule} collapsed={collapsed} />
          <SidebarItem icon={PieChart} label="Financial Reports" id="reports" active={activeModule === 'reports'} onClick={setActiveModule} collapsed={collapsed} />
          
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.5 }}
              className="pt-6 mt-6 border-t border-slate-800/50 px-3"
            >
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">System</h3>
            </motion.div>
          )}
          
          <div className={collapsed ? 'pt-6 mt-6 border-t border-slate-800/50' : ''}>
             <SidebarItem icon={Users} label="Access Control" id="access" active={activeModule === 'access'} onClick={() => setActiveModule('utility')} collapsed={collapsed} />
             <SidebarItem icon={Database} label="Backups" id="backups" active={activeModule === 'backups'} onClick={() => setActiveModule('utility')} collapsed={collapsed} />
          </div>
        </motion.nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className={`flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full p-2 rounded-lg hover:bg-white/5
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8fafc] relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/80 to-transparent pointer-events-none z-0" />
        
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <motion.h2 
              key={activeModule}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-slate-800 tracking-tight"
            >
              {activeModule === 'utility' ? 'System Configuration' : 
               activeModule === 'dashboard' ? 'Executive Overview' : 
               activeModule === 'journals' ? 'Journal Management' : 
               activeModule === 'gl' ? 'General Ledger' : 
               activeModule === 'companies' ? 'Tenant Provisioning' : 'Reports'}
            </motion.h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
               <input 
                  type="text" 
                  placeholder="Search system..." 
                  className="pl-10 pr-4 py-2 rounded-full bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64 shadow-sm"
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] text-slate-400 font-mono">
                        <Command size={8} /> K
                    </span>
                </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-all hover:shadow-sm"
            >
               <Bell size={20} />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#f8fafc]"></span>
            </motion.button>
            
            <div className="h-8 w-px bg-slate-200"></div>
            
            <div className="flex items-center gap-3 pl-2">
               <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-800 leading-none">{userRole === Role.SUPER_ADMIN ? 'System Owner' : 'Admin User'}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">{userRole === Role.SUPER_ADMIN ? 'Nexus Corp' : 'Finance Dept.'}</p>
               </div>
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-md cursor-pointer"
               >
                 <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <span className="text-sm font-bold text-indigo-600">{userRole === Role.SUPER_ADMIN ? 'OP' : 'AU'}</span>
                 </div>
               </motion.div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-auto px-8 pb-8 z-10 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
