
import React, { useState } from 'react';
import { Card, SectionHeader, Button } from '../../components/ui/UtilityComponents';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, FileText, X } from 'lucide-react';

export const JournalUpload: React.FC = () => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'ready' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

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

    const handleFile = (file: File) => {
        // Validate File Type
        const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            setStatus('error');
            setErrorMessage('Invalid file type. Please upload a .CSV or .XLSX file.');
            return;
        }

        setFile(file);
        setStatus('analyzing');
        setErrorMessage('');
        
        // Simulate analysis
        setTimeout(() => {
            setStatus('ready');
        }, 1500);
    };

    const downloadTemplate = () => {
        const headers = ["Journal Reference", "Transaction Date", "Account Code", "Description", "Debit", "Credit", "Cost Center", "Currency"];
        const sampleRow = ["JE-REF-001", "25-01-2025", "50100", "Rent Expense Jan", "1200.00", "0", "ADMIN", "USD"];
        
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
                description="Upload journals via Excel/CSV. Ensure strict adherence to the template structure."
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
                            <p className="text-slate-500 text-sm mt-2 mb-6">Supports .xlsx, .csv (Max 5MB)</p>
                            
                            {status === 'error' && (
                                <div className="mb-6 p-2 bg-red-100 text-red-700 text-xs rounded font-medium inline-block">
                                    {errorMessage}
                                </div>
                            )}

                            <label className="cursor-pointer block">
                                <span className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition shadow-sm">
                                    Browse Files
                                </span>
                                <input type="file" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} accept=".csv, .xlsx" />
                            </label>
                        </>
                    ) : null}

                    {status === 'analyzing' && (
                        <div className="animate-pulse py-8">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <FileText className="text-indigo-500" size={32}/>
                            </div>
                            <div className="h-2 bg-slate-200 rounded w-48 mx-auto mb-2 relative overflow-hidden">
                                <div className="absolute top-0 left-0 h-full w-1/2 bg-indigo-500 animate-[shimmer_1s_infinite]"></div>
                            </div>
                            <p className="font-medium text-slate-700">Analyzing structure...</p>
                            <p className="text-xs text-slate-500 mt-1">Validating column headers and data types</p>
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
                                    <span className="font-mono font-bold text-slate-700">150</span>
                                </div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500">Total Debit:</span>
                                    <span className="font-mono font-bold text-slate-700">$12,450.00</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Status:</span>
                                    <span className="text-emerald-600 font-bold text-xs uppercase bg-emerald-50 px-2 py-0.5 rounded">Balanced</span>
                                </div>
                            </div>
                            <div className="flex justify-center gap-3">
                                <Button variant="secondary" onClick={() => { setFile(null); setStatus('idle'); }}>
                                    <X size={16} /> Cancel
                                </Button>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">
                                    Import 150 Entries
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-4 text-sm text-blue-800">
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="font-bold mb-1">Import Guidelines</h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-700/80 text-xs">
                        <li>Dates must strictly follow <strong>dd-mm-yyyy</strong> format (e.g., 25-01-2025).</li>
                        <li>Account codes must exist in the active Chart of Accounts prior to import.</li>
                        <li>Each unique <strong>Journal Reference</strong> is treated as a single transaction block.</li>
                        <li>Debit and Credit totals for each Reference block must balance to zero.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
    