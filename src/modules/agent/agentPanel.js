import {
  buildTextModelSmallIconHTML,
  buildTextProviderMenuGroupsHTML,
  findTextModelMenuItem,
} from '../../components/aigenText/apimartTextModelMenu.js';
import { createPromptAttachmentButtonHTML } from '../../components/refAttachmentButton.js';
import { bindNodeSubmenus, closeNodeFooterMenus } from '../../components/shared/nodeFooterControls.js';
import { getLocale } from '../../i18n/index.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { createLinkCursor, getCursorSize } from '../cursorUtils.js';
const AGENT_QUICK_ACTIONS = Object.freeze([
    {
      id: 'archive-assets',
      label: '将现有素材汇总归档',
      prompt: '请将画布上的现有素材汇总归档，并说明每个节点的用途。',
    },
    {
      id: 'check-style',
      label: '检查视觉风格一致性',
      prompt: '请检查当前画布的视觉风格是否一致，并给出调整建议。',
    },
    { id: 'explain-flow', label: '梳理当前创作逻辑', prompt: '请梳理当前画布的创作逻辑和节点关系。' },
  ]),
  PLACEHOLDER_ACTION_MESSAGES = Object.freeze({
    canvas: '从当前画布选中节点添加素材入参。',
    upload: '上传素材后会作为本次 Agent 入参。',
    custom: '将当前输入保存为自定义快捷卡片。',
  }),
  AGENT_PANEL_WIDTH_STORAGE_KEY = 'aiCanvas.agentSidebarWidth.v1',
  AGENT_CUSTOM_QUICK_ACTIONS_STORAGE_KEY = 'aiCanvas.agentCustomQuickActions.v1',
  AGENT_PANEL_WIDTH_LIMITS = Object.freeze({ min: 0x230, max: 0x35c }),
  AGENT_INPUT_REF_LIMIT = 12,
  AGENT_CUSTOM_QUICK_ACTION_LIMIT = 8,
  PANEL_TEXT = Object.freeze({
    'zh-CN': Object.freeze({
      actionsPrepared: '已完成准备步骤。',
      addReference: '添加画布内容 / 引用参考',
      attachSelected: '已添加 {count} 个素材入参。',
      attachSelectedEmpty: '先在画布选中素材节点，再添加为入参。',
      materialPickStarted: '请选择画布上的素材节点作为 Agent 入参。',
      materialPickCancelled: '已退出素材拾取。',
      materialPickUnsupported: '请选择图片、视频、音频或文本素材节点。',
      completed: '已完成',
      confirmUserMessage: '确定',
      confirmTitle: '请确认',
      generate: '开始生成',
      graphConnect: '连接节点',
      layoutAlign: '对齐节点',
      layoutArrangeRow: '横向排列节点',
      nodeCreate: '创建节点',
      nodeCreateImage: '创建图片节点',
      nodeCreateVideo: '创建视频节点',
      nodeCreateAudio: '创建音频节点',
      nodeCreateText: '创建文本节点',
      nodeDelete: '删除节点',
      nodeSetParams: '设置生成参数',
      nodeSetPrompt: '写入提示词',
      pending: '待确认',
      model: '使用模型',
      prompt: 'Prompt 摘要',
      params: '参数',
      inputSource: '输入来源',
      traceSummary: '策略摘要',
      noParams: '无',
      recoveryTitle: '可以这样恢复',
      recoveryEditPromptDraft: '请修改刚才失败的生成提示词：',
      recoveryChangeModelDraft: '请为刚才失败的生成换一个模型：',
      recoveryEditPromptNotice: '已进入重新规划：修改提示词后发送。',
      recoveryChangeModelNotice: '已进入重新规划：写明想换的模型后发送。',
      historyTitle: '历史记录',
      historyEmpty: '当前项目还没有历史对话',
      historyDelete: '删除对话',
      unfinishedNotice: '上次有未完成操作，请重新发送或重新规划。',
      uploadMaterial: '上传素材',
      uploadMaterialFailed: '上传素材失败，请稍后重试。',
      uploadMaterialMissing: '上传素材入口暂不可用。',
      uploadMaterialReady: '已上传并添加为素材入参。',
      customShortcutEmpty: '先在输入框写好提示词，再保存为自定义快捷卡片。',
      customShortcutSaved: '已保存为自定义快捷卡片。',
      waiting: '正在思考',
    }),
    'en-US': Object.freeze({
      actionsPrepared: 'Preparation is complete.',
      addReference: 'Add canvas context / references',
      attachSelected: 'Added {count} material reference(s).',
      attachSelectedEmpty: 'Select canvas material nodes before adding references.',
      materialPickStarted: 'Pick a canvas material node to use as Agent input.',
      materialPickCancelled: 'Material picking cancelled.',
      materialPickUnsupported: 'Pick an image, video, audio, or text material node.',
      completed: 'Completed',
      confirmUserMessage: 'Confirm',
      confirmTitle: 'Confirm',
      generate: 'Start generation',
      graphConnect: 'Connect nodes',
      layoutAlign: 'Align nodes',
      layoutArrangeRow: 'Arrange nodes horizontally',
      nodeCreate: 'Create node',
      nodeCreateImage: 'Create image node',
      nodeCreateVideo: 'Create video node',
      nodeCreateAudio: 'Create audio node',
      nodeCreateText: 'Create text node',
      nodeDelete: 'Delete node',
      nodeSetParams: 'Set generation parameters',
      nodeSetPrompt: 'Set prompt',
      pending: 'Pending confirmation',
      model: 'Model',
      prompt: 'Prompt summary',
      params: 'Parameters',
      inputSource: 'Input source',
      traceSummary: 'Policy summary',
      noParams: 'None',
      recoveryTitle: 'Recovery options',
      recoveryEditPromptDraft: 'Revise the failed generation prompt: ',
      recoveryChangeModelDraft: 'Switch the failed generation to another model: ',
      recoveryEditPromptNotice: 'Replanning draft is ready. Edit the prompt and send.',
      recoveryChangeModelNotice: 'Replanning draft is ready. Name the model you want and send.',
      historyTitle: 'History',
      historyEmpty: 'No conversation history in this project yet.',
      historyDelete: 'Delete conversation',
      unfinishedNotice: 'The last operation was not completed. Please resend or replan.',
      uploadMaterial: 'Upload material',
      uploadMaterialFailed: 'Material upload failed. Please try again.',
      uploadMaterialMissing: 'Material upload is unavailable.',
      uploadMaterialReady: 'Uploaded and added as a material reference.',
      customShortcutEmpty: 'Write a prompt first, then save it as a custom shortcut.',
      customShortcutSaved: 'Saved as a custom shortcut.',
      waiting: 'Thinking',
    }),
  });
