import React, { useEffect, useMemo, useState } from "react";
import { Wallet, RefreshCcw, FileText, Printer, Clock3, CheckCircle2, X, Building2, Briefcase, IdCard } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { GetMyPayslipsAPI } from "../components/Constant/Api/Api";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

const MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
];

const STATUS_STYLE = {
  Draft:     { pill: 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700', dot: 'bg-gray-400' },
  Generated: { pill: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30', dot: 'bg-amber-500' },
  Paid:      { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' }
};

const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const monthLabel = (m) => MONTHS[m - 1] || m;

const MyPayslips = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewSlip, setViewSlip] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await ApiHit(GetMyPayslipsAPI, "GET");
      if (r?.success) setList(r.data || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() =>
    list.filter((p) =>
      (yearFilter === 'all'   || p.year === Number(yearFilter)) &&
      (statusFilter === 'all' || p.status === statusFilter)
    ),
    [list, yearFilter, statusFilter]);

  useEffect(() => { setCurrentPage(1); }, [yearFilter, statusFilter]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const stats = useMemo(() => {
    const paid = list.filter((p) => p.status === 'Paid');
    return {
      total: list.length,
      paid: paid.length,
      pending: list.filter((p) => p.status !== 'Paid').length,
      ytdEarned: paid.reduce((s, p) => s + (p.netPay || 0), 0)
    };
  }, [list]);

  const years = useMemo(() => {
    const s = new Set(list.map((p) => p.year));
    return Array.from(s).sort((a, b) => b - a);
  }, [list]);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Wallet className="text-purple-600 dark:text-purple-400" /> My Payslips
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Your monthly salary slips — view, download or print.</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* Stats — click Total to clear, Paid to filter paid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Payslips', value: stats.total,   color: 'from-blue-500 to-indigo-600',    icon: <FileText size={18} />,     filter: 'all' },
          { label: 'Paid',           value: stats.paid,    color: 'from-emerald-500 to-teal-600',   icon: <CheckCircle2 size={18} />, filter: 'Paid' },
          { label: 'Pending',        value: stats.pending, color: 'from-amber-500 to-orange-600',   icon: <Clock3 size={18} />,       filter: 'Generated' },
          { label: 'Earned (₹)',     value: fmtMoney(stats.ytdEarned), color: 'from-purple-500 to-fuchsia-600', icon: <Wallet size={18} />, filter: null }
        ].map((s, i) => {
          const clickable = s.filter !== null;
          const active = clickable && statusFilter === s.filter;
          return (
            <button
              key={i}
              onClick={() => clickable && setStatusFilter(s.filter)}
              disabled={!clickable}
              className={`text-left bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow transition ${clickable ? 'transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-slate-900/50 cursor-pointer' : 'cursor-default'} ${active ? 'ring-2 ring-white dark:ring-slate-800 ring-offset-2 ring-offset-gray-50' : ''}`}
            >
              <div className="p-2 bg-white/20 dark:bg-slate-900/20 rounded-lg inline-block mb-2">{s.icon}</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">{s.value}</div>
              <div className="text-xs opacity-90">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-6 flex items-center gap-3 flex-wrap">
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="all">All Years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="all">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Generated">Generated</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <Wallet size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {list.length === 0 ? 'No payslips yet' : 'No payslips match your filters'}
          </div>
          {list.length === 0 && <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Payslips will appear here once HR generates them.</div>}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/40 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Net Pay</th>
                  <th className="py-3 px-4 hidden md:table-cell">Gross</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Paid On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, idx) => {
                  const i = (currentPage - 1) * PAGE_SIZE + idx;
                  const s = STATUS_STYLE[p.status] || STATUS_STYLE.Draft;
                  return (
                    <tr key={p._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-slate-100 whitespace-nowrap">{monthLabel(p.month)} {p.year}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">{fmtMoney(p.netPay)}</td>
                      <td className="py-3 px-4 hidden md:table-cell text-gray-600 dark:text-slate-300 whitespace-nowrap">{fmtMoney(p.grossPay)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${s.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-gray-600 dark:text-slate-300 whitespace-nowrap">{fmtDate(p.paidOn)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end">
                          <button onClick={() => setViewSlip(p)} className="flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/15 px-2.5 py-1.5 rounded-lg">
                            <FileText size={12} /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
        </div>
      )}

      {viewSlip && <PayslipViewer p={viewSlip} onClose={() => setViewSlip(null)} />}
    </main>
  );
};

/* Payslip viewer (same as admin) */
const PayslipViewer = ({ p, onClose }) => {
  const s = STATUS_STYLE[p.status] || STATUS_STYLE.Draft;
  const handlePrint = () => window.print();
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:bg-white dark:print:bg-slate-900 print:p-0">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white print:hidden">
          <h3 className="font-semibold flex items-center gap-2"><FileText size={18} /> Payslip</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1 text-sm bg-white/20 dark:bg-slate-900/20 hover:bg-white/30 dark:hover:bg-slate-900/30 px-3 py-1.5 rounded"><Printer size={14} /> Print</button>
            <button onClick={onClose} className="p-1 hover:bg-white/20 dark:hover:bg-slate-900/20 rounded"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="text-center border-b pb-4 mb-4">
            <div className="text-2xl font-bold text-gray-800 dark:text-slate-100">PAYSLIP</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{monthLabel(p.month)} {p.year}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <div className="text-[11px] uppercase text-gray-500 dark:text-slate-400 font-semibold">Employee</div>
              <div className="font-semibold text-gray-800 dark:text-slate-100">{p.employeeName}</div>
              {p.employeeIdCode && <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1"><IdCard size={10} /> {p.employeeIdCode}</div>}
              {p.employeeEmail && <div className="text-xs text-gray-500 dark:text-slate-400">{p.employeeEmail}</div>}
            </div>
            <div>
              <div className="text-[11px] uppercase text-gray-500 dark:text-slate-400 font-semibold">Department / Role</div>
              {p.department && <div className="text-sm text-gray-700 dark:text-slate-200 flex items-center gap-1"><Building2 size={12} /> {p.department}</div>}
              {p.designation && <div className="text-sm text-gray-700 dark:text-slate-200 flex items-center gap-1"><Briefcase size={12} /> {p.designation}</div>}
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.pill}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {p.status}
                </span>
              </div>
            </div>
          </div>

          {(p.workingDays != null || p.presentDays != null || p.leaveDays != null) && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
              {p.workingDays != null && <div className="bg-gray-50 dark:bg-slate-900/40 rounded p-2"><div className="font-bold text-gray-800 dark:text-slate-100">{p.workingDays}</div><div className="text-gray-500 dark:text-slate-400">Working</div></div>}
              {p.presentDays != null && <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded p-2"><div className="font-bold text-emerald-700 dark:text-emerald-300">{p.presentDays}</div><div className="text-gray-500 dark:text-slate-400">Present</div></div>}
              {p.leaveDays != null && <div className="bg-amber-50 dark:bg-amber-500/10 rounded p-2"><div className="font-bold text-amber-700 dark:text-amber-300">{p.leaveDays}</div><div className="text-gray-500 dark:text-slate-400">Leaves</div></div>}
            </div>
          )}

          <table className="w-full text-sm border">
            <thead className="bg-gray-50 dark:bg-slate-900/40 text-[11px] uppercase text-gray-600 dark:text-slate-300">
              <tr>
                <th className="text-left px-3 py-2 border">Earnings</th>
                <th className="text-right px-3 py-2 border">Amount</th>
                <th className="text-left px-3 py-2 border">Deductions</th>
                <th className="text-right px-3 py-2 border">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const earnings = [{ label: 'Basic', amount: p.basic || 0 }];
                if (p.hra) earnings.push({ label: 'HRA', amount: p.hra });
                (p.allowances || []).forEach((a) => earnings.push(a));
                const deductions = p.deductions || [];
                const rows = Math.max(earnings.length, deductions.length);
                return Array.from({ length: rows }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 border">{earnings[i]?.label || ''}</td>
                    <td className="px-3 py-1.5 border text-right">{earnings[i] ? fmtMoney(earnings[i].amount) : ''}</td>
                    <td className="px-3 py-1.5 border">{deductions[i]?.label || ''}</td>
                    <td className="px-3 py-1.5 border text-right">{deductions[i] ? fmtMoney(deductions[i].amount) : ''}</td>
                  </tr>
                ));
              })()}
              <tr className="bg-gray-50 dark:bg-slate-900/40 font-semibold">
                <td className="px-3 py-2 border">Gross</td>
                <td className="px-3 py-2 border text-right">{fmtMoney(p.grossPay)}</td>
                <td className="px-3 py-2 border">Total Deductions</td>
                <td className="px-3 py-2 border text-right text-red-600 dark:text-red-400">{fmtMoney(p.totalDeductions)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider">Net Pay</span>
            <span className="text-2xl font-bold">{fmtMoney(p.netPay)}</span>
          </div>

          {p.status === 'Paid' && (
            <div className="mt-3 text-xs text-gray-600 dark:text-slate-300 flex flex-wrap gap-4">
              <span><span className="font-semibold">Paid on:</span> {fmtDate(p.paidOn)}</span>
              {p.paymentMode && <span><span className="font-semibold">Mode:</span> {p.paymentMode}</span>}
              {p.reference && <span><span className="font-semibold">Ref:</span> {p.reference}</span>}
            </div>
          )}

          {p.notes && <p className="mt-3 text-xs text-gray-600 dark:text-slate-300 italic">Note: {p.notes}</p>}

          <div className="mt-6 text-[11px] text-gray-400 dark:text-slate-500 text-center italic">This is a system-generated payslip.</div>
        </div>
      </div>
    </div>
  );
};

export default MyPayslips;
