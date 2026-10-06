import { AUDIO_VOICE_PANEL_OPEN_EVENT } from '../../../modules/audioVoicePanelEvents.js';
export function bindAudioVoiceStudioAction({
  button: button,
  getNodeId: getNodeId,
  windowRef: windowRef = globalThis.window,
} = {}) {
  if (!button) return () => {};
  const value = (event) => {
    (event?.preventDefault?.(), event?.stopPropagation?.());
    const sourceNodeId = String(typeof getNodeId === 'function' ? getNodeId() : '').trim();
    if (!sourceNodeId || typeof windowRef?.dispatchEvent !== 'function') return;
    const detail = { sourceNodeId: sourceNodeId },
      item =
        typeof globalThis.CustomEvent === 'function'
          ? new globalThis.CustomEvent(AUDIO_VOICE_PANEL_OPEN_EVENT, { detail: detail })
          : { type: AUDIO_VOICE_PANEL_OPEN_EVENT, detail: detail };
    windowRef.dispatchEvent(item);
  };
  return (button.addEventListener('click', value), () => button.removeEventListener('click', value));
}
