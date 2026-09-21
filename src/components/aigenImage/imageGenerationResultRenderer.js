import {
  buildGenerationCollectionResultPatch,
  firstNonEmptyString,
  normalizeGenerationResultItems,
} from '../../core/generationResultRenderer.js';
import { buildImageNodeStorageFields } from '../../services/imageDerivativeService.js';
import { t } from '../../i18n/index.js';
function asObject(_0x447cc) {
  return _0x447cc && typeof _0x447cc === 'object' && !Array.isArray(_0x447cc) ? _0x447cc : null;
}
function firstString(..._0x452d6d) {
  return firstNonEmptyString(..._0x452d6d);
}
function normalizeLegacyResultItems(_0x5d198b) {
  return normalizeGenerationResultItems(_0x5d198b, {
    collectionField: 'images',
    singleItemFields: ['sourceUrl', 'imageUrl', 'thumbUrl', 'localPath'],
  });
}
function normalizeImageResultItem(_0x1f4eda) {
  const _0x1e42bf = asObject(_0x1f4eda);
  if (!_0x1e42bf) throw new Error('[imageGenerationResult] item must be an object');
  const _0x58c9c3 = firstString(_0x1e42bf.error),
    _0x200ef2 = firstString(_0x1e42bf.url, _0x1e42bf.imageUrl, _0x1e42bf.sourceUrl, _0x1e42bf.thumbUrl),
    _0xeba0d0 = {
      ..._0x1e42bf,
      outputType: 'image',
      url: _0x200ef2,
      sourceUrl: firstString(_0x1e42bf.sourceUrl, _0x1e42bf.url, _0x1e42bf.imageUrl),
      imageUrl: firstString(_0x1e42bf.imageUrl, _0x1e42bf.url, _0x1e42bf.sourceUrl),
      thumbUrl: firstString(_0x1e42bf.thumbUrl, _0x1e42bf.imageUrl, _0x1e42bf.url, _0x1e42bf.sourceUrl),
      localPath: firstString(_0x1e42bf.localPath),
      metadata: _0x1e42bf.metadata && typeof _0x1e42bf.metadata === 'object' ? { ..._0x1e42bf.metadata } : {},
      ...buildImageNodeStorageFields(_0x1e42bf),
    };
  if (_0x58c9c3) _0xeba0d0.error = _0x58c9c3;
  return _0xeba0d0;
}
function removeMediaFieldPatch(_0xa0f5e) {
  if (!_0xa0f5e || typeof _0xa0f5e !== 'object') return _0xa0f5e;
  for (const _0x23ac03 of [
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
    delete _0xa0f5e[_0x23ac03];
  }
  return _0xa0f5e;
}
export function normalizeImageGenerationResult(_0x3a4012) {
  const _0x508c20 = normalizeLegacyResultItems(_0x3a4012);
  if (_0x508c20.length === 0) return { outputType: 'image', items: [] };
  return { outputType: 'image', items: _0x508c20.map((_0x4f4892) => normalizeImageResultItem(_0x4f4892)) };
}
export function getImageGenerationResultError(_0x162828) {
  const _0x893564 = normalizeImageGenerationResult(_0x162828),
    _0x2f1881 = getSuccessfulImageGenerationItems(_0x893564);
  if (_0x2f1881.length > 0) return '';
  const _0x38fe92 = _0x893564.items.find((_0x44a81b) => _0x44a81b?.error)?.error;
  return String(_0x38fe92 || '').trim();
}
export function getSuccessfulImageGenerationItems(_0x581f67) {
  const _0xf2d460 =
    _0x581f67?.outputType === 'image' && Array.isArray(_0x581f67.items)
      ? _0x581f67
      : normalizeImageGenerationResult(_0x581f67);
  return _0xf2d460.items.filter((_0x2ece48) => _0x2ece48 && !_0x2ece48.error);
}
export function buildImageGenerationResultPatch(
  _0x2cfe2c,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const _0x3ece3f =
    _0x2cfe2c?.outputType === 'image' && Array.isArray(_0x2cfe2c.items)
      ? _0x2cfe2c
      : normalizeImageGenerationResult(_0x2cfe2c);
  return buildGenerationCollectionResultPatch(_0x3ece3f, {
    collectionField: 'images',
    mainIndexField: 'mainImageIndex',
    expandedField: 'isImagesExpanded',
    startedAt: startedAt,
    selectMainIndex: (_0x2a3173) => {
      const _0x395b5d = _0x2a3173.findIndex((_0x2c45fc) => _0x2c45fc && !_0x2c45fc.error);
      return _0x395b5d >= 0 ? _0x395b5d : 0;
    },
    buildFirstItemPatch: (_0x373e7c) => ({
      imageUrl: _0x373e7c.imageUrl,
      sourceUrl: _0x373e7c.sourceUrl,
      thumbUrl: _0x373e7c.thumbUrl,
      sourceId: _0x373e7c.sourceId,
      thumbId: _0x373e7c.thumbId,
      ...buildImageNodeStorageFields(_0x373e7c),
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
  const _0x349abf = firstString(error, t('aigenImage.result.generationFailed')),
    _0x448806 = buildImageGenerationResultPatch(
      { error: _0x349abf, thumbUrl: '', imageUrl: '' },
      { startedAt: startedAt, duration: duration },
    );
  return clearMediaFields ? _0x448806 : removeMediaFieldPatch(_0x448806);
}
