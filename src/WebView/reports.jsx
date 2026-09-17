import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Search, RotateCcw, Download, Calendar, Users, ClipboardList, Clock, IdCard } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { GetAllLeavesAPI, GetAttendanceReportsAPI, GetAllEmployeesAPI, GetAllUsersAPI, GetMyTeamAPI } from "../components/Constant/Api/Api";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

const REPORT_TYPES = [
  { key: "Attendance", label: "Attendance", icon: <Clock size={14} /> },
  { key: "Leaves", label: "Leaves", icon: <Calendar size={14} /> },
  { key: "Employees", label: "Employees", icon: <Users size={14} /> }
];

const STATUS_PILL = {
  Present:   'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  Absent:    'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',
  Leave:     'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
  'Half Day':'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
  Approved:  'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  Pending:   'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
  Rejected:  'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30'
};

const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null;

// Extract department name from any of the record shapes
const getDept = (r) =>
  r?.employee?.departmentId?.name ||
  r?.userId?.departmentId?.name ||
  r?.employee?.department ||
  r?.department ||
  null;

// Employee record helpers (backend returns Employee with populated userId)
const empName    = (r) => r?.userId?.name || r?.name || '—';
const empEmail   = (r) => r?.userId?.email || '';
const empRole    = (r) => r?.userId?.roleId?.name || r?.role?.name || null;
const empDeptName = (r) =>
  r?.userId?.departmentId?.name ||
  r?.department ||
  null;
const empEmpId   = (r) => r?.employeeId || r?.userId?.employeeId || null;
const attEmpId   = (r) => r?.employee?.employeeId || null;

const EmpIdPill = ({ value }) => (
  value ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 whitespace-nowrap">
      <IdCard size={11} /> {value}
    </span>
  ) : <span className="text-[11px] text-gray-400 dark:text-slate-500">—</span>
);

function exportCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")]
    .concat(
      rows.map((r) =>
        headers
          .map((h) => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`)
          .join(",")
      )
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const StatusPill = ({ value }) => {
  const cls = STATUS_PILL[value] || 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700';
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-full border ${cls} whitespace-nowrap`}>
      {value || '—'}
    </span>
  );
};

