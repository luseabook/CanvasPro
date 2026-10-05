import assert from 'node:assert/strict';
import { test } from 'node:test';

import { installGlobalTextPresetBridge, waitForGlobalCaptureNodeMounted } from './globalTextPresetBridge.js';

function createTextPresetApi({ claimResult = { ok: true } } = {}) {
  const state = {
    selectedTextHandlers: [],
    shortcutStatusHandlers: [],
    claims: [],
    acks: [],
    claimResult: claimResult,
  };
  return {
    state: state,
    api: {
      claimEvent: async (payload) => {
        state.claims.push(payload);
        return state.claimResult;
      },
      acknowledgeEvent: async (payload) => {
        state.acks.push(payload);
      },
      onSelectedText: (callback) => {
        state.selectedTextHandlers.push(callback);
        return () => {
          state.selectedTextHandlers = state.selectedTextHandlers.filter((handler) => handler !== callback);
        };
      },
      onGlobalShortcutStatus: (callback) => {
        state.shortcutStatusHandlers.push(callback);
        return () => {
          state.shortcutStatusHandlers = state.shortcutStatusHandlers.filter(
            (handler) => handler !== callback,
          );
        };
      },
    },
  };
}

function createHarness(options = {}) {
  const textPreset = createTextPresetApi({ claimResult: options.claimResult });
  const toasts = [];
  const commands = [];
  const drafts = [];
  const logs = [];
  const translateCalls = [];
  const canvasIdentity = { value: options.canvasIdentity || 'canvas-1' };
  const showToast = (message, level) => toasts.push({ message: message, level: level });
  const translate =
    options.translate === null
      ? undefined
      : (key, params = {}) => {
          translateCalls.push({ key: key, params: params });
          return 'T:' + key + ':' + JSON.stringify(params);
        };
  const executeCanvasCommand = options.omitExecuteCanvasCommand
    ? undefined
    : options.executeCanvasCommand === undefined
      ? async (name, payload) => {
          commands.push({ name: name, payload: payload });
          return { ok: true, result: { nodeId: 'node-1' } };
        }
      : options.executeCanvasCommand;
  const openDraft = options.openDraft
    ? options.openDraft
    : async (text) => {
        drafts.push(text);
        return { overlay: {}, hasConfiguredDefault: options.hasConfiguredDefault !== false };
      };
  const dispose = installGlobalTextPresetBridge({
    textPresetApi: textPreset.api,
    showToast: showToast,
    translate: translate,
    openDraft: openDraft,
    executeCanvasCommand: executeCanvasCommand,
    isNodeMounted: options.isNodeMounted || (() => true),
    isNodeGenerationReady: options.isNodeGenerationReady || (() => false),
    scheduleFrame: options.scheduleFrame || ((callback) => callback()),
    consoleObject: { error: (...args) => logs.push(args) },
    getCanvasIdentity: options.getCanvasIdentity || (() => canvasIdentity.value),
  });
  return {
    dispose: dispose,
    toasts: toasts,
    commands: commands,
    drafts: drafts,
    logs: logs,
    translateCalls: translateCalls,
    apiState: textPreset.state,
    canvasIdentity: canvasIdentity,
    async deliverSelectedText(payload) {
      const acksBefore = textPreset.state.acks.length;
      for (const handler of textPreset.state.selectedTextHandlers) await handler(payload);
      return textPreset.state.acks.length > acksBefore
        ? textPreset.state.acks[textPreset.state.acks.length - 1]
        : undefined;
    },
    deliverShortcutStatus(payload) {
      for (const handler of textPreset.state.shortcutStatusHandlers) handler(payload);
    },
    async settle() {
      await new Promise((resolve) => setTimeout(resolve, 0));
    },
    lastAck() {
      return textPreset.state.acks[textPreset.state.acks.length - 1];
    },
    toastMessages() {
      return toasts.map((entry) => entry.message);
    },
    commandNames() {
      return commands.map((entry) => entry.name);
    },
  };
}

