import appStore from '../core/stores/appStore.js';
import { generateId } from '../core/math.js';
import { commit } from './history.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { buildSourceAudioNodePayload, buildSourceMediaNodePayload } from '../services/fileService.js';
import { buildRecoveredMediaFields } from './mediaTaskRecoveryModel.js';
import { MediaTaskRecoveryPanel } from './MediaTaskRecoveryPanel.js';

function buildNode(description, nodes) {
  const fields = buildRecoveredMediaFields(description, generateId(`source-${description.mediaType}`));
  const viewport = appStore.getStateRaw().viewport || {};
  const zoom = Number(viewport.zoom) > 0 ? Number(viewport.zoom) : 1;
  const anchor = { x: -(Number(viewport.x) || 0) / zoom, y: -(Number(viewport.y) || 0) / zoom, width: 0, height: 0 };
  const make = description.mediaType === 'audio' ? buildSourceAudioNodePayload : buildSourceMediaNodePayload;
  const ratio = description.width / description.height;
  const node = make({ ...fields, naturalWidth: 0, naturalHeight: 0, width: 320,
    height: description.mediaType === 'audio' ? 140 : (Number.isFinite(ratio) && ratio >= 0.25 && ratio <= 4 ? 320 / ratio : 180),
    needsAutoResize: false });
  return { ...node, ...calcSafeSpawnPosNearNode(nodes, anchor, node.width, node.height) };
}
export function createMediaTaskRecoveryPanel(options) {
  return new MediaTaskRecoveryPanel({ ...options, store: appStore, buildNode, commit });
}
