// import React, { useState } from "react";
// import AppInput from "../AppInput";
// import ApiDropdown from "../ApiDropdown";
// import { REGEX_PATTERNS, VALIDATION_MESSAGES } from "../../Utils/regex";
// import { IoPerson, IoMail, IoCheckmarkCircle } from "react-icons/io5";

// const AddTeamMemberModal = ({ open, setOpen, team, setTeam }) => {
//   const [form, setForm] = useState({
//     name: "",
//     role: "",
//     email: "",
//     status: "Active",
//   });

//   const [errors, setErrors] = useState({});

//   if (!open) return null;

//   // HANDLE CHANGE
//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//     setErrors({ ...errors, [e.target.name]: "" }); // clear error
//   };

//   // VALIDATION
//   const validateForm = () => {
//     let newErrors = {};

//     if (!form.name) newErrors.name = VALIDATION_MESSAGES.required;
//     else if (!REGEX_PATTERNS.name.test(form.name))
//       newErrors.name = VALIDATION_MESSAGES.name;

//     if (!form.email) newErrors.email = VALIDATION_MESSAGES.required;
//     else if (!REGEX_PATTERNS.email.test(form.email))
//       newErrors.email = VALIDATION_MESSAGES.email;

//     if (!form.role) newErrors.role = VALIDATION_MESSAGES.required;

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // SUBMIT
//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (!validateForm()) return;

//     setTeam([
//       ...team,
//       {
//         id: Date.now(),
//         ...form,
//       },
//     ]);

//     setForm({
//       name: "",
//       role: "",
//       email: "",
//       status: "Active",
//     });

//     setOpen(false);
//   };

//   return (
//     <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
//       <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-md shadow-xl">

//         <h2 className="text-2xl font-semibold mb-4">Add Team Member</h2>

//         <form onSubmit={handleSubmit} className="space-y-4">

//           {/* Name */}
//           <AppInput
//             name="name"
//             label="Full Name"
//             placeholder="Enter full name"
//             value={form.name}
//             onChange={handleChange}
//             icon={<IoPerson />}
//             error={errors.name}
//             required
//           />

//           {/* Email */}
//           <AppInput
//             name="email"
//             label="Email Address"
//             placeholder="Enter email"
//             type="email"
//             value={form.email}
//             onChange={handleChange}
//             icon={<IoMail />}
//             error={errors.email}
//             required
//           />

//           {/* Role Dropdown */}
//           <ApiDropdown
//             name="role"
//             label="Role"
//             value={form.role}
//             onChange={handleChange}
//             options={[
//               { label: "Frontend Developer", value: "Frontend Developer" },
//               { label: "Backend Developer", value: "Backend Developer" },
//               { label: "UI/UX Designer", value: "UI/UX Designer" },
//             ]}
//             icon={<IoCheckmarkCircle />}
//             error={errors.role}
//             required
//           />

//           {/* Status Dropdown */}
//           <ApiDropdown
//             name="status"
//             label="Status"
//             value={form.status}
//             onChange={handleChange}
//             options={[
//               { label: "Active", value: "Active" },
//               { label: "Inactive", value: "Inactive" },
//             ]}
//             icon={<IoCheckmarkCircle />}
//             required
//           />

//           {/* Buttons */}
//           <div className="flex justify-end gap-3 pt-4">
//             <button
//               type="button"
//               onClick={() => setOpen(false)}
//               className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-700"
//             >
//               Cancel
//             </button>

//             <button
//               type="submit"
//               className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
//             >
//               Add Member
//             </button>
//           </div>

//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddTeamMemberModal;



// import React, { useState } from "react";
// import AppInput from "../AppInput";
// import ApiHit from "../../Utils/ApiHit";
// import { AddTeamMemberAPI } from "../Constant/Api/Api";
// import { REGEX_PATTERNS, VALIDATION_MESSAGES } from "../../Utils/regex";
// import { IoPerson, IoMail, IoCheckmarkCircle } from "react-icons/io5";

// const AddTeamMemberModal = ({ open, setOpen, onSuccess }) => {
//   const [form, setForm] = useState({
//     name: "",
//     role: "",
//     email: "",
//     status: "Active",
//   });

//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);

//   if (!open) return null;

//   // HANDLE CHANGE - Updated to handle both input and select
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm(prev => ({ ...prev, [name]: value }));
//     setErrors(prev => ({ ...prev, [name]: "" }));
//   };

//   // HANDLE DROPDOWN CHANGE - Separate handler for dropdowns
//   const handleDropdownChange = (name, value) => {
//     setForm(prev => ({ ...prev, [name]: value }));
//     setErrors(prev => ({ ...prev, [name]: "" }));
//   };

//   // VALIDATION
//   const validateForm = () => {
//     let newErrors = {};

//     if (!form.name) newErrors.name = VALIDATION_MESSAGES.required;
//     else if (!REGEX_PATTERNS.name.test(form.name))
//       newErrors.name = VALIDATION_MESSAGES.name;

//     if (!form.email) newErrors.email = VALIDATION_MESSAGES.required;
//     else if (!REGEX_PATTERNS.email.test(form.email))
//       newErrors.email = VALIDATION_MESSAGES.email;

//     if (!form.role) newErrors.role = VALIDATION_MESSAGES.required;

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // SUBMIT
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validateForm()) return;

