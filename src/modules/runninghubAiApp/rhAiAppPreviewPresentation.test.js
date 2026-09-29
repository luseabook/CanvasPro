import test from 'node:test';
import assert from 'node:assert/strict';

import { createRhAiAppPreviewPresentation } from './rhAiAppPreviewPresentation.js';

function makeEl(over = {}) {
  const classes = new Set(
    String(over.className || '')
      .split(/\s+/)
      .filter(Boolean),
  );
  const attrs = {};
  const log = [];
  let removals = 0;
  return {
    tag: over.tag || 'div',
    dataset: { ...(over.dataset || {}) },
    attrs,
    log,
    hidden: 'hidden' in over ? over.hidden : undefined,
    innerHTML: 'innerHTML' in over ? over.innerHTML : '',
    outerHTML: 'outerHTML' in over ? over.outerHTML : '',
    textContent: 'textContent' in over ? over.textContent : '',
    className: over.className || '',
    children: over.children || [],
    removals: () => removals,
    classes: () => [...classes],
    classList: {
      add(...names) {
        names.forEach((name) => classes.add(name));
      },
      remove(...names) {
        names.forEach((name) => classes.delete(name));
      },
      contains(name) {
        return classes.has(name);
      },
      toggle(name, force) {
        const on = force === undefined ? !classes.has(name) : force === true;
        if (on) classes.add(name);
        else classes.delete(name);
        return on;
      },
    },
    setAttribute(name, value) {
      attrs[name] = String(value);
    },
    removeAttribute(name) {
      delete attrs[name];
    },
    getAttribute(name) {
      return name in attrs ? attrs[name] : null;
    },
    querySelector(selector) {
      return over.queries?.[selector] ?? null;
    },
    querySelectorAll(selector) {
      return over.queryAll?.[selector] ?? [];
    },
    closest(selector) {
      return over.closest?.[selector] ?? null;
    },
    insertAdjacentHTML(position, html) {
      log.push(['insertAdjacentHTML', position, html]);
    },
    insertAdjacentElement(position, element) {
      log.push(['insertAdjacentElement', position, element]);
    },
    insertBefore(child, ref) {
      log.push(['insertBefore', child, ref]);
    },
    appendChild(child) {
      log.push(['appendChild', child]);
    },
    remove() {
      removals += 1;
    },
  };
}

function makeState(over = {}) {
  const state = { ...over };
  return {
    state,
    readState: () => state,
    writeState: (patch) => Object.assign(state, patch),
  };
}

function makePrimitives(over = {}) {
  return {
    OUTPUT_KIND_LABELS: { image: '图片', video: '视频' },
    RH_AI_APP_EXIT_MOTION_MS: 180,
    bindUiSchemaFieldControls: () => null,
    buildPreviewUiSchemaNodeData: () => ({}),
    canPreviewPromptBecomeParam: () => false,
    getBundleParamFields: () => [],
    getComponentByIndex: () => null,
    getCustomAiAppComponentIndex: () => null,
    getPreviewComponentDescription: () => '',
    getPreviewInstanceText: () => '',
    getPreviewPromptHelpComponent: () => null,
    normalizeAppName: (name) => String(name || '').trim(),
    normalizeComponentKind: (kind) => String(kind || '').toLowerCase(),
    normalizeKind: (kind) => kind || 'image',
    renderPreviewAdvancedPanelHtml: () => '',
    renderPreviewAppMenuHtml: () => '',
    renderPreviewBatchControlsHtml: () => '',
    renderPreviewHomeParamsHtml: () => '',
    renderPreviewInputComponentsHtml: () => '',
    renderPreviewPromptHelpTipHtml: () => '',
    renderPreviewTypeBarHtml: () => '',
    renderRhAiAppNodePreviewHtml: () => '',
    renderSaveConfigOverwriteMenuHtml: () => '',
    shouldReduceMotion: () => false,
    ...over,
  };
}

const PROMPT_TIP_SELECTOR =
  '.rh-ai-app-preview-prompt-help-tip, .rh-ai-app-preview-description-input--prompt';

test('空状态下所有读状态字段走默认值', () => {
  const { readState, writeState } = makeState();
  const presentation = createRhAiAppPreviewPresentation({ readState, writeState });
  assert.equal(presentation.nodePreviewEl, null);
  assert.deepEqual(presentation.componentDrafts, []);
  assert.equal(presentation.kind, 'image');
  assert.equal(presentation.currentBundle, null);
  assert.equal(presentation.appName, '');
  assert.equal(presentation.previewAppMenuOpen, false);
  assert.equal(presentation.pendingDeleteSavedAppId, '');
  assert.equal(presentation.pendingOverwriteSavedAppId, '');
  assert.equal(presentation.pendingOverwriteIntent, '');
  assert.equal(presentation.componentDraftKey, '');
  assert.equal(presentation.comfyCandidatePickerOpen, false);
  assert.equal(presentation.comfyCandidateSearchText, '');
  assert.equal(presentation.saveConfigMenuEl, null);
  assert.equal(presentation.createConfigMenuEl, null);
});

