
import { User, Role, Company, OnboardingToken } from '../types';

const USERS_KEY = 'nexus_users';
const COMPANIES_KEY = 'nexus_companies';
const TOKENS_KEY = 'nexus_onboarding_tokens';
const SESSION_KEY = 'nexus_session';

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
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
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
         localStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
         return { success: true, user: adminUser };
    }

    // 2. Regular User / Company Admin Check
    try {
      const usersStr = localStorage.getItem(USERS_KEY);
      const users: any[] = usersStr ? JSON.parse(usersStr) : [];
      
      const inputHash = await hashPassword(password);
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === inputHash);

      if (user) {
        // Check Company Status
        const companies = authService.getCompanies();
        const company = companies.find(c => c.id === user.companyId);
        
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
        
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
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
      const users = authService.getAllUsers();
      // Find the first admin or super user for that company
      const targetUser = users.find(u => u.companyId === companyId && (u.role === Role.ADMIN || u.role === Role.SUPER_ADMIN));
      
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

      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      return { success: true };
  },

  logout: async () => {
    await delay(300);
    localStorage.removeItem(SESSION_KEY);
  },

  // --- Data Access ---
  getAllUsers: (): User[] => {
      const usersStr = localStorage.getItem(USERS_KEY);
      return usersStr ? JSON.parse(usersStr) : [];
  },

  getCompanyUsers: (companyId: string): User[] => {
      const all = authService.getAllUsers();
      return all.filter(u => u.companyId === companyId);
  },

  saveUser: (user: User) => {
      const usersStr = localStorage.getItem(USERS_KEY);
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];
      
      const existingIndex = users.findIndex(u => u.id === user.id);
      if (existingIndex >= 0) {
          users[existingIndex] = user;
      } else {
          users.push(user);
      }
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  // --- Super Admin Management Functions ---

  // Change user status (Active/Suspended)
  adminUpdateUserStatus: async (userId: string, status: User['status']) => {
      await delay(400);
      const users = authService.getAllUsers();
      const updatedUsers = users.map(u => u.id === userId ? { ...u, status } : u);
      localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      return true;
  },

  // Force reset password (sets temp password)
  adminResetPassword: async (userId: string): Promise<string> => {
      await delay(600);
      const tempPass = generateTempPassword();
      const tempHash = await hashPassword(tempPass);
      
      const users = authService.getAllUsers();
      const updatedUsers = users.map(u => u.id === userId ? { ...u, passwordHash: tempHash, requiresPasswordChange: true } : u);
      localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      return tempPass;
  },

  getTenantLogs: (companyId: string) => {
      // Simulation of logs
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
      const str = localStorage.getItem(COMPANIES_KEY);
      return str ? JSON.parse(str) : [];
  },

  updateCompanyStatus: async (companyId: string, status: Company['status']) => {
      await delay(500);
      const companies = authService.getCompanies();
      const updated = companies.map(c => c.id === companyId ? { ...c, status } : c);
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(updated));
      return true;
  },

  updateCompanyFeatures: async (companyId: string, features: Company['features']) => {
      await delay(500);
      const companies = authService.getCompanies();
      const updated = companies.map(c => c.id === companyId ? { ...c, features } : c);
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(updated));
      return true;
  },

  createCompany: async (name: string, domain: string, features: Company['features']): Promise<{ success: boolean; company?: Company; tokenData?: OnboardingToken }> => {
      await delay(1000);
      try {
          const companies = authService.getCompanies();
          if (companies.some(c => c.name === name || c.domain === domain)) {
              return { success: false }; // Duplicate
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

          // Create Placeholder Admin User
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
              status: 'Pending', // Pending onboarding
              requiresPasswordChange: true,
              createdAt: new Date().toISOString()
          };

          // Save User
          const usersStr = localStorage.getItem(USERS_KEY);
          const users = usersStr ? JSON.parse(usersStr) : [];
          users.push(newAdminUser);
          localStorage.setItem(USERS_KEY, JSON.stringify(users));

          // Save Company
          companies.push(newCompany);
          localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));

          // Generate Onboarding Token
          const tokenStr = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
          const tokenData: OnboardingToken = {
              token: tokenStr,
              companyId: newCompany.id,
              userId: newAdminUser.id,
              email: adminEmail,
              tempPasswordRaw: tempPassword, // Exposed ONE TIME for the Super Admin to copy
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          };

          // Store Token
          const tokensStr = localStorage.getItem(TOKENS_KEY);
          const tokens = tokensStr ? JSON.parse(tokensStr) : [];
          tokens.push(tokenData);
          localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));

          return { success: true, company: newCompany, tokenData };

      } catch (e) {
          console.error(e);
          return { success: false };
      }
  },

  // --- Onboarding Flow ---

  validateOnboardingToken: async (tokenStr: string): Promise<{ valid: boolean; data?: OnboardingToken; error?: string }> => {
      await delay(500);
      const tokensStr = localStorage.getItem(TOKENS_KEY);
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

          // 1. Update User Password & Status
          const usersStr = localStorage.getItem(USERS_KEY);
          let users = usersStr ? JSON.parse(usersStr) : [];
          const newHash = await hashPassword(newPassword);

          users = users.map((u: any) => {
              if (u.id === data.userId) {
                  return { 
                      ...u, 
                      passwordHash: newHash, 
                      fullName, 
                      status: 'Active', 
                      requiresPasswordChange: false 
                  };
              }
              return u;
          });
          localStorage.setItem(USERS_KEY, JSON.stringify(users));

          // 2. Update Company Status
          const companiesStr = localStorage.getItem(COMPANIES_KEY);
          let companies = companiesStr ? JSON.parse(companiesStr) : [];
          companies = companies.map((c: Company) => {
              if (c.id === data.companyId) {
                  return { ...c, status: 'Active' };
              }
              return c;
          });
          localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));

          // 3. Burn Token
          const tokensStr = localStorage.getItem(TOKENS_KEY);
          let tokens = tokensStr ? JSON.parse(tokensStr) : [];
          tokens = tokens.filter((t: OnboardingToken) => t.token !== tokenStr);
          localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));

          // 4. Auto-Login
          const updatedUser = users.find((u: any) => u.id === data.userId);
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
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

          return { success: true };

      } catch (e) {
          return { success: false, error: 'Onboarding failed.' };
      }
  },

  signup: async (fullName: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    await delay(1000);
    return { success: false, error: "Public signup disabled. Please contact sales." }; 
  }
};
