import { getActiveManifestInputPolicyVariant, getTargetInputPolicy } from '../../modules/modelInputPolicy.js';
function getInputArray(value, item) {
  return Array.isArray(value?.[item]) ? value[item] : [];
}
function getKindMax(key, index) {
  const count = Number(key?.maxByKind?.[index]);
  return Number.isFinite(count) && count >= 0 ? count : Infinity;
}
function filterKindMaterials({
  allowedKinds: allowedKinds,
  policy: policy,
  kind: kind,
  urls: urls,
  refs: refs,
  entries: entries,
}) {
  const urls2 = allowedKinds.has(kind) ? urls.slice(0, getKindMax(policy, kind)) : [],
    map = new Set(urls2);
  return {
    urls: urls2,
    refs: refs.filter((response) => map.has(String(response?.url || '').trim())),
    entries: entries.filter((response2) => map.has(String(response2?.url || '').trim())),
  };
}
export function resolveModelApiVideoInputMaterials({
  inputMaterials: inputMaterials = {},
  modelManifest: modelManifest = null,
  nodeData: nodeData = {},
} = {}) {
  const urls3 = {
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
  if (!getActiveManifestInputPolicyVariant(modelManifest?.inputSlots, nodeData)) return urls3;
  const policy2 = getTargetInputPolicy({
      ...nodeData,
      type: nodeData?.type || 'ai-video',
      model: nodeData?.model || modelManifest?.modelId || '',
      provider: nodeData?.provider || modelManifest?.provider || '',
    }),
    allowedKinds2 = new Set(Array.isArray(policy2?.allowedKinds) ? policy2.allowedKinds : []),
    images = filterKindMaterials({
      allowedKinds: allowedKinds2,
      policy: policy2,
      kind: 'image',
      urls: urls3.images,
      refs: urls3.imageRefs,
      entries: urls3.imageEntries,
    }),
    videos = filterKindMaterials({
      allowedKinds: allowedKinds2,
      policy: policy2,
      kind: 'video',
      urls: urls3.videos,
      refs: urls3.videoRefs,
      entries: urls3.videoEntries,
    }),
    audios = filterKindMaterials({
      allowedKinds: allowedKinds2,
      policy: policy2,
      kind: 'audio',
      urls: urls3.audios,
      refs: [],
      entries: urls3.audioEntries,
    });
  return {
    images: images.urls,
    imageRefs: images.refs,
    imageEntries: images.entries,
    videos: videos.urls,
    videoRefs: videos.refs,
    videoEntries: videos.entries,
    audios: audios.urls,
    audioEntries: audios.entries,
    providerAssetRefs: urls3.providerAssetRefs,
  };
}
