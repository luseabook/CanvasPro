export const normalizeCurveVector = (list) =>
  Array['isArray'](list) && list['length'] === 0x3 && list['every'](Number['isFinite'])
    ? [...list]
    : undefined;
export function normalizeEasingCurve(list2) {
  if (!Array['isArray'](list2) || list2['length'] !== 0x4 || !list2['every'](Number['isFinite']))
    return undefined;
  return list2['map']((value, item) =>
    item % 0x2 === 0x0
      ? Math['max'](0x0, Math['min'](0x1, value))
      : Math['max'](-0x4, Math['min'](0x4, value)),
  );
}
const cubic = (key, index, result, data, options) =>
  (0x1 - options) ** 0x3 * key +
  0x3 * (0x1 - options) ** 0x2 * options * index +
  0x3 * (0x1 - options) * options * options * result +
  options ** 0x3 * data;
export function sampleBezierEase(count, target) {
  if (count <= 0x0 || count >= 0x1) return count;
  let source = 0x0,
    next = 0x1;
  for (let count2 = 0x0; count2 < 0x18; count2++) {
    const current = (source + next) / 0x2;
    if (cubic(0x0, target[0x0], target[0x2], 0x1, current) < count) source = current;
    else next = current;
  }
  return cubic(0x0, target[0x1], target[0x3], 0x1, (source + next) / 0x2);
}
export function sampleSpatialCurve(el, el2, entry, record = 'value') {
  const list3 = record === 'camera' ? el['camera']['position'] : el['value'],
    payload = record === 'camera' ? el2['camera']['position'] : el2['value'];
  if (!el['outTangent'] && !el2['inTangent'])
    return list3['map']((handle, state) => handle + (payload[state] - handle) * entry);
  return list3['map']((config, scope) =>
    cubic(
      config,
      config + (el['outTangent']?.[scope] ?? (payload[scope] - config) / 0x3),
      payload[scope] + (el2['inTangent']?.[scope] ?? (config - payload[scope]) / 0x3),
      payload[scope],
      entry,
    ),
  );
}
export function smoothDirectorKeys(list4) {
  return (
    list4['forEach']((input, output) => {
      const run = (el3) => el3['camera']?.['position'] || el3['value'],
        value2 = run(list4[Math['max'](0x0, output - 0x1)]),
        list5 = run(list4[Math['min'](list4['length'] - 0x1, output + 0x1)]);
      ((input['outTangent'] = list5['map']((value3, value4) => (value3 - value2[value4]) / 0x6)),
        (input['inTangent'] = input['outTangent']['map']((value5) => -value5)));
    }),
    list4
  );
}
