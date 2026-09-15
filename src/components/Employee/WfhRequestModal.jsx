import React, { useState } from "react";
import { Home, Calendar, X, CheckCircle2, AlertCircle, Loader2, FileText } from "lucide-react";
import ApiHit from "../../Utils/ApiHit";
import { ApplyLeaveAPI } from "../Constant/Api/Api";

const WfhRequestModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    fromDate: "",
    toDate: "",
    reason: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
    setApiError(null);
  };

  const validate = () => {
    const e = {};
    if (!form.fromDate) e.fromDate = "Start date is required";
    if (!form.toDate) e.toDate = "End date is required";
    if (form.fromDate && form.toDate && new Date(form.toDate) < new Date(form.fromDate)) {
      e.toDate = "End date must be after start date";
    }
    if (!form.reason || form.reason.trim().length < 10) e.reason = "Reason must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const daysCount = () => {
    if (!form.fromDate || !form.toDate) return 0;
    const a = new Date(form.fromDate);
    const b = new Date(form.toDate);
    return Math.max(1, Math.round((b - a) / 86400000) + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      setApiError(null);
      const payload = {
        leaveType: "Work From Home",
        fromDate: form.fromDate,
        toDate: form.toDate,
        reason: form.reason.trim()
      };
      const res = await ApiHit(ApplyLeaveAPI, "POST", payload);
      if (res?.success) {
        setSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => { setSuccess(false); if (onClose) onClose(); }, 1400);
      } else {
        setApiError(res?.message || "Failed to submit request");
      }
    } catch (err) {
      setApiError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const days = daysCount();

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-slate-900/20 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-slate-900/20 flex items-center justify-center">
              <Home size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">Request Work From Home</h2>
              <p className="text-xs opacity-90 mt-0.5">Submit your WFH request for manager approval.</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
              WFH request submitted successfully!
            </div>
          )}
          {apiError && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
              <AlertCircle size={16} /> {apiError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Calendar size={12} className="text-cyan-600 dark:text-cyan-400" /> Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fromDate"
                value={form.fromDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${errors.fromDate ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-slate-700'}`}
              />
              {errors.fromDate && <p className="text-red-500 text-xs mt-1">{errors.fromDate}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Calendar size={12} className="text-cyan-600 dark:text-cyan-400" /> End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="toDate"
                value={form.toDate}
                onChange={handleChange}
                min={form.fromDate || new Date().toISOString().split('T')[0]}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${errors.toDate ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-slate-700'}`}
              />
              {errors.toDate && <p className="text-red-500 text-xs mt-1">{errors.toDate}</p>}
            </div>
          </div>

          {days > 0 && (
            <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 rounded-xl px-3 py-2 text-sm text-cyan-800 dark:text-cyan-300">
              <span className="font-semibold">Duration:</span> {days} day{days > 1 ? 's' : ''}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <FileText size={12} className="text-cyan-600 dark:text-cyan-400" /> Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              rows="4"
              value={form.reason}
              onChange={handleChange}
              placeholder="Why do you need to work from home?"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${errors.reason ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-slate-700'}`}
            />
            <div className="flex justify-between text-xs mt-1">
              {errors.reason ? <span className="text-red-500">{errors.reason}</span> : <span />}
              <span className="text-gray-500 dark:text-slate-400">{form.reason.length} chars (min 10)</span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/70 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl shadow transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <><Home size={14} /> Submit Request</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WfhRequestModal;
