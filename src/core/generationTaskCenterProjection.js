import { emitGenerationTaskCenterUpdate } from '../modules/generationTaskCenterEvents.js';
import { getModelManifest } from '../manifests/index.js';
import { getProviderConfig } from '../../api/configApi.js';
import { translateManifestText } from '../i18n/manifestText.js';
import { resolveTaskCenterThumbnail } from '../modules/taskCenterThumbnail.js';
const storeIds = new WeakMap();
let storeSequence = 0x0;
export function reportRuntimeTask(_0x20da8d, _0x2a9ec4 = {}) {
  if (!_0x20da8d) return;
  const _0x5aa403 = _0x20da8d['spec'] || {},
    _0x5a18b6 = _0x20da8d['getTaskNode']?.() || {},
    _0x2327ed = getModelManifest(_0x5aa403['modelId']);
  _0x20da8d['taskCenterProviderProfileId'] ??=
    _0x5aa403['providerProfileId'] ||
    _0x5aa403['payload']?.['providerProfileId'] ||
    _0x5aa403['payload']?.['rhProviderProfileId'] ||
    getProviderConfig(_0x5aa403['provider'])?.['providerProfileId'] ||
    '';
  const _0x3938be = {
    queued: 'waiting',
    running: 'processing',
    pending: 'processing',
    paused: 'waiting',
    success: 'complete',
    failed: 'failed',
    cancelled: 'cancelled',
  }[_0x2a9ec4['status']];
  if (!_0x3938be) return;
  if (_0x20da8d['store'] && !storeIds['has'](_0x20da8d['store']))
    storeIds['set'](_0x20da8d['store'], 'store-' + ++storeSequence);
  _0x20da8d['taskCenterTaskId'] ||=
    'generation:' +
    (_0x20da8d['taskScopeId'] || storeIds['get'](_0x20da8d['store']) || _0x20da8d['projectId']) +
    ':' +
    _0x20da8d['targetNodeId'] +
    ':' +
    _0x20da8d['startedAt'];
  const _0x585e0e = ['complete', 'failed', 'cancelled']['includes'](_0x3938be);
  emitGenerationTaskCenterUpdate({
    taskId: _0x20da8d['taskCenterTaskId'],
    source: 'generation',
    nodeId: _0x20da8d['targetNodeId'],
    kind: _0x2327ed?.['kind'] || _0x5aa403['taskType'],
    title:
      _0x5a18b6['name'] ||
      _0x5a18b6['title'] ||
      translateManifestText(_0x2327ed?.['displayName']) ||
      _0x5aa403['modelId'],
    provider: _0x5aa403['provider'],
    modelId: _0x5aa403['modelId'],
    adapterType: _0x5aa403['adapterType'],
    providerProfileId: _0x20da8d['taskCenterProviderProfileId'],
    projectId: _0x20da8d['projectId'],
    canvasId: _0x20da8d['taskScopeId'],
    navigation: {
      source: 'canvas',
      projectId: _0x20da8d['projectId'],
      canvasId: _0x20da8d['taskScopeId'],
      nodeId: _0x20da8d['targetNodeId'],
    },
    status: _0x3938be,
    progress: _0x585e0e && _0x3938be === 'complete' ? 0x1 : null,
    message:
      _0x2a9ec4['message'] ||
      (_0x2a9ec4['status'] === 'paused'
        ? '等待恢复'
        : String(_0x5a18b6['statusMessage'] || _0x5a18b6['rhStatusMessage'] || '')),
    error:
      _0x3938be === 'failed'
        ? String(_0x5a18b6['jobError'] || _0x5a18b6['asyncTaskError'] || _0x5a18b6['rhTaskError'] || '')
        : '',
    remoteTaskId: _0x20da8d['taskId'],
    cancellable: !_0x585e0e && _0x2a9ec4['status'] !== 'paused' && _0x5aa403['cancellable'] === !![],
    result:
      _0x3938be === 'complete'
        ? {
            localPath: _0x5a18b6['localPath'],
            images: _0x5a18b6['images'],
            videos: _0x5a18b6['videos'],
            audios: _0x5a18b6['audios'],
          }
        : null,
    thumbnail:
      _0x3938be === 'complete'
        ? resolveTaskCenterThumbnail(_0x5a18b6, _0x2327ed?.['kind'] || _0x5aa403['taskType'])
        : null,
    createdAt: _0x20da8d['startedAt'],
    startedAt: _0x20da8d['startedAt'],
    finishedAt: _0x585e0e ? Date['now']() : 0x0,
  });
}
