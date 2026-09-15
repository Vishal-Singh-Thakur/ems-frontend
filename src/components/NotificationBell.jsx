import React, { useEffect, useRef, useState } from "react";
import { Bell, Check, Calendar, Megaphone, ListChecks, X, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ApiHit from "../Utils/ApiHit";
import { GetNotificationsAPI, UnreadCountAPI, MarkReadAPI, MarkAllReadAPI } from "./Constant/Api/Api";

const TYPE_STYLE = {
  leave_applied: { icon: <Calendar size={16} />, color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15' },
  leave_approved: { icon: <Calendar size={16} />, color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/15' },
  leave_rejected: { icon: <Calendar size={16} />, color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/15' },
  announcement: { icon: <Megaphone size={16} />, color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15' },
  task_assigned: { icon: <ListChecks size={16} />, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/15' },
  task_status_update: { icon: <ListChecks size={16} />, color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/15' },
  recruitment: { icon: <Briefcase size={16} />, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/15' }
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const fetchCount = async () => {
    try {
      const r = await ApiHit(UnreadCountAPI, "GET");
      if (r?.success) setCount(r.count || 0);
    } catch { /* ignore */ }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const r = await ApiHit(GetNotificationsAPI + "?limit=8", "GET");
      if (r?.success) setItems(r.data?.docs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchList();
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleClickItem = async (n) => {
    if (!n.isRead) {
      await ApiHit(MarkReadAPI, "POST", { ids: [n._id] });
      setCount(Math.max(0, count - 1));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    await ApiHit(MarkAllReadAPI, "POST");
    setCount(0);
    setItems(items.map((x) => ({ ...x, isRead: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      >
        <Bell size={20} className="text-gray-600 dark:text-slate-300" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 dark:bg-slate-900/40">
            <div className="font-semibold text-gray-800 dark:text-slate-100 text-sm">Notifications</div>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Check size={12} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400 dark:text-slate-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={28} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                <div className="text-xs text-gray-400 dark:text-slate-500">No notifications yet</div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                {items.map((n) => {
                  const style = TYPE_STYLE[n.type] || { icon: <Bell size={16} />, color: 'text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700/50' };
                  return (
                    <li key={n._id}>
                      <button
                        onClick={() => handleClickItem(n)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition flex gap-3 items-start ${!n.isRead ? 'bg-blue-50/40 dark:bg-blue-500/10' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full ${style.color} flex items-center justify-center flex-shrink-0`}>
                          {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{n.title}</div>
                          <div className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2">{n.message}</div>
                          <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">{timeAgo(n.createdAt)}</div>
                        </div>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t bg-gray-50 dark:bg-slate-900/40 px-4 py-2 text-center">
            <button
              onClick={() => { setOpen(false); navigate('/notifications'); }}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
