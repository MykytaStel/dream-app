import { type DreamAnalysisRecord } from '../../analysis/model/dreamAnalysis';
import { type Dream } from '../../dreams/model/dream';

export type DreamReadableExportFormat = 'markdown' | 'text';

type DreamReadableSummary = {
  dreamCount: number;
  archivedDreamCount: number;
  audioDreamCount: number;
  transcribedDreamCount: number;
  editedTranscriptCount: number;
  analyzedDreamCount: number;
  starredDreamCount: number;
  draftIncluded: boolean;
};

type DreamReadablePayload = {
  exportedAt: string;
  appVersion: string;
  platform: string;
  locale: string;
  storageSchemaVersion: number;
  summary: DreamReadableSummary;
  dreams: Dream[];
};

type NamedValue = {
  label: string;
  value: string;
};

function formatTimestamp(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return new Date(value).toISOString();
}

function formatList(values?: string[]) {
  if (!values?.length) {
    return null;
  }

  const normalized = values.map(value => value.trim()).filter(Boolean);
  return normalized.length ? normalized.join(', ') : null;
}

function formatBoolean(value?: boolean) {
  if (typeof value !== 'boolean') {
    return null;
  }

  return value ? 'yes' : 'no';
}

function formatTranscriptStatus(dream: Dream) {
  if (dream.transcriptStatus) {
    return dream.transcriptStatus;
  }

  return dream.transcript?.trim() ? 'ready' : 'idle';
}

function formatTranscriptSource(dream: Dream) {
  if (!dream.transcript?.trim()) {
    return null;
  }

  return dream.transcriptSource ?? 'generated';
}

function formatContentState(dream: Dream) {
  const states = [
    dream.text?.trim() ? 'text' : null,
    dream.audioUri?.trim() ? 'audio' : null,
    dream.transcript?.trim() ? 'transcript' : null,
  ].filter((value): value is string => Boolean(value));

  if (!states.length) {
    return 'metadata-only';
  }

  return states.join(' + ');
}

function formatDreamTitle(dream: Dream) {
  return dream.title?.trim() || 'Untitled dream';
}

function buildDreamMeta(dream: Dream): NamedValue[] {
  const values: Array<NamedValue | null> = [
    { label: 'id', value: dream.id },
    dream.sleepDate?.trim() ? { label: 'sleep_date', value: dream.sleepDate } : null,
    { label: 'created_at', value: new Date(dream.createdAt).toISOString() },
    formatTimestamp(dream.updatedAt)
      ? { label: 'updated_at', value: formatTimestamp(dream.updatedAt) as string }
      : null,
    formatTimestamp(dream.archivedAt)
      ? { label: 'archived_at', value: formatTimestamp(dream.archivedAt) as string }
      : null,
    formatTimestamp(dream.starredAt)
      ? { label: 'starred_at', value: formatTimestamp(dream.starredAt) as string }
      : null,
    { label: 'content', value: formatContentState(dream) },
    dream.mood ? { label: 'mood', value: dream.mood } : null,
    typeof dream.dreamIntensity === 'number'
      ? { label: 'dream_intensity', value: String(dream.dreamIntensity) }
      : null,
    formatList(dream.wakeEmotions) ? { label: 'wake_emotions', value: formatList(dream.wakeEmotions) as string } : null,
    formatList(dream.tags) ? { label: 'tags', value: formatList(dream.tags) as string } : null,
    dream.audioUri?.trim() ? { label: 'audio_uri', value: dream.audioUri } : null,
    dream.audioUri?.trim() || dream.transcript?.trim() || dream.transcriptStatus
      ? { label: 'transcript_status', value: formatTranscriptStatus(dream) }
      : null,
    formatTranscriptSource(dream)
      ? { label: 'transcript_source', value: formatTranscriptSource(dream) as string }
      : null,
    formatTimestamp(dream.transcriptUpdatedAt)
      ? {
          label: 'transcript_updated_at',
          value: formatTimestamp(dream.transcriptUpdatedAt) as string,
        }
      : null,
    typeof dream.lucidity === 'number' ? { label: 'lucidity', value: String(dream.lucidity) } : null,
  ];

  return values.filter((value): value is NamedValue => Boolean(value));
}

