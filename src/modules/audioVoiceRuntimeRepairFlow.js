import {
  isAudioVoiceLocalAsrRuntimeFailure,
  repairAudioVoiceLocalAsrRuntime,
} from './audioVoiceLocalAsrRuntime.js';
function errorMessage(_0x20d6bf, _0x580c65 = '') {
  return String(_0x20d6bf?.['message'] || _0x20d6bf || _0x580c65)['trim']() || _0x580c65;
}
export function getAudioVoiceAnalyzeErrorMessage(
  _0x513028,
  { getErrorMessage: _0xedf01c, text: _0x425db0, authErrorKeys: authErrorKeys = {} },
) {
  const _0x182d9c = _0xedf01c(_0x513028, _0x425db0('toasts.analysisFailed'));
  if (/invalid\s+x-api-key|x-api-key\s+invalid|api\s*key\s+invalid/i['test'](_0x182d9c))
    return _0x425db0(authErrorKeys['invalidKey'] || 'toasts.asrApiKeyInvalid');
  if (
    /(?:permission|denied|forbid|unauthor|not\s+authorized|no\s+access|无权限|未授权|鉴权)/i['test'](
      _0x182d9c,
    )
  )
    return _0x425db0(authErrorKeys['permissionDenied'] || 'toasts.asrPermissionDenied');
  return _0x182d9c;
}
export function createAudioVoiceInitialAnalysisProgress({ isLocal: _0x52995e, text: _0x9f6067 }) {
  return {
    stage: _0x52995e ? 'model-download' : 'model-prepare',
    progress: 0x0,
    message: _0x9f6067(_0x52995e ? 'progress.model-download' : 'progress.model-prepare'),
  };
}
export async function recoverAudioVoiceLocalAsrRuntime({
  error: _0x185e3f,
  repairAttempted: repairAttempted = ![],
  message: _0x58a7df,
  nodeId: _0x48430d,
  canCommit: _0x156761,
  confirmAction: _0x30a2bb,
  text: _0x5a45dd,
  analysisSession: _0x237b23,
  operation: _0x1851b1,
  progressTracker: _0x3439d4,
  windowObject: _0x17fc0b,
  setAnalysisState: _0x56e9e6,
  repair: repair = repairAudioVoiceLocalAsrRuntime,
}) {
  const _0x3153a9 = (_0x112465) => _0x17fc0b?.['showToast']?.(_0x112465, 'error');
  if (repairAttempted || !isAudioVoiceLocalAsrRuntimeFailure(_0x185e3f)) return (_0x3153a9(_0x58a7df), ![]);
  const _0x197327 = await _0x30a2bb({
    className: 'audio-voice-start-analyze-confirm',
    title: _0x5a45dd('runtimeRepair.title'),
    message: _0x5a45dd('runtimeRepair.message'),
    cancelLabel: _0x5a45dd('runtimeRepair.cancel'),
    confirmLabel: _0x5a45dd('runtimeRepair.confirm'),
  });
  if (!_0x156761()) return ![];
  if (!_0x197327) return (_0x3153a9(_0x58a7df), ![]);
  _0x56e9e6('analyzing', { stage: 'asr-runtime-check', progress: 0x0 });
  try {
    return (
      await repair({
        nodeId: _0x48430d,
        onTaskStarted: (_0x7e39e2) => {
          void _0x237b23['trackTask'](_0x1851b1, _0x7e39e2);
          if (_0x156761()) _0x3439d4['install'](_0x7e39e2);
        },
      }),
      _0x156761()
    );
  } catch (_0x25b50b) {
    if (!_0x156761()) return ![];
    return (
      _0x3439d4['clear'](),
      _0x56e9e6('error', null),
      _0x3153a9(
        _0x5a45dd('runtimeRepair.failed', {
          message: errorMessage(_0x25b50b, _0x5a45dd('toasts.analysisFailed')),
        }),
      ),
      ![]
    );
  }
}
