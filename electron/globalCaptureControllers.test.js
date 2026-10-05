import assert from 'node:assert/strict';
import test from 'node:test';
import { createGlobalCaptureControllers } from './globalCaptureControllers.js';
import {
  GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID,
  GLOBAL_TEXT_PRESET_SHORTCUT_ID,
} from './globalTextPresetShortcutController.js';

const WINDOW_CONTROLLER_MEMBERS = [
  'cancel',
  'chooseAction',
  'destroy',
  'didPresent',
  'hide',
  'isTrustedSender',
  'isVisible',
  'prewarm',
  'setExpanded',
  'show',
];

const SHORTCUT_CONTROLLER_MEMBERS = [
  'acknowledgeEvent',
  'captureSelectedText',
  'claimEvent',
  'configureGlobalShortcut',
  'consumeEvents',
  'destroy',
  'dispatchCaptureAction',
  'getShortcutStatus',
  'installGlobalShortcut',
  'releaseShortcutKey',
  'sendShortcutStatus',
  'uninstallGlobalShortcut',
];

function createStubSelectedTextCapture() {
  const calls = { captureArguments: [], destroy: 0, prewarm: 0 };
  const controller = {
    capture: (...args) => {
      calls.captureArguments.push(args.length);
      return Promise.resolve({ ok: true, text: 'stub-selection' });
    },
    destroy: () => {
      calls.destroy += 1;
    },
    prewarm: () => {
      calls.prewarm += 1;
      return Promise.resolve({ ok: true, prewarmed: true });
    },
    isKeyReleaseTrackingAvailable: () => true,
  };
  return { calls, controller };
}

function createLogSpy() {
  const events = [];
  return { events, logDiagnosticEvent: (event) => events.push(event) };
}

function build(overrides = {}) {
  const stub = createStubSelectedTextCapture();
  const logs = createLogSpy();
  const controllers = createGlobalCaptureControllers({
    dirname: 'C:\\app\\electron',
    selectedTextCaptureController: stub.controller,
    logDiagnosticEvent: logs.logDiagnosticEvent,
    ...overrides,
  });
  return { controllers, logs, stub };
}

test('returns exactly the two assembled controllers', () => {
  const { controllers } = build();
  assert.deepEqual(Object.keys(controllers).sort(), [
    'globalCaptureWindowController',
    'globalTextPresetShortcutController',
  ]);
});

test('the window controller keeps the full capture window surface', () => {
  const { controllers } = build();
  assert.deepEqual(Object.keys(controllers.globalCaptureWindowController).sort(), WINDOW_CONTROLLER_MEMBERS);
  for (const member of WINDOW_CONTROLLER_MEMBERS)
    assert.equal(typeof controllers.globalCaptureWindowController[member], 'function', member);
});

test('the window controller exposes exactly the ten capture window members', () => {
  const { controllers } = build();
  const exposed = Object.keys(controllers.globalCaptureWindowController).sort();
  assert.deepEqual(exposed, WINDOW_CONTROLLER_MEMBERS);
  for (const member of exposed)
    assert.equal(typeof controllers.globalCaptureWindowController[member], 'function', member);
});

test('the shortcut controller is the real one, untouched', () => {
  const { controllers } = build();
  assert.deepEqual(
    Object.keys(controllers.globalTextPresetShortcutController).sort(),
    SHORTCUT_CONTROLLER_MEMBERS,
  );
});

test('construction without any argument does not throw', () => {
  const controllers = createGlobalCaptureControllers();
  assert.equal(typeof controllers.globalCaptureWindowController.show, 'function');
  controllers.globalCaptureWindowController.destroy();
  controllers.globalTextPresetShortcutController.destroy();
});

test('an explicit null selection controller falls back to the real one', () => {
  const controllers = createGlobalCaptureControllers({
    dirname: 'C:\\app\\electron',
    selectedTextCaptureController: null,
  });
  assert.deepEqual(Object.keys(controllers).sort(), [
    'globalCaptureWindowController',
    'globalTextPresetShortcutController',
  ]);
  controllers.globalCaptureWindowController.destroy();
});

test('the injected selection controller is the one the shortcut controller captures from', async () => {
  const { controllers, stub } = build();
  await controllers.globalTextPresetShortcutController.captureSelectedText();
  assert.deepEqual(stub.calls.captureArguments, [0]);
});

