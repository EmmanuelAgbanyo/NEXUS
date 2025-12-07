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
