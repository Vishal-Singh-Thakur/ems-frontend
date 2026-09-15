import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage = 1, totalItems = 0, pageSize = 5, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) return null;

  const goTo = (p) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    onPageChange?.(p);
  };

  const getPages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 3) pages.push("…");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  };

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40">
      <div className="text-xs sm:text-sm text-gray-600 dark:text-slate-300">
        Showing <span className="font-semibold text-gray-800 dark:text-slate-100">{from}-{to}</span> of{" "}
        <span className="font-semibold text-gray-800 dark:text-slate-100">{totalItems}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 sm:p-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {getPages().map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="px-1.5 sm:px-2 text-gray-400 dark:text-slate-500 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p)}
              className={`min-w-[30px] sm:min-w-[34px] px-2 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                p === currentPage
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow"
                  : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 sm:p-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
