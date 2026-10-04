import { findAvailablePosition } from '../core/math.js';
function toFiniteNumber(value, item) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function clampPositiveInteger(index, result) {
  const count = Math.trunc(Number(index));
  return Number.isFinite(count) && count > 0 ? count : result;
}
function normalizeSpawnDirection(data) {
  if (data === 'down' || data === 'left') return data;
  return 'right';
}
export function getNodeSpawnPrefs() {
  const spacing = globalThis.window || {};
  return {
    spacing: spacing.v2NodeSpacing ?? 120,
    direction: spacing.v2NodeDirection ?? 'right',
    avoidOverlap: spacing.v2NodeAvoidOverlap ?? true,
  };
}
export function calcSpawnStartFromAnchor(box, options, target) {
  const startX = box?.x || 0,
    startY = box?.y || 0,
    source = box?.width || 0x12c,
    next = box?.height || 0x12c;
  return {
    startX: startX + (target === 'right' ? source + options : 0),
    startY: startY + (target === 'down' ? next + options : 0),
  };
}
export function calcSafeSpawnPosNearNode(current, box2, entry, record) {
  const { spacing: spacing2, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
    spawnDirection = normalizeSpawnDirection(direction),
    payload = box2?.x || 0,
    handle = box2?.y || 0,
    state = box2?.width || 0x12c,
    config = box2?.height || 0x12c,
    scope = Number(entry) || 0x12c,
    input = Number(record) || 0x12c,
    x =
      spawnDirection === 'left'
        ? payload - spacing2 - scope
        : payload + (spawnDirection === 'right' ? state + spacing2 : 0),
    y = handle + (spawnDirection === 'down' ? config + spacing2 : 0);
  if (!avoidOverlap) return { x: x, y: y };
  return findAvailablePosition(current, x, y, scope, input, spacing2, spawnDirection);
}
export function createBatchSpawnLayoutNearNode({
  nodes: nodes = {},
  anchorNode: anchorNode,
  itemCount: itemCount,
  itemWidth: itemWidth,
  itemHeight: itemHeight,
  maxPerLine: maxPerLine = 5,
  padding: padding = 0,
  titleHeight: titleHeight = 0,
  itemGap: itemGap,
} = {}) {
  const nodeSpawnPrefs = getNodeSpawnPrefs(),
    spacing3 = Math.max(0, toFiniteNumber(nodeSpawnPrefs.spacing, 120)),
    direction2 = normalizeSpawnDirection(nodeSpawnPrefs.direction),
    output = nodeSpawnPrefs.avoidOverlap !== false,
    clampPositiveInteger2 = clampPositiveInteger(itemCount, 1),
    value2 = Math.max(1, toFiniteNumber(itemWidth, 0x12c)),
    value3 = Math.max(1, toFiniteNumber(itemHeight, 0x12c)),
    itemGap2 = Math.max(0, toFiniteNumber(itemGap, spacing3)),
    value4 = Math.max(0, toFiniteNumber(padding, 0)),
    value5 = Math.max(0, toFiniteNumber(titleHeight, 0)),
    value6 = Math.min(
      clampPositiveInteger(maxPerLine, 5),
      Math.max(1, Math.ceil(Math.sqrt(clampPositiveInteger2))),
    ),
    columns = direction2 === 'down' ? Math.max(1, Math.ceil(clampPositiveInteger2 / value6)) : value6,
    rows = direction2 === 'down' ? value6 : Math.max(1, Math.ceil(clampPositiveInteger2 / value6)),
    groupWidth = columns * value2 + (columns - 1) * itemGap2 + value4 * 2,
    groupHeight = rows * value3 + (rows - 1) * itemGap2 + value4 * 2 + value5,
    toFiniteNumber2 = toFiniteNumber(anchorNode?.x, 0),
    toFiniteNumber3 = toFiniteNumber(anchorNode?.y, 0),
    toFiniteNumber4 = toFiniteNumber(anchorNode?.width, 0x12c),
    toFiniteNumber5 = toFiniteNumber(anchorNode?.height, 0x12c);
  let groupX = toFiniteNumber2 + toFiniteNumber4 + spacing3,
    groupY = toFiniteNumber3;
  if (direction2 === 'down')
    ((groupX = toFiniteNumber2), (groupY = toFiniteNumber3 + toFiniteNumber5 + spacing3));
  else
    direction2 === 'left' && ((groupX = toFiniteNumber2 - spacing3 - groupWidth), (groupY = toFiniteNumber3));
  if (output) {
    const box3 = findAvailablePosition(nodes, groupX, groupY, groupWidth, groupHeight, spacing3, direction2);
    ((groupX = box3.x), (groupY = box3.y));
  }
  const x2 = groupX + value4,
    y2 = groupY + value4 + value5,
    getItemPosition = (value7) => {
      const value8 = Math.max(0, Math.trunc(Number(value7)) || 0),
        col = direction2 === 'down' ? Math.floor(value8 / rows) : value8 % columns,
        row = direction2 === 'down' ? value8 % rows : Math.floor(value8 / columns);
      return {
        x: x2 + col * (value2 + itemGap2),
        y: y2 + row * (value3 + itemGap2),
        col: col,
        row: row,
      };
    };
  return {
    direction: direction2,
    spacing: spacing3,
    itemGap: itemGap2,
    columns: columns,
    rows: rows,
    groupX: groupX,
    groupY: groupY,
    groupWidth: groupWidth,
    groupHeight: groupHeight,
    itemStartX: x2,
    itemStartY: y2,
    getItemPosition: getItemPosition,
  };
}

export function createDuplicateSpawnOffsets({
  nodes: nodes = {},
  sourceNodes: sourceNodes = [],
  copies: copies = 0x1,
} = {}) {
  const args = (Array['isArray'](sourceNodes) ? sourceNodes : [])['filter'](
    (value9) => value9 && typeof value9 === 'object',
  );
  if (args['length'] === 0x0) return [];
  const nodeSpawnPrefs2 = getNodeSpawnPrefs(),
    value10 = Math['max'](0x0, toFiniteNumber(nodeSpawnPrefs2['spacing'], 0x78)),
    spawnDirection2 = normalizeSpawnDirection(nodeSpawnPrefs2['direction']),
    value11 = nodeSpawnPrefs2['avoidOverlap'] !== ![],
    clampPositiveInteger3 = clampPositiveInteger(copies, 0x1),
    value12 = Math['min'](...args['map']((box4) => toFiniteNumber(box4['x'], 0x0))),
    value13 = Math['min'](...args['map']((box5) => toFiniteNumber(box5['y'], 0x0))),
    value14 = Math['max'](
      ...args['map'](
        (box6) => toFiniteNumber(box6['x'], 0x0) + Math['max'](0x1, toFiniteNumber(box6['width'], 0x64)),
      ),
    ),
    value15 = Math['max'](
      ...args['map'](
        (box7) => toFiniteNumber(box7['y'], 0x0) + Math['max'](0x1, toFiniteNumber(box7['height'], 0x64)),
      ),
    ),
    value16 = Math['max'](0x1, value14 - value12),
    value17 = Math['max'](0x1, value15 - value13),
    value18 = value11 ? { ...(nodes || {}) } : {},
    value19 = [];
  for (let value20 = 0x1; value20 <= clampPositiveInteger3; value20 += 0x1) {
    let value21 = value12,
      value22 = value13;
    if (spawnDirection2 === 'down') value22 += (value17 + value10) * value20;
    else
      spawnDirection2 === 'left'
        ? (value21 -= (value16 + value10) * value20)
        : (value21 += (value16 + value10) * value20);
    if (value11) {
      const box8 = findAvailablePosition(
        value18,
        value21,
        value22,
        value16,
        value17,
        value10,
        spawnDirection2,
      );
      ((value21 = box8['x']),
        (value22 = box8['y']),
        (value18['duplicate-spawn-' + value20] = {
          x: value21,
          y: value22,
          width: value16,
          height: value17,
        }));
    }
    value19['push']({ dx: value21 - value12, dy: value22 - value13 });
  }
  return value19;
}
