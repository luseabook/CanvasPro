import { clearElement } from '../../utils/dom.js';
import { readViewportInteractionState } from '../../core/viewportInteractionState.js';
import {
  attachVideoPlaybackRecovery,
  detachVideoPlaybackRecovery,
  getVideoCurrentSource,
  logVideoPlaybackEvent,
  playVideoWithRecovery,
} from './mediaPlaybackRecovery.js';
import { localPathToUrl, urlToLocalPath } from '../../utils/localMediaPath.js';
import { getModelManifest } from '../../manifests/index.js';
import {
  buildRhAiAppResultDisplayPatch,
  isRunningHubAiAppManifest,
} from '../shared/rhAiAppNodeBehavior.js';
import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
  isMediaElementPlaybackSource,
} from '../../services/desktopMediaBlobSource.js';
import { desktopBridge } from '../../services/desktopBridge.js';
import { getTaskMessage, isTaskCancelled, isTaskFailed } from '../../core/generationTaskUiState.js';
import { t } from '../../i18n/index.js';
import {
  acquireLocalVideoPlaybackObjectUrl,
  releaseLocalVideoPlaybackObjectUrlOwner,
  releaseLocalVideoPlaybackObjectUrlOwnerScope,
} from '../../services/localVideoPlaybackObjectUrlService.js';
import { resolveCanvasVideoDisplayUrl } from '../../services/canvasMediaLocalService.js';
import {
  createTrackedMediaObjectUrl,
  revokeTrackedMediaObjectUrl,
} from '../../services/mediaObjectUrlRegistry.js';
import {
  getVideoPresentationSource,
  hasPresentedVideoFrame,
  resetVideoFramePresentation,
  watchVideoFramePresentation,
} from '../../services/videoFramePresentation.js';
function videoResultRenderText(value, item = {}) {
  return t('videoResultRender.' + value, item);
}
function isChromeShellRuntime() {
  const search = String(globalThis.location?.search || globalThis.window?.location?.search || '');
  return new URLSearchParams(search).get('aicRuntime') === 'chrome-shell';
}
// chrome-shell 没有桌面预览桥，非桌面的 web 渲染也一样——这两种环境都要走
// 共享本地视频 blob（由 localVideoPlaybackObjectUrlService 统一复用与释放）。
function shouldUseSharedLocalVideoBlob() {
  if (isChromeShellRuntime()) return true;
  return !desktopBridge.mediaPreview.isAvailable();
}
function isVideoResultFrameReady(el, sourceKey = '') {
  if (!el) return false;
  return hasPresentedVideoFrame(el, sourceKey);
}
function isDesktopRenderer() {
  return !!globalThis.window?.electronAPI;
}
function isLikelyPosterImageUrl(key) {
  const enabled = String(key || '').trim();
  if (!enabled) return false;
  if (/^(data:image\/|blob:|aic-local-preview:)/i.test(enabled)) return true;
  return /\.(?:png|jpe?g|webp|gif|avif|bmp)(?:[?#].*)?$/i.test(enabled);
}

// ---------------------------------------------------------------------------
// 结果元素的可见性 / 分层 / 媒体键
//
// 视频结果节点里同时存在多个 <video> 与海报层，靠 hidden + 两个 class 决定谁在前。
// 这些操作必须可重入：同一元素连续调用不能留下半隐藏状态，否则会出现「主结果亮了
// 但旧帧还在上面」这种鬼影。
// ---------------------------------------------------------------------------

/** 视口正在平移/缩放/动画时为 true，此时不该重排结果层。 */
function isVideoResultViewportBusy() {
  return readViewportInteractionState().isViewportBusy;
}

/** 显示/隐藏结果元素：hidden 属性与 is-hidden class 必须同时翻转。 */
function setVideoResultElementVisible(element, visible) {
  if (!element) return;
  const hidden = visible !== true;
  element.hidden = hidden;
  if (hidden) element.classList?.add?.('is-hidden');
  else if (element.classList?.contains?.('is-hidden')) element.classList?.remove?.('is-hidden');
}

function isVideoResultElementVisible(element) {
  return !!element && element.hidden !== true;
}

/** 切换主结果层：可见性、is-main-result 标记、z-index 一起改。 */
function setVideoResultLayerActive(element, active, zIndex) {
  if (!element) return;
  (setVideoResultElementVisible(element, active),
    element.classList?.toggle?.('is-main-result', active === true),
    Number.isFinite(Number(zIndex)) && (element.style.zIndex = String(zIndex)));
}

/** 批量写几何动画样式（transform/opacity 之类），一次性 assign 避免多次重排。 */
function applyVideoResultGeometryAnimationStyle(element, stylePatch) {
  if (!element || !stylePatch || typeof stylePatch !== 'object') return;
  Object.assign(element.style, stylePatch);
}

/** 结果媒体指纹：按优先级取第一个非空来源，用来判断「换片了没有」。 */
function getVideoResultMediaKey(videoItem = {}, selectedItem = {}) {
  return (
    [
      videoItem.displayLocalPath,
      videoItem.localPath,
      videoItem.videoUrl,
      videoItem.url,
      videoItem.src,
      videoItem.thumbUrl,
      videoItem.thumbId,
      selectedItem?.localPath,
      selectedItem?.videoUrl,
      selectedItem?.src,
      selectedItem?.thumbUrl,
    ]
      .map((candidate) => String(candidate || '').trim())
      .find(Boolean) || ''
  );
}

/** 跟随主结果切换时需要一起搬运的呈现字段（换主视频不能只换 url）。 */
const SELECTED_VIDEO_PRESENTATION_FIELDS = [
  'videoUrl',
  'localPath',
  'displayLocalPath',
  'videoLocalPath',
  'thumbId',
  'thumbUrl',
  'posterUrl',
  'thumbnailUrl',
  'previewUrl',
  'coverUrl',
  'posterLocalPath',
  'thumbLocalPath',
  'thumbnailLocalPath',
  'previewLocalPath',
  'capturePreviewUrl',
  'capturePreviewLocalPath',
  'videoThumbSrc',
  'videoThumbUnavailableSource',
  'mediaUnavailableSource',
];

/**
 * 切换主视频时的呈现补丁：索引夹取到合法范围，并只搬运白名单字段。
 * 白名单是必需的——把整个结果对象铺平会把无关状态（生成参数、进度）也一起写进去。
 */
export function buildSelectedVideoResultPresentationPatch(videoItems = [], mainVideoIndex = 0) {
  const items = Array.isArray(videoItems) ? videoItems : [],
    index = Math.max(0, Math.min(items.length - 1, Math.trunc(Number(mainVideoIndex) || 0))),
    selectedItem = items[index] && typeof items[index] === 'object' ? items[index] : {},
    patch = {
      mainVideoIndex: index,
      isVideosExpanded: false,
      mediaUnavailable: selectedItem.mediaUnavailable === true,
    };
  for (const field of SELECTED_VIDEO_PRESENTATION_FIELDS) {
    patch[field] = selectedItem[field] ?? '';
  }
  return patch;
}

export function createVideoNodeResultRenderModule(index) {
  const {
    store: store,
    api: api,
    getImage: getImage,
    ensureThumbDecoded: ensureThumbDecoded,
    buildApiUrl: buildApiUrl,
    VideoKeyingController: VideoKeyingController,
  } = index;
  class result {
    ['_buildRhAiAppVideoResultDisplayPatch'](
      nodeData = {},
      mediaWidth = 0,
      mediaHeight = 0,
      mediaKey = ''
    ) {
      // 只有 RunningHub AI App 出图才需要按 manifest 声明的展示规格改写结果层的
      // 尺寸/宽高比；普通视频走默认布局，这里直接返回空补丁。
      if (!isRunningHubAiAppManifest(getModelManifest(nodeData?.model))) return {};
      return buildRhAiAppResultDisplayPatch({ nodeData, mediaWidth, mediaHeight, mediaKey });
    }
    ['_getPreviewVideoRecoveryLabel'](el, data = 'preview') {
      const options = String(el?.dataset?.idx ?? ''),
        target = options ? data + ':' + options : data;
      return 'ai-video:' + this.nodeId + ':' + target;
    }
    ['_attachPreviewVideoRecovery'](el2, source = 'preview') {
      if (!el2) return null;
      const minBufferAhead = source === 'hover' || source === 'fullscreen';
      return attachVideoPlaybackRecovery(el2, {
        label: this._getPreviewVideoRecoveryLabel(el2, source),
        ensureSrc: () => this._ensureVideoSrcFor(el2, { forPlayback: true }),
        minBufferAhead: minBufferAhead ? 0.5 : undefined,
        readyTimeoutMs: minBufferAhead ? 350 : undefined,
        recoveryDebounceMs: minBufferAhead ? 150 : undefined,
        recoveryCooldownMs: minBufferAhead ? 500 : undefined,
        shouldRecover: () => this._shouldRecoverPreviewPlayback(el2),
      });
    }
    ['_logPreviewVideoPlaybackEvent'](enabled2, next, current = 'preview') {
      if (!enabled2) return;
      (this._attachPreviewVideoRecovery(enabled2, current),
        logVideoPlaybackEvent(enabled2, next, {
          label: this._getPreviewVideoRecoveryLabel(enabled2, current),
        }));
    }
    async ['_playPreviewVideoWithRecovery'](el3, entry = {}) {
      if (!el3) return false;
      const minBufferAhead2 = entry.reason || 'preview';
      return (
        this._attachPreviewVideoRecovery(el3, minBufferAhead2),
        playVideoWithRecovery(el3, {
          label: this._getPreviewVideoRecoveryLabel(el3, minBufferAhead2),
          ensureSrc: () => this._ensureVideoSrcFor(el3, { forPlayback: true }),
          minBufferAhead: minBufferAhead2 === 'hover' ? 0.5 : undefined,
          readyTimeoutMs: minBufferAhead2 === 'hover' ? 350 : undefined,
          recoveryDebounceMs: minBufferAhead2 === 'hover' ? 150 : undefined,
          recoveryCooldownMs: minBufferAhead2 === 'hover' ? 500 : undefined,
          shouldRecover: () =>
            el3.isConnected !== false && (this._isHovered || this._isManualControl || !el3.paused),
          shouldContinue:
            typeof entry.shouldContinue === 'function' ? entry.shouldContinue : undefined,
        })
      );
    }
    async ['_ensureVideoSrcFor'](el4, load = {}) {
      if (!el4) return false;
      const preload2 = load.preload === 'metadata' ? 'metadata' : 'auto',
        hasSrc = !!String(el4.getAttribute('src') || '').trim();
      if (hasSrc)
        return (
          load.forPlayback === true && el4.preload !== preload2 && (el4.preload = preload2),
          this._clearPreviewPosterForVisibleFrame(el4),
          true
        );
      const payload = store.getState(),
        handle = payload.nodes?.[this.nodeId] || this._data || {},
        state = Array.isArray(handle.videos) ? handle.videos : [],
        config = Number(el4.dataset?.idx),
        scope = Number.isFinite(config) ? Math.max(0, Math.trunc(config)) : 0,
        enabled3 = state[scope] || null;
      if (!enabled3) return false;
      // 双 token（节点级 + 元素级）防止异步竞态期间元素被复用后误写旧源。
      const attachToken = Number(this._videoSourceAttachToken || 0);
      !this._videoSourceAttachTokens && (this._videoSourceAttachTokens = new WeakMap());
      const elToken = Number(this._videoSourceAttachTokens.get(el4) || 0) + 1;
      this._videoSourceAttachTokens.set(el4, elToken);
      const isAttachCurrent = () =>
        Number(this._videoSourceAttachToken || 0) === attachToken &&
        this._videoSourceAttachTokens?.get(el4) === elToken;
      let enabled4 = this._resolveVideoPlaybackUrl(enabled3);
      if (!enabled4 && enabled3.thumbId) {
        const thumbId = String(enabled3.thumbId || '');
        if (thumbId) {
          enabled4 = await this._resolveCachedVideoObjectUrl(thumbId);
          if (!isAttachCurrent() || !this._isCachedVideoThumbIdCurrentForSlot(thumbId, scope))
            return false;
        }
      }
      if (!enabled4) return false;
      const playbackUrl = await this._resolveLocalVideoPlaybackObjectUrl(
        enabled4,
        'ai-video:' + this.nodeId + ':slot:' + scope
      );
      if (!isAttachCurrent()) return false;
      return (
        globalThis.window?.__runtimeCompareMark?.('ai-video-playback:attach', {
          nodeId: this.nodeId,
          slotIndex: scope,
          sourceUrl: enabled4,
          playbackUrl: playbackUrl,
        }),
        await attachMediaElementPlaybackSource(el4, enabled4, {
          playbackUrl: playbackUrl,
          preload: preload2,
          warmRanges: false,
          load: load.forPlayback === true,
          shouldAssign: isAttachCurrent,
          onSourceAssigned: () => {
            this._clearPreviewPosterForVisibleFrame(el4);
          },
        }),
        this._restorePreviewHoverPlaybackTime(el4, enabled4),
        this._clearPreviewPosterForVisibleFrame(el4),
        isAttachCurrent()
      );
    }
    ['_resolveVideoPlaybackUrl'](enabled5) {
      if (!enabled5 || typeof enabled5 !== 'object') return '';
      return (
        this._resolveMediaUrl(localPathToUrl(enabled5.displayLocalPath)) ||
        this._resolveMediaUrl(localPathToUrl(enabled5.localPath)) ||
        this._resolveMediaUrl(enabled5.videoUrl) ||
        this._resolveMediaUrl(resolveCanvasVideoDisplayUrl(enabled5)) ||
        ''
      );
    }
    ['_resolveMediaUrl'](value4) {
      const enabled6 = String(value4 || '').trim();
      if (!enabled6) return '';
      if (
        enabled6.startsWith('http://') ||
        enabled6.startsWith('https://') ||
        enabled6.startsWith('blob:') ||
        enabled6.startsWith('data:')
      )
        return enabled6;
      const url = localPathToUrl(enabled6);
      if (url) return buildApiUrl(url);
      if (enabled6.startsWith('/')) return buildApiUrl(enabled6);
      return buildApiUrl('/' + enabled6.replace(/^\/+/, ''));
    }
    async ['_resolveLocalVideoPlaybackObjectUrl'](sourceUrl, ownerKey = '') {
      if (!shouldUseSharedLocalVideoBlob()) return '';
      const owner = String(ownerKey || '').trim() || 'ai-video:' + this.nodeId + ':slot:main';
      return acquireLocalVideoPlaybackObjectUrl(sourceUrl, owner);
    }
    ['_getActiveCachedVideoThumbIds'](nodeData = null) {
      const nodes = store.getState()?.nodes,
        nodesIsObject = nodes && typeof nodes === 'object',
        effectiveData =
          nodeData && typeof nodeData === 'object'
            ? nodeData
            : nodesIsObject
              ? nodes[this.nodeId] || {}
              : this._data || {},
        videos = Array.isArray(effectiveData.videos) ? effectiveData.videos : [],
        candidates = videos.length > 0 ? videos : [effectiveData],
        activeThumbIds = new Set();
      for (const item of candidates) {
        const thumbId = String(item?.thumbId || '').trim();
        if (
          !thumbId ||
          String(item?.error || '').trim() ||
          this._isVideoMarkedUnavailable(item) ||
          this._resolveVideoPlaybackUrl(item)
        )
          continue;
        activeThumbIds.add(thumbId);
      }
      return activeThumbIds;
    }
    ['_isCachedVideoThumbIdCurrent'](thumbId) {
      const normalized = String(thumbId || '').trim();
      if (!normalized || this._videoObjectUrlsDisposed === true) return false;
      const nodes = store.getState()?.nodes,
        nodeData = nodes && typeof nodes === 'object' ? nodes[this.nodeId] : this._data;
      if (!nodeData) return false;
      return this._getActiveCachedVideoThumbIds(nodeData).has(normalized);
    }
    ['_isCachedVideoThumbIdCurrentForSlot'](thumbId, slotIndex) {
      const normalized = String(thumbId || '').trim();
      if (!normalized || this._videoObjectUrlsDisposed === true) return false;
      const nodes = store.getState()?.nodes,
        nodeData = nodes && typeof nodes === 'object' ? nodes[this.nodeId] : this._data;
      if (!nodeData) return false;
      const videos = Array.isArray(nodeData.videos) ? nodeData.videos : [],
        index = Math.max(0, Math.trunc(Number(slotIndex) || 0)),
        item = videos.length > 0 ? videos[index] || null : index === 0 ? nodeData : null;
      return Boolean(
        item &&
        String(item.thumbId || '').trim() === normalized &&
        !String(item.error || '').trim() &&
        !this._isVideoMarkedUnavailable(item) &&
        !this._resolveVideoPlaybackUrl(item)
      );
    }
    ['_getCachedVideoObjectUrlConsumers']() {
      const consumers = new Set(),
        addConsumer = (el) => {
          if (el) consumers.add(el);
        };
      (addConsumer(this.videoEl), addConsumer(this._activeFullscreenVideoEl));
      for (const layerEl of this._multiLayerEls || []) addConsumer(layerEl);
      for (const previewVideo of this.previewEl?.querySelectorAll?.('video') || []) {
        addConsumer(previewVideo);
      }
      for (const expandVideo of this._expandPanel?.querySelectorAll?.('video') || []) {
        addConsumer(expandVideo);
      }
      return consumers;
    }
    ['_isCachedVideoObjectUrlReferenced'](el, objectUrl) {
      const normalized = String(objectUrl || '').trim();
      if (!el || !normalized) return false;
      return [
        el.getAttribute?.('src'),
        el.currentSrc,
        el.src,
        el.dataset?.desktopMediaSourceUrl,
      ].some((candidate) => String(candidate || '').trim() === normalized);
    }
    ['_detachCachedVideoObjectUrlConsumers'](objectUrl) {
      const staleConsumers = [...this._getCachedVideoObjectUrlConsumers()].filter((el) =>
        this._isCachedVideoObjectUrlReferenced(el, objectUrl)
      );
      this._activeFullscreenVideoEl &&
        staleConsumers.includes(this._activeFullscreenVideoEl) &&
        this._activeFullscreenCleanup?.();
      for (const el of staleConsumers) {
        const slotIndex = Math.max(0, Math.trunc(Number(el?.dataset?.idx) || 0));
        resetVideoFramePresentation(el);
        try {
          el.pause?.();
        } catch {}
        (clearDesktopMediaPlaybackSourceMetadata(el), el.removeAttribute?.('src'));
        try {
          el.load?.();
        } catch {}
        releaseLocalVideoPlaybackObjectUrlOwner('ai-video:' + this.nodeId + ':slot:' + slotIndex);
      }
      return staleConsumers.length;
    }
    ['_releaseCachedVideoObjectUrl'](thumbId, objectUrl) {
      const normalizedThumbId = String(thumbId || '').trim(),
        normalizedObjectUrl = String(objectUrl || '').trim();
      if (normalizedThumbId) this._cachedVideoUrls?.delete?.(normalizedThumbId);
      if (!normalizedObjectUrl) return false;
      return (
        this._detachCachedVideoObjectUrlConsumers(normalizedObjectUrl),
        revokeTrackedMediaObjectUrl(normalizedObjectUrl)
      );
    }
    ['_syncCachedVideoObjectUrls'](nodeData = null) {
      !(this._cachedVideoUrls instanceof Map) && (this._cachedVideoUrls = new Map());
      const activeThumbIds = this._getActiveCachedVideoThumbIds(nodeData);
      let releasedCount = 0;
      for (const [thumbId, objectUrl] of [...this._cachedVideoUrls.entries()]) {
        if (activeThumbIds.has(thumbId)) continue;
        releasedCount += this._releaseCachedVideoObjectUrl(thumbId, objectUrl) ? 1 : 0;
      }
      return releasedCount;
    }
    ['_releaseAllCachedVideoObjectUrls']({ invalidatePending: invalidatePending = false } = {}) {
      invalidatePending &&
        ((this._videoObjectUrlLifecycleEpoch = Number(this._videoObjectUrlLifecycleEpoch || 0) + 1),
        this._cachedVideoUrlLoads?.clear?.());
      let releasedCount = 0;
      for (const [thumbId, objectUrl] of [...(this._cachedVideoUrls?.entries?.() || [])]) {
        releasedCount += this._releaseCachedVideoObjectUrl(thumbId, objectUrl) ? 1 : 0;
      }
      return (this._cachedVideoUrls?.clear?.(), releasedCount);
    }
    async ['_resolveCachedVideoObjectUrl'](thumbId) {
      const normalizedThumbId = String(thumbId || '').trim();
      if (!normalizedThumbId || !this._isCachedVideoThumbIdCurrent(normalizedThumbId)) return '';
      !(this._cachedVideoUrls instanceof Map) && (this._cachedVideoUrls = new Map());
      const cachedUrl = String(this._cachedVideoUrls.get(normalizedThumbId) || '').trim();
      if (cachedUrl) return cachedUrl;
      !(this._cachedVideoUrlLoads instanceof Map) && (this._cachedVideoUrlLoads = new Map());
      const pendingLoad = this._cachedVideoUrlLoads.get(normalizedThumbId);
      if (pendingLoad) return pendingLoad;
      const lifecycleEpoch = Number(this._videoObjectUrlLifecycleEpoch || 0),
        loadPromise = Promise.resolve()
          .then(() => getImage(normalizedThumbId))
          .then((blob) => {
            if (
              !blob ||
              this._videoObjectUrlsDisposed === true ||
              Number(this._videoObjectUrlLifecycleEpoch || 0) !== lifecycleEpoch ||
              !this._isCachedVideoThumbIdCurrent(normalizedThumbId)
            )
              return '';
            const alreadyCached = String(this._cachedVideoUrls.get(normalizedThumbId) || '').trim();
            if (alreadyCached) return alreadyCached;
            const objectUrl = createTrackedMediaObjectUrl(blob, {
              kind: 'video',
              ownerId: 'ai-video:' + this.nodeId + ':result-cache',
              sourceUrl: normalizedThumbId,
            });
            if (!objectUrl) return '';
            // 加载期间状态已翻页：丢弃新 URL，返回当时已落缓存的那份（若有）。
            if (
              this._videoObjectUrlsDisposed === true ||
              Number(this._videoObjectUrlLifecycleEpoch || 0) !== lifecycleEpoch ||
              !this._isCachedVideoThumbIdCurrent(normalizedThumbId) ||
              this._cachedVideoUrls.has(normalizedThumbId)
            )
              return (
                revokeTrackedMediaObjectUrl(objectUrl),
                String(this._cachedVideoUrls.get(normalizedThumbId) || '').trim()
              );
            return (this._cachedVideoUrls.set(normalizedThumbId, objectUrl), objectUrl);
          })
          .catch(() => '')
          .finally(() => {
            this._cachedVideoUrlLoads.get(normalizedThumbId) === loadPromise &&
              this._cachedVideoUrlLoads.delete(normalizedThumbId);
          });
      return (this._cachedVideoUrlLoads.set(normalizedThumbId, loadPromise), loadPromise);
    }
    ['_disposeCachedVideoObjectUrls']() {
      return (
        (this._videoObjectUrlsDisposed = true),
        this._releaseAllCachedVideoObjectUrls({ invalidatePending: true })
      );
    }
    ['_releaseLocalVideoPlaybackObjectUrl']() {
      ((this._localPlaybackBlobToken = Number(this._localPlaybackBlobToken || 0) + 1),
        this._localPlaybackBlobFetchController?.abort?.(),
        (this._localPlaybackBlobFetchController = null),
        (this._localPlaybackBlobPromise = null),
        (this._localPlaybackBlobPromiseSource = ''));
      const playbackObjectUrl = String(this._localPlaybackObjectUrl || '').trim();
      ((this._localPlaybackObjectUrl = ''), (this._localPlaybackObjectSource = ''));
      const scopeReleased =
        releaseLocalVideoPlaybackObjectUrlOwnerScope('ai-video:' + this.nodeId) > 0;
      if (playbackObjectUrl) revokeTrackedMediaObjectUrl(playbackObjectUrl);
      return scopeReleased || !!playbackObjectUrl;
    }
    ['_restoreIdlePreviewPoster'](videoEl) {
      // 退出悬停/手动播放后回到「静止海报」形态：有海报就设 poster 并藏占位符，
      // 没有就清掉 poster 并让占位符露出来——否则会留一块透明区域什么都不显示。
      if (!videoEl) return false;
      const posterUrl = this._resolveDeferredVideoPosterUrl();
      return (
        posterUrl
          ? ((videoEl.poster = posterUrl), setVideoResultElementVisible(this._placeholderEl, false))
          : (videoEl.removeAttribute?.('poster'),
            setVideoResultElementVisible(this._placeholderEl, true)),
        this._removeDeferredVideoPosterPreview(),
        this._setVideoOverlaysVisible?.(false),
        !!posterUrl
      );
    }
    ['prepareRendererMediaFallbackForSuspend']() {
      // 视口忙（平移/缩放）时协调器会挂起媒体。挂起前必须先把海报解码好，
      // 否则视频源被摘掉那一刻屏幕是空的——这是「平移时闪黑」的根因。
      if (this._showDeferredVideoPosterPreview() !== true) return false;
      const posterImg = this._deferredPosterImgEl;
      if (!posterImg) return false;
      posterImg.loading = 'eager';
      try {
        posterImg.fetchPriority = 'high';
      } catch {}
      return (
        posterImg.isConnected !== false &&
        posterImg.complete === true &&
        Number(posterImg.naturalWidth || 0) > 0
      );
    }
    ['hasPresentedRendererMedia']() {
      // 协调器据此决定「挂起时是否保留已呈现画面」。返回 false 会让已解码的帧被丢弃，
      // 表现为每次平移都重新解码 + 闪一下。
      const nodeData = this._data || {},
        videos = Array.isArray(nodeData.videos) ? nodeData.videos : [],
        mainIndex = Math.max(
          0,
          Math.min(Math.max(0, videos.length - 1), Math.trunc(Number(nodeData.mainVideoIndex) || 0))
        ),
        layerEl = this._multiLayerEls?.[mainIndex] || null;
      return !!(layerEl && getVideoCurrentSource(layerEl) && isVideoResultFrameReady(layerEl));
    }
    ['suspendRendererMedia']() {
      // 挂起 = 主动放弃当前解码会话：换 epoch/令牌让所有在途回调失效，
      // 再逐个 <video> 停播、清帧、摘 src。漏一步就会出现「已挂起但仍在播」的鬼影。
      ((this._videoRenderEpoch = Number(this._videoRenderEpoch || 0) + 1),
        (this._videoSourceAttachToken = Number(this._videoSourceAttachToken || 0) + 1),
        (this._isHovered = false),
        (this._previewHoverActivationPending = false),
        (this._hoverManualPause = false),
        (this._isManualControl = false),
        (this._autoPlayToken = Number(this._autoPlayToken || 0) + 1),
        this._setVideoOverlaysVisible?.(false),
        this._releaseLocalVideoPlaybackObjectUrl(),
        (this._previewPostersClearedForPlayback = new WeakMap()));
      for (const previewVideo of this.previewEl?.querySelectorAll?.('video') || []) {
        resetVideoFramePresentation(previewVideo);
        try {
          previewVideo.pause?.();
        } catch {}
        previewVideo.removeAttribute?.('src');
        try {
          previewVideo.load?.();
        } catch {}
      }
      (this._releaseAllCachedVideoObjectUrls({ invalidatePending: true }),
        (this._rendererMediaDeferred = true),
        (this._rendererEagerVideoPreview = false),
        (this._deferredVideoViewRefreshPending = true),
        this._showDeferredVideoPosterPreview());
    }
    ['_detachPreviewVideoRecovery'](videoEl) {
      return detachVideoPlaybackRecovery(videoEl);
    }
    ['hydrateRendererThinVideoPresentation']() {
      // 「薄呈现」= 先给海报、视频源延后。标记还在说明还没真正加载，
      // 这里补上最后一次加载并清标记；已加载过就直接返回 false，避免重复解码。
      if (this._rendererThinVideoHydration !== true) return false;
      return ((this._rendererThinVideoHydration = false), this._loadAndDisplayVideo());
    }
    ['_restorePreviewHoverPlaybackTime'](el, sourceUrl) {
      const resumeState = this._hoverPlaybackResumeState,
        normalizedSource = String(sourceUrl || '').trim();
      if (!resumeState || !el || !normalizedSource || resumeState.source !== normalizedSource)
        return false;
      const tryRestore = () => {
        if (
          this._hoverPlaybackResumeState !== resumeState ||
          !isMediaElementPlaybackSource(el, normalizedSource)
        )
          return false;
        const duration = Number(el.duration || 0);
        if (!Number.isFinite(duration) || duration <= 0) return false;
        const resumeTime = Math.min(
          Math.max(0, Number(resumeState.time || 0)),
          Math.max(0, duration - 0.05)
        );
        try {
          el.currentTime = resumeTime;
        } catch {
          return false;
        }
        return ((this._hoverPlaybackResumeState = null), true);
      };
      if (tryRestore()) return true;
      const onReady = () => {
        if (!tryRestore()) return;
        (el.removeEventListener?.('loadedmetadata', onReady),
          el.removeEventListener?.('canplay', onReady));
      };
      return (
        el.addEventListener?.('loadedmetadata', onReady),
        el.addEventListener?.('canplay', onReady),
        true
      );
    }
    ['_resolveDeferredVideoPosterUrl']() {
      const nodeData = this._data || {},
        videos = Array.isArray(nodeData.videos) ? nodeData.videos : [],
        rawIndex = Number(nodeData.mainVideoIndex),
        mainIndex = Number.isFinite(rawIndex) ? Math.max(0, Math.trunc(rawIndex)) : 0,
        currentVideo = videos[mainIndex] || videos[0] || null;
      // 失败/取消/单条 error 时不回退海报：此时画面该显示错误卡，
      // 拿旧海报顶上去等于把失败伪装成成功（用户以为生成好了）。
      if (
        isTaskFailed(nodeData) ||
        isTaskCancelled(nodeData) ||
        String(currentVideo?.error || '').trim()
      )
        return '';
      return this._resolveVideoResultPosterUrl(currentVideo, {
        nodeData,
        // 单条结果时允许回退节点级字段；多条时节点级字段是「上一次选中的那条」，
        // 回退会串图。
        allowNodeFallback: videos.length <= 1,
      });
    }
    ['_resolveVideoResultPosterUrl'](
      videoItem,
      { nodeData = this._data || {}, allowNodeFallback = false } = {}
    ) {
      const collectPosterCandidates = (source) => [
          source?.posterUrl,
          source?.thumbUrl,
          source?.thumbnailUrl,
          source?.previewUrl,
          source?.videoThumbSrc,
          localPathToUrl(source?.posterLocalPath),
          localPathToUrl(source?.thumbLocalPath),
          localPathToUrl(source?.thumbnailLocalPath),
          localPathToUrl(source?.previewLocalPath),
        ],
        candidates = [
          ...collectPosterCandidates(videoItem),
          ...(allowNodeFallback ? collectPosterCandidates(nodeData) : []),
        ];
      for (const candidate of candidates) {
        const normalized = String(candidate || '').trim();
        if (!isLikelyPosterImageUrl(normalized)) continue;
        const resolvedUrl = this._resolveMediaUrl(normalized);
        if (resolvedUrl) return resolvedUrl;
      }
      return '';
    }
    ['_shouldRecoverPreviewPlayback'](el) {
      return (
        el?.isConnected !== false &&
        this._hoverManualPause !== true &&
        (this._isHovered || this._isManualControl || !el?.paused)
      );
    }
    ['_clearPreviewPosterForVisibleFrame'](el) {
      if (isVideoResultFrameReady(el)) return (this._markPreviewPosterClearedForPlayback(el), true);
      return (
        watchVideoFramePresentation(el, () => {
          const nodeData =
              (typeof store.getStateRaw === 'function' ? store.getStateRaw() : store.getState())
                ?.nodes?.[this.nodeId] ||
              this._data ||
              {},
            mainIndex = Math.max(0, Math.trunc(Number(nodeData.mainVideoIndex) || 0)),
            slotIndex = Math.max(0, Math.trunc(Number(el?.dataset?.idx) || 0));
          if (slotIndex !== mainIndex || !isVideoResultFrameReady(el)) return;
          this._markPreviewPosterClearedForPlayback(el);
        }),
        false
      );
    }
    ['_markPreviewPosterClearedForPlayback'](el) {
      if (!el) return false;
      !this._previewPostersClearedForPlayback &&
        (this._previewPostersClearedForPlayback = new WeakMap());
      const presentationSource = getVideoPresentationSource(el),
        alreadyCleared = !!(
          presentationSource &&
          this._previewPostersClearedForPlayback.get(el) === presentationSource
        ),
        hasDeferredPoster = !!this._deferredPosterImgEl,
        hasPosterAttr = !!String(el?.poster || '').trim(),
        isFastPreviewOwner = this.el?.dataset?.rendererPresentationOwner === 'fast-preview';
      if (alreadyCleared && !hasDeferredPoster && !hasPosterAttr && !isFastPreviewOwner)
        return false;
      (this._previewPostersClearedForPlayback.set(el, presentationSource),
        this._removeDeferredVideoPosterPreview(),
        globalThis.window?.v2Renderer?.releaseFastPreviewForPlayback?.(this.nodeId));
      if (hasPosterAttr) return (el.removeAttribute?.('poster'), true);
      return hasDeferredPoster || isFastPreviewOwner;
    }
    ['_isPreviewPosterClearedForPlayback'](el) {
      const presentationSource = getVideoPresentationSource(el);
      return !!(
        presentationSource &&
        this._previewPostersClearedForPlayback?.get?.(el) === presentationSource
      );
    }
    ['_removeDeferredVideoPosterPreview']() {
      (this._deferredPosterImgEl?.remove?.(), (this._deferredPosterImgEl = null));
    }
    ['_showDeferredVideoPosterPreview']() {
      const enabled7 = this._resolveDeferredVideoPosterUrl();
      if (!enabled7 || !this.previewEl) {
        this._removeDeferredVideoPosterPreview();
        if (this._placeholderEl) this._placeholderEl.style.display = 'flex';
        return (this._setVideoOverlaysVisible?.(false), false);
      }
      let el5 = this._deferredPosterImgEl;
      if (!el5 || el5.parentNode !== this.previewEl) {
        ((el5 = document.createElement('img')),
          el5.classList?.add?.('v2-media-preview', 'ai-video-deferred-poster'),
          (el5.draggable = false),
          (el5.alt = ''),
          (el5.decoding = 'async'),
          (el5.loading = 'eager'));
        try {
          el5.fetchPriority = 'high';
        } catch {}
        if (!el5.style) el5.style = {};
        (Object.assign(el5.style, {
          position: 'absolute',
          inset: '0',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: '8px',
          pointerEvents: 'none',
        }),
          this.previewEl.appendChild(el5),
          (this._deferredPosterImgEl = el5));
      }
      const value14 = el5.getAttribute?.('src') || el5.src || '';
      value14 !== enabled7 &&
        (typeof el5.setAttribute === 'function' && el5.setAttribute('src', enabled7),
        (el5.src = enabled7));
      if (this._placeholderEl) this._placeholderEl.style.display = 'none';
      return (this._setVideoOverlaysVisible?.(false), ensureThumbDecoded?.(enabled7), true);
    }
    ['_resolveVideoMetaSrcFromVideoData'](enabled8) {
      if (!enabled8) return '';
      const url2 = localPathToUrl(enabled8.displayLocalPath);
      if (url2) return url2;
      const url3 = localPathToUrl(enabled8.localPath);
      if (url3) return url3;
      const enabled9 = String(enabled8.videoUrl || '').trim();
      if (!enabled9) return '';
      if (enabled9.startsWith('blob:') || enabled9.startsWith('data:')) return '';
      return localPathToUrl(urlToLocalPath(enabled9));
    }
    ['_getVideoSourceKey'](enabled10) {
      if (!enabled10 || typeof enabled10 !== 'object') return '';
      return (
        String(enabled10.localPath || '').trim() ||
        String(enabled10.videoUrl || '').trim() ||
        String(enabled10.src || '').trim() ||
        String(enabled10.thumbId || '').trim()
      );
    }
    ['_getVideoResultIdentityKey'](videoItem) {
      // 用来判断「全屏里放的还是不是当前这条结果」。只认能唯一定位的字段，
      // 全空就返回空串（调用方据此视为「无法判定」，不当作身份）。
      if (!videoItem || typeof videoItem !== 'object') return '';
      const identityValues = [
        videoItem.thumbId,
        videoItem.assetId,
        videoItem.displayLocalPath,
        videoItem.localPath,
        videoItem.videoUrl,
        videoItem.src,
      ].map((value) => String(value || '').trim());
      return identityValues.some(Boolean) ? JSON.stringify(identityValues) : '';
    }
    ['_closeFullscreenForStaleResult'](nodeData = null) {
      // 结果变了（重跑/换主视频/删条）但全屏还开着旧的，必须主动关掉，
      // 否则用户会盯着一条已经不存在的视频，且它的 objectURL 还占着内存。
      const activeIdentity = String(this._activeFullscreenResultIdentity || '').trim(),
        pendingIdentity = String(this._pendingFullscreenResultIdentity || '').trim();
      if (!activeIdentity && !pendingIdentity) return false;
      const source = nodeData && typeof nodeData === 'object' ? nodeData : this._data || {},
        videos = Array.isArray(source.videos) ? source.videos : [],
        candidates = videos.length > 0 ? videos : [source],
        liveIdentities = new Set(
          candidates
            .filter(
              (item) => !String(item?.error || '').trim() && !this._isVideoMarkedUnavailable(item)
            )
            .map((item) => this._getVideoResultIdentityKey(item))
            .filter(Boolean)
        );
      let closed = false;
      return (
        pendingIdentity &&
          !liveIdentities.has(pendingIdentity) &&
          ((this._fullscreenOpenEpoch = Number(this._fullscreenOpenEpoch || 0) + 1),
          (this._pendingFullscreenResultIdentity = ''),
          (closed = true)),
        activeIdentity &&
          this._activeFullscreenCleanup &&
          !liveIdentities.has(activeIdentity) &&
          (this._activeFullscreenCleanup(), (closed = true)),
        closed
      );
    }
    ['_isVideoMarkedUnavailable'](value15) {
      const enabled11 = this._getVideoSourceKey(value15);
      if (!enabled11) return false;
      const value16 = String(value15?.mediaUnavailableSource || '').trim();
      return value15?.mediaUnavailable === true && value16 === enabled11;
    }
    ['_isVideoThumbMarkedUnavailable'](value17, value18 = '') {
      const enabled12 = String(value18 || this._resolveVideoMetaSrcFromVideoData(value17)).trim();
      if (!enabled12) return false;
      return String(value17?.videoThumbUnavailableSource || '').trim() === enabled12;
    }
    ['_markVideoThumbUnavailable'](count, value19, value20 = '') {
      const videoThumbUnavailableSource = String(
        value20 || this._resolveVideoMetaSrcFromVideoData(value19)
      ).trim();
      if (!videoThumbUnavailableSource) return;
      const enabled13 = store.getState().nodes[this.nodeId];
      if (!enabled13) return;
      const list = Array.isArray(enabled13.videos) ? enabled13.videos : [],
        value21 = Number(enabled13.mainVideoIndex),
        value22 = Number.isFinite(value21) ? Math.max(0, Math.trunc(value21)) : 0,
        value23 = {};
      (count < 0 || count === value22) &&
        ((value23.videoThumbUnavailableSource = videoThumbUnavailableSource),
        (value23.thumbUrl = ''));
      if (count >= 0 && count < list.length) {
        const args = list[count];
        if (args && typeof args === 'object') {
          const value24 = list.slice();
          ((value24[count] = {
            ...args,
            videoThumbUnavailableSource: videoThumbUnavailableSource,
            thumbUrl: '',
          }),
            (value23.videos = value24));
        }
      }
      if (Object.keys(value23).length) store.updateNodeData(this.nodeId, value23);
    }
    ['_markVideoUnavailable'](count2, value25) {
      const mediaUnavailableSource = this._getVideoSourceKey(value25);
      if (!mediaUnavailableSource) return;
      const enabled14 = store.getState().nodes[this.nodeId];
      if (!enabled14) return;
      const list2 = Array.isArray(enabled14.videos) ? enabled14.videos : [],
        value26 = Number(enabled14.mainVideoIndex),
        value27 = Number.isFinite(value26) ? Math.max(0, Math.trunc(value26)) : 0,
        value28 = { mediaUnavailable: true, mediaUnavailableSource: mediaUnavailableSource };
      if (count2 < 0 || count2 === value27) value28.thumbUrl = '';
      if (count2 >= 0 && count2 < list2.length) {
        const args2 = list2[count2];
        if (args2 && typeof args2 === 'object') {
          const value29 = list2.slice();
          ((value29[count2] = {
            ...args2,
            mediaUnavailable: true,
            mediaUnavailableSource: mediaUnavailableSource,
            thumbUrl: '',
          }),
            (value28.videos = value29));
        }
      }
      store.updateNodeData(this.nodeId, value28);
    }
    ['_clearVideoUnavailable'](count3, value30) {
      const enabled15 = this._getVideoSourceKey(value30);
      if (!enabled15) return;
      const enabled16 = store.getState().nodes[this.nodeId];
      if (!enabled16) return;
      const value31 = {};
      enabled16.mediaUnavailable === true &&
        String(enabled16.mediaUnavailableSource || '') === enabled15 &&
        ((value31.mediaUnavailable = false), (value31.mediaUnavailableSource = ''));
      const list3 = Array.isArray(enabled16.videos) ? enabled16.videos : [];
      if (count3 >= 0 && count3 < list3.length) {
        const args3 = list3[count3];
        if (
          args3 &&
          typeof args3 === 'object' &&
          args3.mediaUnavailable === true &&
          String(args3.mediaUnavailableSource || '') === enabled15
        ) {
          const value32 = list3.slice();
          ((value32[count3] = { ...args3, mediaUnavailable: false, mediaUnavailableSource: '' }),
            (value31.videos = value32));
        }
      }
      if (Object.keys(value31).length) store.updateNodeData(this.nodeId, value31);
    }
    ['_shouldFetchVideoMetaForNodeInfo']() {
      try {
        const value33 =
          typeof store.getStateRaw === 'function' ? store.getStateRaw() : store.getState();
        return value33?.ui?.showVideoMeta === true;
      } catch {
        return false;
      }
    }
    async ['_maybeFetchVideoMeta'](value34) {
      if (!this._shouldFetchVideoMetaForNodeInfo()) return;
      const videoMetaSrc = String(value34 || '').trim();
      if (!videoMetaSrc) return;
      const enabled17 = store.getState().nodes[this.nodeId];
      if (!enabled17) return;
      const value35 = String(enabled17.videoMetaSrc || ''),
        value36 =
          Number.isFinite(Number(enabled17.videoFps)) &&
          Number(enabled17.videoFps) > 0 &&
          Number.isFinite(Number(enabled17.videoFrameCount)) &&
          Number(enabled17.videoFrameCount) > 0;
      if (value36 && value35 === videoMetaSrc) return;
      value35 &&
        value35 !== videoMetaSrc &&
        store.updateNodeData(this.nodeId, {
          videoMetaSrc: videoMetaSrc,
          videoFps: null,
          videoFrameCount: null,
          videoDuration: null,
          videoWidth: null,
          videoHeight: null,
        });
      const value37 = ++this._metaFetchToken;
      try {
        const box = await api.fetchVideoMetaFromServer(videoMetaSrc);
        if (value37 !== this._metaFetchToken) return;
        if (!box || box.success !== true) return;
        const count4 = Number(box.fps),
          count5 = Number(box.frameCount),
          count6 = Number(box.duration),
          count7 = Number(box.width),
          count8 = Number(box.height),
          value38 = { videoMetaSrc: videoMetaSrc };
        if (Number.isFinite(count4) && count4 > 0) value38.videoFps = count4;
        if (Number.isFinite(count5) && count5 > 0) value38.videoFrameCount = Math.round(count5);
        if (Number.isFinite(count6) && count6 > 0) value38.videoDuration = count6;
        if (Number.isFinite(count7) && count7 > 0) value38.videoWidth = Math.round(count7);
        if (Number.isFinite(count8) && count8 > 0) value38.videoHeight = Math.round(count8);
        const enabled18 = store.getState().nodes[this.nodeId];
        if (!enabled18) return;
        const value39 =
          String(enabled18.videoMetaSrc || '') !== String(value38.videoMetaSrc || '') ||
          Number(enabled18.videoFps || 0) !== Number(value38.videoFps || 0) ||
          Number(enabled18.videoFrameCount || 0) !== Number(value38.videoFrameCount || 0) ||
          Number(enabled18.videoDuration || 0) !== Number(value38.videoDuration || 0) ||
          Number(enabled18.videoWidth || 0) !== Number(value38.videoWidth || 0) ||
          Number(enabled18.videoHeight || 0) !== Number(value38.videoHeight || 0);
        if (value39) store.updateNodeData(this.nodeId, value38);
      } catch {}
    }
    ['_createStatusCard'](value40, value41) {
      const el6 = document.createElement('div');
      ((el6.className = 'gen-status-card'),
        Object.assign(el6.style, {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          gap: '8px',
          padding: '16px',
          boxSizing: 'border-box',
          background: 'var(--bg-panel-card)',
          textAlign: 'center',
        }));
      const value42 = Number(value41) === 0,
        value43 = value42 ? 'var(--green)' : 'var(--white-80)';
      return (
        (el6.innerHTML =
          '\n            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' +
          value43 +
          '" stroke-width="2">\n                <circle cx="12" cy="12" r="10"/><path d="' +
          (value42 ? 'M8 12l2.5 2.5L16 9' : 'M12 8v5') +
          '" />' +
          (value42 ? '' : '<line x1="12" y1="16" x2="12.01" y2="16" />') +
          '\n            </svg>\n            <span style="color:' +
          value43 +
          ';font-size:12px;font-weight:600;line-height:1.4;">' +
          value40 +
          '</span>\n        '),
        el6
      );
    }
    ['_ensureStatusOverlayEl']() {
      if (this._statusOverlayEl) return this._statusOverlayEl;
      return (
        (this._statusOverlayEl = document.createElement('div')),
        (this._statusOverlayEl.className = 'dreamina-status-overlay'),
        Object.assign(this._statusOverlayEl.style, {
          position: 'absolute',
          inset: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          padding: '16px',
          boxSizing: 'border-box',
          zIndex: '11',
        }),
        this.previewEl.appendChild(this._statusOverlayEl),
        this._statusOverlayEl
      );
    }
    ['_clearStatusOverlay']() {
      if (!this._statusOverlayEl) return;
      (this._statusOverlayEl.remove(), (this._statusOverlayEl = null));
    }
    ['_getGenerationFailureMessage'](enabled19 = this._data) {
      if (!enabled19 || typeof enabled19 !== 'object') return '';
      const isTaskFailed2 = isTaskFailed(enabled19) || isTaskCancelled(enabled19);
      if (!isTaskFailed2) return '';
      return getTaskMessage(enabled19) || videoResultRenderText('generationFailed');
    }
    ['_mustRenderTerminalVideoState'](nodeData = this._data) {
      // 「终态」= 任务失败/取消，或当前主视频带 error。这类状态下必须继续渲染，
      // 否则媒体推迟（_rendererMediaDeferred）会连错误提示一起挡掉，
      // 用户看到的是一个空的、永远转圈或永远灰掉的节点。
      const source = nodeData && typeof nodeData === 'object' ? nodeData : {},
        videos = Array.isArray(source.videos) ? source.videos : [],
        mainIndex = Math.max(0, Math.trunc(Number(source.mainVideoIndex) || 0)),
        currentVideo = videos[mainIndex] || videos[0] || null;
      return (
        !!this._getGenerationFailureMessage(source) || !!String(currentVideo?.error || '').trim()
      );
    }
    ['_createErrorCard'](value44) {
      const el7 = document.createElement('div');
      ((el7.className = 'gen-error-card'),
        Object.assign(el7.style, {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          gap: '8px',
          padding: '16px',
          boxSizing: 'border-box',
          background: 'var(--bg-panel-card)',
          textAlign: 'center',
        }));
      const el8 = document.createElement('div');
      el8.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      const el9 = document.createElement('span');
      ((el9.textContent = videoResultRenderText('generationFailed')),
        Object.assign(el9.style, {
          color: 'var(--red)',
          fontSize: '12px',
          fontWeight: '600',
          lineHeight: '1.4',
        }));
      const el10 = document.createElement('span');
      return (
        (el10.textContent = String(value44 || videoResultRenderText('generationFailed'))),
        Object.assign(el10.style, {
          color: 'var(--white-50)',
          fontSize: '11px',
          lineHeight: '1.5',
          wordBreak: 'break-word',
          maxWidth: '100%',
        }),
        el7.appendChild(el8),
        el7.appendChild(el9),
        el7.appendChild(el10),
        el7
      );
    }
    ['_formatDreaminaElapsed'](value45) {
      const value46 = Math.max(0, Math.floor(Number(value45 || 0) / 1000)),
        minutes = Math.floor(value46 / 60),
        seconds = value46 % 60;
      if (minutes > 0)
        return videoResultRenderText('elapsedMinutesSeconds', {
          minutes: minutes,
          seconds: String(seconds).padStart(2, '0'),
        });
      return videoResultRenderText('elapsedSeconds', { seconds: seconds });
    }
    async ['_loadAndDisplayVideo']() {
      const nodeData = store.getState().nodes?.[this.nodeId] || this._data || {};
      if (this._rendererMediaDeferred === true) {
        ((this._deferredVideoViewRefreshPending = true), this._showDeferredVideoPosterPreview());
        return;
      }
      // 每轮渲染先对账缓存：失活 thumbId 的 objectURL 在此统一撤销。
      ((this._videoRenderEpoch = Number(this._videoRenderEpoch || 0) + 1),
        this._syncCachedVideoObjectUrls(nodeData));
      this._removeDeferredVideoPosterPreview();
      const videoUrl = this._data.videos || [];
      videoUrl.length === 0 &&
        (this._data.videoUrl || this._data.localPath || this._data.thumbId) &&
        videoUrl.push({
          videoUrl: this._data.videoUrl,
          thumbId: this._data.thumbId,
          localPath: this._data.localPath,
        });
      const value47 = (this._data.rhStatusMessage || '').trim(),
        value48 = this._data.rhStatusCode,
        value49 = this._getGenerationFailureMessage(this._data);
      if (value49 && videoUrl.length === 0) {
        ((this._videoSourceAttachToken = Number(this._videoSourceAttachToken || 0) + 1),
          this._releaseLocalVideoPlaybackObjectUrl());
        this.videoEl &&
          ((this.videoEl.style.display = 'none'),
          this.videoEl.removeAttribute?.('src'),
          this.videoEl.load?.());
        ((this._placeholderEl.style.display = 'none'), this._setVideoOverlaysVisible(false));
        this._multiVideosContainer &&
          (this._multiVideosContainer.remove(), (this._multiVideosContainer = null));
        const el11 = this._ensureStatusOverlayEl();
        (clearElement(el11), el11.appendChild(this._createErrorCard(value49)));
        return;
      }
      if (value47 && videoUrl.length === 0) {
        ((this._videoSourceAttachToken = Number(this._videoSourceAttachToken || 0) + 1),
          this._releaseLocalVideoPlaybackObjectUrl());
        this.videoEl &&
          ((this.videoEl.style.display = 'none'),
          this.videoEl.removeAttribute?.('src'),
          this.videoEl.load?.());
        ((this._placeholderEl.style.display = 'none'), this._setVideoOverlaysVisible(false));
        this._multiVideosContainer &&
          (this._multiVideosContainer.remove(), (this._multiVideosContainer = null));
        const el12 = this._ensureStatusOverlayEl();
        (clearElement(el12), el12.appendChild(this._createStatusCard(value47, value48)));
        return;
      }
      this._clearStatusOverlay();
      const count9 = videoUrl.length;
      if (count9 === 0) {
        ((this._videoSourceAttachToken = Number(this._videoSourceAttachToken || 0) + 1),
          this._releaseLocalVideoPlaybackObjectUrl());
        this.videoEl &&
          ((this.videoEl.style.display = 'none'),
          this.videoEl.removeAttribute?.('src'),
          this.videoEl.load?.());
        ((this._placeholderEl.style.display = 'flex'), this._setVideoOverlaysVisible(false));
        this._multiVideosContainer &&
          (this._multiVideosContainer.remove(), (this._multiVideosContainer = null));
        return;
      }
      const value50 = this._data.mainVideoIndex || 0,
        value51 = count9 > 1,
        enabled20 = value51 && !!this._data.isVideosExpanded,
        value52 = Math.max(0, Math.min(count9 - 1, Math.trunc(Number(value50) || 0))),
        value53 =
          videoUrl[Math.max(0, Math.min(count9 - 1, Math.trunc(Number(value50) || 0)))] ||
          videoUrl[0] ||
          null,
        enabled21 = !!String(value53?.error || '').trim(),
        enabled22 = this._isVideoMarkedUnavailable(value53),
        value54 = this._resolveVideoMetaSrcFromVideoData(value53);
      if (value54 && !enabled22 && !enabled21) this._maybeFetchVideoMeta(value54);
      const run = (count10, value55) => {
          if (this._isVideoMarkedUnavailable(value55)) return;
          const videoThumbSrc = this._resolveVideoMetaSrcFromVideoData(value55);
          if (!videoThumbSrc) return;
          if (!(videoThumbSrc.startsWith('/output/') || videoThumbSrc.startsWith('/data/'))) return;
          if (this._isVideoThumbMarkedUnavailable(value55, videoThumbSrc)) return;
          const value56 = store.getState().nodes?.[this.nodeId] || {},
            value57 =
              ['waiting', 'processing'].includes(String(value56.mediaTaskStatus || '')) &&
              ['videoFirstFrame', 'videoPoster'].includes(String(value56.mediaTaskKind || ''));
          if (String(value55?.videoThumbSrc || '').trim() === videoThumbSrc) {
            if (String(value55?.thumbUrl || '').trim() || value57) return;
          }
          const value58 = 'out|' + this.nodeId + '|' + count10 + '|' + videoThumbSrc;
          if (this._videoThumbPending.has(value58)) return;
          this._videoThumbPending.add(value58);
          const value59 = store.getState().nodes?.[this.nodeId],
            list4 = Array.isArray(value59?.videos) ? value59.videos : [];
          if (count10 >= 0 && count10 < list4.length) {
            const args4 = list4[count10];
            if (
              args4 &&
              typeof args4 === 'object' &&
              String(args4.videoThumbSrc || '').trim() !== videoThumbSrc
            ) {
              const videos = list4.slice();
              ((videos[count10] = { ...args4, videoThumbSrc: videoThumbSrc }),
                store.updateNodeData(this.nodeId, { videos: videos }));
            }
          }
          api
            .fetchVideoFirstFrameThumbFromServer(videoThumbSrc, {
              nodeId: this.nodeId,
              assetId: String(value55?.assetId || value55?.thumbId || ''),
            })
            .then((response) => {
              const enabled23 = String(response?.thumbUrl || response?.url || '').trim();
              if (!enabled23) return;
              const value60 = store.getState(),
                enabled24 = value60.nodes?.[this.nodeId];
              if (!enabled24) return;
              const list5 = Array.isArray(enabled24.videos) ? enabled24.videos : [];
              if (!(count10 >= 0 && count10 < list5.length)) return;
              const args5 = list5[count10];
              if (!args5 || typeof args5 !== 'object') return;
              const value61 = {
                ...args5,
                videoThumbSrc: videoThumbSrc,
                videoThumbUnavailableSource: '',
              };
              if (!String(value61.thumbUrl || '').trim() && enabled23) value61.thumbUrl = enabled23;
              const videos2 = list5.slice();
              videos2[count10] = value61;
              const value62 = { videos: videos2 },
                value63 = Number(enabled24.mainVideoIndex),
                value64 = Number.isFinite(value63) ? Math.max(0, Math.trunc(value63)) : 0;
              if (count10 === value64) value62.videoThumbUnavailableSource = '';
              if (count10 === value64) {
                if (!String(enabled24.thumbUrl || '').trim() && enabled23)
                  value62.thumbUrl = enabled23;
              }
              store.updateNodeData(this.nodeId, value62);
            })
            .catch(() => {
              const value65 = store.getState().nodes?.[this.nodeId] || this._data || {},
                value66 = Array.isArray(value65.videos) ? value65.videos : [],
                value67 = value66[count10] || value55 || {},
                value68 = this._resolveVideoMetaSrcFromVideoData(value67);
              value68 === videoThumbSrc &&
                this._markVideoThumbUnavailable(count10, value67, videoThumbSrc);
            })
            .finally(() => {
              this._videoThumbPending.delete(value58);
            });
        },
        value69 = videoUrl
          .map(
            (item2) =>
              (item2.videoUrl || '') +
              '|' +
              (item2.localPath || '') +
              '|' +
              (item2.displayLocalPath || '') +
              '|' +
              (item2.thumbId || '') +
              '|' +
              (item2.error || '')
          )
          .join('||'),
        value70 = value69 !== this._lastVideosKeyStr,
        value71 = value50 !== this._lastMainIdx,
        value72 = enabled20 !== this._lastIsExpanded,
        enabled25 = !this._expandPanel || value70 || value71 || value72;
      ((this._lastVideosKeyStr = value69),
        (this._lastMainIdx = value50),
        (this._lastIsExpanded = enabled20));
      !this._multiVideosContainer &&
        ((this._multiVideosContainer = document.createElement('div')),
        Object.assign(this._multiVideosContainer.style, {
          position: 'absolute',
          inset: '0',
          width: '100%',
          height: '100%',
        }),
        this.previewEl.appendChild(this._multiVideosContainer));
      const value73 = String(this._data.thumbUrl || '').trim(),
        url4 = new Array(count9).fill(''),
        enabled26 = new Array(count9).fill(''),
        list6 = [];
      for (let i = 0; i < count9; i++) {
        const value74 = videoUrl[i] || {},
          enabled27 = this._isVideoMarkedUnavailable(value74),
          value75 = enabled27
            ? ''
            : String(value74.thumbUrl || '').trim() || (i === value52 ? value73 : '');
        if (value75) enabled26[i] = this._resolveMediaUrl(value75);
        const value76 = i === value52,
          value77 = enabled20 || (!isDesktopRenderer() && value76 && !enabled26[i]);
        if (value77 && !enabled27) {
          let enabled28 = this._resolveVideoPlaybackUrl(value74);
          if (!enabled28 && value74.thumbId) {
            const thumbId = String(value74.thumbId || ''),
              value78 = thumbId ? this._cachedVideoUrls.get(thumbId) : '';
            if (value78) enabled28 = value78;
            else list6.push({ i: i, thumbId: thumbId });
          }
          url4[i] = enabled28;
        }
      }
      const value79 = enabled21 || (!enabled22 && (!!url4[value52] || !!enabled26[value52]));
      ((this._placeholderEl.style.display = value79 ? 'none' : 'flex'),
        this._setVideoOverlaysVisible(!enabled21 && value79 && !enabled20));
      if (!enabled21 && enabled26[value52]) ensureThumbDecoded(enabled26[value52]);
      else {
        if (!enabled21) run(value52, value53);
      }
      const run2 = (mainVideoIndex) => {
          if (this._isExpandedPickClosing) return;
          this._isExpandedPickClosing = true;
          const list7 = this._root.querySelectorAll('.multi-flyout-panel > div'),
            handler = () => {
              const enabled29 = videoUrl[mainVideoIndex];
              if (!enabled29 || typeof enabled29 !== 'object') return { w: 0, h: 0, d: 0 };
              const value80 = Number(enabled29.videoWidth || 0),
                value81 = Number(enabled29.videoHeight || 0),
                d = Number(enabled29.duration);
              return {
                w: Number.isFinite(value80) ? value80 : 0,
                h: Number.isFinite(value81) ? value81 : 0,
                d: d,
              };
            },
            handler2 = () => {
              const value82 = handler(),
                value83 = {
                  mainVideoIndex: mainVideoIndex,
                  isVideosExpanded: false,
                  videoUrl: videoUrl[mainVideoIndex].videoUrl,
                  localPath: videoUrl[mainVideoIndex].localPath,
                  displayLocalPath: videoUrl[mainVideoIndex].displayLocalPath || '',
                  thumbId: videoUrl[mainVideoIndex].thumbId,
                };
              value82.w > 0 &&
                value82.h > 0 &&
                ((value83.selectedVideoWidth = value82.w),
                (value83.selectedVideoHeight = value82.h),
                (value83.videoWidth = value82.w),
                (value83.videoHeight = value82.h));
              if (Number.isFinite(value82.d) && value82.d > 0) value83.videoDuration = value82.d;
              return value83;
            };
          if (list7.length > 0) {
            const value84 = this.previewEl.offsetTop,
              value85 = 0,
              value86 = value84;
            (list7.forEach((el13) => {
              ((el13.style.transition = 'all 0.35s cubic-bezier(0.6, -0.28, 0.735, 0.045)'),
                (el13.style.opacity = '0'),
                (el13.style.transform = 'scale(0.01) rotate(-45deg)'),
                (el13.style.filter = 'blur(10px)'),
                (el13.style.top = value86 + 'px'),
                (el13.style.left = value85 + 'px'));
            }),
              setTimeout(() => {
                (store.updateNodeData(this.nodeId, handler2()),
                  (this._isExpandedPickClosing = false));
              }, 350));
          } else
            (store.updateNodeData(this.nodeId, handler2()), (this._isExpandedPickClosing = false));
        },
        handler3 = (el14, value87) => {
          const value88 = {
              bg: 'var(--black-45)',
              color: 'var(--white-90)',
              border: '1px solid var(--white-15)',
            },
            value89 = {
              bg: 'var(--black-70)',
              color: 'var(--white-80)',
              border: '1px solid transparent',
            },
            value90 = value87 ? value89 : value88;
          ((el14.innerHTML = value87
            ? '<span>' +
              count9 +
              ' 个</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>'
            : '<span>' +
              count9 +
              ' 个</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'),
            (el14.style.background = value90.bg),
            (el14.style.color = value90.color),
            (el14.style.border = value90.border));
        };
      if (value70 || !this._multiStackWrap) {
        (clearElement(this._multiVideosContainer),
          (this._multiLayerEls = []),
          (this._multiErrorEls = []),
          (this._multiToggleBtn = null),
          (this._multiStackWrap = document.createElement('div')),
          Object.assign(this._multiStackWrap.style, {
            position: 'relative',
            width: '100%',
            height: '100%',
          }));
        for (let count11 = count9 - 1; count11 >= 0; count11--) {
          const el15 = document.createElement('video');
          el15.dataset.idx = String(count11);
          if (enabled26[count11]) el15.poster = enabled26[count11];
          const value91 = count11 === value52 && !enabled26[count11];
          if (value91 && url4[count11]) el15.src = url4[count11];
          ((el15.autoplay = false),
            (el15.loop = false),
            (el15.muted = true),
            (el15.playsInline = true),
            (el15.preload = value91 ? 'auto' : enabled26[count11] ? 'none' : 'metadata'),
            (el15.draggable = false),
            el15.addEventListener('dragstart', (event) => event.preventDefault()),
            (el15.style.position = 'absolute'),
            (el15.style.top = '0'),
            (el15.style.left = '0'),
            (el15.style.width = '100%'),
            (el15.style.height = '100%'),
            (el15.style.objectFit = 'contain'),
            (el15.style.borderRadius = '8px'),
            (el15.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'),
            (el15.style.transformOrigin = 'top left'),
            el15.classList.add('v2-media-preview'),
            this._attachPreviewVideoRecovery(el15, 'preview'));
          const run3 = () => {
              const value92 = store.getState().nodes[this.nodeId] || this._data || {},
                value93 = Number(value92.mainVideoIndex) || 0,
                value94 = Math.max(0, Math.trunc(value93));
              return count11 === value94;
            },
            handler4 = (count12, count13, count14) => {
              const enabled30 = store.getState().nodes[this.nodeId];
              if (!enabled30) return;
              const list8 = Array.isArray(enabled30.videos) ? enabled30.videos : [],
                args6 = list8[count11] || null;
              if (!args6 || typeof args6 !== 'object') return;
              const value95 = { ...args6 };
              let enabled31 = false;
              count12 > 0 &&
                Number(value95.videoWidth || 0) !== count12 &&
                ((value95.videoWidth = count12), (enabled31 = true));
              count13 > 0 &&
                Number(value95.videoHeight || 0) !== count13 &&
                ((value95.videoHeight = count13), (enabled31 = true));
              Number.isFinite(count14) &&
                count14 > 0 &&
                Number(value95.duration || 0) !== count14 &&
                ((value95.duration = count14), (enabled31 = true));
              if (!enabled31) return;
              const videos3 = list8.slice();
              videos3[count11] = value95;
              const value96 = { videos: videos3 };
              if (run3()) {
                if (count12 > 0 && Number(enabled30.videoWidth || 0) !== count12)
                  value96.videoWidth = count12;
                if (count13 > 0 && Number(enabled30.videoHeight || 0) !== count13)
                  value96.videoHeight = count13;
                if (count12 > 0 && Number(enabled30.selectedVideoWidth || 0) !== count12)
                  value96.selectedVideoWidth = count12;
                if (count13 > 0 && Number(enabled30.selectedVideoHeight || 0) !== count13)
                  value96.selectedVideoHeight = count13;
                if (
                  Number.isFinite(count14) &&
                  count14 > 0 &&
                  Number(enabled30.videoDuration || 0) !== count14
                )
                  value96.videoDuration = count14;
              }
              store.updateNodeData(this.nodeId, value96);
            };
          (el15.addEventListener('loadedmetadata', () => {
            this._clearVideoUnavailable(count11, videoUrl[count11]);
            const value97 = el15.videoWidth || 0,
              value98 = el15.videoHeight || 0,
              value99 = Number(el15.duration);
            handler4(value97, value98, value99);
            if (run3()) this._syncVideoControlsFromVideo(el15);
          }),
            el15.addEventListener('error', () => {
              const value100 = store.getState().nodes[this.nodeId] || this._data || {},
                value101 = Array.isArray(value100.videos) ? value100.videos : [],
                value102 = value101[count11] || videoUrl[count11] || {},
                value103 = Number(value100.mainVideoIndex),
                value104 = Number.isFinite(value103) ? Math.max(0, Math.trunc(value103)) : 0;
              if (count11 === value104) {
                (el15.removeAttribute('poster'), el15.removeAttribute('src'));
                try {
                  el15.load?.();
                } catch {}
                ((this._placeholderEl.style.display = 'flex'),
                  this._setVideoOverlaysVisible(false),
                  this._hideCenterIndicator(),
                  this._syncVideoControlsFromVideo(null));
              }
              this._markVideoUnavailable(count11, value102);
            }),
            el15.addEventListener('timeupdate', () => {
              if (run3()) this._syncVideoControlsFromVideo(el15);
            }),
            el15.addEventListener('pause', () => {
              run3() && (this._showPausedCenterIndicator(), this._syncVideoControlsFromVideo(el15));
            }),
            el15.addEventListener('play', () => {
              run3() && (this._hideCenterIndicator(), this._syncVideoControlsFromVideo(el15));
            }),
            el15.addEventListener('ended', () => {
              run3() && (this._showPausedCenterIndicator(), this._syncVideoControlsFromVideo(el15));
            }),
            el15.addEventListener('click', (event2) => {
              const value105 = store.getState().nodes[this.nodeId];
              if (value105.isVideosExpanded) {
                (event2.stopPropagation(), run2(this._lastMainIdx || 0));
                return;
              }
              if (event2.detail && event2.detail > 1) return;
              event2.stopPropagation();
              if (VideoKeyingController.isActiveFor(this.nodeId)) return;
              if (this._videoClickTimer) clearTimeout(this._videoClickTimer);
              this._videoClickTimer = setTimeout(() => {
                this._videoClickTimer = null;
                const value106 = store.getState().nodes[this.nodeId];
                if (value106?.isVideosExpanded) return;
                if (VideoKeyingController.isActiveFor(this.nodeId)) return;
                this._toggleVideoPlayPause(el15);
              }, 180);
            }),
            el15.addEventListener('dblclick', (event3) => {
              event3.stopPropagation();
              if (VideoKeyingController.isActiveFor(this.nodeId)) return;
              this._videoClickTimer &&
                (clearTimeout(this._videoClickTimer), (this._videoClickTimer = null));
              const value107 = this._lastMainIdx || 0,
                value108 = store.getState().nodes[this.nodeId],
                value109 = value108.videos || [],
                value110 = value109[value107] || value109[0];
              void this._openFullScreenFromVideo(value110, el15);
            }));
          if (videoUrl[count11].error) {
            const el16 = this._createErrorCard(videoUrl[count11].error);
            ((el16.style.position = 'absolute'),
              (el16.style.inset = '0'),
              (this._multiErrorEls[count11] = el16),
              this._multiStackWrap.appendChild(el16));
          } else ((this._multiLayerEls[count11] = el15), this._multiStackWrap.appendChild(el15));
        }
        if (list6.length > 0) {
          const value111 = ++this._blobResolveToken;
          for (const value112 of list6) {
            const value113 = value112.i,
              enabled32 = String(value112.thumbId || '');
            if (!enabled32) continue;
            if (this._cachedVideoUrls.has(enabled32)) continue;
            getImage(enabled32)
              .then((enabled33) => {
                if (value111 !== this._blobResolveToken) return;
                if (!enabled33) return;
                const value114 = URL.createObjectURL(enabled33);
                this._cachedVideoUrls.set(enabled32, value114);
                const el17 = this._multiLayerEls?.[value113];
                if (!el17 || !el17.isConnected) return;
                if (!(enabled20 || value113 === value52)) return;
                el17.src = value114;
                try {
                  el17.load?.();
                } catch {}
                value113 === value52 &&
                  this._placeholderEl &&
                  this._placeholderEl.style.display !== 'none' &&
                  ((this._placeholderEl.style.display = 'none'),
                  this._setVideoOverlaysVisible(true));
              })
              .catch(() => {});
          }
        }
        (value51 &&
          ((this._multiToggleBtn = document.createElement('div')),
          (this._multiToggleBtn.className = 'multi-toggle-btn'),
          Object.assign(this._multiToggleBtn.style, {
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 1005,
            padding: '6px 12px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            userSelect: 'none',
            fontSize: '15px',
            fontWeight: '500',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
          }),
          this._multiToggleBtn.addEventListener('pointerdown', (event4) => {
            if (event4.button !== 0) return;
            (event4.preventDefault(), event4.stopPropagation());
            const enabled34 = store.getState().nodes[this.nodeId],
              value115 = !!enabled34.isVideosExpanded;
            if (value115) {
              const list9 = this._root.querySelectorAll('.multi-flyout-panel > div');
              if (list9.length > 0) {
                const value116 = this.previewEl.offsetTop,
                  value117 = 0,
                  value118 = value116;
                (list9.forEach((el18) => {
                  ((el18.style.transition = 'all 0.35s cubic-bezier(0.6, -0.28, 0.735, 0.045)'),
                    (el18.style.opacity = '0'),
                    (el18.style.transform = 'scale(0.01) rotate(-45deg)'),
                    (el18.style.filter = 'blur(10px)'),
                    (el18.style.top = value118 + 'px'),
                    (el18.style.left = value117 + 'px'));
                }),
                  setTimeout(() => {
                    store.updateNodeData(this.nodeId, { isVideosExpanded: false });
                  }, 350));
              } else store.updateNodeData(this.nodeId, { isVideosExpanded: false });
            } else store.updateNodeData(this.nodeId, { isVideosExpanded: true });
          }),
          this._multiToggleBtn.addEventListener('mouseenter', () =>
            handler3(this._multiToggleBtn, true)
          ),
          this._multiToggleBtn.addEventListener('mouseleave', () => {
            const enabled35 = store.getState().nodes[this.nodeId];
            handler3(this._multiToggleBtn, !!enabled35.isVideosExpanded);
          }),
          this._multiToggleBtn.addEventListener('click', (event5) => {
            (event5.preventDefault(), event5.stopPropagation());
          }),
          this._multiStackWrap.appendChild(this._multiToggleBtn)),
          this._multiVideosContainer.appendChild(this._multiStackWrap));
      }
      this._multiToggleBtn && handler3(this._multiToggleBtn, enabled20);
      this._applyMuteStateToPreviewVideos();
      for (let value119 = 0; value119 < count9; value119++) {
        const enabled36 = value119 === value50,
          el19 = this._multiLayerEls[value119],
          el20 = this._multiErrorEls[value119];
        if (el19) {
          const enabled37 = url4[value119] || '',
            enabled38 = enabled26[value119] || '',
            enabled39 = String(el19.getAttribute('src') || '').trim(),
            value120 = enabled36 && (!enabled38 || !!enabled39),
            preload = value120 ? 'auto' : enabled38 ? 'none' : 'metadata';
          if (enabled38 && el19.poster !== enabled38) el19.poster = enabled38;
          if (el19.preload !== preload) {
            el19.preload = preload;
            if (
              preload === 'auto' &&
              enabled39 &&
              el19.paused &&
              !this._isHovered &&
              !this._isManualControl &&
              Number(el19.readyState || 0) < 2
            )
              try {
                el19.load?.();
              } catch {}
          }
          if (value120) {
            !enabled36 &&
              enabled38 &&
              !enabled37 &&
              enabled39 &&
              el19.paused &&
              !this._isHovered &&
              !this._isManualControl &&
              (el19.removeAttribute('src'), el19.load?.());
            if (
              enabled37 &&
              enabled39 !== enabled37 &&
              !isMediaElementPlaybackSource(el19, enabled37)
            )
              await attachMediaElementPlaybackSource(el19, enabled37, {
                preload: preload,
                warmRanges: false,
                load: false,
              });
            else {
              if (!enabled37 && !enabled39 && !enabled38) {
                const value121 = videoUrl[value119] || {},
                  value122 = String(value121.thumbId || '');
                if (value122 && (enabled20 || value119 === value52)) {
                  if (this._cachedVideoUrls.has(value122))
                    el19.src = this._cachedVideoUrls.get(value122);
                  else {
                    const value123 = ++this._blobResolveToken;
                    getImage(value122)
                      .then((enabled40) => {
                        if (value123 !== this._blobResolveToken) return;
                        if (!enabled40) return;
                        const value124 = URL.createObjectURL(enabled40);
                        this._cachedVideoUrls.set(value122, value124);
                        if (!el19.isConnected) return;
                        el19.src = value124;
                        try {
                          el19.load?.();
                        } catch {}
                        value119 === value52 &&
                          this._placeholderEl &&
                          this._placeholderEl.style.display !== 'none' &&
                          ((this._placeholderEl.style.display = 'none'),
                          this._setVideoOverlaysVisible(!enabled20));
                      })
                      .catch(() => {});
                  }
                }
              }
            }
          } else enabled39 && (el19.removeAttribute('src'), el19.load?.());
          ((el19.style.display = enabled36 ? 'block' : 'none'),
            (el19.style.pointerEvents = enabled36 ? '' : 'none'),
            enabled36 &&
              ((el19.style.transform = 'rotate(0deg) scale(1)'),
              (el19.style.opacity = '1'),
              (el19.style.zIndex = count9 + 1),
              (el19.style.boxShadow = '0 4px 12px var(--black-40)')));
        }
        el20 &&
          ((el20.style.display = enabled36 ? 'flex' : 'none'),
          (el20.style.zIndex = enabled36 ? count9 + 1 : value119));
      }
      const value125 = this._multiLayerEls[value50];
      if (value125) {
        const count15 = value125.videoWidth || 0,
          count16 = value125.videoHeight || 0,
          count17 = Number(value125.duration),
          value126 = store.getState().nodes[this.nodeId];
        if (value126) {
          const value127 = {};
          if (count15 > 0 && Number(value126.videoWidth || 0) !== count15)
            value127.videoWidth = count15;
          if (count16 > 0 && Number(value126.videoHeight || 0) !== count16)
            value127.videoHeight = count16;
          if (count15 > 0 && Number(value126.selectedVideoWidth || 0) !== count15)
            value127.selectedVideoWidth = count15;
          if (count16 > 0 && Number(value126.selectedVideoHeight || 0) !== count16)
            value127.selectedVideoHeight = count16;
          if (
            Number.isFinite(count17) &&
            count17 > 0 &&
            Number(value126.videoDuration || 0) !== count17
          )
            value127.videoDuration = count17;
          if (Object.keys(value127).length) store.updateNodeData(this.nodeId, value127);
        }
      }
      if (value125 && value125.paused) this._showPausedCenterIndicator();
      else this._hideCenterIndicator();
      this._syncVideoControlsFromVideo(value125 || null);
      if (enabled20) {
        ((this._root.style.position = 'relative'),
          this._root.style.setProperty('overflow', 'visible', 'important'));
        if (!enabled25) return;
        const count18 = count9 <= 2 ? count9 : 2,
          count19 = Math.ceil(count9 / count18),
          value128 = 12,
          width = this.previewEl.offsetWidth,
          height = this.previewEl.offsetHeight,
          value129 = this.previewEl.offsetTop,
          value130 = count19 - 1,
          value131 = 0,
          list10 = [];
        for (let origIdx = 0; origIdx < count9; origIdx++) {
          if (origIdx !== value50)
            list10.push({ video: videoUrl[origIdx], url: url4[origIdx], origIdx: origIdx });
        }
        this._expandPanel &&
          this._expandPanel.parentNode &&
          this._expandPanel.parentNode.removeChild(this._expandPanel);
        ((this._expandPanel = document.createElement('div')),
          (this._expandPanel.className = 'multi-flyout-panel'),
          Object.assign(this._expandPanel.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '0',
            height: '0',
            zIndex: '12000',
            pointerEvents: 'none',
          }));
        const list11 = [];
        for (let r = 0; r < count19; r++) {
          for (let c = 0; c < count18; c++) {
            if (r === value130 && c === value131) continue;
            list11.push({ r: r, c: c });
          }
        }
        count19 === 2 &&
          count18 === 2 &&
          ((list11.length = 0),
          list11.push({ r: 1, c: 1 }),
          list11.push({ r: 0, c: 0 }),
          list11.push({ r: 0, c: 1 }));
        for (let value132 = 0; value132 < list10.length; value132++) {
          if (value132 >= list11.length) break;
          const value133 = list11[value132].r,
            value134 = list11[value132].c,
            { video: video, url: url5, origIdx: origIdx2 } = list10[value132],
            value135 = value129 + (value133 - value130) * (height + value128),
            value136 = value134 * (width + value128),
            top = value129,
            left = 0,
            el21 = document.createElement('div');
          (Object.assign(el21.style, {
            position: 'absolute',
            top: top + 'px',
            left: left + 'px',
            width: width + 'px',
            height: height + 'px',
            cursor: 'pointer',
            overflow: 'hidden',
            borderRadius: '18px',
            border: '1px solid var(--white-10)',
            backgroundColor: 'var(--white-05)',
            boxShadow: '0 20px 60px var(--black-80)',
            backdropFilter: 'blur(20px)',
            pointerEvents: 'auto',
            opacity: '0',
            transform: 'scale(0.2) rotate(-30deg)',
            filter: 'blur(8px)',
            transformOrigin: 'bottom left',
            transition: 'all 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.27), filter 0.4s ease-out',
            zIndex: String(12000 - value132),
          }),
            (el21.style.pointerEvents = 'auto'),
            requestAnimationFrame(() => {
              setTimeout(() => {
                ((el21.style.opacity = '1'),
                  (el21.style.top = value135 + 'px'),
                  (el21.style.left = value136 + 'px'),
                  (el21.style.transform = 'scale(1) rotate(0deg)'),
                  (el21.style.filter = 'blur(0px)'));
              }, value132 * 60);
            }));
          if (video.error) {
            const value137 = this._createErrorCard(video.error);
            el21.appendChild(value137);
          } else {
            const el22 = document.createElement('video');
            (Object.assign(el22.style, { width: '100%', height: '100%', objectFit: 'cover' }),
              (el22.dataset.idx = String(origIdx2)),
              (el22.autoplay = false),
              (el22.loop = false),
              (el22.muted = true),
              (el22.playsInline = true));
            const value138 = enabled26[origIdx2] || '';
            if (value138) ((el22.poster = value138), (el22.preload = 'none'));
            else {
              el22.preload = url5 ? 'metadata' : 'none';
              if (url5) el22.src = url5;
            }
            (attachVideoPlaybackRecovery(el22, {
              label: 'ai-video:' + this.nodeId + ':expanded:' + origIdx2,
              ensureSrc: () => this._ensureVideoSrcFor(el22, { forPlayback: true }),
              shouldRecover: () => el22.isConnected !== false && !el22.paused,
            }),
              el21.appendChild(el22));
          }
          const value139 = (event6) => {
            if (event6.type === 'pointerdown' && event6.button !== 0) return;
            (event6.preventDefault(), event6.stopPropagation(), run2(origIdx2));
          };
          (el21.addEventListener('pointerdown', value139),
            el21.addEventListener('click', value139),
            el21.addEventListener('dblclick', (event7) => {
              (event7.preventDefault(), event7.stopPropagation());
            }),
            this._expandPanel.appendChild(el21));
        }
        this._root.appendChild(this._expandPanel);
      } else
        this._expandPanel &&
          this._expandPanel.parentNode &&
          (this._expandPanel.parentNode.removeChild(this._expandPanel), (this._expandPanel = null));
    }
    ['_resolveVideoDataPlaybackUrl'](enabled41) {
      if (!enabled41) return '';
      return (
        this._resolveMediaUrl(localPathToUrl(enabled41.displayLocalPath)) ||
        this._resolveMediaUrl(localPathToUrl(enabled41.localPath)) ||
        this._resolveMediaUrl(enabled41.videoUrl) ||
        ''
      );
    }
    async ['_openFullScreenFromVideo'](value140, controls = null) {
      const el23 = document.createElement('div');
      Object.assign(el23.style, {
        position: 'fixed',
        inset: '0',
        background: 'var(--overlay-preview)',
        zIndex: '99999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
      });
      const videoCurrentSource = getVideoCurrentSource(controls);
      if (controls && videoCurrentSource) {
        const el24 = controls.parentNode,
          value141 = controls.nextSibling,
          value142 = this._isManualControl,
          value143 = this._hoverManualPause,
          position = {
            controls: controls.controls,
            loop: controls.loop,
            muted: controls.muted,
            position: controls.style.position,
            top: controls.style.top,
            left: controls.style.left,
            width: controls.style.width,
            height: controls.style.height,
            maxWidth: controls.style.maxWidth,
            maxHeight: controls.style.maxHeight,
            objectFit: controls.style.objectFit,
            borderRadius: controls.style.borderRadius,
            pointerEvents: controls.style.pointerEvents,
            transform: controls.style.transform,
            opacity: controls.style.opacity,
            zIndex: controls.style.zIndex,
            boxShadow: controls.style.boxShadow,
          };
        ((this._isManualControl = true),
          (this._hoverManualPause = false),
          (controls.controls = true),
          (controls.loop = true),
          (controls.muted = !!this._isMuted),
          Object.assign(controls.style, {
            position: 'static',
            top: '',
            left: '',
            width: 'auto',
            height: 'auto',
            maxWidth: '90%',
            maxHeight: '90%',
            objectFit: 'contain',
            borderRadius: '8px',
            pointerEvents: 'auto',
            transform: 'none',
            opacity: '1',
            zIndex: '',
            boxShadow: '0 0 50px var(--black-95)',
          }),
          attachVideoPlaybackRecovery(controls, {
            label: 'ai-video:' + this.nodeId + ':fullscreen',
            minBufferAhead: 0.5,
            readyTimeoutMs: 350,
            recoveryDebounceMs: 150,
            recoveryCooldownMs: 500,
            shouldRecover: () => controls.isConnected !== false && !controls.paused,
          }));
        let value144 = false;
        const run4 = () => {
          if (value144) return;
          value144 = true;
          try {
            controls.pause();
          } catch {}
          ((controls.controls = position.controls),
            (controls.loop = position.loop),
            (controls.muted = position.muted),
            Object.assign(controls.style, {
              position: position.position,
              top: position.top,
              left: position.left,
              width: position.width,
              height: position.height,
              maxWidth: position.maxWidth,
              maxHeight: position.maxHeight,
              objectFit: position.objectFit,
              borderRadius: position.borderRadius,
              pointerEvents: position.pointerEvents,
              transform: position.transform,
              opacity: position.opacity,
              zIndex: position.zIndex,
              boxShadow: position.boxShadow,
            }));
          if (el24) el24.insertBefore(controls, value141);
          (el23.remove(),
            (this._isManualControl = value142),
            (this._hoverManualPause = value143),
            this._attachPreviewVideoRecovery(controls, 'preview'));
        };
        (el23.addEventListener('click', (event8) => {
          if (event8.target === el23) run4();
        }),
          el23.appendChild(controls),
          document.body.appendChild(el23),
          void playVideoWithRecovery(controls, {
            label: 'ai-video:' + this.nodeId + ':fullscreen',
            minBufferAhead: 0.5,
            readyTimeoutMs: 350,
            recoveryDebounceMs: 150,
            recoveryCooldownMs: 500,
            shouldRecover: () => controls.isConnected !== false && !controls.paused,
          }));
        return;
      }
      const el25 = document.createElement('video');
      let value145 = '';
      const value146 = this._resolveVideoDataPlaybackUrl(value140),
        value147 = String(value140?.thumbId || ''),
        count20 = Number(controls?.currentTime || 0),
        handler5 = () => {
          if (!(count20 > 0)) return;
          const count21 = Number(el25.duration),
            value148 =
              Number.isFinite(count21) && count21 > 0
                ? Math.min(count20, Math.max(0, count21 - 0.05))
                : count20;
          try {
            el25.currentTime = value148;
          } catch {}
        };
      el25.addEventListener('loadedmetadata', handler5, { once: true });
      const value149 = videoCurrentSource || value146;
      if (value149)
        await attachMediaElementPlaybackSource(el25, value149, {
          preload: 'auto',
          warmRanges: false,
          load: false,
        });
      else
        value147 &&
          getImage(value147).then((value150) => {
            value150 &&
              ((value145 = URL.createObjectURL(value150)),
              (el25.src = value145),
              handler5(),
              void playVideoWithRecovery(el25, {
                label: 'ai-video:' + this.nodeId + ':fullscreen',
                minBufferAhead: 0.5,
                readyTimeoutMs: 350,
                recoveryDebounceMs: 150,
                recoveryCooldownMs: 500,
                shouldRecover: () => el25.isConnected !== false && !el25.paused,
              }));
          });
      (attachVideoPlaybackRecovery(el25, {
        label: 'ai-video:' + this.nodeId + ':fullscreen',
        minBufferAhead: 0.5,
        readyTimeoutMs: 350,
        recoveryDebounceMs: 150,
        recoveryCooldownMs: 500,
        shouldRecover: () => el25.isConnected !== false && !el25.paused,
      }),
        (el25.preload = 'auto'),
        (el25.controls = true),
        (el25.autoplay = true),
        (el25.loop = true),
        (el25.muted = !!this._isMuted),
        Object.assign(el25.style, {
          maxWidth: '90%',
          maxHeight: '90%',
          boxShadow: '0 0 50px var(--black-95)',
          borderRadius: '8px',
        }),
        el23.appendChild(el25));
      const run5 = () => {
        try {
          el25.pause();
        } catch {}
        el23.remove();
        if (value145) {
          try {
            URL.revokeObjectURL(value145);
          } catch {}
          value145 = '';
        }
      };
      (el23.addEventListener('click', (event9) => {
        if (event9.target === el23) run5();
      }),
        document.body.appendChild(el23),
        value149 &&
          void playVideoWithRecovery(el25, {
            label: 'ai-video:' + this.nodeId + ':fullscreen',
            minBufferAhead: 0.5,
            readyTimeoutMs: 350,
            recoveryDebounceMs: 150,
            recoveryCooldownMs: 500,
            shouldRecover: () => el25.isConnected !== false && !el25.paused,
          }));
    }
  }
  return result.prototype;
}

/**
 * 仅供单测驱动内部纯函数（结果层可见性、媒体键、呈现补丁）。
 * 运行时不要引用：随实现改。
 */
export const _resultRenderModuleInternalsForTest = {
  isVideoResultViewportBusy,
  setVideoResultElementVisible,
  isVideoResultElementVisible,
  setVideoResultLayerActive,
  applyVideoResultGeometryAnimationStyle,
  getVideoResultMediaKey,
  SELECTED_VIDEO_PRESENTATION_FIELDS,
};
