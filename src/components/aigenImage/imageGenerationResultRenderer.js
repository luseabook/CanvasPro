import {
  buildGenerationCollectionResultPatch,
  firstNonEmptyString,
  normalizeGenerationResultItems,
} from '../../core/generationResultRenderer.js';
import { buildImageNodeStorageFields } from '../../services/imageDerivativeService.js';
import { t } from '../../i18n/index.js';
function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}
function firstString(...args) {
  return firstNonEmptyString(...args);
}
function normalizeLegacyResultItems(item) {
  return normalizeGenerationResultItems(item, {
    collectionField: 'images',
    singleItemFields: ['sourceUrl', 'imageUrl', 'thumbUrl', 'localPath'],
  });
}
function normalizeImageResultItem(key) {
  const metadata = asObject(key);
  if (!metadata) throw new Error('[imageGenerationResult] item must be an object');
  const string = firstString(metadata.error),
    url = firstString(metadata.url, metadata.imageUrl, metadata.sourceUrl, metadata.thumbUrl),
    index = {
      ...metadata,
      outputType: 'image',
      url: url,
      sourceUrl: firstString(metadata.sourceUrl, metadata.url, metadata.imageUrl),
      imageUrl: firstString(metadata.imageUrl, metadata.url, metadata.sourceUrl),
      thumbUrl: firstString(metadata.thumbUrl, metadata.imageUrl, metadata.url, metadata.sourceUrl),
      localPath: firstString(metadata.localPath),
      metadata: metadata.metadata && typeof metadata.metadata === 'object' ? { ...metadata.metadata } : {},
      ...buildImageNodeStorageFields(metadata),
    };
  if (string) index.error = string;
  return index;
}
function removeMediaFieldPatch(enabled) {
  if (!enabled || typeof enabled !== 'object') return enabled;
  for (const result of [
    'imageUrl',
    'sourceUrl',
    'thumbUrl',
    'sourceId',
    'thumbId',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
    'originalWidth',
    'originalHeight',
  ]) {
    delete enabled[result];
  }
  return enabled;
}
export function normalizeImageGenerationResult(data) {
  const items = normalizeLegacyResultItems(data);
  if (items.length === 0) return { outputType: 'image', items: [] };
  return { outputType: 'image', items: items.map((item2) => normalizeImageResultItem(item2)) };
}
export function getImageGenerationResultError(options) {
  const imageGenerationResult = normalizeImageGenerationResult(options),
    list = getSuccessfulImageGenerationItems(imageGenerationResult);
  if (list.length > 0) return '';
  const target = imageGenerationResult.items.find((item3) => item3?.error)?.error;
  return String(target || '').trim();
}
export function getSuccessfulImageGenerationItems(source) {
  const next =
    source?.outputType === 'image' && Array.isArray(source.items)
      ? source
      : normalizeImageGenerationResult(source);
  return next.items.filter((enabled2) => enabled2 && !enabled2.error);
}
export function buildImageGenerationResultPatch(
  current,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const entry =
    current?.outputType === 'image' && Array.isArray(current.items)
      ? current
      : normalizeImageGenerationResult(current);
  return buildGenerationCollectionResultPatch(entry, {
    collectionField: 'images',
    mainIndexField: 'mainImageIndex',
    expandedField: 'isImagesExpanded',
    startedAt: startedAt,
    selectMainIndex: (list2) => {
      const count = list2.findIndex((enabled3) => enabled3 && !enabled3.error);
      return count >= 0 ? count : 0;
    },
    buildFirstItemPatch: (imageUrl) => ({
      imageUrl: imageUrl.imageUrl,
      sourceUrl: imageUrl.sourceUrl,
      thumbUrl: imageUrl.thumbUrl,
      sourceId: imageUrl.sourceId,
      thumbId: imageUrl.thumbId,
      ...buildImageNodeStorageFields(imageUrl),
    }),
    duration: duration,
    extraPatch: { rhStatusMessage: null, rhStatusCode: null },
  });
}
export function buildImageGenerationFailurePatch({
  error: error = '',
  startedAt: startedAt = 0,
  duration: duration = null,
  clearMediaFields: clearMediaFields = true,
} = {}) {
  const error2 = firstString(error, t('aigenImage.result.generationFailed')),
    imageGenerationResultPatch = buildImageGenerationResultPatch(
      { error: error2, thumbUrl: '', imageUrl: '' },
      { startedAt: startedAt, duration: duration },
    );
  return clearMediaFields ? imageGenerationResultPatch : removeMediaFieldPatch(imageGenerationResultPatch);
}