test('读状态字段按原值返回，布尔字段为严格真值判断', () => {
  const bundle = { id: 'b1' };
  const { readState, writeState } = makeState({
    componentDrafts: [{ id: 'c1' }],
    kind: 'video',
    currentBundle: bundle,
    appName: '模型',
    previewAppMenuOpen: 1,
    comfyCandidatePickerOpen: 'true',
    pendingDeleteSavedAppId: 'd1',
    pendingOverwriteSavedAppId: 'o1',
    pendingOverwriteIntent: 'save',
    componentDraftKey: 'k1',
    comfyCandidateSearchText: 'fox',
  });
  const presentation = createRhAiAppPreviewPresentation({ readState, writeState });
  assert.deepEqual(presentation.componentDrafts, [{ id: 'c1' }]);
  assert.equal(presentation.kind, 'video');
  assert.equal(presentation.currentBundle, bundle);
  assert.equal(presentation.previewAppMenuOpen, false);
  assert.equal(presentation.comfyCandidatePickerOpen, false);
  assert.equal(presentation.pendingOverwriteIntent, 'save');
  assert.equal(presentation.componentDraftKey, 'k1');
  assert.equal(presentation.comfyCandidateSearchText, 'fox');
});

test('componentPickerEl 写入器把元素写回状态', () => {
  const { readState, writeState, state } = makeState();
  const presentation = createRhAiAppPreviewPresentation({ readState, writeState });
  const picker = makeEl();
  presentation.componentPickerEl = picker;
  assert.equal(state.componentPickerEl, picker);
});

test('动作包装器默认返回值与透传行为', () => {
  const { readState, writeState } = makeState();
  const calls = [];
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    actions: {
      getSavedAppsForKind: () => [{ id: 's1' }],
      getSourceMeta: () => ({ label: 'RH 标签' }),
      shouldShowManualComponentPicker: () => 'yes',
      canRemovePreviewParams: () => false,
      canRemovePreviewInputs: () => undefined,
      renderComfyCandidatePicker: (options) => calls.push(options),
      findSavedApp: (id) => ({ id: id }),
      commitPreviewUiSchemaValue: (a, b) => calls.push([a, b]),
    },
  });
  assert.deepEqual(presentation._getSavedAppsForKind(), [{ id: 's1' }]);
  assert.deepEqual(presentation._getSourceMeta(), { label: 'RH 标签' });
  assert.equal(presentation._shouldShowManualComponentPicker(), false);
  assert.equal(presentation._canRemovePreviewParams(), false);
  assert.equal(presentation._canRemovePreviewInputs(), true);
  presentation._renderComfyCandidatePicker({ open: true });
  assert.deepEqual(calls[0], { open: true });
  assert.deepEqual(presentation._findSavedApp('x'), { id: 'x' });
  presentation._commitPreviewUiSchemaValue('f', 'v');
  assert.deepEqual(calls[1], ['f', 'v']);

  const bare = createRhAiAppPreviewPresentation({ readState, writeState });
  assert.deepEqual(bare._getSavedAppsForKind(), []);
  assert.equal(bare._getSourceMeta(), null);
  assert.equal(bare._shouldShowManualComponentPicker(), false);
  assert.equal(bare._canRemovePreviewParams(), true);
  assert.equal(bare._findSavedApp('x'), null);
  assert.equal(bare._renderComfyCandidatePicker({}), undefined);
});

