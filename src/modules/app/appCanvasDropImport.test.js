import test from 'node:test';
import assert from 'node:assert/strict';
import {
  installAppCanvasDropImport,
  openAppCanvasFilePicker,
  runAppCanvasFileImport,
} from './appCanvasDropImport.js';

const NODE_DRAG_MIME = 'application/x-aicanvas-node-id';
const UI_STOP_SELECTOR = '[data-ui-stop="1"]';

const originalDocument = globalThis.document;

const settle = () => new Promise((resolve) => setImmediate(resolve));

test.afterEach(() => {
  if (originalDocument === undefined) delete globalThis.document;
  else globalThis.document = originalDocument;
});

function makeDragEvent(over = {}) {
  const calls = { preventDefault: 0, stopPropagation: 0 };
  return {
    calls,
    dataTransfer: 'dataTransfer' in over ? over.dataTransfer : { types: [] },
    target: 'target' in over ? over.target : null,
    clientX: 'clientX' in over ? over.clientX : 0,
    clientY: 'clientY' in over ? over.clientY : 0,
    preventDefault() {
      calls.preventDefault += 1;
    },
    stopPropagation() {
      calls.stopPropagation += 1;
    },
  };
}

function makeDocument(over = {}) {
  const created = [];
  const appended = [];
  function createElement(tagName) {
    const element = {
      tagName,
      style: {},
      registrations: [],
      removed: 0,
      clicks: 0,
      addEventListener(type, handler, options) {
        this.registrations.push({ type, handler, options });
      },
      remove() {
        this.removed += 1;
      },
      click() {
        this.clicks += 1;
        if (over.throwOnClick === true) throw new Error('click failed');
      },
    };
    created.push(element);
    return element;
  }
  return {
    created,
    appended,
    createElement,
    body: {
      appendChild(node) {
        if (over.throwOnAppend === true) throw new Error('append failed');
        appended.push(node);
        return node;
      },
    },
  };
}

function registrationOf(element, type) {
  return element.registrations.find((entry) => entry.type === type);
}

function makeTarget() {
  const handlers = new Map();
  const removed = [];
  return {
    handlers,
    removed,
    addEventListener(type, handler) {
      handlers.set(type, handler);
    },
    removeEventListener(type, handler) {
      removed.push(type);
      if (handlers.get(type) === handler) handlers.delete(type);
    },
  };
}

function createDropHarness(over = {}) {
  const targetEl = makeTarget();
  const drops = [];
  const commits = [];
  const webDrops = [];
  const projectIdCalls = [];
  const install = installAppCanvasDropImport({
    targetEl,
    handleFileDrop:
      'handleFileDrop' in over
        ? over.handleFileDrop
        : async (event, projectId) => {
            drops.push([event, projectId]);
            return true;
          },
    handleWebImageUrlDrop:
      'handleWebImageUrlDrop' in over
        ? over.handleWebImageUrlDrop
        : async (event, options) => {
            webDrops.push([event, options]);
            return false;
          },
    commit: 'commit' in over ? over.commit : () => commits.push(1),
    getCurrentProjectId:
      'getCurrentProjectId' in over
        ? over.getCurrentProjectId
        : () => {
            projectIdCalls.push(1);
            return 'p7';
          },
  });
  return {
    targetEl,
    drops,
    commits,
    webDrops,
    projectIdCalls,
    install,
    dragover: targetEl.handlers.get('dragover'),
    drop: targetEl.handlers.get('drop'),
  };
}

test('appCanvasDropImport: runAppCanvasFileImport 透传事件与项目号，缺省回落 default_v2_project', async () => {
  for (const [input, expected] of [
    [undefined, 'default_v2_project'],
    ['', 'default_v2_project'],
    [0, 'default_v2_project'],
    [null, 'default_v2_project'],
    [false, 'default_v2_project'],
    ['p9', 'p9'],
  ]) {
    const calls = [];
    const event = makeDragEvent();
    const result = await runAppCanvasFileImport({
      event,
      projectId: input,
      handleFileDrop: async (receivedEvent, projectId) => {
        calls.push([receivedEvent, projectId]);
        return false;
      },
    });
    assert.equal(result, false, String(input));
    assert.deepEqual(calls, [[event, expected]], String(input));
  }
});

