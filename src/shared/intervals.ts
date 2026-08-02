export const INTERVAL_PRESETS = [
  30,
  45,
  60,
  90
] as const;

export function isIntervalPreset(
  minutes: number
): boolean {
  return INTERVAL_PRESETS.some(
    (preset) => preset === minutes
  );
}

export function formatIntervalDuration(
  minutes: number
): string {
  if (!Number.isFinite(minutes)) {
    return "Invalid interval";
  }

  const roundedMinutes = Math.max(
    1,
    Math.round(minutes)
  );

  if (roundedMinutes < 60) {
    return `${roundedMinutes} ${
      roundedMinutes === 1
        ? "minute"
        : "minutes"
    }`;
  }

  const hours = Math.floor(
    roundedMinutes / 60
  );

  const remainingMinutes =
    roundedMinutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    }`;
  }

  return `${hours} ${
    hours === 1
      ? "hour"
      : "hours"
  } ${remainingMinutes} ${
    remainingMinutes === 1
      ? "minute"
      : "minutes"
  }`;
}

export function formatIntervalPresetLabel(
  minutes: number
): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  const remainingMinutes =
    minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}