import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock, LogIn, LogOut, MapPin, AlertCircle, CheckCircle, Home, Sun, Sunrise, Sunset, Moon, MonitorSmartphone
} from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { GetMyAttendanceAPI, MarkAttendanceAPI, AttendanceTodayStatusAPI } from "./Constant/Api/Api";
import { startWfhTracking, formatDuration } from "../Utils/wfhTracker";
import WfhRequestModal from "./Employee/WfhRequestModal";
import { requestLocation } from "../Utils/geolocation";

const getGreeting = (date = new Date()) => {
  const h = date.getHours();
  if (h >= 5 && h < 12)  return { text: 'Good Morning',   emoji: '🌅', Icon: Sunrise, color: 'text-amber-500' };
  if (h >= 12 && h < 17) return { text: 'Good Afternoon', emoji: '☀️', Icon: Sun,     color: 'text-orange-500' };
  if (h >= 17 && h < 21) return { text: 'Good Evening',   emoji: '🌇', Icon: Sunset,  color: 'text-rose-500' };
  return                        { text: 'Good Night',    emoji: '🌙', Icon: Moon,    color: 'text-indigo-500' };
};

const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const isSameDay = (a, b) => {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
};

const getMe = () => {
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("employee");
    if (!raw) return { id: null, name: "User" };
    const u = JSON.parse(raw);
    return { id: u._id || u.id || u.employeeId, name: u.name || u.fullName || "User" };
  } catch {
    return { id: null, name: "User" };
  }
};

