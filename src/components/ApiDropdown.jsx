// // import React from "react";
// // import { IoChevronDown } from "react-icons/io5";

// // const ApiDropdown = ({ name, label, value, onChange, options = [], error, required = true, disabled = false, icon, className = "" }) => {
// //   return (
// //     <div className="mb-4">
// //       <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
// //         {label} {required && <span className="text-red-500">*</span>}
// //       </label>
// //       <div className="relative">
// //         <select
// //           name={name}
// //           value={value}
// //           onChange={onChange}
// //           disabled={disabled}
// //           className={`w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 appearance-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 outline-none ${disabled ? "bg-gray-100 dark:bg-slate-700/50 cursor-not-allowed text-gray-500 dark:text-slate-400" : "bg-white dark:bg-slate-800"} ${error ? "border-red-400 focus:ring-red-400" : ""} ${className}`}
// //         >
// //           <option value="" disabled>Select Role</option>
// //           {options.map((opt) => (
// //             <option key={opt.value || opt} value={opt.value || opt}>
// //               {opt.label || opt}
// //             </option>
// //           ))}
// //         </select>
// //         {icon && (
// //           <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
// //             {React.cloneElement(icon, { className: `${disabled ? "text-gray-300 dark:text-slate-600" : "text-gray-400 dark:text-slate-500"}`, size: 18 })}
// //           </div>
// //         )}
// //         <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-slate-300 pointer-events-none" size={20} />
// //       </div>
// //       {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
// //     </div>
// //   );
// // };

// // export default ApiDropdown;

// import React, { useState } from "react";
// import { ChevronDown } from "lucide-react";

// const ApiDropdown = ({
//   label,
//   value,
//   onChange,
//   options = [],
//   placeholder = "Select",
//   required,
// }) => {
//   const [open, setOpen] = useState(false);

//   return (
//     <div className="w-full">
//       {label && (
//         <label className="block mb-1 text-sm font-medium">
//           {label} {required && <span className="text-red-500">*</span>}
//         </label>
//       )}

//       <div
//         className="relative w-full border rounded-lg px-4 py-3 bg-white dark:bg-slate-800 cursor-pointer text-gray-700 dark:text-slate-200"
//         onClick={() => setOpen(!open)}
//       >
//         {/* Placeholder + Selected Value */}
//         <span
//           className={`${value ? "text-black" : "text-gray-400 dark:text-slate-500"}`}
//         >
//           {value ? value : placeholder}
//         </span>

//         {/* Dropdown Arrow */}
//         <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-slate-400" />
//       </div>

//       {/* Dropdown Menu */}
//       {open && (
//         <div className="mt-1 border rounded-lg bg-white dark:bg-slate-800 shadow-lg w-full max-h-60 overflow-y-auto">
//           {options?.map((opt) => (
//             <div
//               key={opt.value}
//               onClick={() => {
//                 onChange(opt.value);
//                 setOpen(false);
//               }}
//               className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
//             >
//               {opt.label}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default ApiDropdown;







import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const ApiDropdown = ({
  name,
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  required,
  error,
  disabled,
}) => {
  // Prefer explicit `name` prop; fall back to label-lowercased for backward compat
  const fieldName = name || label?.toLowerCase();
  const [open, setOpen] = useState(false);

  // 🔑 find selected option label
  const selectedOption = options.find(
    (opt) => opt.value === value
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-1 text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        className={`relative w-full border rounded-lg px-4 py-3 bg-white dark:bg-slate-800 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} text-gray-700 dark:text-slate-200 ${error ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-slate-700'}`}
        onClick={() => { if (!disabled) setOpen(!open); }}
      >
        {/* Selected Label */}
        <span
          className={`${
            selectedOption ? "text-black" : "text-gray-400 dark:text-slate-500"
          }`}
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-slate-400" />
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {open && !disabled && (
        <div className="mt-1 border rounded-lg bg-white dark:bg-slate-800 shadow-lg w-full max-h-60 overflow-y-auto z-50" onClick={(e) => e.stopPropagation()}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation();
                onChange({ name: fieldName, value: opt.value });
                setOpen(false);
              }}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiDropdown;

