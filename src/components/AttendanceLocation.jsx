import React from "react";
import { MapPin } from "lucide-react";

// Where a clock-in / clock-out happened. Coordinates are stored per punch, so
// a row can show one, both or neither.

const mapsUrl = (loc) =>
  `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;

const coords = (loc) => `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;

const tooltip = (label, loc) => {
  const parts = [`${label}: ${loc.latitude}, ${loc.longitude}`];
  if (Number.isFinite(loc.accuracy)) parts.push(`Accuracy: ±${Math.round(loc.accuracy)}m`);
  if (loc.capturedAt) parts.push(`Captured: ${new Date(loc.capturedAt).toLocaleString('en-GB')}`);
  return parts.join('\n');
};

const Pin = ({ label, loc, tone }) => (
  <a
    href={mapsUrl(loc)}
    target="_blank"
    rel="noopener noreferrer"
    title={`${tooltip(label, loc)}\n\nClick to open in Google Maps`}
    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border transition hover:opacity-80 ${tone}`}
  >
    <MapPin size={10} />
    <span className="font-medium">{label}</span>
    <span className="font-mono font-normal">{coords(loc)}</span>
  </a>
);

const AttendanceLocation = ({ checkInLocation, checkOutLocation }) => {
  if (!checkInLocation && !checkOutLocation) {
    return <span className="text-gray-400 dark:text-slate-500">—</span>;
  }

  return (
    <div className="flex flex-col gap-1 items-start">
      {checkInLocation && (
        <Pin
          label="In"
          loc={checkInLocation}
          tone="bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
        />
      )}
      {checkOutLocation && (
        <Pin
          label="Out"
          loc={checkOutLocation}
          tone="bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
        />
      )}
    </div>
  );
};

export default AttendanceLocation;
