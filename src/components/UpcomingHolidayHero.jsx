import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PartyPopper, Clock } from "lucide-react";
import INDIAN_HOLIDAYS from "../Data/indianHolidays";

const THEMES = {
  'Independence Day': {
    gradient: 'from-sky-500 via-sky-600 to-blue-700',
    accents: ['#FF9933', '#FFFFFF', '#138808'],
    decoration: 'tricolor'
  },
  'Republic Day': {
    gradient: 'from-blue-600 via-indigo-600 to-indigo-800',
    accents: ['#FF9933', '#FFFFFF', '#138808'],
    decoration: 'tricolor'
  },
  'Diwali': {
    gradient: 'from-orange-500 via-red-500 to-pink-700',
    accents: ['#FFD700', '#FF8C00', '#FFA500'],
    decoration: 'sparkles'
  },
  'Holi': {
    gradient: 'from-pink-500 via-fuchsia-500 to-purple-700',
    accents: ['#FF69B4', '#FFD700', '#00CED1'],
    decoration: 'splash'
  },
  'Christmas': {
    gradient: 'from-red-600 via-red-700 to-green-700',
    accents: ['#FFFFFF', '#FFD700', '#228B22'],
    decoration: 'sparkles'
  },
  'Ganesh Chaturthi': {
    gradient: 'from-orange-500 via-amber-500 to-red-600',
    accents: ['#FFD700', '#FF4500'],
    decoration: 'sparkles'
  },
  'Raksha Bandhan': {
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-600',
    accents: ['#FFD700'],
    decoration: 'sparkles'
  },
  'Eid al-Fitr': {
    gradient: 'from-emerald-500 via-teal-600 to-teal-800',
    accents: ['#FFFFFF', '#FFD700'],
    decoration: 'moon'
  },
  'Eid al-Adha (Bakrid)': {
    gradient: 'from-emerald-500 via-teal-600 to-teal-800',
    accents: ['#FFFFFF', '#FFD700'],
    decoration: 'moon'
  },
  'Muharram': {
    gradient: 'from-slate-700 via-slate-800 to-black',
    accents: ['#FFFFFF'],
    decoration: 'moon'
  },
  'Milad-un-Nabi': {
    gradient: 'from-emerald-500 via-teal-600 to-teal-800',
    accents: ['#FFFFFF', '#FFD700'],
    decoration: 'moon'
  },
  'Guru Nanak Jayanti': {
    gradient: 'from-amber-500 via-orange-500 to-orange-700',
    accents: ['#FFD700'],
    decoration: 'sparkles'
  },
  'Gandhi Jayanti': {
    gradient: 'from-amber-500 via-yellow-600 to-orange-700',
    accents: ['#FFD700'],
    decoration: 'sparkles'
  },
  'Maha Shivaratri': {
    gradient: 'from-indigo-600 via-purple-700 to-slate-900',
    accents: ['#87CEEB'],
    decoration: 'moon'
  },
  'Buddha Purnima': {
    gradient: 'from-amber-500 via-orange-500 to-red-600',
    accents: ['#FFD700'],
    decoration: 'moon'
  },
  'Chhath Puja': {
    gradient: 'from-orange-500 via-red-500 to-pink-700',
    accents: ['#FFD700'],
    decoration: 'sparkles'
  },
  'Karwa Chauth': {
    gradient: 'from-rose-600 via-red-600 to-red-800',
    accents: ['#FFD700'],
    decoration: 'moon'
  },
  'default': {
    gradient: 'from-indigo-500 via-purple-600 to-fuchsia-700',
    accents: ['#FFD700'],
    decoration: 'sparkles'
  }
};

