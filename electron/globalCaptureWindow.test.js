import test from 'node:test';
import assert from 'node:assert/strict';

const ACTION_IDS = ['source-text', 'ai-text', 'ai-image', 'ai-video', 'preset-draft'];
const AI_ACTION_IDS = ['ai-text', 'ai-image', 'ai-video'];
const ICON_IDS = ['add-to-canvas', 'text', 'image', 'video', 'save', 'cancel'];

let importCounter = 0;

function createClassList() {
  const names = new Set();
  return {
    names,
    toggle: (name, force) => {
      const next = force === undefined ? !names.has(name) : Boolean(force);
      if (next) names.add(name);
      else names.delete(name);
      return next;
    },
    add: (name) => names.add(name),
    remove: (name) => names.delete(name),
    contains: (name) => names.has(name),
  };
}

function createElement({ dataset = {}, namespaceURI = null, tagName = 'div' } = {}) {
  const attributes = new Map();
  const listeners = new Map();
  const element = {
    dataset,
    namespaceURI,
    tagName,
    attributes,
    listeners,
    children: [],
    prepended: [],
    focusCalls: [],
    scrollIntoViewCalls: [],
    classList: createClassList(),
    hidden: false,
    disabled: false,
    tabIndex: null,
    textContent: '',
    scrollTop: 0,
    scrollLeft: 0,
    scrollWidth: 0,
    clientWidth: 0,
    scrollHeight: 0,
    clientHeight: 0,
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    addEventListener(type, handler, options) {
      const entries = listeners.get(type) || [];
      entries.push({ handler, options });
      listeners.set(type, entries);
    },
    click() {
      for (const { handler } of listeners.get('click') || []) handler();
    },
    focus(options) {
      element.focusCalls.push(options);
    },
    scrollIntoView(options) {
      element.scrollIntoViewCalls.push(options);
    },
    prepend(child) {
      element.prepended.push(child);
      element.children.unshift(child);
      return child;
    },
    appendChild(child) {
      element.children.push(child);
      return child;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
  };
  return element;
}

function createEventTarget(closestMap = {}) {
  return { closest: (selector) => closestMap[selector] ?? null };
}

function createKeyEvent(key, options = {}) {
  const calls = { preventDefault: 0, stopPropagation: 0 };
  return {
    key,
    calls,
    target: options.target ?? null,
    altKey: Boolean(options.altKey),
    ctrlKey: Boolean(options.ctrlKey),
    metaKey: Boolean(options.metaKey),
    shiftKey: Boolean(options.shiftKey),
    preventDefault: () => {
      calls.preventDefault += 1;
    },
    stopPropagation: () => {
      calls.stopPropagation += 1;
    },
  };
}

function createWheelEvent(options = {}) {
  const calls = { preventDefault: 0, stopPropagation: 0 };
  return {
    calls,
    deltaX: options.deltaX || 0,
    deltaY: options.deltaY || 0,
    deltaMode: options.deltaMode || 0,
    ctrlKey: Boolean(options.ctrlKey),
    metaKey: Boolean(options.metaKey),
    preventDefault: () => {
      calls.preventDefault += 1;
    },
    stopPropagation: () => {
      calls.stopPropagation += 1;
    },
  };
}

function buildDom() {
  const elements = new Map();
  const created = [];
  const define = (id, element) => {
    elements.set(id, element);
    return element;
  };

  const panel = define('capturePanel', createElement());
  const toolbar = define('actionList', createElement());
  const details = define('captureDetails', createElement());
  const preview = define('textPreview', createElement());
  const more = define('moreToggle', createElement());
  const toggle = define('runImmediatelyToggle', createElement());
  const feedback = define('captureFeedback', createElement());
  const status = define('captureStatus', createElement());
  const hint = define('captureHint', createElement());
  const retry = define('retryAction', createElement());
  const closeCapture = define('closeCapture', createElement());
  const textCount = define('textCount', createElement());

  const labelElements = new Map();
  const actionElements = ACTION_IDS.map((actionId) => {
    const element = createElement({ dataset: { actionId } });
    if (AI_ACTION_IDS.includes(actionId)) {
      const labelElement = createElement();
      labelElements.set(actionId, labelElement);
      element.querySelector = (selector) => (selector === '[data-action-label]' ? labelElement : null);
    }
    return element;
  });
  const toolbarButtons = [actionElements[0], actionElements[1], actionElements[2], actionElements[3], more];
  const iconNodes = ICON_IDS.map((iconId) => createElement({ dataset: { icon: iconId } }));

  panel.querySelectorAll = (selector) => {
    if (selector === '[data-action-id]') return actionElements;
    if (selector === '[data-icon]') return iconNodes;
    return [];
  };
  toolbar.querySelectorAll = (selector) => (selector === 'button' ? toolbarButtons : []);

  const documentElement = createElement({ tagName: 'html' });
  const documentObject = {
    documentElement,
    getElementById: (id) => elements.get(id) ?? null,
    createElementNS: (namespaceURI, tagName) => {
      const element = createElement({ namespaceURI, tagName });
      created.push(element);
      return element;
    },
  };

  return {
    documentObject,
    documentElement,
    elements,
    created,
    panel,
    toolbar,
    details,
    preview,
    more,
    toggle,
    feedback,
    status,
    hint,
    retry,
    closeCapture,
    textCount,
    actionElements,
    toolbarButtons,
    iconNodes,
    labelElements,
  };
}

function createApi() {
  const calls = { chooseAction: [], cancel: [], setExpanded: [], didPresent: [] };
  const api = {
    calls,
    presentHandler: null,
    chooseActionImpl: async () => ({ ok: true }),
    cancelImpl: async () => ({ ok: true }),
    setExpandedImpl: async () => ({ ok: true, opensUp: false }),
    didPresentImpl: async () => ({ ok: true }),
    onPresent(handler) {
      api.presentHandler = handler;
    },
    chooseAction(payload) {
      calls.chooseAction.push(payload);
      return api.chooseActionImpl(payload);
    },
    cancel(payload) {
      calls.cancel.push(payload);
      return api.cancelImpl(payload);
    },
    setExpanded(payload) {
      calls.setExpanded.push(payload);
      return api.setExpandedImpl(payload);
    },
    didPresent(payload) {
      calls.didPresent.push(payload);
      return api.didPresentImpl(payload);
    },
  };
  return api;
}

function createRafQueue() {
  const pending = [];
  return {
    pending,
    requestAnimationFrame: (callback) => {
      pending.push(callback);
      return pending.length;
    },
    flush: () => {
      while (pending.length) pending.shift()();
    },
  };
}

function settleMicrotasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function setup(t, options = {}) {
  const dom = buildDom();
  const api = createApi();
  const raf = createRafQueue();
  const windowListeners = new Map();
  const windowStub = {
    listeners: windowListeners,
    addEventListener: (type, handler, opts) => {
      const entries = windowListeners.get(type) || [];
      entries.push({ handler, options: opts });
      windowListeners.set(type, entries);
    },
  };

  const previous = {
    document: globalThis.document,
    window: globalThis.window,
    api: globalThis.globalCaptureWindow,
    raf: globalThis.requestAnimationFrame,
    present: globalThis.__presentGlobalCapture,
  };

  globalThis.document = dom.documentObject;
  globalThis.window = windowStub;
  globalThis.globalCaptureWindow = options.detachedApi ? undefined : api;
  globalThis.requestAnimationFrame = raf.requestAnimationFrame;

  importCounter += 1;
  const url = new URL('./globalCaptureWindow.js', import.meta.url);
  url.searchParams.set('case', String(importCounter));
  const module = await import(url.href);

  t.after(() => {
    globalThis.document = previous.document;
    globalThis.window = previous.window;
    globalThis.globalCaptureWindow = previous.api;
    globalThis.requestAnimationFrame = previous.raf;
    if (previous.present === undefined) delete globalThis.__presentGlobalCapture;
    else globalThis.__presentGlobalCapture = previous.present;
  });

  const keydown = () => {
    const entries = windowListeners.get('keydown') || [];
    assert.equal(entries.length, 1, 'exactly one keydown listener');
    return entries[0];
  };

  return { dom, api, raf, windowStub, windowListeners, keydown, module, present: api.presentHandler };
}

test('import registers the present handler, the global hook and one keydown listener', async (t) => {
  const { api, present, windowListeners, module } = await setup(t);

  assert.equal(typeof module.default, 'undefined');
  assert.equal(typeof api.presentHandler, 'function');
  assert.equal(api.presentHandler, present);
  assert.equal(globalThis.__presentGlobalCapture, present);
  assert.equal(windowListeners.get('keydown').length, 1);
  assert.deepEqual(api.calls.chooseAction, []);
});

test('import prepends a context-menu icon into every [data-icon] node', async (t) => {
  const { dom } = await setup(t);

  assert.equal(dom.iconNodes.length, ICON_IDS.length);
  dom.iconNodes.forEach((node, index) => {
    assert.equal(node.prepended.length, 1, `${ICON_IDS[index]} gets one svg`);
    const svg = node.prepended[0];
    assert.equal(svg.namespaceURI, 'http://www.w3.org/2000/svg');
    assert.equal(svg.tagName, 'svg');
    assert.equal(svg.getAttribute('width'), '16');
    assert.equal(svg.getAttribute('height'), '16');
    assert.equal(svg.getAttribute('data-context-menu-icon'), ICON_IDS[index]);
    assert.equal(svg.dataset.contextMenuIcon, ICON_IDS[index]);
    assert.ok(svg.children.length > 0, `${ICON_IDS[index]} has at least one shape`);
  });
});

test('present seeds the default ready presentation', async (t) => {
  const { dom, present, api } = await setup(t);

  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: '',
    theme: 'dark',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });

  assert.equal(dom.preview.textContent, '');
  assert.equal(dom.preview.scrollTop, 0);
  assert.equal(dom.details.scrollTop, 0);
  assert.equal(dom.textCount.textContent, '0 字');
  assert.equal(dom.documentElement.dataset.theme, 'dark');
  assert.equal(dom.panel.getAttribute('aria-busy'), 'false');
  assert.equal(dom.panel.classList.contains('is-capturing'), false);
  assert.equal(dom.feedback.hidden, true);
  assert.equal(dom.status.textContent, '');
  assert.equal(dom.hint.textContent, '');
  assert.equal(dom.details.hidden, true);
  assert.equal(dom.toolbar.hidden, false);
  assert.equal(dom.retry.hidden, true);
  assert.equal(dom.more.getAttribute('aria-expanded'), 'false');
  assert.equal(dom.more.getAttribute('aria-label'), '更多操作');
  assert.equal(dom.closeCapture.hidden, false);
  assert.deepEqual(api.calls.didPresent, []);
});

