import { createGlobalCaptureDelivery } from './globalCaptureDelivery.js';

export const GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID = 'global-capture-launcher';
export const GLOBAL_TEXT_PRESET_SHORTCUT_ID = 'global-text-preset';

const SUPPORTED_SHORTCUT_IDS = new Set([
  GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID,
  GLOBAL_TEXT_PRESET_SHORTCUT_ID,
]);
const SUPPORTED_CAPTURE_ACTION_IDS = new Set([
  'source-text',
  'ai-text',
  'ai-image',
  'ai-video',
  'preset-draft',
]);

const MODIFIER_TOKENS = ['CommandOrControl', 'Shift', 'Alt'];

const SHORTCUT_KEY_ALIASES = new Map([
  ['enter', 'Enter'],
  ['return', 'Enter'],
  ['tab', 'Tab'],
  ['escape', 'Escape'],
  ['esc', 'Escape'],
  ['backspace', 'Backspace'],
  ['delete', 'Delete'],
  ['del', 'Delete'],
  ['insert', 'Insert'],
  ['ins', 'Insert'],
  ['home', 'Home'],
  ['end', 'End'],
  ['pageup', 'PageUp'],
  ['pagedown', 'PageDown'],
  ['up', 'Up'],
  ['down', 'Down'],
  ['left', 'Left'],
  ['right', 'Right'],
  ['+', 'Plus'],
  ['=', 'Plus'],
  ['-', 'Minus'],
  [',', 'Comma'],
  ['.', 'Period'],
  ['/', 'Slash'],
  ['\\', 'Backslash'],
  [';', 'Semicolon'],
  ["'", 'Quote'],
  ['[', 'BracketLeft'],
  [']', 'BracketRight'],
]);

// Unlike the context-menu accelerator parser, this one does not map meta/cmd/command onto
// CommandOrControl: unknown tokens are dropped, so `{ keys: ['meta', 'a'] }` degrades to a bare
// `A` and only the "exactly one primary key" rule can reject a payload.
export function normalizeTextPresetShortcutToken(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (
    lower === 'ctrl' ||
    lower === 'control' ||
    lower === 'cmdorctrl' ||
    lower === 'commandorcontrol' ||
    lower === 'commandorctrl'
  )
    return 'CommandOrControl';
  if (lower === 'shift') return 'Shift';
  if (lower === 'alt' || lower === 'option') return 'Alt';
  if (lower === 'space') return 'Space';
  if (lower === 'backquote' || raw === '`' || raw === '~') return '`';
  if (/^f([1-9]|1[0-9]|2[0-4])$/i.test(raw)) return raw.toUpperCase();
  if (/^[a-z]$/i.test(raw)) return raw.toUpperCase();
  if (/^[0-9]$/.test(raw)) return raw;
  return SHORTCUT_KEY_ALIASES.get(lower) || '';
}

export function normalizeGlobalTextPresetShortcutPayload(payload = {}, { allowEmpty = true } = {}) {
  const rawTokens = Array.isArray(payload?.keys)
    ? payload.keys
    : typeof payload?.accelerator === 'string'
      ? payload.accelerator.split('+')
      : [];
  const tokens = rawTokens.map(normalizeTextPresetShortcutToken).filter(Boolean);
  if (allowEmpty && tokens.length === 0) return { ok: true, accelerator: '', keys: [] };
  const modifiers = MODIFIER_TOKENS.filter((modifier) => tokens.includes(modifier));
  const primaryKeys = tokens.filter((token) => !MODIFIER_TOKENS.includes(token));
  if (primaryKeys.length !== 1) return { ok: false, reason: 'invalid-shortcut' };
  const keys = [...modifiers, primaryKeys[0]];
  return { ok: true, accelerator: keys.join('+'), keys: keys };
}

function createInitialBinding(actionId, accelerator) {
  const normalized = normalizeGlobalTextPresetShortcutPayload(
    { accelerator: accelerator },
    { allowEmpty: true },
  );
  return { actionId: actionId, accelerator: normalized.ok ? normalized.accelerator : '', registered: false, held: false };
}

