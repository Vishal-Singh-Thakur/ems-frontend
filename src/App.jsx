import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Navbar from "./components/Layout/Navbar";
import Sidebar from "./components/Layout/Sidebar";
import BottomNav from "./components/Layout/BottomNav";
import Dashboard from "./WebView/dashboard";
import AllUsersPage from "./WebView/UserManagement";
import SystemLogs from "./WebView/systemlogs";
import SystemSettings from "./WebView/systemsettings";
import Reports from "./WebView/reports";
import Employees from "./WebView/employees";
import LeaveManagement from "./WebView/leavemanagement";
import Attendance from "./WebView/attendance";
import Recruitment from "./WebView/recruitment";
import TeamManagement from "./WebView/teammanagement";
import TaskManagement from "./WebView/taskmanagement";
import Approvals from "./WebView/approvals";
import MyTasks from "./WebView/mytask";
import Profile from "./WebView/profile";
import EmployeeAttendance from "./WebView/employeeattendance";
import EmployeeTimeOff from "./WebView/employeetimeoff";
import Login from "./components/Login/Login";
import RoleManagement from "./WebView/rolemanagement";
import ForgotPassword from "./components/ForgotPassword";
import Unauthorized from "./WebView/unauthorized";
import ComingSoon from "./WebView/comingsoon";
import OrgTreePage from "./WebView/orgtree";
import Announcements from "./WebView/announcements";
import Notifications from "./WebView/notifications";
import Holidays from "./WebView/holidays";
import Departments from "./WebView/departments";
import Designations from "./WebView/designations";
import Performance from "./WebView/performance";
import WorkFromHome from "./WebView/workfromhome";
import ForcePasswordChangeModal from "./components/ForcePasswordChangeModal";
import ShiftManagement from "./WebView/shiftmanagement";
import MyTeam from "./WebView/myteam";
import Payroll from "./WebView/payroll";
import MyPayslips from "./WebView/mypayslips";
import Documents from "./WebView/documents";
import Onboarding from "./WebView/onboarding";
import Offboarding from "./WebView/offboarding";
import Expenses from "./WebView/expenses";
import Assets from "./WebView/assets";
import AssistantWidget from "./components/AssistantWidget";
import { MeAPI, LogoutAPI } from "./components/Constant/Api/Api";
import { applyTheme } from "./Utils/theme";
import { IdCard, Building2, CalendarClock, TrendingUp, Wallet, Briefcase, FileText, Megaphone, PartyPopper, Bell } from "lucide-react";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch(MeAPI, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setUser(data.data);
            setIsAuthenticated(true);
            if (data.data.theme) applyTheme(data.data.theme);
            localStorage.setItem('user', JSON.stringify(data.data));
          } else {
            localStorage.removeItem('user');
          }
        } else {
          localStorage.removeItem('user');
        }
      } catch {
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, []);

  useEffect(() => {
    if (user) {
      console.log('🔍 App user changed — mustChangePassword:', user?.mustChangePassword, user);
    }
  }, [user]);

  const handleLogin = async (userData) => {
    console.log('🔐 handleLogin — initial user from login:', userData);
    // Immediately re-fetch /me to guarantee we have the latest flags (mustChangePassword, permissions)
    try {
      const res = await fetch(MeAPI, { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          console.log('🔐 handleLogin — fresh /me:', data.data);
          if (data.data.theme) applyTheme(data.data.theme);
          localStorage.setItem('user', JSON.stringify(data.data));
          setUser(data.data);
          setIsAuthenticated(true);
          navigate('/dashboard');
          return;
        }
      }
    } catch (e) { /* fall through */ }
    // Fallback: use login response
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const ProtectedRoute = ({ children, allowedRoles, requiredPermission }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    const role = (user?.roleId?.name || user?.role || '').toLowerCase();
    const permissions = user?.roleId?.permissions || user?.permissions || [];
    const hasWildcard = permissions.includes('*');

    // Both gates apply when both are given — matches the backend, where a route
    // runs authorize(...) and checkPermission(...) in sequence.
    if (requiredPermission && permissions.length > 0 && !hasWildcard) {
      if (!permissions.includes(requiredPermission)) {
        return <Navigate to="/unauthorized" replace />;
      }
    }

    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(role)) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
    return children;
  };

  const handleLogout = async () => {
    try {
      await fetch(LogoutAPI, { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900/40 flex">
      {/* Mandatory password change on first login */}
      {isAuthenticated && user?.mustChangePassword && (
        <ForcePasswordChangeModal
          user={user}
          onDone={async () => {
            // Re-fetch /me so mustChangePassword flag becomes false
            try {
              const res = await fetch(MeAPI, { credentials: 'include' });
              if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) setUser(data.data);
              }
            } catch (_) {}
          }}
        />
      )}

      {/* Sidebar - only show when authenticated */}
      {isAuthenticated && (
        <Sidebar
          user={user}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentPath={window.location.pathname}
          onNavigate={(path) => navigate(path)}
        />
      )}

      <div className={isAuthenticated ? "flex-1 flex flex-col min-w-0 lg:ml-64 overflow-x-hidden pb-16 lg:pb-0" : "w-full"}>
        {/* Navbar - only show when authenticated */}
        {isAuthenticated && (
          <Navbar
            user={user}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            onLogout={handleLogout}
          />
        )}

        <Routes>
          {/* ✅ Login Route with onLogin prop */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/role-management"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']} requiredPermission="roles.view">
                <RoleManagement user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-management"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'hr']} requiredPermission="users.view">
                <AllUsersPage user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/system-logs"
            element={
              <ProtectedRoute allowedRoles={['superadmin']} requiredPermission="system.logs.view">
                <SystemLogs user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/system-settings"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']} requiredPermission="system.settings.view">
                <SystemSettings user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'manager']} requiredPermission="reports.view">
                <Reports user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'hr']} requiredPermission="employees.view">
                <Employees user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leave-management"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'hr', 'manager']} requiredPermission="leaves.view">
                <LeaveManagement user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/work-from-home"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'hr', 'manager', 'employee']}>
                <WorkFromHome user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'hr', 'manager']} requiredPermission="attendance.view">
                <Attendance user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recruitment"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'hr']} requiredPermission="recruitment.view">
                <Recruitment user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requiredPermission="checklist.my">
                <Onboarding user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <ProtectedRoute requiredPermission="expenses.apply">
                <Expenses user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/offboarding"
            element={
              <ProtectedRoute requiredPermission="checklist.my">
                <Offboarding user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/team-management"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'hr']} requiredPermission="team.manage">
                <TeamManagement user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-team"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <MyTeam user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/task-management"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'manager']} requiredPermission="tasks.view">
                <TaskManagement user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/approvals"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'manager']} requiredPermission="approvals.view">
                <Approvals user={user} />
              </ProtectedRoute>
            }
          />

          {/* EMPLOYEE FEATURES */}
          <Route
            path="/my-tasks"
            element={
              <ProtectedRoute allowedRoles={['employee']} requiredPermission="mytasks.view">
                <MyTasks currentUserEmail={user?.email} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/time-off"
            element={
              <ProtectedRoute allowedRoles={['employee']} requiredPermission="timeoff.view">
                <EmployeeTimeOff currentUser={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-attendance"
            element={
              <ProtectedRoute allowedRoles={['employee']} requiredPermission="myattendance.view">
                <EmployeeAttendance currentUserEmail={user?.email} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile currentUser={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/unauthorized"
            element={
              <ProtectedRoute>
                <Unauthorized />
              </ProtectedRoute>
            }
          />

          <Route
            path="/org-tree"
            element={
              <ProtectedRoute>
                <OrgTreePage user={user} />
              </ProtectedRoute>
            }
          />

          {/* ---- Coming Soon placeholders (structure per EMS requirements) ---- */}
          <Route path="/departments" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'hr']} requiredPermission="departments.view">
              <Departments user={user} />
            </ProtectedRoute>
          } />
          <Route path="/designations" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'hr']} requiredPermission="designations.view">
              <Designations user={user} />
            </ProtectedRoute>
          } />
          <Route path="/shift-management" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'hr', 'manager']} requiredPermission="shifts.view">
              <ShiftManagement user={user} />
            </ProtectedRoute>
          } />
          <Route path="/performance" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'hr', 'manager']} requiredPermission="performance.view">
              <Performance />
            </ProtectedRoute>
          } />
          <Route path="/payroll" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'hr']} requiredPermission="payroll.view">
              <Payroll user={user} />
            </ProtectedRoute>
          } />
          <Route path="/my-payslips" element={
            <ProtectedRoute>
              <MyPayslips />
            </ProtectedRoute>
          } />
          {/* Open to everyone: the page shows what you are holding even without
              registry access, which is what an employee needs before their exit. */}
          <Route path="/assets" element={
            <ProtectedRoute>
              <Assets user={user} />
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute>
              <Documents user={user} />
            </ProtectedRoute>
          } />
          <Route path="/announcements" element={
            <ProtectedRoute>
              <Announcements user={user} />
            </ProtectedRoute>
          } />
          <Route path="/holidays" element={
            <ProtectedRoute>
              <Holidays user={user} />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>

      {/* Mobile bottom navigation — hidden on lg+ */}
      {isAuthenticated && (
        <BottomNav user={user} onOpenMore={() => setSidebarOpen(true)} />
      )}

      {/* Floating HR Assistant — available on every authenticated page.
          Lives here (not inside <Routes>) so the conversation survives navigation. */}
      {isAuthenticated && !user?.mustChangePassword && (
        <AssistantWidget user={user} />
      )}
    </div>
  );
}

