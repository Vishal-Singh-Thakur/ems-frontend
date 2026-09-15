import React, { useEffect, useMemo, useState } from "react";
import { Briefcase, Building2, Users, CheckCircle, X, IdCard } from "lucide-react";
import ApiHit from "../../Utils/ApiHit";
import { GetAllDepartmentsAPI, GetAllJobRolesAPI } from "../Constant/Api/Api";

const AddJobModal = ({ open, setOpen, jobs, setJobs, apiCreate }) => {
  const [form, setForm] = useState({
    departmentId: "",
    jobTitle: "",
    openings: "",
    status: "Open",
    description: ""
  });

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const [dr, jr] = await Promise.all([
          ApiHit(GetAllDepartmentsAPI, "GET"),
          ApiHit(GetAllJobRolesAPI, "GET")
        ]);
        if (dr?.success) setDepartments(dr.data?.docs || dr.data || []);
        if (jr?.success) setDesignations(jr.data?.docs || jr.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  // Filter designations by selected department
  const filteredDesignations = useMemo(() => {
    if (!form.departmentId) return [];
    return designations.filter((d) => String(d.departmentId?._id || d.departmentId) === String(form.departmentId));
  }, [designations, form.departmentId]);

  const selectedDept = departments.find((d) => String(d._id) === String(form.departmentId));

  if (!open) return null;

  const validate = () => {
    const err = {};
    if (!form.departmentId) err.departmentId = "Please select a department";
    if (!form.jobTitle) err.jobTitle = "Please select a designation";
    if (!form.openings || Number(form.openings) <= 0) err.openings = "Openings must be a positive number";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Backend recruitment model expects: jobTitle, department (name), openings, description, status
      const payload = {
        jobTitle: form.jobTitle,
        department: selectedDept?.name || "",
        openings: Number(form.openings),
        status: form.status,
        description: form.description || ""
      };

      if (apiCreate) {
        const r = await apiCreate(payload);
        if (r?.success) {
          setOpen(false);
          setForm({ departmentId: "", jobTitle: "", openings: "", status: "Open", description: "" });
        } else {
          alert(r?.message || 'Failed to save');
        }
      } else {
        // Fallback: local state only (for backwards compat if called without apiCreate)
        setJobs && setJobs([...(jobs || []), { ...payload, applicants: [] }]);
        setOpen(false);
        setForm({ departmentId: "", jobTitle: "", openings: "", status: "Open", description: "" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Briefcase size={18} className="text-blue-600 dark:text-blue-400" /> Add New Job
          </h2>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Department dropdown (populates from master) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Department *</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
              <select
                required
                disabled={loading}
                value={form.departmentId}
                onChange={(e) => {
                  setForm({ ...form, departmentId: e.target.value, jobTitle: "" });
                  setErrors({ ...errors, departmentId: "" });
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
              >
                <option value="">{loading ? "Loading…" : "Select department"}</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            {errors.departmentId && <p className="text-xs text-red-500 mt-1">{errors.departmentId}</p>}
          </div>

          {/* Designation (Job Title) — cascaded by department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Designation *</label>
            <div className="relative">
              <IdCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
              <select
                required
                disabled={!form.departmentId || loading}
                value={form.jobTitle}
                onChange={(e) => {
                  setForm({ ...form, jobTitle: e.target.value });
                  setErrors({ ...errors, jobTitle: "" });
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-500"
              >
                <option value="">
                  {!form.departmentId
                    ? "Select department first"
                    : filteredDesignations.length === 0
                      ? "No designations in this department"
                      : "Select designation"}
                </option>
                {filteredDesignations.map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            {errors.jobTitle && <p className="text-xs text-red-500 mt-1">{errors.jobTitle}</p>}
            {form.departmentId && filteredDesignations.length === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Add a designation under this department first.</p>
            )}
          </div>

          {/* Openings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Openings *</label>
            <div className="relative">
              <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="number"
                min="1"
                required
                value={form.openings}
                onChange={(e) => {
                  setForm({ ...form, openings: e.target.value });
                  setErrors({ ...errors, openings: "" });
                }}
                placeholder="Number of openings"
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.openings && <p className="text-xs text-red-500 mt-1">{errors.openings}</p>}
          </div>

          {/* Job Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Job Status *</label>
            <div className="relative">
              <CheckCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* Description (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Description (optional)</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Role brief, responsibilities…"
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium disabled:opacity-50">
              {submitting ? 'Saving…' : 'Save Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJobModal;
