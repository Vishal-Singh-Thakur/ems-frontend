import React, { useEffect, useState } from "react";
import { Crown, Shield, Briefcase, User as UserIcon, Users2 } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { TeamTreeAPI } from "./Constant/Api/Api";

const ROLE_STYLE = {
  superadmin: { bg: 'from-purple-500 to-fuchsia-600', ring: 'ring-purple-200', icon: <Crown size={14} /> },
  admin: { bg: 'from-blue-500 to-indigo-600', ring: 'ring-blue-200', icon: <Shield size={14} /> },
  hr: { bg: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-200', icon: <Briefcase size={14} /> },
  manager: { bg: 'from-amber-500 to-orange-600', ring: 'ring-amber-200', icon: <Users2 size={14} /> },
  employee: { bg: 'from-slate-400 to-slate-600', ring: 'ring-slate-200', icon: <UserIcon size={14} /> }
};

const PersonCard = ({ person, big = false }) => {
  const style = ROLE_STYLE[person.role] || ROLE_STYLE.employee;
  const initials = (person.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition ${big ? 'min-w-[160px] sm:min-w-[220px]' : 'min-w-[200px]'} ring-1 ${style.ring}`}>
      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${style.bg} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{person.name}</div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-400 truncate">
          <span className="inline-flex items-center gap-1 uppercase font-medium">
            {style.icon}
            {person.role}
          </span>
          {person.designation && (
            <>
              <span>•</span>
              <span className="truncate">{person.designation}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Recursive top-down horizontal tree node.
// Root is centered; children spread horizontally below with T-connectors.
const TreeNode = ({ node, depth = 0 }) => {
  const hasChildren = (node.children || []).length > 0;
  const count = node.children?.length || 0;
  const isRoot = depth === 0;

  return (
    <div className="inline-flex flex-col items-center">
      <PersonCard person={node} big={isRoot} />

      {hasChildren && (
        <>
          {/* Vertical line down from card */}
          <div className="w-px h-6 bg-gray-300 dark:bg-slate-700" />

          {/* Row of children */}
          <div className="flex items-start">
            {node.children.map((child, i) => (
              <div key={child._id} className="flex flex-col items-center px-4 relative">
                {/* Horizontal T-connector across the top of each child slot */}
                {count > 1 && (
                  <div
                    className={`absolute top-0 h-px bg-gray-300 dark:bg-slate-700 ${
                      i === 0
                        ? 'left-1/2 right-0'
                        : i === count - 1
                          ? 'left-0 right-1/2'
                          : 'left-0 right-0'
                    }`}
                  />
                )}
                {/* Vertical connector from horizontal line to child card */}
                <div className="w-px h-6 bg-gray-300 dark:bg-slate-700" />
                <TreeNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const TeamTree = ({ title = "Organization Tree", scope }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = scope ? `${TeamTreeAPI}?scope=${encodeURIComponent(scope)}` : TeamTreeAPI;
        const r = await ApiHit(url, "GET");
        if (!alive) return;
        if (r?.success) setData(r.data);
        else setError(r?.message || "Failed to load tree");
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [scope]);

  const roots = data?.roots || [];
  const unassigned = data?.unassigned || [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-5">
        <h4 className="font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <Users2 size={18} className="text-blue-600 dark:text-blue-400" />
          {title}
        </h4>
        {data?.scope && (
          <span className="text-[10px] font-semibold uppercase text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700/50 px-2 py-1 rounded-full">
            {data.scope} view
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-gray-400 dark:text-slate-500 py-6 text-center">Loading tree…</div>
      ) : error ? (
        <div className="text-xs text-red-500 py-6 text-center">{error}</div>
      ) : roots.length === 0 && unassigned.length === 0 ? (
        <div className="text-xs text-gray-400 dark:text-slate-500 py-6 text-center">No team data to display</div>
      ) : (
        <>
          {/* Horizontally-scrollable, centered tree canvas */}
          <div className="overflow-x-auto pb-4">
            <div className="flex justify-center gap-10 min-w-max py-2 px-4">
              {roots.map((root) => (
                <TreeNode key={root._id} node={root} />
              ))}
            </div>
          </div>

          {unassigned.length > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-800">
              <div className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 text-center">
                Unassigned Employees
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {unassigned.map((u) => <PersonCard key={u._id} person={u} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeamTree;
