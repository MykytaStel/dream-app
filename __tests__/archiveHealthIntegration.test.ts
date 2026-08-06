import fs from 'node:fs';
import path from 'node:path';

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('archive health integration', () => {
  test('registers a typed settings route and hub entry', () => {
    const routes = read('src/app/navigation/routes.ts');
    const navigator = read('src/app/navigation/RootNavigator.tsx');
    const settings = read('src/features/settings/screens/SettingsScreen.tsx');

    expect(routes).toContain("SettingsArchiveHealth: 'SettingsArchiveHealth'");
    expect(routes).toContain('[ROOT_ROUTE_NAMES.SettingsArchiveHealth]: undefined');
    expect(navigator).toContain('SettingsArchiveHealthScreen');
    expect(navigator).toContain('ROOT_ROUTE_NAMES.SettingsArchiveHealth');
    expect(settings).toContain('getArchiveHealthSummary');
    expect(settings).toContain('archiveHealthCopy.hubTitle');
  });

  test('mounts weekly read-only maintenance only after the app lock gate', () => {
    const app = read('App.tsx');
    const component = read(
      'src/features/settings/components/ArchiveHealthMaintenance.tsx',
    );

    const lockIndex = app.indexOf('<AppLockGate');
    const maintenanceIndex = app.indexOf('<ArchiveHealthMaintenance />');
    const navigatorIndex = app.indexOf('<RootNavigator />');

    expect(lockIndex).toBeGreaterThanOrEqual(0);
    expect(maintenanceIndex).toBeGreaterThan(lockIndex);
    expect(maintenanceIndex).toBeLessThan(navigatorIndex);
    expect(component).toContain('InteractionManager.runAfterInteractions');
    expect(component).toContain("state === 'active'");
    expect(component).toContain('runArchiveHealthMaintenance');
    expect(component).not.toContain('repairArchiveHealth');
  });

  test('keeps destructive work behind backup-first service boundary', () => {
    const screen = read(
      'src/features/settings/screens/SettingsArchiveHealthScreen.tsx',
    );
    const controller = read(
      'src/features/settings/hooks/useArchiveHealthController.ts',
    );
    const service = read(
      'src/features/settings/services/archiveHealthService.ts',
    );

    expect(screen).not.toContain('RNFS.unlink');
    expect(screen).not.toContain('kv.remove');
    expect(controller).toContain('repairArchiveHealth(snapshot)');
    expect(service.indexOf('exportDreamDataSnapshot()')).toBeLessThan(
      service.indexOf('replaceAllDreams(normalized)'),
    );
    expect(service).toContain("reason: 'archive-changed'");
    expect(service).toContain("reason: 'duplicate-dream-id'");
  });
});
