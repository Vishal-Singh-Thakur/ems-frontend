import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ListChecks, Plus, Search, Filter, Trash2, Pencil, Calendar, User as UserIcon, Flag } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { GetAllTasksAPI, DeleteTaskAPI } from "../components/Constant/Api/Api";
import AddTaskModal from "../components/Manager/AddTaskModal";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

const PRIORITY_STYLE = {
  High:   { pill: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30', dot: 'bg-red-500' },
  Medium: { pill: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30', dot: 'bg-amber-500' },
  Low:    { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' }
};

const STATUS_STYLE = {
  Pending:       { pill: 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700', accent: 'border-l-gray-400' },
  'In Progress': { pill: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30', accent: 'border-l-blue-500' },
  Completed:     { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', accent: 'border-l-emerald-500' },
  Cancelled:     { pill: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30', accent: 'border-l-red-500' }
};

const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const isOverdue = (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';

const TaskManagement = ({ user }) => {
  const role = (user?.roleId?.name || user?.role || 'employee').toLowerCase();
  const isAdminView = role === 'admin' || role === 'superadmin' || role === 'hr';
  const canManage = role === 'manager'; // Only managers create/edit/delete tasks

  const [searchParams] = useSearchParams();
  const preFillName = searchParams.get('name') || '';

  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [search, setSearch] = useState(preFillName);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const r = await ApiHit(GetAllTasksAPI, "GET");
      if (r?.success) {
        const list = Array.isArray(r.data?.docs) ? r.data.docs : (Array.isArray(r.data) ? r.data : []);
        setTasks(list);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setBusyId(task._id);
    try {
      const r = await ApiHit(DeleteTaskAPI(task._id), "DELETE");
      if (r?.success) fetchTasks();
      else alert(r?.message || "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (t.title || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.assignedTo?.name || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchPri = priorityFilter === "all" || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPri;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, priorityFilter]);

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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <ListChecks className="text-blue-600 dark:text-blue-400" /> Task Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {isAdminView
              ? 'View tasks assigned across the organization — who assigned what to whom.'
              : 'Create, assign, and track tasks for your team.'}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => { setSelectedTask(null); setOpen(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg shadow font-medium"
          >
            <Plus size={18} /> Add Task
          </button>
        )}
      </div>

      {/* Stats — click to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',       value: stats.total,      color: 'from-blue-500 to-indigo-600',  icon: <ListChecks size={16} />, filter: 'all' },
          { label: 'Pending',     value: stats.pending,    color: 'from-gray-500 to-slate-600',   icon: <Flag size={16} />,       filter: 'Pending' },
          { label: 'In Progress', value: stats.inProgress, color: 'from-cyan-500 to-blue-600',    icon: <Flag size={16} />,       filter: 'In Progress' },
          { label: 'Completed',   value: stats.completed,  color: 'from-emerald-500 to-teal-600', icon: <Flag size={16} />,       filter: 'Completed' },
          { label: 'Overdue',     value: stats.overdue,    color: 'from-red-500 to-rose-600',     icon: <Flag size={16} />,       filter: null }
        ].map((s, i) => {
          const clickable = s.filter !== null;
          const active = clickable && statusFilter === s.filter;
          return (
            <button
              key={i}
              onClick={() => clickable && setStatusFilter(s.filter)}
              disabled={!clickable}
              className={`text-left bg-gradient-to-br ${s.color} rounded-2xl p-3 text-white shadow transition ${clickable ? 'transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-slate-900/50 cursor-pointer' : 'cursor-default'} ${active ? 'ring-2 ring-white dark:ring-slate-800 ring-offset-2 ring-offset-gray-50' : ''}`}
            >
              <div className="p-1.5 bg-white/20 dark:bg-slate-900/20 rounded-lg inline-block mb-1">{s.icon}</div>
              <div className="text-xl font-bold leading-tight">{s.value}</div>
              <div className="text-[10px] opacity-90">{s.label}</div>
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
            placeholder="Search title, description or assignee…"
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
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <ListChecks size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">No tasks match your filters</div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/40 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Title</th>
                  {isAdminView && <th className="py-3 px-4">Assigned By</th>}
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Description</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginated.map((task, idx) => {
                  const i = (currentPage - 1) * PAGE_SIZE + idx;
                  const p = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium;
                  const st = STATUS_STYLE[task.status] || STATUS_STYLE.Pending;
                  const overdue = isOverdue(task);
                  const busy = busyId === task._id;
                  return (
                    <tr key={task._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800 dark:text-slate-100 break-words">{task.title}</div>
                      </td>
                      {isAdminView && (
                        <td className="py-3 px-4">
                          {task.assignedBy?.name ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                {initials(task.assignedBy.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-gray-700 dark:text-slate-200 truncate">{task.assignedBy.name}</div>
                                <div className="text-[10px] text-gray-500 dark:text-slate-400 capitalize truncate">{task.assignedBy.roleId?.name || 'manager'}</div>
                              </div>
                            </div>
                          ) : <span className="text-gray-400 dark:text-slate-500">—</span>}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        {task.assignedTo?.name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {initials(task.assignedTo.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-gray-700 dark:text-slate-200 truncate">{task.assignedTo.name}</div>
                              {isAdminView && (
                                <div className="text-[10px] text-gray-500 dark:text-slate-400 capitalize truncate">{task.assignedTo.roleId?.name || 'employee'}</div>
                              )}
                            </div>
                          </div>
                        ) : <span className="text-gray-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${p.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${st.pill}`}>{task.status}</span>
                      </td>
                      <td className="py-3 px-4">
                        {task.dueDate ? (
                          <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-slate-300'}`}>
                            <Calendar size={11} />
                            {fmtDate(task.dueDate)}
                            {overdue && <span className="text-[9px] font-bold uppercase ml-1">Overdue</span>}
                          </div>
                        ) : <span className="text-gray-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2 break-words">{task.description || '—'}</div>
                      </td>
                      {canManage && (
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setSelectedTask(task); setOpen(true); }}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => handleDelete(task)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
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
        open={open}
        setOpen={setOpen}
        task={selectedTask}
        onSuccess={fetchTasks}
      />
    </main>
  );
};

export default TaskManagement;
