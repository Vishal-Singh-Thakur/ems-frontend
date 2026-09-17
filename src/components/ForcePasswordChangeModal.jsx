import React, { useState } from "react";
import { KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { ChangeMyPasswordAPI, LogoutAPI } from "./Constant/Api/Api";

const PasswordField = ({ name, label, value, onChange, error, show, toggle, autoFocus }) => (
  <div>
    <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1.5">
      {label} <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        autoFocus={autoFocus}
        className={`w-full border rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-slate-700'}`}
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200"
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const forceLogout = async () => {
  try { await fetch(LogoutAPI, { method: 'POST', credentials: 'include' }); } catch { /* best effort */ }
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('_pendingPwd');
  } catch { /* best effort */ }
  window.location.replace('/login');
};

const ForcePasswordChangeModal = ({ user }) => {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState({ next: false, conf: false });
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);

  const change = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
    setApiError(null);
  };

  const validate = () => {
    const e = {};
    if (!form.newPassword || form.newPassword.length < 8) e.newPassword = "Must be at least 8 characters";
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev?.preventDefault?.();
    if (!validate()) return;

    const currentPassword = sessionStorage.getItem('_pendingPwd') || '';

    if (!currentPassword) {
      setApiError("Session expired. Please logout and login again to change password.");
      return;
    }

    if (form.newPassword === currentPassword) {
      setErrors((p) => ({ ...p, newPassword: "New password must be different from the current one" }));
      return;
    }

    try {
      setBusy(true);
      const r = await ApiHit(ChangeMyPasswordAPI, "POST", {
        currentPassword,
        newPassword: form.newPassword
      });
      if (r?.success) {
        setSuccess(true);
        // Auto-logout so user re-logs in with new password
        setTimeout(() => { forceLogout(); }, 1500);
      } else {
        setApiError(r?.message || "Failed to change password");
      }
    } catch (e) {
      setApiError(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header — no close button, this is mandatory */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-slate-900/20 flex items-center justify-center">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">Change Your Password</h2>
              <p className="text-xs opacity-90 mt-0.5">
                Welcome{user?.name ? `, ${user.name}` : ''}! Set a new password to continue.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="p-4 sm:p-5 space-y-4">
          {success ? (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 size={16} /> Password updated. Logging you out — please login again with your new password.
            </div>
          ) : (
            <>
              {apiError && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> <span>{apiError}</span>
                </div>
              )}

              <PasswordField
                name="newPassword"
                label="New Password"
                value={form.newPassword}
                onChange={change}
                error={errors.newPassword}
                show={show.next}
                toggle={() => setShow((p) => ({ ...p, next: !p.next }))}
                autoFocus
              />
              <PasswordField
                name="confirmPassword"
                label="Confirm New Password"
                value={form.confirmPassword}
                onChange={change}
                error={errors.confirmPassword}
                show={show.conf}
                toggle={() => setShow((p) => ({ ...p, conf: !p.conf }))}
              />

              <div className="text-[11px] text-gray-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3 flex items-start gap-2">
                <KeyRound size={12} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Use at least 8 characters. Mix letters, numbers and a symbol for a stronger password.</span>
              </div>
            </>
          )}
        </form>

        {!success && (
          <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/70 px-5 py-3 flex justify-between items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={forceLogout}
              className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 font-medium"
            >
              Logout
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow transition disabled:opacity-50 flex items-center gap-2"
            >
              {busy ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><KeyRound size={14} /> Update Password</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForcePasswordChangeModal;
