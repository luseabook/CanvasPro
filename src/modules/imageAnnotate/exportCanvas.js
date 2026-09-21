import { getTextScalePair } from './textControls.js';
import {
  drawRoundBrushStroke,
  getEraserClearLineWidth,
  getBrushLineWidth,
  mapBrushPoints,
} from '../imageEditorBrushStyle.js';
import { drawNumberLabelCommand } from './numberLabels.js';
const canvasToBlob = (_0x1e7d89, _0x1d139c, _0x58819e) =>
    new Promise((_0x579c9d) => _0x1e7d89.toBlob(_0x579c9d, _0x1d139c, _0x58819e)),
  renderCommandToNaturalCanvas = ({
    ctx: _0x1c4317,
    cmd: _0x58276d,
    scaleX: _0x5be26b,
    scaleY: _0x6510a0,
    isEraseScene: _0x1a406c,
    defaultTextColor: _0x5f3e6e,
    numberLabelBackgroundColor: numberLabelBackgroundColor = '',
  } = {}) => {
    if (_0x1a406c) return;
    if (_0x58276d.type === 'brush') {
      (_0x1c4317.save(),
        drawRoundBrushStroke(_0x1c4317, {
          points: mapBrushPoints(_0x58276d.points, _0x5be26b, _0x6510a0),
          lineWidth: getBrushLineWidth(_0x58276d.sizeWorld, _0x5be26b, 'brush'),
          strokeStyle: _0x58276d.color,
          fillStyle: _0x58276d.color,
          globalCompositeOperation: 'source-over',
        }),
        _0x1c4317.restore());
      return;
    }
    if (_0x58276d.type === 'eraser') {
      (_0x1c4317.save(),
        drawRoundBrushStroke(_0x1c4317, {
          points: mapBrushPoints(_0x58276d.points, _0x5be26b, _0x6510a0),
          lineWidth: getEraserClearLineWidth(getBrushLineWidth(_0x58276d.sizeWorld, _0x5be26b, 'eraser')),
          strokeStyle: '#000',
          fillStyle: '#000',
          globalCompositeOperation: 'destination-out',
        }),
        _0x1c4317.restore());
      return;
    }
    if (_0x58276d.type === 'rect') {
      const _0x2a57bb = _0x58276d.x1 * _0x5be26b,
        _0x4ccb3f = _0x58276d.y1 * _0x6510a0,
        _0x2874b9 = _0x58276d.x2 * _0x5be26b,
        _0x440d85 = _0x58276d.y2 * _0x6510a0,
        _0x4986a3 = Math.min(_0x2a57bb, _0x2874b9),
        _0x48a165 = Math.min(_0x4ccb3f, _0x440d85),
        _0x14b590 = Math.abs(_0x2874b9 - _0x2a57bb),
        _0x3aa880 = Math.abs(_0x440d85 - _0x4ccb3f);
      (_0x1c4317.save(),
        (_0x1c4317.globalCompositeOperation = 'source-over'),
        (_0x1c4317.strokeStyle = _0x58276d.color),
        (_0x1c4317.lineWidth = getBrushLineWidth(_0x58276d.sizeWorld, _0x5be26b, 'brush')),
        _0x1c4317.strokeRect(_0x4986a3, _0x48a165, _0x14b590, _0x3aa880),
        _0x1c4317.restore());
      return;
    }
    if (_0x58276d.type === 'text') {
      const _0x2b8f49 = _0x58276d.x * _0x5be26b,
        _0x550e7f = _0x58276d.y * _0x6510a0,
        _0x53b830 = Math.max(1, _0x58276d.sizeWorld * _0x5be26b),
        _0x32e24a = getTextScalePair(_0x58276d),
        _0x46b599 = Number(_0x58276d.rotation) || 0;
      (_0x1c4317.save(),
        (_0x1c4317.globalCompositeOperation = 'source-over'),
        (_0x1c4317.fillStyle = _0x58276d.color || _0x5f3e6e),
        (_0x1c4317.font = _0x53b830 + 'px sans-serif'),
        (_0x1c4317.textBaseline = 'top'),
        _0x1c4317.translate(_0x2b8f49, _0x550e7f),
        _0x1c4317.rotate(_0x46b599),
        _0x1c4317.scale(_0x32e24a.scaleX, _0x32e24a.scaleY),
        _0x1c4317.fillText(String(_0x58276d.text || ''), 0, 0),
        _0x1c4317.restore());
      return;
    }
    _0x58276d.type === 'number-label' &&
      drawNumberLabelCommand({
        ctx: _0x1c4317,
        cmd: _0x58276d,
        scaleX: _0x5be26b,
        scaleY: _0x6510a0,
        defaultColor: _0x5f3e6e,
        backgroundColor: numberLabelBackgroundColor,
      });
  };
