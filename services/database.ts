

export const DB_KEYS = {
    USERS: 'nexus_users',
    COMPANIES: 'nexus_companies',
    JOURNALS: 'nexus_journals',
    COA: 'nexus_coa',
    TICKETS: 'nexus_support_tickets',
    SESSION: 'nexus_session',
    TOKENS: 'nexus_onboarding_tokens'
};

class Database {
    private delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // --- Low Level Access ---
    private get<T>(table: string): T[] {
        try {
            const data = localStorage.getItem(table);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`DB Read Error [${table}]`, e);
            return [];
        }
    }

    private set<T>(table: string, data: T[]) {
        try {
            localStorage.setItem(table, JSON.stringify(data));
        } catch (e) {
            console.error(`DB Write Error [${table}]`, e);
        }
    }

    // --- Public API ---

    async find<T>(table: string, predicate?: (item: T) => boolean): Promise<T[]> {
        // await this.delay(50); // Simulate micro-latency
        const all = this.get<T>(table);
        return predicate ? all.filter(predicate) : all;
    }

    async findOne<T>(table: string, predicate: (item: T) => boolean): Promise<T | null> {
        const all = this.get<T>(table);
        return all.find(predicate) || null;
    }

    async insert<T>(table: string, item: T): Promise<T> {
        const all = this.get<T>(table);
        all.push(item);
        this.set(table, all);
        return item;
    }

    async update<T extends { id?: string; code?: string }>(table: string, idOrCode: string, updates: Partial<T>): Promise<T | null> {
        const all = this.get<T>(table);
        const idx = all.findIndex(x => (x.id === idOrCode || x.code === idOrCode));
        
        if (idx === -1) return null;
        
        all[idx] = { ...all[idx], ...updates };
        this.set(table, all);
        return all[idx];
    }

    async delete(table: string, idOrCode: string): Promise<boolean> {
        let all = this.get<any>(table);
        const initialLen = all.length;
        all = all.filter(x => x.id !== idOrCode && x.code !== idOrCode);
        this.set(table, all);
        return all.length !== initialLen;
    }

    // Bulk operations
    async insertMany<T>(table: string, items: T[]): Promise<void> {
        const all = this.get<T>(table);
        this.set(table, [...all, ...items]);
    }

    async override<T>(table: string, items: T[]): Promise<void> {
        this.set(table, items);
    }

    // Special Session Handling
    getSession<T>(): T | null {
        try {
            const s = localStorage.getItem(DB_KEYS.SESSION);
            return s ? JSON.parse(s) : null;
        } catch (e) { return null; }
    }

    setSession<T>(data: T) {
        localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(data));
    }

    clearSession() {
        localStorage.removeItem(DB_KEYS.SESSION);
    }

    // System Administration
    async factoryReset(preserveSuperAdmin: boolean = true) {
        // Backup Super Admin Session/User if needed
        let superAdminSession = null;
        if (preserveSuperAdmin) {
            superAdminSession = this.getSession();
        }

        // Wipe
        Object.values(DB_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });

        // Restore
        if (preserveSuperAdmin && superAdminSession) {
            this.setSession(superAdminSession);
            // Also ensure the user record exists in the users table
            this.insert(DB_KEYS.USERS, superAdminSession);
        }
    }
}

export const db = new Database();