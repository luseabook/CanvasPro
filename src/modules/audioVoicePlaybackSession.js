import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
  isMediaElementPlaybackSource,
  normalizeMediaPlaybackSourceUrl,
} from '../services/desktopMediaBlobSource.js';
import { beginAudioPlayback, registerAudioPlaybackClient } from './audioPlaybackCoordinator.js';
const AUDIO_VOICE_PREVIEW_ACTIONS = new Set(['play-source', 'play-converted', 'play-history']);
let audioVoicePlaybackOwnerSequence = 0x0;
function normalizeAudioUrl(value) {
  return String(value || '')['trim']();
}
function getAudioCacheKey(item) {
  const audioUrl = normalizeAudioUrl(item);
  return audioUrl ? normalizeMediaPlaybackSourceUrl(audioUrl) || audioUrl : '';
}
export async function prepareAudioVoicePlaybackElement(
  enabled,
  key,
  {
    attachSource: attachSource = attachMediaElementPlaybackSource,
    isPlaybackSource: isPlaybackSource = isMediaElementPlaybackSource,
    preload: preload = 'auto',
    shouldAssign: shouldAssign,
  } = {},
) {
  const audioUrl2 = normalizeAudioUrl(key);
  if (!enabled || !audioUrl2) return '';
  const index = preload === 'metadata' ? 'metadata' : 'auto',
    result = String(enabled['__audioVoiceRequestedPreload'] || ''),
    preload2 = index === 'auto' || result === 'auto' ? 'auto' : 'metadata';
  enabled['__audioVoiceRequestedPreload'] = preload2;
  const data = String(enabled['preload'] || ''),
    isPlaybackSource2 = isPlaybackSource(enabled, audioUrl2);
  enabled['preload'] = preload2;
  if (typeof attachSource === 'function') {
    const options = { preload: preload2 };
    typeof shouldAssign === 'function' && (options['shouldAssign'] = shouldAssign);
    const attachSource2 = await attachSource(enabled, audioUrl2, options),
      target = enabled['__audioVoiceRequestedPreload'] === 'auto' ? 'auto' : preload2;
    return (
      attachSource2 &&
        isPlaybackSource(enabled, audioUrl2) &&
        target === 'auto' &&
        (enabled['preload'] !== 'auto' || (isPlaybackSource2 && preload2 === 'auto' && data !== 'auto')) &&
        ((enabled['preload'] = 'auto'), enabled['load']?.()),
      attachSource2
    );
  }
  if (typeof shouldAssign === 'function' && shouldAssign() !== !![]) return '';
  return ((enabled['src'] = audioUrl2), enabled['load']?.(), audioUrl2);
}
export function isAudioVoicePreviewControlTarget(el) {
  const source = String(
    el?.['closest']?.('[data-audio-voice-action]')?.['dataset']?.['audioVoiceAction'] || '',
  )['trim']();
  return AUDIO_VOICE_PREVIEW_ACTIONS['has'](source);
}
export function createAudioVoicePlaybackSession({
  windowObject: windowObject = globalThis['window'],
  documentObject: documentObject = globalThis['document'],
  createAudioElement: createAudioElement = () => {
    const run = windowObject?.['Audio'] || globalThis['Audio'];
    return typeof run === 'function' ? new run() : null;
  },
  attachSource: attachSource = attachMediaElementPlaybackSource,
  clearPlaybackMetadata: clearPlaybackMetadata = clearDesktopMediaPlaybackSourceMetadata,
  isPlaybackSource: isPlaybackSource = isMediaElementPlaybackSource,
  isPreviewControlTarget: isPreviewControlTarget = isAudioVoicePreviewControlTarget,
  beginPlayback: beginPlayback = beginAudioPlayback,
  registerPlaybackClient: registerPlaybackClient = registerAudioPlaybackClient,
  ownerId: ownerId = 'audio-voice-preview:' + ++audioVoicePlaybackOwnerSequence,
  maxCachedAudioElements: maxCachedAudioElements = 0x10,
} = {}) {
  const map = new Map(),
    next = Math['max'](0x1, Number(maxCachedAudioElements) || 0x10);
  let el2 = null,
    current = '',
    enabled2 = null,
    enabled3 = null,
    entry = 0x0,
    record = 0x0,
    enabled4 = ![];
  const registerPlaybackClient2 = registerPlaybackClient(ownerId, { stopForExternalPlayback: () => clear() });
  function run2(enabled5) {
    if (!enabled5) return;
    try {
      enabled5['pause']?.();
    } catch {}
    try {
      (enabled5['removeAttribute']?.('src'),
        clearPlaybackMetadata(enabled5),
        delete enabled5['__audioVoiceRequestedPreload'],
        (enabled5['preload'] = 'none'),
        enabled5['load']?.());
    } catch {}
  }
  function run3() {
    if (!el2 || !enabled2) {
      enabled2 = null;
      return;
    }
    (el2['removeEventListener']?.('ended', enabled2),
      el2['removeEventListener']?.('error', enabled2),
      (enabled2 = null));
  }
  function run4(el3) {
    run3();
    if (!el3?.['addEventListener']) return;
    ((enabled2 = () => {
      if (el2 !== el3) return;
      (run3(), (el2 = null), (current = ''), run5());
    }),
      el3['addEventListener']('ended', enabled2),
      el3['addEventListener']('error', enabled2));
  }
  function run6(payload, handle) {
    if (map['get'](payload) !== handle) return;
    (map['delete'](payload), (record += 0x1), run2(handle));
  }
  function run7() {
    while (map['size'] > next) {
      const enabled6 = [...map['entries']()]['find'](([, state]) => state !== el2);
      if (!enabled6) return;
      const [config, scope] = enabled6;
      run6(config, scope);
    }
  }
  function run8(input) {
    const audioUrl3 = normalizeAudioUrl(input);
    if (!audioUrl3 || enabled4) return null;
    const audioCacheKey = getAudioCacheKey(audioUrl3),
      output = map['get'](audioCacheKey);
    if (output) return (map['delete'](audioCacheKey), map['set'](audioCacheKey, output), output);
    const audioElement = createAudioElement(audioUrl3);
    if (!audioElement) return null;
    return (
      (audioElement['preload'] = 'auto'),
      map['set'](audioCacheKey, audioElement),
      run7(),
      audioElement
    );
  }
  function run5() {
    if (!enabled3) return;
    (documentObject?.['removeEventListener']?.('pointerdown', enabled3, !![]), (enabled3 = null));
  }
  function run9() {
    const enabled7 = el2;
    (run3(), (el2 = null), (current = ''));
    if (!enabled7) return;
    try {
      enabled7['pause']?.();
    } catch {}
  }
  function stop() {
    ((entry += 0x1), run9(), run5());
  }
  function run10() {
    if (enabled3) return;
    ((enabled3 = (event) => {
      if (isPreviewControlTarget(event['target'])) return;
      stop();
    }),
      documentObject?.['addEventListener']?.('pointerdown', enabled3, !![]));
  }
  async function warm(value2) {
    const status = normalizeAudioUrl(value2),
      audioCacheKey2 = getAudioCacheKey(status),
      audioEl = run8(status);
    if (!audioEl) return { status: status ? 'unavailable' : 'missing' };
    const value3 = record,
      shouldAssign2 = () => !enabled4 && value3 === record && map['get'](audioCacheKey2) === audioEl;
    try {
      const status2 = await prepareAudioVoicePlaybackElement(audioEl, status, {
        attachSource: attachSource,
        isPlaybackSource: isPlaybackSource,
        preload: 'auto',
        shouldAssign: shouldAssign2,
      });
      return { status: status2 && shouldAssign2() ? 'ready' : 'unavailable', audioEl: audioEl };
    } catch {
      return { status: 'failed', audioEl: audioEl };
    }
  }
  async function warmMany(list = [], { limit: limit = 0x4 } = {}) {
    const list2 = [
      ...new Set((Array['isArray'](list) ? list : [])['map'](normalizeAudioUrl)['filter'](Boolean)),
    ]['slice'](0x0, Math['max'](0x0, Number(limit) || 0x0));
    return await Promise['all'](list2['map'](warm));
  }
  async function play(value4) {
    const audioUrl4 = normalizeAudioUrl(value4);
    if (!audioUrl4) return { status: 'missing' };
    const audioCacheKey3 = getAudioCacheKey(audioUrl4);
    if (el2 && current !== audioCacheKey3) run9();
    const audioEl2 = run8(audioUrl4);
    if (!audioEl2) return { status: 'unavailable' };
    const value5 = ++entry;
    ((el2 = audioEl2), (current = audioCacheKey3));
    const shouldAssign3 = () => !enabled4 && value5 === entry && el2 === audioEl2;
    beginPlayback(ownerId);
    try {
      const prepareAudioVoicePlaybackElement2 = await prepareAudioVoicePlaybackElement(audioEl2, audioUrl4, {
        attachSource: attachSource,
        isPlaybackSource: isPlaybackSource,
        preload: 'auto',
        shouldAssign: shouldAssign3,
      });
      if (!prepareAudioVoicePlaybackElement2 || !shouldAssign3())
        return { status: 'stale', audioEl: audioEl2 };
      try {
        (Number['isFinite'](audioEl2['duration']) || audioEl2['currentTime'] > 0x0) &&
          (audioEl2['currentTime'] = 0x0);
      } catch {}
      (run10(), run4(audioEl2));
      const promise = audioEl2['play']?.();
      promise && typeof promise['then'] === 'function' && (await promise);
      if (!shouldAssign3()) {
        try {
          audioEl2['pause']?.();
        } catch {}
        return { status: 'stale', audioEl: audioEl2 };
      }
      return { status: 'playing', audioEl: audioEl2 };
    } catch (error) {
      if (!shouldAssign3()) return { status: 'stale', audioEl: audioEl2 };
      return (stop(), run6(audioCacheKey3, audioEl2), { status: 'failed', audioEl: audioEl2, error: error });
    }
  }
  function clear() {
    ((record += 0x1),
      stop(),
      map['forEach']((value6) => {
        run2(value6);
      }),
      map['clear']());
  }
  function destroy() {
    if (enabled4) return;
    (clear(), registerPlaybackClient2?.(), (enabled4 = !![]));
  }
  return {
    clear: clear,
    destroy: destroy,
    play: play,
    stop: stop,
    warm: warm,
    warmMany: warmMany,
    getCacheSize: () => map['size'],
  };
}
