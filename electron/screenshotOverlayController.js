import { BrowserWindow, clipboard, desktopCapturer, globalShortcut, nativeImage, screen } from 'electron';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  parseScreenshotShortcutPayload,
} from './screenshotShortcutAccelerators.js';
import { createBoundedCaptureEventQueue } from './screenshotCaptureEventQueue.js';

const DEFAULT_SCREENSHOT_ACCELERATOR = 'Alt+Q',
  CAPTURE_EVENT_LIMIT = 8;

function clampNumber(value, minimum, maximum) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return minimum;
  return Math.min(maximum, Math.max(minimum, numeric));
}

export function createScreenshotOverlayController({
  appRoot: appRoot,
  dirname: dirname,
  accelerator: accelerator,
  getMainWindow: getMainWindow,
  focusCanvas: focusCanvas = () => {},
  logDiagnosticEvent: logDiagnosticEvent,
  globalShortcutApi: globalShortcutApi = globalShortcut,
}) {
  const initialShortcut = parseScreenshotShortcutPayload({
      accelerator: accelerator || DEFAULT_SCREENSHOT_ACCELERATOR,
    }),
    initialAccelerator = initialShortcut.ok ? initialShortcut.accelerator : DEFAULT_SCREENSHOT_ACCELERATOR;
  let overlayWindow = null,
    overlayLoadPromise = null,
    nativeHelper = null,
    nativeHelperBuffer = '',
    shortcutRegistered = false,
    registeredAccelerator = '',
    prewarmPromise = null,
    currentAccelerator = initialAccelerator,
    shortcutStatus = {
      ok: false,
      registered: false,
      accelerator: currentAccelerator,
      reason: 'not-registered',
    };
  const captureEvents = createBoundedCaptureEventQueue(CAPTURE_EVENT_LIMIT);

  async function captureDesktopDisplay() {
    const cursorPoint = screen.getCursorScreenPoint(),
      display = screen.getDisplayNearestPoint(cursorPoint),
      scaleFactor = Number(display?.scaleFactor || 1) || 1,
      bounds = display?.bounds || { x: 0, y: 0, width: 0, height: 0 },
      thumbnailSize = {
        width: Math.max(1, Math.round(Number(bounds.width || 1) * scaleFactor)),
        height: Math.max(1, Math.round(Number(bounds.height || 1) * scaleFactor)),
      },
      sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: thumbnailSize }),
      source = sources.find((entry) => String(entry.display_id || '') === String(display.id)) || sources[0],
      thumbnail = source?.thumbnail;
    if (!thumbnail || thumbnail.isEmpty()) return { ok: false, reason: 'no-image' };
    return {
      ok: true,
      mimeType: 'image/png',
      dataUrl: thumbnail.toDataURL(),
      display: {
        id: String(display.id),
        scaleFactor: scaleFactor,
        bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        imageSize: thumbnail.getSize(),
      },
      cursor: {
        screenX: Math.round(cursorPoint.x),
        screenY: Math.round(cursorPoint.y),
        x: Math.round(clampNumber(cursorPoint.x - bounds.x, 0, Math.max(0, bounds.width))),
        y: Math.round(clampNumber(cursorPoint.y - bounds.y, 0, Math.max(0, bounds.height))),
      },
    };
  }
  function sendGlobalScreenshotShortcutStatus(status = shortcutStatus) {
    const mainWindow = getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send('screenshot:globalShortcutStatus', {
      accelerator: currentAccelerator,
      ...status,
    });
  }
  function setShortcutStatus(patch = {}) {
    shortcutStatus = {
      accelerator: currentAccelerator,
      ...shortcutStatus,
      ...patch,
      accelerator: currentAccelerator,
    };
    sendGlobalScreenshotShortcutStatus();
  }
  function resetOverlayWindow() {
    if (!overlayWindow || overlayWindow.isDestroyed()) return;
    (void overlayWindow.webContents.executeJavaScript('window.__resetScreenshotOverlay?.()'),
      overlayWindow.setOpacity(1),
      overlayWindow.setAlwaysOnTop(false),
      overlayWindow.hide());
  }
  function destroyScreenshotOverlayWindow() {
    overlayLoadPromise = null;
    if (!overlayWindow || overlayWindow.isDestroyed()) return;
    overlayWindow.destroy();
  }
  function resolveOverlayBounds(payload = {}) {
    const bounds = payload?.display?.bounds;
    if (bounds && bounds.width > 0 && bounds.height > 0)
      return {
        x: Math.round(bounds.x),
        y: Math.round(bounds.y),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
      };
    const fallback = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())?.bounds;
    return fallback || { x: 0, y: 0, width: 0x500, height: 0x2d0 };
  }
  function offscreenBounds() {
    return { x: -0x7d00, y: -0x7d00, width: 1, height: 1 };
  }
  async function ensureOverlayWindow(payload = null) {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      if (overlayLoadPromise) await overlayLoadPromise;
      return overlayWindow;
    }
    const bounds = payload ? resolveOverlayBounds(payload) : offscreenBounds();
    return (
      (overlayWindow = new BrowserWindow({
        ...bounds,
        title: 'Screenshot Overlay',
        show: false,
        frame: false,
        transparent: true,
        paintWhenInitiallyHidden: true,
        fullscreen: false,
        fullscreenable: false,
        alwaysOnTop: false,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        backgroundColor: '#00000000',
        webPreferences: {
          preload: path.join(dirname, 'screenshotOverlayPreload.cjs'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      })),
      overlayWindow.on('closed', () => {
        ((overlayWindow = null), (overlayLoadPromise = null));
      }),
      (overlayLoadPromise = overlayWindow.loadFile(path.join(dirname, 'screenshotOverlay.html')).catch((error) => {
        overlayLoadPromise = null;
        throw error;
      })),
      await overlayLoadPromise,
      overlayWindow
    );
  }
  function prewarmOverlayWindow() {
    if (prewarmPromise) return prewarmPromise;
    return (
      (prewarmPromise = ensureOverlayWindow()
        .catch((error) => {
          logDiagnosticEvent({
            type: 'screenshot.global_overlay_prewarm_failed',
            level: 'warn',
            source: 'main',
            message: 'Global screenshot overlay prewarm failed',
            error: error,
          });
        })
        .finally(() => {
          prewarmPromise = null;
        })),
      prewarmPromise
    );
  }
  async function prepareOverlayWindow(targetBounds) {
    const window = await ensureOverlayWindow();
    if (!window || window.isDestroyed()) return false;
    return (
      window.setOpacity(1),
      window.setBounds(targetBounds || resolveOverlayBounds()),
      await window.webContents.executeJavaScript(
        'window.__prepareScreenshotOverlay ? window.__prepareScreenshotOverlay() : window.__resetScreenshotOverlay?.()',
      ),
      window.setAlwaysOnTop(true, 'screen-saver'),
      window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }),
      window.show(),
      window.focus(),
      true
    );
  }
  async function startOverlaySelection(capture) {
    if (!overlayWindow || overlayWindow.isDestroyed()) return false;
    const started = await overlayWindow.webContents.executeJavaScript(
      'window.__startScreenshotOverlay(' + JSON.stringify(capture) + ')',
    );
    return started ? true : false;
  }
  async function startGlobalCapture() {
    if (overlayWindow && !overlayWindow.isDestroyed() && overlayWindow.isVisible()) {
      (overlayWindow.show(), overlayWindow.focus());
      return;
    }
    try {
      const targetBounds = resolveOverlayBounds(),
        prepared = await prepareOverlayWindow(targetBounds);
      if (!prepared) {
        setShortcutStatus({ ok: false, registered: shortcutStatus.registered === true, reason: 'overlay-start-failed' });
        return;
      }
      const capture = await captureDesktopDisplay();
      if (!capture?.ok) {
        (resetOverlayWindow(),
          setShortcutStatus({
            ok: false,
            registered: shortcutStatus.registered === true,
            reason: capture?.reason || 'capture-failed',
          }),
          logDiagnosticEvent({
            type: 'screenshot.global_capture_failed',
            level: 'warn',
            source: 'main',
            message: 'Global screenshot capture failed',
            context: capture || {},
          }));
        return;
      }
      const started = await startOverlaySelection(capture);
      !started &&
        (resetOverlayWindow(),
        setShortcutStatus({ ok: false, registered: shortcutStatus.registered === true, reason: 'overlay-start-failed' }),
        logDiagnosticEvent({
          type: 'screenshot.global_overlay_start_failed',
          level: 'warn',
          source: 'main',
          message: 'Global screenshot overlay failed to start',
          context: { display: capture.display, cursor: capture.cursor },
        }));
    } catch (error) {
      (resetOverlayWindow(),
        setShortcutStatus({
          ok: false,
          registered: shortcutStatus.registered === true,
          reason: 'capture-failed',
          error: String(error?.message || error),
        }),
        logDiagnosticEvent({
          type: 'screenshot.global_overlay_failed',
          level: 'error',
          source: 'main',
          message: 'Global screenshot overlay failed',
          error: error,
        }));
    }
  }
  function unregisterGlobalShortcut() {
    if (!shortcutRegistered && !registeredAccelerator) return;
    try {
      globalShortcutApi.unregister(registeredAccelerator || currentAccelerator);
    } catch {}
    ((shortcutRegistered = false), (registeredAccelerator = ''));
  }
  function registerGlobalShortcut() {
    if (shortcutRegistered && registeredAccelerator === currentAccelerator) return;
    unregisterGlobalShortcut();
    let registered = false;
    try {
      registered = globalShortcutApi.register(currentAccelerator, () => {
        void startGlobalCapture();
      });
    } catch (error) {
      logDiagnosticEvent({
        type: 'screenshot.global_shortcut_register_failed',
        level: 'error',
        source: 'main',
        message: 'Global screenshot shortcut registration threw',
        error: error,
      });
    }
    ((shortcutRegistered = registered),
      (registeredAccelerator = registered ? currentAccelerator : ''),
      setShortcutStatus({
        ok: registered,
        registered: registered,
        reason: registered ? 'registered' : 'registration-failed',
      }));
    if (registered) void prewarmOverlayWindow();
    logDiagnosticEvent({
      type: registered
        ? 'screenshot.global_shortcut_registered'
        : 'screenshot.global_shortcut_register_failed',
      level: registered ? 'info' : 'warn',
      source: 'main',
      message: registered
        ? 'Global screenshot shortcut registered'
        : 'Global screenshot shortcut registration failed',
      context: { accelerator: currentAccelerator },
    });
  }
  function installGlobalScreenshotShortcut() {
    if (startNativeHelper()) {
      setShortcutStatus({ ok: false, registered: false, reason: 'native-helper-starting' });
      return;
    }
    registerGlobalShortcut();
  }
  function uninstallGlobalScreenshotShortcut() {
    (stopNativeHelper(), unregisterGlobalShortcut());
  }
  function configureGlobalScreenshotShortcut(payload = {}) {
    const parsed = parseScreenshotShortcutPayload(payload);
    if (!parsed.ok)
      return (
        setShortcutStatus({
          ok: false,
          registered: shortcutStatus.registered === true,
          reason: parsed.reason || 'invalid-shortcut',
        }),
        {
          ok: false,
          registered: shortcutStatus.registered === true,
          accelerator: currentAccelerator,
          reason: parsed.reason || 'invalid-shortcut',
        }
      );
    if (parsed.accelerator === currentAccelerator) {
      sendGlobalScreenshotShortcutStatus();
      return { ...shortcutStatus, ok: shortcutStatus.ok === true, accelerator: currentAccelerator };
    }
    return (
      uninstallGlobalScreenshotShortcut(),
      (currentAccelerator = parsed.accelerator),
      (shortcutStatus = { ok: false, registered: false, accelerator: currentAccelerator, reason: 'not-registered' }),
      installGlobalScreenshotShortcut(),
      { ...shortcutStatus, accelerator: currentAccelerator }
    );
  }
  function getGlobalScreenshotShortcutStatus() {
    return { ...shortcutStatus, accelerator: currentAccelerator };
  }
  function consumeGlobalScreenshotCaptureEvents() {
    return captureEvents.consume();
  }
  async function handleScreenshotOverlayConfirm(payload = {}) {
    const pngBase64 = String(payload?.pngBase64 || '').trim();
    if (!pngBase64) return { ok: false, reason: 'empty-payload' };
    return (
      resetOverlayWindow(),
      deliverCaptureResult({
        pngBase64: pngBase64,
        mimeType: String(payload?.mimeType || 'image/png') || 'image/png',
        source: 'globalShortcut',
        actionId: payload?.actionId,
        runImmediately: payload?.runImmediately,
      }),
      { ok: true }
    );
  }
  async function handleScreenshotOverlayCancel() {
    return (resetOverlayWindow(), { ok: true });
  }
  function resolveNativeHelperPath() {
    return path.join(appRoot, 'native', 'screenshot-helper', 'bin', 'screenshot-helper.exe');
  }
  function resolveCursorDir() {
    return path.join(appRoot, 'images', 'cursors', 'windows11-concept-v2', 'light');
  }
  function deliverCaptureResult(payload = {}) {
    const pngBase64 = String(payload?.pngBase64 || '').trim();
    if (!pngBase64) return false;
    if (payload?.actionId !== 'reverse-prompt')
      try {
        const image = nativeImage.createFromDataURL('data:image/png;base64,' + pngBase64);
        if (image.isEmpty()) throw new Error('empty-screenshot-image');
        clipboard.writeImage(image);
      } catch (error) {
        logDiagnosticEvent({
          type: 'screenshot.clipboard_write_failed',
          level: 'warn',
          source: 'main',
          message: 'Failed to copy screenshot to clipboard',
          error: error,
        });
      }
    const event = {
      pngBase64: pngBase64,
      mimeType: String(payload?.mimeType || 'image/png') || 'image/png',
      source: payload?.source || 'nativeHelper',
      createdAt: Date.now(),
    };
    payload?.actionId === 'reverse-prompt' &&
      ((event.actionId = 'reverse-prompt'),
      (event.runImmediately = payload?.runImmediately === true),
      Promise.resolve()
        .then(() => focusCanvas())
        .catch(() => {}));
    captureEvents.push(event);
    const mainWindow = getMainWindow();
    return (
      mainWindow &&
        !mainWindow.isDestroyed() &&
        !mainWindow.webContents.isDestroyed() &&
        mainWindow.webContents.send('screenshot:globalCaptureReady', event),
      true
    );
  }
  function handleNativeHelperMessage(message) {
    const raw = String(message || '').trim();
    if (!raw) return;
    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      logDiagnosticEvent({
        type: 'screenshot.native_helper_bad_message',
        level: 'warn',
        source: 'main',
        message: 'Native screenshot helper sent an invalid message',
        context: { raw: raw.slice(0, 160) },
        error: error,
      });
      return;
    }
    if (payload?.type === 'status') {
      const registered = payload.registered === true;
      setShortcutStatus({
        ok: registered,
        registered: registered,
        reason: registered ? 'registered-native' : 'native-registration-failed',
      });
      !registered && (stopNativeHelper(), registerGlobalShortcut());
      return;
    }
    payload?.type === 'capture' &&
      deliverCaptureResult({
        pngBase64: payload.pngBase64,
        mimeType: payload.mimeType || 'image/png',
        source: 'nativeHelper',
        actionId: payload.actionId,
        runImmediately: payload.runImmediately,
      });
  }
  function startNativeHelper() {
    if (process.platform !== 'win32') return false;
    if (nativeHelper && !nativeHelper.killed) return true;
    const helperPath = resolveNativeHelperPath();
    if (!existsSync(helperPath))
      return (
        logDiagnosticEvent({
          type: 'screenshot.native_helper_missing',
          level: 'warn',
          source: 'main',
          message: 'Native screenshot helper executable is missing',
          context: { helperPath: helperPath },
        }),
        false
      );
    try {
      ((nativeHelperBuffer = ''),
        (nativeHelper = spawn(helperPath, [], {
          env: {
            ...process.env,
            AICANVAS_CURSOR_DIR: resolveCursorDir(),
            AICANVAS_THEME_TOKENS_PATH: path.join(appRoot, 'styles', 'variables.css'),
            AICANVAS_SCREENSHOT_ACCELERATOR: currentAccelerator,
          },
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        })));
    } catch (error) {
      return (
        logDiagnosticEvent({
          type: 'screenshot.native_helper_start_failed',
          level: 'error',
          source: 'main',
          message: 'Native screenshot helper failed to start',
          error: error,
          context: { helperPath: helperPath },
        }),
        (nativeHelper = null),
        false
      );
    }
    return (
      nativeHelper.stdout?.setEncoding('utf8'),
      nativeHelper.stdout?.on('data', (chunk) => {
        nativeHelperBuffer += String(chunk || '');
        let newlineIndex = nativeHelperBuffer.indexOf('\n');
        while (newlineIndex >= 0) {
          const line = nativeHelperBuffer.slice(0, newlineIndex);
          ((nativeHelperBuffer = nativeHelperBuffer.slice(newlineIndex + 1)),
            handleNativeHelperMessage(line),
            (newlineIndex = nativeHelperBuffer.indexOf('\n')));
        }
      }),
      nativeHelper.stderr?.setEncoding('utf8'),
      nativeHelper.stderr?.on('data', (chunk) => {
        logDiagnosticEvent({
          type: 'screenshot.native_helper_stderr',
          level: 'warn',
          source: 'main',
          message: 'Native screenshot helper stderr',
          context: { text: String(chunk || '').slice(0, 0x3e8) },
        });
      }),
      nativeHelper.on('exit', (code, signal) => {
        ((nativeHelper = null),
          (nativeHelperBuffer = ''),
          setShortcutStatus({ ok: false, registered: false, reason: 'native-helper-exited' }),
          logDiagnosticEvent({
            type: 'screenshot.native_helper_exited',
            level: code === 0 ? 'info' : 'warn',
            source: 'main',
            message: 'Native screenshot helper exited',
            context: { code: code, signal: signal },
          }));
      }),
      nativeHelper.on('error', (error) => {
        ((nativeHelper = null),
          setShortcutStatus({
            ok: false,
            registered: false,
            reason: 'native-helper-error',
            error: String(error?.message || error),
          }));
      }),
      true
    );
  }
  function stopNativeHelper() {
    if (!nativeHelper || nativeHelper.killed) return;
    try {
      nativeHelper.kill();
    } catch {
    } finally {
      ((nativeHelper = null), (nativeHelperBuffer = ''));
    }
  }
  return {
    captureDesktopDisplay: captureDesktopDisplay,
    configureGlobalScreenshotShortcut: configureGlobalScreenshotShortcut,
    consumeGlobalScreenshotCaptureEvents: consumeGlobalScreenshotCaptureEvents,
    destroyScreenshotOverlayWindow: destroyScreenshotOverlayWindow,
    getGlobalScreenshotShortcutStatus: getGlobalScreenshotShortcutStatus,
    handleScreenshotOverlayCancel: handleScreenshotOverlayCancel,
    handleScreenshotOverlayConfirm: handleScreenshotOverlayConfirm,
    installGlobalScreenshotShortcut: installGlobalScreenshotShortcut,
    sendGlobalScreenshotShortcutStatus: sendGlobalScreenshotShortcutStatus,
    uninstallGlobalScreenshotShortcut: uninstallGlobalScreenshotShortcut,
  };
}
