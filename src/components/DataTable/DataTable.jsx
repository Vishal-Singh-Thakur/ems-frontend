import React from "react";

const DataTable = ({ th = [], td, totalPages, api, isLoading }) => {
  return (
    <div className="w-full border rounded-lg shadow-sm overflow-hidden bg-white dark:bg-slate-800">

      {/* Table
          The scroll lives on this wrapper, not the card, because the card also
          holds the pagination — which should stay put while the columns move.
          min-w keeps the columns readable instead of letting `w-full` crush them
          into one word per line on a narrow screen. */}
      <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead className="bg-gray-100 dark:bg-slate-700/50 border-b">
          <tr>
            {th.map((h, i) => (
              <th key={i} className="p-3 font-semibold text-gray-700 dark:text-slate-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={th.length} className="text-center p-5">
                Loading...
              </td>
            </tr>
          ) : (
            td
          )}
        </tbody>
      </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center p-3 border-t bg-gray-50 dark:bg-slate-900/40">
          {Array.from({ length: totalPages }, (_, idx) => (
            <button
              key={idx}
              onClick={() => api(idx + 1)}
              className="px-3 py-1 border mx-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-sm"
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataTable;
