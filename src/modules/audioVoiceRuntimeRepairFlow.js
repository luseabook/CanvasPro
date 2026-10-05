import {
  isAudioVoiceLocalAsrRuntimeFailure,
  repairAudioVoiceLocalAsrRuntime,
} from './audioVoiceLocalAsrRuntime.js';
function errorMessage(error, value = '') {
  return String(error?.['message'] || error || value)['trim']() || value;
}
export function getAudioVoiceAnalyzeErrorMessage(
  item,
  { getErrorMessage: getErrorMessage, text: text, authErrorKeys: authErrorKeys = {} },
) {
  const key = getErrorMessage(item, text('toasts.analysisFailed'));
  if (/invalid\s+x-api-key|x-api-key\s+invalid|api\s*key\s+invalid/i['test'](key))
    return text(authErrorKeys['invalidKey'] || 'toasts.asrApiKeyInvalid');
  if (/(?:permission|denied|forbid|unauthor|not\s+authorized|no\s+access|无权限|未授权|鉴权)/i['test'](key))
    return text(authErrorKeys['permissionDenied'] || 'toasts.asrPermissionDenied');
  return key;
}
export function createAudioVoiceInitialAnalysisProgress({ isLocal: isLocal, text: text2 }) {
  return {
    stage: isLocal ? 'model-download' : 'model-prepare',
    progress: 0,
    message: text2(isLocal ? 'progress.model-download' : 'progress.model-prepare'),
  };
}
export async function recoverAudioVoiceLocalAsrRuntime({
  error: error2,
  repairAttempted: repairAttempted = ![],
  message: message,
  nodeId: nodeId,
  canCommit: canCommit,
  confirmAction: confirmAction,
  text: text3,
  analysisSession: analysisSession,
  operation: operation,
  progressTracker: progressTracker,
  windowObject: windowObject,
  setAnalysisState: setAnalysisState,
  repair: repair = repairAudioVoiceLocalAsrRuntime,
}) {
  const run = (index) => windowObject?.['showToast']?.(index, 'error');
  if (repairAttempted || !isAudioVoiceLocalAsrRuntimeFailure(error2)) return (run(message), ![]);
  const enabled = await confirmAction({
    className: 'audio-voice-start-analyze-confirm',
    title: text3('runtimeRepair.title'),
    message: text3('runtimeRepair.message'),
    cancelLabel: text3('runtimeRepair.cancel'),
    confirmLabel: text3('runtimeRepair.confirm'),
  });
  if (!canCommit()) return ![];
  if (!enabled) return (run(message), ![]);
  setAnalysisState('analyzing', { stage: 'asr-runtime-check', progress: 0 });
  try {
    return (
      await repair({
        nodeId: nodeId,
        onTaskStarted: (result) => {
          void analysisSession['trackTask'](operation, result);
          if (canCommit()) progressTracker['install'](result);
        },
      }),
      canCommit()
    );
  } catch (data) {
    if (!canCommit()) return ![];
    return (
      progressTracker['clear'](),
      setAnalysisState('error', null),
      run(
        text3('runtimeRepair.failed', {
          message: errorMessage(data, text3('toasts.analysisFailed')),
        }),
      ),
      ![]
    );
  }
}
