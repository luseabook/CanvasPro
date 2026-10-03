/**
 * Chapter-level bookkeeping for adapting one novel in several batches.
 *
 * A whole novel is too large to convert in one pass, so the user ticks the chapters they want
 * this time and the rest stay available. The state therefore has to survive between batches and
 * live above the project: a chapter counts as adapted whether or not its episodes ended up in
 * the project that happened to be selected.
 */

// How much source text one episode of a short drama should consume. Below the minimum an
// episode has too little to work with; above the maximum the episode has to compress so hard
// that detail is lost.
export const CHARS_PER_EPISODE_MIN = 0x1388; // 5000
export const CHARS_PER_EPISODE_MAX = 0x2710; // 10000
const CHARS_PER_EPISODE_TARGET = 0x1d4c; // 7500

// Default size of one batch, aligned with the single-document upload limit.
export const DEFAULT_BATCH_CHARACTER_BUDGET = 0x186a0; // 100000

export const CHAPTER_PENDING = 'pending';
export const CHAPTER_DONE = 'done';

function normalizeText(value) {
  return String(value ?? '').trim();
}

function positiveInt(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : fallback;
}

/**
 * Accepts the parser's { title, content } list and returns records with a stable id,
 * a character count and an adaptation status.
 */
export function normalizeChapterRecords(chapters) {
  const list = Array.isArray(chapters) ? chapters : [];
  const seen = new Set();
  return list
    .map((chapter, index) => {
      // Whitespace-only content is not usable text, so trim before measuring.
      const content = String(chapter?.content ?? chapter?.text ?? '').trim();
      let id = normalizeText(chapter?.id) || 'chapter-' + (index + 0x1);
      while (seen.has(id)) id = id + '-b';
      seen.add(id);
      return {
        id: id,
        title: normalizeText(chapter?.title) || '第 ' + (index + 0x1) + ' 章',
        content: content,
        characters: content.length,
        // 'done' survives re-normalisation; anything else is treated as still pending.
        adaptation: chapter?.adaptation === CHAPTER_DONE ? CHAPTER_DONE : CHAPTER_PENDING,
        batchId: normalizeText(chapter?.batchId),
      };
    })
    .filter((chapter) => chapter.characters > 0x0);
}

export function summarizeChapterProgress(chapters) {
  const list = Array.isArray(chapters) ? chapters : [];
  const done = list.filter((chapter) => chapter.adaptation === CHAPTER_DONE);
  const pending = list.filter((chapter) => chapter.adaptation !== CHAPTER_DONE);
  const sum = (items) => items.reduce((total, chapter) => total + chapter.characters, 0x0);
  return {
    total: list.length,
    doneCount: done.length,
    pendingCount: pending.length,
    totalCharacters: sum(list),
    doneCharacters: sum(done),
    pendingCharacters: sum(pending),
    // Where the next batch should start by default.
    nextPendingId: pending.length ? pending[0x0].id : '',
    complete: list.length > 0x0 && pending.length === 0x0,
  };
}

/** Fewest and most episodes that keep every episode inside the per-episode range. */
export function suggestEpisodeCount(characters) {
  const value = Math.max(0x0, Math.trunc(Number(characters) || 0x0));
  if (value <= 0x0) return { min: 0x1, recommended: 0x1, max: 0x1 };
  const min = Math.max(0x1, Math.ceil(value / CHARS_PER_EPISODE_MAX));
  const max = Math.max(min, Math.floor(value / CHARS_PER_EPISODE_MIN));
  const target = Math.round(value / CHARS_PER_EPISODE_TARGET);
  return { min: min, recommended: Math.min(Math.max(target, min), max), max: max };
}

/**
 * Judge a user-chosen episode count against the amount of source text selected.
 * @returns {{ level: 'ok'|'compressed'|'sparse', charsPerEpisode: number, message: string }}
 */
export function describeEpisodeCountFit({ characters = 0x0, episodeCount = 0x0 } = {}) {
  const value = Math.max(0x0, Math.trunc(Number(characters) || 0x0));
  const episodes = Math.trunc(Number(episodeCount) || 0x0);
  if (!episodes || value <= 0x0)
    return { level: 'ok', charsPerEpisode: 0x0, message: '' };
  const perEpisode = Math.floor(value / episodes);
  const suggested = suggestEpisodeCount(value);
  if (perEpisode > CHARS_PER_EPISODE_MAX)
    return {
      level: 'compressed',
      charsPerEpisode: perEpisode,
      message:
        '选中的 ' +
        value +
        ' 字压成 ' +
        episodes +
        ' 集，平均每集要吃掉 ' +
        perEpisode +
        ' 字原文，只能保留主线梗概，细节会大量丢失。建议 ' +
        suggested.recommended +
        ' 集左右。',
    };
  if (perEpisode < CHARS_PER_EPISODE_MIN)
    return {
      level: 'sparse',
      charsPerEpisode: perEpisode,
      message:
        '选中的原文只有 ' +
        value +
        ' 字，拆成 ' +
        episodes +
        ' 集后平均每集只有 ' +
        perEpisode +
        ' 字，内容可能撑不满。建议 ' +
        suggested.recommended +
        ' 集左右。',
    };
  return { level: 'ok', charsPerEpisode: perEpisode, message: '' };
}

/**
 * Pick the chapters for the next batch: pending chapters in reading order, up to the budget.
 * The first pending chapter is always included, even when it alone exceeds the budget, so the
 * selection can never come back empty.
 */
export function defaultChapterSelection(chapters, { budgetCharacters = DEFAULT_BATCH_CHARACTER_BUDGET } = {}) {
  const list = Array.isArray(chapters) ? chapters : [];
  const budget = positiveInt(budgetCharacters, DEFAULT_BATCH_CHARACTER_BUDGET);
  const chapterIds = [];
  let characters = 0x0;
  for (const chapter of list) {
    if (chapter.adaptation === CHAPTER_DONE) continue;
    if (chapterIds.length > 0x0 && characters + chapter.characters > budget) break;
    chapterIds.push(chapter.id);
    characters += chapter.characters;
  }
  return {
    chapterIds: chapterIds,
    characters: characters,
    episodeSuggestion: suggestEpisodeCount(characters),
  };
}

/** Mark a batch's chapters as adapted. Returns a new list; the input is not mutated. */
export function applyAdaptationResult(chapters, chapterIds, { batchId = '', at = 0x0 } = {}) {
  const selected = new Set((Array.isArray(chapterIds) ? chapterIds : []).map((id) => normalizeText(id)));
  return (Array.isArray(chapters) ? chapters : []).map((chapter) =>
    selected.has(chapter.id)
      ? { ...chapter, adaptation: CHAPTER_DONE, batchId: normalizeText(batchId), adaptedAt: Number(at) || 0x0 }
      : { ...chapter },
  );
}
