import React, { useEffect, useState } from "react";
import AppInput from "../AppInput";
import ApiDropdown from "../ApiDropdown";
import ApiHit from "../../Utils/ApiHit";
import { REGEX_PATTERNS, VALIDATION_MESSAGES } from "../../Utils/regex";
import { IoPerson, IoMail, IoLockClosed, IoPhonePortrait, IoCheckmarkCircle, IoAlert, IoCheckmark } from "react-icons/io5";
import { Eye, EyeOff } from "lucide-react";
import {
  CreateUserAPI,
  GetAllDepartmentsAPI,
  GetAllRolesAPI,
  GetJobRolesByDepartmentAPI,
  UpdateUserAPI
} from "../Constant/Api/Api";

const AddUserModal = ({ isOpen, onClose, onUserAdded, editData }) => {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    password: "",
    roleId: "",
    departmentId: "",
    jobRoleId: "",
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setApiError(""); setSuccessMessage(""); setErrors({});
    fetchRoles(); fetchDepartments();
    if (editData) populateForm(editData);
    else {
      resetForm();
      // Auto-generate temp password on new user creation
      setFormData((p) => ({ ...p, password: generateTempPassword() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editData]);

  const generateTempPassword = () => `Emp@${Math.floor(100000 + Math.random() * 900000)}`;

  const fetchRoles = async () => {
    try {
      const r = await ApiHit(GetAllRolesAPI, "GET");
      if (r?.success) setRoles(r.data?.docs || r.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchDepartments = async () => {
    try {
      const r = await ApiHit(GetAllDepartmentsAPI, "GET");
      if (r?.success) {
        const list = Array.isArray(r.data) ? r.data : (r.data?.docs || []);
        setDepartments(list.filter((d) => d.isActive !== false));
      }
    } catch (e) { console.error(e); }
  };

  const fetchJobRoles = async (departmentId) => {
    if (!departmentId) { setJobRoles([]); return; }
    try {
      const r = await ApiHit(GetJobRolesByDepartmentAPI(departmentId), "GET");
      if (r?.success) {
        const list = Array.isArray(r.data) ? r.data : (r.data?.docs || []);
        setJobRoles(list.filter((j) => j.isActive !== false));
      }
    } catch (e) { console.error(e); }
  };

  const populateForm = (user) => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      gender: user.gender || "",
      password: "",
      roleId: user.roleId?._id || user.roleId || "",
      departmentId: user.departmentId?._id || user.departmentId || "",
      jobRoleId: user.jobRoleId?._id || user.jobRoleId || "",
      isActive: user.isActive ?? true
    });
    const deptId = user.departmentId?._id || user.departmentId;
    if (deptId) fetchJobRoles(deptId);
  };

  const resetForm = () => {
    setFormData({
      name: "", email: "", phone: "", gender: "", password: "",
      roleId: "", departmentId: "", jobRoleId: "", isActive: true
    });
    setJobRoles([]);
  };

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value) return VALIDATION_MESSAGES.required;
        if (!REGEX_PATTERNS.name.test(value)) return VALIDATION_MESSAGES.name;
        return "";
      case "email":
        if (!value) return VALIDATION_MESSAGES.required;
        if (!REGEX_PATTERNS.email.test(value)) return VALIDATION_MESSAGES.email;
        return "";
      case "phone":
        if (!value) return VALIDATION_MESSAGES.required;
        if (!/^[+]?[\d\s-]{10,15}$/.test(value.trim())) return 'Enter a valid 10-15 digit phone';
        return "";
      case "password":
        // Optional on edit, required on create
        if (!editData && !value) return VALIDATION_MESSAGES.required;
        if (value && value.length < 8) return 'Min 8 characters';
        return "";
      case "roleId":       return value ? "" : "Please select a role";
      case "departmentId": return value ? "" : "Please select department";
      case "jobRoleId":    return value ? "" : "Please select job role";
      default:             return "";
    }
  };

  const handleChange = (e) => {
    // Support both DOM events and { name, value } from custom dropdowns
    let name, value;
    if (e?.target) {
      name = e.target.name;
      value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    } else if (e?.name !== undefined) {
      name = e.name;
      value = e.value;
    } else return;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Cascade: clear job role when department changes
      if (name === 'departmentId') next.jobRoleId = '';
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    setApiError("");

    if (name === 'departmentId') fetchJobRoles(value);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setApiError("");

    // Validate required fields
    const newErrors = {};
    ["name", "email", "phone", "roleId", "departmentId", "jobRoleId"].forEach((k) => {
      const err = validateField(k, formData[k]);
      if (err) newErrors[k] = err;
    });
    if (!editData) {
      const pwdErr = validateField("password", formData.password);
      if (pwdErr) newErrors.password = pwdErr;
    } else if (formData.password) {
      const pwdErr = validateField("password", formData.password);
      if (pwdErr) newErrors.password = pwdErr;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setApiError("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      // Build clean payload — don't send empty password on edit
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        gender: formData.gender || undefined,
        roleId: formData.roleId,
        departmentId: formData.departmentId,
        jobRoleId: formData.jobRoleId,
        isActive: formData.isActive
      };
      if (formData.password) payload.password = formData.password;

      const r = editData
        ? await ApiHit(UpdateUserAPI(editData._id), "PUT", payload)
        : await ApiHit(CreateUserAPI, "POST", payload);

      if (r?.success) {
        setSuccessMessage(
          editData
            ? "User updated successfully!"
            : `User created! Temp password: ${formData.password} — share this with the user.`
        );
        setTimeout(() => { onUserAdded?.(r.data); onClose(); }, editData ? 900 : 2500);
      } else {
        setApiError(r?.message || "Failed to save user");
      }
    } catch (err) {
      setApiError(err.message || "Error saving user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{editData ? "Edit User" : "Add New User"}</h2>
          <button onClick={onClose} className="text-2xl hover:opacity-70">✕</button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {apiError && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
              <IoAlert className="mt-0.5 flex-shrink-0" /> <span>{apiError}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
              <IoCheckmark className="mt-0.5 flex-shrink-0" /> <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AppInput name="name" label="Full Name" value={formData.name} placeholder="Enter name"
              onChange={handleChange} icon={<IoPerson />} error={errors.name} required />
            <AppInput name="email" type="email" label="Email" value={formData.email} placeholder="email@example.com"
              onChange={handleChange} icon={<IoMail />} error={errors.email} required />
            <AppInput name="phone" type="tel" label="Phone" value={formData.phone} placeholder="10-digit number"
              onChange={handleChange} icon={<IoPhonePortrait />} error={errors.phone} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ApiDropdown name="gender" label="Gender" value={formData.gender} onChange={handleChange}
              options={[
                { label: "Select Gender", value: "" },
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" }
              ]}
              error={errors.gender}
            />
            {editData ? (
              <AppInput name="password" label="Reset Password (optional)"
                type={showPassword ? "text" : "password"} value={formData.password}
                placeholder="Leave blank to keep current"
                onChange={handleChange} icon={<IoLockClosed />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                error={errors.password}
              />
            ) : (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-200 flex items-center gap-1 mb-1">
                  <IoLockClosed /> Temporary Password
                </label>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-blue-200 dark:border-blue-500/30 rounded-lg bg-blue-50 dark:bg-blue-500/10 font-mono text-sm text-blue-900 dark:text-blue-200 select-all">
                    {formData.password || '—'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, password: generateTempPassword() }))}
                    className="text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-200 px-3 rounded-lg"
                    title="Regenerate"
                  >↻</button>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">Auto-generated. User will be prompted to change on first login.</p>
              </div>
            )}
            <ApiDropdown name="roleId" label="Role" value={formData.roleId} onChange={handleChange}
              options={[
                { label: "Select Role", value: "" },
                ...roles.map((r) => ({ label: r.name, value: r._id }))
              ]}
              icon={<IoCheckmarkCircle />}
              error={errors.roleId}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ApiDropdown name="departmentId" label="Department" value={formData.departmentId} onChange={handleChange}
              options={[
                { label: "Select Department", value: "" },
                ...departments.map((d) => ({ label: d.name, value: d._id }))
              ]}
              error={errors.departmentId}
              required
            />
            <ApiDropdown name="jobRoleId" label="Job Role" value={formData.jobRoleId} onChange={handleChange}
              options={[
                { label: formData.departmentId ? "Select Job Role" : "Choose department first", value: "" },
                ...jobRoles.map((j) => ({ label: j.name, value: j._id }))
              ]}
              error={errors.jobRoleId}
              disabled={!formData.departmentId}
              required
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/70 p-4 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading}
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 px-5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50">
            {loading ? (editData ? "Updating…" : "Creating…") : (editData ? "Update User" : "Create User")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
