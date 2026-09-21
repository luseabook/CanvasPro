import {
  buildGenerationSingleResultPatch,
  firstNonEmptyString,
  getFirstGenerationResultError,
  normalizeGenerationResultItems,
} from '../../core/generationResultRenderer.js';
import { t } from '../../i18n/index.js';
function asObject(_0x3cbe38) {
  return _0x3cbe38 && typeof _0x3cbe38 === 'object' && !Array.isArray(_0x3cbe38) ? _0x3cbe38 : null;
}
function normalizeTextGenerationResultItem(_0x5f5ce6) {
  const _0x20d070 = asObject(_0x5f5ce6);
  if (!_0x20d070) throw new Error('[textGenerationResult] item must be an object');
  const _0x5c9664 = {
      ..._0x20d070,
      outputType: 'text',
      outputText: firstNonEmptyString(
        _0x20d070.outputText,
        _0x20d070.text,
        _0x20d070.output,
        _0x20d070.content,
        _0x20d070.message,
      ),
      metadata: _0x20d070.metadata && typeof _0x20d070.metadata === 'object' ? { ..._0x20d070.metadata } : {},
    },
    _0x1cdd00 = firstNonEmptyString(_0x20d070.error);
  if (_0x1cdd00) _0x5c9664.error = _0x1cdd00;
  return _0x5c9664;
}
function getErrorMessage(_0x49de98, _0x208930 = '') {
  if (typeof _0x49de98 === 'string') return firstNonEmptyString(_0x49de98, _0x208930);
  if (typeof _0x49de98?.getUserMessage === 'function')
    return firstNonEmptyString(_0x49de98.getUserMessage(false), _0x49de98?.message, _0x208930);
  return firstNonEmptyString(_0x49de98?.message, _0x49de98?.error, _0x49de98, _0x208930);
}
export function isTextGenerationTimeoutError(_0x2f0269) {
  const _0x4bac90 = String(_0x2f0269?.type || _0x2f0269?.code || '')
    .trim()
    .toUpperCase();
  if (_0x4bac90 === 'TIMEOUT' || _0x4bac90 === 'TASK_TIMEOUT') return true;
  const _0xf2d68b = getErrorMessage(_0x2f0269);
  return /(?:timeout|timed\s*out|read\s+timed\s*out|aborterror|请求超时|超时)/i.test(_0xf2d68b);
}
export function buildTextGenerationTimeoutOutput(_0xf80604) {
  const _0x5e138c = getErrorMessage(_0xf80604);
  return [
    '**' + t('aigenText.result.timeoutTitle') + '**',
    '',
    t('aigenText.result.timeoutReason'),
    t('aigenText.result.timeoutRetry'),
    _0x5e138c ? '' : '',
    _0x5e138c ? t('aigenText.result.errorDetail', { detail: _0x5e138c }) : '',
  ]
    .filter((_0x49211a, _0x137c57, _0x56fc7a) => _0x49211a || _0x56fc7a[_0x137c57 - 1] !== '')
    .join('\n')
    .trim();
}
export function normalizeTextGenerationResult(_0x352aee) {
  const _0x4f3a51 = normalizeGenerationResultItems(_0x352aee, {
    collectionField: 'texts',
    singleItemFields: ['outputText', 'text', 'output', 'content', 'message'],
  });
  if (_0x4f3a51.length === 0 && typeof _0x352aee === 'string')
    return { outputType: 'text', items: [normalizeTextGenerationResultItem({ text: _0x352aee })] };
  if (_0x4f3a51.length === 0) return { outputType: 'text', items: [] };
  return {
    outputType: 'text',
    items: _0x4f3a51.map((_0xab59e7) => normalizeTextGenerationResultItem(_0xab59e7)),
  };
}
export function getTextGenerationResultError(_0x5add22) {
  return getFirstGenerationResultError(
    _0x5add22?.outputType === 'text' && Array.isArray(_0x5add22.items) ? _0x5add22.items : _0x5add22,
    { collectionField: 'texts', singleItemFields: ['outputText', 'text', 'output', 'content', 'message'] },
  );
}
export function buildTextGenerationResultPatch(
  _0x1073eb,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const _0x3a4d69 =
      _0x1073eb?.outputType === 'text' && Array.isArray(_0x1073eb.items)
        ? _0x1073eb
        : normalizeTextGenerationResult(_0x1073eb),
    _0x56d28d = _0x3a4d69.items.length > 0 ? _0x3a4d69 : { outputType: 'text', items: [{ outputText: '' }] };
  return buildGenerationSingleResultPatch(_0x56d28d, {
    startedAt: startedAt,
    duration: duration,
    buildItemPatch: (_0x1ea795) => {
      const _0x5ee5c2 = firstNonEmptyString(_0x1ea795.outputText);
      return _0x5ee5c2 ? { outputText: _0x5ee5c2 } : {};
    },
  });
}
export function buildTextGenerationFailurePatch({
  error: error = '',
  startedAt: startedAt = 0,
  duration: duration = null,
} = {}) {
  const _0x2e1df0 = getErrorMessage(error, t('aigenText.task.generationFailed')),
    _0x6f5ce = isTextGenerationTimeoutError(error) ? buildTextGenerationTimeoutOutput(error) : '';
  return buildGenerationSingleResultPatch(
    { outputType: 'text', items: [{ error: _0x2e1df0, ...(_0x6f5ce ? { outputText: _0x6f5ce } : {}) }] },
    {
      startedAt: startedAt,
      duration: duration,
      buildItemPatch: (_0x473a6a) => {
        const _0x16ec24 = firstNonEmptyString(_0x473a6a.outputText);
        return _0x16ec24 ? { outputText: _0x16ec24 } : {};
      },
    },
  );
}
