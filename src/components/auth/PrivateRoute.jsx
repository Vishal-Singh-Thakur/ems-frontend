// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';

// const PrivateRoute = ({ children, allowedRoles = [] }) => {
//   const { isAuthenticated, user, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

// //   if (!isAuthenticated) {
// //     return <Navigate to="/dashboard" replace />;
// //   }

//   if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   return children;
// };

// export default PrivateRoute;




// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';

// export const ProtectedRoute = ({ children, roles = [] }) => {
//   const { user, loading, isAuthenticated, hasRole } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

// //   if (!isAuthenticated) {
// //     return <Navigate to="/login" replace />;
// //   }


// //   if (!isAuthenticated) {
// //     return <Navigate to="/dashboard" replace />;
// //   }

//   if (roles.length > 0 && !hasRole(...roles)) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   return children;
// };




import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.roleId?.name || user.role;

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole?.toLowerCase())) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;