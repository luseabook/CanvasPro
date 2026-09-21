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
function getGraphStore(_0x3583de) {
  return _0x3583de?.graphStore || _0x3583de || appStore;
}
function readStateSnapshot({ storeInstance: _0x1b451a, getStateSnapshot: _0x1c14f6 } = {}) {
  if (typeof _0x1c14f6 === 'function') {
    const _0x3950a7 = _0x1c14f6();
    if (_0x3950a7 && typeof _0x3950a7 === 'object') return _0x3950a7;
  }
  const _0x5d12af = getGraphStore(_0x1b451a);
  if (typeof _0x5d12af?.getStateRaw === 'function') return _0x5d12af.getStateRaw();
  if (typeof _0x5d12af?.getState === 'function') return _0x5d12af.getState();
  if (typeof _0x1b451a?.getStateRaw === 'function') return _0x1b451a.getStateRaw();
  if (typeof _0x1b451a?.getState === 'function') return _0x1b451a.getState();
  return {};
}
function notify(_0x2e5d1e, _0x2c8748 = 'warn') {
  const _0x4f65a4 = globalThis.window?.showToast;
  if (typeof _0x4f65a4 === 'function') _0x4f65a4(_0x2e5d1e, _0x2c8748);
}
function storyboardActionText(_0x5c4fa4, _0x5878a6 = {}) {
  return t('nodeToolbar.storyboardScriptAction.' + _0x5c4fa4, _0x5878a6);
}
function isVideoSourceNode(_0x480e2d) {
  const _0x26e4e2 = String(_0x480e2d?.type || '').trim();
  return _0x26e4e2 === 'source-video' || _0x26e4e2 === 'ai-video' || _0x26e4e2 === 'video';
}
export function createConnectedStoryboardScriptNode({
  sourceNodeId: _0x3de506,
  sourceNode: _0x245d9f,
  storeInstance: storeInstance = appStore,
  getStateSnapshot: _0x4854c7,
  addEdgeWithPolicies: addEdgeWithPolicies = addEdgeWithPolicies_2,
  isValidConnectionFn: isValidConnectionFn = isValidConnection,
  commit: commit = commit_2,
  generateId: generateId = generateId_2,
  calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode = calcSafeSpawnPosNearNode_2,
} = {}) {
  const _0x40ab6d = getGraphStore(storeInstance),
    _0x38f2da = readStateSnapshot({ storeInstance: _0x40ab6d, getStateSnapshot: _0x4854c7 }),
    _0xc5c71e = _0x38f2da?.nodes || {},
    _0x3cfd26 = String(_0x3de506 || _0x245d9f?.id || '').trim(),
    _0x102c2c = _0xc5c71e[_0x3cfd26] || _0x245d9f || null,
    _0x426dd9 = String(_0x102c2c?.id || _0x3cfd26 || '').trim();
  if (!_0x426dd9 || !_0x102c2c)
    return (notify(storyboardActionText('missingSource')), { ok: false, reason: 'missing-source' });
  const _0x352650 = generateId('storyboard-script'),
    _0x3bf179 = STORYBOARD_SCRIPT_DEFAULT_SIZE.width,
    _0x42957f = STORYBOARD_SCRIPT_DEFAULT_SIZE.height,
    _0x5411c4 = calcSafeSpawnPosNearNode(_0xc5c71e, _0x102c2c, _0x3bf179, _0x42957f),
    _0x4d4382 = isVideoSourceNode(_0x102c2c) ? getVideoStoryboardScriptDefaultPrompt() : '',
    _0x538523 = createStoryboardScriptNodeData({
      id: _0x352650,
      x: _0x5411c4.x,
      y: _0x5411c4.y,
      width: _0x3bf179,
      height: _0x42957f,
      storyboardScript: _0x4d4382 ? { prompt: _0x4d4382, sourceMode: 'video' } : {},
    });
  if (_0x4d4382) _0x538523.prompt = _0x4d4382;
  if (typeof isValidConnectionFn === 'function' && !isValidConnectionFn(_0x102c2c, _0x538523))
    return (notify(storyboardActionText('invalidConnection')), { ok: false, reason: 'invalid-connection' });
  if (typeof _0x40ab6d?.addNode !== 'function')
    return (
      notify(storyboardActionText('missingAddNode'), 'error'),
      { ok: false, reason: 'missing-add-node' }
    );
  _0x40ab6d.addNode(_0x538523);
  const _0x5d34ca = addEdgeWithPolicies({ sourceId: _0x426dd9, targetId: _0x352650 });
  if (!_0x5d34ca)
    return (
      _0x40ab6d.deleteNodes?.([_0x352650]),
      notify(storyboardActionText('connectFailed'), 'error'),
      { ok: false, reason: 'connect-failed' }
    );
  return (_0x40ab6d.setSelectedNodes?.([_0x352650]), commit?.(), { ok: true, nodeId: _0x352650 });
}
export function bindStoryboardScriptToolbarAction({
  toolbarEl: _0x4eb83e,
  nodeData: _0x301a45,
  store: _0x224f5c = appStore,
  getStateSnapshot: _0x451424,
  buttonSelector: buttonSelector = '.act-storyboard-script',
  addEdgeWithPolicies: _0x3cae8e,
  isValidConnectionFn: _0x555747,
  commit: _0x1d70c8,
  generateId: _0x3b7442,
  calcSafeSpawnPosNearNode: _0x14cad7,
} = {}) {
  const _0x52d574 = _0x4eb83e?.querySelector?.(buttonSelector);
  if (!_0x52d574) return;
  _0x52d574.addEventListener('click', (_0x590009) => {
    (_0x590009.preventDefault(),
      _0x590009.stopPropagation(),
      createConnectedStoryboardScriptNode({
        sourceNodeId: _0x301a45?.id,
        sourceNode: _0x301a45,
        storeInstance: _0x224f5c,
        getStateSnapshot: _0x451424,
        addEdgeWithPolicies: _0x3cae8e,
        isValidConnectionFn: _0x555747,
        commit: _0x1d70c8,
        generateId: _0x3b7442,
        calcSafeSpawnPosNearNode: _0x14cad7,
      }));
  });
}
