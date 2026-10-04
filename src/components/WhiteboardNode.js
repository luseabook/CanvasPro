import appStore from '../core/stores/appStore.js';
import { commit } from '../modules/history.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import { addEdgeWithPolicies } from '../modules/interaction/EdgeController.js';
import { processFile } from '../services/fileService.js';
import { getThumbnail } from '../services/thumbnailCacheService.js';
import { getImage } from '../modules/storage.js';
import { applyI18n, t } from '../i18n/index.js';
import { createSafeSvg } from '../utils/dom.js';
import { createRotateCursor } from '../modules/cursorUtils.js';
import { renderCommands } from '../modules/imageAnnotate/rendering.js';
import { createEraseCheckerboardPattern } from '../modules/eraseBrushRenderer.js';
import {
  buildCopiedTextCommand,
  clampTextScale,
  createTextTransformState,
  findTextHit,
  getTextAnchorForCenter,
  getTextGeometry,
  getTextLayout,
  getTextScalePair,
  resolveAxisTextScale,
  toTextLocalTransformSpace,
} from '../modules/imageAnnotate/textControls.js';
import { getNextNumberLabelValue } from '../modules/imageAnnotate/numberLabels.js';
import {
  getArrowBendFromPoint,
  getArrowElbowOffsetFromPoint,
  getArrowGeometry,
  getDistanceToArrowPath,
} from '../modules/imageAnnotate/arrowGeometry.js';
import {
  doesSegmentHitBounds,
  doesSegmentHitCircle,
  doesSegmentHitPolygon,
  doesSegmentHitPolyline,
  snapWhiteboardPointToAngle,
} from '../modules/whiteboard/whiteboardInteractionGeometry.js';
import {
  applyWhiteboardLayerTransform,
  createWhiteboardLayerTransformSession,
  getWhiteboardLayerGeometry,
  getWhiteboardLayerTransformHandleAtPoint,
  isWhiteboardLayerTransformable,
} from '../modules/whiteboard/whiteboardLayerTransform.js';
import {
  drawWhiteboardBackgroundImage,
  getWhiteboardBackgroundInputSignature,
  getWhiteboardSizeForBackground,
  resolveWhiteboardBackgroundInput,
} from '../modules/whiteboard/whiteboardBackgroundInput.js';
import {
  createFastWhiteboardBackgroundPreview,
  createWhiteboardBackgroundPreviewFromDecodedImage,
} from '../modules/whiteboard/whiteboardBackgroundPreview.js';
import {
  clampImageBrushSize,
  drawRoundBrushStroke,
  getBrushLineWidth,
  getEraserClearLineWidth,
  syncCircularBrushCursor,
} from '../modules/imageEditorBrushStyle.js';
import {
  getRelevantWhiteboardStyleControls,
  normalizeWhiteboardCommands,
  normalizeWhiteboardState,
  WHITEBOARD_DATA_VERSION,
  WHITEBOARD_DEFAULT_BRUSH_SIZE_PX,
  WHITEBOARD_DEFAULT_COLOR,
  WHITEBOARD_DEFAULT_SIZE,
  WHITEBOARD_DEFAULT_SHAPE_TYPE,
  WHITEBOARD_DEFAULT_STYLE,
  WHITEBOARD_DEFAULT_TOOL,
  WHITEBOARD_DEFAULT_VIEW,
} from '../modules/whiteboard/whiteboardNodeData.js';
const WHITEBOARD_MIN_WIDTH = 0x168,
  WHITEBOARD_MIN_HEIGHT = 0x104,
  WHITEBOARD_SAVE_DEBOUNCE_MS = 0x1f4,
  WHITEBOARD_TEXT_LIMIT = 0xc8,
  WHITEBOARD_MIN_ZOOM = 0.1,
  WHITEBOARD_MAX_ZOOM = 0x8,
  WHITEBOARD_ZOOM_WHEEL_SPEED = 0.0015,
  WHITEBOARD_ARROW_HANDLE_SCREEN_RADIUS = 0xa,
  WHITEBOARD_LAYER_ERASE_PREVIEW_OPACITY = 0.24,
  WHITEBOARD_LAYER_ERASER_TRAIL_POINT_LIMIT = 0xa0,
  WHITEBOARD_LAYER_ERASER_TRAIL_MAX_SCREEN_LENGTH = 0x8c,
  WHITEBOARD_ROTATE_CURSOR = createRotateCursor(),
  WHITEBOARD_ALLOWED_TOOLS = Object['freeze']([
    'select',
    'hand',
    'brush',
    'eraser',
    'arrow',
    'text',
    'rect',
    'bucket',
    'number-label',
    'shape',
  ]),
  WHITEBOARD_PRIMARY_TOOLS = Object['freeze']([
    'select',
    'hand',
    'brush',
    'eraser',
    'arrow',
    'text',
    'bucket',
  ]),
  WHITEBOARD_TOOL_ICONS = Object['freeze']({
    select:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M5 3l11 9-5 1.5L8.5 20 5 3Z"/></svg>',
    hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M8 11V6.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M14 10V7a1.5 1.5 0 0 1 3 0v5"/><path d="M17 12v-1.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1.5a6 6 0 0 1-4.2-1.7L4 16a1.7 1.7 0 0 1 2.4-2.4L8 15"/></svg>',
    brush:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    eraser:
      '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.9\x22><path\x20d=\x22M20\x2020H7l-5-5a2\x202\x200\x200\x201\x200-2.83l9.17-9.17a2\x202\x200\x200\x201\x202.83\x200L22\x2010a2\x202\x200\x200\x201\x200\x202.83L14.83\x2020\x22/></svg>',
    arrow:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M5 19 19 5"/><path d="M9 5h10v10"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 6h16"/><path d="M12 6v12"/><path d="M8 18h8"/></svg>',
    rect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="5" y="6" width="14" height="12" rx="2"/></svg>',
    bucket:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M19 11l-8-8-8.5 8.5a2.12 2.12 0 0 0 0 3l4 4a2.12 2.12 0 0 0 3 0L19 11z"/><path d="M12 18l-2 2"/><path d="M20 20l-2-2"/></svg>',
    'number-label':
      '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.9\x22><circle\x20cx=\x2212\x22\x20cy=\x2212\x22\x20r=\x228\x22/><path\x20d=\x22M11\x209l2-1v8\x22/><path\x20d=\x22M10\x2016h5\x22/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="6" height="6" rx="1"/><circle cx="17" cy="7" r="3"/><path d="m7 14-3 6h6Z"/><path d="m17 13 4 4-4 4-4-4Z"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M9 14l-4-4 4-4"/><path d="M5 10h9a6 6 0 1 1 0 12h-3"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M15 14l4-4-4-4"/><path d="M19 10H10a6 6 0 1 0 0 12h3"/></svg>',
    clear:
      '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.9\x22><path\x20d=\x22M3\x206h18\x22/><path\x20d=\x22M8\x206V4h8v2\x22/><path\x20d=\x22M6\x206l1\x2016h10l1-16\x22/></svg>',
    compose:
      '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222.1\x22><path\x20d=\x22M12\x205v14\x22/><path\x20d=\x22M5\x2012h14\x22/></svg>',
    upload:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 14v5h14v-5"/></svg>',
  }),
  WHITEBOARD_TOOL_LABELS = Object['freeze']({
    select: '选择',
    hand: '移动',
    brush: '画笔',
    eraser: '橡皮',
    arrow: '箭头',
    text: '文字',
    rect: '矩形',
    bucket: '填充',
    'number-label': '编号',
    shape: '图形',
  }),
  WHITEBOARD_TOOL_SHORTCUTS = Object['freeze']({
    select: 'V',
    hand: '空格',
    brush: 'B',
    eraser: 'E / Ctrl',
    arrow: 'A',
    text: 'T',
  }),
  WHITEBOARD_SHAPE_OPTIONS = Object['freeze']([
    { key: 'rectangle', tool: 'rect', label: '矩形', icon: WHITEBOARD_TOOL_ICONS['rect'] },
    {
      key: 'circle',
      tool: 'shape',
      label: '圆形',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/></svg>',
    },
    {
      key: 'triangle',
      tool: 'shape',
      label: '三角形',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 4 8 16H4Z"/></svg>',
    },
    {
      key: 'diamond',
      tool: 'shape',
      label: '菱形',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 9 9-9 9-9-9Z"/></svg>',
    },
    {
      key: 'hexagon',
      tool: 'shape',
      label: '六边形',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m7 4 10 0 5 8-5 8H7l-5-8Z"/></svg>',
    },
    {
      key: 'pill',
      tool: 'shape',
      label: '胶囊',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="3" width="10" height="18" rx="5"/></svg>',
    },
    {
      key: 'parallelogram',
      tool: 'shape',
      label: '平行四边形',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 4h13l-3 16H4Z"/></svg>',
    },
    {
      key: 'star',
      tool: 'shape',
      label: '星形',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.4l6.2-.9Z"/></svg>',
    },
    {
      key: 'cloud',
      tool: 'shape',
      label: '云朵',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 19h12a4 4 0 0 0 .4-8A6.2 6.2 0 0 0 6.6 9.5 4.8 4.8 0 0 0 6 19Z"/></svg>',
    },
    {
      key: 'heart',
      tool: 'shape',
      label: '心形',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 5.8a5.2 5.2 0 0 0-7.4 0L12 7.2l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 22l8.8-8.8a5.2 5.2 0 0 0 0-7.4Z"/></svg>',
    },
    {
      key: 'crossed-box',
      tool: 'shape',
      label: '交叉框',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16"/><path d="m4 4 16 16M20 4 4 20"/></svg>',
    },
    {
      key: 'checkbox',
      tool: 'shape',
      label: '复选框',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="m8 12 3 3 6-7"/></svg>',
    },
    {
      key: 'arrow-left',
      tool: 'shape',
      label: '左箭头',
      icon: '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.8\x22><path\x20d=\x22m10\x204-8\x208\x208\x208v-5h12V9H10Z\x22/></svg>',
    },
    {
      key: 'arrow-up',
      tool: 'shape',
      label: '上箭头',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 10 8-8 8 8h-5v12H9V10Z"/></svg>',
    },
    {
      key: 'arrow-down',
      tool: 'shape',
      label: '下箭头',
      icon: '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.8\x22><path\x20d=\x22m4\x2014\x208\x208\x208-8h-5V2H9v12Z\x22/></svg>',
    },
    {
      key: 'arrow-right',
      tool: 'shape',
      label: '右箭头',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m14 4 8 8-8 8v-5H2V9h12Z"/></svg>',
    },
    {
      key: 'line',
      tool: 'shape',
      label: '直线',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20 20 4"/></svg>',
    },
    { key: 'brush', tool: 'brush', label: '画笔', icon: WHITEBOARD_TOOL_ICONS['brush'] },
    {
      key: 'highlighter',
      tool: 'brush',
      label: '荧光笔',
      style: { opacity: 0.35, size: 0x48 },
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 3 6 6L9 21H3v-6Z"/><path d="m12 6 6 6M2 22h10"/></svg>',
    },
    {
      key: 'frame',
      tool: 'shape',
      label: '取景框',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3H3v6M15 3h6v6M21 15v6h-6M9 21H3v-6"/></svg>',
    },
    { key: 'number-label', tool: 'number-label', label: '编号', icon: WHITEBOARD_TOOL_ICONS['number-label'] },
  ]),
  WHITEBOARD_SIZE_PRESETS = Object['freeze']([
    { key: 'S', value: 0xc, tooltipKey: 'whiteboardNode.style.sizes.small' },
    { key: 'M', value: 0x28, tooltipKey: 'whiteboardNode.style.sizes.medium' },
    { key: 'L', value: 0x48, tooltipKey: 'whiteboardNode.style.sizes.large' },
    { key: 'XL', value: 0x6c, tooltipKey: 'whiteboardNode.style.sizes.extraLarge' },
  ]),
  WHITEBOARD_OPACITY_PRESETS = Object['freeze']([
    { key: '25', value: 0.25 },
    { key: '50', value: 0.5 },
    { key: '75', value: 0.75 },
    { key: '100', value: 0x1 },
  ]),
  WHITEBOARD_FILL_OPTIONS = Object['freeze']([
    { key: 'none', label: '○', tooltipKey: 'whiteboardNode.style.fill.none' },
    { key: 'solid', label: '●', tooltipKey: 'whiteboardNode.style.fill.solid' },
  ]),
  WHITEBOARD_DASH_OPTIONS = Object['freeze']([
    { key: 'solid', label: '━', tooltipKey: 'whiteboardNode.style.dash.solid' },
    { key: 'dashed', label: '┅', tooltipKey: 'whiteboardNode.style.dash.dashed' },
    { key: 'dotted', label: '⋯', tooltipKey: 'whiteboardNode.style.dash.dotted' },
  ]),
  WHITEBOARD_FONT_OPTIONS = Object['freeze']([
    { key: 'sans', labelKey: 'whiteboardNode.style.font.sans' },
    { key: 'serif', labelKey: 'whiteboardNode.style.font.serif' },
    { key: 'mono', labelKey: 'whiteboardNode.style.font.mono' },
  ]),
  WHITEBOARD_ARROW_KIND_OPTIONS = Object['freeze']([
    {
      value: 'straight',
      tooltipKey: 'whiteboardNode.style.arrowKind.straight',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h16"/></svg>',
    },
    {
      value: 'arc',
      tooltipKey: 'whiteboardNode.style.arrowKind.arc',
      icon: '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.8\x22><path\x20d=\x22M4\x2017c4-10\x2012-10\x2016\x200\x22/></svg>',
    },
    {
      value: 'elbow',
      tooltipKey: 'whiteboardNode.style.arrowKind.elbow',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h7v12h9"/></svg>',
    },
  ]),
  WHITEBOARD_ARROWHEAD_OPTIONS = Object['freeze']([
    {
      value: 'none',
      tooltipKey: 'whiteboardNode.style.arrowhead.none',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h16"/></svg>',
    },
    {
      value: 'arrow',
      tooltipKey: 'whiteboardNode.style.arrowhead.arrow',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h16M12 5l8 7-8 7"/></svg>',
    },
    {
      value: 'triangle',
      tooltipKey: 'whiteboardNode.style.arrowhead.triangle',
      icon: '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.8\x22><path\x20d=\x22M3\x2012h7M20\x2012\x2010\x205v14Z\x22/></svg>',
    },
    {
      value: 'square',
      tooltipKey: 'whiteboardNode.style.arrowhead.square',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12h7"/><rect x="10" y="5" width="10" height="14" rx="1"/></svg>',
    },
    {
      value: 'circle',
      tooltipKey: 'whiteboardNode.style.arrowhead.circle',
      icon: '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.8\x22><path\x20d=\x22M10\x2012h11\x22/><circle\x20cx=\x227\x22\x20cy=\x2212\x22\x20r=\x225\x22/></svg>',
    },
    {
      value: 'diamond',
      tooltipKey: 'whiteboardNode.style.arrowhead.diamond',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 12h9M7 5l7 7-7 7-7-7Z"/></svg>',
    },
    {
      value: 'inverted',
      tooltipKey: 'whiteboardNode.style.arrowhead.inverted',
      icon: '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.8\x22><path\x20d=\x22M13\x2012h8M3\x205l10\x207-10\x207Z\x22/></svg>',
    },
    {
      value: 'bar',
      tooltipKey: 'whiteboardNode.style.arrowhead.bar',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h15M5 5v14"/></svg>',
    },
  ]),
  COLOR_VAR_MAP = {
    black: '--black',
    gray: '--text-muted',
    pink: '--group-pink',
    red: '--annotate-red',
    orange: '--annotate-orange',
    yellow: '--annotate-yellow',
    green: '--annotate-green',
    cyan: '--cyan',
    blue: '--annotate-blue',
    indigo: '--indigo',
    purple: '--annotate-purple',
    white: '--canvas-white',
  },
  isTypingField = (value) => {
    const item = value?.['tagName']?.['toLowerCase']?.() || '';
    return item === 'input' || item === 'textarea' || value?.['isContentEditable'] === !![];
  },
  getCssVar = (key) =>
    getComputedStyle(document['documentElement'])['getPropertyValue'](key)['trim'](),
  getColorCss = (index) => {
    const result = COLOR_VAR_MAP[index];
    return result ? 'var(' + result + ')' : index;
  },
  getColorCanvas = (data) => {
    const enabled = COLOR_VAR_MAP[data];
    if (!enabled) return data;
    return getCssVar(enabled) || data;
  },
  clampWhiteboardZoom = (options) => {
    const count = Number(options);
    if (!Number['isFinite'](count) || count <= 0x0) return WHITEBOARD_DEFAULT_VIEW['zoom'];
    return Math['max'](WHITEBOARD_MIN_ZOOM, Math['min'](WHITEBOARD_MAX_ZOOM, count));
  },
  cloneWhiteboardView = (box = WHITEBOARD_DEFAULT_VIEW) => ({
    x: Number['isFinite'](Number(box['x'])) ? Number(box['x']) : WHITEBOARD_DEFAULT_VIEW['x'],
    y: Number['isFinite'](Number(box['y'])) ? Number(box['y']) : WHITEBOARD_DEFAULT_VIEW['y'],
    zoom: clampWhiteboardZoom(box['zoom']),
  }),
  clampOpacity = (target) => {
    const source = Number(target);
    if (!Number['isFinite'](source)) return WHITEBOARD_DEFAULT_STYLE['opacity'];
    return Math['max'](0.1, Math['min'](0x1, source));
  },
  normalizeStyleValue = (next, current) => {
    if (next === 'size') return clampImageBrushSize(current);
    if (next === 'opacity') return clampOpacity(current);
    if (next === 'fill') return current === 'solid' ? 'solid' : 'none';
    if (next === 'dash') return current === 'dashed' || current === 'dotted' ? current : 'solid';
    if (next === 'font') return current === 'serif' || current === 'mono' ? current : 'sans';
    if (next === 'arrowKind')
      return current === 'arc' || current === 'elbow' ? current : 'straight';
    if (next === 'arrowStart' || next === 'arrowEnd')
      return ['arrow', 'triangle', 'square', 'circle', 'diamond', 'inverted', 'bar']['includes'](current)
        ? current
        : 'none';
    if (next === 'color') return COLOR_VAR_MAP[current] ? current : WHITEBOARD_DEFAULT_COLOR;
    return current;
  },
  cloneWhiteboardStyle = (args = WHITEBOARD_DEFAULT_STYLE) => ({
    ...WHITEBOARD_DEFAULT_STYLE,
    ...args,
    color: normalizeStyleValue('color', args['color']),
    size: normalizeStyleValue('size', args['size']),
    opacity: normalizeStyleValue('opacity', args['opacity']),
    fill: normalizeStyleValue('fill', args['fill']),
    dash: normalizeStyleValue('dash', args['dash']),
    font: normalizeStyleValue('font', args['font']),
    arrowKind: normalizeStyleValue('arrowKind', args['arrowKind']),
    arrowStart: normalizeStyleValue('arrowStart', args['arrowStart']),
    arrowEnd: normalizeStyleValue('arrowEnd', args['arrowEnd']),
  }),
  getFiniteNumber = (entry, record = 0x0) => {
    const payload = Number(entry);
    return Number['isFinite'](payload) ? payload : record;
  },
  hasFiniteClientPoint = (event) =>
    Number['isFinite'](Number(event?.['clientX'])) && Number['isFinite'](Number(event?.['clientY'])),
  getPointerEventSamples = (event2) => {
    let list = [];
    if (typeof event2?.['getCoalescedEvents'] === 'function')
      try {
        list = Array['from'](event2['getCoalescedEvents']() || []);
      } catch {
        list = [];
      }
    const list2 = list['filter'](hasFiniteClientPoint);
    if (hasFiniteClientPoint(event2)) {
      const event3 = list2[list2['length'] - 0x1];
      (!event3 ||
        Number(event3['clientX']) !== Number(event2['clientX']) ||
        Number(event3['clientY']) !== Number(event2['clientY'])) &&
        list2['push'](event2);
    }
    return list2['length'] > 0x0 ? list2 : [event2];
  },
  requestWhiteboardFrame = (handle) => {
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(handle);
    return setTimeout(handle, 0x0);
  },
  cancelWhiteboardFrame = (enabled2) => {
    if (!enabled2) return;
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(enabled2);
      return;
    }
    clearTimeout(enabled2);
  },
  getScreenPointFromWorld = (box2, state) => {
    const box3 = cloneWhiteboardView(state);
    return {
      x: (getFiniteNumber(box2?.['x']) - box3['x']) * box3['zoom'],
      y: (getFiniteNumber(box2?.['y']) - box3['y']) * box3['zoom'],
    };
  },
  getWorldPointFromScreen = (box4, config) => {
    const x = cloneWhiteboardView(config);
    return {
      x: x['x'] + getFiniteNumber(box4?.['x']) / x['zoom'],
      y: x['y'] + getFiniteNumber(box4?.['y']) / x['zoom'],
    };
  },
  createPointerState = () => ({
    down: ![],
    pointerId: null,
    mode: null,
    previousTool: null,
    temporaryTool: null,
    textTransform: null,
    arrowTransform: null,
    layerTransform: null,
    panStart: null,
    panView: null,
    eraseLast: null,
    eraseIndices: null,
    eraseTrail: null,
  }),
  resolveModifierTemporaryTool = (scope) => {
    if (scope?.['control']) return 'eraser';
    if (scope?.['space']) return 'hand';
    return null;
  },
  syncModifierTemporaryTool = (output) => {
    const modifierTemporaryTool = resolveModifierTemporaryTool(output?.['_modifierState']);
    if (output['_temporaryTool'] === modifierTemporaryTool) return modifierTemporaryTool;
    return (
      (output['_temporaryTool'] = modifierTemporaryTool),
      output['_syncToolbarState']?.(),
      output['_syncCursor']?.(modifierTemporaryTool || undefined),
      modifierTemporaryTool
    );
  },
  cloneCommands = (value2) =>
    normalizeWhiteboardCommands(value2)['map']((args2) => ({
      ...args2,
      points: Array['isArray'](args2['points'])
        ? args2['points']['map']((args3) => ({ ...args3 }))
        : args2['points'],
    })),
  getWhiteboardSignature = (tool2) =>
    JSON['stringify']({
      commands: cloneCommands(tool2?.['commands']),
      tool: tool2?.['tool'] || WHITEBOARD_DEFAULT_TOOL,
      shapeType: tool2?.['shapeType'] || WHITEBOARD_DEFAULT_SHAPE_TYPE,
      view: cloneWhiteboardView(tool2?.['view']),
      style: cloneWhiteboardStyle(
        tool2?.['style'] || {
          color: tool2?.['color'] || WHITEBOARD_DEFAULT_COLOR,
          size: Number(tool2?.['brushSizePx']) || WHITEBOARD_DEFAULT_BRUSH_SIZE_PX,
        },
      ),
    }),
  isFiniteCommandPoint = (box5) =>
    Number['isFinite'](Number(box5?.['x'])) && Number['isFinite'](Number(box5?.['y'])),
  hasDrawableStrokePoints = (value3) =>
    Array['isArray'](value3?.['points']) && value3['points']['some'](isFiniteCommandPoint),
  shouldDiscardStrokeCommand = (value4) =>
    (value4?.['type'] === 'brush' || value4?.['type'] === 'eraser') &&
    !hasDrawableStrokePoints(value4),
  canvasToPngBlob = (enabled3) =>
    new Promise((handler) => {
      if (!enabled3 || typeof enabled3['toBlob'] !== 'function') {
        handler(null);
        return;
      }
      enabled3['toBlob']((value5) => handler(value5 || null), 'image/png');
    });
