import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Plus, Calendar, Search, Filter, RefreshCcw,
  CheckCircle2, XCircle, Clock3, Eye, X, FileText
} from "lucide-react";
import LeaveRequestModal from "../components/Employee/LeaveRequestModal";
import ApiHit from "../Utils/ApiHit";
import { GetMyLeavesAPI } from "../components/Constant/Api/Api";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

// Annual quota per leave type (should ideally come from company policy config)
const LEAVE_QUOTA = {
  'Casual Leave':    10,
  'Sick Leave':      8,
  'Annual Leave':    15,
  'Paternity Leave': 10,
  'Maternity Leave': 90,
  'Work From Home':  20
};

const TYPE_COLOR = {
  'Casual Leave':    'from-blue-500 to-indigo-600',
  'Sick Leave':      'from-red-500 to-rose-600',
  'Annual Leave':    'from-emerald-500 to-teal-600',
  'Paternity Leave': 'from-purple-500 to-fuchsia-600',
  'Maternity Leave': 'from-pink-500 to-rose-600',
  'Work From Home':  'from-cyan-500 to-blue-600'
};

const STATUS_STYLE = {
  Pending:  { pill: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',       dot: 'bg-amber-500' },
  Approved: { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
  Rejected: { pill: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',             dot: 'bg-red-500' }
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const daysBetween = (from, to) => {
  if (!from || !to) return 0;
  const a = new Date(from); a.setHours(0, 0, 0, 0);
  const b = new Date(to);   b.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
};

const EmployeeTimeOff = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const r = await ApiHit(GetMyLeavesAPI, "GET");
      if (r?.success) {
        const docs = r.data?.docs || r.data || [];
        setLeaves(docs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  // Compute balance per leave type (only Approved leaves count toward used)
  const balance = useMemo(() => {
    return Object.keys(LEAVE_QUOTA).map((type) => {
      const total = LEAVE_QUOTA[type];
      const used = leaves
        .filter((l) => l.leaveType === type && l.status === 'Approved')
        .reduce((sum, l) => sum + daysBetween(l.fromDate, l.toDate), 0);
      const pending = leaves
        .filter((l) => l.leaveType === type && l.status === 'Pending')
        .reduce((sum, l) => sum + daysBetween(l.fromDate, l.toDate), 0);
      return { type, total, used, pending, remaining: Math.max(0, total - used) };
    });
  }, [leaves]);

  const totals = useMemo(() => ({
    totalQuota:  balance.reduce((s, b) => s + b.total, 0),
    used:        balance.reduce((s, b) => s + b.used, 0),
    pending:     balance.reduce((s, b) => s + b.pending, 0),
    remaining:   balance.reduce((s, b) => s + b.remaining, 0)
  }), [balance]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leaves.filter((l) => {
      const matchSearch = !q ||
        (l.leaveType || '').toLowerCase().includes(q) ||
        (l.reason || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchType = typeFilter === 'all' || l.leaveType === typeFilter;
      return matchSearch && matchStatus && matchType;
    }).sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));
  }, [leaves, search, statusFilter, typeFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, typeFilter]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const stats = useMemo(() => ({
    total: leaves.length,
    approved: leaves.filter((l) => l.status === 'Approved').length,
    pending: leaves.filter((l) => l.status === 'Pending').length,
    rejected: leaves.filter((l) => l.status === 'Rejected').length
  }), [leaves]);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <CalendarDays className="text-blue-600 dark:text-blue-400" /> My Time Off
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Track your leave balance, requests and their approval status.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeaves}
            className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            <Plus size={14} /> Request Leave
          </button>
        </div>
      </div>

      {/* Overall stats — click to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Requests', value: stats.total,    color: 'from-blue-500 to-indigo-600',    icon: <CalendarDays size={18} />, filter: 'all' },
          { label: 'Approved',       value: stats.approved, color: 'from-emerald-500 to-teal-600',   icon: <CheckCircle2 size={18} />, filter: 'Approved' },
          { label: 'Pending',        value: stats.pending,  color: 'from-amber-500 to-orange-600',   icon: <Clock3 size={18} />,       filter: 'Pending' },
          { label: 'Rejected',       value: stats.rejected, color: 'from-red-500 to-rose-600',       icon: <XCircle size={18} />,      filter: 'Rejected' }
        ].map((s, i) => {
          const active = statusFilter === s.filter;
          return (
            <button
              key={i}
              onClick={() => setStatusFilter(s.filter)}
              className={`text-left bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow transition transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-slate-900/50 ${active ? 'ring-2 ring-white dark:ring-slate-800 ring-offset-2 ring-offset-gray-50' : ''}`}
            >
              <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-lg inline-block mb-2">{s.icon}</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">{s.value}</div>
              <div className="text-xs opacity-90">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* Leave balance table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40">
          <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <CalendarDays size={16} className="text-blue-600 dark:text-blue-400" /> Leave Balance
          </h2>
          <div className="text-xs text-gray-500 dark:text-slate-400">
            <span className="font-semibold text-gray-700 dark:text-slate-200">{totals.used}</span> used ·
            <span className="font-semibold text-amber-600 dark:text-amber-400 ml-1">{totals.pending}</span> pending ·
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 ml-1">{totals.remaining}</span> remaining / {totals.totalQuota} total
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white dark:bg-slate-800 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4 text-center">Total (yr)</th>
                <th className="py-3 px-4 text-center">Used</th>
                <th className="py-3 px-4 text-center">Pending</th>
                <th className="py-3 px-4 text-center">Remaining</th>
                <th className="py-3 px-4">Usage</th>
              </tr>
            </thead>
            <tbody>
              {balance.map((b) => {
                const pct = b.total ? Math.round((b.used / b.total) * 100) : 0;
                const barColor = pct >= 90 ? 'from-red-500 to-rose-500'
                  : pct >= 70 ? 'from-amber-500 to-orange-500'
                  : 'from-emerald-500 to-teal-500';
                return (
                  <tr key={b.type} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${TYPE_COLOR[b.type] || 'from-gray-500 to-gray-600'} text-white flex items-center justify-center`}>
                          <CalendarDays size={14} />
                        </div>
                        <span className="font-medium text-gray-800 dark:text-slate-100">{b.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-slate-200">{b.total}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">{b.used}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.pending > 0 ? (
                        <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">{b.pending}</span>
                      ) : <span className="text-gray-400 dark:text-slate-500">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${b.remaining === 0 ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30' : 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'}`}>
                        {b.remaining}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700/50 rounded-full overflow-hidden min-w-[80px]">
                          <div className={`h-full bg-gradient-to-r ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by leave type or reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400 dark:text-slate-500" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Types</option>
            {Object.keys(LEAVE_QUOTA).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Leave history table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <CalendarDays size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {leaves.length === 0 ? 'No leave requests yet' : 'No leave requests match your filters'}
          </div>
          {leaves.length === 0 && <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Click "Request Leave" to raise your first request.</div>}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40">
            <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <CalendarDays size={16} className="text-blue-600 dark:text-blue-400" /> Leave History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white dark:bg-slate-800 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((l, idx) => {
                  const i = (currentPage - 1) * PAGE_SIZE + idx;
                  const s = STATUS_STYLE[l.status] || STATUS_STYLE.Pending;
                  return (
                    <tr key={l._id || i} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 whitespace-nowrap">
                          {l.leaveType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1"><Calendar size={11} className="text-blue-600 dark:text-blue-400" /> {fmtDate(l.fromDate)}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1"><Calendar size={11} className="text-blue-600 dark:text-blue-400" /> {fmtDate(l.toDate)}</div>
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
                        <div className="flex items-center justify-end">
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
            <div className={`bg-gradient-to-r ${TYPE_COLOR[preview.leaveType] || 'from-blue-600 to-indigo-600'} p-5 text-white relative`}>
              <button onClick={() => setPreview(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-slate-900/20 transition">
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 dark:bg-slate-900/20 flex items-center justify-center"><CalendarDays size={22} /></div>
                <div>
                  <h2 className="text-xl font-bold leading-tight">{preview.leaveType}</h2>
                  <p className="text-xs opacity-90 mt-0.5">{fmtDate(preview.fromDate)} → {fmtDate(preview.toDate)} · {daysBetween(preview.fromDate, preview.toDate)} day(s)</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold mb-1">Status</div>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${(STATUS_STYLE[preview.status] || STATUS_STYLE.Pending).pill}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${(STATUS_STYLE[preview.status] || STATUS_STYLE.Pending).dot}`} />
                  {preview.status}
                </span>
                {preview.approvalDate && <span className="ml-2 text-[11px] text-gray-500 dark:text-slate-400">on {fmtDate(preview.approvalDate)}</span>}
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
            </div>
            <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 px-5 py-3 flex justify-end">
              <button onClick={() => setPreview(null)} className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Request Leave modal */}
      {open && (
        <LeaveRequestModal
          onClose={() => setOpen(false)}
          onSuccess={fetchLeaves}
        />
      )}
    </main>
  );
};

export default EmployeeTimeOff;
