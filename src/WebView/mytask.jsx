import React, { useEffect, useMemo, useState } from "react";
import {
  ListChecks, Search, Filter, Calendar, CheckCircle2, Clock3, AlertTriangle, RefreshCcw, Pencil
} from "lucide-react";
import { GetMyTasksAPI } from "../components/Constant/Api/Api";
import ApiHit from "../Utils/ApiHit";
import AddTaskModal from "../components/Manager/AddTaskModal";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

const PRIORITY_STYLE = {
  High:   { pill: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',       dot: 'bg-red-500' },
  Medium: { pill: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30', dot: 'bg-amber-500' },
  Low:    { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' }
};
const STATUS_STYLE = {
  Pending:       { pill: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',       dot: 'bg-amber-500' },
  'In Progress': { pill: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',          dot: 'bg-blue-500' },
  Completed:     { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' }
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const isOverdue = (t) => t.dueDate && t.status !== 'Completed' && new Date(t.dueDate).getTime() < Date.now();

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await ApiHit(GetMyTasksAPI);
      if (r?.success) setTasks(r.data || []);
      else setError(r?.message || 'Failed to fetch tasks');
    } catch (e) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyTasks(); }, []);

  const openEditModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const fromTs = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const toTs = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

    return tasks.filter((t) => {
      const matchSearch = !q ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;

      let matchDate = true;
      if (fromTs != null || toTs != null) {
        const due = t.dueDate ? new Date(t.dueDate).getTime() : null;
        if (fromTs != null && due != null && due < fromTs) matchDate = false;
        if (toTs != null && due != null && due > toTs) matchDate = false;
        if (due == null) matchDate = false;
      }
      return matchSearch && matchStatus && matchPriority && matchDate;
    });
  }, [tasks, search, statusFilter, priorityFilter, fromDate, toDate]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, priorityFilter, fromDate, toDate]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'Pending').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    completed: tasks.filter((t) => t.status === 'Completed').length,
    overdue: tasks.filter(isOverdue).length
  }), [tasks]);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <ListChecks className="text-blue-600 dark:text-blue-400" /> My Tasks
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Tasks assigned to you — update status as you make progress.</p>
        </div>
        <button
          onClick={fetchMyTasks}
          className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* Stats — click to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total',       value: stats.total,      color: 'from-blue-500 to-indigo-600',  icon: <ListChecks size={18} />,     filter: 'all' },
          { label: 'Pending',     value: stats.pending,    color: 'from-amber-500 to-orange-600', icon: <Clock3 size={18} />,         filter: 'Pending' },
          { label: 'In Progress', value: stats.inProgress, color: 'from-cyan-500 to-blue-600',    icon: <RefreshCcw size={18} />,     filter: 'In Progress' },
          { label: 'Completed',   value: stats.completed,  color: 'from-emerald-500 to-teal-600', icon: <CheckCircle2 size={18} />,   filter: 'Completed' },
          { label: 'Overdue',     value: stats.overdue,    color: 'from-red-500 to-rose-600',     icon: <AlertTriangle size={18} />,  filter: null }
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
              placeholder="Search title or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400 dark:text-slate-500" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Date range filter (by due date) */}
        <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-medium">
            <Calendar size={14} className="text-blue-600 dark:text-blue-400" /> Due date:
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
          {(fromDate || toDate || search || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); }}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline ml-auto font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-3 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <ListChecks size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {tasks.length === 0 ? 'No tasks assigned yet' : 'No tasks match your filters'}
          </div>
          {tasks.length === 0 && <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Tasks assigned to you will appear here.</div>}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/40 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((task, idx) => {
                  const i = (currentPage - 1) * PAGE_SIZE + idx;
                  const p = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium;
                  const s = STATUS_STYLE[task.status] || STATUS_STYLE.Pending;
                  const overdue = isOverdue(task);
                  return (
                    <tr key={task._id || i} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800 dark:text-slate-100">{task.title}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2">{task.description || '—'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${p.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${s.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {task.dueDate ? (
                          <div className={`flex items-center gap-1 text-xs whitespace-nowrap ${overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-slate-300'}`}>
                            <Calendar size={11} />
                            {fmtDate(task.dueDate)}
                            {overdue && <span className="text-[9px] font-bold uppercase ml-1">Overdue</span>}
                          </div>
                        ) : <span className="text-gray-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition"
                            title="Update status"
                          >
                            <Pencil size={16} />
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

      <AddTaskModal
        open={isModalOpen}
        setOpen={setIsModalOpen}
        onSuccess={() => { fetchMyTasks(); setSelectedTask(null); }}
        task={selectedTask}
        isEmployeeMode={true}
      />
    </main>
  );
};

export default MyTasks;
