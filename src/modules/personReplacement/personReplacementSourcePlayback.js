const PERSON_REPLACEMENT_VIDEO_PROXY_VERSION = 'v2-1280',
  CANONICAL_ASSET_ID_RE = /^[a-f0-9]{64}$/iu,
  CANONICAL_ORIGINAL_REF_RE = /^\/?data\/assets\/original\/([a-f0-9]{64})\.[^/?#]+(?:[?#].*)?$/iu;
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function normalizeAssetId(item) {
  const text = normalizeText(item);
  return CANONICAL_ASSET_ID_RE['test'](text) ? text['toLowerCase']() : '';
}
function normalizeLocalRef(key) {
  return normalizeText(key)['replace'](/\\/gu, '/')['replace'](/^\/+/u, '');
}
export function getPersonReplacementSourceAssetId(options = {}) {
  const assetId = normalizeAssetId(options?.['assetId']);
  if (assetId) return assetId;
  return (
    normalizeText(options?.['videoRef'])['match'](CANONICAL_ORIGINAL_REF_RE)?.[1]?.['toLowerCase']() || ''
  );
}
export function buildPersonReplacementSourcePlaybackProxyRef(options2 = {}) {
  const personReplacementSourceAssetId = getPersonReplacementSourceAssetId(options2);
  return personReplacementSourceAssetId
    ? 'data/assets/derived/video/' +
        personReplacementSourceAssetId +
        '.proxy-' +
        PERSON_REPLACEMENT_VIDEO_PROXY_VERSION +
        '.mp4'
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
  project,
  { checkMediaExists: checkMediaExists } = {},
) {
  if (
    !project ||
    typeof project !== 'object' ||
    !Array['isArray'](project['sources']) ||
    typeof checkMediaExists !== 'function'
  )
    return { project: project, changed: ![] };
  const map = new Map(),
    handler = (index) => {
      return (
        !map['has'](index) &&
          map['set'](
            index,
            Promise['resolve']()
              ['then'](() => checkMediaExists(index))
              ['then']((result) => result === !![])
              ['catch'](() => ![]),
          ),
        map['get'](index)
      );
    };
  let data = ![];
  const sources = await Promise['all'](
    project['sources']['map'](async (args) => {
      if (!args || typeof args !== 'object') return args;
      const playbackVideoRef = buildPersonReplacementSourcePlaybackProxyRef(args);
      if (!playbackVideoRef) return args;
      const text2 = normalizeText(args['playbackVideoRef']),
        enabled = text2 && normalizeLocalRef(text2) === playbackVideoRef,
        target = await handler(playbackVideoRef);
      if (target) {
        if (text2) return args;
        return (
          (data = !![]),
          { ...args, assetId: getPersonReplacementSourceAssetId(args), playbackVideoRef: playbackVideoRef }
        );
      }
      if (!enabled) return args;
      return ((data = !![]), { ...args, playbackVideoRef: '' });
    }),
  );
  return data
    ? { project: { ...project, sources: sources }, changed: !![] }
    : { project: project, changed: ![] };
}
