export type InstallationReason =
  | "install"
  | "update"
  | "chrome_update"
  | "shared_module_update";

export function shouldStartOnboarding(
  reason: InstallationReason
): boolean {
  return reason === "install";
}

export function resolveOnboardingCompleted(
  storedValue: unknown
): boolean {
  return storedValue !== false;
}

export function shouldShowOnboarding(
  onboardingCompleted: boolean
): boolean {
  return !onboardingCompleted;
}