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
function audioGenerationResultText(_0x47d628, _0x20e41a = {}) {
  return t('audioGenerationResult.' + _0x47d628, _0x20e41a);
}
function asObject(_0x4a28e2) {
  return _0x4a28e2 && typeof _0x4a28e2 === 'object' && !Array.isArray(_0x4a28e2) ? _0x4a28e2 : null;
}
function normalizeAudioGenerationResultItem(_0x227570) {
  const _0x3037c0 = asObject(_0x227570);
  if (!_0x3037c0) throw new Error('[audioGenerationResult] item must be an object');
  const _0x5047c1 = {
      ..._0x3037c0,
      outputType: 'audio',
      audioUrl: firstNonEmptyString(_0x3037c0.audioUrl, _0x3037c0.url, _0x3037c0.src, _0x3037c0.resultUrl),
      localPath: firstNonEmptyString(_0x3037c0.localPath, pickResultLocalPath(_0x3037c0)),
      metadata: _0x3037c0.metadata && typeof _0x3037c0.metadata === 'object' ? { ..._0x3037c0.metadata } : {},
    },
    _0x520123 = pickAudioDurationSec(
      _0x3037c0.audioDuration,
      _0x3037c0.duration,
      _0x3037c0.metadata?.audioDuration,
      _0x3037c0.metadata?.duration,
    );
  if (_0x520123 > 0) _0x5047c1.audioDuration = _0x520123;
  const _0x4f4fb2 = firstNonEmptyString(_0x3037c0.error);
  if (_0x4f4fb2) _0x5047c1.error = _0x4f4fb2;
  return _0x5047c1;
}
export function normalizeAudioGenerationResult(_0x506a86) {
  const _0x511e5e = normalizeGenerationResultItems(_0x506a86, {
    collectionField: 'audios',
    singleItemFields: ['audioUrl', 'url', 'src', 'resultUrl', 'localPath'],
  });
  if (_0x511e5e.length === 0) return { outputType: 'audio', items: [] };
  return {
    outputType: 'audio',
    items: _0x511e5e.map((_0x1cca3f) => normalizeAudioGenerationResultItem(_0x1cca3f)),
  };
}
export function getAudioGenerationResultError(_0x3080a6) {
  return getFirstGenerationResultError(
    _0x3080a6?.outputType === 'audio' && Array.isArray(_0x3080a6.items) ? _0x3080a6.items : _0x3080a6,
    { collectionField: 'audios', singleItemFields: ['audioUrl', 'url', 'src', 'resultUrl', 'localPath'] },
  );
}
export function getSuccessfulAudioGenerationItems(_0x2cd987) {
  const _0x1f1371 =
    _0x2cd987?.outputType === 'audio' && Array.isArray(_0x2cd987.items)
      ? _0x2cd987
      : normalizeAudioGenerationResult(_0x2cd987);
  return _0x1f1371.items.filter((_0x5143ca) => _0x5143ca && !_0x5143ca.error);
}
function buildAudioItemPatch(_0x28cb91) {
  const _0x1f80d0 = { audioUrl: _0x28cb91.audioUrl, src: _0x28cb91.src, localPath: _0x28cb91.localPath };
  for (const _0x57d773 of ['waveformLocalPath', 'assetId', 'derivativeStatus', 'fileName', 'audioDuration']) {
    if (_0x28cb91[_0x57d773] !== undefined) _0x1f80d0[_0x57d773] = _0x28cb91[_0x57d773];
  }
  return _0x1f80d0;
}
async function resolvePersistedAudioItem(_0x28f32f, _0x3874bc) {
  const _0x5858f4 = firstNonEmptyString(_0x28f32f?.audioUrl);
  let _0x329076 = firstNonEmptyString(_0x28f32f?.localPath),
    _0x54c7be = null;
  if (!_0x329076 && _0x5858f4) {
    if (typeof _0x3874bc !== 'function') throw new Error(audioGenerationResultText('localSaveFailed'));
    ((_0x54c7be = await _0x3874bc(_0x5858f4)), (_0x329076 = normalizeLocalPath(_0x54c7be?.localPath || '')));
  }
  const _0xcf5c62 = buildCanvasLocalAudioFields({
    ..._0x28f32f,
    ...(_0x54c7be && typeof _0x54c7be === 'object' ? _0x54c7be : {}),
    localPath: _0x329076,
    audioUrl: _0x5858f4,
  });
  if (!_0xcf5c62.audioUrl || !_0xcf5c62.localPath)
    throw new Error(audioGenerationResultText('localSaveFailed'));
  return {
    ..._0x28f32f,
    ...(_0x54c7be && typeof _0x54c7be === 'object' ? _0x54c7be : {}),
    ..._0xcf5c62,
    audioDuration:
      pickAudioDurationSec(
        _0x28f32f?.audioDuration,
        _0x28f32f?.duration,
        _0x54c7be?.audioDuration,
        _0x54c7be?.duration,
      ) || undefined,
  };
}
function resolveLocalAudioItem(_0x562dce) {
  if (firstNonEmptyString(_0x562dce?.error)) return _0x562dce;
  const _0x3fcbb2 = buildCanvasLocalAudioFields(_0x562dce);
  if (!_0x3fcbb2.audioUrl || !_0x3fcbb2.localPath)
    throw new Error(audioGenerationResultText('missingLocalAudioPath'));
  return { ..._0x562dce, ..._0x3fcbb2 };
}
function buildAudioPatchFromItem(_0x5bee96, { startedAt: startedAt = 0, duration: duration = null } = {}) {
  return buildGenerationSingleResultPatch(
    { outputType: 'audio', items: [_0x5bee96] },
    {
      startedAt: startedAt,
      duration: duration,
      buildItemPatch: buildAudioItemPatch,
      extraPatch: { rhStatusMessage: null, rhStatusCode: null },
    },
  );
}
export function buildLocalAudioGenerationResultPatch(
  _0x38f58d,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const _0x4ea528 =
    _0x38f58d?.outputType === 'audio' && Array.isArray(_0x38f58d.items)
      ? _0x38f58d
      : normalizeAudioGenerationResult(_0x38f58d);
  if (_0x4ea528.items.length === 0) return null;
  return buildAudioPatchFromItem(resolveLocalAudioItem(_0x4ea528.items[0]), {
    startedAt: startedAt,
    duration: duration,
  });
}
export async function buildAudioGenerationResultPatch(
  _0x1ccdb6,
  { startedAt: startedAt = 0, duration: duration = null, persistAudioOutput: _0x3b178b } = {},
) {
  const _0x1eb60a =
    _0x1ccdb6?.outputType === 'audio' && Array.isArray(_0x1ccdb6.items)
      ? _0x1ccdb6
      : normalizeAudioGenerationResult(_0x1ccdb6);
  if (_0x1eb60a.items.length === 0) return null;
  const _0x12df18 = _0x1eb60a.items[0],
    _0x243885 = firstNonEmptyString(_0x12df18?.error)
      ? _0x12df18
      : await resolvePersistedAudioItem(_0x12df18, _0x3b178b);
  return buildAudioPatchFromItem(_0x243885, { startedAt: startedAt, duration: duration });
}
