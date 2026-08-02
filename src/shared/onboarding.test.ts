import {
  describe,
  expect,
  it
} from "vitest";
import {
  resolveOnboardingCompleted,
  shouldShowOnboarding,
  shouldStartOnboarding
} from "./onboarding";

describe("shouldStartOnboarding", () => {
  it("returns true for a new installation", () => {
    expect(
      shouldStartOnboarding("install")
    ).toBe(true);
  });

  it("returns false for an extension update", () => {
    expect(
      shouldStartOnboarding("update")
    ).toBe(false);
  });

  it("returns false for a Chrome update", () => {
    expect(
      shouldStartOnboarding(
        "chrome_update"
      )
    ).toBe(false);
  });

  it("returns false for a shared-module update", () => {
    expect(
      shouldStartOnboarding(
        "shared_module_update"
      )
    ).toBe(false);
  });
});

describe("resolveOnboardingCompleted", () => {
  it("preserves an incomplete onboarding state", () => {
    expect(
      resolveOnboardingCompleted(false)
    ).toBe(false);
  });

  it("preserves a completed onboarding state", () => {
    expect(
      resolveOnboardingCompleted(true)
    ).toBe(true);
  });

  it("treats a missing value as completed", () => {
    expect(
      resolveOnboardingCompleted(undefined)
    ).toBe(true);
  });

  it("treats an unexpected value as completed", () => {
    expect(
      resolveOnboardingCompleted("invalid")
    ).toBe(true);
  });
});

describe("shouldShowOnboarding", () => {
  it("shows onboarding when setup is incomplete", () => {
    expect(
      shouldShowOnboarding(false)
    ).toBe(true);
  });

  it("hides onboarding after setup is complete", () => {
    expect(
      shouldShowOnboarding(true)
    ).toBe(false);
  });
});