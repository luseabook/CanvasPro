import { clearRendererCache } from '../core/renderer.js';
import { warmupCanvasVisibleMedia } from '../core/canvasMediaWarmup.js';
import { commit } from './history.js';
import appStore from '../core/stores/appStore.js';
import { isGenerationTaskTerminalStatus } from '../core/generationTaskLifecycle.js';
import { startVideoThumbBackfill } from './videoThumbBackfill.js';
import { sanitizeMultiCanvasDataForPersistence } from '../utils/thumbnailPersistence.js';
import { createStableSignature } from '../utils/stableSignature.js';
import { flushAllPendingPromptHtmlCommits } from './nodePromptShared.js';
import {
  captureCanvasVisualSnapshot,
  captureCanvasVisualSnapshotFromElectron,
  hideCanvasVisualSnapshotOverlay,
  normalizeCanvasVisualSnapshot,
} from './canvasVisualSnapshot.js';
import { t } from '../i18n/index.js';
function canvasTabsText(value, item = {}) {
  return t('canvasTabs.' + value, item);
}
function markPerf(key) {
  if (typeof performance?.mark !== 'function') return;
  performance.mark(key);
}
function measurePerf(index, result, data) {
  if (typeof performance?.measure !== 'function') return;
  try {
    performance.measure(index, result, data);
  } catch {}
}
const CANVAS_MEDIA_WARMUP_OPEN_DELAY_MS = 0x15e,
  CANVAS_MEDIA_WARMUP_OPEN_MAX_JOBS = 96,
  CANVAS_MEDIA_WARMUP_SNAPSHOT_MAX_JOBS = 48;
