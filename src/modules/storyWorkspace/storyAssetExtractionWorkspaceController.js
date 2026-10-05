import {
  createStoryAssetPaidRerunChoiceGate,
  getStoryAssetExperimentalDraftDisplay,
  getStoryAssetModelChangeRerunKinds,
  getStoryAssetPaidRerunBlockedBatches,
  getStoryAssetPaidRerunBlockedLanes,
  isStoryAssetLocalQualityRevalidationDraft,
  isStoryAssetPlannedContinuationDraft,
} from './storyAssetExtractionDraft.js';
import { runStoryAssetExtractionToCompletion } from './storyAssetExtractionRunner.js';
import { attachUploadedStoryAssetsToEpisodes } from './storyScriptImport.js';
import { resolveStoryStyleSelection } from './storyStyleCatalog.js';
import {
  clearStoryPlanningForRebuild,
  compileStoryEpisodeScripts,
  mergeStoryPlanningAssets,
} from './storyPlanningData.js';
import {
  normalizeStoryAspectRatio,
  normalizeStoryProjectPlanning,
  resolveStoryTextProviderProfileId,
} from './storyProjectPlanning.js';
import { syncStoryPromptModeForVideoModel } from './storyVideoGenerationSettings.js';
import { buildStoryBackgroundTaskId } from './storyBackgroundTasks.js';
import { isStoryAssetExtractionOperation } from './storyPlanningTaskState.js';
import { createStoryAssetExtractionDeveloperDiagnostics } from './storyWorkspaceDeveloperDiagnostics.js';
import {
  STORY_VIDEO_REPLICATION_UNIFIED_ASSET_MAX_OUTPUT_TOKENS,
  buildStoryVideoReplicationAssetExtractionProject,
  markStoryVideoReplicationAssetLocalizationComplete,
  shouldUseStoryVideoReplicationUnifiedAssetLocalization,
} from './storyVideoReplication.js';
import { captureStoryReplicationAssetSources } from './storyReplicationReplacement.js';
import { mergeStoryReplicationAssets } from './storyReplicationAssetReuse.js';
import { collectStoryReplicationAssetFrames } from './storyReplicationAssetFrames.js';
import {
  buildMissingStoryAssetImageWarning,
  getMissingStoryAssetImages,
} from './storyAssetSettingsWorkspacePresentation.js';
import { isStoryReplicationPromptStale } from './storyReplicationPromptFreshness.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function cloneData(item) {
  return JSON['parse'](JSON['stringify'](item));
}
export function getStoryAssetBreakdownEpisodes(options = {}) {
  const key =
    Array['isArray'](options['assetBreakdownEpisodes']) && options['assetBreakdownEpisodes']['length']
      ? options['assetBreakdownEpisodes']
      : options['data']?.['episodes'];
  return (Array['isArray'](key) ? key : [])['map']((index, result) => ({
    id: normalizeText(index?.['id']) || 'episode-' + (result + 1),
    number: Math['max'](1, Math['trunc'](Number(index?.['number']) || result + 1)),
    synopsis: normalizeText(index?.['synopsis'] || index?.['script']?.['fullText']),
  }));
}
export function isStoryAssetExperimentalExtractionAvailable(data = globalThis['window']) {
  return data?.['DEV_MODE'] === !![];
}
export function shouldUseStoryAssetBatchedExtraction(
  options2 = {},
  {
    batchedAgentAvailable: batchedAgentAvailable = ![],
    forceSingleRequest: forceSingleRequest = ![],
    explicitExperimental: explicitExperimental = ![],
  } = {},
) {
  if (forceSingleRequest) return ![];
  if (!explicitExperimental) return ![];
  if (!batchedAgentAvailable) return ![];
  return Array['isArray'](options2?.['episodes']);
}
export function shouldUseStoryAssetParallelExtraction({
  parallelAgentAvailable: parallelAgentAvailable = ![],
  forceSingleRequest: forceSingleRequest = ![],
  explicitExperimental: explicitExperimental = ![],
} = {}) {
  return parallelAgentAvailable && !forceSingleRequest && !explicitExperimental;
}
export function createStoryAssetExtractionWorkspaceController({
  state: state,
  windowObject: windowObject = globalThis['window'] || globalThis,
  extractAssets: extractAssets = null,
  extractAssetsParallel: extractAssetsParallel = null,
  extractAssetsExperimental: extractAssetsExperimental = null,
  host: host = {},
} = {}) {
  if (!state || typeof state !== 'object')
    throw new TypeError('Story asset extraction requires workspace state.');
  const {
    createStoryProjectTaskToken: createStoryProjectTaskToken,
    finishStoryProjectBackgroundTask: finishStoryProjectBackgroundTask,
    goToStep: goToStep,
    isProjectTaskCurrent: isProjectTaskCurrent,
    isProjectTaskLive: isProjectTaskLive,
    notifyNavigableTextTaskComplete: notifyNavigableTextTaskComplete,
    persistWorkspaceNow: persistWorkspaceNow,
    refreshStoryAssetExtractionFooterInPlace: refreshStoryAssetExtractionFooterInPlace,
    refreshStoryReplicationFooterInPlace: refreshStoryReplicationFooterInPlace,
    registerStoryProjectData: registerStoryProjectData,
    render: render,
    reportStoryWorkspaceApiError: reportStoryWorkspaceApiError,
    requestStoryWorkspaceChoice: requestStoryWorkspaceChoice,
    resetStoryDownstreamUiState: resetStoryDownstreamUiState,
    scheduleWorkspacePersistence: scheduleWorkspacePersistence,
    showTaskResultToast: showTaskResultToast,
    showToast: showToast,
    startStoryProjectBackgroundTask: startStoryProjectBackgroundTask,
    syncCompiledEpisodeScripts: syncCompiledEpisodeScripts,
    syncStoryPlanningLoading: syncStoryPlanningLoading,
    syncStoryProjectTaskEntry: syncStoryProjectTaskEntry,
    updateStoryProjectBackgroundTask: updateStoryProjectBackgroundTask,
  } = host;
  for (const [target, source] of Object['entries']({
    createStoryProjectTaskToken: createStoryProjectTaskToken,
    finishStoryProjectBackgroundTask: finishStoryProjectBackgroundTask,
    goToStep: goToStep,
    isProjectTaskCurrent: isProjectTaskCurrent,
    isProjectTaskLive: isProjectTaskLive,
    notifyNavigableTextTaskComplete: notifyNavigableTextTaskComplete,
    persistWorkspaceNow: persistWorkspaceNow,
    registerStoryProjectData: registerStoryProjectData,
    render: render,
    reportStoryWorkspaceApiError: reportStoryWorkspaceApiError,
    requestStoryWorkspaceChoice: requestStoryWorkspaceChoice,
    resetStoryDownstreamUiState: resetStoryDownstreamUiState,
    scheduleWorkspacePersistence: scheduleWorkspacePersistence,
    showTaskResultToast: showTaskResultToast,
    showToast: showToast,
    startStoryProjectBackgroundTask: startStoryProjectBackgroundTask,
    syncCompiledEpisodeScripts: syncCompiledEpisodeScripts,
    syncStoryProjectTaskEntry: syncStoryProjectTaskEntry,
    updateStoryProjectBackgroundTask: updateStoryProjectBackgroundTask,
  })) {
    if (typeof source !== 'function') throw new TypeError('Story asset extraction requires ' + target + '.');
  }
  let value2 = null;
  const map = new Set(),
    handler = createStoryAssetPaidRerunChoiceGate();
  function requestPlanningRegenerationMode({ title: title, message: message } = {}) {
    return requestStoryWorkspaceChoice({
      title: title,
      message: message,
      fallbackValue: 'preserve',
      choices: [
        { label: '取消', value: null },
        { label: '保留已有媒体', value: 'preserve', autofocus: !![] },
        { label: '全部重建', value: 'rebuild', primary: !![] },
      ],
    });
  }
  function run() {
    return requestStoryWorkspaceChoice({
      title: '仍有分集正文未完成',
      message:
        '当前仅按已完成的正文提取素材。补齐正文后需再次提取并核对素材关联，已有图片将保留。是否继续进入人设？',
      choices: [
        { label: '取消', value: null },
        { label: '继续拆解', value: 'continue', primary: !![], autofocus: !![] },
      ],
    });
  }
  async function openEpisodeStage({
    confirmMissingImages: confirmMissingImages = state['data']?.['project']?.['sourceMode'] !==
      'video-replication',
  } = {}) {
    if (!confirmMissingImages) return goToStep(3);
    const next = state['data'],
      list = state['data']['episodes']['filter']((current) =>
        isStoryReplicationPromptStale(state['data'], current),
      );
    if (list['length']) {
      const entry = state['data'],
        record = await requestStoryWorkspaceChoice({
          title: '替换设置已变更，分段提示词待更新',
          message:
            '有 ' +
            list['length'] +
            ' 条视频仍使用修改前的分段提示词。已有视频结果保留，更新提示词将调用文本模型。',
          choices: [
            { label: '返回修改', value: null, autofocus: !![] },
            { label: '前往更新分段提示词', value: 'update', primary: !![] },
          ],
        });
      if (record !== 'update' || state['data'] !== entry) return ![];
      return goToStep(3);
    }
    const list2 = confirmMissingImages ? getMissingStoryAssetImages(state['data']['assets']) : [];
    if (list2['length']) {
      const payload = await requestStoryWorkspaceChoice({
        title: '部分素材图片尚未生成',
        message: buildMissingStoryAssetImageWarning(list2),
        choices: [
          { label: '返回补图', value: null, autofocus: !![] },
          { label: '跳过并继续', value: 'skip', primary: !![] },
        ],
      });
      if (payload !== 'skip' || state['data'] !== next) return ![];
    }
    return goToStep(3);
  }
  function stopStoryAssetBreakdownProgress({ clearState: clearState = ![] } = {}) {
    (value2 && (windowObject['clearTimeout'](value2), (value2 = null)),
      clearState && ((state['assetBreakdownEpisodes'] = []), (state['assetBreakdownVisibleCount'] = 0)));
  }
  function run2() {
    stopStoryAssetBreakdownProgress();
    if (state['data']?.['project']?.['sourceMode'] === 'video-replication') return;
    const storyAssetBreakdownEpisodes = getStoryAssetBreakdownEpisodes(state)['length'];
    if (
      !isStoryAssetExtractionOperation(state['storyPlanningOperation']) ||
      state['assetBreakdownVisibleCount'] >= storyAssetBreakdownEpisodes
    )
      return;
    value2 = windowObject['setTimeout'](() => {
      value2 = null;
      if (!isStoryAssetExtractionOperation(state['storyPlanningOperation'])) return;
      ((state['assetBreakdownVisibleCount'] = Math['min'](
        storyAssetBreakdownEpisodes,
        Math['max'](1, state['assetBreakdownVisibleCount'] + 1),
      )),
        state['view'] === 'project' && state['step'] === 1 && render({ updateToolbar: ![] }),
        run2());
    }, 1600);
  }
  function restoreStoryAssetBreakdownProgress() {
    if (state['data']?.['project']?.['sourceMode'] === 'video-replication') return ![];
    if (!isStoryAssetExtractionOperation(state['storyPlanningOperation'])) return ![];
    state['assetBreakdownEpisodes'] = cloneData(state['data']['episodes'] || []);
    const handle = state['assetBreakdownEpisodes']['length'];
    return (
      (state['assetBreakdownVisibleCount'] = handle
        ? Math['min'](handle, Math['max'](1, Number(state['assetBreakdownVisibleCount']) || 1))
        : 0),
      run2(),
      !![]
    );
  }
  function setStoryPlanningOperation(config = '', scope = '') {
    ((state['storyPlanningOperation'] = config), (state['storyPlanningStatus'] = scope));
    if (
      state['data']?.['project']?.['sourceMode'] === 'video-replication' &&
      refreshStoryReplicationFooterInPlace()
    )
      return;
    render();
  }
  function run3({
    projectData: projectData = state['data'],
    singleRequest: singleRequest = ![],
    experimental: experimental = ![],
  } = {}) {
    const shouldUseStoryVideoReplicationUnifiedAssetLocalization2 =
        shouldUseStoryVideoReplicationUnifiedAssetLocalization(projectData),
      forceSingleRequest2 = singleRequest || shouldUseStoryVideoReplicationUnifiedAssetLocalization2,
      useParallelExtraction = shouldUseStoryAssetParallelExtraction({
        parallelAgentAvailable: typeof extractAssetsParallel === 'function',
        forceSingleRequest: forceSingleRequest2,
        explicitExperimental: experimental,
      }),
      useBatchedExtraction = shouldUseStoryAssetBatchedExtraction(projectData, {
        batchedAgentAvailable: typeof extractAssetsExperimental === 'function',
        forceSingleRequest: forceSingleRequest2,
        explicitExperimental: experimental,
      }),
      useSingleRequest = !useParallelExtraction && !useBatchedExtraction,
      extractionAgent = useParallelExtraction
        ? extractAssetsParallel
        : useBatchedExtraction
          ? extractAssetsExperimental
          : extractAssets;
    return {
      useParallelExtraction: useParallelExtraction,
      useBatchedExtraction: useBatchedExtraction,
      useSingleRequest: useSingleRequest,
      extractionAgent: extractionAgent,
    };
  }
  function getStoryPlanningAgentContext(data2 = state['data'], input = null) {
    const project = data2?.['project'] || {},
      model = input?.['modelSettings'] || {},
      provider = model['textProvider'] || state['textProvider'];
    return (
      syncStoryPromptModeForVideoModel(
        { ...state, data: data2 },
        model['models']?.['video'] || state['models']['video'],
      ),
      (project['planning'] = normalizeStoryProjectPlanning(project, {
        allowDeveloperPromptModes: state['developerModeAvailable'],
      })),
      {
        project: project,
        model: model['models']?.['text'] || state['models']['text'],
        provider: provider,
        providerProfileId: resolveStoryTextProviderProfileId(
          provider,
          model['textProviderProfileId'] || state['textProviderProfileId'],
        ),
        aspectRatio: normalizeStoryAspectRatio(project['aspectRatio']),
        visualStyle: resolveStoryStyleSelection({
          styleId: project['videoStyleId'],
          stylePrompt: project['videoStylePrompt'],
          videoStyle: project['videoStyle'],
        })['stylePrompt'],
      }
    );
  }
  async function extractProjectAssets({
    advance: advance = !![],
    allowIncompleteScripts: allowIncompleteScripts = ![],
    experimental: experimental = ![],
    singleRequest: singleRequest = ![],
  } = {}) {
    const text = normalizeText(state['data']?.['project']?.['id']) || 'current-project';
    if (state['storyPlanningOperation'] || map['has'](text)) return ![];
    if (experimental && !isStoryAssetExperimentalExtractionAvailable(windowObject)) return ![];
    const episodes = state['data']['project']?.['sourceMode'] === 'video-replication';
    if (state['data']['episodes']['length']) {
      const enabled = syncCompiledEpisodeScripts();
      if (!enabled['complete'] && !allowIncompleteScripts && !episodes)
        return (showToast('请先按顺序生成所有分集剧本。', 'warn'), ![]);
    }
    const {
        useParallelExtraction: useParallelExtraction2,
        useBatchedExtraction: useBatchedExtraction2,
        useSingleRequest: useSingleRequest2,
        extractionAgent: extractionAgent2,
      } = run3({ singleRequest: singleRequest, experimental: experimental }),
      output = useParallelExtraction2
        ? 'extracting-assets'
        : useSingleRequest2
          ? 'extracting-assets-single-request'
          : 'extracting-assets-experimental',
      label = useParallelExtraction2
        ? episodes
          ? '本地化角色、场景与道具'
          : '并行提取角色、场景与道具'
        : useSingleRequest2
          ? episodes
            ? '本地化角色、场景与道具'
            : '单次超长提取角色、场景与道具'
          : '正在按剧本长度选择三类专用 API 或 PP-UIE + API，并生成最终视觉素材';
    if (typeof extractionAgent2 !== 'function')
      return (showToast((experimental ? '混合开发测试' : '素材') + '提取尚未初始化。', 'error'), ![]);
    const value3 = state['data']['project']?.['sourceMode'] === 'upload-original',
      message2 = value3 || episodes,
      draftKey = experimental ? 'experimentalAssetExtractionDraft' : 'assetExtractionDraft',
      value4 = state['data'],
      draft = value4[draftKey],
      list3 = getStoryAssetPaidRerunBlockedLanes(draft),
      list4 = getStoryAssetPaidRerunBlockedBatches(draft),
      enabled2 = list3['length'] + list4['length'],
      authorizedKinds = getStoryAssetModelChangeRerunKinds(draft);
    let paidRerunAuthorization = null;
    if (authorizedKinds['length'] && !list4['length'] && list3['length'] === authorizedKinds['length'])
      paidRerunAuthorization = { confirmed: !![], authorizedKinds: authorizedKinds };
    else {
      if (enabled2) {
        const value5 = await handler({
          draft: draft,
          requestChoice: requestStoryWorkspaceChoice,
          isCurrent: () => state['data'] === value4,
        });
        if (
          !['local-revalidate', 'paid-rerun']['includes'](value5['action']) ||
          state['storyPlanningOperation']
        )
          return ![];
        paidRerunAuthorization = value5['paidRerunAuthorization'];
      }
    }
    const isStoryAssetLocalQualityRevalidationDraft2 = isStoryAssetLocalQualityRevalidationDraft(draft),
      isStoryAssetPlannedContinuationDraft2 = isStoryAssetPlannedContinuationDraft(draft);
    let enabled3 = 'preserve';
    if (
      state['data']['assets']['length'] &&
      !isStoryAssetLocalQualityRevalidationDraft2 &&
      !isStoryAssetPlannedContinuationDraft2 &&
      !enabled2
    ) {
      map['add'](text);
      try {
        enabled3 = await requestPlanningRegenerationMode({
          title: experimental ? '混合开发测试重新提取角色、场景与道具' : '重新提取角色、场景与道具',
          message: message2
            ? '保留已有媒体会沿用匹配素材的图片；全部重建会清空素材媒体和下游分镜，不会改写或删除上传的原始剧本。'
            : '保留已有媒体会沿用匹配角色、场景和道具的图片；全部重建会清空素材媒体和下游分镜，保留已确认的分集正文。',
        });
      } finally {
        map['delete'](text);
      }
      if (!enabled3 || state['data'] !== value4) return ![];
    }
    stopStoryAssetBreakdownProgress({ clearState: !![] });
    !episodes &&
      ((state['assetBreakdownEpisodes'] = cloneData(state['data']['episodes'])),
      (state['assetBreakdownVisibleCount'] = state['assetBreakdownEpisodes']['length'] ? 1 : 0));
    setStoryPlanningOperation(output, '正在' + label);
    if (!episodes) run2();
    const value6 = state['step'],
      projectId = createStoryProjectTaskToken(state),
      id = useSingleRequest2
        ? buildStoryBackgroundTaskId('asset-extraction-single-request')
        : experimental
          ? buildStoryBackgroundTaskId('asset-extraction-experimental')
          : buildStoryBackgroundTaskId('asset-extraction');
    startStoryProjectBackgroundTask(projectId, {
      id: id,
      type: useSingleRequest2
        ? 'asset-extraction-single-request'
        : experimental
          ? 'asset-extraction-experimental'
          : 'asset-extraction',
      label: label,
      message: state['storyPlanningStatus'],
      resumable: !useSingleRequest2,
      ...(!useSingleRequest2
        ? { resumePayload: { kind: 'story-asset-extraction-run', draftKey: draftKey } }
        : {}),
    });
    const initialResumeDraft = projectId['data'];
    try {
      const project2 = getStoryPlanningAgentContext(initialResumeDraft, projectId),
        project3 = episodes
          ? buildStoryVideoReplicationAssetExtractionProject(initialResumeDraft)
          : project2['project'],
        handler2 = async (resumeDraft = null) =>
          extractionAgent2({
            ...project2,
            project: project3,
            episodes: episodes
              ? initialResumeDraft['episodes']['filter'](
                  (value7) => value7['replication']?.['status'] === 'ready',
                )
              : initialResumeDraft['episodes'],
            ...(useBatchedExtraction2
              ? { diagnostics: createStoryAssetExtractionDeveloperDiagnostics(windowObject) }
              : {}),
            ...(useParallelExtraction2 || useBatchedExtraction2
              ? {
                  resumeDraft: resumeDraft,
                  ...(useParallelExtraction2
                    ? {
                        automaticRecovery: !episodes,
                        ...(episodes ? { resumeSourceAliases: [{ project: project2['project'] }] } : {}),
                      }
                    : {}),
                  ...(paidRerunAuthorization ? { paidRerunAuthorization: paidRerunAuthorization } : {}),
                  onCheckpoint: async (value8) => {
                    if (!isProjectTaskLive(projectId)) return;
                    ((initialResumeDraft[draftKey] = cloneData(value8)),
                      updateStoryProjectBackgroundTask(projectId, id, {
                        resumable: !![],
                        modelId: project2['model'],
                        provider: project2['provider'],
                        resumePayload: { kind: 'story-asset-extraction-run', draftKey: draftKey },
                      }),
                      syncStoryProjectTaskEntry(projectId),
                      await persistWorkspaceNow());
                  },
                }
              : useSingleRequest2
                ? {
                    allowOversizedPrompt: !![],
                    ...(episodes
                      ? {
                          maxOutputTokens: STORY_VIDEO_REPLICATION_UNIFIED_ASSET_MAX_OUTPUT_TOKENS,
                          structuredOutputFallback: 'prompt',
                          automaticRecovery: !![],
                          assetKinds: ['scene', 'prop'],
                        }
                      : {}),
                  }
                : {}),
            onProgress: ({ message: message3 } = {}) => {
              if (!isProjectTaskLive(projectId)) return;
              const message4 = normalizeText(message3) || '正在' + label;
              (updateStoryProjectBackgroundTask(projectId, id, { status: 'running', message: message4 }),
                isProjectTaskCurrent(projectId) &&
                  ((state['storyPlanningStatus'] = message4),
                  syncStoryPlanningLoading(),
                  refreshStoryAssetExtractionFooterInPlace()));
            },
          }),
        value9 =
          useParallelExtraction2 || useBatchedExtraction2
            ? await runStoryAssetExtractionToCompletion({
                initialResumeDraft: initialResumeDraft[draftKey],
                isActive: () => isProjectTaskLive(projectId),
                execute: async (value10) => handler2(value10),
                onContinuation: async (value11, error) => {
                  if (!isProjectTaskLive(projectId)) return;
                  initialResumeDraft[draftKey] = cloneData(value11);
                  const storyAssetExperimentalDraftDisplay = getStoryAssetExperimentalDraftDisplay(value11),
                    message5 =
                      storyAssetExperimentalDraftDisplay['summary'] ||
                      normalizeText(error?.['message']) ||
                      '本轮分批调用已完成，系统正在自动继续剩余内容';
                  (updateStoryProjectBackgroundTask(projectId, id, {
                    status: 'running',
                    message: message5 + ' · 正在自动继续',
                  }),
                    syncStoryProjectTaskEntry(projectId),
                    await persistWorkspaceNow(),
                    isProjectTaskCurrent(projectId) &&
                      ((state['storyPlanningStatus'] = message5 + ' · 正在自动继续'),
                      syncStoryPlanningLoading()));
                },
              })
            : await handler2();
      if (!isProjectTaskLive(projectId)) return ![];
      const assets = Array['isArray'](value9?.['assets']) ? value9['assets'] : [],
        value12 = assets['filter']((value13) => value13?.['designStatus'] === 'baseline')['length'],
        enabled4 = !episodes || assets['some']((value14) => value14?.['kind'] === 'scene');
      if (!assets['length'] || value12 || !enabled4) {
        const error2 = new Error(
          value12
            ? '本轮有 ' + value12 + ' 个素材没有完成 API 视觉反推；旧素材已保留，未进入下一步。'
            : !enabled4
              ? '本轮没有获得可用场景素材；旧素材已保留，未进入下一步。'
              : '本轮没有获得可用素材；旧素材已保留，未进入下一步。',
        );
        error2['type'] = 'ASSET_VISUAL_RESULT_INCOMPLETE';
        throw error2;
      }
      if (episodes) {
        const storyReplicationAssetFrames = await collectStoryReplicationAssetFrames({
          data: initialResumeDraft,
          assets: assets,
          projectId: projectId['projectId'],
          sources: project3['replicationFrameSources'],
          isActive: () => isProjectTaskLive(projectId),
          onProgress: (message6) => {
            (updateStoryProjectBackgroundTask(projectId, id, { message: message6 }),
              isProjectTaskCurrent(projectId) &&
                ((state['storyPlanningStatus'] = message6), syncStoryPlanningLoading()));
          },
        });
        if (!isProjectTaskLive(projectId)) return ![];
        if (!storyReplicationAssetFrames) throw new Error('原视频分析在截帧期间发生变化，请重新提取素材。');
      }
      let assetId = initialResumeDraft;
      enabled3 === 'rebuild' &&
        ((assetId = clearStoryPlanningForRebuild(initialResumeDraft)),
        (projectId['data'] = assetId),
        registerStoryProjectData(projectId),
        isProjectTaskCurrent(projectId) && ((state['data'] = assetId), resetStoryDownstreamUiState()));
      (delete assetId['assetExtractionDraft'], delete assetId['experimentalAssetExtractionDraft']);
      const message7 = useParallelExtraction2
          ? '三路并行'
          : useSingleRequest2
            ? episodes
              ? '统一素材本地化'
              : '单次超长'
            : value9?.['extractionMode'] === 'parallel-api'
              ? '角色、场景、道具三类 API 开发测试'
              : value9?.['extractionMode'] === 'api-fallback'
                ? 'API 分批降级开发测试'
                : 'PP-UIE + API 混合开发测试',
        preserveMedia = enabled3 !== 'rebuild';
      assetId['assets'] = (episodes ? mergeStoryReplicationAssets : mergeStoryPlanningAssets)(
        episodes ? assetId : assetId['assets'],
        value9?.['assets'],
        { preserveMedia: preserveMedia, retainUnmatched: !episodes, visualStyle: project2['visualStyle'] },
      );
      const value15 = value9?.['candidateLedger']?.['summary']?.['quarantinedCount']
        ? '，已隔离 ' +
          Math['max'](
            0,
            Math['trunc'](Number(value9['candidateLedger']['summary']['quarantinedCount']) || 0),
          ) +
          ' 个未通过证据裁决的候选'
        : '';
      (message2 || episodes || useParallelExtraction2 || useBatchedExtraction2 || useSingleRequest2) &&
        (assetId['episodes'] = attachUploadedStoryAssetsToEpisodes(assetId['episodes'], assetId['assets']));
      episodes &&
        (captureStoryReplicationAssetSources(assetId),
        markStoryVideoReplicationAssetLocalizationComplete(assetId));
      (finishStoryProjectBackgroundTask(projectId, id, {
        status: 'succeeded',
        message: message7 + '已提取 ' + assetId['assets']['length'] + ' 个素材' + value15,
        resumable: ![],
      }),
        scheduleWorkspacePersistence({ immediate: !![] }),
        notifyNavigableTextTaskComplete(
          message7 + '已提取 ' + assetId['assets']['length'] + ' 个角色、场景与道具素材' + value15 + '。',
          projectId,
          { step: 2, assetId: assetId['assets'][0]?.['id'] },
          { notificationMessage: message7 + '角色、场景与道具素材提取完成。' },
        ));
      if (isProjectTaskCurrent(projectId)) {
        ((state['selectedAssetId'] = assetId['assets'][0]?.['id'] || ''),
          (state['assetFilter'] = assetId['assets'][0]?.['kind'] || 'character'),
          stopStoryAssetBreakdownProgress({ clearState: !![] }),
          (state['storyPlanningOperation'] = ''),
          (state['storyPlanningStatus'] = ''));
        if (advance && state['view'] === 'project' && state['step'] === value6) goToStep(2);
        else render();
      }
      return !![];
    } catch (error3) {
      if (!isProjectTaskLive(projectId)) return ![];
      return (
        reportStoryWorkspaceApiError(
          useSingleRequest2
            ? episodes
              ? 'localize-replication-assets'
              : 'extract-assets-single-request'
            : experimental
              ? 'extract-assets-experimental'
              : 'extract-assets',
          error3,
          { model: state['models']['text'], provider: state['textProvider'] },
        ),
        finishStoryProjectBackgroundTask(projectId, id, {
          status: 'failed',
          message:
            (useSingleRequest2
              ? episodes
                ? '素材本地化'
                : '单次超长'
              : experimental
                ? '混合开发测试'
                : '素材') + '提取失败',
          error: error3?.['message'] || label + '失败。',
        }),
        showTaskResultToast(error3?.['message'] || label + '失败。', 'error', error3),
        ![]
      );
    } finally {
      isProjectTaskCurrent(projectId) &&
        (stopStoryAssetBreakdownProgress({ clearState: !![] }),
        state['storyPlanningOperation'] === output && setStoryPlanningOperation());
    }
  }
  async function continueToProjectAssets() {
    if (state['storyPlanningOperation']) return ![];
    const allowIncompleteScripts2 =
      state['data']['episodes']['length'] > 0 &&
      !compileStoryEpisodeScripts(state['data']['episodes'])['complete'];
    if (allowIncompleteScripts2) {
      const value16 = await run();
      if (value16 !== 'continue') return ![];
    }
    return extractProjectAssets({ advance: !![], allowIncompleteScripts: allowIncompleteScripts2 });
  }
  return Object['freeze']({
    preview: async (request) => {
      if (windowObject?.['DEV_MODE'] !== !![]) throw new Error('仅开发者模式可调试请求');
      const projectData2 = cloneData(state['data']),
        {
          useParallelExtraction: useParallelExtraction3,
          useBatchedExtraction: useBatchedExtraction3,
          useSingleRequest: useSingleRequest3,
          extractionAgent: extractionAgent3,
        } = run3({ projectData: projectData2 });
      if (typeof extractionAgent3 !== 'function') throw new Error('素材提取 Agent 尚未初始化');
      const args = getStoryPlanningAgentContext(projectData2),
        project4 = projectData2['project']?.['sourceMode'] === 'video-replication';
      return extractionAgent3({
        ...args,
        project: project4 ? buildStoryVideoReplicationAssetExtractionProject(projectData2) : args['project'],
        episodes: project4
          ? projectData2['episodes']['filter']((value17) => value17['replication']?.['status'] === 'ready')
          : projectData2['episodes'],
        ...(useParallelExtraction3 || useBatchedExtraction3
          ? { resumeDraft: projectData2['assetExtractionDraft'], automaticRecovery: !project4 }
          : {}),
        ...(useSingleRequest3
          ? {
              allowOversizedPrompt: !![],
              ...(project4
                ? {
                    maxOutputTokens: STORY_VIDEO_REPLICATION_UNIFIED_ASSET_MAX_OUTPUT_TOKENS,
                    structuredOutputFallback: 'prompt',
                    automaticRecovery: !![],
                    assetKinds: ['scene', 'prop'],
                  }
                : {}),
            }
          : {}),
        request: request,
        preferLocal: ![],
      });
    },
    continueToProjectAssets: continueToProjectAssets,
    extractProjectAssets: extractProjectAssets,
    getStoryPlanningAgentContext: getStoryPlanningAgentContext,
    openEpisodeStage: openEpisodeStage,
    requestPlanningRegenerationMode: requestPlanningRegenerationMode,
    restoreStoryAssetBreakdownProgress: restoreStoryAssetBreakdownProgress,
    setStoryPlanningOperation: setStoryPlanningOperation,
    stopStoryAssetBreakdownProgress: stopStoryAssetBreakdownProgress,
  });
}
