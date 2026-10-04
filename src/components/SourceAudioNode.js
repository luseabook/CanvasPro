import appStore from '../core/stores/appStore.js';
import { bindRendererMediaPlaybackPin } from './shared/rendererMediaPlaybackPin.js';
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
import { getAudioNodeWaveformPath } from '../utils/audioWaveform.js';
import { createAudioPlaybackProgressController } from '../utils/audioPlaybackProgress.js';
import { normalizeAudioDurationSec, pickAudioDurationSec } from '../services/audioMetadataService.js';
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
import { bindAudioVoiceStudioAction } from './nodeToolbar/audioActions/voiceStudioAction.js';
import { bindPreviewUploadToolbarAction } from '../modules/previewUploadEntry.js';
const WAVE =
    'M10,40\x20L10,40\x20M15,30\x20L15,50\x20M20,20\x20L20,60\x20M25,35\x20L25,45\x20M30,25\x20L30,55\x20M35,15\x20L35,65\x20M40,30\x20L40,50\x20M45,38\x20L45,42\x20M50,22\x20L50,58\x20M55,18\x20L55,62\x20M60,28\x20L60,52\x20M65,32\x20L65,48\x20M70,24\x20L70,56\x20M75,36\x20L75,44\x20M80,20\x20L80,60\x20M85,16\x20L85,64\x20M90,26\x20L90,54\x20M95,34\x20L95,46\x20M100,22\x20L100,58\x20M105,18\x20L105,62\x20M110,30\x20L110,50\x20M115,38\x20L115,42\x20M120,15\x20L120,65\x20M125,25\x20L125,55\x20M130,35\x20L130,45\x20M135,20\x20L135,60\x20M140,30\x20L140,50\x20M145,40\x20L145,40\x20M150,25\x20L150,55\x20M155,15\x20L155,65\x20M160,30\x20L160,50\x20M165,38\x20L165,42\x20M170,22\x20L170,58\x20M175,18\x20L175,62\x20M180,28\x20L180,52\x20M185,32\x20L185,48\x20M190,24\x20L190,56',
  AUDIO_PLAY_LOADING_DEADLINE_MS = 0x1388;
