// Layout metrics and pure sizing helpers extracted from editorWorkspace.js.
// editorWorkspace.js imports the constants and re-exports the helpers, so the module's
// public export surface is unchanged.
export const STORYBOARD_3D_EDITABLE_BONES = Object.freeze([
    ['Head', '头部'],
    ['spine_02', '胸腔'],
    ['pelvis', '骨盆'],
    ['hand_l', '左手'],
    ['hand_r', '右手'],
    ['lowerarm_l', '左肘'],
    ['lowerarm_r', '右肘'],
    ['foot_l', '左脚'],
    ['foot_r', '右脚'],
    ['calf_l', '左膝'],
    ['calf_r', '右膝'],
  ]),
  STORYBOARD_3D_INSPECTOR_MIN_WIDTH = 280,
  STORYBOARD_3D_INSPECTOR_MAX_WIDTH = 560,
  STORYBOARD_3D_VIEWPORT_MIN_WIDTH = 420,
  STORYBOARD_3D_INSPECTOR_SPLITTER_WIDTH = 14,
  STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH = 360,
  STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH = 1800,
  STORYBOARD_3D_RIGHT_SIDEBAR_VIEWPORT_MIN_WIDTH = 280,
  STORYBOARD_3D_TIMELINE_MIN_HEIGHT = 220,
  STORYBOARD_3D_TIMELINE_MAX_HEIGHT = 720,
  STORYBOARD_3D_TIMELINE_DEFAULT_HEIGHT = 340,
  STORYBOARD_3D_VIEWPORT_MIN_HEIGHT = 160;
export function normalizeStoryboard3DInspectorWidth(value36, value37 = 1200) {
  const value38 = Number(value37),
    value39 = Number.isFinite(value38)
      ? value38 - STORYBOARD_3D_VIEWPORT_MIN_WIDTH - STORYBOARD_3D_INSPECTOR_SPLITTER_WIDTH
      : STORYBOARD_3D_INSPECTOR_MAX_WIDTH,
    value40 = Math.max(
      STORYBOARD_3D_INSPECTOR_MIN_WIDTH,
      Math.min(STORYBOARD_3D_INSPECTOR_MAX_WIDTH, value39),
    ),
    value41 = Number(value36),
    value42 = Math.min(360, value40);
  return Math.round(
    Math.max(
      STORYBOARD_3D_INSPECTOR_MIN_WIDTH,
      Math.min(value40, Number.isFinite(value41) ? value41 : value42),
    ),
  );
}
export function resolveStoryboard3DViewportCenterPosition(event2) {
  const box = event2?.target,
    value43 = Array.isArray(box) ? Number(box[0]) : Number(box?.x),
    value44 = Array.isArray(box) ? Number(box[2]) : Number(box?.z);
  return [Number.isFinite(value43) ? value43 : 0, 0, Number.isFinite(value44) ? value44 : 0];
}
export function normalizeStoryboard3DRightSidebarWidth(value45, value46 = 1440, value47 = 'assets') {
  const value48 = Number(value46),
    value49 = Number.isFinite(value48)
      ? value48 - STORYBOARD_3D_RIGHT_SIDEBAR_VIEWPORT_MIN_WIDTH
      : STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH,
    value50 = Math.max(
      STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH,
      Math.min(STORYBOARD_3D_RIGHT_SIDEBAR_MAX_WIDTH, value49),
    ),
    value51 = value45 == null ? Number.NaN : Number(value45),
    value52 = value47 !== 'assets',
    value53 = Math.min(
      value52 ? 480 : 960,
      Math.max(
        STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH,
        Number.isFinite(value48) ? value48 * (value52 ? 0.21 : 0.42) : value52 ? 360 : 720,
      ),
    );
  return Math.round(
    Math.max(
      STORYBOARD_3D_RIGHT_SIDEBAR_MIN_WIDTH,
      Math.min(value50, Number.isFinite(value51) ? value51 : value53),
    ),
  );
}
export function normalizeStoryboard3DTimelineHeight(value54, value55 = 900) {
  const value56 = Number(value55),
    value57 = Number.isFinite(value56)
      ? Math.min(
          STORYBOARD_3D_TIMELINE_MIN_HEIGHT,
          Math.max(120, value56 - STORYBOARD_3D_VIEWPORT_MIN_HEIGHT),
        )
      : STORYBOARD_3D_TIMELINE_MIN_HEIGHT,
    value58 = Number.isFinite(value56)
      ? value56 - STORYBOARD_3D_VIEWPORT_MIN_HEIGHT
      : STORYBOARD_3D_TIMELINE_MAX_HEIGHT,
    value59 = Math.max(value57, Math.min(STORYBOARD_3D_TIMELINE_MAX_HEIGHT, value58)),
    value60 = value54 == null ? Number.NaN : Number(value54),
    value61 = Math.min(STORYBOARD_3D_TIMELINE_DEFAULT_HEIGHT, value59);
  return Math.round(
    Math.max(value57, Math.min(value59, Number.isFinite(value60) ? value60 : value61)),
  );
}
