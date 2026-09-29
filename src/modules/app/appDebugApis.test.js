import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCanvasAgentDebugApi,
  createCanvasCommandsDebugApi,
  installAppDebugApis,
} from './appDebugApis.js';

test('the canvas command api forwards the command, options and context', () => {
  const calls = [];
  const context = { tab: 't-1' };
  const api = createCanvasCommandsDebugApi({
    executeCanvasCommand: (...args) => {
      calls.push(['command', ...args]);
      return 'ran';
    },
    executeCanvasCommandPlan: (...args) => {
      calls.push(['plan', ...args]);
      return 'planned';
    },
    commandContext: context,
  });
  assert.equal(api.executeCanvasCommand('node.add', { fast: true }), 'ran');
  assert.deepEqual(calls[0], ['command', 'node.add', { fast: true }, context]);
  assert.equal(api.executeCanvasCommandPlan([{ kind: 'a' }]), 'planned');
  assert.deepEqual(calls[1], ['plan', [{ kind: 'a' }], context]);
});

test('the canvas command api defaults its arguments', () => {
  const calls = [];
  const api = createCanvasCommandsDebugApi({
    executeCanvasCommand: (...args) => calls.push(args),
    executeCanvasCommandPlan: (...args) => calls.push(args),
    commandContext: 'ctx',
  });
  api.executeCanvasCommand('x');
  api.executeCanvasCommandPlan();
  assert.deepEqual(calls, [
    ['x', {}, 'ctx'],
    [[], 'ctx'],
  ]);
});

test('the canvas command api tolerates missing executors', () => {
  const api = createCanvasCommandsDebugApi();
  assert.equal(api.executeCanvasCommand('x'), undefined);
  assert.equal(api.executeCanvasCommandPlan(), undefined);
});

const AGENT_RUNTIME_METHODS = [
  'handleUserMessage',
  'answerClarification',
  'confirmPendingPlan',
  'cancelPendingPlan',
  'retryFailedPlan',
  'keepPreparedPlan',
  'discardInterruptedRun',
  'stop',
  'resetSession',
  'startNewConversation',
  'switchConversation',
  'deleteConversation',
  'listConversations',
  'getActiveConversation',
];

test('the agent api forwards every runtime method with its arguments', () => {
  const calls = [];
  const agentRuntime = {};
  for (const name of AGENT_RUNTIME_METHODS) {
    agentRuntime[name] = (...args) => {
      calls.push([name, ...args]);
      return `${name}-result`;
    };
  }
  const api = createCanvasAgentDebugApi({ agentRuntime });
  for (const name of AGENT_RUNTIME_METHODS) {
    assert.equal(api[name]('a', 2), `${name}-result`);
  }
  assert.deepEqual(
    calls,
    AGENT_RUNTIME_METHODS.map((name) => [name, 'a', 2]),
  );
  assert.equal(Object.keys(api).length, 18);
});

test('the agent api tolerates a missing runtime', () => {
  const api = createCanvasAgentDebugApi();
  for (const name of AGENT_RUNTIME_METHODS) {
    assert.equal(api[name](), undefined);
  }
});

test('session, skill and refresh hooks read through optional chaining', () => {
  const api = createCanvasAgentDebugApi({
    agentSessionStore: { getState: () => ({ runs: 3 }) },
    agentSkillRegistry: { listCatalog: () => ['s1'], getState: () => ({ active: 's1' }) },
    refreshAgentSkills: (...args) => ['refreshed', ...args],
  });
  assert.deepEqual(api.getSessionState(), { runs: 3 });
  assert.deepEqual(api.listSkills(), ['s1']);
  assert.deepEqual(api.getSkillState(), { active: 's1' });
  assert.deepEqual(api.refreshSkills('force'), ['refreshed', 'force']);
});

test('the read-only hooks fall back to empty values', () => {
  const api = createCanvasAgentDebugApi({ agentSkillRegistry: {} });
  assert.equal(api.getSessionState(), undefined);
  assert.deepEqual(api.listSkills(), []);
  assert.equal(api.getSkillState(), null);
  assert.equal(api.refreshSkills(), undefined);
});

test('installing the debug api requires DEV_MODE to be exactly true', () => {
  for (const DEV_MODE of [undefined, false, 0, 1, 'true', null]) {
    const windowObject = { DEV_MODE };
    assert.equal(installAppDebugApis({ windowObject, canvasCommands: 'c', canvasAgent: 'a' }), false);
    assert.equal(windowObject.__aiCanvasDebug, undefined);
  }
});

test('installing publishes both namespaces and returns true', () => {
  const windowObject = { DEV_MODE: true };
  const canvasCommands = { executeCanvasCommand: () => {} };
  const canvasAgent = { handleUserMessage: () => {} };
  assert.equal(installAppDebugApis({ windowObject, canvasCommands, canvasAgent }), true);
  assert.deepEqual(windowObject.__aiCanvasDebug, { canvasCommands, canvasAgent });
});

test('installing preserves unrelated debug namespaces', () => {
  const windowObject = { DEV_MODE: true, __aiCanvasDebug: { keep: 1, canvasCommands: 'old' } };
  installAppDebugApis({ windowObject, canvasCommands: 'new', canvasAgent: 'agent' });
  assert.deepEqual(windowObject.__aiCanvasDebug, { keep: 1, canvasCommands: 'new', canvasAgent: 'agent' });
});

test('installing defaults to the global window', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const windowObject = { DEV_MODE: true };
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: windowObject });
  try {
    assert.equal(installAppDebugApis({ canvasCommands: 'c', canvasAgent: 'a' }), true);
    assert.deepEqual(windowObject.__aiCanvasDebug, { canvasCommands: 'c', canvasAgent: 'a' });
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else delete globalThis.window;
  }
});

test('installing is refused when there is no window at all', () => {
  assert.equal(installAppDebugApis({ windowObject: null }), false);
  assert.equal(installAppDebugApis({ windowObject: undefined }), false);
});
