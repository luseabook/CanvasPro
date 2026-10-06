import { createPromptPresetTriggerController } from './promptPresetTrigger.js';
import {
  RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
  RH_AUDIO_ADVANCED_VOICE_CLONE_RUNNINGHUB_MODEL_ID,
  getModelManifest,
} from '../manifests/index.js';
import { RH_AUDIO_ADVANCED_VOICE_CLONE_HELP_TOOLTIP } from '../manifests/audio/runninghub/runningHubAudioAdvancedVoiceCloneManifest.js';
import { t } from '../i18n/index.js';
import { translateManifestText } from '../i18n/manifestText.js';
export const ADVANCED_VOICE_CLONE_HELP_TOOLTIP = RH_AUDIO_ADVANCED_VOICE_CLONE_HELP_TOOLTIP;
const HELP_HIGHLIGHT_PATTERN = /\[\[red:([^\]]+)\]\]/g,
  ADVANCED_VOICE_CLONE_ALIASES = [
    RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
    RH_AUDIO_ADVANCED_VOICE_CLONE_RUNNINGHUB_MODEL_ID,
    ...(getModelManifest(RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID)?.subscriptionAliases || []),
    '进阶声音克隆',
  ],
  GENERATION_NODE_HELP_TOOLTIP_MAP = Object.fromEntries(
    ADVANCED_VOICE_CLONE_ALIASES.map((item) => [
      'audio:' + String(item || '').trim(),
      ADVANCED_VOICE_CLONE_HELP_TOOLTIP,
    ]).filter(([value]) => value !== 'audio:'),
  );
