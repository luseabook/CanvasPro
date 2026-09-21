import {
  buildGenerationCollectionResultPatch,
  firstNonEmptyString,
  getFirstGenerationResultError,
  normalizeGenerationResultItems,
} from '../../core/generationResultRenderer.js';
import { localPathToUrl, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { t } from '../../i18n/index.js';
function videoGenerationResultText(_0x23356b, _0x182de6 = {}) {
  return t('videoGenerationResult.' + _0x23356b, _0x182de6);
}
function asObject(_0x5e7372) {
  return _0x5e7372 && typeof _0x5e7372 === 'object' && !Array.isArray(_0x5e7372) ? _0x5e7372 : null;
}
function normalizeVideoGenerationResultItem(_0x39ae4d) {
  const _0xd34aaf = asObject(_0x39ae4d);
  if (!_0xd34aaf) throw new Error('[videoGenerationResult] item must be an object');
  const _0x1b7136 = firstNonEmptyString(_0xd34aaf.localPath, pickResultLocalPath(_0xd34aaf)),
    _0x53e614 = firstNonEmptyString(
      _0xd34aaf.videoUrl,
      _0xd34aaf.url,
      _0xd34aaf.localUrl,
      localPathToUrl(_0x1b7136),
    ),
    _0x43a0f4 = {
      ..._0xd34aaf,
      outputType: 'video',
      videoUrl: _0x53e614,
      localPath: _0x1b7136,
      thumbUrl: firstNonEmptyString(_0xd34aaf.thumbUrl, _0xd34aaf.posterUrl),
      thumbId: firstNonEmptyString(_0xd34aaf.thumbId, _0xd34aaf.assetId),
      metadata: _0xd34aaf.metadata && typeof _0xd34aaf.metadata === 'object' ? { ..._0xd34aaf.metadata } : {},
    },
    _0x44b593 = firstNonEmptyString(_0xd34aaf.error);
  if (_0x44b593) _0x43a0f4.error = _0x44b593;
  return _0x43a0f4;
}
function removeMediaFieldPatch(_0x4f9d12) {
  if (!_0x4f9d12 || typeof _0x4f9d12 !== 'object') return _0x4f9d12;
  for (const _0x270c25 of ['videoUrl', 'localPath', 'thumbId', 'thumbUrl']) {
    delete _0x4f9d12[_0x270c25];
  }
  return _0x4f9d12;
}
export function normalizeVideoGenerationResult(_0x2cf4c3) {
  const _0x2557f9 = normalizeGenerationResultItems(_0x2cf4c3, {
    collectionField: 'videos',
    singleItemFields: ['videoUrl', 'url', 'localUrl', 'localPath', 'thumbUrl'],
  });
  if (_0x2557f9.length === 0) return { outputType: 'video', items: [] };
  return {
    outputType: 'video',
    items: _0x2557f9.map((_0xca2d9b) => normalizeVideoGenerationResultItem(_0xca2d9b)),
  };
}
export function getVideoGenerationResultError(_0x45aa84) {
  return getFirstGenerationResultError(
    _0x45aa84?.outputType === 'video' && Array.isArray(_0x45aa84.items) ? _0x45aa84.items : _0x45aa84,
    { collectionField: 'videos', singleItemFields: ['videoUrl', 'url', 'localUrl', 'localPath', 'thumbUrl'] },
  );
}
export function getSuccessfulVideoGenerationItems(_0x29dd88) {
  const _0x2b56ac =
    _0x29dd88?.outputType === 'video' && Array.isArray(_0x29dd88.items)
      ? _0x29dd88
      : normalizeVideoGenerationResult(_0x29dd88);
  return _0x2b56ac.items.filter((_0x435ad7) => _0x435ad7 && !_0x435ad7.error);
}
export function buildVideoGenerationResultPatch(
  _0x322d19,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const _0x1315b5 =
    _0x322d19?.outputType === 'video' && Array.isArray(_0x322d19.items)
      ? _0x322d19
      : normalizeVideoGenerationResult(_0x322d19);
  return buildGenerationCollectionResultPatch(_0x1315b5, {
    collectionField: 'videos',
    mainIndexField: 'mainVideoIndex',
    expandedField: 'isVideosExpanded',
    startedAt: startedAt,
    duration: duration,
    buildFirstItemPatch: (_0x488fd9) => ({
      videoUrl: _0x488fd9.videoUrl,
      localPath: _0x488fd9.localPath,
      displayLocalPath: _0x488fd9.displayLocalPath || '',
      posterLocalPath: _0x488fd9.posterLocalPath || '',
      videoProxyStatus: _0x488fd9.videoProxyStatus || '',
      videoCodec: _0x488fd9.videoCodec || '',
      thumbId: _0x488fd9.thumbId,
      thumbUrl: _0x488fd9.thumbUrl,
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
  const _0x3ab4d0 = firstNonEmptyString(error, videoGenerationResultText('failed')),
    _0x57e864 = buildGenerationCollectionResultPatch(
      { outputType: 'video', items: [{ error: _0x3ab4d0, thumbUrl: '', videoUrl: '', localPath: '' }] },
      {
        collectionField: 'videos',
        mainIndexField: 'mainVideoIndex',
        startedAt: startedAt,
        duration: duration,
        buildFirstItemPatch: () => ({ videoUrl: '', localPath: '', thumbId: '', thumbUrl: '' }),
      },
    );
  return clearMediaFields ? _0x57e864 : removeMediaFieldPatch(_0x57e864);
}
