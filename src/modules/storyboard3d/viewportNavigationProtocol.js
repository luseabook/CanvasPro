import {
  DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET,
  STORYBOARD_3D_NAVIGATION_PRESETS,
  resolveStoryboard3DToolFromShortcut,
} from './viewportNavigationSettings.js';
export const STORYBOARD_3D_NAVIGATION_MODE = Object['freeze']({
  ORBIT: 'orbit',
  PAN: 'pan',
  DOLLY: 'dolly',
  FLY_LOOK: 'fly-look',
});
export function resolveStoryboard3DNavigationMode(
  event = {},
  { flyMode: flyMode = false, preset: preset = DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET } = {},
) {
  const count = Number(event['button']),
    enabled = event['altKey'] === true,
    value = event['shiftKey'] === true,
    item = event['ctrlKey'] === true || event['metaKey'] === true,
    key = STORYBOARD_3D_NAVIGATION_PRESETS[preset] ? preset : DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET;
  if (flyMode && count === 2) return STORYBOARD_3D_NAVIGATION_MODE['FLY_LOOK'];
  if (key === 'blender') {
    if (count !== 1) return null;
    if (item) return STORYBOARD_3D_NAVIGATION_MODE['DOLLY'];
    if (value) return STORYBOARD_3D_NAVIGATION_MODE['PAN'];
    return STORYBOARD_3D_NAVIGATION_MODE['ORBIT'];
  }
  if (key === 'unity') {
    if (count === 1) return STORYBOARD_3D_NAVIGATION_MODE['PAN'];
    if (enabled && count === 0) return STORYBOARD_3D_NAVIGATION_MODE['ORBIT'];
    if (enabled && count === 2) return STORYBOARD_3D_NAVIGATION_MODE['DOLLY'];
    return null;
  }
  if (!enabled) return null;
  if (count === 0) return STORYBOARD_3D_NAVIGATION_MODE['ORBIT'];
  if (count === 1) return STORYBOARD_3D_NAVIGATION_MODE['PAN'];
  if (count === 2) return STORYBOARD_3D_NAVIGATION_MODE['DOLLY'];
  return null;
}
export function getStoryboard3DNavigationHelpText({
  flyMode: flyMode = false,
  preset: preset = DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET,
} = {}) {
  return flyMode
    ? '飞行模式 · WASD / Q E / 右键观察 / Shift 加速'
    : STORYBOARD_3D_NAVIGATION_PRESETS[preset]?.['summary'] ||
        STORYBOARD_3D_NAVIGATION_PRESETS[DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET]['summary'];
}
export function resolveStoryboard3DNavigationTool(
  event2 = {},
  { preset: preset = DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET } = {},
) {
  if (event2['altKey'] || event2['ctrlKey'] || event2['metaKey'] || event2['shiftKey']) return null;
  return resolveStoryboard3DToolFromShortcut(event2['key'], preset);
}
