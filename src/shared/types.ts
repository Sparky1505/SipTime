export type ReminderType = "INTERVAL" | "FIXED_TIMES";

export interface ReminderSettings {
  enabled: boolean;
  reminderType: ReminderType;

  intervalMinutes: number; // INTERVAL
  fixedTimes: string[]; // FIXED_TIMES, format "HH:mm"

  quietHoursEnabled: boolean;
  quietStart: string; // "23:30"
  quietEnd: string;   // "08:00"

  snoozeMinutes: number; // default snooze
}
