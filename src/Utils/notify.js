import { toast } from 'react-toastify';

// One place for transient feedback, so pages do not each decide how to tell
// someone what happened.
//
// It replaces window.alert(), which blocks the page until it is dismissed and
// looks nothing like the rest of the application. Inline field errors stay where
// they are — a message about one input belongs next to that input, not floating
// in a corner.

const base = {
  position: 'top-right',
  autoClose: 4000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
};

/** Something worked. Short-lived: nobody needs to read "Saved" twice. */
export const notifyOk = (message, options = {}) =>
  toast.success(message, { ...base, autoClose: 2500, ...options });

/**
 * Something did not work. Left on screen longer than a success, because the
 * reader has to act on it rather than just notice it.
 */
export const notifyError = (message, options = {}) =>
  toast.error(message || 'Something went wrong. Please try again.',
    { ...base, autoClose: 6000, ...options });

export const notifyInfo = (message, options = {}) => toast.info(message, { ...base, ...options });
export const notifyWarn = (message, options = {}) => toast.warn(message, { ...base, ...options });

/**
 * Reports an API response without each caller writing the same branch.
 * Returns whether it succeeded, so it reads naturally inside an if.
 */
export const notifyResult = (response, okMessage) => {
  if (response?.success) {
    if (okMessage) notifyOk(okMessage);
    return true;
  }
  notifyError(response?.message);
  return false;
};
