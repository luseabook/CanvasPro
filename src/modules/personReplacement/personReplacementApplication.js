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
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function resolveSmartClipFailureMessage(item) {
  const error2 = item?.['stages']?.['keyframes']?.['error'] || item?.['error'];
  if (normalizeText(error2?.['code']) === 'no_results') return '视频无法读取有效时长或提取关键帧';
  return normalizeText(error2?.['message'] || error2) || '视频未检测到可用片段';
}
function cloneJson(key) {
  return key && typeof key === 'object' ? JSON['parse'](JSON['stringify'](key)) : key;
}
function nowIso() {
  return new Date()['toISOString']();
}
function createId(index) {
  const result = globalThis['crypto']?.['randomUUID']?.();
  return index + '-' + (result || Date['now']() + '-' + Math['round'](Math['random']() * 0x186a0));
}
function resolveMediaRef(response) {
  if (typeof response === 'string') return normalizeText(response);
  return normalizeText(
    pickResultLocalPath(response) ||
      response?.['displayUrl'] ||
      response?.['videoUrl'] ||
      response?.['imageUrl'] ||
      response?.['url'] ||
      response?.['originalUrl'] ||
      response?.['path'],
  );
}
function resolveMediaUrl(data) {
  const mediaRef2 = resolveMediaRef(data);
  return mediaRef2 ? localPathToUrl(mediaRef2) || mediaRef2 : '';
}
function resolveDurationSec(options) {
  const count = Number(
    options?.['durationSec'] ??
      options?.['videoDuration'] ??
      options?.['duration'] ??
      options?.['metadata']?.['duration'],
  );
  return Number['isFinite'](count) && count > 0x0 ? count : 0x0;
}
function resolveVideoThumbnailRef(target) {
  return normalizeText(
    target?.['posterLocalPath'] ||
      target?.['thumbLocalPath'] ||
      target?.['posterUrl'] ||
      target?.['thumbUrl'],
  );
}
function resolveVideoPlaybackRef(source) {
  return normalizeText(
    normalizeLocalPath(source?.['displayLocalPath'] || source?.['displayUrl']) || source?.['displayUrl'],
  );
}
function createProjectTitle(next) {
  return (
    normalizeText(next)
      ['replace'](/^.*[\\/]/u, '')
      ['replace'](/\.[^.]+$/u, '') || '未命名人物替换项目'
  );
}
function createUploadedAssetName(current, entry) {
  return (
    normalizeText(current)
      ['replace'](/^.*[\\/]/u, '')
      ['replace'](/\.[^.]+$/u, '') || entry
  );
}
const createApplicationProject = normalizeReplacementStudioApplicationProject;
function createInitialProject() {
  const createdAt = nowIso();
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
      createdAt: createdAt,
      updatedAt: createdAt,
    }),
  );
}
function isPersistable(response2) {
  return Boolean(
    response2?.['characters']?.['length'] ||
    response2?.['shots']?.['length'] ||
    (response2?.['status'] && response2['status'] !== 'draft'),
  );
}
export function createReplacementStudioApplication({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  mountTarget: mountTarget = '#v2-wrap',
  uploadFile: uploadFile,
  prepareUploadedVideoAsset: prepareUploadedVideoAsset = prepareImportedVideoAsset,
  checkMediaExists: checkMediaExists = checkLocalMediaExists,
  generateCharacterImage: generateCharacterImage,
  generateReplacementImage: generateReplacementImage = generateCharacterImage,
  promptEnhancement: promptEnhancement = {},
  resumeReplacementImage: resumeReplacementImage,
  createLocationGuide: createLocationGuide,
  generateReplacementVideo: generateReplacementVideo,
  resolveInstallId: resolveInstallId,
  loadWorkspace: loadWorkspace,
  saveWorkspace: saveWorkspace,
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
  let initialProject = createInitialProject();
  const projectSession = createReplacementStudioProjectSession({
      initialProject: initialProject,
      now: nowIso,
    }),
    handler = projectSession['subscribe']((record) => {
      ((initialProject = record['project']),
        record['source'] === 'workspace' &&
          record['reason'] === 'step-change' &&
          record['previousProject']?.['workspace']?.['step'] !== 0x3 &&
          record['project']['workspace']?.['step'] === 0x3 &&
          void prepareVideoReplacementShots());
    });
  let args = normalizePersonReplacementProjectLibrary(),
    workspaceView = 'home',
    workspace = null,
    enabled = ![],
    payload = ![],
    persistenceState = {
      status: typeof saveWorkspace === 'function' ? 'saved' : 'idle',
      error: '',
      retryAttempt: 0x0,
    },
    abortController = null,
    personReplacementImageTaskRuntime = null,
    videoTaskRuntime = null,
    personReplacementVoiceSeparationRuntime = null,
    handler2 = () => {};
  const map = new Set(),
    map2 = new Set(),
    coordinator = createPersonReplacementShotCutMutationCoordinator(),
    sourcePreviewUrls = new Map(),
    handler3 = (options2 = {}) => {
      void Promise['allSettled']([
        Promise['resolve']()['then'](() => playCompletion?.('generation-success')),
        Promise['resolve']()['then'](() => showCompletionNotification?.(options2)),
      ])['then']((list) => {
        list['forEach']((response3) => {
          if (response3['status'] !== 'rejected') return;
          console['warn']('[replacementStudio] completion feedback failed', response3['reason']);
        });
      });
    },
    notifyCompletion = ({
      kind: kind = 'image',
      mediaRef: mediaRef = '',
      projectId: projectId = initialProject['id'],
    } = {}) => {
      const step = kind === 'video',
        handle = kind === 'asset';
      handler3({
        navigation: {
          source: 'replacement-studio',
          projectId: projectId,
          step: step ? 0x3 : handle ? 0x1 : 0x2,
        },
        body: step ? '人物替换视频生成完成。' : handle ? '人物形象生成完成。' : '人物替换首帧生成完成。',
        mediaKind: step ? 'video' : 'image',
        node: {
          name: step ? '人物替换视频' : handle ? '人物形象' : '人物替换首帧',
          ...(step ? { videoUrl: mediaRef } : { imageUrl: mediaRef }),
        },
      });
    },
    state = ({
      kind: kind = 'image',
      projectId: projectId = initialProject['id'],
      totalCount: totalCount = 0x0,
      successCount: successCount = 0x0,
    } = {}) => {
      const enabled2 = Math['max'](0x0, Math['trunc'](Number(totalCount) || 0x0));
      if (!enabled2) return ![];
      const config = Math['max'](0x0, Math['min'](enabled2, Math['trunc'](Number(successCount) || 0x0))),
        body = enabled2 - config,
        scope = kind === 'asset' ? '人物形象' : kind === 'video' ? '替换视频' : '替换首帧';
      return (
        handler3({
          body:
            body > 0x0
              ? '批量' + scope + '生成已结束：成功 ' + config + ' 个，失败 ' + body + ' 个。'
              : enabled2 + '\x20个' + scope + '已全部生成完成。',
          navigation: {
            source: 'replacement-studio',
            projectId: projectId,
            step: kind === 'video' ? 0x3 : kind === 'asset' ? 0x1 : 0x2,
          },
        }),
        !![]
      );
    };
  async function resolveInstallId2(output) {
    const text = normalizeText(windowObject?.['__aicInstallId'] || globalThis['__aicInstallId']);
    if (getModelManifest(output)?.['vip'] !== !![]) return text;
    try {
      const value2 =
        typeof resolveInstallId === 'function'
          ? await resolveInstallId()
          : typeof windowObject?.['ensureSubscriptionInstallId'] === 'function'
            ? await windowObject['ensureSubscriptionInstallId']()
            : '';
      return normalizeText(value2) || text;
    } catch {
      return text;
    }
  }
  const run = () => Boolean(abortController || map['size'] || map2['size']),
    hasActiveProjectTask = (value3 = initialProject['id']) => {
      const text2 = normalizeText(value3),
        value4 = text2 === normalizeText(initialProject['id']);
      return Boolean(
        (value4 && abortController) ||
        (value4 && map['size']) ||
        personReplacementImageTaskRuntime?.['hasActiveTasksForProject']?.(text2) ||
        videoTaskRuntime?.['hasActiveTasksForProject']?.(text2) ||
        (value4 && map2['size']),
      );
    },
    handler4 = () =>
      initialProject['sources']['some'](
        (value5) => normalizeText(value5?.['processingStatus'])['toLowerCase']() === 'uploading',
      ),
    handler5 = (value6, value7) => normalizeText(value6) + '\x1f' + normalizeText(value7),
    handler6 = (value8, value9 = initialProject['id']) => {
      const value10 = handler5(value9, value8),
        value11 = sourcePreviewUrls['get'](value10) || '';
      return (sourcePreviewUrls['delete'](value10), value11);
    },
    handler7 = (value12, value13 = initialProject['id']) => {
      const value14 = handler6(value12, value13);
      if (value14) revokeTrackedMediaObjectUrl(value14);
    },
    releaseAllSourcePreviews = (value15 = '') => {
      const text3 = normalizeText(value15);
      [...sourcePreviewUrls['entries']()]['forEach'](([enabled3, value16]) => {
        if (text3 && !enabled3['startsWith'](text3 + '\x1f')) return;
        sourcePreviewUrls['delete'](enabled3);
        if (value16) revokeTrackedMediaObjectUrl(value16);
      });
    },
    handler8 = (error3, value17) => {
      const text4 = normalizeText(value17);
      if (!error3 || !text4) return '';
      handler7(text4);
      try {
        const trackedMediaObjectUrl = createTrackedMediaObjectUrl(error3, {
          kind: 'video',
          ownerId: 'person-replacement:' + initialProject['id'] + ':' + text4,
          sourceUrl: normalizeText(error3['name']),
        });
        return (
          trackedMediaObjectUrl &&
            sourcePreviewUrls['set'](handler5(initialProject['id'], text4), trackedMediaObjectUrl),
          trackedMediaObjectUrl
        );
      } catch {
        return '';
      }
    },
    rememberProject = (value18 = initialProject) => {
      isPersistable(value18) && (args = upsertPersonReplacementProject(args, value18));
    },
    libraryAssets = () => readPersonReplacementLibraryAssets(listLibraryAssets),
    snapshot = (libraryProjects = !![]) =>
      buildPersonReplacementWorkspaceSnapshot({
        project: initialProject,
        sourcePreviewUrls: sourcePreviewUrls,
        persistenceState: persistenceState,
        workspaceView: workspaceView,
        libraryProjects: libraryProjects ? args['projects'] : undefined,
        libraryAssets: libraryAssets(),
      }),
    handler9 = (
      status,
      { error: error = '', retryAttempt: retryAttempt = persistenceState['retryAttempt'] } = {},
    ) => {
      return (
        (persistenceState = {
          status: status,
          error: normalizeText(error),
          retryAttempt: Math['max'](0x0, Math['trunc'](Number(retryAttempt) || 0x0)),
        }),
        workspace?.['setPersistenceState']?.(cloneJson(persistenceState)),
        persistenceState
      );
    },
    workspacePersistenceCoordinator = createWorkspacePersistenceCoordinator({
      ready: ![],
      debounceMs: 0x15e,
      save: saveWorkspace,
      getSnapshot: () => {
        return (rememberProject(), cloneJson(args));
      },
      setTimeoutFn: windowObject?.['setTimeout']?.['bind']?.(windowObject),
      clearTimeoutFn: windowObject?.['clearTimeout']?.['bind']?.(windowObject),
      onStateChange: ({ status: status2, error: error4, retryAttempt: retryAttempt2 }) => {
        handler9(status2, { error: error4, retryAttempt: retryAttempt2 });
      },
      onError: (value19) => {
        console['warn']('[replacementStudio] persist failed', value19);
      },
    }),
    persistNow = ({ force: force = ![] } = {}) =>
      enabled ? Promise['resolve'](null) : workspacePersistenceCoordinator['flush']({ force: force }),
    schedulePersistence = () => {
      if (enabled) return;
      workspacePersistenceCoordinator['schedule']();
    },
    syncWorkspace = () => workspace?.['setProject']?.(snapshot()),
    handler10 = () => {
      if (typeof workspace?.['syncProjectState'] === 'function')
        return workspace['syncProjectState'](snapshot(workspaceView !== 'project'), { returnSnapshot: ![] });
      return syncWorkspace();
    };
  projectSession['connect']({
    rememberProject: rememberProject,
    presentProject: ({ presentation: presentation }) => {
      if (presentation === 'state') return handler10();
      return syncWorkspace();
    },
    schedulePersistence: schedulePersistence,
  });
  const setProject = (
      value20,
      { persist: persist = !![], sync: sync = !![], renderWorkspace: renderWorkspace = !![] } = {},
    ) =>
      projectSession['replace'](value20, {
        persist: persist,
        presentation: !sync ? 'none' : renderWorkspace ? 'render' : 'state',
      }),
    handler11 = async ({
      expectedProjectId: expectedProjectId = initialProject['id'],
      renderWorkspace: renderWorkspace = !![],
    } = {}) => {
      const text5 = normalizeText(expectedProjectId),
        cloneJson2 = cloneJson(initialProject),
        hydratePersonReplacementSourcePlaybackRefs2 = await hydratePersonReplacementSourcePlaybackRefs(
          cloneJson2,
          {
            checkMediaExists: checkMediaExists,
          },
        );
      if (
        enabled ||
        !hydratePersonReplacementSourcePlaybackRefs2['changed'] ||
        normalizeText(initialProject['id']) !== text5
      )
        return ![];
      const map3 = new Map(
        hydratePersonReplacementSourcePlaybackRefs2['project']['sources']['map']((value21) => [
          normalizeText(value21?.['id']),
          value21,
        ]),
      );
      let enabled4 = ![];
      const sources = initialProject['sources']['map']((args2) => {
        const assetId = map3['get'](normalizeText(args2?.['id']));
        if (
          !assetId ||
          normalizeText(assetId['videoRef']) !== normalizeText(args2['videoRef']) ||
          normalizeText(assetId['playbackVideoRef']) === normalizeText(args2['playbackVideoRef'])
        )
          return args2;
        return (
          (enabled4 = !![]),
          {
            ...args2,
            ...(assetId['assetId'] ? { assetId: assetId['assetId'] } : {}),
            playbackVideoRef: assetId['playbackVideoRef'],
          }
        );
      });
      if (!enabled4) return ![];
      return (
        setProject({ ...initialProject, sources: sources }, { renderWorkspace: renderWorkspace }),
        !![]
      );
    },
    getProjectById = (value22) => {
      const text6 = normalizeText(value22);
      if (!text6) return null;
      if (normalizeText(initialProject['id']) === text6) return cloneJson(initialProject);
      const value23 = args['projects']['find']((value24) => normalizeText(value24?.['id']) === text6);
      return value23 ? createApplicationProject(value23, value23) : null;
    },
    setProjectById = (
      value25,
      value26,
      { persist: persist = !![], renderWorkspace: renderWorkspace = ![] } = {},
    ) => {
      const text7 = normalizeText(value25 || value26?.['id']);
      if (!text7 || normalizeText(value26?.['id']) !== text7) return null;
      if (normalizeText(initialProject['id']) === text7)
        return setProject(value26, { persist: persist, renderWorkspace: renderWorkspace });
      const enabled5 = args['projects']['find']((value27) => normalizeText(value27?.['id']) === text7);
      if (!enabled5) return null;
      const currentProjectId = normalizeText(initialProject['id']),
        applicationProject = createApplicationProject(value26, enabled5);
      ((args = upsertPersonReplacementProject(args, applicationProject)),
        (args = { ...args, currentProjectId: currentProjectId || args['currentProjectId'] }));
      if (persist) schedulePersistence();
      if (workspaceView === 'home') handler10();
      return cloneJson(applicationProject);
    };
  personReplacementImageTaskRuntime = createPersonReplacementImageTaskRuntime({
    getProject: () => initialProject,
    getProjectById: getProjectById,
    commitProject: (value28) => setProject(value28, { renderWorkspace: ![] }),
    commitProjectById: (value29, value30) => setProjectById(value29, value30, { renderWorkspace: ![] }),
    generateImage: generateReplacementImage,
    ...promptEnhancement,
    createLocationGuide: createLocationGuide,
    resumeImageTask: resumeReplacementImage,
    createRequestId: () => createId('replacement-image-request'),
    resolvePromptRequest: createPersonReplacementImagePromptRequestResolver(),
    showToast: showToast,
    now: nowIso,
    notifyCompletion: notifyCompletion,
    persistNow: persistNow,
  });
  const personReplacementAppearanceAssetLibraryOperation =
      createPersonReplacementAppearanceAssetLibraryOperation({
        getProject: () => initialProject,
        setProject: setProject,
        saveAssetPackageItem: saveAssetPackageItem,
        persistOutputFromUrl: persistOutputFromUrl,
        showToast: showToast,
      }),
    handler12 = () => {
      isPersistable(initialProject) &&
        (rememberProject(),
        projectSession['replace'](createInitialProject(), {
          persist: ![],
          presentation: 'none',
          reason: 'fresh-import',
          touchUpdatedAt: ![],
        }));
    },
    openProject = (value31) => {
      const enabled6 = args['projects']['find']((value32) => value32['id'] === normalizeText(value31));
      if (!enabled6) return null;
      const text8 = normalizeText(enabled6['id']) !== normalizeText(initialProject['id']);
      if (handler4() && text8)
        return (showToast('素材正在上传，请等待上传完成或取消上传后再打开其他项目。', 'info'), null);
      if (run() && text8)
        return (
          showToast(
            abortController
              ? '当前项目正在后台处理，请完成后再打开其他项目。'
              : '当前项目仍有任务处理中，请完成后再打开其他项目。',
            'info',
          ),
          null
        );
      (projectSession['replace'](enabled6, {
        persist: ![],
        presentation: 'none',
        reason: 'open-project',
        touchUpdatedAt: ![],
      }),
        (workspaceView = 'project'),
        syncWorkspace(),
        void handler11({ expectedProjectId: initialProject['id'] }),
        void personReplacementImageTaskRuntime?.['resumeRecoverable']?.(),
        void videoTaskRuntime?.['resumeRecoverable']?.());
      if (initialProject['workspace']['step'] === 0x3) void prepareVideoReplacementShots();
      return cloneJson(initialProject);
    },
    showProjectHome = () => {
      rememberProject();
      if (hasActiveProjectTask(initialProject['id']))
        return ((workspaceView = 'home'), syncWorkspace(), schedulePersistence(), snapshot());
      return (
        releaseAllSourcePreviews(initialProject['id']),
        projectSession['replace'](createInitialProject(), {
          persist: ![],
          presentation: 'none',
          reason: 'show-project-home',
          touchUpdatedAt: ![],
        }),
        (workspaceView = 'home'),
        syncWorkspace(),
        schedulePersistence(),
        snapshot()
      );
    },
    personReplacementProjectLibraryWorkspaceController =
      createPersonReplacementProjectLibraryWorkspaceController({
        getProject: () => initialProject,
        getLibrary: () => args,
        setLibrary: (value33) => {
          args = value33;
        },
        getProjectById: getProjectById,
        rememberProject: rememberProject,
        hasActiveProjectTask: hasActiveProjectTask,
        isProcessing: () => Boolean(abortController),
        replaceProject: (...args3) => projectSession['replace'](...args3),
        createApplicationProject: createApplicationProject,
        createInitialProject: createInitialProject,
        createId: createId,
        now: nowIso,
        cloneJson: cloneJson,
        syncWorkspace: syncWorkspace,
        schedulePersistence: schedulePersistence,
        snapshot: snapshot,
        releaseAllSourcePreviews: releaseAllSourcePreviews,
        openProject: openProject,
        projectPackages: projectPackages,
        showToast: showToast,
      }),
    {
      archiveProject: archiveProject,
      collectProject: collectProject,
      deleteProject: deleteProject,
      duplicateProject: duplicateProject,
      importProjectPackage: importProjectPackage,
      importProjectPackageResult: importProjectPackageResult,
      renameProject: renameProject,
    } = personReplacementProjectLibraryWorkspaceController,
    removeSource = ({ sourceId: sourceId } = {}) => {
      const text9 = normalizeText(sourceId),
        enabled7 = initialProject['sources']['find']((value34) => value34['id'] === text9);
      if (!enabled7) return null;
      handler7(text9);
      const title = initialProject['sources']
          ['filter']((value35) => value35['id'] !== text9)
          ['map']((args4, order) => ({ ...args4, order: order })),
        shots = initialProject['shots']['filter']((value36) => value36['sourceId'] !== text9),
        map4 = new Set(
          shots['flatMap']((value37) =>
            value37['people']
              ['map']((value38) => normalizeText(value38['sourceCharacterId']))
              ['filter'](Boolean),
          ),
        ),
        value39 = initialProject['audio']['selectedSourceId'] === text9,
        value40 =
          Boolean(enabled7['videoRef']) &&
          initialProject['audio']['originalAudioRef'] === enabled7['videoRef'],
        selectedSourceId = value39 ? title[0x0]?.['id'] || '' : initialProject['audio']['selectedSourceId'],
        value41 = title['find']((value42) => value42['id'] === selectedSourceId) || title[0x0] || null,
        value43 =
          Boolean(initialProject['output']['originalMasterRef']) &&
          initialProject['audio']['originalAudioRef'] === initialProject['output']['originalMasterRef'],
        originalAudioRef =
          value40 || value43 ? value41?.['videoRef'] || '' : initialProject['audio']['originalAudioRef'],
        value44 = {
          ...initialProject,
          title: title['length'] ? initialProject['title'] : '未命名人物替换项目',
          status: title['length'] ? initialProject['status'] : 'draft',
          source: title[0x0] || {},
          sources: title,
          shots: shots,
          sourceCharacters: buildPersonReplacementSourceCharacters(shots, initialProject['sourceCharacters']),
          mappings: initialProject['mappings']['filter']((value45) =>
            map4['has'](normalizeText(value45['sourceCharacterId'])),
          ),
          audio: {
            ...initialProject['audio'],
            originalAudioRef: originalAudioRef,
            selectedSourceId: selectedSourceId,
          },
        },
        args5 =
          shots['length'] === initialProject['shots']['length']
            ? value44
            : transitionPersonReplacementOutput(value44, {
                type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['SOURCE_GRAPH_CHANGED'],
                nextOriginalAudioRef: originalAudioRef,
              }),
        value46 = !title['length'] && !shots['length'] && !initialProject['characters']['length'];
      return (
        value46
          ? ((args = removePersonReplacementProject(args, initialProject['id'])),
            projectSession['replace'](
              { ...args5, updatedAt: nowIso() },
              { persist: ![], presentation: 'none', reason: 'remove-final-source', touchUpdatedAt: ![] },
            ),
            syncWorkspace(),
            schedulePersistence())
          : setProject(args5),
        snapshot()
      );
    };
  async function loadSourceFiles(list2 = []) {
    const list3 = (Array['isArray'](list2) ? list2 : [list2])['filter'](Boolean);
    if (!list3['length']) return { ok: ![], reason: 'missing-file' };
    if (abortController)
      return (
        showToast('当前项目正在后台处理，请完成后再新建项目。', 'info'),
        { ok: ![], reason: 'already-running' }
      );
    if (typeof uploadFile !== 'function') throw new Error(REPLACEMENT_STUDIO_NAME + '缺少素材上传服务');
    if (workspaceView !== 'home') workspaceView = 'home';
    handler12();
    const order2 = [...initialProject['sources']],
      list4 = list3['map']((error5, value47) => ({
        id: createId('source'),
        fileName: normalizeText(error5['name']) || '视频 ' + (order2['length'] + value47 + 0x1),
        videoRef: '',
        processingStatus: 'uploading',
        processingProgress: 0x0,
        order: order2['length'] + value47,
      }));
    (list4['forEach']((value48, value49) => {
      handler8(list3[value49], value48['id']);
    }),
      setProject({
        ...initialProject,
        title:
          initialProject['title'] === '未命名人物替换项目'
            ? createProjectTitle(list3[0x0]?.['name'])
            : initialProject['title'],
        sources: [...order2, ...list4],
        source: order2[0x0] || list4[0x0],
        workspace: { ...initialProject['workspace'], view: 'home', step: 0x1 },
      }));
    const sources2 = [];
    for (let value50 = 0x0; value50 < list3['length']; value50 += 0x1) {
      const value51 = list3[value50],
        selectedSourceId2 = list4[value50];
      try {
        const value52 = await uploadFile(value51, initialProject['id']),
          videoRef = resolveMediaRef(value52);
        if (!videoRef) throw new Error('源视频保存结果缺少可用地址');
        const playbackVideoRef = resolveVideoPlaybackRef(value52),
          durationSec = resolveDurationSec(value52),
          thumbnailRef = resolveVideoThumbnailRef(value52);
        if (!initialProject['sources']['some']((value53) => value53['id'] === selectedSourceId2['id']))
          continue;
        sources2['push'](value52);
        const value54 = thumbnailRef ? handler6(selectedSourceId2['id']) : '';
        setProject({
          ...initialProject,
          sources: initialProject['sources']['map']((args6) =>
            args6['id'] === selectedSourceId2['id']
              ? {
                  ...args6,
                  assetId: normalizeText(value52?.['assetId']),
                  videoRef: videoRef,
                  playbackVideoRef: playbackVideoRef,
                  thumbnailRef: thumbnailRef,
                  durationSec: durationSec || args6['durationSec'],
                  processingStatus: 'ready-to-start',
                  processingProgress: 0x0,
                }
              : args6,
          ),
          audio: initialProject['audio']['originalAudioRef']
            ? initialProject['audio']
            : {
                ...initialProject['audio'],
                originalAudioRef: videoRef,
                selectedSourceId: selectedSourceId2['id'],
              },
        });
        if (value54) revokeTrackedMediaObjectUrl(value54);
      } catch (error6) {
        (setProject({
          ...initialProject,
          sources: initialProject['sources']['map']((args7) =>
            args7['id'] === selectedSourceId2['id']
              ? { ...args7, processingStatus: 'failed', error: error6?.['message'] || '视频上传失败' }
              : args7,
          ),
        }),
          showToast(error6?.['message'] || '视频上传失败', 'error'));
      }
    }
    const ok = initialProject['sources']['filter']((value55) => value55['videoRef'])['length'];
    if (ok) showToast('已加入 ' + ok + '\x20个视频。', 'success');
    return { ok: ok > 0x0, project: snapshot(), sources: sources2 };
  }
  async function run2(id) {
    const { personDetection: personDetection, ...args8 } = id;
    if (!id['keyframeRef'])
      return (
        recordPersonReplacementDetectionFailure(id, new Error('人物检测缺少首帧图片')),
        { ...args8, error: '人物检测缺少首帧图片', analysisStatus: 'failed', reviewRequired: !![] }
      );
    try {
      const frame =
          personDetection &&
          typeof personDetection === 'object' &&
          Array['isArray'](personDetection['people'])
            ? personDetection
            : await detectPeople(id['keyframeRef'], { maxPeople: 0x20 }),
        list5 = [...frame['people']]['sort']((value56, value57) => {
          const value58 = Number(value56?.['bbox']?.['x']) || 0x0,
            value59 = Number(value57?.['bbox']?.['x']) || 0x0,
            value60 = Number(value56?.['bbox']?.['y']) || 0x0,
            value61 = Number(value57?.['bbox']?.['y']) || 0x0;
          return value58 - value59 || value60 - value61;
        }),
        people = list5['map']((bbox, value62) => ({
          id: id['id'] + '-person-' + (value62 + 0x1),
          sourceCharacterId: id['sourceId'] + '-' + id['id'] + '-person-' + (value62 + 0x1),
          targetCharacterId: '',
          targetAppearanceId: '',
          label: formatPersonReplacementPersonLabel(value62),
          detectionClass:
            !normalizeText(bbox['className']) ||
            normalizeText(bbox['className'])['toLowerCase']() === 'person'
              ? 'person'
              : 'character',
          detectionMethod: 'automatic',
          bbox: bbox['bbox'],
          detectionConfidence: bbox['confidence'],
          identityConfidence: 0x0,
          identityMatchSimilarity: 0x0,
          identityReviewStatus: 'confirmed',
          identityReviewRequired: ![],
          identityMethod: 'fallback',
          ambiguousIdentityIds: [],
          orientationConfidence: Number(bbox['orientationConfidence']) || 0x0,
          orientation: bbox['orientation'] || 'unknown',
          orientationModelId: bbox['orientationModelId'] || '',
          occlusion: 'none',
        }));
      return {
        ...args8,
        frame: frame['frame'],
        people: people,
        analysisStatus: 'succeeded',
        reviewRequired: people['length'] === 0x0,
      };
    } catch (error7) {
      return (
        recordPersonReplacementDetectionFailure(id, error7),
        {
          ...args8,
          people: [],
          analysisStatus: 'failed',
          reviewRequired: !![],
          error: [id['error'], error7?.['message'] || '人物检测失败']['filter'](Boolean)['join']('；'),
        }
      );
    }
  }
  async function run3(shots2) {
    const status3 = (Array['isArray'](shots2) ? shots2 : [])['filter'](
      (value63) => value63['keyframeRef'] && value63['people']['length'],
    );
    if (!status3['length'] || typeof identifyPeople !== 'function')
      return {
        shots: shots2,
        sourceCharacters: buildPersonReplacementSourceCharacters(shots2, initialProject['sourceCharacters']),
        analysis: {
          status: status3['length'] ? 'failed' : 'succeeded',
          modelId: '',
          stats: { identityCount: 0x0, reviewCount: 0x0 },
          error: status3['length'] ? '人物身份分析服务尚未初始化' : '',
        },
      };
    try {
      const sourceOrder = new Map(
          initialProject['sources']['map']((value64, value65) => [
            value64['id'],
            value64['order'] ?? value65,
          ]),
        ),
        modelId = await identifyPeople(
          status3['map']((shotId2, value66) => ({
            shotId: shotId2['id'],
            sourceId: shotId2['sourceId'],
            sourceOrder: sourceOrder['get'](shotId2['sourceId']) ?? 0x0,
            shotIndex: shotId2['index'] ?? value66,
            shotTimeSec: shotId2['keyframeTimeSec'] ?? shotId2['startTimeSec'],
            imageRef: shotId2['keyframeRef'],
            people: shotId2['people']['map']((personId) => ({
              personId: personId['id'],
              bbox: personId['locator']?.['bbox'] || personId['bbox'],
              detectionConfidence: personId['detectionConfidence'],
            })),
          })),
          {
            autoThreshold: initialProject['settings']['identityAutoThreshold'],
            reviewThreshold: initialProject['settings']['identityReviewThreshold'],
            ambiguityMargin: initialProject['settings']['identityAmbiguityMargin'],
            maxShotGap: 0x2,
          },
        ),
        map5 = new Map(
          (modelId['assignments'] || [])['map']((value67) => [
            value67['shotId'] + ':' + value67['personId'],
            value67,
          ]),
        ),
        shots3 = shots2['map']((people2) => ({
          ...people2,
          people: people2['people']['map']((label) => {
            const sourceCharacterId = map5['get'](people2['id'] + ':' + label['id']);
            if (!sourceCharacterId)
              return {
                ...label,
                identityReviewStatus: 'confirmed',
                identityReviewRequired: ![],
                identityMethod: 'fallback',
              };
            return {
              ...label,
              sourceCharacterId: sourceCharacterId['sourceCharacterId'],
              label: label['label'] || sourceCharacterId['label'],
              identityConfidence: sourceCharacterId['identityConfidence'],
              identityMatchSimilarity: sourceCharacterId['matchSimilarity'],
              identityReviewStatus: 'confirmed',
              identityReviewRequired: ![],
              identityMethod: 'osnet',
              ambiguousIdentityIds: sourceCharacterId['ambiguousIdentityIds'] || [],
              notes: sourceCharacterId['notes'] || label['notes'],
            };
          }),
        })),
        map6 = new Map((modelId['identities'] || [])['map']((value68) => [value68['id'], value68])),
        sourceCharacters = buildPersonReplacementSourceCharacters(shots3, initialProject['sourceCharacters'])[
          'map'
        ]((error8) => {
          const name = map6['get'](error8['id']);
          return name
            ? {
                ...error8,
                name: name['name'] || error8['name'],
                confidence: name['confidence'],
                reviewRequired: ![],
                identityReviewStatus: 'confirmed',
                memberCount: name['memberCount'] || error8['memberCount'],
                exemplarShotId: name['exemplarShotId'] || error8['exemplarShotId'],
                exemplarPersonId: name['exemplarPersonId'] || error8['exemplarPersonId'],
                ambiguousIdentityIds: name['ambiguousIdentityIds'] || [],
                notes: name['notes'] || error8['notes'],
              }
            : error8;
        });
      return {
        shots: shots3,
        sourceCharacters: sourceCharacters,
        analysis: {
          status: 'succeeded',
          modelId: modelId['modelId'],
          stats: { ...(modelId['stats'] || {}), reviewCount: 0x0 },
          error: '',
        },
      };
    } catch (error9) {
      const shots4 = shots2['map']((people3) => ({
          ...people3,
          people: people3['people']['map']((args9) => ({
            ...args9,
            identityReviewStatus: 'confirmed',
            identityReviewRequired: ![],
            identityMethod: 'fallback',
          })),
        })),
        error10 = error9?.['message'] || '跨镜头人物身份分析失败';
      return (
        showToast(error10 + '；已保留逐镜头人物，可按需拆分纠正。', 'warn'),
        {
          shots: shots4,
          sourceCharacters: buildPersonReplacementSourceCharacters(
            shots4,
            initialProject['sourceCharacters'],
          ),
          analysis: {
            status: 'failed',
            modelId: '',
            stats: {
              identityCount: shots4['reduce'](
                (value69, value70) => value69 + value70['people']['length'],
                0x0,
              ),
              reviewCount: 0x0,
            },
            error: error10,
          },
        }
      );
    }
  }
  async function run4(source2, value71, signal, value72) {
    const runSmartClip2 = await runSmartClip({
      source: source2['videoRef'],
      options: {
        mode: initialProject['settings']['smartClipMode'],
        fps: initialProject['settings']['smartClipFps'],
        unlimitedSegments: !![],
        ...(value71 === 'skip' ? { preserveWholeVideo: !![] } : {}),
      },
      signal: signal,
      onProgress: (processingStatus) => {
        const value73 = Number(processingStatus?.['progress']),
          value74 = Number(processingStatus?.['pct']),
          value75 = Number['isFinite'](value73)
            ? value73
            : Number['isFinite'](value74)
              ? value74 / 0x64
              : 0x0,
          value76 = processingStatus?.['phase'] === 'keyframes' ? 0x2d : 0x5,
          processingProgress = Math['min'](0x58, Math['round'](value76 + value75 * 0x28)),
          progress = Math['round'](
            ((value72 + processingProgress / 0x64) / initialProject['sources']['length']) * 0x5a,
          );
        setProject(
          {
            ...initialProject,
            sources: initialProject['sources']['map']((args10) =>
              args10['id'] === source2['id']
                ? {
                    ...args10,
                    processingStatus:
                      processingStatus?.['phase'] === 'keyframes' ? 'extracting-keyframes' : 'cutting',
                    processingProgress: processingProgress,
                  }
                : args10,
            ),
            workspace: {
              ...initialProject['workspace'],
              sourceAnalysis: { status: 'cutting', progress: progress },
            },
          },
          { persist: ![], renderWorkspace: ![] },
        );
      },
    });
    if (!runSmartClip2?.['shotBundles']?.['length'])
      throw new Error(resolveSmartClipFailureMessage(runSmartClip2));
    return runSmartClip2['shotBundles']['map']((startTimeSec, index2) => {
      const videoRef2 = normalizeText(startTimeSec['clipRef']);
      return {
        id: source2['id'] + '-' + (startTimeSec['id'] || 'shot-' + (index2 + 0x1)),
        sourceId: source2['id'],
        index: index2,
        startTimeSec: startTimeSec['start'],
        endTimeSec: startTimeSec['end'],
        durationSec: startTimeSec['duration'],
        sourceVideoRef: source2['videoRef'],
        videoRef: videoRef2,
        keyframeRef: startTimeSec['keyframeRef'],
        keyframeIndex: startTimeSec['keyframeIndex'],
        keyframeTimeSec: startTimeSec['keyframeTimeSec'],
        personDetection: startTimeSec['personDetection'],
        outputFps: startTimeSec['fps'] || 0x18,
        materializationStatus: videoRef2 ? 'succeeded' : 'pending',
        materializationProgress: videoRef2 ? 0x64 : 0x0,
        people: [],
        analysisStatus: startTimeSec['keyframeRef'] ? 'running' : 'failed',
        reviewRequired: !![],
        generationStatus: 'pending',
        error: (startTimeSec['errors'] || [])
          ['map']((error11) => error11?.['message'])
          ['filter'](Boolean)
          ['join']('；'),
      };
    });
  }
  async function run5({ mode: mode = 'cut' } = {}) {
    const list6 = initialProject['sources']['filter']((value77) => value77['videoRef']);
    if (!list6['length']) return (showToast('请先加入视频。', 'warn'), { ok: ![], reason: 'missing-source' });
    if (abortController) return { ok: ![], reason: 'already-running' };
    ((workspaceView = 'project'), (abortController = new AbortController()));
    const value78 = abortController['signal'];
    (setProject({
      ...initialProject,
      status: 'analyzing',
      settings: { ...initialProject['settings'], processingMode: mode },
      workspace: {
        ...initialProject['workspace'],
        view: 'project',
        step: 0x1,
        sourceAnalysis: { status: mode === 'skip' ? 'extracting-keyframes' : 'cutting', progress: 0x3 },
      },
      sources: initialProject['sources']['map']((args11) =>
        args11['videoRef']
          ? {
              ...args11,
              processingStatus: mode === 'skip' ? 'extracting-keyframes' : 'cutting',
              processingProgress: 0x3,
              error: '',
            }
          : args11,
      ),
    }),
      showToast(
        mode === 'skip'
          ? '已进入素材设定，正在后台扫描完整视频并检测人物关键帧。'
          : '已进入素材设定，正在后台分析镜头并检测人物关键帧。',
        'info',
      ));
    try {
      const selectedShotId = [];
      for (let value79 = 0x0; value79 < list6['length']; value79 += 0x1) {
        if (value78['aborted']) return { ok: ![], reason: 'cancelled' };
        const value80 = list6[value79],
          value81 = await run4(value80, mode, value78, value79);
        for (const value82 of value81) {
          const value83 = await run2(value82);
          selectedShotId['push'](value83);
        }
        setProject(
          {
            ...initialProject,
            shots: [...selectedShotId],
            sources: initialProject['sources']['map']((args12) =>
              args12['id'] === value80['id']
                ? { ...args12, processingStatus: 'ready', processingProgress: 0x64, error: '' }
                : args12,
            ),
            sourceCharacters: buildPersonReplacementSourceCharacters(
              selectedShotId,
              initialProject['sourceCharacters'],
            ),
            workspace: {
              ...initialProject['workspace'],
              selectedShotId: selectedShotId[0x0]?.['id'] || '',
              sourceAnalysis: {
                status: 'detecting',
                progress: Math['round'](((value79 + 0x1) / list6['length']) * 0x64),
              },
            },
          },
          { renderWorkspace: ![] },
        );
      }
      setProject(
        {
          ...initialProject,
          shots: selectedShotId,
          workspace: {
            ...initialProject['workspace'],
            sourceAnalysis: { status: 'identifying', progress: 0x5e },
            identityAnalysis: { status: 'running', modelId: '', stats: {}, error: '' },
          },
        },
        { persist: ![], renderWorkspace: ![] },
      );
      const sourceCharacters2 = await run3(selectedShotId),
        shots5 = sourceCharacters2['shots'];
      setProject(
        {
          ...initialProject,
          shots: shots5,
          sourceCharacters: sourceCharacters2['sourceCharacters'],
          workspace: {
            ...initialProject['workspace'],
            step: 0x1,
            selectedShotId: shots5[0x0]?.['id'] || '',
            sourceAnalysis: { status: 'identifying', progress: 0x60 },
            identityAnalysis: sourceCharacters2['analysis'],
          },
        },
        { persist: ![], renderWorkspace: ![] },
      );
      const response4 = await prepareVideoReplacementShots({ notify: ![], renderWorkspace: ![] });
      if (!response4['ok'])
        throw new Error(
          response4['failures']
            ?.['map']((error12) => error12['message'])
            ['filter'](Boolean)
            ['join']('；') || '镜头固定帧率处理失败',
        );
      (await handler11({ expectedProjectId: initialProject['id'], renderWorkspace: ![] }),
        setProject(
          {
            ...initialProject,
            status: 'character_mapping',
            workspace: {
              ...initialProject['workspace'],
              sourceAnalysis: { status: 'ready', progress: 0x64 },
              identityAnalysis: sourceCharacters2['analysis'],
            },
          },
          { renderWorkspace: ![] },
        ));
      const value84 = Number(sourceCharacters2['analysis']?.['stats']?.['identityCount']) || 0x0,
        error13 = getPersonReplacementDetectionFeedback(shots5, value84);
      return (showToast(error13['message'], error13['level']), { ok: !![], project: snapshot() });
    } catch (error14) {
      if (value78['aborted']) return { ok: ![], reason: 'cancelled' };
      const error15 = normalizeText(error14?.['message']) || '视频处理失败';
      (setProject(
        {
          ...initialProject,
          workspace: { ...initialProject['workspace'], sourceAnalysis: { status: 'failed', progress: 0x64 } },
          sources: initialProject['sources']['map']((args13) =>
            args13['videoRef'] && args13['processingStatus'] !== 'ready'
              ? { ...args13, processingStatus: 'failed', processingProgress: 0x64, error: error15 }
              : args13,
          ),
        },
        { renderWorkspace: ![] },
      ),
        showToast(error15, 'error'));
      throw error14;
    } finally {
      if (abortController?.['signal'] === value78) abortController = null;
    }
  }
  async function detectShotCutRanges({
    mode: mode = initialProject['settings']['smartClipMode'],
    fps: fps = initialProject['settings']['smartClipFps'],
  } = {}) {
    const value85 = 'shot-cut-detection';
    if (map2['has'](value85)) throw new Error('智能检测正在运行，请稍候');
    const list7 = initialProject['sources']['filter'](
      (value86) =>
        normalizeText(value86?.['videoRef']) &&
        initialProject['shots']['some'](
          (value87) => normalizeText(value87?.['sourceId']) === normalizeText(value86?.['id']),
        ),
    );
    if (!list7['length']) throw new Error('当前时间轴缺少可重新检测的原视频');
    const shots6 = cloneJson(initialProject['shots']);
    map2['add'](value85);
    try {
      const ranges2 = [];
      for (const source3 of list7) {
        const shotBundles = await runSmartClip({
          source: source3['videoRef'],
          options: { mode: mode, fps: fps, unlimitedSegments: !![] },
        });
        if (!shotBundles?.['shotBundles']?.['length'])
          throw new Error('视频「' + (source3['fileName'] || source3['id']) + '」未检测到可用片段');
        ranges2['push'](
          ...buildPersonReplacementDetectedShotCutRanges({
            source: source3,
            shots: shots6,
            shotBundles: shotBundles['shotBundles'],
            fps: fps,
          }),
        );
      }
      return { ranges: ranges2 };
    } finally {
      map2['delete'](value85);
    }
  }
  function run6({ shotId: shotId3, bbox: bbox2 } = {}, { renderWorkspace: renderWorkspace = !![] } = {}) {
    const text10 = normalizeText(shotId3),
      args14 = initialProject['shots']['find']((value88) => value88['id'] === text10),
      {
        x: x,
        y: y,
        width: width,
        height: height,
      } = normalizePersonReplacementBoundingBox(bbox2 && typeof bbox2 === 'object' ? bbox2 : {});
    if (!args14 || width <= 0x0 || height <= 0x0) return null;
    const id2 = createId(text10 + '-manual-person'),
      sourceCharacterId2 = createId('source-character-manual'),
      promptMarkerIndex =
        Math['max'](-0x1, ...args14['people']['map']((value89) => value89['promptMarkerIndex'])) + 0x1,
      value90 = {
        id: id2,
        sourceCharacterId: sourceCharacterId2,
        targetCharacterId: '',
        targetAppearanceId: '',
        promptMarkerIndex: promptMarkerIndex,
        label: formatPersonReplacementPersonLabel(promptMarkerIndex),
        detectionClass: 'character',
        detectionMethod: 'manual',
        bbox: { x: x, y: y, width: width, height: height },
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
      shots7 = initialProject['shots']['map']((args15) =>
        args15['id'] === text10
          ? {
              ...args15,
              people: orderAndRelabelPersonReplacementPeople([...args15['people'], value90]),
              reviewRequired: !![],
            }
          : args15,
      ),
      project = setProject(
        {
          ...initialProject,
          shots: shots7,
          sourceCharacters: buildPersonReplacementSourceCharacters(
            shots7,
            initialProject['sourceCharacters'],
          ),
        },
        { renderWorkspace: renderWorkspace },
      );
    return (showToast('已添加可替换主体，请将目标形象拖入框内。', 'success'), { project: project });
  }
  function run7(
    { shotId: shotId4, updates: updates = [] } = {},
    { renderWorkspace: renderWorkspace = !![] } = {},
  ) {
    const text11 = normalizeText(shotId4),
      enabled8 = initialProject['shots']['find']((value91) => value91['id'] === text11);
    if (!enabled8) return null;
    const map7 = new Map(enabled8['people']['map']((value92) => [value92['id'], value92])),
      map8 = new Map();
    (Array['isArray'](updates) ? updates : [])['forEach']((value93) => {
      const text12 = normalizeText(value93?.['personId']);
      if (!map7['has'](text12)) return;
      const value94 = {},
        box = normalizePersonReplacementBoundingBox(
          value93?.['bbox'] && typeof value93['bbox'] === 'object' ? value93['bbox'] : {},
        );
      (box['width'] > 0x0 && box['height'] > 0x0 && (value94['bbox'] = box),
        Object['hasOwn'](value93 || {}, 'replacementScope') &&
          (value94['replacementScope'] = normalizePersonReplacementScope(value93['replacementScope'])),
        Object['keys'](value94)['length'] && map8['set'](text12, value94));
    });
    if (!map8['size']) return null;
    const shots8 = initialProject['shots']['map']((args16) =>
        args16['id'] === text11
          ? {
              ...args16,
              people: orderAndRelabelPersonReplacementPeople(
                args16['people']['map']((args17) => {
                  const replacementScope = map8['get'](args17['id']);
                  if (!replacementScope) return args17;
                  return {
                    ...args17,
                    ...(replacementScope['replacementScope']
                      ? { replacementScope: replacementScope['replacementScope'] }
                      : {}),
                    ...(replacementScope['bbox']
                      ? {
                          bbox: replacementScope['bbox'],
                          locator: { ...args17['locator'], bbox: replacementScope['bbox'] },
                        }
                      : {}),
                  };
                }),
              ),
            }
          : args16,
      ),
      project2 = setProject(
        {
          ...initialProject,
          shots: shots8,
          sourceCharacters: buildPersonReplacementSourceCharacters(
            shots8,
            initialProject['sourceCharacters'],
          ),
        },
        { renderWorkspace: renderWorkspace },
      );
    return { project: project2 };
  }
  function run8(
    { shotId: shotId5, personIds: personIds = [] } = {},
    { renderWorkspace: renderWorkspace = !![] } = {},
  ) {
    const text13 = normalizeText(shotId5),
      value95 = initialProject['shots']['find']((value96) => value96['id'] === text13),
      map9 = new Set((Array['isArray'](personIds) ? personIds : [])['map'](normalizeText)['filter'](Boolean)),
      list8 = value95?.['people']['filter']((value97) => map9['has'](value97['id'])) || [];
    if (!list8['length']) return null;
    const map10 = new Set(list8['map']((value98) => value98['id'])),
      map11 = new Set(
        list8['map']((value99) => normalizeText(value99['sourceCharacterId']))['filter'](Boolean),
      ),
      shots9 = initialProject['shots']['map']((args18) =>
        args18['id'] === text13
          ? {
              ...args18,
              people: orderAndRelabelPersonReplacementPeople(
                args18['people']['filter']((value100) => !map10['has'](value100['id'])),
              ),
            }
          : args18,
      ),
      map12 = new Set();
    shots9['forEach']((value101) =>
      value101['people']['forEach']((value102) => {
        const text14 = normalizeText(value102['sourceCharacterId']);
        if (text14) map12['add'](text14);
      }),
    );
    const value103 = initialProject['sourceCharacters']['map']((args19) =>
        map10['has'](normalizeText(args19['exemplarPersonId']))
          ? { ...args19, exemplarShotId: '', exemplarPersonId: '' }
          : args19,
      ),
      project3 = setProject(
        {
          ...initialProject,
          shots: shots9,
          mappings: initialProject['mappings']['filter']((value104) => {
            const text15 = normalizeText(value104['sourceCharacterId']);
            return !map11['has'](text15) || map12['has'](text15);
          }),
          sourceCharacters: buildPersonReplacementSourceCharacters(shots9, value103),
        },
        { renderWorkspace: renderWorkspace },
      );
    return (
      showToast(
        list8['length'] > 0x1 ? '已删除 ' + list8['length'] + ' 个人物框。' : '已删除该人物框。',
        'success',
      ),
      { project: project3 }
    );
  }
  async function updateShotCutRanges({
    ranges: ranges = [],
    replaceTimeline: replaceTimeline = ![],
    selectedShotId: selectedShotId2 = '',
    renderWorkspace: renderWorkspace = !![],
    notify: notify = !![],
    revision: revision = 0x0,
  } = {}) {
    const value105 = coordinator['acceptRevision'](revision),
      value106 = 'shot-cut-timeline:' + value105,
      text16 = normalizeText(initialProject['id']),
      list9 = normalizePersonReplacementShotCutRanges(initialProject['shots'], ranges, {
        allowTimelineReplacement: replaceTimeline === !![],
      }),
      map13 = new Map(
        initialProject['shots']['map']((value107) => [normalizeText(value107['id']), value107]),
      ),
      map14 = new Set(
        list9['filter'](
          (value108) =>
            normalizeText(value108['originShotId']) && !map13['has'](normalizeText(value108['shotId'])),
        )['map']((value109) => normalizeText(value109['originShotId'])),
      ),
      value110 =
        list9['length'] !== initialProject['shots']['length'] ||
        list9['some']((value111) => !map13['has'](normalizeText(value111['shotId']))),
      list10 = list9['filter']((value112) => {
        const enabled9 = map13['get'](value112['shotId']) || map13['get'](value112['originShotId']),
          text17 = normalizeText(value112['keyframeRef']),
          value113 = Boolean(
            text17 &&
            (text17 !== normalizeText(enabled9?.['keyframeRef']) ||
              Math['abs'](Number(value112['keyframeTimeSec']) - Number(enabled9?.['keyframeTimeSec'])) >
                PERSON_REPLACEMENT_CUT_EPSILON_SEC),
          ),
          value114 = Boolean(
            text17 &&
            Boolean(value112['keyframeManuallySelected']) !== Boolean(enabled9?.['keyframeManuallySelected']),
          );
        return (
          !enabled9 ||
          !map13['has'](value112['shotId']) ||
          Math['abs'](value112['startSec'] - Number(enabled9['startTimeSec'])) >
            PERSON_REPLACEMENT_CUT_EPSILON_SEC ||
          Math['abs'](value112['endSec'] - Number(enabled9['endTimeSec'])) >
            PERSON_REPLACEMENT_CUT_EPSILON_SEC ||
          Boolean(value112['isReversed']) !== Boolean(enabled9['isReversed']) ||
          Boolean(value112['isReversed']) !== Boolean(enabled9['materializedIsReversed']) ||
          value113 ||
          value114
        );
      }),
      changedShotCount = new Set(list10['map']((value115) => value115['shotId']));
    if (!list10['length'])
      return (showToast('镜头切口没有变化。', 'info'), { project: snapshot(), changedShotCount: 0x0 });
    const map15 = new Map();
    (initialProject['shots']['forEach']((value116) =>
      value116['people']['forEach']((value117) => {
        const text18 = normalizeText(value117['sourceCharacterId']);
        if (!text18) return;
        const targetCharacterId = normalizeText(value117['targetCharacterId']),
          targetAppearanceId = normalizeText(value117['targetAppearanceId']);
        (targetCharacterId || targetAppearanceId) &&
          map15['set'](text18, {
            targetCharacterId: targetCharacterId,
            targetAppearanceId: targetAppearanceId,
          });
      }),
    ),
      map2['add'](value106));
    notify && showToast('正在更新 ' + changedShotCount['size'] + ' 个相邻片段。', 'info');
    try {
      const shots10 = [];
      let value118 = ![];
      for (let index3 = 0x0; index3 < list9['length']; index3 += 0x1) {
        const range = list9[index3],
          currentShot = map13['get'](range['shotId']) || map13['get'](range['originShotId']),
          isNewShot = !map13['has'](range['shotId']),
          value119 = map14['has'](normalizeText(range['originShotId'] || range['shotId']));
        if (!currentShot) throw new Error('片段 ' + (range['shotId'] || index3 + 0x1) + ' 缺少原始片段');
        if (!changedShotCount['has'](range['shotId'])) {
          shots10['push']({ ...currentShot, index: index3 });
          continue;
        }
        const value120 = initialProject['sources']['find'](
            (value121) => value121['id'] === currentShot['sourceId'],
          ),
          sourceVideoRef = normalizeText(currentShot['sourceVideoRef'] || value120?.['videoRef']);
        if (!sourceVideoRef)
          throw new Error('片段 ' + (currentShot['title'] || index3 + 0x1) + ' 缺少原始视频');
        const outputFps = [0x10, 0x18, 0x1e]['includes'](Math['round'](Number(currentShot['outputFps'])))
            ? Math['round'](Number(currentShot['outputFps']))
            : 0x18,
          {
            videoRef: videoRef3,
            reverseChanged: reverseChanged,
            videoRefIsCropped: videoRefIsCropped,
          } = await materializePersonReplacementShotPlayback({
            currentShot: currentShot,
            range: range,
            isNewShot: isNewShot,
            sourceVideoRef: sourceVideoRef,
            outputFps: outputFps,
            epsilonSec: PERSON_REPLACEMENT_CUT_EPSILON_SEC,
            enqueueMediaTask: enqueueMediaTask,
            resolveMediaRef: resolveMediaRef,
          }),
          text19 = normalizeText(range['keyframeRef']),
          keyframeTimeSec = Boolean(text19),
          value122 = Number(currentShot['keyframeTimeSec']),
          value123 = Boolean(
            !reverseChanged &&
            normalizeText(currentShot['keyframeRef']) &&
            (!Number['isFinite'](value122) ||
              (value122 >= range['startSec'] - PERSON_REPLACEMENT_CUT_EPSILON_SEC &&
                value122 < range['endSec'] + PERSON_REPLACEMENT_CUT_EPSILON_SEC)),
          );
        let keyframeRef = keyframeTimeSec
          ? text19
          : value123
            ? normalizeText(currentShot['keyframeRef'])
            : '';
        if (!keyframeRef) {
          const fetchFirstFrame2 = await fetchFirstFrame(videoRef3, {
            assetId: initialProject['id'],
            nodeId: range['shotId'] || currentShot['id'],
          });
          keyframeRef = resolveMediaRef(fetchFirstFrame2);
        }
        if (!keyframeRef) throw new Error('镜头切口更新后首帧提取失败');
        const enabled10 =
            keyframeTimeSec &&
            (text19 !== normalizeText(currentShot['keyframeRef']) ||
              Math['abs'](Number(range['keyframeTimeSec']) - Number(currentShot['keyframeTimeSec'])) >
                PERSON_REPLACEMENT_CUT_EPSILON_SEC),
          args20 = {
            ...currentShot,
            id: range['shotId'],
            title:
              isNewShot && currentShot['title']
                ? currentShot['title'] + ' · ' + (index3 + 0x1)
                : currentShot['title'],
            index: index3,
            startTimeSec: range['startSec'],
            endTimeSec: range['endSec'],
            durationSec: range['endSec'] - range['startSec'],
            sourceVideoRef: sourceVideoRef,
            videoRef: videoRef3,
            videoRefIsCropped: videoRefIsCropped,
            isReversed: range['isReversed'] === !![],
            materializedIsReversed: range['isReversed'] === !![],
            keyframeRef: keyframeRef,
            keyframeIndex: !enabled10 && value123 ? currentShot['keyframeIndex'] : 0x0,
            keyframeTimeSec: keyframeTimeSec
              ? range['keyframeTimeSec']
              : value123
                ? currentShot['keyframeTimeSec']
                : range['isReversed'] === !![]
                  ? range['endSec']
                  : range['startSec'],
            keyframeManuallySelected: keyframeTimeSec
              ? range['keyframeManuallySelected'] === !![]
              : value123
                ? currentShot['keyframeManuallySelected'] === !![]
                : ![],
            frame: keyframeTimeSec && range['frame'] ? { ...range['frame'] } : currentShot['frame'],
            outputFps: outputFps,
            materializationStatus: 'succeeded',
            materializationProgress: 0x64,
            replacementImage: { results: [], activeIndex: 0x0 },
            replacementImageRef: '',
            ...(value119
              ? {
                  replacementVideo: { results: [], activeIndex: 0x0 },
                  resultVideoRef: '',
                  generationStatus: 'pending',
                }
              : {}),
            error: '',
          };
        !enabled10 && value123
          ? shots10['push']({
              ...args20,
              people: currentShot['people']['map']((args21) => ({ ...args21 })),
              analysisStatus: currentShot['analysisStatus'],
              reviewRequired: currentShot['reviewRequired'],
            })
          : ((value118 = !![]),
            shots10['push'](
              await run2({ ...args20, people: [], analysisStatus: 'running', reviewRequired: !![] }),
            ));
      }
      const identityAnalysis = value118
          ? await run3(shots10)
          : {
              shots: shots10,
              sourceCharacters: initialProject['sourceCharacters'],
              analysis: initialProject['workspace']['identityAnalysis'],
            },
        shots11 = identityAnalysis['shots']['map']((people4) => ({
          ...people4,
          people: people4['people']['map']((args22) => {
            const targetCharacterId2 = map15['get'](normalizeText(args22['sourceCharacterId']));
            return targetCharacterId2
              ? {
                  ...args22,
                  targetCharacterId: targetCharacterId2['targetCharacterId'],
                  targetAppearanceId: targetCharacterId2['targetAppearanceId'],
                }
              : args22;
          }),
        })),
        text20 = normalizeText(selectedShotId2),
        selectedShotId3 = shots11['some']((value124) => normalizeText(value124['id']) === text20)
          ? text20
          : shots11['some'](
                (value125) =>
                  normalizeText(value125['id']) ===
                  normalizeText(initialProject['workspace']['selectedShotId']),
              )
            ? initialProject['workspace']['selectedShotId']
            : shots11[0x0]?.['id'] || '';
      if (enabled || !coordinator['isCurrent'](value105) || normalizeText(initialProject['id']) !== text16)
        return { project: snapshot(), changedShotCount: 0x0, stale: !![] };
      const value126 = {
          ...initialProject,
          shots: shots11,
          sourceCharacters: buildPersonReplacementSourceCharacters(
            shots11,
            identityAnalysis['sourceCharacters'],
          ),
          workspace: {
            ...initialProject['workspace'],
            selectedShotId: selectedShotId3,
            identityAnalysis: identityAnalysis['analysis'],
            imageGeneration: { status: 'idle', shotId: '', error: '' },
            imageGenerationsByShotId: {},
            videoGeneration: { status: 'idle', shotId: '', error: '' },
            videoGenerationsByShotId: {},
            videoPreparation: { status: 'idle', progress: 0x0, error: '' },
          },
        },
        project4 = setProject(
          value110
            ? transitionPersonReplacementOutput(value126, {
                type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['INVALIDATE'],
              })
            : value126,
          { renderWorkspace: renderWorkspace },
        );
      return (
        notify && showToast('已更新 ' + changedShotCount['size'] + '\x20个片段的切口。', 'success'),
        { project: project4, changedShotCount: changedShotCount['size'] }
      );
    } finally {
      map2['delete'](value106);
    }
  }
  const updateShotReverse = createPersonReplacementShotReverseOperation({
    coordinator: coordinator,
    getProject: () => initialProject,
    setProject: setProject,
    snapshot: snapshot,
    showToast: showToast,
    updateShotCutRanges: updateShotCutRanges,
    enqueueMediaTask: enqueueMediaTask,
    resolveMediaRef: resolveMediaRef,
    isDestroyed: () => enabled,
  });
  function run9({ sourceCharacterIds: sourceCharacterIds = [] } = {}) {
    try {
      const args23 = mergePersonReplacementSourceCharacters(initialProject, {
          sourceCharacterIds: sourceCharacterIds,
        }),
        project5 = setProject({
          ...args23,
          sourceCharacters: buildPersonReplacementSourceCharacters(
            args23['shots'],
            args23['sourceCharacters'],
          ),
          workspace: { ...args23['workspace'], selectedIdentityIds: [] },
        });
      return (showToast('所选人物身份已合并。', 'success'), { project: project5 });
    } catch (error16) {
      return (showToast(error16?.['message'] || '人物身份合并失败', 'warn'), null);
    }
  }
  function run10({ sourceCharacterId: sourceCharacterId3, shotId: shotId6, personId: personId2 } = {}) {
    try {
      const args24 = splitPersonReplacementSourceCharacter(initialProject, {
          sourceCharacterId: sourceCharacterId3,
          occurrences: [{ shotId: shotId6, personId: personId2 }],
          newSourceCharacterId: createId('source-character-manual'),
        }),
        project6 = setProject({
          ...args24,
          sourceCharacters: buildPersonReplacementSourceCharacters(
            args24['shots'],
            args24['sourceCharacters'],
          ),
          workspace: { ...args24['workspace'], selectedIdentityIds: [] },
        });
      return (showToast('当前人物框已拆分为独立人物。', 'success'), { project: project6 });
    } catch (error17) {
      return (showToast(error17?.['message'] || '人物身份拆分失败', 'warn'), null);
    }
  }
  function run11({
    sourceCharacterId: sourceCharacterId4,
    targetSourceCharacterId: targetSourceCharacterId,
    shotId: shotId7,
    personId: personId3,
    label: label2,
    orientation: orientation,
    silent: silent = ![],
  } = {}) {
    try {
      const label3 = normalizeText(label2),
        orientation2 = normalizePersonReplacementOrientation(orientation);
      if (!label3) throw new Error('请输入人物名称');
      const args25 = confirmPersonReplacementSourceCharacter(initialProject, {
          sourceCharacterId: sourceCharacterId4,
          targetSourceCharacterId: targetSourceCharacterId,
          shotId: shotId7,
          personId: personId3,
          label: label3,
          orientation: orientation2 === 'unknown' ? '' : orientation2,
        }),
        project7 = setProject(
          {
            ...args25,
            sourceCharacters: buildPersonReplacementSourceCharacters(
              args25['shots'],
              args25['sourceCharacters'],
            ),
          },
          { sync: ![] },
        );
      if (!silent) showToast('人物身份已确认。', 'success');
      return { project: project7 };
    } catch (error18) {
      return (showToast(error18?.['message'] || '人物身份确认失败', 'warn'), null);
    }
  }
  function run12({ characterId: characterId } = {}) {
    const text21 = normalizeText(characterId);
    if (!text21 || !initialProject['characters']['some']((value127) => value127['id'] === text21))
      return null;
    const characters = initialProject['characters']['filter']((value128) => value128['id'] !== text21),
      assetAppearanceIndexes = Object['fromEntries'](
        Object['entries'](initialProject['workspace']['assetAppearanceIndexes'] || {})['filter'](
          ([value129]) => value129 !== text21,
        ),
      ),
      project8 = setProject({
        ...initialProject,
        characters: characters,
        mappings: initialProject['mappings']['filter'](
          (value130) => value130['targetCharacterId'] !== text21,
        ),
        shots: initialProject['shots']['map']((people5) => ({
          ...people5,
          people: people5['people']['map']((args26) =>
            args26['targetCharacterId'] === text21
              ? { ...args26, targetCharacterId: '', targetAppearanceId: '' }
              : args26,
          ),
        })),
        workspace: {
          ...initialProject['workspace'],
          selectedCharacterId:
            initialProject['workspace']['selectedCharacterId'] === text21
              ? characters[0x0]?.['id'] || ''
              : initialProject['workspace']['selectedCharacterId'],
          selectedAssetIds: initialProject['workspace']['selectedAssetIds']['filter'](
            (value131) => value131 !== text21,
          ),
          assetAppearanceIndexes: assetAppearanceIndexes,
        },
      });
    return (showToast('人物卡片已删除。', 'success'), { project: project8 });
  }
  function run13({ sceneId: sceneId } = {}) {
    const text22 = normalizeText(sceneId);
    if (!text22 || !initialProject['scenes']['some']((value132) => value132['id'] === text22)) return null;
    const scenes = initialProject['scenes']['filter']((value133) => value133['id'] !== text22),
      assetAppearanceIndexes2 = Object['fromEntries'](
        Object['entries'](initialProject['workspace']['assetAppearanceIndexes'] || {})['filter'](
          ([value134]) => value134 !== text22,
        ),
      ),
      project9 = setProject({
        ...initialProject,
        scenes: scenes,
        shots: initialProject['shots']['map']((args27) =>
          normalizeText(args27['sceneReference']?.['sceneId']) === text22
            ? { ...args27, sceneReference: { sceneId: '', appearanceId: '' } }
            : args27,
        ),
        workspace: {
          ...initialProject['workspace'],
          selectedSceneId:
            initialProject['workspace']['selectedSceneId'] === text22
              ? scenes[0x0]?.['id'] || ''
              : initialProject['workspace']['selectedSceneId'],
          selectedAssetIds: initialProject['workspace']['selectedAssetIds']['filter'](
            (value135) => value135 !== text22,
          ),
          assetAppearanceIndexes: assetAppearanceIndexes2,
        },
      });
    return (showToast('场景卡片已删除。', 'success'), { project: project9 });
  }
  function run14({ audioAssetId: audioAssetId } = {}) {
    const text23 = normalizeText(audioAssetId),
      enabled11 = initialProject['audioAssets']['find']((value136) => value136['id'] === text23);
    if (!enabled11) return null;
    const audioAssets = initialProject['audioAssets']['filter']((value137) => value137['id'] !== text23),
      project10 = setProject({
        ...initialProject,
        audioAssets: audioAssets,
        workspace: {
          ...initialProject['workspace'],
          selectedAudioAssetId:
            initialProject['workspace']['selectedAudioAssetId'] === text23
              ? audioAssets[0x0]?.['id'] || ''
              : initialProject['workspace']['selectedAudioAssetId'],
        },
      });
    return (showToast('项目音频已移除。', 'success'), { project: project10 });
  }
  async function run15(list11 = [], kind2 = 'character') {
    const list12 = (Array['isArray'](list11) ? list11 : [list11])['filter'](Boolean);
    if (!list12['length'] || typeof uploadFile !== 'function') return null;
    const text24 = normalizeText(initialProject['id']),
      list13 = [];
    for (const file of list12) {
      const value138 = await uploadFile(file, initialProject['id']),
        imageRef = resolveMediaRef(value138);
      if (!imageRef) throw new Error('素材图片保存结果缺少可用地址');
      if (normalizeText(initialProject['id']) !== text24) return null;
      list13['push']({ file: file, imageRef: imageRef });
    }
    const name2 = kind2 === 'scene',
      value139 = name2 ? 'scenes' : 'characters',
      list14 = Array['isArray'](initialProject[value139]) ? initialProject[value139] : [],
      map16 = new Set(list14['map']((value140) => value140['id'])),
      args28 = list13['map'](({ file: file2, imageRef: imageRef2 }, value141) => {
        const value142 = list14['length'] + value141 + 0x1;
        let value143 = value142;
        const value144 = name2 ? 'target-scene' : 'target';
        while (map16['has'](value144 + '-' + value143)) value143 += 0x1;
        const id3 = value144 + '-' + value143,
          id4 = id3 + '-appearance-1';
        map16['add'](id3);
        const role = name2 ? '场景' : '人物',
          value145 = name2 ? '目标场景 ' + value142 : '目标人物 ' + value142,
          value146 = {
            id: id3,
            kind: kind2,
            role: role,
            name: createUploadedAssetName(file2['name'], value145),
            appearances: [
              {
                id: id4,
                name: name2 ? '场景图' : '基础形象',
                imageUrl: imageRef2,
                prompt: '',
                occurrences: '当前项目',
              },
            ],
            baseAppearanceId: id4,
            description: '',
          };
        if (!name2) value146['voiceReference'] = null;
        return value146;
      }),
      selectedSceneId = args28['at'](-0x1);
    return {
      project: setProject({
        ...initialProject,
        [value139]: [...list14, ...args28],
        workspace: {
          ...initialProject['workspace'],
          ...(name2
            ? { selectedSceneId: selectedSceneId?.['id'] || initialProject['workspace']['selectedSceneId'] }
            : {
                selectedCharacterId:
                  selectedSceneId?.['id'] || initialProject['workspace']['selectedCharacterId'],
              }),
        },
      }),
    };
  }
  function run16(list15 = []) {
    return run15(list15, 'character');
  }
  function run17(list16 = []) {
    return run15(list16, 'scene');
  }
  async function run18(list17 = []) {
    const list18 = (Array['isArray'](list17) ? list17 : [list17])['filter'](Boolean);
    if (!list18['length'] || typeof uploadFile !== 'function') return null;
    if (typeof saveAssetPackageItem !== 'function') throw new Error('总素材服务尚未初始化。');
    const sourceProjectId = normalizeText(initialProject['id']),
      assetRefs2 = [],
      sourceAssets2 = [];
    for (const error19 of list18) {
      const value147 = await uploadFile(error19, sourceProjectId),
        audioUrl = resolveMediaRef(value147);
      if (!audioUrl) throw new Error('音频保存结果缺少可用地址');
      if (normalizeText(initialProject['id']) !== sourceProjectId) return null;
      const itemKey = createId('person-replacement-audio'),
        itemName = createUploadedAssetName(error19['name'], '未命名音频'),
        saveAssetPackageItem2 = await saveAssetPackageItem({
          packageKey: 'person-replacement-audio:' + sourceProjectId,
          packageName: (normalizeText(initialProject['title']) || '未命名人物替换项目') + '\x20·\x20音频素材',
          category: '替换工作室',
          itemKey: itemKey,
          itemName: itemName,
          audio: { ...(value147 && typeof value147 === 'object' ? value147 : {}), audioUrl: audioUrl },
          metadata: { sourceKind: 'person-replacement-workspace', sourceProjectId: sourceProjectId },
          itemMetadata: {
            sourceKind: 'person-replacement-workspace',
            sourceProjectId: sourceProjectId,
            sourceAudioId: itemKey,
          },
        });
      if (normalizeText(initialProject['id']) !== sourceProjectId) return null;
      const assetId2 = normalizeText(saveAssetPackageItem2?.['assetId']),
        itemIndex = Math['max'](0x0, Math['trunc'](Number(saveAssetPackageItem2?.['itemIndex']) || 0x0));
      assetId2 &&
        (assetRefs2['push']({ assetId: assetId2, itemIndex: itemIndex }),
        sourceAssets2['push']({
          assetId: assetId2,
          itemIndex: itemIndex,
          type: 'audio',
          assetName: (normalizeText(initialProject['title']) || '未命名人物替换项目') + '\x20·\x20音频素材',
          name: itemName,
          savedName: itemName,
          url: audioUrl,
          durationSec: Math['max'](0x0, Number(value147?.['durationSec']) || 0x0),
          waveformLocalPath: normalizeText(value147?.['waveformLocalPath']),
          waveformUrl: normalizeText(value147?.['waveformUrl']),
        }));
    }
    const args29 = addLibraryAssetsToProject({
        assetRefs: assetRefs2,
        targetKind: 'audio',
        notify: ![],
        sourceAssets: sourceAssets2,
      }),
      project11 = setProject({
        ...initialProject,
        workspace: {
          ...initialProject['workspace'],
          characterAssetTab: 'audio',
          assetSelectionMode: ![],
          selectedAssetIds: [],
        },
      });
    return (
      showToast(
        list18['length'] > 0x1 ? '已上传 ' + list18['length'] + ' 个音频素材。' : '音频素材已上传。',
        'success',
      ),
      { ...args29, project: project11 }
    );
  }
  function addLibraryAssetsToProject({
    assetRefs: assetRefs = [],
    targetKind: targetKind = 'character',
    notify: notify = !![],
    sourceAssets: sourceAssets = null,
  } = {}) {
    const kind3 = ['character', 'scene', 'audio']['includes'](targetKind) ? targetKind : 'character',
      value148 = kind3 === 'scene' ? 'scenes' : kind3 === 'audio' ? 'audioAssets' : 'characters',
      list19 = Array['isArray'](initialProject[value148]) ? initialProject[value148] : [],
      role2 = kind3 === 'scene' ? '场景' : kind3 === 'audio' ? '音频' : '人物',
      map17 = new Set(
        (Array['isArray'](assetRefs) ? assetRefs : [])['map'](
          (value149) =>
            normalizeText(value149?.['assetId'] || value149?.['sourceAssetId']) +
            ':' +
            Math['max'](
              0x0,
              Math['trunc'](Number(value149?.['itemIndex'] ?? value149?.['sourceItemIndex']) || 0x0),
            ),
        ),
      ),
      map18 = new Map(
        list19['filter']((value150) => normalizeText(value150?.['sourceOrigin']) === 'library')['map'](
          (value151) => [
            normalizeText(value151['sourceAssetId']) +
              ':' +
              Math['max'](0x0, Math['trunc'](Number(value151['sourceItemIndex']) || 0x0)),
            value151,
          ],
        ),
      ),
      addedCount = [],
      existingCount = [],
      map19 = new Set(list19['map']((value152) => value152['id'])),
      list20 = Array['isArray'](sourceAssets) ? sourceAssets : libraryAssets();
    list20['forEach']((error20) => {
      const sourceAssetId = normalizeText(error20?.['assetId'] || error20?.['sourceAssetId']),
        sourceItemIndex = Math['max'](
          0x0,
          Math['trunc'](Number(error20?.['itemIndex'] ?? error20?.['sourceItemIndex']) || 0x0),
        ),
        value153 = sourceAssetId + ':' + sourceItemIndex;
      if (!map17['has'](value153)) return;
      const value154 = map18['get'](value153);
      if (value154) {
        existingCount['push'](value154['id']);
        return;
      }
      const text25 = normalizeText(error20?.['type'] || error20?.['mediaKind'])['toLowerCase'](),
        sourceUrl =
          kind3 === 'audio'
            ? normalizeText(error20?.['url'] || error20?.['sourceUrl'] || error20?.['audioUrl'])
            : normalizeText(error20?.['url'] || error20?.['sourceUrl'] || error20?.['imageUrl']),
        value155 = kind3 === 'audio' ? 'audio' : 'image';
      if (text25 !== value155 || !sourceUrl) return;
      let value156 = list19['length'] + addedCount['length'] + 0x1;
      const value157 = kind3 === 'scene' ? 'target-scene' : kind3 === 'audio' ? 'project-audio' : 'target';
      while (map19['has'](value157 + '-' + value156)) value156 += 0x1;
      const id5 = value157 + '-' + value156,
        name3 = createUploadedAssetName(error20['name'] || error20['assetName'], ''),
        name4 =
          kind3 === 'audio' ? createUploadedAssetName(getPersonReplacementAudioSavedName(error20), '') : '';
      map19['add'](id5);
      let value158;
      if (kind3 === 'audio')
        value158 = {
          id: id5,
          kind: 'audio',
          mediaKind: 'audio',
          role: '音频素材',
          name: name4 || '音频 ' + value156,
          savedName: name4 || '音频 ' + value156,
          assetName: normalizeText(error20['assetName']) || name3 || '音频 ' + value156,
          sourceOrigin: 'library',
          sourceAssetId: sourceAssetId,
          sourceItemIndex: sourceItemIndex,
          sourceUrl: sourceUrl,
          audioUrl: sourceUrl,
          waveformLocalPath: normalizeText(error20['waveformLocalPath']),
          waveformUrl: normalizeText(error20['waveformUrl']),
          durationSec: Math['max'](0x0, Number(error20['durationSec']) || 0x0),
          occurrences: '当前项目',
          description: '',
          isLibraryAsset: ![],
        };
      else {
        const id6 = id5 + '-appearance-1';
        value158 = {
          id: id5,
          kind: kind3,
          role: role2,
          name: name3 || '目标' + role2 + '\x20' + value156,
          sourceOrigin: 'library',
          sourceAssetId: sourceAssetId,
          sourceItemIndex: sourceItemIndex,
          appearances: [
            {
              id: id6,
              name: kind3 === 'scene' ? '场景图' : '基础形象',
              imageUrl: sourceUrl,
              prompt: '',
              occurrences: '总素材',
            },
          ],
          baseAppearanceId: id6,
          ...(kind3 === 'character' ? { voiceReference: null } : {}),
          description: '',
        };
      }
      (addedCount['push'](value158), map18['set'](value153, value158));
    });
    const selectedSceneId2 = [...existingCount, ...addedCount['map']((value159) => value159['id'])];
    if (!selectedSceneId2['length'])
      return (
        notify &&
          showToast(
            kind3 === 'audio'
              ? '请选择总素材中的音频后再加入项目。'
              : '请选择总素材中的图片后再加入' + role2 + '。',
            'warn',
          ),
        { project: snapshot(), addedCount: 0x0, existingCount: 0x0 }
      );
    setProject(
      {
        ...initialProject,
        [value148]: [...list19, ...addedCount],
        workspace: {
          ...initialProject['workspace'],
          ...(kind3 === 'scene'
            ? { selectedSceneId: selectedSceneId2['at'](-0x1) }
            : kind3 === 'audio'
              ? { selectedAudioAssetId: selectedSceneId2['at'](-0x1), characterAssetTab: 'audio' }
              : { selectedCharacterId: selectedSceneId2['at'](-0x1) }),
          assetSelectionMode: ![],
          selectedAssetIds: [],
        },
      },
      { sync: ![] },
    );
    if (notify && addedCount['length'])
      showToast('已将 ' + addedCount['length'] + '\x20项总素材加入' + role2 + '。', 'success');
    else
      notify &&
        showToast(
          kind3 === 'audio' ? '所选音频已在当前项目中。' : '所选图片已在' + role2 + '素材中。',
          'info',
        );
    return { project: snapshot(), addedCount: addedCount['length'], existingCount: existingCount['length'] };
  }
  function run19(args30 = {}) {
    return addLibraryAssetsToProject({ ...args30, targetKind: 'character' });
  }
  async function run20(enabled12, value160 = {}) {
    if (!enabled12 || typeof uploadFile !== 'function') return null;
    const value161 = await uploadFile(enabled12, initialProject['id']),
      imageUrl = resolveMediaRef(value161);
    if (!imageUrl) throw new Error('人物形象保存结果缺少可用地址');
    const characters2 = initialProject['characters']['map']((appearances) =>
      appearances['id'] === value160['characterId']
        ? {
            ...appearances,
            appearances: appearances['appearances']['map']((args31) =>
              args31['id'] === value160['appearanceId']
                ? { ...args31, imageUrl: imageUrl, generationStatus: 'succeeded', error: '' }
                : args31,
            ),
          }
        : appearances,
    );
    return { project: setProject({ ...initialProject, characters: characters2 }) };
  }
  async function uploadReplacementImage(error21, value162 = {}) {
    if (!error21 || typeof uploadFile !== 'function') return null;
    const shotId8 = normalizeText(value162['shotId']),
      shot = initialProject['shots']['find']((value163) => value163['id'] === shotId8);
    if (!shot) throw new Error('当前片段不可用');
    const expectedProjectId2 = initialProject['id'],
      expectedShotRevision = createPersonReplacementImageGenerationMappingRevision({
        project: initialProject,
        shot: shot,
      }),
      value164 = await uploadFile(error21, expectedProjectId2),
      imageRef3 = resolveMediaRef(value164);
    if (!imageRef3) throw new Error('替换图片保存结果缺少可用地址');
    const project12 = personReplacementImageTaskRuntime['acceptUploadedResult']({
      shotId: shotId8,
      imageRef: imageRef3,
      fileName: normalizeText(error21['name']),
      createdAt: nowIso(),
      expectedProjectId: expectedProjectId2,
      expectedShotRevision: expectedShotRevision,
    });
    if (!project12) return null;
    return (showToast('替换图片已加入当前片段。', 'success'), { project: project12 });
  }
  async function uploadReplacementVideoResult(file3, context = {}) {
    return uploadPersonReplacementVideoResult({
      file: file3,
      context: context,
      project: initialProject,
      uploadFile: uploadFile,
      prepareUploadedVideoAsset: prepareUploadedVideoAsset,
      videoTaskRuntime: videoTaskRuntime,
      now: nowIso,
      showToast: showToast,
    });
  }
  function run21({ shotId: shotId = '', slotId: slotId = '', input: input = null } = {}) {
    const shotId9 = normalizeText(shotId),
      text26 = normalizeText(slotId),
      enabled13 = initialProject['shots']['find']((value165) => value165['id'] === shotId9);
    if (!enabled13 || !text26) return null;
    const replacementVideoInputsBySlot = { ...(enabled13['replacementVideoInputsBySlot'] || {}) };
    if (input) replacementVideoInputsBySlot[text26] = input;
    else delete replacementVideoInputsBySlot[text26];
    const value166 = {
      ...initialProject,
      shots: initialProject['shots']['map']((args32) =>
        args32['id'] === shotId9
          ? { ...args32, replacementVideoInputsBySlot: replacementVideoInputsBySlot, error: '' }
          : args32,
      ),
      workspace: {
        ...updatePersonReplacementVideoGenerationState(initialProject['workspace'], {
          status: 'idle',
          shotId: shotId9,
          error: '',
        }),
        selectedShotId: shotId9,
      },
    };
    return setProject(value166, { renderWorkspace: ![] });
  }
  async function run22(error22, value167 = {}) {
    if (!error22 || typeof uploadFile !== 'function') return null;
    try {
      const shotId10 = normalizeText(value167['shotId']),
        slotId2 = normalizeText(value167['slotId']),
        enabled14 = initialProject['shots']['find']((value168) => value168['id'] === shotId10);
      if (!enabled14) throw new Error('当前片段不可用');
      const modelId2 = resolvePersonReplacementVideoSlotState(initialProject, enabled14);
      if (normalizeText(value167['modelId']) && normalizeText(value167['modelId']) !== modelId2['modelId'])
        throw new Error('视频模型已经切换，请重新选择入参槽');
      if (modelId2['readOnlySlots']['includes'](slotId2))
        throw new Error('源视频和当前参考图由所选片段自动提供');
      const kind4 = normalizeText(modelId2['fixedInputConfig']?.['slotKindById']?.[slotId2]);
      if (!kind4) throw new Error('当前模型没有这个入参槽');
      const text27 = normalizeText(error22['type'])['toLowerCase'](),
        text28 = normalizeText(error22['name'])['toLowerCase'](),
        value169 =
          text27['startsWith']('image/') || /\.(?:avif|bmp|gif|jpe?g|png|webp)$/i['test'](text28)
            ? 'image'
            : text27['startsWith']('video/') || /\.(?:avi|m4v|mkv|mov|mp4|webm)$/i['test'](text28)
              ? 'video'
              : '';
      if (value169 !== kind4) throw new Error(kind4 === 'video' ? '请选择视频文件' : '请选择图片文件');
      const value170 = await uploadFile(error22, initialProject['id']),
        url = resolveMediaRef(value170);
      if (!url) throw new Error('视频模型入参保存结果缺少可用地址');
      const project13 = run21({
        shotId: shotId10,
        slotId: slotId2,
        input: {
          kind: kind4,
          url: url,
          modelId: modelId2['modelId'],
          fileName: normalizeText(error22['name']),
          mimeType: normalizeText(error22['type']),
          thumbUrl: resolveVideoThumbnailRef(value170),
        },
      });
      return (
        showToast(
          (modelId2['fixedInputConfig']?.['slotById']?.[slotId2]?.['label'] || '模型入参') + '已接入。',
          'success',
        ),
        project13 ? { project: project13 } : null
      );
    } catch (error23) {
      return (showToast(error23?.['message'] || '视频模型入参上传失败', 'error'), null);
    }
  }
  function run23(options3 = {}) {
    const shotId11 = normalizeText(options3['shotId']),
      slotId3 = normalizeText(options3['slotId']),
      enabled15 = initialProject['shots']['find']((value171) => value171['id'] === shotId11);
    if (!enabled15 || !enabled15['replacementVideoInputsBySlot']?.[slotId3]) return null;
    const project14 = run21({ shotId: shotId11, slotId: slotId3, input: null });
    return project14 ? { project: project14 } : null;
  }
  async function saveShotKeyframe(enabled16, frame2 = {}) {
    if (!enabled16 || typeof uploadFile !== 'function') return null;
    const value172 = await uploadFile(enabled16, initialProject['id']),
      keyframeRef2 = resolveMediaRef(value172);
    if (!keyframeRef2) throw new Error('关键帧保存结果缺少可用地址');
    return {
      keyframeRef: keyframeRef2,
      keyframeTimeSec: Number(frame2['keyframeTimeSec']) || 0x0,
      frame: frame2['frame'] && typeof frame2['frame'] === 'object' ? { ...frame2['frame'] } : {},
    };
  }
  async function run24(error24, value173 = {}) {
    if (!error24 || typeof uploadFile !== 'function') return null;
    const value174 = await uploadFile(error24, initialProject['id']),
      voiceRef = resolveMediaRef(value174);
    if (!voiceRef) throw new Error('声音保存结果缺少可用地址');
    const characters3 = initialProject['characters']['map']((args33) =>
      args33['id'] === value173['characterId']
        ? {
            ...args33,
            voiceRef: voiceRef,
            voiceReference: {
              audioUrl: resolveMediaUrl(voiceRef),
              localPath: normalizeLocalPath(voiceRef) || voiceRef,
              fileName: normalizeText(error24['name']) || '上传声音',
              source: 'upload',
              updatedAt: Date['now'](),
            },
          }
        : args33,
    );
    return { project: setProject({ ...initialProject, characters: characters3 }) };
  }
  const value175 = (request) =>
    bindPersonReplacementCharacterVoice({
      project: initialProject,
      request: request,
      showToast: showToast,
      addLibraryAssetsToProject: addLibraryAssetsToProject,
      normalizeLocalPath: normalizeLocalPath,
      resolveMediaUrl: resolveMediaUrl,
      setProject: setProject,
    });
  async function run25(modelId3 = {}) {
    const characterId2 = initialProject['characters']['find'](
      (value176) => value176['id'] === modelId3['characterId'],
    );
    if (!characterId2) return null;
    const prompt = normalizeText(modelId3['prompt'] || characterId2['description']),
      promptPresetId =
        normalizeText(modelId3['promptPresetId']) ||
        normalizeText(initialProject['workspace']['assetPromptPresetId']),
      prompt2 = applyPersonReplacementCharacterAssetPromptPreset(promptPresetId, prompt),
      personReplacementCharacterBaseImageRef = getPersonReplacementCharacterBaseImageRef(characterId2);
    if (!personReplacementCharacterBaseImageRef) return (showToast('请先上传人物基础形象。', 'warn'), null);
    if (!prompt2) return (showToast('请先填写新形象提示词。', 'warn'), null);
    const payload2 = buildCharacterAssetImageGenerationPayload({
      prompt: prompt2,
      modelId: modelId3['modelId'] || initialProject['settings']['characterImageModelId'],
      provider: modelId3['provider'] || initialProject['settings']['characterImageProvider'],
      providerProfileId:
        modelId3['providerProfileId'] || initialProject['settings']['characterImageProviderProfileId'],
      generationParams:
        modelId3['generationParams'] || initialProject['settings']['characterImageGenerationParams'],
      referenceImageUrls: [personReplacementCharacterBaseImageRef],
    });
    if (modelId3['preview'] === !![]) return { payload: payload2 };
    if (typeof generateCharacterImage !== 'function')
      return (showToast('图像生成服务尚未初始化。', 'error'), null);
    const value177 = initialProject['id'] + ':' + characterId2['id'];
    if (map['has'](value177)) return null;
    map['add'](value177);
    const value178 = characterId2['appearances']['length'] + 0x1,
      id7 = characterId2['id'] + '-appearance-' + value178 + '-' + Date['now'](),
      error25 = {
        id: id7,
        name: resolveGeneratedPersonReplacementAppearanceName(promptPresetId, value178),
        imageUrl: '',
        prompt: prompt,
        promptPresetId: promptPresetId,
        occurrences: '当前项目',
        generationStatus: 'running',
        error: '',
      };
    setProject({
      ...initialProject,
      characters: initialProject['characters']['map']((args34) =>
        args34['id'] === characterId2['id']
          ? { ...args34, appearances: [...args34['appearances'], error25] }
          : args34,
      ),
      workspace: {
        ...initialProject['workspace'],
        assetAppearanceIndexes: {
          ...initialProject['workspace']['assetAppearanceIndexes'],
          [characterId2['id']]: value178 - 0x1,
        },
        generatingAppearanceKeys: [
          ...initialProject['workspace']['generatingAppearanceKeys'],
          characterId2['id'] + ':' + id7,
        ],
      },
    });
    try {
      const value179 = await generateCharacterImage(payload2),
        imageUrl2 = getFirstSuccessfulImageRef(value179),
        characters4 = initialProject['characters']['map']((appearances2) =>
          appearances2['id'] === characterId2['id']
            ? {
                ...appearances2,
                appearances: appearances2['appearances']['map']((args35) =>
                  args35['id'] === id7
                    ? { ...args35, imageUrl: imageUrl2, generationStatus: 'succeeded', error: '' }
                    : args35,
                ),
              }
            : appearances2,
        ),
        project15 = setProject({
          ...initialProject,
          characters: characters4,
          workspace: {
            ...initialProject['workspace'],
            generatingAppearanceKeys: initialProject['workspace']['generatingAppearanceKeys']['filter'](
              (value180) => value180 !== characterId2['id'] + ':' + id7,
            ),
          },
        });
      return (
        modelId3['notifyCompletion'] === ![] && showToast('已新增' + error25['name'] + '。', 'success'),
        modelId3['notifyCompletion'] !== ![] && notifyCompletion({ kind: 'asset', mediaRef: imageUrl2 }),
        { project: project15, ok: !![], characterId: characterId2['id'] }
      );
    } catch (error26) {
      const error27 = error26?.['getUserMessage']?.() || error26?.['message'] || '人物形象生成失败',
        characters5 = initialProject['characters']['map']((appearances3) =>
          appearances3['id'] === characterId2['id']
            ? {
                ...appearances3,
                appearances: appearances3['appearances']['map']((args36) =>
                  args36['id'] === id7 ? { ...args36, generationStatus: 'failed', error: error27 } : args36,
                ),
              }
            : appearances3,
        ),
        project16 = setProject({
          ...initialProject,
          characters: characters5,
          workspace: {
            ...initialProject['workspace'],
            generatingAppearanceKeys: initialProject['workspace']['generatingAppearanceKeys']['filter'](
              (value181) => value181 !== characterId2['id'] + ':' + id7,
            ),
          },
        });
      return (
        showToast(error27, 'error'),
        { project: project16, ok: ![], characterId: characterId2['id'], error: error27 }
      );
    } finally {
      map['delete'](value177);
    }
  }
  const value182 = (options4 = {}) => personReplacementImageTaskRuntime['generate'](options4),
    value183 = (options5 = {}) => personReplacementImageTaskRuntime['cancel'](options5),
    runPreparation = createPersonReplacementVideoPreparationRunner({
      getProject: () => initialProject,
      getProjectById: getProjectById,
      setProject: setProject,
      setProjectById: setProjectById,
      isDestroyed: () => enabled,
      waitForActiveReverse: (value184) => coordinator['waitForActiveReverse'](value184),
      fetchVideoMeta: fetchVideoMeta,
      resolveDurationSec: resolveDurationSec,
      enqueueMediaTask: enqueueMediaTask,
      resolveMediaRef: resolveMediaRef,
      showToast: showToast,
    });
  videoTaskRuntime = createPersonReplacementVideoTaskRuntime({
    getProject: () => initialProject,
    getProjectById: getProjectById,
    setProject: setProject,
    setProjectById: setProjectById,
    runPreparation: runPreparation,
    generateReplacementVideo: generateReplacementVideo,
    resolveInstallId: resolveInstallId2,
    persistNow: persistNow,
    showToast: showToast,
    notifyGenerationCompleted: notifyCompletion,
    now: nowIso,
    createId: () => createId('replacement-video-request'),
  });
  function prepareVideoReplacementShots(options6 = {}) {
    return videoTaskRuntime['prepare'](options6);
  }
  function run26(options7 = {}) {
    return videoTaskRuntime['generate'](options7);
  }
  function run27(options8 = {}) {
    return videoTaskRuntime['cancel'](options8);
  }
  personReplacementVoiceSeparationRuntime = createPersonReplacementVoiceSeparationRuntime({
    getProject: () => initialProject,
    setProject: setProject,
    persistNow: persistNow,
    showToast: showToast,
    now: nowIso,
    createId: () => createId('replacement-voice-separation'),
    onStateChange: ({ sourceId: sourceId2, state: state2 }) => {
      workspace?.['refreshVoiceSources']?.({
        sourceId: sourceId2,
        remountVoiceStudio: state2?.['status'] === 'succeeded',
      });
    },
  });
  const personReplacementOutputCoordinator = createPersonReplacementOutputCoordinator({
      documentObject: documentObject,
      windowObject: windowObject,
      projectSession: projectSession,
      getWorkspace: () => workspace,
      prepareVideoReplacementShots: prepareVideoReplacementShots,
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
    value185 = PERSON_REPLACEMENT_WORKSPACE_INTENTS,
    workspaceIntentPort = createPersonReplacementWorkspaceIntentPort({
      handlers: {
        [value185['GET_PROMPT_ENHANCEMENT_MODEL']]: (...args37) =>
          promptEnhancement['getPromptEnhancementModel']?.(...args37) || {},
        [value185['LIST_LIBRARY_ASSETS']]: libraryAssets,
        [value185['SELECT_SOURCE_VIDEOS']]: loadSourceFiles,
        [value185['SELECT_SOURCE_VIDEO']]: (value186) => loadSourceFiles([value186]),
        [value185['REMOVE_SOURCE']]: removeSource,
        [value185['PROCESS_SOURCES']]: run5,
        [value185['ADD_LIBRARY_ASSETS_TO_PROJECT']]: addLibraryAssetsToProject,
        [value185['ADD_LIBRARY_ASSETS_TO_CHARACTERS']]: run19,
        [value185['ADD_ASSET_APPEARANCE_TO_LIBRARY']]: personReplacementAppearanceAssetLibraryOperation,
        [value185['SELECT_NEW_CHARACTER_IMAGES']]: run16,
        [value185['SELECT_NEW_CHARACTER_IMAGE']]: (value187) => run16([value187]),
        [value185['SELECT_NEW_SCENE_IMAGES']]: run17,
        [value185['SELECT_NEW_AUDIO_FILES']]: run18,
        [value185['SELECT_CHARACTER_REFERENCE']]: run20,
        [value185['SELECT_REPLACEMENT_IMAGE']]: uploadReplacementImage,
        [value185['SELECT_REPLACEMENT_VIDEO_RESULT']]: uploadReplacementVideoResult,
        [value185['SELECT_REPLACEMENT_VIDEO_INPUT']]: run22,
        [value185['REMOVE_REPLACEMENT_VIDEO_INPUT']]: run23,
        [value185['SELECT_SHOT_KEYFRAME']]: saveShotKeyframe,
        [value185['SELECT_CHARACTER_VOICE']]: run24,
        [value185['SELECT_CHARACTER_VOICE_LIBRARY']]: value175,
        [value185['DELETE_CHARACTER']]: run12,
        [value185['DELETE_SCENE']]: run13,
        [value185['DELETE_AUDIO_ASSET']]: run14,
        [value185['DOWNLOAD_IMAGE']]: personReplacementOutputCoordinator['downloadImage'],
        [value185['DOWNLOAD_VIDEO']]: personReplacementOutputCoordinator['downloadVideo'],
        [value185['PREVIEW_GENERATION']]: async (args38) => {
          if (globalThis['window']?.['DEV_MODE'] !== !![]) throw new Error('仅开发者模式可调试请求');
          if (args38['kind'] === 'asset') return run25({ ...args38, preview: !![] });
          if (args38['kind'] === 'image') return personReplacementImageTaskRuntime['preview'](args38);
          const currentProject = getProjectById(args38['projectId']) || initialProject,
            shot2 = currentProject['shots']['find']((value188) => value188['id'] === args38['shotId']);
          if (!shot2) throw new Error('请先选择镜头');
          return {
            payload: buildPersonReplacementVideoRequest({ currentProject: currentProject, shot: shot2 }),
          };
        },
        [value185['GENERATE_CHARACTER_IMAGE']]: run25,
        [value185['RESOLVE_CHARACTER_IMAGE_BATCH_CONCURRENCY']]:
          resolvePersonReplacementCharacterImageBatchConcurrency,
        [value185['GENERATE_REPLACEMENT_IMAGE']]: value182,
        [value185['CANCEL_REPLACEMENT_IMAGE']]: value183,
        [value185['GENERATE_REPLACEMENT_VIDEO']]: run26,
        [value185['CANCEL_REPLACEMENT_VIDEO']]: run27,
        [value185['COMPLETE_GENERATION_BATCH']]: state,
        [value185['DETECT_SHOT_CUT_RANGES']]: detectShotCutRanges,
        [value185['UPDATE_SHOT_CUT_RANGES']]: updateShotCutRanges,
        [value185['UPDATE_SHOT_REVERSE']]: updateShotReverse,
        [value185['SELECT_MANUAL_PERSON']]: run6,
        [value185['UPDATE_PEOPLE']]: run7,
        [value185['DELETE_PEOPLE']]: run8,
        [value185['MERGE_SOURCE_IDENTITIES']]: run9,
        [value185['SPLIT_SOURCE_IDENTITY']]: run10,
        [value185['CONFIRM_SOURCE_IDENTITY']]: run11,
        [value185['MOUNT_VOICE_STUDIO']]: personReplacementOutputCoordinator['mountVoiceStudio'],
        [value185['EXTRACT_VOICE']]: personReplacementVoiceSeparationRuntime['extract'],
        [value185['CANCEL_VOICE_EXTRACTION']]: personReplacementVoiceSeparationRuntime['cancel'],
        [value185['RESUME_VOICE_EXTRACTION']]: personReplacementVoiceSeparationRuntime['resume'],
        [value185['OPEN_PROJECT']]: openProject,
        [value185['RENAME_PROJECT']]: renameProject,
        [value185['DUPLICATE_PROJECT']]: duplicateProject,
        [value185['COLLECT_PROJECT']]: collectProject,
        [value185['IMPORT_PROJECT']]: importProjectPackage,
        [value185['ARCHIVE_PROJECT']]: archiveProject,
        [value185['DELETE_PROJECT']]: deleteProject,
        [value185['BACK_HOME']]: showProjectHome,
        [value185['COMPOSE_OUTPUT']]: personReplacementOutputCoordinator['composeOutput'],
        [value185['EXPORT_OUTPUT']]: personReplacementOutputCoordinator['exportOutput'],
        [value185['ADD_OUTPUT_TO_CANVAS']]: personReplacementOutputCoordinator['addOutputToCanvas'],
        [value185['REPORT_STEP_NAVIGATION_BLOCKED']]: ({ reason: reason } = {}) => {
          const value189 =
            reason === PERSON_REPLACEMENT_STEP_GATE_REASONS['ASSET_SETTINGS_INCOMPLETE']
              ? '请先在素材设定上传至少一张人物或场景图片。'
              : reason === PERSON_REPLACEMENT_STEP_GATE_REASONS['IMAGE_REPLACEMENT_INCOMPLETE']
                ? '请先在图像替换中绑定人物或场景。'
                : '正在处理片段';
          showToast(value189, 'info');
        },
        [value185['HAS_PROJECT_PACKAGE_DRAG']]: (value190) =>
          projectPackages?.['hasProjectPackageDrag']?.(value190) === !![],
        [value185['DROP_PROJECT_PACKAGE']]: (value191) =>
          projectPackages?.['importProjectFromDrop']?.(value191) === !![],
        [value185['CAN_CLOSE']]: () => !![],
        [value185['CLOSE']]: () => onRequestClose(),
      },
    });
  workspace = createWorkspace({
    documentObject: documentObject,
    windowObject: windowObject,
    mountTarget: mountTarget,
    initialProject: snapshot(),
    projectSession: projectSession,
    workspaceIntentPort: workspaceIntentPort,
  });
  if (typeof subscribeLibraryAssets === 'function')
    try {
      const subscribeLibraryAssets2 = subscribeLibraryAssets(() => {
        if (!enabled) syncWorkspace();
      });
      if (typeof subscribeLibraryAssets2 === 'function') handler2 = subscribeLibraryAssets2;
    } catch (value192) {
      console['warn']('[replacementStudio]\x20failed\x20to\x20subscribe\x20asset\x20library', value192);
    }
  const value193 = initialProject,
    value194 = workspaceView;
  let enabled17 = ![];
  const value195 = Promise['resolve']()
    ['then'](async () => {
      if (typeof loadWorkspace !== 'function') {
        enabled17 = !![];
        return;
      }
      const args39 = normalizePersonReplacementProjectLibrary(await loadWorkspace()),
        list21 = args39['projects']['filter'](isPersistable);
      payload = list21['length'] !== args39['projects']['length'];
      const list22 = list21['map']((value196) => {
          const settleInterruptedReplacementStudioProjectTasks2 =
            settleInterruptedReplacementStudioProjectTasks(value196);
          if (settleInterruptedReplacementStudioProjectTasks2['changed']) payload = !![];
          return settleInterruptedReplacementStudioProjectTasks2['project'];
        }),
        projects = await Promise['all'](
          list22['map']((value197) =>
            hydratePersonReplacementSourcePlaybackRefs(value197, { checkMediaExists: checkMediaExists }),
          ),
        );
      projects['some']((value198) => value198['changed']) && (payload = !![]);
      args = normalizePersonReplacementProjectLibrary({
        ...args39,
        projects: projects['map']((value199) => value199['project']),
      });
      const value200 = initialProject !== value193 || workspaceView !== value194;
      (value200
        ? isPersistable(initialProject) &&
          ((args = upsertPersonReplacementProject(args, initialProject)), (payload = !![]))
        : (projectSession['replace'](createInitialProject(), {
            persist: ![],
            presentation: 'none',
            reason: 'hydrate-home',
            touchUpdatedAt: ![],
          }),
          (workspaceView = 'home')),
        syncWorkspace(),
        (enabled17 = !![]));
    })
    ['catch']((value201) => {
      (console['warn']('[replacementStudio] hydration failed', value201),
        workspacePersistenceCoordinator['setHydrationError'](value201),
        showToast('人物替换项目加载失败，已暂停自动保存以防覆盖数据。', 'error'));
    })
    ['finally'](() => {
      if (!enabled17) return;
      workspacePersistenceCoordinator['setReady'](!![]);
      if (payload) schedulePersistence();
    });
  return Object['freeze']({
    open() {
      return (workspace['open']({ project: snapshot() }), workspace);
    },
    close() {
      return workspace['close']();
    },
    getProject() {
      return cloneJson(initialProject);
    },
    isSourceProcessing() {
      return Boolean(abortController);
    },
    getProjects() {
      return cloneJson(args['projects']);
    },
    setProject: setProject,
    openProject: openProject,
    renameProject: renameProject,
    duplicateProject: duplicateProject,
    collectProject: collectProject,
    importProjectPackageResult: importProjectPackageResult,
    archiveProject: archiveProject,
    deleteProject: deleteProject,
    showProjectHome: showProjectHome,
    loadSourceFile(value202) {
      return loadSourceFiles([value202]);
    },
    loadSourceFiles: loadSourceFiles,
    removeSource: removeSource,
    uploadReplacementImage: uploadReplacementImage,
    uploadReplacementVideoResult: uploadReplacementVideoResult,
    saveShotKeyframe: saveShotKeyframe,
    startSourceProcessing(options9 = {}) {
      return run5(options9);
    },
    updateShotCutRanges: updateShotCutRanges,
    updateShotReverse: updateShotReverse,
    detectShotCutRanges: detectShotCutRanges,
    prepareVideoReplacementShots: prepareVideoReplacementShots,
    async analyzeSourceFile(value203) {
      const response5 = await loadSourceFiles([value203]);
      return response5?.['ok'] ? await run5({ mode: 'cut' }) : response5;
    },
    whenReady() {
      return value195;
    },
    navigateToTaskResult: createPersonReplacementCompletionNavigation({
      getProject: () => initialProject,
      getProjects: () => args['projects'],
      openProject: openProject,
      setProject: setProject,
      showToast: showToast,
      showProject: () => {
        ((workspaceView = 'project'), syncWorkspace());
      },
    }),
    async persist() {
      return (await value195, await persistNow({ force: !workspacePersistenceCoordinator['isDirty']() }));
    },
    destroy() {
      if (enabled) return;
      (coordinator['invalidate'](),
        abortController?.['abort']?.(),
        (abortController = null),
        personReplacementImageTaskRuntime?.['destroy']?.(),
        videoTaskRuntime?.['destroy']?.(),
        personReplacementVoiceSeparationRuntime?.['destroy']?.(),
        releaseAllSourcePreviews(),
        handler2(),
        (handler2 = () => {}),
        void workspacePersistenceCoordinator['destroy']({ flush: !![], force: !![] })['catch'](() => {}),
        (enabled = !![]),
        workspace['destroy'](),
        personReplacementOutputCoordinator['destroy'](),
        handler(),
        projectSession['destroy']());
    },
  });
}
