import { buildStoryBackgroundTaskId, getStoryBackgroundTasks } from './storyBackgroundTasks.js';
import { getStoryHomeSummaryTaskCopy, resolveStoryHomeGenerationMode } from './storyHomeRewrite.js';
import {
  applyGeneratedStoryResult,
  buildStoryHomeGenerationRequest,
  buildStorySummaryRegenerationRequest,
  createGeneratedStoryProjectData,
  createUploadedStoryProjectData,
  invalidateStoryPlanningDownstream,
} from './storyProjectPlanning.js';
import { createStorySummaryRunRecorder } from './storySummaryRun.js';
import { applyStoryPromptModeVideoModelDefault } from './storyVideoGenerationSettings.js';
function normalizeText(_0x5c1919) {
  return String(_0x5c1919 ?? '')['trim']();
}
export function createStorySummaryGenerationWorkspaceController({
  state: _0x37f2f7,
  windowObject: windowObject = globalThis['window'] || globalThis,
  generateStory: _0x41f9b4,
  startReplicationFromHome: _0x3523d8,
  createProjectToken: _0x2e318e,
  beginProjectSession: _0x531870,
  isProjectTaskLive: _0x2808b3,
  isProjectTaskCurrent: _0x106ae9,
  registerProjectData: _0x5c2315,
  startBackgroundTask: _0x2f5fd6,
  updateBackgroundTask: _0x589383,
  finishBackgroundTask: _0xa8126e,
  syncProjectEntry: _0x3572fb,
  syncCurrentProjectEntry: _0x5645e6,
  persistNow: _0x36fa72,
  schedulePersistence: _0x4dd323,
  requiresDurableRunPersistence: _0x575382,
  openProject: _0x33313b,
  render: _0x47ef96,
  showToast: _0x5ab608,
  showTaskResultToast: _0x4417bd,
  notifyTextTaskComplete: _0x144519,
  requestChoice: _0x357fbf,
  extractProjectAssets: _0x1a5a7a,
  resetDownstreamUi: _0x3622c0,
  reportApiError: _0x2b0811,
} = {}) {
  if (
    !_0x37f2f7 ||
    typeof _0x3523d8 !== 'function' ||
    typeof _0x2e318e !== 'function' ||
    typeof _0x531870 !== 'function' ||
    typeof _0x2808b3 !== 'function' ||
    typeof _0x106ae9 !== 'function' ||
    typeof _0x5c2315 !== 'function' ||
    typeof _0x2f5fd6 !== 'function' ||
    typeof _0x589383 !== 'function' ||
    typeof _0xa8126e !== 'function' ||
    typeof _0x3572fb !== 'function' ||
    typeof _0x5645e6 !== 'function' ||
    typeof _0x36fa72 !== 'function' ||
    typeof _0x4dd323 !== 'function' ||
    typeof _0x575382 !== 'function' ||
    typeof _0x33313b !== 'function' ||
    typeof _0x47ef96 !== 'function' ||
    typeof _0x5ab608 !== 'function' ||
    typeof _0x4417bd !== 'function' ||
    typeof _0x144519 !== 'function' ||
    typeof _0x357fbf !== 'function' ||
    typeof _0x1a5a7a !== 'function' ||
    typeof _0x3622c0 !== 'function' ||
    typeof _0x2b0811 !== 'function'
  )
    throw new TypeError('Story summary generation requires project, persistence, and presentation adapters.');
  const _0x15c44c = (_0x53b505) => {
    ((_0x37f2f7['assetSelectionMode'] = ![]),
      (_0x37f2f7['selectedAssetIds'] = []),
      (_0x37f2f7['assetAppearanceIndexes'] = {}),
      (_0x37f2f7['scriptSelectionMode'] = ![]),
      (_0x37f2f7['selectedScriptEpisodeIds'] = []),
      (_0x37f2f7['scriptGenerationFocusMode'] = ![]),
      (_0x37f2f7['outlineSectionOpenState'] = {}),
      (_0x37f2f7['scriptMode'] = _0x53b505));
  };
  function _0x57c6d9(_0x3ad075, _0x57cdce, _0x5eb695) {
    const _0x147de5 = getStoryBackgroundTasks(_0x3ad075['data'])['find'](
        (_0x4b8f92) => _0x4b8f92['id'] === _0x5eb695,
      ),
      _0x333ac2 = {
        ..._0x57cdce,
        fileName: _0x57cdce['fileName'] || _0x57cdce['scriptFileName'],
        model: _0x57cdce['model'] || _0x57cdce['modelId'],
        planning: _0x57cdce['planning'] || {
          episodeCount: _0x57cdce['episodeCount'],
          sceneMaxSeconds: _0x57cdce['sceneMaxSeconds'],
          promptMode: _0x57cdce['promptMode'],
        },
      };
    return createStorySummaryRunRecorder({
      project: _0x3ad075['data']['project'],
      request: _0x333ac2,
      resumePayload: _0x147de5?.['resumePayload'],
      onChange: async (_0x7037a) => {
        (_0x589383(_0x3ad075, _0x5eb695, {
          resumable: _0x7037a['status'] !== 'succeeded',
          modelId: _0x7037a['input']['execution']['modelId'],
          provider: _0x7037a['input']['execution']['provider'],
          resumePayload: { kind: _0x7037a['kind'], run: _0x7037a },
        }),
          _0x3572fb(_0x3ad075));
        const _0x46626f = await _0x36fa72();
        if (_0x575382() && !_0x46626f) throw new Error('剧本摘要运行记录保存失败，已停止模型请求。');
      },
    });
  }
  async function _0x34d633(_0x3e228b) {
    if (!_0x3e228b['requiresPaidRetry']) return !![];
    const _0x2d5a8d = await _0x357fbf({
      overlayId: 'story-summary-paid-retry',
      title: '上次剧本摘要请求结果尚未安全提交',
      message: '上次请求可能已经计费，或响应尚未完成本地提交。确认后才会再次调用模型。',
      fallbackValue: null,
      choices: [
        { label: '暂不重试', value: null, autofocus: !![] },
        { label: '确认重新请求', value: 'retry', primary: !![] },
      ],
    });
    if (_0x2d5a8d !== 'retry') return ![];
    return (await _0x3e228b['authorizePaidRetry'](), !![]);
  }
  function _0x265d83() {
    const _0xbcb529 = resolveStoryHomeGenerationMode(_0x37f2f7);
    return buildStoryHomeGenerationRequest({
      mode: _0xbcb529,
      scriptMode: _0x37f2f7['scriptMode'],
      modelId: _0x37f2f7['models']['text'],
      provider: _0x37f2f7['textProvider'],
      providerProfileId: _0x37f2f7['textProviderProfileId'],
      scriptFileName: _0x37f2f7['scriptFileName'],
      scriptText: _0x37f2f7['scriptText'],
      idea: _0x37f2f7['idea'],
      rewriteInstruction: _0xbcb529 === 'rewrite' ? _0x37f2f7['idea'] : '',
      aspectRatio: _0x37f2f7['data']['project']?.['aspectRatio'],
      styleId: _0x37f2f7['data']['project']?.['videoStyleId'],
      stylePrompt: _0x37f2f7['data']['project']?.['videoStylePrompt'],
      videoStyle: _0x37f2f7['data']['project']?.['videoStyle'],
      episodeCount: _0x37f2f7['data']['project']?.['planning']?.['episodeCount'],
      sceneMaxSeconds: _0x37f2f7['data']['project']?.['planning']?.['sceneMaxSeconds'],
      promptMode: _0x37f2f7['data']['project']?.['planning']?.['promptMode'],
      allowDeveloperPromptModes: _0x37f2f7['developerModeAvailable'],
    });
  }
  async function _0x7d5541() {
    if (_0x37f2f7['isGeneratingStory']) return;
    if (_0x37f2f7['homeTab'] === 'replication') return _0x3523d8();
    const _0x42c3df = _0x265d83();
    if (!_0x42c3df['ok']) {
      _0x5ab608(_0x42c3df['error'], 'warn');
      return;
    }
    (windowObject?.['dispatchEvent']?.(
      new CustomEvent('storyWorkspace:generateRequested', { detail: _0x42c3df }),
    ),
      _0x5645e6(),
      applyStoryPromptModeVideoModelDefault(_0x37f2f7, _0x42c3df['promptMode']));
    if (_0x42c3df['mode'] === 'upload') {
      try {
        (_0x531870(),
          (_0x37f2f7['data'] = createUploadedStoryProjectData({
            projectId: 'story-' + Date['now'](),
            request: _0x42c3df,
            allowDeveloperPromptModes: _0x37f2f7['developerModeAvailable'],
          })),
          (_0x37f2f7['projectTitleEdited'] = ![]),
          (_0x37f2f7['hasCreatedProject'] = !![]),
          _0x15c44c('plot'),
          _0x33313b({ resetStep: !![] }),
          _0x4dd323({ immediate: !![] }),
          windowObject?.['dispatchEvent']?.(
            new CustomEvent('storyWorkspace:storyImported', {
              detail: {
                mode: _0x42c3df['mode'],
                modelId: _0x42c3df['modelId'],
                provider: _0x42c3df['provider'],
                episodeCount: _0x37f2f7['data']['episodes']['length'],
              },
            }),
          ),
          _0x4417bd(
            '已按原剧本导入 ' + _0x37f2f7['data']['episodes']['length'] + ' 集，未扩写正文。',
            'success',
          ),
          await _0x1a5a7a({ advance: !![] }));
      } catch (_0x4f9dbe) {
        _0x4417bd(_0x4f9dbe?.['message'] || '剧本导入失败，请检查原始文本。', 'error', _0x4f9dbe);
      }
      return;
    }
    if (typeof _0x41f9b4 !== 'function') {
      _0x5ab608('剧情 Agent 尚未初始化。', 'error');
      return;
    }
    (_0x531870(),
      (_0x37f2f7['data'] = createGeneratedStoryProjectData(
        {},
        {
          projectId: 'story-' + Date['now'](),
          request: _0x42c3df,
          allowDeveloperPromptModes: _0x37f2f7['developerModeAvailable'],
        },
      )),
      (_0x37f2f7['data']['project']['summaryStatus'] = 'generating'),
      (_0x37f2f7['projectTitleEdited'] = ![]),
      (_0x37f2f7['hasCreatedProject'] = !![]));
    const _0x3d7465 = _0x2e318e(),
      _0xc13b0 = buildStoryBackgroundTaskId('story-summary'),
      _0xaeca18 = _0x57c6d9(_0x3d7465, _0x42c3df, _0xc13b0),
      _0x428c31 = getStoryHomeSummaryTaskCopy(_0x42c3df['mode']);
    (_0x2f5fd6(_0x3d7465, {
      id: _0xc13b0,
      type: 'story-summary',
      label: _0x428c31['label'],
      message: _0x428c31['message'],
      resumable: !![],
      resumePayload: _0xaeca18['payload'](),
    }),
      _0x15c44c(_0x42c3df['scriptMode']),
      (_0x37f2f7['isGeneratingStory'] = !![]),
      (_0x37f2f7['generationStatus'] = _0x428c31['status']),
      _0x33313b({ resetStep: !![] }),
      _0x4dd323({ immediate: !![] }));
    try {
      await _0xaeca18['start']();
      const _0x9ae146 =
        _0xaeca18['candidateArtifact'] ||
        (await _0x41f9b4({
          mode: _0x42c3df['mode'],
          scriptMode: _0x42c3df['scriptMode'],
          idea: _0x42c3df['idea'],
          sourceText: _0x42c3df['sourceText'],
          fileName: _0x42c3df['scriptFileName'],
          rewriteInstruction: _0x42c3df['rewriteInstruction'],
          model: _0xaeca18['execution']['modelId'],
          provider: _0xaeca18['execution']['provider'],
          providerProfileId: _0xaeca18['execution']['providerProfileId'],
          aspectRatio: _0x42c3df['aspectRatio'],
          visualStyle: _0x42c3df['visualStyle'],
          planning: {
            episodeCount: _0x42c3df['episodeCount'],
            sceneMaxSeconds: _0x42c3df['sceneMaxSeconds'],
            promptMode: _0x42c3df['promptMode'],
          },
          onInvocation: _0xaeca18['onInvocation'],
          onProgress: ({ message: _0x2cc5b7 } = {}) => {
            if (!_0x2808b3(_0x3d7465)) return;
            const _0x27177f = normalizeText(_0x2cc5b7) || '正在生成剧本摘要';
            _0x589383(_0x3d7465, _0xc13b0, { status: 'running', message: _0x27177f });
            if (_0x106ae9(_0x3d7465)) {
              _0x37f2f7['generationStatus'] = _0x27177f;
              if (_0x37f2f7['view'] === 'project' && _0x37f2f7['step'] === 0x1) _0x47ef96();
            }
          },
        }));
      if (!_0xaeca18['candidateArtifact']) await _0xaeca18['ready'](_0x9ae146);
      if (!_0x2808b3(_0x3d7465)) return ![];
      ((_0x3d7465['data'] = applyGeneratedStoryResult(_0x3d7465['data'], _0x9ae146, {
        projectTitleEdited: _0x3d7465['projectTitleEdited'],
      })),
        _0x5c2315(_0x3d7465),
        (_0x3d7465['data']['project']['summaryStatus'] = 'completed'),
        (_0x3d7465['data']['project']['outlineStatus'] = 'pending'));
      _0x106ae9(_0x3d7465) &&
        ((_0x37f2f7['data'] = _0x3d7465['data']),
        (_0x37f2f7['isGeneratingStory'] = ![]),
        (_0x37f2f7['generationStatus'] = ''));
      (windowObject?.['dispatchEvent']?.(
        new CustomEvent('storyWorkspace:storyGenerated', {
          detail: {
            mode: _0x42c3df['mode'],
            scriptMode: _0x42c3df['scriptMode'],
            modelId: _0x42c3df['modelId'],
            provider: _0x42c3df['provider'],
            aspectRatio: _0x42c3df['aspectRatio'],
            styleId: _0x42c3df['styleId'],
            visualStyle: _0x42c3df['visualStyle'],
            result: _0x9ae146,
          },
        }),
      ),
        _0xa8126e(_0x3d7465, _0xc13b0, { status: 'succeeded', message: '剧本摘要生成完成', resumable: ![] }),
        await _0xaeca18['succeeded'](),
        _0x144519('剧本摘要生成完成。', _0x3d7465, { step: 0x1, outlineSectionId: 'summary' }),
        _0x4dd323({ immediate: !![] }));
      if (_0x106ae9(_0x3d7465)) _0x47ef96();
      return !![];
    } catch (_0xf12956) {
      if (!_0x2808b3(_0x3d7465)) return ![];
      return (
        await _0xaeca18['failed'](_0xf12956)['catch'](() => {}),
        (_0x3d7465['data']['project']['summaryStatus'] = 'error'),
        _0xa8126e(_0x3d7465, _0xc13b0, {
          status: 'failed',
          message: '剧本摘要生成失败',
          error: _0xf12956?.['message'] || '剧本摘要生成失败，请稍后重试。',
          resumable: !![],
          resumePayload: _0xaeca18['payload'](),
        }),
        _0x106ae9(_0x3d7465) &&
          ((_0x37f2f7['isGeneratingStory'] = ![]), (_0x37f2f7['generationStatus'] = ''), _0x47ef96()),
        _0x4417bd(_0xf12956?.['message'] || '剧本摘要生成失败，请稍后重试。', 'error', _0xf12956),
        ![]
      );
    }
  }
  async function _0x59abc1() {
    if (_0x37f2f7['isGeneratingStory'] || _0x37f2f7['storyPlanningOperation']) return ![];
    if (typeof _0x41f9b4 !== 'function') return (_0x5ab608('剧情 Agent 尚未初始化。', 'error'), ![]);
    const _0x383150 = buildStorySummaryRegenerationRequest(_0x37f2f7['data']['project'], {
      modelId: _0x37f2f7['models']['text'],
      provider: _0x37f2f7['textProvider'],
      providerProfileId: _0x37f2f7['textProviderProfileId'],
      allowDeveloperPromptModes: _0x37f2f7['developerModeAvailable'],
    });
    if (!_0x383150['ok']) return (_0x5ab608(_0x383150['error'], 'warn'), ![]);
    const _0x46ec9e = _0x2e318e(),
      _0x365f04 = buildStoryBackgroundTaskId('story-summary'),
      _0x242ba2 = _0x57c6d9(_0x46ec9e, _0x383150, _0x365f04);
    if (!(await _0x34d633(_0x242ba2))) return ![];
    ((_0x37f2f7['isGeneratingStory'] = !![]),
      (_0x37f2f7['generationStatus'] = '正在根据原始创意重新生成剧本摘要...'),
      (_0x37f2f7['data']['project']['summaryStatus'] = 'generating'),
      _0x2f5fd6(_0x46ec9e, {
        id: _0x365f04,
        type: 'story-summary',
        label: '重新生成剧本摘要',
        message: _0x37f2f7['generationStatus'],
        resumable: !![],
        resumePayload: _0x242ba2['payload'](),
      }),
      _0x47ef96());
    try {
      await _0x242ba2['start']();
      const _0x247cb6 =
        _0x242ba2['candidateArtifact'] ||
        (await _0x41f9b4({
          ..._0x383150,
          model: _0x242ba2['execution']['modelId'],
          provider: _0x242ba2['execution']['provider'],
          providerProfileId: _0x242ba2['execution']['providerProfileId'],
          onInvocation: _0x242ba2['onInvocation'],
          onProgress: ({ message: _0x36b8da } = {}) => {
            if (!_0x2808b3(_0x46ec9e)) return;
            const _0x24bf8c = normalizeText(_0x36b8da) || '正在重新生成剧本摘要';
            _0x589383(_0x46ec9e, _0x365f04, { status: 'running', message: _0x24bf8c });
            if (_0x106ae9(_0x46ec9e)) {
              _0x37f2f7['generationStatus'] = _0x24bf8c;
              if (_0x37f2f7['view'] === 'project' && _0x37f2f7['step'] === 0x1) _0x47ef96();
            }
          },
        }));
      if (!_0x242ba2['candidateArtifact']) await _0x242ba2['ready'](_0x247cb6);
      if (!_0x2808b3(_0x46ec9e)) return ![];
      return (
        (_0x46ec9e['data'] = applyGeneratedStoryResult(_0x46ec9e['data'], _0x247cb6, {
          projectTitleEdited: _0x46ec9e['projectTitleEdited'],
        })),
        (_0x46ec9e['data'] = invalidateStoryPlanningDownstream(_0x46ec9e['data'], {
          clearEpisodeOutlines: !![],
        })),
        _0x5c2315(_0x46ec9e),
        (_0x46ec9e['data']['project']['summaryStatus'] = 'completed'),
        _0x106ae9(_0x46ec9e) && ((_0x37f2f7['data'] = _0x46ec9e['data']), _0x3622c0()),
        windowObject?.['dispatchEvent']?.(
          new CustomEvent('storyWorkspace:storyGenerated', {
            detail: {
              mode: _0x383150['mode'],
              modelId: _0x383150['model'],
              provider: _0x383150['provider'],
              aspectRatio: _0x383150['aspectRatio'],
              visualStyle: _0x383150['visualStyle'],
              regenerated: !![],
              result: _0x247cb6,
            },
          }),
        ),
        _0x4dd323({ immediate: !![] }),
        _0xa8126e(_0x46ec9e, _0x365f04, {
          status: 'succeeded',
          message: '剧本摘要重新生成完成',
          resumable: ![],
        }),
        await _0x242ba2['succeeded'](),
        _0x144519('剧本摘要已重新生成。', _0x46ec9e, { step: 0x1, outlineSectionId: 'summary' }),
        !![]
      );
    } catch (_0xb53996) {
      if (!_0x2808b3(_0x46ec9e)) return ![];
      return (
        await _0x242ba2['failed'](_0xb53996)['catch'](() => {}),
        (_0x46ec9e['data']['project']['summaryStatus'] = normalizeText(
          _0x46ec9e['data']['project']['summary'],
        )
          ? 'completed'
          : 'error'),
        _0x2b0811('regenerate-story-summary', _0xb53996, {
          model: _0x383150['model'],
          provider: _0x383150['provider'],
        }),
        _0xa8126e(_0x46ec9e, _0x365f04, {
          status: 'failed',
          message: '剧本摘要重新生成失败',
          error: _0xb53996?.['message'] || '剧本摘要重新生成失败。',
          resumable: !![],
          resumePayload: _0x242ba2['payload'](),
        }),
        _0x4417bd(
          _0xb53996?.['message'] || '剧本摘要重新生成失败，原摘要和下游内容均已保留。',
          'error',
          _0xb53996,
        ),
        ![]
      );
    } finally {
      _0x106ae9(_0x46ec9e) &&
        ((_0x37f2f7['isGeneratingStory'] = ![]), (_0x37f2f7['generationStatus'] = ''), _0x47ef96());
    }
  }
  return {
    preview: async ({ home: home = ![], captureRequest: _0x2e32b2 }) => {
      if (windowObject?.['DEV_MODE'] !== !![]) throw new Error('仅开发者模式可调试请求');
      const _0x3c7e1a = home
        ? _0x265d83()
        : buildStorySummaryRegenerationRequest(_0x37f2f7['data']['project'], {
            modelId: _0x37f2f7['models']['text'],
            provider: _0x37f2f7['textProvider'],
            providerProfileId: _0x37f2f7['textProviderProfileId'],
            allowDeveloperPromptModes: _0x37f2f7['developerModeAvailable'],
          });
      if (!_0x3c7e1a['ok']) throw new Error(_0x3c7e1a['error']);
      if (typeof _0x41f9b4 !== 'function') throw new Error('剧情 Agent 尚未初始化');
      return _0x41f9b4({
        ..._0x3c7e1a,
        model: _0x3c7e1a['model'] || _0x3c7e1a['modelId'],
        fileName: _0x3c7e1a['fileName'] || _0x3c7e1a['scriptFileName'],
        planning: _0x3c7e1a['planning'] || {
          episodeCount: _0x3c7e1a['episodeCount'],
          sceneMaxSeconds: _0x3c7e1a['sceneMaxSeconds'],
          promptMode: _0x3c7e1a['promptMode'],
        },
        request: _0x2e32b2,
      });
    },
    authorizePaidRetry: _0x34d633,
    createPersistedRun: _0x57c6d9,
    generateFromHome: _0x7d5541,
    regenerateSummary: _0x59abc1,
  };
}
