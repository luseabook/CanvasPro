import { desktopBridge } from '../services/desktopBridge.js';
import { openExternalLink } from '../services/externalLinkService.js';
import { dispatchCompletionClick } from '../services/completionNotificationService.js';
import { getProviderTaskConsoleUrl } from '../config/providerTaskConsole.js';
import { cancelDreaminaVideoQueueTask } from '../../api/dreaminaGenApi.js';
import { ACTIVE_TASK_STATUSES } from './taskCenterModel.js';
export async function executeTaskCenterAction(_0x3b597b, _0x389d70, _0xf931cb, _0x274b39, _0x3849b9) {
  if (_0x389d70 === 'locate') {
    if (_0xf931cb?.['navigation']) dispatchCompletionClick(_0xf931cb['navigation']);
    return;
  }
  if (_0x389d70 === 'api-console') {
    const _0x388ba4 = getProviderTaskConsoleUrl(_0xf931cb);
    if (_0x388ba4) {
      const _0x47c671 = await openExternalLink(_0x388ba4, { label: _0x3849b9('actions.apiConsole') });
      if (_0x47c671?.['ok'] === ![] || _0x47c671?.['success'] === ![])
        throw new Error(_0x47c671['error'] || _0x3849b9('actionFailed'));
    }
    return;
  }
  if (_0x389d70 === 'reveal') {
    if (_0x274b39 && desktopBridge['shell']['canShowItemInFolder']())
      await desktopBridge['shell']['showItemInFolder']({ localPath: _0x274b39 });
    return;
  }
  if (_0x389d70 === 'copy-error' || _0x389d70 === 'copy-task-id') {
    const _0x50886c = _0x389d70 === 'copy-error' ? _0xf931cb?.['error'] : _0xf931cb?.['remoteTaskId'];
    if (!_0x50886c) return;
    if (desktopBridge['clipboard']['canUseText']())
      await desktopBridge['clipboard']['writeText']({ text: _0x50886c });
    else {
      if (globalThis['navigator']?.['clipboard']?.['writeText'])
        await navigator['clipboard']['writeText'](_0x50886c);
      else throw new Error(_0x3849b9('copyFailed'));
    }
    globalThis['window']?.['showToast']?.(
      _0x3849b9(_0x389d70 === 'copy-error' ? 'copySuccess' : 'copyTaskIdSuccess'),
      'success',
    );
    return;
  }
  if (
    _0x389d70 !== 'cancel' ||
    !_0xf931cb?.['cancellable'] ||
    !ACTIVE_TASK_STATUSES['has'](_0xf931cb['status'])
  )
    return;
  let _0x3eb088;
  if (_0xf931cb['source'] === 'generation' && _0xf931cb['kind'] === 'dreaminaVideo')
    _0x3eb088 = await cancelDreaminaVideoQueueTask(_0xf931cb['taskId']);
  else
    _0xf931cb['source'] === 'generation'
      ? (_0x3eb088 = await _0x3b597b['generationCancelTask'](_0xf931cb['nodeId'], {
          store: _0x3b597b['generationStore'],
          taskCenterTaskId: _0xf931cb['taskId'],
          cancellable: !![],
          abortLocal: !![],
          taskId: _0xf931cb['remoteTaskId'],
        }))
      : (_0x3eb088 = await desktopBridge['mediaTask']['cancel']({ taskId: _0xf931cb['taskId'] }));
  if (_0x3eb088?.['ok'] === ![] || _0x3eb088?.['success'] === ![])
    throw new Error(_0x3eb088['reason'] || _0x3849b9('cancelFailed'));
  globalThis['window']?.['showToast']?.(_0x3849b9('cancelledMessage'), 'ok');
  const _0x3cf6b0 = _0x3b597b['tasks']['get'](_0xf931cb['taskId']);
  if (_0x3cf6b0 && ACTIVE_TASK_STATUSES['has'](_0x3cf6b0['status']))
    _0x3b597b['upsertTask']({
      ..._0x3cf6b0,
      status: 'cancelled',
      progress: null,
      error: '',
      message: _0x3849b9('cancelledMessage'),
      finishedAt: Date['now'](),
    });
}
