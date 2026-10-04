import {
  buildGenerationSingleResultPatch,
  firstNonEmptyString,
  getFirstGenerationResultError,
  normalizeGenerationResultItems,
} from '../../core/generationResultRenderer.js';
import { buildCanvasLocalAudioFields } from '../../services/canvasMediaLocalService.js';
import { normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { pickAudioDurationSec } from '../../services/audioMetadataService.js';
import { t } from '../../i18n/index.js';
function audioGenerationResultText(value, item = {}) {
  return t('audioGenerationResult.' + value, item);
}
function asObject(key) {
  return key && typeof key === 'object' && !Array.isArray(key) ? key : null;
}
function normalizeAudioGenerationResultItem(index) {
  const metadata = asObject(index);
  if (!metadata) throw new Error('[audioGenerationResult] item must be an object');
  const result = {
      ...metadata,
      outputType: 'audio',
      audioUrl: firstNonEmptyString(metadata.audioUrl, metadata.url, metadata.src, metadata.resultUrl),
      localPath: firstNonEmptyString(metadata.localPath, pickResultLocalPath(metadata)),
      metadata: metadata.metadata && typeof metadata.metadata === 'object' ? { ...metadata.metadata } : {},
    },
    audioDurationSec = pickAudioDurationSec(
      metadata.audioDuration,
      metadata.duration,
      metadata.metadata?.audioDuration,
      metadata.metadata?.duration,
    );
  if (audioDurationSec > 0) result.audioDuration = audioDurationSec;
  const nonEmptyString = firstNonEmptyString(metadata.error);
  if (nonEmptyString) result.error = nonEmptyString;
  return result;
}
export function normalizeAudioGenerationResult(data) {
  const items = normalizeGenerationResultItems(data, {
    collectionField: 'audios',
    singleItemFields: ['audioUrl', 'url', 'src', 'resultUrl', 'localPath'],
  });
  if (items.length === 0) return { outputType: 'audio', items: [] };
  return {
    outputType: 'audio',
    items: items.map((item2) => normalizeAudioGenerationResultItem(item2)),
  };
}
export function getAudioGenerationResultError(options) {
  return getFirstGenerationResultError(
    options?.outputType === 'audio' && Array.isArray(options.items) ? options.items : options,
    { collectionField: 'audios', singleItemFields: ['audioUrl', 'url', 'src', 'resultUrl', 'localPath'] },
  );
}
export function getSuccessfulAudioGenerationItems(target) {
  const source =
    target?.outputType === 'audio' && Array.isArray(target.items)
      ? target
      : normalizeAudioGenerationResult(target);
  return source.items.filter((enabled) => enabled && !enabled.error);
}
function buildAudioItemPatch(audioUrl) {
  const next = { audioUrl: audioUrl.audioUrl, src: audioUrl.src, localPath: audioUrl.localPath };
  for (const current of ['waveformLocalPath', 'assetId', 'derivativeStatus', 'fileName', 'audioDuration']) {
    if (audioUrl[current] !== undefined) next[current] = audioUrl[current];
  }
  return next;
}
async function resolvePersistedAudioItem(args, handler) {
  const audioUrl2 = firstNonEmptyString(args?.audioUrl);
  let localPath = firstNonEmptyString(args?.localPath),
    entry = null;
  if (!localPath && audioUrl2) {
    if (typeof handler !== 'function') throw new Error(audioGenerationResultText('localSaveFailed'));
    ((entry = await handler(audioUrl2)), (localPath = normalizeLocalPath(entry?.localPath || '')));
  }
  const args2 = buildCanvasLocalAudioFields({
    ...args,
    ...(entry && typeof entry === 'object' ? entry : {}),
    localPath: localPath,
    audioUrl: audioUrl2,
  });
  if (!args2.audioUrl || !args2.localPath) throw new Error(audioGenerationResultText('localSaveFailed'));
  return {
    ...args,
    ...(entry && typeof entry === 'object' ? entry : {}),
    ...args2,
    audioDuration:
      pickAudioDurationSec(args?.audioDuration, args?.duration, entry?.audioDuration, entry?.duration) ||
      undefined,
  };
}
function resolveLocalAudioItem(args3) {
  if (firstNonEmptyString(args3?.error)) return args3;
  const args4 = buildCanvasLocalAudioFields(args3);
  if (!args4.audioUrl || !args4.localPath)
    throw new Error(audioGenerationResultText('missingLocalAudioPath'));
  return { ...args3, ...args4 };
}
function buildAudioPatchFromItem(record, { startedAt: startedAt = 0, duration: duration = null } = {}) {
  return buildGenerationSingleResultPatch(
    { outputType: 'audio', items: [record] },
    {
      startedAt: startedAt,
      duration: duration,
      buildItemPatch: buildAudioItemPatch,
      extraPatch: { rhStatusMessage: null, rhStatusCode: null },
    },
  );
}
export function buildLocalAudioGenerationResultPatch(
  payload,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const handle =
    payload?.outputType === 'audio' && Array.isArray(payload.items)
      ? payload
      : normalizeAudioGenerationResult(payload);
  if (handle.items.length === 0) return null;
  return buildAudioPatchFromItem(resolveLocalAudioItem(handle.items[0]), {
    startedAt: startedAt,
    duration: duration,
  });
}
export async function buildAudioGenerationResultPatch(
  state,
  { startedAt: startedAt = 0, duration: duration = null, persistAudioOutput: persistAudioOutput } = {},
) {
  const config =
    state?.outputType === 'audio' && Array.isArray(state.items)
      ? state
      : normalizeAudioGenerationResult(state);
  if (config.items.length === 0) return null;
  const scope = config.items[0],
    nonEmptyString2 = firstNonEmptyString(scope?.error)
      ? scope
      : await resolvePersistedAudioItem(scope, persistAudioOutput);
  return buildAudioPatchFromItem(nonEmptyString2, { startedAt: startedAt, duration: duration });
}