function createEmptyCanvasSnapshot() {
  return { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1.1 }, assets: [], _persistRevHint: 0 };
}
function cloneMultiDataSnapshot(options) {
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(options);
    } catch {}
  try {
    return JSON.parse(JSON.stringify(options));
  } catch {
    return { canvases: [], activeCanvasId: null };
  }
}
function isRecoverableTaskStatus(target) {
  const enabled = String(target || '').trim();
  return !enabled || !isGenerationTaskTerminalStatus(enabled);
}
function markRecoveringGenerationNode(args) {
  if (!args || typeof args !== 'object') return args;
  if (!args.generationStartTime || args.generationDuration != null) return args;
  const source = { ...args };
  let enabled2 = false;
  String(source.rhTaskId || '').trim() &&
    isRecoverableTaskStatus(source.rhTaskStatus) &&
    ((source.rhTaskRecovering = true), (enabled2 = true));
  String(source.dreaminaSubmitId || '').trim() &&
    isRecoverableTaskStatus(source.dreaminaTaskStatus) &&
    isRecoverableTaskStatus(source.dreaminaTaskPhase) &&
    ((source.dreaminaTaskRecovering = true), (enabled2 = true));
  String(source.asyncTaskId || '').trim() &&
    isRecoverableTaskStatus(source.asyncTaskStatus) &&
    ((source.asyncTaskRecovering = true), (enabled2 = true));
  if (!enabled2) return args;
  return (
    (source.isGenerating = true),
    (source.jobStatus = isRecoverableTaskStatus(source.jobStatus) ? 'running' : source.jobStatus),
    (source.generationDuration = null),
    source
  );
}
function markRecoveringGenerationSnapshot(nodes) {
  if (!nodes || typeof nodes !== 'object') return nodes;
  if (Array.isArray(nodes.nodes))
    return {
      ...nodes,
      nodes: nodes.nodes.map((item2) => markRecoveringGenerationNode(item2)),
    };
  if (nodes.nodes && typeof nodes.nodes === 'object')
    return {
      ...nodes,
      nodes: Object.fromEntries(
        Object.entries(nodes.nodes).map(([next, current]) => [next, markRecoveringGenerationNode(current)]),
      ),
    };
  return nodes;
}
function getCanvasNodesList(options2 = {}) {
  const entry = options2?.nodes;
  if (Array.isArray(entry)) return entry;
  if (entry && typeof entry === 'object') return Object.values(entry);
  return [];
}
function hasLiveGenerationNode(enabled3 = {}) {
  if (!enabled3 || typeof enabled3 !== 'object') return false;
  if (enabled3.isGenerating !== true || enabled3.generationDuration != null) return false;
  const list = [
    enabled3.jobStatus,
    enabled3.rhTaskStatus,
    enabled3.dreaminaTaskStatus,
    enabled3.dreaminaTaskPhase,
    enabled3.asyncTaskStatus,
    enabled3.mediaTaskStatus,
  ];
  return !list.some((item3) => {
    const enabled4 = String(item3 || '')
      .trim()
      .toLowerCase();
    if (!enabled4 || enabled4 === 'idle') return false;
    return isGenerationTaskTerminalStatus(enabled4);
  });
}
function canvasHasLiveGeneration(options3 = {}) {
  return getCanvasNodesList(options3).some((item4) => hasLiveGenerationNode(item4));
}
export function buildTabsRenderSignature(list2 = [], record = null) {
  return (
    (record || '') +
    '::' +
    (Array.isArray(list2) ? list2 : [])
      .map((error) => (error?.id || '') + ':' + (error?.name || ''))
      .join('|')
  );
}
const CanvasTabManager = {
  _canvases: [],
  _activeId: null,
  _lastPersistRevByCanvas: new Map(),
  _savedSignatureByCanvas: new Map(),
  _lastTabsRenderSignature: '',
  _tabContainerBound: false,
  _visualSnapshotBackfillTimers: [],
  _mediaWarmupTimer: null,
  _getStorePersistRev() {
    return Number(appStore.getStateRaw()?._persistRev || 0);
  },
  _rememberCanvasPersistRev(enabled5 = this._activeId) {
    if (!enabled5) return;
    this._lastPersistRevByCanvas.set(enabled5, this._getStorePersistRev());
  },
  _scheduleWorkspaceCacheSave() {
    return window._triggerLocalCacheSave?.();
  },
  _scheduleWorkspaceMetaCacheSave() {
    return window._triggerLocalCacheMetaSave?.() ?? window._triggerLocalCacheSave?.();
  },
  _markCanvasMetaDirty() {
    return this._scheduleWorkspaceMetaCacheSave();
  },
  _notifyDirtyStateChanged() {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    if (typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('aicanvas:dirty-state-changed'));
      return;
    }
    typeof Event === 'function' && window.dispatchEvent(new Event('aicanvas:dirty-state-changed'));
  },
  _getTabsRenderSignature() {
    return buildTabsRenderSignature(this._canvases, this._activeId);
  },
  _buildCanvasStructureDigest(payload, handle) {
    const list3 = Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object'
        ? Object.values(payload)
        : [];
    let state = '' + list3.length;
    for (const enabled6 of list3) {
      if (!enabled6 || typeof enabled6 !== 'object') continue;
      state += '|';
      for (const config of handle) {
        state += String(enabled6[config] ?? '') + ',';
      }
    }
    return state;
  },
  _buildCanvasSavedSignature(id) {
    const box = id?.viewport && typeof id.viewport === 'object' ? id.viewport : { x: 0, y: 0, zoom: 1.1 },
      persistRevHint = Number.isFinite(id?._persistRevHint) ? Number(id._persistRevHint) : 0;
    return createStableSignature({
      id: id?.id ?? null,
      name: id?.name ?? '未命名画布',
      persistRevHint: persistRevHint,
      viewport: {
        x: Number(box.x) || 0,
        y: Number(box.y) || 0,
        zoom: Number(box.zoom) || 1.1,
      },
      nodes: this._buildCanvasStructureDigest(id?.nodes, [
        'id',
        'type',
        'x',
        'y',
        'width',
        'height',
        'parentId',
      ]),
      edges: this._buildCanvasStructureDigest(id?.edges, ['id', 'sourceId', 'targetId']),
      assets: this._buildCanvasStructureDigest(id?.assets, ['id', 'type', 'localPath']),
    });
  },
  _resetSavedCanvasSignatures({ markClean: markClean = true } = {}) {
    this._savedSignatureByCanvas = new Map();
    if (!markClean) return;
    this._canvases.forEach((enabled7) => {
      if (!enabled7?.id) return;
      this._savedSignatureByCanvas.set(enabled7.id, this._buildCanvasSavedSignature(enabled7));
    });
  },
  _removeTabContextMenu() {
    const el = document.getElementById('tab-context-menu');
    if (el) el.remove();
  },
  _startTabRename(el2) {
    if (!el2) return;
    ((el2.contentEditable = 'true'), el2.focus());
    const scope = document.createRange();
    scope.selectNodeContents(el2);
    const enabled8 = window.getSelection?.();
    if (!enabled8) return;
    (enabled8.removeAllRanges(), enabled8.addRange(scope));
  },
  _commitTabRename(el3, { deferRender: deferRender = false } = {}) {
    if (!el3) return;
    const el4 = el3.closest('.canvas-tab'),
      enabled9 = el4?.dataset?.id;
    if (!enabled9) return;
    const error2 = this._canvases.find((item5) => item5.id === enabled9);
    if (!error2) return;
    const input = error2.name,
      output = String(el3.textContent || '').trim();
    ((el3.contentEditable = 'false'),
      this.renameCanvas(enabled9, output),
      (el3.textContent = this._canvases.find((item6) => item6.id === enabled9)?.name || input));
    if (deferRender) {
      window.setTimeout(() => this.renderTabs(), 0);
      return;
    }
    this.renderTabs();
  },
  _bindTabContainerEvents(el5) {
    if (this._tabContainerBound || !el5) return;
    this._tabContainerBound = true;
    let value2 = '',
      count = 0;
    const run = (event) => {
        const el6 = event.target.closest('.canvas-tab');
        if (!el6 || !el5.contains(el6)) return '';
        return el6.dataset.id || '';
      },
      handler = (event2) => {
        if (event2.button !== 1) return false;
        const enabled10 = run(event2);
        if (!enabled10) return false;
        return (
          event2.preventDefault(),
          event2.stopPropagation(),
          (value2 = enabled10),
          (count = Date.now()),
          void this.deleteCanvas(enabled10),
          true
        );
      };
    (el5.addEventListener('click', (event3) => {
      const el7 = event3.target.closest('.canvas-tab');
      if (!el7 || !el5.contains(el7)) return;
      const enabled11 = el7.dataset.id;
      if (!enabled11) return;
      const enabled12 = this._canvases.find((item7) => item7.id === enabled11);
      if (!enabled12) return;
      const value3 = event3.target.closest('.canvas-tab-close');
      if (value3) {
        (event3.stopPropagation(), void this.deleteCanvas(enabled11));
        return;
      }
      const value4 = el7.querySelector('.canvas-tab-name'),
        value5 = enabled11 === this._activeId;
      if (value5) {
        if (value4?.contentEditable === 'true') return;
        this._startTabRename(value4);
        return;
      }
      this.switchTo(enabled11);
    }),
      el5.addEventListener('pointerdown', (value6) => {
        handler(value6);
      }),
      el5.addEventListener('auxclick', (event4) => {
        if (event4.button !== 1) return;
        const enabled13 = run(event4);
        if (!enabled13) return;
        (event4.preventDefault(), event4.stopPropagation());
        if (enabled13 === value2 && Date.now() - count < 0x320) return;
        ((value2 = enabled13), (count = Date.now()), void this.deleteCanvas(enabled13));
      }),
      el5.addEventListener('contextmenu', async (clientX2) => {
        const el8 = clientX2.target.closest('.canvas-tab');
        if (!el8 || !el5.contains(el8)) return;
        const enabled14 = el8.dataset.id;
        if (!enabled14) return;
        const enabled15 = this._canvases.find((item8) => item8.id === enabled14);
        if (!enabled15) return;
        (clientX2.preventDefault(), clientX2.stopPropagation());
        const run2 = () => {
          this._showTabContextMenu(enabled15, { clientX: clientX2.clientX, clientY: clientX2.clientY });
        };
        (enabled14 !== this._activeId && (await this.switchTo(enabled14)), run2());
      }),
      el5.addEventListener('focusout', (event5) => {
        const enabled16 = event5.target.closest('.canvas-tab-name');
        if (!enabled16 || !el5.contains(enabled16)) return;
        if (enabled16.contentEditable !== 'true') return;
        this._commitTabRename(enabled16, { deferRender: true });
      }),
      el5.addEventListener('keydown', (event6) => {
        const el9 = event6.target.closest('.canvas-tab-name');
        if (!el9 || !el5.contains(el9)) return;
        if (el9.contentEditable !== 'true') return;
        if (event6.key === 'Enter') {
          (event6.preventDefault(), el9.blur());
          return;
        }
        if (event6.key === 'Escape') {
          event6.preventDefault();
          const value7 = el9.closest('.canvas-tab')?.dataset?.id,
            error3 = this._canvases.find((item9) => item9.id === value7);
          if (error3) el9.textContent = error3.name;
          el9.blur();
        }
      }));
  },
  _showTabContextMenu(filename, { clientX: clientX = 0, clientY: clientY = 0 } = {}) {
    if (!filename) return;
    this._removeTabContextMenu();
    const el10 = document.createElement('div');
    ((el10.id = 'tab-context-menu'),
      (el10.className = 'v2-dropdown-menu open'),
      (el10.style.position = 'fixed'),
      (el10.style.left = clientX + 'px'),
      (el10.style.top = clientY + 'px'),
      (el10.style.zIndex = 0x270f),
      (el10.style.minWidth = '120px'));
    const value8 = 'http://www.w3.org/2000/svg',
      handler2 = () => {
        const el11 = document.createElementNS(value8, 'svg');
        return (
          el11.setAttribute('width', '14'),
          el11.setAttribute('height', '14'),
          el11.setAttribute('viewBox', '0 0 24 24'),
          el11.setAttribute('fill', 'none'),
          el11.setAttribute('stroke', 'currentColor'),
          el11.setAttribute('stroke-width', '2'),
          el11
        );
      },
      value9 = (() => {
        const el12 = handler2(),
          el13 = document.createElementNS(value8, 'path');
        el13.setAttribute('d', 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z');
        const el14 = document.createElementNS(value8, 'polyline');
        el14.setAttribute('points', '17 21 17 13 7 13 7 21');
        const el15 = document.createElementNS(value8, 'polyline');
        return (
          el15.setAttribute('points', '7 3 7 8 15 8'),
          el12.appendChild(el13),
          el12.appendChild(el14),
          el12.appendChild(el15),
          el12
        );
      })(),
      value10 = (() => {
        const el16 = handler2(),
          el17 = document.createElementNS(value8, 'path');
        el17.setAttribute('d', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z');
        const el18 = document.createElementNS(value8, 'polyline');
        el18.setAttribute('points', '14 2 14 8 20 8');
        const el19 = document.createElementNS(value8, 'line');
        (el19.setAttribute('x1', '12'),
          el19.setAttribute('y1', '18'),
          el19.setAttribute('x2', '12'),
          el19.setAttribute('y2', '12'));
        const el20 = document.createElementNS(value8, 'line');
        return (
          el20.setAttribute('x1', '9'),
          el20.setAttribute('y1', '15'),
          el20.setAttribute('x2', '15'),
          el20.setAttribute('y2', '15'),
          el16.appendChild(el17),
          el16.appendChild(el18),
          el16.appendChild(el19),
          el16.appendChild(el20),
          el16
        );
      })(),
      value11 = (() => {
        const el21 = handler2(),
          el22 = document.createElementNS(value8, 'rect');
        (el22.setAttribute('x', '3'),
          el22.setAttribute('y', '5'),
          el22.setAttribute('width', '18'),
          el22.setAttribute('height', '14'),
          el22.setAttribute('rx', '2'));
        const el23 = document.createElementNS(value8, 'path');
        return (
          el23.setAttribute('d', 'M8 9h8M12 9v6m0 0-3-3m3 3 3-3'),
          el21.appendChild(el22),
          el21.appendChild(el23),
          el21
        );
      })(),
      value12 = (() => {
        const el24 = handler2(),
          el25 = document.createElementNS(value8, 'polyline');
        el25.setAttribute('points', '3 6 5 6 21 6');
        const el26 = document.createElementNS(value8, 'path');
        return (
          el26.setAttribute(
            'd',
            'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
          ),
          el24.appendChild(el25),
          el24.appendChild(el26),
          el24
        );
      })(),
      handler3 = (value13, value14, handler4, value15 = false) => {
        const el27 = document.createElement('div');
        el27.className = 'v2-menu-row';
        if (value15) el27.style.color = 'var(--red)';
        const el28 = document.createElement('span');
        ((el28.className = 'v2-menu-icon'), el28.appendChild(value14.cloneNode(true)));
        const el29 = document.createElement('span');
        ((el29.className = 'v2-menu-text'),
          (el29.textContent = value13),
          el27.appendChild(el28),
          el27.appendChild(el29),
          el27.addEventListener('pointerdown', (event7) => {
            (event7.stopPropagation(), el10.remove(), handler4());
          }),
          el27.addEventListener('contextmenu', (event8) => event8.preventDefault()),
          el10.appendChild(el27));
      };
    (handler3(canvasTabsText('contextMenu.save'), value9, () => {
      if (window._v2SaveProject) window._v2SaveProject(filename.name);
    }),
      handler3(canvasTabsText('contextMenu.saveAs'), value10, () => {
        if (window.electronAPI?.project && typeof window._v2SaveProjectAsLocal === 'function') {
          window._v2SaveProjectAsLocal();
          return;
        }
        const value16 = this.getMultiDataSnapshot({ sanitizeForPersistence: true }) || {},
          blob = new Blob([JSON.stringify(value16, null, 2)], { type: 'application/json' }),
          value17 = URL.createObjectURL(blob),
          el30 = document.createElement('a');
        ((el30.href = value17),
          (el30.download = filename.name + '.json'),
          document.body.appendChild(el30),
          el30.click(),
          document.body.removeChild(el30),
          URL.revokeObjectURL(value17),
          window.showToast?.(canvasTabsText('downloadedWorkflow', { filename: filename.name + '.json' })));
      }));
    typeof window._v2ExportCurrentProjectPackage === 'function' &&
      handler3(canvasTabsText('contextMenu.collectProject'), value11, () => {
        window._v2ExportCurrentProjectPackage({ canvasId: filename.id, projectName: filename.name });
      });
    const value18 = document.createElement('div');
    ((value18.className = 'v2-menu-sep'),
      el10.appendChild(value18),
      handler3(
        canvasTabsText('contextMenu.delete'),
        value12,
        () => {
          void this.deleteCanvas(filename.id);
        },
        true,
      ),
      document.body.appendChild(el10));
    const value19 = (event9) => {
      !el10.contains(event9.target) &&
        (el10.remove(), document.removeEventListener('pointerdown', value19, true));
    };
    requestAnimationFrame(() => document.addEventListener('pointerdown', value19, true));
  },
  _clearCanvasSurface() {
    clearRendererCache();
    const el31 = document.getElementById('v2-canvas');
    if (!el31) return;
    Array.from(el31.children).forEach((el32) => {
      if (el32.classList.contains('v2-node')) el32.remove();
    });
  },
  _buildCanvasRecord(args2 = {}, viewport = {}) {
    const args3 = createEmptyCanvasSnapshot(),
      _persistRevHint = Number.isFinite(args2?._persistRevHint)
        ? args2._persistRevHint
        : Number.isFinite(viewport?._persistRevHint)
          ? viewport._persistRevHint
          : args3._persistRevHint;
    return {
      ...args2,
      nodes: Array.isArray(viewport?.nodes)
        ? viewport.nodes
        : viewport?.nodes && typeof viewport.nodes === 'object'
          ? viewport.nodes
          : args3.nodes,
      edges: Array.isArray(viewport?.edges)
        ? viewport.edges
        : viewport?.edges && typeof viewport.edges === 'object'
          ? viewport.edges
          : args3.edges,
      viewport:
        viewport?.viewport && typeof viewport.viewport === 'object'
          ? { ...viewport.viewport }
          : { ...args3.viewport },
      assets: Array.isArray(viewport?.assets) ? viewport.assets : args3.assets,
      visualSnapshot:
        normalizeCanvasVisualSnapshot(viewport?.visualSnapshot) ||
        normalizeCanvasVisualSnapshot(args2?.visualSnapshot) ||
        null,
      _persistRevHint: _persistRevHint,
    };
  },
  _clearVisualSnapshotBackfillTimers() {
    for (const value20 of this._visualSnapshotBackfillTimers || []) {
      clearTimeout(value20);
    }
    this._visualSnapshotBackfillTimers = [];
  },
  _isVisualSnapshotWorthReplacing(enabled17, enabled18, { force: force = false } = {}) {
    if (!enabled18) return false;
    if (!enabled17) return true;
    const value21 = Math.max(0, Number(enabled17.readyMediaNodeCount ?? enabled17.mediaNodeCount) || 0),
      value22 = Math.max(0, Number(enabled18.readyMediaNodeCount ?? enabled18.mediaNodeCount) || 0);
    if (value22 > value21) return true;
    if (value22 < value21) return false;
    const value23 = Math.max(0, Number(enabled17.visibleNodeCount) || 0),
      value24 = Math.max(0, Number(enabled18.visibleNodeCount) || 0);
    if (value24 > value23) return true;
    return force && value24 >= value23;
  },
  _captureActiveVisualSnapshot({ force: force = false, persistIfChanged: persistIfChanged = false } = {}) {
    if (!this._activeId) return null;
    const value25 = this._canvases.findIndex((item10) => item10.id === this._activeId);
    if (value25 === -1) return null;
    if (typeof document === 'undefined') return null;
    const canvasEl = document.getElementById('v2-canvas');
    if (!canvasEl) return null;
    const nodes2 = appStore.getStateRaw?.() || {},
      visualSnapshot = captureCanvasVisualSnapshot({
        canvasEl: canvasEl,
        containerEl: canvasEl.parentElement || document.getElementById('v2-container'),
        nodes: nodes2.nodes,
        edges: nodes2.edges,
        viewport: nodes2.viewport,
        force: force,
      });
    if (!visualSnapshot) return null;
    const value26 = this._canvases[value25]?.visualSnapshot || null;
    if (!this._isVisualSnapshotWorthReplacing(value26, visualSnapshot, { force: force })) return null;
    return (
      (this._canvases[value25] = { ...this._canvases[value25], visualSnapshot: visualSnapshot }),
      persistIfChanged && this._scheduleWorkspaceMetaCacheSave(),
      visualSnapshot
    );
  },
  _getActiveVisualSnapshotCaptureInput({ force: force = false } = {}) {
    if (!this._activeId) return null;
    const idx = this._canvases.findIndex((item11) => item11.id === this._activeId);
    if (idx === -1) return null;
    if (typeof document === 'undefined') return null;
    const canvasEl2 = document.getElementById('v2-canvas');
    if (!canvasEl2) return null;
    const nodes3 = appStore.getStateRaw?.() || {};
    return {
      idx: idx,
      canvasEl: canvasEl2,
      containerEl: canvasEl2.parentElement || document.getElementById('v2-container'),
      nodes: nodes3.nodes,
      edges: nodes3.edges,
      viewport: nodes3.viewport,
      force: force,
    };
  },
  async _captureActiveVisualSnapshotAsync({
    force: force = false,
    persistIfChanged: persistIfChanged = false,
  } = {}) {
    const enabled19 = this._getActiveVisualSnapshotCaptureInput({ force: force });
    if (!enabled19) return null;
    const visualSnapshot2 =
      (await captureCanvasVisualSnapshotFromElectron(enabled19)) || captureCanvasVisualSnapshot(enabled19);
    if (!visualSnapshot2) return null;
    const value27 = this._canvases[enabled19.idx]?.visualSnapshot || null;
    if (!this._isVisualSnapshotWorthReplacing(value27, visualSnapshot2, { force: force })) return null;
    return (
      (this._canvases[enabled19.idx] = { ...this._canvases[enabled19.idx], visualSnapshot: visualSnapshot2 }),
      persistIfChanged && this._scheduleWorkspaceMetaCacheSave(),
      visualSnapshot2
    );
  },
  _showCanvasVisualSnapshot(value28) {
    return (
      hideCanvasVisualSnapshotOverlay(),
      this._scheduleCanvasVisibleMediaWarmup(value28, {
        delayMs: CANVAS_MEDIA_WARMUP_OPEN_DELAY_MS,
        maxJobs: CANVAS_MEDIA_WARMUP_SNAPSHOT_MAX_JOBS,
      }),
      false
    );
  },
  _warmupCanvasVisibleMedia(canvas, { maxJobs: maxJobs2 } = {}) {
    if (typeof document === 'undefined' || !canvas) return null;
    if (typeof document.getElementById !== 'function') return null;
    const value29 = document.getElementById('v2-canvas'),
      containerEl = value29?.parentElement || document.getElementById('v2-container');
    return warmupCanvasVisibleMedia({ canvas: canvas, containerEl: containerEl, maxJobs: maxJobs2 });
  },
  _clearCanvasVisibleMediaWarmupTimer() {
    this._mediaWarmupTimer !== null &&
      (clearTimeout(this._mediaWarmupTimer), (this._mediaWarmupTimer = null));
  },
  _scheduleCanvasVisibleMediaWarmup(
    enabled20,
    {
      delayMs: delayMs = CANVAS_MEDIA_WARMUP_OPEN_DELAY_MS,
      maxJobs: maxJobs = CANVAS_MEDIA_WARMUP_OPEN_MAX_JOBS,
    } = {},
  ) {
    this._clearCanvasVisibleMediaWarmupTimer();
    if (!enabled20) return null;
    const value30 = enabled20.id || null,
      timer = setTimeout(
        () => {
          this._mediaWarmupTimer = null;
          if (value30 && this._activeId !== value30) return;
          this._warmupCanvasVisibleMedia(enabled20, { maxJobs: maxJobs });
        },
        Math.max(0, Number(delayMs) || 0),
      );
    return (timer?.unref?.(), (this._mediaWarmupTimer = timer), timer);
  },
  _scheduleVisualSnapshotBackfill() {
    this._clearVisualSnapshotBackfillTimers();
    if (!this._activeId) return;
    const value31 = this._activeId,
      list4 = [0x4b0, 0xbb8, 0x1b58, 0x36b0, 0x55f0];
    this._visualSnapshotBackfillTimers = list4.map((item12) => {
      const timer2 = setTimeout(() => {
        if (this._activeId !== value31) return;
        void this._captureActiveVisualSnapshotAsync({ force: false, persistIfChanged: true });
      }, item12);
      return (timer2?.unref?.(), timer2);
    });
  },
  _hydrateCanvasSnapshot(value32, { preserveLiveGeneration: preserveLiveGeneration = false } = {}) {
    (markPerf('hydrateTrustedSnapshot:start'),
      appStore.hydrateTrustedSnapshot(value32, { preserveLiveGeneration: preserveLiveGeneration }),
      markPerf('hydrateTrustedSnapshot:end'),
      measurePerf('hydrateTrustedSnapshot', 'hydrateTrustedSnapshot:start', 'hydrateTrustedSnapshot:end'),
      this._rememberCanvasPersistRev());
  },
  hydrateActiveCanvasSnapshot(value33) {
    if (!this._activeId) return;
    const value34 = this._canvases.findIndex((item13) => item13.id === this._activeId);
    if (value34 === -1) return;
    ((this._canvases[value34] = this._buildCanvasRecord(this._canvases[value34], value33)),
      this._scheduleCanvasVisibleMediaWarmup(this._canvases[value34]),
      this._clearCanvasSurface(),
      this._hydrateCanvasSnapshot(this._canvases[value34]),
      this._scheduleVisualSnapshotBackfill());
  },
  init(value35, { markClean: markClean = true } = {}) {
    ((this._canvases = Array.isArray(value35.canvases)
      ? value35.canvases.map((item14) => this._buildCanvasRecord(item14, item14))
      : []),
      (this._lastPersistRevByCanvas = new Map()),
      (this._savedSignatureByCanvas = new Map()),
      (this._lastTabsRenderSignature = ''));
    if (this._canvases.length === 0) {
      const id2 = 'canvas_default_' + Date.now();
      (this._canvases.push({
        id: id2,
        name: canvasTabsText('defaultCanvasName'),
        ...createEmptyCanvasSnapshot(),
      }),
        (this._activeId = id2),
        this._hydrateCanvasSnapshot(this._canvases[0]));
    } else {
      this._activeId = value35.activeCanvasId || (this._canvases[0]?.id ?? null);
      const value36 = this._canvases.find((item15) => item15.id === this._activeId) || this._canvases[0];
      value36 &&
        (this._showCanvasVisualSnapshot(value36),
        this._hydrateCanvasSnapshot(value36),
        this._scheduleVisualSnapshotBackfill());
    }
    (this._resetSavedCanvasSignatures({ markClean: markClean }),
      this.renderTabs(),
      startVideoThumbBackfill(),
      this._notifyDirtyStateChanged());
  },
  _flushCurrentCanvas() {
    if (!this._activeId) return;
    const value37 = this._canvases.findIndex((item16) => item16.id === this._activeId);
    if (value37 === -1) return;
    flushAllPendingPromptHtmlCommits();
    const value38 = this._getStorePersistRev();
    if (this._lastPersistRevByCanvas.get(this._activeId) === value38) return;
    const markRecoveringGenerationSnapshot2 = markRecoveringGenerationSnapshot(appStore.serialize()),
      value39 = this._buildCanvasRecord(this._canvases[value37], markRecoveringGenerationSnapshot2);
    ((value39._persistRevHint = value38),
      (this._canvases[value37] = value39),
      this._lastPersistRevByCanvas.set(this._activeId, value38));
  },
  async switchTo(value40) {
    if (value40 === this._activeId) return;
    const enabled21 = this._canvases.find((item17) => item17.id === value40);
    if (!enabled21) return;
    return (
      this._flushCurrentCanvas(),
      this._captureActiveVisualSnapshot({ force: true }),
      this._showCanvasVisualSnapshot(enabled21),
      this._clearCanvasSurface(),
      (this._activeId = value40),
      this._hydrateCanvasSnapshot(enabled21, { preserveLiveGeneration: canvasHasLiveGeneration(enabled21) }),
      this._scheduleVisualSnapshotBackfill(),
      commit(),
      this.renderTabs(),
      startVideoThumbBackfill(),
      this._markCanvasMetaDirty(),
      this._notifyDirtyStateChanged(),
      true
    );
  },
  addCanvas() {
    (this._flushCurrentCanvas(),
      this._captureActiveVisualSnapshot({ force: true }),
      this._clearCanvasSurface());
    const id3 = 'canvas_' + Date.now(),
      name = canvasTabsText('newCanvasName', { index: this._canvases.length + 1 });
    return (
      this._canvases.push({ id: id3, name: name, ...createEmptyCanvasSnapshot() }),
      (this._activeId = id3),
      this._hydrateCanvasSnapshot(createEmptyCanvasSnapshot()),
      this._scheduleVisualSnapshotBackfill(),
      commit(),
      this.renderTabs(),
      startVideoThumbBackfill(),
      this._markCanvasMetaDirty(),
      this._notifyDirtyStateChanged(),
      true
    );
  },
  async _confirmDeleteDirtyCanvas(value41, { skipDirtyConfirm: skipDirtyConfirm = false } = {}) {
    if (skipDirtyConfirm || !this.isCanvasDirty(value41?.id)) return true;
    return this._showUnsavedDeleteConfirm(value41);
  },
  _showUnsavedDeleteConfirm(name2) {
    if (typeof document === 'undefined' || !document.body) return Promise.resolve(false);
    return (
      document.getElementById('canvas-delete-confirm-overlay')?.remove(),
      new Promise((handler5) => {
        const el33 = document.createElement('div');
        ((el33.id = 'canvas-delete-confirm-overlay'), (el33.className = 'custom-confirm-overlay'));
        const el34 = document.createElement('div');
        el34.className = 'custom-confirm-box';
        const el35 = document.createElement('div');
        ((el35.className = 'confirm-title'), (el35.textContent = canvasTabsText('deleteUnsaved.title')));
        const el36 = document.createElement('div');
        ((el36.className = 'confirm-msg'),
          (el36.textContent = canvasTabsText('deleteUnsaved.message', {
            name: name2?.name || canvasTabsText('untitledCanvas'),
          })));
        const el37 = document.createElement('div');
        el37.className = 'confirm-btns';
        const el38 = document.createElement('button');
        ((el38.type = 'button'),
          (el38.className = 'confirm-btn confirm-cancel'),
          (el38.textContent = canvasTabsText('deleteUnsaved.cancel')));
        const el39 = document.createElement('button');
        ((el39.type = 'button'),
          (el39.className = 'confirm-btn confirm-ok'),
          (el39.textContent = canvasTabsText('deleteUnsaved.delete')),
          el37.appendChild(el38),
          el37.appendChild(el39),
          el34.appendChild(el35),
          el34.appendChild(el36),
          el34.appendChild(el37),
          el33.appendChild(el34),
          document.body.appendChild(el33));
        let value42 = false;
        const run3 = (value43) => {
            if (value42) return;
            ((value42 = true),
              document.removeEventListener('keydown', value44, true),
              el33.remove(),
              handler5(value43));
          },
          value44 = (event10) => {
            if (event10.key === 'Escape') {
              (event10.preventDefault(), run3(false));
              return;
            }
            event10.key === 'Enter' && !event10.isComposing && (event10.preventDefault(), run3(true));
          };
        (el33.addEventListener('click', (event11) => {
          if (event11.target === el33) run3(false);
        }),
          el38.addEventListener('click', () => run3(false)),
          el39.addEventListener('click', () => run3(true)),
          document.addEventListener('keydown', value44, true),
          el38.focus?.());
      })
    );
  },
  async deleteCanvas(value45, value46 = {}) {
    if (this._canvases.length <= 1) return (window.showToast(canvasTabsText('keepOneCanvas'), 'warn'), false);
    const value47 = this._canvases.findIndex((item18) => item18.id === value45);
    if (value47 === -1) return false;
    const value48 = this._canvases[value47],
      enabled22 = await this._confirmDeleteDirtyCanvas(value48, value46);
    if (!enabled22) return false;
    (this._canvases.splice(value47, 1),
      this._lastPersistRevByCanvas.delete(value45),
      this._savedSignatureByCanvas.delete(value45));
    if (this._activeId === value45) {
      const value49 = this._canvases[Math.max(0, value47 - 1)];
      ((this._activeId = value49.id),
        this._showCanvasVisualSnapshot(value49),
        this._clearCanvasSurface(),
        this._hydrateCanvasSnapshot(value49, {
          preserveLiveGeneration: canvasHasLiveGeneration(value49),
        }),
        this._scheduleVisualSnapshotBackfill(),
        commit());
    }
    return (
      this.renderTabs(),
      startVideoThumbBackfill(),
      this._markCanvasMetaDirty(),
      this._notifyDirtyStateChanged(),
      true
    );
  },
  renameCanvas(value50, value51) {
    const error4 = this._canvases.find((item19) => item19.id === value50);
    if (!error4) return;
    const enabled23 = String(value51 || '').trim(),
      value52 = String(error4.name || '').trim();
    if (!enabled23 || enabled23 === value52) return;
    ((error4.name = enabled23), this._markCanvasMetaDirty(), this._notifyDirtyStateChanged());
  },
  markCanvasClean(enabled24 = this._activeId) {
    if (!enabled24) return false;
    if (enabled24 === this._activeId) this._flushCurrentCanvas();
    const enabled25 = this._canvases.find((item20) => item20.id === enabled24);
    if (!enabled25) return false;
    return (
      this._savedSignatureByCanvas.set(enabled24, this._buildCanvasSavedSignature(enabled25)),
      this._notifyDirtyStateChanged(),
      true
    );
  },
  markAllCanvasesClean() {
    return (
      this._flushCurrentCanvas(),
      this._resetSavedCanvasSignatures({ markClean: true }),
      this._notifyDirtyStateChanged(),
      true
    );
  },
  isCanvasDirty(enabled26 = this._activeId) {
    if (!enabled26) return false;
    if (enabled26 === this._activeId) this._flushCurrentCanvas();
    const enabled27 = this._canvases.find((item21) => item21.id === enabled26);
    if (!enabled27) return false;
    const enabled28 = this._savedSignatureByCanvas.get(enabled26);
    if (!enabled28) return true;
    return enabled28 !== this._buildCanvasSavedSignature(enabled27);
  },
  hasDirtyCanvases() {
    return (
      this._flushCurrentCanvas(),
      this._canvases.some((item22) => {
        const enabled29 = item22?.id;
        if (!enabled29) return false;
        const enabled30 = this._savedSignatureByCanvas.get(enabled29);
        return !enabled30 || enabled30 !== this._buildCanvasSavedSignature(item22);
      })
    );
  },
  getMultiDataSnapshot({
    sanitizeForPersistence: sanitizeForPersistence = false,
    captureVisualSnapshot: captureVisualSnapshot = true,
  } = {}) {
    this._flushCurrentCanvas();
    captureVisualSnapshot && this._captureActiveVisualSnapshot({ force: false });
    const cloneMultiDataSnapshot2 = cloneMultiDataSnapshot({
      canvases: this._canvases,
      activeCanvasId: this._activeId,
    });
    if (!sanitizeForPersistence) return cloneMultiDataSnapshot2;
    return sanitizeMultiCanvasDataForPersistence(cloneMultiDataSnapshot2 || {});
  },
  getMultiData() {
    return this.getMultiDataSnapshot();
  },
  getActiveCanvasId() {
    return this._activeId || '';
  },
  renderTabs() {
    const enabled31 = document.getElementById('canvasTabs');
    if (!enabled31) return;
    this._bindTabContainerEvents(enabled31);
    const value53 = this._getTabsRenderSignature();
    if (value53 === this._lastTabsRenderSignature) return;
    ((this._lastTabsRenderSignature = value53), this._removeTabContextMenu());
    const el40 = document.createDocumentFragment();
    (this._canvases.forEach((error5) => {
      const value54 = error5.id === this._activeId,
        el41 = document.createElement('div');
      ((el41.className = 'canvas-tab' + (value54 ? ' active' : '')), (el41.dataset.id = error5.id));
      const el42 = document.createElement('span');
      ((el42.className = 'canvas-tab-name'), (el42.title = error5.name), (el42.textContent = error5.name));
      const el43 = document.createElement('button');
      ((el43.type = 'button'),
        (el43.className = 'canvas-tab-close'),
        (el43.title = canvasTabsText('closeCanvas')),
        (el43.textContent = '×'),
        el41.appendChild(el42),
        el41.appendChild(el43),
        el40.appendChild(el41));
    }),
      enabled31.replaceChildren(el40));
  },
};
export default CanvasTabManager;
export { CanvasTabManager };
