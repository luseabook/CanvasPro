import { buildPersonReplacementVideoRequest } from './personReplacementVideoRequest.js';
import {
  getPersonReplacementDetectionFeedback,
  recordPersonReplacementDetectionFailure,
} from './personReplacementDetectionFeedback.js';
import { createPersonReplacementCompletionNavigation } from './personReplacementCompletionNavigation.js';
import {
  PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
  PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
  PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME,
  createPersonReplacementProject,
  confirmPersonReplacementSourceCharacter,
  formatPersonReplacementPersonLabel,
  getPersonReplacementVideoResults,
  getPersonReplacementCharacterBaseImageRef,
  mergePersonReplacementSourceCharacters,
  normalizePersonReplacementOrientation,
  normalizePersonReplacementScope,
  splitPersonReplacementSourceCharacter,
} from './personReplacementProject.js';
import { resolvePersonReplacementVideoSlotState } from './personReplacementVideoInputs.js';
import {
  applyPersonReplacementCharacterAssetPromptPreset,
  createPersonReplacementImageGenerationMappingRevision,
  createPersonReplacementImagePromptRequestResolver,
  resolveGeneratedPersonReplacementAppearanceName,
} from './personReplacementImageGeneration.js';
import { createPersonReplacementImageTaskRuntime } from './personReplacementImageTaskRuntime.js';
import { getFirstSuccessfulImageRef } from './personReplacementCharacterAppearanceLocalization.js';
import { updatePersonReplacementVideoGenerationState } from './personReplacementVideoGeneration.js';
import { runPersonReplacementSmartClip } from './personReplacementSmartClipService.js';
import { createReplacementStudioWorkspace } from './personReplacementWorkspace.js';
import {
  PERSON_REPLACEMENT_WORKSPACE_INTENTS,
  createPersonReplacementWorkspaceIntentPort,
} from './personReplacementWorkspaceIntentPort.js';
import {
  createReplacementStudioProjectSession,
  normalizeReplacementStudioApplicationProject,
  settleInterruptedReplacementStudioProjectTasks,
} from './personReplacementProjectSession.js';
import { PERSON_REPLACEMENT_STEP_GATE_REASONS } from './personReplacementWorkflow.js';
import { createPersonReplacementOutputCoordinator } from './personReplacementOutputCoordinator.js';
import { createPersonReplacementVoiceSeparationRuntime } from './personReplacementVoiceSeparation.js';
import {
  PERSON_REPLACEMENT_OUTPUT_TRANSITIONS,
  transitionPersonReplacementOutput,
} from './personReplacementOutputLineage.js';
import {
  PERSON_REPLACEMENT_CUT_EPSILON_SEC,
  buildPersonReplacementDetectedShotCutRanges,
  normalizePersonReplacementShotCutRanges,
} from './personReplacementShotCutModel.js';
import { materializePersonReplacementShotPlayback } from './personReplacementShotReverse.js';
import { hydratePersonReplacementSourcePlaybackRefs } from './personReplacementSourcePlayback.js';
import {
  createPersonReplacementShotCutMutationCoordinator,
  createPersonReplacementShotReverseOperation,
} from './personReplacementShotCutMutationCoordinator.js';
import { createPersonReplacementVideoPreparationRunner } from './personReplacementVideoPreparation.js';
import { createPersonReplacementVideoTaskRuntime } from './personReplacementVideoTaskRuntime.js';
import { uploadPersonReplacementVideoResult } from './personReplacementVideoResultUpload.js';
import { resolvePersonReplacementCharacterImageBatchConcurrency } from './personReplacementBatchConcurrency.js';
import {
  buildPersonReplacementSourceCharacters,
  normalizePersonReplacementBoundingBox,
  orderAndRelabelPersonReplacementPeople,
} from './personReplacementSourceIdentity.js';
import { REPLACEMENT_STUDIO_NAME } from './replacementStudioTerminology.js';
import {
  normalizePersonReplacementProjectLibrary,
  removePersonReplacementProject,
  upsertPersonReplacementProject,
} from './personReplacementProjectLibrary.js';
import { createPersonReplacementProjectLibraryWorkspaceController } from './personReplacementProjectLibraryWorkspaceController.js';
import {
  detectPersonReplacementPeople,
  identifyPersonReplacementPeople,
} from '../../../api/personReplacementModelPackApi.js';
import { fetchVideoFirstFrameThumbFromServer } from '../../../api/videoThumbApi.js';
import { fetchVideoMetaFromServer } from '../../../api/videoMetaApi.js';
import { enqueueElectronMediaTask } from '../../../api/localMediaTaskApi.js';
import { initAudioVoicePanel } from '../audioVoicePanel.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
import {
  createTrackedMediaObjectUrl,
  revokeTrackedMediaObjectUrl,
} from '../../services/mediaObjectUrlRegistry.js';
import { buildCharacterAssetImageGenerationPayload } from '../characterAssets/characterAssetImageGeneration.js';
import { getModelManifest } from '../../manifests/index.js';
import { createWorkspacePersistenceCoordinator } from '../workspacePersistenceCoordinator.js';
import { buildPersonReplacementWorkspaceSnapshot } from './personReplacementWorkspaceSnapshot.js';
import { saveMediaDownload, saveMediaFilesDownload } from '../../services/downloadSaveService.js';
import { checkLocalMediaExists } from '../../services/projectService.js';
import { playCompletionSound } from '../../services/completionSoundService.js';
import { prepareImportedVideoAsset } from '../../services/importedVideoAssetService.js';
import { showGenerationCompleteNotification } from '../../services/completionNotificationService.js';
import {
  createPersonReplacementAppearanceAssetLibraryOperation,
  readPersonReplacementLibraryAssets,
} from './personReplacementAssetPackage.js';
import {
  bindPersonReplacementCharacterVoice,
  getPersonReplacementAudioSavedName,
  getPersonReplacementLibraryAudioRef,
} from './personReplacementVoiceLibrary.js';
function normalizeText(_0x27ca0a) {
  return String(_0x27ca0a ?? '')['trim']();
}
function resolveSmartClipFailureMessage(_0x4c6b9f) {
  const _0x31a77b = _0x4c6b9f?.['stages']?.['keyframes']?.['error'] || _0x4c6b9f?.['error'];
  if (normalizeText(_0x31a77b?.['code']) === 'no_results') return '视频无法读取有效时长或提取关键帧';
  return normalizeText(_0x31a77b?.['message'] || _0x31a77b) || '视频未检测到可用片段';
}
function cloneJson(_0x20f993) {
  return _0x20f993 && typeof _0x20f993 === 'object' ? JSON['parse'](JSON['stringify'](_0x20f993)) : _0x20f993;
}
function nowIso() {
  return new Date()['toISOString']();
}
function createId(_0x17312b) {
  const _0x559eb9 = globalThis['crypto']?.['randomUUID']?.();
  return _0x17312b + '-' + (_0x559eb9 || Date['now']() + '-' + Math['round'](Math['random']() * 0x186a0));
}
function resolveMediaRef(_0x4f805a) {
  if (typeof _0x4f805a === 'string') return normalizeText(_0x4f805a);
  return normalizeText(
    pickResultLocalPath(_0x4f805a) ||
      _0x4f805a?.['displayUrl'] ||
      _0x4f805a?.['videoUrl'] ||
      _0x4f805a?.['imageUrl'] ||
      _0x4f805a?.['url'] ||
      _0x4f805a?.['originalUrl'] ||
      _0x4f805a?.['path'],
  );
}
function resolveMediaUrl(_0x1d529e) {
  const _0x5229b4 = resolveMediaRef(_0x1d529e);
  return _0x5229b4 ? localPathToUrl(_0x5229b4) || _0x5229b4 : '';
}
function resolveDurationSec(_0x10e71c) {
  const _0x1929a7 = Number(
    _0x10e71c?.['durationSec'] ??
      _0x10e71c?.['videoDuration'] ??
      _0x10e71c?.['duration'] ??
      _0x10e71c?.['metadata']?.['duration'],
  );
  return Number['isFinite'](_0x1929a7) && _0x1929a7 > 0x0 ? _0x1929a7 : 0x0;
}
function resolveVideoThumbnailRef(_0x4f6a10) {
  return normalizeText(
    _0x4f6a10?.['posterLocalPath'] ||
      _0x4f6a10?.['thumbLocalPath'] ||
      _0x4f6a10?.['posterUrl'] ||
      _0x4f6a10?.['thumbUrl'],
  );
}
function resolveVideoPlaybackRef(_0x24cb85) {
  return normalizeText(
    normalizeLocalPath(_0x24cb85?.['displayLocalPath'] || _0x24cb85?.['displayUrl']) ||
      _0x24cb85?.['displayUrl'],
  );
}
function createProjectTitle(_0x390cd3) {
  return (
    normalizeText(_0x390cd3)
      ['replace'](/^.*[\\/]/u, '')
      ['replace'](/\.[^.]+$/u, '') || '未命名人物替换项目'
  );
}
function createUploadedAssetName(_0x5e73e6, _0x39256a) {
  return (
    normalizeText(_0x5e73e6)
      ['replace'](/^.*[\\/]/u, '')
      ['replace'](/\.[^.]+$/u, '') || _0x39256a
  );
}
const createApplicationProject = normalizeReplacementStudioApplicationProject;
function createInitialProject() {
  const _0x1f81e4 = nowIso();
  return createApplicationProject(
    createPersonReplacementProject({
      id: createId('person-replacement'),
      title: '未命名人物替换项目',
      status: 'draft',
      settings: {
        characterImageModelId: PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
        characterImageProvider: 'apimart',
        replacementImageModelId: PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
        replacementImageProvider: 'apimart',
        replacementModelId: PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
        replacementVideoInputMode: PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME,
        automationMode: 'review',
      },
      sources: [],
      characters: [],
      shots: [],
      workspace: { view: 'home', step: 0x1 },
      createdAt: _0x1f81e4,
      updatedAt: _0x1f81e4,
    }),
  );
}
function isPersistable(_0x33cc7c) {
  return Boolean(
    _0x33cc7c?.['characters']?.['length'] ||
    _0x33cc7c?.['shots']?.['length'] ||
    (_0x33cc7c?.['status'] && _0x33cc7c['status'] !== 'draft'),
  );
}
export function createReplacementStudioApplication({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  mountTarget: mountTarget = '#v2-wrap',
  uploadFile: _0x512566,
  prepareUploadedVideoAsset: prepareUploadedVideoAsset = prepareImportedVideoAsset,
  checkMediaExists: checkMediaExists = checkLocalMediaExists,
  generateCharacterImage: _0x190c33,
  generateReplacementImage: generateReplacementImage = _0x190c33,
  promptEnhancement: promptEnhancement = {},
  resumeReplacementImage: _0x1e6b20,
  createLocationGuide: _0x535ca6,
  generateReplacementVideo: _0x279d83,
  resolveInstallId: _0x2f7601,
  loadWorkspace: _0x237915,
  saveWorkspace: _0x300ca7,
  runSmartClip: runSmartClip = runPersonReplacementSmartClip,
  fetchFirstFrame: fetchFirstFrame = fetchVideoFirstFrameThumbFromServer,
  fetchVideoMeta: fetchVideoMeta = fetchVideoMetaFromServer,
  detectPeople: detectPeople = detectPersonReplacementPeople,
  identifyPeople: identifyPeople = identifyPersonReplacementPeople,
  createWorkspace: createWorkspace = createReplacementStudioWorkspace,
  createVoicePanel: createVoicePanel = initAudioVoicePanel,
  enqueueMediaTask: enqueueMediaTask = enqueueElectronMediaTask,
  playCompletion: playCompletion = playCompletionSound,
  showCompletionNotification: showCompletionNotification = showGenerationCompleteNotification,
  saveMedia: saveMedia = saveMediaDownload,
  saveMediaFiles: saveMediaFiles = saveMediaFilesDownload,
  saveAssetPackageItem: saveAssetPackageItem = null,
  persistOutputFromUrl: persistOutputFromUrl = null,
  createOutputCanvas: createOutputCanvas = null,
  listLibraryAssets: listLibraryAssets = () => [],
  subscribeLibraryAssets: subscribeLibraryAssets = null,
  projectPackages: projectPackages = null,
  onRequestClose: onRequestClose = () => {},
  showToast: showToast = windowObject?.['showToast']?.['bind']?.(windowObject) || (() => {}),
} = {}) {
  let _0xe9c0bd = createInitialProject();
  const _0x3eaa65 = createReplacementStudioProjectSession({ initialProject: _0xe9c0bd, now: nowIso }),
    _0x3b6bc2 = _0x3eaa65['subscribe']((_0xbc6110) => {
      ((_0xe9c0bd = _0xbc6110['project']),
        _0xbc6110['source'] === 'workspace' &&
          _0xbc6110['reason'] === 'step-change' &&
          _0xbc6110['previousProject']?.['workspace']?.['step'] !== 0x3 &&
          _0xbc6110['project']['workspace']?.['step'] === 0x3 &&
          void _0x2ec16b());
    });
  let _0x1ec899 = normalizePersonReplacementProjectLibrary(),
    _0x2dbb02 = 'home',
    _0x57c10b = null,
    _0x18c393 = ![],
    _0x334ccd = ![],
    _0x201794 = { status: typeof _0x300ca7 === 'function' ? 'saved' : 'idle', error: '', retryAttempt: 0x0 },
    _0x5ac375 = null,
    _0x2cca4f = null,
    _0x5ec987 = null,
    _0x10a855 = null,
    _0x230249 = () => {};
  const _0x4a9284 = new Set(),
    _0x5ac56a = new Set(),
    _0x250ad6 = createPersonReplacementShotCutMutationCoordinator(),
    _0xf5479 = new Map(),
    _0x1b4c7a = (_0x252d13 = {}) => {
      void Promise['allSettled']([
        Promise['resolve']()['then'](() => playCompletion?.('generation-success')),
        Promise['resolve']()['then'](() => showCompletionNotification?.(_0x252d13)),
      ])['then']((_0x2e44a5) => {
        _0x2e44a5['forEach']((_0xc41233) => {
          if (_0xc41233['status'] !== 'rejected') return;
          console['warn']('[replacementStudio] completion feedback failed', _0xc41233['reason']);
        });
      });
    },
    _0x2adddd = ({
      kind: kind = 'image',
      mediaRef: mediaRef = '',
      projectId: projectId = _0xe9c0bd['id'],
    } = {}) => {
      const _0x46999f = kind === 'video',
        _0x52b7ca = kind === 'asset';
      _0x1b4c7a({
        navigation: {
          source: 'replacement-studio',
          projectId: projectId,
          step: _0x46999f ? 0x3 : _0x52b7ca ? 0x1 : 0x2,
        },
        body: _0x46999f
          ? '人物替换视频生成完成。'
          : _0x52b7ca
            ? '人物形象生成完成。'
            : '人物替换首帧生成完成。',
        mediaKind: _0x46999f ? 'video' : 'image',
        node: {
          name: _0x46999f ? '人物替换视频' : _0x52b7ca ? '人物形象' : '人物替换首帧',
          ...(_0x46999f ? { videoUrl: mediaRef } : { imageUrl: mediaRef }),
        },
      });
    },
    _0x46d4ae = ({
      kind: kind = 'image',
      projectId: projectId = _0xe9c0bd['id'],
      totalCount: totalCount = 0x0,
      successCount: successCount = 0x0,
    } = {}) => {
      const _0x4e9a43 = Math['max'](0x0, Math['trunc'](Number(totalCount) || 0x0));
      if (!_0x4e9a43) return ![];
      const _0x477e2a = Math['max'](0x0, Math['min'](_0x4e9a43, Math['trunc'](Number(successCount) || 0x0))),
        _0x41eb12 = _0x4e9a43 - _0x477e2a,
        _0x3d594b = kind === 'asset' ? '人物形象' : kind === 'video' ? '替换视频' : '替换首帧';
      return (
        _0x1b4c7a({
          body:
            _0x41eb12 > 0x0
              ? '批量' + _0x3d594b + '生成已结束：成功 ' + _0x477e2a + ' 个，失败 ' + _0x41eb12 + ' 个。'
              : _0x4e9a43 + '\x20个' + _0x3d594b + '已全部生成完成。',
          navigation: {
            source: 'replacement-studio',
            projectId: projectId,
            step: kind === 'video' ? 0x3 : kind === 'asset' ? 0x1 : 0x2,
          },
        }),
        !![]
      );
    };
  async function _0x53d921(_0x27022b) {
    const _0x306459 = normalizeText(windowObject?.['__aicInstallId'] || globalThis['__aicInstallId']);
    if (getModelManifest(_0x27022b)?.['vip'] !== !![]) return _0x306459;
    try {
      const _0x521e07 =
        typeof _0x2f7601 === 'function'
          ? await _0x2f7601()
          : typeof windowObject?.['ensureSubscriptionInstallId'] === 'function'
            ? await windowObject['ensureSubscriptionInstallId']()
            : '';
      return normalizeText(_0x521e07) || _0x306459;
    } catch {
      return _0x306459;
    }
  }
  const _0x140793 = () => Boolean(_0x5ac375 || _0x4a9284['size'] || _0x5ac56a['size']),
    _0x4273eb = (_0x21df69 = _0xe9c0bd['id']) => {
      const _0x42feef = normalizeText(_0x21df69),
        _0x13a9e8 = _0x42feef === normalizeText(_0xe9c0bd['id']);
      return Boolean(
        (_0x13a9e8 && _0x5ac375) ||
        (_0x13a9e8 && _0x4a9284['size']) ||
        _0x2cca4f?.['hasActiveTasksForProject']?.(_0x42feef) ||
        _0x5ec987?.['hasActiveTasksForProject']?.(_0x42feef) ||
        (_0x13a9e8 && _0x5ac56a['size']),
      );
    },
    _0x59329a = () =>
      _0xe9c0bd['sources']['some'](
        (_0x2b5738) => normalizeText(_0x2b5738?.['processingStatus'])['toLowerCase']() === 'uploading',
      ),
    _0x499f19 = (_0x4b1ba7, _0x19a59d) => normalizeText(_0x4b1ba7) + '\x1f' + normalizeText(_0x19a59d),
    _0x4bdbc7 = (_0x45c889, _0x1dfe62 = _0xe9c0bd['id']) => {
      const _0x3f839f = _0x499f19(_0x1dfe62, _0x45c889),
        _0x524faa = _0xf5479['get'](_0x3f839f) || '';
      return (_0xf5479['delete'](_0x3f839f), _0x524faa);
    },
    _0x202ee0 = (_0x3a5dc9, _0x524ebf = _0xe9c0bd['id']) => {
      const _0x4f8efc = _0x4bdbc7(_0x3a5dc9, _0x524ebf);
      if (_0x4f8efc) revokeTrackedMediaObjectUrl(_0x4f8efc);
    },
    _0x2ca276 = (_0x2dc4d5 = '') => {
      const _0x55bde6 = normalizeText(_0x2dc4d5);
      [..._0xf5479['entries']()]['forEach'](([_0x2227eb, _0x239f78]) => {
        if (_0x55bde6 && !_0x2227eb['startsWith'](_0x55bde6 + '\x1f')) return;
        _0xf5479['delete'](_0x2227eb);
        if (_0x239f78) revokeTrackedMediaObjectUrl(_0x239f78);
      });
    },
    _0x386dd8 = (_0x533550, _0x4a2c9f) => {
      const _0x359475 = normalizeText(_0x4a2c9f);
      if (!_0x533550 || !_0x359475) return '';
      _0x202ee0(_0x359475);
      try {
        const _0x7c14f6 = createTrackedMediaObjectUrl(_0x533550, {
          kind: 'video',
          ownerId: 'person-replacement:' + _0xe9c0bd['id'] + ':' + _0x359475,
          sourceUrl: normalizeText(_0x533550['name']),
        });
        return (_0x7c14f6 && _0xf5479['set'](_0x499f19(_0xe9c0bd['id'], _0x359475), _0x7c14f6), _0x7c14f6);
      } catch {
        return '';
      }
    },
    _0x1996f1 = (_0x31584a = _0xe9c0bd) => {
      isPersistable(_0x31584a) && (_0x1ec899 = upsertPersonReplacementProject(_0x1ec899, _0x31584a));
    },
    _0x124687 = () => readPersonReplacementLibraryAssets(listLibraryAssets),
    _0x5b2624 = (_0x20ae8f = !![]) =>
      buildPersonReplacementWorkspaceSnapshot({
        project: _0xe9c0bd,
        sourcePreviewUrls: _0xf5479,
        persistenceState: _0x201794,
        workspaceView: _0x2dbb02,
        libraryProjects: _0x20ae8f ? _0x1ec899['projects'] : undefined,
        libraryAssets: _0x124687(),
      }),
    _0x4e09dd = (
      _0x47ee71,
      { error: error = '', retryAttempt: retryAttempt = _0x201794['retryAttempt'] } = {},
    ) => {
      return (
        (_0x201794 = {
          status: _0x47ee71,
          error: normalizeText(error),
          retryAttempt: Math['max'](0x0, Math['trunc'](Number(retryAttempt) || 0x0)),
        }),
        _0x57c10b?.['setPersistenceState']?.(cloneJson(_0x201794)),
        _0x201794
      );
    },
    _0x29a3ae = createWorkspacePersistenceCoordinator({
      ready: ![],
      debounceMs: 0x15e,
      save: _0x300ca7,
      getSnapshot: () => {
        return (_0x1996f1(), cloneJson(_0x1ec899));
      },
      setTimeoutFn: windowObject?.['setTimeout']?.['bind']?.(windowObject),
      clearTimeoutFn: windowObject?.['clearTimeout']?.['bind']?.(windowObject),
      onStateChange: ({ status: _0x583c34, error: _0x7e56f2, retryAttempt: _0x14953b }) => {
        _0x4e09dd(_0x583c34, { error: _0x7e56f2, retryAttempt: _0x14953b });
      },
      onError: (_0x40af93) => {
        console['warn']('[replacementStudio] persist failed', _0x40af93);
      },
    }),
    _0x5d3fcd = ({ force: force = ![] } = {}) =>
      _0x18c393 ? Promise['resolve'](null) : _0x29a3ae['flush']({ force: force }),
    _0x5094aa = () => {
      if (_0x18c393) return;
      _0x29a3ae['schedule']();
    },
    _0x535ac1 = () => _0x57c10b?.['setProject']?.(_0x5b2624()),
    _0x5460e1 = () => {
      if (typeof _0x57c10b?.['syncProjectState'] === 'function')
        return _0x57c10b['syncProjectState'](_0x5b2624(_0x2dbb02 !== 'project'), { returnSnapshot: ![] });
      return _0x535ac1();
    };
  _0x3eaa65['connect']({
    rememberProject: _0x1996f1,
    presentProject: ({ presentation: _0x4232c1 }) => {
      if (_0x4232c1 === 'state') return _0x5460e1();
      return _0x535ac1();
    },
    schedulePersistence: _0x5094aa,
  });
  const _0x19e007 = (
      _0x160c19,
      { persist: persist = !![], sync: sync = !![], renderWorkspace: renderWorkspace = !![] } = {},
    ) =>
      _0x3eaa65['replace'](_0x160c19, {
        persist: persist,
        presentation: !sync ? 'none' : renderWorkspace ? 'render' : 'state',
      }),
    _0x384e53 = async ({
      expectedProjectId: expectedProjectId = _0xe9c0bd['id'],
      renderWorkspace: renderWorkspace = !![],
    } = {}) => {
      const _0x70074d = normalizeText(expectedProjectId),
        _0xe16aee = cloneJson(_0xe9c0bd),
        _0xdc40a9 = await hydratePersonReplacementSourcePlaybackRefs(_0xe16aee, {
          checkMediaExists: checkMediaExists,
        });
      if (_0x18c393 || !_0xdc40a9['changed'] || normalizeText(_0xe9c0bd['id']) !== _0x70074d) return ![];
      const _0x26d37d = new Map(
        _0xdc40a9['project']['sources']['map']((_0x11f932) => [normalizeText(_0x11f932?.['id']), _0x11f932]),
      );
      let _0x5bde90 = ![];
      const _0x39f5bd = _0xe9c0bd['sources']['map']((_0x1ab22a) => {
        const _0xf21b8b = _0x26d37d['get'](normalizeText(_0x1ab22a?.['id']));
        if (
          !_0xf21b8b ||
          normalizeText(_0xf21b8b['videoRef']) !== normalizeText(_0x1ab22a['videoRef']) ||
          normalizeText(_0xf21b8b['playbackVideoRef']) === normalizeText(_0x1ab22a['playbackVideoRef'])
        )
          return _0x1ab22a;
        return (
          (_0x5bde90 = !![]),
          {
            ..._0x1ab22a,
            ...(_0xf21b8b['assetId'] ? { assetId: _0xf21b8b['assetId'] } : {}),
            playbackVideoRef: _0xf21b8b['playbackVideoRef'],
          }
        );
      });
      if (!_0x5bde90) return ![];
      return (_0x19e007({ ..._0xe9c0bd, sources: _0x39f5bd }, { renderWorkspace: renderWorkspace }), !![]);
    },
    _0x1e4b41 = (_0x21c305) => {
      const _0x740472 = normalizeText(_0x21c305);
      if (!_0x740472) return null;
      if (normalizeText(_0xe9c0bd['id']) === _0x740472) return cloneJson(_0xe9c0bd);
      const _0x3fe78e = _0x1ec899['projects']['find'](
        (_0x10a663) => normalizeText(_0x10a663?.['id']) === _0x740472,
      );
      return _0x3fe78e ? createApplicationProject(_0x3fe78e, _0x3fe78e) : null;
    },
    _0x54fe25 = (
      _0xe942b7,
      _0x4f4c77,
      { persist: persist = !![], renderWorkspace: renderWorkspace = ![] } = {},
    ) => {
      const _0x461521 = normalizeText(_0xe942b7 || _0x4f4c77?.['id']);
      if (!_0x461521 || normalizeText(_0x4f4c77?.['id']) !== _0x461521) return null;
      if (normalizeText(_0xe9c0bd['id']) === _0x461521)
        return _0x19e007(_0x4f4c77, { persist: persist, renderWorkspace: renderWorkspace });
      const _0x48aa53 = _0x1ec899['projects']['find'](
        (_0x231e9d) => normalizeText(_0x231e9d?.['id']) === _0x461521,
      );
      if (!_0x48aa53) return null;
      const _0x5762ba = normalizeText(_0xe9c0bd['id']),
        _0x2ea511 = createApplicationProject(_0x4f4c77, _0x48aa53);
      ((_0x1ec899 = upsertPersonReplacementProject(_0x1ec899, _0x2ea511)),
        (_0x1ec899 = { ..._0x1ec899, currentProjectId: _0x5762ba || _0x1ec899['currentProjectId'] }));
      if (persist) _0x5094aa();
      if (_0x2dbb02 === 'home') _0x5460e1();
      return cloneJson(_0x2ea511);
    };
  _0x2cca4f = createPersonReplacementImageTaskRuntime({
    getProject: () => _0xe9c0bd,
    getProjectById: _0x1e4b41,
    commitProject: (_0x4f5356) => _0x19e007(_0x4f5356, { renderWorkspace: ![] }),
    commitProjectById: (_0x3b4878, _0x1efabc) => _0x54fe25(_0x3b4878, _0x1efabc, { renderWorkspace: ![] }),
    generateImage: generateReplacementImage,
    ...promptEnhancement,
    createLocationGuide: _0x535ca6,
    resumeImageTask: _0x1e6b20,
    createRequestId: () => createId('replacement-image-request'),
    resolvePromptRequest: createPersonReplacementImagePromptRequestResolver(),
    showToast: showToast,
    now: nowIso,
    notifyCompletion: _0x2adddd,
    persistNow: _0x5d3fcd,
  });
  const _0x3314d4 = createPersonReplacementAppearanceAssetLibraryOperation({
      getProject: () => _0xe9c0bd,
      setProject: _0x19e007,
      saveAssetPackageItem: saveAssetPackageItem,
      persistOutputFromUrl: persistOutputFromUrl,
      showToast: showToast,
    }),
    _0x4d3bb9 = () => {
      isPersistable(_0xe9c0bd) &&
        (_0x1996f1(),
        _0x3eaa65['replace'](createInitialProject(), {
          persist: ![],
          presentation: 'none',
          reason: 'fresh-import',
          touchUpdatedAt: ![],
        }));
    },
    _0xb1ac09 = (_0x24d870) => {
      const _0x2b676d = _0x1ec899['projects']['find'](
        (_0x354769) => _0x354769['id'] === normalizeText(_0x24d870),
      );
      if (!_0x2b676d) return null;
      const _0x4cada5 = normalizeText(_0x2b676d['id']) !== normalizeText(_0xe9c0bd['id']);
      if (_0x59329a() && _0x4cada5)
        return (showToast('素材正在上传，请等待上传完成或取消上传后再打开其他项目。', 'info'), null);
      if (_0x140793() && _0x4cada5)
        return (
          showToast(
            _0x5ac375
              ? '当前项目正在后台处理，请完成后再打开其他项目。'
              : '当前项目仍有任务处理中，请完成后再打开其他项目。',
            'info',
          ),
          null
        );
      (_0x3eaa65['replace'](_0x2b676d, {
        persist: ![],
        presentation: 'none',
        reason: 'open-project',
        touchUpdatedAt: ![],
      }),
        (_0x2dbb02 = 'project'),
        _0x535ac1(),
        void _0x384e53({ expectedProjectId: _0xe9c0bd['id'] }),
        void _0x2cca4f?.['resumeRecoverable']?.(),
        void _0x5ec987?.['resumeRecoverable']?.());
      if (_0xe9c0bd['workspace']['step'] === 0x3) void _0x2ec16b();
      return cloneJson(_0xe9c0bd);
    },
    _0x10f5ce = () => {
      _0x1996f1();
      if (_0x4273eb(_0xe9c0bd['id'])) return ((_0x2dbb02 = 'home'), _0x535ac1(), _0x5094aa(), _0x5b2624());
      return (
        _0x2ca276(_0xe9c0bd['id']),
        _0x3eaa65['replace'](createInitialProject(), {
          persist: ![],
          presentation: 'none',
          reason: 'show-project-home',
          touchUpdatedAt: ![],
        }),
        (_0x2dbb02 = 'home'),
        _0x535ac1(),
        _0x5094aa(),
        _0x5b2624()
      );
    },
    _0x3ddaaf = createPersonReplacementProjectLibraryWorkspaceController({
      getProject: () => _0xe9c0bd,
      getLibrary: () => _0x1ec899,
      setLibrary: (_0xb6c3dc) => {
        _0x1ec899 = _0xb6c3dc;
      },
      getProjectById: _0x1e4b41,
      rememberProject: _0x1996f1,
      hasActiveProjectTask: _0x4273eb,
      isProcessing: () => Boolean(_0x5ac375),
      replaceProject: (..._0x5bca9a) => _0x3eaa65['replace'](..._0x5bca9a),
      createApplicationProject: createApplicationProject,
      createInitialProject: createInitialProject,
      createId: createId,
      now: nowIso,
      cloneJson: cloneJson,
      syncWorkspace: _0x535ac1,
      schedulePersistence: _0x5094aa,
      snapshot: _0x5b2624,
      releaseAllSourcePreviews: _0x2ca276,
      openProject: _0xb1ac09,
      projectPackages: projectPackages,
      showToast: showToast,
    }),
    {
      archiveProject: _0x175d6e,
      collectProject: _0x266b3e,
      deleteProject: _0x589590,
      duplicateProject: _0x22e917,
      importProjectPackage: _0x2ff9b1,
      importProjectPackageResult: _0x10eaf2,
      renameProject: _0x538b36,
    } = _0x3ddaaf,
    _0x128a12 = ({ sourceId: _0x8efd8d } = {}) => {
      const _0x2d0482 = normalizeText(_0x8efd8d),
        _0x5d4927 = _0xe9c0bd['sources']['find']((_0x13de12) => _0x13de12['id'] === _0x2d0482);
      if (!_0x5d4927) return null;
      _0x202ee0(_0x2d0482);
      const _0x17f08a = _0xe9c0bd['sources']
          ['filter']((_0x284fc6) => _0x284fc6['id'] !== _0x2d0482)
          ['map']((_0x16902b, _0x29c6c5) => ({ ..._0x16902b, order: _0x29c6c5 })),
        _0x4d2dc5 = _0xe9c0bd['shots']['filter']((_0x4794aa) => _0x4794aa['sourceId'] !== _0x2d0482),
        _0x4d738b = new Set(
          _0x4d2dc5['flatMap']((_0x112619) =>
            _0x112619['people']
              ['map']((_0x29542c) => normalizeText(_0x29542c['sourceCharacterId']))
              ['filter'](Boolean),
          ),
        ),
        _0x3b359e = _0xe9c0bd['audio']['selectedSourceId'] === _0x2d0482,
        _0x399306 =
          Boolean(_0x5d4927['videoRef']) && _0xe9c0bd['audio']['originalAudioRef'] === _0x5d4927['videoRef'],
        _0x12527d = _0x3b359e ? _0x17f08a[0x0]?.['id'] || '' : _0xe9c0bd['audio']['selectedSourceId'],
        _0xadb1c5 = _0x17f08a['find']((_0x393021) => _0x393021['id'] === _0x12527d) || _0x17f08a[0x0] || null,
        _0x2cd6ef =
          Boolean(_0xe9c0bd['output']['originalMasterRef']) &&
          _0xe9c0bd['audio']['originalAudioRef'] === _0xe9c0bd['output']['originalMasterRef'],
        _0x2c467d =
          _0x399306 || _0x2cd6ef ? _0xadb1c5?.['videoRef'] || '' : _0xe9c0bd['audio']['originalAudioRef'],
        _0x34e67e = {
          ..._0xe9c0bd,
          title: _0x17f08a['length'] ? _0xe9c0bd['title'] : '未命名人物替换项目',
          status: _0x17f08a['length'] ? _0xe9c0bd['status'] : 'draft',
          source: _0x17f08a[0x0] || {},
          sources: _0x17f08a,
          shots: _0x4d2dc5,
          sourceCharacters: buildPersonReplacementSourceCharacters(_0x4d2dc5, _0xe9c0bd['sourceCharacters']),
          mappings: _0xe9c0bd['mappings']['filter']((_0x54a7c9) =>
            _0x4d738b['has'](normalizeText(_0x54a7c9['sourceCharacterId'])),
          ),
          audio: { ..._0xe9c0bd['audio'], originalAudioRef: _0x2c467d, selectedSourceId: _0x12527d },
        },
        _0x37712d =
          _0x4d2dc5['length'] === _0xe9c0bd['shots']['length']
            ? _0x34e67e
            : transitionPersonReplacementOutput(_0x34e67e, {
                type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['SOURCE_GRAPH_CHANGED'],
                nextOriginalAudioRef: _0x2c467d,
              }),
        _0x3e64f7 = !_0x17f08a['length'] && !_0x4d2dc5['length'] && !_0xe9c0bd['characters']['length'];
      return (
        _0x3e64f7
          ? ((_0x1ec899 = removePersonReplacementProject(_0x1ec899, _0xe9c0bd['id'])),
            _0x3eaa65['replace'](
              { ..._0x37712d, updatedAt: nowIso() },
              { persist: ![], presentation: 'none', reason: 'remove-final-source', touchUpdatedAt: ![] },
            ),
            _0x535ac1(),
            _0x5094aa())
          : _0x19e007(_0x37712d),
        _0x5b2624()
      );
    };
  async function _0x2e0f9d(_0x1940e3 = []) {
    const _0x3b5c0b = (Array['isArray'](_0x1940e3) ? _0x1940e3 : [_0x1940e3])['filter'](Boolean);
    if (!_0x3b5c0b['length']) return { ok: ![], reason: 'missing-file' };
    if (_0x5ac375)
      return (
        showToast('当前项目正在后台处理，请完成后再新建项目。', 'info'),
        { ok: ![], reason: 'already-running' }
      );
    if (typeof _0x512566 !== 'function') throw new Error(REPLACEMENT_STUDIO_NAME + '缺少素材上传服务');
    if (_0x2dbb02 !== 'home') _0x2dbb02 = 'home';
    _0x4d3bb9();
    const _0x41557e = [..._0xe9c0bd['sources']],
      _0x36e1a6 = _0x3b5c0b['map']((_0x495b40, _0x28f07f) => ({
        id: createId('source'),
        fileName: normalizeText(_0x495b40['name']) || '视频 ' + (_0x41557e['length'] + _0x28f07f + 0x1),
        videoRef: '',
        processingStatus: 'uploading',
        processingProgress: 0x0,
        order: _0x41557e['length'] + _0x28f07f,
      }));
    (_0x36e1a6['forEach']((_0x1a4579, _0x5368ce) => {
      _0x386dd8(_0x3b5c0b[_0x5368ce], _0x1a4579['id']);
    }),
      _0x19e007({
        ..._0xe9c0bd,
        title:
          _0xe9c0bd['title'] === '未命名人物替换项目'
            ? createProjectTitle(_0x3b5c0b[0x0]?.['name'])
            : _0xe9c0bd['title'],
        sources: [..._0x41557e, ..._0x36e1a6],
        source: _0x41557e[0x0] || _0x36e1a6[0x0],
        workspace: { ..._0xe9c0bd['workspace'], view: 'home', step: 0x1 },
      }));
    const _0x4487cf = [];
    for (let _0x191a4d = 0x0; _0x191a4d < _0x3b5c0b['length']; _0x191a4d += 0x1) {
      const _0x16d394 = _0x3b5c0b[_0x191a4d],
        _0x4f4845 = _0x36e1a6[_0x191a4d];
      try {
        const _0x159782 = await _0x512566(_0x16d394, _0xe9c0bd['id']),
          _0x309c39 = resolveMediaRef(_0x159782);
        if (!_0x309c39) throw new Error('源视频保存结果缺少可用地址');
        const _0x55207d = resolveVideoPlaybackRef(_0x159782),
          _0xb9b5ea = resolveDurationSec(_0x159782),
          _0x517392 = resolveVideoThumbnailRef(_0x159782);
        if (!_0xe9c0bd['sources']['some']((_0x262bf5) => _0x262bf5['id'] === _0x4f4845['id'])) continue;
        _0x4487cf['push'](_0x159782);
        const _0x154bff = _0x517392 ? _0x4bdbc7(_0x4f4845['id']) : '';
        _0x19e007({
          ..._0xe9c0bd,
          sources: _0xe9c0bd['sources']['map']((_0x50a38f) =>
            _0x50a38f['id'] === _0x4f4845['id']
              ? {
                  ..._0x50a38f,
                  assetId: normalizeText(_0x159782?.['assetId']),
                  videoRef: _0x309c39,
                  playbackVideoRef: _0x55207d,
                  thumbnailRef: _0x517392,
                  durationSec: _0xb9b5ea || _0x50a38f['durationSec'],
                  processingStatus: 'ready-to-start',
                  processingProgress: 0x0,
                }
              : _0x50a38f,
          ),
          audio: _0xe9c0bd['audio']['originalAudioRef']
            ? _0xe9c0bd['audio']
            : { ..._0xe9c0bd['audio'], originalAudioRef: _0x309c39, selectedSourceId: _0x4f4845['id'] },
        });
        if (_0x154bff) revokeTrackedMediaObjectUrl(_0x154bff);
      } catch (_0x5d8183) {
        (_0x19e007({
          ..._0xe9c0bd,
          sources: _0xe9c0bd['sources']['map']((_0x1ebe36) =>
            _0x1ebe36['id'] === _0x4f4845['id']
              ? { ..._0x1ebe36, processingStatus: 'failed', error: _0x5d8183?.['message'] || '视频上传失败' }
              : _0x1ebe36,
          ),
        }),
          showToast(_0x5d8183?.['message'] || '视频上传失败', 'error'));
      }
    }
    const _0x274779 = _0xe9c0bd['sources']['filter']((_0x1ea026) => _0x1ea026['videoRef'])['length'];
    if (_0x274779) showToast('已加入 ' + _0x274779 + '\x20个视频。', 'success');
    return { ok: _0x274779 > 0x0, project: _0x5b2624(), sources: _0x4487cf };
  }
  async function _0x508263(_0x2c40cc) {
    const { personDetection: _0x1b08c4, ..._0x2623b0 } = _0x2c40cc;
    if (!_0x2c40cc['keyframeRef'])
      return (
        recordPersonReplacementDetectionFailure(_0x2c40cc, new Error('人物检测缺少首帧图片')),
        { ..._0x2623b0, error: '人物检测缺少首帧图片', analysisStatus: 'failed', reviewRequired: !![] }
      );
    try {
      const _0x5caeb0 =
          _0x1b08c4 && typeof _0x1b08c4 === 'object' && Array['isArray'](_0x1b08c4['people'])
            ? _0x1b08c4
            : await detectPeople(_0x2c40cc['keyframeRef'], { maxPeople: 0x20 }),
        _0x32c95b = [..._0x5caeb0['people']]['sort']((_0x4d5877, _0x39b301) => {
          const _0x5739d6 = Number(_0x4d5877?.['bbox']?.['x']) || 0x0,
            _0x2a86a9 = Number(_0x39b301?.['bbox']?.['x']) || 0x0,
            _0x3f7e04 = Number(_0x4d5877?.['bbox']?.['y']) || 0x0,
            _0xcc8f0e = Number(_0x39b301?.['bbox']?.['y']) || 0x0;
          return _0x5739d6 - _0x2a86a9 || _0x3f7e04 - _0xcc8f0e;
        }),
        _0x4c1af8 = _0x32c95b['map']((_0x3bb24d, _0x53d85e) => ({
          id: _0x2c40cc['id'] + '-person-' + (_0x53d85e + 0x1),
          sourceCharacterId: _0x2c40cc['sourceId'] + '-' + _0x2c40cc['id'] + '-person-' + (_0x53d85e + 0x1),
          targetCharacterId: '',
          targetAppearanceId: '',
          label: formatPersonReplacementPersonLabel(_0x53d85e),
          detectionClass:
            !normalizeText(_0x3bb24d['className']) ||
            normalizeText(_0x3bb24d['className'])['toLowerCase']() === 'person'
              ? 'person'
              : 'character',
          detectionMethod: 'automatic',
          bbox: _0x3bb24d['bbox'],
          detectionConfidence: _0x3bb24d['confidence'],
          identityConfidence: 0x0,
          identityMatchSimilarity: 0x0,
          identityReviewStatus: 'confirmed',
          identityReviewRequired: ![],
          identityMethod: 'fallback',
          ambiguousIdentityIds: [],
          orientationConfidence: Number(_0x3bb24d['orientationConfidence']) || 0x0,
          orientation: _0x3bb24d['orientation'] || 'unknown',
          orientationModelId: _0x3bb24d['orientationModelId'] || '',
          occlusion: 'none',
        }));
      return {
        ..._0x2623b0,
        frame: _0x5caeb0['frame'],
        people: _0x4c1af8,
        analysisStatus: 'succeeded',
        reviewRequired: _0x4c1af8['length'] === 0x0,
      };
    } catch (_0x2cdd2c) {
      return (
        recordPersonReplacementDetectionFailure(_0x2c40cc, _0x2cdd2c),
        {
          ..._0x2623b0,
          people: [],
          analysisStatus: 'failed',
          reviewRequired: !![],
          error: [_0x2c40cc['error'], _0x2cdd2c?.['message'] || '人物检测失败']
            ['filter'](Boolean)
            ['join']('；'),
        }
      );
    }
  }
  async function _0x250837(_0x4d5d04) {
    const _0x4082ce = (Array['isArray'](_0x4d5d04) ? _0x4d5d04 : [])['filter'](
      (_0x135c57) => _0x135c57['keyframeRef'] && _0x135c57['people']['length'],
    );
    if (!_0x4082ce['length'] || typeof identifyPeople !== 'function')
      return {
        shots: _0x4d5d04,
        sourceCharacters: buildPersonReplacementSourceCharacters(_0x4d5d04, _0xe9c0bd['sourceCharacters']),
        analysis: {
          status: _0x4082ce['length'] ? 'failed' : 'succeeded',
          modelId: '',
          stats: { identityCount: 0x0, reviewCount: 0x0 },
          error: _0x4082ce['length'] ? '人物身份分析服务尚未初始化' : '',
        },
      };
    try {
      const _0x510ad4 = new Map(
          _0xe9c0bd['sources']['map']((_0x498649, _0x3e034f) => [
            _0x498649['id'],
            _0x498649['order'] ?? _0x3e034f,
          ]),
        ),
        _0x3e4b4 = await identifyPeople(
          _0x4082ce['map']((_0x204f52, _0x4d2e24) => ({
            shotId: _0x204f52['id'],
            sourceId: _0x204f52['sourceId'],
            sourceOrder: _0x510ad4['get'](_0x204f52['sourceId']) ?? 0x0,
            shotIndex: _0x204f52['index'] ?? _0x4d2e24,
            shotTimeSec: _0x204f52['keyframeTimeSec'] ?? _0x204f52['startTimeSec'],
            imageRef: _0x204f52['keyframeRef'],
            people: _0x204f52['people']['map']((_0x5192f6) => ({
              personId: _0x5192f6['id'],
              bbox: _0x5192f6['locator']?.['bbox'] || _0x5192f6['bbox'],
              detectionConfidence: _0x5192f6['detectionConfidence'],
            })),
          })),
          {
            autoThreshold: _0xe9c0bd['settings']['identityAutoThreshold'],
            reviewThreshold: _0xe9c0bd['settings']['identityReviewThreshold'],
            ambiguityMargin: _0xe9c0bd['settings']['identityAmbiguityMargin'],
            maxShotGap: 0x2,
          },
        ),
        _0x1d7c3f = new Map(
          (_0x3e4b4['assignments'] || [])['map']((_0x338334) => [
            _0x338334['shotId'] + ':' + _0x338334['personId'],
            _0x338334,
          ]),
        ),
        _0x81b461 = _0x4d5d04['map']((_0x5f59cf) => ({
          ..._0x5f59cf,
          people: _0x5f59cf['people']['map']((_0x32995f) => {
            const _0x10f3b1 = _0x1d7c3f['get'](_0x5f59cf['id'] + ':' + _0x32995f['id']);
            if (!_0x10f3b1)
              return {
                ..._0x32995f,
                identityReviewStatus: 'confirmed',
                identityReviewRequired: ![],
                identityMethod: 'fallback',
              };
            return {
              ..._0x32995f,
              sourceCharacterId: _0x10f3b1['sourceCharacterId'],
              label: _0x32995f['label'] || _0x10f3b1['label'],
              identityConfidence: _0x10f3b1['identityConfidence'],
              identityMatchSimilarity: _0x10f3b1['matchSimilarity'],
              identityReviewStatus: 'confirmed',
              identityReviewRequired: ![],
              identityMethod: 'osnet',
              ambiguousIdentityIds: _0x10f3b1['ambiguousIdentityIds'] || [],
              notes: _0x10f3b1['notes'] || _0x32995f['notes'],
            };
          }),
        })),
        _0x377b20 = new Map(
          (_0x3e4b4['identities'] || [])['map']((_0x21cec2) => [_0x21cec2['id'], _0x21cec2]),
        ),
        _0x51d9b0 = buildPersonReplacementSourceCharacters(_0x81b461, _0xe9c0bd['sourceCharacters'])['map'](
          (_0x39eec5) => {
            const _0x39ab7e = _0x377b20['get'](_0x39eec5['id']);
            return _0x39ab7e
              ? {
                  ..._0x39eec5,
                  name: _0x39ab7e['name'] || _0x39eec5['name'],
                  confidence: _0x39ab7e['confidence'],
                  reviewRequired: ![],
                  identityReviewStatus: 'confirmed',
                  memberCount: _0x39ab7e['memberCount'] || _0x39eec5['memberCount'],
                  exemplarShotId: _0x39ab7e['exemplarShotId'] || _0x39eec5['exemplarShotId'],
                  exemplarPersonId: _0x39ab7e['exemplarPersonId'] || _0x39eec5['exemplarPersonId'],
                  ambiguousIdentityIds: _0x39ab7e['ambiguousIdentityIds'] || [],
                  notes: _0x39ab7e['notes'] || _0x39eec5['notes'],
                }
              : _0x39eec5;
          },
        );
      return {
        shots: _0x81b461,
        sourceCharacters: _0x51d9b0,
        analysis: {
          status: 'succeeded',
          modelId: _0x3e4b4['modelId'],
          stats: { ...(_0x3e4b4['stats'] || {}), reviewCount: 0x0 },
          error: '',
        },
      };
    } catch (_0x4a6c0e) {
      const _0x183419 = _0x4d5d04['map']((_0x58eef) => ({
          ..._0x58eef,
          people: _0x58eef['people']['map']((_0x4ea565) => ({
            ..._0x4ea565,
            identityReviewStatus: 'confirmed',
            identityReviewRequired: ![],
            identityMethod: 'fallback',
          })),
        })),
        _0x2e5272 = _0x4a6c0e?.['message'] || '跨镜头人物身份分析失败';
      return (
        showToast(_0x2e5272 + '；已保留逐镜头人物，可按需拆分纠正。', 'warn'),
        {
          shots: _0x183419,
          sourceCharacters: buildPersonReplacementSourceCharacters(_0x183419, _0xe9c0bd['sourceCharacters']),
          analysis: {
            status: 'failed',
            modelId: '',
            stats: {
              identityCount: _0x183419['reduce'](
                (_0x3227f6, _0x9ee931) => _0x3227f6 + _0x9ee931['people']['length'],
                0x0,
              ),
              reviewCount: 0x0,
            },
            error: _0x2e5272,
          },
        }
      );
    }
  }
  async function _0x3430f2(_0x1030e8, _0x3ebc79, _0x5b41f8, _0x790d35) {
    const _0x1f8cfd = await runSmartClip({
      source: _0x1030e8['videoRef'],
      options: {
        mode: _0xe9c0bd['settings']['smartClipMode'],
        fps: _0xe9c0bd['settings']['smartClipFps'],
        unlimitedSegments: !![],
        ...(_0x3ebc79 === 'skip' ? { preserveWholeVideo: !![] } : {}),
      },
      signal: _0x5b41f8,
      onProgress: (_0x519c8c) => {
        const _0x261f44 = Number(_0x519c8c?.['progress']),
          _0x4c4ef1 = Number(_0x519c8c?.['pct']),
          _0x3a3eaf = Number['isFinite'](_0x261f44)
            ? _0x261f44
            : Number['isFinite'](_0x4c4ef1)
              ? _0x4c4ef1 / 0x64
              : 0x0,
          _0x489ce3 = _0x519c8c?.['phase'] === 'keyframes' ? 0x2d : 0x5,
          _0x4eaa1d = Math['min'](0x58, Math['round'](_0x489ce3 + _0x3a3eaf * 0x28)),
          _0x3c8275 = Math['round'](((_0x790d35 + _0x4eaa1d / 0x64) / _0xe9c0bd['sources']['length']) * 0x5a);
        _0x19e007(
          {
            ..._0xe9c0bd,
            sources: _0xe9c0bd['sources']['map']((_0x4901a3) =>
              _0x4901a3['id'] === _0x1030e8['id']
                ? {
                    ..._0x4901a3,
                    processingStatus:
                      _0x519c8c?.['phase'] === 'keyframes' ? 'extracting-keyframes' : 'cutting',
                    processingProgress: _0x4eaa1d,
                  }
                : _0x4901a3,
            ),
            workspace: {
              ..._0xe9c0bd['workspace'],
              sourceAnalysis: { status: 'cutting', progress: _0x3c8275 },
            },
          },
          { persist: ![], renderWorkspace: ![] },
        );
      },
    });
    if (!_0x1f8cfd?.['shotBundles']?.['length']) throw new Error(resolveSmartClipFailureMessage(_0x1f8cfd));
    return _0x1f8cfd['shotBundles']['map']((_0x4f1108, _0x4cc0be) => {
      const _0x584308 = normalizeText(_0x4f1108['clipRef']);
      return {
        id: _0x1030e8['id'] + '-' + (_0x4f1108['id'] || 'shot-' + (_0x4cc0be + 0x1)),
        sourceId: _0x1030e8['id'],
        index: _0x4cc0be,
        startTimeSec: _0x4f1108['start'],
        endTimeSec: _0x4f1108['end'],
        durationSec: _0x4f1108['duration'],
        sourceVideoRef: _0x1030e8['videoRef'],
        videoRef: _0x584308,
        keyframeRef: _0x4f1108['keyframeRef'],
        keyframeIndex: _0x4f1108['keyframeIndex'],
        keyframeTimeSec: _0x4f1108['keyframeTimeSec'],
        personDetection: _0x4f1108['personDetection'],
        outputFps: _0x4f1108['fps'] || 0x18,
        materializationStatus: _0x584308 ? 'succeeded' : 'pending',
        materializationProgress: _0x584308 ? 0x64 : 0x0,
        people: [],
        analysisStatus: _0x4f1108['keyframeRef'] ? 'running' : 'failed',
        reviewRequired: !![],
        generationStatus: 'pending',
        error: (_0x4f1108['errors'] || [])
          ['map']((_0x8726c5) => _0x8726c5?.['message'])
          ['filter'](Boolean)
          ['join']('；'),
      };
    });
  }
  async function _0xffb9b5({ mode: mode = 'cut' } = {}) {
    const _0x289a67 = _0xe9c0bd['sources']['filter']((_0xcdd9fc) => _0xcdd9fc['videoRef']);
    if (!_0x289a67['length'])
      return (showToast('请先加入视频。', 'warn'), { ok: ![], reason: 'missing-source' });
    if (_0x5ac375) return { ok: ![], reason: 'already-running' };
    ((_0x2dbb02 = 'project'), (_0x5ac375 = new AbortController()));
    const _0x58cf48 = _0x5ac375['signal'];
    (_0x19e007({
      ..._0xe9c0bd,
      status: 'analyzing',
      settings: { ..._0xe9c0bd['settings'], processingMode: mode },
      workspace: {
        ..._0xe9c0bd['workspace'],
        view: 'project',
        step: 0x1,
        sourceAnalysis: { status: mode === 'skip' ? 'extracting-keyframes' : 'cutting', progress: 0x3 },
      },
      sources: _0xe9c0bd['sources']['map']((_0x1fa4f6) =>
        _0x1fa4f6['videoRef']
          ? {
              ..._0x1fa4f6,
              processingStatus: mode === 'skip' ? 'extracting-keyframes' : 'cutting',
              processingProgress: 0x3,
              error: '',
            }
          : _0x1fa4f6,
      ),
    }),
      showToast(
        mode === 'skip'
          ? '已进入素材设定，正在后台扫描完整视频并检测人物关键帧。'
          : '已进入素材设定，正在后台分析镜头并检测人物关键帧。',
        'info',
      ));
    try {
      const _0x105fd4 = [];
      for (let _0x360f9e = 0x0; _0x360f9e < _0x289a67['length']; _0x360f9e += 0x1) {
        if (_0x58cf48['aborted']) return { ok: ![], reason: 'cancelled' };
        const _0x3d892b = _0x289a67[_0x360f9e],
          _0x518a8f = await _0x3430f2(_0x3d892b, mode, _0x58cf48, _0x360f9e);
        for (const _0x30e9d4 of _0x518a8f) {
          const _0x3c331b = await _0x508263(_0x30e9d4);
          _0x105fd4['push'](_0x3c331b);
        }
        _0x19e007(
          {
            ..._0xe9c0bd,
            shots: [..._0x105fd4],
            sources: _0xe9c0bd['sources']['map']((_0x289d82) =>
              _0x289d82['id'] === _0x3d892b['id']
                ? { ..._0x289d82, processingStatus: 'ready', processingProgress: 0x64, error: '' }
                : _0x289d82,
            ),
            sourceCharacters: buildPersonReplacementSourceCharacters(
              _0x105fd4,
              _0xe9c0bd['sourceCharacters'],
            ),
            workspace: {
              ..._0xe9c0bd['workspace'],
              selectedShotId: _0x105fd4[0x0]?.['id'] || '',
              sourceAnalysis: {
                status: 'detecting',
                progress: Math['round'](((_0x360f9e + 0x1) / _0x289a67['length']) * 0x64),
              },
            },
          },
          { renderWorkspace: ![] },
        );
      }
      _0x19e007(
        {
          ..._0xe9c0bd,
          shots: _0x105fd4,
          workspace: {
            ..._0xe9c0bd['workspace'],
            sourceAnalysis: { status: 'identifying', progress: 0x5e },
            identityAnalysis: { status: 'running', modelId: '', stats: {}, error: '' },
          },
        },
        { persist: ![], renderWorkspace: ![] },
      );
      const _0x4f9e14 = await _0x250837(_0x105fd4),
        _0x8eb764 = _0x4f9e14['shots'];
      _0x19e007(
        {
          ..._0xe9c0bd,
          shots: _0x8eb764,
          sourceCharacters: _0x4f9e14['sourceCharacters'],
          workspace: {
            ..._0xe9c0bd['workspace'],
            step: 0x1,
            selectedShotId: _0x8eb764[0x0]?.['id'] || '',
            sourceAnalysis: { status: 'identifying', progress: 0x60 },
            identityAnalysis: _0x4f9e14['analysis'],
          },
        },
        { persist: ![], renderWorkspace: ![] },
      );
      const _0x312b8a = await _0x2ec16b({ notify: ![], renderWorkspace: ![] });
      if (!_0x312b8a['ok'])
        throw new Error(
          _0x312b8a['failures']
            ?.['map']((_0xa5604a) => _0xa5604a['message'])
            ['filter'](Boolean)
            ['join']('；') || '镜头固定帧率处理失败',
        );
      (await _0x384e53({ expectedProjectId: _0xe9c0bd['id'], renderWorkspace: ![] }),
        _0x19e007(
          {
            ..._0xe9c0bd,
            status: 'character_mapping',
            workspace: {
              ..._0xe9c0bd['workspace'],
              sourceAnalysis: { status: 'ready', progress: 0x64 },
              identityAnalysis: _0x4f9e14['analysis'],
            },
          },
          { renderWorkspace: ![] },
        ));
      const _0x2b0295 = Number(_0x4f9e14['analysis']?.['stats']?.['identityCount']) || 0x0,
        _0x3b0a67 = getPersonReplacementDetectionFeedback(_0x8eb764, _0x2b0295);
      return (showToast(_0x3b0a67['message'], _0x3b0a67['level']), { ok: !![], project: _0x5b2624() });
    } catch (_0x448bab) {
      if (_0x58cf48['aborted']) return { ok: ![], reason: 'cancelled' };
      const _0x2c61de = normalizeText(_0x448bab?.['message']) || '视频处理失败';
      (_0x19e007(
        {
          ..._0xe9c0bd,
          workspace: { ..._0xe9c0bd['workspace'], sourceAnalysis: { status: 'failed', progress: 0x64 } },
          sources: _0xe9c0bd['sources']['map']((_0x51eff5) =>
            _0x51eff5['videoRef'] && _0x51eff5['processingStatus'] !== 'ready'
              ? { ..._0x51eff5, processingStatus: 'failed', processingProgress: 0x64, error: _0x2c61de }
              : _0x51eff5,
          ),
        },
        { renderWorkspace: ![] },
      ),
        showToast(_0x2c61de, 'error'));
      throw _0x448bab;
    } finally {
      if (_0x5ac375?.['signal'] === _0x58cf48) _0x5ac375 = null;
    }
  }
  async function _0x42a09a({
    mode: mode = _0xe9c0bd['settings']['smartClipMode'],
    fps: fps = _0xe9c0bd['settings']['smartClipFps'],
  } = {}) {
    const _0x5ecd5c = 'shot-cut-detection';
    if (_0x5ac56a['has'](_0x5ecd5c)) throw new Error('智能检测正在运行，请稍候');
    const _0x443551 = _0xe9c0bd['sources']['filter'](
      (_0x23247d) =>
        normalizeText(_0x23247d?.['videoRef']) &&
        _0xe9c0bd['shots']['some'](
          (_0x51a92a) => normalizeText(_0x51a92a?.['sourceId']) === normalizeText(_0x23247d?.['id']),
        ),
    );
    if (!_0x443551['length']) throw new Error('当前时间轴缺少可重新检测的原视频');
    const _0x42c0cc = cloneJson(_0xe9c0bd['shots']);
    _0x5ac56a['add'](_0x5ecd5c);
    try {
      const _0x516fe2 = [];
      for (const _0x9d46b3 of _0x443551) {
        const _0x51abec = await runSmartClip({
          source: _0x9d46b3['videoRef'],
          options: { mode: mode, fps: fps, unlimitedSegments: !![] },
        });
        if (!_0x51abec?.['shotBundles']?.['length'])
          throw new Error('视频「' + (_0x9d46b3['fileName'] || _0x9d46b3['id']) + '」未检测到可用片段');
        _0x516fe2['push'](
          ...buildPersonReplacementDetectedShotCutRanges({
            source: _0x9d46b3,
            shots: _0x42c0cc,
            shotBundles: _0x51abec['shotBundles'],
            fps: fps,
          }),
        );
      }
      return { ranges: _0x516fe2 };
    } finally {
      _0x5ac56a['delete'](_0x5ecd5c);
    }
  }
  function _0x4f9adc(
    { shotId: _0x1deb51, bbox: _0x55a4fa } = {},
    { renderWorkspace: renderWorkspace = !![] } = {},
  ) {
    const _0x448bc0 = normalizeText(_0x1deb51),
      _0x2f8bd3 = _0xe9c0bd['shots']['find']((_0xa62176) => _0xa62176['id'] === _0x448bc0),
      {
        x: _0x5de2c5,
        y: _0x56b154,
        width: _0x36293d,
        height: _0x490ac9,
      } = normalizePersonReplacementBoundingBox(_0x55a4fa && typeof _0x55a4fa === 'object' ? _0x55a4fa : {});
    if (!_0x2f8bd3 || _0x36293d <= 0x0 || _0x490ac9 <= 0x0) return null;
    const _0x2dc42e = createId(_0x448bc0 + '-manual-person'),
      _0xaf826e = createId('source-character-manual'),
      _0x5de196 =
        Math['max'](-0x1, ..._0x2f8bd3['people']['map']((_0x2b173d) => _0x2b173d['promptMarkerIndex'])) + 0x1,
      _0x35e405 = {
        id: _0x2dc42e,
        sourceCharacterId: _0xaf826e,
        targetCharacterId: '',
        targetAppearanceId: '',
        promptMarkerIndex: _0x5de196,
        label: formatPersonReplacementPersonLabel(_0x5de196),
        detectionClass: 'character',
        detectionMethod: 'manual',
        bbox: { x: _0x5de2c5, y: _0x56b154, width: _0x36293d, height: _0x490ac9 },
        detectionConfidence: 0x0,
        identityConfidence: 0x1,
        identityMatchSimilarity: 0x1,
        identityReviewStatus: 'confirmed',
        identityReviewRequired: ![],
        identityMethod: 'manual',
        ambiguousIdentityIds: [],
        orientation: 'front',
        orientationConfidence: 0x1,
        orientationModelId: '',
        occlusion: 'none',
        notes: '用户手动画框的可替换主体',
      },
      _0x556bd7 = _0xe9c0bd['shots']['map']((_0x5d6547) =>
        _0x5d6547['id'] === _0x448bc0
          ? {
              ..._0x5d6547,
              people: orderAndRelabelPersonReplacementPeople([..._0x5d6547['people'], _0x35e405]),
              reviewRequired: !![],
            }
          : _0x5d6547,
      ),
      _0x4f9f9b = _0x19e007(
        {
          ..._0xe9c0bd,
          shots: _0x556bd7,
          sourceCharacters: buildPersonReplacementSourceCharacters(_0x556bd7, _0xe9c0bd['sourceCharacters']),
        },
        { renderWorkspace: renderWorkspace },
      );
    return (showToast('已添加可替换主体，请将目标形象拖入框内。', 'success'), { project: _0x4f9f9b });
  }
  function _0x14341c(
    { shotId: _0x400aa9, updates: updates = [] } = {},
    { renderWorkspace: renderWorkspace = !![] } = {},
  ) {
    const _0x45ace7 = normalizeText(_0x400aa9),
      _0x6adcb5 = _0xe9c0bd['shots']['find']((_0x4c480b) => _0x4c480b['id'] === _0x45ace7);
    if (!_0x6adcb5) return null;
    const _0x572847 = new Map(_0x6adcb5['people']['map']((_0x26ffad) => [_0x26ffad['id'], _0x26ffad])),
      _0x2bd1c1 = new Map();
    (Array['isArray'](updates) ? updates : [])['forEach']((_0x5a279e) => {
      const _0x29d7c2 = normalizeText(_0x5a279e?.['personId']);
      if (!_0x572847['has'](_0x29d7c2)) return;
      const _0x3dcf90 = {},
        _0xb0bd63 = normalizePersonReplacementBoundingBox(
          _0x5a279e?.['bbox'] && typeof _0x5a279e['bbox'] === 'object' ? _0x5a279e['bbox'] : {},
        );
      (_0xb0bd63['width'] > 0x0 && _0xb0bd63['height'] > 0x0 && (_0x3dcf90['bbox'] = _0xb0bd63),
        Object['hasOwn'](_0x5a279e || {}, 'replacementScope') &&
          (_0x3dcf90['replacementScope'] = normalizePersonReplacementScope(_0x5a279e['replacementScope'])),
        Object['keys'](_0x3dcf90)['length'] && _0x2bd1c1['set'](_0x29d7c2, _0x3dcf90));
    });
    if (!_0x2bd1c1['size']) return null;
    const _0x239774 = _0xe9c0bd['shots']['map']((_0x2264dd) =>
        _0x2264dd['id'] === _0x45ace7
          ? {
              ..._0x2264dd,
              people: orderAndRelabelPersonReplacementPeople(
                _0x2264dd['people']['map']((_0x50fa1c) => {
                  const _0x40383e = _0x2bd1c1['get'](_0x50fa1c['id']);
                  if (!_0x40383e) return _0x50fa1c;
                  return {
                    ..._0x50fa1c,
                    ...(_0x40383e['replacementScope']
                      ? { replacementScope: _0x40383e['replacementScope'] }
                      : {}),
                    ...(_0x40383e['bbox']
                      ? {
                          bbox: _0x40383e['bbox'],
                          locator: { ..._0x50fa1c['locator'], bbox: _0x40383e['bbox'] },
                        }
                      : {}),
                  };
                }),
              ),
            }
          : _0x2264dd,
      ),
      _0x2ec737 = _0x19e007(
        {
          ..._0xe9c0bd,
          shots: _0x239774,
          sourceCharacters: buildPersonReplacementSourceCharacters(_0x239774, _0xe9c0bd['sourceCharacters']),
        },
        { renderWorkspace: renderWorkspace },
      );
    return { project: _0x2ec737 };
  }
  function _0xbb6e7(
    { shotId: _0x5ae0b1, personIds: personIds = [] } = {},
    { renderWorkspace: renderWorkspace = !![] } = {},
  ) {
    const _0x5c3256 = normalizeText(_0x5ae0b1),
      _0x27daeb = _0xe9c0bd['shots']['find']((_0x55a891) => _0x55a891['id'] === _0x5c3256),
      _0x37f07f = new Set(
        (Array['isArray'](personIds) ? personIds : [])['map'](normalizeText)['filter'](Boolean),
      ),
      _0x438e85 = _0x27daeb?.['people']['filter']((_0x5336a0) => _0x37f07f['has'](_0x5336a0['id'])) || [];
    if (!_0x438e85['length']) return null;
    const _0x7d2713 = new Set(_0x438e85['map']((_0x26a47f) => _0x26a47f['id'])),
      _0x53f2e2 = new Set(
        _0x438e85['map']((_0x3c5632) => normalizeText(_0x3c5632['sourceCharacterId']))['filter'](Boolean),
      ),
      _0x45de68 = _0xe9c0bd['shots']['map']((_0x1a0532) =>
        _0x1a0532['id'] === _0x5c3256
          ? {
              ..._0x1a0532,
              people: orderAndRelabelPersonReplacementPeople(
                _0x1a0532['people']['filter']((_0xf68601) => !_0x7d2713['has'](_0xf68601['id'])),
              ),
            }
          : _0x1a0532,
      ),
      _0x3d4487 = new Set();
    _0x45de68['forEach']((_0xa9c80b) =>
      _0xa9c80b['people']['forEach']((_0x20097a) => {
        const _0x73bfd8 = normalizeText(_0x20097a['sourceCharacterId']);
        if (_0x73bfd8) _0x3d4487['add'](_0x73bfd8);
      }),
    );
    const _0xf131d2 = _0xe9c0bd['sourceCharacters']['map']((_0x524b54) =>
        _0x7d2713['has'](normalizeText(_0x524b54['exemplarPersonId']))
          ? { ..._0x524b54, exemplarShotId: '', exemplarPersonId: '' }
          : _0x524b54,
      ),
      _0x4e36bc = _0x19e007(
        {
          ..._0xe9c0bd,
          shots: _0x45de68,
          mappings: _0xe9c0bd['mappings']['filter']((_0x33533f) => {
            const _0x42c3d0 = normalizeText(_0x33533f['sourceCharacterId']);
            return !_0x53f2e2['has'](_0x42c3d0) || _0x3d4487['has'](_0x42c3d0);
          }),
          sourceCharacters: buildPersonReplacementSourceCharacters(_0x45de68, _0xf131d2),
        },
        { renderWorkspace: renderWorkspace },
      );
    return (
      showToast(
        _0x438e85['length'] > 0x1 ? '已删除 ' + _0x438e85['length'] + ' 个人物框。' : '已删除该人物框。',
        'success',
      ),
      { project: _0x4e36bc }
    );
  }
  async function _0x16069f({
    ranges: ranges = [],
    replaceTimeline: replaceTimeline = ![],
    selectedShotId: _0x4df3bd = '',
    renderWorkspace: renderWorkspace = !![],
    notify: notify = !![],
    revision: _0x272b48 = 0x0,
  } = {}) {
    const _0x3de4e2 = _0x250ad6['acceptRevision'](_0x272b48),
      _0x581340 = 'shot-cut-timeline:' + _0x3de4e2,
      _0x3ed11d = normalizeText(_0xe9c0bd['id']),
      _0xf0ed67 = normalizePersonReplacementShotCutRanges(_0xe9c0bd['shots'], ranges, {
        allowTimelineReplacement: replaceTimeline === !![],
      }),
      _0x5db623 = new Map(
        _0xe9c0bd['shots']['map']((_0x46d61b) => [normalizeText(_0x46d61b['id']), _0x46d61b]),
      ),
      _0x268809 = new Set(
        _0xf0ed67['filter'](
          (_0x1bc0a4) =>
            normalizeText(_0x1bc0a4['originShotId']) && !_0x5db623['has'](normalizeText(_0x1bc0a4['shotId'])),
        )['map']((_0x329eeb) => normalizeText(_0x329eeb['originShotId'])),
      ),
      _0x22ddc4 =
        _0xf0ed67['length'] !== _0xe9c0bd['shots']['length'] ||
        _0xf0ed67['some']((_0x2a1bf8) => !_0x5db623['has'](normalizeText(_0x2a1bf8['shotId']))),
      _0x2a0f03 = _0xf0ed67['filter']((_0xf258e) => {
        const _0x26ce96 = _0x5db623['get'](_0xf258e['shotId']) || _0x5db623['get'](_0xf258e['originShotId']),
          _0x3fa72f = normalizeText(_0xf258e['keyframeRef']),
          _0x2fe92f = Boolean(
            _0x3fa72f &&
            (_0x3fa72f !== normalizeText(_0x26ce96?.['keyframeRef']) ||
              Math['abs'](Number(_0xf258e['keyframeTimeSec']) - Number(_0x26ce96?.['keyframeTimeSec'])) >
                PERSON_REPLACEMENT_CUT_EPSILON_SEC),
          ),
          _0x24023b = Boolean(
            _0x3fa72f &&
            Boolean(_0xf258e['keyframeManuallySelected']) !==
              Boolean(_0x26ce96?.['keyframeManuallySelected']),
          );
        return (
          !_0x26ce96 ||
          !_0x5db623['has'](_0xf258e['shotId']) ||
          Math['abs'](_0xf258e['startSec'] - Number(_0x26ce96['startTimeSec'])) >
            PERSON_REPLACEMENT_CUT_EPSILON_SEC ||
          Math['abs'](_0xf258e['endSec'] - Number(_0x26ce96['endTimeSec'])) >
            PERSON_REPLACEMENT_CUT_EPSILON_SEC ||
          Boolean(_0xf258e['isReversed']) !== Boolean(_0x26ce96['isReversed']) ||
          Boolean(_0xf258e['isReversed']) !== Boolean(_0x26ce96['materializedIsReversed']) ||
          _0x2fe92f ||
          _0x24023b
        );
      }),
      _0x41e448 = new Set(_0x2a0f03['map']((_0x11303f) => _0x11303f['shotId']));
    if (!_0x2a0f03['length'])
      return (showToast('镜头切口没有变化。', 'info'), { project: _0x5b2624(), changedShotCount: 0x0 });
    const _0x21545e = new Map();
    (_0xe9c0bd['shots']['forEach']((_0x47e95b) =>
      _0x47e95b['people']['forEach']((_0x3bfd07) => {
        const _0x4d400b = normalizeText(_0x3bfd07['sourceCharacterId']);
        if (!_0x4d400b) return;
        const _0x132cf3 = normalizeText(_0x3bfd07['targetCharacterId']),
          _0x2aa16e = normalizeText(_0x3bfd07['targetAppearanceId']);
        (_0x132cf3 || _0x2aa16e) &&
          _0x21545e['set'](_0x4d400b, { targetCharacterId: _0x132cf3, targetAppearanceId: _0x2aa16e });
      }),
    ),
      _0x5ac56a['add'](_0x581340));
    notify && showToast('正在更新 ' + _0x41e448['size'] + ' 个相邻片段。', 'info');
    try {
      const _0x23bd49 = [];
      let _0x375b58 = ![];
      for (let _0xab0840 = 0x0; _0xab0840 < _0xf0ed67['length']; _0xab0840 += 0x1) {
        const _0x51e277 = _0xf0ed67[_0xab0840],
          _0x58c130 = _0x5db623['get'](_0x51e277['shotId']) || _0x5db623['get'](_0x51e277['originShotId']),
          _0x46c6e2 = !_0x5db623['has'](_0x51e277['shotId']),
          _0x4da40b = _0x268809['has'](normalizeText(_0x51e277['originShotId'] || _0x51e277['shotId']));
        if (!_0x58c130) throw new Error('片段 ' + (_0x51e277['shotId'] || _0xab0840 + 0x1) + ' 缺少原始片段');
        if (!_0x41e448['has'](_0x51e277['shotId'])) {
          _0x23bd49['push']({ ..._0x58c130, index: _0xab0840 });
          continue;
        }
        const _0xc3c34d = _0xe9c0bd['sources']['find'](
            (_0x5e4277) => _0x5e4277['id'] === _0x58c130['sourceId'],
          ),
          _0x514606 = normalizeText(_0x58c130['sourceVideoRef'] || _0xc3c34d?.['videoRef']);
        if (!_0x514606) throw new Error('片段 ' + (_0x58c130['title'] || _0xab0840 + 0x1) + ' 缺少原始视频');
        const _0x22560f = [0x10, 0x18, 0x1e]['includes'](Math['round'](Number(_0x58c130['outputFps'])))
            ? Math['round'](Number(_0x58c130['outputFps']))
            : 0x18,
          {
            videoRef: _0x185a89,
            reverseChanged: _0x5dac60,
            videoRefIsCropped: _0x51a4af,
          } = await materializePersonReplacementShotPlayback({
            currentShot: _0x58c130,
            range: _0x51e277,
            isNewShot: _0x46c6e2,
            sourceVideoRef: _0x514606,
            outputFps: _0x22560f,
            epsilonSec: PERSON_REPLACEMENT_CUT_EPSILON_SEC,
            enqueueMediaTask: enqueueMediaTask,
            resolveMediaRef: resolveMediaRef,
          }),
          _0x4fab2f = normalizeText(_0x51e277['keyframeRef']),
          _0x3e9636 = Boolean(_0x4fab2f),
          _0x54cd46 = Number(_0x58c130['keyframeTimeSec']),
          _0x1511a5 = Boolean(
            !_0x5dac60 &&
            normalizeText(_0x58c130['keyframeRef']) &&
            (!Number['isFinite'](_0x54cd46) ||
              (_0x54cd46 >= _0x51e277['startSec'] - PERSON_REPLACEMENT_CUT_EPSILON_SEC &&
                _0x54cd46 < _0x51e277['endSec'] + PERSON_REPLACEMENT_CUT_EPSILON_SEC)),
          );
        let _0x4fc3d2 = _0x3e9636 ? _0x4fab2f : _0x1511a5 ? normalizeText(_0x58c130['keyframeRef']) : '';
        if (!_0x4fc3d2) {
          const _0x5d51d3 = await fetchFirstFrame(_0x185a89, {
            assetId: _0xe9c0bd['id'],
            nodeId: _0x51e277['shotId'] || _0x58c130['id'],
          });
          _0x4fc3d2 = resolveMediaRef(_0x5d51d3);
        }
        if (!_0x4fc3d2) throw new Error('镜头切口更新后首帧提取失败');
        const _0x195991 =
            _0x3e9636 &&
            (_0x4fab2f !== normalizeText(_0x58c130['keyframeRef']) ||
              Math['abs'](Number(_0x51e277['keyframeTimeSec']) - Number(_0x58c130['keyframeTimeSec'])) >
                PERSON_REPLACEMENT_CUT_EPSILON_SEC),
          _0x519a67 = {
            ..._0x58c130,
            id: _0x51e277['shotId'],
            title:
              _0x46c6e2 && _0x58c130['title']
                ? _0x58c130['title'] + ' · ' + (_0xab0840 + 0x1)
                : _0x58c130['title'],
            index: _0xab0840,
            startTimeSec: _0x51e277['startSec'],
            endTimeSec: _0x51e277['endSec'],
            durationSec: _0x51e277['endSec'] - _0x51e277['startSec'],
            sourceVideoRef: _0x514606,
            videoRef: _0x185a89,
            videoRefIsCropped: _0x51a4af,
            isReversed: _0x51e277['isReversed'] === !![],
            materializedIsReversed: _0x51e277['isReversed'] === !![],
            keyframeRef: _0x4fc3d2,
            keyframeIndex: !_0x195991 && _0x1511a5 ? _0x58c130['keyframeIndex'] : 0x0,
            keyframeTimeSec: _0x3e9636
              ? _0x51e277['keyframeTimeSec']
              : _0x1511a5
                ? _0x58c130['keyframeTimeSec']
                : _0x51e277['isReversed'] === !![]
                  ? _0x51e277['endSec']
                  : _0x51e277['startSec'],
            keyframeManuallySelected: _0x3e9636
              ? _0x51e277['keyframeManuallySelected'] === !![]
              : _0x1511a5
                ? _0x58c130['keyframeManuallySelected'] === !![]
                : ![],
            frame: _0x3e9636 && _0x51e277['frame'] ? { ..._0x51e277['frame'] } : _0x58c130['frame'],
            outputFps: _0x22560f,
            materializationStatus: 'succeeded',
            materializationProgress: 0x64,
            replacementImage: { results: [], activeIndex: 0x0 },
            replacementImageRef: '',
            ...(_0x4da40b
              ? {
                  replacementVideo: { results: [], activeIndex: 0x0 },
                  resultVideoRef: '',
                  generationStatus: 'pending',
                }
              : {}),
            error: '',
          };
        !_0x195991 && _0x1511a5
          ? _0x23bd49['push']({
              ..._0x519a67,
              people: _0x58c130['people']['map']((_0x555556) => ({ ..._0x555556 })),
              analysisStatus: _0x58c130['analysisStatus'],
              reviewRequired: _0x58c130['reviewRequired'],
            })
          : ((_0x375b58 = !![]),
            _0x23bd49['push'](
              await _0x508263({ ..._0x519a67, people: [], analysisStatus: 'running', reviewRequired: !![] }),
            ));
      }
      const _0x3cf4a6 = _0x375b58
          ? await _0x250837(_0x23bd49)
          : {
              shots: _0x23bd49,
              sourceCharacters: _0xe9c0bd['sourceCharacters'],
              analysis: _0xe9c0bd['workspace']['identityAnalysis'],
            },
        _0x120e0f = _0x3cf4a6['shots']['map']((_0x3bd7ee) => ({
          ..._0x3bd7ee,
          people: _0x3bd7ee['people']['map']((_0x121070) => {
            const _0x5c3be7 = _0x21545e['get'](normalizeText(_0x121070['sourceCharacterId']));
            return _0x5c3be7
              ? {
                  ..._0x121070,
                  targetCharacterId: _0x5c3be7['targetCharacterId'],
                  targetAppearanceId: _0x5c3be7['targetAppearanceId'],
                }
              : _0x121070;
          }),
        })),
        _0x2aba0 = normalizeText(_0x4df3bd),
        _0x215a39 = _0x120e0f['some']((_0x3045f4) => normalizeText(_0x3045f4['id']) === _0x2aba0)
          ? _0x2aba0
          : _0x120e0f['some'](
                (_0x4a9479) =>
                  normalizeText(_0x4a9479['id']) === normalizeText(_0xe9c0bd['workspace']['selectedShotId']),
              )
            ? _0xe9c0bd['workspace']['selectedShotId']
            : _0x120e0f[0x0]?.['id'] || '';
      if (_0x18c393 || !_0x250ad6['isCurrent'](_0x3de4e2) || normalizeText(_0xe9c0bd['id']) !== _0x3ed11d)
        return { project: _0x5b2624(), changedShotCount: 0x0, stale: !![] };
      const _0x400df4 = {
          ..._0xe9c0bd,
          shots: _0x120e0f,
          sourceCharacters: buildPersonReplacementSourceCharacters(_0x120e0f, _0x3cf4a6['sourceCharacters']),
          workspace: {
            ..._0xe9c0bd['workspace'],
            selectedShotId: _0x215a39,
            identityAnalysis: _0x3cf4a6['analysis'],
            imageGeneration: { status: 'idle', shotId: '', error: '' },
            imageGenerationsByShotId: {},
            videoGeneration: { status: 'idle', shotId: '', error: '' },
            videoGenerationsByShotId: {},
            videoPreparation: { status: 'idle', progress: 0x0, error: '' },
          },
        },
        _0xd4d0a0 = _0x19e007(
          _0x22ddc4
            ? transitionPersonReplacementOutput(_0x400df4, {
                type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['INVALIDATE'],
              })
            : _0x400df4,
          { renderWorkspace: renderWorkspace },
        );
      return (
        notify && showToast('已更新 ' + _0x41e448['size'] + '\x20个片段的切口。', 'success'),
        { project: _0xd4d0a0, changedShotCount: _0x41e448['size'] }
      );
    } finally {
      _0x5ac56a['delete'](_0x581340);
    }
  }
  const _0x3f4881 = createPersonReplacementShotReverseOperation({
    coordinator: _0x250ad6,
    getProject: () => _0xe9c0bd,
    setProject: _0x19e007,
    snapshot: _0x5b2624,
    showToast: showToast,
    updateShotCutRanges: _0x16069f,
    enqueueMediaTask: enqueueMediaTask,
    resolveMediaRef: resolveMediaRef,
    isDestroyed: () => _0x18c393,
  });
  function _0x3588c4({ sourceCharacterIds: sourceCharacterIds = [] } = {}) {
    try {
      const _0x1d8f46 = mergePersonReplacementSourceCharacters(_0xe9c0bd, {
          sourceCharacterIds: sourceCharacterIds,
        }),
        _0x1043e8 = _0x19e007({
          ..._0x1d8f46,
          sourceCharacters: buildPersonReplacementSourceCharacters(
            _0x1d8f46['shots'],
            _0x1d8f46['sourceCharacters'],
          ),
          workspace: { ..._0x1d8f46['workspace'], selectedIdentityIds: [] },
        });
      return (showToast('所选人物身份已合并。', 'success'), { project: _0x1043e8 });
    } catch (_0x3736a7) {
      return (showToast(_0x3736a7?.['message'] || '人物身份合并失败', 'warn'), null);
    }
  }
  function _0x2ea307({ sourceCharacterId: _0x378007, shotId: _0x2cfd70, personId: _0x158eff } = {}) {
    try {
      const _0x544e92 = splitPersonReplacementSourceCharacter(_0xe9c0bd, {
          sourceCharacterId: _0x378007,
          occurrences: [{ shotId: _0x2cfd70, personId: _0x158eff }],
          newSourceCharacterId: createId('source-character-manual'),
        }),
        _0xd22096 = _0x19e007({
          ..._0x544e92,
          sourceCharacters: buildPersonReplacementSourceCharacters(
            _0x544e92['shots'],
            _0x544e92['sourceCharacters'],
          ),
          workspace: { ..._0x544e92['workspace'], selectedIdentityIds: [] },
        });
      return (showToast('当前人物框已拆分为独立人物。', 'success'), { project: _0xd22096 });
    } catch (_0x55e6b5) {
      return (showToast(_0x55e6b5?.['message'] || '人物身份拆分失败', 'warn'), null);
    }
  }
  function _0x47e3a3({
    sourceCharacterId: _0x3b5177,
    targetSourceCharacterId: _0x15ba87,
    shotId: _0xd6cc78,
    personId: _0x104122,
    label: _0x572d81,
    orientation: _0x1cd11e,
    silent: silent = ![],
  } = {}) {
    try {
      const _0x46f22a = normalizeText(_0x572d81),
        _0x29e1c = normalizePersonReplacementOrientation(_0x1cd11e);
      if (!_0x46f22a) throw new Error('请输入人物名称');
      const _0x12016c = confirmPersonReplacementSourceCharacter(_0xe9c0bd, {
          sourceCharacterId: _0x3b5177,
          targetSourceCharacterId: _0x15ba87,
          shotId: _0xd6cc78,
          personId: _0x104122,
          label: _0x46f22a,
          orientation: _0x29e1c === 'unknown' ? '' : _0x29e1c,
        }),
        _0x26209f = _0x19e007(
          {
            ..._0x12016c,
            sourceCharacters: buildPersonReplacementSourceCharacters(
              _0x12016c['shots'],
              _0x12016c['sourceCharacters'],
            ),
          },
          { sync: ![] },
        );
      if (!silent) showToast('人物身份已确认。', 'success');
      return { project: _0x26209f };
    } catch (_0xcf659d) {
      return (showToast(_0xcf659d?.['message'] || '人物身份确认失败', 'warn'), null);
    }
  }
  function _0x4ae8ac({ characterId: _0x551a6e } = {}) {
    const _0xd42c43 = normalizeText(_0x551a6e);
    if (!_0xd42c43 || !_0xe9c0bd['characters']['some']((_0x2b898a) => _0x2b898a['id'] === _0xd42c43))
      return null;
    const _0xb687c6 = _0xe9c0bd['characters']['filter']((_0x1df04e) => _0x1df04e['id'] !== _0xd42c43),
      _0x21320b = Object['fromEntries'](
        Object['entries'](_0xe9c0bd['workspace']['assetAppearanceIndexes'] || {})['filter'](
          ([_0x5db726]) => _0x5db726 !== _0xd42c43,
        ),
      ),
      _0x17dcf7 = _0x19e007({
        ..._0xe9c0bd,
        characters: _0xb687c6,
        mappings: _0xe9c0bd['mappings']['filter'](
          (_0x2f907b) => _0x2f907b['targetCharacterId'] !== _0xd42c43,
        ),
        shots: _0xe9c0bd['shots']['map']((_0x35af27) => ({
          ..._0x35af27,
          people: _0x35af27['people']['map']((_0x3b4a3c) =>
            _0x3b4a3c['targetCharacterId'] === _0xd42c43
              ? { ..._0x3b4a3c, targetCharacterId: '', targetAppearanceId: '' }
              : _0x3b4a3c,
          ),
        })),
        workspace: {
          ..._0xe9c0bd['workspace'],
          selectedCharacterId:
            _0xe9c0bd['workspace']['selectedCharacterId'] === _0xd42c43
              ? _0xb687c6[0x0]?.['id'] || ''
              : _0xe9c0bd['workspace']['selectedCharacterId'],
          selectedAssetIds: _0xe9c0bd['workspace']['selectedAssetIds']['filter'](
            (_0xe214cf) => _0xe214cf !== _0xd42c43,
          ),
          assetAppearanceIndexes: _0x21320b,
        },
      });
    return (showToast('人物卡片已删除。', 'success'), { project: _0x17dcf7 });
  }
  function _0x49eb4b({ sceneId: _0x2a8022 } = {}) {
    const _0x238929 = normalizeText(_0x2a8022);
    if (!_0x238929 || !_0xe9c0bd['scenes']['some']((_0x388c50) => _0x388c50['id'] === _0x238929)) return null;
    const _0x4f5e2c = _0xe9c0bd['scenes']['filter']((_0x43b68c) => _0x43b68c['id'] !== _0x238929),
      _0x3ba946 = Object['fromEntries'](
        Object['entries'](_0xe9c0bd['workspace']['assetAppearanceIndexes'] || {})['filter'](
          ([_0x3b0297]) => _0x3b0297 !== _0x238929,
        ),
      ),
      _0x1b4eb9 = _0x19e007({
        ..._0xe9c0bd,
        scenes: _0x4f5e2c,
        shots: _0xe9c0bd['shots']['map']((_0x4e7aec) =>
          normalizeText(_0x4e7aec['sceneReference']?.['sceneId']) === _0x238929
            ? { ..._0x4e7aec, sceneReference: { sceneId: '', appearanceId: '' } }
            : _0x4e7aec,
        ),
        workspace: {
          ..._0xe9c0bd['workspace'],
          selectedSceneId:
            _0xe9c0bd['workspace']['selectedSceneId'] === _0x238929
              ? _0x4f5e2c[0x0]?.['id'] || ''
              : _0xe9c0bd['workspace']['selectedSceneId'],
          selectedAssetIds: _0xe9c0bd['workspace']['selectedAssetIds']['filter'](
            (_0x17b56b) => _0x17b56b !== _0x238929,
          ),
          assetAppearanceIndexes: _0x3ba946,
        },
      });
    return (showToast('场景卡片已删除。', 'success'), { project: _0x1b4eb9 });
  }
  function _0x5eed46({ audioAssetId: _0x53026e } = {}) {
    const _0x887014 = normalizeText(_0x53026e),
      _0x2c89d6 = _0xe9c0bd['audioAssets']['find']((_0x3a5e85) => _0x3a5e85['id'] === _0x887014);
    if (!_0x2c89d6) return null;
    const _0x28974f = _0xe9c0bd['audioAssets']['filter']((_0x30706f) => _0x30706f['id'] !== _0x887014),
      _0x16285a = _0x19e007({
        ..._0xe9c0bd,
        audioAssets: _0x28974f,
        workspace: {
          ..._0xe9c0bd['workspace'],
          selectedAudioAssetId:
            _0xe9c0bd['workspace']['selectedAudioAssetId'] === _0x887014
              ? _0x28974f[0x0]?.['id'] || ''
              : _0xe9c0bd['workspace']['selectedAudioAssetId'],
        },
      });
    return (showToast('项目音频已移除。', 'success'), { project: _0x16285a });
  }
  async function _0x127c22(_0xe335d4 = [], _0x7abb12 = 'character') {
    const _0x42a013 = (Array['isArray'](_0xe335d4) ? _0xe335d4 : [_0xe335d4])['filter'](Boolean);
    if (!_0x42a013['length'] || typeof _0x512566 !== 'function') return null;
    const _0x50ce41 = normalizeText(_0xe9c0bd['id']),
      _0x154f1b = [];
    for (const _0x39bca6 of _0x42a013) {
      const _0x183d3d = await _0x512566(_0x39bca6, _0xe9c0bd['id']),
        _0x517bc3 = resolveMediaRef(_0x183d3d);
      if (!_0x517bc3) throw new Error('素材图片保存结果缺少可用地址');
      if (normalizeText(_0xe9c0bd['id']) !== _0x50ce41) return null;
      _0x154f1b['push']({ file: _0x39bca6, imageRef: _0x517bc3 });
    }
    const _0x45a891 = _0x7abb12 === 'scene',
      _0x53da66 = _0x45a891 ? 'scenes' : 'characters',
      _0x2a2eb7 = Array['isArray'](_0xe9c0bd[_0x53da66]) ? _0xe9c0bd[_0x53da66] : [],
      _0x14b2b3 = new Set(_0x2a2eb7['map']((_0x56853a) => _0x56853a['id'])),
      _0x29a02f = _0x154f1b['map'](({ file: _0x54cd8c, imageRef: _0x7ac1b5 }, _0x6ae5c6) => {
        const _0x1be021 = _0x2a2eb7['length'] + _0x6ae5c6 + 0x1;
        let _0x517893 = _0x1be021;
        const _0x24f8cf = _0x45a891 ? 'target-scene' : 'target';
        while (_0x14b2b3['has'](_0x24f8cf + '-' + _0x517893)) _0x517893 += 0x1;
        const _0x50f920 = _0x24f8cf + '-' + _0x517893,
          _0x37b672 = _0x50f920 + '-appearance-1';
        _0x14b2b3['add'](_0x50f920);
        const _0x39e9b4 = _0x45a891 ? '场景' : '人物',
          _0x2d9a2a = _0x45a891 ? '目标场景 ' + _0x1be021 : '目标人物 ' + _0x1be021,
          _0x142fb5 = {
            id: _0x50f920,
            kind: _0x7abb12,
            role: _0x39e9b4,
            name: createUploadedAssetName(_0x54cd8c['name'], _0x2d9a2a),
            appearances: [
              {
                id: _0x37b672,
                name: _0x45a891 ? '场景图' : '基础形象',
                imageUrl: _0x7ac1b5,
                prompt: '',
                occurrences: '当前项目',
              },
            ],
            baseAppearanceId: _0x37b672,
            description: '',
          };
        if (!_0x45a891) _0x142fb5['voiceReference'] = null;
        return _0x142fb5;
      }),
      _0x2638fd = _0x29a02f['at'](-0x1);
    return {
      project: _0x19e007({
        ..._0xe9c0bd,
        [_0x53da66]: [..._0x2a2eb7, ..._0x29a02f],
        workspace: {
          ..._0xe9c0bd['workspace'],
          ...(_0x45a891
            ? { selectedSceneId: _0x2638fd?.['id'] || _0xe9c0bd['workspace']['selectedSceneId'] }
            : { selectedCharacterId: _0x2638fd?.['id'] || _0xe9c0bd['workspace']['selectedCharacterId'] }),
        },
      }),
    };
  }
  function _0x53f7d0(_0x475adb = []) {
    return _0x127c22(_0x475adb, 'character');
  }
  function _0x5e59f(_0x53d361 = []) {
    return _0x127c22(_0x53d361, 'scene');
  }
  async function _0xe748ae(_0x1c4f32 = []) {
    const _0x5122ac = (Array['isArray'](_0x1c4f32) ? _0x1c4f32 : [_0x1c4f32])['filter'](Boolean);
    if (!_0x5122ac['length'] || typeof _0x512566 !== 'function') return null;
    if (typeof saveAssetPackageItem !== 'function') throw new Error('总素材服务尚未初始化。');
    const _0x37b77e = normalizeText(_0xe9c0bd['id']),
      _0x4c2016 = [],
      _0x234ce0 = [];
    for (const _0x4d210b of _0x5122ac) {
      const _0x25bf85 = await _0x512566(_0x4d210b, _0x37b77e),
        _0xb94324 = resolveMediaRef(_0x25bf85);
      if (!_0xb94324) throw new Error('音频保存结果缺少可用地址');
      if (normalizeText(_0xe9c0bd['id']) !== _0x37b77e) return null;
      const _0xd0e783 = createId('person-replacement-audio'),
        _0x279d7f = createUploadedAssetName(_0x4d210b['name'], '未命名音频'),
        _0x209946 = await saveAssetPackageItem({
          packageKey: 'person-replacement-audio:' + _0x37b77e,
          packageName: (normalizeText(_0xe9c0bd['title']) || '未命名人物替换项目') + '\x20·\x20音频素材',
          category: '替换工作室',
          itemKey: _0xd0e783,
          itemName: _0x279d7f,
          audio: { ...(_0x25bf85 && typeof _0x25bf85 === 'object' ? _0x25bf85 : {}), audioUrl: _0xb94324 },
          metadata: { sourceKind: 'person-replacement-workspace', sourceProjectId: _0x37b77e },
          itemMetadata: {
            sourceKind: 'person-replacement-workspace',
            sourceProjectId: _0x37b77e,
            sourceAudioId: _0xd0e783,
          },
        });
      if (normalizeText(_0xe9c0bd['id']) !== _0x37b77e) return null;
      const _0xdd50d = normalizeText(_0x209946?.['assetId']),
        _0x47f877 = Math['max'](0x0, Math['trunc'](Number(_0x209946?.['itemIndex']) || 0x0));
      _0xdd50d &&
        (_0x4c2016['push']({ assetId: _0xdd50d, itemIndex: _0x47f877 }),
        _0x234ce0['push']({
          assetId: _0xdd50d,
          itemIndex: _0x47f877,
          type: 'audio',
          assetName: (normalizeText(_0xe9c0bd['title']) || '未命名人物替换项目') + '\x20·\x20音频素材',
          name: _0x279d7f,
          savedName: _0x279d7f,
          url: _0xb94324,
          durationSec: Math['max'](0x0, Number(_0x25bf85?.['durationSec']) || 0x0),
          waveformLocalPath: normalizeText(_0x25bf85?.['waveformLocalPath']),
          waveformUrl: normalizeText(_0x25bf85?.['waveformUrl']),
        }));
    }
    const _0x4043d3 = _0x5257a6({
        assetRefs: _0x4c2016,
        targetKind: 'audio',
        notify: ![],
        sourceAssets: _0x234ce0,
      }),
      _0x494cfd = _0x19e007({
        ..._0xe9c0bd,
        workspace: {
          ..._0xe9c0bd['workspace'],
          characterAssetTab: 'audio',
          assetSelectionMode: ![],
          selectedAssetIds: [],
        },
      });
    return (
      showToast(
        _0x5122ac['length'] > 0x1 ? '已上传 ' + _0x5122ac['length'] + ' 个音频素材。' : '音频素材已上传。',
        'success',
      ),
      { ..._0x4043d3, project: _0x494cfd }
    );
  }
  function _0x5257a6({
    assetRefs: assetRefs = [],
    targetKind: targetKind = 'character',
    notify: notify = !![],
    sourceAssets: sourceAssets = null,
  } = {}) {
    const _0x1133cc = ['character', 'scene', 'audio']['includes'](targetKind) ? targetKind : 'character',
      _0x1c3831 = _0x1133cc === 'scene' ? 'scenes' : _0x1133cc === 'audio' ? 'audioAssets' : 'characters',
      _0xde3e47 = Array['isArray'](_0xe9c0bd[_0x1c3831]) ? _0xe9c0bd[_0x1c3831] : [],
      _0x1a6c51 = _0x1133cc === 'scene' ? '场景' : _0x1133cc === 'audio' ? '音频' : '人物',
      _0xdceb7a = new Set(
        (Array['isArray'](assetRefs) ? assetRefs : [])['map'](
          (_0x295a72) =>
            normalizeText(_0x295a72?.['assetId'] || _0x295a72?.['sourceAssetId']) +
            ':' +
            Math['max'](
              0x0,
              Math['trunc'](Number(_0x295a72?.['itemIndex'] ?? _0x295a72?.['sourceItemIndex']) || 0x0),
            ),
        ),
      ),
      _0x4afe8d = new Map(
        _0xde3e47['filter']((_0x89ca0) => normalizeText(_0x89ca0?.['sourceOrigin']) === 'library')['map'](
          (_0xf78b11) => [
            normalizeText(_0xf78b11['sourceAssetId']) +
              ':' +
              Math['max'](0x0, Math['trunc'](Number(_0xf78b11['sourceItemIndex']) || 0x0)),
            _0xf78b11,
          ],
        ),
      ),
      _0x41c85d = [],
      _0x18d29d = [],
      _0x21f90b = new Set(_0xde3e47['map']((_0xd69164) => _0xd69164['id'])),
      _0xedf85b = Array['isArray'](sourceAssets) ? sourceAssets : _0x124687();
    _0xedf85b['forEach']((_0x4d69cb) => {
      const _0xfd045d = normalizeText(_0x4d69cb?.['assetId'] || _0x4d69cb?.['sourceAssetId']),
        _0x5ca9dc = Math['max'](
          0x0,
          Math['trunc'](Number(_0x4d69cb?.['itemIndex'] ?? _0x4d69cb?.['sourceItemIndex']) || 0x0),
        ),
        _0x369ae3 = _0xfd045d + ':' + _0x5ca9dc;
      if (!_0xdceb7a['has'](_0x369ae3)) return;
      const _0x365e12 = _0x4afe8d['get'](_0x369ae3);
      if (_0x365e12) {
        _0x18d29d['push'](_0x365e12['id']);
        return;
      }
      const _0x46278b = normalizeText(_0x4d69cb?.['type'] || _0x4d69cb?.['mediaKind'])['toLowerCase'](),
        _0x5e25e7 =
          _0x1133cc === 'audio'
            ? normalizeText(_0x4d69cb?.['url'] || _0x4d69cb?.['sourceUrl'] || _0x4d69cb?.['audioUrl'])
            : normalizeText(_0x4d69cb?.['url'] || _0x4d69cb?.['sourceUrl'] || _0x4d69cb?.['imageUrl']),
        _0x27f2d2 = _0x1133cc === 'audio' ? 'audio' : 'image';
      if (_0x46278b !== _0x27f2d2 || !_0x5e25e7) return;
      let _0x5793e1 = _0xde3e47['length'] + _0x41c85d['length'] + 0x1;
      const _0xff5f1f =
        _0x1133cc === 'scene' ? 'target-scene' : _0x1133cc === 'audio' ? 'project-audio' : 'target';
      while (_0x21f90b['has'](_0xff5f1f + '-' + _0x5793e1)) _0x5793e1 += 0x1;
      const _0x33737e = _0xff5f1f + '-' + _0x5793e1,
        _0x12d0f6 = createUploadedAssetName(_0x4d69cb['name'] || _0x4d69cb['assetName'], ''),
        _0x47cc90 =
          _0x1133cc === 'audio'
            ? createUploadedAssetName(getPersonReplacementAudioSavedName(_0x4d69cb), '')
            : '';
      _0x21f90b['add'](_0x33737e);
      let _0x1ff5d6;
      if (_0x1133cc === 'audio')
        _0x1ff5d6 = {
          id: _0x33737e,
          kind: 'audio',
          mediaKind: 'audio',
          role: '音频素材',
          name: _0x47cc90 || '音频 ' + _0x5793e1,
          savedName: _0x47cc90 || '音频 ' + _0x5793e1,
          assetName: normalizeText(_0x4d69cb['assetName']) || _0x12d0f6 || '音频 ' + _0x5793e1,
          sourceOrigin: 'library',
          sourceAssetId: _0xfd045d,
          sourceItemIndex: _0x5ca9dc,
          sourceUrl: _0x5e25e7,
          audioUrl: _0x5e25e7,
          waveformLocalPath: normalizeText(_0x4d69cb['waveformLocalPath']),
          waveformUrl: normalizeText(_0x4d69cb['waveformUrl']),
          durationSec: Math['max'](0x0, Number(_0x4d69cb['durationSec']) || 0x0),
          occurrences: '当前项目',
          description: '',
          isLibraryAsset: ![],
        };
      else {
        const _0x55cdcc = _0x33737e + '-appearance-1';
        _0x1ff5d6 = {
          id: _0x33737e,
          kind: _0x1133cc,
          role: _0x1a6c51,
          name: _0x12d0f6 || '目标' + _0x1a6c51 + '\x20' + _0x5793e1,
          sourceOrigin: 'library',
          sourceAssetId: _0xfd045d,
          sourceItemIndex: _0x5ca9dc,
          appearances: [
            {
              id: _0x55cdcc,
              name: _0x1133cc === 'scene' ? '场景图' : '基础形象',
              imageUrl: _0x5e25e7,
              prompt: '',
              occurrences: '总素材',
            },
          ],
          baseAppearanceId: _0x55cdcc,
          ...(_0x1133cc === 'character' ? { voiceReference: null } : {}),
          description: '',
        };
      }
      (_0x41c85d['push'](_0x1ff5d6), _0x4afe8d['set'](_0x369ae3, _0x1ff5d6));
    });
    const _0x3157fe = [..._0x18d29d, ..._0x41c85d['map']((_0x15c478) => _0x15c478['id'])];
    if (!_0x3157fe['length'])
      return (
        notify &&
          showToast(
            _0x1133cc === 'audio'
              ? '请选择总素材中的音频后再加入项目。'
              : '请选择总素材中的图片后再加入' + _0x1a6c51 + '。',
            'warn',
          ),
        { project: _0x5b2624(), addedCount: 0x0, existingCount: 0x0 }
      );
    _0x19e007(
      {
        ..._0xe9c0bd,
        [_0x1c3831]: [..._0xde3e47, ..._0x41c85d],
        workspace: {
          ..._0xe9c0bd['workspace'],
          ...(_0x1133cc === 'scene'
            ? { selectedSceneId: _0x3157fe['at'](-0x1) }
            : _0x1133cc === 'audio'
              ? { selectedAudioAssetId: _0x3157fe['at'](-0x1), characterAssetTab: 'audio' }
              : { selectedCharacterId: _0x3157fe['at'](-0x1) }),
          assetSelectionMode: ![],
          selectedAssetIds: [],
        },
      },
      { sync: ![] },
    );
    if (notify && _0x41c85d['length'])
      showToast('已将 ' + _0x41c85d['length'] + '\x20项总素材加入' + _0x1a6c51 + '。', 'success');
    else
      notify &&
        showToast(
          _0x1133cc === 'audio' ? '所选音频已在当前项目中。' : '所选图片已在' + _0x1a6c51 + '素材中。',
          'info',
        );
    return { project: _0x5b2624(), addedCount: _0x41c85d['length'], existingCount: _0x18d29d['length'] };
  }
  function _0x5a4a72(_0x472d34 = {}) {
    return _0x5257a6({ ..._0x472d34, targetKind: 'character' });
  }
  async function _0x113f25(_0x53dad1, _0x2471a3 = {}) {
    if (!_0x53dad1 || typeof _0x512566 !== 'function') return null;
    const _0x56d992 = await _0x512566(_0x53dad1, _0xe9c0bd['id']),
      _0x2f462e = resolveMediaRef(_0x56d992);
    if (!_0x2f462e) throw new Error('人物形象保存结果缺少可用地址');
    const _0x5d3ea2 = _0xe9c0bd['characters']['map']((_0x78bccd) =>
      _0x78bccd['id'] === _0x2471a3['characterId']
        ? {
            ..._0x78bccd,
            appearances: _0x78bccd['appearances']['map']((_0x1b7625) =>
              _0x1b7625['id'] === _0x2471a3['appearanceId']
                ? { ..._0x1b7625, imageUrl: _0x2f462e, generationStatus: 'succeeded', error: '' }
                : _0x1b7625,
            ),
          }
        : _0x78bccd,
    );
    return { project: _0x19e007({ ..._0xe9c0bd, characters: _0x5d3ea2 }) };
  }
  async function _0x4911db(_0x2ac967, _0x450f03 = {}) {
    if (!_0x2ac967 || typeof _0x512566 !== 'function') return null;
    const _0x2c4983 = normalizeText(_0x450f03['shotId']),
      _0x278c31 = _0xe9c0bd['shots']['find']((_0x17f1ed) => _0x17f1ed['id'] === _0x2c4983);
    if (!_0x278c31) throw new Error('当前片段不可用');
    const _0x37dfa2 = _0xe9c0bd['id'],
      _0x672ded = createPersonReplacementImageGenerationMappingRevision({
        project: _0xe9c0bd,
        shot: _0x278c31,
      }),
      _0x4f3edc = await _0x512566(_0x2ac967, _0x37dfa2),
      _0x301ff6 = resolveMediaRef(_0x4f3edc);
    if (!_0x301ff6) throw new Error('替换图片保存结果缺少可用地址');
    const _0x5b8f7d = _0x2cca4f['acceptUploadedResult']({
      shotId: _0x2c4983,
      imageRef: _0x301ff6,
      fileName: normalizeText(_0x2ac967['name']),
      createdAt: nowIso(),
      expectedProjectId: _0x37dfa2,
      expectedShotRevision: _0x672ded,
    });
    if (!_0x5b8f7d) return null;
    return (showToast('替换图片已加入当前片段。', 'success'), { project: _0x5b8f7d });
  }
  async function _0x3107f4(_0x43d791, _0x28b8ec = {}) {
    return uploadPersonReplacementVideoResult({
      file: _0x43d791,
      context: _0x28b8ec,
      project: _0xe9c0bd,
      uploadFile: _0x512566,
      prepareUploadedVideoAsset: prepareUploadedVideoAsset,
      videoTaskRuntime: _0x5ec987,
      now: nowIso,
      showToast: showToast,
    });
  }
  function _0x22494c({ shotId: shotId = '', slotId: slotId = '', input: input = null } = {}) {
    const _0x176dce = normalizeText(shotId),
      _0x5c024b = normalizeText(slotId),
      _0x110df6 = _0xe9c0bd['shots']['find']((_0x13e8a5) => _0x13e8a5['id'] === _0x176dce);
    if (!_0x110df6 || !_0x5c024b) return null;
    const _0x312364 = { ...(_0x110df6['replacementVideoInputsBySlot'] || {}) };
    if (input) _0x312364[_0x5c024b] = input;
    else delete _0x312364[_0x5c024b];
    const _0x48180c = {
      ..._0xe9c0bd,
      shots: _0xe9c0bd['shots']['map']((_0x2c0d19) =>
        _0x2c0d19['id'] === _0x176dce
          ? { ..._0x2c0d19, replacementVideoInputsBySlot: _0x312364, error: '' }
          : _0x2c0d19,
      ),
      workspace: {
        ...updatePersonReplacementVideoGenerationState(_0xe9c0bd['workspace'], {
          status: 'idle',
          shotId: _0x176dce,
          error: '',
        }),
        selectedShotId: _0x176dce,
      },
    };
    return _0x19e007(_0x48180c, { renderWorkspace: ![] });
  }
  async function _0x2e6256(_0x58ff69, _0x539f53 = {}) {
    if (!_0x58ff69 || typeof _0x512566 !== 'function') return null;
    try {
      const _0x34b475 = normalizeText(_0x539f53['shotId']),
        _0x20f618 = normalizeText(_0x539f53['slotId']),
        _0x5aa2b1 = _0xe9c0bd['shots']['find']((_0x528902) => _0x528902['id'] === _0x34b475);
      if (!_0x5aa2b1) throw new Error('当前片段不可用');
      const _0x3614a9 = resolvePersonReplacementVideoSlotState(_0xe9c0bd, _0x5aa2b1);
      if (normalizeText(_0x539f53['modelId']) && normalizeText(_0x539f53['modelId']) !== _0x3614a9['modelId'])
        throw new Error('视频模型已经切换，请重新选择入参槽');
      if (_0x3614a9['readOnlySlots']['includes'](_0x20f618))
        throw new Error('源视频和当前参考图由所选片段自动提供');
      const _0x5c51a2 = normalizeText(_0x3614a9['fixedInputConfig']?.['slotKindById']?.[_0x20f618]);
      if (!_0x5c51a2) throw new Error('当前模型没有这个入参槽');
      const _0x5274f1 = normalizeText(_0x58ff69['type'])['toLowerCase'](),
        _0x3068b6 = normalizeText(_0x58ff69['name'])['toLowerCase'](),
        _0x313e6f =
          _0x5274f1['startsWith']('image/') || /\.(?:avif|bmp|gif|jpe?g|png|webp)$/i['test'](_0x3068b6)
            ? 'image'
            : _0x5274f1['startsWith']('video/') || /\.(?:avi|m4v|mkv|mov|mp4|webm)$/i['test'](_0x3068b6)
              ? 'video'
              : '';
      if (_0x313e6f !== _0x5c51a2)
        throw new Error(_0x5c51a2 === 'video' ? '请选择视频文件' : '请选择图片文件');
      const _0x373c7c = await _0x512566(_0x58ff69, _0xe9c0bd['id']),
        _0x487044 = resolveMediaRef(_0x373c7c);
      if (!_0x487044) throw new Error('视频模型入参保存结果缺少可用地址');
      const _0x23b1ec = _0x22494c({
        shotId: _0x34b475,
        slotId: _0x20f618,
        input: {
          kind: _0x5c51a2,
          url: _0x487044,
          modelId: _0x3614a9['modelId'],
          fileName: normalizeText(_0x58ff69['name']),
          mimeType: normalizeText(_0x58ff69['type']),
          thumbUrl: resolveVideoThumbnailRef(_0x373c7c),
        },
      });
      return (
        showToast(
          (_0x3614a9['fixedInputConfig']?.['slotById']?.[_0x20f618]?.['label'] || '模型入参') + '已接入。',
          'success',
        ),
        _0x23b1ec ? { project: _0x23b1ec } : null
      );
    } catch (_0x5204ec) {
      return (showToast(_0x5204ec?.['message'] || '视频模型入参上传失败', 'error'), null);
    }
  }
  function _0x63f841(_0xf47b5b = {}) {
    const _0xb7865 = normalizeText(_0xf47b5b['shotId']),
      _0x14e4fa = normalizeText(_0xf47b5b['slotId']),
      _0x175820 = _0xe9c0bd['shots']['find']((_0x17d85e) => _0x17d85e['id'] === _0xb7865);
    if (!_0x175820 || !_0x175820['replacementVideoInputsBySlot']?.[_0x14e4fa]) return null;
    const _0xa7a910 = _0x22494c({ shotId: _0xb7865, slotId: _0x14e4fa, input: null });
    return _0xa7a910 ? { project: _0xa7a910 } : null;
  }
  async function _0x1652ed(_0x48bf61, _0x13974d = {}) {
    if (!_0x48bf61 || typeof _0x512566 !== 'function') return null;
    const _0x5a3d4d = await _0x512566(_0x48bf61, _0xe9c0bd['id']),
      _0x44b7a8 = resolveMediaRef(_0x5a3d4d);
    if (!_0x44b7a8) throw new Error('关键帧保存结果缺少可用地址');
    return {
      keyframeRef: _0x44b7a8,
      keyframeTimeSec: Number(_0x13974d['keyframeTimeSec']) || 0x0,
      frame: _0x13974d['frame'] && typeof _0x13974d['frame'] === 'object' ? { ..._0x13974d['frame'] } : {},
    };
  }
  async function _0x254286(_0x4ee10f, _0x423adf = {}) {
    if (!_0x4ee10f || typeof _0x512566 !== 'function') return null;
    const _0x3b656a = await _0x512566(_0x4ee10f, _0xe9c0bd['id']),
      _0x13e563 = resolveMediaRef(_0x3b656a);
    if (!_0x13e563) throw new Error('声音保存结果缺少可用地址');
    const _0x5b0c7a = _0xe9c0bd['characters']['map']((_0x8daf65) =>
      _0x8daf65['id'] === _0x423adf['characterId']
        ? {
            ..._0x8daf65,
            voiceRef: _0x13e563,
            voiceReference: {
              audioUrl: resolveMediaUrl(_0x13e563),
              localPath: normalizeLocalPath(_0x13e563) || _0x13e563,
              fileName: normalizeText(_0x4ee10f['name']) || '上传声音',
              source: 'upload',
              updatedAt: Date['now'](),
            },
          }
        : _0x8daf65,
    );
    return { project: _0x19e007({ ..._0xe9c0bd, characters: _0x5b0c7a }) };
  }
  const _0x17b4d3 = (_0x4ca4bb) =>
    bindPersonReplacementCharacterVoice({
      project: _0xe9c0bd,
      request: _0x4ca4bb,
      showToast: showToast,
      addLibraryAssetsToProject: _0x5257a6,
      normalizeLocalPath: normalizeLocalPath,
      resolveMediaUrl: resolveMediaUrl,
      setProject: _0x19e007,
    });
  async function _0x3e1437(_0x413f26 = {}) {
    const _0x14af26 = _0xe9c0bd['characters']['find'](
      (_0x17ecb4) => _0x17ecb4['id'] === _0x413f26['characterId'],
    );
    if (!_0x14af26) return null;
    const _0x1a2633 = normalizeText(_0x413f26['prompt'] || _0x14af26['description']),
      _0x26fa9f =
        normalizeText(_0x413f26['promptPresetId']) ||
        normalizeText(_0xe9c0bd['workspace']['assetPromptPresetId']),
      _0x59b904 = applyPersonReplacementCharacterAssetPromptPreset(_0x26fa9f, _0x1a2633),
      _0x124a3d = getPersonReplacementCharacterBaseImageRef(_0x14af26);
    if (!_0x124a3d) return (showToast('请先上传人物基础形象。', 'warn'), null);
    if (!_0x59b904) return (showToast('请先填写新形象提示词。', 'warn'), null);
    const _0x3388af = buildCharacterAssetImageGenerationPayload({
      prompt: _0x59b904,
      modelId: _0x413f26['modelId'] || _0xe9c0bd['settings']['characterImageModelId'],
      provider: _0x413f26['provider'] || _0xe9c0bd['settings']['characterImageProvider'],
      providerProfileId:
        _0x413f26['providerProfileId'] || _0xe9c0bd['settings']['characterImageProviderProfileId'],
      generationParams:
        _0x413f26['generationParams'] || _0xe9c0bd['settings']['characterImageGenerationParams'],
      referenceImageUrls: [_0x124a3d],
    });
    if (_0x413f26['preview'] === !![]) return { payload: _0x3388af };
    if (typeof _0x190c33 !== 'function') return (showToast('图像生成服务尚未初始化。', 'error'), null);
    const _0xd08b93 = _0xe9c0bd['id'] + ':' + _0x14af26['id'];
    if (_0x4a9284['has'](_0xd08b93)) return null;
    _0x4a9284['add'](_0xd08b93);
    const _0x4091d0 = _0x14af26['appearances']['length'] + 0x1,
      _0x772e48 = _0x14af26['id'] + '-appearance-' + _0x4091d0 + '-' + Date['now'](),
      _0x229e3a = {
        id: _0x772e48,
        name: resolveGeneratedPersonReplacementAppearanceName(_0x26fa9f, _0x4091d0),
        imageUrl: '',
        prompt: _0x1a2633,
        promptPresetId: _0x26fa9f,
        occurrences: '当前项目',
        generationStatus: 'running',
        error: '',
      };
    _0x19e007({
      ..._0xe9c0bd,
      characters: _0xe9c0bd['characters']['map']((_0x53627f) =>
        _0x53627f['id'] === _0x14af26['id']
          ? { ..._0x53627f, appearances: [..._0x53627f['appearances'], _0x229e3a] }
          : _0x53627f,
      ),
      workspace: {
        ..._0xe9c0bd['workspace'],
        assetAppearanceIndexes: {
          ..._0xe9c0bd['workspace']['assetAppearanceIndexes'],
          [_0x14af26['id']]: _0x4091d0 - 0x1,
        },
        generatingAppearanceKeys: [
          ..._0xe9c0bd['workspace']['generatingAppearanceKeys'],
          _0x14af26['id'] + ':' + _0x772e48,
        ],
      },
    });
    try {
      const _0x2be987 = await _0x190c33(_0x3388af),
        _0x13c418 = getFirstSuccessfulImageRef(_0x2be987),
        _0x40b6f5 = _0xe9c0bd['characters']['map']((_0x4a6926) =>
          _0x4a6926['id'] === _0x14af26['id']
            ? {
                ..._0x4a6926,
                appearances: _0x4a6926['appearances']['map']((_0x1ce476) =>
                  _0x1ce476['id'] === _0x772e48
                    ? { ..._0x1ce476, imageUrl: _0x13c418, generationStatus: 'succeeded', error: '' }
                    : _0x1ce476,
                ),
              }
            : _0x4a6926,
        ),
        _0x1f4cff = _0x19e007({
          ..._0xe9c0bd,
          characters: _0x40b6f5,
          workspace: {
            ..._0xe9c0bd['workspace'],
            generatingAppearanceKeys: _0xe9c0bd['workspace']['generatingAppearanceKeys']['filter'](
              (_0x2a7f0e) => _0x2a7f0e !== _0x14af26['id'] + ':' + _0x772e48,
            ),
          },
        });
      return (
        _0x413f26['notifyCompletion'] === ![] && showToast('已新增' + _0x229e3a['name'] + '。', 'success'),
        _0x413f26['notifyCompletion'] !== ![] && _0x2adddd({ kind: 'asset', mediaRef: _0x13c418 }),
        { project: _0x1f4cff, ok: !![], characterId: _0x14af26['id'] }
      );
    } catch (_0x47a44a) {
      const _0x417d4e = _0x47a44a?.['getUserMessage']?.() || _0x47a44a?.['message'] || '人物形象生成失败',
        _0x1f4b7b = _0xe9c0bd['characters']['map']((_0x27212b) =>
          _0x27212b['id'] === _0x14af26['id']
            ? {
                ..._0x27212b,
                appearances: _0x27212b['appearances']['map']((_0x337503) =>
                  _0x337503['id'] === _0x772e48
                    ? { ..._0x337503, generationStatus: 'failed', error: _0x417d4e }
                    : _0x337503,
                ),
              }
            : _0x27212b,
        ),
        _0x479a09 = _0x19e007({
          ..._0xe9c0bd,
          characters: _0x1f4b7b,
          workspace: {
            ..._0xe9c0bd['workspace'],
            generatingAppearanceKeys: _0xe9c0bd['workspace']['generatingAppearanceKeys']['filter'](
              (_0x4c190d) => _0x4c190d !== _0x14af26['id'] + ':' + _0x772e48,
            ),
          },
        });
      return (
        showToast(_0x417d4e, 'error'),
        { project: _0x479a09, ok: ![], characterId: _0x14af26['id'], error: _0x417d4e }
      );
    } finally {
      _0x4a9284['delete'](_0xd08b93);
    }
  }
  const _0x4377cf = (_0x2e9b53 = {}) => _0x2cca4f['generate'](_0x2e9b53),
    _0xfcf7fa = (_0x28716a = {}) => _0x2cca4f['cancel'](_0x28716a),
    _0x29915c = createPersonReplacementVideoPreparationRunner({
      getProject: () => _0xe9c0bd,
      getProjectById: _0x1e4b41,
      setProject: _0x19e007,
      setProjectById: _0x54fe25,
      isDestroyed: () => _0x18c393,
      waitForActiveReverse: (_0x247999) => _0x250ad6['waitForActiveReverse'](_0x247999),
      fetchVideoMeta: fetchVideoMeta,
      resolveDurationSec: resolveDurationSec,
      enqueueMediaTask: enqueueMediaTask,
      resolveMediaRef: resolveMediaRef,
      showToast: showToast,
    });
  _0x5ec987 = createPersonReplacementVideoTaskRuntime({
    getProject: () => _0xe9c0bd,
    getProjectById: _0x1e4b41,
    setProject: _0x19e007,
    setProjectById: _0x54fe25,
    runPreparation: _0x29915c,
    generateReplacementVideo: _0x279d83,
    resolveInstallId: _0x53d921,
    persistNow: _0x5d3fcd,
    showToast: showToast,
    notifyGenerationCompleted: _0x2adddd,
    now: nowIso,
    createId: () => createId('replacement-video-request'),
  });
  function _0x2ec16b(_0x569b04 = {}) {
    return _0x5ec987['prepare'](_0x569b04);
  }
  function _0x27a393(_0x208a20 = {}) {
    return _0x5ec987['generate'](_0x208a20);
  }
  function _0x3c277b(_0x91a4d8 = {}) {
    return _0x5ec987['cancel'](_0x91a4d8);
  }
  _0x10a855 = createPersonReplacementVoiceSeparationRuntime({
    getProject: () => _0xe9c0bd,
    setProject: _0x19e007,
    persistNow: _0x5d3fcd,
    showToast: showToast,
    now: nowIso,
    createId: () => createId('replacement-voice-separation'),
    onStateChange: ({ sourceId: _0x63bc55, state: _0x2515d9 }) => {
      _0x57c10b?.['refreshVoiceSources']?.({
        sourceId: _0x63bc55,
        remountVoiceStudio: _0x2515d9?.['status'] === 'succeeded',
      });
    },
  });
  const _0x5a3e57 = createPersonReplacementOutputCoordinator({
      documentObject: documentObject,
      windowObject: windowObject,
      projectSession: _0x3eaa65,
      getWorkspace: () => _0x57c10b,
      prepareVideoReplacementShots: _0x2ec16b,
      createVoicePanel: createVoicePanel,
      enqueueMediaTask: enqueueMediaTask,
      playCompletion: playCompletion,
      showCompletionNotification: showCompletionNotification,
      saveMedia: saveMedia,
      saveMediaFiles: saveMediaFiles,
      createOutputCanvas: createOutputCanvas,
      onRequestClose: onRequestClose,
      showToast: showToast,
    }),
    _0x25a3ad = PERSON_REPLACEMENT_WORKSPACE_INTENTS,
    _0x266d53 = createPersonReplacementWorkspaceIntentPort({
      handlers: {
        [_0x25a3ad['GET_PROMPT_ENHANCEMENT_MODEL']]: (..._0x2c32c4) =>
          promptEnhancement['getPromptEnhancementModel']?.(..._0x2c32c4) || {},
        [_0x25a3ad['LIST_LIBRARY_ASSETS']]: _0x124687,
        [_0x25a3ad['SELECT_SOURCE_VIDEOS']]: _0x2e0f9d,
        [_0x25a3ad['SELECT_SOURCE_VIDEO']]: (_0x1c5d8e) => _0x2e0f9d([_0x1c5d8e]),
        [_0x25a3ad['REMOVE_SOURCE']]: _0x128a12,
        [_0x25a3ad['PROCESS_SOURCES']]: _0xffb9b5,
        [_0x25a3ad['ADD_LIBRARY_ASSETS_TO_PROJECT']]: _0x5257a6,
        [_0x25a3ad['ADD_LIBRARY_ASSETS_TO_CHARACTERS']]: _0x5a4a72,
        [_0x25a3ad['ADD_ASSET_APPEARANCE_TO_LIBRARY']]: _0x3314d4,
        [_0x25a3ad['SELECT_NEW_CHARACTER_IMAGES']]: _0x53f7d0,
        [_0x25a3ad['SELECT_NEW_CHARACTER_IMAGE']]: (_0x2211b6) => _0x53f7d0([_0x2211b6]),
        [_0x25a3ad['SELECT_NEW_SCENE_IMAGES']]: _0x5e59f,
        [_0x25a3ad['SELECT_NEW_AUDIO_FILES']]: _0xe748ae,
        [_0x25a3ad['SELECT_CHARACTER_REFERENCE']]: _0x113f25,
        [_0x25a3ad['SELECT_REPLACEMENT_IMAGE']]: _0x4911db,
        [_0x25a3ad['SELECT_REPLACEMENT_VIDEO_RESULT']]: _0x3107f4,
        [_0x25a3ad['SELECT_REPLACEMENT_VIDEO_INPUT']]: _0x2e6256,
        [_0x25a3ad['REMOVE_REPLACEMENT_VIDEO_INPUT']]: _0x63f841,
        [_0x25a3ad['SELECT_SHOT_KEYFRAME']]: _0x1652ed,
        [_0x25a3ad['SELECT_CHARACTER_VOICE']]: _0x254286,
        [_0x25a3ad['SELECT_CHARACTER_VOICE_LIBRARY']]: _0x17b4d3,
        [_0x25a3ad['DELETE_CHARACTER']]: _0x4ae8ac,
        [_0x25a3ad['DELETE_SCENE']]: _0x49eb4b,
        [_0x25a3ad['DELETE_AUDIO_ASSET']]: _0x5eed46,
        [_0x25a3ad['DOWNLOAD_IMAGE']]: _0x5a3e57['downloadImage'],
        [_0x25a3ad['DOWNLOAD_VIDEO']]: _0x5a3e57['downloadVideo'],
        [_0x25a3ad['PREVIEW_GENERATION']]: async (_0x40cb2) => {
          if (globalThis['window']?.['DEV_MODE'] !== !![]) throw new Error('仅开发者模式可调试请求');
          if (_0x40cb2['kind'] === 'asset') return _0x3e1437({ ..._0x40cb2, preview: !![] });
          if (_0x40cb2['kind'] === 'image') return _0x2cca4f['preview'](_0x40cb2);
          const _0x3d57d1 = _0x1e4b41(_0x40cb2['projectId']) || _0xe9c0bd,
            _0x2d0d65 = _0x3d57d1['shots']['find']((_0x35dc3a) => _0x35dc3a['id'] === _0x40cb2['shotId']);
          if (!_0x2d0d65) throw new Error('请先选择镜头');
          return {
            payload: buildPersonReplacementVideoRequest({ currentProject: _0x3d57d1, shot: _0x2d0d65 }),
          };
        },
        [_0x25a3ad['GENERATE_CHARACTER_IMAGE']]: _0x3e1437,
        [_0x25a3ad['RESOLVE_CHARACTER_IMAGE_BATCH_CONCURRENCY']]:
          resolvePersonReplacementCharacterImageBatchConcurrency,
        [_0x25a3ad['GENERATE_REPLACEMENT_IMAGE']]: _0x4377cf,
        [_0x25a3ad['CANCEL_REPLACEMENT_IMAGE']]: _0xfcf7fa,
        [_0x25a3ad['GENERATE_REPLACEMENT_VIDEO']]: _0x27a393,
        [_0x25a3ad['CANCEL_REPLACEMENT_VIDEO']]: _0x3c277b,
        [_0x25a3ad['COMPLETE_GENERATION_BATCH']]: _0x46d4ae,
        [_0x25a3ad['DETECT_SHOT_CUT_RANGES']]: _0x42a09a,
        [_0x25a3ad['UPDATE_SHOT_CUT_RANGES']]: _0x16069f,
        [_0x25a3ad['UPDATE_SHOT_REVERSE']]: _0x3f4881,
        [_0x25a3ad['SELECT_MANUAL_PERSON']]: _0x4f9adc,
        [_0x25a3ad['UPDATE_PEOPLE']]: _0x14341c,
        [_0x25a3ad['DELETE_PEOPLE']]: _0xbb6e7,
        [_0x25a3ad['MERGE_SOURCE_IDENTITIES']]: _0x3588c4,
        [_0x25a3ad['SPLIT_SOURCE_IDENTITY']]: _0x2ea307,
        [_0x25a3ad['CONFIRM_SOURCE_IDENTITY']]: _0x47e3a3,
        [_0x25a3ad['MOUNT_VOICE_STUDIO']]: _0x5a3e57['mountVoiceStudio'],
        [_0x25a3ad['EXTRACT_VOICE']]: _0x10a855['extract'],
        [_0x25a3ad['CANCEL_VOICE_EXTRACTION']]: _0x10a855['cancel'],
        [_0x25a3ad['RESUME_VOICE_EXTRACTION']]: _0x10a855['resume'],
        [_0x25a3ad['OPEN_PROJECT']]: _0xb1ac09,
        [_0x25a3ad['RENAME_PROJECT']]: _0x538b36,
        [_0x25a3ad['DUPLICATE_PROJECT']]: _0x22e917,
        [_0x25a3ad['COLLECT_PROJECT']]: _0x266b3e,
        [_0x25a3ad['IMPORT_PROJECT']]: _0x2ff9b1,
        [_0x25a3ad['ARCHIVE_PROJECT']]: _0x175d6e,
        [_0x25a3ad['DELETE_PROJECT']]: _0x589590,
        [_0x25a3ad['BACK_HOME']]: _0x10f5ce,
        [_0x25a3ad['COMPOSE_OUTPUT']]: _0x5a3e57['composeOutput'],
        [_0x25a3ad['EXPORT_OUTPUT']]: _0x5a3e57['exportOutput'],
        [_0x25a3ad['ADD_OUTPUT_TO_CANVAS']]: _0x5a3e57['addOutputToCanvas'],
        [_0x25a3ad['REPORT_STEP_NAVIGATION_BLOCKED']]: ({ reason: _0x36f2fc } = {}) => {
          const _0x8f71a0 =
            _0x36f2fc === PERSON_REPLACEMENT_STEP_GATE_REASONS['ASSET_SETTINGS_INCOMPLETE']
              ? '请先在素材设定上传至少一张人物或场景图片。'
              : _0x36f2fc === PERSON_REPLACEMENT_STEP_GATE_REASONS['IMAGE_REPLACEMENT_INCOMPLETE']
                ? '请先在图像替换中绑定人物或场景。'
                : '正在处理片段';
          showToast(_0x8f71a0, 'info');
        },
        [_0x25a3ad['HAS_PROJECT_PACKAGE_DRAG']]: (_0x1edb73) =>
          projectPackages?.['hasProjectPackageDrag']?.(_0x1edb73) === !![],
        [_0x25a3ad['DROP_PROJECT_PACKAGE']]: (_0x397ff4) =>
          projectPackages?.['importProjectFromDrop']?.(_0x397ff4) === !![],
        [_0x25a3ad['CAN_CLOSE']]: () => !![],
        [_0x25a3ad['CLOSE']]: () => onRequestClose(),
      },
    });
  _0x57c10b = createWorkspace({
    documentObject: documentObject,
    windowObject: windowObject,
    mountTarget: mountTarget,
    initialProject: _0x5b2624(),
    projectSession: _0x3eaa65,
    workspaceIntentPort: _0x266d53,
  });
  if (typeof subscribeLibraryAssets === 'function')
    try {
      const _0x1aacf7 = subscribeLibraryAssets(() => {
        if (!_0x18c393) _0x535ac1();
      });
      if (typeof _0x1aacf7 === 'function') _0x230249 = _0x1aacf7;
    } catch (_0x1e7431) {
      console['warn']('[replacementStudio]\x20failed\x20to\x20subscribe\x20asset\x20library', _0x1e7431);
    }
  const _0x47e845 = _0xe9c0bd,
    _0x3a387b = _0x2dbb02;
  let _0x3257fe = ![];
  const _0x1d8b7a = Promise['resolve']()
    ['then'](async () => {
      if (typeof _0x237915 !== 'function') {
        _0x3257fe = !![];
        return;
      }
      const _0x4c5e03 = normalizePersonReplacementProjectLibrary(await _0x237915()),
        _0x3f2b9f = _0x4c5e03['projects']['filter'](isPersistable);
      _0x334ccd = _0x3f2b9f['length'] !== _0x4c5e03['projects']['length'];
      const _0x2a1053 = _0x3f2b9f['map']((_0x2f1189) => {
          const _0x3a13d8 = settleInterruptedReplacementStudioProjectTasks(_0x2f1189);
          if (_0x3a13d8['changed']) _0x334ccd = !![];
          return _0x3a13d8['project'];
        }),
        _0x447743 = await Promise['all'](
          _0x2a1053['map']((_0x4e8d38) =>
            hydratePersonReplacementSourcePlaybackRefs(_0x4e8d38, { checkMediaExists: checkMediaExists }),
          ),
        );
      _0x447743['some']((_0x290ad0) => _0x290ad0['changed']) && (_0x334ccd = !![]);
      _0x1ec899 = normalizePersonReplacementProjectLibrary({
        ..._0x4c5e03,
        projects: _0x447743['map']((_0x4e98c7) => _0x4e98c7['project']),
      });
      const _0x2aa3c5 = _0xe9c0bd !== _0x47e845 || _0x2dbb02 !== _0x3a387b;
      (_0x2aa3c5
        ? isPersistable(_0xe9c0bd) &&
          ((_0x1ec899 = upsertPersonReplacementProject(_0x1ec899, _0xe9c0bd)), (_0x334ccd = !![]))
        : (_0x3eaa65['replace'](createInitialProject(), {
            persist: ![],
            presentation: 'none',
            reason: 'hydrate-home',
            touchUpdatedAt: ![],
          }),
          (_0x2dbb02 = 'home')),
        _0x535ac1(),
        (_0x3257fe = !![]));
    })
    ['catch']((_0x3fabc6) => {
      (console['warn']('[replacementStudio] hydration failed', _0x3fabc6),
        _0x29a3ae['setHydrationError'](_0x3fabc6),
        showToast('人物替换项目加载失败，已暂停自动保存以防覆盖数据。', 'error'));
    })
    ['finally'](() => {
      if (!_0x3257fe) return;
      _0x29a3ae['setReady'](!![]);
      if (_0x334ccd) _0x5094aa();
    });
  return Object['freeze']({
    open() {
      return (_0x57c10b['open']({ project: _0x5b2624() }), _0x57c10b);
    },
    close() {
      return _0x57c10b['close']();
    },
    getProject() {
      return cloneJson(_0xe9c0bd);
    },
    isSourceProcessing() {
      return Boolean(_0x5ac375);
    },
    getProjects() {
      return cloneJson(_0x1ec899['projects']);
    },
    setProject: _0x19e007,
    openProject: _0xb1ac09,
    renameProject: _0x538b36,
    duplicateProject: _0x22e917,
    collectProject: _0x266b3e,
    importProjectPackageResult: _0x10eaf2,
    archiveProject: _0x175d6e,
    deleteProject: _0x589590,
    showProjectHome: _0x10f5ce,
    loadSourceFile(_0x43cc63) {
      return _0x2e0f9d([_0x43cc63]);
    },
    loadSourceFiles: _0x2e0f9d,
    removeSource: _0x128a12,
    uploadReplacementImage: _0x4911db,
    uploadReplacementVideoResult: _0x3107f4,
    saveShotKeyframe: _0x1652ed,
    startSourceProcessing(_0xc62fb5 = {}) {
      return _0xffb9b5(_0xc62fb5);
    },
    updateShotCutRanges: _0x16069f,
    updateShotReverse: _0x3f4881,
    detectShotCutRanges: _0x42a09a,
    prepareVideoReplacementShots: _0x2ec16b,
    async analyzeSourceFile(_0x429a5e) {
      const _0xb781d3 = await _0x2e0f9d([_0x429a5e]);
      return _0xb781d3?.['ok'] ? await _0xffb9b5({ mode: 'cut' }) : _0xb781d3;
    },
    whenReady() {
      return _0x1d8b7a;
    },
    navigateToTaskResult: createPersonReplacementCompletionNavigation({
      getProject: () => _0xe9c0bd,
      getProjects: () => _0x1ec899['projects'],
      openProject: _0xb1ac09,
      setProject: _0x19e007,
      showToast: showToast,
      showProject: () => {
        ((_0x2dbb02 = 'project'), _0x535ac1());
      },
    }),
    async persist() {
      return (await _0x1d8b7a, await _0x5d3fcd({ force: !_0x29a3ae['isDirty']() }));
    },
    destroy() {
      if (_0x18c393) return;
      (_0x250ad6['invalidate'](),
        _0x5ac375?.['abort']?.(),
        (_0x5ac375 = null),
        _0x2cca4f?.['destroy']?.(),
        _0x5ec987?.['destroy']?.(),
        _0x10a855?.['destroy']?.(),
        _0x2ca276(),
        _0x230249(),
        (_0x230249 = () => {}),
        void _0x29a3ae['destroy']({ flush: !![], force: !![] })['catch'](() => {}),
        (_0x18c393 = !![]),
        _0x57c10b['destroy'](),
        _0x5a3e57['destroy'](),
        _0x3b6bc2(),
        _0x3eaa65['destroy']());
    },
  });
}
