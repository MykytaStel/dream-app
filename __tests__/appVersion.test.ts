import { readFileSync } from 'fs';
import { join } from 'path';
import { APP_VERSION, APP_VERSION_LABEL } from '../src/config/app';
// Required rather than imported: the script is CommonJS so that it can be both
// a CLI and something a test can read the arithmetic out of.
const { buildNumberFor } = require('../scripts/sync-app-version.js') as {
  buildNumberFor: (version: string) => number;
};

/**
 * One version, four places that show it.
 *
 * They disagreed for months. `package.json`, the settings footer, Android and
 * iOS all said 0.6.0 while the newest tag said v0.7.2 and the tree was
 * seventy-seven commits past it — and on top of that the two build numbers were
 * different from each other, 39 against 38, for what was supposed to be one
 * build.
 *
 * Nothing catches this on its own. A wrong version compiles, installs, and
 * appears in the settings footer and every exported PDF looking exactly as
 * legitimate as a right one. It only surfaces at the store upload, or in a bug
 * report that names a version that never existed.
 *
 * Two of the four now read `package.json` directly and cannot drift.
 * This covers the two that cannot: the iOS project, and the arithmetic both
 * platforms use to turn a version into a build number.
 */

const root = join(__dirname, '..');

const packageJson = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8'),
) as { version: string };

const buildGradle = readFileSync(
  join(root, 'android', 'app', 'build.gradle'),
  'utf8',
);

const pbxproj = readFileSync(
  join(root, 'ios', 'DreamApp.xcodeproj', 'project.pbxproj'),
  'utf8',
);

function settingValues(name: string): string[] {
  const pattern = new RegExp(`${name} = ([^;]+);`, 'g');
  return [...pbxproj.matchAll(pattern)].map(match => match[1].trim());
}

describe('app version', () => {
  test('package.json holds a plain semver', () => {
    // Neither store accepts a pre-release suffix in these fields, and the
    // build-number arithmetic has nowhere to put one.
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('the app shows the version from package.json', () => {
    expect(APP_VERSION).toBe(packageJson.version);
    expect(APP_VERSION_LABEL).toBe(`v${packageJson.version}`);
  });

  test('Android reads package.json rather than repeating it', () => {
    // The point is the absence of a literal. A version copied back into this
    // file would pass a comparison the day it was written and fail everyone
    // after.
    expect(buildGradle).toContain('file("../../package.json")');
    expect(buildGradle).toContain('versionName appVersionName');
    expect(buildGradle).toContain('versionCode appVersionCode');
    expect(buildGradle).not.toMatch(/versionName\s+"/);
    expect(buildGradle).not.toMatch(/versionCode\s+\d/);
  });

  test('iOS carries the same version', () => {
    const marketing = settingValues('MARKETING_VERSION').filter(
      // The widget extension is a separate bundle that ships inside the app and
      // is never listed on its own, so it keeps its own 1.0.
      value => value !== '1.0',
    );

    expect(marketing.length).toBeGreaterThan(0);
    for (const value of marketing) {
      expect(value).toBe(packageJson.version);
    }
  });

  test('both platforms derive the same build number', () => {
    const expected = buildNumberFor(packageJson.version);

    const project = settingValues('CURRENT_PROJECT_VERSION').filter(
      value => value !== '1',
    );

    expect(project.length).toBeGreaterThan(0);
    for (const value of project) {
      expect(Number(value)).toBe(expected);
    }

    // Android computes it in Gradle from the same three numbers. Checking the
    // arithmetic here rather than the result, because Gradle's copy only runs
    // during a build and a test that cannot see it would be checking nothing.
    expect(buildGradle).toContain(
      'parts[0] * 10000 + parts[1] * 100 + parts[2]',
    );
  });

  test('the build number only ever increases', () => {
    const ordered = [
      '0.6.0',
      '0.7.2',
      '0.8.0',
      '0.9.99',
      '1.0.0',
      '1.0.1',
      '10.0.0',
    ];

    const numbers = ordered.map(buildNumberFor);
    const sorted = [...numbers].sort((a, b) => a - b);

    expect(numbers).toEqual(sorted);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  test('a version the arithmetic cannot represent is refused', () => {
    // Rather than silently producing a build number that goes backwards, which
    // Play rejects at upload with no explanation of why.
    expect(() => buildNumberFor('0.100.0')).toThrow(/below 100/);
    expect(() => buildNumberFor('1.0.100')).toThrow(/below 100/);
    expect(() => buildNumberFor('1.2.3-beta.1')).toThrow(/MAJOR\.MINOR\.PATCH/);
    expect(() => buildNumberFor('1.2')).toThrow(/MAJOR\.MINOR\.PATCH/);
  });

  test('the build number clears every number either platform has shipped', () => {
    // Android was on 39 and iOS on 38 before this was derived. A derived number
    // lower than those would be rejected as a downgrade, so the floor matters.
    expect(buildNumberFor(packageJson.version)).toBeGreaterThan(39);
  });
});