//     try {
//       setLoading(true);

//       const response = await ApiHit(AddTeamMemberAPI, "POST", form);

//       if (response.success) {
//         alert("Team member added successfully!");

//         // Reset form
//         setForm({
//           name: "",
//           role: "",
//           email: "",
//           status: "Active",
//         });

//         setOpen(false);

//         // Refresh parent component's data
//         if (onSuccess) {
//           onSuccess();
//         }
//       } else {
//         alert(response.message || "Failed to add team member");
//       }
//     } catch (err) {
//       console.error("Error adding team member:", err);
//       alert("Network error. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // CLOSE MODAL
//   const handleClose = () => {
//     setForm({
//       name: "",
//       role: "",
//       email: "",
//       status: "Active",
//     });
//     setErrors({});
//     setOpen(false);
//   };

//   return (
//     <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
//       <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-md shadow-xl">
//         <h2 className="text-2xl font-semibold mb-4">Add Team Member</h2>

//         <form onSubmit={handleSubmit} className="space-y-2">
//           <div className="grid grid-cols-2 gap-4">
//             {/* Name */}
//             <AppInput
//               name="name"
//               label="Full Name"
//               placeholder="Enter full name"
//               value={form.name}
//               onChange={handleChange}
//               icon={<IoPerson />}
//               error={errors.name}
//               required
//             />

//             {/* Email */}
//             <AppInput
//               name="email"
//               label="Email Address"
//               placeholder="Enter email"
//               type="email"
//               value={form.email}
//               onChange={handleChange}
//               icon={<IoMail />}
//               error={errors.email}
//               required
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             {/* Role Dropdown - FIXED VERSION */}
//             <div className="flex flex-col">
//               <label className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
//                 Role <span className="text-red-500">*</span>
//               </label>
//               <div className="relative">
//                 <IoCheckmarkCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
//                 <select
//                   name="role"
//                   value={form.role}
//                   onChange={handleChange}
//                   className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${
//                     errors.role ? "border-red-500" : "border-gray-300 dark:border-slate-600"
//                   }`}
//                 >
//                   <option value="">Select Role</option>
//                   <option value="Frontend Developer">Frontend Developer</option>
//                   <option value="Backend Developer">Backend Developer</option>
//                   <option value="UI/UX Designer">UI/UX Designer</option>
//                   <option value="Full Stack Developer">Full Stack Developer</option>
//                   <option value="DevOps Engineer">DevOps Engineer</option>
//                   <option value="QA Engineer">QA Engineer</option>
//                   <option value="Product Manager">Product Manager</option>
//                 </select>
//               </div>
//               {errors.role && (
//                 <span className="text-xs text-red-500 mt-1">{errors.role}</span>
//               )}
//             </div>

//             {/* Status Dropdown - FIXED VERSION */}
//             <div className="flex flex-col">
//               <label className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
//                 Status <span className="text-red-500">*</span>
//               </label>
//               <div className="relative">
//                 <IoCheckmarkCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
//                 <select
//                   name="status"
//                   value={form.status}
//                   onChange={handleChange}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//                 >
//                   <option value="Active">Active</option>
//                   <option value="Inactive">Inactive</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Buttons */}
//           <div className="flex justify-end gap-3 pt-4">
//             <button
//               type="button"
//               onClick={handleClose}
//               disabled={loading}
//               className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-700 transition disabled:opacity-50"
//             >
//               Cancel
//             </button>

//             <button
//               type="submit"
//               disabled={loading}
//               className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
//             >
//               {loading ? (
//                 <>
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                   Adding...
//                 </>
//               ) : (
//                 "Add Member"
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddTeamMemberModal;




import React, { useEffect, useState } from "react";
import ApiHit from "../../Utils/ApiHit";
import {
  AddTeamMemberAPI,
  GetAllUsersAPI,
} from "../Constant/Api/Api";

const AddTeamMemberModal = ({ open, setOpen, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // ✅ ALWAYS HOOKS ON TOP
  useEffect(() => {
    if (!open) return;

    const fetchEmployees = async () => {
      try {
        setFetching(true);

        const res = await ApiHit(GetAllUsersAPI, "GET");

        if (res?.success && Array.isArray(res.data)) {
          const onlyEmployees = res.data.filter(
            (u) => u.roleId?.name === "employee"
          );
          setEmployees(onlyEmployees);
        } else {
          setEmployees([]);
        }
      } catch (err) {
        console.error("Fetch employees error", err);
        setEmployees([]);
      } finally {
        setFetching(false);
      }
    };

    fetchEmployees();
  }, [open]);

  // ✅ SAFE RETURN AFTER HOOKS
  if (!open) return null;

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      alert("Please select an employee");
      return;
    }

    try {
      setLoading(true);

      const res = await ApiHit(AddTeamMemberAPI, "POST", {
        userId: selectedUser,
      });

      if (res?.success) {
        alert("Member added successfully");
        setSelectedUser("");
        setOpen(false);
        onSuccess && onSuccess();
      } else {
        alert(res?.message || "Failed to add member");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          Add Team Member
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            className="w-full border px-4 py-2 rounded-lg"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            disabled={fetching}
          >
            <option value="">
              {fetching ? "Loading employees..." : "Select Employee"}
            </option>

            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.email})
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || fetching}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg"
            >
              {loading ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeamMemberModal;
