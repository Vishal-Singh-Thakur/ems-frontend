import React from "react";

export function Switch({ checked, onCheckedChange }) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <div
        className="w-11 h-6 bg-gray-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition relative"
      >
        <div
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-slate-800 rounded-full shadow transition peer-checked:translate-x-5"
        ></div>
      </div>
    </label>
  );
}