import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { uploadFile } from '../modules/project.js';
import {
  cancelAudioSeparationTaskForNode,
  getRunningAudioSeparationTaskForNode,
  maybeResumeAudioSeparationLeader,
  runAudioSeparationFromNode,
} from '../modules/AudioSeparationController.js';
import { registerStaticInnerHTML, setStaticInnerHTML } from '../utils/dom.js';
import { startLoading, stopLoading } from '../modules/loadingOverlay.js';
import AudioClipController from '../modules/AudioClipController.js';
import { SOURCE_AUDIO_TOOLBAR_HTML } from './NodeToolbarConfig.js';
import {
  deferWaveformPathUntilAudioReady,
  getWaveformBarsPathFromPersistedUrl,
  getWaveformBarsPathFromUrl,
} from '../utils/audioWaveform.js';
import { createAudioPlaybackProgressController } from '../utils/audioPlaybackProgress.js';
import {
  loadAudioDurationMetadataSec,
  normalizeAudioDurationSec,
  pickAudioDurationSec,
} from '../services/audioMetadataService.js';
import { beginAudioPlayback, registerAudioPlaybackClient } from '../modules/audioPlaybackCoordinator.js';
import { resolveCanvasAudioUrl } from '../services/canvasMediaLocalService.js';
import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
  getMediaElementCurrentSource,
  getMediaElementPlaybackSourceKey,
  isMediaElementPlaybackSource,
} from '../services/desktopMediaBlobSource.js';
import { shouldShowGenerationResultLoadingUi } from '../core/generationTaskUiState.js';
import { localPathToUrl, pickResultLocalPath, urlToLocalPath } from '../utils/localMediaPath.js';
import { bindRunningHubToolbarTaskButton } from './nodeToolbar/runningHubToolbarTaskButton.js';
import { bindAudioDownloadAction } from './nodeToolbar/audioActions/downloadAction.js';
const WAVE =
  'M10,40 L10,40 M15,30 L15,50 M20,20 L20,60 M25,35 L25,45 M30,25 L30,55 M35,15 L35,65 M40,30 L40,50 M45,38 L45,42 M50,22 L50,58 M55,18 L55,62 M60,28 L60,52 M65,32 L65,48 M70,24 L70,56 M75,36 L75,44 M80,20 L80,60 M85,16 L85,64 M90,26 L90,54 M95,34 L95,46 M100,22 L100,58 M105,18 L105,62 M110,30 L110,50 M115,38 L115,42 M120,15 L120,65 M125,25 L125,55 M130,35 L130,45 M135,20 L135,60 M140,30 L140,50 M145,40 L145,40 M150,25 L150,55 M155,15 L155,65 M160,30 L160,50 M165,38 L165,42 M170,22 L170,58 M175,18 L175,62 M180,28 L180,52 M185,32 L185,48 M190,24 L190,56';
