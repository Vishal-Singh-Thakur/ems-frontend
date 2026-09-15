import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Calendar,
  LogIn,
  LogOut,
  AlertCircle,
  CheckCircle,
  MapPin,
  Home
} from "lucide-react";
import {
  MarkAttendanceAPI,
  GetMyLeavesAPI,
  GetMyAttendanceAPI,
  GetAttendanceOverviewAPI
} from "../components/Constant/Api/Api";
import ApplyLeave from "../components/Employee/LeaveRequestModal";
import WfhRequestModal from "../components/Employee/WfhRequestModal";
import ApiHit from "../Utils/ApiHit";
import Pagination from "../components/Pagination";
import { requestLocation } from "../Utils/geolocation";
import AttendanceLocation from "../components/AttendanceLocation";
import { hasPermission } from "../Utils/roleUtils";

const STATUS_STYLE = {
  Present:           { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
  Absent:            { pill: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',             dot: 'bg-red-500' },
  Late:              { pill: 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',    dot: 'bg-orange-500' },
  'Half Day':        { pill: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',       dot: 'bg-amber-500' },
  'On Leave':        { pill: 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',    dot: 'bg-purple-500' },
  'Work From Home':  { pill: 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',          dot: 'bg-cyan-500' },
  'Sick Leave':      { pill: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',             dot: 'bg-red-500' },
  'Casual Leave':    { pill: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',          dot: 'bg-blue-500' },
  'Annual Leave':    { pill: 'bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30',          dot: 'bg-teal-500' },
  'Paternity Leave': { pill: 'bg-fuchsia-100 dark:bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-500/30', dot: 'bg-fuchsia-500' },
  'Maternity Leave': { pill: 'bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-500/30',          dot: 'bg-pink-500' }
};

const fmt  = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtT = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const PAGE_SIZE = 5;

const Attendance = ({ user }) => {
  // ================= EMPLOYEE =================
  const getEmployeeData = () => {
    try {
      const user =
        localStorage.getItem("user") || localStorage.getItem("employee");
      if (user) {
        const u = JSON.parse(user);
        return {
          id: u._id || u.id || u.employeeId,
          name: u.name || u.fullName || "User",
          role: u.role
        };
      }
    } catch (e) {
      console.error(e);
    }
    return { id: null, name: "User", role: "EMPLOYEE" };
  };


  const [currentEmployee] = useState(getEmployeeData());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [successMsg, setSuccessMsg] = useState("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showWfhModal, setShowWfhModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");

  // Everyone's punches for today, with coordinates. The backend redacts other
  // people's locations unless the caller holds attendance.location.view, so this
  // section is only worth rendering for HR and superadmin.
  const canSeeAllLocations = hasPermission(user, 'attendance.location.view');
  const [teamToday, setTeamToday] = useState([]);
  const [teamPage, setTeamPage] = useState(1);
  const [teamSearch, setTeamSearch] = useState("");

  const timerRef = useRef(null);

  // ================= CLOCK =================
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ================= LOCATION =================
  useEffect(() => {
    requestLocation(setLocation, setLocationError);
  }, []);

  // ================= INIT =================
  useEffect(() => {
    fetchAttendanceOverview();
    fetchAllLeaves();
  }, []);

  // `user` arrives a tick after mount, so this flips false→true and must be its
  // own effect — sharing the one above would refetch the personal data too.
  useEffect(() => {
    if (canSeeAllLocations) fetchTeamToday();
  }, [canSeeAllLocations]);

  // ================= API =================
  const fetchAttendanceOverview = async () => {
    try {
      const res = await ApiHit(GetMyAttendanceAPI, "GET");
      console.log("📊 Attendance API Response:", res);

      if (res.success && res.data) {
        const records = res.data || [];
        console.log("📋 All Records:", records);
        setAttendanceRecords(records);
        checkTodayAttendance(records);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
    }
  };

  const fetchTeamToday = async () => {
    try {
      const res = await ApiHit(GetAttendanceOverviewAPI, "GET");
      if (res?.success) setTeamToday(res.data?.attendance || []);
    } catch (err) {
      console.error("Team attendance fetch error:", err);
    }
  };

  const fetchAllLeaves = async () => {
    try {
      const res = await ApiHit(GetMyLeavesAPI, "GET");
      console.log("🟣 Leaves API:", res);

      if (res.success) {
        // pagination case
        if (Array.isArray(res.data)) {
          setLeaveRequests(res.data);
        }
        else if (Array.isArray(res.data?.docs)) {
          setLeaveRequests(res.data.docs);
        }
        else {
          setLeaveRequests([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };


  // ================= HELPERS =================
  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  const checkTodayAttendance = (records) => {
    const today = new Date();

    console.log("🔍 Checking today:", today.toLocaleDateString("en-IN"));
    console.log("👤 Current Employee ID:", currentEmployee.id);
    console.log("📦 Total records:", records.length);

    // Use checkIn time instead of date field (to handle timezone issues)
    const record = records.find((r) => {
      const employeeMatch = String(r.employee?._id || r.employee) === String(currentEmployee.id);
      const dateToCheck = r.checkIn ? new Date(r.checkIn) : new Date(r.date);
      const dateMatch = isSameDay(dateToCheck, today);

      console.log("🔎 Checking Record:", {
        _id: r._id,
        dateField: r.date,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        dateToCheck: dateToCheck.toLocaleDateString("en-IN"),
        todayDate: today.toLocaleDateString("en-IN"),
        employeeId: r.employee?._id,
        employeeMatch,
        dateMatch
      });

      return employeeMatch && dateMatch;
    });

    console.log("✅ Today's Record Found:", record);

    setTodayAttendance(record || null);

    // Start timer if clocked in but not clocked out
    if (record && record.checkIn && !record.checkOut) {
      const start = new Date(record.checkIn).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - start) / 1000);

      console.log("⏱️ Timer Info:", {
        checkIn: record.checkIn,
        checkInParsed: new Date(record.checkIn).toLocaleString("en-IN"),
        now: new Date().toLocaleString("en-IN"),
        elapsed: elapsed,
        formatted: formatTimer(elapsed)
      });

      setTimer(elapsed);
      startTimer();
    } else {
      console.log("⏹️ Stopping timer - Reason:",
        !record ? "No record" :
          !record.checkIn ? "No checkIn" :
            record.checkOut ? "Already checked out" : "Unknown");
      stopTimer();
      if (!record || record.checkOut) {
        setTimer(0);
      }
    }
  };

  // ================= TIMER =================
  const startTimer = () => {
    console.log("▶️ Starting timer");
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        const newVal = prev + 1;
        // Log every 10 seconds for debugging
        if (newVal % 10 === 0) {
          console.log("⏲️ Timer:", formatTimer(newVal));
        }
        return newVal;
      });
    }, 1000);
  };

  const stopTimer = () => {
    console.log("⏸️ Stopping timer");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTimer = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ================= ACTIONS =================
  const handleClockIn = async () => {
    if (!location && !locationError) {
      setSuccessMsg("⏳ Getting location...");
      setTimeout(() => setSuccessMsg(""), 2000);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        action: "clock_in",
        timestamp: new Date().toISOString()
      };

      if (location) {
        payload.location = location;
      }

      console.log("🔵 Clock In Payload:", payload);
      const res = await ApiHit(MarkAttendanceAPI, "POST", payload);
      console.log("🔵 Clock In Response:", res);

      if (res.success) {
        setSuccessMsg("✓ Clock In Successful");
        await fetchAttendanceOverview();
      } else {
        setSuccessMsg(`❌ ${res.message || "Clock In Failed"}`);
      }
    } catch (err) {
      console.error("Clock in error:", err);
      setSuccessMsg("❌ Clock In Error");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);

      const payload = {
        action: "clock_out",
        timestamp: new Date().toISOString()
      };

      if (location) {
        payload.location = location;
      }

      console.log("🔴 Clock Out Payload:", payload);
      const res = await ApiHit(MarkAttendanceAPI, "POST", payload);
      console.log("🔴 Clock Out Response:", res);

      if (res.success) {
        stopTimer();
        setSuccessMsg("✓ Clock Out Successful");
        await fetchAttendanceOverview();
      } else {
        setSuccessMsg(`❌ ${res.message || "Clock Out Failed"}`);
      }
    } catch (err) {
      console.error("Clock out error:", err);
      setSuccessMsg("❌ Clock Out Error");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Component unmounting, cleaning up timer");
      stopTimer();
    };
  }, []);

  useEffect(() => {
    console.log("🔢 Timer state changed:", timer, formatTimer(timer));
  }, [timer]);
  useEffect(() => {
    if (todayAttendance && todayAttendance.checkIn && !todayAttendance.checkOut) {
      startTimer();
    } else {
      stopTimer();
      setTimer(0);
    }
  }, [todayAttendance]);


  // ================= FILTERS (separate per section) =================
  const [attDate, setAttDate] = useState("");
  const [leaveDate, setLeaveDate] = useState("");
  const [attPage, setAttPage] = useState(1);

  useEffect(() => { setAttPage(1); }, [attDate]);

  const myAttendance = attendanceRecords
    .filter((a) => String(a.employee?._id || a.employee) === String(currentEmployee.id))
    .filter((a) => {
      if (!attDate) return true;
      const d = new Date(a.date);
      return d.toDateString() === new Date(attDate).toDateString();
    });

  const myLeaves = leaveRequests
    .filter((l) => String(l.employee?._id || l.employee) === String(currentEmployee.id))
    .filter((l) => {
      if (!leaveDate) return true;
      const fd = new Date(leaveDate);
      const from = new Date(l.fromDate);
      const to = new Date(l.toDate);
      const fdDay = new Date(fd.getFullYear(), fd.getMonth(), fd.getDate());
      const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate());
      return fdDay >= fromDay && fdDay <= toDay;
    });


  // ================= UI =================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900/40 p-3 sm:p-4 md:p-6">
      <div className="space-y-6">


        {/* EVERYONE'S PUNCHES TODAY — HR + Superadmin only.
            Other roles never receive the coordinates, so this stays hidden for them. */}
        {canSeeAllLocations && (() => {
          const TEAM_PAGE_SIZE = 8;
          const q = teamSearch.trim().toLowerCase();
          const rows = teamToday
            .filter((r) => !q || (r.employee?.name || '').toLowerCase().includes(q))
            .sort((a, b) => new Date(b.checkIn || b.date) - new Date(a.checkIn || a.date));
          const paged = rows.slice((teamPage - 1) * TEAM_PAGE_SIZE, teamPage * TEAM_PAGE_SIZE);
          const withLocation = rows.filter((r) => r.checkInLocation || r.checkOutLocation).length;

          return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 flex-wrap gap-3">
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-600 dark:text-emerald-400" />
                    All Employees — Today
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                    {rows.length} punched in · {withLocation} with location
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={teamSearch}
                    onChange={(e) => { setTeamSearch(e.target.value); setTeamPage(1); }}
                    placeholder="Search employee…"
                    className="text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={fetchTeamToday}
                    className="text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {rows.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-slate-400">
                  Nobody has clocked in today yet.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white dark:bg-slate-800 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                          <th className="py-3 px-4 w-12">#</th>
                          <th className="py-3 px-4">Employee</th>
                          <th className="py-3 px-4">Clock In</th>
                          <th className="py-3 px-4">Clock Out</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map((r, idx) => {
                          const i = (teamPage - 1) * TEAM_PAGE_SIZE + idx;
                          const st = STATUS_STYLE[r.status] || { pill: 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700', dot: 'bg-gray-400' };
                          const name = r.employee?.name || 'Unknown';
                          return (
                            <tr key={r._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                              <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                    {name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-gray-800 dark:text-slate-100 truncate">{name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-700 dark:text-slate-200 whitespace-nowrap">{fmtT(r.checkIn)}</td>
                              <td className="py-3 px-4 text-gray-700 dark:text-slate-200 whitespace-nowrap">{fmtT(r.checkOut)}</td>
                              <td className="py-3 px-4">
                                <AttendanceLocation
                                  checkInLocation={r.checkInLocation}
                                  checkOutLocation={r.checkOutLocation}
                                />
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${st.pill} whitespace-nowrap`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
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
                    currentPage={teamPage}
                    totalItems={rows.length}
                    pageSize={TEAM_PAGE_SIZE}
                    onPageChange={setTeamPage}
                  />
                </>
              )}
            </div>
          );
        })()}

        {/* MERGED TIMELINE — Attendance + Approved Leaves + WFH */}
        {(() => {
          const dur = (a, b) => {
            if (!a) return '—';
            const ms = (b ? new Date(b) : new Date()).getTime() - new Date(a).getTime();
            const s = Math.max(0, Math.floor(ms / 1000));
            return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
          };

          const map = new Map();
          myAttendance.forEach((r) => {
            const d = r.checkIn ? new Date(r.checkIn) : new Date(r.date);
            const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
            map.set(key, {
              _id: r._id, kind: 'attendance', date: d,
              checkIn: r.checkIn, checkOut: r.checkOut,
              status: r.status || 'Present', workHours: r.workHours,
              checkInLocation: r.checkInLocation, checkOutLocation: r.checkOutLocation
            });
          });
          myLeaves.filter((l) => l.status === 'Approved').forEach((l) => {
            if (!l.fromDate) return;
            const start = new Date(l.fromDate);
            const end = l.toDate ? new Date(l.toDate) : start;
            const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            const finish = new Date(end.getFullYear(), end.getMonth(), end.getDate());
            while (cur <= finish) {
              const key = cur.toISOString();
              map.set(key, {
                _id: `${l._id}-${key}`, kind: 'leave', date: new Date(cur),
                status: l.leaveType, reason: l.reason
              });
              cur.setDate(cur.getDate() + 1);
            }
          });
          const merged = Array.from(map.values()).sort((a, b) => b.date - a.date);

          return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 flex-wrap gap-3">
                <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600 dark:text-blue-400" /> My Timeline
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-normal">(attendance + approved leaves + WFH)</span>
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {attDate && (
                    <button onClick={() => setAttDate("")} className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline">Clear</button>
                  )}
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
                  >
                    <Calendar size={14} /> Apply Leave
                  </button>
                </div>
              </div>

              {(() => {
                const filteredMerged = attDate
                  ? merged.filter((r) => r.date.toDateString() === new Date(attDate).toDateString())
                  : merged;
                if (filteredMerged.length === 0) {
                  return <div className="p-10 text-center text-gray-500 dark:text-slate-400">No records for the selected period.</div>;
                }
                const pagedMerged = filteredMerged.slice((attPage - 1) * PAGE_SIZE, attPage * PAGE_SIZE);
                return (
                  <>
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
                        {pagedMerged.map((r, idx) => {
                          const i = (attPage - 1) * PAGE_SIZE + idx;
                          const s = STATUS_STYLE[r.status] || { pill: 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700', dot: 'bg-gray-400' };
                          const isLeave = r.kind === 'leave';
                          return (
                            <tr key={r._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                              <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1 text-gray-700 dark:text-slate-200">
                                  <Calendar size={11} className="text-blue-600 dark:text-blue-400" /> {fmt(r.date)}
                                </div>
                                <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                                  {r.date.toLocaleDateString('en-GB', { weekday: 'long' })}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-700 dark:text-slate-200 whitespace-nowrap">
                                {isLeave ? <span className="text-gray-400 dark:text-slate-500">—</span> : fmtT(r.checkIn)}
                              </td>
                              <td className="py-3 px-4 text-gray-700 dark:text-slate-200 whitespace-nowrap">
                                {isLeave ? <span className="text-gray-400 dark:text-slate-500">—</span> : fmtT(r.checkOut)}
                              </td>
                              <td className="py-3 px-4 text-gray-700 dark:text-slate-200 whitespace-nowrap">
                                {isLeave ? (
                                  <span className="text-[11px] text-gray-500 dark:text-slate-400 italic max-w-[180px] inline-block truncate align-middle" title={r.reason}>
                                    {r.reason ? `"${r.reason}"` : '—'}
                                  </span>
                                ) : r.checkIn ? dur(r.checkIn, r.checkOut) : '—'}
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
                    currentPage={attPage}
                    totalItems={filteredMerged.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setAttPage}
                  />
                  </>
                );
              })()}
            </div>
          );
        })()}

        {/* LEAVE MODAL */}
        {showLeaveModal && (
          <ApplyLeave
            onClose={() => setShowLeaveModal(false)}
            onSuccess={fetchAllLeaves}
          />
        )}

        {showWfhModal && (
          <WfhRequestModal
            onClose={() => setShowWfhModal(false)}
            onSuccess={fetchAllLeaves}
          />
        )}
      </div>
    </div>
  );
};

export default Attendance;
