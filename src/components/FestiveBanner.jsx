import React, { useMemo } from "react";
import INDIAN_HOLIDAYS from "../Data/indianHolidays";

/* ------------ helpers ------------ */
const daysUntil = (dateStr) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(dateStr).setHours(0, 0, 0, 0) - today.getTime()) / 86400000);
};

/* ------------ per-festival themes ------------ */
const THEMES = {
  "Independence Day":     { decor: "flag" },
  "Republic Day":         { decor: "flag" },
  "Diwali":               { decor: "diyas" },
  "Holi":                 { decor: "splash" },
  "Christmas":            { decor: "snow" },
  "Ganesh Chaturthi":     { decor: "sparkle" },
  "Raksha Bandhan":       { decor: "sparkle" },
  "Janmashtami":          { decor: "sparkle" },
  "Eid al-Fitr":          { decor: "moon" },
  "Eid al-Adha (Bakrid)": { decor: "moon" },
  "Muharram":             { decor: "moon" },
  "Milad-un-Nabi":        { decor: "moon" },
  "Gandhi Jayanti":       { decor: "sparkle" },
  "Guru Nanak Jayanti":   { decor: "sparkle" },
  "Buddha Purnima":       { decor: "moon" },
  "Maha Shivaratri":      { decor: "moon" },
  "Ram Navami":           { decor: "sparkle" },
  "Chhath Puja":          { decor: "sparkle" },
  "Karwa Chauth":         { decor: "moon" },
  "Dussehra":             { decor: "sparkle" },
  "New Year's Day":       { decor: "confetti" },
  default:                { decor: "confetti" }
};

/* ------------ decoration components (spread across viewport) ------------ */
const FlagDecor = () => (
  <>
    {/* Waving flags at multiple positions */}
    {[
      { top: "10%",  left: "3%",  size: 60,  delay: "0s"   },
      { top: "70%",  left: "2%",  size: 50,  delay: "0.8s" },
      { top: "20%",  right: "3%", size: 55,  delay: "0.4s" },
      { top: "75%",  right: "4%", size: 65,  delay: "1.2s" }
    ].map((f, i) => (
      <svg
        key={`flag-${i}`}
        className="absolute drop-shadow-lg opacity-80"
        style={{
          top: f.top,
          left: f.left,
          right: f.right,
          width: f.size,
          height: f.size,
          transformOrigin: "bottom left",
          animation: `fb-wave 3s ease-in-out ${f.delay} infinite`
        }}
        viewBox="0 0 100 100"
      >
        <line x1="12" y1="10" x2="12" y2="95" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
        <path d="M12 10 Q40 15 60 12 T90 15 L90 32 Q60 35 40 32 T12 30 Z" fill="#FF9933" />
        <path d="M12 30 Q40 33 60 30 T90 33 L90 50 Q60 53 40 50 T12 48 Z" fill="#ffffff" />
        <circle cx="51" cy="40" r="3" fill="none" stroke="#0f172a" strokeWidth="1" />
        <path d="M12 48 Q40 51 60 48 T90 51 L90 68 Q60 71 40 68 T12 66 Z" fill="#138808" />
      </svg>
    ))}
    {/* Floating balloons across the entire viewport */}
    {[
      { c: "#FF9933", left: "5%",  delay: "0s",   dur: "7s"   },
      { c: "#ffffff", left: "14%", delay: "1.5s", dur: "8s"   },
      { c: "#138808", left: "22%", delay: "0.7s", dur: "6.5s" },
      { c: "#FF9933", left: "32%", delay: "2.1s", dur: "7.5s" },
      { c: "#138808", left: "44%", delay: "0.3s", dur: "8.2s" },
      { c: "#FF9933", left: "56%", delay: "1.8s", dur: "6.8s" },
      { c: "#ffffff", left: "68%", delay: "0.9s", dur: "7.4s" },
      { c: "#138808", left: "80%", delay: "2.6s", dur: "8.6s" },
      { c: "#FF9933", left: "90%", delay: "1.1s", dur: "7.2s" }
    ].map((b, i) => (
      <div
        key={`balloon-${i}`}
        className="absolute opacity-70"
        style={{
          left: b.left,
          bottom: "-40px",
          animation: `fb-rise ${b.dur} linear ${b.delay} infinite`
        }}
      >
        <svg width="28" height="42" viewBox="0 0 28 42">
          <ellipse cx="14" cy="14" rx="11" ry="14" fill={b.c} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
          <path d="M14 28 L11 30 L14 32 L17 30 Z" fill={b.c} />
          <line x1="14" y1="32" x2="14" y2="42" stroke="#333" strokeWidth="0.6" />
        </svg>
      </div>
    ))}
  </>
);