test('waitForGlobalCaptureNodeMounted rejects empty or non-string node ids without probing', async () => {
  const probed = [];
  const isNodeMounted = (nodeId) => {
    probed.push(nodeId);
    return true;
  };
  assert.equal(await waitForGlobalCaptureNodeMounted({ nodeId: '', isNodeMounted: isNodeMounted }), false);
  assert.equal(await waitForGlobalCaptureNodeMounted({ nodeId: '   ', isNodeMounted: isNodeMounted }), false);
  assert.equal(
    await waitForGlobalCaptureNodeMounted({ nodeId: undefined, isNodeMounted: isNodeMounted }),
    false,
  );
  assert.deepEqual(probed, []);
});

test('waitForGlobalCaptureNodeMounted requires a callable probe', async () => {
  assert.equal(await waitForGlobalCaptureNodeMounted({ nodeId: 'n1' }), false);
  assert.equal(await waitForGlobalCaptureNodeMounted({ nodeId: 'n1', isNodeMounted: 'nope' }), false);
});

test('waitForGlobalCaptureNodeMounted returns true on the first mounted attempt without scheduling', async () => {
  let frames = 0;
  const mounted = await waitForGlobalCaptureNodeMounted({
    nodeId: 'node-7',
    isNodeMounted: (nodeId) => nodeId === 'node-7',
    scheduleFrame: () => {
      frames += 1;
    },
  });
  assert.equal(mounted, true);
  assert.equal(frames, 0);
});

test('waitForGlobalCaptureNodeMounted trims the node id before probing', async () => {
  const probed = [];
  const mounted = await waitForGlobalCaptureNodeMounted({
    nodeId: '  node-9  ',
    isNodeMounted: (nodeId) => {
      probed.push(nodeId);
      return true;
    },
    scheduleFrame: (callback) => callback(),
  });
  assert.equal(mounted, true);
  assert.deepEqual(probed, ['node-9']);
});

test('waitForGlobalCaptureNodeMounted keeps polling until the node mounts', async () => {
  let calls = 0;
  const mounted = await waitForGlobalCaptureNodeMounted({
    nodeId: 'node-3',
    isNodeMounted: () => {
      calls += 1;
      return calls === 4;
    },
    scheduleFrame: (callback) => callback(),
  });
  assert.equal(mounted, true);
  assert.equal(calls, 4);
});

test('waitForGlobalCaptureNodeMounted gives up after the configured attempts', async () => {
  let calls = 0;
  const mounted = await waitForGlobalCaptureNodeMounted({
    nodeId: 'node-x',
    isNodeMounted: () => {
      calls += 1;
      return false;
    },
    scheduleFrame: (callback) => callback(),
    attempts: 5,
  });
  assert.equal(mounted, false);
  assert.equal(calls, 5);
});

test('waitForGlobalCaptureNodeMounted defaults to 30 mount attempts', async () => {
  let calls = 0;
  const mounted = await waitForGlobalCaptureNodeMounted({
    nodeId: 'node-x',
    isNodeMounted: () => {
      calls += 1;
      return false;
    },
    scheduleFrame: (callback) => callback(),
  });
  assert.equal(mounted, false);
  assert.equal(calls, 30);
});

test('waitForGlobalCaptureNodeMounted falls back to a timer when no frame scheduler is usable', async () => {
  const mounted = await waitForGlobalCaptureNodeMounted({
    nodeId: 'node-timer',
    isNodeMounted: () => false,
    attempts: 1,
  });
  assert.equal(mounted, false);
});

test('waitForGlobalCaptureNodeMounted treats only a strict true as mounted', async () => {
  let calls = 0;
  const mounted = await waitForGlobalCaptureNodeMounted({
    nodeId: 'node-strict',
    isNodeMounted: () => {
      calls += 1;
      return calls > 1 ? true : 1;
    },
    scheduleFrame: (callback) => callback(),
    attempts: 3,
  });
  assert.equal(mounted, true);
  assert.equal(calls, 2);
});

