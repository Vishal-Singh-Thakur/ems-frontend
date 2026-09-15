import React, { useState } from "react";
import { Building2, Users2 } from "lucide-react";
import TeamTree from "../components/TeamTree";

const OrgTreePage = () => {
  const [tab, setTab] = useState('company');

  const tabs = [
    { key: 'company', label: 'Organization', icon: <Building2 size={16} />, title: 'Organization Tree' },
    { key: 'my', label: 'My Team', icon: <Users2 size={16} />, title: 'My Team' }
  ];
  const active = tabs.find((t) => t.key === tab);

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      <div className="mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100">{active.title}</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Toggle between full organization view and your own team.</p>
      </div>

      {/* Tabs */}
      <div className="mb-5 inline-flex bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <TeamTree title={active.title} scope={tab} />
    </main>
  );
};

export default OrgTreePage;
