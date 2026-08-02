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
export function createPauseUntil(
  nowMs: number,
  durationMinutes: number
): number {
  const safeDuration = Math.max(
    1,
    durationMinutes
  );

  return (
    nowMs +
    safeDuration * 60_000
  );
}

export function isPauseActive(
  pauseUntil: number | null,
  nowMs: number = Date.now()
): boolean {
  return (
    typeof pauseUntil === "number" &&
    pauseUntil > nowMs
  );
}

export function getTomorrowResumeDate(
  now: Date,
  resumeTime: string = "08:00"
): Date {
  const [parsedHours, parsedMinutes] =
    resumeTime.split(":").map(Number);

  const hours =
    Number.isInteger(parsedHours) &&
    parsedHours >= 0 &&
    parsedHours <= 23
      ? parsedHours
      : 8;

  const minutes =
    Number.isInteger(parsedMinutes) &&
    parsedMinutes >= 0 &&
    parsedMinutes <= 59
      ? parsedMinutes
      : 0;

  const result = new Date(now);

  result.setDate(result.getDate() + 1);
  result.setHours(
    hours,
    minutes,
    0,
    0
  );

  return result;
}

export function getIntervalDateAfterSkip(
  nowMs: number,
  currentNextFireAt: number | null,
  intervalMinutes: number
): number {
  const safeIntervalMinutes =
    Number.isFinite(intervalMinutes)
      ? Math.max(
          1,
          intervalMinutes
        )
      : 1;

  const skippedReminder =
    typeof currentNextFireAt ===
      "number" &&
    currentNextFireAt > nowMs
      ? currentNextFireAt
      : nowMs;

  return (
    skippedReminder +
    safeIntervalMinutes * 60_000
  );
}

export function getFixedDateAfterSkip(
  now: Date,
  times: string[]
): Date | null {
  const skippedReminder =
    getNextFixedDate(
      now,
      times
    );

  if (!skippedReminder) {
    return null;
  }

  const afterSkippedReminder =
    new Date(
      skippedReminder.getTime() + 1
    );

  return getNextFixedDate(
    afterSkippedReminder,
    times
  );
}
