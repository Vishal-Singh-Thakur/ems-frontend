import React from "react";
import { Search } from "lucide-react";
import ProfilePopup from "../ProfilePopup";
import NotificationBell from "../NotificationBell";
import EmsLogo from "../EmsLogo";

const Navbar = ({ user, onLogout }) => {
  const firstName = user?.name?.split(' ')[0] || user?.name || 'User';
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 gap-2">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
          {/* EMS logo — only on mobile (sidebar shows logo on desktop) */}
          <EmsLogo size={36} className="lg:hidden flex-shrink-0 drop-shadow-sm" />
          <div className="min-w-0 flex-1">
            {/* Full name on md+, first name on mobile */}
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-slate-100 truncate">
              <span className="hidden sm:inline">Welcome back, {user?.name}</span>
              <span className="sm:hidden">Hi, {firstName}</span>
              <span aria-hidden> 👋</span>
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 dark:text-slate-400 truncate">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">
          {/* Search - hidden on mobile & sm, visible on md+ */}
          <div className="hidden md:flex items-center space-x-2 px-3 lg:px-4 py-2 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
            <Search size={18} className="text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm w-40 lg:w-64"
            />
          </div>

          <NotificationBell />
          <ProfilePopup onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
