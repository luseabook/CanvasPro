export const WORKSPACE_MARQUEE_DRAG_THRESHOLD = 0x5;
function normalizeCoordinate(_0x3054c1) {
  const _0x4a0d88 = Number(_0x3054c1);
  return Number['isFinite'](_0x4a0d88) ? _0x4a0d88 : 0x0;
}
function normalizeSelector(_0x165152) {
  return String(_0x165152 || '')['trim']();
}
function clamp(_0x316112, _0x2cc6aa, _0x22a801) {
  return Math['max'](_0x2cc6aa, Math['min'](_0x22a801, _0x316112));
}
export function hasWorkspaceMarqueeDrag(
  _0x466632,
  _0x185d64,
  _0x410c14,
  _0x1c6e0d,
  _0x2775f8 = WORKSPACE_MARQUEE_DRAG_THRESHOLD,
) {
  const _0x26a122 = normalizeCoordinate(_0x410c14) - normalizeCoordinate(_0x466632),
    _0x5eceb2 = normalizeCoordinate(_0x1c6e0d) - normalizeCoordinate(_0x185d64);
  return Math['hypot'](_0x26a122, _0x5eceb2) >= Math['max'](0x0, normalizeCoordinate(_0x2775f8));
}
export function createWorkspaceMarqueeRect(_0x20647a, _0x19ea34, _0x229115, _0x22a8d6, _0x3d33dd = null) {
  let _0x4dad71 = normalizeCoordinate(_0x20647a),
    _0x329f70 = normalizeCoordinate(_0x19ea34),
    _0x2a1edf = normalizeCoordinate(_0x229115),
    _0x491a97 = normalizeCoordinate(_0x22a8d6);
  if (_0x3d33dd) {
    const _0x54d21b = normalizeCoordinate(_0x3d33dd['left']),
      _0x173c89 = normalizeCoordinate(_0x3d33dd['top']),
      _0x188e1e = Math['max'](_0x54d21b, normalizeCoordinate(_0x3d33dd['right'])),
      _0x54d3f8 = Math['max'](_0x173c89, normalizeCoordinate(_0x3d33dd['bottom']));
    ((_0x4dad71 = clamp(_0x4dad71, _0x54d21b, _0x188e1e)),
      (_0x2a1edf = clamp(_0x2a1edf, _0x54d21b, _0x188e1e)),
      (_0x329f70 = clamp(_0x329f70, _0x173c89, _0x54d3f8)),
      (_0x491a97 = clamp(_0x491a97, _0x173c89, _0x54d3f8)));
  }
  const _0x424cb0 = Math['min'](_0x4dad71, _0x2a1edf),
    _0xd51337 = Math['min'](_0x329f70, _0x491a97),
    _0x3b576d = Math['max'](_0x4dad71, _0x2a1edf),
    _0xee0d16 = Math['max'](_0x329f70, _0x491a97);
  return {
    left: _0x424cb0,
    top: _0xd51337,
    right: _0x3b576d,
    bottom: _0xee0d16,
    width: _0x3b576d - _0x424cb0,
    height: _0xee0d16 - _0xd51337,
  };
}
export function doesWorkspaceMarqueeIntersect(_0x1f2fdb, _0x79fbff) {
  if (!_0x1f2fdb || !_0x79fbff) return ![];
  return !(
    normalizeCoordinate(_0x79fbff['right']) < normalizeCoordinate(_0x1f2fdb['left']) ||
    normalizeCoordinate(_0x79fbff['left']) > normalizeCoordinate(_0x1f2fdb['right']) ||
    normalizeCoordinate(_0x79fbff['bottom']) < normalizeCoordinate(_0x1f2fdb['top']) ||
    normalizeCoordinate(_0x79fbff['top']) > normalizeCoordinate(_0x1f2fdb['bottom'])
  );
}
export function resolveWorkspaceMarqueeSelection(
  _0x480e7e = [],
  _0x212050 = [],
  { additive: additive = ![] } = {},
) {
  const _0x41ce6f = new Set(
    additive && Array['isArray'](_0x212050)
      ? _0x212050['map']((_0x4241ab) => String(_0x4241ab ?? '')['trim']())['filter'](Boolean)
      : [],
  );
  return (
    (Array['isArray'](_0x480e7e) ? _0x480e7e : [])
      ['map']((_0x10d650) => String(_0x10d650 ?? '')['trim']())
      ['filter'](Boolean)
      ['forEach']((_0x591508) => _0x41ce6f['add'](_0x591508)),
    [..._0x41ce6f]
  );
}
export function createWorkspaceMarqueeSelectionController({
  root: _0x3e0afc,
  documentObject: _0xef9fa2,
  windowObject: _0x2fea08,
  getConfig: _0x13030a,
  surfaceSelector: _0x5d8e4b,
  resolveSurface: resolveSurface = null,
  blockedControlSelector: blockedControlSelector = '',
  overlayClassName: overlayClassName = '',
  itemSelector: _0x119678,
  getItemId: _0x3b4613,
  hitClassName: hitClassName = 'is-marquee-hit',
  rootClassName: rootClassName = 'is-marquee-selecting',
  dragThreshold: dragThreshold = WORKSPACE_MARQUEE_DRAG_THRESHOLD,
  onActivate: onActivate = null,
  onCommit: onCommit = null,
} = {}) {
  if (!_0x3e0afc || !_0xef9fa2 || !_0x2fea08 || typeof _0x13030a !== 'function')
    throw new Error('workspace marquee selection controller dependencies are incomplete');
  const _0x3a4b8d = normalizeSelector(_0x5d8e4b),
    _0x4d7e94 = normalizeSelector(blockedControlSelector),
    _0x5a5d94 = normalizeSelector(overlayClassName),
    _0x5a21fd = normalizeSelector(_0x119678),
    _0x4ddda1 = normalizeSelector(hitClassName),
    _0x294887 = normalizeSelector(rootClassName),
    _0x5ebc77 = typeof _0x3b4613 === 'function' ? _0x3b4613 : null;
  if (!_0x3a4b8d) throw new Error('workspace marquee selection surfaceSelector is required');
  if (!_0x5a21fd || !_0x5ebc77)
    throw new Error('workspace marquee selection itemSelector and getItemId are required');
  let _0x4793ae = null,
    _0x4af8ec = ![];
  const _0x26d81d = () => {
      const _0x36ddfc =
          typeof _0x3e0afc['querySelectorAll'] === 'function' ? _0x3e0afc : _0x4793ae?.['surface'],
        _0x76c089 = _0x4793ae?.['itemSelector'] || _0x5a21fd,
        _0x11a32d = _0x4793ae?.['hitClassName'] || _0x4ddda1;
      _0x76c089 &&
        _0x11a32d &&
        _0x36ddfc?.['querySelectorAll']?.(_0x76c089)['forEach']((_0x1a6f14) =>
          _0x1a6f14['classList']['remove'](_0x11a32d),
        );
      _0x4793ae?.['overlay']?.['remove']?.();
      const _0x9c5c27 = _0x4793ae?.['rootClassName'] || _0x294887;
      if (_0x9c5c27) _0x3e0afc['classList']['remove'](_0x9c5c27);
    },
    _0x2efa61 = (_0x2102c8) => {
      const _0x8bc8cf = _0x4793ae;
      if (!_0x8bc8cf || _0x8bc8cf['pointerId'] !== _0x2102c8['pointerId']) return ![];
      if (
        !_0x8bc8cf['active'] &&
        !hasWorkspaceMarqueeDrag(
          _0x8bc8cf['startX'],
          _0x8bc8cf['startY'],
          _0x2102c8['clientX'],
          _0x2102c8['clientY'],
          _0x8bc8cf['dragThreshold'],
        )
      )
        return ![];
      if (!_0x8bc8cf['active']) {
        ((_0x8bc8cf['active'] = !![]),
          (_0x8bc8cf['overlay'] = _0xef9fa2['createElement']('div')),
          (_0x8bc8cf['overlay']['className'] = [
            _0x8bc8cf['baseOverlayClassName'],
            _0x8bc8cf['overlayClassName'],
          ]
            ['filter'](Boolean)
            ['join']('\x20')),
          _0x8bc8cf['overlay']['setAttribute']('aria-hidden', 'true'),
          _0x3e0afc['appendChild'](_0x8bc8cf['overlay']));
        if (_0x8bc8cf['rootClassName']) _0x3e0afc['classList']['add'](_0x8bc8cf['rootClassName']);
        onActivate?.();
        try {
          _0x3e0afc['setPointerCapture']?.(_0x2102c8['pointerId']);
        } catch {}
      }
      (_0x2102c8['preventDefault'](), _0x2102c8['stopPropagation']());
      const _0x24423c = createWorkspaceMarqueeRect(
        _0x8bc8cf['startX'],
        _0x8bc8cf['startY'],
        _0x2102c8['clientX'],
        _0x2102c8['clientY'],
        _0x8bc8cf['surface']['getBoundingClientRect'](),
      );
      Object['assign'](_0x8bc8cf['overlay']['style'], {
        left: _0x24423c['left'] + 'px',
        top: _0x24423c['top'] + 'px',
        width: _0x24423c['width'] + 'px',
        height: _0x24423c['height'] + 'px',
      });
      const _0x5cb875 = [];
      return (
        _0x8bc8cf['surface']['querySelectorAll'](_0x8bc8cf['itemSelector'])['forEach']((_0x30bdf0) => {
          const _0xec8868 = doesWorkspaceMarqueeIntersect(_0x24423c, _0x30bdf0['getBoundingClientRect']());
          _0x8bc8cf['hitClassName'] && _0x30bdf0['classList']['toggle'](_0x8bc8cf['hitClassName'], _0xec8868);
          if (_0xec8868) _0x5cb875['push'](String(_0x8bc8cf['getItemId'](_0x30bdf0) || '')['trim']());
        }),
        (_0x8bc8cf['hitIds'] = _0x5cb875['filter'](Boolean)),
        !![]
      );
    },
    _0x491920 = (_0x44e44b, { cancelled: cancelled = ![] } = {}) => {
      const _0x9527bd = _0x4793ae;
      if (!_0x9527bd || _0x9527bd['pointerId'] !== _0x44e44b['pointerId']) return ![];
      if (_0x9527bd['active'] && !cancelled) _0x2efa61(_0x44e44b);
      const _0x5e9ee3 = _0x9527bd['active'] && !cancelled,
        _0xc399a2 = _0x5e9ee3
          ? resolveWorkspaceMarqueeSelection(_0x9527bd['hitIds'], _0x9527bd['initialSelectedIds'], {
              additive: _0x9527bd['additive'],
            })
          : [];
      (_0x26d81d(), (_0x4793ae = null));
      try {
        _0x3e0afc['hasPointerCapture']?.(_0x44e44b['pointerId']) &&
          _0x3e0afc['releasePointerCapture'](_0x44e44b['pointerId']);
      } catch {}
      if (!_0x5e9ee3) return ![];
      return (
        _0x44e44b['preventDefault'](),
        _0x44e44b['stopPropagation'](),
        (_0x4af8ec = !![]),
        _0x2fea08['setTimeout'](() => {
          _0x4af8ec = ![];
        }, 0x0),
        _0x9527bd['commit'](_0xc399a2),
        onCommit?.(_0xc399a2),
        !![]
      );
    },
    _0xdee925 = () => {
      const _0x58d684 = _0x4793ae;
      (_0x26d81d(), (_0x4793ae = null));
      if (!_0x58d684) return ![];
      try {
        _0x3e0afc['hasPointerCapture']?.(_0x58d684['pointerId']) &&
          _0x3e0afc['releasePointerCapture'](_0x58d684['pointerId']);
      } catch {}
      return !![];
    },
    _0x1f32e4 = (_0x3552b1) => _0x2efa61(_0x3552b1),
    _0x49d723 = (_0x5d6d82) => _0x491920(_0x5d6d82),
    _0x1162ba = (_0x38a575) => _0x491920(_0x38a575, { cancelled: !![] });
  return (
    _0x2fea08['addEventListener']?.('pointermove', _0x1f32e4, !![]),
    _0x2fea08['addEventListener']?.('pointerup', _0x49d723, !![]),
    _0x2fea08['addEventListener']?.('pointercancel', _0x1162ba, !![]),
    {
      begin(_0x344040) {
        if (
          _0x344040['button'] !== 0x0 ||
          _0x344040['isPrimary'] === ![] ||
          (_0x344040['pointerType'] && _0x344040['pointerType'] !== 'mouse')
        )
          return ![];
        const _0x4161bd = resolveSurface
          ? resolveSurface(_0x344040)
          : _0x344040['target']['closest']?.(_0x3a4b8d);
        if (!_0x4161bd || !_0x3e0afc['contains'](_0x4161bd)) return ![];
        const _0x4c17c3 = _0x13030a(_0x4161bd);
        if (
          !_0x4c17c3?.['enabled'] ||
          typeof _0x4c17c3['commit'] !== 'function' ||
          _0x4c17c3['canBegin']?.(_0x344040) === ![]
        )
          return ![];
        const _0x1389e3 = normalizeSelector(_0x4c17c3['blockedControlSelector'] ?? _0x4d7e94),
          _0x5c4bc4 = normalizeSelector(_0x4c17c3['itemSelector'] || _0x5a21fd),
          _0x45c4d5 = typeof _0x4c17c3['getItemId'] === 'function' ? _0x4c17c3['getItemId'] : _0x5ebc77,
          _0x2d35ee = _0x1389e3 ? _0x344040['target']['closest']?.(_0x1389e3) : null;
        if (_0x2d35ee && !_0x2d35ee['matches']?.(_0x5c4bc4)) return ![];
        return (
          _0xdee925(),
          (_0x4793ae = {
            pointerId: _0x344040['pointerId'],
            startX: Number(_0x344040['clientX']) || 0x0,
            startY: Number(_0x344040['clientY']) || 0x0,
            additive:
              typeof _0x4c17c3['additive'] === 'boolean'
                ? _0x4c17c3['additive']
                : _0x344040['shiftKey'] === !![] ||
                  _0x344040['ctrlKey'] === !![] ||
                  _0x344040['metaKey'] === !![],
            initialSelectedIds: Array['isArray'](_0x4c17c3['selectedIds'])
              ? [..._0x4c17c3['selectedIds']]
              : [],
            hitIds: [],
            active: ![],
            overlay: null,
            baseOverlayClassName: _0x5a5d94,
            overlayClassName: normalizeSelector(_0x4c17c3['overlayClassName']),
            itemSelector: _0x5c4bc4,
            hitClassName: normalizeSelector(_0x4c17c3['hitClassName'] ?? _0x4ddda1),
            rootClassName: normalizeSelector(_0x4c17c3['rootClassName'] ?? _0x294887),
            getItemId: _0x45c4d5,
            dragThreshold: Math['max'](0x0, normalizeCoordinate(_0x4c17c3['dragThreshold'] ?? dragThreshold)),
            surface: _0x4161bd,
            commit: _0x4c17c3['commit'],
          }),
          !![]
        );
      },
      update: _0x2efa61,
      finish: _0x491920,
      cancel: _0xdee925,
      consumeClick(_0x54f2a5) {
        if (!_0x4af8ec) return ![];
        return ((_0x4af8ec = ![]), _0x54f2a5['preventDefault'](), _0x54f2a5['stopPropagation'](), !![]);
      },
      destroy() {
        (_0xdee925(),
          _0x2fea08['removeEventListener']?.('pointermove', _0x1f32e4, !![]),
          _0x2fea08['removeEventListener']?.('pointerup', _0x49d723, !![]),
          _0x2fea08['removeEventListener']?.('pointercancel', _0x1162ba, !![]));
      },
    }
  );
}
