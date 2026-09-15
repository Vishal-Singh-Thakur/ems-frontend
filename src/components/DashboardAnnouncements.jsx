import React, { useEffect, useState } from "react";
import { Megaphone, Heart, MessageCircle, ArrowRight, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ApiHit from "../Utils/ApiHit";
import { GetAnnouncementsAPI } from "./Constant/Api/Api";

const PRIORITY_DOT = {
  Normal: { color: 'bg-blue-500', icon: <Info size={12} /> },
  Important: { color: 'bg-amber-500', icon: <AlertCircle size={12} /> },
  Urgent: { color: 'bg-red-500', icon: <AlertTriangle size={12} /> }
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const DashboardAnnouncements = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const r = await ApiHit(GetAnnouncementsAPI, "GET");
        if (r?.success) setItems((r.data?.docs || []).slice(0, 4));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-slate-800 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <Megaphone size={16} className="text-blue-600 dark:text-blue-400" /> Announcements
        </h4>
        <button
          onClick={() => navigate('/announcements')}
          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View all <ArrowRight size={12} />
        </button>
      </div>

      {loading ? (
        <div className="text-xs text-gray-400 dark:text-slate-500 py-6 text-center">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-gray-400 dark:text-slate-500 py-6 text-center">
          <Megaphone size={28} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
          No announcements yet
        </div>
      ) : (
        <ul className="space-y-3 flex-1">
          {items.map((a) => {
            const dot = PRIORITY_DOT[a.priority] || PRIORITY_DOT.Normal;
            return (
              <li key={a._id}>
                <button
                  onClick={() => navigate('/announcements')}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition group"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 w-2 h-2 rounded-full ${dot.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {a.title}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2 mt-0.5">{a.message}</div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 dark:text-slate-500">
                        <span className="inline-flex items-center gap-0.5">
                          <Heart size={11} /> {a.likes?.length || 0}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <MessageCircle size={11} /> {a.comments?.length || 0}
                        </span>
                        <span>•</span>
                        <span>{timeAgo(a.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default DashboardAnnouncements;
