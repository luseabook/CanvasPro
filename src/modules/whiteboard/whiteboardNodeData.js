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
  finiteNumberOr = (value, item = 0x0) => {
    const key = Number(value);
    return Number['isFinite'](key) ? key : item;
  },
  normalizeColorName = (index, result = WHITEBOARD_DEFAULT_COLOR) => {
    const data = String(index || '')['trim']();
    return WHITEBOARD_COLOR_SET['has'](data) ? data : result;
  },
  normalizeTool = (options, target = WHITEBOARD_DEFAULT_TOOL) => {
    const source = String(options || '')['trim']();
    return WHITEBOARD_TOOL_SET['has'](source) ? source : target;
  },
  normalizeShapeType = (next, current = WHITEBOARD_DEFAULT_SHAPE_TYPE) => {
    const entry = String(next || '')['trim']();
    return WHITEBOARD_SHAPE_TYPE_SET['has'](entry) ? entry : current;
  },
  normalizeBrushSize = (record, payload = WHITEBOARD_DEFAULT_BRUSH_SIZE_PX) => {
    const finiteNumberOr2 = finiteNumberOr(record, payload);
    return Math['max'](0x1, Math['min'](0x78, finiteNumberOr2));
  },
  normalizeOpacity = (handle, state = WHITEBOARD_DEFAULT_STYLE['opacity']) => {
    const finiteNumberOr3 = finiteNumberOr(handle, state);
    return Math['max'](0.1, Math['min'](0x1, finiteNumberOr3));
  },
  normalizeEnum = (config, map, scope) => {
    const input = String(config || '')['trim']();
    return map['has'](input) ? input : scope;
  },
  normalizeView = (output) => {
    const box = output && typeof output === 'object' ? output : {},
      finiteNumberOr4 = finiteNumberOr(box['zoom'], WHITEBOARD_DEFAULT_VIEW['zoom']);
    return {
      x: finiteNumberOr(box['x'], WHITEBOARD_DEFAULT_VIEW['x']),
      y: finiteNumberOr(box['y'], WHITEBOARD_DEFAULT_VIEW['y']),
      zoom: Math['max'](WHITEBOARD_MIN_ZOOM, Math['min'](WHITEBOARD_MAX_ZOOM, finiteNumberOr4)),
    };
  },
  normalizeStyle = (options2 = {}, value2 = {}) => {
    const value3 = options2 && typeof options2 === 'object' ? options2 : {};
    return {
      color: normalizeColorName(value3['color'], normalizeColorName(value2['color'])),
      size: normalizeBrushSize(value3['size'] ?? value2['brushSizePx']),
      opacity: normalizeOpacity(value3['opacity']),
      fill: normalizeEnum(value3['fill'], WHITEBOARD_FILL_SET, WHITEBOARD_DEFAULT_STYLE['fill']),
      dash: normalizeEnum(value3['dash'], WHITEBOARD_DASH_SET, WHITEBOARD_DEFAULT_STYLE['dash']),
      font: normalizeEnum(value3['font'], WHITEBOARD_FONT_SET, WHITEBOARD_DEFAULT_STYLE['font']),
      textAlign: normalizeEnum(
        value3['textAlign'],
        WHITEBOARD_TEXT_ALIGN_SET,
        WHITEBOARD_DEFAULT_STYLE['textAlign'],
      ),
      arrowKind: normalizeEnum(
        value3['arrowKind'],
        WHITEBOARD_ARROW_KIND_SET,
        WHITEBOARD_DEFAULT_STYLE['arrowKind'],
      ),
      arrowStart: normalizeEnum(
        value3['arrowStart'],
        WHITEBOARD_ARROWHEAD_SET,
        WHITEBOARD_DEFAULT_STYLE['arrowStart'],
      ),
      arrowEnd: normalizeEnum(
        value3['arrowEnd'],
        WHITEBOARD_ARROWHEAD_SET,
        WHITEBOARD_DEFAULT_STYLE['arrowEnd'],
      ),
    };
  },
  applyCommandStyle = (args, value4 = {}) => {
    const value5 = { ...args },
      colorName = normalizeColorName(value4['colorName'], '');
    if (colorName) value5['colorName'] = colorName;
    if ('opacity' in value4) value5['opacity'] = normalizeOpacity(value4['opacity']);
    return (
      'dash' in value4 &&
        (value5['dash'] = normalizeEnum(
          value4['dash'],
          WHITEBOARD_DASH_SET,
          WHITEBOARD_DEFAULT_STYLE['dash'],
        )),
      'fill' in value4 &&
        (value5['fill'] = normalizeEnum(
          value4['fill'],
          WHITEBOARD_FILL_SET,
          WHITEBOARD_DEFAULT_STYLE['fill'],
        )),
      'font' in value4 &&
        (value5['font'] = normalizeEnum(
          value4['font'],
          WHITEBOARD_FONT_SET,
          WHITEBOARD_DEFAULT_STYLE['font'],
        )),
      'textAlign' in value4 &&
        (value5['textAlign'] = normalizeEnum(
          value4['textAlign'],
          WHITEBOARD_TEXT_ALIGN_SET,
          WHITEBOARD_DEFAULT_STYLE['textAlign'],
        )),
      'arrowStart' in value4 &&
        (value5['arrowStart'] = normalizeEnum(
          value4['arrowStart'],
          WHITEBOARD_ARROWHEAD_SET,
          WHITEBOARD_DEFAULT_STYLE['arrowStart'],
        )),
      'arrowKind' in value4 &&
        (value5['arrowKind'] = normalizeEnum(
          value4['arrowKind'],
          WHITEBOARD_ARROW_KIND_SET,
          WHITEBOARD_DEFAULT_STYLE['arrowKind'],
        )),
      'arrowEnd' in value4 &&
        (value5['arrowEnd'] = normalizeEnum(
          value4['arrowEnd'],
          WHITEBOARD_ARROWHEAD_SET,
          WHITEBOARD_DEFAULT_STYLE['arrowEnd'],
        )),
      value5
    );
  },
  normalizePointList = (value6) =>
    (Array['isArray'](value6) ? value6 : [])
      ['slice'](0x0, WHITEBOARD_POINT_LIMIT)
      ['map']((box2) => {
        const x2 = Number(box2?.['x']),
          y2 = Number(box2?.['y']);
        if (!Number['isFinite'](x2) || !Number['isFinite'](y2)) return null;
        return { x: x2, y: y2 };
      })
      ['filter'](Boolean);
