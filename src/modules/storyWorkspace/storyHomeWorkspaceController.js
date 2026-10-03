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
import {
  defaultChapterSelection,
  normalizeChapterRecords,
} from './storyChapterSelection.js';
function normalizeText(_0x310167) {
  return String(_0x310167 ?? '')['trim']();
}
export function createStoryHomeWorkspaceController({
  state: _0x57d133,
  root: _0x4d56a2,
  viewport: _0x37e680,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
  projectData: _0x260946,
  extractDocumentText: _0xfe5af4,
  syncCurrentProjectEntry: _0x2e3b44,
  beginProjectSession: _0x2c593f,
  advanceProjectSession: _0x29c759,
  invalidateProjectRuntime: _0x1f306b,
  releaseReplicationSourcePreviewUrls: _0x1df6eb,
  schedulePersistence: _0x31b651,
  render: _0x3e53a1,
  showToast: _0x17e886,
  showTaskResultToast: _0x372c60,
  refreshTextModelSelector: _0x71a456,
} = {}) {
  if (
    !_0x57d133 ||
    !_0x4d56a2 ||
    !_0x37e680 ||
    !documentObject ||
    typeof _0x260946?.['addEntry'] !== 'function' ||
    typeof _0x2e3b44 !== 'function' ||
    typeof _0x2c593f !== 'function' ||
    typeof _0x29c759 !== 'function' ||
    typeof _0x1f306b !== 'function' ||
    typeof _0x1df6eb !== 'function' ||
    typeof _0x31b651 !== 'function' ||
    typeof _0x3e53a1 !== 'function' ||
    typeof _0x17e886 !== 'function' ||
    typeof _0x372c60 !== 'function' ||
    typeof _0x71a456 !== 'function'
  )
    throw new TypeError('Story home workspace requires project, persistence, and presentation adapters.');
  function _0x27684a({ preserveCurrentProject: preserveCurrentProject = !![] } = {}) {
    (_0x57d133['hasCreatedProject'] && preserveCurrentProject && _0x2e3b44(),
      _0x2c593f(),
      (_0x57d133['homeTab'] = _0x57d133['workspaceSurface'] === 'replication' ? 'replication' : 'generate'),
      (_0x57d133['scriptMode'] = 'plot'),
      (_0x57d133['uploadInputMode'] = 'file'),
      (_0x57d133['projectTitleEdited'] = ![]),
      (_0x57d133['idea'] = ''),
      _0x1df6eb(),
      (_0x57d133['replicationSourceFiles'] = []),
      (_0x57d133['scriptFileName'] = ''),
      (_0x57d133['scriptText'] = ''),
      (_0x57d133['scriptCharacterCount'] = null),
      (_0x57d133['hasCreatedProject'] = ![]),
      (_0x57d133['openProjectMenuId'] = ''),
      (_0x57d133['pendingDeleteProjectId'] = ''),
      _0x260946['replaceCurrent'](normalizeStoryWorkspaceAssetData(createDemoStoryWorkspaceData())),
      (_0x57d133['data']['project']['planning'] = normalizeStoryProjectPlanning(
        _0x57d133['data']['project'],
        { allowDeveloperPromptModes: _0x57d133['developerModeAvailable'] },
      )),
      (_0x57d133['assetSelectionMode'] = ![]),
      (_0x57d133['selectedAssetIds'] = []),
      (_0x57d133['scriptSelectionMode'] = ![]),
      (_0x57d133['selectedScriptEpisodeIds'] = []),
      (_0x57d133['generatingEpisodeScriptId'] = ''),
      (_0x57d133['isBatchGeneratingScripts'] = ![]),
      (_0x57d133['episodeScriptBatchId'] = ''),
      (_0x57d133['episodeScriptBatchCancelRequested'] = ![]),
      (_0x57d133['scriptGenerationFocusMode'] = ![]),
      (_0x57d133['outlineSectionOpenState'] = {}),
      (_0x57d133['episodeScriptGenerationStatus'] = ''),
      (_0x57d133['assetAppearanceIndexes'] = {}),
      (_0x57d133['characterVoiceEditor'] = null),
      (_0x57d133['characterVoicePanelMotion'] = ''),
      (_0x57d133['pendingCharacterVoiceAssetId'] = ''),
      (_0x57d133['pendingDeleteClipId'] = ''),
      (_0x57d133['pendingDeleteAssetAppearanceKey'] = ''),
      (_0x57d133['clipSelectionMode'] = ![]),
      (_0x57d133['selectedClipGenerationIds'] = []),
      (_0x57d133['clipBatchGenerationByEpisode'] = {}));
  }
  function _0x109fa9() {
    const _0x298275 = new Set(
        _0x57d133['projects']
          ['map']((_0x39a8ea) => normalizeText(_0x39a8ea?.['id'] || _0x39a8ea?.['data']?.['project']?.['id']))
          ['filter'](Boolean),
      ),
      _0x5506fb = 'story-' + Date['now']() + '-copy';
    let _0x4e1065 = _0x5506fb,
      _0x2f49ef = 0x2;
    while (_0x298275['has'](_0x4e1065)) {
      ((_0x4e1065 = _0x5506fb + '-' + _0x2f49ef), (_0x2f49ef += 0x1));
    }
    return _0x4e1065;
  }
  function _0x84c4a0(_0x42cf19) {
    const _0x5e0eb2 = normalizeText(_0x42cf19),
      _0x572cf5 = () => {
        const _0x53bb62 = [..._0x4d56a2['querySelectorAll']('[data-story-project-title]')]['find'](
          (_0x7cebaf) => normalizeText(_0x7cebaf['dataset']['storyProjectTitle']) === _0x5e0eb2,
        );
        (_0x53bb62?.['focus'](), _0x53bb62?.['select']());
      };
    typeof windowObject['requestAnimationFrame'] === 'function'
      ? windowObject['requestAnimationFrame'](_0x572cf5)
      : _0x572cf5();
  }
  function _0x5c9fde(_0x20d66d) {
    _0x2e3b44();
    const _0x193d19 = normalizeText(_0x20d66d),
      _0x5587db = _0x260946['getEntry'](_0x193d19),
      _0x97834f = duplicateStoryProjectEntry(_0x5587db, { projectId: _0x109fa9() });
    if (!_0x97834f?.['data']?.['project']) return (_0x17e886('复制项目失败，请刷新后重试。', 'error'), ![]);
    return (
      _0x260946['addEntry'](_0x97834f),
      _0x29c759(_0x57d133, _0x97834f['id']),
      (_0x57d133['openProjectMenuId'] = ''),
      (_0x57d133['pendingDeleteProjectId'] = ''),
      _0x31b651({ immediate: !![] }),
      _0x3e53a1(),
      _0x17e886('已创建“' + _0x97834f['title'] + '”。', 'success'),
      !![]
    );
  }
  function _0x48fcdc(_0x2f391a, _0x36b1) {
    _0x2e3b44();
    const _0x294f90 = normalizeText(_0x2f391a),
      _0x2e1a63 = _0x260946['getEntry'](_0x294f90);
    if (!_0x2e1a63) return (_0x17e886('项目状态更新失败，请刷新后重试。', 'error'), ![]);
    return (
      (_0x2e1a63['archivedAt'] = _0x36b1 ? Date['now']() : 0x0),
      (_0x2e1a63['updatedAt'] = Date['now']()),
      (_0x57d133['openProjectMenuId'] = ''),
      (_0x57d133['pendingDeleteProjectId'] = ''),
      _0x31b651({ immediate: !![] }),
      _0x3e53a1(),
      _0x17e886(_0x36b1 ? '剧本项目已归档。' : '剧本项目已取消归档。', 'success'),
      !![]
    );
  }
  function _0x3c9ee4(_0x156682) {
    const _0x2e1933 = normalizeText(_0x156682);
    if (!_0x2e1933) return ![];
    if (!_0x260946['removeEntry'](_0x2e1933))
      return (
        (_0x57d133['openProjectMenuId'] = ''),
        (_0x57d133['pendingDeleteProjectId'] = ''),
        _0x3e53a1(),
        ![]
      );
    return (
      _0x1f306b(_0x2e1933),
      normalizeText(_0x57d133['data']?.['project']?.['id']) === _0x2e1933
        ? (_0x2c593f(),
          (_0x57d133['hasCreatedProject'] = ![]),
          _0x27684a({ preserveCurrentProject: ![] }),
          (_0x57d133['view'] = 'home'))
        : ((_0x57d133['openProjectMenuId'] = ''), (_0x57d133['pendingDeleteProjectId'] = '')),
      _0x31b651({ immediate: !![] }),
      _0x3e53a1(),
      _0x17e886('剧本项目已删除。', 'success'),
      !![]
    );
  }
  function _0x73d6cc() {
    const _0x21ed63 = _0x37e680['querySelector']('.story-page.is-current'),
      _0x312c7d = _0x21ed63?.['querySelector'](
        '[data-story-action="generate-story"], [data-collaboration-start]',
      ),
      _0x489d02 =
        _0x57d133['homeTab'] === 'collaborate'
          ? Boolean(_0x57d133['idea']?.['trim']())
          : canStartStoryHomeGeneration(_0x57d133);
    if (_0x312c7d) {
      ((_0x312c7d['disabled'] = !_0x489d02 || _0x57d133['isGeneratingStory']),
        syncStoryAsyncButton(_0x312c7d, _0x57d133['isGeneratingStory']));
      const _0x58c38c = _0x312c7d['querySelector']('[data-story-generate-label]');
      _0x58c38c && (_0x58c38c['textContent'] = getStoryHomeGenerateButtonLabel(_0x57d133));
      const _0x1be15e = _0x312c7d['querySelector']('.story-generate-arrow');
      if (_0x1be15e) _0x1be15e['hidden'] = _0x57d133['isGeneratingStory'];
    }
    const _0x2e2356 = _0x21ed63?.['querySelector']('[data-story-script-mode-control]');
    if (_0x2e2356) {
      const _0x5eac79 = normalizeStoryScriptMode(_0x57d133['scriptMode']),
        _0x214236 = _0x5eac79 === 'narration' ? '解说模式' : '剧情模式',
        _0x3e4c9c = _0x5eac79 === 'narration' ? '剧情模式' : '解说模式';
      ((_0x2e2356['hidden'] = !['generate', 'collaborate']['includes'](_0x57d133['homeTab'])),
        (_0x2e2356['dataset']['storyScriptMode'] = _0x5eac79),
        _0x2e2356['classList']['toggle']('is-narration', _0x5eac79 === 'narration'),
        _0x2e2356['setAttribute']('aria-pressed', String(_0x5eac79 === 'narration')),
        _0x2e2356['setAttribute']('aria-label', '当前' + _0x214236 + '，点击切换为' + _0x3e4c9c));
      const _0x30baf1 = _0x2e2356['querySelector']('[data-story-script-mode-label]');
      if (_0x30baf1) _0x30baf1['textContent'] = _0x214236;
    }
    const _0x1bc003 = _0x21ed63?.['querySelector']('[data-story-script-mode-hint]');
    _0x1bc003 &&
      (_0x1bc003['textContent'] = hasStoryHomeReferenceScript(_0x57d133)
        ? STORY_HOME_REWRITE_SOURCE_HINT
        : getStoryScriptModeHint(_0x57d133['scriptMode']));
    const _0x2c4185 = _0x21ed63?.['querySelector']('[data-story-planning-picker="episodeCount"]');
    if (_0x2c4185) _0x2c4185['hidden'] = !['generate', 'collaborate']['includes'](_0x57d133['homeTab']);
    const _0x25b18d = _0x21ed63?.['querySelector']('[data-story-planning-picker="promptMode"]');
    if (_0x25b18d) _0x25b18d['hidden'] = ![];
    const _0x2e85bf = _0x21ed63?.['querySelector']('[data-story-planning-picker=\x22targetLocale\x22]');
    if (_0x2e85bf) _0x2e85bf['hidden'] = _0x57d133['homeTab'] !== 'replication';
    const _0xdc6483 = _0x21ed63?.['querySelector']('.story-home-composer');
    (_0xdc6483?.['classList']['toggle']('is-generating', _0x57d133['isGeneratingStory']),
      _0xdc6483?.['setAttribute']('aria-busy', _0x57d133['isGeneratingStory'] ? 'true' : 'false'));
    const _0x339d22 = _0x21ed63?.['querySelector']('[data-story-generation-loading]');
    if (_0x339d22) _0x339d22['hidden'] = !_0x57d133['isGeneratingStory'];
    const _0x323eca = _0x21ed63?.['querySelector']('[data-story-generation-loading-label]');
    if (_0x323eca) _0x323eca['textContent'] = _0x57d133['generationStatus'] || '正在创建剧情';
    const _0x53b4d4 = _0x21ed63?.['querySelector']('[data-story-idea-count]');
    _0x53b4d4 && (_0x53b4d4['textContent'] = _0x57d133['idea']['length'] + ' / ' + STORY_IDEA_MAX_CHARACTERS);
    const _0x127f75 = _0x21ed63?.['querySelector']('[data-story-paste-count]');
    _0x127f75 &&
      (_0x127f75['textContent'] =
        _0x57d133['scriptText']['length'] + '\x20/\x20' + STORY_SCRIPT_MAX_CHARACTERS);
  }
  function _0x4717df(_0x319f7c) {
    if (_0x319f7c === 'collaborate' && _0x57d133['developerModeAvailable'] !== !![]) return ![];
    const _0x29ce16 = resolveStoryVideoReplicationHomeTab(_0x57d133, _0x319f7c);
    if (_0x319f7c === 'replication' && _0x29ce16 !== _0x319f7c) return ![];
    if (_0x57d133['homeTab'] === _0x29ce16) return ![];
    _0x57d133['homeTab'] = _0x29ce16;
    const _0xee0140 = _0x37e680['querySelector']('.story-page.is-current'),
      _0x7f47ce = _0xee0140?.['querySelector']('[data-story-home-tabs]'),
      _0x214105 = _0xee0140?.['querySelector']('.story-home-composer-body');
    if (!_0x7f47ce || !_0x214105) {
      _0x3e53a1();
      return;
    }
    _0x7f47ce['dataset']['activeTab'] = _0x29ce16;
    const _0x473d5a = _0xee0140['querySelector']('[data-story-home-mode-description]');
    if (_0x473d5a)
      _0x473d5a['textContent'] = getStoryHomeModeDescription(
        _0x29ce16,
        _0x57d133['scriptIntent'],
      );
    _0x7f47ce['querySelectorAll']('[data-story-home-tab]')['forEach']((_0x2c43ea) => {
      const _0x126c7c = _0x2c43ea['dataset']['storyHomeTab'] === _0x29ce16;
      (_0x2c43ea['classList']['toggle']('is-active', _0x126c7c),
        _0x2c43ea['setAttribute']('aria-selected', String(_0x126c7c)),
        (_0x2c43ea['tabIndex'] = _0x126c7c ? 0x0 : -0x1));
    });
    if (_0x29ce16 === 'replication') {
      const _0x446027 = resolveStoryVideoInputTextModelId(_0x57d133['models']['text']);
      if (_0x446027) {
        const _0x134e64 = getStoryWorkspaceModelChoice('text', _0x446027);
        ((_0x57d133['models']['text'] = _0x446027),
          (_0x57d133['textProvider'] = _0x134e64?.['provider'] || _0x57d133['textProvider']),
          (_0x57d133['textProviderProfileId'] = resolveStoryTextProviderProfileId(
            _0x57d133['textProvider'],
            _0x57d133['textProviderProfileId'],
          )));
      }
    }
    _0x214105['innerHTML'] = renderStoryHomeComposerBody(_0x57d133);
    const _0x549eae = _0xee0140['querySelector']('.story-home-model-bar'),
      _0x37d77d = documentObject['createElement']('template');
    _0x37d77d['innerHTML'] = renderStoryHomeModelBar(_0x57d133)['trim']();
    const _0x2c3207 = _0x37d77d['content']['firstElementChild'];
    return (
      _0x549eae && _0x2c3207 && (_0x549eae['replaceWith'](_0x2c3207), _0x71a456(_0xee0140)),
      _0x73d6cc(),
      _0x31b651(),
      !![]
    );
  }
  function _0x5fbeb8(_0x517db4) {
    const _0x5c6c78 = normalizeStoryScriptMode(_0x517db4);
    if (_0x57d133['scriptMode'] === _0x5c6c78) return ![];
    return ((_0x57d133['scriptMode'] = _0x5c6c78), _0x73d6cc(), _0x31b651(), !![]);
  }
  // A novel is adapted in batches, so parse it into chapters and pick the first batch instead
  // of handing the whole book to the rewrite pipeline.
  function _0x6c2f10(_0x4f8a3b) {
    const _0x3f0e1c = normalizeChapterRecords(splitNovelChapters(_0x4f8a3b)),
      _0x5a1d2b = defaultChapterSelection(_0x3f0e1c);
    return (
      (_0x57d133['novelChapters'] = _0x3f0e1c),
      (_0x57d133['novelSelectedChapterIds'] = _0x5a1d2b.chapterIds),
      (_0x57d133['novelEpisodeCount'] = _0x5a1d2b.episodeSuggestion.recommended),
      _0x3f0e1c['length']
    );
  }
  async function _0x303d33(_0x235894) {
    if (!_0x235894) return ![];
    if (typeof _0xfe5af4 !== 'function') return (_0x17e886('剧本文档解析服务尚未初始化。', 'error'), ![]);
    const _0x21352f = _0x57d133['data'];
    ((_0x57d133['isParsingDocument'] = !![]), _0x3e53a1());
    try {
      const _0x2df689 = await _0xfe5af4(_0x235894);
      if (_0x57d133['data'] !== _0x21352f) return ![];
      // The parser used to slice the document to the limit without saying anything, so an
      // oversized novel silently lost everything past the cut. Report the loss explicitly.
      const _0x3f8a1c = String(_0x2df689?.['text'] || ''),
        _0x44db80 = _0x3f8a1c['slice'](0x0, STORY_SCRIPT_MAX_CHARACTERS),
        _0x1c0e77 = _0x3f8a1c['length'] - _0x44db80['length'];
      if (!normalizeText(_0x44db80)) throw new Error('文档解析结果没有可用文本。');
      return (
        (_0x57d133['scriptCharacterCount'] = Number['isFinite'](_0x2df689?.['characterCount'])
          ? _0x2df689['characterCount']
          : _0x44db80['length']),
        (_0x57d133['scriptText'] = _0x44db80),
        (_0x57d133['uploadInputMode'] = 'file'),
        (_0x57d133['scriptFileName'] = _0x235894['name']),
        !_0x57d133['hasCreatedProject'] &&
          (_0x57d133['data']['project']['sourceDocument'] = {
            fileName: _0x235894['name'],
            text: _0x44db80,
            characterCount: _0x57d133['scriptCharacterCount'],
          }),
        _0x31b651({ immediate: !![] }),
        _0x1c0e77 > 0x0 &&
          _0x372c60(
            '文档共 ' +
              _0x3f8a1c['length'] +
              ' 字，超出单次处理上限 ' +
              STORY_SCRIPT_MAX_CHARACTERS +
              ' 字，本次只保留前 ' +
              _0x44db80['length'] +
              ' 字，其余 ' +
              _0x1c0e77 +
              ' 字未进入项目。请拆分后分批处理。',
            'warn',
          ),
        (_0x57d133['scriptTruncatedCharacters'] = _0x1c0e77),
        _0x57d133['scriptIntent'] === 'novel'
          ? (function () {
              const _0x2c6a1f = _0x6c2f10(_0x44db80);
              (_0x31b651({ immediate: !![] }),
                _0x3e53a1(),
                _0x372c60(
                  _0x2c6a1f > 0x1
                    ? '已解析 ' + _0x2c6a1f + ' 章，请勾选本次要改编的章节。'
                    : '未能识别章节标题，全文作为一章，请确认是否继续。',
                  _0x2c6a1f > 0x1 ? 'success' : 'warn',
                ));
            })()
          : _0x372c60('剧本文档解析完成。', 'success'),
        !![]
      );
    } catch (_0x5591f2) {
      return (_0x372c60(_0x5591f2?.['message'] || '剧本文档解析失败。', 'error', _0x5591f2), ![]);
    } finally {
      ((_0x57d133['isParsingDocument'] = ![]), _0x3e53a1());
    }
  }
  return {
    deleteProject: _0x3c9ee4,
    duplicateProject: _0x5c9fde,
    focusProjectTitle: _0x84c4a0,
    resetCreationState: _0x27684a,
    selectScriptFile: _0x303d33,
    selectScriptMode: _0x5fbeb8,
    setProjectArchived: _0x48fcdc,
    switchTab: _0x4717df,
    syncGenerateState: _0x73d6cc,
  };
}