const DiyasDecor = () => (
  <>
    {/* Row of diyas along bottom */}
    {Array.from({ length: 15 }).map((_, i) => (
      <div
        key={`diya-${i}`}
        className="absolute"
        style={{
          bottom: 8,
          left: `${5 + i * 6.2}%`,
          animation: `fb-flicker 1.${(i % 9) + 1}s ease-in-out infinite alternate`
        }}
      >
        <svg width="26" height="32" viewBox="0 0 26 32">
          <ellipse cx="13" cy="26" rx="11" ry="4.5" fill="#7c2d12" />
          <path d="M4 24 Q13 30 22 24 L22 28 Q13 32 4 28 Z" fill="#f59e0b" />
          <ellipse cx="13" cy="15" rx="4" ry="9" fill="#fbbf24" opacity="0.9" />
          <ellipse cx="13" cy="13" rx="2" ry="5.5" fill="#fef3c7" />
        </svg>
      </div>
    ))}
    {/* Sparkles scattered */}
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={`spark-${i}`}
        className="absolute text-amber-400 select-none"
        style={{
          left: `${(i * 7 + 3) % 95}%`,
          top: `${(i * 11 + 5) % 80}%`,
          fontSize: `${10 + (i % 3) * 4}px`,
          animation: `fb-twinkle ${1 + (i % 4) * 0.3}s ease-in-out infinite alternate`,
          opacity: 0.7
        }}
      >
        ✦
      </div>
    ))}
  </>
);

const SnowDecor = () => (
  <>
    {Array.from({ length: 40 }).map((_, i) => (
      <div
        key={`snow-${i}`}
        className="absolute text-white select-none"
        style={{
          left: `${(i * 2.6) % 100}%`,
          top: "-30px",
          fontSize: `${12 + (i % 5) * 3}px`,
          opacity: 0.7 + (i % 3) * 0.1,
          textShadow: "0 0 6px rgba(255,255,255,0.6)",
          animation: `fb-fall-slow ${6 + (i % 6)}s linear ${i * 0.2}s infinite`
        }}
      >
        ❄
      </div>
    ))}
  </>
);

const MoonDecor = () => (
  <>
    {/* Crescent moon top-right */}
    <svg
      className="absolute top-8 right-8 w-20 h-20 drop-shadow-lg opacity-90"
      viewBox="0 0 100 100"
    >
      <circle cx="50" cy="50" r="38" fill="#fef3c7" opacity="0.95" />
      <circle cx="62" cy="45" r="32" fill="#0f172a" opacity="0.85" />
    </svg>
    {/* Twinkling stars everywhere */}
    {Array.from({ length: 30 }).map((_, i) => (
      <div
        key={`star-${i}`}
        className="absolute text-yellow-200 select-none"
        style={{
          left: `${(i * 3.4 + 2) % 100}%`,
          top: `${(i * 6.5 + 5) % 90}%`,
          fontSize: `${10 + (i % 4) * 3}px`,
          animation: `fb-twinkle ${1 + (i % 5) * 0.3}s ease-in-out infinite alternate`,
          opacity: 0.8
        }}
      >
        ✦
      </div>
    ))}
  </>
);

