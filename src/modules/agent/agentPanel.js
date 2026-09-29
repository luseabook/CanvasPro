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
function normalizePanelLocale(_0x13a796 = getLocale()) {
  return String(_0x13a796 || '')
    .toLowerCase()
    .startsWith('en')
    ? 'en-US'
    : 'zh-CN';
}
function panelText(_0x1785f1, _0x36660 = getLocale()) {
  const _0x1dcd2a = normalizePanelLocale(_0x36660);
  return PANEL_TEXT[_0x1dcd2a]?.[_0x1785f1] || PANEL_TEXT['zh-CN'][_0x1785f1] || _0x1785f1;
}
function formatPanelText(_0x60140f, _0x3a8545 = {}, _0x29f6c6 = getLocale()) {
  return panelText(_0x60140f, _0x29f6c6).replace(/\{(\w+)\}/g, (_0x484dca, _0x5411e2) =>
    _0x3a8545[_0x5411e2] == null ? '' : String(_0x3a8545[_0x5411e2]),
  );
}
function createEl(_0x486a58, _0x451d2a = '', _0x37bb2e = '') {
  const _0x3c92f5 = document.createElement(_0x486a58);
  if (_0x451d2a) _0x3c92f5.className = _0x451d2a;
  if (_0x37bb2e) _0x3c92f5.textContent = _0x37bb2e;
  return _0x3c92f5;
}
function createButton(
  _0x3d0eb2,
  _0x4e6937,
  { title: title = '', icon: icon = '', disabled: disabled = false } = {},
) {
  const _0x5cd419 = createEl('button', _0x3d0eb2);
  _0x5cd419.type = 'button';
  title && ((_0x5cd419.title = title), _0x5cd419.setAttribute('aria-label', title));
  if (icon) {
    _0x5cd419.innerHTML = icon;
    if (_0x4e6937) {
      const _0xeb6e9d = createEl('span', 'agent-btn-label', _0x4e6937);
      _0x5cd419.appendChild(_0xeb6e9d);
    }
  } else _0x5cd419.textContent = _0x4e6937;
  _0x5cd419.disabled = disabled;
  if (disabled) _0x5cd419.setAttribute('aria-disabled', 'true');
  return _0x5cd419;
}
function iconSvg(_0x54edc2) {
  const _0x34c970 =
      'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    _0x5c0ffc = {
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
  return (
    '<svg class="agent-icon" width="18" height="18" ' +
    _0x34c970 +
    '>' +
    (_0x5c0ffc[_0x54edc2] || '') +
    '</svg>'
  );
}
function createAgentPromptAttachmentButton({ title: title = '', className: className = '' } = {}) {
  const _0x57f117 = document.createElement('div');
  _0x57f117.innerHTML = createPromptAttachmentButtonHTML({
    tooltip: title,
    stroke: 'currentColor',
    fill: 'var(--white-05)',
    circleFill: 'currentColor',
  });
  const _0x3413ee = _0x57f117.firstElementChild;
  if (_0x3413ee)
    return (
      className
        .split(/\s+/)
        .filter(Boolean)
        .forEach((_0x525afb) => _0x3413ee.classList.add(_0x525afb)),
      _0x3413ee.setAttribute('role', 'button'),
      (_0x3413ee.tabIndex = 0),
      _0x3413ee
    );
  const _0x276ac3 = createEl('div', ['prompt-attachment-btn', className].filter(Boolean).join(' '));
  title && ((_0x276ac3.title = title), _0x276ac3.setAttribute('aria-label', title));
  (_0x276ac3.setAttribute('role', 'button'), (_0x276ac3.tabIndex = 0));
  const _0x29fc58 = createEl('span', 'btn-icon');
  return (
    (_0x29fc58.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z" fill="var(--white-05)" /><circle cx="20" cy="20" r="2.5" fill="currentColor" /><path d="M12 12 Q 17 12 19 18" stroke-dasharray="3 3" /></svg>'),
    _0x276ac3.appendChild(_0x29fc58),
    _0x276ac3
  );
}
function appendMessage(_0x4e1fc9, _0x39f0cf, _0x22e8c0) {
  const _0x5286f5 = String(_0x39f0cf || '') === 'user' ? 'user' : 'assistant',
    _0x44517d = createEl('div', 'agent-message agent-message--' + _0x5286f5);
  ((_0x44517d.textContent = String(_0x22e8c0 || '')),
    _0x4e1fc9.appendChild(_0x44517d),
    (_0x4e1fc9.scrollTop = _0x4e1fc9.scrollHeight));
}
function renderMessages(_0x2e18e3, _0x16b8cb = []) {
  (_0x2e18e3.replaceChildren(),
    _0x16b8cb.forEach((_0x360cc2) => {
      appendMessage(_0x2e18e3, _0x360cc2.role, _0x360cc2.content || _0x360cc2.status || '');
    }));
}
function appendWaitingMessage(_0xae8ad0) {
  const _0x325aa5 = createEl('div', 'agent-message agent-message--assistant agent-message--typing'),
    _0x246267 = createEl('span', 'agent-typing-label', panelText('waiting')),
    _0x14fc29 = createEl('span', 'agent-typing-dots');
  return (
    _0x14fc29.append(createEl('span'), createEl('span'), createEl('span')),
    _0x325aa5.append(_0x246267, _0x14fc29),
    _0xae8ad0.appendChild(_0x325aa5),
    (_0xae8ad0.scrollTop = _0xae8ad0.scrollHeight),
    _0x325aa5
  );
}
function removeWaitingMessage(_0x193e0f) {
  if (!_0x193e0f?.parentNode) return;
  if (typeof _0x193e0f.remove === 'function') {
    _0x193e0f.remove();
    return;
  }
  const _0x582325 = _0x193e0f.parentNode,
    _0xceec4e = _0x582325.children?.indexOf?.(_0x193e0f) ?? -1;
  if (_0xceec4e >= 0) _0x582325.children.splice(_0xceec4e, 1);
  _0x193e0f.parentNode = null;
}
function setEditorText(_0x100012, _0x403264 = '') {
  ((_0x100012.textContent = String(_0x403264 || '')),
    _0x100012.dispatchEvent?.(new Event('input', { bubbles: true })));
}
function getEditorText(_0x51ebf7) {
  return String(_0x51ebf7?.innerText || _0x51ebf7?.textContent || '').trim();
}
function truncateUiText(_0x3090fd, _0x1d1f79 = 40) {
  const _0x4f3b8d = String(_0x3090fd || '')
    .replace(/\s+/g, ' ')
    .trim();
  return _0x4f3b8d.length <= _0x1d1f79 ? _0x4f3b8d : _0x4f3b8d.slice(0, Math.max(0, _0x1d1f79 - 3)) + '...';
}
function readJsonArrayFromStorage(_0x56a50d, _0x21b928) {
  try {
    const _0xe39b18 = _0x56a50d?.localStorage?.getItem?.(_0x21b928),
      _0x9a372c = _0xe39b18 ? JSON.parse(_0xe39b18) : [];
    return Array.isArray(_0x9a372c) ? _0x9a372c : [];
  } catch {
    return [];
  }
}
function writeJsonArrayToStorage(_0x2952f4, _0x283691, _0x8afff1) {
  try {
    _0x2952f4?.localStorage?.setItem?.(_0x283691, JSON.stringify(_0x8afff1));
  } catch {}
}
function normalizeQuickAction(_0x1e1869 = {}, _0x246cc2 = '') {
  const _0x1d7a4c = String(_0x1e1869.prompt || '').trim();
  if (!_0x1d7a4c) return null;
  const _0xa67d = String(_0x1e1869.id || _0x246cc2 || '').trim() || 'custom-' + Date.now();
  return {
    id: _0xa67d,
    label: truncateUiText(_0x1e1869.label || _0x1d7a4c, 28),
    prompt: _0x1d7a4c,
    custom: _0x1e1869.custom === true,
  };
}
function readCustomQuickActions(_0x3fd012 = globalThis.window) {
  return readJsonArrayFromStorage(_0x3fd012, AGENT_CUSTOM_QUICK_ACTIONS_STORAGE_KEY)
    .map((_0x2456f1, _0x4cdc48) => normalizeQuickAction(_0x2456f1, 'custom-' + _0x4cdc48))
    .filter(Boolean)
    .slice(0, AGENT_CUSTOM_QUICK_ACTION_LIMIT);
}
function writeCustomQuickActions(_0x578823 = [], _0x35f5e5 = globalThis.window) {
  const _0x30719a = _0x578823
    .map((_0x3c70c5, _0x1ee4d1) => normalizeQuickAction(_0x3c70c5, 'custom-' + _0x1ee4d1))
    .filter(Boolean)
    .slice(0, AGENT_CUSTOM_QUICK_ACTION_LIMIT);
  return (writeJsonArrayToStorage(_0x35f5e5, AGENT_CUSTOM_QUICK_ACTIONS_STORAGE_KEY, _0x30719a), _0x30719a);
}
function inferAgentInputKind(_0x3667b6 = '') {
  const _0x28bef8 = String(_0x3667b6 || '').trim();
  if (_0x28bef8.includes('image')) return 'image';
  if (_0x28bef8.includes('video')) return 'video';
  if (_0x28bef8.includes('audio')) return 'audio';
  if (_0x28bef8.includes('text')) return 'text';
  return _0x28bef8 || 'node';
}
function normalizeRenderableThumbUrl(_0x231719) {
  const _0x55087c = String(_0x231719 || '').trim();
  if (!_0x55087c) return '';
  if (/^https?:\/\//i.test(_0x55087c) || _0x55087c.startsWith('/')) return _0x55087c;
  if (/^data:image\//i.test(_0x55087c) && _0x55087c.length <= 0xc350) return _0x55087c;
  return localPathToUrl(_0x55087c) || '';
}
function resolveAgentInputRefThumbUrl(_0x13c2f3 = {}) {
  const _0x49b0fa = [
    _0x13c2f3.thumbUrl,
    _0x13c2f3.posterUrl,
    _0x13c2f3.videoThumbSrc,
    _0x13c2f3.imageUrl,
    _0x13c2f3.src,
    _0x13c2f3.coverUrl,
    _0x13c2f3.waveformUrl,
    _0x13c2f3.thumbLocalPath,
    _0x13c2f3.posterLocalPath,
    _0x13c2f3.displayLocalPath,
    _0x13c2f3.localPath,
    _0x13c2f3.originalLocalPath,
    _0x13c2f3.waveformLocalPath,
  ];
  for (const _0x573883 of _0x49b0fa) {
    const _0x5be510 = normalizeRenderableThumbUrl(_0x573883);
    if (_0x5be510) return _0x5be510;
  }
  return '';
}
function normalizeAgentInputRefFromNode(_0x554dad = {}, { source: source = 'canvas' } = {}) {
  const _0x46296b = String(_0x554dad.id || _0x554dad.nodeId || '').trim();
  if (!_0x46296b) return null;
  const _0x856b4 = String(_0x554dad.type || '').trim(),
    _0x255f77 = inferAgentInputKind(_0x856b4),
    _0x43e16e = truncateUiText(_0x554dad.name || _0x554dad.label || _0x554dad.title || _0x46296b, 60),
    _0x2b04d0 = Number(_0x554dad.width),
    _0x353e6c = Number(_0x554dad.height),
    _0x29272a = {
      id: _0x46296b,
      nodeId: _0x46296b,
      type: _0x856b4,
      kind: _0x255f77,
      name: _0x43e16e,
      label: _0x43e16e,
      source: source,
      thumbUrl: resolveAgentInputRefThumbUrl(_0x554dad),
    };
  if (Number.isFinite(_0x2b04d0) && _0x2b04d0 > 0) _0x29272a.width = Math.round(_0x2b04d0);
  if (Number.isFinite(_0x353e6c) && _0x353e6c > 0) _0x29272a.height = Math.round(_0x353e6c);
  return _0x29272a;
}
function isAgentMaterialRef(_0x941ab9 = {}) {
  return ['image', 'video', 'audio', 'text'].includes(String(_0x941ab9.kind || ''));
}
function getStoreState(_0x5699d3) {
  return _0x5699d3?.getStateRaw?.() || _0x5699d3?.getState?.() || {};
}
function clampAgentSidebarWidth(_0x204b79, _0x43643d = globalThis.window?.innerWidth) {
  const _0xf7b6e4 = Number(_0x204b79),
    _0x73433 = Number.isFinite(Number(_0x43643d))
      ? Math.max(0x140, Number(_0x43643d) - 24)
      : AGENT_PANEL_WIDTH_LIMITS.max,
    _0x1f9762 = Math.min(AGENT_PANEL_WIDTH_LIMITS.max, _0x73433),
    _0x30262 = Math.min(AGENT_PANEL_WIDTH_LIMITS.min, _0x1f9762);
  return Math.max(_0x30262, Math.min(_0x1f9762, _0xf7b6e4));
}
function readStoredSidebarWidth(_0x13dbb0 = globalThis.window) {
  const _0xc92d42 = Number(_0x13dbb0?.localStorage?.getItem?.(AGENT_PANEL_WIDTH_STORAGE_KEY));
  return Number.isFinite(_0xc92d42) && _0xc92d42 > 0 ? _0xc92d42 : null;
}
function writeStoredSidebarWidth(_0x43ff21, _0x2ac09f = globalThis.window) {
  try {
    _0x2ac09f?.localStorage?.setItem?.(AGENT_PANEL_WIDTH_STORAGE_KEY, String(Math.round(_0x43ff21)));
  } catch {}
}
export function normalizeAgentSidebarWidth(_0x15e5dd, _0x284757) {
  return clampAgentSidebarWidth(_0x15e5dd, _0x284757);
}
export function normalizeAgentExecutionMode(_0x4e6780) {
  return String(_0x4e6780 || '').trim() === 'auto' ? 'auto' : 'manual';
}
export function getAgentExecutionModeLabel(_0x2a890d) {
  return normalizeAgentExecutionMode(_0x2a890d) === 'auto' ? '自动执行' : '手动确认';
}
export function getAgentPlaceholderActionMessage(_0x2b3894) {
  return PLACEHOLDER_ACTION_MESSAGES[_0x2b3894] || '该入口会在后续接入。';
}
export function resolveAgentModelLabel(_0x1c4f96) {
  const _0x296540 = String(_0x1c4f96 || '').trim();
  if (!_0x296540) return '模型选择';
  return findTextModelMenuItem(_0x296540)?.title || _0x296540;
}
export function commitAgentModelSelection(_0x27b29e, _0x4f7394 = {}) {
  const _0x257f5f = String(_0x4f7394.model || _0x4f7394.modelId || '').trim(),
    _0x14c6d = String(_0x4f7394.provider || '').trim();
  if (!_0x257f5f) return null;
  return (
    _0x27b29e?.updateSettings?.({ model: _0x257f5f, provider: _0x14c6d }) || {
      model: _0x257f5f,
      provider: _0x14c6d,
    }
  );
}
function getCreateActionLabel(_0x5cca7d) {
  const _0x455c9c = String(_0x5cca7d || '');
  if (_0x455c9c === 'ai-image') return panelText('nodeCreateImage');
  if (_0x455c9c === 'ai-video') return panelText('nodeCreateVideo');
  if (_0x455c9c === 'ai-audio') return panelText('nodeCreateAudio');
  if (_0x455c9c === 'ai-text' || _0x455c9c === 'source-text') return panelText('nodeCreateText');
  return panelText('nodeCreate');
}
function formatActionSummary(_0x4f4340 = {}) {
  if (_0x4f4340.label) {
    const _0x1f00d0 = [];
    if (_0x4f4340.promptSummary) _0x1f00d0.push('“' + _0x4f4340.promptSummary + '”');
    if (Number.isFinite(Number(_0x4f4340.args?.gap))) _0x1f00d0.push('间距 ' + Number(_0x4f4340.args.gap));
    return _0x1f00d0.length ? _0x4f4340.label + '：' + _0x1f00d0.join('，') : _0x4f4340.label;
  }
  const _0x1a4221 = String(_0x4f4340.type || ''),
    _0x17a5b6 = _0x4f4340.args || {},
    _0x1c7f9a =
      _0x1a4221 === 'node.create'
        ? getCreateActionLabel(_0x17a5b6.type)
        : _0x1a4221 === 'node.setPrompt' || _0x1a4221 === 'node.appendPrompt'
          ? panelText('nodeSetPrompt')
          : _0x1a4221 === 'node.setParams'
            ? panelText('nodeSetParams')
            : _0x1a4221 === 'graph.connect'
              ? panelText('graphConnect')
              : _0x1a4221 === 'layout.arrangeRow'
                ? panelText('layoutArrangeRow')
                : _0x1a4221 === 'layout.align'
                  ? panelText('layoutAlign')
                  : _0x1a4221 === 'generation.run'
                    ? panelText('generate')
                    : _0x1a4221 === 'node.delete'
                      ? panelText('nodeDelete')
                      : _0x1a4221,
    _0x2f2866 = [],
    _0x4b8264 = _0x17a5b6.prompt || _0x17a5b6.text;
  if (_0x4b8264) _0x2f2866.push('“' + String(_0x4b8264).slice(0, 36) + '”');
  if (Number.isFinite(Number(_0x17a5b6.gap))) _0x2f2866.push('间距 ' + Number(_0x17a5b6.gap));
  return _0x2f2866.length ? _0x1c7f9a + '：' + _0x2f2866.join('，') : _0x1c7f9a;
}
function formatParamValue(_0x7d0da2) {
  if (_0x7d0da2 == null || _0x7d0da2 === '') return '';
  if (typeof _0x7d0da2 === 'string' || typeof _0x7d0da2 === 'number' || typeof _0x7d0da2 === 'boolean')
    return String(_0x7d0da2);
  try {
    return JSON.stringify(_0x7d0da2);
  } catch {
    return String(_0x7d0da2);
  }
}
function formatParams(_0x225275 = {}) {
  const _0x4ef2db =
    _0x225275 && typeof _0x225275 === 'object' && !Array.isArray(_0x225275) ? Object.entries(_0x225275) : [];
  if (_0x4ef2db.length === 0) return panelText('noParams');
  return _0x4ef2db
    .slice(0, 8)
    .map(([_0x4e005e, _0x583508]) => _0x4e005e + ': ' + formatParamValue(_0x583508))
    .join('，');
}
function renderActionGroup(_0xad1c3d, _0x21dbf7, _0x3e44fb = []) {
  if (!Array.isArray(_0x3e44fb) || _0x3e44fb.length === 0) return;
  const _0x4d6cd4 = createEl('div', 'agent-plan-group');
  _0x4d6cd4.appendChild(createEl('div', 'agent-plan-group-title', _0x21dbf7));
  const _0x4d2c8c = createEl('div', 'agent-plan-list');
  (_0x3e44fb.forEach((_0x25baf1) => {
    _0x4d2c8c.appendChild(createEl('div', 'agent-plan-item', formatActionSummary(_0x25baf1)));
  }),
    _0x4d6cd4.appendChild(_0x4d2c8c),
    _0xad1c3d.appendChild(_0x4d6cd4));
}
function renderTraceSummary(_0x44eb8a, _0x1b7dfd, _0x5eb997 = []) {
  if (!Array.isArray(_0x5eb997) || _0x5eb997.length === 0) return;
  const _0x1265fb = createEl('div', 'agent-plan-group');
  _0x1265fb.appendChild(createEl('div', 'agent-plan-group-title', _0x1b7dfd));
  const _0x5515c1 = createEl('div', 'agent-plan-list');
  (_0x5eb997.forEach((_0x5cadf5) => {
    _0x5515c1.appendChild(createEl('div', 'agent-plan-item', _0x5cadf5));
  }),
    _0x1265fb.appendChild(_0x5515c1),
    _0x44eb8a.appendChild(_0x1265fb));
}
function renderPlanPreview(_0x4b49b1, _0x26be54) {
  _0x4b49b1.replaceChildren();
  if (!_0x26be54) {
    _0x4b49b1.hidden = true;
    return;
  }
  const _0x1f9e01 = _0x26be54.confirmationSummary || null,
    _0x1a51f4 = Array.isArray(_0x26be54.actions) ? _0x26be54.actions : [];
  if (!_0x1f9e01 && _0x1a51f4.length === 0) {
    _0x4b49b1.hidden = true;
    return;
  }
  _0x4b49b1.hidden = false;
  const _0x5c9f13 = createEl('div', 'agent-plan-title', panelText('confirmTitle')),
    _0x982be4 = createEl('div', 'agent-plan-body');
  if (_0x1f9e01) {
    (renderActionGroup(_0x982be4, panelText('completed'), _0x1f9e01.completedActions || []),
      renderActionGroup(_0x982be4, panelText('pending'), _0x1f9e01.pendingActions || []),
      renderTraceSummary(_0x982be4, panelText('traceSummary'), _0x1f9e01.debugTraceSummary || []));
    if (_0x1f9e01.generation) {
      const _0x443ef5 = createEl('div', 'agent-plan-meta');
      ([
        [panelText('model'), _0x1f9e01.generation.modelLabel || _0x1f9e01.generation.model || ''],
        [panelText('prompt'), _0x1f9e01.generation.promptSummary || ''],
        [panelText('params'), formatParams(_0x1f9e01.generation.params)],
        [panelText('inputSource'), _0x1f9e01.generation.inputSource || ''],
      ].forEach(([_0x26414d, _0x25a4b]) => {
        if (!_0x25a4b) return;
        const _0x4614c9 = createEl('div', 'agent-plan-meta-row');
        (_0x4614c9.append(
          createEl('span', 'agent-plan-meta-label', _0x26414d),
          createEl('span', 'agent-plan-meta-value', _0x25a4b),
        ),
          _0x443ef5.appendChild(_0x4614c9));
      }),
        _0x982be4.appendChild(_0x443ef5));
    }
    _0x1f9e01.cancelNotice &&
      _0x982be4.appendChild(createEl('div', 'agent-plan-notice', _0x1f9e01.cancelNotice));
  } else {
    const _0x57c110 = createEl('div', 'agent-plan-list');
    (_0x1a51f4.forEach((_0x18967b) => {
      _0x57c110.appendChild(createEl('div', 'agent-plan-item', formatActionSummary(_0x18967b)));
    }),
      _0x982be4.appendChild(_0x57c110));
  }
  _0x4b49b1.append(_0x5c9f13, _0x982be4);
}
function renderClarification(
  _0x4fae67,
  _0x556f51,
  _0x152d94,
  _0x10fc8c,
  _0x465d05 = null,
  {
    onAnswer: onAnswer = null,
    onWaitingStart: onWaitingStart = null,
    onWaitingEnd: onWaitingEnd = null,
  } = {},
) {
  _0x4fae67.replaceChildren();
  const _0x2efac2 = Array.isArray(_0x556f51?.options) ? _0x556f51.options : [];
  _0x4fae67.hidden = _0x2efac2.length === 0;
  for (const _0x3986a6 of _0x2efac2) {
    const _0x37bd09 = createEl('button', 'agent-option-btn', _0x3986a6.label);
    ((_0x37bd09.type = 'button'),
      _0x37bd09.addEventListener('click', async () => {
        const _0x22eff7 = String(_0x3986a6.label || _0x3986a6.id || '').trim();
        (onAnswer?.(_0x22eff7), (_0x4fae67.hidden = true));
        const _0x3263ba = onWaitingStart?.();
        _0x465d05?.(true);
        try {
          const _0x34c8a0 = await _0x152d94.answerClarification(_0x3986a6.id, { displayAnswer: _0x22eff7 });
          _0x10fc8c(_0x34c8a0);
        } catch (_0x4ef22a) {
          _0x10fc8c({
            ok: false,
            status: 'failed',
            reply: _0x4ef22a?.message || 'Agent clarification failed.',
          });
        } finally {
          (onWaitingEnd?.(_0x3263ba), _0x465d05?.(false));
        }
      }),
      _0x4fae67.appendChild(_0x37bd09));
  }
}
function renderRecovery(
  _0x2ee566,
  _0x48e14e,
  _0x5ddf52,
  _0x2ee505,
  _0x1b4eec = null,
  { editor: editor = null, setNotice: setNotice = null } = {},
) {
  _0x2ee566.replaceChildren();
  const _0x3c0987 = _0x48e14e?.recovery || null,
    _0x549a85 = Array.isArray(_0x3c0987?.options) ? _0x3c0987.options : [];
  _0x2ee566.hidden = _0x549a85.length === 0;
  if (_0x549a85.length === 0) return;
  _0x2ee566.appendChild(createEl('div', 'agent-recovery-title', panelText('recoveryTitle')));
  const _0x4f5f6f = createEl('div', 'agent-recovery-actions');
  for (const _0x368edd of _0x549a85) {
    const _0x4a62d9 = createEl('button', 'agent-recovery-btn', _0x368edd.label || _0x368edd.id);
    ((_0x4a62d9.type = 'button'),
      (_0x4a62d9.dataset.recoveryAction = _0x368edd.id),
      _0x4a62d9.addEventListener('click', async () => {
        const _0x47de46 = String(_0x368edd.id || '');
        if (_0x47de46 === 'editPrompt') {
          (setEditorText(editor, panelText('recoveryEditPromptDraft')),
            editor?.focus?.(),
            setNotice?.(panelText('recoveryEditPromptNotice')),
            (_0x2ee566.hidden = true));
          return;
        }
        if (_0x47de46 === 'changeModel') {
          (setEditorText(editor, panelText('recoveryChangeModelDraft')),
            editor?.focus?.(),
            setNotice?.(panelText('recoveryChangeModelNotice')),
            (_0x2ee566.hidden = true));
          return;
        }
        _0x1b4eec?.(true);
        try {
          const _0x3a144e =
            _0x47de46 === 'keepPrepared'
              ? await _0x5ddf52.keepPreparedPlan?.()
              : await _0x5ddf52.retryFailedPlan?.();
          _0x2ee505(_0x3a144e || { ok: false, status: 'failed', reply: 'Recovery failed.' });
        } catch (_0x497a07) {
          _0x2ee505({
            ok: false,
            status: 'failed',
            reply: _0x497a07?.message || 'Agent recovery failed.',
          });
        } finally {
          _0x1b4eec?.(false);
        }
      }),
      _0x4f5f6f.appendChild(_0x4a62d9));
  }
  _0x2ee566.appendChild(_0x4f5f6f);
}
function formatHistoryTime(_0x1e8c7e) {
  const _0x174554 = new Date(Number(_0x1e8c7e) || Date.now());
  return _0x174554.toLocaleString(getLocale(), {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function getLastMessageSummary(_0x5d6649 = {}) {
  const _0x350ce0 = Array.isArray(_0x5d6649.messages) ? _0x5d6649.messages : [],
    _0x227b79 = _0x350ce0[_0x350ce0.length - 1] || null;
  return String(_0x227b79?.content || _0x5d6649.lastPlanSummary || _0x5d6649.title || '').trim();
}
function renderHistory(_0x23e5fe, _0x367484, { onSelect: onSelect = null, onDelete: onDelete = null } = {}) {
  _0x23e5fe.replaceChildren();
  const _0x4f50ca = createEl('div', 'agent-history-title', panelText('historyTitle')),
    _0x385823 = _0x367484?.listConversations?.() || [],
    _0x5bcaaa = _0x367484?.getActiveConversation?.() || null;
  if (!_0x385823.length) {
    _0x23e5fe.append(_0x4f50ca, createEl('div', 'agent-history-empty', panelText('historyEmpty')));
    return;
  }
  const _0x46906c = createEl('div', 'agent-history-list');
  (_0x385823.forEach((_0x177b2a) => {
    const _0x24b47b = createEl('div', 'agent-history-item');
    ((_0x24b47b.dataset.conversationId = _0x177b2a.id),
      _0x24b47b.classList.toggle('is-active', _0x177b2a.id === _0x5bcaaa?.id));
    const _0x4bbb74 = createEl('button', 'agent-history-main');
    ((_0x4bbb74.type = 'button'),
      _0x4bbb74.append(
        createEl('span', 'agent-history-name', _0x177b2a.title || '新对话'),
        createEl('span', 'agent-history-time', formatHistoryTime(_0x177b2a.updatedAt)),
        createEl('span', 'agent-history-content', getLastMessageSummary(_0x177b2a)),
      ),
      _0x4bbb74.addEventListener('click', () => onSelect?.(_0x177b2a.id)));
    const _0x2d7121 = createButton('agent-history-delete', panelText('historyDelete'), {
      title: panelText('historyDelete'),
    });
    (_0x2d7121.addEventListener('click', (_0x28356b) => {
      (_0x28356b.preventDefault?.(), _0x28356b.stopPropagation?.(), onDelete?.(_0x177b2a.id));
    }),
      _0x24b47b.append(_0x4bbb74, _0x2d7121),
      _0x46906c.appendChild(_0x24b47b));
  }),
    _0x23e5fe.append(_0x4f50ca, _0x46906c));
}
function updateModelTrigger(_0x10ca95, _0x5c54cc = {}) {
  const _0x2c1fc6 = _0x5c54cc.model || '',
    _0x35e0b4 = _0x10ca95.querySelector('.agent-model-label'),
    _0x2d1579 = _0x10ca95.querySelector('.agent-model-icon-slot');
  if (_0x35e0b4) _0x35e0b4.textContent = resolveAgentModelLabel(_0x2c1fc6);
  _0x2d1579 && (_0x2d1579.innerHTML = buildTextModelSmallIconHTML(_0x2c1fc6) || iconSvg('model'));
}
function closeFloatingMenus(_0x5f0543, _0x1c1ddb = null) {
  _0x5f0543?.querySelectorAll?.('.agent-floating-menu.show, .agent-model-menu.show')?.forEach((_0x1dcaa8) => {
    if (_0x1dcaa8 !== _0x1c1ddb) _0x1dcaa8.classList.remove('show');
  });
  if (!_0x1c1ddb) closeNodeFooterMenus(_0x5f0543);
}
function setMenuOpen(_0x4347c0, _0x3da51c, _0x535944) {
  (closeFloatingMenus(_0x535944, _0x3da51c ? _0x4347c0 : null),
    _0x4347c0?.classList.toggle('show', _0x3da51c));
}
function isAgentMenuSurface(_0x5c6a95) {
  return !!_0x5c6a95?.closest?.('.agent-menu-wrap, .agent-floating-menu, .agent-model-menu');
}
export function initAgentPanel({
  runtime: _0x5c09b1,
  modelSettings: _0x23cce3,
  store: store = null,
  uploadMaterial: uploadMaterial = null,
  fabBtnEl: fabBtnEl = document.getElementById('fabBtn'),
  root: root = document.body,
} = {}) {
  if (!_0x5c09b1 || !fabBtnEl || !root) return null;
  const _0x3772fc = createEl('aside', 'agent-sidebar');
  (_0x3772fc.setAttribute('aria-label', 'Canvas Agent 侧边栏'),
    _0x3772fc.setAttribute('aria-hidden', 'true'));
  const _0x33ec09 = createEl('div', 'agent-sidebar-resize-handle');
  (_0x33ec09.setAttribute('role', 'separator'),
    _0x33ec09.setAttribute('aria-orientation', 'vertical'),
    _0x33ec09.setAttribute('aria-label', '调整 Agent 侧边栏宽度'),
    (_0x33ec09.tabIndex = 0));
  const _0x37512b = createEl('div', 'agent-sidebar-header'),
    _0x572be8 = createButton('agent-icon-btn agent-collapse-btn', '', {
      title: '折叠',
      icon: iconSvg('collapse'),
    });
  _0x572be8.setAttribute('aria-expanded', 'true');
  const _0x4d5df7 = createEl('div', 'agent-sidebar-title');
  _0x4d5df7.append(
    createEl('span', 'agent-sidebar-title-main', 'Ai CanvasPro Agent'),
    createEl('span', 'agent-sidebar-title-badge', '测试版'),
  );
  const _0x298af1 = createEl('div', 'agent-header-actions'),
    _0x83ac16 = createButton('agent-icon-btn agent-new-chat-btn', '', {
      title: '新建对话',
      icon: iconSvg('plus'),
    }),
    _0x21b5dc = createButton('agent-icon-btn agent-history-btn', '', {
      title: '历史记录',
      icon: iconSvg('history'),
    }),
    _0x2ec94e = createButton('agent-icon-btn', '', { title: '关闭', icon: iconSvg('close') });
  (_0x298af1.append(_0x83ac16, _0x21b5dc, _0x2ec94e), _0x37512b.append(_0x572be8, _0x4d5df7, _0x298af1));
  const _0x3ad456 = createEl('div', 'agent-sidebar-main'),
    _0x42864b = createEl('div', 'agent-greeting');
  _0x42864b.append(
    createEl('div', 'agent-greeting-kicker', 'Hi，欢迎回来'),
    createEl('div', 'agent-greeting-title', '今天一起创作点什么？'),
  );
  const _0x2ad577 = createEl('div', 'agent-messages'),
    _0x49e6c5 = createEl('div', 'agent-history-popover');
  ((_0x49e6c5.hidden = true), _0x3ad456.append(_0x42864b, _0x2ad577, _0x49e6c5));
  const _0x502f4b = createEl('div', 'agent-quick-actions'),
    _0x117d94 = globalThis.window;
  function _0x282ffb() {
    (_0x502f4b.replaceChildren(),
      [...AGENT_QUICK_ACTIONS, ...readCustomQuickActions(_0x117d94)].forEach((_0x37e950) => {
        const _0xf480c8 = createButton('agent-quick-card', _0x37e950.label, {
          icon:
            _0x37e950.custom === true
              ? iconSvg('wand')
              : _0x37e950.id === 'archive-assets'
                ? iconSvg('grid')
                : _0x37e950.id === 'check-style'
                  ? iconSvg('scan')
                  : iconSvg('flow'),
        });
        ((_0xf480c8.dataset.prompt = _0x37e950.prompt), _0x502f4b.appendChild(_0xf480c8));
      }));
  }
  _0x282ffb();
  const _0x3e0d3d = createEl('div', 'agent-notice');
  _0x3e0d3d.hidden = true;
  const _0x3d0f1e = createEl('div', 'agent-plan-preview');
  _0x3d0f1e.hidden = true;
  const _0x387448 = createEl('div', 'agent-options');
  _0x387448.hidden = true;
  const _0x41e3f4 = createEl('div', 'agent-recovery');
  _0x41e3f4.hidden = true;
  const _0x448ae7 = createEl('div', 'agent-actions');
  _0x448ae7.hidden = true;
  const _0x514b25 = createButton('agent-primary-btn', '确认执行'),
    _0x5d6dd2 = createButton('agent-secondary-btn', '取消');
  _0x448ae7.append(_0x514b25, _0x5d6dd2);
  const _0x75b13f = createEl('form', 'agent-compose'),
    _0x391508 = createEl('div', 'agent-prompt-panel text-prompt-panel'),
    _0x3a2d32 = createEl('div', 'agent-ref-bar node-ref-bar active'),
    _0x30d670 = createAgentPromptAttachmentButton({
      title: '从选中素材添加入参',
      className: 'agent-connect-btn',
    }),
    _0x39baee = createEl('div', 'agent-ref-placeholder', panelText('addReference')),
    _0x3a0739 = createEl('div', 'ref-thumb-container agent-input-ref-list');
  (_0x3a0739.setAttribute('role', 'list'), _0x3a2d32.append(_0x30d670, _0x39baee, _0x3a0739));
  const _0x4404ec = createEl('div', 'agent-input-wrapper prompt-input-wrapper'),
    _0x5b769d = createEl('div', 'agent-compose-input prompt-textarea custom-textarea');
  ((_0x5b769d.contentEditable = 'true'),
    (_0x5b769d.spellcheck = false),
    (_0x5b769d.dataset.placeholder = '描述创意或需求，/ 使用技能，@ 引用参考'),
    _0x4404ec.appendChild(_0x5b769d));
  const _0x55879f = createEl('div', 'agent-compose-footer prompt-panel-footer'),
    _0x2eb9b6 = createEl('div', 'agent-compose-left'),
    _0x2ccb22 = createEl('div', 'agent-menu-wrap'),
    _0x40f1e2 = createButton('agent-round-btn', '', { title: '添加', icon: iconSvg('plus') }),
    _0x551b50 = createEl('div', 'agent-floating-menu agent-add-menu');
  ([
    ['canvas', '从画布添加', 'grid'],
    ['upload', '上传素材', 'upload'],
    ['custom', '自定义快捷用法', 'wand'],
  ].forEach(([_0x3b2f5f, _0x4ba138, _0x462101]) => {
    const _0x69265e = createButton('agent-menu-item', _0x4ba138, { icon: iconSvg(_0x462101) });
    ((_0x69265e.dataset.placeholderAction = _0x3b2f5f), _0x551b50.appendChild(_0x69265e));
  }),
    _0x2ccb22.append(_0x40f1e2, _0x551b50));
  const _0x4bd2ef = createEl('input', 'agent-upload-input');
  ((_0x4bd2ef.type = 'file'), (_0x4bd2ef.accept = 'image/*,video/*,audio/*'), (_0x4bd2ef.multiple = false));
  const _0x3244f6 = createEl('div', 'agent-menu-wrap agent-model-wrap img-model-wrap'),
    _0x588b5a = _0x23cce3?.getSettings?.() || {},
    _0x485a45 = createButton('agent-pill-btn agent-model-btn img-model-btn-trigger', '', {
      title: '模型选择',
    }),
    _0x1e58a9 = createEl('span', 'agent-model-icon-slot'),
    _0x16b345 = createEl('span', 'agent-model-label'),
    _0x39fc32 = createEl('span', 'agent-caret');
  ((_0x39fc32.innerHTML =
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'),
    _0x485a45.append(_0x1e58a9, _0x16b345, _0x39fc32));
  const _0x18e983 = createEl('div', 'floating-menu img-model-menu node-model-menu agent-model-menu');
  ((_0x18e983.innerHTML = buildTextProviderMenuGroupsHTML(_0x588b5a.model || '')),
    _0x3244f6.append(_0x485a45, _0x18e983),
    updateModelTrigger(_0x485a45, _0x588b5a));
  const _0x329684 = createEl('div', 'agent-menu-wrap'),
    _0x3e25a7 = createButton('agent-pill-btn agent-mode-btn', '', {
      title: 'Agent 模式',
      icon: iconSvg('mode'),
    }),
    _0x11f39c = createEl('span', 'agent-mode-label', getAgentExecutionModeLabel(_0x588b5a.executionMode)),
    _0x2655bb = createEl('span', 'agent-caret');
  ((_0x2655bb.innerHTML =
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'),
    _0x3e25a7.append(_0x11f39c, _0x2655bb));
  const _0x583a1b = createEl('div', 'agent-floating-menu agent-mode-menu');
  ([
    ['manual', '手动确认'],
    ['auto', '自动执行'],
  ].forEach(([_0x44fa48, _0x3c4316]) => {
    const _0x36ff83 = createButton('agent-menu-item', _0x3c4316, { icon: iconSvg('check') });
    ((_0x36ff83.dataset.executionMode = _0x44fa48),
      _0x36ff83.classList.toggle(
        'active',
        normalizeAgentExecutionMode(_0x588b5a.executionMode) === _0x44fa48,
      ),
      _0x583a1b.appendChild(_0x36ff83));
  }),
    _0x329684.append(_0x3e25a7, _0x583a1b),
    (_0x329684.hidden = true),
    _0x2eb9b6.append(_0x2ccb22, _0x3244f6));
  const _0x2ec7ea = createButton('agent-send-btn', '', { title: '发送', icon: iconSvg('send') });
  ((_0x2ec7ea.type = 'submit'),
    _0x55879f.append(_0x2eb9b6, _0x2ec7ea),
    _0x391508.append(_0x3a2d32, _0x4404ec, _0x55879f),
    _0x75b13f.append(_0x502f4b, _0x3d0f1e, _0x387448, _0x41e3f4, _0x448ae7, _0x391508, _0x4bd2ef),
    _0x3772fc.append(_0x33ec09, _0x37512b, _0x3ad456, _0x75b13f),
    root.appendChild(_0x3772fc),
    (document?.body || root).appendChild(_0x3e0d3d),
    bindNodeSubmenus(_0x18e983));
  let _0x1806c2 = false;
  const _0x4a9290 = readStoredSidebarWidth(_0x117d94);
  _0x4a9290 &&
    document?.body?.style?.setProperty?.('--agent-sidebar-width', clampAgentSidebarWidth(_0x4a9290) + 'px');
  function _0x1fa11d(_0xb97b28) {
    ((_0x3e0d3d.textContent = String(_0xb97b28 || '')), (_0x3e0d3d.hidden = !_0x3e0d3d.textContent));
  }
  let _0x5827f0 = false,
    _0x308cce = [],
    _0x3ead2f = false,
    _0xeda7f = null;
  function _0x940313(_0x111dae = {}) {
    if (_0x111dae.thumbUrl) {
      const _0x133e90 = createEl('img', 'ref-thumb-media agent-input-ref-media');
      return (
        (_0x133e90.src = _0x111dae.thumbUrl),
        (_0x133e90.alt = _0x111dae.label || _0x111dae.nodeId || ''),
        (_0x133e90.draggable = false),
        _0x133e90
      );
    }
    const _0x2ebed9 = createEl(
      'div',
      'ref-thumb-media ref-thumb-fallback agent-input-ref-fallback',
      String(_0x111dae.kind || 'node')
        .slice(0, 3)
        .toUpperCase(),
    );
    return (_0x2ebed9.setAttribute('aria-hidden', 'true'), _0x2ebed9);
  }
  function _0x4afc56() {
    (_0x3a0739.replaceChildren(),
      _0x308cce.forEach((_0x5b49d2) => {
        const _0x4f251c = createEl('div', 'ref-thumb-wrap agent-input-ref-thumb'),
          _0x128c2a = String(_0x5b49d2.label || _0x5b49d2.name || _0x5b49d2.nodeId || '').trim();
        ((_0x4f251c.title = _0x128c2a),
          _0x4f251c.setAttribute('aria-label', _0x128c2a),
          _0x4f251c.setAttribute('role', 'listitem'),
          (_0x4f251c.dataset.inputRefId = _0x5b49d2.nodeId),
          _0x4f251c.appendChild(_0x940313(_0x5b49d2)));
        const _0x2dc318 = createEl('button', 'ref-thumb-delete agent-input-ref-remove', 'x');
        ((_0x2dc318.type = 'button'),
          (_0x2dc318.title = 'Remove reference'),
          _0x2dc318.setAttribute('aria-label', 'Remove reference'),
          (_0x2dc318.dataset.inputRefRemove = _0x5b49d2.nodeId),
          _0x4f251c.appendChild(_0x2dc318),
          _0x3a0739.appendChild(_0x4f251c));
      }),
      _0x3a2d32.classList.add('active'),
      _0x3a2d32.classList.toggle('has-input-refs', _0x308cce.length > 0),
      (_0x39baee.hidden = _0x308cce.length > 0));
  }
  function _0x6004d4(_0x410ea2 = []) {
    const _0x2519ee = new Map(_0x308cce.map((_0x132939) => [_0x132939.nodeId, _0x132939]));
    return (
      _0x410ea2.filter(Boolean).forEach((_0x3e8f80) => {
        if (!_0x3e8f80.nodeId || _0x2519ee.has(_0x3e8f80.nodeId)) return;
        _0x2519ee.set(_0x3e8f80.nodeId, _0x3e8f80);
      }),
      (_0x308cce = Array.from(_0x2519ee.values()).slice(0, AGENT_INPUT_REF_LIMIT)),
      _0x4afc56(),
      _0x308cce.length
    );
  }
  function _0x32b40c() {
    ((_0x308cce = []), _0x4afc56());
  }
  function _0x19c26f() {
    return document?.getElementById?.('v2-wrap') || null;
  }
  function _0x19ea11() {
    return document?.documentElement || globalThis.document?.documentElement || null;
  }
  function _0x508876() {
    try {
      return createLinkCursor({ size: getCursorSize() });
    } catch {
      return createLinkCursor({ size: 'small' });
    }
  }
  function _0x3d6bfb() {
    (_0xeda7f?.classList?.remove?.('agent-material-pick-hover'), (_0xeda7f = null));
  }
  function _0x5ccbdd(_0x325b74) {
    if (_0xeda7f === _0x325b74) return;
    (_0x3d6bfb(), (_0xeda7f = _0x325b74 || null), _0xeda7f?.classList?.add?.('agent-material-pick-hover'));
  }
  function _0x565b53({ noticeText: noticeText = '' } = {}) {
    if (!_0x3ead2f) return;
    ((_0x3ead2f = false),
      _0x3d6bfb(),
      _0x3772fc.classList.remove('is-material-picking'),
      _0x30d670.classList.remove('is-picking', 'is-connecting-active'),
      _0x30d670.setAttribute('aria-pressed', 'false'));
    const _0x2be9b4 = _0x19c26f();
    _0x2be9b4?.classList?.remove?.('is-connecting', 'agent-material-pick-mode');
    const _0x437b04 = _0x19ea11();
    (_0x437b04?.classList?.remove?.('is-connecting-mode'),
      _0x437b04?.style?.removeProperty?.('--connect-cursor'),
      document?.removeEventListener?.('click', _0x40f470, true),
      document?.removeEventListener?.('pointermove', _0x33326a, true),
      document?.removeEventListener?.('keydown', _0xd9d504, true));
    if (noticeText) _0x1fa11d(noticeText);
  }
  function _0x2f0029({ toggle: toggle = true } = {}) {
    if (_0x3ead2f) {
      toggle && _0x565b53({ noticeText: panelText('materialPickCancelled') });
      return;
    }
    ((_0x3ead2f = true),
      _0x3772fc.classList.add('is-material-picking'),
      _0x30d670.classList.add('is-picking', 'is-connecting-active'),
      _0x30d670.setAttribute('aria-pressed', 'true'));
    const _0x37ab5f = _0x19c26f();
    _0x37ab5f?.classList?.add?.('is-connecting', 'agent-material-pick-mode');
    const _0x571c20 = _0x19ea11();
    (_0x571c20?.classList?.add?.('is-connecting-mode'),
      _0x571c20?.style?.setProperty?.('--connect-cursor', _0x508876()),
      document?.addEventListener?.('click', _0x40f470, true),
      document?.addEventListener?.('pointermove', _0x33326a, true),
      document?.addEventListener?.('keydown', _0xd9d504, true),
      _0x1fa11d(panelText('materialPickStarted')));
  }
  function _0x414e0e(_0x6e494e) {
    const _0x24c28b = _0x6e494e?.closest?.('.v2-node') || null,
      _0x2129ce = String(_0x24c28b?.id || '').trim();
    if (!_0x2129ce) return { nodeEl: null, node: null, ref: null };
    const _0xbd98d7 = getStoreState(store).nodes?.[_0x2129ce] || null,
      _0xe9013c = normalizeAgentInputRefFromNode(_0xbd98d7, { source: 'canvas-pick' });
    return { nodeEl: _0x24c28b, node: _0xbd98d7, ref: _0xe9013c };
  }
  function _0x33326a(_0xcc2c12) {
    if (!_0x3ead2f || _0x3772fc.contains(_0xcc2c12.target)) return;
    const { nodeEl: _0x262350, ref: _0x3fde78 } = _0x414e0e(_0xcc2c12.target);
    _0x5ccbdd(_0x262350 && isAgentMaterialRef(_0x3fde78) ? _0x262350 : null);
  }
  function _0x40f470(_0x2760bd) {
    if (!_0x3ead2f) return;
    if (_0x3772fc.contains(_0x2760bd.target)) return;
    const { ref: _0x3160f9 } = _0x414e0e(_0x2760bd.target);
    if (!_0x3160f9) return;
    (_0x2760bd.preventDefault?.(), _0x2760bd.stopPropagation?.(), _0x2760bd.stopImmediatePropagation?.());
    if (!isAgentMaterialRef(_0x3160f9)) {
      _0x1fa11d(panelText('materialPickUnsupported'));
      return;
    }
    (_0x6004d4([_0x3160f9]), _0x1fa11d(formatPanelText('attachSelected', { count: 1 })));
  }
  function _0xd9d504(_0x2f569f) {
    if (!_0x3ead2f || _0x2f569f.key !== 'Escape') return;
    (_0x2f569f.preventDefault?.(),
      _0x2f569f.stopPropagation?.(),
      _0x565b53({ noticeText: panelText('materialPickCancelled') }));
  }
  function _0x32e851() {
    const _0x463a0d = getStoreState(store),
      _0x4b0cbc = Array.isArray(_0x463a0d.selectedNodeIds)
        ? _0x463a0d.selectedNodeIds.map((_0x2fecf2) => String(_0x2fecf2 || '')).filter(Boolean)
        : [],
      _0x140eae = _0x4b0cbc
        .map((_0x567f65) =>
          normalizeAgentInputRefFromNode(_0x463a0d.nodes?.[_0x567f65], { source: 'canvas-selection' }),
        )
        .filter(Boolean),
      _0x55961a = _0x140eae.filter(isAgentMaterialRef);
    if (_0x55961a.length === 0) return (_0x1fa11d(panelText('attachSelectedEmpty')), 0);
    const _0x5dfd6f = _0x308cce.length;
    _0x6004d4(_0x55961a);
    const _0x508851 = Math.max(0, _0x308cce.length - _0x5dfd6f);
    return (
      _0x1fa11d(formatPanelText('attachSelected', { count: _0x508851 || _0x55961a.length })),
      _0x5b769d.focus(),
      _0x508851 || _0x55961a.length
    );
  }
  function _0x292f92({ toggle: toggle = true } = {}) {
    if (_0x3ead2f) return (_0x2f0029({ toggle: toggle }), 0);
    const _0x1a92c5 = _0x32e851();
    if (_0x1a92c5 > 0) return _0x1a92c5;
    return (_0x2f0029({ toggle: false }), 0);
  }
  function _0x3e46b8() {
    const _0xdc45ae = getEditorText(_0x5b769d);
    if (!_0xdc45ae) {
      (_0x1fa11d(panelText('customShortcutEmpty')), _0x5b769d.focus());
      return;
    }
    const _0x493ec8 = readCustomQuickActions(_0x117d94),
      _0x4fb628 = _0x493ec8.filter((_0x28a841) => _0x28a841.prompt !== _0xdc45ae),
      _0x26d784 = writeCustomQuickActions(
        [
          {
            id: 'custom-' + Date.now(),
            label: truncateUiText(_0xdc45ae, 18),
            prompt: _0xdc45ae,
            custom: true,
          },
          ..._0x4fb628,
        ],
        _0x117d94,
      );
    return (
      _0x282ffb(),
      (_0x502f4b.hidden = _0x2ad577.children.length > 0),
      _0x1fa11d(panelText('customShortcutSaved')),
      _0x26d784
    );
  }
  async function _0x3fadf3(_0x752924) {
    if (!_0x752924) return;
    if (typeof uploadMaterial !== 'function') {
      _0x1fa11d(panelText('uploadMaterialMissing'));
      return;
    }
    _0x5d33bc(true);
    try {
      const _0x3c6a9b = await uploadMaterial(_0x752924),
        _0x167f19 = Array.isArray(_0x3c6a9b) ? _0x3c6a9b : [_0x3c6a9b],
        _0x23c7f6 = _0x167f19
          .map((_0x440c61) => normalizeAgentInputRefFromNode(_0x440c61, { source: 'upload' }))
          .filter(Boolean);
      if (_0x23c7f6.length === 0) {
        _0x1fa11d(panelText('uploadMaterialFailed'));
        return;
      }
      (_0x6004d4(_0x23c7f6), _0x1fa11d(panelText('uploadMaterialReady')), _0x5b769d.focus());
    } catch (_0x27b5ab) {
      _0x1fa11d(_0x27b5ab?.message || panelText('uploadMaterialFailed'));
    } finally {
      _0x5d33bc(false);
    }
  }
  function _0x573c07() {
    return _0x5c09b1?.sessionStore?.getHistory?.() || _0x5c09b1?.sessionStore?.getState?.().history || [];
  }
  function _0x48dae1() {
    (renderPlanPreview(_0x3d0f1e, null),
      _0x387448.replaceChildren(),
      (_0x387448.hidden = true),
      _0x41e3f4.replaceChildren(),
      (_0x41e3f4.hidden = true),
      (_0x448ae7.hidden = true));
  }
  function _0x89a400({ preserveNotice: preserveNotice = false } = {}) {
    const _0x43c88b =
      _0x5c09b1?.getActiveConversation?.() ||
      _0x5c09b1?.sessionStore?.getState?.().activeConversation ||
      null;
    if (_0x43c88b?.hasUnfinishedOperation) {
      _0x1fa11d(panelText('unfinishedNotice'));
      return;
    }
    if (!preserveNotice) _0x1fa11d('');
  }
  function _0x388e7f({ preserveNotice: preserveNotice = false } = {}) {
    (_0x48dae1(), renderMessages(_0x2ad577, _0x573c07()));
    const _0x1bdc98 = _0x2ad577.children.length > 0;
    ((_0x42864b.hidden = _0x1bdc98),
      (_0x502f4b.hidden = _0x1bdc98),
      _0x89a400({ preserveNotice: preserveNotice }));
  }
  function _0x5d33bc(_0x265e8e) {
    ((_0x1806c2 = _0x265e8e === true),
      (_0x2ec7ea.disabled = _0x1806c2),
      (_0x514b25.disabled = _0x1806c2),
      (_0x5d6dd2.disabled = _0x1806c2),
      _0x387448.querySelectorAll?.('.agent-option-btn')?.forEach((_0x4dc938) => {
        _0x4dc938.disabled = _0x1806c2;
      }),
      _0x41e3f4.querySelectorAll?.('.agent-recovery-btn')?.forEach((_0x37b7f9) => {
        _0x37b7f9.disabled = _0x1806c2;
      }),
      _0x3772fc.classList.toggle('is-busy', _0x1806c2));
  }
  function _0xca8b8c(_0x308717) {
    (_0x3772fc.classList.toggle('is-open', _0x308717),
      _0x3772fc.setAttribute('aria-hidden', _0x308717 ? 'false' : 'true'),
      document?.body?.classList?.toggle('agent-sidebar-open', _0x308717),
      document?.body?.classList?.toggle('agent-sidebar-collapsed', _0x308717 && _0x5827f0),
      fabBtnEl.classList.toggle('is-agent-open', _0x308717));
    if (_0x308717) {
      if (!_0x5827f0) _0x5b769d.focus();
      _0x89a400({ preserveNotice: true });
    } else (_0x565b53(), closeFloatingMenus(_0x3772fc), _0x1fa11d(''));
  }
  function _0x30997d() {
    _0xca8b8c(!_0x3772fc.classList.contains('is-open'));
  }
  function _0x3f19d9(_0x19d7ec) {
    ((_0x5827f0 = _0x19d7ec === true),
      _0x3772fc.classList.toggle('is-collapsed', _0x5827f0),
      _0x572be8.setAttribute('aria-expanded', _0x5827f0 ? 'false' : 'true'),
      (_0x572be8.title = _0x5827f0 ? '展开' : '折叠'),
      _0x572be8.setAttribute('aria-label', _0x5827f0 ? '展开' : '折叠'),
      document?.body?.classList?.toggle(
        'agent-sidebar-collapsed',
        _0x5827f0 && _0x3772fc.classList.contains('is-open'),
      ));
    if (!_0x5827f0 && _0x3772fc.classList.contains('is-open')) _0x5b769d.focus();
    _0x5827f0 && (_0x565b53(), closeFloatingMenus(_0x3772fc), _0x1fa11d(''));
  }
  function _0x50c648(_0x48ee8f, { persist: persist = false } = {}) {
    const _0x220b02 = clampAgentSidebarWidth(_0x48ee8f);
    document?.body?.style?.setProperty?.('--agent-sidebar-width', _0x220b02 + 'px');
    if (persist) writeStoredSidebarWidth(_0x220b02, _0x117d94);
    return _0x220b02;
  }
  function _0x27a09c(_0x18c8cb) {
    (_0x18c8cb.preventDefault?.(), _0x18c8cb.stopPropagation?.());
    const _0x4c97db = Number(_0x18c8cb.clientX),
      _0x484194 = _0x3772fc.getBoundingClientRect?.().width || _0x3772fc.offsetWidth || 0;
    if (!Number.isFinite(_0x4c97db) || !_0x484194) return;
    document?.body?.classList?.add?.('agent-sidebar-resizing');
    const _0x2eac52 = (_0x21e063) => {
        const _0x4b5352 = Number(_0x21e063.clientX);
        if (!Number.isFinite(_0x4b5352)) return;
        _0x50c648(_0x484194 + (_0x4c97db - _0x4b5352));
      },
      _0x5b7606 = (_0x18badb) => {
        (document?.removeEventListener?.('pointermove', _0x2eac52),
          document?.removeEventListener?.('pointerup', _0x5b7606),
          document?.body?.classList?.remove?.('agent-sidebar-resizing'));
        const _0x2bdf6b = Number(_0x18badb.clientX);
        Number.isFinite(_0x2bdf6b) && _0x50c648(_0x484194 + (_0x4c97db - _0x2bdf6b), { persist: true });
      };
    (document?.addEventListener?.('pointermove', _0x2eac52),
      document?.addEventListener?.('pointerup', _0x5b7606));
  }
  function _0x1be514() {
    (_0x565b53(),
      _0x5c09b1.startNewConversation?.(),
      _0x388e7f({ preserveNotice: true }),
      setEditorText(_0x5b769d, ''),
      _0x32b40c(),
      (_0x49e6c5.hidden = true),
      _0x1fa11d('已新建对话。'));
  }
  function _0x5379ca(_0x5aacff) {
    if (!_0x5c09b1.switchConversation?.(_0x5aacff)) return;
    (_0x565b53(), setEditorText(_0x5b769d, ''), _0x32b40c(), (_0x49e6c5.hidden = true), _0x388e7f());
  }
  function _0xc25e74(_0x1b77d2) {
    (_0x565b53(),
      _0x5c09b1.deleteConversation?.(_0x1b77d2),
      setEditorText(_0x5b769d, ''),
      _0x32b40c(),
      _0x388e7f(),
      renderHistory(_0x49e6c5, _0x5c09b1, { onSelect: _0x5379ca, onDelete: _0xc25e74 }));
  }
  function _0x202ee9(_0x5dd633) {
    if (_0x5dd633?.reply) appendMessage(_0x2ad577, 'assistant', _0x5dd633.reply);
    _0x42864b.hidden = _0x2ad577.children.length > 0;
    const _0x13ddcc = _0x5dd633?.status === 'need_confirmation' ? _0x5dd633?.plan || null : null;
    (renderPlanPreview(_0x3d0f1e, _0x13ddcc),
      renderClarification(_0x387448, _0x5dd633, _0x5c09b1, _0x202ee9, _0x5d33bc, {
        onAnswer: (_0x3e9003) => {
          if (!_0x3e9003) return;
          (appendMessage(_0x2ad577, 'user', _0x3e9003), (_0x42864b.hidden = true));
        },
        onWaitingStart: () => appendWaitingMessage(_0x2ad577),
        onWaitingEnd: removeWaitingMessage,
      }),
      renderRecovery(_0x41e3f4, _0x5dd633, _0x5c09b1, _0x202ee9, _0x5d33bc, {
        editor: _0x5b769d,
        setNotice: _0x1fa11d,
      }),
      (_0x448ae7.hidden = _0x5dd633?.status !== 'need_confirmation'));
  }
  async function _0x441b20() {
    const _0x245f5c = getEditorText(_0x5b769d);
    if (!_0x245f5c) return;
    (_0x1fa11d(''), _0x565b53());
    const _0x48e5d4 = _0x308cce.slice();
    (_0x32b40c(),
      setEditorText(_0x5b769d, ''),
      (_0x502f4b.hidden = true),
      appendMessage(_0x2ad577, 'user', _0x245f5c),
      (_0x42864b.hidden = true),
      _0x5d33bc(true));
    const _0xf6b2f8 = appendWaitingMessage(_0x2ad577);
    try {
      _0x202ee9(await _0x5c09b1.handleUserMessage(_0x245f5c, { inputRefs: _0x48e5d4 }));
    } catch (_0x202f9c) {
      appendMessage(_0x2ad577, 'assistant', _0x202f9c?.message || 'Agent failed.');
    } finally {
      (removeWaitingMessage(_0xf6b2f8), _0x5d33bc(false));
    }
  }
  return (
    fabBtnEl.addEventListener('click', (_0x3fdda5) => {
      (_0x3fdda5.stopPropagation(), _0x30997d());
    }),
    _0x2ec94e.addEventListener('click', () => _0xca8b8c(false)),
    _0x572be8.addEventListener('click', () => _0x3f19d9(!_0x5827f0)),
    _0x83ac16.addEventListener('click', _0x1be514),
    _0x21b5dc.addEventListener('click', () => {
      const _0x29cbe1 = !_0x49e6c5.hidden;
      ((_0x49e6c5.hidden = _0x29cbe1),
        !_0x29cbe1 && renderHistory(_0x49e6c5, _0x5c09b1, { onSelect: _0x5379ca, onDelete: _0xc25e74 }));
    }),
    _0x502f4b.addEventListener('click', (_0x223c40) => {
      const _0x12feba = _0x223c40.target?.closest?.('.agent-quick-card');
      if (!_0x12feba) return;
      (setEditorText(_0x5b769d, _0x12feba.dataset.prompt || _0x12feba.textContent || ''), _0x5b769d.focus());
    }),
    _0x40f1e2.addEventListener('click', (_0xc1b755) => {
      (_0xc1b755.stopPropagation(), setMenuOpen(_0x551b50, !_0x551b50.classList.contains('show'), _0x3772fc));
    }),
    _0x551b50.addEventListener('click', (_0x211dcb) => {
      const _0x481b79 = _0x211dcb.target?.closest?.('[data-placeholder-action]');
      if (!_0x481b79) return;
      _0x211dcb.stopPropagation?.();
      const _0x4ebefd = _0x481b79.dataset.placeholderAction;
      if (_0x4ebefd === 'canvas') _0x292f92({ toggle: false });
      else {
        if (_0x4ebefd === 'upload')
          ((_0x4bd2ef.value = ''), _0x4bd2ef.click?.(), _0x1fa11d(panelText('uploadMaterial')));
        else _0x4ebefd === 'custom' && _0x3e46b8();
      }
      _0x551b50.classList.remove('show');
    }),
    _0x30d670.addEventListener('click', (_0x24529a) => {
      (_0x24529a.stopPropagation?.(), _0x292f92());
    }),
    _0x30d670.addEventListener('keydown', (_0x4e3d4e) => {
      if (_0x4e3d4e.key !== 'Enter' && _0x4e3d4e.key !== ' ') return;
      (_0x4e3d4e.preventDefault?.(), _0x292f92());
    }),
    _0x3a0739.addEventListener('click', (_0x4bdae1) => {
      const _0x3bef0d = _0x4bdae1.target?.closest?.('[data-input-ref-remove]'),
        _0x73f99e = String(_0x3bef0d?.dataset?.inputRefRemove || '').trim();
      if (!_0x73f99e) return;
      ((_0x308cce = _0x308cce.filter((_0x3f9787) => _0x3f9787.nodeId !== _0x73f99e)), _0x4afc56());
    }),
    _0x4bd2ef.addEventListener('change', () => {
      const _0x3208c2 = _0x4bd2ef.files?.[0];
      (_0x3fadf3(_0x3208c2), (_0x4bd2ef.value = ''));
    }),
    _0x485a45.addEventListener('click', (_0xfa7aab) => {
      (_0xfa7aab.stopPropagation(), setMenuOpen(_0x18e983, !_0x18e983.classList.contains('show'), _0x3772fc));
    }),
    _0x18e983.addEventListener('click', (_0x17f180) => {
      const _0x2b95b8 = _0x17f180.target?.closest?.('.floating-menu-item');
      if (!_0x2b95b8 || _0x2b95b8.hasAttribute('data-node-menu-submenu')) return;
      const _0x522fd1 = _0x2b95b8.dataset.value || '';
      if (!_0x522fd1 || _0x2b95b8.dataset.disabled === 'true') return;
      const _0x17082f = commitAgentModelSelection(_0x23cce3, {
        model: _0x522fd1,
        provider: _0x2b95b8.dataset.provider || '',
      });
      (_0x18e983
        .querySelectorAll('.floating-menu-item')
        .forEach((_0x623d8c) => _0x623d8c.classList.remove('active')),
        _0x2b95b8.classList.add('active'),
        _0x18e983.classList.remove('show'),
        closeNodeFooterMenus(_0x18e983),
        updateModelTrigger(_0x485a45, _0x17082f || { model: _0x522fd1 }));
    }),
    _0x3e25a7.addEventListener('click', (_0x4705a5) => {
      if (_0x329684.hidden) return;
      (_0x4705a5.stopPropagation(), setMenuOpen(_0x583a1b, !_0x583a1b.classList.contains('show'), _0x3772fc));
    }),
    _0x583a1b.addEventListener('click', (_0x4c2da9) => {
      const _0x49ce4c = _0x4c2da9.target?.closest?.('[data-execution-mode]');
      if (!_0x49ce4c) return;
      const _0x4d76bc = normalizeAgentExecutionMode(_0x49ce4c.dataset.executionMode),
        _0x58431d = _0x23cce3?.updateSettings?.({ executionMode: _0x4d76bc }) || { executionMode: _0x4d76bc };
      ((_0x11f39c.textContent = getAgentExecutionModeLabel(_0x58431d.executionMode)),
        _0x583a1b
          .querySelectorAll('[data-execution-mode]')
          .forEach((_0x49b937) =>
            _0x49b937.classList.toggle('active', _0x49b937.dataset.executionMode === _0x58431d.executionMode),
          ),
        _0x583a1b.classList.remove('show'),
        _0x1fa11d('执行模式已保存；本轮不会改变确认策略。'));
    }),
    _0x75b13f.addEventListener('submit', (_0x5dbdb0) => {
      _0x5dbdb0.preventDefault();
      if (_0x1806c2) return;
      _0x441b20();
    }),
    _0x5b769d.addEventListener('keydown', (_0x48a865) => {
      if (_0x48a865.key === 'Enter' && !_0x48a865.shiftKey) {
        _0x48a865.preventDefault();
        if (_0x1806c2) return;
        _0x441b20();
      }
    }),
    _0x3772fc.addEventListener('pointerdown', (_0x1efacf) => _0x1efacf.stopPropagation()),
    _0x3772fc.addEventListener('click', (_0x2f07d8) => {
      if (isAgentMenuSurface(_0x2f07d8.target)) return;
      closeFloatingMenus(_0x3772fc);
    }),
    document?.addEventListener?.('click', (_0x3faba7) => {
      if (!_0x3772fc.contains(_0x3faba7.target)) closeFloatingMenus(_0x3772fc);
    }),
    _0x33ec09.addEventListener('pointerdown', _0x27a09c),
    _0x33ec09.addEventListener('keydown', (_0x507b7e) => {
      if (_0x507b7e.key !== 'ArrowLeft' && _0x507b7e.key !== 'ArrowRight') return;
      _0x507b7e.preventDefault();
      const _0x1d5f52 = _0x3772fc.getBoundingClientRect?.().width || _0x3772fc.offsetWidth || 0,
        _0x526a45 = _0x507b7e.key === 'ArrowLeft' ? 24 : -24;
      _0x50c648(_0x1d5f52 + _0x526a45, { persist: true });
    }),
    _0x514b25.addEventListener('click', async () => {
      if (_0x1806c2) return;
      const _0x5ae3bb = panelText('confirmUserMessage');
      (appendMessage(_0x2ad577, 'user', _0x5ae3bb),
        (_0x42864b.hidden = true),
        (_0x448ae7.hidden = true),
        _0x5d33bc(true));
      const _0x103808 = appendWaitingMessage(_0x2ad577);
      try {
        _0x202ee9(await _0x5c09b1.confirmPendingPlan({ displayAnswer: _0x5ae3bb }));
      } catch (_0x2dfd8c) {
        appendMessage(_0x2ad577, 'assistant', _0x2dfd8c?.message || 'Agent confirmation failed.');
      } finally {
        (removeWaitingMessage(_0x103808), _0x5d33bc(false));
      }
    }),
    _0x5d6dd2.addEventListener('click', () => {
      if (_0x1806c2) return;
      ((_0x448ae7.hidden = true), _0x202ee9(_0x5c09b1.cancelPendingPlan()));
    }),
    _0x388e7f(),
    {
      panel: _0x3772fc,
      open: () => _0xca8b8c(true),
      close: () => _0xca8b8c(false),
      toggle: _0x30997d,
      collapse: () => _0x3f19d9(true),
      expand: () => _0x3f19d9(false),
      reset: _0x1be514,
      setWidth: (_0x419eaf) => _0x50c648(_0x419eaf, { persist: true }),
    }
  );
}
export {
  formatAgentAssistantMarkdown,
} from './agentConversationPresentation.js';