test('present counts code points rather than UTF-16 units and applies the light theme', async (t) => {
  const { dom, present } = await setup(t);

  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'AI😀b',
    theme: 'light',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  assert.equal(dom.preview.textContent, 'AI😀b');
  assert.equal(dom.textCount.textContent, '4 字');
  assert.equal(dom.documentElement.dataset.theme, 'light');

  present({
    captureId: 'cap-2',
    phase: 'ready',
    text: 'ab',
    theme: 'anything-else',
    activeActionId: 'ai-text',
    presentationId: 'p-2',
  });

  assert.equal(dom.documentElement.dataset.theme, 'dark');
});

test('present in the capturing phase disables the panel and hides close', async (t) => {
  const { dom, present } = await setup(t);

  present({
    captureId: 'cap-1',
    phase: 'capturing',
    text: 'hello',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  assert.equal(dom.status.textContent, '正在读取选中文字…');
  assert.equal(dom.hint.textContent, '');
  assert.equal(dom.feedback.hidden, false);
  assert.equal(dom.toolbar.hidden, false, 'the toolbar stays visible while capturing');
  assert.equal(dom.panel.classList.contains('is-capturing'), true);
  assert.equal(dom.more.getAttribute('aria-label'), '正在读取选中文字…');
  assert.equal(dom.closeCapture.hidden, true);
  assert.equal(dom.panel.getAttribute('aria-busy'), 'true');
  assert.equal(dom.toggle.disabled, true);
  assert.equal(dom.more.disabled, true);
  for (const element of dom.actionElements) assert.equal(element.disabled, true);
  assert.equal(dom.retry.hidden, true);
});

test('present maps every capture error reason to its own copy', async (t) => {
  const cases = [
    {
      reason: 'shortcut-keys-still-held',
      status: '请先松开快捷键',
      hint: '松开后再按 Control+Alt+Shift+C',
    },
    {
      reason: 'copy-command-timeout',
      status: '读取选区超时',
      hint: '保持文字选中，再按 Control+Alt+Shift+C',
    },
    {
      reason: 'copy-worker-startup-timeout',
      status: '读取选区超时',
      hint: '保持文字选中，再按 Control+Alt+Shift+C',
    },
    {
      reason: 'something-else',
      status: '未能读取选中文字',
      hint: '重新选中文字，再按 Control+Alt+Shift+C',
    },
    {
      reason: 'something-else',
      label: 'Shift+Alt+C',
      status: '未能读取选中文字',
      hint: '重新选中文字，再按 Shift+Alt+C',
    },
  ];

  for (const row of cases) {
    const { dom, present } = await setup(t);
    present({
      captureId: 'cap-1',
      phase: 'error',
      text: 'kept',
      activeActionId: 'source-text',
      presentationId: 'p-1',
      errorReason: row.reason,
      shortcutLabel: row.label,
    });

    assert.equal(dom.status.textContent, row.status, row.reason);
    assert.equal(dom.hint.textContent, row.hint, row.reason);
    assert.equal(dom.feedback.hidden, false);
    assert.equal(dom.toolbar.hidden, true, 'the toolbar gives way to the error copy');
    assert.equal(dom.closeCapture.hidden, false);
    assert.equal(dom.preview.textContent, 'kept');
    assert.equal(dom.panel.classList.contains('is-capturing'), false);
    assert.equal(dom.panel.getAttribute('aria-busy'), 'false');
    assert.equal(dom.toggle.disabled, true, 'a non-ready phase blocks every control');
    assert.equal(dom.more.disabled, true);
    for (const element of dom.actionElements) assert.equal(element.disabled, true);
  }
});

test('present focuses the requested action and rolls the frame state into the toolbar', async (t) => {
  const { dom, present } = await setup(t);

  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-image',
    presentationId: 'p-1',
  });

  assert.deepEqual(
    dom.toolbarButtons.map((button) => button.tabIndex),
    [-1, -1, 0, -1, -1],
  );
  assert.equal(dom.toolbarButtons[2].scrollIntoViewCalls.length, 1);
  assert.deepEqual(dom.toolbarButtons[2].scrollIntoViewCalls[0], { block: 'nearest', inline: 'nearest' });
  assert.equal(dom.toolbarButtons[2].focusCalls.length, 0, 'focus waits for the next frame');

  present({
    captureId: 'cap-2',
    phase: 'ready',
    text: 'x',
    activeActionId: 'no-such-action',
    presentationId: 'p-2',
  });

  assert.deepEqual(
    dom.toolbarButtons.map((button) => button.tabIndex),
    [0, -1, -1, -1, -1],
  );
});

