
// import { useState } from 'react';
// import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
// import ApiHit from '../../Utils/ApiHit';
// import { LoginAPI } from '../Constant/Api/Api';
// import { useNavigate } from 'react-router-dom';
// import AppInput from '../AppInput';
// import { REGEX_PATTERNS, VALIDATION_MESSAGES } from '../../Utils/regex';

// const Login = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({ email: '', password: '' });
//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [loginError, setLoginError] = useState('');

//   // Email validation with regex
//   const validateEmail = (email) => {
//     if (!email) return VALIDATION_MESSAGES.required;
//     if (!REGEX_PATTERNS.email.test(email)) return VALIDATION_MESSAGES.email;
//     return '';
//   };

//   // Password validation with regex
//   const validatePassword = (password) => {
//     if (!password) return VALIDATION_MESSAGES.required;
//     if (password.length < 6) return 'Password must be at least 6 characters';
//     return '';
//   };

//   // Handle input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     setErrors((prev) => ({ ...prev, [name]: '' }));
//     setLoginError('');
//   };

//   // Role-based navigation function
//   const navigateByRole = (role) => {
//     console.log('navigateByRole called with role:', role);
//     const roleLower = role?.toLowerCase();
//     console.log('Role after toLowerCase:', roleLower);

//     switch (roleLower) {
//       case 'admin':
//         console.log('Admin login - Navigating to /dashboard');
//         navigate('/dashboard');
//         break;

//       case 'manager':
//         console.log('Manager login - Navigating to /team-management');
//         navigate('/team-management');
//         break;

//       case 'employee':
//       case 'user':
//         console.log('Employee/User login - Navigating to /my-tasks');
//         navigate('/my-tasks');
//         break;

//       default:
//         console.log('Default role - Navigating to /dashboard');
//         navigate('/dashboard');
//     }
//   };

//   // Handle form submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validate fields
//     const emailError = validateEmail(formData.email);
//     const passwordError = validatePassword(formData.password);

//     if (emailError || passwordError) {
//       setErrors({ email: emailError, password: passwordError });
//       return;
//     }

//     setLoading(true);
//     setLoginError('');

//     try {
//       const res = await ApiHit(LoginAPI, 'POST', {
//         email: formData.email,
//         password: formData.password,
//       });

//       console.log('Login response:', res);

//       const user = res?.data?.user;
//       const token = res?.data?.token;

//       console.log('=== LOGIN DEBUG ===');
//       console.log('Full Response:', res);
//       console.log('User Object:', user);
//       console.log('Token:', token);

//       if (res.success && user && token) {
//         localStorage.setItem('user', JSON.stringify(user));
//         localStorage.setItem('token', token);

//         const userRole = user.roleId?.name || user.role || user.userType || user.type;

//         console.log('Extracted Role:', userRole);
//         console.log('Role Type:', typeof userRole);
//         console.log('Calling navigateByRole with:', userRole);

//         if (userRole) {
//           navigateByRole(userRole);
//           setTimeout(() => {
//             window.location.href = window.location.pathname;
//           }, 100);
//         } else {
//           console.warn('⚠️ Role not found in response! Redirecting to default dashboard');
//           navigate('/dashboard');
//         }
//       } else {
//         console.error('Login failed - Missing user or token');
//         setLoginError(res?.message || 'Invalid email or password');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       setLoginError('Network error. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
//       <div className="max-w-md w-full">
//         <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-slate-800">
//           {/* Header */}
//           <div className="text-center mb-8">
//             <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
//               <Lock className="text-white" size={32} />
//             </div>
//             <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100">Welcome Back</h2>
//             <p className="text-gray-600 dark:text-slate-300 mt-2">Sign in to access your dashboard</p>
//           </div>

//           {/* Login Error */}
//           {loginError && (
//             <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
//               <p className="text-red-700 dark:text-red-300 text-sm font-medium">{loginError}</p>
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Email Input using AppInput */}
//             <AppInput
//               name="email"
//               label="Email Address"
//               type="email"
//               placeholder="your.email@company.com"
//               value={formData.email}
//               onChange={handleChange}
//               icon={<Mail />}
//               error={errors.email}
//               required
//             />

