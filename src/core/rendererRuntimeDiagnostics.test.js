import assert from 'node:assert/strict';
import test from 'node:test';
import {
  installRendererRuntimeDiagnosticAccess,
  isRendererRuntimeDiagnosticsEnabled,
  recordRendererRuntimeDiagnostic,
} from './rendererRuntimeDiagnostics.js';

const GLOBAL_KEYS = [
  '__runtimeCompareRendererDiagnosticsEnabled',
  '__runtimeCompareRecordRendererDiagnostic',
  '__runtimeCompareGetRendererNodeDiagnosticState',
];

const withWindow = (windowLike, run) => {
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const previousWindow = globalThis.window;
  const snapshot = {};
  for (const key of GLOBAL_KEYS) {
    snapshot[key] = Object.prototype.hasOwnProperty.call(globalThis, key) ? globalThis[key] : undefined;
  }
  try {
    if (windowLike === undefined) delete globalThis.window;
    else globalThis.window = windowLike;
    for (const key of GLOBAL_KEYS) delete globalThis[key];
    return run();
  } finally {
    if (hadWindow) globalThis.window = previousWindow;
    else delete globalThis.window;
    for (const key of GLOBAL_KEYS) {
      if (snapshot[key] === undefined) delete globalThis[key];
      else globalThis[key] = snapshot[key];
    }
  }
};

test('an unpatched window reports diagnostics disabled and records nothing', () => {
  const windowLike = {};
  const result = withWindow(windowLike, () => ({
    enabled: isRendererRuntimeDiagnosticsEnabled(),
    recorded: recordRendererRuntimeDiagnostic({ kind: 'pan-preview' }),
    installed: installRendererRuntimeDiagnosticAccess(() => ({})),
    getter: windowLike['__runtimeCompareGetRendererNodeDiagnosticState'],
  }));
  assert.equal(result.enabled, false);
  assert.equal(result.recorded, null);
  assert.equal(result.installed, false);
  assert.equal(result.getter, undefined);
});

test('the enabled flag alone is not enough without a recorder function', () => {
  const result = withWindow({ __runtimeCompareRendererDiagnosticsEnabled: true }, () => ({
    enabled: isRendererRuntimeDiagnosticsEnabled(),
    recorded: recordRendererRuntimeDiagnostic({ kind: 'x' }),
  }));
  assert.equal(result.enabled, false);
  assert.equal(result.recorded, null);
});

test('a recorder function alone is not enough without the enabled flag', () => {
  const result = withWindow({ __runtimeCompareRecordRendererDiagnostic: () => 'ok' }, () => ({
    enabled: isRendererRuntimeDiagnosticsEnabled(),
    recorded: recordRendererRuntimeDiagnostic({ kind: 'x' }),
  }));
  assert.equal(result.enabled, false);
  assert.equal(result.recorded, null);
});

test('a fully patched window enables diagnostics and forwards records verbatim', () => {
  const payload = { kind: 'pan-preview-reconcile', nodeCount: 200 };
  const seen = [];
  const windowLike = {
    __runtimeCompareRendererDiagnosticsEnabled: true,
    __runtimeCompareRecordRendererDiagnostic: (recorded) => {
      seen.push(recorded);
      return { accepted: true };
    },
  };
  const result = withWindow(windowLike, () => ({
    enabled: isRendererRuntimeDiagnosticsEnabled(),
    recorded: recordRendererRuntimeDiagnostic(payload),
  }));
  assert.equal(result.enabled, true);
  assert.deepEqual(result.recorded, { accepted: true });
  assert.equal(seen.length, 1);
  assert.equal(seen[0], payload);
});

test('recording with no payload passes a fresh empty object to the recorder', () => {
  const seen = [];
  withWindow(
    {
      __runtimeCompareRendererDiagnosticsEnabled: true,
      __runtimeCompareRecordRendererDiagnostic: (payload) => {
        seen.push(payload);
        return payload;
      },
    },
    () => recordRendererRuntimeDiagnostic(),
  );
  assert.deepEqual(seen, [{}]);
});

