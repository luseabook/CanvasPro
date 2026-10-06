import { clearRendererCache } from '../core/renderer.js';
import { captureBackgroundTaskCanvas } from './backgroundTaskCanvasSnapshot.js';
import { warmupCanvasVisibleMedia } from '../core/canvasMediaWarmup.js';
import { getCanvasMediaSchedulerStats } from './canvasMediaScheduler.js';
import { resetHistory } from './history.js';
import appStore, { createStore } from '../core/stores/appStore.js';
import { isGenerationTaskTerminalStatus } from '../core/generationTaskLifecycle.js';
import {
  handoffActiveGenerationTasks,
  hasActiveGenerationTasksForStore,
  restoreActiveGenerationTasks,
} from '../core/generationTaskRuntime.js';
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
import { desktopBridge } from '../services/desktopBridge.js';
import { saveTextDownload } from '../services/downloadSaveService.js';
import { showContextMenu } from './interaction/contextMenuPresenter.js';
import {
  assertCanvasProjectSaveAllowed,
  normalizeCanvasProjectAccess,
} from '../services/canvasProjectAccess.js';
import { createCanvasProjectBadge } from '../components/sharedProjectIcon.js';
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
const CANVAS_MEDIA_WARMUP_OPEN_DELAY_MS = 350,
  CANVAS_MEDIA_WARMUP_OPEN_MAX_JOBS = 96,
  CANVAS_MEDIA_WARMUP_SNAPSHOT_MAX_JOBS = 48,
  VISUAL_SNAPSHOT_BACKFILL_DELAYS_MS = [1200, 3000, 7000, 14000, 22000],
  DENSE_VISUAL_SNAPSHOT_NODE_COUNT = 120,
  DENSE_VISUAL_SNAPSHOT_BACKFILL_DELAYS_MS = [9000, 18000, 30000, 45000],
  VISUAL_SNAPSHOT_BACKFILL_RETRY_MS = 2500,
  VISUAL_SNAPSHOT_INTERACTION_SETTLE_MS = 500;