test('appCanvasDropImport: runAppCanvasFileImport 只在严格 true 时返回真，假值不提交', async () => {
  const commits = [];
  const ok = await runAppCanvasFileImport({
    event: makeDragEvent(),
    handleFileDrop: async () => true,
    commit: () => commits.push('commit'),
  });
  assert.equal(ok, true);
  assert.deepEqual(commits, ['commit']);
  for (const value of [0, null, undefined, '', false, NaN]) {
    const seen = [];
    const result = await runAppCanvasFileImport({
      handleFileDrop: async () => value,
      commit: () => seen.push('commit'),
    });
    assert.equal(result, false, String(value));
    assert.deepEqual(seen, [], String(value));
  }
  const missing = await runAppCanvasFileImport({ commit: () => commits.push('extra') });
  assert.equal(missing, false);
  assert.deepEqual(commits, ['commit']);
});

test('appCanvasDropImport: 真值非 true 仍会提交但返回 false', async () => {
  for (const value of [1, 'true', {}, [], 'yes']) {
    const seen = [];
    const result = await runAppCanvasFileImport({
      handleFileDrop: async () => value,
      commit: () => seen.push('commit'),
    });
    assert.equal(result, false, String(value));
    assert.deepEqual(seen, ['commit'], String(value));
  }
});

test('appCanvasDropImport: runAppCanvasFileImport 原样抛出处理器异常', async () => {
  await assert.rejects(
    () =>
      runAppCanvasFileImport({
        handleFileDrop: async () => {
          throw new Error('boom');
        },
      }),
    /boom/,
  );
});

test('appCanvasDropImport: openAppCanvasFilePicker 宿主不可用时返回 false', () => {
  for (const documentObject of [
    null,
    undefined,
    {},
    'nope',
    { createElement: 'x', body: { appendChild() {} } },
    { createElement() {} },
    { createElement() {}, body: {} },
    { createElement() {}, body: { appendChild: 1 } },
  ]) {
    assert.equal(openAppCanvasFilePicker({ documentObject }), false, String(documentObject));
  }
  assert.equal(openAppCanvasFilePicker(), false);
});

test('appCanvasDropImport: openAppCanvasFilePicker 挂载隐藏 input 并点击', () => {
  const documentObject = makeDocument();
  const result = openAppCanvasFilePicker({
    documentObject,
    projectId: 'p1',
    handleFileDrop: async () => true,
  });
  assert.equal(result, true);
  assert.equal(documentObject.created.length, 1);
  const element = documentObject.created[0];
  assert.equal(element.tagName, 'input');
  assert.equal(element.type, 'file');
  assert.equal(element.accept, 'image/*,video/*,audio/*');
  assert.equal(element.multiple, true);
  assert.deepEqual(element.style, {
    position: 'fixed',
    left: '-9999px',
    top: '-9999px',
    opacity: '0',
  });
  assert.deepEqual(documentObject.appended, [element]);
  assert.equal(element.clicks, 1);
  assert.deepEqual(element.registrations.map((entry) => entry.type).sort(), ['cancel', 'change']);
  assert.deepEqual(registrationOf(element, 'cancel').options, { once: true });
  assert.deepEqual(registrationOf(element, 'change').options, { once: true });
  assert.equal(element.removed, 0);
});

test('appCanvasDropImport: change 事件构造合成事件并导入文件', async () => {
  const documentObject = makeDocument();
  const imports = [];
  const seen = [];
  const fileA = { name: 'a.png' };
  const fileB = { name: 'b.mp4' };
  openAppCanvasFilePicker({
    documentObject,
    projectId: 'p-in',
    clientX: ' 12 ',
    clientY: -3,
    handleFileDrop: async (event, projectId) => {
      imports.push({ event, projectId });
      return true;
    },
    commit: () => seen.push('commit'),
    onUnsupported: () => seen.push('unsupported'),
    onError: (error) => seen.push(['error', error]),
  });
  const element = documentObject.created[0];
  const change = registrationOf(element, 'change').handler;
  change({ target: { files: { 0: fileA, 1: fileB, length: 2 } } });
  assert.equal(element.removed, 1);
  assert.equal(imports.length, 1);
  assert.deepEqual(seen, []);
  await settle();
  assert.equal(imports[0].projectId, 'p-in');
  assert.deepEqual(imports[0].event.dataTransfer.files, [fileA, fileB]);
  assert.equal(imports[0].event.clientX, 12);
  assert.equal(imports[0].event.clientY, -3);
  assert.equal(typeof imports[0].event.preventDefault, 'function');
  assert.equal(typeof imports[0].event.stopPropagation, 'function');
  assert.deepEqual(seen, ['commit']);
});

