import React, { useEffect, useMemo, useState } from "react";
import { Shield, ShieldPlus, Trash2, Pencil, Search, RefreshCcw, CheckCircle2, XCircle, Key } from "lucide-react";
import AddRole from "../components/Roles/AddRole";
import ApiHit from "../Utils/ApiHit";
import { DeleteRoleAPI, GetAllRolesAPI } from "../components/Constant/Api/Api";
import { hasPermission } from "../Utils/roleUtils";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

const ROLE_STYLE = {
  superadmin: { pill: 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30', ring: 'from-purple-500 to-fuchsia-600' },
  admin:      { pill: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',       ring: 'from-blue-500 to-indigo-600' },
  hr:         { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', ring: 'from-emerald-500 to-teal-600' },
  manager:    { pill: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',    ring: 'from-amber-500 to-orange-600' },
  employee:   { pill: 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700',       ring: 'from-gray-500 to-gray-600' }
};

const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

// Group raw permission strings by module: 'employees.view' + 'employees.manage'
// becomes { module: 'employees', actions: ['view', 'manage'] }.
// 'system.logs.view' keeps its full action, so nothing is lost in the grouping.
const groupPermissions = (permissions = []) => {
  if (!permissions) return [];
  const permsArray = Array.isArray(permissions)
    ? permissions
    : permissions.match(/[a-z]+(?:\.[a-z]+)+|\*/g) || [];

  const byModule = new Map();
  permsArray.forEach((p) => {
    if (p === '*') {
      byModule.set('*', []);
      return;
    }
    const [module, ...rest] = p.split('.');
    if (!byModule.has(module)) byModule.set(module, []);
    const action = rest.join('.');
    if (action && !byModule.get(module).includes(action)) {
      byModule.get(module).push(action);
    }
  });

  return [...byModule.entries()].map(([module, actions]) => ({ module, actions }));
};

const getPermissionModules = (permissions = []) =>
  groupPermissions(permissions).map((g) => g.module);

const VISIBLE_CHIPS = 4;

const PermissionChips = ({ permissions }) => {
  const [expanded, setExpanded] = useState(false);
  const groups = groupPermissions(permissions);

  if (!groups.length) return <span className="text-gray-400 dark:text-slate-500 text-xs">—</span>;

  if (groups.length === 1 && groups[0].module === '*') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
        <Key size={10} /> All permissions
      </span>
    );
  }

  const visible = expanded ? groups : groups.slice(0, VISIBLE_CHIPS);
  const hidden = groups.length - VISIBLE_CHIPS;

  return (
    <div className="flex items-center gap-1.5 flex-wrap max-w-md">
      {visible.map((g) => (
        <span
          key={g.module}
          title={g.actions.map((a) => `${g.module}.${a}`).join('\n')}
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 capitalize"
        >
          <Key size={10} /> {g.module}
          {expanded && g.actions.length > 0 && (
            <span className="font-normal text-blue-500 lowercase">{g.actions.join(' · ')}</span>
          )}
        </span>
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold underline underline-offset-2 cursor-pointer"
        >
          {expanded ? 'Show less' : `+${hidden} more`}
        </button>
      )}
    </div>
  );
};

const RoleManagement = ({ user }) => {
  // Creating/editing/deleting roles is superadmin-only on the backend —
  // admin gets the same screen read-only.
  const canManageRoles = hasPermission(user, 'roles.manage');

  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const r = await ApiHit(GetAllRolesAPI, "GET");
      if (r?.success) setRoles(r.data?.docs || r.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" role?`)) return;
    setBusyId(id);
    try {
      const r = await ApiHit(DeleteRoleAPI(id), "DELETE");
      if (r?.success) fetchRoles();
      else alert(r?.message || 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return roles.filter((r) => {
      const matchSearch = !q ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.roleType || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' ? r.isActive : !r.isActive);
      return matchSearch && matchStatus;
    });
  }, [roles, search, statusFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const stats = useMemo(() => ({
    total: roles.length,
    active: roles.filter((r) => r.isActive).length,
    inactive: roles.filter((r) => !r.isActive).length,
    perms: roles.reduce((sum, r) => sum + getPermissionModules(r.permissions).length, 0)
  }), [roles]);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Shield className="text-blue-600 dark:text-blue-400" /> Role Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {canManageRoles
              ? 'Manage system roles, their permissions and status.'
              : 'View-only. Only a superadmin can create or change roles.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRoles}
            className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          {canManageRoles && (
            <button
              onClick={() => { setEditData(null); setShowAddModal(true); }}
              className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow transition"
            >
              <ShieldPlus size={14} /> Add Role
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Roles',       value: stats.total,    color: 'from-blue-500 to-indigo-600',    icon: <Shield size={18} />,       filter: 'all' },
          { label: 'Active',            value: stats.active,   color: 'from-emerald-500 to-teal-600',   icon: <CheckCircle2 size={18} />, filter: 'active' },
          { label: 'Inactive',          value: stats.inactive, color: 'from-red-500 to-rose-600',       icon: <XCircle size={18} />,      filter: 'inactive' },
          { label: 'Total Permissions', value: stats.perms,    color: 'from-purple-500 to-fuchsia-600', icon: <Key size={18} />,          filter: null }
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
            placeholder="Search roles by name or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          <Shield size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {roles.length === 0 ? 'No roles yet' : 'No roles match your filters'}
          </div>
          {roles.length === 0 && canManageRoles && (
            <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Click "Add Role" to create the first role.</div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40">
            <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <Shield size={16} className="text-blue-600 dark:text-blue-400" /> All Roles
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white dark:bg-slate-800 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Permissions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((role, idx) => {
                  const i = (currentPage - 1) * PAGE_SIZE + idx;
                  const key = (role.name || '').toLowerCase();
                  const rs = ROLE_STYLE[key] || { pill: 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700', ring: 'from-gray-500 to-gray-600' };
                  const busy = busyId === role._id;
                  return (
                    <tr key={role._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${rs.ring} text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0`}>
                            {initials(role.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-800 dark:text-slate-100 capitalize truncate">{role.name}</div>
                            {role.description && (
                              <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{role.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${rs.pill} whitespace-nowrap capitalize`}>
                          {role.roleType || role.name || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <PermissionChips permissions={role.permissions} />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${
                          role.isActive
                            ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30'
                        } whitespace-nowrap`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${role.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {role.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManageRoles ? (
                            <>
                              <button
                                onClick={() => { setEditData(role); setShowAddModal(true); }}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => handleDelete(role._id, role.name)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-gray-400 dark:text-slate-500">View only</span>
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

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <AddRole
            onClose={() => { setShowAddModal(false); setEditData(null); }}
            onSubmit={() => { setShowAddModal(false); setEditData(null); fetchRoles(); }}
            editData={editData}
          />
        </div>
      )}
    </main>
  );
};

export default RoleManagement;
