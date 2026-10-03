/**
 * Split an uploaded story document into model-sized chunks.
 *
 * Chapters are the natural unit: cutting by raw character count severs a scene mid-way and
 * loses the character and timeline context the digests depend on. Small chapters are merged to
 * fill a chunk, and only a chapter that cannot fit on its own is split further.
 *
 * The budget is recomputed per chunk because every chunk carries the digests produced so far.
 */
import { computeStoryInputBudget, estimateTextTokens } from './textModelContextBudget.js';

// Rough size of one chunk's structured digest, used to project the carried context.
export const DEFAULT_DIGEST_TOKENS_PER_CHUNK = 0x9c4;

// Hard ceiling on the carried context, as a share of the window.
//
// Carrying every digest forward grows without bound and eventually eats the whole window: on a
// 32k window the chunks shrank to a few hundred characters and the plan then stalled. What has
// to survive between chunks is the consistency brief (names, places, timeline anchors), not
// every digest, so the carried context is capped and chunks stay a stable size.
export const CARRIED_CONTEXT_WINDOW_RATIO = 0.15;

// Aligns with storySummaryRun's invocation ceiling so a plan stays inside one run.
export const DEFAULT_MAX_SOURCE_CHUNKS = 0x8;

function normalizeText(value) {
  return String(value ?? '').trim();
}

