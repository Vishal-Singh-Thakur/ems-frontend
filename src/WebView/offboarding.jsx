import React, { useEffect, useMemo, useState } from "react";
import {
  UserMinus, CheckCircle2, Circle, MinusCircle, Clock, AlertTriangle, Lock,
  ChevronDown, ChevronRight, Plus, Trash2, X, RefreshCcw, Package, FileText, CalendarDays
} from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { DocumentFileAPI,
  OffboardingListAPI, OffboardingMyStepsAPI, OffboardingStepUpdateAPI,
  OffboardingAssetsAPI, OffboardingAssetAPI, OffboardingLetterAPI,
  OffboardingCancelAPI, OffboardingInitiateAPI
} from "../components/Constant/Api/Api";
import { GetAllUsersAPI } from "../components/Constant/Api/Api";
import { hasPermission } from "../Utils/roleUtils";

const ROLE_LABEL = { hr: "HR", admin: "IT / Admin", manager: "Manager", employee: "Employee" };
const ROLE_PILL = {
  hr:       "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  admin:    "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300",
  manager:  "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300",
  employee: "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300"
};
const STATUS_PILL = {
  "Notice Period": "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Clearance:       "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Completed:       "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Cancelled:       "bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-slate-300"
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtShort = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";
const initials = (n) => (n || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const ProgressBar = ({ percent }) => (
  <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
    <div className={`h-full rounded-full transition-all ${percent === 100 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${percent}%` }} />
  </div>
);

const StepRow = ({ step, onUpdate, busy }) => {
  const overdue = step.status === "Pending" && step.dueDate && new Date(step.dueDate) < new Date();
  const Icon = step.status === "Done" ? CheckCircle2 : step.status === "Skipped" ? MinusCircle : Circle;
  const iconColor = step.status === "Done" ? "text-emerald-500"
    : step.status === "Skipped" ? "text-gray-400 dark:text-slate-500"
    : overdue ? "text-red-500" : "text-gray-300 dark:text-slate-600";

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-slate-800 last:border-0">
      <Icon size={18} className={`${iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${step.status === "Pending" ? "text-gray-800 dark:text-slate-100" : "text-gray-400 dark:text-slate-500 line-through"}`}>
          {step.title}
        </div>
        {step.description && <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{step.description}</div>}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_PILL[step.ownerRole]}`}>
            {ROLE_LABEL[step.ownerRole]}{step.owner ? ` · ${step.owner.name}` : ""}
          </span>
          <span className={`text-[10px] flex items-center gap-1 ${overdue ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-400 dark:text-slate-500"}`}>
            {overdue ? <AlertTriangle size={10} /> : <Clock size={10} />} {fmtShort(step.dueDate)}
          </span>
          {step.blockedByAssets && (
            <span className="text-[10px] flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
              <Lock size={10} /> Assets pending
            </span>
          )}
          {step.completedBy && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500">{step.status} · {step.completedBy.name}</span>
          )}
        </div>
      </div>

      {step.canAction ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button disabled={busy} onClick={() => onUpdate(step._id, "Done")}
            className="text-[11px] px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition">Done</button>
          <button disabled={busy} onClick={() => onUpdate(step._id, "Skipped")}
            className="text-[11px] px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 disabled:opacity-40 transition">Skip</button>
        </div>
      ) : step.status !== "Pending" ? (
        <button disabled={busy} onClick={() => onUpdate(step._id, "Pending")}
          className="text-[11px] px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 disabled:opacity-40 transition flex-shrink-0">Undo</button>
      ) : null}
    </div>
  );
};

