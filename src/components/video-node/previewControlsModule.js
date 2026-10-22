import { clearElement } from '../../utils/dom.js';
import {
  buildVideoFrameCaptureNodeName,
  captureVideoFrameSnapshot,
  DEFAULT_VIDEO_FRAME_CAPTURE_FPS,
  getVideoFrameSource,
  isVideoFrameReady,
  resolveVideoFrameCaptureIndex,
  startVideoFrameSnapshotPersistence,
  waitForVideoFrame,
} from '../videoFrameCapture.js';
import { t } from '../../i18n/index.js';
import {
  buildVideoMutedPatch,
  readVideoAudioDefaultEnabledFromStore,
  resolveVideoMutedPreference,
} from './videoMuteState.js';
import { isTaskFailed } from '../../core/generationTaskUiState.js';
import { shouldActivateRendererMediaHoverPlayback } from '../../core/rendererDeferredMedia.js';
import {
  isExternallyOwnedVideoPlayback,
  setHoverPlaybackChromeVisible,
  shouldKeepManualPlaybackPresentationActive,
  shouldTakeOverActiveHoverPlayback,
} from '../shared/hoverVideoPlaybackLifecycle.js';
import { startMediaProgressDragSession } from '../shared/mediaProgressDragSession.js';
import { isSegmentRetakeEditing } from '../../modules/videoRetake/segmentRetakeModelPolicy.js';

function previewControlsText(key, params = {}) {
  return t(key, params);
}

/**
 * AI 视频节点的预览层控件：静音 / 播放暂停 / 进度条 / 截帧。
 *
 * 本模块只管「预览区内那一套控件」，节点 DOM 由 AIGenVideoNode 持有。约定：
 * - 所有方法通过工厂返回的 prototype 混入节点类，`this` 是节点实例；
 * - 节点实例上的字段（`_data` / `previewEl` / `videoEl` / `_multiLayerEls` …）由节点维护，
 *   这里只读取；
 * - 悬停播放的状态机（`_isHovered` / `_previewHoverActivationPending` / `_autoPlayToken`）
 *   与进度拖拽状态（`_isProgressDragging` / `_isProgressSeeking` / `_progressSeekToken`）
 *   都在节点实例上，因为卸载清理也要用。
 */
