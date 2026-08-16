/**
 * The id that ties `capture_started` to the `dream_saved` it produced.
 *
 * The two events fire from different places — the capture screen starts one,
 * the composer's save finishes it — so neither can own the id alone. Without
 * the correlation, §9's "median time to first Save" is not computable: nothing
 * says which save belongs to which capture.
 *
 * Module-level rather than context because only one capture is ever in flight,
 * and threading a prop through the composer for an analytics concern would put
 * measurement into the shape of the UI.
 */
let captureSessionId: string | null = null;
let counter = 0;

function createCaptureSessionId() {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}`;
}

/** Called when a capture screen opens. Returns the new session's id. */
export function startCaptureSession(): string {
  captureSessionId = createCaptureSessionId();
  return captureSessionId;
}

/**
 * The id of the capture in flight.
 *
 * Only creates ask for this. An edit has no capture to correlate with, and
 * calling this there would hand it whichever capture happened to run last in
 * the same process — a join that looks valid and is not. The composer omits
 * the field on edits instead.
 */
export function getCaptureSessionId(): string {
  if (!captureSessionId) {
    captureSessionId = createCaptureSessionId();
  }

  return captureSessionId;
}

export function __resetCaptureSessionForTests() {
  captureSessionId = null;
  counter = 0;
}
