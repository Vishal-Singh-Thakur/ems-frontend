import React from "react";
import SuperAdminDashboard from "../components/Dashboards/SuperAdminDashboard";
import AdminDashboard from "../components/Dashboards/AdminDashboard";
import HrDashboard from "../components/Dashboards/HRDashboard";
import ManagerDashboard from "../components/Dashboards/ManagerDashboard";
import EmployeeDashboard from "../components/Dashboards/EmployeeDashboard";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || 'null');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role =
    user?.roleId?.name?.toLowerCase() ||
    user?.role?.toLowerCase() ||
    user?.userType?.toLowerCase();

  switch (role) {
    case 'superadmin':
      return <SuperAdminDashboard user={user} />;
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'hr':
      return <HrDashboard user={user} />;
    case 'manager':
      return <ManagerDashboard user={user} />;
    default:
      return <EmployeeDashboard user={user} />;
  }
};

export default Dashboard;


