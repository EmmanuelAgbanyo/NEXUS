
import React, { useState, useEffect } from 'react';
import { Card, SectionHeader, Button, Badge } from '../../components/ui/UtilityComponents';
import { ModernInput } from '../../components/ui/ModernInput';
import { ProfessionalDropdown } from '../../components/ui/ProfessionalDropdown';
import { User, Role } from '../../types';
import { authService } from '../../services/authService';
import { Plus, Shield, Lock, Activity, X, Copy, CheckSquare, Square, Grid, Check, MoreHorizontal, Users, Settings, Sparkles, Loader2, Mail, User as UserIcon, Building } from 'lucide-react';
import { suggestRolePermissions } from '../../services/geminiService';

const PERMISSION_TYPES = ['View', 'Create', 'Edit', 'Delete', 'Post', 'Approve', 'Export', 'Audit'];
const SYSTEM_MODULES = ['General Ledger', 'Journal Entries', 'Accounts Payable', 'Accounts Receivable', 'Fixed Assets', 'Inventory', 'Payroll', 'Reporting', 'System Config'];

interface RoleDefinition {
    id: string;
    name: string;
    description: string;
    permissions: Record<string, string[]>; 
}

const INITIAL_ROLES: RoleDefinition[] = [
    {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access with configuration rights.',
        permissions: SYSTEM_MODULES.reduce((acc, m) => ({...acc, [m]: PERMISSION_TYPES}), {})
    },
    {
        id: 'finance_mgr',
        name: 'Finance Manager',
        description: 'Operational oversight, approval rights, and reporting.',
        permissions: SYSTEM_MODULES.reduce((acc, m) => {
            if(m === 'System Config') return {...acc, [m]: ['View']};
            return {...acc, [m]: ['View', 'Create', 'Edit', 'Post', 'Approve', 'Export', 'Audit']};
        }, {})
    },
    {
        id: 'accountant',
        name: 'Accountant',
        description: 'Daily transaction entry and basic reporting.',
        permissions: SYSTEM_MODULES.reduce((acc, m) => {
            if(m === 'System Config' || m === 'Payroll') return {...acc, [m]: []};
            if(m === 'Reporting') return {...acc, [m]: ['View', 'Export']};
            return {...acc, [m]: ['View', 'Create', 'Edit']};
        }, {})
    },
     {
        id: 'auditor',
        name: 'Auditor',
        description: 'Read-only access to all modules and audit logs.',
        permissions: SYSTEM_MODULES.reduce((acc, m) => ({...acc, [m]: ['View', 'Export', 'Audit']}), {})
    }
];

// Seed data only applies to the 'Demo' company ID '1' or Super Admin '0' context
const DEMO_USERS: User[] = [
  { id: '0', companyId: '0', fullName: 'System Owner', email: 'admin@nexus.com', role: Role.SUPER_ADMIN, department: 'System', status: 'Active', lastLogin: 'Just now' },
  { id: '1', companyId: '1', fullName: 'Alexandra Chen', email: 'a.chen@nexus.corp', role: Role.ADMIN, department: 'IT / SysAdmin', status: 'Active', lastLogin: '2025-04-12 09:15:00' },
  { id: '2', companyId: '1', fullName: 'Marcus Thorne', email: 'm.thorne@nexus.corp', role: Role.FINANCE_MANAGER, department: 'Finance', status: 'Active', lastLogin: '2025-04-12 08:30:22' },
  { id: '3', companyId: '1', fullName: 'Sarah Oconnell', email: 's.oconnell@nexus.corp', role: Role.ACCOUNTANT, department: 'Accounts Payable', status: 'Inactive', lastLogin: '2024-12-20 17:00:00' },
];

