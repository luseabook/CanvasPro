export function clientToViewportNdc(value, item, box) {
  if (!(box['width'] > 0x0 && box['height'] > 0x0)) return null;
  return {
    x: ((value - box['left']) / box['width']) * 0x2 - 0x1,
    y: 0x1 - ((item - box['top']) / box['height']) * 0x2,
  };
}
export function ndcToViewportPoint(box2, box3) {
  if (box2['z'] < -0x1 || box2['z'] > 0x1) return null;
  return {
    x: ((box2['x'] + 0x1) * box3['width']) / 0x2,
    y: ((0x1 - box2['y']) * box3['height']) / 0x2,
  };
}
export function intersectRayWithAxisPlane(list, key, index, result) {
  if (Math['abs'](key[index]) < 1e-7) return null;
  const count = (result - list[index]) / key[index];
  if (count < 0x0 || count > 0x2710) return null;
  return list['map']((data, options) => data + key[options] * count);
}
export function adjustSpatialCamera(event, target, source, next = ![]) {
  const event2 = structuredClone(event),
    args = event['target']['map']((current, entry) => current - event['position'][entry]),
    record = Math['max'](0.01, Math['hypot'](...args));
  if (next) {
    const payload = Math['max'](-record * 0.8, Math['min'](record * 0.8, source * record * 0.002));
    event2['position'] = event['position']['map'](
      (handle, state) => handle + (args[state] / record) * payload,
    );
  } else {
    const config = Math['atan2'](args[0x0], args[0x2]) - target * 0.005,
      scope = Math['max'](-1.55, Math['min'](1.55, Math['asin'](args[0x1] / record) + source * 0.005));
    event2['target'] = [
      Math['sin'](config) * Math['cos'](scope),
      Math['sin'](scope),
      Math['cos'](config) * Math['cos'](scope),
    ]['map']((input, output) => event['position'][output] + input * record);
  }
  return event2;
}
export function applyRelativeCameraPose(value2, value3) {
  const event3 = adjustSpatialCamera(
      value2,
      -value3['rotation'][0x1] / 0.005,
      value3['rotation'][0x0] / 0.005,
    ),
    list2 = event3['target']['map']((value4, value5) => value4 - event3['position'][value5]),
    value6 = Math['hypot'](...list2) || 0x1,
    list3 = list2['map']((value7) => value7 / value6),
    value8 = Math['hypot'](list3[0x0], list3[0x2]) || 0x1,
    value9 = [-list3[0x2] / value8, 0x0, list3[0x0] / value8],
    value10 = list3['map'](
      (value11, count2) =>
        value9[count2] * value3['translation'][0x0] -
        value11 * value3['translation'][0x2] +
        (count2 === 0x1 ? value3['translation'][0x1] : 0x0),
    );
  return (
    (event3['position'] = event3['position']['map']((value12, value13) => value12 + value10[value13])),
    (event3['target'] = event3['target']['map']((value14, value15) => value14 + value10[value15])),
    (event3['roll'] = (value2['roll'] || 0x0) + value3['rotation'][0x2]),
    event3
  );
}
