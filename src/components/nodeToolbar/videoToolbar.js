import appStore from '../../core/stores/appStore.js';
import { findAvailablePosition } from '../../core/math.js';
import { submitTask } from '../../core/generationTaskRuntime.js';
import { createRunningHubTaskStateMachine } from '../../modules/ImageFreeAngleController.js';
import VideoClipController, {
  runSmartClipKeyframeExtractionFromVideoNode,
} from '../../modules/VideoClipController.js';
import { runVideoAudioSeparationFromNode } from '../../modules/VideoAudioSeparationController.js';
import { runVideoReverseFromNode } from '../../modules/VideoReverseController.js';
import VideoKeyingController from '../../modules/VideoKeyingController.js';
import {
  fetchRemoteBlob,
  saveOutputToServer,
  saveOutputFromUrlToServer,
} from '../../../api/projectsV2Api.js';
import { fetchAppRuntimeInfoFromServer } from '../../../api/runtimeApi.js';
import { fetchVideoMetaFromServer } from '../../../api/videoMetaApi.js';
import {
  runRunninghubAiApp,
  runRunninghubWorkflow,
  resumeRunninghubWorkflowTask,
} from '../../../api/runninghubWorkflowApi.js';
import { processInputVideos } from '../../../api/videoUploadApi.js';
import { detectScenes } from '../../../api/sceneDetectionApi.js';
import { buildApiUrl } from '../../../api/apiBase.js';
import { getProviderConfig, ensureConfig } from '../../../api/configApi.js';
import { calcSafeSpawnPosNearNode, getNodeSpawnPrefs } from '../../modules/nodeSpawn.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../../services/fileService.js';
import {
  buildCanvasLocalVideoFields,
  resolveCanvasVideoLocalPath,
  resolveCanvasVideoUrl,
} from '../../services/canvasMediaLocalService.js';
import { attachMediaElementPlaybackSource } from '../../services/desktopMediaBlobSource.js';
import { pickResultLocalPath, urlToLocalPath } from '../../utils/localMediaPath.js';
import {
  buildVideoGenerationFailurePatch,
  buildVideoGenerationResultPatch,
} from '../video-node/videoGenerationResultRenderer.js';
import { executeCommand } from '../../core/interaction.js';
import { VIDEO_TOOLBAR_HTML } from './videoToolbarHtml.js';
import {
  RUNNING_HUB_CANCEL_ICON_HTML,
  bindRunningHubToolbarTaskButton,
  cancelRunningHubResultTask,
  findRunningHubToolbarTaskForNode,
  isRunningHubToolbarTaskCancelled,
  notifyRunningHubToolbarTasksChanged,
} from './runningHubToolbarTaskButton.js';
import { RH_VIDEO_HD_VIP_MODEL_ID, resolveModelExecution } from '../../manifests/index.js';
import { bindVideoClipAction } from './videoActions/clipAction.js';
import { bindVideoExtractKeyframesAction } from './videoActions/extractKeyframesAction.js';
import { bindVideoSeparateAvAction } from './videoActions/separateAvAction.js';
import { bindVideoReverseAction } from './videoActions/reverseAction.js';
import { bindVideoSmartClipAction } from './videoActions/smartClipAction.js';
import { bindVideoKeyingAction } from './videoActions/keyingAction.js';
import { bindVideoRemoveAction } from './videoActions/removeAction.js';
import { bindVideoFrameInterpolationAction } from './videoActions/frameInterpolationAction.js';
import { bindVideoHdAction } from './videoActions/hdAction.js';
import { bindVideoDownloadAction } from './videoActions/downloadAction.js';
import { bindVideoFullscreenAction } from './videoActions/fullscreenAction.js';
import { bindVideoResetSizeAction } from './videoActions/resetSizeAction.js';
import { bindStoryboardScriptToolbarAction } from './storyboardScriptAction.js';
import { bindImageToolbarLayoutUi } from './imageToolbarLayoutUi.js';
import { bindApimartPrivateAvatarAction } from './apimartPrivateAvatarAction.js';
import {
  VIDEO_TOOLBAR_ACTIONS,
  normalizeVideoToolbarLayout,
  serializeVideoToolbarLayout,
} from '../../modules/videoToolbarLayoutMemory.js';
import { t } from '../../i18n/index.js';
export { VIDEO_TOOLBAR_HTML };
const RH_VIDEO_HD_BASIC_WORKFLOW_ID = '2019292222763573249',
  RH_VIDEO_HD_VIP_EXECUTION = resolveModelExecution(RH_VIDEO_HD_VIP_MODEL_ID),
  RH_VIDEO_HD_VIP_APP_ID = RH_VIDEO_HD_VIP_EXECUTION?.executionManifest?.appId || '2047787809091620866',
  VIDEO_HD_STANDARD_INSTANCE_TYPE = 'default',
  VIDEO_HD_VIP_INSTANCE_TYPE = 'plus',
  VIDEO_HD_STANDARD_MAX_SECONDS = 10,
  KEYING_CANCEL_ICON_HTML = RUNNING_HUB_CANCEL_ICON_HTML;
