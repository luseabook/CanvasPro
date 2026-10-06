export function playAssetCreateFly({
  fromElement: fromElement = null,
  fromRect: fromRect = null,
  contentElement: contentElement = null,
  toElement: toElement = null,
  documentObject: documentObject = globalThis.document,
  windowObject: windowObject = globalThis.window,
} = {}) {
  const value = windowObject?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (value || !documentObject?.body || !toElement) return null;
  const box = fromRect || fromElement?.getBoundingClientRect?.(),
    box2 = toElement.getBoundingClientRect?.(),
    enabled = contentElement || fromElement;
  if (!enabled?.cloneNode || !box?.width || !box?.height || !box2) return null;
  const el = documentObject.createElement('div');
  ((el.className = 'v2-asset-create-fly'),
    (el.style.left = box.left + 'px'),
    (el.style.top = box.top + 'px'),
    (el.style.width = box.width + 'px'),
    (el.style.height = box.height + 'px'));
  const item = enabled.cloneNode(true);
  if (item?.id) item.removeAttribute('id');
  (el.appendChild(item), documentObject.body.appendChild(el));
  if (typeof el.animate !== 'function') return (el.remove(), null);
  const key = box.left + box.width / 2,
    index = box.top + box.height / 2,
    result = box2.left + box2.width / 2,
    data = box2.top + box2.height / 2,
    options = el.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        {
          transform: 'translate(' + (result - key) + 'px,' + (data - index) + 'px) scale(0.12)',
          opacity: 0.2,
        },
      ],
      { duration: 520, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    );
  return (
    (options.onfinish = () => {
      (el.remove(),
        typeof toElement.animate === 'function' &&
          toElement.animate(
            [
              { transform: 'scale(1)', filter: 'brightness(1)' },
              { transform: 'scale(1.08)', filter: 'brightness(1.2)' },
              { transform: 'scale(1)', filter: 'brightness(1)' },
            ],
            { duration: 260, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
          ));
    }),
    el
  );
}
