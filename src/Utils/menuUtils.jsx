import { LayoutDashboard, Users, UserCog, Building2, IdCard, Shield, Clock, CalendarDays, CalendarClock, ListChecks, TrendingUp, BarChart3, Wallet, Briefcase, FileText, ReceiptText, Megaphone, PartyPopper, Bell, Search as SearchIcon, Activity, Settings, CheckSquare, ClipboardList, Network, UserPlus, UserMinus } from "lucide-react";
import React from "react";

// Menu items are gated by both `roles` (legacy fallback) and `permission`.
// If the user has permission '*' OR the item's permission → the item is visible.
// If the item has no permission set, we fall back to role check.

const ALL = ['superadmin', 'admin', 'hr', 'manager', 'employee'];

const MENU_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      { icon: <LayoutDashboard size={18} />, label: 'Dashboard',        path: '/dashboard',        permission: 'dashboard.view',        roles: ALL },
      { icon: <Users size={18} />,           label: 'Employees',        path: '/employees',        permission: 'employees.view',        roles: ['superadmin', 'admin', 'hr'] },
      { icon: <UserCog size={18} />,         label: 'User Management',  path: '/user-management',  permission: 'users.view',            roles: ['superadmin', 'admin', 'hr'] },
      { icon: <Building2 size={18} />,       label: 'Departments',      path: '/departments',      permission: 'departments.view',      roles: ['superadmin', 'admin', 'hr'] },
      { icon: <IdCard size={18} />,          label: 'Designations',     path: '/designations',     permission: 'designations.view',     roles: ['superadmin', 'admin', 'hr'] },
      { icon: <Shield size={18} />,          label: 'Roles & Permissions', path: '/role-management', permission: 'roles.view',         roles: ['superadmin', 'admin'] },
      { icon: <Network size={18} />,         label: 'Organization Tree', path: '/org-tree',        permission: 'orgtree.view',          roles: ALL }
    ]
  },
  {
    title: 'ATTENDANCE & LEAVE',
    items: [
      { icon: <Clock size={18} />,           label: 'Attendance',       path: '/attendance',       permission: 'attendance.view',       roles: ['superadmin', 'admin', 'hr', 'manager'] },
      { icon: <CalendarDays size={18} />,    label: 'Leave Management', path: '/leave-management', permission: 'leaves.view',           roles: ['superadmin', 'admin', 'hr', 'manager'] },
      { icon: <CalendarClock size={18} />,   label: 'Shift Management', path: '/shift-management', permission: 'shifts.view',           roles: ['superadmin', 'admin', 'hr', 'manager'] }
    ]
  },
  {
    title: 'PERFORMANCE',
    items: [
      { icon: <ListChecks size={18} />,      label: 'Tasks',            path: '/task-management',  permission: 'tasks.view',            roles: ['superadmin', 'admin', 'manager'] },
      { icon: <TrendingUp size={18} />,      label: 'Performance',      path: '/performance',      permission: 'performance.view',      roles: ['superadmin', 'admin', 'hr', 'manager'] },
      { icon: <BarChart3 size={18} />,       label: 'KPI Reports',      path: '/reports',          permission: 'reports.view',          roles: ['superadmin', 'admin', 'manager'] }
    ]
  },
  {
    title: 'ASSETS & FINANCE',
    items: [
      { icon: <Wallet size={18} />,          label: 'Payroll',          path: '/payroll',          permission: 'payroll.view',          roles: ['superadmin', 'admin', 'hr'] },
      { icon: <ReceiptText size={18} />,     label: 'Expenses',         path: '/expenses',         permission: 'expenses.apply',        roles: ALL, roleFallback: true },
      { icon: <Briefcase size={18} />,       label: 'Assets',           path: '/assets',           permission: null,                    roles: ALL, roleFallback: true },
      { icon: <FileText size={18} />,        label: 'Documents',        path: '/documents',        permission: 'documents.view',        roles: ALL, roleFallback: true }
    ]
  },
  {
    title: 'RECRUITMENT & TEAM',
    items: [
      { icon: <SearchIcon size={18} />,      label: 'Recruitment',      path: '/recruitment',      permission: 'recruitment.view',      roles: ['superadmin', 'admin', 'hr'] },
      { icon: <UserPlus size={18} />,        label: 'Onboarding',       path: '/onboarding',       permission: 'onboarding.view',       roles: ['superadmin', 'admin', 'hr', 'manager'] },
      { icon: <UserMinus size={18} />,       label: 'Offboarding',      path: '/offboarding',      permission: 'offboarding.view',      roles: ['superadmin', 'admin', 'hr', 'manager'] },
      { icon: <Users size={18} />,           label: 'Team Hierarchy',   path: '/team-management',  permission: 'team.manage',           roles: ['superadmin', 'hr'] },
      { icon: <UserPlus size={18} />,        label: 'My Onboarding',    path: '/onboarding',       permission: 'checklist.my',          roles: ['employee'], roleFallback: true },
      { icon: <Users size={18} />,           label: 'My Team',          path: '/my-team',          permission: 'myteam.view',           roles: ['manager'], roleFallback: true },
      { icon: <CheckSquare size={18} />,     label: 'Approvals',        path: '/approvals',        permission: 'approvals.view',        roles: ['superadmin', 'admin', 'manager'] }
    ]
  },
  {
    title: 'OTHERS',
    items: [
      { icon: <Megaphone size={18} />,       label: 'Announcements',    path: '/announcements',    permission: 'announcements.view',    roles: ALL },
      { icon: <PartyPopper size={18} />,     label: 'Holidays',         path: '/holidays',         permission: 'holidays.view',         roles: ALL },
      { icon: <Bell size={18} />,            label: 'Notifications',    path: '/notifications',    permission: 'notifications.view',    roles: ALL },
      { icon: <Activity size={18} />,        label: 'Audit Logs',       path: '/system-logs',      permission: 'system.logs.view',      roles: ['superadmin'] },
      { icon: <Settings size={18} />,        label: 'Settings',         path: '/system-settings',  permission: 'system.settings.view',  roles: ['superadmin', 'admin'] }
    ]
  },
  {
    title: 'EMPLOYEE SELF-SERVICE',
    items: [
      { icon: <ClipboardList size={18} />,   label: 'My Tasks',         path: '/my-tasks',         permission: 'mytasks.view',          roles: ['employee'] },
      { icon: <CalendarDays size={18} />,    label: 'Time Off',         path: '/time-off',         permission: 'timeoff.view',          roles: ['employee'] },
      { icon: <Clock size={18} />,           label: 'My Attendance',    path: '/my-attendance',    permission: 'myattendance.view',     roles: ['employee'] },
      { icon: <Wallet size={18} />,          label: 'My Payslips',      path: '/my-payslips',      permission: 'mypayslips.view',       roles: ALL, roleFallback: true },
      { icon: <UserCog size={18} />,         label: 'Profile',          path: '/profile',          permission: 'profile.view',          roles: ALL }
    ]
  }
];

// Prefer permission-based check when user has a permissions array.
// Items marked `roleFallback: true` are frontend-only (no backend permission yet),
// so they fall back to a pure role check even when the user has other permissions.
const hasAccess = (item, role, permissions) => {
  const perms = Array.isArray(permissions) ? permissions : [];
  const currentRole = (role || 'employee').toLowerCase();

  if (perms.includes('*')) return true;

  if (perms.length > 0) {
    if (item.permission && perms.includes(item.permission)) return true;
    if (item.roleFallback) return Array.isArray(item.roles) && item.roles.includes(currentRole);
    return false;
  }
  return Array.isArray(item.roles) && item.roles.includes(currentRole);
};

const getMenuSectionsByRole = (role, permissions) => {
  return MENU_SECTIONS
    .map((sec) => ({
      title: sec.title,
      items: sec.items.filter((it) => hasAccess(it, role, permissions))
    }))
    .filter((sec) => sec.items.length > 0);
};

const getMenuItemsByRole = (role, permissions) =>
  getMenuSectionsByRole(role, permissions).flatMap((sec) => sec.items);

export { getMenuSectionsByRole };
export default getMenuItemsByRole;
