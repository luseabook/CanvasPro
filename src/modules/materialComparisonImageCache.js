import { resolveCanvasImageSourceUrl } from '../services/canvasMediaLocalService.js';
import { firstNonEmpty } from '../utils/validators.js';
const caches = new WeakMap();
export function getComparisonOriginalKey(value) {
  const item = Array['isArray'](value?.['images']) ? value['images'][value['mainImageIndex'] || 0x0] : null,
    nonEmpty = firstNonEmpty(item?.['sourceId'], value?.['sourceId']),
    canvasImageSourceUrl = resolveCanvasImageSourceUrl(item) || resolveCanvasImageSourceUrl(value);
  return nonEmpty || canvasImageSourceUrl ? JSON['stringify']([nonEmpty, canvasImageSourceUrl]) : '';
}
export function createComparisonImageCache({
  maxBytes: maxBytes = 0x100 * 0x400 * 0x400,
  maxEntries: maxEntries = 0x4,
  ttlMs: ttlMs = 0x1d4c0,
  now: now = Date['now'],
  schedule: schedule = setTimeout,
  cancel: cancel = clearTimeout,
  revoke: revoke = (key) => URL['revokeObjectURL'](key),
} = {}) {
  const map = new Map();
  let index = 0x0,
    timer = null,
    result = 0x0;
  function run(data, options = '') {
    const response = map['get'](data);
    if (!response) return;
    (map['delete'](data), (index -= response['bytes']), response['image']['removeAttribute']?.('src'));
    if (response['revokeUrlOnClose'] && response['url'] !== options) revoke(response['url']);
  }
  function run2() {
    for (const [target, source] of map) {
      if (source['expiresAt'] <= now()) run(target);
    }
  }
  function run3() {
    if (timer !== null) cancel(timer);
    timer = null;
    if (!map['size']) return;
    const next = Math['min'](...[...map['values']()]['map']((current) => current['expiresAt']));
    ((timer = schedule(
      () => {
        (run2(), run3());
      },
      Math['max'](0x1, next - now()),
    )),
      timer?.['unref']?.());
  }
  function clear() {
    result++;
    for (const entry of map['keys']()) run(entry);
    run3();
  }
  return {
    get generation() {
      return result;
    },
    clear: clear,
    take(record) {
      run2();
      const payload = map['get'](record);
      return (payload && (map['delete'](record), (index -= payload['bytes'])), run3(), payload || null);
    },
    put(enabled, args, handle = result) {
      const { image: image, url: url } = args,
        bytes = Number(image?.['naturalWidth']) * Number(image?.['naturalHeight']) * 0x4;
      if (
        handle !== result ||
        !enabled ||
        !url ||
        !image?.['complete'] ||
        !Number['isFinite'](bytes) ||
        bytes <= 0x0 ||
        bytes > maxBytes ||
        maxEntries < 0x1
      )
        return ![];
      run2();
      if (map['get'](enabled)?.['image'] === image) return !![];
      const response2 = map['get'](enabled),
        revokeUrlOnClose =
          args['revokeUrlOnClose'] || (response2?.['url'] === url && response2['revokeUrlOnClose']);
      run(enabled, url);
      while (map['size'] && (index + bytes > maxBytes || map['size'] >= maxEntries)) {
        run(map['keys']()['next']()['value']);
      }
      return (
        image['remove']?.(),
        map['set'](enabled, {
          ...args,
          revokeUrlOnClose: revokeUrlOnClose,
          bytes: bytes,
          expiresAt: now() + ttlMs,
        }),
        (index += bytes),
        run3(),
        !![]
      );
    },
  };
}
export function getComparisonImageCache(dom) {
  let map2 = caches['get'](dom);
  return (
    !map2 &&
      ((map2 = createComparisonImageCache()),
      caches['set'](dom, map2),
      dom['defaultView']?.['addEventListener']('aicanvas:active-canvas-changed', map2['clear']),
      dom['defaultView']?.['addEventListener']('pagehide', map2['clear'])),
    map2
  );
}
