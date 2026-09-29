export const WHITEBOARD_NODE_TYPE = 'whiteboard';
export const WHITEBOARD_DATA_VERSION = 0x2;
export const WHITEBOARD_DEFAULT_SIZE = Object['freeze']({ width: 0x2d0, height: 0x1e0 });
export const WHITEBOARD_DEFAULT_TOOL = 'brush';
export const WHITEBOARD_DEFAULT_COLOR = 'black';
export const WHITEBOARD_DEFAULT_BRUSH_SIZE_PX = 0x14;
export const WHITEBOARD_DEFAULT_SHAPE_TYPE = 'rectangle';
export const WHITEBOARD_DEFAULT_VIEW = Object['freeze']({ x: 0x0, y: 0x0, zoom: 0.5 });
export const WHITEBOARD_DEFAULT_STYLE = Object['freeze']({
  color: WHITEBOARD_DEFAULT_COLOR,
  size: WHITEBOARD_DEFAULT_BRUSH_SIZE_PX,
  opacity: 0x1,
  fill: 'none',
  dash: 'solid',
  font: 'sans',
  textAlign: 'left',
  arrowKind: 'straight',
  arrowStart: 'none',
  arrowEnd: 'arrow',
});
const WHITEBOARD_TOOL_SET = new Set([
    'select',
    'hand',
    'brush',
    'rect',
    'arrow',
    'bucket',
    'text',
    'eraser',
    'number-label',
    'shape',
  ]),
  WHITEBOARD_SHAPE_TYPE_SET = new Set([
    'circle',
    'triangle',
    'diamond',
    'hexagon',
    'pill',
    'parallelogram',
    'star',
    'cloud',
    'heart',
    'crossed-box',
    'checkbox',
    'arrow-left',
    'arrow-up',
    'arrow-down',
    'arrow-right',
    'line',
    'frame',
  ]),
  WHITEBOARD_COLOR_SET = new Set([
    'black',
    'gray',
    'pink',
    'purple',
    'blue',
    'indigo',
    'cyan',
    'red',
    'orange',
    'yellow',
    'green',
    'white',
  ]),
  WHITEBOARD_FILL_SET = new Set(['none', 'solid']),
  WHITEBOARD_DASH_SET = new Set(['solid', 'dashed', 'dotted']),
  WHITEBOARD_FONT_SET = new Set(['sans', 'serif', 'mono']),
  WHITEBOARD_TEXT_ALIGN_SET = new Set(['left', 'center', 'right']),
  WHITEBOARD_ARROW_KIND_SET = new Set(['straight', 'arc', 'elbow']),
  WHITEBOARD_ARROWHEAD_SET = new Set([
    'none',
    'arrow',
    'triangle',
    'square',
    'circle',
    'diamond',
    'inverted',
    'bar',
  ]),
  WHITEBOARD_COMMAND_LIMIT = 0x7d0,
  WHITEBOARD_POINT_LIMIT = 0x1388,
  WHITEBOARD_MIN_ZOOM = 0.1,
  WHITEBOARD_MAX_ZOOM = 0x8,
  finiteNumberOr = (_0x1b0f99, _0x3bd761 = 0x0) => {
    const _0x167bd8 = Number(_0x1b0f99);
    return Number['isFinite'](_0x167bd8) ? _0x167bd8 : _0x3bd761;
  },
  normalizeColorName = (_0x2fad46, _0x59a35f = WHITEBOARD_DEFAULT_COLOR) => {
    const _0x436cf9 = String(_0x2fad46 || '')['trim']();
    return WHITEBOARD_COLOR_SET['has'](_0x436cf9) ? _0x436cf9 : _0x59a35f;
  },
  normalizeTool = (_0x354021, _0x29a41c = WHITEBOARD_DEFAULT_TOOL) => {
    const _0x3422bd = String(_0x354021 || '')['trim']();
    return WHITEBOARD_TOOL_SET['has'](_0x3422bd) ? _0x3422bd : _0x29a41c;
  },
  normalizeShapeType = (_0x284474, _0x1cabe1 = WHITEBOARD_DEFAULT_SHAPE_TYPE) => {
    const _0x1ae727 = String(_0x284474 || '')['trim']();
    return WHITEBOARD_SHAPE_TYPE_SET['has'](_0x1ae727) ? _0x1ae727 : _0x1cabe1;
  },
  normalizeBrushSize = (_0x2aa115, _0x158423 = WHITEBOARD_DEFAULT_BRUSH_SIZE_PX) => {
    const _0x2e4347 = finiteNumberOr(_0x2aa115, _0x158423);
    return Math['max'](0x1, Math['min'](0x78, _0x2e4347));
  },
  normalizeOpacity = (_0x41cb9e, _0x39b905 = WHITEBOARD_DEFAULT_STYLE['opacity']) => {
    const _0x1bdcbc = finiteNumberOr(_0x41cb9e, _0x39b905);
    return Math['max'](0.1, Math['min'](0x1, _0x1bdcbc));
  },
  normalizeEnum = (_0x3a2a21, _0x247dd0, _0x4852c8) => {
    const _0x1bcaa7 = String(_0x3a2a21 || '')['trim']();
    return _0x247dd0['has'](_0x1bcaa7) ? _0x1bcaa7 : _0x4852c8;
  },
  normalizeView = (_0x275d5c) => {
    const _0x292c1e = _0x275d5c && typeof _0x275d5c === 'object' ? _0x275d5c : {},
      _0x392961 = finiteNumberOr(_0x292c1e['zoom'], WHITEBOARD_DEFAULT_VIEW['zoom']);
    return {
      x: finiteNumberOr(_0x292c1e['x'], WHITEBOARD_DEFAULT_VIEW['x']),
      y: finiteNumberOr(_0x292c1e['y'], WHITEBOARD_DEFAULT_VIEW['y']),
      zoom: Math['max'](WHITEBOARD_MIN_ZOOM, Math['min'](WHITEBOARD_MAX_ZOOM, _0x392961)),
    };
  },
  normalizeStyle = (_0x225ce4 = {}, _0x2fcf11 = {}) => {
    const _0x5768cd = _0x225ce4 && typeof _0x225ce4 === 'object' ? _0x225ce4 : {};
    return {
      color: normalizeColorName(_0x5768cd['color'], normalizeColorName(_0x2fcf11['color'])),
      size: normalizeBrushSize(_0x5768cd['size'] ?? _0x2fcf11['brushSizePx']),
      opacity: normalizeOpacity(_0x5768cd['opacity']),
      fill: normalizeEnum(_0x5768cd['fill'], WHITEBOARD_FILL_SET, WHITEBOARD_DEFAULT_STYLE['fill']),
      dash: normalizeEnum(_0x5768cd['dash'], WHITEBOARD_DASH_SET, WHITEBOARD_DEFAULT_STYLE['dash']),
      font: normalizeEnum(_0x5768cd['font'], WHITEBOARD_FONT_SET, WHITEBOARD_DEFAULT_STYLE['font']),
      textAlign: normalizeEnum(
        _0x5768cd['textAlign'],
        WHITEBOARD_TEXT_ALIGN_SET,
        WHITEBOARD_DEFAULT_STYLE['textAlign'],
      ),
      arrowKind: normalizeEnum(
        _0x5768cd['arrowKind'],
        WHITEBOARD_ARROW_KIND_SET,
        WHITEBOARD_DEFAULT_STYLE['arrowKind'],
      ),
      arrowStart: normalizeEnum(
        _0x5768cd['arrowStart'],
        WHITEBOARD_ARROWHEAD_SET,
        WHITEBOARD_DEFAULT_STYLE['arrowStart'],
      ),
      arrowEnd: normalizeEnum(
        _0x5768cd['arrowEnd'],
        WHITEBOARD_ARROWHEAD_SET,
        WHITEBOARD_DEFAULT_STYLE['arrowEnd'],
      ),
    };
  },
  applyCommandStyle = (_0x5e9d29, _0x1adbd4 = {}) => {
    const _0x39a5c3 = { ..._0x5e9d29 },
      _0xf513eb = normalizeColorName(_0x1adbd4['colorName'], '');
    if (_0xf513eb) _0x39a5c3['colorName'] = _0xf513eb;
    if ('opacity' in _0x1adbd4) _0x39a5c3['opacity'] = normalizeOpacity(_0x1adbd4['opacity']);
    return (
      'dash' in _0x1adbd4 &&
        (_0x39a5c3['dash'] = normalizeEnum(
          _0x1adbd4['dash'],
          WHITEBOARD_DASH_SET,
          WHITEBOARD_DEFAULT_STYLE['dash'],
        )),
      'fill' in _0x1adbd4 &&
        (_0x39a5c3['fill'] = normalizeEnum(
          _0x1adbd4['fill'],
          WHITEBOARD_FILL_SET,
          WHITEBOARD_DEFAULT_STYLE['fill'],
        )),
      'font' in _0x1adbd4 &&
        (_0x39a5c3['font'] = normalizeEnum(
          _0x1adbd4['font'],
          WHITEBOARD_FONT_SET,
          WHITEBOARD_DEFAULT_STYLE['font'],
        )),
      'textAlign' in _0x1adbd4 &&
        (_0x39a5c3['textAlign'] = normalizeEnum(
          _0x1adbd4['textAlign'],
          WHITEBOARD_TEXT_ALIGN_SET,
          WHITEBOARD_DEFAULT_STYLE['textAlign'],
        )),
      'arrowStart' in _0x1adbd4 &&
        (_0x39a5c3['arrowStart'] = normalizeEnum(
          _0x1adbd4['arrowStart'],
          WHITEBOARD_ARROWHEAD_SET,
          WHITEBOARD_DEFAULT_STYLE['arrowStart'],
        )),
      'arrowKind' in _0x1adbd4 &&
        (_0x39a5c3['arrowKind'] = normalizeEnum(
          _0x1adbd4['arrowKind'],
          WHITEBOARD_ARROW_KIND_SET,
          WHITEBOARD_DEFAULT_STYLE['arrowKind'],
        )),
      'arrowEnd' in _0x1adbd4 &&
        (_0x39a5c3['arrowEnd'] = normalizeEnum(
          _0x1adbd4['arrowEnd'],
          WHITEBOARD_ARROWHEAD_SET,
          WHITEBOARD_DEFAULT_STYLE['arrowEnd'],
        )),
      _0x39a5c3
    );
  },
  normalizePointList = (_0x11a120) =>
    (Array['isArray'](_0x11a120) ? _0x11a120 : [])
      ['slice'](0x0, WHITEBOARD_POINT_LIMIT)
      ['map']((_0x1a86d8) => {
        const _0x5593e6 = Number(_0x1a86d8?.['x']),
          _0xb0746f = Number(_0x1a86d8?.['y']);
        if (!Number['isFinite'](_0x5593e6) || !Number['isFinite'](_0xb0746f)) return null;
        return { x: _0x5593e6, y: _0xb0746f };
      })
      ['filter'](Boolean);
