export const STORYBOARD_3D_NAVIGATION_STORAGE_KEY = 'aiCanvas.storyboard3d.navigation.v1';
export const STORYBOARD_3D_NAVIGATION_PRESETS = Object['freeze']({
  unity: Object['freeze']({
    id: 'unity',
    label: 'Unity',
    summary: '中键平移\x20·\x20Alt+左键环绕\x20·\x20Alt+右键缩放',
    toolShortcuts: Object['freeze']({ select: 'Q', move: 'W', rotate: 'E', scale: 'R' }),
    defaults: Object['freeze']({ orbitSensitivity: 0x1, panSensitivity: 0x1, zoomSensitivity: 0x1 }),
  }),
  blender: Object['freeze']({
    id: 'blender',
    label: 'Blender',
    summary: '中键环绕 · Shift+中键平移 · Ctrl+中键缩放',
    toolShortcuts: Object['freeze']({ select: 'W', move: 'G', rotate: 'R', scale: 'S' }),
    defaults: Object['freeze']({ orbitSensitivity: 0x1, panSensitivity: 0x1, zoomSensitivity: 0x1 }),
  }),
  c4d: Object['freeze']({
    id: 'c4d',
    label: 'Cinema 4D',
    summary: 'Alt+左键环绕 · Alt+中键平移 · Alt+右键缩放',
    toolShortcuts: Object['freeze']({ select: '0', move: 'E', rotate: 'R', scale: 'T' }),
    defaults: Object['freeze']({ orbitSensitivity: 0.9, panSensitivity: 0x1, zoomSensitivity: 0.9 }),
  }),
  maya: Object['freeze']({
    id: 'maya',
    label: 'Maya',
    summary: 'Alt+左键环绕\x20·\x20Alt+中键平移\x20·\x20Alt+右键缩放',
    toolShortcuts: Object['freeze']({ select: 'Q', move: 'W', rotate: 'E', scale: 'R' }),
    defaults: Object['freeze']({ orbitSensitivity: 0x1, panSensitivity: 0x1, zoomSensitivity: 0x1 }),
  }),
});
export const DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET = 'unity';
export const STORYBOARD_3D_NAVIGATION_TOOLS = Object['freeze'](['select', 'move', 'rotate', 'scale']);
export function getStoryboard3DToolShortcut(
  _0x934d43 = DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET,
  _0x13b58c = 'select',
) {
  const _0x11c2ad =
    STORYBOARD_3D_NAVIGATION_PRESETS[_0x934d43] ||
    STORYBOARD_3D_NAVIGATION_PRESETS[DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET];
  return _0x11c2ad['toolShortcuts']?.[_0x13b58c] || '';
}
export function resolveStoryboard3DToolFromShortcut(
  _0x213924,
  _0x154e3e = DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET,
) {
  const _0x122c2f = String(_0x213924 || '')
    ['trim']()
    ['toLowerCase']();
  if (!_0x122c2f) return null;
  return (
    STORYBOARD_3D_NAVIGATION_TOOLS['find'](
      (_0x2d60bf) => getStoryboard3DToolShortcut(_0x154e3e, _0x2d60bf)['toLowerCase']() === _0x122c2f,
    ) || null
  );
}
function clamp(_0x42ae2b, _0x15279b, _0x54370e, _0x4f8622) {
  const _0x13a252 = Number(_0x42ae2b);
  return Math['min'](
    _0x54370e,
    Math['max'](_0x15279b, Number['isFinite'](_0x13a252) ? _0x13a252 : _0x4f8622),
  );
}
export function normalizeStoryboard3DNavigationSettings(_0x583bef = {}) {
  const _0x3cf52b = STORYBOARD_3D_NAVIGATION_PRESETS[_0x583bef?.['preset']]
      ? _0x583bef['preset']
      : DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET,
    _0x323579 = STORYBOARD_3D_NAVIGATION_PRESETS[_0x3cf52b]['defaults'];
  return {
    preset: _0x3cf52b,
    orbitSensitivity: clamp(_0x583bef['orbitSensitivity'], 0.2, 0x3, _0x323579['orbitSensitivity']),
    panSensitivity: clamp(_0x583bef['panSensitivity'], 0.2, 0x3, _0x323579['panSensitivity']),
    zoomSensitivity: clamp(_0x583bef['zoomSensitivity'], 0.2, 0x3, _0x323579['zoomSensitivity']),
    invertOrbitX: _0x583bef['invertOrbitX'] === !![],
    invertOrbitY: _0x583bef['invertOrbitY'] === !![],
    invertWheel: _0x583bef['invertWheel'] === !![],
  };
}
export function createStoryboard3DNavigationPresetSettings(_0x28cf96) {
  return normalizeStoryboard3DNavigationSettings({ preset: _0x28cf96 });
}
export function loadStoryboard3DNavigationSettings(_0x156e3c = globalThis['localStorage']) {
  try {
    const _0x27b185 = _0x156e3c?.['getItem']?.(STORYBOARD_3D_NAVIGATION_STORAGE_KEY);
    return normalizeStoryboard3DNavigationSettings(_0x27b185 ? JSON['parse'](_0x27b185) : {});
  } catch {
    return normalizeStoryboard3DNavigationSettings();
  }
}
export function saveStoryboard3DNavigationSettings(_0x106c1e, _0x125ea6 = globalThis['localStorage']) {
  const _0x27ad63 = normalizeStoryboard3DNavigationSettings(_0x106c1e);
  try {
    _0x125ea6?.['setItem']?.(STORYBOARD_3D_NAVIGATION_STORAGE_KEY, JSON['stringify'](_0x27ad63));
  } catch {}
  return _0x27ad63;
}
