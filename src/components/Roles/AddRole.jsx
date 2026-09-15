import React, { useState, useEffect } from "react";
import AppInput from "../AppInput";
import ApiDropdown from "../ApiDropdown";
import ApiHit from "../../Utils/ApiHit";
import { CreateRoleAPI, UpdateRoleAPI } from "../Constant/Api/Api";
import PermissionsManager from "../Permission/permissions";

const REGEX_PATTERNS = {
  name: /^[A-Za-z ]{3,30}$/,
};

const AddRole = ({ onClose, onSubmit, editData = null }) => {
  const [formData, setFormData] = useState({
    roleName: "",
    roleType: "",
    status: "Active",
    permissions: [], // Permissions array add kiya
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Populate form if editing
  useEffect(() => {
    if (editData) {
      setFormData({
        roleName: editData.name || "",
        roleType: editData.roleType || "",
        status: editData.isActive ? "Active" : "Inactive",
        permissions: editData.permissions || [], // Edit mode mein permissions load karo
      });
    }
  }, [editData]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Permissions change handler
  const handlePermissionsChange = (permissions) => {
    setFormData((prev) => ({ ...prev, permissions }));
  };

  const validateForm = () => {
    if (!formData.roleName.trim()) {
      setError("Please enter role name");
      return false;
    }
    if (!REGEX_PATTERNS.name.test(formData.roleName)) {
      setError("Role name should be 3–30 letters only");
      return false;
    }
    if (!formData.roleType.trim()) {
      setError("Please select role type");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.roleName.toLowerCase().trim(),
        roleType: formData.roleType,
        isActive: formData.status === "Active",
        permissions: formData.permissions,
        createdBy: null,
      };

      // For edit mode, we send status; for create, backend defaults to true
      if (!editData) {
        // Backend will default isActive to true if not provided
        payload.isActive = true;
      }

      let response;
      if (editData) {
        response = await ApiHit(UpdateRoleAPI(editData._id), "PUT", payload);
      } else {
        response = await ApiHit(CreateRoleAPI, "POST", payload);
      }

      if (response.success) {
        alert(response.message || (editData ? "Role updated successfully!" : "Role created successfully!"));
        onSubmit(response.data);
        onClose();
      } else {
        setError(response.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Role submit error:", err);
      setError(err.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-lg w-full max-w-4xl mx-auto"> {/* Width badha diya for table */}
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
          {editData ? "Edit Role" : "Add Role"}
        </h2>
        <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

        {/* Left Column - Basic Info */}
        <div>
          {/* Role Name */}
          <div className="mb-4">
            <AppInput
              label="Role Name"
              placeholder="Enter Role Name (e.g., admin, manager)"
              value={formData.roleName}
              onChange={(e) => handleChange("roleName", e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Role Type */}
          <div className="mb-4">
            <ApiDropdown
              label="Role Type"
              placeholder="Select Role Type"
              value={formData.roleType}
              onChange={(value) => handleChange("roleType", value)}
              options={[
                { label: "Superadmin", value: "superadmin" },
                { label: "Admin", value: "admin" },
                { label: "HR", value: "hr" },
                { label: "Manager", value: "manager" },
                { label: "Employee", value: "employee" },
              ]}
              disabled={loading}
            />
          </div>

          {/* Status */}
          {/* <div className="mb-6">
            <ApiDropdown
              label="Status"
              placeholder="Select Status"
              value={formData.status}
              onChange={(value) => handleChange("status", value)}
              options={[
                { label: "Active", value: "Active" },
                { label: "Inactive", value: "Inactive" },
              ]}
              disabled={loading}
            />
          </div> */}
        </div>

        {/* Right Column - Permissions */}
        <div>
          <PermissionsManager
            selectedPermissions={formData.permissions}
            onChange={handlePermissionsChange}
            disabled={loading}
          />
        </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 mt-6 border-t">
        {/* <button
          onClick={onClose}
          disabled={loading}
          className="px-6 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button> */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <span>{editData ? "Update" : "Save"}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default AddRole;
