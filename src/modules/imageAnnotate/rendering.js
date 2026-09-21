import { getCachedSealedFillRegion, paintFilledRegion } from '../bucketFill.js';
import {
  createEraseCheckerboardPattern,
  drawEraseMaskCommand,
  drawEraseBrushCommand,
  compositeSolidMaskPreview,
} from '../eraseBrushRenderer.js';
import {
  drawRoundBrushStroke,
  getEraserClearLineWidth,
  getBrushLineWidth,
  mapBrushPoints,
} from '../imageEditorBrushStyle.js';
import {
  getTextScalePair,
  TEXT_CONTROL_BUTTON_RADIUS,
  TEXT_CONTROL_SIDE_HANDLE_RADIUS,
} from './textControls.js';
import { drawNumberLabelCommand } from './numberLabels.js';
const getCanvasRenderSize = (_0x308de1) => ({
    width: Number(_0x308de1?.style?.width?.replace('px', '')) || 1,
    height: Number(_0x308de1?.style?.height?.replace('px', '')) || 1,
  }),
  getCommandPoints = (_0x15b145, _0x3dc2fa) => mapBrushPoints(_0x15b145?.points, _0x3dc2fa, _0x3dc2fa),
  drawTextControlButton = (_0x3133b2, _0x4733fb, _0x5db166, _0x430537) => {
    (_0x3133b2.save(),
      _0x3133b2.beginPath(),
      _0x3133b2.arc(_0x4733fb.x, _0x4733fb.y, TEXT_CONTROL_BUTTON_RADIUS, 0, Math.PI * 2),
      (_0x3133b2.fillStyle = _0x430537.fill),
      (_0x3133b2.strokeStyle = _0x430537.stroke),
      (_0x3133b2.lineWidth = 1.5),
      _0x3133b2.fill(),
      _0x3133b2.stroke(),
      (_0x3133b2.strokeStyle = _0x430537.icon),
      (_0x3133b2.fillStyle = _0x430537.icon),
      (_0x3133b2.lineWidth = 1.6),
      (_0x3133b2.lineCap = 'round'),
      (_0x3133b2.lineJoin = 'round'),
      _0x5db166(_0x3133b2, _0x4733fb),
      _0x3133b2.restore());
  },
  getBoundaryCommands = (_0x414f72, _0x12d375) =>
    _0x414f72
      .slice(0, _0x12d375)
      .filter(
        (_0x5ea160) =>
          _0x5ea160?.type === 'brush' || _0x5ea160?.type === 'rect' || _0x5ea160?.type === 'eraser',
      );
