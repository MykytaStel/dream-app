import type { Dream } from './dream';
import { getDreamDate } from './dreamAnalytics';

export type DreamResurfacingWindow = 'week' | 'month' | 'quarter' | 'half-year' | 'year';

export type DreamResurfacingMatch = {
  window: DreamResurfacingWindow;
  daysAgo: number;
  distance: number;
  score: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const RESURFACING_WINDOWS: Array<{
  window: DreamResurfacingWindow;
  days: number;
  tolerance: number;
  score: number;
}> = [
  { window: 'week', days: 7, tolerance: 2, score: 4 },
  { window: 'month', days: 30, tolerance: 4, score: 5 },
  { window: 'quarter', days: 90, tolerance: 7, score: 6 },
  { window: 'half-year', days: 180, tolerance: 10, score: 7 },
  { window: 'year', days: 365, tolerance: 21, score: 8 },
];

function startOfLocalDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function getDreamResurfacingMatch(
  dream: Pick<Dream, 'createdAt' | 'sleepDate'>,
  now = Date.now(),
): DreamResurfacingMatch | null {
  const dreamDate = startOfLocalDay(getDreamDate(dream));
  const currentDate = startOfLocalDay(new Date(now));
  const daysAgo = Math.round((currentDate.getTime() - dreamDate.getTime()) / DAY_MS);

  if (daysAgo < 6) {
    return null;
  }

  const match = RESURFACING_WINDOWS.map(window => ({
    ...window,
    distance: Math.abs(daysAgo - window.days),
  }))
    .filter(window => window.distance <= window.tolerance)
    .sort((left, right) => left.distance - right.distance || right.score - left.score)[0];

  if (!match) {
    return null;
  }

  return {
    window: match.window,
    daysAgo,
    distance: match.distance,
    score: match.score,
  };
}