test('_renderNodePreview 组装渲染入参、写入 innerHTML 并接续装饰与绑定', () => {
  const picker = makeEl();
  const previewNode = makeEl();
  const nodePreviewEl = makeEl({
    queries: {
      "[data-role='comfyui-candidate-menu']": picker,
      '.rh-ai-app-preview-node': previewNode,
    },
  });
  const { readState, writeState, state } = makeState({
    nodePreviewEl,
    componentDrafts: [{ id: 'c1' }],
    kind: 'video',
    appName: '模型',
    previewAppMenuOpen: true,
    pendingDeleteSavedAppId: 'd1',
    pendingOverwriteSavedAppId: 'o1',
    pendingOverwriteIntent: 'save',
    componentDraftKey: 'k1',
    comfyCandidatePickerOpen: true,
    comfyCandidateSearchText: 'fox',
    runningHubProfileLabel: '配置 A',
  });
  let payload = null;
  let pickerCall = null;
  let bindCalls = 0;
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    actions: {
      getSavedAppsForKind: () => [{ id: 's1' }],
      getSourceMeta: () => ({ label: 'RH 标签' }),
      shouldShowManualComponentPicker: () => true,
      renderComfyCandidatePicker: (options) => {
        pickerCall = options;
      },
    },
    primitives: makePrimitives({
      renderRhAiAppNodePreviewHtml: (args) => {
        payload = args;
        return '<preview>';
      },
      bindUiSchemaFieldControls: () => {
        bindCalls += 1;
        return () => {};
      },
    }),
    windowObject: {},
    documentObject: {},
  });
  presentation._renderNodePreview('explicit-bundle');
  assert.equal(nodePreviewEl.innerHTML, '<preview>');
  assert.deepEqual(pickerCall, { open: true });
  assert.equal(state.componentPickerEl, picker);
  assert.equal(bindCalls, 1);
  assert.deepEqual(payload, {
    components: [{ id: 'c1' }],
    kind: 'video',
    bundle: 'explicit-bundle',
    appName: '模型',
    savedApps: [{ id: 's1' }],
    isAppMenuOpen: true,
    pendingDeleteSavedAppId: 'd1',
    pendingOverwriteSavedAppId: 'o1',
    pendingOverwriteIntent: 'save',
    sourceLabel: 'RH 标签',
    runningHubProfileLabel: '配置 A',
    showComfyAddPanel: true,
    canAddComfyComponents: true,
    comfyCandidatePickerOpen: true,
    comfyCandidateSearchText: 'fox',
    comfyCandidateEmptyText: '点击添加组件，逐行选择要暴露到节点上的工作流输入。',
    canRemovePreviewParams: true,
    canRemovePreviewInputs: true,
  });
});

test('_renderNodePreview 在没有预览容器时不做任何事', () => {
  const { readState, writeState } = makeState();
  let rendered = false;
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({
      renderRhAiAppNodePreviewHtml: () => {
        rendered = true;
        return '<preview>';
      },
    }),
  });
  assert.equal(presentation._renderNodePreview(), undefined);
  assert.equal(rendered, false);
});

test('_renderNodePreview 缺省 bundle 时取当前 bundle，来源标签回落默认文案', () => {
  const nodePreviewEl = makeEl();
  const bundle = { id: 'cur' };
  const { readState, writeState } = makeState({ nodePreviewEl, currentBundle: bundle });
  let payload = null;
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({
      renderRhAiAppNodePreviewHtml: (args) => {
        payload = args;
        return '<preview>';
      },
    }),
  });
  presentation._renderNodePreview();
  assert.equal(payload.bundle, bundle);
  assert.equal(payload.sourceLabel, 'RH AI应用');
  assert.equal(payload.canAddComfyComponents, false);
});

test('_closePreviewAppMenuElement 在减弱动效下立即移除', () => {
  const { readState, writeState } = makeState();
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({ shouldReduceMotion: () => true }),
    windowObject: {},
  });
  const menu = makeEl();
  assert.equal(presentation._closePreviewAppMenuElement(null), undefined);
  assert.equal(menu.removals(), 0);
  presentation._closePreviewAppMenuElement(menu);
  assert.equal(menu.removals(), 1);
  assert.deepEqual(menu.classes(), []);
});

test('_closePreviewAppMenuElement 正常动效下标记关闭并在延时后移除', () => {
  const timeouts = [];
  const { readState, writeState } = makeState();
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({ RH_AI_APP_EXIT_MOTION_MS: 180 }),
    windowObject: {
      setTimeout: (callback, ms) => {
        timeouts.push([callback, ms]);
        return 1;
      },
    },
  });
  const menu = makeEl();
  presentation._closePreviewAppMenuElement(menu);
  assert.ok(menu.classes().includes('is-closing'));
  assert.equal(menu.getAttribute('aria-hidden'), 'true');
  assert.equal(menu.removals(), 0);
  assert.equal(timeouts.length, 1);
  assert.equal(timeouts[0][1], 180);
  timeouts[0][0]();
  assert.equal(menu.removals(), 1);

  const stale = makeEl();
  presentation._closePreviewAppMenuElement(stale);
  stale.classList.remove('is-closing');
  timeouts[1][0]();
  assert.equal(stale.removals(), 0);
});

