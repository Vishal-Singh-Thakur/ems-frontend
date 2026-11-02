import React, { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";

// One dashboard per role, and a reader only ever sees theirs.
//
// Imported lazily so that is also true of the download: bundled together the
// five come to roughly half a megabyte, mostly the charting library, and an
// employee would pay for the superadmin's charts to render their own. Each is
// now its own chunk, and recharts — shared by all five — becomes a chunk they
// all point at rather than a copy inside each.

const SuperAdminDashboard = lazy(() => import("../components/Dashboards/SuperAdminDashboard"));
const AdminDashboard      = lazy(() => import("../components/Dashboards/AdminDashboard"));
const HrDashboard         = lazy(() => import("../components/Dashboards/HRDashboard"));
const ManagerDashboard    = lazy(() => import("../components/Dashboards/ManagerDashboard"));
const EmployeeDashboard   = lazy(() => import("../components/Dashboards/EmployeeDashboard"));

const DashboardLoader = () => (
  <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
    <div className="h-8 w-8 rounded-full border-2 border-gray-300 dark:border-slate-600 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
    <span className="sr-only">Loading your dashboard…</span>
  </div>
);

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || 'null');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role =
    user?.roleId?.name?.toLowerCase() ||
    user?.role?.toLowerCase() ||
    user?.userType?.toLowerCase();

  const For = {
    superadmin: SuperAdminDashboard,
    admin: AdminDashboard,
    hr: HrDashboard,
    manager: ManagerDashboard
  }[role] || EmployeeDashboard;

  return (
    <Suspense fallback={<DashboardLoader />}>
      <For user={user} />
    </Suspense>
  );
};

export default Dashboard;
