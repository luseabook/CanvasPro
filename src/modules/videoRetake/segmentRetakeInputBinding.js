import { findAvailablePosition, generateId } from '../../core/math.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../../services/fileService.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { getNodeSpawnPrefs } from '../nodeSpawn.js';
import { calcSegmentRetakeInputStart } from './segmentRetakeSession.js';
import { t } from '../../i18n/index.js';
export function getSegmentRetakeVideoEdges(store, value) {
  const state = store['getState']();
  return store['getIncomingEdges'](value)['filter'](
    (item) =>
      String(state['nodes']?.[item['sourceId']]?.['type'] || '')['includes']('video') ||
      item['refSlot'] === 'referenceVideo',
  );
}
function createClipNode(state2, targetNode, key, localPath) {
  const name = state2['nodes']?.[key['sourceNodeId']] || targetNode,
    itemWidth = getAutoMediaSizeByShortSide(targetNode['width'] || 560, targetNode['height'] || 315),
    { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
    box = calcSegmentRetakeInputStart({
      targetNode: targetNode,
      itemWidth: itemWidth['width'],
      itemHeight: itemWidth['height'],
      spacing: spacing,
      direction: direction,
    }),
    x = avoidOverlap
      ? findAvailablePosition(
          state2['nodes'],
          box['x'],
          box['y'],
          itemWidth['width'],
          itemWidth['height'],
          spacing,
          'down',
        )
      : box,
    src = localPathToUrl(localPath['localPath']);
  return buildSourceMediaNodePayload({
    id: generateId('source-video-retake'),
    type: 'source-video',
    x: x['x'],
    y: x['y'],
    ...itemWidth,
    name: t('videoClip.cut.newNodeName', { name: name['name'] || t('videoClip.cut.videoFallback') }),
    src: src,
    videoUrl: src,
    videoThumbSrc: src,
    localPath: localPath['localPath'],
    originalLocalPath: localPath['localPath'],
    videoDuration: localPath['durationSec'],
    needsAutoResize: ![],
    fixedSize: !![],
  });
}
export function bindSegmentRetakeInput({
  store: store2,
  nodeId: nodeId,
  nodePatch: nodePatch,
  fullLength: fullLength,
}) {
  const state3 = store2['getState'](),
    index = state3['nodes'][nodeId],
    result = nodePatch['segmentRetake'],
    args = result['materializedClip'];
  let nodeId2 = fullLength ? state3['nodes'][result['sourceNodeId']] : state3['nodes'][args?.['nodeId']],
    clipNode = null;
  !fullLength &&
    (nodeId2?.['type'] !== 'source-video' || nodeId2['localPath'] !== args['localPath']) &&
    ((clipNode = createClipNode(state3, index, result, args)), (nodeId2 = clipNode));
  !fullLength && (result['materializedClip'] = { ...args, nodeId: nodeId2['id'] });
  const list = getSegmentRetakeVideoEdges(store2, nodeId),
    sourceMediaKey = fullLength
      ? result['sourceMediaKey'] || result['sourceLocalPath'] || result['sourceUrl']
      : args['localPath'],
    enabled = list['find'](
      (enabled2) =>
        enabled2['sourceId'] === nodeId2?.['id'] &&
        (!enabled2['sourceMediaKey'] || enabled2['sourceMediaKey'] === sourceMediaKey),
    ),
    list2 = nodeId2 ? list['filter']((data) => data !== enabled) : [],
    options =
      nodeId2 && !enabled
        ? {
            id: generateId('edge-retake-video'),
            sourceId: nodeId2['id'],
            targetId: nodeId,
            refSlot: 'referenceVideo',
            sourceMediaKey: sourceMediaKey,
          }
        : null;
  return (
    store2['batch'](() => {
      if (clipNode) store2['addNode'](clipNode);
      list2['forEach']((target) => store2['removeEdge'](target['id']));
      if (options) store2['addEdge'](options);
      store2['updateNodeData'](nodeId, nodePatch);
    }),
    Boolean(clipNode || options || list2['length'])
  );
}
