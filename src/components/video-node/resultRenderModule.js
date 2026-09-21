import {
  attachVideoPlaybackRecovery,
  getVideoCurrentSource,
  logVideoPlaybackEvent,
  playVideoWithRecovery,
} from './mediaPlaybackRecovery.js';
import { localPathToUrl, urlToLocalPath } from '../../utils/localMediaPath.js';
import {
  attachMediaElementPlaybackSource,
  isMediaElementPlaybackSource,
} from '../../services/desktopMediaBlobSource.js';
import { getTaskMessage, isTaskCancelled, isTaskFailed } from '../../core/generationTaskUiState.js';
import { t } from '../../i18n/index.js';
function videoResultRenderText(_0x1fd40c, _0x1d7e26 = {}) {
  return t('videoResultRender.' + _0x1fd40c, _0x1d7e26);
}
function isDesktopRenderer() {
  return !!globalThis.window?.electronAPI;
}
function isLikelyPosterImageUrl(_0x557be0) {
  const _0x4804cc = String(_0x557be0 || '').trim();
  if (!_0x4804cc) return false;
  if (/^(data:image\/|blob:|aic-local-preview:)/i.test(_0x4804cc)) return true;
  return /\.(?:png|jpe?g|webp|gif|avif|bmp)(?:[?#].*)?$/i.test(_0x4804cc);
}
export function createVideoNodeResultRenderModule(_0x41352c) {
  const {
    store: _0x989779,
    api: _0x2ef5c7,
    getImage: _0x55ea55,
    ensureThumbDecoded: _0x47e14e,
    buildApiUrl: _0x33d8cc,
    VideoKeyingController: _0x4a432e,
  } = _0x41352c;
  class _0x10dd04 {
    ['_getPreviewVideoRecoveryLabel'](_0x24cb5a, _0x5cb427 = 'preview') {
      const _0x10bbe8 = String(_0x24cb5a?.dataset?.idx ?? ''),
        _0x49c064 = _0x10bbe8 ? _0x5cb427 + ':' + _0x10bbe8 : _0x5cb427;
      return 'ai-video:' + this.nodeId + ':' + _0x49c064;
    }
    ['_attachPreviewVideoRecovery'](_0x101453, _0x418b39 = 'preview') {
      if (!_0x101453) return null;
      const _0xc27ca8 = _0x418b39 === 'hover' || _0x418b39 === 'fullscreen';
      return attachVideoPlaybackRecovery(_0x101453, {
        label: this._getPreviewVideoRecoveryLabel(_0x101453, _0x418b39),
        ensureSrc: () => this._ensureVideoSrcFor(_0x101453, { forPlayback: true }),
        minBufferAhead: _0xc27ca8 ? 0.5 : undefined,
        readyTimeoutMs: _0xc27ca8 ? 0x15e : undefined,
        recoveryDebounceMs: _0xc27ca8 ? 150 : undefined,
        recoveryCooldownMs: _0xc27ca8 ? 0x1f4 : undefined,
        shouldRecover: () =>
          _0x101453.isConnected !== false && (this._isHovered || this._isManualControl || !_0x101453.paused),
      });
    }
    ['_logPreviewVideoPlaybackEvent'](_0xd820b0, _0xe35c25, _0x2396c9 = 'preview') {
      if (!_0xd820b0) return;
      (this._attachPreviewVideoRecovery(_0xd820b0, _0x2396c9),
        logVideoPlaybackEvent(_0xd820b0, _0xe35c25, {
          label: this._getPreviewVideoRecoveryLabel(_0xd820b0, _0x2396c9),
        }));
    }
    async ['_playPreviewVideoWithRecovery'](_0x492622, _0x4fb599 = {}) {
      if (!_0x492622) return false;
      const _0x2578fc = _0x4fb599.reason || 'preview';
      return (
        this._attachPreviewVideoRecovery(_0x492622, _0x2578fc),
        playVideoWithRecovery(_0x492622, {
          label: this._getPreviewVideoRecoveryLabel(_0x492622, _0x2578fc),
          ensureSrc: () => this._ensureVideoSrcFor(_0x492622, { forPlayback: true }),
          minBufferAhead: _0x2578fc === 'hover' ? 0.5 : undefined,
          readyTimeoutMs: _0x2578fc === 'hover' ? 0x15e : undefined,
          recoveryDebounceMs: _0x2578fc === 'hover' ? 150 : undefined,
          recoveryCooldownMs: _0x2578fc === 'hover' ? 0x1f4 : undefined,
          shouldRecover: () =>
            _0x492622.isConnected !== false &&
            (this._isHovered || this._isManualControl || !_0x492622.paused),
          shouldContinue:
            typeof _0x4fb599.shouldContinue === 'function' ? _0x4fb599.shouldContinue : undefined,
        })
      );
    }
    async ['_ensureVideoSrcFor'](_0x45df28, _0x473f92 = {}) {
      if (!_0x45df28) return false;
      const _0xa10ebc = !!String(_0x45df28.getAttribute('src') || '').trim();
      if (_0xa10ebc)
        return (
          _0x473f92.forPlayback === true && _0x45df28.preload !== 'auto' && (_0x45df28.preload = 'auto'),
          true
        );
      const _0x354d3a = _0x989779.getState(),
        _0x229775 = _0x354d3a.nodes?.[this.nodeId] || this._data || {},
        _0x1e4078 = Array.isArray(_0x229775.videos) ? _0x229775.videos : [],
        _0x5cf006 = Number(_0x45df28.dataset?.idx),
        _0x1443bf = Number.isFinite(_0x5cf006) ? Math.max(0, Math.trunc(_0x5cf006)) : 0,
        _0x194549 = _0x1e4078[_0x1443bf] || null;
      if (!_0x194549) return false;
      let _0x57cfd5 = this._resolveVideoPlaybackUrl(_0x194549);
      if (!_0x57cfd5 && _0x194549.thumbId) {
        const _0xe80515 = String(_0x194549.thumbId || '');
        if (_0xe80515) {
          const _0x541929 = this._cachedVideoUrls.get(_0xe80515);
          if (_0x541929) _0x57cfd5 = _0x541929;
          else {
            let _0x9fb841 = null;
            try {
              _0x9fb841 = await _0x55ea55(_0xe80515);
            } catch {
              _0x9fb841 = null;
            }
            if (_0x9fb841) {
              const _0x255634 = URL.createObjectURL(_0x9fb841);
              (this._cachedVideoUrls.set(_0xe80515, _0x255634), (_0x57cfd5 = _0x255634));
            }
          }
        }
      }
      if (!_0x57cfd5) return false;
      return (
        await attachMediaElementPlaybackSource(_0x45df28, _0x57cfd5, {
          preload: 'auto',
          warmRanges: false,
          load: _0x473f92.forPlayback === true,
        }),
        true
      );
    }
    ['_resolveVideoPlaybackUrl'](_0x9128cf) {
      if (!_0x9128cf || typeof _0x9128cf !== 'object') return '';
      return (
        this._resolveMediaUrl(localPathToUrl(_0x9128cf.displayLocalPath)) ||
        this._resolveMediaUrl(localPathToUrl(_0x9128cf.localPath)) ||
        this._resolveMediaUrl(_0x9128cf.videoUrl) ||
        ''
      );
    }
    ['_resolveMediaUrl'](_0x4c46fb) {
      const _0x45e56b = String(_0x4c46fb || '').trim();
      if (!_0x45e56b) return '';
      if (
        _0x45e56b.startsWith('http://') ||
        _0x45e56b.startsWith('https://') ||
        _0x45e56b.startsWith('blob:') ||
        _0x45e56b.startsWith('data:')
      )
        return _0x45e56b;
      const _0x4a6bde = localPathToUrl(_0x45e56b);
      if (_0x4a6bde) return _0x33d8cc(_0x4a6bde);
      if (_0x45e56b.startsWith('/')) return _0x33d8cc(_0x45e56b);
      return _0x33d8cc('/' + _0x45e56b.replace(/^\/+/, ''));
    }
    ['_resolveDeferredVideoPosterUrl']() {
      const _0x4045db = this._data || {},
        _0x3274b4 = Array.isArray(_0x4045db.videos) ? _0x4045db.videos : [],
        _0x52e082 = Number(_0x4045db.mainVideoIndex),
        _0x59545a = Number.isFinite(_0x52e082) ? Math.max(0, Math.trunc(_0x52e082)) : 0,
        _0xd25088 = _0x3274b4[_0x59545a] || _0x3274b4[0] || null,
        _0x277bb2 = [
          _0xd25088?.posterUrl,
          _0xd25088?.thumbUrl,
          _0xd25088?.thumbnailUrl,
          localPathToUrl(_0xd25088?.posterLocalPath),
          localPathToUrl(_0xd25088?.thumbLocalPath),
          localPathToUrl(_0xd25088?.thumbnailLocalPath),
          _0x4045db.posterUrl,
          _0x4045db.thumbUrl,
          _0x4045db.thumbnailUrl,
          localPathToUrl(_0x4045db.posterLocalPath),
          localPathToUrl(_0x4045db.thumbLocalPath),
          localPathToUrl(_0x4045db.thumbnailLocalPath),
        ];
      for (const _0x154e49 of _0x277bb2) {
        const _0x3007f6 = String(_0x154e49 || '').trim();
        if (!isLikelyPosterImageUrl(_0x3007f6)) continue;
        const _0x172bad = this._resolveMediaUrl(_0x3007f6);
        if (_0x172bad) return _0x172bad;
      }
      return '';
    }
    ['_removeDeferredVideoPosterPreview']() {
      (this._deferredPosterImgEl?.remove?.(), (this._deferredPosterImgEl = null));
    }
    ['_showDeferredVideoPosterPreview']() {
      const _0x2c61f4 = this._resolveDeferredVideoPosterUrl();
      if (!_0x2c61f4 || !this.previewEl) {
        this._removeDeferredVideoPosterPreview();
        if (this._placeholderEl) this._placeholderEl.style.display = 'flex';
        return (this._setVideoOverlaysVisible?.(false), false);
      }
      let _0x5b9749 = this._deferredPosterImgEl;
      if (!_0x5b9749 || _0x5b9749.parentNode !== this.previewEl) {
        ((_0x5b9749 = document.createElement('img')),
          _0x5b9749.classList?.add?.('v2-media-preview', 'ai-video-deferred-poster'),
          (_0x5b9749.draggable = false),
          (_0x5b9749.alt = ''),
          (_0x5b9749.decoding = 'async'),
          (_0x5b9749.loading = 'eager'));
        try {
          _0x5b9749.fetchPriority = 'high';
        } catch {}
        if (!_0x5b9749.style) _0x5b9749.style = {};
        (Object.assign(_0x5b9749.style, {
          position: 'absolute',
          inset: '0',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: '8px',
          pointerEvents: 'none',
        }),
          this.previewEl.appendChild(_0x5b9749),
          (this._deferredPosterImgEl = _0x5b9749));
      }
      const _0x2aaa54 = _0x5b9749.getAttribute?.('src') || _0x5b9749.src || '';
      _0x2aaa54 !== _0x2c61f4 &&
        (typeof _0x5b9749.setAttribute === 'function' && _0x5b9749.setAttribute('src', _0x2c61f4),
        (_0x5b9749.src = _0x2c61f4));
      if (this._placeholderEl) this._placeholderEl.style.display = 'none';
      return (this._setVideoOverlaysVisible?.(false), _0x47e14e?.(_0x2c61f4), true);
    }
    ['_resolveVideoMetaSrcFromVideoData'](_0x3b5dbd) {
      if (!_0x3b5dbd) return '';
      const _0x1d2ec5 = localPathToUrl(_0x3b5dbd.displayLocalPath);
      if (_0x1d2ec5) return _0x1d2ec5;
      const _0x2002f0 = localPathToUrl(_0x3b5dbd.localPath);
      if (_0x2002f0) return _0x2002f0;
      const _0x3f5232 = String(_0x3b5dbd.videoUrl || '').trim();
      if (!_0x3f5232) return '';
      if (_0x3f5232.startsWith('blob:') || _0x3f5232.startsWith('data:')) return '';
      return localPathToUrl(urlToLocalPath(_0x3f5232));
    }
    ['_getVideoSourceKey'](_0x482939) {
      if (!_0x482939 || typeof _0x482939 !== 'object') return '';
      return (
        String(_0x482939.localPath || '').trim() ||
        String(_0x482939.videoUrl || '').trim() ||
        String(_0x482939.src || '').trim() ||
        String(_0x482939.thumbId || '').trim()
      );
    }
    ['_isVideoMarkedUnavailable'](_0x5b5f8e) {
      const _0xf52fa0 = this._getVideoSourceKey(_0x5b5f8e);
      if (!_0xf52fa0) return false;
      const _0x548101 = String(_0x5b5f8e?.mediaUnavailableSource || '').trim();
      return _0x5b5f8e?.mediaUnavailable === true && _0x548101 === _0xf52fa0;
    }
    ['_isVideoThumbMarkedUnavailable'](_0x1a4ddd, _0x257713 = '') {
      const _0x53f381 = String(_0x257713 || this._resolveVideoMetaSrcFromVideoData(_0x1a4ddd)).trim();
      if (!_0x53f381) return false;
      return String(_0x1a4ddd?.videoThumbUnavailableSource || '').trim() === _0x53f381;
    }
    ['_markVideoThumbUnavailable'](_0x45516b, _0x101760, _0x5a524f = '') {
      const _0x47bb2f = String(_0x5a524f || this._resolveVideoMetaSrcFromVideoData(_0x101760)).trim();
      if (!_0x47bb2f) return;
      const _0x16859d = _0x989779.getState().nodes[this.nodeId];
      if (!_0x16859d) return;
      const _0x57ad60 = Array.isArray(_0x16859d.videos) ? _0x16859d.videos : [],
        _0x4053ba = Number(_0x16859d.mainVideoIndex),
        _0x570e47 = Number.isFinite(_0x4053ba) ? Math.max(0, Math.trunc(_0x4053ba)) : 0,
        _0x3efca8 = {};
      (_0x45516b < 0 || _0x45516b === _0x570e47) &&
        ((_0x3efca8.videoThumbUnavailableSource = _0x47bb2f), (_0x3efca8.thumbUrl = ''));
      if (_0x45516b >= 0 && _0x45516b < _0x57ad60.length) {
        const _0x29d626 = _0x57ad60[_0x45516b];
        if (_0x29d626 && typeof _0x29d626 === 'object') {
          const _0xe4e8d3 = _0x57ad60.slice();
          ((_0xe4e8d3[_0x45516b] = { ..._0x29d626, videoThumbUnavailableSource: _0x47bb2f, thumbUrl: '' }),
            (_0x3efca8.videos = _0xe4e8d3));
        }
      }
      if (Object.keys(_0x3efca8).length) _0x989779.updateNodeData(this.nodeId, _0x3efca8);
    }
    ['_markVideoUnavailable'](_0x12da3e, _0x2dfcdc) {
      const _0x51640d = this._getVideoSourceKey(_0x2dfcdc);
      if (!_0x51640d) return;
      const _0x2904a7 = _0x989779.getState().nodes[this.nodeId];
      if (!_0x2904a7) return;
      const _0x1166b6 = Array.isArray(_0x2904a7.videos) ? _0x2904a7.videos : [],
        _0x3cc74c = Number(_0x2904a7.mainVideoIndex),
        _0xe90941 = Number.isFinite(_0x3cc74c) ? Math.max(0, Math.trunc(_0x3cc74c)) : 0,
        _0x5e21b0 = { mediaUnavailable: true, mediaUnavailableSource: _0x51640d };
      if (_0x12da3e < 0 || _0x12da3e === _0xe90941) _0x5e21b0.thumbUrl = '';
      if (_0x12da3e >= 0 && _0x12da3e < _0x1166b6.length) {
        const _0x5d43a2 = _0x1166b6[_0x12da3e];
        if (_0x5d43a2 && typeof _0x5d43a2 === 'object') {
          const _0x5ce5de = _0x1166b6.slice();
          ((_0x5ce5de[_0x12da3e] = {
            ..._0x5d43a2,
            mediaUnavailable: true,
            mediaUnavailableSource: _0x51640d,
            thumbUrl: '',
          }),
            (_0x5e21b0.videos = _0x5ce5de));
        }
      }
      _0x989779.updateNodeData(this.nodeId, _0x5e21b0);
    }
    ['_clearVideoUnavailable'](_0x488775, _0x5bd646) {
      const _0x5bdf96 = this._getVideoSourceKey(_0x5bd646);
      if (!_0x5bdf96) return;
      const _0xce4670 = _0x989779.getState().nodes[this.nodeId];
      if (!_0xce4670) return;
      const _0x371ca7 = {};
      _0xce4670.mediaUnavailable === true &&
        String(_0xce4670.mediaUnavailableSource || '') === _0x5bdf96 &&
        ((_0x371ca7.mediaUnavailable = false), (_0x371ca7.mediaUnavailableSource = ''));
      const _0x49ba05 = Array.isArray(_0xce4670.videos) ? _0xce4670.videos : [];
      if (_0x488775 >= 0 && _0x488775 < _0x49ba05.length) {
        const _0x149761 = _0x49ba05[_0x488775];
        if (
          _0x149761 &&
          typeof _0x149761 === 'object' &&
          _0x149761.mediaUnavailable === true &&
          String(_0x149761.mediaUnavailableSource || '') === _0x5bdf96
        ) {
          const _0x1625c3 = _0x49ba05.slice();
          ((_0x1625c3[_0x488775] = { ..._0x149761, mediaUnavailable: false, mediaUnavailableSource: '' }),
            (_0x371ca7.videos = _0x1625c3));
        }
      }
      if (Object.keys(_0x371ca7).length) _0x989779.updateNodeData(this.nodeId, _0x371ca7);
    }
    ['_shouldFetchVideoMetaForNodeInfo']() {
      try {
        const _0x3f7246 =
          typeof _0x989779.getStateRaw === 'function' ? _0x989779.getStateRaw() : _0x989779.getState();
        return _0x3f7246?.ui?.showVideoMeta === true;
      } catch {
        return false;
      }
    }
    async ['_maybeFetchVideoMeta'](_0x216d14) {
      if (!this._shouldFetchVideoMetaForNodeInfo()) return;
      const _0x585211 = String(_0x216d14 || '').trim();
      if (!_0x585211) return;
      const _0x2f0081 = _0x989779.getState().nodes[this.nodeId];
      if (!_0x2f0081) return;
      const _0x4b71a8 = String(_0x2f0081.videoMetaSrc || ''),
        _0x1bfde5 =
          Number.isFinite(Number(_0x2f0081.videoFps)) &&
          Number(_0x2f0081.videoFps) > 0 &&
          Number.isFinite(Number(_0x2f0081.videoFrameCount)) &&
          Number(_0x2f0081.videoFrameCount) > 0;
      if (_0x1bfde5 && _0x4b71a8 === _0x585211) return;
      _0x4b71a8 &&
        _0x4b71a8 !== _0x585211 &&
        _0x989779.updateNodeData(this.nodeId, {
          videoMetaSrc: _0x585211,
          videoFps: null,
          videoFrameCount: null,
          videoDuration: null,
          videoWidth: null,
          videoHeight: null,
        });
      const _0x40d020 = ++this._metaFetchToken;
      try {
        const _0x24945c = await _0x2ef5c7.fetchVideoMetaFromServer(_0x585211);
        if (_0x40d020 !== this._metaFetchToken) return;
        if (!_0x24945c || _0x24945c.success !== true) return;
        const _0x563ee9 = Number(_0x24945c.fps),
          _0x51b7f8 = Number(_0x24945c.frameCount),
          _0x8538a9 = Number(_0x24945c.duration),
          _0x55ed75 = Number(_0x24945c.width),
          _0xc4e70d = Number(_0x24945c.height),
          _0x3f5971 = { videoMetaSrc: _0x585211 };
        if (Number.isFinite(_0x563ee9) && _0x563ee9 > 0) _0x3f5971.videoFps = _0x563ee9;
        if (Number.isFinite(_0x51b7f8) && _0x51b7f8 > 0) _0x3f5971.videoFrameCount = Math.round(_0x51b7f8);
        if (Number.isFinite(_0x8538a9) && _0x8538a9 > 0) _0x3f5971.videoDuration = _0x8538a9;
        if (Number.isFinite(_0x55ed75) && _0x55ed75 > 0) _0x3f5971.videoWidth = Math.round(_0x55ed75);
        if (Number.isFinite(_0xc4e70d) && _0xc4e70d > 0) _0x3f5971.videoHeight = Math.round(_0xc4e70d);
        const _0x24004d = _0x989779.getState().nodes[this.nodeId];
        if (!_0x24004d) return;
        const _0x3b2def =
          String(_0x24004d.videoMetaSrc || '') !== String(_0x3f5971.videoMetaSrc || '') ||
          Number(_0x24004d.videoFps || 0) !== Number(_0x3f5971.videoFps || 0) ||
          Number(_0x24004d.videoFrameCount || 0) !== Number(_0x3f5971.videoFrameCount || 0) ||
          Number(_0x24004d.videoDuration || 0) !== Number(_0x3f5971.videoDuration || 0) ||
          Number(_0x24004d.videoWidth || 0) !== Number(_0x3f5971.videoWidth || 0) ||
          Number(_0x24004d.videoHeight || 0) !== Number(_0x3f5971.videoHeight || 0);
        if (_0x3b2def) _0x989779.updateNodeData(this.nodeId, _0x3f5971);
      } catch {}
    }
    ['_createStatusCard'](_0x35a4f0, _0xe780a5) {
      const _0x4b5ef2 = document.createElement('div');
      ((_0x4b5ef2.className = 'gen-status-card'),
        Object.assign(_0x4b5ef2.style, {
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
      const _0x1dd81d = Number(_0xe780a5) === 0,
        _0xa8b6eb = _0x1dd81d ? 'var(--green)' : 'var(--white-80)';
      return (
        (_0x4b5ef2.innerHTML =
          '\n            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' +
          _0xa8b6eb +
          '" stroke-width="2">\n                <circle cx="12" cy="12" r="10"/><path d="' +
          (_0x1dd81d ? 'M8 12l2.5 2.5L16 9' : 'M12 8v5') +
          '" />' +
          (_0x1dd81d ? '' : '<line x1="12" y1="16" x2="12.01" y2="16" />') +
          '\n            </svg>\n            <span style="color:' +
          _0xa8b6eb +
          ';font-size:12px;font-weight:600;line-height:1.4;">' +
          _0x35a4f0 +
          '</span>\n        '),
        _0x4b5ef2
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
    ['_getGenerationFailureMessage'](_0x4b99f9 = this._data) {
      if (!_0x4b99f9 || typeof _0x4b99f9 !== 'object') return '';
      const _0xbc7794 = isTaskFailed(_0x4b99f9) || isTaskCancelled(_0x4b99f9);
      if (!_0xbc7794) return '';
      return getTaskMessage(_0x4b99f9) || videoResultRenderText('generationFailed');
    }
    ['_createErrorCard'](_0x349ae6) {
      const _0x2298bc = document.createElement('div');
      ((_0x2298bc.className = 'gen-error-card'),
        Object.assign(_0x2298bc.style, {
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
      const _0xda41c4 = document.createElement('div');
      _0xda41c4.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      const _0x53284c = document.createElement('span');
      ((_0x53284c.textContent = videoResultRenderText('generationFailed')),
        Object.assign(_0x53284c.style, {
          color: 'var(--red)',
          fontSize: '12px',
          fontWeight: '600',
          lineHeight: '1.4',
        }));
      const _0x46ce9b = document.createElement('span');
      return (
        (_0x46ce9b.textContent = String(_0x349ae6 || videoResultRenderText('generationFailed'))),
        Object.assign(_0x46ce9b.style, {
          color: 'var(--white-50)',
          fontSize: '11px',
          lineHeight: '1.5',
          wordBreak: 'break-word',
          maxWidth: '100%',
        }),
        _0x2298bc.appendChild(_0xda41c4),
        _0x2298bc.appendChild(_0x53284c),
        _0x2298bc.appendChild(_0x46ce9b),
        _0x2298bc
      );
    }
    ['_formatDreaminaElapsed'](_0x38e29b) {
      const _0x2ac8ab = Math.max(0, Math.floor(Number(_0x38e29b || 0) / 0x3e8)),
        _0x2dda3e = Math.floor(_0x2ac8ab / 60),
        _0x254041 = _0x2ac8ab % 60;
      if (_0x2dda3e > 0)
        return videoResultRenderText('elapsedMinutesSeconds', {
          minutes: _0x2dda3e,
          seconds: String(_0x254041).padStart(2, '0'),
        });
      return videoResultRenderText('elapsedSeconds', { seconds: _0x254041 });
    }
    async ['_loadAndDisplayVideo']() {
      if (this._rendererMediaDeferred === true) {
        ((this._deferredVideoViewRefreshPending = true), this._showDeferredVideoPosterPreview());
        return;
      }
      this._removeDeferredVideoPosterPreview();
      const _0xb8fe52 = this._data.videos || [];
      _0xb8fe52.length === 0 &&
        (this._data.videoUrl || this._data.localPath || this._data.thumbId) &&
        _0xb8fe52.push({
          videoUrl: this._data.videoUrl,
          thumbId: this._data.thumbId,
          localPath: this._data.localPath,
        });
      const _0x450d9e = (this._data.rhStatusMessage || '').trim(),
        _0x2e5bf3 = this._data.rhStatusCode,
        _0x4fe082 = this._getGenerationFailureMessage(this._data);
      if (_0x4fe082 && _0xb8fe52.length === 0) {
        this.videoEl &&
          ((this.videoEl.style.display = 'none'),
          this.videoEl.removeAttribute?.('src'),
          this.videoEl.load?.());
        ((this._placeholderEl.style.display = 'none'), this._setVideoOverlaysVisible(false));
        this._multiVideosContainer &&
          (this._multiVideosContainer.remove(), (this._multiVideosContainer = null));
        const _0x2fef8b = this._ensureStatusOverlayEl();
        ((_0x2fef8b.innerHTML = ''), _0x2fef8b.appendChild(this._createErrorCard(_0x4fe082)));
        return;
      }
      if (_0x450d9e && _0xb8fe52.length === 0) {
        this.videoEl &&
          ((this.videoEl.style.display = 'none'),
          this.videoEl.removeAttribute?.('src'),
          this.videoEl.load?.());
        ((this._placeholderEl.style.display = 'none'), this._setVideoOverlaysVisible(false));
        this._multiVideosContainer &&
          (this._multiVideosContainer.remove(), (this._multiVideosContainer = null));
        const _0x3d99d8 = this._ensureStatusOverlayEl();
        ((_0x3d99d8.innerHTML = ''), _0x3d99d8.appendChild(this._createStatusCard(_0x450d9e, _0x2e5bf3)));
        return;
      }
      this._clearStatusOverlay();
      const _0x38f61f = _0xb8fe52.length;
      if (_0x38f61f === 0) {
        this.videoEl &&
          ((this.videoEl.style.display = 'none'),
          this.videoEl.removeAttribute?.('src'),
          this.videoEl.load?.());
        ((this._placeholderEl.style.display = 'flex'), this._setVideoOverlaysVisible(false));
        this._multiVideosContainer &&
          (this._multiVideosContainer.remove(), (this._multiVideosContainer = null));
        return;
      }
      const _0x54d29a = this._data.mainVideoIndex || 0,
        _0x189d1c = _0x38f61f > 1,
        _0x39e9f2 = _0x189d1c && !!this._data.isVideosExpanded,
        _0x10cb7d = Math.max(0, Math.min(_0x38f61f - 1, Math.trunc(Number(_0x54d29a) || 0))),
        _0x296420 =
          _0xb8fe52[Math.max(0, Math.min(_0x38f61f - 1, Math.trunc(Number(_0x54d29a) || 0)))] ||
          _0xb8fe52[0] ||
          null,
        _0x12497f = !!String(_0x296420?.error || '').trim(),
        _0x511773 = this._isVideoMarkedUnavailable(_0x296420),
        _0x3d07a0 = this._resolveVideoMetaSrcFromVideoData(_0x296420);
      if (_0x3d07a0 && !_0x511773 && !_0x12497f) this._maybeFetchVideoMeta(_0x3d07a0);
      const _0x5dfbfe = (_0x5c5e8b, _0x5ebf99) => {
          if (this._isVideoMarkedUnavailable(_0x5ebf99)) return;
          const _0xec5ded = this._resolveVideoMetaSrcFromVideoData(_0x5ebf99);
          if (!_0xec5ded) return;
          if (!(_0xec5ded.startsWith('/output/') || _0xec5ded.startsWith('/data/'))) return;
          if (this._isVideoThumbMarkedUnavailable(_0x5ebf99, _0xec5ded)) return;
          const _0x42439e = _0x989779.getState().nodes?.[this.nodeId] || {},
            _0x589e0e =
              ['waiting', 'processing'].includes(String(_0x42439e.mediaTaskStatus || '')) &&
              ['videoFirstFrame', 'videoPoster'].includes(String(_0x42439e.mediaTaskKind || ''));
          if (String(_0x5ebf99?.videoThumbSrc || '').trim() === _0xec5ded) {
            if (String(_0x5ebf99?.thumbUrl || '').trim() || _0x589e0e) return;
          }
          const _0x525a59 = 'out|' + this.nodeId + '|' + _0x5c5e8b + '|' + _0xec5ded;
          if (this._videoThumbPending.has(_0x525a59)) return;
          this._videoThumbPending.add(_0x525a59);
          const _0x119116 = _0x989779.getState().nodes?.[this.nodeId],
            _0x497b78 = Array.isArray(_0x119116?.videos) ? _0x119116.videos : [];
          if (_0x5c5e8b >= 0 && _0x5c5e8b < _0x497b78.length) {
            const _0x2df401 = _0x497b78[_0x5c5e8b];
            if (
              _0x2df401 &&
              typeof _0x2df401 === 'object' &&
              String(_0x2df401.videoThumbSrc || '').trim() !== _0xec5ded
            ) {
              const _0x293a1f = _0x497b78.slice();
              ((_0x293a1f[_0x5c5e8b] = { ..._0x2df401, videoThumbSrc: _0xec5ded }),
                _0x989779.updateNodeData(this.nodeId, { videos: _0x293a1f }));
            }
          }
          _0x2ef5c7
            .fetchVideoFirstFrameThumbFromServer(_0xec5ded, {
              nodeId: this.nodeId,
              assetId: String(_0x5ebf99?.assetId || _0x5ebf99?.thumbId || ''),
            })
            .then((_0x2668ed) => {
              const _0x39547d = String(_0x2668ed?.thumbUrl || _0x2668ed?.url || '').trim();
              if (!_0x39547d) return;
              const _0x1bcf83 = _0x989779.getState(),
                _0x3c82ba = _0x1bcf83.nodes?.[this.nodeId];
              if (!_0x3c82ba) return;
              const _0x211b98 = Array.isArray(_0x3c82ba.videos) ? _0x3c82ba.videos : [];
              if (!(_0x5c5e8b >= 0 && _0x5c5e8b < _0x211b98.length)) return;
              const _0x5620fc = _0x211b98[_0x5c5e8b];
              if (!_0x5620fc || typeof _0x5620fc !== 'object') return;
              const _0x3f62da = { ..._0x5620fc, videoThumbSrc: _0xec5ded, videoThumbUnavailableSource: '' };
              if (!String(_0x3f62da.thumbUrl || '').trim() && _0x39547d) _0x3f62da.thumbUrl = _0x39547d;
              const _0x5689e6 = _0x211b98.slice();
              _0x5689e6[_0x5c5e8b] = _0x3f62da;
              const _0x63456 = { videos: _0x5689e6 },
                _0x4482fe = Number(_0x3c82ba.mainVideoIndex),
                _0x9d2e54 = Number.isFinite(_0x4482fe) ? Math.max(0, Math.trunc(_0x4482fe)) : 0;
              if (_0x5c5e8b === _0x9d2e54) _0x63456.videoThumbUnavailableSource = '';
              if (_0x5c5e8b === _0x9d2e54) {
                if (!String(_0x3c82ba.thumbUrl || '').trim() && _0x39547d) _0x63456.thumbUrl = _0x39547d;
              }
              _0x989779.updateNodeData(this.nodeId, _0x63456);
            })
            .catch(() => {
              const _0x23baf9 = _0x989779.getState().nodes?.[this.nodeId] || this._data || {},
                _0x17eab7 = Array.isArray(_0x23baf9.videos) ? _0x23baf9.videos : [],
                _0x1ed791 = _0x17eab7[_0x5c5e8b] || _0x5ebf99 || {},
                _0x21e7ed = this._resolveVideoMetaSrcFromVideoData(_0x1ed791);
              _0x21e7ed === _0xec5ded && this._markVideoThumbUnavailable(_0x5c5e8b, _0x1ed791, _0xec5ded);
            })
            .finally(() => {
              this._videoThumbPending.delete(_0x525a59);
            });
        },
        _0x3fa6ee = _0xb8fe52
          .map(
            (_0x2eb3fc) =>
              (_0x2eb3fc.videoUrl || '') +
              '|' +
              (_0x2eb3fc.localPath || '') +
              '|' +
              (_0x2eb3fc.displayLocalPath || '') +
              '|' +
              (_0x2eb3fc.thumbId || '') +
              '|' +
              (_0x2eb3fc.error || ''),
          )
          .join('||'),
        _0x35cd68 = _0x3fa6ee !== this._lastVideosKeyStr,
        _0x3c38fe = _0x54d29a !== this._lastMainIdx,
        _0x5e5ca4 = _0x39e9f2 !== this._lastIsExpanded,
        _0x4d3a47 = !this._expandPanel || _0x35cd68 || _0x3c38fe || _0x5e5ca4;
      ((this._lastVideosKeyStr = _0x3fa6ee),
        (this._lastMainIdx = _0x54d29a),
        (this._lastIsExpanded = _0x39e9f2));
      !this._multiVideosContainer &&
        ((this._multiVideosContainer = document.createElement('div')),
        Object.assign(this._multiVideosContainer.style, {
          position: 'absolute',
          inset: '0',
          width: '100%',
          height: '100%',
        }),
        this.previewEl.appendChild(this._multiVideosContainer));
      const _0xd96fc = String(this._data.thumbUrl || '').trim(),
        _0x53ec20 = new Array(_0x38f61f).fill(''),
        _0x39dc3d = new Array(_0x38f61f).fill(''),
        _0x2a0ab3 = [];
      for (let _0x24c4c1 = 0; _0x24c4c1 < _0x38f61f; _0x24c4c1++) {
        const _0x5c03e0 = _0xb8fe52[_0x24c4c1] || {},
          _0x162d92 = this._isVideoMarkedUnavailable(_0x5c03e0),
          _0x3d1a1b = _0x162d92
            ? ''
            : String(_0x5c03e0.thumbUrl || '').trim() || (_0x24c4c1 === _0x10cb7d ? _0xd96fc : '');
        if (_0x3d1a1b) _0x39dc3d[_0x24c4c1] = this._resolveMediaUrl(_0x3d1a1b);
        const _0x464246 = _0x24c4c1 === _0x10cb7d,
          _0x4bd68a = _0x39e9f2 || (!isDesktopRenderer() && _0x464246 && !_0x39dc3d[_0x24c4c1]);
        if (_0x4bd68a && !_0x162d92) {
          let _0x365445 = this._resolveVideoPlaybackUrl(_0x5c03e0);
          if (!_0x365445 && _0x5c03e0.thumbId) {
            const _0x4c9ede = String(_0x5c03e0.thumbId || ''),
              _0x1ceea2 = _0x4c9ede ? this._cachedVideoUrls.get(_0x4c9ede) : '';
            if (_0x1ceea2) _0x365445 = _0x1ceea2;
            else _0x2a0ab3.push({ i: _0x24c4c1, thumbId: _0x4c9ede });
          }
          _0x53ec20[_0x24c4c1] = _0x365445;
        }
      }
      const _0x3a2721 = _0x12497f || (!_0x511773 && (!!_0x53ec20[_0x10cb7d] || !!_0x39dc3d[_0x10cb7d]));
      ((this._placeholderEl.style.display = _0x3a2721 ? 'none' : 'flex'),
        this._setVideoOverlaysVisible(!_0x12497f && _0x3a2721 && !_0x39e9f2));
      if (!_0x12497f && _0x39dc3d[_0x10cb7d]) _0x47e14e(_0x39dc3d[_0x10cb7d]);
      else {
        if (!_0x12497f) _0x5dfbfe(_0x10cb7d, _0x296420);
      }
      const _0x3a2617 = (_0x24b1f0) => {
          if (this._isExpandedPickClosing) return;
          this._isExpandedPickClosing = true;
          const _0x5979c8 = this._root.querySelectorAll('.multi-flyout-panel > div'),
            _0x16680a = () => {
              const _0x410450 = _0xb8fe52[_0x24b1f0];
              if (!_0x410450 || typeof _0x410450 !== 'object') return { w: 0, h: 0, d: 0 };
              const _0x3412fb = Number(_0x410450.videoWidth || 0),
                _0x9cf932 = Number(_0x410450.videoHeight || 0),
                _0x268398 = Number(_0x410450.duration);
              return {
                w: Number.isFinite(_0x3412fb) ? _0x3412fb : 0,
                h: Number.isFinite(_0x9cf932) ? _0x9cf932 : 0,
                d: _0x268398,
              };
            },
            _0x3e58e9 = () => {
              const _0x3dbdc0 = _0x16680a(),
                _0x134115 = {
                  mainVideoIndex: _0x24b1f0,
                  isVideosExpanded: false,
                  videoUrl: _0xb8fe52[_0x24b1f0].videoUrl,
                  localPath: _0xb8fe52[_0x24b1f0].localPath,
                  displayLocalPath: _0xb8fe52[_0x24b1f0].displayLocalPath || '',
                  thumbId: _0xb8fe52[_0x24b1f0].thumbId,
                };
              _0x3dbdc0.w > 0 &&
                _0x3dbdc0.h > 0 &&
                ((_0x134115.selectedVideoWidth = _0x3dbdc0.w),
                (_0x134115.selectedVideoHeight = _0x3dbdc0.h),
                (_0x134115.videoWidth = _0x3dbdc0.w),
                (_0x134115.videoHeight = _0x3dbdc0.h));
              if (Number.isFinite(_0x3dbdc0.d) && _0x3dbdc0.d > 0) _0x134115.videoDuration = _0x3dbdc0.d;
              return _0x134115;
            };
          if (_0x5979c8.length > 0) {
            const _0x38bc4a = this.previewEl.offsetTop,
              _0x38bbe0 = 0,
              _0x1d556d = _0x38bc4a;
            (_0x5979c8.forEach((_0x4eb538) => {
              ((_0x4eb538.style.transition = 'all 0.35s cubic-bezier(0.6, -0.28, 0.735, 0.045)'),
                (_0x4eb538.style.opacity = '0'),
                (_0x4eb538.style.transform = 'scale(0.01) rotate(-45deg)'),
                (_0x4eb538.style.filter = 'blur(10px)'),
                (_0x4eb538.style.top = _0x1d556d + 'px'),
                (_0x4eb538.style.left = _0x38bbe0 + 'px'));
            }),
              setTimeout(() => {
                (_0x989779.updateNodeData(this.nodeId, _0x3e58e9()), (this._isExpandedPickClosing = false));
              }, 0x15e));
          } else (_0x989779.updateNodeData(this.nodeId, _0x3e58e9()), (this._isExpandedPickClosing = false));
        },
        _0x587994 = (_0x5a4c44, _0x281752) => {
          const _0x3a8742 = {
              bg: 'var(--black-45)',
              color: 'var(--white-90)',
              border: '1px solid var(--white-15)',
            },
            _0x4962f2 = {
              bg: 'var(--black-70)',
              color: 'var(--white-80)',
              border: '1px solid transparent',
            },
            _0x23047c = _0x281752 ? _0x4962f2 : _0x3a8742;
          ((_0x5a4c44.innerHTML = _0x281752
            ? '<span>' +
              _0x38f61f +
              ' 个</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>'
            : '<span>' +
              _0x38f61f +
              ' 个</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'),
            (_0x5a4c44.style.background = _0x23047c.bg),
            (_0x5a4c44.style.color = _0x23047c.color),
            (_0x5a4c44.style.border = _0x23047c.border));
        };
      if (_0x35cd68 || !this._multiStackWrap) {
        ((this._multiVideosContainer.innerHTML = ''),
          (this._multiLayerEls = []),
          (this._multiErrorEls = []),
          (this._multiToggleBtn = null),
          (this._multiStackWrap = document.createElement('div')),
          Object.assign(this._multiStackWrap.style, { position: 'relative', width: '100%', height: '100%' }));
        for (let _0x30bc88 = _0x38f61f - 1; _0x30bc88 >= 0; _0x30bc88--) {
          const _0x18db3a = document.createElement('video');
          _0x18db3a.dataset.idx = String(_0x30bc88);
          if (_0x39dc3d[_0x30bc88]) _0x18db3a.poster = _0x39dc3d[_0x30bc88];
          const _0x390206 = _0x30bc88 === _0x10cb7d && !_0x39dc3d[_0x30bc88];
          if (_0x390206 && _0x53ec20[_0x30bc88]) _0x18db3a.src = _0x53ec20[_0x30bc88];
          ((_0x18db3a.autoplay = false),
            (_0x18db3a.loop = false),
            (_0x18db3a.muted = true),
            (_0x18db3a.playsInline = true),
            (_0x18db3a.preload = _0x390206 ? 'auto' : _0x39dc3d[_0x30bc88] ? 'none' : 'metadata'),
            (_0x18db3a.draggable = false),
            _0x18db3a.addEventListener('dragstart', (_0x48cb41) => _0x48cb41.preventDefault()),
            (_0x18db3a.style.position = 'absolute'),
            (_0x18db3a.style.top = '0'),
            (_0x18db3a.style.left = '0'),
            (_0x18db3a.style.width = '100%'),
            (_0x18db3a.style.height = '100%'),
            (_0x18db3a.style.objectFit = 'contain'),
            (_0x18db3a.style.borderRadius = '8px'),
            (_0x18db3a.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'),
            (_0x18db3a.style.transformOrigin = 'top left'),
            _0x18db3a.classList.add('v2-media-preview'),
            this._attachPreviewVideoRecovery(_0x18db3a, 'preview'));
          const _0x51b176 = () => {
              const _0x34dbc5 = _0x989779.getState().nodes[this.nodeId] || this._data || {},
                _0x1fb028 = Number(_0x34dbc5.mainVideoIndex) || 0,
                _0x40dba0 = Math.max(0, Math.trunc(_0x1fb028));
              return _0x30bc88 === _0x40dba0;
            },
            _0x53b09d = (_0x500608, _0x2f02ae, _0x6b8d82) => {
              const _0x2d51f6 = _0x989779.getState().nodes[this.nodeId];
              if (!_0x2d51f6) return;
              const _0x57993c = Array.isArray(_0x2d51f6.videos) ? _0x2d51f6.videos : [],
                _0x9ec647 = _0x57993c[_0x30bc88] || null;
              if (!_0x9ec647 || typeof _0x9ec647 !== 'object') return;
              const _0x23a275 = { ..._0x9ec647 };
              let _0x29a37a = false;
              _0x500608 > 0 &&
                Number(_0x23a275.videoWidth || 0) !== _0x500608 &&
                ((_0x23a275.videoWidth = _0x500608), (_0x29a37a = true));
              _0x2f02ae > 0 &&
                Number(_0x23a275.videoHeight || 0) !== _0x2f02ae &&
                ((_0x23a275.videoHeight = _0x2f02ae), (_0x29a37a = true));
              Number.isFinite(_0x6b8d82) &&
                _0x6b8d82 > 0 &&
                Number(_0x23a275.duration || 0) !== _0x6b8d82 &&
                ((_0x23a275.duration = _0x6b8d82), (_0x29a37a = true));
              if (!_0x29a37a) return;
              const _0x551084 = _0x57993c.slice();
              _0x551084[_0x30bc88] = _0x23a275;
              const _0x3e8884 = { videos: _0x551084 };
              if (_0x51b176()) {
                if (_0x500608 > 0 && Number(_0x2d51f6.videoWidth || 0) !== _0x500608)
                  _0x3e8884.videoWidth = _0x500608;
                if (_0x2f02ae > 0 && Number(_0x2d51f6.videoHeight || 0) !== _0x2f02ae)
                  _0x3e8884.videoHeight = _0x2f02ae;
                if (_0x500608 > 0 && Number(_0x2d51f6.selectedVideoWidth || 0) !== _0x500608)
                  _0x3e8884.selectedVideoWidth = _0x500608;
                if (_0x2f02ae > 0 && Number(_0x2d51f6.selectedVideoHeight || 0) !== _0x2f02ae)
                  _0x3e8884.selectedVideoHeight = _0x2f02ae;
                if (
                  Number.isFinite(_0x6b8d82) &&
                  _0x6b8d82 > 0 &&
                  Number(_0x2d51f6.videoDuration || 0) !== _0x6b8d82
                )
                  _0x3e8884.videoDuration = _0x6b8d82;
              }
              _0x989779.updateNodeData(this.nodeId, _0x3e8884);
            };
          (_0x18db3a.addEventListener('loadedmetadata', () => {
            this._clearVideoUnavailable(_0x30bc88, _0xb8fe52[_0x30bc88]);
            const _0xa02006 = _0x18db3a.videoWidth || 0,
              _0x45145c = _0x18db3a.videoHeight || 0,
              _0x672663 = Number(_0x18db3a.duration);
            _0x53b09d(_0xa02006, _0x45145c, _0x672663);
            if (_0x51b176()) this._syncVideoControlsFromVideo(_0x18db3a);
          }),
            _0x18db3a.addEventListener('error', () => {
              const _0x2c85be = _0x989779.getState().nodes[this.nodeId] || this._data || {},
                _0x1900cf = Array.isArray(_0x2c85be.videos) ? _0x2c85be.videos : [],
                _0x589a42 = _0x1900cf[_0x30bc88] || _0xb8fe52[_0x30bc88] || {},
                _0x31bff3 = Number(_0x2c85be.mainVideoIndex),
                _0x2fa2f2 = Number.isFinite(_0x31bff3) ? Math.max(0, Math.trunc(_0x31bff3)) : 0;
              if (_0x30bc88 === _0x2fa2f2) {
                (_0x18db3a.removeAttribute('poster'), _0x18db3a.removeAttribute('src'));
                try {
                  _0x18db3a.load?.();
                } catch {}
                ((this._placeholderEl.style.display = 'flex'),
                  this._setVideoOverlaysVisible(false),
                  this._hideCenterIndicator(),
                  this._syncVideoControlsFromVideo(null));
              }
              this._markVideoUnavailable(_0x30bc88, _0x589a42);
            }),
            _0x18db3a.addEventListener('timeupdate', () => {
              if (_0x51b176()) this._syncVideoControlsFromVideo(_0x18db3a);
            }),
            _0x18db3a.addEventListener('pause', () => {
              _0x51b176() && (this._showPausedCenterIndicator(), this._syncVideoControlsFromVideo(_0x18db3a));
            }),
            _0x18db3a.addEventListener('play', () => {
              _0x51b176() && (this._hideCenterIndicator(), this._syncVideoControlsFromVideo(_0x18db3a));
            }),
            _0x18db3a.addEventListener('ended', () => {
              _0x51b176() && (this._showPausedCenterIndicator(), this._syncVideoControlsFromVideo(_0x18db3a));
            }),
            _0x18db3a.addEventListener('click', (_0x3fa933) => {
              const _0x8c3934 = _0x989779.getState().nodes[this.nodeId];
              if (_0x8c3934.isVideosExpanded) {
                (_0x3fa933.stopPropagation(), _0x3a2617(this._lastMainIdx || 0));
                return;
              }
              if (_0x3fa933.detail && _0x3fa933.detail > 1) return;
              _0x3fa933.stopPropagation();
              if (_0x4a432e.isActiveFor(this.nodeId)) return;
              if (this._videoClickTimer) clearTimeout(this._videoClickTimer);
              this._videoClickTimer = setTimeout(() => {
                this._videoClickTimer = null;
                const _0x2c846c = _0x989779.getState().nodes[this.nodeId];
                if (_0x2c846c?.isVideosExpanded) return;
                if (_0x4a432e.isActiveFor(this.nodeId)) return;
                this._toggleVideoPlayPause(_0x18db3a);
              }, 180);
            }),
            _0x18db3a.addEventListener('dblclick', (_0x52b124) => {
              _0x52b124.stopPropagation();
              if (_0x4a432e.isActiveFor(this.nodeId)) return;
              this._videoClickTimer && (clearTimeout(this._videoClickTimer), (this._videoClickTimer = null));
              const _0x48a354 = this._lastMainIdx || 0,
                _0x4d1369 = _0x989779.getState().nodes[this.nodeId],
                _0x1dfb9e = _0x4d1369.videos || [],
                _0x24e0da = _0x1dfb9e[_0x48a354] || _0x1dfb9e[0];
              void this._openFullScreenFromVideo(_0x24e0da, _0x18db3a);
            }));
          if (_0xb8fe52[_0x30bc88].error) {
            const _0x3326c9 = this._createErrorCard(_0xb8fe52[_0x30bc88].error);
            ((_0x3326c9.style.position = 'absolute'),
              (_0x3326c9.style.inset = '0'),
              (this._multiErrorEls[_0x30bc88] = _0x3326c9),
              this._multiStackWrap.appendChild(_0x3326c9));
          } else ((this._multiLayerEls[_0x30bc88] = _0x18db3a), this._multiStackWrap.appendChild(_0x18db3a));
        }
        if (_0x2a0ab3.length > 0) {
          const _0x499ef0 = ++this._blobResolveToken;
          for (const _0x561912 of _0x2a0ab3) {
            const _0x203e13 = _0x561912.i,
              _0x17991f = String(_0x561912.thumbId || '');
            if (!_0x17991f) continue;
            if (this._cachedVideoUrls.has(_0x17991f)) continue;
            _0x55ea55(_0x17991f)
              .then((_0x4e6dc6) => {
                if (_0x499ef0 !== this._blobResolveToken) return;
                if (!_0x4e6dc6) return;
                const _0x159066 = URL.createObjectURL(_0x4e6dc6);
                this._cachedVideoUrls.set(_0x17991f, _0x159066);
                const _0x4d6469 = this._multiLayerEls?.[_0x203e13];
                if (!_0x4d6469 || !_0x4d6469.isConnected) return;
                if (!(_0x39e9f2 || _0x203e13 === _0x10cb7d)) return;
                _0x4d6469.src = _0x159066;
                try {
                  _0x4d6469.load?.();
                } catch {}
                _0x203e13 === _0x10cb7d &&
                  this._placeholderEl &&
                  this._placeholderEl.style.display !== 'none' &&
                  ((this._placeholderEl.style.display = 'none'), this._setVideoOverlaysVisible(true));
              })
              .catch(() => {});
          }
        }
        (_0x189d1c &&
          ((this._multiToggleBtn = document.createElement('div')),
          (this._multiToggleBtn.className = 'multi-toggle-btn'),
          Object.assign(this._multiToggleBtn.style, {
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 0x3ed,
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
          this._multiToggleBtn.addEventListener('pointerdown', (_0x20bcbf) => {
            if (_0x20bcbf.button !== 0) return;
            (_0x20bcbf.preventDefault(), _0x20bcbf.stopPropagation());
            const _0x400578 = _0x989779.getState().nodes[this.nodeId],
              _0x1e4b6e = !!_0x400578.isVideosExpanded;
            if (_0x1e4b6e) {
              const _0x2cfbbc = this._root.querySelectorAll('.multi-flyout-panel > div');
              if (_0x2cfbbc.length > 0) {
                const _0x16dad2 = this.previewEl.offsetTop,
                  _0x59a0c4 = 0,
                  _0x20fcd6 = _0x16dad2;
                (_0x2cfbbc.forEach((_0x5e47c6) => {
                  ((_0x5e47c6.style.transition = 'all 0.35s cubic-bezier(0.6, -0.28, 0.735, 0.045)'),
                    (_0x5e47c6.style.opacity = '0'),
                    (_0x5e47c6.style.transform = 'scale(0.01) rotate(-45deg)'),
                    (_0x5e47c6.style.filter = 'blur(10px)'),
                    (_0x5e47c6.style.top = _0x20fcd6 + 'px'),
                    (_0x5e47c6.style.left = _0x59a0c4 + 'px'));
                }),
                  setTimeout(() => {
                    _0x989779.updateNodeData(this.nodeId, { isVideosExpanded: false });
                  }, 0x15e));
              } else _0x989779.updateNodeData(this.nodeId, { isVideosExpanded: false });
            } else _0x989779.updateNodeData(this.nodeId, { isVideosExpanded: true });
          }),
          this._multiToggleBtn.addEventListener('mouseenter', () => _0x587994(this._multiToggleBtn, true)),
          this._multiToggleBtn.addEventListener('mouseleave', () => {
            const _0x3fb24e = _0x989779.getState().nodes[this.nodeId];
            _0x587994(this._multiToggleBtn, !!_0x3fb24e.isVideosExpanded);
          }),
          this._multiToggleBtn.addEventListener('click', (_0x3ccdc9) => {
            (_0x3ccdc9.preventDefault(), _0x3ccdc9.stopPropagation());
          }),
          this._multiStackWrap.appendChild(this._multiToggleBtn)),
          this._multiVideosContainer.appendChild(this._multiStackWrap));
      }
      this._multiToggleBtn && _0x587994(this._multiToggleBtn, _0x39e9f2);
      this._applyMuteStateToPreviewVideos();
      for (let _0x906143 = 0; _0x906143 < _0x38f61f; _0x906143++) {
        const _0x225d2e = _0x906143 === _0x54d29a,
          _0xee668 = this._multiLayerEls[_0x906143],
          _0x300f3d = this._multiErrorEls[_0x906143];
        if (_0xee668) {
          const _0x199a8f = _0x53ec20[_0x906143] || '',
            _0x85a775 = _0x39dc3d[_0x906143] || '',
            _0x360c98 = String(_0xee668.getAttribute('src') || '').trim(),
            _0x5fab2c = _0x225d2e && (!_0x85a775 || !!_0x360c98),
            _0x3689a4 = _0x5fab2c ? 'auto' : _0x85a775 ? 'none' : 'metadata';
          if (_0x85a775 && _0xee668.poster !== _0x85a775) _0xee668.poster = _0x85a775;
          if (_0xee668.preload !== _0x3689a4) {
            _0xee668.preload = _0x3689a4;
            if (
              _0x3689a4 === 'auto' &&
              _0x360c98 &&
              _0xee668.paused &&
              !this._isHovered &&
              !this._isManualControl &&
              Number(_0xee668.readyState || 0) < 2
            )
              try {
                _0xee668.load?.();
              } catch {}
          }
          if (_0x5fab2c) {
            !_0x225d2e &&
              _0x85a775 &&
              !_0x199a8f &&
              _0x360c98 &&
              _0xee668.paused &&
              !this._isHovered &&
              !this._isManualControl &&
              (_0xee668.removeAttribute('src'), _0xee668.load?.());
            if (_0x199a8f && _0x360c98 !== _0x199a8f && !isMediaElementPlaybackSource(_0xee668, _0x199a8f))
              await attachMediaElementPlaybackSource(_0xee668, _0x199a8f, {
                preload: _0x3689a4,
                warmRanges: false,
                load: false,
              });
            else {
              if (!_0x199a8f && !_0x360c98 && !_0x85a775) {
                const _0xbe66c8 = _0xb8fe52[_0x906143] || {},
                  _0x330fa1 = String(_0xbe66c8.thumbId || '');
                if (_0x330fa1 && (_0x39e9f2 || _0x906143 === _0x10cb7d)) {
                  if (this._cachedVideoUrls.has(_0x330fa1))
                    _0xee668.src = this._cachedVideoUrls.get(_0x330fa1);
                  else {
                    const _0x1acbdb = ++this._blobResolveToken;
                    _0x55ea55(_0x330fa1)
                      .then((_0x25e202) => {
                        if (_0x1acbdb !== this._blobResolveToken) return;
                        if (!_0x25e202) return;
                        const _0x12348c = URL.createObjectURL(_0x25e202);
                        this._cachedVideoUrls.set(_0x330fa1, _0x12348c);
                        if (!_0xee668.isConnected) return;
                        _0xee668.src = _0x12348c;
                        try {
                          _0xee668.load?.();
                        } catch {}
                        _0x906143 === _0x10cb7d &&
                          this._placeholderEl &&
                          this._placeholderEl.style.display !== 'none' &&
                          ((this._placeholderEl.style.display = 'none'),
                          this._setVideoOverlaysVisible(!_0x39e9f2));
                      })
                      .catch(() => {});
                  }
                }
              }
            }
          } else _0x360c98 && (_0xee668.removeAttribute('src'), _0xee668.load?.());
          ((_0xee668.style.display = _0x225d2e ? 'block' : 'none'),
            (_0xee668.style.pointerEvents = _0x225d2e ? '' : 'none'),
            _0x225d2e &&
              ((_0xee668.style.transform = 'rotate(0deg) scale(1)'),
              (_0xee668.style.opacity = '1'),
              (_0xee668.style.zIndex = _0x38f61f + 1),
              (_0xee668.style.boxShadow = '0 4px 12px var(--black-40)')));
        }
        _0x300f3d &&
          ((_0x300f3d.style.display = _0x225d2e ? 'flex' : 'none'),
          (_0x300f3d.style.zIndex = _0x225d2e ? _0x38f61f + 1 : _0x906143));
      }
      const _0x4adca7 = this._multiLayerEls[_0x54d29a];
      if (_0x4adca7) {
        const _0x3d6b5f = _0x4adca7.videoWidth || 0,
          _0x509088 = _0x4adca7.videoHeight || 0,
          _0x44411d = Number(_0x4adca7.duration),
          _0x457892 = _0x989779.getState().nodes[this.nodeId];
        if (_0x457892) {
          const _0x26c81d = {};
          if (_0x3d6b5f > 0 && Number(_0x457892.videoWidth || 0) !== _0x3d6b5f)
            _0x26c81d.videoWidth = _0x3d6b5f;
          if (_0x509088 > 0 && Number(_0x457892.videoHeight || 0) !== _0x509088)
            _0x26c81d.videoHeight = _0x509088;
          if (_0x3d6b5f > 0 && Number(_0x457892.selectedVideoWidth || 0) !== _0x3d6b5f)
            _0x26c81d.selectedVideoWidth = _0x3d6b5f;
          if (_0x509088 > 0 && Number(_0x457892.selectedVideoHeight || 0) !== _0x509088)
            _0x26c81d.selectedVideoHeight = _0x509088;
          if (
            Number.isFinite(_0x44411d) &&
            _0x44411d > 0 &&
            Number(_0x457892.videoDuration || 0) !== _0x44411d
          )
            _0x26c81d.videoDuration = _0x44411d;
          if (Object.keys(_0x26c81d).length) _0x989779.updateNodeData(this.nodeId, _0x26c81d);
        }
      }
      if (_0x4adca7 && _0x4adca7.paused) this._showPausedCenterIndicator();
      else this._hideCenterIndicator();
      this._syncVideoControlsFromVideo(_0x4adca7 || null);
      if (_0x39e9f2) {
        ((this._root.style.position = 'relative'),
          this._root.style.setProperty('overflow', 'visible', 'important'));
        if (!_0x4d3a47) return;
        const _0x482ab8 = _0x38f61f <= 2 ? _0x38f61f : 2,
          _0x2e1501 = Math.ceil(_0x38f61f / _0x482ab8),
          _0x5b10fe = 12,
          _0x6136a8 = this.previewEl.offsetWidth,
          _0x4cfda6 = this.previewEl.offsetHeight,
          _0x38ca93 = this.previewEl.offsetTop,
          _0x28ca2d = _0x2e1501 - 1,
          _0x641452 = 0,
          _0x4b278d = [];
        for (let _0x4b6884 = 0; _0x4b6884 < _0x38f61f; _0x4b6884++) {
          if (_0x4b6884 !== _0x54d29a)
            _0x4b278d.push({ video: _0xb8fe52[_0x4b6884], url: _0x53ec20[_0x4b6884], origIdx: _0x4b6884 });
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
        const _0x37b806 = [];
        for (let _0xb8d1b = 0; _0xb8d1b < _0x2e1501; _0xb8d1b++) {
          for (let _0x55dbcc = 0; _0x55dbcc < _0x482ab8; _0x55dbcc++) {
            if (_0xb8d1b === _0x28ca2d && _0x55dbcc === _0x641452) continue;
            _0x37b806.push({ r: _0xb8d1b, c: _0x55dbcc });
          }
        }
        _0x2e1501 === 2 &&
          _0x482ab8 === 2 &&
          ((_0x37b806.length = 0),
          _0x37b806.push({ r: 1, c: 1 }),
          _0x37b806.push({ r: 0, c: 0 }),
          _0x37b806.push({ r: 0, c: 1 }));
        for (let _0x3673b5 = 0; _0x3673b5 < _0x4b278d.length; _0x3673b5++) {
          if (_0x3673b5 >= _0x37b806.length) break;
          const _0x3a326a = _0x37b806[_0x3673b5].r,
            _0x19c752 = _0x37b806[_0x3673b5].c,
            { video: _0x59ad29, url: _0x370282, origIdx: _0x5461a2 } = _0x4b278d[_0x3673b5],
            _0x67f2a2 = _0x38ca93 + (_0x3a326a - _0x28ca2d) * (_0x4cfda6 + _0x5b10fe),
            _0x448758 = _0x19c752 * (_0x6136a8 + _0x5b10fe),
            _0x44885a = _0x38ca93,
            _0x12e91c = 0,
            _0x278e0a = document.createElement('div');
          (Object.assign(_0x278e0a.style, {
            position: 'absolute',
            top: _0x44885a + 'px',
            left: _0x12e91c + 'px',
            width: _0x6136a8 + 'px',
            height: _0x4cfda6 + 'px',
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
            zIndex: String(0x2ee0 - _0x3673b5),
          }),
            (_0x278e0a.style.pointerEvents = 'auto'),
            requestAnimationFrame(() => {
              setTimeout(() => {
                ((_0x278e0a.style.opacity = '1'),
                  (_0x278e0a.style.top = _0x67f2a2 + 'px'),
                  (_0x278e0a.style.left = _0x448758 + 'px'),
                  (_0x278e0a.style.transform = 'scale(1) rotate(0deg)'),
                  (_0x278e0a.style.filter = 'blur(0px)'));
              }, _0x3673b5 * 60);
            }));
          if (_0x59ad29.error) {
            const _0x26ca5e = this._createErrorCard(_0x59ad29.error);
            _0x278e0a.appendChild(_0x26ca5e);
          } else {
            const _0x134697 = document.createElement('video');
            (Object.assign(_0x134697.style, { width: '100%', height: '100%', objectFit: 'cover' }),
              (_0x134697.dataset.idx = String(_0x5461a2)),
              (_0x134697.autoplay = false),
              (_0x134697.loop = false),
              (_0x134697.muted = true),
              (_0x134697.playsInline = true));
            const _0x552dc7 = _0x39dc3d[_0x5461a2] || '';
            if (_0x552dc7) ((_0x134697.poster = _0x552dc7), (_0x134697.preload = 'none'));
            else {
              _0x134697.preload = _0x370282 ? 'metadata' : 'none';
              if (_0x370282) _0x134697.src = _0x370282;
            }
            (attachVideoPlaybackRecovery(_0x134697, {
              label: 'ai-video:' + this.nodeId + ':expanded:' + _0x5461a2,
              ensureSrc: () => this._ensureVideoSrcFor(_0x134697, { forPlayback: true }),
              shouldRecover: () => _0x134697.isConnected !== false && !_0x134697.paused,
            }),
              _0x278e0a.appendChild(_0x134697));
          }
          const _0x333347 = (_0x347503) => {
            if (_0x347503.type === 'pointerdown' && _0x347503.button !== 0) return;
            (_0x347503.preventDefault(), _0x347503.stopPropagation(), _0x3a2617(_0x5461a2));
          };
          (_0x278e0a.addEventListener('pointerdown', _0x333347),
            _0x278e0a.addEventListener('click', _0x333347),
            _0x278e0a.addEventListener('dblclick', (_0x283768) => {
              (_0x283768.preventDefault(), _0x283768.stopPropagation());
            }),
            this._expandPanel.appendChild(_0x278e0a));
        }
        this._root.appendChild(this._expandPanel);
      } else
        this._expandPanel &&
          this._expandPanel.parentNode &&
          (this._expandPanel.parentNode.removeChild(this._expandPanel), (this._expandPanel = null));
    }
    ['_resolveVideoDataPlaybackUrl'](_0x58dacf) {
      if (!_0x58dacf) return '';
      return (
        this._resolveMediaUrl(localPathToUrl(_0x58dacf.displayLocalPath)) ||
        this._resolveMediaUrl(localPathToUrl(_0x58dacf.localPath)) ||
        this._resolveMediaUrl(_0x58dacf.videoUrl) ||
        ''
      );
    }
    async ['_openFullScreenFromVideo'](_0x45898c, _0xc42c75 = null) {
      const _0x95290e = document.createElement('div');
      Object.assign(_0x95290e.style, {
        position: 'fixed',
        inset: '0',
        background: 'var(--overlay-preview)',
        zIndex: '99999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
      });
      const _0x1f7f13 = getVideoCurrentSource(_0xc42c75);
      if (_0xc42c75 && _0x1f7f13) {
        const _0x295e34 = _0xc42c75.parentNode,
          _0xfb7ad2 = _0xc42c75.nextSibling,
          _0x3da2e7 = this._isManualControl,
          _0x1202b7 = this._hoverManualPause,
          _0x4d8c10 = {
            controls: _0xc42c75.controls,
            loop: _0xc42c75.loop,
            muted: _0xc42c75.muted,
            position: _0xc42c75.style.position,
            top: _0xc42c75.style.top,
            left: _0xc42c75.style.left,
            width: _0xc42c75.style.width,
            height: _0xc42c75.style.height,
            maxWidth: _0xc42c75.style.maxWidth,
            maxHeight: _0xc42c75.style.maxHeight,
            objectFit: _0xc42c75.style.objectFit,
            borderRadius: _0xc42c75.style.borderRadius,
            pointerEvents: _0xc42c75.style.pointerEvents,
            transform: _0xc42c75.style.transform,
            opacity: _0xc42c75.style.opacity,
            zIndex: _0xc42c75.style.zIndex,
            boxShadow: _0xc42c75.style.boxShadow,
          };
        ((this._isManualControl = true),
          (this._hoverManualPause = false),
          (_0xc42c75.controls = true),
          (_0xc42c75.loop = true),
          (_0xc42c75.muted = !!this._isMuted),
          Object.assign(_0xc42c75.style, {
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
          attachVideoPlaybackRecovery(_0xc42c75, {
            label: 'ai-video:' + this.nodeId + ':fullscreen',
            minBufferAhead: 0.5,
            readyTimeoutMs: 0x15e,
            recoveryDebounceMs: 150,
            recoveryCooldownMs: 0x1f4,
            shouldRecover: () => _0xc42c75.isConnected !== false && !_0xc42c75.paused,
          }));
        let _0x3bdf10 = false;
        const _0x2d8a45 = () => {
          if (_0x3bdf10) return;
          _0x3bdf10 = true;
          try {
            _0xc42c75.pause();
          } catch {}
          ((_0xc42c75.controls = _0x4d8c10.controls),
            (_0xc42c75.loop = _0x4d8c10.loop),
            (_0xc42c75.muted = _0x4d8c10.muted),
            Object.assign(_0xc42c75.style, {
              position: _0x4d8c10.position,
              top: _0x4d8c10.top,
              left: _0x4d8c10.left,
              width: _0x4d8c10.width,
              height: _0x4d8c10.height,
              maxWidth: _0x4d8c10.maxWidth,
              maxHeight: _0x4d8c10.maxHeight,
              objectFit: _0x4d8c10.objectFit,
              borderRadius: _0x4d8c10.borderRadius,
              pointerEvents: _0x4d8c10.pointerEvents,
              transform: _0x4d8c10.transform,
              opacity: _0x4d8c10.opacity,
              zIndex: _0x4d8c10.zIndex,
              boxShadow: _0x4d8c10.boxShadow,
            }));
          if (_0x295e34) _0x295e34.insertBefore(_0xc42c75, _0xfb7ad2);
          (_0x95290e.remove(),
            (this._isManualControl = _0x3da2e7),
            (this._hoverManualPause = _0x1202b7),
            this._attachPreviewVideoRecovery(_0xc42c75, 'preview'));
        };
        (_0x95290e.addEventListener('click', (_0x10822c) => {
          if (_0x10822c.target === _0x95290e) _0x2d8a45();
        }),
          _0x95290e.appendChild(_0xc42c75),
          document.body.appendChild(_0x95290e),
          void playVideoWithRecovery(_0xc42c75, {
            label: 'ai-video:' + this.nodeId + ':fullscreen',
            minBufferAhead: 0.5,
            readyTimeoutMs: 0x15e,
            recoveryDebounceMs: 150,
            recoveryCooldownMs: 0x1f4,
            shouldRecover: () => _0xc42c75.isConnected !== false && !_0xc42c75.paused,
          }));
        return;
      }
      const _0x1748ad = document.createElement('video');
      let _0x261c70 = '';
      const _0x3f1e85 = this._resolveVideoDataPlaybackUrl(_0x45898c),
        _0x39121e = String(_0x45898c?.thumbId || ''),
        _0x1b6d1c = Number(_0xc42c75?.currentTime || 0),
        _0x484b67 = () => {
          if (!(_0x1b6d1c > 0)) return;
          const _0x35bd79 = Number(_0x1748ad.duration),
            _0x9c854b =
              Number.isFinite(_0x35bd79) && _0x35bd79 > 0
                ? Math.min(_0x1b6d1c, Math.max(0, _0x35bd79 - 0.05))
                : _0x1b6d1c;
          try {
            _0x1748ad.currentTime = _0x9c854b;
          } catch {}
        };
      _0x1748ad.addEventListener('loadedmetadata', _0x484b67, { once: true });
      const _0x5d671e = _0x1f7f13 || _0x3f1e85;
      if (_0x5d671e)
        await attachMediaElementPlaybackSource(_0x1748ad, _0x5d671e, {
          preload: 'auto',
          warmRanges: false,
          load: false,
        });
      else
        _0x39121e &&
          _0x55ea55(_0x39121e).then((_0x4167a2) => {
            _0x4167a2 &&
              ((_0x261c70 = URL.createObjectURL(_0x4167a2)),
              (_0x1748ad.src = _0x261c70),
              _0x484b67(),
              void playVideoWithRecovery(_0x1748ad, {
                label: 'ai-video:' + this.nodeId + ':fullscreen',
                minBufferAhead: 0.5,
                readyTimeoutMs: 0x15e,
                recoveryDebounceMs: 150,
                recoveryCooldownMs: 0x1f4,
                shouldRecover: () => _0x1748ad.isConnected !== false && !_0x1748ad.paused,
              }));
          });
      (attachVideoPlaybackRecovery(_0x1748ad, {
        label: 'ai-video:' + this.nodeId + ':fullscreen',
        minBufferAhead: 0.5,
        readyTimeoutMs: 0x15e,
        recoveryDebounceMs: 150,
        recoveryCooldownMs: 0x1f4,
        shouldRecover: () => _0x1748ad.isConnected !== false && !_0x1748ad.paused,
      }),
        (_0x1748ad.preload = 'auto'),
        (_0x1748ad.controls = true),
        (_0x1748ad.autoplay = true),
        (_0x1748ad.loop = true),
        (_0x1748ad.muted = !!this._isMuted),
        Object.assign(_0x1748ad.style, {
          maxWidth: '90%',
          maxHeight: '90%',
          boxShadow: '0 0 50px var(--black-95)',
          borderRadius: '8px',
        }),
        _0x95290e.appendChild(_0x1748ad));
      const _0x186036 = () => {
        try {
          _0x1748ad.pause();
        } catch {}
        _0x95290e.remove();
        if (_0x261c70) {
          try {
            URL.revokeObjectURL(_0x261c70);
          } catch {}
          _0x261c70 = '';
        }
      };
      (_0x95290e.addEventListener('click', (_0x2b2091) => {
        if (_0x2b2091.target === _0x95290e) _0x186036();
      }),
        document.body.appendChild(_0x95290e),
        _0x5d671e &&
          void playVideoWithRecovery(_0x1748ad, {
            label: 'ai-video:' + this.nodeId + ':fullscreen',
            minBufferAhead: 0.5,
            readyTimeoutMs: 0x15e,
            recoveryDebounceMs: 150,
            recoveryCooldownMs: 0x1f4,
            shouldRecover: () => _0x1748ad.isConnected !== false && !_0x1748ad.paused,
          }));
    }
  }
  return _0x10dd04.prototype;
}