const SparkleDecor = () => (
  <>
    {Array.from({ length: 35 }).map((_, i) => (
      <div
        key={`sp-${i}`}
        className="absolute select-none"
        style={{
          left: `${(i * 2.9 + 2) % 98}%`,
          top: `${(i * 7 + 3) % 90}%`,
          fontSize: `${12 + (i % 4) * 4}px`,
          animation: `fb-twinkle ${0.8 + (i % 5) * 0.3}s ease-in-out infinite alternate`,
          opacity: 0.75
        }}
      >
        ✨
      </div>
    ))}
  </>
);

const SplashDecor = () => (
  <>
    {[
      { c: "#FFD700", l: "5%",  t: "12%", s: 80  },
      { c: "#FF69B4", l: "22%", t: "70%", s: 55  },
      { c: "#00CED1", l: "40%", t: "20%", s: 70  },
      { c: "#FF4500", l: "58%", t: "62%", s: 60  },
      { c: "#9370DB", l: "72%", t: "18%", s: 50  },
      { c: "#32CD32", l: "88%", t: "55%", s: 65  },
      { c: "#FFD700", l: "12%", t: "45%", s: 45  },
      { c: "#FF69B4", l: "82%", t: "8%",  s: 40  }
    ].map((d, i) => (
      <div
        key={`sp-${i}`}
        className="absolute rounded-full blur-md"
        style={{
          left: d.l,
          top: d.t,
          width: d.s,
          height: d.s,
          background: d.c,
          opacity: 0.35,
          animation: `fb-pulse ${2 + i * 0.35}s ease-in-out infinite alternate`
        }}
      />
    ))}
  </>
);

const ConfettiDecor = () => (
  <>
    {Array.from({ length: 45 }).map((_, i) => {
      const colors = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#eab308", "#ec4899"];
      return (
        <div
          key={`co-${i}`}
          className="absolute"
          style={{
            left: `${(i * 2.3) % 100}%`,
            top: "-15px",
            width: "8px",
            height: "12px",
            background: colors[i % colors.length],
            opacity: 0.85,
            animation: `fb-fall-slow ${4 + (i % 4)}s linear ${i * 0.18}s infinite, fb-spin 1.5s linear infinite`,
            borderRadius: i % 2 ? "0" : "50%"
          }}
        />
      );
    })}
  </>
);

const decorMap = {
  flag: FlagDecor,
  diyas: DiyasDecor,
  snow: SnowDecor,
  moon: MoonDecor,
  sparkle: SparkleDecor,
  splash: SplashDecor,
  confetti: ConfettiDecor
};

/* ------------ main overlay component ------------ */
const FestiveBanner = ({ withinDays = 3 }) => {
  const nextHoliday = useMemo(() => {
    const sorted = [...INDIAN_HOLIDAYS].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted.find((h) => {
      const d = daysUntil(h.date);
      return d >= 0 && d <= withinDays;
    });
  }, [withinDays]);

  if (!nextHoliday) return null;

  const theme = THEMES[nextHoliday.name] || THEMES.default;
  const Decor = decorMap[theme.decor] || SparkleDecor;

  return (
    <>
      <style>{`
        @keyframes fb-rise    { 0% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-55vh) rotate(3deg); } 100% { transform: translateY(-110vh) rotate(-3deg); } }
        @keyframes fb-wave    { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(4deg); } }
        @keyframes fb-flicker { 0% { opacity: 0.85; transform: scaleY(1); } 100% { opacity: 1; transform: scaleY(1.1); } }
        @keyframes fb-fall-slow { 0% { transform: translateY(-30px); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(105vh); opacity: 0.5; } }
        @keyframes fb-twinkle { 0% { opacity: 0.35; transform: scale(0.75); } 100% { opacity: 1; transform: scale(1.25); } }
        @keyframes fb-pulse   { 0% { transform: scale(0.9); opacity: 0.25; } 100% { transform: scale(1.2); opacity: 0.55; } }
        @keyframes fb-spin    { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }
      `}</style>

      {/* Fullscreen overlay — non-interactive ambient decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-40" aria-hidden="true">
        <Decor />
      </div>
    </>
  );
};

export default FestiveBanner;
