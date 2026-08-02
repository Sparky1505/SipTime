import {
  describe,
  expect,
  it
} from "vitest";
import {
  formatStoredTime12Hour,
  HOUR_OPTIONS,
  isValidStoredTime,
  MINUTE_OPTIONS,
  parseStoredTime,
  PERIOD_OPTIONS,
  toStoredTime
} from "./time";

describe("time options", () => {
  it("provides twelve hour options", () => {
    expect(HOUR_OPTIONS).toEqual([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]);
  });

  it("provides every minute option", () => {
    expect(
      MINUTE_OPTIONS
    ).toHaveLength(60);

    expect(
      MINUTE_OPTIONS[0]
    ).toBe(0);

    expect(
      MINUTE_OPTIONS[59]
    ).toBe(59);
  });

  it("provides AM and PM options", () => {
    expect(PERIOD_OPTIONS).toEqual([
      "AM",
      "PM"
    ]);
  });
});

describe("isValidStoredTime", () => {
  it("accepts a valid 24-hour time", () => {
    expect(
      isValidStoredTime("23:59")
    ).toBe(true);
  });

  it("rejects invalid times", () => {
    expect(
      isValidStoredTime("24:00")
    ).toBe(false);

    expect(
      isValidStoredTime("12:60")
    ).toBe(false);

    expect(
      isValidStoredTime("9:30")
    ).toBe(false);

    expect(
      isValidStoredTime("invalid")
    ).toBe(false);
  });
});

describe("parseStoredTime", () => {
  it("converts midnight to 12 AM", () => {
    expect(
      parseStoredTime("00:00")
    ).toEqual({
      hour: 12,
      minute: 0,
      period: "AM"
    });
  });

  it("converts noon to 12 PM", () => {
    expect(
      parseStoredTime("12:00")
    ).toEqual({
      hour: 12,
      minute: 0,
      period: "PM"
    });
  });

  it("converts an afternoon time", () => {
    expect(
      parseStoredTime("14:10")
    ).toEqual({
      hour: 2,
      minute: 10,
      period: "PM"
    });
  });

  it("returns null for an invalid value", () => {
    expect(
      parseStoredTime("invalid")
    ).toBeNull();
  });
});

describe("toStoredTime", () => {
  it("converts 12 AM to midnight", () => {
    expect(
      toStoredTime({
        hour: 12,
        minute: 0,
        period: "AM"
      })
    ).toBe("00:00");
  });

  it("converts 12 PM to noon", () => {
    expect(
      toStoredTime({
        hour: 12,
        minute: 0,
        period: "PM"
      })
    ).toBe("12:00");
  });

  it("converts an evening time", () => {
    expect(
      toStoredTime({
        hour: 11,
        minute: 59,
        period: "PM"
      })
    ).toBe("23:59");
  });

  it("rejects an invalid hour", () => {
    expect(() =>
      toStoredTime({
        hour: 13,
        minute: 0,
        period: "PM"
      })
    ).toThrow(
      "Hour must be between 1 and 12."
    );
  });

  it("rejects an invalid minute", () => {
    expect(() =>
      toStoredTime({
        hour: 2,
        minute: 60,
        period: "PM"
      })
    ).toThrow(
      "Minute must be between 0 and 59."
    );
  });
});

describe("formatStoredTime12Hour", () => {
  it("creates a padded 12-hour display value", () => {
    expect(
      formatStoredTime12Hour(
        "14:10"
      )
    ).toBe("02:10 PM");
  });

  it("preserves invalid source values", () => {
    expect(
      formatStoredTime12Hour(
        "invalid"
      )
    ).toBe("invalid");
  });
});
