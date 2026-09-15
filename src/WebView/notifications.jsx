import React, { useEffect, useState } from "react";
import { Bell, Check, Calendar, Megaphone, ListChecks, CheckCheck, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ApiHit from "../Utils/ApiHit";
import { GetNotificationsAPI, MarkReadAPI, MarkAllReadAPI } from "../components/Constant/Api/Api";

const TYPE_META = {
  leave_applied: { label: 'Leave', icon: <Calendar size={16} />, color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15' },
  leave_approved: { label: 'Leave', icon: <Calendar size={16} />, color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/15' },
  leave_rejected: { label: 'Leave', icon: <Calendar size={16} />, color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/15' },
  announcement: { label: 'Announcement', icon: <Megaphone size={16} />, color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15' },
  task_assigned: { label: 'Task', icon: <ListChecks size={16} />, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/15' },
  task_status_update: { label: 'Task', icon: <ListChecks size={16} />, color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/15' },
  recruitment: { label: 'Recruitment', icon: <Briefcase size={16} />, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/15' }
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const url = filter === 'unread'
        ? `${GetNotificationsAPI}?unreadOnly=true&limit=100`
        : `${GetNotificationsAPI}?limit=100`;
      const r = await ApiHit(url, "GET");
      if (r?.success) setItems(r.data?.docs || []);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll(); }, [filter]);

  const handleClick = async (n) => {
    if (!n.isRead) {
      await ApiHit(MarkReadAPI, "POST", { ids: [n._id] });
    }
    if (n.link) navigate(n.link);
    else fetchAll();
  };

  const handleMarkAllRead = async () => {
    await ApiHit(MarkAllReadAPI, "POST");
    fetchAll();
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Bell className="text-blue-600 dark:text-blue-400" /> Notifications
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Latest activity from across the app.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` }
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  filter === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-1.5 rounded-lg text-gray-700 dark:text-slate-200"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400 dark:text-slate-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <Bell size={40} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
            <div className="text-gray-500 dark:text-slate-400 font-medium">Nothing here yet</div>
            <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              {filter === 'unread' ? "You're all caught up!" : 'New notifications will show up here.'}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-slate-800">
            {items.map((n) => {
              const meta = TYPE_META[n.type] || { label: 'Info', icon: <Bell size={16} />, color: 'text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700/50' };
              return (
                <li key={n._id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition flex gap-4 items-start ${!n.isRead ? 'bg-blue-50/40 dark:bg-blue-500/10' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full ${meta.color} flex items-center justify-center flex-shrink-0`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                      <div className="text-sm font-medium text-gray-800 dark:text-slate-100">{n.title}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{n.message}</div>
                      <div className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">{timeAgo(n.createdAt)}</div>
                    </div>
                    {!n.isRead && (
                      <span className="text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center gap-1 flex-shrink-0">
                        <Check size={12} /> Mark read
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
};

export default Notifications;
