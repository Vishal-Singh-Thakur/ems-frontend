import React from "react";
import { X, Calendar, Wallet, User, Clock3, FileText, CheckCircle2, XCircle, MessageSquare } from "lucide-react";

const STATUS_STYLE = {
  Pending:  { pill: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30', dot: 'bg-amber-500' },
  Approved: { pill: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
  Rejected: { pill: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30', dot: 'bg-red-500' }
};

const TYPE_META = {
  Leave:   { icon: <Calendar size={20} />, color: 'from-blue-500 to-indigo-600', label: 'Leave' },
  Expense: { icon: <Wallet size={20} />, color: 'from-purple-500 to-fuchsia-600', label: 'Expense' }
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const daysBetween = (from, to) => {
  if (!from || !to) return 0;
  const a = new Date(from); a.setHours(0, 0, 0, 0);
  const b = new Date(to);   b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 86400000) + 1;
};

const Row = ({ icon, label, children }) => (
  <div className="flex items-start gap-3 py-2">
    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] text-gray-500 dark:text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="text-sm text-gray-800 dark:text-slate-100 break-words">{children}</div>
    </div>
  </div>
);

const ApprovalDetailsModal = ({ request, onClose }) => {
  if (!request) return null;

  const s = STATUS_STYLE[request.status] || STATUS_STYLE.Pending;
  const t = TYPE_META[request.type] || TYPE_META.Leave;
  const d = request.details || {};
  const days = request.type === 'Leave' ? daysBetween(request.fromDate, request.toDate) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${t.color} p-5 text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-white/20 dark:bg-slate-900/20 flex items-center justify-center flex-shrink-0">
                {t.icon}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider opacity-90">{t.label} Request</div>
                <h3 className="text-lg font-bold truncate">{request.description}</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 dark:hover:bg-slate-900/20 rounded-lg text-white flex-shrink-0" title="Close">
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${s.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {request.status}
            </span>
            {days > 0 && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white/20 dark:bg-slate-900/20 text-white">
                {days} day{days === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 divide-y divide-gray-100 dark:divide-slate-800">
          {/* Employee */}
          <Row icon={<User size={14} />} label="Employee">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${t.color} text-white flex items-center justify-center text-[10px] font-bold`}>
                {initials(request.employee)}
              </div>
              <span className="font-medium">{request.employee}</span>
              {d.employee?.email && <span className="text-[11px] text-gray-500 dark:text-slate-400">• {d.employee.email}</span>}
            </div>
          </Row>

          {/* Leave-specific fields */}
          {request.type === 'Leave' && (
            <>
              <Row icon={<Calendar size={14} className="text-blue-600 dark:text-blue-400" />} label="From → To">
                <div className="font-medium">
                  {fmtDate(request.fromDate)} <span className="text-gray-400 dark:text-slate-500">→</span> {fmtDate(request.toDate)}
                </div>
              </Row>
              {request.reason && (
                <Row icon={<MessageSquare size={14} className="text-gray-500 dark:text-slate-400" />} label="Reason">
                  <p className="italic text-gray-700 dark:text-slate-200">"{request.reason}"</p>
                </Row>
              )}
            </>
          )}

          {/* Expense-specific */}
          {request.type === 'Expense' && (
            <Row icon={<Calendar size={14} className="text-purple-600 dark:text-purple-400" />} label="Submitted On">
              <div className="font-medium">{fmtDate(request.date)}</div>
            </Row>
          )}

          {/* Applied on */}
          {d.createdAt && (
            <Row icon={<Clock3 size={14} className="text-gray-500 dark:text-slate-400" />} label="Applied On">
              <div>{fmtDateTime(d.createdAt)}</div>
            </Row>
          )}

          {/* Approval info (Approved/Rejected) */}
          {(request.status === 'Approved' || request.status === 'Rejected') && d.approvedBy && (
            <Row
              icon={request.status === 'Approved' ? <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> : <XCircle size={14} className="text-red-600 dark:text-red-400" />}
              label={`${request.status} By`}
            >
              <div className="font-medium">{d.approvedBy?.name || 'Unknown'}</div>
              {d.approvalDate && <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">on {fmtDateTime(d.approvalDate)}</div>}
              {request.status === 'Rejected' && d.rejectionReason && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1 italic">"{d.rejectionReason}"</div>
              )}
            </Row>
          )}

          {/* Any extra details for expense */}
          {request.type === 'Expense' && d.description && (
            <Row icon={<FileText size={14} className="text-gray-500 dark:text-slate-400" />} label="Details">
              <div className="text-gray-700 dark:text-slate-200 whitespace-pre-wrap">{d.description}</div>
            </Row>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 dark:bg-slate-900/40 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDetailsModal;