function helpTipText(index, result = {}) {
  return t('generationNodeHelpTip.' + index, result);
}
function getHelpConditionFieldValue(options = {}, data = '') {
  const enabled = String(data || '').trim();
  if (!enabled) return undefined;
  const target =
    options?.generationParams && typeof options.generationParams === 'object' ? options.generationParams : {};
  if (Object.prototype.hasOwnProperty.call(target, enabled)) return target[enabled];
  if (Object.prototype.hasOwnProperty.call(options || {}, enabled)) return options[enabled];
  const list = enabled.split('.').filter(Boolean);
  if (list.length <= 1) return undefined;
  let enabled2 = options;
  for (const source of list) {
    if (!enabled2 || typeof enabled2 !== 'object') return undefined;
    enabled2 = enabled2[source];
  }
  return enabled2;
}
function helpConditionMatches(el, next = {}) {
  if (!el || typeof el !== 'object') return false;
  if (Array.isArray(el.any)) return el.any.some((item2) => helpConditionMatches(item2, next));
  if (Array.isArray(el.all)) return el.all.every((item3) => helpConditionMatches(item3, next));
  const enabled3 = String(el.field || '').trim();
  if (!enabled3) return false;
  const helpConditionFieldValue = getHelpConditionFieldValue(next, enabled3),
    list2 = Array.isArray(el.values)
      ? el.values
      : Object.prototype.hasOwnProperty.call(el, 'value')
        ? [el.value]
        : [];
  if (list2.length === 0) return Boolean(helpConditionFieldValue);
  return list2.some(
    (item4) =>
      helpConditionFieldValue === item4 || String(helpConditionFieldValue ?? '') === String(item4 ?? ''),
  );
}
function resolveManifestHelpText(current, entry = {}) {
  const response = current?.help;
  if (!response || typeof response !== 'object') return '';
  const record = Array.isArray(response.variants) ? response.variants : [];
  for (const response2 of record) {
    if (response2 && typeof response2 === 'object' && helpConditionMatches(response2.when, entry)) {
      const payload = String(response2.tooltip || response2.text || '').trim();
      if (payload) return translateManifestText(payload);
    }
  }
  const handle = String(response.tooltip || response.text || '').trim();
  return handle ? translateManifestText(handle) : '';
}
export function getGenerationNodeHelpTooltip({
  kind: kind = '',
  key: key = '',
  model: model = '',
  label: label = '',
  nodeData: nodeData = {},
} = {}) {
  const state = String(kind || '').trim(),
    config = [key, model, label].map((item5) => String(item5 || '').trim()).filter(Boolean);
  for (const scope of config) {
    const modelManifest = getModelManifest(scope),
      manifestHelpText = resolveManifestHelpText(modelManifest, nodeData);
    if (manifestHelpText) return manifestHelpText;
    const input = state ? state + ':' + scope : '',
      output =
        (input && GENERATION_NODE_HELP_TOOLTIP_MAP[input]) || GENERATION_NODE_HELP_TOOLTIP_MAP[scope] || '';
    if (output) return translateManifestText(output);
  }
  return '';
}
export function stripGenerationNodeHelpMarkup(value2 = '') {
  return ((HELP_HIGHLIGHT_PATTERN.lastIndex = 0), String(value2 || '').replace(HELP_HIGHLIGHT_PATTERN, '$1'));
}
export function createGenerationNodeHelpTipController({
  panel: panel,
  getHelpText: getHelpText,
  ariaLabel: ariaLabel = helpTipText('ariaLabel'),
} = {}) {
  let el2 = null,
    el3 = null,
    enabled4 = null;
  const run = () => (typeof getHelpText === 'function' ? String(getHelpText() || '') : ''),
    handler = (el4, value3) => {
      const list3 = String(value3 || '');
      HELP_HIGHLIGHT_PATTERN.lastIndex = 0;
      let value4 = 0,
        value5 = HELP_HIGHLIGHT_PATTERN.exec(list3);
      while (value5) {
        value5.index > value4 && el4.appendChild(document.createTextNode(list3.slice(value4, value5.index)));
        const el5 = document.createElement('span');
        ((el5.className = 'generation-node-help-emphasis'),
          (el5.textContent = value5[1]),
          el4.appendChild(el5),
          (value4 = value5.index + value5[0].length),
          (value5 = HELP_HIGHLIGHT_PATTERN.exec(list3)));
      }
      value4 < list3.length && el4.appendChild(document.createTextNode(list3.slice(value4)));
    },
    handler2 = (el6, value6, value7 = '') => {
      const value8 = document.createElement('div');
      if (value7) value8.className = value7;
      return (handler(value8, value6), el6.appendChild(value8), value8);
    },
    handler3 = (el7, value9, value10) => {
      const el8 = document.createElement('div');
      el8.className = 'generation-node-help-example-line';
      const el9 = document.createElement('span');
      ((el9.className = 'generation-node-help-ref-pill'),
        (el9.textContent = value9),
        el8.appendChild(el9),
        el8.appendChild(document.createTextNode(' ' + value10)),
        el7.appendChild(el8));
    },
    handler4 = (value11, value12) => {
      String(value12 || '')
        .split('\n')
        .forEach((item6, count) => {
          handler2(
            value11,
            item6,
            count === 0 && /用法$/.test(String(item6 || '').trim()) ? 'generation-node-help-title' : '',
          );
        });
    },
    handler5 = (value13 = '') =>
      String(value13 || '')
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((item7) => item7.trim().replace(/^`|`$/g, '')),
    handler6 = (value14 = '') =>
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(String(value14 || '')),
    handler7 = (el10, value15) => {
      const list4 = String(value15 || '').split('\n'),
        count2 = list4.findIndex((item8, count3) => {
          if (count3 === 0 || !handler6(item8)) return false;
          return String(list4[count3 - 1] || '').includes('|');
        });
      if (count2 < 1) return false;
      list4.slice(0, count2 - 1).forEach((item9, count4) => {
        const enabled5 = String(item9 || '').trim();
        if (!enabled5) return;
        handler2(
          el10,
          enabled5,
          count4 === 0 && /用法说明$/.test(enabled5) ? 'generation-node-help-title' : '',
        );
      });
      const el11 = document.createElement('table');
      el11.className = 'generation-node-help-table';
      const el12 = document.createElement('thead'),
        el13 = document.createElement('tr');
      (handler5(list4[count2 - 1]).forEach((item10) => {
        const value16 = document.createElement('th');
        (handler(value16, item10), el13.appendChild(value16));
      }),
        el12.appendChild(el13),
        el11.appendChild(el12));
      const el14 = document.createElement('tbody');
      return (
        list4.slice(count2 + 1).forEach((item11) => {
          if (!String(item11 || '').includes('|')) return;
          const el15 = document.createElement('tr');
          (handler5(item11).forEach((item12) => {
            const value17 = document.createElement('td');
            (handler(value17, item12), el15.appendChild(value17));
          }),
            el14.appendChild(el15));
        }),
        el11.appendChild(el14),
        el10.appendChild(el11),
        true
      );
    },
    handler8 = (el16, value18) => {
      ((el16.textContent = ''), el16.classList.remove('has-table'));
      if (handler7(el16, value18)) {
        el16.classList.add('has-table');
        return;
      }
      if (value18 !== ADVANCED_VOICE_CLONE_HELP_TOOLTIP) {
        handler4(el16, value18);
        return;
      }
      (handler2(el16, helpTipText('advancedVoiceClone.title'), 'generation-node-help-title'),
        handler2(el16, helpTipText('advancedVoiceClone.duration')),
        handler2(el16, helpTipText('advancedVoiceClone.noAudio')),
        handler2(el16, helpTipText('advancedVoiceClone.promptExample'), 'generation-node-help-muted-line'),
        handler2(el16, helpTipText('advancedVoiceClone.oneAudio')),
        handler2(el16, helpTipText('advancedVoiceClone.twoAudio')),
        handler2(el16, helpTipText('advancedVoiceClone.examples')),
        handler3(
          el16,
          helpTipText('advancedVoiceClone.audio1'),
          helpTipText('advancedVoiceClone.exampleSpeaker1'),
        ),
        handler3(
          el16,
          helpTipText('advancedVoiceClone.audio2'),
          helpTipText('advancedVoiceClone.exampleSpeaker2'),
        ));
      return;
      (handler2(el16, '进阶声音克隆用法', 'generation-node-help-title'),
        handler2(el16, '支持 [[red:3~15 秒音频]]'),
        handler2(el16, '[[red:无音频入参]]时 TTS语音 根据提示词生成随机音色'),
        handler2(el16, '例：今晚月色真好', 'generation-node-help-muted-line'),
        handler2(el16, '[[red:1个音频入参]]时 克隆语音'),
        handler2(el16, '[[red:2个音频入参]]时 多人克隆音色对话'),
        handler2(el16, '例：'),
        handler3(el16, '@音频1', '你今晚回家吗'),
        handler3(el16, '@音频2', '不回了加班要忙到很晚'));
    },
    handler9 = () => {
      if (!panel) return null;
      if (el2 && el2.parentNode === panel) return el2;
      const value19 = panel.querySelector('.generation-node-help-tip');
      if (value19) return ((el2 = value19), value19);
      const el17 = document.createElement('button');
      return (
        (el17.type = 'button'),
        (el17.className = 'rh-tip generation-node-help-tip'),
        (el17.textContent = '!'),
        el17.setAttribute('aria-label', ariaLabel),
        el17.addEventListener('mouseenter', value20),
        el17.addEventListener('mouseleave', handler10),
        el17.addEventListener('focus', value20),
        el17.addEventListener('blur', handler10),
        el17.addEventListener('click', (event) => {
          (event.preventDefault(), event.stopPropagation());
        }),
        el17.addEventListener('pointerdown', (event2) => {
          (event2.preventDefault(), event2.stopPropagation());
        }),
        panel.appendChild(el17),
        (el2 = el17),
        el17
      );
    },
    handler11 = () => {
      if (el3?.isConnected) return el3;
      const el18 = document.createElement('div');
      return (
        (el18.className = 'generation-node-help-tooltip-portal'),
        el18.setAttribute('role', 'tooltip'),
        document.body.appendChild(el18),
        (el3 = el18),
        el18
      );
    },
    handler12 = () => {
      if (!el2 || !el3) return;
      const value21 = 12,
        box = el2.getBoundingClientRect(),
        value22 = el3.offsetWidth || 340,
        value23 = el3.offsetHeight || 0,
        value24 = Math.max(value21, window.innerWidth - value22 - value21),
        value25 = box.right - value22 + 6,
        value26 = Math.min(Math.max(value21, value25), value24),
        value27 = box.top - value23 - value21,
        value28 = box.bottom + value21,
        value29 = value27 < value21,
        value30 = value29 ? value28 : value27,
        value31 = Math.min(Math.max(box.left + box.width / 2 - value26, 16), value22 - 16);
      ((el3.style.left = value26 + 'px'),
        (el3.style.top = value30 + 'px'),
        el3.classList.toggle('is-below', value29),
        el3.style.setProperty('--generation-node-help-tooltip-arrow-left', value31 + 'px'));
    },
    value20 = () => {
      const enabled6 = run();
      if (!enabled6 || el2?.classList.contains('is-hidden')) return;
      const el19 = handler11();
      (handler8(el19, enabled6),
        el19.classList.add('is-open'),
        handler12(),
        !enabled4 &&
          ((enabled4 = () => handler12()),
          window.addEventListener('scroll', enabled4, true),
          window.addEventListener('resize', enabled4)));
    },
    handler10 = () => {
      el3?.classList.remove('is-open');
      if (!enabled4) return;
      (window.removeEventListener('scroll', enabled4, true),
        window.removeEventListener('resize', enabled4),
        (enabled4 = null));
    },
    sync = () => {
      const el20 = el2 || handler9();
      if (!el20) return;
      const value32 = run(),
        enabled7 = Boolean(value32);
      el20.classList.toggle('is-hidden', !enabled7);
      enabled7
        ? el20.setAttribute('data-tooltip', stripGenerationNodeHelpMarkup(value32))
        : el20.removeAttribute('data-tooltip');
      panel?.classList.toggle('has-generation-node-help-tip', enabled7);
      if (!enabled7) handler10();
    },
    remove = () => {
      (handler10(), el3?.remove(), (el3 = null));
    };
  return { sync: sync, remove: remove };
}
export function attachGenerationNodeHelpTip(
  enabled8,
  {
    panel: panel2,
    kind: kind2,
    getKey: getKey,
    getModel: getModel = getKey,
    getLabel: getLabel,
    getNodeData: getNodeData,
    ariaLabel: ariaLabel2,
  } = {},
) {
  if (!enabled8 || !panel2) return null;
  return (
    (enabled8._generationNodeHelpTip = createGenerationNodeHelpTipController({
      panel: panel2,
      getHelpText: () =>
        getGenerationNodeHelpTooltip({
          kind: kind2,
          key: typeof getKey === 'function' ? getKey() : '',
          model: typeof getModel === 'function' ? getModel() : '',
          label: typeof getLabel === 'function' ? getLabel() : '',
          nodeData: typeof getNodeData === 'function' ? getNodeData() : {},
        }),
      ariaLabel: ariaLabel2,
    })),
    enabled8._generationNodeHelpTip.sync(),
    enabled8._generationNodeHelpTip
  );
}

const GENERATION_NODE_HELP_ICON_HTML =
  '<span class="generation-node-help-tip-icon" aria-hidden="true"></span>';

export function attachGenerationNodePromptTools(enabled9, enabled10 = {}) {
  if (!enabled9 || !enabled10?.panel) return null;
  return (
    enabled9._promptPresetTrigger?.remove?.(),
    (enabled9._promptPresetTrigger = createPromptPresetTriggerController({
      panel: enabled10.panel,
      getPromptEl: () => enabled9.promptEl,
      getNodeType: () => enabled9._data?.type,
      getNodeId: () => enabled9.nodeId,
      onGenerate: (value33, value34) => enabled9._onGenerate?.(value33, value34),
    })),
    attachGenerationNodeHelpTip(enabled9, enabled10)
  );
}
