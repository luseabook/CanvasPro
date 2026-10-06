import {
  controlChromeShellLaunchWindow,
  launchChromeShellWithLifecycle,
  normalizeChromeShellSpawnError,
  prepareChromeShellTaskbarIdentity,
} from './chromeShellLauncher.js';
import { launchChromeBrowserWorker } from './chromeBrowserWorker.js';
import { createChromeCdpPipeClient } from './chromeCdpPipeClient.js';
import { createChromeShellWebPreviewManager } from './chromeShellWebPreviewManager.js';
const BROWSER_NODE_MODE_ENV = 'AIC_CHROME_BROWSER_NODE_MODE',
  BROWSER_NODE_MODES = new Set(['eager', 'lazy', 'off']);
function resolveBrowserNodeMode(env = process.env) {
  const requestedMode = String(env?.[BROWSER_NODE_MODE_ENV] || '')
    .trim()
    .toLowerCase();
  return BROWSER_NODE_MODES.has(requestedMode) ? requestedMode : 'lazy';
}
function shouldKeepWebPreviewView(view = {}) {
  return (
    view?.visible === true ||
    view?.selected === true ||
    view?.fullscreen === true ||
    view?.pendingPopup === true
  );
}
function createDeferredWebPreviewRuntime({
  browserPath: browserPath,
  mainProfileDir: mainProfileDir,
  env: env,
  logEvent: logEvent,
  launchBrowserWorker: launchBrowserWorker,
  createCdpClient: createCdpClient,
  createWebPreviewManager: createWebPreviewManager,
  mode: mode,
} = {}) {
  let browserWorker = null,
    webPreviewManager = null,
    ensureRuntimePromise = null,
    disposed = false;
  const createIdleSyncResult = () => ({ ok: true, count: 0, visibleCount: 0 }),
    createDisabledResult = () => ({ ok: false, error: 'browser-node-disabled' });
  async function ensureRuntime() {
    if (disposed) return null;
    if (webPreviewManager) return webPreviewManager;
    if (mode === 'off') return null;
    if (ensureRuntimePromise) return ensureRuntimePromise;
    return (
      (ensureRuntimePromise = Promise.resolve()
        .then(() => {
          if (disposed) return null;
          const worker = launchBrowserWorker({
            browserPath: browserPath,
            mainProfileDir: mainProfileDir,
            env: env,
            onError: (error) =>
              logEvent?.({
                type: 'chrome_web_preview.worker_error',
                level: 'error',
                source: 'main',
                message: 'Chrome browser node worker failed',
                error: error,
              }),
          });
          browserWorker = worker;
          if (!worker?.devToolsPipe)
            return (
              logEvent?.({
                type: 'chrome_web_preview.pipe_unavailable',
                level: 'error',
                source: 'main',
                message: 'Chrome browser node pipe is unavailable',
              }),
              null
            );
          const client = createCdpClient({ ...worker.devToolsPipe, logEvent: logEvent });
          return (
            (webPreviewManager = createWebPreviewManager({ client: client, logEvent: logEvent })),
            webPreviewManager
          );
        })
        .finally(() => {
          ensureRuntimePromise = null;
        })),
      ensureRuntimePromise
    );
  }
  const facade = {
    async syncViews(payload = {}) {
      const views = Array.isArray(payload?.views) ? payload.views : [],
        keptViews = views.filter(shouldKeepWebPreviewView),
        nextPayload = { ...payload, views: keptViews };
      if (webPreviewManager) return webPreviewManager.syncViews(nextPayload);
      if (keptViews.length === 0) return createIdleSyncResult();
      const runtime = await ensureRuntime();
      if (!runtime)
        return mode === 'off' ? createDisabledResult() : { ok: false, error: 'browser-node-unavailable' };
      return runtime.syncViews(nextPayload);
    },
    async disposeViews(payload = {}) {
      if (!webPreviewManager) return { ok: true, disposed: 0 };
      return webPreviewManager.disposeViews(payload);
    },
    async controlView(payload = {}) {
      const runtime = await ensureRuntime();
      if (!runtime)
        return mode === 'off' ? createDisabledResult() : { ok: false, error: 'browser-node-unavailable' };
      return runtime.controlView(payload);
    },
    consumeEvents() {
      return webPreviewManager?.consumeEvents?.() || [];
    },
    waitForEvents(payload = {}) {
      if (webPreviewManager)
        return webPreviewManager.waitForEvents?.(payload) || webPreviewManager.consumeEvents?.() || [];
      if (disposed) return Promise.resolve([]);
      const requestedWaitMs = Number(payload?.waitMs),
        waitMs = Number.isFinite(requestedWaitMs)
          ? Math.max(50, Math.min(2500, requestedWaitMs))
          : 1000;
      return new Promise((resolve) => setTimeout(resolve, waitMs, []));
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      try {
        await ensureRuntimePromise;
      } catch {}
      (await webPreviewManager?.dispose?.(),
        (webPreviewManager = null),
        browserWorker?.dispose?.(),
        (browserWorker = null));
    },
    _getEntry(nodeId, tabId) {
      return webPreviewManager?._getEntry?.(nodeId, tabId) || null;
    },
  };
  return { facade: facade, ensureRuntime: ensureRuntime, getBrowserWorker: () => browserWorker };
}
export async function startChromeShellRuntime({
  app: app,
  appUrl: appUrl,
  env: env = process.env,
  platform: platform = process.platform,
  windowsTaskbarIdentity: windowsTaskbarIdentity = null,
  displayWorkAreas: displayWorkAreas = null,
  desktopHttpBridge: desktopHttpBridge = null,
  startHttpBridge: startHttpBridge,
  token: token,
  handlers: handlers,
  prepare: prepare = null,
  logEvent: logEvent = null,
  onClosed: onClosed = null,
  launchShell: launchShell = launchChromeShellWithLifecycle,
  launchBrowserWorker: launchBrowserWorker = launchChromeBrowserWorker,
  createCdpClient: createCdpClient = createChromeCdpPipeClient,
  createWebPreviewManager: createWebPreviewManager = createChromeShellWebPreviewManager,
  waitForRendererReady: waitForRendererReady = null,
  controlShellWindow: controlShellWindow = controlChromeShellLaunchWindow,
  closeShellLaunch: closeShellLaunch = null,
} = {}) {
  const taskbarIdentityPreparation =
    launchShell === launchChromeShellWithLifecycle && windowsTaskbarIdentity
      ? prepareChromeShellTaskbarIdentity({
          app: app,
          env: env,
          platform: platform,
          windowsTaskbarIdentity: windowsTaskbarIdentity,
          logEvent: logEvent,
        })
      : null;
  let bridge = desktopHttpBridge,
    ownsBridge = false;
  if (!bridge) {
    if (typeof startHttpBridge !== 'function')
      throw new TypeError('Chrome shell desktop bridge factory is required');
    ((bridge = await startHttpBridge({ token: token, handlers: handlers, logEvent: logEvent })),
      (ownsBridge = true),
      (env.AIC_DESKTOP_BRIDGE_URL = bridge.url),
      (env.AIC_DESKTOP_BRIDGE_TOKEN = bridge.token));
  }
  let webPreviewFacade = null,
    webPreviewRuntime = null,
    launch = null,
    rendererReadySettled = typeof waitForRendererReady !== 'function',
    detached = false,
    rejectRendererReady = null;
  const rendererReadyFailure = rendererReadySettled
    ? null
    : new Promise((resolve, reject) => {
        rejectRendererReady = reject;
      });
  void rendererReadyFailure?.catch(() => {});
  let stage = 'prepare';
  try {
    const prepared = await prepare?.(),
      resolvedAppUrl =
        typeof prepared?.appUrl === 'string' && prepared.appUrl.trim()
          ? prepared.appUrl
          : appUrl;
    ((stage = 'launch'),
      (launch = await launchShell({
        app: app,
        appUrl: resolvedAppUrl,
        env: env,
        platform: platform,
        windowsTaskbarIdentity: windowsTaskbarIdentity,
        windowsTaskbarIdentityPreparation: taskbarIdentityPreparation,
        displayWorkAreas: displayWorkAreas,
        logEvent: logEvent,
        onClosed: (closeContext) => {
          if (closeContext?.detached === true) {
            detached = true;
            if (launch) launch.detached = true;
            return false;
          }
          (void webPreviewFacade?.dispose?.(), (webPreviewFacade = null));
          if (!rendererReadySettled) {
            const startupError = new Error('Chrome shell exited before the renderer completed startup');
            return (
              (startupError.code =
                closeContext?.code === 0 && !closeContext?.signal
                  ? 'CHROME_SHELL_STARTUP_CANCELLED'
                  : 'CHROME_SHELL_EXITED_BEFORE_READY'),
              (startupError.details = closeContext),
              logEvent?.({
                type: 'chrome_shell.exited_before_renderer_ready',
                level: startupError.code === 'CHROME_SHELL_STARTUP_CANCELLED' ? 'info' : 'error',
                source: 'main',
                message: startupError.message,
                error: startupError,
                context: closeContext,
              }),
              rejectRendererReady?.(startupError),
              false
            );
          }
          return onClosed?.(closeContext);
        },
        onLaunchError: (launchError) => {
          const spawnError = normalizeChromeShellSpawnError(launchError);
          if (launch) launch.spawnError = spawnError;
          if (!rendererReadySettled) rejectRendererReady?.(spawnError);
          return false;
        },
      })));
    if (detached) launch.detached = true;
    if (launch?.spawnError) throw normalizeChromeShellSpawnError(launch.spawnError);
    if (typeof waitForRendererReady === 'function') {
      stage = 'renderer-ready';
      const readiness = await Promise.race([
        waitForRendererReady({ launch: launch }),
        rendererReadyFailure,
      ]);
      ((rendererReadySettled = true),
        logEvent?.({
          type: 'chrome_shell.renderer_ready',
          level: 'info',
          source: 'main',
          message: 'Chrome shell renderer completed startup',
          context: {
            browserPath: launch.browserPath,
            profileDir: launch.profileDir,
            elapsedMs: Number(readiness?.elapsedMs || 0),
          },
        }));
    }
    (launch?.startupDiagnostics?.stop?.(), (stage = 'browser-node'));
    const browserNodeMode = resolveBrowserNodeMode(env);
    return (
      (webPreviewRuntime = createDeferredWebPreviewRuntime({
        browserPath: launch.browserPath,
        mainProfileDir: launch.profileDir,
        env: env,
        logEvent: logEvent,
        launchBrowserWorker: launchBrowserWorker,
        createCdpClient: createCdpClient,
        createWebPreviewManager: createWebPreviewManager,
        mode: browserNodeMode,
      })),
      (webPreviewFacade = webPreviewRuntime.facade),
      browserNodeMode === 'eager' && (await webPreviewRuntime.ensureRuntime()),
      {
        chromeShellLaunch: launch,
        browserWorker: webPreviewRuntime.getBrowserWorker(),
        desktopHttpBridge: bridge,
        webPreviewManager: webPreviewFacade,
      }
    );
  } catch (startupError) {
    const cancelled = startupError?.code === 'AIC_DESKTOP_STARTUP_CANCELLED';
    (logEvent?.({
      type: cancelled ? 'chrome_shell.startup_cancelled' : 'chrome_shell.startup_failed',
      level: cancelled ? 'info' : 'error',
      source: 'main',
      message: cancelled
        ? 'Chrome shell startup cancelled during shutdown'
        : 'Chrome shell startup failed before cleanup',
      error: startupError,
      context: {
        stage: stage,
        pid: launch?.process?.pid ?? null,
        exitCode: launch?.process?.exitCode ?? null,
        signalCode: launch?.process?.signalCode ?? null,
        detached: launch?.detached === true,
        browserPath: launch?.browserPath || '',
        profileDir: launch?.profileDir || '',
        ...launch?.startupDiagnostics?.snapshot?.(),
      },
    }),
      launch?.startupDiagnostics?.stop?.(),
      (await taskbarIdentityPreparation)?.cancel?.(),
      await webPreviewFacade?.dispose?.());
    let launchClosed = false;
    if (launch && typeof closeShellLaunch === 'function') {
      try {
        launchClosed = await closeShellLaunch({ launch: launch, env: env, platform: platform });
      } catch {}
      logEvent?.({
        type: 'chrome_shell.launch_close_after_startup_failure',
        level: launchClosed ? 'info' : 'warn',
        source: 'main',
        message: launchClosed
          ? 'Chrome shell close completed; profile release is not confirmed'
          : 'Chrome shell process tree could not be confirmed closed after startup failure',
        context: { closed: launchClosed },
      });
    }
    if (!launchClosed && launch?.detached === true) {
      let windowClosed = false;
      try {
        windowClosed = await controlShellWindow({
          launch: launch,
          action: 'close',
          env: env,
          platform: platform,
        });
      } catch {}
      logEvent?.({
        type: 'chrome_shell.detached_window_close_after_startup_failure',
        level: windowClosed ? 'info' : 'warn',
        source: 'main',
        message: windowClosed
          ? 'Detached Chrome shell window closed after startup failure'
          : 'Detached Chrome shell window could not be closed after startup failure',
        context: { closed: windowClosed },
      });
    } else !launchClosed && launch?.process?.kill?.();
    if (ownsBridge)
      try {
        await bridge?.close?.();
      } catch {}
    throw startupError;
  }
}
export const __chromeShellRuntimeForTest = {
  BROWSER_NODE_MODE_ENV: BROWSER_NODE_MODE_ENV,
  resolveBrowserNodeMode: resolveBrowserNodeMode,
  shouldKeepWebPreviewView: shouldKeepWebPreviewView,
};
