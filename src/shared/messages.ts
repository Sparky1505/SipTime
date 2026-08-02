export const SKIP_NEXT_REMINDER_MESSAGE =
  "SKIP_NEXT_REMINDER";

export type SkipNextReminderMessage = {
  type: typeof SKIP_NEXT_REMINDER_MESSAGE;
};

export type SkipNextReminderResponse = {
  ok: boolean;
  nextFireAt: number | null;
  error?: string;
};

export function isSkipNextReminderMessage(
  message: unknown
): message is SkipNextReminderMessage {
  if (
    typeof message !== "object" ||
    message === null
  ) {
    return false;
  }

  return (
    "type" in message &&
    message.type ===
      SKIP_NEXT_REMINDER_MESSAGE
  );
}