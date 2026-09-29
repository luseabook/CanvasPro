import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PersonReplacementModelGate,
  ReplacementStudioModelGate,
  formatPersonReplacementModelBytes,
  renderPersonReplacementModelGate,
} from './personReplacementModelGate.js';

function createStubElement(tagName = 'div') {
  return {
    tagName,
    className: '',
    dataset: {},
    listeners: {},
    hidden: false,
    innerHTML: '',
    isConnected: true,
    addEventListener(type, fn) {
      this.listeners[type] = fn;
    },
    removeEventListener(type, fn) {
      if (this.listeners[type] === fn) delete this.listeners[type];
    },
    appendChild(child) {
      this.children = this.children || [];
      this.children.push(child);
      return child;
    },
    remove() {
      this.removed = true;
    },
    contains() {
      return false;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    focus() {},
  };
}

function createStubDocument() {
  const body = createStubElement('body');
  return {
    body,
    activeElement: body,
    createElement: (tag) => createStubElement(tag),
    querySelector: () => null,
  };
}

test('modelGate: formatBytes 空值/非有限数/边界值逐条对齐', () => {
  const cases = [
    [0, ''],
    [-0, ''],
    [-1, ''],
    [-Infinity, ''],
    [null, ''],
    [undefined, ''],
    ['', ''],
    ['   ', ''],
    ['abc', ''],
    [NaN, ''],
    [{}, ''],
    [Infinity, 'Infinity GB'],
    [1, '1 KB'],
    [512, '1 KB'],
    [1024, '1 KB'],
    [1023, '1 KB'],
    [1025, '1 KB'],
    [1536, '2 KB'],
    [2560, '3 KB'],
    [1048575, '1024 KB'],
    [1048576, '1.0 MB'],
    [1572864, '1.5 MB'],
    [104857599, '100.0 MB'],
    [104857600, '100 MB'],
    [1073741823, '1024 MB'],
    [1073741824, '1.0 GB'],
    [1610612736, '1.5 GB'],
    ['1e6', '977 KB'],
    [[1024], '1 KB'],
  ];
  for (const [input, expected] of cases) {
    assert.equal(formatPersonReplacementModelBytes(input), expected, String(input));
  }
  assert.equal(typeof formatPersonReplacementModelBytes(1024), 'string');
});

test('modelGate: render 检查态含对话框骨架、无安装按钮、无进度', () => {
  const html = renderPersonReplacementModelGate();
  assert.equal(typeof html, 'string');
  assert.ok(html.startsWith('<div class="person-replacement-model-gate-backdrop"'));
  assert.ok(html.endsWith('</section>\n  </div>'));
  assert.ok(html.includes('data-person-replacement-model-gate-dialog'));
  assert.ok(html.includes('role="dialog"'));
  assert.ok(html.includes('aria-modal="true"'));
  assert.ok(html.includes('aria-labelledby="personReplacementModelGateTitle"'));
  assert.ok(html.includes('aria-describedby="personReplacementModelGateDescription"'));
  assert.ok(html.includes('id="personReplacementModelGateTitle">正在检查人物识别模型</h2>'));
  assert.ok(html.includes('正在确认本机是否已经安装人物替换所需的轻量识别模型。'));
  assert.ok(html.includes('person-replacement-model-gate-checking'));
  assert.ok(html.includes('正在读取本地模型状态…'));
  assert.ok(html.includes('data-person-replacement-model-gate-action="cancel"'));
  assert.ok(!html.includes('data-person-replacement-model-gate-action="install"'));
  assert.ok(!html.includes('person-replacement-model-gate-progress'));
  assert.ok(!html.includes('person-replacement-model-gate-error'));
  assert.ok(!html.includes('disabled'));
  assert.ok(html.includes('person-replacement-model-gate-dialog-copy') === false);
  assert.ok(html.includes('person-replacement-model-gate-copy'));
});

test('modelGate: render 缺省态/null 态走下载分支，文案回落与类名拼装正确', () => {
  for (const options of [{ state: 'missing' }, { state: null }, { state: '' }, { state: 'error' }]) {
    const html = renderPersonReplacementModelGate(options);
    assert.ok(html.includes('下载人物识别基础模型'), String(options.state));
    assert.ok(html.includes('安装完成后才能进入替换工作室。'), String(options.state));
    assert.ok(html.includes('data-person-replacement-model-gate-action="install"'), String(options.state));
    assert.ok(html.includes('>下载模型并进入</button>'), String(options.state));
    assert.ok(html.includes('class="person-replacement-model-gate-primary"'), String(options.state));
    assert.ok(!html.includes('person-replacement-model-gate-checking'), String(options.state));
    assert.ok(!html.includes('disabled'), String(options.state));
  }
  assert.ok(renderPersonReplacementModelGate({}).includes('正在检查人物识别模型'));
  assert.ok(
    !renderPersonReplacementModelGate().includes('data-person-replacement-model-gate-action="install"'),
  );
});

test('modelGate: render installing 态渲染进度、百分比与禁用按钮', () => {
  const html = renderPersonReplacementModelGate({
    state: 'installing',
    downloadBytes: 1048576,
    installProgress: { state: 'verifying', downloadedBytes: 524288, totalBytes: 1048576, percent: 50 },
  });
  assert.ok(html.includes('class="person-replacement-model-gate-progress"'));
  assert.ok(html.includes('role="status"'));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes('<strong>正在校验下载内容</strong><span>50%</span>'));
  assert.ok(html.includes('<progress max="100" value="50" aria-label="人物识别模型下载进度">50%</progress>'));
  assert.ok(html.includes('<small>512 KB / 1.0 MB</small>'));
  assert.ok(html.includes('data-person-replacement-model-gate-action="cancel" disabled'));
  assert.ok(html.includes('data-person-replacement-model-gate-action="install" disabled'));
  assert.ok(html.includes('>正在下载…</button>'));
  assert.ok(!html.includes('person-replacement-model-gate-checking'));

  const empty = renderPersonReplacementModelGate({
    state: 'installing',
    downloadBytes: 0,
    installProgress: {},
  });
  assert.ok(empty.includes('<strong>正在下载所需资源</strong>'));
  assert.ok(empty.includes('<small>0 KB / 计算中</small>'));
  assert.ok(empty.includes('value="0"'));

  const complete = renderPersonReplacementModelGate({
    state: 'installing',
    installProgress: { state: 'complete' },
  });
  assert.ok(complete.includes('<strong>准备完成</strong>'));

  const unknownState = renderPersonReplacementModelGate({
    state: 'installing',
    installProgress: { state: 'whatever' },
  });
  assert.ok(unknownState.includes('<strong>正在下载所需资源</strong>'));
});

