import {
  captureVideoFrameSnapshot,
  getVideoFrameSource,
  isVideoFrameReady,
  saveVideoFrameSnapshot,
  waitForVideoFrame,
} from '../videoFrameCapture.js';
import { t } from '../../i18n/index.js';
import { buildVideoMutedPatch, resolveVideoMutedPreference } from './videoMuteState.js';
function previewControlsText(value, item = {}) {
  return t(value, item);
}
function createCapturePreviewUrl(enabled) {
  const key = globalThis.window?.URL || globalThis.URL;
  if (!enabled || typeof key?.createObjectURL !== 'function') return '';
  try {
    return key.createObjectURL(enabled);
  } catch {
    return '';
  }
}
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
    ['_ensurePreviewVideoOverlays']() {
      if (!this.previewEl) return;
      this._syncMutedStateFromNodeData(this._data);
      if (!this._muteBtnEl) {
        const el = document.createElement('div');
        ((el.className = 'video-mute-btn'),
          (el.title = previewControlsText('sourceVideoNode.controls.toggleMute')),
          Object.assign(el.style, {
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'var(--media-control-button-bg)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--media-control-button-text)',
            cursor: 'pointer',
            zIndex: '12',
            backdropFilter: 'blur(var(--media-control-blur))',
            userSelect: 'none',
          }));
        const el2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        (el2.setAttribute('width', '16'),
          el2.setAttribute('height', '16'),
          el2.setAttribute('viewBox', '0 0 24 24'),
          el2.setAttribute('fill', 'none'),
          el2.setAttribute('stroke', 'currentColor'),
          el2.setAttribute('stroke-width', '2'),
          el2.classList.add('icon-unmuted'),
          (el2.innerHTML =
            '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>'));
        const el3 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        (el3.setAttribute('width', '16'),
          el3.setAttribute('height', '16'),
          el3.setAttribute('viewBox', '0 0 24 24'),
          el3.setAttribute('fill', 'none'),
          el3.setAttribute('stroke', 'currentColor'),
          el3.setAttribute('stroke-width', '2'),
          el3.classList.add('icon-muted'),
          (el3.innerHTML =
            '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="1" x2="1" y2="23"></line><line x1="15.54" y1="8.46" x2="19.07" y2="12"></line>'),
          el.appendChild(el2),
          el.appendChild(el3),
          el.addEventListener('pointerdown', (event) => event.stopPropagation()),
          el.addEventListener('click', (event2) => {
            (event2.stopPropagation(),
              this._setPreviewMuted(!this._isMuted, { persist: true }),
              this._applyMuteStateToPreviewVideos(),
              this._syncMuteBtnIcon());
          }),
          this.previewEl.appendChild(el),
          (this._muteBtnEl = el),
          (this._muteIconUnmutedEl = el2),
          (this._muteIconMutedEl = el3),
          this._syncMuteBtnIcon());
      }
      if (!this._centerIndicatorEl) {
        const el4 = document.createElement('div');
        ((el4.className = 'gen-video-center-indicator'),
          Object.assign(el4.style, {
            position: 'absolute',
            inset: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: '11',
          }));
        const el5 = document.createElement('div');
        (Object.assign(el5.style, {
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
          el4.appendChild(el5),
          this.previewEl.appendChild(el4),
          (this._centerIndicatorEl = el4),
          (this._centerIndicatorInnerEl = el5));
      }
      if (!this._controlsEl) {
        const el6 = document.createElement('div');
        ((el6.className = 'video-controls'),
          Object.assign(el6.style, {
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '100%',
            padding: '16px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--media-control-overlay-bg)',
            zIndex: '12',
            opacity: '1',
            transition: 'opacity 0.2s',
          }));
        const el7 = document.createElement('div');
        ((el7.className = 'video-play-btn'),
          Object.assign(el7.style, {
            cursor: 'pointer',
            color: 'var(--media-control-button-text)',
            display: 'flex',
            alignItems: 'center',
          }));
        const el8 = document.createElement('span');
        ((el8.className = 'video-time-current'),
          Object.assign(el8.style, {
            color: 'var(--media-control-time-text)',
            fontSize: '12px',
            fontVariantNumeric: 'tabular-nums',
          }),
          (el8.textContent = '0:00'));
        const el9 = document.createElement('div');
        ((el9.className = 'media-progress-bar'),
          Object.assign(el9.style, {
            flex: '1',
            height: '4px',
            background: 'var(--media-control-progress-track)',
            borderRadius: '2px',
            cursor: 'pointer',
            position: 'relative',
          }));
        const el10 = document.createElement('div');
        ((el10.className = 'media-progress-fill'),
          Object.assign(el10.style, {
            width: '0%',
            height: '100%',
            background: 'var(--media-control-progress-fill)',
            borderRadius: '2px',
            pointerEvents: 'none',
            position: 'relative',
          }));
        const el11 = document.createElement('div');
        ((el11.className = 'media-progress-knob'),
          Object.assign(el11.style, {
            width: '10px',
            height: '10px',
            background: 'var(--media-control-progress-fill)',
            borderRadius: '50%',
            position: 'absolute',
            right: '-5px',
            top: '-3px',
            boxShadow: '0 0 4px var(--media-control-knob-shadow)',
          }),
          el10.appendChild(el11),
          el9.appendChild(el10));
        const el12 = document.createElement('span');
        ((el12.className = 'video-time-total'),
          Object.assign(el12.style, {
            color: 'var(--media-control-time-text)',
            fontSize: '12px',
            fontVariantNumeric: 'tabular-nums',
          }),
          (el12.textContent = '0:00'));
        const el13 = document.createElement('div');
        ((el13.className = 'video-snap-btn'),
          (el13.title = previewControlsText('sourceVideoNode.controls.captureFrame')),
          Object.assign(el13.style, {
            cursor: 'pointer',
            color: 'var(--media-control-button-text)',
            display: 'flex',
            alignItems: 'center',
          }),
          (el13.innerHTML =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>'),
          el6.appendChild(el7),
          el6.appendChild(el8),
          el6.appendChild(el9),
          el6.appendChild(el12),
          el6.appendChild(el13),
          el6.addEventListener('pointerdown', (event3) => event3.stopPropagation()),
          el6.addEventListener('click', (event4) => event4.stopPropagation()),
          el7.addEventListener('click', (loop) => {
            loop.stopPropagation();
            if (VideoKeyingController.isActiveFor(this.nodeId)) return;
            const enabled2 = this._getActivePreviewVideoEl();
            if (!enabled2) return;
            (this._toggleVideoPlayPause(enabled2, { loop: loop.altKey === true }),
              this._syncVideoControlsFromVideo(enabled2));
          }));
        const run = (event5) => {
            if (!this._progressBarEl) return 0;
            const box = this._progressBarEl.getBoundingClientRect(),
              enabled3 = box.width || 0;
            if (!enabled3) return 0;
            const data = event5.clientX - box.left;
            if (!Number.isFinite(data)) return 0;
            return Math.max(0, Math.min(1, data / enabled3));
          },
          handler = (options) => {
            if (this._progressFillEl) this._progressFillEl.style.width = options * 100 + '%';
            const target = this._getActivePreviewVideoEl(),
              count = this._getActiveVideoDuration(target);
            this._timeCurrentEl &&
              count > 0 &&
              (this._timeCurrentEl.textContent = this._fmtVideoTime(options * count));
          },
          handler2 = (source) => {
            const next = this._getActivePreviewVideoEl();
            this._seekActiveVideoByPos(next, source);
          };
        (el9.addEventListener('pointerdown', (event6) => {
          (event6.stopPropagation(), event6.preventDefault());
          if (VideoKeyingController.isActiveFor(this.nodeId)) return;
          const enabled4 = this._getActivePreviewVideoEl();
          if (!enabled4) return;
          const enabled5 = !!String(enabled4.getAttribute('src') || '').trim();
          ((this._isManualControl = true),
            (this._isManualLoopPlayback = false),
            (enabled4.loop = false),
            this._autoPlayToken++,
            (this._hoverManualPause = true),
            enabled4.pause());
          if (!enabled5) {
            this._ensureVideoSrcFor(enabled4).then((enabled6) => {
              if (!enabled6) return;
              const current = run(event6);
              (handler(current), handler2(current));
            });
            return;
          }
          this._isProgressDragging = true;
          const entry = run(event6);
          (handler(entry), handler2(entry));
          const record = (payload) => {
              const handle = run(payload);
              (handler(handle), handler2(handle));
            },
            state = (event7) => {
              (event7.stopPropagation(),
                (this._isProgressDragging = false),
                window.removeEventListener('pointermove', record, true),
                window.removeEventListener('pointerup', state, true));
              const config = this._getActivePreviewVideoEl();
              this._syncVideoControlsFromVideo(config);
            };
          (window.addEventListener('pointermove', record, true),
            window.addEventListener('pointerup', state, true));
        }),
          el13.addEventListener('click', (event8) => {
            event8.stopPropagation();
            if (VideoKeyingController.isActiveFor(this.nodeId)) return;
            void this._captureCurrentFrameFromActiveVideo();
          }),
          this.previewEl.appendChild(el6),
          (this._controlsEl = el6),
          (this._playBtnEl = el7),
          (this._timeCurrentEl = el8),
          (this._timeTotalEl = el12),
          (this._progressBarEl = el9),
          (this._progressFillEl = el10),
          (this._snapBtnEl = el13),
          this._updatePlayIcon(true));
      }
      this._setVideoOverlaysVisible(!this.isNoResult);
    }
    ['_setVideoOverlaysVisible'](enabled7) {
      const enabled8 = store.getState().nodes?.[this.nodeId] || this._data || {},
        enabled9 = !!enabled8.isVideosExpanded,
        scope = !!enabled7 && !enabled9 && !VideoKeyingController.isActiveFor(this.nodeId);
      if (this._muteBtnEl) this._muteBtnEl.style.display = scope ? 'flex' : 'none';
      if (this._centerIndicatorEl) this._centerIndicatorEl.style.display = scope ? 'flex' : 'none';
      if (this._controlsEl) this._controlsEl.style.display = scope ? 'flex' : 'none';
      if (scope) this._syncVideoControlsFromVideo(this._getActivePreviewVideoEl());
    }
    ['_syncMuteBtnIconImpl']() {
      if (!this._muteIconMutedEl || !this._muteIconUnmutedEl) return;
      ((this._muteIconMutedEl.style.display = this._isMuted ? '' : 'none'),
        (this._muteIconUnmutedEl.style.display = this._isMuted ? 'none' : ''));
    }
    ['_syncMutedStateFromNodeData'](input = this._data) {
      ((this._isMuted = resolveVideoMutedPreference(input)),
        this._applyMuteStateToPreviewVideos(),
        this._syncMuteBtnIcon());
    }
    ['_setPreviewMuted'](enabled10, { persist: persist = false } = {}) {
      this._isMuted = !!enabled10;
      if (!persist) return;
      const args = store.getState().nodes?.[this.nodeId] || this._data || {},
        args2 = buildVideoMutedPatch(args, this._isMuted);
      if (!args2 || typeof store.updateNodeData !== 'function') return;
      (store.updateNodeData(this.nodeId, args2), (this._data = { ...args, ...args2 }));
    }
    ['_applyMuteStateToPreviewVideos']() {
      if (!this.previewEl) return;
      const output =
          this._data && Number.isFinite(Number(this._data.mainVideoIndex))
            ? Number(this._data.mainVideoIndex)
            : Number.isFinite(Number(this._lastMainIdx))
              ? Number(this._lastMainIdx)
              : 0,
        value2 = Math.max(0, Math.trunc(output)),
        value3 = Array.isArray(this._multiLayerEls) && this._multiLayerEls.length > 0;
      if (value3) {
        for (let value4 = 0; value4 < this._multiLayerEls.length; value4++) {
          const enabled11 = this._multiLayerEls[value4];
          if (!enabled11) continue;
          enabled11.muted = value4 === value2 ? !!this._isMuted : true;
        }
        this._expandPanel &&
          this._expandPanel.querySelectorAll('video').forEach((item2) => {
            item2.muted = true;
          });
        return;
      }
      this.previewEl.querySelectorAll('video').forEach((item3) => {
        item3.muted = !!this._isMuted;
      });
    }
    ['_setCenterIndicatorIcon'](value5) {
      if (!this._centerIndicatorInnerEl) return;
      const el14 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      (el14.setAttribute('width', '28'),
        el14.setAttribute('height', '28'),
        el14.setAttribute('viewBox', '0 0 24 24'),
        el14.setAttribute('fill', 'currentColor'),
        (el14.style.color = 'var(--canvas-white)'),
        value5 === 'play'
          ? (el14.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"></polygon>')
          : (el14.innerHTML =
              '<rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect>'),
        (this._centerIndicatorInnerEl.innerHTML = ''),
        this._centerIndicatorInnerEl.appendChild(el14));
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
    ['_flashCenterIndicator'](value6) {
      if (!this._centerIndicatorInnerEl) return;
      (this._centerIndicatorTimer &&
        (clearTimeout(this._centerIndicatorTimer), (this._centerIndicatorTimer = null)),
        this._setCenterIndicatorIcon(value6),
        (this._centerIndicatorInnerEl.style.opacity = '1'),
        (this._centerIndicatorInnerEl.style.transform = 'scale(1)'),
        (this._centerIndicatorTimer = setTimeout(() => {
          if (!this._centerIndicatorInnerEl) return;
          if (value6 === 'pause') this._showPausedCenterIndicator();
          else this._hideCenterIndicator();
          this._centerIndicatorTimer = null;
        }, 0x208)));
    }
    ['_getActivePreviewVideoEl']() {
      const value7 =
          this._data && Number.isFinite(Number(this._data.mainVideoIndex))
            ? Number(this._data.mainVideoIndex)
            : Number.isFinite(Number(this._lastMainIdx))
              ? Number(this._lastMainIdx)
              : 0,
        value8 = Math.max(0, Math.trunc(value7));
      if (Array.isArray(this._multiLayerEls) && this._multiLayerEls.length > 0)
        return this._multiLayerEls[value8] || this._multiLayerEls[0] || this.videoEl || null;
      return this.videoEl || null;
    }
    ['_toggleVideoPlayPause'](enabled12, value9 = {}) {
      if (!enabled12) return;
      const value10 = value9?.loop === true;
      ((this._isManualControl = true), this._autoPlayToken++);
      const enabled13 = !!String(enabled12.getAttribute('src') || '').trim();
      if (enabled12.paused) {
        ((this._hoverManualPause = false),
          (this._isManualLoopPlayback = value10),
          (enabled12.loop = value10));
        if (typeof this._playPreviewVideoWithRecovery === 'function') {
          void this._playPreviewVideoWithRecovery(enabled12, {
            reason: 'manual',
            shouldContinue: () => this._isManualControl === true,
          }).then((enabled14) => {
            if (!enabled14) {
              ((this._isManualLoopPlayback = false), (enabled12.loop = false));
              return;
            }
            (this._flashCenterIndicator('play'), this._syncVideoControlsFromVideo(enabled12));
          });
          return;
        }
        if (!enabled13) {
          this._ensureVideoSrcFor(enabled12).then((enabled15) => {
            if (!enabled15) {
              ((this._isManualLoopPlayback = false), (enabled12.loop = false));
              return;
            }
            const promise = enabled12.play();
            (promise &&
              typeof promise.catch === 'function' &&
              promise.catch(() => {
                ((this._isManualLoopPlayback = false), (enabled12.loop = false));
              }),
              this._flashCenterIndicator('play'),
              this._syncVideoControlsFromVideo(enabled12));
          });
          return;
        }
        const promise2 = enabled12.play();
        (promise2 &&
          typeof promise2.catch === 'function' &&
          promise2.catch(() => {
            ((this._isManualLoopPlayback = false), (enabled12.loop = false));
          }),
          this._flashCenterIndicator('play'),
          this._syncVideoControlsFromVideo(enabled12));
      } else
        ((this._hoverManualPause = true),
          (this._isManualLoopPlayback = false),
          (enabled12.loop = false),
          enabled12.pause(),
          this._showPausedCenterIndicator(),
          this._syncVideoControlsFromVideo(enabled12));
    }
    ['_updatePlayIcon'](value11) {
      if (!this._playBtnEl) return;
      this._playBtnEl.replaceChildren();
      const value12 = 'http://www.w3.org/2000/svg',
        el15 = document.createElementNS(value12, 'svg');
      (el15.setAttribute('width', '16'),
        el15.setAttribute('height', '16'),
        el15.setAttribute('viewBox', '0 0 24 24'),
        el15.setAttribute('fill', 'currentColor'));
      if (value11) {
        const el16 = document.createElementNS(value12, 'polygon');
        (el16.setAttribute('points', '5 3 19 12 5 21 5 3'), el15.appendChild(el16));
      } else {
        const el17 = document.createElementNS(value12, 'rect');
        (el17.setAttribute('x', '6'),
          el17.setAttribute('y', '4'),
          el17.setAttribute('width', '4'),
          el17.setAttribute('height', '16'));
        const el18 = document.createElementNS(value12, 'rect');
        (el18.setAttribute('x', '14'),
          el18.setAttribute('y', '4'),
          el18.setAttribute('width', '4'),
          el18.setAttribute('height', '16'),
          el15.appendChild(el17),
          el15.appendChild(el18));
      }
      this._playBtnEl.appendChild(el15);
    }
    ['_fmtVideoTime'](value13) {
      const count2 = Number(value13);
      if (!Number.isFinite(count2) || count2 <= 0) return '0:00';
      return Math.floor(count2 / 60) + ':' + String(Math.floor(count2 % 60)).padStart(2, '0');
    }
    ['_getActiveVideoDuration'](value14) {
      if (value14) {
        const count3 = Number(value14.duration);
        if (Number.isFinite(count3) && count3 > 0) return count3;
        const list = value14.seekable;
        if (list && list.length) {
          const count4 = Number(list.end(list.length - 1));
          if (Number.isFinite(count4) && count4 > 0) return count4;
        }
      }
      const count5 = Number(this._data?.videoDuration);
      if (Number.isFinite(count5) && count5 > 0) return count5;
      return 0;
    }
    ['_syncVideoControlsFromVideo'](value15) {
      if (!this._controlsEl || !this._playBtnEl || !this._progressFillEl) return;
      const enabled16 = value15 || this._getActivePreviewVideoEl();
      if (!enabled16) {
        (this._updatePlayIcon(true), (this._progressFillEl.style.width = '0%'));
        if (this._timeCurrentEl) this._timeCurrentEl.textContent = '0:00';
        if (this._timeTotalEl) this._timeTotalEl.textContent = '0:00';
        return;
      }
      const count6 = this._getActiveVideoDuration(enabled16),
        value16 = Math.max(0, Number(enabled16.currentTime) || 0),
        value17 = count6 > 0 ? Math.max(0, Math.min(1, value16 / count6)) : 0;
      if (!this._isProgressDragging && !this._isProgressSeeking) {
        this._progressFillEl.style.width = value17 * 100 + '%';
        if (this._timeCurrentEl) this._timeCurrentEl.textContent = this._fmtVideoTime(value16);
      }
      if (this._timeTotalEl) this._timeTotalEl.textContent = this._fmtVideoTime(count6);
      this._updatePlayIcon(!!enabled16.paused);
    }
    ['_seekActiveVideoByPos'](value18, value19) {
      const enabled17 = value18 || this._getActivePreviewVideoEl();
      if (!enabled17) return;
      const count7 = this._getActiveVideoDuration(enabled17);
      if (!Number.isFinite(count7) || count7 <= 0) return;
      const value20 = Math.max(0, Math.min(1, Number(value19) || 0)),
        value21 = value20 * count7;
      this._isProgressSeeking = true;
      const value22 = ++this._progressSeekToken;
      enabled17.currentTime = value21;
      if (this._progressFillEl) this._progressFillEl.style.width = value20 * 100 + '%';
      if (this._timeCurrentEl) this._timeCurrentEl.textContent = this._fmtVideoTime(value21);
      queueMicrotask(() => {
        if (value22 !== this._progressSeekToken) return;
        ((this._isProgressSeeking = false), this._syncVideoControlsFromVideo(enabled17));
      });
    }
    async ['_captureCurrentFrameFromActiveVideo']() {
      const enabled18 = this._getActivePreviewVideoEl();
      if (!enabled18) return;
      if (!getVideoFrameSource(enabled18)) {
        const enabled19 = await this._ensureVideoSrcFor(enabled18);
        if (!enabled19) {
          window.showToast?.(previewControlsText('videoFrameExtraction.videoNotLoaded'), 'info');
          return;
        }
      }
      if (!isVideoFrameReady(enabled18)) {
        const waitForVideoFrame2 = await waitForVideoFrame(enabled18);
        if (!waitForVideoFrame2) {
          window.showToast?.(previewControlsText('videoFrameExtraction.videoNotLoaded'), 'info');
          return;
        }
      }
      const enabled20 = enabled18.videoWidth || 0,
        enabled21 = enabled18.videoHeight || 0;
      if (!enabled20 || !enabled21) return;
      let originalWidth = null;
      try {
        originalWidth = await captureVideoFrameSnapshot(enabled18, { fileNamePrefix: 'ai_video_frame' });
      } catch (value23) {
        (console.warn('[AIGenVideoNode] capture frame failed:', value23),
          window.showToast?.(previewControlsText('videoFrameExtraction.captureUnsupported'), 'error'));
        return;
      }
      if (!originalWidth?.blob) return;
      const enabled22 = store.getState().nodes[this.nodeId];
      if (!enabled22) return;
      const count8 = Number(enabled22.videoFps),
        count9 = Number(enabled22.videoFrameCount),
        count10 =
          Number(enabled22.videoDuration) > 0
            ? Number(enabled22.videoDuration)
            : this._getActiveVideoDuration(enabled18),
        count11 =
          Number.isFinite(count8) && count8 > 0
            ? count8
            : Number.isFinite(count9) && count9 > 0 && Number.isFinite(count10) && count10 > 0
              ? count9 / count10
              : 0;
      let frameIndex = 0;
      if (Number.isFinite(count11) && count11 > 0)
        ((frameIndex = Math.floor(Math.max(0, Number(enabled18.currentTime) || 0) * count11) + 1),
          Number.isFinite(count9) && count9 > 0
            ? (frameIndex = Math.max(1, Math.min(Math.round(count9), frameIndex)))
            : (frameIndex = Math.max(1, frameIndex)));
      else {
        const snapSeq = Math.max(1, Math.floor(Number(enabled22.snapSeq) || 0) + 1);
        ((frameIndex = snapSeq), store.updateNodeData(this.nodeId, { snapSeq: snapSeq }));
        const value24 =
            (Array.isArray(enabled22.videos) &&
              enabled22.videos[Math.max(0, Number(enabled22.mainVideoIndex) || 0)]) ||
            (Array.isArray(enabled22.videos) ? enabled22.videos[0] : null) ||
            enabled22,
          value25 = this._resolveVideoMetaSrcFromVideoData(value24);
        if (value25) this._maybeFetchVideoMeta(value25);
      }
      const width = getAutoMediaSizeByShortSide(enabled20, enabled21),
        x = calcSafeSpawnPosNearNode(store.getState().nodes, enabled22, width.width, width.height),
        id = 'src-img-' + Date.now(),
        capturePreviewUrl = createCapturePreviewUrl(originalWidth.blob);
      (store.addNode(
        buildSourceMediaNodePayload({
          id: id,
          type: 'source-image',
          name: previewControlsText('videoFrameExtraction.capturedFrameName', { frameIndex: frameIndex }),
          capturePreviewUrl: capturePreviewUrl,
          captureSavePending: true,
          captureSaveError: null,
          originalWidth: originalWidth.originalWidth,
          originalHeight: originalWidth.originalHeight,
          fileName: originalWidth.fileName,
          x: x.x,
          y: x.y,
          width: width.width,
          height: width.height,
          needsAutoResize: false,
        }),
      ),
        saveVideoFrameSnapshot(originalWidth, saveOutputBlob)
          .then((src) => {
            if (!store.getStateRaw().nodes?.[id]) return;
            store.updateNodeData(id, {
              src: src.src,
              localPath: src.localPath,
              originalLocalPath: src.originalLocalPath,
              displayLocalPath: src.displayLocalPath,
              thumbLocalPath: src.thumbLocalPath,
              originalWidth: src.originalWidth,
              originalHeight: src.originalHeight,
              fileName: src.fileName,
              captureSavePending: false,
              captureSaveError: null,
            });
          })
          .catch((error) => {
            const captureSaveError = String(
              error?.message || previewControlsText('videoFrameExtraction.localSaveFailed'),
            );
            (console.warn('[AIGenVideoNode] save captured frame failed:', error),
              store.getStateRaw().nodes?.[id] &&
                store.updateNodeData(id, {
                  captureSavePending: false,
                  captureSaveError: captureSaveError,
                }),
              window.showToast?.(previewControlsText('videoFrameExtraction.shownButSaveFailed'), 'warning'));
          }));
    }
  }
  return result.prototype;
}
