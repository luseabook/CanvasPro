import { getModelManifest } from '../../manifests/index.js';
import { resolveGenerationInputImageUrl } from '../../services/imageReferenceUrlService.js';
export function collectAudioWorkflowImageInputs(value, list = [], sourceType = {}) {
  const list2 = (getModelManifest(value)?.['inputSlots']?.['fixedSlots'] || [])['filter'](
    (item) => item['kind'] === 'image',
  );
  if (!list2['length']) return [];
  return list['filter']((key) => String(sourceType[key['sourceId']]?.['type'] || '')['includes']('image'))[
    'map'
  ]((edgeId) => ({
    edgeId: edgeId['id'],
    sourceId: edgeId['sourceId'],
    sourceType: sourceType[edgeId['sourceId']]['type'],
    refSlot: String(edgeId['refSlot'] || list2[0x0]['id']),
    url: resolveGenerationInputImageUrl(sourceType[edgeId['sourceId']]),
  }));
}
export function buildAudioWorkflowImageSlotItems(index, edge, sourceNode) {
  return collectAudioWorkflowImageInputs(index, edge, sourceNode)['map']((args) => ({
    ...args,
    edge: edge['find']((result) => result['id'] === args['edgeId']),
    sourceNode: sourceNode[args['sourceId']],
    kind: 'image',
  }));
}
