import { useEffect, useState } from "react";
import { getNextFireAt, getSettings } from "../shared/storage";
import type { ReminderSettings } from "../shared/types";

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium " +
        (enabled ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")
      }
    >
      <span className={"mr-1.5 inline-block h-2 w-2 rounded-full " + (enabled ? "bg-emerald-500" : "bg-rose-500")} />
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

function LabelValue(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{props.label}</span>
      <span className="text-sm font-medium text-slate-900">{props.value}</span>
    </div>
  );
}

export default function PopupApp() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [nextFireAt, setNext] = useState<number | null>(null);

  async function load() {
    const s = await getSettings();
    const n = await getNextFireAt();
    setSettings(s);
    setNext(n);
  }

  useEffect(() => {
    load();

    const handler: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, area) => {
      if (area !== "sync") return;

      if (changes.waterReminderSettings) {
        setSettings(changes.waterReminderSettings.newValue as ReminderSettings);
      }
      if (changes.waterReminderNextFireAt) {
        const v = changes.waterReminderNextFireAt.newValue;
        setNext(typeof v === "number" ? v : null);
      }
    };

    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  const nextText = nextFireAt
    ? new Date(nextFireAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

  const modeText =
    settings?.reminderType === "INTERVAL"
      ? `Every ${settings.intervalMinutes} min`
      : `Fixed times (${settings?.fixedTimes?.length ?? 0})`;

  return (
    <div className="w-[360px] bg-slate-50 p-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white">
              <span className="text-sm font-semibold">W</span>
            </div>
            <div>
              <div className="text-base font-semibold text-slate-900">SipTime</div>
              <div className="text-xs text-slate-500">Hydration reminders that fit your day</div>
            </div>
          </div>

          {settings ? <StatusPill enabled={settings.enabled} /> : null}
        </div>

        <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <LabelValue label="Mode" value={settings ? modeText : "Loading…"} />
          <LabelValue label="Next reminder" value={settings?.enabled ? nextText : "—"} />
        </div>

        <div className="mt-4 space-y-2">
          <button
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={() => chrome.runtime.openOptionsPage()}
          >
            Open Settings
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              onClick={load}
            >
              Refresh
            </button>

            <button
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              onClick={async () => {
                // quick toggle enable/disable without going to options (optional)
                if (!settings) return;
                await chrome.storage.sync.set({
                  waterReminderSettings: { ...settings, enabled: !settings.enabled }
                });
              }}
            >
              {settings?.enabled ? "Disable" : "Enable"}
            </button>
          </div>

          <div className="pt-1 text-center text-xs text-slate-400">
            Tip: set Quiet Hours to avoid night reminders
          </div>
        </div>
      </div>
    </div>
  );
}
