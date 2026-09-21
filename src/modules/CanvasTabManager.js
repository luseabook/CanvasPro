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
function canvasTabsText(_0x290b1b, _0x4ba789 = {}) {
  return t('canvasTabs.' + _0x290b1b, _0x4ba789);
}
function markPerf(_0x502796) {
  if (typeof performance?.mark !== 'function') return;
  performance.mark(_0x502796);
}
function measurePerf(_0x1b8fff, _0x3f95c5, _0x484a7d) {
  if (typeof performance?.measure !== 'function') return;
  try {
    performance.measure(_0x1b8fff, _0x3f95c5, _0x484a7d);
  } catch {}
}
const CANVAS_MEDIA_WARMUP_OPEN_DELAY_MS = 0x15e,
  CANVAS_MEDIA_WARMUP_OPEN_MAX_JOBS = 96,
  CANVAS_MEDIA_WARMUP_SNAPSHOT_MAX_JOBS = 48;
function createEmptyCanvasSnapshot() {
  return { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1.1 }, assets: [], _persistRevHint: 0 };
}
function cloneMultiDataSnapshot(_0x4ac907) {
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(_0x4ac907);
    } catch {}
  try {
    return JSON.parse(JSON.stringify(_0x4ac907));
  } catch {
    return { canvases: [], activeCanvasId: null };
  }
}
function isRecoverableTaskStatus(_0xb45dbf) {
  const _0x58a8c3 = String(_0xb45dbf || '').trim();
  return !_0x58a8c3 || !isGenerationTaskTerminalStatus(_0x58a8c3);
}
function markRecoveringGenerationNode(_0x5c4ac1) {
  if (!_0x5c4ac1 || typeof _0x5c4ac1 !== 'object') return _0x5c4ac1;
  if (!_0x5c4ac1.generationStartTime || _0x5c4ac1.generationDuration != null) return _0x5c4ac1;
  const _0x4c1530 = { ..._0x5c4ac1 };
  let _0x344b77 = false;
  String(_0x4c1530.rhTaskId || '').trim() &&
    isRecoverableTaskStatus(_0x4c1530.rhTaskStatus) &&
    ((_0x4c1530.rhTaskRecovering = true), (_0x344b77 = true));
  String(_0x4c1530.dreaminaSubmitId || '').trim() &&
    isRecoverableTaskStatus(_0x4c1530.dreaminaTaskStatus) &&
    isRecoverableTaskStatus(_0x4c1530.dreaminaTaskPhase) &&
    ((_0x4c1530.dreaminaTaskRecovering = true), (_0x344b77 = true));
  String(_0x4c1530.asyncTaskId || '').trim() &&
    isRecoverableTaskStatus(_0x4c1530.asyncTaskStatus) &&
    ((_0x4c1530.asyncTaskRecovering = true), (_0x344b77 = true));
  if (!_0x344b77) return _0x5c4ac1;
  return (
    (_0x4c1530.isGenerating = true),
    (_0x4c1530.jobStatus = isRecoverableTaskStatus(_0x4c1530.jobStatus) ? 'running' : _0x4c1530.jobStatus),
    (_0x4c1530.generationDuration = null),
    _0x4c1530
  );
}
function markRecoveringGenerationSnapshot(_0x73ab90) {
  if (!_0x73ab90 || typeof _0x73ab90 !== 'object') return _0x73ab90;
  if (Array.isArray(_0x73ab90.nodes))
    return {
      ..._0x73ab90,
      nodes: _0x73ab90.nodes.map((_0x3cf5db) => markRecoveringGenerationNode(_0x3cf5db)),
    };
  if (_0x73ab90.nodes && typeof _0x73ab90.nodes === 'object')
    return {
      ..._0x73ab90,
      nodes: Object.fromEntries(
        Object.entries(_0x73ab90.nodes).map(([_0x3e9a7c, _0x26a8f4]) => [
          _0x3e9a7c,
          markRecoveringGenerationNode(_0x26a8f4),
        ]),
      ),
    };
  return _0x73ab90;
}
function getCanvasNodesList(_0x7882d = {}) {
  const _0x551331 = _0x7882d?.nodes;
  if (Array.isArray(_0x551331)) return _0x551331;
  if (_0x551331 && typeof _0x551331 === 'object') return Object.values(_0x551331);
  return [];
}
function hasLiveGenerationNode(_0x12e35f = {}) {
  if (!_0x12e35f || typeof _0x12e35f !== 'object') return false;
  if (_0x12e35f.isGenerating !== true || _0x12e35f.generationDuration != null) return false;
  const _0x13d823 = [
    _0x12e35f.jobStatus,
    _0x12e35f.rhTaskStatus,
    _0x12e35f.dreaminaTaskStatus,
    _0x12e35f.dreaminaTaskPhase,
    _0x12e35f.asyncTaskStatus,
    _0x12e35f.mediaTaskStatus,
  ];
  return !_0x13d823.some((_0x52d81f) => {
    const _0x574598 = String(_0x52d81f || '')
      .trim()
      .toLowerCase();
    if (!_0x574598 || _0x574598 === 'idle') return false;
    return isGenerationTaskTerminalStatus(_0x574598);
  });
}
function canvasHasLiveGeneration(_0x525a4f = {}) {
  return getCanvasNodesList(_0x525a4f).some((_0x1b6916) => hasLiveGenerationNode(_0x1b6916));
}
export function buildTabsRenderSignature(_0x5cc914 = [], _0x4cfc25 = null) {
  return (
    (_0x4cfc25 || '') +
    '::' +
    (Array.isArray(_0x5cc914) ? _0x5cc914 : [])
      .map((_0x4fec7a) => (_0x4fec7a?.id || '') + ':' + (_0x4fec7a?.name || ''))
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
  _rememberCanvasPersistRev(_0x5ca967 = this._activeId) {
    if (!_0x5ca967) return;
    this._lastPersistRevByCanvas.set(_0x5ca967, this._getStorePersistRev());
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
  _buildCanvasStructureDigest(_0x1aab72, _0x408702) {
    const _0x3caa25 = Array.isArray(_0x1aab72)
      ? _0x1aab72
      : _0x1aab72 && typeof _0x1aab72 === 'object'
        ? Object.values(_0x1aab72)
        : [];
    let _0xefff30 = '' + _0x3caa25.length;
    for (const _0x5ba3cd of _0x3caa25) {
      if (!_0x5ba3cd || typeof _0x5ba3cd !== 'object') continue;
      _0xefff30 += '|';
      for (const _0xc76280 of _0x408702) {
        _0xefff30 += String(_0x5ba3cd[_0xc76280] ?? '') + ',';
      }
    }
    return _0xefff30;
  },
  _buildCanvasSavedSignature(_0x1b8b47) {
    const _0x14e00e =
        _0x1b8b47?.viewport && typeof _0x1b8b47.viewport === 'object'
          ? _0x1b8b47.viewport
          : { x: 0, y: 0, zoom: 1.1 },
      _0x10d33c = Number.isFinite(_0x1b8b47?._persistRevHint) ? Number(_0x1b8b47._persistRevHint) : 0;
    return createStableSignature({
      id: _0x1b8b47?.id ?? null,
      name: _0x1b8b47?.name ?? '未命名画布',
      persistRevHint: _0x10d33c,
      viewport: {
        x: Number(_0x14e00e.x) || 0,
        y: Number(_0x14e00e.y) || 0,
        zoom: Number(_0x14e00e.zoom) || 1.1,
      },
      nodes: this._buildCanvasStructureDigest(_0x1b8b47?.nodes, [
        'id',
        'type',
        'x',
        'y',
        'width',
        'height',
        'parentId',
      ]),
      edges: this._buildCanvasStructureDigest(_0x1b8b47?.edges, ['id', 'sourceId', 'targetId']),
      assets: this._buildCanvasStructureDigest(_0x1b8b47?.assets, ['id', 'type', 'localPath']),
    });
  },
  _resetSavedCanvasSignatures({ markClean: markClean = true } = {}) {
    this._savedSignatureByCanvas = new Map();
    if (!markClean) return;
    this._canvases.forEach((_0x29d198) => {
      if (!_0x29d198?.id) return;
      this._savedSignatureByCanvas.set(_0x29d198.id, this._buildCanvasSavedSignature(_0x29d198));
    });
  },
  _removeTabContextMenu() {
    const _0x10df63 = document.getElementById('tab-context-menu');
    if (_0x10df63) _0x10df63.remove();
  },
  _startTabRename(_0xf04ddd) {
    if (!_0xf04ddd) return;
    ((_0xf04ddd.contentEditable = 'true'), _0xf04ddd.focus());
    const _0x27d0f8 = document.createRange();
    _0x27d0f8.selectNodeContents(_0xf04ddd);
    const _0x2b9c78 = window.getSelection?.();
    if (!_0x2b9c78) return;
    (_0x2b9c78.removeAllRanges(), _0x2b9c78.addRange(_0x27d0f8));
  },
  _commitTabRename(_0x46fbcb, { deferRender: deferRender = false } = {}) {
    if (!_0x46fbcb) return;
    const _0x1da988 = _0x46fbcb.closest('.canvas-tab'),
      _0x40f12d = _0x1da988?.dataset?.id;
    if (!_0x40f12d) return;
    const _0x3fa894 = this._canvases.find((_0x326cd2) => _0x326cd2.id === _0x40f12d);
    if (!_0x3fa894) return;
    const _0x165c97 = _0x3fa894.name,
      _0x264200 = String(_0x46fbcb.textContent || '').trim();
    ((_0x46fbcb.contentEditable = 'false'),
      this.renameCanvas(_0x40f12d, _0x264200),
      (_0x46fbcb.textContent =
        this._canvases.find((_0x3f79c7) => _0x3f79c7.id === _0x40f12d)?.name || _0x165c97));
    if (deferRender) {
      window.setTimeout(() => this.renderTabs(), 0);
      return;
    }
    this.renderTabs();
  },
  _bindTabContainerEvents(_0x22719c) {
    if (this._tabContainerBound || !_0x22719c) return;
    this._tabContainerBound = true;
    let _0x47c8d2 = '',
      _0x444807 = 0;
    const _0x3d84e5 = (_0x55f045) => {
        const _0x30541a = _0x55f045.target.closest('.canvas-tab');
        if (!_0x30541a || !_0x22719c.contains(_0x30541a)) return '';
        return _0x30541a.dataset.id || '';
      },
      _0x2c502c = (_0x577040) => {
        if (_0x577040.button !== 1) return false;
        const _0x4de506 = _0x3d84e5(_0x577040);
        if (!_0x4de506) return false;
        return (
          _0x577040.preventDefault(),
          _0x577040.stopPropagation(),
          (_0x47c8d2 = _0x4de506),
          (_0x444807 = Date.now()),
          void this.deleteCanvas(_0x4de506),
          true
        );
      };
    (_0x22719c.addEventListener('click', (_0x3fbf16) => {
      const _0x434d47 = _0x3fbf16.target.closest('.canvas-tab');
      if (!_0x434d47 || !_0x22719c.contains(_0x434d47)) return;
      const _0x28db18 = _0x434d47.dataset.id;
      if (!_0x28db18) return;
      const _0x55aa70 = this._canvases.find((_0xaae8e2) => _0xaae8e2.id === _0x28db18);
      if (!_0x55aa70) return;
      const _0x1f817a = _0x3fbf16.target.closest('.canvas-tab-close');
      if (_0x1f817a) {
        (_0x3fbf16.stopPropagation(), void this.deleteCanvas(_0x28db18));
        return;
      }
      const _0x20ad4d = _0x434d47.querySelector('.canvas-tab-name'),
        _0x14ea3c = _0x28db18 === this._activeId;
      if (_0x14ea3c) {
        if (_0x20ad4d?.contentEditable === 'true') return;
        this._startTabRename(_0x20ad4d);
        return;
      }
      this.switchTo(_0x28db18);
    }),
      _0x22719c.addEventListener('pointerdown', (_0x39ff4e) => {
        _0x2c502c(_0x39ff4e);
      }),
      _0x22719c.addEventListener('auxclick', (_0x34c1df) => {
        if (_0x34c1df.button !== 1) return;
        const _0x3c61e4 = _0x3d84e5(_0x34c1df);
        if (!_0x3c61e4) return;
        (_0x34c1df.preventDefault(), _0x34c1df.stopPropagation());
        if (_0x3c61e4 === _0x47c8d2 && Date.now() - _0x444807 < 0x320) return;
        ((_0x47c8d2 = _0x3c61e4), (_0x444807 = Date.now()), void this.deleteCanvas(_0x3c61e4));
      }),
      _0x22719c.addEventListener('contextmenu', async (_0x58790d) => {
        const _0x30a19b = _0x58790d.target.closest('.canvas-tab');
        if (!_0x30a19b || !_0x22719c.contains(_0x30a19b)) return;
        const _0x3d885b = _0x30a19b.dataset.id;
        if (!_0x3d885b) return;
        const _0x4516b5 = this._canvases.find((_0x4b2951) => _0x4b2951.id === _0x3d885b);
        if (!_0x4516b5) return;
        (_0x58790d.preventDefault(), _0x58790d.stopPropagation());
        const _0x2604e5 = () => {
          this._showTabContextMenu(_0x4516b5, { clientX: _0x58790d.clientX, clientY: _0x58790d.clientY });
        };
        (_0x3d885b !== this._activeId && (await this.switchTo(_0x3d885b)), _0x2604e5());
      }),
      _0x22719c.addEventListener('focusout', (_0x15759f) => {
        const _0x5081ee = _0x15759f.target.closest('.canvas-tab-name');
        if (!_0x5081ee || !_0x22719c.contains(_0x5081ee)) return;
        if (_0x5081ee.contentEditable !== 'true') return;
        this._commitTabRename(_0x5081ee, { deferRender: true });
      }),
      _0x22719c.addEventListener('keydown', (_0x19edc6) => {
        const _0x27fbff = _0x19edc6.target.closest('.canvas-tab-name');
        if (!_0x27fbff || !_0x22719c.contains(_0x27fbff)) return;
        if (_0x27fbff.contentEditable !== 'true') return;
        if (_0x19edc6.key === 'Enter') {
          (_0x19edc6.preventDefault(), _0x27fbff.blur());
          return;
        }
        if (_0x19edc6.key === 'Escape') {
          _0x19edc6.preventDefault();
          const _0x11b0d4 = _0x27fbff.closest('.canvas-tab')?.dataset?.id,
            _0x4084d8 = this._canvases.find((_0x41cc2b) => _0x41cc2b.id === _0x11b0d4);
          if (_0x4084d8) _0x27fbff.textContent = _0x4084d8.name;
          _0x27fbff.blur();
        }
      }));
  },
  _showTabContextMenu(_0x26df08, { clientX: clientX = 0, clientY: clientY = 0 } = {}) {
    if (!_0x26df08) return;
    this._removeTabContextMenu();
    const _0x580dd0 = document.createElement('div');
    ((_0x580dd0.id = 'tab-context-menu'),
      (_0x580dd0.className = 'v2-dropdown-menu open'),
      (_0x580dd0.style.position = 'fixed'),
      (_0x580dd0.style.left = clientX + 'px'),
      (_0x580dd0.style.top = clientY + 'px'),
      (_0x580dd0.style.zIndex = 0x270f),
      (_0x580dd0.style.minWidth = '120px'));
    const _0x4f1387 = 'http://www.w3.org/2000/svg',
      _0x1486bd = () => {
        const _0x368955 = document.createElementNS(_0x4f1387, 'svg');
        return (
          _0x368955.setAttribute('width', '14'),
          _0x368955.setAttribute('height', '14'),
          _0x368955.setAttribute('viewBox', '0 0 24 24'),
          _0x368955.setAttribute('fill', 'none'),
          _0x368955.setAttribute('stroke', 'currentColor'),
          _0x368955.setAttribute('stroke-width', '2'),
          _0x368955
        );
      },
      _0x356a87 = (() => {
        const _0x7d323e = _0x1486bd(),
          _0x403f54 = document.createElementNS(_0x4f1387, 'path');
        _0x403f54.setAttribute('d', 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z');
        const _0x3a0e49 = document.createElementNS(_0x4f1387, 'polyline');
        _0x3a0e49.setAttribute('points', '17 21 17 13 7 13 7 21');
        const _0x5e5db7 = document.createElementNS(_0x4f1387, 'polyline');
        return (
          _0x5e5db7.setAttribute('points', '7 3 7 8 15 8'),
          _0x7d323e.appendChild(_0x403f54),
          _0x7d323e.appendChild(_0x3a0e49),
          _0x7d323e.appendChild(_0x5e5db7),
          _0x7d323e
        );
      })(),
      _0x1fc3f7 = (() => {
        const _0x5d1612 = _0x1486bd(),
          _0x42bd2c = document.createElementNS(_0x4f1387, 'path');
        _0x42bd2c.setAttribute('d', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z');
        const _0xc06c8d = document.createElementNS(_0x4f1387, 'polyline');
        _0xc06c8d.setAttribute('points', '14 2 14 8 20 8');
        const _0x5179cb = document.createElementNS(_0x4f1387, 'line');
        (_0x5179cb.setAttribute('x1', '12'),
          _0x5179cb.setAttribute('y1', '18'),
          _0x5179cb.setAttribute('x2', '12'),
          _0x5179cb.setAttribute('y2', '12'));
        const _0x9eca52 = document.createElementNS(_0x4f1387, 'line');
        return (
          _0x9eca52.setAttribute('x1', '9'),
          _0x9eca52.setAttribute('y1', '15'),
          _0x9eca52.setAttribute('x2', '15'),
          _0x9eca52.setAttribute('y2', '15'),
          _0x5d1612.appendChild(_0x42bd2c),
          _0x5d1612.appendChild(_0xc06c8d),
          _0x5d1612.appendChild(_0x5179cb),
          _0x5d1612.appendChild(_0x9eca52),
          _0x5d1612
        );
      })(),
      _0x1d73d0 = (() => {
        const _0x5ba612 = _0x1486bd(),
          _0xefb7de = document.createElementNS(_0x4f1387, 'rect');
        (_0xefb7de.setAttribute('x', '3'),
          _0xefb7de.setAttribute('y', '5'),
          _0xefb7de.setAttribute('width', '18'),
          _0xefb7de.setAttribute('height', '14'),
          _0xefb7de.setAttribute('rx', '2'));
        const _0x35afe4 = document.createElementNS(_0x4f1387, 'path');
        return (
          _0x35afe4.setAttribute('d', 'M8 9h8M12 9v6m0 0-3-3m3 3 3-3'),
          _0x5ba612.appendChild(_0xefb7de),
          _0x5ba612.appendChild(_0x35afe4),
          _0x5ba612
        );
      })(),
      _0x3c17ef = (() => {
        const _0x1a97e6 = _0x1486bd(),
          _0x239eed = document.createElementNS(_0x4f1387, 'polyline');
        _0x239eed.setAttribute('points', '3 6 5 6 21 6');
        const _0x2f2ae5 = document.createElementNS(_0x4f1387, 'path');
        return (
          _0x2f2ae5.setAttribute(
            'd',
            'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
          ),
          _0x1a97e6.appendChild(_0x239eed),
          _0x1a97e6.appendChild(_0x2f2ae5),
          _0x1a97e6
        );
      })(),
      _0x2fdef = (_0x102717, _0xd3a219, _0x589e02, _0x57daef = false) => {
        const _0x410834 = document.createElement('div');
        _0x410834.className = 'v2-menu-row';
        if (_0x57daef) _0x410834.style.color = 'var(--red)';
        const _0x11cf35 = document.createElement('span');
        ((_0x11cf35.className = 'v2-menu-icon'), _0x11cf35.appendChild(_0xd3a219.cloneNode(true)));
        const _0x5ab4c6 = document.createElement('span');
        ((_0x5ab4c6.className = 'v2-menu-text'),
          (_0x5ab4c6.textContent = _0x102717),
          _0x410834.appendChild(_0x11cf35),
          _0x410834.appendChild(_0x5ab4c6),
          _0x410834.addEventListener('pointerdown', (_0x4b74d5) => {
            (_0x4b74d5.stopPropagation(), _0x580dd0.remove(), _0x589e02());
          }),
          _0x410834.addEventListener('contextmenu', (_0x4a002a) => _0x4a002a.preventDefault()),
          _0x580dd0.appendChild(_0x410834));
      };
    (_0x2fdef(canvasTabsText('contextMenu.save'), _0x356a87, () => {
      if (window._v2SaveProject) window._v2SaveProject(_0x26df08.name);
    }),
      _0x2fdef(canvasTabsText('contextMenu.saveAs'), _0x1fc3f7, () => {
        if (window.electronAPI?.project && typeof window._v2SaveProjectAsLocal === 'function') {
          window._v2SaveProjectAsLocal();
          return;
        }
        const _0x122f06 = this.getMultiDataSnapshot({ sanitizeForPersistence: true }) || {},
          _0x40f5a3 = new Blob([JSON.stringify(_0x122f06, null, 2)], { type: 'application/json' }),
          _0x2aca36 = URL.createObjectURL(_0x40f5a3),
          _0xce460d = document.createElement('a');
        ((_0xce460d.href = _0x2aca36),
          (_0xce460d.download = _0x26df08.name + '.json'),
          document.body.appendChild(_0xce460d),
          _0xce460d.click(),
          document.body.removeChild(_0xce460d),
          URL.revokeObjectURL(_0x2aca36),
          window.showToast?.(canvasTabsText('downloadedWorkflow', { filename: _0x26df08.name + '.json' })));
      }));
    typeof window._v2ExportCurrentProjectPackage === 'function' &&
      _0x2fdef(canvasTabsText('contextMenu.collectProject'), _0x1d73d0, () => {
        window._v2ExportCurrentProjectPackage({ canvasId: _0x26df08.id, projectName: _0x26df08.name });
      });
    const _0x248703 = document.createElement('div');
    ((_0x248703.className = 'v2-menu-sep'),
      _0x580dd0.appendChild(_0x248703),
      _0x2fdef(
        canvasTabsText('contextMenu.delete'),
        _0x3c17ef,
        () => {
          void this.deleteCanvas(_0x26df08.id);
        },
        true,
      ),
      document.body.appendChild(_0x580dd0));
    const _0xaec677 = (_0x4503f8) => {
      !_0x580dd0.contains(_0x4503f8.target) &&
        (_0x580dd0.remove(), document.removeEventListener('pointerdown', _0xaec677, true));
    };
    requestAnimationFrame(() => document.addEventListener('pointerdown', _0xaec677, true));
  },
  _clearCanvasSurface() {
    clearRendererCache();
    const _0x16b6bc = document.getElementById('v2-canvas');
    if (!_0x16b6bc) return;
    Array.from(_0x16b6bc.children).forEach((_0x157d4a) => {
      if (_0x157d4a.classList.contains('v2-node')) _0x157d4a.remove();
    });
  },
  _buildCanvasRecord(_0x49c026 = {}, _0x2d0309 = {}) {
    const _0x25e352 = createEmptyCanvasSnapshot(),
      _0x1810b7 = Number.isFinite(_0x49c026?._persistRevHint)
        ? _0x49c026._persistRevHint
        : Number.isFinite(_0x2d0309?._persistRevHint)
          ? _0x2d0309._persistRevHint
          : _0x25e352._persistRevHint;
    return {
      ..._0x49c026,
      nodes: Array.isArray(_0x2d0309?.nodes)
        ? _0x2d0309.nodes
        : _0x2d0309?.nodes && typeof _0x2d0309.nodes === 'object'
          ? _0x2d0309.nodes
          : _0x25e352.nodes,
      edges: Array.isArray(_0x2d0309?.edges)
        ? _0x2d0309.edges
        : _0x2d0309?.edges && typeof _0x2d0309.edges === 'object'
          ? _0x2d0309.edges
          : _0x25e352.edges,
      viewport:
        _0x2d0309?.viewport && typeof _0x2d0309.viewport === 'object'
          ? { ..._0x2d0309.viewport }
          : { ..._0x25e352.viewport },
      assets: Array.isArray(_0x2d0309?.assets) ? _0x2d0309.assets : _0x25e352.assets,
      visualSnapshot:
        normalizeCanvasVisualSnapshot(_0x2d0309?.visualSnapshot) ||
        normalizeCanvasVisualSnapshot(_0x49c026?.visualSnapshot) ||
        null,
      _persistRevHint: _0x1810b7,
    };
  },
  _clearVisualSnapshotBackfillTimers() {
    for (const _0x240f0b of this._visualSnapshotBackfillTimers || []) {
      clearTimeout(_0x240f0b);
    }
    this._visualSnapshotBackfillTimers = [];
  },
  _isVisualSnapshotWorthReplacing(_0x4e3b5a, _0x195fef, { force: force = false } = {}) {
    if (!_0x195fef) return false;
    if (!_0x4e3b5a) return true;
    const _0x13ffe1 = Math.max(0, Number(_0x4e3b5a.readyMediaNodeCount ?? _0x4e3b5a.mediaNodeCount) || 0),
      _0x141b1c = Math.max(0, Number(_0x195fef.readyMediaNodeCount ?? _0x195fef.mediaNodeCount) || 0);
    if (_0x141b1c > _0x13ffe1) return true;
    if (_0x141b1c < _0x13ffe1) return false;
    const _0x5333ff = Math.max(0, Number(_0x4e3b5a.visibleNodeCount) || 0),
      _0x40d8e6 = Math.max(0, Number(_0x195fef.visibleNodeCount) || 0);
    if (_0x40d8e6 > _0x5333ff) return true;
    return force && _0x40d8e6 >= _0x5333ff;
  },
  _captureActiveVisualSnapshot({ force: force = false, persistIfChanged: persistIfChanged = false } = {}) {
    if (!this._activeId) return null;
    const _0x48445c = this._canvases.findIndex((_0x1646a4) => _0x1646a4.id === this._activeId);
    if (_0x48445c === -1) return null;
    if (typeof document === 'undefined') return null;
    const _0x4d50fb = document.getElementById('v2-canvas');
    if (!_0x4d50fb) return null;
    const _0x20d486 = appStore.getStateRaw?.() || {},
      _0x43017a = captureCanvasVisualSnapshot({
        canvasEl: _0x4d50fb,
        containerEl: _0x4d50fb.parentElement || document.getElementById('v2-container'),
        nodes: _0x20d486.nodes,
        edges: _0x20d486.edges,
        viewport: _0x20d486.viewport,
        force: force,
      });
    if (!_0x43017a) return null;
    const _0x5446d8 = this._canvases[_0x48445c]?.visualSnapshot || null;
    if (!this._isVisualSnapshotWorthReplacing(_0x5446d8, _0x43017a, { force: force })) return null;
    return (
      (this._canvases[_0x48445c] = { ...this._canvases[_0x48445c], visualSnapshot: _0x43017a }),
      persistIfChanged && this._scheduleWorkspaceMetaCacheSave(),
      _0x43017a
    );
  },
  _getActiveVisualSnapshotCaptureInput({ force: force = false } = {}) {
    if (!this._activeId) return null;
    const _0x50571c = this._canvases.findIndex((_0x53fd5f) => _0x53fd5f.id === this._activeId);
    if (_0x50571c === -1) return null;
    if (typeof document === 'undefined') return null;
    const _0x5565a9 = document.getElementById('v2-canvas');
    if (!_0x5565a9) return null;
    const _0x4fc96b = appStore.getStateRaw?.() || {};
    return {
      idx: _0x50571c,
      canvasEl: _0x5565a9,
      containerEl: _0x5565a9.parentElement || document.getElementById('v2-container'),
      nodes: _0x4fc96b.nodes,
      edges: _0x4fc96b.edges,
      viewport: _0x4fc96b.viewport,
      force: force,
    };
  },
  async _captureActiveVisualSnapshotAsync({
    force: force = false,
    persistIfChanged: persistIfChanged = false,
  } = {}) {
    const _0x2c5927 = this._getActiveVisualSnapshotCaptureInput({ force: force });
    if (!_0x2c5927) return null;
    const _0xeb3ee0 =
      (await captureCanvasVisualSnapshotFromElectron(_0x2c5927)) || captureCanvasVisualSnapshot(_0x2c5927);
    if (!_0xeb3ee0) return null;
    const _0x2a93c9 = this._canvases[_0x2c5927.idx]?.visualSnapshot || null;
    if (!this._isVisualSnapshotWorthReplacing(_0x2a93c9, _0xeb3ee0, { force: force })) return null;
    return (
      (this._canvases[_0x2c5927.idx] = { ...this._canvases[_0x2c5927.idx], visualSnapshot: _0xeb3ee0 }),
      persistIfChanged && this._scheduleWorkspaceMetaCacheSave(),
      _0xeb3ee0
    );
  },
  _showCanvasVisualSnapshot(_0x238397) {
    return (
      hideCanvasVisualSnapshotOverlay(),
      this._scheduleCanvasVisibleMediaWarmup(_0x238397, {
        delayMs: CANVAS_MEDIA_WARMUP_OPEN_DELAY_MS,
        maxJobs: CANVAS_MEDIA_WARMUP_SNAPSHOT_MAX_JOBS,
      }),
      false
    );
  },
  _warmupCanvasVisibleMedia(_0x291737, { maxJobs: _0x37df34 } = {}) {
    if (typeof document === 'undefined' || !_0x291737) return null;
    if (typeof document.getElementById !== 'function') return null;
    const _0x4f1de3 = document.getElementById('v2-canvas'),
      _0x3fd18c = _0x4f1de3?.parentElement || document.getElementById('v2-container');
    return warmupCanvasVisibleMedia({ canvas: _0x291737, containerEl: _0x3fd18c, maxJobs: _0x37df34 });
  },
  _clearCanvasVisibleMediaWarmupTimer() {
    this._mediaWarmupTimer !== null &&
      (clearTimeout(this._mediaWarmupTimer), (this._mediaWarmupTimer = null));
  },
  _scheduleCanvasVisibleMediaWarmup(
    _0x39d6a0,
    {
      delayMs: delayMs = CANVAS_MEDIA_WARMUP_OPEN_DELAY_MS,
      maxJobs: maxJobs = CANVAS_MEDIA_WARMUP_OPEN_MAX_JOBS,
    } = {},
  ) {
    this._clearCanvasVisibleMediaWarmupTimer();
    if (!_0x39d6a0) return null;
    const _0x19f1b1 = _0x39d6a0.id || null,
      _0x35d2fd = setTimeout(
        () => {
          this._mediaWarmupTimer = null;
          if (_0x19f1b1 && this._activeId !== _0x19f1b1) return;
          this._warmupCanvasVisibleMedia(_0x39d6a0, { maxJobs: maxJobs });
        },
        Math.max(0, Number(delayMs) || 0),
      );
    return (_0x35d2fd?.unref?.(), (this._mediaWarmupTimer = _0x35d2fd), _0x35d2fd);
  },
  _scheduleVisualSnapshotBackfill() {
    this._clearVisualSnapshotBackfillTimers();
    if (!this._activeId) return;
    const _0x1bc26c = this._activeId,
      _0x1d75f9 = [0x4b0, 0xbb8, 0x1b58, 0x36b0, 0x55f0];
    this._visualSnapshotBackfillTimers = _0x1d75f9.map((_0x570844) => {
      const _0x151fdc = setTimeout(() => {
        if (this._activeId !== _0x1bc26c) return;
        void this._captureActiveVisualSnapshotAsync({ force: false, persistIfChanged: true });
      }, _0x570844);
      return (_0x151fdc?.unref?.(), _0x151fdc);
    });
  },
  _hydrateCanvasSnapshot(_0x2b9a46, { preserveLiveGeneration: preserveLiveGeneration = false } = {}) {
    (markPerf('hydrateTrustedSnapshot:start'),
      appStore.hydrateTrustedSnapshot(_0x2b9a46, { preserveLiveGeneration: preserveLiveGeneration }),
      markPerf('hydrateTrustedSnapshot:end'),
      measurePerf('hydrateTrustedSnapshot', 'hydrateTrustedSnapshot:start', 'hydrateTrustedSnapshot:end'),
      this._rememberCanvasPersistRev());
  },
  hydrateActiveCanvasSnapshot(_0x31a92e) {
    if (!this._activeId) return;
    const _0x243677 = this._canvases.findIndex((_0x1e2e86) => _0x1e2e86.id === this._activeId);
    if (_0x243677 === -1) return;
    ((this._canvases[_0x243677] = this._buildCanvasRecord(this._canvases[_0x243677], _0x31a92e)),
      this._scheduleCanvasVisibleMediaWarmup(this._canvases[_0x243677]),
      this._clearCanvasSurface(),
      this._hydrateCanvasSnapshot(this._canvases[_0x243677]),
      this._scheduleVisualSnapshotBackfill());
  },
  init(_0x84a0cf, { markClean: markClean = true } = {}) {
    ((this._canvases = Array.isArray(_0x84a0cf.canvases)
      ? _0x84a0cf.canvases.map((_0x24a840) => this._buildCanvasRecord(_0x24a840, _0x24a840))
      : []),
      (this._lastPersistRevByCanvas = new Map()),
      (this._savedSignatureByCanvas = new Map()),
      (this._lastTabsRenderSignature = ''));
    if (this._canvases.length === 0) {
      const _0x2fb087 = 'canvas_default_' + Date.now();
      (this._canvases.push({
        id: _0x2fb087,
        name: canvasTabsText('defaultCanvasName'),
        ...createEmptyCanvasSnapshot(),
      }),
        (this._activeId = _0x2fb087),
        this._hydrateCanvasSnapshot(this._canvases[0]));
    } else {
      this._activeId = _0x84a0cf.activeCanvasId || (this._canvases[0]?.id ?? null);
      const _0x3a10e0 =
        this._canvases.find((_0x2f5df3) => _0x2f5df3.id === this._activeId) || this._canvases[0];
      _0x3a10e0 &&
        (this._showCanvasVisualSnapshot(_0x3a10e0),
        this._hydrateCanvasSnapshot(_0x3a10e0),
        this._scheduleVisualSnapshotBackfill());
    }
    (this._resetSavedCanvasSignatures({ markClean: markClean }),
      this.renderTabs(),
      startVideoThumbBackfill(),
      this._notifyDirtyStateChanged());
  },
  _flushCurrentCanvas() {
    if (!this._activeId) return;
    const _0x266d7f = this._canvases.findIndex((_0x30c64b) => _0x30c64b.id === this._activeId);
    if (_0x266d7f === -1) return;
    flushAllPendingPromptHtmlCommits();
    const _0x2d6bd4 = this._getStorePersistRev();
    if (this._lastPersistRevByCanvas.get(this._activeId) === _0x2d6bd4) return;
    const _0x164827 = markRecoveringGenerationSnapshot(appStore.serialize()),
      _0x440e5e = this._buildCanvasRecord(this._canvases[_0x266d7f], _0x164827);
    ((_0x440e5e._persistRevHint = _0x2d6bd4),
      (this._canvases[_0x266d7f] = _0x440e5e),
      this._lastPersistRevByCanvas.set(this._activeId, _0x2d6bd4));
  },
  async switchTo(_0x32ccad) {
    if (_0x32ccad === this._activeId) return;
    const _0x4dde12 = this._canvases.find((_0x3a0091) => _0x3a0091.id === _0x32ccad);
    if (!_0x4dde12) return;
    return (
      this._flushCurrentCanvas(),
      this._captureActiveVisualSnapshot({ force: true }),
      this._showCanvasVisualSnapshot(_0x4dde12),
      this._clearCanvasSurface(),
      (this._activeId = _0x32ccad),
      this._hydrateCanvasSnapshot(_0x4dde12, { preserveLiveGeneration: canvasHasLiveGeneration(_0x4dde12) }),
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
    const _0x3623dc = 'canvas_' + Date.now(),
      _0x209936 = canvasTabsText('newCanvasName', { index: this._canvases.length + 1 });
    return (
      this._canvases.push({ id: _0x3623dc, name: _0x209936, ...createEmptyCanvasSnapshot() }),
      (this._activeId = _0x3623dc),
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
  async _confirmDeleteDirtyCanvas(_0x485783, { skipDirtyConfirm: skipDirtyConfirm = false } = {}) {
    if (skipDirtyConfirm || !this.isCanvasDirty(_0x485783?.id)) return true;
    return this._showUnsavedDeleteConfirm(_0x485783);
  },
  _showUnsavedDeleteConfirm(_0x3d9301) {
    if (typeof document === 'undefined' || !document.body) return Promise.resolve(false);
    return (
      document.getElementById('canvas-delete-confirm-overlay')?.remove(),
      new Promise((_0x565faf) => {
        const _0x4ba66b = document.createElement('div');
        ((_0x4ba66b.id = 'canvas-delete-confirm-overlay'), (_0x4ba66b.className = 'custom-confirm-overlay'));
        const _0xeb6563 = document.createElement('div');
        _0xeb6563.className = 'custom-confirm-box';
        const _0x4845fb = document.createElement('div');
        ((_0x4845fb.className = 'confirm-title'),
          (_0x4845fb.textContent = canvasTabsText('deleteUnsaved.title')));
        const _0x9b197f = document.createElement('div');
        ((_0x9b197f.className = 'confirm-msg'),
          (_0x9b197f.textContent = canvasTabsText('deleteUnsaved.message', {
            name: _0x3d9301?.name || canvasTabsText('untitledCanvas'),
          })));
        const _0x1a2be4 = document.createElement('div');
        _0x1a2be4.className = 'confirm-btns';
        const _0x4a5e00 = document.createElement('button');
        ((_0x4a5e00.type = 'button'),
          (_0x4a5e00.className = 'confirm-btn confirm-cancel'),
          (_0x4a5e00.textContent = canvasTabsText('deleteUnsaved.cancel')));
        const _0x54dc8b = document.createElement('button');
        ((_0x54dc8b.type = 'button'),
          (_0x54dc8b.className = 'confirm-btn confirm-ok'),
          (_0x54dc8b.textContent = canvasTabsText('deleteUnsaved.delete')),
          _0x1a2be4.appendChild(_0x4a5e00),
          _0x1a2be4.appendChild(_0x54dc8b),
          _0xeb6563.appendChild(_0x4845fb),
          _0xeb6563.appendChild(_0x9b197f),
          _0xeb6563.appendChild(_0x1a2be4),
          _0x4ba66b.appendChild(_0xeb6563),
          document.body.appendChild(_0x4ba66b));
        let _0x136d6c = false;
        const _0x2d79d0 = (_0x473818) => {
            if (_0x136d6c) return;
            ((_0x136d6c = true),
              document.removeEventListener('keydown', _0x47c166, true),
              _0x4ba66b.remove(),
              _0x565faf(_0x473818));
          },
          _0x47c166 = (_0x4bb55f) => {
            if (_0x4bb55f.key === 'Escape') {
              (_0x4bb55f.preventDefault(), _0x2d79d0(false));
              return;
            }
            _0x4bb55f.key === 'Enter' &&
              !_0x4bb55f.isComposing &&
              (_0x4bb55f.preventDefault(), _0x2d79d0(true));
          };
        (_0x4ba66b.addEventListener('click', (_0xa8805e) => {
          if (_0xa8805e.target === _0x4ba66b) _0x2d79d0(false);
        }),
          _0x4a5e00.addEventListener('click', () => _0x2d79d0(false)),
          _0x54dc8b.addEventListener('click', () => _0x2d79d0(true)),
          document.addEventListener('keydown', _0x47c166, true),
          _0x4a5e00.focus?.());
      })
    );
  },
  async deleteCanvas(_0x28b92f, _0x58a684 = {}) {
    if (this._canvases.length <= 1) return (window.showToast(canvasTabsText('keepOneCanvas'), 'warn'), false);
    const _0x50422a = this._canvases.findIndex((_0x2a7cf0) => _0x2a7cf0.id === _0x28b92f);
    if (_0x50422a === -1) return false;
    const _0x17132e = this._canvases[_0x50422a],
      _0x690f3d = await this._confirmDeleteDirtyCanvas(_0x17132e, _0x58a684);
    if (!_0x690f3d) return false;
    (this._canvases.splice(_0x50422a, 1),
      this._lastPersistRevByCanvas.delete(_0x28b92f),
      this._savedSignatureByCanvas.delete(_0x28b92f));
    if (this._activeId === _0x28b92f) {
      const _0x4328ec = this._canvases[Math.max(0, _0x50422a - 1)];
      ((this._activeId = _0x4328ec.id),
        this._showCanvasVisualSnapshot(_0x4328ec),
        this._clearCanvasSurface(),
        this._hydrateCanvasSnapshot(_0x4328ec, {
          preserveLiveGeneration: canvasHasLiveGeneration(_0x4328ec),
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
  renameCanvas(_0x1ad395, _0x223067) {
    const _0x5195f7 = this._canvases.find((_0x44dc7c) => _0x44dc7c.id === _0x1ad395);
    if (!_0x5195f7) return;
    const _0x4fcce2 = String(_0x223067 || '').trim(),
      _0x4c52c5 = String(_0x5195f7.name || '').trim();
    if (!_0x4fcce2 || _0x4fcce2 === _0x4c52c5) return;
    ((_0x5195f7.name = _0x4fcce2), this._markCanvasMetaDirty(), this._notifyDirtyStateChanged());
  },
  markCanvasClean(_0xbd53a2 = this._activeId) {
    if (!_0xbd53a2) return false;
    if (_0xbd53a2 === this._activeId) this._flushCurrentCanvas();
    const _0x57da6c = this._canvases.find((_0x141a64) => _0x141a64.id === _0xbd53a2);
    if (!_0x57da6c) return false;
    return (
      this._savedSignatureByCanvas.set(_0xbd53a2, this._buildCanvasSavedSignature(_0x57da6c)),
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
  isCanvasDirty(_0x5d0bf3 = this._activeId) {
    if (!_0x5d0bf3) return false;
    if (_0x5d0bf3 === this._activeId) this._flushCurrentCanvas();
    const _0x3f88dd = this._canvases.find((_0x24aac4) => _0x24aac4.id === _0x5d0bf3);
    if (!_0x3f88dd) return false;
    const _0x5d3aae = this._savedSignatureByCanvas.get(_0x5d0bf3);
    if (!_0x5d3aae) return true;
    return _0x5d3aae !== this._buildCanvasSavedSignature(_0x3f88dd);
  },
  hasDirtyCanvases() {
    return (
      this._flushCurrentCanvas(),
      this._canvases.some((_0x1158cf) => {
        const _0x3170e8 = _0x1158cf?.id;
        if (!_0x3170e8) return false;
        const _0x533a5d = this._savedSignatureByCanvas.get(_0x3170e8);
        return !_0x533a5d || _0x533a5d !== this._buildCanvasSavedSignature(_0x1158cf);
      })
    );
  },
  getMultiDataSnapshot({
    sanitizeForPersistence: sanitizeForPersistence = false,
    captureVisualSnapshot: captureVisualSnapshot = true,
  } = {}) {
    this._flushCurrentCanvas();
    captureVisualSnapshot && this._captureActiveVisualSnapshot({ force: false });
    const _0x4e45be = cloneMultiDataSnapshot({ canvases: this._canvases, activeCanvasId: this._activeId });
    if (!sanitizeForPersistence) return _0x4e45be;
    return sanitizeMultiCanvasDataForPersistence(_0x4e45be || {});
  },
  getMultiData() {
    return this.getMultiDataSnapshot();
  },
  getActiveCanvasId() {
    return this._activeId || '';
  },
  renderTabs() {
    const _0x5d5dbe = document.getElementById('canvasTabs');
    if (!_0x5d5dbe) return;
    this._bindTabContainerEvents(_0x5d5dbe);
    const _0x5ea38a = this._getTabsRenderSignature();
    if (_0x5ea38a === this._lastTabsRenderSignature) return;
    ((this._lastTabsRenderSignature = _0x5ea38a), this._removeTabContextMenu());
    const _0x3c3d64 = document.createDocumentFragment();
    (this._canvases.forEach((_0x366d33) => {
      const _0x28eb8e = _0x366d33.id === this._activeId,
        _0x1d4b7e = document.createElement('div');
      ((_0x1d4b7e.className = 'canvas-tab' + (_0x28eb8e ? ' active' : '')),
        (_0x1d4b7e.dataset.id = _0x366d33.id));
      const _0x142340 = document.createElement('span');
      ((_0x142340.className = 'canvas-tab-name'),
        (_0x142340.title = _0x366d33.name),
        (_0x142340.textContent = _0x366d33.name));
      const _0x37e155 = document.createElement('button');
      ((_0x37e155.type = 'button'),
        (_0x37e155.className = 'canvas-tab-close'),
        (_0x37e155.title = canvasTabsText('closeCanvas')),
        (_0x37e155.textContent = '×'),
        _0x1d4b7e.appendChild(_0x142340),
        _0x1d4b7e.appendChild(_0x37e155),
        _0x3c3d64.appendChild(_0x1d4b7e));
    }),
      _0x5d5dbe.replaceChildren(_0x3c3d64));
  },
};
export default CanvasTabManager;
export { CanvasTabManager };
