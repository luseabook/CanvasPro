import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID,
  GLOBAL_TEXT_PRESET_SHORTCUT_ID,
  createGlobalTextPresetShortcutController,
  normalizeGlobalTextPresetShortcutPayload,
} from './globalTextPresetShortcutController.js';

const tick = () => new Promise((resolve) => setImmediate(resolve));

function createStubShortcutApi({ registerResult = true, throwOnRegister = false } = {}) {
  const calls = [];
  const callbacks = new Map();
  return {
    calls: calls,
    callbacks: callbacks,
    register: (accelerator, callback) => {
      calls.push(['register', accelerator]);
      if (throwOnRegister) throw new Error('boom');
      if (registerResult) callbacks.set(accelerator, callback);
      return registerResult;
    },
    unregister: (accelerator) => {
      calls.push(['unregister', accelerator]);
      callbacks.delete(accelerator);
    },
  };
}

function createHarness(overrides = {}) {
  const panelCalls = [],
    sent = [],
    diagnostics = [],
    hideCalls = [],
    focusCalls = [];
  let copyCalls = 0;
  const window =
    overrides.window === undefined
      ? {
          isDestroyed: () => false,
          webContents: {
            isDestroyed: () => false,
            send: (channel, payload) => sent.push([channel, payload]),
          },
        }
      : overrides.window;
  const shortcutApi = overrides.globalShortcutApi || createStubShortcutApi();
  const controller = createGlobalTextPresetShortcutController({
    accelerator: overrides.accelerator === undefined ? 'Alt+C' : overrides.accelerator,
    accelerators: overrides.accelerators,
    globalShortcutApi: shortcutApi,
    getMainWindow: () => window,
    copySelectedText:
      overrides.copySelectedText ||
      (async () => {
        copyCalls += 1;
        return { ok: true, text: 'selected text', source: 'selection-hook' };
      }),
    showCapturePanel: async (payload) => {
      panelCalls.push(payload);
      return overrides.panelResult ? overrides.panelResult(payload) : { ok: true };
    },
    hideCapturePanel: () => {
      hideCalls.push(true);
      return true;
    },
    isCapturePanelVisible: () => overrides.panelVisible === true,
    focusCanvas: async () => {
      focusCalls.push(true);
    },
    logDiagnosticEvent: (event) => diagnostics.push(event),
    hasKeyReleaseTracking: overrides.hasKeyReleaseTracking || (() => false),
  });
  return {
    controller: controller,
    panelCalls: panelCalls,
    sent: sent,
    diagnostics: diagnostics,
    hideCalls: hideCalls,
    focusCalls: focusCalls,
    shortcutApi: shortcutApi,
    get copyCalls() {
      return copyCalls;
    },
  };
}

test('normalizeGlobalTextPresetShortcutPayload: normalizes aliases and fixes the modifier order', () => {
  assert.deepEqual(normalizeGlobalTextPresetShortcutPayload({ keys: ['ctrl', 'shift', 'k'] }), {
    ok: true,
    accelerator: 'CommandOrControl+Shift+K',
    keys: ['CommandOrControl', 'Shift', 'K'],
  });
  const unordered = normalizeGlobalTextPresetShortcutPayload({
    accelerator: 'alt+shift+commandorcontrol+m',
  });
  assert.equal(unordered.ok, true);
  assert.equal(unordered.accelerator, 'CommandOrControl+Shift+Alt+M');
  assert.equal(
    normalizeGlobalTextPresetShortcutPayload({ accelerator: 'option+alt+q' }).accelerator,
    'Alt+Q',
  );
  assert.equal(normalizeGlobalTextPresetShortcutPayload({ keys: ['alt', 'space'] }).accelerator, 'Alt+Space');
  assert.equal(normalizeGlobalTextPresetShortcutPayload({ keys: ['cmdorctrl', 'f12'] }).accelerator, 'CommandOrControl+F12');
  assert.equal(normalizeGlobalTextPresetShortcutPayload({ keys: ['alt', '`'] }).accelerator, 'Alt+`');
  assert.equal(normalizeGlobalTextPresetShortcutPayload({ keys: ['alt', '~'] }).accelerator, 'Alt+`');
  assert.equal(normalizeGlobalTextPresetShortcutPayload({ accelerator: 'alt+3' }).accelerator, 'Alt+3');
  assert.equal(normalizeGlobalTextPresetShortcutPayload({ keys: ['alt', 'pageup'] }).accelerator, 'Alt+PageUp');
  assert.equal(normalizeGlobalTextPresetShortcutPayload({ keys: ['alt', 'esc'] }).accelerator, 'Alt+Escape');
  assert.equal(normalizeGlobalTextPresetShortcutPayload({ keys: ['backquote'] }).accelerator, '`');
});

