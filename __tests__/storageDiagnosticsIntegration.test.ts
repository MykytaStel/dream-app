import fs from 'node:fs';
import path from 'node:path';

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('storage diagnostics integration', () => {
  test('registers one settings spoke and links it from the hub', () => {
    const routes = read('src/app/navigation/routes.ts');
    const navigator = read('src/app/navigation/RootNavigator.tsx');
    const hub = read('src/features/settings/screens/SettingsScreen.tsx');

    expect(routes).toContain("SettingsStorage: 'SettingsStorage'");
    expect(routes).toContain('[ROOT_ROUTE_NAMES.SettingsStorage]: undefined');
    expect(navigator).toContain('SettingsStorageScreen');
    expect(navigator).toContain('name={ROOT_ROUTE_NAMES.SettingsStorage}');
    expect(hub).toContain('getStorageDiagnosticsCopy');
    expect(hub).toContain(
      'navigation.navigate(ROOT_ROUTE_NAMES.SettingsStorage)',
    );
  });

  test('keeps destructive actions behind dedicated service boundaries', () => {
    const screen = read(
      'src/features/settings/screens/SettingsStorageScreen.tsx',
    );
    const controller = read(
      'src/features/settings/hooks/useStorageDiagnosticsController.ts',
    );
    const service = read(
      'src/features/settings/services/storageDiagnosticsService.ts',
    );

    expect(screen).not.toContain('RNFS.unlink');
    expect(screen).not.toContain('kv.clearAll');
    expect(controller).toContain('Alert.alert');
    expect(controller).toContain('cleanupUnlinkedAudioNow');
    expect(service).toContain('runAudioCleanup({');
    expect(service).toContain('maxAgeDays: 0');
    expect(service).not.toContain('kv.clearAll');
  });

  test('withholds orphan classification when ownership is incomplete', () => {
    const service = read(
      'src/features/settings/services/storageDiagnosticsService.ts',
    );

    expect(service).toContain('if (!ownership.isComplete)');
    expect(service).toContain('unlinkedFileCount: null');
    expect(service).toContain("status: 'deferred'");
    expect(service).toContain("reason: 'recording-active'");
  });
});
