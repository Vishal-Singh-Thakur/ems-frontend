import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// The toast container, mounted once.
//
// Its theme has to follow the app's, and the app's can change while it is open —
// from the settings screen, or from the system when the theme is set to `auto`.
// Reading the class once at mount would leave toasts in the old palette until a
// reload, so this watches the attribute that Tailwind's class-based dark mode
// already depends on.

const isDark = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

const Toasts = () => {
  const [dark, setDark] = useState(isDark);

  useEffect(() => {
    const observer = new MutationObserver(() => setDark(isDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <ToastContainer
      position="top-right"
      theme={dark ? 'dark' : 'light'}
      newestOnTop
      // Stacked failures usually share one cause; a screenful of them buries the
      // first, which is the one worth reading.
      limit={3}
      closeOnClick
      pauseOnFocusLoss
      draggable
      // Above the assistant launcher and the mobile bottom nav, both of which
      // sit in the same corner.
      style={{ zIndex: 9999 }}
    />
  );
};

export default Toasts;
