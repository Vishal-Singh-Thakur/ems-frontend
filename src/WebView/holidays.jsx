import React, { useEffect, useMemo, useState } from "react";
import { PartyPopper, Plus, Trash2, X, Pencil, Sparkles } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import {
  GetHolidaysAPI,
  CreateHolidayAPI,
  UpdateHolidayAPI,
  DeleteHolidayAPI
} from "../components/Constant/Api/Api";
import INDIAN_HOLIDAYS from "../Data/indianHolidays";

const TYPES = ['Public', 'Company', 'Festival', 'Optional', 'Other'];

const TYPE_STYLE = {
  Public:   { bg: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30' },
  Company:  { bg: 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30' },
  Festival: { bg: 'bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-500/30' },
  Optional: { bg: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' },
  Other:    { bg: 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700' }
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '';

const Holidays = ({ user }) => {
  const role = (user?.roleId?.name || user?.role || '').toLowerCase();
  const canManage = role === 'hr' || role === 'superadmin';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', type: 'Public', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await ApiHit(GetHolidaysAPI, "GET");
      if (r?.success) setItems(r.data?.docs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', date: '', type: 'Public', description: '' });
    setErrors([]);
    setShowModal(true);
  };

  const openEdit = (h) => {
    setEditingId(h._id);
    setForm({
      name: h.name,
      date: new Date(h.date).toISOString().slice(0, 10),
      type: h.type,
      description: h.description || ''
    });
    setErrors([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? UpdateHolidayAPI(editingId) : CreateHolidayAPI;
      const method = isEdit ? 'PUT' : 'POST';
      const r = await ApiHit(url, method, form);
      if (r?.success) { closeModal(); fetchAll(); }
      else setErrors(r?.errors || [{ message: r?.message || 'Failed' }]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    const r = await ApiHit(DeleteHolidayAPI(id), "DELETE");
    if (r?.success) fetchAll();
    else alert(r?.message || 'Failed');
  };

  // Merge DB holidays with system-provided Indian holidays.
  // Dedupe by DATE only (so typos like "Independance Day" still hide system's "Independence Day")
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dbDates = useMemo(() => {
    const set = new Set();
    items.forEach((h) => set.add(new Date(h.date).toISOString().slice(0, 10)));
    return set;
  }, [items]);

  const systemHolidays = useMemo(
    () => INDIAN_HOLIDAYS.filter((h) => !dbDates.has(h.date)),
    [dbDates]
  );

  const allHolidays = [...items, ...systemHolidays];
  const upcoming = allHolidays.filter((h) => new Date(h.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = items.filter((h) => new Date(h.date) < today).sort((a, b) => new Date(b.date) - new Date(a.date));

  const daysUntil = (d) => Math.ceil((new Date(d).setHours(0,0,0,0) - today.getTime()) / 86400000);

  const addSystemHoliday = (h) => {
    setEditingId(null);
    setForm({ name: h.name, date: h.date, type: h.type, description: h.description || '' });
    setErrors([]);
    setShowModal(true);
  };

  const renderCard = (h) => {
    const style = TYPE_STYLE[h.type] || TYPE_STYLE.Other;
    const isSystem = !!h.isSystem;
    const days = daysUntil(h.date);
    const isUpcoming = days >= 0;
    const isSoon = isUpcoming && days <= 30;

    // Color coding: soon (<=30d) → amber/orange, later upcoming → green, system → indigo, past → pink (default)
    let iconGradient = 'bg-gradient-to-br from-pink-400 to-fuchsia-600';
    let cardBorder = 'border-gray-100 dark:border-slate-800';
    if (isSoon) {
      iconGradient = 'bg-gradient-to-br from-amber-500 to-orange-600';
      cardBorder = 'border-amber-200 dark:border-amber-500/30 ring-1 ring-amber-100';
    } else if (isUpcoming && isSystem) {
      iconGradient = 'bg-gradient-to-br from-indigo-400 to-blue-600';
      cardBorder = 'border-dashed border-indigo-200 dark:border-indigo-500/30';
    } else if (isUpcoming) {
      iconGradient = 'bg-gradient-to-br from-emerald-500 to-teal-600';
      cardBorder = 'border-emerald-200 dark:border-emerald-500/30';
    } else if (isSystem) {
      cardBorder = 'border-dashed border-gray-200 dark:border-slate-700';
    }

    return (
      <div key={h._id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow border p-4 relative ${cardBorder}`}>
        {canManage && !isSystem && (
          <div className="absolute top-2 right-2 flex gap-1">
            <button onClick={() => openEdit(h)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg" title="Edit"><Pencil size={14} /></button>
            <button onClick={() => handleDelete(h._id, h.name)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg" title="Delete"><Trash2 size={14} /></button>
          </div>
        )}
        {canManage && isSystem && (
          <div className="absolute top-2 right-2">
            <button
              onClick={() => addSystemHoliday(h)}
              className="p-1.5 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-500/10 rounded-lg"
              title="Add to company calendar"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl text-white flex flex-col items-center justify-center flex-shrink-0 ${iconGradient}`}>
            <div className="text-[10px] uppercase leading-none">{new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}</div>
            <div className="text-lg font-bold leading-none">{new Date(h.date).getDate()}</div>
          </div>
          <div className={`flex-1 min-w-0 ${canManage ? 'pr-14' : ''}`}>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-gray-800 dark:text-slate-100 break-words">{h.name}</h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.bg}`}>{h.type}</span>
              {isSoon && (
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                  {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days}d`}
                </span>
              )}
              {isSystem && (
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-0.5">
                  <Sparkles size={9} /> Suggested
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400">{fmtDate(h.date)}</div>
            {h.description && <p className="text-xs text-gray-600 dark:text-slate-300 mt-2 break-words">{h.description}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <PartyPopper className="text-pink-600 dark:text-pink-400" /> Holidays
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">{canManage ? 'Manage company holidays, festivals & special days.' : 'Company holidays and upcoming special days.'}</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 text-white px-5 py-2.5 rounded-lg shadow font-medium">
            <Plus size={18} /> Add Holiday
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
              <span>Upcoming ({upcoming.length})</span>
              <span className="text-gray-300 dark:text-slate-600">•</span>
              <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><Sparkles size={10} /> Includes Indian gazetted holidays & festivals</span>
            </div>
            {upcoming.length === 0 ? (
              <div className="text-xs text-gray-400 dark:text-slate-500 italic">No upcoming holidays</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map(renderCard)}
              </div>
            )}
          </section>
          {past.length > 0 && (
            <section>
              <div className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">Past</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                {past.slice(0, 6).map(renderCard)}
              </div>
            </section>
          )}
        </div>
      )}

      {showModal && canManage && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                <PartyPopper size={18} className="text-pink-600 dark:text-pink-400" /> {editingId ? 'Edit Holiday' : 'Add Holiday'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-sm p-3 rounded-lg">
                  {errors.map((e, i) => <div key={i}>• {e.field ? `${e.field}: ` : ''}{e.message}</div>)}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Name *</label>
                <input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" placeholder="E.g., Diwali, Republic Day" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Date *</label>
                  <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm">
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Description (optional)</label>
                <textarea rows={2} maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 text-sm bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 text-white rounded-lg font-medium disabled:opacity-50">
                  {submitting ? 'Saving…' : (editingId ? 'Update' : 'Add Holiday')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Holidays;
