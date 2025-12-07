

import { User, Role, Company, OnboardingToken } from '../types';
import { db, DB_KEYS } from './database';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const hashPassword = async (password: string) => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateTempPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
    let pass = "";
    for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
};

export const authService = {
  // --- Session Management ---
  getSession: (): User | null => {
    return db.getSession<User>();
  },

  // --- Core Authentication ---
  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    await delay(800);

    // 1. Super Admin Check (System Owner)
    if (email === 'admin@nexus.com' && password === 'nexusemma') {
         const adminUser: User = { 
             id: '000', 
             companyId: '0', 
             fullName: 'System Owner', 
             email, 
             role: Role.SUPER_ADMIN, 
             department: 'System', 
             status: 'Active' 
         };
         db.setSession(adminUser);
         // Ensure record exists in DB for lookups
         const exists = await db.findOne<User>(DB_KEYS.USERS, u => u.id === '000');
         if (!exists) await db.insert(DB_KEYS.USERS, adminUser);
         
         return { success: true, user: adminUser };
    }

    // 2. Regular User / Company Admin Check
    try {
      const inputHash = await hashPassword(password);
      const user = await db.findOne<User>(DB_KEYS.USERS, u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === inputHash);

      if (user) {
        // Check Company Status
        const company = await db.findOne<Company>(DB_KEYS.COMPANIES, c => c.id === user.companyId);
        
        if (company && (company.status === 'Suspended')) {
             return { success: false, error: 'Your organization account has been suspended. Please contact Nexus support.' };
        }

        if (user.status === 'Suspended' || user.status === 'Inactive') {
            return { success: false, error: 'User account is suspended. Contact your administrator.' };
        }

        const sessionUser: User = {
          id: user.id,
          companyId: user.companyId,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          department: user.department,
          status: user.status,
          lastLogin: new Date().toISOString(),
          requiresPasswordChange: user.requiresPasswordChange
        };
        
        db.setSession(sessionUser);
        
        // Update last login in DB
        await db.update<User>(DB_KEYS.USERS, user.id, { lastLogin: new Date().toISOString() });

        return { success: true, user: sessionUser };
      }

      return { success: false, error: 'Invalid email or password.' };
    } catch (error) {
      return { success: false, error: 'System error during login.' };
    }
  },

  // Impersonate a Tenant Admin (God Mode)
  impersonateTenant: async (companyId: string): Promise<{ success: boolean; error?: string }> => {
      await delay(1000);
      const users = await db.find<User>(DB_KEYS.USERS, u => u.companyId === companyId && (u.role === Role.ADMIN || u.role === Role.SUPER_ADMIN));
      const targetUser = users[0];
      
      if (!targetUser) {
          return { success: false, error: 'No valid administrator found for this tenant.' };
      }

      const sessionUser: User = {
          id: targetUser.id,
          companyId: targetUser.companyId,
          fullName: targetUser.fullName,
          email: targetUser.email,
          role: targetUser.role,
          department: targetUser.department,
          status: targetUser.status,
          lastLogin: new Date().toISOString()
      };

      db.setSession(sessionUser);
      return { success: true };
  },

  logout: async () => {
    await delay(300);
    db.clearSession();
  },

  // --- Data Access ---
  getAllUsers: (): User[] => {
      // Synchronous wrapper for compatibility, but ideal to move to async. 
      // For now, since DB is localStorage based, we can cheat and use the internal get logic if needed, 
      // but let's assume the component handles the promise or we make this async.
      // Wait, the components expect synchronous return currently. 
      // We'll use a direct access hack for this specific method until components are refactored to async.
      try {
          const data = localStorage.getItem(DB_KEYS.USERS);
          return data ? JSON.parse(data) : [];
      } catch { return []; }
  },

  getCompanyUsers: (companyId: string): User[] => {
      const all = authService.getAllUsers();
      return all.filter(u => u.companyId === companyId);
  },

  saveUser: async (user: User) => {
      const existing = await db.findOne<User>(DB_KEYS.USERS, u => u.id === user.id);
      if (existing) {
          await db.update(DB_KEYS.USERS, user.id, user);
      } else {
          await db.insert(DB_KEYS.USERS, user);
      }
  },

  // --- Super Admin Management Functions ---

  adminUpdateUserStatus: async (userId: string, status: User['status']) => {
      await delay(400);
      await db.update<User>(DB_KEYS.USERS, userId, { status });
      return true;
  },

  adminResetPassword: async (userId: string): Promise<string> => {
      await delay(600);
      const tempPass = generateTempPassword();
      const tempHash = await hashPassword(tempPass);
      await db.update<User>(DB_KEYS.USERS, userId, { passwordHash: tempHash, requiresPasswordChange: true });
      return tempPass;
  },

  getTenantLogs: (companyId: string) => {
      const actions = ['Feature Enabled', 'User Added', 'Login Failed', 'Report Exported', 'Settings Changed'];
      const logs = [];
      for(let i=0; i<5; i++) {
          logs.push({
              id: `log_${Math.random().toString(36).substr(2,5)}`,
              action: actions[Math.floor(Math.random() * actions.length)],
              timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
              details: 'System automated log entry'
          });
      }
      return logs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // --- Super Admin Provisioning ---
  
  getCompanies: (): Company[] => {
      try {
          const data = localStorage.getItem(DB_KEYS.COMPANIES);
          return data ? JSON.parse(data) : [];
      } catch { return []; }
  },

  updateCompanyStatus: async (companyId: string, status: Company['status']) => {
      await delay(500);
      await db.update<Company>(DB_KEYS.COMPANIES, companyId, { status });
      return true;
  },

  updateCompanyFeatures: async (companyId: string, features: Company['features']) => {
      await delay(500);
      await db.update<Company>(DB_KEYS.COMPANIES, companyId, { features });
      return true;
  },

  createCompany: async (name: string, domain: string, features: Company['features']): Promise<{ success: boolean; company?: Company; tokenData?: OnboardingToken }> => {
      await delay(1000);
      try {
          const companies = authService.getCompanies();
          if (companies.some(c => c.name === name || c.domain === domain)) {
              return { success: false }; 
          }

          const newCompany: Company = {
              id: `comp_${Math.random().toString(36).substr(2, 9)}`,
              name,
              domain,
              status: 'Provisioning',
              features,
              maxUsers: 5,
              createdAt: new Date().toISOString()
          };

          const tempPassword = generateTempPassword();
          const tempHash = await hashPassword(tempPassword);
          const adminEmail = `admin@${domain}`;

          const newAdminUser = {
              id: `usr_${Math.random().toString(36).substr(2, 9)}`,
              companyId: newCompany.id,
              fullName: 'Company Administrator',
              email: adminEmail,
              passwordHash: tempHash,
              role: Role.ADMIN,
              department: 'Management',
              status: 'Pending', 
              requiresPasswordChange: true,
              createdAt: new Date().toISOString()
          };

          await db.insert(DB_KEYS.USERS, newAdminUser);
          await db.insert(DB_KEYS.COMPANIES, newCompany);

          const tokenStr = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
          const tokenData: OnboardingToken = {
              token: tokenStr,
              companyId: newCompany.id,
              userId: newAdminUser.id,
              email: adminEmail,
              tempPasswordRaw: tempPassword,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          };

          await db.insert(DB_KEYS.TOKENS, tokenData); 
          
          const tokens = JSON.parse(localStorage.getItem(DB_KEYS.TOKENS) || '[]');
          tokens.push(tokenData);
          localStorage.setItem(DB_KEYS.TOKENS, JSON.stringify(tokens));

          return { success: true, company: newCompany, tokenData };

      } catch (e) {
          console.error(e);
          return { success: false };
      }
  },

  // --- Onboarding Flow ---

  validateOnboardingToken: async (tokenStr: string): Promise<{ valid: boolean; data?: OnboardingToken; error?: string }> => {
      await delay(500);
      const tokensStr = localStorage.getItem(DB_KEYS.TOKENS);
      const tokens: OnboardingToken[] = tokensStr ? JSON.parse(tokensStr) : [];
      
      const found = tokens.find(t => t.token === tokenStr);
      
      if (!found) return { valid: false, error: 'Invalid token.' };
      if (new Date(found.expiresAt) < new Date()) return { valid: false, error: 'Token expired.' };

      return { valid: true, data: found };
  },

  completeOnboarding: async (tokenStr: string, newPassword: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
      await delay(1500);
      try {
          const { valid, data } = await authService.validateOnboardingToken(tokenStr);
          if (!valid || !data) return { success: false, error: 'Invalid session' };

          const newHash = await hashPassword(newPassword);
          await db.update<User>(DB_KEYS.USERS, data.userId, { 
              passwordHash: newHash, 
              fullName, 
              status: 'Active', 
              requiresPasswordChange: false 
          });

          await db.update<Company>(DB_KEYS.COMPANIES, data.companyId, { status: 'Active' });

          // Burn Token
          const tokensStr = localStorage.getItem(DB_KEYS.TOKENS);
          let tokens = tokensStr ? JSON.parse(tokensStr) : [];
          tokens = tokens.filter((t: OnboardingToken) => t.token !== tokenStr);
          localStorage.setItem(DB_KEYS.TOKENS, JSON.stringify(tokens));

          // Auto-Login
          const updatedUser = await db.findOne<User>(DB_KEYS.USERS, u => u.id === data.userId);
          if (updatedUser) {
              const sessionUser: User = {
                id: updatedUser.id,
                companyId: updatedUser.companyId,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                role: updatedUser.role,
                department: updatedUser.department,
                status: updatedUser.status,
                lastLogin: new Date().toISOString()
              };
              db.setSession(sessionUser);
          }

          return { success: true };

      } catch (e) {
          return { success: false, error: 'Onboarding failed.' };
      }
  },

  // --- System Management ---
  factoryReset: async () => {
      return db.factoryReset(true);
  },

  signup: async (fullName: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    await delay(1000);
    return { success: false, error: "Public signup disabled. Please contact sales." }; 
  }
};