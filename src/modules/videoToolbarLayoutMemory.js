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
function normalizeAction(_0x4a5fc3) {
  const _0x596a22 = String(_0x4a5fc3 || '').trim();
  return VIDEO_TOOLBAR_ACTIONS.includes(_0x596a22) ? _0x596a22 : '';
}
export function getDefaultVideoToolbarLayout() {
  return cloneDefaultLayout();
}
export function normalizeVideoToolbarLayout(_0x3b1817) {
  const _0x5dfb1c = cloneDefaultLayout();
  if (!_0x3b1817 || typeof _0x3b1817 !== 'object') return _0x5dfb1c;
  const _0x2302c2 = { outsidePrimary: [], outsideSecondary: [], more: [] },
    _0x43f065 = new Set();
  for (const _0x2047d1 of ZONE_KEYS) {
    const _0x1c841d = Array.isArray(_0x3b1817[_0x2047d1]) ? _0x3b1817[_0x2047d1] : [];
    for (const _0x1c47bb of _0x1c841d) {
      const _0x3bcc6c = normalizeAction(_0x1c47bb);
      if (!_0x3bcc6c || _0x43f065.has(_0x3bcc6c)) continue;
      (_0x43f065.add(_0x3bcc6c), _0x2302c2[_0x2047d1].push(_0x3bcc6c));
    }
  }
  for (const _0x3f7695 of VIDEO_TOOLBAR_ACTIONS) {
    if (_0x43f065.has(_0x3f7695)) continue;
    if (_0x5dfb1c.outsidePrimary.includes(_0x3f7695)) {
      _0x2302c2.outsidePrimary.push(_0x3f7695);
      continue;
    }
    if (_0x5dfb1c.outsideSecondary.includes(_0x3f7695)) {
      _0x2302c2.outsideSecondary.push(_0x3f7695);
      continue;
    }
    _0x2302c2.more.push(_0x3f7695);
  }
  return _0x2302c2;
}
export function serializeVideoToolbarLayout(_0x4433da) {
  const _0x36e5ea = normalizeVideoToolbarLayout(_0x4433da);
  return JSON.stringify({
    outsidePrimary: _0x36e5ea.outsidePrimary,
    outsideSecondary: _0x36e5ea.outsideSecondary,
    more: _0x36e5ea.more,
  });
}