function buildSleepContextSection(dream: Dream): NamedValue[] {
  if (!dream.sleepContext) {
    return [];
  }

  const values: Array<NamedValue | null> = [
    typeof dream.sleepContext.stressLevel === 'number'
      ? { label: 'stress_level', value: String(dream.sleepContext.stressLevel) }
      : null,
    formatList(dream.sleepContext.preSleepEmotions)
      ? {
          label: 'pre_sleep_emotions',
          value: formatList(dream.sleepContext.preSleepEmotions) as string,
        }
      : null,
    formatBoolean(dream.sleepContext.alcoholTaken)
      ? { label: 'alcohol_taken', value: formatBoolean(dream.sleepContext.alcoholTaken) as string }
      : null,
    formatBoolean(dream.sleepContext.caffeineLate)
      ? { label: 'caffeine_late', value: formatBoolean(dream.sleepContext.caffeineLate) as string }
      : null,
    dream.sleepContext.medications?.trim()
      ? { label: 'medications', value: dream.sleepContext.medications.trim() }
      : null,
    dream.sleepContext.importantEvents?.trim()
      ? { label: 'important_events', value: dream.sleepContext.importantEvents.trim() }
      : null,
    dream.sleepContext.healthNotes?.trim()
      ? { label: 'health_notes', value: dream.sleepContext.healthNotes.trim() }
      : null,
  ];

  return values.filter((value): value is NamedValue => Boolean(value));
}

function buildLucidPracticeSection(dream: Dream): NamedValue[] {
  if (!dream.lucidPractice) {
    return [];
  }

  const values: Array<NamedValue | null> = [
    dream.lucidPractice.technique
      ? { label: 'technique', value: dream.lucidPractice.technique }
      : null,
    formatList(dream.lucidPractice.dreamSigns)
      ? { label: 'dream_signs', value: formatList(dream.lucidPractice.dreamSigns) as string }
      : null,
    dream.lucidPractice.trigger?.trim()
      ? { label: 'trigger', value: dream.lucidPractice.trigger.trim() }
      : null,
    formatList(dream.lucidPractice.controlAreas)
      ? {
          label: 'control_areas',
          value: formatList(dream.lucidPractice.controlAreas) as string,
        }
      : null,
    formatList(dream.lucidPractice.stabilizationActions)
      ? {
          label: 'stabilization_actions',
          value: formatList(dream.lucidPractice.stabilizationActions) as string,
        }
      : null,
    typeof dream.lucidPractice.recallScore === 'number'
      ? { label: 'recall_score', value: String(dream.lucidPractice.recallScore) }
      : null,
  ];

  return values.filter((value): value is NamedValue => Boolean(value));
}

function buildNightmareSection(dream: Dream): NamedValue[] {
  if (!dream.nightmare) {
    return [];
  }

  const values: Array<NamedValue | null> = [
    formatBoolean(dream.nightmare.explicit)
      ? { label: 'explicit', value: formatBoolean(dream.nightmare.explicit) as string }
      : null,
    typeof dream.nightmare.distress === 'number'
      ? { label: 'distress', value: String(dream.nightmare.distress) }
      : null,
    formatBoolean(dream.nightmare.recurring)
      ? { label: 'recurring', value: formatBoolean(dream.nightmare.recurring) as string }
      : null,
    dream.nightmare.recurringKey?.trim()
      ? { label: 'recurring_key', value: dream.nightmare.recurringKey.trim() }
      : null,
    formatBoolean(dream.nightmare.wokeFromDream)
      ? { label: 'woke_from_dream', value: formatBoolean(dream.nightmare.wokeFromDream) as string }
      : null,
    formatList(dream.nightmare.aftereffects)
      ? { label: 'aftereffects', value: formatList(dream.nightmare.aftereffects) as string }
      : null,
    formatList(dream.nightmare.groundingUsed)
      ? { label: 'grounding_used', value: formatList(dream.nightmare.groundingUsed) as string }
      : null,
    dream.nightmare.rewrittenEnding?.trim()
      ? { label: 'rewritten_ending', value: dream.nightmare.rewrittenEnding.trim() }
      : null,
    dream.nightmare.rescriptStatus
      ? { label: 'rescript_status', value: dream.nightmare.rescriptStatus }
      : null,
  ];

  return values.filter((value): value is NamedValue => Boolean(value));
}

