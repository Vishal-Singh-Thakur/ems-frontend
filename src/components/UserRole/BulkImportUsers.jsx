import React, { useRef, useState } from 'react';
import {
  Upload, FileSpreadsheet, Download, X, CheckCircle2, AlertTriangle,
  Loader2, Copy, ArrowLeft
} from 'lucide-react';
import ApiHit from '../../Utils/ApiHit';
import { BulkImportUsersAPI, BulkImportTemplateAPI } from '../Constant/Api/Api';
import { notifyOk, notifyError, notifyWarn } from '../../Utils/notify';

// Creating a lot of people at once, from a spreadsheet.
//
// The flow is check-then-commit rather than upload-and-hope. The file is sent
// once with dryRun set, which validates every row and creates nothing; only
// after that verdict is on screen does anything get written. Bulk creation is
// hard to undo — twenty accounts with the wrong department is twenty edits —
// and the check costs one request.
//
// The temporary passwords come back only from the real import, and only once.
// They are shown here and downloadable, because after this screen closes the
// server cannot produce them again: it only stored the hashes.

const CHECK = 'check';     // choosing a file
const REVIEW = 'review';   // dry run came back
const DONE = 'done';       // accounts created

const BulkImportUsers = ({ isOpen, onClose, onImported }) => {
  const [stage, setStage] = useState(CHECK);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  if (!isOpen) return null;

  const reset = () => { setStage(CHECK); setFile(null); setResult(null); setBusy(false); };
  const close = () => { reset(); onClose(); };

  const downloadTemplate = async () => {
    try {
      const res = await fetch(BulkImportTemplateAPI, { credentials: 'include' });
      if (!res.ok) { notifyError('Could not download the template.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ems-new-starters-template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notifyError('Could not download the template.');
    }
  };

  const choose = (picked) => {
    if (!picked) return;
    if (!/\.xlsx?$/i.test(picked.name)) {
      notifyWarn('Please choose an Excel file (.xlsx).');
      return;
    }
    setFile(picked);
    setResult(null);
    setStage(CHECK);
  };

  const send = async (dryRun) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await ApiHit(`${BulkImportUsersAPI}${dryRun ? '?dryRun=true' : ''}`, 'POST', fd);

      if (!r?.success) {
        notifyError(r?.message || 'The import could not be run.');
        return;
      }
      setResult(r.data);
      setStage(dryRun ? REVIEW : DONE);
      if (!dryRun) {
        if (r.data.createdCount) notifyOk(`Created ${r.data.createdCount} user${r.data.createdCount === 1 ? '' : 's'}.`);
        if (r.data.failedCount) notifyWarn(`${r.data.failedCount} row${r.data.failedCount === 1 ? '' : 's'} were skipped.`);
        onImported?.();
      }
    } catch {
      notifyError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  /** The one chance to keep these — the server kept only the hashes. */
  const downloadPasswords = () => {
    const header = 'Employee ID,Name,Email,Temporary password\n';
    const body = result.created
      .map((c) => [c.employeeId, c.name, c.email, c.tempPassword]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([header + body], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ems-imported-passwords.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyPasswords = async () => {
    const text = result.created.map((c) => `${c.email}\t${c.tempPassword}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      notifyOk('Copied to the clipboard.');
    } catch {
      notifyError('Could not copy. Use Download instead.');
    }
  };

  // Who is about to be created, with the role and department the sheet resolved
  // to. Reading a count back ("4 ready") does not catch the mistake this step
  // exists for — a column that matched a real department, just not the intended
  // one. The names have to be on screen before the button is pressed.
  const Ready = ({ rows }) => (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-1.5 mb-2">
        <CheckCircle2 size={15} className="text-green-600 dark:text-green-400" />
        {rows.length} ready to import
      </h4>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700 max-h-64 overflow-y-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-gray-50 dark:bg-slate-900/40 sticky top-0">
            <tr className="text-[11px] text-gray-500 dark:text-slate-400">
              <th className="text-left py-2 px-3 font-medium">Row</th>
              <th className="text-left py-2 px-3 font-medium">Name</th>
              <th className="text-left py-2 px-3 font-medium">Email</th>
              <th className="text-left py-2 px-3 font-medium">Role</th>
              <th className="text-left py-2 px-3 font-medium">Department</th>
              <th className="text-left py-2 px-3 font-medium">Designation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.row} className="border-t border-gray-100 dark:border-slate-800">
                <td className="py-2 px-3 text-gray-500 dark:text-slate-400">{c.row}</td>
                <td className="py-2 px-3 text-gray-800 dark:text-slate-100">{c.name}</td>
                <td className="py-2 px-3 text-gray-600 dark:text-slate-300">{c.email}</td>
                <td className="py-2 px-3 text-gray-600 dark:text-slate-300">{c.role}</td>
                <td className="py-2 px-3 text-gray-600 dark:text-slate-300">{c.department}</td>
                <td className="py-2 px-3 text-gray-600 dark:text-slate-300">{c.designation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const Failures = ({ rows }) => (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-1.5 mb-2">
        <AlertTriangle size={15} className="text-amber-500" />
        {rows.length} row{rows.length === 1 ? '' : 's'} need attention
      </h4>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
        <table className="w-full min-w-[440px] text-sm">
          <thead className="bg-gray-50 dark:bg-slate-900/40">
            <tr className="text-[11px] text-gray-500 dark:text-slate-400">
              <th className="text-left py-2 px-3 font-medium">Row</th>
              <th className="text-left py-2 px-3 font-medium">Who</th>
              <th className="text-left py-2 px-3 font-medium">Why it was skipped</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.row} className="border-t border-gray-100 dark:border-slate-800">
                <td className="py-2 px-3 text-gray-500 dark:text-slate-400">{f.row}</td>
                <td className="py-2 px-3 text-gray-800 dark:text-slate-100">{f.name || f.email || '—'}</td>
                <td className="py-2 px-3 text-amber-700 dark:text-amber-300">{f.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-[2px]"
         onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) close(); }}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700">

        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-blue-600 dark:text-blue-400" />
              Import users from a spreadsheet
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Everyone imported signs in with a temporary password and must choose their own.
            </p>
          </div>
          <button aria-label="Close" onClick={close} disabled={busy}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto">
          {stage === CHECK && (
            <>
              <button onClick={downloadTemplate}
                      className="w-full mb-4 flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg border border-dashed border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition">
                <Download size={15} /> Download the template
              </button>

              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files?.[0]); }}
                className={`flex flex-col items-center justify-center gap-2 py-10 px-4 rounded-xl border-2 border-dashed cursor-pointer transition ${
                  dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                           : 'border-gray-300 dark:border-slate-600 hover:border-blue-400'
                }`}>
                <input ref={inputRef} type="file" accept=".xlsx,.xls" className="sr-only"
                       onChange={(e) => choose(e.target.files?.[0])} />
                <Upload size={24} className="text-gray-400" />
                {file ? (
                  <>
                    <span className="text-sm font-medium text-gray-800 dark:text-slate-100">{file.name}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      {(file.size / 1024).toFixed(0)} kB — click to choose a different file
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                      Drop the filled-in sheet here, or click to choose
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">.xlsx, up to 5 MB, 500 people at a time</span>
                  </>
                )}
              </label>
            </>
          )}

          {stage === REVIEW && result && (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
                <CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Checked {result.total} row{result.total === 1 ? '' : 's'}.{' '}
                  <strong>{result.createdCount}</strong> ready to import
                  {result.failedCount > 0 && <>, <strong>{result.failedCount}</strong> will be skipped</>}.
                  Nothing has been created yet.
                </p>
              </div>
              {result.createdCount > 0 && <Ready rows={result.created} />}
              {result.failedCount > 0 && <Failures rows={result.failed} />}
            </>
          )}

          {stage === DONE && result && (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30">
                <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  Created <strong>{result.createdCount}</strong> user{result.createdCount === 1 ? '' : 's'}
                  {result.failedCount > 0 && <>, skipped <strong>{result.failedCount}</strong></>}.
                </p>
              </div>

              {result.createdCount > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                      Temporary passwords
                    </h4>
                    <div className="flex items-center gap-2">
                      <button onClick={copyPasswords}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700">
                        <Copy size={13} /> Copy
                      </button>
                      <button onClick={downloadPasswords}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                        <Download size={13} /> Download CSV
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mb-2 flex items-start gap-1.5">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    Save these now — they are not stored and cannot be shown again. Each one
                    must be changed at first sign-in.
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                    <table className="w-full min-w-[440px] text-sm">
                      <thead className="bg-gray-50 dark:bg-slate-900/40">
                        <tr className="text-[11px] text-gray-500 dark:text-slate-400">
                          <th className="text-left py-2 px-3 font-medium">Employee ID</th>
                          <th className="text-left py-2 px-3 font-medium">Email</th>
                          <th className="text-left py-2 px-3 font-medium">Temporary password</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.created.map((c) => (
                          <tr key={c.id} className="border-t border-gray-100 dark:border-slate-800">
                            <td className="py-2 px-3 text-gray-500 dark:text-slate-400">{c.employeeId}</td>
                            <td className="py-2 px-3 text-gray-800 dark:text-slate-100">{c.email}</td>
                            <td className="py-2 px-3 font-mono text-blue-700 dark:text-blue-300">{c.tempPassword}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.failedCount > 0 && <Failures rows={result.failed} />}
            </>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-4 sm:p-5 border-t border-gray-100 dark:border-slate-700">
          {stage === REVIEW && (
            <button onClick={() => setStage(CHECK)} disabled={busy}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50">
              <ArrowLeft size={15} /> Choose another file
            </button>
          )}

          {stage !== DONE && (
            <button onClick={close} disabled={busy}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50">
              Cancel
            </button>
          )}

          {stage === CHECK && (
            <button onClick={() => send(true)} disabled={!file || busy}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {busy ? <><Loader2 size={15} className="animate-spin" /> Checking…</> : 'Check the file'}
            </button>
          )}

          {stage === REVIEW && (
            <button onClick={() => send(false)} disabled={busy || !result?.createdCount}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {busy
                ? <><Loader2 size={15} className="animate-spin" /> Creating…</>
                : `Create ${result?.createdCount || 0} user${result?.createdCount === 1 ? '' : 's'}`}
            </button>
          )}

          {stage === DONE && (
            <button onClick={close}
                    className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportUsers;
