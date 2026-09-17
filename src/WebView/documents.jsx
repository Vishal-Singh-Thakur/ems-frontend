import React, { useEffect, useMemo, useState } from "react";
import { FileText, Upload, Download, Trash2, Pencil, Building2, User as UserIcon, Search, RefreshCcw, X, File, FileImage, FileType2, Users } from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { DocumentFileAPI, GetOrgDocumentsAPI, GetMyDocumentsAPI, GetAllPersonalDocsAPI, UploadDocumentAPI, UpdateDocumentAPI, DeleteDocumentAPI, PayrollEligibleEmployeesAPI } from "../components/Constant/Api/Api";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 5;

const TYPES = [
  'Policy', 'Handbook', 'Form', 'Template', 'Announcement',
  'Offer Letter', 'Contract', 'ID Proof', 'Tax Document',
  'Certificate', 'Salary Letter', 'Experience Letter', 'Other'
];

const TYPE_COLOR = {
  Policy:            'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
  Handbook:          'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
  Form:              'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  Template:          'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',
  Announcement:      'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
  'Offer Letter':    'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
  Contract:          'bg-fuchsia-100 dark:bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-500/30',
  'ID Proof':        'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',
  'Tax Document':    'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
  Certificate:       'bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30',
  'Salary Letter':   'bg-lime-100 dark:bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-500/30',
  'Experience Letter': 'bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30',
  Other:             'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700'
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtSize = (b) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};
const iconForMime = (mime) => {
  if (!mime) return <File size={20} />;
  if (mime.startsWith('image/')) return <FileImage size={20} />;
  if (mime === 'application/pdf') return <FileType2 size={20} className="text-red-500" />;
  return <FileText size={20} />;
};
// Documents are read through an access-checked API route rather than a direct
// /uploads URL — the raw path would open a personal document to anyone holding
// the link. An externally hosted file still opens as-is.
const buildFileUrl = (doc) => {
  if (!doc) return '#';
  if (/^https?:\/\//i.test(doc.filePath || '')) return doc.filePath;
  return doc._id ? DocumentFileAPI(doc._id) : '#';
};

const Documents = ({ user }) => {
  const role = (user?.roleId?.name || user?.role || '').toLowerCase();
  const canManage = ['superadmin', 'hr'].includes(role);

  const [tab, setTab] = useState('org'); // org | my | all-personal
  const [orgDocs, setOrgDocs] = useState([]);
  const [myDocs, setMyDocs] = useState([]);
  const [allPersonal, setAllPersonal] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState({ open: false, mode: 'create', data: null, category: 'org' });
  const [employees, setEmployees] = useState([]);

  const fetchOrg = async () => {
    const r = await ApiHit(GetOrgDocumentsAPI, "GET");
    if (r?.success) setOrgDocs(r.data || []);
  };
  const fetchMy = async () => {
    const r = await ApiHit(GetMyDocumentsAPI, "GET");
    if (r?.success) setMyDocs(r.data || []);
  };
  const fetchAllPersonal = async () => {
    const r = await ApiHit(GetAllPersonalDocsAPI, "GET");
    if (r?.success) setAllPersonal(r.data || []);
  };
  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrg(),
        fetchMy(),
        canManage ? fetchAllPersonal() : Promise.resolve()
      ]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    if (canManage && employees.length === 0) {
      ApiHit(PayrollEligibleEmployeesAPI, "GET").then((r) => {
        if (r?.success) setEmployees(r.data || []);
      });
    }
  }, [canManage, employees.length]);

  const openCreate = (category) => setModal({ open: true, mode: 'create', data: null, category });
  const openEdit = (d) => setModal({ open: true, mode: 'edit', data: d, category: d.category });
  const closeModal = () => setModal({ open: false, mode: 'create', data: null, category: 'org' });

  const handleDelete = async (d) => {
    if (!window.confirm(`Delete "${d.name}"?`)) return;
    const r = await ApiHit(DeleteDocumentAPI(d._id), "DELETE");
    if (r?.success) fetchAll();
    else alert(r?.message || 'Delete failed');
  };

  const currentList = tab === 'org' ? orgDocs : tab === 'my' ? myDocs : allPersonal;

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="text-blue-600 dark:text-blue-400" /> Documents
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Organization-wide files and your personal documents.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchAll} className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-3 py-2 rounded-lg text-gray-700 dark:text-slate-200 transition">
            <RefreshCcw size={14} /> Refresh
          </button>
          {canManage && (
            <button
              onClick={() => openCreate(tab === 'my' ? 'personal' : (tab === 'all-personal' ? 'personal' : 'org'))}
              className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow font-medium"
            >
              <Upload size={16} /> Upload Document
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-800 p-2 mb-6 flex items-center gap-2 flex-wrap">
        <TabButton
          active={tab === 'org'}
          onClick={() => setTab('org')}
          icon={<Building2 size={16} />}
          label="Organization Documents"
          count={orgDocs.length}
        />
        <TabButton
          active={tab === 'my'}
          onClick={() => setTab('my')}
          icon={<UserIcon size={16} />}
          label="My Documents"
          count={myDocs.length}
        />
        {canManage && (
          <TabButton
            active={tab === 'all-personal'}
            onClick={() => setTab('all-personal')}
            icon={<Users size={16} />}
            label="All Employee Documents"
            count={allPersonal.length}
          />
        )}
      </div>

      {/* List */}
      <DocList
        loading={loading}
        docs={currentList}
        canManage={canManage}
        showOwner={tab === 'all-personal'}
        emptyText={
          tab === 'org' ? 'No organization documents yet' :
          tab === 'my' ? 'No personal documents yet' :
          'No employee documents yet'
        }
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {/* Modal */}
      {modal.open && (
        <DocumentModal
          mode={modal.mode}
          data={modal.data}
          defaultCategory={modal.category}
          canManage={canManage}
          employees={employees}
          onClose={closeModal}
          onSuccess={() => { closeModal(); fetchAll(); }}
        />
      )}
    </main>
  );
};

