export const getRoleColor = (role) => {
  const colors = {
    superadmin: 'from-purple-500 to-purple-600',
    admin: 'from-blue-500 to-blue-600',
    hr: 'from-green-500 to-green-600',
    manager: 'from-yellow-500 to-yellow-600',
    employee: 'from-gray-500 to-gray-600'
  };
  return colors[role] || 'from-gray-500 to-gray-600';
};

// Mirrors backend constants/roles.js — keep the two in sync.
export const ROLE_RANK = {
  superadmin: 5,
  admin: 4,
  hr: 3,
  manager: 2,
  employee: 1
};

// Role name of a user object, wherever the API put it.
export const roleOf = (user) =>
  (user?.roleId?.name || user?.role || user?.userType || '').toLowerCase();

export const rankOf = (user) => ROLE_RANK[roleOf(user)] || 0;

export const permissionsOf = (user) =>
  user?.roleId?.permissions || user?.permissions || [];

export const hasPermission = (user, permission) => {
  const perms = permissionsOf(user);
  return perms.includes('*') || perms.includes(permission);
};

// Same rule as the backend's canModifyUser: you may act on your own record only
// where the caller explicitly allows it, and otherwise only on users you outrank.
// Superadmin is the exception — it can act on anyone, including other superadmins.
export const canModifyUser = (currentUser, targetUser, { allowSelf = false } = {}) => {
  if (!currentUser || !targetUser) return false;

  const isSelf = String(currentUser._id) === String(targetUser._id);
  if (isSelf) return allowSelf;

  if (roleOf(currentUser) === 'superadmin') return true;
  return rankOf(currentUser) > rankOf(targetUser);
};
