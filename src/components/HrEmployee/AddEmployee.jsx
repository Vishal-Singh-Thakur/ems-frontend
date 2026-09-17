import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { IoPerson, IoMail, IoBriefcase, IoApps, IoCall, IoKey, IoAlert, IoCheckmark } from "react-icons/io5";
import AppInput from "../AppInput";
import ApiDropdown from "../ApiDropdown";
import ApiHit from "../../Utils/ApiHit";
import { CreateUserAPI, GetAllDepartmentsAPI, GetJobRolesByDepartmentAPI, GetAllRolesAPI } from "../Constant/Api/Api";
import { REGEX_PATTERNS, VALIDATION_MESSAGES } from "../../Utils/regex";

const AddEmployee = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",  // Department _id
    role: "",        // JobRole _id (designation)
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [employeeRoleId, setEmployeeRoleId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load departments + resolve the "employee" system role _id
  useEffect(() => {
    (async () => {
      try {
        const [deptRes, roleRes] = await Promise.all([
          ApiHit(GetAllDepartmentsAPI, "GET"),
          ApiHit(GetAllRolesAPI, "GET")
        ]);
        if (deptRes?.success) {
          const docs = deptRes.data?.docs || deptRes.data || [];
          setDepartments(docs.filter((d) => d.isActive !== false));
        }
        if (roleRes?.success) {
          const roles = roleRes.data?.docs || roleRes.data || [];
          const emp = roles.find((r) => (r.name || '').toLowerCase() === 'employee');
          if (emp) setEmployeeRoleId(emp._id);
        }
      } catch (e) { console.error(e); }
    })();
  }, []);

  // Cascade: department → designations
  useEffect(() => {
    if (!formData.department) { setJobRoles([]); return; }
    (async () => {
      try {
        setLoadingRoles(true);
        const r = await ApiHit(GetJobRolesByDepartmentAPI(formData.department), "GET");
        if (r?.success) {
          const docs = r.data?.docs || r.data || [];
          setJobRoles(docs.filter((j) => j.isActive !== false));
        }
      } catch (e) { console.error(e); }
      finally { setLoadingRoles(false); }
    })();
  }, [formData.department]);

  const handleChange = (e) => {
    // Support both DOM events (AppInput) and ApiDropdown's { name, value } payload
    const name  = e?.target?.name  ?? e?.name;
    const value = e?.target?.value ?? e?.value;
    if (name === undefined) return;
    setFormData((p) => ({
      ...p,
      [name]: value,
      ...(name === 'department' ? { role: '' } : {})
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError(null);
  };

  const generatePassword = () => {
    // Simple temporary password: Emp@ + 6 digits
    const pwd = `Emp@${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData((p) => ({ ...p, password: pwd }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = VALIDATION_MESSAGES.required;
    else if (!REGEX_PATTERNS.name.test(formData.name)) newErrors.name = VALIDATION_MESSAGES.name;

    if (!formData.email) newErrors.email = VALIDATION_MESSAGES.required;
    else if (!REGEX_PATTERNS.email.test(formData.email)) newErrors.email = VALIDATION_MESSAGES.email;

    if (!formData.phone) newErrors.phone = VALIDATION_MESSAGES.required;
    else if (!/^[+]?[\d\s-]{10,15}$/.test(formData.phone.trim())) newErrors.phone = 'Enter a valid 10–15 digit phone';

    if (!formData.department) newErrors.department = VALIDATION_MESSAGES.required;
    if (!formData.role) newErrors.role = VALIDATION_MESSAGES.required;
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setApiError(null);
    setSuccess(null);
    if (!validateForm()) return;
    if (!employeeRoleId) {
      setApiError('Could not find the "employee" system role. Please seed roles first.');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        roleId: employeeRoleId,
        departmentId: formData.department,
        jobRoleId: formData.role,
        isActive: true
      };
      const r = await ApiHit(CreateUserAPI, "POST", payload);
      if (r?.success) {
        setSuccess(`✓ Employee created (temp password shared). You can share: ${formData.password}`);
        onSave && onSave(r.data);
        setTimeout(() => { setSuccess(null); onClose(); }, 1800);
      } else {
        setApiError(r?.message || 'Failed to create employee');
      }
    } catch (e) {
      setApiError(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <Card className="rounded-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-slate-900/20 flex items-center justify-center">
              <IoPerson size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">Add Employee</h2>
              <p className="text-xs opacity-90">Create a new employee account with temporary credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="text-2xl hover:opacity-70">✕</button>
        </div>

        <CardContent className="space-y-5 p-6">
          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg p-3 flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-300">
              <IoCheckmark className="mt-0.5" /> <span>{success}</span>
            </div>
          )}
          {apiError && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
              <IoAlert className="mt-0.5" /> <span>{apiError}</span>
            </div>
          )}

          {/* Section: Personal Info */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
              <IoPerson size={12} /> Personal Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AppInput
                name="name" label="Employee Name" placeholder="Enter employee name"
                value={formData.name} onChange={handleChange}
                icon={<IoPerson />} error={errors.name} required
              />
              <AppInput
                name="phone" label="Phone Number" placeholder="10-digit number"
                value={formData.phone} onChange={handleChange}
                icon={<IoCall />} error={errors.phone} required
              />
              <AppInput
                name="email" label="Email Address" type="email" placeholder="Enter email"
                value={formData.email} onChange={handleChange}
                icon={<IoMail />} error={errors.email} required
              />
              <div className="hidden md:block" />
            </div>
          </div>

          {/* Section: Job Info */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
              <IoBriefcase size={12} /> Job Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ApiDropdown
                name="department" label="Department"
                value={formData.department} onChange={handleChange}
                icon={<IoBriefcase />}
                options={departments.map((d) => ({ label: d.name, value: d._id }))}
                error={errors.department} required
              />
              <div>
                <ApiDropdown
                  name="role" label={loadingRoles ? "Designation (loading…)" : "Designation"}
                  value={formData.role} onChange={handleChange}
                  icon={<IoApps />}
                  options={jobRoles.map((j) => ({ label: j.name, value: j._id }))}
                  error={errors.role} required
                  disabled={!formData.department || loadingRoles}
                />
                {formData.department && !loadingRoles && jobRoles.length === 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">No designations in this department. Add one from Designations page first.</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Security */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
              <IoKey size={12} /> Security
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-200 flex items-center gap-1">
                  <IoKey /> Temporary Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Generate
                </button>
              </div>
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 8 characters (e.g. Emp@123456)"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-slate-700'}`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">Employee can change it after first login.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
            <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating…' : 'Add Employee'}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default AddEmployee;