const AssetList = ({ run, onAdd, onToggle, onDelete, canManage, canToggle, busy }) => {
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), identifier: identifier.trim() });
    setName(""); setIdentifier("");
  };

  return (
    <div className="rounded-xl border border-gray-100 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-1.5">
          <Package size={14} className="text-blue-600 dark:text-blue-400" /> Company assets
        </h4>
        <span className="text-[11px] text-gray-500 dark:text-slate-400">
          {run.assetsSummary?.returned || 0}/{run.assetsSummary?.total || 0} returned
        </span>
      </div>

      {run.assets?.length === 0 ? (
        <p className="text-[11px] text-gray-400 dark:text-slate-500 py-1">No assets added yet.</p>
      ) : (
        <div className="space-y-1.5 mb-2">
          {run.assets.map((a) => (
            <div key={a._id} className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={a.returned}
                disabled={!canToggle || busy}
                onChange={() => onToggle(a._id, !a.returned)}
                className="w-4 h-4 rounded accent-emerald-600 disabled:opacity-40 flex-shrink-0"
              />
              <span className={`flex-1 min-w-0 truncate ${a.returned ? "text-gray-400 dark:text-slate-500 line-through" : "text-gray-800 dark:text-slate-100"}`}>
                {a.name}{a.identifier ? ` · ${a.identifier}` : ""}
              </span>
              {a.returned && <span className="text-[10px] text-gray-400 dark:text-slate-500 flex-shrink-0">{fmtShort(a.returnedOn)}</span>}
              {canManage && (
                <button onClick={() => onDelete(a._id)} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded flex-shrink-0">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <form onSubmit={submit} className="flex items-center gap-1.5 mt-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Laptop, charger…"
            className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Serial (optional)"
            className="w-32 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"><Plus size={14} /></button>
        </form>
      )}
    </div>
  );
};

const InitiateModal = ({ onClose, onDone }) => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    employeeId: "", reason: "Resignation",
    resignationDate: new Date().toISOString().slice(0, 10),
    noticeDays: 30, remarks: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await ApiHit(GetAllUsersAPI, "GET");
      if (r?.success) setUsers((r.data || []).filter((u) => u.isActive));
    })();
  }, []);

  // Shown live so HR sees what notice period actually means before committing.
  const lastDay = useMemo(() => {
    const d = new Date(form.resignationDate);
    d.setDate(d.getDate() + Number(form.noticeDays || 0));
    return d;
  }, [form.resignationDate, form.noticeDays]);

  const submit = async () => {
    if (!form.employeeId) return;
    setSaving(true);
    try {
      const r = await ApiHit(OffboardingInitiateAPI, "POST", { ...form, lastWorkingDay: lastDay.toISOString() });
      if (r?.success) { onDone(); onClose(); }
      else alert(r?.message || "Failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-semibold text-gray-800 dark:text-slate-100">Start offboarding</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">Employee</label>
            <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100">
              <option value="">Select employee</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name} — {u.roleId?.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">Reason</label>
              <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100">
                {["Resignation", "Termination", "End of Contract", "Retirement", "Other"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">Notice (days)</label>
              <input type="number" min="0" max="365" value={form.noticeDays}
                onChange={(e) => setForm({ ...form, noticeDays: e.target.value })}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">Resignation date</label>
            <input type="date" value={form.resignationDate}
              onChange={(e) => setForm({ ...form, resignationDate: e.target.value })}
              className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100" />
          </div>

          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <CalendarDays size={14} className="flex-shrink-0" />
            Last working day: <strong>{fmtDate(lastDay)}</strong>
          </div>

          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            The employee's account is deactivated automatically once every exit step is done.
          </p>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving || !form.employeeId}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-sm font-medium">Start</button>
        </div>
      </div>
    </div>
  );
};

const Offboarding = ({ user }) => {
  const [list, setList] = useState([]);
  const [mySteps, setMySteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showInitiate, setShowInitiate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const canManage = hasPermission(user, "offboarding.manage");
  const canViewBoard = hasPermission(user, "offboarding.view");
  const canToggleAssets = canManage || user?.roleId?.name === "admin" || user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const calls = [ApiHit(OffboardingMyStepsAPI, "GET")];
      if (canViewBoard) calls.push(ApiHit(`${OffboardingListAPI}?status=${encodeURIComponent(statusFilter)}`, "GET"));
      const [mine, board] = await Promise.all(calls);
      if (mine?.success) setMySteps(mine.data || []);
      if (board?.success) setList(board.data || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [statusFilter]);

  const replace = (updated) => setList((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));

  const act = async (fn) => {
    const r = await fn();
    if (r?.success) {
      if (r.data?._id) replace(r.data);
      const mine = await ApiHit(OffboardingMyStepsAPI, "GET");
      if (mine?.success) setMySteps(mine.data || []);
    } else {
      alert(r?.message || "Action failed");
    }
    return r;
  };

  const updateStep = async (id, stepId, status) => {
    setBusyId(stepId);
    try { await act(() => ApiHit(OffboardingStepUpdateAPI(id, stepId), "PATCH", { status })); }
    finally { setBusyId(null); }
  };

  const issueLetter = async (id, name) => {
    if (!window.confirm(`Issue the experience letter for ${name}?`)) return;
    setBusyId(id);
    try { await act(() => ApiHit(OffboardingLetterAPI(id), "POST", {})); }
    finally { setBusyId(null); }
  };

  const stats = useMemo(() => ({
    active: list.filter((o) => ["Notice Period", "Clearance"].includes(o.status)).length,
    overdueOnMe: mySteps.filter((s) => s.overdue).length
  }), [list, mySteps]);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <UserMinus className="text-rose-600 dark:text-rose-400" /> Offboarding
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            From resignation through clearance, assets and the experience letter.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition">
            <RefreshCcw size={14} /> Refresh
          </button>
          {canManage && (
            <button onClick={() => setShowInitiate(true)}
              className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white px-4 py-2 rounded-lg shadow transition">
              <UserMinus size={14} /> Start offboarding
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-800 p-4 sm:p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 dark:text-slate-100 text-sm">Your pending exit steps</h2>
          {stats.overdueOnMe > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300">
              {stats.overdueOnMe} overdue
            </span>
          )}
        </div>

        {mySteps.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 py-2">{loading ? "Loading…" : "Nothing pending."}</p>
        ) : (
          <div className="space-y-2">
            {mySteps.map((s) => (
              <div key={`${s.offboardingId}-${s.stepId}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900/40">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {initials(s.employee?.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 dark:text-slate-100 truncate">{s.title}</div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">
                    {s.employee?.name} · <span className={s.overdue ? "text-red-600 dark:text-red-400 font-semibold" : ""}>{fmtShort(s.dueDate)}</span>
                    {s.blockedByAssets && <span className="text-orange-600 dark:text-orange-400"> · assets pending</span>}
                  </div>
                </div>
                <button disabled={busyId === s.stepId || s.blockedByAssets}
                  onClick={() => updateStep(s.offboardingId, s.stepId, "Done")}
                  title={s.blockedByAssets ? "Mark all assets returned first" : "Mark done"}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition flex-shrink-0">
                  Done
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {canViewBoard && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 flex-wrap gap-3">
            <h2 className="font-semibold text-gray-800 dark:text-slate-100 text-sm">
              Exits <span className="text-gray-400 dark:text-slate-500 font-normal">({list.length})</span>
            </h2>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200">
              <option value="">Sab</option>
              <option value="Notice Period">Notice Period</option>
              <option value="Clearance">Clearance</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {list.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-slate-500">
              {loading ? "Loading…" : "No offboarding found."}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {list.map((o) => {
                const open = expanded === o._id;
                const days = o.daysToLastDay;
                return (
                  <div key={o._id}>
                    <button onClick={() => setExpanded(open ? null : o._id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition text-left">
                      {open ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                        {initials(o.employee?.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 dark:text-slate-100 truncate flex items-center gap-2">
                          {o.employee?.name}
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_PILL[o.status]}`}>{o.status}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                          {o.reason} · Last day {fmtDate(o.lastWorkingDay)}
                          {["Notice Period", "Clearance"].includes(o.status) && days !== null && (
                            <span className={days < 0 ? "text-red-600 dark:text-red-400" : ""}>
                              {" · "}{days > 0 ? `${days} din baaki` : days === 0 ? "aaj aakhri din" : `${Math.abs(days)} din nikal gaye`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-28 sm:w-40 flex-shrink-0">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-400 mb-1">
                          <span>{o.progress?.done}/{o.progress?.total}</span>
                          <span>{o.progress?.percent}%</span>
                        </div>
                        <ProgressBar percent={o.progress?.percent || 0} />
                      </div>
                    </button>

                    {open && (
                      <div className="px-5 pb-4 pl-14 space-y-3">
                        <AssetList
                          run={o}
                          canManage={canManage && !["Completed", "Cancelled"].includes(o.status)}
                          canToggle={canToggleAssets && !["Completed", "Cancelled"].includes(o.status)}
                          busy={busyId === o._id}
                          onAdd={(a) => act(() => ApiHit(OffboardingAssetsAPI(o._id), "POST", a))}
                          onToggle={(assetId, returned) => act(() => ApiHit(OffboardingAssetAPI(o._id, assetId), "PATCH", { returned }))}
                          onDelete={(assetId) => act(() => ApiHit(OffboardingAssetAPI(o._id, assetId), "DELETE"))}
                        />

                        <div className="rounded-xl border border-gray-100 dark:border-slate-700 px-4">
                          {o.steps.map((s) => (
                            <StepRow key={s._id} step={s} busy={busyId === s._id}
                              onUpdate={(stepId, status) => updateStep(o._id, stepId, status)} />
                          ))}
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          {o.experienceLetter?.documentId ? (
                            <a href={DocumentFileAPI(o.experienceLetter.documentId._id)} target="_blank" rel="noopener noreferrer"
                              className="text-[11px] flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline">
                              <FileText size={13} /> View experience letter
                            </a>
                          ) : canManage && o.status !== "Cancelled" ? (
                            <button disabled={busyId === o._id} onClick={() => issueLetter(o._id, o.employee?.name)}
                              className="text-[11px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 disabled:opacity-40 transition">
                              <FileText size={13} /> Issue experience letter
                            </button>
                          ) : null}

                          {canManage && ["Notice Period", "Clearance"].includes(o.status) && (
                            <button
                              onClick={async () => {
                                if (!window.confirm(`Cancel offboarding for ${o.employee?.name}? (resignation withdrawn)`)) return;
                                const r = await ApiHit(OffboardingCancelAPI(o._id), "PATCH");
                                if (r?.success) load(); else alert(r?.message || "Cancel failed");
                              }}
                              className="text-[11px] text-red-600 dark:text-red-400 hover:underline">
                              Cancel offboarding
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showInitiate && <InitiateModal onClose={() => setShowInitiate(false)} onDone={load} />}
    </main>
  );
};

export default Offboarding;