export default App;
















// old code api 2 times hit

// import { useState, useEffect } from "react";
// import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
// import Navbar from "./components/Layout/Navbar";
// import Sidebar from "./components/Layout/Sidebar";
// import Dashboard from "./WebView/dashboard";
// import AllUsersPage from "./WebView/UserManagement";
// import SystemLogs from "./WebView/systemlogs";
// import SystemSettings from "./WebView/systemsettings";
// import Reports from "./WebView/reports";
// import Employees from "./WebView/employees";
// import LeaveManagement from "./WebView/leavemanagement";
// import Attendance from "./WebView/attendance";
// import Recruitment from "./WebView/recruitment";
// import TeamManagement from "./WebView/teammanagement";
// import TaskManagement from "./WebView/taskmanagement";
// import Approvals from "./WebView/approvals";
// import MyTasks from "./WebView/mytask";
// import Profile from "./WebView/profile";
// import EmployeeAttendance from "./WebView/employeeattendance";
// import EmployeeTimeOff from "./WebView/employeetimeoff";
// import Login from "./components/Login/Login";
// import RoleManagement from "./WebView/rolemanagement";

// function App() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [user, setUser] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const navigate = useNavigate();

//   // Check if user is logged in on mount
//   useEffect(() => {
//     const storedUser = localStorage.getItem('user');
//     const token = localStorage.getItem('token');