test('installGlobalTextPresetBridge returns an inert disposer without a text preset api', () => {
  const dispose = installGlobalTextPresetBridge({});
  assert.equal(typeof dispose, 'function');
  dispose();
  const noApi = installGlobalTextPresetBridge({ textPresetApi: null });
  assert.equal(typeof noApi, 'function');
  noApi();
});

test('installGlobalTextPresetBridge subscribes to both channels and disposes them', async () => {
  const harness = createHarness();
  assert.equal(harness.apiState.selectedTextHandlers.length, 1);
  assert.equal(harness.apiState.shortcutStatusHandlers.length, 1);
  harness.dispose();
  assert.equal(harness.apiState.selectedTextHandlers.length, 0);
  assert.equal(harness.apiState.shortcutStatusHandlers.length, 0);
  await harness.deliverSelectedText({ eventId: 'e1', actionId: 'ai-text', text: 'hello' });
  assert.equal(harness.apiState.claims.length, 0);
});

test('installGlobalTextPresetBridge ignores payloads without an event id', async () => {
  const harness = createHarness();
  await harness.deliverSelectedText({ actionId: 'ai-text', text: 'hello' });
  assert.equal(harness.apiState.claims.length, 0);
  assert.deepEqual(harness.toasts, []);
});

test('installGlobalTextPresetBridge warns and reports a retryable miss when no text is selected', async () => {
  const harness = createHarness();
  const outcome = await harness.deliverSelectedText({ eventId: 'e1', actionId: 'ai-text', text: '   ' });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.reason, 'no-selected-text');
  assert.equal(outcome.retryable, true);
  assert.deepEqual(harness.toastMessages(), ['T:globalTextPreset.noSelectedText:{}']);
  assert.equal(harness.toasts[0].level, 'warn');
  assert.equal(harness.lastAck().ok, false);
  assert.equal(harness.lastAck().reason, 'no-selected-text');
  assert.equal(harness.lastAck().retryable, true);
  assert.deepEqual(harness.commands, []);
});

test('installGlobalTextPresetBridge reports the raw key when no translator is provided', async () => {
  const harness = createHarness({ translate: null });
  await harness.deliverSelectedText({ eventId: 'e1', actionId: 'not-a-real-action', text: 'abc' });
  assert.deepEqual(harness.toastMessages(), ['globalCapture.unsupportedAction']);
});

test('installGlobalTextPresetBridge rejects unknown canvas actions', async () => {
  const harness = createHarness();
  const outcome = await harness.deliverSelectedText({ eventId: 'e1', actionId: 'bogus', text: 'abc' });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.reason, 'unsupported-action');
  assert.equal(outcome.retryable, false);
  assert.equal(harness.toasts[0].level, 'error');
  assert.deepEqual(harness.commands, []);
  assert.deepEqual(harness.translateCalls, [{ key: 'globalCapture.unsupportedAction', params: {} }]);
});

test('installGlobalTextPresetBridge routes preset drafts to the draft opener', async () => {
  const harness = createHarness();
  const outcome = await harness.deliverSelectedText({
    eventId: 'e1',
    actionId: 'preset-draft',
    text: '  keep me  ',
  });
  assert.equal(outcome.ok, true);
  assert.deepEqual(harness.drafts, ['keep me']);
  assert.deepEqual(harness.toastMessages(), []);
  assert.deepEqual(harness.commands, []);
});

test('installGlobalTextPresetBridge warns when the draft has no configured default tab', async () => {
  const harness = createHarness({ hasConfiguredDefault: false });
  const outcome = await harness.deliverSelectedText({ eventId: 'e1', actionId: 'preset-draft', text: 'abc' });
  assert.equal(outcome.ok, true);
  assert.deepEqual(harness.toastMessages(), ['T:globalTextPreset.defaultMissing:{}']);
  assert.equal(harness.toasts[0].level, 'warn');
});

