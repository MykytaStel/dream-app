import { getDreamCopy } from '../../../constants/copy/dreams';
import { getWidgetCopy } from '../../../constants/copy/widgets';
import { AppLocale } from '../../../i18n/types';
import { Dream } from '../../dreams/model/dream';
import { getCurrentStreak, getEntriesLastSevenDays } from '../../dreams/model/dreamAnalytics';
import { getHomeRevisitCue } from '../../dreams/model/homeOverview';
import {
  getDreamWidgetCaptureUrl,
  getDreamWidgetDraftUrl,
  getDreamWidgetDreamUrl,
  getDreamWidgetMemoryUrl,
} from './dreamWidgetLinks';

export type DreamWidgetDraftSnapshot = {
  resumeMode: 'default' | 'voice' | 'wake';
  hasAudio: boolean;
  hasText: boolean;
  wordCount: number;
  hasWakeSignals: boolean;
  hasContext: boolean;
  hasTags: boolean;
  updatedAt?: number;
};

export type DreamWidgetAction = {
  label: string;
  url: string;
};

export type DreamWidgetLastDream = {
  id: string;
  title: string;
  date: string;
};

export type DreamWidgetSnapshot = {
  version: 1;
  generatedAt: number;
  locale: AppLocale;
  privacyMode: 'redacted';
  state: 'empty' | 'draft' | 'revisit' | 'insight';
  title: string;
  subtitle: string;
  meta: string;
  primaryAction: DreamWidgetAction;
  secondaryAction: DreamWidgetAction;
  lastDream: DreamWidgetLastDream | null;
};

type BuildDreamWidgetSnapshotArgs = {
  dreams: Dream[];
  draftSnapshot?: DreamWidgetDraftSnapshot | null;
  locale: AppLocale;
  now?: number;
};

function formatCount(
  count: number,
  single: string,
  prefix: string,
  suffix: string,
) {
  if (count === 1) {
    return single;
  }

  return `${prefix}${count}${suffix}`;
}

export function buildDreamWidgetSnapshot({
  dreams,
  draftSnapshot,
  locale,
  now = Date.now(),
}: BuildDreamWidgetSnapshotArgs): DreamWidgetSnapshot {
  const dreamCopy = getDreamCopy(locale);
  const widgetCopy = getWidgetCopy(locale);
  const revisitCue = getHomeRevisitCue(dreams, dreamCopy, now);

  const latestDream = dreams[0] ?? null;
  const lastDream: DreamWidgetLastDream | null = latestDream
    ? {
        id: latestDream.id,
        title: latestDream.title?.trim() ?? '',
        date: latestDream.sleepDate,
      }
    : null;

  if (draftSnapshot) {
    return {
      version: 1,
      generatedAt: now,
      locale,
      privacyMode: 'redacted',
      state: 'draft',
      title: dreamCopy.homeContinueDraft,
      subtitle: dreamCopy.homeDraftShortcutHint,
      meta: widgetCopy.localOnlyLabel,
      primaryAction: {
        label: dreamCopy.homeContinueDraft,
        url: getDreamWidgetDraftUrl(),
      },
      secondaryAction: {
        label: dreamCopy.quickAddWakeAction,
        url: getDreamWidgetCaptureUrl(),
      },
      lastDream,
    };
  }

  if (revisitCue) {
    return {
      version: 1,
      generatedAt: now,
      locale,
      privacyMode: 'redacted',
      state: 'revisit',
      title: widgetCopy.revisitTitle,
      subtitle: revisitCue.reason,
      meta: revisitCue.contextLabel,
      primaryAction: {
        label: revisitCue.actionLabel,
        url: getDreamWidgetDreamUrl(revisitCue.dreamId),
      },
      secondaryAction: {
        label: dreamCopy.quickAddWakeAction,
        url: getDreamWidgetCaptureUrl(),
      },
      lastDream,
    };
  }

  if (!dreams.length) {
    return {
      version: 1,
      generatedAt: now,
      locale,
      privacyMode: 'redacted',
      state: 'empty',
      title: dreamCopy.quickAddWakeAction,
      subtitle: widgetCopy.emptySubtitle,
      meta: widgetCopy.localOnlyLabel,
      primaryAction: {
        label: dreamCopy.quickAddWakeAction,
        url: getDreamWidgetCaptureUrl(),
      },
      secondaryAction: {
        label: widgetCopy.memoryAction,
        url: getDreamWidgetMemoryUrl(),
      },
      lastDream: null,
    };
  }

  const streak = getCurrentStreak(dreams);
  const entriesLastWeek = getEntriesLastSevenDays(dreams);
  const title =
    streak > 0
      ? formatCount(
          streak,
          widgetCopy.streakSingle,
          widgetCopy.streakPrefix,
          widgetCopy.streakSuffix,
        )
      : formatCount(
          dreams.length,
          widgetCopy.totalDreamSingle,
          widgetCopy.totalDreamPrefix,
          widgetCopy.totalDreamSuffix,
        );
  const subtitle =
    streak > 0 ? widgetCopy.fallbackInsightSubtitle : widgetCopy.fallbackCaptureSubtitle;
  const meta = formatCount(
    entriesLastWeek,
    widgetCopy.weeklyEntrySingle,
    widgetCopy.weeklyEntryPrefix,
    widgetCopy.weeklyEntrySuffix,
  );

  return {
    version: 1,
    generatedAt: now,
    locale,
    privacyMode: 'redacted',
    state: 'insight',
    title,
    subtitle,
    meta,
    primaryAction: {
      label: dreamCopy.quickAddWakeAction,
      url: getDreamWidgetCaptureUrl(),
    },
    secondaryAction: {
      label: widgetCopy.memoryAction,
      url: getDreamWidgetMemoryUrl(),
    },
    lastDream,
  };
}