test('appCanvasDropImport: clientX/clientY 非有限数归零', async () => {
  for (const [input, expected] of [
    [Infinity, 0],
    [-Infinity, 0],
    [NaN, 0],
    ['abc', 0],
    [null, 0],
    [{}, 0],
    ['', 0],
    [' 8 ', 8],
    ['-2', -2],
    [true, 1],
    [undefined, 0],
  ]) {
    let captured;
    const documentObject = makeDocument();
    openAppCanvasFilePicker({
      documentObject,
      clientX: input,
      clientY: input,
      handleFileDrop: async (event) => {
        captured = event;
        return true;
      },
    });
    registrationOf(documentObject.created[0], 'change').handler({
      target: { files: [{ name: 'f' }] },
    });
    await settle();
    assert.equal(captured.clientX, expected, String(input));
    assert.equal(captured.clientY, expected, String(input));
  }
});

test('appCanvasDropImport: 负零坐标被原样保留', async () => {
  let captured;
  const documentObject = makeDocument();
  openAppCanvasFilePicker({
    documentObject,
    clientX: '-0',
    clientY: -0,
    handleFileDrop: async (event) => {
      captured = event;
      return true;
    },
  });
  registrationOf(documentObject.created[0], 'change').handler({
    target: { files: [{ name: 'f' }] },
  });
  await settle();
  assert.ok(Object.is(captured.clientX, -0));
  assert.ok(Object.is(captured.clientY, -0));
  assert.ok(captured.clientX === 0);
});

test('appCanvasDropImport: 空文件列表只清理不导入，dispose 幂等', async () => {
  const documentObject = makeDocument();
  const imports = [];
  openAppCanvasFilePicker({
    documentObject,
    handleFileDrop: async () => {
      imports.push(1);
      return true;
    },
  });
  const element = documentObject.created[0];
  const change = registrationOf(element, 'change').handler;
  change({ target: { files: [] } });
  await settle();
  assert.equal(element.removed, 1);
  assert.deepEqual(imports, []);
  registrationOf(element, 'cancel').handler();
  assert.equal(element.removed, 1);
  change({ target: {} });
  await settle();
  assert.deepEqual(imports, []);
});

test('appCanvasDropImport: 清理后 change 仍会执行导入', async () => {
  const documentObject = makeDocument();
  const imports = [];
  openAppCanvasFilePicker({
    documentObject,
    handleFileDrop: async () => {
      imports.push(1);
      return true;
    },
  });
  const element = documentObject.created[0];
  registrationOf(element, 'cancel').handler();
  assert.equal(element.removed, 1);
  registrationOf(element, 'change').handler({ target: { files: [{ name: 'f' }] } });
  await settle();
  assert.equal(element.removed, 1);
  assert.deepEqual(imports, [1]);
});

test('appCanvasDropImport: 导入未命中回调 onUnsupported，抛错回调 onError', async () => {
  const unsupported = [];
  const unsupportedDoc = makeDocument();
  openAppCanvasFilePicker({
    documentObject: unsupportedDoc,
    handleFileDrop: async () => false,
    onUnsupported: () => unsupported.push('unsupported'),
    onError: (error) => unsupported.push(['error', error]),
  });
  registrationOf(unsupportedDoc.created[0], 'change').handler({
    target: { files: [{ name: 'f' }] },
  });
  await settle();
  assert.deepEqual(unsupported, ['unsupported']);

  const errors = [];
  const errorDoc = makeDocument();
  openAppCanvasFilePicker({
    documentObject: errorDoc,
    handleFileDrop: async () => {
      throw new Error('drop boom');
    },
    onUnsupported: () => errors.push('unsupported'),
    onError: (error) => errors.push(error),
  });
  registrationOf(errorDoc.created[0], 'change').handler({
    target: { files: [{ name: 'f' }] },
  });
  await settle();
  assert.equal(errors.length, 1);
  assert.equal(errors[0].message, 'drop boom');

  const quietDoc = makeDocument();
  openAppCanvasFilePicker({
    documentObject: quietDoc,
    handleFileDrop: async () => {
      throw new Error('quiet');
    },
  });
  registrationOf(quietDoc.created[0], 'change').handler({
    target: { files: [{ name: 'f' }] },
  });
  await settle();
  assert.equal(quietDoc.created[0].removed, 1);
});

