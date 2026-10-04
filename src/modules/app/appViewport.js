import { createViewportFocusController } from '../../core/viewportFocus.js';
import { t } from '../../i18n/index.js';
import { CANVAS_LOW_ZOOM_LOD_THRESHOLD } from '../canvasImageLod.js';
import { installProviderIconLodController } from '../providerIconLod.js';
const TEXT_LOD_ZOOM = CANVAS_LOW_ZOOM_LOD_THRESHOLD,
  ZOOM_SLIDER_END_DELAY_MS = 160;
export function createAppViewport({
  graphStore: graphStore,
  uiStore: uiStore,
  wrap: wrap,
  debugEl: debugEl,
  zoomSliderEl: zoomSliderEl,
  zoomPercentEl: zoomPercentEl,
  fitActionEl: fitActionEl,
} = {}) {
  let enabled = false,
    requestAnimationFrame2 = null,
    value = 0,
    value2 = null,
    item = true,
    count = 0,
    setTimeout2 = null;
  const installProviderIconLodController2 = installProviderIconLodController({
    rootEl: wrap || document,
    store: graphStore,
  });
  // The offline banner used to send every user looking for a backend console, which only
  // exists when the server was started by hand from source. Pick the wording per environment.
  const serverAlertEl = document.getElementById('v2-server-disconnect-alert');
  if (serverAlertEl) {
    const alertKey = globalThis.window?.aiCanvasDesktop?.isElectron
      ? 'app.serverDisconnected'
      : 'app.serverDisconnectedDev';
    (serverAlertEl.setAttribute('data-i18n', alertKey), (serverAlertEl.textContent = t(alertKey)));
  }
  function run(key) {
    (document.body.classList.toggle('is-zoom-low', key), installProviderIconLodController2?.scheduleSync?.());
  }
  function run2(index) {
    const result = Math.round(((index - 0.2) / 1.8) * 100),
      data = Math.max(0, Math.min(result, 100));
    if (zoomPercentEl) zoomPercentEl.textContent = data + '%';
    if (zoomSliderEl) zoomSliderEl.value = String(data);
  }
  function run3(options) {
    if (item === options) return;
    item = options;
    const el = document.getElementById('v2-server-disconnect-alert');
    el && (el.style.display = options ? 'none' : 'block');
  }
  function run4() {
    const run5 =
      typeof window._v2UpdateSidePlusNow === 'function'
        ? window._v2UpdateSidePlusNow
        : window._v2UpdateSidePlus;
    if (typeof run5 !== 'function') return;
    const target = Number(window._lastMx),
      source = Number(window._lastMy);
    run5(Number.isFinite(target) ? target : undefined, Number.isFinite(source) ? source : undefined);
  }
  function run6() {
    document.body.classList.add('is-zooming');
    if (setTimeout2) clearTimeout(setTimeout2);
    setTimeout2 = setTimeout(() => {
      ((setTimeout2 = null), document.body.classList.remove('is-zooming'));
    }, ZOOM_SLIDER_END_DELAY_MS);
  }
  (graphStore.subscribeSelector(
    (next) => next.viewport?.zoom,
    (current) => {
      if (typeof current !== 'number') return;
      if (!enabled) run2(current);
      const entry = current <= TEXT_LOD_ZOOM;
      enabled ? (value2 = entry) : ((value2 = null), run(entry));
    },
  ),
    uiStore.subscribeSelector(
      (record) => record.isServerConnected,
      (payload) => {
        run3(payload);
      },
    ),
    graphStore.subscribeSelector(
      (handle) => {
        const box = handle.viewport ?? {},
          state = Number(box.x) || 0,
          config = Number(box.y) || 0,
          scope = Number(box.zoom) || 1,
          input = handle._nodeCount ?? Object.keys(handle.nodes || {}).length;
        return state + '|' + config + '|' + scope + '|' + input;
      },
      (output) => {
        if (!debugEl) return;
        const value3 = performance.now();
        if (value3 - count < 120) return;
        count = value3;
        const [value4, value5, value6, value7] = String(output || '').split('|'),
          value8 = Number(value4) || 0,
          value9 = Number(value5) || 0,
          value10 = Number(value6) || 1,
          value11 = Number(value7) || 0;
        debugEl.textContent =
          'V2 Sandbox | Nodes: ' +
          value11 +
          ' | x: ' +
          value8.toFixed(0) +
          ' y: ' +
          value9.toFixed(0) +
          ' z: ' +
          value10.toFixed(2) +
          ' ';
      },
    ));
  function animateViewport(value12, value13, value14, value15, value16, value17, value18 = 0x320) {
    requestAnimationFrame2 !== null &&
      (cancelAnimationFrame(requestAnimationFrame2), (requestAnimationFrame2 = null));
    const value19 = ++value,
      value20 = performance.now();
    ((enabled = true), document.body.classList.add('is-viewport-animating'));
    const run7 = (value21) => 1 - Math.pow(1 - value21, 3);
    function run8(value22) {
      if (value19 !== value) return;
      const value23 = value22 - value20,
        count2 = Math.min(value23 / value18, 1),
        value24 = run7(count2);
      (graphStore.updateViewport(
        value12 + (value15 - value12) * value24,
        value13 + (value16 - value13) * value24,
        value14 + (value17 - value14) * value24,
      ),
        run4());
      if (count2 < 1) {
        requestAnimationFrame2 = requestAnimationFrame(run8);
        return;
      }
      ((requestAnimationFrame2 = null),
        (enabled = false),
        document.body.classList.remove('is-viewport-animating'),
        value2 !== null && (run(value2), (value2 = null)),
        graphStore.markViewportPersist?.(),
        run2(graphStore.getState().viewport.zoom),
        run4());
    }
    requestAnimationFrame2 = requestAnimationFrame(run8);
  }
  function cancelAnimation() {
    (requestAnimationFrame2 !== null &&
      (cancelAnimationFrame(requestAnimationFrame2), (requestAnimationFrame2 = null)),
      (value += 1),
      (enabled = false),
      document.body.classList.remove('is-viewport-animating'),
      value2 !== null && (run(value2), (value2 = null)));
  }
  const viewportFocusController = createViewportFocusController({
    store: graphStore,
    animateViewport: animateViewport,
    cancelAnimation: cancelAnimation,
    containerEl: wrap,
  });
  return (
    zoomSliderEl &&
      zoomSliderEl.addEventListener('input', (event) => {
        const value25 = parseInt(event.target.value, 10),
          value26 = 0.2 + (value25 / 100) * 1.8,
          { viewport: viewport } = graphStore.getState();
        (viewportFocusController?.clearTrackedFocus('zoom-slider'), run6());
        if (zoomPercentEl) zoomPercentEl.textContent = value25 + '%';
        const value27 = window.innerWidth / 2,
          value28 = window.innerHeight / 2,
          value29 = value27 - (value27 - viewport.x) * (value26 / viewport.zoom),
          value30 = value28 - (value28 - viewport.y) * (value26 / viewport.zoom);
        graphStore.updateViewport(value29, value30, value26);
      }),
    fitActionEl?.addEventListener('click', () => {
      const value31 = Object.keys(graphStore.getState().nodes || {});
      viewportFocusController?.focusNodes(value31, 80, 0x320);
    }),
    {
      animateViewport: animateViewport,
      cancelViewportAnimation: cancelAnimation,
      focusNode: (...args) => viewportFocusController?.focusNode(...args),
      focusNodeAtZoomPercent: (...args2) => viewportFocusController?.focusNodeAtZoomPercent(...args2),
      focusNodes: (...args3) => viewportFocusController?.focusNodes(...args3),
      clearTrackedFocus: (...args4) => viewportFocusController?.clearTrackedFocus(...args4),
      installWindowBindings(value32 = window) {
        ((value32.v2AnimateViewport = animateViewport),
          (value32.v2FocusOnNode = (value33, value34 = 120, value35 = 0x5dc, value36) =>
            viewportFocusController?.focusNode(value33, value34, value35, value36)),
          (value32.v2FocusOnNodeAtZoomPercent = (value37, value38 = 60, value39 = 0x320) =>
            viewportFocusController?.focusNodeAtZoomPercent(value37, value38, value39)),
          (value32.v2FocusOnNodes = (value40, value41 = 80, value42 = 0x320, value43) =>
            viewportFocusController?.focusNodes(value40, value41, value42, value43)));
      },
    }
  );
}
