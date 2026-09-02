import { version } from '../../package.json';

/**
 * The version lives only in `package.json`; everything reads from here. It was
 * hand-copied into four files that drifted (app said 0.6.0 while the tag was
 * v0.7.2). Android reads the same file in `build.gradle`; Xcode can't read
 * JSON, so a script writes its two fields and `appVersion.test.ts` guards them.
 */
export const APP_VERSION: string = version;
export const APP_VERSION_LABEL = `v${APP_VERSION}`;
