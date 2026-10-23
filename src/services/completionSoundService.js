import { fetchUserSettingsFromServer } from '../../api/userSettingsApi.js';
import { t } from '../i18n/index.js';
import { desktopBridge } from './desktopBridge.js';
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
function normalizePathKey(key) {
  return normalizeText(key).replace(/\\/g, '/').toLowerCase();
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
async function resolveHttpCompatSystemSoundUrl(filePath) {
  // http-compat 运行时（浏览器连桌面后端）拿不到本地文件，只能请宿主把系统提示音
  // 以可播放 URL 的形式给出来；`<audio src="D:////...">` 在浏览器里一定会失败。
  if (!isDesktopHttpShimRuntime() || !desktopBridge.notificationSound.isAvailable()) return '';
  const listed = await desktopBridge.notificationSound.listSystemSounds(),
    targetKey = normalizePathKey(filePath),
    matched = (Array.isArray(listed?.files) ? listed.files : []).find(
      (entry) => normalizePathKey(entry?.path) === targetKey
    );
  return normalizeText(matched?.playbackUrl);
}
function getNotificationSoundPlayer() {
  return desktopBridge.notificationSound.isAvailable()
    ? (options) => desktopBridge.notificationSound.play(options)
    : null;
}
function isDesktopHttpShimRuntime() {
  return desktopBridge.usesHttpCompat;
}
async function resolvePlaybackUrl(target) {
  const completionSoundSettings = normalizeCompletionSoundSettings(target),
    path =
      normalizeText(completionSoundSettings.selectedFilePath) ||
      completionSoundSettings.builtInPath;
  if (!path) return '';
  if (!/^(?:[a-zA-Z]:[\\/]|\\\\|\/)/.test(path)) return path;
  if (isDesktopHttpShimRuntime()) {
    const systemSoundUrl = await resolveHttpCompatSystemSoundUrl(path);
    if (systemSoundUrl) return systemSoundUrl;
    throw new Error('System completion sound is unavailable to the browser runtime');
  }
  if (!desktopBridge.mediaPreview.isAvailable()) return path;
  const preview = await desktopBridge.mediaPreview.getLocalPreviewUrl({
    path: path,
    type: 'audio/mpeg',
  });
  return normalizeText(preview?.url || preview);
}
async function playNativeCompletionSound(source) {
  const play = getNotificationSoundPlayer();
  if (typeof play !== 'function') return { ok: false, skipped: 'unavailable' };
  const volume = normalizeCompletionSoundSettings(source),
    filePath = normalizeText(volume.selectedFilePath) || volume.builtInPath;
  if (!filePath) return { ok: false, skipped: 'missing-file' };
  const skipped = await play({
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
  // shim 运行时先请宿主放：浏览器那侧连文件都读不到，先试 <audio> 必然白报一次错。
  const httpShim = isDesktopHttpShimRuntime();
  if (httpShim) {
    let nativeFailure = null;
    try {
      const nativeResult = await playNativeCompletionSound(completionSoundSettings2);
      if (nativeResult.ok) return nativeResult;
      nativeFailure = nativeResult.result || nativeResult;
    } catch (error) {
      nativeFailure = error;
    }
    console.warn(
      '[completionSound] native playback failed; falling back to browser audio:',
      nativeFailure
    );
  }
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
    if (!httpShim)
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
