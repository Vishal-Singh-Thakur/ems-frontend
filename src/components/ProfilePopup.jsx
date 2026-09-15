import React, { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";

const ProfilePopup = ({ onLogout }) => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      console.log('User data in ProfilePopup:', parsedUser);
    }
  }, []);

  // Role extract karo
  const userRole = user?.roleId?.name || user?.role || 'N/A';
  const userType = user?.roleId?.roleType || user?.userType || 'N/A';

  // Date formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-2 hover:opacity-80 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center shadow-md">
            <span className="text-lg text-white font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>

          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {user?.email || "No email"}
            </p>
          </div>
        </div>
      </button>

      {/* Popup Dropdown */}
      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 p-4 sm:p-5 z-50">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white text-xl font-bold shadow-lg">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-base">
                  {user?.name || "User"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {user?.email || "No email"}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {user?.gender}
                </p>
              </div>
            </div>

            {/* User Details */}
            <div className="text-sm text-gray-700 dark:text-slate-200 space-y-2 mb-5">
              {user?.employeeId && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600 dark:text-slate-300">Employee ID:</span>
                  <span className="text-gray-900 dark:text-slate-100 font-mono">{user.employeeId}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-slate-300">Role:</span>
                <span className="text-gray-900 dark:text-slate-100 font-semibold capitalize">
                  {userRole}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-slate-300">Department:</span>
                <span className="text-gray-900 dark:text-slate-100">
                  {user?.departmentId?.name || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-slate-300">Designation:</span>
                <span className="text-gray-900 dark:text-slate-100">
                  {user?.jobRoleId?.name || 'N/A'}
                </span>
              </div>

              {user?.createdAt && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600 dark:text-slate-300">Member since:</span>
                  <span className="text-gray-900 dark:text-slate-100 text-xs">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              )}

              {user?.lastLogin && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600 dark:text-slate-300">Last login:</span>
                  <span className="text-gray-900 dark:text-slate-100 text-xs">
                    {formatDate(user.lastLogin)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600 dark:text-slate-300">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user?.isActive
                  ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300'
                  }`}>
                  {user?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <LogoutButton onLogout={onLogout} />
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePopup;