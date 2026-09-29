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
function normalizeText(_0x467c92) {
  return String(_0x467c92 || '')['trim']();
}
export function createStoryClipAdjustmentController({
  state: _0x37aa9c,
  root: _0x1c055f,
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
  const _0x58c3ef = projectTasks['createToken'] || (() => null),
    _0x56ed91 = projectTasks['isLive'] || (() => ![]),
    _0x4b4502 = projectTasks['isCurrent'] || (() => ![]),
    _0x1a700b = projectTasks['syncEntry'] || (() => ![]),
    _0x822425 = new Map();
  function _0x4b3c05(_0x2feda8, _0x24036b) {
    if (_0x822425['get'](_0x2feda8) !== _0x24036b) return;
    (_0x822425['delete'](_0x2feda8),
      (_0x37aa9c['clipAdjustmentGeneratingIds'] = (_0x37aa9c['clipAdjustmentGeneratingIds'] || [])['filter'](
        (_0x213b4a) => _0x213b4a !== _0x2feda8,
      )));
  }
  function _0x495399({ close: close = ![] } = {}) {
    if (close) _0x37aa9c['clipAdjustmentOpen'] = ![];
    ((_0x37aa9c['clipAdjustmentInstruction'] = ''),
      (_0x37aa9c['clipAdjustmentPromptMode'] = ''),
      (_0x37aa9c['clipAdjustmentPromptModeOpen'] = ![]),
      (_0x37aa9c['clipAdjustmentLanguage'] = ''),
      (_0x37aa9c['clipAdjustmentLanguageOpen'] = ![]),
      (_0x37aa9c['clipPromptHistoryOpen'] = ![]));
  }
  function _0x4bfc92(_0x3654c4 = '') {
    const _0x3ef1a7 = documentObject['createElement']('div');
    return ((_0x3ef1a7['innerHTML'] = String(_0x3654c4 || '')), _0x3ef1a7);
  }
  function _0x4fb47e(_0x1b4a30) {
    const _0x50f374 =
        _0x1b4a30['id'] === _0x37aa9c['selectedClipId']
          ? _0x1c055f?.['querySelector']?.('[data-story-clip-prompt]')
          : null,
      _0x523420 = _0x50f374
        ? sanitizePromptHtmlForCommit(_0x50f374['innerHTML'])
        : sanitizePromptHtmlForCommit(
            renderStoryClipPromptMentions(_0x1b4a30?.['prompt'] || '', {
              assets: _0x37aa9c['data']?.['assets'] || [],
              episode: getSelection()['episode'],
              clipFrames: _0x37aa9c['data']?.['clipFrames'] || [],
            }),
          ),
      _0x2aa427 = _0x50f374 || _0x4bfc92(_0x523420);
    return {
      sourcePromptHtml: _0x523420,
      sourcePromptText: serializeStoryClipPromptElement(_0x2aa427),
      lockedTokens: getStoryClipPromptLockedTokens(_0x2aa427),
      officialPromptHtml: sanitizePromptHtmlForCommit(_0x1b4a30?.['prompt'] || ''),
    };
  }
  function _0x2cea69(_0x40fabd, _0x2d545c) {
    const _0x55acb4 = _0x37aa9c['data']?.['project'] || {};
    return {
      projectTitle: _0x55acb4['title'],
      sourceMode: _0x55acb4['sourceMode'],
      targetLocale:
        _0x40fabd?.['replication']?.['targetLocale'] ||
        _0x55acb4['replication']?.['targetLocale'] ||
        'source',
      sourceLanguage: _0x40fabd?.['replication']?.['sourceAnalysis']?.['sourceLanguage'] || '',
      storySummary: _0x55acb4['summary'],
      episodeNumber: _0x40fabd?.['number'],
      episodeTitle: _0x40fabd?.['title'],
      episodeSynopsis: _0x40fabd?.['synopsis'],
      clipTitle: _0x2d545c?.['title'],
      clipScript: _0x2d545c?.['script'],
      creativeIntent: _0x2d545c?.['creativeIntent'],
      transition: _0x2d545c?.['transition'],
    };
  }
  function _0x1887f3(_0x3499a4) {
    if (!_0x3499a4) return ![];
    const _0x55f417 = (_0x3499a4['clips'] || [])['reduce'](
      (_0x40b4dd, _0xc96dfa) =>
        _0x40b4dd +
        normalizeDurationSeconds(
          _0xc96dfa?.['durationSec'] || _0xc96dfa?.['durationSeconds'] || _0xc96dfa?.['duration'],
        ),
      0x0,
    );
    return (
      (_0x3499a4['durationSec'] = Number(_0x55f417['toFixed'](0x1))),
      (_0x3499a4['duration'] = formatStoryClockDuration(_0x3499a4['durationSec'])),
      !![]
    );
  }
  async function _0x1baa8e({
    instructionOverride: instructionOverride = '',
    promptModeOverride: promptModeOverride = '',
    languageOverride: languageOverride = '',
    selectionOverride: selectionOverride = null,
    sourceOverride: sourceOverride = null,
    contextOverride: contextOverride = null,
    projectTokenOverride: projectTokenOverride = null,
    execution: execution = {
      model: _0x37aa9c['models']['text'],
      provider: _0x37aa9c['textProvider'],
      providerProfileId: _0x37aa9c['textProviderProfileId'],
    },
    reserved: reserved = ![],
    reservation: reservation = null,
    reopenOnError: reopenOnError = !![],
  } = {}) {
    if (typeof adjustClipPrompt !== 'function') return (showToast('AI 调整服务尚未初始化。', 'error'), ![]);
    const { episode: _0x2d5f6f, clip: _0x2dc297 } = selectionOverride || getSelection();
    if (!_0x2d5f6f || !_0x2dc297) return ![];
    const _0x55e727 = normalizeText(_0x2dc297['id']),
      _0x33f03e = new Set(
        (Array['isArray'](_0x37aa9c['clipAdjustmentGeneratingIds'])
          ? _0x37aa9c['clipAdjustmentGeneratingIds']
          : [])['map']((_0x421619) => normalizeText(_0x421619)),
      ),
      _0x4ddea6 = buildStoryClipAdjustmentGenerationKey(
        projectTokenOverride?.['data']?.['project']?.['id'] || _0x37aa9c['data']?.['project']?.['id'],
        _0x2d5f6f['id'],
        _0x55e727,
      );
    if (!_0x4ddea6 || (!reserved && _0x33f03e['has'](_0x4ddea6))) return ![];
    const _0x2bb6da = normalizeText(
        reserved ? instructionOverride : instructionOverride || _0x37aa9c['clipAdjustmentInstruction'],
      ),
      _0x826e7b = normalizeStoryPromptMode(
        _0x2dc297['promptMode'] ||
          _0x2d5f6f['promptMode'] ||
          (projectTokenOverride?.['data'] || _0x37aa9c['data'])['project']?.['planning']?.['promptMode'],
        { allowDeveloperModes: !![] },
      ),
      _0x7d574c = normalizeStoryPromptMode(
        promptModeOverride || (!reserved && _0x37aa9c['clipAdjustmentPromptMode']) || _0x826e7b,
        { allowDeveloperModes: !![] },
      ),
      _0x3bf68f = _0x7d574c !== _0x826e7b,
      _0x5de20c = _0x2dc297['requiredDialogueLanguage'] || '',
      _0x3ed423 = normalizeStoryPromptLanguage(
        (reserved ? languageOverride : languageOverride || _0x37aa9c['clipAdjustmentLanguage']) || _0x5de20c,
      );
    if (!_0x2bb6da && !_0x3bf68f && !_0x3ed423)
      return (
        showToast('请选择提示词模式、转换语言，或填写调整要求。', 'warn'),
        _0x1c055f?.['querySelector']?.('[data-story-clip-adjustment-instruction]')?.['focus'](),
        ![]
      );
    const _0x524210 = sourceOverride || _0x4fb47e(_0x2dc297);
    if (!_0x524210['sourcePromptText']) return (showToast('当前片段还没有可调整的视频提示词。', 'warn'), ![]);
    const _0xf43d11 = projectTokenOverride || _0x58c3ef();
    if (!_0x56ed91(_0xf43d11)) return ![];
    const _0x2b6412 = _0x2d5f6f['id'],
      _0x356eeb = normalizeDurationSeconds(
        _0x2dc297['durationSec'] || _0x2dc297['durationSeconds'] || _0x2dc297['duration'],
      ),
      _0x193083 = normalizeStorySceneMaxSeconds(
        _0xf43d11['data']['project']?.['planning']?.['sceneMaxSeconds'],
      ),
      _0x5764f0 = isStoryMinimaxH3PromptMode(_0x7d574c) ? Math['min'](0xf, _0x193083) : _0x193083;
    (_0x33f03e['add'](_0x4ddea6), (_0x37aa9c['clipAdjustmentGeneratingIds'] = [..._0x33f03e]));
    _0x4b4502(_0xf43d11) &&
      ((_0x37aa9c['clipAdjustmentOpen'] = ![]),
      (_0x37aa9c['clipAdjustmentInstruction'] = ''),
      (_0x37aa9c['clipAdjustmentPromptModeOpen'] = ![]),
      (_0x37aa9c['clipAdjustmentLanguageOpen'] = ![]),
      (_0x37aa9c['clipPromptHistoryOpen'] = ![]));
    if (!reserved) render();
    try {
      const _0x98b166 = Boolean(_0x3ed423 && !_0x2bb6da && !_0x3bf68f),
        _0x104795 = await adjustClipPrompt({
          project: { sourceMode: _0xf43d11['data']['project']?.['sourceMode'] },
          scope: 'prompt',
          instruction: _0x2bb6da,
          currentPrompt: _0x524210['sourcePromptText'],
          selection: null,
          preserveAssetRefs: !![],
          preserveDuration: _0x98b166,
          lockedAssetTokens: _0x524210['lockedTokens']['assetTokens'],
          lockedDurationTokens: _0x98b166 ? _0x524210['lockedTokens']['durationTokens'] : [],
          duration: _0x2dc297['duration'],
          maxDurationSeconds: _0x5764f0,
          context: contextOverride || _0x2cea69(_0x2d5f6f, _0x2dc297),
          sourcePromptMode: _0x826e7b,
          targetPromptMode: _0x7d574c,
          targetLanguage: _0x3ed423 || _0x2dc297['promptLanguage'],
          ...execution,
        });
      if (!_0x56ed91(_0xf43d11)) return ![];
      const _0x29d1b9 = _0xf43d11['data']['episodes']['find']((_0x450d5e) => _0x450d5e['id'] === _0x2b6412),
        _0x28b0d4 = _0x29d1b9?.['clips']?.['find']((_0x40e1bb) => _0x40e1bb['id'] === _0x55e727);
      if (!_0x28b0d4) return ![];
      if ((_0x28b0d4['requiredDialogueLanguage'] || '') !== _0x5de20c)
        throw new Error('对白语言设置已变化，请按最新语言重新调整提示词。');
      const _0x4b361b = sanitizePromptHtmlForCommit(
        renderStoryClipPromptMentions(_0x104795['candidateText'], {
          assets: _0xf43d11['data']['assets'],
          episode: _0x29d1b9,
          clipFrames: _0xf43d11['data']['clipFrames'],
        }),
      );
      return (
        setStoryClipAdjustmentCandidate(_0x28b0d4, {
          id: 'candidate-' + Date['now'](),
          scope: 'prompt',
          instruction: _0x2bb6da,
          promptText: _0x104795['candidateText'],
          promptHtml: _0x4b361b,
          sourcePromptHtml: _0x524210['officialPromptHtml'],
          preserveAssetRefs: !![],
          preserveDuration: _0x98b166,
          sourceDurationSeconds: _0x356eeb,
          candidateDurationSeconds: _0x104795['candidateDurationSeconds'],
          sourcePromptMode: _0x826e7b,
          targetPromptMode: _0x7d574c,
          targetLanguage: _0x3ed423 || _0x2dc297['promptLanguage'] || '',
          maxDurationSeconds: _0x5764f0,
          modelId: execution['model'],
          provider: execution['provider'],
          createdAt: Date['now'](),
        }),
        _0x1a700b(_0xf43d11),
        schedulePersistence({ immediate: !![] }),
        _0x4b4502(_0xf43d11) &&
          _0x37aa9c['selectedClipId'] === _0x55e727 &&
          ((_0x37aa9c['clipAdjustmentOpen'] = ![]),
          (_0x37aa9c['clipAdjustmentInstruction'] = ''),
          (_0x37aa9c['clipAdjustmentPromptMode'] = ''),
          (_0x37aa9c['clipAdjustmentPromptModeOpen'] = ![]),
          (_0x37aa9c['clipAdjustmentLanguage'] = ''),
          (_0x37aa9c['clipAdjustmentLanguageOpen'] = ![])),
        notifyTextTaskComplete(
          'AI 调整完成，请在右侧选择提示词版本。',
          _0xf43d11,
          { episodeId: _0x2b6412, clipId: _0x55e727 },
          { notificationMessage: '片段视频提示词 AI 调整完成。' },
        ),
        !![]
      );
    } catch (_0x9dd5bc) {
      if (!_0x56ed91(_0xf43d11)) return ![];
      const _0x18771e = showTaskApiKeyError(_0x9dd5bc, {
        provider: execution['provider'],
        modelId: execution['model'],
      });
      return (
        !_0x18771e && showTaskResultToast(_0x9dd5bc?.['message'] || '候选版本生成失败。', 'error', _0x9dd5bc),
        reopenOnError &&
          _0x4b4502(_0xf43d11) &&
          _0x37aa9c['selectedClipId'] === _0x55e727 &&
          ((_0x37aa9c['clipAdjustmentOpen'] = !![]),
          (_0x37aa9c['clipAdjustmentInstruction'] = _0x2bb6da),
          (_0x37aa9c['clipAdjustmentPromptMode'] = _0x7d574c),
          (_0x37aa9c['clipAdjustmentLanguage'] = _0x3ed423),
          (_0x37aa9c['clipAdjustmentPromptModeOpen'] = ![])),
        ![]
      );
    } finally {
      _0x4b3c05(_0x4ddea6, reservation);
      if (_0x4b4502(_0xf43d11)) render();
    }
  }
  async function _0x182938(_0x114ea9 = {}) {
    const { episode: _0x5aafdb, clip: _0x4cfde8 } = getSelection();
    if (!_0x5aafdb || !_0x4cfde8) return ![];
    const _0xbc02aa = new Set(_0x37aa9c['selectedClipGenerationIds'] || []),
      _0xbab77e =
        _0x37aa9c['clipSelectionMode'] && !_0x114ea9['single']
          ? (_0x5aafdb['clips'] || [])['filter']((_0x3704cb) => _0xbc02aa['has'](_0x3704cb['id']))
          : [_0x4cfde8],
      _0x2d4d8d = normalizeText(_0x114ea9['instructionOverride'] || _0x37aa9c['clipAdjustmentInstruction']),
      _0x36b5d7 = _0x114ea9['promptModeOverride'] || _0x37aa9c['clipAdjustmentPromptMode'],
      _0x4e04a3 = _0x114ea9['languageOverride'] || _0x37aa9c['clipAdjustmentLanguage'];
    if (!_0xbab77e['length']) return (showToast('请先选择要调整提示词的片段。', 'warn'), ![]);
    const _0x28b58f = _0x58c3ef(),
      _0x23c461 = new Set(_0x37aa9c['clipAdjustmentGeneratingIds'] || []),
      _0x5f19d7 = _0xbab77e['flatMap']((_0x5e0773) => {
        const _0x124221 = buildStoryClipAdjustmentGenerationKey(
            _0x37aa9c['data']?.['project']?.['id'],
            _0x5aafdb['id'],
            _0x5e0773['id'],
          ),
          _0x4faf6 =
            _0x5e0773['promptMode'] ||
            _0x5aafdb['promptMode'] ||
            _0x37aa9c['data']['project']?.['planning']?.['promptMode'];
        if (!_0x124221 || _0x23c461['has'](_0x124221)) return [];
        if (!_0x2d4d8d && !_0x4e04a3 && (!_0x36b5d7 || _0x36b5d7 === _0x4faf6)) return [];
        return (
          _0x23c461['add'](_0x124221),
          [
            {
              key: _0x124221,
              selectionOverride: { episode: { ..._0x5aafdb }, clip: { ..._0x5e0773 } },
              sourceOverride: _0x4fb47e(_0x5e0773),
              contextOverride: _0x2cea69(_0x5aafdb, _0x5e0773),
            },
          ]
        );
      });
    if (!_0x5f19d7['length'])
      return (
        showToast('请选择转换语言、不同的提示词模式或填写要求；正在调整的片段不会重复提交。', 'info'),
        ![]
      );
    const _0x285178 = {
        model: _0x37aa9c['models']['text'],
        provider: _0x37aa9c['textProvider'],
        providerProfileId: _0x37aa9c['textProviderProfileId'],
      },
      _0x4619d7 = Symbol('clip-adjustment-batch');
    (_0x5f19d7['forEach']((_0x31250b) => _0x822425['set'](_0x31250b['key'], _0x4619d7)),
      (_0x37aa9c['clipAdjustmentGeneratingIds'] = [..._0x23c461]),
      (_0x37aa9c['clipAdjustmentOpen'] = ![]),
      render());
    let _0x2c8a0f = 0x0;
    const _0x2240b6 = [];
    try {
      return (
        await Promise['all'](
          Array['from']({ length: Math['min'](0x3, _0x5f19d7['length']) }, async () => {
            while (_0x2c8a0f < _0x5f19d7['length']) {
              const _0x32aabd = _0x5f19d7[_0x2c8a0f++];
              if (!_0x56ed91(_0x28b58f)) break;
              _0x2240b6['push'](
                await _0x1baa8e({
                  ..._0x114ea9,
                  ..._0x32aabd,
                  instructionOverride: _0x2d4d8d,
                  promptModeOverride: _0x36b5d7,
                  languageOverride: _0x4e04a3,
                  execution: _0x285178,
                  reserved: !![],
                  reservation: _0x4619d7,
                  projectTokenOverride: _0x28b58f,
                  reopenOnError: _0x5f19d7['length'] === 0x1 && _0x114ea9['reopenOnError'] !== ![],
                }),
              );
            }
          }),
        ),
        _0x2240b6['some'](Boolean)
      );
    } finally {
      _0x5f19d7['forEach']((_0x4ec84e) => _0x4b3c05(_0x4ec84e['key'], _0x4619d7));
      if (_0x4b4502(_0x28b58f)) render();
    }
  }
  function _0x220985() {
    const { episode: _0x1931a2, clip: _0x1947b4 } = getSelection(),
      _0x40633f = _0x1947b4?.['promptAdjustment']?.['candidate'];
    if (!_0x1947b4 || !_0x40633f) return ![];
    if (
      sanitizePromptHtmlForCommit(_0x1947b4['prompt'] || '') !==
      sanitizePromptHtmlForCommit(_0x40633f['sourcePromptHtml'] || '')
    )
      return (showToast('当前提示词已变化，请基于最新内容重新生成候选。', 'warn'), ![]);
    if (!applyStoryClipAdjustmentCandidate(_0x1947b4))
      return (showToast('候选提示词语言与最新对白语言不一致，请重新选择语言并调整。', 'warn'), ![]);
    return (
      clearStoryClipAdjustmentUndo(_0x1947b4),
      _0x1887f3(_0x1931a2),
      applyClipVideoSettings(_0x1947b4),
      _0x495399({ close: !![] }),
      schedulePersistence({ immediate: !![] }),
      render(),
      showToast('已使用 AI 调整后的提示词。', 'success'),
      !![]
    );
  }
  function _0x36f978(_0x5df9d8) {
    const { episode: _0x27fde9, clip: _0x85c7cd } = getSelection();
    if (!_0x85c7cd) return ![];
    const _0x338752 = _0x1c055f?.['querySelector']?.('[data-story-clip-prompt]');
    _0x338752 && (_0x85c7cd['prompt'] = sanitizePromptHtmlForCommit(_0x338752['innerHTML']));
    const _0x4ca640 = restoreStoryClipPromptHistoryEntry(_0x85c7cd, _0x5df9d8);
    if (!_0x4ca640) return ![];
    (_0x1887f3(_0x27fde9), _0x495399({ close: !![] }), schedulePersistence({ immediate: !![] }));
    if (!refreshPromptRestore()) render();
    return (
      refreshReferenceSummary(),
      refreshTimeline(),
      showToast('已恢复提示词历史版本。', 'success'),
      !![]
    );
  }
  function _0x347155() {
    const { clip: _0x33b626 } = getSelection();
    if (!discardStoryClipAdjustmentCandidate(_0x33b626)) return ![];
    return (
      _0x495399({ close: !![] }),
      schedulePersistence({ immediate: !![] }),
      render(),
      showToast('已保留原提示词版本。', 'info'),
      !![]
    );
  }
  function _0x170200() {
    const { clip: _0xea1a14 } = getSelection(),
      _0xdbb59a = _0xea1a14?.['promptAdjustment']?.['candidate'];
    if (!_0xdbb59a) return ![];
    return (
      void _0x182938({
        instructionOverride:
          _0xdbb59a['instruction'] || '保持人物、场景和素材引用不变，重新生成一个提示词版本。',
        promptModeOverride: _0xdbb59a['targetPromptMode'],
        languageOverride: _0xdbb59a['targetLanguage'],
        single: !![],
        reopenOnError: ![],
      }),
      !![]
    );
  }
  return Object['freeze']({
    applySelected: _0x220985,
    discardSelected: _0x347155,
    generateCandidate: _0x182938,
    regenerateSelected: _0x170200,
    resetUi: _0x495399,
    restorePromptHistory: _0x36f978,
  });
}
