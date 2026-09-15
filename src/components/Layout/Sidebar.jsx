import React, { useEffect, useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { getMenuSectionsByRole } from "../../Utils/menuUtils";
import ApiHit from "../../Utils/ApiHit";
import { UnreadCountAPI } from "../Constant/Api/Api";
import EmsLogo from "../EmsLogo";

const Sidebar = ({ user, sidebarOpen, setSidebarOpen, onNavigate }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const role =
    (user?.roleId?.name || user?.role || user?.userType || 'employee').toLowerCase();
  const permissions = user?.roleId?.permissions || user?.permissions || [];

  const sections = getMenuSectionsByRole(role, permissions);
  const initials = (user?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const r = await ApiHit(UnreadCountAPI, "GET");
        if (r?.success) setUnreadCount(r.count || 0);
      } catch { /* ignore */ }
    };
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => clearInterval(t);
  }, [currentPath]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden transition-opacity
        ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-slate-200 shadow-xl transform
        transition-transform duration-300 flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <EmsLogo size={36} className="drop-shadow-md" />
            <div className="leading-tight">
              <div className="text-lg font-bold text-white tracking-tight">EMS</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Employee Management</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="px-3 mb-2 text-[10px] font-semibold text-slate-500 tracking-wider">
                {section.title}
              </div>
              <ul className="space-y-1">
                {section.items.map((item, iIdx) => {
                  const isActive = currentPath === item.path;
                  const showBadge = item.path === '/notifications' && unreadCount > 0;
                  return (
                    <li key={iIdx}>
                      <button
                        onClick={() => {
                          onNavigate(item.path);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition text-sm
                          ${isActive
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                          }`}
                      >
                        <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                        <span className="font-medium flex-1">{item.label}</span>
                        {showBadge && (
                          <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                        {isActive && !showBadge && <ChevronRight size={14} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4 flex-shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</div>
              <div className="text-[11px] text-slate-400 truncate">{displayRole}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
