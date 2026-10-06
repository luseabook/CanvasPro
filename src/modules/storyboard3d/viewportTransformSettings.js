import { normalizeStoryboard3DViewportSettings } from './viewportControlSystem.js';
export const STORYBOARD_3D_TRANSFORM_STORAGE_KEY = 'aiCanvas.storyboard3d.transform.v1';
const DEFAULT_TRANSFORM_SETTINGS = Object.freeze({
  transformSpace: 'world',
  groundLock: false,
  uniformScale: false,
  snapEnabled: false,
});
export function loadStoryboard3DTransformSettings(value = globalThis.localStorage) {
  try {
    const item = value?.getItem?.(STORYBOARD_3D_TRANSFORM_STORAGE_KEY);
    return normalizeStoryboard3DViewportSettings(
      item ? { ...DEFAULT_TRANSFORM_SETTINGS, ...JSON.parse(item) } : DEFAULT_TRANSFORM_SETTINGS,
    );
  } catch {
    return normalizeStoryboard3DViewportSettings(DEFAULT_TRANSFORM_SETTINGS);
  }
}
export function saveStoryboard3DTransformSettings(key, index = globalThis.localStorage) {
  const storyboard3DViewportSettings = normalizeStoryboard3DViewportSettings(key);
  try {
    index?.setItem?.(
      STORYBOARD_3D_TRANSFORM_STORAGE_KEY,
      JSON.stringify(storyboard3DViewportSettings),
    );
  } catch {}
  return storyboard3DViewportSettings;
}
