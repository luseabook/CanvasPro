import {
  getPerfProbeSnapshot,
  isPerfProbeEnabled,
  resetPerfProbeData,
  setPerfProbeEnabled,
} from './perfProbe.js';
const PERF_PANEL_ID = 'perfProbePanel',
  REFRESH_INTERVAL_MS = 0x1f4;
function getDefaultDocument() {
  if (typeof document === 'undefined') return null;
  return document;
}
function getDefaultWindow() {
  if (typeof window === 'undefined') return null;
  return window;
}
function toFiniteNumber(_0x156e53, _0x18b682 = null) {
  const _0x201053 = Number(_0x156e53);
  return Number.isFinite(_0x201053) ? _0x201053 : _0x18b682;
}
function asArray(_0x3dd3fb) {
  return Array.isArray(_0x3dd3fb) ? _0x3dd3fb : [];
}
function latestSample(_0x55cbe9) {
  const _0x4d4a4a = asArray(_0x55cbe9);
  return _0x4d4a4a.length > 0 ? _0x4d4a4a[_0x4d4a4a.length - 1] : null;
}
function averageField(_0x516a16, _0x5d412d) {
  const _0x36905e = asArray(_0x516a16)
    .map((_0x1c3276) => toFiniteNumber(_0x1c3276?.[_0x5d412d]))
    .filter((_0x19086b) => _0x19086b !== null && _0x19086b >= 0);
  if (_0x36905e.length === 0) return null;
  return _0x36905e.reduce((_0x129b2c, _0x3a2a12) => _0x129b2c + _0x3a2a12, 0) / _0x36905e.length;
}
function formatMs(_0x293f86) {
  const _0x35ad44 = toFiniteNumber(_0x293f86);
  if (_0x35ad44 === null) return '-';
  if (_0x35ad44 === 0) return '0 ms';
  return _0x35ad44.toFixed(_0x35ad44 >= 10 ? 1 : 2) + ' ms';
}
function formatFps(_0xcc15bb) {
  const _0x4e99a3 = toFiniteNumber(_0xcc15bb);
  if (_0x4e99a3 === null) return '-';
  return _0x4e99a3.toFixed(_0x4e99a3 >= 100 ? 0 : 1) + ' fps';
}
function formatCount(_0x447cd6) {
  const _0x6bef9a = toFiniteNumber(_0x447cd6);
  if (_0x6bef9a === null) return '-';
  return String(Math.round(_0x6bef9a));
}
function formatDurationWithAverage(_0x5eb8a8, _0x1ce280) {
  if (!_0x1ce280) return '-';
  const _0x42773a = averageField(_0x5eb8a8, 'durationMs');
  return formatMs(_0x1ce280.durationMs) + ' / avg ' + formatMs(_0x42773a);
}
function formatFpsSession(_0x5d0900) {
  if (!_0x5d0900) return '-';
  return formatFps(_0x5d0900.avgFps) + ' / ' + formatCount(_0x5d0900.frameCount) + ' frames';
}
export function formatPerfPanelRows(_0x26b921 = {}) {
  const _0x5bd97f = asArray(_0x26b921.renderFrameSamples),
    _0x4d5997 = asArray(_0x26b921.edgeRedrawSamples),
    _0x25535b = asArray(_0x26b921.canvasPanSamples),
    _0x57e1d9 = asArray(_0x26b921.minimapUpdateSamples),
    _0x25f0c2 = asArray(_0x26b921.virtualizationSamples),
    _0x9226cc = latestSample(_0x5bd97f),
    _0x6d518d = latestSample(_0x4d5997),
    _0x479e6a = latestSample(_0x25535b),
    _0x223b6c = latestSample(_0x57e1d9),
    _0x51e05a = latestSample(_0x25f0c2),
    _0x13a513 = latestSample(_0x26b921.panFpsSessions),
    _0x488709 = latestSample(_0x26b921.zoomFpsSessions),
    _0x134b68 = latestSample(_0x26b921.dragFpsSessions),
    _0x54aab5 = latestSample(_0x26b921.resizeFpsSessions),
    _0x32f19d = _0x9226cc || _0x479e6a || {},
    _0x39341b = _0x26b921.staticMediaResourceSummary || {},
    _0x2e6b46 = _0x26b921.mediaSchedulerStats || {};
  return [
    { label: 'Probe', value: _0x26b921.enabled === true ? 'on' : 'off' },
    { label: 'Render', value: formatDurationWithAverage(_0x5bd97f, _0x9226cc) },
    {
      label: 'Startup',
      value:
        'visual ' +
        formatMs(_0x26b921.firstVisualMs) +
        ' / interactive ' +
        formatMs(_0x26b921.firstInteractiveMs) +
        ' / max long ' +
        formatMs(_0x26b921.maxLongTaskMs),
    },
    {
      label: 'Nodes',
      value:
        formatCount(_0x32f19d.mountedNodeCount) + ' mounted / ' + formatCount(_0x32f19d.nodeCount) + ' total',
    },
    {
      label: 'Edges',
      value: _0x6d518d
        ? formatDurationWithAverage(_0x4d5997, _0x6d518d) +
          ' / ' +
          formatCount(_0x6d518d.visibleEdgeCount) +
          ' visible'
        : '-',
    },
    {
      label: 'Pan',
      value: _0x479e6a
        ? formatDurationWithAverage(_0x25535b, _0x479e6a) +
          ' / ' +
          formatCount(_0x479e6a.moveCount) +
          ' moves'
        : '-',
    },
    { label: 'Pan FPS', value: formatFpsSession(_0x13a513) },
    { label: 'Zoom FPS', value: formatFpsSession(_0x488709) },
    { label: 'Drag FPS', value: formatFpsSession(_0x134b68 || _0x54aab5) },
    {
      label: 'Minimap',
      value: _0x223b6c
        ? formatDurationWithAverage(_0x57e1d9, _0x223b6c) + ' / ' + formatCount(_0x223b6c.dotCount) + ' dots'
        : '-',
    },
    {
      label: 'Virtualize',
      value: _0x51e05a
        ? (_0x51e05a.spatialIndex ? 'index' : 'scan') +
          ' / ' +
          formatCount(_0x51e05a.mountCandidateCount) +
          ' mount / ' +
          formatCount(_0x51e05a.parkCandidateCount) +
          ' park'
        : '-',
    },
    {
      label: 'Preview',
      value:
        formatCount(_0x9226cc?.fastPreviewCount) +
        ' fast / ' +
        formatCount(_0x9226cc?.visibleFastPreviewCount) +
        ' visible / ' +
        formatCount(_0x9226cc?.previewWithMediaCount) +
        ' media / ' +
        formatCount(_0x9226cc?.deferredMountedWithPreviewCount) +
        ' deferred',
    },
    {
      label: 'Media Queue',
      value:
        formatCount(_0x2e6b46.imagePreloadActive) +
        ' active / ' +
        formatCount(_0x2e6b46.imagePreloadQueued) +
        ' queued / ' +
        formatCount(_0x2e6b46.imagePreloadDeduped) +
        ' dedupe / ' +
        formatCount(_0x2e6b46.imagePreloadPromoted) +
        ' promote / ' +
        formatCount(_0x2e6b46.imagePreloadCanceled) +
        ' cancel / ' +
        (_0x2e6b46.imagePreloadPaused === true ? 'paused' : 'live'),
    },
    {
      label: 'Media',
      value:
        formatCount(_0x39341b.staticMediaCount) +
        ' static / ' +
        formatCount(_0x39341b.derivedMediaCount) +
        ' thumbs / ' +
        formatCount(_0x39341b.cacheHitLikeCount) +
        ' cached / ' +
        formatCount(_0x39341b.imageRequestCount) +
        ' img req / ' +
        formatCount(_0x39341b.mp4RequestCount) +
        ' mp4 / ' +
        formatCount(_0x39341b.videoElementCount) +
        ' video els',
    },
  ];
}
function createTextElement(_0x32ba50, _0x5dbc82, _0x3806f3, _0x4b2b61) {
  const _0x46acb4 = _0x32ba50.createElement(_0x5dbc82);
  return ((_0x46acb4.className = _0x3806f3), (_0x46acb4.textContent = _0x4b2b61), _0x46acb4);
}
function createPanelButton(_0x3bc06a, _0x3794c3, _0x7660b5, _0x5d55d3) {
  const _0x3b35bc = _0x3bc06a.createElement('button');
  return (
    (_0x3b35bc.type = 'button'),
    (_0x3b35bc.className = _0x3794c3),
    (_0x3b35bc.title = _0x5d55d3),
    _0x3b35bc.setAttribute('aria-label', _0x5d55d3),
    (_0x3b35bc.textContent = _0x7660b5),
    _0x3b35bc
  );
}
function createPerfPanel(_0x2bd4d6) {
  const _0xf17811 = _0x2bd4d6.createElement('section');
  ((_0xf17811.id = PERF_PANEL_ID),
    (_0xf17811.className = 'perf-panel'),
    (_0xf17811.hidden = true),
    _0xf17811.setAttribute('aria-label', 'Performance panel'),
    _0xf17811.setAttribute('aria-live', 'polite'));
  const _0x442957 = _0x2bd4d6.createElement('div');
  _0x442957.className = 'perf-panel-head';
  const _0x292bb1 = createTextElement(_0x2bd4d6, 'div', 'perf-panel-title', 'Perf'),
    _0x243695 = _0x2bd4d6.createElement('div');
  _0x243695.className = 'perf-panel-actions';
  const _0x190b8b = createPanelButton(_0x2bd4d6, 'perf-panel-action', 'Reset', 'Reset performance samples'),
    _0x405b09 = createPanelButton(
      _0x2bd4d6,
      'perf-panel-action perf-panel-action-close',
      'Close',
      'Close performance panel',
    );
  (_0x243695.appendChild(_0x190b8b),
    _0x243695.appendChild(_0x405b09),
    _0x442957.appendChild(_0x292bb1),
    _0x442957.appendChild(_0x243695));
  const _0x54eaad = _0x2bd4d6.createElement('div');
  return (
    (_0x54eaad.className = 'perf-panel-grid'),
    _0xf17811.appendChild(_0x442957),
    _0xf17811.appendChild(_0x54eaad),
    (_0xf17811.__perfPanelParts = { grid: _0x54eaad, resetBtn: _0x190b8b, closeBtn: _0x405b09, rows: [] }),
    _0x2bd4d6.body?.appendChild(_0xf17811),
    _0xf17811
  );
}
function ensurePerfPanel(_0x15b57d) {
  const _0x29aaea = _0x15b57d.getElementById(PERF_PANEL_ID);
  if (_0x29aaea?.__perfPanelParts) return _0x29aaea;
  return (_0x29aaea?.remove(), createPerfPanel(_0x15b57d));
}
function renderPerfPanel(_0x11f751, _0x123277) {
  const _0x4096d6 = _0x11f751.__perfPanelParts;
  if (!_0x4096d6?.grid) return;
  const _0x1e09ec = _0x11f751.ownerDocument;
  while (_0x4096d6.rows.length < _0x123277.length) {
    const _0x1f1f97 = _0x1e09ec.createElement('div');
    _0x1f1f97.className = 'perf-panel-row';
    const _0xb17e01 = createTextElement(_0x1e09ec, 'span', 'perf-panel-row-label', ''),
      _0x4e36ca = createTextElement(_0x1e09ec, 'span', 'perf-panel-row-value', '');
    (_0x1f1f97.appendChild(_0xb17e01),
      _0x1f1f97.appendChild(_0x4e36ca),
      _0x4096d6.grid.appendChild(_0x1f1f97),
      _0x4096d6.rows.push({ row: _0x1f1f97, label: _0xb17e01, value: _0x4e36ca }));
  }
  while (_0x4096d6.rows.length > _0x123277.length) {
    const _0x489f63 = _0x4096d6.rows.pop();
    _0x489f63?.row?.remove();
  }
  _0x123277.forEach((_0x90aac4, _0x3646f5) => {
    const _0x5efb1a = _0x4096d6.rows[_0x3646f5];
    ((_0x5efb1a.label.textContent = _0x90aac4.label), (_0x5efb1a.value.textContent = _0x90aac4.value));
  });
}
export function initPerfPanelDevEntry({
  button: _0x52ea2f,
  documentRef: documentRef = getDefaultDocument(),
  windowRef: windowRef = getDefaultWindow(),
} = {}) {
  if (!_0x52ea2f || !documentRef || !windowRef) return null;
  let _0x19cc0b = false,
    _0x503412 = null,
    _0x2f3d5c = false,
    _0xc594a6 = false;
  const _0x4098a4 = ensurePerfPanel(documentRef),
    _0x145e4a = _0x4098a4.__perfPanelParts;
  function _0x3fb7ff() {
    return windowRef.DEV_MODE === true || documentRef.body?.classList?.contains('dev-mode') === true;
  }
  function _0x37613e(_0x9d3dde) {
    (_0x52ea2f.classList.toggle('is-active', _0x9d3dde === true),
      _0x52ea2f.setAttribute('aria-pressed', _0x9d3dde === true ? 'true' : 'false'),
      (_0x52ea2f.title = _0x9d3dde === true ? 'Close performance panel' : 'Open performance panel'),
      _0x52ea2f.setAttribute('aria-label', _0x52ea2f.title));
  }
  function _0x59f781() {
    if (!_0x19cc0b) return;
    renderPerfPanel(_0x4098a4, formatPerfPanelRows(getPerfProbeSnapshot()));
  }
  function _0x5b6c96() {
    if (_0x503412 !== null) return;
    const _0x4064a4 = windowRef.setInterval?.bind(windowRef) || setInterval;
    _0x503412 = _0x4064a4(_0x59f781, REFRESH_INTERVAL_MS);
  }
  function _0x145ab5() {
    if (_0x503412 === null) return;
    const _0xbe573a = windowRef.clearInterval?.bind(windowRef) || clearInterval;
    (_0xbe573a(_0x503412), (_0x503412 = null));
  }
  function _0x1b610e(_0x337fa6) {
    const _0x26c5db = _0x337fa6 === true && _0x3fb7ff();
    if (_0x26c5db === _0x19cc0b) {
      if (_0x19cc0b) _0x59f781();
      return _0x19cc0b;
    }
    return (
      (_0x19cc0b = _0x26c5db),
      (_0x4098a4.hidden = !_0x19cc0b),
      _0x37613e(_0x19cc0b),
      _0x19cc0b
        ? ((_0x2f3d5c = isPerfProbeEnabled()),
          (_0xc594a6 = true),
          setPerfProbeEnabled(true),
          _0x59f781(),
          _0x5b6c96())
        : (_0x145ab5(),
          _0xc594a6 && (setPerfProbeEnabled(_0x2f3d5c), (_0xc594a6 = false), (_0x2f3d5c = false))),
      _0x19cc0b
    );
  }
  function _0x43cba6(_0x22b4a8) {
    (_0x22b4a8?.preventDefault?.(), _0x1b610e(!_0x19cc0b));
  }
  function _0x2ed6ae() {
    (resetPerfProbeData(), _0x59f781());
  }
  function _0x1f8fe0() {
    _0x1b610e(false);
  }
  function _0x33da84(_0x25c91a) {
    const _0x4d4eb3 = Boolean(_0x25c91a?.detail?.enabled ?? windowRef.DEV_MODE);
    if (!_0x4d4eb3) _0x1b610e(false);
  }
  return (
    _0x52ea2f.addEventListener('click', _0x43cba6),
    _0x145e4a?.resetBtn?.addEventListener('click', _0x2ed6ae),
    _0x145e4a?.closeBtn?.addEventListener('click', _0x1f8fe0),
    windowRef.addEventListener?.('dev-mode-changed', _0x33da84),
    _0x37613e(false),
    {
      isVisible() {
        return _0x19cc0b;
      },
      refresh: _0x59f781,
      setVisible: _0x1b610e,
      destroy() {
        (_0x1b610e(false),
          _0x52ea2f.removeEventListener('click', _0x43cba6),
          _0x145e4a?.resetBtn?.removeEventListener('click', _0x2ed6ae),
          _0x145e4a?.closeBtn?.removeEventListener('click', _0x1f8fe0),
          windowRef.removeEventListener?.('dev-mode-changed', _0x33da84),
          _0x4098a4.remove());
      },
    }
  );
}
