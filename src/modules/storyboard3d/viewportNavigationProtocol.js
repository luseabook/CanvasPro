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
  { flyMode: flyMode = ![], preset: preset = DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET } = {},
) {
  const count = Number(event['button']),
    enabled = event['altKey'] === !![],
    value = event['shiftKey'] === !![],
    item = event['ctrlKey'] === !![] || event['metaKey'] === !![],
    key = STORYBOARD_3D_NAVIGATION_PRESETS[preset] ? preset : DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET;
  if (flyMode && count === 0x2) return STORYBOARD_3D_NAVIGATION_MODE['FLY_LOOK'];
  if (key === 'blender') {
    if (count !== 0x1) return null;
    if (item) return STORYBOARD_3D_NAVIGATION_MODE['DOLLY'];
    if (value) return STORYBOARD_3D_NAVIGATION_MODE['PAN'];
    return STORYBOARD_3D_NAVIGATION_MODE['ORBIT'];
  }
  if (key === 'unity') {
    if (count === 0x1) return STORYBOARD_3D_NAVIGATION_MODE['PAN'];
    if (enabled && count === 0x0) return STORYBOARD_3D_NAVIGATION_MODE['ORBIT'];
    if (enabled && count === 0x2) return STORYBOARD_3D_NAVIGATION_MODE['DOLLY'];
    return null;
  }
  if (!enabled) return null;
  if (count === 0x0) return STORYBOARD_3D_NAVIGATION_MODE['ORBIT'];
  if (count === 0x1) return STORYBOARD_3D_NAVIGATION_MODE['PAN'];
  if (count === 0x2) return STORYBOARD_3D_NAVIGATION_MODE['DOLLY'];
  return null;
}
export function getStoryboard3DNavigationHelpText({
  flyMode: flyMode = ![],
  preset: preset = DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET,
} = {}) {
  return flyMode
    ? '飞行模式\x20·\x20WASD\x20/\x20Q\x20E\x20/\x20右键观察\x20/\x20Shift\x20加速'
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
