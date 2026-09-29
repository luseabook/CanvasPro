import { AUDIO_VOICE_PANEL_OPEN_EVENT } from '../../../modules/audioVoicePanelEvents.js';
export function bindAudioVoiceStudioAction({
  button: _0x1b0baf,
  getNodeId: _0x2f1cc6,
  windowRef: windowRef = globalThis['window'],
} = {}) {
  if (!_0x1b0baf) return () => {};
  const _0x433415 = (_0x3912a6) => {
    (_0x3912a6?.['preventDefault']?.(), _0x3912a6?.['stopPropagation']?.());
    const _0x218062 = String(typeof _0x2f1cc6 === 'function' ? _0x2f1cc6() : '')['trim']();
    if (!_0x218062 || typeof windowRef?.['dispatchEvent'] !== 'function') return;
    const _0x2c56c9 = { sourceNodeId: _0x218062 },
      _0x51b661 =
        typeof globalThis['CustomEvent'] === 'function'
          ? new globalThis['CustomEvent'](AUDIO_VOICE_PANEL_OPEN_EVENT, { detail: _0x2c56c9 })
          : { type: AUDIO_VOICE_PANEL_OPEN_EVENT, detail: _0x2c56c9 };
    windowRef['dispatchEvent'](_0x51b661);
  };
  return (
    _0x1b0baf['addEventListener']('click', _0x433415),
    () => _0x1b0baf['removeEventListener']('click', _0x433415)
  );
}
