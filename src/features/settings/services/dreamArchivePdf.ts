import { type AppLocale } from '../../../i18n/types';
import { type Dream } from '../../dreams/model/dream';
import { type DreamExportV1 } from './dataExportService';

type DreamPdfCopy = {
  archiveTitle: string;
  archiveSubtitle: string;
  exportedAt: string;
  version: string;
  locale: string;
  platform: string;
  storage: string;
  summary: string;
  dreams: string;
  archived: string;
  audio: string;
  transcripts: string;
  analyzed: string;
  draft: string;
  included: string;
  missing: string;
  entryDate: string;
  createdAt: string;
  tags: string;
  mood: string;
  wakeEmotions: string;
  preSleep: string;
  text: string;
  transcript: string;
  analysis: string;
  untitled: string;
  noText: string;
  clipped: string;
};

const PDF_TEXT_LIMIT = 1800;

function getDreamPdfCopy(locale: AppLocale): DreamPdfCopy {
  if (locale === 'uk') {
    return {
      archiveTitle: 'Архів снів',
      archiveSubtitle: 'Локальний PDF-знімок, створений для читання й перегляду поза застосунком.',
      exportedAt: 'Експортовано',
      version: 'Застосунок',
      locale: 'Мова',
      platform: 'Платформа',
      storage: 'Схема',
      summary: 'Зведення',
      dreams: 'Снів',
      archived: 'В архіві',
      audio: 'З аудіо',
      transcripts: 'З транскриптом',
      analyzed: 'З аналізом',
      draft: 'Чернетка',
      included: 'Є',
      missing: 'Немає',
      entryDate: 'Дата сну',
      createdAt: 'Створено',
      tags: 'Теги',
      mood: 'Настрій',
      wakeEmotions: 'Після пробудження',
      preSleep: 'Перед сном',
      text: 'Текст',
      transcript: 'Транскрипт',
      analysis: 'Аналіз',
      untitled: 'Без назви',
      noText: 'Деталей немає.',
      clipped: '... обрізано для PDF-знімка',
    };
  }

  return {
    archiveTitle: 'Dream archive',
    archiveSubtitle: 'A local PDF snapshot for reading outside the app.',
    exportedAt: 'Exported',
    version: 'App',
    locale: 'Locale',
    platform: 'Platform',
    storage: 'Schema',
    summary: 'Summary',
    dreams: 'Dreams',
    archived: 'Archived',
    audio: 'With audio',
    transcripts: 'With transcript',
    analyzed: 'With analysis',
    draft: 'Draft',
    included: 'Included',
    missing: 'None',
    entryDate: 'Sleep date',
    createdAt: 'Created',
    tags: 'Tags',
    mood: 'Mood',
    wakeEmotions: 'After waking',
    preSleep: 'Before sleep',
    text: 'Notes',
    transcript: 'Transcript',
    analysis: 'Analysis',
    untitled: 'Untitled',
    noText: 'No details saved.',
    clipped: '... clipped for the PDF snapshot',
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatLocaleTag(locale: AppLocale) {
  return locale === 'uk' ? 'uk-UA' : 'en-US';
}

function formatLocaleDisplayName(locale: AppLocale) {
  return locale === 'uk' ? 'Українська' : 'English';
}

function formatExportedTimestamp(value: string, locale: AppLocale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(formatLocaleTag(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDreamDate(dream: Dream, locale: AppLocale) {
  if (dream.sleepDate?.trim()) {
    const date = new Date(`${dream.sleepDate}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(formatLocaleTag(locale), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    return dream.sleepDate;
  }

  return new Date(dream.createdAt).toLocaleString(formatLocaleTag(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCreatedAt(value: number, locale: AppLocale) {
  return new Date(value).toLocaleString(formatLocaleTag(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function clipPdfText(value: string, copy: DreamPdfCopy) {
  const normalized = value.trim();
  if (normalized.length <= PDF_TEXT_LIMIT) {
    return normalized;
  }

  return `${normalized.slice(0, PDF_TEXT_LIMIT)}${copy.clipped}`;
}

function formatList(values: string[] | undefined) {
  if (!values?.length) {
    return null;
  }

  const normalized = values.map(value => value.trim()).filter(Boolean);
  return normalized.length ? normalized.join(', ') : null;
}

function renderLabelValue(label: string, value?: string | null) {
  if (!value?.trim()) {
    return '';
  }

  return `
    <div class="meta-row">
      <span class="meta-label">${escapeHtml(label)}</span>
      <span class="meta-value">${escapeHtml(value)}</span>
    </div>
  `;
}

function renderBodyBlock(label: string, value: string | null | undefined) {
  if (!value?.trim()) {
    return '';
  }

  return `
    <section class="entry-block">
      <div class="entry-block-label">${escapeHtml(label)}</div>
      <div class="entry-block-text">${escapeHtml(value)}</div>
    </section>
  `;
}

function buildDreamEntryHtml(dream: Dream, copy: DreamPdfCopy, locale: AppLocale) {
  const tags = formatList(dream.tags);
  const wakeEmotions = formatList(dream.wakeEmotions);
  const preSleepEmotions = formatList(dream.sleepContext?.preSleepEmotions);
  const text = dream.text?.trim() ? clipPdfText(dream.text, copy) : null;
  const transcript = dream.transcript?.trim() ? clipPdfText(dream.transcript, copy) : null;
  const analysis = dream.analysis?.summary?.trim()
    ? clipPdfText(dream.analysis.summary, copy)
    : null;
  const hasBody = Boolean(text || transcript || analysis);

  return `
    <article class="entry-card">
      <div class="entry-header">
        <div>
          <h2 class="entry-title">${escapeHtml(dream.title?.trim() || copy.untitled)}</h2>
          <div class="entry-subtitle">${escapeHtml(formatDreamDate(dream, locale))}</div>
        </div>
      </div>

      <div class="entry-meta">
        ${renderLabelValue(copy.entryDate, dream.sleepDate ?? null)}
        ${renderLabelValue(copy.createdAt, formatCreatedAt(dream.createdAt, locale))}
        ${renderLabelValue(copy.tags, tags)}
        ${renderLabelValue(copy.mood, dream.mood ?? null)}
        ${renderLabelValue(copy.wakeEmotions, wakeEmotions)}
        ${renderLabelValue(copy.preSleep, preSleepEmotions)}
      </div>

      ${hasBody
        ? `
          <div class="entry-body">
            ${renderBodyBlock(copy.text, text)}
            ${renderBodyBlock(copy.transcript, transcript)}
            ${renderBodyBlock(copy.analysis, analysis)}
          </div>
        `
        : `<div class="entry-empty">${escapeHtml(copy.noText)}</div>`}
    </article>
  `;
}

export function buildDreamArchivePdfHtml(payload: DreamExportV1) {
  const copy = getDreamPdfCopy(payload.locale);
  const exportedAt = formatExportedTimestamp(payload.exportedAt, payload.locale);
  const dreamEntries = payload.dreams
    .slice()
    .sort((left, right) => right.createdAt - left.createdAt)
    .map(dream => buildDreamEntryHtml(dream, copy, payload.locale))
    .join('');

  return `
    <html lang="${payload.locale}">
      <head>
        <meta charset="utf-8" />
        <style>
          @page { margin: 26px; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #172033; background: #ffffff; font-size: 12px; line-height: 1.55; }
          h1, h2, h3, p { margin: 0; }
          .page { display: flex; flex-direction: column; gap: 18px; }
          .hero { padding: 20px; border: 1px solid #d7e0f1; border-radius: 18px; background: linear-gradient(180deg, #f5f8ff 0%, #ffffff 100%); }
          .eyebrow { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #5a6a8e; margin-bottom: 8px; }
          .hero-title { font-size: 26px; line-height: 1.15; color: #101729; margin-bottom: 8px; }
          .hero-subtitle { color: #4a5877; max-width: 520px; }
          .meta-grid { display: flex; flex-wrap: wrap; gap: 10px; }
          .meta-card { min-width: 148px; flex: 1 1 30%; padding: 14px; border: 1px solid #dfe5f2; border-radius: 16px; background: #fbfcff; }
          .meta-card-label { display: block; margin-bottom: 5px; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #67779a; }
          .meta-card-value { font-size: 16px; line-height: 1.3; font-weight: 700; color: #121a2d; }
          .section-title { font-size: 18px; color: #121a2d; }
          .entry-list { display: flex; flex-direction: column; gap: 12px; }
          .entry-card { break-inside: avoid; border: 1px solid #dfe5f2; border-radius: 16px; padding: 16px; background: #ffffff; }
          .entry-header { margin-bottom: 10px; }
          .entry-title { font-size: 18px; line-height: 1.25; color: #11192b; margin-bottom: 4px; }
          .entry-subtitle { color: #637392; }
          .entry-meta { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
          .meta-row { display: flex; gap: 8px; align-items: flex-start; }
          .meta-label { min-width: 108px; font-size: 10px; line-height: 1.5; letter-spacing: 0.08em; text-transform: uppercase; color: #697998; }
          .meta-value { flex: 1; color: #1b2740; }
          .entry-body { display: flex; flex-direction: column; gap: 10px; }
          .entry-block { padding: 12px; border-radius: 14px; background: #f7f9fe; }
          .entry-block-label { margin-bottom: 6px; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #697998; }
          .entry-block-text { white-space: pre-wrap; color: #1c2740; }
          .entry-empty { color: #6d7b98; }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="hero">
            <div class="eyebrow">${escapeHtml(copy.exportedAt)}</div>
            <h1 class="hero-title">${escapeHtml(copy.archiveTitle)}</h1>
            <p class="hero-subtitle">${escapeHtml(copy.archiveSubtitle)}</p>
          </section>
          <section class="meta-grid">
            <div class="meta-card"><span class="meta-card-label">${escapeHtml(copy.exportedAt)}</span><div class="meta-card-value">${escapeHtml(exportedAt)}</div></div>
            <div class="meta-card"><span class="meta-card-label">${escapeHtml(copy.version)}</span><div class="meta-card-value">${escapeHtml(payload.appVersion)}</div></div>
            <div class="meta-card"><span class="meta-card-label">${escapeHtml(copy.locale)}</span><div class="meta-card-value">${escapeHtml(formatLocaleDisplayName(payload.locale))}</div></div>
            <div class="meta-card"><span class="meta-card-label">${escapeHtml(copy.platform)}</span><div class="meta-card-value">${escapeHtml(payload.platform)}</div></div>
            <div class="meta-card"><span class="meta-card-label">${escapeHtml(copy.storage)}</span><div class="meta-card-value">${escapeHtml(String(payload.storageSchemaVersion))}</div></div>
            <div class="meta-card"><span class="meta-card-label">${escapeHtml(copy.draft)}</span><div class="meta-card-value">${escapeHtml(payload.summary.draftIncluded ? copy.included : copy.missing)}</div></div>
          </section>
          <section class="meta-grid">
            <div class="meta-card"><span class="meta-card-label">${escapeHtml(copy.summary)}</span><div class="meta-card-value">${escapeHtml(String(payload.summary.dreamCount))} ${escapeHtml(copy.dreams)}</div></div>
            <div class="meta-card"><span class="meta-card-label">${escapeHtml(copy.archived)}</span><div class="meta-card-value">${escapeHtml(String(payload.summary.archivedDreamCount))}</div></div>
            <div class="meta-card"><span class="meta-card-label">${escapeHtml(copy.audio)}</span><div class="meta-card-value">${escapeHtml(String(payload.summary.audioDreamCount))}</div></div>
            <div class="meta-card"><span class="meta-card-label">${escapeHtml(copy.transcripts)}</span><div class="meta-card-value">${escapeHtml(String(payload.summary.transcribedDreamCount))}</div></div>
            <div class="meta-card"><span class="meta-card-label">${escapeHtml(copy.analyzed)}</span><div class="meta-card-value">${escapeHtml(String(payload.summary.analyzedDreamCount))}</div></div>
          </section>
          <h2 class="section-title">${escapeHtml(copy.dreams)}</h2>
          <section class="entry-list">
            ${dreamEntries}
          </section>
        </main>
      </body>
    </html>
  `;
}
