import {
  captureVideoFrameSnapshot,
  getVideoFrameSource,
  isVideoFrameReady,
  saveVideoFrameSnapshot,
  waitForVideoFrame,
} from '../videoFrameCapture.js';
import { t } from '../../i18n/index.js';
import { buildVideoMutedPatch, resolveVideoMutedPreference } from './videoMuteState.js';
function previewControlsText(_0x5dee15, _0x231605 = {}) {
  return t(_0x5dee15, _0x231605);
}
function createCapturePreviewUrl(_0x343fcc) {
  const _0x1af522 = globalThis.window?.URL || globalThis.URL;
  if (!_0x343fcc || typeof _0x1af522?.createObjectURL !== 'function') return '';
  try {
    return _0x1af522.createObjectURL(_0x343fcc);
  } catch {
    return '';
  }
}
export function createVideoNodePreviewControlsModule(_0xf6b3e) {
  const {
    store: _0x239343,
    saveOutputBlob: _0x2a722b,
    VideoKeyingController: _0x11b51c,
    getAutoMediaSizeByShortSide: _0x323bfe,
    buildSourceMediaNodePayload: _0x424437,
    calcSafeSpawnPosNearNode: _0x231b5b,
  } = _0xf6b3e;
  class _0x5558ca {
    ['_ensurePreviewVideoOverlays']() {
      if (!this.previewEl) return;
      this._syncMutedStateFromNodeData(this._data);
      if (!this._muteBtnEl) {
        const _0x4d4f4d = document.createElement('div');
        ((_0x4d4f4d.className = 'video-mute-btn'),
          (_0x4d4f4d.title = previewControlsText('sourceVideoNode.controls.toggleMute')),
          Object.assign(_0x4d4f4d.style, {
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
        const _0x1cbb76 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        (_0x1cbb76.setAttribute('width', '16'),
          _0x1cbb76.setAttribute('height', '16'),
          _0x1cbb76.setAttribute('viewBox', '0 0 24 24'),
          _0x1cbb76.setAttribute('fill', 'none'),
          _0x1cbb76.setAttribute('stroke', 'currentColor'),
          _0x1cbb76.setAttribute('stroke-width', '2'),
          _0x1cbb76.classList.add('icon-unmuted'),
          (_0x1cbb76.innerHTML =
            '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>'));
        const _0x2ecb78 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        (_0x2ecb78.setAttribute('width', '16'),
          _0x2ecb78.setAttribute('height', '16'),
          _0x2ecb78.setAttribute('viewBox', '0 0 24 24'),
          _0x2ecb78.setAttribute('fill', 'none'),
          _0x2ecb78.setAttribute('stroke', 'currentColor'),
          _0x2ecb78.setAttribute('stroke-width', '2'),
          _0x2ecb78.classList.add('icon-muted'),
          (_0x2ecb78.innerHTML =
            '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="1" x2="1" y2="23"></line><line x1="15.54" y1="8.46" x2="19.07" y2="12"></line>'),
          _0x4d4f4d.appendChild(_0x1cbb76),
          _0x4d4f4d.appendChild(_0x2ecb78),
          _0x4d4f4d.addEventListener('pointerdown', (_0x4dfd7f) => _0x4dfd7f.stopPropagation()),
          _0x4d4f4d.addEventListener('click', (_0x3c1fa7) => {
            (_0x3c1fa7.stopPropagation(),
              this._setPreviewMuted(!this._isMuted, { persist: true }),
              this._applyMuteStateToPreviewVideos(),
              this._syncMuteBtnIcon());
          }),
          this.previewEl.appendChild(_0x4d4f4d),
          (this._muteBtnEl = _0x4d4f4d),
          (this._muteIconUnmutedEl = _0x1cbb76),
          (this._muteIconMutedEl = _0x2ecb78),
          this._syncMuteBtnIcon());
      }
      if (!this._centerIndicatorEl) {
        const _0x322f55 = document.createElement('div');
        ((_0x322f55.className = 'gen-video-center-indicator'),
          Object.assign(_0x322f55.style, {
            position: 'absolute',
            inset: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: '11',
          }));
        const _0x301da8 = document.createElement('div');
        (Object.assign(_0x301da8.style, {
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
          _0x322f55.appendChild(_0x301da8),
          this.previewEl.appendChild(_0x322f55),
          (this._centerIndicatorEl = _0x322f55),
          (this._centerIndicatorInnerEl = _0x301da8));
      }
      if (!this._controlsEl) {
        const _0x1b5c57 = document.createElement('div');
        ((_0x1b5c57.className = 'video-controls'),
          Object.assign(_0x1b5c57.style, {
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
        const _0x5c4380 = document.createElement('div');
        ((_0x5c4380.className = 'video-play-btn'),
          Object.assign(_0x5c4380.style, {
            cursor: 'pointer',
            color: 'var(--media-control-button-text)',
            display: 'flex',
            alignItems: 'center',
          }));
        const _0xb19887 = document.createElement('span');
        ((_0xb19887.className = 'video-time-current'),
          Object.assign(_0xb19887.style, {
            color: 'var(--media-control-time-text)',
            fontSize: '12px',
            fontVariantNumeric: 'tabular-nums',
          }),
          (_0xb19887.textContent = '0:00'));
        const _0x2adf5f = document.createElement('div');
        ((_0x2adf5f.className = 'media-progress-bar'),
          Object.assign(_0x2adf5f.style, {
            flex: '1',
            height: '4px',
            background: 'var(--media-control-progress-track)',
            borderRadius: '2px',
            cursor: 'pointer',
            position: 'relative',
          }));
        const _0x2d1bac = document.createElement('div');
        ((_0x2d1bac.className = 'media-progress-fill'),
          Object.assign(_0x2d1bac.style, {
            width: '0%',
            height: '100%',
            background: 'var(--media-control-progress-fill)',
            borderRadius: '2px',
            pointerEvents: 'none',
            position: 'relative',
          }));
        const _0x55d8fb = document.createElement('div');
        ((_0x55d8fb.className = 'media-progress-knob'),
          Object.assign(_0x55d8fb.style, {
            width: '10px',
            height: '10px',
            background: 'var(--media-control-progress-fill)',
            borderRadius: '50%',
            position: 'absolute',
            right: '-5px',
            top: '-3px',
            boxShadow: '0 0 4px var(--media-control-knob-shadow)',
          }),
          _0x2d1bac.appendChild(_0x55d8fb),
          _0x2adf5f.appendChild(_0x2d1bac));
        const _0x46ceff = document.createElement('span');
        ((_0x46ceff.className = 'video-time-total'),
          Object.assign(_0x46ceff.style, {
            color: 'var(--media-control-time-text)',
            fontSize: '12px',
            fontVariantNumeric: 'tabular-nums',
          }),
          (_0x46ceff.textContent = '0:00'));
        const _0x34d800 = document.createElement('div');
        ((_0x34d800.className = 'video-snap-btn'),
          (_0x34d800.title = previewControlsText('sourceVideoNode.controls.captureFrame')),
          Object.assign(_0x34d800.style, {
            cursor: 'pointer',
            color: 'var(--media-control-button-text)',
            display: 'flex',
            alignItems: 'center',
          }),
          (_0x34d800.innerHTML =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>'),
          _0x1b5c57.appendChild(_0x5c4380),
          _0x1b5c57.appendChild(_0xb19887),
          _0x1b5c57.appendChild(_0x2adf5f),
          _0x1b5c57.appendChild(_0x46ceff),
          _0x1b5c57.appendChild(_0x34d800),
          _0x1b5c57.addEventListener('pointerdown', (_0x540c5a) => _0x540c5a.stopPropagation()),
          _0x1b5c57.addEventListener('click', (_0x5bebee) => _0x5bebee.stopPropagation()),
          _0x5c4380.addEventListener('click', (_0x1c4f10) => {
            _0x1c4f10.stopPropagation();
            if (_0x11b51c.isActiveFor(this.nodeId)) return;
            const _0x4d9ec3 = this._getActivePreviewVideoEl();
            if (!_0x4d9ec3) return;
            (this._toggleVideoPlayPause(_0x4d9ec3, { loop: _0x1c4f10.altKey === true }),
              this._syncVideoControlsFromVideo(_0x4d9ec3));
          }));
        const _0x438046 = (_0x1a9ee0) => {
            if (!this._progressBarEl) return 0;
            const _0x3783e3 = this._progressBarEl.getBoundingClientRect(),
              _0x24a799 = _0x3783e3.width || 0;
            if (!_0x24a799) return 0;
            const _0x5f3c53 = _0x1a9ee0.clientX - _0x3783e3.left;
            if (!Number.isFinite(_0x5f3c53)) return 0;
            return Math.max(0, Math.min(1, _0x5f3c53 / _0x24a799));
          },
          _0x421745 = (_0x116487) => {
            if (this._progressFillEl) this._progressFillEl.style.width = _0x116487 * 100 + '%';
            const _0x2d55c8 = this._getActivePreviewVideoEl(),
              _0x5877e1 = this._getActiveVideoDuration(_0x2d55c8);
            this._timeCurrentEl &&
              _0x5877e1 > 0 &&
              (this._timeCurrentEl.textContent = this._fmtVideoTime(_0x116487 * _0x5877e1));
          },
          _0x4c504d = (_0x30e57f) => {
            const _0xf059fc = this._getActivePreviewVideoEl();
            this._seekActiveVideoByPos(_0xf059fc, _0x30e57f);
          };
        (_0x2adf5f.addEventListener('pointerdown', (_0x308037) => {
          (_0x308037.stopPropagation(), _0x308037.preventDefault());
          if (_0x11b51c.isActiveFor(this.nodeId)) return;
          const _0x56f9c4 = this._getActivePreviewVideoEl();
          if (!_0x56f9c4) return;
          const _0x2218ca = !!String(_0x56f9c4.getAttribute('src') || '').trim();
          ((this._isManualControl = true),
            (this._isManualLoopPlayback = false),
            (_0x56f9c4.loop = false),
            this._autoPlayToken++,
            (this._hoverManualPause = true),
            _0x56f9c4.pause());
          if (!_0x2218ca) {
            this._ensureVideoSrcFor(_0x56f9c4).then((_0x2fd41a) => {
              if (!_0x2fd41a) return;
              const _0x20a4e1 = _0x438046(_0x308037);
              (_0x421745(_0x20a4e1), _0x4c504d(_0x20a4e1));
            });
            return;
          }
          this._isProgressDragging = true;
          const _0x1ae6ce = _0x438046(_0x308037);
          (_0x421745(_0x1ae6ce), _0x4c504d(_0x1ae6ce));
          const _0x175954 = (_0x1242e4) => {
              const _0x67f590 = _0x438046(_0x1242e4);
              (_0x421745(_0x67f590), _0x4c504d(_0x67f590));
            },
            _0x8dc115 = (_0x2193c0) => {
              (_0x2193c0.stopPropagation(),
                (this._isProgressDragging = false),
                window.removeEventListener('pointermove', _0x175954, true),
                window.removeEventListener('pointerup', _0x8dc115, true));
              const _0x5a34f8 = this._getActivePreviewVideoEl();
              this._syncVideoControlsFromVideo(_0x5a34f8);
            };
          (window.addEventListener('pointermove', _0x175954, true),
            window.addEventListener('pointerup', _0x8dc115, true));
        }),
          _0x34d800.addEventListener('click', (_0x5ea6ae) => {
            _0x5ea6ae.stopPropagation();
            if (_0x11b51c.isActiveFor(this.nodeId)) return;
            void this._captureCurrentFrameFromActiveVideo();
          }),
          this.previewEl.appendChild(_0x1b5c57),
          (this._controlsEl = _0x1b5c57),
          (this._playBtnEl = _0x5c4380),
          (this._timeCurrentEl = _0xb19887),
          (this._timeTotalEl = _0x46ceff),
          (this._progressBarEl = _0x2adf5f),
          (this._progressFillEl = _0x2d1bac),
          (this._snapBtnEl = _0x34d800),
          this._updatePlayIcon(true));
      }
      this._setVideoOverlaysVisible(!this.isNoResult);
    }
    ['_setVideoOverlaysVisible'](_0x2dfe53) {
      const _0x458fbf = _0x239343.getState().nodes?.[this.nodeId] || this._data || {},
        _0x364327 = !!_0x458fbf.isVideosExpanded,
        _0x35dc06 = !!_0x2dfe53 && !_0x364327 && !_0x11b51c.isActiveFor(this.nodeId);
      if (this._muteBtnEl) this._muteBtnEl.style.display = _0x35dc06 ? 'flex' : 'none';
      if (this._centerIndicatorEl) this._centerIndicatorEl.style.display = _0x35dc06 ? 'flex' : 'none';
      if (this._controlsEl) this._controlsEl.style.display = _0x35dc06 ? 'flex' : 'none';
      if (_0x35dc06) this._syncVideoControlsFromVideo(this._getActivePreviewVideoEl());
    }
    ['_syncMuteBtnIconImpl']() {
      if (!this._muteIconMutedEl || !this._muteIconUnmutedEl) return;
      ((this._muteIconMutedEl.style.display = this._isMuted ? '' : 'none'),
        (this._muteIconUnmutedEl.style.display = this._isMuted ? 'none' : ''));
    }
    ['_syncMutedStateFromNodeData'](_0x47473b = this._data) {
      ((this._isMuted = resolveVideoMutedPreference(_0x47473b)),
        this._applyMuteStateToPreviewVideos(),
        this._syncMuteBtnIcon());
    }
    ['_setPreviewMuted'](_0x243296, { persist: persist = false } = {}) {
      this._isMuted = !!_0x243296;
      if (!persist) return;
      const _0x7cc7bb = _0x239343.getState().nodes?.[this.nodeId] || this._data || {},
        _0x474246 = buildVideoMutedPatch(_0x7cc7bb, this._isMuted);
      if (!_0x474246 || typeof _0x239343.updateNodeData !== 'function') return;
      (_0x239343.updateNodeData(this.nodeId, _0x474246), (this._data = { ..._0x7cc7bb, ..._0x474246 }));
    }
    ['_applyMuteStateToPreviewVideos']() {
      if (!this.previewEl) return;
      const _0x2ca679 =
          this._data && Number.isFinite(Number(this._data.mainVideoIndex))
            ? Number(this._data.mainVideoIndex)
            : Number.isFinite(Number(this._lastMainIdx))
              ? Number(this._lastMainIdx)
              : 0,
        _0x1886d9 = Math.max(0, Math.trunc(_0x2ca679)),
        _0x5d3ffb = Array.isArray(this._multiLayerEls) && this._multiLayerEls.length > 0;
      if (_0x5d3ffb) {
        for (let _0x262f0d = 0; _0x262f0d < this._multiLayerEls.length; _0x262f0d++) {
          const _0x1f3908 = this._multiLayerEls[_0x262f0d];
          if (!_0x1f3908) continue;
          _0x1f3908.muted = _0x262f0d === _0x1886d9 ? !!this._isMuted : true;
        }
        this._expandPanel &&
          this._expandPanel.querySelectorAll('video').forEach((_0x3204ee) => {
            _0x3204ee.muted = true;
          });
        return;
      }
      this.previewEl.querySelectorAll('video').forEach((_0x33d082) => {
        _0x33d082.muted = !!this._isMuted;
      });
    }
    ['_setCenterIndicatorIcon'](_0x33417d) {
      if (!this._centerIndicatorInnerEl) return;
      const _0x245a6a = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      (_0x245a6a.setAttribute('width', '28'),
        _0x245a6a.setAttribute('height', '28'),
        _0x245a6a.setAttribute('viewBox', '0 0 24 24'),
        _0x245a6a.setAttribute('fill', 'currentColor'),
        (_0x245a6a.style.color = 'var(--canvas-white)'),
        _0x33417d === 'play'
          ? (_0x245a6a.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"></polygon>')
          : (_0x245a6a.innerHTML =
              '<rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect>'),
        (this._centerIndicatorInnerEl.innerHTML = ''),
        this._centerIndicatorInnerEl.appendChild(_0x245a6a));
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
    ['_flashCenterIndicator'](_0x3952ba) {
      if (!this._centerIndicatorInnerEl) return;
      (this._centerIndicatorTimer &&
        (clearTimeout(this._centerIndicatorTimer), (this._centerIndicatorTimer = null)),
        this._setCenterIndicatorIcon(_0x3952ba),
        (this._centerIndicatorInnerEl.style.opacity = '1'),
        (this._centerIndicatorInnerEl.style.transform = 'scale(1)'),
        (this._centerIndicatorTimer = setTimeout(() => {
          if (!this._centerIndicatorInnerEl) return;
          if (_0x3952ba === 'pause') this._showPausedCenterIndicator();
          else this._hideCenterIndicator();
          this._centerIndicatorTimer = null;
        }, 0x208)));
    }
    ['_getActivePreviewVideoEl']() {
      const _0x43ab36 =
          this._data && Number.isFinite(Number(this._data.mainVideoIndex))
            ? Number(this._data.mainVideoIndex)
            : Number.isFinite(Number(this._lastMainIdx))
              ? Number(this._lastMainIdx)
              : 0,
        _0x256b32 = Math.max(0, Math.trunc(_0x43ab36));
      if (Array.isArray(this._multiLayerEls) && this._multiLayerEls.length > 0)
        return this._multiLayerEls[_0x256b32] || this._multiLayerEls[0] || this.videoEl || null;
      return this.videoEl || null;
    }
    ['_toggleVideoPlayPause'](_0x22381f, _0x5e8b07 = {}) {
      if (!_0x22381f) return;
      const _0x9c6e0f = _0x5e8b07?.loop === true;
      ((this._isManualControl = true), this._autoPlayToken++);
      const _0x2a0336 = !!String(_0x22381f.getAttribute('src') || '').trim();
      if (_0x22381f.paused) {
        ((this._hoverManualPause = false),
          (this._isManualLoopPlayback = _0x9c6e0f),
          (_0x22381f.loop = _0x9c6e0f));
        if (typeof this._playPreviewVideoWithRecovery === 'function') {
          void this._playPreviewVideoWithRecovery(_0x22381f, {
            reason: 'manual',
            shouldContinue: () => this._isManualControl === true,
          }).then((_0x3f207d) => {
            if (!_0x3f207d) {
              ((this._isManualLoopPlayback = false), (_0x22381f.loop = false));
              return;
            }
            (this._flashCenterIndicator('play'), this._syncVideoControlsFromVideo(_0x22381f));
          });
          return;
        }
        if (!_0x2a0336) {
          this._ensureVideoSrcFor(_0x22381f).then((_0x1e2437) => {
            if (!_0x1e2437) {
              ((this._isManualLoopPlayback = false), (_0x22381f.loop = false));
              return;
            }
            const _0x3ba625 = _0x22381f.play();
            (_0x3ba625 &&
              typeof _0x3ba625.catch === 'function' &&
              _0x3ba625.catch(() => {
                ((this._isManualLoopPlayback = false), (_0x22381f.loop = false));
              }),
              this._flashCenterIndicator('play'),
              this._syncVideoControlsFromVideo(_0x22381f));
          });
          return;
        }
        const _0x3a7b5e = _0x22381f.play();
        (_0x3a7b5e &&
          typeof _0x3a7b5e.catch === 'function' &&
          _0x3a7b5e.catch(() => {
            ((this._isManualLoopPlayback = false), (_0x22381f.loop = false));
          }),
          this._flashCenterIndicator('play'),
          this._syncVideoControlsFromVideo(_0x22381f));
      } else
        ((this._hoverManualPause = true),
          (this._isManualLoopPlayback = false),
          (_0x22381f.loop = false),
          _0x22381f.pause(),
          this._showPausedCenterIndicator(),
          this._syncVideoControlsFromVideo(_0x22381f));
    }
    ['_updatePlayIcon'](_0x2d773a) {
      if (!this._playBtnEl) return;
      this._playBtnEl.replaceChildren();
      const _0x5c398a = 'http://www.w3.org/2000/svg',
        _0x340af6 = document.createElementNS(_0x5c398a, 'svg');
      (_0x340af6.setAttribute('width', '16'),
        _0x340af6.setAttribute('height', '16'),
        _0x340af6.setAttribute('viewBox', '0 0 24 24'),
        _0x340af6.setAttribute('fill', 'currentColor'));
      if (_0x2d773a) {
        const _0x293cef = document.createElementNS(_0x5c398a, 'polygon');
        (_0x293cef.setAttribute('points', '5 3 19 12 5 21 5 3'), _0x340af6.appendChild(_0x293cef));
      } else {
        const _0x50d5e2 = document.createElementNS(_0x5c398a, 'rect');
        (_0x50d5e2.setAttribute('x', '6'),
          _0x50d5e2.setAttribute('y', '4'),
          _0x50d5e2.setAttribute('width', '4'),
          _0x50d5e2.setAttribute('height', '16'));
        const _0x4f8482 = document.createElementNS(_0x5c398a, 'rect');
        (_0x4f8482.setAttribute('x', '14'),
          _0x4f8482.setAttribute('y', '4'),
          _0x4f8482.setAttribute('width', '4'),
          _0x4f8482.setAttribute('height', '16'),
          _0x340af6.appendChild(_0x50d5e2),
          _0x340af6.appendChild(_0x4f8482));
      }
      this._playBtnEl.appendChild(_0x340af6);
    }
    ['_fmtVideoTime'](_0x32893a) {
      const _0x4a1f38 = Number(_0x32893a);
      if (!Number.isFinite(_0x4a1f38) || _0x4a1f38 <= 0) return '0:00';
      return Math.floor(_0x4a1f38 / 60) + ':' + String(Math.floor(_0x4a1f38 % 60)).padStart(2, '0');
    }
    ['_getActiveVideoDuration'](_0x273d50) {
      if (_0x273d50) {
        const _0x2851f8 = Number(_0x273d50.duration);
        if (Number.isFinite(_0x2851f8) && _0x2851f8 > 0) return _0x2851f8;
        const _0x287b27 = _0x273d50.seekable;
        if (_0x287b27 && _0x287b27.length) {
          const _0x6536d8 = Number(_0x287b27.end(_0x287b27.length - 1));
          if (Number.isFinite(_0x6536d8) && _0x6536d8 > 0) return _0x6536d8;
        }
      }
      const _0x2f0641 = Number(this._data?.videoDuration);
      if (Number.isFinite(_0x2f0641) && _0x2f0641 > 0) return _0x2f0641;
      return 0;
    }
    ['_syncVideoControlsFromVideo'](_0x2aac8e) {
      if (!this._controlsEl || !this._playBtnEl || !this._progressFillEl) return;
      const _0x338302 = _0x2aac8e || this._getActivePreviewVideoEl();
      if (!_0x338302) {
        (this._updatePlayIcon(true), (this._progressFillEl.style.width = '0%'));
        if (this._timeCurrentEl) this._timeCurrentEl.textContent = '0:00';
        if (this._timeTotalEl) this._timeTotalEl.textContent = '0:00';
        return;
      }
      const _0x50a10c = this._getActiveVideoDuration(_0x338302),
        _0x417fa8 = Math.max(0, Number(_0x338302.currentTime) || 0),
        _0xf71913 = _0x50a10c > 0 ? Math.max(0, Math.min(1, _0x417fa8 / _0x50a10c)) : 0;
      if (!this._isProgressDragging && !this._isProgressSeeking) {
        this._progressFillEl.style.width = _0xf71913 * 100 + '%';
        if (this._timeCurrentEl) this._timeCurrentEl.textContent = this._fmtVideoTime(_0x417fa8);
      }
      if (this._timeTotalEl) this._timeTotalEl.textContent = this._fmtVideoTime(_0x50a10c);
      this._updatePlayIcon(!!_0x338302.paused);
    }
    ['_seekActiveVideoByPos'](_0x37b024, _0x15d232) {
      const _0x179671 = _0x37b024 || this._getActivePreviewVideoEl();
      if (!_0x179671) return;
      const _0x5be06b = this._getActiveVideoDuration(_0x179671);
      if (!Number.isFinite(_0x5be06b) || _0x5be06b <= 0) return;
      const _0x521f67 = Math.max(0, Math.min(1, Number(_0x15d232) || 0)),
        _0x3fe0c1 = _0x521f67 * _0x5be06b;
      this._isProgressSeeking = true;
      const _0x418fbd = ++this._progressSeekToken;
      _0x179671.currentTime = _0x3fe0c1;
      if (this._progressFillEl) this._progressFillEl.style.width = _0x521f67 * 100 + '%';
      if (this._timeCurrentEl) this._timeCurrentEl.textContent = this._fmtVideoTime(_0x3fe0c1);
      queueMicrotask(() => {
        if (_0x418fbd !== this._progressSeekToken) return;
        ((this._isProgressSeeking = false), this._syncVideoControlsFromVideo(_0x179671));
      });
    }
    async ['_captureCurrentFrameFromActiveVideo']() {
      const _0x3d01e3 = this._getActivePreviewVideoEl();
      if (!_0x3d01e3) return;
      if (!getVideoFrameSource(_0x3d01e3)) {
        const _0x48154 = await this._ensureVideoSrcFor(_0x3d01e3);
        if (!_0x48154) {
          window.showToast?.(previewControlsText('videoFrameExtraction.videoNotLoaded'), 'info');
          return;
        }
      }
      if (!isVideoFrameReady(_0x3d01e3)) {
        const _0xe89bfc = await waitForVideoFrame(_0x3d01e3);
        if (!_0xe89bfc) {
          window.showToast?.(previewControlsText('videoFrameExtraction.videoNotLoaded'), 'info');
          return;
        }
      }
      const _0x31709b = _0x3d01e3.videoWidth || 0,
        _0x46673f = _0x3d01e3.videoHeight || 0;
      if (!_0x31709b || !_0x46673f) return;
      let _0x9f93f3 = null;
      try {
        _0x9f93f3 = await captureVideoFrameSnapshot(_0x3d01e3, { fileNamePrefix: 'ai_video_frame' });
      } catch (_0x419ef5) {
        (console.warn('[AIGenVideoNode] capture frame failed:', _0x419ef5),
          window.showToast?.(previewControlsText('videoFrameExtraction.captureUnsupported'), 'error'));
        return;
      }
      if (!_0x9f93f3?.blob) return;
      const _0xcf4e44 = _0x239343.getState().nodes[this.nodeId];
      if (!_0xcf4e44) return;
      const _0xa3b57c = Number(_0xcf4e44.videoFps),
        _0x5107b8 = Number(_0xcf4e44.videoFrameCount),
        _0x2ad1c7 =
          Number(_0xcf4e44.videoDuration) > 0
            ? Number(_0xcf4e44.videoDuration)
            : this._getActiveVideoDuration(_0x3d01e3),
        _0x35f0b5 =
          Number.isFinite(_0xa3b57c) && _0xa3b57c > 0
            ? _0xa3b57c
            : Number.isFinite(_0x5107b8) && _0x5107b8 > 0 && Number.isFinite(_0x2ad1c7) && _0x2ad1c7 > 0
              ? _0x5107b8 / _0x2ad1c7
              : 0;
      let _0x108933 = 0;
      if (Number.isFinite(_0x35f0b5) && _0x35f0b5 > 0)
        ((_0x108933 = Math.floor(Math.max(0, Number(_0x3d01e3.currentTime) || 0) * _0x35f0b5) + 1),
          Number.isFinite(_0x5107b8) && _0x5107b8 > 0
            ? (_0x108933 = Math.max(1, Math.min(Math.round(_0x5107b8), _0x108933)))
            : (_0x108933 = Math.max(1, _0x108933)));
      else {
        const _0x32016d = Math.max(1, Math.floor(Number(_0xcf4e44.snapSeq) || 0) + 1);
        ((_0x108933 = _0x32016d), _0x239343.updateNodeData(this.nodeId, { snapSeq: _0x32016d }));
        const _0x4fe063 =
            (Array.isArray(_0xcf4e44.videos) &&
              _0xcf4e44.videos[Math.max(0, Number(_0xcf4e44.mainVideoIndex) || 0)]) ||
            (Array.isArray(_0xcf4e44.videos) ? _0xcf4e44.videos[0] : null) ||
            _0xcf4e44,
          _0x54155f = this._resolveVideoMetaSrcFromVideoData(_0x4fe063);
        if (_0x54155f) this._maybeFetchVideoMeta(_0x54155f);
      }
      const _0x101d09 = _0x323bfe(_0x31709b, _0x46673f),
        _0x492461 = _0x231b5b(_0x239343.getState().nodes, _0xcf4e44, _0x101d09.width, _0x101d09.height),
        _0x4b773e = 'src-img-' + Date.now(),
        _0x2aee8a = createCapturePreviewUrl(_0x9f93f3.blob);
      (_0x239343.addNode(
        _0x424437({
          id: _0x4b773e,
          type: 'source-image',
          name: previewControlsText('videoFrameExtraction.capturedFrameName', { frameIndex: _0x108933 }),
          capturePreviewUrl: _0x2aee8a,
          captureSavePending: true,
          captureSaveError: null,
          originalWidth: _0x9f93f3.originalWidth,
          originalHeight: _0x9f93f3.originalHeight,
          fileName: _0x9f93f3.fileName,
          x: _0x492461.x,
          y: _0x492461.y,
          width: _0x101d09.width,
          height: _0x101d09.height,
          needsAutoResize: false,
        }),
      ),
        saveVideoFrameSnapshot(_0x9f93f3, _0x2a722b)
          .then((_0x33b1a9) => {
            if (!_0x239343.getStateRaw().nodes?.[_0x4b773e]) return;
            _0x239343.updateNodeData(_0x4b773e, {
              src: _0x33b1a9.src,
              localPath: _0x33b1a9.localPath,
              originalLocalPath: _0x33b1a9.originalLocalPath,
              displayLocalPath: _0x33b1a9.displayLocalPath,
              thumbLocalPath: _0x33b1a9.thumbLocalPath,
              originalWidth: _0x33b1a9.originalWidth,
              originalHeight: _0x33b1a9.originalHeight,
              fileName: _0x33b1a9.fileName,
              captureSavePending: false,
              captureSaveError: null,
            });
          })
          .catch((_0x404f92) => {
            const _0x3387eb = String(
              _0x404f92?.message || previewControlsText('videoFrameExtraction.localSaveFailed'),
            );
            (console.warn('[AIGenVideoNode] save captured frame failed:', _0x404f92),
              _0x239343.getStateRaw().nodes?.[_0x4b773e] &&
                _0x239343.updateNodeData(_0x4b773e, {
                  captureSavePending: false,
                  captureSaveError: _0x3387eb,
                }),
              window.showToast?.(previewControlsText('videoFrameExtraction.shownButSaveFailed'), 'warning'));
          }));
    }
  }
  return _0x5558ca.prototype;
}
