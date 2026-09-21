import { addEdgeWithPolicies } from './EdgeController.js';
import {
  beginSelectionBoxPreview,
  cancelSelectionBoxPreview,
  updateSelectionBoxPreview,
} from '../../core/selectionBoxPreview.js';
export function createSelectionController({
  store: _0x4d01f3,
  screenToWorld: _0x5d66e3,
  isNodeType: _0x325f33,
  isValidConnection: _0x1c6aa8,
}) {
  function _0x25f597(_0x3b3cc6, _0x15d180, _0x29a2ec) {
    ((_0x3b3cc6.isBoxSelecting = true),
      (_0x3b3cc6.boxStartX = _0x15d180),
      (_0x3b3cc6.boxStartY = _0x29a2ec),
      (_0x3b3cc6._boxSelectionActivated = false),
      cancelSelectionBoxPreview());
  }
  function _0x555776(_0x28ad43, _0x801455, _0x31cea4) {
    const _0x47fd34 = {
      x1: Math.min(_0x28ad43.boxStartX, _0x801455),
      y1: Math.min(_0x28ad43.boxStartY, _0x31cea4),
      x2: Math.max(_0x28ad43.boxStartX, _0x801455),
      y2: Math.max(_0x28ad43.boxStartY, _0x31cea4),
    };
    if (!_0x28ad43._boxSelectionActivated) {
      const _0x1546a1 = Math.hypot(_0x801455 - _0x28ad43.boxStartX, _0x31cea4 - _0x28ad43.boxStartY);
      _0x1546a1 > 3 &&
        ((_0x28ad43._boxSelectionActivated = true), beginSelectionBoxPreview({ active: true, ..._0x47fd34 }));
    }
    _0x28ad43._boxSelectionActivated && updateSelectionBoxPreview({ active: true, ..._0x47fd34 });
  }
  function _0xb049ad(_0x5c603f, _0x3369b6, _0x3c935d) {
    cancelSelectionBoxPreview();
    const _0x4ae228 = _0x4d01f3.getState(),
      _0x5444c6 = _0x4ae228.pickConnectMode,
      { viewport: _0x51939b, nodes: _0x1dea02 } = _0x4ae228,
      { boxStartX: _0x150dfb, boxStartY: _0x5e9961 } = _0x5c603f;
    if (
      !Number.isFinite(_0x150dfb) ||
      !Number.isFinite(_0x5e9961) ||
      !Number.isFinite(_0x3369b6) ||
      !Number.isFinite(_0x3c935d)
    )
      return (
        _0x4d01f3.setSelectionBox({ active: false }),
        (_0x5c603f.isBoxSelecting = false),
        { earlyReturn: false, didAct: false }
      );
    const _0x1267a3 = Math.min(_0x150dfb, _0x3369b6),
      _0x160891 = Math.max(_0x150dfb, _0x3369b6),
      _0x3f3462 = Math.min(_0x5e9961, _0x3c935d),
      _0x110cba = Math.max(_0x5e9961, _0x3c935d),
      { x: _0x247b67, y: _0x1639f1 } = _0x5d66e3(_0x1267a3, _0x3f3462, _0x51939b),
      { x: _0x2c80ac, y: _0x27e779 } = _0x5d66e3(_0x160891, _0x110cba, _0x51939b);
    if (
      !Number.isFinite(_0x247b67) ||
      !Number.isFinite(_0x1639f1) ||
      !Number.isFinite(_0x2c80ac) ||
      !Number.isFinite(_0x27e779)
    )
      return (
        _0x4d01f3.setSelectionBox({ active: false }),
        (_0x5c603f.isBoxSelecting = false),
        { earlyReturn: false, didAct: false }
      );
    if (!_0x5444c6?.active && _0x4ae228.connOverlay?.srcId)
      return (
        _0x4d01f3.setSelectionBox({ active: false }),
        (_0x5c603f.isBoxSelecting = false),
        { earlyReturn: false, didAct: false }
      );
    if (_0x5444c6 && _0x5444c6.active) {
      for (const _0x3bb871 of Object.values(_0x1dea02)) {
        if (_0x3bb871.id === _0x5444c6.sourceNodeId || _0x325f33(_0x3bb871, 'group')) continue;
        const _0x3d9f41 = _0x3bb871.x + (_0x3bb871.width || 0x104) / 2,
          _0x2e9c05 = _0x3bb871.y + (_0x3bb871.height || 100) / 2;
        if (
          _0x3d9f41 >= _0x247b67 &&
          _0x3d9f41 <= _0x2c80ac &&
          _0x2e9c05 >= _0x1639f1 &&
          _0x2e9c05 <= _0x27e779
        ) {
          const _0x1131d7 = _0x5444c6.handleDirection === 'left',
            _0x1eee6d = _0x1131d7 ? _0x3bb871.id : _0x5444c6.sourceNodeId,
            _0x1416c5 = _0x1131d7 ? _0x5444c6.sourceNodeId : _0x3bb871.id;
          if (_0x1dea02[_0x1eee6d] && _0x1dea02[_0x1eee6d].type === 'group') continue;
          if (!_0x1c6aa8(_0x1dea02[_0x1eee6d], _0x1dea02[_0x1416c5])) continue;
          addEdgeWithPolicies({ sourceId: _0x1eee6d, targetId: _0x1416c5 });
        }
      }
      return (
        _0x4d01f3.setSelectionBox({ active: false }),
        (_0x5c603f.isBoxSelecting = false),
        { earlyReturn: true, didAct: true }
      );
    }
    const _0x4928e6 = [];
    for (const _0xaa03f8 of Object.values(_0x1dea02)) {
      const _0x10fdf1 = _0xaa03f8.x + (_0xaa03f8.width || 0x104),
        _0x4ecbc7 = _0xaa03f8.y + (_0xaa03f8.height || 100);
      if (_0x325f33(_0xaa03f8, 'group')) {
        const _0x1906d6 =
          _0xaa03f8.x >= _0x247b67 &&
          _0x10fdf1 <= _0x2c80ac &&
          _0xaa03f8.y >= _0x1639f1 &&
          _0x4ecbc7 <= _0x27e779;
        if (_0x1906d6) _0x4928e6.push(_0xaa03f8.id);
      } else {
        const _0x41f238 = !(
          _0xaa03f8.x > _0x2c80ac ||
          _0x10fdf1 < _0x247b67 ||
          _0xaa03f8.y > _0x27e779 ||
          _0x4ecbc7 < _0x1639f1
        );
        if (_0x41f238) _0x4928e6.push(_0xaa03f8.id);
      }
    }
    return (
      _0x4d01f3.setSelectionMeta({ source: 'box' }),
      _0x4d01f3.setSelectedNodes(_0x4928e6),
      _0x4d01f3.setSelectionBox({ active: false }),
      (_0x5c603f.isBoxSelecting = false),
      { earlyReturn: false, didAct: true }
    );
  }
  return { startBoxSelecting: _0x25f597, updateBoxSelecting: _0x555776, finishBoxSelecting: _0xb049ad };
}
