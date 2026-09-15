import React from "react";
import { Sparkles } from "lucide-react";

const ComingSoon = ({ moduleName = "This module", icon }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 p-5 sm:p-8 md:p-10">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          {icon || <Sparkles size={36} />}
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 mb-2">{moduleName}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Coming Soon</p>
        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
          Yeh module abhi under development hai. Backend + UI wire hone ke baad live ho jayega.
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
