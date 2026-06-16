/**
 * Haptic feedback utilities using the Vibration API.
 * Only works on supported devices (Android Chrome, some iOS PWAs).
 * Silently no-ops on unsupported browsers.
 */

const isSupported = typeof navigator !== "undefined" && "vibrate" in navigator;

/** Light tap feedback — navigation, toggles */
export function hapticTap() {
  if (isSupported) navigator.vibrate(10);
}

/** Medium feedback — button press, form submit */
export function hapticImpact() {
  if (isSupported) navigator.vibrate(20);
}

/** Heavy feedback — success, confirmation */
export function hapticSuccess() {
  if (isSupported) navigator.vibrate([15, 50, 15]);
}

/** Error feedback — vibration pattern */
export function hapticError() {
  if (isSupported) navigator.vibrate([30, 50, 30, 50, 30]);
}

/** Selection changed feedback — picker, tab switch */
export function hapticSelection() {
  if (isSupported) navigator.vibrate(5);
}