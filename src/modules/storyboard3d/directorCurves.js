export const normalizeCurveVector = (list) =>
  Array['isArray'](list) && list['length'] === 3 && list['every'](Number['isFinite'])
    ? [...list]
    : undefined;
export function normalizeEasingCurve(list2) {
  if (!Array['isArray'](list2) || list2['length'] !== 4 || !list2['every'](Number['isFinite']))
    return undefined;
  return list2['map']((value, item) =>
    item % 2 === 0
      ? Math['max'](0, Math['min'](1, value))
      : Math['max'](-4, Math['min'](4, value)),
  );
}
const cubic = (key, index, result, data, options) =>
  (1 - options) ** 3 * key +
  3 * (1 - options) ** 2 * options * index +
  3 * (1 - options) * options * options * result +
  options ** 3 * data;
export function sampleBezierEase(count, target) {
  if (count <= 0 || count >= 1) return count;
  let source = 0,
    next = 1;
  for (let count2 = 0; count2 < 24; count2++) {
    const current = (source + next) / 2;
    if (cubic(0, target[0], target[2], 1, current) < count) source = current;
    else next = current;
  }
  return cubic(0, target[1], target[3], 1, (source + next) / 2);
}
export function sampleSpatialCurve(el, el2, entry, record = 'value') {
  const list3 = record === 'camera' ? el['camera']['position'] : el['value'],
    payload = record === 'camera' ? el2['camera']['position'] : el2['value'];
  if (!el['outTangent'] && !el2['inTangent'])
    return list3['map']((handle, state) => handle + (payload[state] - handle) * entry);
  return list3['map']((config, scope) =>
    cubic(
      config,
      config + (el['outTangent']?.[scope] ?? (payload[scope] - config) / 3),
      payload[scope] + (el2['inTangent']?.[scope] ?? (config - payload[scope]) / 3),
      payload[scope],
      entry,
    ),
  );
}
export function smoothDirectorKeys(list4) {
  return (
    list4['forEach']((input, output) => {
      const run = (el3) => el3['camera']?.['position'] || el3['value'],
        value2 = run(list4[Math['max'](0, output - 1)]),
        list5 = run(list4[Math['min'](list4['length'] - 1, output + 1)]);
      ((input['outTangent'] = list5['map']((value3, value4) => (value3 - value2[value4]) / 6)),
        (input['inTangent'] = input['outTangent']['map']((value5) => -value5)));
    }),
    list4
  );
}
