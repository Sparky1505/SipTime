import { useEffect, useState } from "react";
import {
  createPauseUntil,
  getTomorrowResumeDate,
  isPauseActive
} from "../background/scheduling";
import {
  getNextFireAt,
  getPauseUntil,
  getSettings,
  saveSettings,
  setPauseUntil
} from "../shared/storage";
import type { ReminderSettings } from "../shared/types";

import {
  SKIP_NEXT_REMINDER_MESSAGE
} from "../shared/messages";

import type {
  SkipNextReminderResponse
} from "../shared/messages";

function LogoIcon(props: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      alt={props.alt ?? ""}
      className={props.className}
      src={chrome.runtime.getURL("icon.png")}
    />
  );
}

function ClockIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 7.5v5l3.25 1.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M19.3 15.2A8 8 0 0 1 8.8 4.7 8 8 0 1 0 19.3 15.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m19.2 13.2 1.15 1.1-1.8 3.1-1.55-.45a7.7 7.7 0 0 1-1.8 1.05l-.4 1.55h-3.6L10.8 18A7.7 7.7 0 0 1 9 16.95l-1.55.45-1.8-3.1 1.15-1.1a7.1 7.1 0 0 1 0-2.4L5.65 9.7l1.8-3.1L9 7.05A7.7 7.7 0 0 1 10.8 6l.4-1.55h3.6L15.2 6A7.7 7.7 0 0 1 17 7.05l1.55-.45 1.8 3.1-1.15 1.1a7.1 7.1 0 0 1 0 2.4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M19 8a8 8 0 1 0 .6 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />

      <path
        d="M19 4v4h-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m6.5 7 7 5-7 5V7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />

      <path
        d="M17 7v10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Toggle(props: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      aria-label={
        props.checked
          ? "Disable reminders"
          : "Enable reminders"
      }
      aria-pressed={props.checked}
      className="water-switch"
      data-checked={props.checked}
      disabled={props.disabled}
      onClick={props.onChange}
      type="button"
    >
      <span className="water-switch-knob" />
    </button>
  );
}

