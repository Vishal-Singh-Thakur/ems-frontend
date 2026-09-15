import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Search, Filter, CheckCircle2, XCircle, Clock3, Calendar, User as UserIcon, Eye, X, Mail, FileText } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import {
  GetAllLeavesAPI,
  ApproveLeaveAPI,
  RejectLeaveAPI,
  GetMyTeamAPI
} from "../components/Constant/Api/Api";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

// Must mirror backend APPROVAL_MATRIX in leaveController.js
const APPROVAL_MATRIX = {
  superadmin: ['superadmin'],
  admin: ['superadmin'],
  hr: ['superadmin', 'admin'],
  manager: ['admin', 'hr'],
  employee: ['manager', 'hr']
};

const STATUS_STYLE = {
  Pending: {
    pill: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
    dot: "bg-amber-500"
  },
  Approved: {
    pill: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
    dot: "bg-emerald-500"
  },
  Rejected: {
    pill: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30",
    dot: "bg-red-500"
  }
};

const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const LeaveManagement = ({ user }) => {
  const currentUserId = user?._id;
  const currentRole = (user?.roleId?.name || user?.role || '').toLowerCase();
  const isManagerOnly = currentRole === 'manager';

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [leaveList, setLeaveList] = useState([]);
  const [teamMemberIds, setTeamMemberIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const canAct = (leave) => {
    if (leave.status !== 'Pending') return false;
    const targetRole = leave.employee?.roleId?.name;
    const targetId = leave.employee?._id;
    if (!targetRole) return false;
    if (String(targetId) === String(currentUserId)) return false;
    const allowed = APPROVAL_MATRIX[targetRole] || [];
    return allowed.includes(currentRole);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      let teamIds = [];
      if (isManagerOnly) {
        const teamRes = await ApiHit(GetMyTeamAPI, "GET");
        teamIds = (teamRes?.data || []).map((m) => String(m.userId?._id || m.userId)).filter(Boolean);
        setTeamMemberIds(teamIds);
      }

      const res = await ApiHit(GetAllLeavesAPI, "GET");
      if (res?.success) {
        const docs = res.data?.docs || res.data || [];
        const scoped = isManagerOnly
          ? docs.filter((leave) => teamIds.includes(String(leave.employee?._id)))
          : docs;
        setLeaveList(scoped);
      }
    } catch (err) {
      console.error("Fetch leaves error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this leave?")) return;
    setBusyId(id);
    try {
      const res = await ApiHit(ApproveLeaveAPI(id), "PATCH");
      if (res?.success) fetchAll();
      else alert(res?.message || "Failed to approve");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;
    setBusyId(id);
    try {
      const res = await ApiHit(RejectLeaveAPI(id), "PATCH", { rejectionReason: reason });
      if (res?.success) fetchAll();
      else alert(res?.message || "Failed to reject");
    } finally {
      setBusyId(null);
    }
  };

  const filteredLeaves = useMemo(() => {
    const q = search.toLowerCase();
    const fromTs = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const toTs = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

    return leaveList.filter((leave) => {
      const matchesSearch =
        (leave.employee?.name || "").toLowerCase().includes(q) ||
        (leave.employee?.email || "").toLowerCase().includes(q) ||
        (leave.leaveType || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || leave.status === statusFilter;

      // Date range overlap: [leave.fromDate, leave.toDate] intersects [fromTs, toTs]
      let matchesDate = true;
      if (fromTs != null || toTs != null) {
        const start = leave.fromDate ? new Date(leave.fromDate).getTime() : null;
        const end = leave.toDate ? new Date(leave.toDate).getTime() : start;
        if (fromTs != null && end != null && end < fromTs) matchesDate = false;
        if (toTs != null && start != null && start > toTs) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [leaveList, search, statusFilter, fromDate, toDate]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, fromDate, toDate]);

  const paginatedLeaves = useMemo(
    () => filteredLeaves.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredLeaves, currentPage]
  );

  const stats = useMemo(() => ({
    total: leaveList.length,
    pending: leaveList.filter((l) => l.status === 'Pending').length,
    approved: leaveList.filter((l) => l.status === 'Approved').length,
    rejected: leaveList.filter((l) => l.status === 'Rejected').length
  }), [leaveList]);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <CalendarDays className="text-blue-600 dark:text-blue-400" /> Leave Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {isManagerOnly
            ? "Review and act on leave requests raised by your team members."
            : "Review and act on employee leave requests across the organization."}
        </p>
      </div>

      {/* Stats — click to filter by status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total',    value: stats.total,    color: 'from-blue-500 to-indigo-600',    icon: <CalendarDays size={18} />, filter: 'all' },
          { label: 'Pending',  value: stats.pending,  color: 'from-amber-500 to-orange-600',   icon: <Clock3 size={18} />,       filter: 'Pending' },
          { label: 'Approved', value: stats.approved, color: 'from-emerald-500 to-teal-600',   icon: <CheckCircle2 size={18} />, filter: 'Approved' },
          { label: 'Rejected', value: stats.rejected, color: 'from-red-500 to-rose-600',       icon: <XCircle size={18} />,      filter: 'Rejected' }
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

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-6 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search employee, email or leave type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400 dark:text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-medium">
            <Calendar size={14} className="text-blue-600 dark:text-blue-400" /> Date range:
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-gray-500 dark:text-slate-400">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-gray-500 dark:text-slate-400">To</label>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline ml-auto font-medium"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : filteredLeaves.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <CalendarDays size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {isManagerOnly && teamMemberIds.length === 0
              ? "No team members assigned to you yet"
              : "No leave requests match your filters"}
          </div>
          {isManagerOnly && (
            <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Only leaves from your team members appear here.</div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/40 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeaves.map((leave, idx) => {
                  const i = (currentPage - 1) * PAGE_SIZE + idx;
                  const s = STATUS_STYLE[leave.status] || STATUS_STYLE.Pending;
                  const busy = busyId === leave._id;
                  return (
                    <tr key={leave._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {initials(leave.employee?.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-800 dark:text-slate-100 truncate">{leave.employee?.name || '—'}</div>
                            <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{leave.employee?.email || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 whitespace-nowrap">
                          {leave.leaveType || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="text-blue-600 dark:text-blue-400" /> {fmtDate(leave.fromDate)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="text-blue-600 dark:text-blue-400" /> {fmtDate(leave.toDate)}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-[220px]">
                        {leave.reason ? (
                          <div className="text-xs text-gray-500 dark:text-slate-400 italic line-clamp-2" title={leave.reason}>"{leave.reason}"</div>
                        ) : <span className="text-gray-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${s.pill} whitespace-nowrap`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {leave.status}
                        </span>
                        {leave.status !== 'Pending' && leave.approvalDate && (
                          <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">on {fmtDate(leave.approvalDate)}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {canAct(leave) && (
                            <>
                              <button
                                disabled={busy}
                                onClick={() => handleApprove(leave._id)}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => handleReject(leave._id)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          {!canAct(leave) && leave.status === 'Pending' && (
                            <span className="text-[11px] text-gray-400 dark:text-slate-500 italic flex items-center gap-1 mr-1">
                              <UserIcon size={10} />
                              Awaiting {(APPROVAL_MATRIX[leave.employee?.roleId?.name] || []).join(' / ')}
                            </span>
                          )}
                          <button
                            onClick={() => setSelectedLeave(leave)}
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
            totalItems={filteredLeaves.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Details Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white relative">
              <button
                onClick={() => setSelectedLeave(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-slate-900/20 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 dark:bg-slate-900/20 text-white flex items-center justify-center text-sm font-bold ring-2 ring-white/40 dark:ring-slate-900/40">
                  {initials(selectedLeave.employee?.name)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold leading-tight truncate">{selectedLeave.employee?.name || '—'}</h2>
                  <p className="text-xs opacity-90 flex items-center gap-1 mt-0.5">
                    <Mail size={11} /> {selectedLeave.employee?.email || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold">Leave Type</div>
                  <div className="mt-1 text-sm font-semibold text-gray-800 dark:text-slate-100">{selectedLeave.leaveType || '—'}</div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold">Status</div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${(STATUS_STYLE[selectedLeave.status] || STATUS_STYLE.Pending).pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${(STATUS_STYLE[selectedLeave.status] || STATUS_STYLE.Pending).dot}`} />
                      {selectedLeave.status}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold">From</div>
                  <div className="mt-1 text-sm font-medium text-gray-800 dark:text-slate-100 flex items-center gap-1">
                    <Calendar size={12} className="text-blue-600 dark:text-blue-400" /> {fmtDate(selectedLeave.fromDate)}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold">To</div>
                  <div className="mt-1 text-sm font-medium text-gray-800 dark:text-slate-100 flex items-center gap-1">
                    <Calendar size={12} className="text-blue-600 dark:text-blue-400" /> {fmtDate(selectedLeave.toDate)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold flex items-center gap-1 mb-1">
                  <FileText size={11} /> Reason
                </div>
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl p-3 text-sm text-gray-700 dark:text-slate-200 italic">
                  {selectedLeave.reason ? `"${selectedLeave.reason}"` : '— No reason provided —'}
                </div>
              </div>

              {selectedLeave.rejectionReason && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-red-500 font-semibold mb-1">Rejection Reason</div>
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-3 text-sm text-red-700 dark:text-red-300 italic">
                    "{selectedLeave.rejectionReason}"
                  </div>
                </div>
              )}

              {selectedLeave.status !== 'Pending' && (selectedLeave.approvedBy?.name || selectedLeave.approvalDate) && (
                <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <UserIcon size={11} />
                  {selectedLeave.status} {selectedLeave.approvedBy?.name ? `by ${selectedLeave.approvedBy.name}` : ''}
                  {selectedLeave.approvalDate ? ` on ${fmtDate(selectedLeave.approvalDate)}` : ''}
                </div>
              )}
            </div>

            {/* Footer with actions */}
            <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/70 px-6 py-4 flex items-center justify-end gap-3">
              {canAct(selectedLeave) ? (
                <>
                  <button
                    disabled={busyId === selectedLeave._id}
                    onClick={async () => { await handleReject(selectedLeave._id); setSelectedLeave(null); }}
                    className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                  <button
                    disabled={busyId === selectedLeave._id}
                    onClick={async () => { await handleApprove(selectedLeave._id); setSelectedLeave(null); }}
                    className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow transition disabled:opacity-50 flex items-center gap-1"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedLeave(null)}
                  className="px-5 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default LeaveManagement;
