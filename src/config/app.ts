import { version } from '../../package.json';

/**
 * The one place a version number is written is `package.json`. Everything else
 * reads it.
 *
 * It used to be copied by hand into four files, and they disagreed: the app,
 * `package.json` and both platforms all said 0.6.0 while the newest tag said
 * v0.7.2 with the tree seventy-seven commits past it. Nobody noticed, because
 * nothing compares them — a wrong version number builds, ships, and shows up in
 * the settings footer and every exported PDF looking perfectly normal.
 *
 * Importing `package.json` costs about 3.5 KB in the bundle, which buys a layer
 * where drift is impossible rather than merely detected. Android reads the same
 * file in `build.gradle`; Xcode cannot read JSON, so a script writes its two
 * fields and `__tests__/appVersion.test.ts` fails when they fall behind.
 */
export const APP_VERSION: string = version;
export const APP_VERSION_LABEL = `v${APP_VERSION}`;
