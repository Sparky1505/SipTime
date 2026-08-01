import type { ReminderSettings } from "../shared/types";

type QuietHoursSettings = Pick<
  ReminderSettings,
  "quietHoursEnabled" | "quietStart" | "quietEnd"
>;

export function getNextFixedDate(
  now: Date,
  times: string[]
): Date | null {
  const candidates: Date[] = [];

  for (const time of times) {
    const parts = time.split(":");

    if (parts.length !== 2) {
      continue;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      continue;
    }

    const candidate = new Date(now);

    candidate.setSeconds(0, 0);
    candidate.setHours(hours, minutes, 0, 0);

    if (candidate.getTime() <= now.getTime()) {
      candidate.setDate(candidate.getDate() + 1);
    }

    candidates.push(candidate);
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort(
    (first, second) =>
      first.getTime() - second.getTime()
  );

  return candidates[0];
}

export function isInQuietHours(
  settings: QuietHoursSettings,
  now: Date = new Date()
): boolean {
  if (!settings.quietHoursEnabled) {
    return false;
  }

  const [startHour, startMinute] =
    settings.quietStart.split(":").map(Number);

  const [endHour, endMinute] =
    settings.quietEnd.split(":").map(Number);

  if (
    [
      startHour,
      startMinute,
      endHour,
      endMinute
    ].some((value) => Number.isNaN(value))
  ) {
    return false;
  }

  const startMinutes =
    startHour * 60 + startMinute;

  const endMinutes =
    endHour * 60 + endMinute;

  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  if (startMinutes <= endMinutes) {
    return (
      currentMinutes >= startMinutes &&
      currentMinutes < endMinutes
    );
  }

  return (
    currentMinutes >= startMinutes ||
    currentMinutes < endMinutes
  );
}