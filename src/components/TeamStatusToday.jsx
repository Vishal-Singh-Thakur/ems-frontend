import React, { useState } from "react";
import {
  UserCheck, Home, CalendarDays, Clock, XCircle, HelpCircle, Search
} from "lucide-react";

const STATUS_STYLE = {
  Present:          { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
  Absent:           { pill: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',             dot: 'bg-red-500' },
  Late:             { pill: 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',    dot: 'bg-orange-500' },
  'Work From Home': { pill: 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',          dot: 'bg-cyan-500' },
  'On Leave':       { pill: 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',    dot: 'bg-purple-500' },
  'Not Marked':     { pill: 'bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700',          dot: 'bg-gray-400' }
};

const fmtTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const initials = (n) => (n || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const TeamStatusToday = ({
  list = [],
  counts = { present: 0, absent: 0, wfh: 0, onLeave: 0, late: 0, notMarked: 0 },
  title = "Team Status — Today",
  subtitle,
  showRole = false,
  actionLink,
  onAction
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = list.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
    const matchStatus = filter === 'all' || m.status === filter;
    return matchSearch && matchStatus;
  });

  if (list.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-slate-800 mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <UserCheck size={16} className="text-blue-600 dark:text-blue-400" /> {title}
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            {subtitle || `Live status of ${list.length} member${list.length === 1 ? '' : 's'}.`}
          </p>
        </div>
        {actionLink && (
          <button onClick={onAction} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{actionLink}</button>
        )}
      </div>

      {/* Status count chips */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        {[
          { key: 'Present',        label: 'Present',    value: counts.present,    color: 'from-emerald-500 to-teal-600',   icon: <UserCheck size={16} /> },
          { key: 'Work From Home', label: 'WFH',        value: counts.wfh,        color: 'from-cyan-500 to-blue-600',      icon: <Home size={16} /> },
          { key: 'On Leave',       label: 'On Leave',   value: counts.onLeave,    color: 'from-purple-500 to-fuchsia-600', icon: <CalendarDays size={16} /> },
          { key: 'Late',           label: 'Late',       value: counts.late,       color: 'from-orange-500 to-amber-600',   icon: <Clock size={16} /> },
          { key: 'Absent',         label: 'Absent',     value: counts.absent,     color: 'from-red-500 to-rose-600',       icon: <XCircle size={16} /> },
          { key: 'Not Marked',     label: 'Not Marked', value: counts.notMarked,  color: 'from-gray-400 to-gray-500',      icon: <HelpCircle size={16} /> }
        ].map((s, i) => (
          <button
            key={i}
            onClick={() => setFilter((prev) => prev === s.key ? 'all' : s.key)}
            className={`bg-gradient-to-br ${s.color} rounded-xl p-3 text-white shadow-sm text-left transition ring-2 ${filter === s.key ? 'ring-white/70 dark:ring-slate-900/70 scale-[1.02]' : 'ring-transparent'} hover:brightness-110`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="p-1.5 bg-white/20 dark:bg-slate-900/20 rounded-md">{s.icon}</div>
              <div className="text-lg font-bold leading-none">{s.value}</div>
            </div>
            <div className="text-[10px] opacity-90">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder={`Search ${list.length} member${list.length === 1 ? '' : 's'}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Member table */}
      <div className="overflow-x-auto max-h-[400px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10">
            <tr className="bg-gray-50 dark:bg-slate-900/40 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
              <th className="py-2 px-3">Employee</th>
              {showRole && <th className="py-2 px-3">Role</th>}
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Check In</th>
              <th className="py-2 px-3">Check Out</th>
              <th className="py-2 px-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={showRole ? 6 : 5} className="text-center py-6 text-gray-400 dark:text-slate-500 text-xs">
                  {filter === 'all' ? 'No members match your search' : `No one is ${filter} right now`}
                </td>
              </tr>
            ) : filtered.map((m) => {
              const s = STATUS_STYLE[m.status] || STATUS_STYLE['Not Marked'];
              return (
                <tr key={m._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {initials(m.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-800 dark:text-slate-100 truncate">{m.name}</div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  {showRole && (
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-medium text-gray-700 dark:text-slate-200 capitalize">{m.role || '—'}</span>
                    </td>
                  )}
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${s.pill} whitespace-nowrap`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {m.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-700 dark:text-slate-200 whitespace-nowrap">{fmtTime(m.checkIn)}</td>
                  <td className="py-2.5 px-3 text-gray-700 dark:text-slate-200 whitespace-nowrap">{fmtTime(m.checkOut)}</td>
                  <td className="py-2.5 px-3 text-[11px] text-gray-500 dark:text-slate-400">{m.note || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamStatusToday;
