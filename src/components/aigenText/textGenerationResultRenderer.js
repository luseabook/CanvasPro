import {
  buildGenerationSingleResultPatch,
  firstNonEmptyString,
  getFirstGenerationResultError,
  normalizeGenerationResultItems,
} from '../../core/generationResultRenderer.js';
import { t } from '../../i18n/index.js';
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
      metadata: metadata.metadata && typeof metadata.metadata === 'object' ? { ...metadata.metadata } : {},
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
    .filter((item2, target, source) => item2 || source[target - 1] !== '')
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
    items: items.map((item3) => normalizeTextGenerationResultItem(item3)),
  };
}
export function getTextGenerationResultError(next) {
  return getFirstGenerationResultError(
    next?.outputType === 'text' && Array.isArray(next.items) ? next.items : next,
    { collectionField: 'texts', singleItemFields: ['outputText', 'text', 'output', 'content', 'message'] },
  );
}
export function buildTextGenerationResultPatch(
  current,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const entry =
      current?.outputType === 'text' && Array.isArray(current.items)
        ? current
        : normalizeTextGenerationResult(current),
    record = entry.items.length > 0 ? entry : { outputType: 'text', items: [{ outputText: '' }] };
  return buildGenerationSingleResultPatch(record, {
    startedAt: startedAt,
    duration: duration,
    buildItemPatch: (payload) => {
      const outputText = firstNonEmptyString(payload.outputText);
      return outputText ? { outputText: outputText } : {};
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
      buildItemPatch: (handle) => {
        const outputText3 = firstNonEmptyString(handle.outputText);
        return outputText3 ? { outputText: outputText3 } : {};
      },
    },
  );
}
