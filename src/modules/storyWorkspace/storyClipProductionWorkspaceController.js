import { resolveAssetMentionRef } from '../assetMentionRegistry.js';
import { prependStoryDialogueLanguageConstraint } from '../../domain/storyGeneration/promptLanguage.js';
import { resolvePromptTextWithTextRefs } from '../nodePromptShared.js';
import { assertStoryEpisodeProductionCurrent } from './storyScriptRevision.js';
import { applyStoryClipDialogueVoiceGuidance } from './storyPlanningData.js';
import {
  getStoryAssetIdFromMentionNodeId,
  getStoryEpisodeCharacterVoiceEnabled,
  renderStoryClipPromptMentions,
  resolveStoryClipAssetMentionRefs,
} from './storyClipMentions.js';
import { storyClipProduction } from './storyClipProduction.js';
import { isStoryMinimaxH3PromptMode, serializeStoryPromptForMode } from './storyPromptModes.js';
import { resolveStoryClipVideoGenerationSettings } from './storyVideoGenerationSettings.js';
import { resolveStoryVideoReplicationClipVoiceAssetIds } from './storyVideoReplication.js';
function normalizeText(_0x53aada) {
  return String(_0x53aada ?? '')['trim']();
}
export function createStoryClipProductionWorkspaceController({
  state: _0x2d82a7,
  root: _0x31fab9,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
  activeControllers: _0x4fde8c,
  projectTasks: _0x2e4bfe,
  createGenerationController: _0xab2428,
  render: _0x343876,
  refreshGeneration: _0x4d42ae,
  persistWorkspaceNow: _0x59e32b,
  schedulePersistence: _0xad2636,
  showToast: _0x2fd151,
  showTaskApiKeyError: _0x80667,
  showTaskResultToast: _0x3b5488,
  showNavigableTaskResultToast: _0x58d5b1,
  notifyNavigableGenerationComplete: _0x463684,
} = {}) {
  if (
    !_0x2d82a7 ||
    !_0x31fab9 ||
    !documentObject ||
    !(_0x4fde8c instanceof Map) ||
    typeof _0x2e4bfe?.['createToken'] !== 'function' ||
    typeof _0x2e4bfe?.['isLive'] !== 'function' ||
    typeof _0x2e4bfe?.['isCurrent'] !== 'function' ||
    typeof _0x2e4bfe?.['register'] !== 'function' ||
    typeof _0x2e4bfe?.['createBatch'] !== 'function' ||
    typeof _0x2e4bfe?.['syncBatch'] !== 'function' ||
    typeof _0xab2428 !== 'function' ||
    typeof _0x343876 !== 'function' ||
    typeof _0x4d42ae !== 'function' ||
    typeof _0x59e32b !== 'function' ||
    typeof _0xad2636 !== 'function' ||
    typeof _0x2fd151 !== 'function' ||
    typeof _0x80667 !== 'function' ||
    typeof _0x3b5488 !== 'function' ||
    typeof _0x58d5b1 !== 'function' ||
    typeof _0x463684 !== 'function'
  )
    throw new TypeError(
      'Story clip production requires task, generation, persistence, and presentation adapters.',
    );
  function _0x5eca45(_0x2759a0 = {}) {
    if (_0x2759a0['type'] === 'selection-missing') return (_0x2fd151('请先选择要生成的片段。', 'warn'), !![]);
    if (_0x2759a0['type'] === 'empty-prompt') return (_0x2fd151('请先填写视频提示词。', 'warn'), !![]);
    if (_0x2759a0['type'] === 'provider-error')
      return _0x80667(_0x2759a0['error'], { providerId: _0x2759a0['provider'], model: _0x2759a0['modelId'] });
    if (_0x2759a0['type'] === 'single-failed') {
      const _0x568dc8 = _0x80667(_0x2759a0['error'], {
        providerId: _0x2759a0['provider'],
        model: _0x2759a0['modelId'],
      });
      return (
        !_0x568dc8 &&
          _0x3b5488(
            _0x2759a0['error']?.['getUserMessage']?.() ||
              _0x2759a0['error']?.['message'] ||
              '片段视频生成失败。',
            'error',
            _0x2759a0['error'],
          ),
        !![]
      );
    }
    if (_0x2759a0['type'] === 'single-complete')
      return (
        (_0x2759a0['result']?.['status'] === 'success' || _0x2759a0['result']?.['ok'] === !![]) &&
          _0x58d5b1('片段视频生成完成。', 'success', _0x2759a0['projectToken'], {
            episodeId: _0x2759a0['episodeId'],
            clipId: _0x2759a0['clipId'],
          }),
        !![]
      );
    if (_0x2759a0['type'] === 'batch-complete') {
      if (_0x2759a0['cancelRequested'])
        return (
          _0x58d5b1(
            '批量生成已停止：完成 ' +
              _0x2759a0['succeeded'] +
              ' 个，失败 ' +
              _0x2759a0['failed'] +
              '\x20个，停止\x20' +
              _0x2759a0['cancelled'] +
              '\x20个。',
            _0x2759a0['failed'] ? 'warn' : 'info',
            _0x2759a0['projectToken'],
            { episodeId: _0x2759a0['episodeId'], clipId: _0x2759a0['clipId'] },
          ),
          !![]
        );
      const _0x21c14d =
        _0x2759a0['firstFailure']?.['reason'] === 'empty-prompt'
          ? '部分片段缺少视频提示词。'
          : _0x2759a0['firstFailure']?.['error']?.['getUserMessage']?.() ||
            _0x2759a0['firstFailure']?.['error']?.['message'] ||
            '部分片段生成失败。';
      return (
        _0x463684(
          _0x2759a0['failed']
            ? '完成\x20' + _0x2759a0['succeeded'] + ' 个，失败 ' + _0x2759a0['failed'] + ' 个。' + _0x21c14d
            : '已完成 ' + _0x2759a0['succeeded'] + ' 个片段视频。',
          _0x2759a0['projectToken'],
          { episodeId: _0x2759a0['episodeId'], clipId: _0x2759a0['clipId'] },
          {
            tone: _0x2759a0['failed'] ? 'warn' : 'success',
            details: _0x2759a0['firstFailure']?.['error'] || _0x2759a0['firstFailure'],
            showResultToast: _0x2759a0['suppressToast'] !== !![],
          },
        ),
        !![]
      );
    }
    return ![];
  }
  function _0x12ce77(_0x1e1662, _0x31f50a, _0x19dd0e = null, _0x406652 = _0x2d82a7['data']) {
    assertStoryEpisodeProductionCurrent(_0x1e1662);
    const _0x52a101 = _0x19dd0e || documentObject['createElement']('div');
    !_0x19dd0e &&
      (_0x52a101['innerHTML'] = renderStoryClipPromptMentions(_0x31f50a?.['prompt'] || '', {
        assets: _0x406652['assets'],
        episode: _0x1e1662,
        clipFrames: _0x406652['clipFrames'],
      }));
    const _0x3f28d4 = [],
      _0x529389 = resolveStoryVideoReplicationClipVoiceAssetIds(_0x406652, _0x31f50a),
      _0x13f279 = _0x529389 == null ? null : new Set(_0x529389),
      _0x1b4a62 = (_0xa78723) => {
        if (_0x13f279 && !_0x13f279['has'](_0xa78723)) return ![];
        return getStoryEpisodeCharacterVoiceEnabled(_0x1e1662, _0xa78723);
      },
      _0x359d19 = resolvePromptTextWithTextRefs({
        promptEl: _0x52a101,
        assetInputRefs: _0x3f28d4,
        assetMediaCounts: { image: 0x0, video: 0x0, audio: 0x0 },
        allowedAssetTypes: ['text', 'image', 'video', 'audio'],
        resolveAssetMentionRef: (_0x4ac8e6) =>
          resolveStoryClipAssetMentionRefs(_0x4ac8e6, _0x406652['assets'], {
            voiceEnabled: _0x1b4a62(getStoryAssetIdFromMentionNodeId(_0x4ac8e6['dataset']?.['assetId'])),
            clipFrames: _0x406652['clipFrames'],
            resolveExternalAssetRef: resolveAssetMentionRef,
          }),
        dedupeAssetMentions: !![],
      }),
      _0x54dccb =
        _0x406652['project']?.['sourceMode'] === 'video-replication'
          ? applyStoryClipDialogueVoiceGuidance(_0x359d19, _0x31f50a, _0x406652['assets'])
          : _0x359d19,
      _0x49c435 =
        _0x31f50a?.['promptMode'] ||
        _0x1e1662?.['promptMode'] ||
        _0x406652['project']?.['planning']?.['promptMode'];
    if (
      isStoryMinimaxH3PromptMode(_0x49c435) &&
      !_0x3f28d4['some']((_0x3faf09) => ['image', 'video']['includes'](_0x3faf09?.['type']))
    )
      for (let _0x54c3ee = _0x3f28d4['length'] - 0x1; _0x54c3ee >= 0x0; _0x54c3ee -= 0x1) {
        if (_0x3f28d4[_0x54c3ee]?.['type'] === 'audio') _0x3f28d4['splice'](_0x54c3ee, 0x1);
      }
    return {
      prompt: prependStoryDialogueLanguageConstraint(serializeStoryPromptForMode(_0x54dccb, _0x49c435), {
        clip: _0x31f50a,
        episode: _0x1e1662,
        project: _0x406652['project'],
      }),
      assetInputRefs: _0x3f28d4,
    };
  }
  const _0x1819d5 = storyClipProduction['createRuntime']({
    state: _0x2d82a7,
    projectAdapter: _0x2e4bfe,
    generationAdapter: {
      controllers: _0x4fde8c,
      resolvePrompt: ({
        episode: _0x1d5b0e,
        clip: _0x25ee9e,
        displayedClip: _0x3ad371,
        projectToken: _0x52dd6d,
      }) => {
        const _0xa6f4b8 =
          normalizeText(_0x25ee9e?.['id']) === normalizeText(_0x3ad371?.['id'])
            ? _0x31fab9['querySelector']('[data-story-clip-prompt]')
            : null;
        return _0x12ce77(_0x1d5b0e, _0x25ee9e, _0xa6f4b8, _0x52dd6d['data']);
      },
      resolveSettings: ({ clip: _0x27576e, projectToken: _0x483630 }) =>
        resolveStoryClipVideoGenerationSettings(_0x27576e, _0x483630, {
          fallbackModelId: _0x2d82a7['models']['video'],
          fallbackProvider: _0x2d82a7['videoProvider'],
        }),
      resolveInstallId: async () => {
        let _0x4c5c65 = normalizeText(windowObject?.['__aicInstallId'] || globalThis['__aicInstallId']);
        if (typeof windowObject?.['ensureSubscriptionInstallId'] === 'function')
          try {
            _0x4c5c65 = normalizeText(await windowObject['ensureSubscriptionInstallId']()) || _0x4c5c65;
          } catch {}
        return _0x4c5c65;
      },
      createController: ({
        episode: _0x5263e6,
        clip: _0x2f16b9,
        projectToken: _0x3bc673,
        batch: _0x4d603d,
      }) => _0xab2428(_0x3bc673, _0x5263e6['id'], _0x2f16b9['id'], _0x2f16b9, _0x4d603d),
    },
    projectionAdapter: {
      render: _0x343876,
      refreshGeneration: _0x4d42ae,
      persist: ({ immediate: immediate = ![] } = {}) => {
        if (immediate) return _0x59e32b();
        return (_0xad2636(), Promise['resolve'](!![]));
      },
      present: _0x5eca45,
    },
  });
  return {
    cancelBatch: () => _0x1819d5['cancelBatch'](),
    generateSelection: () => _0x1819d5['generateSelection'](),
    present: _0x5eca45,
    resolveGenerationPrompt: _0x12ce77,
    runtime: _0x1819d5,
  };
}
