export const STORYBOARD_3D_NAVIGATION_STORAGE_KEY = 'aiCanvas.storyboard3d.navigation.v1';
export const STORYBOARD_3D_NAVIGATION_PRESETS = Object['freeze']({
  unity: Object['freeze']({
    id: 'unity',
    label: 'Unity',
    summary: '中键平移 · Alt+左键环绕 · Alt+右键缩放',
    toolShortcuts: Object['freeze']({ select: 'Q', move: 'W', rotate: 'E', scale: 'R' }),
    defaults: Object['freeze']({ orbitSensitivity: 1, panSensitivity: 1, zoomSensitivity: 1 }),
  }),
  blender: Object['freeze']({
    id: 'blender',
    label: 'Blender',
    summary: '中键环绕 · Shift+中键平移 · Ctrl+中键缩放',
    toolShortcuts: Object['freeze']({ select: 'W', move: 'G', rotate: 'R', scale: 'S' }),
    defaults: Object['freeze']({ orbitSensitivity: 1, panSensitivity: 1, zoomSensitivity: 1 }),
  }),
  c4d: Object['freeze']({
    id: 'c4d',
    label: 'Cinema 4D',
    summary: 'Alt+左键环绕 · Alt+中键平移 · Alt+右键缩放',
    toolShortcuts: Object['freeze']({ select: '0', move: 'E', rotate: 'R', scale: 'T' }),
    defaults: Object['freeze']({ orbitSensitivity: 0.9, panSensitivity: 1, zoomSensitivity: 0.9 }),
  }),
  maya: Object['freeze']({
    id: 'maya',
    label: 'Maya',
    summary: 'Alt+左键环绕 · Alt+中键平移 · Alt+右键缩放',
    toolShortcuts: Object['freeze']({ select: 'Q', move: 'W', rotate: 'E', scale: 'R' }),
    defaults: Object['freeze']({ orbitSensitivity: 1, panSensitivity: 1, zoomSensitivity: 1 }),
  }),
});
export const DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET = 'unity';
export const STORYBOARD_3D_NAVIGATION_TOOLS = Object['freeze'](['select', 'move', 'rotate', 'scale']);
export function getStoryboard3DToolShortcut(
  value = DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET,
  item = 'select',
) {
  const key =
    STORYBOARD_3D_NAVIGATION_PRESETS[value] ||
    STORYBOARD_3D_NAVIGATION_PRESETS[DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET];
  return key['toolShortcuts']?.[item] || '';
}
export function resolveStoryboard3DToolFromShortcut(index, result = DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET) {
  const enabled = String(index || '')
    ['trim']()
    ['toLowerCase']();
  if (!enabled) return null;
  return (
    STORYBOARD_3D_NAVIGATION_TOOLS['find'](
      (data) => getStoryboard3DToolShortcut(result, data)['toLowerCase']() === enabled,
    ) || null
  );
}
function clamp(options, target, source, next) {
  const current = Number(options);
  return Math['min'](source, Math['max'](target, Number['isFinite'](current) ? current : next));
}
export function normalizeStoryboard3DNavigationSettings(invertOrbitX = {}) {
  const preset = STORYBOARD_3D_NAVIGATION_PRESETS[invertOrbitX?.['preset']]
      ? invertOrbitX['preset']
      : DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET,
    entry = STORYBOARD_3D_NAVIGATION_PRESETS[preset]['defaults'];
  return {
    preset: preset,
    orbitSensitivity: clamp(invertOrbitX['orbitSensitivity'], 0.2, 3, entry['orbitSensitivity']),
    panSensitivity: clamp(invertOrbitX['panSensitivity'], 0.2, 3, entry['panSensitivity']),
    zoomSensitivity: clamp(invertOrbitX['zoomSensitivity'], 0.2, 3, entry['zoomSensitivity']),
    invertOrbitX: invertOrbitX['invertOrbitX'] === true,
    invertOrbitY: invertOrbitX['invertOrbitY'] === true,
    invertWheel: invertOrbitX['invertWheel'] === true,
  };
}
export function createStoryboard3DNavigationPresetSettings(preset2) {
  return normalizeStoryboard3DNavigationSettings({ preset: preset2 });
}
export function loadStoryboard3DNavigationSettings(record = globalThis['localStorage']) {
  try {
    const payload = record?.['getItem']?.(STORYBOARD_3D_NAVIGATION_STORAGE_KEY);
    return normalizeStoryboard3DNavigationSettings(payload ? JSON['parse'](payload) : {});
  } catch {
    return normalizeStoryboard3DNavigationSettings();
  }
}
export function saveStoryboard3DNavigationSettings(handle, state = globalThis['localStorage']) {
  const storyboard3DNavigationSettings = normalizeStoryboard3DNavigationSettings(handle);
  try {
    state?.['setItem']?.(
      STORYBOARD_3D_NAVIGATION_STORAGE_KEY,
      JSON['stringify'](storyboard3DNavigationSettings),
    );
  } catch {}
  return storyboard3DNavigationSettings;
}
