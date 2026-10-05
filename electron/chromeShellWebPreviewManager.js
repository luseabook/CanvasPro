const MAX_EVENT_QUEUE_SIZE = 160,
  MIN_VIEWPORT_WIDTH = 320,
  MIN_VIEWPORT_HEIGHT = 180,
  MAX_VIEWPORT_WIDTH = 1920,
  MAX_VIEWPORT_HEIGHT = 1200,
  SNAPSHOT_QUALITY = 72,
  SCREENCAST_QUALITY = 58,
  SCREENCAST_MAX_WIDTH = 1280,
  SCREENCAST_MAX_HEIGHT = 800,
  SCREENCAST_MIN_FRAME_INTERVAL_MS = 24,
  EVENT_WAIT_MIN_MS = 50,
  EVENT_WAIT_MAX_MS = 5000;
function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number['isFinite'](numeric)) return fallback;
  return Math['max'](min, Math['min'](max, Math['round'](numeric)));
}
function normalizeNodeId(nodeId) {
  return String(nodeId || '')['trim']();
}
function normalizeTabId(tabId) {
  return String(tabId || '')['trim']() || 'default';
}
function normalizeHttpUrl(value) {
  try {
    const parsed = new URL(String(value || '')['trim']());
    if (parsed['protocol'] !== 'http:' && parsed['protocol'] !== 'https:') return '';
    return parsed['href'];
  } catch {
    return '';
  }
}
function toEntryKey(nodeId, tabId) {
  return normalizeNodeId(nodeId) + '\x00' + normalizeTabId(tabId);
}
function normalizeViewport(viewport = {}) {
  const zoomFactor = Math['max'](0.05, Number(viewport?.['zoomFactor']) || 1),
    bounds = viewport?.['bounds'] && typeof viewport['bounds'] === 'object' ? viewport['bounds'] : {},
    visualWidth = clampNumber(bounds['width'], 1, MAX_VIEWPORT_WIDTH, 960),
    visualHeight = clampNumber(bounds['height'], 1, MAX_VIEWPORT_HEIGHT, 600);
  return {
    width: clampNumber(visualWidth / zoomFactor, MIN_VIEWPORT_WIDTH, MAX_VIEWPORT_WIDTH, 960),
    height: clampNumber(visualHeight / zoomFactor, MIN_VIEWPORT_HEIGHT, MAX_VIEWPORT_HEIGHT, 600),
    visualWidth: visualWidth,
    visualHeight: visualHeight,
    zoomFactor: zoomFactor,
  };
}
function createReferenceSnapshotExpression() {
  return '(() => ({\n    pageUrl: String(location.href || ""),\n    pageTitle: String(document.title || ""),\n    selectedText: String(globalThis.getSelection?.()?.toString?.() || "").slice(0, 5000),\n  }))()';
}
function normalizeInputModifiers(input = {}) {
  return (
    (input['altKey'] ? 1 : 0) |
    (input['ctrlKey'] ? 2 : 0) |
    (input['metaKey'] ? 4 : 0) |
    (input['shiftKey'] ? 8 : 0)
  );
}
function normalizeMouseButton(button) {
  if (button === 0 || button === 'left') return 'left';
  if (button === 1 || button === 'middle') return 'middle';
  if (button === 2 || button === 'right') return 'right';
  if (button === 3 || button === 'back') return 'back';
  if (button === 4 || button === 'forward') return 'forward';
  return 'none';
}
export function createChromeShellWebPreviewManager({
  client: client,
  logEvent: logEvent = null,
  now: now = () => Date['now'](),
  setTimeoutFn: setTimeoutFn = setTimeout,
  clearTimeoutFn: clearTimeoutFn = clearTimeout,
} = {}) {
  if (!client || typeof client['send'] !== 'function') throw new TypeError('Chrome CDP client is required');
  const entries = new Map(),
    sessionEntries = new Map(),
    eventQueue = [],
    waiters = new Set();
  let eventSequence = 0,
    disposed = ![];
  function drainEvents() {
    return eventQueue['splice'](0, eventQueue['length']);
  }
  function settleWaiters() {
    if (eventQueue['length'] === 0 || waiters['size'] === 0) return;
    const waiter = waiters['values']()['next']()['value'];
    waiters['delete'](waiter);
    if (waiter['timer']) clearTimeoutFn(waiter['timer']);
    waiter['resolve'](drainEvents());
  }
  function pushEvent(nodeId, payload = {}, tabId = '') {
    const id = normalizeNodeId(nodeId),
      tab = normalizeTabId(tabId);
    if (payload?.['type'] === 'snapshot')
      for (let index = eventQueue['length'] - 1; index >= 0; index -= 1) {
        const queued = eventQueue[index];
        queued?.['type'] === 'snapshot' &&
          queued['nodeId'] === id &&
          queued['tabId'] === tab &&
          eventQueue['splice'](index, 1);
      }
    eventQueue['push']({
      nodeId: id,
      tabId: tab,
      ...payload,
      sequence: ++eventSequence,
      createdAt: now(),
    });
    while (eventQueue['length'] > MAX_EVENT_QUEUE_SIZE) eventQueue['shift']();
    settleWaiters();
  }
  function logFailure(type, message, error, entry = null) {
    logEvent?.({
      type: type,
      level: 'warn',
      source: 'main',
      message: message,
      error: error,
      context: entry
        ? {
            nodeId: entry['nodeId'],
            tabId: entry['tabId'],
            url: entry['url'] || entry['requestedUrl'] || '',
          }
        : {},
    });
  }
  async function createTarget() {
    return client['send']('Target.createTarget', { url: 'about:blank', background: !![], focus: ![] });
  }
  async function applyViewport(entry, viewport) {
    if (!entry?.['sessionId']) return ![];
    const sizeChanged =
      entry['viewportWidth'] !== viewport['width'] || entry['viewportHeight'] !== viewport['height'];
    ((entry['visualWidth'] = viewport['visualWidth']),
      (entry['visualHeight'] = viewport['visualHeight']),
      (entry['zoomFactor'] = viewport['zoomFactor']));
    if (!sizeChanged) return ![];
    return (
      (entry['viewportWidth'] = viewport['width']),
      (entry['viewportHeight'] = viewport['height']),
      await client['send'](
        'Emulation.setDeviceMetricsOverride',
        { width: viewport['width'], height: viewport['height'], deviceScaleFactor: 1, mobile: ![] },
        entry['sessionId'],
      ),
      !![]
    );
  }
  async function readNavigationState(entry) {
    if (!entry?.['sessionId']) return { canGoBack: ![], canGoForward: ![] };
    try {
      const history = await client['send']('Page.getNavigationHistory', {}, entry['sessionId']),
        entries = Array['isArray'](history?.['entries']) ? history['entries'] : [],
        currentIndex = Math['max'](0, Number(history?.['currentIndex']) || 0);
      return { canGoBack: currentIndex > 0, canGoForward: currentIndex < entries['length'] - 1 };
    } catch {
      return { canGoBack: ![], canGoForward: ![] };
    }
  }
  async function emitNavigationState(entry) {
    const state = await readNavigationState(entry);
    if (entry['disposing'] || entries['get'](entry['key']) !== entry) return state;
    return (pushEvent(entry['nodeId'], { type: 'navigation-state', ...state }, entry['tabId']), state);
  }
  async function captureSnapshot(entry) {
    if (
      disposed ||
      entry?.['disposing'] ||
      !entry?.['sessionId'] ||
      entry['active'] !== !![] ||
      entry['screencastActive'] ||
      entry['capturePending']
    ) {
      if (entry?.['capturePending']) entry['captureQueued'] = !![];
      return ![];
    }
    entry['capturePending'] = !![];
    try {
      let screenshot,
        mimeType = 'image/webp';
      try {
        screenshot = await client['send'](
          'Page.captureScreenshot',
          { format: 'webp', quality: SNAPSHOT_QUALITY, fromSurface: !![], optimizeForSpeed: !![] },
          entry['sessionId'],
        );
      } catch {
        ((mimeType = 'image/jpeg'),
          (screenshot = await client['send'](
            'Page.captureScreenshot',
            { format: 'jpeg', quality: SNAPSHOT_QUALITY, fromSurface: !![], optimizeForSpeed: !![] },
            entry['sessionId'],
          )));
      }
      const data = String(screenshot?.['data'] || '')['trim']();
      if (!data || entry['disposing'] || entry['screencastActive'] || entries['get'](entry['key']) !== entry)
        return ![];
      return (
        pushEvent(
          entry['nodeId'],
          {
            type: 'snapshot',
            surfaceMode: 'remote-snapshot',
            dataUrl: 'data:' + mimeType + ';base64,' + data,
            freezeToken: 'ready',
            width: entry['visualWidth'] || entry['viewportWidth'] || 0,
            height: entry['visualHeight'] || entry['viewportHeight'] || 0,
            zoomFactor: entry['zoomFactor'] || 1,
          },
          entry['tabId'],
        ),
        !![]
      );
    } catch (error) {
      return (
        logFailure(
          'chrome_web_preview.snapshot_failed',
          'Chrome browser node snapshot failed',
          error,
          entry,
        ),
        ![]
      );
    } finally {
      ((entry['capturePending'] = ![]),
        entry['captureQueued'] && ((entry['captureQueued'] = ![]), void captureSnapshot(entry)));
    }
  }
  function scheduleSnapshot(entry, delayMs = 90) {
    if (!entry || entry['disposing']) return;
    if (entry['screencastActive']) return;
    if (entry['inputCaptureTimer']) clearTimeoutFn(entry['inputCaptureTimer']);
    entry['inputCaptureTimer'] = setTimeoutFn(
      () => {
        ((entry['inputCaptureTimer'] = null), void captureSnapshot(entry));
      },
      Math['max'](0, Number(delayMs) || 0),
    );
  }
  function shouldStream(entry) {
    return Boolean(
      entry &&
      !entry['disposing'] &&
      !entry['screencastUnavailable'] &&
      entry['active'] === !![] &&
      entry['visible'] === !![] &&
      entry['selected'] === !![],
    );
  }
  function buildScreencastParams(entry) {
    return {
      format: 'jpeg',
      quality: SCREENCAST_QUALITY,
      maxWidth: Math['min'](SCREENCAST_MAX_WIDTH, Math['max'](1, entry['viewportWidth'] || 1)),
      maxHeight: Math['min'](SCREENCAST_MAX_HEIGHT, Math['max'](1, entry['viewportHeight'] || 1)),
      everyNthFrame: 1,
    };
  }
  async function reconcileScreencast(entry, { restart: restart = ![] } = {}) {
    if (!entry || entry['disposing'] || !entry['sessionId']) return ![];
    entry['screencastDesired'] = shouldStream(entry);
    if (restart && entry['screencastActive']) entry['screencastRestartRequested'] = !![];
    if (entry['screencastReconcilePromise']) return entry['screencastReconcilePromise'];
    return (
      (entry['screencastReconcilePromise'] = (async () => {
        while (!entry['disposing']) {
          const desired = shouldStream(entry),
            shouldStop = entry['screencastActive'] && (!desired || entry['screencastRestartRequested']);
          if (shouldStop) {
            entry['screencastRestartRequested'] = ![];
            if (entry['screencastFrameTimer']) clearTimeoutFn(entry['screencastFrameTimer']);
            ((entry['screencastFrameTimer'] = null), (entry['pendingScreencastFrame'] = null));
            try {
              await client['send']('Page.stopScreencast', {}, entry['sessionId']);
            } catch (error) {
              logFailure(
                'chrome_web_preview.screencast_stop_failed',
                'Chrome browser node live stream stop failed',
                error,
                entry,
              );
            }
            entry['screencastActive'] = ![];
            continue;
          }
          if (desired && !entry['screencastActive']) {
            try {
              (await client['send']('Target.activateTarget', { targetId: entry['targetId'] }),
                await client['send'](
                  'Page.startScreencast',
                  buildScreencastParams(entry),
                  entry['sessionId'],
                ),
                (entry['screencastActive'] = !![]),
                (entry['lastScreencastEmitAt'] = 0));
            } catch (error) {
              ((entry['screencastUnavailable'] = !![]),
                (entry['screencastDesired'] = ![]),
                logFailure(
                  'chrome_web_preview.screencast_start_failed',
                  'Chrome browser node live stream start failed; using snapshots',
                  error,
                  entry,
                ));
            }
            continue;
          }
          break;
        }
        return entry['screencastActive'];
      })()['finally'](() => {
        entry['screencastReconcilePromise'] = null;
      })),
      entry['screencastReconcilePromise']
    );
  }
  function emitScreencastFrame(entry, data) {
    if (!data || !entry?.['screencastActive'] || !entry['active'] || !entry['visible'] || entry['disposing'])
      return ![];
    return (
      (entry['lastScreencastEmitAt'] = now()),
      pushEvent(
        entry['nodeId'],
        {
          type: 'snapshot',
          surfaceMode: 'remote-snapshot',
          streaming: !![],
          dataUrl: 'data:image/jpeg;base64,' + data,
          freezeToken: 'live',
          width: entry['visualWidth'] || entry['viewportWidth'] || 0,
          height: entry['visualHeight'] || entry['viewportHeight'] || 0,
          zoomFactor: entry['zoomFactor'] || 1,
        },
        entry['tabId'],
      ),
      !![]
    );
  }
  function throttleScreencastFrame(entry, data) {
    const elapsed = now() - entry['lastScreencastEmitAt'];
    if (entry['lastScreencastEmitAt'] === 0 || elapsed >= SCREENCAST_MIN_FRAME_INTERVAL_MS) {
      if (entry['screencastFrameTimer']) clearTimeoutFn(entry['screencastFrameTimer']);
      return (
        (entry['screencastFrameTimer'] = null),
        (entry['pendingScreencastFrame'] = null),
        emitScreencastFrame(entry, data)
      );
    }
    entry['pendingScreencastFrame'] = data;
    if (entry['screencastFrameTimer']) return ![];
    return (
      (entry['screencastFrameTimer'] = setTimeoutFn(
        () => {
          entry['screencastFrameTimer'] = null;
          const pending = entry['pendingScreencastFrame'];
          ((entry['pendingScreencastFrame'] = null), emitScreencastFrame(entry, pending));
        },
        Math['max'](0, SCREENCAST_MIN_FRAME_INTERVAL_MS - elapsed),
      )),
      ![]
    );
  }
  async function navigate(entry, url) {
    if (!entry?.['sessionId'] || !url || entry['url'] === url) return ![];
    ((entry['url'] = url),
      (entry['requestedUrl'] = url),
      pushEvent(entry['nodeId'], { type: 'loading', url: url, holdSnapshot: ![] }, entry['tabId']));
    const result = await client['send']('Page.navigate', { url: url }, entry['sessionId']);
    if (result?.['errorText'])
      return (
        pushEvent(
          entry['nodeId'],
          { type: 'failed', url: url, message: String(result['errorText']) },
          entry['tabId'],
        ),
        ![]
      );
    return !![];
  }
  async function attachTarget(entry, view) {
    const target = await createTarget();
    entry['targetId'] = String(target?.['targetId'] || '');
    if (!entry['targetId']) throw new Error('Chrome did not create a browser target');
    const attached = await client['send']('Target.attachToTarget', {
      targetId: entry['targetId'],
      flatten: !![],
    });
    entry['sessionId'] = String(attached?.['sessionId'] || '');
    if (!entry['sessionId']) throw new Error('Chrome did not attach to the browser target');
    (sessionEntries['set'](entry['sessionId'], entry),
      await client['send']('Page.enable', {}, entry['sessionId']),
      await client['send']('Runtime.enable', {}, entry['sessionId']),
      await applyViewport(entry, normalizeViewport(view)),
      (entry['ready'] = !![]));
    if (entry['disposing']) return;
    await navigate(entry, normalizeHttpUrl(view?.['webUrl']));
  }
  function createEntry(view) {
    const nodeId = normalizeNodeId(view?.['nodeId']),
      tabId = normalizeTabId(view?.['tabId']),
      entry = {
        key: toEntryKey(nodeId, tabId),
        nodeId: nodeId,
        tabId: tabId,
        targetId: '',
        sessionId: '',
        requestedUrl: '',
        url: '',
        ready: ![],
        disposing: ![],
        active: view?.['active'] === !![],
        visible: view?.['visible'] === !![],
        selected: view?.['selected'] === !![],
        capturePending: ![],
        captureQueued: ![],
        inputCaptureTimer: null,
        screencastActive: ![],
        screencastDesired: ![],
        screencastUnavailable: ![],
        screencastRestartRequested: ![],
        screencastReconcilePromise: null,
        lastScreencastEmitAt: 0,
        screencastFrameTimer: null,
        pendingScreencastFrame: null,
        viewportWidth: 0,
        viewportHeight: 0,
        visualWidth: 0,
        visualHeight: 0,
        zoomFactor: 1,
        readyPromise: null,
      };
    return (
      entries['set'](entry['key'], entry),
      (entry['readyPromise'] = attachTarget(entry, view)['catch']((error) => {
        (logFailure(
          'chrome_web_preview.create_failed',
          'Chrome browser node target creation failed',
          error,
          entry,
        ),
          pushEvent(
            entry['nodeId'],
            { type: 'failed', message: String(error?.['message'] || error || 'Browser target failed') },
            entry['tabId'],
          ));
        throw error;
      })),
      entry
    );
  }
  async function syncView(view) {
    const nodeId = normalizeNodeId(view?.['nodeId']),
      tabId = normalizeTabId(view?.['tabId']),
      key = toEntryKey(nodeId, tabId),
      webUrl = normalizeHttpUrl(view?.['webUrl']);
    if (!nodeId || !webUrl) return null;
    const entry = entries['get'](key) || createEntry(view),
      becameActive = entry['active'] !== !![] && view?.['active'] === !![],
      becameSelected = entry['selected'] !== !![] && view?.['selected'] === !![];
    ((entry['active'] = view?.['active'] === !![]),
      (entry['visible'] = view?.['visible'] === !![]),
      (entry['selected'] = view?.['selected'] === !![]));
    try {
      await entry['readyPromise'];
      if (entry['disposing']) return null;
      const viewportChanged = await applyViewport(entry, normalizeViewport(view)),
        navigationApplied = await navigate(entry, webUrl);
      return (
        await reconcileScreencast(entry, { restart: viewportChanged }),
        entry['active'] &&
          !entry['screencastActive'] &&
          !navigationApplied &&
          (becameActive || becameSelected || viewportChanged) &&
          void captureSnapshot(entry),
        entry
      );
    } catch {
      return null;
    }
  }
  async function disposeEntry(entry) {
    if (!entry || entry['disposing']) return ![];
    ((entry['disposing'] = !![]), entries['delete'](entry['key']));
    if (entry['inputCaptureTimer']) clearTimeoutFn(entry['inputCaptureTimer']);
    entry['inputCaptureTimer'] = null;
    if (entry['screencastFrameTimer']) clearTimeoutFn(entry['screencastFrameTimer']);
    ((entry['screencastFrameTimer'] = null), (entry['pendingScreencastFrame'] = null));
    if (entry['sessionId']) sessionEntries['delete'](entry['sessionId']);
    try {
      await entry['readyPromise'];
    } catch {}
    if (entry['screencastActive'] && entry['sessionId']) {
      try {
        await client['send']('Page.stopScreencast', {}, entry['sessionId']);
      } catch {}
      entry['screencastActive'] = ![];
    }
    if (entry['sessionId']) sessionEntries['delete'](entry['sessionId']);
    if (entry['targetId'])
      try {
        await client['send']('Target.closeTarget', { targetId: entry['targetId'] });
      } catch {}
    return !![];
  }
  async function handleClientEvent(message = {}) {
    const entry = sessionEntries['get'](String(message?.['sessionId'] || ''));
    if (!entry || entry['disposing']) return;
    const params = message?.['params'] || {};
    if (message['method'] === 'Page.frameStartedLoading') {
      entry['requestedUrl'] &&
        pushEvent(
          entry['nodeId'],
          { type: 'loading', url: entry['requestedUrl'], holdSnapshot: ![] },
          entry['tabId'],
        );
      return;
    }
    if (message['method'] === 'Page.frameNavigated') {
      const frame = params?.['frame'] || {},
        url = normalizeHttpUrl(frame?.['url']);
      !frame?.['parentId'] &&
        url &&
        ((entry['url'] = url),
        (entry['requestedUrl'] = url),
        pushEvent(entry['nodeId'], { type: 'navigated', url: url }, entry['tabId']));
      return;
    }
    if (message['method'] === 'Page.loadEventFired') {
      (pushEvent(entry['nodeId'], { type: 'loaded' }, entry['tabId']),
        await Promise['all']([
          emitNavigationState(entry),
          entry['screencastActive'] ? Promise['resolve'](!![]) : captureSnapshot(entry),
        ]));
      return;
    }
    if (message['method'] === 'Page.screencastFrame') {
      const screencastSessionId = Number(params?.['sessionId']);
      Number['isFinite'](screencastSessionId) &&
        void client['send'](
          'Page.screencastFrameAck',
          { sessionId: screencastSessionId },
          entry['sessionId'],
        )['catch'](() => {});
      throttleScreencastFrame(entry, String(params?.['data'] || '')['trim']());
      return;
    }
    message['method'] === 'Inspector.targetCrashed' &&
      pushEvent(entry['nodeId'], { type: 'failed', message: '浏览器页面进程已退出' }, entry['tabId']);
  }
  const unsubscribe =
    typeof client['onEvent'] === 'function'
      ? client['onEvent']((message) => {
          void handleClientEvent(message);
        })
      : () => {};
  async function controlView(request = {}) {
    const nodeId = normalizeNodeId(request?.['nodeId']),
      tabId = normalizeTabId(request?.['tabId']),
      action = String(request?.['action'] || '')['trim']();
    if (!nodeId) return { ok: ![], error: 'missing-node' };
    const entry = entries['get'](toEntryKey(nodeId, tabId));
    if (!entry) return { ok: ![], error: 'missing-view' };
    try {
      await entry['readyPromise'];
      if (!entry['sessionId'] || entry['disposing']) return { ok: ![], error: 'missing-view' };
      if (action === 'reload')
        (pushEvent(nodeId, { type: 'loading', url: entry['url'], holdSnapshot: ![] }, tabId),
          await client['send']('Page.reload', { ignoreCache: !![] }, entry['sessionId']));
      else {
        if (action === 'back' || action === 'forward') {
          const history = await client['send']('Page.getNavigationHistory', {}, entry['sessionId']),
            entries = Array['isArray'](history?.['entries']) ? history['entries'] : [],
            currentIndex = Math['max'](0, Number(history?.['currentIndex']) || 0),
            targetIndex = action === 'back' ? currentIndex - 1 : currentIndex + 1,
            targetEntry = entries[targetIndex];
          if (targetEntry?.['id'] == null) {
            const navigationState = await readNavigationState(entry);
            return (
              pushEvent(
                nodeId,
                { type: 'blocked', message: action === 'back' ? '没有上一页' : '没有下一页' },
                tabId,
              ),
              { ok: ![], error: 'no-history', ...navigationState }
            );
          }
          await client['send'](
            'Page.navigateToHistoryEntry',
            { entryId: targetEntry['id'] },
            entry['sessionId'],
          );
        } else {
          if (action === 'dispatch-input') {
            const input = request?.['input'] && typeof request['input'] === 'object' ? request['input'] : {},
              modifiers = normalizeInputModifiers(input);
            if (input['kind'] === 'mouse') {
              const mouseType = String(input['type'] || '');
              if (!['mousePressed', 'mouseReleased', 'mouseMoved', 'mouseWheel']['includes'](mouseType))
                return { ok: ![], error: 'unsupported-input' };
              const xRatio = Math['max'](0, Math['min'](1, Number(input['xRatio']) || 0)),
                yRatio = Math['max'](0, Math['min'](1, Number(input['yRatio']) || 0));
              await client['send'](
                'Input.dispatchMouseEvent',
                {
                  type: mouseType,
                  x: xRatio * Math['max'](1, entry['viewportWidth'] || 1),
                  y: yRatio * Math['max'](1, entry['viewportHeight'] || 1),
                  modifiers: modifiers,
                  button: normalizeMouseButton(input['button']),
                  buttons: Math['max'](0, Number(input['buttons']) || 0),
                  clickCount: Math['max'](0, Number(input['clickCount']) || 0),
                  ...(mouseType === 'mouseWheel'
                    ? {
                        deltaX: Number(input['deltaX']) || 0,
                        deltaY: Number(input['deltaY']) || 0,
                      }
                    : {}),
                },
                entry['sessionId'],
              );
              if (mouseType !== 'mousePressed') scheduleSnapshot(entry);
            } else {
              if (input['kind'] === 'key') {
                const keyType = input['type'] === 'keyUp' ? 'keyUp' : 'keyDown';
                await client['send'](
                  'Input.dispatchKeyEvent',
                  {
                    type: keyType,
                    modifiers: modifiers,
                    key: String(input['key'] || ''),
                    code: String(input['code'] || ''),
                    text: keyType === 'keyDown' ? String(input['text'] || '') : '',
                    unmodifiedText: keyType === 'keyDown' ? String(input['text'] || '') : '',
                    windowsVirtualKeyCode: Math['max'](0, Number(input['keyCode']) || 0),
                    nativeVirtualKeyCode: Math['max'](0, Number(input['keyCode']) || 0),
                    autoRepeat: input['repeat'] === !![],
                  },
                  entry['sessionId'],
                );
                if (keyType === 'keyUp') scheduleSnapshot(entry);
              } else {
                if (input['kind'] === 'text')
                  (await client['send'](
                    'Input.insertText',
                    { text: String(input['text'] || '') },
                    entry['sessionId'],
                  ),
                    scheduleSnapshot(entry));
                else return { ok: ![], error: 'unsupported-input' };
              }
            }
            return { ok: !![], action: action, tabId: tabId };
          } else {
            if (action === 'capture-reference') {
              const [referenceResult, screenshot, navigationState] = await Promise['all']([
                  client['send'](
                    'Runtime.evaluate',
                    {
                      expression: createReferenceSnapshotExpression(),
                      returnByValue: !![],
                      awaitPromise: !![],
                    },
                    entry['sessionId'],
                  ),
                  client['send'](
                    'Page.captureScreenshot',
                    { format: 'webp', quality: SNAPSHOT_QUALITY, fromSurface: !![], optimizeForSpeed: !![] },
                    entry['sessionId'],
                  ),
                  readNavigationState(entry),
                ]),
                reference = referenceResult?.['result']?.['value'] || {};
              return {
                ok: !![],
                action: action,
                tabId: tabId,
                pageUrl: String(reference?.['pageUrl'] || entry['url'] || entry['requestedUrl'] || ''),
                pageTitle: String(reference?.['pageTitle'] || ''),
                selectedText: String(reference?.['selectedText'] || '')['slice'](0, 5000),
                screenshotDataUrl: screenshot?.['data'] ? 'data:image/webp;base64,' + screenshot['data'] : '',
                capturedAt: new Date(now())['toISOString'](),
                ...navigationState,
              };
            } else return { ok: ![], error: 'unsupported-action' };
          }
        }
      }
      return { ok: !![], action: action, tabId: tabId, ...(await emitNavigationState(entry)) };
    } catch (error) {
      return (
        logFailure('chrome_web_preview.control_failed', 'Chrome browser node control failed', error, entry),
        { ok: ![], error: String(error?.['message'] || error || 'control-failed') }
      );
    }
  }
  return {
    async syncViews(payload = {}) {
      if (disposed) return { ok: ![], error: 'disposed' };
      const views = Array['isArray'](payload?.['views']) ? payload['views'] : [],
        activeKeys = new Set(),
        pending = [];
      for (const view of views) {
        const nodeId = normalizeNodeId(view?.['nodeId']),
          tabId = normalizeTabId(view?.['tabId']),
          webUrl = normalizeHttpUrl(view?.['webUrl']);
        if (!nodeId || !webUrl) continue;
        (activeKeys['add'](toEntryKey(nodeId, tabId)), pending['push'](syncView(view)));
      }
      return (
        await Promise['all'](pending),
        await Promise['all'](
          [...entries['values']()]
            ['filter']((entry) => !activeKeys['has'](entry['key']))
            ['map']((entry) => disposeEntry(entry)),
        ),
        {
          ok: !![],
          count: entries['size'],
          visibleCount: [...entries['values']()]['filter']((entry) => entry['visible'])['length'],
        }
      );
    },
    async disposeViews(payload = {}) {
      const nodeIds = new Set(
          Array['isArray'](payload?.['nodeIds'])
            ? payload['nodeIds']['map'](normalizeNodeId)['filter'](Boolean)
            : [],
        ),
        tabIds = new Set(
          Array['isArray'](payload?.['tabIds'])
            ? payload['tabIds']['map'](normalizeTabId)['filter'](Boolean)
            : [],
        ),
        targets = [...entries['values']()]['filter']((entry) => {
          if (nodeIds['size'] > 0 && !nodeIds['has'](entry['nodeId'])) return ![];
          if (tabIds['size'] > 0 && !tabIds['has'](entry['tabId'])) return ![];
          return nodeIds['size'] > 0 || tabIds['size'] > 0 || payload?.['all'] === !![];
        }),
        disposedEntries = await Promise['all'](targets['map'](disposeEntry));
      return { ok: !![], disposed: disposedEntries['filter'](Boolean)['length'] };
    },
    controlView: controlView,
    consumeEvents() {
      return drainEvents();
    },
    waitForEvents(options = {}) {
      if (disposed) return Promise['resolve']([]);
      if (eventQueue['length'] > 0) return Promise['resolve'](drainEvents());
      const waitMs = clampNumber(options?.['waitMs'], EVENT_WAIT_MIN_MS, EVENT_WAIT_MAX_MS, 1000);
      return new Promise((resolve) => {
        const waiter = { resolve: resolve, timer: null };
        ((waiter['timer'] = setTimeoutFn(() => {
          (waiters['delete'](waiter), resolve([]));
        }, waitMs)),
          waiters['add'](waiter));
      });
    },
    async dispose() {
      if (disposed) return;
      ((disposed = !![]),
        unsubscribe?.(),
        await Promise['all']([...entries['values']()]['map'](disposeEntry)),
        sessionEntries['clear'](),
        (eventQueue['length'] = 0));
      for (const waiter of waiters) {
        if (waiter['timer']) clearTimeoutFn(waiter['timer']);
        waiter['resolve']([]);
      }
      (waiters['clear'](), client['close']?.());
    },
    _getEntry(nodeId, tabId) {
      return entries['get'](toEntryKey(nodeId, tabId)) || null;
    },
  };
}
export const __chromeShellWebPreviewManagerForTest = {
  normalizeHttpUrl: normalizeHttpUrl,
  normalizeInputModifiers: normalizeInputModifiers,
  normalizeMouseButton: normalizeMouseButton,
  normalizeViewport: normalizeViewport,
  toEntryKey: toEntryKey,
};