function sourceAudioText(value, item = {}) {
  return t('sourceAudioNode.' + value, item);
}
const _SOURCE_AUDIO_NODE_TEMPLATE_ID = 'node:source-audio';
registerStaticInnerHTML(
  _SOURCE_AUDIO_NODE_TEMPLATE_ID,
  SOURCE_AUDIO_TOOLBAR_HTML +
    '\n        <div class="node-card media-card audio-card">\n        <div class="waveform waveform-bg">\n          <svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">\n            <path d="' +
    WAVE +
    '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n            <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n          </svg>\n        </div>\n        <div class="waveform waveform-unplayed">\n          <svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">\n            <path d="' +
    WAVE +
    '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n            <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n          </svg>\n        </div>\n        <div class="media-progress-line"></div>\n        <div class="media-progress-bar"></div>\n        \n        <div class="node-upload-hint audio-upload-hint source-upload-hint">\n          <button type="button" class="upload-btn audio-upload-btn source-upload-btn">\n            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>\n          </button>\n        </div>\n\n        <div class="audio-controls">\n           <button type="button" class="audio-play-btn">\n              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n           </button>\n           <div class="audio-time-wrap">\n             <span class="audio-time-display">0:00 / 0:00</span>\n           </div>\n        </div>\n        <audio class="audio-player"></audio>\n        <div class="node-port out-port"></div>\n        <div class="node-resizer"></div>\n      </div>',
);
export class SourceAudioNode {
  constructor(key) {
    ((this._data = key),
      (this.el = document.createElement('div')),
      (this.id = key.id),
      (this.el.className = 'v2-node-component'),
      (this._currentSrc = null),
      (this._objUrl = null),
      (this._waveKey = null),
      (this._waveformLocalPath = ''),
      (this._waveToken = 0),
      (this._cancelDeferredWaveform = null),
      (this._progressController = null),
      (this._audioDurationProbeToken = 0),
      (this._isUploading = false),
      (this._unsubscribeLocale = null));
  }
  ['_resolveAudioSrc'](index) {
    return resolveCanvasAudioUrl(index);
  }
  ['mount']() {
    this._subscribeLocaleChanges();
    const el = this.el;
    (setStaticInnerHTML(el, _SOURCE_AUDIO_NODE_TEMPLATE_ID),
      (this._card = el.querySelector('.media-card')),
      (this._audio = el.querySelector('.audio-player')),
      (this._audio.preload = 'none'),
      (this._playBtn = el.querySelector('.audio-play-btn')),
      (this._timeEl = el.querySelector('.audio-time-display')),
      (this._bar = el.querySelector('.media-progress-bar')),
      (this._wavePlayed = el.querySelector('.waveform-unplayed')),
      (this._progressLine = el.querySelector('.media-progress-line')),
      (this._hint = el.querySelector('.node-upload-hint')),
      (this._uploadBtn = el.querySelector('.upload-btn')),
      (this._clipBtn = el.querySelector('.act-clip, .clip-btn')),
      (this._separateBtn = el.querySelector('.act-separate, .separate-btn')),
      (this._speedBtn = el.querySelector('.act-speed, .speed-btn')),
      (this._downloadBtn = el.querySelector('.act-download, .download-btn')),
      this._syncLocaleTexts());
    {
      const list = el.querySelectorAll('.waveform-bg svg path');
      this._waveBgPath = list && list.length ? list[0] : null;
      const list2 = el.querySelectorAll('.waveform-unplayed svg path');
      this._waveFgPath = list2 && list2.length ? list2[0] : null;
    }
    this._progressController = createAudioPlaybackProgressController({
      audioEl: this._audio,
      wavePlayedEl: this._wavePlayed,
      progressLineEl: this._progressLine,
      timeEl: this._timeEl,
      trackEl: this._bar,
      formatTime: (result) => this._fmt(result),
      shouldSuppressSync: () => this._isSeeking || this._bar?.dataset.dragging === 'true',
    }).attach();
    const el2 = el.querySelector('.node-floating-toolbar');
    if (el2) el2.addEventListener('pointerdown', (event) => event.stopPropagation());
    ((this._input = document.createElement('input')),
      (this._input.type = 'file'),
      (this._input.accept = 'audio/*'),
      (this._input.style.display = 'none'),
      el.appendChild(this._input),
      this._uploadBtn.addEventListener('pointerdown', (event2) => {
        (event2.stopPropagation(), this._input.click());
      }),
      this._card.addEventListener('dblclick', (event3) => {
        event3.stopPropagation();
      }));
    let box = { x: 0, y: 0 };
    (this._card.addEventListener('pointerdown', (x) => {
      if (x.target.closest('.media-progress-bar')) return;
      box = { x: x.clientX, y: x.clientY };
    }),
      this._card.addEventListener('pointerup', (event4) => {
        if (
          event4.target.closest('.media-progress-bar') ||
          event4.target.closest('.audio-play-btn') ||
          event4.target.closest('.upload-btn') ||
          event4.target.closest('.node-floating-toolbar')
        )
          return;
        const count = Math.hypot(event4.clientX - box.x, event4.clientY - box.y);
        if (count < 5) {
          const box2 = this._card.getBoundingClientRect(),
            data = Math.max(0, Math.min(1, (event4.clientX - box2.left) / box2.width)),
            duration = this._readAudioDurationSec();
          if (this._audio && duration > 0) {
            const currentTime2 = data * duration;
            ((this._audio.currentTime = currentTime2),
              this._progressController?.sync({
                currentTime: currentTime2,
                duration: duration,
                force: true,
                showLine: true,
              }));
          }
        }
      }),
      this._bar?.addEventListener('click', (event5) => {
        this._seekTo(event5.clientX);
      }),
      this._input.addEventListener('change', async (event6) => {
        const error = event6.target.files[0];
        if (!error) return;
        (startLoading(this._card, { variant: 'static' }), this._progressController?.reset());
        const list3 = Array.from(this._uploadBtn.childNodes).map((item2) => item2.cloneNode(true));
        ((this._isUploading = true),
          (this._uploadBtn.textContent = sourceAudioText('upload.uploading')),
          (this._uploadBtn.style.pointerEvents = 'none'));
        try {
          const options = window.currentProjectId || 'default_v2_project',
            assetId = await uploadFile(error, options),
            target = error.name.replace(/\.[^/.]+$/, '');
          appStore.renameNode(this.id, target);
          const source = document.getElementById(this.id),
            el3 = source?.__v2_name_el;
          if (el3) el3.textContent = target;
          const src = assetId.url,
            localPath = pickResultLocalPath(assetId) || urlToLocalPath(src);
          appStore.updateNodeData(this.id, {
            src: src,
            localPath: localPath,
            audioDuration: Number(assetId.audioDuration || assetId.duration || 0) || 0,
            assetId: assetId.assetId || '',
            originalLocalPath: assetId.originalLocalPath || assetId.localPath || '',
            waveformLocalPath: assetId.waveformLocalPath || '',
            derivativeStatus: assetId.derivativeStatus || assetId.status || '',
            mediaTaskId: assetId.mediaTaskId || '',
            mediaTaskKind: assetId.mediaTaskKind || '',
            mediaTaskStatus: assetId.mediaTaskStatus || '',
            mediaTaskProgress: Number(assetId.mediaTaskProgress || 0) || 0,
            mediaTaskError: assetId.mediaTaskError || '',
            fileName: assetId.filename || error.name,
          });
        } catch (next) {
          (console.error('音频上传失败:', next),
            window.showToast(sourceAudioText('upload.failedRetry')),
            stopLoading(this._card),
            this._currentSrc && this._progressController?.sync({ force: true, showLine: true }));
        } finally {
          (this._uploadBtn.replaceChildren(...list3.map((item3) => item3.cloneNode(true))),
            (this._uploadBtn.style.pointerEvents = 'auto'),
            (this._isUploading = false),
            this._syncLocaleTexts(),
            (this._input.value = ''));
        }
      }),
      this._playBtn.addEventListener('pointerdown', (event7) => {
        (event7.stopPropagation(),
          this._audio.paused && this._currentSrc ? this._playAudio() : this._audio.pause());
      }));
    const list4 = [1, 1.25, 1.5, 2];
    let current = 0;
    (this._speedBtn?.addEventListener('pointerdown', (event8) => {
      (event8.stopPropagation(), (current = (current + 1) % list4.length));
      const entry = list4[current];
      ((this._audio.playbackRate = entry), (this._speedBtn.textContent = entry.toFixed(1) + 'x'));
    }),
      this._clipBtn?.addEventListener('pointerdown', (event9) => {
        (event9.stopPropagation(), AudioClipController.init(this.id));
      }),
      bindRunningHubToolbarTaskButton({
        button: this._separateBtn,
        getTask: () => getRunningAudioSeparationTaskForNode(this.id),
        cancelTask: () => cancelAudioSeparationTaskForNode(this.id, { notify: true }),
        cancelTooltip: sourceAudioText('toolbar.cancelAudioSeparation'),
        eventTypes: ['pointerdown', 'click'],
      }),
      this._separateBtn?.addEventListener('pointerdown', (event10) => {
        if (getRunningAudioSeparationTaskForNode(this.id)) {
          (event10.preventDefault(),
            event10.stopPropagation(),
            void cancelAudioSeparationTaskForNode(this.id, { notify: true }));
          return;
        }
        (event10.stopPropagation(), void runAudioSeparationFromNode(this.id));
      }),
      bindAudioDownloadAction({
        button: this._downloadBtn,
        getNodeData: () => appStore.getState().nodes?.[this.id] || this._data || {},
        getAudioElement: () => this._audio,
        notifyMissing: () => window.showToast?.(sourceAudioText('download.missingAudio'), 'warn'),
      }),
      this._audio.addEventListener('play', () => this._setIcon(false)),
      this._audio.addEventListener('pause', () => this._setIcon(true)),
      this._unregisterAudioPlaybackClient?.(),
      (this._unregisterAudioPlaybackClient = registerAudioPlaybackClient(this.id, {
        stopForExternalPlayback: () => this._stopAudioForExternalPlayback(),
      })));
    const record = this._resolveAudioSrc(this._data);
    if (record) {
      this._prepareAudio(record);
      if (this._hint) this._hint.style.display = 'block';
    } else {
      this._progressController?.reset();
      if (this._hint) this._hint.style.display = 'block';
    }
    return (this._syncGeneratingUi(this._data, record), maybeResumeAudioSeparationLeader(this.id), el);
  }
  ['_syncGeneratingUi'](payload, enabled) {
    const shouldShowGenerationResultLoadingUi2 = shouldShowGenerationResultLoadingUi(payload, {
      hasResult: !!enabled,
    });
    if (this._uploadBtn) this._uploadBtn.disabled = shouldShowGenerationResultLoadingUi2;
    if (shouldShowGenerationResultLoadingUi2) {
      startLoading(this._card, { variant: 'full' });
      if (this._hint) this._hint.style.display = 'none';
      return;
    }
    (stopLoading(this._card), this._clearResolvedAudioTimer(payload, enabled));
    if (!enabled && this._hint) this._hint.style.display = 'block';
  }
  ['_clearResolvedAudioTimer'](enabled2, enabled3) {
    if (!enabled3 || !enabled2 || typeof enabled2 !== 'object') return;
    if (!enabled2.generationStartTime && enabled2.generationDuration == null) return;
    const enabled4 = appStore.getState().nodes?.[this.id];
    if (!enabled4) return;
    const handle = {};
    if (enabled4.generationStartTime) handle.generationStartTime = null;
    if (enabled4.generationDuration != null) handle.generationDuration = null;
    if (enabled4.isGenerating === true) handle.isGenerating = false;
    Object.keys(handle).length > 0 && appStore.updateNodeData(this.id, handle);
  }
  ['_seekTo'](state) {
    const duration2 = this._readAudioDurationSec();
    if (!this._audio || duration2 <= 0) return;
    const box3 = this._bar.getBoundingClientRect();
    if (box3.width === 0) return;
    let config = (state - box3.left) / box3.width;
    config = Math.max(0, Math.min(1, config));
    const currentTime3 = config * duration2;
    if (!isFinite(currentTime3)) return;
    ((this._isSeeking = true),
      (this._audio.currentTime = currentTime3),
      this._progressController?.sync({
        currentTime: currentTime3,
        duration: duration2,
        force: true,
        showLine: true,
      }),
      this._audio.addEventListener(
        'seeked',
        () => {
          ((this._isSeeking = false), this._progressController?.sync({ force: true, showLine: true }));
        },
        { once: true },
      ));
  }
  ['_getAudioElementSource']() {
    return getMediaElementPlaybackSourceKey(this._audio);
  }
  ['_getAudioElementCurrentSource']() {
    return getMediaElementCurrentSource(this._audio);
  }
  ['_isAudioElementReady']() {
    if (!this._audio || !this._getAudioElementCurrentSource()) return false;
    const count2 = Number(this._audio.readyState || 0);
    return count2 >= 2;
  }
  ['_readAudioDurationSec']() {
    const audioDurationSec = normalizeAudioDurationSec(this._audio?.duration),
      enabled5 = appStore.getState().nodes?.[this.id],
      audioDurationSec2 = pickAudioDurationSec(
        enabled5?.audioDuration,
        !enabled5 ? this._data?.audioDuration : 0,
      );
    if (audioDurationSec2 > 0) {
      if (!(audioDurationSec > 0)) return audioDurationSec2;
      const scope = Math.max(1, audioDurationSec2 * 0.25);
      if (Math.abs(audioDurationSec2 - audioDurationSec) > scope) return audioDurationSec2;
    }
    return audioDurationSec;
  }
  ['_syncKnownAudioDurationUi']({ currentTime: currentTime = 0, showLine: showLine = false } = {}) {
    const duration3 = this._readAudioDurationSec();
    if (!(duration3 > 0)) return false;
    const input = Number(currentTime),
      currentTime4 = Number.isFinite(input) ? Math.max(0, Math.min(input, duration3)) : 0,
      enabled6 = this._progressController?.sync({
        currentTime: currentTime4,
        duration: duration3,
        force: true,
        showLine: showLine,
      });
    if (!showLine) this._progressController?.hideLine?.();
    return (
      !enabled6 &&
        this._timeEl &&
        (this._timeEl.textContent = this._fmt(currentTime4) + ' / ' + this._fmt(duration3)),
      true
    );
  }
  ['_applyResolvedAudioDuration'](output, value2 = this._currentSrc) {
    if (value2 && this._currentSrc !== value2) return false;
    const audioDuration = normalizeAudioDurationSec(output);
    if (!(audioDuration > 0)) return false;
    const value3 = appStore.getState().nodes?.[this.id],
      audioDurationSec3 = pickAudioDurationSec(value3?.audioDuration, this._data?.audioDuration);
    if (audioDurationSec3 > 0) {
      if (Math.abs(audioDurationSec3 - audioDuration) <= 0.001)
        return this._syncKnownAudioDurationUi({
          currentTime: this._audio?.currentTime || 0,
          showLine: Number(this._audio?.currentTime || 0) > 0,
        });
      const value4 = Math.max(1, audioDurationSec3 * 0.25);
      if (Math.abs(audioDurationSec3 - audioDuration) > value4) return false;
    }
    return (
      value3
        ? (appStore.updateNodeData(this.id, { audioDuration: audioDuration }),
          (this._data = { ...(this._data || {}), audioDuration: audioDuration }),
          this._syncKnownAudioDurationUi({
            currentTime: this._audio?.currentTime || 0,
            showLine: Number(this._audio?.currentTime || 0) > 0,
          }))
        : ((this._data = { ...(this._data || {}), audioDuration: audioDuration }),
          this._syncKnownAudioDurationUi({
            currentTime: this._audio?.currentTime || 0,
            showLine: Number(this._audio?.currentTime || 0) > 0,
          })),
      true
    );
  }
  ['_probeAudioDurationIfNeeded'](value5) {
    const enabled7 = String(value5 || '').trim();
    if (!enabled7 || this._readAudioDurationSec() > 0) return;
    const value6 = (this._audioDurationProbeToken || 0) + 1;
    ((this._audioDurationProbeToken = value6),
      void loadAudioDurationMetadataSec(enabled7).then((value7) => {
        if (this._audioDurationProbeToken !== value6 || this._currentSrc !== enabled7) return;
        this._applyResolvedAudioDuration(value7, enabled7);
      }));
  }
  ['_rewindEndedAudioIfNeeded']() {
    if (!this._audio) return;
    const duration4 = this._readAudioDurationSec();
    if (!(duration4 > 0)) return;
    const value8 = Number(this._audio.currentTime || 0),
      enabled8 = Number.isFinite(value8) && value8 >= duration4 - 0.05;
    if (this._audio.ended !== true && !enabled8) return;
    try {
      this._audio.currentTime = 0;
    } catch {}
    this._progressController?.sync({ currentTime: 0, duration: duration4, force: true, showLine: true });
  }
  ['_clearAudioElementSource']() {
    if (!this._audio) return;
    try {
      this._audio.pause?.();
    } catch {}
    (this._audio.removeAttribute?.('src'),
      clearDesktopMediaPlaybackSourceMetadata(this._audio),
      (this._audio.preload = 'none'));
    try {
      this._audio.load?.();
    } catch {}
  }
  ['_bindAudioLoadHandlers'](value9) {
    if (!this._audio) return;
    const value10 = () => {
      if (this._currentSrc === value9) this._rememberAudioDuration(value9);
    };
    ((this._audio.onloadedmetadata = value10), (this._audio.ondurationchange = value10));
    const value11 = () => {
      this._currentSrc === value9 && (this._rememberAudioDuration(value9), stopLoading(this._card));
    };
    ((this._audio.onloadeddata = value11),
      (this._audio.oncanplay = value11),
      (this._audio.onplaying = value11),
      (this._audio.onerror = () => {
        if (this._currentSrc === value9) stopLoading(this._card);
      }));
  }
  ['_prepareAudio'](enabled9) {
    if (!enabled9) {
      typeof this._cancelDeferredWaveform === 'function' &&
        (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null));
      (this._clearAudioElementSource(),
        (this._currentSrc = null),
        this._progressController?.reset(),
        (this._audioDurationProbeToken += 1),
        stopLoading(this._card));
      return;
    }
    const value12 = this._currentSrc,
      value13 = value12 !== enabled9;
    value13 && this._progressController?.reset();
    this._currentSrc = enabled9;
    if (value13 && value12) {
      const value14 = appStore.getState().nodes?.[this.id];
      Number(value14?.audioDuration || 0) > 0 && appStore.updateNodeData(this.id, { audioDuration: 0 });
    }
    this._getAudioElementSource() && this._clearAudioElementSource();
    ((this._audio.preload = 'none'), this._bindAudioLoadHandlers(enabled9));
    !this._syncKnownAudioDurationUi({ currentTime: 0, showLine: false }) &&
      this._probeAudioDurationIfNeeded(enabled9);
    (stopLoading(this._card), void this._ensureWaveform(enabled9, { persistedOnly: true }));
    if (this._hint) this._hint.style.display = 'block';
  }
  async ['_loadAudio'](enabled10, { showLoading: showLoading = true } = {}) {
    if (!enabled10) return (this._prepareAudio(''), false);
    const value15 = this._currentSrc,
      value16 = value15 !== enabled10;
    value16 && this._progressController?.reset();
    this._currentSrc = enabled10;
    const enabled11 = !!this._getAudioElementCurrentSource(),
      enabled12 = !isMediaElementPlaybackSource(this._audio, enabled10) || !enabled11;
    this._bindAudioLoadHandlers(enabled10);
    if (!enabled12 && this._isAudioElementReady()) {
      if (this._audio.preload !== 'auto') this._audio.preload = 'auto';
      return (stopLoading(this._card), true);
    }
    if (showLoading && enabled12) startLoading(this._card, { variant: 'static' });
    if (!enabled12) {
      if (this._audio.preload !== 'auto') this._audio.preload = 'auto';
      try {
        this._audio.load?.();
      } catch {}
    } else
      await attachMediaElementPlaybackSource(this._audio, enabled10, { preload: 'auto', warmRanges: false });
    if (this._isAudioElementReady()) stopLoading(this._card);
    typeof this._cancelDeferredWaveform === 'function' &&
      (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null));
    this._cancelDeferredWaveform = deferWaveformPathUntilAudioReady(this._audio, () => {
      this._cancelDeferredWaveform = null;
      if (this._currentSrc !== enabled10) return;
      void this._ensureWaveform(enabled10);
    });
    if (this._hint) this._hint.style.display = 'block';
    return true;
  }
  async ['_ensureWaveform'](value17, { persistedOnly: persistedOnly = false } = {}) {
    const enabled13 = String(value17 || '').trim();
    if (!enabled13) return;
    const value18 = ++this._waveToken;
    this._waveKey = enabled13;
    const url = localPathToUrl(this._data?.waveformLocalPath);
    this._waveformLocalPath = String(this._data?.waveformLocalPath || '').trim();
    const value19 = { width: 200, height: 80, samples: 190 };
    let waveformBarsPathFromPersistedUrl = '';
    url && (waveformBarsPathFromPersistedUrl = await getWaveformBarsPathFromPersistedUrl(url, value19));
    !waveformBarsPathFromPersistedUrl &&
      !persistedOnly &&
      (waveformBarsPathFromPersistedUrl = await getWaveformBarsPathFromUrl(enabled13, value19));
    if (!this._audio || !this.el || !this.el.isConnected) return;
    if (value18 !== this._waveToken) return;
    if (!waveformBarsPathFromPersistedUrl) return;
    if (this._waveBgPath) this._waveBgPath.setAttribute('d', waveformBarsPathFromPersistedUrl);
    if (this._waveFgPath) this._waveFgPath.setAttribute('d', waveformBarsPathFromPersistedUrl);
  }
  ['_fmt'](enabled14) {
    if (!enabled14 || isNaN(enabled14)) return '0:00';
    return Math.floor(enabled14 / 60) + ':' + String(Math.floor(enabled14 % 60)).padStart(2, '0');
  }
  ['_setIcon'](value20) {
    const el4 = this._playBtn.querySelector('svg');
    if (!el4) return;
    const value21 = 'http://www.w3.org/2000/svg';
    while (el4.firstChild) el4.removeChild(el4.firstChild);
    if (value20) {
      const el5 = document.createElementNS(value21, 'polygon');
      (el5.setAttribute('points', '5 3 19 12 5 21 5 3'), el4.appendChild(el5));
    } else {
      const el6 = document.createElementNS(value21, 'rect');
      (el6.setAttribute('x', '6'),
        el6.setAttribute('y', '4'),
        el6.setAttribute('width', '4'),
        el6.setAttribute('height', '16'));
      const el7 = document.createElementNS(value21, 'rect');
      (el7.setAttribute('x', '14'),
        el7.setAttribute('y', '4'),
        el7.setAttribute('width', '4'),
        el7.setAttribute('height', '16'),
        el4.appendChild(el6),
        el4.appendChild(el7));
    }
  }
  ['update'](error2) {
    this._data = error2;
    if (!this._audio) return;
    const enabled15 = this._resolveAudioSrc(error2);
    this._syncGeneratingUi(error2, enabled15);
    if (enabled15 && enabled15 !== this._currentSrc) this._prepareAudio(enabled15);
    else {
      if (enabled15)
        (!this._syncKnownAudioDurationUi({
          currentTime: this._audio?.currentTime || 0,
          showLine: Number(this._audio?.currentTime || 0) > 0,
        }) && this._probeAudioDurationIfNeeded(enabled15),
          String(error2?.waveformLocalPath || '').trim() &&
            String(error2?.waveformLocalPath || '').trim() !== this._waveformLocalPath &&
            void this._ensureWaveform(enabled15, { persistedOnly: true }));
      else
        !enabled15 &&
          (typeof this._cancelDeferredWaveform === 'function' &&
            (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null)),
          this._clearAudioElementSource(),
          (this._currentSrc = null),
          this._progressController?.reset(),
          (this._audioDurationProbeToken += 1),
          this._hint &&
            (this._hint.style.display = shouldShowGenerationResultLoadingUi(error2) ? 'none' : 'block'));
    }
    (maybeResumeAudioSeparationLeader(this.id),
      this._label &&
        error2.name &&
        document.activeElement !== this._label &&
        (this._label.innerText = error2.name));
  }
  async ['_playAudio']() {
    if (!this._audio || !this._currentSrc) return;
    (beginAudioPlayback(this.id),
      await this._loadAudio(this._currentSrc, { showLoading: true }),
      this._rewindEndedAudioIfNeeded());
    const promise = this._audio.play();
    promise && typeof promise.catch === 'function'
      ? promise
          .then(() => {
            (this._rememberAudioDuration(), stopLoading(this._card));
          })
          .catch((error3) => {
            stopLoading(this._card);
            if (error3?.name === 'AbortError') return;
            console.warn('[source-audio] play failed:', error3);
          })
      : stopLoading(this._card);
  }
  ['_stopAudioForExternalPlayback']() {
    if (!this._audio) return;
    typeof this._cancelDeferredWaveform === 'function' &&
      (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null));
    try {
      this._audio.pause?.();
    } catch {}
    (!this._getAudioElementCurrentSource() && this._progressController?.reset(),
      stopLoading(this._card),
      this._setIcon(true));
  }
  ['_rememberAudioDuration'](value22 = this._currentSrc) {
    if (!this._audio || (value22 && this._currentSrc !== value22)) return;
    const count3 = this._readAudioDurationSec();
    if (!(count3 > 0)) return;
    this._applyResolvedAudioDuration(count3, value22);
  }
  ['_subscribeLocaleChanges']() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts());
  }
  ['_setUploadButtonLabel'](value23) {
    if (!this._uploadBtn) return;
    const value24 = this._uploadBtn.querySelector('svg')?.cloneNode(true);
    this._uploadBtn.replaceChildren();
    if (value24) this._uploadBtn.appendChild(value24);
    this._uploadBtn.appendChild(document.createTextNode(' ' + value23));
  }
  ['_syncLocaleTexts']() {
    if (!this._uploadBtn) return;
    if (this._isUploading) {
      this._uploadBtn.textContent = sourceAudioText('upload.uploading');
      return;
    }
    this._setUploadButtonLabel(sourceAudioText('upload.button'));
  }
  ['unmount']() {
    (this._unsubscribeLocale?.(),
      (this._unsubscribeLocale = null),
      this._unregisterAudioPlaybackClient?.(),
      (this._unregisterAudioPlaybackClient = null),
      this._progressController?.destroy(),
      (this._progressController = null),
      typeof this._cancelDeferredWaveform === 'function' &&
        (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null)),
      this._clearAudioElementSource());
  }
}
