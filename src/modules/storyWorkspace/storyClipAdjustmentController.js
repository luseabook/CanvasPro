import { sanitizePromptHtmlForCommit } from '../nodePromptShared.js';
import {
  applyStoryClipAdjustmentCandidate,
  buildStoryClipAdjustmentGenerationKey,
  clearStoryClipAdjustmentUndo,
  discardStoryClipAdjustmentCandidate,
  getStoryClipPromptLockedTokens,
  restoreStoryClipPromptHistoryEntry,
  serializeStoryClipPromptElement,
  setStoryClipAdjustmentCandidate,
} from './storyClipAdjustment.js';
import { renderStoryClipPromptMentions } from './storyClipMentions.js';
import { formatStoryClockDuration, normalizeDurationSeconds } from './storyPlanningData.js';
import { isStoryMinimaxH3PromptMode, normalizeStoryPromptMode } from './storyPromptModes.js';
import { normalizeStorySceneMaxSeconds } from './storyProjectPlanning.js';
import { normalizeStoryPromptLanguage } from '../../domain/storyGeneration/promptLanguage.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function createStoryClipAdjustmentController({
  state: state,
  root: root,
  documentObject: documentObject = globalThis['document'],
  adjustClipPrompt: adjustClipPrompt = null,
  getSelection: getSelection = () => ({ episode: null, clip: null }),
  projectTasks: projectTasks = {},
  applyClipVideoSettings: applyClipVideoSettings = () => {},
  schedulePersistence: schedulePersistence = () => {},
  render: render = () => {},
  refreshPromptRestore: refreshPromptRestore = () => ![],
  refreshReferenceSummary: refreshReferenceSummary = () => {},
  refreshTimeline: refreshTimeline = () => {},
  notifyTextTaskComplete: notifyTextTaskComplete = () => {},
  showToast: showToast = () => {},
  showTaskApiKeyError: showTaskApiKeyError = () => ![],
  showTaskResultToast: showTaskResultToast = () => ![],
} = {}) {
  const run = projectTasks['createToken'] || (() => null),
    handler = projectTasks['isLive'] || (() => ![]),
    handler2 = projectTasks['isCurrent'] || (() => ![]),
    handler3 = projectTasks['syncEntry'] || (() => ![]),
    map = new Map();
  function run2(item, key) {
    if (map['get'](item) !== key) return;
    (map['delete'](item),
      (state['clipAdjustmentGeneratingIds'] = (state['clipAdjustmentGeneratingIds'] || [])['filter'](
        (index) => index !== item,
      )));
  }
  function resetUi({ close: close = ![] } = {}) {
    if (close) state['clipAdjustmentOpen'] = ![];
    ((state['clipAdjustmentInstruction'] = ''),
      (state['clipAdjustmentPromptMode'] = ''),
      (state['clipAdjustmentPromptModeOpen'] = ![]),
      (state['clipAdjustmentLanguage'] = ''),
      (state['clipAdjustmentLanguageOpen'] = ![]),
      (state['clipPromptHistoryOpen'] = ![]));
  }
  function run3(result = '') {
    const el = documentObject['createElement']('div');
    return ((el['innerHTML'] = String(result || '')), el);
  }
  function sourceOverride2(data) {
    const el2 =
        data['id'] === state['selectedClipId'] ? root?.['querySelector']?.('[data-story-clip-prompt]') : null,
      sourcePromptHtml = el2
        ? sanitizePromptHtmlForCommit(el2['innerHTML'])
        : sanitizePromptHtmlForCommit(
            renderStoryClipPromptMentions(data?.['prompt'] || '', {
              assets: state['data']?.['assets'] || [],
              episode: getSelection()['episode'],
              clipFrames: state['data']?.['clipFrames'] || [],
            }),
          ),
      options = el2 || run3(sourcePromptHtml);
    return {
      sourcePromptHtml: sourcePromptHtml,
      sourcePromptText: serializeStoryClipPromptElement(options),
      lockedTokens: getStoryClipPromptLockedTokens(options),
      officialPromptHtml: sanitizePromptHtmlForCommit(data?.['prompt'] || ''),
    };
  }
  function contextOverride2(targetLocale, clipTitle) {
    const projectTitle = state['data']?.['project'] || {};
    return {
      projectTitle: projectTitle['title'],
      sourceMode: projectTitle['sourceMode'],
      targetLocale:
        targetLocale?.['replication']?.['targetLocale'] ||
        projectTitle['replication']?.['targetLocale'] ||
        'source',
      sourceLanguage: targetLocale?.['replication']?.['sourceAnalysis']?.['sourceLanguage'] || '',
      storySummary: projectTitle['summary'],
      episodeNumber: targetLocale?.['number'],
      episodeTitle: targetLocale?.['title'],
      episodeSynopsis: targetLocale?.['synopsis'],
      clipTitle: clipTitle?.['title'],
      clipScript: clipTitle?.['script'],
      creativeIntent: clipTitle?.['creativeIntent'],
      transition: clipTitle?.['transition'],
    };
  }
  function run4(enabled) {
    if (!enabled) return ![];
    const target = (enabled['clips'] || [])['reduce'](
      (source, next) =>
        source +
        normalizeDurationSeconds(next?.['durationSec'] || next?.['durationSeconds'] || next?.['duration']),
      0x0,
    );
    return (
      (enabled['durationSec'] = Number(target['toFixed'](0x1))),
      (enabled['duration'] = formatStoryClockDuration(enabled['durationSec'])),
      !![]
    );
  }
  async function run5({
    instructionOverride: instructionOverride = '',
    promptModeOverride: promptModeOverride = '',
    languageOverride: languageOverride = '',
    selectionOverride: selectionOverride = null,
    sourceOverride: sourceOverride = null,
    contextOverride: contextOverride = null,
    projectTokenOverride: projectTokenOverride = null,
    execution: execution = {
      model: state['models']['text'],
      provider: state['textProvider'],
      providerProfileId: state['textProviderProfileId'],
    },
    reserved: reserved = ![],
    reservation: reservation = null,
    reopenOnError: reopenOnError = !![],
  } = {}) {
    if (typeof adjustClipPrompt !== 'function') return (showToast('AI 调整服务尚未初始化。', 'error'), ![]);
    const { episode: episode, clip: clip } = selectionOverride || getSelection();
    if (!episode || !clip) return ![];
    const clipId = normalizeText(clip['id']),
      map2 = new Set(
        (Array['isArray'](state['clipAdjustmentGeneratingIds']) ? state['clipAdjustmentGeneratingIds'] : [])[
          'map'
        ]((current) => normalizeText(current)),
      ),
      storyClipAdjustmentGenerationKey = buildStoryClipAdjustmentGenerationKey(
        projectTokenOverride?.['data']?.['project']?.['id'] || state['data']?.['project']?.['id'],
        episode['id'],
        clipId,
      );
    if (!storyClipAdjustmentGenerationKey || (!reserved && map2['has'](storyClipAdjustmentGenerationKey)))
      return ![];
    const instruction = normalizeText(
        reserved ? instructionOverride : instructionOverride || state['clipAdjustmentInstruction'],
      ),
      sourcePromptMode = normalizeStoryPromptMode(
        clip['promptMode'] ||
          episode['promptMode'] ||
          (projectTokenOverride?.['data'] || state['data'])['project']?.['planning']?.['promptMode'],
        { allowDeveloperModes: !![] },
      ),
      targetPromptMode = normalizeStoryPromptMode(
        promptModeOverride || (!reserved && state['clipAdjustmentPromptMode']) || sourcePromptMode,
        { allowDeveloperModes: !![] },
      ),
      enabled2 = targetPromptMode !== sourcePromptMode,
      entry = clip['requiredDialogueLanguage'] || '',
      targetLanguage = normalizeStoryPromptLanguage(
        (reserved ? languageOverride : languageOverride || state['clipAdjustmentLanguage']) || entry,
      );
    if (!instruction && !enabled2 && !targetLanguage)
      return (
        showToast('请选择提示词模式、转换语言，或填写调整要求。', 'warn'),
        root?.['querySelector']?.('[data-story-clip-adjustment-instruction]')?.['focus'](),
        ![]
      );
    const currentPrompt = sourceOverride || sourceOverride2(clip);
    if (!currentPrompt['sourcePromptText'])
      return (showToast('当前片段还没有可调整的视频提示词。', 'warn'), ![]);
    const sourceMode = projectTokenOverride || run();
    if (!handler(sourceMode)) return ![];
    const episodeId = episode['id'],
      sourceDurationSeconds = normalizeDurationSeconds(
        clip['durationSec'] || clip['durationSeconds'] || clip['duration'],
      ),
      storySceneMaxSeconds = normalizeStorySceneMaxSeconds(
        sourceMode['data']['project']?.['planning']?.['sceneMaxSeconds'],
      ),
      maxDurationSeconds = isStoryMinimaxH3PromptMode(targetPromptMode)
        ? Math['min'](0xf, storySceneMaxSeconds)
        : storySceneMaxSeconds;
    (map2['add'](storyClipAdjustmentGenerationKey), (state['clipAdjustmentGeneratingIds'] = [...map2]));
    handler2(sourceMode) &&
      ((state['clipAdjustmentOpen'] = ![]),
      (state['clipAdjustmentInstruction'] = ''),
      (state['clipAdjustmentPromptModeOpen'] = ![]),
      (state['clipAdjustmentLanguageOpen'] = ![]),
      (state['clipPromptHistoryOpen'] = ![]));
    if (!reserved) render();
    try {
      const preserveDuration = Boolean(targetLanguage && !instruction && !enabled2),
        promptText = await adjustClipPrompt({
          project: { sourceMode: sourceMode['data']['project']?.['sourceMode'] },
          scope: 'prompt',
          instruction: instruction,
          currentPrompt: currentPrompt['sourcePromptText'],
          selection: null,
          preserveAssetRefs: !![],
          preserveDuration: preserveDuration,
          lockedAssetTokens: currentPrompt['lockedTokens']['assetTokens'],
          lockedDurationTokens: preserveDuration ? currentPrompt['lockedTokens']['durationTokens'] : [],
          duration: clip['duration'],
          maxDurationSeconds: maxDurationSeconds,
          context: contextOverride || contextOverride2(episode, clip),
          sourcePromptMode: sourcePromptMode,
          targetPromptMode: targetPromptMode,
          targetLanguage: targetLanguage || clip['promptLanguage'],
          ...execution,
        });
      if (!handler(sourceMode)) return ![];
      const episode2 = sourceMode['data']['episodes']['find']((record) => record['id'] === episodeId),
        enabled3 = episode2?.['clips']?.['find']((payload) => payload['id'] === clipId);
      if (!enabled3) return ![];
      if ((enabled3['requiredDialogueLanguage'] || '') !== entry)
        throw new Error('对白语言设置已变化，请按最新语言重新调整提示词。');
      const promptHtml = sanitizePromptHtmlForCommit(
        renderStoryClipPromptMentions(promptText['candidateText'], {
          assets: sourceMode['data']['assets'],
          episode: episode2,
          clipFrames: sourceMode['data']['clipFrames'],
        }),
      );
      return (
        setStoryClipAdjustmentCandidate(enabled3, {
          id: 'candidate-' + Date['now'](),
          scope: 'prompt',
          instruction: instruction,
          promptText: promptText['candidateText'],
          promptHtml: promptHtml,
          sourcePromptHtml: currentPrompt['officialPromptHtml'],
          preserveAssetRefs: !![],
          preserveDuration: preserveDuration,
          sourceDurationSeconds: sourceDurationSeconds,
          candidateDurationSeconds: promptText['candidateDurationSeconds'],
          sourcePromptMode: sourcePromptMode,
          targetPromptMode: targetPromptMode,
          targetLanguage: targetLanguage || clip['promptLanguage'] || '',
          maxDurationSeconds: maxDurationSeconds,
          modelId: execution['model'],
          provider: execution['provider'],
          createdAt: Date['now'](),
        }),
        handler3(sourceMode),
        schedulePersistence({ immediate: !![] }),
        handler2(sourceMode) &&
          state['selectedClipId'] === clipId &&
          ((state['clipAdjustmentOpen'] = ![]),
          (state['clipAdjustmentInstruction'] = ''),
          (state['clipAdjustmentPromptMode'] = ''),
          (state['clipAdjustmentPromptModeOpen'] = ![]),
          (state['clipAdjustmentLanguage'] = ''),
          (state['clipAdjustmentLanguageOpen'] = ![])),
        notifyTextTaskComplete(
          'AI 调整完成，请在右侧选择提示词版本。',
          sourceMode,
          { episodeId: episodeId, clipId: clipId },
          { notificationMessage: '片段视频提示词 AI 调整完成。' },
        ),
        !![]
      );
    } catch (error) {
      if (!handler(sourceMode)) return ![];
      const showTaskApiKeyError2 = showTaskApiKeyError(error, {
        provider: execution['provider'],
        modelId: execution['model'],
      });
      return (
        !showTaskApiKeyError2 &&
          showTaskResultToast(error?.['message'] || '候选版本生成失败。', 'error', error),
        reopenOnError &&
          handler2(sourceMode) &&
          state['selectedClipId'] === clipId &&
          ((state['clipAdjustmentOpen'] = !![]),
          (state['clipAdjustmentInstruction'] = instruction),
          (state['clipAdjustmentPromptMode'] = targetPromptMode),
          (state['clipAdjustmentLanguage'] = targetLanguage),
          (state['clipAdjustmentPromptModeOpen'] = ![])),
        ![]
      );
    } finally {
      run2(storyClipAdjustmentGenerationKey, reservation);
      if (handler2(sourceMode)) render();
    }
  }
  async function generateCandidate(args = {}) {
    const { episode: episode3, clip: clip2 } = getSelection();
    if (!episode3 || !clip2) return ![];
    const map3 = new Set(state['selectedClipGenerationIds'] || []),
      list =
        state['clipSelectionMode'] && !args['single']
          ? (episode3['clips'] || [])['filter']((handle) => map3['has'](handle['id']))
          : [clip2],
      instructionOverride2 = normalizeText(args['instructionOverride'] || state['clipAdjustmentInstruction']),
      promptModeOverride2 = args['promptModeOverride'] || state['clipAdjustmentPromptMode'],
      languageOverride2 = args['languageOverride'] || state['clipAdjustmentLanguage'];
    if (!list['length']) return (showToast('请先选择要调整提示词的片段。', 'warn'), ![]);
    const projectTokenOverride2 = run(),
      map4 = new Set(state['clipAdjustmentGeneratingIds'] || []),
      reopenOnError2 = list['flatMap']((args2) => {
        const key2 = buildStoryClipAdjustmentGenerationKey(
            state['data']?.['project']?.['id'],
            episode3['id'],
            args2['id'],
          ),
          config =
            args2['promptMode'] ||
            episode3['promptMode'] ||
            state['data']['project']?.['planning']?.['promptMode'];
        if (!key2 || map4['has'](key2)) return [];
        if (
          !instructionOverride2 &&
          !languageOverride2 &&
          (!promptModeOverride2 || promptModeOverride2 === config)
        )
          return [];
        return (
          map4['add'](key2),
          [
            {
              key: key2,
              selectionOverride: { episode: { ...episode3 }, clip: { ...args2 } },
              sourceOverride: sourceOverride2(args2),
              contextOverride: contextOverride2(episode3, args2),
            },
          ]
        );
      });
    if (!reopenOnError2['length'])
      return (
        showToast('请选择转换语言、不同的提示词模式或填写要求；正在调整的片段不会重复提交。', 'info'),
        ![]
      );
    const execution2 = {
        model: state['models']['text'],
        provider: state['textProvider'],
        providerProfileId: state['textProviderProfileId'],
      },
      reservation2 = Symbol('clip-adjustment-batch');
    (reopenOnError2['forEach']((event) => map['set'](event['key'], reservation2)),
      (state['clipAdjustmentGeneratingIds'] = [...map4]),
      (state['clipAdjustmentOpen'] = ![]),
      render());
    let scope = 0x0;
    const list2 = [];
    try {
      return (
        await Promise['all'](
          Array['from']({ length: Math['min'](0x3, reopenOnError2['length']) }, async () => {
            while (scope < reopenOnError2['length']) {
              const args3 = reopenOnError2[scope++];
              if (!handler(projectTokenOverride2)) break;
              list2['push'](
                await run5({
                  ...args,
                  ...args3,
                  instructionOverride: instructionOverride2,
                  promptModeOverride: promptModeOverride2,
                  languageOverride: languageOverride2,
                  execution: execution2,
                  reserved: !![],
                  reservation: reservation2,
                  projectTokenOverride: projectTokenOverride2,
                  reopenOnError: reopenOnError2['length'] === 0x1 && args['reopenOnError'] !== ![],
                }),
              );
            }
          }),
        ),
        list2['some'](Boolean)
      );
    } finally {
      reopenOnError2['forEach']((event2) => run2(event2['key'], reservation2));
      if (handler2(projectTokenOverride2)) render();
    }
  }
  function applySelected() {
    const { episode: episode4, clip: clip3 } = getSelection(),
      enabled4 = clip3?.['promptAdjustment']?.['candidate'];
    if (!clip3 || !enabled4) return ![];
    if (
      sanitizePromptHtmlForCommit(clip3['prompt'] || '') !==
      sanitizePromptHtmlForCommit(enabled4['sourcePromptHtml'] || '')
    )
      return (showToast('当前提示词已变化，请基于最新内容重新生成候选。', 'warn'), ![]);
    if (!applyStoryClipAdjustmentCandidate(clip3))
      return (showToast('候选提示词语言与最新对白语言不一致，请重新选择语言并调整。', 'warn'), ![]);
    return (
      clearStoryClipAdjustmentUndo(clip3),
      run4(episode4),
      applyClipVideoSettings(clip3),
      resetUi({ close: !![] }),
      schedulePersistence({ immediate: !![] }),
      render(),
      showToast('已使用 AI 调整后的提示词。', 'success'),
      !![]
    );
  }
  function restorePromptHistory(input) {
    const { episode: episode5, clip: clip4 } = getSelection();
    if (!clip4) return ![];
    const el3 = root?.['querySelector']?.('[data-story-clip-prompt]');
    el3 && (clip4['prompt'] = sanitizePromptHtmlForCommit(el3['innerHTML']));
    const restoreStoryClipPromptHistoryEntry2 = restoreStoryClipPromptHistoryEntry(clip4, input);
    if (!restoreStoryClipPromptHistoryEntry2) return ![];
    (run4(episode5), resetUi({ close: !![] }), schedulePersistence({ immediate: !![] }));
    if (!refreshPromptRestore()) render();
    return (
      refreshReferenceSummary(),
      refreshTimeline(),
      showToast('已恢复提示词历史版本。', 'success'),
      !![]
    );
  }
  function discardSelected() {
    const { clip: clip5 } = getSelection();
    if (!discardStoryClipAdjustmentCandidate(clip5)) return ![];
    return (
      resetUi({ close: !![] }),
      schedulePersistence({ immediate: !![] }),
      render(),
      showToast('已保留原提示词版本。', 'info'),
      !![]
    );
  }
  function regenerateSelected() {
    const { clip: clip6 } = getSelection(),
      instructionOverride3 = clip6?.['promptAdjustment']?.['candidate'];
    if (!instructionOverride3) return ![];
    return (
      void generateCandidate({
        instructionOverride:
          instructionOverride3['instruction'] || '保持人物、场景和素材引用不变，重新生成一个提示词版本。',
        promptModeOverride: instructionOverride3['targetPromptMode'],
        languageOverride: instructionOverride3['targetLanguage'],
        single: !![],
        reopenOnError: ![],
      }),
      !![]
    );
  }
  return Object['freeze']({
    applySelected: applySelected,
    discardSelected: discardSelected,
    generateCandidate: generateCandidate,
    regenerateSelected: regenerateSelected,
    resetUi: resetUi,
    restorePromptHistory: restorePromptHistory,
  });
}
