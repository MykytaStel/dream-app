import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * The most expensive mistake available in this repository.
 *
 * React Native's template points the release build at `signingConfigs.debug` —
 * a keystore committed to the repo whose password is the public string
 * 'android'. It builds, it installs, it looks finished. Publish once under that
 * key and Play binds the listing to it permanently: the app can never be
 * updated, because updates must be signed with the same key everyone has.
 *
 * It cannot be caught by running the app, and a release build succeeds either
 * way. So it is checked here, by reading the file.
 */

const BUILD_GRADLE = join(__dirname, '..', 'android', 'app', 'build.gradle');

const gradle = readFileSync(BUILD_GRADLE, 'utf8');

/**
 * The file with comments removed.
 *
 * Needed because the comment explaining this very rule quotes the string the
 * rule forbids. Matching raw text made the test fail on its own explanation —
 * the check has to read code, not prose.
 */
const code = gradle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

/** The text inside `buildTypes { release { ... } }`. */
function releaseBuildType(): string {
  const start = code.indexOf('buildTypes');
  expect(start).toBeGreaterThan(-1);

  const release = code.indexOf('release {', start);
  expect(release).toBeGreaterThan(-1);

  let depth = 0;
  for (let index = code.indexOf('{', release); index < code.length; index++) {
    if (code[index] === '{') {
      depth += 1;
    } else if (code[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return code.slice(release, index + 1);
      }
    }
  }

  throw new Error('release build type block is not closed');
}

describe('Android release signing', () => {
  test('the release build is never signed with the debug key', () => {
    expect(releaseBuildType()).not.toContain('signingConfigs.debug');
  });

  test('release signing is conditional on a keystore actually existing', () => {
    // Without a keystore the artifact must come out unsigned — which cannot be
    // installed or uploaded, so the failure happens before any damage.
    expect(releaseBuildType()).toContain('hasReleaseKeystore');
  });

  test('no key material is written into the build file', () => {
    // Everything about the real key comes from the environment. A password
    // committed here would be exactly as public as the debug one.
    for (const variable of [
      'ANDROID_KEYSTORE_PATH',
      'ANDROID_KEYSTORE_PASSWORD',
      'ANDROID_KEY_ALIAS',
      'ANDROID_KEY_PASSWORD',
    ]) {
      expect(code).toContain(`System.getenv('${variable}')`);
    }

    // And nothing that looks like a literal password sits beside them.
    expect(releaseBuildType()).not.toMatch(/storePassword\s+'/);
  });

  test('the debug keystore is still only used for debug', () => {
    // Debug builds do need it, and removing it would break every local run.
    expect(gradle).toContain("storeFile file('debug.keystore')");
  });
});

/**
 * Shrinking is a setting that silently reverts.
 *
 * `enableProguardInReleaseBuilds` ships as `false` in the React Native
 * template, and turning it on is worth 5.1 MB of every download — a quarter of
 * the app. Nothing about a build failing or an app crashing would tell anyone
 * it had gone back to `false`; the release would simply be five megabytes
 * bigger than it needed to be, for as long as nobody measured again.
 *
 * The keep rules are pinned alongside it for the same reason. Without the two
 * attributes below, R8 renames classes and drops line numbers, and every crash
 * report arrives as anonymous frames — the shrinking still works, so the loss
 * shows up only when someone is trying to read a stack trace and it is already
 * too late.
 */
describe('release builds are shrunk', () => {
  test('R8 is on', () => {
    expect(code).toMatch(/enableProguardInReleaseBuilds\s*=\s*true/);
  });

  test('the release build type actually applies it', () => {
    expect(releaseBuildType()).toContain(
      'minifyEnabled enableProguardInReleaseBuilds',
    );
  });

  test('shrinking keeps crash reports symbolicatable', () => {
    const rules = readFileSync(
      join(__dirname, '..', 'android', 'app', 'proguard-rules.pro'),
      'utf8',
    );

    expect(rules).toContain('-keepattributes SourceFile,LineNumberTable');
    expect(rules).toContain('-renamesourcefileattribute SourceFile');
  });
});

/**
 * Machine-specific paths are invisible to whoever committed them.
 *
 * `nodeExecutableAndArgs` held an absolute path into one developer's nvm
 * install. Every local build worked; the first CI run that ever compiled
 * Android failed on it, and so would any second developer's checkout. Nothing
 * short of building somewhere else can catch this, so it is pinned here.
 */
describe('build files are portable', () => {
  test('no absolute path into a home directory', () => {
    expect(code).not.toMatch(/["'](\/Users\/|\/home\/|C:\\)/);
  });

  test('the node binary comes from the environment', () => {
    expect(code).toContain("System.getenv('NODE_BINARY')");
  });
});
