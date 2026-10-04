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
  audioFactory = (value) => new Audio(value);
function normalizeText(item) {
  return String(item || '').trim();
}
function clampVolume(key) {
  const index = Number(key);
  if (!Number.isFinite(index)) return COMPLETION_SOUND_DEFAULTS.volume;
  return Math.max(0, Math.min(1, index));
}
export function normalizeCompletionSoundSettings(options = {}) {
  const enabled = options && typeof options === 'object' && !Array.isArray(options) ? options : {},
    selectedFilePath =
      normalizeText(enabled.selectedFilePath) ||
      normalizeText(enabled.customFilePath) ||
      normalizeText(enabled.builtInPath) ||
      BUILT_IN_COMPLETION_SOUND_PATH;
  return {
    enabled: enabled.enabled !== false,
    notificationEnabled: enabled.notificationEnabled !== false,
    volume: clampVolume(enabled.volume),
    builtInPath: normalizeText(enabled.builtInPath) || BUILT_IN_COMPLETION_SOUND_PATH,
    selectedFilePath: selectedFilePath,
    updatedAt: Number(enabled.updatedAt || 0) || 0,
  };
}
export function setCompletionSoundSettingsCache(result) {
  return ((cachedSettings = normalizeCompletionSoundSettings(result)), cachedSettings);
}
export function clearCompletionSoundSettingsCache() {
  ((cachedSettings = null), (hasReportedPlaybackFailure = false));
}
export async function loadCompletionSoundSettings({ force: force = false } = {}) {
  if (cachedSettings && !force) return cachedSettings;
  try {
    const fetchUserSettingsFromServer2 = await fetchUserSettingsFromServer();
    return setCompletionSoundSettingsCache(fetchUserSettingsFromServer2?.completionSound || {});
  } catch (data) {
    return (
      console.warn('[completionSound] load settings failed:', data),
      setCompletionSoundSettingsCache(COMPLETION_SOUND_DEFAULTS)
    );
  }
}
async function resolvePlaybackUrl(target) {
  const completionSoundSettings = normalizeCompletionSoundSettings(target),
    path = normalizeText(completionSoundSettings.selectedFilePath) || completionSoundSettings.builtInPath;
  if (!path) return '';
  if (!/^(?:[a-zA-Z]:[\\/]|\\\\|\/)/.test(path)) return path;
  const run = globalThis.window?.electronAPI?.getLocalPreviewUrl;
  if (typeof run !== 'function') return path;
  const response = await run({ path: path, type: 'audio/mpeg' });
  return normalizeText(response?.url || response);
}
async function playNativeCompletionSound(source) {
  const run2 = globalThis.window?.electronAPI?.notificationSound?.play;
  if (typeof run2 !== 'function') return { ok: false, skipped: 'unavailable' };
  const volume = normalizeCompletionSoundSettings(source),
    filePath = normalizeText(volume.selectedFilePath) || volume.builtInPath;
  if (!filePath) return { ok: false, skipped: 'missing-file' };
  const skipped = await run2({
    filePath: filePath,
    volume: volume.volume,
    reason: 'generation-success',
  });
  if (skipped?.success === false)
    return { ok: false, skipped: skipped.reason || 'native-failed', result: skipped };
  return { ok: true, native: true, result: skipped };
}
async function playResolvedSound(next) {
  const completionSoundSettings2 = normalizeCompletionSoundSettings(next);
  if (completionSoundSettings2.enabled === false) return { ok: false, skipped: 'disabled' };
  if (typeof audioFactory !== 'function') return { ok: false, skipped: 'no-audio-factory' };
  const url = await resolvePlaybackUrl(completionSoundSettings2);
  if (!url) return { ok: false, skipped: 'missing-url' };
  const audioFactory2 = audioFactory(url);
  if (!audioFactory2) return { ok: false, skipped: 'missing-audio' };
  audioFactory2.volume = completionSoundSettings2.volume;
  try {
    const promise = audioFactory2.play?.();
    if (promise && typeof promise.then === 'function') await promise;
  } catch (current) {
    try {
      const response2 = await playNativeCompletionSound(completionSoundSettings2);
      if (response2.ok) return response2;
    } catch {}
    throw current;
  }
  return { ok: true, url: url };
}
function reportPlaybackFailure(entry) {
  console.warn('[completionSound] playback failed:', entry);
  if (hasReportedPlaybackFailure) return;
  ((hasReportedPlaybackFailure = true),
    globalThis.window?.showToast?.(t('coreServices.completion.soundPlaybackFailed'), 'warn'));
}
export async function previewCompletionSound(value2 = null) {
  const record =
    value2 == null ? await loadCompletionSoundSettings() : normalizeCompletionSoundSettings(value2);
  try {
    return await playResolvedSound(record);
  } catch (error) {
    return (reportPlaybackFailure(error), { ok: false, error: error });
  }
}
export function playCompletionSound(payload = 'generation-success') {
  void payload;
  const promise2 = (async () => {
    const completionSoundSettings3 = await loadCompletionSoundSettings();
    return await playResolvedSound(completionSoundSettings3);
  })();
  return (promise2.catch(reportPlaybackFailure), promise2);
}
export const __completionSoundServiceForTest = {
  setAudioFactory(handle) {
    audioFactory = handle;
  },
  reset() {
    ((audioFactory = (state) => new Audio(state)), clearCompletionSoundSettingsCache());
  },
  resolvePlaybackUrl: resolvePlaybackUrl,
};
