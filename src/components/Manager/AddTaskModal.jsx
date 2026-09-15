import React, { useState, useEffect } from "react";
import ApiHit from "../../Utils/ApiHit";
import { CreateTaskAPI, UpdateTaskAPI, UpdateTaskStatusAPI, GetMyTeamAPI } from "../Constant/Api/Api";
import { REGEX_PATTERNS, VALIDATION_MESSAGES } from "../../Utils/regex";
import {
  IoDocumentText,
  IoPerson,
  IoCalendarNumber,
  IoCheckmarkCircle,
  IoFlag,
  IoClose,
  IoCreate,
  IoAdd
} from "react-icons/io5";

const PRIORITY_OPTIONS = [
  { value: 'Low',    label: 'Low',    color: 'from-emerald-500 to-teal-600', dot: 'bg-emerald-500' },
  { value: 'Medium', label: 'Medium', color: 'from-amber-500 to-orange-600', dot: 'bg-amber-500' },
  { value: 'High',   label: 'High',   color: 'from-red-500 to-rose-600',     dot: 'bg-red-500' }
];

const STATUS_OPTIONS = [
  { value: 'Pending',     label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed',   label: 'Completed' }
];

const FieldLabel = ({ icon, children, required }) => (
  <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
    <span className="text-blue-600 dark:text-blue-400">{icon}</span>
    {children}
    {required && <span className="text-red-500">*</span>}
  </label>
);

const inputCls = (hasError) =>
  `w-full border rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 transition ${
    hasError
      ? 'border-red-300 dark:border-red-500/40 focus:ring-red-400'
      : 'border-gray-200 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 dark:hover:border-slate-600'
  }`;

const AddTaskModal = ({ open, setOpen, onSuccess, task, isEmployeeMode = false }) => {
  const isEdit = Boolean(task?._id) && !isEmployeeMode;

  const [form, setForm] = useState({
    title: "",
    assignedTo: "",
    priority: "Medium",
    status: "Pending",
    dueDate: "",
    description: ""
  });

  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title || "",
        assignedTo: task.assignedTo?._id || task.assignedTo || "",
        priority: task.priority || "Medium",
        status: task.status || "Pending",
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        description: task.description || ""
      });
    } else {
      setForm({
        title: "",
        assignedTo: "",
        priority: "Medium",
        status: "Pending",
        dueDate: "",
        description: ""
      });
    }
    setErrors({});
  }, [open, task]);

  useEffect(() => {
    if (open && !isEmployeeMode) fetchUsers();
  }, [open, isEmployeeMode]);

  const fetchUsers = async () => {
    try {
      const response = await ApiHit(GetMyTeamAPI, "GET");
      if (response?.success) {
        const list = response.data?.docs || response.data || [];
        const activeUsers = list.filter(u => u.userId?.isActive);
        setUsers(activeUsers.map(u => u.userId));
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!isEmployeeMode) {
      if (!form.title) newErrors.title = VALIDATION_MESSAGES.required;
      else if (!REGEX_PATTERNS.title.test(form.title)) newErrors.title = "Invalid task title";
      if (!form.assignedTo) newErrors.assignedTo = VALIDATION_MESSAGES.required;
      if (!form.dueDate) newErrors.dueDate = VALIDATION_MESSAGES.required;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      let payload, apiUrl, method;

      if (isEmployeeMode) {
        payload = { status: form.status, description: form.description };
        apiUrl = UpdateTaskStatusAPI(task._id);
        method = "PATCH";
      } else if (isEdit) {
        payload = {
          title: form.title,
          assignedTo: form.assignedTo,
          priority: form.priority,
          status: form.status,
          dueDate: form.dueDate,
          description: form.description
        };
        apiUrl = UpdateTaskAPI(task._id);
        method = "PUT";
      } else {
        payload = {
          title: form.title,
          assignedTo: form.assignedTo,
          priority: form.priority,
          status: form.status,
          dueDate: form.dueDate,
          description: form.description
        };
        apiUrl = CreateTaskAPI;
        method = "POST";
      }

      const response = await ApiHit(apiUrl, method, payload);
      if (response?.success) {
        setOpen(false);
        onSuccess && onSuccess();
      } else {
        alert(response?.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Submit Error:", err);
      alert("Error saving task");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const title = isEmployeeMode ? "Update Task Status" : isEdit ? "Edit Task" : "Create New Task";
  const subtitle = isEmployeeMode
    ? "Update the current progress of your assigned task."
    : isEdit
      ? "Modify task details and reassign if needed."
      : "Assign a new task to a team member with clear expectations.";
  const HeaderIcon = isEmployeeMode ? IoCheckmarkCircle : isEdit ? IoCreate : IoAdd;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white relative">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-slate-900/20 transition"
            aria-label="Close"
          >
            <IoClose size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-slate-900/20 flex items-center justify-center">
              <HeaderIcon size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">{title}</h2>
              <p className="text-xs opacity-90 mt-0.5">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isEmployeeMode ? (
              <>
                {/* Task Title (read-only) */}
                <div>
                  <FieldLabel icon={<IoDocumentText size={14} />}>Task Title</FieldLabel>
                  <input
                    type="text"
                    value={form.title}
                    disabled
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-slate-900/40 text-gray-600 dark:text-slate-300 text-sm cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel icon={<IoCalendarNumber size={14} />}>Due Date</FieldLabel>
                    <input
                      type="text"
                      value={form.dueDate ? new Date(form.dueDate).toLocaleDateString('en-GB') : 'N/A'}
                      disabled
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-slate-900/40 text-gray-600 dark:text-slate-300 text-sm cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <FieldLabel icon={<IoFlag size={14} />}>Priority</FieldLabel>
                    <input
                      type="text"
                      value={form.priority}
                      disabled
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-slate-900/40 text-gray-600 dark:text-slate-300 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <FieldLabel icon={<IoCheckmarkCircle size={14} />} required>Status</FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, status: s.value }))}
                        className={`px-3 py-2.5 text-sm font-medium rounded-xl border transition ${
                          form.status === s.value
                            ? 'bg-blue-600 text-white border-blue-600 shadow'
                            : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <FieldLabel icon={<IoDocumentText size={14} />}>Notes / Updates</FieldLabel>
                  <textarea
                    name="description"
                    placeholder="Add notes or updates about this task..."
                    value={form.description}
                    onChange={handleChange}
                    rows="4"
                    className={inputCls(false)}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Task Title */}
                <div>
                  <FieldLabel icon={<IoDocumentText size={14} />} required>Task Title</FieldLabel>
                  <input
                    type="text"
                    name="title"
                    placeholder="e.g. Prepare monthly performance report"
                    value={form.title}
                    onChange={handleChange}
                    className={inputCls(!!errors.title)}
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1.5">{errors.title}</p>}
                </div>

                {/* Assign To */}
                <div>
                  <FieldLabel icon={<IoPerson size={14} />} required>Assign To</FieldLabel>
                  <select
                    name="assignedTo"
                    value={form.assignedTo}
                    onChange={handleChange}
                    className={inputCls(!!errors.assignedTo)}
                  >
                    <option value="">Select a team member…</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                  {errors.assignedTo && <p className="text-red-500 text-xs mt-1.5">{errors.assignedTo}</p>}
                </div>

                {/* Priority pill selector */}
                <div>
                  <FieldLabel icon={<IoFlag size={14} />}>Priority</FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {PRIORITY_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, priority: p.value }))}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition ${
                          form.priority === p.value
                            ? `bg-gradient-to-r ${p.color} text-white border-transparent shadow`
                            : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${form.priority === p.value ? 'bg-white dark:bg-slate-800' : p.dot}`} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status + Deadline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel icon={<IoCheckmarkCircle size={14} />}>Status</FieldLabel>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className={inputCls(false)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel icon={<IoCalendarNumber size={14} />} required>Deadline</FieldLabel>
                    <input
                      type="date"
                      name="dueDate"
                      value={form.dueDate}
                      onChange={handleChange}
                      className={inputCls(!!errors.dueDate)}
                    />
                    {errors.dueDate && <p className="text-red-500 text-xs mt-1.5">{errors.dueDate}</p>}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <FieldLabel icon={<IoDocumentText size={14} />}>
                    Description <span className="text-gray-400 dark:text-slate-500 normal-case font-normal">(optional)</span>
                  </FieldLabel>
                  <textarea
                    name="description"
                    placeholder="Add context, acceptance criteria, or links…"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                    className={inputCls(false)}
                  />
                </div>
              </>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/70 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-5 py-2.5 text-sm font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <HeaderIcon size={16} />
                {isEmployeeMode ? "Update Status" : isEdit ? "Save Changes" : "Create Task"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
