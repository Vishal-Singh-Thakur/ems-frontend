import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet, Plus, Search, RefreshCcw, Pencil, Trash2, CheckCircle2, Clock3,
  X, FileText, Building2, Briefcase, IdCard, Printer, DollarSign
} from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import {
  GetAllPayrollAPI, CreatePayrollAPI, UpdatePayrollAPI, DeletePayrollAPI,
  MarkPayrollPaidAPI, PayrollEligibleEmployeesAPI
} from "../components/Constant/Api/Api";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

const MONTHS = [
  { v: 1, l: 'Jan' }, { v: 2, l: 'Feb' }, { v: 3, l: 'Mar' }, { v: 4, l: 'Apr' },
  { v: 5, l: 'May' }, { v: 6, l: 'Jun' }, { v: 7, l: 'Jul' }, { v: 8, l: 'Aug' },
  { v: 9, l: 'Sep' }, { v: 10, l: 'Oct' }, { v: 11, l: 'Nov' }, { v: 12, l: 'Dec' }
];

const STATUS_STYLE = {
  Draft:     { pill: 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700', dot: 'bg-gray-400' },
  Generated: { pill: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30', dot: 'bg-amber-500' },
  Paid:      { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' }
};

const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const monthLabel = (m) => MONTHS.find((x) => x.v === m)?.l || m;

const initials = (n) => (n || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const Payroll = ({ user }) => {
  const role = (user?.roleId?.name || user?.role || '').toLowerCase();
  const canDelete = role === 'superadmin' || role === 'admin';

  const [list, setList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [viewSlip, setViewSlip] = useState(null);

  const nowY = new Date().getFullYear();

  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await ApiHit(GetAllPayrollAPI, "GET");
      if (r?.success) setList(r.data || []);
    } finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    const r = await ApiHit(PayrollEligibleEmployeesAPI, "GET");
    if (r?.success) setEmployees(r.data || []);
  };

  useEffect(() => { fetchAll(); fetchEmployees(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter((p) => {
      const matchSearch = !q ||
        (p.employeeName || '').toLowerCase().includes(q) ||
        (p.employeeEmail || '').toLowerCase().includes(q) ||
        (p.employeeIdCode || '').toLowerCase().includes(q);
      const matchMonth  = monthFilter === 'all' || p.month === Number(monthFilter);
      const matchYear   = yearFilter === 'all'  || p.year === Number(yearFilter);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchMonth && matchYear && matchStatus;
    });
  }, [list, search, monthFilter, yearFilter, statusFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, monthFilter, yearFilter, statusFilter]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const stats = useMemo(() => ({
    total:     list.length,
    draft:     list.filter((p) => p.status === 'Draft').length,
    generated: list.filter((p) => p.status === 'Generated').length,
    paid:      list.filter((p) => p.status === 'Paid').length,
    grossSum:  list.filter((p) => p.status === 'Paid').reduce((s, p) => s + (p.netPay || 0), 0)
  }), [list]);

  const years = useMemo(() => {
    const ys = new Set(list.map((p) => p.year));
    ys.add(nowY);
    return Array.from(ys).sort((a, b) => b - a);
  }, [list, nowY]);

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete payslip for ${p.employeeName} (${monthLabel(p.month)} ${p.year})?`)) return;
    setBusyId(p._id);
    try {
      const r = await ApiHit(DeletePayrollAPI(p._id), "DELETE");
      if (r?.success) fetchAll();
      else alert(r?.message || 'Delete failed');
    } finally { setBusyId(null); }
  };

  const handleMarkPaid = async (p) => {
    setBusyId(p._id);
    try {
      const r = await ApiHit(MarkPayrollPaidAPI(p._id), "PATCH", { paidOn: new Date().toISOString() });
      if (r?.success) fetchAll();
      else alert(r?.message || 'Failed');
    } finally { setBusyId(null); }
  };

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Wallet className="text-purple-600 dark:text-purple-400" /> Payroll & Payslips
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Generate monthly payslips for employees and track payments.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          <button
            onClick={() => setModal({ open: true, mode: 'create', data: null })}
            className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white px-4 py-2 rounded-lg shadow font-medium"
          >
            <Plus size={16} /> Create Payslip
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Payslips', value: stats.total,     color: 'from-blue-500 to-indigo-600',    icon: <FileText size={18} />,     filter: 'all' },
          { label: 'Draft',          value: stats.draft,     color: 'from-gray-500 to-slate-600',     icon: <Pencil size={18} />,       filter: 'Draft' },
          { label: 'Generated',      value: stats.generated, color: 'from-amber-500 to-orange-600',   icon: <Clock3 size={18} />,       filter: 'Generated' },
          { label: 'Paid',           value: stats.paid,      color: 'from-emerald-500 to-teal-600',   icon: <CheckCircle2 size={18} />, filter: 'Paid' },
          { label: 'Paid ₹',         value: fmtMoney(stats.grossSum), color: 'from-purple-500 to-fuchsia-600', icon: <DollarSign size={18} />, filter: null }
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
        <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text" placeholder="Search employee, email, ID…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="all">All Months</option>
          {MONTHS.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="all">All Years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <Wallet size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {list.length === 0 ? 'No payslips yet' : 'No payslips match your filters'}
          </div>
          {list.length === 0 && (
            <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Click "Create Payslip" to add the first record.</div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/40 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4 hidden md:table-cell">Period</th>
                  <th className="py-3 px-4">Net Pay</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Paid On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, idx) => {
                  const i = (currentPage - 1) * PAGE_SIZE + idx;
                  const s = STATUS_STYLE[p.status] || STATUS_STYLE.Draft;
                  const busy = busyId === p._id;
                  return (
                    <tr key={p._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                            {initials(p.employeeName)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-800 dark:text-slate-100 truncate">{p.employeeName || '—'}</div>
                            <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                              {p.employeeIdCode ? <span className="inline-flex items-center gap-1"><IdCard size={10} /> {p.employeeIdCode} · </span> : null}
                              {p.department || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-gray-700 dark:text-slate-200 whitespace-nowrap">
                        {monthLabel(p.month)} {p.year}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800 dark:text-slate-100 whitespace-nowrap">{fmtMoney(p.netPay)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${s.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-gray-600 dark:text-slate-300 whitespace-nowrap">{fmtDate(p.paidOn)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewSlip(p)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded" title="View slip">
                            <FileText size={16} />
                          </button>
                          <button onClick={() => setModal({ open: true, mode: 'edit', data: p })} className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded" title="Edit">
                            <Pencil size={16} />
                          </button>
                          {p.status !== 'Paid' && (
                            <button onClick={() => handleMarkPaid(p)} disabled={busy} className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded disabled:opacity-50" title="Mark as paid">
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(p)} disabled={busy} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded disabled:opacity-50" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          )}
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

      {/* Create/Edit modal */}
      {modal.open && (
        <PayrollModal
          mode={modal.mode}
          data={modal.data}
          employees={employees}
          onClose={() => setModal({ open: false, mode: 'create', data: null })}
          onSuccess={() => { setModal({ open: false, mode: 'create', data: null }); fetchAll(); }}
        />
      )}

      {/* View slip modal */}
      {viewSlip && <PayslipViewer p={viewSlip} onClose={() => setViewSlip(null)} />}
    </main>
  );
};

/* ---------- Create/Edit modal ---------- */
const PayrollModal = ({ mode, data, employees, onClose, onSuccess }) => {
  const isEdit = mode === 'edit';
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const now = new Date();
  const [form, setForm] = useState(() => {
    if (isEdit && data) {
      return {
        employeeId: data.employeeId?._id || data.employeeId,
        month: data.month, year: data.year,
        basic: data.basic ?? 0, hra: data.hra ?? 0,
        allowances: data.allowances || [],
        deductions: data.deductions || [],
        workingDays: data.workingDays ?? '',
        presentDays: data.presentDays ?? '',
        leaveDays: data.leaveDays ?? '',
        status: data.status || 'Draft',
        paymentMode: data.paymentMode || 'Bank Transfer',
        reference: data.reference || '',
        notes: data.notes || ''
      };
    }
    return {
      employeeId: '', month: now.getMonth() + 1, year: now.getFullYear(),
      basic: 0, hra: 0, allowances: [], deductions: [],
      workingDays: '', presentDays: '', leaveDays: '',
      status: 'Draft', paymentMode: 'Bank Transfer', reference: '', notes: ''
    };
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const addRow = (kind) => set(kind, [...(form[kind] || []), { label: '', amount: 0 }]);
  const updRow = (kind, i, field, val) => {
    const arr = [...form[kind]]; arr[i] = { ...arr[i], [field]: field === 'amount' ? Number(val) : val };
    set(kind, arr);
  };
  const delRow = (kind, i) => set(kind, form[kind].filter((_, x) => x !== i));

  const gross = (Number(form.basic) || 0) + (Number(form.hra) || 0) +
                (form.allowances || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const totalDed = (form.deductions || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const net = Math.max(0, gross - totalDed);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.employeeId) { setErr('Please select employee'); return; }
    setBusy(true);
    try {
      const payload = {
        ...form,
        workingDays: form.workingDays === '' ? undefined : Number(form.workingDays),
        presentDays: form.presentDays === '' ? undefined : Number(form.presentDays),
        leaveDays:   form.leaveDays   === '' ? undefined : Number(form.leaveDays)
      };
      const r = isEdit
        ? await ApiHit(UpdatePayrollAPI(data._id), "PUT", payload)
        : await ApiHit(CreatePayrollAPI, "POST", payload);
      if (r?.success) onSuccess();
      else setErr(r?.message || 'Save failed');
    } catch (ex) {
      setErr(ex.message || 'Something went wrong');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white">
          <div>
            <h3 className="font-bold text-base sm:text-lg flex items-center gap-2"><Wallet size={18} /> {isEdit ? 'Edit Payslip' : 'Create Payslip'}</h3>
            <p className="text-[11px] sm:text-xs opacity-90 mt-0.5">Fill in the salary components below.</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 dark:hover:bg-slate-900/20 rounded"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {err && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">{err}</div>}

          {/* Employee + Period */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Employee *</label>
              <select
                value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)}
                disabled={isEdit}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 dark:disabled:bg-slate-800"
                required
              >
                <option value="">-- select employee --</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name} {e.employeeId ? `(${e.employeeId})` : ''} · {e.department || 'No dept'} · {e.role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Month *</label>
              <select value={form.month} onChange={(e) => set('month', Number(e.target.value))} disabled={isEdit} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 dark:disabled:bg-slate-800">
                {MONTHS.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Year *</label>
              <input type="number" value={form.year} onChange={(e) => set('year', Number(e.target.value))} disabled={isEdit} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 dark:disabled:bg-slate-800" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm">
                <option>Draft</option><option>Generated</option><option>Paid</option>
              </select>
            </div>
          </div>

          {/* Salary components */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Basic ₹</label>
              <input type="number" min="0" value={form.basic} onChange={(e) => set('basic', Number(e.target.value))} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">HRA ₹</label>
              <input type="number" min="0" value={form.hra} onChange={(e) => set('hra', Number(e.target.value))} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Allowances */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">Allowances (+)</label>
              <button type="button" onClick={() => addRow('allowances')} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"><Plus size={12} /> Add</button>
            </div>
            {(form.allowances || []).length === 0 && <p className="text-xs text-gray-400 dark:text-slate-500 italic">No allowances added</p>}
            <div className="space-y-2">
              {(form.allowances || []).map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input placeholder="Label (e.g. Transport)" value={a.label} onChange={(e) => updRow('allowances', i, 'label', e.target.value)} className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm" />
                  <input type="number" min="0" placeholder="Amount" value={a.amount} onChange={(e) => updRow('allowances', i, 'amount', e.target.value)} className="w-32 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm" />
                  <button type="button" onClick={() => delRow('allowances', i)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Deductions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">Deductions (-)</label>
              <button type="button" onClick={() => addRow('deductions')} className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"><Plus size={12} /> Add</button>
            </div>
            {(form.deductions || []).length === 0 && <p className="text-xs text-gray-400 dark:text-slate-500 italic">No deductions added</p>}
            <div className="space-y-2">
              {(form.deductions || []).map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input placeholder="Label (e.g. PF, TDS)" value={d.label} onChange={(e) => updRow('deductions', i, 'label', e.target.value)} className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm" />
                  <input type="number" min="0" placeholder="Amount" value={d.amount} onChange={(e) => updRow('deductions', i, 'amount', e.target.value)} className="w-32 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm" />
                  <button type="button" onClick={() => delRow('deductions', i)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance basis */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Working Days</label>
              <input type="number" min="0" value={form.workingDays} onChange={(e) => set('workingDays', e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Present</label>
              <input type="number" min="0" value={form.presentDays} onChange={(e) => set('presentDays', e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Leaves</label>
              <input type="number" min="0" value={form.leaveDays} onChange={(e) => set('leaveDays', e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Notes (optional)</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Live summary */}
          <div className="bg-gray-50 dark:bg-slate-900/40 border border-gray-200 dark:border-slate-700 rounded-xl p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-300">Gross</span><span className="font-semibold">{fmtMoney(gross)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-300">Total Deductions</span><span className="font-semibold text-red-600 dark:text-red-400">-{fmtMoney(totalDed)}</span></div>
            <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-slate-700"><span className="text-gray-800 dark:text-slate-100 font-semibold">Net Pay</span><span className="font-bold text-emerald-700 dark:text-emerald-300">{fmtMoney(net)}</span></div>
          </div>
        </form>

        <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 px-4 sm:px-5 py-3 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-800">Cancel</button>
          <button onClick={submit} disabled={busy} className="px-5 py-2 text-sm bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg font-medium disabled:opacity-50">
            {busy ? 'Saving…' : (isEdit ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Payslip printable viewer ---------- */
const PayslipViewer = ({ p, onClose }) => {
  const s = STATUS_STYLE[p.status] || STATUS_STYLE.Draft;
  const handlePrint = () => window.print();
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:bg-white dark:print:bg-slate-900 print:p-0">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white print:hidden">
          <h3 className="font-semibold flex items-center gap-2"><FileText size={18} /> Payslip Preview</h3>
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

          <div className="mt-6 text-[11px] text-gray-400 dark:text-slate-500 text-center italic">This is a system-generated payslip. No signature required.</div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
