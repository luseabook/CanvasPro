import { emitGenerationTaskCenterUpdate } from '../modules/generationTaskCenterEvents.js';
import { getModelManifest } from '../manifests/index.js';
import { getProviderConfig } from '../../api/configApi.js';
import { translateManifestText } from '../i18n/manifestText.js';
import { resolveTaskCenterThumbnail } from '../modules/taskCenterThumbnail.js';
const storeIds = new WeakMap();
let storeSequence = 0;
export function reportRuntimeTask(taskId, message = {}) {
  if (!taskId) return;
  const provider = taskId['spec'] || {},
    title = taskId['getTaskNode']?.() || {},
    kind = getModelManifest(provider['modelId']);
  taskId['taskCenterProviderProfileId'] ??=
    provider['providerProfileId'] ||
    provider['payload']?.['providerProfileId'] ||
    provider['payload']?.['rhProviderProfileId'] ||
    getProviderConfig(provider['provider'])?.['providerProfileId'] ||
    '';
  const status = {
    queued: 'waiting',
    running: 'processing',
    pending: 'processing',
    paused: 'waiting',
    success: 'complete',
    failed: 'failed',
    cancelled: 'cancelled',
  }[message['status']];
  if (!status) return;
  if (taskId['store'] && !storeIds['has'](taskId['store']))
    storeIds['set'](taskId['store'], 'store-' + ++storeSequence);
  taskId['taskCenterTaskId'] ||=
    'generation:' +
    (taskId['taskScopeId'] || storeIds['get'](taskId['store']) || taskId['projectId']) +
    ':' +
    taskId['targetNodeId'] +
    ':' +
    taskId['startedAt'];
  const progress = ['complete', 'failed', 'cancelled']['includes'](status);
  emitGenerationTaskCenterUpdate({
    taskId: taskId['taskCenterTaskId'],
    source: 'generation',
    nodeId: taskId['targetNodeId'],
    kind: kind?.['kind'] || provider['taskType'],
    title:
      title['name'] || title['title'] || translateManifestText(kind?.['displayName']) || provider['modelId'],
    provider: provider['provider'],
    modelId: provider['modelId'],
    adapterType: provider['adapterType'],
    providerProfileId: taskId['taskCenterProviderProfileId'],
    projectId: taskId['projectId'],
    canvasId: taskId['taskScopeId'],
    navigation: {
      source: 'canvas',
      projectId: taskId['projectId'],
      canvasId: taskId['taskScopeId'],
      nodeId: taskId['targetNodeId'],
    },
    status: status,
    progress: progress && status === 'complete' ? 1 : null,
    message:
      message['message'] ||
      (message['status'] === 'paused'
        ? '等待恢复'
        : String(title['statusMessage'] || title['rhStatusMessage'] || '')),
    error:
      status === 'failed'
        ? String(title['jobError'] || title['asyncTaskError'] || title['rhTaskError'] || '')
        : '',
    remoteTaskId: taskId['taskId'],
    cancellable: !progress && message['status'] !== 'paused' && provider['cancellable'] === true,
    result:
      status === 'complete'
        ? {
            localPath: title['localPath'],
            images: title['images'],
            videos: title['videos'],
            audios: title['audios'],
          }
        : null,
    thumbnail:
      status === 'complete'
        ? resolveTaskCenterThumbnail(title, kind?.['kind'] || provider['taskType'])
        : null,
    createdAt: taskId['startedAt'],
    startedAt: taskId['startedAt'],
    finishedAt: progress ? Date['now']() : 0,
  });
}
