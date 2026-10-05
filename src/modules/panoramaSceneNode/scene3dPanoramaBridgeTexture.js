import { t } from '../../i18n/index.js';
import { configureInsideSpherePanoramaTexture } from './scene3dPanoramaTexture.js';
function panoramaLoadErrorText() {
  return t('panoramaSceneNode.errors.panoramaLoadFailed');
}
export function abortPanoramaTextureLoad(value) {
  const item = value?.['_panoramaTextureAbortController'];
  if (value) value['_panoramaTextureAbortController'] = null;
  item?.['abort']?.();
}
export function loadPanoramaBridgeTexture(
  enabled,
  enabled2,
  { token: token, isPreview: isPreview = false, fullUrl: fullUrl = '' } = {},
) {
  if (!enabled || !enabled2 || token !== enabled['_panoramaLoadToken']) return;
  enabled['_pendingPanoramaUrl'] = enabled2;
  !enabled['_panoramaSphere']['material']?.['map'] &&
    enabled['onPanoramaStatusChange']?.({ isLoaded: false, error: null });
  let signal = null;
  const key = (index) => {
      signal &&
        enabled['_panoramaTextureAbortController'] === signal &&
        (enabled['_panoramaTextureAbortController'] = null);
      if (token !== enabled['_panoramaLoadToken']) {
        index?.['dispose']?.();
        return;
      }
      (configureInsideSpherePanoramaTexture(index, enabled['renderer'], { isPreview: isPreview }),
        enabled['_panoramaTexture']?.['dispose']?.(),
        (enabled['_panoramaTexture'] = index),
        (enabled['_loadedPanoramaUrl'] = enabled2),
        (enabled['_pendingPanoramaUrl'] = ''),
        (enabled['_panoramaSphere']['material']['map'] = index),
        (enabled['_panoramaSphere']['material']['needsUpdate'] = true),
        (enabled['_panoramaSphere']['visible'] = true),
        enabled['_syncPanoramaCanvasVisibility'](),
        enabled['onPanoramaStatusChange']?.({ isLoaded: true, error: null }),
        enabled['requestRender'](),
        isPreview && fullUrl && fullUrl !== enabled2 && enabled['_schedulePanoramaFullLoad'](fullUrl, token));
    },
    result = () => {
      signal &&
        enabled['_panoramaTextureAbortController'] === signal &&
        (enabled['_panoramaTextureAbortController'] = null);
      if (signal?.['signal']?.['aborted'] || token !== enabled['_panoramaLoadToken']) return;
      enabled['_pendingPanoramaUrl'] = '';
      isPreview && fullUrl && fullUrl !== enabled2 && enabled['_schedulePanoramaFullLoad'](fullUrl, token);
      const isLoaded = Boolean(enabled['_panoramaSphere']['material']?.['map']);
      ((enabled['_panoramaSphere']['visible'] = isLoaded),
        enabled['_syncPanoramaCanvasVisibility'](),
        enabled['onPanoramaStatusChange']?.({ isLoaded: isLoaded, error: panoramaLoadErrorText() }));
    };
  if (typeof enabled['_panoramaTextureSourceLoader'] === 'function') {
    (abortPanoramaTextureLoad(enabled),
      (signal = new AbortController()),
      (enabled['_panoramaTextureAbortController'] = signal),
      Promise['resolve'](enabled['_panoramaTextureSourceLoader'](enabled2, { signal: signal['signal'] }))[
        'then'
      ](key, result));
    return;
  }
  enabled['_textureLoader']['load'](enabled2, key, undefined, result);
}
export function schedulePanoramaFullLoad(enabled3, enabled4, token2) {
  if (
    !enabled3 ||
    !enabled4 ||
    token2 !== enabled3['_panoramaLoadToken'] ||
    enabled4 === enabled3['_loadedPanoramaUrl'] ||
    enabled4 === enabled3['_pendingPanoramaUrl'] ||
    enabled3['_panoramaFullLoadFrame'] !== null
  )
    return;
  const run =
    typeof globalThis['requestAnimationFrame'] === 'function'
      ? globalThis['requestAnimationFrame']['bind'](globalThis)
      : (data) => setTimeout(data, 0);
  enabled3['_panoramaFullLoadFrame'] = run(() => {
    enabled3['_panoramaFullLoadFrame'] = null;
    if (token2 !== enabled3['_panoramaLoadToken']) return;
    enabled3['_loadPanoramaTexture'](enabled4, { token: token2, isPreview: false, fullUrl: '' });
  });
}
export function cancelPanoramaFullLoad(enabled5) {
  if (!enabled5 || enabled5['_panoramaFullLoadFrame'] === null) return;
  (typeof globalThis['cancelAnimationFrame'] === 'function'
    ? globalThis['cancelAnimationFrame'](enabled5['_panoramaFullLoadFrame'])
    : clearTimeout(enabled5['_panoramaFullLoadFrame']),
    (enabled5['_panoramaFullLoadFrame'] = null));
}
