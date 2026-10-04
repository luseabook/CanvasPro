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
    isActiveFor(enabled) {
      return !!enabled && this.active === true && this.nodeId === enabled;
    },
    _isRemoveUiMode() {
      return this.uiMode === 'remove';
    },
    _setRemovePointTool(value) {
      const item = value === 'background' ? 'background' : 'foreground';
      this._removePointTool = item;
      if (this.removeToolbarEl) {
        const key = item === 'background' ? 'eraser' : 'brush';
        this.removeToolbarEl.querySelectorAll('.tool-btn').forEach((el) => {
          el.classList.toggle('active', el.dataset.tool === key);
        });
      }
      this._syncRemoveCursor();
    },
    _clampRemoveBrushSize(index) {
      return clampImageBrushSize(index, 40);
    },
    _getRemoveToolType() {
      return this._removePointTool === 'background' ? 'eraser' : 'brush';
    },
    _getShortcutText(result, data = '') {
      const options = getShortcuts?.(),
        list = options?.[result]?.keys;
      if (!Array.isArray(list) || list.length === 0) return data;
      return list.join('+');
    },
    _buildShortcutTooltip(target, source, next = '') {
      const current = this._getShortcutText(source, next);
      return current ? target + ' ' + current : target;
    },
    _syncRemoveBrushControls() {
      const entry = this._clampRemoveBrushSize(this._removeBrushSizePx);
      (this.removeSizeRangeEl &&
        Number(this.removeSizeRangeEl.value) !== entry &&
        (this.removeSizeRangeEl.value = String(entry)),
        this.removeSizeValueEl && (this.removeSizeValueEl.textContent = String(entry)));
    },
    _refreshRemoveShortcutUi() {
      if (!this._isRemoveUiMode()) return;
      if (this.removeToolbarEl) {
        const list2 = [
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
        list2.forEach(([record, payload]) => {
          const el2 = this.removeToolbarEl?.querySelector(record);
          if (!el2) return;
          (el2.setAttribute('data-tooltip', payload), (el2.title = payload));
        });
      }
      if (this.hintEl) {
        const list3 = [
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
          handle = Array.from(this.hintEl.children);
        list3.forEach((item2, state) => {
          if (handle[state]) handle[state].textContent = item2;
        });
      }
    },
    _refreshKeyingHintUi() {
      if (!this.hintEl || this._isRemoveUiMode()) return;
      const list4 = [
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
        config = Array.from(this.hintEl.children);
      list4.forEach((item3, scope) => {
        if (config[scope]) config[scope].textContent = item3;
      });
    },
    _onRemoveCanvasWheel(event) {
      (event.preventDefault(), event.stopPropagation());
      if (!this.active || !this._isRemoveUiMode() || !this._removeCursorHover) return;
      const count = event.deltaY || 0,
        input = count < 0 ? 1 : -1,
        output = this._clampRemoveBrushSize(this._removeBrushSizePx),
        value2 = this._clampRemoveBrushSize(output + input * 2);
      if (value2 === output) return;
      ((this._removeBrushSizePx = value2), this._syncRemoveBrushControls(), this._syncRemoveCursor());
    },
    _getVideoProjection(el3 = this.videoEl || this._getVideoEl()) {
      if (!el3) return null;
      const rect = el3.getBoundingClientRect(),
        ew = Number(el3.offsetWidth) || 0,
        eh = Number(el3.offsetHeight) || 0,
        vw = Number(el3.videoWidth) || 0,
        vh = Number(el3.videoHeight) || 0;
      if (!rect.width || !rect.height || !ew || !eh || !vw || !vh) return null;
      const fit = window.getComputedStyle(el3).objectFit || 'contain',
        scale = fit === 'cover' ? Math.max(ew / vw, eh / vh) : Math.min(ew / vw, eh / vh);
      if (!Number.isFinite(scale) || scale <= 0) return null;
      const sx = rect.width / ew,
        sy = rect.height / eh;
      if (!Number.isFinite(sx) || sx <= 0 || !Number.isFinite(sy) || sy <= 0) return null;
      return {
        rect: rect,
        ew: ew,
        eh: eh,
        vw: vw,
        vh: vh,
        fit: fit,
        scale: scale,
        dw: vw * scale,
        dh: vh * scale,
        ox: (ew - vw * scale) / 2,
        oy: (eh - vh * scale) / 2,
        sx: sx,
        sy: sy,
      };
    },
    _getLayerProjection(el4 = this.markLayerEl) {
      if (!el4) return null;
      const rect2 = el4.getBoundingClientRect(),
        lw = Number(el4.offsetWidth) || Number(el4.clientWidth) || 0,
        lh = Number(el4.offsetHeight) || Number(el4.clientHeight) || 0;
      if (!rect2.width || !rect2.height || !lw || !lh) return null;
      const sx2 = rect2.width / lw,
        sy2 = rect2.height / lh;
      if (!Number.isFinite(sx2) || sx2 <= 0 || !Number.isFinite(sy2) || sy2 <= 0) return null;
      return { rect: rect2, lw: lw, lh: lh, sx: sx2, sy: sy2 };
    },
    _pickFromClient(value3, value4, videoProjection = this._getVideoProjection()) {
      if (!videoProjection) return null;
      const value5 = (value3 - videoProjection.rect.left) / videoProjection.sx,
        value6 = (value4 - videoProjection.rect.top) / videoProjection.sy;
      if (!Number.isFinite(value5) || !Number.isFinite(value6)) return null;
      if (
        videoProjection.fit !== 'cover' &&
        (value5 < videoProjection.ox ||
          value5 > videoProjection.ox + videoProjection.dw ||
          value6 < videoProjection.oy ||
          value6 > videoProjection.oy + videoProjection.dh)
      )
        return null;
      const value7 = (value5 - videoProjection.ox) / videoProjection.scale,
        value8 = (value6 - videoProjection.oy) / videoProjection.scale;
      if (!Number.isFinite(value7) || !Number.isFinite(value8)) return null;
      return {
        nx: Math.max(0, Math.min(1, value7 / videoProjection.vw)),
        ny: Math.max(0, Math.min(1, value8 / videoProjection.vh)),
        videoProjection: videoProjection,
      };
    },
    _normalizedToLayerPoint(
      value9,
      value10,
      enabled2 = this._getLayerProjection(),
      box = this._getVideoProjection(),
    ) {
      if (!enabled2 || !box) return null;
      const value11 = Math.max(0, Math.min(1, Number(value9) || 0)),
        value12 = Math.max(0, Math.min(1, Number(value10) || 0)),
        value13 = box.ox + value11 * box.vw * box.scale,
        value14 = box.oy + value12 * box.vh * box.scale,
        value15 = box.rect.left + value13 * box.sx,
        value16 = box.rect.top + value14 * box.sy,
        x = (value15 - enabled2.rect.left) / enabled2.sx,
        y = (value16 - enabled2.rect.top) / enabled2.sy;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x: x, y: y };
    },
    _scheduleRemoveCursor(value17, value18) {
      this._removeCursorLast = { x: Number(value17) || 0, y: Number(value18) || 0 };
      if (this._removeCursorRaf) return;
      this._removeCursorRaf = requestAnimationFrame(() => {
        ((this._removeCursorRaf = 0), this._syncRemoveCursor());
      });
    },
    _syncRemoveCursor() {
      const canvasEl = this.markLayerEl,
        cursorEl = this.removeCursorEl;
      if (!this._isRemoveUiMode() || !canvasEl || !cursorEl) return;
      const run = () => syncCircularBrushCursor({ cursorEl: cursorEl, canvasEl: canvasEl, visible: false });
      if (!this._removeCursorHover) {
        run();
        return;
      }
      const enabled3 = this._getVideoProjection(),
        enabled4 = this._getLayerProjection(canvasEl),
        enabled5 = this._pickFromClient(this._removeCursorLast.x, this._removeCursorLast.y, enabled3),
        box2 = enabled5 ? this._normalizedToLayerPoint(enabled5.nx, enabled5.ny, enabled4, enabled3) : null;
      if (!enabled3 || !enabled4 || !enabled5 || !box2) {
        run();
        return;
      }
      const x2 = Number(box2?.x),
        y2 = Number(box2?.y);
      if (
        !Number.isFinite(x2) ||
        !Number.isFinite(y2) ||
        x2 < 0 ||
        y2 < 0 ||
        x2 > enabled4.lw ||
        y2 > enabled4.lh
      ) {
        run();
        return;
      }
      const sizePx = this._clampRemoveBrushSize(this._removeBrushSizePx);
      syncCircularBrushCursor({
        cursorEl: cursorEl,
        canvasEl: canvasEl,
        visible: true,
        tool: this._getRemoveToolType(),
        allowedTools: ['brush', 'eraser'],
        sizePx: sizePx,
        cursorLast: { x: x2, y: y2 },
        isEraseBrush: true,
      });
    },
    _attachMarkLayerListeners() {
      const el5 = this.markLayerEl;
      if (!el5) return;
      if (this._onMarkPointerDown) el5.addEventListener('pointerdown', this._onMarkPointerDown);
      if (this._onMarkPointerMove) el5.addEventListener('pointermove', this._onMarkPointerMove);
      if (this._onMarkPointerUp) el5.addEventListener('pointerup', this._onMarkPointerUp);
      if (this._onMarkPointerCancel) el5.addEventListener('pointercancel', this._onMarkPointerCancel);
      if (this._onMarkPointerCancel) el5.addEventListener('lostpointercapture', this._onMarkPointerCancel);
      if (this._onMarkPointerEnter) el5.addEventListener('pointerenter', this._onMarkPointerEnter);
      if (this._onMarkPointerLeave) el5.addEventListener('pointerleave', this._onMarkPointerLeave);
    },
    _detachMarkLayerListeners(el6 = this.markLayerEl) {
      if (!el6) return;
      if (this._onMarkPointerDown) el6.removeEventListener('pointerdown', this._onMarkPointerDown);
      if (this._onMarkPointerMove) el6.removeEventListener('pointermove', this._onMarkPointerMove);
      if (this._onMarkPointerUp) el6.removeEventListener('pointerup', this._onMarkPointerUp);
      if (this._onMarkPointerCancel) el6.removeEventListener('pointercancel', this._onMarkPointerCancel);
      if (this._onMarkPointerCancel) el6.removeEventListener('lostpointercapture', this._onMarkPointerCancel);
      if (this._onMarkPointerEnter) el6.removeEventListener('pointerenter', this._onMarkPointerEnter);
      if (this._onMarkPointerLeave) el6.removeEventListener('pointerleave', this._onMarkPointerLeave);
    },
    _collectRemovePosPoints(value19 = REMOVE_POS_POINT_LIMIT) {
      const list5 = Array.isArray(this._marks) ? this._marks : [],
        list6 = list5.filter((item4) => item4 && (item4.type === 'brush' || item4.type === 'eraser')),
        enabled6 = list6.some((item5) => item5.type === 'brush');
      if (!enabled6) return [];
      const value20 = Math.max(1, Math.trunc(Number(value19) || REMOVE_POS_POINT_LIMIT)),
        el7 = this.videoEl || this._getVideoEl(),
        value21 = Math.max(1, Number(el7?.videoWidth) || Number(el7?.offsetWidth) || REMOVE_MASK_MAX_SIDE),
        value22 = Math.max(1, Number(el7?.videoHeight) || Number(el7?.offsetHeight) || REMOVE_MASK_MAX_SIDE),
        value23 = Math.min(1, REMOVE_MASK_MAX_SIDE / Math.max(value21, value22)),
        count2 = Math.max(1, Math.round(value21 * value23)),
        count3 = Math.max(1, Math.round(value22 * value23)),
        box3 = document.createElement('canvas');
      ((box3.width = count2), (box3.height = count3));
      const ctx = box3.getContext('2d', { willReadFrequently: true });
      if (!ctx) return [];
      const eraseCanvasPalette = getEraseCanvasPalette(),
        value24 = count2 / Math.max(1, Number(el7?.offsetWidth) || count2);
      list6.forEach((item6) => {
        const list7 = Array.isArray(item6.points) ? item6.points : [];
        if (!list7.length) return;
        const globalCompositeOperation = item6.type === 'eraser' ? 'eraser' : 'brush',
          lineWidth = getBrushLineWidth(
            this._clampRemoveBrushSize(item6.brushSizePx),
            value24,
            globalCompositeOperation,
          ),
          points = list7.map((item7) => ({
            x: Math.max(0, Math.min(1, Number(item7?.nx) || 0)) * (count2 - 1),
            y: Math.max(0, Math.min(1, Number(item7?.ny) || 0)) * (count3 - 1),
          }));
        ctx.save();
        const strokeStyle =
          globalCompositeOperation === 'eraser'
            ? eraseCanvasPalette.eraseDark
            : eraseCanvasPalette.brushLight;
        (drawRoundBrushStroke(ctx, {
          points: points,
          lineWidth: lineWidth,
          strokeStyle: strokeStyle,
          fillStyle: strokeStyle,
          globalCompositeOperation: globalCompositeOperation === 'eraser' ? 'destination-out' : 'source-over',
        }),
          ctx.restore());
      });
      const value25 = ctx.getImageData(0, 0, count2, count3).data,
        list8 = [],
        map = new Set(),
        handler = (value26, value27) => {
          const x3 = count2 > 1 ? value26 / (count2 - 1) : 0,
            y3 = count3 > 1 ? value27 / (count3 - 1) : 0,
            value28 = Math.round(x3 * 0xfa0) + ':' + Math.round(y3 * 0xfa0);
          if (map.has(value28)) return;
          (map.add(value28), list8.push({ x: x3, y: y3 }));
        },
        handler2 = (value29) => {
          for (let value30 = 0; value30 < count3; value30 += value29) {
            for (let value31 = 0; value31 < count2; value31 += value29) {
              const value32 = (value30 * count2 + value31) * 4;
              if (value25[value32 + 3] < 8) continue;
              handler(value31, value30);
              if (list8.length >= value20) return true;
            }
          }
          return false;
        },
        count4 = Math.max(1, Math.floor(Math.max(count2, count3) / 220)),
        enabled7 = handler2(count4);
      !enabled7 && list8.length < Math.min(value20, 80) && count4 > 1 && handler2(1);
      if (list8.length > value20) list8.length = value20;
      return list8;
    },
    _getKeyingMeta() {
      const value33 = appStore.getState().nodes?.[this.nodeId] || {},
        { fps: fps, resolution: resolution } = this._getRhVideoSettings(value33),
        totalFrames = Math.max(1, Math.round((Number(this.durationSec) || 0) * fps) || 1),
        value34 = this.videoEl || this._getVideoEl(),
        value35 = Math.max(0, Math.min(Number(this.durationSec) || 0, Number(value34?.currentTime) || 0)),
        frameIndex = Math.min(totalFrames, Math.max(0, Math.round(value35 * fps)));
      return { fps: fps, res: resolution, totalFrames: totalFrames, frameIndex: frameIndex };
    },
    _calcKeyingFrameSize(value36, value37, value38) {
      const w = Math.max(0, Math.trunc(Number(value36) || 0)),
        h = Math.max(0, Math.trunc(Number(value37) || 0)),
        enabled8 = Math.max(0, Math.trunc(Number(value38) || 0));
      if (!w || !h || !enabled8) return { w: w, h: h };
      const value39 = Math.max(w, h),
        value40 = enabled8 / value39,
        w2 = Math.max(1, Math.round(w * value40)),
        h2 = Math.max(1, Math.round(h * value40));
      return { w: w2, h: h2 };
    },
    _updateHelperRight() {
      if (!this.helperRightEl || !this.active) return;
      const { fps: fps2, res: res, frameIndex: frameIndex2 } = this._getKeyingMeta(),
        videoKeyingText2 = videoKeyingText('helper.meta', {
          fps: fps2,
          resolution: res,
          frameIndex: frameIndex2,
        });
      if (this._lastHelperRightText === videoKeyingText2) return;
      ((this._lastHelperRightText = videoKeyingText2), (this.helperRightEl.textContent = videoKeyingText2));
    },
    _resolveSourceVideoValue(value41 = appStore.getState().nodes?.[this.nodeId] || {}) {
      return value41.src || value41.videoUrl || value41.localPath || value41.resultLocalPath || '';
    },
    _normalizeRhMaskMode(value42) {
      const enabled9 = String(value42 || '').trim();
      if (!enabled9 || enabled9 === '0') return 'Sec';
      if (enabled9 === '1') return 'Sam3';
      if (enabled9 === '2') return 'MA2';
      const value43 = enabled9.toLowerCase();
      if (value43 === 'sam3') return 'Sam3';
      if (value43 === 'ma2' || value43 === 'matanyone2') return 'MA2';
      return 'Sec';
    },
    _getRhVideoSettings(value44 = appStore.getState().nodes?.[this.nodeId] || {}) {
      const fps3 = normalizeRhKeyingFps(
          resolveSourceVideoKeyingSetting(value44, 'rhVideoFps', RH_DEFAULT_KEYING_FPS),
        ),
        resolution2 = normalizeRhKeyingResolution(
          resolveSourceVideoKeyingSetting(value44, 'rhVideoResolution', RH_DEFAULT_KEYING_RESOLUTION),
        ),
        instanceType = normalizeRhInstanceType(
          resolveSourceVideoKeyingSetting(value44, 'rhInstanceType', RH_DEFAULT_INSTANCE_TYPE),
        );
      return { fps: fps3, resolution: resolution2, instanceType: instanceType };
    },
    _getRhMaskMode(value45 = appStore.getState().nodes?.[this.nodeId] || {}) {
      return this._normalizeRhMaskMode(
        resolveSourceVideoKeyingSetting(value45, 'rhMaskMode', RH_DEFAULT_KEYING_MASK_MODE),
      );
    },
    _getSourceFrameCount(value46, value47) {
      const value48 = Number.isFinite(Number(value47)) && Number(value47) > 0 ? Number(value47) : 24,
        count5 = Number(value46?.videoFrameCount),
        count6 = Number(value46?.videoFps),
        list9 = [Number(value46?.videoDuration), Number(this.durationSec), Number(this.videoEl?.duration)];
      let value49 = list9.find((count7) => Number.isFinite(count7) && count7 > 0);
      !Number.isFinite(value49) &&
        Number.isFinite(count5) &&
        count5 > 0 &&
        Number.isFinite(count6) &&
        count6 > 0 &&
        (value49 = count5 / count6);
      if (Number.isFinite(value49)) return Math.max(1, Math.round(value49 * value48));
      if (Number.isFinite(count5) && count5 > 0) return Math.max(1, Math.trunc(count5));
      return Math.max(1, Math.trunc(Number(value46?.rhVideoFrames) || value48 || 24));
    },
    _computeGenerationDuration(value50) {
      const value51 = appStore.getState().nodes?.[value50],
        count8 = Number(value51?.generationStartTime);
      if (!Number.isFinite(count8) || count8 <= 0) return 0;
      return Math.max(0, Date.now() - count8);
    },
    _getRemoveMaskExportSize(value52) {
      const videoEl = this.videoEl || this._getVideoEl(),
        sourceW = Math.max(
          1,
          Number(videoEl?.videoWidth) || Number(videoEl?.offsetWidth) || Number(value52) || 0x400,
        ),
        sourceH = Math.max(
          1,
          Number(videoEl?.videoHeight) || Number(videoEl?.offsetHeight) || Number(value52) || 0x400,
        ),
        { w: w3, h: h3 } = this._calcKeyingFrameSize(sourceW, sourceH, value52);
      return {
        videoEl: videoEl,
        sourceW: sourceW,
        sourceH: sourceH,
        width: Math.max(1, w3 || 1),
        height: Math.max(1, h3 || 1),
      };
    },
    _getVideoRectInLayer(enabled10 = this._getLayerProjection(), enabled11 = this._getVideoProjection()) {
      if (!enabled10 || !enabled11) return null;
      const box4 = this._normalizedToLayerPoint(0, 0, enabled10, enabled11),
        box5 = this._normalizedToLayerPoint(1, 1, enabled10, enabled11);
      if (!box4 || !box5) return null;
      const x4 = Number(box4.x),
        y4 = Number(box4.y),
        value53 = Number(box5.x),
        value54 = Number(box5.y);
      if (
        !Number.isFinite(x4) ||
        !Number.isFinite(y4) ||
        !Number.isFinite(value53) ||
        !Number.isFinite(value54)
      )
        return null;
      return {
        x: x4,
        y: y4,
        width: Math.max(1, value53 - x4),
        height: Math.max(1, value54 - y4),
      };
    },
    _exportRemoveMaskDataUrl(value55) {
      this._renderMarksFn?.();
      const { videoEl: videoEl2, width: width, height: height } = this._getRemoveMaskExportSize(value55);
      if (!width || !height) throw new Error(videoKeyingText('errors.maskSizeInvalid'));
      const list10 = (Array.isArray(this._marks) ? this._marks : []).filter(
          (item8) => item8 && (item8.type === 'brush' || item8.type === 'eraser'),
        ),
        enabled12 = list10.some((item9) => item9.type === 'brush');
      if (!enabled12) throw new Error(videoKeyingText('errors.noBrush'));
      const box6 = document.createElement('canvas');
      ((box6.width = width), (box6.height = height));
      const ctx2 = box6.getContext('2d');
      if (!ctx2) throw new Error(videoKeyingText('errors.maskCanvasUnavailable'));
      const eraseCanvasPalette2 = getEraseCanvasPalette();
      ((ctx2.fillStyle = eraseCanvasPalette2.eraseDark), ctx2.fillRect(0, 0, width, height));
      const box7 = this.removeMaskCanvasEl,
        value56 = this._getLayerProjection(this.markLayerEl),
        value57 = this._getVideoProjection(videoEl2),
        box8 = this._getVideoRectInLayer(value56, value57);
      if (box7 && box8 && box7.width > 0 && box7.height > 0) {
        const value58 = Math.max(0, Math.min(box7.width - 1, box8.x)),
          value59 = Math.max(0, Math.min(box7.height - 1, box8.y)),
          value60 = Math.max(1, Math.min(box7.width - value58, box8.width)),
          value61 = Math.max(1, Math.min(box7.height - value59, box8.height));
        return (
          ctx2.drawImage(box7, value58, value59, value60, value61, 0, 0, width, height),
          box6.toDataURL('image/png')
        );
      }
      return (
        list10.forEach((item10) => {
          const list11 = Array.isArray(item10.points) ? item10.points : [];
          if (!list11.length) return;
          const value62 = item10.type === 'eraser' ? 'eraser' : 'brush',
            strokeStyle2 =
              value62 === 'eraser' ? eraseCanvasPalette2.eraseDark : eraseCanvasPalette2.brushLight,
            lineWidth2 = getBrushLineWidth(
              this._clampRemoveBrushSize(item10.brushSizePx) *
                (width / Math.max(1, Number(videoEl2?.offsetWidth) || width)),
              1,
              value62,
            ),
            points2 = list11.map((item11) => ({
              x: Math.max(0, Math.min(1, Number(item11?.nx) || 0)) * (width - 1),
              y: Math.max(0, Math.min(1, Number(item11?.ny) || 0)) * (height - 1),
            }));
          (ctx2.save(),
            drawRoundBrushStroke(ctx2, {
              points: points2,
              lineWidth: lineWidth2,
              strokeStyle: strokeStyle2,
              fillStyle: strokeStyle2,
            }),
            ctx2.restore());
        }),
        box6.toDataURL('image/png')
      );
    },
    _updateConfirmEnabled() {
      if (!this.confirmBtnEl || !this.active) return;
      const value63 = this.nodeId,
        value64 = value63 ? this._rhTasks.get(value63) : null;
      if (value64 && value64.running) {
        if (this.confirmBtnEl.disabled) this.confirmBtnEl.disabled = false;
        return;
      }
      const { pos_points: pos_points, neg_points: neg_points } = this.getPosNegPoints(),
        count9 = Array.isArray(pos_points) ? pos_points.length : 0,
        value65 = Array.isArray(neg_points) ? neg_points.length : 0,
        enabled13 = this._isRemoveUiMode() ? count9 > 0 : count9 > 0 && value65 < count9;
      if (this._lastConfirmEnabled === enabled13) return;
      ((this._lastConfirmEnabled = enabled13), (this.confirmBtnEl.disabled = !enabled13));
    },
    _finalizeRhOutputNode(
      enabled14,
      { jobStatus: jobStatus, outputText: outputText, extra: extra = {} } = {},
    ) {
      if (!enabled14) return;
      const enabled15 = appStore.getState().nodes?.[enabled14];
      if (!enabled15) return;
      const duration = this._computeGenerationDuration(enabled14),
        value66 = String(extra?.rhTaskStatus || jobStatus || '')
          .trim()
          .toLowerCase();
      let args;
      if (value66 === 'cancelled' || value66 === 'canceled')
        args = buildGenerationCancelledPatch({ duration: duration });
      else {
        if (value66 === 'success' || value66 === 'succeeded' || value66 === 'completed')
          args = buildGenerationSuccessPatch({ duration: duration });
        else
          value66 === 'failed' || value66 === 'fail' || value66 === 'error'
            ? (args = buildGenerationFailurePatch({ error: outputText, duration: duration }))
            : (args = {
                ...buildGenerationCancelledPatch({ duration: duration }),
                jobStatus: jobStatus,
              });
      }
      appStore.updateNodeData(enabled14, {
        ...args,
        rhTaskRecovering: false,
        outputText: outputText,
        ...extra,
      });
    },
    _notifyRhTaskChange(options2 = {}) {
      try {
        window.dispatchEvent?.(
          new CustomEvent(VIDEO_KEYING_TASK_CHANGE_EVENT, {
            detail: {
              sourceNodeId: String(options2.sourceNodeId || ''),
              outId: String(options2.outId || ''),
              mode: String(options2.mode || ''),
            },
          }),
        );
      } catch {}
    },
    async _submitRhVideoMattingRuntimeTask({
      sourceNodeId: sourceNodeId,
      outId: outId,
      ctxId: ctxId,
      controller: controller,
      startTime: startTime,
      taskType: taskType,
      executionId: executionId,
      payload: payload2,
      successName: successName = '',
    } = {}) {
      const value67 = taskType === 'video-remove' ? 'remove' : 'keying';
      return submitTask(
        {
          sourceNodeId: sourceNodeId,
          targetNodeId: outId,
          trigger: 'toolbar',
          taskType: taskType,
          provider: 'runninghubwf',
          adapterType: 'workflow',
          modelId: getVideoKeyingModelId(),
          executionId: executionId,
          payload: payload2,
          cancellable: true,
          resumable: true,
          parseError: (error) =>
            typeof error?.getUserMessage === 'function' ? error.getUserMessage() : error?.message,
          cancel: async ({ taskId: taskId }) => {
            if (!payload2?.apiKey || !taskId) return;
            await cancelRunningHubTask({ apiKey: payload2.apiKey, taskId: taskId });
          },
          submit: async (value68, signal) =>
            generateVideo(value68, {
              signal: signal.signal,
              onTaskId: (value69) => {
                signal.onTaskId?.(value69);
                const value70 = this._rhTasks.get(sourceNodeId);
                value70 &&
                  value70.id === ctxId &&
                  ((value70.taskId = String(value69 || '')), this._notifyRhTaskChange(value70));
                if (!appStore.getState().nodes?.[outId]) return;
                appStore.updateNodeData(outId, {
                  rhTaskUseOpenapiQuery: false,
                  outputText: buildVideoKeyingOutputText(value67, 'processing', {
                    taskId: String(value69 || ''),
                  }),
                });
              },
            }),
          resultBuilder: (args2) => {
            const localPath = pickResultLocalPath(args2),
              src = localPathToUrl(localPath) || String(args2?.videoUrl || '');
            if (!src) throw new Error(videoKeyingText('errors.noVideoUrl'));
            const duration2 = this._computeGenerationDuration(outId);
            return {
              ...buildVideoGenerationResultPatch(
                { ...args2, videoUrl: String(args2?.videoUrl || src), localPath: localPath },
                { startedAt: startTime, duration: duration2 },
              ),
              src: src,
              ...(successName ? { name: successName } : {}),
              outputText: buildVideoKeyingOutputText(value67, 'completed'),
            };
          },
        },
        { store: appStore, abortController: controller, startedAt: startTime },
      );
    },
    _resolveRunningKeyingSourceNodeId(value71) {
      const enabled16 = String(value71 || '').trim();
      if (!enabled16) return '';
      const value72 = this._rhTasks.get(enabled16);
      if (value72?.running && value72.mode === 'keying') return enabled16;
      for (const [value73, enabled17] of this._rhTasks.entries()) {
        if (!enabled17?.running || enabled17.mode !== 'keying') continue;
        if (
          String(value73 || '') === enabled16 ||
          String(enabled17.sourceNodeId || '') === enabled16 ||
          String(enabled17.outId || '') === enabled16
        )
          return String(value73 || '');
      }
      return '';
    },
    _resolveRunningRemoveSourceNodeId(value74) {
      const enabled18 = String(value74 || '').trim();
      if (!enabled18) return '';
      const value75 = this._rhTasks.get(enabled18);
      if (value75?.running && value75.mode === 'remove') return enabled18;
      for (const [value76, enabled19] of this._rhTasks.entries()) {
        if (!enabled19?.running || enabled19.mode !== 'remove') continue;
        if (
          String(value76 || '') === enabled18 ||
          String(enabled19.sourceNodeId || '') === enabled18 ||
          String(enabled19.outId || '') === enabled18
        )
          return String(value76 || '');
      }
      return '';
    },
    _isRunningKeyingOutputNode(error2) {
      if (!error2 || typeof error2 !== 'object') return false;
      if (!isVideoKeyingModel(error2.model)) return false;
      const list12 = String(error2.outputText || ''),
        value77 = String(error2.name || ''),
        enabled20 =
          String(error2.rhToolbarTaskType || '') === 'video-keying' ||
          list12.includes('RH视频抠像') ||
          list12.includes('视频抠像') ||
          /^抠像结果\b/.test(value77);
      if (!enabled20 || list12.includes('RH视频擦除')) return false;
      return shouldShowGenerationBusyUi(error2);
    },
    _isRunningRemoveOutputNode(error3) {
      if (!error3 || typeof error3 !== 'object') return false;
      if (!isVideoKeyingModel(error3.model)) return false;
      const list13 = String(error3.outputText || ''),
        value78 = String(error3.name || ''),
        enabled21 =
          String(error3.rhToolbarTaskType || '') === 'video-remove' ||
          list13.includes('RH视频擦除') ||
          list13.includes('视频擦除') ||
          /^视频擦除/.test(value78);
      if (!enabled21) return false;
      return shouldShowGenerationBusyUi(error3);
    },
    _findRunningKeyingOutputNodeForNode(value79) {
      const enabled22 = String(value79 || '').trim();
      if (!enabled22) return null;
      const value80 = appStore.getState().nodes || {},
        value81 = Object.values(value80)
          .filter((item12) => {
            if (!this._isRunningKeyingOutputNode(item12)) return false;
            return String(item12.id || '') === enabled22 || String(item12.rhSourceNodeId || '') === enabled22;
          })
          .sort((item13, value82) => {
            const value83 = Number(item13.rhTaskStartedAt || item13.generationStartTime || 0) || 0,
              value84 = Number(value82.rhTaskStartedAt || value82.generationStartTime || 0) || 0;
            return value84 - value83;
          });
      return value81[0] || null;
    },
    _findRunningRemoveOutputNodeForNode(value85) {
      const enabled23 = String(value85 || '').trim();
      if (!enabled23) return null;
      const value86 = appStore.getState().nodes || {},
        value87 = Object.values(value86)
          .filter((item14) => {
            if (!this._isRunningRemoveOutputNode(item14)) return false;
            return String(item14.id || '') === enabled23 || String(item14.rhSourceNodeId || '') === enabled23;
          })
          .sort((item15, value88) => {
            const value89 = Number(item15.rhTaskStartedAt || item15.generationStartTime || 0) || 0,
              value90 = Number(value88.rhTaskStartedAt || value88.generationStartTime || 0) || 0;
            return value90 - value89;
          });
      return value87[0] || null;
    },
    _getRunningKeyingTaskFromMemory(value91) {
      const sourceNodeId2 = this._resolveRunningKeyingSourceNodeId(value91),
        enabled24 = sourceNodeId2 ? this._rhTasks.get(sourceNodeId2) : null;
      if (!enabled24?.running || enabled24.mode !== 'keying') return null;
      return {
        sourceNodeId: sourceNodeId2,
        outId: String(enabled24.outId || ''),
        taskId: String(enabled24.taskId || ''),
        mode: 'keying',
        fromStore: false,
      };
    },
    _getRunningRemoveTaskFromMemory(value92) {
      const sourceNodeId3 = this._resolveRunningRemoveSourceNodeId(value92),
        enabled25 = sourceNodeId3 ? this._rhTasks.get(sourceNodeId3) : null;
      if (!enabled25?.running || enabled25.mode !== 'remove') return null;
      return {
        sourceNodeId: sourceNodeId3,
        outId: String(enabled25.outId || ''),
        taskId: String(enabled25.taskId || ''),
        mode: 'remove',
        fromStore: false,
      };
    },
    getRunningKeyingTaskForNode(value93) {
      const value94 = this._getRunningKeyingTaskFromMemory(value93);
      if (value94) return value94;
      const enabled26 = this._findRunningKeyingOutputNodeForNode(value93);
      if (!enabled26) return null;
      return {
        sourceNodeId: String(enabled26.rhSourceNodeId || ''),
        outId: String(enabled26.id || ''),
        taskId: String(enabled26.rhTaskId || ''),
        mode: 'keying',
        fromStore: true,
      };
    },
    getRunningRemoveTaskForNode(value95) {
      const value96 = this._getRunningRemoveTaskFromMemory(value95);
      if (value96) return value96;
      const enabled27 = this._findRunningRemoveOutputNodeForNode(value95);
      if (!enabled27) return null;
      return {
        sourceNodeId: String(enabled27.rhSourceNodeId || ''),
        outId: String(enabled27.id || ''),
        taskId: String(enabled27.rhTaskId || ''),
        mode: 'remove',
        fromStore: true,
      };
    },
    hasRunningKeyingTaskForNode(value97) {
      return !!this.getRunningKeyingTaskForNode(value97);
    },
    hasRunningRemoveTaskForNode(value98) {
      return !!this.getRunningRemoveTaskForNode(value98);
    },
    async cancelRunningKeyingTaskForNode(value99, value100 = {}) {
      const value101 = this._resolveRunningKeyingSourceNodeId(value99);
      if (value101) return this._cancelRhTaskForSourceNode(value101, value100);
      const taskId2 = this.getRunningKeyingTaskForNode(value99);
      if (!taskId2?.outId) return false;
      let apiKey = '';
      try {
        apiKey = await getRunningHubWorkflowApiKey();
      } catch {}
      const outputText2 = buildVideoKeyingOutputText('keying', 'cancelled');
      return (
        await cancelTask(taskId2.outId, {
          store: appStore,
          cancellable: true,
          taskId: taskId2.taskId,
          spec: { provider: 'runninghubwf', adapterType: 'workflow' },
          cancel: async ({ taskId: taskId3 }) => {
            if (!apiKey || !taskId3) return;
            try {
              await cancelRunningHubTask({ apiKey: apiKey, taskId: taskId3 });
            } catch {}
          },
        }),
        appStore.updateNodeData(taskId2.outId, { outputText: outputText2 }),
        this._notifyRhTaskChange(taskId2),
        value100?.notify && window.showToast?.(videoKeyingText('toasts.keyingCancelled'), 'info'),
        true
      );
    },
    async cancelRunningRemoveTaskForNode(value102, value103 = {}) {
      const value104 = this._resolveRunningRemoveSourceNodeId(value102);
      if (value104) return this._cancelRhTaskForSourceNode(value104, value103);
      const taskId4 = this.getRunningRemoveTaskForNode(value102);
      if (!taskId4?.outId) return false;
      let apiKey2 = '';
      try {
        apiKey2 = await getRunningHubWorkflowApiKey();
      } catch {}
      const outputText3 = buildVideoKeyingOutputText('remove', 'cancelled');
      return (
        await cancelTask(taskId4.outId, {
          store: appStore,
          cancellable: true,
          taskId: taskId4.taskId,
          spec: { provider: 'runninghubwf', adapterType: 'workflow' },
          cancel: async ({ taskId: taskId5 }) => {
            if (!apiKey2 || !taskId5) return;
            try {
              await cancelRunningHubTask({ apiKey: apiKey2, taskId: taskId5 });
            } catch {}
          },
        }),
        appStore.updateNodeData(taskId4.outId, { outputText: outputText3 }),
        this._notifyRhTaskChange(taskId4),
        value103?.notify && window.showToast?.(videoKeyingText('toasts.removeCancelled'), 'info'),
        true
      );
    },
    async _cancelRhTaskForSourceNode(value105, { notify: notify = false } = {}) {
      const enabled28 = value105 ? this._rhTasks.get(value105) : null;
      if (!enabled28 || !enabled28.running) return false;
      try {
        enabled28.abort?.abort();
      } catch {}
      const taskId6 = String(enabled28.taskId || ''),
        apiKey3 = String(enabled28.apiKey || ''),
        value106 = String(enabled28.outId || ''),
        value107 = enabled28.mode === 'remove';
      (this._rhTasks.delete(value105), this._notifyRhTaskChange(enabled28));
      const outputText4 = buildVideoKeyingOutputText(value107 ? 'remove' : 'keying', 'cancelled');
      return (
        await cancelTask(value106, {
          store: appStore,
          cancellable: true,
          taskId: taskId6,
          spec: { provider: 'runninghubwf', adapterType: 'workflow' },
          cancel: async ({ taskId: taskId7 }) => {
            if (apiKey3 && taskId7)
              try {
                await cancelRunningHubTask({ apiKey: apiKey3, taskId: taskId7 });
              } catch {}
          },
        }),
        appStore.updateNodeData(value106, { outputText: outputText4 }),
        notify &&
          window.showToast?.(
            value107 ? videoKeyingText('toasts.removeCancelled') : videoKeyingText('toasts.keyingCancelled'),
            'info',
          ),
        true
      );
    },
    getPosNegPoints() {
      if (this._isRemoveUiMode()) {
        const pos_points2 = this._collectRemovePosPoints(REMOVE_POS_POINT_LIMIT);
        return { pos_points: pos_points2, neg_points: [] };
      }
      const value108 = Array.isArray(this._marks) ? this._marks : [],
        pos_points3 = [],
        neg_points2 = [];
      for (const enabled29 of value108) {
        if (!enabled29) continue;
        const x5 = Number(enabled29.nx),
          y5 = Number(enabled29.ny);
        if (!Number.isFinite(x5) || !Number.isFinite(y5)) continue;
        const value109 = { x: x5, y: y5 };
        if (enabled29.pointType === 'background') neg_points2.push(value109);
        else pos_points3.push(value109);
      }
      return { pos_points: pos_points3, neg_points: neg_points2 };
    },
    _syncPointsToStore() {
      const { pos_points: pos_points4, neg_points: neg_points3 } = this.getPosNegPoints();
      (appStore.setVideoKeyingState({ pos_points: pos_points4, neg_points: neg_points3 }),
        this._updateConfirmEnabled());
    },
    _undoMark() {
      const list14 = Array.isArray(this._marks) ? this._marks : [];
      if (!list14.length) return;
      const list15 = Array.isArray(this._marksRedo) ? this._marksRedo : [],
        value110 = list14.pop();
      (list15.push(value110),
        (this._marks = list14),
        (this._marksRedo = list15),
        this._renderMarksFn?.(),
        this._syncPointsToStore());
    },
    _redoMark() {
      const list16 = Array.isArray(this._marksRedo) ? this._marksRedo : [];
      if (!list16.length) return;
      const list17 = Array.isArray(this._marks) ? this._marks : [],
        value111 = list16.pop();
      (list17.push(value111),
        (this._marks = list17),
        (this._marksRedo = list16),
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
    init(nodeId, value112 = {}) {
      if (!nodeId) return;
      if (this.active) this.exit({ silent: true });
      const enabled30 = appStore.getState().nodes[nodeId];
      if (!enabled30) return;
      ((this.uiMode = value112?.uiMode === 'remove' ? 'remove' : 'keying'),
        (this._removePointTool = 'foreground'),
        (this._removeBrushSizePx = 40),
        (this._removeDraft = null),
        (this._removeDrawPointerId = null),
        (this._removeCursorHover = false),
        (this._removeCursorLast = { x: 0, y: 0 }));
      if (this._removeCursorRaf) cancelAnimationFrame(this._removeCursorRaf);
      ((this._removeCursorRaf = 0),
        (this.active = true),
        (this.nodeId = nodeId),
        (this._marks = []),
        (this._marksRedo = []),
        appStore.setVideoKeyingState({ active: true, nodeId: nodeId, pos_points: [], neg_points: [] }),
        (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())),
        (this._retryCount = 0),
        this._mountWhenReady());
    },
    _mountWhenReady() {
      const value113 = this.nodeId,
        value114 = () => {
          if (!this.active || this.nodeId !== value113) return;
          const enabled31 = document.getElementById(value113);
          if (!enabled31) {
            this._retryCount++;
            if (this._retryCount > 10) {
              this.exit({ silent: true });
              return;
            }
            this._retryRaf = requestAnimationFrame(value114);
            return;
          }
          ((this.wrapperEl = enabled31), this._applyFrozenUI(true), this._applyDimMode(true));
          try {
            window._spaceHeld = false;
            const el8 = document.getElementById('v2-wrap');
            if (el8) el8.style.cursor = '';
          } catch {}
          (this._createUI(), this._syncDurationAndDefaults(), this._bindEvents(), this._renderPlayhead());
        };
      this._retryRaf = requestAnimationFrame(value114);
    },
    _applyDimMode(value115) {
      const el9 = document.getElementById('v2-wrap');
      if (el9) {
        if (value115) el9.classList.add('is-video-keying-mode');
        else el9.classList.remove('is-video-keying-mode');
      }
      if (this.wrapperEl) {
        if (value115) this.wrapperEl.classList.add('is-video-keying-target');
        else this.wrapperEl.classList.remove('is-video-keying-target');
      }
    },
    _applyFrozenUI(value116) {
      if (!this.wrapperEl) return;
      const value117 = 'is-video-keying';
      if (value116) this.wrapperEl.classList.add(value117);
      else this.wrapperEl.classList.remove(value117);
      this._applyFrozenOverlaysHidden(value116);
    },
    _applyFrozenOverlaysHidden(value118) {
      if (!this.wrapperEl) return;
      if (value118) {
        if (Array.isArray(this._hiddenEls) && this._hiddenEls.length) return;
        const list18 = [
            '.video-controls',
            '.video-mute-btn',
            '.node-upload-hint',
            '.video-center-indicator',
            '.gen-video-center-indicator',
            '.multi-toggle-btn',
          ],
          list19 = [];
        (list18.forEach((item16) => {
          this.wrapperEl.querySelectorAll(item16).forEach((el10) => {
            (list19.push({ el: el10, prevDisplay: el10.style.display }), (el10.style.display = 'none'));
          });
        }),
          (this._hiddenEls = list19));
        return;
      }
      const list20 = Array.isArray(this._hiddenEls) ? this._hiddenEls : [];
      ((this._hiddenEls = null),
        list20.forEach(({ el: el11, prevDisplay: prevDisplay }) => {
          if (!el11 || !el11.isConnected) return;
          el11.style.display = prevDisplay || '';
        }));
    },
    _pauseAllWrapperVideos() {
      this.wrapperEl &&
        this.wrapperEl.querySelectorAll('video').forEach((enabled32) => {
          try {
            if (!enabled32.paused) enabled32.pause();
          } catch {}
        });
      if (this.videoEl)
        try {
          if (!this.videoEl.paused) this.videoEl.pause();
        } catch {}
    },
    _createRemoveToolbar() {
      const el12 = document.createElement('div');
      el12.className = 'v2-video-keying-erasebar v2-annotate-toolbar';
      const value119 = this._buildShortcutTooltip(videoKeyingText('tools.brush'), 'editor-tool-brush', 'B'),
        value120 = this._buildShortcutTooltip(videoKeyingText('tools.eraser'), 'editor-tool-eraser', 'E'),
        value121 = this._buildShortcutTooltip(videoKeyingText('tools.undo'), 'undo', 'Ctrl+Z'),
        value122 = this._buildShortcutTooltip(videoKeyingText('tools.redo'), 'redo', 'Ctrl+Shift+Z'),
        value123 = this._buildShortcutTooltip(videoKeyingText('tools.clear'), 'editor-clear', 'R');
      return (
        (el12.innerHTML =
          '\n      <button class="v2-annotate-btn icon-only act-cancel" data-tooltip="' +
          videoKeyingText('tools.cancel') +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg></button>\n      <div class="v2-annotate-divider"></div>\n      <button class="v2-annotate-btn icon-only tool-btn active" data-tool="brush" data-tooltip="' +
          value119 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="eraser" data-tooltip="' +
          value120 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20 20H7l-5-5a2 2 0 0 1 0-2.83l9.17-9.17a2 2 0 0 1 2.83 0L22 10a2 2 0 0 1 0 2.83L14.83 20"/></svg></button>\n      <div class="v2-annotate-size"><span class="v2-annotate-size-value"></span><input class="v2-annotate-size-range" type="range" min="1" max="120" step="1"></div>\n      <div class="v2-annotate-divider"></div>\n      <button class="v2-annotate-btn icon-only act-undo" data-tooltip="' +
          value121 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 14l-4-4 4-4"/><path d="M5 10h9a6 6 0 1 1 0 12h-3"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-redo" data-tooltip="' +
          value122 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M15 14l4-4-4-4"/><path d="M19 10H10a6 6 0 1 0 0 12h3"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-clear" data-tooltip="' +
          value123 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 16h10l1-16"/></svg></button>\n    '),
        (this.removeSizeValueEl = el12.querySelector('.v2-annotate-size-value')),
        (this.removeSizeRangeEl = el12.querySelector('.v2-annotate-size-range')),
        this.removeSizeRangeEl &&
          this.removeSizeValueEl &&
          (this._syncRemoveBrushControls(),
          this.removeSizeRangeEl.addEventListener('input', (event2) => {
            const value124 = this._clampRemoveBrushSize(event2.target.value);
            ((this._removeBrushSizePx = value124), this._syncRemoveBrushControls(), this._syncRemoveCursor());
          })),
        el12.addEventListener('pointerdown', (event3) => event3.stopPropagation()),
        el12.querySelector('.act-cancel')?.addEventListener('click', (event4) => {
          (event4.stopPropagation(), this.exit());
        }),
        el12.querySelector('[data-tool="brush"]')?.addEventListener('click', (event5) => {
          (event5.stopPropagation(), this._setRemovePointTool('foreground'));
        }),
        el12.querySelector('[data-tool="eraser"]')?.addEventListener('click', (event6) => {
          (event6.stopPropagation(), this._setRemovePointTool('background'));
        }),
        el12.querySelector('.act-undo')?.addEventListener('click', (event7) => {
          (event7.stopPropagation(), this._undoMark());
        }),
        el12.querySelector('.act-redo')?.addEventListener('click', (event8) => {
          (event8.stopPropagation(), this._redoMark());
        }),
        el12.querySelector('.act-clear')?.addEventListener('click', (event9) => {
          (event9.stopPropagation(),
            this._clearAllMarks(),
            window.showToast?.(videoKeyingText('toasts.clearedPoints'), 'info'));
        }),
        el12
      );
    },
    _createUI() {
      if (!this.wrapperEl) return;
      this.wrapperEl
        .querySelectorAll('.v2-video-keyingbar,.v2-video-keyinghint,.v2-video-keying-erasebar')
        .forEach((el13) => el13.remove());
      const el14 = document.createElement('div');
      el14.className = 'v2-video-keyingbar';
      const el15 = document.createElement('button');
      ((el15.type = 'button'),
        (el15.className = 'v2-video-clipbtn cancel'),
        (el15.title = videoKeyingText('tools.cancel')));
      {
        const value125 = 'http://www.w3.org/2000/svg',
          el16 = document.createElementNS(value125, 'svg');
        (el16.setAttribute('width', '20'),
          el16.setAttribute('height', '20'),
          el16.setAttribute('viewBox', '0 0 24 24'),
          el16.setAttribute('fill', 'none'),
          el16.setAttribute('stroke', 'currentColor'),
          el16.setAttribute('stroke-width', '2'));
        const el17 = document.createElementNS(value125, 'path');
        el17.setAttribute('d', 'M18 6L6 18');
        const el18 = document.createElementNS(value125, 'path');
        (el18.setAttribute('d', 'M6 6l12 12'),
          el16.appendChild(el17),
          el16.appendChild(el18),
          el15.appendChild(el16));
      }
      const el19 = document.createElement('button');
      ((el19.type = 'button'),
        (el19.className = 'prompt-submit img-gen-btn'),
        (el19.title = this._isRemoveUiMode()
          ? videoKeyingText('tools.remove')
          : videoKeyingText('tools.keying')));
      {
        const value126 = 'http://www.w3.org/2000/svg',
          el20 = document.createElementNS(value126, 'svg');
        (el20.setAttribute('width', '14'),
          el20.setAttribute('height', '14'),
          el20.setAttribute('viewBox', '0 0 24 24'),
          el20.setAttribute('fill', 'none'),
          el20.setAttribute('stroke', 'currentColor'),
          el20.setAttribute('stroke-width', '2'));
        const el21 = document.createElementNS(value126, 'line');
        (el21.setAttribute('x1', '12'),
          el21.setAttribute('y1', '19'),
          el21.setAttribute('x2', '12'),
          el21.setAttribute('y2', '5'));
        const el22 = document.createElementNS(value126, 'polyline');
        (el22.setAttribute('points', '5 12 12 5 19 12'),
          el20.appendChild(el21),
          el20.appendChild(el22),
          el19.appendChild(el20));
      }
      const value127 = appStore.getState().nodes?.[this.nodeId] || {},
        {
          fps: fps4,
          resolution: resolution3,
          instanceType: instanceType2,
        } = this._getRhVideoSettings(value127),
        value128 = this._getRhMaskMode(value127),
        value129 = {};
      !hasUsableKeyingSettingValue(value127.rhVideoFps) && (value129.rhVideoFps = fps4);
      !hasUsableKeyingSettingValue(value127.rhVideoResolution) && (value129.rhVideoResolution = resolution3);
      !hasUsableKeyingSettingValue(value127.rhMaskMode) && (value129.rhMaskMode = value128);
      !hasUsableKeyingSettingValue(value127.rhInstanceType) && (value129.rhInstanceType = instanceType2);
      if (Object.keys(value129).length)
        try {
          appStore.updateNodeData(this.nodeId, value129);
        } catch {}
      let el23 = document.createElement('div');
      el23.className = 'rh-keying-settings-wrap';
      const el24 = document.createElement('button');
      ((el24.type = 'button'),
        (el24.className = 'v2-video-clipbtn cancel rh-keying-settings-btn'),
        (el24.title = videoKeyingText('tools.settings')));
      {
        const value130 = 'http://www.w3.org/2000/svg',
          el25 = document.createElementNS(value130, 'svg');
        (el25.setAttribute('width', '20'),
          el25.setAttribute('height', '20'),
          el25.setAttribute('viewBox', '0 0 24 24'),
          el25.setAttribute('fill', 'none'),
          el25.setAttribute('stroke', 'currentColor'),
          el25.setAttribute('stroke-width', '2'));
        const el26 = document.createElementNS(value130, 'path');
        el26.setAttribute('d', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z');
        const el27 = document.createElementNS(value130, 'path');
        (el27.setAttribute(
          'd',
          'M19.4 15a1.7 1.7 0 0 0 .33 1.87l.06.06a2 2 0 0 1-1.42 3.42h-.2a2 2 0 0 1-1.41-.59l-.06-.06a1.7 1.7 0 0 0-1.87-.33 1.7 1.7 0 0 0-1.03 1.54V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.03-1.54 1.7 1.7 0 0 0-1.87.33l-.06.06a2 2 0 0 1-1.41.59h-.2a2 2 0 0 1-1.42-3.42l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.54-1.03H3a2 2 0 0 1 0-4h.06A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.33-1.87l-.06-.06A2 2 0 0 1 5.63 3.65h.2a2 2 0 0 1 1.41.59l.06.06A1.7 1.7 0 0 0 9.17 4.6a1.7 1.7 0 0 0 1.03-1.54V3a2 2 0 0 1 4 0v.06a1.7 1.7 0 0 0 1.03 1.54 1.7 1.7 0 0 0 1.87-.33l.06-.06a2 2 0 0 1 1.41-.59h.2A2 2 0 0 1 20.79 7.07l-.06.06A1.7 1.7 0 0 0 20.4 9c.32.55.86.92 1.54 1.03H22a2 2 0 0 1 0 4h-.06A1.7 1.7 0 0 0 19.4 15z',
        ),
          el25.appendChild(el27),
          el25.appendChild(el26),
          el24.appendChild(el25));
      }
      const el28 = document.createElement('div');
      ((el28.className = 'rh-keying-settings-menu'), el28.setAttribute('role', 'menu'));
      {
        const el29 = document.createElement('div');
        el29.className = 'rh-keying-settings-head';
        const el30 = document.createElement('span');
        ((el30.className = 'rh-keying-settings-title'),
          (el30.textContent = videoKeyingText('settings.title')),
          el29.appendChild(el30),
          el28.appendChild(el29));
      }
      {
        const el31 = document.createElement('div');
        el31.className = 'img-rp-quality-area';
        const el32 = document.createElement('div');
        el32.className = 'img-rp-section-label';
        const el33 = document.createElement('span');
        ((el33.className = 'rh-keying-label-resolution'),
          (el33.textContent = videoKeyingText('settings.resolution')));
        const el34 = document.createElement('span');
        ((el34.className = 'rh-tip rh-keying-tip-resolution'),
          el34.setAttribute('data-tooltip', videoKeyingText('settings.resolutionTip')),
          (el34.textContent = '!'),
          el32.appendChild(el33),
          el32.appendChild(el34));
        const el35 = document.createElement('div');
        ((el35.className = 'img-rp-quality-segmented'),
          [0x340, 0x400, 0x500, 0x5a0, 0x640, 0x6e0, 0x780].forEach((item17) => {
            const el36 = document.createElement('button');
            el36.type = 'button';
            const value131 = Number(item17) > 0x5a0;
            ((el36.className = (
              'img-rp-quality-item ' +
              (value131 ? 'dev-mode-only' : '') +
              ' rh-keying-res-btn ' +
              (Number(resolution3) === Number(item17) ? 'active' : '')
            ).trim()),
              (el36.dataset.value = String(item17)),
              (el36.textContent = String(item17)),
              el35.appendChild(el36));
          }),
          el31.appendChild(el32),
          el31.appendChild(el35),
          el28.appendChild(el31));
      }
      {
        const el37 = document.createElement('div');
        el37.className = 'rh-vram-adv-row';
        const el38 = document.createElement('div');
        el38.className = 'rh-vram-adv-label';
        const el39 = document.createElement('span');
        ((el39.className = 'rh-keying-label-fps'), (el39.textContent = videoKeyingText('settings.fps')));
        const el40 = document.createElement('span');
        ((el40.className = 'rh-tip rh-keying-tip-fps'),
          el40.setAttribute('data-tooltip', videoKeyingText('settings.fpsTip')),
          (el40.textContent = '!'),
          el38.appendChild(el39),
          el38.appendChild(el40));
        const el41 = document.createElement('div');
        ((el41.className = 'img-rp-quality-segmented rh-adv-seg rh-v5-fps-seg'),
          getRhKeyingFpsOptions().forEach((fps5) => {
            const el42 = document.createElement('button');
            ((el42.type = 'button'),
              (el42.className = (
                'img-rp-quality-item rh-keying-fps-btn ' + (Number(fps4) === Number(fps5) ? 'active' : '')
              ).trim()),
              (el42.dataset.value = String(fps5)),
              (el42.textContent = videoKeyingText('settings.fpsValue', { fps: fps5 })),
              el41.appendChild(el42));
          }),
          el37.appendChild(el38),
          el37.appendChild(el41),
          el28.appendChild(el37));
      }
      if (!this._isRemoveUiMode()) {
        const el43 = document.createElement('div');
        el43.className = 'rh-vram-adv-row';
        const el44 = document.createElement('div');
        el44.className = 'rh-vram-adv-label';
        const el45 = document.createElement('span');
        ((el45.className = 'rh-keying-label-mask-mode'),
          (el45.textContent = videoKeyingText('settings.maskMode')));
        const el46 = document.createElement('span');
        ((el46.className = 'rh-tip rh-keying-tip-mask-mode'),
          el46.setAttribute('data-tooltip', videoKeyingText('settings.maskModeTip')),
          (el46.textContent = '!'),
          el44.appendChild(el45),
          el44.appendChild(el46));
        const el47 = document.createElement('div');
        ((el47.className = 'img-rp-quality-segmented rh-adv-seg rh-keying-maskmode-seg'),
          [
            ['Sec', 'Sec'],
            ['Sam3', 'Sam3'],
            ['MA2', 'MA2'],
          ].forEach(([value132, value133]) => {
            const el48 = document.createElement('button');
            ((el48.type = 'button'),
              (el48.className = (
                'img-rp-quality-item rh-keying-maskmode-btn ' + (value128 === value132 ? 'active' : '')
              ).trim()),
              (el48.dataset.value = value132),
              (el48.textContent = value133),
              el47.appendChild(el48));
          }),
          el43.appendChild(el44),
          el43.appendChild(el47),
          el28.appendChild(el43));
      }
      {
        const el49 = document.createElement('div');
        el49.className = 'rh-vram-adv-row';
        const el50 = document.createElement('div');
        el50.className = 'rh-vram-adv-label';
        const el51 = document.createElement('span');
        ((el51.className = 'rh-keying-label-vram'), (el51.textContent = videoKeyingText('settings.vram')));
        const el52 = document.createElement('span');
        ((el52.className = 'rh-tip rh-keying-tip-vram'),
          el52.setAttribute('data-tooltip', videoKeyingText('settings.vramTip')),
          (el52.textContent = '!'),
          el50.appendChild(el51),
          el50.appendChild(el52));
        const el53 = document.createElement('div');
        ((el53.className = 'img-rp-quality-segmented rh-adv-seg rh-keying-vram-seg'),
          [
            ['default', '24G'],
            ['plus', '48G'],
          ].forEach(([value134, value135]) => {
            const el54 = document.createElement('button');
            ((el54.type = 'button'),
              (el54.className = (
                'img-rp-quality-item rh-keying-vram-btn ' + (instanceType2 === value134 ? 'active' : '')
              ).trim()),
              (el54.dataset.value = value134),
              (el54.textContent = value135),
              el53.appendChild(el54));
          }),
          el49.appendChild(el50),
          el49.appendChild(el53),
          el28.appendChild(el49));
      }
      (el23.appendChild(el24), el23.appendChild(el28));
      const value136 = document.createElement('button');
      ((value136.type = 'button'),
        (value136.className = 'v2-video-clipbtn cancel debug-wrench-btn rh-keying-debug-btn'),
        (value136.title = videoKeyingText('settings.debugParams')),
        applyDebugWrenchIcon(value136));
      const el55 = document.createElement('div');
      el55.className = 'v2-video-keyingrow';
      const el56 = document.createElement('div');
      el56.className = 'v2-video-keyingtrack';
      const value137 = document.createElement('div');
      value137.className = 'v2-video-keyingticks';
      const el57 = document.createElement('div');
      el57.className = 'v2-video-keyingthumbs';
      const list21 = [];
      for (let count10 = 0; count10 < 10; count10++) {
        const value138 = document.createElement('div');
        ((value138.className = 'v2-video-keyingthumb'), el57.appendChild(value138), list21.push(value138));
      }
      const value139 = document.createElement('div');
      ((value139.className = 'v2-video-keyingplayhead'),
        el56.appendChild(el57),
        el56.appendChild(value139),
        el56.appendChild(value137));
      const value140 = this._isRemoveUiMode();
      (el55.appendChild(el15), el55.appendChild(el56));
      if (el23) el55.appendChild(el23);
      if (value136) el55.appendChild(value136);
      el55.appendChild(el19);
      const el58 = document.createElement('div');
      el58.className = 'v2-video-keyinghelper-row';
      const value141 = document.createElement('div');
      ((value141.className = 'v2-video-keyinghelper-right'), el58.appendChild(value141));
      let el59 = null,
        value142 = null;
      if (value140) value142 = this._createRemoveToolbar();
      else {
        ((el59 = document.createElement('div')), (el59.className = 'v2-video-keyinghint'));
        const run2 = (value143, value144) => {
          const el60 = document.createElement('span');
          if (value144) el60.className = value144;
          return ((el60.textContent = value143), el60);
        };
        (el59.appendChild(run2(videoKeyingText('hint.leftClick'))),
          el59.appendChild(run2(videoKeyingText('hint.selectTarget'), 'v2-video-keyinghint--pos')),
          el59.appendChild(run2('  ')),
          el59.appendChild(run2(videoKeyingText('hint.rightClick'))),
          el59.appendChild(run2(videoKeyingText('hint.excludeTarget'), 'v2-video-keyinghint--neg')),
          el59.appendChild(run2(videoKeyingText('hint.shortcutPrefix'))),
          el59.appendChild(run2(this._getShortcutText('editor-clear', 'R'), 'v2-video-keyinghint-kbd')),
          el59.appendChild(run2(videoKeyingText('hint.clearAllPoints'))),
          el59.appendChild(run2('  ')),
          el59.appendChild(run2(this._getShortcutText('undo', 'Ctrl+Z'), 'v2-video-keyinghint-kbd')),
          el59.appendChild(run2(videoKeyingText('tools.undo'))),
          el59.appendChild(run2('  ')),
          el59.appendChild(run2(this._getShortcutText('redo', 'Ctrl+Shift+Z'), 'v2-video-keyinghint-kbd')),
          el59.appendChild(run2(videoKeyingText('tools.redo'))));
      }
      (el14.appendChild(el55),
        el14.appendChild(el58),
        value142 && this.wrapperEl.appendChild(value142),
        this.wrapperEl.appendChild(el14),
        el59 && this.wrapperEl.appendChild(el59),
        (this.barEl = el14),
        (this.hintEl = el59),
        (this.removeToolbarEl = value142),
        this._setRemovePointTool(this._removePointTool),
        (this.cancelBtnEl = el15),
        (this.confirmBtnEl = el19),
        (this.trackEl = el56),
        (this.playheadEl = value139),
        (this.thumbEls = list21),
        (this.helperRightEl = value141),
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
      (this.barEl?.querySelectorAll('.rh-keying-settings-btn').forEach((item18) => {
        item18.title = videoKeyingText('tools.settings');
      }),
        this.barEl?.querySelectorAll('.rh-keying-debug-btn').forEach((item19) => {
          item19.title = videoKeyingText('settings.debugParams');
        }));
      const run3 = (value145, value146) => {
          this.barEl?.querySelectorAll(value145).forEach((el61) => {
            el61.textContent = value146;
          });
        },
        handler3 = (value147, value148) => {
          this.barEl?.querySelectorAll(value147).forEach((el62) => {
            (el62.setAttribute('data-tooltip', value148), (el62.title = value148));
          });
        };
      (run3('.rh-keying-settings-title', videoKeyingText('settings.title')),
        run3('.rh-keying-label-resolution', videoKeyingText('settings.resolution')),
        handler3('.rh-keying-tip-resolution', videoKeyingText('settings.resolutionTip')),
        run3('.rh-keying-label-fps', videoKeyingText('settings.fps')),
        handler3('.rh-keying-tip-fps', videoKeyingText('settings.fpsTip')),
        run3('.rh-keying-label-mask-mode', videoKeyingText('settings.maskMode')),
        handler3('.rh-keying-tip-mask-mode', videoKeyingText('settings.maskModeTip')),
        run3('.rh-keying-label-vram', videoKeyingText('settings.vram')),
        handler3('.rh-keying-tip-vram', videoKeyingText('settings.vramTip')),
        this.barEl?.querySelectorAll('.rh-keying-fps-btn').forEach((fps6) => {
          fps6.textContent = videoKeyingText('settings.fpsValue', { fps: fps6.dataset.value });
        }),
        this._refreshRemoveShortcutUi(),
        this._refreshKeyingHintUi(),
        (this._lastHelperRightText = null),
        this._updateHelperRight());
    },
    _ensureMarkLayer() {
      if (!this.wrapperEl) return;
      const el63 = this.videoEl || this._getVideoEl();
      if (!el63) return;
      const el64 = el63.closest('.node-card') || el63.parentElement || null;
      if (!el64) return;
      this._detachMarkLayerListeners(this.markLayerEl);
      if (this.markLayerEl && this.markLayerEl.isConnected) this.markLayerEl.remove();
      this.wrapperEl.querySelectorAll('.v2-video-keying-marklayer').forEach((el65) => el65.remove());
      const el66 = document.createElement('div');
      el66.className = 'v2-video-keying-marklayer';
      if (this._isRemoveUiMode()) el66.classList.add('is-remove-mode');
      (el66.addEventListener('pointerdown', (event10) => {
        (event10.preventDefault(), event10.stopPropagation());
      }),
        el66.addEventListener('click', (event11) => {
          (event11.preventDefault(), event11.stopPropagation());
        }),
        el66.addEventListener('dblclick', (event12) => {
          (event12.preventDefault(), event12.stopPropagation());
        }),
        el66.addEventListener('contextmenu', (event13) => {
          (event13.preventDefault(), event13.stopPropagation());
        }));
      if (this._isRemoveUiMode()) {
        const value149 = document.createElement('canvas');
        ((value149.className = 'v2-video-keying-paintcanvas'),
          el66.appendChild(value149),
          (this.markCanvasEl = value149),
          (this.removeMaskCanvasEl = document.createElement('canvas')));
        const el67 = document.createElement('div');
        ((el67.className = 'v2-annotate-cursor v2-video-keying-cursor'),
          (el67.style.display = 'none'),
          el66.appendChild(el67),
          (this.removeCursorEl = el67),
          (this._removeCursorHover = false));
      } else
        ((this.markCanvasEl = null),
          (this.removeMaskCanvasEl = null),
          (this.removeCursorEl = null),
          (this._removeCursorHover = false));
      (el64.appendChild(el66), (this.markLayerEl = el66), this._attachMarkLayerListeners());
      this._isRemoveUiMode()
        ? ((this._onMarkWheel = (value150) => this._onRemoveCanvasWheel(value150)),
          el66.addEventListener('wheel', this._onMarkWheel, { passive: false }),
          (this._removeWheelCleanup = () => {
            this._onMarkWheel && el66.removeEventListener('wheel', this._onMarkWheel);
          }))
        : ((this._removeWheelCleanup = null), (this._onMarkWheel = null));
      this._syncRemoveCursor();
      if (!Array.isArray(this._marks)) this._marks = [];
    },
    _bindEvents() {
      if (!this.barEl) return;
      (this.cancelBtnEl?.addEventListener('click', (event14) => {
        (event14.stopPropagation(), this.exit());
      }),
        this.confirmBtnEl?.addEventListener('click', async (event15) => {
          (event15.preventDefault(), event15.stopPropagation());
          if (!this.active || !this.nodeId) return;
          const rhSourceNodeId = this.nodeId,
            value151 = this._rhTasks.get(rhSourceNodeId);
          if (value151 && value151.running) {
            await this._cancelRhTaskForSourceNode(rhSourceNodeId, { notify: true });
            return;
          }
          const value152 = appStore.getState().nodes?.[this.nodeId] || {},
            value153 = this.videoEl || this._getVideoEl(),
            value154 = Number(value153?.videoWidth) || 0,
            value155 = Number(value153?.videoHeight) || 0,
            timeSec = Number(value153?.currentTime) || 0,
            {
              fps: fps7,
              resolution: resolution4,
              instanceType: instanceType3,
            } = this._getRhVideoSettings(value152),
            rhMaskMode = this._getRhMaskMode(value152),
            rhVideoFrames = this._getSourceFrameCount(value152, fps7),
            { pos_points: pos_points5, neg_points: neg_points4 } = this.getPosNegPoints(),
            { w: w4, h: h4 } = this._calcKeyingFrameSize(value154, value155, resolution4),
            handler4 = (value156, value157, value158) => Math.max(value157, Math.min(value158, value156)),
            item20 = (box9) => ({
              x: Math.round(handler4(box9.x * w4, 0, Math.max(0, w4 - 1))),
              y: Math.round(handler4(box9.y * h4, 0, Math.max(0, h4 - 1))),
            }),
            list22 = w4 > 0 && h4 > 0 ? pos_points5.map(item20) : [],
            list23 = w4 > 0 && h4 > 0 ? neg_points4.map(item20) : [],
            value159 = list22.length ? JSON.stringify(list22) : '',
            value160 = list23.length ? JSON.stringify(list23) : '',
            pos_points6 = value159,
            neg_points5 = value160,
            frame_index = Math.max(0, Math.round(timeSec * fps7));
          try {
            const value161 = {
              frame_index: frame_index,
              rhVideoFps: fps7,
              rhVideoFrames: rhVideoFrames,
              rhVideoResolution: resolution4,
              rhInstanceType: instanceType3,
            };
            (!this._isRemoveUiMode() &&
              ((value161.positive = value159),
              (value161.negative = value160),
              (value161.pos_points = pos_points6),
              (value161.neg_points = neg_points5)),
              appStore.updateNodeData(this.nodeId, value161));
          } catch {}
          const videoUrl = this._resolveSourceVideoValue(value152);
          if (!videoUrl) {
            window.showToast?.(videoKeyingText('toasts.connectSourceVideoFirst'), 'warn');
            return;
          }
          let apiKey4 = '';
          try {
            apiKey4 = await getRunningHubWorkflowApiKey();
          } catch (value162) {
            window.showToast?.(videoKeyingText('toasts.configReadFailed'), 'error');
            return;
          }
          if (!apiKey4) {
            window.showToast?.(videoKeyingText('toasts.apiKeyMissing'), 'warn');
            return;
          }
          if (this._isRemoveUiMode()) {
            let maskImageDataUrl = '';
            try {
              maskImageDataUrl = this._exportRemoveMaskDataUrl(resolution4);
            } catch (error4) {
              window.showToast?.(error4?.message || videoKeyingText('errors.removeMaskFailed'), 'error');
              return;
            }
            const box10 = value152,
              { width: width2, height: height2 } = getAutoMediaSizeByShortSide(
                box10.width || 0x200,
                box10.height || 0x120,
              ),
              x6 = calcSafeSpawnPosNearNode(appStore.getState().nodes, box10, width2, height2),
              id = generateId('source-video-erase'),
              startedAt = Date.now();
            (appStore.addNode(
              buildSourceMediaNodePayload({
                id: id,
                type: 'source-video',
                x: x6.x,
                y: x6.y,
                width: width2,
                height: height2,
                name: videoKeyingText('output.removeGeneratingName'),
                src: '',
                localPath: '',
                ...buildGenerationStartPatch({ startedAt: startedAt }),
                provider: 'runninghubwf',
                model: getVideoKeyingModelId(),
                rhTaskId: '',
                rhTaskStatus: 'pending',
                rhTaskStartedAt: startedAt,
                rhTaskRecovering: false,
                rhTaskUseOpenapiQuery: false,
                rhSourceNodeId: rhSourceNodeId,
                rhToolbarTaskType: 'video-remove',
                fixedSize: true,
                outputText: buildVideoKeyingOutputText('remove', 'processing'),
              }),
            ),
              appStore.setSelectedNodes([id]));
            typeof window.v2FocusOnNodes === 'function'
              ? window.v2FocusOnNodes([rhSourceNodeId, id])
              : window.v2FocusOnNode?.(id);
            const abort = new AbortController(),
              id2 = Date.now() + '_' + Math.random().toString(36).slice(2),
              value163 = {
                id: id2,
                running: true,
                abort: abort,
                taskId: '',
                sourceNodeId: rhSourceNodeId,
                outId: id,
                apiKey: apiKey4,
                mode: 'remove',
              };
            (this._rhTasks.set(rhSourceNodeId, value163),
              this._notifyRhTaskChange(value163),
              this.exit({ silent: true, preserveRh: true }));
            try {
              const response = await this._submitRhVideoMattingRuntimeTask({
                sourceNodeId: rhSourceNodeId,
                outId: id,
                ctxId: id2,
                controller: abort,
                startTime: startedAt,
                taskType: 'video-remove',
                executionId: getVideoKeyingExecutionId('remove'),
                successName: videoKeyingText('output.removeResultName'),
                payload: {
                  provider: 'runninghubwf',
                  model: getVideoKeyingModelId(),
                  apiKey: apiKey4,
                  videoUrl: videoUrl,
                  maskImageDataUrl: maskImageDataUrl,
                  sourceFrameCount: rhVideoFrames,
                  rhVideoFps: fps7,
                  rhVideoResolution: resolution4,
                  rhInstanceType: instanceType3,
                },
              });
              if (!response.ok) throw response.error || new Error(videoKeyingText('errors.removeFailed'));
              (window._triggerLocalCacheSave?.(),
                window.showToast?.(videoKeyingText('toasts.removeSuccess'), 'success'));
            } catch (error5) {
              if (abort?.signal?.aborted) {
                const duration3 = this._computeGenerationDuration(id);
                appStore.updateNodeData(id, {
                  ...buildGenerationCancelledPatch({ startedAt: startedAt, duration: duration3 }),
                  name: videoKeyingText('output.removeResultName'),
                  rhTaskStatus: 'cancelled',
                  rhTaskRecovering: false,
                  outputText: buildVideoKeyingOutputText('remove', 'cancelled'),
                });
                return;
              }
              const error6 =
                  typeof error5?.getUserMessage === 'function'
                    ? error5.getUserMessage()
                    : error5 instanceof Error
                      ? error5.message
                      : String(error5 || videoKeyingText('errors.removeFailed')),
                duration4 = this._computeGenerationDuration(id);
              (appStore.updateNodeData(id, {
                ...buildVideoGenerationFailurePatch({
                  error: error6,
                  startedAt: startedAt,
                  duration: duration4,
                }),
                name: videoKeyingText('output.removeFailedName'),
                isGenerating: false,
                rhTaskStatus: 'failed',
                rhTaskRecovering: false,
                outputText: buildVideoKeyingOutputText('remove', 'failed', { reason: error6 }),
              }),
                window.showToast?.(videoKeyingText('toasts.removeFailed', { error: error6 }), 'error'));
            } finally {
              const value164 = this._rhTasks.get(rhSourceNodeId);
              value164 &&
                value164.id === id2 &&
                (this._rhTasks.delete(rhSourceNodeId), this._notifyRhTaskChange(value164));
            }
            return;
          }
          const name = value152,
            { width: width3, height: height3 } = getAutoMediaSizeByShortSide(
              name.width || 0x200,
              name.height || 0x120,
            ),
            x7 = calcSafeSpawnPosNearNode(appStore.getState().nodes, name, width3, height3),
            id3 = generateId('source-video-matting'),
            startedAt2 = Date.now();
          (appStore.addNode(
            buildSourceMediaNodePayload({
              id: id3,
              type: 'source-video',
              x: x7.x,
              y: x7.y,
              width: width3,
              height: height3,
              name: videoKeyingText('output.keyingResultName', {
                name: name.name || videoKeyingText('output.videoFallback'),
              }),
              src: '',
              localPath: '',
              ...buildGenerationStartPatch({ startedAt: startedAt2 }),
              provider: 'runninghubwf',
              model: getVideoKeyingModelId(),
              rhTaskId: '',
              rhTaskStatus: 'pending',
              rhTaskStartedAt: startedAt2,
              rhTaskRecovering: false,
              rhTaskUseOpenapiQuery: false,
              rhSourceNodeId: rhSourceNodeId,
              rhToolbarTaskType: 'video-keying',
              fixedSize: true,
              outputText: buildVideoKeyingOutputText('keying', 'processing'),
            }),
          ),
            appStore.setSelectedNodes([id3]),
            commit(),
            window.v2FocusOnNodes?.([this.nodeId, id3]));
          const abort2 = new AbortController(),
            id4 = Date.now() + '_' + Math.random().toString(36).slice(2),
            value165 = {
              id: id4,
              running: true,
              abort: abort2,
              taskId: '',
              sourceNodeId: rhSourceNodeId,
              outId: id3,
              apiKey: apiKey4,
              mode: 'keying',
            };
          (this._rhTasks.set(rhSourceNodeId, value165),
            this._notifyRhTaskChange(value165),
            window.showToast?.(videoKeyingText('toasts.keyingSubmitting'), 'info'),
            this.exit({ silent: true, preserveRh: true }));
          try {
            const response2 = await this._submitRhVideoMattingRuntimeTask({
              sourceNodeId: rhSourceNodeId,
              outId: id3,
              ctxId: id4,
              controller: abort2,
              startTime: startedAt2,
              taskType: 'video-keying',
              executionId: getVideoKeyingExecutionId('keying'),
              payload: {
                provider: 'runninghubwf',
                model: getVideoKeyingModelId(),
                apiKey: apiKey4,
                videoUrl: videoUrl,
                pos_points: pos_points6,
                neg_points: neg_points5,
                frame_index: frame_index,
                timeSec: timeSec,
                frameRate: fps7,
                frameCount: rhVideoFrames,
                rhVideoFps: fps7,
                rhVideoFrames: rhVideoFrames,
                rhVideoResolution: resolution4,
                rhInstanceType: instanceType3,
                rhMaskMode: rhMaskMode,
              },
            });
            if (!response2.ok) throw response2.error || new Error(videoKeyingText('errors.keyingFailed'));
            (window._triggerLocalCacheSave?.(),
              window.showToast?.(videoKeyingText('toasts.keyingSuccess'), 'success'));
          } catch (error7) {
            if (abort2?.signal?.aborted) {
              try {
                const value166 = appStore.getState().nodes?.[id3];
                if (value166) {
                  const value167 = String(value166.outputText || '');
                  if (!isVideoKeyingCancelledOutputText(value167)) {
                    const duration5 = this._computeGenerationDuration(id3);
                    appStore.updateNodeData(id3, {
                      ...buildGenerationCancelledPatch({ startedAt: startedAt2, duration: duration5 }),
                      rhTaskStatus: 'cancelled',
                      rhTaskRecovering: false,
                      outputText: buildVideoKeyingOutputText('keying', 'cancelled'),
                    });
                  }
                }
              } catch {}
              return;
            }
            const error8 =
                typeof error7?.getUserMessage === 'function'
                  ? error7.getUserMessage()
                  : error7 instanceof Error
                    ? error7.message
                    : String(error7 || videoKeyingText('errors.keyingFailed')),
              duration6 = this._computeGenerationDuration(id3);
            (appStore.updateNodeData(id3, {
              ...buildVideoGenerationFailurePatch({
                error: error8,
                startedAt: startedAt2,
                duration: duration6,
              }),
              isGenerating: false,
              rhTaskStatus: 'failed',
              rhTaskRecovering: false,
              outputText: buildVideoKeyingOutputText('keying', 'failed', { reason: error8 }),
            }),
              window.showToast?.(videoKeyingText('toasts.keyingFailed', { error: error8 }), 'error'));
          } finally {
            const value168 = this._rhTasks.get(rhSourceNodeId);
            value168 &&
              value168.id === id4 &&
              (this._rhTasks.delete(rhSourceNodeId), this._notifyRhTaskChange(value168));
          }
        }));
      const el68 = this.barEl.querySelector('.rh-keying-settings-wrap'),
        el69 = this.barEl.querySelector('.rh-keying-settings-btn'),
        el70 = this.barEl.querySelector('.rh-keying-settings-menu');
      if (el68 && el69 && el70) {
        const run4 = () => {
          const value169 = appStore.getState().nodes?.[this.nodeId] || {},
            {
              fps: fps8,
              resolution: resolution5,
              instanceType: instanceType4,
            } = this._getRhVideoSettings(value169),
            value170 = this._getRhMaskMode(value169);
          (el70
            .querySelectorAll('.rh-keying-res-btn')
            .forEach((el71) => el71.classList.toggle('active', Number(el71.dataset.value) === resolution5)),
            el70
              .querySelectorAll('.rh-keying-fps-btn')
              .forEach((el72) => el72.classList.toggle('active', Number(el72.dataset.value) === fps8)),
            el70
              .querySelectorAll('.rh-keying-maskmode-btn')
              .forEach((el73) => el73.classList.toggle('active', el73.dataset.value === value170)),
            el70
              .querySelectorAll('.rh-keying-vram-btn')
              .forEach((el74) => el74.classList.toggle('active', el74.dataset.value === instanceType4)));
        };
        (el68.addEventListener('click', (event16) => event16.stopPropagation()),
          el70.addEventListener('click', (event17) => event17.stopPropagation()),
          el69.addEventListener('click', (event18) => {
            (event18.preventDefault(), event18.stopPropagation());
            const run5 = () => {
                (el68.classList.remove('show'),
                  this._onKeyingSettingsDocDown &&
                    (document.removeEventListener('pointerdown', this._onKeyingSettingsDocDown, true),
                    (this._onKeyingSettingsDocDown = null)));
              },
              enabled33 = !el68.classList.contains('show');
            if (!enabled33) {
              run5();
              return;
            }
            (el68.classList.add('show'),
              run4(),
              !this._onKeyingSettingsDocDown &&
                ((this._onKeyingSettingsDocDown = (event19) => {
                  if (el68.contains(event19.target)) return;
                  run5();
                }),
                document.addEventListener('pointerdown', this._onKeyingSettingsDocDown, true)));
          }),
          el70.querySelectorAll('.rh-keying-fps-btn').forEach((el75) => {
            el75.addEventListener('click', (event20) => {
              (event20.preventDefault(), event20.stopPropagation());
              const value171 = Number(el75.dataset.value),
                rhVideoFps = normalizeRhKeyingFps(value171);
              try {
                const rhVideoFrames2 = Math.max(
                    1,
                    Math.round((Number(this.durationSec) || 0) * rhVideoFps) || 1,
                  ),
                  value172 = this.videoEl || this._getVideoEl(),
                  value173 = Math.max(
                    0,
                    Math.min(Number(this.durationSec) || 0, Number(value172?.currentTime) || 0),
                  ),
                  frame_index2 = Math.max(0, Math.round(value173 * rhVideoFps));
                appStore.updateNodeData(this.nodeId, {
                  rhVideoFps: rhVideoFps,
                  rhVideoFrames: rhVideoFrames2,
                  frame_index: frame_index2,
                });
              } catch {}
              (run4(), this._updateHelperRight());
            });
          }),
          el70.querySelectorAll('.rh-keying-maskmode-btn').forEach((el76) => {
            el76.addEventListener('click', (event21) => {
              (event21.preventDefault(), event21.stopPropagation());
              const rhMaskMode2 = this._normalizeRhMaskMode(el76.dataset.value);
              try {
                appStore.updateNodeData(this.nodeId, { rhMaskMode: rhMaskMode2 });
              } catch {}
              run4();
            });
          }),
          el70.querySelectorAll('.rh-keying-res-btn').forEach((el77) => {
            el77.addEventListener('click', (event22) => {
              (event22.preventDefault(), event22.stopPropagation());
              const value174 = Math.trunc(Number(el77.dataset.value)),
                rhVideoResolution = [0x340, 0x400, 0x500, 0x5a0, 0x640, 0x6e0, 0x780].includes(value174)
                  ? value174
                  : 0x400;
              try {
                appStore.updateNodeData(this.nodeId, { rhVideoResolution: rhVideoResolution });
              } catch {}
              (run4(), this._updateHelperRight());
            });
          }),
          el70.querySelectorAll('.rh-keying-vram-btn').forEach((el78) => {
            el78.addEventListener('click', (event23) => {
              (event23.preventDefault(), event23.stopPropagation());
              const rhInstanceType = el78.dataset.value === 'plus' ? 'plus' : 'default';
              try {
                appStore.updateNodeData(this.nodeId, { rhInstanceType: rhInstanceType });
              } catch {}
              run4();
            });
          }));
      }
      const el79 = this.barEl.querySelector('.rh-keying-debug-btn');
      el79 &&
        el79.addEventListener('click', async (event24) => {
          (event24.preventDefault(), event24.stopPropagation());
          const value175 = appStore.getState().nodes?.[this.nodeId] || {},
            value176 = this.videoEl || this._getVideoEl(),
            timeSec2 = Number(value176?.currentTime) || 0,
            value177 = Number(value176?.videoWidth) || 0,
            value178 = Number(value176?.videoHeight) || 0,
            {
              fps: fps9,
              resolution: resolution6,
              instanceType: instanceType5,
            } = this._getRhVideoSettings(value175),
            rhMaskMode3 = this._getRhMaskMode(value175),
            sourceFrameCount = this._getSourceFrameCount(value175, fps9),
            videoUrl2 = this._resolveSourceVideoValue(value175),
            { pos_points: pos_points7, neg_points: neg_points6 } = this.getPosNegPoints(),
            { w: w5, h: h5 } = this._calcKeyingFrameSize(value177, value178, resolution6),
            handler5 = (value179, value180, value181) => Math.max(value180, Math.min(value181, value179)),
            item21 = (box11) => ({
              x: Math.round(handler5(box11.x * w5, 0, Math.max(0, w5 - 1))),
              y: Math.round(handler5(box11.y * h5, 0, Math.max(0, h5 - 1))),
            }),
            list24 = w5 > 0 && h5 > 0 ? pos_points7.map(item21) : [],
            list25 = w5 > 0 && h5 > 0 ? neg_points6.map(item21) : [],
            pos_points8 = list24.length ? JSON.stringify(list24) : '',
            neg_points7 = list25.length ? JSON.stringify(list25) : '';
          let apiKey5 = '';
          try {
            apiKey5 = await getRunningHubWorkflowApiKey();
          } catch {
            window.showToast?.(videoKeyingText('toasts.configReadFailed'), 'error');
            return;
          }
          let value182 = null;
          if (this._isRemoveUiMode()) {
            let maskImageDataUrl2 = '';
            try {
              maskImageDataUrl2 = this._exportRemoveMaskDataUrl(resolution6);
            } catch (error9) {
              window.showToast?.(
                videoKeyingText('toasts.debugBuildFailed', {
                  error: error9?.message || videoKeyingText('errors.maskExportFailed'),
                }),
                'error',
              );
              return;
            }
            value182 = {
              provider: 'runninghubwf',
              model: getVideoKeyingModelId(),
              apiKey: apiKey5,
              videoUrl: videoUrl2,
              maskImageDataUrl: maskImageDataUrl2,
              sourceFrameCount: sourceFrameCount,
              rhVideoFps: fps9,
              rhVideoResolution: resolution6,
              rhInstanceType: instanceType5,
            };
          } else
            value182 = {
              provider: 'runninghubwf',
              model: getVideoKeyingModelId(),
              apiKey: apiKey5,
              videoUrl: videoUrl2,
              pos_points: pos_points8,
              neg_points: neg_points7,
              timeSec: timeSec2,
              frame_index: Math.max(0, Math.round(timeSec2 * fps9)),
              rhVideoFps: fps9,
              rhVideoFrames: Number.isFinite(value175.rhVideoFrames)
                ? Math.max(0, Math.trunc(value175.rhVideoFrames))
                : sourceFrameCount,
              rhVideoResolution: resolution6,
              rhInstanceType: instanceType5,
              rhMaskMode: rhMaskMode3,
            };
          try {
            const generateVideoRequest = await buildGenerateVideoRequest(value182),
              outputText5 = formatFinalApiDebugRequest(generateVideoRequest),
              value183 = appStore.getState(),
              box12 = value183.nodes?.[this.nodeId] || {},
              x8 = (box12.x || 0) + (box12.width || 0x17c) + 50,
              y6 = box12.y || 0;
            let enabled34 = Object.values(value183.nodes || {}).find(
              (item22) => item22 && item22.type === 'debug',
            );
            (!enabled34
              ? appStore.addNode({
                  id: 'debug-' + Date.now(),
                  type: 'debug',
                  x: x8,
                  y: y6,
                  width: 0x1a4,
                  height: 0x168,
                  name: videoKeyingText('debug.nodeName'),
                  outputText: outputText5,
                })
              : appStore.updateNodeData(enabled34.id, { outputText: outputText5, x: x8, y: y6 }),
              window.showToast?.(
                this._isRemoveUiMode()
                  ? videoKeyingText('toasts.debugRemoveShown')
                  : videoKeyingText('toasts.debugKeyingShown'),
                'info',
              ));
          } catch (error10) {
            window.showToast?.(
              videoKeyingText('toasts.debugFailed', {
                error: error10?.message || videoKeyingText('errors.unknown'),
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
      const run6 = (value184) => {
          const box13 = this.trackEl?.getBoundingClientRect(),
            count11 = this.durationSec;
          if (!box13 || !box13.width || !Number.isFinite(count11) || count11 <= 0) return;
          const value185 = Math.max(0, Math.min(1, (value184 - box13.left) / box13.width)),
            value186 = value185 * count11,
            value187 = this.videoEl || this._getVideoEl();
          if (value187) value187.currentTime = Math.max(0, Math.min(count11, value186));
          this._renderPlayhead();
        },
        handler6 = (el80, value188) => {
          if (el80 && this._onPointerMove) el80.removeEventListener('pointermove', this._onPointerMove);
          if (el80 && this._onPointerUp) el80.removeEventListener('pointerup', this._onPointerUp);
          if (el80 && this._onPointerCancel) el80.removeEventListener('pointercancel', this._onPointerCancel);
          if (el80 && this._onPointerCancel)
            el80.removeEventListener('lostpointercapture', this._onPointerCancel);
          ((this._onPointerMove = null), (this._onPointerUp = null), (this._onPointerCancel = null));
          try {
            if (el80 && Number.isFinite(value188)) el80.releasePointerCapture(value188);
          } catch {}
        },
        value189 = (event25) => {
          if (!this.active || !this.trackEl) return;
          (event25.preventDefault(),
            event25.stopPropagation(),
            this._pauseAllWrapperVideos(),
            run6(event25.clientX));
          const el81 = this.trackEl,
            value190 = event25.pointerId;
          try {
            if (Number.isFinite(value190)) el81.setPointerCapture(value190);
          } catch {}
          ((this._onPointerMove = (event26) => {
            if (Number.isFinite(value190) && event26.pointerId !== value190) return;
            (event26.preventDefault(), run6(event26.clientX));
          }),
            (this._onPointerUp = (event27) => {
              if (Number.isFinite(value190) && event27.pointerId !== value190) return;
              (event27.preventDefault(), handler6(el81, value190), this._pauseAllWrapperVideos());
            }),
            (this._onPointerCancel = (event28) => {
              if (Number.isFinite(value190) && event28.pointerId !== value190) return;
              (handler6(el81, value190), this._pauseAllWrapperVideos());
            }),
            el81.addEventListener('pointermove', this._onPointerMove),
            el81.addEventListener('pointerup', this._onPointerUp),
            el81.addEventListener('pointercancel', this._onPointerCancel),
            el81.addEventListener('lostpointercapture', this._onPointerCancel));
        };
      (this.playheadEl?.addEventListener('pointerdown', value189),
        this.trackEl?.addEventListener('pointerdown', value189),
        (this._onKeyDown = (event29) => {
          if (!this.active) return;
          if (
            event29.target &&
            (event29.target.tagName === 'INPUT' ||
              event29.target.tagName === 'TEXTAREA' ||
              event29.target.isContentEditable)
          )
            return;
          if (event29.key === 'Escape') {
            (event29.preventDefault(), event29.stopPropagation(), this.exit());
            return;
          }
          if (this._isRemoveUiMode()) {
            const handleShortcutKeydown2 = handleShortcutKeydown(event29, {
              mattingActive: false,
              annotateActive: false,
              videoKeyingActive: true,
              featureModeActive: true,
              selectedNodeType: 'source-video',
            });
            if (!handleShortcutKeydown2) return;
            if (handleShortcutKeydown2 === 'editor-tool-brush') {
              (event29.preventDefault(), event29.stopPropagation(), this._setRemovePointTool('foreground'));
              return;
            }
            if (handleShortcutKeydown2 === 'editor-tool-eraser') {
              (event29.preventDefault(), event29.stopPropagation(), this._setRemovePointTool('background'));
              return;
            }
            if (handleShortcutKeydown2 === 'editor-clear') {
              (event29.preventDefault(),
                event29.stopPropagation(),
                this._clearAllMarks(),
                window.showToast?.(videoKeyingText('toasts.clearedPoints'), 'info'));
              return;
            }
            if (handleShortcutKeydown2 === 'undo') {
              (event29.preventDefault(), event29.stopPropagation(), this._undoMark());
              return;
            }
            if (handleShortcutKeydown2 === 'redo') {
              (event29.preventDefault(), event29.stopPropagation(), this._redoMark());
              return;
            }
            return;
          }
          const value191 = (event29.ctrlKey || event29.metaKey) && !event29.altKey;
          if (value191 && !event29.shiftKey && (event29.key === 'z' || event29.key === 'Z')) {
            (event29.preventDefault(), event29.stopPropagation(), this._undoMark());
            return;
          }
          if (
            value191 &&
            ((event29.shiftKey && (event29.key === 'z' || event29.key === 'Z')) ||
              (!event29.shiftKey && (event29.key === 'y' || event29.key === 'Y')))
          ) {
            (event29.preventDefault(), event29.stopPropagation(), this._redoMark());
            return;
          }
          (event29.key === 'r' || event29.key === 'R') &&
            !event29.altKey &&
            !event29.ctrlKey &&
            !event29.metaKey &&
            (event29.preventDefault(),
            event29.stopPropagation(),
            this._clearAllMarks(),
            window.showToast?.(videoKeyingText('toasts.clearedPoints'), 'info'));
        }),
        window.addEventListener('keydown', this._onKeyDown, true));
      const run7 = () => {
        const enabled35 = this.markLayerEl,
          enabled36 = this.videoEl || this._getVideoEl(),
          list26 = Array.isArray(this._marks) ? this._marks : [];
        if (!enabled35 || !enabled36) return;
        const enabled37 = this._getVideoProjection(enabled36),
          enabled38 = this._getLayerProjection(enabled35);
        if (!enabled37 || !enabled38) return;
        if (this._isRemoveUiMode()) {
          const el82 = this.markCanvasEl;
          if (!el82) return;
          const width4 = Math.max(1, Math.round(enabled38.lw)),
            height4 = Math.max(1, Math.round(enabled38.lh)),
            value192 = window.devicePixelRatio || 1,
            value193 = Math.round(width4 * value192),
            value194 = Math.round(height4 * value192);
          (el82.width !== value193 || el82.height !== value194) &&
            ((el82.width = value193),
            (el82.height = value194),
            (el82.style.width = width4 + 'px'),
            (el82.style.height = height4 + 'px'));
          const ctx3 = el82.getContext('2d');
          if (!ctx3) return;
          (ctx3.setTransform(value192, 0, 0, value192, 0, 0), ctx3.clearRect(0, 0, width4, height4));
          const maskCanvas = this.removeMaskCanvasEl || document.createElement('canvas');
          (maskCanvas.width !== Math.round(width4) || maskCanvas.height !== Math.round(height4)) &&
            ((maskCanvas.width = Math.max(1, Math.round(width4))),
            (maskCanvas.height = Math.max(1, Math.round(height4))));
          this.removeMaskCanvasEl = maskCanvas;
          const ctx4 = maskCanvas.getContext('2d');
          if (!ctx4) return;
          (ctx4.clearRect(0, 0, maskCanvas.width, maskCanvas.height),
            (ctx4.lineCap = 'round'),
            (ctx4.lineJoin = 'round'));
          const run8 = (type) => {
            if (!type || (type.type !== 'brush' && type.type !== 'eraser')) return;
            const list27 = Array.isArray(type.points) ? type.points : [];
            if (!list27.length) return;
            const points3 = list27
              .map((item23) =>
                this._normalizedToLayerPoint(Number(item23?.nx), Number(item23?.ny), enabled38, enabled37),
              )
              .filter((box14) => Number.isFinite(box14.x) && Number.isFinite(box14.y));
            if (!points3.length) return;
            drawEraseMaskCommand(ctx4, {
              type: type.type === 'eraser' ? 'eraser' : 'brush',
              points: points3,
              lineWidth: getBrushLineWidth(this._clampRemoveBrushSize(type.brushSizePx), 1, type.type),
            });
          };
          list26.forEach(run8);
          if (this._removeDraft) run8(this._removeDraft);
          const checkerPattern =
            createEraseCheckerboardPattern(ctx3, 1) || getEraseCanvasPalette().checkerAccent;
          compositeCheckerMask(ctx3, {
            maskCanvas: maskCanvas,
            width: width4,
            height: height4,
            checkerPattern: checkerPattern,
            checkerZoom: 1,
            checkerAlpha: 0.8,
          });
          return;
        }
        if (!list26.length) {
          enabled35.replaceChildren();
          return;
        }
        const el83 = document.createDocumentFragment();
        for (let value195 = 0; value195 < list26.length; value195++) {
          const value196 = list26[value195],
            el84 = document.createElement('div'),
            value197 = value196 && typeof value196.pointType === 'string' ? value196.pointType : 'foreground';
          el84.className =
            value197 === 'background'
              ? 'v2-video-keying-mark v2-video-keying-mark--background'
              : 'v2-video-keying-mark v2-video-keying-mark--foreground';
          if (this._isRemoveUiMode()) {
            const value198 = this._clampRemoveBrushSize(value196.brushSizePx || this._removeBrushSizePx),
              value199 = Math.max(8, Math.min(30, Math.round(value198 / 4)));
            ((el84.style.width = value199 + 'px'), (el84.style.height = value199 + 'px'));
          }
          const box15 = this._normalizedToLayerPoint(
            Number(value196.nx),
            Number(value196.ny),
            enabled38,
            enabled37,
          );
          if (!box15) continue;
          ((el84.style.left = box15.x + 'px'), (el84.style.top = box15.y + 'px'), el83.appendChild(el84));
        }
        enabled35.replaceChildren(el83);
      };
      this._renderMarksFn = run7;
      const event30 = { down: false, pointerId: null },
        handler7 = (enabled39 = true) => {
          const value200 = this.markLayerEl,
            value201 = event30.pointerId;
          if (value200 && Number.isFinite(value201))
            try {
              value200.releasePointerCapture(value201);
            } catch {}
          ((event30.down = false), (event30.pointerId = null), (this._removeDrawPointerId = null));
          const type2 = this._removeDraft;
          this._removeDraft = null;
          if (!enabled39 || !type2) {
            this._renderMarksFn?.();
            return;
          }
          const points4 = Array.isArray(type2.points)
            ? type2.points
                .map((item24) => ({
                  nx: Math.max(0, Math.min(1, Number(item24?.nx) || 0)),
                  ny: Math.max(0, Math.min(1, Number(item24?.ny) || 0)),
                }))
                .filter((item25) => Number.isFinite(item25.nx) && Number.isFinite(item25.ny))
            : [];
          if (!points4.length) {
            this._renderMarksFn?.();
            return;
          }
          const list28 = Array.isArray(this._marks) ? this._marks : [];
          (list28.push({
            type: type2.type === 'eraser' ? 'eraser' : 'brush',
            brushSizePx: this._clampRemoveBrushSize(type2.brushSizePx),
            points: points4,
          }),
            (this._marks = list28),
            (this._marksRedo = []),
            this._syncPointsToStore(),
            this._renderMarksFn?.());
        };
      ((this._onMarkPointerDown = (event31) => {
        if (!this.active) return;
        if (event31.detail && event31.detail > 1) return;
        if (!this.markLayerEl || !this.markLayerEl.contains(event31.target)) return;
        (event31.preventDefault(),
          event31.stopPropagation(),
          this._pauseAllWrapperVideos(),
          this._scheduleRemoveCursor(event31.clientX, event31.clientY));
        const nx = this._pickFromClient(event31.clientX, event31.clientY);
        if (!nx) return;
        if (this._isRemoveUiMode()) {
          if (event31.button !== 0) return;
          Array.isArray(this._marksRedo) && this._marksRedo.length && (this._marksRedo = []);
          const type3 = this._getRemoveToolType();
          ((this._removeDraft = {
            type: type3,
            brushSizePx: this._clampRemoveBrushSize(this._removeBrushSizePx),
            points: [{ nx: nx.nx, ny: nx.ny }],
          }),
            (event30.down = true),
            (event30.pointerId = event31.pointerId),
            (this._removeDrawPointerId = event31.pointerId));
          try {
            if (Number.isFinite(event31.pointerId)) this.markLayerEl.setPointerCapture(event31.pointerId);
          } catch {}
          this._renderMarksFn?.();
          return;
        }
        const list29 = Array.isArray(this._marks) ? this._marks : [];
        Array.isArray(this._marksRedo) && this._marksRedo.length && (this._marksRedo = []);
        const value202 = this.videoEl,
          t = Number(value202?.currentTime) || 0;
        if (event31.button !== 0 && event31.button !== 2) return;
        let pointType = event31.button === 2 ? 'background' : 'foreground';
        (this._isRemoveUiMode() &&
          event31.button === 0 &&
          (pointType = this._removePointTool === 'background' ? 'background' : 'foreground'),
          list29.push({
            nx: nx.nx,
            ny: nx.ny,
            t: t,
            pointType: pointType,
            brushSizePx: this._isRemoveUiMode()
              ? this._clampRemoveBrushSize(this._removeBrushSizePx)
              : undefined,
          }),
          (this._marks = list29),
          run7(),
          this._syncPointsToStore());
      }),
        (this._onMarkPointerMove = (event32) => {
          if (!this.active || !this._isRemoveUiMode()) return;
          this._scheduleRemoveCursor(event32.clientX, event32.clientY);
          if (!event30.down || !this._removeDraft) return;
          if (Number.isFinite(event30.pointerId) && event32.pointerId !== event30.pointerId) return;
          (event32.preventDefault(), event32.stopPropagation());
          const nx2 = this._pickFromClient(event32.clientX, event32.clientY);
          if (!nx2) return;
          const list30 = this._removeDraft.points;
          if (!Array.isArray(list30) || !list30.length) {
            ((this._removeDraft.points = [{ nx: nx2.nx, ny: nx2.ny }]), this._renderMarksFn?.());
            return;
          }
          const value203 = list30[list30.length - 1],
            count12 = Math.hypot(Number(nx2.nx) - Number(value203.nx), Number(nx2.ny) - Number(value203.ny));
          if (count12 < 0.0006) return;
          (list30.push({ nx: nx2.nx, ny: nx2.ny }), this._renderMarksFn?.());
        }),
        (this._onMarkPointerUp = (event33) => {
          if (!this.active || !this._isRemoveUiMode()) return;
          this._scheduleRemoveCursor(event33.clientX, event33.clientY);
          if (Number.isFinite(event30.pointerId) && event33.pointerId !== event30.pointerId) return;
          (event33.preventDefault(), event33.stopPropagation(), handler7(true));
        }),
        (this._onMarkPointerCancel = (event34) => {
          if (!this.active || !this._isRemoveUiMode()) return;
          if (Number.isFinite(event30.pointerId) && event34.pointerId !== event30.pointerId) return;
          handler7(true);
        }),
        (this._onMarkPointerEnter = (event35) => {
          if (!this._isRemoveUiMode()) return;
          ((this._removeCursorHover = true), this._scheduleRemoveCursor(event35.clientX, event35.clientY));
        }),
        (this._onMarkPointerLeave = () => {
          if (!this._isRemoveUiMode()) return;
          ((this._removeCursorHover = false), this._syncRemoveCursor());
        }),
        this._detachMarkLayerListeners(),
        this._attachMarkLayerListeners(),
        run7(),
        (this._onResize = () => {
          if (!this.active) return;
          (this._renderMarksFn?.(), this._syncRemoveCursor());
        }),
        window.addEventListener('resize', this._onResize));
    },
    _getVideoEl() {
      if (!this.wrapperEl) return null;
      const value204 = Array.from(this.wrapperEl.querySelectorAll('video'));
      for (const el85 of value204) {
        if (!el85) continue;
        const value205 = window.getComputedStyle(el85);
        if (value205.display === 'none' || value205.visibility === 'hidden') continue;
        const count13 = Number(value205.opacity);
        if (Number.isFinite(count13) && count13 <= 0) continue;
        const box16 = el85.getBoundingClientRect();
        if (!box16.width || !box16.height) continue;
        return el85;
      }
      return null;
    },
    _readDurationSec(enabled40) {
      if (!enabled40) return 0;
      const count14 = Number(enabled40.duration);
      if (Number.isFinite(count14) && count14 > 0) return count14;
      const list31 = enabled40.seekable;
      if (list31 && list31.length) {
        const count15 = Number(list31.end(list31.length - 1));
        if (Number.isFinite(count15) && count15 > 0) return count15;
      }
      return 0;
    },
    async _syncDurationAndDefaults() {
      ((this.videoEl = this._getVideoEl()), this._ensureMarkLayer());
      if (this.videoEl) {
        const value206 = this._resolveVideoSrcFromNode(appStore.getState().nodes?.[this.nodeId]),
          value207 = String(value206 || '').trim(),
          value208 = String(this.videoEl.dataset?.videoKeyingSourceUrl || '').trim(),
          value209 = ++this._sourceToken;
        setVideoKeyingMediaKeepAlive(this.videoEl, true);
        if (value207 && value208 !== value207) {
          await attachVideoKeyingPlaybackSource(this.videoEl, value207);
          if (!this.active || value209 !== this._sourceToken) return;
          this.videoEl.dataset && (this.videoEl.dataset.videoKeyingSourceUrl = value207);
        }
      }
      const count16 = this._readDurationSec(this.videoEl);
      if (count16 > 0) this.durationSec = count16;
      (this._pauseAllWrapperVideos(),
        this.videoEl &&
          ((this._onLoadedMeta = () => {
            if (!this.active) return;
            const count17 = this._readDurationSec(this.videoEl);
            if (count17 > 0) this.durationSec = count17;
            this._pauseAllWrapperVideos();
          }),
          (this._onDurationChange = () => {
            if (!this.active) return;
            const count18 = this._readDurationSec(this.videoEl);
            if (count18 > 0) this.durationSec = count18;
          }),
          this.videoEl.addEventListener('loadedmetadata', this._onLoadedMeta, { once: true }),
          this.videoEl.addEventListener('durationchange', this._onDurationChange)),
        this._renderThumbs(),
        this._startPlayheadLoop(),
        this.wrapperEl &&
          !this._onVideoPlay &&
          ((this._onVideoPlay = (event36) => {
            if (!this.active) return;
            if (!this.wrapperEl) return;
            const value210 = event36.target;
            if (!(value210 instanceof HTMLVideoElement)) return;
            try {
              value210.pause();
            } catch {}
          }),
          this.wrapperEl.addEventListener('play', this._onVideoPlay, true),
          this.wrapperEl.addEventListener('playing', this._onVideoPlay, true)));
    },
    _startPlayheadLoop() {
      if (this._playheadRaf) cancelAnimationFrame(this._playheadRaf);
      const value211 = () => {
        if (!this.active) return;
        (this._renderPlayhead(), (this._playheadRaf = requestAnimationFrame(value211)));
      };
      this._playheadRaf = requestAnimationFrame(value211);
    },
    _renderPlayhead() {
      if (!this.playheadEl || !this.trackEl) return;
      const count19 = this.durationSec;
      if (!Number.isFinite(count19) || count19 <= 0) {
        this.playheadEl.style.display = 'none';
        return;
      }
      const enabled41 = this.videoEl || this._getVideoEl();
      if (!enabled41) {
        this.playheadEl.style.display = 'none';
        return;
      }
      let value212 = false;
      if (this.videoEl !== enabled41)
        ((this.videoEl = enabled41),
          this._ensureMarkLayer(),
          this._attachMarkLayerListeners(),
          (value212 = true));
      else
        this.markLayerEl &&
          !this.markLayerEl.isConnected &&
          (this._ensureMarkLayer(), this._attachMarkLayerListeners(), (value212 = true));
      const value213 = Math.max(0, Math.min(count19, Number(enabled41.currentTime) || 0)),
        value214 = Math.max(0, Math.min(1, value213 / count19)),
        value215 = appStore.getState().nodes?.[this.nodeId] || {},
        { fps: fps10 } = this._getRhVideoSettings(value215),
        value216 = Math.max(0, Math.round(value213 * fps10));
      (this._lastFrameIndex !== value216 || this._lastFrameIndexFps !== fps10) &&
        ((this._lastFrameIndex = value216), (this._lastFrameIndexFps = fps10), this._updateHelperRight());
      (this._updateHelperRight(),
        (this.playheadEl.style.display = 'block'),
        (this.playheadEl.style.left = value214 * 100 + '%'));
      if (value212) this._renderMarksFn?.();
      this._syncRemoveCursor();
    },
    _resolveVideoSrcFromNode(enabled42) {
      if (!enabled42) return '';
      const url = localPathToUrl(enabled42.localPath);
      return url || enabled42.src || enabled42.videoUrl || enabled42.resultUrl || '';
    },
    async _renderThumbs() {
      const token = ++this._thumbToken,
        thumbs = Array.isArray(this.thumbEls) ? this.thumbEls : [];
      if (!thumbs.length) return;
      const value217 = appStore.getState().nodes[this.nodeId],
        src2 = this._resolveVideoSrcFromNode(value217);
      await renderVideoKeyingThumbs({
        src: src2,
        thumbs: thumbs,
        token: token,
        isCurrent: (value218) => this.active && this._thumbToken === value218,
        readDurationSec: (value219) => this._readDurationSec(value219),
        onDuration: (count20) => {
          count20 > 0 && (!this.durationSec || this.durationSec <= 0) && (this.durationSec = count20);
        },
      });
    },
    ...videoKeyingLifecycleMethods,
  };
export default VideoKeyingController;
