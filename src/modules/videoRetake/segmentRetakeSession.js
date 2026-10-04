export const SEGMENT_RETAKE_MIN_DURATION_SECONDS = 0x4;
export const SEGMENT_RETAKE_MAX_DURATION_SECONDS = 0x1e;
function finiteNumber(value, item = 0x0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function roundTime(result) {
  return Math['round'](finiteNumber(result) * 0x3e8) / 0x3e8;
}
export function normalizeSegmentRetakeRange(
  options = {},
  data = 0x0,
  {
    minDurationSec: minDurationSec = SEGMENT_RETAKE_MIN_DURATION_SECONDS,
    maxDurationSec: maxDurationSec = SEGMENT_RETAKE_MAX_DURATION_SECONDS,
  } = {},
) {
  const count = Math['max'](0x0, finiteNumber(data));
  if (count <= 0x0) return { startSec: 0x0, endSec: 0x0, durationSec: 0x0 };
  const target = Math['min'](count, Math['max'](0.1, finiteNumber(minDurationSec, 0x4))),
    source = Math['min'](count, Math['max'](target, finiteNumber(maxDurationSec, 0x1e)));
  let next = Math['max'](0x0, Math['min'](count, finiteNumber(options['startSec']))),
    current = Math['max'](next, Math['min'](count, finiteNumber(options['endSec'], count)));
  if (current - next > source) current = next + source;
  return (
    current - next < target &&
      ((current = Math['min'](count, next + target)), (next = Math['max'](0x0, current - target))),
    {
      startSec: roundTime(next),
      endSec: roundTime(current),
      durationSec: roundTime(current - next),
    }
  );
}
function normalizeRawSegments(entry, record) {
  const payload = Math['max'](0x0, finiteNumber(record));
  return (Array['isArray'](entry) ? entry : [])
    ['map']((handle) => {
      const startSec = Math['max'](0x0, Math['min'](payload, finiteNumber(handle?.['start']))),
        endSec = Math['max'](startSec, Math['min'](payload, finiteNumber(handle?.['end'])));
      return { startSec: startSec, endSec: endSec };
    })
    ['filter']((state) => state['endSec'] > state['startSec'])
    ['sort']((config, scope) => config['startSec'] - scope['startSec']);
}
export function normalizeSegmentRetakeSmartSegments(input, output, value2 = {}) {
  const endSec2 = Math['max'](0x0, finiteNumber(output));
  if (endSec2 <= 0x0) return [];
  const minDurationSec2 = Math['min'](endSec2, Math['max'](0.1, finiteNumber(value2['minDurationSec'], 0x4))),
    maxDurationSec2 = Math['min'](
      endSec2,
      Math['max'](minDurationSec2, finiteNumber(value2['maxDurationSec'], 0x1e)),
    ),
    list = normalizeRawSegments(input, endSec2);
  if (list['length'] === 0x0)
    return [normalizeSegmentRetakeRange({ startSec: 0x0, endSec: endSec2 }, endSec2, value2)];
  const list2 = [];
  for (const args of list) {
    const value3 = { ...args },
      value4 = list2[list2['length'] - 0x1];
    if (
      value4 &&
      (value3['endSec'] - value3['startSec'] < minDurationSec2 ||
        value4['endSec'] - value4['startSec'] < minDurationSec2)
    ) {
      value4['endSec'] = Math['max'](value4['endSec'], value3['endSec']);
      continue;
    }
    list2['push'](value3);
  }
  if (list2['length'] > 0x1) {
    const value5 = list2[list2['length'] - 0x1];
    value5['endSec'] - value5['startSec'] < minDurationSec2 &&
      ((list2[list2['length'] - 0x2]['endSec'] = value5['endSec']), list2['pop']());
  }
  const list3 = [];
  for (const endSec3 of list2) {
    let startSec2 = endSec3['startSec'];
    while (endSec3['endSec'] - startSec2 > maxDurationSec2) {
      (list3['push']({ startSec: startSec2, endSec: startSec2 + maxDurationSec2 }),
        (startSec2 += maxDurationSec2));
    }
    if (endSec3['endSec'] > startSec2) {
      const value6 = { startSec: startSec2, endSec: endSec3['endSec'] },
        value7 = list3[list3['length'] - 0x1];
      value7 &&
      value6['endSec'] - value6['startSec'] < minDurationSec2 &&
      value6['endSec'] - value7['startSec'] <= maxDurationSec2
        ? (value7['endSec'] = value6['endSec'])
        : list3['push'](value6);
    }
  }
  return list3['map']((value8) =>
    normalizeSegmentRetakeRange(value8, endSec2, {
      minDurationSec: minDurationSec2,
      maxDurationSec: maxDurationSec2,
    }),
  );
}
export function isSegmentRetakeAnnotationInRange(value9, value10) {
  const finiteNumber2 = finiteNumber(value9?.['timeSec'], -0x1),
    finiteNumber3 = finiteNumber(value10?.['startSec'], 0x0),
    finiteNumber4 = finiteNumber(value10?.['endSec'], 0x0);
  return finiteNumber2 >= finiteNumber3 && finiteNumber2 <= finiteNumber4;
}
export function resolveSegmentRetakeInputDirection(value11) {
  return String(value11 || '') === 'down' ? 'down' : 'left';
}
export function calcSegmentRetakeInputStart({
  targetNode: targetNode = {},
  itemWidth: itemWidth,
  itemHeight: itemHeight,
  index: index = 0x0,
  spacing: spacing = 0x78,
  direction: direction = 'right',
} = {}) {
  const x = resolveSegmentRetakeInputDirection(direction),
    value12 = Math['max'](0x1, finiteNumber(itemWidth, 0x12c)),
    value13 = Math['max'](0x1, finiteNumber(itemHeight, 0x12c)),
    value14 = Math['max'](0x0, finiteNumber(spacing, 0x78)),
    value15 = Math['max'](0x0, Math['trunc'](finiteNumber(index))),
    finiteNumber5 = finiteNumber(targetNode['x']),
    finiteNumber6 = finiteNumber(targetNode['y']),
    value16 = Math['max'](0x1, finiteNumber(targetNode['height'], 0x12c));
  return {
    x: x === 'down' ? finiteNumber5 : finiteNumber5 - value14 - value12,
    y: (x === 'down' ? finiteNumber6 + value16 + value14 : finiteNumber6) + value15 * (value13 + value14),
    direction: x,
  };
}
export function shouldDeleteManagedRetakeInputNode({
  node: node,
  nodeId: nodeId,
  ownerEdgeId: ownerEdgeId,
  edges: edges = [],
} = {}) {
  if (node?.['segmentRetakeManaged'] !== !![]) return ![];
  const enabled = String(nodeId || node?.['id'] || '')['trim']();
  if (!enabled) return ![];
  return !(Array['isArray'](edges) ? edges : [])['some'](
    (value17) => value17?.['sourceId'] === enabled && value17?.['id'] !== ownerEdgeId,
  );
}
export function getOrphanedSegmentRetakeAnnotationIds({
  session: session,
  nodes: nodes = {},
  edges: edges = {},
} = {}) {
  return (Array['isArray'](session?.['annotations']) ? session['annotations'] : [])
    ['filter']((value18) => !nodes?.[value18?.['nodeId']] || !edges?.[value18?.['edgeId']])
    ['map']((value19) => value19?.['id'])
    ['filter'](Boolean);
}
export function getSegmentRetakeValidation(options2 = {}) {
  const value20 = options2['range'] || {},
    finiteNumber7 = finiteNumber(value20['endSec']) - finiteNumber(value20['startSec']);
  if (finiteNumber7 < SEGMENT_RETAKE_MIN_DURATION_SECONDS) return { ok: ![], reason: 'range-too-short' };
  if (finiteNumber7 > SEGMENT_RETAKE_MAX_DURATION_SECONDS) return { ok: ![], reason: 'range-too-long' };
  const invalidAnnotationIds = (Array['isArray'](options2['annotations']) ? options2['annotations'] : [])[
    'filter'
  ]((value21) => !isSegmentRetakeAnnotationInRange(value21, value20));
  if (invalidAnnotationIds['length'] > 0x0)
    return {
      ok: ![],
      reason: 'annotation-outside-range',
      invalidAnnotationIds: invalidAnnotationIds['map']((value22) => value22['id']),
    };
  return { ok: !![], reason: '' };
}
export function buildSegmentRetakePromptText(value23) {
  const value24 = String(value23 || '')['trim']();
  return value24 ? '：' + value24 : '';
}
export function buildSegmentRetakePromptTime(value25) {
  const value26 = Math['max'](0x0, finiteNumber(value25)),
    value27 = Math['floor'](value26 / 0x3c),
    value28 = value26 - value27 * 0x3c;
  return String(value27)['padStart'](0x2, '0') + ':' + value28['toFixed'](0x2)['padStart'](0x5, '0');
}
