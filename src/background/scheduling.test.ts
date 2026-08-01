import {
  describe,
  expect,
  it
} from "vitest";
import {
  createPauseUntil,
  getNextFixedDate,
  getTomorrowResumeDate,
  isInQuietHours,
  isPauseActive
} from "./scheduling";

function createLocalDate(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number
): Date {
  return new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    0,
    0
  );
}

describe("getNextFixedDate", () => {
  it("returns the next future time on the same day", () => {
    const now = createLocalDate(
      2026,
      8,
      1,
      9,
      30
    );

    const result = getNextFixedDate(
      now,
      ["10:00", "12:30", "15:00"]
    );

    expect(result).toEqual(
      createLocalDate(
        2026,
        8,
        1,
        10,
        0
      )
    );
  });

  it("moves past and current times to the next day", () => {
    const now = createLocalDate(
      2026,
      8,
      1,
      15,
      0
    );

    const result = getNextFixedDate(
      now,
      ["10:00", "15:00"]
    );

    expect(result).toEqual(
      createLocalDate(
        2026,
        8,
        2,
        10,
        0
      )
    );
  });

  it("selects the earliest candidate from unsorted times", () => {
    const now = createLocalDate(
      2026,
      8,
      1,
      8,
      0
    );

    const result = getNextFixedDate(
      now,
      ["15:00", "09:30", "12:00"]
    );

    expect(result).toEqual(
      createLocalDate(
        2026,
        8,
        1,
        9,
        30
      )
    );
  });

  it("ignores malformed values when a valid time exists", () => {
    const now = createLocalDate(
      2026,
      8,
      1,
      8,
      0
    );

    const result = getNextFixedDate(
      now,
      ["invalid", "12", "10:30"]
    );

    expect(result).toEqual(
      createLocalDate(
        2026,
        8,
        1,
        10,
        30
      )
    );
  });

  it("returns null when no valid times exist", () => {
    const now = createLocalDate(
      2026,
      8,
      1,
      8,
      0
    );

    const result = getNextFixedDate(
      now,
      ["invalid", "12", "hour:minute"]
    );

    expect(result).toBeNull();
  });
});

describe("isInQuietHours", () => {
  it("returns false when quiet hours are disabled", () => {
    const result = isInQuietHours(
      {
        quietHoursEnabled: false,
        quietStart: "23:30",
        quietEnd: "08:00"
      },
      createLocalDate(
        2026,
        8,
        1,
        23,
        45
      )
    );

    expect(result).toBe(false);
  });

  it("returns true inside a same-day quiet-hours range", () => {
    const result = isInQuietHours(
      {
        quietHoursEnabled: true,
        quietStart: "13:00",
        quietEnd: "17:00"
      },
      createLocalDate(
        2026,
        8,
        1,
        15,
        0
      )
    );

    expect(result).toBe(true);
  });

  it("includes the start time and excludes the end time", () => {
    const settings = {
      quietHoursEnabled: true,
      quietStart: "13:00",
      quietEnd: "17:00"
    };

    expect(
      isInQuietHours(
        settings,
        createLocalDate(
          2026,
          8,
          1,
          13,
          0
        )
      )
    ).toBe(true);

    expect(
      isInQuietHours(
        settings,
        createLocalDate(
          2026,
          8,
          1,
          17,
          0
        )
      )
    ).toBe(false);
  });

  it("supports overnight quiet hours before and after midnight", () => {
    const settings = {
      quietHoursEnabled: true,
      quietStart: "23:30",
      quietEnd: "08:00"
    };

    expect(
      isInQuietHours(
        settings,
        createLocalDate(
          2026,
          8,
          1,
          23,
          45
        )
      )
    ).toBe(true);

    expect(
      isInQuietHours(
        settings,
        createLocalDate(
          2026,
          8,
          2,
          7,
          30
        )
      )
    ).toBe(true);
  });

  it("returns false outside an overnight range", () => {
    const result = isInQuietHours(
      {
        quietHoursEnabled: true,
        quietStart: "23:30",
        quietEnd: "08:00"
      },
      createLocalDate(
        2026,
        8,
        1,
        12,
        0
      )
    );

    expect(result).toBe(false);
  });

  it("returns false for malformed quiet-hour values", () => {
    const result = isInQuietHours(
      {
        quietHoursEnabled: true,
        quietStart: "invalid",
        quietEnd: "08:00"
      },
      createLocalDate(
        2026,
        8,
        1,
        7,
        0
      )
    );

    expect(result).toBe(false);
  });

  it("treats identical start and end times as inactive", () => {
    const result = isInQuietHours(
      {
        quietHoursEnabled: true,
        quietStart: "08:00",
        quietEnd: "08:00"
      },
      createLocalDate(
        2026,
        8,
        1,
        8,
        0
      )
    );

    expect(result).toBe(false);
  });
});

