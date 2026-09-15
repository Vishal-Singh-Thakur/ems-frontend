import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Search, Award, Clock, Calendar, CheckCircle2, AlertTriangle, Trophy } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { PerformanceTeamAPI } from "../components/Constant/Api/Api";

const GRADE_STYLE = {
  A: { bg: 'from-emerald-500 to-teal-600', text: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15' },
  B: { bg: 'from-blue-500 to-indigo-600',   text: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/15' },
  C: { bg: 'from-amber-500 to-orange-600',  text: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15' },
  D: { bg: 'from-orange-500 to-red-500',    text: 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-500/15' },
  E: { bg: 'from-red-500 to-rose-600',      text: 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/15' }
};

const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const barColor = (n) => n >= 85 ? 'from-emerald-500 to-teal-500' : n >= 70 ? 'from-blue-500 to-indigo-500' : n >= 55 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-500';

const MetricRow = ({ icon, label, value, pct }) => (
  <div className="flex items-center gap-2 text-xs">
    <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-gray-600 dark:text-slate-300">{label}</span>
        <span className="font-semibold text-gray-800 dark:text-slate-100">{value}</span>
      </div>
      {typeof pct === 'number' && (
        <div className="h-1 bg-gray-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${barColor(pct)}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  </div>
);

const Performance = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ members: [], scope: '' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const r = await ApiHit(PerformanceTeamAPI, "GET");
        if (r?.success) setData(r.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return (data.members || []).filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.designation || '').toLowerCase().includes(q);
      const matchGrade = gradeFilter === 'all' || m.grade === gradeFilter;
      return matchSearch && matchGrade;
    });
  }, [data.members, search, gradeFilter]);

  const stats = useMemo(() => {
    const members = data.members || [];
    if (members.length === 0) return { count: 0, avg: 0, topScorer: null };
    const avg = Math.round(members.reduce((s, m) => s + m.overallScore, 0) / members.length);
    return { count: members.length, avg, topScorer: members[0] };
  }, [data.members]);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="text-blue-600 dark:text-blue-400" /> Performance
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {data.scope === 'manager'    && 'Your team members\' performance — tasks, on-time delivery, attendance (last 30 days).'}
          {data.scope === 'admin'      && 'All team leads (Managers & HR) performance — tasks, on-time delivery, attendance (last 30 days).'}
          {data.scope === 'hr'         && 'Managers & employees performance — tasks, on-time delivery, attendance (last 30 days).'}
          {data.scope === 'superadmin' && 'Organization-wide performance — tasks, on-time delivery, attendance (last 30 days).'}
          {!data.scope                 && 'Performance overview — tasks, on-time delivery, attendance (last 30 days).'}
        </p>
      </div>

      {/* Stats — click to explore */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => navigate('/employees')}
          className="text-left bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow transition transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-slate-900/50"
        >
          <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-lg inline-block mb-2"><Award size={18} /></div>
          <div className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">{stats.count}</div>
          <div className="text-xs opacity-90">Team Members Tracked</div>
        </button>
        <button
          onClick={() => navigate('/reports')}
          className="text-left bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow transition transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-slate-900/50"
        >
          <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-lg inline-block mb-2"><TrendingUp size={18} /></div>
          <div className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">{stats.avg}%</div>
          <div className="text-xs opacity-90">Average Score</div>
        </button>
        <button
          onClick={() => stats.topScorer && setSearch(stats.topScorer.name)}
          disabled={!stats.topScorer}
          className={`text-left bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow transition ${stats.topScorer ? 'transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-slate-900/50 cursor-pointer' : 'cursor-default'}`}
        >
          <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-lg inline-block mb-2"><Trophy size={18} /></div>
          <div className="text-2xl font-bold leading-tight truncate">{stats.topScorer?.name || '—'}</div>
          <div className="text-xs opacity-90">Top Performer{stats.topScorer ? ` • ${stats.topScorer.overallScore}%` : ''}</div>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search name, email or designation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Grades</option>
          <option value="A">A (Excellent)</option>
          <option value="B">B (Good)</option>
          <option value="C">C (Average)</option>
          <option value="D">D (Needs Work)</option>
          <option value="E">E (Poor)</option>
        </select>
      </div>

      {/* Members */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading performance…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <TrendingUp size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {data.members.length === 0 ? "No team members to track" : "No members match your filters"}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((m, idx) => {
            const gs = GRADE_STYLE[m.grade] || GRADE_STYLE.C;
            return (
              <div key={m._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition">
                {/* Header */}
                <div className={`bg-gradient-to-r ${gs.bg} p-4 text-white relative`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-white/20 dark:bg-slate-900/20 text-white flex items-center justify-center text-sm font-bold ring-2 ring-white/40 dark:ring-slate-900/40">
                        {initials(m.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-base font-bold truncate">{m.name}</div>
                        <div className="text-[11px] opacity-90 truncate">{m.designation || m.email}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold leading-none">{m.overallScore}%</div>
                      <div className="text-[10px] opacity-90 uppercase tracking-wider mt-1">Overall</div>
                    </div>
                  </div>
                  {idx === 0 && stats.count > 1 && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 dark:text-yellow-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <Trophy size={10} /> TOP
                    </div>
                  )}
                </div>

                {/* Grade + metrics */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${gs.text}`}>
                      Grade {m.grade}
                    </span>
                    {m.tasks.overdue > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 flex items-center gap-1">
                        <AlertTriangle size={10} /> {m.tasks.overdue} overdue
                      </span>
                    )}
                  </div>

                  <MetricRow
                    icon={<CheckCircle2 size={12} />}
                    label="Task Completion"
                    value={`${m.tasks.completed}/${m.tasks.total} (${m.tasks.completionRate}%)`}
                    pct={m.tasks.completionRate}
                  />
                  <MetricRow
                    icon={<Clock size={12} />}
                    label="On-Time Delivery"
                    value={`${m.tasks.onTime}/${m.tasks.completed || 0} (${m.tasks.onTimeRate}%)`}
                    pct={m.tasks.onTimeRate}
                  />
                  <MetricRow
                    icon={<Calendar size={12} />}
                    label="Attendance (30d)"
                    value={`${m.attendance.present} present • ${m.attendance.rate}%`}
                    pct={m.attendance.rate}
                  />
                  {m.leaves.count > 0 && (
                    <div className="text-[11px] text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-800">
                      Took {m.leaves.count} leave{m.leaves.count === 1 ? '' : 's'} ({m.leaves.days} day{m.leaves.days === 1 ? '' : 's'})
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default Performance;
