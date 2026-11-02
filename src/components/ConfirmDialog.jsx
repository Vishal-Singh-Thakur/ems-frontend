import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoAlertCircleOutline, IoHelpCircleOutline } from 'react-icons/io5';
import { _registerConfirmHost } from '../Utils/confirm';

// The dialog itself. The confirm() call that opens it lives in Utils/confirm.js —
// see there for why the two are split.

/** Mounted once, next to the toast container. */
export const ConfirmHost = () => {
  const [state, setState] = useState(null);
  const cancelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    _registerConfirmHost(setState);
    return () => _registerConfirmHost(null);
  }, []);

  const close = useCallback((answer) => {
    setState((current) => {
      if (current) current.resolve(answer);
      return null;
    });
    // Back to whatever the reader was on, so the page does not lose its place.
    previouslyFocused.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!state) return;
    previouslyFocused.current = document.activeElement;
    // Cancel takes focus, not confirm — a stray Enter should not delete anything.
    cancelRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
    };
    document.addEventListener('keydown', onKey);

    // The page behind must not scroll while this is open.
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [state, close]);

  if (!state) return null;

  const danger = state.tone === 'danger';
  const Icon = danger ? IoAlertCircleOutline : IoHelpCircleOutline;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(false); }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 p-5 sm:p-6"
      >
        <div className="flex gap-4">
          <div className={`shrink-0 rounded-full p-2.5 h-fit ${
            danger ? 'bg-red-100 dark:bg-red-500/15' : 'bg-blue-100 dark:bg-blue-500/15'
          }`}>
            <Icon className={`h-6 w-6 ${danger ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
          </div>
          <div className="min-w-0">
            <h3 id="confirm-title" className="font-semibold text-gray-900 dark:text-slate-100">
              {state.title}
            </h3>
            <p id="confirm-message" className="mt-1 text-sm text-gray-600 dark:text-slate-300 break-words">
              {state.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={() => close(false)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 dark:focus:ring-offset-slate-800 transition"
          >
            {state.cancelLabel}
          </button>
          <button
            onClick={() => close(true)}
            className={`px-4 py-2 text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-800 transition ${
              danger
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmHost;