function countCanvasNodes(list) {
  if (Array.isArray(list)) return list.length;
  if (list && typeof list === 'object') return Object.keys(list).length;
  return 0;
}
function isChromeShellRuntime() {
  const options = String(
    globalThis.location?.search || globalThis.window?.location?.search || '',
  );
  return new URLSearchParams(options).get('aicRuntime') === 'chrome-shell';
}
function createEmptyCanvasSnapshot() {
  return {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1.1 },
    assets: [],
    storyboard3dProjects: [],
    _persistRevHint: 0,
    _contentPersistRevHint: 0,
  };
}
function cloneMultiDataSnapshot(target) {
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(target);
    } catch {}
  try {
    return JSON.parse(JSON.stringify(target));
  } catch {
    return { canvases: [], activeCanvasId: null };
  }
}
function isRecoverableTaskStatus(source) {
  const enabled = String(source || '').trim();
  return !enabled || !isGenerationTaskTerminalStatus(enabled);
}
function markRecoveringGenerationNode(args) {
  if (!args || typeof args !== 'object') return args;
  if (!args.generationStartTime || args.generationDuration != null) return args;
  const next = { ...args };
  let enabled2 = false;
  String(next.rhTaskId || '').trim() &&
    isRecoverableTaskStatus(next.rhTaskStatus) &&
    ((next.rhTaskRecovering = true), (enabled2 = true));
  String(next.dreaminaSubmitId || '').trim() &&
    isRecoverableTaskStatus(next.dreaminaTaskStatus) &&
    isRecoverableTaskStatus(next.dreaminaTaskPhase) &&
    ((next.dreaminaTaskRecovering = true), (enabled2 = true));
  String(next.asyncTaskId || '').trim() &&
    isRecoverableTaskStatus(next.asyncTaskStatus) &&
    ((next.asyncTaskRecovering = true), (enabled2 = true));
  if (!enabled2) return args;
  return (
    (next.isGenerating = true),
    (next.jobStatus = isRecoverableTaskStatus(next.jobStatus)
      ? 'running'
      : next.jobStatus),
    (next.generationDuration = null),
    next
  );
}
function markRecoveringGenerationSnapshot(nodes) {
  if (!nodes || typeof nodes !== 'object') return nodes;
  if (Array.isArray(nodes.nodes))
    return {
      ...nodes,
      nodes: nodes.nodes.map((current) => markRecoveringGenerationNode(current)),
    };
  if (nodes.nodes && typeof nodes.nodes === 'object')
    return {
      ...nodes,
      nodes: Object.fromEntries(
        Object.entries(nodes.nodes).map(([entry, record]) => [
          entry,
          markRecoveringGenerationNode(record),
        ]),
      ),
    };
  return nodes;
}
function getCanvasNodesList(options2 = {}) {
  const payload = options2?.nodes;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') return Object.values(payload);
  return [];
}
function hasLiveGenerationNode(enabled3 = {}) {
  if (!enabled3 || typeof enabled3 !== 'object') return false;
  if (enabled3.isGenerating !== true || enabled3.generationDuration != null) return false;
  const list2 = [
    enabled3.jobStatus,
    enabled3.rhTaskStatus,
    enabled3.dreaminaTaskStatus,
    enabled3.dreaminaTaskPhase,
    enabled3.asyncTaskStatus,
    enabled3.mediaTaskStatus,
  ];
  return !list2.some((handle) => {
    const enabled4 = String(handle || '')
      .trim()
      .toLowerCase();
    if (!enabled4 || enabled4 === 'idle') return false;
    return isGenerationTaskTerminalStatus(enabled4);
  });
}
function canvasHasLiveGeneration(options3 = {}) {
  return getCanvasNodesList(options3).some((state) => hasLiveGenerationNode(state));
}
export function buildTabsRenderSignature(list3 = [], config = null) {
  return (
    (config || '') +
    '::' +
    (Array.isArray(list3) ? list3 : [])
      .map((error) => (error?.id || '') + ':' + (error?.name || ''))
      .join('|')
  );
}
export function getCanvasTabScrollMetrics(el = {}) {
  const scrollWidth = Math.max(0, Number(el.scrollWidth) || 0),
    clientWidth = Math.max(
      0,
      Number(el.clientWidth) ||
        Number(el.getBoundingClientRect?.().width) ||
        Number(el.offsetWidth) ||
        0,
    ),
    maxScrollLeft = Math.max(0, scrollWidth - clientWidth),
    scrollLeft = Math.min(maxScrollLeft, Math.max(0, Number(el.scrollLeft) || 0));
  return { clientWidth: clientWidth, maxScrollLeft: maxScrollLeft, scrollLeft: scrollLeft, scrollWidth: scrollWidth };
}
export function scrollCanvasTabsWithWheel(enabled5, event = {}) {
  if (!enabled5) return false;
  const {
    clientWidth: clientWidth2,
    maxScrollLeft: maxScrollLeft2,
    scrollLeft: scrollLeft2,
  } = getCanvasTabScrollMetrics(enabled5);
  if (maxScrollLeft2 <= 1) return false;
  const count = Number(event.deltaX) || 0,
    scope = Number(event.deltaY) || 0,
    enabled6 = Math.abs(count) > Math.abs(scope) && count !== 0 ? count : scope;
  if (!enabled6) return false;
  const count2 = Number(event.deltaMode) || 0,
    input = count2 === 1 ? 16 : count2 === 2 ? Math.max(clientWidth2, 1) : 1,
    output = Math.min(maxScrollLeft2, Math.max(0, scrollLeft2 + enabled6 * input));
  if (output === scrollLeft2) return false;
  return ((enabled5.scrollLeft = output), event.preventDefault?.(), true);
}
function normalizeCanvasProjectContext(isTemporary = {}, value2 = {}) {
  const value3 = String(value2.canvasId || '').trim(),
    projectName = String(isTemporary.projectName || value2.projectName || '').trim();
  return {
    projectId: String(isTemporary.projectId || value2.projectId || value3).trim(),
    filename: String(isTemporary.filename || '').trim(),
    projectName: projectName,
    recentId: String(isTemporary.recentId || '').trim(),
    displayPath: String(isTemporary.displayPath || '').trim(),
    lastModified: Math.max(0, Number(isTemporary.lastModified || 0) || 0),
    isTemporary: isTemporary.isTemporary === true,
    workspaceProjectScoped: isTemporary.workspaceProjectScoped !== false,
  };
}
function captureCurrentProjectContext(canvasId = {}) {
  if (typeof window === 'undefined')
    return normalizeCanvasProjectContext(
      {},
      { canvasId: canvasId?.id, projectName: canvasId?.name },
    );
  return normalizeCanvasProjectContext(
    {
      projectId: window.currentProjectId,
      filename: window._v2CurrentFile,
      projectName:
        globalThis.document?.getElementById?.('projectNameText')?.textContent ||
        canvasId?.name,
      recentId: window._v2CurrentRecentProjectId,
      displayPath: window._v2CurrentProjectDisplayPath,
      lastModified: window._v2CurrentProjectLastModified,
      workspaceProjectScoped: window._v2WorkspaceProjectScoped !== false,
    },
    { canvasId: canvasId?.id, projectName: canvasId?.name },
  );
}
const CanvasTabManager = {
  _canvases: [],
  _projectBadges: new Map(),
  _activeId: null,
  _projectContextByCanvasId: new Map(),
  _lastPersistRevByCanvas: new Map(),
  _lastContentPersistRevByCanvas: new Map(),
  _savedSignatureByCanvas: new Map(),
  _lastTabsRenderSignature: '',
  _tabContainerBound: false,
  _visualSnapshotBackfillTimers: [],
  _visualSnapshotIdleRetryTimer: null,
  _visualSnapshotIdleRetryCanvasId: null,
  _visualSnapshotBackfillCapturePromise: null,
  _visualSnapshotBackfillGeneration: 0,
  _visualSnapshotInteractionGuardDocument: null,
  _visualSnapshotInteractionGuardHandlers: null,
  _visualSnapshotActivePointers: new Set(),
  _visualSnapshotSettleUntil: 0,
  _mediaWarmupTimer: null,
  _tabOverflowResizeObserver: null,
  _taskSafeCanvasTransitionPromise: null,
  _backgroundTaskStores: new Map(),
  _showTaskTransitionBlocked(value4, value5 = 'switchBlockedByTasks') {
    const count3 = Math.max(
      1,
      Number(value4?.blockers?.length || value4?.activeCount || 0),
    );
    window.showToast?.(canvasTabsText(value5, { count: count3 }), 'warn');
  },
  async _runTaskSafeCanvasTransition(handler) {
    if ((await appStore.getGraphMutationPolicy?.()?.beforeWorkspaceTransition?.()) === false) return false;
    if (this._taskSafeCanvasTransitionPromise) return this._taskSafeCanvasTransitionPromise;
    const value6 = (async () => {
      return handler();
    })();
    this._taskSafeCanvasTransitionPromise = value6;
    try {
      return await value6;
    } finally {
      this._taskSafeCanvasTransitionPromise === value6 &&
        (this._taskSafeCanvasTransitionPromise = null);
    }
  },
  _getStorePersistRev() {
    return Number(appStore.getStateRaw()?._persistRev || 0);
  },
  _getStoreContentPersistRev() {
    return Number(appStore.getStateRaw()?._contentPersistRev || 0);
  },
  _rememberCanvasPersistRev(enabled7 = this._activeId) {
    if (!enabled7) return;
    (this._lastPersistRevByCanvas.set(enabled7, this._getStorePersistRev()),
      this._lastContentPersistRevByCanvas.set(enabled7, this._getStoreContentPersistRev()));
  },
  _scheduleWorkspaceCacheSave() {
    return window._triggerLocalCacheSave?.();
  },
  _syncBackgroundTaskCanvas(
    value7,
    store,
    { persist: persist = true, updatedNodeId: updatedNodeId } = {},
  ) {
    const value8 = this._canvases.findIndex((value9) => value9.id === value7);
    if (value8 === -1 || !store) return false;
    const captureBackgroundTaskCanvas2 = captureBackgroundTaskCanvas(store, this._canvases[value8], updatedNodeId),
      value10 = captureBackgroundTaskCanvas2.snapshot,
      value11 = Number(store.getStateRaw()?._persistRev || 0),
      value12 = Number(store.getStateRaw()?._contentPersistRev || 0),
      value13 = this._buildCanvasRecord(this._canvases[value8], value10);
    return (
      (value13._persistRevHint = value11),
      (value13._contentPersistRevHint = value12),
      (this._canvases[value8] = value13),
      captureBackgroundTaskCanvas2.remember(value13),
      persist && (this._scheduleWorkspaceCacheSave(), this._notifyDirtyStateChanged()),
      true
    );
  },
  _handoffActiveCanvasTasks(taskScopeId = this._activeId) {
    if (!taskScopeId || !hasActiveGenerationTasksForStore(appStore))
      return { ok: true, movedCount: 0, taskScopeId: taskScopeId || '' };
    let targetStore = null,
      handoffActiveGenerationTasks2 = null;
    try {
      return (
        (targetStore = createStore()),
        targetStore.hydrateTrustedSnapshot(appStore.serialize(), { preserveLiveGeneration: true }),
        (handoffActiveGenerationTasks2 = handoffActiveGenerationTasks({
          sourceStore: appStore,
          targetStore: targetStore,
          taskScopeId: taskScopeId,
          mirrorTaskState: ({ updatedNodeId: updatedNodeId2 } = {}) =>
            this._syncBackgroundTaskCanvas(taskScopeId, targetStore, {
              persist: true,
              updatedNodeId: updatedNodeId2,
            }),
        })),
        handoffActiveGenerationTasks2.movedCount > 0 &&
          (this._backgroundTaskStores.set(taskScopeId, targetStore),
          this._syncBackgroundTaskCanvas(taskScopeId, targetStore, { persist: false })),
        handoffActiveGenerationTasks2
      );
    } catch (error2) {
      return (
        restoreActiveGenerationTasks({ taskScopeId: taskScopeId, targetStore: appStore }),
        this._backgroundTaskStores.delete(taskScopeId),
        console.error('[CanvasTabManager] Failed to hand off active generation tasks:', error2),
        {
          ok: false,
          movedCount: 0,
          activeCount: Number(handoffActiveGenerationTasks2?.movedCount || 1),
          taskScopeId: taskScopeId,
          blockers: [{ reason: 'background-store-handoff-failed', error: error2 }],
        }
      );
    }
  },
  _restoreActiveCanvasTasks(taskScopeId2 = this._activeId) {
    const restoreActiveGenerationTasks2 = restoreActiveGenerationTasks({ taskScopeId: taskScopeId2, targetStore: appStore });
    return (this._backgroundTaskStores.delete(taskScopeId2), restoreActiveGenerationTasks2);
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
  _notifyActiveCanvasChanged(reason = 'switch') {
    const canvasId2 = this._activeId || '';
    if (!canvasId2 || typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    const detail = {
      canvasId: canvasId2,
      reason: reason,
      projectContext: this.getCanvasProjectContext(canvasId2),
    };
    if (typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('aicanvas:active-canvas-changed', { detail: detail }));
      return;
    }
    if (typeof Event === 'function') {
      const event2 = new Event('aicanvas:active-canvas-changed');
      ((event2.detail = detail), window.dispatchEvent(event2));
    }
  },
  _applyActiveCanvasProjectContext() {
    if (typeof window === 'undefined') return false;
    const enabled8 = this.getCanvasProjectContext();
    if (!enabled8) return false;
    ((window.currentProjectId = enabled8.projectId),
      (window._v2CurrentFile = enabled8.filename),
      (window._v2CurrentRecentProjectId = enabled8.recentId),
      (window._v2CurrentProjectDisplayPath = enabled8.displayPath),
      (window._v2CurrentProjectLastModified = enabled8.lastModified),
      (window._v2WorkspaceProjectScoped = enabled8.workspaceProjectScoped));
    const el2 = globalThis.document?.getElementById?.('projectNameText');
    if (el2) {
      ((el2.textContent =
        enabled8.projectName ||
        this._canvases.find((value14) => value14?.id === this._activeId)?.name ||
        ''),
        el2.parentElement?.querySelector?.('.canvas-project-badge')?.remove());
      const value15 = this.getCanvasProjectAccess(),
        canvasProjectBadge = createCanvasProjectBadge(value15);
      if (canvasProjectBadge) el2.before?.(canvasProjectBadge);
    }
    return true;
  },
  setCanvasProjectContext(canvasId3, value16 = {}, { persist: persist = true } = {}) {
    const projectName2 = this._canvases.find((value17) => value17?.id === canvasId3);
    if (!projectName2) return null;
    const args2 = normalizeCanvasProjectContext(value16, {
      canvasId: canvasId3,
      projectName: projectName2.name,
    });
    return (
      this._projectContextByCanvasId.set(canvasId3, args2),
      canvasId3 === this._activeId &&
        (this._applyActiveCanvasProjectContext(), this._notifyActiveCanvasChanged('context')),
      persist && this._markCanvasMetaDirty(),
      { ...args2 }
    );
  },
  getCanvasProjectContext(value18 = this._activeId) {
    const args3 = this._projectContextByCanvasId.get(value18);
    return args3 ? { ...args3 } : null;
  },
  findCanvasIdByProjectIdentity(options4 = {}) {
    const run = (value19, { path: path = false } = {}) => {
        const value20 = String(value19 || '')
          .trim()
          .toLowerCase();
        return path ? value20.replace(/\\/g, '/') : value20;
      },
      value21 = run(options4.projectName),
      value22 = [
        ['recentId', run(options4.recentId)],
        ['displayPath', run(options4.displayPath, { path: true })],
        ['filename', run(options4.filename, { path: true })],
        ['projectId', run(options4.projectId)],
      ].filter(([, value23]) => value23);
    for (const [path2, value24] of value22) {
      const list4 = [];
      for (const canvas of this._canvases) {
        const context = this._projectContextByCanvasId.get(canvas?.id);
        if (!context) continue;
        const value25 = run(context[path2], {
          path: path2 === 'displayPath' || path2 === 'filename',
        });
        value25 === value24 && list4.push({ canvas: canvas, context: context });
      }
      if (list4.length === 0) continue;
      if (value21) {
        const canvas2 =
          list4.find(({ canvas: canvas3 }) => run(canvas3?.name) === value21) ||
          list4.find(({ context: context2 }) => run(context2?.projectName) === value21);
        if (canvas2) return canvas2.canvas.id;
      }
      return list4[0].canvas.id;
    }
    if (value21) {
      const list5 = this._canvases.filter(
        (error3) => run(error3?.name) === value21,
      );
      if (list5.length === 1) return list5[0].id;
    }
    return '';
  },
  _getTabsRenderSignature() {
    return (
      buildTabsRenderSignature(this._canvases, this._activeId) +
      this._canvases
        .map((value26) => this._projectBadges.get(value26.id) || '')
        .join(':')
    );
  },
  getCanvasProjectAccess(value27 = this._activeId) {
    const args4 = normalizeCanvasProjectAccess(
      this._canvases.find((value28) => value28.id === value27)?.projectAccess,
    );
    return args4 ? { ...args4, badge: this._projectBadges.get(value27) || '' } : null;
  },
  setCanvasProjectAccess(value29, value30) {
    const enabled9 = this._canvases.find((value31) => value31.id === value29);
    if (!enabled9) return;
    const args5 = normalizeCanvasProjectAccess(value30);
    if (args5?.badge) this._projectBadges.set(value29, args5.badge);
    else this._projectBadges.delete(value29);
    const value32 = args5 ? { ...args5, badge: '' } : null;
    JSON.stringify(enabled9.projectAccess) !== JSON.stringify(value32) &&
      ((enabled9.projectAccess = value32), this._markCanvasMetaDirty());
    this.renderTabs();
    if (value29 === this._activeId) this._applyActiveCanvasProjectContext();
  },
  _buildCanvasStructureDigest(value33, value34) {
    const list6 = Array.isArray(value33)
      ? value33
      : value33 && typeof value33 === 'object'
        ? Object.values(value33)
        : [];
    let value35 = '' + list6.length;
    for (const enabled10 of list6) {
      if (!enabled10 || typeof enabled10 !== 'object') continue;
      value35 += '|';
      for (const value36 of value34) {
        value35 += String(enabled10[value36] ?? '') + ',';
      }
    }
    return value35;
  },
  _buildCanvasSavedSignature(id) {
    const box =
        id?.viewport && typeof id.viewport === 'object'
          ? id.viewport
          : { x: 0, y: 0, zoom: 1.1 },
      persistRevHint = Number.isFinite(id?._persistRevHint)
        ? Number(id._persistRevHint)
        : 0;
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
      storyboard3dProjects: this._buildCanvasStructureDigest(id?.storyboard3dProjects, [
        'id',
        'name',
        'updatedAt',
      ]),
    });
  },
  _resetSavedCanvasSignatures({ markClean: markClean = true } = {}) {
    this._savedSignatureByCanvas = new Map();
    if (!markClean) return;
    this._canvases.forEach((enabled11) => {
      if (!enabled11?.id) return;
      this._savedSignatureByCanvas.set(enabled11.id, this._buildCanvasSavedSignature(enabled11));
    });
  },
  _removeTabContextMenu() {
    (this._tabContextMenuSession?.close?.({ restoreFocus: false }),
      (this._tabContextMenuSession = null),
      document.getElementById('tab-context-menu')?.remove());
  },
  _startTabRename(el3) {
    if (!el3) return;
    ((el3.contentEditable = 'true'), el3.focus());
    const value37 = document.createRange();
    value37.selectNodeContents(el3);
    const enabled12 = window.getSelection?.();
    if (!enabled12) return;
    (enabled12.removeAllRanges(), enabled12.addRange(value37));
  },
  _commitTabRename(el4, { deferRender: deferRender = false } = {}) {
    if (!el4) return;
    const el5 = el4.closest('.canvas-tab'),
      enabled13 = el5?.dataset?.id;
    if (!enabled13) return;
    const error4 = this._canvases.find((value38) => value38.id === enabled13);
    if (!error4) return;
    const value39 = error4.name,
      value40 = String(el4.textContent || '').trim();
    ((el4.contentEditable = 'false'),
      this.renameCanvas(enabled13, value40),
      (el4.textContent =
        this._canvases.find((value41) => value41.id === enabled13)?.name || value39));
    if (deferRender) {
      window.setTimeout(() => this.renderTabs(), 0);
      return;
    }
    this.renderTabs();
  },
  _bindTabContainerEvents(el6) {
    if (this._tabContainerBound || !el6) return;
    this._tabContainerBound = true;
    let value42 = '',
      count4 = 0;
    const run2 = (event3) => {
        const el7 = event3.target.closest('.canvas-tab');
        if (!el7 || !el6.contains(el7)) return '';
        return el7.dataset.id || '';
      },
      handler2 = (event4) => {
        if (event4.button !== 1) return false;
        const enabled14 = run2(event4);
        if (!enabled14) return false;
        return (
          event4.preventDefault(),
          event4.stopPropagation(),
          (value42 = enabled14),
          (count4 = Date.now()),
          void this.deleteCanvas(enabled14),
          true
        );
      };
    (el6.addEventListener('click', (event5) => {
      const el8 = event5.target.closest('.canvas-tab');
      if (!el8 || !el6.contains(el8)) return;
      const enabled15 = el8.dataset.id;
      if (!enabled15) return;
      const enabled16 = this._canvases.find((value43) => value43.id === enabled15);
      if (!enabled16) return;
      const value44 = event5.target.closest('.canvas-tab-close');
      if (value44) {
        (event5.stopPropagation(), void this.deleteCanvas(enabled15));
        return;
      }
      const value45 = el8.querySelector('.canvas-tab-name'),
        value46 = enabled15 === this._activeId;
      if (value46) {
        if (value45?.contentEditable === 'true') return;
        this._startTabRename(value45);
        return;
      }
      this.switchTo(enabled15);
    }),
      el6.addEventListener('pointerdown', (value47) => {
        handler2(value47);
      }),
      el6.addEventListener('auxclick', (event6) => {
        if (event6.button !== 1) return;
        const enabled17 = run2(event6);
        if (!enabled17) return;
        (event6.preventDefault(), event6.stopPropagation());
        if (enabled17 === value42 && Date.now() - count4 < 800) return;
        ((value42 = enabled17), (count4 = Date.now()), void this.deleteCanvas(enabled17));
      }),
      el6.addEventListener('contextmenu', async (clientX2) => {
        const el9 = clientX2.target.closest('.canvas-tab');
        if (!el9 || !el6.contains(el9)) return;
        const enabled18 = el9.dataset.id;
        if (!enabled18) return;
        const enabled19 = this._canvases.find((value48) => value48.id === enabled18);
        if (!enabled19) return;
        (clientX2.preventDefault(), clientX2.stopPropagation());
        const run3 = () => {
          this._showTabContextMenu(enabled19, {
            clientX: clientX2.clientX,
            clientY: clientX2.clientY,
          });
        };
        (enabled18 !== this._activeId && (await this.switchTo(enabled18)), run3());
      }),
      el6.addEventListener('focusout', (event7) => {
        const enabled20 = event7.target.closest('.canvas-tab-name');
        if (!enabled20 || !el6.contains(enabled20)) return;
        if (enabled20.contentEditable !== 'true') return;
        this._commitTabRename(enabled20, { deferRender: true });
      }),
      el6.addEventListener('keydown', (event8) => {
        const el10 = event8.target.closest('.canvas-tab-name');
        if (!el10 || !el6.contains(el10)) return;
        if (el10.contentEditable !== 'true') return;
        if (event8.key === 'Enter') {
          (event8.preventDefault(), el10.blur());
          return;
        }
        if (event8.key === 'Escape') {
          event8.preventDefault();
          const value49 = el10.closest('.canvas-tab')?.dataset?.id,
            error5 = this._canvases.find((value50) => value50.id === value49);
          if (error5) el10.textContent = error5.name;
          el10.blur();
        }
      }),
      el6.addEventListener('scroll', () => this._updateTabScrollHints(el6), {
        passive: true,
      }),
      el6.addEventListener(
        'wheel',
        (event9) => {
          (event9.stopPropagation?.(),
            scrollCanvasTabsWithWheel(el6, event9) && this._updateTabScrollHints(el6));
        },
        { passive: false },
      ));
    const run4 = globalThis.ResizeObserver;
    if (typeof run4 === 'function') {
      (this._tabOverflowResizeObserver?.disconnect?.(),
        (this._tabOverflowResizeObserver = new run4(() => {
          this._updateTabScrollHints(el6);
        })),
        this._tabOverflowResizeObserver.observe(el6));
      const value51 = this._getTabScrollShell(el6);
      value51 && value51 !== el6 && this._tabOverflowResizeObserver.observe(value51);
    }
    this._updateTabScrollHints(el6);
  },
  _getTabScrollShell(el11) {
    return (
      el11?.closest?.('.canvas-tabs-wrap') ||
      globalThis.document?.getElementById?.('canvasTabsWrap') ||
      null
    );
  },
  _updateTabScrollHints(value52) {
    const el12 = this._getTabScrollShell(value52);
    if (!el12?.classList) return;
    const { maxScrollLeft: maxScrollLeft3, scrollLeft: scrollLeft3 } = getCanvasTabScrollMetrics(value52),
      value53 = maxScrollLeft3 > 1;
    (el12.classList.toggle('has-overflow', value53),
      el12.classList.toggle('has-left-fade', value53 && scrollLeft3 > 1),
      el12.classList.toggle('has-right-fade', value53 && scrollLeft3 < maxScrollLeft3 - 1));
  },
  _revealActiveTab(el13) {
    const value54 = el13?.querySelector?.('.canvas-tab.active');
    value54?.scrollIntoView?.({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
  },
  _showTabContextMenu(canvasId4, { clientX: clientX = 0, clientY: clientY = 0 } = {}) {
    if (!canvasId4) return;
    this._removeTabContextMenu();
    const list7 = [
      {
        label: canvasTabsText('contextMenu.save'),
        icon: 'save',
        shortcutActionId: 'save',
        action: () => {
          window._v2SaveProject?.(canvasId4.name, { canvasId: canvasId4.id });
        },
      },
      {
        label: canvasTabsText('contextMenu.saveAs'),
        icon: 'save-as',
        shortcutActionId: 'context-canvas-tab-save-as',
        action: async () => {
          try {
            assertCanvasProjectSaveAllowed({ canvases: [canvasId4] }, this);
          } catch (error6) {
            window.showToast?.(error6.message, 'warn');
            return;
          }
          if (
            desktopBridge.project.isAvailable() &&
            typeof window._v2SaveProjectAsLocal === 'function'
          ) {
            window._v2SaveProjectAsLocal({ canvasId: canvasId4.id });
            return;
          }
          const args6 = this.getMultiDataSnapshot({ sanitizeForPersistence: true }) || {},
            list8 = Array.isArray(args6.canvases) ? args6.canvases : [],
            canvases =
              list8.find(
                (value55) => String(value55?.id || '') === String(canvasId4.id || ''),
              ) || canvasId4,
            value56 = {
              ...args6,
              canvases: canvases ? [canvases] : [],
              activeCanvasId: canvases?.id || canvasId4.id || null,
            },
            filename = canvasId4.name + '.aicanvas',
            saveTextDownload2 = await saveTextDownload({
              filename: filename,
              content: JSON.stringify(value56, null, 2),
              mimeType: 'application/json',
              filterName: 'SHUO Canvas Project',
            });
          if (saveTextDownload2?.canceled) return;
          window.showToast?.(canvasTabsText('downloadedWorkflow', { filename: filename }));
        },
      },
    ];
    (typeof window._v2ExportCurrentProjectPackage === 'function' &&
      list7.push({
        label: canvasTabsText('contextMenu.collectProject'),
        icon: 'package-export',
        shortcutActionId: 'context-canvas-tab-collect-project',
        action: () => {
          window._v2ExportCurrentProjectPackage({
            canvasId: canvasId4.id,
            projectName: canvasId4.name,
          });
        },
      }),
      list7.push('sep', {
        label: canvasTabsText('contextMenu.delete'),
        icon: 'delete',
        danger: true,
        shortcutActionId: 'context-canvas-tab-delete',
        action: () => void this.deleteCanvas(canvasId4.id),
      }),
      (this._tabContextMenuSession = showContextMenu(clientX, clientY, list7, {
        className: 'v2-canvas-ctx-menu canvas-tab-context-menu',
        ensureItemIcons: true,
        restoreTarget: document.querySelector?.(
          '.canvas-tab[data-id="' +
            (globalThis.CSS?.escape?.(String(canvasId4.id)) || String(canvasId4.id)) +
            '"]',
        ),
        onClose: () => {
          this._tabContextMenuSession = null;
        },
      })),
      (this._tabContextMenuSession.menu.id = 'tab-context-menu'));
  },
  _clearCanvasSurface() {
    clearRendererCache();
    const el14 = document.getElementById('v2-canvas');
    if (!el14) return;
    Array.from(el14.children).forEach((el15) => {
      if (el15.classList.contains('v2-node')) el15.remove();
    });
  },
  _buildCanvasRecord(args7 = {}, viewport = {}) {
    const args8 = createEmptyCanvasSnapshot(),
      _persistRevHint = Number.isFinite(args7?._persistRevHint)
        ? args7._persistRevHint
        : Number.isFinite(viewport?._persistRevHint)
          ? viewport._persistRevHint
          : args8._persistRevHint,
      _contentPersistRevHint = Number.isFinite(args7?._contentPersistRevHint)
        ? args7._contentPersistRevHint
        : Number.isFinite(viewport?._contentPersistRevHint)
          ? viewport._contentPersistRevHint
          : args8._contentPersistRevHint;
    return {
      ...args7,
      ...(args7.projectAccess
        ? { projectAccess: { ...normalizeCanvasProjectAccess(args7.projectAccess), badge: '' } }
        : {}),
      nodes: Array.isArray(viewport?.nodes)
        ? viewport.nodes
        : viewport?.nodes && typeof viewport.nodes === 'object'
          ? viewport.nodes
          : args8.nodes,
      edges: Array.isArray(viewport?.edges)
        ? viewport.edges
        : viewport?.edges && typeof viewport.edges === 'object'
          ? viewport.edges
          : args8.edges,
      viewport:
        viewport?.viewport && typeof viewport.viewport === 'object'
          ? { ...viewport.viewport }
          : { ...args8.viewport },
      assets: Array.isArray(viewport?.assets) ? viewport.assets : args8.assets,
      storyboard3dProjects: Array.isArray(viewport?.storyboard3dProjects)
        ? viewport.storyboard3dProjects
        : args8.storyboard3dProjects,
      visualSnapshot:
        normalizeCanvasVisualSnapshot(viewport?.visualSnapshot) ||
        normalizeCanvasVisualSnapshot(args7?.visualSnapshot) ||
        null,
      _persistRevHint: _persistRevHint,
      _contentPersistRevHint: _contentPersistRevHint,
    };
  },
  _clearVisualSnapshotBackfillTimers() {
    for (const value57 of this._visualSnapshotBackfillTimers || []) {
      clearTimeout(value57);
    }
    ((this._visualSnapshotBackfillTimers = []), this._clearVisualSnapshotIdleRetryTimer());
  },
  _clearVisualSnapshotIdleRetryTimer() {
    (this._visualSnapshotIdleRetryTimer !== null && clearTimeout(this._visualSnapshotIdleRetryTimer),
      (this._visualSnapshotIdleRetryTimer = null),
      (this._visualSnapshotIdleRetryCanvasId = null));
  },
  _getVisualSnapshotNow() {
    return Date.now();
  },
  _holdVisualSnapshotCaptureAfterInteraction() {
    this._visualSnapshotSettleUntil = Math.max(
      Number(this._visualSnapshotSettleUntil) || 0,
      this._getVisualSnapshotNow() + VISUAL_SNAPSHOT_INTERACTION_SETTLE_MS,
    );
  },
  _invalidateVisualSnapshotBackfillCapture() {
    return (
      (this._visualSnapshotBackfillGeneration =
        (Number(this._visualSnapshotBackfillGeneration) || 0) + 1),
      this._visualSnapshotBackfillGeneration
    );
  },
  _deferVisualSnapshotBackfillAfterInteraction() {
    (this._holdVisualSnapshotCaptureAfterInteraction(),
      this._invalidateVisualSnapshotBackfillCapture(),
      this._clearVisualSnapshotBackfillTimers(),
      this._activeId && this._scheduleVisualSnapshotIdleRetry(this._activeId));
  },
  _bindVisualSnapshotInteractionGuard() {
    const el16 = typeof document !== 'undefined' ? document : null;
    if (!el16 || typeof el16.addEventListener !== 'function') return;
    if (this._visualSnapshotInteractionGuardDocument === el16) return;
    const el17 = this._visualSnapshotInteractionGuardDocument,
      value58 = this._visualSnapshotInteractionGuardHandlers;
    el17 &&
      value58 &&
      (el17.removeEventListener?.('pointerdown', value58.pointerdown, true),
      el17.removeEventListener?.('pointerup', value58.pointerup, true),
      el17.removeEventListener?.('pointercancel', value58.pointercancel, true),
      el17.removeEventListener?.('wheel', value58.wheel, true));
    this._visualSnapshotActivePointers = new Set();
    const run5 = (event10) =>
        Number.isFinite(event10?.pointerId) ? event10.pointerId : 'primary',
      value59 = {
        pointerdown: (value60) => {
          (this._visualSnapshotActivePointers.add(run5(value60)),
            this._deferVisualSnapshotBackfillAfterInteraction());
        },
        pointerup: (value61) => {
          (this._visualSnapshotActivePointers.delete(run5(value61)),
            this._deferVisualSnapshotBackfillAfterInteraction());
        },
        pointercancel: (value62) => {
          (this._visualSnapshotActivePointers.delete(run5(value62)),
            this._deferVisualSnapshotBackfillAfterInteraction());
        },
        wheel: () => {
          this._deferVisualSnapshotBackfillAfterInteraction();
        },
      };
    (el16.addEventListener('pointerdown', value59.pointerdown, true),
      el16.addEventListener('pointerup', value59.pointerup, true),
      el16.addEventListener('pointercancel', value59.pointercancel, true),
      el16.addEventListener('wheel', value59.wheel, { capture: true, passive: true }),
      (this._visualSnapshotInteractionGuardDocument = el16),
      (this._visualSnapshotInteractionGuardHandlers = value59));
  },
  _getActiveCanvasNodeCount() {
    const value63 = this._canvases.find((value64) => value64.id === this._activeId),
      countCanvasNodes2 = countCanvasNodes(value63?.nodes);
    if (countCanvasNodes2 > 0) return countCanvasNodes2;
    return countCanvasNodes(appStore.getStateRaw?.()?.nodes);
  },
  _resolveVisualSnapshotBackfillDelays() {
    return this._getActiveCanvasNodeCount() >= DENSE_VISUAL_SNAPSHOT_NODE_COUNT
      ? DENSE_VISUAL_SNAPSHOT_BACKFILL_DELAYS_MS
      : VISUAL_SNAPSHOT_BACKFILL_DELAYS_MS;
  },
  _isViewportBusyForVisualSnapshot() {
    const dom = typeof document !== 'undefined' ? document : null,
      value65 = dom?.body?.classList,
      value66 = dom?.documentElement?.classList;
    return Boolean(
      value65?.contains?.('is-panning') ||
      value65?.contains?.('is-zooming') ||
      value65?.contains?.('is-viewport-animating') ||
      value65?.contains?.('is-dragging') ||
      value66?.contains?.('is-connecting-mode'),
    );
  },
  _isVisualSnapshotInteractionBusy() {
    if (this._isViewportBusyForVisualSnapshot())
      return (this._holdVisualSnapshotCaptureAfterInteraction(), true);
    if ((this._visualSnapshotActivePointers?.size || 0) > 0) return true;
    return this._getVisualSnapshotNow() < (Number(this._visualSnapshotSettleUntil) || 0);
  },
  _hasPendingVideoLoadForVisualSnapshot() {
    const value67 = typeof document !== 'undefined' ? document : null,
      el18 = value67?.getElementById?.('v2-canvas');
    if (!el18?.querySelectorAll) return false;
    return Array.from(el18.querySelectorAll('video')).some((el19) => {
      if (el19?.isConnected === false || el19?.error) return false;
      const enabled21 = String(
        el19?.currentSrc || el19?.getAttribute?.('src') || el19?.src || '',
      ).trim();
      return !!enabled21 && Number(el19?.readyState || 0) < 2;
    });
  },
  _shouldDeferVisualSnapshotBackfill() {
    if (this._isVisualSnapshotInteractionBusy()) return true;
    if (this._getActiveCanvasNodeCount() < DENSE_VISUAL_SNAPSHOT_NODE_COUNT) return false;
    if (this._hasPendingVideoLoadForVisualSnapshot()) return true;
    const canvasMediaSchedulerStats = getCanvasMediaSchedulerStats();
    return (
      Number(canvasMediaSchedulerStats.imagePreloadActive || 0) > 0 ||
      Number(canvasMediaSchedulerStats.imagePreloadQueued || 0) > 0
    );
  },
  _isVisualSnapshotWorthReplacing(enabled22, enabled23, { force: force = false } = {}) {
    if (!enabled23) return false;
    if (!enabled22) return true;
    const value68 = Math.max(
        0,
        Number(enabled22.readyMediaNodeCount ?? enabled22.mediaNodeCount) || 0,
      ),
      value69 = Math.max(
        0,
        Number(enabled23.readyMediaNodeCount ?? enabled23.mediaNodeCount) || 0,
      );
    if (value69 > value68) return true;
    if (value69 < value68) return false;
    const value70 = Math.max(0, Number(enabled22.visibleNodeCount) || 0),
      value71 = Math.max(0, Number(enabled23.visibleNodeCount) || 0);
    if (value71 > value70) return true;
    return force && value71 >= value70;
  },
  _captureActiveVisualSnapshot({ force: force = false, persistIfChanged: persistIfChanged = false } = {}) {
    if (!this._activeId) return null;
    if (this._isVisualSnapshotInteractionBusy())
      return (this._scheduleVisualSnapshotIdleRetry(this._activeId), null);
    const value72 = this._canvases.findIndex((value73) => value73.id === this._activeId);
    if (value72 === -1) return null;
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
    const value74 = this._canvases[value72]?.visualSnapshot || null;
    if (!this._isVisualSnapshotWorthReplacing(value74, visualSnapshot, { force: force })) return null;
    return (
      (this._canvases[value72] = { ...this._canvases[value72], visualSnapshot: visualSnapshot }),
      persistIfChanged && this._scheduleWorkspaceMetaCacheSave(),
      visualSnapshot
    );
  },
  _getActiveVisualSnapshotCaptureInput({ force: force = false } = {}) {
    if (!this._activeId) return null;
    const idx = this._canvases.findIndex((value75) => value75.id === this._activeId);
    if (idx === -1) return null;
    if (typeof document === 'undefined') return null;
    const canvasEl2 = document.getElementById('v2-canvas');
    if (!canvasEl2) return null;
    const nodes3 = appStore.getStateRaw?.() || {};
    return {
      idx: idx,
      canvasId: this._activeId,
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
    const value76 = Number(this._visualSnapshotBackfillGeneration) || 0,
      enabled24 = this._getActiveVisualSnapshotCaptureInput({ force: force });
    if (!enabled24) return null;
    if (this._isVisualSnapshotInteractionBusy())
      return (this._scheduleVisualSnapshotIdleRetry(enabled24.canvasId), null);
    let visualSnapshot2 = await captureCanvasVisualSnapshotFromElectron(enabled24);
    if (
      this._activeId !== enabled24.canvasId ||
      value76 !== (Number(this._visualSnapshotBackfillGeneration) || 0) ||
      this._isVisualSnapshotInteractionBusy()
    )
      return (
        this._activeId === enabled24.canvasId &&
          this._scheduleVisualSnapshotIdleRetry(enabled24.canvasId),
        null
      );
    if (!visualSnapshot2) {
      if (isChromeShellRuntime() && countCanvasNodes(enabled24.nodes) >= DENSE_VISUAL_SNAPSHOT_NODE_COUNT)
        return null;
      visualSnapshot2 = captureCanvasVisualSnapshot(enabled24);
    }
    if (!visualSnapshot2) return null;
    if (
      this._activeId !== enabled24.canvasId ||
      value76 !== (Number(this._visualSnapshotBackfillGeneration) || 0) ||
      this._isVisualSnapshotInteractionBusy()
    )
      return (
        this._activeId === enabled24.canvasId &&
          this._scheduleVisualSnapshotIdleRetry(enabled24.canvasId),
        null
      );
    const value77 = this._canvases.findIndex(
      (value78) => value78.id === enabled24.canvasId,
    );
    if (value77 === -1) return null;
    const value79 = this._canvases[value77]?.visualSnapshot || null;
    if (!this._isVisualSnapshotWorthReplacing(value79, visualSnapshot2, { force: force })) return null;
    return (
      (this._canvases[value77] = { ...this._canvases[value77], visualSnapshot: visualSnapshot2 }),
      persistIfChanged && this._scheduleWorkspaceMetaCacheSave(),
      visualSnapshot2
    );
  },
  _showCanvasVisualSnapshot(value80) {
    return (
      hideCanvasVisualSnapshotOverlay(),
      this._scheduleCanvasVisibleMediaWarmup(value80, {
        delayMs: CANVAS_MEDIA_WARMUP_OPEN_DELAY_MS,
        maxJobs: CANVAS_MEDIA_WARMUP_SNAPSHOT_MAX_JOBS,
      }),
      false
    );
  },
  _warmupCanvasVisibleMedia(canvas4, { maxJobs: maxJobs2 } = {}) {
    if (typeof document === 'undefined' || !canvas4) return null;
    if (typeof document.getElementById !== 'function') return null;
    const value81 = document.getElementById('v2-canvas'),
      containerEl = value81?.parentElement || document.getElementById('v2-container');
    return warmupCanvasVisibleMedia({ canvas: canvas4, containerEl: containerEl, maxJobs: maxJobs2 });
  },
  _clearCanvasVisibleMediaWarmupTimer() {
    this._mediaWarmupTimer !== null &&
      (clearTimeout(this._mediaWarmupTimer), (this._mediaWarmupTimer = null));
  },
  _scheduleCanvasVisibleMediaWarmup(
    enabled25,
    {
      delayMs: delayMs = CANVAS_MEDIA_WARMUP_OPEN_DELAY_MS,
      maxJobs: maxJobs = CANVAS_MEDIA_WARMUP_OPEN_MAX_JOBS,
    } = {},
  ) {
    this._clearCanvasVisibleMediaWarmupTimer();
    if (!enabled25) return null;
    const value82 = enabled25.id || null,
      timer = setTimeout(
        () => {
          this._mediaWarmupTimer = null;
          if (value82 && this._activeId !== value82) return;
          this._warmupCanvasVisibleMedia(enabled25, { maxJobs: maxJobs });
        },
        Math.max(0, Number(delayMs) || 0),
      );
    return (timer?.unref?.(), (this._mediaWarmupTimer = timer), timer);
  },
  _scheduleVisualSnapshotBackfill() {
    this._clearVisualSnapshotBackfillTimers();
    if (!this._activeId) return;
    (this._invalidateVisualSnapshotBackfillCapture(), this._bindVisualSnapshotInteractionGuard());
    const value83 = this._activeId;
    this._visualSnapshotBackfillTimers = this._resolveVisualSnapshotBackfillDelays().map(
      (value84) => this._scheduleVisualSnapshotBackfillTimer(value83, value84),
    );
  },
  _scheduleVisualSnapshotIdleRetry(value85, value86 = VISUAL_SNAPSHOT_BACKFILL_RETRY_MS) {
    if (
      this._visualSnapshotIdleRetryTimer !== null &&
      this._visualSnapshotIdleRetryCanvasId === value85
    )
      return this._visualSnapshotIdleRetryTimer;
    this._clearVisualSnapshotIdleRetryTimer();
    const timer2 = setTimeout(
      () => {
        if (this._visualSnapshotIdleRetryTimer !== timer2) return;
        ((this._visualSnapshotIdleRetryTimer = null), (this._visualSnapshotIdleRetryCanvasId = null));
        if (this._activeId !== value85) return;
        if (this._shouldDeferVisualSnapshotBackfill()) {
          this._scheduleVisualSnapshotIdleRetry(value85);
          return;
        }
        void this._requestVisualSnapshotBackfillCapture(value85);
      },
      Math.max(0, Number(value86) || 0),
    );
    return (
      timer2?.unref?.(),
      (this._visualSnapshotIdleRetryTimer = timer2),
      (this._visualSnapshotIdleRetryCanvasId = value85),
      timer2
    );
  },
  _requestVisualSnapshotBackfillCapture(value87) {
    if (this._activeId !== value87) return Promise.resolve(null);
    if (this._shouldDeferVisualSnapshotBackfill())
      return (this._scheduleVisualSnapshotIdleRetry(value87), Promise.resolve(null));
    if (this._visualSnapshotBackfillCapturePromise) return this._visualSnapshotBackfillCapturePromise;
    const value88 = this._captureActiveVisualSnapshotAsync({ force: false, persistIfChanged: true }),
      value89 = Promise.resolve(value88).finally(() => {
        this._visualSnapshotBackfillCapturePromise === value89 &&
          (this._visualSnapshotBackfillCapturePromise = null);
      });
    return ((this._visualSnapshotBackfillCapturePromise = value89), value89);
  },
  _scheduleVisualSnapshotBackfillTimer(value90, value91) {
    const timer3 = setTimeout(
      () => {
        this._visualSnapshotBackfillTimers = (this._visualSnapshotBackfillTimers || []).filter(
          (value92) => value92 !== timer3,
        );
        if (this._activeId !== value90) return;
        if (this._shouldDeferVisualSnapshotBackfill()) {
          this._scheduleVisualSnapshotIdleRetry(value90);
          return;
        }
        (this._clearVisualSnapshotIdleRetryTimer(),
          void this._requestVisualSnapshotBackfillCapture(value90));
      },
      Math.max(0, Number(value91) || 0),
    );
    return (timer3?.unref?.(), timer3);
  },
  _hydrateCanvasSnapshot(value93, { preserveLiveGeneration: preserveLiveGeneration = false } = {}) {
    (markPerf('hydrateTrustedSnapshot:start'),
      appStore.hydrateTrustedSnapshot(value93, { preserveLiveGeneration: preserveLiveGeneration }),
      markPerf('hydrateTrustedSnapshot:end'),
      measurePerf('hydrateTrustedSnapshot', 'hydrateTrustedSnapshot:start', 'hydrateTrustedSnapshot:end'),
      this._rememberCanvasPersistRev());
  },
  hydrateActiveCanvasSnapshot(value94) {
    if (!this._activeId) return;
    const value95 = this._canvases.findIndex((value96) => value96.id === this._activeId);
    if (value95 === -1) return;
    ((this._canvases[value95] = this._buildCanvasRecord(this._canvases[value95], value94)),
      this._scheduleCanvasVisibleMediaWarmup(this._canvases[value95]),
      this._clearCanvasSurface(),
      this._hydrateCanvasSnapshot(this._canvases[value95]),
      this._scheduleVisualSnapshotBackfill());
  },
  init(value97, { markClean: markClean = true } = {}) {
    ((this._projectBadges = new Map()),
      this._bindVisualSnapshotInteractionGuard(),
      this._invalidateVisualSnapshotBackfillCapture(),
      (this._backgroundTaskStores = new Map()),
      (this._canvases = Array.isArray(value97.canvases)
        ? value97.canvases.map((value98) => this._buildCanvasRecord(value98, value98))
        : []));
    const map = new Map(
      (Array.isArray(value97?.projectContexts) ? value97.projectContexts : [])
        .filter((value99) => value99?.canvasId)
        .map((value100) => [String(value100.canvasId), value100]),
    );
    ((this._projectContextByCanvasId = new Map()),
      (this._lastPersistRevByCanvas = new Map()),
      (this._lastContentPersistRevByCanvas = new Map()),
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
        this._projectContextByCanvasId.set(
          id2,
          normalizeCanvasProjectContext(
            { projectName: this._canvases[0].name, isTemporary: true },
            { canvasId: id2, projectName: this._canvases[0].name },
          ),
        ),
        this._hydrateCanvasSnapshot(this._canvases[0]));
    } else {
      const value101 =
        this._canvases.find((value102) => value102?.id === value97.activeCanvasId) ||
        this._canvases[0];
      this._activeId = value101?.id ?? null;
      const captureCurrentProjectContext2 = captureCurrentProjectContext(value101);
      (this._canvases.forEach((projectId) => {
        const value103 = map.get(String(projectId?.id)),
          value104 =
            projectId.id === this._activeId
              ? captureCurrentProjectContext2
              : {
                  projectId: projectId.name || projectId.id,
                  projectName: projectId.name,
                  isTemporary: true,
                  workspaceProjectScoped: true,
                };
        this._projectContextByCanvasId.set(
          projectId.id,
          normalizeCanvasProjectContext(value103 || value104, {
            canvasId: projectId.id,
            projectName: projectId.name,
          }),
        );
      }),
        value101 &&
          (this._showCanvasVisualSnapshot(value101),
          this._hydrateCanvasSnapshot(value101),
          this._scheduleVisualSnapshotBackfill()));
    }
    (resetHistory(),
      this._resetSavedCanvasSignatures({ markClean: markClean }),
      this.renderTabs(),
      startVideoThumbBackfill(),
      this._applyActiveCanvasProjectContext(),
      this._notifyActiveCanvasChanged('init'),
      this._notifyDirtyStateChanged());
  },
  replaceWorkspace(value105, { markClean: markClean = true } = {}) {
    return (
      this._flushCurrentCanvas(),
      this._clearVisualSnapshotBackfillTimers(),
      this._clearCanvasVisibleMediaWarmupTimer(),
      this._clearCanvasSurface(),
      this.init(value105, { markClean: markClean }),
      this._scheduleWorkspaceCacheSave(),
      true
    );
  },
  _flushCurrentCanvas() {
    if (!this._activeId) return;
    const value106 = this._canvases.findIndex((value107) => value107.id === this._activeId);
    if (value106 === -1) return;
    flushAllPendingPromptHtmlCommits();
    const _persistRevHint2 = this._getStorePersistRev();
    if (this._lastPersistRevByCanvas.get(this._activeId) === _persistRevHint2) return;
    const _contentPersistRevHint2 = this._getStoreContentPersistRev();
    if (this._lastContentPersistRevByCanvas.get(this._activeId) === _contentPersistRevHint2) {
      const box2 = appStore.getStateRaw()?.viewport || {};
      ((this._canvases[value106] = {
        ...this._canvases[value106],
        viewport: {
          x: Number(box2.x) || 0,
          y: Number(box2.y) || 0,
          zoom: Number(box2.zoom) || 1.1,
        },
        _persistRevHint: _persistRevHint2,
        _contentPersistRevHint: _contentPersistRevHint2,
      }),
        this._lastPersistRevByCanvas.set(this._activeId, _persistRevHint2));
      return;
    }
    const markRecoveringGenerationSnapshot2 = markRecoveringGenerationSnapshot(appStore.serialize()),
      value108 = this._buildCanvasRecord(this._canvases[value106], markRecoveringGenerationSnapshot2);
    ((value108._persistRevHint = _persistRevHint2),
      (value108._contentPersistRevHint = _contentPersistRevHint2),
      (this._canvases[value106] = value108),
      this._lastPersistRevByCanvas.set(this._activeId, _persistRevHint2),
      this._lastContentPersistRevByCanvas.set(this._activeId, _contentPersistRevHint2));
  },
  async switchTo(value109) {
    if (value109 === this._activeId) return;
    if (!this._canvases.some((value110) => value110.id === value109)) return;
    return this._runTaskSafeCanvasTransition(() => {
      let enabled26 = this._canvases.find((value111) => value111.id === value109);
      if (!enabled26 || value109 === this._activeId) return false;
      this._flushCurrentCanvas();
      const response = this._handoffActiveCanvasTasks(this._activeId);
      if (response?.ok === false) return (this._showTaskTransitionBlocked(response), false);
      const value112 = this._backgroundTaskStores.get(value109);
      return (
        value112 &&
          (this._syncBackgroundTaskCanvas(value109, value112, { persist: false }),
          (enabled26 = this._canvases.find((value113) => value113.id === value109))),
        this._showCanvasVisualSnapshot(enabled26),
        this._clearCanvasSurface(),
        (this._activeId = value109),
        this._hydrateCanvasSnapshot(enabled26, {
          preserveLiveGeneration: canvasHasLiveGeneration(enabled26),
        }),
        this._restoreActiveCanvasTasks(value109),
        this._scheduleVisualSnapshotBackfill(),
        resetHistory(),
        this.renderTabs(),
        startVideoThumbBackfill(),
        this._applyActiveCanvasProjectContext(),
        this._notifyActiveCanvasChanged('switch'),
        this._markCanvasMetaDirty(),
        this._notifyDirtyStateChanged(),
        true
      );
    });
  },
  async addCanvas() {
    return this._runTaskSafeCanvasTransition(() => {
      this._flushCurrentCanvas();
      const response2 = this._handoffActiveCanvasTasks(this._activeId);
      if (response2?.ok === false) return (this._showTaskTransitionBlocked(response2), false);
      this._clearCanvasSurface();
      const id3 = 'canvas_' + Date.now(),
        name = canvasTabsText('newCanvasName', { index: this._canvases.length + 1 });
      return (
        this._canvases.push({ id: id3, name: name, ...createEmptyCanvasSnapshot() }),
        this._projectContextByCanvasId.set(
          id3,
          normalizeCanvasProjectContext(
            { projectName: name, isTemporary: true },
            { canvasId: id3, projectName: name },
          ),
        ),
        (this._activeId = id3),
        this._hydrateCanvasSnapshot(createEmptyCanvasSnapshot()),
        this._scheduleVisualSnapshotBackfill(),
        resetHistory(),
        this.renderTabs(),
        startVideoThumbBackfill(),
        this._applyActiveCanvasProjectContext(),
        this._notifyActiveCanvasChanged('add'),
        this._markCanvasMetaDirty(),
        this._notifyDirtyStateChanged(),
        true
      );
    });
  },
  async _confirmDeleteDirtyCanvas(value114, { skipDirtyConfirm: skipDirtyConfirm = false } = {}) {
    if (skipDirtyConfirm || !this.isCanvasDirty(value114?.id)) return true;
    return this._showUnsavedDeleteConfirm(value114);
  },
  _showUnsavedDeleteConfirm(name2) {
    if (typeof document === 'undefined' || !document.body) return Promise.resolve(false);
    return (
      document.getElementById('canvas-delete-confirm-overlay')?.remove(),
      new Promise((handler3) => {
        const el20 = document.createElement('div');
        ((el20.id = 'canvas-delete-confirm-overlay'),
          (el20.className = 'custom-confirm-overlay'));
        const el21 = document.createElement('div');
        el21.className = 'custom-confirm-box';
        const el22 = document.createElement('div');
        ((el22.className = 'confirm-title'),
          (el22.textContent = canvasTabsText('deleteUnsaved.title')));
        const el23 = document.createElement('div');
        ((el23.className = 'confirm-msg'),
          (el23.textContent = canvasTabsText('deleteUnsaved.message', {
            name: name2?.name || canvasTabsText('untitledCanvas'),
          })));
        const el24 = document.createElement('div');
        el24.className = 'confirm-btns';
        const el25 = document.createElement('button');
        ((el25.type = 'button'),
          (el25.className = 'confirm-btn confirm-cancel'),
          (el25.textContent = canvasTabsText('deleteUnsaved.cancel')));
        const el26 = document.createElement('button');
        ((el26.type = 'button'),
          (el26.className = 'confirm-btn confirm-ok'),
          (el26.textContent = canvasTabsText('deleteUnsaved.delete')),
          el24.appendChild(el25),
          el24.appendChild(el26),
          el21.appendChild(el22),
          el21.appendChild(el23),
          el21.appendChild(el24),
          el20.appendChild(el21),
          document.body.appendChild(el20));
        let value115 = false;
        const run6 = (value116) => {
            if (value115) return;
            ((value115 = true),
              document.removeEventListener('keydown', value117, true),
              el20.remove(),
              handler3(value116));
          },
          value117 = (event11) => {
            if (event11.key === 'Escape') {
              (event11.preventDefault(), run6(false));
              return;
            }
            event11.key === 'Enter' &&
              !event11.isComposing &&
              (event11.preventDefault(), run6(true));
          };
        (el20.addEventListener('click', (event12) => {
          if (event12.target === el20) run6(false);
        }),
          el25.addEventListener('click', () => run6(false)),
          el26.addEventListener('click', () => run6(true)),
          document.addEventListener('keydown', value117, true),
          el25.focus?.());
      })
    );
  },
  async deleteCanvas(value118, value119 = {}) {
    if (
      value118 === this._activeId &&
      (await appStore.getGraphMutationPolicy?.()?.beforeWorkspaceTransition?.()) === false
    )
      return false;
    if (this._canvases.length <= 1)
      return (window.showToast(canvasTabsText('keepOneCanvas'), 'warn'), false);
    const value120 = this._canvases.findIndex((value121) => value121.id === value118);
    if (value120 === -1) return false;
    if (value118 === this._activeId) this._flushCurrentCanvas();
    const value122 = this._canvases[value120];
    if (canvasHasLiveGeneration(value122))
      return (this._showTaskTransitionBlocked({ activeCount: 1 }, 'deleteBlockedByTasks'), false);
    const enabled27 = await this._confirmDeleteDirtyCanvas(value122, value119);
    if (!enabled27) return false;
    (this._canvases.splice(value120, 1),
      this._projectContextByCanvasId.delete(value118),
      this._backgroundTaskStores.delete(value118),
      this._lastPersistRevByCanvas.delete(value118),
      this._lastContentPersistRevByCanvas.delete(value118),
      this._savedSignatureByCanvas.delete(value118));
    if (this._activeId === value118) {
      const value123 = this._canvases[Math.max(0, value120 - 1)];
      ((this._activeId = value123.id),
        this._showCanvasVisualSnapshot(value123),
        this._clearCanvasSurface(),
        this._hydrateCanvasSnapshot(value123, {
          preserveLiveGeneration: canvasHasLiveGeneration(value123),
        }),
        this._scheduleVisualSnapshotBackfill(),
        resetHistory(),
        this._applyActiveCanvasProjectContext(),
        this._notifyActiveCanvasChanged('delete'));
    }
    return (
      this.renderTabs(),
      startVideoThumbBackfill(),
      this._markCanvasMetaDirty(),
      this._notifyDirtyStateChanged(),
      true
    );
  },
  renameCanvas(value124, value125) {
    const error7 = this._canvases.find((value126) => value126.id === value124);
    if (!error7) return;
    const enabled28 = String(value125 || '').trim(),
      value127 = String(error7.name || '').trim();
    if (!enabled28 || enabled28 === value127) return;
    ((error7.name = enabled28),
      this.renderTabs(),
      this._markCanvasMetaDirty(),
      this._notifyDirtyStateChanged());
  },
  captureCanvasSaveCheckpoint(canvasId5 = this._activeId, { name: name3 } = {}) {
    if (canvasId5 === this._activeId) this._flushCurrentCanvas();
    const args9 = this._canvases.find((value128) => value128.id === canvasId5);
    if (!args9) return null;
    return Object.freeze({
      canvasId: canvasId5,
      signature: this._buildCanvasSavedSignature(
        name3 === undefined ? args9 : { ...args9, name: name3 },
      ),
    });
  },
  markCanvasClean(enabled29 = this._activeId, { checkpoint: checkpoint } = {}) {
    if (!enabled29) return false;
    if (checkpoint && checkpoint.canvasId !== enabled29) return false;
    if (enabled29 === this._activeId) this._flushCurrentCanvas();
    const enabled30 = this._canvases.find((value129) => value129.id === enabled29);
    if (!enabled30) return false;
    return (
      this._savedSignatureByCanvas.set(
        enabled29,
        checkpoint?.signature || this._buildCanvasSavedSignature(enabled30),
      ),
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
  isCanvasDirty(enabled31 = this._activeId) {
    if (!enabled31) return false;
    if (enabled31 === this._activeId) this._flushCurrentCanvas();
    const enabled32 = this._canvases.find((value130) => value130.id === enabled31);
    if (!enabled32) return false;
    const enabled33 = this._savedSignatureByCanvas.get(enabled31);
    if (!enabled33) return true;
    return enabled33 !== this._buildCanvasSavedSignature(enabled32);
  },
  hasDirtyCanvases() {
    return (
      this._flushCurrentCanvas(),
      this._canvases.some((value131) => {
        const enabled34 = value131?.id;
        if (!enabled34) return false;
        const enabled35 = this._savedSignatureByCanvas.get(enabled34);
        return !enabled35 || enabled35 !== this._buildCanvasSavedSignature(value131);
      })
    );
  },
  getMultiDataSnapshot({
    sanitizeForPersistence: sanitizeForPersistence = false,
    captureVisualSnapshot: captureVisualSnapshot = true,
    includeProjectContexts: includeProjectContexts = false,
  } = {}) {
    this._flushCurrentCanvas();
    captureVisualSnapshot && this._captureActiveVisualSnapshot({ force: false });
    const cloneMultiDataSnapshot2 = cloneMultiDataSnapshot({
      canvases: this._canvases,
      activeCanvasId: this._activeId,
      ...(includeProjectContexts
        ? {
            projectContexts: this._canvases
              .map((canvasId6) => {
                const args10 = this._projectContextByCanvasId.get(canvasId6?.id);
                return args10 ? { canvasId: canvasId6.id, ...args10 } : null;
              })
              .filter(Boolean),
          }
        : {}),
    });
    if (!sanitizeForPersistence) return cloneMultiDataSnapshot2;
    return sanitizeMultiCanvasDataForPersistence(cloneMultiDataSnapshot2 || {});
  },
  getMultiData() {
    return this.getMultiDataSnapshot();
  },
  getPersistableMultiDataSnapshot({ includeProjectContexts: includeProjectContexts = false } = {}) {
    return (
      this._flushCurrentCanvas(),
      {
        canvases: this._canvases.map((args11) => ({
          ...args11,
          viewport: { ...(args11?.viewport || {}) },
        })),
        activeCanvasId: this._activeId,
        ...(includeProjectContexts
          ? {
              projectContexts: this._canvases
                .map((canvasId7) => {
                  const args12 = this._projectContextByCanvasId.get(canvasId7?.id);
                  return args12 ? { canvasId: canvasId7.id, ...args12 } : null;
                })
                .filter(Boolean),
            }
          : {}),
      }
    );
  },
  getActiveCanvasId() {
    return this._activeId || '';
  },
  getPersistenceRevisionSnapshot() {
    const activeCanvasId = this._activeId || '',
      value132 = this._getStorePersistRev();
    return {
      activeCanvasId: activeCanvasId,
      canvases: this._canvases.map((persistRev) => ({
        id: String(persistRev?.id || ''),
        name: String(persistRev?.name || ''),
        persistRev:
          persistRev?.id === activeCanvasId ? value132 : Number(persistRev?._persistRevHint) || 0,
        contentPersistRev:
          persistRev?.id === activeCanvasId
            ? this._getStoreContentPersistRev()
            : Number(persistRev?._contentPersistRevHint) || 0,
      })),
    };
  },
  renderTabs() {
    const enabled36 = document.getElementById('canvasTabs');
    if (!enabled36) return;
    this._bindTabContainerEvents(enabled36);
    const value133 = this._getTabsRenderSignature();
    if (value133 === this._lastTabsRenderSignature) return;
    ((this._lastTabsRenderSignature = value133), this._removeTabContextMenu());
    const el27 = document.createDocumentFragment();
    (this._canvases.forEach((error8) => {
      const value134 = error8.id === this._activeId,
        el28 = document.createElement('div');
      ((el28.className = 'canvas-tab' + (value134 ? ' active' : '')),
        (el28.dataset.id = error8.id));
      const el29 = document.createElement('span');
      ((el29.className = 'canvas-tab-name'),
        (el29.dataset.tooltip = error8.name),
        (el29.dataset.tooltipOverflow = 'true'),
        (el29.textContent = error8.name));
      const el30 = document.createElement('button');
      ((el30.type = 'button'),
        (el30.className = 'canvas-tab-close'),
        (el30.title = canvasTabsText('closeCanvas')),
        (el30.textContent = '×'),
        el28.appendChild(el29));
      const value135 = this.getCanvasProjectAccess(error8.id),
        canvasProjectBadge2 = createCanvasProjectBadge(value135);
      if (canvasProjectBadge2) el28.prepend(canvasProjectBadge2);
      (el28.appendChild(el30), el27.appendChild(el28));
    }),
      enabled36.replaceChildren(el27),
      this._revealActiveTab(enabled36),
      this._updateTabScrollHints(enabled36));
  },
};
export default CanvasTabManager;
export { CanvasTabManager };
