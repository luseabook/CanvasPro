export const IMAGE_TOOLBAR_ACTIONS = Object.freeze([
  'matting',
  'repaint',
  'erase',
  'hd',
  'expand',
  'auto-subject',
  'apimart-face-detect',
  'panorama-360',
  'multigrid',
  'multiangle',
  'annotate',
  'crop',
  'fullscreen',
  'download',
  'reset-size',
]);
const DEFAULT_IMAGE_TOOLBAR_LAYOUT = Object.freeze({
    outsidePrimary: Object.freeze([
      'matting',
      'expand',
      'apimart-face-detect',
      'panorama-360',
      'multigrid',
      'multiangle',
    ]),
    outsideSecondary: Object.freeze(['annotate', 'crop', 'fullscreen', 'download', 'reset-size']),
    more: Object.freeze(['repaint', 'erase', 'hd', 'auto-subject']),
  }),
  ZONE_KEYS = Object.freeze(['outsidePrimary', 'outsideSecondary', 'more']);
function cloneDefaultLayout() {
  return {
    outsidePrimary: [...DEFAULT_IMAGE_TOOLBAR_LAYOUT.outsidePrimary],
    outsideSecondary: [...DEFAULT_IMAGE_TOOLBAR_LAYOUT.outsideSecondary],
    more: [...DEFAULT_IMAGE_TOOLBAR_LAYOUT.more],
  };
}
function normalizeAction(value) {
  const item = String(value || '').trim();
  return IMAGE_TOOLBAR_ACTIONS.includes(item) ? item : '';
}
export function getDefaultImageToolbarLayout() {
  return cloneDefaultLayout();
}
export function normalizeImageToolbarLayout(enabled) {
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
  for (const options of IMAGE_TOOLBAR_ACTIONS) {
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
export function serializeImageToolbarLayout(target) {
  const outsidePrimary = normalizeImageToolbarLayout(target);
  return JSON.stringify({
    outsidePrimary: outsidePrimary.outsidePrimary,
    outsideSecondary: outsidePrimary.outsideSecondary,
    more: outsidePrimary.more,
  });
}