test('present focuses on the next frame for ready and error phases', async (t) => {
  const ready = await setup(t);
  ready.present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-video',
    presentationId: 'p-1',
  });
  ready.raf.flush();

  assert.equal(ready.dom.toolbarButtons[3].focusCalls.length, 1);
  assert.deepEqual(ready.dom.toolbarButtons[3].focusCalls[0], { preventScroll: true });

  const error = await setup(t);
  error.present({
    captureId: 'cap-1',
    phase: 'error',
    text: 'x',
    activeActionId: 'ai-video',
    presentationId: 'p-1',
  });
  error.raf.flush();

  assert.equal(error.dom.closeCapture.focusCalls.length, 1);
  assert.equal(error.dom.toolbarButtons[3].focusCalls.length, 0);

  const empty = await setup(t);
  empty.present({
    captureId: '',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-video',
    presentationId: 'p-1',
  });
  empty.raf.flush();

  assert.equal(empty.dom.toolbarButtons[3].focusCalls.length, 0);
  assert.equal(empty.dom.closeCapture.focusCalls.length, 0);
});

test('present skips the frame focus while a dispatch is in flight', async (t) => {
  const { dom, present, api, raf } = await setup(t);
  api.chooseActionImpl = () => new Promise(() => {});

  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });
  dom.actionElements[1].click();
  raf.flush();

  assert.equal(api.calls.chooseAction.length, 1);
  assert.equal(dom.toolbarButtons[1].focusCalls.length, 0, 'busy frames keep the focus where it is');
});

test('present acknowledges completion on the second nested frame', async (t) => {
  const { dom, present, api, raf } = await setup(t);

  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });

  assert.deepEqual(api.calls.didPresent, []);
  raf.flush();
  assert.deepEqual(api.calls.didPresent, [{ captureId: 'cap-1', presentationId: 'p-1' }]);
  assert.equal(dom.toolbarButtons[0].focusCalls.length, 1);
});

test('the completion ack is dropped once the capture id changes', async (t) => {
  const { present, api, raf } = await setup(t);

  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });
  present({
    captureId: 'cap-2',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-2',
  });
  raf.flush();

  assert.deepEqual(api.calls.didPresent, [{ captureId: 'cap-2', presentationId: 'p-2' }]);
});

test('a completed presentation never acknowledges', async (t) => {
  const { dom, present, api, raf } = await setup(t);

  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });
  dom.closeCapture.click();
  raf.flush();

  assert.deepEqual(api.calls.didPresent, []);
});

test('the run-immediately toggle swaps the AI action labels both ways', async (t) => {
  const { dom, present } = await setup(t);
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  assert.equal(dom.labelElements.get('ai-text').textContent, '建文本');
  assert.equal(dom.labelElements.get('ai-image').textContent, '建图像');
  assert.equal(dom.labelElements.get('ai-video').textContent, '建视频');
  assert.equal(dom.toggle.getAttribute('aria-checked'), 'false');

  dom.toggle.click();

  assert.equal(dom.toggle.getAttribute('aria-checked'), 'true');
  assert.equal(dom.labelElements.get('ai-text').textContent, 'AI 文本');
  assert.equal(dom.labelElements.get('ai-image').textContent, 'AI 生图');
  assert.equal(dom.labelElements.get('ai-video').textContent, 'AI 视频');
  assert.equal(dom.actionElements[1].getAttribute('aria-label'), '创建并生成AI 文本节点');
  assert.equal(dom.actionElements[2].getAttribute('aria-label'), '创建并生成AI 图像节点');
  assert.equal(dom.actionElements[3].getAttribute('aria-label'), '创建并生成AI 视频节点');

  dom.toggle.click();

  assert.equal(dom.toggle.getAttribute('aria-checked'), 'false');
  assert.equal(dom.labelElements.get('ai-text').textContent, '建文本');
  assert.equal(dom.actionElements[1].getAttribute('aria-label'), '仅创建AI 文本节点');
});

