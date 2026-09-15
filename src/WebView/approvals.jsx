import React, { useEffect, useMemo, useState } from "react";
import { CheckSquare, Search, Filter, Calendar, Wallet, CheckCircle2, XCircle, Clock3, Eye, User as UserIcon } from "lucide-react";
import ApprovalDetailsModal from "../components/Manager/ApprovalDetailsModal";
import ApiHit from "../Utils/ApiHit";
import {
  ApproveLeaveAPI,
  RejectLeaveAPI,
  ApproveRequestAPI,
  RejectRequestAPI,
  GetAllApprovalsAPI,
  GetAllLeavesAPI,
  GetMyTeamAPI,
} from "../components/Constant/Api/Api";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

const STATUS_STYLE = {
  Pending: {
    pill: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
    dot: "bg-amber-500",
    accent: "border-l-amber-400"
  },
  Approved: {
    pill: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
    accent: "border-l-emerald-500"
  },
  Rejected: {
    pill: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30",
    dot: "bg-red-500",
    accent: "border-l-red-500"
  }
};

const TYPE_META = {
  Leave: { icon: <Calendar size={16} />, color: 'from-blue-500 to-indigo-600', pill: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300' },
  Expense: { icon: <Wallet size={16} />, color: 'from-purple-500 to-fuchsia-600', pill: 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300' }
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const Approvals = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        setLoading(true);
        const teamData = await ApiHit(GetMyTeamAPI);
        const myTeamMemberIds = (teamData?.data || []).map((m) => m.userId?._id || m.userId);

        const [leavesData, expensesData] = await Promise.all([
          ApiHit(GetAllLeavesAPI),
          ApiHit(GetAllApprovalsAPI),
        ]);

        const leaveRequests = (leavesData?.data?.docs || [])
          .filter((leave) => myTeamMemberIds.includes(String(leave.employee?._id)) || myTeamMemberIds.map(String).includes(String(leave.employee?._id)))
          .map((leave) => ({
            id: leave._id,
            type: "Leave",
            employee: leave.employee?.name || "Unknown",
            employeeId: leave.employee?._id,
            description: leave.leaveType,
            fromDate: leave.fromDate,
            toDate: leave.toDate,
            reason: leave.reason,
            status: leave.status,
            details: leave
          }));

        const expenseRequests = (expensesData?.expenses || expensesData?.data || [])
          .filter((expense) => myTeamMemberIds.map(String).includes(String(expense.employee?._id)))
          .map((expense) => ({
            id: expense._id,
            type: "Expense",
            employee: expense.employee?.name || "Unknown",
            employeeId: expense.employee?._id,
            description: `${expense.category} • ₹${expense.amount}`,
            date: expense.createdAt,
            status: expense.status,
            details: expense
          }));

        const allRequests = [...leaveRequests, ...expenseRequests].sort(
          (a, b) => new Date(b.date || b.fromDate) - new Date(a.date || a.fromDate)
        );
        setApprovalRequests(allRequests);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovals();
  }, []);

  const filteredRequests = useMemo(() => {
    const fromTs = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const toTs = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

    return approvalRequests.filter((req) => {
      const matchSearch = req.employee.toLowerCase().includes(search.toLowerCase())
        || (req.description || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || req.status === statusFilter;
      const matchType = typeFilter === "all" || req.type === typeFilter;

      // Date filter: leaves match if range overlaps [fromDate, toDate]; expenses match on their date
      let matchDate = true;
      if (fromTs != null || toTs != null) {
        if (req.type === 'Leave') {
          const start = req.fromDate ? new Date(req.fromDate).getTime() : null;
          const end = req.toDate ? new Date(req.toDate).getTime() : null;
          if (fromTs != null && end != null && end < fromTs) matchDate = false;
          if (toTs != null && start != null && start > toTs) matchDate = false;
        } else {
          const t = req.date ? new Date(req.date).getTime() : null;
          if (fromTs != null && t != null && t < fromTs) matchDate = false;
          if (toTs != null && t != null && t > toTs) matchDate = false;
        }
      }

      return matchSearch && matchStatus && matchType && matchDate;
    });
  }, [approvalRequests, search, statusFilter, typeFilter, fromDate, toDate]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, typeFilter, fromDate, toDate]);

  const paginatedRequests = useMemo(
    () => filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredRequests, currentPage]
  );

  const stats = useMemo(() => ({
    total: approvalRequests.length,
    pending: approvalRequests.filter((r) => r.status === 'Pending').length,
    approved: approvalRequests.filter((r) => r.status === 'Approved').length,
    rejected: approvalRequests.filter((r) => r.status === 'Rejected').length
  }), [approvalRequests]);

  const handleAction = async (request, action) => {
    setBusyId(`${request.type}-${request.id}`);
    try {
      const isApprove = action === 'approve';
      let endpoint;
      if (request.type === 'Leave') {
        endpoint = isApprove ? ApproveLeaveAPI(request.id) : RejectLeaveAPI(request.id);
      } else {
        endpoint = isApprove ? ApproveRequestAPI(request.id) : RejectRequestAPI(request.id);
      }
      const body = !isApprove && request.type === 'Leave' ? { rejectionReason: window.prompt('Reason for rejection:') || 'No reason provided' } : null;
      const r = await ApiHit(endpoint, "PATCH", body);
      if (r?.success) {
        setApprovalRequests((prev) =>
          prev.map((x) =>
            x.id === request.id && x.type === request.type
              ? { ...x, status: isApprove ? 'Approved' : 'Rejected' }
              : x
          )
        );
      } else {
        alert(r?.message || 'Failed');
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <CheckSquare className="text-blue-600 dark:text-blue-400" /> Approvals
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Review your team's leave and expense requests.</p>
      </div>

      {/* Stats — click to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total',    value: stats.total,    color: 'from-blue-500 to-indigo-600',    icon: <CheckSquare size={18} />,  filter: 'all' },
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
              placeholder="Search employee or leave type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400 dark:text-slate-500" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Types</option>
              <option value="Leave">Leave</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
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
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <CheckSquare size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">No approval requests match your filters</div>
          <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Only requests from your team members appear here.</div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/40 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((req, idx) => {
                  const i = (currentPage - 1) * PAGE_SIZE + idx;
                  const s = STATUS_STYLE[req.status] || STATUS_STYLE.Pending;
                  const t = TYPE_META[req.type] || TYPE_META.Leave;
                  const busy = busyId === `${req.type}-${req.id}`;
                  return (
                    <tr key={`${req.type}-${req.id}`} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.color} text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
                            {initials(req.employee)}
                          </div>
                          <span className="font-medium text-gray-800 dark:text-slate-100 truncate">{req.employee}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${t.pill}`}>
                          {t.icon} {req.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-700 dark:text-slate-200 font-medium max-w-[200px] truncate" title={req.description}>{req.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        {req.type === 'Leave' && req.fromDate ? (
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300 whitespace-nowrap">
                            <Calendar size={11} className="text-blue-600 dark:text-blue-400" />
                            {fmtDate(req.fromDate)}
                            <span className="text-gray-400 dark:text-slate-500">→</span>
                            {fmtDate(req.toDate)}
                          </div>
                        ) : req.date ? (
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300 whitespace-nowrap">
                            <Calendar size={11} className="text-purple-600 dark:text-purple-400" /> {fmtDate(req.date)}
                          </div>
                        ) : <span className="text-gray-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="py-3 px-4 max-w-[220px]">
                        {req.reason ? (
                          <div className="text-xs text-gray-500 dark:text-slate-400 italic line-clamp-2" title={req.reason}>"{req.reason}"</div>
                        ) : <span className="text-gray-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${s.pill} whitespace-nowrap`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {req.status}
                        </span>
                        {req.status !== 'Pending' && req.details?.approvedBy?.name && (
                          <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 flex items-center gap-0.5">
                            <UserIcon size={9} /> {req.details.approvedBy.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === 'Pending' && (
                            <>
                              <button
                                disabled={busy}
                                onClick={() => handleAction(req, 'approve')}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => handleAction(req, 'reject')}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedRequest(req)}
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
            totalItems={filteredRequests.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {selectedRequest && (
        <ApprovalDetailsModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}
    </main>
  );
};

export default Approvals;
