/**
 * Chapter batch panel for adapting a novel in several passes.
 *
 * Shown in the upload tab once a novel has been parsed. The user ticks the chapters for this
 * batch, sees how many episodes that implies, and starts the conversion.
 */
import { describeEpisodeCountFit, summarizeChapterProgress, suggestEpisodeCount } from './storyChapterSelection.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function renderChapterRow(chapter, selected) {
  const id = escapeHtml(chapter.id);
  const done = chapter.adaptation === 'done';
  return (
    '<label class="story-novel-chapter' +
    (done ? ' is-done' : '') +
    (selected ? ' is-selected' : '') +
    '">' +
    '<input type="checkbox" data-story-action="toggle-novel-chapter" data-story-novel-chapter="' +
    id +
    '"' +
    (selected ? ' checked' : '') +
    (done ? ' disabled' : '') +
    '>' +
    '<span class="story-novel-chapter-title">' +
    escapeHtml(chapter.title || chapter.id) +
    '</span>' +
    '<span class="story-novel-chapter-size">' +
    chapter.characters +
    ' 字</span>' +
    (done ? '<span class="story-novel-chapter-badge">已完成</span>' : '') +
    '</label>'
  );
}

/**
 * @param {object} state story home state carrying novelChapters / novelSelectedChapterIds / novelEpisodeCount
 * @returns {string} markup
 */
export function renderStoryNovelBatchPanel(state = {}) {
  const chapters = Array.isArray(state.novelChapters) ? state.novelChapters : [];
  if (!chapters.length) return '';

  const selectedIds = Array.isArray(state.novelSelectedChapterIds)
    ? state.novelSelectedChapterIds.map(normalizeText)
    : [];
  const selectedSet = new Set(selectedIds);
  const selected = chapters.filter((chapter) => selectedSet.has(chapter.id));
  const selectedCharacters = selected.reduce((total, chapter) => total + chapter.characters, 0);
  const progress = summarizeChapterProgress(chapters);
  const suggestion = suggestEpisodeCount(selectedCharacters);

  const rawCount = Number(state.novelEpisodeCount);
  const episodeCount =
    Number.isFinite(rawCount) && rawCount > 0 ? Math.trunc(rawCount) : suggestion.recommended;
  const fit = describeEpisodeCountFit({ characters: selectedCharacters, episodeCount: episodeCount });

  const rows = chapters.map((chapter) => renderChapterRow(chapter, selectedSet.has(chapter.id))).join('');

  return (
    '<div class="story-home-composer-panel story-novel-batch">\n' +
    '    <div class="story-novel-batch-head">\n' +
    '      <strong>按批次改编小说</strong>\n' +
    '      <span class="story-novel-batch-progress">已完成 ' +
    progress.doneCount +
    '/' +
    progress.total +
    ' 章' +
    (progress.nextPendingId ? ' · 剩余 ' + progress.pendingCount + ' 章' : ' · 全部完成') +
    '</span>\n' +
    '    </div>\n' +
    '    <div class="story-novel-chapter-list" data-story-novel-chapter-list>' +
    rows +
    '</div>\n' +
    '    <div class="story-novel-batch-summary">\n' +
    '      <span data-story-novel-selection-summary>已选 ' +
    selected.length +
    ' 章 / ' +
    selectedCharacters +
    ' 字</span>\n' +
    '      <span class="story-novel-batch-hint">建议 ' +
    suggestion.min +
    '–' +
    suggestion.max +
    ' 集</span>\n' +
    '    </div>\n' +
    (fit.level === 'ok'
      ? ''
      : '    <p class="story-novel-batch-warning" data-story-novel-batch-warning>' +
        escapeHtml(fit.message) +
        '</p>\n') +
    '    <div class="story-novel-batch-episodes">\n' +
    '      <label for="storyNovelEpisodeCount">分几集</label>\n' +
    '      <input id="storyNovelEpisodeCount" type="number" min="1" step="1" data-story-novel-episode-count value="' +
    episodeCount +
    '">\n' +
    '    </div>\n' +
    '    <div class="story-upload-actions">\n' +
    '      <button type="button" class="story-secondary-button button-press-feedback" data-story-action="select-all-novel-chapters"><span>全选本批</span></button>\n' +
    '      <button type="button" class="story-secondary-button button-press-feedback" data-story-action="clear-novel-chapters"><span>清空选择</span></button>\n' +
    '      <button type="button" class="story-primary-button button-press-feedback" data-story-action="start-novel-conversion"' +
    (selected.length ? '' : ' disabled') +
    '><span>开始转换 →</span></button>\n' +
    '    </div>\n' +
    '  </div>'
  );
}