test('appCanvasDropImport: appendChild 或 click 抛错时清理并返回 false', () => {
  const appendErrors = [];
  const appendDoc = makeDocument({ throwOnAppend: true });
  assert.equal(
    openAppCanvasFilePicker({
      documentObject: appendDoc,
      handleFileDrop: async () => true,
      onError: (error) => appendErrors.push(error),
    }),
    false,
  );
  assert.equal(appendDoc.created[0].removed, 1);
  assert.equal(appendDoc.created[0].clicks, 0);
  assert.deepEqual(appendDoc.appended, []);
  assert.equal(appendErrors.length, 1);
  assert.equal(appendErrors[0].message, 'append failed');

  const clickErrors = [];
  const clickDoc = makeDocument({ throwOnClick: true });
  assert.equal(
    openAppCanvasFilePicker({
      documentObject: clickDoc,
      handleFileDrop: async () => true,
      onError: (error) => clickErrors.push(error),
    }),
    false,
  );
  assert.equal(clickDoc.created[0].removed, 1);
  assert.equal(clickDoc.created[0].clicks, 1);
  assert.equal(clickDoc.appended.length, 1);
  assert.equal(clickErrors.length, 1);
  assert.equal(clickErrors[0].message, 'click failed');

  assert.equal(openAppCanvasFilePicker({ documentObject: makeDocument({ throwOnClick: true }) }), false);
});

test('appCanvasDropImport: 缺省 documentObject 回退到全局 document', () => {
  const documentObject = makeDocument();
  globalThis.document = documentObject;
  try {
    assert.equal(openAppCanvasFilePicker({ handleFileDrop: async () => true }), true);
    assert.equal(documentObject.appended.length, 1);
  } finally {
    delete globalThis.document;
  }
  assert.equal(openAppCanvasFilePicker({ handleFileDrop: async () => true }), false);
});

test('appCanvasDropImport: 无 targetEl 返回空抑制器', () => {
  for (const targetEl of [undefined, null, 0, '']) {
    const dispose = installAppCanvasDropImport({ targetEl });
    assert.equal(typeof dispose, 'function', String(targetEl));
    assert.equal(dispose(), undefined, String(targetEl));
  }
});

test('appCanvasDropImport: 注册 dragover/drop 并返回反注册函数', () => {
  const harness = createDropHarness();
  assert.deepEqual([...harness.targetEl.handlers.keys()].sort(), ['dragover', 'drop']);
  assert.equal(typeof harness.dragover, 'function');
  assert.equal(typeof harness.drop, 'function');
  assert.notEqual(harness.dragover, harness.drop);
  assert.equal(typeof harness.install, 'function');
  harness.install();
  assert.deepEqual([...harness.targetEl.handlers.keys()], []);
  assert.deepEqual(harness.targetEl.removed, ['dragover', 'drop']);
});

test('appCanvasDropImport: dragover 只在非节点拖拽和非 UI 停止区时阻止默认', () => {
  const harness = createDropHarness();
  const plain = makeDragEvent();
  harness.dragover(plain);
  assert.equal(plain.calls.preventDefault, 1);

  const noTarget = makeDragEvent({ target: { closest: () => null } });
  harness.dragover(noTarget);
  assert.equal(noTarget.calls.preventDefault, 1);

  for (const dataTransfer of [
    { types: [NODE_DRAG_MIME] },
    { types: ['text/plain', NODE_DRAG_MIME] },
  ]) {
    const event = makeDragEvent({ dataTransfer });
    harness.dragover(event);
    assert.equal(event.calls.preventDefault, 0, String(dataTransfer));
  }

  // types 必须是数组；字符串形态不会被识别为节点拖拽
  const stringTypes = makeDragEvent({ dataTransfer: { types: NODE_DRAG_MIME } });
  harness.dragover(stringTypes);
  assert.equal(stringTypes.calls.preventDefault, 1);

  const blocked = makeDragEvent({
    target: {
      closest: (selector) => selector === UI_STOP_SELECTOR,
    },
  });
  harness.dragover(blocked);
  assert.equal(blocked.calls.preventDefault, 0);
  assert.equal(blocked.calls.stopPropagation, 0);

  const noTypes = makeDragEvent({ dataTransfer: undefined });
  harness.dragover(noTypes);
  assert.equal(noTypes.calls.preventDefault, 1);
});

