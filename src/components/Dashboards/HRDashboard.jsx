import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import { Users, CalendarDays, UserCheck, UserPlus, Clock, Megaphone, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HrDashboardAPI } from "../Constant/Api/Api";
import ApiHit from "../../Utils/ApiHit";
import EmployeeGrowthChart from "./EmployeeGrowthChart";
import DashboardAnnouncements from "../DashboardAnnouncements";
import UpcomingHolidayHero from "../UpcomingHolidayHero";
import AttendanceHeader from "../AttendanceHeader";
import FestiveBanner from "../FestiveBanner";
import TeamStatusToday from "../TeamStatusToday";

const DEPT_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#f97316'];

const HRDashboard = () => {
    const [d, setD] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const r = await ApiHit(HrDashboardAPI, "GET");
                if (r?.success) setD(r.data);
                else setError(r?.message || "Unauthorized");
            } catch (e) { setError(e.message); }
            finally { setLoading(false); }
        })();
    }, []);

    if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-6"><div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded">Error: {error}</div></div>;

    const s = d?.stats || {};

    const kpis = [
        { label: 'Total Employees', value: s.totalEmployees ?? 0, sub: `${s.activeEmployees ?? 0} active`, icon: <Users size={22} />, color: 'from-blue-500 to-indigo-600', path: '/employees' },
        { label: "Today's Attendance", value: s.todayAttendance ?? 0, sub: `${s.attendanceRate ?? 0}% (30d)`, icon: <UserCheck size={22} />, color: 'from-emerald-500 to-teal-600', path: '/attendance' },
        { label: 'Leave Requests', value: s.pendingLeaves ?? 0, sub: 'pending review', icon: <CalendarDays size={22} />, color: 'from-amber-500 to-orange-600', path: '/leave-management' },
        { label: 'Open Positions', value: s.openPositions ?? 0, sub: `${s.newHires ?? 0} hired (30d)`, icon: <Briefcase size={22} />, color: 'from-purple-500 to-fuchsia-600', path: '/recruitment' }
    ];

    const employeeGrowth = d?.employeeGrowth || [];
    const departmentData = (d?.departmentDistribution || []).map((x, i) => ({ name: x.department, value: x.count, color: DEPT_COLORS[i % DEPT_COLORS.length] }));
    const recentLeaves = d?.recentLeaves || [];
    const teamStatusToday = d?.teamStatusToday || [];
    const statusCounts = d?.statusCounts || { present: 0, absent: 0, wfh: 0, onLeave: 0, late: 0, notMarked: 0 };

    const attendanceRate = s.attendanceRate ?? 0;
    const attendanceRadial = [{ name: 'Attendance', value: attendanceRate, fill: '#10b981' }];

    const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';

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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 md:p-5 shadow border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800 dark:text-slate-100">Employee Overview</h4>
                        <span className="text-xs text-gray-400 dark:text-slate-500">Current Year</span>
                    </div>
                    <EmployeeGrowthChart data={employeeGrowth} />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 md:p-5 shadow border border-gray-100 dark:border-slate-800">
                    <h4 className="font-semibold text-gray-800 dark:text-slate-100 mb-4">Department Wise</h4>
                    {departmentData.length === 0 ? (
                        <div className="h-[180px] flex items-center justify-center text-gray-400 dark:text-slate-500 text-xs">No data</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={departmentData} dataKey="value" nameKey="name" outerRadius={56} innerRadius={32} label>
                                    {departmentData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <UpcomingHolidayHero />
            </div>

            <TeamStatusToday
                title="Organization Status — Today"
                subtitle={`Live status of all ${teamStatusToday.length} active employee${teamStatusToday.length === 1 ? '' : 's'}.`}
                list={teamStatusToday}
                counts={statusCounts}
                showRole
                actionLink="View attendance"
                onAction={() => navigate('/attendance')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 md:p-5 shadow border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800 dark:text-slate-100">Leave Requests</h4>
                        <button onClick={() => navigate('/leave-management')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</button>
                    </div>
                    {recentLeaves.length === 0 ? (
                        <div className="text-xs text-gray-400 dark:text-slate-500 py-6 text-center">No leaves</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[11px] text-gray-500 dark:text-slate-400 border-b">
                                    <th className="text-left py-2 font-medium">Employee</th>
                                    <th className="text-left py-2 font-medium">Type</th>
                                    <th className="text-left py-2 font-medium">From</th>
                                    <th className="text-left py-2 font-medium">To</th>
                                    <th className="text-left py-2 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLeaves.map((l, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        <td className="py-3 font-medium text-gray-800 dark:text-slate-100">{l.employee?.name || '—'}</td>
                                        <td className="py-3 text-gray-600 dark:text-slate-300">{l.leaveType}</td>
                                        <td className="py-3 text-gray-600 dark:text-slate-300 text-xs">{fmtDate(l.fromDate)}</td>
                                        <td className="py-3 text-gray-600 dark:text-slate-300 text-xs">{fmtDate(l.toDate)}</td>
                                        <td className="py-3">
                                            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                                                l.status === 'Approved' ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300'
                                                    : l.status === 'Rejected' ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300'
                                                        : 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300'
                                            }`}>{l.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100">{attendanceRate}%</div>
                            <div className="text-[11px] text-gray-500 dark:text-slate-400">last 30 days</div>
                        </div>
                    </div>
                </div>

                <DashboardAnnouncements />
            </div>

        </main>
    );
};

export default HRDashboard;
