import React, { useState } from 'react';
import { Card, SectionHeader, Button, Badge } from '../../components/ui/UtilityComponents';
import { ModernInput } from '../../components/ui/ModernInput';
import { Currency } from '../../types';
import { Coins, Plus, Save, RefreshCw, Star, Trash2, TrendingUp, AlertCircle, Hash } from 'lucide-react';

const INITIAL_CURRENCIES: Currency[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0000, isBase: true, status: 'Active' },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.9200, isBase: false, status: 'Active' },
    { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.7900, isBase: false, status: 'Active' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', rate: 13.5000, isBase: false, status: 'Active' },
];

export const CurrencyManagement: React.FC = () => {
    const [currencies, setCurrencies] = useState<Currency[]>(INITIAL_CURRENCIES);
    const [newCurrencyCode, setNewCurrencyCode] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const baseCurrency = currencies.find(c => c.isBase);

    const handleSetBase = (code: string) => {
        if (!window.confirm(`Set ${code} as the new Base Currency? All other rates should be updated relative to ${code}.`)) return;

        setCurrencies(currencies.map(c => {
            if (c.code === code) {
                return { ...c, isBase: true, rate: 1.0000 };
            }
            if (c.isBase) {
                return { ...c, isBase: false }; 
            }
            return c;
        }));
    };

    const handleRateChange = (code: string, newRate: string) => {
        const rate = parseFloat(newRate);
        if (isNaN(rate)) return;

        setCurrencies(currencies.map(c => 
            c.code === code ? { ...c, rate } : c
        ));
        setIsEditing(true);
    };

    const handleRateFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (!isEditing) {
             if (!window.confirm('Are you sure you want to manually set this rate? This may affect historical reporting.')) {
                e.target.blur();
            }
        }
    };

    const handleAddCurrency = () => {
        if (!newCurrencyCode || currencies.some(c => c.code === newCurrencyCode)) return;
        
        const newCurrency: Currency = {
            code: newCurrencyCode.toUpperCase(),
            name: 'New Currency',
            symbol: newCurrencyCode.toUpperCase(),
            rate: 1.0,
            isBase: false,
            status: 'Active'
        };
        
        setCurrencies([...currencies, newCurrency]);
        setNewCurrencyCode('');
    };

    const handleDelete = (code: string) => {
        if (window.confirm(`Remove ${code}?`)) {
            setCurrencies(currencies.filter(c => c.code !== code));
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader 
                title="Multi-Currency Engine" 
                description="Manage global exchange rates and define the functional (base) currency for reporting."
                action={
                    <Button variant="secondary" onClick={() => alert('Rate feed connection simulated.')}>
                        <RefreshCw size={16} /> Sync Live Rates
                    </Button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                            <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                <Coins size={18} /> Active Currencies
                            </h4>
                            <div className="flex gap-2 items-center">
                                <div className="w-32">
                                    <ModernInput
                                        label="CODE"
                                        placeholder="JPY"
                                        value={newCurrencyCode}
                                        onChange={e => setNewCurrencyCode(e.target.value)}
                                        maxLength={3}
                                        className="mb-0" // override standard margin
                                    />
                                </div>
                                <Button size="sm" onClick={handleAddCurrency} disabled={!newCurrencyCode} className="h-14">
                                    <Plus size={16} /> Add
                                </Button>
                            </div>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-slate-500">Currency</th>
                                    <th className="px-6 py-3 font-medium text-slate-500 text-right">Exchange Rate</th>
                                    <th className="px-6 py-3 font-medium text-slate-500 text-center">Status</th>
                                    <th className="px-6 py-3 font-medium text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currencies.map(currency => (
                                    <tr key={currency.code} className={`group ${currency.isBase ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border ${currency.isBase ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                                                    {currency.symbol}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 flex items-center gap-2">
                                                        {currency.code}
                                                        {currency.isBase && <Badge type="info">BASE</Badge>}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{currency.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {currency.isBase ? (
                                                <div className="font-mono font-bold text-slate-700 bg-slate-100 py-1 px-3 rounded inline-block">1.0000</div>
                                            ) : (
                                                <input 
                                                    type="number" 
                                                    step="0.0001"
                                                    className="w-28 text-right font-mono font-medium text-slate-800 border-2 border-slate-100 hover:border-indigo-300 focus:border-indigo-500 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                                    value={currency.rate}
                                                    onFocus={handleRateFocus}
                                                    onChange={(e) => handleRateChange(currency.code, e.target.value)}
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge type="success">{currency.status}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!currency.isBase && (
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleSetBase(currency.code)}
                                                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                        title="Set as Base Currency"
                                                    >
                                                        <Star size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(currency.code)}
                                                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {isEditing && (
                            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                                <Button onClick={() => { setIsEditing(false); alert('Rates updated successfully.'); }}>
                                    <Save size={16} /> Save Changes
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-5 bg-slate-800 text-white border-slate-700 shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="text-emerald-400" size={20} />
                            <h4 className="font-semibold">Base Currency Impact</h4>
                        </div>
                        <div className="space-y-4 text-sm text-slate-300">
                            <p>
                                The <strong>Functional Currency</strong> is currently set to <span className="text-white font-bold">{baseCurrency?.code}</span>.
                            </p>
                            <ul className="space-y-2 list-disc list-inside">
                                <li>All GL consolidations use this rate.</li>
                                <li>Foreign currency transactions are revalued against 1.0 {baseCurrency?.code}.</li>
                                <li>Reporting currency defaults to {baseCurrency?.code}.</li>
                            </ul>
                        </div>
                    </Card>

                    <Card className="p-5 border-l-4 border-l-indigo-500">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <AlertCircle size={16} className="text-indigo-600" /> Rate Policy
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Exchange rates are fetched daily at 00:00 UTC from central bank feeds. Manual overrides (like those made above) will persist until the next scheduled sync or until locked.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};