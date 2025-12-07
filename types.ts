

export enum Role {
  SUPER_ADMIN = 'Super Admin',
  ADMIN = 'Administrator',
  FINANCE_MANAGER = 'Finance Manager',
  ACCOUNTANT = 'Accountant',
  AUDITOR = 'Auditor',
  VIEWER = 'Viewer'
}

export enum AccountType {
  ASSET = 'Asset',
  LIABILITY = 'Liability',
  EQUITY = 'Equity',
  REVENUE = 'Revenue',
  EXPENSE = 'Expense'
}

export enum PeriodStatus {
  OPEN = 'Open',
  CLOSED = 'Closed',
  FUTURE = 'Future'
}

export enum JournalType {
  GENERAL = 'General Journal',
  ACCRUAL = 'Accruals',
  ADJUSTMENT = 'Adjustments',
  RECLASSIFICATION = 'Reclassification',
  REVERSAL = 'Reversed'
}

export enum JournalStatus {
  DRAFT = 'Saved',
  POSTED = 'Posted',
  REVERSED = 'Reversed'
}

export interface Company {
    id: string;
    name: string;
    domain: string;
    status: 'Active' | 'Suspended' | 'Provisioning';
    features: {
        gl: boolean;
        ap: boolean;
        ar: boolean;
        payroll: boolean;
        inventory: boolean;
    };
    maxUsers: number;
    createdAt: string;
}

export interface User {
  id: string;
  companyId: string; // '0' for Super Admin
  fullName: string;
  email: string;
  role: Role;
  department: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  lastLogin?: string;
  requiresPasswordChange?: boolean;
}

export interface OnboardingToken {
    token: string;
    companyId: string;
    userId: string; // The placeholder admin user
    email: string;
    tempPasswordRaw: string; // Only stored temporarily for the link generation display
    expiresAt: string;
}

export interface COAAccount {
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string; // For hierarchy
  balance: number;
  isSystem?: boolean;
}

export interface FiscalPeriod {
  id: string;
  name: string; // e.g., "Period 1"
  startDate: string; // ISO or YYYY-MM-DD
  endDate: string;
  status: PeriodStatus;
}

export interface Currency {
  code: string; // USD, EUR
  name: string;
  symbol: string;
  rate: number; // Base currency is always 1.0
  isBase: boolean;
  status: 'Active' | 'Inactive';
}

export interface CompanyPolicy {
  fiscalYearStartMonth: number; // 1 = Jan
  allowBackdating: boolean;
  backdatingDaysLimit: number;
  dateFormat: 'dd-mm-yyyy';
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  costCenter?: string; // Conditional for P&L
  description?: string;
}

export interface JournalEntry {
  journalNumber: string; // JE-XXXXXX
  reference: string;
  transactionDate: string; // dd-mm-yyyy
  postingDate: string; // ISO timestamp
  type: JournalType;
  description: string;
  currency: string;
  exchangeRate: number;
  reportingCurrency: string;
  status: JournalStatus;
  userId: string;
  period: string; // mm-yyyy
  lines: JournalLine[];
  totalAmount: number;
}

export interface GLTransaction {
  id: string;
  journalNumber: string;
  transactionDate: string;
  postingDate: string;
  accountCode: string;
  accountName: string;
  description: string; // Line description or header description
  type: JournalType;
  debit: number;
  credit: number;
  balance: number; // Running balance
  userId: string;
  costCenter?: string;
  currency: string;
  entityId?: string; // For multi-entity consolidation
  isException?: boolean; // AI/Rule-based flag
  exceptionReason?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  module: string;
  user: string;
  timestamp: string;
  details: string;
  status: 'Success' | 'Failed' | 'Warning';
}

export interface IntegrationApp {
  id: string;
  name: string;
  category: 'Banking' | 'Payment' | 'Communication' | 'Storage';
  status: 'Connected' | 'Disconnected' | 'Pending';
  lastSync?: string;
  icon?: string;
}

export interface SystemMetric {
    label: string;
    value: string;
    status: 'Healthy' | 'Degraded' | 'Down';
    trend?: 'up' | 'down' | 'stable';
}

export interface GLFilterPreset {
    id: string;
    name: string;
    criteria: {
        accountFilter?: string;
        typeFilter?: string;
        minAmount?: string;
        maxAmount?: string;
        costCenterFilter?: string;
    }
}

export interface TrialBalanceLine {
    accountCode: string;
    accountName: string;
    type: AccountType;
    currentDebit: number;
    currentCredit: number;
    currentNet: number;
    priorNet: number;
    variance: number;
    variancePercent: number;
    level: number; // 0 for header, 1 for item
    hasChildren: boolean;
}