function splitParagraphs(text) {
  return String(text ?? '')
    .split(/\n\s*\n/u)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Hard split for a single paragraph that cannot fit in an empty chunk. */
function splitOversizedBlock(text, limit) {
  const value = String(text ?? '');
  if (limit <= 0x0 || value.length <= limit) return [value];
  const pieces = [];
  for (let index = 0x0; index < value.length; index += limit)
    pieces.push(value.slice(index, index + limit));
  return pieces;
}

/**
 * Normalise whatever the upload parser produced into { title, text } entries.
 * Falls back to paragraph splitting when the document has no chapter structure.
 */
export function normalizeStorySourceChapters(chapters) {
  const list = Array.isArray(chapters) ? chapters : [];
  const normalized = list
    .map((chapter, index) => ({
      title: normalizeText(chapter?.title) || '第 ' + (index + 0x1) + ' 章',
      text: normalizeText(chapter?.content ?? chapter?.text),
    }))
    .filter((chapter) => chapter.text);
  return normalized;
}

/**
 * Build the plan.
 * @returns {{ chunks: Array, budget: object, totalCharacters: number, overflow: boolean, reason: string }}
 */
export function planStorySourceChunks({
  chapters = [],
  modelId = '',
  manifest = null,
  contextTokens = null,
  templateTokens = 0x0,
  digestTokensPerChunk = DEFAULT_DIGEST_TOKENS_PER_CHUNK,
  carriedTokenCap = null,
  maxChunks = DEFAULT_MAX_SOURCE_CHUNKS,
} = {}) {
  const source = normalizeStorySourceChapters(chapters);
  const totalCharacters = source.reduce((sum, chapter) => sum + chapter.text.length, 0x0);
  const baseBudget = computeStoryInputBudget({
    modelId: modelId,
    manifest: manifest,
    contextTokens: contextTokens,
    templateTokens: templateTokens,
  });

  if (!source.length)
    return Object.freeze({
      chunks: Object.freeze([]),
      budget: baseBudget,
      totalCharacters: 0x0,
      overflow: false,
      reason: 'empty-source',
    });

  const chunks = [];
  // Text of the chunk being filled, plus the chapters it came from.
  let pending = { texts: [], chapterIds: [], labels: [], characters: 0x0, splitNote: false };

  const flush = () => {
    if (!pending.texts.length) return;
    chunks.push({
      index: chunks.length,
      text: pending.texts.join('\n\n'),
      chapterIds: pending.chapterIds.slice(),
      labels: pending.labels.slice(),
      characters: pending.characters,
      estimatedTokens: estimateTextTokens(pending.texts.join('\n\n')),
      carriedTokens: projectedCarriedTokens(chunks.length),
      splitNote: pending.splitNote,
    });
    pending = { texts: [], chapterIds: [], labels: [], characters: 0x0, splitNote: false };
  };

  function projectedCarriedTokens(index) {
    if (index === 0x0) return 0x0;
    const projected = Math.max(0x0, Math.trunc(digestTokensPerChunk)) * index;
    return Math.min(projected, carriedCap);
  }

  function budgetFor(index) {
    return computeStoryInputBudget({
      modelId: modelId,
      manifest: manifest,
      contextTokens: contextTokens,
      templateTokens: templateTokens,
      carriedTokens: projectedCarriedTokens(index),
    });
  }

  // Cap the carried context so later chunks are not squeezed into uselessness.
  // Note: null must be excluded explicitly, because Number(null) is 0 and would otherwise
  // be taken as an explicit cap of zero, flattening every carried context to nothing.
  const hasExplicitCap =
    carriedTokenCap !== null &&
    carriedTokenCap !== undefined &&
    Number.isFinite(Number(carriedTokenCap)) &&
    Number(carriedTokenCap) >= 0x0;
  const carriedCap = hasExplicitCap
    ? Math.trunc(Number(carriedTokenCap))
    : Math.floor(baseBudget.contextTokens * CARRIED_CONTEXT_WINDOW_RATIO);

  let exhausted = false;

  for (const chapter of source) {
    const limit = budgetFor(chunks.length).usableCharacters;

    // The carried digests alone already fill the window: no chunk can be built any more.
    // Stop and report rather than emitting a chunk that would be rejected by the model.
    if (limit <= 0x0) {
      exhausted = true;
      break;
    }

    // Fits next to what is already buffered.
    if (pending.characters + chapter.text.length <= limit) {
      pending.texts.push(chapter.text);
      pending.chapterIds.push(chapter.title);
      pending.labels.push(chapter.title);
      pending.characters += chapter.text.length;
      continue;
    }

    // Buffer holds something: close it, then retry this chapter on a fresh chunk.
    if (pending.characters > 0x0) {
      flush();
      const retryLimit = budgetFor(chunks.length).usableCharacters;
      if (chapter.text.length <= retryLimit) {
        pending.texts.push(chapter.text);
        pending.chapterIds.push(chapter.title);
        pending.labels.push(chapter.title);
        pending.characters += chapter.text.length;
        continue;
      }
    }

    // A single chapter is larger than an empty chunk: split it at paragraph boundaries.
    // The limit is re-read after every flush because the carried digests keep growing.
    let bufferText = '';
    const paragraphs = splitParagraphs(chapter.text);
    const parts = paragraphs.length ? paragraphs : [chapter.text];
    const pushPiece = (piece) => {
      const limit = budgetFor(chunks.length).usableCharacters;
      if (bufferText && bufferText.length + piece.length + 0x2 > limit) {
        pending.texts.push(bufferText);
        pending.chapterIds.push(chapter.title);
        pending.labels.push(chapter.title);
        pending.characters += bufferText.length;
        pending.splitNote = true;
        flush();
        bufferText = '';
      }
      bufferText = bufferText ? bufferText + '\n\n' + piece : piece;
    };

    for (const part of parts) {
      const limit = budgetFor(chunks.length).usableCharacters;
      const pieces = part.length > limit ? splitOversizedBlock(part, limit) : [part];
      for (const piece of pieces) pushPiece(piece);
    }
    if (bufferText) {
      pending.texts.push(bufferText);
      pending.chapterIds.push(chapter.title);
      pending.labels.push(chapter.title);
      pending.characters += bufferText.length;
      pending.splitNote = true;
    }
  }
  flush();

  const coveredCharacters = chunks.reduce((sum, chunk) => sum + chunk.characters, 0x0);
  const overflow =
    exhausted ||
    coveredCharacters < totalCharacters ||
    chunks.length > Math.max(0x1, Math.trunc(Number(maxChunks) || 0x1));
  return Object.freeze({
    chunks: Object.freeze(chunks),
    budget: baseBudget,
    totalCharacters: totalCharacters,
    coveredCharacters: coveredCharacters,
    overflow: overflow,
    reason: exhausted
      ? 'budget-exhausted'
      : coveredCharacters < totalCharacters
        ? 'source-not-fully-covered'
        : chunks.length > Math.max(0x1, Math.trunc(Number(maxChunks) || 0x1))
          ? 'beyond-max-chunks'
          : 'ok',
  });
}
