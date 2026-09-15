import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, Users, UserCog, Shield, Settings, Clock, CalendarDays, ClipboardList,
  ListChecks, CheckSquare, Menu
} from "lucide-react";

const NAV_BY_ROLE = {
  employee: [
    { path: "/dashboard",     label: "Home",    Icon: Home },
    { path: "/my-tasks",      label: "Tasks",   Icon: ClipboardList },
    { path: "/my-attendance", label: "Attend",  Icon: Clock },
    { path: "/profile",       label: "Profile", Icon: UserCog }
  ],
  manager: [
    { path: "/dashboard",       label: "Home",    Icon: Home },
    { path: "/my-team",         label: "Team",    Icon: Users },
    { path: "/task-management", label: "Tasks",   Icon: ListChecks },
    { path: "/approvals",       label: "Approve", Icon: CheckSquare }
  ],
  hr: [
    { path: "/dashboard",        label: "Home",   Icon: Home },
    { path: "/employees",        label: "Staff",  Icon: Users },
    { path: "/attendance",       label: "Attend", Icon: Clock },
    { path: "/leave-management", label: "Leave",  Icon: CalendarDays }
  ],
  admin: [
    { path: "/dashboard",       label: "Home",    Icon: Home },
    { path: "/user-management", label: "Users",   Icon: UserCog },
    { path: "/attendance",      label: "Attend",  Icon: Clock },
    { path: "/approvals",       label: "Approve", Icon: CheckSquare }
  ],
  superadmin: [
    { path: "/dashboard",       label: "Home",     Icon: Home },
    { path: "/user-management", label: "Users",    Icon: UserCog },
    { path: "/role-management", label: "Roles",    Icon: Shield },
    { path: "/system-settings", label: "Settings", Icon: Settings }
  ]
};

const BottomNav = ({ user, onOpenMore }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const role = (user?.roleId?.name || user?.role || "employee").toLowerCase();
  const items = NAV_BY_ROLE[role] || NAV_BY_ROLE.employee;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.08)] z-40 lg:hidden pb-[env(safe-area-inset-bottom)]"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around px-1 py-1">
        {items.map((item) => {
          const active = pathname === item.path;
          const Icon = item.Icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 flex-1 px-1 py-1.5 rounded-lg transition-all ${
                active ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-100"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <div className={`relative ${active ? "-translate-y-0.5" : ""} transition-transform`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                )}
              </div>
              <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onOpenMore}
          className="flex flex-col items-center gap-0.5 flex-1 px-1 py-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-100 transition-all"
          aria-label="Open more menu"
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