function sourceAudioText(value, item = {}) {
  return t('sourceAudioNode.' + value, item);
}
const _SOURCE_AUDIO_NODE_TEMPLATE_ID = 'node:source-audio';
registerStaticInnerHTML(
  _SOURCE_AUDIO_NODE_TEMPLATE_ID,
  SOURCE_AUDIO_TOOLBAR_HTML +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22node-card\x20media-card\x20audio-card\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22waveform\x20waveform-bg\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x22100%\x22\x20height=\x2280\x22\x20viewBox=\x220\x200\x20200\x2080\x22\x20preserveAspectRatio=\x22none\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<path\x20d=\x22' +
    WAVE +
    '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n            <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n          </svg>\n        </div>\n        <div class="waveform waveform-unplayed">\n          <svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">\n            <path d="' +
    WAVE +
    '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n            <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n          </svg>\n        </div>\n        <div class="media-progress-line"></div>\n        <div class="media-progress-bar"></div>\n        \n        <div class="node-upload-hint audio-upload-hint source-upload-hint">\n          <button type="button" class="upload-btn audio-upload-btn source-upload-btn">\n            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>\n          </button>\n        </div>\n\n        <div class="audio-controls">\n           <button type="button" class="audio-play-btn">\n              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n           </button>\n           <div class="audio-time-wrap">\n             <span class="audio-time-display">0:00 / 0:00</span>\n           </div>\n        </div>\n        <audio class="audio-player"></audio>\n        <div class="node-port out-port"></div>\n        <div class="node-resizer"></div>\n      </div>',
);
export class SourceAudioNode {
  constructor(key) {
    ((this['_data'] = key),
      (this['el'] = document['createElement']('div')),
      (this['id'] = key['id']),
      (this['el']['className'] = 'v2-node-component'),
      (this['_currentSrc'] = null),
      (this['_objUrl'] = null),
      (this['_waveKey'] = null),
      (this['_waveformLocalPath'] = ''),
      (this['_waveToken'] = 0x0),
      (this['_cancelDeferredWaveform'] = null),
      (this['_waveformAbortController'] = null),
      (this['_progressController'] = null),
      (this['_audioDurationProbeToken'] = 0x0),
      (this['_audioLoadToken'] = 0x0),
      (this['_audioLoadInFlightSource'] = ''),
      (this['_audioLoadInFlightPreload'] = ''),
      (this['_audioPlayAttemptToken'] = 0x0),
      (this['_audioPlayDeadlineTimer'] = null),
      (this['_audioPlayPending'] = ![]),
      (this['_playbackResumeSource'] = ''),
      (this['_playbackResumeTime'] = 0x0),
      (this['_isUploading'] = ![]),
      (this['_unsubscribeLocale'] = null),
      (this['_toolbarActionCleanups'] = []));
  }
  ['_resolveAudioSrc'](index) {
    return resolveCanvasAudioUrl(index);
  }
  ['mount']() {
    (this['_clearToolbarActionBindings'](), this['_subscribeLocaleChanges']());
    const el = this['el'];
    (setStaticInnerHTML(el, _SOURCE_AUDIO_NODE_TEMPLATE_ID),
      (this['_card'] = el['querySelector']('.media-card')),
      (this['_audio'] = el['querySelector']('.audio-player')),
      (this['_audio']['preload'] = 'none'),
      (this['_playBtn'] = el['querySelector']('.audio-play-btn')),
      (this['_timeEl'] = el['querySelector']('.audio-time-display')),
      (this['_bar'] = el['querySelector']('.media-progress-bar')),
      (this['_wavePlayed'] = el['querySelector']('.waveform-unplayed')),
      (this['_progressLine'] = el['querySelector']('.media-progress-line')),
      (this['_hint'] = el['querySelector']('.node-upload-hint')),
      (this['_uploadBtn'] = el['querySelector']('.upload-btn')),
      (this['_clipBtn'] = el['querySelector']('.act-clip, .clip-btn')),
      (this['_separateBtn'] = el['querySelector']('.act-separate, .separate-btn')),
      (this['_voiceStudioBtn'] = el['querySelector']('.act-voice-studio')),
      (this['_speedBtn'] = el['querySelector']('.act-speed,\x20.speed-btn')),
      (this['_toolbarUploadBtn'] = el['querySelector']('.act-upload')),
      (this['_downloadBtn'] = el['querySelector']('.act-download,\x20.download-btn')),
      this['_syncLocaleTexts']());
    {
      const list = el['querySelectorAll']('.waveform-bg svg path');
      this['_waveBgPath'] = list && list['length'] ? list[0x0] : null;
      const list2 = el['querySelectorAll']('.waveform-unplayed svg path');
      this['_waveFgPath'] = list2 && list2['length'] ? list2[0x0] : null;
    }
    this['_progressController'] = createAudioPlaybackProgressController({
      audioEl: this['_audio'],
      wavePlayedEl: this['_wavePlayed'],
      progressLineEl: this['_progressLine'],
      timeEl: this['_timeEl'],
      trackEl: this['_bar'],
      formatTime: (result) => this['_fmt'](result),
      shouldSuppressSync: () => this['_isSeeking'] || this['_bar']?.['dataset']['dragging'] === 'true',
    })['attach']();
    const el2 = el['querySelector']('.node-floating-toolbar');
    if (el2)
      el2['addEventListener']('pointerdown', (event) => event['stopPropagation']());
    ((this['_input'] = document['createElement']('input')),
      (this['_input']['type'] = 'file'),
      (this['_input']['accept'] = 'audio/*'),
      (this['_input']['style']['display'] = 'none'),
      el['appendChild'](this['_input']),
      this['_uploadBtn']['addEventListener']('pointerdown', (event2) => {
        (event2['stopPropagation'](), this['_input']['click']());
      }),
      this['_card']['addEventListener']('dblclick', (event3) => {
        event3['stopPropagation']();
      }));
    let box = { x: 0x0, y: 0x0 };
    (this['_card']['addEventListener']('pointerdown', (x) => {
      if (x['target']['closest']('.media-progress-bar')) return;
      box = { x: x['clientX'], y: x['clientY'] };
    }),
      this['_card']['addEventListener']('pointerup', (event4) => {
        if (
          event4['target']['closest']('.media-progress-bar') ||
          event4['target']['closest']('.audio-play-btn') ||
          event4['target']['closest']('.upload-btn') ||
          event4['target']['closest']('.node-floating-toolbar')
        )
          return;
        const count = Math['hypot'](
          event4['clientX'] - box['x'],
          event4['clientY'] - box['y'],
        );
        if (count < 0x5) {
          const box2 = this['_card']['getBoundingClientRect'](),
            data = Math['max'](
              0x0,
              Math['min'](0x1, (event4['clientX'] - box2['left']) / box2['width']),
            ),
            duration = this['_readAudioDurationSec']();
          if (this['_audio'] && duration > 0x0) {
            const currentTime2 = data * duration;
            ((this['_audio']['currentTime'] = currentTime2),
              this['_progressController']?.['sync']({
                currentTime: currentTime2,
                duration: duration,
                force: !![],
                showLine: !![],
              }));
          }
        }
      }),
      this['_bar']?.['addEventListener']('click', (event5) => {
        this['_seekTo'](event5['clientX']);
      }),
      this['_input']['addEventListener']('change', async (event6) => {
        const error = event6['target']['files'][0x0];
        if (!error) return;
        (startLoading(this['_card'], { variant: 'static' }), this['_progressController']?.['reset']());
        const list3 = Array['from'](this['_uploadBtn']['childNodes'])['map']((options) =>
          options['cloneNode'](!![]),
        );
        ((this['_isUploading'] = !![]),
          (this['_uploadBtn']['textContent'] = sourceAudioText('upload.uploading')),
          (this['_uploadBtn']['style']['pointerEvents'] = 'none'));
        try {
          const target = window['currentProjectId'] || 'default_v2_project',
            assetId = await uploadFile(error, target),
            source = error['name']['replace'](/\.[^/.]+$/, '');
          appStore['renameNode'](this['id'], source);
          const next = document['getElementById'](this['id']),
            el3 = next?.['__v2_name_el'];
          if (el3) el3['textContent'] = source;
          const src = assetId['url'],
            localPath = pickResultLocalPath(assetId) || urlToLocalPath(src);
          appStore['updateNodeData'](this['id'], {
            src: src,
            localPath: localPath,
            audioDuration: Number(assetId['audioDuration'] || assetId['duration'] || 0x0) || 0x0,
            assetId: assetId['assetId'] || '',
            originalLocalPath: assetId['originalLocalPath'] || assetId['localPath'] || '',
            waveformLocalPath: assetId['waveformLocalPath'] || '',
            derivativeStatus: assetId['derivativeStatus'] || assetId['status'] || '',
            mediaTaskId: assetId['mediaTaskId'] || '',
            mediaTaskKind: assetId['mediaTaskKind'] || '',
            mediaTaskStatus: assetId['mediaTaskStatus'] || '',
            mediaTaskProgress: Number(assetId['mediaTaskProgress'] || 0x0) || 0x0,
            mediaTaskError: assetId['mediaTaskError'] || '',
            fileName: assetId['filename'] || error['name'],
          });
        } catch (current) {
          (console['error']('音频上传失败:', current),
            window['showToast'](sourceAudioText('upload.failedRetry')),
            stopLoading(this['_card']),
            this['_currentSrc'] && this['_progressController']?.['sync']({ force: !![], showLine: !![] }));
        } finally {
          (this['_uploadBtn']['replaceChildren'](
            ...list3['map']((entry) => entry['cloneNode'](!![])),
          ),
            (this['_uploadBtn']['style']['pointerEvents'] = 'auto'),
            (this['_isUploading'] = ![]),
            this['_syncLocaleTexts'](),
            (this['_input']['value'] = ''));
        }
      }),
      this['_playBtn']['addEventListener']('pointerdown', (event7) => {
        (event7['stopPropagation'](),
          this['_audio']['paused'] && this['_currentSrc'] ? this['_playAudio']() : this['_audio']['pause']());
      }));
    const list4 = [0x1, 1.25, 1.5, 0x2];
    let record = 0x0;
    (this['_speedBtn']?.['addEventListener']('pointerdown', (event8) => {
      (event8['stopPropagation'](), (record = (record + 0x1) % list4['length']));
      const payload = list4[record];
      ((this['_audio']['playbackRate'] = payload),
        (this['_speedBtn']['textContent'] = payload['toFixed'](0x1) + 'x'));
    }),
      this['_clipBtn']?.['addEventListener']('pointerdown', (event9) => {
        (event9['stopPropagation'](), AudioClipController['init'](this['id']));
      }),
      this['_toolbarActionCleanups']['push'](
        bindRunningHubToolbarTaskButton({
          button: this['_separateBtn'],
          getTask: () => getRunningAudioSeparationTaskForNode(this['id']),
          cancelTask: () => cancelAudioSeparationTaskForNode(this['id'], { notify: !![] }),
          cancelTooltip: sourceAudioText('toolbar.cancelAudioSeparation'),
          eventTypes: ['pointerdown', 'click'],
        }),
      ),
      this['_separateBtn']?.['addEventListener']('pointerdown', (event10) => {
        if (getRunningAudioSeparationTaskForNode(this['id'])) {
          (event10['preventDefault'](),
            event10['stopPropagation'](),
            void cancelAudioSeparationTaskForNode(this['id'], { notify: !![] }));
          return;
        }
        (event10['stopPropagation'](), void runAudioSeparationFromNode(this['id']));
      }),
      this['_toolbarActionCleanups']['push'](
        bindPreviewUploadToolbarAction({ button: this['_toolbarUploadBtn'] }),
        bindAudioDownloadAction({
          button: this['_downloadBtn'],
          getNodeData: () => appStore['getState']()['nodes']?.[this['id']] || this['_data'] || {},
          getAudioElement: () => this['_audio'],
          notifyMissing: () => window['showToast']?.(sourceAudioText('download.missingAudio'), 'warn'),
        }),
        bindAudioVoiceStudioAction({ button: this['_voiceStudioBtn'], getNodeId: () => this['id'] }),
      ),
      this['_audio']['addEventListener']('play', () => this['_setIcon'](![])),
      this['_audio']['addEventListener']('pause', () => {
        (this['_setPlaybackBuffering'](![]), this['_setIcon'](!![]));
      }),
      this['_audio']['addEventListener']('waiting', () => {
        if (this['_audio']?.['paused'] === ![]) this['_setPlaybackBuffering'](!![]);
      }),
      this['_audio']['addEventListener']('playing', () => {
        this['_setPlaybackBuffering'](![]);
      }),
      this['_audio']['addEventListener']('ended', () => {
        this['_setPlaybackBuffering'](![]);
      }),
      this['_unregisterAudioPlaybackClient']?.(),
      (this['_unregisterAudioPlaybackClient'] = registerAudioPlaybackClient(this['id'], {
        stopForExternalPlayback: () => this['_stopAudioForExternalPlayback'](),
      })),
      this['_releaseRendererPlaybackPin']?.(),
      (this['_releaseRendererPlaybackPin'] = bindRendererMediaPlaybackPin(this['_audio'], this['id'])));
    const handle = this['_resolveAudioSrc'](this['_data']);
    if (handle) {
      this['_prepareAudio'](handle);
      if (this['_hint']) this['_hint']['style']['display'] = 'block';
    } else {
      this['_progressController']?.['reset']();
      if (this['_hint']) this['_hint']['style']['display'] = 'block';
    }
    return (
      this['_syncGeneratingUi'](this['_data'], handle),
      maybeResumeAudioSeparationLeader(this['id']),
      el
    );
  }
  ['_syncGeneratingUi'](state, enabled) {
    const shouldShowGenerationResultLoadingUi2 = shouldShowGenerationResultLoadingUi(state, { hasResult: !!enabled });
    if (this['_uploadBtn']) this['_uploadBtn']['disabled'] = shouldShowGenerationResultLoadingUi2;
    if (shouldShowGenerationResultLoadingUi2) {
      startLoading(this['_card'], { variant: 'full' });
      if (this['_hint']) this['_hint']['style']['display'] = 'none';
      return;
    }
    (stopLoading(this['_card']), this['_clearResolvedAudioTimer'](state, enabled));
    if (!enabled && this['_hint']) this['_hint']['style']['display'] = 'block';
  }
  ['_clearResolvedAudioTimer'](enabled2, enabled3) {
    if (!enabled3 || !enabled2 || typeof enabled2 !== 'object') return;
    if (!enabled2['generationStartTime'] && enabled2['generationDuration'] == null) return;
    const enabled4 = appStore['getState']()['nodes']?.[this['id']];
    if (!enabled4) return;
    const config = {};
    if (enabled4['generationStartTime']) config['generationStartTime'] = null;
    if (enabled4['generationDuration'] != null) config['generationDuration'] = null;
    if (enabled4['isGenerating'] === !![]) config['isGenerating'] = ![];
    Object['keys'](config)['length'] > 0x0 && appStore['updateNodeData'](this['id'], config);
  }
  ['_seekTo'](scope) {
    const duration2 = this['_readAudioDurationSec']();
    if (!this['_audio'] || duration2 <= 0x0) return;
    const box3 = this['_bar']['getBoundingClientRect']();
    if (box3['width'] === 0x0) return;
    let input = (scope - box3['left']) / box3['width'];
    input = Math['max'](0x0, Math['min'](0x1, input));
    const currentTime3 = input * duration2;
    if (!isFinite(currentTime3)) return;
    ((this['_isSeeking'] = !![]),
      (this['_audio']['currentTime'] = currentTime3),
      this['_progressController']?.['sync']({
        currentTime: currentTime3,
        duration: duration2,
        force: !![],
        showLine: !![],
      }),
      this['_audio']['addEventListener'](
        'seeked',
        () => {
          ((this['_isSeeking'] = ![]),
            this['_progressController']?.['sync']({ force: !![], showLine: !![] }));
        },
        { once: !![] },
      ));
  }
  ['_getAudioElementSource']() {
    return getMediaElementPlaybackSourceKey(this['_audio']);
  }
  ['_getAudioElementCurrentSource']() {
    return getMediaElementCurrentSource(this['_audio']);
  }
  ['_isAudioElementReady']() {
    if (!this['_audio'] || !this['_getAudioElementCurrentSource']()) return ![];
    const count2 = Number(this['_audio']['readyState'] || 0x0);
    return count2 >= 0x2;
  }
  ['_readAudioDurationSec']() {
    const audioDurationSec = normalizeAudioDurationSec(this['_audio']?.['duration']),
      enabled5 = appStore['getStateRaw']()['nodes']?.[this['id']],
      audioDurationSec2 = pickAudioDurationSec(
        enabled5?.['audioDuration'],
        !enabled5 ? this['_data']?.['audioDuration'] : 0x0,
      );
    if (audioDurationSec2 > 0x0) {
      if (!(audioDurationSec > 0x0)) return audioDurationSec2;
      const output = Math['max'](0x1, audioDurationSec2 * 0.25);
      if (Math['abs'](audioDurationSec2 - audioDurationSec) > output) return audioDurationSec2;
    }
    return audioDurationSec;
  }
  ['_syncKnownAudioDurationUi']({ currentTime: currentTime = 0x0, showLine: showLine = ![] } = {}) {
    const duration3 = this['_readAudioDurationSec']();
    if (!(duration3 > 0x0)) return ![];
    const value2 = Number(currentTime),
      currentTime4 = Number['isFinite'](value2) ? Math['max'](0x0, Math['min'](value2, duration3)) : 0x0,
      enabled6 = this['_progressController']?.['sync']({
        currentTime: currentTime4,
        duration: duration3,
        force: !![],
        showLine: showLine,
      });
    if (!showLine) this['_progressController']?.['hideLine']?.();
    return (
      !enabled6 &&
        this['_timeEl'] &&
        (this['_timeEl']['textContent'] = this['_fmt'](currentTime4) + '\x20/\x20' + this['_fmt'](duration3)),
      !![]
    );
  }
  ['_applyResolvedAudioDuration'](value3, value4 = this['_currentSrc']) {
    if (value4 && this['_currentSrc'] !== value4) return ![];
    const audioDuration = normalizeAudioDurationSec(value3);
    if (!(audioDuration > 0x0)) return ![];
    const value5 = appStore['getStateRaw']()['nodes']?.[this['id']],
      audioDurationSec3 = pickAudioDurationSec(value5?.['audioDuration'], this['_data']?.['audioDuration']);
    if (audioDurationSec3 > 0x0) {
      if (Math['abs'](audioDurationSec3 - audioDuration) <= 0.001)
        return this['_syncKnownAudioDurationUi']({
          currentTime: this['_audio']?.['currentTime'] || 0x0,
          showLine: Number(this['_audio']?.['currentTime'] || 0x0) > 0x0,
        });
      const value6 = Math['max'](0x1, audioDurationSec3 * 0.25);
      if (Math['abs'](audioDurationSec3 - audioDuration) > value6) return ![];
    }
    return (
      value5
        ? (appStore['updateNodeData'](this['id'], { audioDuration: audioDuration }),
          (this['_data'] = { ...(this['_data'] || {}), audioDuration: audioDuration }),
          this['_syncKnownAudioDurationUi']({
            currentTime: this['_audio']?.['currentTime'] || 0x0,
            showLine: Number(this['_audio']?.['currentTime'] || 0x0) > 0x0,
          }))
        : ((this['_data'] = { ...(this['_data'] || {}), audioDuration: audioDuration }),
          this['_syncKnownAudioDurationUi']({
            currentTime: this['_audio']?.['currentTime'] || 0x0,
            showLine: Number(this['_audio']?.['currentTime'] || 0x0) > 0x0,
          })),
      !![]
    );
  }
  ['_rewindEndedAudioIfNeeded']() {
    if (!this['_audio']) return;
    const duration4 = this['_readAudioDurationSec']();
    if (!(duration4 > 0x0)) return;
    const value7 = Number(this['_audio']['currentTime'] || 0x0),
      enabled7 = Number['isFinite'](value7) && value7 >= duration4 - 0.05;
    if (this['_audio']['ended'] !== !![] && !enabled7) return;
    try {
      this['_audio']['currentTime'] = 0x0;
    } catch {}
    this['_progressController']?.['sync']({
      currentTime: 0x0,
      duration: duration4,
      force: !![],
      showLine: !![],
    });
  }
  ['_setPlaybackBuffering'](value8) {
    const el4 = this['_playBtn'];
    if (!el4) return;
    el4['classList']?.['toggle']?.('is-buffering', value8 === !![]);
    if (value8 === !![]) el4['setAttribute']?.('aria-busy', 'true');
    else el4['removeAttribute']?.('aria-busy');
  }
  ['_clearPlaybackResume']() {
    ((this['_playbackResumeSource'] = ''), (this['_playbackResumeTime'] = 0x0));
  }
  ['_restorePlaybackPosition'](value9) {
    if (
      !this['_audio'] ||
      Number(this['_audio']['readyState'] || 0x0) < 0x1 ||
      this['_currentSrc'] !== value9 ||
      this['_playbackResumeSource'] !== value9
    )
      return ![];
    const value10 = Number(this['_playbackResumeTime'] || 0x0);
    let currentTime5 = Number['isFinite'](value10) ? Math['max'](0x0, value10) : 0x0;
    const duration5 = this['_readAudioDurationSec']();
    if (duration5 > 0x0) {
      currentTime5 = Math['min'](currentTime5, duration5);
      if (currentTime5 >= duration5 - 0.05) currentTime5 = 0x0;
    }
    try {
      this['_audio']['currentTime'] = currentTime5;
    } catch {
      return ![];
    }
    return (
      this['_clearPlaybackResume'](),
      duration5 > 0x0 &&
        this['_progressController']?.['sync']({
          currentTime: currentTime5,
          duration: duration5,
          force: !![],
          showLine: currentTime5 > 0x0,
        }),
      !![]
    );
  }
  ['_clearAudioElementSource']() {
    (this['_setPlaybackBuffering'](![]), (this['_audioPlayPending'] = ![]));
    if (!this['_audio']) return;
    this['_audioPlayAttemptToken'] = Number(this['_audioPlayAttemptToken'] || 0x0) + 0x1;
    this['_audioPlayDeadlineTimer'] &&
      (clearTimeout(this['_audioPlayDeadlineTimer']), (this['_audioPlayDeadlineTimer'] = null));
    ((this['_audioLoadToken'] = Number(this['_audioLoadToken'] || 0x0) + 0x1),
      (this['_audioLoadInFlightSource'] = ''),
      (this['_audioLoadInFlightPreload'] = ''));
    try {
      this['_audio']['pause']?.();
    } catch {}
    (this['_audio']['removeAttribute']?.('src'),
      clearDesktopMediaPlaybackSourceMetadata(this['_audio']),
      (this['_audio']['preload'] = 'none'));
    try {
      this['_audio']['load']?.();
    } catch {}
  }
  ['_bindAudioLoadHandlers'](value11) {
    if (!this['_audio']) return;
    const value12 = () => {
      this['_currentSrc'] === value11 &&
        (this['_rememberAudioDuration'](value11), this['_restorePlaybackPosition'](value11));
    };
    ((this['_audio']['onloadedmetadata'] = value12), (this['_audio']['ondurationchange'] = value12));
    const value13 = () => {
      this['_currentSrc'] === value11 &&
        (this['_rememberAudioDuration'](value11), this['_setPlaybackBuffering'](![]));
    };
    ((this['_audio']['onloadeddata'] = value13),
      (this['_audio']['oncanplay'] = value13),
      (this['_audio']['onplaying'] = value13),
      (this['_audio']['onerror'] = () => {
        if (this['_currentSrc'] === value11) this['_setPlaybackBuffering'](![]);
      }));
  }
  ['_prepareAudio'](enabled8) {
    if (!enabled8) {
      typeof this['_cancelDeferredWaveform'] === 'function' &&
        (this['_cancelDeferredWaveform'](), (this['_cancelDeferredWaveform'] = null));
      (this['_cancelWaveformRequest'](),
        this['_clearAudioElementSource'](),
        (this['_currentSrc'] = null),
        this['_clearPlaybackResume'](),
        this['_progressController']?.['reset'](),
        (this['_audioDurationProbeToken'] += 0x1),
        stopLoading(this['_card']));
      return;
    }
    const value14 = this['_currentSrc'],
      value15 = value14 !== enabled8;
    value15 && (this['_progressController']?.['reset'](), this['_clearPlaybackResume']());
    this['_currentSrc'] = enabled8;
    if (value15 && value14) {
      const value16 = appStore['getState']()['nodes']?.[this['id']];
      Number(value16?.['audioDuration'] || 0x0) > 0x0 &&
        appStore['updateNodeData'](this['id'], { audioDuration: 0x0 });
    }
    const value17 = !!this['_getAudioElementCurrentSource'](),
      enabled9 = value17 && isMediaElementPlaybackSource(this['_audio'], enabled8);
    this['_getAudioElementSource']() && !enabled9 && this['_clearAudioElementSource']();
    if (!enabled9) this['_audio']['preload'] = 'none';
    (this['_bindAudioLoadHandlers'](enabled8),
      this['_syncKnownAudioDurationUi']({ currentTime: 0x0, showLine: ![] }),
      stopLoading(this['_card']),
      void this['_ensureWaveform'](enabled8));
    if (this['_hint']) this['_hint']['style']['display'] = 'block';
  }
  ['prepareRendererVisibleAudioSurface']() {
    return ![];
  }
  async ['hydrateDeferredMedia']() {
    return ![];
  }
  async ['_loadAudio'](enabled10, { showLoading: showLoading = !![], preload: preload = 'auto' } = {}) {
    if (!enabled10) return (this['_prepareAudio'](''), ![]);
    const preload2 = preload === 'metadata' ? 'metadata' : 'auto',
      value18 = this['_currentSrc'],
      value19 = value18 !== enabled10;
    value19 && (this['_progressController']?.['reset'](), this['_clearPlaybackResume']());
    this['_currentSrc'] = enabled10;
    const value20 = Number(this['_audioLoadToken'] || 0x0) + 0x1;
    ((this['_audioLoadToken'] = value20),
      (this['_audioLoadInFlightSource'] = enabled10),
      (this['_audioLoadInFlightPreload'] = preload2));
    try {
      const enabled11 = !!this['_getAudioElementCurrentSource'](),
        enabled12 = !isMediaElementPlaybackSource(this['_audio'], enabled10) || !enabled11,
        count3 = Number(this['_audio']?.['networkState'] || 0x0),
        count4 = Number(this['_audio']?.['readyState'] || 0x0),
        value21 =
          !enabled12 && count4 === 0x0 && (count3 === 0x0 || count3 === 0x1 || count3 === 0x3);
      this['_bindAudioLoadHandlers'](enabled10);
      if (!enabled12 && this['_isAudioElementReady']())
        return (
          preload2 === 'auto' &&
            this['_audio']['preload'] !== 'auto' &&
            (this['_audio']['preload'] = 'auto'),
          this['_setPlaybackBuffering'](![]),
          !![]
        );
      showLoading && (enabled12 || value21) && this['_setPlaybackBuffering'](!![]);
      if (this['_audioLoadToken'] !== value20 || this['_currentSrc'] !== enabled10) {
        if (showLoading) this['_setPlaybackBuffering'](![]);
        return ![];
      }
      if (!enabled12) {
        const value22 = preload2 === 'auto' || this['_audio']['preload'] === 'auto' ? 'auto' : 'metadata';
        this['_audio']['preload'] !== value22 && (this['_audio']['preload'] = value22);
        if (value21)
          try {
            this['_audio']['load']?.();
          } catch {}
      } else
        await attachMediaElementPlaybackSource(this['_audio'], enabled10, {
          preload: preload2,
          warmRanges: ![],
          shouldAssign: () =>
            this['_audioLoadToken'] === value20 &&
            this['_currentSrc'] === enabled10 &&
            this['_audio']?.['isConnected'] !== ![],
        });
      if (this['_isAudioElementReady']()) this['_setPlaybackBuffering'](![]);
      if (this['_hint']) this['_hint']['style']['display'] = 'block';
      return !![];
    } finally {
      this['_audioLoadToken'] === value20 &&
        ((this['_audioLoadInFlightSource'] = ''), (this['_audioLoadInFlightPreload'] = ''));
    }
  }
  ['_cancelWaveformRequest']() {
    ((this['_waveformLoadingKey'] = ''), (this['_waveToken'] = Number(this['_waveToken'] || 0x0) + 0x1));
    const value23 = this['_waveformAbortController'];
    this['_waveformAbortController'] = null;
    try {
      value23?.['abort']?.();
    } catch {}
  }
  async ['_ensureWaveform'](value24) {
    const enabled13 = String(value24 || '')['trim']();
    if (!enabled13 || this['_rendererWaveformVisible'] !== !![]) return;
    const value25 = JSON['stringify']([enabled13, this['_data']?.['waveformLocalPath'] || '']);
    if (value25 === this['_waveformLoadingKey']) return;
    this['_cancelWaveformRequest']();
    if (value25 === this['_waveformLoadedKey']) return;
    this['_waveformLoadingKey'] = value25;
    const value26 = this['_waveToken'],
      signal = typeof AbortController === 'function' ? new AbortController() : null;
    ((this['_waveformAbortController'] = signal), (this['_waveKey'] = enabled13));
    const url = localPathToUrl(this['_data']?.['waveformLocalPath']);
    this['_waveformLocalPath'] = String(this['_data']?.['waveformLocalPath'] || '')['trim']();
    let value27 = 0x0;
    const value28 = {
      width: 0xc8,
      height: 0x50,
      samples: 0xbe,
      signal: signal?.['signal'],
      onDuration:
        this['_readAudioDurationSec']() > 0x0
          ? undefined
          : (value29) => {
              value27 = value29;
            },
    };
    let audioNodeWaveformPath = '';
    try {
      audioNodeWaveformPath = await getAudioNodeWaveformPath(enabled13, url, value28);
    } finally {
      this['_waveformAbortController'] === signal &&
        ((this['_waveformAbortController'] = null), (this['_waveformLoadingKey'] = ''));
    }
    if (signal?.['signal']?.['aborted']) return;
    if (!this['_audio'] || !this['el'] || !this['el']['isConnected']) return;
    if (value26 !== this['_waveToken']) return;
    this['_applyResolvedAudioDuration'](value27, enabled13);
    if (!audioNodeWaveformPath) return;
    this['_waveformLoadedKey'] = value25;
    if (this['_waveBgPath']) this['_waveBgPath']['setAttribute']('d', audioNodeWaveformPath);
    if (this['_waveFgPath']) this['_waveFgPath']['setAttribute']('d', audioNodeWaveformPath);
  }
  ['_fmt'](enabled14) {
    if (!enabled14 || isNaN(enabled14)) return '0:00';
    return (
      Math['floor'](enabled14 / 0x3c) + ':' + String(Math['floor'](enabled14 % 0x3c))['padStart'](0x2, '0')
    );
  }
  ['setRendererAudioSurfaceVisible'](value30) {
    if (this['_rendererWaveformVisible'] === value30) return;
    this['_rendererWaveformVisible'] = value30;
    if (value30) void this['_ensureWaveform'](this['_currentSrc']);
    else this['_cancelWaveformRequest']();
  }
  ['_setIcon'](value31) {
    const el5 = this['_playBtn']['querySelector']('svg');
    if (!el5) return;
    const value32 = 'http://www.w3.org/2000/svg';
    while (el5['firstChild']) el5['removeChild'](el5['firstChild']);
    if (value31) {
      const el6 = document['createElementNS'](value32, 'polygon');
      (el6['setAttribute']('points', '5 3 19 12 5 21 5 3'), el5['appendChild'](el6));
    } else {
      const el7 = document['createElementNS'](value32, 'rect');
      (el7['setAttribute']('x', '6'),
        el7['setAttribute']('y', '4'),
        el7['setAttribute']('width', '4'),
        el7['setAttribute']('height', '16'));
      const el8 = document['createElementNS'](value32, 'rect');
      (el8['setAttribute']('x', '14'),
        el8['setAttribute']('y', '4'),
        el8['setAttribute']('width', '4'),
        el8['setAttribute']('height', '16'),
        el5['appendChild'](el7),
        el5['appendChild'](el8));
    }
  }
  ['update'](error2) {
    this['_data'] = error2;
    if (!this['_audio']) return;
    const enabled15 = this['_resolveAudioSrc'](error2);
    this['_syncGeneratingUi'](error2, enabled15);
    if (enabled15 && enabled15 !== this['_currentSrc']) this['_prepareAudio'](enabled15);
    else {
      if (enabled15)
        (this['_syncKnownAudioDurationUi']({
          currentTime: this['_audio']?.['currentTime'] || 0x0,
          showLine: Number(this['_audio']?.['currentTime'] || 0x0) > 0x0,
        }),
          String(error2?.['waveformLocalPath'] || '')['trim']() !== this['_waveformLocalPath'] &&
            void this['_ensureWaveform'](enabled15));
      else
        !enabled15 &&
          (typeof this['_cancelDeferredWaveform'] === 'function' &&
            (this['_cancelDeferredWaveform'](), (this['_cancelDeferredWaveform'] = null)),
          this['_cancelWaveformRequest'](),
          this['_clearAudioElementSource'](),
          (this['_currentSrc'] = null),
          this['_clearPlaybackResume'](),
          this['_progressController']?.['reset'](),
          (this['_audioDurationProbeToken'] += 0x1),
          this['_hint'] &&
            (this['_hint']['style']['display'] = shouldShowGenerationResultLoadingUi(error2)
              ? 'none'
              : 'block'));
    }
    (maybeResumeAudioSeparationLeader(this['id']),
      this['_label'] &&
        error2['name'] &&
        document['activeElement'] !== this['_label'] &&
        (this['_label']['innerText'] = error2['name']));
  }
  async ['_playAudio']() {
    if (!this['_audio'] || !this['_currentSrc'] || this['_audioPlayPending'] === !![]) return;
    ((this['_audioPlayPending'] = !![]), beginAudioPlayback(this['id']));
    const value33 = this['_currentSrc'],
      value34 = Number(this['_audioPlayAttemptToken'] || 0x0) + 0x1;
    this['_audioPlayAttemptToken'] = value34;
    if (this['_audioPlayDeadlineTimer']) clearTimeout(this['_audioPlayDeadlineTimer']);
    const run = () => {
      if (this['_audioPlayAttemptToken'] !== value34) return;
      ((this['_audioPlayPending'] = ![]),
        this['_audioPlayDeadlineTimer'] &&
          (clearTimeout(this['_audioPlayDeadlineTimer']), (this['_audioPlayDeadlineTimer'] = null)));
    };
    this['_audioPlayDeadlineTimer'] = setTimeout(() => {
      if (this['_audioPlayAttemptToken'] !== value34 || this['_currentSrc'] !== value33) return;
      ((this['_audioPlayDeadlineTimer'] = null), this['_clearAudioElementSource'](), this['_setIcon'](!![]));
    }, AUDIO_PLAY_LOADING_DEADLINE_MS);
    let enabled16 = ![];
    try {
      enabled16 = await this['_loadAudio'](value33, { showLoading: !![], preload: 'metadata' });
    } catch (error3) {
      (run(), this['_setPlaybackBuffering'](![]));
      if (error3?.['name'] !== 'AbortError')
        console['warn']('[source-audio]\x20load\x20failed:', error3);
      return;
    }
    if (!enabled16 || !this['_getAudioElementCurrentSource']()) {
      (run(), this['_setPlaybackBuffering'](![]));
      return;
    }
    (this['_restorePlaybackPosition'](value33), this['_rewindEndedAudioIfNeeded']());
    let promise;
    try {
      promise = this['_audio']['play']();
    } catch (value35) {
      (run(),
        this['_setPlaybackBuffering'](![]),
        console['warn']('[source-audio]\x20play\x20failed:', value35));
      return;
    }
    promise && typeof promise['catch'] === 'function'
      ? promise['then'](() => {
          (run(), this['_rememberAudioDuration'](), this['_setPlaybackBuffering'](![]));
        })['catch']((error4) => {
          (run(), this['_setPlaybackBuffering'](![]));
          if (error4?.['name'] === 'AbortError') return;
          console['warn']('[source-audio]\x20play\x20failed:', error4);
        })
      : (run(), this['_setPlaybackBuffering'](![]));
  }
  ['_stopAudioForExternalPlayback']() {
    if (!this['_audio']) return;
    typeof this['_cancelDeferredWaveform'] === 'function' &&
      (this['_cancelDeferredWaveform'](), (this['_cancelDeferredWaveform'] = null));
    const value36 = !!this['_getAudioElementCurrentSource'](),
      value37 = !!this['_audioLoadInFlightSource'];
    if (value36 && this['_currentSrc']) {
      const value38 = Number(this['_audio']['currentTime'] || 0x0),
        currentTime6 = Number['isFinite'](value38) ? Math['max'](0x0, value38) : 0x0;
      ((this['_playbackResumeSource'] = this['_currentSrc']),
        (this['_playbackResumeTime'] = currentTime6),
        this['_syncKnownAudioDurationUi']({ currentTime: currentTime6, showLine: currentTime6 > 0x0 }));
    }
    ((value36 || value37) &&
      (this['_clearAudioElementSource'](),
      value36 &&
        this['_syncKnownAudioDurationUi']({
          currentTime: this['_playbackResumeTime'],
          showLine: this['_playbackResumeTime'] > 0x0,
        })),
      this['_setPlaybackBuffering'](![]),
      this['_setIcon'](!![]));
  }
  ['getRendererMediaState']() {
    return { deferred: ![], interactionActive: this['_isSeeking'] === !![] };
  }
  ['suspendRendererMedia']() {
    this['setRendererAudioSurfaceVisible'](![]);
    if (!this['_audio'] || this['_audio']['paused'] === ![]) return ![];
    return (this['_stopAudioForExternalPlayback'](), !![]);
  }
  ['_rememberAudioDuration'](value39 = this['_currentSrc']) {
    if (!this['_audio'] || (value39 && this['_currentSrc'] !== value39)) return;
    const count5 = this['_readAudioDurationSec']();
    if (!(count5 > 0x0)) return;
    this['_applyResolvedAudioDuration'](count5, value39);
  }
  ['_subscribeLocaleChanges']() {
    if (this['_unsubscribeLocale']) return;
    this['_unsubscribeLocale'] = onLocaleChange(() => this['_syncLocaleTexts']());
  }
  ['_setUploadButtonLabel'](value40) {
    if (!this['_uploadBtn']) return;
    const value41 = this['_uploadBtn']['querySelector']('svg')?.['cloneNode'](!![]);
    this['_uploadBtn']['replaceChildren']();
    if (value41) this['_uploadBtn']['appendChild'](value41);
    this['_uploadBtn']['appendChild'](document['createTextNode']('\x20' + value40));
  }
  ['_syncLocaleTexts']() {
    if (!this['_uploadBtn']) return;
    if (this['_isUploading']) {
      this['_uploadBtn']['textContent'] = sourceAudioText('upload.uploading');
      return;
    }
    this['_setUploadButtonLabel'](sourceAudioText('upload.button'));
  }
  ['_clearToolbarActionBindings']() {
    if (!Array['isArray'](this['_toolbarActionCleanups'])) {
      this['_toolbarActionCleanups'] = [];
      return;
    }
    for (const run2 of this['_toolbarActionCleanups']['splice'](0x0)) run2();
  }
  ['unmount']() {
    ((this['_rendererWaveformVisible'] = ![]),
      this['_releaseRendererPlaybackPin']?.(),
      (this['_releaseRendererPlaybackPin'] = null),
      this['_clearToolbarActionBindings'](),
      this['_unsubscribeLocale']?.(),
      (this['_unsubscribeLocale'] = null),
      this['_unregisterAudioPlaybackClient']?.(),
      (this['_unregisterAudioPlaybackClient'] = null),
      this['_progressController']?.['destroy'](),
      (this['_progressController'] = null),
      typeof this['_cancelDeferredWaveform'] === 'function' &&
        (this['_cancelDeferredWaveform'](), (this['_cancelDeferredWaveform'] = null)),
      this['_cancelWaveformRequest'](),
      this['_clearAudioElementSource']());
  }
}
