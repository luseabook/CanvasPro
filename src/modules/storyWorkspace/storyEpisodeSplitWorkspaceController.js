import {
  buildStoryBackgroundTaskId,
  getStoryBackgroundTasks,
  isStoryBackgroundTaskActive,
} from './storyBackgroundTasks.js';
import {
  cancelStoryEpisodeSplitBatch,
  finalizeStoryEpisodeSplitBatch,
  resetStoryEpisodeSplitBatchState,
  runStoryEpisodeSplitBatchQueue,
} from './storyEpisodeSplitBatchExecution.js';
import { createStoryEpisodeSplitRunRecorder } from './storyEpisodeSplitRun.js';
import { createStoryEpisodeScriptGuard } from './storyScriptRevision.js';
import { getStoryEpisodeSplitDeliveryMessage } from './storyClipQualityPresentation.js';
import {
  prepareStoryReplicationGenerationEpisode,
  assertStoryReplicationGenerationCurrent,
} from './storyReplicationGenerationPreparation.js';
import { runStoryEpisodeSplitQualityReview } from './storyEpisodeSplitQualityApplication.js';
import { applyReplicationSegmentPlan } from '../../domain/storyGeneration/videoReplicationSegmentPlan.js';
import { applyReplicationAsrDelivery } from '../../domain/storyGeneration/videoReplicationAsrDelivery.js';
import { buildVideoReplicationGenerationAssets } from '../../domain/storyGeneration/videoReplicationGenerationAssets.js';
import { mergeStoryEpisodeSplit } from './storyPlanningData.js';
import {
  getStoryEpisodeBatchControlState,
  getStoryEpisodeBatchTargets,
  setStoryEpisodeSplitRunning,
} from './storyPlanningTaskState.js';
import { normalizeStoryPromptMode, resolveStoryPromptModeDefaultVideoModelId } from './storyPromptModes.js';
import { createStoryTaskBatchCancellationRegistry } from './storyTaskBatchCancellation.js';
import {
  initializeStoryEpisodeVideoGenerationDurations,
  resolveStoryVideoClipDurationConstraints,
} from './storyVideoGenerationSettings.js';
import { resolveStoryWorkspaceModelId } from './storyWorkspaceModelCatalog.js';
import { createStoryEpisodeSplitDeveloperDiagnostics } from './storyWorkspaceDeveloperDiagnostics.js';
import {
  getStoryEpisodeSplitPaidRetryChoice,
  isStoryEpisodeExperimentalSplitAvailable,
  shouldUseStoryEpisodeExperimentalSplit,
  resolveStoryEpisodeExperimentalErrorMessage,
} from './storyEpisodeSplitPresentationPolicy.js';
export {
  isStoryEpisodeExperimentalSplitAvailable,
  shouldUseStoryEpisodeExperimentalSplit,
  resolveStoryEpisodeExperimentalErrorMessage,
} from './storyEpisodeSplitPresentationPolicy.js';
function normalizeText(_0x34fda1) {
  return String(_0x34fda1 ?? '')['trim']();
}
function cloneData(_0x4bfac4) {
  return JSON['parse'](JSON['stringify'](_0x4bfac4));
}
function requireFunctions(_0x607790, _0xeceb11) {
  for (const [_0x550a9e, _0x231ef4] of Object['entries'](_0xeceb11)) {
    if (typeof _0x231ef4 !== 'function') throw new TypeError(_0x607790 + ' requires ' + _0x550a9e + '.');
  }
}
export function createStoryEpisodeSplitWorkspaceController({
  state: _0x373e5d,
  windowObject: windowObject = globalThis['window'] || globalThis,
  operations: operations = {},
  projectTasks: projectTasks = {},
  persistence: persistence = {},
  presentation: presentation = {},
  getPlanningContext: _0x4af71b,
} = {}) {
  if (!_0x373e5d || typeof _0x373e5d !== 'object')
    throw new TypeError('Story episode split requires workspace state.');
  (requireFunctions('Story episode split project tasks', {
    createProjectToken: projectTasks['createProjectToken'],
    createTaskBatch: projectTasks['createTaskBatch'],
    finishBackgroundTask: projectTasks['finishBackgroundTask'],
    isCurrent: projectTasks['isCurrent'],
    isLive: projectTasks['isLive'],
    startBackgroundTask: projectTasks['startBackgroundTask'],
    syncProjectEntry: projectTasks['syncProjectEntry'],
    syncTaskBatch: projectTasks['syncTaskBatch'],
    updateBackgroundTask: projectTasks['updateBackgroundTask'],
    updateBackgroundTaskBatch: projectTasks['updateBackgroundTaskBatch'],
  }),
    requireFunctions('Story episode split persistence', {
      isDurableRequired: persistence['isDurableRequired'],
      persistNow: persistence['persistNow'],
      schedule: persistence['schedule'],
    }),
    requireFunctions('Story\x20episode\x20split\x20presentation', {
      getGenerationControl: presentation['getGenerationControl'],
      notifyComplete: presentation['notifyComplete'],
      notifyGenerationResult: presentation['notifyGenerationResult'],
      openEpisode: presentation['openEpisode'],
      render: presentation['render'],
      requestChoice: presentation['requestChoice'],
      showTaskResult: presentation['showTaskResult'],
      showToast: presentation['showToast'],
    }));
  if (typeof _0x4af71b !== 'function')
    throw new TypeError('Story\x20episode\x20split\x20requires\x20getPlanningContext.');
  const _0x15b623 = createStoryTaskBatchCancellationRegistry();
  function _0x911fd7() {
    return projectTasks['createProjectToken'](_0x373e5d);
  }
  function _0x2bb61d(_0x13df79, _0x2da14b, _0x241cd7, _0x5e956e = {}) {
    const _0x32abb6 = normalizeStoryPromptMode(
        _0x5e956e['promptMode'] || _0x241cd7?.['data']?.['project']?.['planning']?.['promptMode'],
        { allowDeveloperModes: !![] },
      ),
      _0x4c76ae = resolveStoryPromptModeDefaultVideoModelId(_0x32abb6),
      _0x2a2ca8 = resolveStoryWorkspaceModelId(
        'video',
        _0x4c76ae || _0x241cd7?.['modelSettings']?.['models']?.['video'] || _0x373e5d['models']['video'],
      ),
      _0x3e40dd = mergeStoryEpisodeSplit(_0x13df79, _0x2da14b, {
        ..._0x5e956e,
        promptMode: _0x32abb6,
        videoModelId: _0x2a2ca8,
        sourceMode: _0x241cd7?.['data']?.['project']?.['sourceMode'],
        includeDialogueVoiceGuidance:
          _0x241cd7?.['data']?.['project']?.['sourceMode'] === 'video-replication',
      });
    return (initializeStoryEpisodeVideoGenerationDurations(_0x3e40dd, _0x2a2ca8), _0x3e40dd);
  }
  function _0x40eb98({
    episode: _0x58e88e,
    projectToken: _0x1ac36c,
    backgroundTaskId: _0xf89a5d,
    context: _0x2abfa1,
    mode: _0x5af08b,
    promptExperiment: promptExperiment = ![],
  }) {
    const _0x508493 = getStoryBackgroundTasks(_0x1ac36c['data'])['find'](
      (_0x52b5fe) => _0x52b5fe['id'] === _0xf89a5d,
    );
    return createStoryEpisodeSplitRunRecorder({
      project: _0x2abfa1['project'],
      episode: _0x58e88e,
      assets: _0x1ac36c['data']['assets'],
      constraints: _0x2abfa1['project']['planning'],
      execution: {
        modelId: _0x2abfa1['model'],
        provider: _0x2abfa1['provider'],
        providerProfileId: _0x2abfa1['providerProfileId'],
      },
      mode: _0x5af08b,
      promptExperiment: promptExperiment,
      resumePayload: _0x508493?.['resumePayload'],
      onChange: async (_0x20e43f) => {
        (projectTasks['updateBackgroundTask'](_0x1ac36c, _0xf89a5d, {
          resumable: !![],
          modelId: _0x20e43f['input']['execution']['modelId'],
          provider: _0x20e43f['input']['execution']['provider'],
          resumePayload: { kind: _0x20e43f['kind'], run: _0x20e43f },
        }),
          projectTasks['syncProjectEntry'](_0x1ac36c));
        const _0x5da9cb = await persistence['persistNow']();
        if (persistence['isDurableRequired']() && !_0x5da9cb)
          throw new Error('分镜运行记录保存失败，已停止模型请求。');
      },
    });
  }
  async function _0x58e0af(_0xe6a1c8, _0x2b6dac) {
    if (!_0xe6a1c8['requiresPaidRetry']) return !![];
    const _0x58cf4e = await presentation['requestChoice'](getStoryEpisodeSplitPaidRetryChoice(_0x2b6dac));
    if (_0x58cf4e !== 'retry') return ![];
    return (await _0xe6a1c8['authorizePaidRetry'](), !![]);
  }
  function _0x219614({
    episode: _0x3ac940,
    projectToken: _0x253d51,
    context: _0x35eabd,
    splitRun: _0x2fe8f3,
    repairDraft: _0x187e0e,
    onProgress: _0x206882,
  }) {
    return {
      project: _0x35eabd['project'],
      episode: _0x3ac940,
      assets: buildVideoReplicationGenerationAssets(_0x253d51['data']['assets'], _0x35eabd['project']),
      constraints: _0x35eabd['project']['planning'],
      clipDurationConstraints: resolveStoryVideoClipDurationConstraints(
        resolveStoryWorkspaceModelId(
          'video',
          _0x253d51['modelSettings']?.['models']?.['video'] || _0x373e5d['models']['video'],
        ),
      ),
      model: _0x2fe8f3['execution']['modelId'],
      provider: _0x2fe8f3['execution']['provider'],
      providerProfileId: _0x2fe8f3['execution']['providerProfileId'],
      repairDraft: _0x187e0e,
      onInvocation: _0x2fe8f3['onInvocation'],
      diagnostics: createStoryEpisodeSplitDeveloperDiagnostics(windowObject),
      onProgress: _0x206882,
    };
  }
  function _0x4026ae({
    episode: _0x468227,
    projectToken: _0x133269,
    context: _0x4f00e8,
    splitRun: _0x120c16,
    promptExperiment: _0x137d9b,
    onProgress: _0x4a32e8,
  }) {
    const _0x38c5d6 = _0x133269['data'],
      _0x205602 = _0x38c5d6['episodes']['findIndex']((_0x1943d0) => _0x1943d0['id'] === _0x468227['id']),
      _0x5ee7b8 = _0x120c16['checkpoint'] || _0x468227?.['experimentalSplitDraft'];
    return {
      project: _0x4f00e8['project'],
      episode: _0x468227,
      previousEpisode: _0x205602 > 0x0 ? _0x38c5d6['episodes'][_0x205602 - 0x1] : null,
      nextEpisode: _0x205602 >= 0x0 ? _0x38c5d6['episodes'][_0x205602 + 0x1] || null : null,
      assets: buildVideoReplicationGenerationAssets(_0x38c5d6['assets'], _0x4f00e8['project']),
      constraints: _0x4f00e8['project']['planning'],
      model: _0x120c16['execution']['modelId'],
      provider: _0x120c16['execution']['provider'],
      providerProfileId: _0x120c16['execution']['providerProfileId'],
      promptExperiment: _0x137d9b === !![],
      resumeDraft: _0x5ee7b8?.['status'] === 'completed' ? null : _0x5ee7b8 || null,
      onInvocation: _0x120c16['onInvocation'],
      diagnostics: createStoryEpisodeSplitDeveloperDiagnostics(windowObject),
      onCheckpoint: async (_0x3ee881) => {
        if (!projectTasks['isLive'](_0x133269)) return;
        const _0x538c00 = _0x38c5d6['episodes']['findIndex'](
          (_0x2e8383) => _0x2e8383['id'] === _0x468227['id'],
        );
        if (_0x538c00 < 0x0) return;
        ((_0x38c5d6['episodes'][_0x538c00] = {
          ..._0x38c5d6['episodes'][_0x538c00],
          experimentalSplitDraft: cloneData(_0x3ee881),
        }),
          await _0x120c16['saveCheckpoint'](_0x3ee881));
      },
      onProgress: _0x4a32e8,
    };
  }
  async function _0x43ca56(
    _0x26e906,
    _0xf5c9cb,
    {
      batch: batch = null,
      experimental: experimental = ![],
      experimentalLabel: experimentalLabel = ![],
      promptExperiment: promptExperiment = ![],
      repairDraft: repairDraft = null,
    } = {},
  ) {
    if (!projectTasks['isLive'](_0xf5c9cb)) return null;
    const _0x219747 = _0xf5c9cb['data'],
      _0x43ebc1 = _0x4af71b(_0x219747, _0xf5c9cb),
      _0x34d7af = createStoryEpisodeScriptGuard(() => _0xf5c9cb['data'], _0x26e906);
    _0x26e906 = _0x34d7af['episode'];
    const _0x41db9b = experimental ? 'episode-split-experimental' : 'episode-split',
      _0x523fa1 = buildStoryBackgroundTaskId(_0x41db9b, { episodeId: _0x26e906['id'] }),
      _0x5b19e6 = _0x40eb98({
        episode: _0x26e906,
        projectToken: _0xf5c9cb,
        backgroundTaskId: _0x523fa1,
        context: _0x43ebc1,
        mode: experimental ? 'experimental' : 'standard',
        promptExperiment: promptExperiment,
      });
    if (!(await _0x58e0af(_0x5b19e6, _0x26e906))) return null;
    projectTasks['startBackgroundTask'](_0xf5c9cb, {
      id: _0x523fa1,
      modelId: _0x5b19e6['execution']['modelId'],
      provider: _0x5b19e6['execution']['provider'],
      providerProfileId: _0x5b19e6['execution']['providerProfileId'],
      type: _0x41db9b,
      scope: { episodeId: _0x26e906['id'] },
      label: experimentalLabel
        ? '实验分批拆分第 ' + (_0x26e906['number'] || '') + '\x20集'
        : '拆分第 ' + (_0x26e906['number'] || '') + ' 集分镜',
      message: experimental ? '正在规划整集分镜蓝图' : '正在生成分镜脚本',
      batch: batch,
      resumable: !![],
      resumePayload: _0x5b19e6['payload'](),
    });
    const _0x580bc9 = ({ message: _0x33bd79 } = {}) => {
      if (!projectTasks['isLive'](_0xf5c9cb)) return;
      projectTasks['updateBackgroundTask'](_0xf5c9cb, _0x523fa1, {
        status: 'running',
        message: normalizeText(_0x33bd79) || '正在生成分镜脚本',
      });
    };
    let _0x47ed02 = null,
      _0x3455f1;
    try {
      await _0x5b19e6['start']();
      const _0x13201e = await prepareStoryReplicationGenerationEpisode({
        episode: _0x26e906,
        projectData: _0x219747,
        onProgress: _0x580bc9,
        isActive: () => projectTasks['isLive'](_0xf5c9cb),
      });
      _0x3455f1 = _0x13201e['replication']?.['generationInputKey'];
      if (_0x5b19e6['candidateArtifact']) _0x47ed02 = _0x5b19e6['candidateArtifact'];
      else {
        if (_0x5b19e6['generatedCandidate']) _0x47ed02 = _0x5b19e6['generatedCandidate'];
        else
          experimental
            ? (_0x47ed02 = await operations['splitExperimental'](
                _0x4026ae({
                  episode: _0x13201e,
                  projectToken: _0xf5c9cb,
                  context: _0x43ebc1,
                  splitRun: _0x5b19e6,
                  promptExperiment: promptExperiment,
                  onProgress: _0x580bc9,
                }),
              ))
            : (_0x47ed02 = await operations['splitStandard'](
                _0x219614({
                  episode: _0x13201e,
                  projectToken: _0xf5c9cb,
                  context: _0x43ebc1,
                  splitRun: _0x5b19e6,
                  repairDraft: repairDraft,
                  onProgress: _0x580bc9,
                }),
              ));
      }
      (assertStoryReplicationGenerationCurrent(_0x219747, _0x13201e), _0x34d7af['assertCurrent']());
      if (!_0x5b19e6['candidateArtifact'] && !_0x5b19e6['generatedCandidate'])
        await _0x5b19e6['saveGeneratedCandidate'](_0x47ed02);
      ((_0x47ed02 = applyReplicationSegmentPlan(_0x47ed02, _0x13201e)),
        (_0x47ed02 = applyReplicationAsrDelivery(
          _0x47ed02,
          _0x13201e,
          _0x219747['project'],
          _0x219747['assets'],
        )),
        (_0x47ed02 = await runStoryEpisodeSplitQualityReview({
          reviewEpisodeSplit: operations['review'],
          result: _0x47ed02,
          episode: _0x13201e,
          context: _0x43ebc1,
          projectData: _0x219747,
          splitRun: _0x5b19e6,
          onProgress: _0x580bc9,
        })),
        (_0x47ed02 = applyReplicationSegmentPlan(_0x47ed02, _0x13201e)),
        (_0x47ed02 = applyReplicationAsrDelivery(
          _0x47ed02,
          _0x13201e,
          _0x219747['project'],
          _0x219747['assets'],
        )));
      if (!_0x5b19e6['candidateArtifact']) await _0x5b19e6['ready'](_0x47ed02);
      (assertStoryReplicationGenerationCurrent(_0x219747, _0x13201e), _0x34d7af['assertCurrent']());
    } catch (_0x121648) {
      await _0x5b19e6['failed'](_0x121648)['catch'](() => {});
      if (projectTasks['isLive'](_0xf5c9cb)) {
        if (_0x34d7af['isCurrent']() && experimental && _0x121648?.['experimentalDraft']) {
          const _0x23780c = _0x219747['episodes']['findIndex'](
            (_0x35431c) => _0x35431c['id'] === _0x26e906['id'],
          );
          _0x23780c >= 0x0 &&
            ((_0x219747['episodes'][_0x23780c] = {
              ..._0x219747['episodes'][_0x23780c],
              experimentalSplitDraft: cloneData(_0x121648['experimentalDraft']),
            }),
            projectTasks['syncProjectEntry'](_0xf5c9cb),
            persistence['schedule']({ immediate: !![] }));
        } else {
          if (_0x34d7af['isCurrent']() && !experimental && _0x121648?.['partialResult']) {
            const _0x58bd51 = _0x219747['episodes']['findIndex'](
              (_0x55f0fe) => _0x55f0fe['id'] === _0x26e906['id'],
            );
            _0x58bd51 >= 0x0 &&
              ((_0x219747['episodes'][_0x58bd51] = {
                ..._0x219747['episodes'][_0x58bd51],
                splitDraft: _0x121648['partialResult'],
              }),
              persistence['schedule']({ immediate: !![] }));
          }
        }
        const _0x3735b1 = experimental
          ? resolveStoryEpisodeExperimentalErrorMessage(_0x121648, {
              retryActionLabel: experimentalLabel ? '开发测试' : '生成分镜脚本',
            })
          : _0x121648?.['message'] || '分集拆分失败。';
        projectTasks['finishBackgroundTask'](_0xf5c9cb, _0x523fa1, {
          status: 'failed',
          message: experimentalLabel
            ? '第\x20' + (_0x26e906['number'] || '') + ' 集实验分批拆分失败'
            : _0x121648?.['partialResult']
              ? '第\x20' + (_0x26e906['number'] || '') + '\x20集本次返回未完全通过，已保存原始结果'
              : '第\x20' + (_0x26e906['number'] || '') + ' 集分镜拆分失败',
          error: _0x3735b1,
          resumable: !![],
          resumePayload: _0x5b19e6['payload'](),
        });
      }
      throw _0x121648;
    }
    if (!projectTasks['isLive'](_0xf5c9cb)) return null;
    const _0x1ba485 = _0x2bb61d(_0x26e906, _0x47ed02, _0xf5c9cb, {
      assets: _0x219747['assets'],
      preserveMedia: !![],
      visualStyle: _0x43ebc1['visualStyle'],
      promptMode: _0x43ebc1['project']['planning']?.['promptMode'],
      ...(experimental ? { includeContinuityHandoffs: !![] } : {}),
    });
    (delete _0x1ba485['splitDraft'],
      delete _0x1ba485['experimentalSplitDraft'],
      (_0x1ba485['splitQualityReview'] = _0x47ed02['qualityReview']));
    if (_0x26e906['replication']?.['sourceAnalysis'])
      _0x1ba485['replication'] = {
        ..._0x1ba485['replication'],
        promptInputKey: _0x3455f1,
        promptsStale: ![],
      };
    const _0x560cd8 = _0x219747['episodes']['findIndex']((_0x284592) => _0x284592['id'] === _0x26e906['id']);
    if (_0x560cd8 >= 0x0) _0x219747['episodes'][_0x560cd8] = _0x1ba485;
    return (
      await _0x5b19e6['succeeded'](),
      projectTasks['finishBackgroundTask'](_0xf5c9cb, _0x523fa1, {
        status: 'succeeded',
        message: getStoryEpisodeSplitDeliveryMessage(_0x1ba485),
        resumable: ![],
        resumePayload: _0x5b19e6['payload'](),
      }),
      _0x1ba485
    );
  }
  function _0xf46fd1(_0x31ef7b) {
    if (typeof operations['recoverDraft'] !== 'function')
      return (presentation['showToast']('分镜本地恢复能力尚未初始化。', 'error'), ![]);
    const _0x42d2bd = _0x911fd7(),
      _0x3d387d = _0x42d2bd['data'],
      _0x15096e = _0x3d387d['episodes']['findIndex']((_0x4ef36a) => _0x4ef36a['id'] === _0x31ef7b);
    if (_0x15096e < 0x0) return ![];
    const _0x121175 = _0x3d387d['episodes'][_0x15096e];
    if (!_0x121175?.['splitDraft'])
      return (presentation['showToast']('当前分集没有已保存的返回可供恢复。', 'info'), ![]);
    try {
      const _0x1382ad = _0x4af71b(_0x3d387d, _0x42d2bd),
        _0x194f07 = operations['recoverDraft']({
          project: _0x1382ad['project'],
          episode: _0x121175,
          assets: _0x3d387d['assets'],
          constraints: _0x1382ad['project']['planning'],
          draft: _0x121175['splitDraft'],
        }),
        _0x2f5a62 = _0x2bb61d(_0x121175, _0x194f07, _0x42d2bd, {
          assets: _0x3d387d['assets'],
          preserveMedia: !![],
          visualStyle: _0x1382ad['visualStyle'],
          promptMode: _0x1382ad['project']['planning']?.['promptMode'],
        });
      return (
        delete _0x2f5a62['splitDraft'],
        delete _0x2f5a62['experimentalSplitDraft'],
        (_0x3d387d['episodes'][_0x15096e] = _0x2f5a62),
        persistence['schedule']({ immediate: !![] }),
        presentation['render'](),
        presentation['showToast'](
          '第\x20' +
            (_0x2f5a62['number'] || '') +
            '\x20集已在本地恢复为\x20' +
            _0x2f5a62['clips']['length'] +
            ' 个片段；未调用模型。',
          'success',
        ),
        !![]
      );
    } catch (_0x4a7320) {
      return (
        presentation['showTaskResult'](
          (normalizeText(_0x4a7320?.['message']) || '已保存结果仍无法在本地恢复。') + '（未调用模型。）',
          'error',
          _0x4a7320,
        ),
        ![]
      );
    }
  }
  async function _0x1fece1(
    _0xc1dab6,
    {
      explicitExperimental: explicitExperimental = ![],
      openAfter: openAfter = ![],
      repairDraft: repairDraft = ![],
    } = {},
  ) {
    if (explicitExperimental && !isStoryEpisodeExperimentalSplitAvailable(windowObject)) return ![];
    const _0x3474a7 = presentation['getGenerationControl'](_0xc1dab6);
    if (_0x3474a7['disabled']) return ![];
    const _0x2e5e63 = explicitExperimental || shouldUseStoryEpisodeExperimentalSplit(_0x373e5d),
      _0x2c3e7e = _0x2e5e63 ? operations['splitExperimental'] : operations['splitStandard'];
    if (typeof _0x2c3e7e !== 'function')
      return (
        presentation['showToast'](
          explicitExperimental ? '实验分批拆分 Agent 尚未初始化。' : '分镜拆分 Agent 尚未初始化。',
          'error',
        ),
        ![]
      );
    const _0x100519 = _0x373e5d['data']['episodes']['find']((_0xf25252) => _0xf25252['id'] === _0xc1dab6);
    if (!_0x100519) return ![];
    setStoryEpisodeSplitRunning(_0x373e5d, _0x100519['id'], !![]);
    const _0x505f12 = _0x911fd7();
    presentation['render']();
    try {
      const _0x20fd25 = await _0x43ca56(_0x100519, _0x505f12, {
        experimental: _0x2e5e63,
        experimentalLabel: explicitExperimental,
        promptExperiment: explicitExperimental,
        repairDraft: repairDraft === !![] ? _0x100519['splitDraft'] : null,
      });
      if (!_0x20fd25 || !projectTasks['isLive'](_0x505f12)) return ![];
      return (
        persistence['schedule']({ immediate: !![] }),
        explicitExperimental
          ? presentation['notifyComplete'](
              '第\x20' +
                _0x20fd25['number'] +
                ' 集实验分批拆分：' +
                getStoryEpisodeSplitDeliveryMessage(_0x20fd25),
              _0x505f12,
              { episodeId: _0x20fd25['id'], clipId: _0x20fd25['clips'][0x0]?.['id'] },
              {
                notificationMessage:
                  '第\x20' + _0x20fd25['number'] + ' 集：' + getStoryEpisodeSplitDeliveryMessage(_0x20fd25),
              },
            )
          : presentation['notifyComplete'](
              '第\x20' + _0x20fd25['number'] + ' 集：' + getStoryEpisodeSplitDeliveryMessage(_0x20fd25),
              _0x505f12,
              { episodeId: _0x20fd25['id'], clipId: _0x20fd25['clips'][0x0]?.['id'] },
              {
                notificationMessage:
                  '第\x20' + _0x20fd25['number'] + ' 集：' + getStoryEpisodeSplitDeliveryMessage(_0x20fd25),
              },
            ),
        openAfter &&
          projectTasks['isCurrent'](_0x505f12) &&
          (setStoryEpisodeSplitRunning(_0x373e5d, _0x100519['id'], ![]),
          await presentation['openEpisode'](_0x20fd25['id'], _0x20fd25['clips'][0x0]?.['id'])),
        !![]
      );
    } catch (_0x3bb6f0) {
      if (!projectTasks['isLive'](_0x505f12)) return ![];
      return (
        presentation['showTaskResult'](
          _0x2e5e63
            ? resolveStoryEpisodeExperimentalErrorMessage(_0x3bb6f0, {
                retryActionLabel: explicitExperimental ? '开发测试' : '生成分镜脚本',
              })
            : _0x3bb6f0?.['message'] || '分集拆分失败。',
          'error',
          _0x3bb6f0,
        ),
        ![]
      );
    } finally {
      projectTasks['isCurrent'](_0x505f12) &&
        (setStoryEpisodeSplitRunning(_0x373e5d, _0x100519['id'], ![]), presentation['render']());
    }
  }
  async function _0x3873af({ selectionMode: selectionMode = ![], experimental: experimental = !![] } = {}) {
    if (getStoryEpisodeBatchControlState(_0x373e5d)['disabled']) return ![];
    if (
      (experimental && typeof operations['splitExperimental'] !== 'function') ||
      (!experimental && typeof operations['splitStandard'] !== 'function')
    )
      return (presentation['showToast']('分镜拆分 Agent 尚未初始化。', 'error'), ![]);
    const _0x47c87f = new Set(
        (Array['isArray'](_0x373e5d['splittingEpisodeIds']) ? _0x373e5d['splittingEpisodeIds'] : [])
          ['map']((_0x53890a) => normalizeText(_0x53890a))
          ['filter'](Boolean),
      ),
      _0x3e4676 = getStoryEpisodeBatchTargets(
        _0x373e5d['data']['episodes'],
        _0x373e5d['selectedEpisodeIds'],
        selectionMode,
      )['filter']((_0x62417f) => !_0x47c87f['has'](normalizeText(_0x62417f?.['id'])));
    if (!_0x3e4676['length']) return (presentation['showToast']('请先选择需要拆分的分集。', 'info'), ![]);
    const _0x1744da = selectionMode ? 'splitting-selected' : 'splitting-all',
      _0x44d600 = selectionMode ? '正在拆分选中分集' : '正在批量拆分',
      _0x1a3343 = _0x3e4676['map']((_0x6d5630) => normalizeText(_0x6d5630['id']))['filter'](Boolean);
    (_0x1a3343['forEach']((_0x50fb8f) => setStoryEpisodeSplitRunning(_0x373e5d, _0x50fb8f, !![])),
      (_0x373e5d['episodeBatchSplitOperation'] = _0x1744da),
      (_0x373e5d['episodeBatchSplitStatus'] = _0x44d600 + ' 1/' + _0x3e4676['length']),
      (_0x373e5d['episodeBatchSplitCancelRequested'] = ![]));
    const _0x2c6f39 = _0x911fd7(),
      _0x2f9056 = _0x2c6f39['data'],
      _0x55f8fc = projectTasks['createTaskBatch']('episode-splits', {
        operation: _0x1744da,
        total: _0x3e4676['length'],
        completed: 0x0,
        targetEpisodeIds: _0x1a3343,
        pendingEpisodeIds: _0x1a3343,
        cancelRequested: ![],
        label: _0x373e5d['episodeBatchSplitStatus'],
      });
    ((_0x373e5d['episodeBatchSplitId'] = _0x55f8fc['id']), presentation['render']());
    try {
      const _0x255c7e = await runStoryEpisodeSplitBatchQueue({
        targets: _0x3e4676,
        batchId: _0x55f8fc['id'],
        isLive: () => projectTasks['isLive'](_0x2c6f39),
        isCancellationRequested: _0x15b623['isRequested'],
        resolveTarget: (_0x4b323b) =>
          _0x2f9056['episodes']['find'](
            (_0x2e85f1) => normalizeText(_0x2e85f1?.['id']) === normalizeText(_0x4b323b?.['id']),
          ),
        createMissingTargetError: (_0x17e111) =>
          new Error('第\x20' + (_0x17e111?.['number'] || '') + ' 集不存在，无法拆分。'),
        runTarget: (_0x5d09b2) =>
          _0x43ca56(_0x5d09b2, _0x2c6f39, { batch: _0x55f8fc, experimental: experimental }),
        onTargetSettled: ({
          target: _0x375105,
          index: _0x43db2f,
          completed: _0x2d9bc1,
          pendingTargets: _0x34359b,
        }) => {
          const _0x39ca62 = normalizeText(_0x375105?.['id']),
            _0x12f437 = _0x44d600 + '\x20' + (_0x43db2f + 0x1) + '/' + _0x3e4676['length'];
          projectTasks['syncTaskBatch'](_0x2c6f39, _0x55f8fc, {
            completed: _0x2d9bc1,
            pendingEpisodeIds: _0x34359b['map']((_0x5c0d5e) => normalizeText(_0x5c0d5e?.['id']))['filter'](
              Boolean,
            ),
            label: _0x12f437,
          });
          if (projectTasks['isCurrent'](_0x2c6f39)) {
            if (_0x39ca62) setStoryEpisodeSplitRunning(_0x373e5d, _0x39ca62, ![]);
            ((_0x373e5d['episodeBatchSplitStatus'] = _0x12f437), presentation['render']());
          }
          persistence['schedule']();
        },
      });
      if (_0x255c7e['status'] === 'interrupted') return ![];
      return finalizeStoryEpisodeSplitBatch({
        result: {
          ..._0x255c7e,
          pendingTargets: _0x255c7e['pendingTargets']
            ['map']((_0x4f4c8d) => normalizeText(_0x4f4c8d?.['id']))
            ['filter'](Boolean),
        },
        batch: _0x55f8fc,
        projectToken: _0x2c6f39,
        experimental: experimental,
        selectionMode: selectionMode,
        syncBatch: (_0x2c6f42) => projectTasks['syncTaskBatch'](_0x2c6f39, _0x55f8fc, _0x2c6f42),
        persist: () => persistence['schedule']({ immediate: !![] }),
        showToast: presentation['showToast'],
        resolveErrorMessage: (_0x1d003d) =>
          experimental
            ? resolveStoryEpisodeExperimentalErrorMessage(_0x1d003d, { retryActionLabel: '批量拆分' })
            : normalizeText(_0x1d003d?.['message']) || '分镜拆分失败。',
        notifyFailure: (_0xa66a68, _0x237f85) =>
          presentation['notifyGenerationResult'](_0xa66a68, _0x2c6f39, { step: 0x3 }, _0x237f85),
        notifySuccess: (_0xb9a2e5, _0xece79b) =>
          presentation['notifyComplete'](_0xb9a2e5, _0x2c6f39, { step: 0x3 }, _0xece79b),
      });
    } finally {
      (_0x15b623['clear'](_0x55f8fc['id']),
        projectTasks['isCurrent'](_0x2c6f39) &&
          (_0x1a3343['forEach']((_0x4cf1a8) => setStoryEpisodeSplitRunning(_0x373e5d, _0x4cf1a8, ![])),
          resetStoryEpisodeSplitBatchState(_0x373e5d),
          presentation['render']()));
    }
  }
  function _0x86de70() {
    const _0x320506 = _0x911fd7();
    return cancelStoryEpisodeSplitBatch({
      state: _0x373e5d,
      tasks: getStoryBackgroundTasks(_0x373e5d['data']),
      isTaskActive: isStoryBackgroundTaskActive,
      requestCancellation: _0x15b623['request'],
      updateBatch: (_0xd10a89, _0x3a4121) =>
        projectTasks['updateBackgroundTaskBatch'](_0x320506, _0xd10a89, _0x3a4121),
      setEpisodeRunning: (_0x2b94ce, _0x479ac8) =>
        setStoryEpisodeSplitRunning(_0x373e5d, _0x2b94ce, _0x479ac8),
      showToast: presentation['showToast'],
      render: presentation['render'],
    });
  }
  return Object['freeze']({
    cancelBatch: _0x86de70,
    recoverDraft: _0xf46fd1,
    splitBatch: ({ selectionMode: selectionMode = ![] } = {}) =>
      _0x3873af({
        selectionMode: selectionMode,
        experimental: shouldUseStoryEpisodeExperimentalSplit(_0x373e5d),
      }),
    splitEpisode: (_0x54952a, _0x3d2bcb = {}) => _0x1fece1(_0x54952a, _0x3d2bcb),
    splitEpisodeExperimental: (_0x1ff7d6) => _0x1fece1(_0x1ff7d6, { explicitExperimental: !![] }),
  });
}
