import React, { useEffect, useMemo, useState } from "react";
import {
  UserPlus, CheckCircle2, Circle, MinusCircle, Clock, AlertTriangle,
  ChevronDown, ChevronRight, Settings2, Plus, Trash2, Pencil, X, RefreshCcw
} from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import {
  OnboardingListAPI, OnboardingMyStepsAPI, OnboardingStepUpdateAPI,
  OnboardingTemplateAPI, OnboardingTemplateStepAPI, OnboardingCancelAPI
} from "../components/Constant/Api/Api";
import { hasPermission } from "../Utils/roleUtils";

const ROLE_LABEL = { hr: "HR", admin: "IT / Admin", manager: "Manager", employee: "Employee" };
const ROLE_PILL = {
  hr:       "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  admin:    "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300",
  manager:  "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300",
  employee: "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300"
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";
const initials = (n) => (n || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const ProgressBar = ({ percent }) => (
  <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
    <div
      className={`h-full rounded-full transition-all ${percent === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
      style={{ width: `${percent}%` }}
    />
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
        {step.description && (
          <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{step.description}</div>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_PILL[step.ownerRole]}`}>
            {ROLE_LABEL[step.ownerRole]}
            {step.owner ? ` · ${step.owner.name}` : ""}
          </span>
          <span className={`text-[10px] flex items-center gap-1 ${overdue ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-400 dark:text-slate-500"}`}>
            {overdue ? <AlertTriangle size={10} /> : <Clock size={10} />} {fmtDate(step.dueDate)}
          </span>
          {step.completedBy && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500">
              {step.status} · {step.completedBy.name}
            </span>
          )}
        </div>
      </div>

      {step.canAction ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            disabled={busy}
            onClick={() => onUpdate(step._id, "Done")}
            className="text-[11px] px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition"
          >
            Done
          </button>
          <button
            disabled={busy}
            onClick={() => onUpdate(step._id, "Skipped")}
            className="text-[11px] px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 disabled:opacity-40 transition"
          >
            Skip
          </button>
        </div>
      ) : step.status !== "Pending" ? (
        <button
          disabled={busy}
          onClick={() => onUpdate(step._id, "Pending")}
          className="text-[11px] px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 disabled:opacity-40 transition flex-shrink-0"
          title="Reopen"
        >
          Undo
        </button>
      ) : null}
    </div>
  );
};

/* ------------------------------ Template editor ------------------------------ */

