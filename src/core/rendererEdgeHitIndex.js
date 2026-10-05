const DEFAULT_CELL_SIZE = 256,
  DEFAULT_SUBDIVISION_FLATNESS = 8,
  DEFAULT_MAX_SUBDIVISION_DEPTH = 8,
  DEFAULT_DISTANCE_SAMPLES = 32,
  DEFAULT_DISTANCE_REFINEMENTS = 14;
function normalizeNumber(value, item = 0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function normalizeGeometry(enabled) {
  if (!enabled) return null;
  const hitPoints = Array['isArray'](enabled['hitPoints'])
    ? enabled['hitPoints']
        ['map']((box) => ({
          x: normalizeNumber(box?.['x'], Number['NaN']),
          y: normalizeNumber(box?.['y'], Number['NaN']),
        }))
        ['filter']((box2) => Number['isFinite'](box2['x']) && Number['isFinite'](box2['y']))
    : null;
  return {
    pathStyle: String(enabled['pathStyle'] || 'curve'),
    startX: normalizeNumber(enabled['startX']),
    startY: normalizeNumber(enabled['startY']),
    control1X: normalizeNumber(enabled['control1X']),
    control1Y: normalizeNumber(enabled['control1Y']),
    control2X: normalizeNumber(enabled['control2X']),
    control2Y: normalizeNumber(enabled['control2Y']),
    endX: normalizeNumber(enabled['endX']),
    endY: normalizeNumber(enabled['endY']),
    hitPoints: hitPoints && hitPoints['length'] >= 2 ? hitPoints : null,
  };
}
export function evaluateCubicBezier(index, result) {
  const geometry = normalizeGeometry(index);
  if (!geometry) return null;
  const data = Math['min'](1, Math['max'](0, normalizeNumber(result))),
    options = 1 - data,
    x = options * options,
    target = data * data;
  return {
    x:
      x * options * geometry['startX'] +
      3 * x * data * geometry['control1X'] +
      3 * options * target * geometry['control2X'] +
      target * data * geometry['endX'],
    y:
      x * options * geometry['startY'] +
      3 * x * data * geometry['control1Y'] +
      3 * options * target * geometry['control2Y'] +
      target * data * geometry['endY'],
  };
}
function distanceSquaredAt(source, next, current, entry) {
  const box3 = evaluateCubicBezier(source, entry);
  if (!box3) return Number['POSITIVE_INFINITY'];
  const record = box3['x'] - next,
    payload = box3['y'] - current;
  return record * record + payload * payload;
}
export function distanceToCubicBezierSquared(
  handle,
  state,
  config,
  {
    samples: samples = DEFAULT_DISTANCE_SAMPLES,
    refinements: refinements = DEFAULT_DISTANCE_REFINEMENTS,
  } = {},
) {
  const number = normalizeNumber(state),
    number2 = normalizeNumber(config),
    scope = Math['max'](8, Math['floor'](normalizeNumber(samples, 32)));
  let input = 0,
    output = Number['POSITIVE_INFINITY'];
  for (let value2 = 0; value2 <= scope; value2 += 1) {
    const distanceSquaredAt2 = distanceSquaredAt(handle, number, number2, value2 / scope);
    distanceSquaredAt2 < output && ((output = distanceSquaredAt2), (input = value2));
  }
  let value3 = Math['max'](0, (input - 1) / scope),
    value4 = Math['min'](1, (input + 1) / scope);
  const value5 = Math['max'](0, Math['floor'](normalizeNumber(refinements, DEFAULT_DISTANCE_REFINEMENTS)));
  for (let value6 = 0; value6 < value5; value6 += 1) {
    const value7 = value3 + (value4 - value3) / 3,
      value8 = value4 - (value4 - value3) / 3;
    distanceSquaredAt(handle, number, number2, value7) <= distanceSquaredAt(handle, number, number2, value8)
      ? (value4 = value8)
      : (value3 = value7);
  }
  return Math['min'](output, distanceSquaredAt(handle, number, number2, (value3 + value4) / 2));
}
function pointLineDistanceSquared(value9, value10, value11, value12, value13, value14) {
  const value15 = value13 - value11,
    value16 = value14 - value12,
    value17 = value15 * value15 + value16 * value16;
  if (value17 <= Number['EPSILON']) {
    const value18 = value9 - value11,
      value19 = value10 - value12;
    return value18 * value18 + value19 * value19;
  }
  const value20 = value16 * value9 - value15 * value10 + value13 * value12 - value14 * value11;
  return (value20 * value20) / value17;
}
function pointSegmentDistanceSquared(value21, value22, value23, value24, value25, value26) {
  const value27 = value25 - value23,
    value28 = value26 - value24,
    value29 = value27 * value27 + value28 * value28;
  if (value29 <= Number['EPSILON']) {
    const value30 = value21 - value23,
      value31 = value22 - value24;
    return value30 * value30 + value31 * value31;
  }
  const value32 = Math['max'](
      0,
      Math['min'](1, ((value21 - value23) * value27 + (value22 - value24) * value28) / value29),
    ),
    value33 = value23 + value32 * value27,
    value34 = value24 + value32 * value28,
    value35 = value21 - value33,
    value36 = value22 - value34;
  return value35 * value35 + value36 * value36;
}
export function distanceToPolylineSquared(list, value37, value38) {
  if (!Array['isArray'](list) || list['length'] < 2) return Number['POSITIVE_INFINITY'];
  const number3 = normalizeNumber(value37),
    number4 = normalizeNumber(value38);
  let value39 = Number['POSITIVE_INFINITY'];
  for (let value40 = 1; value40 < list['length']; value40 += 1) {
    const box4 = list[value40 - 1],
      box5 = list[value40];
    value39 = Math['min'](
      value39,
      pointSegmentDistanceSquared(
        number3,
        number4,
        normalizeNumber(box4?.['x']),
        normalizeNumber(box4?.['y']),
        normalizeNumber(box5?.['x']),
        normalizeNumber(box5?.['y']),
      ),
    );
  }
  return value39;
}
function getCurveFlatnessSquared(value41) {
  return Math['max'](
    pointLineDistanceSquared(
      value41['control1X'],
      value41['control1Y'],
      value41['startX'],
      value41['startY'],
      value41['endX'],
      value41['endY'],
    ),
    pointLineDistanceSquared(
      value41['control2X'],
      value41['control2Y'],
      value41['startX'],
      value41['startY'],
      value41['endX'],
      value41['endY'],
    ),
  );
}
function midpoint(value42, value43) {
  return (value42 + value43) / 2;
}
function subdivideCurve(startX) {
  const control1X = midpoint(startX['startX'], startX['control1X']),
    control1Y = midpoint(startX['startY'], startX['control1Y']),
    midpoint2 = midpoint(startX['control1X'], startX['control2X']),
    midpoint3 = midpoint(startX['control1Y'], startX['control2Y']),
    control2X = midpoint(startX['control2X'], startX['endX']),
    control2Y = midpoint(startX['control2Y'], startX['endY']),
    control2X2 = midpoint(control1X, midpoint2),
    control2Y2 = midpoint(control1Y, midpoint3),
    control1X2 = midpoint(midpoint2, control2X),
    control1Y2 = midpoint(midpoint3, control2Y),
    endX = midpoint(control2X2, control1X2),
    endY = midpoint(control2Y2, control1Y2);
  return [
    {
      startX: startX['startX'],
      startY: startX['startY'],
      control1X: control1X,
      control1Y: control1Y,
      control2X: control2X2,
      control2Y: control2Y2,
      endX: endX,
      endY: endY,
    },
    {
      startX: endX,
      startY: endY,
      control1X: control1X2,
      control1Y: control1Y2,
      control2X: control2X,
      control2Y: control2Y,
      endX: startX['endX'],
      endY: startX['endY'],
    },
  ];
}
function collectCurveBounds(value44, list2, value45, value46, value47 = 0) {
  if (value47 >= value46 || getCurveFlatnessSquared(value44) <= value45) {
    list2['push']({
      minX: Math['min'](value44['startX'], value44['control1X'], value44['control2X'], value44['endX']),
      minY: Math['min'](value44['startY'], value44['control1Y'], value44['control2Y'], value44['endY']),
      maxX: Math['max'](value44['startX'], value44['control1X'], value44['control2X'], value44['endX']),
      maxY: Math['max'](value44['startY'], value44['control1Y'], value44['control2Y'], value44['endY']),
    });
    return;
  }
  const [value48, value49] = subdivideCurve(value44);
  (collectCurveBounds(value48, list2, value45, value46, value47 + 1),
    collectCurveBounds(value49, list2, value45, value46, value47 + 1));
}
function cellCoordinate(value50, value51) {
  return Math['floor'](value50 / value51);
}
function cellKey(value52, value53) {
  return value52 + ':' + value53;
}
export function createEdgeHitSpatialIndex({
  cellSize: cellSize = DEFAULT_CELL_SIZE,
  subdivisionFlatness: subdivisionFlatness = DEFAULT_SUBDIVISION_FLATNESS,
  maxSubdivisionDepth: maxSubdivisionDepth = DEFAULT_MAX_SUBDIVISION_DEPTH,
} = {}) {
  const value54 = Math['max'](32, normalizeNumber(cellSize, 256)),
    value55 = Math['max'](0.5, normalizeNumber(subdivisionFlatness, 8)) ** 2,
    value56 = Math['max'](1, Math['floor'](normalizeNumber(maxSubdivisionDepth, 8))),
    cellCount = new Map(),
    edgeCount = new Map(),
    map = new Map();
  function remove(value57) {
    const value58 = map['get'](value57);
    if (value58)
      for (const value59 of value58) {
        const map2 = cellCount['get'](value59);
        map2?.['delete'](value57);
        if (map2?.['size'] === 0) cellCount['delete'](value59);
      }
    return (map['delete'](value57), edgeCount['delete'](value57));
  }
  function upsert({ edgeId: edgeId, geometry: geometry2, order: order = 0 } = {}) {
    const edgeId2 = String(edgeId || ''),
      geometry3 = normalizeGeometry(geometry2);
    if (!edgeId2 || !geometry3) return ![];
    remove(edgeId2);
    const value60 = { edgeId: edgeId2, geometry: geometry3, order: normalizeNumber(order) },
      list3 = [];
    if (geometry3['hitPoints'])
      for (let value61 = 1; value61 < geometry3['hitPoints']['length']; value61 += 1) {
        const box6 = geometry3['hitPoints'][value61 - 1],
          box7 = geometry3['hitPoints'][value61];
        list3['push']({
          minX: Math['min'](box6['x'], box7['x']),
          minY: Math['min'](box6['y'], box7['y']),
          maxX: Math['max'](box6['x'], box7['x']),
          maxY: Math['max'](box6['y'], box7['y']),
        });
      }
    else collectCurveBounds(geometry3, list3, value55, value56);
    const value62 = new Set();
    for (const value63 of list3) {
      const cellCoordinate2 = cellCoordinate(value63['minX'], value54),
        cellCoordinate3 = cellCoordinate(value63['minY'], value54),
        cellCoordinate4 = cellCoordinate(value63['maxX'], value54),
        cellCoordinate5 = cellCoordinate(value63['maxY'], value54);
      for (let value64 = cellCoordinate2; value64 <= cellCoordinate4; value64 += 1) {
        for (let value65 = cellCoordinate3; value65 <= cellCoordinate5; value65 += 1) {
          const cellKey2 = cellKey(value64, value65);
          let map3 = cellCount['get'](cellKey2);
          (!map3 && ((map3 = new Map()), cellCount['set'](cellKey2, map3)),
            map3['set'](edgeId2, value60),
            value62['add'](cellKey2));
        }
      }
    }
    return (edgeCount['set'](edgeId2, value60), map['set'](edgeId2, value62), !![]);
  }
  function queryCandidates(value66, value67, value68 = 0) {
    const number5 = normalizeNumber(value66),
      number6 = normalizeNumber(value67),
      value69 = Math['max'](0, normalizeNumber(value68)),
      cellCoordinate6 = cellCoordinate(number5 - value69, value54),
      cellCoordinate7 = cellCoordinate(number6 - value69, value54),
      cellCoordinate8 = cellCoordinate(number5 + value69, value54),
      cellCoordinate9 = cellCoordinate(number6 + value69, value54),
      map4 = new Map();
    for (let value70 = cellCoordinate6; value70 <= cellCoordinate8; value70 += 1) {
      for (let value71 = cellCoordinate7; value71 <= cellCoordinate9; value71 += 1) {
        const enabled2 = cellCount['get'](cellKey(value70, value71));
        if (!enabled2) continue;
        for (const [value72, value73] of enabled2) {
          map4['set'](value72, value73);
        }
      }
    }
    return Array['from'](map4['values']())['sort'](
      (value74, value75) =>
        value75['order'] - value74['order'] || value75['edgeId']['localeCompare'](value74['edgeId']),
    );
  }
  function hitTest(value76, value77, value78) {
    const value79 = Math['max'](0, normalizeNumber(value78)) ** 2;
    for (const value80 of queryCandidates(value76, value77, value78)) {
      const value81 = value80['geometry']['hitPoints']
        ? distanceToPolylineSquared(value80['geometry']['hitPoints'], value76, value77)
        : distanceToCubicBezierSquared(value80['geometry'], value76, value77);
      if (value81 <= value79) return value80;
    }
    return null;
  }
  function clear() {
    (cellCount['clear'](), edgeCount['clear'](), map['clear']());
  }
  function getStats() {
    return {
      edgeCount: edgeCount['size'],
      cellCount: cellCount['size'],
      membershipCount: Array['from'](map['values']())['reduce'](
        (value82, value83) => value82 + value83['size'],
        0,
      ),
    };
  }
  return {
    clear: clear,
    getStats: getStats,
    hitTest: hitTest,
    queryCandidates: queryCandidates,
    remove: remove,
    upsert: upsert,
  };
}
