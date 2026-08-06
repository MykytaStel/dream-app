import fs from 'node:fs';
import path from 'node:path';

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('archive health maintenance integration', () => {
  test('mounts read-only maintenance after unlock and before navigation', () => {
    const app = source('App.tsx');
    const component = source(
      'src/features/settings/components/ArchiveHealthMaintenance.tsx',
    );

    const lockIndex = app.indexOf('<AppLockGate');
    const maintenanceIndex = app.indexOf('<ArchiveHealthMaintenance />');
    const navigatorIndex = app.indexOf('<RootNavigator />');

    expect(lockIndex).toBeGreaterThanOrEqual(0);
    expect(maintenanceIndex).toBeGreaterThan(lockIndex);
    expect(maintenanceIndex).toBeLessThan(navigatorIndex);
    expect(component).toContain('requestIdleCallback');
    expect(component).toContain("state === 'active'");
    expect(component).toContain('runArchiveHealthMaintenance');
    expect(component).not.toContain('repairArchiveHealth');
  });

  test('reuses aggregate history instead of adding a second health summary schema', () => {
    const service = source(
      'src/features/settings/services/archiveHealthMaintenanceService.ts',
    );
    const keys = source('src/services/storage/keys.ts');

    expect(service).toContain('getArchiveHealthHistory()');
    expect(service).toContain('scanArchiveHealth({ record: true })');
    expect(service).not.toContain('repairArchiveHealth');
    expect(keys).toContain('ARCHIVE_HEALTH_LAST_CHECK_STORAGE_KEY');
    expect(keys).not.toContain('ARCHIVE_HEALTH_SUMMARY_STORAGE_KEY');
  });

  test('shows the latest persisted status in the settings hub', () => {
    const settings = source('src/features/settings/screens/SettingsScreen.tsx');

    expect(settings).toContain('getLatestArchiveHealthStatus');
    expect(settings).toContain('useFocusEffect');
    expect(settings).toContain('archiveHealthCopy.status');
    expect(settings).toContain('ROOT_ROUTE_NAMES.ArchiveHealth');
  });
});
