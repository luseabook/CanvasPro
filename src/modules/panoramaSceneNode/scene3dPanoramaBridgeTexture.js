import { t } from '../../i18n/index.js';
import { configureInsideSpherePanoramaTexture } from './scene3dPanoramaTexture.js';
function panoramaLoadErrorText() {
  return t('panoramaSceneNode.errors.panoramaLoadFailed');
}
export function abortPanoramaTextureLoad(_0x1de88a) {
  const _0x42e073 = _0x1de88a?.['_panoramaTextureAbortController'];
  if (_0x1de88a) _0x1de88a['_panoramaTextureAbortController'] = null;
  _0x42e073?.['abort']?.();
}
export function loadPanoramaBridgeTexture(
  _0x40cad1,
  _0x266837,
  { token: _0x260c72, isPreview: isPreview = ![], fullUrl: fullUrl = '' } = {},
) {
  if (!_0x40cad1 || !_0x266837 || _0x260c72 !== _0x40cad1['_panoramaLoadToken']) return;
  _0x40cad1['_pendingPanoramaUrl'] = _0x266837;
  !_0x40cad1['_panoramaSphere']['material']?.['map'] &&
    _0x40cad1['onPanoramaStatusChange']?.({ isLoaded: ![], error: null });
  let _0x1bf6dc = null;
  const _0x144468 = (_0x4d4a49) => {
      _0x1bf6dc &&
        _0x40cad1['_panoramaTextureAbortController'] === _0x1bf6dc &&
        (_0x40cad1['_panoramaTextureAbortController'] = null);
      if (_0x260c72 !== _0x40cad1['_panoramaLoadToken']) {
        _0x4d4a49?.['dispose']?.();
        return;
      }
      (configureInsideSpherePanoramaTexture(_0x4d4a49, _0x40cad1['renderer'], { isPreview: isPreview }),
        _0x40cad1['_panoramaTexture']?.['dispose']?.(),
        (_0x40cad1['_panoramaTexture'] = _0x4d4a49),
        (_0x40cad1['_loadedPanoramaUrl'] = _0x266837),
        (_0x40cad1['_pendingPanoramaUrl'] = ''),
        (_0x40cad1['_panoramaSphere']['material']['map'] = _0x4d4a49),
        (_0x40cad1['_panoramaSphere']['material']['needsUpdate'] = !![]),
        (_0x40cad1['_panoramaSphere']['visible'] = !![]),
        _0x40cad1['_syncPanoramaCanvasVisibility'](),
        _0x40cad1['onPanoramaStatusChange']?.({ isLoaded: !![], error: null }),
        _0x40cad1['requestRender'](),
        isPreview &&
          fullUrl &&
          fullUrl !== _0x266837 &&
          _0x40cad1['_schedulePanoramaFullLoad'](fullUrl, _0x260c72));
    },
    _0x31f4e8 = () => {
      _0x1bf6dc &&
        _0x40cad1['_panoramaTextureAbortController'] === _0x1bf6dc &&
        (_0x40cad1['_panoramaTextureAbortController'] = null);
      if (_0x1bf6dc?.['signal']?.['aborted'] || _0x260c72 !== _0x40cad1['_panoramaLoadToken']) return;
      _0x40cad1['_pendingPanoramaUrl'] = '';
      isPreview &&
        fullUrl &&
        fullUrl !== _0x266837 &&
        _0x40cad1['_schedulePanoramaFullLoad'](fullUrl, _0x260c72);
      const _0xb39826 = Boolean(_0x40cad1['_panoramaSphere']['material']?.['map']);
      ((_0x40cad1['_panoramaSphere']['visible'] = _0xb39826),
        _0x40cad1['_syncPanoramaCanvasVisibility'](),
        _0x40cad1['onPanoramaStatusChange']?.({ isLoaded: _0xb39826, error: panoramaLoadErrorText() }));
    };
  if (typeof _0x40cad1['_panoramaTextureSourceLoader'] === 'function') {
    (abortPanoramaTextureLoad(_0x40cad1),
      (_0x1bf6dc = new AbortController()),
      (_0x40cad1['_panoramaTextureAbortController'] = _0x1bf6dc),
      Promise['resolve'](
        _0x40cad1['_panoramaTextureSourceLoader'](_0x266837, { signal: _0x1bf6dc['signal'] }),
      )['then'](_0x144468, _0x31f4e8));
    return;
  }
  _0x40cad1['_textureLoader']['load'](_0x266837, _0x144468, undefined, _0x31f4e8);
}
export function schedulePanoramaFullLoad(_0x37d236, _0x3d82db, _0xee0772) {
  if (
    !_0x37d236 ||
    !_0x3d82db ||
    _0xee0772 !== _0x37d236['_panoramaLoadToken'] ||
    _0x3d82db === _0x37d236['_loadedPanoramaUrl'] ||
    _0x3d82db === _0x37d236['_pendingPanoramaUrl'] ||
    _0x37d236['_panoramaFullLoadFrame'] !== null
  )
    return;
  const _0x2fde33 =
    typeof globalThis['requestAnimationFrame'] === 'function'
      ? globalThis['requestAnimationFrame']['bind'](globalThis)
      : (_0xcd6986) => setTimeout(_0xcd6986, 0x0);
  _0x37d236['_panoramaFullLoadFrame'] = _0x2fde33(() => {
    _0x37d236['_panoramaFullLoadFrame'] = null;
    if (_0xee0772 !== _0x37d236['_panoramaLoadToken']) return;
    _0x37d236['_loadPanoramaTexture'](_0x3d82db, { token: _0xee0772, isPreview: ![], fullUrl: '' });
  });
}
export function cancelPanoramaFullLoad(_0x20c4f5) {
  if (!_0x20c4f5 || _0x20c4f5['_panoramaFullLoadFrame'] === null) return;
  (typeof globalThis['cancelAnimationFrame'] === 'function'
    ? globalThis['cancelAnimationFrame'](_0x20c4f5['_panoramaFullLoadFrame'])
    : clearTimeout(_0x20c4f5['_panoramaFullLoadFrame']),
    (_0x20c4f5['_panoramaFullLoadFrame'] = null));
}