test('the default accelerator reaches the real shortcut controller', () => {
  const { controllers } = build();
  const status = controllers.globalTextPresetShortcutController.getShortcutStatus({
    actionId: GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID,
  });
  assert.deepEqual(status, {
    ok: false,
    actionId: GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID,
    registered: false,
    accelerator: 'CommandOrControl+Shift+Alt+C',
    reason: 'not-registered',
  });
});

test('an explicit accelerator replaces the launcher binding', () => {
  const { controllers } = build({ accelerator: 'Ctrl+Shift+K' });
  const shortcutController = controllers.globalTextPresetShortcutController;
  assert.equal(
    shortcutController.getShortcutStatus({ actionId: GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID }).accelerator,
    'CommandOrControl+Shift+K',
  );
  assert.deepEqual(shortcutController.getShortcutStatus({ actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID }), {
    ok: false,
    actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID,
    registered: false,
    accelerator: '',
    reason: 'unbound',
  });
});

test('the launcher capture is served by the assembled capture window, not by a fallback panel', async () => {
  const { controllers, stub, logs } = build();
  const result = await controllers.globalTextPresetShortcutController.captureSelectedText();
  assert.equal(stub.calls.captureArguments.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'window-show-failed');
  assert.ok(
    logs.events.some((event) => event.type === 'global_capture.window_show_failed'),
    'the capture window controller shares the injected logger',
  );
});

test('the shared logger also reaches the capture window controller outside the shortcut path', async () => {
  const { controllers, logs } = build();
  const result = await controllers.globalCaptureWindowController.show({
    captureId: 'cap-1',
    text: 'hello',
    phase: 'ready',
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'window-show-failed');
  assert.equal(logs.events.at(-1).type, 'global_capture.window_show_failed');
});

test('prewarm aggregates both controllers in order', async () => {
  const { controllers, stub, logs } = build();
  const result = await controllers.globalCaptureWindowController.prewarm();
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 2);
  assert.equal(result[0], undefined);
  assert.deepEqual(result[1], { ok: true, prewarmed: true });
  assert.equal(stub.calls.prewarm, 1);
  assert.ok(logs.events.some((event) => event.type === 'global_capture.window_prewarm_failed'));
});

test('the aggregating prewarm is not memoized across calls', async () => {
  const { controllers, stub } = build();
  await controllers.globalCaptureWindowController.prewarm();
  await controllers.globalCaptureWindowController.prewarm();
  assert.equal(stub.calls.prewarm, 2);
});

test('prewarm still settles after destroy', async () => {
  const { controllers } = build();
  controllers.globalCaptureWindowController.destroy();
  const result = await controllers.globalCaptureWindowController.prewarm();
  assert.equal(result.length, 2);
});

test('destroy reaches the selection controller and is repeatable', () => {
  const { controllers, stub } = build();
  controllers.globalCaptureWindowController.destroy();
  assert.equal(stub.calls.destroy, 1);
  controllers.globalCaptureWindowController.destroy();
  assert.equal(stub.calls.destroy, 2);
});

test('destroy reaches the real shortcut controller', async () => {
  const { controllers } = build();
  controllers.globalCaptureWindowController.destroy();
  assert.deepEqual(await controllers.globalTextPresetShortcutController.captureSelectedText(), {
    ok: false,
    reason: 'capture-controller-destroyed',
  });
});

test('destroy reaches the real capture window controller', async () => {
  const { controllers } = build();
  controllers.globalCaptureWindowController.destroy();
  assert.deepEqual(
    await controllers.globalCaptureWindowController.show({
      captureId: 'cap-1',
      text: 'hello',
      phase: 'ready',
    }),
    { ok: false, reason: 'capture-controller-destroyed' },
  );
});

test('the assembled window controller is still usable through the shared panel helpers', () => {
  const { controllers } = build();
  assert.equal(controllers.globalCaptureWindowController.isVisible(), false);
  assert.equal(controllers.globalCaptureWindowController.isTrustedSender(null), false);
  assert.deepEqual(controllers.globalCaptureWindowController.hide(), false);
  assert.equal(controllers.globalCaptureWindowController.isVisible(), false);
});
