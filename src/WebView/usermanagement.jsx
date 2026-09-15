import React, { useEffect, useMemo, useState } from "react";
import {
  UserCog, UserPlus, Pencil, Trash2, Search, Filter, RefreshCcw,
  Mail, Phone, Building2, Briefcase, Shield, CheckCircle2, XCircle, Users, IdCard, KeyRound
} from "lucide-react";
import AddUserModal from "../components/UserRole/AddUser";
import ApiHit from "../Utils/ApiHit";
import { GetAllUsersAPI, DeleteUserAPI, GetAllRolesAPI, ResetUserPasswordAPI } from "../components/Constant/Api/Api";
import Pagination from "../components/Pagination";
import { canModifyUser, hasPermission } from "../Utils/roleUtils";

const PAGE_SIZE = 5;

const ROLE_STYLE = {
  superadmin: { pill: 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30', ring: 'from-purple-500 to-fuchsia-600' },
  admin:      { pill: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',       ring: 'from-blue-500 to-indigo-600' },
  hr:         { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', ring: 'from-emerald-500 to-teal-600' },
  manager:    { pill: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',    ring: 'from-amber-500 to-orange-600' },
  employee:   { pill: 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700',       ring: 'from-gray-500 to-gray-600' }
};

const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const AllUsersPage = ({ user: currentUser }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await ApiHit(GetAllUsersAPI, "GET");
      if (r?.success) setUsers(r.data?.docs || r.data || []);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const r = await ApiHit(GetAllRolesAPI, "GET");
      if (r?.success) setRoles(r.data?.docs || r.data || []);
    } catch (err) {
      console.error("Fetch roles error:", err);
    }
  };

  useEffect(() => { fetchUsers(); fetchRoles(); }, []);

  // Mirrors the backend guards on /api/users — a row only shows the actions this
  // caller can actually complete, so nobody gets a button that answers 403.
  // Editing your own record is fine; destructive actions on yourself are not.
  const canEdit = (target) =>
    hasPermission(currentUser, 'users.manage') &&
    canModifyUser(currentUser, target, { allowSelf: true });

  const canDelete = (target) =>
    hasPermission(currentUser, 'users.delete') && canModifyUser(currentUser, target);

  const canResetPassword = (target) =>
    hasPermission(currentUser, 'users.password') && canModifyUser(currentUser, target);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setBusyId(id);
    try {
      const r = await ApiHit(DeleteUserAPI(id), "DELETE");
      if (r?.success) fetchUsers();
      else alert(r?.message || 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (id, name) => {
    if (!window.confirm(`Reset password for "${name}"? A temporary password will be generated and they'll be forced to change it on next login.`)) return;
    setBusyId(id);
    try {
      const r = await ApiHit(ResetUserPasswordAPI(id), "POST");
      if (r?.success) {
        window.prompt(
          `Password reset. Share this temporary password with ${name} (they will be forced to change it on next login):`,
          r.data?.tempPassword || ''
        );
      } else {
        alert(r?.message || 'Failed to reset password');
      }
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchSearch = !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(search) ||
        (u.employeeId || '').toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || u.roleId?.name === roleFilter;
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' ? u.isActive : !u.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, roleFilter, statusFilter]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    roles: new Set(users.map((u) => u.roleId?.name).filter(Boolean)).size
  }), [users]);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <UserCog className="text-blue-600 dark:text-blue-400" /> User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Manage user accounts, roles & permissions across the organization.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          <button
            onClick={() => { setEditUser(null); setIsModalOpen(true); }}
            className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            <UserPlus size={14} /> Add User
          </button>
        </div>
      </div>

      {/* Stats — click to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Users',    value: stats.total,    color: 'from-blue-500 to-indigo-600',    icon: <Users size={18} />,        filter: 'all' },
          { label: 'Active',         value: stats.active,   color: 'from-emerald-500 to-teal-600',   icon: <CheckCircle2 size={18} />, filter: 'active' },
          { label: 'Inactive',       value: stats.inactive, color: 'from-red-500 to-rose-600',       icon: <XCircle size={18} />,      filter: 'inactive' },
          { label: 'Roles Assigned', value: stats.roles,    color: 'from-purple-500 to-fuchsia-600', icon: <Shield size={18} />,       filter: null }
        ].map((s, i) => {
          const clickable = s.filter !== null;
          const active = clickable && statusFilter === s.filter;
          return (
            <button
              key={i}
              onClick={() => clickable && setStatusFilter(s.filter)}
              disabled={!clickable}
              className={`text-left bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow transition ${clickable ? 'transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-slate-900/50 cursor-pointer' : 'cursor-default'} ${active ? 'ring-2 ring-white dark:ring-slate-800 ring-offset-2 ring-offset-gray-50' : ''}`}
            >
              <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-lg inline-block mb-2">{s.icon}</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">{s.value}</div>
              <div className="text-xs opacity-90">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone or employee ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400 dark:text-slate-500" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => <option key={r._id} value={r.name} className="capitalize">{r.name}</option>)}
          </select>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <UserCog size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {users.length === 0 ? 'No users yet' : 'No users match your filters'}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40">
            <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <UserCog size={16} className="text-blue-600 dark:text-blue-400" /> All Users
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white dark:bg-slate-800 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Job Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((u, idx) => {
                  const i = (currentPage - 1) * PAGE_SIZE + idx;
                  const roleKey = (u.roleId?.name || '').toLowerCase();
                  const rs = ROLE_STYLE[roleKey] || { pill: 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700', ring: 'from-gray-500 to-gray-600' };
                  const busy = busyId === u._id;
                  return (
                    <tr key={u._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        {u.employeeId ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 whitespace-nowrap">
                            <IdCard size={11} /> {u.employeeId}
                          </span>
                        ) : <span className="text-[11px] text-gray-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${rs.ring} text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0`}>
                            {initials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-800 dark:text-slate-100 truncate">{u.name}</div>
                            <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate flex items-center gap-1">
                              <Mail size={10} /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-gray-700 dark:text-slate-200 text-xs whitespace-nowrap">
                          <Phone size={11} className="text-gray-400 dark:text-slate-500" /> {u.phone || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${rs.pill} whitespace-nowrap capitalize`}>
                          <Shield size={11} /> {u.roleId?.name || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.departmentId?.name ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 whitespace-nowrap">
                            <Building2 size={11} /> {u.departmentId.name}
                          </span>
                        ) : <span className="text-gray-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        {u.jobRoleId?.name ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30 whitespace-nowrap">
                            <Briefcase size={11} /> {u.jobRoleId.name}
                          </span>
                        ) : <span className="text-gray-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${
                          u.isActive
                            ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30'
                        } whitespace-nowrap`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit(u) && (
                            <button
                              onClick={() => { setEditUser(u); setIsModalOpen(true); }}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {canResetPassword(u) && (
                            <button
                              disabled={busy}
                              onClick={() => handleResetPassword(u._id, u.name)}
                              className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition disabled:opacity-50"
                              title="Reset password (force change on next login)"
                            >
                              <KeyRound size={16} />
                            </button>
                          )}
                          {canDelete(u) && (
                            <button
                              disabled={busy}
                              onClick={() => handleDelete(u._id, u.name)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          {!canEdit(u) && !canResetPassword(u) && !canDelete(u) && (
                            <span className="text-[11px] text-gray-400 dark:text-slate-500">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Add/Edit User Modal */}
      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserAdded={() => { fetchUsers(); setIsModalOpen(false); }}
        editData={editUser}
      />
    </main>
  );
};

export default AllUsersPage;
