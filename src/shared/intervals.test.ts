import {
  describe,
  expect,
  it
} from "vitest";
import {
  formatIntervalDuration,
  formatIntervalPresetLabel,
  INTERVAL_PRESETS,
  isIntervalPreset
} from "./intervals";

describe("INTERVAL_PRESETS", () => {
  it("contains the supported quick presets", () => {
    expect(
      [...INTERVAL_PRESETS]
    ).toEqual([
      30,
      45,
      60,
      90
    ]);
  });
});

describe("isIntervalPreset", () => {
  it("returns true for a supported preset", () => {
    expect(
      isIntervalPreset(45)
    ).toBe(true);
  });

  it("returns false for a custom interval", () => {
    expect(
      isIntervalPreset(75)
    ).toBe(false);
  });
});

describe("formatIntervalDuration", () => {
  it("formats a duration below one hour", () => {
    expect(
      formatIntervalDuration(45)
    ).toBe("45 minutes");
  });

  it("formats exactly one hour", () => {
    expect(
      formatIntervalDuration(60)
    ).toBe("1 hour");
  });

  it("formats hours and remaining minutes", () => {
    expect(
      formatIntervalDuration(90)
    ).toBe(
      "1 hour 30 minutes"
    );
  });

  it("formats plural hours", () => {
    expect(
      formatIntervalDuration(120)
    ).toBe("2 hours");
  });
});

describe("formatIntervalPresetLabel", () => {
  it("creates compact preset labels", () => {
    expect(
      formatIntervalPresetLabel(30)
    ).toBe("30 min");

    expect(
      formatIntervalPresetLabel(60)
    ).toBe("1 hr");

    expect(
      formatIntervalPresetLabel(90)
    ).toBe("1 hr 30 min");
  });
});