test('_patchFooterOverwriteMenu 无元素或意图不匹配时隐藏并清空', () => {
  const { readState, writeState } = makeState({
    pendingOverwriteSavedAppId: 'o1',
    pendingOverwriteIntent: 'save',
  });
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    actions: { findSavedApp: () => ({ id: 'o1' }) },
  });
  assert.equal(presentation._patchFooterOverwriteMenu(null, 'save'), false);

  const mismatch = makeEl({ hidden: false, innerHTML: '<old>' });
  assert.equal(presentation._patchFooterOverwriteMenu(mismatch, 'create'), true);
  assert.equal(mismatch.hidden, true);
  assert.equal(mismatch.getAttribute('aria-hidden'), 'true');
  assert.equal(mismatch.innerHTML, '');

  const missing = makeEl({ hidden: false });
  const notFound = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    actions: { findSavedApp: () => null },
  });
  assert.equal(notFound._patchFooterOverwriteMenu(missing, 'save'), true);
  assert.equal(missing.hidden, true);
});

test('_patchFooterOverwriteMenu 命中时展示渲染后的覆盖菜单', () => {
  const savedApp = { id: 'o1', name: '模型' };
  const { readState, writeState } = makeState({
    pendingOverwriteSavedAppId: 'o1',
    pendingOverwriteIntent: 'save',
  });
  let payload = null;
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    actions: { findSavedApp: () => savedApp },
    primitives: makePrimitives({
      renderSaveConfigOverwriteMenuHtml: (args) => {
        payload = args;
        return '<menu>';
      },
    }),
  });
  const target = makeEl({ hidden: true });
  assert.equal(presentation._patchFooterOverwriteMenu(target, 'save'), true);
  assert.equal(target.hidden, false);
  assert.equal(target.getAttribute('aria-hidden'), 'false');
  assert.equal(target.innerHTML, '<menu>');
  assert.deepEqual(payload, { savedApp, intent: 'save' });
});

test('_patchPreviewAppChrome 关闭菜单时复位标签与展开态并收起旧菜单', () => {
  const trigger = makeEl();
  const label = makeEl({ textContent: '旧' });
  const oldMenu = makeEl();
  const wrap = makeEl({
    queries: {
      '.rh-ai-app-preview-model-trigger': trigger,
      '.img-model-label': label,
      "[data-role='saved-app-menu']": oldMenu,
    },
  });
  const nodePreviewEl = makeEl({
    queries: { '.rh-ai-app-preview-node .img-model-wrap': wrap },
  });
  const { readState, writeState } = makeState({
    nodePreviewEl,
    appName: '  新名字  ',
    previewAppMenuOpen: false,
  });
  const badges = [];
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    actions: { syncRunningHubProfileBadge: (el) => badges.push(el) },
    primitives: makePrimitives({ shouldReduceMotion: () => true }),
    windowObject: {},
  });
  assert.equal(presentation._patchPreviewAppChrome(), true);
  assert.equal(label.textContent, '新名字');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.deepEqual(badges, [wrap]);
  assert.equal(oldMenu.removals(), 1);
});

test('_patchPreviewAppChrome 展开菜单时重建菜单并接在触发器之后', () => {
  const trigger = makeEl();
  const label = makeEl();
  const staleMenu = makeEl();
  const wrap = makeEl({
    queries: {
      '.rh-ai-app-preview-model-trigger': trigger,
      '.img-model-label': label,
      "[data-role='saved-app-menu']": staleMenu,
    },
  });
  const nodePreviewEl = makeEl({
    queries: { '.rh-ai-app-preview-node .img-model-wrap': wrap },
  });
  const { readState, writeState } = makeState({
    nodePreviewEl,
    appName: '模型',
    previewAppMenuOpen: true,
    pendingOverwriteSavedAppId: 'o1',
    pendingOverwriteIntent: 'save',
  });
  let menuPayload = null;
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    actions: {
      getSavedAppsForKind: () => [{ id: 's1' }],
      getSourceMeta: () => ({ label: '来源' }),
    },
    primitives: makePrimitives({
      renderPreviewAppMenuHtml: (args) => {
        menuPayload = args;
        return '<app-menu>';
      },
    }),
  });
  assert.equal(presentation._patchPreviewAppChrome(), true);
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(staleMenu.removals(), 1);
  assert.deepEqual(trigger.log, [['insertAdjacentHTML', 'afterend', '<app-menu>']]);
  assert.deepEqual(menuPayload, {
    appName: '模型',
    savedApps: [{ id: 's1' }],
    isOpen: true,
    pendingDeleteSavedAppId: '',
    pendingOverwriteSavedAppId: 'o1',
    pendingOverwriteIntent: 'save',
    sourceLabel: '来源',
  });
});

test('_patchPreviewAppChrome 找不到模型容器时返回 false', () => {
  const nodePreviewEl = makeEl();
  const { readState, writeState } = makeState({ nodePreviewEl });
  const presentation = createRhAiAppPreviewPresentation({ readState, writeState });
  assert.equal(presentation._patchPreviewAppChrome(), false);
});

