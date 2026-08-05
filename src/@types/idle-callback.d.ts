// React Native polyfills requestIdleCallback/cancelIdleCallback as globals
// (see react-native/Libraries/Core/Timers/JSTimers.js), but the project's
// tsconfig excludes the "dom" lib, so TypeScript doesn't know about them.
type IdleDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

declare function requestIdleCallback(
  callback: (deadline: IdleDeadline) => void,
  options?: { timeout: number },
): number;

declare function cancelIdleCallback(handle: number): void;
