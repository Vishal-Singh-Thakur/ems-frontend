// Shared clock-in/out location capture.
//
// getCurrentPosition has no default timeout — indoors or with a weak GPS fix it
// can hang indefinitely, and the attendance screens block clocking in until
// either a position or an error arrives. The explicit timeout guarantees one of
// the two callbacks fires, so the button never stays stuck.

const OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,     // give up after 10s rather than hanging forever
  maximumAge: 60000   // a fix from the last minute is good enough for a punch
};

const MESSAGES = {
  1: 'Location access denied',
  2: 'Location unavailable',
  3: 'Location timed out'
};

// Calls onSuccess({ latitude, longitude, accuracy }) or onError(message).
export const requestLocation = (onSuccess, onError) => {
  if (!navigator.geolocation) {
    onError('Geolocation not supported');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      onSuccess({
        latitude,
        longitude,
        ...(Number.isFinite(accuracy) ? { accuracy: Math.round(accuracy) } : {})
      });
    },
    (error) => {
      onError(MESSAGES[error?.code] || 'Could not get location');
    },
    OPTIONS
  );
};