test('_patchPreviewPromptArea 设置提示区标记、类型栏与占位文案', () => {
  const prompt = makeEl({ dataset: {} });
  const promptComp = { index: 2, componentKind: 'prompt', label: '提示词' };
  const tipA = makeEl();
  const tipB = makeEl();
  const typebar = makeEl({ className: 'rh-ai-app-preview-typebar' });
  const other = makeEl();
  const input = makeEl({
    children: [typebar, other],
    queries: { '.rh-ai-app-preview-prompt': prompt },
    closest: {},
  });
  const panel = makeEl();
  input.closest = (selector) => (selector === '.rh-ai-app-real-preview-panel' ? panel : null);
  const nodePreviewEl = makeEl({
    queries: { '.rh-ai-app-preview-input': input },
    queryAll: { [PROMPT_TIP_SELECTOR]: [tipA, tipB] },
  });
  const { readState, writeState } = makeState({
    nodePreviewEl,
    componentDrafts: [promptComp],
    kind: 'image',
    currentBundle: { id: 'b1' },
  });
  let typebarPayload = null;
  let helpPayload = null;
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({
      canPreviewPromptBecomeParam: () => true,
      getPreviewPromptHelpComponent: () => null,
      renderPreviewTypeBarHtml: (component, options) => {
        typebarPayload = [component, options];
        return '<typebar>';
      },
      renderPreviewPromptHelpTipHtml: (component, options) => {
        helpPayload = [component, options];
        return '<help>';
      },
    }),
  });
  assert.equal(presentation._patchPreviewPromptArea(), true);
  assert.ok(input.classes().includes('rh-ai-app-preview-prompt-zone'));
  assert.ok(input.classes().includes('rh-ai-app-preview-prompt-target'));
  assert.ok(input.classes().includes('rh-ai-app-preview-draggable'));
  assert.ok(input.classes().includes('rh-ai-app-preview-prompt-draggable'));
  assert.equal(input.dataset.previewZone, 'prompt');
  assert.equal(input.dataset.previewComponentIndex, '2');
  assert.equal(input.dataset.previewDragKind, 'prompt');
  assert.equal(tipA.removals(), 1);
  assert.equal(tipB.removals(), 1);
  assert.equal(typebar.removals(), 1);
  assert.equal(other.removals(), 0);
  assert.deepEqual(prompt.log, [['insertAdjacentHTML', 'beforebegin', '<typebar>']]);
  assert.deepEqual(panel.log, [['insertAdjacentHTML', 'afterbegin', '<help>']]);
  assert.equal(prompt.dataset.placeholder, '填写提示词，按 @ 引用素材，/呼出指令...');
  assert.deepEqual(typebarPayload, [promptComp, { canRemove: true }]);
  assert.deepEqual(helpPayload, [null, { bundle: { id: 'b1' } }]);
});

test('_patchPreviewPromptArea 无提示组件时用出图类型拼占位文案并清标记', () => {
  const prompt = makeEl({ dataset: { previewComponentIndex: '9', previewDragKind: 'prompt' } });
  const input = makeEl({
    children: [],
    queries: { '.rh-ai-app-preview-prompt': prompt },
  });
  input.closest = () => null;
  const nodePreviewEl = makeEl({
    queries: { '.rh-ai-app-preview-input': input },
    queryAll: { [PROMPT_TIP_SELECTOR]: [] },
  });
  const { readState, writeState } = makeState({ nodePreviewEl, componentDrafts: [], kind: 'video' });
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({ OUTPUT_KIND_LABELS: { video: '视频' } }),
  });
  assert.equal(presentation._patchPreviewPromptArea(), true);
  assert.equal(prompt.dataset.placeholder, '描述视频内容，按 @ 引用素材，/呼出指令...');
  assert.equal(input.dataset.previewZone, 'prompt');
  assert.equal('previewComponentIndex' in input.dataset, false);
  assert.equal('previewDragKind' in input.dataset, false);
  assert.equal(prompt.dataset.previewComponentIndex, '9');
  assert.ok(!input.classes().includes('rh-ai-app-preview-prompt-target'));
});

test('_patchPreviewPromptArea 缺输入容器或提示元素时返回 false', () => {
  const nodePreviewEl = makeEl({ queries: {} });
  const { readState, writeState } = makeState({ nodePreviewEl });
  const presentation = createRhAiAppPreviewPresentation({ readState, writeState });
  assert.equal(presentation._patchPreviewPromptArea(), false);
});

