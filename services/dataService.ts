
import { JournalEntry, COAAccount, User, GLTransaction, TrialBalanceLine } from '../types';

export const dataService = {
    // --- EXPORT UTILS ---

    downloadCSV: (data: any[], filename: string) => {
        if (!data || data.length === 0) {
            alert("No data to export");
            return;
        }

        const headers = Object.keys(data[0]).join(",");
        const csvContent = [
            headers,
            ...data.map(row => Object.values(row).map(val => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    downloadJSON: (data: any[], filename: string) => {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // --- PARSING UTILS ---

    parseCSV: async (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                if (!text) return resolve([]);
                
                const lines = text.split('\n');
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                
                const result = [];
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                    const obj: any = {};
                    headers.forEach((h, index) => {
                        obj[h] = values[index];
                    });
                    result.push(obj);
                }
                resolve(result);
            };
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },

    // --- DATA PREPARATION ---

    prepareJournalExport: (entries: JournalEntry[]) => {
        // Flatten journal entries for CSV
        const flat: any[] = [];
        entries.forEach(e => {
            e.lines.forEach(l => {
                flat.push({
                    JournalNumber: e.journalNumber,
                    Date: e.transactionDate,
                    Reference: e.reference,
                    Description: e.description,
                    Status: e.status,
                    AccountCode: l.accountId,
                    AccountName: l.accountName,
                    Debit: l.debit,
                    Credit: l.credit,
                    CostCenter: l.costCenter || '',
                    User: e.userId
                });
            });
        });
        return flat;
    },

    prepareGLExport: (transactions: GLTransaction[]) => {
        return transactions.map(t => ({
            Date: t.transactionDate,
            Journal: t.journalNumber,
            Account: `${t.accountCode} - ${t.accountName}`,
            Description: t.description,
            Debit: t.debit,
            Credit: t.credit,
            CostCenter: t.costCenter || '',
            User: t.userId
        }));
    }
};
