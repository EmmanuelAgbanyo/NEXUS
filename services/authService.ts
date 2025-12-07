// services/authService.ts
import { User, Role, Company, OnboardingToken } from '../types';
import { saveToCloud, loadFromCloud } from '../src/utils/cloudStorage.js'; // cloud keys: 'users','companies','tokens'

// Local session key remains in localStorage
const SESSION_KEY = 'nexus_session';

// helper delay to simulate latency (kept from original)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// hashing helpers (kept from original)
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

// Normalizes responses from loadFromCloud.
// loadFromCloud may return either { data: [...] } or the raw array itself.
async function readCloudArray<T = any>(key: string): Promise<T[]> {
  try {
    const res = await loadFromCloud(key);
    if (!res) return [];
    // If response shape is { data: [...] }
    if (typeof res === 'object' && res !== null && 'data' in res) {
      return Array.isArray((res as any).data) ? (res as any).data : [];
    }
    // If it's already the raw array
    return Array.isArray(res) ? res : [];
  } catch (e) {
    return [];
  }
}

async function writeCloudArray<T = any>(key: string, arr: T[]) {
  // Save the array directly
  await saveToCloud(key, arr);
}

export const authService = {
  // --- Session Management ---
  getSession: async (): Promise<User | null> => {
    try {
      const stored = await loadFromCloud(SESSION_KEY);
      return stored ? (stored as User) : null;
    } catch (e) {
      return null;
    }
  },

  // --- Core Authentication ---
  // Returns same shape as before: { success, user?, error? }
  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    await delay(800);

    // 1. Super Admin Check (System Owner) - keep the hardcoded bypass
    if (email === 'admin@nexus.com' && password === 'nexusemma') {
      const adminUser: User = {
        id: '000',
        companyId: '0',
        fullName: 'System Owner',
        email,
        role: Role.SUPER_ADMIN,
        department: 'System',
        status: 'Active',
      };
      await saveToCloud(SESSION_KEY, adminUser);
      return { success: true, user: adminUser };
    }

    try {
      const users = await readCloudArray('users');

      const inputHash = await hashPassword(password);
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && (u as any).passwordHash === inputHash);

      if (!found) {
        return { success: false, error: 'Invalid email or password.' };
      }

      // Company checks
      const companies = await readCloudArray<Company>('companies');
      const company = companies.find(c => c.id === found.companyId);

      if (company && company.status === 'Suspended') {
        return { success: false, error: 'Your organization account has been suspended. Please contact Nexus support.' };
      }

      if ((found as any).status === 'Suspended' || (found as any).status === 'Inactive') {
        return { success: false, error: 'User account is suspended. Contact your administrator.' };
      }

      const sessionUser: User = {
        id: found.id,
        companyId: found.companyId,
        fullName: found.fullName,
        email: found.email,
        role: found.role,
        department: found.department,
        status: found.status,
        lastLogin: new Date().toISOString(),
        requiresPasswordChange: (found as any).requiresPasswordChange
      };

      await saveToCloud(SESSION_KEY, sessionUser);
      return { success: true, user: sessionUser };

    } catch (error) {
      console.error("Login error (authService)", error);
      return { success: false, error: 'System error during login.' };
    }
  },

  // Impersonate a Tenant Admin (God Mode)
  impersonateTenant: async (companyId: string): Promise<{ success: boolean; error?: string }> => {
    await delay(1000);
    const users = await readCloudArray<User>('users');

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

    await saveToCloud(SESSION_KEY, sessionUser);
    return { success: true };
  },

  logout: async () => {
    await delay(300);
    await saveToCloud(SESSION_KEY, null);
  },

  // --- Data Access ---
  // These are async now — call with await
  getAllUsers: async (): Promise<User[]> => {
    return await readCloudArray<User>('users');
  },

  getCompanyUsers: async (companyId: string): Promise<User[]> => {
    const all = await readCloudArray<User>('users');
    return all.filter(u => u.companyId === companyId);
  },

  saveUser: async (user: User) => {
    const users = await readCloudArray<User>('users');
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    await writeCloudArray('users', users);
  },

  // --- Super Admin Management Functions ---
  adminUpdateUserStatus: async (userId: string, status: User['status']) => {
    await delay(400);
    const users = await readCloudArray<User>('users');
    const updatedUsers = users.map(u => u.id === userId ? { ...u, status } : u);
    await writeCloudArray('users', updatedUsers);
    return true;
  },

  adminResetPassword: async (userId: string): Promise<string> => {
    await delay(600);
    const tempPass = generateTempPassword();
    const tempHash = await hashPassword(tempPass);

    const users = await readCloudArray<User>('users');
    const updatedUsers = users.map(u => u.id === userId ? { ...(u as any), passwordHash: tempHash, requiresPasswordChange: true } : u);
    await writeCloudArray('users', updatedUsers);
    return tempPass;
  },

  getTenantLogs: (companyId: string) => {
    // Simulation of logs — synchronous
    const actions = ['Feature Enabled', 'User Added', 'Login Failed', 'Report Exported', 'Settings Changed'];
    const logs = [];
    for (let i = 0; i < 5; i++) {
      logs.push({
        id: `log_${Math.random().toString(36).substr(2, 5)}`,
        action: actions[Math.floor(Math.random() * actions.length)],
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
        details: 'System automated log entry'
      });
    }
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // --- Super Admin Provisioning ---
  getCompanies: async (): Promise<Company[]> => {
    return await readCloudArray<Company>('companies');
  },

  updateCompanyStatus: async (companyId: string, status: Company['status']) => {
    await delay(500);
    const companies = await readCloudArray<Company>('companies');
    const updated = companies.map(c => c.id === companyId ? { ...c, status } : c);
    await writeCloudArray('companies', updated);
    return true;
  },

  updateCompanyFeatures: async (companyId: string, features: Company['features']) => {
    await delay(500);
    const companies = await readCloudArray<Company>('companies');
    const updated = companies.map(c => c.id === companyId ? { ...c, features } : c);
    await writeCloudArray('companies', updated);
    return true;
  },

  createCompany: async (name: string, domain: string, features: Company['features']): Promise<{ success: boolean; company?: Company; tokenData?: OnboardingToken }> => {
    await delay(1000);
    try {
      const companies = await readCloudArray<Company>('companies');
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

      const newAdminUser: any = {
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

      // Persist new user
      const users = await readCloudArray<User>('users');
      users.push(newAdminUser);
      await writeCloudArray('users', users);

      // Persist new company
      companies.push(newCompany);
      await writeCloudArray('companies', companies);

      // Generate Onboarding Token
      const tokenStr = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
      const tokenData: OnboardingToken = {
        token: tokenStr,
        companyId: newCompany.id,
        userId: newAdminUser.id,
        email: adminEmail,
        tempPasswordRaw: tempPassword, // exposed one time for super admin to copy
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      // Save token
      const tokens = await readCloudArray<OnboardingToken>('tokens');
      tokens.push(tokenData);
      await writeCloudArray('tokens', tokens);

      return { success: true, company: newCompany, tokenData };

    } catch (e) {
      console.error("createCompany error", e);
      return { success: false };
    }
  },

  // --- Onboarding Flow ---
  validateOnboardingToken: async (tokenStr: string): Promise<{ valid: boolean; data?: OnboardingToken; error?: string }> => {
    await delay(500);
    const tokens = await readCloudArray<OnboardingToken>('tokens');
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
      let users = await readCloudArray<any>('users');
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
      await writeCloudArray('users', users);

      // 2. Update Company Status
      let companies = await readCloudArray<Company>('companies');
      companies = companies.map((c: Company) => {
        if (c.id === data.companyId) {
          return { ...c, status: 'Active' };
        }
        return c;
      });
      await writeCloudArray('companies', companies);

      // 3. Burn Token
      let tokens = await readCloudArray<OnboardingToken>('tokens');
      tokens = tokens.filter((t: OnboardingToken) => t.token !== tokenStr);
      await writeCloudArray('tokens', tokens);

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
      await saveToCloud(SESSION_KEY, sessionUser);

      return { success: true };

    } catch (e) {
      console.error("completeOnboarding error", e);
      return { success: false, error: 'Onboarding failed.' };
    }
  },

  // --- System Management ---
  factoryReset: async () => {
    await delay(1500);

    // Preserve current session if it's the super admin
    const currentSession = await loadFromCloud(SESSION_KEY);
    let preserveSession = false;
    if (currentSession) {
      const s = currentSession as User;
      if (s.email === 'admin@nexus.com') preserveSession = true;
    }

    // Overwrite cloud storage keys with empty/default states
    // Reset companies and tokens to empty arrays
    await writeCloudArray('companies', []);
    await writeCloudArray('tokens', []);

    // Re-seed Super Admin User so login works immediately (keeps same behavior)
    const superAdmin: User = {
      id: '000',
      companyId: '0',
      fullName: 'System Owner',
      email: 'admin@nexus.com',
      role: Role.SUPER_ADMIN,
      department: 'System',
      status: 'Active'
    };
    await writeCloudArray('users', [superAdmin]);

    if (!preserveSession) {
      await saveToCloud(SESSION_KEY, null);
    }

    return true;
  },

  signup: async (fullName: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    await delay(1000);
    return { success: false, error: "Public signup disabled. Please contact sales." };
  }
};
