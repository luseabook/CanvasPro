import {
  countStoryboard3DSceneTriangles,
  getStoryboard3DModelImportCapability,
  measureStoryboard3DImportedSceneBounds,
} from './gltfImportAdapter.js';
export const STORYBOARD_3D_ASSET_RECORD_VERSION = 1;
export const DEFAULT_STORYBOARD_3D_ASSET_DATABASE = 'ai-canvaspro';
export const DEFAULT_STORYBOARD_3D_ASSET_STORE = 'storyboard3d-assets';
function normalizeText(value) {
  return String(value || '')['trim']();
}
function normalizeBounds(item) {
  const x = [
    item?.['min']?.['x'],
    item?.['min']?.['y'],
    item?.['min']?.['z'],
    item?.['max']?.['x'],
    item?.['max']?.['y'],
    item?.['max']?.['z'],
  ]['map'](Number);
  if (!x['every'](Number['isFinite'])) return null;
  return {
    min: { x: x[0], y: x[1], z: x[2] },
    max: { x: x[3], y: x[4], z: x[5] },
  };
}
function toHex(args) {
  return [...args]['map']((key) => key['toString'](16)['padStart'](2, '0'))['join']('');
}
export async function createCanonicalStoryboard3DAssetId(
  index,
  { cryptoObject: cryptoObject = globalThis['crypto'] } = {},
) {
  if (typeof index?.['arrayBuffer'] !== 'function') throw new Error('Asset file is unreadable.');
  if (typeof cryptoObject?.['subtle']?.['digest'] !== 'function')
    throw new Error('SHA-256 support is unavailable.');
  const result = await cryptoObject['subtle']['digest']('SHA-256', await index['arrayBuffer']());
  return 'asset:sha256:' + toHex(new Uint8Array(result));
}
export function createStoryboard3DIndexedDbAssetReference({
  databaseName: databaseName = DEFAULT_STORYBOARD_3D_ASSET_DATABASE,
  storeName: storeName = DEFAULT_STORYBOARD_3D_ASSET_STORE,
  key: key2,
} = {}) {
  const key3 = normalizeText(key2);
  if (!key3) throw new Error('IndexedDB asset key is required.');
  return {
    kind: 'indexeddb',
    databaseName: normalizeText(databaseName) || DEFAULT_STORYBOARD_3D_ASSET_DATABASE,
    storeName: normalizeText(storeName) || DEFAULT_STORYBOARD_3D_ASSET_STORE,
    key: key3,
  };
}
export async function createStoryboard3DAssetRecord({
  file: file,
  format: format,
  parsed: parsed,
  normalization: normalization,
  canonicalAssetId: canonicalAssetId = '',
  indexedDbReference: indexedDbReference = null,
  limitations: limitations = null,
  createdAt: createdAt = Date['now'](),
} = {}) {
  const sourceFormat = normalizeText(format)['toLowerCase'](),
    storyboard3DModelImportCapability = getStoryboard3DModelImportCapability(sourceFormat);
  if (!storyboard3DModelImportCapability || storyboard3DModelImportCapability['parsing'] !== 'available')
    throw new Error('Unsupported parsed asset format: ' + (sourceFormat || 'unknown'));
  const key4 = normalizeText(canonicalAssetId) || (await createCanonicalStoryboard3DAssetId(file)),
    bounds =
      normalizeBounds(parsed?.['bounds']) ||
      normalizeBounds(measureStoryboard3DImportedSceneBounds(parsed?.['scene']));
  if (!bounds) throw new Error('Parsed asset bounds are required.');
  const data = parsed?.['scene']
      ? countStoryboard3DSceneTriangles(parsed['scene'])
      : Number(parsed?.['triangleCount']),
    triangleCount = Math['max'](0, Math['floor'](Number(data) || 0)),
    storage = indexedDbReference
      ? createStoryboard3DIndexedDbAssetReference(indexedDbReference)
      : createStoryboard3DIndexedDbAssetReference({ key: key4 }),
    options = Array['isArray'](limitations) ? limitations : storyboard3DModelImportCapability['limitations'];
  return {
    version: STORYBOARD_3D_ASSET_RECORD_VERSION,
    canonicalAssetId: key4,
    name: normalizeText(file?.['name']) || key4,
    sourceFormat: sourceFormat,
    source: {
      fileName: normalizeText(file?.['name']),
      mimeType: normalizeText(file?.['type']),
      byteLength: Math['max'](0, Number(file?.['size']) || 0),
    },
    storage: storage,
    defaultScale:
      normalization?.['status'] === 'ready'
        ? Math['max'](0.000001, Number(normalization['uniformScale']) || 1)
        : 1,
    bounds: bounds,
    triangleCount: triangleCount,
    limitations: [...new Set((options || [])['map'](normalizeText)['filter'](Boolean))],
    normalizationStatus: normalization?.['status'] === 'ready' ? 'ready' : 'awaiting-bounds',
    createdAt: Math['max'](0, Number(createdAt) || 0),
  };
}
