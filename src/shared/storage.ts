import type { ReminderSettings } from "./types";

const SETTINGS_KEY = "waterReminderSettings";
const NEXT_FIRE_KEY = "waterReminderNextFireAt"; // number (epoch ms)

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
  const result = await chrome.storage.sync.get(SETTINGS_KEY);
  return (result[SETTINGS_KEY] as ReminderSettings) ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: ReminderSettings): Promise<void> {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
}

export async function setNextFireAt(epochMs: number | null): Promise<void> {
  if (epochMs === null) {
    await chrome.storage.sync.remove(NEXT_FIRE_KEY);
    return;
  }
  await chrome.storage.sync.set({ [NEXT_FIRE_KEY]: epochMs });
}

export async function getNextFireAt(): Promise<number | null> {
  const result = await chrome.storage.sync.get(NEXT_FIRE_KEY);
  const v = result[NEXT_FIRE_KEY];
  return typeof v === "number" ? v : null;
}
