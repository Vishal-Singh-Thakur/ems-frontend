import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Search, RefreshCcw, CheckCircle2, XCircle, Umbrella, Timer } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { GetMyAttendanceAPI, GetMyLeavesAPI } from "../components/Constant/Api/Api";
import WfhRequestModal from "../components/Employee/WfhRequestModal";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

const STATUS_STYLE = {
  Present:            { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
  Absent:             { pill: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',             dot: 'bg-red-500' },
  Late:               { pill: 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',    dot: 'bg-orange-500' },
  'Half Day':         { pill: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',       dot: 'bg-amber-500' },
  'On Leave':         { pill: 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',    dot: 'bg-purple-500' },
  'Work From Home':   { pill: 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',          dot: 'bg-cyan-500' },
  'Sick Leave':       { pill: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',             dot: 'bg-red-500' },
  'Casual Leave':     { pill: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',          dot: 'bg-blue-500' },
  'Annual Leave':     { pill: 'bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30',          dot: 'bg-teal-500' },
  'Paternity Leave':  { pill: 'bg-fuchsia-100 dark:bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-500/30', dot: 'bg-fuchsia-500' },
  'Maternity Leave':  { pill: 'bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-500/30',          dot: 'bg-pink-500' }
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const isSameDay = (a, b) => {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
};
const durationBetween = (from, to) => {
  if (!from) return '—';
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  const s = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
};

const getEmployeeData = () => {
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("employee");
    if (!raw) return { id: null, name: "User" };
    const u = JSON.parse(raw);
    return { id: u._id || u.id || u.employeeId, name: u.name || u.fullName || "User" };
  } catch { return { id: null, name: "User" }; }
};

const EmployeeAttendance = () => {
  const [me] = useState(getEmployeeData());
  // Values are never read; the setters are, so the bindings keep an empty slot.
  const [, setLocation] = useState(null);
  const [, setLocationError] = useState("");
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setCurrentTime] = useState(new Date());
  const [, setTimer] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [wfhOpen, setWfhOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const tRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLocationError("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => setLocationError("Location access denied")
    );
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [attRes, leaveRes] = await Promise.all([
        ApiHit(GetMyAttendanceAPI, "GET"),
        ApiHit(GetMyLeavesAPI, "GET")
      ]);
      if (attRes?.success) setRecords(attRes.data || []);
      if (leaveRes?.success) {
        const docs = leaveRes.data?.docs || leaveRes.data || [];
        setLeaves(docs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendance(); }, []);

  // Only my attendance records
  const myAttendance = useMemo(() => {
    return records.filter((r) => String(r.employee?._id || r.employee) === String(me.id));
  }, [records, me.id]);

  // Only approved leaves belong to me (backend already returns mine, extra guard)
  const myLeaves = useMemo(() => {
    return leaves.filter((l) => l.status === 'Approved');
  }, [leaves]);

  // Merged timeline: one row per date. Leave takes precedence over clock-in for same date.
  const myRecords = useMemo(() => {
    const map = new Map();

    // First add clock-in based records
    myAttendance.forEach((r) => {
      const d = r.checkIn ? new Date(r.checkIn) : new Date(r.date);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      map.set(key, {
        _id: r._id,
        kind: 'attendance',
        date: d,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: r.status || 'Present',
        source: 'Attendance',
        checkInLocation: r.checkInLocation,
        checkOutLocation: r.checkOutLocation
      });
    });

    // Then overlay approved leaves (expand date-range into individual days)
    myLeaves.forEach((l) => {
      if (!l.fromDate) return;
      const start = new Date(l.fromDate);
      const end = l.toDate ? new Date(l.toDate) : start;
      const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const finish = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      while (cur <= finish) {
        const key = cur.toISOString();
        map.set(key, {
          _id: `${l._id}-${key}`,
          kind: 'leave',
          date: new Date(cur),
          status: l.leaveType,
          reason: l.reason,
          source: l.leaveType
        });
        cur.setDate(cur.getDate() + 1);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.date - a.date);
  }, [myAttendance, myLeaves]);

  // Today's clock-in record + live timer (from raw attendance, not merged)
  const today = useMemo(() => {
    return myAttendance.find((r) => {
      const d = r.checkIn ? new Date(r.checkIn) : new Date(r.date);
      return isSameDay(d, new Date());
    });
  }, [myAttendance]);

  useEffect(() => {
    if (tRef.current) { clearInterval(tRef.current); tRef.current = null; }
    if (today?.checkIn && !today.checkOut) {
      const start = new Date(today.checkIn).getTime();
      setTimer(Math.floor((Date.now() - start) / 1000));
      tRef.current = setInterval(() => setTimer((prev) => prev + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => { if (tRef.current) clearInterval(tRef.current); };
  }, [today?._id, today?.checkIn, today?.checkOut]);


  // Stats for the current month
  const stats = useMemo(() => {
    const inMonth = (d) => d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
    const monthRecords = myRecords.filter((r) => inMonth(r.date));

    const present = monthRecords.filter((r) => r.status === 'Present').length;
    const late    = monthRecords.filter((r) => r.status === 'Late').length;
    const wfh     = monthRecords.filter((r) => r.status === 'Work From Home').length;
    const onLeave = monthRecords.filter((r) => r.kind === 'leave' && r.status !== 'Work From Home').length;
    const absent  = monthRecords.filter((r) => r.status === 'Absent').length;

    const totalHours = myAttendance
      .filter((r) => {
        const d = r.checkIn ? new Date(r.checkIn) : new Date(r.date);
        return inMonth(d);
      })
      .reduce((sum, r) => {
        if (r.checkIn && r.checkOut) {
          return sum + (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 3600000;
        }
        return sum;
      }, 0);

    return {
      count: monthRecords.length,
      present, late, wfh, onLeave, absent,
      totalHours: totalHours.toFixed(1)
    };
  }, [myRecords, myAttendance]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const fromTs = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const toTs = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

    return myRecords.filter((r) => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const t = r.date.getTime();
      if (fromTs != null && t < fromTs) return false;
      if (toTs != null && t > toTs) return false;
      if (q && !(r.status || '').toLowerCase().includes(q) && !r.date.toLocaleDateString('en-GB').toLowerCase().includes(q)) return false;
      return matchStatus;
    });
  }, [myRecords, search, statusFilter, fromDate, toDate]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, fromDate, toDate]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );



  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Monthly stats — click to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'This Month',  value: stats.count,               color: 'from-blue-500 to-indigo-600',    icon: <Calendar size={18} />,     filter: 'all' },
          { label: 'Present',     value: stats.present,             color: 'from-emerald-500 to-teal-600',   icon: <CheckCircle2 size={18} />, filter: 'Present' },
          { label: 'WFH',         value: stats.wfh,                 color: 'from-cyan-500 to-blue-600',      icon: <Umbrella size={18} />,     filter: 'Work From Home' },
          { label: 'On Leave',    value: stats.onLeave,             color: 'from-purple-500 to-fuchsia-600', icon: <Calendar size={18} />,     filter: null },
          { label: 'Late/Absent', value: stats.late + stats.absent, color: 'from-red-500 to-rose-600',       icon: <XCircle size={18} />,      filter: 'Absent' },
          { label: 'Total Hours', value: `${stats.totalHours}h`,    color: 'from-orange-500 to-amber-600',   icon: <Timer size={18} />,        filter: null }
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
            placeholder="Search by status or date…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Status</option>
          {Object.keys(STATUS_STYLE).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-500 dark:text-slate-400">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-500 dark:text-slate-400">To</label>
          <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={fetchAttendance}
          className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition ml-auto">
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* History table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <Umbrella size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {myRecords.length === 0 ? 'No attendance records yet' : 'No records match your filters'}
          </div>
          {myRecords.length === 0 && <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Clock In today to start your attendance history.</div>}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40">
            <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar size={16} className="text-blue-600 dark:text-blue-400" /> Attendance History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white dark:bg-slate-800 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Clock In</th>
                  <th className="py-3 px-4">Clock Out</th>
                  <th className="py-3 px-4">Duration / Reason</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, idx) => {
                  const i = (currentPage - 1) * PAGE_SIZE + idx;
                  const s = STATUS_STYLE[r.status] || { pill: 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700', dot: 'bg-gray-400' };
                  const isLeave = r.kind === 'leave';
                  return (
                    <tr key={r._id || i} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-700 dark:text-slate-200">
                          <Calendar size={11} className="text-blue-600 dark:text-blue-400" /> {fmtDate(r.date)}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{r.date.toLocaleDateString('en-GB', { weekday: 'long' })}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-slate-200 whitespace-nowrap">
                        {isLeave ? <span className="text-gray-400 dark:text-slate-500">—</span> : fmtTime(r.checkIn)}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-slate-200 whitespace-nowrap">
                        {isLeave ? <span className="text-gray-400 dark:text-slate-500">—</span> : fmtTime(r.checkOut)}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-slate-200 whitespace-nowrap">
                        {isLeave ? (
                          <span className="text-[11px] text-gray-500 dark:text-slate-400 italic max-w-[180px] inline-block truncate align-middle" title={r.reason}>
                            {r.reason ? `"${r.reason}"` : '—'}
                          </span>
                        ) : r.checkIn ? durationBetween(r.checkIn, r.checkOut) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${s.pill} whitespace-nowrap`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {r.status || '—'}
                        </span>
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

      {wfhOpen && (
        <WfhRequestModal
          onClose={() => setWfhOpen(false)}
          onSuccess={fetchAttendance}
        />
      )}
    </main>
  );
};

export default EmployeeAttendance;
