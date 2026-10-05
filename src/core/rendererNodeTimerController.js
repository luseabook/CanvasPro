import { isNodeType } from '../modules/registry.js';
import { resolveGenerationUiState } from './generationTaskUiState.js';
import { formatRendererNodeTimerText } from './rendererNodePresentation.js';
const DEFAULT_UPDATE_INTERVAL_MS = 250,
  RUNNING_TIMER_STATES = new Set(['idle', 'submitting', 'queued', 'running', 'recovering']);
function hasResolvedMediaValue(value, list) {
  return !!(
    value &&
    typeof value === 'object' &&
    list['some']((item) => !!String(value?.[item] || '')['trim']())
  );
}
function isResolvedSourceMediaNode(key) {
  if (isNodeType(key, 'source-audio'))
    return hasResolvedMediaValue(key, ['src', 'audioUrl', 'localPath', 'resultUrl']);
  if (
    !isNodeType(key, 'source-video') ||
    !!String(key?.['rhTaskId'] || key?.['asyncTaskId'] || key?.['dreaminaSubmitId'] || '')['trim']() ||
    key?.['rhTaskRecovering'] === true ||
    key?.['asyncTaskRecovering'] === true ||
    key?.['dreaminaTaskRecovering'] === true
  )
    return false;
  const list2 = Array['isArray'](key?.['videos']) ? key['videos'] : [];
  return (
    hasResolvedMediaValue(key, [
      'src',
      'videoUrl',
      'localPath',
      'displayLocalPath',
      'originalLocalPath',
      'resultUrl',
      'capturePreviewUrl',
    ]) ||
    list2['some']((index) =>
      hasResolvedMediaValue(index, [
        'url',
        'videoUrl',
        'localPath',
        'displayLocalPath',
        'originalLocalPath',
        'resultUrl',
        'sourceUrl',
      ]),
    )
  );
}
function isRunningTimerNode(enabled) {
  if (
    !enabled?.['generationStartTime'] ||
    enabled['generationDuration'] != null ||
    isResolvedSourceMediaNode(enabled)
  )
    return false;
  return RUNNING_TIMER_STATES['has'](resolveGenerationUiState(enabled));
}
function defaultRequestFrame(handler) {
  if (typeof globalThis['requestAnimationFrame'] === 'function')
    return globalThis['requestAnimationFrame'](handler);
  return (handler(), null);
}
function defaultCancelFrame(result) {
  globalThis['cancelAnimationFrame']?.(result);
}
function setTimerText(el, data) {
  if (el['textContent'] === data) return;
  const options = el['firstChild'];
  options?.['nodeType'] === 3 && options === el['lastChild']
    ? (options['data'] = data)
    : (el['textContent'] = data);
}
export function createRendererNodeTimerController({
  getWrapper: getWrapper,
  now: now = () => Date['now'](),
  requestFrame: requestFrame = defaultRequestFrame,
  cancelFrame: cancelFrame = defaultCancelFrame,
  setTimer: setTimer = (target, source) => globalThis['setTimeout'](target, source),
  clearTimer: clearTimer = (next) => globalThis['clearTimeout'](next),
  updateIntervalMs: updateIntervalMs = DEFAULT_UPDATE_INTERVAL_MS,
} = {}) {
  if (typeof getWrapper !== 'function')
    throw new TypeError('[rendererNodeTimerController] getWrapper must be a function');
  let enabled2 = null,
    current = -1,
    requestFrame2 = null,
    setTimer2 = null;
  const map = new Set();
  function hideNode(entry) {
    const el2 = getWrapper(entry)?.['__v2_timer_el'];
    if (el2) {
      el2['textContent'] = '';
      if (el2['style']['display'] !== 'none') el2['style']['display'] = 'none';
    }
    map['delete'](entry);
    if (map['size'] === 0) run();
  }
  function run() {
    if (requestFrame2 !== null) cancelFrame(requestFrame2);
    if (setTimer2 !== null) clearTimer(setTimer2);
    ((requestFrame2 = null), (setTimer2 = null));
  }
  function run2(record = updateIntervalMs) {
    if (map['size'] === 0 || requestFrame2 !== null || setTimer2 !== null) return;
    const run3 = () => {
        setTimer2 = null;
        if (map['size'] === 0) return;
        requestFrame2 = requestFrame(run4);
      },
      count = Math['max'](0, Number(record) || 0);
    if (count > 0) setTimer2 = setTimer(run3, count);
    else run3();
  }
  function trackNode(payload, handle) {
    if (isRunningTimerNode(handle)) {
      (map['add'](payload), run2(0));
      return;
    }
    map['delete'](payload);
    if (map['size'] === 0) run();
  }
  function run5(state, config) {
    const el3 = getWrapper(state)?.['__v2_timer_el'];
    if (!el3) return;
    const formatRendererNodeTimerText2 = formatRendererNodeTimerText(
      config,
      now() - config['generationStartTime'],
    );
    setTimerText(el3, formatRendererNodeTimerText2);
    if (el3['style']['display'] === 'none') el3['style']['display'] = '';
  }
  function run4() {
    requestFrame2 = null;
    if (!enabled2 || map['size'] === 0) return;
    const list3 = [];
    for (const scope of map) {
      const enabled3 = enabled2['nodes']?.[scope];
      if (!enabled3 || !isRunningTimerNode(enabled3)) {
        list3['push'](scope);
        continue;
      }
      run5(scope, enabled3);
    }
    list3['forEach']((input) => hideNode(input));
    if (map['size'] > 0) run2();
  }
  function renderNode(output, value2, { selected: selected = false } = {}) {
    const el4 = getWrapper(output)?.['__v2_timer_el'];
    if (el4) {
      const isRunningTimerNode2 = isRunningTimerNode(value2),
        value3 = !isResolvedSourceMediaNode(value2) && typeof value2?.['generationDuration'] === 'number',
        value4 = isRunningTimerNode2 || value3,
        value5 = isRunningTimerNode2
          ? formatRendererNodeTimerText(value2, now() - value2['generationStartTime'])
          : value3
            ? formatRendererNodeTimerText(value2, value2['generationDuration'])
            : '';
      setTimerText(el4, value5);
      if (value4) {
        el4['style']['color'] = selected ? 'var(--text-primary)' : 'var(--white-40)';
        if (el4['style']['display'] === 'none') el4['style']['display'] = '';
      } else el4['style']['display'] !== 'none' && (el4['style']['display'] = 'none');
    }
    trackNode(output, value2);
  }
  function syncSnapshot(value6) {
    enabled2 = value6 || null;
    const value7 = Number['isFinite'](value6?.['_persistRev'])
      ? value6['_persistRev']
      : Number['isFinite'](value6?.['_nodeCount'])
        ? value6['_nodeCount']
        : 0;
    if (value7 === current) return;
    current = value7;
    const value8 = value6?.['nodes'] || {};
    for (const value9 of [...map]) {
      if (!isRunningTimerNode(value8[value9])) hideNode(value9);
    }
    for (const [value10, value11] of Object['entries'](value8)) {
      if (!isRunningTimerNode(value11)) continue;
      const value12 = String(value11?.['id'] || value10 || '')['trim']();
      value12 && (trackNode(value12, value11), run5(value12, value11));
    }
    if (map['size'] > 0) run2(0);
  }
  function clear() {
    (run(), map['clear'](), (current = -1), (enabled2 = null));
  }
  return {
    clear: clear,
    hideNode: hideNode,
    renderNode: renderNode,
    syncSnapshot: syncSnapshot,
    trackNode: trackNode,
  };
}
