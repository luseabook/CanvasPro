import electron from 'electron';
import path from 'node:path';
import { disableWindowsWindowTransitions } from './windowsWindowTransitions.js';
const { BrowserWindow, nativeTheme, screen } = typeof electron === 'object' && electron ? electron : {};
export const GLOBAL_CAPTURE_ACTION_IDS = Object['freeze']([
  'source-text',
  'ai-text',
  'ai-image',
  'ai-video',
  'preset-draft',
]);
const AI_ACTION_IDS = new Set(['ai-text', 'ai-image', 'ai-video']),
  CAPTURE_PHASES = new Set(['capturing', 'ready', 'error']),
  DEFAULT_WINDOW_SIZE = Object['freeze']({ width: 0x190, height: 0x34 }),
  EXPANDED_HEIGHT = 0x104,
  NATIVE_TRANSPARENT_BACKGROUND = '#' + '0'['repeat'](0x8);
function clamp(value, min, max) {
  if (max < min) return min;
  return Math['min'](max, Math['max'](min, value));
}
function normalizeScreenArea(area = {}) {
  return {
    x: Math['round'](Number(area?.['x']) || 0x0),
    y: Math['round'](Number(area?.['y']) || 0x0),
    width: Math['max'](0x1, Math['round'](Number(area?.['width']) || 0x1)),
    height: Math['max'](0x1, Math['round'](Number(area?.['height']) || 0x1)),
  };
}
export function resolveGlobalCaptureWindowBounds({
  cursor: cursor = { x: 0x0, y: 0x0 },
  workArea: workArea = { x: 0x0, y: 0x0, width: 0x500, height: 0x2d0 },
  size: size = DEFAULT_WINDOW_SIZE,
  margin: margin = 0xc,
  offset: offset = 0xe,
} = {}) {
  const safeWorkArea = normalizeScreenArea(workArea),
    safeMargin = Math['max'](0x0, Math['round'](Number(margin) || 0x0)),
    maxWidth = Math['max'](0x1, safeWorkArea['width'] - safeMargin * 0x2),
    maxHeight = Math['max'](0x1, safeWorkArea['height'] - safeMargin * 0x2),
    width = Math['min'](
      maxWidth,
      Math['max'](0x1, Math['round'](Number(size?.['width']) || DEFAULT_WINDOW_SIZE['width'])),
    ),
    height = Math['min'](
      maxHeight,
      Math['max'](0x1, Math['round'](Number(size?.['height']) || DEFAULT_WINDOW_SIZE['height'])),
    ),
    cursorX = Math['round'](Number(cursor?.['x']) || safeWorkArea['x']),
    cursorY = Math['round'](Number(cursor?.['y']) || safeWorkArea['y']),
    safeOffset = Math['max'](0x0, Math['round'](Number(offset) || 0x0)),
    minX = safeWorkArea['x'] + safeMargin,
    minY = safeWorkArea['y'] + safeMargin,
    maxX = safeWorkArea['x'] + safeWorkArea['width'] - safeMargin - width,
    maxY = safeWorkArea['y'] + safeWorkArea['height'] - safeMargin - height;
  let x = cursorX + safeOffset,
    y = cursorY + safeOffset;
  return (
    x + width > safeWorkArea['x'] + safeWorkArea['width'] - safeMargin && (x = cursorX - width - safeOffset),
    y + height > safeWorkArea['y'] + safeWorkArea['height'] - safeMargin &&
      (y = cursorY - height - safeOffset),
    {
      x: clamp(x, minX, maxX),
      y: clamp(y, minY, maxY),
      width: width,
      height: height,
    }
  );
}
export function createGlobalCaptureWindowController({
  dirname: dirname,
  BrowserWindowClass: BrowserWindowClass = BrowserWindow,
  screenApi: screenApi = screen,
  nativeThemeApi: nativeThemeApi = nativeTheme,
  onAction: onAction = async () => ({ ok: !![] }),
  logDiagnosticEvent: logDiagnosticEvent = () => {},
  prepareWindow: prepareWindow = disableWindowsWindowTransitions,
  windowSize: windowSize = DEFAULT_WINDOW_SIZE,
  focusRetryDelayMs: focusRetryDelayMs = 0x18,
  pendingShowDelayMs: pendingShowDelayMs = 0x78,
  setTimeoutFn: setTimeoutFn = setTimeout,
  clearTimeoutFn: clearTimeoutFn = clearTimeout,
} = {}) {
  let captureWindow = null,
    windowReady = null,
    prewarmPromise = null,
    presentation = null,
    cancelledCaptureId = '',
    userFocused = ![],
    focusRetryTimer = null,
    pendingShowTimer = null,
    presentationSeq = 0x0,
    dispatchSeq = 0x0,
    runImmediately = ![],
    activeActionId = 'source-text',
    destroyed = ![];
  function isWindowAlive() {
    return Boolean(captureWindow && !captureWindow['isDestroyed']?.());
  }
  function isTrustedSender(sender) {
    return isWindowAlive() && captureWindow['webContents'] === sender;
  }
  function isWindowVisible() {
    return isWindowAlive() && captureWindow['isVisible']?.() === !![];
  }
  function clearPendingPresentation() {
    presentation?.['dispatchAbort']?.['abort']();
    if (pendingShowTimer !== null) clearTimeoutFn(pendingShowTimer);
    ((pendingShowTimer = null), (presentation = null), (userFocused = ![]));
  }
  function clearFocusRetryTimer() {
    if (focusRetryTimer === null) return;
    (clearTimeoutFn(focusRetryTimer), (focusRetryTimer = null));
  }
  function focusWindow(targetWindow) {
    if (targetWindow['isFocused']?.() === !![]) return;
    (targetWindow['focus']?.(),
      presentation && targetWindow['isFocused']?.() === !![] && (userFocused = !![]));
  }
  function scheduleFocusRetry(expectedWindow, expectedCaptureId) {
    (clearFocusRetryTimer(),
      (focusRetryTimer = setTimeoutFn(() => {
        focusRetryTimer = null;
        if (
          !isWindowAlive() ||
          captureWindow !== expectedWindow ||
          !isWindowVisible() ||
          presentation?.['captureId'] !== expectedCaptureId ||
          expectedWindow['isFocused']?.() === !![]
        )
          return;
        focusWindow(expectedWindow);
      }, focusRetryDelayMs)));
  }
  function hideWindow() {
    clearFocusRetryTimer();
    if (presentation) cancelledCaptureId = presentation['captureId'];
    if (!isWindowAlive()) return (clearPendingPresentation(), ![]);
    return (
      captureWindow['hide']?.(),
      captureWindow['webContents']?.['setBackgroundThrottling']?.(!![]),
      clearPendingPresentation(),
      !![]
    );
  }
  async function ensureWindow() {
    if (destroyed) throw new Error('capture-controller-destroyed');
    if (isWindowAlive()) {
      if (windowReady) await windowReady;
      return captureWindow;
    }
    ((captureWindow = new BrowserWindowClass({
      width: windowSize['width'],
      height: windowSize['height'],
      title: '发送到 Canvas 无限画布',
      show: ![],
      frame: ![],
      thickFrame: ![],
      roundedCorners: ![],
      transparent: !![],
      backgroundColor: NATIVE_TRANSPARENT_BACKGROUND,
      backgroundMaterial: 'none',
      hasShadow: ![],
      paintWhenInitiallyHidden: !![],
      alwaysOnTop: !![],
      focusable: !![],
      skipTaskbar: !![],
      resizable: ![],
      movable: ![],
      minimizable: ![],
      maximizable: ![],
      fullscreenable: ![],
      webPreferences: {
        preload: path['join'](dirname, 'globalCaptureWindowPreload.cjs'),
        contextIsolation: !![],
        nodeIntegration: ![],
        sandbox: !![],
        backgroundThrottling: ![],
      },
    })),
      captureWindow['on']?.('closed', () => {
        (clearFocusRetryTimer(), (captureWindow = null), (windowReady = null), clearPendingPresentation());
      }),
      captureWindow['on']?.('blur', () => {
        if (presentation && userFocused && !presentation['pending']) hideWindow();
      }),
      captureWindow['on']?.('focus', () => {
        if (presentation) userFocused = !![];
      }));
    const pendingWindow = captureWindow,
      preparationPromise = Promise['resolve']()
        ['then'](() => prepareWindow(pendingWindow))
        ['then']((preparationResult) => {
          if (preparationResult?.['ok'] === ![])
            throw new Error(preparationResult['reason'] || 'native-window-preparation-failed');
          if (preparationResult?.['ok'] && !preparationResult['skipped'])
            logDiagnosticEvent({
              type: 'global_capture.window_transitions_disabled',
              level: 'info',
              source: 'main',
              message: 'Native\x20popup\x20transitions\x20disabled\x20before\x20presentation',
            });
        })
        ['catch']((preparationError) => {
          logDiagnosticEvent({
            type: 'global_capture.window_transitions_unavailable',
            level: 'warn',
            source: 'main',
            message: 'Native\x20popup\x20transitions\x20could\x20not\x20be\x20disabled',
            error: preparationError,
          });
        });
    return (
      (windowReady = Promise['all']([
        captureWindow['loadFile'](path['join'](dirname, 'globalCaptureWindow.html')),
        preparationPromise,
      ])['catch']((loadError) => {
        windowReady = null;
        throw loadError;
      })),
      await windowReady,
      captureWindow
    );
  }
  function prewarmWindow() {
    if (prewarmPromise) return prewarmPromise;
    return (
      (prewarmPromise = ensureWindow()
        ['catch']((prewarmError) => {
          logDiagnosticEvent({
            type: 'global_capture.window_prewarm_failed',
            level: 'warn',
            source: 'main',
            message: 'Global capture window prewarm failed',
            error: prewarmError,
          });
        })
        ['finally'](() => {
          prewarmPromise = null;
        })),
      prewarmPromise
    );
  }
  async function show(payload = {}) {
    if (destroyed) return { ok: ![], reason: 'capture-controller-destroyed' };
    const text = String(payload?.['text'] || '')['trim'](),
      captureId = String(payload?.['captureId'] || '')['trim']();
    if (captureId && captureId === cancelledCaptureId) return { ok: ![], reason: 'capture-cancelled' };
    const requestedPhase = String(payload?.['phase'] || '')['trim'](),
      phase = CAPTURE_PHASES['has'](requestedPhase) ? requestedPhase : text ? 'ready' : '';
    if (!captureId || !phase || (phase === 'ready' && !text)) return { ok: ![], reason: 'invalid-capture' };
    try {
      const readyWindow = await ensureWindow();
      if (destroyed) return { ok: ![], reason: 'capture-controller-destroyed' };
      if (captureId === cancelledCaptureId) return { ok: ![], reason: 'capture-cancelled' };
      if (!readyWindow || readyWindow['isDestroyed']?.()) return { ok: ![], reason: 'window-unavailable' };
      const reusablePresentation = presentation?.['captureId'] === captureId ? presentation : null;
      if (!reusablePresentation) presentation?.['dispatchAbort']?.['abort']();
      const cursor = reusablePresentation?.['cursor'] ||
          screenApi['getCursorScreenPoint']?.() || { x: 0x0, y: 0x0 },
        display = screenApi['getDisplayNearestPoint']?.(cursor) || {},
        workArea =
          reusablePresentation?.['workArea'] ||
          normalizeScreenArea(
            display['workArea'] || display['bounds'] || { x: 0x0, y: 0x0, width: 0x500, height: 0x2d0 },
          ),
        bounds = resolveGlobalCaptureWindowBounds({
          cursor: cursor,
          workArea: workArea,
          size: windowSize,
        });
      if (pendingShowTimer !== null) clearTimeoutFn(pendingShowTimer);
      pendingShowTimer = null;
      const presentationId = ++presentationSeq;
      return (
        (presentation = {
          captureId: captureId,
          presentationId: presentationId,
          text: text,
          phase: phase,
          cursor: cursor,
          workArea: workArea,
          bounds: bounds,
          pending: ![],
        }),
        !reusablePresentation &&
          ((userFocused = ![]),
          readyWindow['setBounds']?.(bounds),
          readyWindow['setAlwaysOnTop']?.(!![], 'pop-up-menu'),
          readyWindow['setVisibleOnAllWorkspaces']?.(!![], { visibleOnFullScreen: !![] })),
        readyWindow['webContents']?.['setBackgroundThrottling']?.(![]),
        readyWindow['webContents']?.['send']?.('globalCaptureWindow:present', {
          captureId: captureId,
          presentationId: presentationId,
          text: text,
          phase: phase,
          errorReason: String(payload?.['errorReason'] || '')['trim'](),
          shortcutLabel: String(payload?.['shortcutLabel'] || 'Alt+C')['trim']() || 'Alt+C',
          theme: nativeThemeApi?.['shouldUseDarkColors'] === ![] ? 'light' : 'dark',
          runImmediately: runImmediately,
          activeActionId: activeActionId,
        }),
        clearFocusRetryTimer(),
        { ok: !![], captureId: captureId, bounds: bounds, phase: phase }
      );
    } catch (showError) {
      return (
        clearPendingPresentation(),
        logDiagnosticEvent({
          type: 'global_capture.window_show_failed',
          level: 'error',
          source: 'main',
          message: 'Global\x20capture\x20window\x20failed\x20to\x20show',
          error: showError,
        }),
        { ok: ![], reason: 'window-show-failed' }
      );
    }
  }
  async function didPresent(presentPayload = {}, presentSender = null) {
    if (!isTrustedSender(presentSender)) return { ok: ![], reason: 'untrusted-sender' };
    const currentPresentation = presentation;
    if (
      !currentPresentation ||
      currentPresentation['captureId'] !== presentPayload['captureId'] ||
      currentPresentation['presentationId'] !== presentPayload['presentationId']
    )
      return { ok: ![], reason: 'stale-presentation' };
    if (currentPresentation['presented']) return { ok: !![] };
    currentPresentation['presented'] = !![];
    if (!isWindowVisible()) {
      try {
        const frame = await captureWindow['webContents']['capturePage'](undefined, {
          stayHidden: !![],
          stayAwake: !![],
        });
        if (frame['isEmpty']()) throw new Error('empty-capture-frame');
      } catch (frameError) {
        if (presentation === currentPresentation) hideWindow();
        return (
          logDiagnosticEvent({
            type: 'global_capture.window_frame_failed',
            level: 'error',
            source: 'main',
            message: 'Global capture window frame unavailable',
            error: frameError,
          }),
          { ok: ![], reason: 'window-frame-failed' }
        );
      }
      if (presentation !== currentPresentation || !isWindowAlive())
        return { ok: ![], reason: 'stale-presentation' };
    }
    const revealWindow = () => {
      pendingShowTimer = null;
      if (presentation !== currentPresentation || !isWindowAlive()) return;
      if (!isWindowVisible()) {
        if (currentPresentation['phase'] === 'capturing') captureWindow['showInactive']?.();
        else captureWindow['show']?.();
      }
      currentPresentation['phase'] !== 'capturing' &&
        (focusWindow(captureWindow), scheduleFocusRetry(captureWindow, currentPresentation['captureId']));
    };
    if (currentPresentation['phase'] === 'capturing')
      pendingShowTimer = setTimeoutFn(revealWindow, pendingShowDelayMs);
    else revealWindow();
    return { ok: !![] };
  }
  function setExpanded(expandPayload = {}, expandSender = null) {
    if (!isTrustedSender(expandSender)) return { ok: ![], reason: 'untrusted-sender' };
    if (!presentation || presentation['captureId'] !== expandPayload?.['captureId'])
      return { ok: ![], reason: 'stale-capture' };
    if (presentation['pending'] || presentation['phase'] !== 'ready')
      return { ok: ![], reason: 'capture-not-ready' };
    const { bounds: baseBounds, workArea: expandWorkArea } = presentation,
      expanded = expandPayload?.['expanded'] === !![],
      expandedHeight = expanded
        ? Math['min'](EXPANDED_HEIGHT, Math['max'](0x1, expandWorkArea['height'] - 0x18))
        : baseBounds['height'],
      opensUp =
        expanded && baseBounds['y'] + expandedHeight > expandWorkArea['y'] + expandWorkArea['height'] - 0xc,
      nextBounds = {
        ...baseBounds,
        height: expandedHeight,
        y: opensUp
          ? Math['max'](expandWorkArea['y'] + 0xc, baseBounds['y'] + baseBounds['height'] - expandedHeight)
          : baseBounds['y'],
      };
    return (
      captureWindow['setBounds']?.(nextBounds),
      { ok: !![], expanded: expanded, opensUp: opensUp, bounds: nextBounds }
    );
  }
  async function chooseAction(actionPayload = {}, actionSender = null) {
    if (!isTrustedSender(actionSender)) return { ok: ![], reason: 'untrusted-sender' };
    const actionId = String(actionPayload?.['actionId'] || '')['trim'](),
      actionCaptureId = String(actionPayload?.['captureId'] || '')['trim']();
    if (!GLOBAL_CAPTURE_ACTION_IDS['includes'](actionId)) return { ok: ![], reason: 'invalid-action' };
    if (!presentation || presentation['captureId'] !== actionCaptureId)
      return { ok: ![], reason: 'stale-capture' };
    if (presentation['pending']) return { ok: ![], reason: 'action-in-flight' };
    if (presentation['phase'] !== 'ready' || !presentation['text'])
      return { ok: ![], reason: 'capture-not-ready' };
    const actionPresentation = presentation,
      shouldRunImmediately = AI_ACTION_IDS['has'](actionId)
        ? actionPayload?.['runImmediately'] === !![]
        : ![];
    if (AI_ACTION_IDS['has'](actionId) && actionPayload?.['rememberRunImmediately'] !== ![])
      runImmediately = shouldRunImmediately;
    ((activeActionId = actionId),
      clearFocusRetryTimer(),
      (actionPresentation['pending'] = !![]),
      (actionPresentation['dispatchAbort'] = new AbortController()));
    let result;
    try {
      const dispatchResult = await onAction(
        {
          eventId: 'global-capture-' + actionPresentation['captureId'] + '-' + ++dispatchSeq,
          actionId: actionId,
          text: actionPresentation['text'],
          runImmediately: shouldRunImmediately,
          source: 'globalCaptureWindow',
          createdAt: Date['now'](),
        },
        { signal: actionPresentation['dispatchAbort']['signal'] },
      );
      result =
        dispatchResult && typeof dispatchResult === 'object'
          ? dispatchResult
          : { ok: ![], reason: 'dispatch-failed' };
    } catch (dispatchError) {
      (logDiagnosticEvent({
        type: 'global_capture.action_dispatch_failed',
        level: 'error',
        source: 'main',
        message: 'Global capture action dispatch failed',
        error: dispatchError,
        context: { actionId: actionId },
      }),
        (result = { ok: ![], reason: 'dispatch-failed' }));
    }
    return (
      presentation === actionPresentation &&
        isWindowAlive() &&
        ((actionPresentation['pending'] = ![]),
        result['ok'] === ![] ? (captureWindow['show']?.(), focusWindow(captureWindow)) : hideWindow()),
      result
    );
  }
  function cancel(cancelPayload = {}, cancelSender = null) {
    if (!isTrustedSender(cancelSender)) return { ok: ![], reason: 'untrusted-sender' };
    const cancelCaptureId = String(cancelPayload?.['captureId'] || '')['trim']();
    if (cancelCaptureId && presentation?.['captureId'] !== cancelCaptureId)
      return { ok: ![], reason: 'stale-capture' };
    return (hideWindow(), { ok: !![] });
  }
  function destroy() {
    ((destroyed = !![]),
      clearFocusRetryTimer(),
      (windowReady = null),
      (prewarmPromise = null),
      clearPendingPresentation());
    if (!isWindowAlive()) return;
    captureWindow['destroy']?.();
  }
  return {
    cancel: cancel,
    chooseAction: chooseAction,
    destroy: destroy,
    didPresent: didPresent,
    hide: hideWindow,
    isTrustedSender: isTrustedSender,
    isVisible: isWindowVisible,
    prewarm: prewarmWindow,
    setExpanded: setExpanded,
    show: show,
  };
}