test('normalizeGlobalTextPresetShortcutPayload: empty and unknown tokens unbind instead of throwing', () => {
  const empty = { ok: true, accelerator: '', keys: [] };
  assert.deepEqual(normalizeGlobalTextPresetShortcutPayload({ keys: [] }), empty);
  assert.deepEqual(normalizeGlobalTextPresetShortcutPayload({}), empty);
  assert.deepEqual(normalizeGlobalTextPresetShortcutPayload({ keys: ['bogus'] }), empty);
  assert.deepEqual(normalizeGlobalTextPresetShortcutPayload({ keys: ['f25'] }), empty);
  assert.deepEqual(normalizeGlobalTextPresetShortcutPayload({ keys: [] }, { allowEmpty: false }), {
    ok: false,
    reason: 'invalid-shortcut',
  });
  assert.deepEqual(normalizeGlobalTextPresetShortcutPayload({ keys: 'not-an-array' }), empty);
});

test('normalizeGlobalTextPresetShortcutPayload: requires exactly one primary key', () => {
  const reject = { ok: false, reason: 'invalid-shortcut' };
  assert.deepEqual(normalizeGlobalTextPresetShortcutPayload({ keys: ['ctrl'] }), reject);
  assert.deepEqual(normalizeGlobalTextPresetShortcutPayload({ keys: ['ctrl', 'shift', 'alt'] }), reject);
  assert.deepEqual(normalizeGlobalTextPresetShortcutPayload({ keys: ['alt', 'a', 'b'] }), reject);
  // A trailing '+' produces an empty token, so the payload keeps a single modifier and is rejected.
  assert.deepEqual(normalizeGlobalTextPresetShortcutPayload({ accelerator: 'alt++' }), reject);
  assert.deepEqual(normalizeGlobalTextPresetShortcutPayload({ keys: ['alt', '='] }), {
    ok: true,
    accelerator: 'Alt+Plus',
    keys: ['Alt', 'Plus'],
  });
  // meta/cmd/command are not aliases here: they are dropped, leaving a single primary key.
  assert.equal(normalizeGlobalTextPresetShortcutPayload({ keys: ['meta', 'a'] }).accelerator, 'A');
  assert.equal(normalizeGlobalTextPresetShortcutPayload({ keys: ['cmd', 'a'] }).accelerator, 'A');
  assert.equal(normalizeGlobalTextPresetShortcutPayload({ keys: ['shift', 'a'] }).accelerator, 'Shift+A');
});

test('controller factory defaults to the non-conflicting global capture accelerator', () => {
  const controller = createGlobalTextPresetShortcutController({ globalShortcutApi: createStubShortcutApi() });
  assert.equal(controller.getShortcutStatus().accelerator, 'CommandOrControl+Shift+Alt+C');
});

test('fixture shortcut status reports the launcher binding as unregistered and the preset as unbound', () => {
  const h = createHarness();
  assert.deepEqual(h.controller.getShortcutStatus(), {
    ok: false,
    actionId: GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID,
    registered: false,
    accelerator: 'Alt+C',
    reason: 'not-registered',
  });
  assert.deepEqual(h.controller.getShortcutStatus({ actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID }), {
    ok: false,
    actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID,
    registered: false,
    accelerator: '',
    reason: 'unbound',
  });
  assert.deepEqual(h.controller.getShortcutStatus({ actionId: 'nope' }), {
    ok: false,
    actionId: 'nope',
    registered: false,
    reason: 'invalid-action',
  });
});