test('_patchPreviewActionControls 更新实例槽位与批量槽位', () => {
  const vramLabel = makeEl({ textContent: '旧' });
  const instanceSlot = makeEl({
    hidden: true,
    queries: { '.rh-vram-label': vramLabel },
  });
  const batchSlot = makeEl({ hidden: true, innerHTML: '<old>' });
  const previewNode = makeEl({
    queries: {
      '.ui-schema-instance-slot': instanceSlot,
      '.ui-schema-batch-slot': batchSlot,
    },
  });
  const nodePreviewEl = makeEl({ queries: { '.rh-ai-app-preview-node': previewNode } });
  const { readState, writeState } = makeState({ nodePreviewEl });
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({
      getPreviewInstanceText: () => 'VRAM 8G',
      renderPreviewBatchControlsHtml: () => '<batch>',
    }),
  });
  assert.equal(presentation._patchPreviewActionControls({ id: 'b1' }), true);
  assert.equal(instanceSlot.hidden, false);
  assert.equal(vramLabel.textContent, 'VRAM 8G');
  assert.equal(batchSlot.hidden, false);
  assert.equal(batchSlot.innerHTML, '<batch>');
});

test('_patchPreviewActionControls 无实例文本或批量内容时隐藏槽位', () => {
  const instanceSlot = makeEl({ hidden: false });
  const batchSlot = makeEl({ hidden: false, innerHTML: '' });
  const previewNode = makeEl({
    queries: {
      '.ui-schema-instance-slot': instanceSlot,
      '.ui-schema-batch-slot': batchSlot,
    },
  });
  const nodePreviewEl = makeEl({ queries: { '.rh-ai-app-preview-node': previewNode } });
  const { readState, writeState } = makeState({ nodePreviewEl });
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives(),
  });
  assert.equal(presentation._patchPreviewActionControls({}), true);
  assert.equal(instanceSlot.hidden, true);
  assert.equal(batchSlot.hidden, true);
});

test('_patchPreviewActionControls 找不到预览节点时返回 false', () => {
  const nodePreviewEl = makeEl({ queries: {} });
  const { readState, writeState } = makeState({ nodePreviewEl });
  const presentation = createRhAiAppPreviewPresentation({ readState, writeState });
  assert.equal(presentation._patchPreviewActionControls({}), false);
});

test('_patchPreviewWithoutRebuild 在没有预览节点时回退整块重渲染并返回 false', () => {
  const nodePreviewEl = makeEl({ queries: {} });
  const { readState, writeState } = makeState({ nodePreviewEl, kind: 'image' });
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({ renderRhAiAppNodePreviewHtml: () => '<rebuild>' }),
  });
  assert.equal(presentation._patchPreviewWithoutRebuild('bundle-x'), false);
  assert.equal(nodePreviewEl.innerHTML, '<rebuild>');
});

test('_patchPreviewWithoutRebuild 按开关分派局部补丁并写预览类型', () => {
  const label = makeEl();
  const wrap = makeEl({
    queries: { '.img-model-label': label, "[data-role='saved-app-menu']": null },
  });
  const previewNode = makeEl({
    queries: { '.rh-ai-app-preview-node .img-model-wrap': wrap },
  });
  const inputZone = makeEl({ innerHTML: '<old>' });
  const nodePreviewEl = makeEl({
    queries: {
      '.rh-ai-app-preview-node': previewNode,
      '.rh-ai-app-preview-node .img-model-wrap': wrap,
      '[data-preview-zone="input"]': inputZone,
    },
  });
  const { readState, writeState } = makeState({ nodePreviewEl, appName: '模型', kind: 'video' });
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({
      normalizeKind: (kind) => 'k:' + kind,
      renderPreviewInputComponentsHtml: () => '<inputs>',
    }),
  });
  assert.equal(
    presentation._patchPreviewWithoutRebuild({ id: 'b1' }, { renderInputs: true, renderAppChrome: true }),
    true,
  );
  assert.equal(previewNode.dataset.previewNodeKind, 'k:video');
  assert.equal(label.textContent, '模型');
  assert.equal(inputZone.innerHTML, '<inputs>');
});

test('_renderPreviewMutableZones 重渲染输入区与参数区', () => {
  const inputZone = makeEl({ innerHTML: '<old-in>' });
  const paramsZone = makeEl({ innerHTML: '<old-params>' });
  const nodePreviewEl = makeEl({
    queries: {
      '[data-preview-zone="input"]': inputZone,
      '[data-preview-zone="params"]': paramsZone,
    },
  });
  const { readState, writeState } = makeState({ nodePreviewEl, componentDrafts: [{ id: 'c1' }] });
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({
      renderPreviewInputComponentsHtml: () => '<inputs>',
      renderPreviewHomeParamsHtml: () => '<params>',
      renderPreviewAdvancedPanelHtml: () => '',
    }),
  });
  presentation._renderPreviewMutableZones({ id: 'b1' }, { renderInputs: true, renderAdvanced: false });
  assert.equal(inputZone.innerHTML, '<inputs>');
  assert.equal(paramsZone.innerHTML, '<params>');
});

