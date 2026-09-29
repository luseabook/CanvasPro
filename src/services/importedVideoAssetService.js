import { subscribeAssetUpdates } from './assetUpdateService.js';
function normalizeText(_0x2ce095) {
  return String(_0x2ce095 ?? '')['trim']();
}
function resolveVideoPlaybackRef(_0x4851af = {}) {
  const _0x50d1e0 = normalizeText(_0x4851af?.['videoProxyStatus'])['toLowerCase'](),
    _0x499121 = normalizeText(_0x4851af?.['displayLocalPath'] || _0x4851af?.['displayUrl']);
  if (_0x499121) return _0x499121;
  if (_0x50d1e0 === 'not_required')
    return normalizeText(
      _0x4851af?.['displayLocalPath'] ||
        _0x4851af?.['displayUrl'] ||
        _0x4851af?.['localPath'] ||
        _0x4851af?.['originalLocalPath'] ||
        _0x4851af?.['url'] ||
        _0x4851af?.['originalUrl'],
    );
  return '';
}
function isFailedAsset(_0x30618f = {}) {
  return [_0x30618f?.['status'], _0x30618f?.['derivativeStatus'], _0x30618f?.['mediaTaskStatus']]['some'](
    (_0x18e53f) => ['failed', 'cancelled']['includes'](normalizeText(_0x18e53f)['toLowerCase']()),
  );
}
function isReadyAsset(_0x2b0872 = {}) {
  const _0x5985e0 = normalizeText(_0x2b0872?.['derivativeStatus'] || _0x2b0872?.['status'])['toLowerCase']();
  return _0x5985e0 === 'ready' && Boolean(resolveVideoPlaybackRef(_0x2b0872));
}
function needsCanonicalVideoPreparation(_0xb94a03 = {}) {
  return (
    Boolean(normalizeText(_0xb94a03?.['assetId'])) &&
    [_0xb94a03?.['videoProxyStatus'], _0xb94a03?.['status'], _0xb94a03?.['derivativeStatus']]['some'](
      (_0x5726b8) => ['waiting', 'processing']['includes'](normalizeText(_0x5726b8)['toLowerCase']()),
    )
  );
}
function createPreparationError(_0x19998f = {}) {
  return new Error(normalizeText(_0x19998f?.['mediaTaskError']) || '视频转码失败，请更换视频后重试');
}
export async function prepareImportedVideoAsset(
  _0x1b2b6c = {},
  {
    subscribeToAssetUpdates: subscribeToAssetUpdates = subscribeAssetUpdates,
    timeoutMs: timeoutMs = 0x1d4c0,
  } = {},
) {
  const _0x22c234 = _0x1b2b6c && typeof _0x1b2b6c === 'object' ? { ..._0x1b2b6c } : {};
  if (isFailedAsset(_0x22c234)) throw createPreparationError(_0x22c234);
  if (isReadyAsset(_0x22c234) || !needsCanonicalVideoPreparation(_0x22c234)) return _0x22c234;
  const _0x56cbe2 = normalizeText(_0x22c234['assetId']);
  return new Promise((_0x46d974, _0x156342) => {
    let _0x7a00de = ![],
      _0x55cd0b = null,
      _0x5dacb3 = null;
    const _0x2241dd = () => {
        if (_0x7a00de) return;
        ((_0x7a00de = !![]), globalThis['clearTimeout'](_0x5dacb3));
        if (typeof _0x55cd0b === 'function') _0x55cd0b();
      },
      _0xa5ae7b = (_0x1a5337, _0xe6daf5) => {
        (_0x2241dd(), _0x1a5337(_0xe6daf5));
      };
    _0x5dacb3 = globalThis['setTimeout'](
      () => {
        _0xa5ae7b(_0x156342, new Error('视频仍在转码，请稍后重试'));
      },
      Math['max'](0x1, Number(timeoutMs) || 0x1d4c0),
    );
    try {
      ((_0x55cd0b = subscribeToAssetUpdates((_0x3e4452 = {}) => {
        if (normalizeText(_0x3e4452?.['assetId']) !== _0x56cbe2) return;
        const _0x47f4eb = { ..._0x22c234, ..._0x3e4452 };
        if (isFailedAsset(_0x47f4eb)) {
          _0xa5ae7b(_0x156342, createPreparationError(_0x47f4eb));
          return;
        }
        if (isReadyAsset(_0x47f4eb)) _0xa5ae7b(_0x46d974, _0x47f4eb);
      })),
        typeof _0x55cd0b !== 'function' && _0xa5ae7b(_0x156342, new Error('当前环境无法监听视频转码结果')));
    } catch (_0x5142d8) {
      _0xa5ae7b(_0x156342, _0x5142d8);
    }
  });
}
export const importedVideoAssetInternals = Object['freeze']({
  isReadyAsset: isReadyAsset,
  needsCanonicalVideoPreparation: needsCanonicalVideoPreparation,
  resolveVideoPlaybackRef: resolveVideoPlaybackRef,
});