//             {/* Password Input using AppInput */}
//             <AppInput
//               name="password"
//               label="Password"
//               type={showPassword ? 'text' : 'password'}
//               placeholder="Enter your password"
//               value={formData.password}
//               onChange={handleChange}
//               icon={<Lock />}
//               rightIcon={
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition"
//                 >
//                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                 </button>
//               }
//               error={errors.password}
//               required
//             />

//             {/* Remember & Forgot */}
//             <div className="flex items-center justify-between">
//               <label className="flex items-center cursor-pointer">
//                 <input
//                   type="checkbox"
//                   className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
//                 />
//                 <span className="ml-2 text-sm text-gray-600 dark:text-slate-300">Remember me</span>
//               </label>
//               <button
//                 type="button"
//                 className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
//                 onClick={() => alert('Contact your administrator')}
//               >
//                 Forgot password?
//               </button>
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={loading}
//               className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-200 ${
//                 loading
//                   ? 'bg-gray-400 cursor-not-allowed'
//                   : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 shadow-lg'
//               }`}
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center">
//                   <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                       fill="none"
//                     />
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     />
//                   </svg>
//                   Signing in...
//                 </span>
//               ) : (
//                 'Sign In'
//               )}
//             </button>
//           </form>

//           {/* Footer */}
//           <div className="mt-8 text-center">
//             <p className="text-sm text-gray-600 dark:text-slate-300">
//               Don't have an account?{' '}
//               <button
//                 type="button"
//                 className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
//                 onClick={() => alert('Contact your administrator')}
//               >
//                 Contact Administrator
//               </button>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;











import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import ApiHit from '../../Utils/ApiHit';
import { LoginAPI } from '../Constant/Api/Api';
import AppInput from '../AppInput';
import { REGEX_PATTERNS, VALIDATION_MESSAGES } from '../../Utils/regex';
import { Link } from 'react-router-dom';


const Login = ({ onLogin }) => {  // ✅ onLogin prop receive karein
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Email validation with regex
  const validateEmail = (email) => {
    if (!email) return VALIDATION_MESSAGES.required;
    if (!REGEX_PATTERNS.email.test(email)) return VALIDATION_MESSAGES.email;
    return '';
  };

  // Password validation with regex
  const validatePassword = (password) => {
    if (!password) return VALIDATION_MESSAGES.required;
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setLoginError('');
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate fields
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setLoading(true);
    setLoginError('');

    try {
      const res = await ApiHit(LoginAPI, 'POST', {
        email: formData.email,
        password: formData.password,
      });

      const user = res?.data?.user;

      if (res?.success && user) {
        // Temporarily store password so ForcePasswordChangeModal can use it silently
        // when user must change password on first login. Cleared after use.
        try { sessionStorage.setItem('_pendingPwd', formData.password); } catch (_) {}
        onLogin(user);
      } else {
        setLoginError(res?.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-3 sm:px-4 md:px-6 py-6 sm:py-8 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/Images/user-login-img.png')`,
      }}
    >
      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-indigo-900/60 to-purple-900/70 backdrop-blur-sm"></div>

      <div className="w-full max-w-sm sm:max-w-md md:max-w-md lg:max-w-md relative z-10">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-6 md:p-8 border border-white/20 ring-1 ring-white/10 dark:ring-slate-900/10">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-3 sm:mb-4 shadow-lg shadow-indigo-500/50">
              <Lock className="text-white w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100">Welcome to EMS Portal</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-slate-300 mt-1 sm:mt-2">Sign in to manage your workforce efficiently</p>
          </div>

          {/* Login Error */}
          {loginError && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Input using AppInput */}
            <AppInput
              name="email"
              label="Email Address"
              type="email"
              placeholder="your.email@company.com"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail />}
              error={errors.email}
              required
            />

            {/* Password Input using AppInput */}
            <AppInput
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              icon={<Lock />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
              error={errors.password}
              required
            />

            {/* Remember & Forgot */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-xs sm:text-sm text-gray-600 dark:text-slate-300">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 sm:py-3 px-4 rounded-lg text-white text-sm sm:text-base font-semibold transition-all duration-200 ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] shadow-lg'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300">
              Don't have an account?{' '}
              <button
                type="button"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
                onClick={() => alert('Contact your administrator')}
              >
                Contact Administrator
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;