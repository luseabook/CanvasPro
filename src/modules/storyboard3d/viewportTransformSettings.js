import { normalizeStoryboard3DViewportSettings } from './viewportControlSystem.js';
export const STORYBOARD_3D_TRANSFORM_STORAGE_KEY = 'aiCanvas.storyboard3d.transform.v1';
const DEFAULT_TRANSFORM_SETTINGS = Object['freeze']({
  transformSpace: 'world',
  groundLock: ![],
  uniformScale: ![],
  snapEnabled: ![],
});
export function loadStoryboard3DTransformSettings(_0x2f372d = globalThis['localStorage']) {
  try {
    const _0x40805a = _0x2f372d?.['getItem']?.(STORYBOARD_3D_TRANSFORM_STORAGE_KEY);
    return normalizeStoryboard3DViewportSettings(
      _0x40805a ? { ...DEFAULT_TRANSFORM_SETTINGS, ...JSON['parse'](_0x40805a) } : DEFAULT_TRANSFORM_SETTINGS,
    );
  } catch {
    return normalizeStoryboard3DViewportSettings(DEFAULT_TRANSFORM_SETTINGS);
  }
}
export function saveStoryboard3DTransformSettings(_0x28bed9, _0x5d9143 = globalThis['localStorage']) {
  const _0x25b0b3 = normalizeStoryboard3DViewportSettings(_0x28bed9);
  try {
    _0x5d9143?.['setItem']?.(STORYBOARD_3D_TRANSFORM_STORAGE_KEY, JSON['stringify'](_0x25b0b3));
  } catch {}
  return _0x25b0b3;
}
