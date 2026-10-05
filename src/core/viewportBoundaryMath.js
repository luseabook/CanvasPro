export function projectPointToViewportEdge(box, box2, value = 24) {
  const item = box2['left'] + Math['min'](value, box2['width'] / 2),
    key = box2['top'] + Math['min'](value, box2['height'] / 2),
    index = box2['left'] + box2['width'] - Math['min'](value, box2['width'] / 2),
    result = box2['top'] + box2['height'] - Math['min'](value, box2['height'] / 2),
    x = (item + index) / 2,
    y = (key + result) / 2,
    data = box['x'] - x,
    options = box['y'] - y,
    outside =
      box['x'] < box2['left'] ||
      box['x'] > box2['left'] + box2['width'] ||
      box['y'] < box2['top'] ||
      box['y'] > box2['top'] + box2['height'],
    target = Math['min'](
      1,
      data ? (index - item) / 2 / Math['abs'](data) : Infinity,
      options ? (result - key) / 2 / Math['abs'](options) : Infinity,
    );
  return {
    x: x + data * target,
    y: y + options * target,
    outside: outside,
    angle: (Math['atan2'](options, data) * 180) / Math['PI'],
  };
}
export function spreadViewportBoundaryPoint(box3, box4, list, source = 44) {
  const next =
      Math['min'](box3['x'] - box4['left'], box4['left'] + box4['width'] - box3['x']) <
      Math['min'](box3['y'] - box4['top'], box4['top'] + box4['height'] - box3['y']),
    current = next ? 'y' : 'x',
    entry = next ? 'x' : 'y',
    record = Math['min'](160, box4['width'] / 2),
    payload = next ? source : record,
    handle = (next ? box4['top'] : box4['left']) + 32,
    state = handle + (next ? box4['height'] : box4['width']) - 64,
    list2 = [],
    config = Math['max'](
      1,
      Math['ceil']((next ? box4['width'] : box4['height']) / (next ? record : source)),
    );
  for (let scope = 0; scope < config; scope++)
    for (let input = handle; input <= state; input += payload) {
      list2['push']({
        ...box3,
        [current]: input,
        [entry]:
          box3[entry] +
          scope *
            (next ? record : source) *
            (box3[entry] < (next ? box4['left'] + box4['width'] / 2 : box4['top'] + box4['height'] / 2)
              ? 1
              : -1),
      });
    }
  (list2['unshift'](box3),
    list2['sort'](
      (box5, box6) =>
        Math['hypot'](box5['x'] - box3['x'], box5['y'] - box3['y']) -
        Math['hypot'](box6['x'] - box3['x'], box6['y'] - box3['y']),
    ));
  const run = (box7) => {
      const output = Math['min'](0x88, box4['width'] * 0.25 + 16),
        left = box7['x'] > box4['left'] + box4['width'] / 2,
        top = box7['y'] > box4['top'] + box4['height'] - 60;
      return {
        left: left ? box7['x'] - 10 - output : box7['x'],
        right: left ? box7['x'] + 12 : box7['x'] + 14 + output,
        top: top ? box7['y'] - 40 : box7['y'],
        bottom: top ? box7['y'] + 12 : box7['y'] + 40,
      };
    },
    value2 =
      list2['find']((value3) => {
        const box8 = run(value3);
        return (
          box8['left'] >= box4['left'] &&
          box8['right'] <= box4['left'] + box4['width'] &&
          box8['top'] >= box4['top'] &&
          box8['bottom'] <= box4['top'] + box4['height'] &&
          list['every']((value4) => {
            const box9 = run(value4);
            return (
              box8['right'] + 4 <= box9['left'] ||
              box9['right'] + 4 <= box8['left'] ||
              box8['bottom'] + 4 <= box9['top'] ||
              box9['bottom'] + 4 <= box8['top']
            );
          })
        );
      }) || box3;
  return (list['push'](value2), value2);
}
