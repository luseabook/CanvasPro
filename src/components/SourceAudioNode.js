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
function sourceAudioText(_0x54d1c1, _0x26ff9f = {}) {
  return t('sourceAudioNode.' + _0x54d1c1, _0x26ff9f);
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
  constructor(_0x4a4aa2) {
    ((this._data = _0x4a4aa2),
      (this.el = document.createElement('div')),
      (this.id = _0x4a4aa2.id),
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
  ['_resolveAudioSrc'](_0x46bd6b) {
    return resolveCanvasAudioUrl(_0x46bd6b);
  }
  ['mount']() {
    this._subscribeLocaleChanges();
    const _0x451953 = this.el;
    (setStaticInnerHTML(_0x451953, _SOURCE_AUDIO_NODE_TEMPLATE_ID),
      (this._card = _0x451953.querySelector('.media-card')),
      (this._audio = _0x451953.querySelector('.audio-player')),
      (this._audio.preload = 'none'),
      (this._playBtn = _0x451953.querySelector('.audio-play-btn')),
      (this._timeEl = _0x451953.querySelector('.audio-time-display')),
      (this._bar = _0x451953.querySelector('.media-progress-bar')),
      (this._wavePlayed = _0x451953.querySelector('.waveform-unplayed')),
      (this._progressLine = _0x451953.querySelector('.media-progress-line')),
      (this._hint = _0x451953.querySelector('.node-upload-hint')),
      (this._uploadBtn = _0x451953.querySelector('.upload-btn')),
      (this._clipBtn = _0x451953.querySelector('.act-clip, .clip-btn')),
      (this._separateBtn = _0x451953.querySelector('.act-separate, .separate-btn')),
      (this._speedBtn = _0x451953.querySelector('.act-speed, .speed-btn')),
      (this._downloadBtn = _0x451953.querySelector('.act-download, .download-btn')),
      this._syncLocaleTexts());
    {
      const _0x4b2fbc = _0x451953.querySelectorAll('.waveform-bg svg path');
      this._waveBgPath = _0x4b2fbc && _0x4b2fbc.length ? _0x4b2fbc[0] : null;
      const _0xe06562 = _0x451953.querySelectorAll('.waveform-unplayed svg path');
      this._waveFgPath = _0xe06562 && _0xe06562.length ? _0xe06562[0] : null;
    }
    this._progressController = createAudioPlaybackProgressController({
      audioEl: this._audio,
      wavePlayedEl: this._wavePlayed,
      progressLineEl: this._progressLine,
      timeEl: this._timeEl,
      trackEl: this._bar,
      formatTime: (_0x25aebd) => this._fmt(_0x25aebd),
      shouldSuppressSync: () => this._isSeeking || this._bar?.dataset.dragging === 'true',
    }).attach();
    const _0x12e2f2 = _0x451953.querySelector('.node-floating-toolbar');
    if (_0x12e2f2) _0x12e2f2.addEventListener('pointerdown', (_0x5c81f3) => _0x5c81f3.stopPropagation());
    ((this._input = document.createElement('input')),
      (this._input.type = 'file'),
      (this._input.accept = 'audio/*'),
      (this._input.style.display = 'none'),
      _0x451953.appendChild(this._input),
      this._uploadBtn.addEventListener('pointerdown', (_0x511158) => {
        (_0x511158.stopPropagation(), this._input.click());
      }),
      this._card.addEventListener('dblclick', (_0x24038e) => {
        _0x24038e.stopPropagation();
      }));
    let _0x95cab0 = { x: 0, y: 0 };
    (this._card.addEventListener('pointerdown', (_0x57c7fe) => {
      if (_0x57c7fe.target.closest('.media-progress-bar')) return;
      _0x95cab0 = { x: _0x57c7fe.clientX, y: _0x57c7fe.clientY };
    }),
      this._card.addEventListener('pointerup', (_0xf191d2) => {
        if (
          _0xf191d2.target.closest('.media-progress-bar') ||
          _0xf191d2.target.closest('.audio-play-btn') ||
          _0xf191d2.target.closest('.upload-btn') ||
          _0xf191d2.target.closest('.node-floating-toolbar')
        )
          return;
        const _0xcdb31 = Math.hypot(_0xf191d2.clientX - _0x95cab0.x, _0xf191d2.clientY - _0x95cab0.y);
        if (_0xcdb31 < 5) {
          const _0x2a4dc7 = this._card.getBoundingClientRect(),
            _0x18eff9 = Math.max(0, Math.min(1, (_0xf191d2.clientX - _0x2a4dc7.left) / _0x2a4dc7.width)),
            _0x2b5c00 = this._readAudioDurationSec();
          if (this._audio && _0x2b5c00 > 0) {
            const _0x1bfaa3 = _0x18eff9 * _0x2b5c00;
            ((this._audio.currentTime = _0x1bfaa3),
              this._progressController?.sync({
                currentTime: _0x1bfaa3,
                duration: _0x2b5c00,
                force: true,
                showLine: true,
              }));
          }
        }
      }),
      this._bar?.addEventListener('click', (_0x4977f3) => {
        this._seekTo(_0x4977f3.clientX);
      }),
      this._input.addEventListener('change', async (_0x5e4a2c) => {
        const _0x520f43 = _0x5e4a2c.target.files[0];
        if (!_0x520f43) return;
        (startLoading(this._card, { variant: 'static' }), this._progressController?.reset());
        const _0x2614d5 = Array.from(this._uploadBtn.childNodes).map((_0x2db3af) =>
          _0x2db3af.cloneNode(true),
        );
        ((this._isUploading = true),
          (this._uploadBtn.textContent = sourceAudioText('upload.uploading')),
          (this._uploadBtn.style.pointerEvents = 'none'));
        try {
          const _0xc12924 = window.currentProjectId || 'default_v2_project',
            _0xc8d4e9 = await uploadFile(_0x520f43, _0xc12924),
            _0x4f8f28 = _0x520f43.name.replace(/\.[^/.]+$/, '');
          appStore.renameNode(this.id, _0x4f8f28);
          const _0x101a17 = document.getElementById(this.id),
            _0x37c373 = _0x101a17?.__v2_name_el;
          if (_0x37c373) _0x37c373.textContent = _0x4f8f28;
          const _0x5e289a = _0xc8d4e9.url,
            _0x3265c7 = pickResultLocalPath(_0xc8d4e9) || urlToLocalPath(_0x5e289a);
          appStore.updateNodeData(this.id, {
            src: _0x5e289a,
            localPath: _0x3265c7,
            audioDuration: Number(_0xc8d4e9.audioDuration || _0xc8d4e9.duration || 0) || 0,
            assetId: _0xc8d4e9.assetId || '',
            originalLocalPath: _0xc8d4e9.originalLocalPath || _0xc8d4e9.localPath || '',
            waveformLocalPath: _0xc8d4e9.waveformLocalPath || '',
            derivativeStatus: _0xc8d4e9.derivativeStatus || _0xc8d4e9.status || '',
            mediaTaskId: _0xc8d4e9.mediaTaskId || '',
            mediaTaskKind: _0xc8d4e9.mediaTaskKind || '',
            mediaTaskStatus: _0xc8d4e9.mediaTaskStatus || '',
            mediaTaskProgress: Number(_0xc8d4e9.mediaTaskProgress || 0) || 0,
            mediaTaskError: _0xc8d4e9.mediaTaskError || '',
            fileName: _0xc8d4e9.filename || _0x520f43.name,
          });
        } catch (_0x6f5c8) {
          (console.error('音频上传失败:', _0x6f5c8),
            window.showToast(sourceAudioText('upload.failedRetry')),
            stopLoading(this._card),
            this._currentSrc && this._progressController?.sync({ force: true, showLine: true }));
        } finally {
          (this._uploadBtn.replaceChildren(..._0x2614d5.map((_0x3c5f71) => _0x3c5f71.cloneNode(true))),
            (this._uploadBtn.style.pointerEvents = 'auto'),
            (this._isUploading = false),
            this._syncLocaleTexts(),
            (this._input.value = ''));
        }
      }),
      this._playBtn.addEventListener('pointerdown', (_0x2b7b93) => {
        (_0x2b7b93.stopPropagation(),
          this._audio.paused && this._currentSrc ? this._playAudio() : this._audio.pause());
      }));
    const _0x1503da = [1, 1.25, 1.5, 2];
    let _0x5993cb = 0;
    (this._speedBtn?.addEventListener('pointerdown', (_0x47c313) => {
      (_0x47c313.stopPropagation(), (_0x5993cb = (_0x5993cb + 1) % _0x1503da.length));
      const _0x4d67b1 = _0x1503da[_0x5993cb];
      ((this._audio.playbackRate = _0x4d67b1), (this._speedBtn.textContent = _0x4d67b1.toFixed(1) + 'x'));
    }),
      this._clipBtn?.addEventListener('pointerdown', (_0x331a2a) => {
        (_0x331a2a.stopPropagation(), AudioClipController.init(this.id));
      }),
      bindRunningHubToolbarTaskButton({
        button: this._separateBtn,
        getTask: () => getRunningAudioSeparationTaskForNode(this.id),
        cancelTask: () => cancelAudioSeparationTaskForNode(this.id, { notify: true }),
        cancelTooltip: sourceAudioText('toolbar.cancelAudioSeparation'),
        eventTypes: ['pointerdown', 'click'],
      }),
      this._separateBtn?.addEventListener('pointerdown', (_0x20be1f) => {
        if (getRunningAudioSeparationTaskForNode(this.id)) {
          (_0x20be1f.preventDefault(),
            _0x20be1f.stopPropagation(),
            void cancelAudioSeparationTaskForNode(this.id, { notify: true }));
          return;
        }
        (_0x20be1f.stopPropagation(), void runAudioSeparationFromNode(this.id));
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
    const _0x2fbe95 = this._resolveAudioSrc(this._data);
    if (_0x2fbe95) {
      this._prepareAudio(_0x2fbe95);
      if (this._hint) this._hint.style.display = 'block';
    } else {
      this._progressController?.reset();
      if (this._hint) this._hint.style.display = 'block';
    }
    return (
      this._syncGeneratingUi(this._data, _0x2fbe95),
      maybeResumeAudioSeparationLeader(this.id),
      _0x451953
    );
  }
  ['_syncGeneratingUi'](_0x567c4d, _0x2168b7) {
    const _0x57bc3b = shouldShowGenerationResultLoadingUi(_0x567c4d, { hasResult: !!_0x2168b7 });
    if (this._uploadBtn) this._uploadBtn.disabled = _0x57bc3b;
    if (_0x57bc3b) {
      startLoading(this._card, { variant: 'full' });
      if (this._hint) this._hint.style.display = 'none';
      return;
    }
    (stopLoading(this._card), this._clearResolvedAudioTimer(_0x567c4d, _0x2168b7));
    if (!_0x2168b7 && this._hint) this._hint.style.display = 'block';
  }
  ['_clearResolvedAudioTimer'](_0xb20585, _0x2ab07f) {
    if (!_0x2ab07f || !_0xb20585 || typeof _0xb20585 !== 'object') return;
    if (!_0xb20585.generationStartTime && _0xb20585.generationDuration == null) return;
    const _0x41d575 = appStore.getState().nodes?.[this.id];
    if (!_0x41d575) return;
    const _0x57e2df = {};
    if (_0x41d575.generationStartTime) _0x57e2df.generationStartTime = null;
    if (_0x41d575.generationDuration != null) _0x57e2df.generationDuration = null;
    if (_0x41d575.isGenerating === true) _0x57e2df.isGenerating = false;
    Object.keys(_0x57e2df).length > 0 && appStore.updateNodeData(this.id, _0x57e2df);
  }
  ['_seekTo'](_0xffd931) {
    const _0x138286 = this._readAudioDurationSec();
    if (!this._audio || _0x138286 <= 0) return;
    const _0x581f69 = this._bar.getBoundingClientRect();
    if (_0x581f69.width === 0) return;
    let _0x3a2293 = (_0xffd931 - _0x581f69.left) / _0x581f69.width;
    _0x3a2293 = Math.max(0, Math.min(1, _0x3a2293));
    const _0x17eba8 = _0x3a2293 * _0x138286;
    if (!isFinite(_0x17eba8)) return;
    ((this._isSeeking = true),
      (this._audio.currentTime = _0x17eba8),
      this._progressController?.sync({
        currentTime: _0x17eba8,
        duration: _0x138286,
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
    const _0x3b8b97 = Number(this._audio.readyState || 0);
    return _0x3b8b97 >= 2;
  }
  ['_readAudioDurationSec']() {
    const _0x4c8b38 = normalizeAudioDurationSec(this._audio?.duration),
      _0x78d400 = appStore.getState().nodes?.[this.id],
      _0x27ef64 = pickAudioDurationSec(_0x78d400?.audioDuration, !_0x78d400 ? this._data?.audioDuration : 0);
    if (_0x27ef64 > 0) {
      if (!(_0x4c8b38 > 0)) return _0x27ef64;
      const _0x2fe276 = Math.max(1, _0x27ef64 * 0.25);
      if (Math.abs(_0x27ef64 - _0x4c8b38) > _0x2fe276) return _0x27ef64;
    }
    return _0x4c8b38;
  }
  ['_syncKnownAudioDurationUi']({ currentTime: currentTime = 0, showLine: showLine = false } = {}) {
    const _0x114567 = this._readAudioDurationSec();
    if (!(_0x114567 > 0)) return false;
    const _0x44d989 = Number(currentTime),
      _0xee0fb3 = Number.isFinite(_0x44d989) ? Math.max(0, Math.min(_0x44d989, _0x114567)) : 0,
      _0x550581 = this._progressController?.sync({
        currentTime: _0xee0fb3,
        duration: _0x114567,
        force: true,
        showLine: showLine,
      });
    if (!showLine) this._progressController?.hideLine?.();
    return (
      !_0x550581 &&
        this._timeEl &&
        (this._timeEl.textContent = this._fmt(_0xee0fb3) + ' / ' + this._fmt(_0x114567)),
      true
    );
  }
  ['_applyResolvedAudioDuration'](_0x8a4586, _0x5c4313 = this._currentSrc) {
    if (_0x5c4313 && this._currentSrc !== _0x5c4313) return false;
    const _0x5c3a49 = normalizeAudioDurationSec(_0x8a4586);
    if (!(_0x5c3a49 > 0)) return false;
    const _0x34173d = appStore.getState().nodes?.[this.id],
      _0x2fc6a5 = pickAudioDurationSec(_0x34173d?.audioDuration, this._data?.audioDuration);
    if (_0x2fc6a5 > 0) {
      if (Math.abs(_0x2fc6a5 - _0x5c3a49) <= 0.001)
        return this._syncKnownAudioDurationUi({
          currentTime: this._audio?.currentTime || 0,
          showLine: Number(this._audio?.currentTime || 0) > 0,
        });
      const _0x5b08fe = Math.max(1, _0x2fc6a5 * 0.25);
      if (Math.abs(_0x2fc6a5 - _0x5c3a49) > _0x5b08fe) return false;
    }
    return (
      _0x34173d
        ? (appStore.updateNodeData(this.id, { audioDuration: _0x5c3a49 }),
          (this._data = { ...(this._data || {}), audioDuration: _0x5c3a49 }),
          this._syncKnownAudioDurationUi({
            currentTime: this._audio?.currentTime || 0,
            showLine: Number(this._audio?.currentTime || 0) > 0,
          }))
        : ((this._data = { ...(this._data || {}), audioDuration: _0x5c3a49 }),
          this._syncKnownAudioDurationUi({
            currentTime: this._audio?.currentTime || 0,
            showLine: Number(this._audio?.currentTime || 0) > 0,
          })),
      true
    );
  }
  ['_probeAudioDurationIfNeeded'](_0x7dac29) {
    const _0x229c22 = String(_0x7dac29 || '').trim();
    if (!_0x229c22 || this._readAudioDurationSec() > 0) return;
    const _0x59c86a = (this._audioDurationProbeToken || 0) + 1;
    ((this._audioDurationProbeToken = _0x59c86a),
      void loadAudioDurationMetadataSec(_0x229c22).then((_0x395e2c) => {
        if (this._audioDurationProbeToken !== _0x59c86a || this._currentSrc !== _0x229c22) return;
        this._applyResolvedAudioDuration(_0x395e2c, _0x229c22);
      }));
  }
  ['_rewindEndedAudioIfNeeded']() {
    if (!this._audio) return;
    const _0x26a005 = this._readAudioDurationSec();
    if (!(_0x26a005 > 0)) return;
    const _0x304675 = Number(this._audio.currentTime || 0),
      _0x4df770 = Number.isFinite(_0x304675) && _0x304675 >= _0x26a005 - 0.05;
    if (this._audio.ended !== true && !_0x4df770) return;
    try {
      this._audio.currentTime = 0;
    } catch {}
    this._progressController?.sync({ currentTime: 0, duration: _0x26a005, force: true, showLine: true });
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
  ['_bindAudioLoadHandlers'](_0x1d635d) {
    if (!this._audio) return;
    const _0x3d9eff = () => {
      if (this._currentSrc === _0x1d635d) this._rememberAudioDuration(_0x1d635d);
    };
    ((this._audio.onloadedmetadata = _0x3d9eff), (this._audio.ondurationchange = _0x3d9eff));
    const _0x45bba0 = () => {
      this._currentSrc === _0x1d635d && (this._rememberAudioDuration(_0x1d635d), stopLoading(this._card));
    };
    ((this._audio.onloadeddata = _0x45bba0),
      (this._audio.oncanplay = _0x45bba0),
      (this._audio.onplaying = _0x45bba0),
      (this._audio.onerror = () => {
        if (this._currentSrc === _0x1d635d) stopLoading(this._card);
      }));
  }
  ['_prepareAudio'](_0x45a0b5) {
    if (!_0x45a0b5) {
      typeof this._cancelDeferredWaveform === 'function' &&
        (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null));
      (this._clearAudioElementSource(),
        (this._currentSrc = null),
        this._progressController?.reset(),
        (this._audioDurationProbeToken += 1),
        stopLoading(this._card));
      return;
    }
    const _0x351e7d = this._currentSrc,
      _0x62c5e = _0x351e7d !== _0x45a0b5;
    _0x62c5e && this._progressController?.reset();
    this._currentSrc = _0x45a0b5;
    if (_0x62c5e && _0x351e7d) {
      const _0x4e8974 = appStore.getState().nodes?.[this.id];
      Number(_0x4e8974?.audioDuration || 0) > 0 && appStore.updateNodeData(this.id, { audioDuration: 0 });
    }
    this._getAudioElementSource() && this._clearAudioElementSource();
    ((this._audio.preload = 'none'), this._bindAudioLoadHandlers(_0x45a0b5));
    !this._syncKnownAudioDurationUi({ currentTime: 0, showLine: false }) &&
      this._probeAudioDurationIfNeeded(_0x45a0b5);
    (stopLoading(this._card), void this._ensureWaveform(_0x45a0b5, { persistedOnly: true }));
    if (this._hint) this._hint.style.display = 'block';
  }
  async ['_loadAudio'](_0x1c628a, { showLoading: showLoading = true } = {}) {
    if (!_0x1c628a) return (this._prepareAudio(''), false);
    const _0x2ff857 = this._currentSrc,
      _0x1d8c17 = _0x2ff857 !== _0x1c628a;
    _0x1d8c17 && this._progressController?.reset();
    this._currentSrc = _0x1c628a;
    const _0x5f5ade = !!this._getAudioElementCurrentSource(),
      _0x5d15c0 = !isMediaElementPlaybackSource(this._audio, _0x1c628a) || !_0x5f5ade;
    this._bindAudioLoadHandlers(_0x1c628a);
    if (!_0x5d15c0 && this._isAudioElementReady()) {
      if (this._audio.preload !== 'auto') this._audio.preload = 'auto';
      return (stopLoading(this._card), true);
    }
    if (showLoading && _0x5d15c0) startLoading(this._card, { variant: 'static' });
    if (!_0x5d15c0) {
      if (this._audio.preload !== 'auto') this._audio.preload = 'auto';
      try {
        this._audio.load?.();
      } catch {}
    } else
      await attachMediaElementPlaybackSource(this._audio, _0x1c628a, { preload: 'auto', warmRanges: false });
    if (this._isAudioElementReady()) stopLoading(this._card);
    typeof this._cancelDeferredWaveform === 'function' &&
      (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null));
    this._cancelDeferredWaveform = deferWaveformPathUntilAudioReady(this._audio, () => {
      this._cancelDeferredWaveform = null;
      if (this._currentSrc !== _0x1c628a) return;
      void this._ensureWaveform(_0x1c628a);
    });
    if (this._hint) this._hint.style.display = 'block';
    return true;
  }
  async ['_ensureWaveform'](_0x1a56ff, { persistedOnly: persistedOnly = false } = {}) {
    const _0x11a117 = String(_0x1a56ff || '').trim();
    if (!_0x11a117) return;
    const _0x541862 = ++this._waveToken;
    this._waveKey = _0x11a117;
    const _0x1766e5 = localPathToUrl(this._data?.waveformLocalPath);
    this._waveformLocalPath = String(this._data?.waveformLocalPath || '').trim();
    const _0x1940d9 = { width: 200, height: 80, samples: 190 };
    let _0x5e3a59 = '';
    _0x1766e5 && (_0x5e3a59 = await getWaveformBarsPathFromPersistedUrl(_0x1766e5, _0x1940d9));
    !_0x5e3a59 && !persistedOnly && (_0x5e3a59 = await getWaveformBarsPathFromUrl(_0x11a117, _0x1940d9));
    if (!this._audio || !this.el || !this.el.isConnected) return;
    if (_0x541862 !== this._waveToken) return;
    if (!_0x5e3a59) return;
    if (this._waveBgPath) this._waveBgPath.setAttribute('d', _0x5e3a59);
    if (this._waveFgPath) this._waveFgPath.setAttribute('d', _0x5e3a59);
  }
  ['_fmt'](_0x53310d) {
    if (!_0x53310d || isNaN(_0x53310d)) return '0:00';
    return Math.floor(_0x53310d / 60) + ':' + String(Math.floor(_0x53310d % 60)).padStart(2, '0');
  }
  ['_setIcon'](_0x16a5e9) {
    const _0x2a214b = this._playBtn.querySelector('svg');
    if (!_0x2a214b) return;
    const _0x3e1f2c = 'http://www.w3.org/2000/svg';
    while (_0x2a214b.firstChild) _0x2a214b.removeChild(_0x2a214b.firstChild);
    if (_0x16a5e9) {
      const _0x1618cd = document.createElementNS(_0x3e1f2c, 'polygon');
      (_0x1618cd.setAttribute('points', '5 3 19 12 5 21 5 3'), _0x2a214b.appendChild(_0x1618cd));
    } else {
      const _0x4f6c40 = document.createElementNS(_0x3e1f2c, 'rect');
      (_0x4f6c40.setAttribute('x', '6'),
        _0x4f6c40.setAttribute('y', '4'),
        _0x4f6c40.setAttribute('width', '4'),
        _0x4f6c40.setAttribute('height', '16'));
      const _0x100821 = document.createElementNS(_0x3e1f2c, 'rect');
      (_0x100821.setAttribute('x', '14'),
        _0x100821.setAttribute('y', '4'),
        _0x100821.setAttribute('width', '4'),
        _0x100821.setAttribute('height', '16'),
        _0x2a214b.appendChild(_0x4f6c40),
        _0x2a214b.appendChild(_0x100821));
    }
  }
  ['update'](_0x3f9345) {
    this._data = _0x3f9345;
    if (!this._audio) return;
    const _0xaa0765 = this._resolveAudioSrc(_0x3f9345);
    this._syncGeneratingUi(_0x3f9345, _0xaa0765);
    if (_0xaa0765 && _0xaa0765 !== this._currentSrc) this._prepareAudio(_0xaa0765);
    else {
      if (_0xaa0765)
        (!this._syncKnownAudioDurationUi({
          currentTime: this._audio?.currentTime || 0,
          showLine: Number(this._audio?.currentTime || 0) > 0,
        }) && this._probeAudioDurationIfNeeded(_0xaa0765),
          String(_0x3f9345?.waveformLocalPath || '').trim() &&
            String(_0x3f9345?.waveformLocalPath || '').trim() !== this._waveformLocalPath &&
            void this._ensureWaveform(_0xaa0765, { persistedOnly: true }));
      else
        !_0xaa0765 &&
          (typeof this._cancelDeferredWaveform === 'function' &&
            (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null)),
          this._clearAudioElementSource(),
          (this._currentSrc = null),
          this._progressController?.reset(),
          (this._audioDurationProbeToken += 1),
          this._hint &&
            (this._hint.style.display = shouldShowGenerationResultLoadingUi(_0x3f9345) ? 'none' : 'block'));
    }
    (maybeResumeAudioSeparationLeader(this.id),
      this._label &&
        _0x3f9345.name &&
        document.activeElement !== this._label &&
        (this._label.innerText = _0x3f9345.name));
  }
  async ['_playAudio']() {
    if (!this._audio || !this._currentSrc) return;
    (beginAudioPlayback(this.id),
      await this._loadAudio(this._currentSrc, { showLoading: true }),
      this._rewindEndedAudioIfNeeded());
    const _0x12af44 = this._audio.play();
    _0x12af44 && typeof _0x12af44.catch === 'function'
      ? _0x12af44
          .then(() => {
            (this._rememberAudioDuration(), stopLoading(this._card));
          })
          .catch((_0x2de02f) => {
            stopLoading(this._card);
            if (_0x2de02f?.name === 'AbortError') return;
            console.warn('[source-audio] play failed:', _0x2de02f);
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
  ['_rememberAudioDuration'](_0x5ea5c5 = this._currentSrc) {
    if (!this._audio || (_0x5ea5c5 && this._currentSrc !== _0x5ea5c5)) return;
    const _0x500f8e = this._readAudioDurationSec();
    if (!(_0x500f8e > 0)) return;
    this._applyResolvedAudioDuration(_0x500f8e, _0x5ea5c5);
  }
  ['_subscribeLocaleChanges']() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts());
  }
  ['_setUploadButtonLabel'](_0x53492d) {
    if (!this._uploadBtn) return;
    const _0x5824bf = this._uploadBtn.querySelector('svg')?.cloneNode(true);
    this._uploadBtn.replaceChildren();
    if (_0x5824bf) this._uploadBtn.appendChild(_0x5824bf);
    this._uploadBtn.appendChild(document.createTextNode(' ' + _0x53492d));
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
