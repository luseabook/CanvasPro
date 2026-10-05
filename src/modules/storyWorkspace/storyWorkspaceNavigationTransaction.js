import { isStoryVideoReplicationAssetLocalizationComplete } from './storyVideoReplication.js';
import { isStoryCollaborationProject } from './storyCollaborationPolicy.js';
const STORY_WORKSPACE_STEP_COUNT = 3;
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function cloneNavigationValue(item, key) {
  if (item === undefined) return key;
  try {
    return JSON['parse'](JSON['stringify'](item));
  } catch {
    return key;
  }
}
export function normalizeStoryWorkspaceStep(count) {
  if (count === 0 || count === '0') return 0;
  const index = Math['trunc'](Number(count) || 1);
  return Math['max'](1, Math['min'](STORY_WORKSPACE_STEP_COUNT, index));
}
export function canReuseStoryStepNavigation({
  view: view = '',
  hasNavigation: hasNavigation = false,
  isEpisodeToolbar: isEpisodeToolbar = false,
} = {}) {
  return view === 'project' && Boolean(hasNavigation) && !isEpisodeToolbar;
}
export function getStoryVideoEpisodes(list = []) {
  return Array['isArray'](list)
    ? list['filter']((result) => result && normalizeText(result?.['script']?.['fullText']) !== '')
    : [];
}
function normalizeStoryWorkspaceProjectData(data) {
  return data && typeof data === 'object' && !Array['isArray'](data) ? data : {};
}
export function getStoryWorkspaceStepBlockMessage(options = {}, target = 1) {
  const storyWorkspaceStep = normalizeStoryWorkspaceStep(target),
    storyWorkspaceProjectData = normalizeStoryWorkspaceProjectData(options);
  if (storyWorkspaceStep === 0)
    return isStoryCollaborationProject(storyWorkspaceProjectData) ? '' : '当前项目没有故事构思步骤。';
  if (storyWorkspaceProjectData['project']?.['collaboration']?.['stage'] === 'writing')
    return '请先确认故事构思中的正文。';
  if (storyWorkspaceStep === 1) return '';
  if (!getStoryVideoEpisodes(storyWorkspaceProjectData['episodes'])['length'])
    return '请先至少完成一集分集剧本正文。';
  if (
    storyWorkspaceStep === 3 &&
    storyWorkspaceProjectData['project']?.['sourceMode'] === 'video-replication' &&
    getStoryVideoEpisodes(storyWorkspaceProjectData['episodes'])['some'](
      (source) =>
        Array['isArray'](source['clips']) &&
        source['clips']['some']((next) => normalizeText(next?.['prompt'])),
    )
  )
    return '';
  if (
    storyWorkspaceProjectData['project']?.['sourceMode'] === 'video-replication' &&
    !isStoryVideoReplicationAssetLocalizationComplete(storyWorkspaceProjectData)
  )
    return '请先完成资产本地化。';
  return '';
}
export function canEnterStoryWorkspaceStep(options2 = {}, current = 1) {
  return !getStoryWorkspaceStepBlockMessage(options2, current);
}
export function isStoryWorkspaceStepNavigationDisabled(options3 = {}, entry = 1) {
  const storyWorkspaceStep2 = normalizeStoryWorkspaceStep(entry),
    storyWorkspaceProjectData2 = normalizeStoryWorkspaceProjectData(options3);
  return (
    !canEnterStoryWorkspaceStep(storyWorkspaceProjectData2, storyWorkspaceStep2) ||
    (storyWorkspaceStep2 > 1 && storyWorkspaceProjectData2['project']?.['outlineStatus'] === 'stale')
  );
}
export function getStoryWorkspaceTransitionDirection(record, payload) {
  const storyWorkspaceStep3 = normalizeStoryWorkspaceStep(record),
    storyWorkspaceStep4 = normalizeStoryWorkspaceStep(payload);
  if (storyWorkspaceStep3 === storyWorkspaceStep4) return 'none';
  return storyWorkspaceStep4 > storyWorkspaceStep3 ? 'forward' : 'backward';
}
export function getStoryWorkspacePageTransitionDirection(handle, state, config) {
  if (normalizeText(handle) === 'episode') return 'backward';
  return getStoryWorkspaceTransitionDirection(state, config);
}
export function getStoryEpisodeGenerationControlState(options4 = {}, scope = '') {
  const text = normalizeText(scope),
    isGenerating = (Array['isArray'](options4['splittingEpisodeIds']) ? options4['splittingEpisodeIds'] : [])[
      'some'
    ]((input) => normalizeText(input) === text),
    text2 = normalizeText(options4['storyPlanningOperation']),
    output = Boolean(text2 && text2 !== 'splitting-episode');
  return { isGenerating: isGenerating, disabled: isGenerating || output };
}
function captureNavigationSnapshot(view2) {
  return {
    view: view2['view'],
    step: view2['step'],
    selectedEpisodeId: view2['selectedEpisodeId'],
    selectedClipId: view2['selectedClipId'],
    episodeSelectionMode: view2['episodeSelectionMode'],
    selectedEpisodeIds: [...(view2['selectedEpisodeIds'] || [])],
    clipSelectionMode: view2['clipSelectionMode'],
    selectedClipGenerationIds: [...(view2['selectedClipGenerationIds'] || [])],
    characterVoicePanelMotion: view2['characterVoicePanelMotion'],
    pendingCharacterVoiceAssetId: view2['pendingCharacterVoiceAssetId'],
    pendingDeleteClipId: view2['pendingDeleteClipId'],
    selectedAssetId: view2['selectedAssetId'],
    assetFilter: view2['assetFilter'],
    assetSelectionMode: view2['assetSelectionMode'],
    selectedAssetIds: [...(view2['selectedAssetIds'] || [])],
    characterVoiceEditor: cloneNavigationValue(view2['characterVoiceEditor'], null),
    outlineSectionOpenState: cloneNavigationValue(view2['outlineSectionOpenState'] || {}, {}),
    clipAdjustmentOpen: view2['clipAdjustmentOpen'],
    clipAdjustmentInstruction: view2['clipAdjustmentInstruction'],
    clipAdjustmentLanguage: view2['clipAdjustmentLanguage'],
    clipAdjustmentLanguageOpen: view2['clipAdjustmentLanguageOpen'],
    clipPromptHistoryOpen: view2['clipPromptHistoryOpen'],
    models: { ...(view2['models'] || {}) },
    videoProvider: view2['videoProvider'],
    videoProviderProfileId: view2['videoProviderProfileId'],
    videoProviderProfileIdByModel: cloneNavigationValue(view2['videoProviderProfileIdByModel'] || {}, {}),
    videoGenerationParams: { ...(view2['videoGenerationParams'] || {}) },
    videoGenerationParamsByModel: cloneNavigationValue(view2['videoGenerationParamsByModel'] || {}, {}),
  };
}
function restoreNavigationSnapshot(value2, value3) {
  Object['assign'](value2, value3);
}
export function createStoryWorkspaceNavigationTransaction({
  state: state2,
  toolbarEl: toolbarEl = null,
  windowObject: windowObject = globalThis['window'],
  renderAdapter: renderAdapter = {},
  onClipSelected: onClipSelected = () => {},
  onCommit: onCommit = () => {},
  notify: notify = () => {},
  logger: logger = globalThis['console'],
} = {}) {
  if (!state2 || typeof state2 !== 'object') throw new Error('[storyWorkspaceNavigation] state is required');
  if (typeof renderAdapter['render'] !== 'function')
    throw new Error('[storyWorkspaceNavigation] renderAdapter.render is required');
  let value4 = 0,
    value5 = false,
    value6 = null;
  function run({ restore: restore = true } = {}) {
    const enabled = value6;
    if (!enabled) return;
    enabled['cancelWait']?.();
    if (restore) restoreNavigationSnapshot(state2, enabled['snapshot']);
    if (value6 === enabled) value6 = null;
    run2();
  }
  function run3() {
    const token = ++value4;
    run();
    const snapshot = captureNavigationSnapshot(state2);
    return (
      (value6 = { token: token, snapshot: snapshot, cancelWait: null }),
      { token: token, snapshot: snapshot }
    );
  }
  function run4(value7) {
    if (value6?.['token'] === value7) value6 = null;
  }
  function run5() {
    const el = toolbarEl?.['querySelector']?.('.story-step-navigation'),
      el2 = toolbarEl?.['querySelector']?.('.story-project-toolbar'),
      canReuseStoryStepNavigation2 = canReuseStoryStepNavigation({
        view: state2['view'],
        hasNavigation: Boolean(el),
        isEpisodeToolbar: Boolean(el2?.['classList']?.['contains']('story-project-toolbar--episode')),
      });
    if (!canReuseStoryStepNavigation2) return false;
    return (
      (el['dataset']['activeStep'] = String(state2['step'])),
      el['querySelectorAll']('[data-story-step]')['forEach']((el3) => {
        const storyWorkspaceStep5 = normalizeStoryWorkspaceStep(el3['dataset']['storyStep']),
          value8 = storyWorkspaceStep5 === state2['step'];
        (el3['classList']['toggle']('is-active', value8),
          el3['setAttribute']('aria-current', value8 ? 'step' : 'false'),
          (el3['disabled'] = isStoryWorkspaceStepNavigationDisabled(state2['data'], storyWorkspaceStep5)));
      }),
      true
    );
  }
  function run6(value9) {
    const el4 = toolbarEl?.['querySelector']?.('.story-project-toolbar--episode'),
      el5 = el4?.['querySelector']('.story-episode-toolbar-current'),
      el6 = el4?.['querySelector']('[data-story-step="' + normalizeStoryWorkspaceStep(value9) + '"]');
    if (!el4 || !el5 || !el6) return false;
    const box = el5['getBoundingClientRect']?.(),
      box2 = el6['getBoundingClientRect']?.();
    if (!box?.['width'] || !box2?.['width']) return false;
    return (
      el5['style']['setProperty']('--story-episode-exit-x', box2['left'] - box['left'] + 'px'),
      el5['style']['setProperty']('--story-episode-exit-width', box2['width'] + 'px'),
      el6['classList']['add']('is-episode-exit-target'),
      el4['classList']['add']('is-switching-from-episode'),
      true
    );
  }
  function run7() {
    const el7 = toolbarEl?.['querySelector']?.('.story-project-toolbar:not(.story-project-toolbar--episode)'),
      el8 = el7?.['querySelector']('.story-episode-toolbar-current[data-story-episode-state="inactive"]'),
      el9 = el7?.['querySelector'](
        '[data-story-step="' + normalizeStoryWorkspaceStep(state2['step']) + '"]',
      );
    if (!el7 || !el8 || !el9) return false;
    const box3 = el8['getBoundingClientRect']?.(),
      box4 = el9['getBoundingClientRect']?.();
    if (!box3?.['width'] || !box4?.['width']) return false;
    return (
      el8['style']['setProperty']('--story-episode-enter-x', box4['left'] - box3['left'] + 'px'),
      el8['style']['setProperty']('--story-episode-enter-width', box4['width'] + 'px'),
      el7['classList']['add']('is-switching-to-episode'),
      el8['getBoundingClientRect']?.(),
      windowObject?.['requestAnimationFrame']?.(() => {
        if (!el7['isConnected'] || !el7['classList']['contains']('is-switching-to-episode')) return;
        el7['classList']['add']('is-switching-to-episode-ready');
      }),
      true
    );
  }
  function run2() {
    (toolbarEl?.['querySelectorAll']?.('.story-project-toolbar')['forEach']((el10) => {
      el10['classList']['remove'](
        'is-switching-to-episode',
        'is-switching-to-episode-ready',
        'is-switching-from-episode',
      );
    }),
      toolbarEl?.['querySelectorAll']?.('.story-episode-toolbar-current')['forEach']((el11) => {
        (el11['style']['removeProperty']('--story-episode-enter-x'),
          el11['style']['removeProperty']('--story-episode-enter-width'),
          el11['style']['removeProperty']('--story-episode-exit-x'),
          el11['style']['removeProperty']('--story-episode-exit-width'));
      }),
      toolbarEl?.['querySelectorAll']?.('.is-episode-exit-target')['forEach']((el12) => {
        el12['classList']['remove']('is-episode-exit-target');
      }));
  }
  function run8(value10) {
    if (typeof windowObject?.['requestAnimationFrame'] !== 'function') return Promise['resolve']();
    return new Promise((handler) => {
      const enabled2 = value6?.['token'] === value10 ? value6 : null;
      if (!enabled2) {
        handler();
        return;
      }
      let value11 = 0,
        value12 = 0,
        value13 = false;
      const run9 = () => {
          if (value13) return;
          value13 = true;
          if (enabled2['cancelWait'] === value14) enabled2['cancelWait'] = null;
          handler();
        },
        value14 = () => {
          if (typeof windowObject['cancelAnimationFrame'] === 'function') {
            if (value11) windowObject['cancelAnimationFrame'](value11);
            if (value12) windowObject['cancelAnimationFrame'](value12);
          }
          run9();
        };
      ((enabled2['cancelWait'] = value14),
        (value11 = windowObject['requestAnimationFrame'](() => {
          ((value11 = 0),
            (value12 = windowObject['requestAnimationFrame'](() => {
              ((value12 = 0), run9());
            })));
        })));
    });
  }
  function run10({
    token: token2,
    snapshot: snapshot2,
    operation: operation,
    error: error,
    message: message,
  }) {
    if (value5 || token2 !== value4) return false;
    restoreNavigationSnapshot(state2, snapshot2);
    if (value6?.['token'] === token2) value6 = null;
    (run2(), logger?.['error']?.('[storyWorkspace][' + operation + '] 导航失败', error));
    try {
      renderAdapter['renderToolbar']?.();
    } catch (value15) {
      logger?.['error']?.('[storyWorkspace][' + operation + '] 工具栏恢复失败', value15);
    }
    try {
      renderAdapter['render']({ direction: 'none', updateToolbar: false, capturePageState: false });
    } catch (value16) {
      logger?.['error']?.('[storyWorkspace][' + operation + '] 页面恢复失败', value16);
    }
    return (notify(message, 'error'), false);
  }
  function run11(value17, value18) {
    if (value5 || value17 !== value4) return;
    try {
      renderAdapter['renderToolbar']?.();
    } catch (value19) {
      (logger?.['error']?.('[storyWorkspace][' + value18 + '] 工具栏收尾失败', value19),
        notify('工具栏更新失败，请重试。', 'error'));
      throw value19;
    } finally {
      run2();
    }
  }
  async function run12(options5 = {}) {
    if (value5) return false;
    const storyWorkspaceStep6 = normalizeStoryWorkspaceStep(options5['step']),
      storyWorkspaceStepBlockMessage = getStoryWorkspaceStepBlockMessage(state2['data'], storyWorkspaceStep6);
    if (storyWorkspaceStepBlockMessage) return (notify(storyWorkspaceStepBlockMessage, 'warn'), false);
    const { token: token3, snapshot: snapshot3 } = run3();
    try {
      const onTransitionComplete = state2['view'] === 'episode',
        direction = getStoryWorkspacePageTransitionDirection(
          state2['view'],
          state2['step'],
          storyWorkspaceStep6,
        );
      if (onTransitionComplete) run6(storyWorkspaceStep6);
      storyWorkspaceStep6 !== state2['step'] &&
        ((state2['episodeSelectionMode'] = false),
        (state2['selectedEpisodeIds'] = []),
        (state2['clipSelectionMode'] = false),
        (state2['selectedClipGenerationIds'] = []),
        (state2['characterVoicePanelMotion'] = ''),
        (state2['pendingCharacterVoiceAssetId'] = ''));
      ((state2['pendingDeleteClipId'] = ''),
        (state2['view'] = 'project'),
        (state2['step'] = storyWorkspaceStep6));
      normalizeText(options5['assetFilter']) &&
        (state2['assetFilter'] = normalizeText(options5['assetFilter']));
      normalizeText(options5['assetId']) &&
        ((state2['selectedAssetId'] = normalizeText(options5['assetId'])),
        (state2['characterVoiceEditor'] = null),
        (state2['characterVoicePanelMotion'] = ''),
        (state2['pendingCharacterVoiceAssetId'] = ''));
      if (normalizeText(options5['outlineSectionId'])) {
        const text3 = normalizeText(options5['outlineSectionId']);
        state2['outlineSectionOpenState'] = {
          ...(state2['outlineSectionOpenState'] || {}),
          ...(text3['startsWith']('episode-') ? { episodes: true } : {}),
          [text3]: true,
        };
      }
      if (storyWorkspaceStep6 === 2) {
        const enabled3 = (state2['data']?.['assets'] || [])['some'](
          (value20) =>
            normalizeText(value20?.['id']) === normalizeText(state2['selectedAssetId']) &&
            value20?.['kind'] === state2['assetFilter'],
        );
        if (!enabled3) {
          const value21 = (state2['data']?.['assets'] || [])['find'](
            (value22) => value22['kind'] === state2['assetFilter'],
          );
          state2['selectedAssetId'] = value21?.['id'] || '';
        }
        ((state2['assetSelectionMode'] = false), (state2['selectedAssetIds'] = []));
      }
      const enabled4 = onTransitionComplete ? false : run5(),
        value23 = await Promise['resolve'](
          renderAdapter['render']({
            direction: direction,
            updateToolbar: !onTransitionComplete && !enabled4,
            onTransitionComplete: onTransitionComplete ? () => run11(token3, 'go-to-step') : null,
          }),
        );
      if (value5 || token3 !== value4) return false;
      if (value23 !== true) throw new Error('story workspace page transition was interrupted');
      return (onCommit(), run4(token3), true);
    } catch (error2) {
      return run10({
        token: token3,
        snapshot: snapshot3,
        operation: 'go-to-step',
        error: error2,
        message: '切换步骤失败，请重试。',
      });
    }
  }
  async function run13(value24, value25 = '') {
    if (value5) return false;
    const storyWorkspaceStepBlockMessage2 = getStoryWorkspaceStepBlockMessage(state2['data'], 3);
    if (storyWorkspaceStepBlockMessage2) return (notify(storyWorkspaceStepBlockMessage2, 'warn'), false);
    const episode = (state2['data']?.['episodes'] || [])['find'](
      (value26) => normalizeText(value26?.['id']) === normalizeText(value24),
    );
    if (!episode) return false;
    if (getStoryEpisodeGenerationControlState(state2, episode['id'])['disabled']) return false;
    if (!Array['isArray'](episode['clips']) || !episode['clips']['length']) return false;
    const { token: token4, snapshot: snapshot4 } = run3();
    try {
      const enteringEpisode = state2['view'] !== 'episode',
        switchingEpisode = state2['view'] === 'episode' && state2['selectedEpisodeId'] !== episode['id'];
      (renderAdapter['capturePageState']?.(),
        (state2['clipAdjustmentOpen'] = false),
        (state2['clipAdjustmentInstruction'] = ''),
        (state2['clipAdjustmentLanguage'] = ''),
        (state2['clipAdjustmentLanguageOpen'] = false),
        (state2['clipPromptHistoryOpen'] = false),
        (state2['selectedEpisodeId'] = episode['id']));
      const value27 =
        episode['clips']['find']((value28) => normalizeText(value28?.['id']) === normalizeText(value25)) ||
        episode['clips'][0];
      ((state2['selectedClipId'] = value27?.['id'] || ''),
        (state2['pendingDeleteClipId'] = ''),
        (state2['clipSelectionMode'] = false),
        (state2['selectedClipGenerationIds'] = []),
        onClipSelected(value27, {
          episode: episode,
          enteringEpisode: enteringEpisode,
          switchingEpisode: switchingEpisode,
        }));
      if (switchingEpisode) {
        (renderAdapter['renderToolbar']?.(), await run8(token4));
        if (token4 !== value4) return false;
        if (state2['view'] !== 'episode' || state2['selectedEpisodeId'] !== episode['id'])
          throw new Error('story episode navigation was superseded');
      }
      let onTransitionComplete2 = false;
      enteringEpisode && (renderAdapter['renderToolbar']?.(), (onTransitionComplete2 = run7()));
      state2['view'] = 'episode';
      const value29 = await Promise['resolve'](
        renderAdapter['render']({
          direction: 'forward',
          updateToolbar: !onTransitionComplete2 && !switchingEpisode,
          capturePageState: false,
          onTransitionComplete: onTransitionComplete2 ? () => run11(token4, 'open-episode') : null,
        }),
      );
      if (value5 || token4 !== value4) return false;
      if (value29 !== true) throw new Error('story workspace page transition was interrupted');
      return (onCommit(), run4(token4), true);
    } catch (error3) {
      return run10({
        token: token4,
        snapshot: snapshot4,
        operation: 'open-episode',
        error: error3,
        message: '打开分集失败，请重试。',
      });
    }
  }
  function navigate(options6 = {}) {
    if (normalizeText(options6['view']) === 'episode')
      return run13(options6['episodeId'], options6['clipId']);
    if (normalizeText(options6['view']) === 'project') return run12(options6);
    return Promise['resolve'](false);
  }
  function destroy() {
    (run(), (value5 = true), (value4 += 1), run2());
  }
  return { navigate: navigate, destroy: destroy };
}
