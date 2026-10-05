const DEFAULT_VIEWPORT_WIDTH = 1024,
  DEFAULT_VIEWPORT_HEIGHT = 768,
  DEFAULT_DURATION_MS = 880,
  DEFAULT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
function isReducedMotionPreferred(value) {
  try {
    return value?.['matchMedia']?.('(prefers-reduced-motion: reduce)')?.['matches'] === true;
  } catch {
    return false;
  }
}
function getViewportSize(dom, width) {
  const el = dom?.['documentElement'];
  return {
    width: width?.['innerWidth'] || el?.['clientWidth'] || DEFAULT_VIEWPORT_WIDTH,
    height: width?.['innerHeight'] || el?.['clientHeight'] || DEFAULT_VIEWPORT_HEIGHT,
  };
}
function resolveRevealPoint({
  documentObject: documentObject2,
  windowObject: windowObject2,
  event: event2,
  sourceElement: sourceElement2,
}) {
  const { width: width2, height: height } = getViewportSize(documentObject2, windowObject2),
    item = { x: width2 / 2, y: height / 2 },
    x = Number(event2?.['clientX']),
    y = Number(event2?.['clientY']);
  if (Number['isFinite'](x) && Number['isFinite'](y) && (x !== 0 || y !== 0)) return { x: x, y: y };
  const el2 = sourceElement2 || event2?.['currentTarget'] || event2?.['target'];
  if (typeof el2?.['getBoundingClientRect'] !== 'function') return item;
  const x2 = el2['getBoundingClientRect']();
  return { x: x2['left'] + x2['width'] / 2, y: x2['top'] + x2['height'] / 2 };
}
function getRevealRadius(key, index, result, data) {
  const { width: width3, height: height2 } = getViewportSize(key, index);
  return Math['ceil'](
    Math['max'](
      Math['hypot'](result, data),
      Math['hypot'](width3 - result, data),
      Math['hypot'](result, height2 - data),
      Math['hypot'](width3 - result, height2 - data),
    ),
  );
}
function formatPercentage(options, { roundUp: roundUp = false } = {}) {
  const target = options * 10000,
    source = (roundUp ? Math['ceil'](target) : Math['round'](target)) / 10000;
  return String(Object['is'](source, -0) ? 0 : source);
}
function getRelativeRevealGeometry(next, current, entry, record) {
  const { width: width4, height: height3 } = getViewportSize(next, current),
    payload = Math['hypot'](width4, height3) / Math['SQRT2'],
    revealRadius = getRevealRadius(next, current, entry, record);
  return {
    x: formatPercentage((entry / width4) * 100),
    y: formatPercentage((record / height3) * 100),
    radius: formatPercentage((revealRadius / payload) * 100, { roundUp: true }),
  };
}
export function runCircularRevealTransition({
  event: event = null,
  sourceElement: sourceElement = null,
  apply: apply,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  rootClassName: rootClassName = 'circular-reveal-transitioning',
  duration: duration = DEFAULT_DURATION_MS,
  easing: easing = DEFAULT_EASING,
} = {}) {
  if (typeof apply !== 'function') return null;
  const el3 = documentObject?.['documentElement'];
  if (
    !el3 ||
    isReducedMotionPreferred(windowObject) ||
    typeof documentObject?.['startViewTransition'] !== 'function' ||
    typeof el3['animate'] !== 'function'
  )
    return (apply(), null);
  const { x: x3, y: y2 } = resolveRevealPoint({
    documentObject: documentObject,
    windowObject: windowObject,
    event: event,
    sourceElement: sourceElement,
  });
  let handle = false;
  const run = () => {
      if (handle) return undefined;
      return ((handle = true), apply());
    },
    handler = () => el3['classList']?.['remove'](rootClassName);
  el3['classList']?.['add'](rootClassName);
  let state;
  try {
    state = documentObject['startViewTransition'](run);
  } catch {
    return (handler(), run(), null);
  }
  const config = state?.['ready']
    ?.['then'](() => {
      const box = getRelativeRevealGeometry(documentObject, windowObject, x3, y2),
        scope = el3['animate'](
          {
            clipPath: [
              'circle(0px at ' + box['x'] + '% ' + box['y'] + '%)',
              'circle(' + box['radius'] + '% at ' + box['x'] + '% ' + box['y'] + '%)',
            ],
          },
          { duration: duration, easing: easing, pseudoElement: '::view-transition-new(root)' },
        );
      return scope?.['finished'];
    })
    ['catch'](() => {});
  return (
    Promise['allSettled'](
      [config, state?.['finished']]['filter']((promise) => promise && typeof promise['then'] === 'function'),
    )['finally'](handler),
    state
  );
}
