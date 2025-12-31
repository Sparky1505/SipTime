import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SETTINGS, getSettings, saveSettings } from "../shared/storage";
import type { ReminderSettings } from "../shared/types";

function Card(props: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{props.title}</h2>
          {props.description ? <p className="mt-1 text-xs text-slate-500">{props.description}</p> : null}
        </div>
      </div>
      <div className="mt-4">{props.children}</div>
    </section>
  );
}

function Row(props: { label: string; hint?: string; right: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-900">{props.label}</div>
        {props.hint ? <div className="mt-0.5 text-xs text-slate-500">{props.hint}</div> : null}
      </div>
      <div className="shrink-0">{props.right}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-slate-100" />;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 " +
        "placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
      }
    />
  );
}

function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 " +
        "focus:border-slate-400 focus:outline-none"
      }
    />
  );
}

function Switch(props: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => props.onChange(!props.checked)}
      className={
        "relative inline-flex h-6 w-11 items-center rounded-full transition " +
        (props.checked ? "bg-slate-900" : "bg-slate-200")
      }
      aria-pressed={props.checked}
    >
      <span
        className={
          "inline-block h-5 w-5 transform rounded-full bg-white transition " +
          (props.checked ? "translate-x-5" : "translate-x-1")
        }
      />
    </button>
  );
}