const Decoration = ({ kind, accents = [] }) => {
  if (kind === 'tricolor') {
    return (
      <>
        {/* Ashoka Chakra */}
        <svg className="absolute -top-6 -right-6 w-32 h-32 opacity-30" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="2" />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const x2 = 50 + 42 * Math.cos(angle);
            const y2 = 50 + 42 * Math.sin(angle);
            return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="white" strokeWidth="1" />;
          })}
          <circle cx="50" cy="50" r="6" fill="white" />
        </svg>
        {/* Tricolor waves */}
        <svg className="absolute bottom-0 right-0 w-56 h-16 opacity-90" viewBox="0 0 200 60" preserveAspectRatio="none">
          <path d="M0,20 Q50,0 100,15 T200,10 L200,25 L0,25 Z" fill={accents[0] || '#FF9933'} />
          <path d="M0,30 Q50,10 100,25 T200,20 L200,35 L0,35 Z" fill={accents[1] || '#FFFFFF'} />
          <path d="M0,40 Q50,20 100,35 T200,30 L200,60 L0,60 Z" fill={accents[2] || '#138808'} />
        </svg>
      </>
    );
  }
  if (kind === 'moon') {
    return (
      <svg className="absolute -top-4 -right-4 w-28 h-28 opacity-40" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="35" fill="white" />
        <circle cx="60" cy="45" r="30" fill="currentColor" className="text-black/40" />
        {[0, 60, 120].map((rot) => (
          <path
            key={rot}
            d="M20 20 L22 24 L26 24 L23 27 L24 31 L20 29 L16 31 L17 27 L14 24 L18 24 Z"
            fill="#FFD700"
            transform={`rotate(${rot} 50 50) translate(15, 0)`}
          />
        ))}
      </svg>
    );
  }
  if (kind === 'splash') {
    return (
      <>
        <div className="absolute top-2 right-4 w-16 h-16 rounded-full opacity-40" style={{ background: accents[0] || '#FFD700' }} />
        <div className="absolute bottom-4 right-10 w-10 h-10 rounded-full opacity-50" style={{ background: accents[1] || '#00CED1' }} />
        <div className="absolute top-10 right-16 w-6 h-6 rounded-full opacity-70" style={{ background: accents[2] || '#FF69B4' }} />
      </>
    );
  }
  // Default: sparkles
  return (
    <>
      <svg className="absolute -top-4 -right-4 w-28 h-28 opacity-30" viewBox="0 0 100 100">
        <path d="M50 5 L55 45 L95 50 L55 55 L50 95 L45 55 L5 50 L45 45 Z" fill={accents[0] || 'white'} />
      </svg>
      <div className="absolute bottom-4 right-8 w-3 h-3 rounded-full bg-white opacity-60" />
      <div className="absolute top-16 right-24 w-2 h-2 rounded-full bg-white opacity-80" />
      <div className="absolute bottom-10 right-24 w-2 h-2 rounded-full bg-white opacity-70" />
    </>
  );
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });

const daysUntil = (d) => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(d).setHours(0, 0, 0, 0) - t.getTime()) / 86400000);
};

const daysBadge = (n) => {
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return `${n} days away`;
};

const UpcomingHolidayHero = ({ windowDays = 90 }) => {
  const navigate = useNavigate();

  const upcoming = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const horizon = new Date(today); horizon.setDate(horizon.getDate() + windowDays);
    return INDIAN_HOLIDAYS
      .filter((h) => {
        const d = new Date(h.date);
        return d >= today && d <= horizon;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [windowDays]);

  const [idx, setIdx] = useState(0);

  if (upcoming.length === 0) return null;

  const holiday = upcoming[idx];
  const theme = THEMES[holiday.name] || THEMES.default;
  const days = daysUntil(holiday.date);

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${theme.gradient} text-white shadow-lg`}>
      {/* Decorative background */}
      <Decoration kind={theme.decoration} accents={theme.accents} />

      <div className="relative z-10 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <PartyPopper size={16} /> Holidays
          </div>
          <button
            onClick={() => navigate('/holidays')}
            className="text-[11px] sm:text-xs opacity-90 hover:opacity-100 underline underline-offset-2"
          >
            View all
          </button>
        </div>

        {/* Main content */}
        <div className="min-h-[70px] sm:min-h-[80px]">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight drop-shadow-sm">
            {holiday.name}
          </h3>
          <p className="text-[11px] sm:text-xs opacity-90 mt-1">{fmtDate(holiday.date)}</p>
        </div>

        {/* Footer: badge */}
        <div className="mt-4 flex items-center justify-start">
          <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold bg-white/25 dark:bg-slate-900/25 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Clock size={12} /> {daysBadge(days)}
          </span>
        </div>

        {/* Dots indicator — click to browse */}
        {upcoming.length > 1 && upcoming.length <= 8 && (
          <div className="flex items-center justify-center gap-1 mt-3">
            {upcoming.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Go to ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white dark:bg-slate-800' : 'w-1.5 bg-white/50 dark:bg-slate-900/50 hover:bg-white/70 dark:hover:bg-slate-900/70'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingHolidayHero;
