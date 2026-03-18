import { ConsoleObservabilityService } from './consoleObservability';
import { ObservabilityService } from './types';

const consoleObservability = new ConsoleObservabilityService();

let providerObservability: ObservabilityService | null = null;

function getActiveServices(): ObservabilityService[] {
  if (!providerObservability) {
    return [consoleObservability];
  }

  return __DEV__
    ? [consoleObservability, providerObservability]
    : [providerObservability];
}

export const observability: ObservabilityService = {
  captureError(error, context) {
    getActiveServices().forEach(service => {
      service.captureError(error, context);
    });
  },

  captureMessage(message, level, context) {
    getActiveServices().forEach(service => {
      service.captureMessage(message, level, context);
    });
  },

  trackEvent(name, properties) {
    getActiveServices().forEach(service => {
      service.trackEvent(name, properties);
    });
  },
};

export function setObservabilityProvider(service: ObservabilityService | null) {
  providerObservability = service;
}