function formatClock(
  epochMs: number | null
): string {
  if (!epochMs) {
    return "Not scheduled";
  }

  return new Date(epochMs).toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

function getCountdown(
  nextFireAt: number | null,
  now: number
): {
  value: string;
  label: string;
} {
  if (!nextFireAt) {
    return {
      value: "—",
      label: "scheduling"
    };
  }

  const difference = nextFireAt - now;

  if (difference <= 0) {
    return {
      value: "Now",
      label: "time to hydrate"
    };
  }

  const totalMinutes = Math.ceil(
    difference / 60_000
  );

  if (totalMinutes >= 60) {
    const hours = Math.floor(
      totalMinutes / 60
    );

    const minutes =
      totalMinutes % 60;

    return {
      value: `${hours}:${String(
        minutes
      ).padStart(2, "0")}`,
      label: "hours"
    };
  }

  return {
    value: String(totalMinutes),
    label:
      totalMinutes === 1
        ? "minute"
        : "minutes"
  };
}
function isInQuietHours(
  settings: ReminderSettings,
  currentDate: Date
): boolean {
  if (!settings.quietHoursEnabled) {
    return false;
  }

  const [startHour, startMinute] =
    settings.quietStart
      .split(":")
      .map(Number);

  const [endHour, endMinute] =
    settings.quietEnd
      .split(":")
      .map(Number);

  if (
    [
      startHour,
      startMinute,
      endHour,
      endMinute
    ].some(Number.isNaN)
  ) {
    return false;
  }

  const start =
    startHour * 60 + startMinute;

  const end =
    endHour * 60 + endMinute;

  const current =
    currentDate.getHours() * 60 +
    currentDate.getMinutes();

  if (start <= end) {
    return (
      current >= start &&
      current < end
    );
  }

  return (
    current >= start ||
    current < end
  );
}

function formatStoredTime(
  value: string
): string {
  const [hours, minutes] =
    value.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return value;
  }

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return date.toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

export default function PopupApp() {
  const [settings, setSettings] =
    useState<ReminderSettings | null>(
      null
    );

  const [
    nextFireAt,
    setNextFireAt
  ] = useState<number | null>(null);

  const [
    pauseUntil,
    setPauseUntilValue
  ] = useState<number | null>(null);

  const [now, setNow] =
    useState(Date.now());

  const [
    isUpdating,
    setIsUpdating
  ] = useState(false);

  const [
  isSkipping,
  setIsSkipping
] = useState(false);

const [
  skipConfirmed,
  setSkipConfirmed
] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function load() {
    setError(null);

    try {
      const [
        storedSettings,
        storedNextFireAt,
        storedPauseUntil
      ] = await Promise.all([
        getSettings(),
        getNextFireAt(),
        getPauseUntil()
      ]);

      setSettings(storedSettings);
      setNextFireAt(
        storedNextFireAt
      );
      setPauseUntilValue(
        storedPauseUntil
      );
      setNow(Date.now());
    } catch (
      loadError: unknown
    ) {
      console.error(
        "Failed to refresh SipTime popup:",
        loadError
      );

      setError(
        "Unable to refresh reminder information."
      );
    }
  }

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      getSettings(),
      getNextFireAt(),
      getPauseUntil()
    ])
      .then(
        ([
          storedSettings,
          storedNextFireAt,
          storedPauseUntil
        ]) => {
          if (!isMounted) {
            return;
          }

          setSettings(
            storedSettings
          );

          setNextFireAt(
            storedNextFireAt
          );

          setPauseUntilValue(
            storedPauseUntil
          );
        }
      )
      .catch(
        (
          loadError: unknown
        ) => {
          console.error(
            "Failed to load SipTime popup state:",
            loadError
          );

          if (isMounted) {
            setError(
              "Unable to load reminder information."
            );
          }
        }
      );

    const handler: Parameters<
      typeof chrome.storage.onChanged.addListener
    >[0] = (
      changes,
      area
    ) => {
      if (area === "sync") {
        if (
          changes.waterReminderSettings
        ) {
          const value =
            changes
              .waterReminderSettings
              .newValue;

          if (value) {
            setSettings(
              value as ReminderSettings
            );
          }
        }

        if (
          changes.waterReminderNextFireAt
        ) {
          const value =
            changes
              .waterReminderNextFireAt
              .newValue;

          setNextFireAt(
            typeof value === "number"
              ? value
              : null
          );
        }
      }

      if (
        area === "local" &&
        changes
          .waterReminderPauseUntil
      ) {
        const value =
          changes
            .waterReminderPauseUntil
            .newValue;

        setPauseUntilValue(
          typeof value === "number"
            ? value
            : null
        );
      }
    };

    chrome.storage.onChanged.addListener(
      handler
    );

    return () => {
      isMounted = false;

      chrome.storage.onChanged.removeListener(
        handler
      );
    };
  }, []);

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setNow(Date.now());
      }, 1_000);

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, []);

  async function updatePause(
    nextPauseUntil:
      | number
      | null
  ) {
    if (
      !settings?.enabled ||
      isUpdating
    ) {
      return;
    }

    const previousPauseUntil =
      pauseUntil;

    setIsUpdating(true);
    setError(null);
    setPauseUntilValue(
      nextPauseUntil
    );

    try {
      await setPauseUntil(
        nextPauseUntil
      );
    } catch (
      pauseError: unknown
    ) {
      console.error(
        "Failed to update temporary pause:",
        pauseError
      );

      setPauseUntilValue(
        previousPauseUntil
      );

      setError(
        "Unable to update the temporary pause."
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function pauseForMinutes(
    durationMinutes: number
  ) {
    const nextPauseUntil =
      createPauseUntil(
        Date.now(),
        durationMinutes
      );

    await updatePause(
      nextPauseUntil
    );
  }

  async function pauseUntilTomorrow() {
    if (!settings) {
      return;
    }

    const resumeTime =
      settings.quietHoursEnabled
        ? settings.quietEnd
        : "08:00";

    const nextPauseUntil =
      getTomorrowResumeDate(
        new Date(),
        resumeTime
      ).getTime();

    await updatePause(
      nextPauseUntil
    );
  }

  async function resumeReminders() {
    await updatePause(null);
  }

  async function skipNextReminder() {
  if (
    !settings?.enabled ||
    isUpdating ||
    isSkipping ||
    nextFireAt === null ||
    isPauseActive(
      pauseUntil,
      Date.now()
    )
  ) {
    return;
  }

  setIsUpdating(true);
  setIsSkipping(true);
  setSkipConfirmed(false);
  setError(null);

  try {
    const response =
      (await chrome.runtime.sendMessage({
        type:
          SKIP_NEXT_REMINDER_MESSAGE
      })) as SkipNextReminderResponse;

    if (!response?.ok) {
      throw new Error(
        response?.error ??
          "Unable to skip the next reminder."
      );
    }

    setNextFireAt(
      response.nextFireAt
    );

    setNow(Date.now());
    setSkipConfirmed(true);

    window.setTimeout(() => {
      setSkipConfirmed(false);
    }, 1800);
  } catch (
    skipError: unknown
  ) {
    console.error(
      "Failed to skip next reminder:",
      skipError
    );

    setError(
      skipError instanceof Error
        ? skipError.message
        : "Unable to skip the next reminder."
    );
  } finally {
    setIsSkipping(false);
    setIsUpdating(false);
  }
}


  async function toggleEnabled() {
    if (
      !settings ||
      isUpdating
    ) {
      return;
    }

    const previousSettings =
      settings;

    const updatedSettings:
      ReminderSettings = {
        ...settings,
        enabled:
          !settings.enabled
      };

    setIsUpdating(true);
    setError(null);
    setSettings(
      updatedSettings
    );

    try {
      await saveSettings(
        updatedSettings
      );
    } catch (
      saveError: unknown
    ) {
      console.error(
        "Failed to update reminder status:",
        saveError
      );

      setSettings(
        previousSettings
      );

      setError(
        "Unable to update reminder status."
      );

      setIsUpdating(false);
      return;
    }

    if (
      !updatedSettings.enabled &&
      pauseUntil !== null
    ) {
      try {
        await setPauseUntil(
          null
        );

        setPauseUntilValue(
          null
        );
      } catch (
        pauseError: unknown
      ) {
        console.error(
          "Failed to clear temporary pause:",
          pauseError
        );

        setError(
          "Reminders were turned off, but the temporary pause could not be cleared."
        );
      }
    }

    setIsUpdating(false);
  }

  const pauseActive =
    Boolean(
      settings?.enabled &&
      isPauseActive(
        pauseUntil,
        now
      )
    );

  const countdown =
    getCountdown(
      pauseActive
        ? pauseUntil
        : nextFireAt,
      now
    );

  const quietNow =
    settings
      ? isInQuietHours(
          settings,
          new Date(now)
        )
      : false;

  const statusText =
    !settings
      ? "Loading"
      : !settings.enabled
        ? "Off"
        : pauseActive
          ? "Paused"
          : quietNow
            ? "Quiet hours"
            : "Active";

  const modeText =
    settings?.reminderType ===
    "INTERVAL"
      ? `Every ${settings.intervalMinutes} minutes`
      : `${
          settings?.fixedTimes
            .length ?? 0
        } fixed times`;

  const quietHoursText =
    settings
      ?.quietHoursEnabled
      ? `${formatStoredTime(
          settings.quietStart
        )} – ${formatStoredTime(
          settings.quietEnd
        )}`
      : "Turned off";

  return (
    <main className="siptime-popup water-background relative p-4">
      <div
        aria-hidden="true"
        className="water-bubble right-7 top-20 h-7 w-7"
      />

      <div
        aria-hidden="true"
        className="water-bubble left-5 top-40 h-4 w-4"
        style={{
          animationDelay:
            "1.2s"
        }}
      />

      <div
        aria-hidden="true"
        className="water-bubble bottom-24 right-12 h-5 w-5"
        style={{
          animationDelay:
            "2.4s"
        }}
      />

      <div
        aria-hidden="true"
        className="water-wave water-wave-one"
      />

      <div
        aria-hidden="true"
        className="water-wave water-wave-two"
      />

      <section className="water-glass p-4">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="brand-logo-tile h-11 w-11 shrink-0">
              <LogoIcon
                alt=""
                className="brand-logo-image"
              />
            </div>

            <div className="min-w-0">
              <h1 className="water-heading text-[25px]">
                SipTime
              </h1>

              <p className="water-muted truncate text-xs">
                Hydration that
                fits your day
              </p>
            </div>
          </div>

          <Toggle
            checked={
              settings?.enabled ??
              false
            }
            disabled={
              !settings ||
              isUpdating
            }
            onChange={() => {
              void toggleEnabled();
            }}
          />
        </header>

        <div className="mt-2.5 flex justify-center">
          <div className="water-status px-3 py-1.5 text-xs font-semibold">
            <span
              className={
                "water-status-dot " +
                (!settings
                  ? ""
                  : settings.enabled &&
                      !pauseActive &&
                      !quietNow
                    ? "water-status-dot-success"
                    : "water-status-dot-warning")
              }
            />

            {statusText}
          </div>
        </div>

        <div className="mt-2.5 flex justify-center">
          <div className="water-timer">
            <div
              aria-hidden="true"
              className="water-timer-liquid"
            />

            <div className="water-timer-content">
              <p className="water-muted text-[10px] font-bold uppercase tracking-[0.2em]">
                {!settings?.enabled
                  ? "Reminders"
                  : pauseActive
                    ? "Resumes in"
                    : "Next sip in"}
              </p>

              <div className="water-text-strong mt-1 text-[42px] font-bold leading-none tracking-tight">
                {!settings?.enabled
                  ? "Off"
                  : countdown.value}
              </div>

              <p className="water-muted mt-1 text-sm font-semibold">
                {!settings?.enabled
                  ? "disabled"
                  : countdown.label}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-2.5 text-center">
          <p className="water-text-strong text-sm font-bold">
            {!settings?.enabled
              ? "Enable reminders when you are ready"
              : pauseActive
                ? `Paused until ${formatClock(
                    pauseUntil
                  )}`
                : `Next reminder at ${formatClock(
                    nextFireAt
                  )}`}
          </p>

          <p className="water-muted mt-1 text-xs leading-5">
            {pauseActive
              ? "Your existing schedule will resume automatically."
              : quietNow
                ? "Notifications are suppressed during quiet hours."
                : "A few regular sips can make hydration easier."}
          </p>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-3">
          <div className="water-inner-panel px-3 py-2.5">
            <div className="flex items-center gap-2 text-[#8fd2e1]">
              <ClockIcon />

              <span className="text-[10px] font-bold uppercase tracking-wider">
                Schedule
              </span>
            </div>

            <p className="water-text-strong mt-1.5 whitespace-nowrap text-[13px] font-bold">
              {settings
                ? modeText
                : "Loading…"}
            </p>
          </div>

          <div className="water-inner-panel px-3 py-2.5">
            <div className="flex items-center gap-2 text-[#8fd2e1]">
              <MoonIcon />

              <span className="text-[10px] font-bold uppercase tracking-wider">
                Quiet hours
              </span>
            </div>

            <p className="water-text-strong mt-1.5 whitespace-nowrap text-[13px] font-bold">
              {settings
                ? quietHoursText
                : "Loading…"}
            </p>
          </div>
        </div>

            {settings?.enabled &&
            !pauseActive ? (
              <button
                className="water-secondary-button mt-2.5 flex h-10 w-full items-center justify-center gap-2 px-4 text-xs font-bold"
                disabled={
                  isUpdating ||
                  nextFireAt === null
                }
                onClick={() => {
                  void skipNextReminder();
                }}
                type="button"
              >
                <SkipIcon />

                {isSkipping
                  ? "Skipping…"
                  : skipConfirmed
                    ? "Next reminder skipped"
                    : "Skip next reminder"}
              </button>
            ) : null}

        {settings?.enabled ? (
          <div className="water-inner-panel mt-2.5 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="water-text-strong text-xs font-bold">
                  {pauseActive
                    ? "Change temporary pause"
                    : "Pause reminders"}
                </p>

                <p className="water-muted mt-0.5 text-[10px]">
                  {pauseActive
                    ? `Currently paused until ${formatClock(
                        pauseUntil
                      )}`
                    : "Keep your schedule and resume automatically."}
                </p>
              </div>
            </div>

            <div
              className={
                "mt-2 grid gap-1.5 " +
                (pauseActive
                  ? "grid-cols-5"
                  : "grid-cols-4")
              }
            >
              {pauseActive ? (
                <button
                  className="water-primary-button h-9 px-1 text-[10px] font-bold"
                  disabled={
                    isUpdating
                  }
                  onClick={() => {
                    void resumeReminders();
                  }}
                  type="button"
                >
                  Resume
                </button>
              ) : null}

              <button
                className="water-secondary-button h-9 px-1 text-[10px] font-bold"
                disabled={
                  isUpdating
                }
                onClick={() => {
                  void pauseForMinutes(
                    30
                  );
                }}
                type="button"
              >
                30 min
              </button>

              <button
                className="water-secondary-button h-9 px-1 text-[10px] font-bold"
                disabled={
                  isUpdating
                }
                onClick={() => {
                  void pauseForMinutes(
                    60
                  );
                }}
                type="button"
              >
                1 hour
              </button>

              <button
                className="water-secondary-button h-9 px-1 text-[10px] font-bold"
                disabled={
                  isUpdating
                }
                onClick={() => {
                  void pauseForMinutes(
                    120
                  );
                }}
                type="button"
              >
                2 hours
              </button>

              <button
                className="water-secondary-button h-9 px-1 text-[10px] font-bold"
                disabled={
                  isUpdating
                }
                onClick={() => {
                  void pauseUntilTomorrow();
                }}
                type="button"
              >
                Tomorrow
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div
            className="water-error-message mt-2 px-3 py-2 text-xs font-medium"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-2.5 flex gap-2">
          <button
            className="water-primary-button flex h-11 flex-1 items-center justify-center gap-2 px-4 text-sm font-bold"
            onClick={() =>
              chrome.runtime.openOptionsPage()
            }
            type="button"
          >
            <SettingsIcon />
            Open settings
          </button>

          <button
            aria-label="Refresh reminder information"
            className="water-secondary-button grid h-11 w-11 shrink-0 place-items-center"
            disabled={
              isUpdating
            }
            onClick={() => {
              void load();
            }}
            type="button"
          >
            <RefreshIcon />
          </button>
        </div>

        <p className="water-faint mt-2 text-center text-[10px]">
          Your reminder settings
          remain in your browser.
        </p>
      </section>
    </main>
  );
}