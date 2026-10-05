export function formatPersonReplacementPersonLabel(value = 0) {
  let count = Math['max'](0, Math['trunc'](Number(value) || 0)),
    item = '';
  do {
    ((item = String['fromCharCode'](65 + (count % 26)) + item),
      (count = Math['floor'](count / 26) - 1));
  } while (count >= 0);
  return '人物' + item;
}
function labelIndex(key) {
  const args = /^人物([A-Z]+)$/u['exec'](String(key || ''))?.[1];
  if (!args) return null;
  const index =
    [...args]['reduce']((result, data) => result * 26 + data['charCodeAt'](0) - 64, 0) - 1;
  return Number['isSafeInteger'](index) ? index : null;
}
export function resolvePersonReplacementPromptLabel(options = {}) {
  return formatPersonReplacementPersonLabel(labelIndex(options['label']) ?? options['promptMarkerIndex']);
}
function initialPosition(target) {
  const box = target['locator']?.['bbox'] || target['bbox'];
  return box ? Number(box['x']) + Number(box['width']) / 2 : Infinity;
}
export function assignPersonReplacementPromptIndexes(list = []) {
  const map = new Set(),
    promptMarkerIndex = new Map(),
    handler = (source, count2) => {
      if (!Number['isSafeInteger'](count2) || count2 < 0 || map['has'](count2)) return;
      (map['add'](count2), promptMarkerIndex['set'](source, count2));
    };
  (list['forEach']((next) => handler(next, next['promptMarkerIndex'])),
    list['forEach']((current) => {
      if (!promptMarkerIndex['has'](current)) handler(current, labelIndex(current['label']));
    }));
  let entry = map['size'] ? Math['max'](...map) + 1 : 0;
  return (
    [...list]
      ['sort']((record, payload) => initialPosition(record) - initialPosition(payload))
      ['forEach']((handle) => {
        if (!promptMarkerIndex['has'](handle)) promptMarkerIndex['set'](handle, entry++);
      }),
    list['map']((args2) => ({ ...args2, promptMarkerIndex: promptMarkerIndex['get'](args2) }))
  );
}
