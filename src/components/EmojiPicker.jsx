import React, { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";

const CATEGORIES = [
  {
    label: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐']
  },
  {
    label: 'Gestures',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '👏', '🙌', '🙏', '💪', '🤲', '👐', '🤦', '🤷', '👀', '👁️', '👄']
  },
  {
    label: 'Objects',
    emojis: ['🎉', '🎊', '🎈', '🎁', '🎂', '🍰', '🏆', '🥇', '🥈', '🥉', '🏅', '📣', '📢', '🔔', '📌', '📎', '📅', '📆', '📊', '📈', '📉', '💼', '📁', '📂', '📝', '✏️', '📌', '📍', '🔖', '💡', '🔑', '🔒', '💰', '💵', '💸']
  },
  {
    label: 'Symbols',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✅', '❌', '⚠️', '🚫', '❗', '❓', '💯', '🔥', '⭐', '🌟', '✨', '💫', '💥', '☀️', '🌈', '⚡']
  },
  {
    label: 'Work',
    emojis: ['💻', '⌨️', '🖥️', '🖱️', '🖨️', '📱', '☎️', '📞', '📧', '📨', '📩', '📤', '📥', '🗓️', '📋', '📄', '📃', '☕', '🍵', '🥤', '🍕', '🍔', '🍟', '🎯', '📌', '🕐']
  },
  {
    label: 'Places',
    emojis: [
      '🗺️', '🌍', '🌎', '🌏', '🧭', '📍', '📌', '🗾', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️',
      '🏟️', '🏛️', '🏗️', '🏘️', '🏙️', '🌆', '🌇', '🌃', '🌉', '🌁', '🌌',
      '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍',
      '✈️', '🛫', '🛬', '🛩️', '🚁', '🚀', '🛸', '⛵', '🚢', '🛥️', '⛴️', '🚂', '🚆', '🚇', '🚊', '🚉', '🚌', '🚕', '🚗', '🚙', '🚐', '🚛', '🏍️', '🚲', '🛵', '🛴',
      '🚦', '🚥', '🛣️', '🛤️', '⛽', '🚧', '⚓', '⛱️'
    ]
  },
  {
    label: 'Flags',
    emojis: [
      '🇮🇳', '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇯🇵', '🇨🇳', '🇰🇷', '🇸🇬', '🇦🇪', '🇸🇦',
      '🇧🇷', '🇲🇽', '🇷🇺', '🇿🇦', '🇳🇱', '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮', '🇨🇭', '🇮🇪', '🇧🇪', '🇵🇹', '🇬🇷', '🇹🇷',
      '🇮🇱', '🇳🇿', '🇹🇭', '🇮🇩', '🇲🇾', '🇻🇳', '🇵🇭', '🇵🇰', '🇧🇩', '🇱🇰', '🇳🇵', '🇧🇹', '🇲🇻', '🇦🇫', '🇮🇷',
      '🇮🇶', '🇰🇼', '🇶🇦', '🇴🇲', '🇯🇴', '🇸🇾', '🇱🇧', '🇾🇪', '🇪🇬', '🇰🇪', '🇳🇬', '🇬🇭', '🇪🇹', '🇹🇿', '🇺🇬',
      '🇦🇷', '🇨🇱', '🇨🇴', '🇵🇪', '🇻🇪', '🇺🇾', '🇵🇱', '🇦🇹', '🇨🇿', '🇭🇺', '🇷🇴', '🇺🇦', '🇧🇬', '🇭🇷', '🇷🇸',
      '🇮🇸', '🇱🇺', '🇲🇹', '🇨🇾', '🇪🇺', '🇺🇳',
      '🏁', '🚩', '🏳️', '🏴', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️'
    ]
  }
];

const EmojiPicker = ({ onPick, align = 'left', direction = 'down' }) => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(0);
  const ref = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // Convert text emojis to SVG images via Twemoji when the grid renders/changes
  useEffect(() => {
    if (!open || !gridRef.current) return;
    if (typeof window !== 'undefined' && window.twemoji) {
      window.twemoji.parse(gridRef.current, {
        folder: 'svg',
        ext: '.svg',
        className: 'twemoji-img'
      });
    }
  }, [open, category]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition"
        title="Add emoji"
      >
        <Smile size={18} />
      </button>

      {open && (
        <div
          className={`absolute z-[100] w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-1'}`}
        >
          {/* Category tabs (wrap to multiple rows if needed) */}
          <div className="flex flex-wrap border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40">
            {CATEGORIES.map((c, i) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setCategory(i)}
                className={`px-2.5 py-2 text-[10px] font-semibold uppercase whitespace-nowrap transition ${
                  category === i
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 bg-white dark:bg-slate-800'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div ref={gridRef} className="max-h-56 overflow-y-auto p-2 grid grid-cols-8 gap-1 [&_.twemoji-img]:w-6 [&_.twemoji-img]:h-6 [&_.twemoji-img]:inline">
            {CATEGORIES[category].emojis.map((e, i) => (
              <button
                key={`${category}-${i}`}
                type="button"
                onClick={() => {
                  onPick(e);
                  // Keep open for chaining, close on click outside
                }}
                className="text-xl leading-none p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-500/10 transition emoji"
                style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","EmojiOne Color","Twemoji Mozilla",sans-serif' }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