test('installGlobalTextPresetBridge creates a source-text node with the content field', async () => {
  const harness = createHarness();
  const outcome = await harness.deliverSelectedText({
    eventId: 'e1',
    actionId: 'source-text',
    text: 'captured',
    runImmediately: true,
  });
  assert.equal(outcome.ok, true);
  assert.deepEqual(harness.commandNames(), ['node.create']);
  assert.equal(harness.commands[0].payload.type, 'source-text');
  assert.equal(harness.commands[0].payload.content, 'captured');
  assert.equal(harness.commands[0].payload.prompt, undefined);
  assert.equal(harness.commands[0].payload.placement, 'viewport-center-sequence');
  assert.equal(harness.commands[0].payload.sequenceKey, 'global-capture');
  assert.equal(harness.commands[0].payload.name, 'T:globalCapture.nodeNames.sourceText:{}');
  assert.deepEqual(harness.toastMessages(), ['T:globalCapture.nodeAdded:{}']);
});

test('installGlobalTextPresetBridge creates an ai-text node with the prompt field', async () => {
  const harness = createHarness();
  const outcome = await harness.deliverSelectedText({
    eventId: 'e1',
    actionId: 'ai-text',
    text: 'prompt me',
  });
  assert.equal(outcome.ok, true);
  assert.equal(harness.commands[0].payload.type, 'ai-text');
  assert.equal(harness.commands[0].payload.prompt, 'prompt me');
  assert.equal(harness.commands[0].payload.content, undefined);
  assert.deepEqual(harness.toastMessages(), ['T:globalCapture.nodeAdded:{}']);
});

test('installGlobalTextPresetBridge maps every supported action to its node type and label', async () => {
  const expectations = [
    ['ai-text', 'ai-text', 'globalCapture.nodeNames.aiText'],
    ['ai-image', 'ai-image', 'globalCapture.nodeNames.aiImage'],
    ['ai-video', 'ai-video', 'globalCapture.nodeNames.aiVideo'],
  ];
  for (const [actionId, nodeType, nameKey] of expectations) {
    const harness = createHarness();
    await harness.deliverSelectedText({ eventId: 'e1', actionId: actionId, text: 'x' });
    assert.equal(harness.commands[0].payload.type, nodeType, actionId);
    assert.equal(harness.commands[0].payload.name, 'T:' + nameKey + ':{}', actionId);
  }
});

test('installGlobalTextPresetBridge reports an unavailable canvas command', async () => {
  const harness = createHarness({ omitExecuteCanvasCommand: true });
  const outcome = await harness.deliverSelectedText({ eventId: 'e1', actionId: 'ai-text', text: 'x' });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.reason, 'canvas-command-unavailable');
  assert.deepEqual(harness.commands, []);
  assert.deepEqual(harness.toastMessages(), [
    'T:globalCapture.actionFailed:{"reason":"canvas-command-unavailable"}',
  ]);
});

test('installGlobalTextPresetBridge toasts the preparing state before an immediate run', async () => {
  const harness = createHarness();
  await harness.deliverSelectedText({
    eventId: 'e1',
    actionId: 'ai-text',
    text: 'x',
    runImmediately: true,
  });
  await harness.settle();
  assert.deepEqual(harness.toastMessages(), [
    'T:globalCapture.preparingGeneration:{}',
    'T:globalCapture.generationStarted:{}',
  ]);
  assert.equal(harness.toasts[0].level, 'info');
  assert.equal(harness.toasts[1].level, 'success');
  assert.deepEqual(harness.commandNames(), ['node.create', 'generation.run']);
  assert.equal(harness.commands[1].payload.nodeId, 'node-1');
});

test('installGlobalTextPresetBridge does not start generation without runImmediately', async () => {
  const harness = createHarness();
  await harness.deliverSelectedText({
    eventId: 'e1',
    actionId: 'ai-image',
    text: 'x',
    runImmediately: false,
  });
  await harness.settle();
  assert.deepEqual(harness.commandNames(), ['node.create']);
  assert.deepEqual(harness.toastMessages(), ['T:globalCapture.nodeAdded:{}']);
});