test('installing the accessor publishes a string-coercing, copy-returning getter', () => {
  const calls = [];
  const resolver = (nodeId) => {
    calls.push(nodeId);
    return { nodeId: nodeId, visible: true };
  };
  const windowLike = {
    __runtimeCompareRendererDiagnosticsEnabled: true,
    __runtimeCompareRecordRendererDiagnostic: () => null,
  };
  const result = withWindow(windowLike, () => {
    const installed = installRendererRuntimeDiagnosticAccess(resolver);
    const getState = windowLike['__runtimeCompareGetRendererNodeDiagnosticState'];
    const state = getState('node-1');
    state.visible = false;
    const coerced = getState(7);
    const falsy = getState(0);
    return { installed, getState, state, coerced, falsy };
  });
  assert.equal(result.installed, true);
  assert.equal(typeof result.getState, 'function');
  assert.deepEqual(calls, ['node-1', '7', '']);
  assert.deepEqual(result.state, { nodeId: 'node-1', visible: false });
  assert.deepEqual(result.coerced, { nodeId: '7', visible: true });
  assert.deepEqual(result.falsy, { nodeId: '', visible: true });
});

test('the installed getter returns null when the resolver yields a non-object', () => {
  const windowLike = {
    __runtimeCompareRendererDiagnosticsEnabled: true,
    __runtimeCompareRecordRendererDiagnostic: () => null,
  };
  const result = withWindow(windowLike, () => {
    let answer = undefined;
    installRendererRuntimeDiagnosticAccess(() => answer);
    const getState = windowLike['__runtimeCompareGetRendererNodeDiagnosticState'];
    const results = [getState('a')];
    answer = null;
    results.push(getState('b'));
    answer = 'text';
    results.push(getState('c'));
    return results;
  });
  assert.deepEqual(result, [null, null, null]);
});

test('the installed getter returns a shallow copy rather than the resolver object', () => {
  const source = { nodeId: 'n1', nested: { deep: true } };
  const windowLike = {
    __runtimeCompareRendererDiagnosticsEnabled: true,
    __runtimeCompareRecordRendererDiagnostic: () => null,
  };
  const result = withWindow(windowLike, () => {
    installRendererRuntimeDiagnosticAccess(() => source);
    const getState = windowLike['__runtimeCompareGetRendererNodeDiagnosticState'];
    const first = getState('n1');
    first.extra = 1;
    return { first, second: getState('n1') };
  });
  assert.notEqual(result.first, source);
  assert.equal(result.first.nested, source.nested);
  assert.equal(result.second.extra, undefined);
});

test('a non-function resolver is rejected and the getter is not published', () => {
  const windowLike = {
    __runtimeCompareRendererDiagnosticsEnabled: true,
    __runtimeCompareRecordRendererDiagnostic: () => null,
  };
  const result = withWindow(windowLike, () => ({
    installed: installRendererRuntimeDiagnosticAccess('not-a-function'),
    getter: windowLike['__runtimeCompareGetRendererNodeDiagnosticState'],
  }));
  assert.equal(result.installed, false);
  assert.equal(result.getter, undefined);
});

test('installing is rejected when the diagnostics flag is not exactly true', () => {
  const resolver = () => ({ ok: true });
  const windowLike = { __runtimeCompareRecordRendererDiagnostic: () => null };
  const result = withWindow(windowLike, () => ({
    installed: installRendererRuntimeDiagnosticAccess(resolver),
    getter: windowLike['__runtimeCompareGetRendererNodeDiagnosticState'],
  }));
  assert.equal(result.installed, false);
  assert.equal(result.getter, undefined);
});

test('isRendererRuntimeDiagnosticsEnabled tolerates a missing window binding', () => {
  const result = withWindow(undefined, () => ({
    enabled: isRendererRuntimeDiagnosticsEnabled(),
    recorded: recordRendererRuntimeDiagnostic({ kind: 'x' }),
  }));
  assert.equal(result.enabled, false);
  assert.equal(result.recorded, null);
});