test('a presentation carries the run-immediately flag into the switch', async (t) => {
  const { dom, present } = await setup(t);

  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    runImmediately: true,
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  assert.equal(dom.toggle.getAttribute('aria-checked'), 'true');
  assert.equal(dom.labelElements.get('ai-text').textContent, 'AI 文本');

  present({
    captureId: 'cap-2',
    phase: 'ready',
    text: 'x',
    runImmediately: false,
    activeActionId: 'ai-text',
    presentationId: 'p-2',
  });

  assert.equal(dom.toggle.getAttribute('aria-checked'), 'false');
  assert.equal(dom.labelElements.get('ai-text').textContent, '建文本');
});

test('clicking an action dispatches once and reports success', async (t) => {
  const { dom, present, api } = await setup(t);
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  dom.actionElements[1].click();
  await settleMicrotasks();

  assert.deepEqual(api.calls.chooseAction, [
    { captureId: 'cap-1', actionId: 'ai-text', runImmediately: false },
  ]);
  assert.equal(dom.status.textContent, '已发送到画布');
  assert.equal(dom.hint.textContent, '');
  assert.equal(dom.retry.hidden, true);
  for (const element of dom.actionElements) assert.equal(element.disabled, false);

  dom.actionElements[2].click();
  await settleMicrotasks();

  assert.equal(api.calls.chooseAction.length, 1, 'a completed capture cannot dispatch again');
});

test('a pending dispatch cannot be re-entered', async (t) => {
  const { dom, present, api } = await setup(t);
  api.chooseActionImpl = () => new Promise(() => {});
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  dom.actionElements[1].click();
  dom.actionElements[2].click();
  dom.actionElements[1].click();
  await settleMicrotasks();

  assert.equal(api.calls.chooseAction.length, 1);
  assert.equal(dom.status.textContent, '正在发送到画布…');
  for (const element of dom.actionElements) assert.equal(element.disabled, true);
  assert.equal(dom.toggle.disabled, true);
  assert.equal(dom.more.disabled, true);
});

test('a dispatch is refused while the panel is capturing, empty or busy', async (t) => {
  const capturing = await setup(t);
  capturing.present({
    captureId: 'cap-1',
    phase: 'capturing',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });
  capturing.dom.actionElements[1].click();
  await settleMicrotasks();
  assert.equal(capturing.api.calls.chooseAction.length, 0);

  const empty = await setup(t);
  empty.present({
    captureId: '',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });
  empty.dom.actionElements[1].click();
  await settleMicrotasks();
  assert.equal(empty.api.calls.chooseAction.length, 0);
});

test('a retryable failure keeps the action, focuses retry and retries it verbatim', async (t) => {
  const { dom, present, api } = await setup(t);
  api.chooseActionImpl = async () => ({ ok: false, retryable: true });
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-video',
    presentationId: 'p-1',
  });

  dom.actionElements[3].click();
  await settleMicrotasks();

  assert.equal(dom.status.textContent, '发送失败');
  assert.equal(dom.hint.textContent, '选中文字已保留');
  assert.equal(dom.retry.hidden, false);
  assert.equal(dom.closeCapture.hidden, false);
  assert.equal(dom.retry.focusCalls.length, 1);
  assert.deepEqual(dom.retry.focusCalls[0], { preventScroll: true });
  assert.equal(dom.feedback.hidden, false);

  api.chooseActionImpl = async () => ({ ok: true });
  dom.retry.click();
  await settleMicrotasks();

  assert.deepEqual(api.calls.chooseAction[1], {
    captureId: 'cap-1',
    actionId: 'ai-video',
    runImmediately: false,
  });
  assert.equal(dom.status.textContent, '已发送到画布');
  assert.equal(dom.retry.hidden, true);
});

