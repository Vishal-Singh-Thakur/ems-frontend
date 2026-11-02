// Asking the reader to confirm something.
//
// This is the caller-facing half; the dialog that draws it is
// components/ConfirmDialog.jsx. They are split for the same reason notify.js and
// Toasts.jsx are: a module that exports both a component and a plain function
// breaks React Fast Refresh, and the pages only ever want the function.
//
// It replaces window.confirm(), which is browser chrome: it ignores the theme,
// blocks the page, and — after a few in a row — Chrome offers the reader a
// "prevent this page from creating additional dialogs" checkbox. Once that is
// ticked window.confirm() returns false forever, so every later delete silently
// does nothing, invisibly to the code that called it.
//
// The API is a promise rather than a hook so a call site changes by one line:
//
//   if (!window.confirm('Delete this?')) return;
//   if (!(await confirm('Delete this?'))) return;

let openDialog = null;

/** The host installs itself here when it mounts. */
export const _registerConfirmHost = (fn) => { openDialog = fn; };

// Destructive wording gets a red button and a warning icon without being told,
// and the button says what it will do rather than a generic "OK". The label
// follows the verb in the question, because a dialog asking "Cancel onboarding
// for Amit?" over a button reading "Delete" describes the wrong action.
//
// `cancel` and `withdraw` map to a neutral label on purpose: a confirm button
// reading "Cancel" next to a dismiss button reading "Cancel" is a trap.
const DESTRUCTIVE_LABELS = {
  delete: 'Delete',
  remove: 'Remove',
  revoke: 'Revoke',
  cleanup: 'Clean up',
  discard: 'Discard',
  terminate: 'Terminate',
  cancel: 'Yes, continue',
  withdraw: 'Yes, continue'
};
const DESTRUCTIVE = new RegExp(`\\b(${Object.keys(DESTRUCTIVE_LABELS).join('|')})\\b`, 'i');

/**
 * Asks, and resolves true only if the reader confirms.
 * Accepts a string, or { message, title, confirmLabel, cancelLabel, tone }.
 */
export const confirm = (options) => {
  const o = typeof options === 'string' ? { message: options } : (options || {});
  const verb = (o.message || '').match(DESTRUCTIVE)?.[1]?.toLowerCase();
  const tone = o.tone || (verb ? 'danger' : 'default');

  // If the host has not mounted, fall back rather than hang forever on a promise
  // nobody is left to resolve.
  if (!openDialog) return Promise.resolve(window.confirm(o.message));

  return new Promise((resolve) => {
    openDialog({
      title: o.title || (tone === 'danger' ? 'Are you sure?' : 'Please confirm'),
      message: o.message || '',
      confirmLabel: o.confirmLabel || (verb ? DESTRUCTIVE_LABELS[verb] : 'Confirm'),
      cancelLabel: o.cancelLabel || 'Cancel',
      tone,
      resolve
    });
  });
};
