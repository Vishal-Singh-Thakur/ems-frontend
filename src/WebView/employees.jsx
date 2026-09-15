import React, { useEffect, useMemo, useState } from "react";
import {
  Users, Search, Filter, Pencil, Trash2, Building2, Briefcase,
  Mail, IdCard, CheckCircle2, XCircle, RefreshCcw
} from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { GetAllEmployeesAPI, DeleteEmployeeAPI } from "../components/Constant/Api/Api";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

const DEPARTMENTS = ["IT", "HR", "Sales", "Finance", "Engineering", "Marketing", "Operations"];

const DEPT_COLOR = {
  IT:          'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
  HR:          'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
  Sales:       'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  Finance:     'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
  Engineering: 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',
  Marketing:   'bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-500/30',
  Operations:  'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
};

const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const Employees = () => {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeList, setEmployeeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await ApiHit(GetAllEmployeesAPI, "GET");
      if (res?.success) {
        const docs = res.data?.docs || res.data || [];
        setEmployeeList(docs);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete employee "${name}"?`)) return;
    setBusyId(id);
    try {
      const res = await ApiHit(DeleteEmployeeAPI(id), "DELETE");
      if (res?.success) fetchEmployees();
      else alert(res?.message || "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employeeList.filter((emp) => {
      const name = emp.userId?.name || "";
      const email = emp.userId?.email || "";
      const empId = emp.employeeId || "";
      const matchSearch = !q ||
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        empId.toLowerCase().includes(q);
      const matchDept = departmentFilter === "all" || emp.department === departmentFilter;
      const matchStatus = statusFilter === "all" || emp.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employeeList, search, departmentFilter, statusFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, departmentFilter, statusFilter]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const stats = useMemo(() => {
    const total = employeeList.length;
    const active = employeeList.filter((e) => e.status === 'active').length;
    const inactive = employeeList.filter((e) => e.status !== 'active').length;
    const depts = new Set(employeeList.map((e) => e.department).filter(Boolean)).size;
    return { total, active, inactive, depts };
  }, [employeeList]);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="text-blue-600 dark:text-blue-400" /> Employees
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Manage employee records, roles and departments.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEmployees}
            className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats — click to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Employees', value: stats.total,    color: 'from-blue-500 to-indigo-600',    icon: <Users size={18} />,        filter: 'all' },
          { label: 'Active',          value: stats.active,   color: 'from-emerald-500 to-teal-600',   icon: <CheckCircle2 size={18} />, filter: 'active' },
          { label: 'Inactive',        value: stats.inactive, color: 'from-red-500 to-rose-600',       icon: <XCircle size={18} />,      filter: 'inactive' },
          { label: 'Departments',     value: stats.depts,    color: 'from-purple-500 to-fuchsia-600', icon: <Building2 size={18} />,    filter: null }
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
            placeholder="Search by name, email or employee ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400 dark:text-slate-500" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
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
          <Users size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {employeeList.length === 0 ? 'No employees yet' : 'No employees match your filters'}
          </div>
          {employeeList.length === 0 && (
            <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Click "Add Employee" to create the first record.</div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40">
            <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <Users size={16} className="text-blue-600 dark:text-blue-400" /> Employee List
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white dark:bg-slate-800 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((emp, idx) => {
                  const i = (currentPage - 1) * PAGE_SIZE + idx;
                  const deptCls = DEPT_COLOR[emp.department] || 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700';
                  const busy = busyId === emp._id;
                  return (
                    <tr key={emp._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700">
                          <IdCard size={11} /> {emp.employeeId || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                            {initials(emp.userId?.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-800 dark:text-slate-100 truncate">{emp.userId?.name || '—'}</div>
                            <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate flex items-center gap-1">
                              <Mail size={10} /> {emp.userId?.email || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${deptCls} whitespace-nowrap`}>
                          <Building2 size={11} /> {emp.department || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-gray-700 dark:text-slate-200 text-sm">
                          <Briefcase size={12} className="text-gray-400 dark:text-slate-500" /> {emp.designation || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${
                          emp.status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30'
                        } whitespace-nowrap capitalize`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {emp.status || 'inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled
                            title="Edit (coming soon)"
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => handleDelete(emp._id, emp.userId?.name)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
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

    </main>
  );
};

export default Employees;