export const exportAnnotateCanvasBlob = async ({
  documentRef: documentRef = null,
  node: _0x33bd57,
  imgEl: _0x5a3eff,
  imgUrl: _0x3157ec,
  commands: _0x58df5b,
  useWhiteboardBase: _0x294f5f,
  isEraseScene: _0x2efb7d,
  loadImage: _0x584892,
  getCurrentFlipState: _0x1a26e2,
  applyFlipTransformToContext: _0x5adaff,
  createSelectionMaskCanvas: _0x36c738,
  canvasWhiteColor: _0x308413,
  defaultTextColor: _0x4db2fe,
} = {}) => {
  const _0xa1baca = documentRef || globalThis.document;
  let _0x271685 = null,
    _0x324511 = 0,
    _0x110a78 = 0;
  _0x294f5f &&
    ((_0x324511 = Number(_0x5a3eff?.naturalWidth || _0x5a3eff?.width || 0)),
    (_0x110a78 = Number(_0x5a3eff?.naturalHeight || _0x5a3eff?.height || 0)));
  (!_0x324511 || !_0x110a78 || !_0x294f5f) &&
    ((_0x271685 = await _0x584892(_0x3157ec)),
    (_0x324511 = _0x271685.naturalWidth || _0x271685.width),
    (_0x110a78 = _0x271685.naturalHeight || _0x271685.height));
  const _0x590b05 = _0xa1baca.createElement('canvas');
  ((_0x590b05.width = _0x324511), (_0x590b05.height = _0x110a78));
  const _0xd82c28 = _0x590b05.getContext('2d'),
    _0x16833b = _0x1a26e2();
  !_0x2efb7d &&
    ((_0xd82c28.fillStyle = _0x308413),
    _0xd82c28.fillRect(0, 0, _0x324511, _0x110a78),
    _0xd82c28.save(),
    _0x5adaff(_0xd82c28, _0x324511, _0x110a78, _0x16833b));
  !_0x294f5f && _0xd82c28.drawImage(_0x271685, 0, 0, _0x324511, _0x110a78);
  const _0x4ec1f0 = _0x324511 / (_0x33bd57?.width || 1),
    _0x38b33d = _0x110a78 / (_0x33bd57?.height || 1);
  if (_0x2efb7d) {
    const _0x25640a = _0x36c738(_0x324511, _0x110a78, _0x4ec1f0, _0x38b33d);
    (_0xd82c28.save(),
      (_0xd82c28.globalCompositeOperation = 'destination-out'),
      _0xd82c28.drawImage(_0x25640a, 0, 0),
      _0xd82c28.restore());
  }
  (Array.isArray(_0x58df5b) ? _0x58df5b : []).forEach((_0xeff3a3) =>
    renderCommandToNaturalCanvas({
      ctx: _0xd82c28,
      cmd: _0xeff3a3,
      scaleX: _0x4ec1f0,
      scaleY: _0x38b33d,
      isEraseScene: _0x2efb7d,
      defaultTextColor: _0x4db2fe,
      numberLabelBackgroundColor: _0x308413,
    }),
  );
  !_0x2efb7d && _0xd82c28.restore();
  const _0x14efd7 = _0x2efb7d ? 'image/png' : 'image/jpeg',
    _0x38e4b8 = _0x2efb7d ? undefined : 0.9,
    _0x242a51 = await canvasToBlob(_0x590b05, _0x14efd7, _0x38e4b8);
  if (!_0x242a51) throw new Error('Canvas 导出失败');
  return { blob: _0x242a51, exportType: _0x14efd7, naturalWidth: _0x324511, naturalHeight: _0x110a78 };
};
