import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserCheck, Shield, Building2, Mail, IdCard,
  ChevronDown, ChevronRight, Search, RefreshCcw, X, AlertCircle, CheckCircle2, ArrowRight
} from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import {
  HierarchyOverviewAPI,
  AssignManagerToAdminAPI,
  AssignEmployeeToManagerAPI
} from "../components/Constant/Api/Api";

const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const Chip = ({ children, color = 'gray' }) => {
  const map = {
    gray:  'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700',
    blue:  'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
    amber: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    green: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
  };
  return <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[color]}`}>{children}</span>;
};

const TeamHierarchy = ({ user }) => {
  const role = (user?.roleId?.name || user?.role || '').toLowerCase();
  const canEdit = role === 'hr' || role === 'superadmin';

  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [openAdmins, setOpenAdmins] = useState({});
  const [openManagers, setOpenManagers] = useState({});
  const [search, setSearch] = useState('');

  const [reassign, setReassign] = useState(null); // { kind: 'manager'|'employee', target: {...}|null }
  const [target, setTarget] = useState('');
  const [source, setSource] = useState(''); // when target is null we let user pick source too

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const r = await ApiHit(HierarchyOverviewAPI, "GET");
      if (r?.success) setData(r.data);
      else setMsg({ type: 'error', text: r?.message || 'Failed to load' });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOverview(); }, []);

  const openReassignManager = (mgr) => {
    setReassign({ kind: 'manager', target: mgr });
    setSource(String(mgr._id));
    setTarget(mgr.reportsTo ? String(mgr.reportsTo) : '');
  };
  const openReassignEmployee = (emp) => {
    setReassign({ kind: 'employee', target: emp });
    setSource(String(emp._id));
    setTarget(emp.managerId ? String(emp.managerId) : '');
  };
  // "New assignment" flow — pick BOTH source and target
  const openNewAssignment = (kind) => {
    setReassign({ kind, target: null });
    setSource('');
    setTarget('');
  };

  const submitReassign = async () => {
    if (!reassign) return;
    const sourceId = reassign.target?._id || source;
    if (!sourceId) { setMsg({ type: 'error', text: 'Please select who to assign.' }); return; }
    setBusy(true);
    try {
      let r;
      if (reassign.kind === 'manager' || reassign.kind === 'hr') {
        // Same endpoint — backend accepts managerId/hrId/userId interchangeably
        r = await ApiHit(AssignManagerToAdminAPI, "PATCH", {
          userId: sourceId,
          adminId: target || null
        });
      } else {
        r = await ApiHit(AssignEmployeeToManagerAPI, "PATCH", {
          employeeId: sourceId,
          managerId: target || null
        });
      }
      if (r?.success) {
        setMsg({ type: 'success', text: 'Assignment updated' });
        setReassign(null); setTarget(''); setSource('');
        await fetchOverview();
      } else {
        setMsg({ type: 'error', text: r?.message || 'Failed' });
      }
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const filtered = useMemo(() => {
    if (!data) return null;
    if (!search) return data;
    const q = search.toLowerCase();
    const match = (u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    const filterManagers = (managers) => managers
      .map((m) => ({ ...m, team: (m.team || []).filter(match) }))
      .filter((m) => match(m) || (m.team && m.team.length > 0));
    return {
      ...data,
      admins: data.admins
        .map((a) => ({
          ...a,
          managers: filterManagers(a.managers || []),
          hrs: (a.hrs || []).filter(match)
        }))
        .filter((a) => match(a) || (a.managers && a.managers.length > 0) || (a.hrs && a.hrs.length > 0)),
      unassignedManagers: filterManagers(data.unassignedManagers || []),
      unassignedHrs: (data.unassignedHrs || []).filter(match),
      unassignedEmployees: (data.unassignedEmployees || []).filter(match)
    };
  }, [data, search]);

  const stats = useMemo(() => {
    if (!data) return { admins: 0, managers: 0, employees: 0, unassignedMgr: 0, unassignedEmp: 0 };
    return {
      admins: data.allAdmins?.length || 0,
      managers: data.allManagers?.length || 0,
      employees: data.allEmployees?.length || 0,
      unassignedMgr: data.unassignedManagers?.length || 0,
      unassignedEmp: data.unassignedEmployees?.length || 0
    };
  }, [data]);

  const toggleAdmin = (id) => setOpenAdmins((p) => ({ ...p, [id]: !p[id] }));
  const toggleManager = (id) => setOpenManagers((p) => ({ ...p, [id]: !p[id] }));

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="text-blue-600 dark:text-blue-400" /> Team Hierarchy
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {canEdit
              ? "Assign managers to admins and employees to managers. Restructure the org anytime."
              : "View-only hierarchy overview."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <>
              <button
                onClick={() => openNewAssignment('manager')}
                className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg shadow transition"
              >
                <ArrowRight size={14} /> Manager → Admin
              </button>
              <button
                onClick={() => openNewAssignment('hr')}
                className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white px-4 py-2 rounded-lg shadow transition"
              >
                <ArrowRight size={14} /> HR → Admin
              </button>
              <button
                onClick={() => openNewAssignment('employee')}
                className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg shadow transition"
              >
                <ArrowRight size={14} /> Employee → Manager
              </button>
            </>
          )}
          <button
            onClick={fetchOverview}
            className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats — click to navigate */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Admins',         value: stats.admins,        color: 'from-blue-500 to-indigo-600',    icon: <Shield size={18} />,      path: '/user-management' },
          { label: 'Managers',       value: stats.managers,      color: 'from-amber-500 to-orange-600',   icon: <UserCheck size={18} />,   path: '/user-management' },
          { label: 'Employees',      value: stats.employees,     color: 'from-emerald-500 to-teal-600',   icon: <Users size={18} />,       path: '/employees' },
          { label: 'Unassigned Mgr', value: stats.unassignedMgr, color: 'from-purple-500 to-fuchsia-600', icon: <AlertCircle size={18} />, path: null },
          { label: 'Unassigned Emp', value: stats.unassignedEmp, color: 'from-red-500 to-rose-600',       icon: <AlertCircle size={18} />, path: null }
        ].map((s, i) => {
          const clickable = s.path !== null;
          return (
            <button
              key={i}
              onClick={() => clickable && navigate(s.path)}
              disabled={!clickable}
              className={`text-left bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow transition ${clickable ? 'transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-slate-900/50 cursor-pointer' : 'cursor-default'}`}
            >
              <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-lg inline-block mb-2">{s.icon}</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">{s.value}</div>
              <div className="text-xs opacity-90">{s.label}</div>
            </button>
          );
        })}
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
          msg.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300'
          : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
        }`}>
          {msg.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          {msg.text}
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading hierarchy…</div>
      ) : !filtered ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <Users size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">No data</div>
        </div>
      ) : (
        <>
          {/* Admins → Managers → Employees */}
          <div className="space-y-4">
            {filtered.admins.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow border border-gray-100 dark:border-slate-800 text-center text-sm text-gray-500 dark:text-slate-400">
                No admins found.
              </div>
            ) : filtered.admins.map((admin) => (
              <div key={admin._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between cursor-pointer" onClick={() => toggleAdmin(admin._id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <button className="text-white/90 hover:text-white">
                      {openAdmins[admin._id] === false ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-slate-900/20 flex items-center justify-center text-sm font-bold ring-2 ring-white/40 dark:ring-slate-900/40">
                      {initials(admin.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold truncate">{admin.name}</div>
                      <div className="text-xs opacity-90 truncate flex items-center gap-1">
                        <Shield size={11} /> Admin{admin.email ? ` · ${admin.email}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs bg-white/20 dark:bg-slate-900/20 px-2 py-1 rounded-full font-semibold flex items-center gap-2">
                    <span>{admin.managers?.length || 0} mgr</span>
                    <span className="opacity-50">·</span>
                    <span>{admin.hrs?.length || 0} hr</span>
                  </div>
                </div>

                {openAdmins[admin._id] !== false && (
                  <div className="p-4 space-y-3">
                    {(admin.managers || []).length === 0 ? (
                      <div className="text-sm text-gray-400 dark:text-slate-500 italic py-2 text-center">No managers assigned to this admin.</div>
                    ) : (admin.managers || []).map((mgr) => (
                      <div key={mgr._id} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <div className="p-3 bg-amber-50/50 dark:bg-amber-500/10 flex items-center justify-between cursor-pointer" onClick={() => toggleManager(mgr._id)}>
                          <div className="flex items-center gap-3 min-w-0">
                            <button className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200">
                              {openManagers[mgr._id] === false ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-[11px] font-bold">
                              {initials(mgr.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-800 dark:text-slate-100 truncate">{mgr.name}</div>
                              <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1"><UserCheck size={10} /> Manager</span>
                                {mgr.employeeId && <span className="flex items-center gap-1"><IdCard size={10} /> {mgr.employeeId}</span>}
                                {mgr.department && <span className="flex items-center gap-1"><Building2 size={10} /> {mgr.department}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Chip color="amber">{(mgr.team || []).length} emp</Chip>
                            {canEdit && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openReassignManager(mgr); }}
                                className="text-[11px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-200 px-2 py-1 rounded-md flex items-center gap-1"
                              >
                                <ArrowRight size={11} /> Reassign
                              </button>
                            )}
                          </div>
                        </div>

                        {openManagers[mgr._id] !== false && (
                          <div className="p-3 bg-white dark:bg-slate-800">
                            {(mgr.team || []).length === 0 ? (
                              <div className="text-xs text-gray-400 dark:text-slate-500 italic text-center py-2">No employees under this manager.</div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                                {(mgr.team || []).map((emp) => (
                                  <div key={emp._id} className="border border-gray-100 dark:border-slate-800 rounded-lg p-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                      {initials(emp.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{emp.name}</div>
                                      <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate flex items-center gap-1">
                                        {emp.employeeId && <><IdCard size={9} /> {emp.employeeId} · </>}
                                        <Mail size={9} /> {emp.email}
                                      </div>
                                    </div>
                                    {canEdit && (
                                      <button
                                        onClick={() => openReassignEmployee({ ...emp, managerId: mgr._id })}
                                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded"
                                        title="Reassign"
                                      >
                                        <ArrowRight size={13} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* HRs under this admin */}
                    {(admin.hrs || []).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-slate-700">
                        <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold mb-2 flex items-center gap-1">
                          <Shield size={11} /> HR Team
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                          {(admin.hrs || []).map((h) => (
                            <div key={h._id} className="border border-purple-100 dark:border-purple-500/20 bg-purple-50/40 dark:bg-purple-500/10 rounded-lg p-2 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                {initials(h.name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{h.name}</div>
                                <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate">HR · {h.email}</div>
                              </div>
                              {canEdit && (
                                <button
                                  onClick={() => { setReassign({ kind: 'hr', target: h }); setSource(String(h._id)); setTarget(h.reportsTo ? String(h.reportsTo) : ''); }}
                                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded"
                                  title="Reassign"
                                >
                                  <ArrowRight size={13} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Unassigned HRs */}
          {(filtered.unassignedHrs?.length || 0) > 0 && (
            <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                  <AlertCircle size={16} className="text-purple-600 dark:text-purple-400" /> Unassigned HRs ({filtered.unassignedHrs.length})
                </h2>
                <div className="text-xs text-gray-500 dark:text-slate-400">Not reporting to any admin</div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.unassignedHrs.map((h) => (
                  <div key={h._id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-2 hover:shadow-md transition">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center text-xs font-bold">
                      {initials(h.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-800 dark:text-slate-100 truncate">{h.name}</div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{h.email}</div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => { setReassign({ kind: 'hr', target: h }); setSource(String(h._id)); setTarget(''); }}
                        className="text-[11px] bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/15 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md flex items-center gap-1"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unassigned managers */}
          {filtered.unassignedManagers.length > 0 && (
            <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                  <AlertCircle size={16} className="text-purple-600 dark:text-purple-400" /> Unassigned Managers ({filtered.unassignedManagers.length})
                </h2>
                <div className="text-xs text-gray-500 dark:text-slate-400">Not reporting to any admin</div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.unassignedManagers.map((m) => (
                  <div key={m._id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-2 hover:shadow-md transition">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-xs font-bold">
                      {initials(m.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-800 dark:text-slate-100 truncate">{m.name}</div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{m.email}</div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => openReassignManager(m)}
                        className="text-[11px] bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/15 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md flex items-center gap-1"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unassigned employees */}
          {filtered.unassignedEmployees.length > 0 && (
            <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 dark:text-red-400" /> Unassigned Employees ({filtered.unassignedEmployees.length})
                </h2>
                <div className="text-xs text-gray-500 dark:text-slate-400">Not in any manager's team</div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.unassignedEmployees.map((e) => (
                  <div key={e._id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-2 hover:shadow-md transition">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs font-bold">
                      {initials(e.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-800 dark:text-slate-100 truncate">{e.name}</div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{e.email}</div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => openReassignEmployee(e)}
                        className="text-[11px] bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/15 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md flex items-center gap-1"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Reassignment modal */}
      {reassign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReassign(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-slate-900/20 flex items-center justify-center text-xs font-bold ring-2 ring-white/40 dark:ring-slate-900/40">
                  {reassign.target ? initials(reassign.target.name) : (reassign.kind === 'manager' ? 'M' : 'E')}
                </div>
                <div className="min-w-0">
                  <div className="font-bold truncate">
                    {reassign.target ? reassign.target.name : (reassign.kind === 'manager' ? 'Assign Manager → Admin' : 'Assign Employee → Manager')}
                  </div>
                  <div className="text-xs opacity-90 truncate">
                    {reassign.target
                      ? (reassign.kind === 'manager' ? 'Assign to Admin' : 'Assign to Manager')
                      : 'Pick both source and destination'}
                  </div>
                </div>
              </div>
              <button onClick={() => setReassign(null)} className="p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-slate-900/20">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Source picker (only for "new assignment" flow) */}
              {!reassign.target && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1.5">
                    {reassign.kind === 'manager' ? 'Which Manager' : reassign.kind === 'hr' ? 'Which HR' : 'Which Employee'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select {reassign.kind === 'manager' ? 'a manager' : reassign.kind === 'hr' ? 'an HR user' : 'an employee'} —</option>
                    {reassign.kind === 'manager' && (data?.allManagers || []).map((m) => (
                      <option key={m._id} value={m._id}>{m.name}{m.email ? ` (${m.email})` : ''}</option>
                    ))}
                    {reassign.kind === 'hr' && (data?.allHrs || []).map((h) => (
                      <option key={h._id} value={h._id}>{h.name}{h.email ? ` (${h.email})` : ''}</option>
                    ))}
                    {reassign.kind === 'employee' && (data?.allEmployees || []).map((e) => (
                      <option key={e._id} value={e._id}>{e.name}{e.email ? ` (${e.email})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1.5">
                  {reassign.kind === 'manager' || reassign.kind === 'hr' ? 'Assign to Admin' : 'Assign to Manager'}
                </label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Unassigned —</option>
                  {(reassign.kind === 'manager' || reassign.kind === 'hr')
                    ? (data?.allAdmins || []).map((a) => (
                        <option key={a._id} value={a._id}>{a.name}{a.email ? ` (${a.email})` : ''}</option>
                      ))
                    : (data?.allManagers || []).map((m) => (
                        <option key={m._id} value={m._id}>{m.name}{m.email ? ` (${m.email})` : ''}</option>
                      ))}
                </select>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={12} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span>
                  {reassign.kind === 'manager'
                    ? "The manager and all their team members will report to the selected admin."
                    : reassign.kind === 'hr'
                      ? "The HR user will report to the selected admin."
                      : "The employee will be moved from their current manager's team to the selected manager."}
                </span>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/70 px-5 py-3 flex justify-end gap-2">
              <button
                onClick={() => setReassign(null)}
                disabled={busy}
                className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReassign}
                disabled={busy}
                className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Save Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TeamHierarchy;