test('appCanvasDropImport: drop 对节点拖拽与 UI 停止区短路', async () => {
  for (const event of [
    makeDragEvent({ dataTransfer: { types: [NODE_DRAG_MIME] } }),
    makeDragEvent({ target: { closest: () => '1' } }),
  ]) {
    const harness = createDropHarness();
    await harness.drop(event);
    assert.deepEqual(harness.drops, []);
    assert.deepEqual(harness.webDrops, []);
    assert.deepEqual(harness.commits, []);
    assert.deepEqual(harness.projectIdCalls, []);
  }
});

test('appCanvasDropImport: drop 优先文件导入并提交，成功后不再转交网页图片', async () => {
  const harness = createDropHarness();
  const event = makeDragEvent();
  await harness.drop(event);
  assert.deepEqual(harness.drops, [[event, 'p7']]);
  assert.deepEqual(harness.commits, [1]);
  assert.deepEqual(harness.webDrops, []);
  assert.equal(harness.projectIdCalls.length, 1);
});

test('appCanvasDropImport: drop 项目号缺省回落 default_v2_project', async () => {
  for (const [input, expected] of [
    [undefined, 'default_v2_project'],
    ['', 'default_v2_project'],
    [0, 'default_v2_project'],
    [false, 'default_v2_project'],
    [null, 'default_v2_project'],
    ['p-9', 'p-9'],
  ]) {
    const projectIds = [];
    const harness = createDropHarness({
      getCurrentProjectId: () => input,
      handleFileDrop: async (event, projectId) => {
        projectIds.push(projectId);
        return true;
      },
    });
    await harness.drop(makeDragEvent());
    assert.deepEqual(projectIds, [expected], String(input));
    assert.deepEqual(harness.commits, [1], String(input));
  }
});

test('appCanvasDropImport: 文件导入未命中时转交网页图片 URL 导入', async () => {
  const webCalls = [];
  const harness = createDropHarness({
    handleFileDrop: async () => false,
    handleWebImageUrlDrop: async (event, options) => {
      webCalls.push([event, options]);
      return true;
    },
  });
  const event = makeDragEvent();
  await harness.drop(event);
  assert.deepEqual(harness.drops, []);
  assert.deepEqual(webCalls, [[event, { projectId: 'p7' }]]);
  assert.deepEqual(harness.commits, [1]);

  const noCommit = createDropHarness({
    handleFileDrop: async () => false,
    handleWebImageUrlDrop: async () => false,
  });
  await noCommit.drop(makeDragEvent());
  assert.deepEqual(noCommit.commits, []);

  const missingHook = createDropHarness({
    handleFileDrop: async () => false,
    handleWebImageUrlDrop: undefined,
  });
  await missingHook.drop(makeDragEvent());
  assert.deepEqual(missingHook.commits, []);
});

test('appCanvasDropImport: 未提供任何处理器时 drop 安全结束', async () => {
  const targetEl = makeTarget();
  installAppCanvasDropImport({ targetEl });
  const event = makeDragEvent();
  await targetEl.handlers.get('drop')(event);
  assert.equal(event.calls.preventDefault, 0);
});

test('appCanvasDropImport: drop 处理器异常向上传播', async () => {
  const fileFailure = createDropHarness({
    handleFileDrop: async () => {
      throw new Error('file boom');
    },
  });
  await assert.rejects(() => fileFailure.drop(makeDragEvent()), /file boom/);
  assert.deepEqual(fileFailure.commits, []);

  const webFailure = createDropHarness({
    handleFileDrop: async () => false,
    handleWebImageUrlDrop: async () => {
      throw new Error('web boom');
    },
  });
  await assert.rejects(() => webFailure.drop(makeDragEvent()), /web boom/);
  assert.deepEqual(webFailure.commits, []);
});
