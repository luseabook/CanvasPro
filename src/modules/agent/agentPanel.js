import { findTextModelMenuItem } from '../../components/aigenText/apimartTextModelMenu.js';
import { createAgentConversationActions } from './agentConversationActions.js';
import { createAgentPanelContinuity } from './agentPanelContinuity.js';
import { buildAIGenTextModelMenuMarkup } from '../../components/aigenText/modelSelector.js';
import { createPromptAttachmentButtonHTML } from '../../components/refAttachmentButton.js';
import { closeNodeFooterMenus } from '../../components/shared/nodeFooterControls.js';
import { ADVANCED_SETTINGS_TUNE_ICON_MARKUP } from '../../components/sharedIconMarkup.js';
import { getLocale, onLocaleChange } from '../../i18n/index.js';
import { openImagePreview } from '../imagePreview.js';
import { createLinkCursor, getCursorSize } from '../cursorUtils.js';
import { createReferenceFallbackThumbElement } from '../referenceThumbnailFallback.js';
import { showContextMenu } from '../interaction/contextMenuPresenter.js';
import { bindAgentModelControls } from './agentModelControls.js';
export { commitAgentModelSelection } from './agentModelControls.js';
import {
  AGENT_CONVERSATION_INPUT_REF_LIMIT,
  createAgentConversationPresentation,
  normalizeAgentRenderableMediaUrl,
} from './agentConversationPresentation.js';
import { AGENT_PANEL_LOCALES, agentPanelText, formatAgentPanelText } from './agentPanelText.js';
import { agentIconSvg, createAgentButton, createAgentElement } from './agentPanelElements.js';
import { createAgentSkillPanel } from './agentSkillPanel.js';
import { createAgentSkillPicker } from './agentSkillPicker.js';
import { createAgentComposerAttachmentController } from './agentComposerAttachmentController.js';
import { renderAgentConversationChoices } from './agentConversationChoices.js';
export { formatAgentAssistantMarkdown } from './agentConversationPresentation.js';
const AGENT_QUICK_ACTIONS = Object['freeze']([
    {
      id: 'expand-prompt',
      labelKey: 'quickActionCanvasReviewLabel',
      promptKey: 'quickActionCanvasReviewPrompt',
    },
    { id: 'canvas-gap-check', labelKey: 'quickActionGapCheckLabel', promptKey: 'quickActionGapCheckPrompt' },
    {
      id: 'storyboard-plan',
      labelKey: 'quickActionStoryboardLabel',
      promptKey: 'quickActionStoryboardPrompt',
    },
    {
      id: 'selected-node-tune',
      labelKey: 'quickActionSelectedTuneLabel',
      promptKey: 'quickActionSelectedTunePrompt',
    },
  ]),
  AGENT_LEGACY_QUICK_ACTIONS = Object['freeze']([
    {
      id: 'expand-prompt',
      labelKey: 'legacyQuickActionExpandPromptLabel',
      promptKey: 'legacyQuickActionExpandPromptPrompt',
    },
    {
      id: 'storyboard-plan',
      labelKey: 'legacyQuickActionStoryboardLabel',
      promptKey: 'legacyQuickActionStoryboardPrompt',
    },
    {
      id: 'canvas-gap-check',
      labelKey: 'legacyQuickActionGapCheckLabel',
      promptKey: 'legacyQuickActionGapCheckPrompt',
    },
  ]),
  PLACEHOLDER_ACTION_MESSAGES = Object['freeze']({
    upload: 'placeholderUpload',
    custom: 'placeholderCustom',
    skills: 'placeholderSkills',
  }),
  AGENT_PANEL_WIDTH_STORAGE_KEY = 'aiCanvas.agentSidebarWidth.v1',
  AGENT_CUSTOM_QUICK_ACTIONS_STORAGE_KEY = 'aiCanvas.agentCustomQuickActions.v1',
  AGENT_CUSTOM_QUICK_ACTIONS_SEEDED_STORAGE_KEY = 'aiCanvas.agentCustomQuickActionsSeeded.v1',
  AGENT_CUSTOM_QUICK_ACTIONS_VERSION_STORAGE_KEY = 'aiCanvas.agentCustomQuickActionsVersion.v1',
  AGENT_CUSTOM_QUICK_ACTIONS_VERSION = 'canvas-defaults-v2',
  AGENT_PANEL_WIDTH_LIMITS = Object['freeze']({ min: 560, max: 860 }),
  AGENT_CUSTOM_QUICK_ACTION_LIMIT = 8,
  AGENT_NOTICE_AUTO_HIDE_MS = 3200;
