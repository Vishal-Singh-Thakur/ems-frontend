import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Role ko roleId.name se extract karo
  const userRole = user.roleId?.name || user.role;

  const handleGoBack = () => {
    // User ko unke role ke dashboard par bhejo
    const role = userRole?.toLowerCase();
    
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'manager':
        navigate('/manager/dashboard');
        break;
      case 'employee':
        navigate('/employee/dashboard');
        break;
      case 'user':
        navigate('/user/dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      const { LogoutAPI } = await import('../components/Constant/Api/Api');
      await fetch(LogoutAPI, { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-red-100 dark:border-red-500/20 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full mb-6">
            <ShieldAlert className="text-white" size={40} />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            Access Denied
          </h1>

          {/* Message */}
          <p className="text-gray-600 dark:text-slate-300 text-lg mb-2">
            You don't have permission to access this page.
          </p>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">
            Your current role: <span className="font-semibold text-red-600 dark:text-red-400">{userRole || 'Unknown'}</span>
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              <ArrowLeft size={20} />
              Go to My Dashboard
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 py-3 px-6 rounded-lg font-semibold transition"
            >
              <Home size={20} />
              Logout
            </button>
          </div>

          {/* Help Text */}
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-6">
            Need access? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;