function buildAnalysisSection(analysis?: DreamAnalysisRecord): NamedValue[] {
  if (!analysis) {
    return [];
  }

  const values: Array<NamedValue | null> = [
    { label: 'provider', value: analysis.provider },
    { label: 'status', value: analysis.status },
    formatTimestamp(analysis.generatedAt)
      ? { label: 'generated_at', value: formatTimestamp(analysis.generatedAt) as string }
      : null,
    formatList(analysis.themes)
      ? { label: 'themes', value: formatList(analysis.themes) as string }
      : null,
    analysis.errorMessage?.trim()
      ? { label: 'error_message', value: analysis.errorMessage.trim() }
      : null,
  ];

  return values.filter((value): value is NamedValue => Boolean(value));
}

function buildAudioNote(dream: Dream) {
  if (!dream.audioUri?.trim() || dream.text?.trim() || dream.transcript?.trim()) {
    return null;
  }

  if (formatTranscriptStatus(dream) === 'processing') {
    return 'Audio is attached. Transcript is still processing.';
  }

  if (formatTranscriptStatus(dream) === 'error') {
    return 'Audio is attached. Transcript failed, so only the audio reference is available here.';
  }

  return 'Audio is attached. No text or transcript was saved with this dream yet.';
}

function renderNamedValuesMarkdown(values: NamedValue[]) {
  return values.map(item => `- ${item.label}: ${item.value}`).join('\n');
}

function renderNamedValuesText(values: NamedValue[]) {
  return values.map(item => `${item.label}: ${item.value}`).join('\n');
}

function renderMarkdownSection(title: string, body: string) {
  return `### ${title}\n\n${body}`.trim();
}

function renderTextSection(title: string, body: string) {
  return `${title.toUpperCase()}\n${'-'.repeat(title.length)}\n${body}`.trim();
}

function renderMarkdownFreeText(title: string, value: string) {
  return renderMarkdownSection(title, `~~~~\n${value.trim()}\n~~~~`);
}

function renderTextFreeText(title: string, value: string) {
  return renderTextSection(title, value.trim());
}

function buildDreamMarkdown(dream: Dream, index: number) {
  const blocks: string[] = [];
  const meta = buildDreamMeta(dream);
  const sleepContext = buildSleepContextSection(dream);
  const lucidPractice = buildLucidPracticeSection(dream);
  const nightmare = buildNightmareSection(dream);
  const analysis = buildAnalysisSection(dream.analysis);
  const audioNote = buildAudioNote(dream);

  blocks.push(`## Dream ${index + 1}: ${formatDreamTitle(dream)}`);
  blocks.push(renderNamedValuesMarkdown(meta));

  if (sleepContext.length) {
    blocks.push(renderMarkdownSection('Sleep context', renderNamedValuesMarkdown(sleepContext)));
  }

  if (lucidPractice.length) {
    blocks.push(renderMarkdownSection('Lucid practice', renderNamedValuesMarkdown(lucidPractice)));
  }

  if (nightmare.length) {
    blocks.push(renderMarkdownSection('Nightmare', renderNamedValuesMarkdown(nightmare)));
  }

  if (audioNote) {
    blocks.push(renderMarkdownSection('Audio note', audioNote));
  }

  if (dream.text?.trim()) {
    blocks.push(renderMarkdownFreeText('Dream text', dream.text));
  }

  if (dream.transcript?.trim()) {
    blocks.push(renderMarkdownFreeText('Transcript', dream.transcript));
  }

  if (analysis.length || dream.analysis?.summary?.trim()) {
    const summaryBlock = dream.analysis?.summary?.trim()
      ? `${renderNamedValuesMarkdown(analysis)}\n\n#### Summary\n\n~~~~\n${dream.analysis.summary.trim()}\n~~~~`
      : renderNamedValuesMarkdown(analysis);
    blocks.push(renderMarkdownSection('Analysis', summaryBlock.trim()));
  }

  return blocks.join('\n\n');
}

