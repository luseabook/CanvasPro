import test from 'node:test';
import assert from 'node:assert/strict';
import { REVERSE_IMAGE_PROMPT_PRESET_PROMPT } from '../promptPresets.js';
import { installGlobalScreenshotBridge } from './globalScreenshotBridge.js';

function createHarness(over = {}) {
  const captureHandlers = [];
  const statusHandlers = [];
  const created = [];
  const commands = [];
  const toasts = [];
  const logs = [];
  const translateCalls = [];
  const mountedProbes = [];
  const identity = { value: 'identity' in over ? over.identity : 'canvas-1' };
  const screenshotApi =
    'screenshotApi' in over
      ? over.screenshotApi
      : {
          onGlobalCapture: (handler) => {
            captureHandlers.push(handler);
            return () => {};
          },
          onGlobalShortcutStatus: (handler) => {
            statusHandlers.push(handler);
            return () => {};
          },
        };
  const translate =
    'translate' in over
      ? over.translate
      : (key, params = {}) => {
          translateCalls.push({ key, params });
          return 'T:' + key;
        };
  const createMediaNodeFromBlob =
    'createMediaNodeFromBlob' in over
      ? over.createMediaNodeFromBlob
      : async (blob, mimeType, options) => {
          created.push({ blob, mimeType, options });
          return 'createResult' in over ? over.createResult : { id: 'media-1' };
        };
  const executeCanvasCommand =
    'executeCanvasCommand' in over
      ? over.executeCanvasCommand
      : async (name, args) => {
          commands.push({ name, args });
          return name === 'node.createConnected'
            ? { ok: true, result: { nodeId: 'text-1' } }
            : { ok: true, result: {} };
        };
  const isNodeMounted =
    'isNodeMounted' in over
      ? over.isNodeMounted
      : (nodeId) => {
          mountedProbes.push(nodeId);
          return true;
        };
  installGlobalScreenshotBridge({
    screenshotApi,
    createMediaNodeFromBlob,
    showToast:
      'showToast' in over
        ? over.showToast
        : (message, level) => {
            toasts.push({ message, level });
          },
    translate,
    executeCanvasCommand,
    isNodeMounted,
    scheduleFrame: 'scheduleFrame' in over ? over.scheduleFrame : (callback) => callback(),
    getCanvasIdentity:
      'getCanvasIdentity' in over ? over.getCanvasIdentity : () => identity.value,
    consoleObject:
      'consoleObject' in over ? over.consoleObject : { error: (...args) => logs.push(args) },
  });
  return {
    captureHandlers,
    statusHandlers,
    created,
    commands,
    toasts,
    logs,
    translateCalls,
    mountedProbes,
    identity,
    async deliver(payload) {
      assert.equal(captureHandlers.length, 1);
      await captureHandlers[0](payload);
    },
    deliverStatus(payload) {
      assert.equal(statusHandlers.length, 1);
      statusHandlers[0](payload);
    },
  };
}

test('globalScreenshotBridge: 缺少 screenshotApi 时返回 undefined 且两个钩子缺失也安全', () => {
  assert.equal(installGlobalScreenshotBridge(), undefined);
  assert.equal(installGlobalScreenshotBridge({}), undefined);
  assert.equal(installGlobalScreenshotBridge({ screenshotApi: null }), undefined);
  assert.equal(installGlobalScreenshotBridge({ screenshotApi: {} }), undefined);
  assert.equal(installGlobalScreenshotBridge({ screenshotApi: { onGlobalCapture() {} } }), undefined);
  assert.equal(installGlobalScreenshotBridge({ screenshotApi: { onGlobalShortcutStatus() {} } }), undefined);
});

test('globalScreenshotBridge: 可选调用不吞掉非函数钩子', () => {
  assert.throws(
    () => installGlobalScreenshotBridge({ screenshotApi: { onGlobalCapture: 'nope' } }),
    TypeError,
  );
});

