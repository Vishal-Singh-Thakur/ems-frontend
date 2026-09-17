import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReceiptText, Plus, Check, X, Paperclip, Wallet, Clock,
  CheckCircle2, XCircle, IndianRupee, Loader2, Trash2, Pencil
} from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import {
  ExpenseListAPI, ExpenseMyAPI, ExpenseCreateAPI, ExpenseMetaAPI, ExpenseSummaryAPI,
  ExpenseReceiptAPI, ExpenseApproveAPI, ExpenseRejectAPI, ExpensePayAPI,
  ExpenseCancelAPI, ExpenseByIdAPI
} from "../components/Constant/Api/Api";
import { hasPermission } from "../Utils/roleUtils";
import { notifyError, notifyResult, notifyOk } from "../Utils/notify";

const STATUS_STYLES = {
  Pending:   "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  Approved:  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30",
  Paid:      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  Rejected:  "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30",
  Cancelled: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600"
};

const Badge = ({ status }) => (
  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[status] || STATUS_STYLES.Cancelled}`}>
    {status}
  </span>
);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fmtMoney = (e) => `${e.currency === "INR" ? "₹" : `${e.currency} `}${Number(e.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Card = ({ label, value, sub, icon: Icon, tone }) => (
  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3.5">
    <div className="flex items-center justify-between">
      <p className="text-[11px] text-gray-500 dark:text-slate-400">{label}</p>
      <Icon size={15} className={tone} />
    </div>
    <p className="text-lg font-semibold text-gray-900 dark:text-slate-50 mt-1">{value}</p>
    <p className="text-[10px] text-gray-400 dark:text-slate-500">{sub}</p>
  </div>
);

/* ---------------------------------------------------------------- submit form */
const ClaimForm = ({ categories, editing, onDone, onCancel }) => {
  const [form, setForm] = useState(() => ({
    category: editing?.category || categories[0] || "Travel",
    title: editing?.title || "",
    description: editing?.description || "",
    amount: editing?.amount ?? "",
    expenseDate: editing?.expenseDate ? new Date(editing.expenseDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    receipt: null
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Give the claim a short title.");
    if (!(Number(form.amount) > 0)) return setError("Amount must be greater than zero.");

    // Sent as multipart because a receipt file may ride along.
    const fd = new FormData();
    fd.append("category", form.category);
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    fd.append("amount", String(form.amount));
    fd.append("expenseDate", form.expenseDate);
    if (form.receipt) fd.append("receipt", form.receipt);

    setBusy(true);
    try {
      const r = editing
        ? await ApiHit(ExpenseByIdAPI(editing._id), "PATCH", fd)
        : await ApiHit(ExpenseCreateAPI, "POST", fd);
      if (r?.success) {
        notifyOk(editing ? "Claim updated" : "Claim submitted");
        onDone();
      } else {
        setError(r?.message || "Could not save the claim.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold text-gray-800 dark:text-slate-100 text-sm">
        {editing ? "Edit claim" : "New expense claim"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Category</span>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Amount (₹)</span>
          <input
            type="number" step="0.01" min="0.01" value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Title</span>
          <input
            value={form.title} maxLength={120}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Cab to client office"
            className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500"
          />
        </label>

        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Date of expense</span>
          <input
            type="date" value={form.expenseDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
            className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500"
          />
        </label>

        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Receipt (image or PDF)</span>
          <input
            type="file" accept="image/*,application/pdf"
            onChange={(e) => setForm({ ...form, receipt: e.target.files?.[0] || null })}
            className="mt-1 w-full text-[11px] text-gray-600 dark:text-slate-300 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:bg-violet-50 dark:file:bg-violet-500/15 file:text-violet-700 dark:file:text-violet-300"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Notes (optional)</span>
          <textarea
            rows={2} value={form.description} maxLength={1000}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500"
          />
        </label>
      </div>

      {error && <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit" disabled={busy}
          className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm px-3.5 py-2 rounded-lg transition"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {editing ? "Save changes" : "Submit claim"}
        </button>
        <button
          type="button" onClick={onCancel}
          className="text-sm px-3 py-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

/* ------------------------------------------------------------- payment dialog */
const PayDialog = ({ claim, modes, onDone, onCancel }) => {
  const [form, setForm] = useState({ mode: modes[0] || "Bank Transfer", reference: "", remarks: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await ApiHit(ExpensePayAPI(claim._id), "PATCH", form);
    setBusy(false);
    if (r?.success) {
      notifyOk(`Payment recorded for ${claim.employee?.name}`);
      onDone();
    } else {
      setError(r?.message || "Could not record the payment.");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3"
      >
        <h3 className="font-semibold text-gray-800 dark:text-slate-100 text-sm">Record payment</h3>
        <p className="text-[11px] text-gray-500 dark:text-slate-400">
          {claim.employee?.name} · {claim.title} · <span className="font-semibold">{fmtMoney(claim)}</span>
        </p>

        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Mode</span>
          <select
            value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}
            className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500"
          >
            {modes.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Reference (UTR, txn id)</span>
          <input
            value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })}
            className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500"
          />
        </label>

        {error && <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="flex items-center gap-2">
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm px-3.5 py-2 rounded-lg transition">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />} Mark paid
          </button>
          <button type="button" onClick={onCancel} className="text-sm px-3 py-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

/* --------------------------------------------------------------- claim row */
const ClaimRow = ({ claim, showWho, actions }) => (
  <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{claim.title}</p>
          <Badge status={claim.status} />
        </div>
        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
          {showWho && <>{claim.employee?.name} · </>}
          {claim.category} · {fmtDate(claim.expenseDate)}
        </p>
        {claim.description && (
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">{claim.description}</p>
        )}
        {claim.status === "Rejected" && claim.rejectionReason && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">Reason: {claim.rejectionReason}</p>
        )}
        {claim.status === "Paid" && claim.payment?.paidOn && (
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
            Paid {fmtDate(claim.payment.paidOn)} via {claim.payment.mode}
            {claim.payment.reference ? ` · ${claim.payment.reference}` : ""}
          </p>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-slate-50">{fmtMoney(claim)}</p>
        {claim.receipt && (
          <a
            href={ExpenseReceiptAPI(claim._id)} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 hover:underline mt-0.5"
          >
            <Paperclip size={10} /> Receipt
          </a>
        )}
      </div>
    </div>

    {actions && <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">{actions}</div>}
  </div>
);

/* ------------------------------------------------------------------- page */
const Expenses = ({ user }) => {
  const canViewBoard = hasPermission(user, "expenses.view");
  const canPay = hasPermission(user, "expenses.pay");

  const [meta, setMeta] = useState({ categories: [], paymentModes: [] });
  const [mine, setMine] = useState([]);
  const [board, setBoard] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [paying, setPaying] = useState(null);
  const [tab, setTab] = useState("mine");
  const [statusFilter, setStatusFilter] = useState("Pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [
        ApiHit(ExpenseMetaAPI, "GET"),
        ApiHit(ExpenseMyAPI, "GET"),
        ApiHit(`${ExpenseSummaryAPI}${canViewBoard ? "" : "?mine=true"}`, "GET")
      ];
      if (canViewBoard) calls.push(ApiHit(`${ExpenseListAPI}?status=${encodeURIComponent(statusFilter)}`, "GET"));

      const [m, my, sum, list] = await Promise.all(calls);
      if (m?.success) setMeta(m.data);
      if (my?.success) setMine(my.data || []);
      if (sum?.success) setSummary(sum.data);
      if (list?.success) setBoard(list.data || []);
    } finally {
      setLoading(false);
    }
  }, [canViewBoard, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const act = async (url, body, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    const r = await ApiHit(url, "PATCH", body || {});
    // The server's own wording, on success as well as failure — so "Expense
    // claim approved" and "2 assets not yet returned" read the same way.
    notifyResult(r, r?.message);
    load();
  };

  const reject = (claim) => {
    const reason = window.prompt(`Why is ${claim.employee?.name}'s claim being rejected?`);
    if (reason === null) return;
    if (!reason.trim()) return notifyError("A rejection reason is required.");
    act(ExpenseRejectAPI(claim._id), { reason: reason.trim() });
  };

  const totals = useMemo(() => summary || {}, [summary]);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ReceiptText size={20} className="text-violet-600 dark:text-violet-400" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Expenses</h1>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Submit a claim, track approval, and see when it was reimbursed.
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm px-3.5 py-2 rounded-lg transition"
          >
            <Plus size={15} /> New claim
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card label="Pending"  value={totals.Pending?.count ?? 0}  sub={`₹${(totals.Pending?.amount ?? 0).toLocaleString("en-IN")}`}  icon={Clock}        tone="text-amber-500" />
          <Card label="Approved" value={totals.Approved?.count ?? 0} sub={`₹${(totals.Approved?.amount ?? 0).toLocaleString("en-IN")} to pay`} icon={CheckCircle2} tone="text-blue-500" />
          <Card label="Paid"     value={totals.Paid?.count ?? 0}     sub={`₹${(totals.Paid?.amount ?? 0).toLocaleString("en-IN")}`}     icon={IndianRupee}  tone="text-emerald-500" />
          <Card label="Rejected" value={totals.Rejected?.count ?? 0} sub={`₹${(totals.Rejected?.amount ?? 0).toLocaleString("en-IN")}`} icon={XCircle}      tone="text-rose-500" />
        </div>
      )}

      {showForm && (
        <ClaimForm
          categories={meta.categories}
          editing={editing}
          onDone={() => { setShowForm(false); setEditing(null); load(); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {canViewBoard && (
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-slate-700">
          {[["mine", "My claims"], ["board", "Team claims"]].map(([k, label]) => (
            <button
              key={k} onClick={() => setTab(k)}
              className={`text-sm px-3 py-2 -mb-px border-b-2 transition ${
                tab === k
                  ? "border-violet-600 text-violet-700 dark:text-violet-300"
                  : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {(!canViewBoard || tab === "mine") && (
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 py-2">Loading…</p>
          ) : mine.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 py-2">No claims yet.</p>
          ) : (
            mine.map((c) => (
              <ClaimRow
                key={c._id}
                claim={c}
                actions={
                  c.status === "Pending" ? (
                    <>
                      <button
                        onClick={() => { setEditing(c); setShowForm(true); }}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                      >
                        <Pencil size={11} /> Edit
                      </button>
                      <button
                        onClick={() => act(ExpenseCancelAPI(c._id), {}, `Withdraw "${c.title}"?`)}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                      >
                        <Trash2 size={11} /> Withdraw
                      </button>
                    </>
                  ) : null
                }
              />
            ))
          )}
        </div>
      )}

      {canViewBoard && tab === "board" && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {["Pending", "Approved", "Paid", "Rejected", "Cancelled"].map((s) => (
              <button
                key={s} onClick={() => setStatusFilter(s)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                  statusFilter === s
                    ? "bg-violet-600 text-white border-violet-600"
                    : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 py-2">Loading…</p>
          ) : board.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 py-2">No {statusFilter.toLowerCase()} claims.</p>
          ) : (
            board.map((c) => (
              <ClaimRow
                key={c._id}
                claim={c}
                showWho
                actions={
                  /* canApprove / canPay come from the server, so a button is only
                     ever shown when the API would actually allow the action. */
                  <>
                    {c.canApprove && (
                      <>
                        <button
                          onClick={() => act(ExpenseApproveAPI(c._id), {}, `Approve ${fmtMoney(c)} for ${c.employee?.name}?`)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition"
                        >
                          <Check size={11} /> Approve
                        </button>
                        <button
                          onClick={() => reject(c)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                        >
                          <X size={11} /> Reject
                        </button>
                      </>
                    )}
                    {c.canPay && canPay && (
                      <button
                        onClick={() => setPaying(c)}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition"
                      >
                        <Wallet size={11} /> Record payment
                      </button>
                    )}
                  </>
                }
              />
            ))
          )}
        </div>
      )}

      {paying && (
        <PayDialog
          claim={paying}
          modes={meta.paymentModes}
          onDone={() => { setPaying(null); load(); }}
          onCancel={() => setPaying(null)}
        />
      )}
    </div>
  );
};

export default Expenses;