function buildDreamText(dream: Dream, index: number) {
  const blocks: string[] = [];
  const meta = buildDreamMeta(dream);
  const sleepContext = buildSleepContextSection(dream);
  const lucidPractice = buildLucidPracticeSection(dream);
  const nightmare = buildNightmareSection(dream);
  const analysis = buildAnalysisSection(dream.analysis);
  const audioNote = buildAudioNote(dream);

  blocks.push(`DREAM ${index + 1}: ${formatDreamTitle(dream)}`);
  blocks.push('-'.repeat(`DREAM ${index + 1}: ${formatDreamTitle(dream)}`.length));
  blocks.push(renderNamedValuesText(meta));

  if (sleepContext.length) {
    blocks.push(renderTextSection('Sleep context', renderNamedValuesText(sleepContext)));
  }

  if (lucidPractice.length) {
    blocks.push(renderTextSection('Lucid practice', renderNamedValuesText(lucidPractice)));
  }

  if (nightmare.length) {
    blocks.push(renderTextSection('Nightmare', renderNamedValuesText(nightmare)));
  }

  if (audioNote) {
    blocks.push(renderTextSection('Audio note', audioNote));
  }

  if (dream.text?.trim()) {
    blocks.push(renderTextFreeText('Dream text', dream.text));
  }

  if (dream.transcript?.trim()) {
    blocks.push(renderTextFreeText('Transcript', dream.transcript));
  }

  if (analysis.length || dream.analysis?.summary?.trim()) {
    const summaryBlock = dream.analysis?.summary?.trim()
      ? `${renderNamedValuesText(analysis)}\n\nSummary\n-------\n${dream.analysis.summary.trim()}`
      : renderNamedValuesText(analysis);
    blocks.push(renderTextSection('Analysis', summaryBlock.trim()));
  }

  return blocks.join('\n\n');
}

function buildSummaryValues(payload: DreamReadablePayload): NamedValue[] {
  return [
    { label: 'exported_at', value: payload.exportedAt },
    { label: 'app_version', value: payload.appVersion },
    { label: 'platform', value: payload.platform },
    { label: 'locale', value: payload.locale },
    { label: 'storage_schema_version', value: String(payload.storageSchemaVersion) },
    { label: 'dream_count', value: String(payload.summary.dreamCount) },
    { label: 'archived_dream_count', value: String(payload.summary.archivedDreamCount) },
    { label: 'audio_dream_count', value: String(payload.summary.audioDreamCount) },
    { label: 'transcribed_dream_count', value: String(payload.summary.transcribedDreamCount) },
    { label: 'edited_transcript_count', value: String(payload.summary.editedTranscriptCount) },
    { label: 'analyzed_dream_count', value: String(payload.summary.analyzedDreamCount) },
    { label: 'starred_dream_count', value: String(payload.summary.starredDreamCount) },
    { label: 'draft_included_in_backup_json', value: payload.summary.draftIncluded ? 'yes' : 'no' },
  ];
}

export function buildDreamReadableExportDocument(
  payload: DreamReadablePayload,
  format: DreamReadableExportFormat,
) {
  const summary = buildSummaryValues(payload);

  if (format === 'markdown') {
    const dreamsBlock = payload.dreams.length
      ? payload.dreams.map((dream, index) => buildDreamMarkdown(dream, index)).join('\n\n---\n\n')
      : 'No dreams were saved in this export.';

    return [
      '# Dream export',
      renderNamedValuesMarkdown(summary),
      '## Dreams',
      dreamsBlock,
    ].join('\n\n');
  }

  const dreamsBlock = payload.dreams.length
    ? payload.dreams.map((dream, index) => buildDreamText(dream, index)).join('\n\n\n')
    : 'No dreams were saved in this export.';

  return [
    'DREAM EXPORT',
    '============',
    '',
    renderNamedValuesText(summary),
    '',
    'DREAMS',
    '------',
    dreamsBlock,
  ].join('\n');
}