test('modelGate: render 百分比回落、clamp 与 0 被当作缺省', () => {
  const ratio = renderPersonReplacementModelGate({
    state: 'installing',
    downloadBytes: 100,
    installProgress: { downloadedBytes: 25, totalBytes: 100, percent: 0 },
  });
  assert.ok(ratio.includes('<span>25%</span>'), 'percent=0 视为缺省并按字节重算');

  const over = renderPersonReplacementModelGate({
    state: 'installing',
    installProgress: { downloadedBytes: 1, totalBytes: 1, percent: 150 },
  });
  assert.ok(over.includes('<span>100%</span>'));

  const negative = renderPersonReplacementModelGate({
    state: 'installing',
    installProgress: { downloadedBytes: 1, totalBytes: 1, percent: -20 },
  });
  assert.ok(negative.includes('<span>0%</span>'));

  const infinite = renderPersonReplacementModelGate({
    state: 'installing',
    installProgress: { downloadedBytes: 1, totalBytes: 1, percent: Infinity },
  });
  assert.ok(infinite.includes('<span>100%</span>'));

  const garbage = renderPersonReplacementModelGate({
    state: 'installing',
    installProgress: { downloadedBytes: 1, totalBytes: 4, percent: 'abc' },
  });
  assert.ok(garbage.includes('<span>25%</span>'));

  const roundDown = renderPersonReplacementModelGate({
    state: 'installing',
    installProgress: { downloadedBytes: 1, totalBytes: 1, percent: 12.4 },
  });
  assert.ok(roundDown.includes('value="12.4"'));
  assert.ok(roundDown.includes('<span>12%</span>'));
});

