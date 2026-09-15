import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Search, Mail, IdCard, Building2, Briefcase, RefreshCcw,
  CheckCircle2, XCircle, ClipboardList
} from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { GetMyTeamAPI } from "../components/Constant/Api/Api";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

const initials = (n) => (n || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const MyTeam = ({ user }) => {
  const navigate = useNavigate();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const r = await ApiHit(GetMyTeamAPI, "GET");
      const list = (r?.data || []).map((m) => {
        const u = m.userId || {};
        return {
          _id: m._id || u._id,
          userId: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          employeeId: m.employeeId,
          department: m.department,
          designation: m.designation,
          joiningDate: m.joiningDate,
          isActive: u.isActive !== false
        };
      });
      setTeam(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeam(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return team.filter((m) => {
      const matchSearch = !q ||
        (m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.employeeId || '').toLowerCase().includes(q) ||
        (m.department || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' ? m.isActive : !m.isActive);
      return matchSearch && matchStatus;
    });
  }, [team, search, statusFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const stats = useMemo(() => ({
    total: team.length,
    active: team.filter((m) => m.isActive).length,
    inactive: team.filter((m) => !m.isActive).length,
    depts: new Set(team.map((m) => m.department).filter(Boolean)).size
  }), [team]);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="text-blue-600 dark:text-blue-400" /> My Team
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Your direct reports and their current status.</p>
        </div>
        <button
          onClick={fetchTeam}
          className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* Stats — click to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Members', value: stats.total,    color: 'from-blue-500 to-indigo-600',    icon: <Users size={18} />,        filter: 'all' },
          { label: 'Active',        value: stats.active,   color: 'from-emerald-500 to-teal-600',   icon: <CheckCircle2 size={18} />, filter: 'active' },
          { label: 'Inactive',      value: stats.inactive, color: 'from-red-500 to-rose-600',       icon: <XCircle size={18} />,      filter: 'inactive' },
          { label: 'Departments',   value: stats.depts,    color: 'from-purple-500 to-fuchsia-600', icon: <Building2 size={18} />,    filter: null }
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

      {/* Filter */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID or department…"
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

      {/* Team table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <Users size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {team.length === 0 ? 'No team members assigned yet' : 'No members match your filters'}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/40 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4 hidden md:table-cell">Department</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Designation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((m, idx) => {
                  const i = (currentPage - 1) * PAGE_SIZE + idx;
                  return (
                    <tr key={m._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700">
                          <IdCard size={11} /> {m.employeeId || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                            {initials(m.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-800 dark:text-slate-100 truncate">{m.name || '—'}</div>
                            <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate flex items-center gap-1">
                              <Mail size={10} /> {m.email || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-700 dark:text-slate-200">
                          <Building2 size={11} className="text-gray-400 dark:text-slate-500" /> {m.department || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-gray-700 dark:text-slate-200 text-sm">
                          <Briefcase size={12} className="text-gray-400 dark:text-slate-500" /> {m.designation || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border whitespace-nowrap ${
                          m.isActive
                            ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${m.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {m.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/task-management?assignTo=${m.userId}&name=${encodeURIComponent(m.name || '')}`)}
                            className="flex items-center gap-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/15 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                            title={`View tasks assigned to ${m.name || 'member'}`}
                          >
                            <ClipboardList size={12} /> Tasks
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

export default MyTeam;