test('configureGlobalShortcut records the accelerator without registering before install', () => {
  const h = createHarness();
  const status = h.controller.configureGlobalShortcut({
    actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID,
    keys: ['alt', 'p'],
  });
  assert.equal(status.ok, false);
  assert.equal(status.actionId, GLOBAL_TEXT_PRESET_SHORTCUT_ID);
  assert.equal(status.accelerator, 'Alt+P');
  assert.equal(status.registered, false);
  assert.equal(status.reason, 'not-registered');
  // Rebinding a not-yet-installed shortcut writes the status directly, so it carries no timestamp.
  assert.equal(status.updatedAt, undefined);
  assert.deepEqual(h.shortcutApi.calls, []);
  assert.deepEqual(
    h.sent.map((entry) => entry[0]),
    ['textPreset:globalShortcutStatus'],
  );
  assert.equal(h.sent[0][1].accelerator, 'Alt+P');
});

test('configureGlobalShortcut rejects invalid payloads and unknown actions', () => {
  const h = createHarness();
  assert.deepEqual(h.controller.configureGlobalShortcut({ actionId: 'nope', keys: ['alt', 'p'] }), {
    ok: false,
    actionId: 'nope',
    registered: false,
    reason: 'invalid-action',
  });
  const invalid = h.controller.configureGlobalShortcut({
    actionId: GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID,
    keys: ['ctrl'],
  });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.reason, 'invalid-shortcut');
  assert.equal(invalid.accelerator, 'Alt+C');
  assert.equal(h.controller.getShortcutStatus().accelerator, 'Alt+C');
  assert.deepEqual(h.shortcutApi.calls, []);
});

test('installGlobalShortcut registers bound accelerators only and is idempotent', () => {
  const h = createHarness();
  assert.equal(h.controller.installGlobalShortcut(), true);
  assert.deepEqual(h.shortcutApi.calls, [['register', 'Alt+C']]);
  assert.deepEqual(h.controller.getShortcutStatus(), {
    ok: true,
    actionId: GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID,
    registered: true,
    accelerator: 'Alt+C',
    reason: 'registered',
    updatedAt: h.controller.getShortcutStatus().updatedAt,
  });
  const preset = h.controller.getShortcutStatus({ actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID });
  assert.equal(preset.ok, true);
  assert.equal(preset.reason, 'unbound');
  assert.equal(h.controller.installGlobalShortcut(), true);
  assert.deepEqual(h.shortcutApi.calls, [['register', 'Alt+C']]);
});

test('configureGlobalShortcut registers, reuses and clears the preset binding after install', () => {
  const h = createHarness();
  h.controller.installGlobalShortcut();
  const registered = h.controller.configureGlobalShortcut({
    actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID,
    keys: ['alt', 'p'],
  });
  assert.equal(registered.ok, true);
  assert.equal(registered.registered, true);
  assert.equal(registered.reason, 'registered');
  assert.deepEqual(h.shortcutApi.calls, [
    ['register', 'Alt+C'],
    ['register', 'Alt+P'],
  ]);
  assert.equal(
    h.controller.configureGlobalShortcut({ actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID, keys: ['Alt', 'P'] })
      .reason,
    'registered',
  );
  assert.equal(h.shortcutApi.calls.length, 2);
  const cleared = h.controller.configureGlobalShortcut({
    actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID,
    keys: [],
  });
  assert.equal(cleared.actionId, GLOBAL_TEXT_PRESET_SHORTCUT_ID);
  assert.equal(cleared.accelerator, '');
  assert.equal(cleared.registered, false);
  assert.equal(cleared.reason, 'unbound');
  // An installed controller re-runs the registration for the now-empty binding, which reports ok.
  assert.equal(cleared.ok, true);
  assert.equal(typeof cleared.updatedAt, 'number');
  assert.deepEqual(h.shortcutApi.calls, [
    ['register', 'Alt+C'],
    ['register', 'Alt+P'],
    ['unregister', 'Alt+P'],
  ]);
});

test('installGlobalShortcut reports registration failures and raises a diagnostic', () => {
  const failing = createHarness({ globalShortcutApi: createStubShortcutApi({ registerResult: false }) });
  assert.equal(failing.controller.installGlobalShortcut(), false);
  const failedStatus = failing.controller.getShortcutStatus();
  assert.equal(failedStatus.ok, false);
  assert.equal(failedStatus.registered, false);
  assert.equal(failedStatus.reason, 'registration-failed');
  const throwing = createHarness({ globalShortcutApi: createStubShortcutApi({ throwOnRegister: true }) });
  assert.equal(throwing.controller.installGlobalShortcut(), false);
  assert.equal(throwing.controller.getShortcutStatus().reason, 'registration-failed');
  assert.deepEqual(
    throwing.diagnostics.map((event) => event.type),
    ['global_capture.shortcut_register_failed'],
  );
  assert.equal(throwing.diagnostics[0].level, 'error');
});

