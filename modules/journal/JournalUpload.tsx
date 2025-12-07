
import React, { useState } from 'react';
import { Card, SectionHeader, Button } from '../../components/ui/UtilityComponents';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, FileText, X } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useToast } from '../../components/ui/Toast';
import { JournalEntry, JournalStatus, JournalType } from '../../types';
import { journalService } from '../../services/journalService';

export const JournalUpload: React.FC = () => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'ready' | 'error'>('idle');
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [stats, setStats] = useState({ rows: 0, debit: 0 });
    const { addToast } = useToast();

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        const validTypes = ['text/csv', 'application/vnd.ms-excel'];
        if (!file.name.endsWith('.csv')) {
            setStatus('error');
            addToast('Only .CSV files currently supported for live parsing', 'error');
            return;
        }

        setFile(file);
        setStatus('analyzing');
        
        try {
            const data = await dataService.parseCSV(file);
            // Basic Validation & Stats
            let totalDebit = 0;
            data.forEach(row => {
                if(row.Debit) totalDebit += parseFloat(row.Debit);
            });

            setParsedData(data);
            setStats({ rows: data.length, debit: totalDebit });
            setStatus('ready');
        } catch (e) {
            setStatus('error');
            addToast('Failed to parse CSV file', 'error');
        }
    };

    const executeImport = async () => {
        try {
            // Convert flat CSV rows to Journal Objects
            const entries: JournalEntry[] = [];
            
            // Group by Reference
            const groups: Record<string, any[]> = {};
            parsedData.forEach(row => {
                const ref = row['Journal Reference'] || `IMP-${Math.random()}`;
                if (!groups[ref]) groups[ref] = [];
                groups[ref].push(row);
            });

            Object.entries(groups).forEach(([ref, rows]) => {
                const totalAmt = rows.reduce((sum, r) => sum + (parseFloat(r.Debit) || 0), 0);
                const lines = rows.map((r, i) => ({
                    id: Math.random().toString(),
                    accountId: r['Account Code'],
                    accountName: 'Imported Account', // Lookup real name in COA in prod
                    debit: parseFloat(r.Debit) || 0,
                    credit: parseFloat(r.Credit) || 0,
                    costCenter: r['Cost Center'],
                    description: r['Description']
                }));

                entries.push({
                    journalNumber: `JE-${Math.floor(Math.random()*100000)}`,
                    reference: ref,
                    transactionDate: rows[0]['Transaction Date'],
                    postingDate: new Date().toISOString(),
                    type: JournalType.GENERAL,
                    description: rows[0]['Description'] || 'Bulk Import',
                    currency: rows[0]['Currency'] || 'USD',
                    exchangeRate: 1,
                    reportingCurrency: 'USD',
                    status: JournalStatus.POSTED,
                    userId: 'IMPORT',
                    period: '04-2025',
                    totalAmount: totalAmt,
                    lines: lines
                });
            });

            // Persist via Service
            await journalService.saveBatch(entries);

            addToast(`${entries.length} Journals imported successfully`, 'success');
            setFile(null);
            setStatus('idle');
        } catch (e) {
            console.error(e);
            addToast('Error saving data', 'error');
        }
    };

    const downloadTemplate = () => {
        const headers = ["Journal Reference", "Transaction Date", "Account Code", "Description", "Debit", "Credit", "Cost Center", "Currency"];
        const sampleRow = ["JE-REF-001", "2025-01-25", "50100", "Rent Expense Jan", "1200.00", "0", "ADMIN", "USD"];
        
        const csvContent = [
            headers.join(","),
            sampleRow.join(",")
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "journal_import_template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <SectionHeader 
                title="Bulk Journal Import" 
                description="Upload journals via CSV. Ensure strict adherence to the template structure."
                action={
                    <Button variant="secondary" onClick={downloadTemplate}>
                        <FileSpreadsheet size={16} /> Download CSV Template
                    </Button>
                }
            />

            <Card className="p-10 text-center">
                <div 
                    className={`border-2 border-dashed rounded-xl p-12 transition-all duration-200 relative
                        ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50'}
                        ${status === 'ready' ? 'border-emerald-500 bg-emerald-50' : ''}
                        ${status === 'error' ? 'border-red-300 bg-red-50' : ''}
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {status === 'idle' || status === 'error' ? (
                        <>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${status === 'error' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {status === 'error' ? <AlertCircle size={32} /> : <Upload size={32} />}
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700">Drag & Drop your file here</h3>
                            <p className="text-slate-500 text-sm mt-2 mb-6">Supports .CSV (Max 5MB)</p>
                            
                            <label className="cursor-pointer block">
                                <span className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition shadow-sm">
                                    Browse Files
                                </span>
                                <input type="file" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} accept=".csv" />
                            </label>
                        </>
                    ) : null}

                    {status === 'analyzing' && (
                        <div className="animate-pulse py-8">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <FileText className="text-indigo-500" size={32}/>
                            </div>
                            <p className="font-medium text-slate-700">Analyzing structure...</p>
                        </div>
                    )}

                    {status === 'ready' && (
                        <div className="py-4">
                             <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-emerald-800">Validation Successful</h3>
                            <p className="text-emerald-600 text-sm mt-1 mb-6 font-medium">
                                <span className="font-bold">{file?.name}</span> is ready for import.
                            </p>
                            <div className="bg-white p-4 rounded-lg border border-emerald-100 max-w-sm mx-auto mb-6 text-left shadow-sm">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500">Total Rows:</span>
                                    <span className="font-mono font-bold text-slate-700">{stats.rows}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500">Total Debit:</span>
                                    <span className="font-mono font-bold text-slate-700">${stats.debit.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex justify-center gap-3">
                                <Button variant="secondary" onClick={() => { setFile(null); setStatus('idle'); }}>
                                    <X size={16} /> Cancel
                                </Button>
                                <Button onClick={executeImport} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">
                                    Import Data
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
