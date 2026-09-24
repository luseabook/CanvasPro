import { screenToWorld } from '../../core/math.js';
import { NODE_MANAGER_DRAG_MIME, hasNodeManagerDragType } from './nodeManagerDragContract.js';
const BLOCKED_DROP_TARGET_SELECTOR =
  '.node-manager-panel, .sidebar-floating, .header, .canvas-controls, [data-ui-stop="1"]';
function getStoreState(_0x3122fe) {
  return _0x3122fe?.['getStateRaw']?.() || _0x3122fe?.['getState']?.() || {};
}
function isPointInsideRect(_0x3c6cbe, _0x43ae73, _0x10e049) {
  return (
    !!_0x10e049 &&
    _0x3c6cbe >= _0x10e049['left'] &&
    _0x3c6cbe <= _0x10e049['right'] &&
    _0x43ae73 >= _0x10e049['top'] &&
    _0x43ae73 <= _0x10e049['bottom']
  );
}
function isBlockedDropTarget(_0x38c425) {
  return !!_0x38c425?.['closest']?.(BLOCKED_DROP_TARGET_SELECTOR);
}
export function resolveNodeManagerDuplicateOffset({
  source: _0x229c19,
  clientX: _0x784432,
  clientY: _0x329732,
  viewport: _0x4fd44e,
} = {}) {
  const _0x2990d7 = screenToWorld(_0x784432, _0x329732, _0x4fd44e || {}),
    _0x39a0dc = (Number(_0x229c19?.['x']) || 0x0) + (Number(_0x229c19?.['width']) || 0x0) / 0x2,
    _0x3580f1 = (Number(_0x229c19?.['y']) || 0x0) + (Number(_0x229c19?.['height']) || 0x0) / 0x2;
  return { dx: _0x2990d7['x'] - _0x39a0dc, dy: _0x2990d7['y'] - _0x3580f1 };
}
export function createNodeManagerDragController({
  graphStore: _0x2ca758,
  wrap: _0x1edb86,
  canvasStage: _0x124d92,
  executeCanvasCommand: _0x5d9cbd,
  onDuplicateFailed: _0x47a2fc,
  onDuplicated: _0x1eb72a,
} = {}) {
  let _0x2260ef = '';
  const _0x54ff22 = (_0x1e79f9) => {
      if (!_0x2260ef && !hasNodeManagerDragType(_0x1e79f9['dataTransfer'])) return;
      if (isBlockedDropTarget(_0x1e79f9['target'])) return;
      const _0x1c9fd7 = _0x124d92?.['getBoundingClientRect']?.();
      if (!isPointInsideRect(_0x1e79f9['clientX'], _0x1e79f9['clientY'], _0x1c9fd7)) return;
      _0x1e79f9['preventDefault']();
      if (_0x1e79f9['dataTransfer']) _0x1e79f9['dataTransfer']['dropEffect'] = 'copy';
    },
    _0x1e0976 = (_0x1d5397) => {
      const _0x9d7cfa = String(
        _0x1d5397['dataTransfer']?.['getData']?.(NODE_MANAGER_DRAG_MIME) || _0x2260ef || '',
      )['trim']();
      if (!_0x9d7cfa || isBlockedDropTarget(_0x1d5397['target'])) return;
      const _0x3bac9e = _0x124d92?.['getBoundingClientRect']?.();
      if (!isPointInsideRect(_0x1d5397['clientX'], _0x1d5397['clientY'], _0x3bac9e)) return;
      const _0x42d609 = getStoreState(_0x2ca758),
        _0x5206a6 = _0x42d609['nodes']?.[_0x9d7cfa];
      if (!_0x5206a6) return;
      (_0x1d5397['preventDefault'](), _0x1d5397['stopPropagation']());
      const _0x2bb09b = resolveNodeManagerDuplicateOffset({
          source: _0x5206a6,
          clientX: _0x1d5397['clientX'],
          clientY: _0x1d5397['clientY'],
          viewport: _0x42d609['viewport'],
        }),
        _0x5e61b8 = _0x5d9cbd?.('node.duplicate', {
          ids: [_0x9d7cfa],
          dx: _0x2bb09b['dx'],
          dy: _0x2bb09b['dy'],
          edgePolicy: 'all-touching',
        });
      _0x2260ef = '';
      if (_0x5e61b8?.['ok'] === ![]) {
        _0x47a2fc?.(_0x5e61b8);
        return;
      }
      const _0x54aa08 = _0x5e61b8?.['result']?.['ids']?.[0x0];
      if (_0x54aa08) _0x1eb72a?.(_0x54aa08);
    };
  return (
    _0x1edb86?.['addEventListener']?.('dragover', _0x54ff22),
    _0x1edb86?.['addEventListener']?.('drop', _0x1e0976),
    {
      bindNodeRow({ trigger: _0x25d7d5, row: _0x2e3437, nodeId: _0x432ee9 } = {}) {
        if (!_0x25d7d5) return;
        ((_0x25d7d5['draggable'] = !![]),
          _0x25d7d5['addEventListener']('dragstart', (_0x4fe834) => {
            ((_0x2260ef = _0x432ee9),
              _0x2e3437?.['classList']?.['add']('is-dragging'),
              _0x4fe834['dataTransfer']?.['setData'](NODE_MANAGER_DRAG_MIME, _0x432ee9));
            if (_0x4fe834['dataTransfer']) _0x4fe834['dataTransfer']['effectAllowed'] = 'copy';
          }),
          _0x25d7d5['addEventListener']('dragend', () => {
            ((_0x2260ef = ''), _0x2e3437?.['classList']?.['remove']('is-dragging'));
          }));
      },
      destroy() {
        ((_0x2260ef = ''),
          _0x1edb86?.['removeEventListener']?.('dragover', _0x54ff22),
          _0x1edb86?.['removeEventListener']?.('drop', _0x1e0976));
      },
    }
  );
}
