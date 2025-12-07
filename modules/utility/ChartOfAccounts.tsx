
import React, { useState, useMemo, useEffect } from 'react';
import { Card, SectionHeader, Button, Badge } from '../../components/ui/UtilityComponents';
import { ProfessionalDropdown } from '../../components/ui/ProfessionalDropdown';
import { ModernInput } from '../../components/ui/ModernInput';
import { Plus, Search, Sparkles, FolderTree, ArrowRight, Edit, Trash2, X, Save, AlertCircle, CheckCircle, Upload, FileText, Scan, Layers, ChevronDown, ChevronRight, PieChart, Hash, Folder, CreditCard, CornerDownRight, Check, Image as ImageIcon, FileCheck, Info, ShieldAlert } from 'lucide-react';
import { COAAccount, AccountType } from '../../types';
import { suggestCOACode, generateCOAFromDocument } from '../../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { saveToCloud, loadFromCloud } from '../../src/utils/cloudStorage.js';

const COA_STORAGE_KEY = 'nexus_coa';

const INITIAL_COA: COAAccount[] = [
  { code: '10000', name: 'Non-Current Assets', type: AccountType.ASSET, balance: 0, isSystem: true },
  { code: '11000', name: 'Property, Plant & Equip.', type: AccountType.ASSET, parentCode: '10000', balance: 1250000 },
  { code: '12000', name: 'Intangible Assets', type: AccountType.ASSET, parentCode: '10000', balance: 50000 },
  { code: '20000', name: 'Current Assets', type: AccountType.ASSET, balance: 0, isSystem: true },
  { code: '20100', name: 'Cash & Equivalents', type: AccountType.ASSET, parentCode: '20000', balance: 0, isSystem: true },
  { code: '20110', name: 'Operating Account (USD)', type: AccountType.ASSET, parentCode: '20100', balance: 150000 },
  { code: '20120', name: 'Petty Cash', type: AccountType.ASSET, parentCode: '20100', balance: 2500 },
  { code: '30000', name: 'Liabilities', type: AccountType.LIABILITY, balance: 0, isSystem: true },
  { code: '30100', name: 'Accounts Payable', type: AccountType.LIABILITY, parentCode: '30000', balance: 45000 },
  { code: '40000', name: 'Equity', type: AccountType.EQUITY, balance: 0, isSystem: true },
  { code: '40100', name: 'Retained Earnings', type: AccountType.EQUITY, parentCode: '40000', balance: 850000 },
  { code: '50000', name: 'Revenue', type: AccountType.REVENUE, balance: 0, isSystem: true },
  { code: '50100', name: 'Sales Revenue', type: AccountType.REVENUE, parentCode: '50000', balance: 500000 },
  { code: '60000', name: 'Expenses', type: AccountType.EXPENSE, balance: 0, isSystem: true },
  { code: '60100', name: 'Rent Expense', type: AccountType.EXPENSE, parentCode: '60000', balance: 12000 },
];

const IFRS_TEMPLATE: COAAccount[] = [
    { code: '10000', name: 'Non-current Assets', type: AccountType.ASSET, isSystem: true, balance: 0 },
    { code: '20000', name: 'Current Assets', type: AccountType.ASSET, isSystem: true, balance: 0 },
    { code: '30000', name: 'Equity', type: AccountType.EQUITY, isSystem: true, balance: 0 },
    { code: '40000', name: 'Non-current Liabilities', type: AccountType.LIABILITY, isSystem: true, balance: 0 },
    { code: '50000', name: 'Current Liabilities', type: AccountType.LIABILITY, isSystem: true, balance: 0 },
    { code: '60000', name: 'Revenue', type: AccountType.REVENUE, isSystem: true, balance: 0 },
    { code: '70000', name: 'Cost of Sales', type: AccountType.EXPENSE, isSystem: true, balance: 0 },
    { code: '80000', name: 'Administrative Expenses', type: AccountType.EXPENSE, isSystem: true, balance: 0 },
];