test('globalScreenshotBridge: 空或空白 pngBase64 不创建节点也不提示', async () => {
  for (const pngBase64 of ['', '   ', 0, null, undefined, false]) {
    const harness = createHarness();
    await harness.deliver({ pngBase64 });
    assert.equal(harness.captureHandlers.length, 1, String(pngBase64));
    assert.deepEqual(harness.created, [], String(pngBase64));
    assert.deepEqual(harness.commands, [], String(pngBase64));
    assert.deepEqual(harness.toasts, [], String(pngBase64));
    assert.deepEqual(harness.logs, [], String(pngBase64));
  }
  const noPayload = createHarness();
  await noPayload.deliver();
  assert.deepEqual(noPayload.toasts, []);
  assert.deepEqual(noPayload.created, []);
});

test('globalScreenshotBridge: base64 转 Blob 并按默认 mime 创建媒体节点', async () => {
  const harness = createHarness();
  await harness.deliver({ pngBase64: '  QUJD  ' });
  assert.equal(harness.created.length, 1);
  const { blob, mimeType, options } = harness.created[0];
  assert.ok(blob instanceof Blob);
  assert.equal(blob.type, 'image/png');
  assert.equal(blob.size, 3);
  assert.equal(await blob.text(), 'ABC');
  assert.equal(mimeType, 'image/png');
  assert.deepEqual(options, {
    name: 'T:globalScreenshot.nodeName',
    placement: 'viewport-center-sequence',
    sequenceKey: 'global-screenshot',
  });
  assert.equal('returnNode' in options, false);
  assert.equal('isImportCurrent' in options, false);
  assert.deepEqual(harness.toasts, [{ message: 'T:globalScreenshot.added', level: 'success' }]);
  assert.deepEqual(harness.translateCalls, [
    { key: 'globalScreenshot.nodeName', params: {} },
    { key: 'globalScreenshot.added', params: {} },
  ]);
});

test('globalScreenshotBridge: mimeType 原样使用且空值回落 image/png', async () => {
  for (const [mimeType, expected] of [
    ['image/jpeg', 'image/jpeg'],
    ['image/webp', 'image/webp'],
    ['', 'image/png'],
    [0, 'image/png'],
    [null, 'image/png'],
  ]) {
    const harness = createHarness();
    await harness.deliver({ pngBase64: 'QUJD', mimeType });
    assert.equal(harness.created[0].mimeType, expected, String(mimeType));
    assert.equal(harness.created[0].blob.type, expected, String(mimeType));
  }
});

test('globalScreenshotBridge: 超过 8192 字节的 base64 分块解码后字节完整', async () => {
  const source = 'x'.repeat(9000);
  const harness = createHarness();
  await harness.deliver({ pngBase64: Buffer.from(source, 'utf8').toString('base64') });
  const { blob } = harness.created[0];
  assert.equal(blob.size, 9000);
  const text = await blob.text();
  assert.equal(text.length, 9000);
  assert.equal(text[8999], 'x');
  assert.equal(text[0], 'x');
});

test('globalScreenshotBridge: 未拿到媒体节点或非法 base64 时提示导入失败', async () => {
  const noNode = createHarness({ createResult: null });
  await noNode.deliver({ pngBase64: 'QUJD' });
  assert.deepEqual(noNode.toasts, [{ message: 'T:globalScreenshot.importFailed', level: 'error' }]);
  assert.deepEqual(noNode.logs, []);

  const reverseNoNode = createHarness({ createResult: null });
  await reverseNoNode.deliver({ pngBase64: 'QUJD', actionId: 'reverse-prompt' });
  assert.deepEqual(reverseNoNode.toasts, [
    { message: 'T:globalScreenshot.importFailed', level: 'error' },
  ]);
  assert.deepEqual(reverseNoNode.commands, []);

  const brokenBase64 = createHarness();
  await brokenBase64.deliver({ pngBase64: '!!!!' });
  assert.deepEqual(brokenBase64.created, []);
  assert.equal(brokenBase64.logs.length, 1);
  assert.deepEqual(brokenBase64.toasts, [
    { message: 'T:globalScreenshot.importFailed', level: 'error' },
  ]);
});

