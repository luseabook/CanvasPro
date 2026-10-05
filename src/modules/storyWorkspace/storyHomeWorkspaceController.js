import { createDemoStoryWorkspaceData } from './storyWorkspaceData.js';
import { normalizeStoryWorkspaceAssetData } from './storyAssetAppearances.js';
import {
  getStoryHomeGenerateButtonLabel,
  getStoryHomeModeDescription,
  renderStoryHomeComposerBody,
  renderStoryHomeModelBar,
} from './storyHomePresentation.js';
import {
  STORY_HOME_REWRITE_SOURCE_HINT,
  canStartStoryHomeGeneration,
  hasStoryHomeReferenceScript,
} from './storyHomeRewrite.js';
import {
  STORY_IDEA_MAX_CHARACTERS,
  STORY_SCRIPT_MAX_CHARACTERS,
  getStoryScriptModeHint,
  normalizeStoryProjectPlanning,
  normalizeStoryScriptMode,
  resolveStoryTextProviderProfileId,
} from './storyProjectPlanning.js';
import { duplicateStoryProjectEntry } from './storyProjectSession.js';
import { syncStoryAsyncButton } from './storyAsyncButtonPresentation.js';
import {
  getStoryWorkspaceModelChoice,
  resolveStoryVideoInputTextModelId,
} from './storyWorkspaceModelCatalog.js';
import { resolveStoryVideoReplicationHomeTab } from './storyVideoReplication.js';
import { splitNovelChapters } from './storyNovelChapterSplit.js';
import { defaultChapterSelection, normalizeChapterRecords } from './storyChapterSelection.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function createStoryHomeWorkspaceController({
  state: state,
  root: root,
  viewport: viewport,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
  projectData: projectData,
  extractDocumentText: extractDocumentText,
  syncCurrentProjectEntry: syncCurrentProjectEntry,
  beginProjectSession: beginProjectSession,
  advanceProjectSession: advanceProjectSession,
  invalidateProjectRuntime: invalidateProjectRuntime,
  releaseReplicationSourcePreviewUrls: releaseReplicationSourcePreviewUrls,
  schedulePersistence: schedulePersistence,
  render: render,
  showToast: showToast,
  showTaskResultToast: showTaskResultToast,
  refreshTextModelSelector: refreshTextModelSelector,
} = {}) {
  if (
    !state ||
    !root ||
    !viewport ||
    !documentObject ||
    typeof projectData?.['addEntry'] !== 'function' ||
    typeof syncCurrentProjectEntry !== 'function' ||
    typeof beginProjectSession !== 'function' ||
    typeof advanceProjectSession !== 'function' ||
    typeof invalidateProjectRuntime !== 'function' ||
    typeof releaseReplicationSourcePreviewUrls !== 'function' ||
    typeof schedulePersistence !== 'function' ||
    typeof render !== 'function' ||
    typeof showToast !== 'function' ||
    typeof showTaskResultToast !== 'function' ||
    typeof refreshTextModelSelector !== 'function'
  )
    throw new TypeError('Story home workspace requires project, persistence, and presentation adapters.');
  function resetCreationState({ preserveCurrentProject: preserveCurrentProject = true } = {}) {
    (state['hasCreatedProject'] && preserveCurrentProject && syncCurrentProjectEntry(),
      beginProjectSession(),
      (state['homeTab'] = state['workspaceSurface'] === 'replication' ? 'replication' : 'generate'),
      (state['scriptMode'] = 'plot'),
      (state['uploadInputMode'] = 'file'),
      (state['projectTitleEdited'] = false),
      (state['idea'] = ''),
      releaseReplicationSourcePreviewUrls(),
      (state['replicationSourceFiles'] = []),
      (state['scriptFileName'] = ''),
      (state['scriptText'] = ''),
      (state['scriptCharacterCount'] = null),
      (state['hasCreatedProject'] = false),
      (state['openProjectMenuId'] = ''),
      (state['pendingDeleteProjectId'] = ''),
      projectData['replaceCurrent'](normalizeStoryWorkspaceAssetData(createDemoStoryWorkspaceData())),
      (state['data']['project']['planning'] = normalizeStoryProjectPlanning(state['data']['project'], {
        allowDeveloperPromptModes: state['developerModeAvailable'],
      })),
      (state['assetSelectionMode'] = false),
      (state['selectedAssetIds'] = []),
      (state['scriptSelectionMode'] = false),
      (state['selectedScriptEpisodeIds'] = []),
      (state['generatingEpisodeScriptId'] = ''),
      (state['isBatchGeneratingScripts'] = false),
      (state['episodeScriptBatchId'] = ''),
      (state['episodeScriptBatchCancelRequested'] = false),
      (state['scriptGenerationFocusMode'] = false),
      (state['outlineSectionOpenState'] = {}),
      (state['episodeScriptGenerationStatus'] = ''),
      (state['assetAppearanceIndexes'] = {}),
      (state['characterVoiceEditor'] = null),
      (state['characterVoicePanelMotion'] = ''),
      (state['pendingCharacterVoiceAssetId'] = ''),
      (state['pendingDeleteClipId'] = ''),
      (state['pendingDeleteAssetAppearanceKey'] = ''),
      (state['clipSelectionMode'] = false),
      (state['selectedClipGenerationIds'] = []),
      (state['clipBatchGenerationByEpisode'] = {}));
  }
  function projectId() {
    const map = new Set(
        state['projects']
          ['map']((item) => normalizeText(item?.['id'] || item?.['data']?.['project']?.['id']))
          ['filter'](Boolean),
      ),
      key = 'story-' + Date['now']() + '-copy';
    let index = key,
      result = 2;
    while (map['has'](index)) {
      ((index = key + '-' + result), (result += 1));
    }
    return index;
  }
  function focusProjectTitle(data) {
    const text = normalizeText(data),
      handler = () => {
        const el = [...root['querySelectorAll']('[data-story-project-title]')]['find'](
          (el2) => normalizeText(el2['dataset']['storyProjectTitle']) === text,
        );
        (el?.['focus'](), el?.['select']());
      };
    typeof windowObject['requestAnimationFrame'] === 'function'
      ? windowObject['requestAnimationFrame'](handler)
      : handler();
  }
  function duplicateProject(options) {
    syncCurrentProjectEntry();
    const text2 = normalizeText(options),
      target = projectData['getEntry'](text2),
      duplicateStoryProjectEntry2 = duplicateStoryProjectEntry(target, { projectId: projectId() });
    if (!duplicateStoryProjectEntry2?.['data']?.['project'])
      return (showToast('复制项目失败，请刷新后重试。', 'error'), false);
    return (
      projectData['addEntry'](duplicateStoryProjectEntry2),
      advanceProjectSession(state, duplicateStoryProjectEntry2['id']),
      (state['openProjectMenuId'] = ''),
      (state['pendingDeleteProjectId'] = ''),
      schedulePersistence({ immediate: true }),
      render(),
      showToast('已创建“' + duplicateStoryProjectEntry2['title'] + '”。', 'success'),
      true
    );
  }
  function setProjectArchived(source, next) {
    syncCurrentProjectEntry();
    const text3 = normalizeText(source),
      enabled = projectData['getEntry'](text3);
    if (!enabled) return (showToast('项目状态更新失败，请刷新后重试。', 'error'), false);
    return (
      (enabled['archivedAt'] = next ? Date['now']() : 0),
      (enabled['updatedAt'] = Date['now']()),
      (state['openProjectMenuId'] = ''),
      (state['pendingDeleteProjectId'] = ''),
      schedulePersistence({ immediate: true }),
      render(),
      showToast(next ? '剧本项目已归档。' : '剧本项目已取消归档。', 'success'),
      true
    );
  }
  function deleteProject(current) {
    const text4 = normalizeText(current);
    if (!text4) return false;
    if (!projectData['removeEntry'](text4))
      return ((state['openProjectMenuId'] = ''), (state['pendingDeleteProjectId'] = ''), render(), false);
    return (
      invalidateProjectRuntime(text4),
      normalizeText(state['data']?.['project']?.['id']) === text4
        ? (beginProjectSession(),
          (state['hasCreatedProject'] = false),
          resetCreationState({ preserveCurrentProject: false }),
          (state['view'] = 'home'))
        : ((state['openProjectMenuId'] = ''), (state['pendingDeleteProjectId'] = '')),
      schedulePersistence({ immediate: true }),
      render(),
      showToast('剧本项目已删除。', 'success'),
      true
    );
  }
  function syncGenerateState() {
    const el3 = viewport['querySelector']('.story-page.is-current'),
      el4 = el3?.['querySelector']('[data-story-action="generate-story"], [data-collaboration-start]'),
      enabled2 =
        state['homeTab'] === 'collaborate'
          ? Boolean(state['idea']?.['trim']())
          : canStartStoryHomeGeneration(state);
    if (el4) {
      ((el4['disabled'] = !enabled2 || state['isGeneratingStory']),
        syncStoryAsyncButton(el4, state['isGeneratingStory']));
      const el5 = el4['querySelector']('[data-story-generate-label]');
      el5 && (el5['textContent'] = getStoryHomeGenerateButtonLabel(state));
      const el6 = el4['querySelector']('.story-generate-arrow');
      if (el6) el6['hidden'] = state['isGeneratingStory'];
    }
    const el7 = el3?.['querySelector']('[data-story-script-mode-control]');
    if (el7) {
      const storyScriptMode = normalizeStoryScriptMode(state['scriptMode']),
        entry = storyScriptMode === 'narration' ? '解说模式' : '剧情模式',
        record = storyScriptMode === 'narration' ? '剧情模式' : '解说模式';
      ((el7['hidden'] = !['generate', 'collaborate']['includes'](state['homeTab'])),
        (el7['dataset']['storyScriptMode'] = storyScriptMode),
        el7['classList']['toggle']('is-narration', storyScriptMode === 'narration'),
        el7['setAttribute']('aria-pressed', String(storyScriptMode === 'narration')),
        el7['setAttribute']('aria-label', '当前' + entry + '，点击切换为' + record));
      const el8 = el7['querySelector']('[data-story-script-mode-label]');
      if (el8) el8['textContent'] = entry;
    }
    const el9 = el3?.['querySelector']('[data-story-script-mode-hint]');
    el9 &&
      (el9['textContent'] = hasStoryHomeReferenceScript(state)
        ? STORY_HOME_REWRITE_SOURCE_HINT
        : getStoryScriptModeHint(state['scriptMode']));
    const el10 = el3?.['querySelector']('[data-story-planning-picker="episodeCount"]');
    if (el10) el10['hidden'] = !['generate', 'collaborate']['includes'](state['homeTab']);
    const el11 = el3?.['querySelector']('[data-story-planning-picker="promptMode"]');
    if (el11) el11['hidden'] = false;
    const el12 = el3?.['querySelector']('[data-story-planning-picker="targetLocale"]');
    if (el12) el12['hidden'] = state['homeTab'] !== 'replication';
    const el13 = el3?.['querySelector']('.story-home-composer');
    (el13?.['classList']['toggle']('is-generating', state['isGeneratingStory']),
      el13?.['setAttribute']('aria-busy', state['isGeneratingStory'] ? 'true' : 'false'));
    const el14 = el3?.['querySelector']('[data-story-generation-loading]');
    if (el14) el14['hidden'] = !state['isGeneratingStory'];
    const el15 = el3?.['querySelector']('[data-story-generation-loading-label]');
    if (el15) el15['textContent'] = state['generationStatus'] || '正在创建剧情';
    const el16 = el3?.['querySelector']('[data-story-idea-count]');
    el16 && (el16['textContent'] = state['idea']['length'] + ' / ' + STORY_IDEA_MAX_CHARACTERS);
    const el17 = el3?.['querySelector']('[data-story-paste-count]');
    el17 && (el17['textContent'] = state['scriptText']['length'] + ' / ' + STORY_SCRIPT_MAX_CHARACTERS);
  }
  function switchTab(payload) {
    if (payload === 'collaborate' && state['developerModeAvailable'] !== true) return false;
    const storyVideoReplicationHomeTab = resolveStoryVideoReplicationHomeTab(state, payload);
    if (payload === 'replication' && storyVideoReplicationHomeTab !== payload) return false;
    if (state['homeTab'] === storyVideoReplicationHomeTab) return false;
    state['homeTab'] = storyVideoReplicationHomeTab;
    const el18 = viewport['querySelector']('.story-page.is-current'),
      el19 = el18?.['querySelector']('[data-story-home-tabs]'),
      el20 = el18?.['querySelector']('.story-home-composer-body');
    if (!el19 || !el20) {
      render();
      return;
    }
    el19['dataset']['activeTab'] = storyVideoReplicationHomeTab;
    const el21 = el18['querySelector']('[data-story-home-mode-description]');
    if (el21)
      el21['textContent'] = getStoryHomeModeDescription(storyVideoReplicationHomeTab, state['scriptIntent']);
    el19['querySelectorAll']('[data-story-home-tab]')['forEach']((el22) => {
      const handle = el22['dataset']['storyHomeTab'] === storyVideoReplicationHomeTab;
      (el22['classList']['toggle']('is-active', handle),
        el22['setAttribute']('aria-selected', String(handle)),
        (el22['tabIndex'] = handle ? 0 : -1));
    });
    if (storyVideoReplicationHomeTab === 'replication') {
      const storyVideoInputTextModelId = resolveStoryVideoInputTextModelId(state['models']['text']);
      if (storyVideoInputTextModelId) {
        const storyWorkspaceModelChoice = getStoryWorkspaceModelChoice('text', storyVideoInputTextModelId);
        ((state['models']['text'] = storyVideoInputTextModelId),
          (state['textProvider'] = storyWorkspaceModelChoice?.['provider'] || state['textProvider']),
          (state['textProviderProfileId'] = resolveStoryTextProviderProfileId(
            state['textProvider'],
            state['textProviderProfileId'],
          )));
      }
    }
    el20['innerHTML'] = renderStoryHomeComposerBody(state);
    const config = el18['querySelector']('.story-home-model-bar'),
      el23 = documentObject['createElement']('template');
    el23['innerHTML'] = renderStoryHomeModelBar(state)['trim']();
    const scope = el23['content']['firstElementChild'];
    return (
      config && scope && (config['replaceWith'](scope), refreshTextModelSelector(el18)),
      syncGenerateState(),
      schedulePersistence(),
      true
    );
  }
  function selectScriptMode(input) {
    const storyScriptMode2 = normalizeStoryScriptMode(input);
    if (state['scriptMode'] === storyScriptMode2) return false;
    return ((state['scriptMode'] = storyScriptMode2), syncGenerateState(), schedulePersistence(), true);
  }
  // A novel is adapted in batches, so parse it into chapters and pick the first batch instead
  // of handing the whole book to the rewrite pipeline.
  function run(output) {
    const list = normalizeChapterRecords(splitNovelChapters(output)),
      defaultChapterSelection2 = defaultChapterSelection(list);
    return (
      (state['novelChapters'] = list),
      (state['novelSelectedChapterIds'] = defaultChapterSelection2.chapterIds),
      (state['novelEpisodeCount'] = defaultChapterSelection2.episodeSuggestion.recommended),
      list['length']
    );
  }
  async function selectScriptFile(fileName) {
    if (!fileName) return false;
    if (typeof extractDocumentText !== 'function')
      return (showToast('剧本文档解析服务尚未初始化。', 'error'), false);
    const value2 = state['data'];
    ((state['isParsingDocument'] = true), render());
    try {
      const response = await extractDocumentText(fileName);
      if (state['data'] !== value2) return false;
      // The parser used to slice the document to the limit without saying anything, so an
      // oversized novel silently lost everything past the cut. Report the loss explicitly.
      const list2 = String(response?.['text'] || ''),
        text5 = list2['slice'](0, STORY_SCRIPT_MAX_CHARACTERS),
        count = list2['length'] - text5['length'];
      if (!normalizeText(text5)) throw new Error('文档解析结果没有可用文本。');
      return (
        (state['scriptCharacterCount'] = Number['isFinite'](response?.['characterCount'])
          ? response['characterCount']
          : text5['length']),
        (state['scriptText'] = text5),
        (state['uploadInputMode'] = 'file'),
        (state['scriptFileName'] = fileName['name']),
        !state['hasCreatedProject'] &&
          (state['data']['project']['sourceDocument'] = {
            fileName: fileName['name'],
            text: text5,
            characterCount: state['scriptCharacterCount'],
          }),
        schedulePersistence({ immediate: true }),
        count > 0 &&
          showTaskResultToast(
            '文档共 ' +
              list2['length'] +
              ' 字，超出单次处理上限 ' +
              STORY_SCRIPT_MAX_CHARACTERS +
              ' 字，本次只保留前 ' +
              text5['length'] +
              ' 字，其余 ' +
              count +
              ' 字未进入项目。请拆分后分批处理。',
            'warn',
          ),
        (state['scriptTruncatedCharacters'] = count),
        state['scriptIntent'] === 'novel'
          ? (function () {
              const count2 = run(text5);
              (schedulePersistence({ immediate: true }),
                render(),
                showTaskResultToast(
                  count2 > 1
                    ? '已解析 ' + count2 + ' 章，请勾选本次要改编的章节。'
                    : '未能识别章节标题，全文作为一章，请确认是否继续。',
                  count2 > 1 ? 'success' : 'warn',
                ));
            })()
          : showTaskResultToast('剧本文档解析完成。', 'success'),
        true
      );
    } catch (error) {
      return (showTaskResultToast(error?.['message'] || '剧本文档解析失败。', 'error', error), false);
    } finally {
      ((state['isParsingDocument'] = false), render());
    }
  }
  return {
    deleteProject: deleteProject,
    duplicateProject: duplicateProject,
    focusProjectTitle: focusProjectTitle,
    resetCreationState: resetCreationState,
    selectScriptFile: selectScriptFile,
    selectScriptMode: selectScriptMode,
    setProjectArchived: setProjectArchived,
    switchTab: switchTab,
    syncGenerateState: syncGenerateState,
  };
}