test('_renderPreviewMutableZones 用外替换更新高级区', () => {
  const advancedZone = makeEl({ outerHTML: '<old-adv>' });
  const nodePreviewEl = makeEl({
    queries: {
      '[data-preview-zone="params"]': makeEl(),
      '[data-preview-zone="advanced"]': advancedZone,
      '.rh-ai-app-real-preview-panel': makeEl(),
    },
  });
  const { readState, writeState } = makeState({ nodePreviewEl });
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({ renderPreviewAdvancedPanelHtml: () => '<advanced>' }),
  });
  presentation._renderPreviewMutableZones({ id: 'b1' }, {});
  assert.equal(advancedZone.outerHTML, '<advanced>');
  assert.equal(advancedZone.removals(), 0);
});

test('_renderPreviewMutableZones 高级区无内容时移除旧元素', () => {
  const advancedZone = makeEl({ outerHTML: '<old-adv>' });
  const nodePreviewEl = makeEl({
    queries: {
      '[data-preview-zone="params"]': makeEl(),
      '[data-preview-zone="advanced"]': advancedZone,
      '.rh-ai-app-real-preview-panel': makeEl(),
    },
  });
  const { readState, writeState } = makeState({ nodePreviewEl });
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives(),
  });
  presentation._renderPreviewMutableZones({ id: 'b1' }, {});
  assert.equal(advancedZone.removals(), 1);
});

test('_renderPreviewMutableZones 无高级区时把内容追加到预览面板末尾', () => {
  const panel = makeEl();
  const nodePreviewEl = makeEl({
    queries: {
      '[data-preview-zone="params"]': makeEl(),
      '.rh-ai-app-real-preview-panel': panel,
    },
  });
  const { readState, writeState } = makeState({ nodePreviewEl });
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({ renderPreviewAdvancedPanelHtml: () => '<advanced>' }),
  });
  presentation._renderPreviewMutableZones({ id: 'b1' }, {});
  assert.deepEqual(panel.log, [['insertAdjacentHTML', 'beforeend', '<advanced>']]);
});

test('_renderPreviewMutableZones 在没有预览容器时不处理', () => {
  const { readState, writeState } = makeState();
  const presentation = createRhAiAppPreviewPresentation({ readState, writeState });
  assert.equal(presentation._renderPreviewMutableZones({}), undefined);
});

test('_bindPreviewUiSchemaControls 绑定控件并把取值与提交委托给动作', () => {
  const previewNode = makeEl();
  const nodePreviewEl = makeEl({ queries: { '.rh-ai-app-preview-node': previewNode } });
  const bundle = { id: 'b1' };
  const { readState, writeState } = makeState({ nodePreviewEl, currentBundle: bundle });
  const bindings = [];
  let cleanupCalls = 0;
  const commits = [];
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    actions: { commitPreviewUiSchemaValue: (a, b) => commits.push([a, b]) },
    primitives: makePrimitives({
      buildPreviewUiSchemaNodeData: (value) => ({ from: value.id }),
      bindUiSchemaFieldControls: (el, options) => {
        bindings.push([el, options]);
        return () => {
          cleanupCalls += 1;
        };
      },
    }),
  });
  presentation._bindPreviewUiSchemaControls();
  assert.equal(bindings.length, 1);
  assert.equal(bindings[0][0], previewNode);
  assert.deepEqual(bindings[0][1].getNodeData(), { from: 'b1' });
  bindings[0][1].commitFieldValue('f1', 'v1');
  assert.deepEqual(commits, [['f1', 'v1']]);

  presentation.clearUiSchemaBinding();
  assert.equal(cleanupCalls, 1);
  presentation.clearUiSchemaBinding();
  assert.equal(cleanupCalls, 1);

  presentation._bindPreviewUiSchemaControls();
  presentation.destroy();
  assert.equal(cleanupCalls, 2);
});

test('_decoratePreviewAdvancedFields 无参数或无容器时不动手', () => {
  const { readState, writeState } = makeState({ nodePreviewEl: makeEl() });
  let called = 0;
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({
      getBundleParamFields: () => {
        called += 1;
        return [];
      },
    }),
  });
  presentation._decoratePreviewAdvancedFields({});
  assert.equal(called, 1);

  const { readState: read2, writeState: write2 } = makeState();
  const noContainer = createRhAiAppPreviewPresentation({
    readState: read2,
    writeState: write2,
    primitives: makePrimitives({ getBundleParamFields: () => [{ id: 'f1' }] }),
  });
  assert.equal(noContainer._decoratePreviewAdvancedFields({}), undefined);
});

