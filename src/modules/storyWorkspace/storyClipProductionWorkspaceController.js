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
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function createStoryClipProductionWorkspaceController({
  state: state,
  root: root,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
  activeControllers: activeControllers,
  projectTasks: projectTasks,
  createGenerationController: createGenerationController,
  render: render,
  refreshGeneration: refreshGeneration,
  persistWorkspaceNow: persistWorkspaceNow,
  schedulePersistence: schedulePersistence,
  showToast: showToast,
  showTaskApiKeyError: showTaskApiKeyError,
  showTaskResultToast: showTaskResultToast,
  showNavigableTaskResultToast: showNavigableTaskResultToast,
  notifyNavigableGenerationComplete: notifyNavigableGenerationComplete,
} = {}) {
  if (
    !state ||
    !root ||
    !documentObject ||
    !(activeControllers instanceof Map) ||
    typeof projectTasks?.['createToken'] !== 'function' ||
    typeof projectTasks?.['isLive'] !== 'function' ||
    typeof projectTasks?.['isCurrent'] !== 'function' ||
    typeof projectTasks?.['register'] !== 'function' ||
    typeof projectTasks?.['createBatch'] !== 'function' ||
    typeof projectTasks?.['syncBatch'] !== 'function' ||
    typeof createGenerationController !== 'function' ||
    typeof render !== 'function' ||
    typeof refreshGeneration !== 'function' ||
    typeof persistWorkspaceNow !== 'function' ||
    typeof schedulePersistence !== 'function' ||
    typeof showToast !== 'function' ||
    typeof showTaskApiKeyError !== 'function' ||
    typeof showTaskResultToast !== 'function' ||
    typeof showNavigableTaskResultToast !== 'function' ||
    typeof notifyNavigableGenerationComplete !== 'function'
  )
    throw new TypeError(
      'Story clip production requires task, generation, persistence, and presentation adapters.',
    );
  function present(providerId = {}) {
    if (providerId['type'] === 'selection-missing')
      return (showToast('请先选择要生成的片段。', 'warn'), !![]);
    if (providerId['type'] === 'empty-prompt') return (showToast('请先填写视频提示词。', 'warn'), !![]);
    if (providerId['type'] === 'provider-error')
      return showTaskApiKeyError(providerId['error'], {
        providerId: providerId['provider'],
        model: providerId['modelId'],
      });
    if (providerId['type'] === 'single-failed') {
      const enabled = showTaskApiKeyError(providerId['error'], {
        providerId: providerId['provider'],
        model: providerId['modelId'],
      });
      return (
        !enabled &&
          showTaskResultToast(
            providerId['error']?.['getUserMessage']?.() ||
              providerId['error']?.['message'] ||
              '片段视频生成失败。',
            'error',
            providerId['error'],
          ),
        !![]
      );
    }
    if (providerId['type'] === 'single-complete')
      return (
        (providerId['result']?.['status'] === 'success' || providerId['result']?.['ok'] === !![]) &&
          showNavigableTaskResultToast('片段视频生成完成。', 'success', providerId['projectToken'], {
            episodeId: providerId['episodeId'],
            clipId: providerId['clipId'],
          }),
        !![]
      );
    if (providerId['type'] === 'batch-complete') {
      if (providerId['cancelRequested'])
        return (
          showNavigableTaskResultToast(
            '批量生成已停止：完成 ' +
              providerId['succeeded'] +
              ' 个，失败 ' +
              providerId['failed'] +
              '\x20个，停止\x20' +
              providerId['cancelled'] +
              '\x20个。',
            providerId['failed'] ? 'warn' : 'info',
            providerId['projectToken'],
            { episodeId: providerId['episodeId'], clipId: providerId['clipId'] },
          ),
          !![]
        );
      const item =
        providerId['firstFailure']?.['reason'] === 'empty-prompt'
          ? '部分片段缺少视频提示词。'
          : providerId['firstFailure']?.['error']?.['getUserMessage']?.() ||
            providerId['firstFailure']?.['error']?.['message'] ||
            '部分片段生成失败。';
      return (
        notifyNavigableGenerationComplete(
          providerId['failed']
            ? '完成\x20' + providerId['succeeded'] + ' 个，失败 ' + providerId['failed'] + ' 个。' + item
            : '已完成 ' + providerId['succeeded'] + ' 个片段视频。',
          providerId['projectToken'],
          { episodeId: providerId['episodeId'], clipId: providerId['clipId'] },
          {
            tone: providerId['failed'] ? 'warn' : 'success',
            details: providerId['firstFailure']?.['error'] || providerId['firstFailure'],
            showResultToast: providerId['suppressToast'] !== !![],
          },
        ),
        !![]
      );
    }
    return ![];
  }
  function resolveGenerationPrompt(episode, clip, enabled2 = null, assets = state['data']) {
    assertStoryEpisodeProductionCurrent(episode);
    const promptEl = enabled2 || documentObject['createElement']('div');
    !enabled2 &&
      (promptEl['innerHTML'] = renderStoryClipPromptMentions(clip?.['prompt'] || '', {
        assets: assets['assets'],
        episode: episode,
        clipFrames: assets['clipFrames'],
      }));
    const assetInputRefs = [],
      storyVideoReplicationClipVoiceAssetIds = resolveStoryVideoReplicationClipVoiceAssetIds(assets, clip),
      map =
        storyVideoReplicationClipVoiceAssetIds == null
          ? null
          : new Set(storyVideoReplicationClipVoiceAssetIds),
      voiceEnabled = (key) => {
        if (map && !map['has'](key)) return ![];
        return getStoryEpisodeCharacterVoiceEnabled(episode, key);
      },
      promptTextWithTextRefs = resolvePromptTextWithTextRefs({
        promptEl: promptEl,
        assetInputRefs: assetInputRefs,
        assetMediaCounts: { image: 0x0, video: 0x0, audio: 0x0 },
        allowedAssetTypes: ['text', 'image', 'video', 'audio'],
        resolveAssetMentionRef: (el) =>
          resolveStoryClipAssetMentionRefs(el, assets['assets'], {
            voiceEnabled: voiceEnabled(getStoryAssetIdFromMentionNodeId(el['dataset']?.['assetId'])),
            clipFrames: assets['clipFrames'],
            resolveExternalAssetRef: resolveAssetMentionRef,
          }),
        dedupeAssetMentions: !![],
      }),
      index =
        assets['project']?.['sourceMode'] === 'video-replication'
          ? applyStoryClipDialogueVoiceGuidance(promptTextWithTextRefs, clip, assets['assets'])
          : promptTextWithTextRefs,
      result =
        clip?.['promptMode'] || episode?.['promptMode'] || assets['project']?.['planning']?.['promptMode'];
    if (
      isStoryMinimaxH3PromptMode(result) &&
      !assetInputRefs['some']((data) => ['image', 'video']['includes'](data?.['type']))
    )
      for (let count = assetInputRefs['length'] - 0x1; count >= 0x0; count -= 0x1) {
        if (assetInputRefs[count]?.['type'] === 'audio') assetInputRefs['splice'](count, 0x1);
      }
    return {
      prompt: prependStoryDialogueLanguageConstraint(serializeStoryPromptForMode(index, result), {
        clip: clip,
        episode: episode,
        project: assets['project'],
      }),
      assetInputRefs: assetInputRefs,
    };
  }
  const runtime = storyClipProduction['createRuntime']({
    state: state,
    projectAdapter: projectTasks,
    generationAdapter: {
      controllers: activeControllers,
      resolvePrompt: ({
        episode: episode2,
        clip: clip2,
        displayedClip: displayedClip,
        projectToken: projectToken,
      }) => {
        const text =
          normalizeText(clip2?.['id']) === normalizeText(displayedClip?.['id'])
            ? root['querySelector']('[data-story-clip-prompt]')
            : null;
        return resolveGenerationPrompt(episode2, clip2, text, projectToken['data']);
      },
      resolveSettings: ({ clip: clip3, projectToken: projectToken2 }) =>
        resolveStoryClipVideoGenerationSettings(clip3, projectToken2, {
          fallbackModelId: state['models']['video'],
          fallbackProvider: state['videoProvider'],
        }),
      resolveInstallId: async () => {
        let text2 = normalizeText(windowObject?.['__aicInstallId'] || globalThis['__aicInstallId']);
        if (typeof windowObject?.['ensureSubscriptionInstallId'] === 'function')
          try {
            text2 = normalizeText(await windowObject['ensureSubscriptionInstallId']()) || text2;
          } catch {}
        return text2;
      },
      createController: ({ episode: episode3, clip: clip4, projectToken: projectToken3, batch: batch }) =>
        createGenerationController(projectToken3, episode3['id'], clip4['id'], clip4, batch),
    },
    projectionAdapter: {
      render: render,
      refreshGeneration: refreshGeneration,
      persist: ({ immediate: immediate = ![] } = {}) => {
        if (immediate) return persistWorkspaceNow();
        return (schedulePersistence(), Promise['resolve'](!![]));
      },
      present: present,
    },
  });
  return {
    cancelBatch: () => runtime['cancelBatch'](),
    generateSelection: () => runtime['generateSelection'](),
    present: present,
    resolveGenerationPrompt: resolveGenerationPrompt,
    runtime: runtime,
  };
}
