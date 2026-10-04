import { generateId as generateId_2 } from '../../core/math.js';
import {
  createStoryboardScriptNodeData,
  STORYBOARD_SCRIPT_DEFAULT_SIZE,
} from '../../core/storyboardScriptFactory.js';
import appStore from '../../core/stores/appStore.js';
import {
  addEdgeWithPolicies as addEdgeWithPolicies_2,
  isValidConnection,
} from '../../modules/interaction/EdgeController.js';
import { commit as commit_2 } from '../../modules/history.js';
import { calcSafeSpawnPosNearNode as calcSafeSpawnPosNearNode_2 } from '../../modules/nodeSpawn.js';
import { t } from '../../i18n/index.js';
export function getVideoStoryboardScriptDefaultPrompt() {
  return storyboardActionText('videoDefaultPrompt');
}
export const VIDEO_STORYBOARD_SCRIPT_DEFAULT_PROMPT = getVideoStoryboardScriptDefaultPrompt();
function getGraphStore(value) {
  return value?.graphStore || value || appStore;
}
function readStateSnapshot({ storeInstance: storeInstance2, getStateSnapshot: getStateSnapshot } = {}) {
  if (typeof getStateSnapshot === 'function') {
    const item = getStateSnapshot();
    if (item && typeof item === 'object') return item;
  }
  const store = getGraphStore(storeInstance2);
  if (typeof store?.getStateRaw === 'function') return store.getStateRaw();
  if (typeof store?.getState === 'function') return store.getState();
  if (typeof storeInstance2?.getStateRaw === 'function') return storeInstance2.getStateRaw();
  if (typeof storeInstance2?.getState === 'function') return storeInstance2.getState();
  return {};
}
function notify(key, index = 'warn') {
  const run = globalThis.window?.showToast;
  if (typeof run === 'function') run(key, index);
}
function storyboardActionText(result, data = {}) {
  return t('nodeToolbar.storyboardScriptAction.' + result, data);
}
function isVideoSourceNode(options) {
  const target = String(options?.type || '').trim();
  return target === 'source-video' || target === 'ai-video' || target === 'video';
}
export function createConnectedStoryboardScriptNode({
  sourceNodeId: sourceNodeId,
  sourceNode: sourceNode,
  storeInstance: storeInstance = appStore,
  getStateSnapshot: getStateSnapshot2,
  addEdgeWithPolicies: addEdgeWithPolicies = addEdgeWithPolicies_2,
  isValidConnectionFn: isValidConnectionFn = isValidConnection,
  commit: commit = commit_2,
  generateId: generateId = generateId_2,
  calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode = calcSafeSpawnPosNearNode_2,
} = {}) {
  const storeInstance3 = getGraphStore(storeInstance),
    stateSnapshot = readStateSnapshot({ storeInstance: storeInstance3, getStateSnapshot: getStateSnapshot2 }),
    source = stateSnapshot?.nodes || {},
    next = String(sourceNodeId || sourceNode?.id || '').trim(),
    enabled = source[next] || sourceNode || null,
    sourceId = String(enabled?.id || next || '').trim();
  if (!sourceId || !enabled)
    return (notify(storyboardActionText('missingSource')), { ok: false, reason: 'missing-source' });
  const id = generateId('storyboard-script'),
    width = STORYBOARD_SCRIPT_DEFAULT_SIZE.width,
    height = STORYBOARD_SCRIPT_DEFAULT_SIZE.height,
    x = calcSafeSpawnPosNearNode(source, enabled, width, height),
    storyboardScript = isVideoSourceNode(enabled) ? getVideoStoryboardScriptDefaultPrompt() : '',
    storyboardScriptNodeData = createStoryboardScriptNodeData({
      id: id,
      x: x.x,
      y: x.y,
      width: width,
      height: height,
      storyboardScript: storyboardScript ? { prompt: storyboardScript, sourceMode: 'video' } : {},
    });
  if (storyboardScript) storyboardScriptNodeData.prompt = storyboardScript;
  if (typeof isValidConnectionFn === 'function' && !isValidConnectionFn(enabled, storyboardScriptNodeData))
    return (notify(storyboardActionText('invalidConnection')), { ok: false, reason: 'invalid-connection' });
  if (typeof storeInstance3?.addNode !== 'function')
    return (
      notify(storyboardActionText('missingAddNode'), 'error'),
      { ok: false, reason: 'missing-add-node' }
    );
  storeInstance3.addNode(storyboardScriptNodeData);
  const addEdgeWithPolicies2 = addEdgeWithPolicies({ sourceId: sourceId, targetId: id });
  if (!addEdgeWithPolicies2)
    return (
      storeInstance3.deleteNodes?.([id]),
      notify(storyboardActionText('connectFailed'), 'error'),
      { ok: false, reason: 'connect-failed' }
    );
  return (storeInstance3.setSelectedNodes?.([id]), commit?.(), { ok: true, nodeId: id });
}
export function bindStoryboardScriptToolbarAction({
  toolbarEl: toolbarEl,
  nodeData: nodeData,
  store: store2 = appStore,
  getStateSnapshot: getStateSnapshot3,
  buttonSelector: buttonSelector = '.act-storyboard-script',
  addEdgeWithPolicies: addEdgeWithPolicies3,
  isValidConnectionFn: isValidConnectionFn2,
  commit: commit2,
  generateId: generateId2,
  calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode2,
} = {}) {
  const el = toolbarEl?.querySelector?.(buttonSelector);
  if (!el) return;
  el.addEventListener('click', (event) => {
    (event.preventDefault(),
      event.stopPropagation(),
      createConnectedStoryboardScriptNode({
        sourceNodeId: nodeData?.id,
        sourceNode: nodeData,
        storeInstance: store2,
        getStateSnapshot: getStateSnapshot3,
        addEdgeWithPolicies: addEdgeWithPolicies3,
        isValidConnectionFn: isValidConnectionFn2,
        commit: commit2,
        generateId: generateId2,
        calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode2,
      }));
  });
}
