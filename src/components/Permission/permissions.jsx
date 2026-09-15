import React, { useState } from "react";

const PermissionsManager = ({ selectedPermissions = [], onChange, disabled = false }) => {
  // Modules & actions — must match ems-backend/general-service/constants/permissions.js keys.
  const MODULES = [
    { name: "Dashboard",       key: "dashboard",     permissions: ["view"] },
    { name: "Employees",       key: "employees",     permissions: ["view", "manage"] },
    { name: "Users",           key: "users",         permissions: ["view", "manage", "delete", "password"] },
    { name: "Departments",     key: "departments",   permissions: ["view", "manage"] },
    { name: "Designations",    key: "designations",  permissions: ["view", "manage"] },
    { name: "Roles",           key: "roles",         permissions: ["manage"] },
    { name: "Org Tree",        key: "orgtree",       permissions: ["view"] },
    { name: "Attendance",      key: "attendance",    permissions: ["view", "mark"] },
    { name: "Leaves",          key: "leaves",        permissions: ["view", "apply", "approve"] },
    { name: "WFH",             key: "wfh",           permissions: ["apply"] },
    { name: "Shifts",          key: "shifts",        permissions: ["view"] },
    { name: "Tasks",           key: "tasks",         permissions: ["view", "manage"] },
    { name: "My Tasks",        key: "mytasks",       permissions: ["view"] },
    { name: "Performance",     key: "performance",   permissions: ["view"] },
    { name: "Reports",         key: "reports",       permissions: ["view"] },
    { name: "Payroll",         key: "payroll",       permissions: ["view"] },
    { name: "Assets",          key: "assets",        permissions: ["view"] },
    { name: "Documents",       key: "documents",     permissions: ["view"] },
    { name: "Recruitment",     key: "recruitment",   permissions: ["view", "manage"] },
    { name: "Team",            key: "team",          permissions: ["manage"] },
    { name: "Approvals",       key: "approvals",     permissions: ["view"] },
    { name: "Announcements",   key: "announcements", permissions: ["view", "manage"] },
    { name: "Holidays",        key: "holidays",      permissions: ["view", "manage"] },
    { name: "Notifications",   key: "notifications", permissions: ["view"] },
    { name: "System Logs",     key: "system.logs",   permissions: ["view"] },
    { name: "System Settings", key: "system.settings", permissions: ["view"] },
    { name: "My Attendance",   key: "myattendance",  permissions: ["view"] },
    { name: "Time Off",        key: "timeoff",       permissions: ["view"] },
    { name: "Profile",         key: "profile",       permissions: ["view"] }
  ];

  const PERMISSION_LABELS = {
    view:     "View",
    manage:   "Manage",
    delete:   "Delete",
    apply:    "Apply",
    approve:  "Approve",
    mark:     "Mark",
    password: "Reset Password"
  };

  // Check if a specific permission is selected
  const isPermissionSelected = (moduleKey, permission) => {
    return selectedPermissions.includes(`${moduleKey}.${permission}`);
  };

  // Toggle individual permission
  const togglePermission = (moduleKey, permission) => {
    if (disabled) return;

    const permissionKey = `${moduleKey}.${permission}`;
    let newPermissions;

    if (selectedPermissions.includes(permissionKey)) {
      newPermissions = selectedPermissions.filter(p => p !== permissionKey);
    } else {
      newPermissions = [...selectedPermissions, permissionKey];
    }

    onChange(newPermissions);
  };

  // Select all permissions for a module
  const selectAllForModule = (moduleKey, permissions) => {
    if (disabled) return;

    const modulePermissions = permissions.map(p => `${moduleKey}.${p}`);
    const allSelected = modulePermissions.every(p => selectedPermissions.includes(p));

    let newPermissions;
    if (allSelected) {
      // Deselect all
      newPermissions = selectedPermissions.filter(p => !p.startsWith(`${moduleKey}.`));
    } else {
      // Select all
      const existingWithoutModule = selectedPermissions.filter(p => !p.startsWith(`${moduleKey}.`));
      newPermissions = [...existingWithoutModule, ...modulePermissions];
    }

    onChange(newPermissions);
  };

  // Check if all permissions are selected for a module
  const isModuleFullySelected = (moduleKey, permissions) => {
    return permissions.every(p => selectedPermissions.includes(`${moduleKey}.${p}`));
  };

  // Select all permissions across all modules
  const selectAll = () => {
    if (disabled) return;

    const allPermissions = MODULES.flatMap(module =>
      module.permissions.map(p => `${module.key}.${p}`)
    );

    if (selectedPermissions.length === allPermissions.length) {
      onChange([]);
    } else {
      onChange(allPermissions);
    }
  };

  return (
    <div className="w-full">
      {/* Header with Select All */}
      <div className="flex justify-between items-center mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-slate-200">
          Access Permissions
        </label>
        <button
          type="button"
          onClick={selectAll}
          disabled={disabled}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedPermissions.length === MODULES.flatMap(m => m.permissions.map(p => `${m.key}.${p}`)).length
            ? "Deselect All"
            : "Select All"}
        </button>
      </div>

      {/* Permissions Table */}
      <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider border-b">
                  Module
                </th>
                {["View", "Create", "Edit", "Delete", "Export"].map((label) => (
                  <th
                    key={label}
                    className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider border-b"
                  >
                    {label}
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider border-b">
                  All
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {MODULES.map((module) => (
                <tr key={module.key} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-slate-100">
                    {module.name}
                  </td>
                  
                  {/* Permission checkboxes */}
                  {["view", "create", "edit", "delete", "export"].map((permission) => (
                    <td key={permission} className="px-3 py-3 text-center">
                      {module.permissions.includes(permission) ? (
                        <input
                          type="checkbox"
                          checked={isPermissionSelected(module.key, permission)}
                          onChange={() => togglePermission(module.key, permission)}
                          disabled={disabled}
                          className="w-4 h-4 text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      ) : (
                        <span className="text-gray-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                  ))}
                  
                  {/* Select All for Module */}
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isModuleFullySelected(module.key, module.permissions)}
                      onChange={() => selectAllForModule(module.key, module.permissions)}
                      disabled={disabled}
                      className="w-4 h-4 text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Count */}
      <div className="mt-3 text-xs text-gray-600 dark:text-slate-300">
        {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? "s" : ""} selected
      </div>
    </div>
  );
};

export default PermissionsManager;