function createAgentPromptAttachmentButton({ title: title = '', className: className = '' } = {}) {
  const el = document['createElement']('div');
  el['innerHTML'] = createPromptAttachmentButtonHTML({
    tooltip: title,
    stroke: 'currentColor',
    fill: 'var(--white-05)',
    circleFill: 'currentColor',
  });
  const el2 = el['firstElementChild'];
  if (el2)
    return (
      className['split'](/\s+/)
        ['filter'](Boolean)
        ['forEach']((value) => el2['classList']['add'](value)),
      el2['setAttribute']('role', 'button'),
      (el2['tabIndex'] = 0),
      el2
    );
  const el3 = createAgentElement(
    'div',
    ['prompt-attachment-btn', className]['filter'](Boolean)['join'](' '),
  );
  title && ((el3['title'] = title), el3['setAttribute']('aria-label', title));
  (el3['setAttribute']('role', 'button'), (el3['tabIndex'] = 0));
  const el4 = createAgentElement('span', 'btn-icon');
  return (
    (el4['innerHTML'] =
      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z" fill="var(--white-05)" /><circle cx="20" cy="20" r="2.5" fill="currentColor" /><path d="M12 12 Q 17 12 19 18" stroke-dasharray="3 3" /></svg>'),
    el3['appendChild'](el4),
    el3
  );
}
function setEditorText(el5, item = '') {
  ((el5['textContent'] = String(item || '')),
    el5['dispatchEvent']?.(new Event('input', { bubbles: !![] })));
}
function getEditorText(el6) {
  return String(el6?.['innerText'] || el6?.['textContent'] || '')['trim']();
}
function truncateUiText(key, index = 40) {
  const list = String(key || '')
    ['replace'](/\s+/g, ' ')
    ['trim']();
  return list['length'] <= index
    ? list
    : list['slice'](0, Math['max'](0, index - 3)) + '...';
}
function writeJsonArrayToStorage(result, data, options) {
  try {
    result?.['localStorage']?.['setItem']?.(data, JSON['stringify'](options));
  } catch {}
}
function normalizeQuickAction(custom = {}, target = '', locale = getLocale()) {
  const prompt = String(
    custom['promptKey'] ? agentPanelText(custom['promptKey'], locale) : custom['prompt'] || '',
  )['trim']();
  if (!prompt) return null;
  const id = String(custom['id'] || target || '')['trim']() || 'custom-' + Date['now'](),
    next = custom['labelKey'] ? agentPanelText(custom['labelKey'], locale) : custom['label'];
  return {
    id: id,
    label: truncateUiText(next || prompt, 28),
    prompt: prompt,
    custom: custom['custom'] === !![],
  };
}
function normalizeQuickActionList(list2 = [], locale2 = getLocale()) {
  return list2['map']((current, entry) =>
    normalizeQuickAction(current, 'custom-' + entry, locale2),
  )
    ['filter'](Boolean)
    ['slice'](0, AGENT_CUSTOM_QUICK_ACTION_LIMIT);
}
function getDefaultQuickActions(locale3 = getLocale()) {
  return normalizeQuickActionList(AGENT_QUICK_ACTIONS, locale3);
}
function getLegacyQuickActions(locale4 = getLocale()) {
  return normalizeQuickActionList(AGENT_LEGACY_QUICK_ACTIONS, locale4);
}
function isSameQuickActionContent(options2 = {}, record = {}) {
  return (
    String(options2['id'] || '') === String(record['id'] || '') &&
    String(options2['label'] || '') === String(record['label'] || '') &&
    String(options2['prompt'] || '') === String(record['prompt'] || '')
  );
}
function mergeSeedQuickActions(list3 = []) {
  const map = new Set(),
    list4 = [];
  return (
    [...getDefaultQuickActions(), ...normalizeQuickActionList(list3)]['forEach']((payload) => {
      const enabled = String(payload?.['id'] || '')['trim']();
      if (!enabled || map['has'](enabled)) return;
      (map['add'](enabled), list4['push'](payload));
    }),
    list4['slice'](0, AGENT_CUSTOM_QUICK_ACTION_LIMIT)
  );
}
function migrateQuickActionsToCurrentDefaults(list5 = []) {
  const list6 = getDefaultQuickActions(),
    map2 = new Map(list6['map']((handle) => [handle['id'], handle])),
    map3 = new Map(getLegacyQuickActions()['map']((state) => [state['id'], state])),
    list7 = normalizeQuickActionList(list5)['map']((config) => {
      const scope = map2['get'](config['id']),
        input = map3['get'](config['id']);
      if (scope && input && isSameQuickActionContent(config, input)) return scope;
      return config;
    }),
    map4 = new Set(list7['map']((output) => output['id']));
  return (
    list6['forEach']((value2) => {
      if (map4['has'](value2['id'])) return;
      if (map3['has'](value2['id'])) return;
      (list7['push'](value2), map4['add'](value2['id']));
    }),
    list7['slice'](0, AGENT_CUSTOM_QUICK_ACTION_LIMIT)
  );
}
function isKnownDefaultQuickActionContent(options3 = {}) {
  if (options3['custom'] === !![]) return ![];
  return AGENT_PANEL_LOCALES['some']((value3) =>
    [...getDefaultQuickActions(value3), ...getLegacyQuickActions(value3)]['some']((value4) =>
      isSameQuickActionContent(options3, value4),
    ),
  );
}
function localizeStoredDefaultQuickActions(list8 = []) {
  const map5 = new Map(getDefaultQuickActions()['map']((value5) => [value5['id'], value5]));
  return normalizeQuickActionList(list8)['map']((value6) => {
    const value7 = map5['get'](value6['id']);
    return value7 && isKnownDefaultQuickActionContent(value6) ? value7 : value6;
  });
}
function readQuickActionsStorage(value8 = globalThis['window']) {
  try {
    const value9 = value8?.['localStorage']?.['getItem']?.(AGENT_CUSTOM_QUICK_ACTIONS_STORAGE_KEY);
    if (value9 == null) return null;
    const value10 = JSON['parse'](value9);
    return Array['isArray'](value10) ? value10 : null;
  } catch {
    return null;
  }
}
function markCustomQuickActionsSeeded(value11 = globalThis['window']) {
  try {
    (value11?.['localStorage']?.['setItem']?.(AGENT_CUSTOM_QUICK_ACTIONS_SEEDED_STORAGE_KEY, 'true'),
      value11?.['localStorage']?.['setItem']?.(
        AGENT_CUSTOM_QUICK_ACTIONS_VERSION_STORAGE_KEY,
        AGENT_CUSTOM_QUICK_ACTIONS_VERSION,
      ));
  } catch {}
}
function seedCustomQuickActionsIfNeeded(value12 = globalThis['window']) {
  try {
    const value13 =
        value12?.['localStorage']?.['getItem']?.(AGENT_CUSTOM_QUICK_ACTIONS_SEEDED_STORAGE_KEY) === 'true',
      value14 = value12?.['localStorage']?.['getItem']?.(AGENT_CUSTOM_QUICK_ACTIONS_VERSION_STORAGE_KEY);
    if (value13 && value14 === AGENT_CUSTOM_QUICK_ACTIONS_VERSION) return;
    const quickActionsStorage = readQuickActionsStorage(value12) || [],
      value15 = value13
        ? migrateQuickActionsToCurrentDefaults(quickActionsStorage)
        : mergeSeedQuickActions(quickActionsStorage);
    (writeJsonArrayToStorage(value12, AGENT_CUSTOM_QUICK_ACTIONS_STORAGE_KEY, value15),
      markCustomQuickActionsSeeded(value12));
  } catch {}
}
function readCustomQuickActions(value16 = globalThis['window']) {
  const quickActionsStorage2 = readQuickActionsStorage(value16);
  return quickActionsStorage2 === null ? getDefaultQuickActions() : localizeStoredDefaultQuickActions(quickActionsStorage2);
}
function writeCustomQuickActions(list9 = [], value17 = globalThis['window']) {
  const quickActionList = normalizeQuickActionList(list9);
  return (
    writeJsonArrayToStorage(value17, AGENT_CUSTOM_QUICK_ACTIONS_STORAGE_KEY, quickActionList),
    markCustomQuickActionsSeeded(value17),
    quickActionList
  );
}
function inferAgentInputKind(value18 = '') {
  const list10 = String(value18 || '')['trim']();
  if (list10['includes']('image')) return 'image';
  if (list10['includes']('video')) return 'video';
  if (list10['includes']('audio')) return 'audio';
  if (list10['includes']('text')) return 'text';
  return list10 || 'node';
}
function isLikelyRenderableImageUrl(value19 = '') {
  const enabled2 = String(value19 || '')
    ['trim']()
    ['toLowerCase']();
  if (!enabled2) return ![];
  if (enabled2['startsWith']('data:image/')) return !![];
  return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?|#|$)/i['test'](enabled2);
}
function resolveFirstAgentThumbUrl(list11 = [], { imageLikeOnly: imageLikeOnly = ![] } = {}) {
  for (const value20 of list11) {
    const agentRenderableMediaUrl = normalizeAgentRenderableMediaUrl(value20);
    if (imageLikeOnly && !isLikelyRenderableImageUrl(agentRenderableMediaUrl)) continue;
    if (agentRenderableMediaUrl) return agentRenderableMediaUrl;
  }
  return '';
}
function getPrimaryVideoItem(options4 = {}) {
  const list12 = Array['isArray'](options4['videos']) ? options4['videos'] : [];
  if (list12['length'] === 0) return null;
  const value21 = Number['isFinite'](Number(options4['mainVideoIndex']))
    ? Math['max'](0, Math['trunc'](Number(options4['mainVideoIndex'])))
    : 0;
  return list12[value21] || list12[0] || null;
}
function resolveAgentInputRefThumbUrl(options5 = {}, inferAgentInputKind2 = inferAgentInputKind(options5?.['type'])) {
  const value22 = String(inferAgentInputKind2 || '')['trim']();
  if (value22 === 'audio')
    return resolveFirstAgentThumbUrl(
      [
        options5['thumbUrl'],
        options5['thumbnailUrl'],
        options5['imageUrl'],
        options5['coverUrl'],
        options5['posterUrl'],
        options5['waveformThumbUrl'],
        options5['waveformImageUrl'],
        options5['thumbLocalPath'],
        options5['posterLocalPath'],
      ],
      { imageLikeOnly: !![] },
    );
  if (value22 === 'video') {
    const primaryVideoItem = getPrimaryVideoItem(options5);
    return resolveFirstAgentThumbUrl(
      [
        primaryVideoItem?.['thumbUrl'],
        primaryVideoItem?.['thumbLocalPath'],
        options5['thumbUrl'],
        options5['thumbnailUrl'],
        options5['posterUrl'],
        options5['videoThumbSrc'],
        options5['firstFrameUrl'],
        options5['firstFrameThumbUrl'],
        options5['imageUrl'],
        options5['coverUrl'],
        options5['thumbLocalPath'],
        options5['posterLocalPath'],
      ],
      { imageLikeOnly: !![] },
    );
  }
  return resolveFirstAgentThumbUrl([
    options5['thumbUrl'],
    options5['thumbnailUrl'],
    options5['imageUrl'],
    options5['src'],
    options5['coverUrl'],
    options5['thumbLocalPath'],
    options5['displayLocalPath'],
    options5['localPath'],
    options5['originalLocalPath'],
  ]);
}
function normalizeAgentInputRefFromNode(box = {}, { source: source = 'canvas' } = {}) {
  const id2 = String(box['id'] || box['nodeId'] || '')['trim']();
  if (!id2) return null;
  const type = String(box['type'] || '')['trim'](),
    kind = inferAgentInputKind(type),
    name = truncateUiText(
      box['name'] || box['label'] || box['title'] || id2,
      60,
    ),
    count = Number(box['width']),
    count2 = Number(box['height']),
    box2 = {
      id: id2,
      nodeId: id2,
      type: type,
      kind: kind,
      name: name,
      label: name,
      source: source,
      thumbUrl: resolveAgentInputRefThumbUrl(box, kind),
    };
  if (Number['isFinite'](count) && count > 0) box2['width'] = Math['round'](count);
  if (Number['isFinite'](count2) && count2 > 0) box2['height'] = Math['round'](count2);
  return box2;
}
function isAgentMaterialRef(options6 = {}) {
  return ['image', 'video', 'audio', 'text']['includes'](String(options6['kind'] || ''));
}
function getImageFileFromClipboardData(value23 = null) {
  const list13 = Array['from'](value23?.['files'] || []),
    value24 = list13['find']((value25) => String(value25?.['type'] || '')['startsWith']('image/'));
  if (value24) return value24;
  const value26 = Array['from'](value23?.['items'] || []);
  for (const value27 of value26) {
    if (String(value27?.['kind'] || '') !== 'file') continue;
    if (!String(value27?.['type'] || '')['startsWith']('image/')) continue;
    const value28 = value27['getAsFile']?.();
    if (value28) return value28;
  }
  return null;
}
function normalizePastedImageFile(type2 = null) {
  if (!type2 || !String(type2['type'] || '')['startsWith']('image/')) return null;
  if (String(type2['name'] || '')['trim']()) return type2;
  try {
    const value29 = String(type2['type'] || '')['split']('/')[1] || 'png';
    return new File([type2], 'agent-paste-image.' + value29, { type: type2['type'] });
  } catch {
    return type2;
  }
}
function getStoreState(store2) {
  return store2?.['getStateRaw']?.() || store2?.['getState']?.() || {};
}
function clampAgentSidebarWidth(value30, value31 = globalThis['window']?.['innerWidth']) {
  const value32 = Number(value30),
    value33 = Number['isFinite'](Number(value31))
      ? Math['max'](320, Number(value31) - 24)
      : AGENT_PANEL_WIDTH_LIMITS['max'],
    value34 = Math['min'](AGENT_PANEL_WIDTH_LIMITS['max'], value33),
    value35 = Math['min'](AGENT_PANEL_WIDTH_LIMITS['min'], value34);
  return Math['max'](value35, Math['min'](value34, value32));
}
function readStoredSidebarWidth(value36 = globalThis['window']) {
  const count3 = Number(value36?.['localStorage']?.['getItem']?.(AGENT_PANEL_WIDTH_STORAGE_KEY));
  return Number['isFinite'](count3) && count3 > 0 ? count3 : null;
}
function writeStoredSidebarWidth(value37, value38 = globalThis['window']) {
  try {
    value38?.['localStorage']?.['setItem']?.(
      AGENT_PANEL_WIDTH_STORAGE_KEY,
      String(Math['round'](value37)),
    );
  } catch {}
}
export function normalizeAgentSidebarWidth(value39, value40) {
  return clampAgentSidebarWidth(value39, value40);
}
export function normalizeAgentExecutionMode(value41) {
  return String(value41 || '')['trim']() === 'auto' ? 'auto' : 'manual';
}
export function getAgentExecutionModeLabel(value42) {
  return normalizeAgentExecutionMode(value42) === 'auto'
    ? agentPanelText('executionModeAuto')
    : agentPanelText('executionModeManual');
}
export function getAgentPlaceholderActionMessage(value43) {
  const value44 = PLACEHOLDER_ACTION_MESSAGES[value43] || 'placeholderFallback';
  return agentPanelText(value44);
}
export function resolveAgentModelLabel(value45) {
  const enabled3 = String(value45 || '')['trim']();
  if (!enabled3) return agentPanelText('modelSelection');
  return findTextModelMenuItem(enabled3)?.['title'] || enabled3;
}
function getCreateActionLabel(value46) {
  const value47 = String(value46 || '');
  if (value47 === 'ai-image') return agentPanelText('nodeCreateImage');
  if (value47 === 'ai-video') return agentPanelText('nodeCreateVideo');
  if (value47 === 'ai-audio') return agentPanelText('nodeCreateAudio');
  if (value47 === 'ai-text' || value47 === 'source-text') return agentPanelText('nodeCreateText');
  return agentPanelText('nodeCreate');
}
function formatActionSummary(options7 = {}) {
  if (options7['label']) {
    const list14 = [];
    if (options7['promptSummary']) list14['push']('“' + options7['promptSummary'] + '”');
    return (
      Number['isFinite'](Number(options7['args']?.['gap'])) &&
        list14['push'](formatAgentPanelText('gapValue', { value: Number(options7['args']['gap']) })),
      list14['length'] ? options7['label'] + '：' + list14['join']('，') : options7['label']
    );
  }
  const value48 = String(options7['type'] || ''),
    response = options7['args'] || {},
    value49 =
      value48 === 'node.create'
        ? getCreateActionLabel(response['type'])
        : value48 === 'node.setPrompt' || value48 === 'node.appendPrompt'
          ? agentPanelText('nodeSetPrompt')
          : value48 === 'node.setParams'
            ? agentPanelText('nodeSetParams')
            : value48 === 'graph.connect'
              ? agentPanelText('graphConnect')
              : value48 === 'layout.arrangeRow'
                ? agentPanelText('layoutArrangeRow')
                : value48 === 'layout.align'
                  ? agentPanelText('layoutAlign')
                  : value48 === 'generation.run'
                    ? agentPanelText('generate')
                    : value48 === 'generation.runBatch'
                      ? agentPanelText('generateBatch')
                      : value48 === 'node.delete'
                        ? agentPanelText('nodeDelete')
                        : value48,
    list15 = [],
    value50 = response['prompt'] || response['text'];
  if (value50) list15['push']('“' + String(value50)['slice'](0, 36) + '”');
  return (
    Number['isFinite'](Number(response['gap'])) &&
      list15['push'](formatAgentPanelText('gapValue', { value: Number(response['gap']) })),
    list15['length'] ? value49 + '：' + list15['join']('，') : value49
  );
}
function readParamControlValue(el7, value51 = {}) {
  const value52 = String(value51['type'] || '')['toLowerCase']();
  if (value52 === 'toggle') return el7['checked'] === !![];
  if (value52 === 'slider' || value52 === 'stepper') {
    const value53 = Number(el7['value']);
    return Number['isFinite'](value53) ? value53 : el7['value'];
  }
  return el7['value'];
}
function getSelectedParamOption(el8 = {}) {
  const value54 = el8['value'];
  return (
    (Array['isArray'](el8['options']) ? el8['options'] : [])['find'](
      (el9) => String(el9?.['value'] ?? '') === String(value54 ?? ''),
    ) || null
  );
}
function getParamOptionLabel(options8 = {}, { selected: selected = ![] } = {}) {
  const value55 = selected
    ? (options8['displayLabel'] ?? options8['selectedLabel'] ?? options8['label'])
    : (options8['label'] ?? options8['selectedLabel'] ?? options8['displayLabel']);
  return String(value55 ?? '');
}
function createParamControl(field = {}, value56 = null, value57 = null) {
  const enabled4 = String(field['id'] || '')['trim']();
  if (!enabled4) return null;
  const el10 = createAgentElement('div', 'agent-param-control');
  el10['dataset']['agentParamId'] = enabled4;
  const enabled5 = String(field['label'] || '')['trim']();
  if (!enabled5) return null;
  el10['appendChild'](createAgentElement('span', 'agent-param-label', enabled5));
  const value58 = String(field['type'] || '')['toLowerCase']();
  let trigger,
    value59 = enabled5;
  if (Array['isArray'](field['options']) && field['options']['length'] > 0) {
    ((trigger = createAgentButton('agent-param-input agent-param-select-trigger', '')),
      (trigger['value'] = field['value']),
      trigger['setAttribute']('aria-haspopup', 'menu'),
      trigger['setAttribute']('aria-expanded', 'false'));
    const selectedParamOption = getSelectedParamOption(field),
      value60 = selectedParamOption ? getParamOptionLabel(selectedParamOption, { selected: !![] }) : '—';
    ((value59 = enabled5 + '：' + value60),
      trigger['append'](
        createAgentElement('span', 'agent-param-select-value', value60),
        createAgentElement('span', 'agent-caret agent-param-select-caret'),
      ));
    const el11 = trigger['querySelector']('.agent-param-select-caret');
    (el11 &&
      (el11['innerHTML'] =
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'),
      trigger['addEventListener']('click', (event) => {
        (event['preventDefault']?.(),
          event['stopPropagation']?.(),
          value57?.({
            trigger: trigger,
            field: field,
            onSelect: (value61) => value56?.(enabled4, value61, field),
          }));
      }));
  } else {
    if (value58 === 'toggle')
      ((trigger = createAgentElement('input', 'agent-param-input agent-param-checkbox')),
        (trigger['type'] = 'checkbox'),
        (trigger['checked'] = field['value'] === !![]));
    else {
      ((trigger = createAgentElement('input', 'agent-param-input agent-param-number')),
        (trigger['type'] = value58 === 'slider' || value58 === 'stepper' ? 'number' : 'text'),
        (trigger['value'] = String(field['value'] ?? '')));
      if (field['min'] !== undefined) trigger['setAttribute']('min', field['min']);
      if (field['max'] !== undefined) trigger['setAttribute']('max', field['max']);
      if (field['step'] !== undefined) trigger['setAttribute']('step', field['step']);
    }
  }
  return (
    (trigger['dataset']['agentParamId'] = enabled4),
    trigger['setAttribute']('aria-label', value59),
    (!Array['isArray'](field['options']) || field['options']['length'] === 0) &&
      trigger['addEventListener']('change', () => {
        value56?.(enabled4, readParamControlValue(trigger, field), field);
      }),
    el10['appendChild'](trigger),
    el10
  );
}
function isAdvancedEditableParam(options9 = {}) {
  return String(options9['placement'] || '')
    ['trim']()
    ['toLowerCase']()
    ['endsWith']('advanced');
}
function renderEditableParams(
  el12,
  list16 = [],
  value62 = null,
  value63 = null,
  {
    advancedExpanded: advancedExpanded = ![],
    onAdvancedExpandedChange: onAdvancedExpandedChange = null,
  } = {},
) {
  if (!Array['isArray'](list16) || list16['length'] === 0) return;
  const list17 = list16['filter'](isAdvancedEditableParam),
    value64 = list16['filter']((value65) => !isAdvancedEditableParam(value65)),
    el13 = createAgentElement('div', 'agent-param-editor');
  el13['appendChild'](
    createAgentElement('div', 'agent-plan-group-title', agentPanelText('editableParams')),
  );
  const run = (list18, value66 = 'agent-param-list') => {
    if (list18['length'] === 0) return null;
    const el14 = createAgentElement('div', value66);
    return (
      list18['map']((value67) => createParamControl(value67, value62, value63))
        ['filter'](Boolean)
        ['forEach']((value68) => el14['appendChild'](value68)),
      el13['appendChild'](el14),
      el14
    );
  };
  run(value64);
  if (list17['length'] > 0) {
    const el15 = createAgentElement(
        'button',
        'agent-param-advanced-toggle advanced-settings-icon-button',
      ),
      agentPanelText2 = agentPanelText('advancedSettings');
    ((el15['type'] = 'button'),
      el15['setAttribute']('aria-expanded', advancedExpanded ? 'true' : 'false'),
      el15['setAttribute']('aria-label', agentPanelText2),
      (el15['dataset']['tooltip'] = agentPanelText2));
    const el16 = createAgentElement('span', 'agent-param-advanced-icon');
    (el16['setAttribute']('aria-hidden', 'true'),
      (el16['innerHTML'] = ADVANCED_SETTINGS_TUNE_ICON_MARKUP),
      el15['append'](el16, createAgentElement('span', 'agent-param-advanced-caret', '⌄')),
      el15['querySelector']('.agent-param-advanced-caret')?.['setAttribute']('aria-hidden', 'true'),
      el13['appendChild'](el15));
    const el17 = run(list17, 'agent-param-list agent-param-advanced-list');
    ((el17['hidden'] = !advancedExpanded),
      el15['addEventListener']('click', () => {
        const enabled6 = el17['hidden'];
        ((el17['hidden'] = !enabled6),
          el15['setAttribute']('aria-expanded', enabled6 ? 'true' : 'false'),
          onAdvancedExpandedChange?.(enabled6));
      }));
  } else onAdvancedExpandedChange?.(![]);
  el12['appendChild'](el13);
}
function renderActionGroup(el18, value69, list19 = []) {
  if (!Array['isArray'](list19) || list19['length'] === 0) return;
  const el19 = createAgentElement('div', 'agent-plan-group');
  el19['appendChild'](createAgentElement('div', 'agent-plan-group-title', value69));
  const el20 = createAgentElement('div', 'agent-plan-list');
  (list19['forEach']((value70) => {
    el20['appendChild'](createAgentElement('div', 'agent-plan-item', formatActionSummary(value70)));
  }),
    el19['appendChild'](el20),
    el18['appendChild'](el19));
}
function renderTraceSummary(el21, value71, list20 = []) {
  if (!Array['isArray'](list20) || list20['length'] === 0) return;
  const el22 = createAgentElement('div', 'agent-plan-group');
  el22['appendChild'](createAgentElement('div', 'agent-plan-group-title', value71));
  const el23 = createAgentElement('div', 'agent-plan-list');
  (list20['forEach']((value72) => {
    el23['appendChild'](createAgentElement('div', 'agent-plan-item', value72));
  }),
    el22['appendChild'](el23),
    el21['appendChild'](el22));
}
function renderPlanPreview(
  advancedExpanded2,
  enabled7,
  { onParamChange: onParamChange = null, onOpenParamOptions: onOpenParamOptions = null } = {},
) {
  advancedExpanded2['replaceChildren']();
  if (!enabled7) {
    (delete advancedExpanded2['dataset']['agentAdvancedExpanded'], (advancedExpanded2['hidden'] = !![]));
    return;
  }
  const enabled8 = enabled7['confirmationSummary'] || null,
    list21 = Array['isArray'](enabled7['actions']) ? enabled7['actions'] : [];
  if (!enabled8 && list21['length'] === 0) {
    advancedExpanded2['hidden'] = !![];
    return;
  }
  advancedExpanded2['hidden'] = ![];
  const agentElement = createAgentElement('div', 'agent-plan-title', agentPanelText('confirmTitle')),
    el24 = createAgentElement('div', 'agent-plan-body');
  if (enabled8) {
    (renderActionGroup(el24, agentPanelText('completed'), enabled8['completedActions'] || []),
      renderActionGroup(el24, agentPanelText('pending'), enabled8['pendingActions'] || []),
      renderTraceSummary(el24, agentPanelText('traceSummary'), enabled8['debugTraceSummary'] || []));
    if (enabled8['generation']) {
      const el25 = createAgentElement('div', 'agent-plan-meta');
      ([
        [
          agentPanelText('batchNodes'),
          Number(enabled8['generation']['batchSize'] || 0) > 1
            ? '' + enabled8['generation']['batchSize']
            : '',
        ],
        [
          agentPanelText('model'),
          enabled8['generation']['modelLabel'] || enabled8['generation']['model'] || '',
        ],
        [agentPanelText('prompt'), enabled8['generation']['promptSummary'] || ''],
        [agentPanelText('inputSource'), enabled8['generation']['inputSource'] || ''],
      ]['forEach'](([value73, enabled9]) => {
        if (!enabled9) return;
        const agentElement2 = createAgentElement('div', 'agent-plan-meta-row');
        (agentElement2['append'](
          createAgentElement('span', 'agent-plan-meta-label', value73),
          createAgentElement('span', 'agent-plan-meta-value', enabled9),
        ),
          el25['appendChild'](agentElement2));
      }),
        el24['appendChild'](el25),
        renderEditableParams(
          el24,
          enabled8['generation']['editableParams'] || [],
          onParamChange,
          onOpenParamOptions,
          {
            advancedExpanded: advancedExpanded2['dataset']['agentAdvancedExpanded'] === 'true',
            onAdvancedExpandedChange: (value74) => {
              advancedExpanded2['dataset']['agentAdvancedExpanded'] = value74 ? 'true' : 'false';
            },
          },
        ));
    }
    enabled8['cancelNotice'] &&
      el24['appendChild'](createAgentElement('div', 'agent-plan-notice', enabled8['cancelNotice']));
  } else {
    const el26 = createAgentElement('div', 'agent-plan-list');
    (list21['forEach']((value75) => {
      el26['appendChild'](createAgentElement('div', 'agent-plan-item', formatActionSummary(value75)));
    }),
      el24['appendChild'](el26));
  }
  advancedExpanded2['append'](agentElement, el24);
}
function renderRecovery(
  el27,
  value76,
  value77,
  handler,
  value78 = null,
  { editor: editor = null, setNotice: setNotice = null } = {},
) {
  el27['replaceChildren']();
  const value79 = value76?.['recovery'] || null,
    list22 = Array['isArray'](value79?.['options']) ? value79['options'] : [];
  el27['hidden'] = list22['length'] === 0;
  if (list22['length'] === 0) return;
  el27['appendChild'](
    createAgentElement('div', 'agent-recovery-title', agentPanelText('recoveryTitle')),
  );
  const el28 = createAgentElement('div', 'agent-recovery-actions');
  for (const value80 of list22) {
    const el29 = createAgentElement(
      'button',
      'agent-recovery-btn',
      value80['label'] || value80['id'],
    );
    ((el29['type'] = 'button'),
      (el29['dataset']['recoveryAction'] = value80['id']),
      el29['addEventListener']('click', async () => {
        const value81 = String(value80['id'] || '');
        if (value81 === 'editPrompt') {
          (setEditorText(editor, agentPanelText('recoveryEditPromptDraft')),
            editor?.['focus']?.(),
            setNotice?.(agentPanelText('recoveryEditPromptNotice')),
            (el27['hidden'] = !![]));
          return;
        }
        if (value81 === 'changeModel') {
          (setEditorText(editor, agentPanelText('recoveryChangeModelDraft')),
            editor?.['focus']?.(),
            setNotice?.(agentPanelText('recoveryChangeModelNotice')),
            (el27['hidden'] = !![]));
          return;
        }
        if (value81 === 'editRequest') {
          (setEditorText(editor, value80['draft'] || ''),
            editor?.['focus']?.(),
            setNotice?.(agentPanelText('recoveryEditRequestNotice')),
            (el27['hidden'] = !![]));
          return;
        }
        value78?.(!![], { stoppable: !![] });
        try {
          const value82 =
            value81 === 'keepPrepared'
              ? await value77['keepPreparedPlan']?.()
              : value81 === 'retryPlanner'
                ? await value77['retryPlannerRun']?.()
                : await value77['retryFailedPlan']?.();
          handler(value82 || { ok: ![], status: 'failed', reply: 'Recovery failed.' });
        } catch (reply2) {
          handler({ ok: ![], status: 'failed', reply: reply2?.['message'] || 'Agent recovery failed.' });
        } finally {
          value78?.(![], { stoppable: ![] });
        }
      }),
      el28['appendChild'](el29));
  }
  el27['appendChild'](el28);
}
function formatHistoryTime(value83) {
  const value84 = new Date(Number(value83) || Date['now']());
  return value84['toLocaleString'](getLocale(), {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function getLastMessageSummary(options10 = {}) {
  const list23 = Array['isArray'](options10['messages']) ? options10['messages'] : [],
    value85 = list23[list23['length'] - 1] || null;
  return String(value85?.['content'] || options10['lastPlanSummary'] || options10['title'] || '')['trim']();
}
function renderHistory(value86, value87, { onSelect: onSelect = null, onDelete: onDelete = null } = {}) {
  value86['replaceChildren']();
  const agentElement3 = createAgentElement('div', 'agent-history-title', agentPanelText('historyTitle')),
    list24 = value87?.['listConversations']?.() || [],
    value88 = value87?.['getActiveConversation']?.() || null;
  if (!list24['length']) {
    value86['append'](
      agentElement3,
      createAgentElement('div', 'agent-history-empty', agentPanelText('historyEmpty')),
    );
    return;
  }
  const el30 = createAgentElement('div', 'agent-history-list');
  (list24['forEach']((value89) => {
    const el31 = createAgentElement('div', 'agent-history-item');
    ((el31['dataset']['conversationId'] = value89['id']),
      el31['classList']['toggle']('is-active', value89['id'] === value88?.['id']));
    const el32 = createAgentElement('button', 'agent-history-main');
    ((el32['type'] = 'button'),
      el32['append'](
        createAgentElement(
          'span',
          'agent-history-name',
          value89['title'] || agentPanelText('newConversationFallback'),
        ),
        createAgentElement('span', 'agent-history-time', formatHistoryTime(value89['updatedAt'])),
        createAgentElement('span', 'agent-history-content', getLastMessageSummary(value89)),
      ),
      el32['addEventListener']('click', () => onSelect?.(value89['id'])));
    const el33 = createAgentButton('agent-history-delete', '×', {
      title: agentPanelText('historyDelete'),
    });
    (el33['addEventListener']('click', (event2) => {
      (event2['preventDefault']?.(), event2['stopPropagation']?.(), onDelete?.(value89['id']));
    }),
      el31['append'](el32, el33),
      el30['appendChild'](el31));
  }),
    value86['append'](agentElement3, el30));
}
function isAgentPopoverOpen(el34) {
  if (!el34) return ![];
  if (el34['classList']?.['contains']('agent-history-popover')) return el34['hidden'] !== !![];
  return el34['classList']?.['contains']('show');
}
function hideAgentPopover(el35) {
  if (!el35) return;
  if (el35['classList']?.['contains']('agent-history-popover')) {
    ((el35['hidden'] = !![]), el35['classList']?.['remove']?.('show'));
    return;
  }
  (el35['classList']?.['remove']?.('show'),
    el35['agentPopoverTrigger']?.['setAttribute']?.('aria-expanded', 'false'));
}
function showAgentPopover(el36) {
  if (!el36) return;
  if (el36['classList']?.['contains']('agent-history-popover')) {
    ((el36['hidden'] = ![]), el36['classList']?.['add']?.('show'));
    return;
  }
  (el36['classList']?.['add']?.('show'),
    el36['agentPopoverTrigger']?.['setAttribute']?.('aria-expanded', 'true'));
}
function closeFloatingMenus(el37, enabled10 = null) {
  el37?.['querySelectorAll']?.(
    '.agent-floating-menu.show, .agent-model-menu.show, .agent-history-popover',
  )?.['forEach']((value90) => {
    if (value90 !== enabled10) hideAgentPopover(value90);
  });
  if (!enabled10) closeNodeFooterMenus(el37);
}
function setMenuOpen(value91, value92, value93) {
  closeFloatingMenus(value93, value92 ? value91 : null);
  if (value92) showAgentPopover(value91);
  else hideAgentPopover(value91);
}
function isAgentMenuSurface(el38) {
  return !!el38?.['closest']?.(
    '.agent-menu-wrap, .agent-floating-menu, .agent-model-menu, .agent-history-popover, .agent-history-btn',
  );
}
function hasOpenFloatingMenus(el39) {
  return Array['from'](
    el39?.['querySelectorAll']?.(
      '.agent-floating-menu.show, .agent-model-menu.show, .agent-history-popover',
    ) || [],
  )['some'](isAgentPopoverOpen);
}
export function initAgentPanel({
  runtime: runtime,
  modelSettings: modelSettings,
  store: store = null,
  uploadMaterial: uploadMaterial = null,
  validateDocumentFile: validateDocumentFile = null,
  skillRegistry: skillRegistry = null,
  refreshAgentSkills: refreshAgentSkills = null,
  installAgentSkill: installAgentSkill = null,
  deleteAgentSkill: deleteAgentSkill = null,
  saveAgentSkill: saveAgentSkill = null,
  fabBtnEl: fabBtnEl = document['getElementById']('fabBtn'),
  root: root = document['body'],
  stateRoot: stateRoot = document['body'],
  surface: surface = {},
  replyActions: replyActions = [],
} = {}) {
  if (!runtime || !fabBtnEl || !root) return null;
  const ownerRoot = createAgentElement('aside', 'agent-sidebar');
  (ownerRoot['setAttribute']('aria-label', agentPanelText('panelAria')),
    ownerRoot['setAttribute']('aria-hidden', 'true'),
    (ownerRoot['dataset']['readonlyTextSelectionRoot'] = 'true'));
  const el40 = createAgentElement('div', 'agent-sidebar-resize-handle');
  (el40['setAttribute']('role', 'separator'),
    el40['setAttribute']('aria-orientation', 'vertical'),
    el40['setAttribute']('aria-label', agentPanelText('resizeAria')),
    (el40['tabIndex'] = 0));
  const agentElement4 = createAgentElement('div', 'agent-sidebar-header'),
    agentElement5 = createAgentElement('div', 'agent-sidebar-title');
  agentElement5['append'](
    createAgentElement('span', 'agent-sidebar-title-main', surface['title'] || 'Shuo Canvas Agent'),
    createAgentElement('span', 'agent-sidebar-title-badge', agentPanelText('betaBadge')),
  );
  const agentElement6 = createAgentElement('div', 'agent-header-actions'),
    el41 = createAgentButton('agent-icon-btn agent-new-chat-btn', '', {
      title: agentPanelText('newConversation'),
      icon: agentIconSvg('plus'),
    }),
    el42 = createAgentButton('agent-icon-btn agent-history-btn', '', {
      title: agentPanelText('historyTitle'),
      icon: agentIconSvg('history'),
    }),
    el43 = createAgentButton('agent-icon-btn agent-close-btn', '', {
      title: agentPanelText('close'),
      icon: agentIconSvg('close'),
    });
  (agentElement6['append'](el41, el42, el43), agentElement4['append'](agentElement5, agentElement6));
  const agentElement7 = createAgentElement('div', 'agent-sidebar-main'),
    el44 = createAgentElement('div', 'agent-greeting');
  el44['append'](
    createAgentElement('div', 'agent-greeting-kicker', surface['kicker'] || agentPanelText('greetingKicker')),
    createAgentElement('div', 'agent-greeting-title', surface['greeting'] || agentPanelText('greetingTitle')),
  );
  const messagesEl = createAgentElement('div', 'agent-messages'),
    runStepsEl = createAgentElement('div', 'agent-run-steps');
  runStepsEl['hidden'] = !![];
  const el45 = createAgentElement('div', 'agent-history-popover');
  ((el45['hidden'] = !![]), agentElement7['append'](el44, messagesEl, runStepsEl, el45));
  const el46 = createAgentElement('div', 'agent-quick-actions-shell'),
    el47 = createAgentElement('div', 'agent-quick-actions');
  el46['appendChild'](el47);
  const windowObject = globalThis['window'];
  let showContextMenu2 = null;
  const run2 = () => {
      (showContextMenu2?.['close']?.(), (showContextMenu2 = null));
    },
    handler2 = (ownerElement, list25) => {
      if (!Array['isArray'](list25) || list25['length'] === 0) return;
      (ownerElement['preventDefault']?.(),
        ownerElement['stopPropagation']?.(),
        closeFloatingMenus(ownerRoot),
        run2(),
        (showContextMenu2 = showContextMenu(
          Number(ownerElement['clientX']) || 0,
          Number(ownerElement['clientY']) || 0,
          list25,
          {
            className: 'v2-canvas-ctx-menu agent-context-menu',
            ensureItemIcons: !![],
            ownerElement: ownerElement['target'],
            ownerRoot: ownerRoot,
          },
        )));
    },
    onOpenParamOptions2 = ({ trigger: trigger2, field: field2, onSelect: onSelect2 } = {}) => {
      if (!trigger2 || !Array['isArray'](field2?.['options']) || field2['options']['length'] === 0)
        return;
      if (trigger2['getAttribute']('aria-expanded') === 'true') {
        run2();
        return;
      }
      (closeFloatingMenus(ownerRoot), run2());
      const list26 = field2['options']
        ['map']((disabled) => {
          const label = getParamOptionLabel(disabled);
          if (!label) return null;
          return {
            label: label,
            checked: String(disabled?.['value'] ?? '') === String(field2['value'] ?? ''),
            disabled: disabled?.['disabled'] === !![],
            action: () => onSelect2?.(disabled['value']),
            paramValue: disabled['value'],
          };
        })
        ['filter'](Boolean);
      if (list26['length'] === 0) return;
      const box3 = trigger2['getBoundingClientRect']?.() || {};
      trigger2['setAttribute']('aria-expanded', 'true');
      let showContextMenu3 = null;
      ((showContextMenu3 = showContextMenu(
        Number(box3['left']) || 0,
        (Number(box3['bottom']) || 0) + 4,
        list26,
        {
          className: 'v2-canvas-ctx-menu v2-sb-dropdown agent-param-dropdown-menu',
          restoreTarget: trigger2,
          ownerElement: trigger2,
          ownerRoot: ownerRoot,
          dismissOnOwnerPointerDown: ![],
          ariaLabel: String(field2['label'] || ''),
          onClose: () => {
            trigger2['setAttribute']('aria-expanded', 'false');
            if (showContextMenu2 === showContextMenu3) showContextMenu2 = null;
          },
        },
      )),
        (showContextMenu2 = showContextMenu3),
        (showContextMenu3['menu']['dataset']['agentParamId'] = String(field2['id'] || '')),
        showContextMenu3['menu']['querySelectorAll']?.('.v2-menu-row')?.['forEach']((el48, value94) => {
          el48['dataset']['agentParamValue'] = String(list26[value94]?.['paramValue'] ?? '');
        }));
    };
  seedCustomQuickActionsIfNeeded(windowObject);
  function run3() {
    (el47['replaceChildren'](),
      (surface['quickActions'] || readCustomQuickActions(windowObject))['forEach']((icon) => {
        const el49 = createAgentButton('agent-quick-card', icon['label'], {
          icon:
            icon['custom'] === !![]
              ? agentIconSvg('wand')
              : icon['id'] === 'canvas-gap-check'
                ? agentIconSvg('scan')
                : icon['id'] === 'storyboard-plan'
                  ? agentIconSvg('flow')
                  : agentIconSvg('wand'),
        });
        ((el49['dataset']['prompt'] = icon['prompt']), el47['appendChild'](el49));
      }),
      run4());
  }
  run3();
  const el50 = createAgentElement('div', 'agent-custom-panel');
  ((el50['hidden'] = !![]), el50['setAttribute']('aria-hidden', 'true'));
  const agentElement8 = createAgentElement('div', 'agent-custom-panel-header'),
    agentElement9 = createAgentElement('div', 'agent-custom-panel-copy');
  agentElement9['append'](
    createAgentElement('div', 'agent-custom-panel-title', agentPanelText('customShortcutPanelTitle')),
    createAgentElement('div', 'agent-custom-panel-desc', agentPanelText('customShortcutPanelDesc')),
  );
  const el51 = createAgentButton('agent-custom-close-btn', '×', {
    title: agentPanelText('customShortcutClose'),
  });
  agentElement8['append'](agentElement9, el51);
  const el52 = createAgentButton(
      'agent-secondary-btn agent-custom-new-btn',
      agentPanelText('customShortcutNew'),
    ),
    agentElement10 = createAgentElement('div', 'agent-custom-panel-body'),
    agentElement11 = createAgentElement('div', 'agent-custom-sidebar'),
    el53 = createAgentElement('div', 'agent-custom-list');
  (el53['setAttribute']('role', 'list'), agentElement11['append'](el52, el53));
  const el54 = createAgentElement('div', 'agent-custom-editor'),
    el55 = createAgentElement('label', 'agent-custom-field');
  el55['appendChild'](
    createAgentElement('span', 'agent-custom-label', agentPanelText('customShortcutNameLabel')),
  );
  const el56 = createAgentElement('input', 'agent-custom-input');
  ((el56['type'] = 'text'),
    (el56['maxLength'] = 28),
    (el56['placeholder'] = agentPanelText('customShortcutNamePlaceholder')),
    el55['appendChild'](el56));
  const el57 = createAgentElement('label', 'agent-custom-field');
  el57['appendChild'](
    createAgentElement('span', 'agent-custom-label', agentPanelText('customShortcutPromptLabel')),
  );
  const el58 = createAgentElement('textarea', 'agent-custom-textarea');
  ((el58['rows'] = 4),
    (el58['placeholder'] = agentPanelText('customShortcutPromptPlaceholder')),
    el57['appendChild'](el58));
  const agentElement12 = createAgentElement('div', 'agent-custom-editor-actions'),
    el59 = createAgentButton(
      'agent-primary-btn agent-custom-save-btn',
      agentPanelText('customShortcutSave'),
    );
  (agentElement12['append'](el59),
    el54['append'](el55, el57, agentElement12),
    agentElement10['append'](agentElement11, el54),
    el50['append'](agentElement8, agentElement10));
  const el60 = createAgentElement('div', 'agent-notice');
  el60['hidden'] = !![];
  const el61 = createAgentElement('div', 'agent-plan-preview');
  el61['hidden'] = !![];
  const el62 = createAgentElement('div', 'agent-options');
  el62['hidden'] = !![];
  const el63 = createAgentElement('div', 'agent-recovery');
  el63['hidden'] = !![];
  const el64 = createAgentElement('div', 'agent-actions');
  el64['hidden'] = !![];
  const el65 = createAgentButton('agent-primary-btn', agentPanelText('confirmExecute')),
    el66 = createAgentButton('agent-secondary-btn', agentPanelText('cancel'));
  el64['append'](el65, el66);
  const el67 = createAgentElement('form', 'agent-compose'),
    agentElement13 = createAgentElement('div', 'agent-prompt-panel text-prompt-panel'),
    el68 = createAgentElement('div', 'agent-ref-bar node-ref-bar active'),
    el69 = createAgentPromptAttachmentButton({
      title: agentPanelText('addSelectedReference'),
      className: 'agent-connect-btn',
    }),
    el70 = createAgentElement('div', 'agent-ref-placeholder', agentPanelText('addReference')),
    el71 = createAgentElement('div', 'ref-thumb-container agent-input-ref-list');
  (el71['setAttribute']('role', 'list'), el68['append'](el69, el70, el71));
  if (surface['textOnly']) el68['hidden'] = !![];
  const el72 = createAgentElement('div', 'agent-input-wrapper prompt-input-wrapper'),
    slashTrigger = createAgentElement('div', 'agent-compose-input prompt-textarea custom-textarea');
  ((slashTrigger['contentEditable'] = 'true'),
    (slashTrigger['spellcheck'] = ![]),
    (slashTrigger['dataset']['placeholder'] = surface['placeholder'] || agentPanelText('inputPlaceholder')),
    el72['appendChild'](slashTrigger));
  const agentElement14 = createAgentElement('div', 'agent-compose-footer prompt-panel-footer'),
    agentElement15 = createAgentElement('div', 'agent-compose-left'),
    el73 = createAgentElement('div', 'agent-menu-wrap'),
    el74 = createAgentButton('agent-round-btn', '', {
      title: agentPanelText('add'),
      icon: agentIconSvg('plus'),
    }),
    el75 = createAgentElement('div', 'agent-floating-menu agent-add-menu');
  ([
    ['upload', agentPanelText('uploadMaterial'), 'upload'],
    ['document', agentPanelText('readDocument'), 'upload'],
    ['custom', agentPanelText('customShortcutPanelTitle'), 'wand'],
    ['skills', agentPanelText('skillManage'), 'skills'],
  ]['forEach'](([value95, value96, value97]) => {
    const el76 = createAgentButton('agent-menu-item', value96, { icon: agentIconSvg(value97) });
    ((el76['dataset']['placeholderAction'] = value95), el75['appendChild'](el76));
  }),
    el73['append'](el74, el75));
  if (surface['textOnly']) el73['hidden'] = !![];
  const activeModel = modelSettings?.['getSettings']?.() || {},
    el77 = createAgentElement(
      'div',
      'img-model-pills aigen-text-model-selector agent-text-model-selector',
    );
  el77['dataset']['aigenTextModelSelector'] = '';
  const agentElement16 = createAgentElement('div', 'agent-menu-wrap agent-model-wrap img-model-wrap'),
    el78 = createAgentButton('agent-pill-btn agent-model-btn img-model-btn-trigger', '', {
      title: agentPanelText('modelSelection'),
    }),
    el79 = createAgentElement('span', 'agent-model-icon-slot');
  el79['innerHTML'] = agentIconSvg('model');
  const agentElement17 = createAgentElement(
      'span',
      'agent-model-label img-model-label',
      resolveAgentModelLabel(activeModel['model']),
    ),
    el80 = createAgentElement('span', 'agent-caret node-menu-caret');
  ((el80['innerHTML'] =
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'),
    el78['append'](el79, agentElement17, el80));
  const el81 = createAgentElement(
    'div',
    'floating-menu img-model-menu node-model-menu agent-model-menu',
  );
  ((el81['innerHTML'] = buildAIGenTextModelMenuMarkup({ activeModel: activeModel['model'] })),
    agentElement16['append'](el78, el81));
  const agentButton = createAgentButton('model-provider-profile-selector-toggle is-hidden', ''),
    el82 = createAgentElement('div', 'ui-schema-placement ui-schema-mode-slot');
  ((el82['dataset']['aigenTextUiSchemaModeSlot'] = ''),
    (el82['hidden'] = !![]),
    el77['append'](agentElement16, agentButton, el82));
  const el83 = createAgentElement('div', 'agent-menu-wrap'),
    el84 = createAgentButton('agent-pill-btn agent-mode-btn', '', {
      title: agentPanelText('agentMode'),
      icon: agentIconSvg('mode'),
    }),
    el85 = createAgentElement(
      'span',
      'agent-mode-label',
      getAgentExecutionModeLabel(activeModel['executionMode']),
    ),
    el86 = createAgentElement('span', 'agent-caret');
  ((el86['innerHTML'] =
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'),
    el84['append'](el85, el86));
  const el87 = createAgentElement('div', 'agent-floating-menu agent-mode-menu');
  ([
    ['manual', getAgentExecutionModeLabel('manual')],
    ['auto', getAgentExecutionModeLabel('auto')],
  ]['forEach'](([value98, value99]) => {
    const el88 = createAgentButton('agent-menu-item', value99, { icon: agentIconSvg('check') });
    ((el88['dataset']['executionMode'] = value98),
      el88['classList']['toggle'](
        'active',
        normalizeAgentExecutionMode(activeModel['executionMode']) === value98,
      ),
      el87['appendChild'](el88));
  }),
    el83['append'](el84, el87),
    (el83['hidden'] = !![]));
  const onCatalogChange = createAgentSkillPicker({
    registry: skillRegistry,
    text: agentPanelText,
    slashTrigger: slashTrigger,
    onSelect: (value100) => {
      const value101 = String(value100?.['id'] || '')['trim']();
      if (value101) setEditorText(slashTrigger, '$' + value101 + ' ');
      (setMenuOpen(onCatalogChange['menu'], ![], ownerRoot), slashTrigger['focus']());
    },
  });
  agentElement15['append'](el73, el77);
  const el89 = createAgentButton('agent-send-btn', '', {
    title: agentPanelText('send'),
    icon: agentIconSvg('send'),
  });
  el89['type'] = 'submit';
  const el90 = createAgentButton('agent-stop-btn', '', {
    title: agentPanelText('stop'),
    icon: agentIconSvg('stop'),
  });
  ((el90['type'] = 'button'),
    (el90['hidden'] = !![]),
    agentElement14['append'](agentElement15, el89, el90),
    agentElement13['append'](el68, el72, agentElement14, onCatalogChange['element']));
  const agentSkillPanel = createAgentSkillPanel({
    registry: skillRegistry,
    refreshSkills: refreshAgentSkills,
    installSkill: installAgentSkill,
    deleteSkill: deleteAgentSkill,
    saveSkill: saveAgentSkill,
    text: agentPanelText,
    formatText: formatAgentPanelText,
    onInsert: (value102) => {
      (setEditorText(slashTrigger, '' + value102 + getEditorText(slashTrigger)), slashTrigger['focus']());
    },
    onUse: (value103) => {
      const value104 = String(value103 || '')['trim'](),
        editorText = getEditorText(slashTrigger);
      if (value104) {
        const value105 = '$' + value104;
        setEditorText(
          slashTrigger,
          editorText === value105 || editorText['startsWith'](value105 + ' ')
            ? '' + editorText + (editorText === value105 ? ' ' : '')
            : '' + value105 + (editorText ? ' ' + editorText : ' '),
        );
      }
      (setMenuOpen(onCatalogChange['menu'], ![], ownerRoot), slashTrigger['focus']());
    },
    onCatalogChange: onCatalogChange['render'],
    onNotice: onNotice,
    windowObject: windowObject,
  });
  function run5() {
    (run6(![]), agentSkillPanel['open']());
  }
  const args = createAgentComposerAttachmentController({
    documentObject: document,
    uploadMaterial: uploadMaterial,
    validateDocumentFile: validateDocumentFile,
    normalizeMaterialNode: (value106) => normalizeAgentInputRefFromNode(value106, { source: 'upload' }),
    addInputRefs: addInputRefs,
    setBusy: setBusy,
    getBusy: () => enabled11,
    captureContext: () => agentPanelContinuity['capture'](),
    isContextCurrent: (value107) => agentPanelContinuity['isCurrent'](value107),
    setNotice: onNotice,
    text: agentPanelText,
    formatText: formatAgentPanelText,
    focusInput: () => slashTrigger['focus'](),
    onDocumentChange: onDocumentChange,
  });
  (el67['append'](
    el46,
    el50,
    agentSkillPanel['element'],
    el61,
    el62,
    el63,
    el64,
    agentElement13,
    args['materialInput'],
    args['documentInput'],
  ),
    ownerRoot['append'](el40, agentElement4, agentElement7, el67),
    root['appendChild'](ownerRoot),
    stateRoot['appendChild'](el60));
  let bindAgentModelControls2 = null;
  (el78['addEventListener']('click', () => {
    if (el81['classList']['contains']('show')) return;
    closeFloatingMenus(ownerRoot, el81);
    const value108 = modelSettings?.['getSettings']?.() || activeModel;
    bindAgentModelControls2?.['sync']?.(value108);
  }),
    (bindAgentModelControls2 = bindAgentModelControls(el77, {
      modelSettings: modelSettings,
      initialSettings: activeModel,
      documentObject: document,
    })));
  let enabled11 = ![];
  const agentPanelContinuity = createAgentPanelContinuity({
    getConversation: () =>
      runtime['sessionStore']?.['getActiveConversation']?.() || runtime['getActiveConversation']?.(),
    getHistory: getHistory,
    getMessageCount: () => messagesEl['children']['length'],
  });
  let agentConversationPresentation = null,
    agentConversationActions = null,
    timer = null,
    value109 = ![],
    value110 = null;
  const storedSidebarWidth = readStoredSidebarWidth(windowObject);
  storedSidebarWidth &&
    stateRoot['style']?.['setProperty']?.('--agent-sidebar-width', clampAgentSidebarWidth(storedSidebarWidth) + 'px');
  function run7() {
    timer !== null && (clearTimeout(timer), (timer = null));
  }
  function onNotice(value111, { sticky: sticky = ![] } = {}) {
    run7();
    const value112 =
      ownerRoot['classList']['contains']('is-open') && runtime['sessionStore']?.['getPersistenceError']?.();
    ((value109 = Boolean(value112)),
      value112 && ((value111 = value112), (sticky = !![])),
      (el60['textContent'] = String(value111 || '')),
      (el60['hidden'] = !el60['textContent']),
      el60['textContent'] &&
        !sticky &&
        ((timer = setTimeout(() => {
          ((timer = null), (el60['textContent'] = ''), (el60['hidden'] = !![]));
        }, AGENT_NOTICE_AUTO_HIDE_MS)),
        timer?.['unref']?.()));
  }
  async function onCopy(value113 = '') {
    const enabled12 = String(value113 || '')['trim']();
    if (!enabled12) return ![];
    try {
      const enabled13 = windowObject?.['navigator']?.['clipboard'] || globalThis['navigator']?.['clipboard'];
      if (!enabled13?.['writeText']) throw new Error('Clipboard unavailable');
      return (await enabled13['writeText'](enabled12), onNotice(agentPanelText('copyMessageDone')), !![]);
    } catch {
      return (onNotice(agentPanelText('copyMessageFailed')), ![]);
    }
  }
  function onImagePreview(value114 = '', alt = '') {
    const enabled14 = String(value114 || '')['trim']();
    if (!enabled14) return;
    openImagePreview(enabled14, {
      alt: alt || agentPanelText('imageResultOpen'),
      sidebarSubmenuOwner: 'agent',
    });
  }
  function run8(value115 = ownerRoot) {
    const value116 =
        document?.['getSelection']?.() || windowObject?.['getSelection']?.() || globalThis['getSelection']?.(),
      enabled15 = String(value116?.['toString']?.() || '')['trim']();
    if (!enabled15 || value116?.['isCollapsed'] === !![]) return '';
    const count4 = Number(value116?.['rangeCount']) || 0;
    if (count4 > 0 && typeof value116['getRangeAt'] === 'function') {
      for (let value117 = 0; value117 < count4; value117 += 1) {
        const value118 = value116['getRangeAt'](value117);
        if (
          value115['contains'](value118['commonAncestorContainer']) ||
          value115['contains'](value118['startContainer']) ||
          value115['contains'](value118['endContainer'])
        )
          return enabled15;
      }
      return '';
    }
    return value115['contains'](value116?.['anchorNode']) || value115['contains'](value116?.['focusNode'])
      ? enabled15
      : '';
  }
  function run9(event3) {
    const enabled16 = run8();
    if (!enabled16) return;
    (event3['stopPropagation']?.(),
      event3['clipboardData']?.['setData'] &&
        (event3['preventDefault']?.(), event3['clipboardData']['setData']('text/plain', enabled16)));
  }
  function run10() {
    const scrollWidth = Math['max'](0, Number(el47['scrollWidth']) || 0),
      value119 = Number(el47['getBoundingClientRect']?.()['width']) || 0,
      clientWidth = Math['max'](
        0,
        Number(el47['clientWidth']) || value119 || Number(el47['offsetWidth']) || 0,
      ),
      maxScroll = Math['max'](0, scrollWidth - clientWidth),
      scrollLeft = Math['min'](maxScroll, Math['max'](0, Number(el47['scrollLeft']) || 0));
    return { clientWidth: clientWidth, maxScroll: maxScroll, scrollLeft: scrollLeft, scrollWidth: scrollWidth };
  }
  function run4() {
    const { maxScroll: maxScroll2, scrollLeft: scrollLeft2 } = run10(),
      value120 = maxScroll2 > 1;
    (el46['classList']['toggle']('has-overflow', value120),
      el46['classList']['toggle']('has-left-fade', value120 && scrollLeft2 > 1),
      el46['classList']['toggle']('has-right-fade', value120 && scrollLeft2 < maxScroll2 - 1));
  }
  function run11(value121) {
    const value122 = value121 === !![];
    ((el47['hidden'] = value122), (el46['hidden'] = value122), run4());
  }
  function run12(event4) {
    const { maxScroll: maxScroll3, scrollLeft: scrollLeft3 } = run10();
    if (maxScroll3 <= 1) return;
    const value123 = Number(event4?.['deltaY']) || 0,
      count5 = Number(event4?.['deltaX']) || 0,
      enabled17 =
        Math['abs'](count5) > Math['abs'](value123) && count5 !== 0 ? count5 : value123;
    if (!enabled17) return;
    const enabled18 = enabled17 < 0 && scrollLeft3 > 1,
      enabled19 = enabled17 > 0 && scrollLeft3 < maxScroll3 - 1;
    if (!enabled18 && !enabled19) return;
    (event4?.['preventDefault']?.(),
      (el47['scrollLeft'] = Math['min'](maxScroll3, Math['max'](0, scrollLeft3 + enabled17))),
      run4());
  }
  function run6(value124) {
    if (value124) {
      ((el50['hidden'] = ![]),
        el50['setAttribute']('aria-hidden', 'false'),
        el50['classList']['remove']('is-open'),
        void el50['offsetWidth'],
        el50['classList']['add']('is-open'));
      return;
    }
    (el50['classList']['remove']('is-open'),
      el50['setAttribute']('aria-hidden', 'true'),
      (el50['hidden'] = !![]));
  }
  let enabled20 = ![],
    list27 = [],
    enabled21 = ![],
    el91 = null;
  function run13(el92, value125) {
    if (!el92) return;
    const value126 = String(value125 || '');
    value126
      ? ((el92['title'] = value126), el92['setAttribute']?.('aria-label', value126))
      : ((el92['title'] = ''), el92['removeAttribute']?.('aria-label'));
  }
  function run14(el93, value127) {
    if (!el93) return;
    const el94 = el93['querySelector']?.('.agent-btn-label');
    if (el94) {
      el94['textContent'] = value127;
      return;
    }
    el93['textContent'] = value127;
  }
  function run15() {
    const value128 = modelSettings?.['getSettings']?.() || activeModel;
    (ownerRoot['setAttribute']('aria-label', agentPanelText('panelAria')),
      el40['setAttribute']('aria-label', agentPanelText('resizeAria')),
      (ownerRoot['querySelector']('.agent-sidebar-title-badge')['textContent'] = agentPanelText('betaBadge')),
      run13(el41, agentPanelText('newConversation')),
      run13(el42, agentPanelText('historyTitle')),
      run13(el43, agentPanelText('close')),
      (el44['querySelector']('.agent-greeting-kicker')['textContent'] =
        surface['kicker'] || agentPanelText('greetingKicker')),
      (el44['querySelector']('.agent-greeting-title')['textContent'] =
        surface['greeting'] || agentPanelText('greetingTitle')),
      (el50['querySelector']('.agent-custom-panel-title')['textContent'] =
        agentPanelText('customShortcutPanelTitle')),
      (el50['querySelector']('.agent-custom-panel-desc')['textContent'] =
        agentPanelText('customShortcutPanelDesc')),
      run13(el51, agentPanelText('customShortcutClose')),
      run14(el52, agentPanelText('customShortcutNew')));
    const value129 = el54['querySelectorAll']('.agent-custom-label');
    if (value129[0]) value129[0]['textContent'] = agentPanelText('customShortcutNameLabel');
    if (value129[1]) value129[1]['textContent'] = agentPanelText('customShortcutPromptLabel');
    ((el56['placeholder'] = agentPanelText('customShortcutNamePlaceholder')),
      (el58['placeholder'] = agentPanelText('customShortcutPromptPlaceholder')),
      run14(el59, agentPanelText('customShortcutSave')),
      run14(el65, agentPanelText('confirmExecute')),
      run14(el66, agentPanelText('cancel')),
      run13(el69, agentPanelText('addSelectedReference')),
      el69['setAttribute']?.('data-tooltip', agentPanelText('addSelectedReference')),
      (el70['textContent'] = agentPanelText('addReference')),
      (slashTrigger['dataset']['placeholder'] = surface['placeholder'] || agentPanelText('inputPlaceholder')),
      run13(el74, agentPanelText('add')),
      el75['querySelectorAll']('.agent-menu-item')['forEach']((el95) => {
        const value130 = el95['dataset']?.['placeholderAction'];
        if (value130 === 'upload') run14(el95, agentPanelText('uploadMaterial'));
        if (value130 === 'document') run14(el95, agentPanelText('readDocument'));
        if (value130 === 'custom') run14(el95, agentPanelText('customShortcutPanelTitle'));
        if (value130 === 'skills') run14(el95, agentPanelText('skillManage'));
      }),
      run13(el78, agentPanelText('modelSelection')),
      bindAgentModelControls2?.['sync']?.(value128),
      run13(el84, agentPanelText('agentMode')),
      (el85['textContent'] = getAgentExecutionModeLabel(value128['executionMode'])),
      el87['querySelectorAll']('[data-execution-mode]')['forEach']((el96) => {
        run14(el96, getAgentExecutionModeLabel(el96['dataset']['executionMode']));
      }),
      run13(el89, agentPanelText('send')),
      run13(el90, agentPanelText('stop')),
      onCatalogChange['refreshText'](),
      agentSkillPanel['refreshText'](),
      run3(),
      onDocumentChange());
    isAgentPopoverOpen(el45) &&
      renderHistory(el45, runtime, { onSelect: onSelect3, onDelete: onDelete2 });
    if (!el50['hidden']) renderCustomShortcutList();
    enabled21 && onNotice(agentPanelText('materialPickStarted'), { sticky: !![] });
  }
  function run16(options11 = {}) {
    if (options11['thumbUrl']) {
      const agentElement18 = createAgentElement('img', 'ref-thumb-media agent-input-ref-media');
      return (
        (agentElement18['src'] = options11['thumbUrl']),
        (agentElement18['alt'] = options11['label'] || options11['nodeId'] || ''),
        (agentElement18['draggable'] = ![]),
        agentElement18
      );
    }
    if (String(options11['kind'] || '') === 'audio') {
      const el97 =
        createReferenceFallbackThumbElement('audio', 'ref-thumb-media agent-input-ref-fallback') ||
        createAgentElement('div', 'ref-thumb-media ref-thumb-fallback agent-input-ref-fallback');
      (el97['classList']?.['add']?.('agent-input-ref-audio-thumb'), (el97['textContent'] = ''));
      const el98 = createAgentElement('span', 'agent-audio-thumb-bars');
      for (let count6 = 0; count6 < 9; count6 += 1) {
        el98['appendChild'](createAgentElement('span', 'agent-audio-thumb-bar'));
      }
      return (el97['appendChild'](el98), el97);
    }
    const el99 = createAgentElement(
      'div',
      'ref-thumb-media ref-thumb-fallback agent-input-ref-fallback',
      String(options11['kind'] || 'node')
        ['slice'](0, 3)
        ['toUpperCase'](),
    );
    return (el99['setAttribute']('aria-hidden', 'true'), el99);
  }
  function onDocumentChange() {
    el71['replaceChildren']();
    const list28 = [...list27, ...args['getDocumentDisplayRefs']()];
    (list28['forEach']((error) => {
      const el100 = createAgentElement('div', 'ref-thumb-wrap agent-input-ref-thumb'),
        value131 = String(error['label'] || error['name'] || error['nodeId'] || '')['trim']();
      ((el100['title'] = value131),
        el100['setAttribute']('aria-label', value131),
        el100['setAttribute']('role', 'listitem'),
        (el100['dataset']['inputRefId'] = error['nodeId']),
        el100['appendChild'](run16(error)));
      const agentPanelText3 = agentPanelText('removeReference'),
        el101 = createAgentElement('button', 'ref-thumb-delete agent-input-ref-remove', '×');
      ((el101['type'] = 'button'),
        (el101['title'] = agentPanelText3),
        el101['setAttribute']('aria-label', agentPanelText3),
        (el101['dataset']['inputRefRemove'] = error['nodeId']),
        el100['appendChild'](el101),
        el71['appendChild'](el100));
    }),
      el68['classList']['add']('active'),
      el68['classList']['toggle']('has-input-refs', list28['length'] > 0),
      (el70['hidden'] = list28['length'] > 0));
  }
  function addInputRefs(list29 = []) {
    const map6 = new Map(list27['map']((value132) => [value132['nodeId'], value132]));
    return (
      list29['filter'](Boolean)['forEach']((enabled22) => {
        if (!enabled22['nodeId'] || map6['has'](enabled22['nodeId'])) return;
        map6['set'](enabled22['nodeId'], enabled22);
      }),
      (list27 = Array['from'](map6['values']())['slice'](0, AGENT_CONVERSATION_INPUT_REF_LIMIT)),
      onDocumentChange(),
      list27['length']
    );
  }
  function run17() {
    ((list27 = []), args['clearDocuments']({ notify: ![] }), onDocumentChange());
  }
  function run18({ clearWhenMissing: clearWhenMissing = ![] } = {}) {
    const value133 =
        runtime?.['sessionStore']?.['getPendingClarification']?.() ||
        runtime?.['sessionStore']?.['getState']?.()['pendingClarification'] ||
        null,
      list30 = (Array['isArray'](value133?.['inputRefs']) ? value133['inputRefs'] : [])
        ['filter']((value134) => String(value134?.['nodeId'] || value134?.['id'] || '')['trim']())
        ['map']((args2) => ({
          ...args2,
          id: String(args2['nodeId'] || args2['id'] || '')['trim'](),
          nodeId: String(args2['nodeId'] || args2['id'] || '')['trim'](),
        }))
        ['slice'](0, AGENT_CONVERSATION_INPUT_REF_LIMIT);
    if (list30['length'] === 0 && !clearWhenMissing) return ![];
    return ((list27 = list30), onDocumentChange(), list30['length'] > 0);
  }
  function run19() {
    return document?.['getElementById']?.('v2-wrap') || null;
  }
  function run20() {
    return document?.['documentElement'] || globalThis['document']?.['documentElement'] || null;
  }
  function run21() {
    try {
      return createLinkCursor({ size: getCursorSize() });
    } catch {
      return createLinkCursor({ size: 'small' });
    }
  }
  function run22() {
    (el91?.['classList']?.['remove']?.('agent-material-pick-hover'), (el91 = null));
  }
  function run23(value135) {
    if (el91 === value135) return;
    (run22(),
      (el91 = value135 || null),
      el91?.['classList']?.['add']?.('agent-material-pick-hover'));
  }
  function run24({ noticeText: noticeText = '' } = {}) {
    if (!enabled21) return;
    ((enabled21 = ![]),
      run22(),
      ownerRoot['classList']['remove']('is-material-picking'),
      el69['classList']['remove']('is-picking', 'is-connecting-active'),
      el69['setAttribute']('aria-pressed', 'false'));
    const el102 = run19();
    el102?.['classList']?.['remove']?.('is-connecting', 'agent-material-pick-mode');
    const el103 = run20();
    (el103?.['classList']?.['remove']?.('is-connecting-mode'),
      el103?.['style']?.['removeProperty']?.('--connect-cursor'),
      document?.['removeEventListener']?.('click', run25, !![]),
      document?.['removeEventListener']?.('pointermove', run26, !![]),
      document?.['removeEventListener']?.('keydown', run27, !![]));
    if (noticeText) onNotice(noticeText);
  }
  function run28({ toggle: toggle = !![] } = {}) {
    if (enabled21) {
      toggle && run24({ noticeText: agentPanelText('materialPickCancelled') });
      return;
    }
    ((enabled21 = !![]),
      ownerRoot['classList']['add']('is-material-picking'),
      el69['classList']['add']('is-picking', 'is-connecting-active'),
      el69['setAttribute']('aria-pressed', 'true'));
    const el104 = run19();
    el104?.['classList']?.['add']?.('is-connecting', 'agent-material-pick-mode');
    const el105 = run20();
    (el105?.['classList']?.['add']?.('is-connecting-mode'),
      el105?.['style']?.['setProperty']?.('--connect-cursor', run21()),
      document?.['addEventListener']?.('click', run25, !![]),
      document?.['addEventListener']?.('pointermove', run26, !![]),
      document?.['addEventListener']?.('keydown', run27, !![]),
      onNotice(agentPanelText('materialPickStarted'), { sticky: !![] }));
  }
  function run29(el106) {
    const nodeEl = el106?.['closest']?.('.v2-node') || null,
      enabled23 = String(nodeEl?.['id'] || '')['trim']();
    if (!enabled23) return { nodeEl: null, node: null, ref: null };
    const node = getStoreState(store)['nodes']?.[enabled23] || null,
      ref = normalizeAgentInputRefFromNode(node, { source: 'canvas-pick' });
    return { nodeEl: nodeEl, node: node, ref: ref };
  }
  function run26(event5) {
    if (!enabled21 || ownerRoot['contains'](event5['target'])) return;
    const { nodeEl: nodeEl2, ref: ref2 } = run29(event5['target']);
    run23(nodeEl2 && isAgentMaterialRef(ref2) ? nodeEl2 : null);
  }
  function run25(event6) {
    if (!enabled21) return;
    if (ownerRoot['contains'](event6['target'])) return;
    const { ref: ref3 } = run29(event6['target']);
    if (!ref3) return;
    (event6['preventDefault']?.(),
      event6['stopPropagation']?.(),
      event6['stopImmediatePropagation']?.());
    if (!isAgentMaterialRef(ref3)) {
      onNotice(agentPanelText('materialPickUnsupported'), { sticky: !![] });
      return;
    }
    (addInputRefs([ref3]),
      onNotice(formatAgentPanelText('attachSelected', { count: 1 }), { sticky: !![] }));
  }
  function run27(event7) {
    if (!enabled21 || event7['key'] !== 'Escape') return;
    (event7['preventDefault']?.(),
      event7['stopPropagation']?.(),
      run24({ noticeText: agentPanelText('materialPickCancelled') }));
  }
  function run30() {
    const storeState = getStoreState(store),
      list31 = Array['isArray'](storeState['selectedNodeIds'])
        ? storeState['selectedNodeIds']['map']((value136) => String(value136 || ''))['filter'](Boolean)
        : [],
      list32 = list31['map']((value137) =>
        normalizeAgentInputRefFromNode(storeState['nodes']?.[value137], { source: 'canvas-selection' }),
      )['filter'](Boolean),
      list33 = list32['filter'](isAgentMaterialRef);
    if (list33['length'] === 0) return (onNotice(agentPanelText('attachSelectedEmpty')), 0);
    const value138 = list27['length'];
    addInputRefs(list33);
    const count7 = Math['max'](0, list27['length'] - value138);
    return (
      onNotice(formatAgentPanelText('attachSelected', { count: count7 || list33['length'] })),
      slashTrigger['focus'](),
      count7 || list33['length']
    );
  }
  function run31({ toggle: toggle = !![] } = {}) {
    if (enabled21) return (run28({ toggle: toggle }), 0);
    const count8 = run30();
    if (count8 > 0) return count8;
    return (run28({ toggle: ![] }), 0);
  }
  let id3 = '';
  function run32() {
    const list34 = readCustomQuickActions(windowObject);
    el53['replaceChildren']();
    if (list34['length'] === 0) {
      const agentElement19 = createAgentElement(
        'div',
        'agent-custom-empty',
        agentPanelText('customShortcutEmpty'),
      );
      return (el53['appendChild'](agentElement19), list34);
    }
    return (
      list34['forEach']((value139) => {
        const value140 = String(value139['label'] || value139['prompt'] || '')['trim'](),
          el107 = createAgentElement('div', 'agent-custom-item'),
          agentButton2 = createAgentButton('agent-custom-item-main', value140),
          el108 = createAgentButton('agent-custom-item-delete', '×');
        ((el107['dataset']['agentCustomActionId'] = value139['id']),
          el107['setAttribute']('role', 'listitem'),
          el107['classList']['toggle']('is-active', value139['id'] === id3),
          el108['setAttribute']('aria-label', agentPanelText('customShortcutDelete')),
          (el108['dataset']['agentCustomDeleteActionId'] = value139['id']),
          el107['append'](agentButton2, el108),
          el53['appendChild'](el107));
      }),
      list34
    );
  }
  function run33(value141) {
    const enabled24 = String(value141 || '')['trim']();
    if (!enabled24) return null;
    const customQuickActions = readCustomQuickActions(windowObject)['find']((value142) => value142['id'] === enabled24);
    if (!customQuickActions) return null;
    return (run34(customQuickActions), customQuickActions);
  }
  function run34(options12 = {}) {
    id3 = String(options12['id'] || '')['trim']();
    const value143 = String(options12['prompt'] || '')['trim']();
    ((el56['value'] = String(options12['label'] || '')['trim']()),
      (el58['value'] = value143),
      run32(),
      !el56['value'] && value143 && (el56['value'] = truncateUiText(value143, 18)));
  }
  function run35({ prefillFromInput: prefillFromInput = ![] } = {}) {
    run6(!![]);
    const customQuickActions2 = readCustomQuickActions(windowObject),
      prompt2 = prefillFromInput ? getEditorText(slashTrigger) : '';
    (prompt2
      ? run34({ label: truncateUiText(prompt2, 18), prompt: prompt2 })
      : run34(customQuickActions2[0] || {}),
      el58['focus']?.());
  }
  function run36() {
    const prompt3 = String(el58['value'] || '')['trim']();
    if (!prompt3) {
      (onNotice(agentPanelText('customShortcutEmpty')), el58['focus']?.());
      return;
    }
    const label2 = truncateUiText(el56['value'] || prompt3, 28),
      list35 = readCustomQuickActions(windowObject),
      custom2 = list35['find']((value144) => value144['id'] === id3),
      value145 = {
        id: id3 || 'custom-' + Date['now'](),
        label: label2,
        prompt: prompt3,
        custom: custom2 ? custom2['custom'] === !![] : !![],
      },
      count9 = list35['findIndex']((value146) => value146['id'] === value145['id']),
      value147 =
        count9 >= 0
          ? list35['map']((value148) => (value148['id'] === value145['id'] ? value145 : value148))
          : [value145, ...list35['filter']((value149) => value149['prompt'] !== prompt3)],
      writeCustomQuickActions2 = writeCustomQuickActions(value147, windowObject);
    return (
      (id3 = value145['id']),
      run3(),
      run32(),
      run11(messagesEl['children']['length'] > 0),
      onNotice(agentPanelText('customShortcutSaved')),
      writeCustomQuickActions2
    );
  }
  function run37(value150) {
    const enabled25 = String(value150 || '')['trim']();
    if (!enabled25) return [];
    const writeCustomQuickActions3 = writeCustomQuickActions(
      readCustomQuickActions(windowObject)['filter']((value151) => value151['id'] !== enabled25),
      windowObject,
    );
    return (
      run3(),
      run11(messagesEl['children']['length'] > 0),
      id3 === enabled25 ? run34(writeCustomQuickActions3[0] || {}) : run32(),
      onNotice(agentPanelText('customShortcutDeleted')),
      writeCustomQuickActions3
    );
  }
  function getHistory() {
    return (
      runtime?.['sessionStore']?.['getHistory']?.() ||
      runtime?.['sessionStore']?.['getState']?.()['history'] ||
      []
    );
  }
  function run38() {
    (run2(),
      renderPlanPreview(el61, null),
      el62['replaceChildren'](),
      (el62['hidden'] = !![]),
      el63['replaceChildren'](),
      (el63['hidden'] = !![]),
      (el64['hidden'] = !![]));
  }
  function run39(options13 = {}) {
    agentConversationPresentation?.['appendEntry'](options13);
  }
  function run40({ hasMessages: hasMessages } = {}) {
    const value152 = hasMessages ?? messagesEl['children']['length'] > 0;
    ((el44['hidden'] = value152), run11(value152));
    if (value152) run6(![]);
  }
  function run41({ preserveNotice: preserveNotice = ![] } = {}) {
    if (!ownerRoot['classList']['contains']('is-open')) {
      onNotice('');
      return;
    }
    if (runtime['sessionStore']?.['getPersistenceError']?.()) {
      onNotice('');
      return;
    }
    const value153 =
      runtime?.['getActiveConversation']?.() ||
      runtime?.['sessionStore']?.['getState']?.()['activeConversation'] ||
      null;
    if (value153?.['hasUnfinishedOperation']) {
      onNotice(agentPanelText('unfinishedNotice'), { sticky: !![] });
      return;
    }
    if (!preserveNotice) onNotice('');
  }
  function run42({
    preserveNotice: preserveNotice = ![],
    restorePendingInputRefs: restorePendingInputRefs = ![],
  } = {}) {
    run38();
    const sessionSnapshot = runtime?.['sessionStore']?.['getState']?.() || {};
    agentConversationPresentation?.['render']({ history: getHistory(), sessionSnapshot: sessionSnapshot });
    const value154 = sessionSnapshot['pendingPlan'] || null;
    (value154 &&
      (renderPlanPreview(el61, value154, { onParamChange: onParamChange2, onOpenParamOptions: onOpenParamOptions2 }),
      (el64['hidden'] = ![])),
      restorePendingInputRefs && run18({ clearWhenMissing: !![] }),
      run43(runtime['getPendingAssistantChoice']?.() || sessionSnapshot['pendingClarification']),
      run40(),
      run41({ preserveNotice: preserveNotice }));
  }
  function run44() {
    const value155 = getHistory(),
      list36 = Array['isArray'](value155) ? value155 : [];
    return (agentConversationPresentation?.['renderMessages'](list36), run40(), list36['length'] > 0);
  }
  function setBusy(value156, { stoppable: stoppable = ![] } = {}) {
    enabled11 = value156 === !![];
    if (enabled11) run2();
    (el67['setAttribute']('aria-busy', enabled11 ? 'true' : 'false'),
      el90['setAttribute']('aria-busy', enabled11 && stoppable ? 'true' : 'false'),
      (el89['disabled'] = enabled11),
      (el89['hidden'] = enabled11 && stoppable),
      (el90['hidden'] = !(enabled11 && stoppable)),
      (el65['disabled'] = enabled11),
      (el66['disabled'] = enabled11),
      el62['querySelectorAll']?.('.agent-option-btn')?.['forEach']((el109) => {
        el109['disabled'] = enabled11;
      }),
      el63['querySelectorAll']?.('.agent-recovery-btn')?.['forEach']((el110) => {
        el110['disabled'] = enabled11;
      }),
      el61['querySelectorAll']?.('.agent-param-input')?.['forEach']((el111) => {
        el111['disabled'] = enabled11;
      }),
      ownerRoot['classList']['toggle']('is-busy', enabled11),
      agentConversationPresentation?.['setBusy'](enabled11),
      agentConversationActions?.['setBusy']());
    if (!enabled11 && (value109 || runtime['sessionStore']?.['getPersistenceError']?.())) onNotice('');
  }
  function run45(enabled26) {
    !enabled26 && (value110?.(), agentPanelContinuity['rememberClosed']());
    (ownerRoot['classList']['toggle']('is-open', enabled26),
      ownerRoot['setAttribute']('aria-hidden', enabled26 ? 'false' : 'true'),
      stateRoot['classList']?.['toggle']('agent-sidebar-open', enabled26),
      stateRoot['classList']?.['toggle']('agent-sidebar-collapsed', enabled26 && enabled20),
      fabBtnEl['classList']['toggle']('is-agent-open', enabled26));
    if (enabled26) {
      (runtime['sessionStore']?.['retryPersistence']?.(),
        bindAgentModelControls2?.['sync']?.(modelSettings?.['getSettings']?.() || activeModel));
      if (!enabled11 && !agentPanelContinuity['canResume']())
        run42({ preserveNotice: !![], restorePendingInputRefs: !agentPanelContinuity['isSameConversation']() });
      run4();
      if (!enabled20)
        (messagesEl['querySelector']('.agent-message-edit-input') || slashTrigger)['focus']({
          preventScroll: !![],
        });
      run41({ preserveNotice: !![] });
    } else (run24(), run2(), closeFloatingMenus(ownerRoot), onNotice(''));
  }
  function toggle2() {
    run45(!ownerRoot['classList']['contains']('is-open'));
  }
  function run46(value157) {
    ((enabled20 = value157 === !![]),
      ownerRoot['classList']['toggle']('is-collapsed', enabled20),
      stateRoot['classList']?.['toggle'](
        'agent-sidebar-collapsed',
        enabled20 && ownerRoot['classList']['contains']('is-open'),
      ));
    if (!enabled20 && ownerRoot['classList']['contains']('is-open'))
      slashTrigger['focus']({ preventScroll: !![] });
    enabled20 && (run24(), closeFloatingMenus(ownerRoot), onNotice(''));
  }
  function run47(value158, { persist: persist = ![] } = {}) {
    const clampAgentSidebarWidth2 = clampAgentSidebarWidth(value158);
    stateRoot['style']?.['setProperty']?.('--agent-sidebar-width', clampAgentSidebarWidth2 + 'px');
    if (persist) writeStoredSidebarWidth(clampAgentSidebarWidth2, windowObject);
    return (run4(), clampAgentSidebarWidth2);
  }
  function run48(event8) {
    (event8['preventDefault']?.(), event8['stopPropagation']?.());
    const value159 = Number(event8['clientX']),
      enabled27 = ownerRoot['getBoundingClientRect']?.()['width'] || ownerRoot['offsetWidth'] || 0;
    if (!Number['isFinite'](value159) || !enabled27) return;
    stateRoot['classList']?.['add']?.('agent-sidebar-resizing');
    const value160 = (event9) => {
        const value161 = Number(event9['clientX']);
        if (!Number['isFinite'](value161)) return;
        run47(enabled27 + (value159 - value161));
      },
      handler3 = (event10) => {
        ((value110 = null),
          document?.['removeEventListener']?.('pointermove', value160),
          document?.['removeEventListener']?.('pointerup', handler3),
          stateRoot['classList']?.['remove']?.('agent-sidebar-resizing'));
        const value162 = Number(event10['clientX']);
        Number['isFinite'](value162) && run47(enabled27 + (value159 - value162), { persist: !![] });
      };
    (value110?.(),
      (value110 = () => handler3({})),
      document?.['addEventListener']?.('pointermove', value160),
      document?.['addEventListener']?.('pointerup', handler3));
  }
  function reset() {
    (agentPanelContinuity['invalidate'](),
      run24(),
      runtime['startNewConversation']?.(),
      run42({ preserveNotice: !![], restorePendingInputRefs: !![] }),
      setBusy(![]),
      setEditorText(slashTrigger, ''),
      run17(),
      run6(![]),
      (el45['hidden'] = !![]),
      onNotice(agentPanelText('newConversationNotice')));
  }
  function onSelect3(value163) {
    if (!runtime['switchConversation']?.(value163)) return;
    (agentPanelContinuity['invalidate'](),
      run24(),
      setEditorText(slashTrigger, ''),
      run17(),
      run6(![]),
      (el45['hidden'] = !![]),
      run42({ restorePendingInputRefs: !![] }),
      setBusy(![]));
  }
  function onDelete2(value164) {
    const value165 = value164 === runtime['getActiveConversation']?.()?.['id'];
    (value165 && (agentPanelContinuity['invalidate'](), run24()),
      runtime['deleteConversation']?.(value164),
      value165 &&
        (setEditorText(slashTrigger, ''),
        run17(),
        run6(![]),
        run42({ restorePendingInputRefs: !![] }),
        setBusy(![])),
      renderHistory(el45, runtime, { onSelect: onSelect3, onDelete: onDelete2 }));
  }
  async function onParamChange2(value166, value167) {
    if (typeof runtime?.['updatePendingGenerationParams'] !== 'function') return;
    const value168 = agentPanelContinuity['capture']();
    setBusy(!![]);
    try {
      const error2 = await runtime['updatePendingGenerationParams']({
        params: { [value166]: value167 },
      });
      if (!agentPanelContinuity['isCurrent'](value168) || error2?.['stale']) return;
      if (error2?.['ok'] && error2['plan']) {
        (renderPlanPreview(el61, error2['plan'], {
          onParamChange: onParamChange2,
          onOpenParamOptions: onOpenParamOptions2,
        }),
          agentConversationPresentation?.['acknowledgeSessionState']?.(),
          onNotice(''));
        return;
      }
      onNotice(error2?.['message'] || error2?.['reply'] || agentPanelText('paramUpdateFailed'));
    } catch (error3) {
      if (agentPanelContinuity['isCurrent'](value168))
        onNotice(error3?.['message'] || agentPanelText('paramUpdateFailed'));
    } finally {
      if (agentPanelContinuity['isCurrent'](value168)) setBusy(![]);
    }
  }
  function onResult(diagnostic) {
    if (diagnostic?.['stale']) return;
    if (diagnostic?.['notice']) onNotice(diagnostic['notice']);
    diagnostic?.['reply'] &&
      !diagnostic['assistantHandled'] &&
      agentConversationPresentation['appendMessage']('assistant', diagnostic['reply'], {
        diagnostic: diagnostic['diagnostic'] || null,
      });
    Array['isArray'](diagnostic?.['taskMessages']) &&
      diagnostic['taskMessages']['forEach']((value169) => run39(value169));
    el44['hidden'] = messagesEl['children']['length'] > 0;
    const value170 = diagnostic?.['status'] === 'need_confirmation' ? diagnostic?.['plan'] || null : null;
    (renderPlanPreview(el61, value170, { onParamChange: onParamChange2, onOpenParamOptions: onOpenParamOptions2 }),
      run43(diagnostic),
      renderRecovery(el63, diagnostic, runtime, onResult, setBusy, {
        editor: slashTrigger,
        setNotice: onNotice,
      }),
      (el64['hidden'] = diagnostic?.['status'] !== 'need_confirmation'),
      agentConversationPresentation['renderRunSteps'](runtime?.['sessionStore']?.['getState']?.() || {}),
      run18({ clearWhenMissing: !![] }),
      agentConversationPresentation?.['acknowledgeSessionState']?.({ taskMessages: diagnostic?.['taskMessages'] || [] }));
  }
  function run43(value171) {
    renderAgentConversationChoices(
      el62,
      value171,
      runtime,
      onResult,
      (stoppable2) => setBusy(stoppable2, { stoppable: stoppable2 === !![] }),
      {
        onAnswer: (enabled28) => {
          if (!enabled28) return;
          const inputRefs = list27['slice']();
          (run17(),
            agentConversationPresentation['appendMessage']('user', enabled28, { inputRefs: inputRefs }),
            (el44['hidden'] = !![]));
        },
        onWaitingStart: () => agentConversationPresentation['appendWaiting'](),
        onWaitingEnd: (value172) => agentConversationPresentation['removeWaiting'](value172),
      },
    );
  }
  async function run49() {
    const editorText2 = getEditorText(slashTrigger);
    if (!editorText2) return;
    const value173 = agentPanelContinuity['capture']();
    (run44(), onNotice(''), run24());
    const inputRefs2 = list27['slice'](),
      documentFiles = args['consumeDocuments'](),
      inputRefs3 = [...inputRefs2, ...documentFiles['displayRefs']];
    (run17(),
      setEditorText(slashTrigger, ''),
      run6(![]),
      agentSkillPanel['close'](),
      run11(!![]),
      agentConversationPresentation['appendMessage']('user', editorText2, { inputRefs: inputRefs3 }),
      (el44['hidden'] = !![]),
      (el62['hidden'] = !![]),
      setBusy(!![], { stoppable: !![] }));
    const el112 = agentConversationPresentation['appendWaiting']();
    try {
      const value174 = await runtime['handleUserMessage'](editorText2, {
        inputRefs: inputRefs2,
        ...(documentFiles['files']['length'] > 0
          ? { documentFiles: documentFiles['files'], displayInputRefs: inputRefs3 }
          : {}),
      });
      if (agentPanelContinuity['isCurrent'](value173)) onResult(value174);
    } catch (error4) {
      if (!agentPanelContinuity['isCurrent'](value173)) return;
      agentConversationPresentation['appendMessage']('assistant', error4?.['message'] || 'Agent failed.');
    } finally {
      if (agentPanelContinuity['isCurrent'](value173)) {
        const value175 = Boolean(el112['parentNode']);
        agentConversationPresentation['removeWaiting'](el112);
        if (value175) setBusy(![]);
      }
    }
  }
  const value176 = (event11) => {
    (event11['stopPropagation'](), toggle2());
  };
  (fabBtnEl['addEventListener']('click', value176),
    el43['addEventListener']('click', () => run45(![])),
    el41['addEventListener']('click', reset),
    el42['addEventListener']('click', (event12) => {
      event12['stopPropagation']?.();
      const value177 = !isAgentPopoverOpen(el45);
      (setMenuOpen(el45, value177, ownerRoot),
        value177 && renderHistory(el45, runtime, { onSelect: onSelect3, onDelete: onDelete2 }));
    }),
    el47['addEventListener']('click', (event13) => {
      const el113 = event13['target']?.['closest']?.('.agent-quick-card');
      if (!el113) return;
      (setEditorText(slashTrigger, el113['dataset']['prompt'] || el113['textContent'] || ''),
        slashTrigger['focus']());
    }),
    el47['addEventListener']('scroll', run4),
    el47['addEventListener']('wheel', run12),
    windowObject?.['addEventListener']?.('resize', run4),
    el53['addEventListener']('click', (event14) => {
      const el114 = event14['target']?.['closest']?.('[data-agent-custom-delete-action-id]');
      if (el114) {
        (event14['preventDefault']?.(),
          event14['stopPropagation']?.(),
          run37(el114['dataset']['agentCustomDeleteActionId']));
        return;
      }
      const el115 = event14['target']?.['closest']?.('[data-agent-custom-action-id]'),
        value178 = String(el115?.['dataset']?.['agentCustomActionId'] || '')['trim']();
      run33(value178);
    }),
    el52['addEventListener']('click', () => {
      const prompt4 = getEditorText(slashTrigger);
      (run34(prompt4 ? { label: truncateUiText(prompt4, 18), prompt: prompt4 } : {}),
        el58['focus']?.());
    }),
    el59['addEventListener']('click', run36),
    el51['addEventListener']('click', () => {
      (run6(![]), slashTrigger['focus']());
    }),
    el74['addEventListener']('click', (event15) => {
      (event15['stopPropagation'](),
        setMenuOpen(el75, !el75['classList']['contains']('show'), ownerRoot));
    }),
    el75['addEventListener']('click', (event16) => {
      const el116 = event16['target']?.['closest']?.('[data-placeholder-action]');
      if (!el116) return;
      event16['stopPropagation']?.();
      const value179 = el116['dataset']['placeholderAction'];
      if (value179 === 'upload') args['openMaterialPicker']();
      else {
        if (value179 === 'document') args['openDocumentPicker']();
        else {
          if (value179 === 'custom') (agentSkillPanel['close'](), run35({ prefillFromInput: !![] }));
          else value179 === 'skills' && run5();
        }
      }
      el75['classList']['remove']('show');
    }),
    el69['addEventListener']('click', (event17) => {
      (event17['stopPropagation']?.(), run31());
    }),
    el69['addEventListener']('keydown', (event18) => {
      if (event18['key'] !== 'Enter' && event18['key'] !== ' ') return;
      (event18['preventDefault']?.(), run31());
    }),
    el71['addEventListener']('click', (event19) => {
      const el117 = event19['target']?.['closest']?.('[data-input-ref-remove]'),
        enabled29 = String(el117?.['dataset']?.['inputRefRemove'] || '')['trim']();
      if (!enabled29) return;
      ((list27 = list27['filter']((value180) => value180['nodeId'] !== enabled29)),
        args['removeDocument'](enabled29),
        onDocumentChange());
    }),
    el84['addEventListener']('click', (event20) => {
      if (el83['hidden']) return;
      (event20['stopPropagation'](),
        setMenuOpen(el87, !el87['classList']['contains']('show'), ownerRoot));
    }),
    el87['addEventListener']('click', (event21) => {
      const el118 = event21['target']?.['closest']?.('[data-execution-mode]');
      if (!el118) return;
      const executionMode2 = normalizeAgentExecutionMode(el118['dataset']['executionMode']),
        value181 = modelSettings?.['updateSettings']?.({ executionMode: executionMode2 }) || {
          executionMode: executionMode2,
        };
      ((el85['textContent'] = getAgentExecutionModeLabel(value181['executionMode'])),
        el87['querySelectorAll']('[data-execution-mode]')['forEach']((el119) =>
          el119['classList']['toggle'](
            'active',
            el119['dataset']['executionMode'] === value181['executionMode'],
          ),
        ),
        el87['classList']['remove']('show'),
        onNotice(agentPanelText('executionModeSaved')));
    }),
    el67['addEventListener']('submit', (event22) => {
      event22['preventDefault']();
      if (enabled11) return;
      run49();
    }),
    el90['addEventListener']('click', () => {
      const value182 = runtime['stop']?.();
      (messagesEl['querySelectorAll']?.('.agent-message--typing')?.['forEach']((value183) =>
        agentConversationPresentation['removeWaiting'](value183),
      ),
        setBusy(![]),
        onNotice(value182?.['notice'] || agentPanelText('stopRequested')));
    }),
    slashTrigger['addEventListener']('input', () => {
      if (surface['textOnly']) return;
      const editorText3 = getEditorText(slashTrigger)['match'](/^\/([^\s]*)$/);
      if (!editorText3) {
        setMenuOpen(onCatalogChange['menu'], ![], ownerRoot);
        return;
      }
      (agentSkillPanel['close'](),
        run6(![]),
        onCatalogChange['openSlash'](editorText3[1]),
        setMenuOpen(onCatalogChange['menu'], !![], ownerRoot));
    }),
    slashTrigger['addEventListener']('keydown', (event23) => {
      if (isAgentPopoverOpen(onCatalogChange['menu']) && !event23['isComposing']) {
        if (event23['key'] === 'ArrowDown' || event23['key'] === 'ArrowUp') {
          (event23['preventDefault'](),
            onCatalogChange['moveActive'](event23['key'] === 'ArrowUp' ? -1 : 1));
          return;
        }
        if ((event23['key'] === 'Enter' && !event23['shiftKey']) || event23['key'] === 'Tab') {
          (event23['preventDefault'](), onCatalogChange['chooseActive']());
          return;
        }
        if (event23['key'] === 'Escape') {
          (event23['preventDefault'](),
            setMenuOpen(onCatalogChange['menu'], ![], ownerRoot),
            slashTrigger['focus']());
          return;
        }
      }
      if (event23['key'] === 'Enter' && !event23['shiftKey']) {
        event23['preventDefault']();
        if (enabled11) return;
        run49();
      }
    }),
    slashTrigger['addEventListener']('paste', (event24) => {
      if (surface['textOnly']) return;
      const pastedImageFile = normalizePastedImageFile(getImageFileFromClipboardData(event24['clipboardData']));
      if (!pastedImageFile) return;
      (event24['preventDefault']?.(), args['uploadMaterialFile'](pastedImageFile));
    }),
    ownerRoot['addEventListener']('copy', run9),
    ownerRoot['addEventListener']('contextmenu', (event25) => {
      const el120 = event25['target']?.['closest']?.('.agent-message-media-card');
      if (el120) {
        handler2(event25, [
          {
            label: agentPanelText('imageResultOpen'),
            icon: 'fullscreen',
            shortcutActionId: 'context-agent-open-image',
            action: () =>
              onImagePreview(el120['dataset']['imageUrl'] || '', el120['dataset']['imageName'] || ''),
          },
        ]);
        return;
      }
      const el121 = event25['target']?.['closest']?.('.agent-history-item');
      if (el121) {
        const enabled30 = String(el121['dataset']['conversationId'] || '')['trim']();
        if (!enabled30) return;
        handler2(event25, [
          {
            label: agentPanelText('historyOpen'),
            icon: 'folder-open',
            shortcutActionId: 'context-agent-open-history',
            action: () => onSelect3(enabled30),
          },
          'sep',
          {
            label: agentPanelText('historyDelete'),
            icon: 'delete',
            danger: !![],
            shortcutActionId: 'context-agent-delete-history',
            action: () => onDelete2(enabled30),
          },
        ]);
        return;
      }
      const value184 = event25['target']?.['closest']?.('.agent-message'),
        value185 = value184 ? run8(value184) : '',
        enabled31 = value185 || String(value184?.['agentMessageCopyText'] || '')['trim']();
      if (!enabled31) return;
      handler2(event25, [
        {
          label: agentPanelText(value185 ? 'copySelection' : 'copyMessage'),
          icon: 'copy',
          kbd: 'Ctrl C',
          shortcutActionId: 'copy',
          action: () => void onCopy(enabled31),
        },
      ]);
    }),
    ownerRoot['addEventListener']('pointerdown', (event26) => event26['stopPropagation']()),
    ownerRoot['addEventListener']('click', (event27) => {
      if (isAgentMenuSurface(event27['target'])) return;
      closeFloatingMenus(ownerRoot);
    }));
  const value186 = (event28) => {
      if (!ownerRoot['contains'](event28['target'])) closeFloatingMenus(ownerRoot);
    },
    value187 = (event29) => {
      if (event29['key'] !== 'Escape') return;
      if (!hasOpenFloatingMenus(ownerRoot)) return;
      const isAgentPopoverOpen2 = isAgentPopoverOpen(onCatalogChange['menu']);
      (event29['preventDefault']?.(), closeFloatingMenus(ownerRoot));
      if (isAgentPopoverOpen2) slashTrigger['focus']();
    };
  (document?.['addEventListener']?.('click', value186),
    document?.['addEventListener']?.('keydown', value187),
    el40['addEventListener']('pointerdown', run48),
    el40['addEventListener']('keydown', (event30) => {
      if (event30['key'] !== 'ArrowLeft' && event30['key'] !== 'ArrowRight') return;
      event30['preventDefault']();
      const value188 = ownerRoot['getBoundingClientRect']?.()['width'] || ownerRoot['offsetWidth'] || 0,
        value189 = event30['key'] === 'ArrowLeft' ? 24 : -24;
      run47(value188 + value189, { persist: !![] });
    }),
    el65['addEventListener']('click', async () => {
      if (enabled11) return;
      const value190 = agentPanelContinuity['capture'](),
        displayAnswer = agentPanelText('confirmUserMessage');
      (agentConversationPresentation['appendMessage']('user', displayAnswer),
        (el44['hidden'] = !![]),
        (el64['hidden'] = !![]),
        setBusy(!![], { stoppable: !![] }));
      const el122 = agentConversationPresentation['appendWaiting']();
      try {
        const value191 = await runtime['confirmPendingPlan']({ displayAnswer: displayAnswer });
        if (agentPanelContinuity['isCurrent'](value190) && el122['parentNode']) onResult(value191);
      } catch (error5) {
        if (!agentPanelContinuity['isCurrent'](value190) || !el122['parentNode']) return;
        agentConversationPresentation['appendMessage']('assistant', error5?.['message'] || 'Agent confirmation failed.');
      } finally {
        agentPanelContinuity['isCurrent'](value190) &&
          el122['parentNode'] &&
          (agentConversationPresentation['removeWaiting'](el122), setBusy(![]));
      }
    }),
    el66['addEventListener']('click', () => {
      if (enabled11) return;
      ((el64['hidden'] = !![]), setBusy(!![]));
      try {
        onResult(runtime['cancelPendingPlan']());
      } finally {
        setBusy(![]);
      }
    }),
    (agentConversationActions = createAgentConversationActions({
      replyActions: replyActions,
      messagesEl: messagesEl,
      runtime: runtime,
      getBusy: () => enabled11,
      setBusy: setBusy,
      getPresentation: () => agentConversationPresentation,
      onResult: onResult,
      setNotice: onNotice,
    })),
    (agentConversationPresentation = createAgentConversationPresentation({
      messagesEl: messagesEl,
      runStepsEl: runStepsEl,
      sessionStore: runtime['sessionStore'],
      getHistory: getHistory,
      onCopy: onCopy,
      onImagePreview: onImagePreview,
      copyIconHtml: agentIconSvg('copy'),
      onMessagesChanged: () => {
        (run40(), agentConversationActions['render']());
        if (!ownerRoot['classList']['contains']('is-open')) agentPanelContinuity['rememberClosed']();
      },
      onConversationInvalidated: ({ historyOnly: historyOnly = ![] } = {}) => {
        if (!historyOnly) return run42({ preserveNotice: !![] });
        (agentConversationPresentation?.['render']({
          history: getHistory(),
          sessionSnapshot: runtime?.['sessionStore']?.['getState']?.() || {},
        }),
          run40());
      },
    })));
  const run50 = onLocaleChange(run15);
  return (
    run42({ restorePendingInputRefs: !![] }),
    {
      panel: ownerRoot,
      sendMessage: (value192) => {
        if (enabled11) return;
        return (setEditorText(slashTrigger, value192), run49());
      },
      open: () => run45(!![]),
      close: () => run45(![]),
      toggle: toggle2,
      collapse: () => run46(!![]),
      expand: () => run46(![]),
      reset: reset,
      setWidth: (value193) => run47(value193, { persist: !![] }),
      destroy: () => {
        (agentPanelContinuity['destroy'](),
          value110?.(),
          run2(),
          bindAgentModelControls2?.['destroy']?.(),
          onCatalogChange['destroy'](),
          agentSkillPanel['destroy'](),
          agentConversationPresentation?.['destroy']?.(),
          agentConversationActions?.['destroy'](),
          run50(),
          run24(),
          args['clearDocuments']({ notify: ![] }),
          run7(),
          document?.['removeEventListener']?.('click', value186),
          document?.['removeEventListener']?.('keydown', value187),
          windowObject?.['removeEventListener']?.('resize', run4),
          fabBtnEl['removeEventListener']('click', value176),
          stateRoot['classList']?.['remove']?.(
            'agent-sidebar-open',
            'agent-sidebar-collapsed',
            'agent-sidebar-resizing',
          ),
          fabBtnEl['classList']?.['remove']?.('is-agent-open'),
          ownerRoot['remove']?.(),
          el60['remove']?.());
      },
    }
  );
}
