import { readFileSync } from 'fs';
import { join } from 'path';

const readProjectFile = (...parts: string[]) =>
  readFileSync(join(__dirname, '..', ...parts), 'utf8');

const app = readProjectFile('App.tsx');
const maintenanceComponent = readProjectFile(
  'src',
  'features',
  'dreams',
  'components',
  'AudioCleanupMaintenance.tsx',
);
const audioService = readProjectFile(
  'src',
  'features',
  'dreams',
  'services',
  'audioService.ts',
);

describe('audio cleanup maintenance integration', () => {
  test('maintenance mounts inside the application lock boundary', () => {
    const lockStart = app.indexOf('<AppLockGate');
    const maintenance = app.indexOf('<AudioCleanupMaintenance />');
    const lockEnd = app.indexOf('</AppLockGate>');

    expect(lockStart).toBeGreaterThanOrEqual(0);
    expect(maintenance).toBeGreaterThan(lockStart);
    expect(lockEnd).toBeGreaterThan(maintenance);
  });

  test('startup waits for interactions and foregrounding retries maintenance', () => {
    expect(maintenanceComponent).toContain(
      'InteractionManager.runAfterInteractions',
    );
    expect(maintenanceComponent).toContain(
      "AppState.addEventListener('change'",
    );
    expect(maintenanceComponent).toContain("trigger('startup')");
    expect(maintenanceComponent).toContain("trigger('foreground')");
  });

  test('a recording end retries a previously deferred due attempt', () => {
    expect(maintenanceComponent).toContain('subscribeToAudioRuntimeOwnership');
    expect(maintenanceComponent).toContain(
      'previousRecordingActive && !next.recordingActive',
    );
    expect(maintenanceComponent).toContain("trigger('recording-ended')");
  });

  test('the recorder boundary publishes every critical ownership transition', () => {
    const startIndex = audioService.indexOf('markAudioRecordingStarting();');
    const permissionIndex = audioService.indexOf(
      'await ensureRecordAudioPermission()',
    );
    const startedIndex = audioService.indexOf(
      'markAudioRecordingStarted(uri);',
    );
    const stoppedIndex = audioService.indexOf(
      'markAudioRecordingStopped(uri);',
    );
    const interruptedIndex = audioService.indexOf(
      'markAudioRecordingInterrupted(normalizedUri);',
    );

    expect(startIndex).toBeGreaterThanOrEqual(0);
    expect(permissionIndex).toBeGreaterThan(startIndex);
    expect(startedIndex).toBeGreaterThan(permissionIndex);
    expect(stoppedIndex).toBeGreaterThan(startedIndex);
    expect(interruptedIndex).toBeGreaterThan(stoppedIndex);
  });
});