export function createGlobalTextPresetShortcutController({
  accelerator = 'Control+Alt+Shift+C',
  accelerators = {},
  clipboardApi = {},
  globalShortcutApi = {},
  copySelectedText = async () => ({ ok: false, reason: 'capture-unavailable' }),
  focusCanvas = null,
  getMainWindow = null,
  showCapturePanel = async () => ({ ok: false, reason: 'panel-unavailable' }),
  hideCapturePanel = () => false,
  isCapturePanelVisible = () => false,
  logDiagnosticEvent = () => {},
  delivery = createGlobalCaptureDelivery(),
  hasKeyReleaseTracking = () => false,
} = {}) {
  const boundAccelerators = new Map([
    [
      GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID,
      createInitialBinding(
        GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID,
        accelerators[GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID] ?? accelerator,
      ),
    ],
    [
      GLOBAL_TEXT_PRESET_SHORTCUT_ID,
      createInitialBinding(
        GLOBAL_TEXT_PRESET_SHORTCUT_ID,
        accelerators[GLOBAL_TEXT_PRESET_SHORTCUT_ID] ?? '',
      ),
    ],
  ]);
  let installed = false;
  let destroyed = false;
  let activeCapture = null;
  let queuedCapture = null;
  let panelCaptureId = '';
  let panelPhase = '';
  let captureSequence = 0;
  let launcherSequence = 0;
  const statuses = new Map(
    Array.from(boundAccelerators.values(), (binding) => [
      binding.actionId,
      {
        ok: false,
        actionId: binding.actionId,
        registered: false,
        accelerator: binding.accelerator,
        reason: binding.accelerator ? 'not-registered' : 'unbound',
      },
    ]),
  );

  function sendStatusToRenderer(status) {
    const window = getMainWindow?.();
    if (!window || window.isDestroyed?.()) return;
    if (window.webContents?.isDestroyed?.()) return;
    try {
      window.webContents?.send?.('textPreset:globalShortcutStatus', status);
    } catch {}
  }

  function broadcastShortcutStatus(status = null) {
    if (status && typeof status === 'object') {
      sendStatusToRenderer(status);
      return;
    }
    statuses.forEach((entry) => sendStatusToRenderer({ ...entry }));
  }

  function updateShortcutStatus(actionId, patch = {}) {
    const binding = boundAccelerators.get(actionId);
    if (!binding) return null;
    const next = {
      ...(statuses.get(actionId) || {}),
      ...patch,
      actionId: actionId,
      accelerator: binding.accelerator,
      updatedAt: Date.now(),
    };
    statuses.set(actionId, next);
    sendStatusToRenderer({ ...next });
    return next;
  }

  function logSelectionRead(actionId, result, text = '') {
    try {
      const succeeded = result?.ok === true && Boolean(text);
      logDiagnosticEvent({
        type: 'global_capture.selection_read',
        level: succeeded ? 'info' : 'warn',
        source: 'main',
        message: succeeded
          ? 'Global selected text read succeeded'
          : 'Global selected text read returned no text',
        context: {
          shortcutActionId: actionId,
          ok: succeeded,
          reason: String(result?.reason || (text ? '' : 'no-selected-text')),
          captureSource: String(result?.source || 'clipboard-shortcut'),
          programName: String(result?.programName || ''),
          method: Number(result?.method) || 0,
          textLength: text.length,
        },
      });
    } catch {}
  }

  async function focusCanvasForAction(actionId) {
    if (actionId === 'source-text') return;
    try {
      await focusCanvas?.();
    } catch (error) {
      logDiagnosticEvent({
        type: 'global_capture.focus_failed',
        level: 'warn',
        source: 'main',
        message: 'Canvas focus failed after global capture action',
        error: error,
        context: { actionId: actionId },
      });
    }
  }

  async function dispatchCaptureEvent(payload = {}, { signal = null } = {}) {
    const actionId = String(payload?.actionId || '').trim();
    if (!SUPPORTED_CAPTURE_ACTION_IDS.has(actionId)) return { ok: false, reason: 'invalid-action' };
    const event = {
      eventId:
        String(payload?.eventId || '').trim() ||
        'global-capture-' + Date.now() + '-' + ++captureSequence,
      text: String(payload?.text || '').trim(),
      actionId: actionId,
      runImmediately: payload?.runImmediately === true,
      source: String(payload?.source || 'globalShortcut'),
      createdAt: Number(payload?.createdAt) || Date.now(),
    };
    if (!event.text) return { ok: false, reason: 'no-selected-text' };
    const queued = delivery.enqueue(event, { signal: signal });
    if (!queued.ok) return queued;
    const window = getMainWindow?.();
    if (window && !window.isDestroyed?.() && !window.webContents?.isDestroyed?.())
      try {
        window.webContents?.send?.('textPreset:selectedTextReady', event);
      } catch {}
    return { ...(await queued.completion), event: event };
  }

  async function dispatchCaptureAction(payload = {}, { signal = null } = {}) {
    if (destroyed || signal?.aborted) return { ok: false, reason: 'capture-cancelled' };
    const actionId = String(payload?.actionId || '').trim();
    if (!SUPPORTED_CAPTURE_ACTION_IDS.has(actionId)) return { ok: false, reason: 'invalid-action' };
    panelCaptureId = '';
    panelPhase = '';
    await focusCanvasForAction(actionId);
    if (destroyed || signal?.aborted) return { ok: false, reason: 'capture-cancelled' };
    const result = await dispatchCaptureEvent(payload, { signal: signal });
    updateShortcutStatus(GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID, {
      ok: result.ok === true,
      registered: boundAccelerators.get(GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID)?.registered === true,
      reason: result.ok === true ? 'dispatched' : result.reason,
    });
    return result;
  }

  async function runShortcutCapture(actionId) {
    const isLauncher = actionId === GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID;
    const captureId = isLauncher ? Date.now() + '-' + ++launcherSequence : '';
    const shortcutLabel = boundAccelerators.get(actionId)?.accelerator || 'Control+Alt+Shift+C';
    const registered = () => boundAccelerators.get(actionId)?.registered === true;
    try {
      if (isLauncher) {
        panelCaptureId = captureId;
        panelPhase = 'capturing';
      }
      const copyOutcome = Promise.resolve(copySelectedText()).then(
        (value) => ({ status: 'fulfilled', value: value }),
        (reason) => ({ status: 'rejected', reason: reason }),
      );
      if (isLauncher) {
        const panel = await showCapturePanel({
          captureId: captureId,
          text: '',
          phase: 'capturing',
          shortcutLabel: shortcutLabel,
        });
        if (!panel?.ok) {
          if (panelCaptureId === captureId) {
            panelCaptureId = '';
            panelPhase = '';
          }
          const reason = panel?.reason || 'panel-failed';
          updateShortcutStatus(actionId, { ok: false, registered: registered(), reason: reason });
          await copyOutcome;
          return { ok: false, reason: reason };
        }
      }
      const settled = await copyOutcome;
      if (destroyed || (isLauncher && panelCaptureId !== captureId))
        return { ok: false, reason: 'capture-cancelled' };
      if (settled.status === 'rejected') throw settled.reason;
      const result = settled.value;
      if (!result?.ok) {
        const reason = result?.reason || 'copy-failed';
        logSelectionRead(actionId, result);
        if (isLauncher) {
          panelCaptureId = captureId;
          panelPhase = 'error';
          const panel = await showCapturePanel({
            captureId: captureId,
            text: '',
            phase: 'error',
            errorReason: reason,
            shortcutLabel: shortcutLabel,
          });
          if (panel?.ok !== true && panelCaptureId === captureId) {
            panelCaptureId = '';
            panelPhase = '';
          }
        }
        updateShortcutStatus(actionId, { ok: false, registered: registered(), reason: reason });
        return { ok: false, reason: reason };
      }
      const text = typeof result?.text === 'string' ? result.text : clipboardApi?.readText?.() || '';
      const trimmed = String(text).trim();
      if (!trimmed) {
        logSelectionRead(actionId, result);
        if (isLauncher) {
          panelCaptureId = captureId;
          panelPhase = 'error';
          const panel = await showCapturePanel({
            captureId: captureId,
            text: '',
            phase: 'error',
            errorReason: 'no-selected-text',
            shortcutLabel: shortcutLabel,
          });
          if (panel?.ok !== true && panelCaptureId === captureId) {
            panelCaptureId = '';
            panelPhase = '';
          }
        }
        updateShortcutStatus(actionId, {
          ok: false,
          registered: registered(),
          reason: 'no-selected-text',
        });
        return { ok: false, reason: 'no-selected-text' };
      }
      logSelectionRead(actionId, result, trimmed);
      if (actionId === GLOBAL_TEXT_PRESET_SHORTCUT_ID) {
        const dispatched = await dispatchCaptureAction({
          text: trimmed,
          actionId: 'preset-draft',
          runImmediately: false,
          source: 'globalShortcut',
        });
        updateShortcutStatus(actionId, {
          ok: dispatched.ok === true,
          registered: registered(),
          reason: dispatched.ok === true ? 'dispatched' : dispatched.reason,
        });
        return dispatched;
      }
      panelCaptureId = captureId;
      panelPhase = 'ready';
      const panel = await showCapturePanel({
        captureId: captureId,
        text: trimmed,
        phase: 'ready',
        shortcutLabel: shortcutLabel,
      });
      if (panel?.ok !== true && panelCaptureId === captureId) {
        panelCaptureId = '';
        panelPhase = '';
        hideCapturePanel?.();
      }
      updateShortcutStatus(actionId, {
        ok: panel?.ok === true,
        registered: registered(),
        reason: panel?.ok === true ? 'shown' : panel?.reason || 'panel-failed',
      });
      return panel?.ok === true
        ? { ok: true, captureId: captureId, text: trimmed }
        : { ok: false, reason: panel?.reason || 'panel-failed' };
    } catch (error) {
      if (destroyed || (isLauncher && panelCaptureId !== captureId))
        return { ok: false, reason: 'capture-cancelled' };
      if (isLauncher) {
        panelCaptureId = captureId;
        panelPhase = 'error';
        try {
          const panel = await showCapturePanel({
            captureId: captureId,
            text: '',
            phase: 'error',
            errorReason: 'capture-failed',
            shortcutLabel: shortcutLabel,
          });
          if (panel?.ok !== true && panelCaptureId === captureId) {
            panelCaptureId = '';
            panelPhase = '';
          }
        } catch {
          if (panelCaptureId === captureId) {
            panelCaptureId = '';
            panelPhase = '';
          }
        }
      }
      updateShortcutStatus(actionId, { ok: false, registered: registered(), reason: 'capture-failed' });
      logDiagnosticEvent({
        type: 'global_capture.capture_failed',
        level: 'error',
        source: 'main',
        message: 'Global selected text capture failed',
        error: error,
        context: { shortcutActionId: actionId },
      });
      return { ok: false, reason: 'capture-failed' };
    }
  }

  function startShortcutCapture(actionId) {
    if (destroyed)
      return Promise.resolve({ ok: false, reason: 'capture-controller-destroyed' });
    const started = runShortcutCapture(actionId);
    const tracked = started.finally(() => {
      if (activeCapture === tracked) activeCapture = null;
    });
    activeCapture = tracked;
    return tracked;
  }

  function chainCapture(promise, actionId) {
    if (queuedCapture) return queuedCapture;
    const chained = promise.then((result) => {
      if (result?.ok === true) return result;
      return startShortcutCapture(actionId);
    });
    const tracked = chained.finally(() => {
      if (queuedCapture === tracked) queuedCapture = null;
    });
    queuedCapture = tracked;
    return tracked;
  }

  async function captureSelectedText(actionId = GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID) {
    if (destroyed) return { ok: false, reason: 'capture-controller-destroyed' };
    if (!SUPPORTED_SHORTCUT_IDS.has(actionId))
      return { ok: false, reason: 'invalid-shortcut-action' };
    if (
      actionId === GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID &&
      (isCapturePanelVisible?.() || panelCaptureId)
    ) {
      const wasError = panelPhase === 'error';
      panelCaptureId = '';
      panelPhase = '';
      queuedCapture = null;
      hideCapturePanel?.();
      if (wasError)
        updateShortcutStatus(actionId, { ok: true, registered: isBindingRegistered(actionId), reason: 'retrying' });
      else {
        updateShortcutStatus(actionId, { ok: true, registered: isBindingRegistered(actionId), reason: 'dismissed' });
        return { ok: true, dismissed: true };
      }
    }
    if (activeCapture) return chainCapture(activeCapture, actionId);
    try {
      return await startShortcutCapture(actionId);
    } catch {
      return { ok: false, reason: 'capture-failed' };
    }
  }

  function isBindingRegistered(actionId) {
    return boundAccelerators.get(actionId)?.registered === true;
  }

  function unregisterBinding(binding) {
    if (binding) binding.held = false;
    if (!binding?.registered || !binding.accelerator) return;
    try {
      globalShortcutApi?.unregister?.(binding.accelerator);
    } catch {}
    binding.registered = false;
  }

  function registerBinding(binding) {
    if (!binding.accelerator) {
      binding.registered = false;
      updateShortcutStatus(binding.actionId, { ok: true, registered: false, reason: 'unbound' });
      return true;
    }
    let registered = false;
    try {
      registered =
        globalShortcutApi?.register?.(binding.accelerator, () => {
          if (binding.held || destroyed) return;
          binding.held = true;
          void captureSelectedText(binding.actionId).finally(() => {
            if (!hasKeyReleaseTracking()) binding.held = false;
          });
        }) === true;
    } catch (error) {
      logDiagnosticEvent({
        type: 'global_capture.shortcut_register_failed',
        level: 'error',
        source: 'main',
        message: 'Global capture shortcut registration threw',
        error: error,
        context: { actionId: binding.actionId, accelerator: binding.accelerator },
      });
    }
    binding.registered = registered;
    updateShortcutStatus(binding.actionId, {
      ok: registered,
      registered: registered,
      reason: registered ? 'registered' : 'registration-failed',
    });
    return registered;
  }

  function installGlobalShortcut() {
    if (destroyed) return false;
    if (installed) return isBindingRegistered(GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID);
    installed = true;
    let allRegistered = true;
    boundAccelerators.forEach((binding) => {
      if (!registerBinding(binding)) allRegistered = false;
    });
    return allRegistered;
  }

  function uninstallGlobalShortcut() {
    boundAccelerators.forEach(unregisterBinding);
    installed = false;
  }

  // The selection hook reports the physical key that was released so a held shortcut is not
  // re-triggered while the user is still typing; `injected` events are synthetic and ignored.
  function releaseShortcutKey(payload = {}) {
    if (payload?.injected === true) return;
    const token = normalizeTextPresetShortcutToken(payload?.uniKey);
    for (const binding of boundAccelerators.values()) {
      if (payload?.keysReleased === true || binding.accelerator.split('+').includes(token))
        binding.held = false;
    }
  }

  function destroy() {
    destroyed = true;
    panelCaptureId = '';
    panelPhase = '';
    queuedCapture = null;
    uninstallGlobalShortcut();
    delivery.destroy();
  }

  function configureGlobalShortcut(payload = {}) {
    const actionId = String(payload?.actionId || GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID).trim();
    if (!SUPPORTED_SHORTCUT_IDS.has(actionId))
      return { ok: false, actionId: actionId, registered: false, reason: 'invalid-action' };
    const normalized = normalizeGlobalTextPresetShortcutPayload(payload, { allowEmpty: true });
    const binding = boundAccelerators.get(actionId);
    if (!normalized.ok)
      return {
        ...updateShortcutStatus(actionId, {
          ok: false,
          registered: binding.registered === true,
          reason: normalized.reason || 'invalid-shortcut',
        }),
      };
    if (normalized.accelerator === binding.accelerator) {
      if (installed && binding.accelerator && !binding.registered) registerBinding(binding);
      broadcastShortcutStatus(statuses.get(actionId));
      return { ...statuses.get(actionId) };
    }
    unregisterBinding(binding);
    binding.accelerator = normalized.accelerator;
    statuses.set(actionId, {
      ok: false,
      actionId: actionId,
      registered: false,
      accelerator: binding.accelerator,
      reason: binding.accelerator ? 'not-registered' : 'unbound',
    });
    if (installed) registerBinding(binding);
    else broadcastShortcutStatus(statuses.get(actionId));
    return { ...statuses.get(actionId) };
  }

  function getShortcutStatus(payload = {}) {
    const actionId = String(payload?.actionId || GLOBAL_CAPTURE_LAUNCHER_SHORTCUT_ID).trim();
    return statuses.has(actionId)
      ? { ...statuses.get(actionId) }
      : { ok: false, actionId: actionId, registered: false, reason: 'invalid-action' };
  }

  return {
    captureSelectedText: captureSelectedText,
    destroy: destroy,
    releaseShortcutKey: releaseShortcutKey,
    configureGlobalShortcut: configureGlobalShortcut,
    consumeEvents: () => delivery.consumeEvents(),
    claimEvent: delivery.claim,
    acknowledgeEvent: delivery.acknowledge,
    dispatchCaptureAction: dispatchCaptureAction,
    getShortcutStatus: getShortcutStatus,
    installGlobalShortcut: installGlobalShortcut,
    sendShortcutStatus: broadcastShortcutStatus,
    uninstallGlobalShortcut: uninstallGlobalShortcut,
  };
}