function Segmented(props: {
  value: "INTERVAL" | "FIXED_TIMES";
  onChange: (v: "INTERVAL" | "FIXED_TIMES") => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
      <button
        type="button"
        onClick={() => props.onChange("INTERVAL")}
        className={
          "rounded-lg px-3 py-1.5 text-sm font-medium transition " +
          (props.value === "INTERVAL" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50")
        }
      >
        Interval
      </button>
      <button
        type="button"
        onClick={() => props.onChange("FIXED_TIMES")}
        className={
          "rounded-lg px-3 py-1.5 text-sm font-medium transition " +
          (props.value === "FIXED_TIMES" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50")
        }
      >
        Fixed times
      </button>
    </div>
  );
}

function Toast(props: { visible: boolean; text: string }) {
  if (!props.visible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
      {props.text}
    </div>
  );
}

export default function OptionsApp() {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const intervalValid = useMemo(() => settings.intervalMinutes >= 1 && settings.intervalMinutes <= 480, [settings.intervalMinutes]);
  const snoozeValid = useMemo(() => settings.snoozeMinutes >= 1 && settings.snoozeMinutes <= 120, [settings.snoozeMinutes]);

  const fixedTimesValid = useMemo(() => {
    if (settings.reminderType !== "FIXED_TIMES") return true;
    if (settings.fixedTimes.length === 0) return false;
    // basic validation: HH:mm format
    for (let i = 0; i < settings.fixedTimes.length; i++) {
      const t = settings.fixedTimes[i];
      if (!/^\d{2}:\d{2}$/.test(t)) return false;
    }
    return true;
  }, [settings.reminderType, settings.fixedTimes]);

  async function onSave() {
    setError(null);

    if (settings.reminderType === "INTERVAL" && !intervalValid) {
      setError("Interval must be between 1 and 480 minutes.");
      return;
    }
    if (!snoozeValid) {
      setError("Snooze must be between 1 and 120 minutes.");
      return;
    }
    if (!fixedTimesValid) {
      setError("Add at least one valid fixed time (HH:mm).");
      return;
    }

    await saveSettings(settings);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast visible={saved} text="Saved" />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white">
                <span className="text-sm font-semibold">W</span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">SipTime</h1>
                <p className="mt-1 text-sm text-slate-600">
                    Set a schedule that keeps you hydrated without interruptions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              onClick={async () => setSettings(await getSettings())}
              type="button"
            >
              Reset
            </button>
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={onSave}
              type="button"
            >
              Save
            </button>
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200">
            {error}
          </div>
        ) : null}

        <main className="mt-6 space-y-4">
          <Card title="General" description="Enable or disable reminders quickly.">
            <Row
              label="Enabled"
              hint={settings.enabled ? "Reminders will be delivered based on your schedule." : "No reminders will be delivered."}
              right={<Switch checked={settings.enabled} onChange={(v) => setSettings({ ...settings, enabled: v })} />}
            />
          </Card>

          <Card
            title="Schedule"
            description="Choose interval reminders or fixed times. Interval is best for consistent hydration."
          >
            <Row
              label="Reminder mode"
              hint="Interval: every X minutes. Fixed times: specific times each day."
              right={
                <Segmented
                  value={settings.reminderType}
                  onChange={(v) => setSettings({ ...settings, reminderType: v })}
                />
              }
            />

            <Divider />

            {settings.reminderType === "INTERVAL" ? (
              <div className="pt-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-sm font-medium text-slate-900">Every</div>
                  <NumberInput
                    type="number"
                    min={1}
                    max={480}
                    value={settings.intervalMinutes}
                    onChange={(e) => setSettings({ ...settings, intervalMinutes: Number(e.target.value) })}
                  />
                  <div className="text-sm text-slate-700">minutes</div>
                </div>
                <div className="mt-2 text-xs text-slate-500">Recommended: 30–60 minutes.</div>
                {!intervalValid ? (
                  <div className="mt-2 text-xs text-rose-700">Interval must be between 1 and 480 minutes.</div>
                ) : null}
              </div>
            ) : (
              <div className="pt-3">
                <FixedTimesEditor
                  fixedTimes={settings.fixedTimes}
                  onChange={(fixedTimes) => setSettings({ ...settings, fixedTimes })}
                />
                {!fixedTimesValid ? (
                  <div className="mt-2 text-xs text-rose-700">Add at least one valid fixed time.</div>
                ) : null}
              </div>
            )}
          </Card>

          <Card title="Quiet hours" description="During quiet hours, reminders are suppressed.">
            <Row
              label="Enable quiet hours"
              hint="Use this to prevent notifications at night."
              right={
                <Switch
                  checked={settings.quietHoursEnabled}
                  onChange={(v) => setSettings({ ...settings, quietHoursEnabled: v })}
                />
              }
            />

            <Divider />

            <div className={"grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2 " + (!settings.quietHoursEnabled ? "opacity-50" : "")}>
              <div>
                <div className="text-xs font-medium text-slate-700">Start</div>
                <div className="mt-2">
                  <TextInput
                    type="time"
                    value={settings.quietStart}
                    disabled={!settings.quietHoursEnabled}
                    onChange={(e) => setSettings({ ...settings, quietStart: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-700">End</div>
                <div className="mt-2">
                  <TextInput
                    type="time"
                    value={settings.quietEnd}
                    disabled={!settings.quietHoursEnabled}
                    onChange={(e) => setSettings({ ...settings, quietEnd: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Tip: Quiet hours support “wrap around midnight” schedules like 23:00 → 08:00.
            </div>
          </Card>

          <Card title="Snooze" description="Snooze pauses the reminder and notifies you again after the selected delay.">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm font-medium text-slate-900">Snooze for</div>
              <NumberInput
                type="number"
                min={1}
                max={120}
                value={settings.snoozeMinutes}
                onChange={(e) => setSettings({ ...settings, snoozeMinutes: Number(e.target.value) })}
              />
              <div className="text-sm text-slate-700">minutes</div>
            </div>
            {!snoozeValid ? (
              <div className="mt-2 text-xs text-rose-700">Snooze must be between 1 and 120 minutes.</div>
            ) : null}
          </Card>

          <Card title="Test" description="Use this to verify notifications appear correctly on your system.">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              onClick={() => {
                chrome.notifications.create(
                  "TEST_WATER",
                  {
                    type: "basic",
                    iconUrl: chrome.runtime.getURL("icon.png"),
                    title: "Test notification",
                    message: "This is how reminders will appear.",
                    priority: 2
                  },
                  () => {
                    if (chrome.runtime.lastError) {
                      console.error("Notification error:", chrome.runtime.lastError.message);
                    } else {
                      console.log("Test notification created");
                    }
                  }
                );
              }}
            >
              Send test notification
            </button>
            <div className="mt-2 text-xs text-slate-500">
              If you do not see a banner, check Windows notification banners for the Brave/Chrome app.
            </div>
          </Card>

          <footer className="pt-2 text-xs text-slate-400">
            All settings are stored locally via browser storage. No data is sent to external servers.
          </footer>
        </main>
      </div>
    </div>
  );
}

function FixedTimesEditor(props: { fixedTimes: string[]; onChange: (times: string[]) => void }) {
  const { fixedTimes, onChange } = props;

  function addTime() {
    onChange([...fixedTimes, "10:00"]);
  }

  function updateTime(index: number, value: string) {
    const copy = fixedTimes.slice();
    copy[index] = value;
    onChange(copy);
  }

  function removeTime(index: number) {
    const copy = fixedTimes.slice();
    copy.splice(index, 1);
    onChange(copy);
  }

  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-slate-900">Daily times</div>
          <div className="mt-0.5 text-xs text-slate-500">Add one or more times (HH:mm).</div>
        </div>
        <button
          type="button"
          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          onClick={addTime}
        >
          Add time
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {fixedTimes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
            No times added yet.
          </div>
        ) : null}

        {fixedTimes.map((t, idx) => (
          <div key={`${t}-${idx}`} className="flex items-center gap-2">
            <input
              className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              type="time"
              value={t}
              onChange={(e) => updateTime(idx, e.target.value)}
            />
            <button
              type="button"
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50"
              onClick={() => removeTime(idx)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
