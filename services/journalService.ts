
import { JournalEntry, JournalStatus, JournalType, GLTransaction } from '../types';
import { db, DB_KEYS } from './database';
import { authService } from './authService';

const DEMO_JOURNALS: JournalEntry[] = [
    {
        journalNumber: 'JE-100452',
        reference: 'PAYROLL-JAN',
        transactionDate: '2025-01-25',
        postingDate: '2025-01-25T14:30:00.000Z',
        type: JournalType.GENERAL,
        description: 'Monthly payroll processing for January 2025 including tax and benefits allocations',
        currency: 'USD',
        exchangeRate: 1,
        reportingCurrency: 'USD',
        status: JournalStatus.POSTED,
        userId: 'SYS-ADMIN',
        period: '01-2025',
        totalAmount: 125000,
        lines: [
            { id: '1', accountId: '50100', accountName: 'Salaries Expense', debit: 125000, credit: 0, costCenter: 'HR' },
            { id: '2', accountId: '10110', accountName: 'Cash in Bank', debit: 0, credit: 125000 }
        ]
    }
];

export const journalService = {
    getAll: async (): Promise<JournalEntry[]> => {
        const user = db.getSession<any>();
        if (!user) return [];

        let entries = await db.find<JournalEntry>(DB_KEYS.JOURNALS);
        
        // Seed demo data ONLY for the Demo Company ID '1' if empty
        if (entries.length === 0 && user.companyId === '1') {
            await db.insertMany(DB_KEYS.JOURNALS, DEMO_JOURNALS);
            return DEMO_JOURNALS;
        }

        return entries;
    },

    save: async (entry: JournalEntry) => {
        // Basic insert for now, assuming new entries are always unique by journalNumber or just pushed
        // In a real DB, we'd check ID. Here we push to the list.
        await db.insert(DB_KEYS.JOURNALS, entry);
    },

    saveBatch: async (entries: JournalEntry[]) => {
        await db.insertMany(DB_KEYS.JOURNALS, entries);
    },

    reverse: async (original: JournalEntry) => {
        const reversalLines = original.lines.map(l => ({
            ...l,
            id: Math.random().toString(),
            debit: l.credit,
            credit: l.debit
        }));

        const reversal: JournalEntry = {
            ...original,
            journalNumber: `JE-${Math.floor(200000 + Math.random() * 900000)}`,
            reference: `REV-${original.journalNumber}`,
            description: `Reversal of Journal ${original.journalNumber} - ${original.description.substring(0, 50)}...`,
            type: JournalType.REVERSAL,
            status: JournalStatus.POSTED,
            lines: reversalLines,
            postingDate: new Date().toISOString(),
            transactionDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-') 
        };

        await db.insert(DB_KEYS.JOURNALS, reversal);
        return reversal;
    },

    getGLTransactions: async (): Promise<GLTransaction[]> => {
        const journals = await journalService.getAll();
        const flat: GLTransaction[] = [];
        
        journals.forEach(entry => {
            if (entry.status !== JournalStatus.POSTED) return;
            const isWeekend = new Date(entry.transactionDate).getDay() === 0 || new Date(entry.transactionDate).getDay() === 6;
            const isHighValue = entry.totalAmount > 100000;
            const isException = isWeekend || isHighValue;
            const exceptionReason = isWeekend ? 'Weekend Posting' : isHighValue ? 'High Value > 100k' : '';

            entry.lines.forEach(line => {
                flat.push({
                    id: `${entry.journalNumber}-${line.id}`,
                    journalNumber: entry.journalNumber,
                    transactionDate: entry.transactionDate,
                    postingDate: entry.postingDate,
                    accountCode: line.accountId,
                    accountName: line.accountName,
                    description: line.description || entry.description,
                    type: entry.type,
                    debit: line.debit,
                    credit: line.credit,
                    balance: 0,
                    userId: entry.userId,
                    costCenter: line.costCenter,
                    currency: entry.currency,
                    isException,
                    exceptionReason
                });
            });
        });
        return flat.sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
    }
};
