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
function normalizeText(_0x2ff4b8) {
  return String(_0x2ff4b8 ?? '')['trim']();
}
function cloneData(_0x345738) {
  return JSON['parse'](JSON['stringify'](_0x345738));
}
export function getStoryAssetBreakdownEpisodes(_0x251190 = {}) {
  const _0x3eb44f =
    Array['isArray'](_0x251190['assetBreakdownEpisodes']) && _0x251190['assetBreakdownEpisodes']['length']
      ? _0x251190['assetBreakdownEpisodes']
      : _0x251190['data']?.['episodes'];
  return (Array['isArray'](_0x3eb44f) ? _0x3eb44f : [])['map']((_0x14a7a6, _0x1997f7) => ({
    id: normalizeText(_0x14a7a6?.['id']) || 'episode-' + (_0x1997f7 + 0x1),
    number: Math['max'](0x1, Math['trunc'](Number(_0x14a7a6?.['number']) || _0x1997f7 + 0x1)),
    synopsis: normalizeText(_0x14a7a6?.['synopsis'] || _0x14a7a6?.['script']?.['fullText']),
  }));
}
export function isStoryAssetExperimentalExtractionAvailable(_0x5cb7f = globalThis['window']) {
  return _0x5cb7f?.['DEV_MODE'] === !![];
}
export function shouldUseStoryAssetBatchedExtraction(
  _0x2cd7ac = {},
  {
    batchedAgentAvailable: batchedAgentAvailable = ![],
    forceSingleRequest: forceSingleRequest = ![],
    explicitExperimental: explicitExperimental = ![],
  } = {},
) {
  if (forceSingleRequest) return ![];
  if (!explicitExperimental) return ![];
  if (!batchedAgentAvailable) return ![];
  return Array['isArray'](_0x2cd7ac?.['episodes']);
}
export function shouldUseStoryAssetParallelExtraction({
  parallelAgentAvailable: parallelAgentAvailable = ![],
  forceSingleRequest: forceSingleRequest = ![],
  explicitExperimental: explicitExperimental = ![],
} = {}) {
  return parallelAgentAvailable && !forceSingleRequest && !explicitExperimental;
}
export function createStoryAssetExtractionWorkspaceController({
  state: _0x34e83e,
  windowObject: windowObject = globalThis['window'] || globalThis,
  extractAssets: extractAssets = null,
  extractAssetsParallel: extractAssetsParallel = null,
  extractAssetsExperimental: extractAssetsExperimental = null,
  host: host = {},
} = {}) {
  if (!_0x34e83e || typeof _0x34e83e !== 'object')
    throw new TypeError('Story asset extraction requires workspace state.');
  const {
    createStoryProjectTaskToken: _0x419aa4,
    finishStoryProjectBackgroundTask: _0x4934b4,
    goToStep: _0x1e6cf2,
    isProjectTaskCurrent: _0x516633,
    isProjectTaskLive: _0x1eb9eb,
    notifyNavigableTextTaskComplete: _0x22924d,
    persistWorkspaceNow: _0x23e4f4,
    refreshStoryAssetExtractionFooterInPlace: _0x2979c1,
    refreshStoryReplicationFooterInPlace: _0xa9cad2,
    registerStoryProjectData: _0x187178,
    render: _0x5d097e,
    reportStoryWorkspaceApiError: _0x4d271e,
    requestStoryWorkspaceChoice: _0x1c99bf,
    resetStoryDownstreamUiState: _0x288b41,
    scheduleWorkspacePersistence: _0x30fbb7,
    showTaskResultToast: _0x4994e9,
    showToast: _0x126c2b,
    startStoryProjectBackgroundTask: _0x203e56,
    syncCompiledEpisodeScripts: _0x5205cc,
    syncStoryPlanningLoading: _0x256669,
    syncStoryProjectTaskEntry: _0x44b8a1,
    updateStoryProjectBackgroundTask: _0x816d51,
  } = host;
  for (const [_0x493707, _0x345c33] of Object['entries']({
    createStoryProjectTaskToken: _0x419aa4,
    finishStoryProjectBackgroundTask: _0x4934b4,
    goToStep: _0x1e6cf2,
    isProjectTaskCurrent: _0x516633,
    isProjectTaskLive: _0x1eb9eb,
    notifyNavigableTextTaskComplete: _0x22924d,
    persistWorkspaceNow: _0x23e4f4,
    registerStoryProjectData: _0x187178,
    render: _0x5d097e,
    reportStoryWorkspaceApiError: _0x4d271e,
    requestStoryWorkspaceChoice: _0x1c99bf,
    resetStoryDownstreamUiState: _0x288b41,
    scheduleWorkspacePersistence: _0x30fbb7,
    showTaskResultToast: _0x4994e9,
    showToast: _0x126c2b,
    startStoryProjectBackgroundTask: _0x203e56,
    syncCompiledEpisodeScripts: _0x5205cc,
    syncStoryProjectTaskEntry: _0x44b8a1,
    updateStoryProjectBackgroundTask: _0x816d51,
  })) {
    if (typeof _0x345c33 !== 'function')
      throw new TypeError('Story asset extraction requires ' + _0x493707 + '.');
  }
  let _0x476ffd = null;
  const _0x145811 = new Set(),
    _0x1c6ae2 = createStoryAssetPaidRerunChoiceGate();
  function _0xee37e3({ title: _0x54e1a0, message: _0x4bd954 } = {}) {
    return _0x1c99bf({
      title: _0x54e1a0,
      message: _0x4bd954,
      fallbackValue: 'preserve',
      choices: [
        { label: '取消', value: null },
        { label: '保留已有媒体', value: 'preserve', autofocus: !![] },
        { label: '全部重建', value: 'rebuild', primary: !![] },
      ],
    });
  }
  function _0x389f15() {
    return _0x1c99bf({
      title: '仍有分集正文未完成',
      message:
        '当前仅按已完成的正文提取素材。补齐正文后需再次提取并核对素材关联，已有图片将保留。是否继续进入人设？',
      choices: [
        { label: '取消', value: null },
        { label: '继续拆解', value: 'continue', primary: !![], autofocus: !![] },
      ],
    });
  }
  async function _0x132238({
    confirmMissingImages: confirmMissingImages = _0x34e83e['data']?.['project']?.['sourceMode'] !==
      'video-replication',
  } = {}) {
    if (!confirmMissingImages) return _0x1e6cf2(0x3);
    const _0x29d2a1 = _0x34e83e['data'],
      _0x33eb41 = _0x34e83e['data']['episodes']['filter']((_0x2e1341) =>
        isStoryReplicationPromptStale(_0x34e83e['data'], _0x2e1341),
      );
    if (_0x33eb41['length']) {
      const _0x284e5b = _0x34e83e['data'],
        _0x4796ab = await _0x1c99bf({
          title: '替换设置已变更，分段提示词待更新',
          message:
            '有\x20' +
            _0x33eb41['length'] +
            ' 条视频仍使用修改前的分段提示词。已有视频结果保留，更新提示词将调用文本模型。',
          choices: [
            { label: '返回修改', value: null, autofocus: !![] },
            { label: '前往更新分段提示词', value: 'update', primary: !![] },
          ],
        });
      if (_0x4796ab !== 'update' || _0x34e83e['data'] !== _0x284e5b) return ![];
      return _0x1e6cf2(0x3);
    }
    const _0x2d5194 = confirmMissingImages ? getMissingStoryAssetImages(_0x34e83e['data']['assets']) : [];
    if (_0x2d5194['length']) {
      const _0x4401e0 = await _0x1c99bf({
        title: '部分素材图片尚未生成',
        message: buildMissingStoryAssetImageWarning(_0x2d5194),
        choices: [
          { label: '返回补图', value: null, autofocus: !![] },
          { label: '跳过并继续', value: 'skip', primary: !![] },
        ],
      });
      if (_0x4401e0 !== 'skip' || _0x34e83e['data'] !== _0x29d2a1) return ![];
    }
    return _0x1e6cf2(0x3);
  }
  function _0x18ac9d({ clearState: clearState = ![] } = {}) {
    (_0x476ffd && (windowObject['clearTimeout'](_0x476ffd), (_0x476ffd = null)),
      clearState &&
        ((_0x34e83e['assetBreakdownEpisodes'] = []), (_0x34e83e['assetBreakdownVisibleCount'] = 0x0)));
  }
  function _0x54aa47() {
    _0x18ac9d();
    if (_0x34e83e['data']?.['project']?.['sourceMode'] === 'video-replication') return;
    const _0x2be76c = getStoryAssetBreakdownEpisodes(_0x34e83e)['length'];
    if (
      !isStoryAssetExtractionOperation(_0x34e83e['storyPlanningOperation']) ||
      _0x34e83e['assetBreakdownVisibleCount'] >= _0x2be76c
    )
      return;
    _0x476ffd = windowObject['setTimeout'](() => {
      _0x476ffd = null;
      if (!isStoryAssetExtractionOperation(_0x34e83e['storyPlanningOperation'])) return;
      ((_0x34e83e['assetBreakdownVisibleCount'] = Math['min'](
        _0x2be76c,
        Math['max'](0x1, _0x34e83e['assetBreakdownVisibleCount'] + 0x1),
      )),
        _0x34e83e['view'] === 'project' && _0x34e83e['step'] === 0x1 && _0x5d097e({ updateToolbar: ![] }),
        _0x54aa47());
    }, 0x640);
  }
  function _0x4787c2() {
    if (_0x34e83e['data']?.['project']?.['sourceMode'] === 'video-replication') return ![];
    if (!isStoryAssetExtractionOperation(_0x34e83e['storyPlanningOperation'])) return ![];
    _0x34e83e['assetBreakdownEpisodes'] = cloneData(_0x34e83e['data']['episodes'] || []);
    const _0x15c555 = _0x34e83e['assetBreakdownEpisodes']['length'];
    return (
      (_0x34e83e['assetBreakdownVisibleCount'] = _0x15c555
        ? Math['min'](_0x15c555, Math['max'](0x1, Number(_0x34e83e['assetBreakdownVisibleCount']) || 0x1))
        : 0x0),
      _0x54aa47(),
      !![]
    );
  }
  function _0xd5d0da(_0x6386e7 = '', _0x1ca645 = '') {
    ((_0x34e83e['storyPlanningOperation'] = _0x6386e7), (_0x34e83e['storyPlanningStatus'] = _0x1ca645));
    if (_0x34e83e['data']?.['project']?.['sourceMode'] === 'video-replication' && _0xa9cad2()) return;
    _0x5d097e();
  }
  function _0x165fb9({
    projectData: projectData = _0x34e83e['data'],
    singleRequest: singleRequest = ![],
    experimental: experimental = ![],
  } = {}) {
    const _0x5c12c0 = shouldUseStoryVideoReplicationUnifiedAssetLocalization(projectData),
      _0x55c316 = singleRequest || _0x5c12c0,
      _0x3fd01f = shouldUseStoryAssetParallelExtraction({
        parallelAgentAvailable: typeof extractAssetsParallel === 'function',
        forceSingleRequest: _0x55c316,
        explicitExperimental: experimental,
      }),
      _0x4370d9 = shouldUseStoryAssetBatchedExtraction(projectData, {
        batchedAgentAvailable: typeof extractAssetsExperimental === 'function',
        forceSingleRequest: _0x55c316,
        explicitExperimental: experimental,
      }),
      _0x3015f2 = !_0x3fd01f && !_0x4370d9,
      _0x17a034 = _0x3fd01f ? extractAssetsParallel : _0x4370d9 ? extractAssetsExperimental : extractAssets;
    return {
      useParallelExtraction: _0x3fd01f,
      useBatchedExtraction: _0x4370d9,
      useSingleRequest: _0x3015f2,
      extractionAgent: _0x17a034,
    };
  }
  function _0x4961cb(_0x107ef9 = _0x34e83e['data'], _0x3cfdb4 = null) {
    const _0x9c19e6 = _0x107ef9?.['project'] || {},
      _0x3b9def = _0x3cfdb4?.['modelSettings'] || {},
      _0x16dadc = _0x3b9def['textProvider'] || _0x34e83e['textProvider'];
    return (
      syncStoryPromptModeForVideoModel(
        { ..._0x34e83e, data: _0x107ef9 },
        _0x3b9def['models']?.['video'] || _0x34e83e['models']['video'],
      ),
      (_0x9c19e6['planning'] = normalizeStoryProjectPlanning(_0x9c19e6, {
        allowDeveloperPromptModes: _0x34e83e['developerModeAvailable'],
      })),
      {
        project: _0x9c19e6,
        model: _0x3b9def['models']?.['text'] || _0x34e83e['models']['text'],
        provider: _0x16dadc,
        providerProfileId: resolveStoryTextProviderProfileId(
          _0x16dadc,
          _0x3b9def['textProviderProfileId'] || _0x34e83e['textProviderProfileId'],
        ),
        aspectRatio: normalizeStoryAspectRatio(_0x9c19e6['aspectRatio']),
        visualStyle: resolveStoryStyleSelection({
          styleId: _0x9c19e6['videoStyleId'],
          stylePrompt: _0x9c19e6['videoStylePrompt'],
          videoStyle: _0x9c19e6['videoStyle'],
        })['stylePrompt'],
      }
    );
  }
  async function _0x45d10c({
    advance: advance = !![],
    allowIncompleteScripts: allowIncompleteScripts = ![],
    experimental: experimental = ![],
    singleRequest: singleRequest = ![],
  } = {}) {
    const _0x599813 = normalizeText(_0x34e83e['data']?.['project']?.['id']) || 'current-project';
    if (_0x34e83e['storyPlanningOperation'] || _0x145811['has'](_0x599813)) return ![];
    if (experimental && !isStoryAssetExperimentalExtractionAvailable(windowObject)) return ![];
    const _0x5b0573 = _0x34e83e['data']['project']?.['sourceMode'] === 'video-replication';
    if (_0x34e83e['data']['episodes']['length']) {
      const _0x1521ff = _0x5205cc();
      if (!_0x1521ff['complete'] && !allowIncompleteScripts && !_0x5b0573)
        return (_0x126c2b('请先按顺序生成所有分集剧本。', 'warn'), ![]);
    }
    const {
        useParallelExtraction: _0x4bee33,
        useBatchedExtraction: _0x3f8808,
        useSingleRequest: _0x26cc3f,
        extractionAgent: _0x5aad04,
      } = _0x165fb9({ singleRequest: singleRequest, experimental: experimental }),
      _0x11bcdc = _0x4bee33
        ? 'extracting-assets'
        : _0x26cc3f
          ? 'extracting-assets-single-request'
          : 'extracting-assets-experimental',
      _0x392aa4 = _0x4bee33
        ? _0x5b0573
          ? '本地化角色、场景与道具'
          : '并行提取角色、场景与道具'
        : _0x26cc3f
          ? _0x5b0573
            ? '本地化角色、场景与道具'
            : '单次超长提取角色、场景与道具'
          : '正在按剧本长度选择三类专用 API 或 PP-UIE + API，并生成最终视觉素材';
    if (typeof _0x5aad04 !== 'function')
      return (_0x126c2b((experimental ? '混合开发测试' : '素材') + '提取尚未初始化。', 'error'), ![]);
    const _0x1ddc47 = _0x34e83e['data']['project']?.['sourceMode'] === 'upload-original',
      _0x31bf1f = _0x1ddc47 || _0x5b0573,
      _0x180b1f = experimental ? 'experimentalAssetExtractionDraft' : 'assetExtractionDraft',
      _0x337f8c = _0x34e83e['data'],
      _0x64ead9 = _0x337f8c[_0x180b1f],
      _0xf321ca = getStoryAssetPaidRerunBlockedLanes(_0x64ead9),
      _0x579330 = getStoryAssetPaidRerunBlockedBatches(_0x64ead9),
      _0x5040c1 = _0xf321ca['length'] + _0x579330['length'],
      _0x2b756c = getStoryAssetModelChangeRerunKinds(_0x64ead9);
    let _0x39534d = null;
    if (_0x2b756c['length'] && !_0x579330['length'] && _0xf321ca['length'] === _0x2b756c['length'])
      _0x39534d = { confirmed: !![], authorizedKinds: _0x2b756c };
    else {
      if (_0x5040c1) {
        const _0x250673 = await _0x1c6ae2({
          draft: _0x64ead9,
          requestChoice: _0x1c99bf,
          isCurrent: () => _0x34e83e['data'] === _0x337f8c,
        });
        if (
          !['local-revalidate', 'paid-rerun']['includes'](_0x250673['action']) ||
          _0x34e83e['storyPlanningOperation']
        )
          return ![];
        _0x39534d = _0x250673['paidRerunAuthorization'];
      }
    }
    const _0x51926a = isStoryAssetLocalQualityRevalidationDraft(_0x64ead9),
      _0x3cc59c = isStoryAssetPlannedContinuationDraft(_0x64ead9);
    let _0x161a09 = 'preserve';
    if (_0x34e83e['data']['assets']['length'] && !_0x51926a && !_0x3cc59c && !_0x5040c1) {
      _0x145811['add'](_0x599813);
      try {
        _0x161a09 = await _0xee37e3({
          title: experimental ? '混合开发测试重新提取角色、场景与道具' : '重新提取角色、场景与道具',
          message: _0x31bf1f
            ? '保留已有媒体会沿用匹配素材的图片；全部重建会清空素材媒体和下游分镜，不会改写或删除上传的原始剧本。'
            : '保留已有媒体会沿用匹配角色、场景和道具的图片；全部重建会清空素材媒体和下游分镜，保留已确认的分集正文。',
        });
      } finally {
        _0x145811['delete'](_0x599813);
      }
      if (!_0x161a09 || _0x34e83e['data'] !== _0x337f8c) return ![];
    }
    _0x18ac9d({ clearState: !![] });
    !_0x5b0573 &&
      ((_0x34e83e['assetBreakdownEpisodes'] = cloneData(_0x34e83e['data']['episodes'])),
      (_0x34e83e['assetBreakdownVisibleCount'] = _0x34e83e['assetBreakdownEpisodes']['length'] ? 0x1 : 0x0));
    _0xd5d0da(_0x11bcdc, '正在' + _0x392aa4);
    if (!_0x5b0573) _0x54aa47();
    const _0x55ffc8 = _0x34e83e['step'],
      _0x16dd03 = _0x419aa4(_0x34e83e),
      _0x477aeb = _0x26cc3f
        ? buildStoryBackgroundTaskId('asset-extraction-single-request')
        : experimental
          ? buildStoryBackgroundTaskId('asset-extraction-experimental')
          : buildStoryBackgroundTaskId('asset-extraction');
    _0x203e56(_0x16dd03, {
      id: _0x477aeb,
      type: _0x26cc3f
        ? 'asset-extraction-single-request'
        : experimental
          ? 'asset-extraction-experimental'
          : 'asset-extraction',
      label: _0x392aa4,
      message: _0x34e83e['storyPlanningStatus'],
      resumable: !_0x26cc3f,
      ...(!_0x26cc3f ? { resumePayload: { kind: 'story-asset-extraction-run', draftKey: _0x180b1f } } : {}),
    });
    const _0x5f5513 = _0x16dd03['data'];
    try {
      const _0x27eb5c = _0x4961cb(_0x5f5513, _0x16dd03),
        _0x863a72 = _0x5b0573
          ? buildStoryVideoReplicationAssetExtractionProject(_0x5f5513)
          : _0x27eb5c['project'],
        _0x1b2616 = async (_0x5cd79c = null) =>
          _0x5aad04({
            ..._0x27eb5c,
            project: _0x863a72,
            episodes: _0x5b0573
              ? _0x5f5513['episodes']['filter'](
                  (_0x2ed7f1) => _0x2ed7f1['replication']?.['status'] === 'ready',
                )
              : _0x5f5513['episodes'],
            ...(_0x3f8808
              ? { diagnostics: createStoryAssetExtractionDeveloperDiagnostics(windowObject) }
              : {}),
            ...(_0x4bee33 || _0x3f8808
              ? {
                  resumeDraft: _0x5cd79c,
                  ...(_0x4bee33
                    ? {
                        automaticRecovery: !_0x5b0573,
                        ...(_0x5b0573 ? { resumeSourceAliases: [{ project: _0x27eb5c['project'] }] } : {}),
                      }
                    : {}),
                  ...(_0x39534d ? { paidRerunAuthorization: _0x39534d } : {}),
                  onCheckpoint: async (_0x2b2ddd) => {
                    if (!_0x1eb9eb(_0x16dd03)) return;
                    ((_0x5f5513[_0x180b1f] = cloneData(_0x2b2ddd)),
                      _0x816d51(_0x16dd03, _0x477aeb, {
                        resumable: !![],
                        modelId: _0x27eb5c['model'],
                        provider: _0x27eb5c['provider'],
                        resumePayload: { kind: 'story-asset-extraction-run', draftKey: _0x180b1f },
                      }),
                      _0x44b8a1(_0x16dd03),
                      await _0x23e4f4());
                  },
                }
              : _0x26cc3f
                ? {
                    allowOversizedPrompt: !![],
                    ...(_0x5b0573
                      ? {
                          maxOutputTokens: STORY_VIDEO_REPLICATION_UNIFIED_ASSET_MAX_OUTPUT_TOKENS,
                          structuredOutputFallback: 'prompt',
                          automaticRecovery: !![],
                          assetKinds: ['scene', 'prop'],
                        }
                      : {}),
                  }
                : {}),
            onProgress: ({ message: _0x26342 } = {}) => {
              if (!_0x1eb9eb(_0x16dd03)) return;
              const _0x3097f9 = normalizeText(_0x26342) || '正在' + _0x392aa4;
              (_0x816d51(_0x16dd03, _0x477aeb, { status: 'running', message: _0x3097f9 }),
                _0x516633(_0x16dd03) &&
                  ((_0x34e83e['storyPlanningStatus'] = _0x3097f9), _0x256669(), _0x2979c1()));
            },
          }),
        _0x4244a2 =
          _0x4bee33 || _0x3f8808
            ? await runStoryAssetExtractionToCompletion({
                initialResumeDraft: _0x5f5513[_0x180b1f],
                isActive: () => _0x1eb9eb(_0x16dd03),
                execute: async (_0x46e7d8) => _0x1b2616(_0x46e7d8),
                onContinuation: async (_0xc5b423, _0x32652b) => {
                  if (!_0x1eb9eb(_0x16dd03)) return;
                  _0x5f5513[_0x180b1f] = cloneData(_0xc5b423);
                  const _0x3a7c03 = getStoryAssetExperimentalDraftDisplay(_0xc5b423),
                    _0x522a7e =
                      _0x3a7c03['summary'] ||
                      normalizeText(_0x32652b?.['message']) ||
                      '本轮分批调用已完成，系统正在自动继续剩余内容';
                  (_0x816d51(_0x16dd03, _0x477aeb, {
                    status: 'running',
                    message: _0x522a7e + ' · 正在自动继续',
                  }),
                    _0x44b8a1(_0x16dd03),
                    await _0x23e4f4(),
                    _0x516633(_0x16dd03) &&
                      ((_0x34e83e['storyPlanningStatus'] = _0x522a7e + ' · 正在自动继续'), _0x256669()));
                },
              })
            : await _0x1b2616();
      if (!_0x1eb9eb(_0x16dd03)) return ![];
      const _0x4a2bdd = Array['isArray'](_0x4244a2?.['assets']) ? _0x4244a2['assets'] : [],
        _0x23a0da = _0x4a2bdd['filter']((_0x16a1b5) => _0x16a1b5?.['designStatus'] === 'baseline')['length'],
        _0x4fa2f4 = !_0x5b0573 || _0x4a2bdd['some']((_0x294dda) => _0x294dda?.['kind'] === 'scene');
      if (!_0x4a2bdd['length'] || _0x23a0da || !_0x4fa2f4) {
        const _0x46ad24 = new Error(
          _0x23a0da
            ? '本轮有 ' + _0x23a0da + ' 个素材没有完成 API 视觉反推；旧素材已保留，未进入下一步。'
            : !_0x4fa2f4
              ? '本轮没有获得可用场景素材；旧素材已保留，未进入下一步。'
              : '本轮没有获得可用素材；旧素材已保留，未进入下一步。',
        );
        _0x46ad24['type'] = 'ASSET_VISUAL_RESULT_INCOMPLETE';
        throw _0x46ad24;
      }
      if (_0x5b0573) {
        const _0x2450d0 = await collectStoryReplicationAssetFrames({
          data: _0x5f5513,
          assets: _0x4a2bdd,
          projectId: _0x16dd03['projectId'],
          sources: _0x863a72['replicationFrameSources'],
          isActive: () => _0x1eb9eb(_0x16dd03),
          onProgress: (_0x141ff0) => {
            (_0x816d51(_0x16dd03, _0x477aeb, { message: _0x141ff0 }),
              _0x516633(_0x16dd03) && ((_0x34e83e['storyPlanningStatus'] = _0x141ff0), _0x256669()));
          },
        });
        if (!_0x1eb9eb(_0x16dd03)) return ![];
        if (!_0x2450d0) throw new Error('原视频分析在截帧期间发生变化，请重新提取素材。');
      }
      let _0x933539 = _0x5f5513;
      _0x161a09 === 'rebuild' &&
        ((_0x933539 = clearStoryPlanningForRebuild(_0x5f5513)),
        (_0x16dd03['data'] = _0x933539),
        _0x187178(_0x16dd03),
        _0x516633(_0x16dd03) && ((_0x34e83e['data'] = _0x933539), _0x288b41()));
      (delete _0x933539['assetExtractionDraft'], delete _0x933539['experimentalAssetExtractionDraft']);
      const _0x8dbe5d = _0x4bee33
          ? '三路并行'
          : _0x26cc3f
            ? _0x5b0573
              ? '统一素材本地化'
              : '单次超长'
            : _0x4244a2?.['extractionMode'] === 'parallel-api'
              ? '角色、场景、道具三类 API 开发测试'
              : _0x4244a2?.['extractionMode'] === 'api-fallback'
                ? 'API 分批降级开发测试'
                : 'PP-UIE\x20+\x20API\x20混合开发测试',
        _0x318542 = _0x161a09 !== 'rebuild';
      _0x933539['assets'] = (_0x5b0573 ? mergeStoryReplicationAssets : mergeStoryPlanningAssets)(
        _0x5b0573 ? _0x933539 : _0x933539['assets'],
        _0x4244a2?.['assets'],
        { preserveMedia: _0x318542, retainUnmatched: !_0x5b0573, visualStyle: _0x27eb5c['visualStyle'] },
      );
      const _0x69f7fe = _0x4244a2?.['candidateLedger']?.['summary']?.['quarantinedCount']
        ? '，已隔离 ' +
          Math['max'](
            0x0,
            Math['trunc'](Number(_0x4244a2['candidateLedger']['summary']['quarantinedCount']) || 0x0),
          ) +
          '\x20个未通过证据裁决的候选'
        : '';
      (_0x31bf1f || _0x5b0573 || _0x4bee33 || _0x3f8808 || _0x26cc3f) &&
        (_0x933539['episodes'] = attachUploadedStoryAssetsToEpisodes(
          _0x933539['episodes'],
          _0x933539['assets'],
        ));
      _0x5b0573 &&
        (captureStoryReplicationAssetSources(_0x933539),
        markStoryVideoReplicationAssetLocalizationComplete(_0x933539));
      (_0x4934b4(_0x16dd03, _0x477aeb, {
        status: 'succeeded',
        message: _0x8dbe5d + '已提取 ' + _0x933539['assets']['length'] + ' 个素材' + _0x69f7fe,
        resumable: ![],
      }),
        _0x30fbb7({ immediate: !![] }),
        _0x22924d(
          _0x8dbe5d +
            '已提取 ' +
            _0x933539['assets']['length'] +
            ' 个角色、场景与道具素材' +
            _0x69f7fe +
            '。',
          _0x16dd03,
          { step: 0x2, assetId: _0x933539['assets'][0x0]?.['id'] },
          { notificationMessage: _0x8dbe5d + '角色、场景与道具素材提取完成。' },
        ));
      if (_0x516633(_0x16dd03)) {
        ((_0x34e83e['selectedAssetId'] = _0x933539['assets'][0x0]?.['id'] || ''),
          (_0x34e83e['assetFilter'] = _0x933539['assets'][0x0]?.['kind'] || 'character'),
          _0x18ac9d({ clearState: !![] }),
          (_0x34e83e['storyPlanningOperation'] = ''),
          (_0x34e83e['storyPlanningStatus'] = ''));
        if (advance && _0x34e83e['view'] === 'project' && _0x34e83e['step'] === _0x55ffc8) _0x1e6cf2(0x2);
        else _0x5d097e();
      }
      return !![];
    } catch (_0x24dd4a) {
      if (!_0x1eb9eb(_0x16dd03)) return ![];
      return (
        _0x4d271e(
          _0x26cc3f
            ? _0x5b0573
              ? 'localize-replication-assets'
              : 'extract-assets-single-request'
            : experimental
              ? 'extract-assets-experimental'
              : 'extract-assets',
          _0x24dd4a,
          { model: _0x34e83e['models']['text'], provider: _0x34e83e['textProvider'] },
        ),
        _0x4934b4(_0x16dd03, _0x477aeb, {
          status: 'failed',
          message:
            (_0x26cc3f ? (_0x5b0573 ? '素材本地化' : '单次超长') : experimental ? '混合开发测试' : '素材') +
            '提取失败',
          error: _0x24dd4a?.['message'] || _0x392aa4 + '失败。',
        }),
        _0x4994e9(_0x24dd4a?.['message'] || _0x392aa4 + '失败。', 'error', _0x24dd4a),
        ![]
      );
    } finally {
      _0x516633(_0x16dd03) &&
        (_0x18ac9d({ clearState: !![] }), _0x34e83e['storyPlanningOperation'] === _0x11bcdc && _0xd5d0da());
    }
  }
  async function _0x37f890() {
    if (_0x34e83e['storyPlanningOperation']) return ![];
    const _0x542e7f =
      _0x34e83e['data']['episodes']['length'] > 0x0 &&
      !compileStoryEpisodeScripts(_0x34e83e['data']['episodes'])['complete'];
    if (_0x542e7f) {
      const _0x1694bb = await _0x389f15();
      if (_0x1694bb !== 'continue') return ![];
    }
    return _0x45d10c({ advance: !![], allowIncompleteScripts: _0x542e7f });
  }
  return Object['freeze']({
    preview: async (_0x3e58ba) => {
      if (windowObject?.['DEV_MODE'] !== !![]) throw new Error('仅开发者模式可调试请求');
      const _0x159acb = cloneData(_0x34e83e['data']),
        {
          useParallelExtraction: _0x3abf91,
          useBatchedExtraction: _0x63dd47,
          useSingleRequest: _0x594e22,
          extractionAgent: _0x472ab8,
        } = _0x165fb9({ projectData: _0x159acb });
      if (typeof _0x472ab8 !== 'function') throw new Error('素材提取\x20Agent\x20尚未初始化');
      const _0x32ec07 = _0x4961cb(_0x159acb),
        _0xf25518 = _0x159acb['project']?.['sourceMode'] === 'video-replication';
      return _0x472ab8({
        ..._0x32ec07,
        project: _0xf25518
          ? buildStoryVideoReplicationAssetExtractionProject(_0x159acb)
          : _0x32ec07['project'],
        episodes: _0xf25518
          ? _0x159acb['episodes']['filter']((_0x3a63f7) => _0x3a63f7['replication']?.['status'] === 'ready')
          : _0x159acb['episodes'],
        ...(_0x3abf91 || _0x63dd47
          ? { resumeDraft: _0x159acb['assetExtractionDraft'], automaticRecovery: !_0xf25518 }
          : {}),
        ...(_0x594e22
          ? {
              allowOversizedPrompt: !![],
              ...(_0xf25518
                ? {
                    maxOutputTokens: STORY_VIDEO_REPLICATION_UNIFIED_ASSET_MAX_OUTPUT_TOKENS,
                    structuredOutputFallback: 'prompt',
                    automaticRecovery: !![],
                    assetKinds: ['scene', 'prop'],
                  }
                : {}),
            }
          : {}),
        request: _0x3e58ba,
        preferLocal: ![],
      });
    },
    continueToProjectAssets: _0x37f890,
    extractProjectAssets: _0x45d10c,
    getStoryPlanningAgentContext: _0x4961cb,
    openEpisodeStage: _0x132238,
    requestPlanningRegenerationMode: _0xee37e3,
    restoreStoryAssetBreakdownProgress: _0x4787c2,
    setStoryPlanningOperation: _0xd5d0da,
    stopStoryAssetBreakdownProgress: _0x18ac9d,
  });
}