test('uninstallGlobalShortcut releases every binding and can be installed again', () => {
  const h = createHarness();
  h.controller.installGlobalShortcut();
  h.controller.uninstallGlobalShortcut();
  h.controller.uninstallGlobalShortcut();
  assert.deepEqual(h.shortcutApi.calls, [['register', 'Alt+C'], ['unregister', 'Alt+C']]);
  // uninstallGlobalShortcut only releases the OS registration: the cached status keeps its last
  // reported value until the next configure/install pass rewrites it.
  assert.equal(h.controller.getShortcutStatus().registered, true);
  h.controller.installGlobalShortcut();
  assert.deepEqual(h.shortcutApi.calls, [
    ['register', 'Alt+C'],
    ['unregister', 'Alt+C'],
    ['register', 'Alt+C'],
  ]);
});

test('the launcher captures text and presents it in the panel', async () => {
  const h = createHarness();
  const result = await h.controller.captureSelectedText();
  assert.equal(result.ok, true);
  assert.equal(result.text, 'selected text');
  assert.equal(typeof result.captureId, 'string');
  assert.deepEqual(h.panelCalls, [
    { captureId: result.captureId, text: '', phase: 'capturing', shortcutLabel: 'Alt+C' },
    { captureId: result.captureId, text: 'selected text', phase: 'ready', shortcutLabel: 'Alt+C' },
  ]);
  const status = h.controller.getShortcutStatus();
  assert.equal(status.ok, true);
  assert.equal(status.reason, 'shown');
  assert.deepEqual(
    h.diagnostics.map((event) => event.type),
    ['global_capture.selection_read'],
  );
  assert.equal(h.diagnostics[0].level, 'info');
  assert.equal(h.diagnostics[0].context.textLength, 'selected text'.length);
});

test('an unavailable capture panel still drains the capture and reports why', async () => {
  const h = createHarness({ panelResult: () => ({ ok: false, reason: 'panel-unavailable' }) });
  assert.deepEqual(await h.controller.captureSelectedText(), {
    ok: false,
    reason: 'panel-unavailable',
  });
  assert.equal(h.copyCalls, 1);
  assert.equal(h.panelCalls.length, 1);
  assert.equal(h.controller.getShortcutStatus().reason, 'panel-unavailable');
});

test('a failed selection read surfaces the reason through the panel and the status', async () => {
  const h = createHarness({ copySelectedText: async () => ({ ok: false, reason: 'no-selection' }) });
  assert.deepEqual(await h.controller.captureSelectedText(), { ok: false, reason: 'no-selection' });
  assert.equal(h.panelCalls.length, 2);
  assert.equal(h.panelCalls[1].phase, 'error');
  assert.equal(h.panelCalls[1].errorReason, 'no-selection');
  assert.equal(h.controller.getShortcutStatus().reason, 'no-selection');
  assert.equal(h.diagnostics[0].level, 'warn');
  assert.equal(h.diagnostics[0].context.reason, 'no-selection');
});

test('a whitespace-only selection is reported as no-selected-text', async () => {
  const h = createHarness({ copySelectedText: async () => ({ ok: true, text: '   ' }) });
  assert.deepEqual(await h.controller.captureSelectedText(), {
    ok: false,
    reason: 'no-selected-text',
  });
  assert.equal(h.panelCalls[1].errorReason, 'no-selected-text');
  assert.equal(h.controller.getShortcutStatus().reason, 'no-selected-text');
});

test('a throwing capture is reported as capture-failed with a diagnostic', async () => {
  const h = createHarness({
    copySelectedText: async () => {
      throw new Error('selection exploded');
    },
  });
  assert.deepEqual(await h.controller.captureSelectedText(), { ok: false, reason: 'capture-failed' });
  assert.equal(h.panelCalls.length, 2);
  assert.equal(h.panelCalls[1].errorReason, 'capture-failed');
  assert.deepEqual(
    h.diagnostics.map((event) => event.type),
    ['global_capture.capture_failed'],
  );
  assert.equal(h.controller.getShortcutStatus().reason, 'capture-failed');
});

