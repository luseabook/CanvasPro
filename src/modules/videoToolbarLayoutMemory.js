export const VIDEO_TOOLBAR_ACTIONS = Object.freeze([
  'clip',
  'reverse',
  'extract-keyframes',
  'keying',
  'storyboard-script',
  'apimart-face-detect',
  'fullscreen',
  'download',
  'reset-size',
  'hd',
  'replace',
  'remove',
  'separate-av',
]);
const DEFAULT_VIDEO_TOOLBAR_LAYOUT = Object.freeze({
    outsidePrimary: Object.freeze([
      'clip',
      'reverse',
      'extract-keyframes',
      'keying',
      'storyboard-script',
      'apimart-face-detect',
    ]),
    outsideSecondary: Object.freeze(['fullscreen', 'download', 'reset-size']),
    more: Object.freeze(['hd', 'replace', 'remove', 'separate-av']),
  }),
  ZONE_KEYS = Object.freeze(['outsidePrimary', 'outsideSecondary', 'more']);
function cloneDefaultLayout() {
  return {
    outsidePrimary: [...DEFAULT_VIDEO_TOOLBAR_LAYOUT.outsidePrimary],
    outsideSecondary: [...DEFAULT_VIDEO_TOOLBAR_LAYOUT.outsideSecondary],
    more: [...DEFAULT_VIDEO_TOOLBAR_LAYOUT.more],
  };
}
function normalizeAction(value) {
  const item = String(value || '').trim();
  return VIDEO_TOOLBAR_ACTIONS.includes(item) ? item : '';
}
export function getDefaultVideoToolbarLayout() {
  return cloneDefaultLayout();
}
export function normalizeVideoToolbarLayout(enabled) {
  const cloneDefaultLayout2 = cloneDefaultLayout();
  if (!enabled || typeof enabled !== 'object') return cloneDefaultLayout2;
  const key = { outsidePrimary: [], outsideSecondary: [], more: [] },
    map = new Set();
  for (const index of ZONE_KEYS) {
    const result = Array.isArray(enabled[index]) ? enabled[index] : [];
    for (const data of result) {
      const action = normalizeAction(data);
      if (!action || map.has(action)) continue;
      (map.add(action), key[index].push(action));
    }
  }
  for (const options of VIDEO_TOOLBAR_ACTIONS) {
    if (map.has(options)) continue;
    if (cloneDefaultLayout2.outsidePrimary.includes(options)) {
      key.outsidePrimary.push(options);
      continue;
    }
    if (cloneDefaultLayout2.outsideSecondary.includes(options)) {
      key.outsideSecondary.push(options);
      continue;
    }
    key.more.push(options);
  }
  return key;
}
export function serializeVideoToolbarLayout(target) {
  const outsidePrimary = normalizeVideoToolbarLayout(target);
  return JSON.stringify({
    outsidePrimary: outsidePrimary.outsidePrimary,
    outsideSecondary: outsidePrimary.outsideSecondary,
    more: outsidePrimary.more,
  });
}
