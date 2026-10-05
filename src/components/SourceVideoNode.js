import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { resumeAsyncVideoTask, resumeRunningHubVideoTask } from '../../api/aiVideoApi.js';
import { ensureConfig, getProviderConfig } from '../../api/configApi.js';
import { fetchVideoMetaFromServer } from '../../api/videoMetaApi.js';
import { desktopBridge } from '../services/desktopBridge.js';
import { fetchVideoFirstFrameThumbFromServer } from '../../api/videoThumbApi.js';
import { fetchRemoteBlob, saveOutputFromUrlToServer, saveOutputToServer } from '../../api/projectsV2Api.js';
import { resumeRunninghubWorkflowTask } from '../../api/runninghubWorkflowApi.js';
import { discardLocalStagedAsset, importLocalStagedAsset, uploadFile } from '../modules/project.js';
import { startLoading, stopLoading } from '../modules/loadingOverlay.js';
import VideoKeyingController from '../modules/VideoKeyingController.js';
import { commit } from '../modules/history.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import { VIDEO_TOOLBAR_HTML, bindVideoToolbarEvents } from './NodeToolbarConfig.js';
import { registerStaticInnerHTML, setStaticInnerHTML } from '../utils/dom.js';
import {
  CANVAS_VIDEO_IMPORT_MAX_BYTES,
  CANVAS_VIDEO_IMPORT_MAX_MB,
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from '../services/fileService.js';
import {
  buildCanvasVideoProxyPromotionPatch,
  buildCanvasLocalVideoFields,
  resolveCanvasVideoUrl,
} from '../services/canvasMediaLocalService.js';
import { requestVisibleVideoProxyMigration } from '../services/mediaTaskService.js';
import {
  isTaskTerminal,
  resolveGenerationUiState,
  shouldShowGenerationResultLoadingUi,
} from '../core/generationTaskUiState.js';
import { resumeTask } from '../core/generationTaskRuntime.js';
import { extractCurrentVideoFrameToImageNode } from '../modules/videoFrameExtraction.js';
import {
  attachVideoPlaybackRecovery,
  detachVideoPlaybackRecovery,
  getVideoCurrentSource,
  logVideoPlaybackEvent,
} from './video-node/mediaPlaybackRecovery.js';
import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
  isMediaElementPlaybackSource,
} from '../services/desktopMediaBlobSource.js';
import { localPathToUrl, pickResultLocalPath, urlToLocalPath } from '../utils/localMediaPath.js';
import { getVideoSourceKey } from '../modules/modelInputPolicy.js';
import {
  buildVideoMutedPatch,
  readVideoAudioDefaultEnabledFromStore,
  resolveVideoMutedPreference,
} from './video-node/videoMuteState.js';
import {
  createHoverVideoPlaybackLifecycle,
  isExternallyOwnedVideoPlayback,
  shouldKeepManualPlaybackPresentationActive,
  shouldTakeOverActiveHoverPlayback,
} from './shared/hoverVideoPlaybackLifecycle.js';
import { startMediaProgressDragSession } from './shared/mediaProgressDragSession.js';
import {
  deactivateSourceVideoHoverPlayback,
  releaseIdleSourceVideoHoverPlaybackMedia,
  shouldActivateSourceVideoHoverPlayback,
  syncSourceVideoPlaybackChromeVisibility,
} from './source-video/sourceVideoHoverPlayback.js';
import {
  setSourceVideoManualLoopPlayback,
  toggleSourceVideoManualPlayback,
} from './source-video/sourceVideoManualPlayback.js';
import { isCanvasImagePreloadRecentlyResolved, preloadCanvasImage } from '../modules/canvasMediaScheduler.js';
import {
  shouldDeferRendererDetailsOnMount,
  shouldDeferRendererMediaOnMount,
  shouldPrebuildRendererRuntimeOffscreen,
} from '../core/rendererDeferredMedia.js';
import {
  hasPresentedVideoFrame,
  resetVideoFramePresentation,
  watchVideoFramePresentation,
} from '../services/videoFramePresentation.js';
import {
  hasReportedSourceVideoMediaSlotFrame,
  reportSourceVideoMediaSlotFrameOnce,
  scheduleSourceVideoFramePresentationCommit,
} from './video-node/sourceVideoFramePresentationBatch.js';
import {
  acquireLocalVideoPlaybackObjectUrlResult,
  releaseLocalVideoPlaybackObjectUrlOwner,
} from '../services/localVideoPlaybackObjectUrlService.js';
import { revokeTrackedMediaObjectUrl } from '../services/mediaObjectUrlRegistry.js';
import { createVideoNodeUpdatePerf } from './video-node/videoNodeUpdatePerf.js';
import { createVideoGenerationErrorCard } from './video-node/videoGenerationErrorCard.js';
import { openSourceVideoFullscreenPreview } from './video-node/sourceVideoFullscreenPreview.js';
import {
  hasSourceVideoRecoveryWork,
  isClientFetchableMediaUrl,
  isDesktopRenderer,
  isSourceVideoInteractionBusy,
  scheduleSourceVideoIdleTask,
  shouldFetchVideoMetaForNodeInfo,
  sourceVideoText,
} from './source-video/sourceVideoRuntime.js';
import {
  buildSourceVideoUploadSizePatch,
  createVideoCapturePreviewUrl,
  readVideoFileNaturalSize,
  waitForNextPaint,
} from './source-video/sourceVideoUploadMedia.js';
import {
  buildRunningHubVideoTerminalStatePatch,
  buildSourceVideoRecoveryFailurePatch,
  getVideoMattingModelId,
  isRunningHubVideoTask,
  resolveRunningHubVideoStatusName,
  resolveSourceVideoGenerationFailureMessage,
} from './source-video/sourceVideoTaskState.js';
import {
  resolveSourceVideoMediaTaskSrc,
  resolveSourceVideoPosterSrc,
} from './source-video/sourceVideoMediaState.js';
import {
  clearSourceVideoPlaybackFeedback,
  playSourceVideoWithFeedback,
} from './source-video/sourceVideoPlaybackFeedback.js';
export {
  buildSourceVideoUploadSizePatch,
  resolveSourceVideoGenerationFailureMessage,
  resolveSourceVideoMediaTaskSrc,
  resolveSourceVideoPosterSrc,
};
const SOURCE_VIDEO_MIN_SIZE = 150,
  SOURCE_VIDEO_POSTER_PRELOAD = 'metadata',
  SOURCE_VIDEO_POSTER_PRELOAD_PRIORITY = 55,
  SOURCE_VIDEO_RENDER_PIN_REASON = 'source-video:playback',
  SOURCE_VIDEO_LOCAL_BLOB_MAX_BYTES = 64 * 1024 * 1024,
  SOURCE_VIDEO_LOCAL_BLOB_FETCH_TIMEOUT_MS = 900,
  SOURCE_VIDEO_CANONICAL_IMPORT_RETRY_MS = 10000,
  _SOURCE_VIDEO_NODE_TEMPLATE_ID = 'node:source-video';
