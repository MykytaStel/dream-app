import { ConsoleObservabilityService } from './consoleObservability';
import { ObservabilityService } from './types';

export const observability: ObservabilityService = new ConsoleObservabilityService();
