import {
  buildGenerationCollectionResultPatch,
  firstNonEmptyString,
  getFirstGenerationResultError,
  normalizeGenerationResultItems,
} from '../../core/generationResultRenderer.js';
import { localPathToUrl, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { t } from '../../i18n/index.js';
function videoGenerationResultText(value, item = {}) {
  return t('videoGenerationResult.' + value, item);
}
function asObject(key) {
  return key && typeof key === 'object' && !Array.isArray(key) ? key : null;
}
function normalizeVideoGenerationResultItem(index) {
  const metadata = asObject(index);
  if (!metadata) throw new Error('[videoGenerationResult] item must be an object');
  const localPath = firstNonEmptyString(metadata.localPath, pickResultLocalPath(metadata)),
    videoUrl = firstNonEmptyString(
      metadata.videoUrl,
      metadata.url,
      metadata.localUrl,
      localPathToUrl(localPath),
    ),
    result = {
      ...metadata,
      outputType: 'video',
      videoUrl: videoUrl,
      localPath: localPath,
      thumbUrl: firstNonEmptyString(metadata.thumbUrl, metadata.posterUrl),
      thumbId: firstNonEmptyString(metadata.thumbId, metadata.assetId),
      metadata: metadata.metadata && typeof metadata.metadata === 'object' ? { ...metadata.metadata } : {},
    },
    nonEmptyString = firstNonEmptyString(metadata.error);
  if (nonEmptyString) result.error = nonEmptyString;
  return result;
}
function removeMediaFieldPatch(enabled) {
  if (!enabled || typeof enabled !== 'object') return enabled;
  for (const data of ['videoUrl', 'localPath', 'thumbId', 'thumbUrl']) {
    delete enabled[data];
  }
  return enabled;
}
export function normalizeVideoGenerationResult(options) {
  const items = normalizeGenerationResultItems(options, {
    collectionField: 'videos',
    singleItemFields: ['videoUrl', 'url', 'localUrl', 'localPath', 'thumbUrl'],
  });
  if (items.length === 0) return { outputType: 'video', items: [] };
  return {
    outputType: 'video',
    items: items.map((item2) => normalizeVideoGenerationResultItem(item2)),
  };
}
export function getVideoGenerationResultError(target) {
  return getFirstGenerationResultError(
    target?.outputType === 'video' && Array.isArray(target.items) ? target.items : target,
    { collectionField: 'videos', singleItemFields: ['videoUrl', 'url', 'localUrl', 'localPath', 'thumbUrl'] },
  );
}
export function getSuccessfulVideoGenerationItems(source) {
  const next =
    source?.outputType === 'video' && Array.isArray(source.items)
      ? source
      : normalizeVideoGenerationResult(source);
  return next.items.filter((enabled2) => enabled2 && !enabled2.error);
}
export function buildVideoGenerationResultPatch(
  current,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const entry =
    current?.outputType === 'video' && Array.isArray(current.items)
      ? current
      : normalizeVideoGenerationResult(current);
  return buildGenerationCollectionResultPatch(entry, {
    collectionField: 'videos',
    mainIndexField: 'mainVideoIndex',
    expandedField: 'isVideosExpanded',
    startedAt: startedAt,
    duration: duration,
    buildFirstItemPatch: (videoUrl2) => ({
      videoUrl: videoUrl2.videoUrl,
      localPath: videoUrl2.localPath,
      displayLocalPath: videoUrl2.displayLocalPath || '',
      posterLocalPath: videoUrl2.posterLocalPath || '',
      videoProxyStatus: videoUrl2.videoProxyStatus || '',
      videoCodec: videoUrl2.videoCodec || '',
      thumbId: videoUrl2.thumbId,
      thumbUrl: videoUrl2.thumbUrl,
    }),
    extraPatch: { rhStatusMessage: null, rhStatusCode: null },
  });
}
export function buildVideoGenerationFailurePatch({
  error: error = '',
  startedAt: startedAt = 0,
  duration: duration = null,
  clearMediaFields: clearMediaFields = true,
} = {}) {
  const error2 = firstNonEmptyString(error, videoGenerationResultText('failed')),
    generationCollectionResultPatch = buildGenerationCollectionResultPatch(
      { outputType: 'video', items: [{ error: error2, thumbUrl: '', videoUrl: '', localPath: '' }] },
      {
        collectionField: 'videos',
        mainIndexField: 'mainVideoIndex',
        startedAt: startedAt,
        duration: duration,
        buildFirstItemPatch: () => ({ videoUrl: '', localPath: '', thumbId: '', thumbUrl: '' }),
      },
    );
  return clearMediaFields
    ? generationCollectionResultPatch
    : removeMediaFieldPatch(generationCollectionResultPatch);
}
