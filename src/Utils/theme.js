// Theme handling. Tailwind runs in `darkMode: 'class'`, so everything hinges on
// whether `dark` is present on <html>.
//
// The chosen theme is mirrored into localStorage so the very first paint after a
// reload is already correct — waiting for /api/auth/me would flash a white screen.

const STORAGE_KEY = 'ems-theme';
const VALID = ['light', 'dark', 'auto'];

const prefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export const getStoredTheme = () => {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    return VALID.includes(t) ? t : 'light';
  } catch {
    return 'light';
  }
};

// Turns 'auto' into the concrete theme the OS is asking for.
export const resolveTheme = (theme) => (theme === 'auto' ? (prefersDark() ? 'dark' : 'light') : theme);

export const applyTheme = (theme) => {
  const chosen = VALID.includes(theme) ? theme : 'light';
  const root = document.documentElement;

  root.classList.toggle('dark', resolveTheme(chosen) === 'dark');
  // Keeps native form controls, scrollbars and overscroll matching the theme.
  root.style.colorScheme = resolveTheme(chosen);
  root.dataset.theme = chosen;

  try {
    localStorage.setItem(STORAGE_KEY, chosen);
  } catch { /* private mode — the class is still applied */ }

  return chosen;
};

// While on 'auto', follow the OS as it flips. Returns an unsubscribe function.
export const watchSystemTheme = () => {
  if (!window.matchMedia) return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (document.documentElement.dataset.theme === 'auto') applyTheme('auto');
  };
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

// Called once before React mounts, so there is no flash of the wrong theme.
export const initTheme = () => applyTheme(getStoredTheme());