//     if (storedUser && token) {
//       setUser(JSON.parse(storedUser));
//       setIsAuthenticated(true);
//     }
//   }, []);

//   // Protected Route Component
//   const ProtectedRoute = ({ children }) => {
//     if (!isAuthenticated) {
//       return <Navigate to="/login" replace />;
//     }
//     return children;
//   };

//   // Logout function
//   const handleLogout = () => {
//     localStorage.removeItem('user');
//     localStorage.removeItem('token');
//     setUser(null);
//     setIsAuthenticated(false);
//     navigate('/login');
//   };

//   // If not authenticated, show login
//   if (!isAuthenticated) {
//     return (
//       <Routes>
//         <Route path="/login" element={<Login />} />
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-slate-900/40 flex">
//       <Sidebar
//         user={user}
//         sidebarOpen={sidebarOpen}
//         setSidebarOpen={setSidebarOpen}
//         currentPath={window.location.pathname}
//         onNavigate={(path) => navigate(path)}
//       />

//       <div className="flex-1 flex flex-col lg:ml-64">
//         <Navbar
//           user={user}
//           sidebarOpen={sidebarOpen}
//           setSidebarOpen={setSidebarOpen}
//           onLogout={handleLogout}
//         />

//         <Routes>
//           <Route path="/" element={<Navigate to="/dashboard" replace />} />

//           <Route
//             path="/dashboard"
//             element={
//               <ProtectedRoute>
//                 <Dashboard user={user} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/role-management"
//             element={
//               <ProtectedRoute>
//                 <RoleManagement user={user} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/user-management"
//             element={
//               <ProtectedRoute>
//                 <AllUsersPage user={user} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/system-logs"
//             element={
//               <ProtectedRoute>
//                 <SystemLogs user={user} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/system-settings"
//             element={
//               <ProtectedRoute>
//                 <SystemSettings user={user} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/reports"
//             element={
//               <ProtectedRoute>
//                 <Reports user={user} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/employees"
//             element={
//               <ProtectedRoute>
//                 <Employees user={user} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/leave-management"
//             element={
//               <ProtectedRoute>
//                 <LeaveManagement user={user} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/attendance"
//             element={
//               <ProtectedRoute>
//                 <Attendance user={user} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/recruitment"
//             element={
//               <ProtectedRoute>
//                 <Recruitment user={user} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/team-management"
//             element={
//               <ProtectedRoute>
//                 <TeamManagement user={user} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/task-management"
//             element={
//               <ProtectedRoute>
//                 <TaskManagement user={user} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/approvals"
//             element={
//               <ProtectedRoute>
//                 <Approvals user={user} />
//               </ProtectedRoute>
//             }
//           />

