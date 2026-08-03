/**
 * The hours when the room is dark and the phone is the brightest thing in it.
 *
 * This is not the same question as `isWakeCaptureWindow`, which asks whether
 * someone has probably just woken up and might want the morning flow. This one
 * asks whether the screen is about to be painful. The two overlap between four
 * and seven, which is exactly the moment this exists for: eyes that have been
 * closed for hours, a dream that is already fading, and a white screen a
 * decision away.
 *
 * Twenty-two to seven, and the wrap around midnight is why this is a function
 * rather than a comparison at the call site.
 */
export const NIGHT_CAPTURE_START_HOUR = 22;
export const NIGHT_CAPTURE_END_HOUR = 7;

export function isNightCaptureWindow(now = new Date()) {
  const hour = now.getHours();

  return hour >= NIGHT_CAPTURE_START_HOUR || hour < NIGHT_CAPTURE_END_HOUR;
}
