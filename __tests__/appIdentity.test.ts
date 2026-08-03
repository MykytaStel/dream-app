import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * The identifiers that become permanent the moment the app is published.
 *
 * Every one of these shipped as a React Native template default and survived
 * for months: the iOS bundle id was `org.reactjs.native.example.DreamApp`,
 * which Apple will not accept; the name under the icon said "DreamApp" while
 * every string in the app said Kaleidoscope; and the App Group carried one
 * developer's personal handle.
 *
 * None of it is visible while working — a template identifier looks exactly
 * like a real one in a project file, and the app builds and runs perfectly.
 * It surfaced by launching the app and reading what the simulator reported.
 * So it is checked here instead.
 */

const root = join(__dirname, '..');
const read = (...parts: string[]) => readFileSync(join(root, ...parts), 'utf8');

export const APP_BUNDLE_ID = 'com.kaleidoscopedreams';

const pbxproj = read('ios', 'DreamApp.xcodeproj', 'project.pbxproj');
const appInfoPlist = read('ios', 'DreamApp', 'Info.plist');
const androidStrings = read(
  'android',
  'app',
  'src',
  'main',
  'res',
  'values',
  'strings.xml',
);
const buildGradle = read('android', 'app', 'build.gradle');

describe('app identity', () => {
  test('no React Native template identifier is left anywhere', () => {
    for (const file of [pbxproj, appInfoPlist]) {
      expect(file).not.toContain('org.reactjs.native.example');
    }
  });

  test('the widget bundle ships only widgets this app wrote', () => {
    // Xcode's widget template adds a Live Activity, a Control, and a
    // configuration intent alongside the real widget, and registers all of
    // them. They shipped for months: the Live Activity rendered
    // `Text("Hello \(emoji)")` on a cyan background, and the Control offered a
    // timer this app has never had. Nothing surfaces them while working —
    // they build, and the widgets a person actually placed look right.
    //
    // The extension uses a file-system synchronized group, so a file existing
    // in the folder is a file in the target. Absence is the assertion.
    const boilerplate = [
      'DreamWidgetExtensionLiveActivity.swift',
      'DreamWidgetExtensionControl.swift',
      'AppIntent.swift',
    ];

    for (const name of boilerplate) {
      expect(existsSync(join(root, 'ios', 'DreamWidgetExtension', name))).toBe(
        false,
      );
    }

    const bundle = read(
      'ios',
      'DreamWidgetExtension',
      'DreamWidgetExtensionBundle.swift',
    );

    expect(bundle).toContain('DreamWidget()');
    expect(bundle).toContain('DreamLastDreamWidget()');
    for (const name of ['LiveActivity', 'ExtensionControl']) {
      expect(bundle).not.toContain(name);
    }
  });

  test('iOS and Android publish under the same identifier', () => {
    expect(pbxproj).toContain(`PRODUCT_BUNDLE_IDENTIFIER = ${APP_BUNDLE_ID};`);
    expect(buildGradle).toContain(`applicationId "${APP_BUNDLE_ID}"`);
  });

  test('the widget extension sits under the app, not beside it', () => {
    // Apple requires an extension's identifier to be prefixed by its host app's.
    expect(pbxproj).toContain(
      `PRODUCT_BUNDLE_IDENTIFIER = ${APP_BUNDLE_ID}.widget;`,
    );
  });

  test('the name under the icon is the name the app calls itself', () => {
    expect(appInfoPlist).toContain('<string>Kaleidoscope</string>');
    expect(androidStrings).toContain(
      '<string name="app_name">Kaleidoscope</string>',
    );
  });

  test('permission prompts name the app the user installed', () => {
    // The microphone prompt read "Give $(PRODUCT_NAME) permission", and
    // PRODUCT_NAME is still DreamApp — the target name, which is not something
    // a user has ever seen. So the dialog's title said Kaleidoscope and its
    // body said DreamApp, on the one screen where a stranger is deciding
    // whether to trust the app with a microphone.
    //
    // Found by running it. A build variable in a plist string is invisible in
    // the file and only resolves at packaging time.
    const prompts = [
      ...appInfoPlist.matchAll(
        /UsageDescription<\/key>\s*<string>([^<]*)<\/string>/g,
      ),
    ];

    expect(prompts.length).toBeGreaterThan(0);
    for (const [, text] of prompts) {
      expect(text).not.toContain('$(');
      expect(text).not.toContain('DreamApp');
      // An empty purpose string is worse than a missing key: it declares a
      // reason for access and then gives none. The location one sat empty
      // here, for a permission nothing in the app ever requests.
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  test('no permission is declared that the app never asks for', () => {
    // Location was declared and used nowhere. Every purpose string is a
    // promise to a reviewer, and one the code cannot keep is a reason to be
    // asked why.
    expect(appInfoPlist).not.toContain('NSLocationWhenInUseUsageDescription');
  });

  test('no personal handle is baked into a shared identifier', () => {
    // The App Group was `group.com.cherven.dreamapp`. Identifiers outlive the
    // reason they were named that way.
    for (const file of [
      read('ios', 'DreamApp', 'DreamApp.entitlements'),
      read('ios', 'DreamWidgetExtensionExtension.entitlements'),
      read('ios', 'DreamApp', 'DreamWidgetModule.swift'),
      read('ios', 'DreamWidgetExtension', 'DreamWidgetExtension.swift'),
    ]) {
      expect(file).toContain(`group.${APP_BUNDLE_ID}`);
      expect(file).not.toContain('cherven');
    }
  });

  test('the quick-action ids agree between the plist and the code', () => {
    // They are arbitrary strings, but a mismatch means the shortcut opens
    // nothing at all — and nothing errors, so it fails silently.
    const appDelegate = read('ios', 'DreamApp', 'AppDelegate.swift');

    for (const action of ['capture', 'draft', 'memory']) {
      expect(appInfoPlist).toContain(`${APP_BUNDLE_ID}.${action}`);
      expect(appDelegate).toContain(`${APP_BUNDLE_ID}.${action}`);
    }
  });

  test('Android shortcuts target the installed package', () => {
    const shortcuts = read(
      'android',
      'app',
      'src',
      'main',
      'res',
      'xml',
      'shortcuts.xml',
    );

    expect(shortcuts).toContain(`android:targetPackage="${APP_BUNDLE_ID}"`);
    // targetClass stays on the Java namespace, which is a different thing and
    // deliberately unchanged: renaming it would move every Kotlin file and
    // change nothing a user or a store can see.
    expect(shortcuts).toContain(
      'android:targetClass="com.dreamapp.MainActivity"',
    );
  });
});