test('installGlobalTextPresetBridge never runs generation immediately for source-text', async () => {
  const harness = createHarness();
  await harness.deliverSelectedText({
    eventId: 'e1',
    actionId: 'source-text',
    text: 'x',
    runImmediately: true,
  });
  await harness.settle();
  assert.deepEqual(harness.commandNames(), ['node.create']);
  assert.deepEqual(harness.toastMessages(), ['T:globalCapture.nodeAdded:{}']);
});

test('installGlobalTextPresetBridge surfaces a canvas command failure with its message', async () => {
  const harness = createHarness({
    executeCanvasCommand: async () => ({ ok: false, message: 'boom', errorCode: 'NODE_MISSING' }),
  });
  const outcome = await harness.deliverSelectedText({ eventId: 'e1', actionId: 'ai-text', text: 'x' });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.reason, 'boom');
  assert.equal(outcome.retryable, true);
  assert.equal(harness.toasts[0].message, 'T:globalCapture.actionFailed:{"reason":"boom"}');
  assert.deepEqual(harness.translateCalls[harness.translateCalls.length - 1], {
    key: 'globalCapture.actionFailed',
    params: { reason: 'boom' },
  });
});

test('installGlobalTextPresetBridge marks generic command failures as non retryable', async () => {
  const harness = createHarness({
    executeCanvasCommand: async () => ({ ok: false, errorCode: 'COMMAND_EXECUTION_FAILED' }),
  });
  const outcome = await harness.deliverSelectedText({ eventId: 'e1', actionId: 'ai-text', text: 'x' });
  assert.equal(outcome.reason, 'COMMAND_EXECUTION_FAILED');
  assert.equal(outcome.retryable, false);
});

test('installGlobalTextPresetBridge falls back to the node-create-failed reason', async () => {
  const harness = createHarness({ executeCanvasCommand: async () => ({ ok: false }) });
  const outcome = await harness.deliverSelectedText({ eventId: 'e1', actionId: 'ai-text', text: 'x' });
  assert.equal(outcome.reason, 'node-create-failed');
  assert.equal(outcome.retryable, false);
  assert.equal(harness.toasts[0].message, 'T:globalCapture.actionFailed:{"reason":"node-create-failed"}');
});

test('installGlobalTextPresetBridge requires a node id back from the canvas command', async () => {
  const names = [];
  const harness = createHarness({
    executeCanvasCommand: async (name, payload) => {
      names.push(name);
      return { ok: true, result: {} };
    },
  });
  const outcome = await harness.deliverSelectedText({ eventId: 'e1', actionId: 'ai-text', text: 'x' });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.reason, 'node-id-missing');
  assert.deepEqual(names, ['node.create']);
});

test('installGlobalTextPresetBridge accepts a nested node id from the command result', async () => {
  const harness = createHarness({
    executeCanvasCommand: async (name, payload) => {
      harness.commands.push({ name: name, payload: payload });
      return name === 'node.create' ? { ok: true, result: { node: { id: 'nested-9' } } } : { ok: true };
    },
  });
  await harness.deliverSelectedText({ eventId: 'e1', actionId: 'ai-text', text: 'x', runImmediately: true });
  await harness.settle();
  assert.equal(harness.commands[1].payload.nodeId, 'nested-9');
});

test('installGlobalTextPresetBridge trims the returned node id', async () => {
  const harness = createHarness({
    executeCanvasCommand: async (name, payload) => {
      harness.commands.push({ name: name, payload: payload });
      return name === 'node.create' ? { ok: true, result: { nodeId: '  pad-1  ' } } : { ok: true };
    },
  });
  await harness.deliverSelectedText({ eventId: 'e1', actionId: 'ai-text', text: 'x', runImmediately: true });
  await harness.settle();
  assert.equal(harness.commands[1].payload.nodeId, 'pad-1');
});