test('a rejected dispatch is treated exactly like a retryable failure', async (t) => {
  const { dom, present, api } = await setup(t);
  api.chooseActionImpl = async () => {
    throw new Error('bridge down');
  };
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-video',
    presentationId: 'p-1',
  });

  dom.actionElements[3].click();
  await settleMicrotasks();

  assert.equal(dom.status.textContent, '发送失败');
  assert.equal(dom.hint.textContent, '选中文字已保留');
  assert.equal(dom.retry.hidden, true, 'a rejected bridge call is not retryable');
  assert.equal(dom.closeCapture.focusCalls.length, 1);
});

test('an ignored dispatch response leaves the newer presentation untouched', async (t) => {
  const { dom, present, api } = await setup(t);
  api.chooseActionImpl = async () => {
    present({
      captureId: 'cap-2',
      phase: 'ready',
      text: 'second',
      activeActionId: 'ai-text',
      presentationId: 'p-2',
    });
    return { ok: true };
  };
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'first',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  dom.actionElements[1].click();
  await settleMicrotasks();

  assert.equal(dom.status.textContent, '');
  assert.equal(dom.preview.textContent, 'second');
  assert.equal(dom.hint.textContent, '');
});

test('cancelling notifies the host once and clears the presentation', async (t) => {
  const { dom, present, api } = await setup(t);
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  dom.closeCapture.click();
  await settleMicrotasks();

  assert.deepEqual(api.calls.cancel, [{ captureId: 'cap-1' }]);

  dom.closeCapture.click();
  await settleMicrotasks();

  assert.equal(api.calls.cancel.length, 1);
});

test('cancelling without a capture never reaches the bridge', async (t) => {
  const { dom, present, api } = await setup(t);
  present({ captureId: '', phase: 'ready', text: 'x', activeActionId: 'ai-text', presentationId: 'p-1' });

  dom.closeCapture.click();
  await settleMicrotasks();

  assert.deepEqual(api.calls.cancel, []);
});

test('cancelling a capture survives a failing bridge', async (t) => {
  const { dom, present, api } = await setup(t);
  api.cancelImpl = async () => {
    throw new Error('bridge down');
  };
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  dom.closeCapture.click();
  await settleMicrotasks();

  assert.deepEqual(api.calls.cancel, [{ captureId: 'cap-1' }]);
});

test('expanding asks the host and honours the opens-up answer', async (t) => {
  const { dom, present, api } = await setup(t);
  api.setExpandedImpl = async () => ({ ok: true, opensUp: true });
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  dom.more.click();
  await settleMicrotasks();

  assert.deepEqual(api.calls.setExpanded, [{ captureId: 'cap-1', expanded: true }]);
  assert.equal(dom.details.hidden, false);
  assert.equal(dom.more.getAttribute('aria-expanded'), 'true');
  assert.equal(dom.panel.classList.contains('is-above'), true);
});

test('a refused expansion rolls the panel back', async (t) => {
  const { dom, present, api } = await setup(t);
  api.setExpandedImpl = async () => ({ ok: false });
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  dom.more.click();
  await settleMicrotasks();

  assert.equal(dom.details.hidden, true);
  assert.equal(dom.more.getAttribute('aria-expanded'), 'false');
  assert.equal(dom.panel.classList.contains('is-above'), false);
});

test('a throwing expansion rolls the panel back', async (t) => {
  const { dom, present, api } = await setup(t);
  api.setExpandedImpl = async () => {
    throw new Error('bridge down');
  };
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  dom.more.click();
  await settleMicrotasks();

  assert.equal(dom.details.hidden, true);
  assert.equal(dom.more.getAttribute('aria-expanded'), 'false');
});

test('an expansion answer for a replaced capture is ignored', async (t) => {
  const { dom, present, api } = await setup(t);
  api.setExpandedImpl = async () => {
    present({
      captureId: 'cap-2',
      phase: 'ready',
      text: 'x',
      activeActionId: 'ai-text',
      presentationId: 'p-2',
    });
    return { ok: true, opensUp: true };
  };
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  dom.more.click();
  await settleMicrotasks();

  assert.equal(dom.details.hidden, true);
  assert.equal(dom.panel.classList.contains('is-above'), false);
  assert.equal(dom.more.getAttribute('aria-expanded'), 'false');
});

test('Escape collapses first and only then cancels', async (t) => {
  const { dom, present, api, keydown } = await setup(t);
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  dom.more.click();
  await settleMicrotasks();
  assert.equal(dom.details.hidden, false);

  const collapse = createKeyEvent('Escape');
  keydown().handler(collapse);
  await settleMicrotasks();

  assert.equal(collapse.calls.preventDefault, 1);
  assert.deepEqual(api.calls.cancel, []);
  assert.equal(dom.details.hidden, true);
  assert.equal(dom.more.focusCalls.length, 1, 'collapsing restores focus to the toggle');
  assert.equal(api.calls.setExpanded.length, 2);

  const cancel = createKeyEvent('Escape');
  keydown().handler(cancel);
  await settleMicrotasks();

  assert.deepEqual(api.calls.cancel, [{ captureId: 'cap-1' }]);
});

