import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { generateId } from '../core/math.js';
import { commit } from './history.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { requester } from '../../api/requester.js';
import { canUseElectronMediaTask, enqueueElectronMediaTask } from '../../api/localMediaTaskApi.js';
import { getAudioDurationFromUrl, getWaveformBarsPathFromUrl } from '../utils/audioWaveform.js';
import { attachDesktopMediaPlaybackSource } from '../services/desktopMediaBlobSource.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
export function normalizeAudioCutResultLocalPath(_0x2f2739) {
  return pickResultLocalPath(_0x2f2739);
}
function audioClipText(_0x5a77c5, _0x27793e = {}) {
  return t('audioClip.' + _0x5a77c5, _0x27793e);
}
const AudioClipController = {
  active: false,
  nodeId: null,
  anchorNodeId: null,
  wrapperEl: null,
  barEl: null,
  trackEl: null,
  selectionEl: null,
  leftHandleEl: null,
  rightHandleEl: null,
  playheadEl: null,
  labelEl: null,
  cancelBtnEl: null,
  confirmBtnEl: null,
  audioEl: null,
  durationSec: 0,
  startSec: 0,
  endSec: 0,
  _dragMode: null,
  _dragOffsetPx: 0,
  _onKeyDown: null,
  _onDocClick: null,
  _onLoadedMeta: null,
  _onDurationChange: null,
  _onPointerMove: null,
  _onPointerUp: null,
  _retryRaf: 0,
  _retryCount: 0,
  _playheadRaf: 0,
  _hiddenEls: null,
  _msgEls: null,
  _msgInterval: 0,
  _wavePathEl: null,
  _waveToken: 0,
  _sourceToken: 0,
  _unsubscribeLocale: null,
  init(_0x44f604) {
    if (!_0x44f604) return;
    if (this.active) this.exit({ silent: true });
    this.audioEl = null;
    const _0x1ed6cb = appStore.getState().nodes[_0x44f604];
    if (!_0x1ed6cb) return;
    const _0x1fc2dc = this._resolveAudioSrcFromNode(_0x1ed6cb);
    if (!_0x1fc2dc) {
      window.showToast?.(audioClipText('toasts.uploadFirst'), 'warn');
      return;
    }
    ((this.active = true),
      (this.nodeId = _0x44f604),
      (this.anchorNodeId = _0x44f604),
      (this._retryCount = 0),
      this._mountWhenReady());
  },
  _applyDimMode(_0x48dc02) {
    const _0x5c5cec = document.getElementById('v2-wrap');
    if (_0x5c5cec) {
      if (_0x48dc02) _0x5c5cec.classList.add('is-audio-clip-mode');
      else _0x5c5cec.classList.remove('is-audio-clip-mode');
    }
    if (this.wrapperEl) {
      if (_0x48dc02) this.wrapperEl.classList.add('is-audio-clip-target');
      else this.wrapperEl.classList.remove('is-audio-clip-target');
    }
  },
  _applyFrozenUI(_0x176cd2) {
    if (!this.wrapperEl) return;
    const _0x36c9ed = 'is-audio-clipping';
    if (_0x176cd2) this.wrapperEl.classList.add(_0x36c9ed);
    else this.wrapperEl.classList.remove(_0x36c9ed);
    this._applyFrozenOverlaysHidden(_0x176cd2);
  },
  _applyFrozenOverlaysHidden(_0x3383bb) {
    if (!this.wrapperEl) return;
    if (_0x3383bb) {
      if (Array.isArray(this._hiddenEls) && this._hiddenEls.length) return;
      const _0x3ec3ca = ['.audio-controls', '.node-upload-hint'],
        _0x336774 = [];
      (_0x3ec3ca.forEach((_0xa6fe97) => {
        this.wrapperEl.querySelectorAll(_0xa6fe97).forEach((_0x1c9a1d) => {
          (_0x336774.push({ el: _0x1c9a1d, prevDisplay: _0x1c9a1d.style.display }),
            (_0x1c9a1d.style.display = 'none'));
        });
      }),
        (this._hiddenEls = _0x336774));
      return;
    }
    const _0x40a952 = Array.isArray(this._hiddenEls) ? this._hiddenEls : [];
    ((this._hiddenEls = null),
      _0x40a952.forEach(({ el: _0x57af7f, prevDisplay: _0x3e5d90 }) => {
        if (!_0x57af7f || !_0x57af7f.isConnected) return;
        _0x57af7f.style.display = _0x3e5d90 || '';
      }));
  },
  _mountWhenReady() {
    const _0x1a2d34 = this.nodeId,
      _0x3ac940 = () => {
        if (!this.active || this.nodeId !== _0x1a2d34) return;
        const _0x597a95 = document.getElementById(_0x1a2d34);
        if (!_0x597a95) {
          this._retryCount++;
          if (this._retryCount > 10) {
            this.exit({ silent: true });
            return;
          }
          this._retryRaf = requestAnimationFrame(_0x3ac940);
          return;
        }
        ((this.wrapperEl = _0x597a95),
          window.v2FocusOnNodes?.([_0x1a2d34]),
          this._applyFrozenUI(true),
          this._applyDimMode(true),
          this._createUI(),
          this._bindEvents(),
          this._syncDurationAndDefaults(),
          this._render());
      };
    this._retryRaf = requestAnimationFrame(_0x3ac940);
  },
  _createUI() {
    if (!this.wrapperEl) return;
    this.wrapperEl.querySelectorAll('.v2-video-clipbar').forEach((_0xda1f6a) => _0xda1f6a.remove());
    const _0x46f031 = document.createElement('div');
    ((_0x46f031.className = 'v2-video-clipbar'),
      _0x46f031.addEventListener('pointerdown', (_0x9b45f8) => _0x9b45f8.stopPropagation()),
      _0x46f031.addEventListener('click', (_0x16a78c) => _0x16a78c.stopPropagation()),
      _0x46f031.addEventListener('dblclick', (_0x5084d3) => {
        (_0x5084d3.preventDefault(), _0x5084d3.stopPropagation());
      }));
    const _0x32cf7b = document.createElement('button');
    ((_0x32cf7b.type = 'button'),
      (_0x32cf7b.className = 'v2-video-clipbtn cancel'),
      (_0x32cf7b.title = audioClipText('controls.cancel')));
    {
      const _0x4a41c8 = 'http://www.w3.org/2000/svg',
        _0x5510a6 = document.createElementNS(_0x4a41c8, 'svg');
      (_0x5510a6.setAttribute('width', '20'),
        _0x5510a6.setAttribute('height', '20'),
        _0x5510a6.setAttribute('viewBox', '0 0 24 24'),
        _0x5510a6.setAttribute('fill', 'none'),
        _0x5510a6.setAttribute('stroke', 'currentColor'),
        _0x5510a6.setAttribute('stroke-width', '2'));
      const _0x1a4889 = document.createElementNS(_0x4a41c8, 'path');
      _0x1a4889.setAttribute('d', 'M18 6L6 18');
      const _0x34039f = document.createElementNS(_0x4a41c8, 'path');
      (_0x34039f.setAttribute('d', 'M6 6l12 12'),
        _0x5510a6.appendChild(_0x1a4889),
        _0x5510a6.appendChild(_0x34039f),
        _0x32cf7b.appendChild(_0x5510a6));
    }
    const _0x31cb71 = document.createElement('button');
    ((_0x31cb71.type = 'button'),
      (_0x31cb71.className = 'v2-video-clipbtn confirm'),
      (_0x31cb71.title = audioClipText('controls.done')));
    {
      const _0xc5b2af = 'http://www.w3.org/2000/svg',
        _0x81a0b8 = document.createElementNS(_0xc5b2af, 'svg');
      (_0x81a0b8.setAttribute('width', '24'),
        _0x81a0b8.setAttribute('height', '24'),
        _0x81a0b8.setAttribute('viewBox', '0 0 24 24'),
        _0x81a0b8.setAttribute('fill', 'none'),
        _0x81a0b8.setAttribute('stroke', 'currentColor'),
        _0x81a0b8.setAttribute('stroke-width', '2.5'));
      const _0x3cab95 = document.createElementNS(_0xc5b2af, 'polyline');
      (_0x3cab95.setAttribute('points', '20 6 9 17 4 12'),
        _0x81a0b8.appendChild(_0x3cab95),
        _0x31cb71.appendChild(_0x81a0b8));
    }
    const _0xbd3787 = document.createElement('div');
    _0xbd3787.className = 'v2-video-cliprow';
    const _0x1f400d = document.createElement('div');
    _0x1f400d.className = 'v2-video-cliptrack';
    const _0x15bc61 = document.createElement('div');
    _0x15bc61.className = 'v2-audio-clipwave';
    {
      const _0xacdef = 'http://www.w3.org/2000/svg',
        _0xad826e = document.createElementNS(_0xacdef, 'svg');
      (_0xad826e.setAttribute('viewBox', '0 0 200 44'),
        _0xad826e.setAttribute('preserveAspectRatio', 'none'));
      const _0xa1182 = document.createElementNS(_0xacdef, 'path');
      (_0xa1182.setAttribute('fill', 'none'),
        _0xa1182.setAttribute('d', ''),
        _0xa1182.classList.add('v2-audio-clipwave-path'));
      const _0x43ca8f = document.createElementNS(_0xacdef, 'path');
      (_0x43ca8f.setAttribute('fill', 'none'),
        _0x43ca8f.setAttribute('d', 'M0,22 L200,22'),
        _0x43ca8f.classList.add('v2-audio-clipwave-mid'),
        _0xad826e.appendChild(_0xa1182),
        _0xad826e.appendChild(_0x43ca8f),
        _0x15bc61.appendChild(_0xad826e),
        (this._wavePathEl = _0xa1182));
    }
    const _0x6a0ba8 = document.createElement('div');
    _0x6a0ba8.className = 'v2-video-clipticks';
    const _0x584a7d = document.createElement('div');
    _0x584a7d.className = 'v2-video-cliprange';
    const _0x1efb5a = document.createElement('div');
    _0x1efb5a.className = 'v2-video-clipselection';
    const _0x591a9d = document.createElement('div');
    _0x591a9d.className = 'v2-video-clipplayhead';
    const _0x4ef970 = document.createElement('div');
    ((_0x4ef970.className = 'v2-video-cliphandle left'), (_0x4ef970.dataset.handle = 'left'));
    const _0x4b4791 = document.createElement('div');
    ((_0x4b4791.className = 'v2-video-cliphandle right'), (_0x4b4791.dataset.handle = 'right'));
    const _0x1f6665 = document.createElement('div');
    ((_0x1f6665.className = 'v2-video-cliplabel'),
      (_0x1f6665.textContent = '0.00s'),
      _0x584a7d.appendChild(_0x1efb5a),
      _0x584a7d.appendChild(_0x4ef970),
      _0x584a7d.appendChild(_0x4b4791),
      _0x1f400d.appendChild(_0x15bc61),
      _0x1f400d.appendChild(_0x584a7d),
      _0x1f400d.appendChild(_0x591a9d),
      _0x1f400d.appendChild(_0x6a0ba8),
      _0x1f400d.appendChild(_0x1f6665),
      _0xbd3787.appendChild(_0x32cf7b),
      _0xbd3787.appendChild(_0x1f400d),
      _0xbd3787.appendChild(_0x31cb71),
      _0x46f031.appendChild(_0xbd3787));
    const _0x27a2ad = document.createElement('div');
    _0x27a2ad.className = 'v2-video-cliphelper-row';
    const _0x2805be = document.createElement('div');
    _0x2805be.className = 'v2-video-cliphelper-left';
    const _0x22c273 = this._buildHelperMessages();
    this._msgEls = _0x22c273.map((_0x14c15b, _0x5efffc) => {
      const _0x11d55d = document.createElement('div');
      _0x11d55d.className = 'v2-video-cliphelper-msg';
      if (_0x5efffc !== 0) _0x11d55d.classList.add('hide-down');
      return ((_0x11d55d.innerHTML = _0x14c15b.html), _0x2805be.appendChild(_0x11d55d), _0x11d55d);
    });
    if (this._msgInterval) window.clearInterval(this._msgInterval);
    let _0x13a09b = 0;
    this._msgInterval = window.setInterval(() => {
      if (!this.active || !this._msgEls) return;
      const _0x4dacb3 = this._msgEls[_0x13a09b];
      _0x13a09b = (_0x13a09b + 1) % this._msgEls.length;
      const _0x3bfd2c = this._msgEls[_0x13a09b];
      (_0x4dacb3.classList.remove('hide-down'),
        _0x4dacb3.classList.add('hide-up'),
        _0x3bfd2c.classList.remove('hide-up'),
        _0x3bfd2c.classList.remove('hide-down'),
        window.setTimeout(() => {
          _0x4dacb3 &&
            _0x4dacb3.classList.contains('hide-up') &&
            (_0x4dacb3.classList.remove('hide-up'), _0x4dacb3.classList.add('hide-down'));
        }, 0x12c));
    }, 0xfa0);
    const _0x4d4fa3 = document.createElement('div');
    ((_0x4d4fa3.className = 'v2-video-clip-smartwrap'),
      _0x27a2ad.appendChild(_0x2805be),
      _0x27a2ad.appendChild(_0x4d4fa3),
      _0x46f031.appendChild(_0x27a2ad),
      this.wrapperEl.appendChild(_0x46f031),
      (this.barEl = _0x46f031),
      (this.cancelBtnEl = _0x32cf7b),
      (this.confirmBtnEl = _0x31cb71),
      (this.trackEl = _0x1f400d),
      (this.selectionEl = _0x1efb5a),
      (this.leftHandleEl = _0x4ef970),
      (this.rightHandleEl = _0x4b4791),
      (this.playheadEl = _0x591a9d),
      (this.labelEl = _0x1f6665),
      this._subscribeLocaleChanges(),
      this._syncLocaleTexts());
  },
  _buildHelperMessages() {
    return [
      {
        html:
          '<span class="v2-video-cliphelperkbd">Esc</span><span>' +
          audioClipText('helpers.cancel') +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">Space</span><span>' +
          audioClipText('helpers.playPauseRange') +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">←</span> <span class="v2-video-cliphelperkbd">→</span> <span>' +
          audioClipText('helpers.moveRange') +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">Shift</span> + <span class="v2-video-cliphelperkbd">←</span>/<span class="v2-video-cliphelperkbd">→</span> <span>' +
          audioClipText('helpers.moveRangeLarge') +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">I</span>/<span class="v2-video-cliphelperkbd">O</span> <span>' +
          audioClipText('helpers.setInOut') +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">Ctrl</span> + <span class="v2-video-cliphelperkbd">←</span>/<span class="v2-video-cliphelperkbd">→</span> <span>' +
          audioClipText('helpers.fineTuneIn') +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">Alt</span> + <span class="v2-video-cliphelperkbd">←</span>/<span class="v2-video-cliphelperkbd">→</span> <span>' +
          audioClipText('helpers.fineTuneOut') +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">' +
          audioClipText('helpers.wheelKey') +
          '</span><span>' +
          audioClipText('helpers.sameAsArrows') +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">' +
          audioClipText('helpers.doubleClickSelection') +
          '</span><span>' +
          audioClipText('helpers.restoreDefault') +
          '</span>',
      },
    ];
  },
  _subscribeLocaleChanges() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts());
  },
  _syncLocaleTexts() {
    if (this.cancelBtnEl) this.cancelBtnEl.title = audioClipText('controls.cancel');
    if (this.confirmBtnEl) this.confirmBtnEl.title = audioClipText('controls.done');
    if (Array.isArray(this._msgEls)) {
      const _0x4d488b = this._buildHelperMessages();
      this._msgEls.forEach((_0x5f3ddb, _0x267bd4) => {
        if (_0x4d488b[_0x267bd4]) _0x5f3ddb.innerHTML = _0x4d488b[_0x267bd4].html;
      });
    }
  },
  _resolveAudioSrcFromNode(_0x2a9ab4) {
    if (!_0x2a9ab4) return '';
    const _0x237428 = localPathToUrl(_0x2a9ab4.localPath);
    return _0x237428 || _0x2a9ab4.src || _0x2a9ab4.audioUrl || _0x2a9ab4.resultUrl || '';
  },
  _getAudioEl() {
    if (!this.wrapperEl) return null;
    if (this.audioEl && this.audioEl.isConnected && this.wrapperEl.contains?.(this.audioEl))
      return this.audioEl;
    const _0x4a294a = this.wrapperEl.querySelector('audio.audio-player');
    return ((this.audioEl = _0x4a294a || null), _0x4a294a);
  },
  _getAudioElementSource(_0x10e300) {
    return String(_0x10e300?.getAttribute?.('src') || _0x10e300?.currentSrc || _0x10e300?.src || '').trim();
  },
  _setClipMediaKeepAlive(_0x206809, _0x5d6dc7) {
    if (!_0x206809?.dataset) return;
    if (_0x5d6dc7) {
      _0x206809.dataset.desktopMediaKeepAlive = 'audio-clip';
      return;
    }
    _0x206809.dataset.desktopMediaKeepAlive === 'audio-clip' &&
      delete _0x206809.dataset.desktopMediaKeepAlive;
  },
  _readDurationSec(_0x47def6) {
    const _0x468c34 = Number(_0x47def6?.duration);
    if (!Number.isFinite(_0x468c34) || _0x468c34 <= 0) return 0;
    return _0x468c34;
  },
  _applyDurationSec(_0x28d54b) {
    const _0x29a0cb = Number(_0x28d54b);
    if (!Number.isFinite(_0x29a0cb) || _0x29a0cb <= 0) return false;
    this.durationSec = _0x29a0cb;
    if (!(this.endSec > this.startSec)) {
      const _0xae382c = Math.min(3, _0x29a0cb),
        _0x28369c = Math.max(0, (_0x29a0cb - _0xae382c) / 2);
      return ((this.startSec = _0x28369c), (this.endSec = _0x28369c + _0xae382c), true);
    }
    ((this.startSec = Math.max(0, Math.min(this.startSec, _0x29a0cb))),
      (this.endSec = Math.max(0, Math.min(this.endSec, _0x29a0cb))));
    if (this.endSec <= this.startSec) {
      const _0xb09fa8 = Math.min(3, _0x29a0cb);
      ((this.startSec = 0), (this.endSec = _0xb09fa8));
    }
    return true;
  },
  async _syncDurationAndDefaults() {
    const _0x171082 = appStore.getState().nodes[this.nodeId];
    if (!_0x171082) return;
    const _0x102bca = this._resolveAudioSrcFromNode(_0x171082);
    if (!_0x102bca) {
      this.exit({ silent: true });
      return;
    }
    const _0x5b717a = this._getAudioEl();
    if (!_0x5b717a) {
      (window.showToast?.(audioClipText('toasts.playerMissing'), 'error'), this.exit({ silent: true }));
      return;
    }
    const _0x141551 = ++this._sourceToken;
    this._setClipMediaKeepAlive(_0x5b717a, true);
    try {
      _0x5b717a.pause();
    } catch (_0x10f4d9) {}
    try {
      _0x5b717a.loop = false;
    } catch (_0x4041c9) {}
    !this._onLoadedMeta &&
      ((this._onLoadedMeta = () => {
        if (!this.active) return;
        const _0x46b0d7 = this._readDurationSec(_0x5b717a);
        (this._applyDurationSec(_0x46b0d7, _0x5b717a), this._render());
      }),
      (this._onDurationChange = () => {
        if (!this.active) return;
        const _0x39940b = this._readDurationSec(_0x5b717a);
        (this._applyDurationSec(_0x39940b, _0x5b717a), this._render());
      }),
      _0x5b717a.addEventListener('loadedmetadata', this._onLoadedMeta, { once: true }),
      _0x5b717a.addEventListener('durationchange', this._onDurationChange));
    (this._ensureWaveform(_0x102bca), await attachDesktopMediaPlaybackSource(_0x5b717a, _0x102bca));
    if (!this.active || _0x141551 !== this._sourceToken) return;
    if (!this._getAudioElementSource(_0x5b717a)) {
      ((_0x5b717a.preload = 'auto'), (_0x5b717a.src = _0x102bca));
      try {
        _0x5b717a.load();
      } catch (_0x420a42) {}
    }
    const _0x4b2327 = this._readDurationSec(_0x5b717a);
    if (this._applyDurationSec(_0x4b2327, _0x5b717a)) {
      (this._render(), this._startPlayheadLoop());
      return;
    }
    this._startPlayheadLoop();
  },
  async _ensureWaveform(_0x4b2f8e) {
    const _0x239068 = String(_0x4b2f8e || '').trim();
    if (!_0x239068) return;
    if (!this._wavePathEl) return;
    const _0x55148e = ++this._waveToken,
      [_0x7f0374, _0x3a1673] = await Promise.all([
        getWaveformBarsPathFromUrl(_0x239068, { width: 200, height: 44, samples: 200 }),
        getAudioDurationFromUrl(_0x239068),
      ]);
    if (!this.active) return;
    if (_0x55148e !== this._waveToken) return;
    this._applyDurationSec(_0x3a1673) && (this._render(), this._startPlayheadLoop());
    if (!this._wavePathEl || !_0x7f0374) return;
    this._wavePathEl.setAttribute('d', _0x7f0374);
  },
  _startPlayheadLoop() {
    if (this._playheadRaf) cancelAnimationFrame(this._playheadRaf);
    const _0x216d06 = () => {
      if (!this.active) return;
      (this._renderPlayhead(), (this._playheadRaf = requestAnimationFrame(_0x216d06)));
    };
    this._playheadRaf = requestAnimationFrame(_0x216d06);
  },
  _renderPlayhead() {
    if (!this.playheadEl || !this.trackEl) return;
    const _0x1d510c = this.durationSec;
    if (!Number.isFinite(_0x1d510c) || _0x1d510c <= 0) {
      this.playheadEl.style.display = 'none';
      return;
    }
    const _0x54e75a = this._getAudioEl();
    if (!_0x54e75a) {
      this.playheadEl.style.display = 'none';
      return;
    }
    let _0x2e60f7 = Number(_0x54e75a.currentTime) || 0;
    (_0x2e60f7 < this.startSec || _0x2e60f7 > this.endSec) &&
      !_0x54e75a.paused &&
      ((_0x54e75a.currentTime = this.startSec), (_0x2e60f7 = this.startSec));
    const _0x272379 = Math.max(0, Math.min(1, _0x2e60f7 / _0x1d510c));
    ((this.playheadEl.style.display = 'block'), (this.playheadEl.style.left = _0x272379 * 100 + '%'));
  },
  _bindEvents() {
    if (!this.barEl) return;
    (this.cancelBtnEl?.addEventListener('click', (_0x17e7af) => {
      (_0x17e7af.stopPropagation(), this.exit());
    }),
      this.confirmBtnEl?.addEventListener('click', (_0x13adeb) => {
        (_0x13adeb.stopPropagation(), this._confirm());
      }));
    const _0x49d748 = (_0x481e4d) => {
      if (!this.trackEl || !this.active || this._dragMode) return;
      const _0x485b24 = _0x481e4d.clientX,
        _0x564254 = this.selectionEl.getBoundingClientRect(),
        _0x44c4f4 = 20,
        _0x41845e = Math.abs(_0x485b24 - _0x564254.left) < _0x44c4f4,
        _0x126524 = Math.abs(_0x485b24 - _0x564254.right) < _0x44c4f4;
      if (_0x41845e)
        (this.leftHandleEl.classList.add('hover-active'),
          this.rightHandleEl.classList.remove('hover-active'),
          (this.selectionEl.style.cursor = 'var(--resize-ew-cursor)'));
      else
        _0x126524
          ? (this.rightHandleEl.classList.add('hover-active'),
            this.leftHandleEl.classList.remove('hover-active'),
            (this.selectionEl.style.cursor = 'var(--resize-ew-cursor)'))
          : (this.leftHandleEl.classList.remove('hover-active'),
            this.rightHandleEl.classList.remove('hover-active'),
            (this.selectionEl.style.cursor = 'var(--grab-cursor)'));
    };
    this.trackEl?.addEventListener('pointermove', _0x49d748);
    const _0x17f47b = 30,
      _0x1db384 = (_0x5bf2b6) => (Number(_0x5bf2b6 || 1) / _0x17f47b) * 1,
      _0x26c858 = () => {
        const _0x518cd9 = this.durationSec;
        if (!Number.isFinite(_0x518cd9) || _0x518cd9 <= 0) return 0.1;
        return Math.min(0.1, _0x518cd9);
      },
      _0x3cfdbf = (_0xf606bb, _0x63d10a, _0x55165b) => Math.max(_0x63d10a, Math.min(_0x55165b, _0xf606bb)),
      _0x1e4181 = (_0x53e2ed) => {
        if (!this.trackEl || !this.active) return;
        const _0x3b0eae = this.durationSec;
        if (!Number.isFinite(_0x3b0eae) || _0x3b0eae <= 0) return;
        const _0x2cd0d1 = this._getAudioEl();
        if (!_0x2cd0d1) return;
        const _0x11cf3 = this.trackEl.getBoundingClientRect();
        if (!_0x11cf3.width) return;
        const _0x2e5f2b = _0x53e2ed - _0x11cf3.left,
          _0x369802 = _0x3cfdbf(_0x2e5f2b / _0x11cf3.width, 0, 1),
          _0x49a491 = _0x369802 * _0x3b0eae,
          _0x5dfaeb = Math.max(0, _0x3b0eae - 0.001);
        try {
          _0x2cd0d1.currentTime = _0x3cfdbf(_0x49a491, 0, _0x5dfaeb);
        } catch (_0x4e7ec6) {}
        this._renderPlayhead();
      },
      _0x5963bd = () => {
        const _0x11cbb9 = this._getAudioEl();
        if (!_0x11cbb9) return;
        if (!_0x11cbb9.paused) return;
        const _0x2f343c = Number(_0x11cbb9.currentTime) || 0;
        if (_0x2f343c >= this.startSec && _0x2f343c <= this.endSec) return;
        try {
          _0x11cbb9.currentTime = this.startSec;
        } catch (_0x30d8c4) {}
      },
      _0x16226f = (_0x246c2d, _0x893b3a) => {
        const _0x1731b0 = this.durationSec;
        if (!Number.isFinite(_0x1731b0) || _0x1731b0 <= 0) return;
        const _0x34b25a = _0x1db384(_0x893b3a) * (_0x246c2d >= 0 ? 1 : -1),
          _0x2cf606 = _0x26c858(),
          _0x5071b7 = Math.max(_0x2cf606, this.endSec - this.startSec);
        let _0x343649 = this.startSec + _0x34b25a,
          _0x2977dd = this.endSec + _0x34b25a;
        _0x343649 < 0 && ((_0x343649 = 0), (_0x2977dd = _0x5071b7));
        _0x2977dd > _0x1731b0 && ((_0x2977dd = _0x1731b0), (_0x343649 = Math.max(0, _0x1731b0 - _0x5071b7)));
        ((this.startSec = _0x343649), (this.endSec = _0x2977dd));
        const _0x5091a2 = this._getAudioEl();
        if (_0x5091a2) {
          try {
            if (!_0x5091a2.paused) _0x5091a2.pause();
          } catch (_0x2d70e9) {}
          try {
            _0x5091a2.currentTime = _0x343649;
          } catch (_0x5e528e) {}
        } else _0x5963bd();
        this._render();
      },
      _0x5af5b8 = (_0x9b6ccb) => {
        const _0x19e7cf = this.durationSec;
        if (!Number.isFinite(_0x19e7cf) || _0x19e7cf <= 0) return;
        const _0x423748 = _0x1db384(1) * (_0x9b6ccb >= 0 ? 1 : -1),
          _0x15d70e = _0x26c858(),
          _0x4a2f2c = Math.max(0, this.endSec - _0x15d70e);
        this.startSec = _0x3cfdbf(this.startSec + _0x423748, 0, _0x4a2f2c);
        const _0x2f794e = this._getAudioEl();
        if (_0x2f794e) {
          try {
            if (!_0x2f794e.paused) _0x2f794e.pause();
          } catch (_0x5b981d) {}
          try {
            _0x2f794e.currentTime = this.startSec;
          } catch (_0x28040b) {}
        }
        this._render();
      },
      _0x35c286 = (_0x5ad90f) => {
        const _0x43b8f2 = this.durationSec;
        if (!Number.isFinite(_0x43b8f2) || _0x43b8f2 <= 0) return;
        const _0x33cf1a = _0x1db384(1) * (_0x5ad90f >= 0 ? 1 : -1),
          _0x373600 = _0x26c858(),
          _0x55354f = Math.min(_0x43b8f2, this.startSec + _0x373600);
        this.endSec = _0x3cfdbf(this.endSec + _0x33cf1a, _0x55354f, _0x43b8f2);
        const _0x491dce = this._getAudioEl();
        if (_0x491dce) {
          try {
            if (!_0x491dce.paused) _0x491dce.pause();
          } catch (_0x1c1429) {}
          try {
            _0x491dce.currentTime = this.endSec;
          } catch (_0x5b62b0) {}
        }
        this._render();
      },
      _0x3d0d1f = (_0x8f2ae3) => {
        const _0x29c6b3 = this.durationSec;
        if (!Number.isFinite(_0x29c6b3) || _0x29c6b3 <= 0) return;
        const _0x3a2f63 = this._getAudioEl();
        if (!_0x3a2f63) return;
        let _0x515cbc = Number(_0x3a2f63.currentTime) || 0;
        _0x515cbc = _0x3cfdbf(_0x515cbc, 0, _0x29c6b3);
        const _0x356dcd = _0x26c858();
        if (_0x8f2ae3 === 'in') {
          const _0x254d03 = Math.max(0, this.endSec - _0x356dcd);
          this.startSec = _0x3cfdbf(_0x515cbc, 0, _0x254d03);
        } else {
          const _0x1cdb1a = Math.min(_0x29c6b3, this.startSec + _0x356dcd);
          this.endSec = _0x3cfdbf(_0x515cbc, _0x1cdb1a, _0x29c6b3);
        }
        this._render();
      },
      _0x131c51 = (_0x5674cf) => {
        if (!this.trackEl || !this.active) return;
        const _0x409481 = _0x5674cf.target.closest('.v2-video-cliphandle'),
          _0x3f462f = !!_0x5674cf.target.closest('.v2-video-clipselection'),
          _0x4e3b75 = this.trackEl.getBoundingClientRect();
        if (!_0x4e3b75.width) return;
        const _0x9994bc = _0x5674cf.clientX,
          _0x3cdaf8 = this.selectionEl.getBoundingClientRect(),
          _0x59da17 = 20,
          _0x45489c = Math.abs(_0x9994bc - _0x3cdaf8.left) < _0x59da17,
          _0x8bfa2 = Math.abs(_0x9994bc - _0x3cdaf8.right) < _0x59da17;
        if (_0x45489c || (_0x409481 && _0x409481.dataset.handle === 'left'))
          ((this._dragMode = 'left'), this.leftHandleEl.classList.add('hover-active'));
        else {
          if (_0x8bfa2 || (_0x409481 && _0x409481.dataset.handle === 'right'))
            ((this._dragMode = 'right'), this.rightHandleEl.classList.add('hover-active'));
          else {
            if (_0x3f462f) this._dragMode = 'move';
            else {
              this._dragMode = 'scrub';
              const _0x1e6ec5 = this._getAudioEl();
              if (_0x1e6ec5)
                try {
                  if (!_0x1e6ec5.paused) _0x1e6ec5.pause();
                } catch (_0x382b24) {}
            }
          }
        }
        if (this._dragMode === 'move') {
          const _0x275ee4 = this.selectionEl.getBoundingClientRect();
          this._dragOffsetPx = _0x5674cf.clientX - _0x275ee4.left;
        } else this._dragOffsetPx = 0;
        (_0x5674cf.preventDefault(), _0x5674cf.stopPropagation());
        if (this._dragMode === 'scrub') _0x1e4181(_0x5674cf.clientX);
        else this._handleDragAtClientX(_0x5674cf.clientX);
        if (this._onPointerMove) window.removeEventListener('pointermove', this._onPointerMove, true);
        if (this._onPointerUp) window.removeEventListener('pointerup', this._onPointerUp, true);
        ((this._onPointerMove = (_0x3dca34) => {
          if (!this.active || !this.trackEl) return;
          (_0x3dca34.preventDefault(), _0x3dca34.stopPropagation());
          if (this._dragMode === 'scrub') _0x1e4181(_0x3dca34.clientX);
          else this._handleDragAtClientX(_0x3dca34.clientX);
        }),
          (this._onPointerUp = (_0x4c1b46) => {
            if (!this.active) return;
            (_0x4c1b46.preventDefault(),
              _0x4c1b46.stopPropagation(),
              (this._dragMode = null),
              (this._dragOffsetPx = 0),
              this.leftHandleEl?.classList.remove('hover-active'),
              this.rightHandleEl?.classList.remove('hover-active'));
            if (this._onPointerMove) window.removeEventListener('pointermove', this._onPointerMove, true);
            if (this._onPointerUp) window.removeEventListener('pointerup', this._onPointerUp, true);
            ((this._onPointerMove = null), (this._onPointerUp = null));
          }),
          window.addEventListener('pointermove', this._onPointerMove, true),
          window.addEventListener('pointerup', this._onPointerUp, true));
      };
    (this.trackEl?.addEventListener('pointerdown', _0x131c51),
      this.trackEl?.addEventListener(
        'wheel',
        (_0x5089cd) => {
          if (!this.active) return;
          (_0x5089cd.preventDefault(), _0x5089cd.stopPropagation());
          const _0x265d21 = Number(_0x5089cd.deltaX) || 0,
            _0x4819ac = Number(_0x5089cd.deltaY) || 0,
            _0x30ba83 = Math.abs(_0x265d21) > Math.abs(_0x4819ac) ? _0x265d21 : _0x4819ac;
          if (!_0x30ba83) return;
          const _0x3fb2bf = _0x30ba83 > 0 ? 1 : -1;
          if (_0x5089cd.ctrlKey || _0x5089cd.metaKey) _0x5af5b8(_0x3fb2bf);
          else {
            if (_0x5089cd.altKey) _0x35c286(_0x3fb2bf);
            else {
              const _0x3c4c55 = _0x5089cd.shiftKey ? 10 : 1;
              _0x16226f(_0x3fb2bf, _0x3c4c55);
            }
          }
        },
        { passive: false },
      ),
      this.selectionEl?.addEventListener('dblclick', (_0x232568) => {
        if (!this.active) return;
        (_0x232568.preventDefault(), _0x232568.stopPropagation());
        const _0x3d31c2 = this.durationSec;
        if (!_0x3d31c2 || !Number.isFinite(_0x3d31c2) || _0x3d31c2 <= 0) return;
        const _0x1ff059 = this.selectionEl.getBoundingClientRect(),
          _0x4894b7 = _0x232568.clientX,
          _0x5fdaec = 24;
        if (_0x4894b7 - _0x1ff059.left < _0x5fdaec || _0x1ff059.right - _0x4894b7 < _0x5fdaec) return;
        const _0x28f6ec = Math.min(3, _0x3d31c2),
          _0x5b7ddf = (this.startSec + this.endSec) / 2,
          _0x1ab972 = Math.max(0, Math.min(_0x3d31c2 - _0x28f6ec, _0x5b7ddf - _0x28f6ec / 2));
        ((this.startSec = _0x1ab972), (this.endSec = _0x1ab972 + _0x28f6ec));
        const _0x264130 = this._getAudioEl();
        if (_0x264130 && _0x264130.paused) _0x264130.currentTime = this.startSec;
        this._render();
      }),
      this._onKeyDown &&
        (window.removeEventListener('keydown', this._onKeyDown, true), (this._onKeyDown = null)),
      (this._onKeyDown = (_0x3075c) => {
        if (!this.active) return;
        if (_0x3075c.key === 'Escape') {
          (_0x3075c.preventDefault(), this.exit());
          return;
        }
        if (_0x3075c.key === ' ' || _0x3075c.code === 'Space') {
          _0x3075c.preventDefault();
          const _0x41a639 = this._getAudioEl();
          _0x41a639 &&
            (_0x41a639.paused
              ? ((_0x41a639.currentTime < this.startSec || _0x41a639.currentTime >= this.endSec) &&
                  (_0x41a639.currentTime = this.startSec),
                _0x41a639.play())
              : _0x41a639.pause());
          return;
        }
        if (_0x3075c.key === 'i' || _0x3075c.key === 'I') {
          (_0x3075c.preventDefault(), _0x3d0d1f('in'));
          return;
        }
        if (_0x3075c.key === 'o' || _0x3075c.key === 'O') {
          (_0x3075c.preventDefault(), _0x3d0d1f('out'));
          return;
        }
        if (_0x3075c.key === 'ArrowLeft' || _0x3075c.key === 'ArrowRight') {
          _0x3075c.preventDefault();
          const _0x5c5c50 = _0x3075c.key === 'ArrowRight' ? 1 : -1;
          if (_0x3075c.ctrlKey || _0x3075c.metaKey) {
            _0x5af5b8(_0x5c5c50);
            return;
          }
          if (_0x3075c.altKey) {
            _0x35c286(_0x5c5c50);
            return;
          }
          const _0x2365f2 = _0x3075c.shiftKey ? 10 : 1;
          _0x16226f(_0x5c5c50, _0x2365f2);
        }
      }),
      window.addEventListener('keydown', this._onKeyDown, true),
      this._onDocClick &&
        (document.removeEventListener('pointerdown', this._onDocClick, true), (this._onDocClick = null)),
      (this._onDocClick = (_0x335694) => {
        if (!this.active || !this.barEl) return;
        if (this.barEl.contains(_0x335694.target)) return;
        this.exit({ silent: true });
      }),
      document.addEventListener('pointerdown', this._onDocClick, true));
  },
  _togglePlayRange() {
    const _0x1acaf5 = this._getAudioEl(),
      _0xad29b2 = this.durationSec;
    if (!_0x1acaf5 || !Number.isFinite(_0xad29b2) || _0xad29b2 <= 0) return;
    try {
      if (!_0x1acaf5.paused) {
        _0x1acaf5.pause();
        return;
      }
    } catch (_0x150144) {}
    let _0x55efdc = Number(_0x1acaf5.currentTime) || 0;
    if (_0x55efdc < this.startSec || _0x55efdc >= this.endSec)
      try {
        _0x1acaf5.currentTime = this.startSec;
      } catch (_0x2bf2d0) {}
    try {
      _0x1acaf5.play();
    } catch (_0x3a6cdf) {}
  },
  _handleDragAtClientX(_0x30a5e6) {
    if (!this.trackEl || !this.active) return;
    const _0x1c48ed = this.durationSec;
    if (!_0x1c48ed || !Number.isFinite(_0x1c48ed) || _0x1c48ed <= 0) {
      this._render();
      return;
    }
    const _0x15d6f4 = this.trackEl.getBoundingClientRect();
    if (!_0x15d6f4.width) return;
    const _0x13b72a = _0x30a5e6 - _0x15d6f4.left,
      _0x79e27 = Math.max(0, Math.min(1, _0x13b72a / _0x15d6f4.width)),
      _0x5bbc08 = _0x79e27 * _0x1c48ed,
      _0x3e0648 = Math.min(0.1, _0x1c48ed),
      _0x53aecc = Math.max(_0x3e0648, this.endSec - this.startSec);
    if (this._dragMode === 'left') {
      const _0x23e315 = Math.max(0, Math.min(_0x5bbc08, this.endSec - _0x3e0648));
      this.startSec = _0x23e315;
      const _0x2ae015 = this._getAudioEl();
      if (_0x2ae015)
        try {
          _0x2ae015.currentTime = _0x23e315;
        } catch (_0x48cbef) {}
    } else {
      if (this._dragMode === 'right') {
        const _0x19be50 = Math.max(this.startSec + _0x3e0648, Math.min(_0x1c48ed, _0x5bbc08));
        this.endSec = _0x19be50;
      } else {
        if (this._dragMode === 'move') {
          const _0x389621 = this.selectionEl.getBoundingClientRect().left - _0x15d6f4.left,
            _0x1f2837 = _0x30a5e6 - _0x15d6f4.left - this._dragOffsetPx,
            _0x545655 = _0x1f2837 - _0x389621,
            _0x4ce560 = (_0x545655 / _0x15d6f4.width) * _0x1c48ed,
            _0x3bc4af = Math.max(0, Math.min(_0x1c48ed - _0x53aecc, this.startSec + _0x4ce560));
          ((this.startSec = _0x3bc4af), (this.endSec = _0x3bc4af + _0x53aecc));
          const _0x30e1e0 = this._getAudioEl();
          if (_0x30e1e0)
            try {
              _0x30e1e0.currentTime = _0x3bc4af;
            } catch (_0x2a30e9) {}
        }
      }
    }
    this._render();
  },
  _render() {
    if (!this.active || !this.trackEl || !this.selectionEl || !this.leftHandleEl || !this.rightHandleEl)
      return;
    const _0x30298d = this.durationSec,
      _0x4f4df6 = Number.isFinite(_0x30298d) && _0x30298d > 0,
      _0x233011 = _0x4f4df6 ? Math.max(0, Math.min(this.startSec, _0x30298d)) : 0,
      _0x586a4d = _0x4f4df6 ? Math.max(0, Math.min(this.endSec, _0x30298d)) : 0,
      _0x4563e8 = Math.max(0, _0x586a4d - _0x233011);
    if (_0x4f4df6) {
      const _0x24b973 = (_0x233011 / _0x30298d) * 100,
        _0x424a46 = (_0x4563e8 / _0x30298d) * 100;
      ((this.selectionEl.style.left = _0x24b973 + '%'),
        (this.selectionEl.style.width = _0x424a46 + '%'),
        (this.leftHandleEl.style.left = _0x24b973 + '%'),
        (this.rightHandleEl.style.left = _0x24b973 + _0x424a46 + '%'),
        this.labelEl &&
          ((this.labelEl.textContent = _0x4563e8.toFixed(2) + 's'),
          (this.labelEl.style.left = _0x24b973 + _0x424a46 / 2 + '%')));
    } else
      ((this.selectionEl.style.left = '0%'),
        (this.selectionEl.style.width = '0%'),
        (this.leftHandleEl.style.left = '0%'),
        (this.rightHandleEl.style.left = '0%'),
        this.labelEl &&
          ((this.labelEl.textContent = audioClipText('status.loading')), (this.labelEl.style.left = '50%')));
    this._renderPlayhead();
    if (this.confirmBtnEl) {
      const _0x562cc7 = _0x4f4df6 && _0x4563e8 >= 0.1;
      ((this.confirmBtnEl.disabled = !_0x562cc7),
        (this.confirmBtnEl.dataset.disabled = _0x562cc7 ? 'false' : 'true'),
        this.confirmBtnEl.dataset.loading !== 'true' &&
          (this.confirmBtnEl.innerHTML =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'));
    }
  },
  async _confirm() {
    if (!this.confirmBtnEl) return;
    const _0x1b9afb = this.confirmBtnEl;
    if (_0x1b9afb.dataset.disabled === 'true') return;
    const _0x9611d8 = appStore.getState().nodes,
      _0x1a61e0 = _0x9611d8[this.anchorNodeId];
    if (!_0x1a61e0) {
      this.exit({ silent: true });
      return;
    }
    const _0x54b432 = this.durationSec;
    if (!_0x54b432 || !Number.isFinite(_0x54b432) || _0x54b432 <= 0) return;
    const _0x8c3451 = Math.max(0, Math.min(this.startSec, _0x54b432)),
      _0x32879c = Math.max(0, Math.min(this.endSec, _0x54b432));
    if (!(_0x32879c > _0x8c3451)) return;
    const _0x405270 =
      localPathToUrl(_0x1a61e0.localPath) || _0x1a61e0.src || _0x1a61e0.audioUrl || _0x1a61e0.resultUrl || '';
    if (!_0x405270) return;
    ((_0x1b9afb.dataset.disabled = 'true'),
      (_0x1b9afb.dataset.loading = 'true'),
      (_0x1b9afb.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><g style="animation:spin 1s linear infinite;transform-origin:50% 50%;transform-box:fill-box;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></g></svg>'),
      window.showToast?.(audioClipText('toasts.cutting'), 'info'));
    try {
      let _0x3969a5 = null;
      if (canUseElectronMediaTask())
        _0x3969a5 = await enqueueElectronMediaTask(
          {
            kind: 'audioCut',
            nodeId: this.anchorNodeId,
            src: _0x405270,
            args: { start: _0x8c3451, end: _0x32879c },
          },
          { wait: true, timeout: 0x493e0 },
        );
      else {
        const _0x2f4d24 = await requester({
          url: '/api/v2/audio/cut',
          method: 'POST',
          provider: 'local',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ src: _0x405270, start: _0x8c3451, end: _0x32879c }),
          allow404Null: true,
          returnMeta: true,
        });
        if (_0x2f4d24?.status === 0x194 || _0x2f4d24?.data == null)
          throw new Error(audioClipText('errors.cutApiMissing'));
        _0x3969a5 = _0x2f4d24.data || {};
      }
      const _0x433fb9 =
          _0x3969a5?.result && typeof _0x3969a5.result === 'object' ? _0x3969a5.result : _0x3969a5,
        _0x289a69 = normalizeAudioCutResultLocalPath(_0x3969a5);
      if (!_0x289a69 || _0x3969a5?.success === false || _0x433fb9?.success === false)
        throw new Error(
          _0x433fb9?.error || _0x3969a5?.error || _0x3969a5?.message || audioClipText('errors.cutFailed'),
        );
      const _0x4e1070 = _0x1a61e0.width || 0x168,
        _0x1eaada = _0x1a61e0.height || 150,
        _0x6c0d2e = calcSafeSpawnPosNearNode(appStore.getState().nodes, _0x1a61e0, _0x4e1070, _0x1eaada),
        _0x2d1d2c = generateId('source-audio-cut');
      (appStore.addNode({
        id: _0x2d1d2c,
        type: 'source-audio',
        x: _0x6c0d2e.x,
        y: _0x6c0d2e.y,
        width: _0x4e1070,
        height: _0x1eaada,
        name: audioClipText('output.nodeName', {
          name: _0x1a61e0.name || audioClipText('output.audioFallback'),
        }),
        src: '/' + _0x289a69,
        localPath: _0x289a69,
        audioDuration: Math.max(0, _0x32879c - _0x8c3451),
        fileName: _0x433fb9?.filename || _0x3969a5?.filename || '',
        waveformLocalPath: _0x433fb9?.waveformLocalPath || _0x3969a5?.waveformLocalPath || '',
        needsAutoResize: false,
        fixedSize: true,
      }),
        appStore.setSelectedNodes([_0x2d1d2c]),
        commit(),
        window.v2FocusOnNodes?.([this.anchorNodeId, _0x2d1d2c]),
        window._triggerLocalCacheSave?.(),
        window.showToast?.(audioClipText('toasts.success'), 'success'),
        this.exit({ silent: true }));
    } catch (_0x1d0c90) {
      const _0x440f5f =
        _0x1d0c90 instanceof Error
          ? _0x1d0c90.message
          : String(_0x1d0c90 || audioClipText('errors.cutFailed'));
      (window.showToast?.(audioClipText('toasts.failed', { error: _0x440f5f }), 'error'),
        (_0x1b9afb.dataset.loading = 'false'),
        this._render(),
        (_0x1b9afb.dataset.loading = 'false'));
    }
    _0x1b9afb.dataset.loading = 'false';
  },
  exit({ silent: silent = false } = {}) {
    if (!this.active) return;
    ((this.active = false), this._sourceToken++);
    if (this._playheadRaf) cancelAnimationFrame(this._playheadRaf);
    this._playheadRaf = 0;
    if (this._retryRaf) cancelAnimationFrame(this._retryRaf);
    this._retryRaf = 0;
    const _0x30e303 = this._getAudioEl();
    if (_0x30e303) {
      this._setClipMediaKeepAlive(_0x30e303, false);
      if (this._onLoadedMeta) _0x30e303.removeEventListener('loadedmetadata', this._onLoadedMeta);
      if (this._onDurationChange) _0x30e303.removeEventListener('durationchange', this._onDurationChange);
    }
    this._onKeyDown &&
      (window.removeEventListener('keydown', this._onKeyDown, true), (this._onKeyDown = null));
    if (this._onPointerMove) window.removeEventListener('pointermove', this._onPointerMove, true);
    if (this._onPointerUp) window.removeEventListener('pointerup', this._onPointerUp, true);
    ((this._onPointerMove = null), (this._onPointerUp = null));
    this._onDocClick &&
      (document.removeEventListener('pointerdown', this._onDocClick, true), (this._onDocClick = null));
    this._msgInterval && (window.clearInterval(this._msgInterval), (this._msgInterval = 0));
    ((this._msgEls = null),
      (this._onLoadedMeta = null),
      (this._onDurationChange = null),
      (this._dragMode = null),
      (this._dragOffsetPx = 0));
    if (this.barEl && this.barEl.isConnected) this.barEl.remove();
    ((this.barEl = null),
      (this.trackEl = null),
      (this.selectionEl = null),
      (this.leftHandleEl = null),
      (this.rightHandleEl = null),
      (this.playheadEl = null),
      (this.labelEl = null),
      (this.cancelBtnEl = null),
      (this.confirmBtnEl = null),
      this._applyFrozenUI(false),
      this._applyDimMode(false),
      (this.wrapperEl = null),
      (this.audioEl = null),
      (this.nodeId = null),
      (this.anchorNodeId = null),
      (this.durationSec = 0),
      (this.startSec = 0),
      (this.endSec = 0),
      this._unsubscribeLocale?.(),
      (this._unsubscribeLocale = null));
    if (!silent) window.showToast?.(audioClipText('toasts.cancelled'), 'info');
  },
};
export default AudioClipController;