export const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  
  // User State
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState<Partial<User>>({});

  // Role State
  const [roles, setRoles] = useState<RoleDefinition[]>(INITIAL_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(INITIAL_ROLES[0].id);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  // AI State
  const [isAiConfiguring, setIsAiConfiguring] = useState(false);

  const selectedRole = roles.find(r => r.id === selectedRoleId) || roles[0];

  useEffect(() => {
      loadUsers();
  }, []);

  const loadUsers = () => {
      const session = authService.getSession();
      setCurrentUser(session);
      const allUsers = authService.getAllUsers(); // Fetches from localStorage

      if (session) {
          if (session.role === Role.SUPER_ADMIN) {
              // Super Admin sees all users, or can be filtered
              setUsers(allUsers.length > 0 ? allUsers : DEMO_USERS);
          } else {
              // Tenant Admin sees ONLY their company users
              // If empty (Fresh Tenant), they see themselves + any they create.
              // If DEMO company ('1'), ensure they see demo users if LS is empty
              if (session.companyId === '1' && allUsers.length <= 1) {
                  setUsers(DEMO_USERS); 
              } else {
                  setUsers(allUsers.filter(u => u.companyId === session.companyId));
              }
          }
      }
  };

  // --- User Handlers ---
  const handleSaveUser = () => {
    if(!userFormData.fullName || !userFormData.email || !currentUser) return;
    
    const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        companyId: currentUser.companyId, // Force assignment to current tenant
        fullName: userFormData.fullName,
        email: userFormData.email,
        role: (userFormData.role as Role) || Role.VIEWER,
        department: userFormData.department || 'General',
        status: 'Active',
        lastLogin: '-'
    };
    
    // Update Local State
    setUsers([...users, newUser]);
    
    // Persist to Global Storage via Auth Service (Simulation)
    authService.saveUser(newUser);

    setShowUserModal(false);
    setUserFormData({});
  };

  // ... (Role Handlers remain same) ...
  const togglePermission = (moduleName: string, permType: string) => {
      const currentPerms = selectedRole.permissions[moduleName] || [];
      const hasPerm = currentPerms.includes(permType);
      const newPerms = hasPerm ? currentPerms.filter(p => p !== permType) : [...currentPerms, permType];
      const updatedRole = { ...selectedRole, permissions: { ...selectedRole.permissions, [moduleName]: newPerms } };
      setRoles(roles.map(r => r.id === selectedRoleId ? updatedRole : r));
  };

  const toggleModuleRow = (moduleName: string) => {
      const currentPerms = selectedRole.permissions[moduleName] || [];
      const allSelected = PERMISSION_TYPES.every(p => currentPerms.includes(p));
      const updatedRole = { ...selectedRole, permissions: { ...selectedRole.permissions, [moduleName]: allSelected ? [] : [...PERMISSION_TYPES] } };
      setRoles(roles.map(r => r.id === selectedRoleId ? updatedRole : r));
  };

  const togglePermissionColumn = (permType: string) => {
      const allModulesHavePerm = SYSTEM_MODULES.every(m => (selectedRole.permissions[m] || []).includes(permType));
      const newPermissions = { ...selectedRole.permissions };
      SYSTEM_MODULES.forEach(m => {
          const current = newPermissions[m] || [];
          if (allModulesHavePerm) {
              newPermissions[m] = current.filter(p => p !== permType);
          } else {
              if (!current.includes(permType)) newPermissions[m] = [...current, permType];
          }
      });
      setRoles(roles.map(r => r.id === selectedRoleId ? { ...selectedRole, permissions: newPermissions } : r));
  };

  const handleCloneRole = () => {
      if (!newRoleName) return;
      const newRole: RoleDefinition = { ...selectedRole, id: `role_${Math.random().toString(36).substr(2, 5)}`, name: newRoleName, description: `Cloned from ${selectedRole.name}` };
      setRoles([...roles, newRole]);
      setSelectedRoleId(newRole.id);
      setShowCloneModal(false);
      setNewRoleName('');
  };

  const handleAiAutoConfigure = async () => {
      if (!selectedRole) return;
      setIsAiConfiguring(true);
      try {
          const result = await suggestRolePermissions(selectedRole.name, selectedRole.description, SYSTEM_MODULES, PERMISSION_TYPES);
          if (result && result.permissions) {
              const updatedPermissions: Record<string, string[]> = {};
              SYSTEM_MODULES.forEach(mod => {
                  const aiPerms = result.permissions[mod] || [];
                  updatedPermissions[mod] = aiPerms.filter((p: string) => PERMISSION_TYPES.includes(p));
              });
              const updatedRole = { ...selectedRole, permissions: updatedPermissions, description: selectedRole.description + (result.reasoning ? ` (AI Configured: ${result.reasoning.substring(0, 50)}...)` : '') };
              setRoles(roles.map(r => r.id === selectedRoleId ? updatedRole : r));
          }
      } catch (error) { console.error("AI Configuration Failed", error); } finally { setIsAiConfiguring(false); }
  };

  const roleOptions = Object.values(Role).map(r => ({ id: r, label: r }));

  return (
    <div className="space-y-6">
      <SectionHeader title="Access Control Center" description="Manage users, define roles, and configure granular permission matrices." />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => setActiveTab('users')} className={`pb-3 px-2 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <Users size={16} /> User Directory
        </button>
        <button onClick={() => setActiveTab('roles')} className={`pb-3 px-2 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'roles' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <Grid size={16} /> Role & Permission Matrix
        </button>
      </div>

      {/* --- USER DIRECTORY VIEW --- */}
      {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-left-2">
            <div className="lg:col-span-3">
                <Card className="overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h4 className="font-semibold text-slate-700">Registered Users</h4>
                        <Button size="sm" onClick={() => setShowUserModal(true)}><Plus size={14} /> Add User</Button>
                    </div>
                    {users.length > 0 ? (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">User Profile</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Role</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(user => (
                                    <tr key={user.id} className="group hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {user.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{user.fullName}</div>
                                                    <div className="text-xs text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className="text-indigo-500"/>
                                                <span className="text-slate-700">{user.role}</span>
                                            </div>
                                            <div className="text-xs text-slate-400 pl-6">{user.department}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge type={user.status === 'Active' ? 'success' : 'neutral'}>{user.status}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                                                <Settings size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Users size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-slate-600">No Users Found</h3>
                            <p className="text-slate-400 text-sm">Add your first team member to get started.</p>
                        </div>
                    )}
                </Card>
            </div>
            
            <div className="space-y-4">
                <Card className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="text-indigo-500" size={20} />
                        <h4 className="font-semibold text-slate-800">Security Audit</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Active Sessions</span>
                            <span className="font-mono font-medium">{users.filter(u => u.status === 'Active').length}</span>
                        </div>
                    </div>
                </Card>
            </div>
          </div>
      )}

      {/* --- ROLE MATRIX VIEW --- */}
      {activeTab === 'roles' && (
          <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-right-2">
              <div className="w-full lg:w-64 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-slate-700">Defined Roles</h4>
                      <button onClick={() => setShowCloneModal(true)} className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"><Copy size={12} /> Clone</button>
                  </div>
                  <div className="space-y-2">
                      {roles.map(role => (
                          <div key={role.id} onClick={() => setSelectedRoleId(role.id)} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedRoleId === role.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                              <div className="font-medium text-slate-800 flex justify-between">{role.name}{selectedRoleId === role.id && <Check size={16} className="text-indigo-600" />}</div>
                              <div className="text-xs text-slate-500 mt-1 line-clamp-2">{role.description}</div>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="flex-1">
                  <Card className="overflow-hidden">
                      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div><h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">{selectedRole.name} Permissions</h4><p className="text-xs text-slate-500 max-w-md">{selectedRole.description}</p></div>
                          <div className="flex gap-2 items-center">
                              <Button size="sm" variant="secondary" className="text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100" onClick={handleAiAutoConfigure} disabled={isAiConfiguring}>
                                {isAiConfiguring ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {isAiConfiguring ? 'Thinking...' : 'AI Auto-Configure'}
                              </Button>
                              <Button size="sm">Save Configuration</Button>
                          </div>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                              <thead className="bg-white border-b border-slate-200">
                                  <tr>
                                      <th className="px-4 py-3 text-left font-semibold text-slate-600 w-48">Module / Feature</th>
                                      {PERMISSION_TYPES.map(perm => (<th key={perm} className="px-2 py-3 text-center font-medium text-slate-500 cursor-pointer hover:bg-slate-50 hover:text-indigo-600 transition-colors group" onClick={() => togglePermissionColumn(perm)} title={`Toggle ${perm} for all modules`}><div className="flex flex-col items-center gap-1"><span>{perm}</span><MoreHorizontal size={12} className="opacity-0 group-hover:opacity-100 text-indigo-400" /></div></th>))}
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {SYSTEM_MODULES.map(module => {
                                      const modulePerms = selectedRole.permissions[module] || [];
                                      const isAllSelected = PERMISSION_TYPES.every(p => modulePerms.includes(p));
                                      return (
                                          <tr key={module} className="hover:bg-slate-50">
                                              <td className="px-4 py-3 font-medium text-slate-700 cursor-pointer hover:text-indigo-600" onClick={() => toggleModuleRow(module)}><div className="flex items-center gap-2">{isAllSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} className="text-slate-300" />}{module}</div></td>
                                              {PERMISSION_TYPES.map(perm => (<td key={`${module}-${perm}`} className="px-2 py-3 text-center"><div onClick={() => togglePermission(module, perm)} className={`w-5 h-5 mx-auto rounded border cursor-pointer flex items-center justify-center transition-all ${modulePerms.includes(perm) ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-300 text-transparent hover:border-indigo-400'}`}><Check size={12} strokeWidth={3} /></div></td>))}
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      </div>
                  </Card>
              </div>
          </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-slate-800">Register User</h3>
                    <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <ModernInput label="Full Name" placeholder="e.g. John Doe" icon={<UserIcon size={18} />} value={userFormData.fullName || ''} onChange={e => setUserFormData({...userFormData, fullName: e.target.value})} />
                    <ModernInput label="Email Address" type="email" placeholder="john@company.com" icon={<Mail size={18} />} value={userFormData.email || ''} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <ProfessionalDropdown label="Role" options={roleOptions} value={userFormData.role || ''} onChange={(val) => setUserFormData({...userFormData, role: val as Role})} placeholder="Select Role" />
                        <ModernInput label="Department" placeholder="Finance" icon={<Building size={18} />} value={userFormData.department || ''} onChange={e => setUserFormData({...userFormData, department: e.target.value})} />
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 flex justify-end gap-2 border-t border-slate-100">
                    <Button variant="ghost" onClick={() => setShowUserModal(false)}>Cancel</Button>
                    <Button onClick={handleSaveUser}>Create Profile</Button>
                </div>
            </div>
        </div>
      )}

      {/* Clone Role Modal */}
      {showCloneModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                  <div className="px-6 py-4 border-b border-slate-100 bg-indigo-50">
                      <h3 className="font-semibold text-indigo-900 flex items-center gap-2"><Copy size={18} /> Clone Role</h3>
                  </div>
                  <div className="p-6">
                      <p className="text-sm text-slate-600 mb-4">Creating a new role based on <strong>{selectedRole.name}</strong>.</p>
                      <ModernInput label="New Role Name" placeholder="e.g. Senior Accountant" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} autoFocus />
                  </div>
                  <div className="px-6 py-4 bg-slate-50 flex justify-end gap-2 border-t border-slate-100">
                      <Button variant="ghost" onClick={() => setShowCloneModal(false)}>Cancel</Button>
                      <Button onClick={handleCloneRole} disabled={!newRoleName}>Create Role</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
