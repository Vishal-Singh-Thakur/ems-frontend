import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from "recharts";
import { CheckCircle, UserCheck, Calendar, Clock, User, ClipboardList, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmployeeDashboardAPI } from "../Constant/Api/Api";
import ApiHit from "../../Utils/ApiHit";
import DashboardAnnouncements from "../DashboardAnnouncements";
import UpcomingHolidayHero from "../UpcomingHolidayHero";
import AttendanceHeader from "../AttendanceHeader";
import FestiveBanner from "../FestiveBanner";

const EmployeeDashboard = ({ user }) => {
    const [d, setD] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const r = await ApiHit(EmployeeDashboardAPI, "GET");
                if (r?.success) setD(r.data);
                else setError(r?.message || "Unauthorized");
            } catch (e) { setError(e.message); }
            finally { setLoading(false); }
        })();
    }, []);

    if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-6"><div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded">Error: {error}</div></div>;

    const s = d?.stats || {};
    const profile = d?.profile || {};

    const kpis = [
        { label: 'My Tasks', value: s.totalTasks ?? 0, sub: `${s.tasksDueThisWeek ?? 0} due this week`, icon: <ClipboardList size={22} />, color: 'from-blue-500 to-indigo-600', path: '/my-tasks' },
        { label: 'Attendance', value: `${s.attendancePercentage ?? 0}%`, sub: `${s.presentDays ?? 0} days present`, icon: <UserCheck size={22} />, color: 'from-emerald-500 to-teal-600', path: '/my-attendance' },
        { label: 'Leave Balance', value: s.leaveBalance ?? 0, sub: `${s.leavesTaken ?? 0} taken`, icon: <Calendar size={22} />, color: 'from-amber-500 to-orange-600', path: '/time-off' },
        { label: 'Hours Logged', value: Number(s.totalHours ?? 0).toFixed(1), sub: 'this month', icon: <Clock size={22} />, color: 'from-purple-500 to-fuchsia-600', path: '/my-attendance' }
    ];

    const weeklyAttendance = d?.weeklyAttendance || [];
    const recentTasks = d?.recentTasks || [];

    const attendancePct = s.attendancePercentage ?? 0;
    const attendanceRadial = [{ name: 'Attendance', value: attendancePct, fill: '#10b981' }];

    const isDelayed = (task) => {
        if (!task.dueDate) return false;
        return new Date(task.dueDate) < new Date() && task.status !== "Completed";
    };

    const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">

            <FestiveBanner />
            <AttendanceHeader />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6">
                {kpis.map((k, i) => (
                    <button
                        key={i}
                        onClick={() => k.path && navigate(k.path)}
                        className={`text-left bg-gradient-to-br ${k.color} rounded-2xl shadow-lg p-3 sm:p-4 md:p-5 text-white transition transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-slate-900/50`}
                    >
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <div className="p-1.5 sm:p-2 bg-white/20 dark:bg-slate-900/20 rounded-lg">{k.icon}</div>
                            <span className="text-[9px] sm:text-[10px] font-medium bg-white/20 dark:bg-slate-900/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">{k.sub}</span>
                        </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">{k.value}</div>
                        <div className="text-[11px] sm:text-xs opacity-90 mt-1">{k.label}</div>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 md:p-5 shadow border border-gray-100 dark:border-slate-800">
                    <h4 className="font-semibold text-gray-800 dark:text-slate-100 mb-4">My Weekly Attendance</h4>
                    <ResponsiveContainer width="100%" height={230}>
                        <BarChart data={weeklyAttendance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <Bar dataKey="present" fill="#10b981" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="absent" fill="#ef4444" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 md:p-5 shadow border border-gray-100 dark:border-slate-800">
                    <h4 className="font-semibold text-gray-800 dark:text-slate-100 mb-4">My Profile</h4>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold mb-3">
                            {profile.name?.charAt(0) || user?.name?.charAt(0) || '?'}
                        </div>
                        <div className="font-semibold text-gray-800 dark:text-slate-100">{profile.name || user?.name}</div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400 mb-3">{profile.email || user?.email}</div>
                        <div className="w-full space-y-2 text-left">
                            <div className="text-[11px] text-gray-500 dark:text-slate-400 flex justify-between border-b pb-1">
                                <span>Phone</span><span className="text-gray-700 dark:text-slate-200">{profile.phone || '—'}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-slate-400 flex justify-between border-b pb-1">
                                <span>Status</span>
                                <span className={profile.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {profile.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-slate-400 flex justify-between">
                                <span>Last Login</span>
                                <span className="text-gray-700 dark:text-slate-200">{profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString('en-GB') : 'Never'}</span>
                            </div>
                        </div>
                        <button onClick={() => navigate('/profile')} className="mt-4 w-full text-xs bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/15 text-blue-700 dark:text-blue-300 py-2 rounded-lg font-medium">
                            View Profile
                        </button>
                    </div>
                </div>

                <UpcomingHolidayHero />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 md:p-5 shadow border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800 dark:text-slate-100">My Recent Tasks</h4>
                        <button onClick={() => navigate('/my-tasks')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</button>
                    </div>
                    {recentTasks.length === 0 ? (
                        <div className="text-xs text-gray-400 dark:text-slate-500 py-6 text-center">No tasks assigned</div>
                    ) : (
                        <div className="space-y-3">
                            {recentTasks.slice(0, 4).map((task, i) => (
                                <div key={i} className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                        <h5 className="font-semibold text-sm text-gray-800 dark:text-slate-100">{task.title}</h5>
                                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                                            isDelayed(task) ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300'
                                                : task.status === 'Completed' ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300'
                                                    : task.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                                        : 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300'
                                        }`}>
                                            {isDelayed(task) ? 'Delayed' : task.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
                                        <span>By: {task.assignedBy?.name || '—'}</span>
                                        <span>Due: {fmtDate(task.dueDate)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 md:p-5 shadow border border-gray-100 dark:border-slate-800 flex flex-col">
                    <h4 className="font-semibold text-gray-800 dark:text-slate-100 mb-4">Attendance Summary</h4>
                    <div className="relative flex-1 flex items-center justify-center min-h-[200px]">
                        <ResponsiveContainer width="100%" height={200}>
                            <RadialBarChart innerRadius="60%" outerRadius="100%" data={attendanceRadial} startAngle={90} endAngle={-270}>
                                <RadialBar background dataKey="value" cornerRadius={20} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100">{attendancePct}%</div>
                            <div className="text-[11px] text-gray-500 dark:text-slate-400">this month</div>
                        </div>
                    </div>
                </div>

                <DashboardAnnouncements />
            </div>

        </main>
    );
};

export default EmployeeDashboard;
