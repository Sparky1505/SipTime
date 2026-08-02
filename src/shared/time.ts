export type TimePeriod =
  | "AM"
  | "PM";

export type TimeWheelValue = {
  hour: number;
  minute: number;
  period: TimePeriod;
};

export const HOUR_OPTIONS =
  Array.from(
    {
      length: 12
    },
    (_, index) => index + 1
  );

export const MINUTE_OPTIONS =
  Array.from(
    {
      length: 60
    },
    (_, index) => index
  );

export const PERIOD_OPTIONS:
  readonly TimePeriod[] = [
    "AM",
    "PM"
  ];

export function isValidStoredTime(
  value: string
): boolean {
  const match =
    /^(\d{2}):(\d{2})$/.exec(
      value
    );

  if (!match) {
    return false;
  }

  const hours =
    Number(match[1]);

  const minutes =
    Number(match[2]);

  return (
    Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  );
}

export function parseStoredTime(
  value: string
): TimeWheelValue | null {
  if (!isValidStoredTime(value)) {
    return null;
  }

  const [
    storedHours,
    storedMinutes
  ] = value
    .split(":")
    .map(Number);

  const period: TimePeriod =
    storedHours >= 12
      ? "PM"
      : "AM";

  const twelveHourValue =
    storedHours % 12;

  return {
    hour:
      twelveHourValue === 0
        ? 12
        : twelveHourValue,
    minute: storedMinutes,
    period
  };
}

export function toStoredTime(
  value: TimeWheelValue
): string {
  if (
    !Number.isInteger(value.hour) ||
    value.hour < 1 ||
    value.hour > 12
  ) {
    throw new RangeError(
      "Hour must be between 1 and 12."
    );
  }

  if (
    !Number.isInteger(
      value.minute
    ) ||
    value.minute < 0 ||
    value.minute > 59
  ) {
    throw new RangeError(
      "Minute must be between 0 and 59."
    );
  }

  let twentyFourHourValue =
    value.hour % 12;

  if (value.period === "PM") {
    twentyFourHourValue += 12;
  }

  return [
    String(
      twentyFourHourValue
    ).padStart(2, "0"),
    String(value.minute).padStart(
      2,
      "0"
    )
  ].join(":");
}

export function formatStoredTime12Hour(
  value: string
): string {
  const parsed =
    parseStoredTime(value);

  if (!parsed) {
    return value;
  }

  return `${String(
    parsed.hour
  ).padStart(2, "0")}:${String(
    parsed.minute
  ).padStart(
    2,
    "0"
  )} ${parsed.period}`;
}
