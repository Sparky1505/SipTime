import type { ReminderSettings } from "./types";

const SETTINGS_KEY = "waterReminderSettings";
const NEXT_FIRE_KEY = "waterReminderNextFireAt";
const PAUSE_UNTIL_KEY = "waterReminderPauseUntil";

export const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  reminderType: "INTERVAL",
  intervalMinutes: 45,
  fixedTimes: ["10:00", "12:30", "15:00"],
  quietHoursEnabled: true,
  quietStart: "23:30",
  quietEnd: "08:00",
  snoozeMinutes: 10
};

export async function getSettings(): Promise<ReminderSettings> {
  const result = await chrome.storage.sync.get(
    SETTINGS_KEY
  );

  return (
    result[SETTINGS_KEY] as ReminderSettings
  ) ?? DEFAULT_SETTINGS;
}

export async function saveSettings(
  settings: ReminderSettings
): Promise<void> {
  await chrome.storage.sync.set({
    [SETTINGS_KEY]: settings
  });
}

export async function setNextFireAt(
  epochMs: number | null
): Promise<void> {
  if (epochMs === null) {
    await chrome.storage.sync.remove(
      NEXT_FIRE_KEY
    );

    return;
  }

  await chrome.storage.sync.set({
    [NEXT_FIRE_KEY]: epochMs
  });
}

export async function getNextFireAt(): Promise<number | null> {
  const result = await chrome.storage.sync.get(
    NEXT_FIRE_KEY
  );

  const value = result[NEXT_FIRE_KEY];

  return typeof value === "number"
    ? value
    : null;
}

export async function setPauseUntil(
  epochMs: number | null
): Promise<void> {
  if (epochMs === null) {
    await chrome.storage.local.remove(
      PAUSE_UNTIL_KEY
    );

    return;
  }

  await chrome.storage.local.set({
    [PAUSE_UNTIL_KEY]: epochMs
  });
}

export async function getPauseUntil(): Promise<number | null> {
  const result = await chrome.storage.local.get(
    PAUSE_UNTIL_KEY
  );

  const value = result[PAUSE_UNTIL_KEY];

  return typeof value === "number"
    ? value
    : null;
}