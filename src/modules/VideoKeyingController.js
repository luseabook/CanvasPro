import { openDebugRequestWindow } from './debugRequestWindow.js';
import { RUNNINGHUB_INSTANCE_OPTIONS } from './runningHubInstanceTypes.js';
import appStore from '../core/stores/appStore.js';
import { generateId } from '../core/math.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { commit } from './history.js';
import { showProviderApiKeyMissingToast } from './providerApiKeyMissingToast.js';
import { buildGenerateVideoRequest } from '../../api/aiVideoApi.js';
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
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
  getNodeDefaultSize,
} from '../services/fileService.js';
import { releaseCanvasPanShortcut } from '../services/canvasPanShortcutState.js';
import { applyDebugWrenchIcon, buildFinalApiDebugPreview } from '../utils/debugRequestPreview.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
import { attachVideoKeyingPlaybackSource, setVideoKeyingMediaKeepAlive } from './videoKeyingMediaHelpers.js';
import { renderVideoTimelineThumbnails } from './videoTimelineThumbnails.js';
import { resolveNodeVideoElement } from './nodeVideoElement.js';
import { resolveCanvasVideoPosterUrl } from '../services/canvasMediaLocalService.js';
import { buildGenerationStartPatch } from '../core/generationTaskLifecycle.js';
import { getVideoKeyingModelId } from './videoKeyingManifestResolver.js';
import {
  RH_DEFAULT_INSTANCE_TYPE,
  RH_DEFAULT_KEYING_FPS,
  RH_DEFAULT_KEYING_MASK_MODE,
  RH_DEFAULT_KEYING_RESOLUTION,
  getRhKeyingFpsOptions,
  getRunningHubWorkflowAccess,
  hasUsableKeyingSettingValue,
  normalizeRhInstanceType,
  normalizeRhKeyingFps,
  normalizeRhKeyingResolution,
  resolveSourceVideoKeyingSetting,
} from './videoKeyingSettings.js';
import { onLocaleChange } from '../i18n/index.js';
import { buildVideoKeyingOutputText, videoKeyingText } from './videoKeyingTextHelpers.js';
import { videoKeyingLifecycleMethods } from './videoKeyingLifecycleMethods.js';
import { measureVideoKeyingProjection } from './videoKeyingProjection.js';
import {
  getVideoKeyingMaxSourceVideoMB,
  isVideoKeyingSourceVideoTooLarge,
} from './videoKeyingSourceVideoLimit.js';
import {
  cancelVideoKeyingTaskForNode,
  getRunningVideoKeyingTaskForNode,
  runVideoKeyingTask,
} from './videoKeyingTaskRuntime.js';
const REMOVE_POS_POINT_LIMIT = 3000,
  REMOVE_MASK_MAX_SIDE = 512,
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
        list3.forEach((state, config) => {
          if (handle[config]) handle[config].textContent = state;
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
        scope = Array.from(this.hintEl.children);
      list4.forEach((input, output) => {
        if (scope[output]) scope[output].textContent = input;
      });
    },
    _onRemoveCanvasWheel(event) {
      (event.preventDefault(), event.stopPropagation());
      if (!this.active || !this._isRemoveUiMode() || !this._removeCursorHover) return;
      const count = event.deltaY || 0,
        value2 = count < 0 ? 1 : -1,
        value3 = this._clampRemoveBrushSize(this._removeBrushSizePx),
        value4 = this._clampRemoveBrushSize(value3 + value2 * 2);
      if (value4 === value3) return;
      ((this._removeBrushSizePx = value4),
        this._syncRemoveBrushControls(),
        this._syncRemoveCursor());
    },
    _measureProjection({
      videoEl: videoEl = this.videoEl || this._getVideoEl(),
      layerEl: layerEl = null,
    } = {}) {
      return measureVideoKeyingProjection({ videoElement: videoEl, layerElement: layerEl });
    },
    _scheduleRemoveCursor(value5, value6) {
      this._removeCursorLast = { x: Number(value5) || 0, y: Number(value6) || 0 };
      if (this._removeCursorRaf) return;
      this._removeCursorRaf = requestAnimationFrame(() => {
        ((this._removeCursorRaf = 0), this._syncRemoveCursor());
      });
    },
    _syncRemoveCursor() {
      const canvasEl = this.markLayerEl,
        cursorEl = this.removeCursorEl;
      if (!this._isRemoveUiMode() || !canvasEl || !cursorEl) return;
      const run = () =>
        syncCircularBrushCursor({ cursorEl: cursorEl, canvasEl: canvasEl, visible: false });
      if (!this._removeCursorHover) {
        run();
        return;
      }
      const value7 = this._measureProjection({ layerEl: canvasEl }),
        enabled2 = value7?.video,
        enabled3 = value7?.layer,
        enabled4 = value7?.pickClientPoint(
          this._removeCursorLast.x,
          this._removeCursorLast.y,
        ),
        box = enabled4 ? value7.normalizedToLayerPoint(enabled4.nx, enabled4.ny) : null;
      if (!enabled2 || !enabled3 || !enabled4 || !box) {
        run();
        return;
      }
      const x = Number(box?.x),
        y = Number(box?.y);
      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        x < 0 ||
        y < 0 ||
        x > enabled3.lw ||
        y > enabled3.lh
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
        cursorLast: { x: x, y: y },
        isEraseBrush: true,
      });
    },
    _attachMarkLayerListeners() {
      const el3 = this.markLayerEl;
      if (!el3) return;
      if (this._onMarkPointerDown)
        el3.addEventListener('pointerdown', this._onMarkPointerDown);
      if (this._onMarkPointerMove)
        el3.addEventListener('pointermove', this._onMarkPointerMove);
      if (this._onMarkPointerUp) el3.addEventListener('pointerup', this._onMarkPointerUp);
      if (this._onMarkPointerCancel)
        el3.addEventListener('pointercancel', this._onMarkPointerCancel);
      if (this._onMarkPointerCancel)
        el3.addEventListener('lostpointercapture', this._onMarkPointerCancel);
      if (this._onMarkPointerEnter)
        el3.addEventListener('pointerenter', this._onMarkPointerEnter);
      if (this._onMarkPointerLeave)
        el3.addEventListener('pointerleave', this._onMarkPointerLeave);
    },
    _detachMarkLayerListeners(el4 = this.markLayerEl) {
      if (!el4) return;
      if (this._onMarkPointerDown)
        el4.removeEventListener('pointerdown', this._onMarkPointerDown);
      if (this._onMarkPointerMove)
        el4.removeEventListener('pointermove', this._onMarkPointerMove);
      if (this._onMarkPointerUp) el4.removeEventListener('pointerup', this._onMarkPointerUp);
      if (this._onMarkPointerCancel)
        el4.removeEventListener('pointercancel', this._onMarkPointerCancel);
      if (this._onMarkPointerCancel)
        el4.removeEventListener('lostpointercapture', this._onMarkPointerCancel);
      if (this._onMarkPointerEnter)
        el4.removeEventListener('pointerenter', this._onMarkPointerEnter);
      if (this._onMarkPointerLeave)
        el4.removeEventListener('pointerleave', this._onMarkPointerLeave);
    },
    _collectRemovePosPoints(value8 = REMOVE_POS_POINT_LIMIT) {
      const list5 = Array.isArray(this._marks) ? this._marks : [],
        list6 = list5.filter(
          (value9) => value9 && (value9.type === 'brush' || value9.type === 'eraser'),
        ),
        enabled5 = list6.some((value10) => value10.type === 'brush');
      if (!enabled5) return [];
      const value11 = Math.max(1, Math.trunc(Number(value8) || REMOVE_POS_POINT_LIMIT)),
        el5 = this.videoEl || this._getVideoEl(),
        value12 = Math.max(
          1,
          Number(el5?.videoWidth) || Number(el5?.offsetWidth) || REMOVE_MASK_MAX_SIDE,
        ),
        value13 = Math.max(
          1,
          Number(el5?.videoHeight) || Number(el5?.offsetHeight) || REMOVE_MASK_MAX_SIDE,
        ),
        value14 = Math.min(1, REMOVE_MASK_MAX_SIDE / Math.max(value12, value13)),
        count2 = Math.max(1, Math.round(value12 * value14)),
        count3 = Math.max(1, Math.round(value13 * value14)),
        box2 = document.createElement('canvas');
      ((box2.width = count2), (box2.height = count3));
      const ctx = box2.getContext('2d', { willReadFrequently: true });
      if (!ctx) return [];
      const eraseCanvasPalette = getEraseCanvasPalette(),
        value15 = count2 / Math.max(1, Number(el5?.offsetWidth) || count2);
      list6.forEach((value16) => {
        const list7 = Array.isArray(value16.points) ? value16.points : [];
        if (!list7.length) return;
        const globalCompositeOperation = value16.type === 'eraser' ? 'eraser' : 'brush',
          lineWidth = getBrushLineWidth(
            this._clampRemoveBrushSize(value16.brushSizePx),
            value15,
            globalCompositeOperation,
          ),
          points = list7.map((value17) => ({
            x: Math.max(0, Math.min(1, Number(value17?.nx) || 0)) * (count2 - 1),
            y: Math.max(0, Math.min(1, Number(value17?.ny) || 0)) * (count3 - 1),
          }));
        ctx.save();
        const strokeStyle = globalCompositeOperation === 'eraser' ? eraseCanvasPalette.eraseDark : eraseCanvasPalette.brushLight;
        (drawRoundBrushStroke(ctx, {
          points: points,
          lineWidth: lineWidth,
          strokeStyle: strokeStyle,
          fillStyle: strokeStyle,
          globalCompositeOperation: globalCompositeOperation === 'eraser' ? 'destination-out' : 'source-over',
        }),
          ctx.restore());
      });
      const value18 = ctx.getImageData(0, 0, count2, count3).data,
        list8 = [],
        map = new Set(),
        handler = (value19, value20) => {
          const x2 = count2 > 1 ? value19 / (count2 - 1) : 0,
            y2 = count3 > 1 ? value20 / (count3 - 1) : 0,
            value21 = Math.round(x2 * 4000) + ':' + Math.round(y2 * 4000);
          if (map.has(value21)) return;
          (map.add(value21), list8.push({ x: x2, y: y2 }));
        },
        handler2 = (value22) => {
          for (let value23 = 0; value23 < count3; value23 += value22) {
            for (let value24 = 0; value24 < count2; value24 += value22) {
              const value25 = (value23 * count2 + value24) * 4;
              if (value18[value25 + 3] < 8) continue;
              handler(value24, value23);
              if (list8.length >= value11) return true;
            }
          }
          return false;
        },
        count4 = Math.max(1, Math.floor(Math.max(count2, count3) / 220)),
        enabled6 = handler2(count4);
      !enabled6 && list8.length < Math.min(value11, 80) && count4 > 1 && handler2(1);
      if (list8.length > value11) list8.length = value11;
      return list8;
    },
    _getKeyingMeta() {
      const value26 = appStore.getState().nodes?.[this.nodeId] || {},
        { fps: fps, resolution: resolution } = this._getRhVideoSettings(value26),
        totalFrames = Math.max(1, Math.round((Number(this.durationSec) || 0) * fps) || 1),
        value27 = this.videoEl || this._getVideoEl(),
        value28 = Math.max(
          0,
          Math.min(Number(this.durationSec) || 0, Number(value27?.currentTime) || 0),
        ),
        frameIndex = Math.min(totalFrames, Math.max(0, Math.round(value28 * fps)));
      return { fps: fps, res: resolution, totalFrames: totalFrames, frameIndex: frameIndex };
    },
    _calcKeyingFrameSize(value29, value30, value31) {
      const w = Math.max(0, Math.trunc(Number(value29) || 0)),
        h = Math.max(0, Math.trunc(Number(value30) || 0)),
        enabled7 = Math.max(0, Math.trunc(Number(value31) || 0));
      if (!w || !h || !enabled7) return { w: w, h: h };
      const value32 = Math.max(w, h),
        value33 = enabled7 / value32,
        w2 = Math.max(1, Math.round(w * value33)),
        h2 = Math.max(1, Math.round(h * value33));
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
    _resolveSourceVideoValue(value34 = appStore.getState().nodes?.[this.nodeId] || {}) {
      return (
        value34.src ||
        value34.videoUrl ||
        value34.localPath ||
        value34.resultLocalPath ||
        ''
      );
    },
    _normalizeRhMaskMode(value35) {
      const enabled8 = String(value35 || '').trim();
      if (!enabled8 || enabled8 === '0') return 'Sec';
      if (enabled8 === '1') return 'Sam3';
      if (enabled8 === '2') return 'MA2';
      const value36 = enabled8.toLowerCase();
      if (value36 === 'sam3') return 'Sam3';
      if (value36 === 'ma2' || value36 === 'matanyone2') return 'MA2';
      return 'Sec';
    },
    _getRhVideoSettings(value37 = appStore.getState().nodes?.[this.nodeId] || {}) {
      const fps3 = normalizeRhKeyingFps(
          resolveSourceVideoKeyingSetting(value37, 'rhVideoFps', RH_DEFAULT_KEYING_FPS),
        ),
        resolution2 = normalizeRhKeyingResolution(
          resolveSourceVideoKeyingSetting(value37, 'rhVideoResolution', RH_DEFAULT_KEYING_RESOLUTION),
        ),
        instanceType = normalizeRhInstanceType(
          resolveSourceVideoKeyingSetting(value37, 'rhInstanceType', RH_DEFAULT_INSTANCE_TYPE),
        );
      return { fps: fps3, resolution: resolution2, instanceType: instanceType };
    },
    _getRhMaskMode(value38 = appStore.getState().nodes?.[this.nodeId] || {}) {
      return this._normalizeRhMaskMode(
        resolveSourceVideoKeyingSetting(value38, 'rhMaskMode', RH_DEFAULT_KEYING_MASK_MODE),
      );
    },
    _getSourceFrameCount(value39, value40) {
      const value41 =
          Number.isFinite(Number(value40)) && Number(value40) > 0 ? Number(value40) : 24,
        count5 = Number(value39?.videoFrameCount),
        count6 = Number(value39?.videoFps),
        list9 = [
          Number(value39?.videoDuration),
          Number(this.durationSec),
          Number(this.videoEl?.duration),
        ];
      let value42 = list9.find((count7) => Number.isFinite(count7) && count7 > 0);
      !Number.isFinite(value42) &&
        Number.isFinite(count5) &&
        count5 > 0 &&
        Number.isFinite(count6) &&
        count6 > 0 &&
        (value42 = count5 / count6);
      if (Number.isFinite(value42)) return Math.max(1, Math.round(value42 * value41));
      if (Number.isFinite(count5) && count5 > 0) return Math.max(1, Math.trunc(count5));
      return Math.max(1, Math.trunc(Number(value39?.rhVideoFrames) || value41 || 24));
    },
    _getRemoveMaskExportSize(value43) {
      const videoEl2 = this.videoEl || this._getVideoEl(),
        sourceW = Math.max(
          1,
          Number(videoEl2?.videoWidth) ||
            Number(videoEl2?.offsetWidth) ||
            Number(value43) ||
            1024,
        ),
        sourceH = Math.max(
          1,
          Number(videoEl2?.videoHeight) ||
            Number(videoEl2?.offsetHeight) ||
            Number(value43) ||
            1024,
        ),
        { w: w3, h: h3 } = this._calcKeyingFrameSize(sourceW, sourceH, value43);
      return {
        videoEl: videoEl2,
        sourceW: sourceW,
        sourceH: sourceH,
        width: Math.max(1, w3 || 1),
        height: Math.max(1, h3 || 1),
      };
    },
    _exportRemoveMaskDataUrl(value44) {
      this._renderMarksFn?.();
      const {
        videoEl: videoEl3,
        width: width,
        height: height,
      } = this._getRemoveMaskExportSize(value44);
      if (!width || !height) throw new Error(videoKeyingText('errors.maskSizeInvalid'));
      const list10 = (Array.isArray(this._marks) ? this._marks : []).filter(
          (value45) => value45 && (value45.type === 'brush' || value45.type === 'eraser'),
        ),
        enabled9 = list10.some((value46) => value46.type === 'brush');
      if (!enabled9) throw new Error(videoKeyingText('errors.noBrush'));
      const box3 = document.createElement('canvas');
      ((box3.width = width), (box3.height = height));
      const ctx2 = box3.getContext('2d');
      if (!ctx2) throw new Error(videoKeyingText('errors.maskCanvasUnavailable'));
      const eraseCanvasPalette2 = getEraseCanvasPalette();
      ((ctx2.fillStyle = eraseCanvasPalette2.eraseDark),
        ctx2.fillRect(0, 0, width, height));
      const box4 = this.removeMaskCanvasEl,
        value47 = this._measureProjection({ videoEl: videoEl3, layerEl: this.markLayerEl }),
        box5 = value47?.getVideoRectInLayer();
      if (box4 && box5 && box4.width > 0 && box4.height > 0) {
        const value48 = Math.max(0, Math.min(box4.width - 1, box5.x)),
          value49 = Math.max(0, Math.min(box4.height - 1, box5.y)),
          value50 = Math.max(1, Math.min(box4.width - value48, box5.width)),
          value51 = Math.max(1, Math.min(box4.height - value49, box5.height));
        return (
          ctx2.drawImage(
            box4,
            value48,
            value49,
            value50,
            value51,
            0,
            0,
            width,
            height,
          ),
          box3.toDataURL('image/png')
        );
      }
      return (
        list10.forEach((value52) => {
          const list11 = Array.isArray(value52.points) ? value52.points : [];
          if (!list11.length) return;
          const value53 = value52.type === 'eraser' ? 'eraser' : 'brush',
            strokeStyle2 = value53 === 'eraser' ? eraseCanvasPalette2.eraseDark : eraseCanvasPalette2.brushLight,
            lineWidth2 = getBrushLineWidth(
              this._clampRemoveBrushSize(value52.brushSizePx) *
                (width / Math.max(1, Number(videoEl3?.offsetWidth) || width)),
              1,
              value53,
            ),
            points2 = list11.map((value54) => ({
              x: Math.max(0, Math.min(1, Number(value54?.nx) || 0)) * (width - 1),
              y: Math.max(0, Math.min(1, Number(value54?.ny) || 0)) * (height - 1),
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
        box3.toDataURL('image/png')
      );
    },
    _updateConfirmEnabled() {
      if (!this.confirmBtnEl || !this.active) return;
      const value55 = this.nodeId,
        value56 = value55 ? getRunningVideoKeyingTaskForNode(value55) : null;
      if (value56) {
        if (this.confirmBtnEl.disabled) this.confirmBtnEl.disabled = false;
        return;
      }
      const { pos_points: pos_points, neg_points: neg_points } = this.getPosNegPoints(),
        count8 = Array.isArray(pos_points) ? pos_points.length : 0,
        value57 = Array.isArray(neg_points) ? neg_points.length : 0,
        enabled10 = this._isRemoveUiMode() ? count8 > 0 : count8 > 0 && value57 < count8;
      if (this._lastConfirmEnabled === enabled10) return;
      ((this._lastConfirmEnabled = enabled10), (this.confirmBtnEl.disabled = !enabled10));
    },
    _cancelRhTaskForSourceNode(value58, value59 = {}) {
      return cancelVideoKeyingTaskForNode(value58, value59);
    },
    getPosNegPoints() {
      if (this._isRemoveUiMode()) {
        const pos_points2 = this._collectRemovePosPoints(REMOVE_POS_POINT_LIMIT);
        return { pos_points: pos_points2, neg_points: [] };
      }
      const value60 = Array.isArray(this._marks) ? this._marks : [],
        pos_points3 = [],
        neg_points2 = [];
      for (const enabled11 of value60) {
        if (!enabled11) continue;
        const x3 = Number(enabled11.nx),
          y3 = Number(enabled11.ny);
        if (!Number.isFinite(x3) || !Number.isFinite(y3)) continue;
        const value61 = { x: x3, y: y3 };
        if (enabled11.pointType === 'background') neg_points2.push(value61);
        else pos_points3.push(value61);
      }
      return { pos_points: pos_points3, neg_points: neg_points2 };
    },
    _syncPointsToStore() {
      const { pos_points: pos_points4, neg_points: neg_points3 } = this.getPosNegPoints();
      (appStore.setVideoKeyingState({ pos_points: pos_points4, neg_points: neg_points3 }),
        this._updateConfirmEnabled());
    },
    _undoMark() {
      const list12 = Array.isArray(this._marks) ? this._marks : [];
      if (!list12.length) return;
      const list13 = Array.isArray(this._marksRedo) ? this._marksRedo : [],
        value62 = list12.pop();
      (list13.push(value62),
        (this._marks = list12),
        (this._marksRedo = list13),
        this._renderMarksFn?.(),
        this._syncPointsToStore());
    },
    _redoMark() {
      const list14 = Array.isArray(this._marksRedo) ? this._marksRedo : [];
      if (!list14.length) return;
      const list15 = Array.isArray(this._marks) ? this._marks : [],
        value63 = list14.pop();
      (list15.push(value63),
        (this._marks = list15),
        (this._marksRedo = list14),
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
    init(nodeId, value64 = {}) {
      if (!nodeId) return;
      if (this.active) this.exit({ silent: true });
      const enabled12 = appStore.getState().nodes[nodeId];
      if (!enabled12) return;
      ((this.uiMode = value64?.uiMode === 'remove' ? 'remove' : 'keying'),
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
      const value65 = this.nodeId,
        value66 = () => {
          if (!this.active || this.nodeId !== value65) return;
          const enabled13 = document.getElementById(value65);
          if (!enabled13) {
            this._retryCount++;
            if (this._retryCount > 10) {
              this.exit({ silent: true });
              return;
            }
            this._retryRaf = requestAnimationFrame(value66);
            return;
          }
          ((this.wrapperEl = enabled13),
            this._applyFrozenUI(true),
            this._applyDimMode(true),
            releaseCanvasPanShortcut(),
            this._createUI(),
            this._syncDurationAndDefaults(),
            this._bindEvents(),
            this._renderPlayhead());
        };
      this._retryRaf = requestAnimationFrame(value66);
    },
    _applyDimMode(value67) {
      const el6 = document.getElementById('v2-wrap');
      if (el6) {
        if (value67) el6.classList.add('is-video-keying-mode');
        else el6.classList.remove('is-video-keying-mode');
      }
      if (this.wrapperEl) {
        if (value67) this.wrapperEl.classList.add('is-video-keying-target');
        else this.wrapperEl.classList.remove('is-video-keying-target');
      }
    },
    _applyFrozenUI(value68) {
      if (!this.wrapperEl) return;
      const value69 = 'is-video-keying';
      if (value68) this.wrapperEl.classList.add(value69);
      else this.wrapperEl.classList.remove(value69);
      this._applyFrozenOverlaysHidden(value68);
    },
    _applyFrozenOverlaysHidden(value70) {
      if (!this.wrapperEl) return;
      if (value70) {
        if (Array.isArray(this._hiddenEls) && this._hiddenEls.length) return;
        const list16 = [
            '.video-controls',
            '.video-mute-btn',
            '.node-upload-hint',
            '.video-center-indicator',
            '.gen-video-center-indicator',
            '.multi-toggle-btn',
          ],
          list17 = [];
        (list16.forEach((value71) => {
          this.wrapperEl.querySelectorAll(value71).forEach((el7) => {
            (list17.push({ el: el7, prevDisplay: el7.style.display }),
              (el7.style.display = 'none'));
          });
        }),
          (this._hiddenEls = list17));
        return;
      }
      const list18 = Array.isArray(this._hiddenEls) ? this._hiddenEls : [];
      ((this._hiddenEls = null),
        list18.forEach(({ el: el8, prevDisplay: prevDisplay }) => {
          if (!el8 || !el8.isConnected) return;
          el8.style.display = prevDisplay || '';
        }));
    },
    _pauseAllWrapperVideos() {
      this.wrapperEl &&
        this.wrapperEl.querySelectorAll('video').forEach((enabled14) => {
          try {
            if (!enabled14.paused) enabled14.pause();
          } catch {}
        });
      if (this.videoEl)
        try {
          if (!this.videoEl.paused) this.videoEl.pause();
        } catch {}
    },
    _createRemoveToolbar() {
      const el9 = document.createElement('div');
      el9.className = 'v2-video-keying-erasebar v2-annotate-toolbar';
      const value72 = this._buildShortcutTooltip(
          videoKeyingText('tools.brush'),
          'editor-tool-brush',
          'B',
        ),
        value73 = this._buildShortcutTooltip(videoKeyingText('tools.eraser'), 'editor-tool-eraser', 'E'),
        value74 = this._buildShortcutTooltip(videoKeyingText('tools.undo'), 'undo', 'Ctrl+Z'),
        value75 = this._buildShortcutTooltip(videoKeyingText('tools.redo'), 'redo', 'Ctrl+Shift+Z'),
        value76 = this._buildShortcutTooltip(videoKeyingText('tools.clear'), 'editor-clear', 'R');
      return (
        (el9.innerHTML =
          '\n      <button class="v2-annotate-btn icon-only act-cancel" data-tooltip="' +
          videoKeyingText('tools.cancel') +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg></button>\n      <div class="v2-annotate-divider"></div>\n      <button class="v2-annotate-btn icon-only tool-btn active" data-tool="brush" data-tooltip="' +
          value72 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="eraser" data-tooltip="' +
          value73 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20 20H7l-5-5a2 2 0 0 1 0-2.83l9.17-9.17a2 2 0 0 1 2.83 0L22 10a2 2 0 0 1 0 2.83L14.83 20"/></svg></button>\n      <div class="v2-annotate-size"><span class="v2-annotate-size-value"></span><input class="v2-annotate-size-range" type="range" min="1" max="120" step="1"></div>\n      <div class="v2-annotate-divider"></div>\n      <button class="v2-annotate-btn icon-only act-undo" data-tooltip="' +
          value74 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 14l-4-4 4-4"/><path d="M5 10h9a6 6 0 1 1 0 12h-3"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-redo" data-tooltip="' +
          value75 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M15 14l4-4-4-4"/><path d="M19 10H10a6 6 0 1 0 0 12h3"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-clear" data-tooltip="' +
          value76 +
          '" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 16h10l1-16"/></svg></button>\n    '),
        (this.removeSizeValueEl = el9.querySelector('.v2-annotate-size-value')),
        (this.removeSizeRangeEl = el9.querySelector('.v2-annotate-size-range')),
        this.removeSizeRangeEl &&
          this.removeSizeValueEl &&
          (this._syncRemoveBrushControls(),
          this.removeSizeRangeEl.addEventListener('input', (event2) => {
            const value77 = this._clampRemoveBrushSize(event2.target.value);
            ((this._removeBrushSizePx = value77),
              this._syncRemoveBrushControls(),
              this._syncRemoveCursor());
          })),
        el9.addEventListener('pointerdown', (event3) => event3.stopPropagation()),
        el9.querySelector('.act-cancel')?.addEventListener('click', (event4) => {
          (event4.stopPropagation(), this.exit());
        }),
        el9.querySelector('[data-tool="brush"]')?.addEventListener('click', (event5) => {
          (event5.stopPropagation(), this._setRemovePointTool('foreground'));
        }),
        el9.querySelector('[data-tool="eraser"]')?.addEventListener('click', (event6) => {
          (event6.stopPropagation(), this._setRemovePointTool('background'));
        }),
        el9.querySelector('.act-undo')?.addEventListener('click', (event7) => {
          (event7.stopPropagation(), this._undoMark());
        }),
        el9.querySelector('.act-redo')?.addEventListener('click', (event8) => {
          (event8.stopPropagation(), this._redoMark());
        }),
        el9.querySelector('.act-clear')?.addEventListener('click', (event9) => {
          (event9.stopPropagation(),
            this._clearAllMarks(),
            window.showToast?.(videoKeyingText('toasts.clearedPoints'), 'info'));
        }),
        el9
      );
    },
    _createUI() {
      if (!this.wrapperEl) return;
      this.wrapperEl
        .querySelectorAll('.v2-video-keyingbar,.v2-video-keyinghint,.v2-video-keying-erasebar')
        .forEach((el10) => el10.remove());
      const el11 = document.createElement('div');
      el11.className = 'v2-video-keyingbar';
      const el12 = document.createElement('button');
      ((el12.type = 'button'),
        (el12.className = 'v2-video-clipbtn cancel'),
        (el12.title = videoKeyingText('tools.cancel')));
      {
        const value78 = 'http://www.w3.org/2000/svg',
          el13 = document.createElementNS(value78, 'svg');
        (el13.setAttribute('width', '20'),
          el13.setAttribute('height', '20'),
          el13.setAttribute('viewBox', '0 0 24 24'),
          el13.setAttribute('fill', 'none'),
          el13.setAttribute('stroke', 'currentColor'),
          el13.setAttribute('stroke-width', '2'));
        const el14 = document.createElementNS(value78, 'path');
        el14.setAttribute('d', 'M18 6L6 18');
        const el15 = document.createElementNS(value78, 'path');
        (el15.setAttribute('d', 'M6 6l12 12'),
          el13.appendChild(el14),
          el13.appendChild(el15),
          el12.appendChild(el13));
      }
      const el16 = document.createElement('button');
      ((el16.type = 'button'),
        (el16.className = 'prompt-submit img-gen-btn'),
        (el16.title = this._isRemoveUiMode()
          ? videoKeyingText('tools.remove')
          : videoKeyingText('tools.keying')));
      {
        const value79 = 'http://www.w3.org/2000/svg',
          el17 = document.createElementNS(value79, 'svg');
        (el17.setAttribute('width', '14'),
          el17.setAttribute('height', '14'),
          el17.setAttribute('viewBox', '0 0 24 24'),
          el17.setAttribute('fill', 'none'),
          el17.setAttribute('stroke', 'currentColor'),
          el17.setAttribute('stroke-width', '2'));
        const el18 = document.createElementNS(value79, 'line');
        (el18.setAttribute('x1', '12'),
          el18.setAttribute('y1', '19'),
          el18.setAttribute('x2', '12'),
          el18.setAttribute('y2', '5'));
        const el19 = document.createElementNS(value79, 'polyline');
        (el19.setAttribute('points', '5 12 12 5 19 12'),
          el17.appendChild(el18),
          el17.appendChild(el19),
          el16.appendChild(el17));
      }
      const value80 = appStore.getState().nodes?.[this.nodeId] || {},
        {
          fps: fps4,
          resolution: resolution3,
          instanceType: instanceType2,
        } = this._getRhVideoSettings(value80),
        value81 = this._getRhMaskMode(value80),
        value82 = {};
      !hasUsableKeyingSettingValue(value80.rhVideoFps) && (value82.rhVideoFps = fps4);
      !hasUsableKeyingSettingValue(value80.rhVideoResolution) &&
        (value82.rhVideoResolution = resolution3);
      !hasUsableKeyingSettingValue(value80.rhMaskMode) && (value82.rhMaskMode = value81);
      !hasUsableKeyingSettingValue(value80.rhInstanceType) && (value82.rhInstanceType = instanceType2);
      if (Object.keys(value82).length)
        try {
          appStore.updateNodeData(this.nodeId, value82);
        } catch {}
      let el20 = document.createElement('div');
      el20.className = 'rh-keying-settings-wrap';
      const el21 = document.createElement('button');
      ((el21.type = 'button'),
        (el21.className = 'v2-video-clipbtn cancel rh-keying-settings-btn'),
        (el21.title = videoKeyingText('tools.settings')));
      {
        const value83 = 'http://www.w3.org/2000/svg',
          el22 = document.createElementNS(value83, 'svg');
        (el22.setAttribute('width', '20'),
          el22.setAttribute('height', '20'),
          el22.setAttribute('viewBox', '0 0 24 24'),
          el22.setAttribute('fill', 'none'),
          el22.setAttribute('stroke', 'currentColor'),
          el22.setAttribute('stroke-width', '2'));
        const el23 = document.createElementNS(value83, 'path');
        el23.setAttribute('d', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z');
        const el24 = document.createElementNS(value83, 'path');
        (el24.setAttribute(
          'd',
          'M19.4 15a1.7 1.7 0 0 0 .33 1.87l.06.06a2 2 0 0 1-1.42 3.42h-.2a2 2 0 0 1-1.41-.59l-.06-.06a1.7 1.7 0 0 0-1.87-.33 1.7 1.7 0 0 0-1.03 1.54V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.03-1.54 1.7 1.7 0 0 0-1.87.33l-.06.06a2 2 0 0 1-1.41.59h-.2a2 2 0 0 1-1.42-3.42l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.54-1.03H3a2 2 0 0 1 0-4h.06A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.33-1.87l-.06-.06A2 2 0 0 1 5.63 3.65h.2a2 2 0 0 1 1.41.59l.06.06A1.7 1.7 0 0 0 9.17 4.6a1.7 1.7 0 0 0 1.03-1.54V3a2 2 0 0 1 4 0v.06a1.7 1.7 0 0 0 1.03 1.54 1.7 1.7 0 0 0 1.87-.33l.06-.06a2 2 0 0 1 1.41-.59h.2A2 2 0 0 1 20.79 7.07l-.06.06A1.7 1.7 0 0 0 20.4 9c.32.55.86.92 1.54 1.03H22a2 2 0 0 1 0 4h-.06A1.7 1.7 0 0 0 19.4 15z',
        ),
          el22.appendChild(el24),
          el22.appendChild(el23),
          el21.appendChild(el22));
      }
      const el25 = document.createElement('div');
      ((el25.className = 'rh-keying-settings-menu'), el25.setAttribute('role', 'menu'));
      {
        const el26 = document.createElement('div');
        el26.className = 'rh-keying-settings-head';
        const el27 = document.createElement('span');
        ((el27.className = 'rh-keying-settings-title'),
          (el27.textContent = videoKeyingText('settings.title')),
          el26.appendChild(el27),
          el25.appendChild(el26));
      }
      {
        const el28 = document.createElement('div');
        el28.className = 'img-rp-quality-area';
        const el29 = document.createElement('div');
        el29.className = 'img-rp-section-label';
        const el30 = document.createElement('span');
        ((el30.className = 'rh-keying-label-resolution'),
          (el30.textContent = videoKeyingText('settings.resolution')));
        const el31 = document.createElement('span');
        ((el31.className = 'rh-tip rh-keying-tip-resolution'),
          el31.setAttribute('data-tooltip', videoKeyingText('settings.resolutionTip')),
          (el31.textContent = '!'),
          el29.appendChild(el30),
          el29.appendChild(el31));
        const el32 = document.createElement('div');
        ((el32.className = 'img-rp-quality-segmented'),
          [832, 1024, 1280, 1440, 1600, 1760, 1920].forEach((value84) => {
            const el33 = document.createElement('button');
            el33.type = 'button';
            const value85 = Number(value84) > 1440;
            ((el33.className = ('img-rp-quality-item ' +
              (value85 ? 'dev-mode-only' : '') +
              ' rh-keying-res-btn ' +
              (Number(resolution3) === Number(value84) ? 'active' : '')).trim()),
              (el33.dataset.value = String(value84)),
              (el33.textContent = String(value84)),
              el32.appendChild(el33));
          }),
          el28.appendChild(el29),
          el28.appendChild(el32),
          el25.appendChild(el28));
      }
      {
        const el34 = document.createElement('div');
        el34.className = 'rh-vram-adv-row';
        const el35 = document.createElement('div');
        el35.className = 'rh-vram-adv-label';
        const el36 = document.createElement('span');
        ((el36.className = 'rh-keying-label-fps'),
          (el36.textContent = videoKeyingText('settings.fps')));
        const el37 = document.createElement('span');
        ((el37.className = 'rh-tip rh-keying-tip-fps'),
          el37.setAttribute('data-tooltip', videoKeyingText('settings.fpsTip')),
          (el37.textContent = '!'),
          el35.appendChild(el36),
          el35.appendChild(el37));
        const el38 = document.createElement('div');
        ((el38.className = 'img-rp-quality-segmented rh-adv-seg rh-v5-fps-seg'),
          getRhKeyingFpsOptions().forEach((fps5) => {
            const el39 = document.createElement('button');
            ((el39.type = 'button'),
              (el39.className = ('img-rp-quality-item rh-keying-fps-btn ' +
                (Number(fps4) === Number(fps5) ? 'active' : '')).trim()),
              (el39.dataset.value = String(fps5)),
              (el39.textContent = videoKeyingText('settings.fpsValue', { fps: fps5 })),
              el38.appendChild(el39));
          }),
          el34.appendChild(el35),
          el34.appendChild(el38),
          el25.appendChild(el34));
      }
      if (!this._isRemoveUiMode()) {
        const el40 = document.createElement('div');
        el40.className = 'rh-vram-adv-row';
        const el41 = document.createElement('div');
        el41.className = 'rh-vram-adv-label';
        const el42 = document.createElement('span');
        ((el42.className = 'rh-keying-label-mask-mode'),
          (el42.textContent = videoKeyingText('settings.maskMode')));
        const el43 = document.createElement('span');
        ((el43.className = 'rh-tip rh-keying-tip-mask-mode'),
          el43.setAttribute('data-tooltip', videoKeyingText('settings.maskModeTip')),
          (el43.textContent = '!'),
          el41.appendChild(el42),
          el41.appendChild(el43));
        const el44 = document.createElement('div');
        ((el44.className = 'img-rp-quality-segmented rh-adv-seg rh-keying-maskmode-seg'),
          [
            ['Sec', 'Sec'],
            ['Sam3', 'Sam3'],
            ['MA2', 'MA2'],
          ].forEach(([value86, value87]) => {
            const el45 = document.createElement('button');
            ((el45.type = 'button'),
              (el45.className = ('img-rp-quality-item rh-keying-maskmode-btn ' +
                (value81 === value86 ? 'active' : '')).trim()),
              (el45.dataset.value = value86),
              (el45.textContent = value87),
              el44.appendChild(el45));
          }),
          el40.appendChild(el41),
          el40.appendChild(el44),
          el25.appendChild(el40));
      }
      {
        const el46 = document.createElement('div');
        el46.className = 'rh-vram-adv-row';
        const el47 = document.createElement('div');
        el47.className = 'rh-vram-adv-label';
        const el48 = document.createElement('span');
        ((el48.className = 'rh-keying-label-vram'),
          (el48.textContent = videoKeyingText('settings.vram')));
        const el49 = document.createElement('span');
        ((el49.className = 'rh-tip rh-keying-tip-vram'),
          el49.setAttribute('data-tooltip', videoKeyingText('settings.vramTip')),
          (el49.textContent = '!'),
          el47.appendChild(el48),
          el47.appendChild(el49));
        const el50 = document.createElement('div');
        ((el50.className = 'img-rp-quality-segmented rh-adv-seg rh-keying-vram-seg'),
          RUNNINGHUB_INSTANCE_OPTIONS.forEach(({ value: value88, label: label }) => {
            const el51 = document.createElement('button');
            ((el51.type = 'button'),
              (el51.className = ('img-rp-quality-item rh-keying-vram-btn ' +
                (instanceType2 === value88 ? 'active' : '')).trim()),
              (el51.dataset.value = value88),
              (el51.textContent = label),
              el50.appendChild(el51));
          }),
          el46.appendChild(el47),
          el46.appendChild(el50),
          el25.appendChild(el46));
      }
      (el20.appendChild(el21), el20.appendChild(el25));
      const value89 = document.createElement('button');
      ((value89.type = 'button'),
        (value89.className = 'v2-video-clipbtn cancel debug-wrench-btn rh-keying-debug-btn'),
        (value89.title = videoKeyingText('settings.debugParams')),
        applyDebugWrenchIcon(value89));
      const el52 = document.createElement('div');
      el52.className = 'v2-video-keyingrow';
      const el53 = document.createElement('div');
      el53.className = 'v2-video-keyingtrack';
      const value90 = document.createElement('div');
      value90.className = 'v2-video-keyingticks';
      const el54 = document.createElement('div');
      el54.className = 'v2-video-keyingthumbs';
      const list19 = [];
      for (let count9 = 0; count9 < 10; count9++) {
        const value91 = document.createElement('div');
        ((value91.className = 'v2-video-keyingthumb'),
          el54.appendChild(value91),
          list19.push(value91));
      }
      const value92 = document.createElement('div');
      ((value92.className = 'v2-video-keyingplayhead'),
        el53.appendChild(el54),
        el53.appendChild(value92),
        el53.appendChild(value90));
      const value93 = this._isRemoveUiMode();
      (el52.appendChild(el12), el52.appendChild(el53));
      if (el20) el52.appendChild(el20);
      if (value89) el52.appendChild(value89);
      el52.appendChild(el16);
      const el55 = document.createElement('div');
      el55.className = 'v2-video-keyinghelper-row';
      const value94 = document.createElement('div');
      ((value94.className = 'v2-video-keyinghelper-right'), el55.appendChild(value94));
      let el56 = null,
        value95 = null;
      if (value93) value95 = this._createRemoveToolbar();
      else {
        ((el56 = document.createElement('div')), (el56.className = 'v2-video-keyinghint'));
        const run2 = (value96, value97) => {
          const el57 = document.createElement('span');
          if (value97) el57.className = value97;
          return ((el57.textContent = value96), el57);
        };
        (el56.appendChild(run2(videoKeyingText('hint.leftClick'))),
          el56.appendChild(
            run2(videoKeyingText('hint.selectTarget'), 'v2-video-keyinghint--pos'),
          ),
          el56.appendChild(run2('  ')),
          el56.appendChild(run2(videoKeyingText('hint.rightClick'))),
          el56.appendChild(
            run2(videoKeyingText('hint.excludeTarget'), 'v2-video-keyinghint--neg'),
          ),
          el56.appendChild(run2(videoKeyingText('hint.shortcutPrefix'))),
          el56.appendChild(
            run2(this._getShortcutText('editor-clear', 'R'), 'v2-video-keyinghint-kbd'),
          ),
          el56.appendChild(run2(videoKeyingText('hint.clearAllPoints'))),
          el56.appendChild(run2('  ')),
          el56.appendChild(
            run2(this._getShortcutText('undo', 'Ctrl+Z'), 'v2-video-keyinghint-kbd'),
          ),
          el56.appendChild(run2(videoKeyingText('tools.undo'))),
          el56.appendChild(run2('  ')),
          el56.appendChild(
            run2(this._getShortcutText('redo', 'Ctrl+Shift+Z'), 'v2-video-keyinghint-kbd'),
          ),
          el56.appendChild(run2(videoKeyingText('tools.redo'))));
      }
      (el11.appendChild(el52),
        el11.appendChild(el55),
        value95 && this.wrapperEl.appendChild(value95),
        this.wrapperEl.appendChild(el11),
        el56 && this.wrapperEl.appendChild(el56),
        (this.barEl = el11),
        (this.hintEl = el56),
        (this.removeToolbarEl = value95),
        this._setRemovePointTool(this._removePointTool),
        (this.cancelBtnEl = el12),
        (this.confirmBtnEl = el16),
        (this.trackEl = el53),
        (this.playheadEl = value92),
        (this.thumbEls = list19),
        (this.helperRightEl = value94),
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
      (this.barEl?.querySelectorAll('.rh-keying-settings-btn').forEach((value98) => {
        value98.title = videoKeyingText('tools.settings');
      }),
        this.barEl?.querySelectorAll('.rh-keying-debug-btn').forEach((value99) => {
          value99.title = videoKeyingText('settings.debugParams');
        }));
      const run3 = (value100, value101) => {
          this.barEl?.querySelectorAll(value100).forEach((el58) => {
            el58.textContent = value101;
          });
        },
        handler3 = (value102, value103) => {
          this.barEl?.querySelectorAll(value102).forEach((el59) => {
            (el59.setAttribute('data-tooltip', value103), (el59.title = value103));
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
          fps6.textContent = videoKeyingText('settings.fpsValue', {
            fps: fps6.dataset.value,
          });
        }),
        this._refreshRemoveShortcutUi(),
        this._refreshKeyingHintUi(),
        (this._lastHelperRightText = null),
        this._updateHelperRight());
    },
    _ensureMarkLayer() {
      if (!this.wrapperEl) return;
      const el60 = this.videoEl || this._getVideoEl();
      if (!el60) return;
      const el61 = el60.closest('.node-card') || el60.parentElement || null;
      if (!el61) return;
      this._detachMarkLayerListeners(this.markLayerEl);
      if (this.markLayerEl && this.markLayerEl.isConnected) this.markLayerEl.remove();
      this.wrapperEl
        .querySelectorAll('.v2-video-keying-marklayer')
        .forEach((el62) => el62.remove());
      const el63 = document.createElement('div');
      el63.className = 'v2-video-keying-marklayer';
      if (this._isRemoveUiMode()) el63.classList.add('is-remove-mode');
      (el63.addEventListener('pointerdown', (event10) => {
        (event10.preventDefault(), event10.stopPropagation());
      }),
        el63.addEventListener('click', (event11) => {
          (event11.preventDefault(), event11.stopPropagation());
        }),
        el63.addEventListener('dblclick', (event12) => {
          (event12.preventDefault(), event12.stopPropagation());
        }),
        el63.addEventListener('contextmenu', (event13) => {
          (event13.preventDefault(), event13.stopPropagation());
        }));
      if (this._isRemoveUiMode()) {
        const value104 = document.createElement('canvas');
        ((value104.className = 'v2-video-keying-paintcanvas'),
          el63.appendChild(value104),
          (this.markCanvasEl = value104),
          (this.removeMaskCanvasEl = document.createElement('canvas')));
        const el64 = document.createElement('div');
        ((el64.className = 'v2-annotate-cursor v2-video-keying-cursor'),
          (el64.style.display = 'none'),
          el63.appendChild(el64),
          (this.removeCursorEl = el64),
          (this._removeCursorHover = false));
      } else
        ((this.markCanvasEl = null),
          (this.removeMaskCanvasEl = null),
          (this.removeCursorEl = null),
          (this._removeCursorHover = false));
      (el61.appendChild(el63),
        (this.markLayerEl = el63),
        this._attachMarkLayerListeners());
      this._isRemoveUiMode()
        ? ((this._onMarkWheel = (value105) => this._onRemoveCanvasWheel(value105)),
          el63.addEventListener('wheel', this._onMarkWheel, { passive: false }),
          (this._removeWheelCleanup = () => {
            this._onMarkWheel && el63.removeEventListener('wheel', this._onMarkWheel);
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
          const rhSourceNodeId = this.nodeId;
          if (getRunningVideoKeyingTaskForNode(rhSourceNodeId)) {
            await this._cancelRhTaskForSourceNode(rhSourceNodeId, { notify: true });
            return;
          }
          const value106 = appStore.getState().nodes?.[this.nodeId] || {},
            value107 = this.videoEl || this._getVideoEl(),
            value108 = Number(value107?.videoWidth) || 0,
            value109 = Number(value107?.videoHeight) || 0,
            timeSec = Number(value107?.currentTime) || 0,
            {
              fps: fps7,
              resolution: resolution4,
              instanceType: instanceType3,
            } = this._getRhVideoSettings(value106),
            rhMaskMode = this._getRhMaskMode(value106),
            rhVideoFrames = this._getSourceFrameCount(value106, fps7),
            { pos_points: pos_points5, neg_points: neg_points4 } = this.getPosNegPoints(),
            { w: w4, h: h4 } = this._calcKeyingFrameSize(value108, value109, resolution4),
            handler4 = (value110, value111, value112) =>
              Math.max(value111, Math.min(value112, value110)),
            value113 = (box6) => ({
              x: Math.round(handler4(box6.x * w4, 0, Math.max(0, w4 - 1))),
              y: Math.round(handler4(box6.y * h4, 0, Math.max(0, h4 - 1))),
            }),
            list20 = w4 > 0 && h4 > 0 ? pos_points5.map(value113) : [],
            list21 = w4 > 0 && h4 > 0 ? neg_points4.map(value113) : [],
            value114 = list20.length ? JSON.stringify(list20) : '',
            value115 = list21.length ? JSON.stringify(list21) : '',
            pos_points6 = value114,
            neg_points5 = value115,
            frame_index = Math.max(0, Math.round(timeSec * fps7));
          try {
            const value116 = {
              frame_index: frame_index,
              rhVideoFps: fps7,
              rhVideoFrames: rhVideoFrames,
              rhVideoResolution: resolution4,
              rhInstanceType: instanceType3,
            };
            (!this._isRemoveUiMode() &&
              ((value116.positive = value114),
              (value116.negative = value115),
              (value116.pos_points = pos_points6),
              (value116.neg_points = neg_points5)),
              appStore.updateNodeData(this.nodeId, value116));
          } catch {}
          const videoUrl = this._resolveSourceVideoValue(value106);
          if (!videoUrl) {
            window.showToast?.(videoKeyingText('toasts.connectSourceVideoFirst'), 'warn');
            return;
          }
          if (isVideoKeyingSourceVideoTooLarge(value106)) {
            window.showToast?.(
              videoKeyingText('toasts.sourceVideoTooLarge', { maxMB: getVideoKeyingMaxSourceVideoMB() }),
              'warn',
            );
            return;
          }
          let runningHubWorkflowAccess = null;
          try {
            runningHubWorkflowAccess = await getRunningHubWorkflowAccess();
          } catch (value117) {
            window.showToast?.(videoKeyingText('toasts.configReadFailed'), 'error');
            return;
          }
          const apiKey = String(runningHubWorkflowAccess?.apiKey || '').trim(),
            providerId = String(runningHubWorkflowAccess?.providerProfileId || '').trim(),
            runningHubApiUrl = String(runningHubWorkflowAccess?.apiUrl || '').trim();
          if (!apiKey) {
            showProviderApiKeyMissingToast(videoKeyingText('toasts.apiKeyMissing'), {
              providerId: providerId || 'runninghubwf',
              type: 'warn',
            });
            return;
          }
          if (this._isRemoveUiMode()) {
            let maskImageDataUrl = '';
            try {
              maskImageDataUrl = this._exportRemoveMaskDataUrl(resolution4);
            } catch (error) {
              window.showToast?.(
                error?.message || videoKeyingText('errors.removeMaskFailed'),
                'error',
              );
              return;
            }
            const box7 = value106,
              { width: width2, height: height2 } = getAutoMediaSizeByShortSide(
                box7.width || 512,
                box7.height || 288,
              ),
              x4 = calcSafeSpawnPosNearNode(
                appStore.getState().nodes,
                box7,
                width2,
                height2,
              ),
              id = generateId('source-video-erase'),
              startedAt = Date.now();
            (appStore.addNode(
              buildSourceMediaNodePayload({
                id: id,
                type: 'source-video',
                x: x4.x,
                y: x4.y,
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
            const runVideoKeyingTask2 = runVideoKeyingTask({
              sourceNodeId: rhSourceNodeId,
              outId: id,
              mode: 'remove',
              startedAt: startedAt,
              payload: {
                provider: 'runninghubwf',
                model: getVideoKeyingModelId(),
                apiKey: apiKey,
                providerProfileId: providerId,
                rhProviderProfileId: providerId,
                runningHubApiUrl: runningHubApiUrl,
                videoUrl: videoUrl,
                maskImageDataUrl: maskImageDataUrl,
                sourceFrameCount: rhVideoFrames,
                rhVideoFps: fps7,
                rhVideoResolution: resolution4,
                rhInstanceType: instanceType3,
              },
            });
            (this.exit({ silent: true, preserveRh: true }), await runVideoKeyingTask2);
            return;
          }
          const name = value106,
            { width: width3, height: height3 } = getAutoMediaSizeByShortSide(
              name.width || 512,
              name.height || 288,
            ),
            x5 = calcSafeSpawnPosNearNode(
              appStore.getState().nodes,
              name,
              width3,
              height3,
            ),
            id2 = generateId('source-video-matting'),
            startedAt2 = Date.now();
          (appStore.addNode(
            buildSourceMediaNodePayload({
              id: id2,
              type: 'source-video',
              x: x5.x,
              y: x5.y,
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
            appStore.setSelectedNodes([id2]),
            commit());
          const runVideoKeyingTask3 = runVideoKeyingTask({
            sourceNodeId: rhSourceNodeId,
            outId: id2,
            mode: 'keying',
            startedAt: startedAt2,
            payload: {
              provider: 'runninghubwf',
              model: getVideoKeyingModelId(),
              apiKey: apiKey,
              providerProfileId: providerId,
              rhProviderProfileId: providerId,
              runningHubApiUrl: runningHubApiUrl,
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
          (this.exit({ silent: true, preserveRh: true }), await runVideoKeyingTask3);
        }));
      const el65 = this.barEl.querySelector('.rh-keying-settings-wrap'),
        el66 = this.barEl.querySelector('.rh-keying-settings-btn'),
        el67 = this.barEl.querySelector('.rh-keying-settings-menu');
      if (el65 && el66 && el67) {
        const run4 = () => {
          const value118 = appStore.getState().nodes?.[this.nodeId] || {},
            {
              fps: fps8,
              resolution: resolution5,
              instanceType: instanceType4,
            } = this._getRhVideoSettings(value118),
            value119 = this._getRhMaskMode(value118);
          (el67.querySelectorAll('.rh-keying-res-btn').forEach((el68) =>
            el68.classList.toggle('active', Number(el68.dataset.value) === resolution5),
          ),
            el67.querySelectorAll('.rh-keying-fps-btn').forEach((el69) =>
              el69.classList.toggle('active', Number(el69.dataset.value) === fps8),
            ),
            el67.querySelectorAll('.rh-keying-maskmode-btn').forEach((el70) =>
              el70.classList.toggle('active', el70.dataset.value === value119),
            ),
            el67.querySelectorAll('.rh-keying-vram-btn').forEach((el71) =>
              el71.classList.toggle('active', el71.dataset.value === instanceType4),
            ));
        };
        (el65.addEventListener('click', (event16) => event16.stopPropagation()),
          el67.addEventListener('click', (event17) => event17.stopPropagation()),
          el66.addEventListener('click', (event18) => {
            (event18.preventDefault(), event18.stopPropagation());
            const run5 = () => {
                (el65.classList.remove('show'),
                  this._onKeyingSettingsDocDown &&
                    (document.removeEventListener('pointerdown', this._onKeyingSettingsDocDown, true),
                    (this._onKeyingSettingsDocDown = null)));
              },
              enabled15 = !el65.classList.contains('show');
            if (!enabled15) {
              run5();
              return;
            }
            (el65.classList.add('show'),
              run4(),
              !this._onKeyingSettingsDocDown &&
                ((this._onKeyingSettingsDocDown = (event19) => {
                  if (el65.contains(event19.target)) return;
                  run5();
                }),
                document.addEventListener('pointerdown', this._onKeyingSettingsDocDown, true)));
          }),
          el67.querySelectorAll('.rh-keying-fps-btn').forEach((el72) => {
            el72.addEventListener('click', (event20) => {
              (event20.preventDefault(), event20.stopPropagation());
              const value120 = Number(el72.dataset.value),
                rhVideoFps = normalizeRhKeyingFps(value120);
              try {
                const rhVideoFrames2 = Math.max(
                    1,
                    Math.round((Number(this.durationSec) || 0) * rhVideoFps) || 1,
                  ),
                  value121 = this.videoEl || this._getVideoEl(),
                  value122 = Math.max(
                    0,
                    Math.min(
                      Number(this.durationSec) || 0,
                      Number(value121?.currentTime) || 0,
                    ),
                  ),
                  frame_index2 = Math.max(0, Math.round(value122 * rhVideoFps));
                appStore.updateNodeData(this.nodeId, {
                  rhVideoFps: rhVideoFps,
                  rhVideoFrames: rhVideoFrames2,
                  frame_index: frame_index2,
                });
              } catch {}
              (run4(), this._updateHelperRight());
            });
          }),
          el67.querySelectorAll('.rh-keying-maskmode-btn').forEach((el73) => {
            el73.addEventListener('click', (event21) => {
              (event21.preventDefault(), event21.stopPropagation());
              const rhMaskMode2 = this._normalizeRhMaskMode(el73.dataset.value);
              try {
                appStore.updateNodeData(this.nodeId, { rhMaskMode: rhMaskMode2 });
              } catch {}
              run4();
            });
          }),
          el67.querySelectorAll('.rh-keying-res-btn').forEach((el74) => {
            el74.addEventListener('click', (event22) => {
              (event22.preventDefault(), event22.stopPropagation());
              const value123 = Math.trunc(Number(el74.dataset.value)),
                rhVideoResolution = [832, 1024, 1280, 1440, 1600, 1760, 1920].includes(value123)
                  ? value123
                  : 1024;
              try {
                appStore.updateNodeData(this.nodeId, { rhVideoResolution: rhVideoResolution });
              } catch {}
              (run4(), this._updateHelperRight());
            });
          }),
          el67.querySelectorAll('.rh-keying-vram-btn').forEach((el75) => {
            el75.addEventListener('click', (event23) => {
              (event23.preventDefault(), event23.stopPropagation());
              const rhInstanceType = normalizeRhInstanceType(el75.dataset.value);
              try {
                appStore.updateNodeData(this.nodeId, { rhInstanceType: rhInstanceType });
              } catch {}
              run4();
            });
          }));
      }
      const el76 = this.barEl.querySelector('.rh-keying-debug-btn');
      el76 &&
        el76.addEventListener('click', async (event24) => {
          (event24.preventDefault(), event24.stopPropagation());
          const value124 = appStore.getState().nodes?.[this.nodeId] || {},
            value125 = this.videoEl || this._getVideoEl(),
            timeSec2 = Number(value125?.currentTime) || 0,
            value126 = Number(value125?.videoWidth) || 0,
            value127 = Number(value125?.videoHeight) || 0,
            {
              fps: fps9,
              resolution: resolution6,
              instanceType: instanceType5,
            } = this._getRhVideoSettings(value124),
            rhMaskMode3 = this._getRhMaskMode(value124),
            sourceFrameCount = this._getSourceFrameCount(value124, fps9),
            videoUrl2 = this._resolveSourceVideoValue(value124);
          if (isVideoKeyingSourceVideoTooLarge(value124)) {
            window.showToast?.(
              videoKeyingText('toasts.sourceVideoTooLarge', { maxMB: getVideoKeyingMaxSourceVideoMB() }),
              'warn',
            );
            return;
          }
          const { pos_points: pos_points7, neg_points: neg_points6 } = this.getPosNegPoints(),
            { w: w5, h: h5 } = this._calcKeyingFrameSize(value126, value127, resolution6),
            handler5 = (value128, value129, value130) =>
              Math.max(value129, Math.min(value130, value128)),
            value131 = (box8) => ({
              x: Math.round(handler5(box8.x * w5, 0, Math.max(0, w5 - 1))),
              y: Math.round(handler5(box8.y * h5, 0, Math.max(0, h5 - 1))),
            }),
            list22 = w5 > 0 && h5 > 0 ? pos_points7.map(value131) : [],
            list23 = w5 > 0 && h5 > 0 ? neg_points6.map(value131) : [],
            pos_points8 = list22.length ? JSON.stringify(list22) : '',
            neg_points7 = list23.length ? JSON.stringify(list23) : '';
          let runningHubWorkflowAccess2 = null;
          try {
            runningHubWorkflowAccess2 = await getRunningHubWorkflowAccess();
          } catch {
            window.showToast?.(videoKeyingText('toasts.configReadFailed'), 'error');
            return;
          }
          const apiKey2 = String(runningHubWorkflowAccess2?.apiKey || '').trim(),
            providerProfileId = String(runningHubWorkflowAccess2?.providerProfileId || '').trim(),
            runningHubApiUrl2 = String(runningHubWorkflowAccess2?.apiUrl || '').trim();
          let value132 = null;
          if (this._isRemoveUiMode()) {
            let maskImageDataUrl2 = '';
            try {
              maskImageDataUrl2 = this._exportRemoveMaskDataUrl(resolution6);
            } catch (error2) {
              window.showToast?.(
                videoKeyingText('toasts.debugBuildFailed', {
                  error: error2?.message || videoKeyingText('errors.maskExportFailed'),
                }),
                'error',
              );
              return;
            }
            value132 = {
              provider: 'runninghubwf',
              model: getVideoKeyingModelId(),
              apiKey: apiKey2,
              providerProfileId: providerProfileId,
              rhProviderProfileId: providerProfileId,
              runningHubApiUrl: runningHubApiUrl2,
              videoUrl: videoUrl2,
              maskImageDataUrl: maskImageDataUrl2,
              sourceFrameCount: sourceFrameCount,
              rhVideoFps: fps9,
              rhVideoResolution: resolution6,
              rhInstanceType: instanceType5,
            };
          } else
            value132 = {
              provider: 'runninghubwf',
              model: getVideoKeyingModelId(),
              apiKey: apiKey2,
              providerProfileId: providerProfileId,
              rhProviderProfileId: providerProfileId,
              runningHubApiUrl: runningHubApiUrl2,
              videoUrl: videoUrl2,
              pos_points: pos_points8,
              neg_points: neg_points7,
              timeSec: timeSec2,
              frame_index: Math.max(0, Math.round(timeSec2 * fps9)),
              rhVideoFps: fps9,
              rhVideoFrames: Number.isFinite(value124.rhVideoFrames)
                ? Math.max(0, Math.trunc(value124.rhVideoFrames))
                : sourceFrameCount,
              rhVideoResolution: resolution6,
              rhInstanceType: instanceType5,
              rhMaskMode: rhMaskMode3,
            };
          try {
            const generateVideoRequest = await buildGenerateVideoRequest(value132);
            (openDebugRequestWindow(buildFinalApiDebugPreview(generateVideoRequest)),
              window.showToast?.(
                this._isRemoveUiMode()
                  ? videoKeyingText('toasts.debugRemoveShown')
                  : videoKeyingText('toasts.debugKeyingShown'),
                'info',
              ));
          } catch (error3) {
            window.showToast?.(
              videoKeyingText('toasts.debugFailed', {
                error: error3?.message || videoKeyingText('errors.unknown'),
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
      const run6 = (value133) => {
          const box9 = this.trackEl?.getBoundingClientRect(),
            count10 = this.durationSec;
          if (!box9 || !box9.width || !Number.isFinite(count10) || count10 <= 0) return;
          const value134 = Math.max(
              0,
              Math.min(1, (value133 - box9.left) / box9.width),
            ),
            value135 = value134 * count10,
            value136 = this.videoEl || this._getVideoEl();
          if (value136) value136.currentTime = Math.max(0, Math.min(count10, value135));
          this._renderPlayhead();
        },
        handler6 = (el77, value137) => {
          if (el77 && this._onPointerMove)
            el77.removeEventListener('pointermove', this._onPointerMove);
          if (el77 && this._onPointerUp)
            el77.removeEventListener('pointerup', this._onPointerUp);
          if (el77 && this._onPointerCancel)
            el77.removeEventListener('pointercancel', this._onPointerCancel);
          if (el77 && this._onPointerCancel)
            el77.removeEventListener('lostpointercapture', this._onPointerCancel);
          ((this._onPointerMove = null), (this._onPointerUp = null), (this._onPointerCancel = null));
          try {
            if (el77 && Number.isFinite(value137)) el77.releasePointerCapture(value137);
          } catch {}
        },
        value138 = (event25) => {
          if (!this.active || !this.trackEl) return;
          (event25.preventDefault(),
            event25.stopPropagation(),
            this._pauseAllWrapperVideos(),
            run6(event25.clientX));
          const el78 = this.trackEl,
            value139 = event25.pointerId;
          try {
            if (Number.isFinite(value139)) el78.setPointerCapture(value139);
          } catch {}
          ((this._onPointerMove = (event26) => {
            if (Number.isFinite(value139) && event26.pointerId !== value139) return;
            (event26.preventDefault(), run6(event26.clientX));
          }),
            (this._onPointerUp = (event27) => {
              if (Number.isFinite(value139) && event27.pointerId !== value139) return;
              (event27.preventDefault(),
                handler6(el78, value139),
                this._pauseAllWrapperVideos());
            }),
            (this._onPointerCancel = (event28) => {
              if (Number.isFinite(value139) && event28.pointerId !== value139) return;
              (handler6(el78, value139), this._pauseAllWrapperVideos());
            }),
            el78.addEventListener('pointermove', this._onPointerMove),
            el78.addEventListener('pointerup', this._onPointerUp),
            el78.addEventListener('pointercancel', this._onPointerCancel),
            el78.addEventListener('lostpointercapture', this._onPointerCancel));
        };
      (this.playheadEl?.addEventListener('pointerdown', value138),
        this.trackEl?.addEventListener('pointerdown', value138),
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
          const handleShortcutKeydown2 = handleShortcutKeydown(event29, {
            mattingActive: false,
            annotateActive: false,
            videoKeyingActive: true,
            featureModeActive: true,
            selectedNodeType: 'source-video',
          });
          if (!handleShortcutKeydown2) return;
          if (this._isRemoveUiMode()) {
            if (handleShortcutKeydown2 === 'editor-tool-brush') {
              (event29.preventDefault(),
                event29.stopPropagation(),
                this._setRemovePointTool('foreground'));
              return;
            }
            if (handleShortcutKeydown2 === 'editor-tool-eraser') {
              (event29.preventDefault(),
                event29.stopPropagation(),
                this._setRemovePointTool('background'));
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
          }
          if (handleShortcutKeydown2 === 'undo') {
            (event29.preventDefault(), event29.stopPropagation(), this._undoMark());
            return;
          }
          if (handleShortcutKeydown2 === 'redo') {
            (event29.preventDefault(), event29.stopPropagation(), this._redoMark());
            return;
          }
          handleShortcutKeydown2 === 'editor-clear' &&
            (event29.preventDefault(),
            event29.stopPropagation(),
            this._clearAllMarks(),
            window.showToast?.(videoKeyingText('toasts.clearedPoints'), 'info'));
        }),
        window.addEventListener('keydown', this._onKeyDown, true));
      const run7 = () => {
        const layerEl2 = this.markLayerEl,
          videoEl4 = this.videoEl || this._getVideoEl(),
          list24 = Array.isArray(this._marks) ? this._marks : [];
        if (!layerEl2 || !videoEl4) return;
        const enabled16 = this._measureProjection({ videoEl: videoEl4, layerEl: layerEl2 }),
          enabled17 = enabled16?.layer;
        if (!enabled16 || !enabled17) return;
        if (this._isRemoveUiMode()) {
          const el79 = this.markCanvasEl;
          if (!el79) return;
          const width4 = Math.max(1, Math.round(enabled17.lw)),
            height4 = Math.max(1, Math.round(enabled17.lh)),
            value140 = window.devicePixelRatio || 1,
            value141 = Math.round(width4 * value140),
            value142 = Math.round(height4 * value140);
          (el79.width !== value141 || el79.height !== value142) &&
            ((el79.width = value141),
            (el79.height = value142),
            (el79.style.width = width4 + 'px'),
            (el79.style.height = height4 + 'px'));
          const ctx3 = el79.getContext('2d');
          if (!ctx3) return;
          (ctx3.setTransform(value140, 0, 0, value140, 0, 0),
            ctx3.clearRect(0, 0, width4, height4));
          const maskCanvas = this.removeMaskCanvasEl || document.createElement('canvas');
          (maskCanvas.width !== Math.round(width4) ||
            maskCanvas.height !== Math.round(height4)) &&
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
            const list25 = Array.isArray(type.points) ? type.points : [];
            if (!list25.length) return;
            const points3 = list25.map((value143) =>
              enabled16.normalizedToLayerPoint(Number(value143?.nx), Number(value143?.ny)),
            ).filter(
              (box10) => Number.isFinite(box10.x) && Number.isFinite(box10.y),
            );
            if (!points3.length) return;
            drawEraseMaskCommand(ctx4, {
              type: type.type === 'eraser' ? 'eraser' : 'brush',
              points: points3,
              lineWidth: getBrushLineWidth(
                this._clampRemoveBrushSize(type.brushSizePx),
                1,
                type.type,
              ),
            });
          };
          list24.forEach(run8);
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
        if (!list24.length) {
          layerEl2.replaceChildren();
          return;
        }
        const el80 = document.createDocumentFragment();
        for (let value144 = 0; value144 < list24.length; value144++) {
          const value145 = list24[value144],
            el81 = document.createElement('div'),
            value146 =
              value145 && typeof value145.pointType === 'string' ? value145.pointType : 'foreground';
          el81.className =
            value146 === 'background'
              ? 'v2-video-keying-mark v2-video-keying-mark--background'
              : 'v2-video-keying-mark v2-video-keying-mark--foreground';
          if (this._isRemoveUiMode()) {
            const value147 = this._clampRemoveBrushSize(
                value145.brushSizePx || this._removeBrushSizePx,
              ),
              value148 = Math.max(8, Math.min(30, Math.round(value147 / 4)));
            ((el81.style.width = value148 + 'px'),
              (el81.style.height = value148 + 'px'));
          }
          const box11 = enabled16.normalizedToLayerPoint(
            Number(value145.nx),
            Number(value145.ny),
          );
          if (!box11) continue;
          ((el81.style.left = box11.x + 'px'),
            (el81.style.top = box11.y + 'px'),
            el80.appendChild(el81));
        }
        layerEl2.replaceChildren(el80);
      };
      this._renderMarksFn = run7;
      const event30 = { down: false, pointerId: null },
        handler7 = (enabled18 = true) => {
          const value149 = this.markLayerEl,
            value150 = event30.pointerId;
          if (value149 && Number.isFinite(value150))
            try {
              value149.releasePointerCapture(value150);
            } catch {}
          ((event30.down = false), (event30.pointerId = null), (this._removeDrawPointerId = null));
          const type2 = this._removeDraft;
          this._removeDraft = null;
          if (!enabled18 || !type2) {
            this._renderMarksFn?.();
            return;
          }
          const points4 = Array.isArray(type2.points)
            ? type2.points
                .map((value151) => ({
                  nx: Math.max(0, Math.min(1, Number(value151?.nx) || 0)),
                  ny: Math.max(0, Math.min(1, Number(value151?.ny) || 0)),
                }))
                .filter(
                  (value152) => Number.isFinite(value152.nx) && Number.isFinite(value152.ny),
                )
            : [];
          if (!points4.length) {
            this._renderMarksFn?.();
            return;
          }
          const list26 = Array.isArray(this._marks) ? this._marks : [];
          (list26.push({
            type: type2.type === 'eraser' ? 'eraser' : 'brush',
            brushSizePx: this._clampRemoveBrushSize(type2.brushSizePx),
            points: points4,
          }),
            (this._marks = list26),
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
        const nx = this._measureProjection()?.pickClientPoint(
          event31.clientX,
          event31.clientY,
        );
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
            if (Number.isFinite(event31.pointerId))
              this.markLayerEl.setPointerCapture(event31.pointerId);
          } catch {}
          this._renderMarksFn?.();
          return;
        }
        const list27 = Array.isArray(this._marks) ? this._marks : [];
        Array.isArray(this._marksRedo) && this._marksRedo.length && (this._marksRedo = []);
        const value153 = this.videoEl,
          t = Number(value153?.currentTime) || 0;
        if (event31.button !== 0 && event31.button !== 2) return;
        let pointType = event31.button === 2 ? 'background' : 'foreground';
        (this._isRemoveUiMode() &&
          event31.button === 0 &&
          (pointType = this._removePointTool === 'background' ? 'background' : 'foreground'),
          list27.push({
            nx: nx.nx,
            ny: nx.ny,
            t: t,
            pointType: pointType,
            brushSizePx: this._isRemoveUiMode()
              ? this._clampRemoveBrushSize(this._removeBrushSizePx)
              : undefined,
          }),
          (this._marks = list27),
          run7(),
          this._syncPointsToStore());
      }),
        (this._onMarkPointerMove = (event32) => {
          if (!this.active || !this._isRemoveUiMode()) return;
          this._scheduleRemoveCursor(event32.clientX, event32.clientY);
          if (!event30.down || !this._removeDraft) return;
          if (Number.isFinite(event30.pointerId) && event32.pointerId !== event30.pointerId)
            return;
          (event32.preventDefault(), event32.stopPropagation());
          const nx2 = this._measureProjection()?.pickClientPoint(
            event32.clientX,
            event32.clientY,
          );
          if (!nx2) return;
          const list28 = this._removeDraft.points;
          if (!Array.isArray(list28) || !list28.length) {
            ((this._removeDraft.points = [{ nx: nx2.nx, ny: nx2.ny }]),
              this._renderMarksFn?.());
            return;
          }
          const value154 = list28[list28.length - 1],
            count11 = Math.hypot(
              Number(nx2.nx) - Number(value154.nx),
              Number(nx2.ny) - Number(value154.ny),
            );
          if (count11 < 0.0006) return;
          (list28.push({ nx: nx2.nx, ny: nx2.ny }), this._renderMarksFn?.());
        }),
        (this._onMarkPointerUp = (event33) => {
          if (!this.active || !this._isRemoveUiMode()) return;
          this._scheduleRemoveCursor(event33.clientX, event33.clientY);
          if (Number.isFinite(event30.pointerId) && event33.pointerId !== event30.pointerId)
            return;
          (event33.preventDefault(), event33.stopPropagation(), handler7(true));
        }),
        (this._onMarkPointerCancel = (event34) => {
          if (!this.active || !this._isRemoveUiMode()) return;
          if (Number.isFinite(event30.pointerId) && event34.pointerId !== event30.pointerId)
            return;
          handler7(true);
        }),
        (this._onMarkPointerEnter = (event35) => {
          if (!this._isRemoveUiMode()) return;
          ((this._removeCursorHover = true),
            this._scheduleRemoveCursor(event35.clientX, event35.clientY));
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
      return resolveNodeVideoElement(
        this.wrapperEl,
        appStore.getStateRaw().nodes?.[this.nodeId]?.mainVideoIndex,
      );
    },
    _readDurationSec(enabled19) {
      if (!enabled19) return 0;
      const count12 = Number(enabled19.duration);
      if (Number.isFinite(count12) && count12 > 0) return count12;
      const list29 = enabled19.seekable;
      if (list29 && list29.length) {
        const count13 = Number(list29.end(list29.length - 1));
        if (Number.isFinite(count13) && count13 > 0) return count13;
      }
      return 0;
    },
    async _syncDurationAndDefaults() {
      ((this.videoEl = this._getVideoEl()), this._ensureMarkLayer(), this._renderThumbs());
      if (this.videoEl) {
        const value155 = this._resolveVideoSrcFromNode(appStore.getState().nodes?.[this.nodeId]),
          value156 = String(value155 || '').trim(),
          value157 = String(this.videoEl.dataset?.videoKeyingSourceUrl || '').trim(),
          value158 = ++this._sourceToken,
          value159 = this.videoEl,
          value160 = this.nodeId,
          shouldAssign = () =>
            this.active &&
            value158 === this._sourceToken &&
            this.videoEl === value159 &&
            this.nodeId === value160;
        setVideoKeyingMediaKeepAlive(this.videoEl, true);
        if (value156 && value157 !== value156) {
          await attachVideoKeyingPlaybackSource(value159, value156, { shouldAssign: shouldAssign });
          if (!shouldAssign()) return;
          this.videoEl.dataset && (this.videoEl.dataset.videoKeyingSourceUrl = value156);
        }
      }
      const count14 = this._readDurationSec(this.videoEl);
      if (count14 > 0) this.durationSec = count14;
      (this._pauseAllWrapperVideos(),
        this.videoEl &&
          ((this._onLoadedMeta = () => {
            if (!this.active) return;
            const count15 = this._readDurationSec(this.videoEl);
            if (count15 > 0) this.durationSec = count15;
            this._pauseAllWrapperVideos();
          }),
          (this._onDurationChange = () => {
            if (!this.active) return;
            const count16 = this._readDurationSec(this.videoEl);
            if (count16 > 0) this.durationSec = count16;
          }),
          this.videoEl.addEventListener('loadedmetadata', this._onLoadedMeta, { once: true }),
          this.videoEl.addEventListener('durationchange', this._onDurationChange)),
        this._startPlayheadLoop(),
        this.wrapperEl &&
          !this._onVideoPlay &&
          ((this._onVideoPlay = (event36) => {
            if (!this.active) return;
            if (!this.wrapperEl) return;
            const value161 = event36.target;
            if (!(value161 instanceof HTMLVideoElement)) return;
            try {
              value161.pause();
            } catch {}
          }),
          this.wrapperEl.addEventListener('play', this._onVideoPlay, true),
          this.wrapperEl.addEventListener('playing', this._onVideoPlay, true)));
    },
    _startPlayheadLoop() {
      if (this._playheadRaf) cancelAnimationFrame(this._playheadRaf);
      const value162 = () => {
        if (!this.active) return;
        (this._renderPlayhead(), (this._playheadRaf = requestAnimationFrame(value162)));
      };
      this._playheadRaf = requestAnimationFrame(value162);
    },
    _renderPlayhead() {
      if (!this.playheadEl || !this.trackEl) return;
      const count17 = this.durationSec;
      if (!Number.isFinite(count17) || count17 <= 0) {
        this.playheadEl.style.display = 'none';
        return;
      }
      const enabled20 = this.videoEl || this._getVideoEl();
      if (!enabled20) {
        this.playheadEl.style.display = 'none';
        return;
      }
      let value163 = false;
      if (this.videoEl !== enabled20)
        ((this.videoEl = enabled20),
          this._ensureMarkLayer(),
          this._attachMarkLayerListeners(),
          (value163 = true));
      else
        this.markLayerEl &&
          !this.markLayerEl.isConnected &&
          (this._ensureMarkLayer(), this._attachMarkLayerListeners(), (value163 = true));
      const value164 = Math.max(0, Math.min(count17, Number(enabled20.currentTime) || 0)),
        value165 = Math.max(0, Math.min(1, value164 / count17)),
        value166 = appStore.getState().nodes?.[this.nodeId] || {},
        { fps: fps10 } = this._getRhVideoSettings(value166),
        value167 = Math.max(0, Math.round(value164 * fps10));
      (this._lastFrameIndex !== value167 || this._lastFrameIndexFps !== fps10) &&
        ((this._lastFrameIndex = value167),
        (this._lastFrameIndexFps = fps10),
        this._updateHelperRight());
      (this._updateHelperRight(),
        (this.playheadEl.style.display = 'block'),
        (this.playheadEl.style.left = value165 * 100 + '%'));
      if (value163) this._renderMarksFn?.();
      this._syncRemoveCursor();
    },
    _resolveVideoSrcFromNode(enabled21) {
      if (!enabled21) return '';
      const url = localPathToUrl(enabled21.localPath);
      return url || enabled21.src || enabled21.videoUrl || enabled21.resultUrl || '';
    },
    async _renderThumbs() {
      const value168 = ++this._thumbToken,
        thumbs = Array.isArray(this.thumbEls) ? this.thumbEls : [];
      if (!thumbs.length) return;
      const value169 = appStore.getState().nodes[this.nodeId],
        src = this._resolveVideoSrcFromNode(value169),
        renderVideoTimelineThumbnails2 = await renderVideoTimelineThumbnails({
          src: src,
          posterUrl: resolveCanvasVideoPosterUrl(value169),
          thumbs: thumbs,
          isCurrent: () => this.active && this._thumbToken === value168,
          onDuration: (count18) => {
            count18 > 0 &&
              (!this.durationSec || this.durationSec <= 0) &&
              (this.durationSec = count18);
          },
        });
      if (!this.active || this._thumbToken !== value168) return;
      if (this.trackEl?.dataset) this.trackEl.dataset.thumbnailState = renderVideoTimelineThumbnails2.source;
      if (renderVideoTimelineThumbnails2.source === 'poster' || renderVideoTimelineThumbnails2.source === 'empty') {
        if (renderVideoTimelineThumbnails2.errors.length)
          console.warn('[VideoKeyingController] timeline thumbnails unavailable:', renderVideoTimelineThumbnails2.errors);
      }
    },
    ...videoKeyingLifecycleMethods,
  };
export default VideoKeyingController;
