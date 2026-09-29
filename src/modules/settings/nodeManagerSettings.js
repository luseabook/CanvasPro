import {
  NODE_MANAGER_PLACEMENT_EVENT,
  normalizeNodeManagerPlacement,
} from '../nodeManager/nodeManagerPlacement.js';
const NODE_MANAGER_PLACEMENT_BUTTONS = Object['freeze']([
  Object['freeze']({ id: 'btnNodeManagerPlacementLeft', placement: 'left' }),
  Object['freeze']({ id: 'btnNodeManagerPlacementRight', placement: 'right' }),
  Object['freeze']({ id: 'btnNodeManagerPlacementBottom', placement: 'bottom' }),
]);
function readNodeManagerPlacement(_0x7ba661) {
  try {
    const _0x2f9ecb = _0x7ba661?.['getStateRaw']?.() || _0x7ba661?.['getState']?.() || {};
    return normalizeNodeManagerPlacement(_0x2f9ecb['ui']?.['nodeManagerPlacement']);
  } catch {
    return normalizeNodeManagerPlacement();
  }
}
function dispatchPlacementChange(_0x4bcb69, _0x5db3fa) {
  if (typeof _0x4bcb69?.['dispatchEvent'] !== 'function') return;
  const _0x6f56ff = _0x4bcb69?.['CustomEvent'] || globalThis['CustomEvent'];
  if (typeof _0x6f56ff !== 'function') return;
  _0x4bcb69['dispatchEvent'](
    new _0x6f56ff(NODE_MANAGER_PLACEMENT_EVENT, { detail: { placement: _0x5db3fa } }),
  );
}
export function initNodeManagerSettings({
  uiStore: _0x3a72b0,
  root: root = globalThis['document'],
  eventTarget: eventTarget = globalThis['window'],
} = {}) {
  const _0x1c2f94 = NODE_MANAGER_PLACEMENT_BUTTONS['map'](({ id: _0x5ecf3c, placement: _0x11d07a }) => ({
    button: root?.['getElementById']?.(_0x5ecf3c) || null,
    placement: _0x11d07a,
  }));
  let _0x3d2187 = null;
  const _0x3cd718 = (_0x1491c7) => {
      const _0x5eeb13 = normalizeNodeManagerPlacement(_0x1491c7);
      return (
        _0x1c2f94['forEach'](({ button: _0xa08920, placement: _0xdb7c72 }) => {
          const _0x11c9e1 = _0xdb7c72 === _0x5eeb13;
          (_0xa08920?.['classList']?.['toggle']('active', _0x11c9e1),
            _0xa08920?.['setAttribute']?.('aria-pressed', _0x11c9e1 ? 'true' : 'false'));
        }),
        _0x3d2187 !== _0x5eeb13 && ((_0x3d2187 = _0x5eeb13), dispatchPlacementChange(eventTarget, _0x5eeb13)),
        _0x5eeb13
      );
    },
    _0x319e5f = new Map();
  (_0x1c2f94['forEach'](({ button: _0x134a86, placement: _0x410ca0 }) => {
    if (!_0x134a86) return;
    const _0xf052a2 = () => {
      const _0x327d92 = normalizeNodeManagerPlacement(_0x410ca0);
      (_0x3a72b0?.['setNodeManagerPlacement']?.(_0x327d92), _0x3cd718(_0x327d92));
    };
    (_0x319e5f['set'](_0x134a86, _0xf052a2), _0x134a86['addEventListener']?.('click', _0xf052a2));
  }),
    _0x3cd718(readNodeManagerPlacement(_0x3a72b0)));
  const _0x107e21 = _0x3a72b0?.['subscribeSelector']?.(
    (_0x4fa731) => normalizeNodeManagerPlacement(_0x4fa731['ui']?.['nodeManagerPlacement']),
    _0x3cd718,
  );
  return () => {
    (_0x319e5f['forEach']((_0x21e4ed, _0x10952a) => {
      _0x10952a['removeEventListener']?.('click', _0x21e4ed);
    }),
      _0x319e5f['clear'](),
      _0x107e21?.());
  };
}
