import { getModelManifest } from '../../manifests/index.js';
import { resolveGenerationInputImageUrl } from '../../services/imageReferenceUrlService.js';
export function collectAudioWorkflowImageInputs(_0x2dad37, _0x59cca5 = [], _0x1b5e19 = {}) {
  const _0x12b3c4 = (getModelManifest(_0x2dad37)?.['inputSlots']?.['fixedSlots'] || [])['filter'](
    (_0x3ebe63) => _0x3ebe63['kind'] === 'image',
  );
  if (!_0x12b3c4['length']) return [];
  return _0x59cca5['filter']((_0x3490c2) =>
    String(_0x1b5e19[_0x3490c2['sourceId']]?.['type'] || '')['includes']('image'),
  )['map']((_0x10d89d) => ({
    edgeId: _0x10d89d['id'],
    sourceId: _0x10d89d['sourceId'],
    sourceType: _0x1b5e19[_0x10d89d['sourceId']]['type'],
    refSlot: String(_0x10d89d['refSlot'] || _0x12b3c4[0x0]['id']),
    url: resolveGenerationInputImageUrl(_0x1b5e19[_0x10d89d['sourceId']]),
  }));
}
export function buildAudioWorkflowImageSlotItems(_0x3b0d6e, _0x51916e, _0x3f8e76) {
  return collectAudioWorkflowImageInputs(_0x3b0d6e, _0x51916e, _0x3f8e76)['map']((_0x179571) => ({
    ..._0x179571,
    edge: _0x51916e['find']((_0x4e17e4) => _0x4e17e4['id'] === _0x179571['edgeId']),
    sourceNode: _0x3f8e76[_0x179571['sourceId']],
    kind: 'image',
  }));
}