test('a visible capture panel dismisses the launcher instead of capturing again', async () => {
  const h = createHarness({ panelVisible: true });
  assert.deepEqual(await h.controller.captureSelectedText(), { ok: true, dismissed: true });
  assert.equal(h.copyCalls, 0);
  assert.equal(h.hideCalls.length, 1);
  assert.equal(h.controller.getShortcutStatus().reason, 'dismissed');
});

test('the text-preset shortcut dispatches a preset-draft capture and settles on acknowledgement', async () => {
  const h = createHarness();
  const capture = h.controller.captureSelectedText(GLOBAL_TEXT_PRESET_SHORTCUT_ID);
  await tick();
  await tick();
  const events = h.controller.consumeEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].actionId, 'preset-draft');
  assert.equal(events[0].text, 'selected text');
  assert.equal(events[0].source, 'globalShortcut');
  assert.equal(events[0].runImmediately, false);
  assert.equal(h.panelCalls.length, 0);
  assert.equal(h.focusCalls.length, 1);
  assert.deepEqual(
    h.sent.filter((entry) => entry[0] === 'textPreset:selectedTextReady').map((entry) => entry[1].eventId),
    [events[0].eventId],
  );
  assert.deepEqual(h.controller.claimEvent({ eventId: events[0].eventId, receiverId: 'renderer-1' }), {
    ok: true,
  });
  assert.deepEqual(
    h.controller.claimEvent({ eventId: events[0].eventId, receiverId: 'renderer-1' }),
    { ok: true },
  );
  assert.deepEqual(
    h.controller.acknowledgeEvent({
      eventId: events[0].eventId,
      receiverId: 'renderer-1',
      ok: true,
    }),
    { ok: true },
  );
  const result = await capture;
  assert.equal(result.ok, true);
  assert.equal(result.event.actionId, 'preset-draft');
  const status = h.controller.getShortcutStatus({ actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID });
  assert.equal(status.ok, true);
  assert.equal(status.reason, 'dispatched');
  assert.deepEqual(h.controller.consumeEvents(), []);
});

test('dispatchCaptureAction skips canvas focus for source-text and validates the payload', async () => {
  const h = createHarness();
  const dispatched = h.controller.dispatchCaptureAction({ actionId: 'source-text', text: 'abc' });
  await tick();
  assert.equal(h.focusCalls.length, 0);
  const [event] = h.controller.consumeEvents();
  assert.equal(event.actionId, 'source-text');
  h.controller.claimEvent({ eventId: event.eventId, receiverId: 'r1' });
  h.controller.acknowledgeEvent({ eventId: event.eventId, receiverId: 'r1', ok: true });
  assert.deepEqual(await dispatched, {
    ok: true,
    event: event,
  });
  assert.equal(h.controller.getShortcutStatus().reason, 'dispatched');
  assert.deepEqual(await h.controller.dispatchCaptureAction({ actionId: 'nope', text: 'abc' }), {
    ok: false,
    reason: 'invalid-action',
  });
  assert.deepEqual(await h.controller.dispatchCaptureAction({ actionId: 'ai-text', text: '  ' }), {
    ok: false,
    reason: 'no-selected-text',
  });
  assert.deepEqual(
    await h.controller.dispatchCaptureAction(
      { actionId: 'ai-text', text: 'x' },
      { signal: { aborted: true } },
    ),
    { ok: false, reason: 'capture-cancelled' },
  );
  assert.equal(h.controller.consumeEvents().length, 0);
});

test('a failed dispatch keeps the renderer reason on the launcher status', async () => {
  const h = createHarness();
  const dispatched = h.controller.dispatchCaptureAction({ actionId: 'ai-image', text: 'abc' });
  await tick();
  const [event] = h.controller.consumeEvents();
  h.controller.claimEvent({ eventId: event.eventId, receiverId: 'r1' });
  h.controller.acknowledgeEvent({
    eventId: event.eventId,
    receiverId: 'r1',
    ok: false,
    retryable: true,
  });
  const result = await dispatched;
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'node-create-failed');
  assert.equal(result.retryable, true);
  assert.equal(result.event.text, 'abc');
  assert.equal(h.controller.getShortcutStatus().reason, 'node-create-failed');
});