/* ---------- Tab button ---------- */
const TabButton = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition ${
      active
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
    }`}
  >
    {icon} <span className="hidden sm:inline">{label}</span>
    <span className="sm:hidden">{label.split(' ')[0]}</span>
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${active ? 'bg-white/20 dark:bg-slate-900/20' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>{count}</span>
  </button>
);

/* ---------- Document list ---------- */
const DocList = ({ loading, docs, canManage, showOwner, emptyText, onEdit, onDelete }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return docs.filter((d) => {
      const matchSearch = !q ||
        (d.name || '').toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q) ||
        (d.ownerId?.name || '').toLowerCase().includes(q);
      const matchType = typeFilter === 'all' || d.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [docs, search, typeFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, typeFilter]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  if (loading) return <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading…</div>;

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text" placeholder="Search documents…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <FileText size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">
            {docs.length === 0 ? emptyText : 'No documents match your filters'}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {paginated.map((d) => (
              <div key={d._id} className="flex items-start gap-3 sm:gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  {iconForMime(d.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-800 dark:text-slate-100 break-words">{d.name}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLOR[d.type] || TYPE_COLOR.Other}`}>{d.type}</span>
                    {showOwner && d.ownerId?.name && (
                      <span className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1"><UserIcon size={11} /> {d.ownerId.name}</span>
                    )}
                  </div>
                  {d.description && <p className="text-xs text-gray-600 dark:text-slate-300 break-words mb-1">{d.description}</p>}
                  <div className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>{d.fileName}</span>
                    <span>·</span>
                    <span>{fmtSize(d.fileSize)}</span>
                    <span>·</span>
                    <span>Uploaded {fmtDate(d.createdAt)}</span>
                    {d.uploadedBy?.name && <><span>·</span><span>by {d.uploadedBy.name}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={buildFileUrl(d)}
                    target="_blank" rel="noopener noreferrer"
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg" title="Download / view"
                  >
                    <Download size={16} />
                  </a>
                  {canManage && (
                    <>
                      <button onClick={() => onEdit(d)} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => onDelete(d)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
        </div>
      )}
    </>
  );
};

/* ---------- Upload / Edit modal ---------- */
const DocumentModal = ({ mode, data, defaultCategory, employees, onClose, onSuccess }) => {
  const isEdit = mode === 'edit';
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState(() => ({
    name: isEdit ? (data.name || '') : '',
    description: isEdit ? (data.description || '') : '',
    category: isEdit ? data.category : (defaultCategory || 'org'),
    type: isEdit ? (data.type || 'Other') : 'Other',
    ownerId: isEdit ? (data.ownerId?._id || data.ownerId || '') : '',
    file: null
  }));

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim()) { setErr('Name is required'); return; }
    if (!isEdit && !form.file) { setErr('Please choose a file'); return; }
    if (form.category === 'personal' && !form.ownerId) { setErr('Please select the owner for personal document'); return; }

    setBusy(true);
    try {
      let r;
      if (isEdit) {
        r = await ApiHit(UpdateDocumentAPI(data._id), "PUT", {
          name: form.name.trim(),
          description: form.description,
          type: form.type
        });
      } else {
        const fd = new FormData();
        fd.append('name', form.name.trim());
        fd.append('description', form.description || '');
        fd.append('category', form.category);
        fd.append('type', form.type);
        if (form.category === 'personal') fd.append('ownerId', form.ownerId);
        fd.append('file', form.file);
        r = await ApiHit(UploadDocumentAPI, "POST", fd);
      }
      if (r?.success) onSuccess();
      else setErr(r?.message || 'Save failed');
    } catch (ex) {
      setErr(ex.message || 'Something went wrong');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
            {isEdit ? <Pencil size={18} /> : <Upload size={18} />}
            {isEdit ? 'Edit Document' : 'Upload Document'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 dark:hover:bg-slate-900/20 rounded"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {err && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">{err}</div>}

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" placeholder="E.g. Company Policy 2026" required />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" placeholder="Optional details" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!isEdit && (
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Category *</label>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm">
                  <option value="org">Organization (all can view)</option>
                  <option value="personal">Personal (assigned to a user)</option>
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Type</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm">
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {!isEdit && form.category === 'personal' && (
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">Assign to Employee *</label>
              <select value={form.ownerId} onChange={(e) => set('ownerId', e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm">
                <option value="">-- select employee --</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name} {e.employeeId ? `(${e.employeeId})` : ''} · {e.department || 'No dept'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider block mb-1">File * <span className="text-gray-400 dark:text-slate-500 font-normal normal-case text-[10px]">(PDF, Image or Word, max 10 MB)</span></label>
              <input
                type="file"
                onChange={(e) => set('file', e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-blue-50 dark:file:bg-blue-500/10 file:text-blue-700 dark:file:text-blue-300 file:text-xs file:font-semibold"
                required
              />
              {form.file && <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">{form.file.name} · {fmtSize(form.file.size)}</p>}
            </div>
          )}

          {isEdit && (
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300">
              File cannot be changed while editing. Delete and re-upload if the file needs to change.
            </div>
          )}
        </form>

        <div className="border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 px-4 sm:px-5 py-3 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-800">Cancel</button>
          <button onClick={submit} disabled={busy} className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium disabled:opacity-50">
            {busy ? 'Saving…' : (isEdit ? 'Update' : 'Upload')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Documents;
