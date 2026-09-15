import React, { useState, useEffect, useMemo } from "react";
import {
  User, Mail, Briefcase, Phone, Building2, Shield, Camera, Calendar,
  Home, PhoneCall, IdCard, FileText, Upload, Trash2, Download, Eye,
  CheckCircle2, AlertCircle, Loader2, FileImage, FileType2, File as FileIcon
} from "lucide-react";
import ApiHit from "../Utils/ApiHit";
import { DocumentFileAPI,
  GetMyProfileAPI,
  UpdateMyProfileAPI,
  UploadMyDocumentAPI,
  DeleteMyDocumentAPI,
  BASE_URL
} from "../components/Constant/Api/Api";

const STATIC_BASE = BASE_URL.replace(/\/api\/?$/, '');

const DOCUMENT_CATEGORIES = ['ID Proof', 'Address Proof', 'Educational', 'Experience', 'Other'];
const CATEGORY_STYLE = {
  'ID Proof':       'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
  'Address Proof':  'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
  'Educational':    'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  'Experience':     'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
  'Other':          'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700'
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
const isImage = (mime) => /^image\//i.test(mime || '');
const isPdf = (mime) => /pdf/i.test(mime || '');
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const FieldLabel = ({ icon, children }) => (
  <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
    <span className="text-blue-600 dark:text-blue-400">{icon}</span> {children}
  </label>
);
const inputCls = (readonly) =>
  `w-full border rounded-xl px-3 py-2 text-sm transition ${
    readonly
      ? 'border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 text-gray-600 dark:text-slate-300 cursor-not-allowed'
      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500'
  }`;

const Profile = () => {
  const [data, setData] = useState({ user: null, employee: null, completion: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tab, setTab] = useState('info'); // info | documents
  const [form, setForm] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  // Documents state
  const [uploadBusy, setUploadBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [docLabel, setDocLabel] = useState('');
  const [docCategory, setDocCategory] = useState('ID Proof');
  const [docFile, setDocFile] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const user = data.user;
  const employee = data.employee;
  const completion = data.completion;

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiHit(GetMyProfileAPI, "GET");
      if (res?.success) {
        setData({
          user: res.data.user,
          employee: res.data.employee,
          completion: res.data.completion
        });
        setForm({
          name: res.data.user?.name || '',
          phone: res.data.user?.phone || '',
          dob: res.data.user?.dob ? res.data.user.dob.split('T')[0] : '',
          address: res.data.user?.address || '',
          emergencyContact: res.data.user?.emergencyContact || ''
        });
      } else {
        setError(res?.message || 'Failed to load profile');
      }
    } catch (e) {
      setError(e.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, image: 'Image must be under 5 MB' }));
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrors((p) => ({ ...p, image: 'Please select an image file' }));
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setErrors((p) => ({ ...p, image: '' }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validateForm = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = 'Name is required (min 2 chars)';
    if (!form.phone || !/^[+]?[\d\s-]{10,15}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        dob: form.dob || null,
        address: form.address?.trim() || '',
        emergencyContact: form.emergencyContact?.trim() || ''
      };
      if (imagePreview) payload.image = imagePreview;
      const res = await ApiHit(UpdateMyProfileAPI, "PUT", payload);
      if (res?.success) {
        setEditMode(false);
        setImageFile(null);
        setImagePreview(null);
        await fetchProfile();
      } else {
        setError(res?.message || 'Update failed');
      }
    } catch (e) {
      setError(e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      dob: user?.dob ? user.dob.split('T')[0] : '',
      address: user?.address || '',
      emergencyContact: user?.emergencyContact || ''
    });
  };

  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!docFile) { alert('Please select a file'); return; }
    if (!docLabel.trim()) { alert('Please enter a document label'); return; }
    try {
      setUploadBusy(true);
      const fd = new FormData();
      fd.append('file', docFile);
      fd.append('label', docLabel.trim());
      fd.append('category', docCategory);
      const res = await ApiHit(UploadMyDocumentAPI, "POST", fd);
      if (res?.success) {
        setDocLabel(''); setDocFile(null); setDocCategory('ID Proof');
        await fetchProfile();
      } else {
        alert(res?.message || 'Upload failed');
      }
    } finally {
      setUploadBusy(false);
    }
  };

  const handleDocDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      setDeletingId(docId);
      const res = await ApiHit(DeleteMyDocumentAPI(docId), "DELETE");
      if (res?.success) await fetchProfile();
      else alert(res?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const percent = completion?.percent ?? 0;
  const ringColor = percent >= 90 ? 'from-emerald-500 to-teal-600'
    : percent >= 70 ? 'from-blue-500 to-indigo-600'
    : percent >= 50 ? 'from-amber-500 to-orange-600'
    : 'from-red-500 to-rose-600';

  const documents = user?.documents || [];

  if (loading) {
    return (
      <main className="p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-slate-400">
          <Loader2 size={40} className="mx-auto animate-spin text-blue-600 dark:text-blue-400 mb-3" />
          Loading profile…
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl text-center shadow border border-gray-100 dark:border-slate-800 max-w-md mx-auto">
          <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
          <div className="text-gray-700 dark:text-slate-200 font-medium mb-2">Failed to load profile</div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{error}</p>
          <button onClick={fetchProfile} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Try again</button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      {/* Header banner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden mb-6">
        <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="p-6 pt-0">
          <div className="flex items-end justify-between flex-wrap gap-4 -mt-14">
            <div className="flex items-end gap-4">
              <div className="relative">
                {imagePreview || user.image ? (
                  <img
                    src={imagePreview || user.image}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg bg-white dark:bg-slate-800"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                    {initials(user.name)}
                  </div>
                )}
                {editMode && (
                  <label className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 p-2 rounded-full cursor-pointer shadow-lg">
                    <Camera size={14} className="text-white" />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
              <div className="pb-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100">{user.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-slate-300 flex-wrap">
                  <span className="flex items-center gap-1"><Briefcase size={13} /> {user.jobRoleId?.name || 'N/A'}</span>
                  <span className="flex items-center gap-1"><Building2 size={13} /> {user.departmentId?.name || 'N/A'}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                    <IdCard size={11} /> {user?.employeeId || employee?.employeeId || 'EMP-—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!editMode ? (
                <button onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition flex items-center gap-1.5">
                  <User size={14} /> Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={handleCancel} disabled={saving}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-sm font-medium rounded-xl transition disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow transition disabled:opacity-50 flex items-center gap-1.5">
                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><CheckCircle2 size={14} /> Save Changes</>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Completion + Quick stats — click to jump to relevant tab */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setTab('info')}
          className={`text-left bg-gradient-to-br ${ringColor} rounded-2xl p-5 text-white shadow relative overflow-hidden md:col-span-1 transition transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-slate-900/50`}
        >
          <div className="text-[11px] uppercase tracking-wider opacity-90 mb-1">Profile Completion</div>
          <div className="text-4xl font-bold leading-tight">{percent}%</div>
          <div className="text-xs opacity-90 mt-1">{completion?.done}/{completion?.total} fields complete</div>
          <div className="mt-3 h-2 rounded-full bg-white/30 dark:bg-slate-900/30 overflow-hidden">
            <div className="h-full bg-white dark:bg-slate-800" style={{ width: `${percent}%` }} />
          </div>
          {completion?.missing?.length > 0 && (
            <div className="mt-3 text-[11px] opacity-95">
              <span className="font-semibold">Missing:</span> {completion.missing.slice(0, 3).join(', ')}
              {completion.missing.length > 3 ? `, +${completion.missing.length - 3} more` : ''}
            </div>
          )}
        </button>

        <button
          onClick={() => setTab('info')}
          className="text-left bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 md:p-5 shadow border border-gray-100 dark:border-slate-800 transition hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-500/30 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <div className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold mb-2">Account Status</div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${user.isActive ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1">
            <div>System Role: <span className="text-gray-800 dark:text-slate-100 font-medium">{user.roleId?.name || 'N/A'}</span></div>
            <div>Joined: <span className="text-gray-800 dark:text-slate-100 font-medium">{fmtDate(employee?.joiningDate || user.createdAt)}</span></div>
          </div>
        </button>

        <button
          onClick={() => setTab('documents')}
          className="text-left bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 md:p-5 shadow border border-gray-100 dark:border-slate-800 transition hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-500/30 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <div className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold mb-2">Documents</div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100 leading-tight">{documents.length}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">uploaded document{documents.length === 1 ? '' : 's'}</div>
          <div className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            <FileText size={12} /> Manage documents
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow border border-gray-100 dark:border-slate-800 mb-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTab('info')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
              tab === 'info'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                : 'bg-gray-50 dark:bg-slate-900/40 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
            }`}
          >
            <User size={14} /> Personal Info
          </button>
          <button
            onClick={() => setTab('documents')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
              tab === 'documents'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                : 'bg-gray-50 dark:bg-slate-900/40 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
            }`}
          >
            <FileText size={14} /> Documents
            <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/30 dark:bg-slate-900/30">
              {documents.length}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-3 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* TAB: Personal Info */}
      {tab === 'info' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-5 flex items-center gap-2">
            <User size={18} className="text-blue-600 dark:text-blue-400" /> Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <FieldLabel icon={<User size={12} />}>Full Name</FieldLabel>
              <input name="name" value={editMode ? form.name : user.name || ''} onChange={handleInputChange}
                disabled={!editMode || saving} className={inputCls(!editMode)} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <FieldLabel icon={<Mail size={12} />}>Email Address</FieldLabel>
              <input value={user.email || ''} disabled className={inputCls(true)} />
            </div>
            <div>
              <FieldLabel icon={<Phone size={12} />}>Phone Number</FieldLabel>
              <input name="phone" value={editMode ? form.phone : user.phone || ''} onChange={handleInputChange}
                disabled={!editMode || saving} className={inputCls(!editMode)} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <FieldLabel icon={<IdCard size={12} />}>Employee ID</FieldLabel>
              <input value={user?.employeeId || employee?.employeeId || 'Not assigned'} disabled className={inputCls(true)} />
            </div>
            <div>
              <FieldLabel icon={<Building2 size={12} />}>Department</FieldLabel>
              <input value={user.departmentId?.name || 'N/A'} disabled className={inputCls(true)} />
            </div>
            <div>
              <FieldLabel icon={<Briefcase size={12} />}>Job Role</FieldLabel>
              <input value={user.jobRoleId?.name || 'N/A'} disabled className={inputCls(true)} />
            </div>

            <div>
              <FieldLabel icon={<Shield size={12} />}>System Role</FieldLabel>
              <input value={user.roleId?.name || 'N/A'} disabled className={inputCls(true)} />
            </div>
            <div>
              <FieldLabel icon={<Calendar size={12} />}>Joining Date</FieldLabel>
              <input value={fmtDate(employee?.joiningDate || user.createdAt)} disabled className={inputCls(true)} />
            </div>
            <div>
              <FieldLabel icon={<Calendar size={12} />}>Date of Birth</FieldLabel>
              <input type={editMode ? 'date' : 'text'} name="dob"
                value={editMode ? (form.dob || '') : fmtDate(user.dob)}
                onChange={handleInputChange}
                disabled={!editMode || saving} className={inputCls(!editMode)} />
            </div>

            <div className="md:col-span-2">
              <FieldLabel icon={<Home size={12} />}>Address</FieldLabel>
              <input name="address" value={editMode ? (form.address || '') : (user.address || '—')} onChange={handleInputChange}
                disabled={!editMode || saving} className={inputCls(!editMode)} placeholder={editMode ? "House / Street / City / State / Pincode" : ''} />
            </div>
            <div>
              <FieldLabel icon={<PhoneCall size={12} />}>Emergency Contact</FieldLabel>
              <input name="emergencyContact" value={editMode ? (form.emergencyContact || '') : (user.emergencyContact || '—')} onChange={handleInputChange}
                disabled={!editMode || saving} className={inputCls(!editMode)} placeholder={editMode ? "Family / next-of-kin phone" : ''} />
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>Email, Department, Job Role, Employee ID and System Role can only be updated by HR/Admin.</span>
          </div>
        </div>
      )}

      {/* TAB: Documents */}
      {tab === 'documents' && (
        <div className="space-y-6">
          {/* Upload form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Upload size={18} className="text-blue-600 dark:text-blue-400" /> Upload New Document
            </h2>
            <form onSubmit={handleDocUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <FieldLabel icon={<FileText size={12} />}>Label</FieldLabel>
                <input type="text" value={docLabel} onChange={(e) => setDocLabel(e.target.value)}
                  placeholder="e.g. Aadhaar Card" className={inputCls(false)} />
              </div>
              <div>
                <FieldLabel icon={<FileText size={12} />}>Category</FieldLabel>
                <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className={inputCls(false)}>
                  {DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <FieldLabel icon={<Upload size={12} />}>File (Image / PDF / Word, max 10MB)</FieldLabel>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center gap-2 border border-dashed border-gray-300 dark:border-slate-600 hover:border-blue-400 rounded-xl px-3 py-2 text-sm cursor-pointer bg-gray-50 dark:bg-slate-900/40 text-gray-600 dark:text-slate-300 truncate">
                    <Upload size={14} />
                    <span className="truncate">{docFile?.name || 'Choose file…'}</span>
                    <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      accept="image/*,.pdf,.doc,.docx" className="hidden" />
                  </label>
                  <button type="submit" disabled={uploadBusy || !docFile || !docLabel.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow flex items-center gap-1.5">
                    {uploadBusy ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload</>}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Documents list */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-blue-600 dark:text-blue-400" /> My Documents ({documents.length})
            </h2>

            {documents.length === 0 ? (
              <div className="text-center py-10">
                <FileText size={40} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                <div className="text-gray-500 dark:text-slate-400 font-medium">No documents uploaded yet</div>
                <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Upload your ID proof, resume, certificates etc.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {documents.map((d) => {
                  // Access-checked route: a personal document must not open by URL alone.
                  const url = DocumentFileAPI(d._id);
                  const catCls = CATEGORY_STYLE[d.category] || CATEGORY_STYLE.Other;
                  const Icon = isImage(d.mimeType) ? FileImage : isPdf(d.mimeType) ? FileType2 : FileIcon;
                  return (
                    <div key={d._id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition bg-white dark:bg-slate-800 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate" title={d.label}>{d.label}</div>
                            <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{d.fileName} · {fmtSize(d.size)}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catCls} whitespace-nowrap flex-shrink-0`}>
                          {d.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 dark:text-slate-500 mb-3">Uploaded {fmtDate(d.uploadedAt)}</div>
                      <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-gray-100 dark:border-slate-800">
                        <button
                          onClick={() => setPreviewDoc({ ...d, url })}
                          className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-50 dark:bg-slate-900/40 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 py-1.5 rounded-lg transition border border-gray-200 dark:border-slate-700"
                        >
                          <Eye size={12} /> Preview
                        </button>
                        <a href={url} target="_blank" rel="noreferrer" download
                          className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/15 text-blue-700 dark:text-blue-300 py-1.5 px-3 rounded-lg transition border border-blue-200 dark:border-blue-500/30">
                          <Download size={12} /> Get
                        </a>
                        <button
                          disabled={deletingId === d._id}
                          onClick={() => handleDocDelete(d._id)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40">
              <div className="min-w-0">
                <div className="font-semibold text-gray-800 dark:text-slate-100 truncate">{previewDoc.label}</div>
                <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{previewDoc.fileName}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={previewDoc.url} target="_blank" rel="noreferrer" download
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Download size={12} /> Download
                </a>
                <button onClick={() => setPreviewDoc(null)}
                  className="text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-200 px-3 py-1.5 rounded-lg">
                  Close
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-100 dark:bg-slate-700/50 flex items-center justify-center overflow-auto flex-1">
              {isImage(previewDoc.mimeType) ? (
                <img src={previewDoc.url} alt={previewDoc.label} className="max-w-full max-h-[75vh] rounded" />
              ) : isPdf(previewDoc.mimeType) ? (
                <iframe src={previewDoc.url} title={previewDoc.label} className="w-full h-[75vh] rounded bg-white dark:bg-slate-800" />
              ) : (
                <div className="text-center text-gray-600 dark:text-slate-300 py-16">
                  <FileIcon size={40} className="mx-auto text-gray-400 dark:text-slate-500 mb-2" />
                  <div>Preview not available — please download to view.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Profile;
