// Input normalization/validation helpers extracted from storyGenerationApi.js.

import { getResultText } from './story-generation/storyTextRequest.js';
import { normalizeStringArray, normalizeText } from './utils/storyGenerationValues.js';
import {
  normalizeStoryPlanningConstraints,
  normalizeStoryScriptMode,
  validateStoryPlanningConstraints,
} from '../src/domain/storyGeneration/planningContract.js';

export const STORY_EPISODE_DEV_RESPONSE_HISTORY_LIMIT = 6;
export const STORY_CONTINUITY_MAX_CHARACTER_STATES = 12;
export const STORY_CONTINUITY_MAX_PROP_STATES = 10;
export const STORY_CONTINUITY_MAX_UNRESOLVED_THREADS = 8;
export const STORY_CONTINUITY_MAX_FACTS = 12;

export function createStoryEpisodeExperimentalStructuredOutput(name, schema) {
  return { name: name, schema: schema, strict: true, fallback: 'prompt' };
}
export function normalizeStoryContinuityFacts(value) {
  return normalizeStringArray(value).slice(0, STORY_CONTINUITY_MAX_FACTS);
}
export function normalizeStoryContinuityState(options = {}) {
  const item = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
  return {
    characters: normalizeStringArray(item.characters || item.characterStates).slice(
      0,
      STORY_CONTINUITY_MAX_CHARACTER_STATES,
    ),
    props: normalizeStringArray(item.props || item.propStates || item.items).slice(
      0,
      STORY_CONTINUITY_MAX_PROP_STATES,
    ),
    unresolvedThreads: normalizeStringArray(
      item.unresolvedThreads || item.threads || item.openThreads,
    ).slice(0, STORY_CONTINUITY_MAX_UNRESOLVED_THREADS),
  };
}
export function hasStoryContinuityState(options2 = {}) {
  const storyContinuityState = normalizeStoryContinuityState(options2);
  return (
    storyContinuityState.characters.length > 0 ||
    storyContinuityState.props.length > 0 ||
    storyContinuityState.unresolvedThreads.length > 0
  );
}
export function normalizeStoryProjectInput(options3 = {}) {
  const chapters = Array.isArray(options3?.chapters)
    ? options3.chapters
        .map((key, data) => ({
          id: normalizeText(key?.id) || 'chapter-' + (data + 1),
          title: normalizeText(key?.title),
          content: normalizeText(key?.content),
        }))
        .filter((target) => target.title || target.content)
    : [];
  return {
    title: normalizeText(options3?.title),
    storyType: normalizeText(options3?.storyType),
    summary: normalizeText(options3?.summary || options3?.storySummary),
    background: normalizeText(options3?.background || options3?.storyBackground),
    setting: normalizeText(options3?.setting || options3?.storySetting),
    logline: normalizeText(options3?.logline),
    scriptMode: normalizeStoryScriptMode(options3?.scriptMode),
    aspectRatio: normalizeText(options3?.aspectRatio) || '16:9',
    visualStyle: normalizeText(
      options3?.videoStylePrompt || options3?.visualStyle || options3?.videoStyle,
    ),
    promptMode: normalizeText(options3?.planning?.promptMode).toLowerCase() || 'seedance-2.0',
    chapters: chapters,
    planning: normalizeStoryPlanningConstraints(options3?.planning),
  };
}
export function assertStoryProjectInput(enabled) {
  if (!enabled.title || !enabled.chapters.length) throw new Error('请先完成故事大纲和章节内容。');
}
export function resolveStoryPlanningConstraints(options4 = {}, source = {}) {
  const next =
    source &&
    typeof source === 'object' &&
    (Object.prototype.hasOwnProperty.call(source, 'episodeCount') ||
      Object.prototype.hasOwnProperty.call(source, 'sceneMaxSeconds'));
  return validateStoryPlanningConstraints(next ? source : options4?.planning);
}
export function resolveStoryPromptMode(options5 = {}, current = {}) {
  const text = normalizeText(current?.promptMode).toLowerCase();
  return text || normalizeText(options5?.planning?.promptMode).toLowerCase() || 'seedance-2.0';
}
export function normalizeStoryMode(record) {
  return record === 'upload' ? 'upload' : 'generate';
}
export function stringifyStoryEpisodeDevResponse(payload) {
  if (typeof payload === 'string') return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload || '');
  }
}
export function captureStoryEpisodeScriptDevResponse({
  response: response,
  attempt: attempt = 1,
  episodeRef: episodeRef = '',
  episodeNumber: episodeNumber = 1,
  model: model = '',
  provider: provider = '',
  windowObject: windowObject = globalThis.window,
  consoleObject: consoleObject = globalThis.console,
  capturedAt: capturedAt = new Date().toISOString(),
} = {}) {
  if (windowObject?.AI_CANVAS_IS_DEV_BUILD !== true) return null;
  const handle = {
      capturedAt: normalizeText(capturedAt),
      attempt: Math.max(1, Math.trunc(Number(attempt) || 1)),
      episodeRef: normalizeText(episodeRef),
      episodeNumber: Math.max(1, Math.trunc(Number(episodeNumber) || 1)),
      model: normalizeText(model),
      provider: normalizeText(provider),
      responseText: stringifyStoryEpisodeDevResponse(getResultText(response)),
    },
    args = Array.isArray(windowObject.__AIC_DEV_EPISODE_SCRIPT_RESPONSES__)
      ? windowObject.__AIC_DEV_EPISODE_SCRIPT_RESPONSES__
      : [];
  return (
    (windowObject.__AIC_DEV_EPISODE_SCRIPT_RESPONSES__ = [...args, handle].slice(
      -STORY_EPISODE_DEV_RESPONSE_HISTORY_LIMIT,
    )),
    consoleObject?.info?.('[storyWorkspace][episode-script][dev-response]', handle),
    handle
  );
}
