import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type {
  InputHTMLAttributes,
  ReactNode
} from "react";
import {
  TimePickerTrigger
} from "../components/time-picker/TimePickerTrigger";
import {
  TimeWheelPicker
} from "../components/time-picker/TimeWheelPicker";
import {
  formatIntervalDuration,
  formatIntervalPresetLabel,
  INTERVAL_PRESETS,
  isIntervalPreset
} from "../shared/intervals";
import {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings
} from "../shared/storage";
import {
  formatStoredTime12Hour,
  isValidStoredTime
} from "../shared/time";
import type {
  ReminderSettings,
  ReminderType
} from "../shared/types";

type ToastState = {
  text: string;
  tone: "success" | "info";
} | null;

type QuietTimeTarget =
  | "start"
  | "end";

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

function WaterDropIcon(props: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={props.className ?? "h-6 w-6"}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 2.75S5.5 9.1 5.5 14.25a6.5 6.5 0 0 0 13 0C18.5 9.1 12 2.75 12 2.75Z"
        fill="currentColor"
      />

      <path
        d="M9 15.2a3.2 3.2 0 0 0 3.2 3.2"
        stroke="white"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
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

function PauseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M9 7v10M15 7v10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />

      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7.5 10a4.5 4.5 0 0 1 9 0v3.2l1.5 2.3H6l1.5-2.3V10Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />

      <path
        d="M10 18a2.2 2.2 0 0 0 4 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m6 12.5 3.5 3.5L18 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 8a8 8 0 1 1-.5 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />

      <path
        d="M5 4v4h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function HelpIcon() {
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
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M9.8 9a2.35 2.35 0 0 1 4.5.9c0 1.75-2.3 2.05-2.3 3.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />

      <path
        d="M12 17h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function Card(props: {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const titleId =
    `${props.id}-title`;

  const descriptionId =
    `${props.id}-description`;

  return (
    <section
      aria-describedby={
        descriptionId
      }
      aria-labelledby={
        titleId
      }
      className="water-glass scroll-mt-6 p-5 sm:p-6"
      id={props.id}
    >
      <div className="flex items-start gap-3">
        <div className="water-icon-tile h-11 w-11 shrink-0">
          {props.icon}
        </div>

        <div>
          <h2
            className="water-heading text-lg"
            id={titleId}
          >
            {props.title}
          </h2>

          <p
            className="water-muted mt-1 text-sm leading-6"
            id={descriptionId}
          >
            {props.description}
          </p>
        </div>
      </div>

      <div className="mt-5">{props.children}</div>
    </section>
  );
}

function Switch(props: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      aria-checked={props.checked}
      aria-label={props.label}
      className="water-switch"
      role="switch"
      data-checked={props.checked}
      onClick={() => props.onChange(!props.checked)}
      type="button"
    >
      <span className="water-switch-knob" />
    </button>
  );
}


function NumberInput(
  props: InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className="water-input h-11 w-28 px-3.5 text-sm font-semibold"
    />
  );
}

function SegmentedControl(props: {
  value: ReminderType;
  onChange: (value: ReminderType) => void;
}) {
  return (
    <div
      aria-label="Reminder schedule type"
      className="water-segmented"
      role="group"
    >
      <button
        aria-pressed={props.value === "INTERVAL"}
        className="water-segmented-button"
        data-active={props.value === "INTERVAL"}
        onClick={() => props.onChange("INTERVAL")}
        type="button"
      >
        Interval
      </button>

      <button
        aria-pressed={props.value === "FIXED_TIMES"}
        className="water-segmented-button"
        data-active={props.value === "FIXED_TIMES"}
        onClick={() => props.onChange("FIXED_TIMES")}
        type="button"
      >
        Fixed times
      </button>
    </div>
  );
}

function NavigationLink(props: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      className="water-navigation-link"
      href={props.href}
    >
      <span className="text-[#68b3c4]">
        {props.icon}
      </span>

      {props.label}
    </a>
  );
}

function Toast(props: { state: ToastState }) {
  if (!props.state) {
    return null;
  }

  return (
    <div
      className={
        "water-toast fixed right-5 top-5 z-50 flex items-center gap-2 px-4 py-3 text-sm font-semibold " +
        (props.state.tone === "success"
          ? "water-toast-success"
          : "")
      }
      aria-atomic="true"
      aria-live="polite"
      role="status"
    >
      <CheckIcon />
      {props.state.text}
    </div>
  );
}