export function createVideoNodePreviewControlsModule(index) {
  const {
    store: store,
    saveOutputBlob: saveOutputBlob,
    VideoKeyingController: VideoKeyingController,
    getAutoMediaSizeByShortSide: getAutoMediaSizeByShortSide,
    buildSourceMediaNodePayload: buildSourceMediaNodePayload,
    calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
  } = index;
  class result {
    /**
     * 注册一个「悬停播放重试」定时器。定时器集合统一登记在实例上，
     * 便于离开悬停或卸载时用 `_cancelPreviewHoverRetryTimers` 一次性清干净。
     */
    ['_schedulePreviewHoverTimer'](callback, delayMs) {
      if (typeof callback !== 'function') return null;
      const timers = this._previewHoverRetryTimers || (this._previewHoverRetryTimers = new Set());
      let timerId = null;
      return (
        (timerId = setTimeout(
          () => {
            (timers.delete(timerId), callback());
          },
          Math.max(0, Number(delayMs) || 0)
        )),
        timers.add(timerId),
        timerId
      );
    }
    ['_cancelPreviewHoverRetryTimers']() {
      const timers = this._previewHoverRetryTimers;
      if (!timers?.size) return 0;
      const count = timers.size;
      for (const timerId of timers) clearTimeout(timerId);
      return (timers.clear(), count);
    }
    /**
     * 媒体被延迟挂载时，video 元素要等 hydrate 之后才存在。
     * 这里按递增间隔轮询，一旦拿到 video 元素就补一次 `activatePreviewHoverPlayback`；
     * 期间任何一步发现悬停已结束 / 已换节点 / 元素已脱离文档，立即放弃，避免幽灵播放。
     */
    ['_schedulePreviewHoverPlaybackWhenVideoReady']({ hydrateDeferredMedia = false } = {}) {
      if (this._previewHoverActivationPending === true) return true;
      if (this.previewEl?.matches?.(':hover') !== true) return false;
      (this._cancelPreviewHoverRetryTimers(),
        (this._previewHoverActivationPending = true),
        (this._isHovered = true));
      const token = ++this._autoPlayToken,
        retryDelays = [0, 32, 96, 240, 600, 1200],
        attempt = (index) => {
          this._schedulePreviewHoverTimer(() => {
            const stillHovered = this.previewEl?.matches?.(':hover') === true;
            if (
              this._autoPlayToken !== token ||
              this._isHovered !== true ||
              this.previewEl?.isConnected === false ||
              !stillHovered
            ) {
              this._previewHoverActivationPending = false;
              return;
            }
            if (
              hydrateDeferredMedia &&
              this._rendererMediaDeferred === true &&
              typeof this.hydrateDeferredMedia === 'function'
            ) {
              this.hydrateDeferredMedia();
              // hydrate 是异步的：还没落地就再来一轮，仍在延迟态就继续等。
              if (this._rendererMediaDeferred !== true) {
                attempt(index);
                return;
              }
            }
            const videoEl = this._getActivePreviewVideoEl();
            if (videoEl) {
              ((this._previewHoverActivationPending = false),
                (this._isHovered = false),
                this.activatePreviewHoverPlayback());
              return;
            }
            index + 1 < retryDelays.length
              ? attempt(index + 1)
              : ((this._previewHoverActivationPending = false), (this._isHovered = false));
          }, retryDelays[index]);
        };
      return (attempt(0), true);
    }
    /**
     * 悬停进入：决定这一刻该不该播放，并真正启动播放。
     *
     * 返回 false 表示「本次悬停不负责播放」（任务失败、视频展开态、正在抠像、
     * 手动暂停过、正在循环播放、外部已接管…），true 表示已接管播放或已在播放。
     */
    ['activatePreviewHoverPlayback']() {
      const state =
        typeof store.getStateRaw === 'function' ? store.getStateRaw() : store.getState();
      // 低倍缩放的画布上不激活 hover 播放，避免大图里几十个视频同时播。
      if (
        !shouldActivateRendererMediaHoverPlayback({
          viewport: state?.viewport,
          nodeCount: Number.isFinite(state?._nodeCount)
            ? state._nodeCount
            : Object.keys(state?.nodes || {}).length,
          isSelected: state?.selectedNodeIds?.includes?.(this.nodeId) === true,
        })
      )
        return false;
      const videoClip = state.videoClip;
      if (videoClip && videoClip.active && videoClip.nodeId === this.nodeId) return false;
      const nodeData = state.nodes?.[this.nodeId] || this._data || {};
      if (isSegmentRetakeEditing(nodeData)) {
        (this._cancelPreviewHoverRetryTimers(),
          (this._previewHoverActivationPending = false),
          (this._isHovered = false));
        const videoEl = this._getActivePreviewVideoEl?.(),
          keepPresentation =
            this._isManualControl === true ||
            this._isManualLoopPlayback === true ||
            isExternallyOwnedVideoPlayback(videoEl);
        return (
          !keepPresentation &&
            (this._autoPlayToken++, videoEl && ((videoEl.loop = false), videoEl.pause?.())),
          this._setVideoOverlaysVisible(true, videoEl),
          false
        );
      }
      if (isTaskFailed(nodeData)) return (this._setVideoOverlaysVisible(false), false);
      if (nodeData.isVideosExpanded) return false;
      (this._cancelPreviewHoverRetryTimers(), this._hoverPlaybackLifecycle?.activate?.());
      const alreadyHovering = this._isHovered === true;
      this._isHovered = true;
      if (this._rendererMediaDeferred === true)
        return this._schedulePreviewHoverPlaybackWhenVideoReady({ hydrateDeferredMedia: true });
      typeof this.previewEl?.querySelectorAll === 'function' && this._ensurePreviewVideoOverlays();
      this._rendererDetailsDeferred !== true &&
        this._rendererThinVideoHydration === true &&
        void this.hydrateRendererThinVideoPresentation?.();
      const videoEl = this._getActivePreviewVideoEl();
      if (!videoEl) return this._schedulePreviewHoverPlaybackWhenVideoReady();
      this._setVideoOverlaysVisible(true);
      // 已经在播（或手动播放中）就只把控件亮出来，不重复 play。
      if (
        (alreadyHovering && videoEl.paused === false) ||
        shouldKeepManualPlaybackPresentationActive(this, videoEl)
      )
        return true;
      if (isExternallyOwnedVideoPlayback(videoEl)) return true;
      // 上一轮播到结尾：把播放头拨回 0，否则 Chrome 会拒绝重播。
      const duration = Number(videoEl.duration || 0),
        currentTime = Number(videoEl.currentTime || 0),
        reachedEnd =
          (videoEl.ended === true ||
            (Number.isFinite(duration) &&
              duration > 0 &&
              currentTime >= Math.max(0, duration - 0.05))) &&
          this._isPreviewPosterClearedForPlayback?.(videoEl) === true;
      if (reachedEnd)
        try {
          videoEl.currentTime = 0;
        } catch {}
      ((this._previewHoverActivationPending = false), (this._isHovered = true));
      if (VideoKeyingController.isActiveFor(this.nodeId)) return (videoEl.pause(), false);
      if (this._hoverManualPause) return false;
      if (this._isManualLoopPlayback) return false;
      videoEl.loop = true;
      const token = ++this._autoPlayToken;
      typeof this._logPreviewVideoPlaybackEvent === 'function' &&
        this._logPreviewVideoPlaybackEvent(videoEl, 'hover-enter', 'hover');
      if (typeof this._playPreviewVideoWithRecovery === 'function') {
        // 走带恢复的播放通道：play 可能被浏览器拒绝，需要重试，重试要能被后续操作取消。
        let playing = false,
          inFlight = false;
        const shouldContinue = () =>
            this._autoPlayToken === token &&
            this._isHovered === true &&
            !this._hoverManualPause &&
            !this._isManualLoopPlayback,
          playOnce = () => {
            if (!shouldContinue()) return Promise.resolve(false);
            if (inFlight || playing) return Promise.resolve(playing);
            return (
              (inFlight = true),
              Promise.resolve(
                this._playPreviewVideoWithRecovery(videoEl, {
                  reason: 'hover',
                  shouldContinue: shouldContinue,
                })
              ).then(
                (started) => {
                  return (
                    (started || (!videoEl.paused && Number(videoEl.currentTime || 0) >= 0)) &&
                      (playing = true),
                    (inFlight = false),
                    started
                  );
                },
                (error) => {
                  inFlight = false;
                  throw error;
                }
              )
            );
          },
          retryPlay = (delayMs) => {
            if (!shouldContinue()) return false;
            return (
              this._schedulePreviewHoverTimer(() => {
                if (!shouldContinue()) return;
                if (videoEl.isConnected === false || this._getActivePreviewVideoEl() !== videoEl)
                  return;
                if (inFlight || playing || videoEl.ended === true) return;
                const total = Number(videoEl.duration || 0),
                  pos = Number(videoEl.currentTime || 0);
                if (Number.isFinite(total) && total > 0 && pos >= Math.max(0, total - 0.05)) return;
                (videoEl.paused || Number(videoEl.currentTime || 0) <= 0) && void playOnce();
              }, delayMs),
              true
            );
          };
        return (
          void playOnce().then((started) => {
            if (!started) retryPlay(0);
          }),
          // 首帧还没就绪时 play() 会被拒，这几个时间点补刀即可覆盖绝大多数解码延迟。
          retryPlay(180),
          retryPlay(700),
          retryPlay(1400),
          true
        );
      }
      typeof this._markPreviewPosterClearedForPlayback === 'function' &&
        this._markPreviewPosterClearedForPlayback(videoEl);
      if (this._autoPlayToken !== token) return (videoEl.pause(), false);
      const playResult = videoEl.play();
      return (
        playResult && typeof playResult.catch === 'function' && playResult.catch(() => {}),
        true
      );
    }
    /**
     * 悬停离开。若此刻是手动播放 / 手动循环 / 外部接管，则保留画面与控件，只清悬停标记。
     */
    ['_deactivatePreviewHoverPlayback']() {
      (this._cancelPreviewHoverRetryTimers(),
        (this._isHovered = false),
        (this._previewHoverActivationPending = false));
      const videoEl = this._getActivePreviewVideoEl(),
        keepPresentation = shouldKeepManualPlaybackPresentationActive(this, videoEl);
      if (!keepPresentation) this._autoPlayToken++;
      if (videoEl) {
        if (!keepPresentation) videoEl.loop = false;
        this._logPreviewVideoPlaybackEvent?.(videoEl, 'hover-leave', 'hover');
        if (!keepPresentation) videoEl.pause?.();
      }
      return (
        (this._hoverManualPause = false),
        !keepPresentation && !this._isManualLoopPlayback && (this._isManualControl = false),
        this._setVideoOverlaysVisible(keepPresentation, videoEl),
        this._hoverPlaybackLifecycle?.deactivate?.({ release: false }),
        !!videoEl
      );
    }
    /**
     * 惰性构建预览层控件（静音钮 + 中央指示器 + 底部控制条）。可重复调用，已存在就跳过。
     *
     * 分段重拍（segment retake）编辑态下不建静音钮与控制条：那时预览区被标注工具占用。
     */
    ['_ensurePreviewVideoOverlays']() {
      if (!this.previewEl) return;
      const nodeData = store.getState().nodes?.[this.nodeId] || this._data || {},
        retakeEditing = isSegmentRetakeEditing(nodeData);
      this._syncMutedStateFromNodeData(this._data);
      if (!retakeEditing && !this._muteBtnEl) {
        const muteBtn = document.createElement('button');
        ((muteBtn.type = 'button'),
          (muteBtn.className = 'video-mute-btn'),
          (muteBtn.dataset.tooltip = previewControlsText('sourceVideoNode.controls.toggleMute')),
          Object.assign(muteBtn.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--media-control-button-text)',
            cursor: 'pointer',
            userSelect: 'none',
          }));
        const iconUnmuted = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        (iconUnmuted.setAttribute('width', '16'),
          iconUnmuted.setAttribute('height', '16'),
          iconUnmuted.setAttribute('viewBox', '0 0 24 24'),
          iconUnmuted.setAttribute('fill', 'none'),
          iconUnmuted.setAttribute('stroke', 'currentColor'),
          iconUnmuted.setAttribute('stroke-width', '2'),
          iconUnmuted.classList.add('icon-unmuted'),
          (iconUnmuted.innerHTML =
            '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>'));
        const iconMuted = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        (iconMuted.setAttribute('width', '16'),
          iconMuted.setAttribute('height', '16'),
          iconMuted.setAttribute('viewBox', '0 0 24 24'),
          iconMuted.setAttribute('fill', 'none'),
          iconMuted.setAttribute('stroke', 'currentColor'),
          iconMuted.setAttribute('stroke-width', '2'),
          iconMuted.classList.add('icon-muted'),
          (iconMuted.innerHTML =
            '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="1" x2="1" y2="23"></line><line x1="15.54" y1="8.46" x2="19.07" y2="12"></line>'),
          muteBtn.appendChild(iconUnmuted),
          muteBtn.appendChild(iconMuted),
          muteBtn.addEventListener('pointerdown', (event) => event.stopPropagation()),
          muteBtn.addEventListener('click', (event) => {
            (event.stopPropagation(),
              this._setPreviewMuted(!this._isMuted, { persist: true }),
              this._applyMuteStateToPreviewVideos(),
              this._syncMuteBtnIcon());
          }),
          this.previewEl.appendChild(muteBtn),
          (this._muteBtnEl = muteBtn),
          (this._muteIconUnmutedEl = iconUnmuted),
          (this._muteIconMutedEl = iconMuted),
          this._syncMuteBtnIcon?.());
      }
      if (!this._centerIndicatorEl) {
        const centerEl = document.createElement('div');
        ((centerEl.className = 'gen-video-center-indicator'),
          Object.assign(centerEl.style, {
            position: 'absolute',
            inset: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: '11',
          }));
        const centerInnerEl = document.createElement('div');
        (Object.assign(centerInnerEl.style, {
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          background: 'var(--media-control-center-bg)',
          border: '1px solid var(--media-control-center-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--media-control-button-text)',
          opacity: '0',
          transform: 'scale(0.92)',
          transition: 'opacity 0.18s ease, transform 0.18s ease',
        }),
          centerEl.appendChild(centerInnerEl),
          this.previewEl.appendChild(centerEl),
          (this._centerIndicatorEl = centerEl),
          (this._centerIndicatorInnerEl = centerInnerEl));
      }
      if (!retakeEditing && !this._controlsEl) {
        const controlsEl = document.createElement('div');
        ((controlsEl.className = 'video-controls'),
          Object.assign(controlsEl.style, {
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '100%',
            padding: '16px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--media-control-overlay-bg)',
            zIndex: '60',
            opacity: '1',
            transition: 'opacity 0.2s',
          }));
        const playBtnEl = document.createElement('button');
        ((playBtnEl.type = 'button'),
          (playBtnEl.className = 'video-play-btn'),
          Object.assign(playBtnEl.style, {
            cursor: 'pointer',
            color: 'var(--media-control-button-text)',
            display: 'flex',
            alignItems: 'center',
          }));
        const timeCurrentEl = document.createElement('span');
        ((timeCurrentEl.className = 'video-time-current'),
          Object.assign(timeCurrentEl.style, {
            color: 'var(--media-control-time-text)',
            fontSize: '12px',
            fontVariantNumeric: 'tabular-nums',
          }),
          (timeCurrentEl.textContent = '0:00'));
        const progressBarEl = document.createElement('div');
        ((progressBarEl.className = 'media-progress-bar'),
          Object.assign(progressBarEl.style, {
            flex: '1',
            height: '4px',
            background: 'var(--media-control-progress-track)',
            borderRadius: '2px',
            cursor: 'pointer',
            position: 'relative',
          }));
        const progressFillEl = document.createElement('div');
        ((progressFillEl.className = 'media-progress-fill'),
          Object.assign(progressFillEl.style, {
            width: '0%',
            height: '100%',
            background: 'var(--media-control-progress-fill)',
            borderRadius: '2px',
            pointerEvents: 'none',
            position: 'relative',
          }));
        const progressKnobEl = document.createElement('div');
        ((progressKnobEl.className = 'media-progress-knob'),
          Object.assign(progressKnobEl.style, {
            width: '10px',
            height: '10px',
            background: 'var(--media-control-progress-fill)',
            borderRadius: '50%',
            position: 'absolute',
            right: '-5px',
            top: '-3px',
            boxShadow: '0 0 4px var(--media-control-knob-shadow)',
          }),
          progressFillEl.appendChild(progressKnobEl),
          progressBarEl.appendChild(progressFillEl));
        const timeTotalEl = document.createElement('span');
        ((timeTotalEl.className = 'video-time-total'),
          Object.assign(timeTotalEl.style, {
            color: 'var(--media-control-time-text)',
            fontSize: '12px',
            fontVariantNumeric: 'tabular-nums',
          }),
          (timeTotalEl.textContent = '0:00'));
        const snapBtnEl = document.createElement('button');
        ((snapBtnEl.type = 'button'),
          (snapBtnEl.className = 'video-snap-btn'),
          (snapBtnEl.dataset.tooltip = previewControlsText(
            'sourceVideoNode.controls.captureFrame'
          )),
          Object.assign(snapBtnEl.style, {
            cursor: 'pointer',
            color: 'var(--media-control-button-text)',
            display: 'flex',
            alignItems: 'center',
          }),
          (snapBtnEl.innerHTML =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>'),
          controlsEl.appendChild(playBtnEl),
          controlsEl.appendChild(timeCurrentEl),
          controlsEl.appendChild(progressBarEl),
          controlsEl.appendChild(timeTotalEl),
          controlsEl.appendChild(this._muteBtnEl),
          controlsEl.appendChild(snapBtnEl),
          controlsEl.addEventListener('pointerdown', (event) => event.stopPropagation()),
          controlsEl.addEventListener('click', (event) => event.stopPropagation()));
        // pointerdown 已经切过播放态时，紧随其后的 click 不能再切一次（否则等于没点）。
        let handledByPointerDown = false;
        const togglePlayback = (event) => {
          if (VideoKeyingController.isActiveFor(this.nodeId)) return;
          const videoEl = this._getActivePreviewVideoEl();
          if (!videoEl) return;
          (this._toggleVideoPlayPause(videoEl, { loop: event.shiftKey === true }),
            this._syncVideoControlsFromVideo(videoEl));
        };
        (playBtnEl.addEventListener('pointerdown', (event) => {
          (event.stopPropagation(),
            event.preventDefault(),
            (handledByPointerDown = true),
            togglePlayback(event));
        }),
          playBtnEl.addEventListener('click', (event) => {
            event.stopPropagation();
            if (handledByPointerDown) {
              handledByPointerDown = false;
              return;
            }
            togglePlayback(event);
          }));
        const resolvePointerPosition = (event) => {
            if (!this._progressBarEl) return 0;
            const box = this._progressBarEl.getBoundingClientRect(),
              width = box.width || 0;
            if (!width) return 0;
            const offsetX = event.clientX - box.left;
            if (!Number.isFinite(offsetX)) return 0;
            return Math.max(0, Math.min(1, offsetX / width));
          },
          paintProgress = (position) => {
            if (this._progressFillEl) this._progressFillEl.style.width = position * 100 + '%';
            const videoEl = this._getActivePreviewVideoEl(),
              duration = this._getActiveVideoDuration(videoEl);
            this._timeCurrentEl &&
              duration > 0 &&
              (this._timeCurrentEl.textContent = this._fmtVideoTime(position * duration));
          },
          seekToPointer = (position) => {
            const videoEl = this._getActivePreviewVideoEl();
            this._seekActiveVideoByPos(videoEl, position);
          };
        (progressBarEl.addEventListener('pointerdown', (event) => {
          (event.stopPropagation(), event.preventDefault());
          if (event.button !== 0 || event.isPrimary === false) return;
          this._progressDragSession?.cancel?.();
          if (VideoKeyingController.isActiveFor(this.nodeId)) return;
          const videoEl = this._getActivePreviewVideoEl();
          if (!videoEl) return;
          const hasSrc = !!String(videoEl.getAttribute('src') || '').trim();
          // 拖进度条即视为手动接管：停掉悬停播放与循环，避免松手后又被自动播放抢回去。
          ((this._isManualControl = true),
            this._setManualLoopPlayback(false, videoEl),
            this._autoPlayToken++,
            (this._hoverManualPause = true),
            videoEl.pause());
          if (!hasSrc) {
            this._ensureVideoSrcFor(videoEl).then((ready) => {
              if (!ready) return;
              const position = resolvePointerPosition(event);
              (paintProgress(position), seekToPointer(position));
            });
            return;
          }
          this._isProgressDragging = true;
          const position = resolvePointerPosition(event);
          (paintProgress(position), seekToPointer(position));
          const onMove = (moveEvent) => {
              const nextPosition = resolvePointerPosition(moveEvent);
              (paintProgress(nextPosition), seekToPointer(nextPosition));
            },
            onEnd = (endEvent) => {
              (endEvent?.stopPropagation?.(),
                (this._isProgressDragging = false),
                (this._progressDragSession = null));
              const activeVideoEl = this._getActivePreviewVideoEl();
              this._syncVideoControlsFromVideo(activeVideoEl);
            };
          this._progressDragSession = startMediaProgressDragSession({
            target: window,
            pointerId: event.pointerId,
            onMove: onMove,
            onEnd: onEnd,
            onCancel: onEnd,
          });
        }),
          snapBtnEl.addEventListener('click', (event) => {
            event.stopPropagation();
            if (VideoKeyingController.isActiveFor(this.nodeId)) return;
            void this._captureCurrentFrameFromActiveVideo();
          }),
          this.previewEl.appendChild(controlsEl),
          (this._controlsEl = controlsEl),
          (this._playBtnEl = playBtnEl),
          (this._timeCurrentEl = timeCurrentEl),
          (this._timeTotalEl = timeTotalEl),
          (this._progressBarEl = progressBarEl),
          (this._progressFillEl = progressFillEl),
          (this._snapBtnEl = snapBtnEl),
          this._syncPreviewControlLocaleTexts(),
          this._updatePlayIcon(true));
      }
      (retakeEditing &&
        setHoverPlaybackChromeVisible(
          { controlsEl: this._controlsEl, muteEl: this._muteBtnEl },
          false
        ),
        this._setVideoOverlaysVisible(retakeEditing || !this.isNoResult));
    }
    /**
     * 显隐整套控件。真正的可见性判定集中在这里，所有调用点只表达「想不想显示」。
     */
    ['_setVideoOverlaysVisible'](visible, videoEl = null) {
      const state =
          typeof store.getStateRaw === 'function' ? store.getStateRaw() : store.getState(),
        nodeData = state?.nodes?.[this.nodeId] || this._data || {};
      if (isSegmentRetakeEditing(nodeData)) {
        setHoverPlaybackChromeVisible(
          { controlsEl: this._controlsEl, muteEl: this._muteBtnEl },
          false
        );
        const activeVideoEl = videoEl || this._getActivePreviewVideoEl(),
          showPlayButton =
            activeVideoEl?.paused !== false &&
            !this.previewEl?.classList?.contains?.('is-segment-retake-annotating');
        this._centerIndicatorEl?.style &&
          (this._centerIndicatorEl.style.display = showPlayButton ? 'flex' : 'none');
        if (showPlayButton) this._showPausedCenterIndicator?.();
        else this._hideCenterIndicator?.();
        return;
      }
      const videosExpanded = !!nodeData.isVideosExpanded,
        shouldShow =
          !!visible &&
          !isTaskFailed(nodeData) &&
          !videosExpanded &&
          !!(
            this._isHovered ||
            this._isManualControl ||
            this._isManualLoopPlayback ||
            this._isProgressSeeking ||
            this._isProgressDragging
          ) &&
          !VideoKeyingController.isActiveFor(this.nodeId);
      setHoverPlaybackChromeVisible(
        { controlsEl: this._controlsEl, muteEl: this._muteBtnEl },
        shouldShow
      );
      const showCenterIndicator =
        shouldShow && !!(this._isManualControl || this._isManualLoopPlayback);
      this._centerIndicatorEl?.style &&
        (this._centerIndicatorEl.style.display = showCenterIndicator ? 'flex' : 'none');
      if (!showCenterIndicator) this._hideCenterIndicator?.();
      shouldShow && this._syncVideoControlsFromVideo(videoEl || this._getActivePreviewVideoEl());
    }
    ['_syncMuteBtnIconImpl']() {
      if (!this._muteIconMutedEl || !this._muteIconUnmutedEl) return;
      ((this._muteIconMutedEl.style.display = this._isMuted ? '' : 'none'),
        (this._muteIconUnmutedEl.style.display = this._isMuted ? 'none' : ''));
    }
    /** 语言切换后刷新控件上的提示文案（tooltip + aria-label + 播放图标语义）。 */
    ['_syncPreviewControlLocaleTexts']() {
      if (this._muteBtnEl) {
        const muteText = previewControlsText('sourceVideoNode.controls.toggleMute');
        ((this._muteBtnEl.dataset.tooltip = muteText),
          this._muteBtnEl.setAttribute?.('aria-label', muteText));
      }
      if (this._snapBtnEl) {
        const snapText = previewControlsText('sourceVideoNode.controls.captureFrame');
        ((this._snapBtnEl.dataset.tooltip = snapText),
          this._snapBtnEl.setAttribute?.('aria-label', snapText));
      }
      this._updatePlayIcon(this._getActivePreviewVideoEl()?.paused !== false);
    }
    ['_setManualLoopPlayback'](enabled, videoEl = null) {
      const loop = enabled === true;
      this._isManualLoopPlayback = loop;
      if (videoEl) videoEl.loop = loop;
    }
    ['_syncMutedStateFromNodeData'](nodeData = this._data) {
      ((this._isMuted = resolveVideoMutedPreference(nodeData, {
        videoAudioDefaultEnabled: readVideoAudioDefaultEnabledFromStore(store),
      })),
        this._applyMuteStateToPreviewVideos(),
        this._syncMuteBtnIcon());
    }
    ['_setPreviewMuted'](muted, { persist: persist = false } = {}) {
      this._isMuted = !!muted;
      if (!persist) return;
      const nodeData = store.getState().nodes?.[this.nodeId] || this._data || {},
        patch = buildVideoMutedPatch(nodeData, this._isMuted);
      if (!patch || typeof store.updateNodeData !== 'function') return;
      (store.updateNodeData(this.nodeId, patch), (this._data = { ...nodeData, ...patch }));
    }
    /** 静音只作用于主层视频，其余多层一律静音，避免叠层同时出声。 */
    ['_applyMuteStateToPreviewVideos']() {
      if (!this.previewEl) return;
      const mainIdx =
          this._data && Number.isFinite(Number(this._data.mainVideoIndex))
            ? Number(this._data.mainVideoIndex)
            : Number.isFinite(Number(this._lastMainIdx))
              ? Number(this._lastMainIdx)
              : 0,
        activeIdx = Math.max(0, Math.trunc(mainIdx)),
        hasMultiLayer = Array.isArray(this._multiLayerEls) && this._multiLayerEls.length > 0;
      if (hasMultiLayer) {
        for (let layerIdx = 0; layerIdx < this._multiLayerEls.length; layerIdx++) {
          const layerEl = this._multiLayerEls[layerIdx];
          if (!layerEl) continue;
          layerEl.muted = layerIdx === activeIdx ? !!this._isMuted : true;
        }
        this._expandPanel &&
          this._expandPanel.querySelectorAll('video').forEach((videoEl) => {
            videoEl.muted = true;
          });
        return;
      }
      this.previewEl.querySelectorAll('video').forEach((videoEl) => {
        videoEl.muted = !!this._isMuted;
      });
    }
    ['_setCenterIndicatorIcon'](kind) {
      if (!this._centerIndicatorInnerEl) return;
      const iconEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      (iconEl.setAttribute('width', '28'),
        iconEl.setAttribute('height', '28'),
        iconEl.setAttribute('viewBox', '0 0 24 24'),
        iconEl.setAttribute('fill', 'currentColor'),
        (iconEl.style.color = 'var(--canvas-white)'),
        kind === 'play'
          ? (iconEl.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"></polygon>')
          : (iconEl.innerHTML =
              '<rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect>'),
        clearElement(this._centerIndicatorInnerEl),
        this._centerIndicatorInnerEl.appendChild(iconEl));
    }
    ['_showPausedCenterIndicator']() {
      if (!this._centerIndicatorInnerEl) return;
      (this._centerIndicatorTimer &&
        (clearTimeout(this._centerIndicatorTimer), (this._centerIndicatorTimer = null)),
        this._setCenterIndicatorIcon('play'),
        (this._centerIndicatorInnerEl.style.opacity = '1'),
        (this._centerIndicatorInnerEl.style.transform = 'scale(1)'));
    }
    ['_hideCenterIndicator']() {
      if (!this._centerIndicatorInnerEl) return;
      (this._centerIndicatorTimer &&
        (clearTimeout(this._centerIndicatorTimer), (this._centerIndicatorTimer = null)),
        (this._centerIndicatorInnerEl.style.opacity = '0'),
        (this._centerIndicatorInnerEl.style.transform = 'scale(0.92)'));
    }
    ['_flashCenterIndicator'](kind) {
      if (!this._centerIndicatorInnerEl) return;
      (this._centerIndicatorTimer &&
        (clearTimeout(this._centerIndicatorTimer), (this._centerIndicatorTimer = null)),
        this._setCenterIndicatorIcon(kind),
        (this._centerIndicatorInnerEl.style.opacity = '1'),
        (this._centerIndicatorInnerEl.style.transform = 'scale(1)'),
        (this._centerIndicatorTimer = setTimeout(() => {
          if (!this._centerIndicatorInnerEl) return;
          // 暂停闪烁结束后停在「播放」提示上，恢复闪烁就直接收起。
          if (kind === 'pause') this._showPausedCenterIndicator();
          else this._hideCenterIndicator();
          this._centerIndicatorTimer = null;
        }, 520)));
    }
    ['_getActivePreviewVideoEl']() {
      const mainIdx =
          this._data && Number.isFinite(Number(this._data.mainVideoIndex))
            ? Number(this._data.mainVideoIndex)
            : Number.isFinite(Number(this._lastMainIdx))
              ? Number(this._lastMainIdx)
              : 0,
        activeIdx = Math.max(0, Math.trunc(mainIdx));
      if (Array.isArray(this._multiLayerEls) && this._multiLayerEls.length > 0)
        return this._multiLayerEls[activeIdx] || this._multiLayerEls[0] || this.videoEl || null;
      return this.videoEl || null;
    }
    /**
     * 手动播放 / 暂停。`loop` 为真时进入手动循环态（Shift+点击播放键）。
     */
    ['_toggleVideoPlayPause'](videoEl, options = {}) {
      if (!videoEl) return;
      const loopRequested = options?.loop === true,
        takeoverHover = shouldTakeOverActiveHoverPlayback(this, videoEl),
        loop = loopRequested;
      ((this._isManualControl = true),
        this._hoverPlaybackLifecycle?.activate?.(),
        this._setVideoOverlaysVisible(true, videoEl),
        this._autoPlayToken++);
      const hasSrc = !!String(videoEl.getAttribute('src') || '').trim();
      if (videoEl.paused || takeoverHover) {
        this._hoverManualPause = false;
        if (videoEl.ended === true)
          try {
            videoEl.currentTime = 0;
          } catch {}
        this._setManualLoopPlayback(loop, videoEl);
        const token = this._autoPlayToken;
        if (typeof this._playPreviewVideoWithRecovery === 'function') {
          void this._playPreviewVideoWithRecovery(videoEl, {
            reason: 'manual',
            shouldContinue: () =>
              this._isManualControl === true &&
              this._hoverManualPause !== true &&
              this._autoPlayToken === token,
          }).then((started) => {
            // 播放期间用户又点了暂停 / 换了节点：撤销这次播放并收拾循环标记。
            if (this._autoPlayToken !== token || this._hoverManualPause === true) {
              (this._setManualLoopPlayback(false, videoEl), videoEl.pause?.());
              return;
            }
            if (!started) {
              this._setManualLoopPlayback(false, videoEl);
              return;
            }
            (this._flashCenterIndicator('play'), this._syncVideoControlsFromVideo(videoEl));
          });
          return;
        }
        if (!hasSrc) {
          this._ensureVideoSrcFor(videoEl).then((ready) => {
            if (!ready) {
              this._setManualLoopPlayback(false, videoEl);
              return;
            }
            const playResult = videoEl.play();
            (playResult &&
              typeof playResult.catch === 'function' &&
              playResult.catch(() => {
                this._setManualLoopPlayback(false, videoEl);
              }),
              this._flashCenterIndicator('play'),
              this._syncVideoControlsFromVideo(videoEl));
          });
          return;
        }
        const playResult = videoEl.play();
        (playResult &&
          typeof playResult.catch === 'function' &&
          playResult.catch(() => {
            this._setManualLoopPlayback(false, videoEl);
          }),
          this._flashCenterIndicator('play'),
          this._syncVideoControlsFromVideo(videoEl));
      } else
        ((this._hoverManualPause = true),
          this._setManualLoopPlayback(false, videoEl),
          videoEl.pause(),
          this._showPausedCenterIndicator(),
          this._syncVideoControlsFromVideo(videoEl));
    }
    /**
     * 刷新播放键图标与提示。用 `_playIconState` 缓存，避免每次 timeupdate 都重建 SVG。
     */
    ['_updatePlayIcon'](paused) {
      if (!this._playBtnEl) return;
      const iconState = paused ? 'paused' : 'playing',
        tooltip = previewControlsText(
          paused ? 'sourceVideoNode.controls.playLoopHint' : 'sourceVideoNode.controls.pause'
        );
      if (
        this._playIconButtonEl === this._playBtnEl &&
        this._playIconState === iconState &&
        this._playBtnEl.dataset?.tooltip === tooltip
      )
        return;
      ((this._playIconButtonEl = this._playBtnEl), (this._playIconState = iconState));
      if (this._playBtnEl.dataset) this._playBtnEl.dataset.tooltip = tooltip;
      else this._playBtnEl.setAttribute?.('data-tooltip', tooltip);
      (this._playBtnEl.setAttribute?.('aria-label', tooltip), this._playBtnEl.replaceChildren());
      const svgNs = 'http://www.w3.org/2000/svg',
        iconEl = document.createElementNS(svgNs, 'svg');
      (iconEl.setAttribute('width', '16'),
        iconEl.setAttribute('height', '16'),
        iconEl.setAttribute('viewBox', '0 0 24 24'),
        iconEl.setAttribute('fill', 'currentColor'));
      if (paused) {
        const triangle = document.createElementNS(svgNs, 'polygon');
        (triangle.setAttribute('points', '5 3 19 12 5 21 5 3'), iconEl.appendChild(triangle));
      } else {
        const barLeft = document.createElementNS(svgNs, 'rect');
        (barLeft.setAttribute('x', '6'),
          barLeft.setAttribute('y', '4'),
          barLeft.setAttribute('width', '4'),
          barLeft.setAttribute('height', '16'));
        const barRight = document.createElementNS(svgNs, 'rect');
        (barRight.setAttribute('x', '14'),
          barRight.setAttribute('y', '4'),
          barRight.setAttribute('width', '4'),
          barRight.setAttribute('height', '16'),
          iconEl.appendChild(barLeft),
          iconEl.appendChild(barRight));
      }
      this._playBtnEl.appendChild(iconEl);
    }
    ['_fmtVideoTime'](seconds) {
      const value = Number(seconds);
      if (!Number.isFinite(value) || value <= 0) return '0:00';
      return Math.floor(value / 60) + ':' + String(Math.floor(value % 60)).padStart(2, '0');
    }
    ['_getActiveVideoDuration'](videoEl) {
      if (videoEl) {
        const duration = Number(videoEl.duration);
        if (Number.isFinite(duration) && duration > 0) return duration;
        const seekable = videoEl.seekable;
        if (seekable && seekable.length) {
          const seekableEnd = Number(seekable.end(seekable.length - 1));
          if (Number.isFinite(seekableEnd) && seekableEnd > 0) return seekableEnd;
        }
      }
      const nodeDuration = Number(this._data?.videoDuration);
      if (Number.isFinite(nodeDuration) && nodeDuration > 0) return nodeDuration;
      return 0;
    }
    ['_requestVideoProgressFrame'](callback) {
      const raf = globalThis.window?.requestAnimationFrame || globalThis.requestAnimationFrame;
      if (typeof raf === 'function') return raf.call(globalThis.window || globalThis, callback);
      return setTimeout(callback, 16);
    }
    ['_cancelVideoProgressFrame'](handle) {
      const caf = globalThis.window?.cancelAnimationFrame || globalThis.cancelAnimationFrame;
      if (typeof caf === 'function') {
        caf.call(globalThis.window || globalThis, handle);
        return;
      }
      clearTimeout(handle);
    }
    ['_cancelVideoProgressLoop']() {
      (this._progressRaf && this._cancelVideoProgressFrame(this._progressRaf),
        (this._progressRaf = 0),
        (this._progressRafVideoEl = null));
    }
    /**
     * 播放期间用 rAF 逐帧刷新进度条。之所以不用 `timeupdate`：
     * 后者约 4 Hz，进度条会明显跳格。
     */
    ['_startVideoProgressLoop'](videoEl) {
      const activeVideoEl = videoEl || this._getActivePreviewVideoEl();
      if (!activeVideoEl || activeVideoEl.paused || activeVideoEl.ended) {
        this._cancelVideoProgressLoop();
        return;
      }
      if (this._progressRaf && this._progressRafVideoEl === activeVideoEl) return;
      (this._cancelVideoProgressLoop(), (this._progressRafVideoEl = activeVideoEl));
      const tick = () => {
        const currentVideoEl = this._getActivePreviewVideoEl();
        if (
          !currentVideoEl ||
          currentVideoEl !== this._progressRafVideoEl ||
          currentVideoEl.paused ||
          currentVideoEl.ended
        ) {
          ((this._progressRaf = 0),
            (this._progressRafVideoEl = null),
            this._syncVideoControlsFromVideo(currentVideoEl || null));
          return;
        }
        (this._syncVideoControlsFromVideo(currentVideoEl),
          (this._progressRaf = this._requestVideoProgressFrame(tick)));
      };
      this._progressRaf = this._requestVideoProgressFrame(tick);
    }
    ['_syncVideoControlsFromVideo'](videoEl) {
      const state =
          typeof store.getStateRaw === 'function' ? store.getStateRaw() : store.getState(),
        nodeData = state?.nodes?.[this.nodeId] || this._data || {};
      if (isSegmentRetakeEditing(nodeData)) {
        const activeVideoEl = videoEl || this._getActivePreviewVideoEl();
        this._setVideoOverlaysVisible(true, activeVideoEl);
        return;
      }
      if (!this._controlsEl || !this._playBtnEl || !this._progressFillEl) return;
      const activeVideoEl = videoEl || this._getActivePreviewVideoEl();
      if (!activeVideoEl) {
        (this._cancelVideoProgressLoop(),
          this._updatePlayIcon(true),
          (this._progressFillEl.style.width = '0%'));
        if (this._timeCurrentEl) this._timeCurrentEl.textContent = '0:00';
        if (this._timeTotalEl) this._timeTotalEl.textContent = '0:00';
        return;
      }
      const duration = this._getActiveVideoDuration(activeVideoEl),
        currentTime = Math.max(0, Number(activeVideoEl.currentTime) || 0),
        ratio = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;
      // 拖拽 / 跳转期间不覆盖用户刚拖到的位置，否则进度条会抖回去。
      if (!this._isProgressDragging && !this._isProgressSeeking) {
        this._progressFillEl.style.width = ratio * 100 + '%';
        if (this._timeCurrentEl) {
          const currentText = this._fmtVideoTime(currentTime);
          this._timeCurrentEl.textContent !== currentText &&
            (this._timeCurrentEl.textContent = currentText);
        }
      }
      if (this._timeTotalEl) {
        const totalText = this._fmtVideoTime(duration);
        this._timeTotalEl.textContent !== totalText && (this._timeTotalEl.textContent = totalText);
      }
      (this._updatePlayIcon(!!activeVideoEl.paused),
        activeVideoEl.paused || activeVideoEl.ended
          ? (this._showPausedCenterIndicator(), this._cancelVideoProgressLoop())
          : (this._hideCenterIndicator(), this._startVideoProgressLoop(activeVideoEl)));
    }
    ['_seekActiveVideoByPos'](videoEl, position) {
      const activeVideoEl = videoEl || this._getActivePreviewVideoEl();
      if (!activeVideoEl) return;
      const duration = this._getActiveVideoDuration(activeVideoEl);
      if (!Number.isFinite(duration) || duration <= 0) return;
      const clampedPosition = Math.max(0, Math.min(1, Number(position) || 0)),
        targetTime = clampedPosition * duration;
      this._isProgressSeeking = true;
      const seekToken = ++this._progressSeekToken;
      activeVideoEl.currentTime = targetTime;
      if (this._progressFillEl) this._progressFillEl.style.width = clampedPosition * 100 + '%';
      if (this._timeCurrentEl) this._timeCurrentEl.textContent = this._fmtVideoTime(targetTime);
      // seek 是异步落地的，等一个微任务再交还给同步逻辑；期间若已发起新 seek 就放弃本次。
      queueMicrotask(() => {
        if (seekToken !== this._progressSeekToken) return;
        ((this._isProgressSeeking = false), this._syncVideoControlsFromVideo(activeVideoEl));
      });
    }
    /** 卸载时释放进度拖拽会话与相关状态（rAF 循环由 `_cancelVideoProgressLoop` 单独收）。 */
    ['_disposeVideoProgressInteraction']() {
      (this._progressDragSession?.dispose?.(),
        (this._progressDragSession = null),
        (this._isProgressDragging = false),
        (this._isProgressSeeking = false),
        (this._progressSeekToken = Number(this._progressSeekToken || 0) + 1));
    }
    /**
     * 截取当前帧并生成一个 source-image 节点。
     *
     * 先插入「待保存」节点（带 blob 预览图）让用户立刻看到结果，落盘完成后再回填路径；
     * 落盘失败则把错误写回节点并在界面上提示，节点本身保留（跟截图工具的既有行为一致）。
     */
    async ['_captureCurrentFrameFromActiveVideo']() {
      const videoEl = this._getActivePreviewVideoEl();
      if (!videoEl) return;
      if (!getVideoFrameSource(videoEl)) {
        const ready = await this._ensureVideoSrcFor(videoEl);
        if (!ready) {
          window.showToast?.(previewControlsText('videoFrameExtraction.videoNotLoaded'), 'info');
          return;
        }
      }
      if (!isVideoFrameReady(videoEl)) {
        const frameReady = await waitForVideoFrame(videoEl);
        if (!frameReady) {
          window.showToast?.(previewControlsText('videoFrameExtraction.videoNotLoaded'), 'info');
          return;
        }
      }
      const videoWidth = videoEl.videoWidth || 0,
        videoHeight = videoEl.videoHeight || 0;
      if (!videoWidth || !videoHeight) return;
      let snapshot = null;
      try {
        snapshot = await captureVideoFrameSnapshot(videoEl, { fileNamePrefix: 'ai_video_frame' });
      } catch (captureError) {
        (console.warn('[AIGenVideoNode] capture frame failed:', captureError),
          window.showToast?.(
            previewControlsText('videoFrameExtraction.captureUnsupported'),
            'error'
          ));
        return;
      }
      if (!snapshot?.blob) return;
      const sourceNode = store.getState().nodes[this.nodeId];
      if (!sourceNode) return;
      const videoData =
          (Array.isArray(sourceNode.videos) &&
            sourceNode.videos[Math.max(0, Number(sourceNode.mainVideoIndex) || 0)]) ||
          (Array.isArray(sourceNode.videos) ? sourceNode.videos[0] : null) ||
          sourceNode,
        metaSrc =
          typeof this._resolveVideoMetaSrcFromVideoData === 'function'
            ? this._resolveVideoMetaSrcFromVideoData(videoData)
            : '',
        { frameIndex: frameIndex, nextSnapSeq: nextSnapSeq } = resolveVideoFrameCaptureIndex(
          sourceNode,
          {
            currentTimeSec: Number(videoEl.currentTime) || 0,
            fallbackDurationSec: this._getActiveVideoDuration(videoEl),
            fallbackFrameRate: DEFAULT_VIDEO_FRAME_CAPTURE_FPS,
          }
        );
      nextSnapSeq && store.updateNodeData(this.nodeId, { snapSeq: nextSnapSeq });
      metaSrc &&
        typeof this._maybeFetchVideoMeta === 'function' &&
        void this._maybeFetchVideoMeta(metaSrc);
      const size = getAutoMediaSizeByShortSide(videoWidth, videoHeight),
        position = calcSafeSpawnPosNearNode(
          store.getState().nodes,
          sourceNode,
          size.width,
          size.height
        ),
        nodeId = 'src-img-' + Date.now(),
        fallbackName = previewControlsText('videoFrameExtraction.capturedFrameName', {
          frameIndex: frameIndex,
        }),
        nodeName = buildVideoFrameCaptureNodeName(sourceNode, {
          frameIndex: frameIndex,
          fallbackName: fallbackName,
          formatSourceFrameName: (params) =>
            previewControlsText('videoFrameExtraction.capturedFrameNameWithSource', params),
        }),
        { savePromise: savePromise } = startVideoFrameSnapshotPersistence(
          snapshot,
          saveOutputBlob,
          {
            onPreview: ({ previewUrl: previewUrl }) => {
              store.addNode(
                buildSourceMediaNodePayload({
                  id: nodeId,
                  type: 'source-image',
                  name: nodeName,
                  capturePreviewUrl: previewUrl,
                  captureSavePending: true,
                  captureSaveError: null,
                  originalWidth: snapshot.originalWidth,
                  originalHeight: snapshot.originalHeight,
                  fileName: snapshot.fileName,
                  x: position.x,
                  y: position.y,
                  width: size.width,
                  height: size.height,
                  needsAutoResize: false,
                })
              );
            },
          }
        );
      savePromise
        .then((saved) => {
          if (!store.getStateRaw().nodes?.[nodeId]) return;
          store.updateNodeData(nodeId, {
            src: saved.src,
            localPath: saved.localPath,
            originalLocalPath: saved.originalLocalPath,
            displayLocalPath: saved.displayLocalPath,
            thumbLocalPath: saved.thumbLocalPath,
            originalWidth: saved.originalWidth,
            originalHeight: saved.originalHeight,
            fileName: saved.fileName,
            captureSavePending: false,
            captureSaveError: null,
          });
        })
        .catch((saveError) => {
          const message = String(
            saveError?.message || previewControlsText('videoFrameExtraction.localSaveFailed')
          );
          (console.warn('[AIGenVideoNode] save captured frame failed:', saveError),
            store.getStateRaw().nodes?.[nodeId] &&
              store.updateNodeData(nodeId, {
                captureSavePending: false,
                captureSaveError: message,
              }),
            window.showToast?.(
              previewControlsText('videoFrameExtraction.shownButSaveFailed'),
              'warning'
            ));
        });
    }
  }
  return result.prototype;
}
