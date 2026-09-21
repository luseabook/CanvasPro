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
  SOURCE_IMAGE_MAX_BUSY_WAIT_MS = 0x2bc,
  SOURCE_IMAGE_LOD_HOVER_REFRESH_DELAY_MS = 160,
  DREAMINA_POLL_TIMEOUT_CODE = 'DREAMINA_POLL_TIMEOUT',
  DREAMINA_STALE_ACTIVE_RESUME_MS = 15 * 0x3e8,
  NON_RECOVERABLE_FAILURE_STATUSES = new Set(['cancelled', 'canceled', 'error', 'fail', 'failed']),
  DREAMINA_NON_RECOVERABLE_STATUSES = new Set([...NON_RECOVERABLE_FAILURE_STATUSES, 'idle']),
  DREAMINA_NON_RECOVERABLE_PHASES = new Set([...NON_RECOVERABLE_FAILURE_STATUSES, 'done']);
function sourceImageText(_0x54a0b0, _0x29d79d = {}) {
  return t('sourceImageNode.' + _0x54a0b0, _0x29d79d);
}
function getSourceImageSchedulerNow() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}
function isSourceImageInteractionBusy() {
  const _0x514a49 = typeof document !== 'undefined' ? document.body?.classList : null;
  return !!(
    _0x514a49?.contains?.('is-panning') ||
    _0x514a49?.contains?.('is-zooming') ||
    _0x514a49?.contains?.('is-viewport-animating')
  );
}
function scheduleSourceImageIdleTask(
  _0x1b5d63,
  { timeout: timeout = SOURCE_IMAGE_IDLE_PRELOAD_TIMEOUT_MS } = {},
) {
  if (typeof _0x1b5d63 !== 'function') return () => {};
  let _0x3db4d7 = false,
    _0x16ed78 = () => {};
  const _0x56384c = getSourceImageSchedulerNow(),
    _0x16ec4c = globalThis.window?.requestIdleCallback || globalThis.requestIdleCallback,
    _0xba649 = globalThis.window?.cancelIdleCallback || globalThis.cancelIdleCallback;
  function _0x4f11de(_0x446cfe) {
    const _0x1d89ef = setTimeout(_0x4b4f0d, _0x446cfe);
    _0x16ed78 = () => clearTimeout(_0x1d89ef);
  }
  const _0x4b4f0d = () => {
    if (_0x3db4d7) return;
    const _0x53d6cf = getSourceImageSchedulerNow() - _0x56384c;
    if (isSourceImageInteractionBusy() && _0x53d6cf < SOURCE_IMAGE_MAX_BUSY_WAIT_MS) {
      _0x4f11de(SOURCE_IMAGE_BUSY_RETRY_MS);
      return;
    }
    _0x1b5d63();
  };
  if (typeof _0x16ec4c === 'function') {
    const _0x1fc081 = _0x16ec4c(_0x4b4f0d, { timeout: timeout });
    _0x16ed78 = () => {
      if (typeof _0xba649 === 'function') _0xba649(_0x1fc081);
    };
  } else _0x4f11de(0);
  return () => {
    ((_0x3db4d7 = true), _0x16ed78());
  };
}
function buildSourceImageRecoveryFailurePatch(
  _0x18dbbb,
  { error: error = '', startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const _0xf88e89 =
      String(error?.message || error || sourceImageText('recovery.taskFailed')).trim() ||
      sourceImageText('recovery.taskFailed'),
    _0x34ed5a = String(_0x18dbbb?.outputText || '').trim(),
    _0x22e587 = _0x34ed5a
      ? _0x34ed5a + '\n' + sourceImageText('recovery.failedWithMessage', { message: _0xf88e89 })
      : sourceImageText('recovery.failedWithMessage', { message: _0xf88e89 });
  return {
    ...buildImageGenerationFailurePatch({
      error: _0xf88e89,
      startedAt: startedAt,
      duration: duration,
      clearMediaFields: false,
    }),
    outputText: _0x22e587,
  };
}
function normalizeImmediateImagePreviewUrl(_0x538553) {
  const _0x5c47c5 = String(_0x538553 || '').trim();
  if (!_0x5c47c5) return '';
  if (/^data:image\//i.test(_0x5c47c5) || /^blob:/i.test(_0x5c47c5) || /^aic-local-preview:/i.test(_0x5c47c5))
    return _0x5c47c5;
  if (/^(?:https?:|file:)/i.test(_0x5c47c5)) return '';
  return toLocalPathUrl(_0x5c47c5);
}
function firstImmediateImagePreviewUrl(_0x20a252) {
  for (const _0x20d0b3 of _0x20a252 || []) {
    const _0xdf3aab = normalizeImmediateImagePreviewUrl(_0x20d0b3);
    if (_0xdf3aab) return _0xdf3aab;
  }
  return '';
}
function getPrimarySourceImageItem(_0x3a321a) {
  const _0x58697a = Array.isArray(_0x3a321a?.images) ? _0x3a321a.images : [];
  if (_0x58697a.length === 0) return null;
  const _0x346d2e = Number(_0x3a321a?.mainImageIndex),
    _0x42f874 = Number.isFinite(_0x346d2e) ? Math.max(0, Math.trunc(_0x346d2e)) : 0;
  return _0x58697a[_0x42f874] || _0x58697a[0] || null;
}
function normalizeTaskStatus(_0x3b684c) {
  return String(_0x3b684c || '')
    .trim()
    .toLowerCase();
}
function normalizeUploadMediaDimensions(_0xa9a0ac, _0x53d313) {
  const _0x4b08a5 = Math.round(Number(_0xa9a0ac) || 0),
    _0x4fcdee = Math.round(Number(_0x53d313) || 0);
  if (_0x4b08a5 <= 0 || _0x4fcdee <= 0) return null;
  return { width: _0x4b08a5, height: _0x4fcdee };
}
export function buildSourceImageUploadSizePatch(..._0x480cb1) {
  for (const _0x22ce08 of _0x480cb1) {
    const _0x4b153a = normalizeUploadMediaDimensions(_0x22ce08?.width, _0x22ce08?.height);
    if (!_0x4b153a) continue;
    const _0x384237 = getAutoMediaSizeByShortSide(_0x4b153a.width, _0x4b153a.height);
    return {
      width: _0x384237.width,
      height: _0x384237.height,
      imageWidth: _0x4b153a.width,
      imageHeight: _0x4b153a.height,
      needsAutoResize: false,
    };
  }
  return { needsAutoResize: true };
}
export class SourceImageNode {
  constructor(_0x1840de) {
    ((this._data = _0x1840de),
      (this.el = document.createElement('div')),
      (this.id = _0x1840de.id),
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
      (this._rendererMediaDeferred = shouldDeferRendererMediaOnMount(_0x1840de)));
  }
  ['_applyMaskPreview'](_0x3ce5e1) {
    if (!this._maskOverlay) return;
    const _0x4f6e9c = String(_0x3ce5e1 || '').trim();
    if (!_0x4f6e9c) {
      this._currentMaskPreview &&
        ((this._maskOverlay.src = ''),
        (this._maskOverlay.style.display = 'none'),
        (this._currentMaskPreview = null));
      return;
    }
    if (this._currentMaskPreview === _0x4f6e9c) return;
    const _0x3be0aa =
      _0x4f6e9c.startsWith('blob:') || _0x4f6e9c.startsWith('data:') || _0x4f6e9c.startsWith('/')
        ? _0x4f6e9c
        : toLocalPathUrl(_0x4f6e9c);
    if (!_0x3be0aa) return;
    ((this._maskOverlay.src = encodeURI(_0x3be0aa)),
      (this._maskOverlay.style.display = 'block'),
      (this._currentMaskPreview = _0x4f6e9c));
  }
  ['_setImageLodSrc'](_0x219dd5) {
    if (!this._img?.dataset) return;
    const _0x24cd39 = String(_0x219dd5 || '').trim();
    if (_0x24cd39) this._img.dataset.lodSrc = _0x24cd39;
    else delete this._img.dataset.lodSrc;
  }
  ['_queueThumbnail'](_0x1c45cb) {
    if (!_0x1c45cb) return;
    if (this._thumbGenSrc === _0x1c45cb) return;
    ((this._thumbGenSrc = _0x1c45cb),
      generateThumbnail(_0x1c45cb)
        .then(async (_0x3a7fc9) => {
          if (!_0x3a7fc9) return;
          const _0x12bd44 = appStore.getState().nodes[this.id];
          if (!_0x12bd44) return;
          if (this._getPrimaryImageUrl(_0x12bd44) !== _0x1c45cb) return;
          (await setThumbnail(_0x12bd44, _0x3a7fc9),
            !this._cachedThumbUrl && (this._cachedThumbUrl = _0x3a7fc9));
        })
        .catch((_0x1d8e12) => {
          console.warn('[SourceImageNode] 缩略图缓存写入失败:', _0x1d8e12);
        })
        .finally(() => {
          if (this._thumbGenSrc === _0x1c45cb) this._thumbGenSrc = null;
        }));
  }
  ['_normalizeLocalUrl'](_0x46b0ba) {
    return toLocalPathUrl(_0x46b0ba);
  }
  ['_getPrimaryImageUrl'](_0x3915a5 = this._data) {
    const _0x3515a0 = pickCanvasImageLocalPath(_0x3915a5);
    return _0x3515a0 ? toLocalPathUrl(_0x3515a0) : '';
  }
  ['_getSynchronousThumbUrl'](_0x5ed22f = this._data) {
    const _0x5cd77e = getPrimarySourceImageItem(_0x5ed22f);
    return (
      firstImmediateImagePreviewUrl([
        _0x5ed22f?.previewLocalPath,
        _0x5ed22f?.thumbLocalPath,
        _0x5ed22f?.thumbnailLocalPath,
        _0x5ed22f?.displayLocalPath,
        _0x5ed22f?.previewUrl,
        _0x5ed22f?.thumbUrl,
        _0x5ed22f?.thumbnailUrl,
        _0x5cd77e?.previewLocalPath,
        _0x5cd77e?.thumbLocalPath,
        _0x5cd77e?.thumbnailLocalPath,
        _0x5cd77e?.displayLocalPath,
        _0x5cd77e?.previewUrl,
        _0x5cd77e?.thumbUrl,
        _0x5cd77e?.thumbnailUrl,
      ]) || resolveCanvasImageThumbUrl(_0x5ed22f)
    );
  }
  ['_getLowZoomImageUrl'](_0x1c8c8d = this._data) {
    return resolveCanvasImageLowZoomUrl(_0x1c8c8d);
  }
  ['_shouldUseLowZoomThumbnail']() {
    return shouldUseLowZoomImageThumbnail({ nodeId: this.id, rootEl: this.el, store: appStore });
  }
  ['_getImageDisplayLod'](_0x28349d = this._data) {
    const _0x2d0f85 = this._getPrimaryImageUrl(_0x28349d),
      _0x11ac99 = this._getSynchronousThumbUrl(_0x28349d) || this._getLowZoomImageUrl(_0x28349d);
    return pickImageLodUrl({
      mainUrl: _0x2d0f85,
      thumbUrl: _0x11ac99,
      lowZoomThumbnail: this._shouldUseLowZoomThumbnail(),
    });
  }
  ['_getCapturePreviewUrl'](_0x14cd9b = this._data) {
    const _0x1c8985 = String(_0x14cd9b?.capturePreviewUrl || '').trim();
    if (!_0x1c8985) return '';
    if (
      _0x1c8985.startsWith('blob:') ||
      _0x1c8985.startsWith('data:image/') ||
      _0x1c8985.startsWith('aic-local-preview:')
    )
      return _0x1c8985;
    if (
      (_0x1c8985.startsWith('http://') || _0x1c8985.startsWith('https://')) &&
      _0x1c8985 === String(_0x14cd9b?.webSourceUrl || '').trim()
    )
      return _0x1c8985;
    return '';
  }
  ['_getPreviewSignature'](_0xb637d7 = this._data) {
    return [
      String(_0xb637d7?.localPath || '').trim(),
      String(_0xb637d7?.originalLocalPath || '').trim(),
      String(_0xb637d7?.displayLocalPath || '').trim(),
      String(_0xb637d7?.thumbLocalPath || '').trim(),
      String(_0xb637d7?.previewLocalPath || '').trim(),
      String(_0xb637d7?.previewUrl || '').trim(),
      String(_0xb637d7?.thumbUrl || '').trim(),
      String(_0xb637d7?.thumbnailUrl || '').trim(),
      String(_0xb637d7?.capturePreviewUrl || '').trim(),
      String(getPrimarySourceImageItem(_0xb637d7)?.previewLocalPath || '').trim(),
      String(getPrimarySourceImageItem(_0xb637d7)?.thumbLocalPath || '').trim(),
      String(getPrimarySourceImageItem(_0xb637d7)?.displayLocalPath || '').trim(),
      String(getPrimarySourceImageItem(_0xb637d7)?.previewUrl || '').trim(),
      String(getPrimarySourceImageItem(_0xb637d7)?.thumbUrl || '').trim(),
      String(getPrimarySourceImageItem(_0xb637d7)?.thumbnailUrl || '').trim(),
      this._shouldUseLowZoomThumbnail() ? 'thumb' : 'full',
    ].join('|');
  }
  ['_revokeCapturePreviewUrl'](_0x2dce80) {
    const _0x3c7af3 = String(_0x2dce80 || '').trim();
    if (!_0x3c7af3 || !_0x3c7af3.startsWith('blob:')) return;
    const _0x5153f7 = globalThis.window?.URL || globalThis.URL;
    if (typeof _0x5153f7?.revokeObjectURL !== 'function') return;
    try {
      _0x5153f7.revokeObjectURL(_0x3c7af3);
    } catch {}
  }
  ['_adoptCapturePreviewUrl'](_0x28899d) {
    const _0x4bc22d = String(_0x28899d || '').trim();
    (this._activeCapturePreviewUrl &&
      this._activeCapturePreviewUrl !== _0x4bc22d &&
      this._revokeCapturePreviewUrl(this._activeCapturePreviewUrl),
      (this._activeCapturePreviewUrl = _0x4bc22d));
  }
  ['_releaseActiveCapturePreviewUrl']() {
    if (!this._activeCapturePreviewUrl) return;
    const _0x3a1a1a = this._activeCapturePreviewUrl;
    ((this._activeCapturePreviewUrl = ''), this._revokeCapturePreviewUrl(_0x3a1a1a));
  }
  async ['_refreshImageDisplay'](_0x38d5ce = false) {
    const _0x1a4d54 = this._getPreviewSignature();
    if (!_0x38d5ce && _0x1a4d54 === this._resolvedPreviewSig) return;
    this._resolvedPreviewSig = _0x1a4d54;
    const _0x4a5ff7 = ++this._previewResolveToken,
      _0x31aa32 = this._getPrimaryImageUrl(),
      _0x1c45df = this._getCapturePreviewUrl(),
      _0x1c97ac = this._getSynchronousThumbUrl(),
      _0x553edd = this._getImageDisplayLod();
    if (_0x553edd.lod === 'thumb' && _0x553edd.url) {
      ((this._cachedThumbUrl = _0x1c97ac || _0x553edd.url),
        this._releaseActiveCapturePreviewUrl(),
        this._showLowZoomThumb(_0x553edd.url));
      return;
    }
    if (!_0x31aa32 && _0x1c45df) {
      (this._adoptCapturePreviewUrl(_0x1c45df), this._showImg(_0x1c45df, this._cachedThumbUrl));
      return;
    }
    if (_0x31aa32) {
      ((this._cachedThumbUrl = _0x1c97ac || this._cachedThumbUrl || ''),
        this._showImg(_0x31aa32, this._cachedThumbUrl || _0x1c45df));
      return;
    }
    if (_0x1c97ac) {
      ((this._cachedThumbUrl = _0x1c97ac),
        this._releaseActiveCapturePreviewUrl(),
        this._showLowZoomThumb(_0x1c97ac));
      return;
    }
    let _0x544aa4 = '';
    try {
      _0x544aa4 = await getThumbnail(this._data);
    } catch {
      _0x544aa4 = '';
    }
    if (_0x4a5ff7 !== this._previewResolveToken) return;
    this._cachedThumbUrl = _0x1c97ac || _0x544aa4 || '';
    if (_0x1c45df) {
      (this._adoptCapturePreviewUrl(_0x1c45df), this._showImg(_0x1c45df, this._cachedThumbUrl));
      return;
    }
    if (this._cachedThumbUrl) {
      this._showLowZoomThumb(this._cachedThumbUrl);
      return;
    }
    this._showImg('', '');
  }
  ['_scheduleImageDisplayRefresh'](_0xac993b = false) {
    if (this._idleImageRefreshCancel) return;
    this._idleImageRefreshCancel = scheduleSourceImageIdleTask(() => {
      this._idleImageRefreshCancel = null;
      if (!this._img) return;
      void this._refreshImageDisplay(_0xac993b);
    });
  }
  ['mount']() {
    const _0x44730e = this.el,
      _0xbb8889 = this._data;
    Object.assign(_0x44730e.style, {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'visible',
      pointerEvents: 'auto',
      cursor: 'default',
    });
    const _0x19a052 = this._getCapturePreviewUrl(_0xbb8889),
      _0x1034d1 = this._getImageDisplayLod(_0xbb8889),
      _0x30fd01 = _0x1034d1.url || _0x19a052,
      _0x73091a = this._getSynchronousThumbUrl(_0xbb8889) || _0x19a052,
      _0x55f5d8 = _0x1034d1.lod !== 'thumb' && !!_0x1034d1.url && _0x1034d1.url !== _0x73091a,
      _0x20e38f = _0x55f5d8 ? _0x73091a : _0x30fd01,
      _0xbf3c1d = _0x55f5d8 ? (_0x20e38f ? 'placeholder' : '') : _0x1034d1.lod;
    (this._adoptCapturePreviewUrl(_0x19a052),
      (this._currentSrc = _0x30fd01),
      (this._currentJobStatus = _0xbb8889.jobStatus || null),
      setStaticInnerHTML(_0x44730e, 'toolbar:image'),
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
    const _0x200371 = this._rendererMediaDeferred === true,
      _0x3910f8 = _0x200371 ? _0x73091a : '',
      _0x339d0d = _0x200371 ? _0x3910f8 : _0x20e38f;
    'fetchPriority' in this._img &&
      (this._img.fetchPriority = _0x339d0d && (_0x200371 || _0x20e38f !== _0x30fd01) ? 'high' : 'auto');
    (Object.assign(this._img.style, {
      pointerEvents: 'none',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: _0x339d0d ? 'block' : 'none',
    }),
      this._setImageLodSrc(_0x200371 ? (_0x3910f8 ? 'placeholder' : '') : _0xbf3c1d));
    if (_0x339d0d) this._img.src = _0x339d0d;
    ((this._maskOverlay = document.createElement('img')),
      (this._maskOverlay.className = 'node-img-mask-overlay'),
      Object.assign(this._maskOverlay.style, { pointerEvents: 'none' }));
    !_0x200371 && this._applyMaskPreview(_0xbb8889.maskPreviewUrl || _0xbb8889.maskPreview);
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
    const _0x3a4e37 = 'http://www.w3.org/2000/svg',
      _0x39957e = document.createElementNS(_0x3a4e37, 'svg');
    (_0x39957e.setAttribute('width', '14'),
      _0x39957e.setAttribute('height', '14'),
      _0x39957e.setAttribute('viewBox', '0 0 24 24'),
      _0x39957e.setAttribute('fill', 'none'),
      _0x39957e.setAttribute('stroke', 'currentColor'),
      _0x39957e.setAttribute('stroke-width', '2.5'));
    const _0x302986 = document.createElementNS(_0x3a4e37, 'path');
    _0x302986.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
    const _0x1f28a0 = document.createElementNS(_0x3a4e37, 'polyline');
    _0x1f28a0.setAttribute('points', '17 8 12 3 7 8');
    const _0x239651 = document.createElementNS(_0x3a4e37, 'line');
    (_0x239651.setAttribute('x1', '12'),
      _0x239651.setAttribute('y1', '3'),
      _0x239651.setAttribute('x2', '12'),
      _0x239651.setAttribute('y2', '15'),
      _0x39957e.appendChild(_0x302986),
      _0x39957e.appendChild(_0x1f28a0),
      _0x39957e.appendChild(_0x239651),
      this._uploadBtn.appendChild(_0x39957e),
      (this._uploadLabelNode = document.createTextNode('')),
      this._uploadBtn.appendChild(this._uploadLabelNode),
      this._syncLocaleTexts(),
      this._hint.appendChild(this._uploadBtn));
    const _0x49b471 = document.createElement('div');
    _0x49b471.className = 'node-port out-port';
    const _0x43fd31 = document.createElement('div');
    ((_0x43fd31.className = 'node-resizer'),
      this._card.appendChild(this._img),
      this._card.appendChild(this._maskOverlay),
      this._card.appendChild(this._jobUI),
      this._card.appendChild(this._hint),
      this._card.appendChild(_0x49b471),
      this._card.appendChild(_0x43fd31),
      _0x44730e.appendChild(this._card),
      this._syncJobUI(this._currentJobStatus));
    if (
      shouldShowGenerationResultLoadingUi(_0xbb8889, { hasResult: !!_0x30fd01 }) &&
      !this._currentJobStatus
    ) {
      startLoading(this._card, { variant: 'static' });
      if (this._hint) this._hint.style.display = 'none';
      if (this._uploadBtn) this._uploadBtn.disabled = true;
    }
    this._card.addEventListener('dblclick', (_0xbc4bec) => {
      (_0xbc4bec.stopPropagation(), openNodeImagePreview(this._data));
    });
    const _0x237d84 = () => isCanvasLowZoomActive() || this._img?.dataset?.lodSrc === 'thumb',
      _0x9c937a = () => {
        if (!_0x237d84()) return;
        ((this._resolvedPreviewSig = ''), void this._refreshImageDisplay(true));
      },
      _0x4de62e = (_0x5de696 = 0) => {
        this._lowZoomHoverRefreshTimer &&
          (clearTimeout(this._lowZoomHoverRefreshTimer), (this._lowZoomHoverRefreshTimer = null));
        if (_0x5de696 > 0) {
          this._lowZoomHoverRefreshTimer = setTimeout(() => {
            ((this._lowZoomHoverRefreshTimer = null),
              _0x237d84() && setNodeMediaLodHoverPromoted(this.el, true),
              _0x9c937a());
          }, _0x5de696);
          return;
        }
        (setNodeMediaLodHoverPromoted(this.el, false), _0x9c937a());
      };
    (this._card.addEventListener('pointerenter', () => _0x4de62e(SOURCE_IMAGE_LOD_HOVER_REFRESH_DELAY_MS)),
      this._card.addEventListener('pointerleave', () => _0x4de62e(0)),
      (this._input = document.createElement('input')),
      (this._input.type = 'file'),
      (this._input.accept = 'image/*'),
      (this._input.style.display = 'none'),
      _0x44730e.appendChild(this._input),
      this._uploadBtn.addEventListener('click', (_0x1dba1b) => {
        (_0x1dba1b.stopPropagation(), this._input.click());
      }));
    _0x43fd31 &&
      _0x43fd31.addEventListener('pointerdown', (_0x54fdb6) => {
        const _0x5be1ff = appStore.getStateRaw().ui?.imageVideoNodeResizeEnabled === true,
          _0x5efc49 = document.getElementById('v2-wrap')?.classList.contains('v2-media-node-resize-enabled');
        if (!(_0x5be1ff && _0x5efc49)) return;
        startNodeResizePreview({
          event: _0x54fdb6,
          nodeId: this.id,
          getNode: () => appStore.getStateRaw().nodes?.[this.id] || this._data,
          getViewport: () => appStore.getStateRaw().viewport,
          resolveSize: ({ startWidth: _0x2244b3, startHeight: _0x163a5c, dx: _0x17ba18, dy: _0x3c397a }) => {
            const _0x5aa900 = _0x2244b3 / _0x163a5c,
              _0xda9ae = Math.max(_0x17ba18 / _0x2244b3, _0x3c397a / _0x163a5c),
              _0x213e81 = Math.max(SOURCE_IMAGE_MIN_SIZE / _0x2244b3, SOURCE_IMAGE_MIN_SIZE / _0x163a5c),
              _0x1b647c = Math.max(_0x213e81, 1 + _0xda9ae),
              _0x395ed3 = Math.max(SOURCE_IMAGE_MIN_SIZE, Math.round(_0x2244b3 * _0x1b647c)),
              _0xc56047 = Math.max(SOURCE_IMAGE_MIN_SIZE, Math.round(_0x395ed3 / _0x5aa900));
            return { width: _0x395ed3, height: _0xc56047 };
          },
          buildFinalPatch: ({ startNode: _0x4f54fc }) =>
            _0x4f54fc?.needsAutoResize ? { needsAutoResize: false } : {},
          applyPatch: (_0x82957a) => appStore.updateNodeData(this.id, _0x82957a),
          commit: commit,
        });
      });
    this._input.addEventListener('change', async (_0x2f2a5b) => {
      const _0xe43964 = _0x2f2a5b.target.files[0];
      if (!_0xe43964) return;
      ((this._isUploading = true),
        startLoading(this._card, { variant: 'static' }),
        (this._img.style.display = 'none'));
      const _0x4d2cdf = Array.from(this._uploadBtn.childNodes).map((_0x50b51d) => _0x50b51d.cloneNode(true));
      ((this._uploadBtn.textContent = sourceImageText('upload.transcoding')),
        (this._uploadBtn.style.pointerEvents = 'none'));
      try {
        const _0x1b491f = await new Promise((_0x1f20b2, _0x13f83d) => {
            const _0x506b79 = URL.createObjectURL(_0xe43964),
              _0x442c21 = new Image();
            ((_0x442c21.onload = () => {
              const _0xd06168 = Math.round(Number(_0x442c21.naturalWidth || _0x442c21.width) || 0),
                _0x19c7ee = Math.round(Number(_0x442c21.naturalHeight || _0x442c21.height) || 0),
                _0x7029dc = document.createElement('canvas');
              ((_0x7029dc.width = _0xd06168), (_0x7029dc.height = _0x19c7ee));
              const _0xb243b1 = _0x7029dc.getContext('2d');
              ((_0xb243b1.fillStyle = 'var(--text-primary)'),
                _0xb243b1.fillRect(0, 0, _0x7029dc.width, _0x7029dc.height),
                _0xb243b1.drawImage(_0x442c21, 0, 0),
                URL.revokeObjectURL(_0x506b79),
                _0x7029dc.toBlob(
                  (_0x554e37) => {
                    if (!_0x554e37) {
                      _0x13f83d(new Error(sourceImageText('upload.canvasTranscodeFailed')));
                      return;
                    }
                    const _0x4d72f1 = Math.random().toString(36).substring(2, 8),
                      _0x2d0383 = _0xe43964.name.replace(/\.[^/.]+$/, ''),
                      _0x55f965 = 'upload_' + _0x4d72f1 + '_' + _0x2d0383 + '.jpg';
                    _0x1f20b2({
                      file: new File([_0x554e37], _0x55f965, { type: 'image/jpeg' }),
                      width: _0xd06168,
                      height: _0x19c7ee,
                    });
                  },
                  'image/jpeg',
                  0.85,
                ));
            }),
              (_0x442c21.onerror = () => {
                (URL.revokeObjectURL(_0x506b79),
                  _0x13f83d(new Error(sourceImageText('upload.imageLoadFailed'))));
              }),
              (_0x442c21.src = _0x506b79));
          }),
          _0x4215fd = _0x1b491f.file;
        this._uploadBtn.textContent = sourceImageText('upload.uploading');
        const _0x4b9f94 = window.currentProjectId || 'default_v2_project',
          _0x981239 = await uploadFile(_0x4215fd, _0x4b9f94),
          _0x4b1730 =
            _0x981239?.displayLocalPath || _0x981239?.thumbLocalPath
              ? _0x981239
              : await ensureLocalImageDerivatives(_0x981239?.originalLocalPath || _0x981239?.localPath),
          _0x3c51a6 = String(_0x981239?.url || _0x4b1730?.originalUrl || '').trim(),
          _0xf20123 = buildImageNodeStorageFields(_0x4b1730),
          _0x250c03 = buildSourceImageUploadSizePatch(
            {
              width: _0x4b1730?.originalWidth || _0xf20123.originalWidth,
              height: _0x4b1730?.originalHeight || _0xf20123.originalHeight,
            },
            { width: _0x1b491f.width, height: _0x1b491f.height },
          ),
          _0x253530 = _0xe43964.name.replace(/\.[^/.]+$/, '');
        appStore.renameNode(this.id, _0x253530);
        const _0x19b58f = document.getElementById(this.id),
          _0x2a000e = _0x19b58f?.__v2_name_el;
        if (_0x2a000e) _0x2a000e.textContent = _0x253530;
        (appStore.updateNodeData(this.id, {
          src: _0x3c51a6,
          assetId: _0x981239?.assetId || _0x4b1730?.assetId || '',
          derivativeStatus:
            _0x981239?.derivativeStatus || _0x4b1730?.derivativeStatus || _0x4b1730?.status || '',
          ..._0xf20123,
          fileName: _0x4b1730.filename || _0x981239?.filename || _0x4215fd.name,
          ..._0x250c03,
        }),
          !_0xf20123.thumbLocalPath && _0x3c51a6 && this._queueThumbnail(_0x3c51a6));
      } catch (_0x1636f5) {
        (console.error('图片上传失败:', _0x1636f5),
          alert(sourceImageText('upload.failedRetry')),
          stopLoading(this._card),
          this._currentSrc && (this._img.style.display = 'block'));
      } finally {
        ((this._isUploading = false),
          this._uploadBtn.replaceChildren(..._0x4d2cdf.map((_0x5a2a35) => _0x5a2a35.cloneNode(true))),
          (this._uploadLabelNode = null),
          this._syncLocaleTexts(),
          (this._uploadBtn.style.pointerEvents = 'auto'),
          (this._input.value = ''));
      }
    });
    _0x30fd01 && _0x20e38f !== _0x30fd01
      ? this._scheduleImageDisplayRefresh(true)
      : void this._refreshImageDisplay(true);
    const _0x1e1027 = _0x44730e.querySelector('.node-floating-toolbar');
    return (
      bindImageToolbarEvents(_0x1e1027, this.id),
      _0x44730e.addEventListener('v2-node:free-angle', (_0x236020) => {
        (_0x236020.stopPropagation(), this._switchToFreeAngle());
      }),
      !isTaskFailed(this._data) &&
        !isTaskCancelled(this._data) &&
        (this._maybeResumeRunningHubTask(), this._maybeResumeDreaminaTask(), this._maybeResumeAsyncTask()),
      (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())),
      _0x44730e
    );
  }
  ['_syncLocaleTexts']() {
    if (!this._uploadBtn || this._isUploading) return;
    ((!this._uploadLabelNode || this._uploadLabelNode.parentNode !== this._uploadBtn) &&
      (this._uploadLabelNode =
        Array.from(this._uploadBtn.childNodes || []).find((_0xcead3b) => _0xcead3b?.nodeType === 3) || null),
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
    const _0x5985cf = this.el.querySelector('.act-multiangle');
    ((this._bottomPanel = document.createElement('div')),
      (this._bottomPanel.className = 'text-prompt-panel'),
      this._bottomPanel.addEventListener('pointerdown', (_0x3ad95c) => {
        _0x3ad95c.stopPropagation();
      }),
      await ImageFreeAngleController.render(
        this.id,
        this._bottomPanel,
        () => this._switchToImage(),
        () => this._handleGenerate(),
        _0x5985cf,
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
  ['_showLowZoomThumb'](_0x529bd3) {
    const _0xdb74c7 = String(_0x529bd3 || '').trim();
    if (!_0xdb74c7) {
      this._showImg('', '');
      return;
    }
    (stopLoading(this._card), (this._currentSrc = _0xdb74c7));
    this._img &&
      (this._setImageLodSrc('thumb'),
      String(this._img.getAttribute('src') || '').trim() !== _0xdb74c7 && (this._img.src = _0xdb74c7),
      (this._img.style.display = 'block'));
    if (this._hint) this._hint.style.display = 'block';
  }
  ['_showImg'](_0x365bcd, _0x396dab = '') {
    if (this._rendererMediaDeferred === true) {
      this._currentSrc = String(_0x365bcd || '').trim();
      return;
    }
    if (!_0x365bcd) {
      (stopLoading(this._card), this._setImageLodSrc(''), (this._img.style.display = 'none'));
      if (this._data?.isGenerating) {
        if (this._hint) this._hint.style.display = 'none';
      } else {
        if (this._hint) this._hint.style.display = 'block';
      }
      return;
    }
    const _0xf27408 = String(_0x396dab || this._cachedThumbUrl || '').trim();
    logDragImportProfile('SourceImageNode:show-img', {
      id: this.id,
      url: _0x365bcd,
      fallbackThumb: _0xf27408,
      currentSrc: this._currentSrc || '',
      isGenerating: !!this._data?.isGenerating,
      jobStatus: this._data?.jobStatus || '',
    });
    if (this._failedSrc === _0x365bcd && _0xf27408) {
      (this._setImageLodSrc('placeholder'), (this._img.src = _0xf27408), (this._img.style.display = 'block'));
      if (this._hint) this._hint.style.display = 'block';
      return;
    }
    const _0x6cfa45 = String(this._img?.getAttribute('src') || '').trim(),
      _0x529ca8 =
        this._currentSrc === _0x365bcd && _0x6cfa45 === _0x365bcd && this._img.style.display !== 'none';
    let _0x4bb7ac = false,
      _0x19b44d = false;
    if (_0xf27408 && this._currentSrc !== _0x365bcd) {
      (this._setImageLodSrc('placeholder'), (this._img.src = _0xf27408), (this._img.style.display = 'block'));
      if (this._hint) this._hint.style.display = 'block';
      _0x4bb7ac = true;
    } else {
      if (this._currentSrc !== _0x365bcd) {
        const _0x967ba4 = String(this._img?.getAttribute('src') || '').trim(),
          _0x205bd7 = !_0x967ba4 || this._img.style.display === 'none';
        if (!_0xf27408 && _0x205bd7) {
          (this._setImageLodSrc('full'), (this._img.src = _0x365bcd), (this._img.style.display = 'block'));
          if (this._hint) this._hint.style.display = 'block';
        } else ((this._img.style.display = 'block'), (_0x19b44d = true));
      }
    }
    this._currentSrc = _0x365bcd;
    const _0x30c563 = String(this._img?.getAttribute('src') || '').trim(),
      _0x26fe37 = _0x30c563 === _0x365bcd && this._img.style.display !== 'none',
      _0x33c5da = !!_0xf27408 && (_0x4bb7ac || _0x30c563 === _0xf27408) && this._img.style.display !== 'none',
      _0x596072 = _0x19b44d && !!_0x30c563 && _0x30c563 !== _0x365bcd && this._img.style.display !== 'none';
    !_0x26fe37 && !_0x33c5da && !_0x596072
      ? startLoading(this._card, { variant: 'static' })
      : stopLoading(this._card);
    if (_0x529ca8) {
      const _0x12cd9a = appStore.getStateRaw().nodes?.[this.id],
        _0x21016c = Number(_0x12cd9a?.imageWidth || 0) > 0 && Number(_0x12cd9a?.imageHeight || 0) > 0,
        _0x428c3a = _0x12cd9a?.fixedSize !== true && _0x12cd9a?.needsAutoResize === true;
      if (_0x21016c && !_0x428c3a) {
        if (this._hint) this._hint.style.display = 'block';
        return;
      }
    }
    preloadCanvasImage(_0x365bcd, {
      priority: _0xf27408 ? 20 : 10,
      fetchPriority: _0xf27408 ? 'auto' : 'high',
    })
      .then(({ image: _0x449498, naturalWidth: _0x1de0ba, naturalHeight: _0x47ac67 }) => {
        if (this._currentSrc !== _0x365bcd) return;
        logDragImportProfile('SourceImageNode:preload:onload', {
          id: this.id,
          url: _0x365bcd,
          naturalWidth: _0x1de0ba || _0x449498?.naturalWidth || 0,
          naturalHeight: _0x47ac67 || _0x449498?.naturalHeight || 0,
        });
        const _0x4afbf1 = Math.max(1, Math.round(_0x1de0ba || _0x449498?.naturalWidth || 0)),
          _0x25d74d = Math.max(1, Math.round(_0x47ac67 || _0x449498?.naturalHeight || 0)),
          _0x3d0771 = appStore.getStateRaw().nodes?.[this.id];
        if (_0x3d0771) {
          const _0x965edb = Number(_0x3d0771.imageWidth || 0),
            _0x359af0 = Number(_0x3d0771.imageHeight || 0);
          (_0x965edb !== _0x4afbf1 || _0x359af0 !== _0x25d74d) &&
            appStore.updateNodeData(this.id, { imageWidth: _0x4afbf1, imageHeight: _0x25d74d });
        }
        !_0x26fe37 && (stopLoading(this._card), this._setImageLodSrc('full'), (this._img.src = _0x365bcd));
        this._img.style.display = 'block';
        if (this._hint) this._hint.style.display = 'block';
        this._activeCapturePreviewUrl &&
          this._activeCapturePreviewUrl !== _0x365bcd &&
          (this._releaseActiveCapturePreviewUrl(),
          _0x3d0771?.capturePreviewUrl && appStore.updateNodeData(this.id, { capturePreviewUrl: '' }));
        !String(_0x3d0771?.thumbLocalPath || '').trim() && this._queueThumbnail(_0x365bcd);
        if (this._data.fixedSize) return;
        if (!this._data.needsAutoResize) return;
        const { width: _0x49adca, height: _0x1e978e } = getAutoMediaSizeByShortSide(
          _0x4afbf1 || 0x3e8,
          _0x25d74d || 0x3e8,
        );
        appStore.updateNodeData(this.id, { width: _0x49adca, height: _0x1e978e, needsAutoResize: false });
      })
      .catch(() => {
        if (this._currentSrc !== _0x365bcd) return;
        (stopLoading(this._card), (this._failedSrc = _0x365bcd));
        const _0x39eb9d = String(this._img?.getAttribute('src') || '').trim(),
          _0x557662 = !!_0x39eb9d && _0x39eb9d !== _0x365bcd && this._img.style.display !== 'none';
        if (_0xf27408)
          (this._setImageLodSrc('placeholder'),
            (this._img.src = _0xf27408),
            (this._img.style.display = 'block'));
        else
          _0x557662
            ? (this._img.style.display = 'block')
            : (this._setImageLodSrc(''), (this._img.src = ''), (this._img.style.display = 'none'));
        if (this._hint) this._hint.style.display = 'block';
      });
  }
  ['_computeGenerationDuration'](_0x32e588 = this._data) {
    if (!_0x32e588) return 0;
    if (typeof _0x32e588.generationDuration === 'number') return _0x32e588.generationDuration;
    const _0x49d483 = Number(_0x32e588.generationStartTime || 0);
    if (!Number.isFinite(_0x49d483) || _0x49d483 <= 0) return 0;
    return Math.max(0, Date.now() - _0x49d483);
  }
  ['hydrateDeferredMedia']() {
    if (this._rendererMediaDeferred !== true) return;
    this._rendererMediaDeferred = false;
    const _0x2b5445 = appStore.getStateRaw().nodes?.[this.id] || this._data;
    this.update(_0x2b5445);
  }
  ['_inferAsyncProvider'](_0xc383bf = this._data) {
    const _0x3a2b53 = String(_0xc383bf?.model || '').trim(),
      _0x28a15f = resolveModelProvider(_0x3a2b53, '', { allowProviderHint: false });
    if (_0x28a15f) return _0x28a15f;
    const _0x1cc023 = String(_0xc383bf?.asyncTaskProvider || _0xc383bf?.provider || '')
      .trim()
      .toLowerCase();
    if (_0x1cc023) return _0x1cc023;
    if (_0x3a2b53 && !_0x3a2b53.includes('/')) return 'grsai';
    return 'grsai';
  }
  ['_isRunningHubRecoverableTask'](_0x12730a = this._data) {
    if (!_0x12730a || typeof _0x12730a !== 'object') return false;
    const _0x4a2d2c = String(_0x12730a.rhTaskId || '').trim();
    if (!_0x4a2d2c) return false;
    const _0x24c88f = String(_0x12730a.rhTaskStatus || '')
      .trim()
      .toLowerCase();
    if (['success', 'idle', 'cancelled'].includes(_0x24c88f)) return false;
    if (_0x24c88f === 'failed' && !this._isRunningHubLocalPendingFailure(_0x12730a)) return false;
    const _0x145453 = String(_0x12730a.provider || '')
        .trim()
        .toLowerCase(),
      _0x35374d = String(_0x12730a.model || '').trim(),
      _0x547609 = resolveModelProvider(_0x35374d, _0x145453, { allowProviderHint: false });
    return (
      _0x145453 === 'runninghubwf' ||
      _0x145453 === 'runninghub' ||
      isWorkflowModel(_0x35374d, _0x145453 || 'runninghubwf') ||
      (_0x547609 === 'runninghub' && isModelApiModel(_0x35374d, 'runninghub'))
    );
  }
  ['_isRunningHubLocalPendingFailure'](_0x46cbc4 = this._data) {
    const _0x25a3d1 = [_0x46cbc4?.outputText, _0x46cbc4?.jobError, _0x46cbc4?.rhStatusMessage]
      .map((_0x205530) => String(_0x205530 || '').trim())
      .filter(Boolean)
      .join('\n')
      .toLowerCase();
    if (!_0x25a3d1) return false;
    return (
      _0x25a3d1.includes('任务超时') ||
      _0x25a3d1.includes('请求超时') ||
      _0x25a3d1.includes('处理超时') ||
      _0x25a3d1.includes('仍在生成') ||
      _0x25a3d1.includes('继续查询') ||
      _0x25a3d1.includes('runninghub 仍在生成'.toLowerCase())
    );
  }
  ['_clearRunningHubRecoveryRetry']() {
    if (!this._rhResumeRetryTimer) return;
    (clearTimeout(this._rhResumeRetryTimer), (this._rhResumeRetryTimer = null));
  }
  ['_scheduleRunningHubRecoveryRetry'](_0x44f5d7 = 0x1388) {
    (this._clearRunningHubRecoveryRetry(),
      (this._rhResumeRetryTimer = setTimeout(
        () => {
          ((this._rhResumeRetryTimer = null), this._maybeResumeRunningHubTask());
        },
        Math.max(0x3e8, Number(_0x44f5d7) || 0x1388),
      )));
  }
  ['_isDreaminaRecoverableTask'](_0x3b93b7 = this._data) {
    if (!_0x3b93b7 || typeof _0x3b93b7 !== 'object') return false;
    const _0x461e4b = String(_0x3b93b7.dreaminaSubmitId || '').trim();
    if (!_0x461e4b) return false;
    const _0x2a2e1b = String(_0x3b93b7.provider || '')
        .trim()
        .toLowerCase(),
      _0x24e29c = String(_0x3b93b7.model || '').trim();
    if (!(_0x2a2e1b === 'dreamina' || resolveModelProvider(_0x24e29c, _0x2a2e1b) === 'dreamina'))
      return false;
    const _0x2103c5 = normalizeTaskStatus(_0x3b93b7.jobStatus),
      _0x218348 = normalizeTaskStatus(_0x3b93b7.dreaminaTaskPhase),
      _0x31a932 = normalizeTaskStatus(_0x3b93b7.dreaminaTaskStatus);
    if (NON_RECOVERABLE_FAILURE_STATUSES.has(_0x2103c5)) return false;
    if (DREAMINA_NON_RECOVERABLE_PHASES.has(_0x218348)) return false;
    if (DREAMINA_NON_RECOVERABLE_STATUSES.has(_0x31a932)) return false;
    if (_0x3b93b7.isGenerating === true && _0x3b93b7.dreaminaTaskRecovering !== true) {
      const _0x5e2aa7 = Number(
        _0x3b93b7.dreaminaTaskLastCheckedAt ||
          _0x3b93b7.dreaminaTaskStartedAt ||
          _0x3b93b7.generationStartTime ||
          0,
      );
      if (
        Number.isFinite(_0x5e2aa7) &&
        _0x5e2aa7 > 0 &&
        Date.now() - _0x5e2aa7 < DREAMINA_STALE_ACTIVE_RESUME_MS
      )
        return false;
    }
    return true;
  }
  ['_isDreaminaPollTimeoutError'](_0x452070) {
    const _0x57e6b7 = String(_0x452070?.code || '')
      .trim()
      .toUpperCase();
    if (_0x57e6b7 === DREAMINA_POLL_TIMEOUT_CODE || _0x57e6b7 === 'TIMEOUT') return true;
    const _0x15b563 = String(_0x452070?.type || '')
      .trim()
      .toUpperCase();
    if (_0x15b563 === 'TIMEOUT' || _0x15b563 === 'TASK_TIMEOUT') return true;
    const _0xb21f0b = String(_0x452070?.message || '')
      .trim()
      .toLowerCase();
    return _0xb21f0b.includes('timeout') || _0xb21f0b.includes('超时');
  }
  ['_isAsyncRecoverableTask'](_0x441621 = this._data) {
    if (!_0x441621 || typeof _0x441621 !== 'object') return false;
    const _0x5dc77b = String(_0x441621.asyncTaskId || '').trim();
    if (!_0x5dc77b) return false;
    const _0x699b38 = this._inferAsyncProvider(_0x441621);
    if (!_0x699b38 || _0x699b38 === 'runninghubwf' || _0x699b38 === 'runninghub' || _0x699b38 === 'dreamina')
      return false;
    const _0x352308 = String(_0x441621.asyncTaskKind || '')
      .trim()
      .toLowerCase();
    if (_0x352308 && _0x352308 !== 'image') return false;
    const _0x29e1ee = String(_0x441621.asyncTaskStatus || '')
      .trim()
      .toLowerCase();
    if (['success', 'failed', 'idle', 'cancelled'].includes(_0x29e1ee)) return false;
    return true;
  }
  ['_stopRunningHubRecovery'](_0x5ee30f = true) {
    try {
      this._rhResumeAbortController?.abort?.();
    } catch {}
    (this._clearRunningHubRecoveryRetry(),
      (this._rhResumeAbortController = null),
      (this._rhResumePromise = null),
      (this._rhResumeTaskId = ''));
    if (!_0x5ee30f) return;
    const _0x84ea84 = appStore.getState().nodes?.[this.id];
    if (!_0x84ea84 || _0x84ea84.rhTaskRecovering !== true) return;
    appStore.updateNodeData(this.id, { rhTaskRecovering: false });
  }
  ['_stopDreaminaRecovery'](_0x4a4bbd = true) {
    try {
      this._dreaminaResumeAbortController?.abort?.();
    } catch {}
    ((this._dreaminaResumeAbortController = null),
      (this._dreaminaResumePromise = null),
      (this._dreaminaResumeSubmitId = ''));
    if (!_0x4a4bbd) return;
    const _0x275891 = appStore.getState().nodes?.[this.id];
    if (!_0x275891 || _0x275891.dreaminaTaskRecovering !== true) return;
    appStore.updateNodeData(this.id, { dreaminaTaskRecovering: false });
  }
  ['_stopAsyncRecovery'](_0x5748d6 = true) {
    try {
      this._asyncResumeAbortController?.abort?.();
    } catch {}
    ((this._asyncResumeAbortController = null),
      (this._asyncResumePromise = null),
      (this._asyncResumeTaskId = ''));
    if (!_0x5748d6) return;
    const _0x53d7f5 = appStore.getState().nodes?.[this.id];
    if (!_0x53d7f5 || _0x53d7f5.asyncTaskRecovering !== true) return;
    appStore.updateNodeData(this.id, { asyncTaskRecovering: false });
  }
  ['_resolveRunningHubResumePayload'](_0x17325e) {
    const _0x300666 = String(_0x17325e?.model || '').trim(),
      _0x1daff0 = String(_0x17325e?.provider || '')
        .trim()
        .toLowerCase();
    let _0x3473e9 = _0x1daff0;
    return (
      !_0x3473e9 && (_0x3473e9 = isModelApiModel(_0x300666, 'runninghub') ? 'runninghub' : 'runninghubwf'),
      { model: _0x300666, provider: _0x3473e9 }
    );
  }
  ['_resolveDreaminaResumePayload'](_0x145b06) {
    return {
      model: String(_0x145b06?.model || '').trim() || getDefaultDreaminaImageModelId(),
      provider: 'dreamina',
    };
  }
  ['_resolveAsyncResumePayload'](_0x4864c1) {
    return { model: String(_0x4864c1?.model || '').trim(), provider: this._inferAsyncProvider(_0x4864c1) };
  }
  ['_fileNameFromPath'](_0x3ac1b0) {
    const _0x714589 = String(_0x3ac1b0 || '').replace(/^\/+/, '');
    if (!_0x714589) return '';
    const _0x38eaeb = _0x714589.split('/');
    return String(_0x38eaeb[_0x38eaeb.length - 1] || '').trim();
  }
  ['_buildRecoveredImageResultPatch'](_0x4d4929, _0x25aea3 = sourceImageText('recovery.imageTaskFailed')) {
    const _0x33f6b3 = _0x4d4929?.isBatch && Array.isArray(_0x4d4929.images) ? _0x4d4929.images[0] : _0x4d4929;
    if (!_0x33f6b3 || _0x33f6b3.error) throw new Error(String(_0x33f6b3?.error || _0x25aea3));
    const _0xf8f9a2 = buildCanvasLocalImageFields(_0x33f6b3, { includeSrc: true });
    if (!_0xf8f9a2.src || !_0xf8f9a2.localPath) throw new Error(sourceImageText('recovery.noOutputImage'));
    return { ..._0xf8f9a2, fileName: this._fileNameFromPath(_0xf8f9a2.localPath) };
  }
  ['_maybeResumeRunningHubTask']() {
    const _0x449a0d = appStore.getState().nodes?.[this.id] || this._data;
    if (!this._isRunningHubRecoverableTask(_0x449a0d)) {
      this._stopRunningHubRecovery(true);
      return;
    }
    const _0x2ad310 = String(_0x449a0d?.rhTaskId || '').trim();
    if (!_0x2ad310) return;
    if (this._rhResumePromise && this._rhResumeTaskId === _0x2ad310) return;
    const _0x267fe3 = Number(_0x449a0d?.rhTaskStartedAt || _0x449a0d?.generationStartTime || 0) || Date.now(),
      _0x166e57 = this._resolveRunningHubResumePayload(_0x449a0d),
      _0x4433e0 = _0x449a0d?.rhTaskUseOpenapiQuery === true,
      _0x1fcf6e =
        typeof this._resumeRunningHubTaskPoller === 'function'
          ? this._resumeRunningHubTaskPoller
          : resumeRunningHubImageTask,
      _0x25d69d = new AbortController();
    ((this._rhResumeAbortController = _0x25d69d), (this._rhResumeTaskId = _0x2ad310));
    const _0x1da6db = (async () => {
      try {
        const _0x3bcbbf = await resumeTask(
          {
            sourceNodeId: this.id,
            targetNodeId: this.id,
            trigger: 'node',
            taskType: 'image-generation',
            provider: _0x166e57.provider || _0x449a0d?.provider || 'runninghubwf',
            adapterType: 'workflow',
            modelId: _0x166e57.model || _0x449a0d?.model || '',
            executionId: 'runninghub.source-image.' + (_0x166e57.model || _0x449a0d?.model || 'workflow'),
            payload: _0x166e57,
            taskId: _0x2ad310,
            cancellable: false,
            resumable: true,
            startBuilder: () => ({
              rhTaskStatus:
                String(_0x449a0d?.rhTaskStatus || '')
                  .trim()
                  .toLowerCase() === 'pending'
                  ? 'pending'
                  : 'running',
              rhTaskUseOpenapiQuery: _0x4433e0,
            }),
            poll: async () =>
              _0x1fcf6e(_0x2ad310, _0x166e57, {
                signal: _0x25d69d.signal,
                useOpenapiQuery: _0x4433e0,
                softTimeout: true,
              }),
            resultBuilder: async (_0x23c8b5) => {
              const _0x11390d = appStore.getState().nodes?.[this.id] || {},
                _0x1ff090 = String(_0x11390d?.name || sourceImageText('result.defaultName'))
                  .replace(/\s*\(处理中\)\s*$/, '')
                  .replace(/\s*\(恢复中\)\s*$/, '')
                  .trim();
              return {
                ...this._buildRecoveredImageResultPatch(
                  _0x23c8b5,
                  sourceImageText('recovery.imageTaskFailed'),
                ),
                name: _0x1ff090 || sourceImageText('result.defaultName'),
                generationDuration: this._computeGenerationDuration(_0x11390d),
              };
            },
            failureBuilder: (_0x1cd11b, _0x543595) => {
              const _0x55c0d9 =
                  _0x1cd11b instanceof Error
                    ? _0x1cd11b.message
                    : String(_0x1cd11b || sourceImageText('recovery.taskFailed')),
                _0x13c8b4 = appStore.getState().nodes?.[this.id] || {};
              return buildSourceImageRecoveryFailurePatch(_0x13c8b4, {
                error: _0x55c0d9,
                startedAt: _0x543595.startedAt,
                duration: this._computeGenerationDuration(_0x13c8b4),
              });
            },
            parseError: (_0x5a2cff) =>
              _0x5a2cff instanceof Error
                ? _0x5a2cff.message
                : String(_0x5a2cff || sourceImageText('recovery.taskFailed')),
          },
          { store: appStore, startedAt: _0x267fe3, abortController: _0x25d69d },
        );
        if (_0x3bcbbf.status === 'pending') {
          (window._triggerLocalCacheSave?.(), this._scheduleRunningHubRecoveryRetry());
          return;
        }
        _0x3bcbbf.status === 'success' && window._triggerLocalCacheSave?.();
      } catch (_0x573c6f) {
        if (
          _0x25d69d.signal.aborted ||
          String(_0x573c6f?.message || '') === 'CANCELLED' ||
          _0x573c6f?.name === 'AbortError'
        )
          return;
        const _0x594c34 =
            _0x573c6f instanceof Error
              ? _0x573c6f.message
              : String(_0x573c6f || sourceImageText('recovery.taskFailed')),
          _0x412f6f = appStore.getState().nodes?.[this.id];
        if (!_0x412f6f) return;
        appStore.updateNodeData(this.id, {
          ...buildSourceImageRecoveryFailurePatch(_0x412f6f, {
            error: _0x594c34,
            startedAt: _0x267fe3,
            duration: this._computeGenerationDuration(_0x412f6f),
          }),
          isGenerating: false,
          rhTaskStatus: 'failed',
          rhTaskRecovering: false,
        });
      } finally {
        (this._rhResumeAbortController === _0x25d69d && (this._rhResumeAbortController = null),
          this._rhResumeTaskId === _0x2ad310 && (this._rhResumeTaskId = ''),
          (this._rhResumePromise = null));
      }
    })();
    this._rhResumePromise = _0x1da6db;
  }
  ['_maybeResumeDreaminaTask']() {
    const _0x2f2be5 = appStore.getState().nodes?.[this.id] || this._data;
    if (!this._isDreaminaRecoverableTask(_0x2f2be5)) {
      this._stopDreaminaRecovery(true);
      return;
    }
    const _0x5c222a = String(_0x2f2be5?.dreaminaSubmitId || '').trim();
    if (!_0x5c222a) return;
    if (this._dreaminaResumeSubmitId === _0x5c222a) return;
    const _0x15d3f9 =
        Number(_0x2f2be5?.dreaminaTaskStartedAt || _0x2f2be5?.generationStartTime || 0) || Date.now(),
      _0x1fc885 = this._resolveDreaminaResumePayload(_0x2f2be5),
      _0x48970a =
        typeof this._dreaminaResumePoller === 'function'
          ? this._dreaminaResumePoller
          : resumeDreaminaImageTask,
      _0x1ec856 = new AbortController();
    ((this._dreaminaResumeAbortController = _0x1ec856), (this._dreaminaResumeSubmitId = _0x5c222a));
    const _0x2c0dd8 = (async () => {
      try {
        const _0x3f9354 = await resumeTask(
          {
            sourceNodeId: this.id,
            targetNodeId: this.id,
            trigger: 'node',
            taskType: 'image-generation',
            provider: 'dreamina',
            adapterType: 'localRuntime',
            modelId: _0x1fc885.model || _0x2f2be5?.model || '',
            executionId: 'dreamina.source-image.' + (_0x1fc885.model || _0x2f2be5?.model || 'image'),
            payload: _0x1fc885,
            taskId: _0x5c222a,
            cancellable: false,
            resumable: true,
            startBuilder: () => ({
              dreaminaSubmitId: _0x5c222a,
              dreaminaTaskStatus: 'pending',
              dreaminaTaskPhase: 'generating',
              dreaminaTaskLabel:
                String(_0x2f2be5?.dreaminaTaskLabel || '').trim() || sourceImageText('status.generating'),
              dreaminaTaskStartedAt: _0x15d3f9,
              dreaminaTaskLastCheckedAt: Date.now(),
              dreaminaTaskRecovering: true,
            }),
            poll: async () => _0x48970a(_0x5c222a, _0x1fc885, { signal: _0x1ec856.signal }),
            resultBuilder: async (_0x5cbfd1, _0x46c000) => {
              const _0xd22bd9 = appStore.getState().nodes?.[this.id] || {},
                _0x48bcb1 = String(_0xd22bd9?.name || sourceImageText('result.defaultName'))
                  .replace(/\s*\(处理中\)\s*$/, '')
                  .replace(/\s*\(恢复中\)\s*$/, '')
                  .trim();
              return {
                ...this._buildRecoveredImageResultPatch(
                  _0x5cbfd1,
                  sourceImageText('recovery.dreaminaImageTaskFailed'),
                ),
                isGenerating: false,
                name: _0x48bcb1 || sourceImageText('result.defaultName'),
                generationDuration: this._computeGenerationDuration(_0xd22bd9),
                dreaminaTaskStatus: 'success',
                dreaminaTaskPhase: 'done',
                dreaminaTaskLabel: sourceImageText('status.completed'),
                dreaminaTaskLastCheckedAt: Date.now(),
                dreaminaTaskRecovering: false,
              };
            },
            failureBuilder: (_0xf5a128, _0x1d3934) => {
              const _0x1ea6bd =
                  _0xf5a128 instanceof Error
                    ? _0xf5a128.message
                    : String(_0xf5a128 || sourceImageText('recovery.taskFailed')),
                _0x926a40 = appStore.getState().nodes?.[this.id] || {};
              if (this._isDreaminaPollTimeoutError(_0xf5a128))
                return {
                  isGenerating: true,
                  jobStatus: 'running',
                  jobError: null,
                  generationDuration: Date.now() - _0x1d3934.startedAt,
                  dreaminaTaskStatus: 'pending',
                  dreaminaTaskPhase: 'generating',
                  dreaminaTaskLabel: sourceImageText('status.queuedBackground'),
                  dreaminaTaskStartedAt: _0x1d3934.startedAt,
                  dreaminaTaskLastCheckedAt: Date.now(),
                  dreaminaTaskRecovering: false,
                };
              return {
                ...buildSourceImageRecoveryFailurePatch(_0x926a40, {
                  error: _0x1ea6bd,
                  startedAt: _0x1d3934.startedAt,
                  duration: this._computeGenerationDuration(_0x926a40),
                }),
                isGenerating: false,
                dreaminaTaskStatus: 'failed',
                dreaminaTaskPhase: 'failed',
                dreaminaTaskLabel: _0x1ea6bd || sourceImageText('recovery.failed'),
                dreaminaTaskLastCheckedAt: Date.now(),
                dreaminaTaskRecovering: false,
              };
            },
            cancelledBuilder: (_0xbe4017) => ({
              isGenerating: false,
              generationDuration: Date.now() - _0xbe4017.startedAt,
              dreaminaTaskStatus: 'cancelled',
              dreaminaTaskPhase: 'cancelled',
              dreaminaTaskLabel: sourceImageText('status.cancelled'),
              dreaminaTaskStartedAt: _0xbe4017.startedAt,
              dreaminaTaskLastCheckedAt: Date.now(),
              dreaminaTaskRecovering: false,
            }),
            parseError: (_0x23ae75) =>
              _0x23ae75 instanceof Error
                ? _0x23ae75.message
                : String(_0x23ae75 || sourceImageText('recovery.taskFailed')),
          },
          { store: appStore, startedAt: _0x15d3f9, abortController: _0x1ec856 },
        );
        (_0x3f9354.status === 'success' ||
          _0x3f9354.status === 'pending' ||
          (_0x3f9354.status === 'failed' && this._isDreaminaPollTimeoutError(_0x3f9354.error))) &&
          window._triggerLocalCacheSave?.();
      } catch (_0x31e9dc) {
        if (
          _0x1ec856.signal.aborted ||
          String(_0x31e9dc?.message || '') === 'CANCELLED' ||
          _0x31e9dc?.name === 'AbortError'
        )
          return;
      } finally {
        (this._dreaminaResumeAbortController === _0x1ec856 && (this._dreaminaResumeAbortController = null),
          this._dreaminaResumeSubmitId === _0x5c222a && (this._dreaminaResumeSubmitId = ''),
          (this._dreaminaResumePromise = null));
      }
    })();
    this._dreaminaResumePromise = _0x2c0dd8;
  }
  ['_maybeResumeAsyncTask']() {
    const _0x54c23c = appStore.getState().nodes?.[this.id] || this._data;
    if (!this._isAsyncRecoverableTask(_0x54c23c)) {
      this._stopAsyncRecovery(true);
      return;
    }
    const _0x521348 = String(_0x54c23c?.asyncTaskId || '').trim();
    if (!_0x521348) return;
    if (this._asyncResumePromise && this._asyncResumeTaskId === _0x521348) return;
    const _0xc54c23 =
        Number(_0x54c23c?.asyncTaskStartedAt || _0x54c23c?.generationStartTime || 0) || Date.now(),
      _0x24b3d8 = this._resolveAsyncResumePayload(_0x54c23c),
      _0x1aae33 = _0x24b3d8.provider || this._inferAsyncProvider(_0x54c23c),
      _0x11a92a =
        typeof this._resumeAsyncTaskPoller === 'function'
          ? this._resumeAsyncTaskPoller
          : resumeAsyncImageTask,
      _0x5282e6 = new AbortController();
    ((this._asyncResumeAbortController = _0x5282e6), (this._asyncResumeTaskId = _0x521348));
    const _0x327f81 = (async () => {
      try {
        const _0x4e5587 = await resumeTask(
          {
            sourceNodeId: this.id,
            targetNodeId: this.id,
            trigger: 'node',
            taskType: 'image-generation',
            provider: _0x1aae33 || _0x24b3d8.provider || _0x54c23c?.provider || '',
            adapterType: 'modelApi',
            modelId: _0x24b3d8.model || _0x54c23c?.model || '',
            executionId: (_0x1aae33 || _0x24b3d8.provider || 'model') + '.source-image.async',
            payload: _0x24b3d8,
            taskId: _0x521348,
            async: true,
            cancellable: false,
            resumable: true,
            startBuilder: () => ({
              asyncTaskProvider: _0x1aae33,
              asyncTaskKind: 'image',
              asyncTaskStatus:
                String(_0x54c23c?.asyncTaskStatus || '')
                  .trim()
                  .toLowerCase() === 'pending'
                  ? 'pending'
                  : 'running',
            }),
            poll: async () => _0x11a92a(_0x521348, _0x24b3d8, { signal: _0x5282e6.signal }),
            resultBuilder: async (_0x3945b1) => {
              const _0x5995f7 = appStore.getState().nodes?.[this.id] || {},
                _0x51d81f = String(_0x5995f7?.name || sourceImageText('result.defaultName'))
                  .replace(/\s*\(处理中\)\s*$/, '')
                  .replace(/\s*\(恢复中\)\s*$/, '')
                  .trim();
              return {
                ...this._buildRecoveredImageResultPatch(
                  _0x3945b1,
                  sourceImageText('recovery.asyncImageTaskFailed'),
                ),
                name: _0x51d81f || sourceImageText('result.defaultName'),
                generationDuration: this._computeGenerationDuration(_0x5995f7),
              };
            },
            failureBuilder: (_0x20d106, _0x46a438) => {
              const _0x38f5eb =
                  _0x20d106 instanceof Error
                    ? _0x20d106.message
                    : String(_0x20d106 || sourceImageText('recovery.taskFailed')),
                _0x44be8f = appStore.getState().nodes?.[this.id] || {};
              return buildSourceImageRecoveryFailurePatch(_0x44be8f, {
                error: _0x38f5eb,
                startedAt: _0x46a438.startedAt,
                duration: this._computeGenerationDuration(_0x44be8f),
              });
            },
            parseError: (_0x158a75) =>
              _0x158a75 instanceof Error
                ? _0x158a75.message
                : String(_0x158a75 || sourceImageText('recovery.taskFailed')),
          },
          { store: appStore, startedAt: _0xc54c23, abortController: _0x5282e6 },
        );
        _0x4e5587.status === 'success' && window._triggerLocalCacheSave?.();
      } catch (_0x15a027) {
        if (
          _0x5282e6.signal.aborted ||
          String(_0x15a027?.message || '') === 'CANCELLED' ||
          _0x15a027?.name === 'AbortError'
        )
          return;
        const _0x54eb74 =
            _0x15a027 instanceof Error
              ? _0x15a027.message
              : String(_0x15a027 || sourceImageText('recovery.taskFailed')),
          _0x34029b = appStore.getState().nodes?.[this.id];
        if (!_0x34029b) return;
        appStore.updateNodeData(this.id, {
          ...buildSourceImageRecoveryFailurePatch(_0x34029b, {
            error: _0x54eb74,
            startedAt: _0xc54c23,
            duration: this._computeGenerationDuration(_0x34029b),
          }),
          isGenerating: false,
          asyncTaskStatus: 'failed',
          asyncTaskRecovering: false,
        });
      } finally {
        (this._asyncResumeAbortController === _0x5282e6 && (this._asyncResumeAbortController = null),
          this._asyncResumeTaskId === _0x521348 && (this._asyncResumeTaskId = ''),
          (this._asyncResumePromise = null));
      }
    })();
    this._asyncResumePromise = _0x327f81;
  }
  ['_syncJobUI'](_0xa7cc8d) {
    if (!this._jobUI) return;
    _0xa7cc8d = _0xa7cc8d || null;
    if (_0xa7cc8d === 'running') {
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
      if (_0xa7cc8d === 'error') {
        ((this._jobUI.style.display = 'flex'), this._jobUI.replaceChildren(), stopLoading(this._jobUI));
        const _0x44bce9 = document.createElement('div');
        ((_0x44bce9.style.color = 'var(--text-danger)'),
          (_0x44bce9.style.fontSize = '13px'),
          (_0x44bce9.style.textAlign = 'center'),
          (_0x44bce9.style.padding = '20px'),
          (_0x44bce9.style.maxWidth = '90%'),
          (_0x44bce9.style.wordBreak = 'break-word'),
          (_0x44bce9.textContent = getTaskMessage(this._data) || sourceImageText('status.generationFailed')),
          this._jobUI.appendChild(_0x44bce9));
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
          }, 0x190));
        if (this._hint) this._hint.style.display = 'block';
        if (this._uploadBtn) this._uploadBtn.disabled = false;
      }
    }
  }
  ['update'](_0xd76238) {
    if (!this._img) return;
    const _0x643ecf = this._currentJobStatus;
    ((this._data = _0xd76238), (this._currentJobStatus = _0xd76238.jobStatus || null));
    const _0x243e95 = this._getImageDisplayLod(_0xd76238).url || this._getCapturePreviewUrl(_0xd76238);
    this._currentJobStatus !== _0x643ecf && this._syncJobUI(this._currentJobStatus);
    const _0x1c29c0 =
      shouldShowGenerationResultLoadingUi(_0xd76238, { hasResult: !!_0x243e95 }) && !this._currentJobStatus;
    if (_0x1c29c0) {
      startLoading(this._card, { variant: 'static' });
      if (this._hint) this._hint.style.display = 'none';
      if (this._uploadBtn) this._uploadBtn.disabled = true;
    } else {
      if (isTaskTerminal(_0xd76238)) {
        stopLoading(this._card);
        if (this._uploadBtn) this._uploadBtn.disabled = false;
      } else {
        if (!this._currentJobStatus) {
          !this._isUploading && _0x243e95 === this._currentSrc && stopLoading(this._card);
          if (this._uploadBtn) this._uploadBtn.disabled = false;
        }
      }
    }
    (void this._refreshImageDisplay(),
      this._applyMaskPreview(_0xd76238.maskPreviewUrl || _0xd76238.maskPreview),
      !isTaskFailed(_0xd76238) &&
        !isTaskCancelled(_0xd76238) &&
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
