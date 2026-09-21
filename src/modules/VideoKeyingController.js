import appStore from '../core/stores/appStore.js';
import { generateId } from '../core/math.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { commit } from './history.js';
import { buildGenerateVideoRequest, generateVideo } from '../../api/aiVideoApi.js';
import { cancelRunningHubTask } from '../../api/runninghubTaskApi.js';
import { getShortcuts, handleShortcutKeydown } from './shortcuts.js';
import {
  compositeCheckerMask,
  createEraseCheckerboardPattern,
  drawEraseMaskCommand,
  getEraseCanvasPalette,
} from './eraseBrushRenderer.js';
import {
  clampImageBrushSize,
  drawRoundBrushStroke,
  getBrushLineWidth,
  syncCircularBrushCursor,
} from './imageEditorBrushStyle.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { applyDebugWrenchIcon, formatFinalApiDebugRequest } from '../utils/debugRequestPreview.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
import {
  attachVideoKeyingPlaybackSource,
  renderVideoKeyingThumbs,
  setVideoKeyingMediaKeepAlive,
} from './videoKeyingMediaHelpers.js';
import {
  buildGenerationCancelledPatch,
  buildGenerationFailurePatch,
  buildGenerationStartPatch,
  buildGenerationSuccessPatch,
} from '../core/generationTaskLifecycle.js';
import { cancelTask, submitTask } from '../core/generationTaskRuntime.js';
import { shouldShowGenerationBusyUi } from '../core/generationTaskUiState.js';
import {
  buildVideoGenerationFailurePatch,
  buildVideoGenerationResultPatch,
} from '../components/video-node/videoGenerationResultRenderer.js';
import {
  getVideoKeyingExecutionId,
  getVideoKeyingModelId,
  isVideoKeyingModel,
} from './videoKeyingManifestResolver.js';
import {
  RH_DEFAULT_INSTANCE_TYPE,
  RH_DEFAULT_KEYING_FPS,
  RH_DEFAULT_KEYING_MASK_MODE,
  RH_DEFAULT_KEYING_RESOLUTION,
  getRhKeyingFpsOptions,
  getRunningHubWorkflowApiKey,
  hasUsableKeyingSettingValue,
  normalizeRhInstanceType,
  normalizeRhKeyingFps,
  normalizeRhKeyingResolution,
  resolveSourceVideoKeyingSetting,
} from './videoKeyingSettings.js';
import { onLocaleChange } from '../i18n/index.js';
import {
  buildVideoKeyingOutputText,
  isVideoKeyingCancelledOutputText,
  videoKeyingText,
} from './videoKeyingTextHelpers.js';
import { videoKeyingLifecycleMethods } from './videoKeyingLifecycleMethods.js';
const REMOVE_POS_POINT_LIMIT = 0xbb8,
  REMOVE_MASK_MAX_SIDE = 0x200,
  VIDEO_KEYING_TASK_CHANGE_EVENT = 'aicanvas:video-keying-task-change',
  VideoKeyingController = {
    active: false,
    nodeId: null,
    wrapperEl: null,
    barEl: null,
    trackEl: null,
    playheadEl: null,
    cancelBtnEl: null,
    confirmBtnEl: null,
    thumbEls: null,
    videoEl: null,
    durationSec: 0,
    _thumbToken: 0,
    _sourceToken: 0,
    _playheadRaf: 0,
    _retryRaf: 0,
    _retryCount: 0,
    _onLoadedMeta: null,
    _onDurationChange: null,
    _onPointerMove: null,
    _onPointerUp: null,
    _onPointerCancel: null,
    _onKeyDown: null,
    _onDocClick: null,
    _hiddenEls: null,
    markLayerEl: null,
    markCanvasEl: null,
    removeMaskCanvasEl: null,
    removeCursorEl: null,
    _marks: null,
    _marksRedo: null,
    _removeDraft: null,
    _removeDrawPointerId: null,
    _removeCursorHover: false,
    _removeCursorLast: { x: 0, y: 0 },
    _removeCursorRaf: 0,
    _removeWheelCleanup: null,
    _onMarkPointerDown: null,
    _onMarkPointerMove: null,
    _onMarkPointerUp: null,
    _onMarkPointerCancel: null,
    _onMarkPointerEnter: null,
    _onMarkPointerLeave: null,
    _onMarkWheel: null,
    _onVideoPlay: null,
    _renderMarksFn: null,
    _onResize: null,
    _onShortcutsUpdated: null,
    _rhTasks: new Map(),
    TASK_CHANGE_EVENT: VIDEO_KEYING_TASK_CHANGE_EVENT,
    _onKeyingSettingsDocDown: null,
    _lastFrameIndex: null,
    _lastFrameIndexFps: null,
    helperRightEl: null,
    hintEl: null,
    removeToolbarEl: null,
    removeSizeValueEl: null,
    removeSizeRangeEl: null,
    uiMode: 'keying',
    _removePointTool: 'foreground',
    _removeBrushSizePx: 40,
    _lastHelperRightText: null,
    _lastConfirmEnabled: null,
    _unsubscribeLocale: null,
    isActiveFor(_0x4423d8) {
      return !!_0x4423d8 && this.active === true && this.nodeId === _0x4423d8;
    },
    _isRemoveUiMode() {
      return this.uiMode === 'remove';
    },
    _setRemovePointTool(_0x2a4b6e) {
      const _0x281efd = _0x2a4b6e === 'background' ? 'background' : 'foreground';
      this._removePointTool = _0x281efd;
      if (this.removeToolbarEl) {
        const _0x553e02 = _0x281efd === 'background' ? 'eraser' : 'brush';
        this.removeToolbarEl.querySelectorAll('.tool-btn').forEach((_0x3e3a41) => {
          _0x3e3a41.classList.toggle('active', _0x3e3a41.dataset.tool === _0x553e02);
        });
      }
      this._syncRemoveCursor();
    },
    _clampRemoveBrushSize(_0xf380c5) {
      return clampImageBrushSize(_0xf380c5, 40);
    },
    _getRemoveToolType() {
      return this._removePointTool === 'background' ? 'eraser' : 'brush';
    },
    _getShortcutText(_0x1238d8, _0x539763 = '') {
      const _0x26d8db = getShortcuts?.(),
        _0x777390 = _0x26d8db?.[_0x1238d8]?.keys;
      if (!Array.isArray(_0x777390) || _0x777390.length === 0) return _0x539763;
      return _0x777390.join('+');
    },
    _buildShortcutTooltip(_0x1595a0, _0x449d8a, _0xbc292a = '') {
      const _0x29b964 = this._getShortcutText(_0x449d8a, _0xbc292a);
      return _0x29b964 ? _0x1595a0 + ' ' + _0x29b964 : _0x1595a0;
    },
    _syncRemoveBrushControls() {
      const _0x585095 = this._clampRemoveBrushSize(this._removeBrushSizePx);
      (this.removeSizeRangeEl &&
        Number(this.removeSizeRangeEl.value) !== _0x585095 &&
        (this.removeSizeRangeEl.value = String(_0x585095)),
        this.removeSizeValueEl && (this.removeSizeValueEl.textContent = String(_0x585095)));
    },
    _refreshRemoveShortcutUi() {
      if (!this._isRemoveUiMode()) return;
      if (this.removeToolbarEl) {
        const _0x234683 = [
          ['.act-cancel', videoKeyingText('tools.cancel')],
          [
            '[data-tool="brush"]',
            this._buildShortcutTooltip(videoKeyingText('tools.brush'), 'editor-tool-brush', 'B'),
          ],
          [
            '[data-tool="eraser"]',
            this._buildShortcutTooltip(videoKeyingText('tools.eraser'), 'editor-tool-eraser', 'E'),
          ],
          ['.act-undo', this._buildShortcutTooltip(videoKeyingText('tools.undo'), 'undo', 'Ctrl+Z')],
          ['.act-redo', this._buildShortcutTooltip(videoKeyingText('tools.redo'), 'redo', 'Ctrl+Shift+Z')],
          ['.act-clear', this._buildShortcutTooltip(videoKeyingText('tools.clear'), 'editor-clear', 'R')],
        ];
        _0x234683.forEach(([_0x5c23a9, _0x1dbcab]) => {
          const _0x4cb2c1 = this.removeToolbarEl?.querySelector(_0x5c23a9);
          if (!_0x4cb2c1) return;
          (_0x4cb2c1.setAttribute('data-tooltip', _0x1dbcab), (_0x4cb2c1.title = _0x1dbcab));
        });
      }
      if (this.hintEl) {
        const _0x25554d = [
            videoKeyingText('hint.removeTitle'),
            videoKeyingText('hint.shortcutPrefix'),
            this._getShortcutText('editor-tool-brush', 'B'),
            videoKeyingText('tools.brush'),
            '  ',
            this._getShortcutText('editor-tool-eraser', 'E'),
            videoKeyingText('tools.eraser'),
            '  ',
            this._getShortcutText('editor-clear', 'R'),
            videoKeyingText('tools.clear'),
            '  ',
            this._getShortcutText('undo', 'Ctrl+Z'),
            videoKeyingText('tools.undo'),
            '  ',
            this._getShortcutText('redo', 'Ctrl+Shift+Z'),
            videoKeyingText('tools.redo'),
            videoKeyingText('hint.wheelBrushSize'),
          ],
          _0x47d6b3 = Array.from(this.hintEl.children);
        _0x25554d.forEach((_0x184f09, _0x22b1e9) => {
          if (_0x47d6b3[_0x22b1e9]) _0x47d6b3[_0x22b1e9].textContent = _0x184f09;
        });
      }
    },
    _refreshKeyingHintUi() {
      if (!this.hintEl || this._isRemoveUiMode()) return;
      const _0x14c570 = [
          videoKeyingText('hint.leftClick'),
          videoKeyingText('hint.selectTarget'),
          '  ',
          videoKeyingText('hint.rightClick'),
          videoKeyingText('hint.excludeTarget'),
          videoKeyingText('hint.shortcutPrefix'),
          this._getShortcutText('editor-clear', 'R'),
          videoKeyingText('hint.clearAllPoints'),
          '  ',
          this._getShortcutText('undo', 'Ctrl+Z'),
          videoKeyingText('tools.undo'),
          '  ',
          this._getShortcutText('redo', 'Ctrl+Shift+Z'),
          videoKeyingText('tools.redo'),
        ],
        _0x580116 = Array.from(this.hintEl.children);
      _0x14c570.forEach((_0x407bd8, _0x4bb19d) => {
        if (_0x580116[_0x4bb19d]) _0x580116[_0x4bb19d].textContent = _0x407bd8;
      });
    },
    _onRemoveCanvasWheel(_0x5d0b0c) {
      (_0x5d0b0c.preventDefault(), _0x5d0b0c.stopPropagation());
      if (!this.active || !this._isRemoveUiMode() || !this._removeCursorHover) return;
      const _0x227979 = _0x5d0b0c.deltaY || 0,
        _0x3171b6 = _0x227979 < 0 ? 1 : -1,
        _0x24c700 = this._clampRemoveBrushSize(this._removeBrushSizePx),
        _0x38af87 = this._clampRemoveBrushSize(_0x24c700 + _0x3171b6 * 2);
      if (_0x38af87 === _0x24c700) return;
      ((this._removeBrushSizePx = _0x38af87), this._syncRemoveBrushControls(), this._syncRemoveCursor());
    },
    _getVideoProjection(_0x6b4652 = this.videoEl || this._getVideoEl()) {
      if (!_0x6b4652) return null;
      const _0x56e0c1 = _0x6b4652.getBoundingClientRect(),
        _0x3f8be4 = Number(_0x6b4652.offsetWidth) || 0,
        _0x326c42 = Number(_0x6b4652.offsetHeight) || 0,
        _0x4a0c22 = Number(_0x6b4652.videoWidth) || 0,
        _0x38386c = Number(_0x6b4652.videoHeight) || 0;
      if (!_0x56e0c1.width || !_0x56e0c1.height || !_0x3f8be4 || !_0x326c42 || !_0x4a0c22 || !_0x38386c)
        return null;
      const _0x5c8b19 = window.getComputedStyle(_0x6b4652).objectFit || 'contain',
        _0x20e637 =
          _0x5c8b19 === 'cover'
            ? Math.max(_0x3f8be4 / _0x4a0c22, _0x326c42 / _0x38386c)
            : Math.min(_0x3f8be4 / _0x4a0c22, _0x326c42 / _0x38386c);
      if (!Number.isFinite(_0x20e637) || _0x20e637 <= 0) return null;
      const _0x3736c2 = _0x56e0c1.width / _0x3f8be4,
        _0x517e1a = _0x56e0c1.height / _0x326c42;
      if (!Number.isFinite(_0x3736c2) || _0x3736c2 <= 0 || !Number.isFinite(_0x517e1a) || _0x517e1a <= 0)
        return null;
      return {
        rect: _0x56e0c1,
        ew: _0x3f8be4,
        eh: _0x326c42,
        vw: _0x4a0c22,
        vh: _0x38386c,
        fit: _0x5c8b19,
        scale: _0x20e637,
        dw: _0x4a0c22 * _0x20e637,
        dh: _0x38386c * _0x20e637,
        ox: (_0x3f8be4 - _0x4a0c22 * _0x20e637) / 2,
        oy: (_0x326c42 - _0x38386c * _0x20e637) / 2,
        sx: _0x3736c2,
        sy: _0x517e1a,
      };
    },
    _getLayerProjection(_0x192f03 = this.markLayerEl) {
      if (!_0x192f03) return null;
      const _0x45c7fd = _0x192f03.getBoundingClientRect(),
        _0x3c2de9 = Number(_0x192f03.offsetWidth) || Number(_0x192f03.clientWidth) || 0,
        _0x2cc7b9 = Number(_0x192f03.offsetHeight) || Number(_0x192f03.clientHeight) || 0;
      if (!_0x45c7fd.width || !_0x45c7fd.height || !_0x3c2de9 || !_0x2cc7b9) return null;
      const _0x25da2c = _0x45c7fd.width / _0x3c2de9,
        _0x1f5f9a = _0x45c7fd.height / _0x2cc7b9;
      if (!Number.isFinite(_0x25da2c) || _0x25da2c <= 0 || !Number.isFinite(_0x1f5f9a) || _0x1f5f9a <= 0)
        return null;
      return { rect: _0x45c7fd, lw: _0x3c2de9, lh: _0x2cc7b9, sx: _0x25da2c, sy: _0x1f5f9a };
    },
    _pickFromClient(_0x2216b6, _0xeca12e, _0x56f866 = this._getVideoProjection()) {
      if (!_0x56f866) return null;
      const _0x572cbd = (_0x2216b6 - _0x56f866.rect.left) / _0x56f866.sx,
        _0x938891 = (_0xeca12e - _0x56f866.rect.top) / _0x56f866.sy;
      if (!Number.isFinite(_0x572cbd) || !Number.isFinite(_0x938891)) return null;
      if (
        _0x56f866.fit !== 'cover' &&
        (_0x572cbd < _0x56f866.ox ||
          _0x572cbd > _0x56f866.ox + _0x56f866.dw ||
          _0x938891 < _0x56f866.oy ||
          _0x938891 > _0x56f866.oy + _0x56f866.dh)
      )
        return null;
      const _0x339b5b = (_0x572cbd - _0x56f866.ox) / _0x56f866.scale,
        _0x1919fc = (_0x938891 - _0x56f866.oy) / _0x56f866.scale;
      if (!Number.isFinite(_0x339b5b) || !Number.isFinite(_0x1919fc)) return null;
      return {
        nx: Math.max(0, Math.min(1, _0x339b5b / _0x56f866.vw)),
        ny: Math.max(0, Math.min(1, _0x1919fc / _0x56f866.vh)),
        videoProjection: _0x56f866,
      };
    },
    _normalizedToLayerPoint(
      _0x2b457e,
      _0x47e8a6,
      _0x339d54 = this._getLayerProjection(),
      _0x45c7fb = this._getVideoProjection(),
    ) {
      if (!_0x339d54 || !_0x45c7fb) return null;
      const _0x5f4837 = Math.max(0, Math.min(1, Number(_0x2b457e) || 0)),
        _0x38f71c = Math.max(0, Math.min(1, Number(_0x47e8a6) || 0)),
        _0x430e0b = _0x45c7fb.ox + _0x5f4837 * _0x45c7fb.vw * _0x45c7fb.scale,
        _0x4c2364 = _0x45c7fb.oy + _0x38f71c * _0x45c7fb.vh * _0x45c7fb.scale,
        _0xfb35c2 = _0x45c7fb.rect.left + _0x430e0b * _0x45c7fb.sx,
        _0x56a10e = _0x45c7fb.rect.top + _0x4c2364 * _0x45c7fb.sy,
        _0x47e1f6 = (_0xfb35c2 - _0x339d54.rect.left) / _0x339d54.sx,
        _0x38a2ac = (_0x56a10e - _0x339d54.rect.top) / _0x339d54.sy;
      if (!Number.isFinite(_0x47e1f6) || !Number.isFinite(_0x38a2ac)) return null;
      return { x: _0x47e1f6, y: _0x38a2ac };
    },
    _scheduleRemoveCursor(_0x3f7776, _0x5c2898) {
      this._removeCursorLast = { x: Number(_0x3f7776) || 0, y: Number(_0x5c2898) || 0 };
      if (this._removeCursorRaf) return;
      this._removeCursorRaf = requestAnimationFrame(() => {
        ((this._removeCursorRaf = 0), this._syncRemoveCursor());
      });
    },
    _syncRemoveCursor() {
      const _0x4610cc = this.markLayerEl,
        _0x5e2675 = this.removeCursorEl;
      if (!this._isRemoveUiMode() || !_0x4610cc || !_0x5e2675) return;
      const _0x3f8219 = () =>
        syncCircularBrushCursor({ cursorEl: _0x5e2675, canvasEl: _0x4610cc, visible: false });
      if (!this._removeCursorHover) {
        _0x3f8219();
        return;
      }
      const _0x41d49d = this._getVideoProjection(),
        _0x42260d = this._getLayerProjection(_0x4610cc),
        _0x152863 = this._pickFromClient(this._removeCursorLast.x, this._removeCursorLast.y, _0x41d49d),
        _0x3bfbe6 = _0x152863
          ? this._normalizedToLayerPoint(_0x152863.nx, _0x152863.ny, _0x42260d, _0x41d49d)
          : null;
      if (!_0x41d49d || !_0x42260d || !_0x152863 || !_0x3bfbe6) {
        _0x3f8219();
        return;
      }
      const _0x10504c = Number(_0x3bfbe6?.x),
        _0x358ef2 = Number(_0x3bfbe6?.y);
      if (
        !Number.isFinite(_0x10504c) ||
        !Number.isFinite(_0x358ef2) ||
        _0x10504c < 0 ||
        _0x358ef2 < 0 ||
        _0x10504c > _0x42260d.lw ||
        _0x358ef2 > _0x42260d.lh
      ) {
        _0x3f8219();
        return;
      }
      const _0x3e764c = this._clampRemoveBrushSize(this._removeBrushSizePx);
      syncCircularBrushCursor({
        cursorEl: _0x5e2675,
        canvasEl: _0x4610cc,
        visible: true,
        tool: this._getRemoveToolType(),
        allowedTools: ['brush', 'eraser'],
        sizePx: _0x3e764c,
        cursorLast: { x: _0x10504c, y: _0x358ef2 },
        isEraseBrush: true,
      });
    },
    _attachMarkLayerListeners() {
      const _0x1575d4 = this.markLayerEl;
      if (!_0x1575d4) return;
      if (this._onMarkPointerDown) _0x1575d4.addEventListener('pointerdown', this._onMarkPointerDown);
      if (this._onMarkPointerMove) _0x1575d4.addEventListener('pointermove', this._onMarkPointerMove);
      if (this._onMarkPointerUp) _0x1575d4.addEventListener('pointerup', this._onMarkPointerUp);
      if (this._onMarkPointerCancel) _0x1575d4.addEventListener('pointercancel', this._onMarkPointerCancel);
      if (this._onMarkPointerCancel)
        _0x1575d4.addEventListener('lostpointercapture', this._onMarkPointerCancel);
      if (this._onMarkPointerEnter) _0x1575d4.addEventListener('pointerenter', this._onMarkPointerEnter);
      if (this._onMarkPointerLeave) _0x1575d4.addEventListener('pointerleave', this._onMarkPointerLeave);
    },
    _detachMarkLayerListeners(_0x275997 = this.markLayerEl) {
      if (!_0x275997) return;
      if (this._onMarkPointerDown) _0x275997.removeEventListener('pointerdown', this._onMarkPointerDown);
      if (this._onMarkPointerMove) _0x275997.removeEventListener('pointermove', this._onMarkPointerMove);
      if (this._onMarkPointerUp) _0x275997.removeEventListener('pointerup', this._onMarkPointerUp);
      if (this._onMarkPointerCancel)
        _0x275997.removeEventListener('pointercancel', this._onMarkPointerCancel);
      if (this._onMarkPointerCancel)
        _0x275997.removeEventListener('lostpointercapture', this._onMarkPointerCancel);
      if (this._onMarkPointerEnter) _0x275997.removeEventListener('pointerenter', this._onMarkPointerEnter);
      if (this._onMarkPointerLeave) _0x275997.removeEventListener('pointerleave', this._onMarkPointerLeave);
    },
    _collectRemovePosPoints(_0x45c25f = REMOVE_POS_POINT_LIMIT) {
      const _0x3dda3b = Array.isArray(this._marks) ? this._marks : [],
        _0x49bc8f = _0x3dda3b.filter(
          (_0x5d838d) => _0x5d838d && (_0x5d838d.type === 'brush' || _0x5d838d.type === 'eraser'),
        ),
        _0xfad2b = _0x49bc8f.some((_0x5af996) => _0x5af996.type === 'brush');
      if (!_0xfad2b) return [];
      const _0x5bfed9 = Math.max(1, Math.trunc(Number(_0x45c25f) || REMOVE_POS_POINT_LIMIT)),
        _0x418066 = this.videoEl || this._getVideoEl(),
        _0x5f0c11 = Math.max(
          1,
          Number(_0x418066?.videoWidth) || Number(_0x418066?.offsetWidth) || REMOVE_MASK_MAX_SIDE,
        ),
        _0x18d103 = Math.max(
          1,
          Number(_0x418066?.videoHeight) || Number(_0x418066?.offsetHeight) || REMOVE_MASK_MAX_SIDE,
        ),
        _0x3089ef = Math.min(1, REMOVE_MASK_MAX_SIDE / Math.max(_0x5f0c11, _0x18d103)),
        _0x200392 = Math.max(1, Math.round(_0x5f0c11 * _0x3089ef)),
        _0x132cc7 = Math.max(1, Math.round(_0x18d103 * _0x3089ef)),
        _0x51dbcc = document.createElement('canvas');
      ((_0x51dbcc.width = _0x200392), (_0x51dbcc.height = _0x132cc7));
      const _0x57d618 = _0x51dbcc.getContext('2d', { willReadFrequently: true });
      if (!_0x57d618) return [];
      const _0x20a8a2 = getEraseCanvasPalette(),
        _0x24a028 = _0x200392 / Math.max(1, Number(_0x418066?.offsetWidth) || _0x200392);
      _0x49bc8f.forEach((_0x53ff9d) => {
        const _0x163cd1 = Array.isArray(_0x53ff9d.points) ? _0x53ff9d.points : [];
        if (!_0x163cd1.length) return;
        const _0x4404f3 = _0x53ff9d.type === 'eraser' ? 'eraser' : 'brush',
          _0xa72494 = getBrushLineWidth(
            this._clampRemoveBrushSize(_0x53ff9d.brushSizePx),
            _0x24a028,
            _0x4404f3,
          ),
          _0xd9b14e = _0x163cd1.map((_0x1f2d94) => ({
            x: Math.max(0, Math.min(1, Number(_0x1f2d94?.nx) || 0)) * (_0x200392 - 1),
            y: Math.max(0, Math.min(1, Number(_0x1f2d94?.ny) || 0)) * (_0x132cc7 - 1),
          }));
        _0x57d618.save();
        const _0x5c3ef5 = _0x4404f3 === 'eraser' ? _0x20a8a2.eraseDark : _0x20a8a2.brushLight;
        (drawRoundBrushStroke(_0x57d618, {
          points: _0xd9b14e,
          lineWidth: _0xa72494,
          strokeStyle: _0x5c3ef5,
          fillStyle: _0x5c3ef5,
          globalCompositeOperation: _0x4404f3 === 'eraser' ? 'destination-out' : 'source-over',
        }),
          _0x57d618.restore());
      });
      const _0x527a21 = _0x57d618.getImageData(0, 0, _0x200392, _0x132cc7).data,
        _0x291b46 = [],
        _0x45a74b = new Set(),
        _0x1e211b = (_0x3a73b3, _0x131a35) => {
          const _0x344da7 = _0x200392 > 1 ? _0x3a73b3 / (_0x200392 - 1) : 0,
            _0xcb0c7a = _0x132cc7 > 1 ? _0x131a35 / (_0x132cc7 - 1) : 0,
            _0x202bb7 = Math.round(_0x344da7 * 0xfa0) + ':' + Math.round(_0xcb0c7a * 0xfa0);
          if (_0x45a74b.has(_0x202bb7)) return;
          (_0x45a74b.add(_0x202bb7), _0x291b46.push({ x: _0x344da7, y: _0xcb0c7a }));
        },
        _0x31cd07 = (_0x3901e4) => {
          for (let _0x3a681e = 0; _0x3a681e < _0x132cc7; _0x3a681e += _0x3901e4) {
            for (let _0x3852ec = 0; _0x3852ec < _0x200392; _0x3852ec += _0x3901e4) {
              const _0x2794b4 = (_0x3a681e * _0x200392 + _0x3852ec) * 4;
              if (_0x527a21[_0x2794b4 + 3] < 8) continue;
              _0x1e211b(_0x3852ec, _0x3a681e);
              if (_0x291b46.length >= _0x5bfed9) return true;
            }
          }
          return false;
        },
        _0x9c254d = Math.max(1, Math.floor(Math.max(_0x200392, _0x132cc7) / 220)),
        _0x5aeccf = _0x31cd07(_0x9c254d);
      !_0x5aeccf && _0x291b46.length < Math.min(_0x5bfed9, 80) && _0x9c254d > 1 && _0x31cd07(1);
      if (_0x291b46.length > _0x5bfed9) _0x291b46.length = _0x5bfed9;
      return _0x291b46;
    },
    _getKeyingMeta() {
      const _0x34ed79 = appStore.getState().nodes?.[this.nodeId] || {},
        { fps: _0x32171b, resolution: _0x4b7682 } = this._getRhVideoSettings(_0x34ed79),
        _0x554107 = Math.max(1, Math.round((Number(this.durationSec) || 0) * _0x32171b) || 1),
        _0x3f632b = this.videoEl || this._getVideoEl(),
        _0x256924 = Math.max(0, Math.min(Number(this.durationSec) || 0, Number(_0x3f632b?.currentTime) || 0)),
        _0x1254c2 = Math.min(_0x554107, Math.max(0, Math.round(_0x256924 * _0x32171b)));
      return { fps: _0x32171b, res: _0x4b7682, totalFrames: _0x554107, frameIndex: _0x1254c2 };
    },
    _calcKeyingFrameSize(_0x128385, _0xd70cb1, _0x29beb7) {
      const _0x968a55 = Math.max(0, Math.trunc(Number(_0x128385) || 0)),
        _0x1c9518 = Math.max(0, Math.trunc(Number(_0xd70cb1) || 0)),
        _0xa3f44 = Math.max(0, Math.trunc(Number(_0x29beb7) || 0));
      if (!_0x968a55 || !_0x1c9518 || !_0xa3f44) return { w: _0x968a55, h: _0x1c9518 };
      const _0x31f9b0 = Math.max(_0x968a55, _0x1c9518),
        _0x1be0f9 = _0xa3f44 / _0x31f9b0,
        _0x104d05 = Math.max(1, Math.round(_0x968a55 * _0x1be0f9)),
        _0x3930a0 = Math.max(1, Math.round(_0x1c9518 * _0x1be0f9));
      return { w: _0x104d05, h: _0x3930a0 };
    },
    _updateHelperRight() {
      if (!this.helperRightEl || !this.active) return;
      const { fps: _0x1e5dbb, res: _0x21f594, frameIndex: _0x3c0571 } = this._getKeyingMeta(),
        _0xbfc9ab = videoKeyingText('helper.meta', {
          fps: _0x1e5dbb,
          resolution: _0x21f594,
          frameIndex: _0x3c0571,
        });
      if (this._lastHelperRightText === _0xbfc9ab) return;
      ((this._lastHelperRightText = _0xbfc9ab), (this.helperRightEl.textContent = _0xbfc9ab));
    },
    _resolveSourceVideoValue(_0xbc10a0 = appStore.getState().nodes?.[this.nodeId] || {}) {
      return _0xbc10a0.src || _0xbc10a0.videoUrl || _0xbc10a0.localPath || _0xbc10a0.resultLocalPath || '';
    },
    _normalizeRhMaskMode(_0x5b0b59) {
      const _0x53d219 = String(_0x5b0b59 || '').trim();
      if (!_0x53d219 || _0x53d219 === '0') return 'Sec';
      if (_0x53d219 === '1') return 'Sam3';
      if (_0x53d219 === '2') return 'MA2';
      const _0x41b888 = _0x53d219.toLowerCase();
      if (_0x41b888 === 'sam3') return 'Sam3';
      if (_0x41b888 === 'ma2' || _0x41b888 === 'matanyone2') return 'MA2';
      return 'Sec';
    },
    _getRhVideoSettings(_0x5b6e7f = appStore.getState().nodes?.[this.nodeId] || {}) {
      const _0x21607a = normalizeRhKeyingFps(
          resolveSourceVideoKeyingSetting(_0x5b6e7f, 'rhVideoFps', RH_DEFAULT_KEYING_FPS),
        ),
        _0x45e5c5 = normalizeRhKeyingResolution(
          resolveSourceVideoKeyingSetting(_0x5b6e7f, 'rhVideoResolution', RH_DEFAULT_KEYING_RESOLUTION),
        ),
        _0x553dfa = normalizeRhInstanceType(
          resolveSourceVideoKeyingSetting(_0x5b6e7f, 'rhInstanceType', RH_DEFAULT_INSTANCE_TYPE),
        );
      return { fps: _0x21607a, resolution: _0x45e5c5, instanceType: _0x553dfa };
    },
    _getRhMaskMode(_0x2f54f0 = appStore.getState().nodes?.[this.nodeId] || {}) {
      return this._normalizeRhMaskMode(
        resolveSourceVideoKeyingSetting(_0x2f54f0, 'rhMaskMode', RH_DEFAULT_KEYING_MASK_MODE),
      );
    },
    _getSourceFrameCount(_0x5d3947, _0x1bc9d9) {
      const _0x2c5f1a = Number.isFinite(Number(_0x1bc9d9)) && Number(_0x1bc9d9) > 0 ? Number(_0x1bc9d9) : 24,
        _0x300008 = Number(_0x5d3947?.videoFrameCount),
        _0x4ae61c = Number(_0x5d3947?.videoFps),
        _0x242f20 = [
          Number(_0x5d3947?.videoDuration),
          Number(this.durationSec),
          Number(this.videoEl?.duration),
        ];
      let _0x19fbf1 = _0x242f20.find((_0x357a06) => Number.isFinite(_0x357a06) && _0x357a06 > 0);
      !Number.isFinite(_0x19fbf1) &&
        Number.isFinite(_0x300008) &&
        _0x300008 > 0 &&
        Number.isFinite(_0x4ae61c) &&
        _0x4ae61c > 0 &&
        (_0x19fbf1 = _0x300008 / _0x4ae61c);
      if (Number.isFinite(_0x19fbf1)) return Math.max(1, Math.round(_0x19fbf1 * _0x2c5f1a));
      if (Number.isFinite(_0x300008) && _0x300008 > 0) return Math.max(1, Math.trunc(_0x300008));
      return Math.max(1, Math.trunc(Number(_0x5d3947?.rhVideoFrames) || _0x2c5f1a || 24));
    },
    _computeGenerationDuration(_0x42b9d8) {
      const _0x491f6c = appStore.getState().nodes?.[_0x42b9d8],
        _0x83c66c = Number(_0x491f6c?.generationStartTime);
      if (!Number.isFinite(_0x83c66c) || _0x83c66c <= 0) return 0;
      return Math.max(0, Date.now() - _0x83c66c);
    },
    _getRemoveMaskExportSize(_0xdadfcf) {
      const _0x6dea28 = this.videoEl || this._getVideoEl(),
        _0x11c1ec = Math.max(
          1,
          Number(_0x6dea28?.videoWidth) || Number(_0x6dea28?.offsetWidth) || Number(_0xdadfcf) || 0x400,
        ),
        _0x59fbe9 = Math.max(
          1,
          Number(_0x6dea28?.videoHeight) || Number(_0x6dea28?.offsetHeight) || Number(_0xdadfcf) || 0x400,
        ),
        { w: _0x168b8a, h: _0xa24608 } = this._calcKeyingFrameSize(_0x11c1ec, _0x59fbe9, _0xdadfcf);
      return {
        videoEl: _0x6dea28,
        sourceW: _0x11c1ec,
        sourceH: _0x59fbe9,
        width: Math.max(1, _0x168b8a || 1),
        height: Math.max(1, _0xa24608 || 1),
      };
    },
    _getVideoRectInLayer(_0x39ba59 = this._getLayerProjection(), _0x3358fd = this._getVideoProjection()) {
      if (!_0x39ba59 || !_0x3358fd) return null;
      const _0x402b35 = this._normalizedToLayerPoint(0, 0, _0x39ba59, _0x3358fd),
        _0x408a5b = this._normalizedToLayerPoint(1, 1, _0x39ba59, _0x3358fd);
      if (!_0x402b35 || !_0x408a5b) return null;
      const _0x1f32bf = Number(_0x402b35.x),
        _0x3b6e52 = Number(_0x402b35.y),
        _0x234ef4 = Number(_0x408a5b.x),
        _0x25fbe6 = Number(_0x408a5b.y);
      if (
        !Number.isFinite(_0x1f32bf) ||
        !Number.isFinite(_0x3b6e52) ||
        !Number.isFinite(_0x234ef4) ||
        !Number.isFinite(_0x25fbe6)
      )
        return null;
      return {
        x: _0x1f32bf,
        y: _0x3b6e52,
        width: Math.max(1, _0x234ef4 - _0x1f32bf),
        height: Math.max(1, _0x25fbe6 - _0x3b6e52),
      };
    },
    _exportRemoveMaskDataUrl(_0x2dc9b4) {
      this._renderMarksFn?.();
      const {
        videoEl: _0x93606d,
        width: _0x485534,
        height: _0x1b581a,
      } = this._getRemoveMaskExportSize(_0x2dc9b4);
      if (!_0x485534 || !_0x1b581a) throw new Error(videoKeyingText('errors.maskSizeInvalid'));
      const _0x38c47e = (Array.isArray(this._marks) ? this._marks : []).filter(
          (_0x1d71d4) => _0x1d71d4 && (_0x1d71d4.type === 'brush' || _0x1d71d4.type === 'eraser'),
        ),
        _0x3a2dcd = _0x38c47e.some((_0x5b0d05) => _0x5b0d05.type === 'brush');
      if (!_0x3a2dcd) throw new Error(videoKeyingText('errors.noBrush'));
      const _0x171c1c = document.createElement('canvas');
      ((_0x171c1c.width = _0x485534), (_0x171c1c.height = _0x1b581a));
      const _0x29fffb = _0x171c1c.getContext('2d');
      if (!_0x29fffb) throw new Error(videoKeyingText('errors.maskCanvasUnavailable'));
      const _0x2c151d = getEraseCanvasPalette();
      ((_0x29fffb.fillStyle = _0x2c151d.eraseDark), _0x29fffb.fillRect(0, 0, _0x485534, _0x1b581a));
      const _0x5f3bd8 = this.removeMaskCanvasEl,
        _0x11a0a4 = this._getLayerProjection(this.markLayerEl),
        _0x123d42 = this._getVideoProjection(_0x93606d),
        _0x5d52cc = this._getVideoRectInLayer(_0x11a0a4, _0x123d42);
      if (_0x5f3bd8 && _0x5d52cc && _0x5f3bd8.width > 0 && _0x5f3bd8.height > 0) {
        const _0x6a66cd = Math.max(0, Math.min(_0x5f3bd8.width - 1, _0x5d52cc.x)),
          _0x5ba428 = Math.max(0, Math.min(_0x5f3bd8.height - 1, _0x5d52cc.y)),
          _0x3164f3 = Math.max(1, Math.min(_0x5f3bd8.width - _0x6a66cd, _0x5d52cc.width)),
          _0x1d5628 = Math.max(1, Math.min(_0x5f3bd8.height - _0x5ba428, _0x5d52cc.height));
        return (
          _0x29fffb.drawImage(
            _0x5f3bd8,
            _0x6a66cd,
            _0x5ba428,
            _0x3164f3,
            _0x1d5628,
            0,
            0,
            _0x485534,
            _0x1b581a,
          ),
          _0x171c1c.toDataURL('image/png')
        );
      }
      return (
        _0x38c47e.forEach((_0x3eb885) => {
          const _0x15c68b = Array.isArray(_0x3eb885.points) ? _0x3eb885.points : [];
          if (!_0x15c68b.length) return;
          const _0x4cc725 = _0x3eb885.type === 'eraser' ? 'eraser' : 'brush',
            _0x4a063d = _0x4cc725 === 'eraser' ? _0x2c151d.eraseDark : _0x2c151d.brushLight,
            _0x4c11c4 = getBrushLineWidth(
              this._clampRemoveBrushSize(_0x3eb885.brushSizePx) *
                (_0x485534 / Math.max(1, Number(_0x93606d?.offsetWidth) || _0x485534)),
              1,
              _0x4cc725,
            ),
            _0x4c8e94 = _0x15c68b.map((_0x43403b) => ({
              x: Math.max(0, Math.min(1, Number(_0x43403b?.nx) || 0)) * (_0x485534 - 1),
              y: Math.max(0, Math.min(1, Number(_0x43403b?.ny) || 0)) * (_0x1b581a - 1),
            }));
          (_0x29fffb.save(),
            drawRoundBrushStroke(_0x29fffb, {
              points: _0x4c8e94,
              lineWidth: _0x4c11c4,
              strokeStyle: _0x4a063d,
              fillStyle: _0x4a063d,
            }),
            _0x29fffb.restore());
        }),
        _0x171c1c.toDataURL('image/png')
      );
    },
    _updateConfirmEnabled() {
      if (!this.confirmBtnEl || !this.active) return;
      const _0x2fb849 = this.nodeId,
        _0x1de9be = _0x2fb849 ? this._rhTasks.get(_0x2fb849) : null;
      if (_0x1de9be && _0x1de9be.running) {
        if (this.confirmBtnEl.disabled) this.confirmBtnEl.disabled = false;
        return;
      }
      const { pos_points: _0x4f5290, neg_points: _0x2d3dd4 } = this.getPosNegPoints(),
        _0x1f9b8b = Array.isArray(_0x4f5290) ? _0x4f5290.length : 0,
        _0x108593 = Array.isArray(_0x2d3dd4) ? _0x2d3dd4.length : 0,
        _0x23d945 = this._isRemoveUiMode() ? _0x1f9b8b > 0 : _0x1f9b8b > 0 && _0x108593 < _0x1f9b8b;
      if (this._lastConfirmEnabled === _0x23d945) return;
      ((this._lastConfirmEnabled = _0x23d945), (this.confirmBtnEl.disabled = !_0x23d945));
    },
    _finalizeRhOutputNode(
      _0x5b9470,
      { jobStatus: _0xa5451a, outputText: _0x56f89d, extra: extra = {} } = {},
    ) {
      if (!_0x5b9470) return;
      const _0x55d2b2 = appStore.getState().nodes?.[_0x5b9470];
      if (!_0x55d2b2) return;
      const _0x55311c = this._computeGenerationDuration(_0x5b9470),
        _0x128d72 = String(extra?.rhTaskStatus || _0xa5451a || '')
          .trim()
          .toLowerCase();
      let _0x30f7ec;
      if (_0x128d72 === 'cancelled' || _0x128d72 === 'canceled')
        _0x30f7ec = buildGenerationCancelledPatch({ duration: _0x55311c });
      else {
        if (_0x128d72 === 'success' || _0x128d72 === 'succeeded' || _0x128d72 === 'completed')
          _0x30f7ec = buildGenerationSuccessPatch({ duration: _0x55311c });
        else
          _0x128d72 === 'failed' || _0x128d72 === 'fail' || _0x128d72 === 'error'
            ? (_0x30f7ec = buildGenerationFailurePatch({ error: _0x56f89d, duration: _0x55311c }))
            : (_0x30f7ec = {
                ...buildGenerationCancelledPatch({ duration: _0x55311c }),
                jobStatus: _0xa5451a,
              });
      }
      appStore.updateNodeData(_0x5b9470, {
        ..._0x30f7ec,
        rhTaskRecovering: false,
        outputText: _0x56f89d,
        ...extra,
      });
    },
    _notifyRhTaskChange(_0x505e1f = {}) {
      try {
        window.dispatchEvent?.(
          new CustomEvent(VIDEO_KEYING_TASK_CHANGE_EVENT, {
            detail: {
              sourceNodeId: String(_0x505e1f.sourceNodeId || ''),
              outId: String(_0x505e1f.outId || ''),
              mode: String(_0x505e1f.mode || ''),
            },
          }),
        );
      } catch {}
    },
    async _submitRhVideoMattingRuntimeTask({
      sourceNodeId: _0x411f5b,
      outId: _0x20056a,
      ctxId: _0x35fccc,
      controller: _0x233973,
      startTime: _0x5310d5,
      taskType: _0x408f20,
      executionId: _0x1540dd,
      payload: _0x1da191,
      successName: successName = '',
    } = {}) {
      const _0xf74f6c = _0x408f20 === 'video-remove' ? 'remove' : 'keying';
      return submitTask(
        {
          sourceNodeId: _0x411f5b,
          targetNodeId: _0x20056a,
          trigger: 'toolbar',
          taskType: _0x408f20,
          provider: 'runninghubwf',
          adapterType: 'workflow',
          modelId: getVideoKeyingModelId(),
          executionId: _0x1540dd,
          payload: _0x1da191,
          cancellable: true,
          resumable: true,
          parseError: (_0x117d46) =>
            typeof _0x117d46?.getUserMessage === 'function' ? _0x117d46.getUserMessage() : _0x117d46?.message,
          cancel: async ({ taskId: _0x31a233 }) => {
            if (!_0x1da191?.apiKey || !_0x31a233) return;
            await cancelRunningHubTask({ apiKey: _0x1da191.apiKey, taskId: _0x31a233 });
          },
          submit: async (_0x398570, _0x3aed5e) =>
            generateVideo(_0x398570, {
              signal: _0x3aed5e.signal,
              onTaskId: (_0x39aabd) => {
                _0x3aed5e.onTaskId?.(_0x39aabd);
                const _0x2332cf = this._rhTasks.get(_0x411f5b);
                _0x2332cf &&
                  _0x2332cf.id === _0x35fccc &&
                  ((_0x2332cf.taskId = String(_0x39aabd || '')), this._notifyRhTaskChange(_0x2332cf));
                if (!appStore.getState().nodes?.[_0x20056a]) return;
                appStore.updateNodeData(_0x20056a, {
                  rhTaskUseOpenapiQuery: false,
                  outputText: buildVideoKeyingOutputText(_0xf74f6c, 'processing', {
                    taskId: String(_0x39aabd || ''),
                  }),
                });
              },
            }),
          resultBuilder: (_0x497a63) => {
            const _0x51a11e = pickResultLocalPath(_0x497a63),
              _0x3fdaea = localPathToUrl(_0x51a11e) || String(_0x497a63?.videoUrl || '');
            if (!_0x3fdaea) throw new Error(videoKeyingText('errors.noVideoUrl'));
            const _0xd744a1 = this._computeGenerationDuration(_0x20056a);
            return {
              ...buildVideoGenerationResultPatch(
                { ..._0x497a63, videoUrl: String(_0x497a63?.videoUrl || _0x3fdaea), localPath: _0x51a11e },
                { startedAt: _0x5310d5, duration: _0xd744a1 },
              ),
              src: _0x3fdaea,
              ...(successName ? { name: successName } : {}),
              outputText: buildVideoKeyingOutputText(_0xf74f6c, 'completed'),
            };
          },
        },
        { store: appStore, abortController: _0x233973, startedAt: _0x5310d5 },
      );
    },
    _resolveRunningKeyingSourceNodeId(_0x7e067f) {
      const _0x2c66c6 = String(_0x7e067f || '').trim();
      if (!_0x2c66c6) return '';
      const _0x1e63ce = this._rhTasks.get(_0x2c66c6);
      if (_0x1e63ce?.running && _0x1e63ce.mode === 'keying') return _0x2c66c6;
      for (const [_0x56d2cf, _0x4d544c] of this._rhTasks.entries()) {
        if (!_0x4d544c?.running || _0x4d544c.mode !== 'keying') continue;
        if (
          String(_0x56d2cf || '') === _0x2c66c6 ||
          String(_0x4d544c.sourceNodeId || '') === _0x2c66c6 ||
          String(_0x4d544c.outId || '') === _0x2c66c6
        )
          return String(_0x56d2cf || '');
      }
      return '';
    },
    _resolveRunningRemoveSourceNodeId(_0xf73e01) {
      const _0x428e7c = String(_0xf73e01 || '').trim();
      if (!_0x428e7c) return '';
      const _0xf6307 = this._rhTasks.get(_0x428e7c);
      if (_0xf6307?.running && _0xf6307.mode === 'remove') return _0x428e7c;
      for (const [_0x32baa0, _0x51ecc4] of this._rhTasks.entries()) {
        if (!_0x51ecc4?.running || _0x51ecc4.mode !== 'remove') continue;
        if (
          String(_0x32baa0 || '') === _0x428e7c ||
          String(_0x51ecc4.sourceNodeId || '') === _0x428e7c ||
          String(_0x51ecc4.outId || '') === _0x428e7c
        )
          return String(_0x32baa0 || '');
      }
      return '';
    },
    _isRunningKeyingOutputNode(_0x102a73) {
      if (!_0x102a73 || typeof _0x102a73 !== 'object') return false;
      if (!isVideoKeyingModel(_0x102a73.model)) return false;
      const _0x51378c = String(_0x102a73.outputText || ''),
        _0x4d2304 = String(_0x102a73.name || ''),
        _0xf30146 =
          String(_0x102a73.rhToolbarTaskType || '') === 'video-keying' ||
          _0x51378c.includes('RH视频抠像') ||
          _0x51378c.includes('视频抠像') ||
          /^抠像结果\b/.test(_0x4d2304);
      if (!_0xf30146 || _0x51378c.includes('RH视频擦除')) return false;
      return shouldShowGenerationBusyUi(_0x102a73);
    },
    _isRunningRemoveOutputNode(_0x412a66) {
      if (!_0x412a66 || typeof _0x412a66 !== 'object') return false;
      if (!isVideoKeyingModel(_0x412a66.model)) return false;
      const _0x1eee9e = String(_0x412a66.outputText || ''),
        _0x467954 = String(_0x412a66.name || ''),
        _0xcfe704 =
          String(_0x412a66.rhToolbarTaskType || '') === 'video-remove' ||
          _0x1eee9e.includes('RH视频擦除') ||
          _0x1eee9e.includes('视频擦除') ||
          /^视频擦除/.test(_0x467954);
      if (!_0xcfe704) return false;
      return shouldShowGenerationBusyUi(_0x412a66);
    },
    _findRunningKeyingOutputNodeForNode(_0x23ca0b) {
      const _0x5f2b8d = String(_0x23ca0b || '').trim();
      if (!_0x5f2b8d) return null;
      const _0x2a1bb7 = appStore.getState().nodes || {},
        _0x280187 = Object.values(_0x2a1bb7)
          .filter((_0x45128e) => {
            if (!this._isRunningKeyingOutputNode(_0x45128e)) return false;
            return (
              String(_0x45128e.id || '') === _0x5f2b8d || String(_0x45128e.rhSourceNodeId || '') === _0x5f2b8d
            );
          })
          .sort((_0x334bbf, _0x414450) => {
            const _0x20cea7 = Number(_0x334bbf.rhTaskStartedAt || _0x334bbf.generationStartTime || 0) || 0,
              _0x57503a = Number(_0x414450.rhTaskStartedAt || _0x414450.generationStartTime || 0) || 0;
            return _0x57503a - _0x20cea7;
          });
      return _0x280187[0] || null;
    },
    _findRunningRemoveOutputNodeForNode(_0x384352) {
      const _0x278336 = String(_0x384352 || '').trim();
      if (!_0x278336) return null;
      const _0x54a1d2 = appStore.getState().nodes || {},
        _0x297135 = Object.values(_0x54a1d2)
          .filter((_0x5eda75) => {
            if (!this._isRunningRemoveOutputNode(_0x5eda75)) return false;
            return (
              String(_0x5eda75.id || '') === _0x278336 || String(_0x5eda75.rhSourceNodeId || '') === _0x278336
            );
          })
          .sort((_0x10a139, _0x168a08) => {
            const _0x23caf3 = Number(_0x10a139.rhTaskStartedAt || _0x10a139.generationStartTime || 0) || 0,
              _0x53099b = Number(_0x168a08.rhTaskStartedAt || _0x168a08.generationStartTime || 0) || 0;
            return _0x53099b - _0x23caf3;
          });
      return _0x297135[0] || null;
    },
    _getRunningKeyingTaskFromMemory(_0x3f470d) {
      const _0x1ef2f6 = this._resolveRunningKeyingSourceNodeId(_0x3f470d),
        _0x461d77 = _0x1ef2f6 ? this._rhTasks.get(_0x1ef2f6) : null;
      if (!_0x461d77?.running || _0x461d77.mode !== 'keying') return null;
      return {
        sourceNodeId: _0x1ef2f6,
        outId: String(_0x461d77.outId || ''),
        taskId: String(_0x461d77.taskId || ''),
        mode: 'keying',
        fromStore: false,
      };
    },
    _getRunningRemoveTaskFromMemory(_0x835733) {
      const _0x2caaa3 = this._resolveRunningRemoveSourceNodeId(_0x835733),
        _0x48d2ba = _0x2caaa3 ? this._rhTasks.get(_0x2caaa3) : null;
      if (!_0x48d2ba?.running || _0x48d2ba.mode !== 'remove') return null;
      return {
        sourceNodeId: _0x2caaa3,
        outId: String(_0x48d2ba.outId || ''),
        taskId: String(_0x48d2ba.taskId || ''),
        mode: 'remove',
        fromStore: false,
      };
    },
    getRunningKeyingTaskForNode(_0x3483e6) {
      const _0x1eea10 = this._getRunningKeyingTaskFromMemory(_0x3483e6);
      if (_0x1eea10) return _0x1eea10;
      const _0x53266a = this._findRunningKeyingOutputNodeForNode(_0x3483e6);
      if (!_0x53266a) return null;
      return {
        sourceNodeId: String(_0x53266a.rhSourceNodeId || ''),
        outId: String(_0x53266a.id || ''),
        taskId: String(_0x53266a.rhTaskId || ''),
        mode: 'keying',
        fromStore: true,
      };
    },
    getRunningRemoveTaskForNode(_0x15ff0a) {
      const _0x190acb = this._getRunningRemoveTaskFromMemory(_0x15ff0a);
      if (_0x190acb) return _0x190acb;
      const _0x3a0434 = this._findRunningRemoveOutputNodeForNode(_0x15ff0a);
      if (!_0x3a0434) return null;
      return {
        sourceNodeId: String(_0x3a0434.rhSourceNodeId || ''),
        outId: String(_0x3a0434.id || ''),
        taskId: String(_0x3a0434.rhTaskId || ''),
        mode: 'remove',
        fromStore: true,
      };
    },
    hasRunningKeyingTaskForNode(_0x478e04) {
      return !!this.getRunningKeyingTaskForNode(_0x478e04);
    },
    hasRunningRemoveTaskForNode(_0x50c40d) {
      return !!this.getRunningRemoveTaskForNode(_0x50c40d);
    },
    async cancelRunningKeyingTaskForNode(_0x24adf6, _0x15dcf5 = {}) {
      const _0x418f36 = this._resolveRunningKeyingSourceNodeId(_0x24adf6);
      if (_0x418f36) return this._cancelRhTaskForSourceNode(_0x418f36, _0x15dcf5);
      const _0x504365 = this.getRunningKeyingTaskForNode(_0x24adf6);
      if (!_0x504365?.outId) return false;
      let _0x851789 = '';
      try {
        _0x851789 = await getRunningHubWorkflowApiKey();
      } catch {}
      const _0x1109a0 = buildVideoKeyingOutputText('keying', 'cancelled');
      return (
        await cancelTask(_0x504365.outId, {
          store: appStore,
          cancellable: true,
          taskId: _0x504365.taskId,
          spec: { provider: 'runninghubwf', adapterType: 'workflow' },
          cancel: async ({ taskId: _0x20c1b1 }) => {
            if (!_0x851789 || !_0x20c1b1) return;
            try {
              await cancelRunningHubTask({ apiKey: _0x851789, taskId: _0x20c1b1 });
            } catch {}
          },
        }),
        appStore.updateNodeData(_0x504365.outId, { outputText: _0x1109a0 }),
        this._notifyRhTaskChange(_0x504365),
        _0x15dcf5?.notify && window.showToast?.(videoKeyingText('toasts.keyingCancelled'), 'info'),
        true
      );
    },
    async cancelRunningRemoveTaskForNode(_0x1cca0a, _0x2f0062 = {}) {
      const _0x384c83 = this._resolveRunningRemoveSourceNodeId(_0x1cca0a);
      if (_0x384c83) return this._cancelRhTaskForSourceNode(_0x384c83, _0x2f0062);
      const _0x41ed37 = this.getRunningRemoveTaskForNode(_0x1cca0a);
      if (!_0x41ed37?.outId) return false;
      let _0x1c83ed = '';
      try {
        _0x1c83ed = await getRunningHubWorkflowApiKey();
      } catch {}
      const _0x24ac5f = buildVideoKeyingOutputText('remove', 'cancelled');
      return (
        await cancelTask(_0x41ed37.outId, {
          store: appStore,
          cancellable: true,
          taskId: _0x41ed37.taskId,
          spec: { provider: 'runninghubwf', adapterType: 'workflow' },
          cancel: async ({ taskId: _0x3f84ed }) => {
            if (!_0x1c83ed || !_0x3f84ed) return;
            try {
              await cancelRunningHubTask({ apiKey: _0x1c83ed, taskId: _0x3f84ed });
            } catch {}
          },
        }),
        appStore.updateNodeData(_0x41ed37.outId, { outputText: _0x24ac5f }),
        this._notifyRhTaskChange(_0x41ed37),
        _0x2f0062?.notify && window.showToast?.(videoKeyingText('toasts.removeCancelled'), 'info'),
        true
      );
    },
    async _cancelRhTaskForSourceNode(_0x3f731d, { notify: notify = false } = {}) {
      const _0x379c54 = _0x3f731d ? this._rhTasks.get(_0x3f731d) : null;
      if (!_0x379c54 || !_0x379c54.running) return false;
      try {
        _0x379c54.abort?.abort();
      } catch {}
      const _0x20699a = String(_0x379c54.taskId || ''),
        _0x1d12ee = String(_0x379c54.apiKey || ''),
        _0x1f5896 = String(_0x379c54.outId || ''),
        _0x30d143 = _0x379c54.mode === 'remove';
      (this._rhTasks.delete(_0x3f731d), this._notifyRhTaskChange(_0x379c54));
      const _0x121a51 = buildVideoKeyingOutputText(_0x30d143 ? 'remove' : 'keying', 'cancelled');
      return (
        await cancelTask(_0x1f5896, {
          store: appStore,
          cancellable: true,
          taskId: _0x20699a,
          spec: { provider: 'runninghubwf', adapterType: 'workflow' },
          cancel: async ({ taskId: _0x579879 }) => {
            if (_0x1d12ee && _0x579879)
              try {
                await cancelRunningHubTask({ apiKey: _0x1d12ee, taskId: _0x579879 });
              } catch {}
          },
        }),
        appStore.updateNodeData(_0x1f5896, { outputText: _0x121a51 }),
        notify &&
          window.showToast?.(
            _0x30d143 ? videoKeyingText('toasts.removeCancelled') : videoKeyingText('toasts.keyingCancelled'),
            'info',
          ),
        true
      );
    },
    getPosNegPoints() {
      if (this._isRemoveUiMode()) {
        const _0x115916 = this._collectRemovePosPoints(REMOVE_POS_POINT_LIMIT);
        return { pos_points: _0x115916, neg_points: [] };
      }
      const _0x41ab9e = Array.isArray(this._marks) ? this._marks : [],
        _0x270e06 = [],
        _0xe476af = [];
      for (const _0x430493 of _0x41ab9e) {
        if (!_0x430493) continue;
        const _0x2625fa = Number(_0x430493.nx),
          _0x1c4a54 = Number(_0x430493.ny);
        if (!Number.isFinite(_0x2625fa) || !Number.isFinite(_0x1c4a54)) continue;
        const _0x43c77b = { x: _0x2625fa, y: _0x1c4a54 };
        if (_0x430493.pointType === 'background') _0xe476af.push(_0x43c77b);
        else _0x270e06.push(_0x43c77b);
      }
      return { pos_points: _0x270e06, neg_points: _0xe476af };
    },
    _syncPointsToStore() {
      const { pos_points: _0x3d6698, neg_points: _0x39bd6c } = this.getPosNegPoints();
      (appStore.setVideoKeyingState({ pos_points: _0x3d6698, neg_points: _0x39bd6c }),
        this._updateConfirmEnabled());
    },
    _undoMark() {
      const _0x2a14cd = Array.isArray(this._marks) ? this._marks : [];
      if (!_0x2a14cd.length) return;
      const _0x5cb78e = Array.isArray(this._marksRedo) ? this._marksRedo : [],
        _0x4ef065 = _0x2a14cd.pop();
      (_0x5cb78e.push(_0x4ef065),
        (this._marks = _0x2a14cd),
        (this._marksRedo = _0x5cb78e),
        this._renderMarksFn?.(),
        this._syncPointsToStore());
    },
    _redoMark() {
      const _0x3066c9 = Array.isArray(this._marksRedo) ? this._marksRedo : [];
      if (!_0x3066c9.length) return;
      const _0x334538 = Array.isArray(this._marks) ? this._marks : [],
        _0x44940e = _0x3066c9.pop();
      (_0x334538.push(_0x44940e),
        (this._marks = _0x334538),
        (this._marksRedo = _0x3066c9),
        this._renderMarksFn?.(),
        this._syncPointsToStore());
    },
    _clearAllMarks() {
      ((this._marks = []),
        (this._marksRedo = []),
        (this._removeDraft = null),
        (this._removeDrawPointerId = null),
        this._renderMarksFn?.(),
        appStore.setVideoKeyingState({ pos_points: [], neg_points: [] }),
        this._updateConfirmEnabled());
    },
    init(_0xb678c2, _0x889185 = {}) {
      if (!_0xb678c2) return;
      if (this.active) this.exit({ silent: true });
      const _0x93c1e7 = appStore.getState().nodes[_0xb678c2];
      if (!_0x93c1e7) return;
      ((this.uiMode = _0x889185?.uiMode === 'remove' ? 'remove' : 'keying'),
        (this._removePointTool = 'foreground'),
        (this._removeBrushSizePx = 40),
        (this._removeDraft = null),
        (this._removeDrawPointerId = null),
        (this._removeCursorHover = false),
        (this._removeCursorLast = { x: 0, y: 0 }));
      if (this._removeCursorRaf) cancelAnimationFrame(this._removeCursorRaf);
      ((this._removeCursorRaf = 0),
        (this.active = true),
        (this.nodeId = _0xb678c2),
        (this._marks = []),
        (this._marksRedo = []),
        appStore.setVideoKeyingState({ active: true, nodeId: _0xb678c2, pos_points: [], neg_points: [] }),
        (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())),
        (this._retryCount = 0),
        this._mountWhenReady());
    },
    _mountWhenReady() {
      const _0x54dc8b = this.nodeId,
        _0x42f61a = () => {
          if (!this.active || this.nodeId !== _0x54dc8b) return;
          const _0x5de4ac = document.getElementById(_0x54dc8b);
          if (!_0x5de4ac) {
            this._retryCount++;
            if (this._retryCount > 10) {
              this.exit({ silent: true });
              return;
            }
            this._retryRaf = requestAnimationFrame(_0x42f61a);
            return;
          }
          ((this.wrapperEl = _0x5de4ac), this._applyFrozenUI(true), this._applyDimMode(true));
          try {
            window._spaceHeld = false;
            const _0x57326a = document.getElementById('v2-wrap');
            if (_0x57326a) _0x57326a.style.cursor = '';
          } catch {}
          (this._createUI(), this._syncDurationAndDefaults(), this._bindEvents(), this._renderPlayhead());
        };
      this._retryRaf = requestAnimationFrame(_0x42f61a);
    },
    _applyDimMode(_0x2ff37f) {
      const _0xb1bcfc = document.getElementById('v2-wrap');
      if (_0xb1bcfc) {
        if (_0x2ff37f) _0xb1bcfc.classList.add('is-video-keying-mode');
        else _0xb1bcfc.classList.remove('is-video-keying-mode');
      }
      if (this.wrapperEl) {
        if (_0x2ff37f) this.wrapperEl.classList.add('is-video-keying-target');
        else this.wrapperEl.classList.remove('is-video-keying-target');
      }
    },
    _applyFrozenUI(_0x447d44) {
      if (!this.wrapperEl) return;
      const _0x41ea79 = 'is-video-keying';
      if (_0x447d44) this.wrapperEl.classList.add(_0x41ea79);
      else this.wrapperEl.classList.remove(_0x41ea79);
      this._applyFrozenOverlaysHidden(_0x447d44);
    },
    _applyFrozenOverlaysHidden(_0x6a52ba) {
      if (!this.wrapperEl) return;
      if (_0x6a52ba) {
        if (Array.isArray(this._hiddenEls) && this._hiddenEls.length) return;
        const _0x466a80 = [
            '.video-controls',
            '.video-mute-btn',
            '.node-upload-hint',
            '.video-center-indicator',
            '.gen-video-center-indicator',
            '.multi-toggle-btn',
          ],
          _0x546892 = [];
        (_0x466a80.forEach((_0x132958) => {
          this.wrapperEl.querySelectorAll(_0x132958).forEach((_0x4255a5) => {
            (_0x546892.push({ el: _0x4255a5, prevDisplay: _0x4255a5.style.display }),
              (_0x4255a5.style.display = 'none'));
          });
        }),
          (this._hiddenEls = _0x546892));
        return;
      }
      const _0x48ac7b = Array.isArray(this._hiddenEls) ? this._hiddenEls : [];
      ((this._hiddenEls = null),
        _0x48ac7b.forEach(({ el: _0x5677d6, prevDisplay: _0x466cc3 }) => {
          if (!_0x5677d6 || !_0x5677d6.isConnected) return;
          _0x5677d6.style.display = _0x466cc3 || '';
        }));
    },
    _pauseAllWrapperVideos() {
      this.wrapperEl &&
        this.wrapperEl.querySelectorAll('video').forEach((_0x567821) => {
          try {
            if (!_0x567821.paused) _0x567821.pause();
          } catch {}
        });
      if (this.videoEl)
        try {
          if (!this.videoEl.paused) this.videoEl.pause();
        } catch {}
    },
    _createRemoveToolbar() {
      const _0x529b2f = document.createElement('div');
      _0x529b2f.className = 'v2-video-keying-erasebar v2-annotate-toolbar';
      const _0x4a82c9 = this._buildShortcutTooltip(videoKeyingText('tools.brush'), 'editor-tool-brush', 'B'),
        _0x250cce = this._buildShortcutTooltip(videoKeyingText('tools.eraser'), 'editor-tool-eraser', 'E'),
        _0x11158d = this._buildShortcutTooltip(videoKeyingText('tools.undo'), 'undo', 'Ctrl+Z'),
        _0xdef157 = this._buildShortcutTooltip(videoKeyingText('tools.redo'), 'redo', 'Ctrl+Shift+Z'),
        _0xa0e991 = this._buildShortcutTooltip(videoKeyingText('tools.clear'), 'editor-clear', 'R');
      return (
        (_0x529b2f.innerHTML =
          '\n      <button class="v2-annotate-btn icon-only act-cancel" data-tooltip="' +
          videoKeyingText('tools.cancel') +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg></button>\n      <div class="v2-annotate-divider"></div>\n      <button class="v2-annotate-btn icon-only tool-btn active" data-tool="brush" data-tooltip="' +
          _0x4a82c9 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="eraser" data-tooltip="' +
          _0x250cce +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20 20H7l-5-5a2 2 0 0 1 0-2.83l9.17-9.17a2 2 0 0 1 2.83 0L22 10a2 2 0 0 1 0 2.83L14.83 20"/></svg></button>\n      <div class="v2-annotate-size"><span class="v2-annotate-size-value"></span><input class="v2-annotate-size-range" type="range" min="1" max="120" step="1"></div>\n      <div class="v2-annotate-divider"></div>\n      <button class="v2-annotate-btn icon-only act-undo" data-tooltip="' +
          _0x11158d +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 14l-4-4 4-4"/><path d="M5 10h9a6 6 0 1 1 0 12h-3"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-redo" data-tooltip="' +
          _0xdef157 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M15 14l4-4-4-4"/><path d="M19 10H10a6 6 0 1 0 0 12h3"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-clear" data-tooltip="' +
          _0xa0e991 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 16h10l1-16"/></svg></button>\n    '),
        (this.removeSizeValueEl = _0x529b2f.querySelector('.v2-annotate-size-value')),
        (this.removeSizeRangeEl = _0x529b2f.querySelector('.v2-annotate-size-range')),
        this.removeSizeRangeEl &&
          this.removeSizeValueEl &&
          (this._syncRemoveBrushControls(),
          this.removeSizeRangeEl.addEventListener('input', (_0x2146e9) => {
            const _0xd62e6 = this._clampRemoveBrushSize(_0x2146e9.target.value);
            ((this._removeBrushSizePx = _0xd62e6), this._syncRemoveBrushControls(), this._syncRemoveCursor());
          })),
        _0x529b2f.addEventListener('pointerdown', (_0x3321b7) => _0x3321b7.stopPropagation()),
        _0x529b2f.querySelector('.act-cancel')?.addEventListener('click', (_0x4760bf) => {
          (_0x4760bf.stopPropagation(), this.exit());
        }),
        _0x529b2f.querySelector('[data-tool="brush"]')?.addEventListener('click', (_0x59b244) => {
          (_0x59b244.stopPropagation(), this._setRemovePointTool('foreground'));
        }),
        _0x529b2f.querySelector('[data-tool="eraser"]')?.addEventListener('click', (_0x3ed8b3) => {
          (_0x3ed8b3.stopPropagation(), this._setRemovePointTool('background'));
        }),
        _0x529b2f.querySelector('.act-undo')?.addEventListener('click', (_0x5a4b3d) => {
          (_0x5a4b3d.stopPropagation(), this._undoMark());
        }),
        _0x529b2f.querySelector('.act-redo')?.addEventListener('click', (_0x5645ab) => {
          (_0x5645ab.stopPropagation(), this._redoMark());
        }),
        _0x529b2f.querySelector('.act-clear')?.addEventListener('click', (_0x134bab) => {
          (_0x134bab.stopPropagation(),
            this._clearAllMarks(),
            window.showToast?.(videoKeyingText('toasts.clearedPoints'), 'info'));
        }),
        _0x529b2f
      );
    },
    _createUI() {
      if (!this.wrapperEl) return;
      this.wrapperEl
        .querySelectorAll('.v2-video-keyingbar,.v2-video-keyinghint,.v2-video-keying-erasebar')
        .forEach((_0x2869e9) => _0x2869e9.remove());
      const _0x2c489e = document.createElement('div');
      _0x2c489e.className = 'v2-video-keyingbar';
      const _0x153a29 = document.createElement('button');
      ((_0x153a29.type = 'button'),
        (_0x153a29.className = 'v2-video-clipbtn cancel'),
        (_0x153a29.title = videoKeyingText('tools.cancel')));
      {
        const _0x1ad247 = 'http://www.w3.org/2000/svg',
          _0x1bec83 = document.createElementNS(_0x1ad247, 'svg');
        (_0x1bec83.setAttribute('width', '20'),
          _0x1bec83.setAttribute('height', '20'),
          _0x1bec83.setAttribute('viewBox', '0 0 24 24'),
          _0x1bec83.setAttribute('fill', 'none'),
          _0x1bec83.setAttribute('stroke', 'currentColor'),
          _0x1bec83.setAttribute('stroke-width', '2'));
        const _0x93db30 = document.createElementNS(_0x1ad247, 'path');
        _0x93db30.setAttribute('d', 'M18 6L6 18');
        const _0x514390 = document.createElementNS(_0x1ad247, 'path');
        (_0x514390.setAttribute('d', 'M6 6l12 12'),
          _0x1bec83.appendChild(_0x93db30),
          _0x1bec83.appendChild(_0x514390),
          _0x153a29.appendChild(_0x1bec83));
      }
      const _0x167f92 = document.createElement('button');
      ((_0x167f92.type = 'button'),
        (_0x167f92.className = 'prompt-submit img-gen-btn'),
        (_0x167f92.title = this._isRemoveUiMode()
          ? videoKeyingText('tools.remove')
          : videoKeyingText('tools.keying')));
      {
        const _0x2ef5e5 = 'http://www.w3.org/2000/svg',
          _0x1e9a8a = document.createElementNS(_0x2ef5e5, 'svg');
        (_0x1e9a8a.setAttribute('width', '14'),
          _0x1e9a8a.setAttribute('height', '14'),
          _0x1e9a8a.setAttribute('viewBox', '0 0 24 24'),
          _0x1e9a8a.setAttribute('fill', 'none'),
          _0x1e9a8a.setAttribute('stroke', 'currentColor'),
          _0x1e9a8a.setAttribute('stroke-width', '2'));
        const _0x43f4da = document.createElementNS(_0x2ef5e5, 'line');
        (_0x43f4da.setAttribute('x1', '12'),
          _0x43f4da.setAttribute('y1', '19'),
          _0x43f4da.setAttribute('x2', '12'),
          _0x43f4da.setAttribute('y2', '5'));
        const _0x62ff2 = document.createElementNS(_0x2ef5e5, 'polyline');
        (_0x62ff2.setAttribute('points', '5 12 12 5 19 12'),
          _0x1e9a8a.appendChild(_0x43f4da),
          _0x1e9a8a.appendChild(_0x62ff2),
          _0x167f92.appendChild(_0x1e9a8a));
      }
      const _0x1e3adb = appStore.getState().nodes?.[this.nodeId] || {},
        {
          fps: _0x553736,
          resolution: _0x4ed6ae,
          instanceType: _0x315659,
        } = this._getRhVideoSettings(_0x1e3adb),
        _0x11e5eb = this._getRhMaskMode(_0x1e3adb),
        _0x952e3b = {};
      !hasUsableKeyingSettingValue(_0x1e3adb.rhVideoFps) && (_0x952e3b.rhVideoFps = _0x553736);
      !hasUsableKeyingSettingValue(_0x1e3adb.rhVideoResolution) && (_0x952e3b.rhVideoResolution = _0x4ed6ae);
      !hasUsableKeyingSettingValue(_0x1e3adb.rhMaskMode) && (_0x952e3b.rhMaskMode = _0x11e5eb);
      !hasUsableKeyingSettingValue(_0x1e3adb.rhInstanceType) && (_0x952e3b.rhInstanceType = _0x315659);
      if (Object.keys(_0x952e3b).length)
        try {
          appStore.updateNodeData(this.nodeId, _0x952e3b);
        } catch {}
      let _0xd9e1f7 = document.createElement('div');
      _0xd9e1f7.className = 'rh-keying-settings-wrap';
      const _0xcbad62 = document.createElement('button');
      ((_0xcbad62.type = 'button'),
        (_0xcbad62.className = 'v2-video-clipbtn cancel rh-keying-settings-btn'),
        (_0xcbad62.title = videoKeyingText('tools.settings')));
      {
        const _0x25d29a = 'http://www.w3.org/2000/svg',
          _0x18871f = document.createElementNS(_0x25d29a, 'svg');
        (_0x18871f.setAttribute('width', '20'),
          _0x18871f.setAttribute('height', '20'),
          _0x18871f.setAttribute('viewBox', '0 0 24 24'),
          _0x18871f.setAttribute('fill', 'none'),
          _0x18871f.setAttribute('stroke', 'currentColor'),
          _0x18871f.setAttribute('stroke-width', '2'));
        const _0x161cc9 = document.createElementNS(_0x25d29a, 'path');
        _0x161cc9.setAttribute('d', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z');
        const _0x19614c = document.createElementNS(_0x25d29a, 'path');
        (_0x19614c.setAttribute(
          'd',
          'M19.4 15a1.7 1.7 0 0 0 .33 1.87l.06.06a2 2 0 0 1-1.42 3.42h-.2a2 2 0 0 1-1.41-.59l-.06-.06a1.7 1.7 0 0 0-1.87-.33 1.7 1.7 0 0 0-1.03 1.54V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.03-1.54 1.7 1.7 0 0 0-1.87.33l-.06.06a2 2 0 0 1-1.41.59h-.2a2 2 0 0 1-1.42-3.42l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.54-1.03H3a2 2 0 0 1 0-4h.06A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.33-1.87l-.06-.06A2 2 0 0 1 5.63 3.65h.2a2 2 0 0 1 1.41.59l.06.06A1.7 1.7 0 0 0 9.17 4.6a1.7 1.7 0 0 0 1.03-1.54V3a2 2 0 0 1 4 0v.06a1.7 1.7 0 0 0 1.03 1.54 1.7 1.7 0 0 0 1.87-.33l.06-.06a2 2 0 0 1 1.41-.59h.2A2 2 0 0 1 20.79 7.07l-.06.06A1.7 1.7 0 0 0 20.4 9c.32.55.86.92 1.54 1.03H22a2 2 0 0 1 0 4h-.06A1.7 1.7 0 0 0 19.4 15z',
        ),
          _0x18871f.appendChild(_0x19614c),
          _0x18871f.appendChild(_0x161cc9),
          _0xcbad62.appendChild(_0x18871f));
      }
      const _0x1317b9 = document.createElement('div');
      ((_0x1317b9.className = 'rh-keying-settings-menu'), _0x1317b9.setAttribute('role', 'menu'));
      {
        const _0x523fd2 = document.createElement('div');
        _0x523fd2.className = 'rh-keying-settings-head';
        const _0x3ac14d = document.createElement('span');
        ((_0x3ac14d.className = 'rh-keying-settings-title'),
          (_0x3ac14d.textContent = videoKeyingText('settings.title')),
          _0x523fd2.appendChild(_0x3ac14d),
          _0x1317b9.appendChild(_0x523fd2));
      }
      {
        const _0x4afefc = document.createElement('div');
        _0x4afefc.className = 'img-rp-quality-area';
        const _0x1b020f = document.createElement('div');
        _0x1b020f.className = 'img-rp-section-label';
        const _0xf29ed0 = document.createElement('span');
        ((_0xf29ed0.className = 'rh-keying-label-resolution'),
          (_0xf29ed0.textContent = videoKeyingText('settings.resolution')));
        const _0x38db6e = document.createElement('span');
        ((_0x38db6e.className = 'rh-tip rh-keying-tip-resolution'),
          _0x38db6e.setAttribute('data-tooltip', videoKeyingText('settings.resolutionTip')),
          (_0x38db6e.textContent = '!'),
          _0x1b020f.appendChild(_0xf29ed0),
          _0x1b020f.appendChild(_0x38db6e));
        const _0xd54f94 = document.createElement('div');
        ((_0xd54f94.className = 'img-rp-quality-segmented'),
          [0x340, 0x400, 0x500, 0x5a0, 0x640, 0x6e0, 0x780].forEach((_0x4a90cb) => {
            const _0x50aa9b = document.createElement('button');
            _0x50aa9b.type = 'button';
            const _0x385e07 = Number(_0x4a90cb) > 0x5a0;
            ((_0x50aa9b.className = (
              'img-rp-quality-item ' +
              (_0x385e07 ? 'dev-mode-only' : '') +
              ' rh-keying-res-btn ' +
              (Number(_0x4ed6ae) === Number(_0x4a90cb) ? 'active' : '')
            ).trim()),
              (_0x50aa9b.dataset.value = String(_0x4a90cb)),
              (_0x50aa9b.textContent = String(_0x4a90cb)),
              _0xd54f94.appendChild(_0x50aa9b));
          }),
          _0x4afefc.appendChild(_0x1b020f),
          _0x4afefc.appendChild(_0xd54f94),
          _0x1317b9.appendChild(_0x4afefc));
      }
      {
        const _0x14562e = document.createElement('div');
        _0x14562e.className = 'rh-vram-adv-row';
        const _0x274972 = document.createElement('div');
        _0x274972.className = 'rh-vram-adv-label';
        const _0x4f11e4 = document.createElement('span');
        ((_0x4f11e4.className = 'rh-keying-label-fps'),
          (_0x4f11e4.textContent = videoKeyingText('settings.fps')));
        const _0x123ffa = document.createElement('span');
        ((_0x123ffa.className = 'rh-tip rh-keying-tip-fps'),
          _0x123ffa.setAttribute('data-tooltip', videoKeyingText('settings.fpsTip')),
          (_0x123ffa.textContent = '!'),
          _0x274972.appendChild(_0x4f11e4),
          _0x274972.appendChild(_0x123ffa));
        const _0x17631d = document.createElement('div');
        ((_0x17631d.className = 'img-rp-quality-segmented rh-adv-seg rh-v5-fps-seg'),
          getRhKeyingFpsOptions().forEach((_0x32c9f8) => {
            const _0x183a91 = document.createElement('button');
            ((_0x183a91.type = 'button'),
              (_0x183a91.className = (
                'img-rp-quality-item rh-keying-fps-btn ' +
                (Number(_0x553736) === Number(_0x32c9f8) ? 'active' : '')
              ).trim()),
              (_0x183a91.dataset.value = String(_0x32c9f8)),
              (_0x183a91.textContent = videoKeyingText('settings.fpsValue', { fps: _0x32c9f8 })),
              _0x17631d.appendChild(_0x183a91));
          }),
          _0x14562e.appendChild(_0x274972),
          _0x14562e.appendChild(_0x17631d),
          _0x1317b9.appendChild(_0x14562e));
      }
      if (!this._isRemoveUiMode()) {
        const _0x49ccc0 = document.createElement('div');
        _0x49ccc0.className = 'rh-vram-adv-row';
        const _0x58f4ab = document.createElement('div');
        _0x58f4ab.className = 'rh-vram-adv-label';
        const _0x4a7ca8 = document.createElement('span');
        ((_0x4a7ca8.className = 'rh-keying-label-mask-mode'),
          (_0x4a7ca8.textContent = videoKeyingText('settings.maskMode')));
        const _0x34f835 = document.createElement('span');
        ((_0x34f835.className = 'rh-tip rh-keying-tip-mask-mode'),
          _0x34f835.setAttribute('data-tooltip', videoKeyingText('settings.maskModeTip')),
          (_0x34f835.textContent = '!'),
          _0x58f4ab.appendChild(_0x4a7ca8),
          _0x58f4ab.appendChild(_0x34f835));
        const _0x5a3349 = document.createElement('div');
        ((_0x5a3349.className = 'img-rp-quality-segmented rh-adv-seg rh-keying-maskmode-seg'),
          [
            ['Sec', 'Sec'],
            ['Sam3', 'Sam3'],
            ['MA2', 'MA2'],
          ].forEach(([_0x75bc3c, _0xe8b986]) => {
            const _0x18fc50 = document.createElement('button');
            ((_0x18fc50.type = 'button'),
              (_0x18fc50.className = (
                'img-rp-quality-item rh-keying-maskmode-btn ' + (_0x11e5eb === _0x75bc3c ? 'active' : '')
              ).trim()),
              (_0x18fc50.dataset.value = _0x75bc3c),
              (_0x18fc50.textContent = _0xe8b986),
              _0x5a3349.appendChild(_0x18fc50));
          }),
          _0x49ccc0.appendChild(_0x58f4ab),
          _0x49ccc0.appendChild(_0x5a3349),
          _0x1317b9.appendChild(_0x49ccc0));
      }
      {
        const _0xc46a6a = document.createElement('div');
        _0xc46a6a.className = 'rh-vram-adv-row';
        const _0x188db3 = document.createElement('div');
        _0x188db3.className = 'rh-vram-adv-label';
        const _0x4f9172 = document.createElement('span');
        ((_0x4f9172.className = 'rh-keying-label-vram'),
          (_0x4f9172.textContent = videoKeyingText('settings.vram')));
        const _0x348193 = document.createElement('span');
        ((_0x348193.className = 'rh-tip rh-keying-tip-vram'),
          _0x348193.setAttribute('data-tooltip', videoKeyingText('settings.vramTip')),
          (_0x348193.textContent = '!'),
          _0x188db3.appendChild(_0x4f9172),
          _0x188db3.appendChild(_0x348193));
        const _0x357b11 = document.createElement('div');
        ((_0x357b11.className = 'img-rp-quality-segmented rh-adv-seg rh-keying-vram-seg'),
          [
            ['default', '24G'],
            ['plus', '48G'],
          ].forEach(([_0xdada66, _0x53f2d6]) => {
            const _0x137404 = document.createElement('button');
            ((_0x137404.type = 'button'),
              (_0x137404.className = (
                'img-rp-quality-item rh-keying-vram-btn ' + (_0x315659 === _0xdada66 ? 'active' : '')
              ).trim()),
              (_0x137404.dataset.value = _0xdada66),
              (_0x137404.textContent = _0x53f2d6),
              _0x357b11.appendChild(_0x137404));
          }),
          _0xc46a6a.appendChild(_0x188db3),
          _0xc46a6a.appendChild(_0x357b11),
          _0x1317b9.appendChild(_0xc46a6a));
      }
      (_0xd9e1f7.appendChild(_0xcbad62), _0xd9e1f7.appendChild(_0x1317b9));
      const _0x1aa8b0 = document.createElement('button');
      ((_0x1aa8b0.type = 'button'),
        (_0x1aa8b0.className = 'v2-video-clipbtn cancel debug-wrench-btn rh-keying-debug-btn'),
        (_0x1aa8b0.title = videoKeyingText('settings.debugParams')),
        applyDebugWrenchIcon(_0x1aa8b0));
      const _0x3752fb = document.createElement('div');
      _0x3752fb.className = 'v2-video-keyingrow';
      const _0x3e4109 = document.createElement('div');
      _0x3e4109.className = 'v2-video-keyingtrack';
      const _0x48adce = document.createElement('div');
      _0x48adce.className = 'v2-video-keyingticks';
      const _0x29b2ba = document.createElement('div');
      _0x29b2ba.className = 'v2-video-keyingthumbs';
      const _0x45299b = [];
      for (let _0x3bdb77 = 0; _0x3bdb77 < 10; _0x3bdb77++) {
        const _0x37656e = document.createElement('div');
        ((_0x37656e.className = 'v2-video-keyingthumb'),
          _0x29b2ba.appendChild(_0x37656e),
          _0x45299b.push(_0x37656e));
      }
      const _0x448dd6 = document.createElement('div');
      ((_0x448dd6.className = 'v2-video-keyingplayhead'),
        _0x3e4109.appendChild(_0x29b2ba),
        _0x3e4109.appendChild(_0x448dd6),
        _0x3e4109.appendChild(_0x48adce));
      const _0x5f35da = this._isRemoveUiMode();
      (_0x3752fb.appendChild(_0x153a29), _0x3752fb.appendChild(_0x3e4109));
      if (_0xd9e1f7) _0x3752fb.appendChild(_0xd9e1f7);
      if (_0x1aa8b0) _0x3752fb.appendChild(_0x1aa8b0);
      _0x3752fb.appendChild(_0x167f92);
      const _0x42f635 = document.createElement('div');
      _0x42f635.className = 'v2-video-keyinghelper-row';
      const _0xdc10f = document.createElement('div');
      ((_0xdc10f.className = 'v2-video-keyinghelper-right'), _0x42f635.appendChild(_0xdc10f));
      let _0x226109 = null,
        _0x22adc9 = null;
      if (_0x5f35da) _0x22adc9 = this._createRemoveToolbar();
      else {
        ((_0x226109 = document.createElement('div')), (_0x226109.className = 'v2-video-keyinghint'));
        const _0x184063 = (_0x127ad0, _0x2e00e2) => {
          const _0x17af45 = document.createElement('span');
          if (_0x2e00e2) _0x17af45.className = _0x2e00e2;
          return ((_0x17af45.textContent = _0x127ad0), _0x17af45);
        };
        (_0x226109.appendChild(_0x184063(videoKeyingText('hint.leftClick'))),
          _0x226109.appendChild(_0x184063(videoKeyingText('hint.selectTarget'), 'v2-video-keyinghint--pos')),
          _0x226109.appendChild(_0x184063('  ')),
          _0x226109.appendChild(_0x184063(videoKeyingText('hint.rightClick'))),
          _0x226109.appendChild(_0x184063(videoKeyingText('hint.excludeTarget'), 'v2-video-keyinghint--neg')),
          _0x226109.appendChild(_0x184063(videoKeyingText('hint.shortcutPrefix'))),
          _0x226109.appendChild(
            _0x184063(this._getShortcutText('editor-clear', 'R'), 'v2-video-keyinghint-kbd'),
          ),
          _0x226109.appendChild(_0x184063(videoKeyingText('hint.clearAllPoints'))),
          _0x226109.appendChild(_0x184063('  ')),
          _0x226109.appendChild(
            _0x184063(this._getShortcutText('undo', 'Ctrl+Z'), 'v2-video-keyinghint-kbd'),
          ),
          _0x226109.appendChild(_0x184063(videoKeyingText('tools.undo'))),
          _0x226109.appendChild(_0x184063('  ')),
          _0x226109.appendChild(
            _0x184063(this._getShortcutText('redo', 'Ctrl+Shift+Z'), 'v2-video-keyinghint-kbd'),
          ),
          _0x226109.appendChild(_0x184063(videoKeyingText('tools.redo'))));
      }
      (_0x2c489e.appendChild(_0x3752fb),
        _0x2c489e.appendChild(_0x42f635),
        _0x22adc9 && this.wrapperEl.appendChild(_0x22adc9),
        this.wrapperEl.appendChild(_0x2c489e),
        _0x226109 && this.wrapperEl.appendChild(_0x226109),
        (this.barEl = _0x2c489e),
        (this.hintEl = _0x226109),
        (this.removeToolbarEl = _0x22adc9),
        this._setRemovePointTool(this._removePointTool),
        (this.cancelBtnEl = _0x153a29),
        (this.confirmBtnEl = _0x167f92),
        (this.trackEl = _0x3e4109),
        (this.playheadEl = _0x448dd6),
        (this.thumbEls = _0x45299b),
        (this.helperRightEl = _0xdc10f),
        this._syncLocaleTexts(),
        this._updateHelperRight(),
        this._updateConfirmEnabled());
    },
    _syncLocaleTexts() {
      if (this.cancelBtnEl) this.cancelBtnEl.title = videoKeyingText('tools.cancel');
      this.confirmBtnEl &&
        (this.confirmBtnEl.title = this._isRemoveUiMode()
          ? videoKeyingText('tools.remove')
          : videoKeyingText('tools.keying'));
      (this.barEl?.querySelectorAll('.rh-keying-settings-btn').forEach((_0x2f463f) => {
        _0x2f463f.title = videoKeyingText('tools.settings');
      }),
        this.barEl?.querySelectorAll('.rh-keying-debug-btn').forEach((_0x30c73c) => {
          _0x30c73c.title = videoKeyingText('settings.debugParams');
        }));
      const _0x16d405 = (_0xd4b1, _0x16336e) => {
          this.barEl?.querySelectorAll(_0xd4b1).forEach((_0x1466a2) => {
            _0x1466a2.textContent = _0x16336e;
          });
        },
        _0x30acfe = (_0x5be526, _0x452851) => {
          this.barEl?.querySelectorAll(_0x5be526).forEach((_0x4ef2d5) => {
            (_0x4ef2d5.setAttribute('data-tooltip', _0x452851), (_0x4ef2d5.title = _0x452851));
          });
        };
      (_0x16d405('.rh-keying-settings-title', videoKeyingText('settings.title')),
        _0x16d405('.rh-keying-label-resolution', videoKeyingText('settings.resolution')),
        _0x30acfe('.rh-keying-tip-resolution', videoKeyingText('settings.resolutionTip')),
        _0x16d405('.rh-keying-label-fps', videoKeyingText('settings.fps')),
        _0x30acfe('.rh-keying-tip-fps', videoKeyingText('settings.fpsTip')),
        _0x16d405('.rh-keying-label-mask-mode', videoKeyingText('settings.maskMode')),
        _0x30acfe('.rh-keying-tip-mask-mode', videoKeyingText('settings.maskModeTip')),
        _0x16d405('.rh-keying-label-vram', videoKeyingText('settings.vram')),
        _0x30acfe('.rh-keying-tip-vram', videoKeyingText('settings.vramTip')),
        this.barEl?.querySelectorAll('.rh-keying-fps-btn').forEach((_0x57debf) => {
          _0x57debf.textContent = videoKeyingText('settings.fpsValue', { fps: _0x57debf.dataset.value });
        }),
        this._refreshRemoveShortcutUi(),
        this._refreshKeyingHintUi(),
        (this._lastHelperRightText = null),
        this._updateHelperRight());
    },
    _ensureMarkLayer() {
      if (!this.wrapperEl) return;
      const _0x5b587e = this.videoEl || this._getVideoEl();
      if (!_0x5b587e) return;
      const _0x50a2c4 = _0x5b587e.closest('.node-card') || _0x5b587e.parentElement || null;
      if (!_0x50a2c4) return;
      this._detachMarkLayerListeners(this.markLayerEl);
      if (this.markLayerEl && this.markLayerEl.isConnected) this.markLayerEl.remove();
      this.wrapperEl
        .querySelectorAll('.v2-video-keying-marklayer')
        .forEach((_0x4face3) => _0x4face3.remove());
      const _0x37e996 = document.createElement('div');
      _0x37e996.className = 'v2-video-keying-marklayer';
      if (this._isRemoveUiMode()) _0x37e996.classList.add('is-remove-mode');
      (_0x37e996.addEventListener('pointerdown', (_0x4f6ef9) => {
        (_0x4f6ef9.preventDefault(), _0x4f6ef9.stopPropagation());
      }),
        _0x37e996.addEventListener('click', (_0x397d36) => {
          (_0x397d36.preventDefault(), _0x397d36.stopPropagation());
        }),
        _0x37e996.addEventListener('dblclick', (_0x188c5a) => {
          (_0x188c5a.preventDefault(), _0x188c5a.stopPropagation());
        }),
        _0x37e996.addEventListener('contextmenu', (_0x490432) => {
          (_0x490432.preventDefault(), _0x490432.stopPropagation());
        }));
      if (this._isRemoveUiMode()) {
        const _0x48761f = document.createElement('canvas');
        ((_0x48761f.className = 'v2-video-keying-paintcanvas'),
          _0x37e996.appendChild(_0x48761f),
          (this.markCanvasEl = _0x48761f),
          (this.removeMaskCanvasEl = document.createElement('canvas')));
        const _0x3063c0 = document.createElement('div');
        ((_0x3063c0.className = 'v2-annotate-cursor v2-video-keying-cursor'),
          (_0x3063c0.style.display = 'none'),
          _0x37e996.appendChild(_0x3063c0),
          (this.removeCursorEl = _0x3063c0),
          (this._removeCursorHover = false));
      } else
        ((this.markCanvasEl = null),
          (this.removeMaskCanvasEl = null),
          (this.removeCursorEl = null),
          (this._removeCursorHover = false));
      (_0x50a2c4.appendChild(_0x37e996), (this.markLayerEl = _0x37e996), this._attachMarkLayerListeners());
      this._isRemoveUiMode()
        ? ((this._onMarkWheel = (_0x3575c2) => this._onRemoveCanvasWheel(_0x3575c2)),
          _0x37e996.addEventListener('wheel', this._onMarkWheel, { passive: false }),
          (this._removeWheelCleanup = () => {
            this._onMarkWheel && _0x37e996.removeEventListener('wheel', this._onMarkWheel);
          }))
        : ((this._removeWheelCleanup = null), (this._onMarkWheel = null));
      this._syncRemoveCursor();
      if (!Array.isArray(this._marks)) this._marks = [];
    },
    _bindEvents() {
      if (!this.barEl) return;
      (this.cancelBtnEl?.addEventListener('click', (_0xab752) => {
        (_0xab752.stopPropagation(), this.exit());
      }),
        this.confirmBtnEl?.addEventListener('click', async (_0x4d39ae) => {
          (_0x4d39ae.preventDefault(), _0x4d39ae.stopPropagation());
          if (!this.active || !this.nodeId) return;
          const _0x337603 = this.nodeId,
            _0x4ec810 = this._rhTasks.get(_0x337603);
          if (_0x4ec810 && _0x4ec810.running) {
            await this._cancelRhTaskForSourceNode(_0x337603, { notify: true });
            return;
          }
          const _0xd4ccdc = appStore.getState().nodes?.[this.nodeId] || {},
            _0x4c3c23 = this.videoEl || this._getVideoEl(),
            _0x2ca41b = Number(_0x4c3c23?.videoWidth) || 0,
            _0x4a0cd8 = Number(_0x4c3c23?.videoHeight) || 0,
            _0x59940e = Number(_0x4c3c23?.currentTime) || 0,
            {
              fps: _0x1fe365,
              resolution: _0x1733d2,
              instanceType: _0x104153,
            } = this._getRhVideoSettings(_0xd4ccdc),
            _0x11d948 = this._getRhMaskMode(_0xd4ccdc),
            _0x3da1e4 = this._getSourceFrameCount(_0xd4ccdc, _0x1fe365),
            { pos_points: _0x39bf78, neg_points: _0x20e823 } = this.getPosNegPoints(),
            { w: _0x233aa4, h: _0x570bd0 } = this._calcKeyingFrameSize(_0x2ca41b, _0x4a0cd8, _0x1733d2),
            _0x84aa24 = (_0x40272b, _0x444993, _0x3820e8) =>
              Math.max(_0x444993, Math.min(_0x3820e8, _0x40272b)),
            _0x4d90e6 = (_0x590f24) => ({
              x: Math.round(_0x84aa24(_0x590f24.x * _0x233aa4, 0, Math.max(0, _0x233aa4 - 1))),
              y: Math.round(_0x84aa24(_0x590f24.y * _0x570bd0, 0, Math.max(0, _0x570bd0 - 1))),
            }),
            _0x17cc48 = _0x233aa4 > 0 && _0x570bd0 > 0 ? _0x39bf78.map(_0x4d90e6) : [],
            _0x4b204a = _0x233aa4 > 0 && _0x570bd0 > 0 ? _0x20e823.map(_0x4d90e6) : [],
            _0x911364 = _0x17cc48.length ? JSON.stringify(_0x17cc48) : '',
            _0xf04058 = _0x4b204a.length ? JSON.stringify(_0x4b204a) : '',
            _0x4cba56 = _0x911364,
            _0x27a32d = _0xf04058,
            _0x2cf4de = Math.max(0, Math.round(_0x59940e * _0x1fe365));
          try {
            const _0x5e392c = {
              frame_index: _0x2cf4de,
              rhVideoFps: _0x1fe365,
              rhVideoFrames: _0x3da1e4,
              rhVideoResolution: _0x1733d2,
              rhInstanceType: _0x104153,
            };
            (!this._isRemoveUiMode() &&
              ((_0x5e392c.positive = _0x911364),
              (_0x5e392c.negative = _0xf04058),
              (_0x5e392c.pos_points = _0x4cba56),
              (_0x5e392c.neg_points = _0x27a32d)),
              appStore.updateNodeData(this.nodeId, _0x5e392c));
          } catch {}
          const _0x1fcde8 = this._resolveSourceVideoValue(_0xd4ccdc);
          if (!_0x1fcde8) {
            window.showToast?.(videoKeyingText('toasts.connectSourceVideoFirst'), 'warn');
            return;
          }
          let _0x4ccdb8 = '';
          try {
            _0x4ccdb8 = await getRunningHubWorkflowApiKey();
          } catch (_0x117ec5) {
            window.showToast?.(videoKeyingText('toasts.configReadFailed'), 'error');
            return;
          }
          if (!_0x4ccdb8) {
            window.showToast?.(videoKeyingText('toasts.apiKeyMissing'), 'warn');
            return;
          }
          if (this._isRemoveUiMode()) {
            let _0x5cd1c3 = '';
            try {
              _0x5cd1c3 = this._exportRemoveMaskDataUrl(_0x1733d2);
            } catch (_0x356de5) {
              window.showToast?.(_0x356de5?.message || videoKeyingText('errors.removeMaskFailed'), 'error');
              return;
            }
            const _0xdfe71f = _0xd4ccdc,
              { width: _0x4a533e, height: _0x124089 } = getAutoMediaSizeByShortSide(
                _0xdfe71f.width || 0x200,
                _0xdfe71f.height || 0x120,
              ),
              _0x38c3ae = calcSafeSpawnPosNearNode(
                appStore.getState().nodes,
                _0xdfe71f,
                _0x4a533e,
                _0x124089,
              ),
              _0x51cdc1 = generateId('source-video-erase'),
              _0xfb4a3e = Date.now();
            (appStore.addNode(
              buildSourceMediaNodePayload({
                id: _0x51cdc1,
                type: 'source-video',
                x: _0x38c3ae.x,
                y: _0x38c3ae.y,
                width: _0x4a533e,
                height: _0x124089,
                name: videoKeyingText('output.removeGeneratingName'),
                src: '',
                localPath: '',
                ...buildGenerationStartPatch({ startedAt: _0xfb4a3e }),
                provider: 'runninghubwf',
                model: getVideoKeyingModelId(),
                rhTaskId: '',
                rhTaskStatus: 'pending',
                rhTaskStartedAt: _0xfb4a3e,
                rhTaskRecovering: false,
                rhTaskUseOpenapiQuery: false,
                rhSourceNodeId: _0x337603,
                rhToolbarTaskType: 'video-remove',
                fixedSize: true,
                outputText: buildVideoKeyingOutputText('remove', 'processing'),
              }),
            ),
              appStore.setSelectedNodes([_0x51cdc1]));
            typeof window.v2FocusOnNodes === 'function'
              ? window.v2FocusOnNodes([_0x337603, _0x51cdc1])
              : window.v2FocusOnNode?.(_0x51cdc1);
            const _0x8d7dcb = new AbortController(),
              _0xde4efb = Date.now() + '_' + Math.random().toString(36).slice(2),
              _0x34c5ac = {
                id: _0xde4efb,
                running: true,
                abort: _0x8d7dcb,
                taskId: '',
                sourceNodeId: _0x337603,
                outId: _0x51cdc1,
                apiKey: _0x4ccdb8,
                mode: 'remove',
              };
            (this._rhTasks.set(_0x337603, _0x34c5ac),
              this._notifyRhTaskChange(_0x34c5ac),
              this.exit({ silent: true, preserveRh: true }));
            try {
              const _0x2668a9 = await this._submitRhVideoMattingRuntimeTask({
                sourceNodeId: _0x337603,
                outId: _0x51cdc1,
                ctxId: _0xde4efb,
                controller: _0x8d7dcb,
                startTime: _0xfb4a3e,
                taskType: 'video-remove',
                executionId: getVideoKeyingExecutionId('remove'),
                successName: videoKeyingText('output.removeResultName'),
                payload: {
                  provider: 'runninghubwf',
                  model: getVideoKeyingModelId(),
                  apiKey: _0x4ccdb8,
                  videoUrl: _0x1fcde8,
                  maskImageDataUrl: _0x5cd1c3,
                  sourceFrameCount: _0x3da1e4,
                  rhVideoFps: _0x1fe365,
                  rhVideoResolution: _0x1733d2,
                  rhInstanceType: _0x104153,
                },
              });
              if (!_0x2668a9.ok) throw _0x2668a9.error || new Error(videoKeyingText('errors.removeFailed'));
              (window._triggerLocalCacheSave?.(),
                window.showToast?.(videoKeyingText('toasts.removeSuccess'), 'success'));
            } catch (_0x2f01d9) {
              if (_0x8d7dcb?.signal?.aborted) {
                const _0x53a406 = this._computeGenerationDuration(_0x51cdc1);
                appStore.updateNodeData(_0x51cdc1, {
                  ...buildGenerationCancelledPatch({ startedAt: _0xfb4a3e, duration: _0x53a406 }),
                  name: videoKeyingText('output.removeResultName'),
                  rhTaskStatus: 'cancelled',
                  rhTaskRecovering: false,
                  outputText: buildVideoKeyingOutputText('remove', 'cancelled'),
                });
                return;
              }
              const _0x52eecc =
                  typeof _0x2f01d9?.getUserMessage === 'function'
                    ? _0x2f01d9.getUserMessage()
                    : _0x2f01d9 instanceof Error
                      ? _0x2f01d9.message
                      : String(_0x2f01d9 || videoKeyingText('errors.removeFailed')),
                _0x27a324 = this._computeGenerationDuration(_0x51cdc1);
              (appStore.updateNodeData(_0x51cdc1, {
                ...buildVideoGenerationFailurePatch({
                  error: _0x52eecc,
                  startedAt: _0xfb4a3e,
                  duration: _0x27a324,
                }),
                name: videoKeyingText('output.removeFailedName'),
                isGenerating: false,
                rhTaskStatus: 'failed',
                rhTaskRecovering: false,
                outputText: buildVideoKeyingOutputText('remove', 'failed', { reason: _0x52eecc }),
              }),
                window.showToast?.(videoKeyingText('toasts.removeFailed', { error: _0x52eecc }), 'error'));
            } finally {
              const _0x5e793b = this._rhTasks.get(_0x337603);
              _0x5e793b &&
                _0x5e793b.id === _0xde4efb &&
                (this._rhTasks.delete(_0x337603), this._notifyRhTaskChange(_0x5e793b));
            }
            return;
          }
          const _0x3f3cd7 = _0xd4ccdc,
            { width: _0x858e04, height: _0x76f841 } = getAutoMediaSizeByShortSide(
              _0x3f3cd7.width || 0x200,
              _0x3f3cd7.height || 0x120,
            ),
            _0x3f51bb = calcSafeSpawnPosNearNode(appStore.getState().nodes, _0x3f3cd7, _0x858e04, _0x76f841),
            _0x188644 = generateId('source-video-matting'),
            _0x5daf5d = Date.now();
          (appStore.addNode(
            buildSourceMediaNodePayload({
              id: _0x188644,
              type: 'source-video',
              x: _0x3f51bb.x,
              y: _0x3f51bb.y,
              width: _0x858e04,
              height: _0x76f841,
              name: videoKeyingText('output.keyingResultName', {
                name: _0x3f3cd7.name || videoKeyingText('output.videoFallback'),
              }),
              src: '',
              localPath: '',
              ...buildGenerationStartPatch({ startedAt: _0x5daf5d }),
              provider: 'runninghubwf',
              model: getVideoKeyingModelId(),
              rhTaskId: '',
              rhTaskStatus: 'pending',
              rhTaskStartedAt: _0x5daf5d,
              rhTaskRecovering: false,
              rhTaskUseOpenapiQuery: false,
              rhSourceNodeId: _0x337603,
              rhToolbarTaskType: 'video-keying',
              fixedSize: true,
              outputText: buildVideoKeyingOutputText('keying', 'processing'),
            }),
          ),
            appStore.setSelectedNodes([_0x188644]),
            commit(),
            window.v2FocusOnNodes?.([this.nodeId, _0x188644]));
          const _0x40eb4c = new AbortController(),
            _0x1847a7 = Date.now() + '_' + Math.random().toString(36).slice(2),
            _0x2e3de9 = {
              id: _0x1847a7,
              running: true,
              abort: _0x40eb4c,
              taskId: '',
              sourceNodeId: _0x337603,
              outId: _0x188644,
              apiKey: _0x4ccdb8,
              mode: 'keying',
            };
          (this._rhTasks.set(_0x337603, _0x2e3de9),
            this._notifyRhTaskChange(_0x2e3de9),
            window.showToast?.(videoKeyingText('toasts.keyingSubmitting'), 'info'),
            this.exit({ silent: true, preserveRh: true }));
          try {
            const _0x5369a0 = await this._submitRhVideoMattingRuntimeTask({
              sourceNodeId: _0x337603,
              outId: _0x188644,
              ctxId: _0x1847a7,
              controller: _0x40eb4c,
              startTime: _0x5daf5d,
              taskType: 'video-keying',
              executionId: getVideoKeyingExecutionId('keying'),
              payload: {
                provider: 'runninghubwf',
                model: getVideoKeyingModelId(),
                apiKey: _0x4ccdb8,
                videoUrl: _0x1fcde8,
                pos_points: _0x4cba56,
                neg_points: _0x27a32d,
                frame_index: _0x2cf4de,
                timeSec: _0x59940e,
                frameRate: _0x1fe365,
                frameCount: _0x3da1e4,
                rhVideoFps: _0x1fe365,
                rhVideoFrames: _0x3da1e4,
                rhVideoResolution: _0x1733d2,
                rhInstanceType: _0x104153,
                rhMaskMode: _0x11d948,
              },
            });
            if (!_0x5369a0.ok) throw _0x5369a0.error || new Error(videoKeyingText('errors.keyingFailed'));
            (window._triggerLocalCacheSave?.(),
              window.showToast?.(videoKeyingText('toasts.keyingSuccess'), 'success'));
          } catch (_0x75af50) {
            if (_0x40eb4c?.signal?.aborted) {
              try {
                const _0x2a022d = appStore.getState().nodes?.[_0x188644];
                if (_0x2a022d) {
                  const _0x2301ed = String(_0x2a022d.outputText || '');
                  if (!isVideoKeyingCancelledOutputText(_0x2301ed)) {
                    const _0x3b2771 = this._computeGenerationDuration(_0x188644);
                    appStore.updateNodeData(_0x188644, {
                      ...buildGenerationCancelledPatch({ startedAt: _0x5daf5d, duration: _0x3b2771 }),
                      rhTaskStatus: 'cancelled',
                      rhTaskRecovering: false,
                      outputText: buildVideoKeyingOutputText('keying', 'cancelled'),
                    });
                  }
                }
              } catch {}
              return;
            }
            const _0x4a671c =
                typeof _0x75af50?.getUserMessage === 'function'
                  ? _0x75af50.getUserMessage()
                  : _0x75af50 instanceof Error
                    ? _0x75af50.message
                    : String(_0x75af50 || videoKeyingText('errors.keyingFailed')),
              _0x3eb7d6 = this._computeGenerationDuration(_0x188644);
            (appStore.updateNodeData(_0x188644, {
              ...buildVideoGenerationFailurePatch({
                error: _0x4a671c,
                startedAt: _0x5daf5d,
                duration: _0x3eb7d6,
              }),
              isGenerating: false,
              rhTaskStatus: 'failed',
              rhTaskRecovering: false,
              outputText: buildVideoKeyingOutputText('keying', 'failed', { reason: _0x4a671c }),
            }),
              window.showToast?.(videoKeyingText('toasts.keyingFailed', { error: _0x4a671c }), 'error'));
          } finally {
            const _0x2207e3 = this._rhTasks.get(_0x337603);
            _0x2207e3 &&
              _0x2207e3.id === _0x1847a7 &&
              (this._rhTasks.delete(_0x337603), this._notifyRhTaskChange(_0x2207e3));
          }
        }));
      const _0x378632 = this.barEl.querySelector('.rh-keying-settings-wrap'),
        _0x4c5004 = this.barEl.querySelector('.rh-keying-settings-btn'),
        _0x242bd6 = this.barEl.querySelector('.rh-keying-settings-menu');
      if (_0x378632 && _0x4c5004 && _0x242bd6) {
        const _0x2f7fc0 = () => {
          const _0xf186f4 = appStore.getState().nodes?.[this.nodeId] || {},
            {
              fps: _0x31f7f7,
              resolution: _0x36e600,
              instanceType: _0x69ad3f,
            } = this._getRhVideoSettings(_0xf186f4),
            _0x510eaf = this._getRhMaskMode(_0xf186f4);
          (_0x242bd6
            .querySelectorAll('.rh-keying-res-btn')
            .forEach((_0x9115e) =>
              _0x9115e.classList.toggle('active', Number(_0x9115e.dataset.value) === _0x36e600),
            ),
            _0x242bd6
              .querySelectorAll('.rh-keying-fps-btn')
              .forEach((_0x50c0ca) =>
                _0x50c0ca.classList.toggle('active', Number(_0x50c0ca.dataset.value) === _0x31f7f7),
              ),
            _0x242bd6
              .querySelectorAll('.rh-keying-maskmode-btn')
              .forEach((_0x307894) =>
                _0x307894.classList.toggle('active', _0x307894.dataset.value === _0x510eaf),
              ),
            _0x242bd6
              .querySelectorAll('.rh-keying-vram-btn')
              .forEach((_0x27a3a7) =>
                _0x27a3a7.classList.toggle('active', _0x27a3a7.dataset.value === _0x69ad3f),
              ));
        };
        (_0x378632.addEventListener('click', (_0x15e8c8) => _0x15e8c8.stopPropagation()),
          _0x242bd6.addEventListener('click', (_0x22696c) => _0x22696c.stopPropagation()),
          _0x4c5004.addEventListener('click', (_0xe8404f) => {
            (_0xe8404f.preventDefault(), _0xe8404f.stopPropagation());
            const _0x42112f = () => {
                (_0x378632.classList.remove('show'),
                  this._onKeyingSettingsDocDown &&
                    (document.removeEventListener('pointerdown', this._onKeyingSettingsDocDown, true),
                    (this._onKeyingSettingsDocDown = null)));
              },
              _0x4a850f = !_0x378632.classList.contains('show');
            if (!_0x4a850f) {
              _0x42112f();
              return;
            }
            (_0x378632.classList.add('show'),
              _0x2f7fc0(),
              !this._onKeyingSettingsDocDown &&
                ((this._onKeyingSettingsDocDown = (_0x31d3c2) => {
                  if (_0x378632.contains(_0x31d3c2.target)) return;
                  _0x42112f();
                }),
                document.addEventListener('pointerdown', this._onKeyingSettingsDocDown, true)));
          }),
          _0x242bd6.querySelectorAll('.rh-keying-fps-btn').forEach((_0x20cebe) => {
            _0x20cebe.addEventListener('click', (_0xe4a399) => {
              (_0xe4a399.preventDefault(), _0xe4a399.stopPropagation());
              const _0x517775 = Number(_0x20cebe.dataset.value),
                _0x1d4009 = normalizeRhKeyingFps(_0x517775);
              try {
                const _0x4e5313 = Math.max(1, Math.round((Number(this.durationSec) || 0) * _0x1d4009) || 1),
                  _0x3bad0f = this.videoEl || this._getVideoEl(),
                  _0x64184d = Math.max(
                    0,
                    Math.min(Number(this.durationSec) || 0, Number(_0x3bad0f?.currentTime) || 0),
                  ),
                  _0x454461 = Math.max(0, Math.round(_0x64184d * _0x1d4009));
                appStore.updateNodeData(this.nodeId, {
                  rhVideoFps: _0x1d4009,
                  rhVideoFrames: _0x4e5313,
                  frame_index: _0x454461,
                });
              } catch {}
              (_0x2f7fc0(), this._updateHelperRight());
            });
          }),
          _0x242bd6.querySelectorAll('.rh-keying-maskmode-btn').forEach((_0x2c9edc) => {
            _0x2c9edc.addEventListener('click', (_0x42e99a) => {
              (_0x42e99a.preventDefault(), _0x42e99a.stopPropagation());
              const _0xb21e72 = this._normalizeRhMaskMode(_0x2c9edc.dataset.value);
              try {
                appStore.updateNodeData(this.nodeId, { rhMaskMode: _0xb21e72 });
              } catch {}
              _0x2f7fc0();
            });
          }),
          _0x242bd6.querySelectorAll('.rh-keying-res-btn').forEach((_0xcbc67c) => {
            _0xcbc67c.addEventListener('click', (_0x2efb48) => {
              (_0x2efb48.preventDefault(), _0x2efb48.stopPropagation());
              const _0x49618c = Math.trunc(Number(_0xcbc67c.dataset.value)),
                _0x385e1d = [0x340, 0x400, 0x500, 0x5a0, 0x640, 0x6e0, 0x780].includes(_0x49618c)
                  ? _0x49618c
                  : 0x400;
              try {
                appStore.updateNodeData(this.nodeId, { rhVideoResolution: _0x385e1d });
              } catch {}
              (_0x2f7fc0(), this._updateHelperRight());
            });
          }),
          _0x242bd6.querySelectorAll('.rh-keying-vram-btn').forEach((_0x8100da) => {
            _0x8100da.addEventListener('click', (_0x133e42) => {
              (_0x133e42.preventDefault(), _0x133e42.stopPropagation());
              const _0x5aaef8 = _0x8100da.dataset.value === 'plus' ? 'plus' : 'default';
              try {
                appStore.updateNodeData(this.nodeId, { rhInstanceType: _0x5aaef8 });
              } catch {}
              _0x2f7fc0();
            });
          }));
      }
      const _0x45da4a = this.barEl.querySelector('.rh-keying-debug-btn');
      _0x45da4a &&
        _0x45da4a.addEventListener('click', async (_0x3677dd) => {
          (_0x3677dd.preventDefault(), _0x3677dd.stopPropagation());
          const _0x395ee9 = appStore.getState().nodes?.[this.nodeId] || {},
            _0x24dc9b = this.videoEl || this._getVideoEl(),
            _0x1d1a2c = Number(_0x24dc9b?.currentTime) || 0,
            _0x447f31 = Number(_0x24dc9b?.videoWidth) || 0,
            _0x1c7b90 = Number(_0x24dc9b?.videoHeight) || 0,
            {
              fps: _0x18fb45,
              resolution: _0x5e11ff,
              instanceType: _0x2c4afe,
            } = this._getRhVideoSettings(_0x395ee9),
            _0x469482 = this._getRhMaskMode(_0x395ee9),
            _0x1e1196 = this._getSourceFrameCount(_0x395ee9, _0x18fb45),
            _0x4ec35a = this._resolveSourceVideoValue(_0x395ee9),
            { pos_points: _0x6ffd5a, neg_points: _0x39ad92 } = this.getPosNegPoints(),
            { w: _0xeb80bc, h: _0x2a0c90 } = this._calcKeyingFrameSize(_0x447f31, _0x1c7b90, _0x5e11ff),
            _0x3cc8bf = (_0x320d52, _0x1aeedb, _0x3b4796) =>
              Math.max(_0x1aeedb, Math.min(_0x3b4796, _0x320d52)),
            _0x51d30e = (_0x26da61) => ({
              x: Math.round(_0x3cc8bf(_0x26da61.x * _0xeb80bc, 0, Math.max(0, _0xeb80bc - 1))),
              y: Math.round(_0x3cc8bf(_0x26da61.y * _0x2a0c90, 0, Math.max(0, _0x2a0c90 - 1))),
            }),
            _0x469770 = _0xeb80bc > 0 && _0x2a0c90 > 0 ? _0x6ffd5a.map(_0x51d30e) : [],
            _0x5074be = _0xeb80bc > 0 && _0x2a0c90 > 0 ? _0x39ad92.map(_0x51d30e) : [],
            _0x3524ce = _0x469770.length ? JSON.stringify(_0x469770) : '',
            _0x13e461 = _0x5074be.length ? JSON.stringify(_0x5074be) : '';
          let _0x5e5b14 = '';
          try {
            _0x5e5b14 = await getRunningHubWorkflowApiKey();
          } catch {
            window.showToast?.(videoKeyingText('toasts.configReadFailed'), 'error');
            return;
          }
          let _0xe094d0 = null;
          if (this._isRemoveUiMode()) {
            let _0xeaa600 = '';
            try {
              _0xeaa600 = this._exportRemoveMaskDataUrl(_0x5e11ff);
            } catch (_0x2eba6a) {
              window.showToast?.(
                videoKeyingText('toasts.debugBuildFailed', {
                  error: _0x2eba6a?.message || videoKeyingText('errors.maskExportFailed'),
                }),
                'error',
              );
              return;
            }
            _0xe094d0 = {
              provider: 'runninghubwf',
              model: getVideoKeyingModelId(),
              apiKey: _0x5e5b14,
              videoUrl: _0x4ec35a,
              maskImageDataUrl: _0xeaa600,
              sourceFrameCount: _0x1e1196,
              rhVideoFps: _0x18fb45,
              rhVideoResolution: _0x5e11ff,
              rhInstanceType: _0x2c4afe,
            };
          } else
            _0xe094d0 = {
              provider: 'runninghubwf',
              model: getVideoKeyingModelId(),
              apiKey: _0x5e5b14,
              videoUrl: _0x4ec35a,
              pos_points: _0x3524ce,
              neg_points: _0x13e461,
              timeSec: _0x1d1a2c,
              frame_index: Math.max(0, Math.round(_0x1d1a2c * _0x18fb45)),
              rhVideoFps: _0x18fb45,
              rhVideoFrames: Number.isFinite(_0x395ee9.rhVideoFrames)
                ? Math.max(0, Math.trunc(_0x395ee9.rhVideoFrames))
                : _0x1e1196,
              rhVideoResolution: _0x5e11ff,
              rhInstanceType: _0x2c4afe,
              rhMaskMode: _0x469482,
            };
          try {
            const _0x50c22c = await buildGenerateVideoRequest(_0xe094d0),
              _0x11f395 = formatFinalApiDebugRequest(_0x50c22c),
              _0x52a21c = appStore.getState(),
              _0x442a2b = _0x52a21c.nodes?.[this.nodeId] || {},
              _0x4c4afb = (_0x442a2b.x || 0) + (_0x442a2b.width || 0x17c) + 50,
              _0x6aa60 = _0x442a2b.y || 0;
            let _0x524b4a = Object.values(_0x52a21c.nodes || {}).find(
              (_0x1167ea) => _0x1167ea && _0x1167ea.type === 'debug',
            );
            (!_0x524b4a
              ? appStore.addNode({
                  id: 'debug-' + Date.now(),
                  type: 'debug',
                  x: _0x4c4afb,
                  y: _0x6aa60,
                  width: 0x1a4,
                  height: 0x168,
                  name: videoKeyingText('debug.nodeName'),
                  outputText: _0x11f395,
                })
              : appStore.updateNodeData(_0x524b4a.id, { outputText: _0x11f395, x: _0x4c4afb, y: _0x6aa60 }),
              window.showToast?.(
                this._isRemoveUiMode()
                  ? videoKeyingText('toasts.debugRemoveShown')
                  : videoKeyingText('toasts.debugKeyingShown'),
                'info',
              ));
          } catch (_0x3c03fd) {
            window.showToast?.(
              videoKeyingText('toasts.debugFailed', {
                error: _0x3c03fd?.message || videoKeyingText('errors.unknown'),
              }),
              'error',
            );
          }
        });
      !this._onShortcutsUpdated &&
        ((this._onShortcutsUpdated = () => {
          (this._refreshRemoveShortcutUi(), this._refreshKeyingHintUi());
        }),
        window.addEventListener('shortcuts-updated', this._onShortcutsUpdated));
      const _0x4a24cd = (_0x3244e8) => {
          const _0x8632d0 = this.trackEl?.getBoundingClientRect(),
            _0x144829 = this.durationSec;
          if (!_0x8632d0 || !_0x8632d0.width || !Number.isFinite(_0x144829) || _0x144829 <= 0) return;
          const _0x513d9e = Math.max(0, Math.min(1, (_0x3244e8 - _0x8632d0.left) / _0x8632d0.width)),
            _0x35012b = _0x513d9e * _0x144829,
            _0x16c66e = this.videoEl || this._getVideoEl();
          if (_0x16c66e) _0x16c66e.currentTime = Math.max(0, Math.min(_0x144829, _0x35012b));
          this._renderPlayhead();
        },
        _0x3d6710 = (_0x2d412b, _0x3edd89) => {
          if (_0x2d412b && this._onPointerMove)
            _0x2d412b.removeEventListener('pointermove', this._onPointerMove);
          if (_0x2d412b && this._onPointerUp) _0x2d412b.removeEventListener('pointerup', this._onPointerUp);
          if (_0x2d412b && this._onPointerCancel)
            _0x2d412b.removeEventListener('pointercancel', this._onPointerCancel);
          if (_0x2d412b && this._onPointerCancel)
            _0x2d412b.removeEventListener('lostpointercapture', this._onPointerCancel);
          ((this._onPointerMove = null), (this._onPointerUp = null), (this._onPointerCancel = null));
          try {
            if (_0x2d412b && Number.isFinite(_0x3edd89)) _0x2d412b.releasePointerCapture(_0x3edd89);
          } catch {}
        },
        _0x4caf23 = (_0x42e10f) => {
          if (!this.active || !this.trackEl) return;
          (_0x42e10f.preventDefault(),
            _0x42e10f.stopPropagation(),
            this._pauseAllWrapperVideos(),
            _0x4a24cd(_0x42e10f.clientX));
          const _0x4c25f4 = this.trackEl,
            _0x2808c1 = _0x42e10f.pointerId;
          try {
            if (Number.isFinite(_0x2808c1)) _0x4c25f4.setPointerCapture(_0x2808c1);
          } catch {}
          ((this._onPointerMove = (_0x54227a) => {
            if (Number.isFinite(_0x2808c1) && _0x54227a.pointerId !== _0x2808c1) return;
            (_0x54227a.preventDefault(), _0x4a24cd(_0x54227a.clientX));
          }),
            (this._onPointerUp = (_0x14c465) => {
              if (Number.isFinite(_0x2808c1) && _0x14c465.pointerId !== _0x2808c1) return;
              (_0x14c465.preventDefault(), _0x3d6710(_0x4c25f4, _0x2808c1), this._pauseAllWrapperVideos());
            }),
            (this._onPointerCancel = (_0x28dd05) => {
              if (Number.isFinite(_0x2808c1) && _0x28dd05.pointerId !== _0x2808c1) return;
              (_0x3d6710(_0x4c25f4, _0x2808c1), this._pauseAllWrapperVideos());
            }),
            _0x4c25f4.addEventListener('pointermove', this._onPointerMove),
            _0x4c25f4.addEventListener('pointerup', this._onPointerUp),
            _0x4c25f4.addEventListener('pointercancel', this._onPointerCancel),
            _0x4c25f4.addEventListener('lostpointercapture', this._onPointerCancel));
        };
      (this.playheadEl?.addEventListener('pointerdown', _0x4caf23),
        this.trackEl?.addEventListener('pointerdown', _0x4caf23),
        (this._onKeyDown = (_0x585bb6) => {
          if (!this.active) return;
          if (
            _0x585bb6.target &&
            (_0x585bb6.target.tagName === 'INPUT' ||
              _0x585bb6.target.tagName === 'TEXTAREA' ||
              _0x585bb6.target.isContentEditable)
          )
            return;
          if (_0x585bb6.key === 'Escape') {
            (_0x585bb6.preventDefault(), _0x585bb6.stopPropagation(), this.exit());
            return;
          }
          if (this._isRemoveUiMode()) {
            const _0x303b76 = handleShortcutKeydown(_0x585bb6, {
              mattingActive: false,
              annotateActive: false,
              videoKeyingActive: true,
              featureModeActive: true,
              selectedNodeType: 'source-video',
            });
            if (!_0x303b76) return;
            if (_0x303b76 === 'editor-tool-brush') {
              (_0x585bb6.preventDefault(),
                _0x585bb6.stopPropagation(),
                this._setRemovePointTool('foreground'));
              return;
            }
            if (_0x303b76 === 'editor-tool-eraser') {
              (_0x585bb6.preventDefault(),
                _0x585bb6.stopPropagation(),
                this._setRemovePointTool('background'));
              return;
            }
            if (_0x303b76 === 'editor-clear') {
              (_0x585bb6.preventDefault(),
                _0x585bb6.stopPropagation(),
                this._clearAllMarks(),
                window.showToast?.(videoKeyingText('toasts.clearedPoints'), 'info'));
              return;
            }
            if (_0x303b76 === 'undo') {
              (_0x585bb6.preventDefault(), _0x585bb6.stopPropagation(), this._undoMark());
              return;
            }
            if (_0x303b76 === 'redo') {
              (_0x585bb6.preventDefault(), _0x585bb6.stopPropagation(), this._redoMark());
              return;
            }
            return;
          }
          const _0x514ec9 = (_0x585bb6.ctrlKey || _0x585bb6.metaKey) && !_0x585bb6.altKey;
          if (_0x514ec9 && !_0x585bb6.shiftKey && (_0x585bb6.key === 'z' || _0x585bb6.key === 'Z')) {
            (_0x585bb6.preventDefault(), _0x585bb6.stopPropagation(), this._undoMark());
            return;
          }
          if (
            _0x514ec9 &&
            ((_0x585bb6.shiftKey && (_0x585bb6.key === 'z' || _0x585bb6.key === 'Z')) ||
              (!_0x585bb6.shiftKey && (_0x585bb6.key === 'y' || _0x585bb6.key === 'Y')))
          ) {
            (_0x585bb6.preventDefault(), _0x585bb6.stopPropagation(), this._redoMark());
            return;
          }
          (_0x585bb6.key === 'r' || _0x585bb6.key === 'R') &&
            !_0x585bb6.altKey &&
            !_0x585bb6.ctrlKey &&
            !_0x585bb6.metaKey &&
            (_0x585bb6.preventDefault(),
            _0x585bb6.stopPropagation(),
            this._clearAllMarks(),
            window.showToast?.(videoKeyingText('toasts.clearedPoints'), 'info'));
        }),
        window.addEventListener('keydown', this._onKeyDown, true));
      const _0x38c359 = () => {
        const _0x391852 = this.markLayerEl,
          _0x36ae23 = this.videoEl || this._getVideoEl(),
          _0x4b6db4 = Array.isArray(this._marks) ? this._marks : [];
        if (!_0x391852 || !_0x36ae23) return;
        const _0x3917d7 = this._getVideoProjection(_0x36ae23),
          _0x5b5afe = this._getLayerProjection(_0x391852);
        if (!_0x3917d7 || !_0x5b5afe) return;
        if (this._isRemoveUiMode()) {
          const _0x589ef2 = this.markCanvasEl;
          if (!_0x589ef2) return;
          const _0x3665e0 = Math.max(1, Math.round(_0x5b5afe.lw)),
            _0x5430ed = Math.max(1, Math.round(_0x5b5afe.lh)),
            _0x1b09de = window.devicePixelRatio || 1,
            _0x5e832b = Math.round(_0x3665e0 * _0x1b09de),
            _0x2ca806 = Math.round(_0x5430ed * _0x1b09de);
          (_0x589ef2.width !== _0x5e832b || _0x589ef2.height !== _0x2ca806) &&
            ((_0x589ef2.width = _0x5e832b),
            (_0x589ef2.height = _0x2ca806),
            (_0x589ef2.style.width = _0x3665e0 + 'px'),
            (_0x589ef2.style.height = _0x5430ed + 'px'));
          const _0x417333 = _0x589ef2.getContext('2d');
          if (!_0x417333) return;
          (_0x417333.setTransform(_0x1b09de, 0, 0, _0x1b09de, 0, 0),
            _0x417333.clearRect(0, 0, _0x3665e0, _0x5430ed));
          const _0x4469e2 = this.removeMaskCanvasEl || document.createElement('canvas');
          (_0x4469e2.width !== Math.round(_0x3665e0) || _0x4469e2.height !== Math.round(_0x5430ed)) &&
            ((_0x4469e2.width = Math.max(1, Math.round(_0x3665e0))),
            (_0x4469e2.height = Math.max(1, Math.round(_0x5430ed))));
          this.removeMaskCanvasEl = _0x4469e2;
          const _0x247772 = _0x4469e2.getContext('2d');
          if (!_0x247772) return;
          (_0x247772.clearRect(0, 0, _0x4469e2.width, _0x4469e2.height),
            (_0x247772.lineCap = 'round'),
            (_0x247772.lineJoin = 'round'));
          const _0x128078 = (_0x4053ba) => {
            if (!_0x4053ba || (_0x4053ba.type !== 'brush' && _0x4053ba.type !== 'eraser')) return;
            const _0x5b185f = Array.isArray(_0x4053ba.points) ? _0x4053ba.points : [];
            if (!_0x5b185f.length) return;
            const _0x2f5922 = _0x5b185f
              .map((_0x1fd84c) =>
                this._normalizedToLayerPoint(
                  Number(_0x1fd84c?.nx),
                  Number(_0x1fd84c?.ny),
                  _0x5b5afe,
                  _0x3917d7,
                ),
              )
              .filter((_0x3f0c0c) => Number.isFinite(_0x3f0c0c.x) && Number.isFinite(_0x3f0c0c.y));
            if (!_0x2f5922.length) return;
            drawEraseMaskCommand(_0x247772, {
              type: _0x4053ba.type === 'eraser' ? 'eraser' : 'brush',
              points: _0x2f5922,
              lineWidth: getBrushLineWidth(
                this._clampRemoveBrushSize(_0x4053ba.brushSizePx),
                1,
                _0x4053ba.type,
              ),
            });
          };
          _0x4b6db4.forEach(_0x128078);
          if (this._removeDraft) _0x128078(this._removeDraft);
          const _0xdc7f16 =
            createEraseCheckerboardPattern(_0x417333, 1) || getEraseCanvasPalette().checkerAccent;
          compositeCheckerMask(_0x417333, {
            maskCanvas: _0x4469e2,
            width: _0x3665e0,
            height: _0x5430ed,
            checkerPattern: _0xdc7f16,
            checkerZoom: 1,
            checkerAlpha: 0.8,
          });
          return;
        }
        if (!_0x4b6db4.length) {
          _0x391852.replaceChildren();
          return;
        }
        const _0x84d532 = document.createDocumentFragment();
        for (let _0x4896d3 = 0; _0x4896d3 < _0x4b6db4.length; _0x4896d3++) {
          const _0x5e72ec = _0x4b6db4[_0x4896d3],
            _0x39aaa1 = document.createElement('div'),
            _0x44180c =
              _0x5e72ec && typeof _0x5e72ec.pointType === 'string' ? _0x5e72ec.pointType : 'foreground';
          _0x39aaa1.className =
            _0x44180c === 'background'
              ? 'v2-video-keying-mark v2-video-keying-mark--background'
              : 'v2-video-keying-mark v2-video-keying-mark--foreground';
          if (this._isRemoveUiMode()) {
            const _0x272ed3 = this._clampRemoveBrushSize(_0x5e72ec.brushSizePx || this._removeBrushSizePx),
              _0x168da4 = Math.max(8, Math.min(30, Math.round(_0x272ed3 / 4)));
            ((_0x39aaa1.style.width = _0x168da4 + 'px'), (_0x39aaa1.style.height = _0x168da4 + 'px'));
          }
          const _0x15a796 = this._normalizedToLayerPoint(
            Number(_0x5e72ec.nx),
            Number(_0x5e72ec.ny),
            _0x5b5afe,
            _0x3917d7,
          );
          if (!_0x15a796) continue;
          ((_0x39aaa1.style.left = _0x15a796.x + 'px'),
            (_0x39aaa1.style.top = _0x15a796.y + 'px'),
            _0x84d532.appendChild(_0x39aaa1));
        }
        _0x391852.replaceChildren(_0x84d532);
      };
      this._renderMarksFn = _0x38c359;
      const _0x3303fe = { down: false, pointerId: null },
        _0x537473 = (_0x2a9f27 = true) => {
          const _0xe7741a = this.markLayerEl,
            _0x508cca = _0x3303fe.pointerId;
          if (_0xe7741a && Number.isFinite(_0x508cca))
            try {
              _0xe7741a.releasePointerCapture(_0x508cca);
            } catch {}
          ((_0x3303fe.down = false), (_0x3303fe.pointerId = null), (this._removeDrawPointerId = null));
          const _0x3e664b = this._removeDraft;
          this._removeDraft = null;
          if (!_0x2a9f27 || !_0x3e664b) {
            this._renderMarksFn?.();
            return;
          }
          const _0x1c8e9c = Array.isArray(_0x3e664b.points)
            ? _0x3e664b.points
                .map((_0xbc01c6) => ({
                  nx: Math.max(0, Math.min(1, Number(_0xbc01c6?.nx) || 0)),
                  ny: Math.max(0, Math.min(1, Number(_0xbc01c6?.ny) || 0)),
                }))
                .filter((_0x4a64dc) => Number.isFinite(_0x4a64dc.nx) && Number.isFinite(_0x4a64dc.ny))
            : [];
          if (!_0x1c8e9c.length) {
            this._renderMarksFn?.();
            return;
          }
          const _0x3c51e5 = Array.isArray(this._marks) ? this._marks : [];
          (_0x3c51e5.push({
            type: _0x3e664b.type === 'eraser' ? 'eraser' : 'brush',
            brushSizePx: this._clampRemoveBrushSize(_0x3e664b.brushSizePx),
            points: _0x1c8e9c,
          }),
            (this._marks = _0x3c51e5),
            (this._marksRedo = []),
            this._syncPointsToStore(),
            this._renderMarksFn?.());
        };
      ((this._onMarkPointerDown = (_0x450628) => {
        if (!this.active) return;
        if (_0x450628.detail && _0x450628.detail > 1) return;
        if (!this.markLayerEl || !this.markLayerEl.contains(_0x450628.target)) return;
        (_0x450628.preventDefault(),
          _0x450628.stopPropagation(),
          this._pauseAllWrapperVideos(),
          this._scheduleRemoveCursor(_0x450628.clientX, _0x450628.clientY));
        const _0x786ac7 = this._pickFromClient(_0x450628.clientX, _0x450628.clientY);
        if (!_0x786ac7) return;
        if (this._isRemoveUiMode()) {
          if (_0x450628.button !== 0) return;
          Array.isArray(this._marksRedo) && this._marksRedo.length && (this._marksRedo = []);
          const _0x163476 = this._getRemoveToolType();
          ((this._removeDraft = {
            type: _0x163476,
            brushSizePx: this._clampRemoveBrushSize(this._removeBrushSizePx),
            points: [{ nx: _0x786ac7.nx, ny: _0x786ac7.ny }],
          }),
            (_0x3303fe.down = true),
            (_0x3303fe.pointerId = _0x450628.pointerId),
            (this._removeDrawPointerId = _0x450628.pointerId));
          try {
            if (Number.isFinite(_0x450628.pointerId)) this.markLayerEl.setPointerCapture(_0x450628.pointerId);
          } catch {}
          this._renderMarksFn?.();
          return;
        }
        const _0x51fb2d = Array.isArray(this._marks) ? this._marks : [];
        Array.isArray(this._marksRedo) && this._marksRedo.length && (this._marksRedo = []);
        const _0x233f90 = this.videoEl,
          _0x53516b = Number(_0x233f90?.currentTime) || 0;
        if (_0x450628.button !== 0 && _0x450628.button !== 2) return;
        let _0x291420 = _0x450628.button === 2 ? 'background' : 'foreground';
        (this._isRemoveUiMode() &&
          _0x450628.button === 0 &&
          (_0x291420 = this._removePointTool === 'background' ? 'background' : 'foreground'),
          _0x51fb2d.push({
            nx: _0x786ac7.nx,
            ny: _0x786ac7.ny,
            t: _0x53516b,
            pointType: _0x291420,
            brushSizePx: this._isRemoveUiMode()
              ? this._clampRemoveBrushSize(this._removeBrushSizePx)
              : undefined,
          }),
          (this._marks = _0x51fb2d),
          _0x38c359(),
          this._syncPointsToStore());
      }),
        (this._onMarkPointerMove = (_0x536b7a) => {
          if (!this.active || !this._isRemoveUiMode()) return;
          this._scheduleRemoveCursor(_0x536b7a.clientX, _0x536b7a.clientY);
          if (!_0x3303fe.down || !this._removeDraft) return;
          if (Number.isFinite(_0x3303fe.pointerId) && _0x536b7a.pointerId !== _0x3303fe.pointerId) return;
          (_0x536b7a.preventDefault(), _0x536b7a.stopPropagation());
          const _0x9afc78 = this._pickFromClient(_0x536b7a.clientX, _0x536b7a.clientY);
          if (!_0x9afc78) return;
          const _0x4806e2 = this._removeDraft.points;
          if (!Array.isArray(_0x4806e2) || !_0x4806e2.length) {
            ((this._removeDraft.points = [{ nx: _0x9afc78.nx, ny: _0x9afc78.ny }]), this._renderMarksFn?.());
            return;
          }
          const _0x2d9cee = _0x4806e2[_0x4806e2.length - 1],
            _0xb5f3da = Math.hypot(
              Number(_0x9afc78.nx) - Number(_0x2d9cee.nx),
              Number(_0x9afc78.ny) - Number(_0x2d9cee.ny),
            );
          if (_0xb5f3da < 0.0006) return;
          (_0x4806e2.push({ nx: _0x9afc78.nx, ny: _0x9afc78.ny }), this._renderMarksFn?.());
        }),
        (this._onMarkPointerUp = (_0x3b4067) => {
          if (!this.active || !this._isRemoveUiMode()) return;
          this._scheduleRemoveCursor(_0x3b4067.clientX, _0x3b4067.clientY);
          if (Number.isFinite(_0x3303fe.pointerId) && _0x3b4067.pointerId !== _0x3303fe.pointerId) return;
          (_0x3b4067.preventDefault(), _0x3b4067.stopPropagation(), _0x537473(true));
        }),
        (this._onMarkPointerCancel = (_0x3cf5de) => {
          if (!this.active || !this._isRemoveUiMode()) return;
          if (Number.isFinite(_0x3303fe.pointerId) && _0x3cf5de.pointerId !== _0x3303fe.pointerId) return;
          _0x537473(true);
        }),
        (this._onMarkPointerEnter = (_0x198860) => {
          if (!this._isRemoveUiMode()) return;
          ((this._removeCursorHover = true),
            this._scheduleRemoveCursor(_0x198860.clientX, _0x198860.clientY));
        }),
        (this._onMarkPointerLeave = () => {
          if (!this._isRemoveUiMode()) return;
          ((this._removeCursorHover = false), this._syncRemoveCursor());
        }),
        this._detachMarkLayerListeners(),
        this._attachMarkLayerListeners(),
        _0x38c359(),
        (this._onResize = () => {
          if (!this.active) return;
          (this._renderMarksFn?.(), this._syncRemoveCursor());
        }),
        window.addEventListener('resize', this._onResize));
    },
    _getVideoEl() {
      if (!this.wrapperEl) return null;
      const _0xa7a7aa = Array.from(this.wrapperEl.querySelectorAll('video'));
      for (const _0x1f8796 of _0xa7a7aa) {
        if (!_0x1f8796) continue;
        const _0x1933f0 = window.getComputedStyle(_0x1f8796);
        if (_0x1933f0.display === 'none' || _0x1933f0.visibility === 'hidden') continue;
        const _0xb303e6 = Number(_0x1933f0.opacity);
        if (Number.isFinite(_0xb303e6) && _0xb303e6 <= 0) continue;
        const _0x76ceb2 = _0x1f8796.getBoundingClientRect();
        if (!_0x76ceb2.width || !_0x76ceb2.height) continue;
        return _0x1f8796;
      }
      return null;
    },
    _readDurationSec(_0x5edd90) {
      if (!_0x5edd90) return 0;
      const _0x18d09d = Number(_0x5edd90.duration);
      if (Number.isFinite(_0x18d09d) && _0x18d09d > 0) return _0x18d09d;
      const _0x512379 = _0x5edd90.seekable;
      if (_0x512379 && _0x512379.length) {
        const _0x3696a1 = Number(_0x512379.end(_0x512379.length - 1));
        if (Number.isFinite(_0x3696a1) && _0x3696a1 > 0) return _0x3696a1;
      }
      return 0;
    },
    async _syncDurationAndDefaults() {
      ((this.videoEl = this._getVideoEl()), this._ensureMarkLayer());
      if (this.videoEl) {
        const _0x3a793c = this._resolveVideoSrcFromNode(appStore.getState().nodes?.[this.nodeId]),
          _0x18654b = String(_0x3a793c || '').trim(),
          _0x10d661 = String(this.videoEl.dataset?.videoKeyingSourceUrl || '').trim(),
          _0x44891a = ++this._sourceToken;
        setVideoKeyingMediaKeepAlive(this.videoEl, true);
        if (_0x18654b && _0x10d661 !== _0x18654b) {
          await attachVideoKeyingPlaybackSource(this.videoEl, _0x18654b);
          if (!this.active || _0x44891a !== this._sourceToken) return;
          this.videoEl.dataset && (this.videoEl.dataset.videoKeyingSourceUrl = _0x18654b);
        }
      }
      const _0x7952a4 = this._readDurationSec(this.videoEl);
      if (_0x7952a4 > 0) this.durationSec = _0x7952a4;
      (this._pauseAllWrapperVideos(),
        this.videoEl &&
          ((this._onLoadedMeta = () => {
            if (!this.active) return;
            const _0x320b4d = this._readDurationSec(this.videoEl);
            if (_0x320b4d > 0) this.durationSec = _0x320b4d;
            this._pauseAllWrapperVideos();
          }),
          (this._onDurationChange = () => {
            if (!this.active) return;
            const _0x41f022 = this._readDurationSec(this.videoEl);
            if (_0x41f022 > 0) this.durationSec = _0x41f022;
          }),
          this.videoEl.addEventListener('loadedmetadata', this._onLoadedMeta, { once: true }),
          this.videoEl.addEventListener('durationchange', this._onDurationChange)),
        this._renderThumbs(),
        this._startPlayheadLoop(),
        this.wrapperEl &&
          !this._onVideoPlay &&
          ((this._onVideoPlay = (_0x4aaf8b) => {
            if (!this.active) return;
            if (!this.wrapperEl) return;
            const _0x3e3c62 = _0x4aaf8b.target;
            if (!(_0x3e3c62 instanceof HTMLVideoElement)) return;
            try {
              _0x3e3c62.pause();
            } catch {}
          }),
          this.wrapperEl.addEventListener('play', this._onVideoPlay, true),
          this.wrapperEl.addEventListener('playing', this._onVideoPlay, true)));
    },
    _startPlayheadLoop() {
      if (this._playheadRaf) cancelAnimationFrame(this._playheadRaf);
      const _0x13f674 = () => {
        if (!this.active) return;
        (this._renderPlayhead(), (this._playheadRaf = requestAnimationFrame(_0x13f674)));
      };
      this._playheadRaf = requestAnimationFrame(_0x13f674);
    },
    _renderPlayhead() {
      if (!this.playheadEl || !this.trackEl) return;
      const _0x430677 = this.durationSec;
      if (!Number.isFinite(_0x430677) || _0x430677 <= 0) {
        this.playheadEl.style.display = 'none';
        return;
      }
      const _0x3352e7 = this.videoEl || this._getVideoEl();
      if (!_0x3352e7) {
        this.playheadEl.style.display = 'none';
        return;
      }
      let _0x22ba9e = false;
      if (this.videoEl !== _0x3352e7)
        ((this.videoEl = _0x3352e7),
          this._ensureMarkLayer(),
          this._attachMarkLayerListeners(),
          (_0x22ba9e = true));
      else
        this.markLayerEl &&
          !this.markLayerEl.isConnected &&
          (this._ensureMarkLayer(), this._attachMarkLayerListeners(), (_0x22ba9e = true));
      const _0x1a5cf2 = Math.max(0, Math.min(_0x430677, Number(_0x3352e7.currentTime) || 0)),
        _0x15283f = Math.max(0, Math.min(1, _0x1a5cf2 / _0x430677)),
        _0x2dfc8f = appStore.getState().nodes?.[this.nodeId] || {},
        { fps: _0x392e63 } = this._getRhVideoSettings(_0x2dfc8f),
        _0xb2b1 = Math.max(0, Math.round(_0x1a5cf2 * _0x392e63));
      (this._lastFrameIndex !== _0xb2b1 || this._lastFrameIndexFps !== _0x392e63) &&
        ((this._lastFrameIndex = _0xb2b1), (this._lastFrameIndexFps = _0x392e63), this._updateHelperRight());
      (this._updateHelperRight(),
        (this.playheadEl.style.display = 'block'),
        (this.playheadEl.style.left = _0x15283f * 100 + '%'));
      if (_0x22ba9e) this._renderMarksFn?.();
      this._syncRemoveCursor();
    },
    _resolveVideoSrcFromNode(_0x359a4b) {
      if (!_0x359a4b) return '';
      const _0x2cd60c = localPathToUrl(_0x359a4b.localPath);
      return _0x2cd60c || _0x359a4b.src || _0x359a4b.videoUrl || _0x359a4b.resultUrl || '';
    },
    async _renderThumbs() {
      const _0x1aa19d = ++this._thumbToken,
        _0x562a4d = Array.isArray(this.thumbEls) ? this.thumbEls : [];
      if (!_0x562a4d.length) return;
      const _0x3addbd = appStore.getState().nodes[this.nodeId],
        _0x2f8fce = this._resolveVideoSrcFromNode(_0x3addbd);
      await renderVideoKeyingThumbs({
        src: _0x2f8fce,
        thumbs: _0x562a4d,
        token: _0x1aa19d,
        isCurrent: (_0x34a71d) => this.active && this._thumbToken === _0x34a71d,
        readDurationSec: (_0x88e327) => this._readDurationSec(_0x88e327),
        onDuration: (_0x34f534) => {
          _0x34f534 > 0 && (!this.durationSec || this.durationSec <= 0) && (this.durationSec = _0x34f534);
        },
      });
    },
    ...videoKeyingLifecycleMethods,
  };
export default VideoKeyingController;