test('number keys dispatch the matching action', async (t) => {
  const { dom, present, api, keydown } = await setup(t);
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });

  const event = createKeyEvent('3', { target: createEventTarget() });
  keydown().handler(event);
  await settleMicrotasks();

  assert.equal(event.calls.preventDefault, 1);
  assert.deepEqual(api.calls.chooseAction, [
    { captureId: 'cap-1', actionId: 'ai-image', runImmediately: false },
  ]);

  assert.equal(dom.actionElements[0].disabled, false);
});

test('number keys are ignored with modifiers, while capturing or after a failure', async (t) => {
  const blocked = createKeyEvent('2', { target: createEventTarget(), altKey: true });
  const withModifier = await setup(t);
  withModifier.present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });
  withModifier.keydown().handler(blocked);
  await settleMicrotasks();
  assert.deepEqual(withModifier.api.calls.chooseAction, []);
  assert.equal(blocked.calls.preventDefault, 0);

  const capturing = await setup(t);
  capturing.present({
    captureId: 'cap-1',
    phase: 'capturing',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });
  capturing.keydown().handler(createKeyEvent('2', { target: createEventTarget() }));
  await settleMicrotasks();
  assert.deepEqual(capturing.api.calls.chooseAction, []);

  const failed = await setup(t);
  failed.api.chooseActionImpl = async () => ({ ok: false, retryable: true });
  failed.present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });
  failed.dom.actionElements[0].click();
  await settleMicrotasks();
  assert.equal(failed.dom.retry.hidden, false);
  failed.keydown().handler(createKeyEvent('2', { target: createEventTarget() }));
  await settleMicrotasks();
  assert.equal(failed.api.calls.chooseAction.length, 1);
});

test('arrow keys walk the toolbar with wraparound', async (t) => {
  const { dom, present, api, keydown } = await setup(t);
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });

  const left = createKeyEvent('ArrowLeft', { target: createEventTarget() });
  keydown().handler(left);
  assert.equal(left.calls.preventDefault, 1);
  assert.deepEqual(
    dom.toolbarButtons.map((button) => button.tabIndex),
    [-1, -1, -1, -1, 0],
  );

  keydown().handler(createKeyEvent('ArrowRight', { target: createEventTarget() }));
  assert.deepEqual(
    dom.toolbarButtons.map((button) => button.tabIndex),
    [0, -1, -1, -1, -1],
  );

  keydown().handler(createKeyEvent('ArrowUp', { target: createEventTarget() }));
  assert.deepEqual(
    dom.toolbarButtons.map((button) => button.tabIndex),
    [-1, -1, -1, -1, 0],
  );

  keydown().handler(createKeyEvent('ArrowDown', { target: createEventTarget() }));
  assert.deepEqual(
    dom.toolbarButtons.map((button) => button.tabIndex),
    [0, -1, -1, -1, -1],
  );

  assert.deepEqual(api.calls.chooseAction, []);
});

test('ArrowDown on the more toggle expands the panel and focuses the preset action', async (t) => {
  const { dom, present, api, keydown } = await setup(t);
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });

  const event = createKeyEvent('ArrowDown', { target: dom.more });
  keydown().handler(event);
  await settleMicrotasks();

  assert.equal(event.calls.preventDefault, 1);
  assert.deepEqual(api.calls.setExpanded, [{ captureId: 'cap-1', expanded: true }]);
  assert.equal(dom.actionElements[4].focusCalls.length, 1);
  assert.deepEqual(dom.actionElements[4].focusCalls[0], { preventScroll: true });
});

test('keys typed into the preview, the switch or the feedback bar are ignored', async (t) => {
  const previewFocus = await setup(t);
  previewFocus.present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });
  previewFocus.keydown().handler(createKeyEvent('2', { target: previewFocus.dom.preview }));
  await settleMicrotasks();
  assert.deepEqual(previewFocus.api.calls.chooseAction, []);

  const switchFocus = await setup(t);
  switchFocus.present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });
  switchFocus.keydown().handler(createKeyEvent('2', { target: switchFocus.dom.toggle }));
  await settleMicrotasks();
  assert.deepEqual(switchFocus.api.calls.chooseAction, []);

  const feedbackFocus = await setup(t);
  feedbackFocus.present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });
  const insideFeedback = createEventTarget({ '#captureFeedback': feedbackFocus.dom.feedback });
  feedbackFocus.keydown().handler(createKeyEvent('2', { target: insideFeedback }));
  await settleMicrotasks();
  assert.deepEqual(feedbackFocus.api.calls.chooseAction, []);
});

