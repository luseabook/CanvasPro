const DEFAULT_IMAGE_READY_TIMEOUT_MS = 10000;
export function waitForImageElementReady({
  image: image,
  onReady: onReady = () => {},
  onError: onError = () => {},
  onTimeout: onTimeout = onError,
  timeoutMs: timeoutMs = DEFAULT_IMAGE_READY_TIMEOUT_MS,
  setTimeoutFn: setTimeoutFn = globalThis.setTimeout,
  clearTimeoutFn: clearTimeoutFn = globalThis.clearTimeout,
} = {}) {
  let value = false,
    setTimeoutFn2 = null;
  const run = () => {
      (image?.removeEventListener?.('load', item),
        image?.removeEventListener?.('error', key),
        setTimeoutFn2 != null && (clearTimeoutFn?.(setTimeoutFn2), (setTimeoutFn2 = null)));
    },
    handler = (index) => {
      if (value) return;
      ((value = true), run(), index?.());
    },
    item = () => handler(onReady),
    key = () => handler(onError);
  (image?.addEventListener?.('load', item), image?.addEventListener?.('error', key));
  const count = Math.max(0, Number(timeoutMs) || 0);
  count > 0 &&
    typeof setTimeoutFn === 'function' &&
    (setTimeoutFn2 = setTimeoutFn(() => handler(onTimeout), count));
  if (!image) handler(onError);
  else image.complete && handler(image.naturalWidth > 0 ? onReady : onError);
  return run;
}
