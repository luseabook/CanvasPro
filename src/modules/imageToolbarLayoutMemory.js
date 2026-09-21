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
function normalizeAction(_0xb776b6) {
  const _0x329c8a = String(_0xb776b6 || '').trim();
  return IMAGE_TOOLBAR_ACTIONS.includes(_0x329c8a) ? _0x329c8a : '';
}
export function getDefaultImageToolbarLayout() {
  return cloneDefaultLayout();
}
export function normalizeImageToolbarLayout(_0x339630) {
  const _0x280c48 = cloneDefaultLayout();
  if (!_0x339630 || typeof _0x339630 !== 'object') return _0x280c48;
  const _0x5e3363 = { outsidePrimary: [], outsideSecondary: [], more: [] },
    _0x1e8008 = new Set();
  for (const _0x4fe889 of ZONE_KEYS) {
    const _0x1348bd = Array.isArray(_0x339630[_0x4fe889]) ? _0x339630[_0x4fe889] : [];
    for (const _0x17e6a0 of _0x1348bd) {
      const _0x11839b = normalizeAction(_0x17e6a0);
      if (!_0x11839b || _0x1e8008.has(_0x11839b)) continue;
      (_0x1e8008.add(_0x11839b), _0x5e3363[_0x4fe889].push(_0x11839b));
    }
  }
  for (const _0x40a476 of IMAGE_TOOLBAR_ACTIONS) {
    if (_0x1e8008.has(_0x40a476)) continue;
    if (_0x280c48.outsidePrimary.includes(_0x40a476)) {
      _0x5e3363.outsidePrimary.push(_0x40a476);
      continue;
    }
    if (_0x280c48.outsideSecondary.includes(_0x40a476)) {
      _0x5e3363.outsideSecondary.push(_0x40a476);
      continue;
    }
    _0x5e3363.more.push(_0x40a476);
  }
  return _0x5e3363;
}
export function serializeImageToolbarLayout(_0x487a16) {
  const _0xd0a262 = normalizeImageToolbarLayout(_0x487a16);
  return JSON.stringify({
    outsidePrimary: _0xd0a262.outsidePrimary,
    outsideSecondary: _0xd0a262.outsideSecondary,
    more: _0xd0a262.more,
  });
}