function videoToolbarText(value, item = {}) {
  return t('nodeToolbar.video.' + value, item);
}
const getStateSnapshot = () =>
  typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
function getToolbarActionFromButton(el) {
  if (!el?.classList) return '';
  for (const list of el.classList) {
    if (!list.startsWith('act-')) continue;
    const key = list.slice(4);
    if (VIDEO_TOOLBAR_ACTIONS.includes(key)) return key;
  }
  return '';
}
export function bindVideoToolbarEvents(toolbarEl, nodeData) {
  if (!toolbarEl) return;
  const VIDEO_TOOLBAR_FOCUS_PADDING = 120,
    VIDEO_TOOLBAR_FOCUS_DURATION_MS = 0x320,
    VIDEO_TOOLBAR_FOCUS_MAX_ZOOM = 2;
  (toolbarEl.addEventListener('pointerdown', (event) => event.stopPropagation()),
    toolbarEl.addEventListener('dblclick', (event2) => {
      (event2.preventDefault(), event2.stopPropagation());
    }),
    bindImageToolbarLayoutUi(toolbarEl, {
      store: appStore,
      getStateSnapshot: getStateSnapshot,
      toolbarActions: VIDEO_TOOLBAR_ACTIONS,
      normalizeToolbarLayout: normalizeVideoToolbarLayout,
      serializeToolbarLayout: serializeVideoToolbarLayout,
      getToolbarActionFromButton: getToolbarActionFromButton,
      getToolbarLayout: (index) => index?.ui?.videoToolbarLayout,
      setToolbarLayout: (result) => appStore.setVideoToolbarLayout?.(result),
      moreMenuStickyActions: ['hd'],
    }));
  const _getLatestNodeData = () => {
      const enabled = nodeData?.id;
      if (!enabled) return nodeData || {};
      return getStateSnapshot().nodes?.[enabled] || nodeData || {};
    },
    handler = (data) => {
      const enabled2 = String(data || '').trim();
      if (!enabled2) return '';
      if (
        enabled2.startsWith('http://') ||
        enabled2.startsWith('https://') ||
        enabled2.startsWith('blob:') ||
        enabled2.startsWith('data:')
      )
        return enabled2;
      if (enabled2.startsWith('/')) return buildApiUrl(enabled2);
      return buildApiUrl('/' + enabled2.replace(/^\/+/, ''));
    },
    handler2 = (options) => {
      try {
        const uRL = new URL(options, window.location.href),
          target = uRL.pathname.split('/').filter(Boolean).pop() || '';
        return decodeURIComponent(target);
      } catch {
        const list2 = String(options || '')
          .split('?')[0]
          .split('#')[0]
          .split('/');
        return list2[list2.length - 1] || '';
      }
    },
    handler3 = (source) =>
      String(source || '')
        .trim()
        .replace(/[\\/:*?"<>|]/g, '_')
        .slice(0, 120),
    _guessDownloadName = (next) => {
      const list3 = handler3(handler2(next));
      if (list3) return list3.includes('.') ? list3 : list3 + '.mp4';
      return 'video_' + Date.now() + '.mp4';
    },
    _triggerHrefDownload = (current, entry) => {
      const el2 = document.createElement('a');
      ((el2.href = current),
        (el2.download = entry),
        (el2.rel = 'noopener'),
        document.body.appendChild(el2),
        el2.click(),
        el2.remove());
    },
    _isProbablyLocalUrl = (record) => {
      const enabled3 = String(record || '').trim();
      if (!enabled3) return false;
      if (enabled3.startsWith('/')) return true;
      try {
        const uRL2 = new URL(enabled3, window.location.href);
        return uRL2.origin === window.location.origin;
      } catch {
        return false;
      }
    },
    _getCurrentVideoUrl = () => {
      const payload = _getLatestNodeData(),
        handle = Array.isArray(payload.videos) ? payload.videos : [],
        state = payload.mainVideoIndex || 0,
        config = handle[state] || handle[0] || {};
      return handler(resolveCanvasVideoUrl(config) || resolveCanvasVideoUrl(payload));
    },
    _getCurrentVideoSource = () => {
      const node = _getLatestNodeData(),
        scope = Array.isArray(node.videos) ? node.videos : [],
        input = node.mainVideoIndex || 0,
        item2 = scope[input] || scope[0] || {};
      return { node: node, item: item2 };
    },
    handler4 = () => {
      const { node: node2, item: item3 } = _getCurrentVideoSource(),
        output = [item3?.videoDuration, item3?.duration, node2?.videoDuration];
      for (const value2 of output) {
        const count = Number(value2);
        if (Number.isFinite(count) && count > 0) return count;
      }
      return 0;
    },
    handler5 = () => {
      const { node: node3, item: item4 } = _getCurrentVideoSource();
      return resolveCanvasVideoLocalPath(item4) || resolveCanvasVideoLocalPath(node3);
    },
    handler6 = async () => {
      try {
        const fetchAppRuntimeInfoFromServer2 = await fetchAppRuntimeInfoFromServer();
        window.ADVANCED_MODE = Boolean(fetchAppRuntimeInfoFromServer2?.isAdvancedMode);
      } catch {}
      return window.ADVANCED_MODE === true;
    },
    handler7 = (value3) =>
      new Promise((handler8) => {
        const enabled4 = String(value3 || '').trim();
        if (!enabled4) {
          handler8(0);
          return;
        }
        const value4 = document.createElement('video');
        let value5 = false;
        const run = () => {
            value4.removeAttribute('src');
            try {
              value4.load();
            } catch {}
          },
          handler9 = (value6) => {
            if (value5) return;
            ((value5 = true), window.clearTimeout(value7), run(), handler8(value6));
          },
          value7 = window.setTimeout(() => handler9(0), 0x2ee0);
        ((value4.preload = 'metadata'),
          (value4.muted = true),
          (value4.playsInline = true),
          (value4.onloadedmetadata = () => {
            const count2 = Number(value4.duration);
            handler9(Number.isFinite(count2) && count2 > 0 ? count2 : 0);
          }),
          (value4.onerror = () => handler9(0)),
          void attachMediaElementPlaybackSource(value4, enabled4, { preload: 'metadata' }).catch(() => {
            !String(value4.getAttribute?.('src') || value4.src || '').trim() &&
              ((value4.src = enabled4), value4.load?.());
          }));
      }),
    handler10 = async (value8) => {
      const count3 = handler4();
      if (count3 > 0) return count3;
      const value9 = handler5();
      if (value9)
        try {
          const fetchVideoMetaFromServer2 = await fetchVideoMetaFromServer(value9),
            count4 = Number(fetchVideoMetaFromServer2?.duration);
          if (Number.isFinite(count4) && count4 > 0) return count4;
        } catch {}
      return handler7(value8);
    },
    _ensureVideoHdDurationAllowed = async (value10) => {
      if (await handler6()) return true;
      const value11 = await handler10(value10);
      if (Number.isFinite(value11) && value11 > VIDEO_HD_STANDARD_MAX_SECONDS + 0.05)
        return (
          window.showToast?.(
            videoToolbarText('durationLimit', { seconds: VIDEO_HD_STANDARD_MAX_SECONDS }),
            'warn',
            0x1450,
          ),
          false
        );
      return true;
    },
    _ensureVideoHdVipAllowed = async (modelId, onSuccess = null) => {
      if (typeof window.refreshSubscriptionState === 'function')
        try {
          await window.refreshSubscriptionState();
        } catch {}
      const value12 =
        typeof window.isModelAllowedBySubscription === 'function'
          ? window.isModelAllowedBySubscription(modelId, 'runninghubwf')
          : true;
      if (value12) return true;
      if (typeof window.openSubscriptionDialog === 'function')
        window.openSubscriptionDialog({ modelId: modelId, provider: 'runninghubwf', onSuccess: onSuccess });
      else
        typeof window.handleSubscriptionRequired === 'function'
          ? await window.handleSubscriptionRequired({ modelId: modelId, provider: 'runninghubwf' })
          : window.showToast?.(videoToolbarText('hdVipRequired'), 'warn');
      return false;
    },
    _extractFirstUrl = (value13) => {
      const map = new Set(),
        value14 = [
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
        ],
        handler11 = (value15) => {
          const enabled5 = String(value15 || '').trim();
          if (!enabled5) return '';
          if (enabled5.startsWith('http://') || enabled5.startsWith('https://')) return enabled5;
          if (enabled5.startsWith('/')) return enabled5;
          const value16 = enabled5.match(/https?:\/\/[^\s"'<>]+/);
          if (value16?.[0]) return value16[0];
          if (enabled5.startsWith('{') || enabled5.startsWith('['))
            try {
              return handler12(JSON.parse(enabled5));
            } catch {}
          return '';
        },
        handler12 = (enabled6) => {
          if (!enabled6) return '';
          if (typeof enabled6 === 'string') return handler11(enabled6);
          if (typeof enabled6 !== 'object') return '';
          if (map.has(enabled6)) return '';
          map.add(enabled6);
          if (Array.isArray(enabled6)) {
            for (const value17 of enabled6) {
              const value18 = handler12(value17);
              if (value18) return value18;
            }
            return '';
          }
          for (const value19 of value14) {
            if (value19 in enabled6) {
              const value20 = handler12(enabled6[value19]);
              if (value20) return value20;
            }
          }
          for (const value21 of Object.keys(enabled6)) {
            const value22 = handler12(enabled6[value21]);
            if (value22) return value22;
          }
          return '';
        };
      return handler12(value13);
    },
    handler13 = (value23) => {
      return urlToLocalPath(value23);
    },
    handler14 = async (value24) => {
      const value25 = String(value24 || '').trim();
      if (!(value25.startsWith('http://') || value25.startsWith('https://')))
        throw new Error(videoToolbarText('saveInvalidUrl'));
      const signal = new AbortController(),
        setTimeout2 = setTimeout(() => signal.abort(), 0x1d4c0);
      let fetchRemoteBlob2 = null;
      try {
        fetchRemoteBlob2 = await fetchRemoteBlob(value25, { signal: signal.signal });
      } finally {
        clearTimeout(setTimeout2);
      }
      if (!fetchRemoteBlob2) throw new Error(videoToolbarText('saveEmptyDownload'));
      const response = await saveOutputToServer(fetchRemoteBlob2, { ext: 'mp4' }),
        resultLocalPath = pickResultLocalPath(response);
      if (!response?.success || !resultLocalPath) throw new Error(videoToolbarText('saveMalformed'));
      return resultLocalPath;
    },
    _saveRemoteVideoResult = async (url) => {
      let enabled7 = handler13(url);
      if (!enabled7 && (url.startsWith('http://') || url.startsWith('https://')))
        try {
          (window.showToast?.(videoToolbarText('savingLocal'), 'info'), (enabled7 = await handler14(url)));
        } catch (error) {
          const list4 = error instanceof Error ? error.message : String(error || ''),
            enabled8 =
              list4.includes('Failed to fetch') ||
              list4.includes('NetworkError') ||
              list4.toLowerCase().includes('cors');
          if (!enabled8) throw error;
          const server = await saveOutputFromUrlToServer({ url: url, ext: 'mp4' }),
            resultLocalPath2 = pickResultLocalPath(server);
          if (resultLocalPath2) enabled7 = resultLocalPath2;
          else throw new Error(server?.error || videoToolbarText('localSaveFailed'));
        }
      return enabled7 || '';
    },
    value26 = {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      mediaKind: 'video',
      getStateSnapshot: getStateSnapshot,
      store: appStore,
      findAvailablePosition: findAvailablePosition,
      submitTask: submitTask,
      createRunningHubTaskStateMachine: createRunningHubTaskStateMachine,
      VideoClipController: VideoClipController,
      runSmartClipKeyframeExtractionFromVideoNode: runSmartClipKeyframeExtractionFromVideoNode,
      runVideoAudioSeparationFromNode: runVideoAudioSeparationFromNode,
      runVideoReverseFromNode: runVideoReverseFromNode,
      VideoKeyingController: VideoKeyingController,
      fetchRemoteBlob: fetchRemoteBlob,
      runRunninghubAiApp: runRunninghubAiApp,
      runRunninghubWorkflow: runRunninghubWorkflow,
      resumeRunninghubWorkflowTask: resumeRunninghubWorkflowTask,
      processInputVideos: processInputVideos,
      detectScenes: detectScenes,
      getProviderConfig: getProviderConfig,
      ensureConfig: ensureConfig,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      getNodeSpawnPrefs: getNodeSpawnPrefs,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      getAutoMediaSizeByShortSide: getAutoMediaSizeByShortSide,
      buildCanvasLocalVideoFields: buildCanvasLocalVideoFields,
      buildVideoGenerationFailurePatch: buildVideoGenerationFailurePatch,
      buildVideoGenerationResultPatch: buildVideoGenerationResultPatch,
      executeCommand: executeCommand,
      VIDEO_TOOLBAR_FOCUS_PADDING: VIDEO_TOOLBAR_FOCUS_PADDING,
      VIDEO_TOOLBAR_FOCUS_DURATION_MS: VIDEO_TOOLBAR_FOCUS_DURATION_MS,
      VIDEO_TOOLBAR_FOCUS_MAX_ZOOM: VIDEO_TOOLBAR_FOCUS_MAX_ZOOM,
      KEYING_CANCEL_ICON_HTML: KEYING_CANCEL_ICON_HTML,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
      isRunningHubToolbarTaskCancelled: isRunningHubToolbarTaskCancelled,
      notifyRunningHubToolbarTasksChanged: notifyRunningHubToolbarTasksChanged,
      RH_VIDEO_HD_BASIC_WORKFLOW_ID: RH_VIDEO_HD_BASIC_WORKFLOW_ID,
      RH_VIDEO_HD_VIP_MODEL_ID: RH_VIDEO_HD_VIP_MODEL_ID,
      RH_VIDEO_HD_VIP_APP_ID: RH_VIDEO_HD_VIP_APP_ID,
      VIDEO_HD_STANDARD_INSTANCE_TYPE: VIDEO_HD_STANDARD_INSTANCE_TYPE,
      VIDEO_HD_VIP_INSTANCE_TYPE: VIDEO_HD_VIP_INSTANCE_TYPE,
      _getLatestNodeData: _getLatestNodeData,
      _guessDownloadName: _guessDownloadName,
      _triggerHrefDownload: _triggerHrefDownload,
      _isProbablyLocalUrl: _isProbablyLocalUrl,
      _getCurrentVideoUrl: _getCurrentVideoUrl,
      _getCurrentVideoSource: _getCurrentVideoSource,
      _ensureVideoHdDurationAllowed: _ensureVideoHdDurationAllowed,
      _ensureVideoHdVipAllowed: _ensureVideoHdVipAllowed,
      _extractFirstUrl: _extractFirstUrl,
      _saveRemoteVideoResult: _saveRemoteVideoResult,
    };
  (bindStoryboardScriptToolbarAction(value26),
    bindApimartPrivateAvatarAction(value26),
    bindVideoClipAction(value26),
    bindVideoExtractKeyframesAction(value26),
    bindVideoSeparateAvAction(value26),
    bindVideoReverseAction(value26),
    bindVideoSmartClipAction(value26),
    bindVideoKeyingAction(value26),
    bindVideoRemoveAction(value26),
    bindVideoFrameInterpolationAction(value26),
    bindVideoHdAction(value26),
    bindVideoDownloadAction(value26),
    bindVideoFullscreenAction(value26),
    bindVideoResetSizeAction(value26));
}
