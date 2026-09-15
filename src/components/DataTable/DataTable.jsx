import React from "react";

const DataTable = ({ th = [], td, totalPages, api, isLoading }) => {
  return (
    <div className="w-full border rounded-lg shadow-sm overflow-hidden bg-white dark:bg-slate-800">

      {/* Table */}
      <table className="w-full border-collapse">
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