test('_decoratePreviewAdvancedFields 给高级参数补齐拖拽与说明标记', () => {
  const labelEl = makeEl({ className: 'ui-schema-field-label' });
  const fieldEl = makeEl({
    dataset: { uiSchemaField: 'f1' },
    queries: {
      '.ui-schema-field-label': labelEl,
      '.rh-vram-adv-label': null,
      '.rh-ai-app-preview-typebar': null,
      '.rh-adv-control-line, .ui-schema-field-control': makeEl(),
      '.rh-ai-app-preview-drag-pad': null,
      '.rh-tip, .ui-schema-info-tip': [],
    },
  });
  fieldEl.closest = () => null;
  const nodePreviewEl = makeEl({
    queries: { '.rh-ai-app-preview-node': makeEl() },
    queryAll: { '[data-ui-schema-field]': [fieldEl] },
  });
  const { readState, writeState } = makeState({ nodePreviewEl, componentDrafts: [{ id: 'c3' }] });
  const comp = { id: 'c3', label: '步数' };
  const created = [];
  const presentation = createRhAiAppPreviewPresentation({
    readState,
    writeState,
    primitives: makePrimitives({
      getBundleParamFields: () => [{ id: 'f1' }],
      getCustomAiAppComponentIndex: () => 3,
      getComponentByIndex: () => comp,
      getPreviewComponentDescription: (value, fallback) => {
        assert.equal(value, comp);
        assert.equal(fallback, '参数说明');
        return '步数说明';
      },
      renderPreviewTypeBarHtml: (component, options) => {
        assert.equal(component, comp);
        assert.deepEqual(options, { canRemove: true });
        return '<typebar>';
      },
    }),
    documentObject: {
      createElement: (tag) => {
        const el = makeEl({ tag });
        created.push(el);
        return el;
      },
    },
  });
  presentation._decoratePreviewAdvancedFields({ id: 'b1' });

  assert.ok(fieldEl.classes().includes('rh-ai-app-preview-draggable'));
  assert.deepEqual(fieldEl.classes().includes('rh-ai-app-preview-advanced-param'), true);
  assert.equal(fieldEl.dataset.previewDragKind, 'advanced-param');
  assert.equal(fieldEl.dataset.previewComponentIndex, '3');
  assert.deepEqual(fieldEl.log[0], ['insertAdjacentHTML', 'afterbegin', '<typebar>']);
  assert.ok(labelEl.classes().includes('rh-ai-app-preview-rename-target'));
  assert.equal(labelEl.dataset.previewComponentIndex, '3');
  assert.equal(created.length, 2);
  const [tip, pad] = created;
  assert.equal(tip.className, 'rh-tip ui-schema-info-tip');
  assert.equal(tip.textContent, '!');
  assert.ok(tip.classes().includes('rh-ai-app-preview-param-description-tip'));
  assert.equal(tip.dataset.previewComponentIndex, '3');
  assert.equal(tip.getAttribute('role'), 'button');
  assert.equal(tip.getAttribute('tabindex'), '0');
  assert.equal(tip.getAttribute('aria-label'), '编辑参数说明');
  assert.equal(tip.getAttribute('data-tooltip'), '步数说明');
  assert.equal(labelEl.log.length, 1);
  assert.equal(labelEl.log[0][0], 'insertAdjacentElement');
  assert.equal(labelEl.log[0][1], 'afterend');
  assert.equal(labelEl.log[0][2], tip);
  assert.equal(pad.className, 'rh-ai-app-preview-drag-pad');
  assert.equal(pad.dataset.previewComponentIndex, '3');
  assert.equal(pad.getAttribute('aria-hidden'), 'true');
  assert.equal(fieldEl.log.length, 2);
  assert.equal(fieldEl.log[1][0], 'insertBefore');
  assert.equal(fieldEl.log[1][1], pad);
});

test('_getPreviewZoneElement 只接受四个区域名并做去空白', () => {
  const inputZone = makeEl();
  const nodePreviewEl = makeEl({ queries: { '[data-preview-zone="input"]': inputZone } });
  const { readState, writeState } = makeState({ nodePreviewEl });
  const presentation = createRhAiAppPreviewPresentation({ readState, writeState });
  assert.equal(presentation._getPreviewZoneElement('input'), inputZone);
  assert.equal(presentation._getPreviewZoneElement('  input  '), inputZone);
  assert.equal(presentation._getPreviewZoneElement('params'), null);
  assert.equal(presentation._getPreviewZoneElement('bogus'), null);
  assert.equal(presentation._getPreviewZoneElement(''), null);
  assert.equal(presentation._getPreviewZoneElement(null), null);
});
