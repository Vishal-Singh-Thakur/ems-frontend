import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarClock, Plus, Pencil, Trash2, Search, RefreshCcw, X, Clock,
  Users, ArrowRight, AlertCircle, CheckCircle2, Loader2, Palette, IdCard
} from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import {
  ListShiftsAPI, CreateShiftAPI, UpdateShiftAPI, DeleteShiftAPI,
  ListAssignmentsAPI, CreateAssignmentAPI, DeleteAssignmentAPI, AssignableUsersAPI
} from "../components/Constant/Api/Api";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

const PALETTE = [
  '#6366f1', '#22d3ee', '#f59e0b', '#8b5cf6', '#ef4444',
  '#10b981', '#f97316', '#ec4899', '#06b6d4', '#84cc16'
];

const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ShiftManagement = ({ user }) => {
  const role = (user?.roleId?.name || user?.role || '').toLowerCase();
  const canManageShifts   = ['superadmin', 'admin', 'hr'].includes(role);
  const canAssignShifts   = ['superadmin', 'admin', 'manager'].includes(role);
  const canDeleteShifts   = ['superadmin', 'admin'].includes(role);

  const [tab, setTab] = useState('shifts');
  const [shifts, setShifts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Shift modal
  const [shiftModal, setShiftModal] = useState(null); // null | {} | shift
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '09:00', endTime: '18:00', color: '#6366f1', description: '' });
  const [savingShift, setSavingShift] = useState(false);

  // Assignment modal
  const [assignModal, setAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ userId: '', shiftId: '', fromDate: '', toDate: '', notes: '' });
  const [savingAssign, setSavingAssign] = useState(false);

  const [search, setSearch] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [s, a] = await Promise.all([
        ApiHit(ListShiftsAPI, "GET"),
        ApiHit(ListAssignmentsAPI, "GET")
      ]);
      if (s?.success) setShifts(s.data || []);
      if (a?.success) setAssignments(a.data || []);

      if (canAssignShifts) {
        const u = await ApiHit(AssignableUsersAPI, "GET");
        if (u?.success) setUsers(u.data || []);
      }
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, []);

  const openCreateShift = () => {
    setShiftForm({ name: '', startTime: '09:00', endTime: '18:00', color: '#6366f1', description: '' });
    setShiftModal({});
  };
  const openEditShift = (s) => {
    setShiftForm({ name: s.name, startTime: s.startTime, endTime: s.endTime, color: s.color, description: s.description || '' });
    setShiftModal(s);
  };

  const saveShift = async () => {
    if (!shiftForm.name.trim()) { setMsg({ type: 'error', text: 'Shift name required' }); return; }
    try {
      setSavingShift(true);
      const url = shiftModal?._id ? UpdateShiftAPI(shiftModal._id) : CreateShiftAPI;
      const method = shiftModal?._id ? 'PUT' : 'POST';
      const r = await ApiHit(url, method, shiftForm);
      if (r?.success) {
        setMsg({ type: 'success', text: `Shift ${shiftModal?._id ? 'updated' : 'created'}` });
        setShiftModal(null);
        fetchAll();
      } else setMsg({ type: 'error', text: r?.message || 'Failed' });
    } finally { setSavingShift(false); setTimeout(() => setMsg(null), 2500); }
  };

  const deleteShift = async (s) => {
    if (!window.confirm(`Delete shift "${s.name}"? All assignments using it will also be removed.`)) return;
    const r = await ApiHit(DeleteShiftAPI(s._id), 'DELETE');
    if (r?.success) { setMsg({ type: 'success', text: 'Shift deleted' }); fetchAll(); }
    else setMsg({ type: 'error', text: r?.message || 'Failed' });
    setTimeout(() => setMsg(null), 2500);
  };

  const openAssign = () => {
    setAssignForm({ userId: '', shiftId: shifts[0]?._id || '', fromDate: '', toDate: '', notes: '' });
    setAssignModal(true);
  };

  const saveAssign = async () => {
    const { userId, shiftId, fromDate, toDate } = assignForm;
    if (!userId || !shiftId || !fromDate || !toDate) { setMsg({ type: 'error', text: 'All fields except notes are required' }); return; }
    if (new Date(toDate) < new Date(fromDate)) { setMsg({ type: 'error', text: 'End date must be after start date' }); return; }
    try {
      setSavingAssign(true);
      const r = await ApiHit(CreateAssignmentAPI, "POST", assignForm);
      if (r?.success) { setMsg({ type: 'success', text: 'Shift assigned' }); setAssignModal(false); fetchAll(); }
      else setMsg({ type: 'error', text: r?.message || 'Failed' });
    } finally { setSavingAssign(false); setTimeout(() => setMsg(null), 2500); }
  };

  const deleteAssignment = async (a) => {
    if (!window.confirm(`Remove ${a.user?.name}'s "${a.shift?.name}" shift?`)) return;
    const r = await ApiHit(DeleteAssignmentAPI(a._id), 'DELETE');
    if (r?.success) { setMsg({ type: 'success', text: 'Assignment removed' }); fetchAll(); }
    else setMsg({ type: 'error', text: r?.message || 'Failed' });
    setTimeout(() => setMsg(null), 2500);
  };

  const filteredAssignments = useMemo(() => {
    if (!search) return assignments;
    const q = search.toLowerCase();
    return assignments.filter((a) =>
      (a.user?.name || '').toLowerCase().includes(q) ||
      (a.user?.email || '').toLowerCase().includes(q) ||
      (a.shift?.name || '').toLowerCase().includes(q)
    );
  }, [assignments, search]);

  const stats = useMemo(() => ({
    shifts: shifts.length,
    assignments: assignments.length,
    activeToday: assignments.filter((a) => {
      const now = new Date();
      return new Date(a.fromDate) <= now && now <= new Date(a.toDate);
    }).length,
    users: new Set(assignments.map((a) => String(a.user?._id))).size
  }), [shifts, assignments]);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      <div className="mb-6 flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <CalendarClock className="text-blue-600 dark:text-blue-400" /> Shift Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {canAssignShifts
              ? 'Define shift patterns and assign them to your team.'
              : 'View shift patterns and current assignments.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition">
            <RefreshCcw size={14} /> Refresh
          </button>
          {canManageShifts && (
            <button onClick={openCreateShift} className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow transition">
              <Plus size={14} /> New Shift
            </button>
          )}
          {canAssignShifts && (
            <button onClick={openAssign} disabled={shifts.length === 0} className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg shadow transition">
              <ArrowRight size={14} /> Assign Shift
            </button>
          )}
        </div>
      </div>

      {/* Stats — click to switch tab */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Shifts',   value: stats.shifts,      color: 'from-blue-500 to-indigo-600',    icon: <CalendarClock size={18} />, target: 'shifts' },
          { label: 'Assignments',    value: stats.assignments, color: 'from-purple-500 to-fuchsia-600', icon: <ArrowRight size={18} />,    target: 'assignments' },
          { label: 'Active Today',   value: stats.activeToday, color: 'from-emerald-500 to-teal-600',   icon: <Clock size={18} />,         target: 'assignments' },
          { label: 'Users w/ Shift', value: stats.users,       color: 'from-amber-500 to-orange-600',   icon: <Users size={18} />,         target: 'assignments' }
        ].map((s, i) => {
          const active = tab === s.target;
          return (
            <button
              key={i}
              onClick={() => setTab(s.target)}
              className={`text-left bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow transition transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-slate-900/50 ${active ? 'ring-2 ring-white dark:ring-slate-800 ring-offset-2 ring-offset-gray-50' : ''}`}
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

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-4">
        <div className="flex gap-2 flex-wrap">
          {['shifts', 'assignments'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                tab === t ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                : 'bg-gray-50 dark:bg-slate-900/40 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
              }`}
            >
              {t === 'shifts' ? <><Clock size={14} /> Shifts ({shifts.length})</> : <><ArrowRight size={14} /> Assignments ({assignments.length})</>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : tab === 'shifts' ? (
        <ShiftsGrid shifts={shifts} canEdit={canManageShifts} canDelete={canDeleteShifts} onEdit={openEditShift} onDelete={deleteShift} />
      ) : (
        <AssignmentsTable
          list={filteredAssignments}
          canRemove={canAssignShifts}
          onRemove={deleteAssignment}
          search={search}
          setSearch={setSearch}
        />
      )}

      {/* Shift modal */}
      {shiftModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShiftModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-slate-900/20 flex items-center justify-center"><CalendarClock size={20} /></div>
                <div>
                  <div className="font-bold">{shiftModal?._id ? 'Edit Shift' : 'New Shift'}</div>
                  <div className="text-xs opacity-90">Define a work-shift pattern</div>
                </div>
              </div>
              <button onClick={() => setShiftModal(null)} className="p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-slate-900/20"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1.5">Name *</label>
                <input type="text" value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                  placeholder="e.g. Morning, Night, Weekend" className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1.5">Start Time *</label>
                  <input type="time" value={shiftForm.startTime} onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1.5">End Time *</label>
                  <input type="time" value={shiftForm.endTime} onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1.5 flex items-center gap-1"><Palette size={11} /> Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PALETTE.map((c) => (
                    <button key={c} type="button" onClick={() => setShiftForm({ ...shiftForm, color: c })}
                      className={`w-7 h-7 rounded-lg border-2 transition ${shiftForm.color === c ? 'border-gray-700 scale-110' : 'border-white shadow'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1.5">Description</label>
                <textarea rows="2" value={shiftForm.description} onChange={(e) => setShiftForm({ ...shiftForm, description: e.target.value })}
                  placeholder="Optional notes about this shift" className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/70 px-5 py-3 flex justify-end gap-2">
              <button onClick={() => setShiftModal(null)} disabled={savingShift} className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-200 disabled:opacity-50">Cancel</button>
              <button onClick={saveShift} disabled={savingShift} className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow disabled:opacity-50 flex items-center gap-2">
                {savingShift ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : (shiftModal?._id ? 'Save Changes' : 'Create Shift')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-slate-900/20 flex items-center justify-center"><ArrowRight size={20} /></div>
                <div>
                  <div className="font-bold">Assign Shift</div>
                  <div className="text-xs opacity-90">Set a shift for a user for a date range</div>
                </div>
              </div>
              <button onClick={() => setAssignModal(false)} className="p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-slate-900/20"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1.5">Team Member *</label>
                <select value={assignForm.userId} onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">— Select user —</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                {users.length === 0 && <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">No users available. {role === 'manager' ? 'Add team members first.' : ''}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1.5">Shift *</label>
                <select value={assignForm.shiftId} onChange={(e) => setAssignForm({ ...assignForm, shiftId: e.target.value })}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">— Select shift —</option>
                  {shifts.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.startTime}–{s.endTime})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1.5">From *</label>
                  <input type="date" value={assignForm.fromDate} onChange={(e) => setAssignForm({ ...assignForm, fromDate: e.target.value })}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1.5">To *</label>
                  <input type="date" value={assignForm.toDate} min={assignForm.fromDate || undefined} onChange={(e) => setAssignForm({ ...assignForm, toDate: e.target.value })}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1.5">Notes</label>
                <textarea rows="2" value={assignForm.notes} onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="Optional notes" className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/70 px-5 py-3 flex justify-end gap-2">
              <button onClick={() => setAssignModal(false)} disabled={savingAssign} className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-200 disabled:opacity-50">Cancel</button>
              <button onClick={saveAssign} disabled={savingAssign} className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow disabled:opacity-50 flex items-center gap-2">
                {savingAssign ? <><Loader2 size={14} className="animate-spin" /> Assigning…</> : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

const ShiftsGrid = ({ shifts, canEdit, canDelete, onEdit, onDelete }) => (
  shifts.length === 0 ? (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
      <CalendarClock size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
      <div className="text-gray-500 dark:text-slate-400 font-medium">No shift patterns defined yet</div>
      <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Click "New Shift" to create the first one.</div>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {shifts.map((s) => (
        <div key={s._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition">
          <div className="p-4 text-white" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}dd)` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 bg-white/20 dark:bg-slate-900/20 rounded-md"><Clock size={14} /></div>
              <span className="text-[10px] bg-white/20 dark:bg-slate-900/20 px-2 py-0.5 rounded-full font-semibold">{s.startTime}–{s.endTime}</span>
            </div>
            <div className="text-lg font-bold leading-tight">{s.name}</div>
          </div>
          <div className="p-4 space-y-3">
            {s.description && <div className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2">{s.description}</div>}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              {canEdit && (
                <button onClick={() => onEdit(s)} className="flex-1 text-xs flex items-center justify-center gap-1 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/15 text-blue-700 dark:text-blue-300 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/30">
                  <Pencil size={12} /> Edit
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(s)} className="text-xs flex items-center justify-center gap-1 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/15 text-red-700 dark:text-red-300 py-1.5 px-3 rounded-lg border border-red-200 dark:border-red-500/30">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
);

const AssignmentsTable = ({ list, canRemove, onRemove, search, setSearch }) => {
  const [page, setPage] = React.useState(1);
  React.useEffect(() => { setPage(1); }, [search]);
  const pagedList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
    <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search user or shift…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
    {list.length === 0 ? (
      <div className="p-12 text-center">
        <ArrowRight size={40} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
        <div className="text-gray-500 dark:text-slate-400 font-medium">No shift assignments yet</div>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white dark:bg-slate-800 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Shift</th>
              <th className="py-3 px-4">Timing</th>
              <th className="py-3 px-4">From</th>
              <th className="py-3 px-4">To</th>
              <th className="py-3 px-4">Assigned By</th>
              {canRemove && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pagedList.map((a) => (
              <tr key={a._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {initials(a.user?.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 dark:text-slate-100 truncate">{a.user?.name}</div>
                      {a.user?.employeeId && <div className="text-[10px] text-gray-500 dark:text-slate-400 flex items-center gap-1"><IdCard size={9} /> {a.user.employeeId}</div>}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border" style={{ backgroundColor: `${a.shift?.color}22`, color: a.shift?.color, borderColor: `${a.shift?.color}55` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.shift?.color }} />
                    {a.shift?.name}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">{a.shift?.startTime}–{a.shift?.endTime}</td>
                <td className="py-3 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">{fmtDate(a.fromDate)}</td>
                <td className="py-3 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">{fmtDate(a.toDate)}</td>
                <td className="py-3 px-4 text-gray-600 dark:text-slate-300 text-xs">{a.assignedBy?.name || '—'}</td>
                {canRemove && (
                  <td className="py-3 px-4">
                    <div className="flex justify-end">
                      <button onClick={() => onRemove(a)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg" title="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    {list.length > 0 && (
      <Pagination
        currentPage={page}
        totalItems={list.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    )}
  </div>
  );
};

export default ShiftManagement;