export const drawTextSelectionControls = ({
  ctx: _0x412ae5,
  geom: _0x5addf2,
  resolveCssVar: _0x5cfc1c,
} = {}) => {
  if (!_0x412ae5 || !_0x5addf2) return;
  const _0x114ea4 = _0x5cfc1c('--blue-border-focus') || _0x412ae5.strokeStyle,
    _0x493e78 = _0x5cfc1c('--canvas-white') || _0x412ae5.fillStyle,
    _0x13e46c = _0x5cfc1c('--bg') || _0x5cfc1c('--text-primary') || _0x114ea4,
    _0x3f1e11 = { stroke: _0x114ea4, fill: _0x493e78, icon: _0x13e46c },
    [_0x15b531, _0x530b17, _0x43d8d3, _0x46ef31] = _0x5addf2.corners;
  (_0x412ae5.save(),
    (_0x412ae5.strokeStyle = _0x114ea4),
    (_0x412ae5.lineWidth = 1.5),
    _0x412ae5.setLineDash([]),
    _0x412ae5.beginPath(),
    _0x412ae5.moveTo(_0x15b531.x, _0x15b531.y),
    _0x412ae5.lineTo(_0x530b17.x, _0x530b17.y),
    _0x412ae5.lineTo(_0x43d8d3.x, _0x43d8d3.y),
    _0x412ae5.lineTo(_0x46ef31.x, _0x46ef31.y),
    _0x412ae5.closePath(),
    _0x412ae5.stroke(),
    Object.values(_0x5addf2.handles || {})
      .filter((_0x40531c) => _0x40531c && !Array.isArray(_0x40531c))
      .forEach((_0x511460) => {
        (_0x412ae5.beginPath(),
          _0x412ae5.arc(_0x511460.x, _0x511460.y, TEXT_CONTROL_SIDE_HANDLE_RADIUS, 0, Math.PI * 2),
          (_0x412ae5.fillStyle = _0x493e78),
          (_0x412ae5.strokeStyle = _0x114ea4),
          (_0x412ae5.lineWidth = 1.5),
          _0x412ae5.fill(),
          _0x412ae5.stroke());
      }),
    _0x412ae5.restore(),
    drawTextControlButton(
      _0x412ae5,
      _0x15b531,
      (_0x202af1, _0x5bf74b) => {
        (_0x202af1.beginPath(),
          _0x202af1.moveTo(_0x5bf74b.x - 3, _0x5bf74b.y - 3),
          _0x202af1.lineTo(_0x5bf74b.x + 3, _0x5bf74b.y + 3),
          _0x202af1.moveTo(_0x5bf74b.x + 3, _0x5bf74b.y - 3),
          _0x202af1.lineTo(_0x5bf74b.x - 3, _0x5bf74b.y + 3),
          _0x202af1.stroke());
      },
      _0x3f1e11,
    ),
    drawTextControlButton(
      _0x412ae5,
      _0x46ef31,
      (_0x3718ef, _0x11b870) => {
        (_0x3718ef.strokeRect(_0x11b870.x - 2, _0x11b870.y - 4, 6, 6),
          _0x3718ef.strokeRect(_0x11b870.x - 5, _0x11b870.y - 1, 6, 6));
      },
      _0x3f1e11,
    ),
    drawTextControlButton(
      _0x412ae5,
      _0x530b17,
      (_0x1e0e79, _0x45bdd0) => {
        (_0x1e0e79.beginPath(),
          _0x1e0e79.arc(_0x45bdd0.x, _0x45bdd0.y, 4, Math.PI * 0.15, Math.PI * 1.55),
          _0x1e0e79.stroke(),
          _0x1e0e79.beginPath(),
          _0x1e0e79.moveTo(_0x45bdd0.x + 4, _0x45bdd0.y - 3),
          _0x1e0e79.lineTo(_0x45bdd0.x + 5, _0x45bdd0.y + 2),
          _0x1e0e79.lineTo(_0x45bdd0.x + 1, _0x45bdd0.y),
          _0x1e0e79.stroke());
      },
      _0x3f1e11,
    ),
    drawTextControlButton(
      _0x412ae5,
      _0x43d8d3,
      (_0x373ff7, _0x28a5b4) => {
        (_0x373ff7.beginPath(),
          _0x373ff7.moveTo(_0x28a5b4.x - 4, _0x28a5b4.y + 4),
          _0x373ff7.lineTo(_0x28a5b4.x + 4, _0x28a5b4.y - 4),
          _0x373ff7.moveTo(_0x28a5b4.x + 1, _0x28a5b4.y - 4),
          _0x373ff7.lineTo(_0x28a5b4.x + 4, _0x28a5b4.y - 4),
          _0x373ff7.lineTo(_0x28a5b4.x + 4, _0x28a5b4.y - 1),
          _0x373ff7.moveTo(_0x28a5b4.x - 1, _0x28a5b4.y + 4),
          _0x373ff7.lineTo(_0x28a5b4.x - 4, _0x28a5b4.y + 4),
          _0x373ff7.lineTo(_0x28a5b4.x - 4, _0x28a5b4.y + 1),
          _0x373ff7.stroke());
      },
      _0x3f1e11,
    ));
};
export const renderEraseSceneCommands = ({
  documentRef: documentRef = null,
  canvasEl: _0xdaad58,
  ctx: _0x62ce18,
  viewport: _0x595c10,
  commands: commands = [],
  draft: draft = null,
  checkerPattern: _0x2d5c64,
  eraseMaskCanvasEl: eraseMaskCanvasEl = null,
} = {}) => {
  if (!_0xdaad58 || !_0x62ce18) return eraseMaskCanvasEl;
  const _0x3d139e = documentRef || globalThis.document,
    _0x3fb482 = _0x595c10?.zoom || 1,
    _0x166562 = getCanvasRenderSize(_0xdaad58),
    _0x5445b2 = Math.max(1, Math.round(_0x166562.width)),
    _0x1e9901 = Math.max(1, Math.round(_0x166562.height));
  let _0x4ca26c = eraseMaskCanvasEl;
  (!_0x4ca26c || _0x4ca26c.width !== _0x5445b2 || _0x4ca26c.height !== _0x1e9901) &&
    ((_0x4ca26c = _0x3d139e.createElement('canvas')),
    (_0x4ca26c.width = _0x5445b2),
    (_0x4ca26c.height = _0x1e9901));
  const _0x3960b9 = _0x4ca26c.getContext('2d');
  if (!_0x3960b9) return _0x4ca26c;
  (_0x3960b9.clearRect(0, 0, _0x5445b2, _0x1e9901),
    (_0x3960b9.lineCap = 'round'),
    (_0x3960b9.lineJoin = 'round'));
  const _0x244c13 = (_0x2d1e51) => {
    if (!_0x2d1e51 || (_0x2d1e51.type !== 'brush' && _0x2d1e51.type !== 'eraser')) return;
    const _0x32480f = getCommandPoints(_0x2d1e51, _0x3fb482);
    if (!_0x32480f.length) return;
    drawEraseMaskCommand(_0x3960b9, {
      type: _0x2d1e51.type,
      points: _0x32480f,
      lineWidth: getBrushLineWidth(_0x2d1e51.sizeWorld, _0x3fb482, _0x2d1e51.type),
    });
  };
  (Array.isArray(commands) ? commands : []).forEach(_0x244c13);
  if (draft) _0x244c13(draft);
  return (
    compositeSolidMaskPreview(_0x62ce18, {
      maskCanvas: _0x4ca26c,
      width: _0x166562.width,
      height: _0x166562.height,
    }),
    _0x4ca26c
  );
};
export const renderCommands = ({
  ctx: _0x4983fd,
  viewport: _0x214948,
  canvasEl: _0x8f4385,
  commands: commands = [],
  isDraft: isDraft = false,
  isEraseScene: isEraseScene = false,
  checkerPattern: _0x6caacf,
  defaultTextColor: _0x5bb4f7,
  getTextGeometry: _0x3b2bb1,
  selectedTextCommandIndex: selectedTextCommandIndex = null,
  selectedCommandsRef: selectedCommandsRef = null,
  resolveCssVar: _0x476a1e,
  fillRegionCache: fillRegionCache = null,
  numberLabelBackgroundColor: numberLabelBackgroundColor = '',
} = {}) => {
  if (!_0x4983fd || !_0x8f4385) return;
  const _0x5f4b93 = _0x214948?.zoom || 1,
    _0x408e13 = getCanvasRenderSize(_0x8f4385);
  commands.forEach((_0x33e169, _0x280b17) => {
    if (_0x33e169.type === 'brush') {
      _0x4983fd.save();
      const _0x536b86 = getCommandPoints(_0x33e169, _0x5f4b93);
      if (!_0x536b86.length) {
        _0x4983fd.restore();
        return;
      }
      const _0x5a9bf2 = getBrushLineWidth(_0x33e169.sizeWorld, _0x5f4b93, 'brush');
      if (isEraseScene) {
        const _0x3f7d94 =
          createEraseCheckerboardPattern(_0x4983fd, _0x5f4b93) ||
          _0x6caacf ||
          _0x476a1e?.('--white-20') ||
          'transparent';
        drawEraseBrushCommand(_0x4983fd, {
          type: 'brush',
          points: _0x536b86,
          lineWidth: _0x5a9bf2,
          checkerPattern: _0x3f7d94,
          checkerZoom: _0x5f4b93,
          checkerAlpha: 0.8,
          includeErasePass: false,
        });
      } else
        drawRoundBrushStroke(_0x4983fd, {
          points: _0x536b86,
          lineWidth: _0x5a9bf2,
          strokeStyle: _0x33e169.color,
          fillStyle: _0x33e169.color,
          globalCompositeOperation: 'source-over',
        });
      _0x4983fd.restore();
      return;
    }
    if (_0x33e169.type === 'eraser') {
      _0x4983fd.save();
      const _0x1a6491 = getCommandPoints(_0x33e169, _0x5f4b93);
      if (!_0x1a6491.length) {
        _0x4983fd.restore();
        return;
      }
      (drawRoundBrushStroke(_0x4983fd, {
        points: _0x1a6491,
        lineWidth: getEraserClearLineWidth(getBrushLineWidth(_0x33e169.sizeWorld, _0x5f4b93, 'eraser')),
        strokeStyle: 'black',
        fillStyle: 'black',
        globalCompositeOperation: 'destination-out',
      }),
        _0x4983fd.restore());
      return;
    }
    if (_0x33e169.type === 'rect') {
      const _0x358a7b = _0x33e169.x1 * _0x5f4b93,
        _0x48ee49 = _0x33e169.y1 * _0x5f4b93,
        _0x3f8ecb = _0x33e169.x2 * _0x5f4b93,
        _0x15532a = _0x33e169.y2 * _0x5f4b93,
        _0x296b5e = Math.min(_0x358a7b, _0x3f8ecb),
        _0x4ee33d = Math.min(_0x48ee49, _0x15532a),
        _0x4a1dad = Math.abs(_0x3f8ecb - _0x358a7b),
        _0x1e8d6f = Math.abs(_0x15532a - _0x48ee49);
      (_0x4983fd.save(),
        (_0x4983fd.globalCompositeOperation = 'source-over'),
        (_0x4983fd.strokeStyle = _0x33e169.color),
        (_0x4983fd.lineWidth = getBrushLineWidth(_0x33e169.sizeWorld, _0x5f4b93, 'brush')));
      if (isDraft) _0x4983fd.setLineDash([6, 5]);
      (_0x4983fd.strokeRect(_0x296b5e, _0x4ee33d, _0x4a1dad, _0x1e8d6f), _0x4983fd.restore());
      return;
    }
    if (_0x33e169.type === 'text') {
      const _0x3c9536 = _0x33e169.x * _0x5f4b93,
        _0x2524a1 = _0x33e169.y * _0x5f4b93,
        _0x6dc5b2 = Math.max(1, _0x33e169.sizeWorld * _0x5f4b93),
        { scaleX: _0x145e93, scaleY: _0x493f51 } = getTextScalePair(_0x33e169),
        _0x470a3d = Number(_0x33e169.rotation) || 0;
      (_0x4983fd.save(),
        (_0x4983fd.globalCompositeOperation = 'source-over'),
        (_0x4983fd.fillStyle = _0x33e169.color || _0x5bb4f7),
        (_0x4983fd.font = _0x6dc5b2 + 'px sans-serif'),
        (_0x4983fd.textBaseline = 'top'));
      const _0x30746a = String(_0x33e169.text || '');
      (_0x4983fd.translate(_0x3c9536, _0x2524a1),
        _0x4983fd.rotate(_0x470a3d),
        _0x4983fd.scale(_0x145e93, _0x493f51),
        _0x4983fd.fillText(_0x30746a, 0, 0),
        _0x4983fd.restore());
      if (!isDraft && commands === selectedCommandsRef && selectedTextCommandIndex === _0x280b17) {
        const _0xf437c2 = _0x3b2bb1?.(_0x33e169, _0x214948);
        _0xf437c2 && drawTextSelectionControls({ ctx: _0x4983fd, geom: _0xf437c2, resolveCssVar: _0x476a1e });
      }
      return;
    }
    if (_0x33e169.type === 'number-label') {
      drawNumberLabelCommand({
        ctx: _0x4983fd,
        cmd: _0x33e169,
        scaleX: _0x5f4b93,
        scaleY: _0x5f4b93,
        defaultColor: _0x5bb4f7,
        backgroundColor: numberLabelBackgroundColor,
      });
      return;
    }
    if (_0x33e169.type === 'fill') {
      const _0x14894d = Math.floor(Number(_0x33e169.x || 0) * _0x5f4b93),
        _0x1cc391 = Math.floor(Number(_0x33e169.y || 0) * _0x5f4b93),
        _0x3f02b9 = _0x33e169.color || _0x5bb4f7,
        _0x26953a = getCachedSealedFillRegion({
          cache: fillRegionCache,
          width: _0x408e13.width,
          height: _0x408e13.height,
          zoom: _0x5f4b93,
          fillCommand: _0x33e169,
          boundaryCommands: getBoundaryCommands(commands, _0x280b17),
          seedX: _0x14894d,
          seedY: _0x1cc391,
          extraKey: 'color:' + _0x3f02b9,
          pointToPixel: (_0x55dc72) => ({
            x: Number(_0x55dc72?.x || 0) * _0x5f4b93,
            y: Number(_0x55dc72?.y || 0) * _0x5f4b93,
          }),
          getStrokeWidth: (_0x23c1ee) => getBrushLineWidth(_0x23c1ee?.sizeWorld, _0x5f4b93, _0x23c1ee?.type),
        });
      (_0x4983fd.save(),
        paintFilledRegion(_0x4983fd, _0x26953a, _0x408e13.width, _0x408e13.height, {
          fillStyle: _0x3f02b9,
          globalCompositeOperation: 'source-over',
        }),
        _0x4983fd.restore());
    }
  });
};
