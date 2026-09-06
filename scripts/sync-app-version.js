#!/usr/bin/env node
/**
 * Writes the version from package.json into the one place that cannot read it.
 *
 * JavaScript imports package.json, and `android/app/build.gradle` parses it at
 * build time, so both are correct by construction. Xcode build settings are
 * neither JSON-aware nor scriptable without adding a build phase that shells
 * out — and a build phase depending on the developer's PATH is a bug this
 * repository has already had once, in `nodeExecutableAndArgs`. So the two iOS
 * fields are written here instead, and `__tests__/appVersion.test.ts` fails if
 * anyone forgets to run it.
 *
 *   yarn version:sync          write the current version into iOS
 *   yarn version:set 0.9.0     bump package.json, then write it everywhere
 *
 * CommonJS rather than ESM so the test can require `buildNumberFor` and check
 * the arithmetic directly. The rule it encodes — that a build number never goes
 * backwards — is worth a test, and a module the tests cannot load would not get
 * one.
 *
 * Both targets are written. The widget extension is never listed on its own,
 * but it ships *inside* the app bundle, and App Store Connect rejects an upload
 * where an embedded extension's CFBundleVersion or CFBundleShortVersionString
 * differ from the app's. So the widget's two fields track the app's rather than
 * keeping a separate 1.0 / 1 that only ever caused an upload to bounce.
 */

const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const root = join(__dirname, '..');
const packageJsonPath = join(root, 'package.json');
const pbxprojPath = join(root, 'ios', 'DreamApp.xcodeproj', 'project.pbxproj');

/** Semver with no pre-release or build metadata — the only shape both stores accept. */
const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

function buildNumberFor(version) {
  const match = VERSION_PATTERN.exec(String(version));
  if (!match) {
    throw new Error(
      `Version must be MAJOR.MINOR.PATCH with no suffix, got "${version}".`,
    );
  }

  const [, major, minor, patch] = match.map(Number);

  // Mirrors the derivation in android/app/build.gradle. Both stores need a
  // number that only ever increases, and this one does as long as minor and
  // patch stay below 100 — checked here rather than discovered at upload time.
  if (minor > 99 || patch > 99) {
    throw new Error(
      'Minor and patch must stay below 100 for the build number to keep ' +
        `increasing, got "${version}".`,
    );
  }

  return major * 10000 + minor * 100 + patch;
}

function readVersion() {
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')).version;
}

function setPackageVersion(version) {
  const raw = readFileSync(packageJsonPath, 'utf8');
  // Textual replacement rather than parse-and-stringify, which would reformat
  // the whole file and bury the one line that changed in a diff nobody reads.
  const next = raw.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`);

  if (next === raw) {
    throw new Error('Could not find a "version" field in package.json.');
  }

  writeFileSync(packageJsonPath, next);
}

/**
 * Rewrites every version field in the project — both the app target's and the
 * widget extension's, which must match it for the store to accept the upload.
 */
function syncIos(version, buildNumber) {
  const raw = readFileSync(pbxprojPath, 'utf8');

  let marketingCount = 0;
  let projectCount = 0;

  const next = raw
    .replace(/MARKETING_VERSION = [^;]+;/g, () => {
      marketingCount += 1;
      return `MARKETING_VERSION = ${version};`;
    })
    .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, () => {
      projectCount += 1;
      return `CURRENT_PROJECT_VERSION = ${buildNumber};`;
    });

  if (marketingCount === 0 || projectCount === 0) {
    throw new Error(
      `Found ${marketingCount} MARKETING_VERSION and ${projectCount} ` +
        'CURRENT_PROJECT_VERSION settings to write. The Xcode project layout ' +
        'changed; this script needs updating rather than skipping.',
    );
  }

  writeFileSync(pbxprojPath, next);
  return { marketingCount, projectCount };
}

function main() {
  const requested = process.argv[2];

  if (requested) {
    // Throws before anything is written if the shape is wrong.
    buildNumberFor(requested);
    setPackageVersion(requested);
  }

  const version = readVersion();
  const buildNumber = buildNumberFor(version);
  const { marketingCount, projectCount } = syncIos(version, buildNumber);

  console.log(
    `${version} (build ${buildNumber})\n` +
      '  package.json    source of truth\n' +
      '  JavaScript      imports it\n' +
      '  Android         build.gradle parses it\n' +
      `  iOS             ${marketingCount} marketing, ${projectCount} project settings written`,
  );
}

// Only when invoked directly, so requiring this from a test does not rewrite
// the repository underneath it.
if (require.main === module) {
  main();
}

module.exports = { buildNumberFor };
