import type { Dream } from './dream';
import { resolveDreamSleepDate } from './dreamRules';

export function isDreamArchived(dream: Dream) {
  return typeof dream.archivedAt === 'number';
}

export function isDreamStarred(dream: Dream) {
  return typeof dream.starredAt === 'number';
}

function compareDreamsNewestFirst(a: Dream, b: Dream) {
  const dateCompare = resolveDreamSleepDate(
    b.sleepDate,
    b.createdAt,
  ).localeCompare(resolveDreamSleepDate(a.sleepDate, a.createdAt));
  if (dateCompare !== 0) {
    return dateCompare;
  }

  if (b.createdAt !== a.createdAt) {
    return b.createdAt - a.createdAt;
  }

  return b.id.localeCompare(a.id);
}

export function sortDreamsNewestFirst(dreams: Dream[]) {
  return [...dreams].sort(compareDreamsNewestFirst);
}
