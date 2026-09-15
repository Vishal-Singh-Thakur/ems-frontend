import React from "react";

const AppInput = ({
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  rightIcon,
  error,
  required = false,
  disabled = false,
  maxLength,
  className = ""
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative w-full">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={`
            w-full py-3 pr-4 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100
            focus:ring-2 focus:ring-black focus:border-transparent outline-none
            transition-all duration-200
            ${icon ? "pl-10" : "pl-4"}
            ${disabled ? "bg-gray-100 dark:bg-slate-700/50 cursor-not-allowed text-gray-500 dark:text-slate-400" : ""}
            ${error ? "border-red-400 focus:ring-red-400" : ""}
            ${className}
          `}
        />

        {/* LEFT ICON SAFE CHECK */}
        {icon && React.isValidElement(icon) && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {React.cloneElement(icon, {
              className: `${disabled ? "text-gray-300 dark:text-slate-600" : "text-gray-400 dark:text-slate-500"}`,
              size: 18
            })}
          </div>
        )}

        {/* RIGHT ICON */}
        {rightIcon && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default AppInput;
