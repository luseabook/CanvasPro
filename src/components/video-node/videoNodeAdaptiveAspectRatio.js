import {
  getGenerationDisplayRatioSourceConfig,
  getGenerationRatioSizeWithDom,
} from '../../modules/generationRatioSource.js';
import { applyVideoAdaptiveAspectRatio } from '../../modules/videoAspectRatioExecution.js';
function getAdaptiveSourceKind(value = '') {
  const list = String(value || '')['toLowerCase']();
  if (list['includes']('image')) return 'image';
  if (list['includes']('video')) return 'video';
  return '';
}
function pickAdaptiveSourceSize({
  inEdges: inEdges = [],
  nodes: nodes = {},
  nodeData: nodeData = {},
  preferConfiguredSource: preferConfiguredSource = ![],
} = {}) {
  const list2 = [];
  for (const nodeId of inEdges) {
    const nodeData2 = nodes?.[nodeId?.['sourceId']];
    if (!nodeData2) continue;
    const kind = getAdaptiveSourceKind(nodeData2?.['type']);
    if (!kind) continue;
    const size = getGenerationRatioSizeWithDom({
      nodeId: nodeId?.['sourceId'],
      nodeData: nodeData2,
      edge: nodeId,
      includeNodeFrame: !![],
    });
    if (!(size?.['width'] > 0 && size?.['height'] > 0)) continue;
    list2['push']({ edge: nodeId, kind: kind, size: size });
  }
  if (preferConfiguredSource) {
    const generationDisplayRatioSourceConfig = getGenerationDisplayRatioSourceConfig(nodeData),
      list3 = generationDisplayRatioSourceConfig?.['kind']
        ? list2['filter']((item) => item['kind'] === generationDisplayRatioSourceConfig['kind'])
        : list2,
      key = Array['isArray'](generationDisplayRatioSourceConfig?.['slots'])
        ? generationDisplayRatioSourceConfig['slots']
        : generationDisplayRatioSourceConfig?.['slot']
          ? [generationDisplayRatioSourceConfig['slot']]
          : [];
    for (const index of key) {
      const result = list3['find']((data) => String(data['edge']?.['refSlot'] || '')['trim']() === index);
      if (result?.['size']) return result['size'];
    }
    const count =
      generationDisplayRatioSourceConfig?.['inputIndex'] !== undefined
        ? generationDisplayRatioSourceConfig['inputIndex']
        : generationDisplayRatioSourceConfig?.['fallbackIndex'];
    if (Number['isInteger'](count) && count >= 0 && count < list3['length'])
      return list3[count]?.['size'] || null;
    if (list3[0]?.['size']) return list3[0]['size'];
  }
  return (
    list2['find']((options) => options['kind'] === 'image')?.['size'] ||
    list2['find']((target) => target['kind'] === 'video')?.['size'] ||
    null
  );
}
export function applyVideoNodeAdaptiveAspectRatio(
  source,
  {
    inEdges: inEdges = [],
    nodes: nodes = {},
    nodeData: nodeData = {},
    provider: provider = '',
    model: model = '',
    modelManifest: modelManifest = null,
  } = {},
) {
  const sourceWidth = pickAdaptiveSourceSize({
    inEdges: inEdges,
    nodes: nodes,
    nodeData: nodeData,
    preferConfiguredSource: Boolean(modelManifest?.['inputSlots']?.['displayAspectRatioSource']),
  });
  return applyVideoAdaptiveAspectRatio(source, {
    nodeData: nodeData,
    modelManifest: modelManifest,
    provider: provider,
    model: model,
    displayWidth: 0,
    displayHeight: 0,
    sourceWidth: sourceWidth?.['width'] || 0,
    sourceHeight: sourceWidth?.['height'] || 0,
  });
}
