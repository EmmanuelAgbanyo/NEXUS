import React, { useState, useEffect } from 'react';
import { User, Role } from '../../types';
import { saveToCloud, loadFromCloud } from '../../src/utils/cloudStorage.js';
import { X, Plus } from 'lucide-react';

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState<Partial<User>>({});
  const [currentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      const loadedUsers = await loadFromCloud('users');
      setUsers(Array.isArray(loadedUsers) ? loadedUsers : []);
    };
    loadUsers();
  }, []);

  const handleSaveUser = async () => {
    if (!userFormData.fullName || !userFormData.email || !currentUser) return;

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: currentUser.companyId,
      fullName: userFormData.fullName,
      email: userFormData.email,
      role: (userFormData.role as Role) || Role.VIEWER,
      department: userFormData.department || 'General',
      status: 'Active',
      lastLogin: '-'
    };

    const updated = [...users, newUser];
    setUsers(updated);

    // Save to cloud storage
    await saveToCloud("users", updated);

    setShowUserModal(false);
    setUserFormData({});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button
          onClick={() => setShowUserModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-900">{user.fullName}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-3 text-sm text-gray-900">{user.role}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{user.department}</td>
                <td className="px-6 py-3 text-sm">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {user.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New User</h3>
              <button onClick={() => setShowUserModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={userFormData.fullName || ''}
                onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={userFormData.email || ''}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={userFormData.role || ''}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as Role })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Role</option>
                <option value={Role.ADMIN}>Admin</option>
                <option value={Role.ACCOUNTANT}>Accountant</option>
                <option value={Role.VIEWER}>Viewer</option>
              </select>
              <input
                type="text"
                placeholder="Department"
                value={userFormData.department || ''}
                onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <button
                onClick={handleSaveUser}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Save User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
