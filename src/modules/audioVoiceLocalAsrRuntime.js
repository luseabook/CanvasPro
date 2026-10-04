import { enqueueElectronMediaTask, waitForElectronMediaTask } from '../../api/localMediaTaskApi.js';
import { fetchUserSettingsFromServer } from '../../api/userSettingsApi.js';
import { desktopBridge } from '../services/desktopBridge.js';
export const AUDIO_VOICE_ASR_RUNTIME_INSTALL_TIMEOUT_MS = 0x5a * 0x3c * 0x3e8;
function normalizeEngine(value) {
  return String(value || '')
    ['trim']()
    ['toLowerCase']() === 'gpu'
    ? 'gpu'
    : 'cpu';
}
const AUDIO_VOICE_LOCAL_ASR_RUNTIME_FAILURE_PATTERN =
  /python runtime is unavailable|asr python runtime is unavailable|funasr runtime is not bundled|nvidia nemo is not installed|sortformer runtime is unavailable|no module named|modulenotfounderror|importerror|dll load failed|cannot import name|specified module could not be found/i;
function clampProgress(item) {
  const key = Number(item);
  return Number['isFinite'](key) ? Math['max'](0x0, Math['min'](0x1, key)) : 0x0;
}
export function createAudioVoiceTaskProgressTracker({
  getMediaTask: getMediaTask = () => desktopBridge['mediaTask'],
  onProgress: onProgress = () => {},
} = {}) {
  let index = '',
    value2 = null;
  const clear = () => {
    (value2?.(), (value2 = null), (index = ''));
  };
  return {
    clear: clear,
    install(result, { progressOffset: progressOffset = 0x0, progressScale: progressScale = 0x1 } = {}) {
      clear();
      const enabled = String(result || '')['trim'](),
        handler = getMediaTask()?.['onUpdate'];
      if (!enabled || typeof handler !== 'function') return;
      ((index = enabled),
        (value2 = handler((stage) => {
          if (String(stage?.['taskId'] || '') !== index) return;
          onProgress({
            stage: stage?.['stage'],
            progress:
              clampProgress(progressOffset) +
              clampProgress(stage?.['progress']) * clampProgress(progressScale),
            message: stage?.['message'],
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
  const engine2 = normalizeEngine(engine),
    args = { engine: engine2 };
  if (forceRepair === !![]) args['forceRepair'] = !![];
  const enqueueTask2 = await enqueueTask({ kind: 'asrRuntimeInstall', nodeId: nodeId, args: args }),
    enabled2 = String(enqueueTask2?.['taskId'] || '')['trim']();
  if (!enabled2) throw new Error('Subtitle recognition runtime task did not return a task ID');
  return (
    onTaskStarted(enabled2),
    await waitForTask(enabled2, {
      timeout: timeout,
      diagnosticPayload: { kind: 'asrRuntimeInstall', nodeId: nodeId },
    })
  );
}
export function isAudioVoiceLocalAsrRuntimeFailure(error) {
  const data = String(error?.['message'] || error || '')['trim']();
  return AUDIO_VOICE_LOCAL_ASR_RUNTIME_FAILURE_PATTERN['test'](data);
}
export async function repairAudioVoiceLocalAsrRuntime({
  ensureRuntime: ensureRuntime = ensureAudioVoiceLocalAsrRuntime,
  fetchSettings: fetchSettings = fetchUserSettingsFromServer,
  nodeId: nodeId = '',
  onTaskStarted: onTaskStarted = () => {},
} = {}) {
  const fetchSettings2 = await fetchSettings()['catch'](() => ({})),
    engine3 = normalizeEngine(fetchSettings2?.['subtitleRecognition']?.['engine']);
  return await ensureRuntime({
    engine: engine3,
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
  const fetchSettings3 = await fetchSettings()['catch'](() => ({})),
    engine4 = normalizeEngine(fetchSettings3?.['subtitleRecognition']?.['engine']);
  return (
    await ensureRuntime({ engine: engine4, nodeId: nodeId, onTaskStarted: onTaskStarted }),
    { diarizationProvider: 'sortformer', downloadModelIfMissing: !![], engine: engine4 }
  );
}