test('a triggered shortcut honours key-release tracking before firing again', async () => {
  const h = createHarness({
    hasKeyReleaseTracking: () => true,
    panelResult: () => ({ ok: false, reason: 'panel-unavailable' }),
  });
  h.controller.installGlobalShortcut();
  const trigger = h.shortcutApi.callbacks.get('Alt+C');
  assert.equal(typeof trigger, 'function');
  trigger();
  await tick();
  await tick();
  assert.equal(h.copyCalls, 1);
  trigger();
  await tick();
  assert.equal(h.copyCalls, 1);
  h.controller.releaseShortcutKey({ uniKey: 'q' });
  trigger();
  await tick();
  await tick();
  assert.equal(h.copyCalls, 1);
  h.controller.releaseShortcutKey({ uniKey: 'c' });
  trigger();
  await tick();
  await tick();
  assert.equal(h.copyCalls, 2);
  h.controller.releaseShortcutKey({ injected: true });
  trigger();
  await tick();
  assert.equal(h.copyCalls, 2);
  h.controller.releaseShortcutKey({ keysReleased: true });
  trigger();
  await tick();
  await tick();
  assert.equal(h.copyCalls, 3);
  assert.equal(h.controller.getShortcutStatus().reason, 'panel-unavailable');
});

test('destroy releases the shortcuts, drops pending captures and blocks new ones', async () => {
  const h = createHarness();
  h.controller.installGlobalShortcut();
  const capture = h.controller.captureSelectedText(GLOBAL_TEXT_PRESET_SHORTCUT_ID);
  await tick();
  await tick();
  const [pending] = h.controller.consumeEvents();
  assert.equal(pending.actionId, 'preset-draft');
  h.controller.destroy();
  assert.deepEqual(await capture, {
    ok: false,
    reason: 'capture-controller-destroyed',
    retryable: false,
    event: pending,
  });
  assert.deepEqual(h.controller.consumeEvents(), []);
  assert.deepEqual(h.shortcutApi.calls, [['register', 'Alt+C'], ['unregister', 'Alt+C']]);
  assert.deepEqual(await h.controller.captureSelectedText(), {
    ok: false,
    reason: 'capture-controller-destroyed',
  });
  assert.deepEqual(
    await h.controller.dispatchCaptureAction({ actionId: 'ai-text', text: 'x' }),
    { ok: false, reason: 'capture-cancelled' },
  );
  assert.equal(h.controller.installGlobalShortcut(), false);
});

test('captureSelectedText rejects an unknown shortcut action', async () => {
  const h = createHarness();
  assert.deepEqual(await h.controller.captureSelectedText('nope'), {
    ok: false,
    reason: 'invalid-shortcut-action',
  });
  assert.equal(h.copyCalls, 0);
});

test('shortcut statuses are not sent to a missing or destroyed window', () => {
  const missing = createHarness({ window: null });
  missing.controller.configureGlobalShortcut({ actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID, keys: ['alt', 'p'] });
  assert.deepEqual(missing.sent, []);
  assert.equal(
    missing.controller.getShortcutStatus({ actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID }).accelerator,
    'Alt+P',
  );
  const destroyedWindow = createHarness({
    window: { isDestroyed: () => true, webContents: { isDestroyed: () => false, send: () => {} } },
  });
  destroyedWindow.controller.installGlobalShortcut();
  assert.deepEqual(destroyedWindow.sent, []);
});

test('sendShortcutStatus broadcasts every known binding', () => {
  const h = createHarness({ accelerators: { [GLOBAL_TEXT_PRESET_SHORTCUT_ID]: 'Alt+P' } });
  assert.deepEqual(h.controller.getShortcutStatus({ actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID }), {
    ok: false,
    actionId: GLOBAL_TEXT_PRESET_SHORTCUT_ID,
    registered: false,
    accelerator: 'Alt+P',
    reason: 'not-registered',
  });
  h.controller.sendShortcutStatus();
  assert.deepEqual(
    h.sent.map((entry) => entry[1].actionId),
    [GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID, GLOBAL_TEXT_PRESET_SHORTCUT_ID],
  );
});