const TemplateEditor = ({ onClose, onChanged }) => {
  const [steps, setSteps] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const r = await ApiHit(OnboardingTemplateAPI, "GET");
    if (r?.success) setSteps(r.data || []);
  };
  useEffect(() => { load(); }, []);

  const blank = { title: "", description: "", ownerRole: "hr", dueDayOffset: 0 };

  const save = async () => {
    if (!editing?.title?.trim()) return;
    setSaving(true);
    try {
      const r = editing._id
        ? await ApiHit(OnboardingTemplateStepAPI(editing._id), "PUT", editing)
        : await ApiHit(OnboardingTemplateAPI, "POST", editing);
      if (r?.success) { setEditing(null); await load(); onChanged?.(); }
      else alert(r?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const remove = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    const r = await ApiHit(OnboardingTemplateStepAPI(id), "DELETE");
    if (r?.success) { await load(); onChanged?.(); }
    else alert(r?.message || "Delete failed");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-slate-100">Onboarding Checklist</h2>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              These steps are assigned automatically to every new employee.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {steps.map((s) => (
            <div key={s._id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-slate-100">{s.title}</div>
                {s.description && <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{s.description}</div>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_PILL[s.ownerRole]}`}>
                    {ROLE_LABEL[s.ownerRole]}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">
                    Day {s.dueDayOffset}
                  </span>
                </div>
              </div>
              <button onClick={() => setEditing(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg">
                <Pencil size={14} />
              </button>
              <button onClick={() => remove(s._id, s.title)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {editing && (
            <div className="p-3 rounded-xl border-2 border-blue-400 dark:border-blue-500/50 space-y-2">
              <input
                autoFocus
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Step title"
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={editing.description || ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <select
                  value={editing.ownerRole}
                  onChange={(e) => setEditing({ ...editing, ownerRole: e.target.value })}
                  className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
                >
                  {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-500 dark:text-slate-400">Day</span>
                  <input
                    type="number" min="0" max="365"
                    value={editing.dueDayOffset}
                    onChange={(e) => setEditing({ ...editing, dueDayOffset: Number(e.target.value) })}
                    className="w-16 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-2 text-xs bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
                  />
                </div>
                <button onClick={save} disabled={saving} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium">
                  Save
                </button>
                <button onClick={() => setEditing(null)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-xs">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={() => setEditing({ ...blank })}
            className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            <Plus size={15} /> Add step
          </button>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------- Page --------------------------------- */

const Onboarding = ({ user }) => {
  const [list, setList] = useState([]);
  const [mySteps, setMySteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("In Progress");

  const canManage = hasPermission(user, "onboarding.manage");
  const canViewBoard = hasPermission(user, "onboarding.view");

  const load = async () => {
    setLoading(true);
    try {
      const calls = [ApiHit(OnboardingMyStepsAPI, "GET")];
      if (canViewBoard) calls.push(ApiHit(`${OnboardingListAPI}?status=${encodeURIComponent(statusFilter)}`, "GET"));
      const [mine, board] = await Promise.all(calls);
      if (mine?.success) setMySteps(mine.data || []);
      if (board?.success) setList(board.data || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [statusFilter]);

  const updateStep = async (onboardingId, stepId, status) => {
    setBusyId(stepId);
    try {
      const r = await ApiHit(OnboardingStepUpdateAPI(onboardingId, stepId), "PATCH", { status });
      if (r?.success) {
        // Replace just this run so an expanded card doesn't collapse.
        setList((prev) => prev.map((o) => (o._id === r.data._id ? r.data : o)));
        const mine = await ApiHit(OnboardingMyStepsAPI, "GET");
        if (mine?.success) setMySteps(mine.data || []);
      } else {
        alert(r?.message || "Update failed");
      }
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (id, name) => {
    if (!window.confirm(`Cancel onboarding for ${name}?`)) return;
    const r = await ApiHit(OnboardingCancelAPI(id), "PATCH");
    if (r?.success) load();
    else alert(r?.message || "Cancel failed");
  };

  const stats = useMemo(() => ({
    running: list.filter((o) => o.status === "In Progress").length,
    pendingOnMe: mySteps.length,
    overdueOnMe: mySteps.filter((s) => s.overdue).length
  }), [list, mySteps]);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <UserPlus className="text-blue-600 dark:text-blue-400" /> Onboarding
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            The checklist is assigned automatically as soon as a new employee is added.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          {canManage && (
            <button
              onClick={() => setShowTemplate(true)}
              className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow transition"
            >
              <Settings2 size={14} /> Checklist edit
            </button>
          )}
        </div>
      </div>

      {/* My queue first — most people open this page to do their bit, not to watch. */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-800 p-4 sm:p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 dark:text-slate-100 text-sm">
            Your pending steps
          </h2>
          {stats.overdueOnMe > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300">
              {stats.overdueOnMe} overdue
            </span>
          )}
        </div>

        {mySteps.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 py-2">
            {loading ? "Loading…" : "Nothing pending. 🎉"}
          </p>
        ) : (
          <div className="space-y-2">
            {mySteps.map((s) => (
              <div key={`${s.onboardingId}-${s.stepId}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900/40">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {initials(s.employee?.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 dark:text-slate-100 truncate">{s.title}</div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">
                    {s.employee?.name} · <span className={s.overdue ? "text-red-600 dark:text-red-400 font-semibold" : ""}>{fmtDate(s.dueDate)}</span>
                  </div>
                </div>
                <button
                  disabled={busyId === s.stepId}
                  onClick={() => updateStep(s.onboardingId, s.stepId, "Done")}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition flex-shrink-0"
                >
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
              Onboardings <span className="text-gray-400 dark:text-slate-500 font-normal">({list.length})</span>
            </h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200"
            >
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="">Sab</option>
            </select>
          </div>

          {list.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-slate-500">
              {loading ? "Loading…" : "No onboarding found."}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {list.map((o) => {
                const open = expanded === o._id;
                return (
                  <div key={o._id}>
                    <button
                      onClick={() => setExpanded(open ? null : o._id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition text-left"
                    >
                      {open ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                            : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                        {initials(o.employee?.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 dark:text-slate-100 truncate">{o.employee?.name}</div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                          {o.employee?.departmentId?.name || "—"} · Joined {fmtDate(o.joiningDate)}
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
                      <div className="px-5 pb-4 pl-14">
                        <div className="rounded-xl border border-gray-100 dark:border-slate-700 px-4">
                          {o.steps.map((s) => (
                            <StepRow
                              key={s._id}
                              step={s}
                              busy={busyId === s._id}
                              onUpdate={(stepId, status) => updateStep(o._id, stepId, status)}
                            />
                          ))}
                        </div>
                        {canManage && o.status === "In Progress" && (
                          <button
                            onClick={() => cancel(o._id, o.employee?.name)}
                            className="mt-2 text-[11px] text-red-600 dark:text-red-400 hover:underline"
                          >
                            Cancel onboarding
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showTemplate && <TemplateEditor onClose={() => setShowTemplate(false)} onChanged={load} />}
    </main>
  );
};

export default Onboarding;
