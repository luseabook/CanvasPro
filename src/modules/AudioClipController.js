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
export function normalizeAudioCutResultLocalPath(value) {
  return pickResultLocalPath(value);
}
function audioClipText(item, key = {}) {
  return t('audioClip.' + item, key);
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
  init(enabled) {
    if (!enabled) return;
    if (this.active) this.exit({ silent: true });
    this.audioEl = null;
    const enabled2 = appStore.getState().nodes[enabled];
    if (!enabled2) return;
    const enabled3 = this._resolveAudioSrcFromNode(enabled2);
    if (!enabled3) {
      window.showToast?.(audioClipText('toasts.uploadFirst'), 'warn');
      return;
    }
    ((this.active = true),
      (this.nodeId = enabled),
      (this.anchorNodeId = enabled),
      (this._retryCount = 0),
      this._mountWhenReady());
  },
  _applyDimMode(index) {
    const el = document.getElementById('v2-wrap');
    if (el) {
      if (index) el.classList.add('is-audio-clip-mode');
      else el.classList.remove('is-audio-clip-mode');
    }
    if (this.wrapperEl) {
      if (index) this.wrapperEl.classList.add('is-audio-clip-target');
      else this.wrapperEl.classList.remove('is-audio-clip-target');
    }
  },
  _applyFrozenUI(result) {
    if (!this.wrapperEl) return;
    const data = 'is-audio-clipping';
    if (result) this.wrapperEl.classList.add(data);
    else this.wrapperEl.classList.remove(data);
    this._applyFrozenOverlaysHidden(result);
  },
  _applyFrozenOverlaysHidden(options) {
    if (!this.wrapperEl) return;
    if (options) {
      if (Array.isArray(this._hiddenEls) && this._hiddenEls.length) return;
      const list = ['.audio-controls', '.node-upload-hint'],
        list2 = [];
      (list.forEach((item2) => {
        this.wrapperEl.querySelectorAll(item2).forEach((el2) => {
          (list2.push({ el: el2, prevDisplay: el2.style.display }), (el2.style.display = 'none'));
        });
      }),
        (this._hiddenEls = list2));
      return;
    }
    const list3 = Array.isArray(this._hiddenEls) ? this._hiddenEls : [];
    ((this._hiddenEls = null),
      list3.forEach(({ el: el3, prevDisplay: prevDisplay }) => {
        if (!el3 || !el3.isConnected) return;
        el3.style.display = prevDisplay || '';
      }));
  },
  _mountWhenReady() {
    const target = this.nodeId,
      source = () => {
        if (!this.active || this.nodeId !== target) return;
        const enabled4 = document.getElementById(target);
        if (!enabled4) {
          this._retryCount++;
          if (this._retryCount > 10) {
            this.exit({ silent: true });
            return;
          }
          this._retryRaf = requestAnimationFrame(source);
          return;
        }
        ((this.wrapperEl = enabled4),
          window.v2FocusOnNodes?.([target]),
          this._applyFrozenUI(true),
          this._applyDimMode(true),
          this._createUI(),
          this._bindEvents(),
          this._syncDurationAndDefaults(),
          this._render());
      };
    this._retryRaf = requestAnimationFrame(source);
  },
  _createUI() {
    if (!this.wrapperEl) return;
    this.wrapperEl.querySelectorAll('.v2-video-clipbar').forEach((el4) => el4.remove());
    const el5 = document.createElement('div');
    ((el5.className = 'v2-video-clipbar'),
      el5.addEventListener('pointerdown', (event) => event.stopPropagation()),
      el5.addEventListener('click', (event2) => event2.stopPropagation()),
      el5.addEventListener('dblclick', (event3) => {
        (event3.preventDefault(), event3.stopPropagation());
      }));
    const el6 = document.createElement('button');
    ((el6.type = 'button'),
      (el6.className = 'v2-video-clipbtn cancel'),
      (el6.title = audioClipText('controls.cancel')));
    {
      const next = 'http://www.w3.org/2000/svg',
        el7 = document.createElementNS(next, 'svg');
      (el7.setAttribute('width', '20'),
        el7.setAttribute('height', '20'),
        el7.setAttribute('viewBox', '0 0 24 24'),
        el7.setAttribute('fill', 'none'),
        el7.setAttribute('stroke', 'currentColor'),
        el7.setAttribute('stroke-width', '2'));
      const el8 = document.createElementNS(next, 'path');
      el8.setAttribute('d', 'M18 6L6 18');
      const el9 = document.createElementNS(next, 'path');
      (el9.setAttribute('d', 'M6 6l12 12'), el7.appendChild(el8), el7.appendChild(el9), el6.appendChild(el7));
    }
    const el10 = document.createElement('button');
    ((el10.type = 'button'),
      (el10.className = 'v2-video-clipbtn confirm'),
      (el10.title = audioClipText('controls.done')));
    {
      const current = 'http://www.w3.org/2000/svg',
        el11 = document.createElementNS(current, 'svg');
      (el11.setAttribute('width', '24'),
        el11.setAttribute('height', '24'),
        el11.setAttribute('viewBox', '0 0 24 24'),
        el11.setAttribute('fill', 'none'),
        el11.setAttribute('stroke', 'currentColor'),
        el11.setAttribute('stroke-width', '2.5'));
      const el12 = document.createElementNS(current, 'polyline');
      (el12.setAttribute('points', '20 6 9 17 4 12'), el11.appendChild(el12), el10.appendChild(el11));
    }
    const el13 = document.createElement('div');
    el13.className = 'v2-video-cliprow';
    const el14 = document.createElement('div');
    el14.className = 'v2-video-cliptrack';
    const el15 = document.createElement('div');
    el15.className = 'v2-audio-clipwave';
    {
      const entry = 'http://www.w3.org/2000/svg',
        el16 = document.createElementNS(entry, 'svg');
      (el16.setAttribute('viewBox', '0 0 200 44'), el16.setAttribute('preserveAspectRatio', 'none'));
      const el17 = document.createElementNS(entry, 'path');
      (el17.setAttribute('fill', 'none'),
        el17.setAttribute('d', ''),
        el17.classList.add('v2-audio-clipwave-path'));
      const el18 = document.createElementNS(entry, 'path');
      (el18.setAttribute('fill', 'none'),
        el18.setAttribute('d', 'M0,22 L200,22'),
        el18.classList.add('v2-audio-clipwave-mid'),
        el16.appendChild(el17),
        el16.appendChild(el18),
        el15.appendChild(el16),
        (this._wavePathEl = el17));
    }
    const record = document.createElement('div');
    record.className = 'v2-video-clipticks';
    const el19 = document.createElement('div');
    el19.className = 'v2-video-cliprange';
    const payload = document.createElement('div');
    payload.className = 'v2-video-clipselection';
    const handle = document.createElement('div');
    handle.className = 'v2-video-clipplayhead';
    const el20 = document.createElement('div');
    ((el20.className = 'v2-video-cliphandle left'), (el20.dataset.handle = 'left'));
    const el21 = document.createElement('div');
    ((el21.className = 'v2-video-cliphandle right'), (el21.dataset.handle = 'right'));
    const el22 = document.createElement('div');
    ((el22.className = 'v2-video-cliplabel'),
      (el22.textContent = '0.00s'),
      el19.appendChild(payload),
      el19.appendChild(el20),
      el19.appendChild(el21),
      el14.appendChild(el15),
      el14.appendChild(el19),
      el14.appendChild(handle),
      el14.appendChild(record),
      el14.appendChild(el22),
      el13.appendChild(el6),
      el13.appendChild(el14),
      el13.appendChild(el10),
      el5.appendChild(el13));
    const el23 = document.createElement('div');
    el23.className = 'v2-video-cliphelper-row';
    const el24 = document.createElement('div');
    el24.className = 'v2-video-cliphelper-left';
    const list4 = this._buildHelperMessages();
    this._msgEls = list4.map((item3, count) => {
      const el25 = document.createElement('div');
      el25.className = 'v2-video-cliphelper-msg';
      if (count !== 0) el25.classList.add('hide-down');
      return ((el25.innerHTML = item3.html), el24.appendChild(el25), el25);
    });
    if (this._msgInterval) window.clearInterval(this._msgInterval);
    let state = 0;
    this._msgInterval = window.setInterval(() => {
      if (!this.active || !this._msgEls) return;
      const el26 = this._msgEls[state];
      state = (state + 1) % this._msgEls.length;
      const el27 = this._msgEls[state];
      (el26.classList.remove('hide-down'),
        el26.classList.add('hide-up'),
        el27.classList.remove('hide-up'),
        el27.classList.remove('hide-down'),
        window.setTimeout(() => {
          el26 &&
            el26.classList.contains('hide-up') &&
            (el26.classList.remove('hide-up'), el26.classList.add('hide-down'));
        }, 300));
    }, 4000);
    const config = document.createElement('div');
    ((config.className = 'v2-video-clip-smartwrap'),
      el23.appendChild(el24),
      el23.appendChild(config),
      el5.appendChild(el23),
      this.wrapperEl.appendChild(el5),
      (this.barEl = el5),
      (this.cancelBtnEl = el6),
      (this.confirmBtnEl = el10),
      (this.trackEl = el14),
      (this.selectionEl = payload),
      (this.leftHandleEl = el20),
      (this.rightHandleEl = el21),
      (this.playheadEl = handle),
      (this.labelEl = el22),
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
      const scope = this._buildHelperMessages();
      this._msgEls.forEach((el28, input) => {
        if (scope[input]) el28.innerHTML = scope[input].html;
      });
    }
  },
  _resolveAudioSrcFromNode(enabled5) {
    if (!enabled5) return '';
    const url = localPathToUrl(enabled5.localPath);
    return url || enabled5.src || enabled5.audioUrl || enabled5.resultUrl || '';
  },
  _getAudioEl() {
    if (!this.wrapperEl) return null;
    if (this.audioEl && this.audioEl.isConnected && this.wrapperEl.contains?.(this.audioEl))
      return this.audioEl;
    const output = this.wrapperEl.querySelector('audio.audio-player');
    return ((this.audioEl = output || null), output);
  },
  _getAudioElementSource(value2) {
    return String(value2?.getAttribute?.('src') || value2?.currentSrc || value2?.src || '').trim();
  },
  _setClipMediaKeepAlive(el29, value3) {
    if (!el29?.dataset) return;
    if (value3) {
      el29.dataset.desktopMediaKeepAlive = 'audio-clip';
      return;
    }
    el29.dataset.desktopMediaKeepAlive === 'audio-clip' && delete el29.dataset.desktopMediaKeepAlive;
  },
  _readDurationSec(value4) {
    const count2 = Number(value4?.duration);
    if (!Number.isFinite(count2) || count2 <= 0) return 0;
    return count2;
  },
  _applyDurationSec(value5) {
    const count3 = Number(value5);
    if (!Number.isFinite(count3) || count3 <= 0) return false;
    this.durationSec = count3;
    if (!(this.endSec > this.startSec)) {
      const value6 = Math.min(3, count3),
        value7 = Math.max(0, (count3 - value6) / 2);
      return ((this.startSec = value7), (this.endSec = value7 + value6), true);
    }
    ((this.startSec = Math.max(0, Math.min(this.startSec, count3))),
      (this.endSec = Math.max(0, Math.min(this.endSec, count3))));
    if (this.endSec <= this.startSec) {
      const value8 = Math.min(3, count3);
      ((this.startSec = 0), (this.endSec = value8));
    }
    return true;
  },
  async _syncDurationAndDefaults() {
    const enabled6 = appStore.getState().nodes[this.nodeId];
    if (!enabled6) return;
    const enabled7 = this._resolveAudioSrcFromNode(enabled6);
    if (!enabled7) {
      this.exit({ silent: true });
      return;
    }
    const el30 = this._getAudioEl();
    if (!el30) {
      (window.showToast?.(audioClipText('toasts.playerMissing'), 'error'), this.exit({ silent: true }));
      return;
    }
    const value9 = ++this._sourceToken;
    this._setClipMediaKeepAlive(el30, true);
    try {
      el30.pause();
    } catch (value10) {}
    try {
      el30.loop = false;
    } catch (value11) {}
    !this._onLoadedMeta &&
      ((this._onLoadedMeta = () => {
        if (!this.active) return;
        const value12 = this._readDurationSec(el30);
        (this._applyDurationSec(value12, el30), this._render());
      }),
      (this._onDurationChange = () => {
        if (!this.active) return;
        const value13 = this._readDurationSec(el30);
        (this._applyDurationSec(value13, el30), this._render());
      }),
      el30.addEventListener('loadedmetadata', this._onLoadedMeta, { once: true }),
      el30.addEventListener('durationchange', this._onDurationChange));
    (this._ensureWaveform(enabled7), await attachDesktopMediaPlaybackSource(el30, enabled7));
    if (!this.active || value9 !== this._sourceToken) return;
    if (!this._getAudioElementSource(el30)) {
      ((el30.preload = 'auto'), (el30.src = enabled7));
      try {
        el30.load();
      } catch (value14) {}
    }
    const value15 = this._readDurationSec(el30);
    if (this._applyDurationSec(value15, el30)) {
      (this._render(), this._startPlayheadLoop());
      return;
    }
    this._startPlayheadLoop();
  },
  async _ensureWaveform(value16) {
    const enabled8 = String(value16 || '').trim();
    if (!enabled8) return;
    if (!this._wavePathEl) return;
    const value17 = ++this._waveToken,
      [enabled9, value18] = await Promise.all([
        getWaveformBarsPathFromUrl(enabled8, { width: 200, height: 44, samples: 200 }),
        getAudioDurationFromUrl(enabled8),
      ]);
    if (!this.active) return;
    if (value17 !== this._waveToken) return;
    this._applyDurationSec(value18) && (this._render(), this._startPlayheadLoop());
    if (!this._wavePathEl || !enabled9) return;
    this._wavePathEl.setAttribute('d', enabled9);
  },
  _startPlayheadLoop() {
    if (this._playheadRaf) cancelAnimationFrame(this._playheadRaf);
    const value19 = () => {
      if (!this.active) return;
      (this._renderPlayhead(), (this._playheadRaf = requestAnimationFrame(value19)));
    };
    this._playheadRaf = requestAnimationFrame(value19);
  },
  _renderPlayhead() {
    if (!this.playheadEl || !this.trackEl) return;
    const count4 = this.durationSec;
    if (!Number.isFinite(count4) || count4 <= 0) {
      this.playheadEl.style.display = 'none';
      return;
    }
    const enabled10 = this._getAudioEl();
    if (!enabled10) {
      this.playheadEl.style.display = 'none';
      return;
    }
    let value20 = Number(enabled10.currentTime) || 0;
    (value20 < this.startSec || value20 > this.endSec) &&
      !enabled10.paused &&
      ((enabled10.currentTime = this.startSec), (value20 = this.startSec));
    const value21 = Math.max(0, Math.min(1, value20 / count4));
    ((this.playheadEl.style.display = 'block'), (this.playheadEl.style.left = value21 * 100 + '%'));
  },
  _bindEvents() {
    if (!this.barEl) return;
    (this.cancelBtnEl?.addEventListener('click', (event4) => {
      (event4.stopPropagation(), this.exit());
    }),
      this.confirmBtnEl?.addEventListener('click', (event5) => {
        (event5.stopPropagation(), this._confirm());
      }));
    const value22 = (event6) => {
      if (!this.trackEl || !this.active || this._dragMode) return;
      const value23 = event6.clientX,
        box = this.selectionEl.getBoundingClientRect(),
        value24 = 20,
        value25 = Math.abs(value23 - box.left) < value24,
        value26 = Math.abs(value23 - box.right) < value24;
      if (value25)
        (this.leftHandleEl.classList.add('hover-active'),
          this.rightHandleEl.classList.remove('hover-active'),
          (this.selectionEl.style.cursor = 'var(--resize-ew-cursor)'));
      else
        value26
          ? (this.rightHandleEl.classList.add('hover-active'),
            this.leftHandleEl.classList.remove('hover-active'),
            (this.selectionEl.style.cursor = 'var(--resize-ew-cursor)'))
          : (this.leftHandleEl.classList.remove('hover-active'),
            this.rightHandleEl.classList.remove('hover-active'),
            (this.selectionEl.style.cursor = 'var(--grab-cursor)'));
    };
    this.trackEl?.addEventListener('pointermove', value22);
    const value27 = 30,
      handler = (value28) => (Number(value28 || 1) / value27) * 1,
      handler2 = () => {
        const count5 = this.durationSec;
        if (!Number.isFinite(count5) || count5 <= 0) return 0.1;
        return Math.min(0.1, count5);
      },
      handler3 = (value29, value30, value31) => Math.max(value30, Math.min(value31, value29)),
      handler4 = (value32) => {
        if (!this.trackEl || !this.active) return;
        const count6 = this.durationSec;
        if (!Number.isFinite(count6) || count6 <= 0) return;
        const enabled11 = this._getAudioEl();
        if (!enabled11) return;
        const box2 = this.trackEl.getBoundingClientRect();
        if (!box2.width) return;
        const value33 = value32 - box2.left,
          value34 = handler3(value33 / box2.width, 0, 1),
          value35 = value34 * count6,
          value36 = Math.max(0, count6 - 0.001);
        try {
          enabled11.currentTime = handler3(value35, 0, value36);
        } catch (value37) {}
        this._renderPlayhead();
      },
      handler5 = () => {
        const enabled12 = this._getAudioEl();
        if (!enabled12) return;
        if (!enabled12.paused) return;
        const value38 = Number(enabled12.currentTime) || 0;
        if (value38 >= this.startSec && value38 <= this.endSec) return;
        try {
          enabled12.currentTime = this.startSec;
        } catch (value39) {}
      },
      handler6 = (count7, value40) => {
        const count8 = this.durationSec;
        if (!Number.isFinite(count8) || count8 <= 0) return;
        const value41 = handler(value40) * (count7 >= 0 ? 1 : -1),
          value42 = handler2(),
          value43 = Math.max(value42, this.endSec - this.startSec);
        let count9 = this.startSec + value41,
          value44 = this.endSec + value41;
        count9 < 0 && ((count9 = 0), (value44 = value43));
        value44 > count8 && ((value44 = count8), (count9 = Math.max(0, count8 - value43)));
        ((this.startSec = count9), (this.endSec = value44));
        const enabled13 = this._getAudioEl();
        if (enabled13) {
          try {
            if (!enabled13.paused) enabled13.pause();
          } catch (value45) {}
          try {
            enabled13.currentTime = count9;
          } catch (value46) {}
        } else handler5();
        this._render();
      },
      handler7 = (count10) => {
        const count11 = this.durationSec;
        if (!Number.isFinite(count11) || count11 <= 0) return;
        const value47 = handler(1) * (count10 >= 0 ? 1 : -1),
          value48 = handler2(),
          value49 = Math.max(0, this.endSec - value48);
        this.startSec = handler3(this.startSec + value47, 0, value49);
        const enabled14 = this._getAudioEl();
        if (enabled14) {
          try {
            if (!enabled14.paused) enabled14.pause();
          } catch (value50) {}
          try {
            enabled14.currentTime = this.startSec;
          } catch (value51) {}
        }
        this._render();
      },
      handler8 = (count12) => {
        const count13 = this.durationSec;
        if (!Number.isFinite(count13) || count13 <= 0) return;
        const value52 = handler(1) * (count12 >= 0 ? 1 : -1),
          value53 = handler2(),
          value54 = Math.min(count13, this.startSec + value53);
        this.endSec = handler3(this.endSec + value52, value54, count13);
        const enabled15 = this._getAudioEl();
        if (enabled15) {
          try {
            if (!enabled15.paused) enabled15.pause();
          } catch (value55) {}
          try {
            enabled15.currentTime = this.endSec;
          } catch (value56) {}
        }
        this._render();
      },
      handler9 = (value57) => {
        const count14 = this.durationSec;
        if (!Number.isFinite(count14) || count14 <= 0) return;
        const enabled16 = this._getAudioEl();
        if (!enabled16) return;
        let value58 = Number(enabled16.currentTime) || 0;
        value58 = handler3(value58, 0, count14);
        const value59 = handler2();
        if (value57 === 'in') {
          const value60 = Math.max(0, this.endSec - value59);
          this.startSec = handler3(value58, 0, value60);
        } else {
          const value61 = Math.min(count14, this.startSec + value59);
          this.endSec = handler3(value58, value61, count14);
        }
        this._render();
      },
      value62 = (event7) => {
        if (!this.trackEl || !this.active) return;
        const el31 = event7.target.closest('.v2-video-cliphandle'),
          value63 = !!event7.target.closest('.v2-video-clipselection'),
          box3 = this.trackEl.getBoundingClientRect();
        if (!box3.width) return;
        const value64 = event7.clientX,
          box4 = this.selectionEl.getBoundingClientRect(),
          value65 = 20,
          value66 = Math.abs(value64 - box4.left) < value65,
          value67 = Math.abs(value64 - box4.right) < value65;
        if (value66 || (el31 && el31.dataset.handle === 'left'))
          ((this._dragMode = 'left'), this.leftHandleEl.classList.add('hover-active'));
        else {
          if (value67 || (el31 && el31.dataset.handle === 'right'))
            ((this._dragMode = 'right'), this.rightHandleEl.classList.add('hover-active'));
          else {
            if (value63) this._dragMode = 'move';
            else {
              this._dragMode = 'scrub';
              const enabled17 = this._getAudioEl();
              if (enabled17)
                try {
                  if (!enabled17.paused) enabled17.pause();
                } catch (value68) {}
            }
          }
        }
        if (this._dragMode === 'move') {
          const box5 = this.selectionEl.getBoundingClientRect();
          this._dragOffsetPx = event7.clientX - box5.left;
        } else this._dragOffsetPx = 0;
        (event7.preventDefault(), event7.stopPropagation());
        if (this._dragMode === 'scrub') handler4(event7.clientX);
        else this._handleDragAtClientX(event7.clientX);
        if (this._onPointerMove) window.removeEventListener('pointermove', this._onPointerMove, true);
        if (this._onPointerUp) window.removeEventListener('pointerup', this._onPointerUp, true);
        ((this._onPointerMove = (event8) => {
          if (!this.active || !this.trackEl) return;
          (event8.preventDefault(), event8.stopPropagation());
          if (this._dragMode === 'scrub') handler4(event8.clientX);
          else this._handleDragAtClientX(event8.clientX);
        }),
          (this._onPointerUp = (event9) => {
            if (!this.active) return;
            (event9.preventDefault(),
              event9.stopPropagation(),
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
    (this.trackEl?.addEventListener('pointerdown', value62),
      this.trackEl?.addEventListener(
        'wheel',
        (event10) => {
          if (!this.active) return;
          (event10.preventDefault(), event10.stopPropagation());
          const value69 = Number(event10.deltaX) || 0,
            value70 = Number(event10.deltaY) || 0,
            enabled18 = Math.abs(value69) > Math.abs(value70) ? value69 : value70;
          if (!enabled18) return;
          const value71 = enabled18 > 0 ? 1 : -1;
          if (event10.ctrlKey || event10.metaKey) handler7(value71);
          else {
            if (event10.altKey) handler8(value71);
            else {
              const value72 = event10.shiftKey ? 10 : 1;
              handler6(value71, value72);
            }
          }
        },
        { passive: false },
      ),
      this.selectionEl?.addEventListener('dblclick', (event11) => {
        if (!this.active) return;
        (event11.preventDefault(), event11.stopPropagation());
        const enabled19 = this.durationSec;
        if (!enabled19 || !Number.isFinite(enabled19) || enabled19 <= 0) return;
        const box6 = this.selectionEl.getBoundingClientRect(),
          value73 = event11.clientX,
          value74 = 24;
        if (value73 - box6.left < value74 || box6.right - value73 < value74) return;
        const value75 = Math.min(3, enabled19),
          value76 = (this.startSec + this.endSec) / 2,
          value77 = Math.max(0, Math.min(enabled19 - value75, value76 - value75 / 2));
        ((this.startSec = value77), (this.endSec = value77 + value75));
        const value78 = this._getAudioEl();
        if (value78 && value78.paused) value78.currentTime = this.startSec;
        this._render();
      }),
      this._onKeyDown &&
        (window.removeEventListener('keydown', this._onKeyDown, true), (this._onKeyDown = null)),
      (this._onKeyDown = (event12) => {
        if (!this.active) return;
        if (event12.key === 'Escape') {
          (event12.preventDefault(), this.exit());
          return;
        }
        if (event12.key === ' ' || event12.code === 'Space') {
          event12.preventDefault();
          const value79 = this._getAudioEl();
          value79 &&
            (value79.paused
              ? ((value79.currentTime < this.startSec || value79.currentTime >= this.endSec) &&
                  (value79.currentTime = this.startSec),
                value79.play())
              : value79.pause());
          return;
        }
        if (event12.key === 'i' || event12.key === 'I') {
          (event12.preventDefault(), handler9('in'));
          return;
        }
        if (event12.key === 'o' || event12.key === 'O') {
          (event12.preventDefault(), handler9('out'));
          return;
        }
        if (event12.key === 'ArrowLeft' || event12.key === 'ArrowRight') {
          event12.preventDefault();
          const value80 = event12.key === 'ArrowRight' ? 1 : -1;
          if (event12.ctrlKey || event12.metaKey) {
            handler7(value80);
            return;
          }
          if (event12.altKey) {
            handler8(value80);
            return;
          }
          const value81 = event12.shiftKey ? 10 : 1;
          handler6(value80, value81);
        }
      }),
      window.addEventListener('keydown', this._onKeyDown, true),
      this._onDocClick &&
        (document.removeEventListener('pointerdown', this._onDocClick, true), (this._onDocClick = null)),
      (this._onDocClick = (event13) => {
        if (!this.active || !this.barEl) return;
        if (this.barEl.contains(event13.target)) return;
        this.exit({ silent: true });
      }),
      document.addEventListener('pointerdown', this._onDocClick, true));
  },
  _togglePlayRange() {
    const enabled20 = this._getAudioEl(),
      count15 = this.durationSec;
    if (!enabled20 || !Number.isFinite(count15) || count15 <= 0) return;
    try {
      if (!enabled20.paused) {
        enabled20.pause();
        return;
      }
    } catch (value82) {}
    let value83 = Number(enabled20.currentTime) || 0;
    if (value83 < this.startSec || value83 >= this.endSec)
      try {
        enabled20.currentTime = this.startSec;
      } catch (value84) {}
    try {
      enabled20.play();
    } catch (value85) {}
  },
  _handleDragAtClientX(value86) {
    if (!this.trackEl || !this.active) return;
    const enabled21 = this.durationSec;
    if (!enabled21 || !Number.isFinite(enabled21) || enabled21 <= 0) {
      this._render();
      return;
    }
    const box7 = this.trackEl.getBoundingClientRect();
    if (!box7.width) return;
    const value87 = value86 - box7.left,
      value88 = Math.max(0, Math.min(1, value87 / box7.width)),
      value89 = value88 * enabled21,
      value90 = Math.min(0.1, enabled21),
      value91 = Math.max(value90, this.endSec - this.startSec);
    if (this._dragMode === 'left') {
      const value92 = Math.max(0, Math.min(value89, this.endSec - value90));
      this.startSec = value92;
      const value93 = this._getAudioEl();
      if (value93)
        try {
          value93.currentTime = value92;
        } catch (value94) {}
    } else {
      if (this._dragMode === 'right') {
        const value95 = Math.max(this.startSec + value90, Math.min(enabled21, value89));
        this.endSec = value95;
      } else {
        if (this._dragMode === 'move') {
          const value96 = this.selectionEl.getBoundingClientRect().left - box7.left,
            value97 = value86 - box7.left - this._dragOffsetPx,
            value98 = value97 - value96,
            value99 = (value98 / box7.width) * enabled21,
            value100 = Math.max(0, Math.min(enabled21 - value91, this.startSec + value99));
          ((this.startSec = value100), (this.endSec = value100 + value91));
          const value101 = this._getAudioEl();
          if (value101)
            try {
              value101.currentTime = value100;
            } catch (value102) {}
        }
      }
    }
    this._render();
  },
  _render() {
    if (!this.active || !this.trackEl || !this.selectionEl || !this.leftHandleEl || !this.rightHandleEl)
      return;
    const count16 = this.durationSec,
      value103 = Number.isFinite(count16) && count16 > 0,
      value104 = value103 ? Math.max(0, Math.min(this.startSec, count16)) : 0,
      value105 = value103 ? Math.max(0, Math.min(this.endSec, count16)) : 0,
      count17 = Math.max(0, value105 - value104);
    if (value103) {
      const value106 = (value104 / count16) * 100,
        value107 = (count17 / count16) * 100;
      ((this.selectionEl.style.left = value106 + '%'),
        (this.selectionEl.style.width = value107 + '%'),
        (this.leftHandleEl.style.left = value106 + '%'),
        (this.rightHandleEl.style.left = value106 + value107 + '%'),
        this.labelEl &&
          ((this.labelEl.textContent = count17.toFixed(2) + 's'),
          (this.labelEl.style.left = value106 + value107 / 2 + '%')));
    } else
      ((this.selectionEl.style.left = '0%'),
        (this.selectionEl.style.width = '0%'),
        (this.leftHandleEl.style.left = '0%'),
        (this.rightHandleEl.style.left = '0%'),
        this.labelEl &&
          ((this.labelEl.textContent = audioClipText('status.loading')), (this.labelEl.style.left = '50%')));
    this._renderPlayhead();
    if (this.confirmBtnEl) {
      const enabled22 = value103 && count17 >= 0.1;
      ((this.confirmBtnEl.disabled = !enabled22),
        (this.confirmBtnEl.dataset.disabled = enabled22 ? 'false' : 'true'),
        this.confirmBtnEl.dataset.loading !== 'true' &&
          (this.confirmBtnEl.innerHTML =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'));
    }
  },
  async _confirm() {
    if (!this.confirmBtnEl) return;
    const el32 = this.confirmBtnEl;
    if (el32.dataset.disabled === 'true') return;
    const value108 = appStore.getState().nodes,
      name = value108[this.anchorNodeId];
    if (!name) {
      this.exit({ silent: true });
      return;
    }
    const enabled23 = this.durationSec;
    if (!enabled23 || !Number.isFinite(enabled23) || enabled23 <= 0) return;
    const start = Math.max(0, Math.min(this.startSec, enabled23)),
      end = Math.max(0, Math.min(this.endSec, enabled23));
    if (!(end > start)) return;
    const src = localPathToUrl(name.localPath) || name.src || name.audioUrl || name.resultUrl || '';
    if (!src) return;
    ((el32.dataset.disabled = 'true'),
      (el32.dataset.loading = 'true'),
      (el32.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><g style="animation:spin 1s linear infinite;transform-origin:50% 50%;transform-box:fill-box;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></g></svg>'),
      window.showToast?.(audioClipText('toasts.cutting'), 'info'));
    try {
      let error = null;
      if (canUseElectronMediaTask())
        error = await enqueueElectronMediaTask(
          {
            kind: 'audioCut',
            nodeId: this.anchorNodeId,
            src: src,
            args: { start: start, end: end },
          },
          { wait: true, timeout: 300000 },
        );
      else {
        const response = await requester({
          url: '/api/v2/audio/cut',
          method: 'POST',
          provider: 'local',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ src: src, start: start, end: end }),
          allow404Null: true,
          returnMeta: true,
        });
        if (response?.status === 404 || response?.data == null)
          throw new Error(audioClipText('errors.cutApiMissing'));
        error = response.data || {};
      }
      const fileName = error?.result && typeof error.result === 'object' ? error.result : error,
        localPath = normalizeAudioCutResultLocalPath(error);
      if (!localPath || error?.success === false || fileName?.success === false)
        throw new Error(
          fileName?.error || error?.error || error?.message || audioClipText('errors.cutFailed'),
        );
      const width = name.width || 360,
        height = name.height || 150,
        x = calcSafeSpawnPosNearNode(appStore.getState().nodes, name, width, height),
        id = generateId('source-audio-cut');
      (appStore.addNode({
        id: id,
        type: 'source-audio',
        x: x.x,
        y: x.y,
        width: width,
        height: height,
        name: audioClipText('output.nodeName', {
          name: name.name || audioClipText('output.audioFallback'),
        }),
        src: '/' + localPath,
        localPath: localPath,
        audioDuration: Math.max(0, end - start),
        fileName: fileName?.filename || error?.filename || '',
        waveformLocalPath: fileName?.waveformLocalPath || error?.waveformLocalPath || '',
        needsAutoResize: false,
        fixedSize: true,
      }),
        appStore.setSelectedNodes([id]),
        commit(),
        window.v2FocusOnNodes?.([this.anchorNodeId, id]),
        window._triggerLocalCacheSave?.(),
        window.showToast?.(audioClipText('toasts.success'), 'success'),
        this.exit({ silent: true }));
    } catch (error2) {
      const error3 =
        error2 instanceof Error ? error2.message : String(error2 || audioClipText('errors.cutFailed'));
      (window.showToast?.(audioClipText('toasts.failed', { error: error3 }), 'error'),
        (el32.dataset.loading = 'false'),
        this._render(),
        (el32.dataset.loading = 'false'));
    }
    el32.dataset.loading = 'false';
  },
  exit({ silent: silent = false } = {}) {
    if (!this.active) return;
    ((this.active = false), this._sourceToken++);
    if (this._playheadRaf) cancelAnimationFrame(this._playheadRaf);
    this._playheadRaf = 0;
    if (this._retryRaf) cancelAnimationFrame(this._retryRaf);
    this._retryRaf = 0;
    const el33 = this._getAudioEl();
    if (el33) {
      this._setClipMediaKeepAlive(el33, false);
      if (this._onLoadedMeta) el33.removeEventListener('loadedmetadata', this._onLoadedMeta);
      if (this._onDurationChange) el33.removeEventListener('durationchange', this._onDurationChange);
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
