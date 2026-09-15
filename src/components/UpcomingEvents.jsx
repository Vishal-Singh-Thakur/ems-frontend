import React, { useMemo } from "react";
import { Cake, PartyPopper, Award, Sparkles } from "lucide-react";
import INDIAN_HOLIDAYS from "../Data/indianHolidays";

const TYPE_META = {
  birthday: {
    icon: <Cake size={14} />,
    bg: 'from-pink-400 to-fuchsia-500',
    label: 'Birthday'
  },
  anniversary: {
    icon: <Award size={14} />,
    bg: 'from-amber-400 to-orange-500',
    label: 'Anniversary'
  },
  holiday: {
    icon: <PartyPopper size={14} />,
    bg: 'from-emerald-400 to-teal-500',
    label: 'Holiday'
  },
  festival: {
    icon: <Sparkles size={14} />,
    bg: 'from-indigo-400 to-blue-600',
    label: 'Festival'
  }
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';

const UpcomingEvents = ({ events = [], title = "Upcoming Events", windowDays = 60 }) => {
  const merged = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const horizon = new Date(today); horizon.setDate(horizon.getDate() + windowDays);

    // De-dupe by date+title (case-insensitive)
    const existingKeys = new Set(
      events.map((e) => `${new Date(e.date).toISOString().slice(0, 10)}|${(e.title || '').trim().toLowerCase()}`)
    );
    const existingDates = new Set(events.filter((e) => e.type === 'holiday').map((e) => new Date(e.date).toISOString().slice(0, 10)));

    const festivalEvents = INDIAN_HOLIDAYS
      .filter((h) => {
        const d = new Date(h.date);
        if (d < today || d > horizon) return false;
        // Skip if a holiday already exists in incoming events for that date
        if (existingDates.has(h.date)) return false;
        const key = `${h.date}|${h.name.trim().toLowerCase()}`;
        return !existingKeys.has(key);
      })
      .map((h) => ({
        type: h.type === 'Festival' ? 'festival' : 'holiday',
        title: h.name,
        subtitle: h.description || h.type,
        date: h.date
      }));

    return [...events, ...festivalEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events, windowDays]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 md:p-5 shadow border border-gray-100 dark:border-slate-800 h-full">
      <h4 className="font-semibold text-gray-800 dark:text-slate-100 mb-4">{title}</h4>
      {merged.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-gray-400 dark:text-slate-500 text-xs text-center px-2">
          No events in next {windowDays} days
        </div>
      ) : (
        <ul className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
          {merged.map((e, i) => {
            const meta = TYPE_META[e.type] || TYPE_META.holiday;
            return (
              <li key={i} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${meta.bg} text-white flex items-center justify-center flex-shrink-0`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{e.title}</div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                    <span className="inline-block bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-slate-300 px-1.5 py-0.5 rounded mr-1 text-[9px] font-semibold uppercase">{meta.label}</span>
                    {e.subtitle}
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">{fmtDate(e.date)}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default UpcomingEvents;
