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
function videoToolbarText(_0x10ec76, _0x1205a7 = {}) {
  return t('nodeToolbar.video.' + _0x10ec76, _0x1205a7);
}
const getStateSnapshot = () =>
  typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
function getToolbarActionFromButton(_0x438979) {
  if (!_0x438979?.classList) return '';
  for (const _0x55c9fd of _0x438979.classList) {
    if (!_0x55c9fd.startsWith('act-')) continue;
    const _0x2c4017 = _0x55c9fd.slice(4);
    if (VIDEO_TOOLBAR_ACTIONS.includes(_0x2c4017)) return _0x2c4017;
  }
  return '';
}
export function bindVideoToolbarEvents(_0x3c43fe, _0x55042d) {
  if (!_0x3c43fe) return;
  const _0x37ca23 = 120,
    _0x238415 = 0x320,
    _0x5de23e = 2;
  (_0x3c43fe.addEventListener('pointerdown', (_0x3cafbe) => _0x3cafbe.stopPropagation()),
    _0x3c43fe.addEventListener('dblclick', (_0x14b628) => {
      (_0x14b628.preventDefault(), _0x14b628.stopPropagation());
    }),
    bindImageToolbarLayoutUi(_0x3c43fe, {
      store: appStore,
      getStateSnapshot: getStateSnapshot,
      toolbarActions: VIDEO_TOOLBAR_ACTIONS,
      normalizeToolbarLayout: normalizeVideoToolbarLayout,
      serializeToolbarLayout: serializeVideoToolbarLayout,
      getToolbarActionFromButton: getToolbarActionFromButton,
      getToolbarLayout: (_0x430a15) => _0x430a15?.ui?.videoToolbarLayout,
      setToolbarLayout: (_0x437cc9) => appStore.setVideoToolbarLayout?.(_0x437cc9),
      moreMenuStickyActions: ['hd'],
    }));
  const _0x34a04e = () => {
      const _0x242c13 = _0x55042d?.id;
      if (!_0x242c13) return _0x55042d || {};
      return getStateSnapshot().nodes?.[_0x242c13] || _0x55042d || {};
    },
    _0x8ae5cf = (_0x4e2417) => {
      const _0x8c99ca = String(_0x4e2417 || '').trim();
      if (!_0x8c99ca) return '';
      if (
        _0x8c99ca.startsWith('http://') ||
        _0x8c99ca.startsWith('https://') ||
        _0x8c99ca.startsWith('blob:') ||
        _0x8c99ca.startsWith('data:')
      )
        return _0x8c99ca;
      if (_0x8c99ca.startsWith('/')) return buildApiUrl(_0x8c99ca);
      return buildApiUrl('/' + _0x8c99ca.replace(/^\/+/, ''));
    },
    _0x19f158 = (_0x58a80b) => {
      try {
        const _0x12f774 = new URL(_0x58a80b, window.location.href),
          _0x2a8e52 = _0x12f774.pathname.split('/').filter(Boolean).pop() || '';
        return decodeURIComponent(_0x2a8e52);
      } catch {
        const _0x258063 = String(_0x58a80b || '')
          .split('?')[0]
          .split('#')[0]
          .split('/');
        return _0x258063[_0x258063.length - 1] || '';
      }
    },
    _0x570aef = (_0x3bf5f6) =>
      String(_0x3bf5f6 || '')
        .trim()
        .replace(/[\\/:*?"<>|]/g, '_')
        .slice(0, 120),
    _0x5c9cdf = (_0x3c0c4c) => {
      const _0xa7f262 = _0x570aef(_0x19f158(_0x3c0c4c));
      if (_0xa7f262) return _0xa7f262.includes('.') ? _0xa7f262 : _0xa7f262 + '.mp4';
      return 'video_' + Date.now() + '.mp4';
    },
    _0x1b6ce8 = (_0xdebf0b, _0x5c94ea) => {
      const _0x1e9f77 = document.createElement('a');
      ((_0x1e9f77.href = _0xdebf0b),
        (_0x1e9f77.download = _0x5c94ea),
        (_0x1e9f77.rel = 'noopener'),
        document.body.appendChild(_0x1e9f77),
        _0x1e9f77.click(),
        _0x1e9f77.remove());
    },
    _0x2a84e6 = (_0x4dbb8a) => {
      const _0x543932 = String(_0x4dbb8a || '').trim();
      if (!_0x543932) return false;
      if (_0x543932.startsWith('/')) return true;
      try {
        const _0x47141a = new URL(_0x543932, window.location.href);
        return _0x47141a.origin === window.location.origin;
      } catch {
        return false;
      }
    },
    _0x433a84 = () => {
      const _0x422280 = _0x34a04e(),
        _0x4b16ab = Array.isArray(_0x422280.videos) ? _0x422280.videos : [],
        _0x5e0327 = _0x422280.mainVideoIndex || 0,
        _0x68a091 = _0x4b16ab[_0x5e0327] || _0x4b16ab[0] || {};
      return _0x8ae5cf(resolveCanvasVideoUrl(_0x68a091) || resolveCanvasVideoUrl(_0x422280));
    },
    _0x5e9058 = () => {
      const _0x49a59c = _0x34a04e(),
        _0x5207f0 = Array.isArray(_0x49a59c.videos) ? _0x49a59c.videos : [],
        _0x377f39 = _0x49a59c.mainVideoIndex || 0,
        _0x4384cd = _0x5207f0[_0x377f39] || _0x5207f0[0] || {};
      return { node: _0x49a59c, item: _0x4384cd };
    },
    _0x17dedc = () => {
      const { node: _0x42fdb2, item: _0x2cd2a8 } = _0x5e9058(),
        _0x522bef = [_0x2cd2a8?.videoDuration, _0x2cd2a8?.duration, _0x42fdb2?.videoDuration];
      for (const _0x29bf76 of _0x522bef) {
        const _0x1fc163 = Number(_0x29bf76);
        if (Number.isFinite(_0x1fc163) && _0x1fc163 > 0) return _0x1fc163;
      }
      return 0;
    },
    _0x35e4da = () => {
      const { node: _0x192fef, item: _0x80607a } = _0x5e9058();
      return resolveCanvasVideoLocalPath(_0x80607a) || resolveCanvasVideoLocalPath(_0x192fef);
    },
    _0x192267 = async () => {
      try {
        const _0x1abf42 = await fetchAppRuntimeInfoFromServer();
        window.ADVANCED_MODE = Boolean(_0x1abf42?.isAdvancedMode);
      } catch {}
      return window.ADVANCED_MODE === true;
    },
    _0x18eb01 = (_0x2af5d1) =>
      new Promise((_0x112c59) => {
        const _0x3c7d1c = String(_0x2af5d1 || '').trim();
        if (!_0x3c7d1c) {
          _0x112c59(0);
          return;
        }
        const _0x4488ee = document.createElement('video');
        let _0x3d6185 = false;
        const _0x2d4425 = () => {
            _0x4488ee.removeAttribute('src');
            try {
              _0x4488ee.load();
            } catch {}
          },
          _0x4f77f6 = (_0x3eb9fb) => {
            if (_0x3d6185) return;
            ((_0x3d6185 = true), window.clearTimeout(_0x207057), _0x2d4425(), _0x112c59(_0x3eb9fb));
          },
          _0x207057 = window.setTimeout(() => _0x4f77f6(0), 0x2ee0);
        ((_0x4488ee.preload = 'metadata'),
          (_0x4488ee.muted = true),
          (_0x4488ee.playsInline = true),
          (_0x4488ee.onloadedmetadata = () => {
            const _0x51f1fd = Number(_0x4488ee.duration);
            _0x4f77f6(Number.isFinite(_0x51f1fd) && _0x51f1fd > 0 ? _0x51f1fd : 0);
          }),
          (_0x4488ee.onerror = () => _0x4f77f6(0)),
          void attachMediaElementPlaybackSource(_0x4488ee, _0x3c7d1c, { preload: 'metadata' }).catch(() => {
            !String(_0x4488ee.getAttribute?.('src') || _0x4488ee.src || '').trim() &&
              ((_0x4488ee.src = _0x3c7d1c), _0x4488ee.load?.());
          }));
      }),
    _0x238312 = async (_0x57cc51) => {
      const _0xca75db = _0x17dedc();
      if (_0xca75db > 0) return _0xca75db;
      const _0x5e05dc = _0x35e4da();
      if (_0x5e05dc)
        try {
          const _0x171960 = await fetchVideoMetaFromServer(_0x5e05dc),
            _0x3a5d4c = Number(_0x171960?.duration);
          if (Number.isFinite(_0x3a5d4c) && _0x3a5d4c > 0) return _0x3a5d4c;
        } catch {}
      return _0x18eb01(_0x57cc51);
    },
    _0x57d8b5 = async (_0x393745) => {
      if (await _0x192267()) return true;
      const _0x590135 = await _0x238312(_0x393745);
      if (Number.isFinite(_0x590135) && _0x590135 > VIDEO_HD_STANDARD_MAX_SECONDS + 0.05)
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
    _0x495fc5 = async (_0x3daac5, _0x3d5a10 = null) => {
      if (typeof window.refreshSubscriptionState === 'function')
        try {
          await window.refreshSubscriptionState();
        } catch {}
      const _0x505727 =
        typeof window.isModelAllowedBySubscription === 'function'
          ? window.isModelAllowedBySubscription(_0x3daac5, 'runninghubwf')
          : true;
      if (_0x505727) return true;
      if (typeof window.openSubscriptionDialog === 'function')
        window.openSubscriptionDialog({ modelId: _0x3daac5, provider: 'runninghubwf', onSuccess: _0x3d5a10 });
      else
        typeof window.handleSubscriptionRequired === 'function'
          ? await window.handleSubscriptionRequired({ modelId: _0x3daac5, provider: 'runninghubwf' })
          : window.showToast?.(videoToolbarText('hdVipRequired'), 'warn');
      return false;
    },
    _0x5115c1 = (_0x442a4f) => {
      const _0x3c605a = new Set(),
        _0x355d56 = [
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
        _0x2102da = (_0x46ec1d) => {
          const _0xf4d959 = String(_0x46ec1d || '').trim();
          if (!_0xf4d959) return '';
          if (_0xf4d959.startsWith('http://') || _0xf4d959.startsWith('https://')) return _0xf4d959;
          if (_0xf4d959.startsWith('/')) return _0xf4d959;
          const _0x50d82c = _0xf4d959.match(/https?:\/\/[^\s"'<>]+/);
          if (_0x50d82c?.[0]) return _0x50d82c[0];
          if (_0xf4d959.startsWith('{') || _0xf4d959.startsWith('['))
            try {
              return _0x536ba0(JSON.parse(_0xf4d959));
            } catch {}
          return '';
        },
        _0x536ba0 = (_0xd936d2) => {
          if (!_0xd936d2) return '';
          if (typeof _0xd936d2 === 'string') return _0x2102da(_0xd936d2);
          if (typeof _0xd936d2 !== 'object') return '';
          if (_0x3c605a.has(_0xd936d2)) return '';
          _0x3c605a.add(_0xd936d2);
          if (Array.isArray(_0xd936d2)) {
            for (const _0xb3c6cd of _0xd936d2) {
              const _0x54c05f = _0x536ba0(_0xb3c6cd);
              if (_0x54c05f) return _0x54c05f;
            }
            return '';
          }
          for (const _0x1fac67 of _0x355d56) {
            if (_0x1fac67 in _0xd936d2) {
              const _0x5c8e2b = _0x536ba0(_0xd936d2[_0x1fac67]);
              if (_0x5c8e2b) return _0x5c8e2b;
            }
          }
          for (const _0x29d355 of Object.keys(_0xd936d2)) {
            const _0x863b9 = _0x536ba0(_0xd936d2[_0x29d355]);
            if (_0x863b9) return _0x863b9;
          }
          return '';
        };
      return _0x536ba0(_0x442a4f);
    },
    _0x49c0ca = (_0x467693) => {
      return urlToLocalPath(_0x467693);
    },
    _0x559da9 = async (_0x2ce8dc) => {
      const _0x2ebcae = String(_0x2ce8dc || '').trim();
      if (!(_0x2ebcae.startsWith('http://') || _0x2ebcae.startsWith('https://')))
        throw new Error(videoToolbarText('saveInvalidUrl'));
      const _0x363f78 = new AbortController(),
        _0x10264f = setTimeout(() => _0x363f78.abort(), 0x1d4c0);
      let _0x330a89 = null;
      try {
        _0x330a89 = await fetchRemoteBlob(_0x2ebcae, { signal: _0x363f78.signal });
      } finally {
        clearTimeout(_0x10264f);
      }
      if (!_0x330a89) throw new Error(videoToolbarText('saveEmptyDownload'));
      const _0x5e13b0 = await saveOutputToServer(_0x330a89, { ext: 'mp4' }),
        _0x5af6f7 = pickResultLocalPath(_0x5e13b0);
      if (!_0x5e13b0?.success || !_0x5af6f7) throw new Error(videoToolbarText('saveMalformed'));
      return _0x5af6f7;
    },
    _0x29ba1b = async (_0x24f368) => {
      let _0x28be7f = _0x49c0ca(_0x24f368);
      if (!_0x28be7f && (_0x24f368.startsWith('http://') || _0x24f368.startsWith('https://')))
        try {
          (window.showToast?.(videoToolbarText('savingLocal'), 'info'),
            (_0x28be7f = await _0x559da9(_0x24f368)));
        } catch (_0x2f55e4) {
          const _0x3d2ca2 = _0x2f55e4 instanceof Error ? _0x2f55e4.message : String(_0x2f55e4 || ''),
            _0x45703c =
              _0x3d2ca2.includes('Failed to fetch') ||
              _0x3d2ca2.includes('NetworkError') ||
              _0x3d2ca2.toLowerCase().includes('cors');
          if (!_0x45703c) throw _0x2f55e4;
          const _0x26452a = await saveOutputFromUrlToServer({ url: _0x24f368, ext: 'mp4' }),
            _0x50448c = pickResultLocalPath(_0x26452a);
          if (_0x50448c) _0x28be7f = _0x50448c;
          else throw new Error(_0x26452a?.error || videoToolbarText('localSaveFailed'));
        }
      return _0x28be7f || '';
    },
    _0x2cf6c6 = {
      toolbarEl: _0x3c43fe,
      nodeData: _0x55042d,
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
      VIDEO_TOOLBAR_FOCUS_PADDING: _0x37ca23,
      VIDEO_TOOLBAR_FOCUS_DURATION_MS: _0x238415,
      VIDEO_TOOLBAR_FOCUS_MAX_ZOOM: _0x5de23e,
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
      _getLatestNodeData: _0x34a04e,
      _guessDownloadName: _0x5c9cdf,
      _triggerHrefDownload: _0x1b6ce8,
      _isProbablyLocalUrl: _0x2a84e6,
      _getCurrentVideoUrl: _0x433a84,
      _getCurrentVideoSource: _0x5e9058,
      _ensureVideoHdDurationAllowed: _0x57d8b5,
      _ensureVideoHdVipAllowed: _0x495fc5,
      _extractFirstUrl: _0x5115c1,
      _saveRemoteVideoResult: _0x29ba1b,
    };
  (bindStoryboardScriptToolbarAction(_0x2cf6c6),
    bindApimartPrivateAvatarAction(_0x2cf6c6),
    bindVideoClipAction(_0x2cf6c6),
    bindVideoExtractKeyframesAction(_0x2cf6c6),
    bindVideoSeparateAvAction(_0x2cf6c6),
    bindVideoReverseAction(_0x2cf6c6),
    bindVideoSmartClipAction(_0x2cf6c6),
    bindVideoKeyingAction(_0x2cf6c6),
    bindVideoRemoveAction(_0x2cf6c6),
    bindVideoFrameInterpolationAction(_0x2cf6c6),
    bindVideoHdAction(_0x2cf6c6),
    bindVideoDownloadAction(_0x2cf6c6),
    bindVideoFullscreenAction(_0x2cf6c6),
    bindVideoResetSizeAction(_0x2cf6c6));
}