//           {/* EMPLOYEE FEATURES */}
//           <Route
//             path="/my-tasks"
//             element={
//               <ProtectedRoute>
//                 <MyTasks currentUserEmail={user?.email} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/time-off"
//             element={
//               <ProtectedRoute>
//                 <EmployeeTimeOff currentUser={user} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/my-attendance"
//             element={
//               <ProtectedRoute>
//                 <EmployeeAttendance currentUserEmail={user?.email} />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/profile"
//             element={
//               <ProtectedRoute>
//                 <Profile currentUser={user} />
//               </ProtectedRoute>
//             }
//           />

//           {/* Catch all - redirect to dashboard */}
//           <Route path="*" element={<Navigate to="/dashboard" replace />} />
//         </Routes>
//       </div>
//     </div>
//   );
// }

// export default App;


// Without login direct dashboard open


// import { useState, useEffect } from "react";
// import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
// import Navbar from "./components/Layout/Navbar";
// import Sidebar from "./components/Layout/Sidebar";
// import Dashboard from "./WebView/dashboard";
// import AllUsersPage from "./WebView/UserManagement";
// // import Permissions from "./WebView/Permissions";
// import SystemLogs from "./WebView/systemlogs";
// import SystemSettings from "./WebView/systemsettings";
// import Reports from "./WebView/reports";
// import Employees from "./WebView/employees";
// import LeaveManagement from "./WebView/leavemanagement";
// import Attendance from "./WebView/attendance";
// import Recruitment from "./WebView/recruitment";
// import TeamManagement from "./WebView/teammanagement";
// import TaskManagement from "./WebView/taskmanagement";
// import Approvals from "./WebView/approvals";
// // import MyTasks from "./WebView/mytask";
// // import Profile from "./WebView/profile";
// // import EmployeeAttendance from "./WebView/employeeattendance";
// // import EmployeeTimeOff from "./WebView/employeetimeoff";
// // import Login from "./components/Login/Login";
// import RoleManagement from "./WebView/rolemanagement";


// function App() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const navigate = useNavigate();

//   const user = {
//     name: "Super Admin",
//     email: "admin@test.com",
//     role: "superadmin",
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-slate-900/40 flex">
//       <Sidebar
//         user={user}
//         sidebarOpen={sidebarOpen}
//         setSidebarOpen={setSidebarOpen}
//         currentPath={window.location.pathname}
//         onNavigate={(path) => navigate(path)}
//       />

//       <div className="flex-1 flex flex-col lg:ml-64">
//         <Navbar
//           user={user}
//           sidebarOpen={sidebarOpen}
//           setSidebarOpen={setSidebarOpen}
//           onLogout={() => {}}
//         />

//         <Routes>
//           <Route path="/" element={<Navigate to="/dashboard" replace />} />
//           <Route path="/dashboard" element={<Dashboard user={user} />} />
//           <Route path="/role-management" element={<RoleManagement user={user} />} />
//           <Route path="/user-management" element={<AllUsersPage user={user} />} />
//           <Route path="/system-logs" element={<SystemLogs />} />
//           <Route path="/system-settings" element={<SystemSettings />} />
//           <Route path="/reports" element={<Reports />} />
//           <Route path="/employees" element={<Employees />} />
//           <Route path="/leave-management" element={<LeaveManagement />} />
//           <Route path="/attendance" element={<Attendance />} />
//           <Route path="/recruitment" element={<Recruitment />} />
//           <Route path="/team-management" element={<TeamManagement />} />
//           <Route path="/task-management" element={<TaskManagement />} />
//           <Route path="/approvals" element={<Approvals />} />
//           <Route path="*" element={<Navigate to="/dashboard" replace />} />
//         </Routes>
//       </div>
//     </div>
//   );
// }
//  export default App;