test('globalScreenshotBridge: 创建过程抛错时记录日志并提示导入失败', async () => {
  const harness = createHarness({
    createMediaNodeFromBlob: async () => {
      throw new Error('blob exploded');
    },
  });
  await harness.deliver({ pngBase64: 'QUJD' });
  assert.equal(harness.logs.length, 1);
  assert.equal(harness.logs[0][0], '[screenshot] failed to import global capture');
  assert.equal(harness.logs[0][1].message, 'blob exploded');
  assert.deepEqual(harness.toasts, [
    { message: 'T:globalScreenshot.importFailed', level: 'error' },
  ]);
});

test('globalScreenshotBridge: reverse-prompt 创建反推节点并写入预设提示词', async () => {
  const harness = createHarness();
  await harness.deliver({ pngBase64: 'QUJD', actionId: 'reverse-prompt' });
  const { options } = harness.created[0];
  assert.equal(options.returnNode, true);
  assert.equal(typeof options.isImportCurrent, 'function');
  assert.equal(options.isImportCurrent(), true);
  assert.deepEqual(harness.commands, [
    {
      name: 'node.createConnected',
      args: {
        sourceId: 'media-1',
        type: 'ai-text',
        inheritSource: false,
        name: 'T:globalScreenshot.reverseNodeName',
      },
    },
    {
      name: 'node.setPrompt',
      args: { nodeId: 'text-1', text: REVERSE_IMAGE_PROMPT_PRESET_PROMPT },
    },
  ]);
  assert.equal(typeof REVERSE_IMAGE_PROMPT_PRESET_PROMPT, 'string');
  assert.ok(REVERSE_IMAGE_PROMPT_PRESET_PROMPT.length > 0);
  assert.deepEqual(harness.toasts, [
    { message: 'T:globalScreenshot.reverseCreated', level: 'success' },
  ]);
  harness.identity.value = 'canvas-2';
  assert.equal(options.isImportCurrent(), false);
});

test('globalScreenshotBridge: runImmediately 仅严格 true 生效', async () => {
  const harness = createHarness();
  await harness.deliver({ pngBase64: 'QUJD', actionId: 'reverse-prompt', runImmediately: 1 });
  assert.deepEqual(
    harness.commands.map((entry) => entry.name),
    ['node.createConnected', 'node.setPrompt'],
  );
  assert.deepEqual(harness.mountedProbes, []);
  assert.deepEqual(harness.toasts, [
    { message: 'T:globalScreenshot.reverseCreated', level: 'success' },
  ]);
});

test('globalScreenshotBridge: runImmediately 时等待挂载后运行生成', async () => {
  const harness = createHarness();
  await harness.deliver({ pngBase64: 'QUJD', actionId: 'reverse-prompt', runImmediately: true });
  assert.deepEqual(
    harness.commands.map((entry) => entry.name),
    ['node.createConnected', 'node.setPrompt', 'generation.run'],
  );
  assert.deepEqual(harness.commands[2].args, { nodeId: 'text-1' });
  assert.deepEqual(harness.mountedProbes, ['text-1']);
  assert.deepEqual(harness.toasts, [
    { message: 'T:globalScreenshot.reverseStarted', level: 'success' },
  ]);
});

test('globalScreenshotBridge: 节点未挂载时提示反推失败且不触发生成', async () => {
  const harness = createHarness({
    isNodeMounted: () => false,
    scheduleFrame: (callback) => callback(),
  });
  await harness.deliver({ pngBase64: 'QUJD', actionId: 'reverse-prompt', runImmediately: true });
  assert.deepEqual(
    harness.commands.map((entry) => entry.name),
    ['node.createConnected', 'node.setPrompt'],
  );
  assert.equal(harness.logs.length, 1);
  assert.equal(harness.logs[0][1].message, 'node-not-ready');
  assert.deepEqual(harness.toasts, [
    { message: 'T:globalScreenshot.reverseFailed', level: 'error' },
  ]);
});

