import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
import {
  resumeAsyncImageTask,
  resumeDreaminaImageTask,
  resumeRunningHubImageTask,
} from '../../api/aiImageApi.js';
import { ensureLocalImageDerivatives, uploadFile } from '../modules/project.js';
import { openNodeImagePreview } from '../modules/imagePreview.js';
import { generateThumbnail } from '../modules/imageUtils.js';
import { bindImageToolbarEvents } from './NodeToolbarConfig.js';
import ImageFreeAngleController from '../modules/ImageFreeAngleController.js';
import { startLoading, stopLoading } from '../modules/loadingOverlay.js';
import { setStaticInnerHTML } from '../utils/dom.js';
import { commit } from '../modules/history.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import { getThumbnail, setThumbnail } from '../services/thumbnailCacheService.js';
import { getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { logDragImportProfile } from '../services/dragImportDiagnostics.js';
import {
  buildImageNodeStorageFields,
  pickCanvasImageLocalPath,
  toLocalPathUrl,
} from '../services/imageDerivativeService.js';
import {
  buildCanvasLocalImageFields,
  resolveCanvasImageDisplayUrl,
  resolveCanvasImageLowZoomUrl,
  resolveCanvasImageThumbUrl,
} from '../services/canvasMediaLocalService.js';
import {
  isCanvasLowZoomActive,
  pickImageLodUrl,
  setNodeMediaLodHoverPromoted,
  shouldUseLowZoomImageThumbnail,
} from '../modules/canvasImageLod.js';
import { preloadCanvasImage } from '../modules/canvasMediaScheduler.js';
import { shouldDeferRendererMediaOnMount } from '../core/rendererDeferredMedia.js';
import { resumeTask } from '../core/generationTaskRuntime.js';
import { isModelApiModel, isWorkflowModel, resolveModelProvider } from '../manifests/index.js';
import {
  getTaskMessage,
  isTaskCancelled,
  isTaskFailed,
  isTaskTerminal,
  shouldShowGenerationResultLoadingUi,
} from '../core/generationTaskUiState.js';
import { buildImageGenerationFailurePatch } from './aigenImage/imageGenerationResultRenderer.js';
import { getDefaultDreaminaImageModelId } from './aigenImage/dreaminaModelMenuHelper.js';
const SOURCE_IMAGE_MIN_SIZE = 150,
  SOURCE_IMAGE_IDLE_PRELOAD_TIMEOUT_MS = 40,
  SOURCE_IMAGE_BUSY_RETRY_MS = 48,
  SOURCE_IMAGE_MAX_BUSY_WAIT_MS = 700,
  SOURCE_IMAGE_LOD_HOVER_REFRESH_DELAY_MS = 160,
  DREAMINA_POLL_TIMEOUT_CODE = 'DREAMINA_POLL_TIMEOUT',
  DREAMINA_STALE_ACTIVE_RESUME_MS = 15 * 1000,
  NON_RECOVERABLE_FAILURE_STATUSES = new Set(['cancelled', 'canceled', 'error', 'fail', 'failed']),
  DREAMINA_NON_RECOVERABLE_STATUSES = new Set([...NON_RECOVERABLE_FAILURE_STATUSES, 'idle']),
  DREAMINA_NON_RECOVERABLE_PHASES = new Set([...NON_RECOVERABLE_FAILURE_STATUSES, 'done']);
function sourceImageText(value, item = {}) {
  return t('sourceImageNode.' + value, item);
}
function getSourceImageSchedulerNow() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}
function isSourceImageInteractionBusy() {
  const key = typeof document !== 'undefined' ? document.body?.classList : null;
  return !!(
    key?.contains?.('is-panning') ||
    key?.contains?.('is-zooming') ||
    key?.contains?.('is-viewport-animating')
  );
}
function scheduleSourceImageIdleTask(
  handler,
  { timeout: timeout = SOURCE_IMAGE_IDLE_PRELOAD_TIMEOUT_MS } = {},
) {
  if (typeof handler !== 'function') return () => {};
  let index = false,
    handler2 = () => {};
  const sourceImageSchedulerNow = getSourceImageSchedulerNow(),
    handler3 = globalThis.window?.requestIdleCallback || globalThis.requestIdleCallback,
    handler4 = globalThis.window?.cancelIdleCallback || globalThis.cancelIdleCallback;
  function run(result) {
    const setTimeout2 = setTimeout(data, result);
    handler2 = () => clearTimeout(setTimeout2);
  }
  const data = () => {
    if (index) return;
    const sourceImageSchedulerNow2 = getSourceImageSchedulerNow() - sourceImageSchedulerNow;
    if (isSourceImageInteractionBusy() && sourceImageSchedulerNow2 < SOURCE_IMAGE_MAX_BUSY_WAIT_MS) {
      run(SOURCE_IMAGE_BUSY_RETRY_MS);
      return;
    }
    handler();
  };
  if (typeof handler3 === 'function') {
    const options = handler3(data, { timeout: timeout });
    handler2 = () => {
      if (typeof handler4 === 'function') handler4(options);
    };
  } else run(0);
  return () => {
    ((index = true), handler2());
  };
}
function buildSourceImageRecoveryFailurePatch(
  target,
  { error: error = '', startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const message =
      String(error?.message || error || sourceImageText('recovery.taskFailed')).trim() ||
      sourceImageText('recovery.taskFailed'),
    source = String(target?.outputText || '').trim(),
    outputText = source
      ? source + '\n' + sourceImageText('recovery.failedWithMessage', { message: message })
      : sourceImageText('recovery.failedWithMessage', { message: message });
  return {
    ...buildImageGenerationFailurePatch({
      error: message,
      startedAt: startedAt,
      duration: duration,
      clearMediaFields: false,
    }),
    outputText: outputText,
  };
}
function normalizeImmediateImagePreviewUrl(next) {
  const enabled = String(next || '').trim();
  if (!enabled) return '';
  if (/^data:image\//i.test(enabled) || /^blob:/i.test(enabled) || /^aic-local-preview:/i.test(enabled))
    return enabled;
  if (/^(?:https?:|file:)/i.test(enabled)) return '';
  return toLocalPathUrl(enabled);
}
function firstImmediateImagePreviewUrl(current) {
  for (const entry of current || []) {
    const immediateImagePreviewUrl = normalizeImmediateImagePreviewUrl(entry);
    if (immediateImagePreviewUrl) return immediateImagePreviewUrl;
  }
  return '';
}
function getPrimarySourceImageItem(record) {
  const list = Array.isArray(record?.images) ? record.images : [];
  if (list.length === 0) return null;
  const payload = Number(record?.mainImageIndex),
    handle = Number.isFinite(payload) ? Math.max(0, Math.trunc(payload)) : 0;
  return list[handle] || list[0] || null;
}
function normalizeTaskStatus(state) {
  return String(state || '')
    .trim()
    .toLowerCase();
}
function normalizeUploadMediaDimensions(config, scope) {
  const width = Math.round(Number(config) || 0),
    height = Math.round(Number(scope) || 0);
  if (width <= 0 || height <= 0) return null;
  return { width: width, height: height };
}
export function buildSourceImageUploadSizePatch(...args) {
  for (const box of args) {
    const imageWidth = normalizeUploadMediaDimensions(box?.width, box?.height);
    if (!imageWidth) continue;
    const width2 = getAutoMediaSizeByShortSide(imageWidth.width, imageWidth.height);
    return {
      width: width2.width,
      height: width2.height,
      imageWidth: imageWidth.width,
      imageHeight: imageWidth.height,
      needsAutoResize: false,
    };
  }
  return { needsAutoResize: true };
}
export class SourceImageNode {
  constructor(input) {
    ((this._data = input),
      (this.el = document.createElement('div')),
      (this.id = input.id),
      (this.el.className = 'v2-node-component'),
      (this._currentSrc = null),
      (this._currentMaskPreview = null),
      (this._objUrl = null),
      (this._thumbGenSrc = null),
      (this._failedSrc = null),
      (this._currentJobStatus = null),
      (this._resolvedPreviewSig = ''),
      (this._previewResolveToken = 0),
      (this._uploadLabelNode = null),
      (this._unsubscribeLocale = null),
      (this._cachedThumbUrl = ''),
      (this._activeCapturePreviewUrl = ''),
      (this._rhResumeAbortController = null),
      (this._rhResumeTaskId = ''),
      (this._rhResumePromise = null),
      (this._rhResumeRetryTimer = null),
      (this._dreaminaResumeAbortController = null),
      (this._dreaminaResumeSubmitId = ''),
      (this._dreaminaResumePromise = null),
      (this._asyncResumeAbortController = null),
      (this._asyncResumeTaskId = ''),
      (this._asyncResumePromise = null),
      (this._idleImageRefreshCancel = null),
      (this._lowZoomHoverRefreshTimer = null),
      (this._rendererMediaDeferred = shouldDeferRendererMediaOnMount(input)));
  }
  ['_applyMaskPreview'](output) {
    if (!this._maskOverlay) return;
    const enabled2 = String(output || '').trim();
    if (!enabled2) {
      this._currentMaskPreview &&
        ((this._maskOverlay.src = ''),
        (this._maskOverlay.style.display = 'none'),
        (this._currentMaskPreview = null));
      return;
    }
    if (this._currentMaskPreview === enabled2) return;
    const enabled3 =
      enabled2.startsWith('blob:') || enabled2.startsWith('data:') || enabled2.startsWith('/')
        ? enabled2
        : toLocalPathUrl(enabled2);
    if (!enabled3) return;
    ((this._maskOverlay.src = encodeURI(enabled3)),
      (this._maskOverlay.style.display = 'block'),
      (this._currentMaskPreview = enabled2));
  }
  ['_setImageLodSrc'](value2) {
    if (!this._img?.dataset) return;
    const value3 = String(value2 || '').trim();
    if (value3) this._img.dataset.lodSrc = value3;
    else delete this._img.dataset.lodSrc;
  }
  ['_queueThumbnail'](enabled4) {
    if (!enabled4) return;
    if (this._thumbGenSrc === enabled4) return;
    ((this._thumbGenSrc = enabled4),
      generateThumbnail(enabled4)
        .then(async (enabled5) => {
          if (!enabled5) return;
          const enabled6 = appStore.getState().nodes[this.id];
          if (!enabled6) return;
          if (this._getPrimaryImageUrl(enabled6) !== enabled4) return;
          (await setThumbnail(enabled6, enabled5),
            !this._cachedThumbUrl && (this._cachedThumbUrl = enabled5));
        })
        .catch((value4) => {
          console.warn('[SourceImageNode] 缩略图缓存写入失败:', value4);
        })
        .finally(() => {
          if (this._thumbGenSrc === enabled4) this._thumbGenSrc = null;
        }));
  }
  ['_normalizeLocalUrl'](value5) {
    return toLocalPathUrl(value5);
  }
  ['_getPrimaryImageUrl'](value6 = this._data) {
    const canvasImageLocalPath = pickCanvasImageLocalPath(value6);
    return canvasImageLocalPath ? toLocalPathUrl(canvasImageLocalPath) : '';
  }
  ['_getSynchronousThumbUrl'](value7 = this._data) {
    const primarySourceImageItem = getPrimarySourceImageItem(value7);
    return (
      firstImmediateImagePreviewUrl([
        value7?.previewLocalPath,
        value7?.thumbLocalPath,
        value7?.thumbnailLocalPath,
        value7?.displayLocalPath,
        value7?.previewUrl,
        value7?.thumbUrl,
        value7?.thumbnailUrl,
        primarySourceImageItem?.previewLocalPath,
        primarySourceImageItem?.thumbLocalPath,
        primarySourceImageItem?.thumbnailLocalPath,
        primarySourceImageItem?.displayLocalPath,
        primarySourceImageItem?.previewUrl,
        primarySourceImageItem?.thumbUrl,
        primarySourceImageItem?.thumbnailUrl,
      ]) || resolveCanvasImageThumbUrl(value7)
    );
  }
  ['_getLowZoomImageUrl'](value8 = this._data) {
    return resolveCanvasImageLowZoomUrl(value8);
  }
  ['_shouldUseLowZoomThumbnail']() {
    return shouldUseLowZoomImageThumbnail({ nodeId: this.id, rootEl: this.el, store: appStore });
  }
  ['_getImageDisplayLod'](value9 = this._data) {
    const mainUrl = this._getPrimaryImageUrl(value9),
      thumbUrl = this._getSynchronousThumbUrl(value9) || this._getLowZoomImageUrl(value9);
    return pickImageLodUrl({
      mainUrl: mainUrl,
      thumbUrl: thumbUrl,
      lowZoomThumbnail: this._shouldUseLowZoomThumbnail(),
    });
  }
  ['_getCapturePreviewUrl'](value10 = this._data) {
    const enabled7 = String(value10?.capturePreviewUrl || '').trim();
    if (!enabled7) return '';
    if (
      enabled7.startsWith('blob:') ||
      enabled7.startsWith('data:image/') ||
      enabled7.startsWith('aic-local-preview:')
    )
      return enabled7;
    if (
      (enabled7.startsWith('http://') || enabled7.startsWith('https://')) &&
      enabled7 === String(value10?.webSourceUrl || '').trim()
    )
      return enabled7;
    return '';
  }
  ['_getPreviewSignature'](value11 = this._data) {
    return [
      String(value11?.localPath || '').trim(),
      String(value11?.originalLocalPath || '').trim(),
      String(value11?.displayLocalPath || '').trim(),
      String(value11?.thumbLocalPath || '').trim(),
      String(value11?.previewLocalPath || '').trim(),
      String(value11?.previewUrl || '').trim(),
      String(value11?.thumbUrl || '').trim(),
      String(value11?.thumbnailUrl || '').trim(),
      String(value11?.capturePreviewUrl || '').trim(),
      String(getPrimarySourceImageItem(value11)?.previewLocalPath || '').trim(),
      String(getPrimarySourceImageItem(value11)?.thumbLocalPath || '').trim(),
      String(getPrimarySourceImageItem(value11)?.displayLocalPath || '').trim(),
      String(getPrimarySourceImageItem(value11)?.previewUrl || '').trim(),
      String(getPrimarySourceImageItem(value11)?.thumbUrl || '').trim(),
      String(getPrimarySourceImageItem(value11)?.thumbnailUrl || '').trim(),
      this._shouldUseLowZoomThumbnail() ? 'thumb' : 'full',
    ].join('|');
  }
  ['_revokeCapturePreviewUrl'](value12) {
    const enabled8 = String(value12 || '').trim();
    if (!enabled8 || !enabled8.startsWith('blob:')) return;
    const value13 = globalThis.window?.URL || globalThis.URL;
    if (typeof value13?.revokeObjectURL !== 'function') return;
    try {
      value13.revokeObjectURL(enabled8);
    } catch {}
  }
  ['_adoptCapturePreviewUrl'](value14) {
    const value15 = String(value14 || '').trim();
    (this._activeCapturePreviewUrl &&
      this._activeCapturePreviewUrl !== value15 &&
      this._revokeCapturePreviewUrl(this._activeCapturePreviewUrl),
      (this._activeCapturePreviewUrl = value15));
  }
  ['_releaseActiveCapturePreviewUrl']() {
    if (!this._activeCapturePreviewUrl) return;
    const value16 = this._activeCapturePreviewUrl;
    ((this._activeCapturePreviewUrl = ''), this._revokeCapturePreviewUrl(value16));
  }
  async ['_refreshImageDisplay'](enabled9 = false) {
    const value17 = this._getPreviewSignature();
    if (!enabled9 && value17 === this._resolvedPreviewSig) return;
    this._resolvedPreviewSig = value17;
    const value18 = ++this._previewResolveToken,
      enabled10 = this._getPrimaryImageUrl(),
      value19 = this._getCapturePreviewUrl(),
      value20 = this._getSynchronousThumbUrl(),
      response = this._getImageDisplayLod();
    if (response.lod === 'thumb' && response.url) {
      ((this._cachedThumbUrl = value20 || response.url),
        this._releaseActiveCapturePreviewUrl(),
        this._showLowZoomThumb(response.url));
      return;
    }
    if (!enabled10 && value19) {
      (this._adoptCapturePreviewUrl(value19), this._showImg(value19, this._cachedThumbUrl));
      return;
    }
    if (enabled10) {
      ((this._cachedThumbUrl = value20 || this._cachedThumbUrl || ''),
        this._showImg(enabled10, this._cachedThumbUrl || value19));
      return;
    }
    if (value20) {
      ((this._cachedThumbUrl = value20),
        this._releaseActiveCapturePreviewUrl(),
        this._showLowZoomThumb(value20));
      return;
    }
    let thumbnail = '';
    try {
      thumbnail = await getThumbnail(this._data);
    } catch {
      thumbnail = '';
    }
    if (value18 !== this._previewResolveToken) return;
    this._cachedThumbUrl = value20 || thumbnail || '';
    if (value19) {
      (this._adoptCapturePreviewUrl(value19), this._showImg(value19, this._cachedThumbUrl));
      return;
    }
    if (this._cachedThumbUrl) {
      this._showLowZoomThumb(this._cachedThumbUrl);
      return;
    }
    this._showImg('', '');
  }
  ['_scheduleImageDisplayRefresh'](value21 = false) {
    if (this._idleImageRefreshCancel) return;
    this._idleImageRefreshCancel = scheduleSourceImageIdleTask(() => {
      this._idleImageRefreshCancel = null;
      if (!this._img) return;
      void this._refreshImageDisplay(value21);
    });
  }
  ['mount']() {
    const el = this.el,
      value22 = this._data;
    Object.assign(el.style, {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'visible',
      pointerEvents: 'auto',
      cursor: 'default',
    });
    const value23 = this._getCapturePreviewUrl(value22),
      response2 = this._getImageDisplayLod(value22),
      enabled11 = response2.url || value23,
      value24 = this._getSynchronousThumbUrl(value22) || value23,
      value25 = response2.lod !== 'thumb' && !!response2.url && response2.url !== value24,
      value26 = value25 ? value24 : enabled11,
      value27 = value25 ? (value26 ? 'placeholder' : '') : response2.lod;
    (this._adoptCapturePreviewUrl(value23),
      (this._currentSrc = enabled11),
      (this._currentJobStatus = value22.jobStatus || null),
      setStaticInnerHTML(el, 'toolbar:image'),
      (this._card = document.createElement('div')),
      (this._card.className = 'img-node-preview'),
      Object.assign(this._card.style, {
        background: 'var(--white-05)',
        border: '1px solid var(--stroke-10)',
        borderRadius: '18px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        flexShrink: '0',
      }),
      (this._img = document.createElement('img')),
      (this._img.className = 'node-img'),
      (this._img.decoding = 'async'),
      (this._img.loading = 'eager'));
    const enabled12 = this._rendererMediaDeferred === true,
      value28 = enabled12 ? value24 : '',
      display = enabled12 ? value28 : value26;
    'fetchPriority' in this._img &&
      (this._img.fetchPriority = display && (enabled12 || value26 !== enabled11) ? 'high' : 'auto');
    (Object.assign(this._img.style, {
      pointerEvents: 'none',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: display ? 'block' : 'none',
    }),
      this._setImageLodSrc(enabled12 ? (value28 ? 'placeholder' : '') : value27));
    if (display) this._img.src = display;
    ((this._maskOverlay = document.createElement('img')),
      (this._maskOverlay.className = 'node-img-mask-overlay'),
      Object.assign(this._maskOverlay.style, { pointerEvents: 'none' }));
    !enabled12 && this._applyMaskPreview(value22.maskPreviewUrl || value22.maskPreview);
    ((this._jobUI = document.createElement('div')),
      (this._jobUI.className = 'node-job-ui'),
      Object.assign(this._jobUI.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '5',
        display: 'none',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-node)',
        pointerEvents: 'none',
      }),
      (this._hint = document.createElement('div')),
      (this._hint.className = 'node-upload-hint source-upload-hint'),
      Object.assign(this._hint.style, {
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: '10',
        display: 'block',
      }),
      (this._uploadBtn = document.createElement('button')),
      (this._uploadBtn.type = 'button'),
      (this._uploadBtn.className = 'upload-btn source-upload-btn'));
    const value29 = 'http://www.w3.org/2000/svg',
      el2 = document.createElementNS(value29, 'svg');
    (el2.setAttribute('width', '14'),
      el2.setAttribute('height', '14'),
      el2.setAttribute('viewBox', '0 0 24 24'),
      el2.setAttribute('fill', 'none'),
      el2.setAttribute('stroke', 'currentColor'),
      el2.setAttribute('stroke-width', '2.5'));
    const el3 = document.createElementNS(value29, 'path');
    el3.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
    const el4 = document.createElementNS(value29, 'polyline');
    el4.setAttribute('points', '17 8 12 3 7 8');
    const el5 = document.createElementNS(value29, 'line');
    (el5.setAttribute('x1', '12'),
      el5.setAttribute('y1', '3'),
      el5.setAttribute('x2', '12'),
      el5.setAttribute('y2', '15'),
      el2.appendChild(el3),
      el2.appendChild(el4),
      el2.appendChild(el5),
      this._uploadBtn.appendChild(el2),
      (this._uploadLabelNode = document.createTextNode('')),
      this._uploadBtn.appendChild(this._uploadLabelNode),
      this._syncLocaleTexts(),
      this._hint.appendChild(this._uploadBtn));
    const value30 = document.createElement('div');
    value30.className = 'node-port out-port';
    const el6 = document.createElement('div');
    ((el6.className = 'node-resizer'),
      this._card.appendChild(this._img),
      this._card.appendChild(this._maskOverlay),
      this._card.appendChild(this._jobUI),
      this._card.appendChild(this._hint),
      this._card.appendChild(value30),
      this._card.appendChild(el6),
      el.appendChild(this._card),
      this._syncJobUI(this._currentJobStatus));
    if (shouldShowGenerationResultLoadingUi(value22, { hasResult: !!enabled11 }) && !this._currentJobStatus) {
      startLoading(this._card, { variant: 'static' });
      if (this._hint) this._hint.style.display = 'none';
      if (this._uploadBtn) this._uploadBtn.disabled = true;
    }
    this._card.addEventListener('dblclick', (event) => {
      (event.stopPropagation(), openNodeImagePreview(this._data));
    });
    const run2 = () => isCanvasLowZoomActive() || this._img?.dataset?.lodSrc === 'thumb',
      handler5 = () => {
        if (!run2()) return;
        ((this._resolvedPreviewSig = ''), void this._refreshImageDisplay(true));
      },
      handler6 = (count = 0) => {
        this._lowZoomHoverRefreshTimer &&
          (clearTimeout(this._lowZoomHoverRefreshTimer), (this._lowZoomHoverRefreshTimer = null));
        if (count > 0) {
          this._lowZoomHoverRefreshTimer = setTimeout(() => {
            ((this._lowZoomHoverRefreshTimer = null),
              run2() && setNodeMediaLodHoverPromoted(this.el, true),
              handler5());
          }, count);
          return;
        }
        (setNodeMediaLodHoverPromoted(this.el, false), handler5());
      };
    (this._card.addEventListener('pointerenter', () => handler6(SOURCE_IMAGE_LOD_HOVER_REFRESH_DELAY_MS)),
      this._card.addEventListener('pointerleave', () => handler6(0)),
      (this._input = document.createElement('input')),
      (this._input.type = 'file'),
      (this._input.accept = 'image/*'),
      (this._input.style.display = 'none'),
      el.appendChild(this._input),
      this._uploadBtn.addEventListener('click', (event2) => {
        (event2.stopPropagation(), this._input.click());
      }));
    el6 &&
      el6.addEventListener('pointerdown', (event3) => {
        const value31 = appStore.getStateRaw().ui?.imageVideoNodeResizeEnabled === true,
          value32 = document.getElementById('v2-wrap')?.classList.contains('v2-media-node-resize-enabled');
        if (!(value31 && value32)) return;
        startNodeResizePreview({
          event: event3,
          nodeId: this.id,
          getNode: () => appStore.getStateRaw().nodes?.[this.id] || this._data,
          getViewport: () => appStore.getStateRaw().viewport,
          resolveSize: ({ startWidth: startWidth, startHeight: startHeight, dx: dx, dy: dy }) => {
            const value33 = startWidth / startHeight,
              value34 = Math.max(dx / startWidth, dy / startHeight),
              value35 = Math.max(SOURCE_IMAGE_MIN_SIZE / startWidth, SOURCE_IMAGE_MIN_SIZE / startHeight),
              value36 = Math.max(value35, 1 + value34),
              width3 = Math.max(SOURCE_IMAGE_MIN_SIZE, Math.round(startWidth * value36)),
              height2 = Math.max(SOURCE_IMAGE_MIN_SIZE, Math.round(width3 / value33));
            return { width: width3, height: height2 };
          },
          buildFinalPatch: ({ startNode: startNode }) =>
            startNode?.needsAutoResize ? { needsAutoResize: false } : {},
          applyPatch: (value37) => appStore.updateNodeData(this.id, value37),
          commit: commit,
        });
      });
    this._input.addEventListener('change', async (event4) => {
      const error2 = event4.target.files[0];
      if (!error2) return;
      ((this._isUploading = true),
        startLoading(this._card, { variant: 'static' }),
        (this._img.style.display = 'none'));
      const list2 = Array.from(this._uploadBtn.childNodes).map((item2) => item2.cloneNode(true));
      ((this._uploadBtn.textContent = sourceImageText('upload.transcoding')),
        (this._uploadBtn.style.pointerEvents = 'none'));
      try {
        const width4 = await new Promise((handler7, handler8) => {
            const value38 = URL.createObjectURL(error2),
              box2 = new Image();
            ((box2.onload = () => {
              const width5 = Math.round(Number(box2.naturalWidth || box2.width) || 0),
                height3 = Math.round(Number(box2.naturalHeight || box2.height) || 0),
                box3 = document.createElement('canvas');
              ((box3.width = width5), (box3.height = height3));
              const ctx = box3.getContext('2d');
              ((ctx.fillStyle = 'var(--text-primary)'),
                ctx.fillRect(0, 0, box3.width, box3.height),
                ctx.drawImage(box2, 0, 0),
                URL.revokeObjectURL(value38),
                box3.toBlob(
                  (enabled13) => {
                    if (!enabled13) {
                      handler8(new Error(sourceImageText('upload.canvasTranscodeFailed')));
                      return;
                    }
                    const value39 = Math.random().toString(36).substring(2, 8),
                      value40 = error2.name.replace(/\.[^/.]+$/, ''),
                      value41 = 'upload_' + value39 + '_' + value40 + '.jpg';
                    handler7({
                      file: new File([enabled13], value41, { type: 'image/jpeg' }),
                      width: width5,
                      height: height3,
                    });
                  },
                  'image/jpeg',
                  0.85,
                ));
            }),
              (box2.onerror = () => {
                (URL.revokeObjectURL(value38),
                  handler8(new Error(sourceImageText('upload.imageLoadFailed'))));
              }),
              (box2.src = value38));
          }),
          error3 = width4.file;
        this._uploadBtn.textContent = sourceImageText('upload.uploading');
        const value42 = window.currentProjectId || 'default_v2_project',
          assetId = await uploadFile(error3, value42),
          width6 =
            assetId?.displayLocalPath || assetId?.thumbLocalPath
              ? assetId
              : await ensureLocalImageDerivatives(assetId?.originalLocalPath || assetId?.localPath),
          src = String(assetId?.url || width6?.originalUrl || '').trim(),
          args2 = buildImageNodeStorageFields(width6),
          args3 = buildSourceImageUploadSizePatch(
            {
              width: width6?.originalWidth || args2.originalWidth,
              height: width6?.originalHeight || args2.originalHeight,
            },
            { width: width4.width, height: width4.height },
          ),
          value43 = error2.name.replace(/\.[^/.]+$/, '');
        appStore.renameNode(this.id, value43);
        const value44 = document.getElementById(this.id),
          el7 = value44?.__v2_name_el;
        if (el7) el7.textContent = value43;
        (appStore.updateNodeData(this.id, {
          src: src,
          assetId: assetId?.assetId || width6?.assetId || '',
          derivativeStatus: assetId?.derivativeStatus || width6?.derivativeStatus || width6?.status || '',
          ...args2,
          fileName: width6.filename || assetId?.filename || error3.name,
          ...args3,
        }),
          !args2.thumbLocalPath && src && this._queueThumbnail(src));
      } catch (value45) {
        (console.error('图片上传失败:', value45),
          alert(sourceImageText('upload.failedRetry')),
          stopLoading(this._card),
          this._currentSrc && (this._img.style.display = 'block'));
      } finally {
        ((this._isUploading = false),
          this._uploadBtn.replaceChildren(...list2.map((item3) => item3.cloneNode(true))),
          (this._uploadLabelNode = null),
          this._syncLocaleTexts(),
          (this._uploadBtn.style.pointerEvents = 'auto'),
          (this._input.value = ''));
      }
    });
    enabled11 && value26 !== enabled11
      ? this._scheduleImageDisplayRefresh(true)
      : void this._refreshImageDisplay(true);
    const value46 = el.querySelector('.node-floating-toolbar');
    return (
      bindImageToolbarEvents(value46, this.id),
      el.addEventListener('v2-node:free-angle', (event5) => {
        (event5.stopPropagation(), this._switchToFreeAngle());
      }),
      !isTaskFailed(this._data) &&
        !isTaskCancelled(this._data) &&
        (this._maybeResumeRunningHubTask(), this._maybeResumeDreaminaTask(), this._maybeResumeAsyncTask()),
      (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())),
      el
    );
  }
  ['_syncLocaleTexts']() {
    if (!this._uploadBtn || this._isUploading) return;
    ((!this._uploadLabelNode || this._uploadLabelNode.parentNode !== this._uploadBtn) &&
      (this._uploadLabelNode =
        Array.from(this._uploadBtn.childNodes || []).find((item4) => item4?.nodeType === 3) || null),
      !this._uploadLabelNode &&
        ((this._uploadLabelNode = document.createTextNode('')),
        this._uploadBtn.appendChild(this._uploadLabelNode)),
      (this._uploadLabelNode.textContent = ' ' + sourceImageText('upload.button')));
  }
  async ['_switchToFreeAngle']() {
    if (ImageFreeAngleController.active && ImageFreeAngleController.nodeId === this.id) {
      ImageFreeAngleController._exit();
      return;
    }
    if (window.v2FocusOnNodeAtZoomPercent) window.v2FocusOnNodeAtZoomPercent(this.id, 60);
    const value47 = this.el.querySelector('.act-multiangle');
    ((this._bottomPanel = document.createElement('div')),
      (this._bottomPanel.className = 'text-prompt-panel'),
      this._bottomPanel.addEventListener('pointerdown', (event6) => {
        event6.stopPropagation();
      }),
      await ImageFreeAngleController.render(
        this.id,
        this._bottomPanel,
        () => this._switchToImage(),
        () => this._handleGenerate(),
        value47,
      ),
      this.el.appendChild(this._bottomPanel));
  }
  ['_switchToImage']() {
    this._bottomPanel &&
      this._bottomPanel.parentNode &&
      (this._bottomPanel.parentNode.removeChild(this._bottomPanel), (this._bottomPanel = null));
  }
  ['_handleGenerate']() {
    if (window.showToast) window.showToast(sourceImageText('toasts.generateUnsupported'), 'info');
  }
  ['_showLowZoomThumb'](value48) {
    const enabled14 = String(value48 || '').trim();
    if (!enabled14) {
      this._showImg('', '');
      return;
    }
    (stopLoading(this._card), (this._currentSrc = enabled14));
    this._img &&
      (this._setImageLodSrc('thumb'),
      String(this._img.getAttribute('src') || '').trim() !== enabled14 && (this._img.src = enabled14),
      (this._img.style.display = 'block'));
    if (this._hint) this._hint.style.display = 'block';
  }
  ['_showImg'](url, value49 = '') {
    if (this._rendererMediaDeferred === true) {
      this._currentSrc = String(url || '').trim();
      return;
    }
    if (!url) {
      (stopLoading(this._card), this._setImageLodSrc(''), (this._img.style.display = 'none'));
      if (this._data?.isGenerating) {
        if (this._hint) this._hint.style.display = 'none';
      } else {
        if (this._hint) this._hint.style.display = 'block';
      }
      return;
    }
    const fallbackThumb = String(value49 || this._cachedThumbUrl || '').trim();
    logDragImportProfile('SourceImageNode:show-img', {
      id: this.id,
      url: url,
      fallbackThumb: fallbackThumb,
      currentSrc: this._currentSrc || '',
      isGenerating: !!this._data?.isGenerating,
      jobStatus: this._data?.jobStatus || '',
    });
    if (this._failedSrc === url && fallbackThumb) {
      (this._setImageLodSrc('placeholder'),
        (this._img.src = fallbackThumb),
        (this._img.style.display = 'block'));
      if (this._hint) this._hint.style.display = 'block';
      return;
    }
    const value50 = String(this._img?.getAttribute('src') || '').trim(),
      value51 = this._currentSrc === url && value50 === url && this._img.style.display !== 'none';
    let value52 = false,
      value53 = false;
    if (fallbackThumb && this._currentSrc !== url) {
      (this._setImageLodSrc('placeholder'),
        (this._img.src = fallbackThumb),
        (this._img.style.display = 'block'));
      if (this._hint) this._hint.style.display = 'block';
      value52 = true;
    } else {
      if (this._currentSrc !== url) {
        const enabled15 = String(this._img?.getAttribute('src') || '').trim(),
          value54 = !enabled15 || this._img.style.display === 'none';
        if (!fallbackThumb && value54) {
          (this._setImageLodSrc('full'), (this._img.src = url), (this._img.style.display = 'block'));
          if (this._hint) this._hint.style.display = 'block';
        } else ((this._img.style.display = 'block'), (value53 = true));
      }
    }
    this._currentSrc = url;
    const enabled16 = String(this._img?.getAttribute('src') || '').trim(),
      enabled17 = enabled16 === url && this._img.style.display !== 'none',
      enabled18 =
        !!fallbackThumb && (value52 || enabled16 === fallbackThumb) && this._img.style.display !== 'none',
      enabled19 = value53 && !!enabled16 && enabled16 !== url && this._img.style.display !== 'none';
    !enabled17 && !enabled18 && !enabled19
      ? startLoading(this._card, { variant: 'static' })
      : stopLoading(this._card);
    if (value51) {
      const value55 = appStore.getStateRaw().nodes?.[this.id],
        value56 = Number(value55?.imageWidth || 0) > 0 && Number(value55?.imageHeight || 0) > 0,
        enabled20 = value55?.fixedSize !== true && value55?.needsAutoResize === true;
      if (value56 && !enabled20) {
        if (this._hint) this._hint.style.display = 'block';
        return;
      }
    }
    preloadCanvasImage(url, {
      priority: fallbackThumb ? 20 : 10,
      fetchPriority: fallbackThumb ? 'auto' : 'high',
    })
      .then(({ image: image, naturalWidth: naturalWidth, naturalHeight: naturalHeight }) => {
        if (this._currentSrc !== url) return;
        logDragImportProfile('SourceImageNode:preload:onload', {
          id: this.id,
          url: url,
          naturalWidth: naturalWidth || image?.naturalWidth || 0,
          naturalHeight: naturalHeight || image?.naturalHeight || 0,
        });
        const imageWidth2 = Math.max(1, Math.round(naturalWidth || image?.naturalWidth || 0)),
          imageHeight = Math.max(1, Math.round(naturalHeight || image?.naturalHeight || 0)),
          value57 = appStore.getStateRaw().nodes?.[this.id];
        if (value57) {
          const value58 = Number(value57.imageWidth || 0),
            value59 = Number(value57.imageHeight || 0);
          (value58 !== imageWidth2 || value59 !== imageHeight) &&
            appStore.updateNodeData(this.id, { imageWidth: imageWidth2, imageHeight: imageHeight });
        }
        !enabled17 && (stopLoading(this._card), this._setImageLodSrc('full'), (this._img.src = url));
        this._img.style.display = 'block';
        if (this._hint) this._hint.style.display = 'block';
        this._activeCapturePreviewUrl &&
          this._activeCapturePreviewUrl !== url &&
          (this._releaseActiveCapturePreviewUrl(),
          value57?.capturePreviewUrl && appStore.updateNodeData(this.id, { capturePreviewUrl: '' }));
        !String(value57?.thumbLocalPath || '').trim() && this._queueThumbnail(url);
        if (this._data.fixedSize) return;
        if (!this._data.needsAutoResize) return;
        const { width: width7, height: height4 } = getAutoMediaSizeByShortSide(
          imageWidth2 || 1000,
          imageHeight || 1000,
        );
        appStore.updateNodeData(this.id, { width: width7, height: height4, needsAutoResize: false });
      })
      .catch(() => {
        if (this._currentSrc !== url) return;
        (stopLoading(this._card), (this._failedSrc = url));
        const enabled21 = String(this._img?.getAttribute('src') || '').trim(),
          value60 = !!enabled21 && enabled21 !== url && this._img.style.display !== 'none';
        if (fallbackThumb)
          (this._setImageLodSrc('placeholder'),
            (this._img.src = fallbackThumb),
            (this._img.style.display = 'block'));
        else
          value60
            ? (this._img.style.display = 'block')
            : (this._setImageLodSrc(''), (this._img.src = ''), (this._img.style.display = 'none'));
        if (this._hint) this._hint.style.display = 'block';
      });
  }
  ['_computeGenerationDuration'](enabled22 = this._data) {
    if (!enabled22) return 0;
    if (typeof enabled22.generationDuration === 'number') return enabled22.generationDuration;
    const count2 = Number(enabled22.generationStartTime || 0);
    if (!Number.isFinite(count2) || count2 <= 0) return 0;
    return Math.max(0, Date.now() - count2);
  }
  ['hydrateDeferredMedia']() {
    if (this._rendererMediaDeferred !== true) return;
    this._rendererMediaDeferred = false;
    const value61 = appStore.getStateRaw().nodes?.[this.id] || this._data;
    this.update(value61);
  }
  ['_inferAsyncProvider'](value62 = this._data) {
    const list3 = String(value62?.model || '').trim(),
      modelProvider = resolveModelProvider(list3, '', { allowProviderHint: false });
    if (modelProvider) return modelProvider;
    const value63 = String(value62?.asyncTaskProvider || value62?.provider || '')
      .trim()
      .toLowerCase();
    if (value63) return value63;
    if (list3 && !list3.includes('/')) return 'grsai';
    return 'grsai';
  }
  ['_isRunningHubRecoverableTask'](enabled23 = this._data) {
    if (!enabled23 || typeof enabled23 !== 'object') return false;
    const enabled24 = String(enabled23.rhTaskId || '').trim();
    if (!enabled24) return false;
    const value64 = String(enabled23.rhTaskStatus || '')
      .trim()
      .toLowerCase();
    if (['success', 'idle', 'cancelled'].includes(value64)) return false;
    if (value64 === 'failed' && !this._isRunningHubLocalPendingFailure(enabled23)) return false;
    const value65 = String(enabled23.provider || '')
        .trim()
        .toLowerCase(),
      value66 = String(enabled23.model || '').trim(),
      modelProvider2 = resolveModelProvider(value66, value65, { allowProviderHint: false });
    return (
      value65 === 'runninghubwf' ||
      value65 === 'runninghub' ||
      isWorkflowModel(value66, value65 || 'runninghubwf') ||
      (modelProvider2 === 'runninghub' && isModelApiModel(value66, 'runninghub'))
    );
  }
  ['_isRunningHubLocalPendingFailure'](value67 = this._data) {
    const list4 = [value67?.outputText, value67?.jobError, value67?.rhStatusMessage]
      .map((item5) => String(item5 || '').trim())
      .filter(Boolean)
      .join('\n')
      .toLowerCase();
    if (!list4) return false;
    return (
      list4.includes('任务超时') ||
      list4.includes('请求超时') ||
      list4.includes('处理超时') ||
      list4.includes('仍在生成') ||
      list4.includes('继续查询') ||
      list4.includes('runninghub 仍在生成'.toLowerCase())
    );
  }
  ['_clearRunningHubRecoveryRetry']() {
    if (!this._rhResumeRetryTimer) return;
    (clearTimeout(this._rhResumeRetryTimer), (this._rhResumeRetryTimer = null));
  }
  ['_scheduleRunningHubRecoveryRetry'](value68 = 5000) {
    (this._clearRunningHubRecoveryRetry(),
      (this._rhResumeRetryTimer = setTimeout(
        () => {
          ((this._rhResumeRetryTimer = null), this._maybeResumeRunningHubTask());
        },
        Math.max(1000, Number(value68) || 5000),
      )));
  }
  ['_isDreaminaRecoverableTask'](enabled25 = this._data) {
    if (!enabled25 || typeof enabled25 !== 'object') return false;
    const enabled26 = String(enabled25.dreaminaSubmitId || '').trim();
    if (!enabled26) return false;
    const value69 = String(enabled25.provider || '')
        .trim()
        .toLowerCase(),
      value70 = String(enabled25.model || '').trim();
    if (!(value69 === 'dreamina' || resolveModelProvider(value70, value69) === 'dreamina')) return false;
    const taskStatus = normalizeTaskStatus(enabled25.jobStatus),
      taskStatus2 = normalizeTaskStatus(enabled25.dreaminaTaskPhase),
      taskStatus3 = normalizeTaskStatus(enabled25.dreaminaTaskStatus);
    if (NON_RECOVERABLE_FAILURE_STATUSES.has(taskStatus)) return false;
    if (DREAMINA_NON_RECOVERABLE_PHASES.has(taskStatus2)) return false;
    if (DREAMINA_NON_RECOVERABLE_STATUSES.has(taskStatus3)) return false;
    if (enabled25.isGenerating === true && enabled25.dreaminaTaskRecovering !== true) {
      const count3 = Number(
        enabled25.dreaminaTaskLastCheckedAt ||
          enabled25.dreaminaTaskStartedAt ||
          enabled25.generationStartTime ||
          0,
      );
      if (Number.isFinite(count3) && count3 > 0 && Date.now() - count3 < DREAMINA_STALE_ACTIVE_RESUME_MS)
        return false;
    }
    return true;
  }
  ['_isDreaminaPollTimeoutError'](error4) {
    const value71 = String(error4?.code || '')
      .trim()
      .toUpperCase();
    if (value71 === DREAMINA_POLL_TIMEOUT_CODE || value71 === 'TIMEOUT') return true;
    const value72 = String(error4?.type || '')
      .trim()
      .toUpperCase();
    if (value72 === 'TIMEOUT' || value72 === 'TASK_TIMEOUT') return true;
    const list5 = String(error4?.message || '')
      .trim()
      .toLowerCase();
    return list5.includes('timeout') || list5.includes('超时');
  }
  ['_isAsyncRecoverableTask'](enabled27 = this._data) {
    if (!enabled27 || typeof enabled27 !== 'object') return false;
    const enabled28 = String(enabled27.asyncTaskId || '').trim();
    if (!enabled28) return false;
    const enabled29 = this._inferAsyncProvider(enabled27);
    if (!enabled29 || enabled29 === 'runninghubwf' || enabled29 === 'runninghub' || enabled29 === 'dreamina')
      return false;
    const value73 = String(enabled27.asyncTaskKind || '')
      .trim()
      .toLowerCase();
    if (value73 && value73 !== 'image') return false;
    const value74 = String(enabled27.asyncTaskStatus || '')
      .trim()
      .toLowerCase();
    if (['success', 'failed', 'idle', 'cancelled'].includes(value74)) return false;
    return true;
  }
  ['_stopRunningHubRecovery'](enabled30 = true) {
    try {
      this._rhResumeAbortController?.abort?.();
    } catch {}
    (this._clearRunningHubRecoveryRetry(),
      (this._rhResumeAbortController = null),
      (this._rhResumePromise = null),
      (this._rhResumeTaskId = ''));
    if (!enabled30) return;
    const enabled31 = appStore.getState().nodes?.[this.id];
    if (!enabled31 || enabled31.rhTaskRecovering !== true) return;
    appStore.updateNodeData(this.id, { rhTaskRecovering: false });
  }
  ['_stopDreaminaRecovery'](enabled32 = true) {
    try {
      this._dreaminaResumeAbortController?.abort?.();
    } catch {}
    ((this._dreaminaResumeAbortController = null),
      (this._dreaminaResumePromise = null),
      (this._dreaminaResumeSubmitId = ''));
    if (!enabled32) return;
    const enabled33 = appStore.getState().nodes?.[this.id];
    if (!enabled33 || enabled33.dreaminaTaskRecovering !== true) return;
    appStore.updateNodeData(this.id, { dreaminaTaskRecovering: false });
  }
  ['_stopAsyncRecovery'](enabled34 = true) {
    try {
      this._asyncResumeAbortController?.abort?.();
    } catch {}
    ((this._asyncResumeAbortController = null),
      (this._asyncResumePromise = null),
      (this._asyncResumeTaskId = ''));
    if (!enabled34) return;
    const enabled35 = appStore.getState().nodes?.[this.id];
    if (!enabled35 || enabled35.asyncTaskRecovering !== true) return;
    appStore.updateNodeData(this.id, { asyncTaskRecovering: false });
  }
  ['_resolveRunningHubResumePayload'](value75) {
    const model = String(value75?.model || '').trim(),
      value76 = String(value75?.provider || '')
        .trim()
        .toLowerCase();
    let provider = value76;
    return (
      !provider && (provider = isModelApiModel(model, 'runninghub') ? 'runninghub' : 'runninghubwf'),
      { model: model, provider: provider }
    );
  }
  ['_resolveDreaminaResumePayload'](value77) {
    return {
      model: String(value77?.model || '').trim() || getDefaultDreaminaImageModelId(),
      provider: 'dreamina',
    };
  }
  ['_resolveAsyncResumePayload'](value78) {
    return { model: String(value78?.model || '').trim(), provider: this._inferAsyncProvider(value78) };
  }
  ['_fileNameFromPath'](value79) {
    const enabled36 = String(value79 || '').replace(/^\/+/, '');
    if (!enabled36) return '';
    const list6 = enabled36.split('/');
    return String(list6[list6.length - 1] || '').trim();
  }
  ['_buildRecoveredImageResultPatch'](
    value80,
    sourceImageText2 = sourceImageText('recovery.imageTaskFailed'),
  ) {
    const enabled37 = value80?.isBatch && Array.isArray(value80.images) ? value80.images[0] : value80;
    if (!enabled37 || enabled37.error) throw new Error(String(enabled37?.error || sourceImageText2));
    const args4 = buildCanvasLocalImageFields(enabled37, { includeSrc: true });
    if (!args4.src || !args4.localPath) throw new Error(sourceImageText('recovery.noOutputImage'));
    return { ...args4, fileName: this._fileNameFromPath(args4.localPath) };
  }
  ['_maybeResumeRunningHubTask']() {
    const value81 = appStore.getState().nodes?.[this.id] || this._data;
    if (!this._isRunningHubRecoverableTask(value81)) {
      this._stopRunningHubRecovery(true);
      return;
    }
    const taskId = String(value81?.rhTaskId || '').trim();
    if (!taskId) return;
    if (this._rhResumePromise && this._rhResumeTaskId === taskId) return;
    const startedAt2 = Number(value81?.rhTaskStartedAt || value81?.generationStartTime || 0) || Date.now(),
      provider2 = this._resolveRunningHubResumePayload(value81),
      rhTaskUseOpenapiQuery = value81?.rhTaskUseOpenapiQuery === true,
      handler9 =
        typeof this._resumeRunningHubTaskPoller === 'function'
          ? this._resumeRunningHubTaskPoller
          : resumeRunningHubImageTask,
      signal = new AbortController();
    ((this._rhResumeAbortController = signal), (this._rhResumeTaskId = taskId));
    const value82 = (async () => {
      try {
        const response3 = await resumeTask(
          {
            sourceNodeId: this.id,
            targetNodeId: this.id,
            trigger: 'node',
            taskType: 'image-generation',
            provider: provider2.provider || value81?.provider || 'runninghubwf',
            adapterType: 'workflow',
            modelId: provider2.model || value81?.model || '',
            executionId: 'runninghub.source-image.' + (provider2.model || value81?.model || 'workflow'),
            payload: provider2,
            taskId: taskId,
            cancellable: false,
            resumable: true,
            startBuilder: () => ({
              rhTaskStatus:
                String(value81?.rhTaskStatus || '')
                  .trim()
                  .toLowerCase() === 'pending'
                  ? 'pending'
                  : 'running',
              rhTaskUseOpenapiQuery: rhTaskUseOpenapiQuery,
            }),
            poll: async () =>
              handler9(taskId, provider2, {
                signal: signal.signal,
                useOpenapiQuery: rhTaskUseOpenapiQuery,
                softTimeout: true,
              }),
            resultBuilder: async (value83) => {
              const error5 = appStore.getState().nodes?.[this.id] || {},
                name = String(error5?.name || sourceImageText('result.defaultName'))
                  .replace(/\s*\(处理中\)\s*$/, '')
                  .replace(/\s*\(恢复中\)\s*$/, '')
                  .trim();
              return {
                ...this._buildRecoveredImageResultPatch(value83, sourceImageText('recovery.imageTaskFailed')),
                name: name || sourceImageText('result.defaultName'),
                generationDuration: this._computeGenerationDuration(error5),
              };
            },
            failureBuilder: (error6, startedAt3) => {
              const error7 =
                  error6 instanceof Error
                    ? error6.message
                    : String(error6 || sourceImageText('recovery.taskFailed')),
                value84 = appStore.getState().nodes?.[this.id] || {};
              return buildSourceImageRecoveryFailurePatch(value84, {
                error: error7,
                startedAt: startedAt3.startedAt,
                duration: this._computeGenerationDuration(value84),
              });
            },
            parseError: (error8) =>
              error8 instanceof Error
                ? error8.message
                : String(error8 || sourceImageText('recovery.taskFailed')),
          },
          { store: appStore, startedAt: startedAt2, abortController: signal },
        );
        if (response3.status === 'pending') {
          (window._triggerLocalCacheSave?.(), this._scheduleRunningHubRecoveryRetry());
          return;
        }
        response3.status === 'success' && window._triggerLocalCacheSave?.();
      } catch (error9) {
        if (
          signal.signal.aborted ||
          String(error9?.message || '') === 'CANCELLED' ||
          error9?.name === 'AbortError'
        )
          return;
        const error10 =
            error9 instanceof Error
              ? error9.message
              : String(error9 || sourceImageText('recovery.taskFailed')),
          enabled38 = appStore.getState().nodes?.[this.id];
        if (!enabled38) return;
        appStore.updateNodeData(this.id, {
          ...buildSourceImageRecoveryFailurePatch(enabled38, {
            error: error10,
            startedAt: startedAt2,
            duration: this._computeGenerationDuration(enabled38),
          }),
          isGenerating: false,
          rhTaskStatus: 'failed',
          rhTaskRecovering: false,
        });
      } finally {
        (this._rhResumeAbortController === signal && (this._rhResumeAbortController = null),
          this._rhResumeTaskId === taskId && (this._rhResumeTaskId = ''),
          (this._rhResumePromise = null));
      }
    })();
    this._rhResumePromise = value82;
  }
  ['_maybeResumeDreaminaTask']() {
    const value85 = appStore.getState().nodes?.[this.id] || this._data;
    if (!this._isDreaminaRecoverableTask(value85)) {
      this._stopDreaminaRecovery(true);
      return;
    }
    const taskId2 = String(value85?.dreaminaSubmitId || '').trim();
    if (!taskId2) return;
    if (this._dreaminaResumeSubmitId === taskId2) return;
    const dreaminaTaskStartedAt =
        Number(value85?.dreaminaTaskStartedAt || value85?.generationStartTime || 0) || Date.now(),
      modelId = this._resolveDreaminaResumePayload(value85),
      handler10 =
        typeof this._dreaminaResumePoller === 'function'
          ? this._dreaminaResumePoller
          : resumeDreaminaImageTask,
      signal2 = new AbortController();
    ((this._dreaminaResumeAbortController = signal2), (this._dreaminaResumeSubmitId = taskId2));
    const value86 = (async () => {
      try {
        const response4 = await resumeTask(
          {
            sourceNodeId: this.id,
            targetNodeId: this.id,
            trigger: 'node',
            taskType: 'image-generation',
            provider: 'dreamina',
            adapterType: 'localRuntime',
            modelId: modelId.model || value85?.model || '',
            executionId: 'dreamina.source-image.' + (modelId.model || value85?.model || 'image'),
            payload: modelId,
            taskId: taskId2,
            cancellable: false,
            resumable: true,
            startBuilder: () => ({
              dreaminaSubmitId: taskId2,
              dreaminaTaskStatus: 'pending',
              dreaminaTaskPhase: 'generating',
              dreaminaTaskLabel:
                String(value85?.dreaminaTaskLabel || '').trim() || sourceImageText('status.generating'),
              dreaminaTaskStartedAt: dreaminaTaskStartedAt,
              dreaminaTaskLastCheckedAt: Date.now(),
              dreaminaTaskRecovering: true,
            }),
            poll: async () => handler10(taskId2, modelId, { signal: signal2.signal }),
            resultBuilder: async (value87, value88) => {
              const error11 = appStore.getState().nodes?.[this.id] || {},
                name2 = String(error11?.name || sourceImageText('result.defaultName'))
                  .replace(/\s*\(处理中\)\s*$/, '')
                  .replace(/\s*\(恢复中\)\s*$/, '')
                  .trim();
              return {
                ...this._buildRecoveredImageResultPatch(
                  value87,
                  sourceImageText('recovery.dreaminaImageTaskFailed'),
                ),
                isGenerating: false,
                name: name2 || sourceImageText('result.defaultName'),
                generationDuration: this._computeGenerationDuration(error11),
                dreaminaTaskStatus: 'success',
                dreaminaTaskPhase: 'done',
                dreaminaTaskLabel: sourceImageText('status.completed'),
                dreaminaTaskLastCheckedAt: Date.now(),
                dreaminaTaskRecovering: false,
              };
            },
            failureBuilder: (error12, dreaminaTaskStartedAt2) => {
              const error13 =
                  error12 instanceof Error
                    ? error12.message
                    : String(error12 || sourceImageText('recovery.taskFailed')),
                value89 = appStore.getState().nodes?.[this.id] || {};
              if (this._isDreaminaPollTimeoutError(error12))
                return {
                  isGenerating: true,
                  jobStatus: 'running',
                  jobError: null,
                  generationDuration: Date.now() - dreaminaTaskStartedAt2.startedAt,
                  dreaminaTaskStatus: 'pending',
                  dreaminaTaskPhase: 'generating',
                  dreaminaTaskLabel: sourceImageText('status.queuedBackground'),
                  dreaminaTaskStartedAt: dreaminaTaskStartedAt2.startedAt,
                  dreaminaTaskLastCheckedAt: Date.now(),
                  dreaminaTaskRecovering: false,
                };
              return {
                ...buildSourceImageRecoveryFailurePatch(value89, {
                  error: error13,
                  startedAt: dreaminaTaskStartedAt2.startedAt,
                  duration: this._computeGenerationDuration(value89),
                }),
                isGenerating: false,
                dreaminaTaskStatus: 'failed',
                dreaminaTaskPhase: 'failed',
                dreaminaTaskLabel: error13 || sourceImageText('recovery.failed'),
                dreaminaTaskLastCheckedAt: Date.now(),
                dreaminaTaskRecovering: false,
              };
            },
            cancelledBuilder: (dreaminaTaskStartedAt3) => ({
              isGenerating: false,
              generationDuration: Date.now() - dreaminaTaskStartedAt3.startedAt,
              dreaminaTaskStatus: 'cancelled',
              dreaminaTaskPhase: 'cancelled',
              dreaminaTaskLabel: sourceImageText('status.cancelled'),
              dreaminaTaskStartedAt: dreaminaTaskStartedAt3.startedAt,
              dreaminaTaskLastCheckedAt: Date.now(),
              dreaminaTaskRecovering: false,
            }),
            parseError: (error14) =>
              error14 instanceof Error
                ? error14.message
                : String(error14 || sourceImageText('recovery.taskFailed')),
          },
          { store: appStore, startedAt: dreaminaTaskStartedAt, abortController: signal2 },
        );
        (response4.status === 'success' ||
          response4.status === 'pending' ||
          (response4.status === 'failed' && this._isDreaminaPollTimeoutError(response4.error))) &&
          window._triggerLocalCacheSave?.();
      } catch (error15) {
        if (
          signal2.signal.aborted ||
          String(error15?.message || '') === 'CANCELLED' ||
          error15?.name === 'AbortError'
        )
          return;
      } finally {
        (this._dreaminaResumeAbortController === signal2 && (this._dreaminaResumeAbortController = null),
          this._dreaminaResumeSubmitId === taskId2 && (this._dreaminaResumeSubmitId = ''),
          (this._dreaminaResumePromise = null));
      }
    })();
    this._dreaminaResumePromise = value86;
  }
  ['_maybeResumeAsyncTask']() {
    const value90 = appStore.getState().nodes?.[this.id] || this._data;
    if (!this._isAsyncRecoverableTask(value90)) {
      this._stopAsyncRecovery(true);
      return;
    }
    const taskId3 = String(value90?.asyncTaskId || '').trim();
    if (!taskId3) return;
    if (this._asyncResumePromise && this._asyncResumeTaskId === taskId3) return;
    const startedAt4 = Number(value90?.asyncTaskStartedAt || value90?.generationStartTime || 0) || Date.now(),
      modelId2 = this._resolveAsyncResumePayload(value90),
      provider3 = modelId2.provider || this._inferAsyncProvider(value90),
      handler11 =
        typeof this._resumeAsyncTaskPoller === 'function'
          ? this._resumeAsyncTaskPoller
          : resumeAsyncImageTask,
      signal3 = new AbortController();
    ((this._asyncResumeAbortController = signal3), (this._asyncResumeTaskId = taskId3));
    const value91 = (async () => {
      try {
        const response5 = await resumeTask(
          {
            sourceNodeId: this.id,
            targetNodeId: this.id,
            trigger: 'node',
            taskType: 'image-generation',
            provider: provider3 || modelId2.provider || value90?.provider || '',
            adapterType: 'modelApi',
            modelId: modelId2.model || value90?.model || '',
            executionId: (provider3 || modelId2.provider || 'model') + '.source-image.async',
            payload: modelId2,
            taskId: taskId3,
            async: true,
            cancellable: false,
            resumable: true,
            startBuilder: () => ({
              asyncTaskProvider: provider3,
              asyncTaskKind: 'image',
              asyncTaskStatus:
                String(value90?.asyncTaskStatus || '')
                  .trim()
                  .toLowerCase() === 'pending'
                  ? 'pending'
                  : 'running',
            }),
            poll: async () => handler11(taskId3, modelId2, { signal: signal3.signal }),
            resultBuilder: async (value92) => {
              const error16 = appStore.getState().nodes?.[this.id] || {},
                name3 = String(error16?.name || sourceImageText('result.defaultName'))
                  .replace(/\s*\(处理中\)\s*$/, '')
                  .replace(/\s*\(恢复中\)\s*$/, '')
                  .trim();
              return {
                ...this._buildRecoveredImageResultPatch(
                  value92,
                  sourceImageText('recovery.asyncImageTaskFailed'),
                ),
                name: name3 || sourceImageText('result.defaultName'),
                generationDuration: this._computeGenerationDuration(error16),
              };
            },
            failureBuilder: (error17, startedAt5) => {
              const error18 =
                  error17 instanceof Error
                    ? error17.message
                    : String(error17 || sourceImageText('recovery.taskFailed')),
                value93 = appStore.getState().nodes?.[this.id] || {};
              return buildSourceImageRecoveryFailurePatch(value93, {
                error: error18,
                startedAt: startedAt5.startedAt,
                duration: this._computeGenerationDuration(value93),
              });
            },
            parseError: (error19) =>
              error19 instanceof Error
                ? error19.message
                : String(error19 || sourceImageText('recovery.taskFailed')),
          },
          { store: appStore, startedAt: startedAt4, abortController: signal3 },
        );
        response5.status === 'success' && window._triggerLocalCacheSave?.();
      } catch (error20) {
        if (
          signal3.signal.aborted ||
          String(error20?.message || '') === 'CANCELLED' ||
          error20?.name === 'AbortError'
        )
          return;
        const error21 =
            error20 instanceof Error
              ? error20.message
              : String(error20 || sourceImageText('recovery.taskFailed')),
          enabled39 = appStore.getState().nodes?.[this.id];
        if (!enabled39) return;
        appStore.updateNodeData(this.id, {
          ...buildSourceImageRecoveryFailurePatch(enabled39, {
            error: error21,
            startedAt: startedAt4,
            duration: this._computeGenerationDuration(enabled39),
          }),
          isGenerating: false,
          asyncTaskStatus: 'failed',
          asyncTaskRecovering: false,
        });
      } finally {
        (this._asyncResumeAbortController === signal3 && (this._asyncResumeAbortController = null),
          this._asyncResumeTaskId === taskId3 && (this._asyncResumeTaskId = ''),
          (this._asyncResumePromise = null));
      }
    })();
    this._asyncResumePromise = value91;
  }
  ['_syncJobUI'](value94) {
    if (!this._jobUI) return;
    value94 = value94 || null;
    if (value94 === 'running') {
      if (this._getCapturePreviewUrl(this._data)) {
        (stopLoading(this._jobUI), (this._jobUI.style.display = 'none'), this._jobUI.replaceChildren());
        if (this._hint) this._hint.style.display = 'none';
        if (this._uploadBtn) this._uploadBtn.disabled = true;
        return;
      }
      ((this._jobUI.style.display = 'flex'),
        this._jobUI.replaceChildren(),
        startLoading(this._jobUI, { variant: 'full' }));
      if (this._hint) this._hint.style.display = 'none';
      if (this._uploadBtn) this._uploadBtn.disabled = true;
    } else {
      if (value94 === 'error') {
        ((this._jobUI.style.display = 'flex'), this._jobUI.replaceChildren(), stopLoading(this._jobUI));
        const el8 = document.createElement('div');
        ((el8.style.color = 'var(--text-danger)'),
          (el8.style.fontSize = '13px'),
          (el8.style.textAlign = 'center'),
          (el8.style.padding = '20px'),
          (el8.style.maxWidth = '90%'),
          (el8.style.wordBreak = 'break-word'),
          (el8.textContent = getTaskMessage(this._data) || sourceImageText('status.generationFailed')),
          this._jobUI.appendChild(el8));
        if (this._hint) this._hint.style.display = 'block';
        if (this._uploadBtn) this._uploadBtn.disabled = false;
      } else {
        this._jobUI.style.display !== 'none' &&
          ((this._jobUI.style.opacity = '0'),
          (this._jobUI.style.transition = 'opacity 0.4s ease'),
          setTimeout(() => {
            ((this._jobUI.style.display = 'none'),
              (this._jobUI.style.opacity = '1'),
              (this._jobUI.style.transition = ''),
              stopLoading(this._jobUI));
          }, 400));
        if (this._hint) this._hint.style.display = 'block';
        if (this._uploadBtn) this._uploadBtn.disabled = false;
      }
    }
  }
  ['update'](value95) {
    if (!this._img) return;
    const value96 = this._currentJobStatus;
    ((this._data = value95), (this._currentJobStatus = value95.jobStatus || null));
    const enabled40 = this._getImageDisplayLod(value95).url || this._getCapturePreviewUrl(value95);
    this._currentJobStatus !== value96 && this._syncJobUI(this._currentJobStatus);
    const shouldShowGenerationResultLoadingUi2 =
      shouldShowGenerationResultLoadingUi(value95, { hasResult: !!enabled40 }) && !this._currentJobStatus;
    if (shouldShowGenerationResultLoadingUi2) {
      startLoading(this._card, { variant: 'static' });
      if (this._hint) this._hint.style.display = 'none';
      if (this._uploadBtn) this._uploadBtn.disabled = true;
    } else {
      if (isTaskTerminal(value95)) {
        stopLoading(this._card);
        if (this._uploadBtn) this._uploadBtn.disabled = false;
      } else {
        if (!this._currentJobStatus) {
          !this._isUploading && enabled40 === this._currentSrc && stopLoading(this._card);
          if (this._uploadBtn) this._uploadBtn.disabled = false;
        }
      }
    }
    (void this._refreshImageDisplay(),
      this._applyMaskPreview(value95.maskPreviewUrl || value95.maskPreview),
      !isTaskFailed(value95) &&
        !isTaskCancelled(value95) &&
        (this._maybeResumeRunningHubTask(), this._maybeResumeDreaminaTask(), this._maybeResumeAsyncTask()));
  }
  ['unmount']() {
    (this._unsubscribeLocale?.(),
      (this._unsubscribeLocale = null),
      this._idleImageRefreshCancel && (this._idleImageRefreshCancel(), (this._idleImageRefreshCancel = null)),
      this._lowZoomHoverRefreshTimer &&
        (clearTimeout(this._lowZoomHoverRefreshTimer), (this._lowZoomHoverRefreshTimer = null)),
      setNodeMediaLodHoverPromoted(this.el, false),
      this._releaseActiveCapturePreviewUrl(),
      this._stopRunningHubRecovery(false),
      this._stopDreaminaRecovery(false),
      this._stopAsyncRecovery(false));
  }
}
