import {
  getPerfProbeSnapshot,
  isPerfProbeEnabled,
  resetPerfProbeData,
  setPerfProbeEnabled,
} from './perfProbe.js';
const PERF_PANEL_ID = 'perfProbePanel',
  REFRESH_INTERVAL_MS = 500;
function getDefaultDocument() {
  if (typeof document === 'undefined') return null;
  return document;
}
function getDefaultWindow() {
  if (typeof window === 'undefined') return null;
  return window;
}
function toFiniteNumber(value, item = null) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function asArray(index) {
  return Array.isArray(index) ? index : [];
}
function latestSample(result) {
  const list = asArray(result);
  return list.length > 0 ? list[list.length - 1] : null;
}
function averageField(data, options) {
  const list2 = asArray(data)
    .map((item2) => toFiniteNumber(item2?.[options]))
    .filter((count) => count !== null && count >= 0);
  if (list2.length === 0) return null;
  return list2.reduce((item3, target) => item3 + target, 0) / list2.length;
}
function formatMs(source) {
  const toFiniteNumber2 = toFiniteNumber(source);
  if (toFiniteNumber2 === null) return '-';
  if (toFiniteNumber2 === 0) return '0 ms';
  return toFiniteNumber2.toFixed(toFiniteNumber2 >= 10 ? 1 : 2) + ' ms';
}
function formatFps(next) {
  const toFiniteNumber3 = toFiniteNumber(next);
  if (toFiniteNumber3 === null) return '-';
  return toFiniteNumber3.toFixed(toFiniteNumber3 >= 100 ? 0 : 1) + ' fps';
}
function formatCount(current) {
  const toFiniteNumber4 = toFiniteNumber(current);
  if (toFiniteNumber4 === null) return '-';
  return String(Math.round(toFiniteNumber4));
}
function formatDurationWithAverage(entry, enabled) {
  if (!enabled) return '-';
  const averageField2 = averageField(entry, 'durationMs');
  return formatMs(enabled.durationMs) + ' / avg ' + formatMs(averageField2);
}
function formatFpsSession(enabled2) {
  if (!enabled2) return '-';
  return formatFps(enabled2.avgFps) + ' / ' + formatCount(enabled2.frameCount) + ' frames';
}
export function formatPerfPanelRows(value2 = {}) {
  const asArray2 = asArray(value2.renderFrameSamples),
    asArray3 = asArray(value2.edgeRedrawSamples),
    asArray4 = asArray(value2.canvasPanSamples),
    asArray5 = asArray(value2.minimapUpdateSamples),
    asArray6 = asArray(value2.virtualizationSamples),
    latestSample2 = latestSample(asArray2),
    value3 = latestSample(asArray3),
    value4 = latestSample(asArray4),
    value5 = latestSample(asArray5),
    value6 = latestSample(asArray6),
    latestSample3 = latestSample(value2.panFpsSessions),
    latestSample4 = latestSample(value2.zoomFpsSessions),
    latestSample5 = latestSample(value2.dragFpsSessions),
    latestSample6 = latestSample(value2.resizeFpsSessions),
    record = latestSample2 || value4 || {},
    payload = value2.staticMediaResourceSummary || {},
    handle = value2.mediaSchedulerStats || {};
  return [
    { label: 'Probe', value: value2.enabled === true ? 'on' : 'off' },
    { label: 'Render', value: formatDurationWithAverage(asArray2, latestSample2) },
    {
      label: 'Startup',
      value:
        'visual ' +
        formatMs(value2.firstVisualMs) +
        ' / interactive ' +
        formatMs(value2.firstInteractiveMs) +
        ' / max long ' +
        formatMs(value2.maxLongTaskMs),
    },
    {
      label: 'Nodes',
      value: formatCount(record.mountedNodeCount) + ' mounted / ' + formatCount(record.nodeCount) + ' total',
    },
    {
      label: 'Edges',
      value: value3
        ? formatDurationWithAverage(asArray3, value3) +
          ' / ' +
          formatCount(value3.visibleEdgeCount) +
          ' visible'
        : '-',
    },
    {
      label: 'Pan',
      value: value4
        ? formatDurationWithAverage(asArray4, value4) + ' / ' + formatCount(value4.moveCount) + ' moves'
        : '-',
    },
    { label: 'Pan FPS', value: formatFpsSession(latestSample3) },
    { label: 'Zoom FPS', value: formatFpsSession(latestSample4) },
    { label: 'Drag FPS', value: formatFpsSession(latestSample5 || latestSample6) },
    {
      label: 'Minimap',
      value: value5
        ? formatDurationWithAverage(asArray5, value5) + ' / ' + formatCount(value5.dotCount) + ' dots'
        : '-',
    },
    {
      label: 'Virtualize',
      value: value6
        ? (value6.spatialIndex ? 'index' : 'scan') +
          ' / ' +
          formatCount(value6.mountCandidateCount) +
          ' mount / ' +
          formatCount(value6.parkCandidateCount) +
          ' park'
        : '-',
    },
    {
      label: 'Preview',
      value:
        formatCount(latestSample2?.fastPreviewCount) +
        ' fast / ' +
        formatCount(latestSample2?.visibleFastPreviewCount) +
        ' visible / ' +
        formatCount(latestSample2?.previewWithMediaCount) +
        ' media / ' +
        formatCount(latestSample2?.deferredMountedWithPreviewCount) +
        ' deferred',
    },
    {
      label: 'Media Queue',
      value:
        formatCount(handle.imagePreloadActive) +
        ' active / ' +
        formatCount(handle.imagePreloadQueued) +
        ' queued / ' +
        formatCount(handle.imagePreloadDeduped) +
        ' dedupe / ' +
        formatCount(handle.imagePreloadPromoted) +
        ' promote / ' +
        formatCount(handle.imagePreloadCanceled) +
        ' cancel / ' +
        (handle.imagePreloadPaused === true ? 'paused' : 'live'),
    },
    {
      label: 'Media',
      value:
        formatCount(payload.staticMediaCount) +
        ' static / ' +
        formatCount(payload.derivedMediaCount) +
        ' thumbs / ' +
        formatCount(payload.cacheHitLikeCount) +
        ' cached / ' +
        formatCount(payload.imageRequestCount) +
        ' img req / ' +
        formatCount(payload.mp4RequestCount) +
        ' mp4 / ' +
        formatCount(payload.videoElementCount) +
        ' video els',
    },
  ];
}
function createTextElement(el, state, config, scope) {
  const el2 = el.createElement(state);
  return ((el2.className = config), (el2.textContent = scope), el2);
}
function createPanelButton(el3, input, output, value7) {
  const el4 = el3.createElement('button');
  return (
    (el4.type = 'button'),
    (el4.className = input),
    (el4.title = value7),
    el4.setAttribute('aria-label', value7),
    (el4.textContent = output),
    el4
  );
}
function createPerfPanel(el5) {
  const el6 = el5.createElement('section');
  ((el6.id = PERF_PANEL_ID),
    (el6.className = 'perf-panel'),
    (el6.hidden = true),
    el6.setAttribute('aria-label', 'Performance panel'),
    el6.setAttribute('aria-live', 'polite'));
  const el7 = el5.createElement('div');
  el7.className = 'perf-panel-head';
  const textElement = createTextElement(el5, 'div', 'perf-panel-title', 'Perf'),
    el8 = el5.createElement('div');
  el8.className = 'perf-panel-actions';
  const resetBtn = createPanelButton(el5, 'perf-panel-action', 'Reset', 'Reset performance samples'),
    closeBtn = createPanelButton(
      el5,
      'perf-panel-action perf-panel-action-close',
      'Close',
      'Close performance panel',
    );
  (el8.appendChild(resetBtn), el8.appendChild(closeBtn), el7.appendChild(textElement), el7.appendChild(el8));
  const grid = el5.createElement('div');
  return (
    (grid.className = 'perf-panel-grid'),
    el6.appendChild(el7),
    el6.appendChild(grid),
    (el6.__perfPanelParts = { grid: grid, resetBtn: resetBtn, closeBtn: closeBtn, rows: [] }),
    el5.body?.appendChild(el6),
    el6
  );
}
function ensurePerfPanel(value8) {
  const el9 = value8.getElementById(PERF_PANEL_ID);
  if (el9?.__perfPanelParts) return el9;
  return (el9?.remove(), createPerfPanel(value8));
}
function renderPerfPanel(value9, list3) {
  const enabled3 = value9.__perfPanelParts;
  if (!enabled3?.grid) return;
  const el10 = value9.ownerDocument;
  while (enabled3.rows.length < list3.length) {
    const row = el10.createElement('div');
    row.className = 'perf-panel-row';
    const label = createTextElement(el10, 'span', 'perf-panel-row-label', ''),
      value10 = createTextElement(el10, 'span', 'perf-panel-row-value', '');
    (row.appendChild(label),
      row.appendChild(value10),
      enabled3.grid.appendChild(row),
      enabled3.rows.push({ row: row, label: label, value: value10 }));
  }
  while (enabled3.rows.length > list3.length) {
    const value11 = enabled3.rows.pop();
    value11?.row?.remove();
  }
  list3.forEach((el11, value12) => {
    const el12 = enabled3.rows[value12];
    ((el12.label.textContent = el11.label), (el12.value.textContent = el11.value));
  });
}
export function initPerfPanelDevEntry({
  button: button,
  documentRef: documentRef = getDefaultDocument(),
  windowRef: windowRef = getDefaultWindow(),
} = {}) {
  if (!button || !documentRef || !windowRef) return null;
  let enabled4 = false,
    value13 = null,
    isPerfProbeEnabled2 = false,
    value14 = false;
  const el13 = ensurePerfPanel(documentRef),
    value15 = el13.__perfPanelParts;
  function run() {
    return windowRef.DEV_MODE === true || documentRef.body?.classList?.contains('dev-mode') === true;
  }
  function run2(value16) {
    (button.classList.toggle('is-active', value16 === true),
      button.setAttribute('aria-pressed', value16 === true ? 'true' : 'false'),
      (button.title = value16 === true ? 'Close performance panel' : 'Open performance panel'),
      button.setAttribute('aria-label', button.title));
  }
  function refresh() {
    if (!enabled4) return;
    renderPerfPanel(el13, formatPerfPanelRows(getPerfProbeSnapshot()));
  }
  function run3() {
    if (value13 !== null) return;
    const run4 = windowRef.setInterval?.bind(windowRef) || setInterval;
    value13 = run4(refresh, REFRESH_INTERVAL_MS);
  }
  function run5() {
    if (value13 === null) return;
    const run6 = windowRef.clearInterval?.bind(windowRef) || clearInterval;
    (run6(value13), (value13 = null));
  }
  function setVisible(value17) {
    const value18 = value17 === true && run();
    if (value18 === enabled4) {
      if (enabled4) refresh();
      return enabled4;
    }
    return (
      (enabled4 = value18),
      (el13.hidden = !enabled4),
      run2(enabled4),
      enabled4
        ? ((isPerfProbeEnabled2 = isPerfProbeEnabled()),
          (value14 = true),
          setPerfProbeEnabled(true),
          refresh(),
          run3())
        : (run5(),
          value14 &&
            (setPerfProbeEnabled(isPerfProbeEnabled2), (value14 = false), (isPerfProbeEnabled2 = false))),
      enabled4
    );
  }
  function run7(event) {
    (event?.preventDefault?.(), setVisible(!enabled4));
  }
  function run8() {
    (resetPerfProbeData(), refresh());
  }
  function run9() {
    setVisible(false);
  }
  function run10(value19) {
    const enabled5 = Boolean(value19?.detail?.enabled ?? windowRef.DEV_MODE);
    if (!enabled5) setVisible(false);
  }
  return (
    button.addEventListener('click', run7),
    value15?.resetBtn?.addEventListener('click', run8),
    value15?.closeBtn?.addEventListener('click', run9),
    windowRef.addEventListener?.('dev-mode-changed', run10),
    run2(false),
    {
      isVisible() {
        return enabled4;
      },
      refresh: refresh,
      setVisible: setVisible,
      destroy() {
        (setVisible(false),
          button.removeEventListener('click', run7),
          value15?.resetBtn?.removeEventListener('click', run8),
          value15?.closeBtn?.removeEventListener('click', run9),
          windowRef.removeEventListener?.('dev-mode-changed', run10),
          el13.remove());
      },
    }
  );
}
