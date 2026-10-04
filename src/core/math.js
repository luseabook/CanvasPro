export {
  clientToViewportNdc,
  ndcToViewportPoint,
  intersectRayWithAxisPlane,
  adjustSpatialCamera,
  applyRelativeCameraPose,
} from './spatialProjectionMath.js';

export function generateId(value = 'id') {
  return value + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}
export function screenToWorld(item, key, index) {
  const { x: x, y: y, zoom: zoom } = index;
  return { x: (item - x) / zoom, y: (key - y) / zoom };
}
export function worldToScreen(x2, y2, result) {
  const { x: x3, y: y3, zoom: zoom2 } = result;
  return { x: x2 * zoom2 + x3, y: y2 * zoom2 + y3 };
}
export function getViewportScreenOrigin(options = {}) {
  return {
    x: Number.isFinite(Number(options?._screenOriginX)) ? Number(options._screenOriginX) : 0,
    y: Number.isFinite(Number(options?._screenOriginY)) ? Number(options._screenOriginY) : 0,
  };
}
export function screenToViewportPoint(data, target, source = {}) {
  const box = getViewportScreenOrigin(source);
  return { x: Number(data) - box.x, y: Number(target) - box.y };
}
export const CANVAS_GRID_SIZE = 20;
export function snapToCanvasGrid(next, current = CANVAS_GRID_SIZE) {
  const entry = Number.isFinite(Number(current)) && Number(current) > 0 ? Number(current) : CANVAS_GRID_SIZE,
    record = Number(next);
  if (!Number.isFinite(record)) return 0;
  return Math.round(record / entry) * entry;
}
export function isPointInRect(payload, handle, state, config, scope, input) {
  return payload >= state && payload <= state + scope && handle >= config && handle <= config + input;
}
export function isRectIntersect(output, value2, value3, value4, value5, value6, value7, value8) {
  return !(
    value5 >= output + value3 ||
    value5 + value7 <= output ||
    value6 >= value2 + value4 ||
    value6 + value8 <= value2
  );
}
export function clampRectGroupTranslation(
  list = [],
  value9 = 0,
  value10 = 0,
  box2 = { x: 0, y: 0, width: 1, height: 1 },
) {
  const list2 = (Array.isArray(list) ? list : [])
    .map((box3) => ({
      x: Number(box3?.x),
      y: Number(box3?.y),
      width: Number(box3?.width),
      height: Number(box3?.height),
    }))
    .filter(
      (box4) =>
        Number.isFinite(box4.x) &&
        Number.isFinite(box4.y) &&
        Number.isFinite(box4.width) &&
        box4.width >= 0 &&
        Number.isFinite(box4.height) &&
        box4.height >= 0,
    );
  if (!list2.length) return { x: 0, y: 0 };
  const value11 = Number.isFinite(Number(box2?.x)) ? Number(box2.x) : 0,
    value12 = Number.isFinite(Number(box2?.y)) ? Number(box2.y) : 0,
    value13 = Math.max(0, Number(box2?.width) || 0),
    value14 = Math.max(0, Number(box2?.height) || 0),
    value15 = Math.min(...list2.map((box5) => box5.x)),
    value16 = Math.min(...list2.map((box6) => box6.y)),
    value17 = Math.max(...list2.map((box7) => box7.x + box7.width)),
    value18 = Math.max(...list2.map((box8) => box8.y + box8.height)),
    value19 = Number(value9) || 0,
    value20 = Number(value10) || 0;
  return {
    x: Math.max(value11 - value15, Math.min(value11 + value13 - value17, value19)),
    y: Math.max(value12 - value16, Math.min(value12 + value14 - value18, value20)),
  };
}
export function findAvailablePosition(
  value21,
  value22,
  value23,
  value24,
  value25,
  value26 = 20,
  value27 = 'right',
) {
  let x4 = value22,
    y4 = value23;
  const list3 = Object.values(value21);
  if (list3.length === 0) return { x: x4, y: y4 };
  let value28 = true;
  while (value28) {
    value28 = false;
    for (const box9 of list3) {
      const value29 = box9.x,
        value30 = box9.y,
        value31 = box9.width || 100,
        value32 = box9.height || 100;
      if (isRectIntersect(x4, y4, value24, value25, value29, value30, value31, value32)) {
        if (value27 === 'down') y4 = value30 + value32 + value26;
        else value27 === 'left' ? (x4 = value29 - value26 - value24) : (x4 = value29 + value31 + value26);
        value28 = true;
        break;
      }
    }
  }
  return { x: x4, y: y4 };
}
const ALIGN_SKIP_KEYS = [
  'isLocked',
  'locked',
  'isHidden',
  'hidden',
  'isTemp',
  'temp',
  'temporary',
  'ephemeral',
  'isDeleted',
  'deleted',
];
function _toFiniteNumber(value33, value34 = 0) {
  const value35 = Number(value33);
  return Number.isFinite(value35) ? value35 : value34;
}
function _toAlignRatio(value36, value37 = 0.5) {
  return Math.max(0, Math.min(1, _toFiniteNumber(value36, value37)));
}
function _isAlignableNode(enabled) {
  if (!enabled || typeof enabled !== 'object') return false;
  for (const value38 of ALIGN_SKIP_KEYS) {
    if (enabled[value38]) return false;
  }
  return true;
}
export function getAlignableSelectionNodes(enabled2, list4) {
  if (!enabled2 || typeof enabled2 !== 'object') return [];
  if (!Array.isArray(list4) || list4.length === 0) return [];
  const list5 = [];
  for (const id of list4) {
    const node = enabled2[id];
    if (!_isAlignableNode(node)) continue;
    const x5 = _toFiniteNumber(node.x, 0),
      y5 = _toFiniteNumber(node.y, 0),
      width = Math.max(0, _toFiniteNumber(node.width, 0)),
      height = Math.max(0, _toFiniteNumber(node.height, 0)),
      left = x5,
      right = x5 + width,
      top = y5,
      bottom = y5 + height;
    list5.push({
      id: id,
      node: node,
      x: x5,
      y: y5,
      width: width,
      height: height,
      left: left,
      right: right,
      top: top,
      bottom: bottom,
      cx: left + width / 2,
      cy: top + height / 2,
    });
  }
  return list5;
}
export function computeSelectionBounds(list6) {
  if (!Array.isArray(list6) || list6.length === 0) return null;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const box10 of list6) {
    ((minX = Math.min(minX, box10.left)),
      (minY = Math.min(minY, box10.top)),
      (maxX = Math.max(maxX, box10.right)),
      (maxY = Math.max(maxY, box10.bottom)));
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
  return {
    minX: minX,
    maxX: maxX,
    minY: minY,
    maxY: maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}
export function computeNodesWorldBounds(list7, list8 = null) {
  const list9 = [];
  if (Array.isArray(list7)) list9.push(...list7.filter(Boolean));
  else {
    if (Array.isArray(list8) && list8.length > 0)
      for (const value39 of list8) {
        const value40 = list7?.[value39];
        if (value40) list9.push(value40);
      }
    else list7 && typeof list7 === 'object' && list9.push(...Object.values(list7));
  }
  if (list9.length === 0) return null;
  let minX2 = Infinity,
    minY2 = Infinity,
    maxX2 = -Infinity,
    maxY2 = -Infinity;
  for (const box11 of list9) {
    if (!box11 || typeof box11 !== 'object') continue;
    const _toFiniteNumber2 = _toFiniteNumber(box11.x, 0),
      _toFiniteNumber3 = _toFiniteNumber(box11.y, 0),
      value41 = Math.max(0, _toFiniteNumber(box11.width, 0)),
      value42 = Math.max(0, _toFiniteNumber(box11.height, 0));
    ((minX2 = Math.min(minX2, _toFiniteNumber2)),
      (minY2 = Math.min(minY2, _toFiniteNumber3)),
      (maxX2 = Math.max(maxX2, _toFiniteNumber2 + value41)),
      (maxY2 = Math.max(maxY2, _toFiniteNumber3 + value42)));
  }
  if (
    !Number.isFinite(minX2) ||
    !Number.isFinite(minY2) ||
    !Number.isFinite(maxX2) ||
    !Number.isFinite(maxY2)
  )
    return null;
  return {
    minX: minX2,
    minY: minY2,
    maxX: maxX2,
    maxY: maxY2,
    width: Math.max(0, maxX2 - minX2),
    height: Math.max(0, maxY2 - minY2),
    centerX: (minX2 + maxX2) / 2,
    centerY: (minY2 + maxY2) / 2,
  };
}
export function computeViewportForWorldBounds(box12, box13, value43 = {}) {
  if (!box12 || !box13) return null;
  const _toFiniteNumber4 = _toFiniteNumber(box13.width, 0),
    _toFiniteNumber5 = _toFiniteNumber(box13.height, 0);
  if (!(_toFiniteNumber4 > 0 && _toFiniteNumber5 > 0)) return null;
  const value44 = Math.max(1, _toFiniteNumber(box12.width, 0)),
    value45 = Math.max(1, _toFiniteNumber(box12.height, 0)),
    _toFiniteNumber6 = _toFiniteNumber(box12.centerX, 0),
    _toFiniteNumber7 = _toFiniteNumber(box12.centerY, 0),
    value46 = Math.max(0, _toFiniteNumber(value43.padding, 0)),
    value47 = Math.max(0.0001, _toFiniteNumber(value43.minZoom, 0.2)),
    value48 = Math.max(value47, _toFiniteNumber(value43.maxZoom, 2)),
    value49 = Number(value43.fixedZoom),
    _toAlignRatio2 = _toAlignRatio(value43.alignX, 0.5),
    _toAlignRatio3 = _toAlignRatio(value43.alignY, 0.5),
    _toAlignRatio4 = _toAlignRatio(value43.worldAlignX, _toAlignRatio2),
    _toAlignRatio5 = _toAlignRatio(value43.worldAlignY, _toAlignRatio3),
    _toAlignRatio6 = _toAlignRatio(value43.viewportAlignX, _toAlignRatio2),
    _toAlignRatio7 = _toAlignRatio(value43.viewportAlignY, _toAlignRatio3),
    value50 = Math.max(1, _toFiniteNumber4 - value46 * 2),
    value51 = Math.max(1, _toFiniteNumber5 - value46 * 2),
    zoom3 = Number.isFinite(value49)
      ? Math.max(value47, Math.min(value49, value48))
      : Math.max(value47, Math.min(value50 / value44, value51 / value45, value48)),
    x6 = _toFiniteNumber(box13.left, 0) + _toFiniteNumber4 * _toAlignRatio6,
    y6 = _toFiniteNumber(box13.top, 0) + _toFiniteNumber5 * _toAlignRatio7,
    _toFiniteNumber8 = _toFiniteNumber(box12.minX, 0) + value44 * _toAlignRatio4,
    _toFiniteNumber9 = _toFiniteNumber(box12.minY, 0) + value45 * _toAlignRatio5;
  return { x: x6 - _toFiniteNumber8 * zoom3, y: y6 - _toFiniteNumber9 * zoom3, zoom: zoom3 };
}
export function computeAlignTargets(list10, value52, enabled3) {
  if (!Array.isArray(list10) || list10.length === 0 || !enabled3) return {};
  const value53 = {};
  for (const box14 of list10) {
    let x7 = box14.x,
      y7 = box14.y;
    if (value52 === 'left') x7 = enabled3.minX;
    else {
      if (value52 === 'h-center') x7 = enabled3.centerX - box14.width / 2;
      else {
        if (value52 === 'right') x7 = enabled3.maxX - box14.width;
        else {
          if (value52 === 'top') y7 = enabled3.minY;
          else {
            if (value52 === 'v-center') y7 = enabled3.centerY - box14.height / 2;
            else {
              if (value52 === 'bottom') y7 = enabled3.maxY - box14.height;
            }
          }
        }
      }
    }
    value53[box14.id] = { x: x7, y: y7 };
  }
  return value53;
}
export function computeDistributeTargets(list11, value54, value55 = undefined) {
  if (!Array.isArray(list11) || list11.length < 2) return {};
  const value56 = value54 === 'horizontal',
    list12 = [...list11].sort((box15, box16) => {
      const value57 = value56 ? box15.left : box15.top,
        value58 = value56 ? box16.left : box16.top;
      if (value57 !== value58) return value57 - value58;
      return String(box15.id).localeCompare(String(box16.id));
    }),
    value59 = {};
  for (const x8 of list12) {
    value59[x8.id] = { x: x8.x, y: x8.y };
  }
  if (list12.length <= 1) return value59;
  const count = Number(value55);
  if (Number.isFinite(count) && count >= 0) {
    let x9 = value56 ? list12[0].left : list12[0].top;
    for (let count2 = 0; count2 < list12.length; count2 += 1) {
      const y8 = list12[count2];
      if (count2 === 0) {
        x9 += (value56 ? y8.width : y8.height) + count;
        continue;
      }
      value56
        ? ((value59[y8.id] = { x: x9, y: y8.y }), (x9 += y8.width + count))
        : ((value59[y8.id] = { x: y8.x, y: x9 }), (x9 += y8.height + count));
    }
    return value59;
  }
  if (list12.length <= 2) return value59;
  const box17 = list12[0],
    box18 = list12[list12.length - 1],
    value60 = list12.reduce((item2, box19) => item2 + (value56 ? box19.width : box19.height), 0),
    value61 = value56 ? Math.max(0, box18.right - box17.left) : Math.max(0, box18.bottom - box17.top),
    value62 = (value61 - value60) / (list12.length - 1);
  let x10 = value56 ? box17.left : box17.top;
  for (let count3 = 0; count3 < list12.length; count3 += 1) {
    const y9 = list12[count3];
    if (count3 === 0 || count3 === list12.length - 1) {
      x10 += (value56 ? y9.width : y9.height) + value62;
      continue;
    }
    value56
      ? ((value59[y9.id] = { x: x10, y: y9.y }), (x10 += y9.width + value62))
      : ((value59[y9.id] = { x: y9.x, y: x10 }), (x10 += y9.height + value62));
  }
  return value59;
}
function _sortLayoutItems(value63) {
  return [...(Array.isArray(value63) ? value63 : [])].sort((box20, box21) => {
    const _toFiniteNumber10 = _toFiniteNumber(box20?.top ?? box20?.y, 0),
      _toFiniteNumber11 = _toFiniteNumber(box21?.top ?? box21?.y, 0);
    if (_toFiniteNumber10 !== _toFiniteNumber11) return _toFiniteNumber10 - _toFiniteNumber11;
    const _toFiniteNumber12 = _toFiniteNumber(box20?.left ?? box20?.x, 0),
      _toFiniteNumber13 = _toFiniteNumber(box21?.left ?? box21?.x, 0);
    if (_toFiniteNumber12 !== _toFiniteNumber13) return _toFiniteNumber12 - _toFiniteNumber13;
    return String(box20?.id || '').localeCompare(String(box21?.id || ''));
  });
}
export function computeArrangeRowTargets(value64, value65 = {}) {
  const list13 = _sortLayoutItems(value64);
  if (list13.length === 0) return {};
  const selectionBounds = computeSelectionBounds(list13);
  if (!selectionBounds) return {};
  const value66 = Math.max(0, _toFiniteNumber(value65.gap, 40)),
    value67 = String(value65.align || 'top');
  let x11 = selectionBounds.minX;
  const value68 = {};
  for (const box22 of list13) {
    let y10 = selectionBounds.minY;
    if (value67 === 'center' || value67 === 'middle') y10 = selectionBounds.centerY - box22.height / 2;
    else value67 === 'bottom' && (y10 = selectionBounds.maxY - box22.height);
    ((value68[box22.id] = { x: x11, y: y10 }), (x11 += box22.width + value66));
  }
  return value68;
}
export function computeArrangeColumnTargets(value69, value70 = {}) {
  const list14 = _sortLayoutItems(value69);
  if (list14.length === 0) return {};
  const selectionBounds2 = computeSelectionBounds(list14);
  if (!selectionBounds2) return {};
  const value71 = Math.max(0, _toFiniteNumber(value70.gap, 40)),
    value72 = String(value70.align || 'left');
  let y11 = selectionBounds2.minY;
  const value73 = {};
  for (const box23 of list14) {
    let x12 = selectionBounds2.minX;
    if (value72 === 'center' || value72 === 'middle') x12 = selectionBounds2.centerX - box23.width / 2;
    else value72 === 'right' && (x12 = selectionBounds2.maxX - box23.width);
    ((value73[box23.id] = { x: x12, y: y11 }), (y11 += box23.height + value71));
  }
  return value73;
}
export function computeArrangeGridTargets(value74, value75 = {}) {
  const list15 = _sortLayoutItems(value74);
  if (list15.length === 0) return {};
  const x13 = computeSelectionBounds(list15);
  if (!x13) return {};
  const count4 = Number(value75.columns),
    value76 =
      Number.isFinite(count4) && count4 > 0
        ? Math.max(1, Math.trunc(count4))
        : Math.ceil(Math.sqrt(list15.length)),
    value77 = Math.max(0, _toFiniteNumber(value75.gapX ?? value75.gap, 40)),
    value78 = Math.max(0, _toFiniteNumber(value75.gapY ?? value75.gap, 40)),
    value79 = list15.reduce((item3, box24) => Math.max(item3, box24.width), 0),
    value80 = list15.reduce((item4, box25) => Math.max(item4, box25.height), 0),
    value81 = {};
  return (
    list15.forEach((item5, value82) => {
      const value83 = value82 % value76,
        value84 = Math.floor(value82 / value76);
      value81[item5.id] = {
        x: x13.minX + value83 * (value79 + value77),
        y: x13.minY + value84 * (value80 + value78),
      };
    }),
    value81
  );
}
export function computeMoveNearNodeTargets(list16, box26, value85 = {}) {
  const list17 = Array.isArray(list16) ? list16.filter(Boolean) : [];
  if (list17.length === 0 || !box26) return {};
  const box27 = computeSelectionBounds(list17);
  if (!box27) return {};
  const value86 = Math.max(0, _toFiniteNumber(value85.gap, 40)),
    value87 = String(value85.placement || 'right');
  let value88 = box27.minX,
    value89 = box27.minY;
  if (value87 === 'left')
    ((value88 = box26.left - value86 - box27.width), (value89 = box26.cy - box27.height / 2));
  else {
    if (value87 === 'top')
      ((value88 = box26.cx - box27.width / 2), (value89 = box26.top - value86 - box27.height));
    else
      value87 === 'bottom'
        ? ((value88 = box26.cx - box27.width / 2), (value89 = box26.bottom + value86))
        : ((value88 = box26.right + value86), (value89 = box26.cy - box27.height / 2));
  }
  const value90 = value88 - box27.minX,
    value91 = value89 - box27.minY,
    value92 = {};
  for (const x14 of list17) {
    value92[x14.id] = { x: x14.x + value90, y: x14.y + value91 };
  }
  return value92;
}
export function buildNodeOffsetPlan(enabled4, enabled5) {
  if (!enabled4 || typeof enabled4 !== 'object') return {};
  if (!enabled5 || typeof enabled5 !== 'object') return {};
  const value93 = {};
  for (const [value94, box28] of Object.entries(enabled5)) {
    const box29 = enabled4[value94];
    if (!box29 || !box28) continue;
    const _toFiniteNumber14 = _toFiniteNumber(box29.x, 0),
      _toFiniteNumber15 = _toFiniteNumber(box29.y, 0),
      _toFiniteNumber16 = _toFiniteNumber(box28.x, _toFiniteNumber14),
      _toFiniteNumber17 = _toFiniteNumber(box28.y, _toFiniteNumber15),
      dx = _toFiniteNumber16 - _toFiniteNumber14,
      dy = _toFiniteNumber17 - _toFiniteNumber15;
    if (Math.abs(dx) < 0.000001 && Math.abs(dy) < 0.000001) continue;
    value93[value94] = { dx: dx, dy: dy };
  }
  return value93;
}
export function resolveSnapThresholdInWorld(count5, value95 = 8) {
  const value96 = Number.isFinite(count5) && count5 > 0 ? count5 : 1,
    value97 = Number.isFinite(value95) ? value95 : 8;
  return value97 / value96;
}
export function computeSingleNodeSnapGuides(value98) {
  const {
      nodesById: nodesById,
      dragNodeId: dragNodeId,
      proposedX: proposedX,
      proposedY: proposedY,
      width: width2,
      height: height2,
      viewport: viewport,
      thresholdPx: thresholdPx = 8,
      spatialIndex: spatialIndex = null,
    } = value98 || {},
    snappedX = _toFiniteNumber(proposedX, 0),
    snappedY = _toFiniteNumber(proposedY, 0),
    _toFiniteNumber18 = _toFiniteNumber(viewport?.x, 0),
    _toFiniteNumber19 = _toFiniteNumber(viewport?.y, 0),
    _toFiniteNumber20 = _toFiniteNumber(viewport?.zoom, 1) || 1,
    width3 = Math.max(0, _toFiniteNumber(width2, 200)),
    height3 = Math.max(0, _toFiniteNumber(height2, 200)),
    value99 = { snappedX: snappedX, snappedY: snappedY, guideLines: [] };
  if (!nodesById || typeof nodesById !== 'object' || !dragNodeId || !nodesById[dragNodeId]) return value99;
  const snapThresholdInWorld = resolveSnapThresholdInWorld(_toFiniteNumber20, thresholdPx),
    value100 = snappedX,
    value101 = snappedX + width3,
    value102 = snappedY,
    value103 = snappedY + height3;
  let value104 = null,
    value105 = null,
    pos = null,
    pos2 = null;
  const value106 = spatialIndex
    ? getNodeSpatialQueryNodes(
        nodesById,
        collectSnapSearchCandidateIds(
          spatialIndex,
          { x: snappedX, y: snappedY, width: width3, height: height3 },
          snapThresholdInWorld,
        ),
      )
    : Object.values(nodesById);
  for (const box30 of value106) {
    if (!box30 || box30.id === dragNodeId) continue;
    const _toFiniteNumber21 = _toFiniteNumber(box30.x, 0),
      value107 = _toFiniteNumber21 + Math.max(0, _toFiniteNumber(box30.width, 200)),
      _toFiniteNumber22 = _toFiniteNumber(box30.y, 0),
      value108 = _toFiniteNumber22 + Math.max(0, _toFiniteNumber(box30.height, 200));
    if (value104 === null) {
      if (Math.abs(value100 - _toFiniteNumber21) < snapThresholdInWorld)
        ((value104 = _toFiniteNumber21), (pos = _toFiniteNumber21));
      else {
        if (Math.abs(value100 - value107) < snapThresholdInWorld) ((value104 = value107), (pos = value107));
        else {
          if (Math.abs(value101 - _toFiniteNumber21) < snapThresholdInWorld)
            ((value104 = _toFiniteNumber21 - width3), (pos = _toFiniteNumber21));
          else
            Math.abs(value101 - value107) < snapThresholdInWorld &&
              ((value104 = value107 - width3), (pos = value107));
        }
      }
    }
    if (value105 === null) {
      if (Math.abs(value102 - _toFiniteNumber22) < snapThresholdInWorld)
        ((value105 = _toFiniteNumber22), (pos2 = _toFiniteNumber22));
      else {
        if (Math.abs(value102 - value108) < snapThresholdInWorld) ((value105 = value108), (pos2 = value108));
        else {
          if (Math.abs(value103 - _toFiniteNumber22) < snapThresholdInWorld)
            ((value105 = _toFiniteNumber22 - height3), (pos2 = _toFiniteNumber22));
          else
            Math.abs(value103 - value108) < snapThresholdInWorld &&
              ((value105 = value108 - height3), (pos2 = value108));
        }
      }
    }
    if (value104 !== null && value105 !== null) break;
  }
  const list18 = [],
    list19 = [];
  if (value104 !== null) {
    const snapMatchNodes = collectSnapMatchNodes(nodesById, value106, spatialIndex, 'x', pos);
    for (const box31 of snapMatchNodes) {
      if (!box31 || box31.id === dragNodeId) continue;
      const _toFiniteNumber23 = _toFiniteNumber(box31.x, 0),
        value109 = _toFiniteNumber23 + Math.max(0, _toFiniteNumber(box31.width, 200));
      (Math.abs(_toFiniteNumber23 - pos) < SNAP_MATCH_EPSILON ||
        Math.abs(value109 - pos) < SNAP_MATCH_EPSILON) &&
        list18.push(box31);
    }
  }
  if (value105 !== null) {
    const snapMatchNodes2 = collectSnapMatchNodes(nodesById, value106, spatialIndex, 'y', pos2);
    for (const box32 of snapMatchNodes2) {
      if (!box32 || box32.id === dragNodeId) continue;
      const _toFiniteNumber24 = _toFiniteNumber(box32.y, 0),
        value110 = _toFiniteNumber24 + Math.max(0, _toFiniteNumber(box32.height, 200));
      (Math.abs(_toFiniteNumber24 - pos2) < SNAP_MATCH_EPSILON ||
        Math.abs(value110 - pos2) < SNAP_MATCH_EPSILON) &&
        list19.push(box32);
    }
  }
  if (value104 !== null) {
    value99.snappedX = value104;
    const value111 = snappedY + (value105 !== null ? value105 - snappedY : 0),
      value112 = value111 + height3;
    let start = value111,
      end = value112;
    (list18.forEach((box33) => {
      const _toFiniteNumber25 = _toFiniteNumber(box33.y, 0),
        value113 = Math.max(0, _toFiniteNumber(box33.height, 200));
      ((start = Math.min(start, _toFiniteNumber25)), (end = Math.max(end, _toFiniteNumber25 + value113)));
    }),
      value99.guideLines.push({
        type: 'v',
        pos: pos * _toFiniteNumber20 + _toFiniteNumber18,
        start: start * _toFiniteNumber20 + _toFiniteNumber19,
        end: end * _toFiniteNumber20 + _toFiniteNumber19,
      }));
  }
  if (value105 !== null) {
    value99.snappedY = value105;
    const value114 = snappedX + (value104 !== null ? value104 - snappedX : 0),
      value115 = value114 + width3;
    let start2 = value114,
      end2 = value115;
    (list19.forEach((box34) => {
      const _toFiniteNumber26 = _toFiniteNumber(box34.x, 0),
        value116 = Math.max(0, _toFiniteNumber(box34.width, 200));
      ((start2 = Math.min(start2, _toFiniteNumber26)), (end2 = Math.max(end2, _toFiniteNumber26 + value116)));
    }),
      value99.guideLines.push({
        type: 'h',
        pos: pos2 * _toFiniteNumber20 + _toFiniteNumber19,
        start: start2 * _toFiniteNumber20 + _toFiniteNumber18,
        end: end2 * _toFiniteNumber20 + _toFiniteNumber18,
      }));
  }
  return value99;
}
export function computeMultiNodeSnapGuides(value117) {
  const {
      nodesById: nodesById2,
      movingNodeIds: movingNodeIds,
      proposedBounds: proposedBounds,
      viewport: viewport2,
      thresholdPx: thresholdPx = 8,
      spatialIndex: spatialIndex = null,
    } = value117 || {},
    snappedX2 = _toFiniteNumber(proposedBounds?.minX, 0),
    snappedY2 = _toFiniteNumber(proposedBounds?.minY, 0),
    width4 = Math.max(0, _toFiniteNumber(proposedBounds?.width, 0)),
    height4 = Math.max(0, _toFiniteNumber(proposedBounds?.height, 0)),
    _toFiniteNumber27 = _toFiniteNumber(viewport2?.x, 0),
    _toFiniteNumber28 = _toFiniteNumber(viewport2?.y, 0),
    _toFiniteNumber29 = _toFiniteNumber(viewport2?.zoom, 1) || 1,
    value118 = { snappedX: snappedX2, snappedY: snappedY2, guideLines: [] };
  if (!nodesById2 || typeof nodesById2 !== 'object') return value118;
  const map = new Set(Array.isArray(movingNodeIds) ? movingNodeIds.filter(Boolean) : []);
  if (map.size === 0) return value118;
  const snapThresholdInWorld2 = resolveSnapThresholdInWorld(_toFiniteNumber29, thresholdPx),
    value119 = snappedX2,
    value120 = snappedX2 + width4,
    value121 = snappedY2,
    value122 = snappedY2 + height4;
  let value123 = null,
    value124 = null,
    pos3 = null,
    pos4 = null;
  const value125 = spatialIndex
    ? getNodeSpatialQueryNodes(
        nodesById2,
        collectSnapSearchCandidateIds(
          spatialIndex,
          { x: snappedX2, y: snappedY2, width: width4, height: height4 },
          snapThresholdInWorld2,
        ),
      )
    : Object.values(nodesById2);
  for (const box35 of value125) {
    if (!box35 || map.has(box35.id)) continue;
    const _toFiniteNumber30 = _toFiniteNumber(box35.x, 0),
      value126 = _toFiniteNumber30 + Math.max(0, _toFiniteNumber(box35.width, 200)),
      _toFiniteNumber31 = _toFiniteNumber(box35.y, 0),
      value127 = _toFiniteNumber31 + Math.max(0, _toFiniteNumber(box35.height, 200));
    if (value123 === null) {
      if (Math.abs(value119 - _toFiniteNumber30) < snapThresholdInWorld2)
        ((value123 = _toFiniteNumber30), (pos3 = _toFiniteNumber30));
      else {
        if (Math.abs(value119 - value126) < snapThresholdInWorld2) ((value123 = value126), (pos3 = value126));
        else {
          if (Math.abs(value120 - _toFiniteNumber30) < snapThresholdInWorld2)
            ((value123 = _toFiniteNumber30 - width4), (pos3 = _toFiniteNumber30));
          else
            Math.abs(value120 - value126) < snapThresholdInWorld2 &&
              ((value123 = value126 - width4), (pos3 = value126));
        }
      }
    }
    if (value124 === null) {
      if (Math.abs(value121 - _toFiniteNumber31) < snapThresholdInWorld2)
        ((value124 = _toFiniteNumber31), (pos4 = _toFiniteNumber31));
      else {
        if (Math.abs(value121 - value127) < snapThresholdInWorld2) ((value124 = value127), (pos4 = value127));
        else {
          if (Math.abs(value122 - _toFiniteNumber31) < snapThresholdInWorld2)
            ((value124 = _toFiniteNumber31 - height4), (pos4 = _toFiniteNumber31));
          else
            Math.abs(value122 - value127) < snapThresholdInWorld2 &&
              ((value124 = value127 - height4), (pos4 = value127));
        }
      }
    }
    if (value123 !== null && value124 !== null) break;
  }
  const list20 = [],
    list21 = [];
  if (value123 !== null) {
    const snapMatchNodes3 = collectSnapMatchNodes(nodesById2, value125, spatialIndex, 'x', pos3);
    for (const box36 of snapMatchNodes3) {
      if (!box36 || map.has(box36.id)) continue;
      const _toFiniteNumber32 = _toFiniteNumber(box36.x, 0),
        value128 = _toFiniteNumber32 + Math.max(0, _toFiniteNumber(box36.width, 200));
      (Math.abs(_toFiniteNumber32 - pos3) < SNAP_MATCH_EPSILON ||
        Math.abs(value128 - pos3) < SNAP_MATCH_EPSILON) &&
        list20.push(box36);
    }
  }
  if (value124 !== null) {
    const snapMatchNodes4 = collectSnapMatchNodes(nodesById2, value125, spatialIndex, 'y', pos4);
    for (const box37 of snapMatchNodes4) {
      if (!box37 || map.has(box37.id)) continue;
      const _toFiniteNumber33 = _toFiniteNumber(box37.y, 0),
        value129 = _toFiniteNumber33 + Math.max(0, _toFiniteNumber(box37.height, 200));
      (Math.abs(_toFiniteNumber33 - pos4) < SNAP_MATCH_EPSILON ||
        Math.abs(value129 - pos4) < SNAP_MATCH_EPSILON) &&
        list21.push(box37);
    }
  }
  if (value123 !== null) {
    value118.snappedX = value123;
    const value130 = snappedY2 + (value124 !== null ? value124 - snappedY2 : 0),
      value131 = value130 + height4;
    let start3 = value130,
      end3 = value131;
    (list20.forEach((box38) => {
      const _toFiniteNumber34 = _toFiniteNumber(box38.y, 0),
        value132 = Math.max(0, _toFiniteNumber(box38.height, 200));
      ((start3 = Math.min(start3, _toFiniteNumber34)), (end3 = Math.max(end3, _toFiniteNumber34 + value132)));
    }),
      value118.guideLines.push({
        type: 'v',
        pos: pos3 * _toFiniteNumber29 + _toFiniteNumber27,
        start: start3 * _toFiniteNumber29 + _toFiniteNumber28,
        end: end3 * _toFiniteNumber29 + _toFiniteNumber28,
      }));
  }
  if (value124 !== null) {
    value118.snappedY = value124;
    const value133 = snappedX2 + (value123 !== null ? value123 - snappedX2 : 0),
      value134 = value133 + width4;
    let start4 = value133,
      end4 = value134;
    (list21.forEach((box39) => {
      const _toFiniteNumber35 = _toFiniteNumber(box39.x, 0),
        value135 = Math.max(0, _toFiniteNumber(box39.width, 200));
      ((start4 = Math.min(start4, _toFiniteNumber35)), (end4 = Math.max(end4, _toFiniteNumber35 + value135)));
    }),
      value118.guideLines.push({
        type: 'h',
        pos: pos4 * _toFiniteNumber29 + _toFiniteNumber28,
        start: start4 * _toFiniteNumber29 + _toFiniteNumber27,
        end: end4 * _toFiniteNumber29 + _toFiniteNumber27,
      }));
  }
  return value118;
}
export function calcWorldBounds(value136, box40 = null) {
  const nodesWorldBounds = computeNodesWorldBounds(value136);
  if (!nodesWorldBounds) {
    if (box40) {
      const value137 = 0x780,
        value138 = 0x438,
        minX3 = -box40.x / box40.zoom,
        minY3 = -box40.y / box40.zoom,
        width5 = value137 / box40.zoom,
        height5 = value138 / box40.zoom,
        value139 = 0x258;
      return {
        minX: minX3 - value139,
        minY: minY3 - value139,
        maxX: minX3 + width5 + value139,
        maxY: minY3 + height5 + value139,
        width: width5 + value139 * 2,
        height: height5 + value139 * 2,
      };
    }
    return { minX: 0, minY: 0, maxX: 0x7d0, maxY: 0x7d0, width: 0x7d0, height: 0x7d0 };
  }
  const value140 = 0x258,
    minX4 = nodesWorldBounds.minX - value140,
    minY4 = nodesWorldBounds.minY - value140,
    maxX3 = nodesWorldBounds.maxX + value140,
    maxY3 = nodesWorldBounds.maxY + value140;
  return {
    minX: minX4,
    minY: minY4,
    maxX: maxX3,
    maxY: maxY3,
    width: maxX3 - minX4,
    height: maxY3 - minY4,
  };
}
export function worldToMinimap(value141, value142, box41, value143) {
  const value144 = Math.max(box41.width, box41.height, 1),
    scale = value143 / value144,
    x15 = (value141 - box41.minX) * scale,
    y12 = (value142 - box41.minY) * scale;
  return { x: x15, y: y12, scale: scale };
}
const DEFAULT_NODE_SPATIAL_INDEX_CELL_SIZE = 240,
  EMPTY_NODE_SPATIAL_QUERY_RESULT = Object.freeze([]),
  SNAP_MATCH_EPSILON = 0.1;
function getNodeSpatialCellCoord(value145, value146) {
  return Math.floor(value145 / value146);
}
function getNodeSpatialCellKey(value147, value148) {
  return value147 + ',' + value148;
}
function normalizeNodeSpatialCellBounds(enabled6) {
  if (!enabled6) return null;
  const minX5 = Number(enabled6.minX),
    maxX4 = Number(enabled6.maxX),
    minY5 = Number(enabled6.minY),
    maxY4 = Number(enabled6.maxY);
  if (
    !Number.isFinite(minX5) ||
    !Number.isFinite(maxX4) ||
    !Number.isFinite(minY5) ||
    !Number.isFinite(maxY4)
  )
    return null;
  return { minX: minX5, maxX: maxX4, minY: minY5, maxY: maxY4 };
}
function pushNodeIdToSpatialCell(map2, value149, value150, value151) {
  const nodeSpatialCellKey = getNodeSpatialCellKey(value149, value150),
    list22 = map2.get(nodeSpatialCellKey);
  if (list22) {
    list22.push(value151);
    return;
  }
  map2.set(nodeSpatialCellKey, [value151]);
}
function normalizeNodeQueryRect(box42) {
  if (!box42 || typeof box42 !== 'object') return null;
  const x16 = Number(box42.x),
    y13 = Number(box42.y),
    width6 = Math.max(0, Number(box42.width) || 0),
    height6 = Math.max(0, Number(box42.height) || 0);
  if (!Number.isFinite(x16) || !Number.isFinite(y13)) return null;
  return { x: x16, y: y13, width: width6, height: height6 };
}
function finalizeNodeQueryRect(value152, args = {}) {
  const right2 = normalizeNodeQueryRect(value152);
  if (!right2) return null;
  return {
    ...right2,
    right: right2.x + right2.width,
    bottom: right2.y + right2.height,
    cx: right2.x + right2.width / 2,
    cy: right2.y + right2.height / 2,
    ...args,
  };
}
function defaultNodeQueryRectResolver(x17) {
  if (!x17 || typeof x17 !== 'object') return null;
  return { x: x17.x, y: x17.y, width: x17.width || 0, height: x17.height || 0 };
}
function normalizeNodeQueryOptions(ignoreGroup = false, value153 = undefined) {
  const value154 =
    ignoreGroup && typeof ignoreGroup === 'object'
      ? { ...ignoreGroup }
      : { ignoreGroup: ignoreGroup === true };
  return (
    value153 && typeof value153 === 'object' && Object.assign(value154, value153),
    (value154.ignoreGroup = value154.ignoreGroup === true),
    (value154.resolveRect =
      typeof value154.resolveRect === 'function' ? value154.resolveRect : defaultNodeQueryRectResolver),
    (value154.candidateFilter =
      typeof value154.candidateFilter === 'function' ? value154.candidateFilter : null),
    (value154.spatialIndex = value154.spatialIndex || null),
    value154
  );
}
function resolveNodeQueryRect(value155, value156, handler, value157 = null) {
  const enabled7 = String(value155?.id || value156 || '').trim();
  if (!enabled7) return null;
  const value158 = value157?.nodeRects instanceof Map ? value157.nodeRects.get(enabled7) : null;
  if (value158) return value158;
  return finalizeNodeQueryRect(handler(value155, enabled7));
}
function iterateNodeSpatialRing(value159, value160, count6, handler2) {
  if (count6 === 0) {
    handler2(value159, value160);
    return;
  }
  const value161 = value159 - count6,
    value162 = value159 + count6,
    value163 = value160 - count6,
    value164 = value160 + count6;
  for (let value165 = value161; value165 <= value162; value165 += 1) {
    (handler2(value165, value163), handler2(value165, value164));
  }
  for (let value166 = value163 + 1; value166 < value164; value166 += 1) {
    (handler2(value161, value166), handler2(value162, value166));
  }
}
function getPointToCellRectDistSq(value167, value168, value169, value170, value171) {
  const value172 = value169 * value171,
    value173 = value170 * value171,
    value174 = value172 + value171,
    value175 = value173 + value171,
    value176 = value167 < value172 ? value172 - value167 : value167 > value174 ? value167 - value174 : 0,
    value177 = value168 < value173 ? value173 - value168 : value168 > value175 ? value168 - value175 : 0;
  return value176 * value176 + value177 * value177;
}
function getNodeSpatialWorldBounds(value178) {
  const x18 = normalizeNodeSpatialCellBounds(value178?.boundsCellBounds);
  if (!x18) return null;
  const count7 = Number(value178?.cellSize);
  if (!Number.isFinite(count7) || count7 <= 0) return null;
  return {
    x: x18.minX * count7,
    y: x18.minY * count7,
    width: (x18.maxX - x18.minX + 1) * count7,
    height: (x18.maxY - x18.minY + 1) * count7,
  };
}
function getNodeSpatialStripeRect(value179, value180, value181, value182, value183 = 0) {
  const y14 = getNodeSpatialWorldBounds(value179);
  if (!y14) return null;
  const x19 = Math.min(_toFiniteNumber(value181, 0), _toFiniteNumber(value182, 0)),
    value184 = Math.max(_toFiniteNumber(value181, 0), _toFiniteNumber(value182, 0)),
    value185 = Math.max(0, _toFiniteNumber(value183, 0));
  if (value180 === 'x')
    return {
      x: x19 - value185,
      y: y14.y,
      width: Math.max(0, value184 - x19) + value185 * 2,
      height: y14.height,
    };
  if (value180 === 'y')
    return {
      x: y14.x,
      y: x19 - value185,
      width: y14.width,
      height: Math.max(0, value184 - x19) + value185 * 2,
    };
  return null;
}
function getNodeSpatialQueryNodes(value186, list23) {
  if (!Array.isArray(list23) || list23.length === 0) return [];
  const list24 = [];
  for (const value187 of list23) {
    const value188 = value186?.[value187];
    if (value188) list24.push(value188);
  }
  return list24;
}
function collectSnapSearchCandidateIds(enabled8, box43, value189) {
  if (!enabled8 || !box43) return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  const nodeSpatialStripeRect = getNodeSpatialStripeRect(
      enabled8,
      'x',
      box43.x,
      box43.x + box43.width,
      value189,
    ),
    nodeSpatialStripeRect2 = getNodeSpatialStripeRect(
      enabled8,
      'y',
      box43.y,
      box43.y + box43.height,
      value189,
    );
  if (!nodeSpatialStripeRect && !nodeSpatialStripeRect2) return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  const value190 = new Set();
  if (nodeSpatialStripeRect)
    for (const value191 of queryNodeSpatialIndexInRect(enabled8, nodeSpatialStripeRect)) {
      value190.add(value191);
    }
  if (nodeSpatialStripeRect2)
    for (const value192 of queryNodeSpatialIndexInRect(enabled8, nodeSpatialStripeRect2)) {
      value190.add(value192);
    }
  return value190.size > 0 ? Array.from(value190) : EMPTY_NODE_SPATIAL_QUERY_RESULT;
}
function collectSnapMatchNodes(value193, value194, enabled9, value195, value196) {
  if (!Number.isFinite(value196)) return [];
  if (!enabled9) return value194;
  const nodeSpatialStripeRect3 = getNodeSpatialStripeRect(
    enabled9,
    value195,
    value196,
    value196,
    SNAP_MATCH_EPSILON,
  );
  if (!nodeSpatialStripeRect3) return value194;
  return getNodeSpatialQueryNodes(value193, queryNodeSpatialIndexInRect(enabled9, nodeSpatialStripeRect3));
}
function getMinRingToCenterCellBounds(value197, value198, enabled10) {
  if (!enabled10) return 0;
  const value199 =
      value197 < enabled10.minX
        ? enabled10.minX - value197
        : value197 > enabled10.maxX
          ? value197 - enabled10.maxX
          : 0,
    value200 =
      value198 < enabled10.minY
        ? enabled10.minY - value198
        : value198 > enabled10.maxY
          ? value198 - enabled10.maxY
          : 0;
  return Math.max(value199, value200);
}
function doesRingCoverCenterCellBounds(value201, value202, value203, enabled11) {
  if (!enabled11) return true;
  return (
    value201 - value203 <= enabled11.minX &&
    value201 + value203 >= enabled11.maxX &&
    value202 - value203 <= enabled11.minY &&
    value202 + value203 >= enabled11.maxY
  );
}
function getNextRingMinCenterDistSq(enabled12, value204, value205, value206, value207, value208) {
  if (!enabled12?.centerCellBounds) return Infinity;
  let value209 = Infinity;
  return (
    iterateNodeSpatialRing(value206, value207, value208, (value210, value211) => {
      if (
        value210 < enabled12.centerCellBounds.minX ||
        value210 > enabled12.centerCellBounds.maxX ||
        value211 < enabled12.centerCellBounds.minY ||
        value211 > enabled12.centerCellBounds.maxY
      )
        return;
      const cellRectDistSq = getPointToCellRectDistSq(
        value204,
        value205,
        value210,
        value211,
        enabled12.cellSize,
      );
      if (cellRectDistSq < value209) value209 = cellRectDistSq;
    }),
    value209
  );
}
function findNearestNodeRectInSpatialIndex(enabled13, value212, value213, value214, value215 = {}) {
  if (
    !enabled13 ||
    !(enabled13.centerCells instanceof Map) ||
    !(enabled13.nodeRects instanceof Map) ||
    !enabled13.centerCellBounds
  )
    return null;
  const nodeSpatialCellCoord = getNodeSpatialCellCoord(value213, enabled13.cellSize),
    nodeSpatialCellCoord2 = getNodeSpatialCellCoord(value214, enabled13.cellSize),
    centerCellBounds = getMinRingToCenterCellBounds(
      nodeSpatialCellCoord,
      nodeSpatialCellCoord2,
      enabled13.centerCellBounds,
    ),
    value216 = value215.ignoreGroup === true,
    handler3 = typeof value215.candidateFilter === 'function' ? value215.candidateFilter : null;
  let nodeId = null,
    rect = null,
    value217 = Infinity,
    value218 = Infinity;
  for (let value219 = centerCellBounds; ; value219 += 1) {
    iterateNodeSpatialRing(nodeSpatialCellCoord, nodeSpatialCellCoord2, value219, (value220, value221) => {
      const list25 = enabled13.centerCells.get(getNodeSpatialCellKey(value220, value221));
      if (!list25 || list25.length === 0) return;
      for (const value222 of list25) {
        const enabled14 = value212?.[value222];
        if (!enabled14) continue;
        if (value216 && enabled14?.type === 'group') continue;
        if (handler3 && handler3(enabled14, value222) === false) continue;
        const enabled15 = enabled13.nodeRects.get(value222);
        if (!enabled15) continue;
        const value223 = value213 - enabled15.cx,
          value224 = value214 - enabled15.cy,
          value225 = value223 * value223 + value224 * value224;
        (value225 < value217 || (value225 === value217 && enabled15.order < value218)) &&
          ((nodeId = value222), (rect = enabled15), (value217 = value225), (value218 = enabled15.order));
      }
    });
    if (
      doesRingCoverCenterCellBounds(
        nodeSpatialCellCoord,
        nodeSpatialCellCoord2,
        value219,
        enabled13.centerCellBounds,
      )
    )
      break;
    if (rect) {
      const nextRingMinCenterDistSq = getNextRingMinCenterDistSq(
        enabled13,
        value213,
        value214,
        nodeSpatialCellCoord,
        nodeSpatialCellCoord2,
        value219 + 1,
      );
      if (value217 <= nextRingMinCenterDistSq) break;
    }
  }
  return nodeId && rect ? { nodeId: nodeId, rect: rect } : null;
}
export function createNodeSpatialIndex(value226, value227 = {}) {
  const count8 = Number(value227?.cellSize),
    cellSize = Number.isFinite(count8) && count8 > 0 ? count8 : DEFAULT_NODE_SPATIAL_INDEX_CELL_SIZE,
    handler4 =
      typeof value227?.resolveRect === 'function' ? value227.resolveRect : defaultNodeQueryRectResolver,
    boundsCells = new Map(),
    centerCells = new Map(),
    nodeRects = new Map();
  let minX6 = Infinity,
    maxX5 = -Infinity,
    minY6 = Infinity,
    maxY5 = -Infinity,
    minX7 = Infinity,
    maxX6 = -Infinity,
    minY7 = Infinity,
    maxY6 = -Infinity,
    order = 0;
  for (const [value228, value229] of Object.entries(value226 || {})) {
    const nodeId2 = String(value229?.id || value228 || '').trim();
    if (!nodeId2) continue;
    const args2 = finalizeNodeQueryRect(handler4(value229, nodeId2), { order: order });
    if (!args2) continue;
    const box44 = { nodeId: nodeId2, ...args2 };
    (nodeRects.set(nodeId2, box44), (order += 1));
    const nodeSpatialCellCoord3 = getNodeSpatialCellCoord(box44.x, cellSize),
      nodeSpatialCellCoord4 = getNodeSpatialCellCoord(box44.right, cellSize),
      nodeSpatialCellCoord5 = getNodeSpatialCellCoord(box44.y, cellSize),
      nodeSpatialCellCoord6 = getNodeSpatialCellCoord(box44.bottom, cellSize);
    if (nodeSpatialCellCoord3 < minX6) minX6 = nodeSpatialCellCoord3;
    if (nodeSpatialCellCoord4 > maxX5) maxX5 = nodeSpatialCellCoord4;
    if (nodeSpatialCellCoord5 < minY6) minY6 = nodeSpatialCellCoord5;
    if (nodeSpatialCellCoord6 > maxY5) maxY5 = nodeSpatialCellCoord6;
    for (let value230 = nodeSpatialCellCoord3; value230 <= nodeSpatialCellCoord4; value230 += 1) {
      for (let value231 = nodeSpatialCellCoord5; value231 <= nodeSpatialCellCoord6; value231 += 1) {
        pushNodeIdToSpatialCell(boundsCells, value230, value231, nodeId2);
      }
    }
    const nodeSpatialCellCoord7 = getNodeSpatialCellCoord(box44.cx, cellSize),
      nodeSpatialCellCoord8 = getNodeSpatialCellCoord(box44.cy, cellSize);
    pushNodeIdToSpatialCell(centerCells, nodeSpatialCellCoord7, nodeSpatialCellCoord8, nodeId2);
    if (nodeSpatialCellCoord7 < minX7) minX7 = nodeSpatialCellCoord7;
    if (nodeSpatialCellCoord7 > maxX6) maxX6 = nodeSpatialCellCoord7;
    if (nodeSpatialCellCoord8 < minY7) minY7 = nodeSpatialCellCoord8;
    if (nodeSpatialCellCoord8 > maxY6) maxY6 = nodeSpatialCellCoord8;
  }
  const centerCellBounds2 =
      minX7 === Infinity ? null : { minX: minX7, maxX: maxX6, minY: minY7, maxY: maxY6 },
    boundsCellBounds = minX6 === Infinity ? null : { minX: minX6, maxX: maxX5, minY: minY6, maxY: maxY5 };
  return {
    cellSize: cellSize,
    boundsCells: boundsCells,
    centerCells: centerCells,
    nodeRects: nodeRects,
    boundsCellBounds: boundsCellBounds,
    centerCellBounds: centerCellBounds2,
    nodeCount: nodeRects.size,
  };
}
export function queryNodeSpatialIndexAtWorldPoint(enabled16, value232, value233) {
  if (
    !enabled16 ||
    !(enabled16.boundsCells instanceof Map) ||
    !Number.isFinite(value232) ||
    !Number.isFinite(value233) ||
    !Number.isFinite(enabled16.cellSize) ||
    enabled16.cellSize <= 0
  )
    return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  const nodeSpatialCellCoord9 = getNodeSpatialCellCoord(value232, enabled16.cellSize),
    nodeSpatialCellCoord10 = getNodeSpatialCellCoord(value233, enabled16.cellSize);
  return (
    enabled16.boundsCells.get(getNodeSpatialCellKey(nodeSpatialCellCoord9, nodeSpatialCellCoord10)) ||
    EMPTY_NODE_SPATIAL_QUERY_RESULT
  );
}
export function queryNodeSpatialIndexInRect(enabled17, value234) {
  const box45 = normalizeNodeQueryRect(value234);
  if (
    !box45 ||
    !enabled17 ||
    !(enabled17.boundsCells instanceof Map) ||
    !(enabled17.nodeRects instanceof Map) ||
    !Number.isFinite(enabled17.cellSize) ||
    enabled17.cellSize <= 0
  )
    return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  const nodeSpatialCellCoord11 = getNodeSpatialCellCoord(box45.x, enabled17.cellSize),
    nodeSpatialCellCoord12 = getNodeSpatialCellCoord(box45.x + box45.width, enabled17.cellSize),
    nodeSpatialCellCoord13 = getNodeSpatialCellCoord(box45.y, enabled17.cellSize),
    nodeSpatialCellCoord14 = getNodeSpatialCellCoord(box45.y + box45.height, enabled17.cellSize),
    value235 = new Set();
  for (let value236 = nodeSpatialCellCoord11; value236 <= nodeSpatialCellCoord12; value236 += 1) {
    for (let value237 = nodeSpatialCellCoord13; value237 <= nodeSpatialCellCoord14; value237 += 1) {
      const list26 = enabled17.boundsCells.get(getNodeSpatialCellKey(value236, value237));
      if (!list26 || list26.length === 0) continue;
      for (const value238 of list26) value235.add(value238);
    }
  }
  if (value235.size === 0) return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  return Array.from(value235).sort((item6, value239) => {
    const value240 = enabled17.nodeRects.get(item6)?.order ?? Infinity,
      value241 = enabled17.nodeRects.get(value239)?.order ?? Infinity;
    return value240 - value241;
  });
}
export function getNodeScreenRect(box46, value242) {
  const { x: x20, y: y15, zoom: zoom4 } = value242,
    left2 = box46.x * zoom4 + x20,
    top2 = box46.y * zoom4 + y15,
    width7 = (box46.width || 0) * zoom4,
    height7 = (box46.height || 0) * zoom4;
  return {
    left: left2,
    top: top2,
    right: left2 + width7,
    bottom: top2 + height7,
    cx: left2 + width7 / 2,
    cy: top2 + height7 / 2,
    width: width7,
    height: height7,
  };
}
export function findClosestNode(
  value243,
  value244,
  value245,
  value246,
  value247 = false,
  value248 = undefined,
) {
  const { x: x21, y: y16 } = screenToWorld(value243, value244, value246),
    nodeQueryOptions = normalizeNodeQueryOptions(value247, value248),
    value249 = nodeQueryOptions.spatialIndex
      ? queryNodeSpatialIndexAtWorldPoint(nodeQueryOptions.spatialIndex, x21, y16)
      : null;
  if (value249) {
    for (const nodeId3 of value249) {
      const enabled18 = value245?.[nodeId3];
      if (!enabled18) continue;
      if (nodeQueryOptions.ignoreGroup && enabled18?.type === 'group') continue;
      if (nodeQueryOptions.candidateFilter && nodeQueryOptions.candidateFilter(enabled18, nodeId3) === false)
        continue;
      const box47 = resolveNodeQueryRect(
        enabled18,
        nodeId3,
        nodeQueryOptions.resolveRect,
        nodeQueryOptions.spatialIndex,
      );
      if (!box47) continue;
      if (!isPointInRect(x21, y16, box47.x, box47.y, box47.width, box47.height)) continue;
      return { nodeId: nodeId3, screenRect: getNodeScreenRect(box47, value246), isInside: true };
    }
    const nodeId4 = findNearestNodeRectInSpatialIndex(
      nodeQueryOptions.spatialIndex,
      value245,
      x21,
      y16,
      nodeQueryOptions,
    );
    return nodeId4
      ? {
          nodeId: nodeId4.nodeId,
          screenRect: getNodeScreenRect(nodeId4.rect, value246),
          isInside: false,
        }
      : null;
  }
  let nodeId5 = null,
    value250 = null,
    value251 = Infinity;
  for (const [value252, value253] of Object.entries(value245 || {})) {
    const nodeId6 = String(value253?.id || value252 || '').trim();
    if (!nodeId6) continue;
    if (nodeQueryOptions.ignoreGroup && value253?.type === 'group') continue;
    if (nodeQueryOptions.candidateFilter && nodeQueryOptions.candidateFilter(value253, nodeId6) === false)
      continue;
    const box48 = resolveNodeQueryRect(
      value253,
      nodeId6,
      nodeQueryOptions.resolveRect,
      nodeQueryOptions.spatialIndex,
    );
    if (!box48) continue;
    const isPointInRect2 = isPointInRect(x21, y16, box48.x, box48.y, box48.width, box48.height);
    if (isPointInRect2)
      return { nodeId: nodeId6, screenRect: getNodeScreenRect(box48, value246), isInside: true };
    const value254 = x21 - box48.cx,
      value255 = y16 - box48.cy,
      value256 = value254 * value254 + value255 * value255;
    value256 < value251 && ((value251 = value256), (nodeId5 = nodeId6), (value250 = box48));
  }
  return nodeId5
    ? { nodeId: nodeId5, screenRect: getNodeScreenRect(value250, value246), isInside: false }
    : null;
}
export function hitTestNode(
  value257,
  value258,
  value259,
  value260,
  value261,
  value262 = false,
  value263 = undefined,
) {
  const { x: x22, y: y17 } = screenToWorld(value257, value258, value260),
    nodeQueryOptions2 = normalizeNodeQueryOptions(value262, value263),
    map3 = new Set(),
    value264 = String(value261 || '').trim();
  if (value264) map3.add(value264);
  if (
    nodeQueryOptions2.excludeIds &&
    typeof nodeQueryOptions2.excludeIds !== 'string' &&
    typeof nodeQueryOptions2.excludeIds[Symbol.iterator] === 'function'
  )
    for (const value265 of nodeQueryOptions2.excludeIds) {
      const value266 = String(value265 || '').trim();
      if (value266) map3.add(value266);
    }
  let value267 = null,
    value268 = null;
  const value269 = nodeQueryOptions2.spatialIndex
      ? queryNodeSpatialIndexAtWorldPoint(nodeQueryOptions2.spatialIndex, x22, y17)
      : null,
    handler5 = (value270, value271) => {
      if (map3.has(value270)) return;
      if (nodeQueryOptions2.ignoreGroup && value271?.type === 'group') return;
      if (
        nodeQueryOptions2.candidateFilter &&
        nodeQueryOptions2.candidateFilter(value271, value270) === false
      )
        return;
      const box49 = resolveNodeQueryRect(
        value271,
        value270,
        nodeQueryOptions2.resolveRect,
        nodeQueryOptions2.spatialIndex,
      );
      if (!box49) return;
      if (!isPointInRect(x22, y17, box49.x, box49.y, box49.width, box49.height)) return;
      value271?.type === 'group' ? (value267 = value270) : (value268 = value270);
    };
  if (value269) {
    for (const value272 of value269) {
      const enabled19 = value259?.[value272];
      if (!enabled19) continue;
      handler5(value272, enabled19);
    }
    return value268 || value267 || null;
  }
  for (const [value273, value274] of Object.entries(value259 || {})) {
    const enabled20 = String(value274?.id || value273 || '').trim();
    if (!enabled20) continue;
    handler5(enabled20, value274);
  }
  return value268 || value267 || null;
}
export function checkLineIntersection(
  value275,
  value276,
  value277,
  value278,
  value279,
  value280,
  value281,
  value282,
) {
  let value283 = value277 - value275,
    value284 = value278 - value276,
    value285 = value281 - value279,
    value286 = value282 - value280,
    count9 = -value285 * value284 + value283 * value286;
  if (count9 === 0) return false;
  let count10 = (-value284 * (value275 - value279) + value283 * (value276 - value280)) / count9,
    count11 = (value285 * (value276 - value280) - value286 * (value275 - value279)) / count9;
  return count10 >= 0 && count10 <= 1 && count11 >= 0 && count11 <= 1;
}
export function checkBBoxIntersection(
  value287,
  value288,
  value289,
  value290,
  value291,
  value292,
  value293,
  value294,
) {
  const value295 = Math.min(value287, value289),
    value296 = Math.max(value287, value289),
    value297 = Math.min(value288, value290),
    value298 = Math.max(value288, value290),
    value299 = Math.min(value291, value293),
    value300 = Math.max(value291, value293),
    value301 = Math.min(value292, value294),
    value302 = Math.max(value292, value294);
  return !(value296 < value299 || value300 < value295 || value298 < value301 || value302 < value297);
}
export * from './panoramaSceneMath.js';
export { resolveNormalizedMediaCrop, normalizedMediaDragRect } from './mediaSelectionMath.js';
export {
  getImageRotationLayout,
  inverseImageRotationPoint,
  normalizeRotationDegrees,
} from './rotationMath.js';
export { projectPointToViewportEdge, spreadViewportBoundaryPoint } from './viewportBoundaryMath.js';

export function getViewportScreenBounds(options2 = {}, value303 = 0x0, value304 = 0x0) {
  const box50 = getViewportScreenOrigin(options2),
    value305 = Number['isFinite'](Number(value303)) ? Number(value303) : 0x0,
    value306 = Number['isFinite'](Number(value304)) ? Number(value304) : 0x0,
    value307 = Math['max'](0x0, value305 - box50['x']),
    value308 = Math['max'](0x0, value306 - box50['y']);
  return {
    left: box50['x'],
    top: box50['y'],
    right: box50['x'] + value307,
    bottom: box50['y'] + value308,
    width: value307,
    height: value308,
    centerX: box50['x'] + value307 / 0x2,
    centerY: box50['y'] + value308 / 0x2,
  };
}

export function getViewportScreenCenter(options3 = {}, value309 = 0x0, value310 = 0x0) {
  const viewportScreenBounds = getViewportScreenBounds(options3, value309, value310);
  return { x: viewportScreenBounds['centerX'], y: viewportScreenBounds['centerY'] };
}

function _medianLayoutMetric(value311, value312, value313 = 0x1) {
  const list27 = (Array['isArray'](value311) ? value311 : [])
    ['map']((value314) => Math['max'](0x0, _toFiniteNumber(value314?.[value312], 0x0)))
    ['filter']((count12) => count12 > 0x0)
    ['sort']((value315, value316) => value315 - value316);
  if (list27['length'] === 0x0) return value313;
  const value317 = Math['floor'](list27['length'] / 0x2);
  if (list27['length'] % 0x2 === 0x1) return list27[value317];
  return (list27[value317 - 0x1] + list27[value317]) / 0x2;
}

function _sortGridLayoutItems(value318) {
  const _sortLayoutItems2 = _sortLayoutItems(value318);
  if (_sortLayoutItems2['length'] <= 0x1) return _sortLayoutItems2;
  const value319 = Math['max'](0x8, _medianLayoutMetric(_sortLayoutItems2, 'height', 0x28) * 0.35),
    value320 = [];
  for (const box51 of _sortLayoutItems2) {
    const _toFiniteNumber36 = _toFiniteNumber(box51?.['top'] ?? box51?.['y'], 0x0),
      value321 = Math['max'](0x0, _toFiniteNumber(box51?.['height'], 0x0)),
      _toFiniteNumber37 = _toFiniteNumber(box51?.['bottom'], _toFiniteNumber36 + value321),
      _toFiniteNumber38 = _toFiniteNumber(box51?.['cy'], _toFiniteNumber36 + value321 / 0x2);
    let box52 = null,
      value322 = Infinity;
    for (const box53 of value320) {
      const value323 =
          Math['min'](box53['bottom'], _toFiniteNumber37) - Math['max'](box53['top'], _toFiniteNumber36),
        value324 = Math['max'](0x1, Math['min'](box53['bottom'] - box53['top'], value321 || 0x1)),
        value325 = Math['abs'](_toFiniteNumber38 - box53['centerY']),
        value326 = value323 >= value324 * 0.25 || value325 <= value319;
      value326 && value325 < value322 && ((box52 = box53), (value322 = value325));
    }
    if (!box52) {
      value320['push']({
        top: _toFiniteNumber36,
        bottom: _toFiniteNumber37,
        centerY: _toFiniteNumber38,
        centerSum: _toFiniteNumber38,
        items: [box51],
      });
      continue;
    }
    (box52['items']['push'](box51),
      (box52['top'] = Math['min'](box52['top'], _toFiniteNumber36)),
      (box52['bottom'] = Math['max'](box52['bottom'], _toFiniteNumber37)),
      (box52['centerSum'] += _toFiniteNumber38),
      (box52['centerY'] = box52['centerSum'] / box52['items']['length']));
  }
  return (
    value320['sort']((value327, box54) => value327['top'] - box54['top']),
    value320['flatMap']((value328) =>
      value328['items']['sort']((box55, box56) => {
        const _toFiniteNumber39 = _toFiniteNumber(box55?.['left'] ?? box55?.['x'], 0x0),
          _toFiniteNumber40 = _toFiniteNumber(box56?.['left'] ?? box56?.['x'], 0x0);
        if (_toFiniteNumber39 !== _toFiniteNumber40) return _toFiniteNumber39 - _toFiniteNumber40;
        return String(box55?.['id'] || '')['localeCompare'](String(box56?.['id'] || ''));
      }),
    )
  );
}

function _resolveGridRelationLayout(value329, value330) {
  const _sortGridLayoutItems2 = _sortGridLayoutItems(value329),
    enabled21 = new Set(
      _sortGridLayoutItems2['map']((value331) => String(value331?.['id'] || '')['trim']())['filter'](Boolean),
    ),
    value332 = [],
    value333 = new Set();
  for (const value334 of Array['isArray'](value330) ? value330 : []) {
    const enabled22 = String(value334?.['sourceId'] || '')['trim'](),
      enabled23 = String(value334?.['targetId'] || '')['trim']();
    if (
      !enabled22 ||
      !enabled23 ||
      enabled22 === enabled23 ||
      !enabled21['has'](enabled22) ||
      !enabled21['has'](enabled23)
    )
      continue;
    const value335 = enabled22 + '\x00' + enabled23;
    if (value333['has'](value335)) continue;
    (value333['add'](value335), value332['push']({ sourceId: enabled22, targetId: enabled23 }));
  }
  if (value332['length'] === 0x0) return null;
  const map4 = new Map(
      _sortGridLayoutItems2['map']((value336, value337) => [String(value336['id']), value337]),
    ),
    args3 = new Set(),
    enabled24 = new Map(),
    map5 = new Map(),
    map6 = new Map();
  for (const { sourceId: sourceId, targetId: targetId } of value332) {
    (args3['add'](sourceId), args3['add'](targetId));
    if (!enabled24['has'](sourceId)) enabled24['set'](sourceId, []);
    (enabled24['get'](sourceId)['push'](targetId),
      map5['set'](targetId, (map5['get'](targetId) || 0x0) + 0x1));
    if (!map5['has'](sourceId)) map5['set'](sourceId, 0x0);
    if (!map6['has'](sourceId)) map6['set'](sourceId, 0x0);
    if (!map6['has'](targetId)) map6['set'](targetId, 0x0);
  }
  const value338 = (value339, value340) =>
    (map4['get'](value339) ?? Number['MAX_SAFE_INTEGER']) -
      (map4['get'](value340) ?? Number['MAX_SAFE_INTEGER']) || value339['localeCompare'](value340);
  let value341 = [...args3]['filter']((value342) => (map5['get'](value342) || 0x0) === 0x0)['sort'](value338);
  const enabled25 = new Set();
  while (value341['length'] > 0x0) {
    const value343 = value341;
    value341 = [];
    for (const value344 of value343) {
      enabled25['add'](value344);
      const value345 = map6['get'](value344) || 0x0;
      for (const value346 of enabled24['get'](value344) || []) {
        map6['set'](value346, Math['max'](map6['get'](value346) || 0x0, value345 + 0x1));
        const count13 = (map5['get'](value346) || 0x0) - 0x1;
        map5['set'](value346, count13);
        if (count13 === 0x0) value341['push'](value346);
      }
    }
    value341['sort'](value338);
  }
  const value347 = [...args3]['filter']((value348) => !enabled25['has'](value348));
  if (value347['length'] > 0x0) {
    const value349 = value347['reduce'](
      (value350, value351) => Math['max'](value350, map6['get'](value351) || 0x0),
      0x0,
    );
    for (const value352 of value347) map6['set'](value352, value349);
  }
  const value353 = [...args3]['reduce'](
    (value354, value355) => Math['max'](value354, (map6['get'](value355) || 0x0) + 0x1),
    0x1,
  );
  return { connectedIds: args3, layerById: map6, layerCount: value353, relations: value332 };
}

function _buildGraphAwareGridPlacements(list28, value356, enabled26) {
  const list29 = Array['from']({ length: value356 }, () => []),
    map7 = new Map();
  list28['forEach']((value357, value358) => {
    const value359 = String(value357['id']);
    let value360 = enabled26['connectedIds']['has'](value359)
      ? Math['min'](value356 - 0x1, enabled26['layerById']['get'](value359) || 0x0)
      : value358 % value356;
    if (!enabled26['connectedIds']['has'](value359)) {
      const value361 = Math['min'](...list29['map']((list30) => list30['length']));
      for (let value362 = 0x0; value362 < value356; value362 += 0x1) {
        const value363 = (value360 + value362) % value356;
        if (list29[value363]['length'] === value361) {
          value360 = value363;
          break;
        }
      }
    }
    (list29[value360]['push'](value357), map7['set'](value359, value360));
  });
  const map8 = new Map(list28['map']((value364) => [String(value364['id']), value364])),
    map9 = new Map(list28['map']((value365, value366) => [String(value365['id']), value366])),
    map10 = new Map();
  for (const { sourceId: sourceId2, targetId: targetId2 } of enabled26['relations']) {
    if (map7['get'](sourceId2) === map7['get'](targetId2)) continue;
    (!map10['has'](sourceId2) && map10['set'](sourceId2, []),
      !map10['has'](targetId2) && map10['set'](targetId2, []),
      map10['get'](sourceId2)['push'](targetId2),
      map10['get'](targetId2)['push'](sourceId2));
  }
  const map11 = new Map(),
    handler6 = (value367) => {
      list29[value367]['forEach']((value368, value369) => {
        map11['set'](String(value368['id']), value369);
      });
    };
  list29['forEach']((value370, value371) => handler6(value371));
  const run = (value372, value373, count14) => {
      const list31 = (map10['get'](value372) || [])
        ['filter']((value374) => {
          const value375 = map7['get'](value374);
          return count14 > 0x0 ? value375 < value373 : value375 > value373;
        })
        ['map']((value376) => map11['get'](value376))
        ['filter'](Number['isFinite'])
        ['sort']((value377, value378) => value377 - value378);
      if (list31['length'] === 0x0) return null;
      const value379 = Math['floor'](list31['length'] / 0x2);
      return list31['length'] % 0x2 === 0x1
        ? list31[value379]
        : (list31[value379 - 0x1] + list31[value379]) / 0x2;
    },
    handler7 = (count15) => {
      const value380 = count15 > 0x0 ? 0x1 : value356 - 0x2,
        value381 = count15 > 0x0 ? value356 : -0x1;
      for (let value382 = value380; value382 !== value381; value382 += count15) {
        const map12 = new Map(
            list29[value382]['map']((value383, value384) => [String(value383['id']), value384]),
          ),
          value385 = new Map(
            list29[value382]['map']((value386) => {
              const value387 = String(value386['id']);
              return [value387, run(value387, value382, count15)];
            }),
          );
        (list29[value382]['sort']((value388, value389) => {
          const value390 = String(value388['id']),
            value391 = String(value389['id']),
            value392 = value385['get'](value390),
            value393 = value385['get'](value391),
            value394 = value392 ?? map12['get'](value390) ?? 0x0,
            value395 = value393 ?? map12['get'](value391) ?? 0x0;
          if (value394 !== value395) return value394 - value395;
          return (
            (map12['get'](value390) ?? 0x0) - (map12['get'](value391) ?? 0x0) ||
            (map9['get'](value390) ?? Number['MAX_SAFE_INTEGER']) -
              (map9['get'](value391) ?? Number['MAX_SAFE_INTEGER']) ||
            value390['localeCompare'](value391)
          );
        }),
          handler6(value382));
      }
    };
  for (let count16 = 0x0; count16 < 0x2; count16 += 0x1) {
    (handler7(0x1), handler7(-0x1));
  }
  const value396 = enabled26['relations']['filter'](
      ({ sourceId: sourceId3, targetId: targetId3 }) => map7['get'](sourceId3) !== map7['get'](targetId3),
    ),
    map13 = new Map(),
    value397 = new Map();
  for (const { sourceId: sourceId4, targetId: targetId4 } of value396) {
    (map13['set'](sourceId4, (map13['get'](sourceId4) || 0x0) + 0x1),
      value397['set'](targetId4, (value397['get'](targetId4) || 0x0) + 0x1));
  }
  const map14 = new Map(list28['map']((value398) => [String(value398['id']), String(value398['id'])])),
    map15 = new Map(
      list28['map']((value399) => {
        const value400 = String(value399['id']);
        return [value400, new Set([map7['get'](value400)])];
      }),
    ),
    handler8 = (value401) => {
      let value402 = value401;
      while (map14['get'](value402) !== value402) value402 = map14['get'](value402);
      let value403 = value401;
      while (map14['get'](value403) !== value402) {
        const value404 = map14['get'](value403);
        (map14['set'](value403, value402), (value403 = value404));
      }
      return value402;
    },
    handler9 = (value405, value406) => {
      const value407 = handler8(value405),
        value408 = handler8(value406);
      if (value407 === value408) return !![];
      const args4 = map15['get'](value407) || new Set(),
        map16 = map15['get'](value408) || new Set();
      if ([...args4]['some']((value409) => map16['has'](value409))) return ![];
      const value410 =
          (map9['get'](value407) ?? Number['MAX_SAFE_INTEGER']) <=
          (map9['get'](value408) ?? Number['MAX_SAFE_INTEGER']),
        value411 = value410 ? value407 : value408,
        value412 = value410 ? value408 : value407;
      return (
        map14['set'](value412, value411),
        map15['set'](value411, new Set([...args4, ...map16])),
        map15['delete'](value412),
        !![]
      );
    };
  value396['sort']((value413, value414) => {
    const value415 =
        map13['get'](value413['sourceId']) === 0x1 && value397['get'](value413['targetId']) === 0x1,
      value416 = map13['get'](value414['sourceId']) === 0x1 && value397['get'](value414['targetId']) === 0x1;
    if (value415 !== value416) return value415 ? -0x1 : 0x1;
    const value417 =
        map13['get'](value413['sourceId']) === 0x1 || value397['get'](value413['targetId']) === 0x1,
      value418 = map13['get'](value414['sourceId']) === 0x1 || value397['get'](value414['targetId']) === 0x1;
    if (value417 !== value418) return value417 ? -0x1 : 0x1;
    const value419 = Math['abs'](map7['get'](value413['sourceId']) - map7['get'](value413['targetId'])),
      value420 = Math['abs'](map7['get'](value414['sourceId']) - map7['get'](value414['targetId']));
    if (value419 !== value420) return value419 - value420;
    const value421 = Math['abs'](
        (map11['get'](value413['sourceId']) || 0x0) - (map11['get'](value413['targetId']) || 0x0),
      ),
      value422 = Math['abs'](
        (map11['get'](value414['sourceId']) || 0x0) - (map11['get'](value414['targetId']) || 0x0),
      );
    if (value421 !== value422) return value421 - value422;
    const value423 = map8['get'](value413['sourceId']),
      value424 = map8['get'](value413['targetId']),
      value425 = map8['get'](value414['sourceId']),
      value426 = map8['get'](value414['targetId']),
      value427 = Math['abs']((value423?.['cy'] || 0x0) - (value424?.['cy'] || 0x0)),
      value428 = Math['abs']((value425?.['cy'] || 0x0) - (value426?.['cy'] || 0x0));
    if (value427 !== value428) return value427 - value428;
    const count17 = (map9['get'](value413['sourceId']) || 0x0) - (map9['get'](value414['sourceId']) || 0x0);
    if (count17 !== 0x0) return count17;
    return (map9['get'](value413['targetId']) || 0x0) - (map9['get'](value414['targetId']) || 0x0);
  })['forEach'](({ sourceId: sourceId5, targetId: targetId5 }) => handler9(sourceId5, targetId5));
  const args5 = new Map();
  list28['forEach']((value429, value430) => {
    const value431 = String(value429['id']),
      value432 = handler8(value431);
    !args5['has'](value432) && args5['set'](value432, { firstIndex: value430, items: [] });
    const value433 = args5['get'](value432);
    ((value433['firstIndex'] = Math['min'](value433['firstIndex'], value430)),
      value433['items']['push'](value429));
  });
  const value434 = [...args5['values']()]['sort'](
    (value435, value436) => value435['firstIndex'] - value436['firstIndex'],
  );
  return {
    placements: value434['flatMap']((value437, value438) =>
      value437['items']['map']((value439) => ({
        item: value439,
        col: map7['get'](String(value439['id'])),
        row: value438,
      })),
    ),
    rowCount: value434['length'],
  };
}

export function resolveArrangeGridColumns(list32, value440 = {}) {
  const list33 = Array['isArray'](list32) ? list32['filter'](Boolean) : [];
  if (list33['length'] <= 0x1) return Math['max'](0x1, list33['length']);
  const count18 = Number(value440['columns']);
  if (Number['isFinite'](count18) && count18 > 0x0) return Math['max'](0x1, Math['trunc'](count18));
  const selectionBounds3 = computeSelectionBounds(list33),
    value441 = Math['max'](0x0, _toFiniteNumber(value440['gapX'] ?? value440['gap'], 0x28)),
    value442 = Math['max'](0x0, _toFiniteNumber(value440['gapY'] ?? value440['gap'], 0x28)),
    _medianLayoutMetric2 = _medianLayoutMetric(list33, 'width', 0x1),
    _medianLayoutMetric3 = _medianLayoutMetric(list33, 'height', 0x1),
    count19 = Number(value440['targetAspect']),
    value443 =
      selectionBounds3 && selectionBounds3['height'] > 0x0
        ? selectionBounds3['width'] / selectionBounds3['height']
        : 0x1,
    value444 = Math['max'](
      0.75,
      Math['min'](0x10 / 0x9, Number['isFinite'](count19) && count19 > 0x0 ? count19 : value443),
    ),
    count20 = Number(value440['maxColumns']),
    value445 = Math['min'](
      list33['length'],
      Number['isFinite'](count20) && count20 > 0x0 ? Math['max'](0x2, Math['trunc'](count20)) : 0x6,
    );
  let value446 = 0x2,
    value447 = Infinity;
  for (let value448 = 0x2; value448 <= value445; value448 += 0x1) {
    const value449 = Math['ceil'](list33['length'] / value448),
      value450 = value448 * _medianLayoutMetric2 + (value448 - 0x1) * value441,
      value451 = value449 * _medianLayoutMetric3 + (value449 - 0x1) * value442,
      value452 = value450 / Math['max'](0x1, value451),
      value453 = Math['abs'](Math['log'](value452 / value444)),
      value454 = (value448 * value449 - list33['length']) / list33['length'],
      value455 = value453 + value454 * 0.9;
    value455 < value447 - 1e-9 && ((value447 = value455), (value446 = value448));
  }
  const _resolveGridRelationLayout2 = _resolveGridRelationLayout(list33, value440['relations']);
  return (
    _resolveGridRelationLayout2 &&
      (value446 = Math['max'](value446, Math['min'](value445, _resolveGridRelationLayout2['layerCount']))),
    value446
  );
}

function queryNodeSpatialCells(value456, value457, value458, value459, value460) {
  const value461 = new Set(),
    enabled27 =
      (value458 - value457 + 0x1) * (value460 - value459 + 0x1) > Math['max'](0x40, value456['nodeCount']),
    value462 = enabled27 ? value456['nodeRects']['keys']() : value456['spanningIds'] || [];
  for (const value463 of value462) {
    const box57 = value456['nodeRects']['get'](value463),
      value464 = value456['cellSize'];
    if (
      Math['floor'](box57['x'] / value464) <= value458 &&
      Math['floor'](box57['right'] / value464) >= value457 &&
      Math['floor'](box57['y'] / value464) <= value460 &&
      Math['floor'](box57['bottom'] / value464) >= value459
    )
      value461['add'](value463);
  }
  if (!enabled27)
    for (let value465 = value457; value465 <= value458; value465 += 0x1) {
      for (let value466 = value459; value466 <= value460; value466 += 0x1) {
        const list34 = value456['boundsCells']['get'](getNodeSpatialCellKey(value465, value466));
        if (!list34 || list34['length'] === 0x0) continue;
        for (const value467 of list34) value461['add'](value467);
      }
    }
  if (value461['size'] === 0x0) return EMPTY_NODE_SPATIAL_QUERY_RESULT;
  return Array['from'](value461)['sort']((value468, value469) => {
    const value470 = value456['nodeRects']['get'](value468)?.['order'] ?? Infinity,
      value471 = value456['nodeRects']['get'](value469)?.['order'] ?? Infinity;
    return value470 - value471;
  });
}
export { getRotatedSize, rotatePointAroundCenter } from './rotationMath.js';