const AttendanceHeader = () => {
  const [me] = useState(getMe());
  const [records, setRecords] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [msg, setMsg] = useState("");
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [timer, setTimer] = useState(0);
  const [wfhOpen, setWfhOpen] = useState(false);
  // Auto-tracked work-from-home: no clock-in button, the timer follows screen
  // activity instead. `live` is false while the tab is hidden or the screen is
  // locked, so the user can see when the clock has paused.
  const [wfh, setWfh] = useState({ autoTracked: false, activeSeconds: 0, live: true });
  const tRef = useRef(null);
  const wfhTickRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    requestLocation(setLocation, setLocationError);
  }, []);

  const fetchAttendance = async () => {
    try {
      const r = await ApiHit(GetMyAttendanceAPI, "GET");
      if (r?.success) setRecords(r.data || []);
    } catch (_) {}
  };

  useEffect(() => { fetchAttendance(); }, []);

  // Is today an auto-tracked WFH day? Decides whether the clock-in button is
  // offered at all.
  useEffect(() => {
    (async () => {
      try {
        const r = await ApiHit(AttendanceTodayStatusAPI, "GET");
        if (r?.success) {
          setWfh((w) => ({ ...w, autoTracked: r.data.autoTracked, activeSeconds: r.data.activeSeconds }));
        }
      } catch { /* fall back to the normal clock-in flow */ }
    })();
  }, []);

  // Heartbeat while tracking, plus a local 1s tick so the display moves between
  // beats. The server total always wins when a beat lands.
  useEffect(() => {
    if (!wfh.autoTracked) return undefined;

    const stop = startWfhTracking(
      ({ activeSeconds, live }) =>
        setWfh((w) => ({
          ...w,
          live,
          activeSeconds: activeSeconds ?? w.activeSeconds
        })),
      () => setWfh((w) => ({ ...w, autoTracked: false }))
    );

    wfhTickRef.current = setInterval(() => {
      setWfh((w) => (w.live ? { ...w, activeSeconds: w.activeSeconds + 1 } : w));
    }, 1000);

    return () => {
      stop();
      clearInterval(wfhTickRef.current);
    };
  }, [wfh.autoTracked]);

  const myAttendance = useMemo(
    () => records.filter((r) => String(r.employee?._id || r.employee) === String(me.id)),
    [records, me.id]
  );

  const today = useMemo(
    () => myAttendance.find((r) => {
      const d = r.checkIn ? new Date(r.checkIn) : new Date(r.date);
      return isSameDay(d, new Date());
    }),
    [myAttendance]
  );

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

  const formatTimer = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleClockIn = async () => {
    if (!location && !locationError) {
      setMsg("⏳ Getting location…"); setTimeout(() => setMsg(""), 2000); return;
    }
    try {
      setActionLoading(true);
      const payload = {
        action: "clock_in",
        timestamp: new Date().toISOString(),
        ...(location ? { location } : {})
      };
      const res = await ApiHit(MarkAttendanceAPI, "POST", payload);
      if (res?.success) {
        setMsg("✓ Clock In Successful");
        await fetchAttendance();
      } else {
        setMsg(`❌ ${res?.message || 'Clock In Failed'}`);
      }
    } catch (e) {
      setMsg("❌ Clock In Error");
    } finally {
      setActionLoading(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      const payload = {
        action: "clock_out",
        timestamp: new Date().toISOString(),
        ...(location ? { location } : {})
      };
      const res = await ApiHit(MarkAttendanceAPI, "POST", payload);
      if (res?.success) {
        setMsg("✓ Clock Out Successful");
        await fetchAttendance();
      } else {
        setMsg(`❌ ${res?.message || 'Clock Out Failed'}`);
      }
    } catch (e) {
      setMsg("❌ Clock Out Error");
    } finally {
      setActionLoading(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 md:p-6 rounded-2xl shadow border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          {(() => {
            const g = getGreeting(currentTime);
            const GIcon = g.Icon;
            return (
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                <GIcon className={`${g.color} flex-shrink-0`} size={22} />
                <span className="truncate">{g.text}, {me.name} <span aria-hidden>{g.emoji}</span></span>
              </h1>
            );
          })()}
          <div className="flex items-center gap-3 sm:gap-4 mt-2 text-gray-600 dark:text-slate-300 flex-wrap text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock size={14} />
              <span>{currentTime.toLocaleString("en-IN")}</span>
            </div>
            {location && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 dark:text-green-400">
                <MapPin size={14} />
                {/* The reading itself is not shown — only HR and superadmin may
                    read punch coordinates. This just confirms one was captured,
                    so the location prompt isn't a silent background grab. */}
                <span className="text-[11px] sm:text-xs">Location captured</span>
              </div>
            )}
            {locationError && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-orange-600 dark:text-orange-400">
                <AlertCircle size={14} />
                <span className="text-[11px] sm:text-xs">{locationError}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full md:w-auto md:flex-shrink-0">
          {wfh.autoTracked ? (
            /* WFH day — attendance is tracked from screen activity, so there is
               nothing to punch. The button is replaced, not just disabled. */
            <div className="flex-1 md:flex-none flex items-center gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30">
              <MonitorSmartphone size={18} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-cyan-700 dark:text-cyan-300 font-semibold flex items-center gap-1.5">
                  Work From Home
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${wfh.live ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}
                    title={wfh.live ? 'Tracking' : 'Paused'}
                  />
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-700 dark:text-cyan-300 leading-tight">
                  {formatDuration(wfh.activeSeconds)}
                </div>
              </div>
            </div>
          ) : (!today || today.checkOut) ? (
            <button
              onClick={handleClockIn}
              disabled={actionLoading}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm md:text-base font-semibold rounded-xl shadow disabled:opacity-50 transition whitespace-nowrap"
            >
              <LogIn size={14} className="sm:w-4 sm:h-4" /> Clock In
            </button>
          ) : (
            <>
              <div className="text-right hidden md:block">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold">You are clocked in</div>
                <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 leading-tight">{formatTimer(timer)}</div>
                <div className="text-[11px] text-gray-500 dark:text-slate-400">Since {fmtTime(today.checkIn)}</div>
              </div>
              <button
                onClick={handleClockOut}
                disabled={actionLoading}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs sm:text-sm md:text-base font-semibold rounded-xl shadow disabled:opacity-50 transition whitespace-nowrap"
              >
                <LogOut size={14} className="sm:w-4 sm:h-4" /> Clock Out
              </button>
            </>
          )}
          <button
            onClick={() => setWfhOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs sm:text-sm md:text-base font-semibold rounded-xl shadow transition whitespace-nowrap"
            title="Request Work From Home"
          >
            <Home size={14} className="sm:w-4 sm:h-4" /> Request WFH
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 sm:mb-6 p-3 rounded-xl flex items-center gap-2 text-sm ${
          msg.includes('❌') ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30'
          : msg.includes('⏳') ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
          : 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
        }`}>
          {msg.includes('❌') ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {msg}
        </div>
      )}

      {wfhOpen && (
        <WfhRequestModal
          onClose={() => setWfhOpen(false)}
          onSuccess={fetchAttendance}
        />
      )}
    </>
  );
};

export default AttendanceHeader;
