const DEFAULT_VIEWPORT_WIDTH = 0x400,
  DEFAULT_VIEWPORT_HEIGHT = 0x300,
  DEFAULT_DURATION_MS = 0x370,
  DEFAULT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
function isReducedMotionPreferred(_0x478e6e) {
  try {
    return _0x478e6e?.['matchMedia']?.('(prefers-reduced-motion: reduce)')?.['matches'] === !![];
  } catch {
    return ![];
  }
}
function getViewportSize(_0x57dfcd, _0x296b5b) {
  const _0xa0651e = _0x57dfcd?.['documentElement'];
  return {
    width: _0x296b5b?.['innerWidth'] || _0xa0651e?.['clientWidth'] || DEFAULT_VIEWPORT_WIDTH,
    height: _0x296b5b?.['innerHeight'] || _0xa0651e?.['clientHeight'] || DEFAULT_VIEWPORT_HEIGHT,
  };
}
function resolveRevealPoint({
  documentObject: _0x32e5d6,
  windowObject: _0x13c57f,
  event: _0xc56339,
  sourceElement: _0x4c2080,
}) {
  const { width: _0x442843, height: _0x3887d5 } = getViewportSize(_0x32e5d6, _0x13c57f),
    _0x1a0cd0 = { x: _0x442843 / 0x2, y: _0x3887d5 / 0x2 },
    _0x344827 = Number(_0xc56339?.['clientX']),
    _0x1c6a9d = Number(_0xc56339?.['clientY']);
  if (
    Number['isFinite'](_0x344827) &&
    Number['isFinite'](_0x1c6a9d) &&
    (_0x344827 !== 0x0 || _0x1c6a9d !== 0x0)
  )
    return { x: _0x344827, y: _0x1c6a9d };
  const _0x5e2d77 = _0x4c2080 || _0xc56339?.['currentTarget'] || _0xc56339?.['target'];
  if (typeof _0x5e2d77?.['getBoundingClientRect'] !== 'function') return _0x1a0cd0;
  const _0x360e16 = _0x5e2d77['getBoundingClientRect']();
  return { x: _0x360e16['left'] + _0x360e16['width'] / 0x2, y: _0x360e16['top'] + _0x360e16['height'] / 0x2 };
}
function getRevealRadius(_0x72f7e7, _0x562502, _0x403dee, _0x4bec8a) {
  const { width: _0x1cfce0, height: _0x5edcb6 } = getViewportSize(_0x72f7e7, _0x562502);
  return Math['ceil'](
    Math['max'](
      Math['hypot'](_0x403dee, _0x4bec8a),
      Math['hypot'](_0x1cfce0 - _0x403dee, _0x4bec8a),
      Math['hypot'](_0x403dee, _0x5edcb6 - _0x4bec8a),
      Math['hypot'](_0x1cfce0 - _0x403dee, _0x5edcb6 - _0x4bec8a),
    ),
  );
}
function formatPercentage(_0xc8184a, { roundUp: roundUp = ![] } = {}) {
  const _0x432a1b = _0xc8184a * 0x2710,
    _0x39592a = (roundUp ? Math['ceil'](_0x432a1b) : Math['round'](_0x432a1b)) / 0x2710;
  return String(Object['is'](_0x39592a, -0x0) ? 0x0 : _0x39592a);
}
function getRelativeRevealGeometry(_0x42bd58, _0x54b955, _0x397395, _0xbcf535) {
  const { width: _0x544e17, height: _0xf93db2 } = getViewportSize(_0x42bd58, _0x54b955),
    _0x18d0ee = Math['hypot'](_0x544e17, _0xf93db2) / Math['SQRT2'],
    _0x157e5a = getRevealRadius(_0x42bd58, _0x54b955, _0x397395, _0xbcf535);
  return {
    x: formatPercentage((_0x397395 / _0x544e17) * 0x64),
    y: formatPercentage((_0xbcf535 / _0xf93db2) * 0x64),
    radius: formatPercentage((_0x157e5a / _0x18d0ee) * 0x64, { roundUp: !![] }),
  };
}
export function runCircularRevealTransition({
  event: event = null,
  sourceElement: sourceElement = null,
  apply: _0x7084f1,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  rootClassName: rootClassName = 'circular-reveal-transitioning',
  duration: duration = DEFAULT_DURATION_MS,
  easing: easing = DEFAULT_EASING,
} = {}) {
  if (typeof _0x7084f1 !== 'function') return null;
  const _0x100680 = documentObject?.['documentElement'];
  if (
    !_0x100680 ||
    isReducedMotionPreferred(windowObject) ||
    typeof documentObject?.['startViewTransition'] !== 'function' ||
    typeof _0x100680['animate'] !== 'function'
  )
    return (_0x7084f1(), null);
  const { x: _0x440139, y: _0x43e918 } = resolveRevealPoint({
    documentObject: documentObject,
    windowObject: windowObject,
    event: event,
    sourceElement: sourceElement,
  });
  let _0xd82491 = ![];
  const _0x8328e2 = () => {
      if (_0xd82491) return undefined;
      return ((_0xd82491 = !![]), _0x7084f1());
    },
    _0x6d8cfc = () => _0x100680['classList']?.['remove'](rootClassName);
  _0x100680['classList']?.['add'](rootClassName);
  let _0x5bf16b;
  try {
    _0x5bf16b = documentObject['startViewTransition'](_0x8328e2);
  } catch {
    return (_0x6d8cfc(), _0x8328e2(), null);
  }
  const _0x53ab4c = _0x5bf16b?.['ready']
    ?.['then'](() => {
      const _0x4bbce2 = getRelativeRevealGeometry(documentObject, windowObject, _0x440139, _0x43e918),
        _0x3e9bdd = _0x100680['animate'](
          {
            clipPath: [
              'circle(0px at ' + _0x4bbce2['x'] + '%\x20' + _0x4bbce2['y'] + '%)',
              'circle(' +
                _0x4bbce2['radius'] +
                '%\x20at\x20' +
                _0x4bbce2['x'] +
                '%\x20' +
                _0x4bbce2['y'] +
                '%)',
            ],
          },
          { duration: duration, easing: easing, pseudoElement: '::view-transition-new(root)' },
        );
      return _0x3e9bdd?.['finished'];
    })
    ['catch'](() => {});
  return (
    Promise['allSettled'](
      [_0x53ab4c, _0x5bf16b?.['finished']]['filter'](
        (_0x201146) => _0x201146 && typeof _0x201146['then'] === 'function',
      ),
    )['finally'](_0x6d8cfc),
    _0x5bf16b
  );
}