function FixedTimesEditor(props: {
  fixedTimes: string[];
  onChange: (times: string[]) => void;
}) {
  const [
    pickerState,
    setPickerState
  ] = useState<{
    index: number;
    removeOnCancel: boolean;
  } | null>(null);

  const activeTime =
    pickerState === null
      ? null
      : props.fixedTimes[
          pickerState.index
        ] ?? null;

  function addTime() {
    const index =
      props.fixedTimes.length;

    props.onChange([
      ...props.fixedTimes,
      "10:00"
    ]);

    setPickerState({
      index,
      removeOnCancel: true
    });
  }

  function updateTime(
    index: number,
    value: string
  ) {
    const updatedTimes = [
      ...props.fixedTimes
    ];

    updatedTimes[index] =
      value;

    props.onChange(
      updatedTimes
    );
  }

  function removeTime(
    index: number
  ) {
    props.onChange(
      props.fixedTimes.filter(
        (
          _,
          currentIndex
        ) =>
          currentIndex !==
          index
      )
    );
  }

  function cancelPicker() {
    if (
      pickerState?.removeOnCancel
    ) {
      removeTime(
        pickerState.index
      );
    }

    setPickerState(null);
  }

  return (
    <div
      aria-labelledby="fixed-times-title"
      className="water-inner-panel p-4"
      role="group"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3
            className="water-text-strong text-sm font-bold"
            id="fixed-times-title"
          >
            Daily reminder times
          </h3>

          <p className="water-muted mt-1 text-xs">
            Add each time you want SipTime to notify you.
          </p>
        </div>

        <button
          className="water-primary-button px-3.5 py-2 text-xs font-bold"
          onClick={addTime}
          type="button"
        >
          Add time
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {props.fixedTimes.length === 0 ? (
          <div className="rounded-[var(--water-radius-medium)] border border-dashed border-[#315b68] bg-[#081e29] p-4 text-center text-sm text-[#8eabb4]">
            No fixed reminder times have been added.
          </div>
        ) : null}

        {props.fixedTimes.map(
          (
            time,
            index
          ) => (
            <div
              className="flex items-center gap-2"
              key={
                `reminder-time-${index}`
              }
            >
              <TimePickerTrigger
                label={
                  `Reminder time ${index + 1}`
                }
                onClick={() => {
                  setPickerState({
                    index,
                    removeOnCancel: false
                  });
                }}
                value={time}
              />

              <button
                aria-label={
                  `Remove reminder time ${index + 1}`
                }
                className="water-secondary-button h-11 px-3.5 text-sm font-semibold hover:border-[#a35d5a] hover:bg-[#3a2024] hover:text-[#f1aaa6]"
                onClick={() => {
                  setPickerState(
                    null
                  );

                  removeTime(
                    index
                  );
                }}
                type="button"
              >
                Remove
              </button>
            </div>
          )
        )}
      </div>

      <TimeWheelPicker
        isOpen={
          activeTime !== null
        }
        onCancel={
          cancelPicker
        }
        onConfirm={(
          value
        ) => {
          if (
            pickerState !==
            null
          ) {
            updateTime(
              pickerState.index,
              value
            );
          }

          setPickerState(null);
        }}
        title={
          pickerState === null
            ? "Select reminder time"
            : `Reminder time ${pickerState.index + 1}`
        }
        value={
          activeTime ??
          "10:00"
        }
      />
    </div>
  );
}

function copySettings(
  settings: ReminderSettings
): ReminderSettings {
  return {
    ...settings,
    fixedTimes: [...settings.fixedTimes]
  };
}

function settingsAreEqual(
  first: ReminderSettings,
  second: ReminderSettings
): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}


