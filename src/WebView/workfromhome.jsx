import React, { useEffect, useMemo, useState } from "react";
import {
  Home, Plus, Search, Filter, Calendar, RefreshCcw, CheckCircle2, XCircle, Clock3, Eye, X, FileText, User as UserIcon, Mail
} from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import {
  GetMyLeavesAPI,
  GetAllLeavesAPI,
  ApproveLeaveAPI,
  RejectLeaveAPI,
  GetMyTeamAPI
} from "../components/Constant/Api/Api";
import WfhRequestModal from "../components/Employee/WfhRequestModal";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

// Mirrors backend APPROVAL_MATRIX
const APPROVAL_MATRIX = {
  superadmin: ['superadmin'],
  admin: ['superadmin'],
  hr: ['superadmin', 'admin'],
  manager: ['admin', 'hr'],
  employee: ['manager', 'hr']
};

const STATUS_STYLE = {
  Pending:  { pill: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',       dot: 'bg-amber-500' },
  Approved: { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
  Rejected: { pill: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',             dot: 'bg-red-500' }
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const daysBetween = (a, b) => {
  if (!a || !b) return 0;
  const x = new Date(a); x.setHours(0, 0, 0, 0);
  const y = new Date(b); y.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((y - x) / 86400000) + 1);
};

const WorkFromHome = ({ user }) => {
  const currentRole = (user?.roleId?.name || user?.role || 'employee').toLowerCase();
  const isEmployeeOnly = currentRole === 'employee';
  const isManagerOnly = currentRole === 'manager';

  const canAct = (leave) => {
    if (isEmployeeOnly) return false;
    if (leave.status !== 'Pending') return false;
    const targetRole = leave.employee?.roleId?.name;
    if (!targetRole) return false;
    if (String(leave.employee?._id) === String(user?._id)) return false;
    return (APPROVAL_MATRIX[targetRole] || []).includes(currentRole);
  };

  const [items, setItems] = useState([]);
  const [teamIds, setTeamIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAll = async () => {
    try {
      setLoading(true);
      if (isEmployeeOnly) {
        const r = await ApiHit(GetMyLeavesAPI, "GET");
        const docs = r?.data?.docs || r?.data || [];
        setItems(docs.filter((l) => l.leaveType === 'Work From Home'));
      } else {
        let ids = [];
        if (isManagerOnly) {
          const t = await ApiHit(GetMyTeamAPI, "GET");
          ids = (t?.data || []).map((m) => String(m.userId?._id || m.userId)).filter(Boolean);
          setTeamIds(ids);
        }
        const r = await ApiHit(GetAllLeavesAPI, "GET");
        const docs = r?.data?.docs || r?.data || [];
        let scoped = docs.filter((l) => l.leaveType === 'Work From Home');
        if (isManagerOnly) scoped = scoped.filter((l) => ids.includes(String(l.employee?._id)));
        setItems(scoped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this WFH request?')) return;
    setBusyId(id);
    try {
      const r = await ApiHit(ApproveLeaveAPI(id), "PATCH");
      if (r?.success) fetchAll();
      else alert(r?.message || 'Failed');
    } finally { setBusyId(null); }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    setBusyId(id);
    try {
      const r = await ApiHit(RejectLeaveAPI(id), "PATCH", { rejectionReason: reason });
      if (r?.success) fetchAll();
      else alert(r?.message || 'Failed');
    } finally { setBusyId(null); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const fromTs = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const toTs = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

    return items.filter((l) => {
      const matchSearch = !q ||
        (l.employee?.name || '').toLowerCase().includes(q) ||
        (l.employee?.email || '').toLowerCase().includes(q) ||
        (l.reason || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      let matchDate = true;
      if (fromTs != null || toTs != null) {
        const start = l.fromDate ? new Date(l.fromDate).getTime() : null;
        const end = l.toDate ? new Date(l.toDate).getTime() : start;
        if (fromTs != null && end != null && end < fromTs) matchDate = false;
        if (toTs != null && start != null && start > toTs) matchDate = false;
      }
      return matchSearch && matchStatus && matchDate;
    }).sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));
  }, [items, search, statusFilter, fromDate, toDate]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, fromDate, toDate]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((l) => l.status === 'Pending').length,
    approved: items.filter((l) => l.status === 'Approved').length,
    rejected: items.filter((l) => l.status === 'Rejected').length,
    days: items.filter((l) => l.status === 'Approved').reduce((s, l) => s + daysBetween(l.fromDate, l.toDate), 0)
  }), [items]);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Home className="text-cyan-600 dark:text-cyan-400" /> Work From Home
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {isEmployeeOnly
              ? "Request work-from-home days and track their approval status."
              : isManagerOnly
                ? "Review WFH requests from your team members."
                : "Review WFH requests across the organization."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          {isEmployeeOnly && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
            >
              <Plus size={14} /> Request WFH
            </button>
          )}
        </div>
      </div>

      {/* Stats — click to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Requests', value: stats.total,    color: 'from-blue-500 to-indigo-600',    icon: <Home size={18} />,         filter: 'all' },
          { label: 'Pending',        value: stats.pending,  color: 'from-amber-500 to-orange-600',   icon: <Clock3 size={18} />,       filter: 'Pending' },
          { label: 'Approved',       value: stats.approved, color: 'from-emerald-500 to-teal-600',   icon: <CheckCircle2 size={18} />, filter: 'Approved' },
          { label: 'Rejected',       value: stats.rejected, color: 'from-red-500 to-rose-600',       icon: <XCircle size={18} />,      filter: 'Rejected' },
          { label: 'WFH Days',       value: stats.days,     color: 'from-cyan-500 to-blue-600',      icon: <Calendar size={18} />,     filter: null }
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
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-6 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search employee, email or reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400 dark:text-slate-500" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-medium">
            <Calendar size={14} className="text-cyan-600 dark:text-cyan-400" /> Date range:
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-gray-500 dark:text-slate-400">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-gray-500 dark:text-slate-400">To</label>
            <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          {(fromDate || toDate || search || statusFilter !== 'all') && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); setSearch(''); setStatusFilter('all'); }}
              className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline ml-auto font-medium"
            >Clear all filters</button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <Home size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {items.length === 0
              ? (isEmployeeOnly ? 'No WFH requests yet' : 'No WFH requests to show')
              : 'No requests match your filters'}
          </div>
          {items.length === 0 && isEmployeeOnly && (
            <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Click "Request WFH" to submit your first request.</div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/40 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12">#</th>
                  {!isEmployeeOnly && <th className="py-3 px-4">Employee</th>}
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((l, idx) => {
                  const i = (currentPage - 1) * PAGE_SIZE + idx;
                  const s = STATUS_STYLE[l.status] || STATUS_STYLE.Pending;
                  const busy = busyId === l._id;
                  return (
                    <tr key={l._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                      {!isEmployeeOnly && (
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {initials(l.employee?.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-800 dark:text-slate-100 truncate">{l.employee?.name || '—'}</div>
                              <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{l.employee?.email || ''}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1"><Calendar size={11} className="text-cyan-600 dark:text-cyan-400" /> {fmtDate(l.fromDate)}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1"><Calendar size={11} className="text-cyan-600 dark:text-cyan-400" /> {fmtDate(l.toDate)}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-700 dark:text-slate-200 font-medium">{daysBetween(l.fromDate, l.toDate)}</td>
                      <td className="py-3 px-4 max-w-[220px]">
                        {l.reason ? (
                          <div className="text-xs text-gray-500 dark:text-slate-400 italic line-clamp-2" title={l.reason}>"{l.reason}"</div>
                        ) : <span className="text-gray-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${s.pill} whitespace-nowrap`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {l.status}
                        </span>
                        {l.status !== 'Pending' && l.approvalDate && (
                          <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">on {fmtDate(l.approvalDate)}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {canAct(l) && (
                            <>
                              <button
                                disabled={busy}
                                onClick={() => handleApprove(l._id)}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => handleReject(l._id)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setPreview(l)}
                            className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
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

      {/* Details modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-5 text-white relative">
              <button onClick={() => setPreview(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-slate-900/20 transition">
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 dark:bg-slate-900/20 text-white flex items-center justify-center text-sm font-bold ring-2 ring-white/40 dark:ring-slate-900/40">
                  {initials(preview.employee?.name)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold leading-tight truncate">{preview.employee?.name || '—'}</h2>
                  <p className="text-xs opacity-90 flex items-center gap-1 mt-0.5"><Mail size={11} /> {preview.employee?.email || '—'}</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold">From</div>
                  <div className="mt-1 text-sm font-medium text-gray-800 dark:text-slate-100">{fmtDate(preview.fromDate)}</div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold">To</div>
                  <div className="mt-1 text-sm font-medium text-gray-800 dark:text-slate-100">{fmtDate(preview.toDate)}</div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold">Days</div>
                  <div className="mt-1 text-sm font-medium text-gray-800 dark:text-slate-100">{daysBetween(preview.fromDate, preview.toDate)}</div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold">Status</div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${(STATUS_STYLE[preview.status] || STATUS_STYLE.Pending).pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${(STATUS_STYLE[preview.status] || STATUS_STYLE.Pending).dot}`} />
                      {preview.status}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold mb-1 flex items-center gap-1"><FileText size={11} /> Reason</div>
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl p-3 text-sm text-gray-700 dark:text-slate-200 italic">
                  {preview.reason ? `"${preview.reason}"` : '— No reason provided —'}
                </div>
              </div>
              {preview.rejectionReason && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-red-500 font-semibold mb-1">Rejection Reason</div>
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-3 text-sm text-red-700 dark:text-red-300 italic">"{preview.rejectionReason}"</div>
                </div>
              )}
              {preview.status !== 'Pending' && (preview.approvedBy?.name || preview.approvalDate) && (
                <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <UserIcon size={11} />
                  {preview.status} {preview.approvedBy?.name ? `by ${preview.approvedBy.name}` : ''}
                  {preview.approvalDate ? ` on ${fmtDate(preview.approvalDate)}` : ''}
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 px-5 py-3 flex justify-end gap-2">
              {canAct(preview) && (
                <>
                  <button
                    disabled={busyId === preview._id}
                    onClick={async () => { await handleReject(preview._id); setPreview(null); }}
                    className="px-4 py-1.5 text-sm bg-white dark:bg-slate-800 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 flex items-center gap-1"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                  <button
                    disabled={busyId === preview._id}
                    onClick={async () => { await handleApprove(preview._id); setPreview(null); }}
                    className="px-4 py-1.5 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                </>
              )}
              <button onClick={() => setPreview(null)} className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Request WFH modal */}
      {modalOpen && (
        <WfhRequestModal
          onClose={() => setModalOpen(false)}
          onSuccess={fetchAll}
        />
      )}
    </main>
  );
};

export default WorkFromHome;
