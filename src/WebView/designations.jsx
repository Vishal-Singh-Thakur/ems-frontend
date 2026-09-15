import React, { useEffect, useMemo, useState } from "react";
import { IdCard, Plus, Pencil, Trash2, X, Building2 } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import {
  GetAllJobRolesAPI,
  CreateJobRoleAPI,
  UpdateJobRoleAPI,
  DeleteJobRoleAPI,
  GetAllDepartmentsAPI
} from "../components/Constant/Api/Api";

const DEPT_COLORS = ["from-blue-500 to-indigo-600", "from-purple-500 to-fuchsia-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600", "from-pink-500 to-rose-600", "from-cyan-500 to-blue-600"];

const Designations = ({ user }) => {
  const role = (user?.roleId?.name || user?.role || '').toLowerCase();
  const canManage = ['superadmin', 'admin', 'hr'].includes(role);
  const canDelete = ['superadmin', 'hr'].includes(role);

  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', departmentId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deptFilter, setDeptFilter] = useState('all');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dr, jr] = await Promise.all([
        ApiHit(GetAllDepartmentsAPI, 'GET'),
        ApiHit(GetAllJobRolesAPI, 'GET')
      ]);
      if (dr?.success) setDepartments(dr.data?.docs || dr.data || []);
      if (jr?.success) setDesignations(jr.data?.docs || jr.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Group by department
  const grouped = useMemo(() => {
    const map = new Map();
    for (const d of departments) map.set(String(d._id), { dept: d, items: [] });
    for (const j of designations) {
      const deptId = String(j.departmentId?._id || j.departmentId);
      if (map.has(deptId)) map.get(deptId).items.push(j);
      else map.set(deptId, { dept: { _id: deptId, name: '(Unknown)' }, items: [j] });
    }
    let arr = [...map.values()];
    if (deptFilter !== 'all') arr = arr.filter((g) => String(g.dept._id) === deptFilter);
    return arr;
  }, [departments, designations, deptFilter]);

  const openCreate = (defaultDeptId = '') => {
    setEditingId(null);
    setForm({ name: '', departmentId: defaultDeptId });
    setShowModal(true);
  };

  const openEdit = (j) => {
    setEditingId(j._id);
    setForm({ name: j.name, departmentId: String(j.departmentId?._id || j.departmentId || '') });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.departmentId) { alert('Please select a department'); return; }
    setSubmitting(true);
    try {
      const url = editingId ? UpdateJobRoleAPI(editingId) : CreateJobRoleAPI;
      const method = editingId ? 'PUT' : 'POST';
      const r = await ApiHit(url, method, form);
      if (r?.success) { closeModal(); fetchAll(); }
      else alert(r?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (j) => {
    if (!window.confirm(`Delete "${j.name}"?`)) return;
    const r = await ApiHit(DeleteJobRoleAPI(j._id), 'DELETE');
    if (r?.success) fetchAll();
    else alert(r?.message || 'Failed');
  };

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <IdCard className="text-blue-600 dark:text-blue-400" /> Designations
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Job titles grouped by department.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm">
            <option value="all">All Departments</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          {canManage && (
            <button onClick={() => openCreate()} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg shadow font-medium">
              <Plus size={18} /> Add Designation
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>
      ) : grouped.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <IdCard size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {departments.length === 0 ? 'Add a department first' : 'No designations added yet'}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g, i) => {
            const color = DEPT_COLORS[i % DEPT_COLORS.length];
            return (
              <div key={g.dept._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className={`bg-gradient-to-r ${color} p-4 text-white flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <Building2 size={20} />
                    <div>
                      <div className="text-lg font-bold leading-tight">{g.dept.name}</div>
                      <div className="text-[11px] opacity-90">{g.items.length} designation{g.items.length === 1 ? '' : 's'}</div>
                    </div>
                  </div>
                  {canManage && (
                    <button onClick={() => openCreate(g.dept._id)} className="text-xs bg-white/20 dark:bg-slate-900/20 hover:bg-white/30 dark:hover:bg-slate-900/30 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <Plus size={12} /> Add
                    </button>
                  )}
                </div>
                <div className="p-4">
                  {g.items.length === 0 ? (
                    <div className="text-xs text-gray-400 dark:text-slate-500 italic py-4 text-center">No designations in this department</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {g.items.map((j) => (
                        <div key={j._id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 hover:shadow-sm transition flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <IdCard size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{j.name}</div>
                              {j.isActive === false && <div className="text-[10px] text-red-500">Inactive</div>}
                            </div>
                          </div>
                          {canManage && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => openEdit(j)} className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded" title="Edit"><Pencil size={12} /></button>
                              {canDelete && (
                                <button onClick={() => handleDelete(j)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded" title="Delete"><Trash2 size={12} /></button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
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
                <IdCard size={18} className="text-blue-600 dark:text-blue-400" /> {editingId ? 'Edit Designation' : 'Add Designation'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Department *</label>
                <select required value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Designation Name *</label>
                <input required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" placeholder="E.g., Senior Software Engineer" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium disabled:opacity-50">
                  {submitting ? 'Saving…' : (editingId ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Designations;
