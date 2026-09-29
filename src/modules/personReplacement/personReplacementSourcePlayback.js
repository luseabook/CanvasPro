const PERSON_REPLACEMENT_VIDEO_PROXY_VERSION = 'v2-1280',
  CANONICAL_ASSET_ID_RE = /^[a-f0-9]{64}$/iu,
  CANONICAL_ORIGINAL_REF_RE = /^\/?data\/assets\/original\/([a-f0-9]{64})\.[^/?#]+(?:[?#].*)?$/iu;
function normalizeText(_0x192d9e) {
  return String(_0x192d9e ?? '')['trim']();
}
function normalizeAssetId(_0x314e38) {
  const _0xd0a7e2 = normalizeText(_0x314e38);
  return CANONICAL_ASSET_ID_RE['test'](_0xd0a7e2) ? _0xd0a7e2['toLowerCase']() : '';
}
function normalizeLocalRef(_0x575aaa) {
  return normalizeText(_0x575aaa)['replace'](/\\/gu, '/')['replace'](/^\/+/u, '');
}
export function getPersonReplacementSourceAssetId(_0x15035c = {}) {
  const _0x23d17d = normalizeAssetId(_0x15035c?.['assetId']);
  if (_0x23d17d) return _0x23d17d;
  return (
    normalizeText(_0x15035c?.['videoRef'])['match'](CANONICAL_ORIGINAL_REF_RE)?.[0x1]?.['toLowerCase']() || ''
  );
}
export function buildPersonReplacementSourcePlaybackProxyRef(_0x4401e9 = {}) {
  const _0x2f1833 = getPersonReplacementSourceAssetId(_0x4401e9);
  return _0x2f1833
    ? 'data/assets/derived/video/' + _0x2f1833 + '.proxy-' + PERSON_REPLACEMENT_VIDEO_PROXY_VERSION + '.mp4'
    : '';
}
export function resolvePersonReplacementSourcePlaybackRef({
  runtimePreviewRef: runtimePreviewRef = '',
  source: source = null,
  sourceShot: sourceShot = null,
} = {}) {
  return normalizeText(
    runtimePreviewRef ||
      source?.['playbackVideoRef'] ||
      source?.['displayLocalPath'] ||
      source?.['videoRef'] ||
      sourceShot?.['sourceVideoRef'],
  );
}
export async function hydratePersonReplacementSourcePlaybackRefs(
  _0x3c114b,
  { checkMediaExists: _0x280fe4 } = {},
) {
  if (
    !_0x3c114b ||
    typeof _0x3c114b !== 'object' ||
    !Array['isArray'](_0x3c114b['sources']) ||
    typeof _0x280fe4 !== 'function'
  )
    return { project: _0x3c114b, changed: ![] };
  const _0x491036 = new Map(),
    _0x290ea1 = (_0x574351) => {
      return (
        !_0x491036['has'](_0x574351) &&
          _0x491036['set'](
            _0x574351,
            Promise['resolve']()
              ['then'](() => _0x280fe4(_0x574351))
              ['then']((_0x45a8bf) => _0x45a8bf === !![])
              ['catch'](() => ![]),
          ),
        _0x491036['get'](_0x574351)
      );
    };
  let _0xe5bd1c = ![];
  const _0x422274 = await Promise['all'](
    _0x3c114b['sources']['map'](async (_0x11c76e) => {
      if (!_0x11c76e || typeof _0x11c76e !== 'object') return _0x11c76e;
      const _0x2eb368 = buildPersonReplacementSourcePlaybackProxyRef(_0x11c76e);
      if (!_0x2eb368) return _0x11c76e;
      const _0x509dc2 = normalizeText(_0x11c76e['playbackVideoRef']),
        _0x2f19b4 = _0x509dc2 && normalizeLocalRef(_0x509dc2) === _0x2eb368,
        _0x2ae62d = await _0x290ea1(_0x2eb368);
      if (_0x2ae62d) {
        if (_0x509dc2) return _0x11c76e;
        return (
          (_0xe5bd1c = !![]),
          { ..._0x11c76e, assetId: getPersonReplacementSourceAssetId(_0x11c76e), playbackVideoRef: _0x2eb368 }
        );
      }
      if (!_0x2f19b4) return _0x11c76e;
      return ((_0xe5bd1c = !![]), { ..._0x11c76e, playbackVideoRef: '' });
    }),
  );
  return _0xe5bd1c
    ? { project: { ..._0x3c114b, sources: _0x422274 }, changed: !![] }
    : { project: _0x3c114b, changed: ![] };
}
