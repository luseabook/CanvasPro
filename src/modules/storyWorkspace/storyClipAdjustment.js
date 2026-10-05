import { normalizeStoryPromptMode } from './storyPromptModes.js';
import { normalizeStoryPromptLanguage } from '../../domain/storyGeneration/promptLanguage.js';
export const STORY_CLIP_ADJUSTMENT_SCOPES = Object['freeze'](['selection', 'prompt', 'clip']);
export const STORY_CLIP_PROMPT_HISTORY_LIMIT = 20;
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function buildStoryClipAdjustmentGenerationKey(item = '', key = '', index = '') {
  const result = [item, key, index]['map'](normalizeText);
  return result['every'](Boolean) ? JSON['stringify'](result) : '';
}
export function isStoryClipAdjustmentGenerating(options = {}, data = {}, target = {}) {
  const storyClipAdjustmentGenerationKey = buildStoryClipAdjustmentGenerationKey(
    options?.['data']?.['project']?.['id'],
    data?.['id'],
    target?.['id'],
  );
  return Boolean(
    storyClipAdjustmentGenerationKey &&
    Array['isArray'](options?.['clipAdjustmentGeneratingIds']) &&
    options['clipAdjustmentGeneratingIds']['includes'](storyClipAdjustmentGenerationKey),
  );
}
function normalizeDurationSeconds(next) {
  const current = String(next ?? '')['match'](/\d+(?:\.\d+)?/),
    count = Number(current?.[0]);
  return Number['isFinite'](count) && count > 0 ? Number(count['toFixed'](1)) : 0;
}
function formatDurationSeconds(entry) {
  const durationSeconds = normalizeDurationSeconds(entry);
  return durationSeconds > 0 ? durationSeconds['toFixed'](1) + 's' : '';
}
function hashPromptHistoryValue(record) {
  let payload = 0x811c9dc5;
  const handle = String(record || '');
  for (let state = 0; state < handle['length']; state += 1) {
    ((payload ^= handle['charCodeAt'](state)), (payload = Math['imul'](payload, 0x1000193)));
  }
  return (payload >>> 0)['toString'](36);
}
function getPromptHistoryEntryKey(options2 = {}) {
  return [
    normalizeText(options2['promptHtml']),
    normalizeStoryPromptLanguage(options2['promptLanguage']),
    normalizeStoryPromptMode(options2['promptMode'], { allowDeveloperModes: true }),
    normalizeDurationSeconds(options2['durationSec'] || options2['duration']),
  ]['join']('\x00');
}
export function normalizeStoryClipPromptHistory(list = []) {
  const config = [],
    input = new Set();
  for (const enabled of Array['isArray'](list) ? list : []) {
    if (!enabled || typeof enabled !== 'object') continue;
    const text = normalizeText(enabled['promptHtml'] || enabled['prompt']);
    if (!text) continue;
    const storyPromptMode = normalizeStoryPromptMode(enabled['promptMode'], { allowDeveloperModes: true }),
      durationSeconds2 = normalizeDurationSeconds(
        enabled['durationSec'] || enabled['durationSeconds'] || enabled['duration'],
      ),
      count2 = Number(enabled['savedAt'] || enabled['createdAt']),
      output = Number['isFinite'](count2) && count2 > 0 ? Math['trunc'](count2) : 0,
      value2 = {
        id:
          normalizeText(enabled['id']) ||
          'prompt-history-' +
            output +
            '-' +
            hashPromptHistoryValue(text + '\x00' + storyPromptMode + '\x00' + durationSeconds2),
        promptHtml: text,
        promptMode: storyPromptMode,
        promptLanguage: normalizeStoryPromptLanguage(enabled['promptLanguage']),
        durationSec: durationSeconds2,
        duration:
          durationSeconds2 > 0
            ? formatDurationSeconds(durationSeconds2)
            : normalizeText(enabled['duration']),
        instruction: normalizeText(enabled['instruction']),
        source: normalizeText(enabled['source']) || 'ai-adjustment',
        savedAt: output,
      },
      promptHistoryEntryKey = getPromptHistoryEntryKey(value2);
    if (input['has'](promptHistoryEntryKey)) continue;
    (input['add'](promptHistoryEntryKey), config['push'](value2));
    if (config['length'] >= STORY_CLIP_PROMPT_HISTORY_LIMIT) break;
  }
  return config;
}
export function createStoryClipPromptHistoryEntry(
  value3,
  {
    instruction: instruction = '',
    promptMode: promptMode = '',
    source: source = 'ai-adjustment',
    savedAt: savedAt = Date['now'](),
  } = {},
) {
  const text2 = normalizeText(value3?.['prompt']);
  if (!text2) return null;
  const storyPromptMode2 = normalizeStoryPromptMode(promptMode || value3?.['promptMode'], {
      allowDeveloperModes: true,
    }),
    durationSeconds3 = normalizeDurationSeconds(
      value3?.['durationSec'] || value3?.['durationSeconds'] || value3?.['duration'],
    ),
    value4 =
      Number['isFinite'](Number(savedAt)) && Number(savedAt) > 0
        ? Math['trunc'](Number(savedAt))
        : Date['now']();
  return {
    id:
      'prompt-history-' +
      value4 +
      '-' +
      hashPromptHistoryValue(text2 + '\x00' + storyPromptMode2 + '\x00' + durationSeconds3),
    promptHtml: text2,
    promptMode: storyPromptMode2,
    promptLanguage: normalizeStoryPromptLanguage(value3?.['promptLanguage']),
    durationSec: durationSeconds3,
    duration:
      durationSeconds3 > 0 ? formatDurationSeconds(durationSeconds3) : normalizeText(value3?.['duration']),
    instruction: normalizeText(instruction),
    source: normalizeText(source) || 'ai-adjustment',
    savedAt: value4,
  };
}
export function saveCurrentStoryClipPromptToHistory(enabled2, value5 = {}) {
  if (!enabled2 || typeof enabled2 !== 'object') return null;
  const storyClipPromptHistoryEntry = createStoryClipPromptHistoryEntry(enabled2, value5);
  if (!storyClipPromptHistoryEntry) return null;
  return (
    (enabled2['promptHistory'] = normalizeStoryClipPromptHistory([
      storyClipPromptHistoryEntry,
      ...normalizeStoryClipPromptHistory(enabled2['promptHistory']),
    ])),
    storyClipPromptHistoryEntry
  );
}
export function restoreStoryClipPromptHistoryEntry(enabled3, value6, value7 = Date['now']()) {
  if (!enabled3 || typeof enabled3 !== 'object') return null;
  const list2 = normalizeStoryClipPromptHistory(enabled3['promptHistory']),
    enabled4 = list2['find']((value8) => value8['id'] === normalizeText(value6));
  if (!enabled4) return null;
  const storyClipPromptHistoryEntry2 = createStoryClipPromptHistoryEntry(enabled3, {
    instruction: '恢复历史版本前自动保存',
    source: 'history-restore',
    savedAt: value7,
  });
  return (
    (enabled3['prompt'] = enabled4['promptHtml']),
    (enabled3['promptMode'] = enabled4['promptMode']),
    (enabled3['promptLanguage'] = enabled4['promptLanguage']),
    enabled4['durationSec'] > 0 &&
      ((enabled3['durationSec'] = enabled4['durationSec']),
      (enabled3['duration'] = formatDurationSeconds(enabled4['durationSec']))),
    (enabled3['promptHistory'] = normalizeStoryClipPromptHistory(
      [storyClipPromptHistoryEntry2, ...list2['filter']((value9) => value9['id'] !== enabled4['id'])][
        'filter'
      ](Boolean),
    )),
    (enabled3['promptAdjustment'] = { ...getAdjustmentState(enabled3), candidate: null, lastApplied: null }),
    enabled4
  );
}
function normalizePromptText(value10) {
  return String(value10 || '')
    ['replace'](/\r\n?/g, '\n')
    ['replace'](/\u00a0/g, ' ')
    ['trim']();
}
function normalizePromptTextRaw(value11) {
  return String(value11 || '')
    ['replace'](/\r\n?/g, '\n')
    ['replace'](/\u00a0/g, ' ');
}
function getNodeChildren(value12) {
  return Array['from'](value12?.['childNodes'] || []);
}
function getNodeTagName(value13) {
  return String(value13?.['tagName'] || value13?.['nodeName'] || '')['toLowerCase']();
}
function nodeHasClass(value14, value15) {
  if (value14?.['classList']?.['contains']?.(value15)) return true;
  return String(value14?.['className'] || '')
    ['split'](/\s+/)
    ['includes'](value15);
}
function getNodeData(el, value16, value17) {
  return String(el?.['dataset']?.[value16] || el?.['getAttribute']?.(value17) || '')['trim']();
}
function serializeStoryPromptNode(enabled5) {
  if (!enabled5) return '';
  if (Number(enabled5['nodeType']) === 3) return String(enabled5['textContent'] || '');
  if (nodeHasClass(enabled5, 'ref-pill')) {
    const nodeData = getNodeData(enabled5, 'label', 'data-label') || normalizeText(enabled5['textContent']),
      nodeData2 = getNodeData(enabled5, 'promptPillKind', 'data-prompt-pill-kind'),
      nodeData3 = getNodeData(enabled5, 'assetId', 'data-asset-id');
    if (nodeData2 === 'time' || nodeData3 === 'story-meta:time') return nodeData ? '⏱ ' + nodeData : '';
    if (!nodeData) return '';
    return nodeData['startsWith']('@') ? nodeData : '@' + nodeData;
  }
  const nodeTagName = getNodeTagName(enabled5);
  if (nodeTagName === 'br') return '\n';
  const nodeChildren = getNodeChildren(enabled5)['map'](serializeStoryPromptNode)['join']('');
  return ['div', 'p', 'section', 'article', 'blockquote', 'li']['includes'](nodeTagName)
    ? nodeChildren + '\n'
    : nodeChildren;
}
export function serializeStoryClipPromptElement(value18) {
  return normalizePromptText(serializeStoryPromptNode(value18));
}
export function getStoryClipPromptLockedTokens(value19) {
  const value20 = [],
    list3 = [],
    value21 = new Set(),
    enabled6 = new Set();
  value19?.['querySelectorAll']?.('.ref-pill')?.['forEach']?.((value22) => {
    const text3 = normalizeText(serializeStoryPromptNode(value22));
    if (!text3) return;
    const nodeData4 = getNodeData(value22, 'promptPillKind', 'data-prompt-pill-kind'),
      nodeData5 = getNodeData(value22, 'assetId', 'data-asset-id'),
      value23 = nodeData4 === 'time' || nodeData5 === 'story-meta:time',
      value24 = value23 ? list3 : value20,
      value25 = value23 ? enabled6 : value21;
    if (value25['has'](text3)) return;
    (value25['add'](text3), value24['push'](text3));
  });
  const serializeStoryClipPromptElement2 = serializeStoryClipPromptElement(value19);
  for (const value26 of serializeStoryClipPromptElement2['matchAll'](
    /⏱\s*\d+(?:\.\d+)?s|\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?\s*(?:秒|s)|\b\d{2}:\d{2}\.\d{3}\b/gu,
  )) {
    !enabled6['has'](value26[0]) && (enabled6['add'](value26[0]), list3['push'](value26[0]));
  }
  return { assetTokens: value20, durationTokens: list3 };
}
function isNodeInside(enabled7, enabled8) {
  if (!enabled7 || !enabled8) return false;
  return enabled7 === enabled8 || enabled7['contains']?.(enabled8) === true;
}
export function captureStoryClipPromptSelection({
  promptEl: promptEl,
  selection: selection2,
  documentObject: documentObject = globalThis['document'],
} = {}) {
  if (!promptEl || !selection2 || selection2['rangeCount'] < 1 || selection2['isCollapsed']) return null;
  const value27 = selection2['getRangeAt'](0);
  if (!isNodeInside(promptEl, value27['startContainer']) || !isNodeInside(promptEl, value27['endContainer']))
    return null;
  const promptTextRaw = normalizePromptTextRaw(serializeStoryPromptNode(value27['cloneContents']?.())),
    list4 = promptTextRaw['trim']();
  if (!list4) return null;
  const promptTextRaw2 = normalizePromptTextRaw(serializeStoryPromptNode(promptEl)),
    enabled9 = promptTextRaw2['trim']();
  if (!enabled9) return null;
  let count3 = -1;
  if (typeof documentObject?.['createRange'] === 'function') {
    const value28 = documentObject['createRange']();
    (value28['selectNodeContents'](promptEl),
      value28['setEnd'](value27['startContainer'], value27['startOffset']));
    const promptTextRaw3 = normalizePromptTextRaw(serializeStoryPromptNode(value28['cloneContents']?.())),
      value29 = promptTextRaw2['length'] - promptTextRaw2['trimStart']()['length'],
      value30 = promptTextRaw['length'] - promptTextRaw['trimStart']()['length'];
    count3 = promptTextRaw3['length'] + value30 - value29;
  }
  (count3 < 0 || enabled9['slice'](count3, count3 + list4['length']) !== list4) &&
    (count3 = enabled9['indexOf'](list4));
  if (count3 < 0) return null;
  return { start: count3, end: count3 + list4['length'], text: list4, sourcePromptText: enabled9 };
}
export function normalizeStoryClipAdjustmentScope(value31, enabled10 = false) {
  const text4 = normalizeText(value31);
  if (text4 === 'selection' && !enabled10) return 'prompt';
  return STORY_CLIP_ADJUSTMENT_SCOPES['includes'](text4) ? text4 : 'prompt';
}
export function buildStoryClipAdjustmentCandidateText({
  sourcePromptText: sourcePromptText = '',
  generatedText: generatedText = '',
  scope: scope = 'prompt',
  selection: selection = null,
} = {}) {
  const list5 = normalizePromptText(sourcePromptText),
    promptText = normalizePromptText(generatedText);
  if (!list5) throw new Error('当前片段还没有可调整的视频提示词。');
  if (!promptText) throw new Error('AI 没有返回可用的候选内容。');
  if (normalizeStoryClipAdjustmentScope(scope, Boolean(selection)) !== 'selection') return promptText;
  const value32 = Math['max'](0, Math['trunc'](Number(selection?.['start']) || 0)),
    value33 = Math['max'](value32, Math['trunc'](Number(selection?.['end']) || value32));
  if (value33 > list5['length'] || !normalizeText(list5['slice'](value32, value33)))
    throw new Error('选中文字已经变化，请重新选择后再调整。');
  return normalizePromptText('' + list5['slice'](0, value32) + promptText + list5['slice'](value33));
}
function getAdjustmentState(value34) {
  return value34?.['promptAdjustment'] && typeof value34['promptAdjustment'] === 'object'
    ? value34['promptAdjustment']
    : {};
}
export function setStoryClipAdjustmentCandidate(enabled11, args) {
  if (!enabled11 || typeof enabled11 !== 'object' || !args?.['promptHtml']) return false;
  return (
    (enabled11['promptAdjustment'] = { ...getAdjustmentState(enabled11), candidate: { ...args } }),
    true
  );
}
export function discardStoryClipAdjustmentCandidate(enabled12) {
  if (!enabled12 || typeof enabled12 !== 'object') return false;
  const args2 = getAdjustmentState(enabled12);
  if (!args2['candidate']) return false;
  return ((enabled12['promptAdjustment'] = { ...args2, candidate: null }), true);
}
export function applyStoryClipAdjustmentCandidate(enabled13, value35 = Date['now']()) {
  if (
    enabled13?.['requiredDialogueLanguage'] &&
    enabled13['requiredDialogueLanguage'] !== enabled13['promptAdjustment']?.['candidate']?.['targetLanguage']
  )
    return false;
  const adjustmentState = getAdjustmentState(enabled13)['candidate'];
  if (!enabled13 || !adjustmentState?.['promptHtml']) return false;
  const value36 = String(enabled13['prompt'] || ''),
    storyPromptLanguage = normalizeStoryPromptLanguage(enabled13['promptLanguage']),
    value37 = String(enabled13['duration'] || ''),
    durationSeconds4 = normalizeDurationSeconds(
      enabled13['durationSec'] || enabled13['durationSeconds'] || enabled13['duration'],
    ),
    durationSeconds5 = normalizeDurationSeconds(adjustmentState['candidateDurationSeconds']),
    storyPromptMode3 = normalizeStoryPromptMode(
      adjustmentState['sourcePromptMode'] || enabled13['promptMode'],
      { allowDeveloperModes: true },
    ),
    storyPromptMode4 = normalizeStoryPromptMode(adjustmentState['targetPromptMode'] || storyPromptMode3, {
      allowDeveloperModes: true,
    }),
    text5 =
      normalizeText(adjustmentState['promptHtml']) !== normalizeText(value36) ||
      normalizeStoryPromptLanguage(adjustmentState['targetLanguage']) !== storyPromptLanguage ||
      storyPromptMode4 !== storyPromptMode3 ||
      (durationSeconds5 > 0 && durationSeconds5 !== durationSeconds4);
  return (
    text5 &&
      saveCurrentStoryClipPromptToHistory(enabled13, {
        instruction: adjustmentState['instruction'],
        promptMode: storyPromptMode3,
        source: 'ai-adjustment',
        savedAt: value35,
      }),
    (enabled13['prompt'] = String(adjustmentState['promptHtml'])),
    (enabled13['promptMode'] = storyPromptMode4),
    (enabled13['promptLanguage'] =
      normalizeStoryPromptLanguage(adjustmentState['targetLanguage']) || storyPromptLanguage),
    delete enabled13['requiredDialogueLanguage'],
    durationSeconds5 > 0 &&
      ((enabled13['durationSec'] = durationSeconds5),
      (enabled13['duration'] = formatDurationSeconds(durationSeconds5))),
    (enabled13['promptAdjustment'] = {
      candidate: null,
      lastApplied: {
        previousPromptHtml: value36,
        previousPromptLanguage: storyPromptLanguage,
        appliedPromptHtml: enabled13['prompt'],
        previousDuration: value37,
        previousDurationSec: durationSeconds4,
        appliedDuration: String(enabled13['duration'] || ''),
        appliedDurationSec: normalizeDurationSeconds(enabled13['durationSec'] || enabled13['duration']),
        instruction: normalizeText(adjustmentState['instruction']),
        previousPromptMode: storyPromptMode3,
        appliedPromptMode: storyPromptMode4,
        scope: normalizeStoryClipAdjustmentScope(adjustmentState['scope']),
        appliedAt: Number(value35) || Date['now'](),
      },
    }),
    true
  );
}
export function undoStoryClipAdjustment(enabled14) {
  const adjustmentState2 = getAdjustmentState(enabled14);
  if (!enabled14 || !adjustmentState2['lastApplied']?.['previousPromptHtml']) return false;
  ((enabled14['prompt'] = String(adjustmentState2['lastApplied']['previousPromptHtml'])),
    (enabled14['promptLanguage'] = normalizeStoryPromptLanguage(
      adjustmentState2['lastApplied']['previousPromptLanguage'],
    )),
    (enabled14['promptMode'] = normalizeStoryPromptMode(
      adjustmentState2['lastApplied']['previousPromptMode'] || enabled14['promptMode'],
      { allowDeveloperModes: true },
    )));
  const durationSeconds6 = normalizeDurationSeconds(
    adjustmentState2['lastApplied']['previousDurationSec'] ||
      adjustmentState2['lastApplied']['previousDuration'],
  );
  return (
    durationSeconds6 > 0 &&
      ((enabled14['durationSec'] = durationSeconds6),
      (enabled14['duration'] = formatDurationSeconds(durationSeconds6))),
    (enabled14['promptAdjustment'] = { candidate: adjustmentState2['candidate'] || null, lastApplied: null }),
    true
  );
}
export function clearStoryClipAdjustmentUndo(enabled15) {
  const args3 = getAdjustmentState(enabled15);
  if (!enabled15 || !args3['lastApplied']) return false;
  return ((enabled15['promptAdjustment'] = { ...args3, lastApplied: null }), true);
}