export function normalizeWhiteboardCommand(arrowEnd) {
  if (!arrowEnd || typeof arrowEnd !== 'object') return null;
  const type = String(arrowEnd['type'] || '')['trim']();
  if (type === 'brush')
    return applyCommandStyle(
      {
        type: type,
        color: String(arrowEnd['color'] || ''),
        sizeWorld: Math['max'](0x1, finiteNumberOr(arrowEnd['sizeWorld'], 0x1)),
        points: normalizePointList(arrowEnd['points']),
      },
      arrowEnd,
    );
  if (type === 'eraser')
    return applyCommandStyle(
      {
        type: type,
        sizeWorld: Math['max'](0x1, finiteNumberOr(arrowEnd['sizeWorld'], 0x1)),
        points: normalizePointList(arrowEnd['points']),
      },
      arrowEnd,
    );
  if (type === 'rect')
    return applyCommandStyle(
      {
        type: type,
        color: String(arrowEnd['color'] || ''),
        sizeWorld: Math['max'](0x1, finiteNumberOr(arrowEnd['sizeWorld'], 0x1)),
        x1: finiteNumberOr(arrowEnd['x1']),
        y1: finiteNumberOr(arrowEnd['y1']),
        x2: finiteNumberOr(arrowEnd['x2']),
        y2: finiteNumberOr(arrowEnd['y2']),
        rotation: finiteNumberOr(arrowEnd['rotation']),
      },
      arrowEnd,
    );
  if (type === 'arrow') {
    const bend = finiteNumberOr(arrowEnd['bend']);
    return applyCommandStyle(
      {
        type: type,
        color: String(arrowEnd['color'] || ''),
        sizeWorld: Math['max'](0x1, finiteNumberOr(arrowEnd['sizeWorld'], 0x1)),
        x1: finiteNumberOr(arrowEnd['x1']),
        y1: finiteNumberOr(arrowEnd['y1']),
        x2: finiteNumberOr(arrowEnd['x2']),
        y2: finiteNumberOr(arrowEnd['y2']),
        bend: bend,
        elbowOffset: finiteNumberOr(arrowEnd['elbowOffset']),
        arrowKind: normalizeEnum(
          arrowEnd['arrowKind'],
          WHITEBOARD_ARROW_KIND_SET,
          Math['abs'](bend) > 0x0 ? 'arc' : WHITEBOARD_DEFAULT_STYLE['arrowKind'],
        ),
        arrowEnd: arrowEnd['arrowEnd'] ?? WHITEBOARD_DEFAULT_STYLE['arrowEnd'],
      },
      arrowEnd,
    );
  }
  if (type === 'shape')
    return applyCommandStyle(
      {
        type: type,
        shapeType: normalizeShapeType(arrowEnd['shapeType']),
        color: String(arrowEnd['color'] || ''),
        sizeWorld: Math['max'](0x1, finiteNumberOr(arrowEnd['sizeWorld'], 0x1)),
        x1: finiteNumberOr(arrowEnd['x1']),
        y1: finiteNumberOr(arrowEnd['y1']),
        x2: finiteNumberOr(arrowEnd['x2']),
        y2: finiteNumberOr(arrowEnd['y2']),
        rotation: finiteNumberOr(arrowEnd['rotation']),
      },
      arrowEnd,
    );
  if (type === 'fill')
    return applyCommandStyle(
      {
        type: type,
        color: String(arrowEnd['color'] || ''),
        x: finiteNumberOr(arrowEnd['x']),
        y: finiteNumberOr(arrowEnd['y']),
      },
      arrowEnd,
    );
  if (type === 'text')
    return applyCommandStyle(
      {
        type: type,
        text: String(arrowEnd['text'] || '')['slice'](0x0, 0xc8),
        color: String(arrowEnd['color'] || ''),
        sizeWorld: Math['max'](0x1, finiteNumberOr(arrowEnd['sizeWorld'], 0x10)),
        x: finiteNumberOr(arrowEnd['x']),
        y: finiteNumberOr(arrowEnd['y']),
        scale: finiteNumberOr(arrowEnd['scale'], 0x1),
        scaleX: finiteNumberOr(arrowEnd['scaleX'], 0x1),
        scaleY: finiteNumberOr(arrowEnd['scaleY'], 0x1),
        rotation: finiteNumberOr(arrowEnd['rotation']),
      },
      arrowEnd,
    );
  if (type === 'number-label')
    return applyCommandStyle(
      {
        type: type,
        number: Math['max'](0x1, Math['floor'](finiteNumberOr(arrowEnd['number'], 0x1))),
        color: String(arrowEnd['color'] || ''),
        sizeWorld: Math['max'](0x1, finiteNumberOr(arrowEnd['sizeWorld'], 0x12)),
        x: finiteNumberOr(arrowEnd['x']),
        y: finiteNumberOr(arrowEnd['y']),
      },
      arrowEnd,
    );
  return null;
}
export function normalizeWhiteboardCommands(value7) {
  return (Array['isArray'](value7) ? value7 : [])
    ['slice'](0x0, WHITEBOARD_COMMAND_LIMIT)
    ['map'](normalizeWhiteboardCommand)
    ['filter'](Boolean);
}
export function createDefaultWhiteboardState(el = {}) {
  const style = normalizeStyle(el['style'], el);
  return {
    version: WHITEBOARD_DATA_VERSION,
    commands: normalizeWhiteboardCommands(el['commands']),
    tool: normalizeTool(el['tool']),
    shapeType: normalizeShapeType(el['shapeType']),
    view: normalizeView(el['view']),
    style: style,
    color: style['color'],
    brushSizePx: style['size'],
    updatedAt: Number['isFinite'](Number(el['updatedAt'])) ? Number(el['updatedAt']) : 0x0,
  };
}
export function normalizeWhiteboardState(enabled) {
  if (!enabled || typeof enabled !== 'object') return createDefaultWhiteboardState();
  return createDefaultWhiteboardState(enabled);
}
export function getRelevantWhiteboardStyleControls(value8, value9 = null) {
  const tool = normalizeTool(value8, 'select');
  if (tool === 'hand') return [];
  const value10 = value9?.['type'] || tool;
  if (value10 === 'eraser') return ['size'];
  if (value10 === 'brush') return ['color', 'size', 'opacity'];
  if (value10 === 'arrow') return ['color', 'size', 'opacity', 'dash', 'arrow-kind', 'arrowheads'];
  if (value10 === 'rect' || value10 === 'shape') return ['color', 'fill', 'size', 'opacity', 'dash'];
  if (value10 === 'text') return ['color', 'size', 'opacity', 'font'];
  if (value10 === 'number-label') return ['color', 'size', 'opacity'];
  if (value10 === 'select') return [];
  return [];
}
export function createWhiteboardNodeData({
  id: id,
  x: x = 0x0,
  y: y = 0x0,
  width: width = WHITEBOARD_DEFAULT_SIZE['width'],
  height: height = WHITEBOARD_DEFAULT_SIZE['height'],
  name: name = '白板',
  whiteboard: whiteboard = null,
} = {}) {
  return {
    id: id,
    type: WHITEBOARD_NODE_TYPE,
    x: x,
    y: y,
    width: width,
    height: height,
    name: name,
    whiteboard: normalizeWhiteboardState(whiteboard),
  };
}
