
import { COAAccount, AccountType } from '../types';
import { db, DB_KEYS } from './database';

const INITIAL_COA: COAAccount[] = [
  { code: '10000', name: 'Non-Current Assets', type: AccountType.ASSET, balance: 0, isSystem: true },
  { code: '11000', name: 'Property, Plant & Equip.', type: AccountType.ASSET, parentCode: '10000', balance: 1250000 },
  { code: '20000', name: 'Current Assets', type: AccountType.ASSET, balance: 0, isSystem: true },
  { code: '20100', name: 'Cash & Equivalents', type: AccountType.ASSET, parentCode: '20000', balance: 0, isSystem: true },
  { code: '20110', name: 'Operating Account (USD)', type: AccountType.ASSET, parentCode: '20100', balance: 150000 },
  { code: '30000', name: 'Liabilities', type: AccountType.LIABILITY, balance: 0, isSystem: true },
  { code: '30100', name: 'Accounts Payable', type: AccountType.LIABILITY, parentCode: '30000', balance: 45000 },
  { code: '40000', name: 'Equity', type: AccountType.EQUITY, balance: 0, isSystem: true },
  { code: '40100', name: 'Retained Earnings', type: AccountType.EQUITY, parentCode: '40000', balance: 850000 },
  { code: '50000', name: 'Revenue', type: AccountType.REVENUE, balance: 0, isSystem: true },
  { code: '50100', name: 'Sales Revenue', type: AccountType.REVENUE, parentCode: '50000', balance: 500000 },
  { code: '60000', name: 'Expenses', type: AccountType.EXPENSE, balance: 0, isSystem: true },
  { code: '60100', name: 'Rent Expense', type: AccountType.EXPENSE, parentCode: '60000', balance: 12000 },
];

export const accountService = {
    getAll: async (): Promise<COAAccount[]> => {
        const accounts = await db.find<COAAccount>(DB_KEYS.COA);
        if (accounts.length === 0) {
            // Seed initial data if empty
            await db.insertMany(DB_KEYS.COA, INITIAL_COA);
            return INITIAL_COA;
        }
        return accounts;
    },

    save: async (account: COAAccount) => {
        const existing = await db.findOne<COAAccount>(DB_KEYS.COA, a => a.code === account.code);
        if (existing) {
            await db.update(DB_KEYS.COA, account.code, account);
        } else {
            await db.insert(DB_KEYS.COA, account);
        }
    },

    delete: async (code: string) => {
        await db.delete(DB_KEYS.COA, code);
    },

    getTree: async () => {
        const accounts = await accountService.getAll();
        // Transformation logic for tree view can remain in component or move here
        return accounts;
    }
};
