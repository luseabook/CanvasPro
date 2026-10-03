/**
 * Context-window aware budgeting for long story documents.
 *
 * The rewrite pipeline used to send the whole uploaded script in a single model call, but the
 * upload limit is 100 000 characters while a model's usable input is far smaller. Chunking needs
 * to know that limit, and the model is user-selectable, so a hard-coded chunk size is wrong in
 * both directions: too small wastes calls on large-window models, too large fails outright on
 * small-window ones.
 *
 * Resolution order (first match wins):
 *   1. the model manifest, via extensions.textMenu.contextWindow
 *   2. TEXT_MODEL_CONTEXT_OVERRIDES, an exact modelId table
 *   3. TEXT_MODEL_CONTEXT_FAMILY_FLOORS, a conservative per-family floor
 *   4. DEFAULT_TEXT_MODEL_CONTEXT_TOKENS
 *
 * Anything resolved below the manifest is an estimate, so callers get back the source and a
 * 'known' flag and are expected to tell the user when the window is only assumed.
 */

// 32k: integer, generous for older models, safe as a floor for anything unrecognised.
export const DEFAULT_TEXT_MODEL_CONTEXT_TOKENS = 0x8000;

// Families whose whole line-up is comfortably at or above 128k. Used as a floor, never a ceiling.
export const TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS = 0x20000;

// Exact modelIds that need a value different from their family floor or the default.
//
// PROVISIONAL: these are estimates, not values read back from the providers. They exist so a
// model with no recognisable family prefix does not silently fall back to the 32k default.
// Every entry should be confirmed against the provider's documentation (or by probing) before
// it is trusted; a wrong value here that is too large makes the request fail outright.
export const TEXT_MODEL_CONTEXT_OVERRIDES = Object.freeze({
  'gpt-5.4-mini': 0x20000,
  'agnes-2.0-flash': 0x20000,
  'step-3.7-flash': 0x20000,
  'mimo-v2.5-pro': 0x20000,
  'minimax-m2.7': 0x20000,
  'minimax/minimax-m2.5-highspeed': 0x20000,
});

const FAMILY_FLOORS = Object.freeze([
  ['claude', TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS],
  ['gemini', TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS],
  ['gpt-', TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS],
  ['deepseek', TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS],
  ['qwen', TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS],
  ['doubao', TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS],
  ['kimi', TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS],
  ['moonshot', TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS],
  ['glm', TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS],
  ['grok', TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS],
  ['minimax', TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS],
  ['rhart-text', TEXT_MODEL_CONTEXT_FAMILY_FLOOR_TOKENS],
]);

// Characters per token. CJK is roughly one token per character; latin is far cheaper. Treating
// every character as a token over-estimates mixed text, which is the safe direction here.
export const TEXT_MODEL_CHARS_PER_TOKEN = 0x1;

// Leave a quarter of the window for the answer, then keep a further safety margin.
export const TEXT_MODEL_OUTPUT_RESERVE_RATIO = 0.25;
export const TEXT_MODEL_SAFETY_RATIO = 0.85;

function normalizeModelId(modelId) {
  return String(modelId ?? '').trim().toLowerCase();
}

function isPositiveInteger(value) {
  return Number.isFinite(value) && value > 0;
}

function readManifestContextWindow(manifest) {
  const fromMenu = manifest?.extensions?.textMenu?.contextWindow;
  if (isPositiveInteger(Number(fromMenu))) return Math.trunc(Number(fromMenu));
  const direct = manifest?.contextWindow;
  return isPositiveInteger(Number(direct)) ? Math.trunc(Number(direct)) : null;
}

/**
 * Resolve the input window for a text model.
 * @returns {{ tokens: number, known: boolean, source: 'manifest'|'override'|'family'|'default' }}
 */
export function resolveTextModelContextWindow(modelId, { manifest = null } = {}) {
  const fromManifest = readManifestContextWindow(manifest);
  if (fromManifest) return { tokens: fromManifest, known: true, source: 'manifest' };

  const id = normalizeModelId(modelId);
  if (!id) return { tokens: DEFAULT_TEXT_MODEL_CONTEXT_TOKENS, known: false, source: 'default' };

  if (isPositiveInteger(TEXT_MODEL_CONTEXT_OVERRIDES[id]))
    return { tokens: TEXT_MODEL_CONTEXT_OVERRIDES[id], known: false, source: 'override' };

  const family = FAMILY_FLOORS.find(([prefix]) => id.includes(prefix));
  if (family) return { tokens: family[1], known: false, source: 'family' };

  return { tokens: DEFAULT_TEXT_MODEL_CONTEXT_TOKENS, known: false, source: 'default' };
}

/** Conservative token estimate for a piece of text. */
export function estimateTextTokens(text) {
  const value = String(text ?? '');
  if (!value) return 0x0;
  return Math.ceil(value.length * TEXT_MODEL_CHARS_PER_TOKEN);
}

/** Inverse of {@link estimateTextTokens}: how much text fits in a token budget. */
export function estimateCharactersForTokens(tokens) {
  const value = Number(tokens);
  if (!Number.isFinite(value) || value <= 0x0) return 0x0;
  return Math.floor(value / TEXT_MODEL_CHARS_PER_TOKEN);
}

/**
 * Work out how much source text one chunk may carry.
 *
 * Everything the model must read besides the chunk itself is subtracted first: the prompt
 * template, the digests already produced by earlier chunks, and the reserved output budget.
 */
export function computeStoryInputBudget({
  modelId = '',
  manifest = null,
  contextTokens = null,
  templateTokens = 0x0,
  carriedTokens = 0x0,
  outputReserveTokens = null,
  outputReserveRatio = TEXT_MODEL_OUTPUT_RESERVE_RATIO,
  safetyRatio = TEXT_MODEL_SAFETY_RATIO,
} = {}) {
  const resolved = isPositiveInteger(Number(contextTokens))
    ? { tokens: Math.trunc(Number(contextTokens)), known: true, source: 'explicit' }
    : resolveTextModelContextWindow(modelId, { manifest: manifest });

  const reserve = isPositiveInteger(Number(outputReserveTokens))
    ? Math.trunc(Number(outputReserveTokens))
    : Math.floor(resolved.tokens * outputReserveRatio);

  const overhead = Math.max(0x0, Math.trunc(Number(templateTokens) || 0x0)) +
    Math.max(0x0, Math.trunc(Number(carriedTokens) || 0x0));

  const availableTokens = Math.max(0x0, resolved.tokens - reserve - overhead);
  const usableTokens = Math.floor(availableTokens * safetyRatio);

  return Object.freeze({
    contextTokens: resolved.tokens,
    known: resolved.known,
    source: resolved.source,
    outputReserveTokens: reserve,
    templateTokens: Math.max(0x0, Math.trunc(Number(templateTokens) || 0x0)),
    carriedTokens: Math.max(0x0, Math.trunc(Number(carriedTokens) || 0x0)),
    availableTokens: availableTokens,
    usableTokens: usableTokens,
    usableCharacters: estimateCharactersForTokens(usableTokens),
  });
}
