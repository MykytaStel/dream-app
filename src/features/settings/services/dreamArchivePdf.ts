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
  starred: string;
  audio: string;
  transcripts: string;
  analyzed: string;
  draft: string;
  included: string;
  missing: string;
  readingOrder: string;
  newestFirst: string;
  newestEntry: string;
  oldestEntry: string;
  entry: string;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string;
  mood: string;
  wakeEmotions: string;
  preSleep: string;
  text: string;
  transcript: string;
  analysis: string;
  untitled: string;
  noText: string;
  noDreams: string;
  clipped: string;
};

const PDF_TEXT_LIMIT = 6000;

function getDreamPdfCopy(locale: AppLocale): DreamPdfCopy {
  if (locale === 'uk') {
    return {
      archiveTitle: 'Архів снів',
      archiveSubtitle:
        'Локальний PDF-знімок, підготовлений для читання, друку й збереження поза застосунком.',
      exportedAt: 'Експортовано',
      version: 'Застосунок',
      locale: 'Мова',
      platform: 'Платформа',
      storage: 'Схема',
      summary: 'Зведення',
      dreams: 'Сни',
      archived: 'В архіві',
      starred: 'Позначені',
      audio: 'З аудіо',
      transcripts: 'З транскриптом',
      analyzed: 'З аналізом',
      draft: 'Чернетка',
      included: 'Є',
      missing: 'Немає',
      readingOrder: 'Порядок',
      newestFirst: 'Новіші спочатку',
      newestEntry: 'Найновіший запис',
      oldestEntry: 'Найдавніший запис',
      entry: 'Запис',
      entryDate: 'Дата сну',
      createdAt: 'Створено',
      updatedAt: 'Оновлено',
      tags: 'Теги',
      mood: 'Настрій',
      wakeEmotions: 'Після пробудження',
      preSleep: 'Перед сном',
      text: 'Текст',
      transcript: 'Транскрипт',
      analysis: 'Аналіз',
      untitled: 'Без назви',
      noText: 'Деталей немає.',
      noDreams: 'У цьому експорті немає збережених снів.',
      clipped: '... обрізано для PDF-знімка',
    };
  }

  return {
    archiveTitle: 'Dream archive',
    archiveSubtitle: 'A local PDF snapshot prepared for reading, printing, and keeping.',
    exportedAt: 'Exported',
    version: 'App',
    locale: 'Locale',
    platform: 'Platform',
    storage: 'Schema',
    summary: 'Summary',
    dreams: 'Dreams',
    archived: 'Archived',
    starred: 'Starred',
    audio: 'With audio',
    transcripts: 'With transcript',
    analyzed: 'With analysis',
    draft: 'Draft',
    included: 'Included',
    missing: 'None',
    readingOrder: 'Order',
    newestFirst: 'Newest first',
    newestEntry: 'Newest entry',
    oldestEntry: 'Oldest entry',
    entry: 'Entry',
    entryDate: 'Sleep date',
    createdAt: 'Created',
    updatedAt: 'Updated',
    tags: 'Tags',
    mood: 'Mood',
    wakeEmotions: 'After waking',
    preSleep: 'Before sleep',
    text: 'Notes',
    transcript: 'Transcript',
    analysis: 'Analysis',
    untitled: 'Untitled',
    noText: 'No details saved.',
    noDreams: 'No dreams were saved in this export.',
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

function renderRichText(value: string) {
  const paragraphs = value
    .trim()
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);

  return paragraphs
    .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

function renderDetailRow(label: string, value?: string | null) {
  if (!value?.trim()) {
    return '';
  }

  return `
    <div class="detail-row">
      <div class="detail-label">${escapeHtml(label)}</div>
      <div class="detail-value">${escapeHtml(value)}</div>
    </div>
  `;
}

function renderEntryMetaRow(label: string, value?: string | null) {
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

function renderSummaryCard(label: string, value: string) {
  return `
    <div class="summary-card">
      <span class="summary-card-label">${escapeHtml(label)}</span>
      <div class="summary-card-value">${escapeHtml(value)}</div>
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
      <div class="entry-block-text">${renderRichText(value)}</div>
    </section>
  `;
}

function renderEntryFlags(dream: Dream, copy: DreamPdfCopy) {
  const flags: string[] = [];

  if (typeof dream.archivedAt === 'number') {
    flags.push(copy.archived);
  }

  if (typeof dream.starredAt === 'number') {
    flags.push(copy.starred);
  }

  if (dream.audioUri?.trim()) {
    flags.push(copy.audio);
  }

  if (dream.transcript?.trim()) {
    flags.push(copy.transcript);
  }

  if (dream.analysis?.summary?.trim()) {
    flags.push(copy.analysis);
  }

  if (!flags.length) {
    return '';
  }

  return `
    <div class="entry-flags">
      ${flags.map(flag => `<span class="entry-flag">${escapeHtml(flag)}</span>`).join('')}
    </div>
  `;
}

function buildDreamEntryHtml(
  dream: Dream,
  copy: DreamPdfCopy,
  locale: AppLocale,
  index: number,
  totalCount: number,
) {
  const tags = formatList(dream.tags);
  const wakeEmotions = formatList(dream.wakeEmotions);
  const preSleepEmotions = formatList(dream.sleepContext?.preSleepEmotions);
  const text = dream.text?.trim() ? clipPdfText(dream.text, copy) : null;
  const transcript = dream.transcript?.trim() ? clipPdfText(dream.transcript, copy) : null;
  const analysis = dream.analysis?.summary?.trim()
    ? clipPdfText(dream.analysis.summary, copy)
    : null;
  const hasBody = Boolean(text || transcript || analysis);
  const entrySequence = String(index + 1).padStart(2, '0');

  return `
    <article class="entry-sheet">
      <div class="entry-head">
        <div class="entry-sequence-row">
          <div class="entry-sequence">${escapeHtml(`${copy.entry} ${entrySequence} / ${totalCount}`)}</div>
          ${renderEntryFlags(dream, copy)}
        </div>
        <h2 class="entry-title">${escapeHtml(dream.title?.trim() || copy.untitled)}</h2>
        <div class="entry-subtitle">${escapeHtml(formatDreamDate(dream, locale))}</div>
      </div>

      <div class="entry-meta">
        ${renderEntryMetaRow(copy.entryDate, dream.sleepDate ?? null)}
        ${renderEntryMetaRow(copy.createdAt, formatCreatedAt(dream.createdAt, locale))}
        ${renderEntryMetaRow(
          copy.updatedAt,
          typeof dream.updatedAt === 'number' ? formatCreatedAt(dream.updatedAt, locale) : null,
        )}
        ${renderEntryMetaRow(copy.tags, tags)}
        ${renderEntryMetaRow(copy.mood, dream.mood ?? null)}
        ${renderEntryMetaRow(copy.wakeEmotions, wakeEmotions)}
        ${renderEntryMetaRow(copy.preSleep, preSleepEmotions)}
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
  const sortedDreams = payload.dreams.slice().sort((left, right) => right.createdAt - left.createdAt);
  const newestDream = sortedDreams[0] ?? null;
  const oldestDream = sortedDreams.length ? sortedDreams[sortedDreams.length - 1] : null;
  const dreamEntries = sortedDreams
    .map((dream, index) => buildDreamEntryHtml(dream, copy, payload.locale, index, sortedDreams.length))
    .join('');

  return `
    <html lang="${payload.locale}">
      <head>
        <meta charset="utf-8" />
        <style>
          @page { margin: 16mm 14mm 18mm; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; }
          body {
            background: #ffffff;
            color: #1e2430;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 11pt;
            line-height: 1.65;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          h1, h2, h3, p { margin: 0; }
          .document { display: block; }
          .front-matter {
            page-break-after: always;
            break-after: page;
            padding-bottom: 8mm;
          }
          .front-shell {
            border: 1px solid #d8dee8;
            padding: 14mm 12mm;
            background: linear-gradient(180deg, #f6f2ea 0%, #ffffff 60%);
          }
          .eyebrow,
          .detail-label,
          .summary-card-label,
          .section-kicker,
          .entry-sequence,
          .entry-flag,
          .meta-label,
          .entry-block-label {
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 8.5pt;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }
          .eyebrow {
            color: #6c7383;
            margin-bottom: 12px;
          }
          .hero-title {
            font-size: 29pt;
            line-height: 1.02;
            color: #121720;
            margin-bottom: 10px;
          }
          .hero-subtitle {
            max-width: 520px;
            color: #485062;
            font-size: 12pt;
          }
          .export-stamp {
            margin-top: 18px;
            color: #202736;
            font-size: 12pt;
          }
          .front-divider,
          .entry-divider {
            height: 1px;
            background: #d8dee8;
          }
          .front-divider {
            margin: 20px 0 18px;
          }
          .detail-grid,
          .summary-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
          }
          .detail-row {
            min-width: 180px;
            flex: 1 1 30%;
            padding: 10px 0 0;
            border-top: 1px solid #e1e6ef;
          }
          .detail-label {
            color: #6e7484;
            margin-bottom: 4px;
          }
          .detail-value {
            color: #181f2d;
            font-size: 11pt;
            line-height: 1.4;
          }
          .section-kicker {
            color: #6e7484;
            margin: 22px 0 10px;
          }
          .summary-card {
            min-width: 168px;
            flex: 1 1 22%;
            padding: 12px 13px;
            border: 1px solid #dfe4ec;
            background: #fbfbfa;
          }
          .summary-card-label {
            display: block;
            color: #6e7484;
            margin-bottom: 6px;
          }
          .summary-card-value {
            color: #171d29;
            font-size: 15pt;
            line-height: 1.2;
          }
          .entries-header {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: baseline;
            margin-bottom: 16px;
          }
          .section-title {
            font-size: 18pt;
            line-height: 1.15;
            color: #131924;
          }
          .entries-count {
            font-family: "Helvetica Neue", Arial, sans-serif;
            color: #6c7383;
            font-size: 10pt;
          }
          .entry-list {
            display: block;
          }
          .entry-sheet {
            page-break-inside: auto;
            break-inside: auto;
            padding: 0 0 10mm;
            margin: 0 0 10mm;
          }
          .entry-sheet + .entry-sheet {
            border-top: 1px solid #d8dee8;
            padding-top: 10mm;
          }
          .entry-head {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 14px;
          }
          .entry-sequence-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: flex-start;
            margin-bottom: 8px;
          }
          .entry-sequence {
            color: #6d7383;
          }
          .entry-flags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            justify-content: flex-end;
          }
          .entry-flag {
            color: #495264;
            padding: 4px 8px;
            border: 1px solid #d9dfe8;
            border-radius: 999px;
            background: #fafbfc;
          }
          .entry-title {
            font-size: 19pt;
            line-height: 1.12;
            color: #151b25;
            margin-bottom: 4px;
          }
          .entry-subtitle {
            color: #576073;
            font-size: 11.5pt;
            font-style: italic;
          }
          .entry-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px 18px;
            padding: 12px 0;
            border-top: 1px solid #e0e5ee;
            border-bottom: 1px solid #e0e5ee;
            margin-bottom: 16px;
          }
          .meta-row {
            min-width: 210px;
            flex: 1 1 44%;
          }
          .meta-label {
            display: block;
            color: #6e7484;
            margin-bottom: 4px;
          }
          .meta-value {
            display: block;
            color: #1d2534;
            line-height: 1.45;
          }
          .entry-body {
            display: block;
          }
          .entry-block {
            margin-bottom: 20px;
          }
          .entry-block:last-child {
            margin-bottom: 0;
          }
          .entry-block-label {
            color: #666f80;
            margin-bottom: 6px;
            page-break-after: avoid;
            break-after: avoid;
          }
          .entry-block-text {
            color: #1f2634;
            orphans: 3;
            widows: 3;
          }
          .entry-block-text p {
            margin: 0 0 12px;
          }
          .entry-block-text p:last-child {
            margin-bottom: 0;
          }
          .entry-empty,
          .entry-empty-state {
            color: #5d6678;
            font-size: 11.5pt;
          }
        </style>
      </head>
      <body>
        <main class="document">
          <section class="front-matter">
            <div class="front-shell">
              <div class="eyebrow">${escapeHtml(copy.exportedAt)}</div>
              <h1 class="hero-title">${escapeHtml(copy.archiveTitle)}</h1>
              <p class="hero-subtitle">${escapeHtml(copy.archiveSubtitle)}</p>
              <div class="export-stamp">${escapeHtml(exportedAt)}</div>

              <div class="front-divider"></div>

              <section class="detail-grid">
                ${renderDetailRow(copy.version, payload.appVersion)}
                ${renderDetailRow(copy.locale, formatLocaleDisplayName(payload.locale))}
                ${renderDetailRow(copy.platform, payload.platform)}
                ${renderDetailRow(copy.storage, String(payload.storageSchemaVersion))}
                ${renderDetailRow(copy.draft, payload.summary.draftIncluded ? copy.included : copy.missing)}
                ${renderDetailRow(copy.readingOrder, copy.newestFirst)}
              </section>

              <div class="section-kicker">${escapeHtml(copy.summary)}</div>
              <section class="summary-grid">
                ${renderSummaryCard(copy.dreams, String(payload.summary.dreamCount))}
                ${renderSummaryCard(copy.archived, String(payload.summary.archivedDreamCount))}
                ${renderSummaryCard(copy.starred, String(payload.summary.starredDreamCount))}
                ${renderSummaryCard(copy.audio, String(payload.summary.audioDreamCount))}
                ${renderSummaryCard(copy.transcripts, String(payload.summary.transcribedDreamCount))}
                ${renderSummaryCard(copy.analyzed, String(payload.summary.analyzedDreamCount))}
                ${renderSummaryCard(
                  copy.newestEntry,
                  newestDream ? formatDreamDate(newestDream, payload.locale) : copy.missing,
                )}
                ${renderSummaryCard(
                  copy.oldestEntry,
                  oldestDream ? formatDreamDate(oldestDream, payload.locale) : copy.missing,
                )}
              </section>
            </div>
          </section>

          <section class="entries-section">
            <div class="entries-header">
              <h2 class="section-title">${escapeHtml(copy.dreams)}</h2>
              <div class="entries-count">${escapeHtml(String(payload.summary.dreamCount))}</div>
            </div>

            ${dreamEntries
              ? `<section class="entry-list">${dreamEntries}</section>`
              : `<div class="entry-empty-state">${escapeHtml(copy.noDreams)}</div>`}
          </section>
        </main>
      </body>
    </html>
  `;
}
