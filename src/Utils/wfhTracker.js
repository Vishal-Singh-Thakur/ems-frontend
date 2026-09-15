// Tracks "screen open" time on an auto-tracked work-from-home day.
//
// A browser cannot see the laptop lid. The closest signals available are:
//   • Page Visibility  — the EMS tab is showing. Goes hidden on lid close,
//     screen lock, sleep, minimise and tab switch. Works everywhere.
//   • Idle Detection   — Chrome/Edge, permission-gated. Reports the screen as
//     locked/unlocked and the user as active/idle, which is closer to what the
//     user means by "screen open". Used when available, ignored when not.
//
// The client never sends a duration. It just says "I'm here"; the server credits
// the gap between its own timestamps, so the total can't be inflated from here.

import ApiHit from "./ApiHit";
import { WfhHeartbeatAPI } from "../components/Constant/Api/Api";

const DEFAULT_INTERVAL_MS = 60_000;

// Optional and best-effort: a refused permission or an unsupported browser just
// leaves us on Page Visibility alone.
const startIdleDetection = async (onChange) => {
  if (typeof window === "undefined" || !("IdleDetector" in window)) return null;
  try {
    if ((await window.IdleDetector.requestPermission()) !== "granted") return null;

    const controller = new AbortController();
    const detector = new window.IdleDetector();
    detector.addEventListener("change", () => {
      onChange(detector.screenState === "unlocked" && detector.userState === "active");
    });
    await detector.start({ threshold: 60_000, signal: controller.signal });
    return () => controller.abort();
  } catch {
    return null; // permission dismissed, insecure context, etc.
  }
};

/**
 * Starts tracking. Returns a stop() that cleans up every listener and timer.
 *
 * @param {(state: {activeSeconds:number, live:boolean}) => void} onUpdate
 *        Called after each successful heartbeat and on every visibility change.
 * @param {(err: {code?:string, message?:string}) => void} [onError]
 *        Called when the server says today is no longer tracked.
 */
export const startWfhTracking = (onUpdate, onError) => {
  let stopped = false;
  let timer = null;
  let stopIdle = null;
  let screenAwake = true; // only set false by Idle Detection, when available
  let inFlight = false;

  const isLive = () => !stopped && document.visibilityState === "visible" && screenAwake;

  const beat = async () => {
    if (!isLive() || inFlight) return;
    inFlight = true;
    try {
      const r = await ApiHit(WfhHeartbeatAPI, "POST", {});
      if (stopped) return;
      if (r?.success) {
        onUpdate({ activeSeconds: r.data.activeSeconds, live: true });
      } else {
        // The day stopped being tracked (leave revoked, date rolled over).
        onError?.({ code: r?.code, message: r?.message });
        stop();
      }
    } catch {
      /* transient network error — the next beat will catch up */
    } finally {
      inFlight = false;
    }
  };

  const onVisibility = () => {
    onUpdate({ live: isLive() });
    if (isLive()) beat(); // credit the moment the screen comes back
  };

  const onIdleChange = (awake) => {
    screenAwake = awake;
    onVisibility();
  };

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("focus", onVisibility);
  window.addEventListener("blur", onVisibility);

  startIdleDetection(onIdleChange).then((cleanup) => {
    if (stopped) cleanup?.();
    else stopIdle = cleanup;
  });

  beat();
  timer = setInterval(beat, DEFAULT_INTERVAL_MS);

  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("focus", onVisibility);
    window.removeEventListener("blur", onVisibility);
    stopIdle?.();
  }

  return stop;
};

export const formatDuration = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};