function HelpPanel(props: {
  settings: ReminderSettings;
}) {
  const scheduleTip =
    props.settings.reminderType === "INTERVAL"
      ? `Your current interval is ${formatIntervalDuration(
          props.settings.intervalMinutes
        )}. Choose a quick preset or enter a custom duration.`
      : `You currently have ${props.settings.fixedTimes.length} fixed reminder times. Add times that match natural breaks in your day.`;

  return (
    <aside
      aria-labelledby="siptime-help-title"
      className="water-glass top-6 p-4 xl:sticky"
    >
      <div className="flex items-center gap-3">
        <div className="water-icon-tile h-10 w-10 shrink-0">
          <HelpIcon />
        </div>

        <div>
          <h2
            className="water-heading text-base"
            id="siptime-help-title"
          >
            SipTime help
          </h2>

          <p className="water-muted mt-1 text-xs">
            Guidance for configuring your reminders.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <article className="help-tip">
          <p className="help-tip-label">
            Reminder schedule
          </p>

          <p>{scheduleTip}</p>
        </article>

        <article className="help-tip">
          <p className="help-tip-label">
            Quiet hours
          </p>

          <p>
            Set quiet hours across your usual sleeping period.
            Overnight ranges such as 11:30 PM–08:00 AM are supported.
          </p>
        </article>

        <article className="help-tip">
          <p className="help-tip-label">
            Not seeing reminders?
          </p>

          <p>
            Use the notification test, then check browser and
            operating-system notification permissions.
          </p>
        </article>

        <article className="help-tip">
          <p className="help-tip-label">
            Remember to save
          </p>

          <p>
            Changes are not applied until you select
            <strong className="water-text-strong">
              {" "}Save and apply
            </strong>.
          </p>
        </article>
      </div>

      <div className="mt-4 border-t border-[#275261] pt-4">
        <p className="water-faint text-[11px] leading-5">
          SipTime provides configurable reminders and does not
          replace professional health guidance.
        </p>
      </div>
    </aside>
  );
}