const Reports = ({ user }) => {
  const role = (user?.roleId?.name || user?.role || 'employee').toLowerCase();
  const callerId = user?._id;

  const [activeReport, setActiveReport] = useState("Attendance");
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [activeReport]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [employeesData, setEmployeesData] = useState([]);
  const [scopeIds, setScopeIds] = useState([]);
  const [scopeReady, setScopeReady] = useState(false);
  const [isUnscoped, setIsUnscoped] = useState(false); // true only for superadmin

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [department, setDepartment] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setIsLoading(true);
        setScopeReady(false);

        // Determine scope of user IDs per role.
        //   manager    → own team members (via GetMyTeamAPI)
        //   admin      → managers under this admin (fetch all users, filter by role=manager)
        //   hr         → managers + employees
        //   superadmin → everyone (no scoping)
        let ids = [];
        let unscoped = false;
        if (role === 'manager') {
          const t = await ApiHit(GetMyTeamAPI);
          ids = (t?.data || []).map((m) => String(m.userId?._id || m.userId)).filter(Boolean);
        } else if (role === 'admin') {
          const u = await ApiHit(GetAllUsersAPI);
          const list = u?.data?.docs || u?.data || [];
          ids = list
            .filter((x) => (x.roleId?.name || '').toLowerCase() === 'manager')
            .map((x) => String(x._id));
        } else if (role === 'hr') {
          const u = await ApiHit(GetAllUsersAPI);
          const list = u?.data?.docs || u?.data || [];
          ids = list
            .filter((x) => ['manager', 'employee'].includes((x.roleId?.name || '').toLowerCase()))
            .map((x) => String(x._id));
        } else if (role === 'superadmin') {
          unscoped = true;
        }

        setScopeIds(ids);
        setIsUnscoped(unscoped);
        setScopeReady(true);

        const [attendanceRes, leavesRes, employeesRes] = await Promise.all([
          ApiHit(GetAttendanceReportsAPI),
          ApiHit(GetAllLeavesAPI),
          ApiHit(GetAllEmployeesAPI),
        ]);

        const allAttendance = attendanceRes?.data || [];
        const allLeaves = leavesRes?.data?.docs || leavesRes?.data || [];
        const allEmployees = employeesRes?.profile?.data?.docs || employeesRes?.data?.docs || employeesRes?.data || [];

        if (unscoped) {
          setAttendanceData(allAttendance);
          setLeavesData(allLeaves);
          setEmployeesData(allEmployees);
        } else {
          const setIds = new Set(ids);
          setAttendanceData(allAttendance.filter((r) => setIds.has(String(r.employee?._id))));
          setLeavesData(allLeaves.filter((l) => setIds.has(String(l.employee?._id))));
          setEmployeesData(allEmployees.filter((e) => setIds.has(String(e.userId?._id || e.userId || e._id))));
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, callerId]);

  const departments = useMemo(() => {
    const all = [
      ...attendanceData.map((d) => getDept(d)),
      ...employeesData.map((d) => empDeptName(d)),
    ].filter(Boolean);
    // Dedup case-insensitively
    const seen = new Set();
    const unique = [];
    for (const name of all) {
      const k = name.toLowerCase();
      if (!seen.has(k)) { seen.add(k); unique.push(name); }
    }
    return ["all", ...unique];
  }, [attendanceData, employeesData]);

  const filteredAttendance = useMemo(() => {
    return attendanceData.filter((row) => {
      const date = row.date?.slice(0, 10);
      if (department !== "all" && getDept(row) !== department) return false;
      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          row.employee?.name?.toLowerCase().includes(s) ||
          row.status?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [attendanceData, fromDate, toDate, department, search]);

  const filteredLeaves = useMemo(() => {
    return leavesData.filter((row) => {
      if (search) {
        const s = search.toLowerCase();
        return (
          row.employee?.name?.toLowerCase().includes(s) ||
          row.leaveType?.toLowerCase().includes(s) ||
          row.status?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [leavesData, search]);

  const filteredEmployees = useMemo(() => {
    return employeesData.filter((row) => {
      if (department !== "all") {
        const d = empDeptName(row) || '';
        if (d.toLowerCase() !== department.toLowerCase()) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        return (
          empName(row).toLowerCase().includes(s) ||
          (empRole(row) || '').toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [employeesData, department, search]);

  const activeList = activeReport === "Attendance" ? filteredAttendance
                   : activeReport === "Leaves"     ? filteredLeaves
                   : filteredEmployees;

  const pagedActive = useMemo(
    () => activeList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [activeList, currentPage]
  );

  useEffect(() => { setCurrentPage(1); }, [search, department]);

  const stats = useMemo(() => ({
    members: isUnscoped ? employeesData.length : scopeIds.length,
    attendance: attendanceData.length,
    leaves: leavesData.length,
    pendingLeaves: leavesData.filter((l) => l.status === 'Pending').length
  }), [isUnscoped, scopeIds, employeesData, attendanceData, leavesData]);

  const handleExport = () => {
    if (activeReport === "Attendance") exportCSV("attendance.csv", filteredAttendance);
    else if (activeReport === "Leaves") exportCSV("leaves.csv", filteredLeaves);
    else exportCSV("employees.csv", filteredEmployees);
  };

  const handleReset = () => {
    setFromDate(""); setToDate(""); setDepartment("all"); setSearch("");
  };

  const currentRows =
    activeReport === "Attendance" ? filteredAttendance :
    activeReport === "Leaves" ? filteredLeaves :
    filteredEmployees;

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="text-blue-600 dark:text-blue-400" /> Manager Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Team-wide attendance, leaves & employee snapshots.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats — click to switch report tab */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Team Members',       value: stats.members,       color: 'from-blue-500 to-indigo-600',    icon: <Users size={18} />,         target: 'Employees' },
          { label: 'Attendance Records', value: stats.attendance,    color: 'from-emerald-500 to-teal-600',   icon: <Clock size={18} />,         target: 'Attendance' },
          { label: 'Total Leaves',       value: stats.leaves,        color: 'from-purple-500 to-fuchsia-600', icon: <Calendar size={18} />,      target: 'Leaves' },
          { label: 'Pending Leaves',     value: stats.pendingLeaves, color: 'from-amber-500 to-orange-600',   icon: <ClipboardList size={18} />, target: 'Leaves' }
        ].map((s, i) => {
          const active = activeReport === s.target;
          return (
            <button
              key={i}
              onClick={() => setActiveReport(s.target)}
              className={`text-left bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow transition transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-slate-900/50 ${active ? 'ring-2 ring-white dark:ring-slate-800 ring-offset-2 ring-offset-gray-50' : ''}`}
            >
              <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-lg inline-block mb-2">{s.icon}</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">{s.value}</div>
              <div className="text-xs opacity-90">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-4">
        <div className="flex gap-2 flex-wrap">
          {REPORT_TYPES.map((r) => (
            <button
              key={r.key}
              onClick={() => setActiveReport(r.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeReport === r.key
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                  : 'bg-gray-50 dark:bg-slate-900/40 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
              }`}
            >
              {r.icon} {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">To</label>
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {departments.map((d) => (
            <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
          ))}
        </select>
      </div>

      {/* Empty */}
      {!isLoading && scopeReady && !isUnscoped && scopeIds.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <Users size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {role === 'manager' ? 'No team members found' : `No ${role === 'admin' ? 'managers' : 'subordinates'} under you`}
          </div>
          <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            {role === 'manager' ? 'Please add members to your team first.' : 'Nothing to report yet.'}
          </div>
        </div>
      ) : isLoading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : currentRows.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <BarChart3 size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">No records match your filters</div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {activeReport === "Attendance" && (
                <>
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-900/40 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                      <th className="py-3 px-4">Employee ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">In</th>
                      <th className="py-3 px-4">Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedActive.map((r) => (
                      <tr key={r._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                        <td className="py-3 px-4"><EmpIdPill value={attEmpId(r)} /></td>
                        <td className="py-3 px-4 text-gray-700 dark:text-slate-200 whitespace-nowrap">{fmtDate(r.date)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {initials(r.employee?.name)}
                            </div>
                            <span className="font-medium text-gray-800 dark:text-slate-100 truncate">{r.employee?.name || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-slate-300">{getDept(r) || <span className="text-gray-400 dark:text-slate-500">N/A</span>}</td>
                        <td className="py-3 px-4"><StatusPill value={r.status} /></td>
                        <td className="py-3 px-4 text-gray-600 dark:text-slate-300">{fmtTime(r.checkIn) || <span className="text-gray-400 dark:text-slate-500">—</span>}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-slate-300">{fmtTime(r.checkOut) || <span className="text-gray-400 dark:text-slate-500">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeReport === "Leaves" && (
                <>
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-900/40 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                      <th className="py-3 px-4">Employee ID</th>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">From</th>
                      <th className="py-3 px-4">To</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedActive.map((r) => (
                      <tr key={r._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                        <td className="py-3 px-4"><EmpIdPill value={attEmpId(r)} /></td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {initials(r.employee?.name)}
                            </div>
                            <span className="font-medium text-gray-800 dark:text-slate-100 truncate">{r.employee?.name || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-slate-200">{r.leaveType}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">{fmtDate(r.fromDate)}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-slate-300 whitespace-nowrap">{fmtDate(r.toDate)}</td>
                        <td className="py-3 px-4"><StatusPill value={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeReport === "Employees" && (
                <>
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-900/40 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                      <th className="py-3 px-4">Employee ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedActive.map((r) => {
                      const name = empName(r);
                      const email = empEmail(r);
                      const dept = empDeptName(r);
                      const roleName = empRole(r);
                      return (
                        <tr key={r._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                          <td className="py-3 px-4"><EmpIdPill value={empEmpId(r)} /></td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                {initials(name)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-800 dark:text-slate-100 truncate">{name}</div>
                                {email && <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{email}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-slate-300">{dept || <span className="text-gray-400 dark:text-slate-500">N/A</span>}</td>
                          <td className="py-3 px-4">
                            {roleName ? (
                              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 capitalize">
                                {roleName}
                              </span>
                            ) : <span className="text-gray-400 dark:text-slate-500 text-xs">N/A</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </>
              )}
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={activeList.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </main>
  );
};

export default Reports;