export function normalizeWhiteboardCommand(_0x32eef1) {
  if (!_0x32eef1 || typeof _0x32eef1 !== 'object') return null;
  const _0x5d8d9f = String(_0x32eef1['type'] || '')['trim']();
  if (_0x5d8d9f === 'brush')
    return applyCommandStyle(
      {
        type: _0x5d8d9f,
        color: String(_0x32eef1['color'] || ''),
        sizeWorld: Math['max'](0x1, finiteNumberOr(_0x32eef1['sizeWorld'], 0x1)),
        points: normalizePointList(_0x32eef1['points']),
      },
      _0x32eef1,
    );
  if (_0x5d8d9f === 'eraser')
    return applyCommandStyle(
      {
        type: _0x5d8d9f,
        sizeWorld: Math['max'](0x1, finiteNumberOr(_0x32eef1['sizeWorld'], 0x1)),
        points: normalizePointList(_0x32eef1['points']),
      },
      _0x32eef1,
    );
  if (_0x5d8d9f === 'rect')
    return applyCommandStyle(
      {
        type: _0x5d8d9f,
        color: String(_0x32eef1['color'] || ''),
        sizeWorld: Math['max'](0x1, finiteNumberOr(_0x32eef1['sizeWorld'], 0x1)),
        x1: finiteNumberOr(_0x32eef1['x1']),
        y1: finiteNumberOr(_0x32eef1['y1']),
        x2: finiteNumberOr(_0x32eef1['x2']),
        y2: finiteNumberOr(_0x32eef1['y2']),
        rotation: finiteNumberOr(_0x32eef1['rotation']),
      },
      _0x32eef1,
    );
  if (_0x5d8d9f === 'arrow') {
    const _0x2329ed = finiteNumberOr(_0x32eef1['bend']);
    return applyCommandStyle(
      {
        type: _0x5d8d9f,
        color: String(_0x32eef1['color'] || ''),
        sizeWorld: Math['max'](0x1, finiteNumberOr(_0x32eef1['sizeWorld'], 0x1)),
        x1: finiteNumberOr(_0x32eef1['x1']),
        y1: finiteNumberOr(_0x32eef1['y1']),
        x2: finiteNumberOr(_0x32eef1['x2']),
        y2: finiteNumberOr(_0x32eef1['y2']),
        bend: _0x2329ed,
        elbowOffset: finiteNumberOr(_0x32eef1['elbowOffset']),
        arrowKind: normalizeEnum(
          _0x32eef1['arrowKind'],
          WHITEBOARD_ARROW_KIND_SET,
          Math['abs'](_0x2329ed) > 0x0 ? 'arc' : WHITEBOARD_DEFAULT_STYLE['arrowKind'],
        ),
        arrowEnd: _0x32eef1['arrowEnd'] ?? WHITEBOARD_DEFAULT_STYLE['arrowEnd'],
      },
      _0x32eef1,
    );
  }
  if (_0x5d8d9f === 'shape')
    return applyCommandStyle(
      {
        type: _0x5d8d9f,
        shapeType: normalizeShapeType(_0x32eef1['shapeType']),
        color: String(_0x32eef1['color'] || ''),
        sizeWorld: Math['max'](0x1, finiteNumberOr(_0x32eef1['sizeWorld'], 0x1)),
        x1: finiteNumberOr(_0x32eef1['x1']),
        y1: finiteNumberOr(_0x32eef1['y1']),
        x2: finiteNumberOr(_0x32eef1['x2']),
        y2: finiteNumberOr(_0x32eef1['y2']),
        rotation: finiteNumberOr(_0x32eef1['rotation']),
      },
      _0x32eef1,
    );
  if (_0x5d8d9f === 'fill')
    return applyCommandStyle(
      {
        type: _0x5d8d9f,
        color: String(_0x32eef1['color'] || ''),
        x: finiteNumberOr(_0x32eef1['x']),
        y: finiteNumberOr(_0x32eef1['y']),
      },
      _0x32eef1,
    );
  if (_0x5d8d9f === 'text')
    return applyCommandStyle(
      {
        type: _0x5d8d9f,
        text: String(_0x32eef1['text'] || '')['slice'](0x0, 0xc8),
        color: String(_0x32eef1['color'] || ''),
        sizeWorld: Math['max'](0x1, finiteNumberOr(_0x32eef1['sizeWorld'], 0x10)),
        x: finiteNumberOr(_0x32eef1['x']),
        y: finiteNumberOr(_0x32eef1['y']),
        scale: finiteNumberOr(_0x32eef1['scale'], 0x1),
        scaleX: finiteNumberOr(_0x32eef1['scaleX'], 0x1),
        scaleY: finiteNumberOr(_0x32eef1['scaleY'], 0x1),
        rotation: finiteNumberOr(_0x32eef1['rotation']),
      },
      _0x32eef1,
    );
  if (_0x5d8d9f === 'number-label')
    return applyCommandStyle(
      {
        type: _0x5d8d9f,
        number: Math['max'](0x1, Math['floor'](finiteNumberOr(_0x32eef1['number'], 0x1))),
        color: String(_0x32eef1['color'] || ''),
        sizeWorld: Math['max'](0x1, finiteNumberOr(_0x32eef1['sizeWorld'], 0x12)),
        x: finiteNumberOr(_0x32eef1['x']),
        y: finiteNumberOr(_0x32eef1['y']),
      },
      _0x32eef1,
    );
  return null;
}
export function normalizeWhiteboardCommands(_0x32cd0f) {
  return (Array['isArray'](_0x32cd0f) ? _0x32cd0f : [])
    ['slice'](0x0, WHITEBOARD_COMMAND_LIMIT)
    ['map'](normalizeWhiteboardCommand)
    ['filter'](Boolean);
}
export function createDefaultWhiteboardState(_0x20b8b4 = {}) {
  const _0x334601 = normalizeStyle(_0x20b8b4['style'], _0x20b8b4);
  return {
    version: WHITEBOARD_DATA_VERSION,
    commands: normalizeWhiteboardCommands(_0x20b8b4['commands']),
    tool: normalizeTool(_0x20b8b4['tool']),
    shapeType: normalizeShapeType(_0x20b8b4['shapeType']),
    view: normalizeView(_0x20b8b4['view']),
    style: _0x334601,
    color: _0x334601['color'],
    brushSizePx: _0x334601['size'],
    updatedAt: Number['isFinite'](Number(_0x20b8b4['updatedAt'])) ? Number(_0x20b8b4['updatedAt']) : 0x0,
  };
}
export function normalizeWhiteboardState(_0x3713bb) {
  if (!_0x3713bb || typeof _0x3713bb !== 'object') return createDefaultWhiteboardState();
  return createDefaultWhiteboardState(_0x3713bb);
}
export function getRelevantWhiteboardStyleControls(_0x40ccd0, _0x5cb474 = null) {
  const _0x3518bd = normalizeTool(_0x40ccd0, 'select');
  if (_0x3518bd === 'hand') return [];
  const _0x4aae0b = _0x5cb474?.['type'] || _0x3518bd;
  if (_0x4aae0b === 'eraser') return ['size'];
  if (_0x4aae0b === 'brush') return ['color', 'size', 'opacity'];
  if (_0x4aae0b === 'arrow') return ['color', 'size', 'opacity', 'dash', 'arrow-kind', 'arrowheads'];
  if (_0x4aae0b === 'rect' || _0x4aae0b === 'shape') return ['color', 'fill', 'size', 'opacity', 'dash'];
  if (_0x4aae0b === 'text') return ['color', 'size', 'opacity', 'font'];
  if (_0x4aae0b === 'number-label') return ['color', 'size', 'opacity'];
  if (_0x4aae0b === 'select') return [];
  return [];
}
export function createWhiteboardNodeData({
  id: _0x894d6f,
  x: x = 0x0,
  y: y = 0x0,
  width: width = WHITEBOARD_DEFAULT_SIZE['width'],
  height: height = WHITEBOARD_DEFAULT_SIZE['height'],
  name: name = '白板',
  whiteboard: whiteboard = null,
} = {}) {
  return {
    id: _0x894d6f,
    type: WHITEBOARD_NODE_TYPE,
    x: x,
    y: y,
    width: width,
    height: height,
    name: name,
    whiteboard: normalizeWhiteboardState(whiteboard),
  };
}