export default function OptionsApp() {
  const [settings, setSettings] =
    useState<ReminderSettings>(
      copySettings(DEFAULT_SETTINGS)
    );

  const [savedSettings, setSavedSettings] =
    useState<ReminderSettings>(
      copySettings(DEFAULT_SETTINGS)
    );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const toastTimeoutRef =
    useRef<number | null>(null);

  const errorRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [
    quietTimeTarget,
    setQuietTimeTarget
  ] = useState<QuietTimeTarget | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;

    void getSettings()
      .then((storedSettings) => {
        if (!isMounted) {
          return;
        }

        setSettings(copySettings(storedSettings));
        setSavedSettings(copySettings(storedSettings));
        setIsLoading(false);
      })
      .catch((loadError: unknown) => {
        console.error(
          "Failed to load SipTime settings:",
          loadError
        );

        if (isMounted) {
          setError(
            "SipTime could not load your saved settings."
          );

          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (
        toastTimeoutRef.current !==
        null
      ) {
        window.clearTimeout(
          toastTimeoutRef.current
        );
      }
    };
  }, []);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  const intervalUsesPreset = useMemo(
    () => isIntervalPreset(settings.intervalMinutes),
    [settings.intervalMinutes]
  );

  const intervalValid = useMemo(
    () =>
      Number.isFinite(settings.intervalMinutes) &&
      settings.intervalMinutes >= 1 &&
      settings.intervalMinutes <= 480,
    [settings.intervalMinutes]
  );

  const snoozeValid = useMemo(
    () =>
      Number.isFinite(settings.snoozeMinutes) &&
      settings.snoozeMinutes >= 1 &&
      settings.snoozeMinutes <= 120,
    [settings.snoozeMinutes]
  );

  const fixedTimesValid = useMemo(() => {
    if (settings.reminderType !== "FIXED_TIMES") {
      return true;
    }

    return (
      settings.fixedTimes.length > 0 &&
      settings.fixedTimes.every(isValidStoredTime)
    );
  }, [settings.fixedTimes, settings.reminderType]);

  const quietHoursValid = useMemo(
    () =>
      !settings.quietHoursEnabled ||
      (isValidStoredTime(settings.quietStart) &&
        isValidStoredTime(settings.quietEnd)),
    [
      settings.quietEnd,
      settings.quietHoursEnabled,
      settings.quietStart
    ]
  );

  const hasUnsavedChanges = useMemo(
    () => !settingsAreEqual(settings, savedSettings),
    [savedSettings, settings]
  );

  function showToast(
    state: Exclude<ToastState, null>
  ) {
    if (
      toastTimeoutRef.current !==
      null
    ) {
      window.clearTimeout(
        toastTimeoutRef.current
      );
    }

    setToast(state);

    toastTimeoutRef.current =
      window.setTimeout(() => {
        setToast(null);

        toastTimeoutRef.current =
          null;
      }, 1800);
  }

  function validateSettings(): string | null {
    if (
      settings.reminderType === "INTERVAL" &&
      !intervalValid
    ) {
      return "Interval must be between 1 and 480 minutes.";
    }

    if (!fixedTimesValid) {
      return "Add at least one valid fixed reminder time.";
    }

    if (!quietHoursValid) {
      return "Quiet-hour start and end times must be valid.";
    }

    if (!snoozeValid) {
      return "Snooze must be between 1 and 120 minutes.";
    }

    return null;
  }

  async function handleSave() {
    const validationError = validateSettings();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await saveSettings(settings);
      setSavedSettings(copySettings(settings));

      showToast({
        text: "Settings saved",
        tone: "success"
      });
    } catch (saveError: unknown) {
      console.error(
        "Failed to save SipTime settings:",
        saveError
      );

      setError("SipTime could not save your changes.");
    } finally {
      setIsSaving(false);
    }
  }

  function discardChanges() {
    setSettings(copySettings(savedSettings));
    setError(null);

    showToast({
      text: "Unsaved changes discarded",
      tone: "info"
    });
  }

  function restoreDefaults() {
    setSettings(copySettings(DEFAULT_SETTINGS));
    setError(null);

    showToast({
      text: "Defaults loaded — save to apply",
      tone: "info"
    });
  }

  function sendTestNotification() {
    setError(null);
    setIsTesting(true);

    const notificationId = `TEST_WATER_${Date.now()}`;

    chrome.notifications.create(
      notificationId,
      {
        type: "basic",
        iconUrl: chrome.runtime.getURL("icon.png"),
        title: "Time to drink water",
        message:
          "This is how your SipTime reminders will appear.",
        priority: 2,
        requireInteraction: true,
        silent: false
      },
      (createdNotificationId) => {
        setIsTesting(false);

        if (chrome.runtime.lastError) {
          console.error(
            "Test notification error:",
            chrome.runtime.lastError.message
          );

          setError(
            `The test notification could not be displayed: ${chrome.runtime.lastError.message}`
          );

          return;
        }

        if (!createdNotificationId) {
          setError(
            "Chrome did not create the notification. Check browser and operating-system notification settings."
          );

          return;
        }

        showToast({
          text: "Test notification sent",
          tone: "success"
        });
      }
    );
  }

  if (isLoading) {
    return (
      <main
        aria-busy="true"
        aria-labelledby="siptime-loading-status"
        className="water-background grid min-h-screen place-items-center px-6"
      >
        <div
          className="water-glass px-8 py-7 text-center"
          role="status"
        >
          <div className="brand-logo-tile mx-auto h-14 w-14">
            <LogoIcon
              alt=""
              className="brand-logo-image"
            />
          </div>

          <p
            aria-live="polite"
            className="water-muted mt-4 text-sm font-semibold"
            id="siptime-loading-status"
          >
            Loading your hydration settings…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      aria-labelledby="siptime-options-title"
      className="water-background relative min-h-screen px-4 py-6 sm:px-6 lg:px-8"
    >
      <Toast state={toast} />

      <TimeWheelPicker
        isOpen={
          quietTimeTarget !==
          null
        }
        onCancel={() => {
          setQuietTimeTarget(
            null
          );
        }}
        onConfirm={(
          value
        ) => {
          if (
            quietTimeTarget ===
            "start"
          ) {
            setSettings(
              (
                current
              ) => ({
                ...current,
                quietStart:
                  value
              })
            );
          } else if (
            quietTimeTarget ===
            "end"
          ) {
            setSettings(
              (
                current
              ) => ({
                ...current,
                quietEnd:
                  value
              })
            );
          }

          setQuietTimeTarget(
            null
          );
        }}
        title={
          quietTimeTarget ===
          "end"
            ? "Set quiet hours end"
            : "Set quiet hours start"
        }
        value={
          quietTimeTarget ===
          "end"
            ? settings.quietEnd
            : settings.quietStart
        }
      />

      <div
        aria-hidden="true"
        className="water-bubble right-[8%] top-20 h-14 w-14"
      />

      <div
        aria-hidden="true"
        className="water-bubble left-[4%] top-[36rem] h-8 w-8"
        style={{ animationDelay: "1.4s" }}
      />

      <div
        aria-hidden="true"
        className="water-bubble bottom-40 right-[12%] h-10 w-10"
        style={{ animationDelay: "2.7s" }}
      />

      <div
        aria-hidden="true"
        className="water-wave water-wave-one"
      />

      <div
        aria-hidden="true"
        className="water-wave water-wave-two"
      />

      <div className="relative mx-auto max-w-6xl">
        <header className="water-glass p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="brand-logo-tile h-14 w-14 shrink-0">
                <LogoIcon
                  alt=""
                  className="brand-logo-image"
                />
              </div>

              <div>
                <h1
                  className="water-heading text-2xl sm:text-3xl"
                  id="siptime-options-title"
                >
                  SipTime
                </h1>

                <p className="water-muted mt-1 text-sm">
                  Build a hydration schedule around your day.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className={
                  "px-3 py-1.5 text-xs font-bold " +
                  (hasUnsavedChanges
                    ? "water-status-warning"
                    : "water-status-success")
                }
              >
                {hasUnsavedChanges
                  ? "Unsaved changes"
                  : "All changes saved"}
              </div>

              <button
                className="water-secondary-button flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
                onClick={restoreDefaults}
                type="button"
              >
                <ResetIcon />
                Restore defaults
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="water-inner-panel p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#69afc0]">
                Status
              </p>

              <p className="water-text-strong mt-2 text-lg font-bold">
                {settings.enabled
                  ? "Reminders active"
                  : "Reminders paused"}
              </p>
            </div>

            <div className="water-inner-panel p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#69afc0]">
                Schedule
              </p>

              <p className="water-text-strong mt-2 text-lg font-bold">
                {settings.reminderType === "INTERVAL"
                  ? `Every ${formatIntervalDuration(
                      settings.intervalMinutes
                    )}`
                  : `${settings.fixedTimes.length} fixed times`}
              </p>
            </div>

            <div className="water-inner-panel p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#69afc0]">
                Quiet hours
              </p>

              <p className="water-text-strong mt-2 text-lg font-bold">
                {settings.quietHoursEnabled
                  ? `${formatStoredTime12Hour(
                      settings.quietStart
                    )} – ${formatStoredTime12Hour(
                      settings.quietEnd
                    )}`
                  : "Off"}
              </p>
            </div>
          </div>
        </header>

        {error ? (
          <div
            className="water-error-message mt-5 px-5 py-4 text-sm font-medium shadow-sm"
            ref={errorRef}
            role="alert"
            tabIndex={-1}
          >
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-[210px_minmax(0,1fr)_280px]">
          <aside className="water-glass top-6 p-3 lg:sticky">
            <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#69afc0]">
              Settings
            </p>

            <nav aria-label="SipTime settings sections">
              <NavigationLink
                href="#general"
                icon={
                  <WaterDropIcon className="h-5 w-5" />
                }
                label="General"
              />

              <NavigationLink
                href="#schedule"
                icon={<ClockIcon />}
                label="Schedule"
              />

              <NavigationLink
                href="#quiet-hours"
                icon={<MoonIcon />}
                label="Quiet hours"
              />

              <NavigationLink
                href="#snooze"
                icon={<PauseIcon />}
                label="Snooze"
              />

              <NavigationLink
                href="#notifications"
                icon={<BellIcon />}
                label="Notifications"
              />
            </nav>

            <div className="water-inner-panel water-muted mt-3 p-3 text-xs leading-5">
              All preferences remain in browser storage.
              SipTime does not send them to an external
              server.
            </div>
          </aside>

          <div className="space-y-5 pb-36">
            <Card
              description="Pause or resume your hydration reminders at any time."
              icon={
                <WaterDropIcon className="h-6 w-6" />
              }
              id="general"
              title="General"
            >
              <div className="water-inner-panel flex items-center justify-between gap-5 p-4">
                <div>
                  <h3 className="water-text-strong text-sm font-bold">
                    Hydration reminders
                  </h3>

                  <p className="water-muted mt-1 text-xs leading-5">
                    {settings.enabled
                      ? "SipTime will notify you using the schedule below."
                      : "No hydration notifications will be delivered."}
                  </p>
                </div>

                <Switch
                  checked={settings.enabled}
                  label={
                    settings.enabled
                      ? "Disable hydration reminders"
                      : "Enable hydration reminders"
                  }
                  onChange={(enabled) =>
                    setSettings({
                      ...settings,
                      enabled
                    })
                  }
                />
              </div>
            </Card>

            <Card
              description="Choose a repeating interval or specific reminder times."
              icon={<ClockIcon />}
              id="schedule"
              title="Reminder schedule"
            >
              <SegmentedControl
                onChange={(reminderType) =>
                  setSettings({
                    ...settings,
                    reminderType
                  })
                }
                value={settings.reminderType}
              />

              {settings.reminderType === "INTERVAL" ? (
                <div className="mt-5">
                  <h3 className="water-text-strong text-sm font-bold">
                    How often should SipTime remind you?
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {INTERVAL_PRESETS.map((minutes) => (
                      <button
                        aria-pressed={
                          settings.intervalMinutes === minutes
                        }
                        className="water-chip"
                        data-active={
                          settings.intervalMinutes === minutes
                        }
                        key={minutes}
                        onClick={() =>
                          setSettings({
                            ...settings,
                            intervalMinutes: minutes
                          })
                        }
                        type="button"
                      >
                        {formatIntervalPresetLabel(minutes)}
                      </button>
                    ))}
                  </div>

                  <div className="water-inner-panel mt-4 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        className="water-text text-sm font-semibold"
                        htmlFor="custom-interval"
                      >
                        Custom interval
                      </label>

                      <NumberInput
                        aria-describedby="custom-interval-help"
                        aria-invalid={!intervalValid}
                        id="custom-interval"
                        max={480}
                        min={1}
                        onChange={(event) =>
                          setSettings({
                            ...settings,
                            intervalMinutes: Number(
                              event.target.value
                            )
                          })
                        }
                        type="number"
                        value={settings.intervalMinutes}
                      />

                      <span className="water-muted text-sm">
                        minutes
                      </span>

                      <span
                        className={
                          "px-2.5 py-1 text-[10px] font-bold " +
                          (intervalUsesPreset
                            ? "water-status-success"
                            : "water-status-warning")
                        }
                      >
                        {intervalUsesPreset
                          ? "Preset selected"
                          : "Custom value"}
                      </span>
                    </div>

                    <p
                      className="water-muted mt-2 text-xs"
                      id="custom-interval-help"
                    >
                      Choose a preset above or enter any value
                      from 1 to 480 minutes.
                    </p>
                  </div>

                  {!intervalValid ? (
                    <p className="mt-2 text-xs font-semibold text-[#f1aaa6]">
                      Enter a value between 1 and 480 minutes.
                    </p>
                  ) : (
                    <p className="water-muted mt-2 text-xs">
                      Preset changes remain unsaved until you
                      select Save and apply.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-5">
                  <FixedTimesEditor
                    fixedTimes={settings.fixedTimes}
                    onChange={(fixedTimes) =>
                      setSettings({
                        ...settings,
                        fixedTimes
                      })
                    }
                  />

                  {!fixedTimesValid ? (
                    <p className="mt-2 text-xs font-semibold text-[#f1aaa6]">
                      Add at least one valid reminder time.
                    </p>
                  ) : null}
                </div>
              )}
            </Card>

            <Card
              description="Suppress notifications while you are sleeping or unavailable."
              icon={<MoonIcon />}
              id="quiet-hours"
              title="Quiet hours"
            >
              <div className="water-inner-panel flex items-center justify-between gap-5 p-4">
                <div>
                  <h3 className="water-text-strong text-sm font-bold">
                    Enable quiet hours
                  </h3>

                  <p className="water-muted mt-1 text-xs leading-5">
                    Overnight ranges such as 11:30 PM to 08:00 AM
                    are supported.
                  </p>
                </div>

                <Switch
                  checked={settings.quietHoursEnabled}
                  label={
                    settings.quietHoursEnabled
                      ? "Disable quiet hours"
                      : "Enable quiet hours"
                  }
                  onChange={(quietHoursEnabled) =>
                    setSettings({
                      ...settings,
                      quietHoursEnabled
                    })
                  }
                />
              </div>

              <div
                className={
                  "mt-4 grid gap-4 sm:grid-cols-2 " +
                  (!settings.quietHoursEnabled
                    ? "opacity-50"
                    : "")
                }
              >
                <div>
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-[#69afc0]"
                    htmlFor="quiet-start"
                  >
                    Start
                  </label>

                  <div className="mt-2">
                    <TimePickerTrigger
                      disabled={
                        !settings.quietHoursEnabled
                      }
                      id="quiet-start"
                      label="Quiet hours start"
                      onClick={() => {
                        setQuietTimeTarget(
                          "start"
                        );
                      }}
                      value={
                        settings.quietStart
                      }
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-[#69afc0]"
                    htmlFor="quiet-end"
                  >
                    End
                  </label>

                  <div className="mt-2">
                    <TimePickerTrigger
                      disabled={
                        !settings.quietHoursEnabled
                      }
                      id="quiet-end"
                      label="Quiet hours end"
                      onClick={() => {
                        setQuietTimeTarget(
                          "end"
                        );
                      }}
                      value={
                        settings.quietEnd
                      }
                    />
                  </div>
                </div>
              </div>

              {!quietHoursValid ? (
                <p className="mt-2 text-xs font-semibold text-[#f1aaa6]">
                  Enter valid quiet-hour start and end times.
                </p>
              ) : null}
            </Card>

            <Card
              description="Choose how long a notification should pause when snoozed."
              icon={<PauseIcon />}
              id="snooze"
              title="Snooze"
            >
              <div className="water-inner-panel flex flex-wrap items-center gap-3 p-4">
                <label
                  className="water-text text-sm font-semibold"
                  htmlFor="snooze-duration"
                >
                  Snooze reminders for
                </label>

                <NumberInput
                  aria-describedby="snooze-duration-help"
                  aria-invalid={!snoozeValid}
                  id="snooze-duration"
                  max={120}
                  min={1}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      snoozeMinutes: Number(
                        event.target.value
                      )
                    })
                  }
                  type="number"
                  value={settings.snoozeMinutes}
                />

                <span className="water-muted text-sm">
                  minutes
                </span>
              </div>

              {!snoozeValid ? (
                <p
                  className="mt-2 text-xs font-semibold text-[#f1aaa6]"
                  id="snooze-duration-help"
                >
                  Enter a snooze duration between 1 and 120
                  minutes.
                </p>
              ) : null}
            </Card>

            <Card
              description="Confirm that Chrome or Brave can display SipTime notifications."
              icon={<BellIcon />}
              id="notifications"
              title="Notification test"
            >
              <div className="water-inner-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="water-text-strong text-sm font-bold">
                    Send a sample reminder
                  </h3>

                  <p className="water-muted mt-1 max-w-xl text-xs leading-5">
                    Check browser notifications,
                    operating-system notification permissions,
                    and Do Not Disturb if no banner appears.
                  </p>
                </div>

                <button
                  className="water-secondary-button shrink-0 px-4 py-2.5 text-sm font-bold"
                  disabled={isTesting}
                  onClick={sendTestNotification}
                  type="button"
                >
                  {isTesting
                    ? "Sending…"
                    : "Send test notification"}
                </button>
              </div>
            </Card>
          </div>

          <HelpPanel settings={settings} />
        </div>
      </div>

      <div
        className="options-save-bar fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3"
        data-unsaved={hasUnsavedChanges}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            aria-atomic="true"
            aria-live="polite"
            className="options-save-message text-xs"
            role="status"
          >
            {hasUnsavedChanges
              ? "Review your changes, then select Save settings to apply them."
              : "Your hydration preferences are saved and active."}
          </p>

          <div className="flex gap-2">
            <button
              className="water-secondary-button flex-1 px-4 py-2.5 text-sm font-semibold sm:flex-none"
              disabled={!hasUnsavedChanges || isSaving}
              onClick={discardChanges}
              type="button"
            >
              Discard changes
            </button>

            <button
              className="water-primary-button flex flex-1 items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold sm:flex-none"
              disabled={!hasUnsavedChanges || isSaving}
              onClick={() => {
                void handleSave();
              }}
              type="button"
            >
              <CheckIcon />

              {isSaving
                ? "Saving changes…"
                : "Save and apply"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}