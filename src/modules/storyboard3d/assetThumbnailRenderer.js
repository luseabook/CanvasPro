import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
import { resolveSceneAsset } from '../panoramaSceneNode/sceneAssetCatalog.js';
import { createSceneAssetVisual } from '../panoramaSceneNode/scene3dProceduralAssetVisual.js';
const DEFAULT_CACHE_LIMIT = 512,
  DEFAULT_WIDTH = 240,
  DEFAULT_HEIGHT = 150,
  PREVIEW_COLORS = Object['freeze']({
    blue: 0x6ea8ff,
    red: 0xef7777,
    green: 0x6fcf97,
    yellow: 0xf2c96d,
    purple: 0xb493f5,
    white: 0xe8edf5,
  });
function normalizeText(value) {
  return String(value || '')['trim']();
}
function createCacheKey(response) {
  const text = normalizeText(response?.['id']),
    text2 = normalizeText(response?.['source']?.['url'] || response?.['url']);
  return text ? text + '::' + text2 : '';
}
export function createStoryboard3DAssetThumbnailCache({ limit: limit = DEFAULT_CACHE_LIMIT } = {}) {
  const map = new Map(),
    item = Math['max'](1, Math['floor'](Number(limit) || DEFAULT_CACHE_LIMIT));
  return {
    get(key) {
      const cacheKey = createCacheKey(key);
      if (!cacheKey || !map['has'](cacheKey)) return '';
      const index = map['get'](cacheKey);
      return (map['delete'](cacheKey), map['set'](cacheKey, index), index);
    },
    set(result, data) {
      const cacheKey2 = createCacheKey(result),
        text3 = normalizeText(data);
      if (!cacheKey2 || !text3) return '';
      (map['delete'](cacheKey2), map['set'](cacheKey2, text3));
      while (map['size'] > item) map['delete'](map['keys']()['next']()['value']);
      return text3;
    },
    clear() {
      map['clear']();
    },
    get size() {
      return map['size'];
    },
  };
}
export const storyboard3DAssetThumbnailCache = createStoryboard3DAssetThumbnailCache();
export function createStoryboard3DBuiltinAssetThumbnailModel(options, { clayColor: clayColor = '' } = {}) {
  const sceneAsset = resolveSceneAsset(options, '');
  if (!sceneAsset || sceneAsset['id'] !== options) return null;
  const text4 = normalizeText(clayColor),
    handler = (target) =>
      new threeRuntime['Color'](text4 || PREVIEW_COLORS[target] || PREVIEW_COLORS['blue']),
    sceneAssetVisual = createSceneAssetVisual(sceneAsset, handler(sceneAsset['colorKey']), handler);
  if (sceneAssetVisual['selectionRing']) sceneAssetVisual['selectionRing']['visible'] = ![];
  return sceneAssetVisual['group'];
}
export function disposeStoryboard3DAssetThumbnailModel(source) {
  source?.['traverse']?.((next) => {
    next['geometry']?.['dispose']?.();
    const list = Array['isArray'](next['material']) ? next['material'] : [next['material']];
    list['filter'](Boolean)['forEach']((current) => current['dispose']?.());
  });
}
function createPreviewScene(entry) {
  const record = new threeRuntime['Scene']();
  ((record['background'] = new threeRuntime['Color'](0x171920)),
    record['add'](new threeRuntime['HemisphereLight'](0xf2f6ff, 0x30343d, 1.7)));
  const payload = new threeRuntime['DirectionalLight'](0xffffff, 2.2);
  payload['position']['set'](4, 7, 5);
  const handle = new threeRuntime['DirectionalLight'](0x8bb8ff, 1.1);
  return (handle['position']['set'](-5, 3, -4), record['add'](payload, handle, entry), record);
}
export function createStoryboard3DAssetThumbnailFraming(
  state,
  { aspect: aspect = DEFAULT_WIDTH / DEFAULT_HEIGHT } = {},
) {
  state?.['updateMatrixWorld']?.(!![]);
  const bounds = new threeRuntime['Box3']()['setFromObject'](state, !![]);
  if (bounds['isEmpty']()) throw new Error('模型没有可渲染的几何体。');
  const center = bounds['getCenter'](new threeRuntime['Vector3']()),
    config = bounds['getBoundingSphere'](new threeRuntime['Sphere']()),
    radius = Math['max'](0.08, Number(config['radius']) || 0.08),
    camera = new threeRuntime['PerspectiveCamera'](
      32,
      Math['max'](0.1, Number(aspect) || 1),
      0.01,
      radius * 30,
    ),
    scope = new threeRuntime['Vector3'](1.35, 0.85, 1.35)['normalize'](),
    input = threeRuntime['MathUtils']['degToRad'](camera['fov'] * 0.5),
    distance = Math['max'](radius * 2.4, (radius / Math['sin'](input)) * 1.12);
  return (
    camera['position']['copy'](center)['addScaledVector'](scope, distance),
    (camera['near'] = Math['max'](0.01, distance - radius * 2.2)),
    (camera['far'] = distance + radius * 4),
    camera['lookAt'](center),
    camera['updateProjectionMatrix'](),
    { bounds: bounds, camera: camera, center: center, distance: distance, radius: radius }
  );
}
export function createStoryboard3DAssetThumbnailRenderer({
  documentObject: documentObject = globalThis['document'],
  rendererFactory: rendererFactory = (output) => new threeRuntime['WebGLRenderer'](output),
  width: width = DEFAULT_WIDTH,
  height: height = DEFAULT_HEIGHT,
} = {}) {
  const aspect2 = Math['max'](96, Math['floor'](Number(width) || DEFAULT_WIDTH)),
    value2 = Math['max'](72, Math['floor'](Number(height) || DEFAULT_HEIGHT));
  let rendererFactory2 = null;
  function run() {
    if (rendererFactory2) return rendererFactory2;
    const canvas = documentObject?.['createElement']?.('canvas');
    if (!canvas) throw new Error('当前环境无法创建模型缩略图画布。');
    ((rendererFactory2 = rendererFactory({
      canvas: canvas,
      antialias: !![],
      alpha: ![],
      preserveDrawingBuffer: !![],
      powerPreference: 'low-power',
    })),
      rendererFactory2['setPixelRatio']?.(1),
      rendererFactory2['setSize']?.(aspect2, value2, ![]));
    if ('outputColorSpace' in rendererFactory2)
      rendererFactory2['outputColorSpace'] = threeRuntime['SRGBColorSpace'];
    return rendererFactory2;
  }
  return {
    render(enabled) {
      if (!enabled?.['clone']) throw new Error('模型场景不可用于生成缩略图。');
      const value3 = enabled['clone'](!![]),
        el = createPreviewScene(value3),
        { camera: camera2 } = createStoryboard3DAssetThumbnailFraming(value3, {
          aspect: aspect2 / value2,
        }),
        value4 = run();
      value4['render'](el, camera2);
      const text5 = normalizeText(value4['domElement']?.['toDataURL']?.('image/jpeg', 0.82));
      if (!text5) throw new Error('模型缩略图渲染失败。');
      return (el['remove'](value3), text5);
    },
    dispose() {
      (rendererFactory2?.['dispose']?.(),
        rendererFactory2?.['forceContextLoss']?.(),
        (rendererFactory2 = null));
    },
  };
}
