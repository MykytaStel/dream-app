import React from 'react';
import { AppState } from 'react-native';
import { reportActionError } from '../../../services/observability/errorReporting';
import { runArchiveHealthMaintenance } from '../services/archiveHealthMaintenanceService';

/**
 * Read-only archive integrity maintenance.
 *
 * Mounted inside AppLockGate so private storage is not inspected before unlock.
 * Startup remains non-blocking: the first scan waits for initial interactions,
 * foreground events only provide another due opportunity, and the persisted
 * seven-day cadence suppresses repeated work.
 */
export function ArchiveHealthMaintenance(): null {
  React.useEffect(() => {
    let disposed = false;

    const trigger = (source: 'startup' | 'foreground') => {
      if (disposed) {
        return;
      }

      runArchiveHealthMaintenance({ trigger: source }).catch(error => {
        reportActionError('archive_health_maintenance.component', error, {
          trigger: source,
        });
      });
    };

    const startupTaskHandle = requestIdleCallback(() => {
      trigger('startup');
    });

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        trigger('foreground');
      }
    });

    return () => {
      disposed = true;
      cancelIdleCallback(startupTaskHandle);
      appStateSubscription.remove();
    };
  }, []);

  return null;
}