function normalizePanelLocale(locale = getLocale()) {
  return String(locale || '')
    .toLowerCase()
    .startsWith('en')
    ? 'en-US'
    : 'zh-CN';
}
function panelText(value, locale2 = getLocale()) {
  const panelLocale = normalizePanelLocale(locale2);
  return PANEL_TEXT[panelLocale]?.[value] || PANEL_TEXT['zh-CN'][value] || value;
}
function formatPanelText(item, key = {}, locale3 = getLocale()) {
  return panelText(item, locale3).replace(/\{(\w+)\}/g, (index, result) =>
    key[result] == null ? '' : String(key[result]),
  );
}
function createEl(data, options = '', target = '') {
  const el = document.createElement(data);
  if (options) el.className = options;
  if (target) el.textContent = target;
  return el;
}
function createButton(
  next,
  current,
  { title: title = '', icon: icon = '', disabled: disabled = false } = {},
) {
  const el2 = createEl('button', next);
  el2.type = 'button';
  title && ((el2.title = title), el2.setAttribute('aria-label', title));
  if (icon) {
    el2.innerHTML = icon;
    if (current) {
      const el3 = createEl('span', 'agent-btn-label', current);
      el2.appendChild(el3);
    }
  } else el2.textContent = current;
  el2.disabled = disabled;
  if (disabled) el2.setAttribute('aria-disabled', 'true');
  return el2;
}
function iconSvg(entry) {
  const record =
      'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    payload = {
      collapse: '<rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M10 4v16"></path>',
      plus: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
      history:
        '<path d="M21 12a9 9 0 1 1-3-6.7"></path><path d="M21 3v6h-6"></path><path d="M12 7v5l3 2"></path>',
      close: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
      send: '<path d="M12 19V5"></path><path d="m5 12 7-7 7 7"></path>',
      cursor: '<path d="m4 4 7.5 16 2.5-6 6-2.5L4 4Z"></path>',
      grid: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>',
      scan: '<path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M8 21H5a2 2 0 0 1-2-2v-3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path><path d="M9 12h6"></path>',
      flow: '<path d="M6 3v6"></path><path d="M18 15v6"></path><circle cx="6" cy="15" r="3"></circle><circle cx="18" cy="9" r="3"></circle><path d="M9 15h3a3 3 0 0 0 3-3V9"></path>',
      model: '<path d="M13 2 3 14h8l-1 8 11-14h-8l0-6Z"></path>',
      mode: '<path d="M12 2v4"></path><path d="M12 18v4"></path><path d="m4.93 4.93 2.83 2.83"></path><path d="m16.24 16.24 2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="m4.93 19.07 2.83-2.83"></path><path d="m16.24 7.76 2.83-2.83"></path>',
      check: '<path d="m20 6-11 11-5-5"></path>',
      upload: '<path d="M12 16V4"></path><path d="m7 9 5-5 5 5"></path><path d="M20 20H4"></path>',
      wand: '<path d="M15 4V2"></path><path d="M15 10v-2"></path><path d="M12 5h2"></path><path d="M18 5h-2"></path><path d="m5 19 14-14"></path><path d="m9 15-4-4"></path>',
    };
  return '<svg class="agent-icon" width="18" height="18" ' + record + '>' + (payload[entry] || '') + '</svg>';
}
function createAgentPromptAttachmentButton({ title: title = '', className: className = '' } = {}) {
  const el4 = document.createElement('div');
  el4.innerHTML = createPromptAttachmentButtonHTML({
    tooltip: title,
    stroke: 'currentColor',
    fill: 'var(--white-05)',
    circleFill: 'currentColor',
  });
  const el5 = el4.firstElementChild;
  if (el5)
    return (
      className
        .split(/\s+/)
        .filter(Boolean)
        .forEach((item2) => el5.classList.add(item2)),
      el5.setAttribute('role', 'button'),
      (el5.tabIndex = 0),
      el5
    );
  const el6 = createEl('div', ['prompt-attachment-btn', className].filter(Boolean).join(' '));
  title && ((el6.title = title), el6.setAttribute('aria-label', title));
  (el6.setAttribute('role', 'button'), (el6.tabIndex = 0));
  const el7 = createEl('span', 'btn-icon');
  return (
    (el7.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z" fill="var(--white-05)" /><circle cx="20" cy="20" r="2.5" fill="currentColor" /><path d="M12 12 Q 17 12 19 18" stroke-dasharray="3 3" /></svg>'),
    el6.appendChild(el7),
    el6
  );
}
function appendMessage(el8, handle, state) {
  const config = String(handle || '') === 'user' ? 'user' : 'assistant',
    el9 = createEl('div', 'agent-message agent-message--' + config);
  ((el9.textContent = String(state || '')), el8.appendChild(el9), (el8.scrollTop = el8.scrollHeight));
}
function renderMessages(scope, list = []) {
  (scope.replaceChildren(),
    list.forEach((response) => {
      appendMessage(scope, response.role, response.content || response.status || '');
    }));
}
function appendWaitingMessage(el10) {
  const el11 = createEl('div', 'agent-message agent-message--assistant agent-message--typing'),
    el12 = createEl('span', 'agent-typing-label', panelText('waiting')),
    el13 = createEl('span', 'agent-typing-dots');
  return (
    el13.append(createEl('span'), createEl('span'), createEl('span')),
    el11.append(el12, el13),
    el10.appendChild(el11),
    (el10.scrollTop = el10.scrollHeight),
    el11
  );
}
function removeWaitingMessage(el14) {
  if (!el14?.parentNode) return;
  if (typeof el14.remove === 'function') {
    el14.remove();
    return;
  }
  const el15 = el14.parentNode,
    count = el15.children?.indexOf?.(el14) ?? -1;
  if (count >= 0) el15.children.splice(count, 1);
  el14.parentNode = null;
}
function setEditorText(el16, input = '') {
  ((el16.textContent = String(input || '')), el16.dispatchEvent?.(new Event('input', { bubbles: true })));
}
function getEditorText(el17) {
  return String(el17?.innerText || el17?.textContent || '').trim();
}
function truncateUiText(output, value2 = 40) {
  const list2 = String(output || '')
    .replace(/\s+/g, ' ')
    .trim();
  return list2.length <= value2 ? list2 : list2.slice(0, Math.max(0, value2 - 3)) + '...';
}
function readJsonArrayFromStorage(value3, value4) {
  try {
    const value5 = value3?.localStorage?.getItem?.(value4),
      value6 = value5 ? JSON.parse(value5) : [];
    return Array.isArray(value6) ? value6 : [];
  } catch {
    return [];
  }
}
function writeJsonArrayToStorage(value7, value8, value9) {
  try {
    value7?.localStorage?.setItem?.(value8, JSON.stringify(value9));
  } catch {}
}
function normalizeQuickAction(custom = {}, value10 = '') {
  const prompt = String(custom.prompt || '').trim();
  if (!prompt) return null;
  const id = String(custom.id || value10 || '').trim() || 'custom-' + Date.now();
  return {
    id: id,
    label: truncateUiText(custom.label || prompt, 28),
    prompt: prompt,
    custom: custom.custom === true,
  };
}
function readCustomQuickActions(value11 = globalThis.window) {
  return readJsonArrayFromStorage(value11, AGENT_CUSTOM_QUICK_ACTIONS_STORAGE_KEY)
    .map((item3, value12) => normalizeQuickAction(item3, 'custom-' + value12))
    .filter(Boolean)
    .slice(0, AGENT_CUSTOM_QUICK_ACTION_LIMIT);
}
function writeCustomQuickActions(list3 = [], value13 = globalThis.window) {
  const value14 = list3
    .map((item4, value15) => normalizeQuickAction(item4, 'custom-' + value15))
    .filter(Boolean)
    .slice(0, AGENT_CUSTOM_QUICK_ACTION_LIMIT);
  return (writeJsonArrayToStorage(value13, AGENT_CUSTOM_QUICK_ACTIONS_STORAGE_KEY, value14), value14);
}
function inferAgentInputKind(value16 = '') {
  const list4 = String(value16 || '').trim();
  if (list4.includes('image')) return 'image';
  if (list4.includes('video')) return 'video';
  if (list4.includes('audio')) return 'audio';
  if (list4.includes('text')) return 'text';
  return list4 || 'node';
}
function normalizeRenderableThumbUrl(value17) {
  const list5 = String(value17 || '').trim();
  if (!list5) return '';
  if (/^https?:\/\//i.test(list5) || list5.startsWith('/')) return list5;
  if (/^data:image\//i.test(list5) && list5.length <= 0xc350) return list5;
  return localPathToUrl(list5) || '';
}
function resolveAgentInputRefThumbUrl(options2 = {}) {
  const value18 = [
    options2.thumbUrl,
    options2.posterUrl,
    options2.videoThumbSrc,
    options2.imageUrl,
    options2.src,
    options2.coverUrl,
    options2.waveformUrl,
    options2.thumbLocalPath,
    options2.posterLocalPath,
    options2.displayLocalPath,
    options2.localPath,
    options2.originalLocalPath,
    options2.waveformLocalPath,
  ];
  for (const value19 of value18) {
    const renderableThumbUrl = normalizeRenderableThumbUrl(value19);
    if (renderableThumbUrl) return renderableThumbUrl;
  }
  return '';
}
function normalizeAgentInputRefFromNode(box = {}, { source: source = 'canvas' } = {}) {
  const id2 = String(box.id || box.nodeId || '').trim();
  if (!id2) return null;
  const type = String(box.type || '').trim(),
    kind = inferAgentInputKind(type),
    name = truncateUiText(box.name || box.label || box.title || id2, 60),
    count2 = Number(box.width),
    count3 = Number(box.height),
    box2 = {
      id: id2,
      nodeId: id2,
      type: type,
      kind: kind,
      name: name,
      label: name,
      source: source,
      thumbUrl: resolveAgentInputRefThumbUrl(box),
    };
  if (Number.isFinite(count2) && count2 > 0) box2.width = Math.round(count2);
  if (Number.isFinite(count3) && count3 > 0) box2.height = Math.round(count3);
  return box2;
}
function isAgentMaterialRef(options3 = {}) {
  return ['image', 'video', 'audio', 'text'].includes(String(options3.kind || ''));
}
function getStoreState(store2) {
  return store2?.getStateRaw?.() || store2?.getState?.() || {};
}
function clampAgentSidebarWidth(value20, value21 = globalThis.window?.innerWidth) {
  const value22 = Number(value20),
    value23 = Number.isFinite(Number(value21))
      ? Math.max(0x140, Number(value21) - 24)
      : AGENT_PANEL_WIDTH_LIMITS.max,
    value24 = Math.min(AGENT_PANEL_WIDTH_LIMITS.max, value23),
    value25 = Math.min(AGENT_PANEL_WIDTH_LIMITS.min, value24);
  return Math.max(value25, Math.min(value24, value22));
}
function readStoredSidebarWidth(value26 = globalThis.window) {
  const count4 = Number(value26?.localStorage?.getItem?.(AGENT_PANEL_WIDTH_STORAGE_KEY));
  return Number.isFinite(count4) && count4 > 0 ? count4 : null;
}
function writeStoredSidebarWidth(value27, value28 = globalThis.window) {
  try {
    value28?.localStorage?.setItem?.(AGENT_PANEL_WIDTH_STORAGE_KEY, String(Math.round(value27)));
  } catch {}
}
export function normalizeAgentSidebarWidth(value29, value30) {
  return clampAgentSidebarWidth(value29, value30);
}
export function normalizeAgentExecutionMode(value31) {
  return String(value31 || '').trim() === 'auto' ? 'auto' : 'manual';
}
export function getAgentExecutionModeLabel(value32) {
  return normalizeAgentExecutionMode(value32) === 'auto' ? '自动执行' : '手动确认';
}
export function getAgentPlaceholderActionMessage(value33) {
  return PLACEHOLDER_ACTION_MESSAGES[value33] || '该入口会在后续接入。';
}
export function resolveAgentModelLabel(value34) {
  const enabled = String(value34 || '').trim();
  if (!enabled) return '模型选择';
  return findTextModelMenuItem(enabled)?.title || enabled;
}
export function commitAgentModelSelection(value35, value36 = {}) {
  const model2 = String(value36.model || value36.modelId || '').trim(),
    provider2 = String(value36.provider || '').trim();
  if (!model2) return null;
  return (
    value35?.updateSettings?.({ model: model2, provider: provider2 }) || {
      model: model2,
      provider: provider2,
    }
  );
}
function getCreateActionLabel(value37) {
  const value38 = String(value37 || '');
  if (value38 === 'ai-image') return panelText('nodeCreateImage');
  if (value38 === 'ai-video') return panelText('nodeCreateVideo');
  if (value38 === 'ai-audio') return panelText('nodeCreateAudio');
  if (value38 === 'ai-text' || value38 === 'source-text') return panelText('nodeCreateText');
  return panelText('nodeCreate');
}
function formatActionSummary(options4 = {}) {
  if (options4.label) {
    const list6 = [];
    if (options4.promptSummary) list6.push('“' + options4.promptSummary + '”');
    if (Number.isFinite(Number(options4.args?.gap))) list6.push('间距 ' + Number(options4.args.gap));
    return list6.length ? options4.label + '：' + list6.join('，') : options4.label;
  }
  const value39 = String(options4.type || ''),
    response2 = options4.args || {},
    value40 =
      value39 === 'node.create'
        ? getCreateActionLabel(response2.type)
        : value39 === 'node.setPrompt' || value39 === 'node.appendPrompt'
          ? panelText('nodeSetPrompt')
          : value39 === 'node.setParams'
            ? panelText('nodeSetParams')
            : value39 === 'graph.connect'
              ? panelText('graphConnect')
              : value39 === 'layout.arrangeRow'
                ? panelText('layoutArrangeRow')
                : value39 === 'layout.align'
                  ? panelText('layoutAlign')
                  : value39 === 'generation.run'
                    ? panelText('generate')
                    : value39 === 'node.delete'
                      ? panelText('nodeDelete')
                      : value39,
    list7 = [],
    value41 = response2.prompt || response2.text;
  if (value41) list7.push('“' + String(value41).slice(0, 36) + '”');
  if (Number.isFinite(Number(response2.gap))) list7.push('间距 ' + Number(response2.gap));
  return list7.length ? value40 + '：' + list7.join('，') : value40;
}
function formatParamValue(value42) {
  if (value42 == null || value42 === '') return '';
  if (typeof value42 === 'string' || typeof value42 === 'number' || typeof value42 === 'boolean')
    return String(value42);
  try {
    return JSON.stringify(value42);
  } catch {
    return String(value42);
  }
}
function formatParams(options5 = {}) {
  const list8 =
    options5 && typeof options5 === 'object' && !Array.isArray(options5) ? Object.entries(options5) : [];
  if (list8.length === 0) return panelText('noParams');
  return list8
    .slice(0, 8)
    .map(([value43, value44]) => value43 + ': ' + formatParamValue(value44))
    .join('，');
}
function renderActionGroup(el18, value45, list9 = []) {
  if (!Array.isArray(list9) || list9.length === 0) return;
  const el19 = createEl('div', 'agent-plan-group');
  el19.appendChild(createEl('div', 'agent-plan-group-title', value45));
  const el20 = createEl('div', 'agent-plan-list');
  (list9.forEach((item5) => {
    el20.appendChild(createEl('div', 'agent-plan-item', formatActionSummary(item5)));
  }),
    el19.appendChild(el20),
    el18.appendChild(el19));
}
function renderTraceSummary(el21, value46, list10 = []) {
  if (!Array.isArray(list10) || list10.length === 0) return;
  const el22 = createEl('div', 'agent-plan-group');
  el22.appendChild(createEl('div', 'agent-plan-group-title', value46));
  const el23 = createEl('div', 'agent-plan-list');
  (list10.forEach((item6) => {
    el23.appendChild(createEl('div', 'agent-plan-item', item6));
  }),
    el22.appendChild(el23),
    el21.appendChild(el22));
}
function renderPlanPreview(el24, enabled2) {
  el24.replaceChildren();
  if (!enabled2) {
    el24.hidden = true;
    return;
  }
  const enabled3 = enabled2.confirmationSummary || null,
    list11 = Array.isArray(enabled2.actions) ? enabled2.actions : [];
  if (!enabled3 && list11.length === 0) {
    el24.hidden = true;
    return;
  }
  el24.hidden = false;
  const el25 = createEl('div', 'agent-plan-title', panelText('confirmTitle')),
    el26 = createEl('div', 'agent-plan-body');
  if (enabled3) {
    (renderActionGroup(el26, panelText('completed'), enabled3.completedActions || []),
      renderActionGroup(el26, panelText('pending'), enabled3.pendingActions || []),
      renderTraceSummary(el26, panelText('traceSummary'), enabled3.debugTraceSummary || []));
    if (enabled3.generation) {
      const el27 = createEl('div', 'agent-plan-meta');
      ([
        [panelText('model'), enabled3.generation.modelLabel || enabled3.generation.model || ''],
        [panelText('prompt'), enabled3.generation.promptSummary || ''],
        [panelText('params'), formatParams(enabled3.generation.params)],
        [panelText('inputSource'), enabled3.generation.inputSource || ''],
      ].forEach(([value47, enabled4]) => {
        if (!enabled4) return;
        const el28 = createEl('div', 'agent-plan-meta-row');
        (el28.append(
          createEl('span', 'agent-plan-meta-label', value47),
          createEl('span', 'agent-plan-meta-value', enabled4),
        ),
          el27.appendChild(el28));
      }),
        el26.appendChild(el27));
    }
    enabled3.cancelNotice && el26.appendChild(createEl('div', 'agent-plan-notice', enabled3.cancelNotice));
  } else {
    const el29 = createEl('div', 'agent-plan-list');
    (list11.forEach((item7) => {
      el29.appendChild(createEl('div', 'agent-plan-item', formatActionSummary(item7)));
    }),
      el26.appendChild(el29));
  }
  el24.append(el25, el26);
}
function renderClarification(
  el30,
  value48,
  value49,
  handler,
  value50 = null,
  {
    onAnswer: onAnswer = null,
    onWaitingStart: onWaitingStart = null,
    onWaitingEnd: onWaitingEnd = null,
  } = {},
) {
  el30.replaceChildren();
  const list12 = Array.isArray(value48?.options) ? value48.options : [];
  el30.hidden = list12.length === 0;
  for (const value51 of list12) {
    const el31 = createEl('button', 'agent-option-btn', value51.label);
    ((el31.type = 'button'),
      el31.addEventListener('click', async () => {
        const displayAnswer = String(value51.label || value51.id || '').trim();
        (onAnswer?.(displayAnswer), (el30.hidden = true));
        const value52 = onWaitingStart?.();
        value50?.(true);
        try {
          const value53 = await value49.answerClarification(value51.id, { displayAnswer: displayAnswer });
          handler(value53);
        } catch (reply2) {
          handler({
            ok: false,
            status: 'failed',
            reply: reply2?.message || 'Agent clarification failed.',
          });
        } finally {
          (onWaitingEnd?.(value52), value50?.(false));
        }
      }),
      el30.appendChild(el31));
  }
}
function renderRecovery(
  el32,
  value54,
  value55,
  handler2,
  value56 = null,
  { editor: editor = null, setNotice: setNotice = null } = {},
) {
  el32.replaceChildren();
  const value57 = value54?.recovery || null,
    list13 = Array.isArray(value57?.options) ? value57.options : [];
  el32.hidden = list13.length === 0;
  if (list13.length === 0) return;
  el32.appendChild(createEl('div', 'agent-recovery-title', panelText('recoveryTitle')));
  const el33 = createEl('div', 'agent-recovery-actions');
  for (const value58 of list13) {
    const el34 = createEl('button', 'agent-recovery-btn', value58.label || value58.id);
    ((el34.type = 'button'),
      (el34.dataset.recoveryAction = value58.id),
      el34.addEventListener('click', async () => {
        const value59 = String(value58.id || '');
        if (value59 === 'editPrompt') {
          (setEditorText(editor, panelText('recoveryEditPromptDraft')),
            editor?.focus?.(),
            setNotice?.(panelText('recoveryEditPromptNotice')),
            (el32.hidden = true));
          return;
        }
        if (value59 === 'changeModel') {
          (setEditorText(editor, panelText('recoveryChangeModelDraft')),
            editor?.focus?.(),
            setNotice?.(panelText('recoveryChangeModelNotice')),
            (el32.hidden = true));
          return;
        }
        value56?.(true);
        try {
          const value60 =
            value59 === 'keepPrepared'
              ? await value55.keepPreparedPlan?.()
              : await value55.retryFailedPlan?.();
          handler2(value60 || { ok: false, status: 'failed', reply: 'Recovery failed.' });
        } catch (reply3) {
          handler2({
            ok: false,
            status: 'failed',
            reply: reply3?.message || 'Agent recovery failed.',
          });
        } finally {
          value56?.(false);
        }
      }),
      el33.appendChild(el34));
  }
  el32.appendChild(el33);
}
function formatHistoryTime(value61) {
  const value62 = new Date(Number(value61) || Date.now());
  return value62.toLocaleString(getLocale(), {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function getLastMessageSummary(options6 = {}) {
  const list14 = Array.isArray(options6.messages) ? options6.messages : [],
    value63 = list14[list14.length - 1] || null;
  return String(value63?.content || options6.lastPlanSummary || options6.title || '').trim();
}
function renderHistory(value64, value65, { onSelect: onSelect = null, onDelete: onDelete = null } = {}) {
  value64.replaceChildren();
  const el35 = createEl('div', 'agent-history-title', panelText('historyTitle')),
    list15 = value65?.listConversations?.() || [],
    value66 = value65?.getActiveConversation?.() || null;
  if (!list15.length) {
    value64.append(el35, createEl('div', 'agent-history-empty', panelText('historyEmpty')));
    return;
  }
  const el36 = createEl('div', 'agent-history-list');
  (list15.forEach((item8) => {
    const el37 = createEl('div', 'agent-history-item');
    ((el37.dataset.conversationId = item8.id), el37.classList.toggle('is-active', item8.id === value66?.id));
    const el38 = createEl('button', 'agent-history-main');
    ((el38.type = 'button'),
      el38.append(
        createEl('span', 'agent-history-name', item8.title || '新对话'),
        createEl('span', 'agent-history-time', formatHistoryTime(item8.updatedAt)),
        createEl('span', 'agent-history-content', getLastMessageSummary(item8)),
      ),
      el38.addEventListener('click', () => onSelect?.(item8.id)));
    const el39 = createButton('agent-history-delete', panelText('historyDelete'), {
      title: panelText('historyDelete'),
    });
    (el39.addEventListener('click', (event) => {
      (event.preventDefault?.(), event.stopPropagation?.(), onDelete?.(item8.id));
    }),
      el37.append(el38, el39),
      el36.appendChild(el37));
  }),
    value64.append(el35, el36));
}
function updateModelTrigger(el40, value67 = {}) {
  const value68 = value67.model || '',
    el41 = el40.querySelector('.agent-model-label'),
    el42 = el40.querySelector('.agent-model-icon-slot');
  if (el41) el41.textContent = resolveAgentModelLabel(value68);
  el42 && (el42.innerHTML = buildTextModelSmallIconHTML(value68) || iconSvg('model'));
}
function closeFloatingMenus(el43, enabled5 = null) {
  el43?.querySelectorAll?.('.agent-floating-menu.show, .agent-model-menu.show')?.forEach((el44) => {
    if (el44 !== enabled5) el44.classList.remove('show');
  });
  if (!enabled5) closeNodeFooterMenus(el43);
}
function setMenuOpen(el45, value69, value70) {
  (closeFloatingMenus(value70, value69 ? el45 : null), el45?.classList.toggle('show', value69));
}
function isAgentMenuSurface(el46) {
  return !!el46?.closest?.('.agent-menu-wrap, .agent-floating-menu, .agent-model-menu');
}
export function initAgentPanel({
  runtime: runtime,
  modelSettings: modelSettings,
  store: store = null,
  uploadMaterial: uploadMaterial = null,
  fabBtnEl: fabBtnEl = document.getElementById('fabBtn'),
  root: root = document.body,
} = {}) {
  if (!runtime || !fabBtnEl || !root) return null;
  const panel = createEl('aside', 'agent-sidebar');
  (panel.setAttribute('aria-label', 'Canvas Agent 侧边栏'), panel.setAttribute('aria-hidden', 'true'));
  const el47 = createEl('div', 'agent-sidebar-resize-handle');
  (el47.setAttribute('role', 'separator'),
    el47.setAttribute('aria-orientation', 'vertical'),
    el47.setAttribute('aria-label', '调整 Agent 侧边栏宽度'),
    (el47.tabIndex = 0));
  const el48 = createEl('div', 'agent-sidebar-header'),
    el49 = createButton('agent-icon-btn agent-collapse-btn', '', {
      title: '折叠',
      icon: iconSvg('collapse'),
    });
  el49.setAttribute('aria-expanded', 'true');
  const el50 = createEl('div', 'agent-sidebar-title');
  el50.append(
    createEl('span', 'agent-sidebar-title-main', 'Ai CanvasPro Agent'),
    createEl('span', 'agent-sidebar-title-badge', '测试版'),
  );
  const el51 = createEl('div', 'agent-header-actions'),
    el52 = createButton('agent-icon-btn agent-new-chat-btn', '', {
      title: '新建对话',
      icon: iconSvg('plus'),
    }),
    el53 = createButton('agent-icon-btn agent-history-btn', '', {
      title: '历史记录',
      icon: iconSvg('history'),
    }),
    el54 = createButton('agent-icon-btn', '', { title: '关闭', icon: iconSvg('close') });
  (el51.append(el52, el53, el54), el48.append(el49, el50, el51));
  const el55 = createEl('div', 'agent-sidebar-main'),
    el56 = createEl('div', 'agent-greeting');
  el56.append(
    createEl('div', 'agent-greeting-kicker', 'Hi，欢迎回来'),
    createEl('div', 'agent-greeting-title', '今天一起创作点什么？'),
  );
  const el57 = createEl('div', 'agent-messages'),
    el58 = createEl('div', 'agent-history-popover');
  ((el58.hidden = true), el55.append(el56, el57, el58));
  const el59 = createEl('div', 'agent-quick-actions'),
    value71 = globalThis.window;
  function run() {
    (el59.replaceChildren(),
      [...AGENT_QUICK_ACTIONS, ...readCustomQuickActions(value71)].forEach((icon2) => {
        const el60 = createButton('agent-quick-card', icon2.label, {
          icon:
            icon2.custom === true
              ? iconSvg('wand')
              : icon2.id === 'archive-assets'
                ? iconSvg('grid')
                : icon2.id === 'check-style'
                  ? iconSvg('scan')
                  : iconSvg('flow'),
        });
        ((el60.dataset.prompt = icon2.prompt), el59.appendChild(el60));
      }));
  }
  run();
  const el61 = createEl('div', 'agent-notice');
  el61.hidden = true;
  const el62 = createEl('div', 'agent-plan-preview');
  el62.hidden = true;
  const el63 = createEl('div', 'agent-options');
  el63.hidden = true;
  const el64 = createEl('div', 'agent-recovery');
  el64.hidden = true;
  const el65 = createEl('div', 'agent-actions');
  el65.hidden = true;
  const el66 = createButton('agent-primary-btn', '确认执行'),
    el67 = createButton('agent-secondary-btn', '取消');
  el65.append(el66, el67);
  const el68 = createEl('form', 'agent-compose'),
    el69 = createEl('div', 'agent-prompt-panel text-prompt-panel'),
    el70 = createEl('div', 'agent-ref-bar node-ref-bar active'),
    el71 = createAgentPromptAttachmentButton({
      title: '从选中素材添加入参',
      className: 'agent-connect-btn',
    }),
    el72 = createEl('div', 'agent-ref-placeholder', panelText('addReference')),
    el73 = createEl('div', 'ref-thumb-container agent-input-ref-list');
  (el73.setAttribute('role', 'list'), el70.append(el71, el72, el73));
  const el74 = createEl('div', 'agent-input-wrapper prompt-input-wrapper'),
    editor2 = createEl('div', 'agent-compose-input prompt-textarea custom-textarea');
  ((editor2.contentEditable = 'true'),
    (editor2.spellcheck = false),
    (editor2.dataset.placeholder = '描述创意或需求，/ 使用技能，@ 引用参考'),
    el74.appendChild(editor2));
  const el75 = createEl('div', 'agent-compose-footer prompt-panel-footer'),
    el76 = createEl('div', 'agent-compose-left'),
    el77 = createEl('div', 'agent-menu-wrap'),
    el78 = createButton('agent-round-btn', '', { title: '添加', icon: iconSvg('plus') }),
    el79 = createEl('div', 'agent-floating-menu agent-add-menu');
  ([
    ['canvas', '从画布添加', 'grid'],
    ['upload', '上传素材', 'upload'],
    ['custom', '自定义快捷用法', 'wand'],
  ].forEach(([value72, value73, value74]) => {
    const el80 = createButton('agent-menu-item', value73, { icon: iconSvg(value74) });
    ((el80.dataset.placeholderAction = value72), el79.appendChild(el80));
  }),
    el77.append(el78, el79));
  const el81 = createEl('input', 'agent-upload-input');
  ((el81.type = 'file'), (el81.accept = 'image/*,video/*,audio/*'), (el81.multiple = false));
  const el82 = createEl('div', 'agent-menu-wrap agent-model-wrap img-model-wrap'),
    value75 = modelSettings?.getSettings?.() || {},
    el83 = createButton('agent-pill-btn agent-model-btn img-model-btn-trigger', '', {
      title: '模型选择',
    }),
    el84 = createEl('span', 'agent-model-icon-slot'),
    el85 = createEl('span', 'agent-model-label'),
    el86 = createEl('span', 'agent-caret');
  ((el86.innerHTML =
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'),
    el83.append(el84, el85, el86));
  const el87 = createEl('div', 'floating-menu img-model-menu node-model-menu agent-model-menu');
  ((el87.innerHTML = buildTextProviderMenuGroupsHTML(value75.model || '')),
    el82.append(el83, el87),
    updateModelTrigger(el83, value75));
  const el88 = createEl('div', 'agent-menu-wrap'),
    el89 = createButton('agent-pill-btn agent-mode-btn', '', {
      title: 'Agent 模式',
      icon: iconSvg('mode'),
    }),
    el90 = createEl('span', 'agent-mode-label', getAgentExecutionModeLabel(value75.executionMode)),
    el91 = createEl('span', 'agent-caret');
  ((el91.innerHTML =
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'),
    el89.append(el90, el91));
  const el92 = createEl('div', 'agent-floating-menu agent-mode-menu');
  ([
    ['manual', '手动确认'],
    ['auto', '自动执行'],
  ].forEach(([value76, value77]) => {
    const el93 = createButton('agent-menu-item', value77, { icon: iconSvg('check') });
    ((el93.dataset.executionMode = value76),
      el93.classList.toggle('active', normalizeAgentExecutionMode(value75.executionMode) === value76),
      el92.appendChild(el93));
  }),
    el88.append(el89, el92),
    (el88.hidden = true),
    el76.append(el77, el82));
  const el94 = createButton('agent-send-btn', '', { title: '发送', icon: iconSvg('send') });
  ((el94.type = 'submit'),
    el75.append(el76, el94),
    el69.append(el70, el74, el75),
    el68.append(el59, el62, el63, el64, el65, el69, el81),
    panel.append(el47, el48, el55, el68),
    root.appendChild(panel),
    (document?.body || root).appendChild(el61),
    bindNodeSubmenus(el87));
  let value78 = false;
  const storedSidebarWidth = readStoredSidebarWidth(value71);
  storedSidebarWidth &&
    document?.body?.style?.setProperty?.(
      '--agent-sidebar-width',
      clampAgentSidebarWidth(storedSidebarWidth) + 'px',
    );
  function setNotice2(value79) {
    ((el61.textContent = String(value79 || '')), (el61.hidden = !el61.textContent));
  }
  let enabled6 = false,
    list16 = [],
    enabled7 = false,
    el95 = null;
  function run2(options7 = {}) {
    if (options7.thumbUrl) {
      const el96 = createEl('img', 'ref-thumb-media agent-input-ref-media');
      return (
        (el96.src = options7.thumbUrl),
        (el96.alt = options7.label || options7.nodeId || ''),
        (el96.draggable = false),
        el96
      );
    }
    const el97 = createEl(
      'div',
      'ref-thumb-media ref-thumb-fallback agent-input-ref-fallback',
      String(options7.kind || 'node')
        .slice(0, 3)
        .toUpperCase(),
    );
    return (el97.setAttribute('aria-hidden', 'true'), el97);
  }
  function run3() {
    (el73.replaceChildren(),
      list16.forEach((error) => {
        const el98 = createEl('div', 'ref-thumb-wrap agent-input-ref-thumb'),
          value80 = String(error.label || error.name || error.nodeId || '').trim();
        ((el98.title = value80),
          el98.setAttribute('aria-label', value80),
          el98.setAttribute('role', 'listitem'),
          (el98.dataset.inputRefId = error.nodeId),
          el98.appendChild(run2(error)));
        const el99 = createEl('button', 'ref-thumb-delete agent-input-ref-remove', 'x');
        ((el99.type = 'button'),
          (el99.title = 'Remove reference'),
          el99.setAttribute('aria-label', 'Remove reference'),
          (el99.dataset.inputRefRemove = error.nodeId),
          el98.appendChild(el99),
          el73.appendChild(el98));
      }),
      el70.classList.add('active'),
      el70.classList.toggle('has-input-refs', list16.length > 0),
      (el72.hidden = list16.length > 0));
  }
  function run4(list17 = []) {
    const map = new Map(list16.map((item9) => [item9.nodeId, item9]));
    return (
      list17.filter(Boolean).forEach((enabled8) => {
        if (!enabled8.nodeId || map.has(enabled8.nodeId)) return;
        map.set(enabled8.nodeId, enabled8);
      }),
      (list16 = Array.from(map.values()).slice(0, AGENT_INPUT_REF_LIMIT)),
      run3(),
      list16.length
    );
  }
  function run5() {
    ((list16 = []), run3());
  }
  function run6() {
    return document?.getElementById?.('v2-wrap') || null;
  }
  function run7() {
    return document?.documentElement || globalThis.document?.documentElement || null;
  }
  function run8() {
    try {
      return createLinkCursor({ size: getCursorSize() });
    } catch {
      return createLinkCursor({ size: 'small' });
    }
  }
  function run9() {
    (el95?.classList?.remove?.('agent-material-pick-hover'), (el95 = null));
  }
  function run10(value81) {
    if (el95 === value81) return;
    (run9(), (el95 = value81 || null), el95?.classList?.add?.('agent-material-pick-hover'));
  }
  function run11({ noticeText: noticeText = '' } = {}) {
    if (!enabled7) return;
    ((enabled7 = false),
      run9(),
      panel.classList.remove('is-material-picking'),
      el71.classList.remove('is-picking', 'is-connecting-active'),
      el71.setAttribute('aria-pressed', 'false'));
    const el100 = run6();
    el100?.classList?.remove?.('is-connecting', 'agent-material-pick-mode');
    const el101 = run7();
    (el101?.classList?.remove?.('is-connecting-mode'),
      el101?.style?.removeProperty?.('--connect-cursor'),
      document?.removeEventListener?.('click', run12, true),
      document?.removeEventListener?.('pointermove', run13, true),
      document?.removeEventListener?.('keydown', run14, true));
    if (noticeText) setNotice2(noticeText);
  }
  function run15({ toggle: toggle = true } = {}) {
    if (enabled7) {
      toggle && run11({ noticeText: panelText('materialPickCancelled') });
      return;
    }
    ((enabled7 = true),
      panel.classList.add('is-material-picking'),
      el71.classList.add('is-picking', 'is-connecting-active'),
      el71.setAttribute('aria-pressed', 'true'));
    const el102 = run6();
    el102?.classList?.add?.('is-connecting', 'agent-material-pick-mode');
    const el103 = run7();
    (el103?.classList?.add?.('is-connecting-mode'),
      el103?.style?.setProperty?.('--connect-cursor', run8()),
      document?.addEventListener?.('click', run12, true),
      document?.addEventListener?.('pointermove', run13, true),
      document?.addEventListener?.('keydown', run14, true),
      setNotice2(panelText('materialPickStarted')));
  }
  function run16(el104) {
    const nodeEl = el104?.closest?.('.v2-node') || null,
      enabled9 = String(nodeEl?.id || '').trim();
    if (!enabled9) return { nodeEl: null, node: null, ref: null };
    const node = getStoreState(store).nodes?.[enabled9] || null,
      ref = normalizeAgentInputRefFromNode(node, { source: 'canvas-pick' });
    return { nodeEl: nodeEl, node: node, ref: ref };
  }
  function run13(event2) {
    if (!enabled7 || panel.contains(event2.target)) return;
    const { nodeEl: nodeEl2, ref: ref2 } = run16(event2.target);
    run10(nodeEl2 && isAgentMaterialRef(ref2) ? nodeEl2 : null);
  }
  function run12(event3) {
    if (!enabled7) return;
    if (panel.contains(event3.target)) return;
    const { ref: ref3 } = run16(event3.target);
    if (!ref3) return;
    (event3.preventDefault?.(), event3.stopPropagation?.(), event3.stopImmediatePropagation?.());
    if (!isAgentMaterialRef(ref3)) {
      setNotice2(panelText('materialPickUnsupported'));
      return;
    }
    (run4([ref3]), setNotice2(formatPanelText('attachSelected', { count: 1 })));
  }
  function run14(event4) {
    if (!enabled7 || event4.key !== 'Escape') return;
    (event4.preventDefault?.(),
      event4.stopPropagation?.(),
      run11({ noticeText: panelText('materialPickCancelled') }));
  }
  function run17() {
    const storeState = getStoreState(store),
      list18 = Array.isArray(storeState.selectedNodeIds)
        ? storeState.selectedNodeIds.map((item10) => String(item10 || '')).filter(Boolean)
        : [],
      list19 = list18
        .map((item11) =>
          normalizeAgentInputRefFromNode(storeState.nodes?.[item11], { source: 'canvas-selection' }),
        )
        .filter(Boolean),
      list20 = list19.filter(isAgentMaterialRef);
    if (list20.length === 0) return (setNotice2(panelText('attachSelectedEmpty')), 0);
    const value82 = list16.length;
    run4(list20);
    const count5 = Math.max(0, list16.length - value82);
    return (
      setNotice2(formatPanelText('attachSelected', { count: count5 || list20.length })),
      editor2.focus(),
      count5 || list20.length
    );
  }
  function run18({ toggle: toggle = true } = {}) {
    if (enabled7) return (run15({ toggle: toggle }), 0);
    const count6 = run17();
    if (count6 > 0) return count6;
    return (run15({ toggle: false }), 0);
  }
  function run19() {
    const prompt2 = getEditorText(editor2);
    if (!prompt2) {
      (setNotice2(panelText('customShortcutEmpty')), editor2.focus());
      return;
    }
    const list21 = readCustomQuickActions(value71),
      args = list21.filter((item12) => item12.prompt !== prompt2),
      writeCustomQuickActions2 = writeCustomQuickActions(
        [
          {
            id: 'custom-' + Date.now(),
            label: truncateUiText(prompt2, 18),
            prompt: prompt2,
            custom: true,
          },
          ...args,
        ],
        value71,
      );
    return (
      run(),
      (el59.hidden = el57.children.length > 0),
      setNotice2(panelText('customShortcutSaved')),
      writeCustomQuickActions2
    );
  }
  async function run20(enabled10) {
    if (!enabled10) return;
    if (typeof uploadMaterial !== 'function') {
      setNotice2(panelText('uploadMaterialMissing'));
      return;
    }
    run21(true);
    try {
      const uploadMaterial2 = await uploadMaterial(enabled10),
        list22 = Array.isArray(uploadMaterial2) ? uploadMaterial2 : [uploadMaterial2],
        list23 = list22
          .map((item13) => normalizeAgentInputRefFromNode(item13, { source: 'upload' }))
          .filter(Boolean);
      if (list23.length === 0) {
        setNotice2(panelText('uploadMaterialFailed'));
        return;
      }
      (run4(list23), setNotice2(panelText('uploadMaterialReady')), editor2.focus());
    } catch (error2) {
      setNotice2(error2?.message || panelText('uploadMaterialFailed'));
    } finally {
      run21(false);
    }
  }
  function run22() {
    return runtime?.sessionStore?.getHistory?.() || runtime?.sessionStore?.getState?.().history || [];
  }
  function run23() {
    (renderPlanPreview(el62, null),
      el63.replaceChildren(),
      (el63.hidden = true),
      el64.replaceChildren(),
      (el64.hidden = true),
      (el65.hidden = true));
  }
  function run24({ preserveNotice: preserveNotice = false } = {}) {
    const value83 =
      runtime?.getActiveConversation?.() || runtime?.sessionStore?.getState?.().activeConversation || null;
    if (value83?.hasUnfinishedOperation) {
      setNotice2(panelText('unfinishedNotice'));
      return;
    }
    if (!preserveNotice) setNotice2('');
  }
  function run25({ preserveNotice: preserveNotice = false } = {}) {
    (run23(), renderMessages(el57, run22()));
    const value84 = el57.children.length > 0;
    ((el56.hidden = value84), (el59.hidden = value84), run24({ preserveNotice: preserveNotice }));
  }
  function run21(value85) {
    ((value78 = value85 === true),
      (el94.disabled = value78),
      (el66.disabled = value78),
      (el67.disabled = value78),
      el63.querySelectorAll?.('.agent-option-btn')?.forEach((el105) => {
        el105.disabled = value78;
      }),
      el64.querySelectorAll?.('.agent-recovery-btn')?.forEach((el106) => {
        el106.disabled = value78;
      }),
      panel.classList.toggle('is-busy', value78));
  }
  function run26(value86) {
    (panel.classList.toggle('is-open', value86),
      panel.setAttribute('aria-hidden', value86 ? 'false' : 'true'),
      document?.body?.classList?.toggle('agent-sidebar-open', value86),
      document?.body?.classList?.toggle('agent-sidebar-collapsed', value86 && enabled6),
      fabBtnEl.classList.toggle('is-agent-open', value86));
    if (value86) {
      if (!enabled6) editor2.focus();
      run24({ preserveNotice: true });
    } else (run11(), closeFloatingMenus(panel), setNotice2(''));
  }
  function toggle2() {
    run26(!panel.classList.contains('is-open'));
  }
  function run27(value87) {
    ((enabled6 = value87 === true),
      panel.classList.toggle('is-collapsed', enabled6),
      el49.setAttribute('aria-expanded', enabled6 ? 'false' : 'true'),
      (el49.title = enabled6 ? '展开' : '折叠'),
      el49.setAttribute('aria-label', enabled6 ? '展开' : '折叠'),
      document?.body?.classList?.toggle(
        'agent-sidebar-collapsed',
        enabled6 && panel.classList.contains('is-open'),
      ));
    if (!enabled6 && panel.classList.contains('is-open')) editor2.focus();
    enabled6 && (run11(), closeFloatingMenus(panel), setNotice2(''));
  }
  function run28(value88, { persist: persist = false } = {}) {
    const clampAgentSidebarWidth2 = clampAgentSidebarWidth(value88);
    document?.body?.style?.setProperty?.('--agent-sidebar-width', clampAgentSidebarWidth2 + 'px');
    if (persist) writeStoredSidebarWidth(clampAgentSidebarWidth2, value71);
    return clampAgentSidebarWidth2;
  }
  function run29(event5) {
    (event5.preventDefault?.(), event5.stopPropagation?.());
    const value89 = Number(event5.clientX),
      enabled11 = panel.getBoundingClientRect?.().width || panel.offsetWidth || 0;
    if (!Number.isFinite(value89) || !enabled11) return;
    document?.body?.classList?.add?.('agent-sidebar-resizing');
    const value90 = (event6) => {
        const value91 = Number(event6.clientX);
        if (!Number.isFinite(value91)) return;
        run28(enabled11 + (value89 - value91));
      },
      value92 = (event7) => {
        (document?.removeEventListener?.('pointermove', value90),
          document?.removeEventListener?.('pointerup', value92),
          document?.body?.classList?.remove?.('agent-sidebar-resizing'));
        const value93 = Number(event7.clientX);
        Number.isFinite(value93) && run28(enabled11 + (value89 - value93), { persist: true });
      };
    (document?.addEventListener?.('pointermove', value90),
      document?.addEventListener?.('pointerup', value92));
  }
  function reset() {
    (run11(),
      runtime.startNewConversation?.(),
      run25({ preserveNotice: true }),
      setEditorText(editor2, ''),
      run5(),
      (el58.hidden = true),
      setNotice2('已新建对话。'));
  }
  function onSelect2(value94) {
    if (!runtime.switchConversation?.(value94)) return;
    (run11(), setEditorText(editor2, ''), run5(), (el58.hidden = true), run25());
  }
  function onDelete2(value95) {
    (run11(),
      runtime.deleteConversation?.(value95),
      setEditorText(editor2, ''),
      run5(),
      run25(),
      renderHistory(el58, runtime, { onSelect: onSelect2, onDelete: onDelete2 }));
  }
  function run30(response3) {
    if (response3?.reply) appendMessage(el57, 'assistant', response3.reply);
    el56.hidden = el57.children.length > 0;
    const value96 = response3?.status === 'need_confirmation' ? response3?.plan || null : null;
    (renderPlanPreview(el62, value96),
      renderClarification(el63, response3, runtime, run30, run21, {
        onAnswer: (enabled12) => {
          if (!enabled12) return;
          (appendMessage(el57, 'user', enabled12), (el56.hidden = true));
        },
        onWaitingStart: () => appendWaitingMessage(el57),
        onWaitingEnd: removeWaitingMessage,
      }),
      renderRecovery(el64, response3, runtime, run30, run21, {
        editor: editor2,
        setNotice: setNotice2,
      }),
      (el65.hidden = response3?.status !== 'need_confirmation'));
  }
  async function run31() {
    const editorText = getEditorText(editor2);
    if (!editorText) return;
    (setNotice2(''), run11());
    const inputRefs = list16.slice();
    (run5(),
      setEditorText(editor2, ''),
      (el59.hidden = true),
      appendMessage(el57, 'user', editorText),
      (el56.hidden = true),
      run21(true));
    const appendWaitingMessage2 = appendWaitingMessage(el57);
    try {
      run30(await runtime.handleUserMessage(editorText, { inputRefs: inputRefs }));
    } catch (error3) {
      appendMessage(el57, 'assistant', error3?.message || 'Agent failed.');
    } finally {
      (removeWaitingMessage(appendWaitingMessage2), run21(false));
    }
  }
  return (
    fabBtnEl.addEventListener('click', (event8) => {
      (event8.stopPropagation(), toggle2());
    }),
    el54.addEventListener('click', () => run26(false)),
    el49.addEventListener('click', () => run27(!enabled6)),
    el52.addEventListener('click', reset),
    el53.addEventListener('click', () => {
      const enabled13 = !el58.hidden;
      ((el58.hidden = enabled13),
        !enabled13 && renderHistory(el58, runtime, { onSelect: onSelect2, onDelete: onDelete2 }));
    }),
    el59.addEventListener('click', (event9) => {
      const el107 = event9.target?.closest?.('.agent-quick-card');
      if (!el107) return;
      (setEditorText(editor2, el107.dataset.prompt || el107.textContent || ''), editor2.focus());
    }),
    el78.addEventListener('click', (event10) => {
      (event10.stopPropagation(), setMenuOpen(el79, !el79.classList.contains('show'), panel));
    }),
    el79.addEventListener('click', (event11) => {
      const el108 = event11.target?.closest?.('[data-placeholder-action]');
      if (!el108) return;
      event11.stopPropagation?.();
      const value97 = el108.dataset.placeholderAction;
      if (value97 === 'canvas') run18({ toggle: false });
      else {
        if (value97 === 'upload')
          ((el81.value = ''), el81.click?.(), setNotice2(panelText('uploadMaterial')));
        else value97 === 'custom' && run19();
      }
      el79.classList.remove('show');
    }),
    el71.addEventListener('click', (event12) => {
      (event12.stopPropagation?.(), run18());
    }),
    el71.addEventListener('keydown', (event13) => {
      if (event13.key !== 'Enter' && event13.key !== ' ') return;
      (event13.preventDefault?.(), run18());
    }),
    el73.addEventListener('click', (event14) => {
      const el109 = event14.target?.closest?.('[data-input-ref-remove]'),
        enabled14 = String(el109?.dataset?.inputRefRemove || '').trim();
      if (!enabled14) return;
      ((list16 = list16.filter((item14) => item14.nodeId !== enabled14)), run3());
    }),
    el81.addEventListener('change', () => {
      const value98 = el81.files?.[0];
      (run20(value98), (el81.value = ''));
    }),
    el83.addEventListener('click', (event15) => {
      (event15.stopPropagation(), setMenuOpen(el87, !el87.classList.contains('show'), panel));
    }),
    el87.addEventListener('click', (event16) => {
      const provider3 = event16.target?.closest?.('.floating-menu-item');
      if (!provider3 || provider3.hasAttribute('data-node-menu-submenu')) return;
      const model3 = provider3.dataset.value || '';
      if (!model3 || provider3.dataset.disabled === 'true') return;
      const commitAgentModelSelection2 = commitAgentModelSelection(modelSettings, {
        model: model3,
        provider: provider3.dataset.provider || '',
      });
      (el87.querySelectorAll('.floating-menu-item').forEach((el110) => el110.classList.remove('active')),
        provider3.classList.add('active'),
        el87.classList.remove('show'),
        closeNodeFooterMenus(el87),
        updateModelTrigger(el83, commitAgentModelSelection2 || { model: model3 }));
    }),
    el89.addEventListener('click', (event17) => {
      if (el88.hidden) return;
      (event17.stopPropagation(), setMenuOpen(el92, !el92.classList.contains('show'), panel));
    }),
    el92.addEventListener('click', (event18) => {
      const el111 = event18.target?.closest?.('[data-execution-mode]');
      if (!el111) return;
      const executionMode2 = normalizeAgentExecutionMode(el111.dataset.executionMode),
        value99 = modelSettings?.updateSettings?.({ executionMode: executionMode2 }) || {
          executionMode: executionMode2,
        };
      ((el90.textContent = getAgentExecutionModeLabel(value99.executionMode)),
        el92
          .querySelectorAll('[data-execution-mode]')
          .forEach((el112) =>
            el112.classList.toggle('active', el112.dataset.executionMode === value99.executionMode),
          ),
        el92.classList.remove('show'),
        setNotice2('执行模式已保存；本轮不会改变确认策略。'));
    }),
    el68.addEventListener('submit', (event19) => {
      event19.preventDefault();
      if (value78) return;
      run31();
    }),
    editor2.addEventListener('keydown', (event20) => {
      if (event20.key === 'Enter' && !event20.shiftKey) {
        event20.preventDefault();
        if (value78) return;
        run31();
      }
    }),
    panel.addEventListener('pointerdown', (event21) => event21.stopPropagation()),
    panel.addEventListener('click', (event22) => {
      if (isAgentMenuSurface(event22.target)) return;
      closeFloatingMenus(panel);
    }),
    document?.addEventListener?.('click', (event23) => {
      if (!panel.contains(event23.target)) closeFloatingMenus(panel);
    }),
    el47.addEventListener('pointerdown', run29),
    el47.addEventListener('keydown', (event24) => {
      if (event24.key !== 'ArrowLeft' && event24.key !== 'ArrowRight') return;
      event24.preventDefault();
      const value100 = panel.getBoundingClientRect?.().width || panel.offsetWidth || 0,
        value101 = event24.key === 'ArrowLeft' ? 24 : -24;
      run28(value100 + value101, { persist: true });
    }),
    el66.addEventListener('click', async () => {
      if (value78) return;
      const displayAnswer2 = panelText('confirmUserMessage');
      (appendMessage(el57, 'user', displayAnswer2), (el56.hidden = true), (el65.hidden = true), run21(true));
      const appendWaitingMessage3 = appendWaitingMessage(el57);
      try {
        run30(await runtime.confirmPendingPlan({ displayAnswer: displayAnswer2 }));
      } catch (error4) {
        appendMessage(el57, 'assistant', error4?.message || 'Agent confirmation failed.');
      } finally {
        (removeWaitingMessage(appendWaitingMessage3), run21(false));
      }
    }),
    el67.addEventListener('click', () => {
      if (value78) return;
      ((el65.hidden = true), run30(runtime.cancelPendingPlan()));
    }),
    run25(),
    {
      panel: panel,
      open: () => run26(true),
      close: () => run26(false),
      toggle: toggle2,
      collapse: () => run27(true),
      expand: () => run27(false),
      reset: reset,
      setWidth: (value102) => run28(value102, { persist: true }),
    }
  );
}
export { formatAgentAssistantMarkdown } from './agentConversationPresentation.js';
