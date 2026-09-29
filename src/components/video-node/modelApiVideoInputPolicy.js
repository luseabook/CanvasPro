import { getActiveManifestInputPolicyVariant, getTargetInputPolicy } from '../../modules/modelInputPolicy.js';
function getInputArray(_0x2be4fc, _0x1b2c22) {
  return Array['isArray'](_0x2be4fc?.[_0x1b2c22]) ? _0x2be4fc[_0x1b2c22] : [];
}
function getKindMax(_0x45566f, _0x8a986f) {
  const _0x2458f7 = Number(_0x45566f?.['maxByKind']?.[_0x8a986f]);
  return Number['isFinite'](_0x2458f7) && _0x2458f7 >= 0x0 ? _0x2458f7 : Infinity;
}
function filterKindMaterials({
  allowedKinds: _0x3699f8,
  policy: _0x58f86e,
  kind: _0x3d55da,
  urls: _0x146c50,
  refs: _0x3f3ff9,
  entries: _0x489417,
}) {
  const _0x401f7b = _0x3699f8['has'](_0x3d55da)
      ? _0x146c50['slice'](0x0, getKindMax(_0x58f86e, _0x3d55da))
      : [],
    _0x2682ec = new Set(_0x401f7b);
  return {
    urls: _0x401f7b,
    refs: _0x3f3ff9['filter']((_0x5c7cfc) => _0x2682ec['has'](String(_0x5c7cfc?.['url'] || '')['trim']())),
    entries: _0x489417['filter']((_0x588c45) => _0x2682ec['has'](String(_0x588c45?.['url'] || '')['trim']())),
  };
}
export function resolveModelApiVideoInputMaterials({
  inputMaterials: inputMaterials = {},
  modelManifest: modelManifest = null,
  nodeData: nodeData = {},
} = {}) {
  const _0x246216 = {
    images: getInputArray(inputMaterials, 'images'),
    imageRefs: getInputArray(inputMaterials, 'imageRefs'),
    imageEntries: getInputArray(inputMaterials, 'imageEntries'),
    videos: getInputArray(inputMaterials, 'videos'),
    videoRefs: getInputArray(inputMaterials, 'videoRefs'),
    videoEntries: getInputArray(inputMaterials, 'videoEntries'),
    audios: getInputArray(inputMaterials, 'audios'),
    audioEntries: getInputArray(inputMaterials, 'audioEntries'),
    providerAssetRefs: getInputArray(inputMaterials, 'providerAssetRefs'),
  };
  if (!getActiveManifestInputPolicyVariant(modelManifest?.['inputSlots'], nodeData)) return _0x246216;
  const _0x266c25 = getTargetInputPolicy({
      ...nodeData,
      type: nodeData?.['type'] || 'ai-video',
      model: nodeData?.['model'] || modelManifest?.['modelId'] || '',
      provider: nodeData?.['provider'] || modelManifest?.['provider'] || '',
    }),
    _0x459008 = new Set(Array['isArray'](_0x266c25?.['allowedKinds']) ? _0x266c25['allowedKinds'] : []),
    _0x4b0c7f = filterKindMaterials({
      allowedKinds: _0x459008,
      policy: _0x266c25,
      kind: 'image',
      urls: _0x246216['images'],
      refs: _0x246216['imageRefs'],
      entries: _0x246216['imageEntries'],
    }),
    _0x251f9b = filterKindMaterials({
      allowedKinds: _0x459008,
      policy: _0x266c25,
      kind: 'video',
      urls: _0x246216['videos'],
      refs: _0x246216['videoRefs'],
      entries: _0x246216['videoEntries'],
    }),
    _0x15508e = filterKindMaterials({
      allowedKinds: _0x459008,
      policy: _0x266c25,
      kind: 'audio',
      urls: _0x246216['audios'],
      refs: [],
      entries: _0x246216['audioEntries'],
    });
  return {
    images: _0x4b0c7f['urls'],
    imageRefs: _0x4b0c7f['refs'],
    imageEntries: _0x4b0c7f['entries'],
    videos: _0x251f9b['urls'],
    videoRefs: _0x251f9b['refs'],
    videoEntries: _0x251f9b['entries'],
    audios: _0x15508e['urls'],
    audioEntries: _0x15508e['entries'],
    providerAssetRefs: _0x246216['providerAssetRefs'],
  };
}