test('globalScreenshotBridge: 媒体节点创建后身份变化则静默放弃', async () => {
  const state = { identity: 'c1' };
  const harness = createHarness({
    getCanvasIdentity: () => state.identity,
    createMediaNodeFromBlob: async () => {
      state.identity = 'c2';
      return { id: 'media-1' };
    },
  });
  await harness.deliver({ pngBase64: 'QUJD', actionId: 'reverse-prompt' });
  assert.deepEqual(harness.commands, []);
  assert.deepEqual(harness.toasts, []);
  assert.deepEqual(harness.logs, []);

  const plainState = { identity: 'c1' };
  const plain = createHarness({
    getCanvasIdentity: () => plainState.identity,
    createMediaNodeFromBlob: async () => {
      plainState.identity = 'c2';
      return { id: 'media-1' };
    },
  });
  await plain.deliver({ pngBase64: 'QUJD' });
  assert.deepEqual(plain.toasts, []);
  assert.deepEqual(plain.commands, []);
});

test('globalScreenshotBridge: 命令执行期间身份变化时记录日志但不提示', async () => {
  const state = { identity: 'c1' };
  const names = [];
  const harness = createHarness({
    getCanvasIdentity: () => state.identity,
    executeCanvasCommand: async (name, args) => {
      names.push(name);
      if (name === 'node.createConnected') state.identity = 'c2';
      return { ok: true, result: { nodeId: 'text-1' } };
    },
  });
  await harness.deliver({ pngBase64: 'QUJD', actionId: 'reverse-prompt' });
  assert.deepEqual(names, ['node.createConnected']);
  assert.equal(harness.logs.length, 1);
  assert.equal(harness.logs[0][1].message, 'canvas-changed');
  assert.deepEqual(harness.toasts, []);
});

test('globalScreenshotBridge: 命令失败按 message/errorCode 兜底', async () => {
  for (const [commandResult, expected] of [
    [{ ok: false, message: 'boom' }, 'boom'],
    [{ ok: false, errorCode: 'NODE_MISSING' }, 'NODE_MISSING'],
    [{ ok: false }, 'canvas-command-failed'],
  ]) {
    const harness = createHarness({
      executeCanvasCommand: async (name) =>
        name === 'node.createConnected' ? { ok: true, result: { nodeId: 'text-1' } } : commandResult,
    });
    await harness.deliver({ pngBase64: 'QUJD', actionId: 'reverse-prompt' });
    assert.equal(harness.logs.length, 1, String(expected));
    assert.equal(harness.logs[0][1].message, expected, String(expected));
    assert.deepEqual(
      harness.toasts,
      [{ message: 'T:globalScreenshot.reverseFailed', level: 'error' }],
      String(expected),
    );
  }
});

test('globalScreenshotBridge: 连接节点失败或缺少 nodeId 时按导入失败提示', async () => {
  const connectFailure = createHarness({
    executeCanvasCommand: async () => ({ ok: false, message: 'connect failed' }),
  });
  await connectFailure.deliver({ pngBase64: 'QUJD', actionId: 'reverse-prompt' });
  assert.equal(connectFailure.logs[0][1].message, 'connect failed');
  assert.deepEqual(connectFailure.toasts, [
    { message: 'T:globalScreenshot.importFailed', level: 'error' },
  ]);

  const noNodeId = createHarness({
    executeCanvasCommand: async () => ({ ok: true, result: {} }),
  });
  await noNodeId.deliver({ pngBase64: 'QUJD', actionId: 'reverse-prompt' });
  assert.equal(noNodeId.logs[0][1].message, 'node-id-missing');
  assert.deepEqual(noNodeId.commands, []);
  assert.deepEqual(noNodeId.toasts, [
    { message: 'T:globalScreenshot.importFailed', level: 'error' },
  ]);
});

test('globalScreenshotBridge: 生成运行失败时提示反推失败', async () => {
  const harness = createHarness({
    executeCanvasCommand: async (name) =>
      name === 'generation.run' ? { ok: false, errorCode: 'BUSY' } : { ok: true, result: { nodeId: 'text-1' } },
  });
  await harness.deliver({ pngBase64: 'QUJD', actionId: 'reverse-prompt', runImmediately: true });
  assert.equal(harness.logs[0][1].message, 'BUSY');
  assert.deepEqual(harness.toasts, [
    { message: 'T:globalScreenshot.reverseFailed', level: 'error' },
  ]);
});