test('installGlobalTextPresetBridge stays silent when the canvas changed before creation finished', async () => {
  let identity = 'c1';
  const harness = createHarness({
    getCanvasIdentity: () => identity,
    executeCanvasCommand: async (name) => {
      identity = 'c2';
      return name === 'node.create' ? { ok: true, result: { nodeId: 'node-2' } } : { ok: true };
    },
  });
  const outcome = await harness.deliverSelectedText({ eventId: 'e1', actionId: 'ai-text', text: 'x' });
  await harness.settle();
  assert.equal(outcome.ok, true);
  assert.deepEqual(harness.toasts, []);
});

test('installGlobalTextPresetBridge stays silent when the canvas changed during generation', async () => {
  let identity = 'c1';
  const harness = createHarness({
    getCanvasIdentity: () => identity,
    executeCanvasCommand: async (name, payload) => {
      harness.commands.push({ name: name, payload: payload });
      if (name === 'generation.run') identity = 'c2';
      return name === 'node.create' ? { ok: true, result: { nodeId: 'node-3' } } : { ok: true };
    },
  });
  const outcome = await harness.deliverSelectedText({
    eventId: 'e1',
    actionId: 'ai-text',
    text: 'x',
    runImmediately: true,
  });
  await harness.settle();
  assert.equal(outcome.ok, true);
  assert.deepEqual(harness.toastMessages(), ['T:globalCapture.preparingGeneration:{}']);
});

test('installGlobalTextPresetBridge reports a node that never becomes ready', async () => {
  const harness = createHarness({ isNodeMounted: () => false, isNodeGenerationReady: () => false });
  await harness.deliverSelectedText({
    eventId: 'e1',
    actionId: 'ai-text',
    text: 'x',
    runImmediately: true,
  });
  await harness.settle();
  assert.deepEqual(harness.toastMessages(), [
    'T:globalCapture.preparingGeneration:{}',
    'T:globalCapture.generationFailed:{"reason":"node-not-ready"}',
  ]);
  assert.equal(harness.toasts[1].level, 'error');
  assert.deepEqual(harness.commandNames(), ['node.create']);
});

test('installGlobalTextPresetBridge accepts a runtime-ready node in place of a mounted one', async () => {
  const harness = createHarness({ isNodeMounted: () => false, isNodeGenerationReady: () => true });
  await harness.deliverSelectedText({
    eventId: 'e1',
    actionId: 'ai-text',
    text: 'x',
    runImmediately: true,
  });
  await harness.settle();
  assert.deepEqual(harness.commandNames(), ['node.create', 'generation.run']);
  assert.equal(harness.toasts[harness.toasts.length - 1].message, 'T:globalCapture.generationStarted:{}');
});

test('installGlobalTextPresetBridge reports a failed generation run', async () => {
  const harness = createHarness({
    executeCanvasCommand: async (name, payload) => {
      harness.commands.push({ name: name, payload: payload });
      return name === 'node.create'
        ? { ok: true, result: { nodeId: 'node-5' } }
        : { ok: false, error: 'gpu busy' };
    },
  });
  await harness.deliverSelectedText({
    eventId: 'e1',
    actionId: 'ai-text',
    text: 'x',
    runImmediately: true,
  });
  await harness.settle();
  const last = harness.toasts[harness.toasts.length - 1];
  assert.equal(last.message, 'T:globalCapture.generationFailed:{"reason":"gpu busy"}');
  assert.equal(last.level, 'error');
});

test('installGlobalTextPresetBridge reports a throwing generation run', async () => {
  const harness = createHarness({
    executeCanvasCommand: async (name, payload) => {
      if (name === 'generation.run') throw new Error('renderer exploded');
      harness.commands.push({ name: name, payload: payload });
      return { ok: true, result: { nodeId: 'node-6' } };
    },
  });
  await harness.deliverSelectedText({
    eventId: 'e1',
    actionId: 'ai-text',
    text: 'x',
    runImmediately: true,
  });
  await harness.settle();
  const last = harness.toasts[harness.toasts.length - 1];
  assert.equal(last.message, 'T:globalCapture.generationFailed:{"reason":"renderer exploded"}');
  assert.equal(harness.lastAck().ok, true);
});

