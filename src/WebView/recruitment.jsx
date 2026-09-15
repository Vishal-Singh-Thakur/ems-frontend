import React, { useEffect, useMemo, useState } from "react";
import { Briefcase, Plus, Search, Users2, MapPin, TrendingUp, Filter, Lock, Unlock, PauseCircle } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { GetAllJobPostingsAPI, CreateJobPostingAPI, UpdateJobStatusAPI } from "../components/Constant/Api/Api";
import AddJobModal from "../components/HrEmployee/AddJobModal";

const STATUS_STYLE = {
  Open: {
    pill: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
    bar: "from-emerald-500 to-teal-500",
    dot: "bg-emerald-500"
  },
  Closed: {
    pill: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30",
    bar: "from-red-500 to-rose-500",
    dot: "bg-red-500"
  },
  "On Hold": {
    pill: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
    bar: "from-amber-500 to-orange-500",
    dot: "bg-amber-500"
  }
};

const DEPT_COLORS = ["from-blue-500 to-indigo-600", "from-purple-500 to-fuchsia-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600", "from-pink-500 to-rose-600"];

const Recruitment = ({ user }) => {
  const role = (user?.roleId?.name || user?.role || '').toLowerCase();
  const canManage = role === 'hr' || role === 'superadmin';

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await ApiHit(GetAllJobPostingsAPI, "GET");
      if (r?.success) setJobs(r.data?.docs || r.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        (j.jobTitle || j.title || "").toLowerCase().includes(q) ||
        (j.department || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || j.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const openCt = jobs.filter((j) => j.status === "Open").length;
    const applicants = jobs.reduce((s, j) => s + (j.applicants?.length || 0), 0);
    const openings = jobs.filter((j) => j.status === "Open").reduce((s, j) => s + (j.openings || 0), 0);
    return { total, open: openCt, applicants, openings };
  }, [jobs]);

  const changeStatus = async (job, newStatus) => {
    if (!canManage) return;
    if (!window.confirm(`Change status of "${job.jobTitle || job.title}" to ${newStatus}?`)) return;
    setBusyId(job._id);
    try {
      const r = await ApiHit(UpdateJobStatusAPI(job._id), "PATCH", { status: newStatus });
      if (r?.success) fetchAll();
      else alert(r?.message || 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Briefcase className="text-blue-600 dark:text-blue-400" /> Recruitment
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {canManage ? 'Post positions and manage applicants.' : 'View-only. Only HR or Superadmin can open/close positions.'}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg shadow font-medium"
          >
            <Plus size={18} /> Add Job
          </button>
        )}
      </div>

      {/* Stats — click to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Jobs',     value: stats.total,      color: 'from-blue-500 to-indigo-600',    icon: <Briefcase size={18} />,  filter: 'all' },
          { label: 'Open Positions', value: stats.open,       color: 'from-emerald-500 to-teal-600',   icon: <TrendingUp size={18} />, filter: 'Open' },
          { label: 'Total Openings', value: stats.openings,   color: 'from-amber-500 to-orange-600',   icon: <MapPin size={18} />,     filter: null },
          { label: 'Applicants',     value: stats.applicants, color: 'from-purple-500 to-fuchsia-600', icon: <Users2 size={18} />,     filter: null }
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
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-lg">{s.icon}</div>
              </div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">{s.value}</div>
              <div className="text-xs opacity-90">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search title or department…"
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
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <Briefcase size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">No jobs match your filters</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((job, i) => {
            const s = STATUS_STYLE[job.status] || STATUS_STYLE.Open;
            const deptColor = DEPT_COLORS[i % DEPT_COLORS.length];
            const appCount = job.applicants?.length || 0;
            const pct = job.openings ? Math.min(100, Math.round((appCount / (job.openings * 10)) * 100)) : 0;
            const title = job.jobTitle || job.title;
            const isBusy = busyId === job._id;
            return (
              <div key={job._id || i} className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                <div className={`bg-gradient-to-r ${deptColor} p-4 text-white`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase tracking-wider opacity-80">{job.department}</div>
                      <h3 className="text-lg font-bold mt-0.5 truncate">{title}</h3>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${s.pill} flex items-center gap-1 flex-shrink-0`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {job.status}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <MapPin size={14} />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 dark:text-slate-400 uppercase tracking-wider">Openings</div>
                        <div className="text-sm font-semibold text-gray-800 dark:text-slate-100">{job.openings || 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Users2 size={14} />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 dark:text-slate-400 uppercase tracking-wider">Applicants</div>
                        <div className="text-sm font-semibold text-gray-800 dark:text-slate-100">{appCount}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto mb-4">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 mb-1">
                      <span>Applicant pool</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${s.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {/* Status toggle — HR / Superadmin only */}
                  {canManage ? (
                    <div className="flex items-center gap-2">
                      {job.status !== 'Open' && (
                        <button
                          disabled={isBusy}
                          onClick={() => changeStatus(job, 'Open')}
                          className="flex-1 flex items-center justify-center gap-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 py-2 rounded-lg border border-emerald-200 dark:border-emerald-500/30 transition disabled:opacity-50"
                        >
                          <Unlock size={12} /> Open
                        </button>
                      )}
                      {job.status !== 'Closed' && (
                        <button
                          disabled={isBusy}
                          onClick={() => changeStatus(job, 'Closed')}
                          className="flex-1 flex items-center justify-center gap-1 text-xs font-medium bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/15 text-red-700 dark:text-red-300 py-2 rounded-lg border border-red-200 dark:border-red-500/30 transition disabled:opacity-50"
                        >
                          <Lock size={12} /> Close
                        </button>
                      )}
                      {job.status !== 'On Hold' && (
                        <button
                          disabled={isBusy}
                          onClick={() => changeStatus(job, 'On Hold')}
                          className="flex-1 flex items-center justify-center gap-1 text-xs font-medium bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/15 text-amber-700 dark:text-amber-300 py-2 rounded-lg border border-amber-200 dark:border-amber-500/30 transition disabled:opacity-50"
                        >
                          <PauseCircle size={12} /> Hold
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400 dark:text-slate-500 text-center italic">Only HR / Superadmin can change status</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canManage && (
        <AddJobModal
          open={open}
          setOpen={setOpen}
          jobs={jobs}
          setJobs={setJobs}
          apiCreate={async (payload) => {
            const r = await ApiHit(CreateJobPostingAPI, "POST", payload);
            if (r?.success) fetchAll();
            return r;
          }}
        />
      )}
    </main>
  );
};

export default Recruitment;
