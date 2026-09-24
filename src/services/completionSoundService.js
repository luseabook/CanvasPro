import { fetchUserSettingsFromServer } from '../../api/userSettingsApi.js';
import { t } from '../i18n/index.js';
export const BUILT_IN_COMPLETION_SOUND_PATH = 'assets/sounds/notify.mp3';
export const COMPLETION_SOUND_DEFAULTS = Object.freeze({
  enabled: true,
  notificationEnabled: true,
  volume: 0.7,
  builtInPath: BUILT_IN_COMPLETION_SOUND_PATH,
  selectedFilePath: BUILT_IN_COMPLETION_SOUND_PATH,
  updatedAt: 0,
});
let cachedSettings = null,
  hasReportedPlaybackFailure = false,
  audioFactory = (_0xbf6cd9) => new Audio(_0xbf6cd9);
function normalizeText(_0x68db9f) {
  return String(_0x68db9f || '').trim();
}
function clampVolume(_0x4ccc0b) {
  const _0xd0a909 = Number(_0x4ccc0b);
  if (!Number.isFinite(_0xd0a909)) return COMPLETION_SOUND_DEFAULTS.volume;
  return Math.max(0, Math.min(1, _0xd0a909));
}
export function normalizeCompletionSoundSettings(_0x25b611 = {}) {
  const _0x2dfbfb = _0x25b611 && typeof _0x25b611 === 'object' && !Array.isArray(_0x25b611) ? _0x25b611 : {},
    _0x373535 =
      normalizeText(_0x2dfbfb.selectedFilePath) ||
      normalizeText(_0x2dfbfb.customFilePath) ||
      normalizeText(_0x2dfbfb.builtInPath) ||
      BUILT_IN_COMPLETION_SOUND_PATH;
  return {
    enabled: _0x2dfbfb.enabled !== false,
    notificationEnabled: _0x2dfbfb.notificationEnabled !== false,
    volume: clampVolume(_0x2dfbfb.volume),
    builtInPath: normalizeText(_0x2dfbfb.builtInPath) || BUILT_IN_COMPLETION_SOUND_PATH,
    selectedFilePath: _0x373535,
    updatedAt: Number(_0x2dfbfb.updatedAt || 0) || 0,
  };
}
export function setCompletionSoundSettingsCache(_0x2bdd38) {
  return ((cachedSettings = normalizeCompletionSoundSettings(_0x2bdd38)), cachedSettings);
}
export function clearCompletionSoundSettingsCache() {
  ((cachedSettings = null), (hasReportedPlaybackFailure = false));
}
export async function loadCompletionSoundSettings({ force: force = false } = {}) {
  if (cachedSettings && !force) return cachedSettings;
  try {
    const _0x18f862 = await fetchUserSettingsFromServer();
    return setCompletionSoundSettingsCache(_0x18f862?.completionSound || {});
  } catch (_0xbf488f) {
    return (
      console.warn('[completionSound] load settings failed:', _0xbf488f),
      setCompletionSoundSettingsCache(COMPLETION_SOUND_DEFAULTS)
    );
  }
}
async function resolvePlaybackUrl(_0x2d3ec3) {
  const _0x59f749 = normalizeCompletionSoundSettings(_0x2d3ec3),
    _0x195465 = normalizeText(_0x59f749.selectedFilePath) || _0x59f749.builtInPath;
  if (!_0x195465) return '';
  if (!/^(?:[a-zA-Z]:[\\/]|\\\\|\/)/.test(_0x195465)) return _0x195465;
  const _0x4ff496 = globalThis.window?.electronAPI?.getLocalPreviewUrl;
  if (typeof _0x4ff496 !== 'function') return _0x195465;
  const _0x3eee9e = await _0x4ff496({ path: _0x195465, type: 'audio/mpeg' });
  return normalizeText(_0x3eee9e?.url || _0x3eee9e);
}
async function playNativeCompletionSound(_0x62a4c4) {
  const _0x2f0d16 = globalThis.window?.electronAPI?.notificationSound?.play;
  if (typeof _0x2f0d16 !== 'function') return { ok: false, skipped: 'unavailable' };
  const _0x37d6a2 = normalizeCompletionSoundSettings(_0x62a4c4),
    _0x1c44be = normalizeText(_0x37d6a2.selectedFilePath) || _0x37d6a2.builtInPath;
  if (!_0x1c44be) return { ok: false, skipped: 'missing-file' };
  const _0x1a4d6a = await _0x2f0d16({
    filePath: _0x1c44be,
    volume: _0x37d6a2.volume,
    reason: 'generation-success',
  });
  if (_0x1a4d6a?.success === false)
    return { ok: false, skipped: _0x1a4d6a.reason || 'native-failed', result: _0x1a4d6a };
  return { ok: true, native: true, result: _0x1a4d6a };
}
async function playResolvedSound(_0x32ac12) {
  const _0x1ae0e2 = normalizeCompletionSoundSettings(_0x32ac12);
  if (_0x1ae0e2.enabled === false) return { ok: false, skipped: 'disabled' };
  if (typeof audioFactory !== 'function') return { ok: false, skipped: 'no-audio-factory' };
  const _0x399737 = await resolvePlaybackUrl(_0x1ae0e2);
  if (!_0x399737) return { ok: false, skipped: 'missing-url' };
  const _0x32cfd4 = audioFactory(_0x399737);
  if (!_0x32cfd4) return { ok: false, skipped: 'missing-audio' };
  _0x32cfd4.volume = _0x1ae0e2.volume;
  try {
    const _0x946aed = _0x32cfd4.play?.();
    if (_0x946aed && typeof _0x946aed.then === 'function') await _0x946aed;
  } catch (_0x1e3b7d) {
    try {
      const _0x4f0f36 = await playNativeCompletionSound(_0x1ae0e2);
      if (_0x4f0f36.ok) return _0x4f0f36;
    } catch {}
    throw _0x1e3b7d;
  }
  return { ok: true, url: _0x399737 };
}
function reportPlaybackFailure(_0x7871cc) {
  console.warn('[completionSound] playback failed:', _0x7871cc);
  if (hasReportedPlaybackFailure) return;
  ((hasReportedPlaybackFailure = true),
    globalThis.window?.showToast?.(t('coreServices.completion.soundPlaybackFailed'), 'warn'));
}
export async function previewCompletionSound(_0x290d06 = null) {
  const _0x5ed14c =
    _0x290d06 == null ? await loadCompletionSoundSettings() : normalizeCompletionSoundSettings(_0x290d06);
  try {
    return await playResolvedSound(_0x5ed14c);
  } catch (_0x1907d8) {
    return (reportPlaybackFailure(_0x1907d8), { ok: false, error: _0x1907d8 });
  }
}
export function playCompletionSound(_0x169612 = 'generation-success') {
  void _0x169612;
  const _0x10c4cf = (async () => {
    const _0x13eeb7 = await loadCompletionSoundSettings();
    return await playResolvedSound(_0x13eeb7);
  })();
  return (_0x10c4cf.catch(reportPlaybackFailure), _0x10c4cf);
}
export const __completionSoundServiceForTest = {
  setAudioFactory(_0x2bbd9a) {
    audioFactory = _0x2bbd9a;
  },
  reset() {
    ((audioFactory = (_0x150898) => new Audio(_0x150898)), clearCompletionSoundSettingsCache());
  },
  resolvePlaybackUrl: resolvePlaybackUrl,
};