export const ChartOfAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<COAAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<{code: string, type: string, reasoning: string} | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedAccounts, setExtractedAccounts] = useState<any[]>([]);
  
  // Advanced Form State
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<COAAccount | null>(null);
  const [formData, setFormData] = useState<Partial<COAAccount>>({});
  const [formError, setFormError] = useState('');
  const [isGroupAccount, setIsGroupAccount] = useState(false);

  // Load from Storage
  useEffect(() => {
      const loadInitialCOA = async () => {
          const stored = await loadFromCloud(COA_STORAGE_KEY);
          if (stored) {
              setAccounts(stored as COAAccount[]);
          } else {
              setAccounts(INITIAL_COA);
              await saveToCloud(COA_STORAGE_KEY, INITIAL_COA);
          }
      };
      loadInitialCOA();
  }, []);

  // Save to Storage
  useEffect(() => {
      const saveCOA = async () => {
          if (accounts.length > 0) {
              await saveToCloud(COA_STORAGE_KEY, accounts);
          }
      };
      saveCOA();
  }, [accounts]);

  const stats = useMemo(() => {
      return {
          assets: accounts.filter(a => a.type === AccountType.ASSET && !a.isSystem).reduce((acc, curr) => acc + curr.balance, 0),
          liabilities: accounts.filter(a => a.type === AccountType.LIABILITY && !a.isSystem).reduce((acc, curr) => acc + curr.balance, 0),
          equity: accounts.filter(a => a.type === AccountType.EQUITY && !a.isSystem).reduce((acc, curr) => acc + curr.balance, 0),
          count: accounts.length
      }
  }, [accounts]);

  // Build Hierarchy Tree for Display
  const hierarchicalAccounts = useMemo(() => {
      if (searchTerm) {
          return accounts.filter(acc => 
            acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            acc.code.includes(searchTerm)
          ).map(acc => ({ ...acc, depth: 0 }));
      }

      const result: (COAAccount & { depth: number })[] = [];
      
      const processLevel = (parentCode: string | undefined, depth: number) => {
          const nodes = accounts.filter(a => a.parentCode === parentCode || (!parentCode && !a.parentCode));
          nodes.sort((a, b) => a.code.localeCompare(b.code));
          
          nodes.forEach(node => {
              result.push({ ...node, depth });
              processLevel(node.code, depth + 1);
          });
      };

      processLevel(undefined, 0);
      return result;
  }, [accounts, searchTerm]);

  const handleAISuggest = async () => {
    if (!aiInput) return;
    setIsSuggesting(true);
    const result = await suggestCOACode(aiInput, accounts);
    if (result && result.suggestedCode) {
      setSuggestion({
        code: result.suggestedCode,
        type: result.accountType,
        reasoning: result.reasoning
      });
    }
    setIsSuggesting(false);
  };

  const acceptSuggestion = () => {
    if (!suggestion) return;
    const newAccount: COAAccount = {
      code: suggestion.code,
      name: aiInput,
      type: suggestion.type as AccountType,
      balance: 0
    };
    setAccounts(prev => [...prev, newAccount].sort((a, b) => a.code.localeCompare(b.code)));
    setAiInput('');
    setSuggestion(null);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setScanFile(e.target.files[0]);
      }
  };

  const runDocumentScan = async () => {
      if (!scanFile) return;
      setIsScanning(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1]; 
          const mimeType = scanFile.type;
          const result = await generateCOAFromDocument(base64Data, mimeType);
          if (result && result.extractedAccounts) {
              setExtractedAccounts(result.extractedAccounts);
          }
          setIsScanning(false);
      };
      reader.readAsDataURL(scanFile);
  };

  const importExtractedAccount = (acc: any) => {
      const newAccount: COAAccount = {
          code: acc.suggestedCode,
          name: acc.name,
          type: acc.type as AccountType,
          balance: 0
      };
      if (!accounts.some(a => a.code === newAccount.code)) {
          setAccounts(prev => [...prev, newAccount].sort((a, b) => a.code.localeCompare(b.code)));
      }
      setExtractedAccounts(prev => prev.filter(p => p.suggestedCode !== acc.suggestedCode));
  };

  const openAddModal = () => {
    setEditingAccount(null);
    setFormData({ type: AccountType.EXPENSE, balance: 0, code: '' });
    setIsGroupAccount(false);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (acc: COAAccount) => {
    setEditingAccount(acc);
    setFormData({ ...acc });
    const hasChildren = accounts.some(a => a.parentCode === acc.code);
    setIsGroupAccount(hasChildren);
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = (code: string) => {
    const account = accounts.find(a => a.code === code);
    if (!account) return;
    
    if (account.isSystem) {
        alert("System protected accounts cannot be deleted.");
        return;
    }
    
    if (account.balance !== 0) {
        alert("Cannot delete an account with a non-zero balance. Please reclassify transactions or zero out the balance first.");
        return;
    }

    const hasChildren = accounts.some(a => a.parentCode === code);
    if (hasChildren) {
        alert(`Cannot delete account ${code} because it has active sub-accounts. Please delete or reassign sub-accounts first.`);
        return;
    }

    if (window.confirm(`Are you sure you want to delete account ${code} - ${account.name}? This action cannot be undone.`)) {
        setAccounts(accounts.filter(a => a.code !== code));
    }
  };

  const handleSave = (addAnother: boolean = false) => {
      setFormError('');

      if (!formData.code || !formData.name || !formData.type) {
          setFormError('Account Code, Name, and Classification are mandatory.');
          return;
      }

      if (formData.code.length < 3) {
          setFormError('Account Code must be at least 3 digits.');
          return;
      }

      if (formData.parentCode) {
          const parentExists = accounts.find(a => a.code === formData.parentCode);
          if (!parentExists) {
              setFormError(`Parent Account ${formData.parentCode} not found.`);
              return;
          }
          if (formData.code === formData.parentCode) {
              setFormError('Circular Reference: Account cannot be its own parent.');
              return;
          }
          if (parentExists.type !== formData.type) {
              if(!window.confirm(`Warning: Parent is ${parentExists.type} but child is ${formData.type}. Continue?`)) return;
          }
      }

      if (!editingAccount || editingAccount.code !== formData.code) {
          if (accounts.some(a => a.code === formData.code)) {
              setFormError(`Account Code ${formData.code} is already in use.`);
              return;
          }
      }

      const finalAccount: COAAccount = {
          ...formData as COAAccount,
          isSystem: editingAccount ? editingAccount.isSystem : false 
      };

      if (editingAccount) {
          setAccounts(prev => prev.map(a => a.code === editingAccount.code ? finalAccount : a));
          setShowModal(false);
      } else {
          setAccounts(prev => [...prev, finalAccount].sort((a, b) => a.code.localeCompare(b.code)));
          if (addAnother) {
              setFormData({ type: formData.type, parentCode: formData.parentCode, balance: 0, code: '' }); 
          } else {
              setShowModal(false);
          }
      }
  };
  
  const handleLoadIFRS = () => {
      if (!window.confirm("Load Standard IFRS Template? Existing accounts will be preserved.")) return;
      let addedCount = 0;
      const newAccounts = [...accounts];
      IFRS_TEMPLATE.forEach(templateAcc => {
          if (!newAccounts.some(existing => existing.code === templateAcc.code)) {
              newAccounts.push(templateAcc);
              addedCount++;
          }
      });
      setAccounts(newAccounts.sort((a, b) => a.code.localeCompare(b.code)));
      alert(`Successfully added ${addedCount} IFRS standard accounts.`);
  };

  const accountTypeOptions = Object.values(AccountType).map(t => ({ id: t, label: t }));

  const getTypeColor = (type: AccountType) => {
      switch(type) {
          case AccountType.ASSET: return 'info';
          case AccountType.LIABILITY: return 'warning';
          case AccountType.EQUITY: return 'neutral';
          case AccountType.REVENUE: return 'success';
          case AccountType.EXPENSE: return 'error';
          default: return 'neutral';
      }
  };

  const getParentName = (code?: string) => {
      if (!code) return null;
      return accounts.find(a => a.code === code)?.name || "Unknown Parent";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="Chart of Accounts Engine" 
        description="Configure the financial backbone of your organization. Supports multi-level hierarchy and automated coding."
        action={
            <div className="flex gap-2">
                <Button variant="secondary" onClick={handleLoadIFRS} className="bg-white hover:bg-slate-50 border-slate-200">
                    <FolderTree size={16} /> Load IFRS
                </Button>
                <Button onClick={openAddModal} className="shadow-lg shadow-indigo-500/30">
                    <Plus size={16} /> New Account
                </Button>
            </div>
        }
      />

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
              { label: 'Total Assets', val: stats.assets, color: 'text-indigo-600', icon: Layers },
              { label: 'Total Liabilities', val: stats.liabilities, color: 'text-amber-600', icon: AlertCircle },
              { label: 'Total Equity', val: stats.equity, color: 'text-emerald-600', icon: PieChart },
              { label: 'Defined Accounts', val: stats.count, isCount: true, color: 'text-slate-600', icon: FileText }
          ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
              >
                  <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                      <h4 className={`text-xl font-bold font-mono ${stat.color}`}>
                          {stat.isCount ? stat.val : `$${(stat.val / 1000).toFixed(1)}k`}
                      </h4>
                  </div>
                  <div className={`p-3 rounded-lg bg-slate-50 group-hover:bg-indigo-50 transition-colors ${stat.color}`}>
                      <stat.icon size={20} />
                  </div>
              </motion.div>
          ))}
      </div>

      {/* AI & Scan Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div className="md:col-span-2" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay:0.3}}>
            <div className="h-full rounded-2xl p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
                <div className="h-full bg-white rounded-xl p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <label className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3 flex items-center gap-2">
                            <Sparkles size={16} className="text-indigo-500" />
                            AI Architect
                        </label>
                        <p className="text-xs text-slate-500 mb-4">Describe an account (e.g. "Monthly subscription for Adobe Cloud") and Gemini will classify, code, and structure it.</p>
                        
                        <div className="flex gap-2">
                            <input 
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                placeholder="Type a natural language description..."
                                className="flex-1 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 px-4 py-3 text-sm transition-all outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAISuggest()}
                            />
                            <Button onClick={handleAISuggest} disabled={isSuggesting || !aiInput} className="bg-slate-900 text-white hover:bg-slate-800">
                                {isSuggesting ? 'Processing...' : 'Generate'}
                            </Button>
                        </div>
                    </div>
                    
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                    <AnimatePresence>
                    {suggestion && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 pt-4 border-t border-slate-100"
                        >
                            <div className="flex items-center gap-4 flex-wrap bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Code</span>
                                    <span className="font-mono font-bold text-indigo-700">{suggestion.code}</span>
                                </div>
                                <ArrowRight size={14} className="text-slate-300" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Type</span>
                                    <Badge type={getTypeColor(suggestion.type as AccountType)}>{suggestion.type}</Badge>
                                </div>
                                <div className="flex-1 min-w-[200px] border-l border-slate-200 pl-4 ml-2">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Reasoning</span>
                                    <p className="text-xs text-slate-600 italic leading-snug">{suggestion.reasoning}</p>
                                </div>
                                <Button size="sm" onClick={acceptSuggestion} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">Accept</Button>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </div>
          </motion.div>
          
          <motion.div className="md:col-span-1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay:0.3}}>
              <Card className="h-full bg-slate-900 text-white border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-indigo-500/50 transition-all" onClick={() => setShowScanModal(true)}>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                          <Scan className="text-indigo-400" size={24} />
                      </div>
                      <h4 className="font-bold text-lg mb-1">Document Scan</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                          Upload PDF/Images of legacy ledgers. AI extracts and structures the hierarchy.
                      </p>
                  </div>
                  <div className="relative z-10 mt-4 flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                      Start Import <ArrowRight size={12} />
                  </div>
              </Card>
          </motion.div>
      </div>

      {/* COA Table */}
      <Card className="overflow-hidden border-slate-200 shadow-lg">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-80 group">
                <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                <input 
                    type="text" 
                    placeholder="Search account code or name..." 
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm w-full focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> System Active
                </span>
            </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-slate-500 font-semibold border-b border-slate-200 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 w-40">Code</th>
                <th className="px-6 py-4">Account Hierarchy</th>
                <th className="px-6 py-4">Classification</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <AnimatePresence>
              {hierarchicalAccounts.map((acc, index) => (
                <motion.tr 
                    key={acc.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`hover:bg-slate-50/80 transition-colors group ${acc.depth === 0 ? 'bg-slate-50/40' : ''}`}
                >
                  <td className={`px-6 py-3 font-mono ${acc.depth === 0 ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>
                      {acc.code}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center" style={{ paddingLeft: `${acc.depth * 24}px` }}>
                        {acc.depth > 0 && (
                            <div className="mr-2 text-slate-300">
                                <CornerDownRight size={14} />
                            </div>
                        )}
                        <span className={`font-medium ${acc.depth === 0 ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                            {acc.name}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <Badge type={getTypeColor(acc.type)}>{acc.type}</Badge>
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-slate-700">
                    {acc.balance !== 0 ? acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : <span className="text-slate-300">-</span>}
                  </td>
                   <td className="px-6 py-3 text-right">
                    {acc.isSystem ? (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded inline-flex items-center gap-1 cursor-not-allowed opacity-60">
                             <CheckCircle size={10} /> SYSTEM
                        </span>
                    ) : (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(acc)} className="p-1.5 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-colors">
                                <Edit size={14} />
                            </button>
                            <button onClick={() => handleDelete(acc.code)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                  </td>
                </motion.tr>
              ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- MODALS (Scan & Create) kept similar but ensure they use updated state --- */}
      <AnimatePresence>
      {showScanModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                  <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-600 text-white rounded-lg"><Scan size={20} /></div>
                          <div>
                              <h3 className="font-bold text-lg text-slate-800">Document Intelligence</h3>
                              <p className="text-xs text-slate-500">Multimodal extraction of financial structures</p>
                          </div>
                      </div>
                      <button onClick={() => setShowScanModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                   <div className="p-8 overflow-y-auto">
                      {!scanFile ? (
                           <div className="border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center hover:bg-slate-50 transition-colors relative group">
                                <input type="file" onChange={handleDocumentUpload} accept=".pdf,.png,.jpg,.jpeg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <Upload size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-800">Upload Financial Document</h4>
                                <p className="text-slate-500 mt-2">Support for PDF, PNG, JPG (Max 10MB)</p>
                           </div>
                      ) : (
                          <div className="space-y-8">
                              {isScanning ? (
                                  <div className="relative h-64 bg-slate-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center text-white border border-slate-800 shadow-inner">
                                      <motion.div 
                                        initial={{ top: '0%' }}
                                        animate={{ top: '100%' }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)] z-10"
                                      />
                                      <div className="relative z-20 text-center">
                                          <div className="animate-spin text-indigo-500 mx-auto mb-4 w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full" />
                                          <h4 className="text-xl font-bold">Analyzing Document Structure...</h4>
                                      </div>
                                  </div>
                              ) : extractedAccounts.length > 0 ? (
                                  <div className="space-y-4">
                                      <div className="flex justify-between items-center">
                                          <h4 className="font-bold text-slate-800">Identified Accounts ({extractedAccounts.length})</h4>
                                          <Button size="sm" variant="ghost" onClick={() => { setScanFile(null); setExtractedAccounts([]); }}>Scan New File</Button>
                                      </div>
                                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                                          <table className="w-full text-sm text-left">
                                              <thead className="bg-slate-50 border-b border-slate-100">
                                                  <tr>
                                                      <th className="px-4 py-3 font-medium text-slate-500">Proposed Code</th>
                                                      <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                                                      <th className="px-4 py-3 font-medium text-slate-500">Type</th>
                                                      <th className="px-4 py-3"></th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100">
                                                  {extractedAccounts.map((acc, i) => (
                                                      <tr key={i} className="hover:bg-indigo-50/50 transition-colors">
                                                          <td className="px-4 py-3 font-mono font-bold text-indigo-700">{acc.suggestedCode}</td>
                                                          <td className="px-4 py-3 font-medium text-slate-800">{acc.name}</td>
                                                          <td className="px-4 py-3"><Badge type="neutral">{acc.type}</Badge></td>
                                                          <td className="px-4 py-3 text-right">
                                                              <Button size="sm" onClick={() => importExtractedAccount(acc)} className="h-8 text-xs">Import</Button>
                                                          </td>
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-center py-10">
                                      <FileText size={48} className="text-indigo-600 mx-auto mb-4" />
                                      <h4 className="text-lg font-bold text-slate-800">File Ready to Scan</h4>
                                      <Button onClick={runDocumentScan} size="lg" className="px-8 shadow-lg shadow-indigo-500/30">
                                          <Sparkles size={16} className="mr-2" /> Run AI Analysis
                                      </Button>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </motion.div>
          </div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100"
            >
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                            {editingAccount ? <Edit size={20} className="text-indigo-600"/> : <Plus size={20} className="text-indigo-600"/>}
                            {editingAccount ? 'Edit Ledger Account' : 'New Ledger Account'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Define account properties and hierarchy placement.</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"><X size={18}/></button>
                </div>
                
                <div className="p-8">
                    <AnimatePresence>
                    {formError && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-6 p-4 bg-red-50 text-red-800 text-sm rounded-xl flex items-start gap-3 border border-red-100 shadow-sm"
                        >
                            <ShieldAlert size={18} className="shrink-0 mt-0.5" /> 
                            <div>
                                <span className="font-bold block mb-1">Validation Error</span>
                                {formError}
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Account Identity</h4>
                            
                            <ProfessionalDropdown
                                label="Classification"
                                options={accountTypeOptions}
                                value={formData.type || ''}
                                onChange={val => setFormData({...formData, type: val as AccountType})}
                                placeholder="Select Type"
                            />

                            <div className="flex gap-4">
                                <ModernInput 
                                    label="Account Code" 
                                    placeholder="e.g. 10500" 
                                    icon={<Hash size={18} />}
                                    value={formData.code || ''}
                                    onChange={e => setFormData({...formData, code: e.target.value})}
                                    className="flex-1"
                                />
                                <div className="w-24 pt-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Normal Bal</label>
                                    <div className="h-14 flex items-center px-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-500">
                                        {(formData.type === AccountType.ASSET || formData.type === AccountType.EXPENSE) ? 'Debit' : 'Credit'}
                                    </div>
                                </div>
                            </div>

                            <ModernInput 
                                label="Account Name" 
                                placeholder="e.g. Computer Equipment" 
                                icon={<Folder size={18} />}
                                value={formData.name || ''}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        <div className="space-y-5">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Structure & Hierarchy</h4>
                            
                            <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                                <button 
                                    onClick={() => setIsGroupAccount(false)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${!isGroupAccount ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}
                                >
                                    <FileText size={14} /> Ledger (Postable)
                                </button>
                                <button 
                                    onClick={() => setIsGroupAccount(true)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${isGroupAccount ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}
                                >
                                    <Folder size={14} /> Group (Header)
                                </button>
                            </div>

                            <div className="relative">
                                <ModernInput 
                                    label="Parent Account Code" 
                                    placeholder="Optional (Root)" 
                                    value={formData.parentCode || ''}
                                    onChange={e => setFormData({...formData, parentCode: e.target.value})}
                                />
                                {formData.parentCode && (
                                    <div className="absolute right-3 top-4 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded pointer-events-none">
                                        {getParentName(formData.parentCode) || <span className="text-red-400">Invalid Parent</span>}
                                    </div>
                                )}
                            </div>

                            <div className={`p-4 rounded-xl border transition-colors ${isGroupAccount ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-start gap-3">
                                    <Info size={18} className={isGroupAccount ? 'text-indigo-500' : 'text-slate-400'} />
                                    <div>
                                        <h5 className={`text-sm font-bold ${isGroupAccount ? 'text-indigo-900' : 'text-slate-700'}`}>
                                            {isGroupAccount ? 'Group Account' : 'Standard Ledger Account'}
                                        </h5>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            {isGroupAccount 
                                                ? 'Used for summarizing totals in reports. Cannot accept direct journal entries.' 
                                                : 'Used for recording daily transactions. Balances roll up to parent groups.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                    <div className="flex gap-3">
                        {!editingAccount && (
                            <Button variant="secondary" onClick={() => handleSave(true)} className="bg-white border-slate-200 hover:bg-slate-100">
                                Save & Add Another
                            </Button>
                        )}
                        <Button onClick={() => handleSave(false)} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 px-6">
                            <Check size={16} className="mr-2" /> {editingAccount ? 'Update Account' : 'Create Account'}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};
