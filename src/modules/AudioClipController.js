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
// 拖动选区后 pointerup 是否要把播放头挪到选区：只有在「移动选区」且本次没真正拖动时才跳。
export function shouldAudioClipSelectionPointerUpSeek(mode = '', moved = false) {
  return String(mode || '') === 'move' && moved !== true;
}
/**
 * 把候选切分点收敛到合法区间内。
 * 左段与右段都必须不短于 minLenSec，否则视为不可切，返回 null。
 */
export function normalizeAudioClipSplitSec({
  splitSec: splitSec,
  startSec: startSec,
  endSec: endSec,
  durationSec: durationSec,
  minLenSec: minLenSec = 0.1,
} = {}) {
  const totalSec = Number(durationSec),
    selectionStart = Math.max(0, Number(startSec) || 0),
    selectionEnd = Math.max(selectionStart, Number(endSec) || selectionStart),
    candidateSec = Number(splitSec),
    minLen = Math.max(0.001, Number(minLenSec) || 0.1);
  if (!Number.isFinite(totalSec) || totalSec <= 0) return null;
  if (!Number.isFinite(candidateSec)) return null;
  const clampedSec = Math.max(0, Math.min(totalSec, candidateSec));
  if (clampedSec - selectionStart < minLen) return null;
  if (selectionEnd - clampedSec < minLen) return null;
  return clampedSec;
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
  splitLeftSelectionEl: null,
  splitRightSelectionEl: null,
  leftHandleEl: null,
  rightHandleEl: null,
  playheadEl: null,
  splitMarkerEl: null,
  labelEl: null,
  cancelBtnEl: null,
  confirmBtnEl: null,
  splitBtnEl: null,
  undoSplitBtnEl: null,
  audioEl: null,
  durationSec: 0,
  startSec: 0,
  endSec: 0,
  // 切分状态：_splitSec 是切点，_splitRanges 是切点两侧的 [left, right] 段。
  _splitSec: null,
  _splitRanges: null,
  _activeSplitRangeId: '',
  _dragRangeId: '',
  // 外部来源模式（initForSource）的参数集合；null 表示走画布节点模式。
  _sourceOptions: null,
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
  /**
   * 对「已有但不在画布上」的音频来源开一段剪辑条（例如在别的节点里就地裁剪/切分）。
   * 与 init 的区别：不依赖画布节点 id，允许传入现成 audioEl，并支持 allowSplit / onConfirm。
   */
  initForSource(options = {}) {
    const wrapperEl = options.wrapperEl,
      sourceUrl =
        localPathToUrl(options.sourceLocalPath) || String(options.sourceUrl || '').trim();
    if (!wrapperEl || !sourceUrl) {
      window.showToast?.(audioClipText('toasts.uploadFirst'), 'warn');
      return;
    }
    if (this.active) this.exit({ silent: true });
    ((this.active = true),
      (this.audioEl = options.audioEl || null),
      (this.nodeId = String(options.anchorId || options.nodeId || 'audio-source-clip')),
      (this.anchorNodeId = this.nodeId),
      (this.wrapperEl = wrapperEl),
      (this.durationSec = 0),
      (this.startSec = Math.max(0, Number(options.initialStartSec) || 0)),
      (this.endSec = Math.max(this.startSec, Number(options.initialEndSec) || this.startSec)),
      (this._splitSec = null),
      (this._splitRanges = null),
      (this._activeSplitRangeId = ''),
      (this._dragRangeId = ''),
      (this._retryCount = 0),
      (this._sourceOptions = {
        ...options,
        sourceUrl: sourceUrl,
        allowSplit: options.allowSplit === true,
        dimMode: options.dimMode === true,
      }),
      this._applyFrozenUI(true),
      this._applyDimMode(this._sourceOptions.dimMode),
      this._createUI(),
      this._bindEvents(),
      this._syncDurationAndDefaults(),
      this._render());
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
    // 切分后的两段各自一个覆盖层，data-split-range-id 供拖拽命中识别。
    const splitLeftEl = document.createElement('div');
    ((splitLeftEl.className = 'v2-video-clipselection v2-video-clipsplit-selection left'),
      (splitLeftEl.dataset.splitRangeId = 'left'),
      (splitLeftEl.hidden = true));
    const splitRightEl = document.createElement('div');
    ((splitRightEl.className = 'v2-video-clipselection v2-video-clipsplit-selection right'),
      (splitRightEl.dataset.splitRangeId = 'right'),
      (splitRightEl.hidden = true));
    const handle = document.createElement('div');
    handle.className = 'v2-video-clipplayhead';
    const splitMarkerEl = document.createElement('div');
    ((splitMarkerEl.className = 'v2-video-clipsplit-marker'), (splitMarkerEl.hidden = true));
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
      el14.appendChild(splitLeftEl),
      el14.appendChild(splitRightEl),
      el14.appendChild(splitMarkerEl),
      el14.appendChild(handle),
      el14.appendChild(record),
      el14.appendChild(el22),
      el13.appendChild(el6),
      el13.appendChild(el14),
      el13.appendChild(el10));
    // 只有允许切分的来源才挂「裁剪 / 撤回裁剪」两个按钮。
    let splitBtnEl = null,
      undoSplitBtnEl = null;
    if (this._sourceOptions?.allowSplit === true) {
      splitBtnEl = document.createElement('button');
      ((splitBtnEl.type = 'button'),
        (splitBtnEl.className = 'v2-video-clipbtn split'),
        (splitBtnEl.title = audioClipText('controls.split')));
      {
        const ns = 'http://www.w3.org/2000/svg',
          svg = document.createElementNS(ns, 'svg');
        (svg.setAttribute('width', '20'),
          svg.setAttribute('height', '20'),
          svg.setAttribute('viewBox', '0 0 24 24'),
          svg.setAttribute('fill', 'none'),
          svg.setAttribute('stroke', 'currentColor'),
          svg.setAttribute('stroke-width', '2'),
          svg.setAttribute('stroke-linecap', 'round'),
          svg.setAttribute('stroke-linejoin', 'round'));
        const topCircle = document.createElementNS(ns, 'circle');
        (topCircle.setAttribute('cx', '6'),
          topCircle.setAttribute('cy', '6'),
          topCircle.setAttribute('r', '2'));
        const bottomCircle = document.createElementNS(ns, 'circle');
        (bottomCircle.setAttribute('cx', '6'),
          bottomCircle.setAttribute('cy', '18'),
          bottomCircle.setAttribute('r', '2'));
        const upperPath = document.createElementNS(ns, 'path');
        upperPath.setAttribute('d', 'M20 4 8.12 15.88');
        const lowerPath = document.createElementNS(ns, 'path');
        lowerPath.setAttribute('d', 'M14.47 14.48 20 20');
        const shortPath = document.createElementNS(ns, 'path');
        (shortPath.setAttribute('d', 'M8.12 8.12 12 12'),
          svg.append(topCircle, bottomCircle, upperPath, lowerPath, shortPath),
          splitBtnEl.appendChild(svg));
      }
      undoSplitBtnEl = document.createElement('button');
      ((undoSplitBtnEl.type = 'button'),
        (undoSplitBtnEl.className = 'v2-video-clipbtn undo'),
        (undoSplitBtnEl.title = audioClipText('controls.undoSplit')));
      {
        const ns = 'http://www.w3.org/2000/svg',
          svg = document.createElementNS(ns, 'svg');
        (svg.setAttribute('width', '20'),
          svg.setAttribute('height', '20'),
          svg.setAttribute('viewBox', '0 0 24 24'),
          svg.setAttribute('fill', 'none'),
          svg.setAttribute('stroke', 'currentColor'),
          svg.setAttribute('stroke-width', '2'),
          svg.setAttribute('stroke-linecap', 'round'),
          svg.setAttribute('stroke-linejoin', 'round'));
        const undoPath = document.createElementNS(ns, 'path');
        (undoPath.setAttribute('d', 'M3 7v6h6'), svg.appendChild(undoPath));
        const undoArc = document.createElementNS(ns, 'path');
        (undoArc.setAttribute('d', 'M3 13a9 9 0 1 0 3-7.7L3 8'),
          svg.appendChild(undoArc),
          undoSplitBtnEl.appendChild(svg));
      }
      (el13.appendChild(splitBtnEl), el13.appendChild(undoSplitBtnEl));
    }
    el5.appendChild(el13);
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
      (this.splitBtnEl = splitBtnEl),
      (this.undoSplitBtnEl = undoSplitBtnEl),
      (this.trackEl = el14),
      (this.selectionEl = payload),
      (this.splitLeftSelectionEl = splitLeftEl),
      (this.splitRightSelectionEl = splitRightEl),
      (this.leftHandleEl = el20),
      (this.rightHandleEl = el21),
      (this.playheadEl = handle),
      (this.splitMarkerEl = splitMarkerEl),
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
    if (this.splitBtnEl) this.splitBtnEl.title = audioClipText('controls.split');
    if (this.undoSplitBtnEl) this.undoSplitBtnEl.title = audioClipText('controls.undoSplit');
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
  // 优先用外部传入的 sourceOptions（对已有节点的某段音频做操作），否则回落到画布节点。
  _resolveActiveAudioSrc() {
    if (this._sourceOptions)
      return (
        localPathToUrl(this._sourceOptions.sourceLocalPath) ||
        String(this._sourceOptions.sourceUrl || '').trim()
      );
    return this._resolveAudioSrcFromNode(appStore.getState().nodes[this.nodeId]);
  },
  _getAudioEl({ create: create = true } = {}) {
    if (!this.wrapperEl) return null;
    // 外部来源模式没有现成 audio 元素，需要现场建一个隐藏播放器。
    if (this._sourceOptions) {
      if (this.audioEl && this.audioEl.isConnected) return this.audioEl;
      if (!create) return this.audioEl || null;
      const hiddenAudio = document.createElement('audio');
      return (
        (hiddenAudio.className = 'audio-player v2-audio-clip-hidden-player'),
        (hiddenAudio.preload = 'auto'),
        (hiddenAudio.hidden = true),
        (this.barEl || this.wrapperEl).appendChild(hiddenAudio),
        (this.audioEl = hiddenAudio),
        hiddenAudio
      );
    }
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
    const enabled7 = this._resolveActiveAudioSrc();
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
    // 切分后各段各有自己的播放区间，播放头越界要拉回当前段的起点。
    const playbackRange = this._getPlaybackRange();
    (value20 < playbackRange.startSec || value20 > playbackRange.endSec) &&
      !enabled10.paused &&
      ((enabled10.currentTime = playbackRange.startSec), (value20 = playbackRange.startSec));
    const value21 = Math.max(0, Math.min(1, value20 / count4));
    ((this.playheadEl.style.display = 'block'), (this.playheadEl.style.left = value21 * 100 + '%'));
  },
  _getMinSelectionSec() {
    const totalSec = this.durationSec;
    if (!Number.isFinite(totalSec) || totalSec <= 0) return 0.1;
    return Math.min(0.1, totalSec);
  },
  _normalizeSplitRange(range = {}, fallbackId = '') {
    const totalSec = this.durationSec;
    if (!Number.isFinite(totalSec) || totalSec <= 0) return null;
    const minLenSec = this._getMinSelectionSec(),
      id = String(range?.id || fallbackId || '').trim(),
      rawStartSec = Number(range?.startSec),
      rawEndSec = Number(range?.endSec),
      startCandidate = Number.isFinite(rawStartSec) ? rawStartSec : 0,
      endCandidate = Number.isFinite(rawEndSec) ? rawEndSec : startCandidate,
      startSec = Math.max(0, Math.min(totalSec, startCandidate)),
      endSec = Math.max(startSec, Math.min(totalSec, endCandidate));
    if (endSec - startSec < minLenSec) return null;
    return { id: id || fallbackId, startSec: startSec, endSec: endSec };
  },
  _getSplitRanges() {
    if (!Array.isArray(this._splitRanges) || this._splitRanges.length < 2) return null;
    const leftCandidate =
        this._splitRanges.find((range) => range?.id === 'left') || this._splitRanges[0],
      rightCandidate =
        this._splitRanges.find((range) => range?.id === 'right') || this._splitRanges[1],
      leftRange = this._normalizeSplitRange(leftCandidate, 'left'),
      rightRange = this._normalizeSplitRange(rightCandidate, 'right');
    if (!leftRange || !rightRange) return null;
    // 两段不允许重叠：左段终点必须在右段起点之前（可以相邻）。
    if (leftRange.endSec > rightRange.startSec) return null;
    return [
      { ...leftRange, id: 'left' },
      { ...rightRange, id: 'right' },
    ];
  },
  _hasSplitRanges() {
    return this._getSplitRanges() !== null;
  },
  // 切分后选区包络要覆盖两段的总跨度，否则拖动/渲染都会算错区间。
  _syncSelectionEnvelopeFromSplitRanges() {
    const splitRanges = this._getSplitRanges();
    if (!splitRanges) return null;
    return (
      (this.startSec = Math.min(...splitRanges.map((range) => range.startSec))),
      (this.endSec = Math.max(...splitRanges.map((range) => range.endSec))),
      splitRanges
    );
  },
  _getSplitRangeById(rangeId) {
    const normalizedId = String(rangeId || '').trim(),
      splitRanges = this._getSplitRanges();
    if (!splitRanges) return null;
    return splitRanges.find((range) => range.id === normalizedId) || null;
  },
  _getActiveSplitRange() {
    const splitRanges = this._getSplitRanges();
    if (!splitRanges) return null;
    const activeRange =
      splitRanges.find((range) => range.id === this._activeSplitRangeId) || splitRanges[0];
    return ((this._activeSplitRangeId = activeRange.id), activeRange);
  },
  _setActiveSplitRange(rangeId) {
    const splitRange = this._getSplitRangeById(rangeId);
    if (!splitRange) return null;
    return ((this._activeSplitRangeId = splitRange.id), splitRange);
  },
  _getPlaybackRange() {
    const activeSplitRange = this._getActiveSplitRange();
    if (activeSplitRange) return activeSplitRange;
    return { id: 'selection', startSec: this.startSec, endSec: this.endSec };
  },
  // 相邻段就是硬边界：左段的 start 不能越过前一段终点，右段的 end 不能越过下一段起点。
  _getSplitRangeBounds(rangeId) {
    const splitRanges = this._getSplitRanges();
    if (!splitRanges) return null;
    const rangeIndex = splitRanges.findIndex((range) => range.id === rangeId);
    if (rangeIndex < 0) return null;
    const totalSec = this.durationSec;
    return {
      minStart: rangeIndex > 0 ? splitRanges[rangeIndex - 1].endSec : 0,
      maxEnd: rangeIndex < splitRanges.length - 1 ? splitRanges[rangeIndex + 1].startSec : totalSec,
    };
  },
  _replaceSplitRange(rangeId, patch = {}) {
    const splitRanges = this._getSplitRanges();
    if (!splitRanges) return null;
    const nextRanges = splitRanges.map((range) =>
      range.id === rangeId ? { ...range, ...patch, id: range.id } : range,
    );
    return (
      (this._splitRanges = nextRanges),
      this._syncSelectionEnvelopeFromSplitRanges(),
      this._getSplitRangeById(rangeId)
    );
  },
  _getSplitRangeElement(rangeId) {
    if (rangeId === 'left') return this.splitLeftSelectionEl || null;
    if (rangeId === 'right') return this.splitRightSelectionEl || null;
    return null;
  },
  _getSplitRangeElementFromTarget(target) {
    const rangeEl = target?.closest?.('[data-split-range-id]'),
      rangeId = String(rangeEl?.dataset?.splitRangeId || '').trim();
    if (!rangeId) return null;
    return this._getSplitRangeById(rangeId) ? rangeEl : null;
  },
  _clearSplitRangeHover() {
    [this.splitLeftSelectionEl, this.splitRightSelectionEl].forEach((rangeEl) => {
      if (!rangeEl) return;
      (rangeEl.classList?.remove?.('hover-active', 'hover-left', 'hover-right'),
        (rangeEl.style.cursor = ''));
    });
  },
  _setSplitRangeCurrentTime(splitRange) {
    const audioEl = this._getAudioEl();
    if (!audioEl || !splitRange) return;
    try {
      audioEl.currentTime = splitRange.startSec;
    } catch {}
  },
  // 整体平移一段：先按「段长不变」求出可移动区间，再夹住。
  _moveSplitRangeByDelta(rangeId, deltaSec) {
    const splitRange = this._getSplitRangeById(rangeId),
      bounds = this._getSplitRangeBounds(rangeId);
    if (!splitRange || !bounds) return null;
    const rangeLengthSec = Math.max(
        this._getMinSelectionSec(),
        splitRange.endSec - splitRange.startSec,
      ),
      minStart = bounds.minStart,
      maxStart = Math.max(minStart, bounds.maxEnd - rangeLengthSec),
      nextStartSec = Math.max(minStart, Math.min(maxStart, splitRange.startSec + deltaSec)),
      nextRange = this._replaceSplitRange(rangeId, {
        startSec: nextStartSec,
        endSec: nextStartSec + rangeLengthSec,
      });
    return (this._setSplitRangeCurrentTime(nextRange), nextRange);
  },
  // 拖某一侧边缘：对侧固定，本侧不越过「对侧 ∓ 最短长度」和相邻段边界。
  _resizeSplitRangeEdge(rangeId, edge, targetSec) {
    const splitRange = this._getSplitRangeById(rangeId),
      bounds = this._getSplitRangeBounds(rangeId);
    if (!splitRange || !bounds) return null;
    const minLenSec = this._getMinSelectionSec(),
      clampedSec = Math.max(0, Math.min(this.durationSec, Number(targetSec) || 0));
    let nextRange = null;
    if (edge === 'left') {
      const maxStartSec = Math.max(bounds.minStart, splitRange.endSec - minLenSec);
      return (
        (nextRange = this._replaceSplitRange(rangeId, {
          startSec: Math.max(bounds.minStart, Math.min(maxStartSec, clampedSec)),
        })),
        this._setSplitRangeCurrentTime(nextRange),
        nextRange
      );
    }
    if (edge === 'right') {
      const minEndSec = Math.min(bounds.maxEnd, splitRange.startSec + minLenSec);
      return (
        (nextRange = this._replaceSplitRange(rangeId, {
          endSec: Math.max(minEndSec, Math.min(bounds.maxEnd, clampedSec)),
        })),
        this._setSplitRangeCurrentTime(nextRange),
        nextRange
      );
    }
    return null;
  },
  _getValidSplitSec(selectionStartSec = this.startSec, selectionEndSec = this.endSec) {
    if (this._sourceOptions?.allowSplit !== true) return null;
    return normalizeAudioClipSplitSec({
      splitSec: this._splitSec,
      startSec: selectionStartSec,
      endSec: selectionEndSec,
      durationSec: this.durationSec,
      minLenSec: this._getMinSelectionSec(),
    });
  },
  // 「裁剪」按钮：在当前播放头位置把选区一分为二，默认落到右段。
  _stageSplitAtCurrentTime() {
    if (this._sourceOptions?.allowSplit !== true) return false;
    if (this._hasSplitRanges() || this._getValidSplitSec() !== null) return false;
    const audioEl = this._getAudioEl(),
      middleSec = (this.startSec + this.endSec) / 2,
      currentTimeSec = Number.isFinite(Number(audioEl?.currentTime))
        ? Number(audioEl.currentTime)
        : middleSec,
      splitSec = normalizeAudioClipSplitSec({
        splitSec: currentTimeSec,
        startSec: this.startSec,
        endSec: this.endSec,
        durationSec: this.durationSec,
        minLenSec: this._getMinSelectionSec(),
      });
    if (splitSec === null)
      return (window.showToast?.(audioClipText('toasts.splitAtMiddle'), 'warn'), false);
    return (
      (this._splitSec = splitSec),
      (this._splitRanges = [
        { id: 'left', startSec: this.startSec, endSec: splitSec },
        { id: 'right', startSec: splitSec, endSec: this.endSec },
      ]),
      (this._activeSplitRangeId = 'right'),
      this._render(),
      true
    );
  },
  _clearSplit() {
    if (this._splitSec === null && !this._hasSplitRanges()) return;
    ((this._splitSec = null),
      (this._splitRanges = null),
      (this._activeSplitRangeId = ''),
      (this._dragRangeId = ''),
      this._render());
  },
  _bindEvents() {
    if (!this.barEl) return;
    (this.cancelBtnEl?.addEventListener('click', (event4) => {
      (event4.stopPropagation(), this.exit());
    }),
      this.confirmBtnEl?.addEventListener('click', (event5) => {
        (event5.stopPropagation(), this._confirm());
      }),
      this.splitBtnEl?.addEventListener('click', (event6a) => {
        (event6a.stopPropagation(), this._stageSplitAtCurrentTime());
      }),
      this.undoSplitBtnEl?.addEventListener('click', (event6b) => {
        (event6b.stopPropagation(), this._clearSplit());
      }));
    const value22 = (event6) => {
      if (!this.trackEl || !this.active || this._dragMode) return;
      const hasSplit = this._hasSplitRanges(),
        splitRangeEl = hasSplit ? this._getSplitRangeElementFromTarget(event6.target) : null,
        value23 = event6.clientX,
        box = (splitRangeEl || this.selectionEl).getBoundingClientRect(),
        value24 = 20,
        value25 = Math.abs(value23 - box.left) < value24,
        value26 = Math.abs(value23 - box.right) < value24;
      if (splitRangeEl) {
        // 悬停在某个分段上：清掉别的段的 hover，再按左右边给出拉伸光标。
        (this._clearSplitRangeHover(),
          this.leftHandleEl.classList.remove('hover-active'),
          this.rightHandleEl.classList.remove('hover-active'),
          splitRangeEl.classList.add('hover-active'));
        if (value25)
          (splitRangeEl.classList.add('hover-left'), (splitRangeEl.style.cursor = 'var(--resize-ew-cursor)'));
        else if (value26)
          (splitRangeEl.classList.add('hover-right'),
            (splitRangeEl.style.cursor = 'var(--resize-ew-cursor)'));
        else splitRangeEl.style.cursor = 'var(--grab-cursor)';
        return;
      }
      this._clearSplitRangeHover();
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
        // 已切分时 I / O 改的是当前段的边界，而不是整段选区。
        const activeSplitRange = this._getActiveSplitRange();
        if (activeSplitRange) {
          (this._resizeSplitRangeEdge(
            activeSplitRange.id,
            value57 === 'in' ? 'left' : 'right',
            value58,
          ),
            this._render());
          return;
        }
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
          hasSplit = this._hasSplitRanges(),
          splitRangeEl = hasSplit ? this._getSplitRangeElementFromTarget(event7.target) : null,
          onSelection = !hasSplit && !!event7.target.closest('.v2-video-clipselection'),
          box3 = this.trackEl.getBoundingClientRect();
        if (!box3.width) return;
        const value64 = event7.clientX,
          box4 = splitRangeEl ? splitRangeEl.getBoundingClientRect() : this.selectionEl.getBoundingClientRect(),
          value65 = 20,
          value66 = Math.abs(value64 - box4.left) < value65,
          value67 = Math.abs(value64 - box4.right) < value65;
        if (splitRangeEl) {
          // 命中某一段：先记下段 id，再按落点离哪条边更近决定拉伸还是平移。
          const rangeId = String(splitRangeEl.dataset.splitRangeId || '').trim();
          ((this._dragRangeId = rangeId),
            this._setActiveSplitRange(rangeId),
            this._clearSplitRangeHover(),
            splitRangeEl.classList.add('hover-active'));
          if (value66) ((this._dragMode = 'left'), splitRangeEl.classList.add('hover-left'));
          else if (value67)
            ((this._dragMode = 'right'), splitRangeEl.classList.add('hover-right'));
          else this._dragMode = 'move';
        } else if (!hasSplit && (value66 || (el31 && el31.dataset.handle === 'left')))
          ((this._dragMode = 'left'), this.leftHandleEl.classList.add('hover-active'));
        else if (!hasSplit && (value67 || (el31 && el31.dataset.handle === 'right')))
          ((this._dragMode = 'right'), this.rightHandleEl.classList.add('hover-active'));
        else if (!hasSplit && onSelection) this._dragMode = 'move';
        else {
          this._dragMode = 'scrub';
          const enabled17 = this._getAudioEl();
          if (enabled17)
            try {
              if (!enabled17.paused) enabled17.pause();
            } catch (value68) {}
        }
        if (this._dragMode === 'move') {
          const dragEl = splitRangeEl || this.selectionEl,
            box5 = dragEl.getBoundingClientRect();
          this._dragOffsetPx = event7.clientX - box5.left;
        } else this._dragOffsetPx = 0;
        (event7.preventDefault(), event7.stopPropagation());
        const pointerStartX = Number(event7.clientX || 0);
        let hasMoved = false;
        if (this._dragMode === 'scrub') handler4(event7.clientX);
        else this._handleDragAtClientX(event7.clientX);
        if (this._onPointerMove) window.removeEventListener('pointermove', this._onPointerMove, true);
        if (this._onPointerUp) window.removeEventListener('pointerup', this._onPointerUp, true);
        ((this._onPointerMove = (event8) => {
          if (!this.active || !this.trackEl) return;
          (event8.preventDefault(), event8.stopPropagation());
          if (this._dragMode === 'scrub') {
            handler4(event8.clientX);
            return;
          }
          // 抖动容忍：位移不超过 2px 不算真正拖动。
          if (this._dragMode === 'move') {
            if (!hasMoved && Math.abs(event8.clientX - pointerStartX) <= 2) return;
            hasMoved = true;
          }
          this._handleDragAtClientX(event8.clientX);
        }),
          (this._onPointerUp = (event9) => {
            if (!this.active) return;
            (event9.preventDefault(), event9.stopPropagation());
            const dragMode = this._dragMode,
              shouldSeek = shouldAudioClipSelectionPointerUpSeek(dragMode, hasMoved),
              releaseClientX = Number.isFinite(Number(event9.clientX))
                ? Number(event9.clientX)
                : pointerStartX;
            ((this._dragMode = null),
              (this._dragRangeId = ''),
              (this._dragOffsetPx = 0),
              this.leftHandleEl?.classList.remove('hover-active'),
              this.rightHandleEl?.classList.remove('hover-active'),
              this._clearSplitRangeHover());
            if (this._onPointerMove) window.removeEventListener('pointermove', this._onPointerMove, true);
            if (this._onPointerUp) window.removeEventListener('pointerup', this._onPointerUp, true);
            ((this._onPointerMove = null), (this._onPointerUp = null));
            if (shouldSeek) handler4(releaseClientX);
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
      dragRangeId = String(this._dragRangeId || '').trim();
    // 拖的是某一分段：边缘拉伸或整体平移，都按该段的相邻边界夹住。
    if (dragRangeId && this._hasSplitRanges()) {
      this._setActiveSplitRange(dragRangeId);
      if (this._dragMode === 'left' || this._dragMode === 'right')
        this._resizeSplitRangeEdge(dragRangeId, this._dragMode, value89);
      else if (this._dragMode === 'move') {
        const dragRange = this._getSplitRangeById(dragRangeId);
        if (dragRange) {
          const pointerSec = ((value86 - box7.left - this._dragOffsetPx) / box7.width) * enabled21;
          this._moveSplitRangeByDelta(dragRangeId, pointerSec - dragRange.startSec);
        }
      }
      this._render();
      return;
    }
    const value91 = Math.max(value90, this.endSec - this.startSec);
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
      value103 = Number.isFinite(count16) && count16 > 0;
    let splitRanges = value103 ? this._getSplitRanges() : null;
    // 分段数据失效（越界/重叠/短于最短长度）就地作废，避免渲染出坏区间。
    Array.isArray(this._splitRanges) &&
      this._splitRanges.length &&
      !splitRanges &&
      ((this._splitRanges = null),
      (this._activeSplitRangeId = ''),
      (this._dragRangeId = ''));
    splitRanges &&
      (this._syncSelectionEnvelopeFromSplitRanges(), (splitRanges = this._getSplitRanges()));
    const value104 = value103 ? Math.max(0, Math.min(this.startSec, count16)) : 0,
      value105 = value103 ? Math.max(0, Math.min(this.endSec, count16)) : 0,
      count17 = Math.max(0, value105 - value104);
    if (value103) {
      const value106 = (value104 / count16) * 100,
        value107 = (count17 / count16) * 100;
      ((this.selectionEl.style.left = value106 + '%'),
        (this.selectionEl.style.width = value107 + '%'),
        (this.leftHandleEl.style.left = value106 + '%'),
        (this.rightHandleEl.style.left = value106 + value107 + '%'));
      if (this.labelEl) {
        // 已切分时标签只显示当前段时长，否则显示整段选区时长。
        const activeRange = splitRanges ? this._getActiveSplitRange() || splitRanges[0] : null,
          labelStartSec = activeRange ? activeRange.startSec : value104,
          labelEndSec = activeRange ? activeRange.endSec : value105,
          labelLeftPct = (labelStartSec / count16) * 100,
          labelWidthPct = ((labelEndSec - labelStartSec) / count16) * 100;
        ((this.labelEl.textContent = Math.max(0, labelEndSec - labelStartSec).toFixed(2) + 's'),
          (this.labelEl.style.left = labelLeftPct + labelWidthPct / 2 + '%'));
      }
    } else
      ((this.selectionEl.style.left = '0%'),
        (this.selectionEl.style.width = '0%'),
        (this.leftHandleEl.style.left = '0%'),
        (this.rightHandleEl.style.left = '0%'),
        this.labelEl &&
          ((this.labelEl.textContent = audioClipText('status.loading')), (this.labelEl.style.left = '50%')));
    // 还没落到 _splitRanges 时，若播放头落在合法切点上就先画个预告标记。
    const previewSplitSec = value103 && !splitRanges ? this._getValidSplitSec(value104, value105) : null;
    if (this._splitSec !== null && !splitRanges && previewSplitSec === null) this._splitSec = null;
    const renderedRanges =
      splitRanges ||
      (previewSplitSec !== null
        ? [
            { id: 'left', startSec: value104, endSec: previewSplitSec },
            { id: 'right', startSec: previewSplitSec, endSec: value105 },
          ]
        : null);
    if (this.selectionEl) {
      if (renderedRanges) this.selectionEl.classList.add('has-split');
      else this.selectionEl.classList.remove('has-split');
    }
    if (this.splitLeftSelectionEl && this.splitRightSelectionEl) {
      if (renderedRanges && value103) {
        const leftRange = renderedRanges[0],
          rightRange = renderedRanges[1],
          activeRangeId = splitRanges ? this._getActiveSplitRange()?.id : '';
        ((this.splitLeftSelectionEl.hidden = false), (this.splitRightSelectionEl.hidden = false));
        this.splitLeftSelectionEl.dataset &&
          (this.splitLeftSelectionEl.dataset.splitRangeId = 'left');
        this.splitRightSelectionEl.dataset &&
          (this.splitRightSelectionEl.dataset.splitRangeId = 'right');
        ((this.splitLeftSelectionEl.style.left = (leftRange.startSec / count16) * 100 + '%'),
          (this.splitLeftSelectionEl.style.width =
            Math.max(0, ((leftRange.endSec - leftRange.startSec) / count16) * 100) + '%'),
          (this.splitRightSelectionEl.style.left = (rightRange.startSec / count16) * 100 + '%'),
          (this.splitRightSelectionEl.style.width =
            Math.max(0, ((rightRange.endSec - rightRange.startSec) / count16) * 100) + '%'));
        if (activeRangeId === 'left')
          (this.splitLeftSelectionEl.classList.add('is-active'),
            this.splitRightSelectionEl.classList.remove('is-active'));
        else if (activeRangeId === 'right')
          (this.splitRightSelectionEl.classList.add('is-active'),
            this.splitLeftSelectionEl.classList.remove('is-active'));
        else
          (this.splitLeftSelectionEl.classList.remove('is-active'),
            this.splitRightSelectionEl.classList.remove('is-active'));
      } else
        ((this.splitLeftSelectionEl.hidden = true),
          (this.splitRightSelectionEl.hidden = true),
          (this.splitLeftSelectionEl.style.left = '0%'),
          (this.splitLeftSelectionEl.style.width = '0%'),
          (this.splitRightSelectionEl.style.left = '0%'),
          (this.splitRightSelectionEl.style.width = '0%'),
          this.splitLeftSelectionEl.classList.remove('is-active'),
          this.splitRightSelectionEl.classList.remove('is-active'));
    }
    // 预告切点的虚线标记：只在「有候选切点、还没真正切」时显示。
    this.splitMarkerEl &&
      (!splitRanges && previewSplitSec !== null && value103
        ? ((this.splitMarkerEl.hidden = false),
          (this.splitMarkerEl.style.left = (previewSplitSec / count16) * 100 + '%'))
        : ((this.splitMarkerEl.hidden = true), (this.splitMarkerEl.style.left = '0%')));
    if (this.splitBtnEl) {
      const splitDisabled = !value103 || renderedRanges !== null;
      ((this.splitBtnEl.disabled = splitDisabled),
        (this.splitBtnEl.dataset.disabled = splitDisabled ? 'true' : 'false'));
    }
    if (this.undoSplitBtnEl) {
      const undoDisabled = renderedRanges === null;
      ((this.undoSplitBtnEl.disabled = undoDisabled),
        (this.undoSplitBtnEl.dataset.disabled = undoDisabled ? 'true' : 'false'));
    }
    this._renderPlayhead();
    if (this.confirmBtnEl) {
      const enabled22 = splitRanges
        ? splitRanges.every(
            (range) => range.endSec - range.startSec >= this._getMinSelectionSec(),
          )
        : value103 && count17 >= 0.1;
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
    // 两种来源：外部传入的 sourceOptions（对已有节点做区间操作）或画布上的音频节点。
    const sourceOptions = this._sourceOptions;
    let name = null;
    if (!sourceOptions) {
      name = appStore.getState().nodes[this.anchorNodeId];
      if (!name) {
        this.exit({ silent: true });
        return;
      }
    }
    const enabled23 = this.durationSec;
    if (!enabled23 || !Number.isFinite(enabled23) || enabled23 <= 0) return;
    // 切分后选区包络按两段总跨度取，裁剪范围才不会算小。
    const splitRanges = this._syncSelectionEnvelopeFromSplitRanges(),
      start = Math.max(0, Math.min(this.startSec, enabled23)),
      end = Math.max(0, Math.min(this.endSec, enabled23));
    if (!(end > start)) return;
    const src = sourceOptions
      ? this._resolveActiveAudioSrc()
      : localPathToUrl(name.localPath) || name.src || name.audioUrl || name.resultUrl || '';
    if (!src) return;
    ((el32.dataset.disabled = 'true'),
      (el32.dataset.loading = 'true'),
      (el32.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><g style="animation:spin 1s linear infinite;transform-origin:50% 50%;transform-box:fill-box;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></g></svg>'),
      window.showToast?.(audioClipText('toasts.cutting'), 'info'));
    try {
      // 外部接管：把选中范围与切分结果交回调用方，由它决定落成几个节点。
      if (sourceOptions) {
        if (typeof sourceOptions.onConfirm === 'function') {
          const exportedRanges = splitRanges
            ? splitRanges.map((range) => ({
                id: range.id,
                startSec: range.startSec,
                endSec: range.endSec,
              }))
            : null;
          await sourceOptions.onConfirm({
            startSec: start,
            endSec: end,
            splitSec: this._getValidSplitSec(start, end),
            ranges: exportedRanges,
            sourceUrl: src,
            sourceLocalPath: String(sourceOptions.sourceLocalPath || ''),
          });
        }
        this.exit({ silent: true });
        return;
      }
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
      (this.splitBtnEl = null),
      (this.undoSplitBtnEl = null),
      (this.splitLeftSelectionEl = null),
      (this.splitRightSelectionEl = null),
      (this.splitMarkerEl = null),
      (this._splitSec = null),
      (this._splitRanges = null),
      (this._activeSplitRangeId = ''),
      (this._dragRangeId = ''),
      (this._sourceOptions = null),
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
