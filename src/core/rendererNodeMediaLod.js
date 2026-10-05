import { isNodeType } from '../modules/registry.js';
import {
  CANVAS_IMAGE_LOD_ENTER_THUMB_ZOOM,
  CANVAS_IMAGE_LOD_EXIT_THUMB_ZOOM,
  MEDIA_LOD_MODE_ATTR,
  MEDIA_LOD_MODE_FULL,
  MEDIA_LOD_MODE_THUMB,
} from '../modules/canvasImageLod.js';
export function getNodeMediaLodMode(value, box, item = '') {
  if (!isNodeType(value, ['source-image', 'ai-image'])) return '';
  const key = Number.isFinite(box?.zoom) ? box.zoom : 1,
    index = item === MEDIA_LOD_MODE_THUMB ? MEDIA_LOD_MODE_THUMB : MEDIA_LOD_MODE_FULL;
  if (index === MEDIA_LOD_MODE_THUMB)
    return key >= CANVAS_IMAGE_LOD_EXIT_THUMB_ZOOM ? MEDIA_LOD_MODE_FULL : MEDIA_LOD_MODE_THUMB;
  return key <= CANVAS_IMAGE_LOD_ENTER_THUMB_ZOOM ? MEDIA_LOD_MODE_THUMB : MEDIA_LOD_MODE_FULL;
}
export function syncNodeMediaLodMode(el, result, data) {
  if (!el?.dataset) return '';
  const options = String(el.dataset[MEDIA_LOD_MODE_ATTR] || '').trim(),
    nodeMediaLodMode = getNodeMediaLodMode(result, data, options);
  if (!nodeMediaLodMode)
    return (MEDIA_LOD_MODE_ATTR in el.dataset && delete el.dataset[MEDIA_LOD_MODE_ATTR], '');
  return (
    el.dataset[MEDIA_LOD_MODE_ATTR] !== nodeMediaLodMode &&
      (el.dataset[MEDIA_LOD_MODE_ATTR] = nodeMediaLodMode),
    nodeMediaLodMode
  );
}

export function collectFullEligibleVisibleImageNodeIds({
  nodes: nodes,
  candidateNodeIds: candidateNodeIds,
  viewport: viewport,
  devicePixelRatio: devicePixelRatio,
  isVisible: isVisible = () => true,
  getPreviousMode: getPreviousMode = () => '',
  interactionBusy: interactionBusy = false,
} = {}) {
  const target = nodes && typeof nodes === 'object' ? nodes : {},
    source = candidateNodeIds instanceof Set ? candidateNodeIds : new Set(candidateNodeIds || []),
    next = new Set();
  for (const current of source) {
    const entry = target[current];
    if (!isNodeType(entry, ['source-image', 'ai-image'])) continue;
    if (!isVisible(entry, current)) continue;
    getNodeMediaLodMode(entry, viewport, getPreviousMode(current), {
      devicePixelRatio: devicePixelRatio,
      interactionBusy: interactionBusy,
    }) === MEDIA_LOD_MODE_FULL && next['add'](current);
  }
  return next;
}

export function applyRendererFullEligibleImageCandidates(args, record) {
  if (!(record instanceof Set) || record['size'] === 0) return args;
  const payload = new Set(args?.['mountCandidateIds']),
    handle = new Set(args?.['parkCandidateIds']);
  for (const state of record) {
    (payload['add'](state), handle['delete'](state));
  }
  return { ...args, mountCandidateIds: payload, parkCandidateIds: handle };
}

export function prioritizeFullEligibleVisibleImageNodes(config, scope) {
  if (!Array['isArray'](config) || config['length'] < 2 || !(scope instanceof Set) || scope['size'] === 0)
    return config;
  const list = [],
    input = [];
  for (const output of config) {
    output?.['id'] && scope['has'](output['id']) ? list['push'](output) : input['push'](output);
  }
  return list['length'] ? list['concat'](input) : config;
}