registerStaticInnerHTML(
  _SOURCE_VIDEO_NODE_TEMPLATE_ID,
  VIDEO_TOOLBAR_HTML +
    '\n        <div class="node-card media-card video-card" style="width: 100%; height: 100%; padding: 0; background: var(--white-05); border: 1px solid var(--video-node-surface-border-color, var(--stroke-08)); border-radius: 18px; overflow: hidden; position: relative; display: flex; align-items: stretch; pointer-events: auto; cursor: var(--link-cursor);">\n        <img class="source-video-poster-frame" alt="" draggable="false">\n\n        <div class="video-center-indicator">\n          <div class="indicator-inner">\n          </div>\n        </div>\n\n        <div class="node-upload-hint source-upload-hint">\n          <button type="button" class="upload-btn source-upload-btn">\n            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>\n            <span class="source-upload-label"></span>\n          </button>\n        </div>\n\n        <div class="video-controls">\n          <button type="button" class="video-play-btn">\n            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n          </button>\n          <span class="video-time-current">0:00</span>\n          <div class="media-progress-bar">\n             <div class="media-progress-fill">\n                <div class="media-progress-knob"></div>\n             </div>\n          </div>\n          <span class="video-time-total">0:00</span>\n          <button type="button" class="video-mute-btn">\n            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-unmuted" style="display:none;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>\n            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-muted"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="1" x2="1" y2="23"></line><line x1="15.54" y1="8.46" x2="19.07" y2="12"></line></svg>\n          </button>\n          <button type="button" class="video-snap-btn">\n            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>\n          </button>\n        </div>\n        <div class="node-port out-port"></div>\n        <div class="node-resizer"></div>\n      </div>',
);
export class SourceVideoNode {
  constructor(value) {
    ((this['_data'] = value),
      (this['el'] = document['createElement']('div')),
      (this['id'] = value['id']),
      (this['el']['className'] = 'v2-node-component source-video-node-component'),
      (this['_currentSrc'] = null),
      (this['_rendererMediaSlotToken'] = null),
      (this['_objUrl'] = null),
      (this['_objUrlSource'] = ''),
      (this['_playbackBlobFetchController'] = null),
      (this['_playbackSourcePromise'] = null),
      (this['_playbackSourcePromiseSource'] = ''),
      (this['_playbackSourceToken'] = 0),
      (this['_pendingPlaybackSource'] = ''),
      (this['_hasPendingPlaybackSource'] = ![]),
      (this['_playbackResumeGeneration'] = 0),
      (this['_pendingPlaybackResume'] = null),
      (this['_isMuted'] = resolveVideoMutedPreference(value, {
        videoAudioDefaultEnabled: readVideoAudioDefaultEnabledFromStore(appStore),
      })),
      (this['_isManualControl'] = ![]),
      (this['_isHovered'] = ![]),
      (this['_hoverManualPause'] = ![]),
      (this['_isManualLoopPlayback'] = ![]),
      (this['_autoPlayToken'] = 0),
      (this['_seekToken'] = 0),
      (this['_isSeeking'] = ![]),
      (this['_progressDragSession'] = null),
      (this['_clickTimer'] = null),
      (this['_clip'] = null),
      (this['_metaFetchToken'] = 0),
      (this['_canonicalAssetImportRetryTimer'] = null),
      (this['_canonicalAssetImportSource'] = ''),
      (this['_canonicalAssetImportPromise'] = null),
      (this['_canonicalAssetImportRetryGeneration'] = 0),
      (this['_canonicalAssetImportDisposed'] = ![]),
      (this['_canonicalAssetImportFailedAt'] = 0),
      (this['_thumbFetchToken'] = 0),
      (this['_activeCapturePreviewUrl'] = ''),
      (this['_lastPosterSrc'] = ''),
      (this['_rhResumeAbortController'] = null),
      (this['_rhResumeTaskId'] = ''),
      (this['_rhResumePromise'] = null),
      (this['_asyncResumeAbortController'] = null),
      (this['_asyncResumeTaskId'] = ''),
      (this['_asyncResumePromise'] = null),
      (this['_idleVideoThumbCancel'] = null),
      (this['_deferredVideoMetaCancel'] = null),
      (this['_isUploading'] = ![]),
      (this['_unsubscribeLocale'] = null),
      (this['_rendererMediaDeferred'] = shouldDeferRendererMediaOnMount(value)),
      (this['_rendererDetailsDeferred'] = shouldDeferRendererDetailsOnMount(value)),
      (this['_rendererRuntimePrebuiltOffscreen'] = shouldPrebuildRendererRuntimeOffscreen(value)),
      (this['_videoEventsBound'] = ![]),
      (this['_progressRaf'] = 0),
      (this['_toolbarEl'] = null),
      (this['_videoToolbarBound'] = ![]),
      (this['_videoToolbarCleanup'] = null),
      (this['_removeDeferredToolbarActivator'] = null),
      (this['_videoInteractionBound'] = ![]),
      (this['_removeDeferredInteractionActivator'] = null),
      (this['_rendererEagerVideoPreview'] = ![]),
      (this['_rendererPlaybackPinned'] = ![]),
      (this['_hoverPlaybackLifecycle'] = createHoverVideoPlaybackLifecycle({
        releaseMedia: () => this['_releaseIdleHoverPlaybackMedia'](),
      })));
  }
  ['_ensureVideoToolbarBound']() {
    if (this['_videoToolbarBound'] === !![]) return;
    const enabled = this['_toolbarEl'] || this['el']?.['querySelector']?.('.node-floating-toolbar') || null;
    if (!enabled) return;
    (this['_removeDeferredToolbarActivator']?.(),
      (this['_removeDeferredToolbarActivator'] = null),
      this['_videoToolbarCleanup']?.(),
      (this['_videoToolbarCleanup'] = bindVideoToolbarEvents(enabled, this['_data'])),
      (this['_toolbarEl'] = enabled),
      (this['_videoToolbarBound'] = !![]));
  }
  ['_armDeferredVideoToolbarBinding']() {
    if (!this['_toolbarEl'] || this['_removeDeferredToolbarActivator']) return;
    const item = (event) => {
        (event?.['stopPropagation']?.(), this['_ensureVideoToolbarBound']());
      },
      key = () => {
        this['_ensureVideoToolbarBound']();
      };
    (this['_toolbarEl']['addEventListener']?.('pointerdown', item, !![]),
      this['_toolbarEl']['addEventListener']?.('focusin', key, !![]),
      (this['_removeDeferredToolbarActivator'] = () => {
        (this['_toolbarEl']?.['removeEventListener']?.('pointerdown', item, !![]),
          this['_toolbarEl']?.['removeEventListener']?.('focusin', key, !![]));
      }));
  }
  ['_ensureVideoInputElement']() {
    if (this['_input']) return this['_input'];
    if (!this['el'] || typeof document?.['createElement'] !== 'function') return null;
    const el = document['createElement']('input');
    return (
      (el['type'] = 'file'),
      (el['accept'] = 'video/*'),
      (el['style']['display'] = 'none'),
      this['el']['appendChild'](el),
      (this['_input'] = el),
      el
    );
  }
  ['_armDeferredVideoInteractionBinding']() {
    if (!this['el'] || this['_removeDeferredInteractionActivator'] || this['_videoInteractionBound']) return;
    const el2 = this['_card'],
      index = () => {
        this['_bindVideoInteractionHandlers']();
      },
      result = () => {
        if (!shouldActivateSourceVideoHoverPlayback(appStore, this['id'])) return;
        (this['hydrateDeferredMedia'](), this['_activateHoverPlayback']());
      };
    (this['el']['addEventListener']?.('pointerdown', index, !![]),
      this['el']['addEventListener']?.('focusin', index, !![]),
      el2?.['addEventListener']?.('mouseenter', result, !![]),
      (this['_removeDeferredInteractionActivator'] = () => {
        (this['el']?.['removeEventListener']?.('pointerdown', index, !![]),
          this['el']?.['removeEventListener']?.('focusin', index, !![]),
          el2?.['removeEventListener']?.('mouseenter', result, !![]));
      }));
  }
  ['_bindVideoInteractionHandlers']() {
    if (this['_videoInteractionBound'] === !![]) return;
    if (!this['el'] || typeof this['_card']?.['addEventListener'] !== 'function') return;
    ((this['_videoInteractionBound'] = !![]),
      this['_removeDeferredInteractionActivator']?.(),
      (this['_removeDeferredInteractionActivator'] = null),
      this['_card']['addEventListener']('dblclick', (event2) => {
        event2['stopPropagation']();
        this['_clickTimer'] && (clearTimeout(this['_clickTimer']), (this['_clickTimer'] = null));
        const data =
          this['_currentSrc'] ||
          this['_resolveVideoSrc'](this['_data']) ||
          this['_video']?.['dataset']?.['desktopMediaSourceUrl'] ||
          (this['_video'] ? getVideoCurrentSource(this['_video']) : '');
        data && void this['_openFullscreenFromCurrentVideo']();
      }),
      this['_card']['addEventListener']('click', (event3) => {
        if (event3['detail'] && event3['detail'] > 1) return;
        if (
          event3['target']['closest']('.video-controls') ||
          event3['target']['closest']('.video-mute-btn') ||
          event3['target']['closest']('.node-upload-hint') ||
          event3['target']['closest']('.node-floating-toolbar')
        )
          return;
        event3['stopPropagation']();
        if (this['_clickTimer']) clearTimeout(this['_clickTimer']);
        this['_clickTimer'] = setTimeout(() => {
          this['_clickTimer'] = null;
          if (!this['_currentSrc']) return;
          this['_toggleManualPlayback']({ forcePlay: this['_shouldKeepHoverPlaybackOnManualClick']() });
        }, 180);
      }));
    const el3 = this['_ensureVideoInputElement']();
    this['_uploadBtn']?.['addEventListener']?.('click', (event4) => {
      (event4['stopPropagation'](), el3?.['click']?.());
    });
    this['_resizer'] &&
      this['_resizer']['addEventListener']('pointerdown', (event5) => {
        const options = appStore['getStateRaw']()['ui']?.['imageVideoNodeResizeEnabled'] === !![],
          target = document['getElementById']('v2-wrap')?.['classList']['contains'](
            'v2-media-node-resize-enabled',
          );
        if (!(options && target)) return;
        startNodeResizePreview({
          event: event5,
          nodeId: this['id'],
          getNode: () => appStore['getStateRaw']()['nodes']?.[this['id']] || this['_data'],
          getViewport: () => appStore['getStateRaw']()['viewport'],
          resolveSize: ({ startWidth: startWidth, startHeight: startHeight, dx: dx, dy: dy }) => {
            const source = startWidth / startHeight,
              next = Math['max'](dx / startWidth, dy / startHeight),
              current = Math['max'](SOURCE_VIDEO_MIN_SIZE / startWidth, SOURCE_VIDEO_MIN_SIZE / startHeight),
              entry = Math['max'](current, 1 + next),
              width = Math['max'](SOURCE_VIDEO_MIN_SIZE, Math['round'](startWidth * entry)),
              height = Math['max'](SOURCE_VIDEO_MIN_SIZE, Math['round'](width / source));
            return { width: width, height: height };
          },
          buildFinalPatch: ({ startNode: startNode }) =>
            startNode?.['needsAutoResize'] ? { needsAutoResize: ![] } : {},
          applyPatch: (record) => appStore['updateNodeData'](this['id'], record),
          commit: commit,
        });
      });
    (el3?.['addEventListener']?.('change', async (event6) => {
      const enabled2 = event6['target']['files'][0];
      if (!enabled2) return;
      await this['_handleUploadInputFile'](enabled2);
    }),
      this['_muteBtn']?.['addEventListener']?.('click', (event7) => {
        event7['stopPropagation']();
        if (VideoKeyingController['isActiveFor'](this['_data']?.['id'])) return;
        this['_setMuted'](!this['_isMuted'], { persist: !![] });
      }),
      this['_playBtn']?.['addEventListener']?.('click', (loop2) => {
        loop2['stopPropagation']();
        if (VideoKeyingController['isActiveFor'](this['_data']?.['id'])) return;
        if (!this['_currentSrc']) return;
        this['_toggleManualPlayback']({
          loop: loop2['shiftKey'] === !![],
          forcePlay: this['_shouldKeepHoverPlaybackOnManualClick'](),
        });
      }));
    if (this['_bar']) {
      let payload = 0;
      this['_updateDragVisual'] = (handle) => {
        if (this['_fill']) this['_fill']['style']['width'] = handle * 100 + '%';
        if (!this['_timeCurrent']) return;
        const state = this['_getBaseDuration'](),
          config = this['_getClipRange'](state),
          scope = config['active']
            ? Math['max'](0, config['end'] - config['start'])
            : state;
        if (scope && Number['isFinite'](scope))
          this['_timeCurrent']['textContent'] = this['_fmt'](handle * scope);
      };
      const run = (event8) => {
          const el4 = this['_bar'];
          if (!el4) return 0;
          const box = el4['getBoundingClientRect'](),
            enabled3 = box['width'] || 0;
          if (!enabled3) return 0;
          const input = event8['clientX'] - box['left'];
          if (!Number['isFinite'](input)) return 0;
          return Math['max'](0, Math['min'](1, input / enabled3));
        },
        handler = (output) => {
          if (!Number['isFinite'](output)) return;
          const enabled4 = this['_getBaseDuration']();
          if (!enabled4 || !Number['isFinite'](enabled4)) return;
          const value2 = this['_getClipRange'](enabled4),
            enabled5 = value2['active']
              ? Math['max'](0, value2['end'] - value2['start'])
              : enabled4;
          if (!enabled5 || !Number['isFinite'](enabled5)) return;
          const value3 = Math['max'](
            0,
            Math['min'](enabled4, (value2['active'] ? value2['start'] : 0) + output * enabled5),
          );
          if (!Number['isFinite'](value3)) return;
          const el5 = this['_ensureVideoElement']();
          if (!el5) return;
          this['_isSeeking'] = !![];
          const value4 = ++this['_seekToken'];
          el5['currentTime'] = value3;
          const value5 = () => {
            if (value4 !== this['_seekToken']) return;
            this['_isSeeking'] = ![];
            const value6 = this['_getBaseDuration'](),
              value7 = this['_getClipRange'](value6),
              value8 = value7['active']
                ? Math['max'](0, value7['end'] - value7['start'])
                : value6,
              value9 = el5['currentTime'] || 0;
            if (value8 && Number['isFinite'](value8)) {
              const value10 = value7['active']
                ? Math['max'](0, Math['min'](value8, value9 - value7['start']))
                : value9;
              ((this['_fill']['style']['width'] = (value10 / value8) * 100 + '%'),
                (this['_timeCurrent']['textContent'] = this['_fmt'](value10)),
                (this['_timeTotal']['textContent'] = this['_fmt'](value8)));
            }
          };
          (el5['addEventListener']('seeked', value5, { once: !![] }),
            window['setTimeout'](value5, 300));
        },
        onMove = (event9) => {
          (event9['stopPropagation'](),
            event9['preventDefault'](),
            (payload = run(event9)),
            this['_updateDragVisual'](payload));
        },
        handler2 = ({ commitSeek: commitSeek }) => {
          ((this['_bar']['dataset']['dragging'] = 'false'), (this['_progressDragSession'] = null));
          if (commitSeek) handler(payload);
          this['_isSeeking'] = ![];
          if (!commitSeek) this['_syncVideoProgressUi']();
          this['_syncRendererPlaybackPin']();
        };
      this['_bar']['addEventListener']?.('pointerdown', (pointerId) => {
        (pointerId['stopPropagation'](), pointerId['preventDefault']());
        if (pointerId['button'] !== 0 || pointerId['isPrimary'] === ![]) return;
        this['_progressDragSession']?.['cancel']?.();
        if (VideoKeyingController['isActiveFor'](this['_data']?.['id'])) return;
        if (!this['_currentSrc']) return;
        ((this['_isManualControl'] = !![]),
          this['_setManualLoopPlayback'](![]),
          this['_syncPlaybackChromeVisibility'](),
          this['_autoPlayToken']++,
          (this['_hoverManualPause'] = !![]),
          this['_ensureVideoElement']()?.['pause']?.(),
          (this['_isSeeking'] = !![]),
          this['_syncRendererPlaybackPin'](),
          (this['_bar']['dataset']['dragging'] = 'true'),
          (payload = run(pointerId)),
          this['_updateDragVisual'](payload),
          handler(payload),
          (this['_progressDragSession'] = startMediaProgressDragSession({
            target: window,
            pointerId: pointerId['pointerId'],
            onMove: onMove,
            onEnd: () => handler2({ commitSeek: !![] }),
            onCancel: () => handler2({ commitSeek: ![] }),
          })));
      });
    }
    (this['_snapBtn']?.['addEventListener']?.('click', (event10) => {
      event10['stopPropagation']();
      if (VideoKeyingController['isActiveFor'](this['_data']?.['id'])) return;
      void this['_captureFrame']();
    }),
      this['_card']['addEventListener']('mouseenter', () => this['_activateHoverPlayback']()),
      this['_card']['addEventListener']('mouseleave', () => {
        const value11 = appStore['getStateRaw']()['videoClip'];
        if (value11 && value11['active'] && value11['nodeId'] === this['_data']?.['id']) return;
        this['_deactivateHoverPlayback']();
      }),
      this['_controls']?.['addEventListener']?.('pointerdown', (event11) => event11['stopPropagation']()),
      this['_muteBtn']?.['addEventListener']?.('pointerdown', (event12) => event12['stopPropagation']()));
  }
  ['_activateHoverPlayback']() {
    if (!shouldActivateSourceVideoHoverPlayback(appStore, this['id'])) return ![];
    const value12 = appStore['getStateRaw']()['videoClip'];
    if (value12 && value12['active'] && value12['nodeId'] === this['_data']?.['id']) return ![];
    this['_hoverPlaybackLifecycle']?.['activate']?.();
    if (!this['_currentSrc'] || this['_rendererMediaDeferred'] === !![]) return ![];
    const enabled6 = this['_ensureVideoElement']();
    if (!enabled6) return ![];
    ((this['_isHovered'] = !![]),
      this['_syncPlaybackChromeVisibility'](),
      this['_syncRendererPlaybackPin']());
    if (VideoKeyingController['isActiveFor'](this['_data']?.['id'])) return (enabled6['pause'](), ![]);
    if (
      isExternallyOwnedVideoPlayback(enabled6) ||
      shouldKeepManualPlaybackPresentationActive(this, enabled6)
    )
      return !![];
    if (this['_hoverManualPause'] || this['_isManualLoopPlayback']) return ![];
    const value13 = this['_getBaseDuration'](),
      enabled7 = this['_getClipRange'](value13);
    enabled6['loop'] = !enabled7['active'];
    if (enabled7['active']) {
      const value14 = enabled6['currentTime'] || 0;
      if (value14 < enabled7['start'] || value14 > enabled7['end'])
        enabled6['currentTime'] = enabled7['start'];
    }
    const value15 = ++this['_autoPlayToken'];
    return (
      logVideoPlaybackEvent(enabled6, 'hover-enter', { label: this['_getPlaybackLabel']('hover') }),
      void this['_playVideoWithRecovery'](
        'hover',
        () =>
          this['_autoPlayToken'] === value15 && this['_isHovered'] === !![] && !this['_hoverManualPause'],
      ),
      !![]
    );
  }
  ['_ensureVideoElement']() {
    if (this['_video']) return this['_video'];
    if (!this['_card']) return null;
    const el6 = document['createElement']('video');
    ((el6['className'] = 'video-player'),
      el6['setAttribute']('playsinline', ''),
      (el6['preload'] = 'none'),
      (el6['muted'] = this['_isMuted']),
      Object['assign'](el6['style'], {
        width: '100%',
        height: '100%',
        display: 'block',
        opacity: '0',
        visibility: 'hidden',
        objectFit: 'cover',
        borderRadius: '0',
        margin: '0',
        pointerEvents: 'none',
      }));
    if (this['_posterFrame']?.['parentNode'] === this['_card'])
      this['_card']['insertBefore'](el6, this['_posterFrame']);
    else
      typeof this['_card']['prepend'] === 'function'
        ? this['_card']['prepend'](el6)
        : this['_card']['appendChild'](el6);
    return ((this['_video'] = el6), this['_bindVideoElementEvents'](), el6);
  }
  ['_syncPlaybackChromeVisibility']({ forceHidden: forceHidden = ![] } = {}) {
    return syncSourceVideoPlaybackChromeVisibility(this, { forceHidden: forceHidden });
  }
  ['_deactivateHoverPlayback']() {
    return deactivateSourceVideoHoverPlayback(this);
  }
  ['_releaseIdleHoverPlaybackMedia']() {
    return releaseIdleSourceVideoHoverPlaybackMedia(this);
  }
  ['_syncLoadedVideoMetadata'](enabled8 = this['_video']) {
    if (!enabled8 || enabled8 !== this['_video']) return ![];
    const args = appStore['getState']()['nodes']?.[this['id']];
    if (!args) return ![];
    const value16 = String(this['_resolveVideoSrc'](args) || '')['trim'](),
      value17 = String(this['_currentSrc'] || '')['trim']();
    if (value16 && value17 && value16 !== value17) return ![];
    const value18 = value17 || value16;
    if (value18 && !isMediaElementPlaybackSource(enabled8, value18)) return ![];
    (this['_syncVideoDurationUi'](), this['_syncVideoProgressUi']());
    const count = Number(enabled8['duration'] || 0),
      count2 = Number(enabled8['videoWidth'] || 0),
      count3 = Number(enabled8['videoHeight'] || 0),
      box2 = {};
    Number['isFinite'](count) &&
      count > 0 &&
      Number(args['videoDuration'] || 0) !== count &&
      (box2['videoDuration'] = count);
    count2 > 0 &&
      Number(args['videoWidth'] || 0) !== count2 &&
      (box2['videoWidth'] = count2);
    count3 > 0 &&
      Number(args['videoHeight'] || 0) !== count3 &&
      (box2['videoHeight'] = count3);
    if (
      args['fixedSize'] !== !![] &&
      args['needsAutoResize'] === !![] &&
      count2 > 0 &&
      count3 > 0
    ) {
      const box3 = getAutoMediaSizeByShortSide(count2, count3);
      ((box2['width'] = box3['width']),
        (box2['height'] = box3['height']),
        (box2['needsAutoResize'] = ![]));
    }
    return (
      Object['keys'](box2)['length'] > 0 &&
        (appStore['updateNodeData'](this['id'], box2), (this['_data'] = { ...args, ...box2 })),
      !![]
    );
  }
  ['_bindVideoElementEvents']() {
    if (!this['_video'] || this['_videoEventsBound'] === !![]) return;
    ((this['_videoEventsBound'] = !![]),
      this['_video']['addEventListener']('play', () => {
        (this['_syncRendererPlaybackPin'](),
          this['_syncPosterFrameVisibility'](),
          this['_updatePlayIcon'](![]),
          this['_syncPlaybackChromeVisibility'](),
          this['_hideCenterIndicator'](),
          this['_startProgressLoop']());
      }),
      this['_video']['addEventListener']('pause', () => {
        (this['_cancelProgressLoop'](),
          this['_syncVideoProgressUi'](),
          this['_syncPosterFrameVisibility'](),
          this['_updatePlayIcon'](!![]),
          this['_syncPlaybackChromeVisibility'](),
          this['_syncRendererPlaybackPin'](),
          this['_applyPendingPlaybackSourceAtBoundary']());
      }),
      this['_video']['addEventListener']('ended', () => {
        this['_applyPendingPlaybackSourceAtBoundary']();
      }));
    const run2 = () => {
      const value19 = this['_rendererMediaSlotToken'];
      this['_armFirstVideoFramePresentation'](this['_currentSrc'], value19);
    };
    for (const value20 of ['loadeddata', 'playing', 'timeupdate', 'seeked']) {
      this['_video']['addEventListener'](value20, () => {
        (run2(),
          this['_syncPosterFrameVisibility'](),
          this['_releaseFastPreviewForPlaybackIfReady'](),
          this['_syncRendererPlaybackPin']());
      });
    }
    this['_video']['addEventListener']('timeupdate', () => this['_syncVideoProgressUi']());
    const el7 = this['_video'];
    (el7['addEventListener']('loadedmetadata', () => {
      (this['_applyPendingPlaybackResume'](el7), this['_syncLoadedVideoMetadata'](el7));
    }),
      el7['addEventListener']('canplay', () => {
        this['_applyPendingPlaybackResume'](el7);
      }));
  }
  ['mount']() {
    const el8 = this['el'];
    (setStaticInnerHTML(el8, _SOURCE_VIDEO_NODE_TEMPLATE_ID),
      (this['_card'] = el8['querySelector']('.node-card')),
      (this['_video'] = null),
      (this['_posterFrame'] = el8['querySelector']('.source-video-poster-frame')));
    this['_posterFrame'] &&
      ((this['_posterFrame']['decoding'] = 'async'),
      (this['_posterFrame']['loading'] = 'lazy'),
      'fetchPriority' in this['_posterFrame'] && (this['_posterFrame']['fetchPriority'] = 'auto'));
    if (!this['_rendererRuntimePrebuiltOffscreen']) this['_applyVideoPoster'](this['_data']);
    (this['_attachPlaybackRecovery'](),
      (this['_hint'] = el8['querySelector']('.node-upload-hint')),
      (this['_uploadBtn'] = el8['querySelector']('.upload-btn')),
      (this['_controls'] = el8['querySelector']('.video-controls')),
      (this['_playBtn'] = el8['querySelector']('.video-play-btn')),
      (this['_muteBtn'] = el8['querySelector']('.video-mute-btn')),
      (this['_iconUnmuted'] = el8['querySelector']('.icon-unmuted')),
      (this['_iconMuted'] = el8['querySelector']('.icon-muted')),
      this['_syncMutedStateFromData'](this['_data']),
      (this['_fill'] = el8['querySelector']('.media-progress-fill')),
      (this['_bar'] = el8['querySelector']('.media-progress-bar')),
      (this['_timeCurrent'] = el8['querySelector']('.video-time-current')),
      (this['_timeTotal'] = el8['querySelector']('.video-time-total')),
      (this['_snapBtn'] = el8['querySelector']('.video-snap-btn')),
      (this['_centerIndicator'] = el8['querySelector']('.video-center-indicator')),
      (this['_indicatorInner'] = el8['querySelector']('.indicator-inner')),
      (this['_centerIndicatorTimer'] = null),
      (this['_resizer'] = el8['querySelector']('.node-resizer')),
      this['_syncPlaybackChromeVisibility']({ forceHidden: !![] }),
      this['_syncLocaleTexts']());
    this['_rendererDetailsDeferred'] !== !![] &&
      (this['_unsubscribeLocale'] = onLocaleChange(() => this['_syncLocaleTexts']()));
    if (this['_data']?.['isGenerating'] && !this['_resolveVideoSrc'](this['_data'])) {
      startLoading(this['_card'], { variant: 'full' });
      if (this['_hint']) this['_hint']['style']['display'] = 'none';
      if (this['_uploadBtn']) this['_uploadBtn']['disabled'] = !![];
    }
    this['_rendererMediaDeferred'] === !![] || this['_rendererDetailsDeferred'] === !![]
      ? this['_armDeferredVideoInteractionBinding']()
      : this['_bindVideoInteractionHandlers']();
    const value21 =
        this['_rendererMediaDeferred'] === !![]
          ? this['_data']
          : this['_promotePendingProxyAtMediaSegmentBoundary'](this['_data']),
      value22 = this['_resolveVideoSrc'](value21);
    if (this['_rendererMediaDeferred'] === !![])
      ((this['_currentSrc'] = value22 || ''),
        this['_syncPosterFrameVisibility']({ force: !!this['_lastPosterSrc'] }));
    else {
      this['_requestVisibleProxyMigration']();
      if (value22) this['_loadVideo'](value22);
      else this['_loadVideo']('');
    }
    return (
      this['_rendererDetailsDeferred'] !== !![] && this['_clearResolvedVideoTimer'](this['_data'], value22),
      this['_rendererMediaDeferred'] !== !![] &&
        this['_rendererDetailsDeferred'] !== !![] &&
        this['_maybeFetchVideoMeta'](this['_data']),
      this['_rendererDetailsDeferred'] !== !![] &&
        (this['_syncRunningHubVideoTaskState'](this['_data']),
        this['_maybeResumeRunningHubTask'](),
        this['_maybeResumeAsyncTask']()),
      this['_syncGenerationFailureUi'](appStore['getStateRaw']()['nodes']?.[this['id']] || this['_data']),
      (this['_toolbarEl'] = el8['querySelector']('.node-floating-toolbar')),
      this['_rendererMediaDeferred'] === !![] || this['_rendererDetailsDeferred'] === !![]
        ? this['_armDeferredVideoToolbarBinding']()
        : this['_ensureVideoToolbarBound'](),
      el8
    );
  }
  ['_syncGenerationFailureUi'](value23 = this['_data']) {
    const sourceVideoGenerationFailureMessage = resolveSourceVideoGenerationFailureMessage(value23);
    if (!sourceVideoGenerationFailureMessage)
      return (
        this['_generationErrorOverlay']?.['remove']?.(),
        (this['_generationErrorOverlay'] = null),
        (this['_generationErrorMessage'] = ''),
        ![]
      );
    if (
      !this['_card'] ||
      typeof this['_card']['appendChild'] !== 'function' ||
      typeof globalThis['document']?.['createElement'] !== 'function'
    )
      return ![];
    stopLoading(this['_card']);
    let value24 = ![];
    !this['_generationErrorOverlay'] &&
      ((this['_generationErrorOverlay'] = document['createElement']('div')),
      (this['_generationErrorOverlay']['className'] =
        'dreamina-status-overlay source-video-generation-error-overlay'),
      this['_card']?.['appendChild']?.(this['_generationErrorOverlay']),
      (value24 = !![]));
    (value24 || this['_generationErrorMessage'] !== sourceVideoGenerationFailureMessage) &&
      ((this['_generationErrorOverlay']['innerHTML'] = ''),
      this['_generationErrorOverlay']['appendChild'](createVideoGenerationErrorCard(sourceVideoGenerationFailureMessage)),
      (this['_generationErrorMessage'] = sourceVideoGenerationFailureMessage));
    this['_setPosterFrameVisible'](![]);
    if (this['_hint']) this['_hint']['style']['display'] = 'none';
    this['_syncPlaybackChromeVisibility']({ forceHidden: !![] });
    if (this['_uploadBtn']) this['_uploadBtn']['disabled'] = ![];
    return !![];
  }
  ['hydrateDeferredDetails']() {
    if (this['_rendererDetailsDeferred'] !== !![]) return ![];
    ((this['_rendererDetailsDeferred'] = ![]), this['_syncLocaleTexts']());
    !this['_unsubscribeLocale'] &&
      (this['_unsubscribeLocale'] = onLocaleChange(() => this['_syncLocaleTexts']()));
    (this['_bindVideoInteractionHandlers'](), this['_ensureVideoToolbarBound']());
    const value25 = appStore['getStateRaw']()['nodes']?.[this['id']] || this['_data'];
    this['_data'] = value25;
    const value26 = this['_resolveVideoSrc'](value25);
    return (
      this['_clearResolvedVideoTimer'](value25, value26),
      this['_maybeFetchVideoMeta'](value25),
      this['_syncRunningHubVideoTaskState'](value25),
      this['_maybeResumeRunningHubTask'](),
      this['_maybeResumeAsyncTask'](),
      !![]
    );
  }
  ['_waitForUploadPaint']() {
    return waitForNextPaint();
  }
  ['_syncLocaleTexts']() {
    if (this['_muteBtn']) {
      const sourceVideoText2 = sourceVideoText('controls.toggleMute');
      ((this['_muteBtn']['dataset']['tooltip'] = sourceVideoText2),
        this['_muteBtn']['setAttribute']?.('aria-label', sourceVideoText2));
    }
    if (this['_snapBtn']) {
      const sourceVideoText3 = sourceVideoText('controls.captureFrame');
      ((this['_snapBtn']['dataset']['tooltip'] = sourceVideoText3),
        this['_snapBtn']['setAttribute']?.('aria-label', sourceVideoText3));
    }
    this['_updatePlayIcon'](this['_video']?.['paused'] !== ![]);
    if (this['_uploadBtn'] && !this['_isUploading']) {
      const el9 = this['_uploadBtn']['querySelector']?.('.source-upload-label');
      el9
        ? (el9['textContent'] = sourceVideoText('upload.button'))
        : (this['_uploadBtn']['textContent'] = sourceVideoText('upload.button'));
    }
  }
  ['_syncMuteButtonIcon']() {
    if (!this['_iconMuted'] || !this['_iconUnmuted']) return;
    ((this['_iconMuted']['style']['display'] = this['_isMuted'] ? 'block' : 'none'),
      (this['_iconUnmuted']['style']['display'] = this['_isMuted'] ? 'none' : 'block'));
  }
  ['_applyMutedState']() {
    if (this['_video']) this['_video']['muted'] = !!this['_isMuted'];
    this['_syncMuteButtonIcon']();
  }
  ['_syncMutedStateFromData'](value27 = this['_data']) {
    ((this['_isMuted'] = resolveVideoMutedPreference(value27, {
      videoAudioDefaultEnabled: readVideoAudioDefaultEnabledFromStore(appStore),
    })),
      this['_applyMutedState']());
  }
  ['_setMuted'](enabled9, { persist: persist = ![] } = {}) {
    ((this['_isMuted'] = !!enabled9), this['_applyMutedState']());
    if (!persist) return;
    const args2 = appStore['getState']()['nodes']?.[this['id']] || this['_data'] || {},
      args3 = buildVideoMutedPatch(args2, this['_isMuted']);
    if (!args3) return;
    (appStore['updateNodeData'](this['id'], args3), (this['_data'] = { ...args2, ...args3 }));
  }
  ['_readUploadVideoNaturalSize'](value28) {
    return readVideoFileNaturalSize(value28);
  }
  ['_uploadSourceVideoFile'](value29, value30) {
    return uploadFile(value29, value30);
  }
  async ['_handleUploadInputFile'](file) {
    if (Number(file?.['size'] || 0) > CANVAS_VIDEO_IMPORT_MAX_BYTES) {
      window['showToast']?.(
        t('fileService.errors.videoTooLarge', {
          file: file?.['name'] || t('fileService.defaultNames.video'),
          maxMB: CANVAS_VIDEO_IMPORT_MAX_MB,
        }),
        'error',
      );
      if (this['_input']) this['_input']['value'] = '';
      return ![];
    }
    ((this['_isUploading'] = !![]), startLoading(this['_card'], { variant: 'static' }));
    const el10 = this['_ensureVideoElement']();
    if (el10) el10['style']['display'] = 'none';
    this['_syncPlaybackChromeVisibility']({ forceHidden: !![] });
    const list = Array['from'](this['_uploadBtn']['childNodes'])['map']((value31) =>
      value31['cloneNode'](!![]),
    );
    ((this['_uploadBtn']['textContent'] = sourceVideoText('upload.uploading')),
      (this['_uploadBtn']['style']['pointerEvents'] = 'none'));
    const value32 = this['_currentSrc'],
      capturePreviewUrl = createVideoCapturePreviewUrl(file);
    capturePreviewUrl &&
      ((this['_data'] = { ...this['_data'], capturePreviewUrl: capturePreviewUrl }), this['_loadVideo'](capturePreviewUrl));
    try {
      const value33 = window['currentProjectId'] || 'default_v2_project';
      await this['_waitForUploadPaint']();
      const promise = Promise['resolve']()
        ['then'](() => this['_readUploadVideoNaturalSize'](file))
        ['catch'](() => null);
      void promise['then']((value34) => {
        const args4 = buildSourceVideoUploadSizePatch(value34);
        if (args4['needsAutoResize'] !== ![]) return;
        const args5 = appStore['getState']()['nodes']?.[this['id']];
        if (!args5) return;
        (appStore['updateNodeData'](this['id'], args4), (this['_data'] = { ...args5, ...args4 }));
      });
      const width2 = await this['_uploadSourceVideoFile'](file, value33),
        value35 = await promise,
        name = file['name']['replace'](/\.[^/.]+$/, ''),
        value36 = width2['url'],
        localPath = pickResultLocalPath(width2) || urlToLocalPath(value36),
        videoProxyStatus = String(width2['videoProxyStatus'] || '')['trim'](),
        capturePreviewUrl2 = videoProxyStatus === 'processing' && !!capturePreviewUrl,
        src =
          videoProxyStatus === 'processing'
            ? ''
            : String(width2['displayUrl'] || '')['trim']() ||
              String(width2['displayLocalPath'] ? '/' + width2['displayLocalPath'] : '')['trim']() ||
              value36,
        args6 = buildSourceVideoUploadSizePatch(
          {
            width: width2['videoWidth'] || width2['width'],
            height: width2['videoHeight'] || width2['height'],
          },
          value35,
        );
      appStore['updateNodeData'](this['id'], {
        name: name,
        src: src,
        localPath: localPath,
        assetId: width2['assetId'] || '',
        assetRevision: Number(width2['assetRevision'] || 0) || 0,
        assetUpdatedAt: width2['assetUpdatedAt'] || width2['updatedAt'] || '',
        originalLocalPath: width2['originalLocalPath'] || width2['localPath'] || '',
        displayLocalPath: width2['displayLocalPath'] || '',
        posterLocalPath: width2['posterLocalPath'] || '',
        thumbLocalPath: width2['posterLocalPath'] || width2['thumbLocalPath'] || '',
        thumbUrl: width2['posterUrl'] || width2['thumbUrl'] || '',
        derivativeStatus: width2['derivativeStatus'] || width2['status'] || '',
        mediaTaskId: width2['mediaTaskId'] || '',
        mediaTaskKind: width2['mediaTaskKind'] || '',
        mediaTaskStatus: width2['mediaTaskStatus'] || '',
        mediaTaskProgress: Number(width2['mediaTaskProgress'] || 0) || 0,
        mediaTaskError: width2['mediaTaskError'] || '',
        videoProxyStatus: videoProxyStatus,
        videoProxyVersion: width2['videoProxyVersion'] || '',
        videoCodec: width2['videoCodec'] || '',
        videoDuration: Number(width2['videoDuration'] || value35?.['duration'] || 0) || 0,
        videoFps: Number(width2['videoFps'] || 0) || 0,
        fileSize: Number(width2['size'] || file?.['size'] || 0) || 0,
        fileName: width2['filename'] || file['name'],
        stagedUploadId: width2['stagedUploadId'] || '',
        canonicalImportPending: width2['canonicalImportPending'] === !![],
        canonicalImportStatus: width2['canonicalImportStatus'] || '',
        canonicalImportError: width2['canonicalImportError'] || '',
        capturePreviewUrl: capturePreviewUrl2 ? capturePreviewUrl : '',
        ...args6,
      });
    } catch (value37) {
      (console['error']('视频上传失败:', value37),
        window['showToast'](sourceVideoText('upload.failedRetry')),
        stopLoading(this['_card']));
      if (capturePreviewUrl && this['_currentSrc'] === capturePreviewUrl) {
        this['_releaseActiveCapturePreviewUrl']();
        if (value32) this['_loadVideo'](value32);
        else ((this['_currentSrc'] = ''), this['_loadVideo'](''));
      }
      if (this['_currentSrc']) {
        const el11 = this['_ensureVideoElement']();
        if (el11) el11['style']['display'] = 'block';
        this['_syncPlaybackChromeVisibility']();
      }
    } finally {
      ((this['_isUploading'] = ![]),
        this['_uploadBtn']['replaceChildren'](
          ...list['map']((value38) => value38['cloneNode'](!![])),
        ),
        this['_syncLocaleTexts'](),
        (this['_uploadBtn']['style']['pointerEvents'] = 'auto'));
      if (this['_input']) this['_input']['value'] = '';
    }
  }
  ['_applyVideoPoster'](value39 = this['_data'], value40 = {}) {
    const sourceVideoPosterSrc = resolveSourceVideoPosterSrc(value39),
      value41 =
        !!sourceVideoPosterSrc &&
        (value40?.['restoreNativePoster'] === !![] ||
          !hasPresentedVideoFrame(this['_video'], this['_currentSrc']));
    if (sourceVideoPosterSrc)
      (this['_video'] &&
        value41 &&
        this['_video']['poster'] !== sourceVideoPosterSrc &&
        (this['_video']['poster'] = sourceVideoPosterSrc),
        (this['_lastPosterSrc'] = sourceVideoPosterSrc),
        this['_applyPosterFrameSource'](sourceVideoPosterSrc));
    else {
      if (this['_video']?.['poster']) {
        this['_video']['removeAttribute']?.('poster');
        if (this['_posterFrame']) this['_posterFrame']['removeAttribute']?.('src');
        this['_lastPosterSrc'] = '';
      } else {
        if (this['_posterFrame']) this['_posterFrame']['removeAttribute']?.('src');
        this['_lastPosterSrc'] = '';
      }
    }
    return (
      value41 ? this['_syncPosterFrameVisibility']({ force: !![] }) : this['_syncPosterFrameVisibility'](),
      sourceVideoPosterSrc
    );
  }
  ['_getPosterFrameSrc']() {
    if (!this['_posterFrame']) return '';
    return String(this['_posterFrame']['getAttribute']?.('src') || this['_posterFrame']['src'] || '')[
      'trim'
    ]();
  }
  ['_setPosterFrameSrc'](value42) {
    if (!this['_posterFrame']) return;
    typeof this['_posterFrame']['setAttribute'] === 'function'
      ? this['_posterFrame']['setAttribute']('src', value42)
      : (this['_posterFrame']['src'] = value42);
  }
  ['_applyPosterFrameSource'](enabled10) {
    if (!this['_posterFrame'] || !enabled10) return;
    const enabled11 = this['_getPosterFrameSrc']();
    if (enabled11 === enabled10) return;
    const run3 = ({ requireConnected: requireConnected = ![] } = {}) => {
      if (
        !this['_posterFrame'] ||
        (requireConnected && this['_posterFrame']['isConnected'] === ![]) ||
        this['_lastPosterSrc'] !== enabled10
      )
        return;
      (this['_setPosterFrameSrc'](enabled10), this['_syncPosterFrameVisibility']());
    };
    if (!enabled11 || enabled10['startsWith']('data:') || typeof Image !== 'function') {
      run3();
      return;
    }
    if (isCanvasImagePreloadRecentlyResolved(enabled10)) {
      run3();
      return;
    }
    const value43 = (this['_posterFramePreloadToken'] || 0) + 1;
    ((this['_posterFramePreloadToken'] = value43),
      preloadCanvasImage(enabled10, {
        priority: SOURCE_VIDEO_POSTER_PRELOAD_PRIORITY,
        fetchPriority: 'auto',
        deferWhenPaused: !![],
      })['then'](
        () => {
          if (this['_posterFramePreloadToken'] === value43) run3({ requireConnected: !![] });
        },
        () => {},
      ));
  }
  ['_setPosterFrameVisible'](enabled12) {
    if (!this['_posterFrame']) return;
    this['_posterFrame']['classList']?.['toggle']('is-visible', !!enabled12);
  }
  ['_shouldPinRendererForPlayback']() {
    return !!(
      this['_isHovered'] ||
      this['_isManualControl'] ||
      this['_isManualLoopPlayback'] ||
      this['_isSeeking'] ||
      this['_video']?.['paused'] === ![]
    );
  }
  ['_setRendererPlaybackPin'](value44) {
    const value45 = value44 === !![];
    if (this['_rendererPlaybackPinned'] === value45) return;
    this['_rendererPlaybackPinned'] = value45;
    const value46 = globalThis['window']?.['v2Renderer'];
    value45
      ? value46?.['pinNode']?.(this['id'], SOURCE_VIDEO_RENDER_PIN_REASON)
      : value46?.['unpinNode']?.(this['id'], SOURCE_VIDEO_RENDER_PIN_REASON);
  }
  ['_syncRendererPlaybackPin']() {
    this['_setRendererPlaybackPin'](this['_shouldPinRendererForPlayback']());
  }
  ['_prepareRendererMediaSlotSource'](value47, rebind = {}) {
    const sourceKey = String(value47 || '')['trim'](),
      sourceEpoch = globalThis['window']?.['v2Renderer']?.['prepareMediaSlotSource']?.(this['id'], sourceKey, {
        slotIndex: 0,
        rebind: rebind?.['rebind'] === !![],
      });
    if (
      !sourceEpoch ||
      String(sourceEpoch['sourceKey'] || '')['trim']() !== sourceKey ||
      !Number['isInteger'](sourceEpoch['sourceEpoch'])
    )
      return ((this['_rendererMediaSlotToken'] = null), null);
    const value48 = Object['freeze']({ sourceKey: sourceKey, sourceEpoch: sourceEpoch['sourceEpoch'] });
    return ((this['_rendererMediaSlotToken'] = value48), value48);
  }
  ['_armFirstVideoFramePresentation'](
    value49 = this['_currentSrc'],
    mediaSlotToken = this['_rendererMediaSlotToken'],
  ) {
    const sourceKey2 = String(value49 || '')['trim'](),
      el12 = this['_video'];
    if (!el12 || !sourceKey2) return ![];
    if (
      this['_isCurrentRendererMediaSlotToken'](sourceKey2, mediaSlotToken) &&
      hasReportedSourceVideoMediaSlotFrame(this, { sourceKey: sourceKey2, mediaSlotToken: mediaSlotToken }) &&
      hasPresentedVideoFrame(el12, sourceKey2)
    )
      return !![];
    if (!el12['style']) el12['style'] = {};
    return (
      (el12['style']['display'] = 'block'),
      (el12['style']['opacity'] = '1'),
      (el12['style']['visibility'] = 'visible'),
      watchVideoFramePresentation(el12, () =>
        scheduleSourceVideoFramePresentationCommit(this, sourceKey2, mediaSlotToken),
      )
    );
  }
  ['_isCurrentRendererMediaSlotToken'](value50, enabled13) {
    if (!enabled13) return !![];
    const value51 = this['_rendererMediaSlotToken'];
    return !!(
      value51 &&
      value51['sourceKey'] === String(value50 || '')['trim']() &&
      value51['sourceEpoch'] === enabled13['sourceEpoch'] &&
      value51['sourceKey'] === enabled13['sourceKey']
    );
  }
  ['_removeNativePosterForPresentedSource'](
    value52 = this['_currentSrc'],
    value53 = this['_rendererMediaSlotToken'],
    value54 = null,
  ) {
    const enabled14 = String(value52 || '')['trim'](),
      enabled15 = this['_video'];
    if (
      !enabled15 ||
      !enabled15['poster'] ||
      !enabled14 ||
      this['_currentSrc'] !== enabled14 ||
      !this['_isCurrentRendererMediaSlotToken'](enabled14, value53)
    )
      return ![];
    const value55 = value54 || this['_getRendererVideoPresentationFacts']();
    if (
      value55['domConnected'] !== !![] ||
      value55['readyState'] < 2 ||
      value55['videoWidth'] <= 0 ||
      value55['videoHeight'] <= 0 ||
      value55['error'] ||
      value55['rvfcObserved'] !== !![] ||
      value55['cssDisplayVisible'] !== !![] ||
      value55['cssVisibilityVisible'] !== !![] ||
      value55['cssOpacityVisible'] !== !![] ||
      value55['overlayClear'] !== !![]
    )
      return ![];
    return (enabled15['removeAttribute']?.('poster'), !enabled15['poster']);
  }
  ['_restorePausedFirstFrameNudge'](value56 = this['_currentSrc']) {
    const enabled16 = this['_pausedFirstFrameNudge'];
    if (!enabled16 || enabled16['sourceKey'] !== String(value56 || '')['trim']()) return ![];
    this['_pausedFirstFrameNudge'] = null;
    if (enabled16['timer']) clearTimeout(enabled16['timer']);
    const enabled17 = this['_video'];
    if (
      !enabled17 ||
      this['_currentSrc'] !== enabled16['sourceKey'] ||
      enabled17['paused'] !== !![] ||
      Math['abs'](Number(enabled17['currentTime'] || 0) - enabled16['nudgedTime']) > 0.0005
    )
      return ![];
    try {
      return ((enabled17['currentTime'] = enabled16['originalTime']), !![]);
    } catch {
      return ![];
    }
  }
  ['_nudgePausedVideoForFirstFrame'](value57 = this['_currentSrc']) {
    const sourceKey3 = String(value57 || '')['trim'](),
      enabled18 = this['_video'];
    if (
      !enabled18 ||
      !sourceKey3 ||
      this['_currentSrc'] !== sourceKey3 ||
      enabled18['paused'] !== !![] ||
      Number(enabled18['readyState'] || 0) < 2 ||
      Number(enabled18['videoWidth'] || 0) <= 0 ||
      Number(enabled18['videoHeight'] || 0) <= 0 ||
      hasPresentedVideoFrame(enabled18, sourceKey3) ||
      this['_pausedFirstFrameNudge']?.['sourceKey'] === sourceKey3
    )
      return ![];
    const originalTime = Number(enabled18['currentTime'] || 0),
      value58 = Number(enabled18['duration'] || 0),
      value59 = 0.001,
      nudgedTime =
        Number['isFinite'](value58) && value58 > value59 && originalTime + value59 >= value58
          ? Math['max'](0, originalTime - value59)
          : originalTime + value59;
    if (nudgedTime === originalTime) return ![];
    const value60 = { sourceKey: sourceKey3, originalTime: originalTime, nudgedTime: nudgedTime, timer: null };
    ((this['_pausedFirstFrameNudge'] = value60),
      (value60['timer'] = setTimeout(() => {
        this['_restorePausedFirstFrameNudge'](sourceKey3);
      }, 250)));
    try {
      return ((enabled18['currentTime'] = nudgedTime), !![]);
    } catch {
      return (this['_restorePausedFirstFrameNudge'](sourceKey3), ![]);
    }
  }
  ['_releaseFastPreviewForPlaybackIfReady'](mediaSlotToken2 = this['_rendererMediaSlotToken'], presentationFacts = null) {
    const sourceKey4 = String(this['_currentSrc'] || '')['trim']();
    if (
      !sourceKey4 ||
      mediaSlotToken2?.['sourceKey'] !== sourceKey4 ||
      !Number['isInteger'](mediaSlotToken2?.['sourceEpoch']) ||
      !this['_isVideoFrameReadyToShow']()
    )
      return ![];
    return reportSourceVideoMediaSlotFrameOnce(this, {
      sourceKey: sourceKey4,
      mediaSlotToken: mediaSlotToken2,
      presentationFacts: presentationFacts,
    });
  }
  ['_isVideoFrameReadyToShow']() {
    return hasPresentedVideoFrame(this['_video'], this['_currentSrc']);
  }
  ['getRendererMediaState']() {
    return {
      deferred: this['_rendererMediaDeferred'] === !![],
      interactionActive: !!(
        this['_isHovered'] ||
        this['_isManualControl'] ||
        this['_isManualLoopPlayback'] ||
        this['_isSeeking']
      ),
    };
  }
  ['hasPresentedRendererMedia']() {
    return !!(this['_video'] && getVideoCurrentSource(this['_video']) && this['_isVideoFrameReadyToShow']());
  }
  ['_getRendererVideoPresentationFacts']() {
    const domConnected = this['_video'],
      handler3 = (el13) => {
        if (!el13 || el13['isConnected'] === ![]) return ![];
        let el14 = el13;
        while (el14 && el14 !== globalThis['document']) {
          const value61 =
            typeof globalThis['getComputedStyle'] === 'function'
              ? globalThis['getComputedStyle'](el14)
              : el14['style'] || {};
          if (
            value61?.['display'] === 'none' ||
            value61?.['visibility'] === 'hidden' ||
            Number['parseFloat'](value61?.['opacity'] ?? '1') === 0
          )
            return ![];
          el14 = el14['parentElement'] || el14['parentNode'];
        }
        return !![];
      },
      enabled19 = this['_posterFrame']?.['classList']?.['contains']?.('is-visible') === !![],
      enabled20 = !!(
        this['_card']?.['classList']?.['contains']?.('img-preview-loading') ||
        this['_card']?.['querySelector']?.('.img-loading-overlay')
      ),
      cssDisplayVisible = domConnected?.['style'] || {},
      value62 = handler3(domConnected);
    return {
      domConnected: domConnected?.['isConnected'] === !![],
      readyState: Number(domConnected?.['readyState'] || 0),
      videoWidth: Number(domConnected?.['videoWidth'] || 0),
      videoHeight: Number(domConnected?.['videoHeight'] || 0),
      error: domConnected?.['error'] || null,
      rvfcObserved: hasPresentedVideoFrame(domConnected, this['_currentSrc']),
      cssDisplayVisible: cssDisplayVisible['display'] !== 'none' && value62,
      cssVisibilityVisible: cssDisplayVisible['visibility'] !== 'hidden' && value62,
      cssOpacityVisible: Number['parseFloat'](cssDisplayVisible['opacity'] || '1') > 0 && value62,
      overlayClear: !enabled19 && !enabled20,
    };
  }
  ['_isPosterFrameReadyToShow']() {
    if (!this['_posterFrame'] || !this['_getPosterFrameSrc']()) return ![];
    if (typeof this['_posterFrame']['complete'] !== 'boolean') return !![];
    return (
      this['_posterFrame']['complete'] === !![] && Number(this['_posterFrame']['naturalWidth'] || 0) > 0
    );
  }
  ['_syncVideoElementFrameVisibility']({ forceHidden: forceHidden = ![] } = {}) {
    if (!this['_video']) return;
    if (!this['_video']['style']) this['_video']['style'] = {};
    const enabled21 = !!getVideoCurrentSource(this['_video']);
    if (!enabled21) {
      ((this['_video']['style']['display'] = 'none'),
        (this['_video']['style']['opacity'] = ''),
        (this['_video']['style']['visibility'] = ''));
      return;
    }
    this['_video']['style']['display'] = 'block';
    if (!String(this['_lastPosterSrc'] || '')['trim']()) {
      ((this['_video']['style']['opacity'] = '1'), (this['_video']['style']['visibility'] = 'visible'));
      return;
    }
    const enabled22 = this['_getPosterFrameSrc'](),
      value63 =
        Number(this['_video']['readyState'] || 0) >= 2 &&
        !!enabled22 &&
        typeof this['_posterFrame']?.['complete'] === 'boolean' &&
        !this['_isPosterFrameReadyToShow'](),
      value64 = value63 || (!forceHidden && this['_isVideoFrameReadyToShow']());
    ((this['_video']['style']['opacity'] = value64 ? '1' : '0'),
      (this['_video']['style']['visibility'] = value64 ? 'visible' : 'hidden'));
  }
  ['_syncPosterFrameVisibility'](enabled23 = {}) {
    this['_syncVideoElementFrameVisibility']();
    if (!this['_posterFrame']) return;
    const enabled24 = String(this['_lastPosterSrc'] || '')['trim']();
    if (!enabled24) {
      this['_setPosterFrameVisible'](![]);
      return;
    }
    if (Object['prototype']['hasOwnProperty']['call'](enabled23, 'force')) {
      this['_setPosterFrameVisible'](!!enabled23['force']);
      enabled23['force'] === !![] && this['_syncVideoElementFrameVisibility']({ forceHidden: !![] });
      return;
    }
    if (this['_isVideoFrameReadyToShow']()) {
      this['_setPosterFrameVisible'](![]);
      return;
    }
    this['_setPosterFrameVisible'](!![]);
  }
  ['_clearVideoElementSource']({
    load: load = !![],
    invalidateRendererSlot: invalidateRendererSlot = !![],
  } = {}) {
    if (!this['_video']) return;
    if (invalidateRendererSlot) {
      const value65 = String(this['_rendererMediaSlotToken']?.['sourceKey'] || this['_currentSrc'] || '')[
        'trim'
      ]();
      (this['_prepareRendererMediaSlotSource'](value65, { rebind: !![] }),
        (this['_rendererMediaSlotToken'] = null));
    }
    this['_cancelProgressLoop']();
    const value66 = this['_pausedFirstFrameNudge'];
    this['_pausedFirstFrameNudge'] = null;
    if (value66?.['timer']) clearTimeout(value66['timer']);
    (resetVideoFramePresentation(this['_video']),
      clearDesktopMediaPlaybackSourceMetadata(this['_video']),
      this['_video']['removeAttribute']?.('src'),
      this['_releasePlaybackObjectUrl']());
    if (load !== ![])
      try {
        this['_video']['load']?.();
      } catch {}
  }
  ['_releasePlaybackObjectUrl']() {
    (this['_playbackBlobFetchController']?.['abort']?.(), (this['_playbackBlobFetchController'] = null));
    const value67 = String(this['_objUrl'] || '')['trim'](),
      releaseLocalVideoPlaybackObjectUrlOwner2 = releaseLocalVideoPlaybackObjectUrlOwner('source-video:' + this['id'] + ':playback');
    ((this['_objUrl'] = null),
      (this['_objUrlSource'] = ''),
      value67 && !releaseLocalVideoPlaybackObjectUrlOwner2 && revokeTrackedMediaObjectUrl(value67));
  }
  async ['_resolveLocalPlaybackObjectUrl'](value68, { resultMode: resultMode = 'legacy' } = {}) {
    const value69 = resultMode === 'typed',
      handler4 = (status, playbackUrl = '', value70 = 0) =>
        value69
          ? { status: status, playbackUrl: playbackUrl, httpStatus: Number(value70 || 0) }
          : playbackUrl,
      enabled25 = String(value68 || '')['trim']();
    if (!enabled25) return handler4('empty-url');
    let uRL;
    try {
      uRL = new URL(
        enabled25,
        globalThis['location']?.['href'] || globalThis['window']?.['location']?.['href'],
      );
    } catch {
      return handler4('invalid-url');
    }
    const enabled26 = String(
      globalThis['location']?.['origin'] || globalThis['window']?.['location']?.['origin'] || '',
    );
    if (
      !enabled26 ||
      uRL['origin'] !== enabled26 ||
      !/^\/(?:output|data\/assets|data\/uploads)\//i['test'](uRL['pathname'])
    )
      return handler4('not-local');
    const sourceUrl = uRL['href'];
    if (this['_hardMissingPlaybackSource'] === sourceUrl)
      return handler4('hard-missing', '', this['_hardMissingPlaybackStatus'] || 404);
    if (this['_objUrl'] && this['_objUrlSource'] === sourceUrl) return handler4('ready', this['_objUrl']);
    const signal = typeof AbortController === 'function' ? new AbortController() : null;
    (this['_playbackBlobFetchController']?.['abort']?.(), (this['_playbackBlobFetchController'] = signal));
    try {
      const response = await acquireLocalVideoPlaybackObjectUrlResult(
        sourceUrl,
        'source-video:' + this['id'] + ':playback',
        {
          signal: signal?.['signal'],
          timeout: SOURCE_VIDEO_LOCAL_BLOB_FETCH_TIMEOUT_MS,
          maxBytes: SOURCE_VIDEO_LOCAL_BLOB_MAX_BYTES,
        },
      );
      if (response?.['status'] === 'hard-missing')
        return (
          (this['_hardMissingPlaybackSource'] = sourceUrl),
          (this['_hardMissingPlaybackStatus'] = Number(response['httpStatus'] || 0)),
          handler4('hard-missing', '', response['httpStatus'])
        );
      if (response?.['status'] === 'aborted') return handler4('aborted');
      const enabled27 = String(response?.['playbackUrl'] || '')['trim']();
      if (!enabled27 || this['_playbackBlobFetchController'] !== signal)
        return (
          globalThis['window']?.['__runtimeCompareMark']?.('source-video-playback:blob-discarded', {
            nodeId: this['id'],
            sourceUrl: sourceUrl,
            hasBlob: !!enabled27,
            controllerMatches: this['_playbackBlobFetchController'] === signal,
            status: String(response?.['status'] || 'failed'),
          }),
          handler4(
            this['_playbackBlobFetchController'] === signal
              ? String(response?.['status'] || 'failed')
              : 'aborted',
          )
        );
      return (
        this['_playbackBlobFetchController'] === signal && (this['_playbackBlobFetchController'] = null),
        (this['_objUrl'] = enabled27),
        (this['_objUrlSource'] = sourceUrl),
        handler4('ready', enabled27)
      );
    } catch (error) {
      return handler4(error?.['name'] === 'AbortError' ? 'aborted' : 'failed');
    } finally {
      this['_playbackBlobFetchController'] === signal && (this['_playbackBlobFetchController'] = null);
    }
  }
  ['_applyHardMissingPlaybackState'](value71, value72 = 0) {
    stopLoading(this['_card']);
    this['_video'] &&
      ((this['_video']['style']['opacity'] = '0'), (this['_video']['style']['visibility'] = 'hidden'));
    this['_setPosterFrameVisible'](!![]);
    const args7 =
        appStore['getStateRaw']?.()['nodes']?.[this['id']] ||
        appStore['getState']()['nodes']?.[this['id']] ||
        this['_data'] ||
        null,
      mediaUnavailableSource = getVideoSourceKey(args7),
      localPath2 = urlToLocalPath(value71),
      localPath3 = urlToLocalPath(mediaUnavailableSource),
      value73 =
        !!mediaUnavailableSource &&
        (mediaUnavailableSource === String(value71 || '')['trim']() || (!!localPath2 && localPath2 === localPath3));
    if (
      value73 &&
      (args7['mediaUnavailable'] !== !![] ||
        String(args7['mediaUnavailableSource'] || '')['trim']() !== mediaUnavailableSource)
    ) {
      const args8 = { mediaUnavailable: !![], mediaUnavailableSource: mediaUnavailableSource };
      (appStore['updateNodeData'](this['id'], args8), (this['_data'] = { ...args7, ...args8 }));
    }
    globalThis['window']?.['__runtimeCompareMark']?.('source-video-playback:hard-missing', {
      nodeId: this['id'],
      sourceUrl: String(value71 || ''),
      status: Number(value72 || 0),
    });
  }
  ['_isHardMissingPlaybackSource'](value74) {
    const enabled28 = String(this['_hardMissingPlaybackSource'] || '')['trim'](),
      enabled29 = String(value74 || '')['trim']();
    if (!enabled28 || !enabled29) return ![];
    if (enabled29 === enabled28) return !![];
    try {
      return (
        new URL(enabled29, globalThis['location']?.['href'] || globalThis['window']?.['location']?.['href'])[
          'href'
        ] === enabled28
      );
    } catch {
      return ![];
    }
  }
  ['_resolveVideoSrc'](value75) {
    return resolveCanvasVideoUrl(value75) || this['_getCapturePreviewUrl'](value75);
  }
  ['_shouldDeferActivePlaybackSourceChange'](value76) {
    const value77 = String(value76 || '')['trim'](),
      value78 = String(this['_currentSrc'] || '')['trim']();
    if (value77 === value78) return ![];
    const el15 = this['_video'];
    if (!el15 || el15['isConnected'] === ![] || el15['paused'] !== ![]) return ![];
    return !!(
      getVideoCurrentSource(el15) ||
      el15['dataset']?.['desktopMediaSourceUrl'] ||
      this['_objUrl']
    );
  }
  ['_setPendingPlaybackSource'](value79) {
    (this['_invalidatePendingPlaybackResume'](),
      (this['_pendingPlaybackSource'] = String(value79 || '')['trim']()),
      (this['_hasPendingPlaybackSource'] = !![]));
  }
  ['_clearPendingPlaybackSource']() {
    ((this['_pendingPlaybackSource'] = ''), (this['_hasPendingPlaybackSource'] = ![]));
  }
  ['_invalidatePendingPlaybackResume']() {
    ((this['_playbackResumeGeneration'] = Number(this['_playbackResumeGeneration'] || 0) + 1),
      (this['_pendingPlaybackResume'] = null));
  }
  ['_replacePendingPlaybackResume'](value80, value81) {
    this['_invalidatePendingPlaybackResume']();
    const source2 = String(value80 || '')['trim'](),
      time = Number(value81);
    if (!source2 || !Number['isFinite'](time) || time <= 0) return ![];
    return (
      (this['_pendingPlaybackResume'] = {
        generation: this['_playbackResumeGeneration'],
        source: source2,
        time: time,
      }),
      !![]
    );
  }
  ['_applyPendingPlaybackResume'](enabled30 = this['_video']) {
    const enabled31 = this['_pendingPlaybackResume'];
    if (!enabled31 || !enabled30 || enabled30 !== this['_video']) return ![];
    if (enabled31['generation'] !== this['_playbackResumeGeneration'])
      return ((this['_pendingPlaybackResume'] = null), ![]);
    const value82 = String(enabled31['source'] || '')['trim']();
    if (value82 !== String(this['_currentSrc'] || '')['trim']())
      return (this['_invalidatePendingPlaybackResume'](), ![]);
    if (Number(enabled30['readyState'] || 0) < 1 || !isMediaElementPlaybackSource(enabled30, value82))
      return ![];
    const count4 = Number(enabled30['duration']);
    if (!Number['isFinite'](count4) || count4 <= 0) return ![];
    const value83 = Number(enabled31['time']),
      value84 = Math['min'](Math['max'](0, value83), Math['max'](0, count4 - 0.05));
    try {
      enabled30['currentTime'] = value84;
    } catch {
      return ![];
    }
    return (
      this['_pendingPlaybackResume'] === enabled31 &&
        enabled31['generation'] === this['_playbackResumeGeneration'] &&
        (this['_pendingPlaybackResume'] = null),
      !![]
    );
  }
  ['_applyPendingPlaybackSourceAtBoundary']() {
    if (
      this['_hasPendingPlaybackSource'] !== !![] ||
      this['_rendererMediaDeferred'] === !![] ||
      this['_video']?.['paused'] === ![]
    )
      return ![];
    const value85 = appStore['getStateRaw']()['nodes']?.[this['id']] || this['_data'],
      value86 = String(this['_resolveVideoSrc'](value85) || '')['trim'](),
      value87 = Number(this['_video']?.['currentTime']),
      count5 = Number(this['_video']?.['duration']),
      enabled32 =
        this['_video']?.['ended'] === !![] ||
        (Number['isFinite'](value87) &&
          Number['isFinite'](count5) &&
          count5 > 0 &&
          value87 >= Math['max'](0, count5 - 0.05)),
      resumePlaybackTime2 = !enabled32 && this['_shouldKeepReadyCapturePreview'](value86) ? value87 : 0;
    this['_clearPendingPlaybackSource']();
    if (value86 === String(this['_currentSrc'] || '')['trim']()) return ![];
    return (
      (this['_data'] = value85),
      this['_loadVideo'](value86, {
        forceCapturePreviewPromotion: !![],
        ...(Number['isFinite'](resumePlaybackTime2) && resumePlaybackTime2 > 0 ? { resumePlaybackTime: resumePlaybackTime2 } : {}),
      }),
      this['_clearStoredCapturePreviewAfterSourcePromotion'](value86),
      !![]
    );
  }
  ['_promotePendingProxyAtMediaSegmentBoundary'](value88 = null) {
    const args9 = value88 || appStore['getStateRaw']()['nodes']?.[this['id']] || this['_data'] || null,
      args10 = buildCanvasVideoProxyPromotionPatch(args9);
    if (!args10) return args9;
    const value89 = !!(
      this['_video']?.['getAttribute']?.('src') ||
      this['_video']?.['dataset']?.['desktopMediaSourceUrl'] ||
      this['_objUrl'] ||
      this['_playbackBlobFetchController'] ||
      this['_playbackSourcePromise']
    );
    if (value89) return args9;
    appStore['updateNodeData'](this['id'], args10);
    const value90 = appStore['getStateRaw']()['nodes']?.[this['id']] || { ...args9, ...args10 };
    return ((this['_data'] = value90), value90);
  }
  ['_importLocalStagedAsset'](value91, value92) {
    return importLocalStagedAsset(value91, value92);
  }
  ['_discardLocalStagedAsset'](value93) {
    return discardLocalStagedAsset(value93);
  }
  ['_clearCanonicalAssetImportRetry']() {
    const value94 = this['_canonicalAssetImportRetryTimer'];
    this['_canonicalAssetImportRetryTimer'] = null;
    if (value94 == null) return;
    const value95 = globalThis['window']?.['clearTimeout'] || globalThis['clearTimeout'];
    try {
      value95?.(value94);
    } catch {}
  }
  ['_invalidateCanonicalAssetImportRetry']() {
    (this['_clearCanonicalAssetImportRetry'](),
      (this['_canonicalAssetImportRetryGeneration'] =
        Number(this['_canonicalAssetImportRetryGeneration'] || 0) + 1));
  }
  ['_scheduleCanonicalAssetImportRetry'](value96, value97 = SOURCE_VIDEO_CANONICAL_IMPORT_RETRY_MS) {
    const enabled33 = String(value96 || '')['trim']();
    if (!enabled33 || this['_canonicalAssetImportDisposed'] === !![]) return ![];
    this['_clearCanonicalAssetImportRetry']();
    const run4 = globalThis['window']?.['setTimeout'] || globalThis['setTimeout'];
    if (typeof run4 !== 'function') return ![];
    const value98 = Number(this['_canonicalAssetImportRetryGeneration'] || 0) + 1;
    this['_canonicalAssetImportRetryGeneration'] = value98;
    const value99 = run4(
      () => {
        this['_canonicalAssetImportRetryTimer'] === value99 &&
          (this['_canonicalAssetImportRetryTimer'] = null);
        if (
          this['_canonicalAssetImportDisposed'] === !![] ||
          Number(this['_canonicalAssetImportRetryGeneration'] || 0) !== value98
        )
          return;
        const enabled34 = appStore['getStateRaw']()['nodes']?.[this['id']];
        if (!enabled34 || enabled34['assetId'] || resolveSourceVideoMediaTaskSrc(enabled34) !== enabled33) return;
        void this['_requestCanonicalAssetImport'](enabled34);
      },
      Math['max'](0, Number(value97) || 0),
    );
    return ((this['_canonicalAssetImportRetryTimer'] = value99), !![]);
  }
  ['_requestCanonicalAssetImport'](name2 = this['_data']) {
    if (!desktopBridge['isChromeShell']) return null;
    if (!name2 || name2['assetId']) return (this['_invalidateCanonicalAssetImportRetry'](), null);
    const sourceVideoMediaTaskSrc = resolveSourceVideoMediaTaskSrc(name2);
    if (!sourceVideoMediaTaskSrc['startsWith']('data/uploads/'))
      return (this['_invalidateCanonicalAssetImportRetry'](), null);
    this['_canonicalAssetImportSource'] &&
      this['_canonicalAssetImportSource'] !== sourceVideoMediaTaskSrc &&
      this['_invalidateCanonicalAssetImportRetry']();
    if (this['_canonicalAssetImportSource'] === sourceVideoMediaTaskSrc && this['_canonicalAssetImportPromise'])
      return this['_canonicalAssetImportPromise'];
    const value100 = Date['now']() - Number(this['_canonicalAssetImportFailedAt'] || 0);
    if (
      this['_canonicalAssetImportSource'] === sourceVideoMediaTaskSrc &&
      value100 < SOURCE_VIDEO_CANONICAL_IMPORT_RETRY_MS
    )
      return (
        this['_canonicalAssetImportRetryTimer'] == null &&
          this['_scheduleCanonicalAssetImportRetry'](
            sourceVideoMediaTaskSrc,
            SOURCE_VIDEO_CANONICAL_IMPORT_RETRY_MS - Math['max'](0, value100),
          ),
        null
      );
    this['_canonicalAssetImportSource'] = sourceVideoMediaTaskSrc;
    const value101 = Promise['resolve']()
      ['then'](() =>
        this['_importLocalStagedAsset'](sourceVideoMediaTaskSrc, {
          name: name2['fileName'] || name2['name'],
          type: name2['mimeType'] || name2['fileType'] || '',
          projectId: globalThis['window']?.['currentProjectId'] || 'default_v2_project',
        }),
      )
      ['then']((assetId) => {
        if (!assetId?.['success'] || !assetId['assetId'])
          throw new Error('Canonical asset import returned no assetId');
        const args11 = appStore['getStateRaw']()['nodes']?.[this['id']];
        if (!args11 || args11['assetId']) return null;
        if (resolveSourceVideoMediaTaskSrc(args11) !== sourceVideoMediaTaskSrc) return null;
        const videoProxyStatus2 = String(assetId['videoProxyStatus'] || '')['trim'](),
          localPath4 = videoProxyStatus2 === 'processing' || videoProxyStatus2 === 'waiting',
          value102 = assetId['localPath'] || assetId['originalLocalPath'] || sourceVideoMediaTaskSrc,
          displayLocalPath = localPath4 ? sourceVideoMediaTaskSrc : assetId['displayLocalPath'] || '',
          src2 = localPath4
            ? args11['src'] || localPathToUrl(sourceVideoMediaTaskSrc)
            : assetId['displayUrl'] || assetId['url'] || localPathToUrl(displayLocalPath || value102),
          value103 = String(args11['stagedUploadId'] || '')['trim'](),
          args12 = {
            assetId: assetId['assetId'],
            assetRevision: Number(assetId['assetRevision'] || 0) || 0,
            assetUpdatedAt: assetId['assetUpdatedAt'] || assetId['updatedAt'] || '',
            src: src2,
            localPath: localPath4 ? args11['localPath'] || sourceVideoMediaTaskSrc : value102,
            originalLocalPath: assetId['originalLocalPath'] || value102,
            displayLocalPath: displayLocalPath,
            posterLocalPath: assetId['posterLocalPath'] || args11['posterLocalPath'] || '',
            thumbLocalPath:
              assetId['posterLocalPath'] ||
              assetId['thumbLocalPath'] ||
              args11['thumbLocalPath'] ||
              '',
            thumbUrl: assetId['posterUrl'] || assetId['thumbUrl'] || args11['thumbUrl'] || '',
            derivativeStatus:
              assetId['derivativeStatus'] || assetId['status'] || args11['derivativeStatus'] || '',
            mediaTaskId: assetId['mediaTaskId'] || '',
            mediaTaskKind: assetId['mediaTaskKind'] || '',
            mediaTaskStatus: assetId['mediaTaskStatus'] || '',
            mediaTaskProgress: Number(assetId['mediaTaskProgress'] || 0) || 0,
            mediaTaskError: assetId['mediaTaskError'] || '',
            videoProxyStatus: videoProxyStatus2,
            videoProxyVersion: assetId['videoProxyVersion'] || '',
            videoCodec: assetId['videoCodec'] || args11['videoCodec'] || '',
            videoDuration: Number(assetId['videoDuration'] || args11['videoDuration'] || 0) || 0,
            videoFps: Number(assetId['videoFps'] || args11['videoFps'] || 0) || 0,
            videoWidth: Number(assetId['videoWidth'] || args11['videoWidth'] || 0) || 0,
            videoHeight: Number(assetId['videoHeight'] || args11['videoHeight'] || 0) || 0,
            fileSize: Number(assetId['size'] || args11['fileSize'] || 0) || 0,
            fileName: assetId['filename'] || args11['fileName'] || name2['fileName'] || '',
            stagedUploadId: '',
            canonicalImportPending: ![],
            canonicalImportStatus: 'succeeded',
            canonicalImportError: '',
          };
        return (
          appStore['updateNodeData'](this['id'], args12),
          (this['_data'] = { ...args11, ...args12 }),
          (this['_canonicalAssetImportFailedAt'] = 0),
          this['_clearCanonicalAssetImportRetry'](),
          value103 &&
            void Promise['resolve']()
              ['then'](() => this['_discardLocalStagedAsset'](value103))
              ['catch'](() => {}),
          assetId
        );
      })
      ['catch']((error2) => {
        const args13 = appStore['getStateRaw']()['nodes']?.[this['id']];
        if (
          this['_canonicalAssetImportDisposed'] === !![] ||
          !args13 ||
          args13['assetId'] ||
          resolveSourceVideoMediaTaskSrc(args13) !== sourceVideoMediaTaskSrc
        )
          return null;
        this['_canonicalAssetImportFailedAt'] = Date['now']();
        const args14 = {
          canonicalImportPending: !![],
          canonicalImportStatus: 'failed',
          canonicalImportError: String(error2?.['message'] || error2 || ''),
        };
        return (
          appStore['updateNodeData'](this['id'], args14),
          (this['_data'] = { ...args13, ...args14 }),
          this['_scheduleCanonicalAssetImportRetry'](sourceVideoMediaTaskSrc, SOURCE_VIDEO_CANONICAL_IMPORT_RETRY_MS),
          console['warn']('[SourceVideoNode] canonical asset import failed:', error2),
          null
        );
      })
      ['finally'](() => {
        this['_canonicalAssetImportPromise'] === value101 && (this['_canonicalAssetImportPromise'] = null);
      });
    return ((this['_canonicalAssetImportPromise'] = value101), value101);
  }
  ['_requestVisibleProxyMigration']() {
    (void this['_requestCanonicalAssetImport'](),
      void requestVisibleVideoProxyMigration(this['id'])['catch']((value104) => {
        console['warn'](
          '[SourceVideoNode] failed to enqueue legacy proxy migration:',
          value104,
        );
      }));
  }
  ['_clearResolvedVideoTimer'](enabled35, enabled36) {
    if (!enabled36 || !enabled35 || typeof enabled35 !== 'object') return;
    const value105 =
      !!String(enabled35['rhTaskId'] || enabled35['asyncTaskId'] || enabled35['dreaminaSubmitId'] || '')[
        'trim'
      ]() ||
      enabled35['rhTaskRecovering'] === !![] ||
      enabled35['asyncTaskRecovering'] === !![] ||
      enabled35['dreaminaTaskRecovering'] === !![];
    if (value105) return;
    if (!enabled35['generationStartTime'] && enabled35['generationDuration'] == null) return;
    const enabled37 = appStore['getState']()['nodes']?.[this['id']];
    if (!enabled37) return;
    const value106 = {};
    if (enabled37['generationStartTime']) value106['generationStartTime'] = null;
    if (enabled37['generationDuration'] != null) value106['generationDuration'] = null;
    if (enabled37['isGenerating'] === !![]) value106['isGenerating'] = ![];
    Object['keys'](value106)['length'] > 0 && appStore['updateNodeData'](this['id'], value106);
  }
  ['_clearMediaUnavailableAfterPlayback'](value107) {
    const response2 = appStore['getState']()['nodes']?.[this['id']] || this['_data'] || null;
    if (!response2 || response2['mediaUnavailable'] !== !![]) return;
    const enabled38 = String(response2['mediaUnavailableSource'] || '')['trim']();
    if (!enabled38) return;
    const map = new Set(),
      value108 = (value109) => {
        const enabled39 = String(value109 || '')['trim']();
        if (!enabled39) return;
        map['add'](enabled39);
        const localPath5 = urlToLocalPath(enabled39);
        if (localPath5) map['add'](localPath5);
        const url = localPathToUrl(enabled39);
        if (url) map['add'](url);
      };
    [
      response2['localPath'],
      response2['displayLocalPath'],
      response2['originalLocalPath'],
      response2['videoLocalPath'],
      response2['videoUrl'],
      response2['src'],
      response2['url'],
      response2['resultUrl'],
      response2['sourceUrl'],
      value107,
    ]['forEach'](value108);
    if (!map['has'](enabled38)) return;
    appStore['updateNodeData'](this['id'], { mediaUnavailable: ![], mediaUnavailableSource: '' });
  }
  ['_getCapturePreviewUrl'](value110 = this['_data']) {
    const value111 = String(value110?.['capturePreviewUrl'] || '')['trim']();
    return value111['startsWith']('blob:') || value111['startsWith']('aic-local-preview:') ? value111 : '';
  }
  ['_revokeCapturePreviewUrl'](value112) {
    const enabled40 = String(value112 || '')['trim']();
    if (!enabled40['startsWith']('blob:')) return;
    const value113 = globalThis['window']?.['URL'] || globalThis['URL'];
    if (typeof value113?.['revokeObjectURL'] !== 'function') return;
    try {
      value113['revokeObjectURL'](enabled40);
    } catch {}
  }
  ['_adoptCapturePreviewUrl'](value114) {
    const value115 = String(value114 || '')['trim']();
    (this['_activeCapturePreviewUrl'] &&
      this['_activeCapturePreviewUrl'] !== value115 &&
      this['_revokeCapturePreviewUrl'](this['_activeCapturePreviewUrl']),
      (this['_activeCapturePreviewUrl'] = value115));
  }
  ['_releaseActiveCapturePreviewUrl']() {
    if (!this['_activeCapturePreviewUrl']) return;
    const value116 = this['_activeCapturePreviewUrl'];
    ((this['_activeCapturePreviewUrl'] = ''), this['_revokeCapturePreviewUrl'](value116));
  }
  ['_clearStoredCapturePreviewAfterSourcePromotion'](value117) {
    const enabled41 = String(value117 || '')['trim'](),
      enabled42 = this['_getCapturePreviewUrl'](this['_data']);
    if (!enabled41 || !enabled42 || enabled41 === enabled42) return ![];
    const args15 = appStore['getStateRaw']()['nodes']?.[this['id']];
    if (!args15 || this['_getCapturePreviewUrl'](args15) !== enabled42) return ![];
    return (
      appStore['updateNodeData'](this['id'], { capturePreviewUrl: '' }),
      (this['_data'] = { ...args15, capturePreviewUrl: '' }),
      !![]
    );
  }
  ['_shouldKeepReadyCapturePreview'](value118) {
    const enabled43 = String(this['_activeCapturePreviewUrl'] || '')['trim'](),
      enabled44 = String(value118 || '')['trim']();
    if (!enabled43 || !this['_video'] || Number(this['_video']['readyState'] || 0) < 2) return ![];
    const videoCurrentSource = getVideoCurrentSource(this['_video']),
      enabled45 = this['_currentSrc'] === enabled43 || videoCurrentSource === enabled43;
    if (!enabled45) return ![];
    if (!enabled44) return this['_isUploading'] === !![];
    if (enabled44 === enabled43 || /^(?:blob:|aic-local-preview:)/i['test'](enabled44)) return ![];
    return !![];
  }
  ['_resolveVideoMetaSrc'](enabled46) {
    if (!enabled46) return '';
    const sourceVideoMediaTaskSrc2 = resolveSourceVideoMediaTaskSrc(enabled46);
    if (sourceVideoMediaTaskSrc2) return sourceVideoMediaTaskSrc2;
    const enabled47 = this['_resolveVideoSrc'](enabled46);
    if (!enabled47) return '';
    const value119 = String(enabled47);
    if (
      value119['startsWith']('http://') ||
      value119['startsWith']('https://') ||
      value119['startsWith']('blob:') ||
      value119['startsWith']('aic-local-preview:') ||
      value119['startsWith']('data:')
    )
      return '';
    return urlToLocalPath(value119) || '';
  }
  ['requestVideoMetaForNodeInfo'](value120 = this['_data']) {
    const enabled48 = this['_resolveVideoMetaSrc'](value120);
    if (!enabled48) return null;
    const value121 = Date['now']();
    if (
      this['_videoMetaInfoRequestSrc'] === enabled48 &&
      value121 - Number(this['_videoMetaInfoRequestAt'] || 0) < 5000
    )
      return this['_metaFetchPromise'] || null;
    return (
      (this['_videoMetaInfoRequestSrc'] = enabled48),
      (this['_videoMetaInfoRequestAt'] = value121),
      this['_cancelDeferredVideoMetaFetch'](),
      this['_maybeFetchVideoMeta'](value120)
    );
  }
  ['_cancelDeferredVideoMetaFetch']() {
    if (!this['_deferredVideoMetaCancel']) return;
    (this['_deferredVideoMetaCancel'](), (this['_deferredVideoMetaCancel'] = null));
  }
  ['_scheduleDeferredVideoMetaFetch'](value122 = this['_data']) {
    (this['_cancelDeferredVideoMetaFetch'](),
      (this['_deferredVideoMetaCancel'] = scheduleSourceVideoIdleTask(() => {
        this['_deferredVideoMetaCancel'] = null;
        const value123 = appStore['getStateRaw']()['nodes']?.[this['id']] || value122 || this['_data'];
        void this['_maybeFetchVideoMeta'](value123);
      })));
  }
  async ['_maybeFetchVideoMeta'](value124) {
    const enabled49 = this['_getNodeDuration'](value124) <= 0;
    if (!enabled49 && !shouldFetchVideoMetaForNodeInfo()) return;
    const videoMetaSrc = this['_resolveVideoMetaSrc'](value124);
    if (!videoMetaSrc) return;
    const enabled50 = appStore['getState']()['nodes'][this['id']];
    if (!enabled50) return;
    if (this['_resolveVideoMetaSrc'](enabled50) !== videoMetaSrc) return;
    const value125 = String(enabled50['videoMetaSrc'] || ''),
      value126 =
        Number['isFinite'](Number(enabled50['videoFps'])) &&
        Number(enabled50['videoFps']) > 0 &&
        Number['isFinite'](Number(enabled50['videoFrameCount'])) &&
        Number(enabled50['videoFrameCount']) > 0;
    if (value126 && value125 === videoMetaSrc) return;
    if (this['_metaFetchPromise'] && this['_metaFetchSrc'] === videoMetaSrc) return this['_metaFetchPromise'];
    value125 &&
      value125 !== videoMetaSrc &&
      appStore['updateNodeData'](this['id'], {
        videoMetaSrc: videoMetaSrc,
        videoFps: null,
        videoFrameCount: null,
      });
    const value127 = ++this['_metaFetchToken'],
      value128 = (async () => {
        try {
          const box4 = await fetchVideoMetaFromServer(videoMetaSrc);
          if (value127 !== this['_metaFetchToken']) return;
          if (!box4 || box4['success'] !== !![]) return;
          const count6 = Number(box4['fps']),
            count7 = Number(box4['frameCount']),
            count8 = Number(box4['duration']),
            count9 = Number(box4['width']),
            count10 = Number(box4['height']),
            value129 = { videoMetaSrc: videoMetaSrc };
          if (Number['isFinite'](count6) && count6 > 0) value129['videoFps'] = count6;
          if (Number['isFinite'](count7) && count7 > 0)
            value129['videoFrameCount'] = Math['round'](count7);
          if (Number['isFinite'](count8) && count8 > 0) value129['videoDuration'] = count8;
          if (Number['isFinite'](count9) && count9 > 0)
            value129['videoWidth'] = Math['round'](count9);
          if (Number['isFinite'](count10) && count10 > 0)
            value129['videoHeight'] = Math['round'](count10);
          const enabled51 = appStore['getState']()['nodes'][this['id']];
          if (!enabled51) return;
          if (this['_resolveVideoMetaSrc'](enabled51) !== videoMetaSrc) return;
          const value130 =
            String(enabled51['videoMetaSrc'] || '') !== String(value129['videoMetaSrc'] || '') ||
            Number(enabled51['videoFps'] || 0) !== Number(value129['videoFps'] || 0) ||
            Number(enabled51['videoFrameCount'] || 0) !== Number(value129['videoFrameCount'] || 0) ||
            Number(enabled51['videoDuration'] || 0) !== Number(value129['videoDuration'] || 0) ||
            Number(enabled51['videoWidth'] || 0) !== Number(value129['videoWidth'] || 0) ||
            Number(enabled51['videoHeight'] || 0) !== Number(value129['videoHeight'] || 0);
          if (value130) appStore['updateNodeData'](this['id'], value129);
        } catch {
        } finally {
          this['_metaFetchPromise'] === value128 &&
            ((this['_metaFetchPromise'] = null), (this['_metaFetchSrc'] = ''));
        }
      })();
    return ((this['_metaFetchSrc'] = videoMetaSrc), (this['_metaFetchPromise'] = value128), value128);
  }
  ['_scheduleMaybeEnsureVideoThumb']() {
    if (this['_idleVideoThumbCancel']) return;
    this['_idleVideoThumbCancel'] = scheduleSourceVideoIdleTask(() => {
      ((this['_idleVideoThumbCancel'] = null), void this['_maybeEnsureVideoThumb'](this['_data']));
    });
  }
  async ['_maybeEnsureVideoThumb'](value131) {
    if (isSourceVideoInteractionBusy()) {
      this['_scheduleMaybeEnsureVideoThumb']();
      return;
    }
    const videoThumbSrc = this['_resolveVideoMetaSrc'](value131);
    if (!videoThumbSrc) return;
    const enabled52 = appStore['getState']()['nodes'][this['id']];
    if (!enabled52) return;
    const enabled53 = String(enabled52['videoThumbSrc'] || ''),
      value132 = !!String(enabled52['thumbUrl'] || '')['trim']();
    if (value132 && enabled53 === videoThumbSrc) return;
    if (
      enabled53 === videoThumbSrc &&
      ['waiting', 'processing']['includes'](String(enabled52['mediaTaskStatus'] || '')) &&
      ['videoFirstFrame', 'videoPoster']['includes'](String(enabled52['mediaTaskKind'] || ''))
    )
      return;
    if (enabled53 && enabled53 !== videoThumbSrc)
      appStore['updateNodeData'](this['id'], { videoThumbSrc: videoThumbSrc });
    else !enabled53 && appStore['updateNodeData'](this['id'], { videoThumbSrc: videoThumbSrc });
    const value133 = ++this['_thumbFetchToken'];
    try {
      const response3 = await fetchVideoFirstFrameThumbFromServer(videoThumbSrc, {
        nodeId: this['id'],
        assetId: String(enabled52['assetId'] || ''),
      });
      if (value133 !== this['_thumbFetchToken']) return;
      if (!response3 || response3['success'] === ![]) return;
      const thumbUrl = String(response3['thumbUrl'] || response3['url'] || '')['trim']();
      if (!thumbUrl) return;
      const enabled54 = appStore['getState']()['nodes'][this['id']];
      if (!enabled54) return;
      const value134 =
        String(enabled54['videoThumbSrc'] || '') !== String(videoThumbSrc || '') ||
        String(enabled54['thumbUrl'] || '') !== thumbUrl;
      value134 && appStore['updateNodeData'](this['id'], { videoThumbSrc: videoThumbSrc, thumbUrl: thumbUrl });
    } catch {}
  }
  ['_getBaseDuration']() {
    const enabled55 = this['_video'];
    if (!enabled55) return 0;
    const count11 = Number(enabled55['duration']);
    if (Number['isFinite'](count11) && count11 > 0) return count11;
    const list2 = enabled55['seekable'];
    if (list2 && list2['length']) {
      const count12 = Number(list2['end'](list2['length'] - 1));
      if (Number['isFinite'](count12) && count12 > 0) return count12;
    }
    return 0;
  }
  ['_getClipRange'](value135) {
    const end = Number(value135);
    if (!Number['isFinite'](end) || end <= 0) return { active: ![], start: 0, end: 0 };
    const value136 = Number(this['_data']?.['clipStart']),
      value137 = Number(this['_data']?.['clipEnd']);
    if (!Number['isFinite'](value136) || !Number['isFinite'](value137) || !(value137 > value136))
      return { active: ![], start: 0, end: end };
    const start = Math['max'](0, Math['min'](end, value136)),
      end2 = Math['max'](0, Math['min'](end, value137));
    if (!(end2 > start)) return { active: ![], start: 0, end: end };
    return { active: !![], start: start, end: end2 };
  }
  ['_requestProgressFrame'](value138) {
    const value139 = globalThis['window']?.['requestAnimationFrame'] || globalThis['requestAnimationFrame'];
    if (typeof value139 === 'function')
      return value139['call'](globalThis['window'] || globalThis, value138);
    return setTimeout(value138, 16);
  }
  ['_cancelProgressFrame'](value140) {
    const value141 = globalThis['window']?.['cancelAnimationFrame'] || globalThis['cancelAnimationFrame'];
    if (typeof value141 === 'function') {
      value141['call'](globalThis['window'] || globalThis, value140);
      return;
    }
    clearTimeout(value140);
  }
  ['_cancelProgressLoop']() {
    if (!this['_progressRaf']) return;
    (this['_cancelProgressFrame'](this['_progressRaf']), (this['_progressRaf'] = 0));
  }
  ['_startProgressLoop']() {
    if (this['_progressRaf'] || !this['_video'] || this['_video']['paused']) return;
    const value142 = () => {
      ((this['_progressRaf'] = 0), this['_syncVideoProgressUi']());
      if (!this['_video'] || this['_video']['paused'] || this['_video']['ended']) return;
      this['_progressRaf'] = this['_requestProgressFrame'](value142);
    };
    this['_progressRaf'] = this['_requestProgressFrame'](value142);
  }
  ['_syncVideoProgressUi']() {
    if (!this['_video'] || !this['_fill'] || !this['_timeCurrent'] || !this['_timeTotal']) return;
    if (this['_isSeeking'] || (this['_bar'] && this['_bar']['dataset']['dragging'] === 'true')) return;
    const enabled56 = this['_getBaseDuration']();
    if (!enabled56 || !Number['isFinite'](enabled56)) return;
    const value143 = this['_getClipRange'](enabled56),
      enabled57 = value143['active'] ? Math['max'](0, value143['end'] - value143['start']) : enabled56;
    if (!enabled57 || !Number['isFinite'](enabled57)) return;
    let value144 = this['_video']['currentTime'] || 0;
    if (value143['active']) {
      if (value144 < value143['start'])
        ((this['_video']['currentTime'] = value143['start']), (value144 = value143['start']));
      else
        value144 > value143['end'] - 0.03 &&
          ((this['_video']['currentTime'] = value143['start']), (value144 = value143['start']));
    }
    const value145 = value143['active']
      ? Math['max'](0, Math['min'](enabled57, value144 - value143['start']))
      : value144;
    this['_fill']['style']['width'] = (value145 / enabled57) * 100 + '%';
    const value146 = this['_fmt'](value145),
      value147 = this['_fmt'](enabled57);
    (this['_timeCurrent']['textContent'] !== value146 && (this['_timeCurrent']['textContent'] = value146),
      this['_timeTotal']['textContent'] !== value147 && (this['_timeTotal']['textContent'] = value147));
  }
  ['_setManualLoopPlayback'](value148) {
    setSourceVideoManualLoopPlayback(this, value148);
  }
  ['_shouldKeepHoverPlaybackOnManualClick']() {
    return shouldTakeOverActiveHoverPlayback(this, this['_video']);
  }
  ['_toggleManualPlayback']({ loop: loop = ![], forcePlay: forcePlay = ![] } = {}) {
    toggleSourceVideoManualPlayback(this, { loop: loop, forcePlay: forcePlay });
  }
  ['_getPlaybackLabel'](value149 = 'preview') {
    return 'source-video:' + this['id'] + ':' + value149;
  }
  ['_openFullscreenFromCurrentVideo']() {
    const previewUrl = String(
      this['_resolveVideoSrc'](this['_data']) ||
        this['_video']?.['dataset']?.['desktopMediaSourceUrl'] ||
        this['_currentSrc'] ||
        '',
    )['trim']();
    if (!previewUrl) return null;
    return openSourceVideoFullscreenPreview({
      nodeData: this['_data'],
      previewUrl: previewUrl,
      previewPlaybackUrl: getVideoCurrentSource(this['_video']),
      currentTime: Number(this['_video']?.['currentTime'] || 0),
      muted: !!this['_isMuted'],
      loop: this['_isManualLoopPlayback'] === !![],
    });
  }
  async ['_ensurePlaybackVideoSrc']({
    forPlayback: forPlayback = ![],
    preload: preload = forPlayback ? 'auto' : SOURCE_VIDEO_POSTER_PRELOAD,
  } = {}) {
    const enabled58 = this['_ensureVideoElement']();
    if (!enabled58) return ![];
    this['_applyPendingPlaybackSourceAtBoundary']();
    const sourceUrl2 = String(this['_currentSrc'] || this['_resolveVideoSrc'](this['_data']) || '')['trim']();
    if (!sourceUrl2) return ![];
    if (isMediaElementPlaybackSource(enabled58, sourceUrl2))
      return (forPlayback && enabled58['preload'] !== preload && (enabled58['preload'] = preload), !![]);
    if (this['_isHardMissingPlaybackSource'](sourceUrl2))
      return (this['_applyHardMissingPlaybackState'](sourceUrl2, this['_hardMissingPlaybackStatus']), ![]);
    if (this['_playbackSourcePromise'] && this['_playbackSourcePromiseSource'] === sourceUrl2)
      return this['_playbackSourcePromise'];
    const value150 = Number(this['_playbackSourceToken'] || 0),
      value151 = (async () => {
        this['_currentSrc'] = sourceUrl2;
        const response4 = forPlayback
            ? await this['_resolveLocalPlaybackObjectUrl'](sourceUrl2, { resultMode: 'typed' })
            : '',
          playbackUrl2 = typeof response4 === 'string' ? response4 : String(response4?.['playbackUrl'] || ''),
          value152 =
            typeof response4 === 'string'
              ? playbackUrl2
                ? 'ready'
                : 'fallback'
              : String(response4?.['status'] || 'fallback');
        if (
          this['_currentSrc'] !== sourceUrl2 ||
          this['_rendererMediaDeferred'] === !![] ||
          Number(this['_playbackSourceToken'] || 0) !== value150
        )
          return ![];
        if (value152 === 'hard-missing')
          return (this['_applyHardMissingPlaybackState'](sourceUrl2, response4?.['httpStatus']), ![]);
        if (value152 === 'aborted') return ![];
        globalThis['window']?.['__runtimeCompareMark']?.('source-video-playback:attach', {
          nodeId: this['id'],
          sourceUrl: sourceUrl2,
          playbackUrl: playbackUrl2,
        });
        const value153 = this['_rendererMediaSlotToken'];
        let enabled59 = ![];
        const onSourceAssigned = () => {
            enabled59 = this['_armFirstVideoFramePresentation'](sourceUrl2, value153) || enabled59;
          },
          shouldAssign = () =>
            this['_video'] === enabled58 &&
            this['_currentSrc'] === sourceUrl2 &&
            this['_rendererMediaDeferred'] !== !![] &&
            Number(this['_playbackSourceToken'] || 0) === value150,
          attachMediaElementPlaybackSource2 = await attachMediaElementPlaybackSource(enabled58, sourceUrl2, {
            playbackUrl: playbackUrl2,
            preload: preload,
            warmRanges: ![],
            load: forPlayback || (!forPlayback && !isDesktopRenderer()),
            onSourceAssigned: onSourceAssigned,
            shouldAssign: shouldAssign,
          });
        if (!attachMediaElementPlaybackSource2 || !shouldAssign()) return ![];
        if (!enabled59) onSourceAssigned();
        return !![];
      })();
    ((this['_playbackSourcePromise'] = value151), (this['_playbackSourcePromiseSource'] = sourceUrl2));
    try {
      return await value151;
    } finally {
      this['_playbackSourcePromise'] === value151 &&
        ((this['_playbackSourcePromise'] = null), (this['_playbackSourcePromiseSource'] = ''));
    }
  }
  ['_attachPlaybackRecovery'](preload2 = 'hover') {
    if (!this['_video']) return null;
    const minBufferAhead = preload2 === 'hover' || preload2 === 'fullscreen';
    return attachVideoPlaybackRecovery(this['_video'], {
      label: this['_getPlaybackLabel'](preload2),
      ensureSrc: () =>
        this['_ensurePlaybackVideoSrc']({
          forPlayback: !![],
          preload: preload2 === 'hover' ? 'metadata' : 'auto',
        }),
      minBufferAhead: minBufferAhead ? 0.5 : undefined,
      readyTimeoutMs: minBufferAhead ? 350 : undefined,
      recoveryDebounceMs: minBufferAhead ? 150 : undefined,
      recoveryCooldownMs: minBufferAhead ? 500 : undefined,
      shouldRecover: () =>
        this['_video']?.['isConnected'] !== ![] &&
        (this['_isHovered'] || this['_isManualControl'] || !this['_video']?.['paused']),
    });
  }
  async ['_playVideoWithRecovery'](value154, value155) {
    return playSourceVideoWithFeedback(this, value154, value155);
  }
  ['_loadVideo'](
    value156,
    {
      forceCapturePreviewPromotion: forceCapturePreviewPromotion = ![],
      resumePlaybackTime: resumePlaybackTime = null,
    } = {},
  ) {
    const enabled60 = String(value156 || '')['trim']();
    this['_replacePendingPlaybackResume'](enabled60, resumePlaybackTime);
    const value157 = String(this['_currentSrc'] || '')['trim']();
    enabled60 !== value157 &&
      (clearSourceVideoPlaybackFeedback(this),
      (this['_playbackSourceToken'] = Number(this['_playbackSourceToken'] || 0) + 1));
    const enabled61 =
      forceCapturePreviewPromotion === !![] ||
      (resolveGenerationUiState(this['_data']) === 'success' &&
        this['_card']?.['classList']?.['contains']?.('img-preview-loading') === !![]);
    if (forceCapturePreviewPromotion !== !![] && this['_shouldKeepReadyCapturePreview'](enabled60)) {
      (this['_prepareRendererMediaSlotSource'](enabled60),
        this['_applyVideoPoster'](this['_data']),
        stopLoading(this['_card']),
        this['_syncVideoElementFrameVisibility']());
      return;
    }
    if (this['_rendererMediaDeferred'] === !![]) {
      const value158 = enabled60 !== String(this['_currentSrc'] || '')['trim']();
      ((this['_currentSrc'] = enabled60),
        this['_prepareRendererMediaSlotSource'](enabled60),
        this['_applyVideoPoster'](this['_data'], { restoreNativePoster: !!enabled60 && value158 }));
      return;
    }
    this['_setManualLoopPlayback'](![]);
    const value159 = enabled60 !== String(this['_currentSrc'] || '')['trim'](),
      enabled62 = this['_applyVideoPoster'](this['_data'], { restoreNativePoster: !!enabled60 && value159 });
    if (!enabled60) {
      ((this['_currentSrc'] = ''),
        this['_prepareRendererMediaSlotSource'](''),
        this['_setRendererPlaybackPin'](![]));
      const shouldShowGenerationResultLoadingUi2 = shouldShowGenerationResultLoadingUi(this['_data'], { hasResult: ![] });
      this['_idleVideoThumbCancel'] &&
        (this['_idleVideoThumbCancel'](), (this['_idleVideoThumbCancel'] = null));
      ((this['_loadVideoToken'] = null), this['_releaseActiveCapturePreviewUrl']());
      this['_video'] &&
        ((this['_video']['onloadeddata'] = null),
        (this['_video']['onerror'] = null),
        (this['_video']['preload'] = 'none'),
        this['_clearVideoElementSource']({ invalidateRendererSlot: ![] }),
        (this['_video']['style']['display'] = 'none'));
      this['_setPosterFrameVisible'](shouldShowGenerationResultLoadingUi2 && !!enabled62);
      shouldShowGenerationResultLoadingUi2 ? startLoading(this['_card'], { variant: 'full' }) : stopLoading(this['_card']);
      if (this['_hint']) this['_hint']['style']['display'] = shouldShowGenerationResultLoadingUi2 ? 'none' : 'block';
      this['_syncPlaybackChromeVisibility']({ forceHidden: !![] });
      if (this['_uploadBtn']) this['_uploadBtn']['disabled'] = shouldShowGenerationResultLoadingUi2;
      return;
    }
    const value160 = this['_getCapturePreviewUrl'](this['_data']);
    if (enabled60 === value160) this['_adoptCapturePreviewUrl'](enabled60);
    else this['_activeCapturePreviewUrl'] && this['_releaseActiveCapturePreviewUrl']();
    enabled60 !== value160 && this['_clearStoredCapturePreviewAfterSourcePromotion'](enabled60);
    ((this['_currentSrc'] = enabled60), this['_prepareRendererMediaSlotSource'](enabled60));
    const enabled63 = !!(this['_video'] && isMediaElementPlaybackSource(this['_video'], enabled60));
    if (enabled62) {
      this['_idleVideoThumbCancel'] &&
        (this['_idleVideoThumbCancel'](), (this['_idleVideoThumbCancel'] = null));
      this['_loadVideoToken'] = null;
      if (this['_video']) {
        ((this['_video']['onloadeddata'] = null), (this['_video']['onerror'] = null));
        const videoCurrentSource2 = getVideoCurrentSource(this['_video']);
        (videoCurrentSource2 &&
          !isMediaElementPlaybackSource(this['_video'], enabled60) &&
          this['_clearVideoElementSource']({ load: ![], invalidateRendererSlot: ![] }),
          (this['_video']['preload'] = 'none'),
          this['_syncVideoElementFrameVisibility']({ forceHidden: !enabled63 }));
      }
      this['_syncVideoDurationUi']();
      if (!enabled61 || this['_card']?.['classList']?.['contains']?.('img-preview-loading') !== !![])
        stopLoading(this['_card']);
      (this['_syncPosterFrameVisibility'](enabled63 ? {} : { force: !![] }),
        this['_syncPlaybackChromeVisibility']());
      if (this['_hint']) this['_hint']['style']['display'] = 'block';
      if (!enabled61) return;
    }
    let value161 = ![];
    const run5 = () => {
      if (value161 || this['_currentSrc'] !== enabled60) return;
      ((value161 = !![]), this['_clearMediaUnavailableAfterPlayback'](enabled60));
      this['_activeCapturePreviewUrl'] &&
        this['_activeCapturePreviewUrl'] !== enabled60 &&
        this['_releaseActiveCapturePreviewUrl']();
      this['_syncPlaybackChromeVisibility']();
      if (this['_hint']) this['_hint']['style']['display'] = 'block';
      this['_maybeEnsureVideoThumb'](this['_data']);
      const value162 = this['_rendererMediaSlotToken'];
      if (!this['_armFirstVideoFramePresentation'](enabled60, value162)) stopLoading(this['_card']);
      (this['_nudgePausedVideoForFirstFrame'](enabled60), this['_syncPosterFrameVisibility']());
    };
    if (!enabled61) {
      this['_loadVideoToken'] = null;
      this['_video'] &&
        getVideoCurrentSource(this['_video']) &&
        !enabled63 &&
        this['_clearVideoElementSource']();
      this['_video'] &&
        ((this['_video']['onloadeddata'] = run5),
        (this['_video']['onerror'] = () => {
          if (this['_currentSrc'] === enabled60) stopLoading(this['_card']);
        }),
        (this['_video']['preload'] = 'none'),
        this['_syncVideoElementFrameVisibility']({ forceHidden: !enabled63 }));
      (this['_syncPosterFrameVisibility'](enabled63 ? {} : { force: !!enabled62 }),
        this['_syncPlaybackChromeVisibility']());
      if (this['_hint']) this['_hint']['style']['display'] = 'block';
      (stopLoading(this['_card']),
        this['_scheduleMaybeEnsureVideoThumb'](),
        this['_attachPlaybackRecovery']());
      return;
    }
    const el16 = this['_ensureVideoElement']();
    if (!el16) {
      stopLoading(this['_card']);
      return;
    }
    ((el16['onloadeddata'] = run5),
      (el16['onerror'] = () => {
        if (this['_currentSrc'] === enabled60) stopLoading(this['_card']);
      }),
      startLoading(this['_card'], { variant: 'full' }),
      (el16['style']['display'] = 'block'),
      this['_syncVideoElementFrameVisibility']());
    enabled62
      ? (this['_syncPosterFrameVisibility']({ force: !![] }), this['_syncPlaybackChromeVisibility']())
      : (this['_setPosterFrameVisible'](![]), this['_syncPlaybackChromeVisibility']({ forceHidden: !![] }));
    const value163 = {};
    this['_loadVideoToken'] = value163;
    const run6 = () => {
      if (!this['_video'] || this['_loadVideoToken'] !== value163 || this['_currentSrc'] !== enabled60)
        return;
      this['_video']['preload'] = 'auto';
      if (!enabled62 && !isDesktopRenderer()) {
        ((this['_video']['src'] = enabled60),
          this['_armFirstVideoFramePresentation'](enabled60, this['_rendererMediaSlotToken']));
        try {
          this['_video']['load']?.();
        } catch {}
        if (Number(this['_video']['readyState'] || 0) >= 2) run5();
        return;
      }
      if (!enabled62) {
        const value164 = this['_rendererMediaSlotToken'];
        let enabled64 = ![];
        const onSourceAssigned2 = () => {
            enabled64 = this['_armFirstVideoFramePresentation'](enabled60, value164) || enabled64;
          },
          value165 = Number(this['_playbackSourceToken'] || 0),
          value166 = this['_video'],
          shouldAssign2 = () =>
            this['_video'] === value166 &&
            this['_loadVideoToken'] === value163 &&
            this['_currentSrc'] === enabled60 &&
            this['_rendererMediaDeferred'] !== !![] &&
            Number(this['_playbackSourceToken'] || 0) === value165;
        void attachMediaElementPlaybackSource(value166, enabled60, {
          preload: 'auto',
          warmRanges: ![],
          load: !![],
          onSourceAssigned: onSourceAssigned2,
          shouldAssign: shouldAssign2,
        })
          ['then']((enabled65) => {
            if (!enabled65 || !shouldAssign2()) return;
            if (!enabled64) onSourceAssigned2();
            this['_video'] &&
              this['_loadVideoToken'] === value163 &&
              this['_currentSrc'] === enabled60 &&
              Number(this['_video']['readyState'] || 0) >= 2 &&
              run5();
          })
          ['catch'](() => {
            if (this['_currentSrc'] === enabled60) stopLoading(this['_card']);
          });
        return;
      }
      void this['_ensurePlaybackVideoSrc']({ forPlayback: !![] })
        ['then'](() => {
          this['_video'] &&
            this['_loadVideoToken'] === value163 &&
            this['_currentSrc'] === enabled60 &&
            Number(this['_video']['readyState'] || 0) >= 2 &&
            run5();
        })
        ['catch'](() => {
          if (this['_currentSrc'] === enabled60) stopLoading(this['_card']);
        });
    };
    (run6(), this['_attachPlaybackRecovery']());
    if (this['_hint']) this['_hint']['style']['display'] = 'block';
  }
  ['_fmt'](enabled66) {
    if (!enabled66 || isNaN(enabled66)) return '0:00';
    return (
      Math['floor'](enabled66 / 60) + ':' + String(Math['floor'](enabled66 % 60))['padStart'](2, '0')
    );
  }
  ['_getNodeDuration'](value167 = this['_data']) {
    const count13 = Number(value167?.['videoDuration'] || value167?.['duration'] || 0);
    if (Number['isFinite'](count13) && count13 > 0) return count13;
    const count14 = Number(value167?.['videoFrameCount'] || value167?.['frameCount'] || 0),
      count15 = Number(value167?.['videoFps'] || value167?.['fps'] || 0);
    if (Number['isFinite'](count14) && count14 > 0 && Number['isFinite'](count15) && count15 > 0)
      return count14 / count15;
    return 0;
  }
  ['_syncVideoDurationUi']() {
    if (!this['_timeTotal']) return;
    const enabled67 = this['_getBaseDuration']() || this['_getNodeDuration'](this['_data']);
    if (!enabled67 || !Number['isFinite'](enabled67)) {
      this['_timeTotal']['textContent'] = '0:00';
      return;
    }
    const value168 = this['_getClipRange'](enabled67),
      enabled68 = value168['active'] ? Math['max'](0, value168['end'] - value168['start']) : enabled67;
    if (!enabled68 || !Number['isFinite'](enabled68)) {
      this['_timeTotal']['textContent'] = '0:00';
      return;
    }
    this['_timeTotal']['textContent'] = this['_fmt'](enabled68);
  }
  ['_setCenterIndicatorIcon'](value169) {
    if (!this['_indicatorInner']) return;
    const el17 = document['createElementNS']('http://www.w3.org/2000/svg', 'svg');
    (el17['setAttribute']('width', '28'),
      el17['setAttribute']('height', '28'),
      el17['setAttribute']('viewBox', '0 0 24 24'),
      el17['setAttribute']('fill', 'currentColor'),
      (el17['style']['color'] = 'var(--canvas-white)'),
      value169 === 'play'
        ? (el17['innerHTML'] = '<polygon points="6 4 20 12 6 20 6 4"></polygon>')
        : (el17['innerHTML'] =
            '<rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect>'),
      (this['_indicatorInner']['innerHTML'] = ''),
      this['_indicatorInner']['appendChild'](el17));
  }
  ['_showPausedCenterIndicator']() {
    if (!this['_indicatorInner']) return;
    (this['_centerIndicatorTimer'] &&
      (clearTimeout(this['_centerIndicatorTimer']), (this['_centerIndicatorTimer'] = null)),
      this['_setCenterIndicatorIcon']('play'),
      (this['_indicatorInner']['style']['opacity'] = '1'),
      (this['_indicatorInner']['style']['transform'] = 'scale(1)'));
  }
  ['_hideCenterIndicator']() {
    if (!this['_indicatorInner']) return;
    (this['_centerIndicatorTimer'] &&
      (clearTimeout(this['_centerIndicatorTimer']), (this['_centerIndicatorTimer'] = null)),
      (this['_indicatorInner']['style']['opacity'] = '0'),
      (this['_indicatorInner']['style']['transform'] = 'scale(0.92)'));
  }
  ['_flashCenterIndicator'](value170) {
    if (!this['_indicatorInner']) return;
    (this['_centerIndicatorTimer'] &&
      (clearTimeout(this['_centerIndicatorTimer']), (this['_centerIndicatorTimer'] = null)),
      this['_setCenterIndicatorIcon'](value170),
      (this['_indicatorInner']['style']['opacity'] = '1'),
      (this['_indicatorInner']['style']['transform'] = 'scale(1)'),
      (this['_centerIndicatorTimer'] = setTimeout(() => {
        if (!this['_indicatorInner']) return;
        if (value170 === 'pause') this['_showPausedCenterIndicator']();
        else this['_hideCenterIndicator']();
        this['_centerIndicatorTimer'] = null;
      }, 520)));
  }
  ['_updatePlayIcon'](value171) {
    if (!this['_playBtn']) return;
    const value172 = value171 ? 'paused' : 'playing',
      sourceVideoText4 = sourceVideoText(value171 ? 'controls.playLoopHint' : 'controls.pause');
    if (
      this['_playIconButtonEl'] === this['_playBtn'] &&
      this['_playIconState'] === value172 &&
      this['_playBtn']['dataset']?.['tooltip'] === sourceVideoText4
    )
      return;
    ((this['_playIconButtonEl'] = this['_playBtn']),
      (this['_playIconState'] = value172),
      (this['_playBtn']['dataset']['tooltip'] = sourceVideoText4),
      this['_playBtn']['setAttribute']?.('aria-label', sourceVideoText4),
      this['_playBtn']['replaceChildren']());
    const value173 = 'http://www.w3.org/2000/svg',
      el18 = document['createElementNS'](value173, 'svg');
    (el18['setAttribute']('width', '16'),
      el18['setAttribute']('height', '16'),
      el18['setAttribute']('viewBox', '0 0 24 24'),
      el18['setAttribute']('fill', 'currentColor'));
    if (value171) {
      const el19 = document['createElementNS'](value173, 'polygon');
      (el19['setAttribute']('points', '5 3 19 12 5 21 5 3'), el18['appendChild'](el19));
    } else {
      const el20 = document['createElementNS'](value173, 'rect');
      (el20['setAttribute']('x', '6'),
        el20['setAttribute']('y', '4'),
        el20['setAttribute']('width', '4'),
        el20['setAttribute']('height', '16'));
      const el21 = document['createElementNS'](value173, 'rect');
      (el21['setAttribute']('x', '14'),
        el21['setAttribute']('y', '4'),
        el21['setAttribute']('width', '4'),
        el21['setAttribute']('height', '16'),
        el18['appendChild'](el20),
        el18['appendChild'](el21));
    }
    this['_playBtn']['appendChild'](el18);
  }
  async ['_captureFrame']() {
    const enabled69 = await this['_ensurePlaybackVideoSrc']();
    if (!enabled69 || !this['_video']) return;
    await extractCurrentVideoFrameToImageNode({
      videoEl: this['_video'],
      anchorNodeId: this['id'],
      fallbackDurationSec: this['_getBaseDuration'](),
      onMissingMetadata: (value174) => this['_maybeFetchVideoMeta'](value174),
      logPrefix: '[SourceVideoNode]',
    });
  }
  ['_computeGenerationDuration'](enabled70 = this['_data']) {
    if (!enabled70) return 0;
    if (typeof enabled70['generationDuration'] === 'number') return enabled70['generationDuration'];
    const count16 = Number(enabled70['generationStartTime'] || 0);
    if (!Number['isFinite'](count16) || count16 <= 0) return 0;
    return Math['max'](0, Date['now']() - count16);
  }
  ['_isRunningHubRecoverableTask'](enabled71 = this['_data']) {
    if (!enabled71 || typeof enabled71 !== 'object') return ![];
    const enabled72 = String(enabled71['rhTaskId'] || '')['trim']();
    if (!enabled72) return ![];
    const value175 = String(enabled71['rhTaskStatus'] || '')
      ['trim']()
      ['toLowerCase']();
    if (['success', 'failed', 'idle', 'cancelled']['includes'](value175)) return ![];
    return isRunningHubVideoTask(enabled71);
  }
  ['_syncRunningHubVideoTaskState'](enabled73 = this['_data']) {
    if (!enabled73 || typeof enabled73 !== 'object') return ![];
    const runningHubVideoTerminalStatePatch = buildRunningHubVideoTerminalStatePatch(
      enabled73,
      enabled73['rhTaskStatus'],
      this['_computeGenerationDuration'](enabled73),
    );
    if (!runningHubVideoTerminalStatePatch) return ![];
    return (appStore['updateNodeData'](this['id'], runningHubVideoTerminalStatePatch), !![]);
  }
  ['_isAsyncRecoverableTask'](enabled74 = this['_data']) {
    if (!enabled74 || typeof enabled74 !== 'object') return ![];
    const enabled75 = String(enabled74['asyncTaskId'] || '')['trim']();
    if (!enabled75) return ![];
    const enabled76 = String(enabled74['asyncTaskProvider'] || enabled74['provider'] || '')
      ['trim']()
      ['toLowerCase']();
    if (!enabled76 || enabled76 === 'runninghubwf' || enabled76 === 'runninghub' || enabled76 === 'dreamina')
      return ![];
    const value176 = String(enabled74['asyncTaskKind'] || '')
      ['trim']()
      ['toLowerCase']();
    if (value176 && value176 !== 'video') return ![];
    const value177 = String(enabled74['asyncTaskStatus'] || '')
      ['trim']()
      ['toLowerCase']();
    if (['success', 'failed', 'idle', 'cancelled']['includes'](value177)) return ![];
    return !![];
  }
  ['_stopRunningHubRecovery'](enabled77 = !![]) {
    try {
      this['_rhResumeAbortController']?.['abort']?.();
    } catch {}
    ((this['_rhResumeAbortController'] = null),
      (this['_rhResumePromise'] = null),
      (this['_rhResumeTaskId'] = ''));
    if (!enabled77) return;
    const enabled78 = appStore['getStateRaw']()['nodes']?.[this['id']];
    if (!enabled78 || enabled78['rhTaskRecovering'] !== !![]) return;
    appStore['updateNodeData'](this['id'], { rhTaskRecovering: ![] });
  }
  ['_stopAsyncRecovery'](enabled79 = !![]) {
    try {
      this['_asyncResumeAbortController']?.['abort']?.();
    } catch {}
    ((this['_asyncResumeAbortController'] = null),
      (this['_asyncResumePromise'] = null),
      (this['_asyncResumeTaskId'] = ''));
    if (!enabled79) return;
    const enabled80 = appStore['getStateRaw']()['nodes']?.[this['id']];
    if (!enabled80 || enabled80['asyncTaskRecovering'] !== !![]) return;
    appStore['updateNodeData'](this['id'], { asyncTaskRecovering: ![] });
  }
  ['_extractFirstVideoUrl'](value178) {
    const map2 = new Set(),
      handler5 = (value179) => {
        if (value179 == null) return '';
        if (typeof value179 === 'string') {
          const enabled81 = value179['trim']();
          if (!enabled81) return '';
          if (
            enabled81['startsWith']('http://') ||
            enabled81['startsWith']('https://') ||
            enabled81['startsWith']('/')
          )
            return enabled81;
          if (enabled81['startsWith']('{') || enabled81['startsWith']('['))
            try {
              return handler5(JSON['parse'](enabled81));
            } catch {
              return '';
            }
          const value180 = enabled81['match'](/https?:\/\/[^\s"'<>]+/);
          return value180 && value180[0] ? value180[0] : '';
        }
        if (typeof value179 !== 'object') return '';
        if (map2['has'](value179)) return '';
        map2['add'](value179);
        if (Array['isArray'](value179)) {
          for (const value181 of value179) {
            const value182 = handler5(value181);
            if (value182) return value182;
          }
          return '';
        }
        const value183 = [
          'url',
          'videoUrl',
          'video_url',
          'fileUrl',
          'file_url',
          'download_url',
          'output',
          'result',
          'data',
          'results',
          'outputs',
        ];
        for (const value184 of value183) {
          const value185 = handler5(value179[value184]);
          if (value185) return value185;
        }
        return '';
      };
    return handler5(value178);
  }
  ['_toLocalPathIfSameOrigin'](value186) {
    return urlToLocalPath(value186);
  }
  async ['_saveVideoToOutput'](value187) {
    const url2 = String(value187 || '')['trim'](),
      value188 = this['_toLocalPathIfSameOrigin'](url2);
    if (value188) return value188;
    if (!isClientFetchableMediaUrl(url2)) return '';
    let resultLocalPath = '';
    try {
      const signal2 = new AbortController(),
        setTimeout2 = setTimeout(() => signal2['abort'](), 120000);
      let fetchRemoteBlob2 = null;
      try {
        fetchRemoteBlob2 = await fetchRemoteBlob(url2, { signal: signal2['signal'] });
      } finally {
        clearTimeout(setTimeout2);
      }
      const response5 = await saveOutputToServer(fetchRemoteBlob2, { ext: 'mp4' });
      response5?.['success'] && (resultLocalPath = pickResultLocalPath(response5));
    } catch (error3) {
      const list3 = error3 instanceof Error ? error3['message'] : String(error3 || ''),
        value189 =
          list3['includes']('Failed to fetch') ||
          list3['includes']('NetworkError') ||
          list3['toLowerCase']()['includes']('cors');
      if (value189 && /^https?:\/\//i['test'](url2)) {
        const server = await saveOutputFromUrlToServer({ url: url2, ext: 'mp4' });
        resultLocalPath = pickResultLocalPath(server);
      }
    }
    return resultLocalPath;
  }
  async ['_buildRecoveredVideoResultPatch'](value190) {
    let canvasLocalVideoFields = buildCanvasLocalVideoFields(value190);
    if (canvasLocalVideoFields['src'] && canvasLocalVideoFields['localPath']) return canvasLocalVideoFields;
    const videoUrl = this['_extractFirstVideoUrl'](value190);
    if (!videoUrl) throw new Error(sourceVideoText('recovery.noOutputVideoUrl'));
    const localPath6 =
      this['_toLocalPathIfSameOrigin'](videoUrl) || (await this['_saveVideoToOutput'](videoUrl));
    canvasLocalVideoFields = buildCanvasLocalVideoFields({ localPath: localPath6, videoUrl: videoUrl });
    if (!canvasLocalVideoFields['src'] || !canvasLocalVideoFields['localPath'])
      throw new Error(sourceVideoText('recovery.noOutputVideoUrl'));
    return canvasLocalVideoFields;
  }
  ['_resolveAsyncResumePayload'](value191) {
    return {
      model: String(value191?.['model'] || '')['trim'](),
      provider: String(value191?.['asyncTaskProvider'] || value191?.['provider'] || '')['trim'](),
    };
  }
  ['_maybeResumeRunningHubTask']() {
    const value192 = appStore['getStateRaw']()['nodes']?.[this['id']] || this['_data'];
    if (!this['_isRunningHubRecoverableTask'](value192)) {
      this['_stopRunningHubRecovery'](!![]);
      return;
    }
    const taskId = String(value192?.['rhTaskId'] || '')['trim']();
    if (!taskId) return;
    if (this['_rhResumePromise'] && this['_rhResumeTaskId'] === taskId) return;
    const startedAt =
        Number(value192?.['rhTaskStartedAt'] || value192?.['generationStartTime'] || 0) || Date['now'](),
      value193 = String(value192?.['model'] || '')
        ['trim']()
        ['toLowerCase'](),
      rhTaskUseOpenapiQuery = value192?.['rhTaskUseOpenapiQuery'] === !![],
      videoMattingModelId = getVideoMattingModelId(),
      provider = value193 === videoMattingModelId,
      providerProfileId = String(
        value192?.['taskProviderProfileId'] ||
          value192?.['providerProfileId'] ||
          value192?.['rhProviderProfileId'] ||
          '',
      )['trim'](),
      provider2 = {
        provider: provider
          ? 'runninghubwf'
          : String(value192?.['provider'] || 'runninghubwf')['trim']() || 'runninghubwf',
        model: provider ? videoMattingModelId : String(value192?.['model'] || '')['trim'](),
        ...(providerProfileId ? { providerProfileId: providerProfileId, rhProviderProfileId: providerProfileId } : {}),
      },
      handler6 =
        typeof this['_resumeRunningHubTaskPoller'] === 'function'
          ? this['_resumeRunningHubTaskPoller']
          : null,
      signal3 = new AbortController();
    ((this['_rhResumeAbortController'] = signal3), (this['_rhResumeTaskId'] = taskId));
    const value194 = (async () => {
      try {
        const response6 = await resumeTask(
          {
            sourceNodeId: this['id'],
            targetNodeId: this['id'],
            trigger: 'node',
            taskType: 'video-generation',
            provider: provider2['provider'] || value192?.['provider'] || 'runninghubwf',
            adapterType: 'workflow',
            modelId: provider2['model'] || value192?.['model'] || '',
            executionId:
              'runninghub.source-video.' + (provider2['model'] || value192?.['model'] || 'workflow'),
            payload: provider2,
            taskId: taskId,
            cancellable: ![],
            resumable: !![],
            pauseOnAbort: !![],
            startBuilder: () => ({
              rhTaskStatus:
                String(value192?.['rhTaskStatus'] || '')
                  ['trim']()
                  ['toLowerCase']() === 'pending'
                  ? 'pending'
                  : 'running',
              rhTaskUseOpenapiQuery: rhTaskUseOpenapiQuery,
            }),
            poll: async () => {
              if (handler6)
                return handler6(taskId, value192, {
                  signal: signal3['signal'],
                  payload: provider2,
                  useOpenapiQuery: rhTaskUseOpenapiQuery,
                });
              if (provider)
                return resumeRunningHubVideoTask(taskId, provider2, {
                  signal: signal3['signal'],
                  useOpenapiQuery: rhTaskUseOpenapiQuery,
                });
              await ensureConfig();
              const runningHubApiUrl = getProviderConfig(provider2['providerProfileId'] || 'runninghubwf'),
                apiKey = String(runningHubApiUrl?.['apiKey'] || '')['trim']();
              if (!apiKey) throw new Error(sourceVideoText('recovery.runninghubApiKeyMissing'));
              return resumeRunninghubWorkflowTask(
                {
                  apiKey: apiKey,
                  taskId: taskId,
                  providerProfileId: provider2['providerProfileId'],
                  runningHubApiUrl: runningHubApiUrl?.['apiUrl'],
                },
                { signal: signal3['signal'], useOpenapiQuery: rhTaskUseOpenapiQuery },
              );
            },
            resultBuilder: async (value195) => {
              const error4 = appStore['getState']()['nodes']?.[this['id']] || {},
                name3 =
                  resolveRunningHubVideoStatusName(error4, 'success') ||
                  (error4?.['name']?.['includes'](sourceVideoText('result.hdVideo'))
                    ? sourceVideoText('result.hdVideo')
                    : error4?.['name'] || sourceVideoText('result.defaultName'));
              return {
                ...(await this['_buildRecoveredVideoResultPatch'](value195)),
                name: name3,
                generationDuration: this['_computeGenerationDuration'](error4),
              };
            },
            failureBuilder: (error5, startedAt2) => {
              const error6 =
                  error5 instanceof Error
                    ? error5['message']
                    : String(error5 || sourceVideoText('recovery.taskFailed')),
                value196 = appStore['getState']()['nodes']?.[this['id']] || {},
                args16 =
                  buildRunningHubVideoTerminalStatePatch(
                    value196,
                    'failed',
                    this['_computeGenerationDuration'](value196),
                  ) || {},
                duration = args16['generationDuration'] ?? this['_computeGenerationDuration'](value196);
              return {
                ...buildSourceVideoRecoveryFailurePatch(value196, {
                  error: error6,
                  startedAt: startedAt2['startedAt'],
                  duration: duration,
                }),
                ...args16,
                generationDuration: duration,
              };
            },
            parseError: (error7) =>
              error7 instanceof Error
                ? error7['message']
                : String(error7 || sourceVideoText('recovery.taskFailed')),
          },
          { store: appStore, startedAt: startedAt, abortController: signal3 },
        );
        response6['status'] === 'success' && window['_triggerLocalCacheSave']?.();
      } catch (error8) {
        if (signal3['signal']['aborted'] || String(error8?.['message'] || '') === 'CANCELLED') return;
        const error9 =
            error8 instanceof Error
              ? error8['message']
              : String(error8 || sourceVideoText('recovery.taskFailed')),
          enabled82 = appStore['getState']()['nodes']?.[this['id']];
        if (!enabled82) return;
        const duration2 =
          buildRunningHubVideoTerminalStatePatch(
            enabled82,
            'failed',
            this['_computeGenerationDuration'](enabled82),
          ) || {};
        appStore['updateNodeData'](this['id'], {
          ...buildSourceVideoRecoveryFailurePatch(enabled82, {
            error: error9,
            startedAt: startedAt,
            duration: duration2['generationDuration'] ?? this['_computeGenerationDuration'](enabled82),
          }),
          ...duration2,
          isGenerating: ![],
          generationDuration:
            duration2['generationDuration'] ?? this['_computeGenerationDuration'](enabled82),
          rhTaskStatus: 'failed',
          rhTaskRecovering: ![],
        });
      } finally {
        (this['_rhResumeAbortController'] === signal3 && (this['_rhResumeAbortController'] = null),
          this['_rhResumeTaskId'] === taskId && (this['_rhResumeTaskId'] = ''),
          (this['_rhResumePromise'] = null));
      }
    })();
    this['_rhResumePromise'] = value194;
  }
  ['_maybeResumeAsyncTask']() {
    const value197 = appStore['getStateRaw']()['nodes']?.[this['id']] || this['_data'];
    if (!this['_isAsyncRecoverableTask'](value197)) {
      this['_stopAsyncRecovery'](!![]);
      return;
    }
    const taskId2 = String(value197?.['asyncTaskId'] || '')['trim']();
    if (!taskId2) return;
    if (this['_asyncResumePromise'] && this['_asyncResumeTaskId'] === taskId2) return;
    const startedAt3 =
        Number(value197?.['asyncTaskStartedAt'] || value197?.['generationStartTime'] || 0) ||
        Date['now'](),
      modelId = this['_resolveAsyncResumePayload'](value197),
      provider3 = String(
        modelId['provider'] || value197?.['asyncTaskProvider'] || value197?.['provider'] || '',
      )
        ['trim']()
        ['toLowerCase'](),
      handler7 =
        typeof this['_resumeAsyncTaskPoller'] === 'function'
          ? this['_resumeAsyncTaskPoller']
          : resumeAsyncVideoTask,
      signal4 = new AbortController();
    ((this['_asyncResumeAbortController'] = signal4), (this['_asyncResumeTaskId'] = taskId2));
    const value198 = (async () => {
      try {
        const response7 = await resumeTask(
          {
            sourceNodeId: this['id'],
            targetNodeId: this['id'],
            trigger: 'node',
            taskType: 'video-generation',
            provider: provider3 || modelId['provider'] || value197?.['provider'] || '',
            adapterType: 'modelApi',
            modelId: modelId['model'] || value197?.['model'] || '',
            executionId: (provider3 || modelId['provider'] || 'model') + '.source-video.async',
            payload: modelId,
            taskId: taskId2,
            async: !![],
            cancellable: ![],
            resumable: !![],
            pauseOnAbort: !![],
            startBuilder: () => ({
              asyncTaskProvider: provider3,
              asyncTaskKind: 'video',
              asyncTaskStatus:
                String(value197?.['asyncTaskStatus'] || '')
                  ['trim']()
                  ['toLowerCase']() === 'pending'
                  ? 'pending'
                  : 'running',
            }),
            poll: async () => handler7(taskId2, modelId, { signal: signal4['signal'] }),
            resultBuilder: async (value199) => {
              const name4 = appStore['getState']()['nodes']?.[this['id']] || {};
              return {
                ...(await this['_buildRecoveredVideoResultPatch'](value199)),
                name: name4?.['name']?.['includes'](sourceVideoText('result.hdVideo'))
                  ? sourceVideoText('result.hdVideo')
                  : name4?.['name'] || sourceVideoText('result.defaultName'),
                generationDuration: this['_computeGenerationDuration'](name4),
              };
            },
            failureBuilder: (error10, startedAt4) => {
              const error11 =
                  error10 instanceof Error
                    ? error10['message']
                    : String(error10 || sourceVideoText('recovery.taskFailed')),
                value200 = appStore['getState']()['nodes']?.[this['id']] || {};
              return buildSourceVideoRecoveryFailurePatch(value200, {
                error: error11,
                startedAt: startedAt4['startedAt'],
                duration: this['_computeGenerationDuration'](value200),
              });
            },
            parseError: (error12) =>
              error12 instanceof Error
                ? error12['message']
                : String(error12 || sourceVideoText('recovery.taskFailed')),
          },
          { store: appStore, startedAt: startedAt3, abortController: signal4 },
        );
        response7['status'] === 'success' && window['_triggerLocalCacheSave']?.();
      } catch (error13) {
        if (
          signal4['signal']['aborted'] ||
          String(error13?.['message'] || '') === 'CANCELLED' ||
          error13?.['name'] === 'AbortError'
        )
          return;
        const error14 =
            error13 instanceof Error
              ? error13['message']
              : String(error13 || sourceVideoText('recovery.taskFailed')),
          enabled83 = appStore['getState']()['nodes']?.[this['id']];
        if (!enabled83) return;
        appStore['updateNodeData'](this['id'], {
          ...buildSourceVideoRecoveryFailurePatch(enabled83, {
            error: error14,
            startedAt: startedAt3,
            duration: this['_computeGenerationDuration'](enabled83),
          }),
          isGenerating: ![],
          asyncTaskStatus: 'failed',
          asyncTaskRecovering: ![],
        });
      } finally {
        (this['_asyncResumeAbortController'] === signal4 && (this['_asyncResumeAbortController'] = null),
          this['_asyncResumeTaskId'] === taskId2 && (this['_asyncResumeTaskId'] = ''),
          (this['_asyncResumePromise'] = null));
      }
    })();
    this['_asyncResumePromise'] = value198;
  }
  ['update'](error15) {
    const videoNodeUpdatePerf = createVideoNodeUpdatePerf();
    this['_data'] = error15;
    this['_syncRunningHubVideoTaskState'](error15) &&
      ((this['_data'] = appStore['getState']()['nodes']?.[this['id']] || error15),
      (error15 = this['_data']));
    (this['_syncMutedStateFromData'](error15),
      this['_syncVideoDurationUi'](),
      videoNodeUpdatePerf?.['mark']('task-muted-state'));
    const enabled84 = this['_resolveVideoSrc'](error15);
    videoNodeUpdatePerf?.['mark']('resolve-source');
    const shouldShowGenerationResultLoadingUi3 = shouldShowGenerationResultLoadingUi(error15, { hasResult: !!enabled84 });
    if (shouldShowGenerationResultLoadingUi3) {
      startLoading(this['_card'], { variant: 'full' });
      if (this['_hint']) this['_hint']['style']['display'] = 'none';
      if (this['_uploadBtn']) this['_uploadBtn']['disabled'] = !![];
    } else {
      if (isTaskTerminal(error15)) {
        if (!enabled84) stopLoading(this['_card']);
        if (this['_uploadBtn']) this['_uploadBtn']['disabled'] = ![];
      } else {
        if (this['_uploadBtn']) this['_uploadBtn']['disabled'] = ![];
        if (!enabled84) stopLoading(this['_card']);
      }
    }
    videoNodeUpdatePerf?.['mark']('loading-ui');
    const sourceVideoPosterSrc2 = resolveSourceVideoPosterSrc(error15),
      value201 = sourceVideoPosterSrc2 !== this['_lastPosterSrc'];
    if (this['_rendererMediaDeferred'] === !![]) {
      this['_currentSrc'] = enabled84 || '';
      this['_video'] &&
        ((this['_video']['preload'] = 'none'), this['_clearVideoElementSource']({ load: ![] }));
      if (value201 || sourceVideoPosterSrc2) this['_applyVideoPoster'](error15);
      else this['_setPosterFrameVisible'](![]);
      videoNodeUpdatePerf?.['mark']('deferred-poster');
      this['_rendererDetailsDeferred'] !== !![] &&
        hasSourceVideoRecoveryWork(error15) &&
        (this['_maybeResumeRunningHubTask'](), this['_maybeResumeAsyncTask']());
      videoNodeUpdatePerf?.['mark']('deferred-task-resume');
      this['_label'] &&
        error15['name'] &&
        document['activeElement'] !== this['_label'] &&
        this['_label']['textContent'] !== error15['name'] &&
        (this['_label']['textContent'] = error15['name']);
      (this['_syncGenerationFailureUi'](error15),
        videoNodeUpdatePerf?.['mark']('label'),
        (this['_lastUpdatePerfBreakdown'] = videoNodeUpdatePerf?.['finish']() || null));
      return;
    }
    (this['_requestVisibleProxyMigration'](), videoNodeUpdatePerf?.['mark']('proxy-migration'));
    const enabled85 = String(enabled84 || '')['trim']() !== String(this['_currentSrc'] || '')['trim'](),
      value202 =
        enabled85 &&
        (this['_shouldDeferActivePlaybackSourceChange'](enabled84) ||
          this['_shouldKeepReadyCapturePreview'](enabled84));
    !enabled85 && this['_hasPendingPlaybackSource'] === !![] && this['_clearPendingPlaybackSource']();
    if (value202) this['_setPendingPlaybackSource'](enabled84);
    else {
      if (enabled85) (this['_clearPendingPlaybackSource'](), this['_loadVideo'](enabled84 || ''));
      else {
        if (
          enabled84 &&
          value201 &&
          (!this['_video'] || this['_video']['paused']) &&
          !this['_isVideoFrameReadyToShow']()
        )
          this['_loadVideo'](enabled84);
        else {
          if (value201) this['_applyVideoPoster'](error15);
        }
      }
    }
    (videoNodeUpdatePerf?.['mark']('media-poster'),
      this['_maybeFetchVideoMeta'](error15),
      hasSourceVideoRecoveryWork(error15) &&
        (this['_maybeResumeRunningHubTask'](), this['_maybeResumeAsyncTask']()),
      videoNodeUpdatePerf?.['mark']('meta-task-resume'),
      this['_label'] &&
        error15['name'] &&
        document['activeElement'] !== this['_label'] &&
        this['_label']['textContent'] !== error15['name'] &&
        (this['_label']['textContent'] = error15['name']),
      this['_syncGenerationFailureUi'](error15),
      videoNodeUpdatePerf?.['mark']('label'),
      (this['_lastUpdatePerfBreakdown'] = videoNodeUpdatePerf?.['finish']() || null));
  }
  ['unmount']() {
    (clearSourceVideoPlaybackFeedback(this),
      (this['_canonicalAssetImportDisposed'] = !![]),
      this['_progressDragSession']?.['dispose']?.(),
      (this['_progressDragSession'] = null));
    if (this['_bar']?.['dataset']) this['_bar']['dataset']['dragging'] = 'false';
    ((this['_isSeeking'] = ![]),
      (this['_seekToken'] = Number(this['_seekToken'] || 0) + 1),
      this['_invalidateCanonicalAssetImportRetry'](),
      this['_clearPendingPlaybackSource'](),
      this['_invalidatePendingPlaybackResume'](),
      (this['_metaFetchToken'] = Number(this['_metaFetchToken'] || 0) + 1),
      (this['_playbackSourceToken'] = Number(this['_playbackSourceToken'] || 0) + 1),
      this['_setRendererPlaybackPin'](![]),
      this['_hoverPlaybackLifecycle']?.['dispose']?.(),
      this['_unsubscribeLocale']?.(),
      (this['_unsubscribeLocale'] = null),
      this['_videoToolbarCleanup']?.(),
      (this['_videoToolbarCleanup'] = null),
      this['_removeDeferredToolbarActivator']?.(),
      (this['_removeDeferredToolbarActivator'] = null),
      this['_removeDeferredInteractionActivator']?.(),
      (this['_removeDeferredInteractionActivator'] = null),
      this['_cancelProgressLoop'](),
      (this['_posterFramePreloadToken'] = (this['_posterFramePreloadToken'] || 0) + 1),
      this['_idleVideoThumbCancel'] &&
        (this['_idleVideoThumbCancel'](), (this['_idleVideoThumbCancel'] = null)),
      this['_cancelDeferredVideoMetaFetch'](),
      this['_releaseActiveCapturePreviewUrl'](),
      this['_stopRunningHubRecovery'](![]),
      this['_stopAsyncRecovery'](![]),
      this['_centerIndicatorTimer'] &&
        (clearTimeout(this['_centerIndicatorTimer']), (this['_centerIndicatorTimer'] = null)),
      this['_video'] &&
        (this['_setManualLoopPlayback'](![]),
        detachVideoPlaybackRecovery(this['_video']),
        this['_video']['pause'](),
        (this['_video']['src'] = '')),
      this['_releasePlaybackObjectUrl']());
  }
  ['prepareRendererVisibleVideoPreview']() {
    return ((this['_rendererEagerVideoPreview'] = ![]), this['_rendererMediaDeferred'] === !![]);
  }
  ['prepareRendererMediaFallbackForSuspend']() {
    const enabled86 = String(this['_lastPosterSrc'] || '')['trim']();
    if (!enabled86 || !this['_posterFrame']) return ![];
    this['_posterFrame']['loading'] = 'eager';
    try {
      this['_posterFrame']['fetchPriority'] = 'high';
    } catch {}
    this['_applyPosterFrameSource'](enabled86);
    const value203 =
      this['_posterFrame']['isConnected'] !== ![] &&
      this['_posterFrame']['complete'] === !![] &&
      Number(this['_posterFrame']['naturalWidth'] || 0) > 0;
    if (value203) this['_setPosterFrameVisible'](!![]);
    return value203;
  }
  ['suspendRendererMedia']() {
    (clearSourceVideoPlaybackFeedback(this),
      this['_setRendererPlaybackPin'](![]),
      (this['_rendererMediaDeferred'] = !![]),
      (this['_rendererEagerVideoPreview'] = ![]),
      (this['_playbackSourceToken'] = Number(this['_playbackSourceToken'] || 0) + 1),
      (this['_playbackSourcePromise'] = null),
      this['_clearPendingPlaybackSource'](),
      this['_invalidatePendingPlaybackResume'](),
      (this['_playbackSourcePromiseSource'] = ''),
      (this['_loadVideoToken'] = null),
      (this['_currentSrc'] = null),
      (this['_isHovered'] = ![]),
      (this['_isManualControl'] = ![]),
      (this['_hoverManualPause'] = ![]),
      (this['_autoPlayToken'] += 1));
    if (this['_video']) {
      ((this['_video']['onloadeddata'] = null),
        (this['_video']['onerror'] = null),
        (this['_video']['preload'] = 'none'));
      try {
        this['_video']['pause']?.();
      } catch {}
      (this['_clearVideoElementSource'](), this['_syncPosterFrameVisibility']());
    } else this['_releasePlaybackObjectUrl']();
    this['_syncPlaybackChromeVisibility']({ forceHidden: !![] });
  }
  ['hydrateDeferredMedia']() {
    if (this['_rendererMediaDeferred'] !== !![]) return;
    ((this['_rendererMediaDeferred'] = ![]),
      (this['_rendererEagerVideoPreview'] = ![]),
      this['_bindVideoInteractionHandlers'](),
      this['_ensureVideoToolbarBound']());
    const value204 = this['_promotePendingProxyAtMediaSegmentBoundary'](
      appStore['getStateRaw']()['nodes']?.[this['id']] || this['_data'],
    );
    this['_requestVisibleProxyMigration']();
    const value205 = this['_resolveVideoSrc'](value204);
    if (value205) this['_loadVideo'](value205);
    else this['_loadVideo']('');
    this['_scheduleDeferredVideoMetaFetch'](value204);
  }
}