test('installGlobalTextPresetBridge logs and reports an unexpected handler failure', async () => {
  const harness = createHarness({
    openDraft: async () => {
      throw new Error('draft blew up');
    },
  });
  const outcome = await harness.deliverSelectedText({ eventId: 'e1', actionId: 'preset-draft', text: 'x' });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.reason, 'draft blew up');
  assert.equal(outcome.retryable, false);
  assert.equal(harness.logs.length, 1);
  assert.equal(harness.logs[0][0], '[globalCapture] failed to handle selected text');
  assert.equal(harness.logs[0][1].message, 'draft blew up');
  assert.equal(harness.toasts[0].message, 'T:globalCapture.actionFailed:{"reason":"draft blew up"}');
  assert.equal(harness.lastAck().ok, false);
  assert.equal(harness.lastAck().reason, 'draft blew up');
});

test('installGlobalTextPresetBridge warns when the global shortcut registration fails', () => {
  const harness = createHarness();
  harness.deliverShortcutStatus({ registered: false, reason: 'registration-failed' });
  assert.deepEqual(harness.toastMessages(), [
    'T:globalTextPreset.shortcutRegistrationFailed:{"accelerator":"Alt+C"}',
  ]);
  assert.equal(harness.toasts[0].level, 'warn');
});

test('installGlobalTextPresetBridge reports the requested accelerator on registration failure', () => {
  const harness = createHarness();
  harness.deliverShortcutStatus({
    registered: false,
    reason: 'registration-failed',
    accelerator: 'Ctrl+Alt+C',
  });
  assert.deepEqual(harness.toastMessages(), [
    'T:globalTextPreset.shortcutRegistrationFailed:{"accelerator":"Ctrl+Alt+C"}',
  ]);
});

test('installGlobalTextPresetBridge warns for copy failures reported by the shortcut status', () => {
  const harness = createHarness();
  harness.deliverShortcutStatus({ registered: true, reason: 'no-selected-text' });
  harness.deliverShortcutStatus({ registered: true, reason: 'copy-command-timeout' });
  harness.deliverShortcutStatus({ registered: true, reason: 'capture-failed' });
  assert.deepEqual(harness.toastMessages(), [
    'T:globalTextPreset.noSelectedText:{}',
    'T:globalTextPreset.noSelectedText:{}',
    'T:globalTextPreset.noSelectedText:{}',
  ]);
});

test('installGlobalTextPresetBridge stays silent for unrelated shortcut statuses', () => {
  const harness = createHarness();
  harness.deliverShortcutStatus({ registered: true, reason: 'activated' });
  harness.deliverShortcutStatus({ registered: false, reason: 'os-denied' });
  harness.deliverShortcutStatus({});
  assert.deepEqual(harness.toasts, []);
});

test('installGlobalTextPresetBridge records the receiver outcome on the acknowledgement', async () => {
  const harness = createHarness({
    executeCanvasCommand: async () => ({ ok: false, message: 'nope', errorCode: 'NODE_MISSING' }),
  });
  await harness.deliverSelectedText({ eventId: 'evt-42', actionId: 'ai-text', text: 'x' });
  assert.equal(harness.apiState.claims.length, 1);
  assert.equal(harness.apiState.claims[0].eventId, 'evt-42');
  assert.equal(typeof harness.apiState.claims[0].receiverId, 'string');
  assert.equal(harness.lastAck().eventId, 'evt-42');
  assert.equal(harness.lastAck().ok, false);
  assert.equal(harness.lastAck().reason, 'nope');
});

test('installGlobalTextPresetBridge replays the acknowledgement for a repeated event id', async () => {
  const harness = createHarness();
  await harness.deliverSelectedText({ eventId: 'dup-1', actionId: 'ai-text', text: 'first' });
  await harness.deliverSelectedText({ eventId: 'dup-1', actionId: 'ai-text', text: 'second' });
  await harness.settle();
  assert.equal(harness.commands.length, 1);
  assert.equal(harness.commands[0].payload.prompt, 'first');
  assert.equal(harness.apiState.claims.length, 1);
  assert.equal(harness.apiState.acks.length, 2);
});
