import React, { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

/**
 * Instagram / Messenger–style reaction control.
 * - Single trigger button (heart or your chosen emoji).
 * - Hover / focus opens a floating pill with 6 emojis; click one to react.
 * - Below: compact summary "❤️👍😂 · 5" — click to expand reactor list.
 *
 * Props:
 *   reactions: [{ userId, userName, emoji, reactedAt }]  (announcement/comment reactions)
 *   likes:     [{ userId, userName }]                    (optional — merged as ❤️)
 *   currentUserId
 *   onReact(emoji)      — toggle a reaction
 *   onLike()            — optional; toggle ❤️ (backwards-compat with the legacy Like array)
 *   size: 'sm' | 'md'
 */
const ReactionButton = ({
  reactions = [],
  likes = null,
  currentUserId,
  onReact,
  onLike,
  size = 'md',
  align = 'left'
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const enterTimer = useRef(null);
  const leaveTimer = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!listOpen) return;
    const onDoc = (e) => { if (listRef.current && !listRef.current.contains(e.target)) setListOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [listOpen]);

  const openPicker = () => {
    clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(() => setPickerOpen(true), 250);
  };
  const closePicker = () => {
    clearTimeout(enterTimer.current);
    leaveTimer.current = setTimeout(() => setPickerOpen(false), 200);
  };

  // Merge legacy likes as an ❤️ reaction so everything renders uniformly
  const merged = [
    ...(reactions || []),
    ...((likes || []).map((l) => ({ ...l, emoji: '❤️' })))
  ];

  const totalCount = merged.length;
  const myReaction = merged.find((r) => String(r.userId) === String(currentUserId));

  // Group by emoji → { emoji, count, users[] }
  const groupedMap = new Map();
  for (const r of merged) {
    if (!groupedMap.has(r.emoji)) groupedMap.set(r.emoji, { emoji: r.emoji, count: 0, users: [] });
    const g = groupedMap.get(r.emoji);
    g.count += 1;
    g.users.push(r.userName || 'User');
  }
  const grouped = [...groupedMap.values()].sort((a, b) => b.count - a.count);
  const topEmojis = grouped.slice(0, 3).map((g) => g.emoji);

  const handlePick = (emoji) => {
    setPickerOpen(false);
    if (emoji === '❤️' && onLike && !onReact) {
      onLike();
    } else {
      onReact?.(emoji);
    }
  };

  const handleTriggerClick = () => {
    // Default quick-tap: if user has a reaction, remove it; otherwise like with ❤️
    if (myReaction) {
      if (myReaction.emoji === '❤️' && onLike) onLike();
      else onReact?.(myReaction.emoji);
    } else if (onLike) {
      onLike();
    } else {
      onReact?.('❤️');
    }
  };

  const btnSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 12 : 16;

  return (
    <div
      className="relative inline-flex items-center gap-2"
      onMouseEnter={openPicker}
      onMouseLeave={closePicker}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={handleTriggerClick}
        className={`inline-flex items-center gap-1 font-medium transition ${btnSize} ${
          myReaction ? 'text-red-500' : 'text-gray-500 dark:text-slate-400 hover:text-red-500'
        }`}
        title={myReaction ? 'Remove reaction' : 'Like'}
      >
        {myReaction ? (
          <span className="text-base leading-none">{myReaction.emoji}</span>
        ) : (
          <Heart size={iconSize} />
        )}
        <span>{totalCount}</span>
      </button>

      {/* Compact summary + who-reacted popover */}
      {totalCount > 0 && (
        <span className="relative inline-flex items-center gap-1" ref={listRef}>
          <button
            type="button"
            onClick={() => setListOpen(!listOpen)}
            className="inline-flex items-center gap-0.5 text-[11px] text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-slate-700 rounded-full px-2 py-0.5 bg-white dark:bg-slate-800"
            title="Who reacted?"
          >
            <span className="leading-none">{topEmojis.join('')}</span>
          </button>
          {listOpen && (
            <div className={`absolute z-40 top-full mt-1 w-60 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl p-2 max-h-56 overflow-y-auto ${align === 'right' ? 'right-0' : 'left-0'}`}>
              <div className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {totalCount} reaction{totalCount !== 1 ? 's' : ''}
              </div>
              {grouped.map((g) => (
                <div key={g.emoji} className="mb-2 last:mb-0">
                  <div className="text-[11px] font-semibold text-gray-700 dark:text-slate-200 mb-1">
                    {g.emoji} <span className="text-gray-400 dark:text-slate-500 font-normal">({g.count})</span>
                  </div>
                  <ul className="pl-5 space-y-0.5">
                    {g.users.map((n, i) => (
                      <li key={i} className="text-xs text-gray-700 dark:text-slate-200 truncate">{n}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </span>
      )}

      {/* Floating picker */}
      {pickerOpen && (
        <div
          className={`absolute z-50 bottom-full mb-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-2xl px-2 py-1.5 flex items-center gap-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onMouseEnter={openPicker}
          onMouseLeave={closePicker}
        >
          {REACTIONS.map((e) => {
            const mine = myReaction?.emoji === e;
            return (
              <button
                key={e}
                type="button"
                onClick={() => handlePick(e)}
                className={`text-2xl leading-none px-1.5 rounded-full transition-transform hover:scale-125 hover:bg-gray-50 dark:hover:bg-slate-700/50 ${mine ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-500/10' : ''}`}
                title={mine ? 'Remove' : `React ${e}`}
              >
                {e}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReactionButton;
