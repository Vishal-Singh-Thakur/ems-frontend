import React, { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Pencil, Trash2, X, Users2, ToggleLeft, ToggleRight } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import {
  GetAllDepartmentsAPI,
  CreateDepartmentAPI,
  UpdateDepartmentAPI,
  DeleteDepartmentAPI,
  ToggleDepartmentStatusAPI,
  GetAllJobRolesAPI
} from "../components/Constant/Api/Api";

const DEPT_COLORS = ["from-blue-500 to-indigo-600", "from-purple-500 to-fuchsia-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600", "from-pink-500 to-rose-600", "from-cyan-500 to-blue-600"];

const Departments = ({ user }) => {
  const role = (user?.roleId?.name || user?.role || '').toLowerCase();
  const canManage = ['superadmin', 'admin', 'hr'].includes(role);
  const canDelete = ['superadmin', 'hr'].includes(role);

  const [depts, setDepts] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dr, jr] = await Promise.all([
        ApiHit(GetAllDepartmentsAPI, 'GET'),
        ApiHit(GetAllJobRolesAPI, 'GET')
      ]);
      if (dr?.success) setDepts(dr.data?.docs || dr.data || []);
      if (jr?.success) setJobRoles(jr.data?.docs || jr.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const countByDept = useMemo(() => {
    const m = new Map();
    for (const j of jobRoles) {
      const key = String(j.departmentId?._id || j.departmentId);
      m.set(key, (m.get(key) || 0) + 1);
    }
    return m;
  }, [jobRoles]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditingId(d._id);
    setForm({ name: d.name, description: d.description || '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId ? UpdateDepartmentAPI(editingId) : CreateDepartmentAPI;
      const method = editingId ? 'PUT' : 'POST';
      const r = await ApiHit(url, method, form);
      if (r?.success) { closeModal(); fetchAll(); }
      else alert(r?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (d) => {
    const r = await ApiHit(ToggleDepartmentStatusAPI(d._id), 'PUT');
    if (r?.success) fetchAll();
    else alert(r?.message || 'Failed');
  };

  const handleDelete = async (d) => {
    if (!window.confirm(`Delete "${d.name}"?`)) return;
    const r = await ApiHit(DeleteDepartmentAPI(d._id), 'DELETE');
    if (r?.success) fetchAll();
    else alert(r?.message || 'Failed');
  };

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="text-blue-600 dark:text-blue-400" /> Departments
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Organize your company into departments.</p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg shadow font-medium"
          >
            <Plus size={18} /> Add Department
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : depts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">No departments yet</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {depts.map((d, i) => {
            const color = DEPT_COLORS[i % DEPT_COLORS.length];
            const count = countByDept.get(String(d._id)) || 0;
            return (
              <div key={d._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition">
                <div className={`bg-gradient-to-r ${color} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <Building2 size={24} className="opacity-80" />
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${d.isActive ? 'bg-white/30 dark:bg-slate-900/30' : 'bg-red-500/40'}`}>
                      {d.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mt-2 truncate">{d.name}</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 mb-3">
                    <Users2 size={14} className="text-purple-600 dark:text-purple-400" />
                    <span><span className="font-semibold text-gray-800 dark:text-slate-100">{count}</span> designation{count === 1 ? '' : 's'}</span>
                  </div>
                  {d.description && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 break-words line-clamp-2">{d.description}</p>
                  )}
                  {canManage && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                      <button onClick={() => openEdit(d)} className="flex-1 flex items-center justify-center gap-1 text-xs bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/15 text-blue-700 dark:text-blue-300 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/30">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => handleToggle(d)} className="flex-1 flex items-center justify-center gap-1 text-xs bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/15 text-amber-700 dark:text-amber-300 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30">
                        {d.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />} {d.isActive ? 'Disable' : 'Enable'}
                      </button>
                      {canDelete && (
                        <button onClick={() => handleDelete(d)} className="flex items-center justify-center px-2 text-xs bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/15 text-red-600 dark:text-red-400 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30" title="Delete">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && canManage && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                <Building2 size={18} className="text-blue-600 dark:text-blue-400" /> {editingId ? 'Edit Department' : 'Add Department'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Name *</label>
                <input required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" placeholder="E.g., Engineering" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Description (optional)</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium disabled:opacity-50">
                  {submitting ? 'Saving…' : (editingId ? 'Update' : 'Add Department')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Departments;
