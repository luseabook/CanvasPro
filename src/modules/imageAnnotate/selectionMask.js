import {
  buildBinaryBoundaryMask,
  floodFillRegion,
  paintFilledRegion,
  sealRegionToBoundary,
} from '../bucketFill.js';
import {
  drawRoundBrushStroke,
  getEraserClearLineWidth,
  getBrushLineWidth,
  mapBrushPoints,
} from '../imageEditorBrushStyle.js';
const getBoundaryCommands = (_0x138fb3, _0x235f1f) =>
  (Array.isArray(_0x138fb3) ? _0x138fb3 : [])
    .slice(0, _0x235f1f)
    .filter(
      (_0x388c17) =>
        _0x388c17?.type === 'brush' || _0x388c17?.type === 'rect' || _0x388c17?.type === 'eraser',
    );
export const buildSelectionMaskCanvas = ({
  documentRef: documentRef = null,
  commands: _0x5dd1ee,
  naturalW: _0x5e585c,
  naturalH: _0x42d597,
  scaleX: _0x27826b,
  scaleY: _0x3ba3a3,
} = {}) => {
  const _0x50df2a = documentRef || globalThis.document,
    _0x20a1d9 = _0x50df2a.createElement('canvas');
  ((_0x20a1d9.width = _0x5e585c), (_0x20a1d9.height = _0x42d597));
  const _0x3111a6 = _0x20a1d9.getContext('2d');
  if (!_0x3111a6) return _0x20a1d9;
  return (
    (_0x3111a6.lineCap = 'round'),
    (_0x3111a6.lineJoin = 'round'),
    (Array.isArray(_0x5dd1ee) ? _0x5dd1ee : []).forEach((_0x42ca7e, _0xb6a795) => {
      if (_0x42ca7e.type === 'brush') {
        (_0x3111a6.save(),
          drawRoundBrushStroke(_0x3111a6, {
            points: mapBrushPoints(_0x42ca7e.points, _0x27826b, _0x3ba3a3),
            lineWidth: getBrushLineWidth(_0x42ca7e.sizeWorld, _0x27826b, 'brush'),
            strokeStyle: '#fff',
            fillStyle: '#fff',
            globalCompositeOperation: 'source-over',
          }),
          _0x3111a6.restore());
        return;
      }
      if (_0x42ca7e.type === 'rect') {
        const _0x91f2c2 = _0x42ca7e.x1 * _0x27826b,
          _0x269361 = _0x42ca7e.y1 * _0x3ba3a3,
          _0x5f41ed = _0x42ca7e.x2 * _0x27826b,
          _0x59ac2e = _0x42ca7e.y2 * _0x3ba3a3,
          _0x4cece5 = Math.min(_0x91f2c2, _0x5f41ed),
          _0x3cc5ad = Math.min(_0x269361, _0x59ac2e),
          _0xffaecd = Math.abs(_0x5f41ed - _0x91f2c2),
          _0x2d153e = Math.abs(_0x59ac2e - _0x269361);
        (_0x3111a6.save(),
          (_0x3111a6.globalCompositeOperation = 'source-over'),
          (_0x3111a6.fillStyle = '#fff'),
          _0x3111a6.fillRect(_0x4cece5, _0x3cc5ad, _0xffaecd, _0x2d153e),
          _0x3111a6.restore());
        return;
      }
      if (_0x42ca7e.type === 'eraser') {
        (_0x3111a6.save(),
          drawRoundBrushStroke(_0x3111a6, {
            points: mapBrushPoints(_0x42ca7e.points, _0x27826b, _0x3ba3a3),
            lineWidth: getEraserClearLineWidth(getBrushLineWidth(_0x42ca7e.sizeWorld, _0x27826b, 'eraser')),
            strokeStyle: '#000',
            fillStyle: '#000',
            globalCompositeOperation: 'destination-out',
          }),
          _0x3111a6.restore());
        return;
      }
      if (_0x42ca7e.type === 'fill') {
        const _0x5203d2 = buildBinaryBoundaryMask({
            width: _0x5e585c,
            height: _0x42d597,
            commands: getBoundaryCommands(_0x5dd1ee, _0xb6a795),
            pointToPixel: (_0x503028) => ({
              x: Number(_0x503028?.x || 0) * _0x27826b,
              y: Number(_0x503028?.y || 0) * _0x3ba3a3,
            }),
            getStrokeWidth: (_0x5bc637) =>
              getBrushLineWidth(_0x5bc637?.sizeWorld, _0x27826b, _0x5bc637?.type),
          }),
          _0x3516df = floodFillRegion(
            _0x5203d2.mask,
            _0x5203d2.width,
            _0x5203d2.height,
            Math.floor(Number(_0x42ca7e.x || 0) * _0x27826b),
            Math.floor(Number(_0x42ca7e.y || 0) * _0x3ba3a3),
          ),
          _0x3b00bc = sealRegionToBoundary(_0x3516df, _0x5203d2.mask, _0x5203d2.width, _0x5203d2.height);
        (_0x3111a6.save(),
          paintFilledRegion(_0x3111a6, _0x3b00bc, _0x5e585c, _0x42d597, {
            fillStyle: '#fff',
            globalCompositeOperation: 'source-over',
          }),
          _0x3111a6.restore());
      }
    }),
    _0x20a1d9
  );
};
