import { ensureVideoResultThumbnail } from '../../../api/videoResultThumbnailApi.js';
import { transcribeReplicationSource } from '../../../api/storyReplicationSpeechApi.js';
import { readVideoFileNaturalSize } from '../../components/source-video/sourceVideoUploadMedia.js';
import { uploadFile } from '../../services/projectService.js';
import { logDiagnosticEvent } from '../../services/diagnosticsService.js';
import { collectStoryReplicationRepresentativeFrames } from './storyReplicationRepresentativeFrames.js';
import { buildStoryBackgroundTaskId } from './storyBackgroundTasks.js';
import { resolveStoryTextProviderProfileId } from './storyProjectPlanning.js';
import { validateStoryReplicationVideoSize } from './storyReplicationVideoLimits.js';
import {
  getStoryWorkspaceModelChoice,
  resolveStoryVideoInputTextModelId,
} from './storyWorkspaceModelCatalog.js';
import {
  applyStoryVideoReplicationAnalysis,
  applyStoryVideoReplicationUpload,
  createStoryVideoReplicationProjectData,
  failStoryVideoReplicationEpisode,
  findStoryReplicationEpisode,
  getStoryVideoReplicationSummary,
  invalidateStoryVideoReplicationAssetLocalization,
  resolveStoryVideoReplicationHomeTab,
  resolveStoryReplicationUploadedVideo,
  syncStoryVideoReplicationProject,
} from './storyVideoReplication.js';
import {
  syncStoryVideoReplicationCardElement,
  syncStoryReplicationSelection,
} from './storyVideoReplicationPresentation.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function finishAnalysisAttempt(item, args, status = null) {
  if (!args) return;
  const context = {
    ...args,
    finishedAt: Date['now'](),
    status: status ? 'failed' : 'succeeded',
    ...(status
      ? {
          error: String(status['message'] || '视频分析失败')['slice'](0x0, 0x4b0),
          code: status['code'],
          httpStatus: status['status'],
          errorType: status['type'],
        }
      : {}),
  };
  ((item['replication']['analysisAttempts'] = [...(item['replication']['analysisAttempts'] || []), context][
    'slice'
  ](-0xa)),
    void logDiagnosticEvent({
      type: 'story.replication_analysis_finished',
      level: status ? 'error' : 'info',
      message: status ? context['error'] : '原视频分析完成',
      context: context,
    }));
}
export function createStoryVideoReplicationWorkspaceController({
  state: state,
  viewport: viewport,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
  analyzeSourceVideo: analyzeSourceVideo,
  transcribeSource: transcribeSource = transcribeReplicationSource,
  analysisPromises: analysisPromises,
  sourceFileByEpisodeKey: sourceFileByEpisodeKey,
  createProjectToken: createProjectToken,
  beginProjectSession: beginProjectSession,
  isProjectTaskLive: isProjectTaskLive,
  isProjectTaskCurrent: isProjectTaskCurrent,
  startBackgroundTask: startBackgroundTask,
  updateBackgroundTask: updateBackgroundTask,
  finishBackgroundTask: finishBackgroundTask,
  syncProjectEntry: syncProjectEntry,
  syncCurrentProjectEntry: syncCurrentProjectEntry,
  schedulePersistence: schedulePersistence,
  openProject: openProject,
  renderFooter: renderFooter,
  showToast: showToast,
  showNavigableTaskResultToast: showNavigableTaskResultToast,
  notifyTextTaskComplete: notifyTextTaskComplete,
} = {}) {
  if (
    !state ||
    !viewport ||
    !documentObject ||
    !(analysisPromises instanceof Map) ||
    !(sourceFileByEpisodeKey instanceof Map) ||
    typeof createProjectToken !== 'function' ||
    typeof beginProjectSession !== 'function' ||
    typeof isProjectTaskLive !== 'function' ||
    typeof isProjectTaskCurrent !== 'function' ||
    typeof startBackgroundTask !== 'function' ||
    typeof updateBackgroundTask !== 'function' ||
    typeof finishBackgroundTask !== 'function' ||
    typeof syncProjectEntry !== 'function' ||
    typeof syncCurrentProjectEntry !== 'function' ||
    typeof schedulePersistence !== 'function' ||
    typeof openProject !== 'function' ||
    typeof renderFooter !== 'function' ||
    typeof showToast !== 'function' ||
    typeof showNavigableTaskResultToast !== 'function' ||
    typeof notifyTextTaskComplete !== 'function'
  )
    throw new TypeError(
      'Story\x20video\x20replication\x20requires\x20task,\x20persistence,\x20and\x20presentation\x20adapters.',
    );
  function createSourcePreviewUrl(enabled) {
    const key = windowObject?.['URL'];
    if (!enabled || typeof key?.['createObjectURL'] !== 'function') return '';
    try {
      return key['createObjectURL'](enabled);
    } catch (index) {
      return (console['warn']('[storyWorkspace] 创建复刻视频本地预览失败', index), '');
    }
  }
  function revokeSourcePreviewUrl(result) {
    const text = normalizeText(result),
      data = windowObject?.['URL'];
    if (!text['startsWith']('blob:') || typeof data?.['revokeObjectURL'] !== 'function') return;
    data['revokeObjectURL'](text);
  }
  function releaseSourcePreviewUrls() {
    (state['replicationSourcePreviewUrls']['forEach'](revokeSourcePreviewUrl),
      (state['replicationSourcePreviewUrls'] = []));
  }
  function refreshEpisode(episodeId2) {
    if (
      state['view'] !== 'project' ||
      state['step'] !== 0x1 ||
      state['data']?.['project']?.['sourceMode'] !== 'video-replication'
    )
      return ![];
    const el = viewport['querySelector']('.story-page.is-current'),
      storyReplicationEpisode = findStoryReplicationEpisode(state['data'], episodeId2),
      enabled2 = [...(el?.['querySelectorAll']('[data-story-replication-episode-id]') || [])]['find'](
        (el2) =>
          el2['matches']?.('article') &&
          normalizeText(el2['dataset']['storyReplicationEpisodeId']) === normalizeText(episodeId2),
      );
    if (!el || !storyReplicationEpisode || !enabled2) return ![];
    const options = state['data']['episodes']['indexOf'](storyReplicationEpisode);
    return (
      el['dispatchEvent']?.(
        new CustomEvent('story-replication-updated', { detail: { episodeId: episodeId2 } }),
      ),
      syncStoryVideoReplicationCardElement(enabled2, storyReplicationEpisode, options)
    );
  }
  function refreshFooter() {
    if (
      state['view'] !== 'project' ||
      state['step'] !== 0x1 ||
      state['data']?.['project']?.['sourceMode'] !== 'video-replication'
    )
      return ![];
    const el3 = viewport['querySelector']('.story-page.is-current'),
      enabled3 = el3?.['querySelector']('.story-page-footer');
    if (el3) syncStoryReplicationSelection(el3, state);
    if (!enabled3) return ![];
    const el4 = documentObject['createElement']('template');
    el4['innerHTML'] = renderFooter(state)['trim']();
    const enabled4 = el4['content']['firstElementChild'];
    if (!enabled4) return ![];
    return (enabled3['replaceWith'](enabled4), !![]);
  }
  function run(target, source) {
    if (
      !isProjectTaskCurrent(target) ||
      state['view'] !== 'project' ||
      state['step'] !== 0x1 ||
      state['data']?.['project']?.['sourceMode'] !== 'video-replication'
    )
      return ![];
    const next = refreshEpisode(source),
      current = refreshFooter();
    return next && current;
  }
  async function analyzeEpisode(
    projectId,
    file,
    episodeId3,
    { uploadOnly: uploadOnly = ![], force: force = ![] } = {},
  ) {
    const status2 = findStoryReplicationEpisode(projectId['data'], episodeId3);
    if (!status2 || !isProjectTaskLive(projectId)) return ![];
    const response = force ? { replication: { ...status2['replication'] }, status: status2['status'] } : null;
    let entry = null;
    const id = buildStoryBackgroundTaskId('video-replication-analysis', { episodeId: episodeId3 });
    startBackgroundTask(
      projectId,
      {
        id: id,
        type: 'video-replication-analysis',
        scope: { episodeId: episodeId3 },
        label: '解析第 ' + status2['number'] + ' 集视频',
        message: '正在上传原视频',
      },
      { refreshHome: ![] },
    );
    if (!force) invalidateStoryVideoReplicationAssetLocalization(projectId['data']);
    ((status2['replication'] = {
      ...(status2['replication'] || {}),
      status: 'uploading',
      progress: 0xa,
      error: '',
    }),
      run(projectId, episodeId3));
    try {
      const response2 = validateStoryReplicationVideoSize(
        file || status2['sourceVideo'],
        projectId['modelSettings']['models']?.['text'],
      );
      if (!response2['ok']) throw new Error(response2['error']);
      let videoUrl = normalizeText(status2['sourceVideo']?.['videoRef']);
      if (!videoUrl) {
        if (!file) throw new Error('原视频尚未上传，请使用卡片上的“重新上传该视频”。');
        const videoFileNaturalSize = readVideoFileNaturalSize(file)['catch'](() => null),
          args2 = await uploadFile(file, projectId['projectId']);
        if (!isProjectTaskLive(projectId)) return ![];
        const durationSec = await videoFileNaturalSize;
        if (!isProjectTaskLive(projectId)) return ![];
        const localPath = resolveStoryReplicationUploadedVideo(args2);
        videoUrl = localPath['videoRef'];
        let posterUrl = {
          ...args2,
          localPath: localPath['localPath'] || args2?.['localPath'],
          videoUrl: videoUrl,
        };
        try {
          posterUrl = await ensureVideoResultThumbnail(posterUrl);
        } catch (record) {
          globalThis['console']?.['warn']?.(
            '[storyWorkspace] 复刻视频首帧提取失败，继续执行视频解析',
            record,
          );
        }
        if (!isProjectTaskLive(projectId)) return ![];
        applyStoryVideoReplicationUpload(status2, {
          file: file,
          videoRef: videoUrl,
          durationSec: durationSec?.['duration'] || args2?.['durationSec'] || args2?.['duration'],
          posterUrl: posterUrl?.['posterUrl'] || posterUrl?.['thumbUrl'],
          posterLocalPath: posterUrl?.['posterLocalPath'] || posterUrl?.['thumbLocalPath'],
        });
      } else
        ((status2['replication'] = {
          ...(status2['replication'] || {}),
          status: 'analyzing',
          progress: 0x2d,
          error: '',
        }),
          (status2['status'] = '解析中'));
      if (uploadOnly)
        return (
          (status2['replication']['status'] = 'pending'),
          (status2['replication']['progress'] = 0x0),
          (status2['status'] = '待分析'),
          finishBackgroundTask(
            projectId,
            id,
            { status: 'succeeded', message: '视频已导入，等待选择分析' },
            { refreshHome: ![] },
          ),
          syncStoryVideoReplicationProject(projectId['data']),
          syncProjectEntry(projectId),
          schedulePersistence({ immediate: !![] }),
          run(projectId, episodeId3),
          !![]
        );
      (updateBackgroundTask(
        projectId,
        id,
        { status: 'running', message: '正在理解剧情、台词与镜头' },
        { refreshHome: ![] },
      ),
        run(projectId, episodeId3));
      const modelId = normalizeText(projectId['modelSettings']['models']?.['text']);
      if (!modelId || resolveStoryVideoInputTextModelId(modelId) !== modelId)
        throw new Error('当前选中的模型不支持视频分析，请从模型菜单重新选择后重试。');
      const provider =
          getStoryWorkspaceModelChoice('text', modelId)?.['provider'] ||
          projectId['modelSettings']['textProvider'],
        providerProfileId = resolveStoryTextProviderProfileId(
          provider,
          projectId['modelSettings']['textProviderProfileId'],
        );
      updateBackgroundTask(
        projectId,
        id,
        { modelId: modelId, provider: provider, providerProfileId: providerProfileId },
        { refreshHome: ![] },
      );
      (force || !status2['replication']['sourceAnalysis']) &&
        (entry = {
          startedAt: Date['now'](),
          projectId: projectId['projectId'],
          episodeId: episodeId3,
          modelId: modelId,
          provider: provider,
          providerProfileId: providerProfileId,
        });
      let speechEvidence =
        status2['replication']['speechEvidence'] ||
        status2['replication']['sourceAnalysis']?.['speechEvidence'];
      if ((force || !status2['replication']['sourceAnalysis']) && !speechEvidence) {
        (updateBackgroundTask(
          projectId,
          id,
          { message: '正在识别原片音轨，保留台词与时间' },
          { refreshHome: ![] },
        ),
          (speechEvidence = await transcribeSource({
            videoRef: videoUrl,
            provider: projectId['data']['project']['replication']?.['asrProvider'] || 'volcengine-speech',
            isActive: () => isProjectTaskLive(projectId),
          })));
        if (!isProjectTaskLive(projectId)) return ![];
        if (response) response['replication']['speechEvidence'] = speechEvidence;
        !force &&
          ((status2['replication']['speechEvidence'] = speechEvidence),
          syncProjectEntry(projectId),
          schedulePersistence({ immediate: !![] }));
      }
      const sourceAnalysis = await analyzeSourceVideo({
        videoRef: videoUrl,
        speechEvidence: speechEvidence,
        durationSec: status2['sourceVideo']['durationSec'],
        modelId: modelId,
        model: modelId,
        provider: provider,
        providerProfileId: providerProfileId,
        sourceAnalysis: force ? null : status2['replication']['sourceAnalysis'] || null,
        isActive: () => isProjectTaskLive(projectId),
        onProgress: (message) => {
          if (!isProjectTaskLive(projectId)) return;
          ((status2['replication']['message'] = message),
            updateBackgroundTask(projectId, id, { message: message }, { refreshHome: ![] }),
            run(projectId, episodeId3));
        },
        onSourceAnalysis: async (payload) => {
          if (!isProjectTaskLive(projectId) || force) return;
          ((status2['replication']['sourceAnalysis'] = payload),
            syncProjectEntry(projectId),
            schedulePersistence({ immediate: !![] }));
        },
      });
      if (!isProjectTaskLive(projectId)) return ![];
      if (sourceAnalysis['sourceAnalysis']) {
        const episode = {
          ...status2,
          replication: { ...status2['replication'], sourceAnalysis: sourceAnalysis['sourceAnalysis'] },
        };
        await collectStoryReplicationRepresentativeFrames({
          episode: episode,
          projectId: projectId['projectId'],
          isActive: () => isProjectTaskLive(projectId),
          onProgress: (handle) => {
            ((status2['replication']['message'] = handle), run(projectId, episodeId3));
          },
        });
      }
      if (!isProjectTaskLive(projectId)) return ![];
      if (force && !sourceAnalysis['sourceAnalysis']) throw new Error('未返回原片分析，已保留现有内容。');
      applyStoryVideoReplicationAnalysis(status2, sourceAnalysis);
      if (speechEvidence) status2['replication']['speechEvidence'] = speechEvidence;
      finishAnalysisAttempt(status2, entry);
      if (force) {
        invalidateStoryVideoReplicationAssetLocalization(projectId['data']);
        if (status2['clips']?.['length']) status2['replication']['promptsStale'] = !![];
        else {
          const config = projectId['data']['project']['replication']['characterBindings'] || {};
          for (const scope of Object['keys'](config))
            if (scope['startsWith'](status2['id'] + ':')) delete config[scope];
        }
      }
      return (
        (status2['replication']['message'] = ''),
        syncStoryVideoReplicationProject(projectId['data']),
        finishBackgroundTask(
          projectId,
          id,
          { status: 'succeeded', message: '第\x20' + status2['number'] + ' 集视频解析完成' },
          { refreshHome: ![] },
        ),
        syncProjectEntry(projectId),
        schedulePersistence({ immediate: !![] }),
        run(projectId, episodeId3),
        !![]
      );
    } catch (error) {
      if (!isProjectTaskLive(projectId)) return ![];
      if (response)
        ((status2['replication'] = {
          ...response['replication'],
          error: '重新分析失败，已保留原人物记录：' + (error?.['message'] || '请重试'),
        }),
          (status2['status'] = response['status']));
      else failStoryVideoReplicationEpisode(status2, error?.['message']);
      return (
        finishAnalysisAttempt(status2, entry, error),
        syncStoryVideoReplicationProject(projectId['data']),
        finishBackgroundTask(
          projectId,
          id,
          {
            status: 'failed',
            message: '第\x20' + status2['number'] + '\x20集视频解析失败',
            error: error?.['message'] || '视频解析失败。',
          },
          { refreshHome: ![] },
        ),
        syncProjectEntry(projectId),
        schedulePersistence({ immediate: !![] }),
        run(projectId, episodeId3),
        ![]
      );
    }
  }
  async function runAnalysis(input, args3 = []) {
    const text2 = normalizeText(input?.['projectId']),
      output = analysisPromises['get'](text2);
    if (output) return output;
    const list = Array['isArray'](args3) ? [...args3] : [],
      value2 = (async () => {
        let enabled5 = 0x0;
        for (const value3 of list) {
          if (!isProjectTaskLive(input)) break;
          if (!(await analyzeEpisode(input, value3['file'], value3['episodeId'], value3))) enabled5 += 0x1;
        }
        if (!isProjectTaskLive(input)) return ![];
        const storyVideoReplicationSummary = getStoryVideoReplicationSummary(input['data']);
        if (
          !enabled5 &&
          !storyVideoReplicationSummary['active'] &&
          !storyVideoReplicationSummary['failed'] &&
          storyVideoReplicationSummary['completed'] === storyVideoReplicationSummary['total']
        )
          notifyTextTaskComplete(
            '视频解析完成，共\x20' + storyVideoReplicationSummary['completed'] + ' 条。',
            input,
            { step: 0x1 },
            { notificationMessage: '复刻视频解析完成。' },
          );
        else
          (storyVideoReplicationSummary['failed'] || enabled5) &&
            showNavigableTaskResultToast(
              '视频解析已完成 ' +
                storyVideoReplicationSummary['completed'] +
                '/' +
                storyVideoReplicationSummary['total'] +
                ' 条，' +
                Math['max'](storyVideoReplicationSummary['failed'], enabled5) +
                ' 条请求失败。',
              'warn',
              input,
              { step: 0x1 },
            );
        return (
          storyVideoReplicationSummary['completed'] > 0x0 ||
          list['some'](
            (value4) =>
              value4['uploadOnly'] &&
              findStoryReplicationEpisode(input['data'], value4['episodeId'])?.['replication']?.['status'] ===
                'pending',
          )
        );
      })()['finally'](() => {
        analysisPromises['get'](text2) === value2 && analysisPromises['delete'](text2);
        if (isProjectTaskCurrent(input)) refreshFooter();
      });
    return (analysisPromises['set'](text2, value2), value2);
  }
  async function startFromHome() {
    if (state['isGeneratingStory']) return ![];
    if (resolveStoryVideoReplicationHomeTab(state, 'replication') !== 'replication') return ![];
    if (typeof analyzeSourceVideo !== 'function')
      return (showToast('视频理解 Agent 尚未初始化。', 'error'), ![]);
    const files = [...state['replicationSourceFiles']];
    if (!files['length']) return (showToast('请先上传至少一条视频。', 'warn'), ![]);
    const modelId2 = resolveStoryVideoInputTextModelId(state['models']['text']);
    if (!modelId2) return (showToast('当前没有支持视频输入的文本模型。', 'error'), ![]);
    const value5 = files['map']((value6) => validateStoryReplicationVideoSize(value6, modelId2))['find'](
      (response3) => !response3['ok'],
    );
    if (value5) return (showToast(value5['error'], 'warn'), ![]);
    (syncCurrentProjectEntry(), beginProjectSession(), (state['models']['text'] = modelId2));
    const storyWorkspaceModelChoice = getStoryWorkspaceModelChoice('text', modelId2);
    ((state['textProvider'] = storyWorkspaceModelChoice?.['provider'] || state['textProvider']),
      (state['textProviderProfileId'] = resolveStoryTextProviderProfileId(
        state['textProvider'],
        state['textProviderProfileId'],
      )));
    const projectId2 = 'story-' + Date['now']();
    ((state['data'] = createStoryVideoReplicationProjectData({
      projectId: projectId2,
      files: files,
      modelId: modelId2,
      provider: state['textProvider'],
      providerProfileId: state['textProviderProfileId'],
      targetLocale: state['replicationTargetLocale'],
      asrProvider: state['replicationAsrProvider'] || 'volcengine-speech',
      promptMode: state['data']['project']?.['planning']?.['promptMode'],
      aspectRatio: state['data']['project']?.['aspectRatio'] || '9:16',
    })),
      (state['projectTitleEdited'] = ![]),
      (state['hasCreatedProject'] = !![]),
      (state['assetSelectionMode'] = ![]),
      (state['selectedAssetIds'] = []),
      (state['selectedEpisodeId'] = state['data']['episodes'][0x0]?.['id'] || ''),
      (state['selectedClipId'] = ''),
      releaseSourcePreviewUrls(),
      (state['replicationSourceFiles'] = []),
      openProject({ resetStep: !![] }),
      syncCurrentProjectEntry(),
      schedulePersistence({ immediate: !![] }));
    const value7 = createProjectToken(),
      list2 = files['map']((file2, value8) => ({
        file: file2,
        episodeId: state['data']['episodes'][value8]?.['id'],
        uploadOnly: !![],
      }))['filter']((value9) => value9['file'] && value9['episodeId']);
    return (
      list2['forEach']((value10) => {
        sourceFileByEpisodeKey['set'](projectId2 + ':' + value10['episodeId'], value10['file']);
      }),
      runAnalysis(value7, list2)
    );
  }
  async function retryFailedAnalysis() {
    if (state['data']?.['project']?.['sourceMode'] !== 'video-replication') return ![];
    const value11 = createProjectToken(),
      text3 = normalizeText(value11['projectId']);
    if (analysisPromises['has'](text3)) return ![];
    const list3 = state['data']['episodes']
      ['filter']((value12) => value12?.['replication']?.['status'] === 'failed')
      ['map']((episodeId4) => ({
        episodeId: episodeId4['id'],
        file: sourceFileByEpisodeKey['get'](text3 + ':' + episodeId4['id']) || null,
      }));
    if (!list3['length']) return ![];
    return runAnalysis(value11, list3);
  }
  async function analyzeSelected({ all: all = ![], episodeId: episodeId = '' } = {}) {
    if (state['data']?.['project']?.['sourceMode'] !== 'video-replication') return ![];
    const value13 = createProjectToken();
    if (analysisPromises['has'](value13['projectId'])) return ![];
    const list4 = value13['data']['episodes']
      ['filter'](
        (value14) =>
          ['pending', 'failed']['includes'](value14['replication']?.['status']) &&
          (episodeId ? value14['id'] === episodeId : all || value14['replication']['selectedForAnalysis']),
      )
      ['map']((episodeId5) => ({
        episodeId: episodeId5['id'],
        file: sourceFileByEpisodeKey['get'](value13['projectId'] + ':' + episodeId5['id']) || null,
      }));
    if (!list4['length']) return (showToast('请先选择待分析的视频。', 'warn'), ![]);
    for (const value15 of list4) {
      const storyReplicationEpisode2 = findStoryReplicationEpisode(value13['data'], value15['episodeId']);
      ((storyReplicationEpisode2['replication']['status'] = 'queued'),
        refreshEpisode(storyReplicationEpisode2['id']));
    }
    return (refreshFooter(), runAnalysis(value13, list4));
  }
  return {
    reanalyzeEpisode: (episodeId6) => {
      const value16 = createProjectToken(),
        storyReplicationEpisode3 = findStoryReplicationEpisode(value16['data'], episodeId6);
      if (!storyReplicationEpisode3?.['replication']['sourceAnalysis']) return ![];
      if (analysisPromises['has'](value16['projectId']))
        return (showToast('已有视频正在分析，请等待完成后再重新识别。', 'warn'), ![]);
      return runAnalysis(value16, [{ episodeId: episodeId6, force: !![] }]);
    },
    analyzeEpisode: analyzeEpisode,
    analyzeSelected: analyzeSelected,
    createSourcePreviewUrl: createSourcePreviewUrl,
    refreshEpisode: refreshEpisode,
    refreshFooter: refreshFooter,
    releaseSourcePreviewUrls: releaseSourcePreviewUrls,
    retryFailedAnalysis: retryFailedAnalysis,
    revokeSourcePreviewUrl: revokeSourcePreviewUrl,
    runAnalysis: runAnalysis,
    startFromHome: startFromHome,
  };
}
