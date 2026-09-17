import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Plus, Search, ArrowRightLeft, Undo2, Wrench, Archive, History, Loader2, X, Check, User as UserIcon, Package } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { AssetListAPI, AssetMyAPI, AssetMetaAPI, AssetSummaryAPI, AssetCreateAPI, AssetAssignAPI, AssetReturnAPI, AssetTransferAPI, AssetStatusAPI, AssetHistoryAPI, GetAllUsersAPI } from "../components/Constant/Api/Api";
import { hasPermission } from "../Utils/roleUtils";
import { notifyError, notifyResult, notifyOk } from "../Utils/notify";

const STATUS_STYLE = {
  "In Stock": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  Assigned:   "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30",
  "In Repair":"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  Retired:    "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600",
  Lost:       "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30"
};

const EVENT_LABEL = {
  acquired: "Added to registry", assigned: "Assigned", returned: "Returned",
  transferred: "Transferred", "sent-for-repair": "Sent for repair",
  "back-from-repair": "Back from repair", retired: "Retired", lost: "Marked lost", found: "Found"
};

const Badge = ({ status }) => (
  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${STATUS_STYLE[status] || STATUS_STYLE.Retired}`}>
    {status}
  </span>
);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fmtMoney = (n) => (n == null ? "—" : `₹${Number(n).toLocaleString("en-IN")}`);

const Stat = ({ label, value, icon: Icon, tone, sub }) => (
  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3.5">
    <div className="flex items-center justify-between">
      <p className="text-[11px] text-gray-500 dark:text-slate-400">{label}</p>
      <Icon size={15} className={tone} />
    </div>
    <p className="text-lg font-semibold text-gray-900 dark:text-slate-50 mt-1 tabular-nums">{value}</p>
    {sub && <p className="text-[10px] text-gray-400 dark:text-slate-500 tabular-nums">{sub}</p>}
  </div>
);

/* --------------------------------------------------------------- add form */
const AddAssetForm = ({ meta, onDone, onCancel }) => {
  const [form, setForm] = useState({
    assetTag: "", name: "", category: meta.categories?.[0] || "Laptop",
    make: "", model: "", serialNumber: "", purchaseDate: "", purchaseCost: "",
    usefulLifeMonths: "", notes: ""
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Left blank, the server applies the category's default. Showing it as the
  // placeholder means nobody has to guess what that will be.
  const defaultLife = meta.defaultUsefulLifeMonths?.[form.category];

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.assetTag.trim() || !form.name.trim()) return setError("An asset needs a tag and a name.");

    setBusy(true);
    const r = await ApiHit(AssetCreateAPI, "POST", {
      ...form,
      purchaseCost: form.purchaseCost === "" ? null : Number(form.purchaseCost),
      purchaseDate: form.purchaseDate || null,
      usefulLifeMonths: form.usefulLifeMonths === "" ? undefined : Number(form.usefulLifeMonths)
    });
    setBusy(false);
    if (r?.success) {
      notifyOk(`${form.assetTag.toUpperCase()} added to the registry`);
      onDone();
    } else {
      setError(r?.message || "Could not add the asset.");
    }
  };

  const field = "mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500";

  return (
    <form onSubmit={submit} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold text-gray-800 dark:text-slate-100 text-sm">Add an asset</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Asset tag</span>
          <input value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })}
            placeholder="AST-0041" className={field} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Name</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="MacBook Pro 14" className={field} />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Category</span>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={field}>
            {(meta.categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Serial number</span>
          <input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className={field} />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Cost (₹)</span>
          <input type="number" min="0" value={form.purchaseCost}
            onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })} className={field} />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Purchased on</span>
          <input type="date" value={form.purchaseDate} max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className={field} />
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Useful life (months)</span>
          <input type="number" min="1" value={form.usefulLifeMonths}
            onChange={(e) => setForm({ ...form, usefulLifeMonths: e.target.value })}
            placeholder={defaultLife == null ? "does not depreciate" : String(defaultLife)}
            className={field} />
        </label>
      </div>

      {error && <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm px-3.5 py-2 rounded-lg transition">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Add asset
        </button>
        <button type="button" onClick={onCancel}
          className="text-sm px-3 py-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition">
          Cancel
        </button>
      </div>
    </form>
  );
};

/* ------------------------------------------------------- assign / transfer */
const HolderDialog = ({ asset, mode, people, onDone, onCancel }) => {
  const [employeeId, setEmployeeId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!employeeId) return setError("Pick who is taking it.");
    setBusy(true); setError("");
    const url = mode === "assign" ? AssetAssignAPI(asset._id) : AssetTransferAPI(asset._id);
    const r = await ApiHit(url, "POST", { employeeId, note });
    setBusy(false);
    if (r?.success) {
      notifyOk(r.message);
      onDone();
    } else {
      setError(r?.message || "That did not work.");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 dark:text-slate-100 text-sm">
          {mode === "assign" ? "Assign asset" : "Transfer asset"}
        </h3>
        <p className="text-[11px] text-gray-500 dark:text-slate-400">
          {asset.assetTag} · {asset.name}
          {mode === "transfer" && asset.assignedTo && <> · currently with {asset.assignedTo.name}</>}
        </p>

        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">
            {mode === "assign" ? "Assign to" : "Transfer to"}
          </span>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
            className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">Select a person…</option>
            {people
              .filter((p) => String(p._id) !== String(asset.assignedTo?._id))
              .map((p) => <option key={p._id} value={p._id}>{p.name} ({p.employeeId})</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500" />
        </label>

        {error && <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="flex items-center gap-2">
          <button type="submit" disabled={busy}
            className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm px-3.5 py-2 rounded-lg transition">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Confirm
          </button>
          <button type="button" onClick={onCancel}
            className="text-sm px-3 py-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

/* -------------------------------------------------------------- return */
const ReturnDialog = ({ asset, conditions, onDone, onCancel }) => {
  const [condition, setCondition] = useState("Good");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await ApiHit(AssetReturnAPI(asset._id), "POST", { condition, note });
    setBusy(false);
    if (r?.success) {
      notifyOk(r.message);
      onDone();
    } else {
      notifyError(r?.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 dark:text-slate-100 text-sm">Take asset back</h3>
        <p className="text-[11px] text-gray-500 dark:text-slate-400">
          {asset.assetTag} · from {asset.assignedTo?.name}
        </p>

        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Condition it came back in</span>
          <select value={condition} onChange={(e) => setCondition(e.target.value)}
            className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500">
            {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {condition === "Damaged" && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
              It will go to In Repair rather than back into stock.
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500" />
        </label>

        <div className="flex items-center gap-2">
          <button type="submit" disabled={busy}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm px-3.5 py-2 rounded-lg transition">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />} Confirm return
          </button>
          <button type="button" onClick={onCancel}
            className="text-sm px-3 py-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

/* -------------------------------------------------------------- history */
const HistoryPanel = ({ asset, onClose }) => {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    (async () => {
      const r = await ApiHit(AssetHistoryAPI(asset._id), "GET");
      setEvents(r?.success ? r.data : []);
    })();
  }, [asset._id]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-slate-100 text-sm">{asset.assetTag}</h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">{asset.name} · full history</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400">
            <X size={16} />
          </button>
        </div>

        {events === null ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 py-2">Loading…</p>
        ) : (
          <ol className="space-y-0">
            {events.map((e, i) => (
              <li key={e._id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                  {i < events.length - 1 && <span className="w-px flex-1 bg-gray-200 dark:bg-slate-700" />}
                </div>
                <div className="pb-4 min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 dark:text-slate-100">
                    {EVENT_LABEL[e.event] || e.event}
                    {e.toUserName && <span className="font-normal"> → {e.toUserName}</span>}
                    {e.event === "returned" && e.fromUserName && <span className="font-normal"> from {e.fromUserName}</span>}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    {fmtDate(e.at)} · by {e.actorName} ({e.actorRole})
                    {e.condition && <> · condition {e.condition}</>}
                  </p>
                  {e.note && <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{e.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- page */
const Assets = ({ user }) => {
  const canManage = hasPermission(user, "assets.manage");
  const canViewRegistry = hasPermission(user, "assets.view");

  const [meta, setMeta] = useState({ categories: [], statuses: [], conditions: [] });
  const [assets, setAssets] = useState([]);
  const [mine, setMine] = useState([]);
  const [summary, setSummary] = useState(null);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [holderFor, setHolderFor] = useState(null);
  const [returnFor, setReturnFor] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [ApiHit(AssetMetaAPI, "GET"), ApiHit(AssetMyAPI, "GET")];
      if (canViewRegistry) {
        const query = new URLSearchParams();
        if (statusFilter) query.set("status", statusFilter);
        if (search.trim()) query.set("q", search.trim());
        calls.push(ApiHit(`${AssetListAPI}?${query}`, "GET"));
        calls.push(ApiHit(AssetSummaryAPI, "GET"));
      }
      const [m, my, list, sum] = await Promise.all(calls);
      if (m?.success) setMeta(m.data);
      if (my?.success) setMine(my.data || []);
      if (list?.success) setAssets(list.data || []);
      if (sum?.success) setSummary(sum.data);
    } finally {
      setLoading(false);
    }
  }, [canViewRegistry, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!canManage) return;
    (async () => {
      const r = await ApiHit(GetAllUsersAPI, "GET");
      const rows = r?.data?.users || r?.data || [];
      setPeople(rows.filter((u) => u.isActive));
    })();
  }, [canManage]);

  const act = async (url, body, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    const r = await ApiHit(url, "PATCH", body || {});
    // The server's own wording, on success as well as failure — so "Expense
    // claim approved" and "2 assets not yet returned" read the same way.
    notifyResult(r, r?.message);
    load();
  };

  const totals = useMemo(() => summary?.byStatus || {}, [summary]);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Briefcase size={20} className="text-violet-600 dark:text-violet-400" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Assets</h1>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              What the company owns, who is holding it, and everywhere it has been.
            </p>
          </div>
        </div>
        {canManage && !showAdd && (
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm px-3.5 py-2 rounded-lg transition">
            <Plus size={15} /> Add asset
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="In stock"  value={totals["In Stock"] ?? 0} icon={Package}   tone="text-emerald-500" />
          <Stat label="Assigned"  value={totals.Assigned ?? 0}    icon={UserIcon}  tone="text-blue-500" />
          <Stat label="In repair" value={totals["In Repair"] ?? 0} icon={Wrench}   tone="text-amber-500" />
          <Stat
            label="Book value"
            value={fmtMoney(summary.bookValue)}
            icon={Archive}
            tone="text-violet-500"
            sub={`${fmtMoney(summary.purchaseValue)} paid${summary.unvaluedAssets ? ` · ${summary.unvaluedAssets} unvalued` : ""}`}
          />
        </div>
      )}

      {showAdd && (
        <AddAssetForm meta={meta} onDone={() => { setShowAdd(false); load(); }} onCancel={() => setShowAdd(false)} />
      )}

      {/* Everyone sees this, registry access or not. */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
        <h2 className="font-semibold text-gray-800 dark:text-slate-100 text-sm mb-2">Assigned to you</h2>
        {loading ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">Loading…</p>
        ) : mine.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">Nothing is assigned to you.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {mine.map((a) => (
              <div key={a._id} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <p className="text-[13px] font-medium text-gray-800 dark:text-slate-100">{a.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 tabular-nums">
                  {a.assetTag} · since {fmtDate(a.assignedOn)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {canViewRegistry && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Tag, name or serial number"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            {["", ...(meta.statuses || [])].map((s) => (
              <button key={s || "all"} onClick={() => setStatusFilter(s)}
                className={`text-[11px] px-2.5 py-1.5 rounded-full border transition ${
                  statusFilter === s
                    ? "bg-violet-600 text-white border-violet-600"
                    : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                }`}>
                {s || "All"}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 py-2">Loading…</p>
            ) : assets.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 py-2">No assets match that.</p>
            ) : (
              assets.map((a) => (
                <div key={a._id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] text-gray-500 dark:text-slate-400">{a.assetTag}</span>
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{a.name}</p>
                        <Badge status={a.status} />
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                        {a.category}
                        {a.serialNumber && <> · {a.serialNumber}</>}
                        {a.condition && <> · {a.condition}</>}
                        {a.purchaseCost != null && (
                          <> · worth {fmtMoney(a.bookValue)}
                            {a.fullyDepreciated && <span className="text-gray-400 dark:text-slate-500"> (fully depreciated)</span>}
                          </>
                        )}
                        {a.assignedTo && <> · with <span className="text-gray-700 dark:text-slate-200">{a.assignedTo.name}</span> since {fmtDate(a.assignedOn)}</>}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button onClick={() => setHistoryFor(a)}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                        <History size={11} /> History
                      </button>

                      {canManage && a.status === "In Stock" && (
                        <button onClick={() => setHolderFor({ asset: a, mode: "assign" })}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition">
                          <UserIcon size={11} /> Assign
                        </button>
                      )}

                      {canManage && a.status === "Assigned" && (
                        <>
                          <button onClick={() => setHolderFor({ asset: a, mode: "transfer" })}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition">
                            <ArrowRightLeft size={11} /> Transfer
                          </button>
                          <button onClick={() => setReturnFor(a)}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition">
                            <Undo2 size={11} /> Take back
                          </button>
                        </>
                      )}

                      {canManage && a.status === "In Repair" && (
                        <button onClick={() => act(AssetStatusAPI(a._id), { status: "In Stock", condition: "Good" })}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition">
                          <Check size={11} /> Repaired
                        </button>
                      )}

                      {canManage && !["Assigned", "Retired", "Lost"].includes(a.status) && (
                        <button
                          onClick={() => act(AssetStatusAPI(a._id), { status: "Retired" }, `Retire ${a.assetTag}?`)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                          <Archive size={11} /> Retire
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {holderFor && (
        <HolderDialog asset={holderFor.asset} mode={holderFor.mode} people={people}
          onDone={() => { setHolderFor(null); load(); }} onCancel={() => setHolderFor(null)} />
      )}
      {returnFor && (
        <ReturnDialog asset={returnFor} conditions={meta.conditions || ["Good"]}
          onDone={() => { setReturnFor(null); load(); }} onCancel={() => setReturnFor(null)} />
      )}
      {historyFor && <HistoryPanel asset={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  );
};

export default Assets;
