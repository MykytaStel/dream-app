import React from 'react';
import { AppState, InteractionManager } from 'react-native';
import { reportActionError } from '../../../services/observability/errorReporting';
import { runArchiveHealthMaintenance } from '../services/archiveHealthMaintenanceService';

/**
 * Read-only archive integrity maintenance.
 *
 * It mounts only after AppLockGate unlocks, waits until initial interactions are
 * done, and then runs at most once per persisted seven-day window. Foreground
 * events are only additional opportunities to run a due check; they do not
 * bypass the cadence. Repairs remain explicit user actions in Settings.
 */
export function ArchiveHealthMaintenance() {
  React.useEffect(() => {
    let disposed = false;

    const run = () => {
      if (disposed) return;
      runArchiveHealthMaintenance().catch(error => {
        reportActionError('archive_health_maintenance.component', error);
      });
    };

    const interaction = InteractionManager.runAfterInteractions(run);
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        run();
      }
    });

    return () => {
      disposed = true;
      interaction.cancel();
      appStateSubscription.remove();
    };
  }, []);

  return null;
}