function appendIcon(el, value6) {
  const el2 = createSafeSvg(value6);
  if (!el2) return;
  (el2['classList']['add']('whiteboard-toolbar-icon'), el['appendChild'](el2));
}
function createToolbarButton({
  className: className = '',
  tool: tool = '',
  action: action = '',
  label: label = '',
  shortcut: shortcut = '',
  icon: icon = '',
} = {}) {
  const el3 = document['createElement']('button');
  ((el3['type'] = 'button'),
    (el3['className'] = ['ftb-btn', 'icon-only', 'whiteboard-toolbar-btn', className]
      ['filter'](Boolean)
      ['join']('\x20')));
  if (tool) el3['dataset']['tool'] = tool;
  if (action) el3['dataset']['action'] = action;
  return (
    label &&
      ((el3['dataset']['tooltip'] = shortcut ? label + '\x20(' + shortcut + ')' : label),
      el3['setAttribute']('aria-label', label)),
    appendIcon(el3, icon),
    el3
  );
}
function createDivider() {
  const el4 = document['createElement']('div');
  return (
    (el4['className'] = 'whiteboard-toolbar-divider'),
    el4['setAttribute']('aria-hidden', 'true'),
    el4
  );
}
function createToolbarGroup(value7) {
  const value8 = document['createElement']('div');
  return (
    (value8['className'] = ['whiteboard-toolbar-group', value7]['filter'](Boolean)['join']('\x20')),
    value8
  );
}
function createWhiteboardToolbar({ hiddenActions: hiddenActions = [] } = {}) {
  const el5 = document['createElement']('div');
  el5['className'] = 'node-floating-toolbar whiteboard-toolbar';
  const map = new Set(
      (Array['isArray'](hiddenActions) ? hiddenActions : [])
        ['map']((value9) => String(value9 || '')['trim']())
        ['filter'](Boolean),
    ),
    handler2 = (value10) => !map['has'](value10),
    el6 = createToolbarGroup('whiteboard-toolbar-actions');
  handler2('undo') &&
    el6['appendChild'](
      createToolbarButton({
        className: 'whiteboard-action-btn act-undo',
        action: 'undo',
        label: '撤销',
        icon: WHITEBOARD_TOOL_ICONS['undo'],
      }),
    );
  handler2('redo') &&
    el6['appendChild'](
      createToolbarButton({
        className: 'whiteboard-action-btn act-redo',
        action: 'redo',
        label: '重做',
        icon: WHITEBOARD_TOOL_ICONS['redo'],
      }),
    );
  const el7 = createToolbarGroup('whiteboard-toolbar-compose');
  handler2('compose') &&
    el7['appendChild'](
      createToolbarButton({
        className: 'whiteboard-action-btn\x20act-compose',
        action: 'compose',
        label: '合成图像',
        icon: WHITEBOARD_TOOL_ICONS['compose'],
      }),
    );
  handler2('clear') &&
    el6['appendChild'](
      createToolbarButton({
        className: 'whiteboard-action-btn\x20act-clear',
        action: 'clear',
        label: '清空',
        shortcut: 'R',
        icon: WHITEBOARD_TOOL_ICONS['clear'],
      }),
    );
  const el8 = createToolbarGroup('whiteboard-toolbar-tools');
  if (handler2('upload-background')) {
    const el9 = createToolbarButton({
      className: 'whiteboard-upload-btn',
      action: 'upload-background',
      label: t('whiteboardNode.background.upload'),
      icon: WHITEBOARD_TOOL_ICONS['upload'],
    });
    ((el9['dataset']['i18nTooltip'] = 'whiteboardNode.background.upload'),
      (el9['dataset']['i18nAriaLabel'] = 'whiteboardNode.background.upload'));
    const el10 = document['createElement']('span');
    ((el10['className'] = 'whiteboard-upload-label'),
      (el10['dataset']['i18n'] = 'whiteboardNode.background.upload'),
      (el10['textContent'] = t('whiteboardNode.background.upload')),
      el9['appendChild'](el10),
      el8['appendChild'](el9),
      el8['appendChild'](createDivider()));
  }
  WHITEBOARD_PRIMARY_TOOLS['forEach']((tool3) => {
    el8['appendChild'](
      createToolbarButton({
        className: 'whiteboard-tool-btn',
        tool: tool3,
        label: WHITEBOARD_TOOL_LABELS[tool3] || tool3,
        shortcut: WHITEBOARD_TOOL_SHORTCUTS[tool3] || '',
        icon: WHITEBOARD_TOOL_ICONS[tool3],
      }),
    );
  });
  if (handler2('more-shapes')) {
    const el11 = document['createElement']('div');
    el11['className'] = 'whiteboard-more-wrap';
    const el12 = createToolbarButton({
      className: 'whiteboard-more-btn',
      action: 'more-shapes',
      label: '更多图形',
      icon: WHITEBOARD_TOOL_ICONS['more'],
    });
    (el12['setAttribute']('aria-haspopup', 'menu'), el12['setAttribute']('aria-expanded', 'false'));
    const el13 = document['createElement']('div');
    ((el13['className'] = 'whiteboard-shape-menu'),
      el13['setAttribute']('role', 'menu'),
      (el13['hidden'] = !![]),
      WHITEBOARD_SHAPE_OPTIONS['forEach']((event4) => {
        const el14 = document['createElement']('button');
        ((el14['type'] = 'button'),
          (el14['className'] = 'whiteboard-shape-option'),
          (el14['dataset']['shapeKey'] = event4['key']),
          (el14['dataset']['shapeTool'] = event4['tool']),
          (el14['dataset']['tooltip'] = event4['label']),
          el14['setAttribute']('aria-label', event4['label']),
          el14['setAttribute']('role', 'menuitem'),
          appendIcon(el14, event4['icon']),
          el13['appendChild'](el14));
      }),
      el11['appendChild'](el12),
      el11['appendChild'](el13),
      el8['appendChild'](el11));
  }
  return (
    [el8, el6, el7]
      ['filter']((value11) => value11['childElementCount'] > 0x0)
      ['forEach']((value12, count2) => {
        if (count2 > 0x0) el5['appendChild'](createDivider());
        el5['appendChild'](value12);
      }),
    applyI18n(el5),
    el5
  );
}
function createWhiteboardStylePanel() {
  const el15 = document['createElement']('div');
  ((el15['className'] = 'whiteboard-style-panel is-empty'),
    el15['setAttribute']('aria-hidden', 'true'),
    (el15['inert'] = !![]));
  const run = (value13, value14 = '') => {
      const el16 = document['createElement']('section');
      return (
        (el16['className'] = ['whiteboard-style-section', value14]['filter'](Boolean)['join']('\x20')),
        (el16['dataset']['styleControl'] = value13),
        el16
      );
    },
    el17 = run('color', 'whiteboard-style-color-section'),
    el18 = document['createElement']('div');
  ((el18['className'] = 'whiteboard-style-color-grid'),
    Object['keys'](COLOR_VAR_MAP)['forEach']((value15) => {
      const value16 = 'whiteboardNode.style.colors.' + value15,
        el19 = document['createElement']('button');
      ((el19['type'] = 'button'),
        (el19['className'] = 'whiteboard-color-swatch'),
        (el19['dataset']['color'] = value15),
        (el19['dataset']['i18nTooltip'] = value16),
        (el19['dataset']['i18nAriaLabel'] = value16),
        (el19['dataset']['tooltip'] = t(value16)),
        el19['setAttribute']('aria-label', t(value16)),
        el19['style']['setProperty']('--whiteboard-swatch-bg', getColorCss(value15)),
        el18['appendChild'](el19));
    }),
    el17['appendChild'](el18));
  const el20 = run('size', 'whiteboard-style-size-section'),
    el21 = document['createElement']('label');
  el21['className'] = 'whiteboard-style-size';
  const value17 = document['createElement']('span');
  value17['className'] = 'whiteboard-size-value';
  const value18 = document['createElement']('input');
  ((value18['className'] = 'whiteboard-size-range'),
    (value18['type'] = 'range'),
    (value18['min'] = '1'),
    (value18['max'] = '120'),
    (value18['step'] = '1'),
    el21['appendChild'](value17),
    el21['appendChild'](value18));
  const el22 = document['createElement']('div');
  ((el22['className'] = 'whiteboard-size-presets'),
    WHITEBOARD_SIZE_PRESETS['forEach']((el23) => {
      const el24 = document['createElement']('button');
      ((el24['type'] = 'button'),
        (el24['className'] = 'whiteboard-size-preset'),
        (el24['dataset']['sizeValue'] = String(el23['value'])),
        (el24['dataset']['i18nTooltip'] = el23['tooltipKey']),
        (el24['dataset']['i18nAriaLabel'] = el23['tooltipKey']),
        (el24['dataset']['tooltip'] = t(el23['tooltipKey'])),
        el24['setAttribute']('aria-label', t(el23['tooltipKey'])),
        (el24['textContent'] = el23['key']),
        el22['appendChild'](el24));
    }),
    el20['appendChild'](el21),
    el20['appendChild'](el22));
  const el25 = run('opacity', 'whiteboard-style-opacity-section'),
    el26 = document['createElement']('label');
  el26['className'] = 'whiteboard-style-opacity';
  const value19 = document['createElement']('span');
  value19['className'] = 'whiteboard-opacity-value';
  const value20 = document['createElement']('input');
  ((value20['className'] = 'whiteboard-opacity-range'),
    (value20['type'] = 'range'),
    (value20['min'] = '10'),
    (value20['max'] = '100'),
    (value20['step'] = '1'),
    el26['appendChild'](value19),
    el26['appendChild'](value20));
  const el27 = document['createElement']('div');
  ((el27['className'] = 'whiteboard-opacity-presets'),
    WHITEBOARD_OPACITY_PRESETS['forEach']((el28) => {
      const el29 = document['createElement']('button');
      ((el29['type'] = 'button'),
        (el29['className'] = 'whiteboard-style-option whiteboard-opacity-preset'),
        (el29['dataset']['styleProp'] = 'opacity'),
        (el29['dataset']['styleValue'] = String(el28['value'])),
        (el29['dataset']['tooltip'] = el28['key'] + '%'),
        el29['setAttribute']('aria-label', el28['key'] + '%'),
        (el29['textContent'] = el28['key']),
        el27['appendChild'](el29));
    }),
    el25['appendChild'](el26),
    el25['appendChild'](el27));
  const run2 = (value21, value22, list3) => {
      const el30 = run(value21, 'whiteboard-style-' + value21 + '-section'),
        el31 = document['createElement']('div');
      return (
        (el31['className'] = 'whiteboard-style-segmented'),
        list3['forEach']((el32) => {
          const el33 = document['createElement']('button'),
            value23 = el32['value'] ?? el32['key'];
          ((el33['type'] = 'button'),
            (el33['className'] = 'whiteboard-style-option'),
            (el33['dataset']['styleProp'] = el32['prop'] || value22),
            (el33['dataset']['styleValue'] = value23));
          const value24 = el32['tooltipKey'] || el32['labelKey'],
            value25 = value24 ? t(value24) : el32['tooltip'] || el32['key'] || value23;
          (value24 &&
            ((el33['dataset']['i18nTooltip'] = value24),
            (el33['dataset']['i18nAriaLabel'] = value24)),
            (el33['dataset']['tooltip'] = value25),
            el33['setAttribute']('aria-label', value25),
            el32['labelKey']
              ? ((el33['dataset']['i18n'] = el32['labelKey']),
                (el33['textContent'] = t(el32['labelKey'])))
              : (el33['textContent'] = el32['label']),
            el31['appendChild'](el33));
        }),
        el30['appendChild'](el31),
        el30
      );
    },
    handler3 = () => {
      const el34 = run('arrow-kind', 'whiteboard-style-arrow-kind-section'),
        el35 = document['createElement']('div');
      el35['className'] = 'whiteboard-arrow-kind-row';
      const el36 = document['createElement']('span');
      ((el36['dataset']['i18n'] = 'whiteboardNode.style.lineType'),
        (el36['textContent'] = t('whiteboardNode.style.lineType')));
      const el37 = document['createElement']('div');
      return (
        (el37['className'] = 'whiteboard-arrow-kind-options'),
        WHITEBOARD_ARROW_KIND_OPTIONS['forEach']((el38) => {
          const el39 = document['createElement']('button');
          ((el39['type'] = 'button'),
            (el39['className'] = 'whiteboard-style-option whiteboard-arrow-kind-option'),
            (el39['dataset']['styleProp'] = 'arrowKind'),
            (el39['dataset']['styleValue'] = el38['value']),
            (el39['dataset']['i18nTooltip'] = el38['tooltipKey']),
            (el39['dataset']['i18nAriaLabel'] = el38['tooltipKey']),
            (el39['dataset']['tooltip'] = t(el38['tooltipKey'])),
            el39['setAttribute']('aria-label', t(el38['tooltipKey'])),
            appendIcon(el39, el38['icon']),
            el37['appendChild'](el39));
        }),
        el35['appendChild'](el36),
        el35['appendChild'](el37),
        el34['appendChild'](el35),
        el34
      );
    },
    handler4 = () => {
      const el40 = run('arrowheads', 'whiteboard-style-arrowheads-section'),
        el41 = document['createElement']('div');
      el41['className'] = 'whiteboard-arrowheads-row';
      const el42 = document['createElement']('span');
      ((el42['dataset']['i18n'] = 'whiteboardNode.style.arrowheads'),
        (el42['textContent'] = t('whiteboardNode.style.arrowheads')),
        el41['appendChild'](el42),
        ['arrowStart', 'arrowEnd']['forEach']((value26) => {
          const el43 = document['createElement']('button');
          ((el43['type'] = 'button'),
            (el43['className'] = 'whiteboard-arrowhead-trigger'),
            (el43['dataset']['arrowheadTarget'] = value26));
          const value27 =
            value26 === 'arrowStart'
              ? 'whiteboardNode.style.terminal.start'
              : 'whiteboardNode.style.terminal.end';
          ((el43['dataset']['i18nTooltip'] = value27),
            (el43['dataset']['i18nAriaLabel'] = value27),
            (el43['dataset']['tooltip'] = t(value27)),
            el43['setAttribute']('aria-haspopup', 'menu'),
            el43['setAttribute']('aria-expanded', 'false'),
            el43['setAttribute']('aria-label', t(value27)),
            el41['appendChild'](el43));
        }));
      const el44 = document['createElement']('div');
      return (
        (el44['className'] = 'whiteboard-style-popover whiteboard-arrowhead-menu'),
        el44['setAttribute']('role', 'menu'),
        (el44['hidden'] = !![]),
        WHITEBOARD_ARROWHEAD_OPTIONS['forEach']((el45) => {
          const el46 = document['createElement']('button');
          ((el46['type'] = 'button'),
            (el46['className'] = 'whiteboard-arrowhead-option'),
            (el46['dataset']['arrowheadValue'] = el45['value']),
            (el46['dataset']['i18nTooltip'] = el45['tooltipKey']),
            (el46['dataset']['i18nAriaLabel'] = el45['tooltipKey']),
            (el46['dataset']['tooltip'] = t(el45['tooltipKey'])),
            el46['setAttribute']('aria-label', t(el45['tooltipKey'])),
            appendIcon(el46, el45['icon']),
            el44['appendChild'](el46));
        }),
        el40['appendChild'](el41),
        el40['appendChild'](el44),
        el40
      );
    };
  return (
    el15['appendChild'](el17),
    el15['appendChild'](el20),
    el15['appendChild'](el25),
    el15['appendChild'](run2('fill', 'fill', WHITEBOARD_FILL_OPTIONS)),
    el15['appendChild'](run2('dash', 'dash', WHITEBOARD_DASH_OPTIONS)),
    el15['appendChild'](run2('font', 'font', WHITEBOARD_FONT_OPTIONS)),
    el15['appendChild'](handler3()),
    el15['appendChild'](handler4()),
    applyI18n(el15),
    el15
  );
}
export class WhiteboardNode {
  constructor(value28) {
    ((this['_data'] = value28 && typeof value28 === 'object' ? value28 : {}),
      (this['id'] = this['_data']['id']),
      (this['el'] = document['createElement']('div')),
      (this['el']['className'] = 'v2-node-component\x20whiteboard-node-component'));
    const tool4 = normalizeWhiteboardState(this['_data']['whiteboard']);
    ((this['_whiteboard'] = tool4),
      (this['_commands'] = cloneCommands(tool4['commands'])),
      (this['_redoStack'] = []),
      (this['_draft'] = null),
      (this['_selectedTextCommandIndex'] = null),
      (this['_selectedCommandIndex'] = null),
      (this['_camera'] = cloneWhiteboardView(tool4['view'])),
      (this['_style'] = cloneWhiteboardStyle(tool4['style'])),
      (this['_view'] = {
        tool: tool4['tool'],
        shapeType: tool4['shapeType'],
        color: this['_style']['color'],
        brushSizePx: this['_style']['size'],
      }),
      (this['_saveTimer'] = null),
      (this['_resizeObserver'] = null),
      (this['_cleanup'] = []),
      (this['_cursorHover'] = ![]),
      (this['_cursorLast'] = { x: 0x0, y: 0x0 }),
      (this['_cursorWorldLast'] = { x: 0x0, y: 0x0 }),
      (this['_cursorRaf'] = 0x0),
      (this['_canvasSyncRaf'] = 0x0),
      (this['_layerEraserPreviewRaf'] = 0x0),
      (this['_pendingCanvasSyncAfterResize'] = ![]),
      (this['_pointerState'] = createPointerState()),
      (this['_modifierState'] = { space: ![], control: ![] }),
      (this['_temporaryTool'] = null),
      (this['_textInputEl'] = null),
      (this['_editingTextCommandIndex'] = null),
      (this['_fillRegionCache'] = new Map()),
      (this['_checkerPattern'] = null),
      (this['_canvasCssWidth'] = 0x1),
      (this['_canvasCssHeight'] = 0x1),
      (this['_lastPersistedSignature'] = getWhiteboardSignature(tool4)),
      (this['_isEditing'] = ![]),
      (this['_isComposingImageNode'] = ![]),
      (this['_isUploadingBackground'] = ![]),
      (this['_backgroundInput'] = null),
      (this['_backgroundInputSignature'] = ''),
      (this['_backgroundImage'] = null),
      (this['_backgroundLoadToken'] = 0x0),
      (this['_backgroundObjectUrl'] = ''));
  }
  ['mount']() {
    this['el']['replaceChildren']();
    const el47 = document['createElement']('div');
    el47['className'] = 'whiteboard-node-shell';
    const el48 = document['createElement']('div');
    el48['className'] = 'whiteboard-canvas-wrap';
    const value29 = document['createElement']('canvas');
    ((value29['className'] = 'v2-annotate-canvas whiteboard-canvas'), (value29['tabIndex'] = 0x0));
    const el49 = document['createElement']('div');
    ((el49['className'] = 'v2-annotate-cursor whiteboard-cursor'),
      (el49['style']['display'] = 'none'));
    const el50 = createWhiteboardToolbar(this['_data']['whiteboardToolbar']),
      value30 = Boolean(el50['querySelector']('.whiteboard-upload-btn')),
      el51 = value30 ? document['createElement']('input') : null;
    el51 &&
      ((el51['type'] = 'file'),
      (el51['accept'] = 'image/*'),
      (el51['className'] = 'whiteboard-background-file-input'),
      (el51['hidden'] = !![]),
      (el51['tabIndex'] = -0x1),
      el50['appendChild'](el51));
    const el52 = createWhiteboardStylePanel(),
      el53 = document['createElement']('div');
    ((el53['className'] = 'group-resizer\x20whiteboard-resizer\x20v2-resize-move'),
      el53['setAttribute']('aria-hidden', 'true'),
      el48['appendChild'](value29),
      el48['appendChild'](el49),
      el47['appendChild'](el48),
      el47['appendChild'](el53),
      this['el']['appendChild'](el50),
      this['el']['appendChild'](el52),
      this['el']['appendChild'](el47),
      (this['_shellEl'] = el47),
      (this['_canvasWrapEl'] = el48),
      (this['_resizerEl'] = el53),
      (this['canvasEl'] = value29),
      (this['cursorEl'] = el49),
      (this['toolbarEl'] = el50),
      (this['stylePanelEl'] = el52),
      (this['styleSections'] = Array['from'](el52['querySelectorAll']('[data-style-control]'))),
      (this['sizeValueEl'] = el52['querySelector']('.whiteboard-size-value')),
      (this['sizeRangeEl'] = el52['querySelector']('.whiteboard-size-range')),
      (this['sizePresetButtons'] = Array['from'](el52['querySelectorAll']('.whiteboard-size-preset'))),
      (this['opacityValueEl'] = el52['querySelector']('.whiteboard-opacity-value')),
      (this['opacityRangeEl'] = el52['querySelector']('.whiteboard-opacity-range')),
      (this['styleOptionButtons'] = Array['from'](el52['querySelectorAll']('.whiteboard-style-option'))),
      (this['arrowheadTriggerButtons'] = Array['from'](
        el52['querySelectorAll']('.whiteboard-arrowhead-trigger'),
      )),
      (this['arrowheadMenuEl'] = el52['querySelector']('.whiteboard-arrowhead-menu')),
      (this['arrowheadOptionButtons'] = Array['from'](
        el52['querySelectorAll']('.whiteboard-arrowhead-option'),
      )),
      (this['_activeArrowheadTarget'] = 'arrowEnd'),
      (this['colorWrapEl'] = el52['querySelector']('.whiteboard-style-color-grid')),
      (this['colorDotEl'] = null),
      (this['colorButtons'] = Array['from'](el52['querySelectorAll']('.whiteboard-color-swatch'))),
      (this['toolButtons'] = Array['from'](el50['querySelectorAll']('.whiteboard-tool-btn'))),
      (this['moreButtonEl'] = el50['querySelector']('.whiteboard-more-btn')),
      (this['shapeMenuEl'] = el50['querySelector']('.whiteboard-shape-menu')),
      (this['shapeOptionButtons'] = Array['from'](el50['querySelectorAll']('.whiteboard-shape-option'))),
      (this['composeButtonEl'] = el50['querySelector']('.act-compose')),
      (this['backgroundUploadButtonEl'] = el50['querySelector']('.whiteboard-upload-btn')),
      (this['backgroundFileInputEl'] = el51));
    const value31 = this['canvasEl']['getContext']('2d');
    return (
      (value31['lineCap'] = 'round'),
      (value31['lineJoin'] = 'round'),
      (this['_checkerPattern'] = createEraseCheckerboardPattern(value31, 0x1)),
      this['_bindSelection'](),
      this['_bindEventGuards'](),
      this['_bindCanvasEvents'](),
      this['_bindToolbarEvents'](),
      this['_bindResizeHandle'](el53),
      this['_bindResizeObserver'](),
      this['_bindSelectionState'](),
      this['_bindBackgroundInput'](),
      this['_setEditing'](![]),
      this['_syncToolbarState'](),
      this['_scheduleCanvasSync'](),
      this['el']
    );
  }
  ['update'](value32) {
    this['_data'] = value32 && typeof value32 === 'object' ? value32 : {};
    const whiteboardState = normalizeWhiteboardState(this['_data']['whiteboard']),
      whiteboardSignature = getWhiteboardSignature(whiteboardState);
    (whiteboardSignature !== this['_lastPersistedSignature'] &&
      whiteboardSignature !== this['_getCurrentSignature']() &&
      this['_loadWhiteboardState'](whiteboardState),
      this['_scheduleCanvasSync']());
  }
  ['unmount']() {
    (this['_setEditing'](![]),
      this['_flushSave'](),
      this['_cleanup']['forEach']((value33) => value33?.()),
      (this['_cleanup'] = []),
      this['_resizeObserver']?.['disconnect']?.(),
      (this['_resizeObserver'] = null),
      this['_removeTextInput'](![]),
      this['_saveTimer'] && (clearTimeout(this['_saveTimer']), (this['_saveTimer'] = null)),
      this['_cursorRaf'] && (cancelWhiteboardFrame(this['_cursorRaf']), (this['_cursorRaf'] = 0x0)),
      this['_canvasSyncRaf'] &&
        (cancelWhiteboardFrame(this['_canvasSyncRaf']), (this['_canvasSyncRaf'] = 0x0)),
      this['_cancelLayerEraserPreviewRender']?.(),
      (this['_backgroundLoadToken'] += 0x1),
      (this['_backgroundImage'] = null),
      this['_releaseBackgroundObjectUrl']());
  }
  ['_setEditing'](value34, { focusCanvas: focusCanvas = ![] } = {}) {
    const value35 = Boolean(value34);
    this['_syncEditingSurfaceState'](value35);
    if (this['_isEditing'] === value35) {
      if (value35 && focusCanvas) this['canvasEl']?.['focus']?.({ preventScroll: !![] });
      return;
    }
    this['_isEditing'] = value35;
    if (value35) {
      if (focusCanvas) this['canvasEl']?.['focus']?.({ preventScroll: !![] });
      this['_syncCursor']();
      return;
    }
    (this['_removeTextInput'](!![]),
      (this['_draft'] = null),
      (this['_selectedTextCommandIndex'] = null),
      (this['_selectedCommandIndex'] = null),
      (this['_modifierState'] = { space: ![], control: ![] }),
      (this['_temporaryTool'] = null),
      this['_cancelLayerEraserPreviewRender']?.(),
      this['_releasePointerCapture'](),
      (this['_pointerState'] = createPointerState()),
      (this['_cursorHover'] = ![]),
      this['_syncCursor'](),
      this['_render']());
  }
  ['_syncEditingSurfaceState'](value36 = this['_isEditing']) {
    const enabled4 = Boolean(value36);
    (this['el']?.['classList']?.['toggle']('is-whiteboard-editing', enabled4),
      this['_shellEl']?.['classList']?.['toggle']('is-whiteboard-editing', enabled4));
    if (this['toolbarEl']) this['toolbarEl']['inert'] = !enabled4;
    this['stylePanelEl'] &&
      (this['stylePanelEl']['inert'] =
        !enabled4 || this['stylePanelEl']['classList']['contains']('is-empty'));
    if (this['_resizerEl']) this['_resizerEl']['inert'] = !enabled4;
  }
  ['_bindSelection']() {
    this['el']['addEventListener'](
      'pointerdown',
      () => {
        const list4 = appStore['getStateRaw']?.()['selectedNodeIds'] || [];
        !list4['includes'](this['id']) && appStore['setSelectedNodes']([this['id']]);
      },
      !![],
    );
  }
  ['_bindEventGuards']() {
    ([
      'pointerdown',
      'pointermove',
      'pointerup',
      'pointercancel',
      'mousedown',
      'mouseup',
      'mousemove',
      'click',
      'dblclick',
      'keydown',
      'keyup',
      'wheel',
      'copy',
      'paste',
    ]['forEach']((value37) => {
      this['_shellEl']['addEventListener'](value37, (event5) => {
        if (this['_isEditing']) event5['stopPropagation']();
      });
    }),
      this['_shellEl']['addEventListener']('dblclick', (event6) => {
        (event6['preventDefault'](),
          event6['stopPropagation'](),
          this['_setEditing'](!![], { focusCanvas: !![] }));
      }),
      this['_shellEl']['addEventListener']('contextmenu', (event7) => {
        if (!this['_isEditing']) return;
        (event7['preventDefault'](), event7['stopPropagation']());
      }));
    const value38 = (value39) => {
        this['_handleKeyDown'](value39);
      },
      value40 = (value41) => {
        this['_handleKeyUp'](value41);
      },
      value42 = (value43) => {
        this['_handleOutsidePointerDown'](value43);
      };
    (window['addEventListener']('keydown', value38, !![]),
      window['addEventListener']('keyup', value40, !![]),
      document['addEventListener']('pointerdown', value42, !![]),
      this['_cleanup']['push'](() => window['removeEventListener']('keydown', value38, !![])),
      this['_cleanup']['push'](() => window['removeEventListener']('keyup', value40, !![])),
      this['_cleanup']['push'](() => document['removeEventListener']('pointerdown', value42, !![])));
  }
  ['_bindCanvasEvents']() {
    const run3 = (event8) => {
      ((this['_cursorLast'] = this['_getCanvasPointFromClient'](event8['clientX'], event8['clientY'])),
        (this['_cursorWorldLast'] = this['_screenToWorld'](this['_cursorLast'])));
      if (this['_cursorRaf']) return;
      this['_cursorRaf'] = requestAnimationFrame(() => {
        ((this['_cursorRaf'] = 0x0), this['_syncCursor']());
      });
    };
    (this['canvasEl']['addEventListener']('pointerdown', (event9) => {
      if (!this['_isEditing']) return;
      (event9['preventDefault'](),
        event9['stopPropagation'](),
        this['canvasEl']['focus']?.({ preventScroll: !![] }),
        run3(event9),
        this['_startDraft'](event9));
    }),
      this['canvasEl']['addEventListener']('pointermove', (event10) => {
        if (!this['_isEditing']) return;
        (event10['preventDefault'](),
          event10['stopPropagation'](),
          run3(event10),
          this['_moveDraft'](event10));
      }),
      this['canvasEl']['addEventListener']('pointerup', (event11) => {
        if (!this['_isEditing']) return;
        (event11['preventDefault'](),
          event11['stopPropagation'](),
          run3(event11),
          this['_endDraft']());
      }),
      this['canvasEl']['addEventListener']('pointercancel', (event12) => {
        if (!this['_isEditing']) return;
        (event12['preventDefault'](),
          event12['stopPropagation'](),
          run3(event12),
          this['_endDraft']());
      }),
      this['canvasEl']['addEventListener']('pointerenter', (value44) => {
        if (!this['_isEditing']) return;
        ((this['_cursorHover'] = !![]), run3(value44));
      }),
      this['canvasEl']['addEventListener']('pointerleave', () => {
        if (!this['_isEditing']) return;
        ((this['_cursorHover'] = ![]), this['_syncCursor']());
      }),
      this['canvasEl']['addEventListener']('lostpointercapture', (event13) => {
        if (!this['_isEditing']) return;
        if (this['_pointerState']?.['pointerId'] !== event13['pointerId']) return;
        this['_endDraft']({ releaseCapture: ![] });
      }),
      this['canvasEl']['addEventListener']('dblclick', (event14) => {
        if (!this['_isEditing']) return;
        const value45 = this['_getLocalFromClient'](event14['clientX'], event14['clientY']),
          enabled5 = this['_findTextHit'](value45);
        if (!enabled5 || this['_commands'][enabled5['index']]?.['type'] !== 'text') return;
        (event14['preventDefault'](),
          event14['stopPropagation'](),
          this['_editTextCommand'](enabled5['index']));
      }),
      this['canvasEl']['addEventListener']('wheel', (value46) => this['_onCanvasWheel'](value46), {
        passive: ![],
      }));
  }
  ['_bindToolbarEvents']() {
    const run4 = () => this['colorWrapEl']?.['classList']['remove']('open'),
      handler5 = () => {
        if (this['shapeMenuEl']) this['shapeMenuEl']['hidden'] = !![];
        this['moreButtonEl']?.['setAttribute']('aria-expanded', 'false');
      },
      handler6 = () => {
        if (this['arrowheadMenuEl']) this['arrowheadMenuEl']['hidden'] = !![];
        this['arrowheadTriggerButtons']?.['forEach']((el54) =>
          el54['setAttribute']('aria-expanded', 'false'),
        );
      },
      value47 = (event15) => {
        this['colorWrapEl'] &&
          this['colorWrapEl']['classList']['contains']('open') &&
          !this['colorWrapEl']['contains'](event15['target']) &&
          run4();
        this['shapeMenuEl'] &&
          !this['shapeMenuEl']['hidden'] &&
          !this['moreButtonEl']?.['parentElement']?.['contains']?.(event15['target']) &&
          handler5();
        const enabled6 = this['arrowheadMenuEl']?.['parentElement']?.['contains']?.(event15['target']);
        if (!enabled6) handler6();
      };
    (document['addEventListener']('pointerdown', value47, !![]),
      this['_cleanup']['push'](() => document['removeEventListener']('pointerdown', value47, !![])),
      [this['toolbarEl'], this['stylePanelEl']]['filter'](Boolean)['forEach']((el55) => {
        (el55['addEventListener']('pointerdown', (event16) => {
          if (!this['_isEditing']) return;
          event16['stopPropagation']();
        }),
          el55['addEventListener']('dblclick', (event17) => {
            if (!this['_isEditing']) return;
            (event17['preventDefault'](), event17['stopPropagation']());
          }),
          el55['addEventListener']('wheel', (event18) => {
            if (!this['_isEditing']) return;
            event18['stopPropagation']();
          }));
      }),
      this['toolButtons']['forEach']((el56) => {
        el56['addEventListener']('click', (event19) => {
          if (!this['_isEditing']) return;
          (event19['stopPropagation'](),
            this['canvasEl']?.['focus']?.({ preventScroll: !![] }),
            this['_setTool'](el56['dataset']['tool']));
        });
      }),
      this['moreButtonEl']?.['addEventListener']('click', (event20) => {
        if (!this['_isEditing']) return;
        event20['stopPropagation']();
        const enabled7 = Boolean(this['shapeMenuEl']?.['hidden']);
        if (this['shapeMenuEl']) this['shapeMenuEl']['hidden'] = !enabled7;
        this['moreButtonEl']?.['setAttribute']('aria-expanded', enabled7 ? 'true' : 'false');
      }),
      this['shapeOptionButtons']?.['forEach']((el57) => {
        el57['addEventListener']('click', (event21) => {
          if (!this['_isEditing']) return;
          event21['stopPropagation']();
          const el58 = WHITEBOARD_SHAPE_OPTIONS['find'](
            (event22) => event22['key'] === el57['dataset']['shapeKey'],
          );
          if (!el58) return;
          ((el58['tool'] === 'shape' || el58['tool'] === 'rect') &&
            (this['_view']['shapeType'] = el58['key']),
            el58['style'] &&
              Object['entries'](el58['style'])['forEach'](([value48, value49]) => {
                this['_style'][value48] = normalizeStyleValue(value48, value49);
              }),
            this['_setTool'](el58['tool']),
            handler5(),
            this['canvasEl']?.['focus']?.({ preventScroll: !![] }));
        });
      }),
      this['colorWrapEl']?.['addEventListener']('pointerdown', (event23) => {
        if (!this['_isEditing']) return;
        event23['stopPropagation']();
      }),
      this['colorWrapEl']
        ?.['querySelector']('.whiteboard-color-toggle')
        ?.['addEventListener']('click', (event24) => {
          if (!this['_isEditing']) return;
          (event24['stopPropagation'](), this['colorWrapEl']?.['classList']['toggle']('open'));
        }),
      this['colorButtons']['forEach']((el59) => {
        el59['addEventListener']('click', (event25) => {
          if (!this['_isEditing']) return;
          (event25['stopPropagation'](),
            this['canvasEl']?.['focus']?.({ preventScroll: !![] }),
            this['_setColor'](el59['dataset']['color']),
            run4());
        });
      }),
      this['sizeRangeEl']?.['addEventListener']('input', (event26) => {
        if (!this['_isEditing']) return;
        this['_setBrushSize'](event26['target']['value']);
      }),
      this['opacityRangeEl']?.['addEventListener']('input', (event27) => {
        if (!this['_isEditing']) return;
        this['_setStyleValue']('opacity', Number(event27['target']['value']) / 0x64);
      }),
      this['sizePresetButtons']?.['forEach']((el60) => {
        el60['addEventListener']('click', (event28) => {
          if (!this['_isEditing']) return;
          (event28['stopPropagation'](),
            this['canvasEl']?.['focus']?.({ preventScroll: !![] }),
            this['_setBrushSize'](el60['dataset']['sizeValue']));
        });
      }),
      this['styleOptionButtons']?.['forEach']((el61) => {
        el61['addEventListener']('click', (event29) => {
          if (!this['_isEditing']) return;
          (event29['stopPropagation'](), this['canvasEl']?.['focus']?.({ preventScroll: !![] }));
          const value50 = el61['dataset']['styleProp'];
          let value51 = el61['dataset']['styleValue'];
          ((value50 === 'arrowStart' || value50 === 'arrowEnd') &&
            el61['classList']['contains']('active') &&
            (value51 = 'none'),
            this['_setStyleValue'](value50, value51));
        });
      }),
      this['arrowheadTriggerButtons']?.['forEach']((el62) => {
        el62['addEventListener']('click', (event30) => {
          if (!this['_isEditing']) return;
          event30['stopPropagation']();
          const enabled8 = Boolean(this['arrowheadMenuEl']?.['hidden']);
          (handler6(),
            (this['_activeArrowheadTarget'] = el62['dataset']['arrowheadTarget'] || 'arrowEnd'));
          if (this['arrowheadMenuEl']) this['arrowheadMenuEl']['hidden'] = !enabled8;
          (el62['setAttribute']('aria-expanded', enabled8 ? 'true' : 'false'),
            this['_syncToolbarState']());
        });
      }),
      this['arrowheadOptionButtons']?.['forEach']((el63) => {
        el63['addEventListener']('click', (event31) => {
          if (!this['_isEditing']) return;
          (event31['stopPropagation'](),
            this['_setStyleValue'](
              this['_activeArrowheadTarget'] || 'arrowEnd',
              el63['dataset']['arrowheadValue'],
            ),
            handler6());
        });
      }),
      this['toolbarEl']['querySelector']('.act-undo')?.['addEventListener']('click', (event32) => {
        if (!this['_isEditing']) return;
        (event32['stopPropagation'](),
          this['canvasEl']?.['focus']?.({ preventScroll: !![] }),
          this['_undo']());
      }),
      this['toolbarEl']['querySelector']('.act-redo')?.['addEventListener']('click', (event33) => {
        if (!this['_isEditing']) return;
        (event33['stopPropagation'](),
          this['canvasEl']?.['focus']?.({ preventScroll: !![] }),
          this['_redo']());
      }),
      this['toolbarEl']['querySelector']('.act-clear')?.['addEventListener']('click', (event34) => {
        if (!this['_isEditing']) return;
        (event34['stopPropagation'](),
          this['canvasEl']?.['focus']?.({ preventScroll: !![] }),
          this['_clear']());
      }),
      this['composeButtonEl']?.['addEventListener']('click', (event35) => {
        if (!this['_isEditing']) return;
        (event35['stopPropagation'](), void this['_createImageNodeFromWhiteboard']());
      }),
      this['backgroundUploadButtonEl']?.['addEventListener']('click', (event36) => {
        if (!this['_isEditing']) return;
        (event36['preventDefault'](), event36['stopPropagation']());
        if (this['_isUploadingBackground']) return;
        this['backgroundFileInputEl']?.['click']?.();
      }),
      this['backgroundFileInputEl']?.['addEventListener']('change', (event37) => {
        if (!this['_isEditing']) return;
        event37['stopPropagation']();
        const enabled9 = event37['target']?.['files']?.[0x0] || null;
        event37['target']['value'] = '';
        if (!enabled9) return;
        void this['_uploadBackgroundImage'](enabled9);
      }));
  }
  ['_bindResizeHandle'](el64) {
    el64['addEventListener']('pointerdown', (event38) => {
      if (!this['_isEditing']) return;
      (event38['preventDefault'](),
        event38['stopPropagation'](),
        this['_flushSave'](),
        startNodeResizePreview({
          event: event38,
          nodeId: this['id'],
          getNode: () => appStore['getStateRaw']()['nodes']?.[this['id']] || this['_data'],
          getViewport: () => appStore['getStateRaw']()['viewport'],
          resolveSize: ({ startWidth: startWidth, startHeight: startHeight, dx: dx, dy: dy }) => ({
            width: Math['max'](WHITEBOARD_MIN_WIDTH, startWidth + dx),
            height: Math['max'](WHITEBOARD_MIN_HEIGHT, startHeight + dy),
          }),
          applyPatch: (value52) => appStore['updateNodeData'](this['id'], value52),
          onPreviewEnd: () => this['_scheduleCanvasSync']({ force: !![] }),
          commit: commit,
        }));
    });
  }
  ['_bindResizeObserver']() {
    if (typeof ResizeObserver !== 'function' || !this['_canvasWrapEl']) return;
    ((this['_resizeObserver'] = new ResizeObserver(() => this['_scheduleCanvasSync']())),
      this['_resizeObserver']['observe'](this['_canvasWrapEl']));
  }
  ['_bindSelectionState']() {
    if (typeof appStore['subscribeSelector'] !== 'function') return;
    const value53 = appStore['subscribeSelector'](
      (state2) => {
        const value54 = Array['isArray'](state2['selectedNodeIds'])
            ? state2['selectedNodeIds']['includes'](this['id'])
            : ![],
          value55 = Boolean(state2['nodes']?.[this['id']]);
        return (value55 ? '1' : '0') + ':' + (value54 ? '1' : '0');
      },
      (value56) => {
        if (value56 !== '1:1') this['_setEditing'](![]);
      },
      { isEqual: Object['is'] },
    );
    this['_cleanup']['push'](value53);
  }
  ['_bindBackgroundInput']() {
    if (typeof appStore['subscribeSelector'] !== 'function') return;
    const value57 = appStore['subscribeSelector'](
      (nodes) =>
        getWhiteboardBackgroundInputSignature(
          resolveWhiteboardBackgroundInput({
            whiteboardId: this['id'],
            nodes: nodes['nodes'],
            edges: nodes['edges'],
          }),
        ),
      () => this['_syncBackgroundInputFromStore'](),
      { isEqual: Object['is'] },
    );
    this['_cleanup']['push'](value57);
  }
  ['_releaseBackgroundObjectUrl']() {
    const enabled10 = this['_backgroundObjectUrl'];
    this['_backgroundObjectUrl'] = '';
    if (!enabled10 || typeof globalThis['URL']?.['revokeObjectURL'] !== 'function') return;
    globalThis['URL']['revokeObjectURL'](enabled10);
  }
  ['_getMountedBackgroundPreviewImage'](value58) {
    const enabled11 = String(value58 || '')['trim']();
    if (!enabled11) return null;
    const value59 = globalThis['window']?.['v2Renderer'],
      value60 = [
        '.img-node-preview img.node-img',
        '.img-node-preview\x20img.aigen-image-media',
        '.img-node-preview\x20img.v2-media-preview',
      ]['join'](',\x20');
    let box6 = null;
    try {
      box6 = value59?.['queryMountedNodeElement']?.(enabled11, value60) || null;
    } catch {}
    if (!box6)
      try {
        box6 = value59?.['getMountedWrapper']?.(enabled11)?.['querySelector']?.(value60) || null;
      } catch {}
    const count3 = Number(box6?.['naturalWidth'] || box6?.['width'] || 0x0),
      count4 = Number(box6?.['naturalHeight'] || box6?.['height'] || 0x0);
    if (!box6 || box6['complete'] === ![] || !(count3 > 0x0 && count4 > 0x0)) return null;
    return box6;
  }
  ['_syncBackgroundInputFromStore']({ force: force = ![] } = {}) {
    const nodes2 = appStore['getStateRaw']?.() || appStore['getState']?.() || {},
      imageWidth = resolveWhiteboardBackgroundInput({
        whiteboardId: this['id'],
        nodes: nodes2['nodes'],
        edges: nodes2['edges'],
      }),
      whiteboardBackgroundInputSignature = getWhiteboardBackgroundInputSignature(imageWidth);
    if (!force && whiteboardBackgroundInputSignature === this['_backgroundInputSignature']) return;
    ((this['_backgroundInputSignature'] = whiteboardBackgroundInputSignature),
      (this['_backgroundInput'] = imageWidth),
      (this['_backgroundLoadToken'] += 0x1),
      (this['_backgroundImage'] = null),
      this['_releaseBackgroundObjectUrl']());
    imageWidth?.['width'] > 0x0 &&
      imageWidth?.['height'] > 0x0 &&
      this['_adaptWhiteboardSizeToBackground'](imageWidth, {
        imageWidth: imageWidth['width'],
        imageHeight: imageWidth['height'],
        commitHistory: ![],
      });
    this['_scheduleCanvasSync']();
    if (imageWidth) void this['_loadBackgroundImage'](imageWidth, this['_backgroundLoadToken']);
  }
  async ['_loadBackgroundImage'](response, value61) {
    let value62 = '',
      imageWidth2 = null,
      value63 = '';
    const value64 = Array['from'](
        new Set(
          (response?.['previewUrls'] || [])
            ['map']((value65) => String(value65 || '')['trim']())
            ['filter'](Boolean),
        ),
      ),
      value66 = Array['from'](
        new Set(
          [...(response?.['fullUrls'] || response?.['urls'] || []), response?.['url']]
            ['map']((value67) => String(value67 || '')['trim']())
            ['filter'](Boolean),
        ),
      );
    imageWidth2 = this['_getMountedBackgroundPreviewImage']?.(response?.['sourceId']);
    imageWidth2 && (value63 = String(imageWidth2['currentSrc'] || imageWidth2['src'] || '')['trim']());
    for (const value68 of value64) {
      if (imageWidth2) break;
      imageWidth2 = await this['_loadBackgroundImageElement'](value68);
      if (value61 !== this['_backgroundLoadToken']) return;
      if (imageWidth2) {
        value63 = value68;
        break;
      }
    }
    if (!imageWidth2)
      for (const value69 of response?.['thumbnailCacheRefs'] || []) {
        try {
          const thumbnail = await getThumbnail(value69);
          if (value61 !== this['_backgroundLoadToken']) return;
          if (!thumbnail) continue;
          imageWidth2 = await this['_loadBackgroundImageElement'](thumbnail);
          if (value61 !== this['_backgroundLoadToken']) return;
          if (imageWidth2) {
            value63 = thumbnail;
            break;
          }
        } catch (value70) {
          console['warn']('[WhiteboardNode] load cached background thumbnail failed:', value70);
        }
      }
    if (!imageWidth2)
      for (const value71 of response?.['thumbIds'] || []) {
        try {
          const image2 = await getImage(value71);
          if (value61 !== this['_backgroundLoadToken']) return;
          if (!image2 || typeof globalThis['URL']?.['createObjectURL'] !== 'function') continue;
          ((value62 = globalThis['URL']['createObjectURL'](image2)),
            (imageWidth2 = await this['_loadBackgroundImageElement'](value62)));
          if (value61 !== this['_backgroundLoadToken']) {
            globalThis['URL']?.['revokeObjectURL']?.(value62);
            return;
          }
          if (imageWidth2) {
            value63 = value62;
            break;
          }
          (globalThis['URL']?.['revokeObjectURL']?.(value62), (value62 = ''));
        } catch (value72) {
          console['warn']('[WhiteboardNode]\x20load\x20background\x20thumbnail\x20failed:', value72);
        }
      }
    imageWidth2 &&
      ((this['_backgroundImage'] = imageWidth2),
      (this['_backgroundObjectUrl'] = value62),
      this['_adaptWhiteboardSizeToBackground']?.(response, {
        imageWidth: imageWidth2['naturalWidth'],
        imageHeight: imageWidth2['naturalHeight'],
        commitHistory: !![],
      }),
      this['_scheduleCanvasSync']());
    let imageWidth3 = null;
    for (const value73 of value66) {
      if (value73 === value63 && imageWidth2) {
        imageWidth3 = imageWidth2;
        break;
      }
      imageWidth3 = await this['_loadBackgroundImageElement'](value73);
      if (value61 !== this['_backgroundLoadToken']) return;
      if (imageWidth3) break;
    }
    if (value61 !== this['_backgroundLoadToken']) return;
    if (!imageWidth3) {
      !imageWidth2 && value62 && globalThis['URL']?.['revokeObjectURL']?.(value62);
      return;
    }
    imageWidth3 !== imageWidth2 &&
      ((this['_backgroundImage'] = imageWidth3),
      this['_adaptWhiteboardSizeToBackground']?.(response, {
        imageWidth: imageWidth3['naturalWidth'],
        imageHeight: imageWidth3['naturalHeight'],
        commitHistory: !![],
      }),
      value62 && this['_backgroundObjectUrl'] === value62 && this['_releaseBackgroundObjectUrl'](),
      this['_scheduleCanvasSync']());
  }
  async ['_loadBackgroundImageElement'](value74) {
    const run5 = globalThis['Image'];
    if (typeof run5 !== 'function') return null;
    const value75 = new run5();
    value75['decoding'] = 'async';
    if (/^https?:/i['test'](value74)) value75['crossOrigin'] = 'anonymous';
    const value76 = await new Promise((handler7) => {
      ((value75['onload'] = () => handler7(!![])),
        (value75['onerror'] = () => handler7(![])),
        (value75['src'] = value74));
    });
    return ((value75['onload'] = null), (value75['onerror'] = null), value76 ? value75 : null);
  }
  ['_adaptWhiteboardSizeToBackground'](
    box7,
    { imageWidth: imageWidth4, imageHeight: imageHeight, commitHistory: commitHistory = ![] } = {},
  ) {
    const imageWidth5 = Number(imageWidth4 || box7?.['width'] || 0x0),
      imageHeight2 = Number(imageHeight || box7?.['height'] || 0x0);
    if (!(imageWidth5 > 0x0 && imageHeight2 > 0x0)) return ![];
    const box8 = appStore['getStateRaw']?.()['nodes']?.[this['id']] || this['_data'] || {},
      whiteboardBackgroundFitKey = [
        box7?.['edgeId'] || 'pending',
        box7?.['sourceId'] || 'upload',
        Math['round'](imageWidth5),
        Math['round'](imageHeight2),
      ]['join'](':');
    if (String(box8['whiteboardBackgroundFitKey'] || '') === whiteboardBackgroundFitKey) return ![];
    const currentWidth = Number(box8['width']) || WHITEBOARD_DEFAULT_SIZE['width'],
      currentHeight = Number(box8['height']) || WHITEBOARD_DEFAULT_SIZE['height'],
      width = getWhiteboardSizeForBackground({
        imageWidth: imageWidth5,
        imageHeight: imageHeight2,
        currentWidth: currentWidth,
        currentHeight: currentHeight,
        minWidth: WHITEBOARD_MIN_WIDTH,
        minHeight: WHITEBOARD_MIN_HEIGHT,
      });
    if (!width) return ![];
    const x2 = Number(box8['x']) || 0x0,
      y = Number(box8['y']) || 0x0,
      args4 = {
        width: width['width'],
        height: width['height'],
        x: x2 + (currentWidth - width['width']) / 0x2,
        y: y + (currentHeight - width['height']) / 0x2,
        whiteboardBackgroundFitKey: whiteboardBackgroundFitKey,
      };
    return (
      appStore['updateNodeData'](this['id'], args4),
      (this['_data'] = { ...this['_data'], ...args4 }),
      commitHistory && (commit(), globalThis['window']?.['_triggerLocalCacheSave']?.()),
      !![]
    );
  }
  async ['_showPendingBackgroundPreview'](error) {
    if (!error) return ![];
    const value77 = this['_backgroundLoadToken'] + 0x1;
    ((this['_backgroundLoadToken'] = value77), this['_releaseBackgroundObjectUrl']());
    let value78 = '',
      image3 = null,
      box9 = null;
    try {
      ((box9 = await this['_createFastBackgroundPreview']?.(error)),
        (image3 = box9?.['image'] || null));
    } catch (value79) {
      console['warn']('[WhiteboardNode] create fast background preview failed:', value79);
    }
    if (!image3 && typeof globalThis['URL']?.['createObjectURL'] === 'function')
      try {
        ((value78 = globalThis['URL']['createObjectURL'](error)),
          (image3 = await this['_loadBackgroundImageElement'](value78)));
        const value80 = image3 && this['_createDecodedBackgroundPreview']?.(image3);
        value80?.['image'] &&
          ((box9 = value80),
          (image3 = value80['image']),
          globalThis['URL']?.['revokeObjectURL']?.(value78),
          (value78 = ''));
      } catch (value81) {
        console['warn']('[WhiteboardNode] load pending background preview failed:', value81);
      }
    if (!image3 || value77 !== this['_backgroundLoadToken']) {
      if (value78) globalThis['URL']?.['revokeObjectURL']?.(value78);
      return ![];
    }
    return (
      (this['_backgroundInput'] = {
        identity: 'pending-upload:' + (error['name'] || 'image') + ':' + (error['size'] || 0x0),
        sourceId: '',
        edgeId: '',
        width: Number(box9?.['width'] || image3['naturalWidth'] || image3['width'] || 0x0),
        height: Number(box9?.['height'] || image3['naturalHeight'] || image3['height'] || 0x0),
      }),
      (this['_backgroundImage'] = image3),
      (this['_backgroundObjectUrl'] = value78),
      this['_scheduleCanvasSync'](),
      {
        image: image3,
        width: this['_backgroundInput']['width'],
        height: this['_backgroundInput']['height'],
        thumbnailDataUrl: String(box9?.['thumbnailDataUrl'] || ''),
      }
    );
  }
  ['_createFastBackgroundPreview'](value82) {
    return createFastWhiteboardBackgroundPreview(value82);
  }
  ['_createDecodedBackgroundPreview'](value83) {
    return createWhiteboardBackgroundPreviewFromDecodedImage(value83);
  }
  ['_scheduleCanvasSync']({ force: force = ![] } = {}) {
    if (!force && this['el']?.['classList']?.['contains']?.('is-resizing')) {
      this['_pendingCanvasSyncAfterResize'] = !![];
      return;
    }
    if (force) this['_pendingCanvasSyncAfterResize'] = ![];
    if (this['_canvasSyncRaf']) return;
    this['_canvasSyncRaf'] = requestWhiteboardFrame(() => {
      ((this['_canvasSyncRaf'] = 0x0), this['_syncCanvasSize'](), this['_render'](), this['_syncCursor']());
    });
  }
  ['_syncCanvasSize']() {
    if (!this['canvasEl'] || !this['_canvasWrapEl']) return;
    const value84 = Math['max'](0x1, Math['round'](this['_canvasWrapEl']['clientWidth'] || 0x1)),
      value85 = Math['max'](0x1, Math['round'](this['_canvasWrapEl']['clientHeight'] || 0x1)),
      value86 = window['devicePixelRatio'] || 0x1,
      value87 = Math['round'](value84 * value86),
      value88 = Math['round'](value85 * value86);
    if (this['canvasEl']['width'] !== value87 || this['canvasEl']['height'] !== value88) {
      ((this['canvasEl']['width'] = value87),
        (this['canvasEl']['height'] = value88),
        (this['canvasEl']['style']['width'] = value84 + 'px'),
        (this['canvasEl']['style']['height'] = value85 + 'px'));
      const value89 = this['canvasEl']['getContext']('2d');
      (value89['setTransform'](value86, 0x0, 0x0, value86, 0x0, 0x0),
        (value89['lineCap'] = 'round'),
        (value89['lineJoin'] = 'round'),
        this['_fillRegionCache']['clear']());
    }
    ((this['_canvasCssWidth'] = value84), (this['_canvasCssHeight'] = value85));
  }
  ['_getViewport']() {
    return cloneWhiteboardView(this['_camera']);
  }
  ['_getCanvasPointFromClient'](value90, value91) {
    const box10 = this['canvasEl']?.['getBoundingClientRect']?.();
    if (!box10 || box10['width'] <= 0x0 || box10['height'] <= 0x0) return { x: 0x0, y: 0x0 };
    return {
      x: ((value90 - box10['left']) * this['_canvasCssWidth']) / box10['width'],
      y: ((value91 - box10['top']) * this['_canvasCssHeight']) / box10['height'],
    };
  }
  ['_screenToWorld'](value92) {
    return getWorldPointFromScreen(value92, this['_getViewport']());
  }
  ['_worldToScreen'](value93) {
    return getScreenPointFromWorld(value93, this['_getViewport']());
  }
  ['_getLocalFromClient'](value94, value95) {
    return this['_screenToWorld'](this['_getCanvasPointFromClient'](value94, value95));
  }
  ['_setCamera'](value96, { scheduleSave: scheduleSave = !![] } = {}) {
    ((this['_camera'] = cloneWhiteboardView(value96)),
      this['_fillRegionCache']['clear'](),
      (this['_cursorWorldLast'] = this['_screenToWorld'](this['_cursorLast'])),
      this['_render'](),
      this['_syncCursor']());
    if (scheduleSave) this['_scheduleSave']();
  }
  ['_startDraft'](event39) {
    const event40 = this['_pointerState'],
      x3 = this['_getLocalFromClient'](event39['clientX'], event39['clientY']),
      value97 = this['_getCanvasPointFromClient'](event39['clientX'], event39['clientY']),
      modifierTemporaryTool2 = resolveModifierTemporaryTool(this['_modifierState']),
      value98 = modifierTemporaryTool2 || this['_temporaryTool'] || this['_view']['tool'] || WHITEBOARD_DEFAULT_TOOL,
      enabled12 = value98 === 'hand' || event39['button'] === 0x1,
      enabled13 =
        !enabled12 &&
        (event39['button'] === 0x2 ||
          event39['ctrlKey'] === !![] ||
          this['_modifierState']?.['control'] === !![]),
      type = enabled13 ? 'eraser' : value98,
      opacity = cloneWhiteboardStyle(this['_style']),
      clampImageBrushSize2 = clampImageBrushSize(opacity['size']),
      sizeWorld = clampImageBrushSize2 / this['_getViewport']()['zoom'],
      index2 =
        type === 'arrow' && !enabled12 && !enabled13
          ? this['_findSelectedArrowHandleHit'](x3)
          : null;
    type !== 'text' &&
      type !== 'select' &&
      !index2 &&
      ((this['_selectedTextCommandIndex'] = null), (this['_selectedCommandIndex'] = null));
    enabled13
      ? ((event40['previousTool'] = this['_view']['tool'] || WHITEBOARD_DEFAULT_TOOL),
        (event40['temporaryTool'] = 'eraser'),
        (this['_temporaryTool'] = 'eraser'),
        this['_syncCursor']('eraser', clampImageBrushSize2))
      : ((event40['previousTool'] = null),
        (event40['temporaryTool'] = null),
        (this['_temporaryTool'] = modifierTemporaryTool2));
    if (enabled12 || type === 'hand')
      return (
        this['_removeTextInput'](!![]),
        (event40['down'] = !![]),
        (event40['pointerId'] = event39['pointerId']),
        (event40['mode'] = 'pan'),
        (event40['panStart'] = value97),
        (event40['panView'] = this['_getViewport']()),
        this['_capturePointer'](event39['pointerId']),
        this['_syncCursor']('hand'),
        !![]
      );
    if (type === 'eraser')
      return (
        this['_removeTextInput'](!![]),
        (event40['down'] = !![]),
        (event40['pointerId'] = event39['pointerId']),
        (event40['mode'] = 'erase-layers'),
        (event40['eraseLast'] = x3),
        (event40['eraseIndices'] = new Set()),
        (event40['eraseTrail'] = [{ x: x3['x'], y: x3['y'] }]),
        this['_collectLayerEraseHits'](x3, x3, sizeWorld / 0x2),
        this['_capturePointer'](event39['pointerId']),
        this['_syncToolbarState'](),
        this['_syncCursor']('eraser', clampImageBrushSize2),
        this['_render'](),
        !![]
      );
    if (index2)
      return (
        this['_removeTextInput'](!![]),
        (this['_selectedTextCommandIndex'] = null),
        (event40['down'] = !![]),
        (event40['pointerId'] = event39['pointerId']),
        (event40['mode'] = 'arrow-handle'),
        (event40['arrowTransform'] = {
          type: 'handle',
          index: index2['index'],
          handle: index2['handle'],
          moved: ![],
        }),
        this['_capturePointer'](event39['pointerId']),
        this['_syncToolbarState'](),
        this['_syncCursor']('arrow'),
        this['_render'](),
        !![]
      );
    if (type === 'bucket') return (this['_fillArea'](x3), !![]);
    if (type === 'number-label') return (this['_addNumberLabel'](x3, sizeWorld), !![]);
    if (type === 'select' || type === 'text') {
      if (this['_textInputEl']) this['_removeTextInput'](!![]);
      const value99 = this['_findTextHit'](x3);
      if (value99) {
        ((this['_selectedTextCommandIndex'] = value99['index']),
          (this['_selectedCommandIndex'] = value99['index']));
        if (type === 'text') return (this['_editTextCommand'](value99['index']), !![]);
        if (value99['mode'] === 'delete') return (this['_deleteTextCommand'](value99['index']), !![]);
        if (value99['mode'] === 'copy') return (this['_copyTextCommand'](value99['index']), !![]);
        const enabled14 = this['_createTextTransformState'](value99, x3);
        if (!enabled14) return !![];
        return (
          (event40['down'] = !![]),
          (event40['pointerId'] = event39['pointerId']),
          (event40['mode'] = 'text-transform'),
          (event40['textTransform'] = enabled14),
          this['_capturePointer'](event39['pointerId']),
          this['_syncToolbarState'](),
          this['_render'](),
          !![]
        );
      }
      if (type === 'select') {
        const index3 = this['_findSelectedArrowHandleHit'](x3);
        if (index3)
          return (
            (event40['down'] = !![]),
            (event40['pointerId'] = event39['pointerId']),
            (event40['mode'] = 'arrow-handle'),
            (event40['arrowTransform'] = {
              type: 'handle',
              index: index3['index'],
              handle: index3['handle'],
              moved: ![],
            }),
            this['_capturePointer'](event39['pointerId']),
            this['_syncToolbarState'](),
            this['_render'](),
            !![]
          );
        const index4 = this['_findSelectedLayerTransformHandle'](x3);
        if (index4) {
          const command = this['_commands'][index4['index']],
            whiteboardLayerTransformSession = createWhiteboardLayerTransformSession({
              command: command,
              index: index4['index'],
              mode: index4['mode'],
              startPoint: x3,
            });
          if (whiteboardLayerTransformSession)
            return (
              (event40['down'] = !![]),
              (event40['pointerId'] = event39['pointerId']),
              (event40['mode'] = 'layer-transform'),
              (event40['layerTransform'] = whiteboardLayerTransformSession),
              this['_capturePointer'](event39['pointerId']),
              this['_syncToolbarState'](),
              this['_render'](),
              !![]
            );
        }
        const index5 = this['_findCommandHit'](x3);
        if (index5) {
          ((this['_selectedCommandIndex'] = index5['index']),
            (this['_selectedTextCommandIndex'] =
              this['_commands'][index5['index']]?.['type'] === 'text' ? index5['index'] : null));
          const command2 = this['_commands'][index5['index']];
          if (isWhiteboardLayerTransformable(command2)) {
            const whiteboardLayerTransformSession2 = createWhiteboardLayerTransformSession({
              command: command2,
              index: index5['index'],
              mode: 'move',
              startPoint: x3,
            });
            whiteboardLayerTransformSession2 &&
              ((event40['down'] = !![]),
              (event40['pointerId'] = event39['pointerId']),
              (event40['mode'] = 'layer-transform'),
              (event40['layerTransform'] = whiteboardLayerTransformSession2),
              this['_capturePointer'](event39['pointerId']));
          }
        } else ((this['_selectedCommandIndex'] = null), (this['_selectedTextCommandIndex'] = null));
        return (this['_syncToolbarState'](), this['_render'](), !![]);
      }
      return (
        type === 'text' &&
          ((this['_selectedTextCommandIndex'] = null), (this['_selectedCommandIndex'] = null)),
        this['_openTextInput'](x3, sizeWorld),
        !![]
      );
    }
    const colorName = opacity['color'] || WHITEBOARD_DEFAULT_COLOR,
      color2 = getColorCanvas(colorName);
    if (type === 'rect' || type === 'arrow' || type === 'shape') {
      this['_draft'] = {
        type: type === 'shape' ? 'shape' : type,
        color: color2,
        colorName: colorName,
        sizeWorld: sizeWorld,
        opacity: opacity['opacity'],
        dash: opacity['dash'],
        x1: x3['x'],
        y1: x3['y'],
        x2: x3['x'],
        y2: x3['y'],
      };
      if (type === 'rect') this['_draft']['fill'] = opacity['fill'];
      else
        type === 'shape'
          ? ((this['_draft']['shapeType'] = this['_view']['shapeType'] || WHITEBOARD_DEFAULT_SHAPE_TYPE),
            (this['_draft']['fill'] = opacity['fill']))
          : ((this['_draft']['bend'] = 0x0),
            (this['_draft']['elbowOffset'] = 0x0),
            (this['_draft']['arrowKind'] = opacity['arrowKind']),
            (this['_draft']['arrowStart'] = opacity['arrowStart']),
            (this['_draft']['arrowEnd'] = opacity['arrowEnd']));
    } else
      this['_draft'] = {
        type: 'brush',
        color: color2,
        colorName: colorName,
        sizeWorld: sizeWorld,
        opacity: opacity['opacity'],
        points: [x3],
      };
    return (
      (event40['down'] = !![]),
      (event40['pointerId'] = event39['pointerId']),
      (event40['mode'] = 'draw'),
      this['_capturePointer'](event39['pointerId']),
      this['_render'](),
      !![]
    );
  }
  ['_moveDraft'](snapAngle2) {
    const enabled15 = this['_pointerState'],
      value100 =
        enabled15['down'] === !![] &&
        (enabled15['mode'] === 'erase-layers' ||
          (enabled15['mode'] === 'draw' &&
            this['_draft']?.['type'] === 'brush' &&
            snapAngle2['shiftKey'] !== !![])),
      list5 = value100 ? getPointerEventSamples(snapAngle2) : [snapAngle2],
      list6 = list5['map']((event41) =>
        this['_getLocalFromClient'](event41['clientX'], event41['clientY']),
      ),
      event42 = list5[list5['length'] - 0x1] || snapAngle2,
      value101 = list6[list6['length'] - 0x1],
      box11 = this['_getCanvasPointFromClient'](event42['clientX'], event42['clientY']);
    if (enabled15['down'] && enabled15['mode'] === 'pan') {
      const box12 = enabled15['panStart'] || box11,
        x4 = enabled15['panView'] || this['_getViewport']();
      this['_setCamera'](
        {
          x: x4['x'] - (box11['x'] - box12['x']) / x4['zoom'],
          y: x4['y'] - (box11['y'] - box12['y']) / x4['zoom'],
          zoom: x4['zoom'],
        },
        { scheduleSave: ![] },
      );
      return;
    }
    if (enabled15['down'] && enabled15['mode'] === 'erase-layers') {
      const clampImageBrushSize3 =
        clampImageBrushSize(this['_style']?.['size'] || this['_view']['brushSizePx']) /
        this['_getViewport']()['zoom'];
      let value102 = enabled15['eraseLast'] || list6[0x0] || value101;
      (list6['forEach']((value103) => {
        (this['_collectLayerEraseHits'](value102, value103, clampImageBrushSize3 / 0x2),
          this['_appendLayerEraseTrailPoint'](value103),
          (value102 = value103));
      }),
        (enabled15['eraseLast'] = value102),
        this['_scheduleLayerEraserPreviewRender']());
      return;
    }
    if (enabled15['down'] && enabled15['layerTransform']) {
      this['_moveLayerTransform'](value101);
      return;
    }
    if (enabled15['down'] && enabled15['textTransform']) {
      this['_moveTextTransform'](value101);
      return;
    }
    if (enabled15['down'] && enabled15['arrowTransform']) {
      this['_moveArrowTransform'](value101, { snapAngle: snapAngle2['shiftKey'] === !![] });
      return;
    }
    if (!enabled15['down'] || !this['_draft']) return;
    if (
      this['_draft']['type'] === 'rect' ||
      this['_draft']['type'] === 'arrow' ||
      this['_draft']['type'] === 'shape'
    ) {
      const value104 =
          snapAngle2['shiftKey'] === !![] &&
          (this['_draft']['type'] === 'arrow' ||
            (this['_draft']['type'] === 'shape' && this['_draft']['shapeType'] === 'line')),
        box13 = value104
          ? snapWhiteboardPointToAngle({ x: this['_draft']['x1'], y: this['_draft']['y1'] }, value101)
          : value101;
      ((this['_draft']['x2'] = box13['x']), (this['_draft']['y2'] = box13['y']));
      if (this['_draft']['type'] === 'arrow') {
        const value105 = Math['hypot'](
          this['_draft']['x2'] - this['_draft']['x1'],
          this['_draft']['y2'] - this['_draft']['y1'],
        );
        this['_draft']['bend'] =
          this['_draft']['arrowKind'] === 'arc' ? Math['max'](0xc, value105 * 0.18) : 0x0;
      }
    } else {
      const value106 = this['_draft']['points'][this['_draft']['points']['length'] - 0x1];
      if (this['_draft']['type'] === 'brush' && snapAngle2['shiftKey'] === !![]) {
        const value107 = this['_draft']['points'][0x0] || value101;
        this['_draft']['points'] = [value107, snapWhiteboardPointToAngle(value107, value101)];
      } else
        list6['forEach']((box14) => {
          const box15 = this['_draft']['points'][this['_draft']['points']['length'] - 0x1];
          (!box15 || box14['x'] !== box15['x'] || box14['y'] !== box15['y']) &&
            this['_draft']['points']['push'](box14);
        });
      if (
        this['_draft']['type'] === 'eraser' &&
        clampOpacity(this['_draft']['opacity']) >= 0x1 &&
        value106 &&
        this['_drawEraserDraftSegment'](value106, value101)
      )
        return;
    }
    this['_render']();
  }
  ['_drawEraserDraftSegment'](value108, value109) {
    if (!this['canvasEl'] || !this['_draft']) return ![];
    const ctx = this['canvasEl']['getContext']('2d');
    if (!ctx) return ![];
    const box16 = this['_getViewport'](),
      points = [value108, value109]['map']((value110) => getScreenPointFromWorld(value110, box16));
    ctx['save']();
    const drawRoundBrushStroke2 = drawRoundBrushStroke(ctx, {
      points: points,
      lineWidth: getEraserClearLineWidth(
        getBrushLineWidth(this['_draft']['sizeWorld'], box16['zoom'], 'eraser'),
      ),
      strokeStyle: 'black',
      fillStyle: 'black',
      globalCompositeOperation: 'destination-out',
    });
    return (ctx['restore'](), drawRoundBrushStroke2);
  }
  ['_moveTextTransform'](box17) {
    const value111 = this['_pointerState'],
      centerPx = value111['textTransform'],
      box18 = this['_commands'][centerPx['index']];
    if (box18?.['type'] !== 'text') return;
    const box19 = this['_worldToScreen'](box17);
    if (centerPx['mode'] === 'move')
      ((box18['x'] = box17['x'] - centerPx['offsetWorldX']),
        (box18['y'] = box17['y'] - centerPx['offsetWorldY']));
    else {
      if (centerPx['mode'] === 'scale-x' || centerPx['mode'] === 'scale-y') {
        const axisTextScale = resolveAxisTextScale(centerPx, box19);
        ((box18['scale'] = undefined),
          (box18['scaleX'] = axisTextScale['scaleX']),
          (box18['scaleY'] = axisTextScale['scaleY']));
        const box20 = this['_screenToWorld'](axisTextScale['originPx']);
        ((box18['x'] = box20['x']), (box18['y'] = box20['y']));
      } else {
        if (centerPx['mode'] === 'scale-uniform') {
          if (centerPx['centerBased']) {
            const value112 = Math['hypot'](
                box19['x'] - centerPx['centerPx']['x'],
                box19['y'] - centerPx['centerPx']['y'],
              ),
              count5 = value112 / centerPx['startDistance'],
              value113 = Number['isFinite'](count5) && count5 > 0x0 ? count5 : 0x1,
              scaleX = clampTextScale(centerPx['baseScaleX'] * value113),
              scaleY = clampTextScale(centerPx['baseScaleY'] * value113),
              textAnchorForCenter = getTextAnchorForCenter({
                centerPx: centerPx['centerPx'],
                layoutWidth: centerPx['layoutWidth'],
                layoutHeight: centerPx['layoutHeight'],
                scaleX: scaleX,
                scaleY: scaleY,
                rotation: centerPx['rotation'],
              }),
              box21 = this['_screenToWorld'](textAnchorForCenter);
            ((box18['scale'] = undefined),
              (box18['scaleX'] = scaleX),
              (box18['scaleY'] = scaleY),
              (box18['x'] = box21['x']),
              (box18['y'] = box21['y']));
          } else {
            const box22 = toTextLocalTransformSpace(
                box19,
                centerPx['originPx'],
                centerPx['rotation'],
              ),
              value114 = box22['x'] / centerPx['baseWidthPx'],
              value115 = box22['y'] / centerPx['baseHeightPx'],
              count6 = Math['max'](value114, value115),
              value116 = Number['isFinite'](count6) && count6 > 0x0 ? count6 : 0x1;
            ((box18['scale'] = undefined),
              (box18['scaleX'] = clampTextScale(centerPx['baseScaleX'] * value116)),
              (box18['scaleY'] = clampTextScale(centerPx['baseScaleY'] * value116)));
            const box23 = this['_screenToWorld'](centerPx['originPx']);
            ((box18['x'] = box23['x']), (box18['y'] = box23['y']));
          }
        } else {
          if (centerPx['mode'] === 'rotate') {
            const value117 = Math['atan2'](
                box19['y'] - centerPx['centerPx']['y'],
                box19['x'] - centerPx['centerPx']['x'],
              ),
              rotation = centerPx['baseRotation'] + (value117 - centerPx['baseAngle']);
            box18['rotation'] = rotation;
            const { scaleX: scaleX2, scaleY: scaleY2 } =
                centerPx['baseScaleX'] && centerPx['baseScaleY']
                  ? { scaleX: centerPx['baseScaleX'], scaleY: centerPx['baseScaleY'] }
                  : getTextScalePair(box18),
              box24 = this['_screenToWorld'](
                getTextAnchorForCenter({
                  centerPx: centerPx['centerPx'],
                  layoutWidth: centerPx['layoutWidth'],
                  layoutHeight: centerPx['layoutHeight'],
                  scaleX: scaleX2,
                  scaleY: scaleY2,
                  rotation: rotation,
                }),
              );
            ((box18['x'] = box24['x']), (box18['y'] = box24['y']));
          }
        }
      }
    }
    ((this['_selectedTextCommandIndex'] = centerPx['index']),
      (this['_selectedCommandIndex'] = centerPx['index']),
      this['_render']());
  }
  ['_findSelectedLayerTransformHandle'](value118) {
    const index6 = this['_selectedCommandIndex'],
      value119 = Number['isInteger'](index6) ? this['_commands'][index6] : null;
    if (!isWhiteboardLayerTransformable(value119) || value119['type'] === 'arrow') return null;
    const args5 = getWhiteboardLayerTransformHandleAtPoint(value119, value118, {
      zoom: this['_getViewport']()['zoom'],
    });
    return args5 ? { ...args5, index: index6 } : null;
  }
  ['_moveLayerTransform'](value120) {
    const value121 = this['_pointerState']?.['layerTransform'],
      enabled16 = Number['isInteger'](value121?.['index']) ? this['_commands'][value121['index']] : null;
    if (!enabled16) return;
    (applyWhiteboardLayerTransform(enabled16, value121, value120),
      (this['_selectedCommandIndex'] = value121['index']),
      (this['_selectedTextCommandIndex'] = null),
      this['_render']());
  }
  ['_findSelectedArrowHandleHit'](box25) {
    const index7 = this['_selectedCommandIndex'],
      value122 = Number['isInteger'](index7) ? this['_commands'][index7] : null;
    if (value122?.['type'] !== 'arrow') return null;
    const box26 = this['_getViewport'](),
      value123 = WHITEBOARD_ARROW_HANDLE_SCREEN_RADIUS / box26['zoom'],
      point = getArrowGeometry(value122),
      value124 = [
        { handle: 'start', point: point['start'] },
        { handle: 'end', point: point['end'] },
        { handle: 'middle', point: point['middle'] },
      ];
    for (const handle2 of value124) {
      const value125 = Math['hypot'](
        getFiniteNumber(box25?.['x']) - handle2['point']['x'],
        getFiniteNumber(box25?.['y']) - handle2['point']['y'],
      );
      if (value125 <= value123) return { index: index7, handle: handle2['handle'] };
    }
    return null;
  }
  ['_moveArrowTransform'](box27, { snapAngle: snapAngle = ![] } = {}) {
    const value126 = this['_pointerState']?.['arrowTransform'],
      x5 = Number['isInteger'](value126?.['index']) ? this['_commands'][value126['index']] : null;
    if (x5?.['type'] !== 'arrow') return;
    if (value126['type'] === 'handle') {
      if (value126['handle'] === 'middle')
        x5['arrowKind'] === 'elbow'
          ? (x5['elbowOffset'] = getArrowElbowOffsetFromPoint(x5, box27))
          : ((x5['arrowKind'] = 'arc'),
            (x5['bend'] = getArrowBendFromPoint(x5, box27)));
      else {
        if (value126['handle'] === 'start') {
          const box28 = snapAngle
            ? snapWhiteboardPointToAngle({ x: x5['x2'], y: x5['y2'] }, box27)
            : box27;
          ((x5['x1'] = getFiniteNumber(box28?.['x'])),
            (x5['y1'] = getFiniteNumber(box28?.['y'])));
        } else {
          const box29 = snapAngle
            ? snapWhiteboardPointToAngle({ x: x5['x1'], y: x5['y1'] }, box27)
            : box27;
          ((x5['x2'] = getFiniteNumber(box29?.['x'])),
            (x5['y2'] = getFiniteNumber(box29?.['y'])));
        }
      }
      value126['moved'] = !![];
    } else {
      if (value126['type'] === 'move') {
        const finiteNumber = getFiniteNumber(box27?.['x']) - getFiniteNumber(value126['start']?.['x']),
          finiteNumber2 = getFiniteNumber(box27?.['y']) - getFiniteNumber(value126['start']?.['y']);
        ((x5['x1'] = getFiniteNumber(value126['base']?.['x1']) + finiteNumber),
          (x5['y1'] = getFiniteNumber(value126['base']?.['y1']) + finiteNumber2),
          (x5['x2'] = getFiniteNumber(value126['base']?.['x2']) + finiteNumber),
          (x5['y2'] = getFiniteNumber(value126['base']?.['y2']) + finiteNumber2),
          (value126['moved'] = Math['hypot'](finiteNumber, finiteNumber2) > 0.01));
      }
    }
    ((this['_selectedCommandIndex'] = value126['index']),
      (this['_selectedTextCommandIndex'] = null),
      this['_render']());
  }
  ['_capturePointer'](value127) {
    if (value127 == null || !this['canvasEl']?.['setPointerCapture']) return;
    try {
      this['canvasEl']['setPointerCapture'](value127);
    } catch {}
  }
  ['_releasePointerCapture'](value128 = this['_pointerState']?.['pointerId']) {
    if (value128 == null || !this['canvasEl']?.['releasePointerCapture']) return;
    try {
      if (
        typeof this['canvasEl']['hasPointerCapture'] === 'function' &&
        !this['canvasEl']['hasPointerCapture'](value128)
      )
        return;
      this['canvasEl']['releasePointerCapture'](value128);
    } catch {}
  }
  ['_endDraft']({ releaseCapture: releaseCapture = !![] } = {}) {
    const event43 = this['_pointerState'],
      value129 = event43['pointerId'];
    if (releaseCapture) this['_releasePointerCapture'](value129);
    if (event43['down'] && event43['mode'] === 'pan') {
      ((event43['down'] = ![]),
        (event43['pointerId'] = null),
        (event43['mode'] = null),
        (event43['panStart'] = null),
        (event43['panView'] = null),
        (event43['previousTool'] = null),
        (event43['temporaryTool'] = null),
        (event43['textTransform'] = null),
        (event43['arrowTransform'] = null),
        (event43['layerTransform'] = null),
        (this['_temporaryTool'] = resolveModifierTemporaryTool(this['_modifierState'])),
        this['_syncCursor'](),
        this['_scheduleSave']());
      return;
    }
    if (event43['down'] && event43['mode'] === 'erase-layers') {
      ((event43['down'] = ![]),
        (event43['pointerId'] = null),
        (event43['mode'] = null),
        (event43['panStart'] = null),
        (event43['panView'] = null),
        (event43['previousTool'] = null),
        (event43['temporaryTool'] = null),
        (event43['textTransform'] = null),
        (event43['arrowTransform'] = null),
        (event43['layerTransform'] = null),
        (this['_temporaryTool'] = resolveModifierTemporaryTool(this['_modifierState'])),
        this['_commitLayerErase'](),
        this['_syncCursor']());
      return;
    }
    if (event43['down'] && event43['layerTransform']) {
      const value130 = event43['layerTransform']['moved'] === !![];
      ((event43['down'] = ![]),
        (event43['pointerId'] = null),
        (event43['mode'] = null),
        (event43['layerTransform'] = null),
        (event43['textTransform'] = null),
        (event43['arrowTransform'] = null),
        (event43['previousTool'] = null),
        (event43['temporaryTool'] = null),
        (event43['panStart'] = null),
        (event43['panView'] = null),
        (this['_temporaryTool'] = resolveModifierTemporaryTool(this['_modifierState'])));
      value130
        ? ((this['_redoStack'] = []), this['_markDirty']())
        : (this['_syncToolbarState'](), this['_render']());
      return;
    }
    if (event43['down'] && event43['textTransform']) {
      ((event43['down'] = ![]),
        (event43['pointerId'] = null),
        (event43['mode'] = null),
        (event43['textTransform'] = null),
        (event43['arrowTransform'] = null),
        (event43['layerTransform'] = null),
        (event43['previousTool'] = null),
        (event43['temporaryTool'] = null),
        (this['_temporaryTool'] = resolveModifierTemporaryTool(this['_modifierState'])),
        (this['_redoStack'] = []),
        this['_markDirty']());
      return;
    }
    if (event43['down'] && event43['arrowTransform']) {
      const value131 = event43['arrowTransform']['moved'] === !![];
      ((event43['down'] = ![]),
        (event43['pointerId'] = null),
        (event43['mode'] = null),
        (event43['textTransform'] = null),
        (event43['arrowTransform'] = null),
        (event43['layerTransform'] = null),
        (event43['previousTool'] = null),
        (event43['temporaryTool'] = null),
        (event43['panStart'] = null),
        (event43['panView'] = null),
        (this['_temporaryTool'] = resolveModifierTemporaryTool(this['_modifierState'])));
      value131
        ? ((this['_redoStack'] = []), this['_markDirty']())
        : (this['_syncToolbarState'](), this['_render']());
      return;
    }
    if (!event43['down'] || !this['_draft']) return;
    const value132 = this['_draft'];
    ((this['_draft'] = null),
      (event43['down'] = ![]),
      (event43['pointerId'] = null),
      (event43['mode'] = null));
    const value133 = event43['previousTool'];
    ((event43['previousTool'] = null),
      (event43['temporaryTool'] = null),
      (event43['textTransform'] = null),
      (event43['arrowTransform'] = null),
      (event43['layerTransform'] = null),
      (event43['panStart'] = null),
      (event43['panView'] = null),
      (event43['eraseLast'] = null),
      (event43['eraseIndices'] = null),
      (event43['eraseTrail'] = null),
      (this['_temporaryTool'] = resolveModifierTemporaryTool(this['_modifierState'])));
    if (shouldDiscardStrokeCommand(value132)) {
      (this['_syncCursor'](value133 || undefined, this['_view']['brushSizePx']), this['_render']());
      return;
    }
    if (value132['type'] === 'rect' || value132['type'] === 'arrow' || value132['type'] === 'shape') {
      const count7 = Math['abs'](value132['x2'] - value132['x1']),
        count8 = Math['abs'](value132['y2'] - value132['y1']);
      if (count7 < 0.5 && count8 < 0.5) {
        (this['_syncCursor'](value133 || undefined, this['_view']['brushSizePx']), this['_render']());
        return;
      }
    }
    (this['_commands']['push'](value132),
      value132['type'] === 'rect' || value132['type'] === 'arrow' || value132['type'] === 'shape'
        ? ((this['_selectedCommandIndex'] = this['_commands']['length'] - 0x1),
          (this['_selectedTextCommandIndex'] = null))
        : ((this['_selectedCommandIndex'] = null), (this['_selectedTextCommandIndex'] = null)),
      (this['_redoStack'] = []),
      this['_syncCursor'](value133 || undefined, this['_view']['brushSizePx']),
      this['_markDirty']());
  }
  ['_onCanvasWheel'](event44) {
    if (!this['_isEditing']) return;
    (event44['preventDefault'](), event44['stopPropagation'](), this['_removeTextInput'](!![]));
    const box30 = this['_getCanvasPointFromClient'](event44['clientX'], event44['clientY']);
    this['_cursorLast'] = box30;
    const x6 = this['_screenToWorld'](box30),
      box31 = this['_getViewport'](),
      zoom = clampWhiteboardZoom(
        box31['zoom'] * Math['exp'](-(Number(event44['deltaY']) || 0x0) * WHITEBOARD_ZOOM_WHEEL_SPEED),
      );
    this['_setCamera']({
      x: x6['x'] - box30['x'] / zoom,
      y: x6['y'] - box30['y'] / zoom,
      zoom: zoom,
    });
  }
  ['_handleKeyDown'](event45) {
    if (!this['_isEditing']) return;
    if (isTypingField(event45['target'])) return;
    const value134 = String(event45['key'] || '')['toLowerCase'](),
      value135 = event45['ctrlKey'] || event45['metaKey'],
      value136 =
        value135 && !event45['altKey'] && value134 === 'z'
          ? event45['shiftKey']
            ? 'redo'
            : 'undo'
          : value135 && !event45['altKey'] && !event45['shiftKey'] && value134 === 'y'
            ? 'redo'
            : '';
    if (value136) {
      (event45['preventDefault'](),
        event45['stopPropagation'](),
        event45['stopImmediatePropagation']?.());
      if (value136 === 'undo') this['_undo']();
      else this['_redo']();
      return;
    }
    if (event45['key'] === 'Escape') {
      (event45['preventDefault'](), event45['stopPropagation'](), this['_setEditing'](![]));
      return;
    }
    if (event45['key'] === 'Enter') {
      const value137 = this['_selectedCommandIndex'];
      if (Number['isInteger'](value137) && this['_commands'][value137]?.['type'] === 'text') {
        (event45['preventDefault'](), event45['stopPropagation'](), this['_editTextCommand'](value137));
        return;
      }
    }
    if (
      event45['key'] === 'Control' ||
      event45['code'] === 'ControlLeft' ||
      event45['code'] === 'ControlRight'
    ) {
      (event45['stopPropagation'](),
        (this['_modifierState'] ||= { space: ![], control: ![] }),
        (this['_modifierState']['control'] = !![]));
      if (!this['_pointerState']?.['down']) syncModifierTemporaryTool(this);
      return;
    }
    if (event45['altKey'] || event45['ctrlKey'] || event45['metaKey']) return;
    if (event45['key'] === '\x20' || event45['code'] === 'Space') {
      (event45['preventDefault'](), event45['stopPropagation']());
      !event45['repeat'] &&
        !this['_pointerState']?.['down'] &&
        ((this['_modifierState'] ||= { space: ![], control: ![] }),
        (this['_modifierState']['space'] = !![]),
        syncModifierTemporaryTool(this));
      return;
    }
    if (value134 === 't') {
      (event45['preventDefault'](), event45['stopPropagation'](), this['_setTool']('text'));
      return;
    }
    if (value134 === 'v') {
      (event45['preventDefault'](), event45['stopPropagation'](), this['_setTool']('select'));
      return;
    }
    if (value134 === 'b') {
      (event45['preventDefault'](), event45['stopPropagation'](), this['_setTool']('brush'));
      return;
    }
    if (value134 === 'e') {
      (event45['preventDefault'](), event45['stopPropagation'](), this['_setTool']('eraser'));
      return;
    }
    if (value134 === 'a') {
      (event45['preventDefault'](), event45['stopPropagation'](), this['_setTool']('arrow'));
      return;
    }
    if (value134 === 'r') {
      (event45['preventDefault'](), event45['stopPropagation'](), this['_clear']());
      return;
    }
    if (value134 !== 'd' && event45['key'] !== 'Delete' && event45['key'] !== 'Backspace') return;
    (event45['preventDefault'](), event45['stopPropagation']());
    const value138 = this['_selectedCommandIndex'];
    if (!Number['isInteger'](value138) || !this['_commands'][value138]) return;
    this['_deleteSelectedCommand']();
  }
  ['_handleKeyUp'](event46) {
    if (!this['_isEditing'] || isTypingField(event46['target'])) return;
    const enabled17 =
        event46['key'] === 'Control' ||
        event46['code'] === 'ControlLeft' ||
        event46['code'] === 'ControlRight',
      enabled18 = event46['key'] === '\x20' || event46['code'] === 'Space';
    if (!enabled17 && !enabled18) return;
    if (enabled18) event46['preventDefault']();
    (event46['stopPropagation'](), (this['_modifierState'] ||= { space: ![], control: ![] }));
    if (enabled17) this['_modifierState']['control'] = ![];
    if (enabled18) this['_modifierState']['space'] = ![];
    if (!this['_pointerState']?.['down']) syncModifierTemporaryTool(this);
  }
  ['_handleOutsidePointerDown'](event47) {
    if (!this['_isEditing'] || this['el']?.['contains']?.(event47['target'])) return;
    this['_setEditing'](![]);
  }
  ['_syncCursor'](
    tool5 = this['_temporaryTool'] || this['_view']['tool'] || WHITEBOARD_DEFAULT_TOOL,
    value139 = this['_style']?.['size'] || this['_view']['brushSizePx'] || WHITEBOARD_DEFAULT_BRUSH_SIZE_PX,
  ) {
    if (!this['cursorEl']) return;
    if (tool5 === 'hand') {
      ((this['cursorEl']['style']['display'] = 'none'),
        this['cursorEl']['classList']['remove']('is-erase-brush'));
      this['canvasEl'] &&
        (this['canvasEl']['style']['cursor'] =
          this['_pointerState']?.['mode'] === 'pan' ? 'grabbing' : 'grab');
      return;
    }
    if (tool5 === 'select') {
      ((this['cursorEl']['style']['display'] = 'none'),
        this['cursorEl']['classList']['remove']('is-erase-brush'));
      if (this['canvasEl']) {
        const mode =
            this['_pointerState']?.['mode'] === 'text-transform'
              ? this['_pointerState']['textTransform']
              : null,
          value140 = mode
            ? { mode: mode['mode'], handle: mode['handle'] }
            : this['_findTextHit'](this['_cursorWorldLast']);
        if (value140) this['canvasEl']['style']['cursor'] = this['_getTextInteractionCursor'](value140);
        else {
          if (this['_pointerState']?.['mode'] === 'arrow-handle')
            this['canvasEl']['style']['cursor'] = 'grabbing';
          else {
            if (this['_pointerState']?.['mode'] === 'layer-transform')
              this['canvasEl']['style']['cursor'] = this['_getLayerTransformCursor'](
                this['_pointerState']['layerTransform'],
              );
            else {
              if (this['_findSelectedArrowHandleHit'](this['_cursorWorldLast']))
                this['canvasEl']['style']['cursor'] = 'grab';
              else {
                const value141 = this['_findSelectedLayerTransformHandle'](this['_cursorWorldLast']);
                if (value141)
                  this['canvasEl']['style']['cursor'] = this['_getLayerTransformCursor'](value141);
                else {
                  const value142 = this['_findCommandHit'](this['_cursorWorldLast']),
                    value143 = this['_selectedCommandIndex'];
                  this['canvasEl']['style']['cursor'] =
                    Number['isInteger'](value143) &&
                    value142?.['index'] === value143 &&
                    isWhiteboardLayerTransformable(this['_commands'][value143])
                      ? 'move'
                      : getCssVar('--pointer-cursor') || 'default';
                }
              }
            }
          }
        }
      }
      return;
    }
    if (tool5 === 'rect' || tool5 === 'shape') {
      ((this['cursorEl']['style']['display'] = 'none'),
        this['cursorEl']['classList']['remove']('is-erase-brush'));
      if (this['canvasEl']) this['canvasEl']['style']['cursor'] = 'crosshair';
      return;
    }
    if (tool5 === 'arrow') {
      ((this['cursorEl']['style']['display'] = 'none'),
        this['cursorEl']['classList']['remove']('is-erase-brush'));
      if (this['canvasEl']) {
        const value144 = this['_pointerState']?.['mode'] === 'arrow-handle',
          value145 = this['_findSelectedArrowHandleHit'](this['_cursorWorldLast']);
        this['canvasEl']['style']['cursor'] = value144 ? 'grabbing' : value145 ? 'grab' : 'crosshair';
      }
      return;
    }
    if (tool5 === 'text') {
      ((this['cursorEl']['style']['display'] = 'none'),
        this['cursorEl']['classList']['remove']('is-erase-brush'),
        this['_syncTextToolCursor']());
      return;
    }
    syncCircularBrushCursor({
      cursorEl: this['cursorEl'],
      canvasEl: this['canvasEl'],
      visible: this['_cursorHover'],
      tool: tool5,
      allowedTools: ['brush', 'eraser', 'bucket', 'number-label'],
      sizePx: Math['max'](0x2, value139),
      cursorLast: this['_cursorLast'],
      isEraseBrush: tool5 === 'eraser',
    });
  }
  ['_syncTextToolCursor']() {
    if (!this['canvasEl']) return;
    const cssVar = getCssVar('--pointer-cursor') || 'default';
    if (!this['_cursorHover']) {
      this['canvasEl']['style']['cursor'] = cssVar;
      return;
    }
    const enabled19 = this['_findTextHit'](this['_cursorWorldLast']);
    if (!enabled19) {
      this['canvasEl']['style']['cursor'] = cssVar;
      return;
    }
    this['canvasEl']['style']['cursor'] = this['_getTextInteractionCursor'](enabled19, {
      moveCursor: 'var(--text-cursor)',
    });
  }
  ['_getTextInteractionCursor'](value146, { moveCursor: moveCursor = 'var(--move-cursor)' } = {}) {
    if (value146?.['mode'] === 'rotate') return WHITEBOARD_ROTATE_CURSOR;
    if (value146?.['mode'] === 'delete' || value146?.['mode'] === 'copy') return 'var(--link-cursor)';
    if (value146?.['mode'] === 'scale-x') return 'var(--resize-ew-cursor)';
    if (value146?.['mode'] === 'scale-y') return 'var(--resize-ns-cursor)';
    if (value146?.['mode'] === 'scale-uniform')
      return value146['handle'] === 'top-right' || value146['handle'] === 'bottom-left'
        ? 'var(--resize-nesw-cursor)'
        : 'var(--resize-nwse-cursor)';
    return moveCursor;
  }
  ['_getLayerTransformCursor'](value147) {
    if (value147?.['mode'] === 'rotate') return WHITEBOARD_ROTATE_CURSOR;
    if (value147?.['mode'] === 'scale')
      return value147['id'] === 'ne' || value147['id'] === 'sw'
        ? 'var(--resize-nesw-cursor)'
        : 'var(--resize-nwse-cursor)';
    return 'move';
  }
  ['_setTool'](value148) {
    const value149 = WHITEBOARD_ALLOWED_TOOLS['includes'](value148) ? value148 : WHITEBOARD_DEFAULT_TOOL;
    if (value149 !== 'text') this['_removeTextInput'](!![]);
    value149 !== 'select' &&
      value149 !== 'text' &&
      ((this['_selectedTextCommandIndex'] = null), (this['_selectedCommandIndex'] = null));
    this['_view']['tool'] = value149;
    if (this['shapeMenuEl']) this['shapeMenuEl']['hidden'] = !![];
    (this['moreButtonEl']?.['setAttribute']('aria-expanded', 'false'),
      this['_syncToolbarState'](),
      this['_scheduleSave']());
  }
  ['_setColor'](value150) {
    this['_setStyleValue']('color', value150);
  }
  ['_setBrushSize'](value151) {
    this['_setStyleValue']('size', value151);
  }
  ['_getSelectedCommand']() {
    const count9 = this['_selectedCommandIndex'];
    if (!Number['isInteger'](count9) || count9 < 0x0 || count9 >= this['_commands']['length'])
      return null;
    return this['_commands'][count9] || null;
  }
  ['_getActiveStyle']() {
    const cloneWhiteboardStyle2 = cloneWhiteboardStyle(this['_style']),
      enabled20 = this['_getSelectedCommand']();
    if (!enabled20) return cloneWhiteboardStyle2;
    if (COLOR_VAR_MAP[enabled20['colorName']]) cloneWhiteboardStyle2['color'] = enabled20['colorName'];
    if (Number['isFinite'](Number(enabled20['sizeWorld']))) {
      const clampWhiteboardZoom2 = clampWhiteboardZoom(this['_getViewport']?.()['zoom']);
      cloneWhiteboardStyle2['size'] = Math['round'](
        normalizeStyleValue('size', Number(enabled20['sizeWorld']) * clampWhiteboardZoom2),
      );
    }
    return (
      ['opacity', 'fill', 'dash', 'font', 'textAlign', 'arrowKind', 'arrowStart', 'arrowEnd']['forEach'](
        (value152) => {
          enabled20[value152] !== undefined &&
            enabled20[value152] !== null &&
            (cloneWhiteboardStyle2[value152] = normalizeStyleValue(value152, enabled20[value152]));
        },
      ),
      cloneWhiteboardStyle2
    );
  }
  ['_commandSupportsStyle'](enabled21, value153) {
    if (!enabled21) return ![];
    const list7 = getRelevantWhiteboardStyleControls(this['_view']['tool'], enabled21);
    if (list7['includes'](value153)) return !![];
    return (
      ((value153 === 'arrowStart' || value153 === 'arrowEnd') && list7['includes']('arrowheads')) ||
      (value153 === 'arrowKind' && list7['includes']('arrow-kind'))
    );
  }
  ['_applyStyleToCommand'](enabled22, value154, value155) {
    if (!enabled22) return ![];
    if (value154 === 'color')
      return ((enabled22['colorName'] = value155), (enabled22['color'] = getColorCanvas(value155)), !![]);
    if (value154 === 'size') {
      const clampWhiteboardZoom3 = clampWhiteboardZoom(this['_getViewport']?.()['zoom']);
      return ((enabled22['sizeWorld'] = normalizeStyleValue('size', value155) / clampWhiteboardZoom3), !![]);
    }
    if (value154 === 'arrowKind') {
      enabled22['arrowKind'] = normalizeStyleValue('arrowKind', value155);
      if (enabled22['arrowKind'] === 'straight') enabled22['bend'] = 0x0;
      enabled22['arrowKind'] === 'arc' &&
        Math['abs'](getFiniteNumber(enabled22['bend'])) < 0.1 &&
        (enabled22['bend'] = Math['max'](
          0xc,
          Math['hypot'](
            getFiniteNumber(enabled22['x2']) - getFiniteNumber(enabled22['x1']),
            getFiniteNumber(enabled22['y2']) - getFiniteNumber(enabled22['y1']),
          ) * 0.18,
        ));
      if (enabled22['arrowKind'] === 'elbow') enabled22['elbowOffset'] = 0x0;
      return !![];
    }
    return ((enabled22[value154] = normalizeStyleValue(value154, value155)), !![]);
  }
  ['_setStyleValue'](enabled23, value156) {
    if (!enabled23) return;
    const styleValue = normalizeStyleValue(enabled23, value156);
    ((this['_style'] = cloneWhiteboardStyle({ ...this['_style'], [enabled23]: styleValue })),
      (this['_view']['color'] = this['_style']['color']),
      (this['_view']['brushSizePx'] = this['_style']['size']));
    const value157 = this['_getSelectedCommand'](),
      value158 =
        value157 &&
        this['_commandSupportsStyle'](value157, enabled23) &&
        this['_applyStyleToCommand'](value157, enabled23, styleValue);
    (this['_syncToolbarState'](),
      value158 ? ((this['_redoStack'] = []), this['_markDirty']()) : this['_scheduleSave']());
  }
  ['_syncSizePresetState'](value159 = this['_getActiveStyle']()['size']) {
    const value160 = Math['round'](clampImageBrushSize(value159));
    this['sizePresetButtons']?.['forEach']((el65) => {
      const value161 = Number(el65['dataset']['sizeValue']),
        value162 = Number['isFinite'](value161) && value161 === value160;
      (el65['classList']['toggle']('active', value162),
        el65['setAttribute']('aria-pressed', value162 ? 'true' : 'false'));
    });
  }
  ['_syncArrowStyleMenus'](value163) {
    this['arrowheadTriggerButtons']?.['forEach']((el66) => {
      const value164 = el66['dataset']['arrowheadTarget'],
        value165 =
          WHITEBOARD_ARROWHEAD_OPTIONS['find']((el67) => el67['value'] === value163[value164]) ||
          WHITEBOARD_ARROWHEAD_OPTIONS[0x0];
      (el66['replaceChildren'](),
        appendIcon(el66, value165['icon']),
        el66['classList']['toggle']('is-start', value164 === 'arrowStart'));
    });
    const value166 = value163[this['_activeArrowheadTarget'] || 'arrowEnd'] || 'none';
    this['arrowheadOptionButtons']?.['forEach']((el68) => {
      const value167 = el68['dataset']['arrowheadValue'] === value166;
      (el68['classList']['toggle']('active', value167),
        el68['setAttribute']('aria-checked', value167 ? 'true' : 'false'));
    });
  }
  ['_syncToolbarState']() {
    const value168 = this['_temporaryTool'] || this['_view']['tool'] || WHITEBOARD_DEFAULT_TOOL,
      value169 = this['_getActiveStyle'](),
      value170 = Math['round'](clampImageBrushSize(value169['size']));
    if (this['sizeRangeEl']) this['sizeRangeEl']['value'] = String(value170);
    if (this['sizeValueEl']) this['sizeValueEl']['textContent'] = String(value170);
    this['toolButtons']?.['forEach']((el69) => {
      const value171 = el69['dataset']['tool'] === value168;
      (el69['classList']['toggle']('active', value171),
        el69['setAttribute']('aria-pressed', value171 ? 'true' : 'false'));
    });
    const value172 = value168 === 'rect' || value168 === 'shape' || value168 === 'number-label';
    (this['moreButtonEl']?.['classList']['toggle']('active', value172),
      this['moreButtonEl']?.['setAttribute']('aria-pressed', value172 ? 'true' : 'false'),
      this['shapeOptionButtons']?.['forEach']((el70) => {
        const value173 = el70['dataset']['shapeTool'],
          value174 = el70['dataset']['shapeKey'],
          value175 =
            (value173 === 'shape' && value168 === 'shape' && value174 === this['_view']['shapeType']) ||
            (value173 === 'rect' && value168 === 'rect') ||
            (value173 === 'number-label' && value168 === 'number-label');
        (el70['classList']['toggle']('active', value175),
          el70['setAttribute']('aria-checked', value175 ? 'true' : 'false'));
      }));
    const value176 = value169['color'] || WHITEBOARD_DEFAULT_COLOR;
    (this['colorDotEl'] &&
      (this['colorDotEl']['style']['setProperty']('--whiteboard-color-dot-bg', getColorCss(value176)),
      this['colorDotEl']['style']['setProperty'](
        '--whiteboard-color-dot-border',
        value176 === 'black'
          ? 'var(--white-35)'
          : value176 === 'white'
            ? 'var(--white-25)'
            : 'var(--black-20)',
      )),
      this['colorButtons']?.['forEach']((el71) => {
        (el71['classList']['toggle']('active', el71['dataset']['color'] === value176),
          el71['setAttribute'](
            'aria-pressed',
            el71['dataset']['color'] === value176 ? 'true' : 'false',
          ));
      }),
      this['_syncSizePresetState'](value170),
      this['_syncStylePanelState'](value169),
      this['_syncCursor'](value168, this['_style']['size']),
      this['composeButtonEl'] &&
        (this['composeButtonEl']['disabled'] = this['_isComposingImageNode'] === !![]),
      this['backgroundUploadButtonEl'] &&
        ((this['backgroundUploadButtonEl']['disabled'] = this['_isUploadingBackground'] === !![]),
        this['backgroundUploadButtonEl']['setAttribute'](
          'aria-busy',
          this['_isUploadingBackground'] ? 'true' : 'false',
        )));
  }
  ['_getWhiteboardBackgroundSpawnPoint'](box32 = {}) {
    const box33 = appStore['getStateRaw']?.()['nodes']?.[this['id']] || this['_data'] || {},
      value177 = Number(box33['x']),
      value178 = Number(box33['y']),
      value179 = Number(box33['height']),
      value180 = Number(box32['width']) > 0x0 ? Number(box32['width']) : 0x12c,
      value181 = Number(box32['height']) > 0x0 ? Number(box32['height']) : 0x12c;
    return {
      x: (Number['isFinite'](value177) ? value177 : 0x0) - value180 - 0x30,
      y:
        (Number['isFinite'](value178) ? value178 : 0x0) +
        ((Number['isFinite'](value179) ? value179 : value181) - value181) / 0x2,
    };
  }
  async ['_uploadBackgroundImage'](enabled24) {
    if (this['_isUploadingBackground'] || !enabled24) return ![];
    if (
      !String(enabled24['type'] || '')
        ['toLowerCase']()
        ['startsWith']('image/')
    )
      return (
        globalThis['window']?.['showToast']?.(t('whiteboardNode.background.imageOnly'), 'warning'),
        ![]
      );
    ((this['_isUploadingBackground'] = !![]), this['_syncToolbarState']());
    let enabled25 = ![];
    const thumbnailDataUrlPromise = this['_showPendingBackgroundPreview'](enabled24);
    try {
      const box34 = this['_getWhiteboardBackgroundSpawnPoint'](),
        args6 = await processFile(
          enabled24,
          box34['x'],
          box34['y'],
          globalThis['window']?.['currentProjectId'] || 'default_v2_project',
          {
            thumbnailDataUrlPromise: thumbnailDataUrlPromise['then']((value182) => value182?.['thumbnailDataUrl'] || ''),
          },
        );
      if (!args6 || args6['type'] !== 'source-image') return ![];
      const x7 = this['_getWhiteboardBackgroundSpawnPoint'](args6),
        sourceId = { ...args6, x: x7['x'], y: x7['y'] };
      appStore['addNode'](sourceId);
      const addEdgeWithPolicies2 = addEdgeWithPolicies({ sourceId: sourceId['id'], targetId: this['id'] });
      if (!addEdgeWithPolicies2) {
        appStore['deleteNode'](sourceId['id']);
        throw new Error('Failed to connect whiteboard background input.');
      }
      const value183 = this['_getWhiteboardBackgroundSpawnPoint'](sourceId);
      return (
        appStore['updateNodeData'](sourceId['id'], value183),
        appStore['setSelectedNodes']([this['id']]),
        commit(),
        (enabled25 = !![]),
        globalThis['window']?.['_triggerLocalCacheSave']?.(),
        globalThis['window']?.['showToast']?.(t('whiteboardNode.background.uploadSuccess'), 'success'),
        !![]
      );
    } catch (value184) {
      return (
        console['warn']('[WhiteboardNode]\x20upload\x20background\x20failed:', value184),
        globalThis['window']?.['showToast']?.(t('whiteboardNode.background.uploadFailed'), 'error'),
        ![]
      );
    } finally {
      (!enabled25 && this['_syncBackgroundInputFromStore']({ force: !![] }),
        (this['_isUploadingBackground'] = ![]),
        this['_syncToolbarState']());
    }
  }
  ['_drawBackgroundImage'](
    ctx2,
    viewport = this['_getViewport'](),
    { image: image = this['_backgroundImage'], input: input = this['_backgroundInput'] } = {},
  ) {
    if (!image || !input) return ![];
    const box35 = appStore['getStateRaw']?.()['nodes']?.[this['id']] || this['_data'] || {},
      frameWidth =
        (Number(box35['width']) || this['_canvasCssWidth'] || WHITEBOARD_DEFAULT_SIZE['width']) /
        WHITEBOARD_DEFAULT_VIEW['zoom'],
      frameHeight =
        (Number(box35['height']) || this['_canvasCssHeight'] || WHITEBOARD_DEFAULT_SIZE['height']) /
        WHITEBOARD_DEFAULT_VIEW['zoom'];
    return drawWhiteboardBackgroundImage({
      ctx: ctx2,
      image: image,
      viewport: viewport,
      imageWidth: input['width'] || image['naturalWidth'] || image['width'],
      imageHeight: input['height'] || image['naturalHeight'] || image['height'],
      frameWidth: frameWidth,
      frameHeight: frameHeight,
    });
  }
  ['_getWhiteboardOutputSize']() {
    return (
      this['_syncCanvasSize'](),
      {
        width: Math['max'](0x1, Math['round'](this['_canvasCssWidth'] || this['_data']['width'] || 0x1)),
        height: Math['max'](0x1, Math['round'](this['_canvasCssHeight'] || this['_data']['height'] || 0x1)),
      }
    );
  }
  ['_getWhiteboardCompositionOutputSize'](box36, value185 = null) {
    const box37 = value185 || this['_getWhiteboardOutputSize']?.() || {},
      value186 = Math['round'](
        Number(
          box36?.['naturalWidth'] ||
            box36?.['width'] ||
            this['_backgroundInput']?.['width'] ||
            box37['width'],
        ) || 0x0,
      ),
      value187 = Math['round'](
        Number(
          box36?.['naturalHeight'] ||
            box36?.['height'] ||
            this['_backgroundInput']?.['height'] ||
            box37['height'],
        ) || 0x0,
      );
    return { width: Math['max'](0x1, value186), height: Math['max'](0x1, value187) };
  }
  async ['_loadOriginalBackgroundForComposition']() {
    const enabled26 = this['_backgroundInput'];
    if (!enabled26) return { image: null, outputSize: null };
    const value188 = Array['from'](
      new Set(
        (enabled26['compositionUrls'] || [])
          ['map']((value189) => String(value189 || '')['trim']())
          ['filter'](Boolean),
      ),
    );
    for (const value190 of value188) {
      const image4 = await this['_loadBackgroundImageElement'](value190);
      if (!image4) continue;
      return {
        image: image4,
        outputSize: this['_getWhiteboardCompositionOutputSize'](
          image4,
          this['_getWhiteboardOutputSize']?.(),
        ),
      };
    }
    throw new Error('Failed to load original whiteboard background image.');
  }
  ['_getWhiteboardOutputSpawnPoint'](box38) {
    const box39 = appStore['getStateRaw']?.()['nodes']?.[this['id']] || this['_data'] || {},
      value191 = Number(box39['x']),
      value192 = Number(box39['y']),
      value193 = Number(box39['width']),
      x8 =
        (Number['isFinite'](value191) ? value191 : 0x0) +
        (Number['isFinite'](value193) ? value193 : box38['width']) +
        0x30,
      y2 = Number['isFinite'](value192) ? value192 : 0x0;
    return { x: x8, y: y2 };
  }
  ['_renderWhiteboardOutputCanvas'](
    box40 = this['_getWhiteboardOutputSize'](),
    {
      displaySize: displaySize = box40,
      backgroundImage: backgroundImage = this['_backgroundImage'],
      backgroundInput: backgroundInput = this['_backgroundInput'],
    } = {},
  ) {
    const canvasEl = document['createElement']('canvas');
    ((canvasEl['width'] = box40['width']), (canvasEl['height'] = box40['height']));
    const value194 = Math['max'](0x1, Number(displaySize?.['width']) || 0x1),
      value195 = Math['max'](0x1, Number(displaySize?.['height']) || 0x1);
    ((canvasEl['style']['width'] = value194 + 'px'), (canvasEl['style']['height'] = value195 + 'px'));
    const ctx3 = canvasEl['getContext']('2d');
    if (!ctx3) return null;
    (ctx3['save'](),
      ctx3['scale'](box40['width'] / value194, box40['height'] / value195));
    const numberLabelBackgroundColor = getCssVar('--canvas-white') || '#fff';
    return (
      (ctx3['fillStyle'] = numberLabelBackgroundColor),
      ctx3['fillRect'](0x0, 0x0, value194, value195),
      this['_drawBackgroundImage'](ctx3, this['_getViewport'](), {
        image: backgroundImage,
        input: backgroundInput,
      }),
      renderCommands({
        ctx: ctx3,
        viewport: this['_getViewport'](),
        canvasEl: canvasEl,
        commands: this['_commands'],
        isDraft: ![],
        eraseCheckerPattern: createEraseCheckerboardPattern(ctx3, 0x1),
        getColorCanvas: getColorCanvas,
        fillRegionCache: new Map(),
        numberLabelBackgroundColor: numberLabelBackgroundColor,
      }),
      ctx3['restore'](),
      canvasEl
    );
  }
  async ['_createImageNodeFromWhiteboard']() {
    if (this['_isComposingImageNode']) return ![];
    ((this['_isComposingImageNode'] = !![]), this['_syncToolbarState']());
    try {
      const displaySize2 = this['_getWhiteboardOutputSize'](),
        backgroundImage2 = await this['_loadOriginalBackgroundForComposition'](),
        mediaNaturalSize = backgroundImage2['outputSize'] || displaySize2,
        enabled27 = this['_renderWhiteboardOutputCanvas'](mediaNaturalSize, {
          displaySize: displaySize2,
          backgroundImage: backgroundImage2['image'] || this['_backgroundImage'],
          backgroundInput: this['_backgroundInput'],
        });
      if (!enabled27) throw new Error('Failed to render whiteboard image.');
      const pngBlob = await canvasToPngBlob(enabled27);
      if (!pngBlob) throw new Error('Failed\x20to\x20export\x20whiteboard\x20image.');
      const value196 = 'whiteboard-' + Date['now']() + '.png',
        file = new File([pngBlob], value196, { type: 'image/png' }),
        x9 = this['_getWhiteboardOutputSpawnPoint'](displaySize2),
        thumbnailDataUrl = createWhiteboardBackgroundPreviewFromDecodedImage(enabled27)?.['thumbnailDataUrl'] || '',
        originalWidth = await processFile(
          file,
          x9['x'],
          x9['y'],
          globalThis['window']?.['currentProjectId'] || 'default_v2_project',
          {
            mediaNaturalSize: mediaNaturalSize,
            naturalWidth: mediaNaturalSize['width'],
            naturalHeight: mediaNaturalSize['height'],
            thumbnailDataUrl: thumbnailDataUrl,
          },
        );
      if (!originalWidth) return ![];
      const value197 = {
        ...originalWidth,
        name: '白板合成',
        x: x9['x'],
        y: x9['y'],
        width: displaySize2['width'],
        height: displaySize2['height'],
        imageWidth: mediaNaturalSize['width'],
        imageHeight: mediaNaturalSize['height'],
        originalWidth: originalWidth['originalWidth'] || mediaNaturalSize['width'],
        originalHeight: originalWidth['originalHeight'] || mediaNaturalSize['height'],
        fixedSize: !![],
        needsAutoResize: ![],
      };
      return (
        appStore['addNode'](value197),
        appStore['setSelectedNodes']([value197['id']]),
        commit(),
        window['_triggerLocalCacheSave']?.(),
        window['showToast']?.('已合成白板图像', 'success'),
        !![]
      );
    } catch (value198) {
      return (
        console['warn']('[WhiteboardNode] create image node failed:', value198),
        window['showToast']?.('白板合成失败', 'error'),
        ![]
      );
    } finally {
      ((this['_isComposingImageNode'] = ![]), this['_syncToolbarState']());
    }
  }
  ['_syncStylePanelState'](value199 = this['_getActiveStyle']()) {
    const value200 = this['_getSelectedCommand'](),
      relevantWhiteboardStyleControls = getRelevantWhiteboardStyleControls(this['_view']['tool'], value200),
      map2 = new Set(relevantWhiteboardStyleControls),
      enabled28 = map2['size'] === 0x0;
    this['stylePanelEl'] &&
      (this['stylePanelEl']['classList']['toggle']('is-empty', enabled28),
      this['stylePanelEl']['classList']['toggle']('is-expanded', !enabled28),
      this['stylePanelEl']['setAttribute']('aria-hidden', enabled28 ? 'true' : 'false'),
      (this['stylePanelEl']['inert'] = this['_isEditing'] === ![] || enabled28));
    this['styleSections']?.['forEach']((el72) => {
      const value201 = el72['dataset']['styleControl'];
      el72['hidden'] = !map2['has'](value201);
    });
    const value202 = Math['round'](clampOpacity(value199['opacity']) * 0x64);
    if (this['opacityRangeEl']) this['opacityRangeEl']['value'] = String(value202);
    if (this['opacityValueEl']) this['opacityValueEl']['textContent'] = '' + value202;
    (this['styleOptionButtons']?.['forEach']((el73) => {
      const value203 = el73['dataset']['styleProp'],
        value204 = el73['dataset']['styleValue'];
      let value205 = ![];
      if (value203 === 'opacity') value205 = Math['round'](Number(value204) * 0x64) === value202;
      else
        value203 === 'arrowStart' || value203 === 'arrowEnd'
          ? (value205 = value199[value203] === 'arrow')
          : (value205 = value199[value203] === normalizeStyleValue(value203, value204));
      (el73['classList']['toggle']('active', value205),
        el73['setAttribute']('aria-pressed', value205 ? 'true' : 'false'));
    }),
      this['_syncArrowStyleMenus']?.(value199));
  }
  ['_openTextInput'](value206, value207, { commandIndex: commandIndex = null } = {}) {
    this['_removeTextInput'](!![]);
    const box41 = Number['isInteger'](commandIndex) ? this['_commands'][commandIndex] : null,
      cloneWhiteboardStyle3 = cloneWhiteboardStyle(this['_style']),
      box42 = box41
        ? { x: Number(box41['x']) || 0x0, y: Number(box41['y']) || 0x0 }
        : value206,
      value208 = Number(box41?.['sizeWorld']) || value207,
      value209 = COLOR_VAR_MAP[box41?.['colorName']] ? box41['colorName'] : cloneWhiteboardStyle3['color'],
      value210 = box41?.['color'] || getColorCanvas(value209 || WHITEBOARD_DEFAULT_COLOR),
      value211 = Number['isFinite'](Number(box41?.['opacity']))
        ? Number(box41['opacity'])
        : cloneWhiteboardStyle3['opacity'],
      value212 = box41?.['font'] || cloneWhiteboardStyle3['font'],
      box43 = this['_worldToScreen'](box42),
      value213 = value212 === 'serif' ? 'serif' : value212 === 'mono' ? 'monospace' : 'sans-serif',
      el74 = document['createElement']('textarea');
    ((el74['rows'] = 0x1),
      (el74['wrap'] = 'off'),
      (el74['maxLength'] = WHITEBOARD_TEXT_LIMIT),
      (el74['className'] = 'v2-annotate-text-input\x20whiteboard-text-input'),
      el74['setAttribute']('aria-label', WHITEBOARD_TOOL_LABELS['text']),
      (el74['dataset']['localX'] = String(box42['x'])),
      (el74['dataset']['localY'] = String(box42['y'])),
      (el74['dataset']['sizeWorld'] = String(value208)),
      (el74['dataset']['colorName'] = value209),
      (el74['dataset']['color'] = value210),
      (el74['dataset']['opacity'] = String(value211)),
      (el74['dataset']['font'] = value212),
      (el74['dataset']['textAlign'] = box41?.['textAlign'] || 'left'));
    Number['isInteger'](commandIndex) &&
      ((el74['dataset']['commandIndex'] = String(commandIndex)),
      (el74['value'] = String(box41?.['text'] || '')));
    ((el74['style']['left'] = box43['x'] + 'px'),
      (el74['style']['top'] = box43['y'] + 'px'),
      (el74['style']['fontFamily'] = value213),
      (el74['style']['opacity'] = String(value211)),
      (el74['style']['textAlign'] = el74['dataset']['textAlign']));
    if (box41) {
      const { scaleX: scaleX3, scaleY: scaleY3 } = getTextScalePair(box41),
        value214 = Number(box41['rotation']) || 0x0;
      el74['style']['transform'] =
        'rotate(' + value214 + 'rad) scale(' + scaleX3 + ',\x20' + scaleY3 + ')';
    } else el74['classList']['add']('is-new');
    (el74['style']['setProperty'](
      '--annotate-text-input-size',
      Math['max'](0x1, value208 * this['_getViewport']()['zoom']) + 'px',
    ),
      el74['style']['setProperty'](
        '--annotate-text-input-color',
        el74['dataset']['color'] || getColorCanvas(WHITEBOARD_DEFAULT_COLOR),
      ));
    const run6 = (value215) => {
      if (el74['dataset']['whiteboardTextFinished'] === 'true') return;
      this['_removeTextInput'](value215, el74);
    };
    (el74['addEventListener']('pointerdown', (event48) => event48['stopPropagation']()),
      el74['addEventListener']('input', () => this['_syncTextInputSize'](el74)),
      el74['addEventListener']('keydown', (event49) => {
        event49['stopPropagation']();
        if (
          event49['key'] === 'Enter' &&
          !event49['isComposing'] &&
          (event49['ctrlKey'] || event49['metaKey'])
        )
          (event49['preventDefault'](), run6(!![]));
        else event49['key'] === 'Escape' && (event49['preventDefault'](), run6(![]));
      }),
      el74['addEventListener']('blur', () => run6(!![])),
      this['_canvasWrapEl']['appendChild'](el74),
      (this['_textInputEl'] = el74),
      (this['_editingTextCommandIndex'] = Number['isInteger'](commandIndex) ? commandIndex : null),
      this['_syncTextInputSize'](el74),
      this['_render'](),
      requestAnimationFrame(() => {
        if (this['_textInputEl'] !== el74) return;
        (el74['focus'](),
          el74['setSelectionRange'](el74['value']['length'], el74['value']['length']));
      }));
  }
  ['_syncTextInputSize'](text = this['_textInputEl']) {
    if (!text) return;
    const sizeWorld2 = Number(text['dataset']['sizeWorld']);
    if (!Number['isFinite'](sizeWorld2)) return;
    const box44 = this['_getTextLayout']({
      type: 'text',
      text: text['value'] || '\x20',
      sizeWorld: sizeWorld2,
      font: text['dataset']['font'],
      x: Number(text['dataset']['localX']) || 0x0,
      y: Number(text['dataset']['localY']) || 0x0,
    });
    if (!box44) return;
    ((text['style']['width'] = Math['ceil'](box44['width']) + 'px'),
      (text['style']['height'] = Math['ceil'](box44['height']) + 'px'),
      text['style']['setProperty']('--whiteboard-text-line-height', box44['lineHeight'] + 'px'));
  }
  ['_editTextCommand'](value216) {
    const commandIndex2 = Number(value216),
      x10 = this['_commands'][commandIndex2];
    if (!Number['isInteger'](commandIndex2) || x10?.['type'] !== 'text') return ![];
    if (this['_editingTextCommandIndex'] === commandIndex2 && this['_textInputEl'])
      return (this['_textInputEl']['focus'](), !![]);
    return (
      (this['_selectedTextCommandIndex'] = commandIndex2),
      (this['_selectedCommandIndex'] = commandIndex2),
      this['_openTextInput']({ x: x10['x'], y: x10['y'] }, x10['sizeWorld'], {
        commandIndex: commandIndex2,
      }),
      !![]
    );
  }
  ['_removeTextInput'](enabled29 = !![], value217 = null) {
    const el75 = value217 || this['_textInputEl'];
    if (!el75) return;
    if (el75['dataset']['whiteboardTextFinished'] === 'true') return;
    el75['dataset']['whiteboardTextFinished'] = 'true';
    const enabled30 = this['_textInputEl'] === el75,
      text2 = String(el75['value'] || '')
        ['replace'](/\r\n?/g, '\x0a')
        ['slice'](0x0, WHITEBOARD_TEXT_LIMIT),
      x11 = Number(el75['dataset']['localX']),
      y3 = Number(el75['dataset']['localY']),
      sizeWorld3 = Number(el75['dataset']['sizeWorld']),
      color3 = String(el75['dataset']['color'] || ''),
      value218 = String(el75['dataset']['colorName'] || ''),
      value219 = Number(el75['dataset']['opacity']),
      value220 = String(el75['dataset']['font'] || ''),
      textAlign = String(el75['dataset']['textAlign'] || 'left'),
      value221 =
        el75['dataset']['commandIndex'] === undefined
          ? null
          : Number(el75['dataset']['commandIndex']);
    el75['remove']();
    enabled30 && ((this['_textInputEl'] = null), (this['_editingTextCommandIndex'] = null));
    if (
      !enabled30 ||
      !enabled29 ||
      !Number['isFinite'](x11) ||
      !Number['isFinite'](y3) ||
      !Number['isFinite'](sizeWorld3)
    ) {
      if (enabled30) this['_render']();
      return;
    }
    if (Number['isInteger'](value221) && this['_commands'][value221]?.['type'] === 'text') {
      !text2['trim']()
        ? (this['_commands']['splice'](value221, 0x1),
          (this['_selectedTextCommandIndex'] = null),
          (this['_selectedCommandIndex'] = null))
        : ((this['_commands'][value221] = {
            ...this['_commands'][value221],
            text: text2,
            color: color3 || getColorCanvas(WHITEBOARD_DEFAULT_COLOR),
            colorName: COLOR_VAR_MAP[value218] ? value218 : WHITEBOARD_DEFAULT_COLOR,
            sizeWorld: sizeWorld3,
            opacity: normalizeStyleValue('opacity', value219),
            font: normalizeStyleValue('font', value220),
            textAlign: textAlign,
          }),
          (this['_selectedTextCommandIndex'] = value221),
          (this['_selectedCommandIndex'] = value221));
      ((this['_redoStack'] = []), this['_markDirty']());
      return;
    }
    if (!text2['trim']()) {
      this['_render']();
      return;
    }
    const box45 = {
        type: 'text',
        text: text2,
        color: color3 || getColorCanvas(WHITEBOARD_DEFAULT_COLOR),
        colorName: COLOR_VAR_MAP[value218] ? value218 : WHITEBOARD_DEFAULT_COLOR,
        sizeWorld: sizeWorld3,
        opacity: normalizeStyleValue('opacity', value219),
        font: normalizeStyleValue('font', value220),
        x: x11,
        y: y3,
        textAlign: textAlign,
        scale: 0x1,
        scaleX: 0x1,
        scaleY: 0x1,
        rotation: 0x0,
      },
      box46 = this['_getTextLayout'](box45),
      value222 = this['_getViewport']()['zoom'] || 0x1;
    (box46 &&
      ((box45['x'] -= box46['width'] / (0x2 * value222)),
      (box45['y'] -= box46['height'] / (0x2 * value222))),
      this['_commands']['push'](box45),
      (this['_selectedTextCommandIndex'] = this['_commands']['length'] - 0x1),
      (this['_selectedCommandIndex'] = this['_selectedTextCommandIndex']),
      (this['_redoStack'] = []),
      this['_markDirty']());
  }
  ['_getTextLayout'](cmd) {
    return getTextLayout({
      canvasEl: this['canvasEl'],
      cmd: cmd,
      viewport: this['_getViewport'](),
      layoutVariant: 'whiteboard',
    });
  }
  ['_getTextGeometry'](cmd2) {
    return getTextGeometry({
      canvasEl: this['canvasEl'],
      cmd: cmd2,
      viewport: this['_getViewport'](),
      layoutVariant: 'whiteboard',
    });
  }
  ['_findTextHit'](local) {
    return findTextHit({
      commands: this['_commands'],
      selectedTextCommandIndex: this['_selectedTextCommandIndex'],
      local: local,
      viewport: this['_getViewport'](),
      canvasEl: this['canvasEl'],
      controlVariant: 'whiteboard',
    });
  }
  ['_createTextTransformState'](hit, local2) {
    return createTextTransformState({
      commands: this['_commands'],
      hit: hit,
      local: local2,
      viewport: this['_getViewport'](),
      canvasEl: this['canvasEl'],
      layoutVariant: 'whiteboard',
    });
  }
  ['_deleteTextCommand'](value223) {
    const value224 = Number(value223);
    if (!Number['isInteger'](value224) || this['_commands'][value224]?.['type'] !== 'text') return ![];
    return (
      this['_commands']['splice'](value224, 0x1),
      (this['_selectedTextCommandIndex'] = null),
      (this['_selectedCommandIndex'] = null),
      (this['_redoStack'] = []),
      this['_markDirty'](),
      !![]
    );
  }
  ['_deleteSelectedCommand']() {
    const value225 = this['_selectedCommandIndex'];
    if (!Number['isInteger'](value225) || !this['_commands'][value225]) return ![];
    return (
      this['_commands']['splice'](value225, 0x1),
      (this['_selectedTextCommandIndex'] = null),
      (this['_selectedCommandIndex'] = null),
      (this['_redoStack'] = []),
      this['_markDirty'](),
      !![]
    );
  }
  ['_copyTextCommand'](value226) {
    const value227 = Number(value226),
      value228 = this['_commands'][value227];
    if (!Number['isInteger'](value227) || value228?.['type'] !== 'text') return ![];
    const copiedTextCommand = buildCopiedTextCommand(value228, this['_getViewport']());
    return (
      this['_commands']['splice'](value227 + 0x1, 0x0, copiedTextCommand),
      (this['_selectedTextCommandIndex'] = value227 + 0x1),
      (this['_selectedCommandIndex'] = value227 + 0x1),
      (this['_redoStack'] = []),
      this['_markDirty'](),
      !![]
    );
  }
  ['_addNumberLabel'](box47, sizeWorld4) {
    const x12 = Number(box47?.['x']),
      y4 = Number(box47?.['y']);
    if (!Number['isFinite'](x12) || !Number['isFinite'](y4)) return null;
    const colorName2 = cloneWhiteboardStyle(this['_style']),
      value229 = {
        type: 'number-label',
        number: getNextNumberLabelValue(this['_commands']),
        x: x12,
        y: y4,
        color: getColorCanvas(colorName2['color'] || WHITEBOARD_DEFAULT_COLOR),
        colorName: colorName2['color'],
        sizeWorld: sizeWorld4,
        opacity: colorName2['opacity'],
      };
    return (
      this['_commands']['push'](value229),
      (this['_selectedCommandIndex'] = this['_commands']['length'] - 0x1),
      (this['_selectedTextCommandIndex'] = null),
      (this['_redoStack'] = []),
      this['_markDirty'](),
      value229
    );
  }
  ['_fillArea'](box48) {
    const colorName3 = cloneWhiteboardStyle(this['_style']),
      value230 = {
        type: 'fill',
        x: Number(box48?.['x']) || 0x0,
        y: Number(box48?.['y']) || 0x0,
        color: getColorCanvas(colorName3['color'] || WHITEBOARD_DEFAULT_COLOR),
        colorName: colorName3['color'],
      };
    (this['_commands']['push'](value230),
      (this['_selectedCommandIndex'] = null),
      (this['_selectedTextCommandIndex'] = null),
      (this['_redoStack'] = []),
      this['_markDirty']());
  }
  ['_undo']() {
    this['_removeTextInput'](!![]);
    if (this['_commands']['length'] === 0x0) return;
    const value231 = this['_commands']['pop']();
    (this['_redoStack']['push'](value231),
      (this['_selectedTextCommandIndex'] = null),
      (this['_selectedCommandIndex'] = null),
      this['_markDirty']());
  }
  ['_redo']() {
    this['_removeTextInput'](!![]);
    if (this['_redoStack']['length'] === 0x0) return;
    const value232 = this['_redoStack']['pop']();
    (this['_commands']['push'](value232),
      (this['_selectedTextCommandIndex'] = null),
      (this['_selectedCommandIndex'] = null),
      this['_markDirty']());
  }
  ['_clear']() {
    this['_removeTextInput'](![]);
    if (this['_commands']['length'] === 0x0 && this['_redoStack']['length'] === 0x0) return;
    ((this['_commands'] = []),
      (this['_redoStack'] = []),
      (this['_draft'] = null),
      (this['_selectedTextCommandIndex'] = null),
      (this['_selectedCommandIndex'] = null),
      this['_markDirty']());
  }
  ['_commandLayerHit'](value233, box49, box50, value234) {
    const x13 = this['_commands'][value233];
    if (!x13) return ![];
    const value235 = Math['max'](0x0, getFiniteNumber(value234)),
      value236 = Math['max'](0x0, getFiniteNumber(x13['sizeWorld'], 0x1) / 0x2),
      value237 = value235 + value236;
    if (x13['type'] === 'brush' || x13['type'] === 'eraser')
      return doesSegmentHitPolyline(box49, box50, x13['points'], value237);
    if (x13['type'] === 'rect') {
      const whiteboardLayerGeometry = getWhiteboardLayerGeometry(x13);
      return Boolean(
        whiteboardLayerGeometry && doesSegmentHitPolygon(box49, box50, whiteboardLayerGeometry['corners'], value237),
      );
    }
    if (x13['type'] === 'shape') {
      const whiteboardLayerGeometry2 = getWhiteboardLayerGeometry(x13);
      return Boolean(
        whiteboardLayerGeometry2 && doesSegmentHitPolygon(box49, box50, whiteboardLayerGeometry2['corners'], value237),
      );
    }
    if (x13['type'] === 'arrow') {
      const x14 = getArrowGeometry(x13),
        list8 =
          x14['type'] === 'elbow'
            ? x14['points']
            : [x14['start'], x14['middle'], x14['end']],
        args7 = list8['map']((box51) => box51['x']),
        args8 = list8['map']((box52) => box52['y']),
        value238 =
          x14['type'] === 'arc'
            ? {
                x: x14['center']['x'] - x14['radius'],
                y: x14['center']['y'] - x14['radius'],
                width: x14['radius'] * 0x2,
                height: x14['radius'] * 0x2,
              }
            : {
                x: Math['min'](...args7),
                y: Math['min'](...args8),
                width: Math['max'](...args7) - Math['min'](...args7),
                height: Math['max'](...args8) - Math['min'](...args8),
              };
      if (!doesSegmentHitBounds(box49, box50, value238, value237)) return ![];
      const finiteNumber3 = getFiniteNumber(box50?.['x']) - getFiniteNumber(box49?.['x']),
        finiteNumber4 = getFiniteNumber(box50?.['y']) - getFiniteNumber(box49?.['y']),
        value239 = Math['hypot'](finiteNumber3, finiteNumber4) * this['_getViewport']()['zoom'],
        value240 = Math['max'](0x1, Math['min'](0x200, Math['ceil'](value239 / 0x4)));
      for (let value241 = 0x0; value241 <= value240; value241 += 0x1) {
        const value242 = value241 / value240,
          value243 = {
            x: getFiniteNumber(box49?.['x']) + finiteNumber3 * value242,
            y: getFiniteNumber(box49?.['y']) + finiteNumber4 * value242,
          };
        if (getDistanceToArrowPath(value243, x13) <= value237) return !![];
      }
      return ![];
    }
    if (x13['type'] === 'text') {
      const enabled31 = this['_getTextGeometry']?.(x13);
      if (!enabled31?.['corners']) return ![];
      const box53 = this['_getViewport']();
      return doesSegmentHitPolygon(
        getScreenPointFromWorld(box49, box53),
        getScreenPointFromWorld(box50, box53),
        enabled31['corners'],
        value235 * box53['zoom'],
      );
    }
    if (x13['type'] === 'number-label')
      return doesSegmentHitCircle(
        box49,
        box50,
        { x: x13['x'], y: x13['y'] },
        value235 + Math['max'](value236, 0x9),
      );
    if (x13['type'] === 'fill')
      return doesSegmentHitCircle(
        box49,
        box50,
        { x: x13['x'], y: x13['y'] },
        Math['max'](value235, 0x6 / this['_getViewport']()['zoom']),
      );
    return ![];
  }
  ['_collectLayerEraseHits'](value244, value245, value246) {
    const map3 = this['_pointerState']['eraseIndices'] || new Set();
    this['_pointerState']['eraseIndices'] = map3;
    for (let value247 = 0x0; value247 < this['_commands']['length']; value247 += 0x1) {
      if (map3['has'](value247)) continue;
      this['_commandLayerHit'](value247, value244, value245, value246) && map3['add'](value247);
    }
    return map3;
  }
  ['_appendLayerEraseTrailPoint'](box54) {
    const value248 = this['_pointerState'],
      list9 = Array['isArray'](value248['eraseTrail']) ? value248['eraseTrail'] : [],
      box55 = { x: getFiniteNumber(box54?.['x']), y: getFiniteNumber(box54?.['y']) },
      box56 = list9[list9['length'] - 0x1],
      value249 = this['_getViewport']()['zoom'],
      count10 = box56
        ? Math['hypot'](box55['x'] - box56['x'], box55['y'] - box56['y']) * value249
        : Infinity;
    if (count10 >= 0x1) list9['push'](box55);
    list9['length'] > WHITEBOARD_LAYER_ERASER_TRAIL_POINT_LIMIT &&
      list9['splice'](0x0, list9['length'] - WHITEBOARD_LAYER_ERASER_TRAIL_POINT_LIMIT);
    const run7 = () =>
      list9['slice'](0x1)['reduce']((value250, box57, value251) => {
        const box58 = list9[value251];
        return (
          value250 +
          Math['hypot'](box57['x'] - box58['x'], box57['y'] - box58['y']) * value249
        );
      }, 0x0);
    while (list9['length'] > 0x2 && run7() > WHITEBOARD_LAYER_ERASER_TRAIL_MAX_SCREEN_LENGTH) {
      list9['shift']();
    }
    return ((value248['eraseTrail'] = list9), list9);
  }
  ['_scheduleLayerEraserPreviewRender']() {
    if (this['_layerEraserPreviewRaf']) return;
    this['_layerEraserPreviewRaf'] = requestWhiteboardFrame(() => {
      this['_layerEraserPreviewRaf'] = 0x0;
      if (this['_pointerState']?.['mode'] === 'erase-layers') this['_render']();
    });
  }
  ['_cancelLayerEraserPreviewRender']() {
    if (!this['_layerEraserPreviewRaf']) return;
    (cancelWhiteboardFrame(this['_layerEraserPreviewRaf']), (this['_layerEraserPreviewRaf'] = 0x0));
  }
  ['_drawLayerEraserTrail'](ctx4, value252) {
    const list10 = this['_pointerState']?.['eraseTrail'];
    if (!ctx4 || !Array['isArray'](list10) || list10['length'] < 0x2) return ![];
    const list11 = list10['map']((value253) => getScreenPointFromWorld(value253, value252)),
      value254 = Math['max'](0x3, Math['min'](0xe, clampImageBrushSize(this['_style']?.['size']) * 0.5));
    (ctx4['save'](),
      (ctx4['globalCompositeOperation'] = 'source-over'),
      (ctx4['strokeStyle'] = getColorCanvas(WHITEBOARD_DEFAULT_COLOR)),
      (ctx4['lineWidth'] = value254),
      (ctx4['lineCap'] = 'round'),
      (ctx4['lineJoin'] = 'round'),
      (ctx4['globalAlpha'] = 0.14),
      ctx4['beginPath'](),
      ctx4['moveTo'](list11[0x0]['x'], list11[0x0]['y']));
    if (list11['length'] === 0x2 || typeof ctx4['quadraticCurveTo'] !== 'function')
      list11['slice'](0x1)['forEach']((box59) => ctx4['lineTo'](box59['x'], box59['y']));
    else {
      for (let value255 = 0x1; value255 < list11['length'] - 0x1; value255 += 0x1) {
        const box60 = list11[value255],
          box61 = list11[value255 + 0x1];
        ctx4['quadraticCurveTo'](
          box60['x'],
          box60['y'],
          (box60['x'] + box61['x']) / 0x2,
          (box60['y'] + box61['y']) / 0x2,
        );
      }
      const box62 = list11[list11['length'] - 0x2],
        box63 = list11[list11['length'] - 0x1];
      ctx4['quadraticCurveTo'](box62['x'], box62['y'], box63['x'], box63['y']);
    }
    return (ctx4['stroke'](), ctx4['restore'](), !![]);
  }
  ['_commitLayerErase']() {
    this['_cancelLayerEraserPreviewRender']?.();
    const map4 = this['_pointerState']['eraseIndices'];
    ((this['_pointerState']['eraseIndices'] = null),
      (this['_pointerState']['eraseLast'] = null),
      (this['_pointerState']['eraseTrail'] = null));
    if (!(map4 instanceof Set) || map4['size'] === 0x0) return (this['_render'](), ![]);
    return (
      (this['_commands'] = this['_commands']['filter'](
        (value256, value257) => !map4['has'](value257),
      )),
      (this['_selectedTextCommandIndex'] = null),
      (this['_selectedCommandIndex'] = null),
      (this['_redoStack'] = []),
      this['_markDirty'](),
      !![]
    );
  }
  ['_findCommandHit'](box64) {
    const zoom2 = this['_getViewport'](),
      value258 = Math['max'](0x6 / zoom2['zoom'], 0x2);
    for (let index8 = this['_commands']['length'] - 0x1; index8 >= 0x0; index8 -= 0x1) {
      const box65 = this['_commands'][index8];
      if (!box65) continue;
      if (box65['type'] === 'text') {
        const value259 = this['_findTextHit'](box64);
        if (value259?.['index'] === index8) return { index: index8 };
        continue;
      }
      if (box65['type'] === 'brush' || box65['type'] === 'eraser') {
        const value260 = value258 + Math['max'](0x0, getFiniteNumber(box65['sizeWorld'], 0x1) / 0x2);
        if (doesSegmentHitPolyline(box64, box64, box65['points'], value260))
          return { index: index8 };
        continue;
      }
      if (box65['type'] === 'rect') {
        const value261 = Math['max'](value258, getFiniteNumber(box65['sizeWorld'], 0x1) / 0x2),
          whiteboardLayerGeometry3 = getWhiteboardLayerGeometry(box65, { zoom: zoom2['zoom'] });
        if (whiteboardLayerGeometry3 && doesSegmentHitPolygon(box64, box64, whiteboardLayerGeometry3['corners'], value261))
          return { index: index8 };
        continue;
      }
      if (box65['type'] === 'shape') {
        const value262 = Math['max'](value258, getFiniteNumber(box65['sizeWorld'], 0x1) / 0x2),
          whiteboardLayerGeometry4 = getWhiteboardLayerGeometry(box65, { zoom: zoom2['zoom'] });
        if (whiteboardLayerGeometry4 && doesSegmentHitPolygon(box64, box64, whiteboardLayerGeometry4['corners'], value262))
          return { index: index8 };
        continue;
      }
      if (box65['type'] === 'arrow') {
        const value263 = Math['max'](value258, getFiniteNumber(box65['sizeWorld'], 0x1) / 0x2),
          arrowPath = getDistanceToArrowPath(box64, box65);
        if (arrowPath <= value263) return { index: index8 };
        continue;
      }
      if (box65['type'] === 'number-label') {
        const value264 = Math['max'](value258, getFiniteNumber(box65['sizeWorld'], 0x12) / 0x2);
        if (
          Math['hypot'](
            box64['x'] - getFiniteNumber(box65['x']),
            box64['y'] - getFiniteNumber(box65['y']),
          ) <= value264
        )
          return { index: index8 };
      }
    }
    return null;
  }
  ['_drawSelectedCommandOutline'](ctx5, box66) {
    const enabled32 = this['_getSelectedCommand']();
    if (!ctx5 || !enabled32 || enabled32['type'] === 'text') return;
    const cssVar2 = getCssVar('--blue-border-focus') || getCssVar('--blue') || ctx5['strokeStyle'],
      zoom3 = box66['zoom'] || 0x1;
    (ctx5['save'](),
      (ctx5['strokeStyle'] = cssVar2),
      (ctx5['fillStyle'] = cssVar2),
      (ctx5['lineWidth'] = 1.5),
      ctx5['setLineDash']([0x5, 0x4]));
    if (enabled32['type'] === 'arrow') {
      if (this['_pointerState']?.['arrowTransform']?.['type'] === 'handle') {
        ctx5['restore']();
        return;
      }
      const arrowGeometry = getArrowGeometry(enabled32),
        box67 = getScreenPointFromWorld(arrowGeometry['start'], box66),
        box68 = getScreenPointFromWorld(arrowGeometry['end'], box66),
        screenPointFromWorld = getScreenPointFromWorld(arrowGeometry['middle'], box66);
      (ctx5['setLineDash']([]),
        ctx5['beginPath'](),
        ctx5['moveTo'](box67['x'], box67['y']));
      if (arrowGeometry['type'] === 'arc') {
        const box69 = getScreenPointFromWorld(arrowGeometry['center'], box66);
        ctx5['arc'](
          box69['x'],
          box69['y'],
          arrowGeometry['radius'] * zoom3,
          arrowGeometry['startAngle'],
          arrowGeometry['endAngle'],
          arrowGeometry['anticlockwise'],
        );
      } else
        arrowGeometry['type'] === 'elbow'
          ? arrowGeometry['points']['slice'](0x1)['forEach']((value265) => {
              const box70 = getScreenPointFromWorld(value265, box66);
              ctx5['lineTo'](box70['x'], box70['y']);
            })
          : ctx5['lineTo'](box68['x'], box68['y']);
      (ctx5['stroke'](),
        [box67, screenPointFromWorld, box68]['forEach']((box71, count11) => {
          (ctx5['beginPath'](),
            (ctx5['fillStyle'] = getCssVar('--canvas-white') || '#fff'),
            (ctx5['strokeStyle'] = cssVar2),
            (ctx5['lineWidth'] = 0x2),
            ctx5['arc'](
              box71['x'],
              box71['y'],
              count11 === 0x1 ? 4.5 : 0x6,
              0x0,
              Math['PI'] * 0x2,
            ),
            ctx5['fill'](),
            ctx5['stroke']());
        }));
    } else {
      const args9 = getWhiteboardLayerGeometry(enabled32, { zoom: zoom3 });
      if (args9) {
        const list12 = args9['corners']['map']((value266) =>
          getScreenPointFromWorld(value266, box66),
        );
        Math['abs'](args9['rotation']) < 0.0001
          ? ctx5['strokeRect'](
              list12[0x0]['x'],
              list12[0x0]['y'],
              list12[0x2]['x'] - list12[0x0]['x'],
              list12[0x2]['y'] - list12[0x0]['y'],
            )
          : (ctx5['beginPath'](),
            ctx5['moveTo'](list12[0x0]['x'], list12[0x0]['y']),
            list12['slice'](0x1)['forEach']((box72) =>
              ctx5['lineTo'](box72['x'], box72['y']),
            ),
            ctx5['closePath'](),
            ctx5['stroke']());
        if (this['_view']?.['tool'] === 'select') {
          ctx5['setLineDash']([]);
          if (args9['rotationHandle']) {
            const box73 = getScreenPointFromWorld(args9['topMiddle'], box66),
              box74 = getScreenPointFromWorld(args9['rotationHandle']['point'], box66);
            (ctx5['beginPath'](),
              ctx5['moveTo'](box73['x'], box73['y']),
              ctx5['lineTo'](box74['x'], box74['y']),
              ctx5['stroke']());
          }
          const list13 = [
            ...args9['scaleHandles'],
            ...(args9['rotationHandle'] ? [args9['rotationHandle']] : []),
          ];
          list13['forEach']((value267) => {
            const box75 = getScreenPointFromWorld(value267['point'], box66);
            (ctx5['beginPath'](),
              (ctx5['fillStyle'] = getCssVar('--canvas-white') || '#fff'),
              (ctx5['strokeStyle'] = cssVar2),
              (ctx5['lineWidth'] = 0x2),
              ctx5['arc'](box75['x'], box75['y'], 5.5, 0x0, Math['PI'] * 0x2),
              ctx5['fill'](),
              ctx5['stroke']());
          });
        }
      }
    }
    ctx5['restore']();
  }
  ['_render']() {
    if (!this['canvasEl']) return;
    this['_syncCanvasSize']();
    const viewport2 = this['_getViewport'](),
      ctx6 = this['canvasEl']['getContext']('2d'),
      map5 =
        this['_pointerState']?.['mode'] === 'erase-layers' &&
        this['_pointerState']['eraseIndices'] instanceof Set
          ? this['_pointerState']['eraseIndices']
          : null,
      value268 = this['_editingTextCommandIndex'];
    (ctx6['clearRect'](0x0, 0x0, this['_canvasCssWidth'], this['_canvasCssHeight']),
      this['_drawBackgroundImage'](ctx6, viewport2),
      renderCommands({
        ctx: ctx6,
        viewport: viewport2,
        canvasEl: this['canvasEl'],
        commands: this['_commands'],
        isDraft: ![],
        isEraseScene: ![],
        checkerPattern: this['_checkerPattern'],
        defaultTextColor: getColorCanvas(WHITEBOARD_DEFAULT_COLOR),
        getTextGeometry: (value269) => this['_getTextGeometry'](value269),
        selectedTextCommandIndex: Number['isInteger'](value268) ? null : this['_selectedTextCommandIndex'],
        selectedCommandsRef: this['_commands'],
        resolveCssVar: getCssVar,
        fillRegionCache: this['_fillRegionCache'],
        numberLabelBackgroundColor: getCssVar('--canvas-white'),
        getCommandOpacityMultiplier:
          Number['isInteger'](value268) || map5?.['size']
            ? (value270, value271) => {
                if (value271 === value268) return 0x0;
                return map5?.['has'](value271) ? WHITEBOARD_LAYER_ERASE_PREVIEW_OPACITY : 0x1;
              }
            : null,
        textSelectionVariant: 'whiteboard',
        textLayoutVariant: 'whiteboard',
      }),
      this['_drawSelectedCommandOutline'](ctx6, viewport2));
    if (map5) this['_drawLayerEraserTrail'](ctx6, viewport2);
    this['_draft'] &&
      renderCommands({
        ctx: ctx6,
        viewport: viewport2,
        canvasEl: this['canvasEl'],
        commands: [this['_draft']],
        isDraft: !![],
        isEraseScene: ![],
        checkerPattern: this['_checkerPattern'],
        defaultTextColor: getColorCanvas(WHITEBOARD_DEFAULT_COLOR),
        getTextGeometry: (value272) => this['_getTextGeometry'](value272),
        selectedCommandsRef: null,
        resolveCssVar: getCssVar,
        fillRegionCache: this['_fillRegionCache'],
        numberLabelBackgroundColor: getCssVar('--canvas-white'),
        textLayoutVariant: 'whiteboard',
      });
  }
  ['_markDirty']() {
    (this['_fillRegionCache']['clear'](),
      this['_syncToolbarState'](),
      this['_render'](),
      this['_scheduleSave']());
  }
  ['_getCurrentSignature']() {
    return getWhiteboardSignature({
      commands: this['_commands'],
      tool: this['_view']['tool'],
      shapeType: this['_view']['shapeType'],
      view: this['_camera'],
      style: this['_style'],
      color: this['_style']['color'],
      brushSizePx: this['_style']['size'],
    });
  }
  ['_loadWhiteboardState'](value273) {
    const tool6 = normalizeWhiteboardState(value273);
    ((this['_whiteboard'] = tool6),
      (this['_commands'] = cloneCommands(tool6['commands'])),
      (this['_redoStack'] = []),
      (this['_draft'] = null),
      (this['_selectedTextCommandIndex'] = null),
      (this['_selectedCommandIndex'] = null),
      (this['_editingTextCommandIndex'] = null),
      (this['_camera'] = cloneWhiteboardView(tool6['view'])),
      (this['_style'] = cloneWhiteboardStyle(tool6['style'])),
      (this['_view'] = {
        tool: tool6['tool'],
        shapeType: tool6['shapeType'],
        color: this['_style']['color'],
        brushSizePx: this['_style']['size'],
      }),
      (this['_lastPersistedSignature'] = getWhiteboardSignature(tool6)),
      this['_syncToolbarState'](),
      this['_render']());
  }
  ['_scheduleSave']() {
    if (this['_saveTimer']) clearTimeout(this['_saveTimer']);
    this['_saveTimer'] = setTimeout(() => {
      ((this['_saveTimer'] = null), this['_saveNow']());
    }, WHITEBOARD_SAVE_DEBOUNCE_MS);
  }
  ['_flushSave']() {
    (this['_saveTimer'] && (clearTimeout(this['_saveTimer']), (this['_saveTimer'] = null)),
      this['_saveNow']());
  }
  ['_saveNow']() {
    if (!this['id']) return;
    const args10 = appStore['getStateRaw']?.()['nodes']?.[this['id']];
    if (!args10) return;
    const whiteboardState2 = normalizeWhiteboardState(args10['whiteboard']),
      whiteboard = normalizeWhiteboardState({
        version: WHITEBOARD_DATA_VERSION,
        commands: this['_commands'],
        tool: this['_view']['tool'],
        shapeType: this['_view']['shapeType'],
        view: this['_camera'],
        style: this['_style'],
        color: this['_style']['color'],
        brushSizePx: this['_style']['size'],
        updatedAt: Date['now'](),
      }),
      whiteboardSignature2 = getWhiteboardSignature(whiteboard);
    if (whiteboardSignature2 === getWhiteboardSignature(whiteboardState2)) return;
    ((this['_whiteboard'] = whiteboard),
      (this['_lastPersistedSignature'] = whiteboardSignature2),
      (this['_data'] = { ...args10, whiteboard: whiteboard }),
      appStore['updateNodeData'](this['id'], { whiteboard: whiteboard }),
      window['_triggerLocalCacheSave']?.());
  }
}
