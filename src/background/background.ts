import { getSettings, setNextFireAt } from "../shared/storage";
import type { ReminderSettings } from "../shared/types";

const ALARM_MAIN = "WATER_MAIN";
const ALARM_SNOOZE = "WATER_SNOOZE";

const NOTIF_ID = "WATER_NOTIFICATION";

chrome.runtime.onInstalled.addListener(async () => {
  await rescheduleAll();
});

chrome.runtime.onStartup.addListener(async () => {
  await rescheduleAll();
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "sync") return;
  if (changes.waterReminderSettings) {
    await rescheduleAll();
  }
});
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_MAIN && alarm.name !== ALARM_SNOOZE) return;

  const settings = await getSettings();
  if (!settings.enabled) return;

  // Update NEXT reminder time immediately
  if (settings.reminderType === "INTERVAL") {
    const next = Date.now() + Math.max(1, settings.intervalMinutes) * 60_000;
    await setNextFireAt(next);
  }

  if (isInQuietHours(settings)) {
    if (settings.reminderType === "FIXED_TIMES" && alarm.name === ALARM_MAIN) {
      await scheduleNextFixedTime(settings);
    }
    return;
  }

  await showReminderNotification(settings);

  if (settings.reminderType === "FIXED_TIMES" && alarm.name === ALARM_MAIN) {
    await scheduleNextFixedTime(settings);
  }
});


chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId !== NOTIF_ID) return;

  const settings = await getSettings();

  // 0 = Done
  if (buttonIndex === 0) {
    await chrome.notifications.clear(NOTIF_ID);
    return;
  }

  // 1 = Snooze
  if (buttonIndex === 1) {
    await chrome.notifications.clear(NOTIF_ID);
    await chrome.alarms.clear(ALARM_SNOOZE);
    await chrome.alarms.create(ALARM_SNOOZE, { delayInMinutes: Math.max(1, settings.snoozeMinutes) });
    await setNextFireAt(Date.now() + Math.max(1, settings.snoozeMinutes) * 60_000);
  }
});

async function rescheduleAll(): Promise<void> {
  await chrome.alarms.clearAll();

  const settings = await getSettings();
  if (!settings.enabled) {
    await setNextFireAt(null);
    return;
  }

  if (settings.reminderType === "INTERVAL") {
    const period = Math.max(1, settings.intervalMinutes);
    await chrome.alarms.create(ALARM_MAIN, { delayInMinutes: 1, periodInMinutes: period });
    await setNextFireAt(Date.now() + 60_000);
    return;
  }

  await scheduleNextFixedTime(settings);
}

async function scheduleNextFixedTime(settings: ReminderSettings): Promise<void> {
  const now = new Date();
  const next = getNextFixedDate(now, settings.fixedTimes);

  if (!next) {
    await setNextFireAt(null);
    return;
  }

  await chrome.alarms.create(ALARM_MAIN, { when: next.getTime() });
  await setNextFireAt(next.getTime());
}

function getNextFixedDate(now: Date, times: string[]): Date | null {
  const candidates: Date[] = [];

  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    const parts = t.split(":");
    if (parts.length !== 2) continue;

    const hh = Number(parts[0]);
    const mm = Number(parts[1]);
    if (Number.isNaN(hh) || Number.isNaN(mm)) continue;

    const d = new Date(now);
    d.setSeconds(0, 0);
    d.setHours(hh, mm, 0, 0);

    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
    candidates.push(d);
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
}

function isInQuietHours(settings: ReminderSettings): boolean {
  if (!settings.quietHoursEnabled) return false;

  const [sh, sm] = settings.quietStart.split(":").map(Number);
  const [eh, em] = settings.quietEnd.split(":").map(Number);
  if ([sh, sm, eh, em].some((v) => Number.isNaN(v))) return false;

  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  // Wrap over midnight supported
  if (start <= end) return minutesNow >= start && minutesNow < end;
  return minutesNow >= start || minutesNow < end;
}

async function showReminderNotification(settings: ReminderSettings): Promise<void> {
  // Clear any existing notification with same ID to avoid stacking/silencing
  await chrome.notifications.clear(NOTIF_ID);

  await chrome.notifications.create(NOTIF_ID, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icon.png"),
    title: "Time to drink water",
    message: "Take a few sips now.",
    buttons: [{ title: "Done" }, { title: `Snooze ${settings.snoozeMinutes}m` }],
    priority: 2,
    requireInteraction: false
  });
}

