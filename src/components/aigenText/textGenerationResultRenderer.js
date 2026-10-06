import {
  buildGenerationSingleResultPatch,
  firstNonEmptyString,
  getFirstGenerationResultError,
  normalizeGenerationResultItems,
} from '../../core/generationResultRenderer.js';
import { t } from '../../i18n/index.js';
import { normalizeTextResultSources, normalizeTextToolUsage } from '../../utils/textResultMetadata.js';
import { normalizeTextResultImages } from '../../utils/textResultImages.js';
function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}
function normalizeTextGenerationResultItem(item) {
  const metadata = asObject(item);
  if (!metadata) throw new Error('[textGenerationResult] item must be an object');
  const key = {
      ...metadata,
      outputType: 'text',
      outputText: firstNonEmptyString(
        metadata.outputText,
        metadata.text,
        metadata.output,
        metadata.content,
        metadata.message,
      ),
      metadata:
        metadata.metadata && typeof metadata.metadata === 'object'
          ? { ...metadata.metadata }
          : {},
    },
    nonEmptyString = firstNonEmptyString(metadata.error);
  if (nonEmptyString) key.error = nonEmptyString;
  return key;
}
function getErrorMessage(error2, index = '') {
  if (typeof error2 === 'string') return firstNonEmptyString(error2, index);
  if (typeof error2?.getUserMessage === 'function')
    return firstNonEmptyString(error2.getUserMessage(false), error2?.message, index);
  return firstNonEmptyString(error2?.message, error2?.error, error2, index);
}
export function isTextGenerationTimeoutError(result) {
  const data = String(result?.type || result?.code || '')
    .trim()
    .toUpperCase();
  if (data === 'TIMEOUT' || data === 'TASK_TIMEOUT') return true;
  const errorMessage = getErrorMessage(result);
  return /(?:timeout|timed\s*out|read\s+timed\s*out|aborterror|请求超时|超时)/i.test(errorMessage);
}
export function buildTextGenerationTimeoutOutput(options) {
  const detail = getErrorMessage(options);
  return [
    '**' + t('aigenText.result.timeoutTitle') + '**',
    '',
    t('aigenText.result.timeoutReason'),
    t('aigenText.result.timeoutRetry'),
    detail ? '' : '',
    detail ? t('aigenText.result.errorDetail', { detail: detail }) : '',
  ]
    .filter((target, source, next) => target || next[source - 1] !== '')
    .join('\n')
    .trim();
}
export function normalizeTextGenerationResult(text) {
  const items = normalizeGenerationResultItems(text, {
    collectionField: 'texts',
    singleItemFields: ['outputText', 'text', 'output', 'content', 'message'],
  });
  if (items.length === 0 && typeof text === 'string')
    return { outputType: 'text', items: [normalizeTextGenerationResultItem({ text: text })] };
  if (items.length === 0) return { outputType: 'text', items: [] };
  return {
    outputType: 'text',
    items: items.map((current) => normalizeTextGenerationResultItem(current)),
  };
}
export function getTextGenerationResultError(entry) {
  return getFirstGenerationResultError(
    entry?.outputType === 'text' && Array.isArray(entry.items)
      ? entry.items
      : entry,
    { collectionField: 'texts', singleItemFields: ['outputText', 'text', 'output', 'content', 'message'] },
  );
}
export function buildTextGenerationResultPatch(
  record,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const payload =
      record?.outputType === 'text' && Array.isArray(record.items)
        ? record
        : normalizeTextGenerationResult(record),
    handle =
      payload.items.length > 0 ? payload : { outputType: 'text', items: [{ outputText: '' }] };
  return buildGenerationSingleResultPatch(handle, {
    startedAt: startedAt,
    duration: duration,
    buildItemPatch: (outputImageSearchRequested) => {
      const outputText = firstNonEmptyString(outputImageSearchRequested.outputText);
      return outputText
        ? {
            outputText: outputText,
            outputSources: normalizeTextResultSources(outputImageSearchRequested.sources),
            outputImages: normalizeTextResultImages(outputImageSearchRequested.images),
            outputImageSearchRequested: outputImageSearchRequested.imageSearchRequested === true,
            outputToolUsage: normalizeTextToolUsage(outputImageSearchRequested.toolUsage),
            outputWebSearchRequested: outputImageSearchRequested.webSearchRequested === true,
          }
        : {};
    },
  });
}
export function buildTextGenerationFailurePatch({
  error: error = '',
  startedAt: startedAt = 0,
  duration: duration = null,
} = {}) {
  const error3 = getErrorMessage(error, t('aigenText.task.generationFailed')),
    outputText2 = isTextGenerationTimeoutError(error) ? buildTextGenerationTimeoutOutput(error) : '';
  return buildGenerationSingleResultPatch(
    { outputType: 'text', items: [{ error: error3, ...(outputText2 ? { outputText: outputText2 } : {}) }] },
    {
      startedAt: startedAt,
      duration: duration,
      buildItemPatch: (state) => {
        const outputText3 = firstNonEmptyString(state.outputText);
        return outputText3
          ? {
              outputText: outputText3,
              outputSources: [],
              outputImages: [],
              outputImageSearchRequested: false,
              outputToolUsage: null,
              outputWebSearchRequested: false,
            }
          : {};
      },
    },
  );
}