test('globalScreenshotBridge: 生成期间身份变化则不提示', async () => {
  const state = { identity: 'c1' };
  const names = [];
  const harness = createHarness({
    getCanvasIdentity: () => state.identity,
    executeCanvasCommand: async (name) => {
      names.push(name);
      if (name === 'generation.run') state.identity = 'c2';
      return { ok: true, result: { nodeId: 'text-1' } };
    },
  });
  await harness.deliver({ pngBase64: 'QUJD', actionId: 'reverse-prompt', runImmediately: true });
  assert.deepEqual(names, ['node.createConnected', 'node.setPrompt', 'generation.run']);
  assert.deepEqual(harness.toasts, []);
  assert.deepEqual(harness.logs, []);
});

test('globalScreenshotBridge: 全局快捷键状态分支', () => {
  const harness = createHarness();
  assert.equal(harness.statusHandlers.length, 1);
  harness.deliverStatus({ registered: false, reason: 'registration-failed' });
  assert.deepEqual(harness.toasts, [
    { message: 'T:globalScreenshot.shortcutRegistrationFailed', level: 'warn' },
  ]);
  assert.deepEqual(harness.translateCalls[0], {
    key: 'globalScreenshot.shortcutRegistrationFailed',
    params: { accelerator: 'Alt+Q' },
  });

  harness.deliverStatus({
    registered: false,
    reason: 'registration-failed',
    accelerator: 'Ctrl+Alt+Q',
  });
  assert.deepEqual(harness.translateCalls[1].params, { accelerator: 'Ctrl+Alt+Q' });

  harness.deliverStatus({ registered: true, ok: false });
  assert.deepEqual(harness.toasts[2], { message: 'T:globalScreenshot.captureFailed', level: 'error' });

  harness.deliverStatus({ registered: true, ok: true });
  harness.deliverStatus({ registered: false, reason: 'other' });
  harness.deliverStatus({ registered: true, ok: undefined, reason: 'registration-failed' });
  harness.deliverStatus({});
  harness.deliverStatus();
  assert.equal(harness.toasts.length, 3);
});

test('globalScreenshotBridge: 无 translate 时回退为键名替换', async () => {
  const harness = createHarness({ translate: null, createResult: null });
  await harness.deliver({ pngBase64: 'QUJD' });
  assert.deepEqual(harness.toasts, [
    { message: 'globalScreenshot.importFailed', level: 'error' },
  ]);
  harness.deliverStatus({ registered: false, reason: 'registration-failed' });
  assert.deepEqual(harness.toasts[1], {
    message: 'globalScreenshot.shortcutRegistrationFailed',
    level: 'warn',
  });
  harness.created.length = 0;
  harness.toasts.length = 0;
  await harness.deliver({ pngBase64: 'QUJD', actionId: 'reverse-prompt' });
  assert.deepEqual(harness.translateCalls, []);
  assert.deepEqual(harness.commands, []);

  const omitted = createHarness({ translate: undefined, createResult: null });
  await omitted.deliver({ pngBase64: 'QUJD' });
  assert.deepEqual(omitted.toasts, [
    { message: 'globalScreenshot.importFailed', level: 'error' },
  ]);
});

test('globalScreenshotBridge: 缺省 showToast 与 consoleObject 不阻断流程', async () => {
  const harness = createHarness({ showToast: undefined, createResult: null });
  await harness.deliver({ pngBase64: 'QUJD' });
  assert.equal(harness.created.length, 1);
  assert.equal(harness.created[0].options.sequenceKey, 'global-screenshot');
  harness.deliverStatus({ registered: true, ok: false });
  assert.deepEqual(harness.toasts, []);

  const silentLog = createHarness({
    consoleObject: { error: undefined },
    createMediaNodeFromBlob: async () => {
      throw new Error('boom');
    },
  });
  await silentLog.deliver({ pngBase64: 'QUJD' });
  assert.deepEqual(silentLog.logs, []);
  assert.deepEqual(silentLog.toasts, [
    { message: 'T:globalScreenshot.importFailed', level: 'error' },
  ]);
});