test('modelGate: render 错误转义、重新下载文案与 & 不二次转义', () => {
  const evil = '<img src=x onerror="alert(\'x\')">';
  const html = renderPersonReplacementModelGate({ state: 'missing', error: evil });
  assert.ok(html.includes('class="person-replacement-model-gate-error"'));
  assert.ok(html.includes('role="alert"'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(&#039;x&#039;)&quot;&gt;'));
  assert.ok(html.includes('>重新下载</button>'));

  const amp = renderPersonReplacementModelGate({ state: 'missing', error: 'a&b' });
  assert.ok(amp.includes('>a&amp;b</div>'));
  const preEscaped = renderPersonReplacementModelGate({ state: 'missing', error: '&lt;' });
  assert.ok(preEscaped.includes('&amp;lt;'));

  const silent = renderPersonReplacementModelGate({ state: 'error' });
  assert.ok(silent.includes('>下载模型并进入</button>'));
  assert.ok(!silent.includes('person-replacement-model-gate-error'));

  const checkingError = renderPersonReplacementModelGate({ state: 'checking', error: 'E' });
  assert.ok(checkingError.includes('person-replacement-model-gate-error'));
  assert.ok(checkingError.includes('class="person-replacement-model-gate-checking"'));
});

test('modelGate: render 不改动入参对象', () => {
  const progress = { state: 'verifying', downloadedBytes: 10, totalBytes: 20, percent: 50 };
  const progressSnapshot = { ...progress };
  const options = { state: 'installing', downloadBytes: 20, installProgress: progress, error: '' };
  renderPersonReplacementModelGate(options);
  assert.deepEqual(progress, progressSnapshot);
  assert.deepEqual(options, {
    state: 'installing',
    downloadBytes: 20,
    installProgress: progressSnapshot,
    error: '',
  });
});

test('modelGate: 导出别名等同，构造默认值冻结', () => {
  assert.equal(PersonReplacementModelGate, ReplacementStudioModelGate);
  const gate = new ReplacementStudioModelGate();
  assert.deepEqual(gate.status, {
    state: 'idle',
    installed: false,
    downloadBytes: 0,
    installProgress: {},
    error: '',
  });
  assert.equal(gate.document, undefined);
  assert.equal(gate.modelPackApi, null);
  assert.equal(gate.pollIntervalMs, 350);
  assert.equal(gate.dialogOpen, false);
  assert.equal(gate.pendingOpen, false);
  assert.equal(gate.destroyed, false);
  assert.equal(gate.root, null);
  assert.equal(gate.checkPromise, null);
  assert.equal(gate.installPromise, null);
  assert.equal(gate.pollTimer, 0);
  assert.equal(gate.pollInFlight, false);
  assert.equal(gate.returnFocusElement, null);
});

test('modelGate: pollIntervalMs 夹取到 [100, +)，非数字回落 350', () => {
  const cases = [
    [undefined, 350],
    [50, 100],
    [100, 100],
    [200, 200],
    [1000, 1000],
    [-5, 100],
    [0, 350],
    ['abc', 350],
    ['  250  ', 250],
    [NaN, 350],
  ];
  for (const [input, expected] of cases) {
    assert.equal(
      new ReplacementStudioModelGate({ pollIntervalMs: input }).pollIntervalMs,
      expected,
      String(input),
    );
  }
});

test('modelGate: requestOpen 在已安装时直接回调、销毁后返回 null', () => {
  const gate = new ReplacementStudioModelGate();
  gate.status = { ...gate.status, installed: true };
  assert.equal(gate.requestOpen(), null);
  assert.equal(
    gate.requestOpen(() => 'ready'),
    'ready',
  );
  assert.equal(gate.dialogOpen, false);

  const destroyed = new ReplacementStudioModelGate();
  destroyed.destroy();
  assert.equal(
    destroyed.requestOpen(() => 'nope'),
    null,
  );
});

test('modelGate: requestOpen 无 API 时同步落到 error 并挂载根节点', () => {
  const doc = createStubDocument();
  const gate = new ReplacementStudioModelGate({ documentObject: doc, modelPackApi: null });
  const returned = gate.requestOpen();
  assert.equal(returned, null);
  assert.equal(gate.pendingOpen, true);
  assert.equal(gate.dialogOpen, true);
  assert.equal(gate.status.state, 'error');
  assert.equal(gate.status.error, '人物识别模型服务尚未初始化。');
  assert.equal(gate.root === null, false);
  assert.equal(gate.root.className, 'person-replacement-model-gate');
  assert.equal(gate.root.dataset.personReplacementModelGate, '');
  assert.equal(gate.root.hidden, false);
  assert.ok(gate.root.innerHTML.includes('person-replacement-model-gate-backdrop'));
  assert.equal(typeof gate.root.listeners.click, 'function');
  assert.equal(typeof gate.root.listeners.keydown, 'function');
  assert.equal(doc.body.children.length, 1);
});

test('modelGate: checkStatus 就绪即解锁并触发 onReady', async () => {
  const doc = createStubDocument();
  let readyCalls = 0;
  const readyPack = { installed: true, model: 'm', models: [{ id: 'osnet-x' }] };
  const gate = new ReplacementStudioModelGate({
    documentObject: doc,
    modelPackApi: { getStatus: () => readyPack },
    onReady: () => readyCalls++,
  });
  gate.requestOpen(() => 'unused');
  await gate.checkPromise;
  assert.equal(gate.status.state, 'installed');
  assert.equal(gate.status.installed, true);
  assert.equal(gate.status.error, '');
  assert.equal(gate.dialogOpen, false);
  assert.equal(gate.pendingOpen, false);
  assert.equal(readyCalls, 1);
  assert.equal(gate.root.hidden, true);
});

test('modelGate: checkStatus 未就绪落 missing 并合并模型包字段', async () => {
  const pack = { installed: false, model: 'm', downloadBytes: 1234 };
  const gate = new ReplacementStudioModelGate({ modelPackApi: { getStatus: () => pack } });
  const status = await gate.checkStatus();
  assert.equal(status, gate.status);
  assert.equal(status.state, 'missing');
  assert.equal(status.installed, false);
  assert.equal(status.error, '');
  assert.equal(status.downloadBytes, 1234);
  assert.equal(gate.checkPromise, null);
});

test('modelGate: checkStatus 失败回落错误文案，并缓存进行中的 promise', async () => {
  for (const [reason, expected] of [
    [new Error('  boom  '), 'boom'],
    [new Error('   '), '无法检测人物识别模型状态。'],
    [null, '无法检测人物识别模型状态。'],
  ]) {
    const gate = new ReplacementStudioModelGate({
      modelPackApi: { getStatus: () => Promise.reject(reason) },
    });
    const status = await gate.checkStatus();
    assert.equal(status.state, 'error', String(reason));
    assert.equal(status.installed, false, String(reason));
    assert.equal(status.error, expected, String(reason));
  }

  const throwing = new ReplacementStudioModelGate({
    modelPackApi: {
      getStatus: () => {
        throw new Error('sync');
      },
    },
  });
  await assert.rejects(throwing.checkStatus(), /sync/);

  let calls = 0;
  const cached = new ReplacementStudioModelGate({
    modelPackApi: {
      getStatus: () => {
        calls++;
        return new Promise(() => {});
      },
    },
  });
  const first = cached.checkStatus();
  const second = cached.checkStatus();
  assert.equal(calls, 1);
  assert.equal(cached.checkPromise === null, false);
  assert.equal(typeof first.then, 'function');
  assert.equal(typeof second.then, 'function');

  const destroyed = new ReplacementStudioModelGate();
  destroyed.destroy();
  assert.equal(await destroyed.checkStatus(), destroyed.status);
});

test('modelGate: install 无 API 报错、过程态可见、成功通知并解锁', async () => {
  const noApi = new ReplacementStudioModelGate({ documentObject: createStubDocument(), modelPackApi: null });
  assert.equal(await noApi.install(), null);
  assert.equal(noApi.status.state, 'error');
  assert.equal(noApi.status.error, '人物识别模型下载服务尚未初始化。');
  assert.equal(noApi.status.installed, false);

  let resolveInstall;
  let installCalls = 0;
  const notified = [];
  const readyPack = { installed: true, model: 'm', models: [{ filename: 'a-reid.onnx' }] };
  const gate = new ReplacementStudioModelGate({
    documentObject: createStubDocument(),
    modelPackApi: {
      install: () => {
        installCalls++;
        return new Promise((resolve) => {
          resolveInstall = resolve;
        });
      },
      getStatus: () => new Promise(() => {}),
    },
    onNotify: (message, level) => notified.push([message, level]),
    setTimeoutFn: () => 0,
    clearTimeoutFn: () => {},
  });
  const pending = gate.install();
  assert.equal(gate.status.state, 'installing');
  assert.deepEqual(gate.status.installProgress, {
    state: 'downloading',
    downloadedBytes: 0,
    totalBytes: 0,
    percent: 0,
    message: '正在连接模型下载源',
  });
  assert.equal(gate.dialogOpen, true);
  assert.equal(gate.installPromise === null, false);
  const duplicate = gate.install();
  assert.equal(installCalls, 1);
  resolveInstall(readyPack);
  const status = await pending;
  await duplicate;
  assert.equal(status.state, 'installed');
  assert.equal(status.installed, true);
  assert.equal(status.error, '');
  assert.deepEqual(notified, [['人物识别模型下载完成。', 'success']]);
  assert.equal(gate.dialogOpen, false);
  assert.equal(gate.installPromise, null);
});

test('modelGate: install 失败回落文案，且 getStatus 复核通过可自愈', async () => {
  const failed = new ReplacementStudioModelGate({
    documentObject: createStubDocument(),
    modelPackApi: {
      install: () => Promise.reject(new Error(' down ')),
      getStatus: () => Promise.reject(new Error('nope')),
    },
    setTimeoutFn: () => 0,
    clearTimeoutFn: () => {},
  });
  const failedStatus = await failed.install();
  assert.equal(failedStatus.state, 'error');
  assert.equal(failedStatus.error, 'down');
  assert.equal(failedStatus.installed, false);

  const blank = new ReplacementStudioModelGate({
    documentObject: createStubDocument(),
    modelPackApi: {
      install: () => Promise.reject(new Error('')),
      getStatus: () => Promise.reject(null),
    },
    setTimeoutFn: () => 0,
    clearTimeoutFn: () => {},
  });
  const blankStatus = await blank.install();
  assert.equal(blankStatus.error, '人物识别模型下载失败。');

  const notified = [];
  const readyPack = { installed: true, model: 'm', models: [{ id: 'reid' }] };
  let statusCalls = 0;
  const healed = new ReplacementStudioModelGate({
    documentObject: createStubDocument(),
    modelPackApi: {
      install: () => Promise.reject(new Error('fail')),
      getStatus: () => {
        statusCalls++;
        return statusCalls === 1 ? new Promise(() => {}) : Promise.resolve(readyPack);
      },
    },
    onNotify: (message, level) => notified.push([message, level]),
    setTimeoutFn: () => 0,
    clearTimeoutFn: () => {},
  });
  const healedStatus = await healed.install();
  assert.equal(healedStatus.state, 'installed');
  assert.deepEqual(notified, [['人物识别模型下载完成。', 'success']]);
});

test('modelGate: dismiss 在安装中拒绝关闭', () => {
  const gate = new ReplacementStudioModelGate({ documentObject: createStubDocument() });
  gate.dialogOpen = true;
  gate.status = { ...gate.status, state: 'installing' };
  assert.equal(gate.dismiss(), false);
  assert.equal(gate.dialogOpen, true);

  gate.status = { ...gate.status, state: 'missing' };
  gate.pendingOpen = true;
  assert.equal(gate.dismiss(), true);
  assert.equal(gate.dialogOpen, false);
  assert.equal(gate.pendingOpen, false);
});

test('modelGate: 点击派发 cancel/install，未知动作与空事件安全', () => {
  const gate = new ReplacementStudioModelGate({ documentObject: createStubDocument(), modelPackApi: null });
  let dismissed = 0;
  gate.dismiss = () => {
    dismissed++;
    return true;
  };
  const clickOn = (action) => ({
    target: { closest: () => ({ dataset: { personReplacementModelGateAction: action } }) },
  });
  gate._handleClick(clickOn('cancel'));
  assert.equal(dismissed, 1);
  gate._handleClick(clickOn('other'));
  assert.equal(dismissed, 1);
  gate._handleClick({});
  assert.equal(dismissed, 1);

  const installer = new ReplacementStudioModelGate({
    documentObject: createStubDocument(),
    modelPackApi: null,
  });
  installer._handleClick(clickOn('install'));
  assert.equal(installer.status.state, 'error');
  assert.equal(installer.status.error, '人物识别模型下载服务尚未初始化。');
});

test('modelGate: 键鼠处理 Escape 关闭、安装中不关、Tab 无焦点回落', () => {
  const gate = new ReplacementStudioModelGate({ documentObject: createStubDocument() });
  let dismissed = 0;
  let prevented = 0;
  let stopped = 0;
  gate.dismiss = () => {
    dismissed++;
    return true;
  };
  gate.dialogOpen = true;
  gate._handleKeyDown({ key: 'Escape', preventDefault: () => prevented++, stopPropagation: () => stopped++ });
  assert.equal(dismissed, 1);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);

  gate.status = { ...gate.status, state: 'installing' };
  gate._handleKeyDown({ key: 'Escape', preventDefault: () => prevented++, stopPropagation: () => {} });
  assert.equal(dismissed, 1);

  gate.status = { ...gate.status, state: 'missing' };
  gate._handleKeyDown({ key: 'a', preventDefault: () => prevented++ });
  assert.equal(dismissed, 1);

  gate.dialogOpen = false;
  gate._handleKeyDown({
    key: 'Escape',
    preventDefault: () => {
      throw new Error('不应触发');
    },
  });
  assert.equal(dismissed, 1);

  gate.dialogOpen = true;
  gate.root = { querySelector: () => null };
  const tabPrevented = [];
  gate._handleKeyDown({ key: 'Tab', preventDefault: () => tabPrevented.push(true), shiftKey: false });
  assert.equal(tabPrevented.length, 1);
  assert.deepEqual(gate._getFocusableElements(), []);
});

test('modelGate: Tab 焦点陷阱只在首尾回环并跳过 hidden/aria-hidden 元素', () => {
  const doc = createStubDocument();
  const gate = new ReplacementStudioModelGate({ documentObject: doc });
  gate.dialogOpen = true;

  const focused = [];
  const makeItem = (name, over = {}) => ({
    name,
    hidden: false,
    getAttribute: () => null,
    focus(options) {
      focused.push([name, options]);
      doc.activeElement = this;
    },
    ...over,
  });
  const hiddenItem = makeItem('hidden', { hidden: true });
  const ariaHiddenItem = makeItem('ariaHidden', { getAttribute: () => 'true' });
  const first = makeItem('first');
  const last = makeItem('last');
  const dialog = {
    focus() {
      focused.push(['dialog', null]);
    },
    querySelectorAll: () => [hiddenItem, ariaHiddenItem, first, last],
  };
  gate.root = {
    querySelector: (selector) => (selector === '.person-replacement-model-gate-dialog' ? dialog : null),
  };
  assert.deepEqual(gate._getFocusableElements(), [first, last], 'hidden/aria-hidden 被剔除');

  const prevented = [];
  const tab = (over = {}) => ({
    key: 'Tab',
    shiftKey: false,
    preventDefault: () => prevented.push(true),
    ...over,
  });

  doc.activeElement = last;
  gate._handleKeyDown(tab());
  assert.equal(prevented.length, 1, '尾部 Tab 被拦截');
  assert.equal(focused.length, 1);
  assert.equal(focused[0][0], 'first', '尾部 Tab 回到首个');
  assert.deepEqual(focused[0][1], { preventScroll: true });

  doc.activeElement = first;
  gate._handleKeyDown(tab({ shiftKey: true }));
  assert.equal(prevented.length, 2, '头部 Shift+Tab 被拦截');
  assert.equal(focused.length, 2);
  assert.equal(focused[1][0], 'last', '头部 Shift+Tab 回到末个');

  doc.activeElement = first;
  gate._handleKeyDown(tab());
  assert.equal(focused.length, 2, '中间元素不拦截');

  doc.activeElement = last;
  gate._handleKeyDown(tab({ shiftKey: true }));
  assert.equal(focused.length, 2, '中间元素 Shift+Tab 不拦截');

  doc.activeElement = doc.body;
  gate._handleKeyDown(tab());
  assert.equal(prevented.length, 3, '焦点不在列表内也拦截');
  assert.equal(focused.length, 3);
  assert.equal(focused[2][0], 'first');
});

test('modelGate: render 同步到根节点，关闭时清空并隐藏', () => {
  const doc = createStubDocument();
  const gate = new ReplacementStudioModelGate({ documentObject: doc, modelPackApi: null });
  gate.render();
  assert.equal(gate.root, null);

  gate.dialogOpen = true;
  gate.render();
  assert.equal(gate.root === null, false);
  assert.equal(gate.root.hidden, false);
  assert.ok(gate.root.innerHTML.includes('person-replacement-model-gate-backdrop'));

  gate.dialogOpen = false;
  gate.render();
  assert.equal(gate.root.hidden, true);
  assert.equal(gate.root.innerHTML, '');
  assert.equal(gate.root.className, 'person-replacement-model-gate');
});

test('modelGate: 焦点捕获与恢复按 isConnected / querySelector 顺序', () => {
  const doc = createStubDocument();
  const gate = new ReplacementStudioModelGate({ documentObject: doc });
  gate._captureReturnFocus();
  assert.equal(gate.returnFocusElement, null);

  const trigger = createStubElement('button');
  trigger.isConnected = true;
  doc.activeElement = trigger;
  gate._captureReturnFocus();
  assert.equal(gate.returnFocusElement, trigger);

  doc.activeElement = doc.body;
  assert.equal(gate._restoreFocus(), false);

  const fallback = createStubElement('button');
  fallback.isConnected = true;
  fallback.focus = () => {
    doc.activeElement = fallback;
  };
  doc.querySelector = (selector) => (selector === '.workspace-mode-current' ? fallback : null);
  assert.equal(gate._restoreFocus(), true);
  assert.equal(gate.returnFocusElement, null);

  doc.querySelector = (selector) =>
    selector === '[data-story-workspace-mode="person-replacement"]' ? fallback : null;
  assert.equal(gate._restoreFocus(), true);
});

test('modelGate: destroy 幂等并解绑监听', () => {
  const doc = createStubDocument();
  const gate = new ReplacementStudioModelGate({ documentObject: doc, modelPackApi: null });
  gate.requestOpen();
  const root = gate.root;
  assert.equal(typeof root.listeners.click, 'function');
  gate.destroy();
  assert.equal(gate.destroyed, true);
  assert.equal(gate.root, null);
  assert.equal(root.removed, true);
  assert.equal(root.listeners.click, undefined);
  assert.equal(root.listeners.keydown, undefined);
  gate.destroy();
  assert.equal(gate.destroyed, true);
});