describe("createPauseUntil", () => {
  it("creates a pause using the requested duration", () => {
    const now = createLocalDate(
      2026,
      8,
      1,
      14,
      0
    ).getTime();

    const result = createPauseUntil(
      now,
      30
    );

    expect(result).toBe(
      createLocalDate(
        2026,
        8,
        1,
        14,
        30
      ).getTime()
    );
  });

  it("uses a minimum duration of one minute", () => {
    const now = createLocalDate(
      2026,
      8,
      1,
      14,
      0
    ).getTime();

    const result = createPauseUntil(
      now,
      0
    );

    expect(result).toBe(
      now + 60_000
    );
  });
});

describe("isPauseActive", () => {
  it("returns true when the pause expires in the future", () => {
    const now = createLocalDate(
      2026,
      8,
      1,
      14,
      0
    ).getTime();

    const pauseUntil = createLocalDate(
      2026,
      8,
      1,
      15,
      0
    ).getTime();

    expect(
      isPauseActive(
        pauseUntil,
        now
      )
    ).toBe(true);
  });

  it("returns false when the pause has expired", () => {
    const now = createLocalDate(
      2026,
      8,
      1,
      15,
      0
    ).getTime();

    const pauseUntil = createLocalDate(
      2026,
      8,
      1,
      14,
      30
    ).getTime();

    expect(
      isPauseActive(
        pauseUntil,
        now
      )
    ).toBe(false);
  });

  it("returns false when no pause exists", () => {
    expect(
      isPauseActive(
        null,
        Date.now()
      )
    ).toBe(false);
  });

  it("treats the exact expiration time as expired", () => {
    const expiration = createLocalDate(
      2026,
      8,
      1,
      15,
      0
    ).getTime();

    expect(
      isPauseActive(
        expiration,
        expiration
      )
    ).toBe(false);
  });
});

describe("getTomorrowResumeDate", () => {
  it("creates a resume time for the following day", () => {
    const now = createLocalDate(
      2026,
      8,
      1,
      17,
      30
    );

    const result = getTomorrowResumeDate(
      now,
      "08:00"
    );

    expect(result).toEqual(
      createLocalDate(
        2026,
        8,
        2,
        8,
        0
      )
    );
  });

  it("supports a custom tomorrow resume time", () => {
    const now = createLocalDate(
      2026,
      8,
      1,
      17,
      30
    );

    const result = getTomorrowResumeDate(
      now,
      "09:45"
    );

    expect(result).toEqual(
      createLocalDate(
        2026,
        8,
        2,
        9,
        45
      )
    );
  });

  it("falls back to 8 AM for an invalid resume time", () => {
    const now = createLocalDate(
      2026,
      8,
      1,
      17,
      30
    );

    const result = getTomorrowResumeDate(
      now,
      "invalid"
    );

    expect(result).toEqual(
      createLocalDate(
        2026,
        8,
        2,
        8,
        0
      )
    );
  });
});
