import {
  getNextFixedDate,
  isInQuietHours,
  isPauseActive
} from "./scheduling";
import {
  getPauseUntil,
  getSettings,
  setNextFireAt,
  setOnboardingCompleted,
  setPauseUntil
} from "../shared/storage";

import type { ReminderSettings } from "../shared/types";

import {
  shouldStartOnboarding
} from "../shared/onboarding";


const ALARM_MAIN = "WATER_MAIN";
const ALARM_SNOOZE = "WATER_SNOOZE";
const ALARM_RESUME = "WATER_RESUME";

const NOTIFICATION_ID = "WATER_NOTIFICATION";
const PAUSE_STORAGE_KEY = "waterReminderPauseUntil";

chrome.runtime.onInstalled.addListener(
  async (details) => {
    const startOnboarding =
      shouldStartOnboarding(
        details.reason
      );

    if (startOnboarding) {
      await setOnboardingCompleted(
        false
      );
    }

    await rescheduleAll();

    if (startOnboarding) {
      await chrome.runtime.openOptionsPage();
    }
  }
);

chrome.runtime.onStartup.addListener(async () => {
  await rescheduleAll();
});

chrome.storage.onChanged.addListener(
  async (changes, areaName) => {
    if (
      areaName === "sync" &&
      changes.waterReminderSettings
    ) {
      await rescheduleAll();
      return;
    }

    if (
      areaName === "local" &&
      changes[PAUSE_STORAGE_KEY]
    ) {
      await chrome.notifications.clear(
        NOTIFICATION_ID
      );

      await rescheduleAll();
    }
  }
);

chrome.alarms.onAlarm.addListener(
  async (alarm) => {
    if (alarm.name === ALARM_RESUME) {
      await setPauseUntil(null);
      return;
    }

    if (
      alarm.name !== ALARM_MAIN &&
      alarm.name !== ALARM_SNOOZE
    ) {
      return;
    }

    const settings = await getSettings();

    if (!settings.enabled) {
      return;
    }

    const pauseUntil = await getPauseUntil();

    if (isPauseActive(pauseUntil)) {
      await schedulePauseResume(
        pauseUntil as number
      );

      return;
    }
    if (pauseUntil !== null) {
      await setPauseUntil(null);
    }

    if (settings.reminderType === "INTERVAL") {
      const intervalMinutes = Math.max(
        1,
        settings.intervalMinutes
      );

      const nextReminder =
        Date.now() +
        intervalMinutes * 60_000;

      await setNextFireAt(nextReminder);
    }

    if (isInQuietHours(settings)) {
      if (
        settings.reminderType === "FIXED_TIMES" &&
        alarm.name === ALARM_MAIN
      ) {
        await scheduleNextFixedTime(settings);
      }

      return;
    }

    await showReminderNotification(settings);

    if (
      settings.reminderType === "FIXED_TIMES" &&
      alarm.name === ALARM_MAIN
    ) {
      await scheduleNextFixedTime(settings);
    }
  }
);

chrome.notifications.onButtonClicked.addListener(
  async (notificationId, buttonIndex) => {
    if (notificationId !== NOTIFICATION_ID) {
      return;
    }

    const settings = await getSettings();

    if (buttonIndex === 0) {
      await chrome.notifications.clear(
        NOTIFICATION_ID
      );

      return;
    }

    if (buttonIndex === 1) {
      const snoozeMinutes = Math.max(
        1,
        settings.snoozeMinutes
      );

      await chrome.notifications.clear(
        NOTIFICATION_ID
      );

      await chrome.alarms.clear(ALARM_SNOOZE);

      await chrome.alarms.create(
        ALARM_SNOOZE,
        {
          delayInMinutes: snoozeMinutes
        }
      );

      await setNextFireAt(
        Date.now() +
          snoozeMinutes * 60_000
      );
    }
  }
);

async function rescheduleAll(): Promise<void> {
  await chrome.alarms.clearAll();

  const settings = await getSettings();

  if (!settings.enabled) {
    await setNextFireAt(null);
    return;
  }

  const pauseUntil = await getPauseUntil();

  if (isPauseActive(pauseUntil)) {
    await schedulePauseResume(
      pauseUntil as number
    );

    return;
  }

  /*
   * An expired pause can remain in storage when the
   * browser was closed when it should have resumed.
   * Removing it triggers one clean rescheduling pass
   * through the storage change listener.
   */
  if (pauseUntil !== null) {
    await setPauseUntil(null);
    return;
  }

  if (settings.reminderType === "INTERVAL") {
    const periodMinutes = Math.max(
      1,
      settings.intervalMinutes
    );

    await chrome.alarms.create(
      ALARM_MAIN,
      {
        delayInMinutes: 1,
        periodInMinutes: periodMinutes
      }
    );

    await setNextFireAt(
      Date.now() + 60_000
    );

    return;
  }

  await scheduleNextFixedTime(settings);
}

async function schedulePauseResume(
  pauseUntil: number
): Promise<void> {
  await chrome.notifications.clear(
    NOTIFICATION_ID
  );

  await chrome.alarms.create(
    ALARM_RESUME,
    {
      when: pauseUntil
    }
  );

  await setNextFireAt(pauseUntil);
}

async function scheduleNextFixedTime(
  settings: ReminderSettings
): Promise<void> {
  const nextReminder = getNextFixedDate(
    new Date(),
    settings.fixedTimes
  );

  if (!nextReminder) {
    await setNextFireAt(null);
    return;
  }

  await chrome.alarms.create(
    ALARM_MAIN,
    {
      when: nextReminder.getTime()
    }
  );

  await setNextFireAt(
    nextReminder.getTime()
  );
}

async function showReminderNotification(
  settings: ReminderSettings
): Promise<void> {
  await chrome.notifications.clear(
    NOTIFICATION_ID
  );

  await chrome.notifications.create(
    NOTIFICATION_ID,
    {
      type: "basic",
      iconUrl: chrome.runtime.getURL(
        "icon.png"
      ),
      title: "Time to drink water",
      message: "Take a few sips now.",
      buttons: [
        {
          title: "Done"
        },
        {
          title: `Snooze ${settings.snoozeMinutes}m`
        }
      ],
      priority: 2,
      requireInteraction: false
    }
  );
}