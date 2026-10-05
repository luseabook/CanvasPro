import { desktopBridge } from '../services/desktopBridge.js';
import { openExternalLink } from '../services/externalLinkService.js';
import { dispatchCompletionClick } from '../services/completionNotificationService.js';
import { getProviderTaskConsoleUrl } from '../config/providerTaskConsole.js';
import { cancelDreaminaVideoQueueTask } from '../../api/dreaminaGenApi.js';
import { ACTIVE_TASK_STATUSES } from './taskCenterModel.js';
export async function executeTaskCenterAction(store, value, taskCenterTaskId, localPath, label) {
  if (value === 'locate') {
    if (taskCenterTaskId?.['navigation']) dispatchCompletionClick(taskCenterTaskId['navigation']);
    return;
  }
  if (value === 'api-console') {
    const providerTaskConsoleUrl = getProviderTaskConsoleUrl(taskCenterTaskId);
    if (providerTaskConsoleUrl) {
      const response = await openExternalLink(providerTaskConsoleUrl, { label: label('actions.apiConsole') });
      if (response?.['ok'] === false || response?.['success'] === false)
        throw new Error(response['error'] || label('actionFailed'));
    }
    return;
  }
  if (value === 'reveal') {
    if (localPath && desktopBridge['shell']['canShowItemInFolder']())
      await desktopBridge['shell']['showItemInFolder']({ localPath: localPath });
    return;
  }
  if (value === 'copy-error' || value === 'copy-task-id') {
    const text = value === 'copy-error' ? taskCenterTaskId?.['error'] : taskCenterTaskId?.['remoteTaskId'];
    if (!text) return;
    if (desktopBridge['clipboard']['canUseText']())
      await desktopBridge['clipboard']['writeText']({ text: text });
    else {
      if (globalThis['navigator']?.['clipboard']?.['writeText'])
        await navigator['clipboard']['writeText'](text);
      else throw new Error(label('copyFailed'));
    }
    globalThis['window']?.['showToast']?.(
      label(value === 'copy-error' ? 'copySuccess' : 'copyTaskIdSuccess'),
      'success',
    );
    return;
  }
  if (
    value !== 'cancel' ||
    !taskCenterTaskId?.['cancellable'] ||
    !ACTIVE_TASK_STATUSES['has'](taskCenterTaskId['status'])
  )
    return;
  let response2;
  if (taskCenterTaskId['source'] === 'generation' && taskCenterTaskId['kind'] === 'dreaminaVideo')
    response2 = await cancelDreaminaVideoQueueTask(taskCenterTaskId['taskId']);
  else
    taskCenterTaskId['source'] === 'generation'
      ? (response2 = await store['generationCancelTask'](taskCenterTaskId['nodeId'], {
          store: store['generationStore'],
          taskCenterTaskId: taskCenterTaskId['taskId'],
          cancellable: true,
          abortLocal: true,
          taskId: taskCenterTaskId['remoteTaskId'],
        }))
      : (response2 = await desktopBridge['mediaTask']['cancel']({ taskId: taskCenterTaskId['taskId'] }));
  if (response2?.['ok'] === false || response2?.['success'] === false)
    throw new Error(response2['reason'] || label('cancelFailed'));
  globalThis['window']?.['showToast']?.(label('cancelledMessage'), 'ok');
  const response3 = store['tasks']['get'](taskCenterTaskId['taskId']);
  if (response3 && ACTIVE_TASK_STATUSES['has'](response3['status']))
    store['upsertTask']({
      ...response3,
      status: 'cancelled',
      progress: null,
      error: '',
      message: label('cancelledMessage'),
      finishedAt: Date['now'](),
    });
}
