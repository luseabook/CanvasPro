import { enqueueElectronMediaTask, waitForElectronMediaTask } from '../../api/localMediaTaskApi.js';
import { fetchUserSettingsFromServer } from '../../api/userSettingsApi.js';
import { desktopBridge } from '../services/desktopBridge.js';
export const AUDIO_VOICE_ASR_RUNTIME_INSTALL_TIMEOUT_MS = 0x5a * 0x3c * 0x3e8;
function normalizeEngine(_0xc56d6e) {
  return String(_0xc56d6e || '')
    ['trim']()
    ['toLowerCase']() === 'gpu'
    ? 'gpu'
    : 'cpu';
}
const AUDIO_VOICE_LOCAL_ASR_RUNTIME_FAILURE_PATTERN =
  /python runtime is unavailable|asr python runtime is unavailable|funasr runtime is not bundled|nvidia nemo is not installed|sortformer runtime is unavailable|no module named|modulenotfounderror|importerror|dll load failed|cannot import name|specified module could not be found/i;
function clampProgress(_0x201357) {
  const _0x338428 = Number(_0x201357);
  return Number['isFinite'](_0x338428) ? Math['max'](0x0, Math['min'](0x1, _0x338428)) : 0x0;
}
export function createAudioVoiceTaskProgressTracker({
  getMediaTask: getMediaTask = () => desktopBridge['mediaTask'],
  onProgress: onProgress = () => {},
} = {}) {
  let _0x3cf4e1 = '',
    _0x5225ca = null;
  const _0x14ed18 = () => {
    (_0x5225ca?.(), (_0x5225ca = null), (_0x3cf4e1 = ''));
  };
  return {
    clear: _0x14ed18,
    install(_0x3ffd86, { progressOffset: progressOffset = 0x0, progressScale: progressScale = 0x1 } = {}) {
      _0x14ed18();
      const _0x2a729c = String(_0x3ffd86 || '')['trim'](),
        _0x3da5b5 = getMediaTask()?.['onUpdate'];
      if (!_0x2a729c || typeof _0x3da5b5 !== 'function') return;
      ((_0x3cf4e1 = _0x2a729c),
        (_0x5225ca = _0x3da5b5((_0x250575) => {
          if (String(_0x250575?.['taskId'] || '') !== _0x3cf4e1) return;
          onProgress({
            stage: _0x250575?.['stage'],
            progress:
              clampProgress(progressOffset) +
              clampProgress(_0x250575?.['progress']) * clampProgress(progressScale),
            message: _0x250575?.['message'],
          });
        })));
    },
  };
}
export async function ensureAudioVoiceLocalAsrRuntime({
  engine: engine = 'cpu',
  enqueueTask: enqueueTask = enqueueElectronMediaTask,
  forceRepair: forceRepair = ![],
  nodeId: nodeId = '',
  onTaskStarted: onTaskStarted = () => {},
  timeout: timeout = AUDIO_VOICE_ASR_RUNTIME_INSTALL_TIMEOUT_MS,
  waitForTask: waitForTask = waitForElectronMediaTask,
} = {}) {
  const _0x46755f = normalizeEngine(engine),
    _0x37036c = { engine: _0x46755f };
  if (forceRepair === !![]) _0x37036c['forceRepair'] = !![];
  const _0x5dd9ce = await enqueueTask({ kind: 'asrRuntimeInstall', nodeId: nodeId, args: _0x37036c }),
    _0x3944f2 = String(_0x5dd9ce?.['taskId'] || '')['trim']();
  if (!_0x3944f2) throw new Error('Subtitle recognition runtime task did not return a task ID');
  return (
    onTaskStarted(_0x3944f2),
    await waitForTask(_0x3944f2, {
      timeout: timeout,
      diagnosticPayload: { kind: 'asrRuntimeInstall', nodeId: nodeId },
    })
  );
}
export function isAudioVoiceLocalAsrRuntimeFailure(_0x454a04) {
  const _0x233bf = String(_0x454a04?.['message'] || _0x454a04 || '')['trim']();
  return AUDIO_VOICE_LOCAL_ASR_RUNTIME_FAILURE_PATTERN['test'](_0x233bf);
}
export async function repairAudioVoiceLocalAsrRuntime({
  ensureRuntime: ensureRuntime = ensureAudioVoiceLocalAsrRuntime,
  fetchSettings: fetchSettings = fetchUserSettingsFromServer,
  nodeId: nodeId = '',
  onTaskStarted: onTaskStarted = () => {},
} = {}) {
  const _0x5e9d78 = await fetchSettings()['catch'](() => ({})),
    _0x41de4d = normalizeEngine(_0x5e9d78?.['subtitleRecognition']?.['engine']);
  return await ensureRuntime({
    engine: _0x41de4d,
    forceRepair: !![],
    nodeId: nodeId,
    onTaskStarted: onTaskStarted,
  });
}
export async function prepareAudioVoiceLocalAsr({
  ensureRuntime: ensureRuntime = ensureAudioVoiceLocalAsrRuntime,
  fetchSettings: fetchSettings = fetchUserSettingsFromServer,
  nodeId: nodeId = '',
  onTaskStarted: onTaskStarted = () => {},
} = {}) {
  const _0x2d307c = await fetchSettings()['catch'](() => ({})),
    _0x164212 = normalizeEngine(_0x2d307c?.['subtitleRecognition']?.['engine']);
  return (
    await ensureRuntime({ engine: _0x164212, nodeId: nodeId, onTaskStarted: onTaskStarted }),
    { diarizationProvider: 'sortformer', downloadModelIfMissing: !![], engine: _0x164212 }
  );
}