test('inside the details panel numbers still work but arrows do not', async (t) => {
  const { dom, present, api, keydown } = await setup(t);
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });
  const target = createEventTarget({ '#captureDetails': dom.details });

  keydown().handler(createKeyEvent('5', { target }));
  await settleMicrotasks();

  assert.deepEqual(api.calls.chooseAction, [
    { captureId: 'cap-1', actionId: 'preset-draft', runImmediately: false },
  ]);
});

test('Enter chooses the action under the event target', async (t) => {
  const { dom, present, api, keydown } = await setup(t);
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });

  const target = createEventTarget({ '[data-action-id]': dom.actionElements[3] });
  const plain = createKeyEvent('Enter', { target });
  keydown().handler(plain);
  await settleMicrotasks();

  assert.equal(plain.calls.preventDefault, 1);
  assert.deepEqual(api.calls.chooseAction, [
    { captureId: 'cap-1', actionId: 'ai-video', runImmediately: false },
  ]);

  const flushed = await setup(t);
  flushed.present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });
  flushed.keydown().handler(createKeyEvent('Enter', { target, shiftKey: true }));
  await settleMicrotasks();

  assert.deepEqual(flushed.api.calls.chooseAction, [
    { captureId: 'cap-1', actionId: 'ai-video', runImmediately: true, rememberRunImmediately: false },
  ]);
});

test('Enter falls back to the active action and toggles the preset row', async (t) => {
  const keyed = await setup(t);
  keyed.present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-image',
    presentationId: 'p-1',
  });
  keyed.keydown().handler(createKeyEvent('Enter', { target: createEventTarget() }));
  await settleMicrotasks();

  assert.deepEqual(keyed.api.calls.chooseAction, [
    { captureId: 'cap-1', actionId: 'ai-image', runImmediately: false },
  ]);

  const preset = await setup(t);
  preset.present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'preset-draft',
    presentationId: 'p-1',
  });
  const enter = createKeyEvent('Enter', { target: createEventTarget() });
  preset.keydown().handler(enter);
  await settleMicrotasks();

  assert.equal(enter.calls.preventDefault, 1);
  assert.deepEqual(preset.api.calls.chooseAction, []);
  assert.deepEqual(preset.api.calls.setExpanded, [{ captureId: 'cap-1', expanded: true }]);
});

test('Enter on the more toggle is left to the toggle itself', async (t) => {
  const { dom, present, api, keydown } = await setup(t);
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });

  keydown().handler(createKeyEvent('Enter', { target: dom.more }));
  await settleMicrotasks();

  assert.deepEqual(api.calls.chooseAction, []);
  assert.deepEqual(api.calls.setExpanded, []);
});

test('the toolbar wheel scrolls horizontally unless a modifier is held', async (t) => {
  const { dom, present, api, module } = await setup(t);
  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'source-text',
    presentationId: 'p-1',
  });

  const entries = dom.toolbar.listeners.get('wheel');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].options.passive, false);

  dom.toolbar.scrollWidth = 300;
  dom.toolbar.clientWidth = 100;

  const plain = createWheelEvent({ deltaY: 20 });
  entries[0].handler(plain);

  assert.equal(dom.toolbar.scrollLeft, 20);
  assert.equal(plain.calls.preventDefault, 1);
  assert.deepEqual(api.calls.chooseAction, []);

  const zoom = createWheelEvent({ deltaY: 20, ctrlKey: true });
  entries[0].handler(zoom);

  assert.equal(dom.toolbar.scrollLeft, 20, 'a zoom gesture is left to the browser');
  assert.equal(zoom.calls.preventDefault, 0);

  assert.equal(typeof module, 'object');
});

test('a missing host bridge still leaves the panel usable and reports failures', async (t) => {
  const { dom, api } = await setup(t, { detachedApi: true });
  const present = globalThis.__presentGlobalCapture;

  assert.equal(typeof present, 'function');
  assert.equal(api.presentHandler, null);

  present({
    captureId: 'cap-1',
    phase: 'ready',
    text: 'x',
    activeActionId: 'ai-text',
    presentationId: 'p-1',
  });

  dom.actionElements[1].click();
  await settleMicrotasks();

  assert.equal(dom.status.textContent, '发送失败');
  assert.equal(dom.hint.textContent, '选中文字已保留');
  assert.equal(dom.closeCapture.focusCalls.length, 1);

  dom.more.click();
  await settleMicrotasks();

  assert.equal(dom.details.hidden, false, 'the optimistic expansion stands without a bridge');

  dom.closeCapture.click();
  await settleMicrotasks();

  assert.equal(dom.status.textContent, '发送失败', 'a bridge-less cancel does not disturb the feedback');
});
