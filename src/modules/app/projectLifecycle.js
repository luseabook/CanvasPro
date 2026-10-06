import {
  sanitizeMultiCanvasDataForPersistence as sanitizeMultiCanvasDataForPersistence_2,
  sanitizeSerializedCanvasData,
} from '../../utils/thumbnailPersistence.js';
import {
  buildUniqueCanvasName,
  isCanvasProjectFileName,
  stripCanvasProjectFileExtension,
} from '../../utils/canvasProjectFileNames.js';
import { buildImageNodeStorageFields, needsImageDerivatives } from '../../services/imageDerivativeService.js';
import { buildCanvasLocalImageFields } from '../../services/canvasMediaLocalService.js';
import { resolveGenerationTaskIdentity } from '../../core/generationExecutionPlan.js';
import { createStableSignature } from '../../utils/stableSignature.js';
import { normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { isModelApiModel, isWorkflowModel, resolveModelProvider } from '../../manifests/index.js';
import { t } from '../../i18n/index.js';
import { requireProjectDocument } from '../../services/projectDocumentGuard.js';
import { desktopBridge } from '../../services/desktopBridge.js';
import { cancelStartupLoaderGuard } from '../../services/startupLoaderGuard.js';
import { rendererStartupState } from '../../services/rendererStartupState.js';
import {
  createWorkspaceCacheIdleScheduler,
  isWorkspaceCacheInteractionBusy,
} from './workspaceCacheIdleScheduler.js';
export { createStableSignature } from '../../utils/stableSignature.js';
const BOOT_PERF_MEASURE_NAMES = [
    'project.loadProject',
    'buildHydrationSafeMultiData',
    'hydrateTrustedSnapshot',
    'CanvasTabManager.init',
    'loader hidden',
    'historicalAiLocalization queued',
  ],
  WORKSPACE_META_KEY = 'workspace_meta',
  LEGACY_WORKSPACE_KEY = 'current_state',
  WORKSPACE_CANVAS_KEY_PREFIX = 'workspace_canvas::',
  PROJECT_WORKSPACE_META_KEY_PREFIX = 'project_workspace_meta::',
  PROJECT_WORKSPACE_CANVAS_KEY_PREFIX = 'project_workspace_canvas::',
  DREAMINA_RESUME_BACKUP_KEY = 'tapnow_v2_dreamina_resume_backup',
  PAGE_LIFECYCLE_FLUSH_DEDUPE_MS = 2000,
  RECOVERY_SNAPSHOT_DEDUPE_MS = 5000,
  PERSISTABLE_SNAPSHOT_REUSE_MS = 1200,
  WORKSPACE_CACHE_PERSIST_DELAY_MS = 1000,
  WORKSPACE_CACHE_META_DELAY_MS = 150,
  WORKSPACE_CACHE_BUSY_RETRY_MS = 250,
  INITIAL_LOADER_MAX_VISIBLE_MS = 10000,
  INITIAL_IMAGE_READY_POLL_MS = 75,
  INITIAL_IMAGE_READY_MAX_ATTEMPTS = 30,
  INITIAL_IMAGE_READY_MIN_RATIO = 0.8,
  INITIAL_IMAGE_READY_MIN_ATTEMPTS = 4,
  INITIAL_IMAGE_READY_STABLE_POLLS = 2,
  INITIAL_IMAGE_REVEAL_MAX_ITEMS = 12,
  INITIAL_REVEAL_IDLE_TIMEOUT_MS = 500,
  INITIAL_PROGRESS_FINISH_MS = 280,
  INITIAL_IMAGE_REVEAL_BASE_MS = 680,
  INITIAL_IMAGE_REVEAL_STAGGER_MS = 60,
  INITIAL_IMAGE_REVEAL_MAX_STAGGER_INDEX = 5,
  INITIAL_BRAND_IMAGE_HANDOFF_MS = 140,
  INITIAL_BACKGROUND_REVEAL_MS = 360,
  INITIAL_IMAGE_LAYER_HANDOFF_MS = 100,
  INITIAL_REVEAL_FRAME_TIMEOUT_MS = 96,
  INITIAL_CANVAS_IMAGE_NODE_TYPES = new Set(['ai-image', 'image', 'source-image', 'source_image']),
  DREAMINA_RESUME_BACKUP_FIELDS = [
    'canvasId',
    'nodeId',
    'generationStartTime',
    'generationDuration',
    'dreaminaSubmitId',
    'dreaminaTaskStatus',
    'dreaminaTaskPhase',
    'dreaminaTaskLabel',
    'dreaminaTaskStartedAt',
    'dreaminaTaskLastCheckedAt',
    'dreaminaTaskRecovering',
    'dreaminaTaskLastRaw',
  ];
// Recovery must fail closed. A cache or snapshot that cannot be read safely is not
// proof that the project is empty, so loading a blank canvas would silently replace
// the user's work. This mirrors the 0.4.12 guard that the 0.8.0 rewrite dropped;
// see docs/b163-step1-t-alignment.md §7.1.
function unsafeRecoveryError() {
  return Object.assign(new Error('恢复快照或本地缓存无法安全读取；保留原始数据，未加载空画布'), {
    code: 'UNSAFE_PROJECT_RECOVERY',
  });
}
export function resolveInitialLoaderMinimumVisibleMs(
  el,
  { windowObject: windowObject = globalThis.window } = {},
) {
  if (windowObject?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return 0;
  const count = Number(el?.dataset?.minVisibleMs);
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.min(INITIAL_LOADER_MAX_VISIBLE_MS, Math.round(count));
}
export function waitForInitialLoaderSequence({
  loader: loader,
  windowObject: windowObject = globalThis.window,
  scheduleTimeout: scheduleTimeout = globalThis.setTimeout,
} = {}) {
  const initialLoaderMinimumVisibleMs = resolveInitialLoaderMinimumVisibleMs(loader, { windowObject: windowObject });
  if (initialLoaderMinimumVisibleMs <= 0 || typeof scheduleTimeout !== 'function') return Promise.resolve();
  return new Promise((value) => {
    scheduleTimeout(value, initialLoaderMinimumVisibleMs);
  });
}
export function waitForInitialRevealFrame({
  windowObject: windowObject = globalThis.window,
  scheduleTimeout: scheduleTimeout = globalThis.setTimeout,
  cancelTimeout: cancelTimeout = globalThis.clearTimeout,
  timeoutMs: timeoutMs = INITIAL_REVEAL_FRAME_TIMEOUT_MS,
} = {}) {
  return new Promise((handler) => {
    let item = false,
      scheduleTimeout2 = null;
    const run = () => {
        if (item) return;
        ((item = true), handler());
      },
      enabled = typeof windowObject?.requestAnimationFrame === 'function',
      key = enabled ? Math.max(16, Number(timeoutMs) || INITIAL_REVEAL_FRAME_TIMEOUT_MS) : 16;
    typeof scheduleTimeout === 'function' && (scheduleTimeout2 = scheduleTimeout(run, key));
    if (!enabled) {
      if (scheduleTimeout2 === null) run();
      return;
    }
    try {
      windowObject.requestAnimationFrame(() => {
        (scheduleTimeout2 !== null && typeof cancelTimeout === 'function' && cancelTimeout(scheduleTimeout2), run());
      });
    } catch {
      run();
    }
  });
}
export function scheduleInitialLoaderFailOpen({
  loader: loader2,
  wrapEl: wrapEl,
  canvasEl: canvasEl,
  timeoutMs: timeoutMs = INITIAL_LOADER_MAX_VISIBLE_MS,
  scheduleTimeout: scheduleTimeout = globalThis.setTimeout,
  cancelTimeout: cancelTimeout = globalThis.clearTimeout,
  onTimeout: onTimeout,
  shouldReveal: shouldReveal = () => loader2?.dataset?.appReady === 'true',
} = {}) {
  if (!loader2 || typeof scheduleTimeout !== 'function') return () => {};
  let enabled2 = true;
  const scheduleTimeout3 = scheduleTimeout(
    () => {
      if (!enabled2) return;
      enabled2 = false;
      if (!shouldReveal()) return;
      if (canvasEl) canvasEl.style.transition = '';
      (wrapEl &&
        ((wrapEl.style.transition = ''),
        (wrapEl.style.opacity = '1'),
        wrapEl.classList?.remove?.('is-initial-header-locked')),
        (loader2.style.opacity = '0'),
        (loader2.style.visibility = 'hidden'),
        loader2.remove?.(),
        onTimeout?.());
    },
    Math.max(0, Number(timeoutMs) || INITIAL_LOADER_MAX_VISIBLE_MS),
  );
  return () => {
    if (!enabled2) return;
    enabled2 = false;
    if (typeof cancelTimeout === 'function') cancelTimeout(scheduleTimeout3);
  };
}
export function hasInitialCanvasImageNodes(index) {
  const result = (data) => String(data || '').trim().length > 0,
    handler2 = (response) =>
      !!response &&
      [
        response.imageUrl,
        response.localPath,
        response.originalLocalPath,
        response.displayLocalPath,
        response.sourceUrl,
        response.src,
        response.thumbId,
        response.thumbUrl,
        response.url,
      ].some(result);
  return Object.values(index || {}).some((options) => {
    if (
      !INITIAL_CANVAS_IMAGE_NODE_TYPES.has(
        String(options?.type || '')
          .trim()
          .toLowerCase(),
      )
    )
      return false;
    if (Array.isArray(options?.images) && options.images.some(handler2)) return true;
    return handler2(options);
  });
}
function getInitialRevealImageSource(el2) {
  return String(
    el2?.currentSrc ||
      el2?.getAttribute?.('src') ||
      el2?.src ||
      el2?.dataset?.lazySrc ||
      el2?.dataset?.lazyPreviewSrc ||
      '',
  ).trim();
}
function getInitialRevealImages(el3) {
  return Array.from(
    el3?.querySelectorAll?.(
      'img.node-img, img.aigen-image-media, .multi-images-container img.v2-media-preview, img.v2-fast-preview-media',
    ) || [],
  ).filter((target) => getInitialRevealImageSource(target));
}
function isInitialRevealImageReady(source) {
  return (
    getInitialRevealImageSource(source) &&
    source?.complete === true &&
    Number(source?.naturalWidth || 0) > 0
  );
}
export function collectInitialImageRevealTargets(el4) {
  return Array.from(el4?.querySelectorAll?.('.v2-node.image-node') || []).filter(
    (next) => getInitialRevealImages(next).length > 0,
  );
}
function getInitialRasterRevealRect(current, box, box2) {
  const box3 = getInitialRevealImageRect(current),
    count2 = Number(box2?.width),
    count3 = Number(box2?.height);
  if (
    !box3 ||
    !(count2 > 0) ||
    !(count3 > 0) ||
    ![box?.x, box?.y, box?.width, box?.height].every((entry) =>
      Number.isFinite(Number(entry)),
    )
  )
    return null;
  const record = box3.width / count2,
    payload = box3.height / count3,
    left = box3.left + (Number(box.x) - Number(box2.left || 0)) * record,
    top = box3.top + (Number(box.y) - Number(box2.top || 0)) * payload,
    width = Number(box.width) * record,
    height = Number(box.height) * payload;
  return {
    left: left,
    top: top,
    right: left + width,
    bottom: top + height,
    width: width,
    height: height,
  };
}
function isInitialRevealEntryInViewport(
  handle,
  { viewportWidth: viewportWidth, viewportHeight: viewportHeight } = {},
) {
  const box4 = handle?.rect;
  if (!box4) return false;
  return (
    (viewportWidth <= 0 || (box4.right > 0 && box4.left < viewportWidth)) &&
    (viewportHeight <= 0 || (box4.bottom > 0 && box4.top < viewportHeight))
  );
}
export function collectInitialImageRevealEntries(
  el5,
  { windowObject: windowObject = globalThis.window } = {},
) {
  const viewportWidth2 = Number(windowObject?.innerWidth || 0),
    viewportHeight2 = Number(windowObject?.innerHeight || 0),
    list = [],
    state = Array.from(
      el5?.querySelectorAll?.('.v2-node.image-node, .v2-fast-preview-node--image') || [],
    );
  for (const el6 of state) {
    const image = getInitialRevealImages(el6)[0],
      source2 = getInitialRevealImageSource(image),
      rect = getInitialRevealImageRect(image);
    if (!source2 || !rect) continue;
    list.push({
      image: image,
      nodeId: String(el6?.id || el6?.dataset?.nodeId || ''),
      ready: isInitialRevealImageReady(image),
      rect: rect,
      source: source2,
    });
  }
  const config = Array.from(el5?.querySelectorAll?.('.v2-raster-preview-canvas') || []);
  for (const scope of config) {
    const input = scope?.__aicanvasRasterPreviewStats?.worldBounds;
    for (const ready of scope?.__aicanvasRasterPreviewRevealItems || []) {
      const source3 = String(ready?.source || '').trim(),
        rect2 = getInitialRasterRevealRect(scope, ready, input);
      if (!source3 || !rect2) continue;
      list.push({
        image: null,
        nodeId: String(ready?.nodeId || ''),
        objectFit: 'cover',
        objectPosition: '50% 50%',
        ready: ready?.ready === true,
        rect: rect2,
        source: source3,
      });
    }
  }
  const map = new Set();
  return list.filter((enabled3) => {
    if (!isInitialRevealEntryInViewport(enabled3, { viewportWidth: viewportWidth2, viewportHeight: viewportHeight2 }))
      return false;
    if (!enabled3.nodeId) return true;
    if (map.has(enabled3.nodeId)) return false;
    return (map.add(enabled3.nodeId), true);
  });
}
export function shouldUseInitialImageFirstReveal({
  nodes: nodes,
  targetCount: targetCount,
  reducedMotion: reducedMotion = false,
} = {}) {
  return reducedMotion !== true && hasInitialCanvasImageNodes(nodes) && Number(targetCount || 0) > 0;
}
export function resolveInitialImageRevealDurationMs(output) {
  const value2 = Math.min(
    INITIAL_IMAGE_REVEAL_MAX_STAGGER_INDEX,
    Math.max(0, Math.floor(Number(output || 0)) - 1),
  );
  return INITIAL_IMAGE_REVEAL_BASE_MS + value2 * INITIAL_IMAGE_REVEAL_STAGGER_MS;
}
export function resolveInitialImageRevealVector(value3) {
  const list2 = [
      { x: '-42vw', y: '0px', rotation: '-7deg' },
      { x: '0px', y: '-38vh', rotation: '5deg' },
      { x: '42vw', y: '0px', rotation: '7deg' },
      { x: '0px', y: '38vh', rotation: '-5deg' },
    ],
    value4 = Math.max(0, Math.floor(Number(value3) || 0));
  return list2[value4 % list2.length];
}
export function shouldFinishInitialImageReadinessWait({
  totalCount: totalCount,
  readyCount: readyCount,
  stablePollCount: stablePollCount,
  attempt: attempt,
} = {}) {
  const count4 = Math.max(0, Math.floor(Number(totalCount) || 0)),
    value5 = Math.max(0, Math.floor(Number(readyCount) || 0));
  if (count4 <= 0) return Number(attempt || 0) >= 2;
  if (value5 >= count4) return true;
  return (
    Number(attempt || 0) >= INITIAL_IMAGE_READY_MIN_ATTEMPTS &&
    value5 / count4 >= INITIAL_IMAGE_READY_MIN_RATIO &&
    Number(stablePollCount || 0) >= INITIAL_IMAGE_READY_STABLE_POLLS
  );
}
export function selectInitialImageRevealEntries(
  value6,
  { maxItems: maxItems = INITIAL_IMAGE_REVEAL_MAX_ITEMS } = {},
) {
  const list3 = Array.isArray(value6) ? value6 : [],
    length = Math.max(0, Math.floor(Number(maxItems) || 0));
  if (length <= 0 || list3.length === 0) return [];
  if (list3.length <= length) return [...list3];
  if (length === 1) return [list3[Math.floor((list3.length - 1) / 2)]];
  return Array.from({ length: length }, (value7, value8) => {
    const value9 = Math.round((value8 * (list3.length - 1)) / (length - 1));
    return list3[value9];
  });
}
function getInitialRevealImageRect(el7) {
  const left2 = el7?.getBoundingClientRect?.();
  if (
    !left2 ||
    !Number.isFinite(left2.left) ||
    !Number.isFinite(left2.top) ||
    !Number.isFinite(left2.width) ||
    !Number.isFinite(left2.height) ||
    left2.width <= 1 ||
    left2.height <= 1
  )
    return null;
  return {
    left: left2.left,
    top: left2.top,
    right: Number.isFinite(left2.right)
      ? left2.right
      : left2.left + left2.width,
    bottom: Number.isFinite(left2.bottom)
      ? left2.bottom
      : left2.top + left2.height,
    width: left2.width,
    height: left2.height,
  };
}
function scaleInitialRevealPixelLengths(value10, value11) {
  const value12 =
    Number.isFinite(Number(value11)) && Number(value11) > 0 ? Number(value11) : 1;
  return String(value10 || '').replace(/(-?(?:\d+(?:\.\d+)?|\.\d+))px\b/gi, (value13, value14) => {
    const value15 = Math.round(Number(value14) * value12 * 1000) / 1000;
    return (Object.is(value15, -0) ? 0 : value15) + 'px';
  });
}
function resolveInitialRevealScale(el8, box5) {
  const count5 = Number(el8?.offsetWidth),
    count6 = Number(el8?.offsetHeight),
    scaleX = Number.isFinite(count5) && count5 > 0 ? box5.width / count5 : 1,
    scaleY =
      Number.isFinite(count6) && count6 > 0 ? box5.height / count6 : scaleX;
  return { scaleX: scaleX, scaleY: scaleY };
}
function resolveInitialRevealBorderRadius(value16, value17, value18) {
  const value19 = String(value18 || '').trim() || '0',
    { scaleX: scaleX2, scaleY: scaleY2 } = resolveInitialRevealScale(value16, value17),
    [value20, value21] = value19.split(/\s*\/\s*/, 2);
  if (value21)
    return (
      scaleInitialRevealPixelLengths(value20, scaleX2) +
      ' / ' +
      scaleInitialRevealPixelLengths(value21, scaleY2)
    );
  if (Math.abs(scaleX2 - scaleY2) < 0.001) return scaleInitialRevealPixelLengths(value19, scaleX2);
  return (
    scaleInitialRevealPixelLengths(value19, scaleX2) +
    ' / ' +
    scaleInitialRevealPixelLengths(value19, scaleY2)
  );
}
function resolveInitialRevealClipPath(value22, value23, value24) {
  const value25 = String(value24 || '').trim() || 'none';
  if (value25 === 'none') return value25;
  const { scaleX: scaleX3, scaleY: scaleY3 } = resolveInitialRevealScale(value22, value23);
  return scaleInitialRevealPixelLengths(value25, Math.min(scaleX3, scaleY3));
}
function isInitialRevealImageInViewport(
  value26,
  { viewportWidth: viewportWidth3, viewportHeight: viewportHeight3 } = {},
) {
  const box6 = getInitialRevealImageRect(value26);
  if (!box6) return false;
  return (
    (viewportWidth3 <= 0 || (box6.right > 0 && box6.left < viewportWidth3)) &&
    (viewportHeight3 <= 0 || (box6.bottom > 0 && box6.top < viewportHeight3))
  );
}
export function createInitialImageRevealLayer({
  loader: loader3,
  imageTargets: imageTargets,
  documentObject: documentObject = globalThis.document,
  windowObject: windowObject = globalThis.window,
} = {}) {
  if (!loader3?.appendChild || !documentObject?.createElement || !Array.isArray(imageTargets))
    return null;
  const el9 = documentObject.createElement('div');
  ((el9.className = 'initial-image-reveal-layer'),
    el9.setAttribute?.('aria-hidden', 'true'));
  const count7 = Number(
      windowObject?.innerWidth || documentObject?.documentElement?.clientWidth || 0,
    ),
    count8 = Number(
      windowObject?.innerHeight || documentObject?.documentElement?.clientHeight || 0,
    ),
    list4 = imageTargets.flatMap((value27) => {
      const args = value27?.rect && value27?.source ? value27 : null,
        image2 = args
          ? args.image
          : getInitialRevealImages(value27).find(isInitialRevealImageReady),
        rect3 = args?.rect || getInitialRevealImageRect(image2),
        source4 = args?.source || getInitialRevealImageSource(image2);
      if (
        args?.ready === false ||
        !source4 ||
        !rect3 ||
        (count7 > 0 && (rect3.right <= 0 || rect3.left >= count7)) ||
        (count8 > 0 && (rect3.bottom <= 0 || rect3.top >= count8))
      )
        return [];
      return [{ ...args, image: image2, rect: rect3, source: source4 }];
    });
  (list4.sort((value28, value29) => {
    const value30 = value28.rect.top + value28.rect.height / 2,
      value31 = value29.rect.top + value29.rect.height / 2;
    if (value30 !== value31) return value30 - value31;
    return (
      value28.rect.left +
      value28.rect.width / 2 -
      (value29.rect.left + value29.rect.width / 2)
    );
  }),
    selectInitialImageRevealEntries(list4).forEach(
      (
        {
          image: image3,
          rect: rect4,
          source: source5,
          objectFit: objectFit,
          objectPosition: objectPosition,
          borderRadius: borderRadius,
          clipPath: clipPath,
        },
        value32,
      ) => {
        const el10 = documentObject.createElement('img'),
          box7 = resolveInitialImageRevealVector(value32),
          value33 = image3 ? windowObject?.getComputedStyle?.(image3) : null;
        ((el10.className = 'initial-image-reveal-item'),
          (el10.alt = ''),
          (el10.draggable = false),
          (el10.decoding = 'sync'),
          (el10.loading = 'eager'),
          (el10.src = source5),
          (el10.style.left = rect4.left + 'px'),
          (el10.style.top = rect4.top + 'px'),
          (el10.style.width = rect4.width + 'px'),
          (el10.style.height = rect4.height + 'px'),
          (el10.style.objectFit = objectFit || value33?.objectFit || 'cover'),
          (el10.style.objectPosition = objectPosition || value33?.objectPosition || '50% 50%'),
          (el10.style.borderRadius = image3
            ? resolveInitialRevealBorderRadius(image3, rect4, borderRadius || value33?.borderRadius)
            : borderRadius || '0'),
          (el10.style.clipPath = image3
            ? resolveInitialRevealClipPath(image3, rect4, clipPath || value33?.clipPath)
            : clipPath || 'none'),
          el10.style.setProperty(
            '--initial-image-reveal-index',
            String(Math.min(value32, INITIAL_IMAGE_REVEAL_MAX_STAGGER_INDEX)),
          ),
          el10.style.setProperty('--initial-image-from-x', box7.x),
          el10.style.setProperty('--initial-image-from-y', box7.y),
          el10.style.setProperty('--initial-image-from-rotation', box7.rotation),
          el9.appendChild(el10));
      },
    ));
  if (!el9.childElementCount) return (el9.remove?.(), null);
  return (loader3.appendChild(el9), el9);
}
function getUntitledProjectName() {
  return t('projectLifecycle.untitledProject');
}
function getUntitledCanvasName() {
  return t('projectLifecycle.untitledCanvas');
}
function getDefaultCanvasName() {
  return t('projectLifecycle.defaultCanvas');
}
function buildWorkspaceCanvasKey(value34) {
  return '' + WORKSPACE_CANVAS_KEY_PREFIX + String(value34 || '').trim();
}
function normalizeProjectWorkspaceId(value35) {
  return stripCanvasProjectFileExtension(String(value35 || '').trim()).toLowerCase();
}
function buildProjectWorkspaceMetaKey(value36) {
  return '' + PROJECT_WORKSPACE_META_KEY_PREFIX + encodeURIComponent(normalizeProjectWorkspaceId(value36));
}
function buildProjectWorkspaceCanvasKey(value37, value38) {
  return (
    '' +
    PROJECT_WORKSPACE_CANVAS_KEY_PREFIX +
    encodeURIComponent(normalizeProjectWorkspaceId(value37)) +
    '::' +
    encodeURIComponent(String(value38 || '').trim())
  );
}
function inferAsyncProviderByModel(value39, value40 = '') {
  const modelProvider = resolveModelProvider(value39, '', { allowProviderHint: false });
  if (modelProvider) return modelProvider;
  const value41 = String(value40 || '')
    .trim()
    .toLowerCase();
  if (value41) return value41;
  const list5 = String(value39 || '').trim();
  if (list5 && !list5.includes('/')) return 'grsai';
  return 'grsai';
}
function getGenerationKindForNode(value42) {
  const list6 = String(value42?.type || '')
    .trim()
    .toLowerCase();
  if (list6.includes('video')) return 'video';
  if (list6.includes('audio')) return 'audio';
  if (list6.includes('image')) return 'image';
  return 'generation';
}
function resolveProjectLifecycleTaskIdentity(node, value43) {
  const taskProtocol = String(value43 || '').trim(),
    provider =
      taskProtocol === 'asyncModelApi'
        ? inferAsyncProviderByModel(
            node?.model,
            node?.asyncTaskProvider || node?.provider || '',
          )
        : '';
  return resolveGenerationTaskIdentity({
    kind: getGenerationKindForNode(node),
    node: node,
    taskProtocol: taskProtocol,
    provider: provider,
  });
}
function isDreaminaResumeCandidateNode(enabled4) {
  if (!enabled4 || typeof enabled4 !== 'object') return false;
  const value44 = String(enabled4.type || '')
    .trim()
    .toLowerCase();
  if (!['ai-video', 'ai-image', 'source-image', 'source-video'].includes(value44)) return false;
  const value45 = String(enabled4.provider || '')
      .trim()
      .toLowerCase(),
    value46 = String(enabled4.model || '').trim(),
    enabled5 = value45 === 'dreamina' || resolveModelProvider(value46, value45) === 'dreamina';
  if (!enabled5) return false;
  if (hasDreaminaResultError(enabled4)) return false;
  const value47 = String(enabled4.jobStatus || '')
    .trim()
    .toLowerCase();
  if (value47 === 'error' || value47 === 'failed') return false;
  if (String(enabled4.jobError || '').trim()) return false;
  const projectLifecycleTaskIdentity = resolveProjectLifecycleTaskIdentity(enabled4, 'dreamina');
  if (!projectLifecycleTaskIdentity.taskId) return false;
  const value48 = String(enabled4.dreaminaTaskPhase || '')
      .trim()
      .toLowerCase(),
    value49 = String(enabled4.dreaminaTaskStatus || '')
      .trim()
      .toLowerCase();
  if (value48 === 'done' || value48 === 'failed') return false;
  if (value49 === 'failed') return false;
  return true;
}
function hasDreaminaUsableResult(value50) {
  const list7 = [value50?.images, value50?.videos].filter(Array.isArray);
  return list7.some((list8) =>
    list8.some((enabled6) => {
      if (!enabled6 || typeof enabled6 !== 'object') return false;
      return !!String(
        enabled6.localPath ||
          enabled6.originalLocalPath ||
          enabled6.displayLocalPath ||
          enabled6.thumbLocalPath ||
          enabled6.imageUrl ||
          enabled6.videoUrl ||
          enabled6.thumbUrl ||
          enabled6.sourceUrl ||
          '',
      ).trim();
    }),
  );
}
function hasDreaminaResultError(value51) {
  const list9 = [value51?.images, value51?.videos].filter(Array.isArray);
  if (list9.length === 0) return false;
  if (hasDreaminaUsableResult(value51)) return false;
  return list9.some((list10) =>
    list10.some(
      (error) =>
        error &&
        typeof error === 'object' &&
        String(error.error || error.message || '').trim(),
    ),
  );
}
function isAsyncResumeCandidateNode(enabled7) {
  if (!enabled7 || typeof enabled7 !== 'object') return false;
  const value52 = String(enabled7.type || '')
    .trim()
    .toLowerCase();
  if (!['ai-video', 'ai-image', 'source-video', 'source-image'].includes(value52)) return false;
  const projectLifecycleTaskIdentity2 = resolveProjectLifecycleTaskIdentity(enabled7, 'asyncModelApi');
  if (!projectLifecycleTaskIdentity2.taskId) return false;
  const enabled8 = projectLifecycleTaskIdentity2.provider;
  if (!enabled8 || enabled8 === 'runninghubwf' || enabled8 === 'runninghub' || enabled8 === 'dreamina')
    return false;
  const value53 = String(enabled7.asyncTaskKind || '')
    .trim()
    .toLowerCase();
  if (value53 === 'image' && !['ai-image', 'source-image'].includes(value52)) return false;
  if (value53 === 'video' && !['ai-video', 'source-video'].includes(value52)) return false;
  const value54 = String(enabled7.asyncTaskStatus || '')
    .trim()
    .toLowerCase();
  if (value54 === 'success' || value54 === 'failed' || value54 === 'idle' || value54 === 'cancelled')
    return false;
  return true;
}
function isRunningHubResumeCandidateNode(enabled9) {
  if (!enabled9 || typeof enabled9 !== 'object') return false;
  const value55 = String(enabled9.type || '')
    .trim()
    .toLowerCase();
  if (
    !['ai-video', 'ai-image', 'ai-audio', 'source-video', 'source-image', 'source-audio'].includes(
      value55,
    )
  )
    return false;
  const value56 = String(enabled9.provider || '')
      .trim()
      .toLowerCase(),
    value57 = String(enabled9.model || '').trim(),
    modelProvider2 = resolveModelProvider(value57, value56, { allowProviderHint: false }),
    isWorkflowModel2 = isWorkflowModel(value57, value56 || 'runninghubwf'),
    value58 = modelProvider2 === 'runninghub' && isModelApiModel(value57, 'runninghub'),
    value59 = value55 === 'ai-audio' && value56 === 'runninghubwf',
    value60 = value55 === 'source-video' && (value56 === 'runninghubwf' || isWorkflowModel2),
    value61 =
      value55 === 'source-image' &&
      (value56 === 'runninghubwf' || value56 === 'runninghub' || isWorkflowModel2 || value58),
    value62 = value55 === 'source-audio' && value56 === 'runninghubwf' && isWorkflowModel2,
    enabled10 =
      value61 ||
      value62 ||
      value60 ||
      value59 ||
      isWorkflowModel2 ||
      value58 ||
      value56 === 'runninghub' ||
      value56 === 'runninghubwf';
  if (!enabled10) return false;
  const projectLifecycleTaskIdentity3 = resolveProjectLifecycleTaskIdentity(enabled9, 'workflow');
  if (!projectLifecycleTaskIdentity3.taskId) return false;
  const value63 = String(enabled9.rhTaskStatus || '')
    .trim()
    .toLowerCase();
  if (value63 === 'success' || value63 === 'failed' || value63 === 'idle' || value63 === 'cancelled')
    return false;
  return true;
}
function buildDreaminaResumeBackupPayload({
  projectId: projectId,
  projectName: projectName2,
  multiData: multiData,
}) {
  const list11 = Array.isArray(multiData?.canvases) ? multiData.canvases : [],
    items = [];
  return (
    list11.forEach((state2) => {
      const canvasId = String(state2?.id || '').trim();
      if (!canvasId) return;
      const list12 = Array.isArray(state2?.nodes) ? state2.nodes : [];
      list12.forEach((generationDuration) => {
        const args2 = {
          canvasId: canvasId,
          nodeId: String(generationDuration.id || '').trim(),
          generationStartTime: Number(generationDuration.generationStartTime || 0),
          generationDuration:
            generationDuration.generationDuration == null ? null : Number(generationDuration.generationDuration || 0),
        };
        if (isDreaminaResumeCandidateNode(generationDuration)) {
          const dreaminaSubmitId = resolveProjectLifecycleTaskIdentity(generationDuration, 'dreamina'),
            value64 = {
              ...args2,
              kind: 'dreamina',
              dreaminaSubmitId: dreaminaSubmitId.taskId,
              dreaminaTaskStatus: String(generationDuration.dreaminaTaskStatus || '').trim(),
              dreaminaTaskPhase: String(generationDuration.dreaminaTaskPhase || '').trim(),
              dreaminaTaskLabel: String(generationDuration.dreaminaTaskLabel || '').trim(),
              dreaminaTaskStartedAt: dreaminaSubmitId.startedAt,
              dreaminaTaskLastCheckedAt: Number(generationDuration.dreaminaTaskLastCheckedAt || 0),
              dreaminaTaskRecovering: !!generationDuration.dreaminaTaskRecovering,
            };
          items.push(value64);
          return;
        }
        if (isAsyncResumeCandidateNode(generationDuration)) {
          const asyncTaskProvider = resolveProjectLifecycleTaskIdentity(generationDuration, 'asyncModelApi');
          items.push({
            ...args2,
            kind: 'async',
            nodeType: String(generationDuration.type || '')
              .trim()
              .toLowerCase(),
            asyncTaskProvider: asyncTaskProvider.provider,
            asyncTaskKind: String(generationDuration.asyncTaskKind || '').trim() || 'image',
            asyncTaskId: asyncTaskProvider.taskId,
            asyncTaskStatus: String(generationDuration.asyncTaskStatus || '').trim(),
            asyncTaskStartedAt: asyncTaskProvider.startedAt,
            asyncTaskRecovering: !!generationDuration.asyncTaskRecovering,
          });
          return;
        }
        if (!isRunningHubResumeCandidateNode(generationDuration)) return;
        const rhTaskId = resolveProjectLifecycleTaskIdentity(generationDuration, 'workflow');
        items.push({
          ...args2,
          kind: 'runninghub',
          nodeType: String(generationDuration.type || '')
            .trim()
            .toLowerCase(),
          rhTaskId: rhTaskId.taskId,
          rhTaskStatus: String(generationDuration.rhTaskStatus || '').trim(),
          rhTaskStartedAt: rhTaskId.startedAt,
          rhTaskRecovering: !!generationDuration.rhTaskRecovering,
          rhTaskUseOpenapiQuery: generationDuration.rhTaskUseOpenapiQuery === true,
        });
      });
    }),
    {
      projectId: projectId || 'default_v2_project',
      projectName: projectName2 || getUntitledProjectName(),
      timestamp: Date.now(),
      items: items,
    }
  );
}
function writeDreaminaResumeBackupSync(value65) {
  try {
    const dreaminaResumeBackupPayload = buildDreaminaResumeBackupPayload(value65);
    if (!Array.isArray(dreaminaResumeBackupPayload.items) || dreaminaResumeBackupPayload.items.length === 0) {
      window.localStorage?.removeItem(DREAMINA_RESUME_BACKUP_KEY);
      return;
    }
    window.localStorage?.setItem(DREAMINA_RESUME_BACKUP_KEY, JSON.stringify(dreaminaResumeBackupPayload));
  } catch (value66) {
    console.warn('[projectLifecycle] 写入即梦恢复兜底失败:', value66);
  }
}
function readDreaminaResumeBackupSync() {
  try {
    const enabled11 = window.localStorage?.getItem(DREAMINA_RESUME_BACKUP_KEY);
    if (!enabled11) return null;
    const enabled12 = JSON.parse(enabled11);
    if (!enabled12 || typeof enabled12 !== 'object') return null;
    if (!Array.isArray(enabled12.items) || enabled12.items.length === 0) return null;
    return enabled12;
  } catch (value67) {
    return (console.warn('[projectLifecycle] 读取即梦恢复兜底失败:', value67), null);
  }
}
function mergeDreaminaResumeBackupIntoMultiData(value68, enabled13, value69) {
  if (!enabled13 || typeof enabled13 !== 'object') return value68;
  if (String(enabled13.projectId || '') !== String(value69 || '')) return value68;
  const list13 = Array.isArray(enabled13.items) ? enabled13.items : [];
  if (list13.length === 0) return value68;
  const value70 = {
      ...(value68 || {}),
      canvases: Array.isArray(value68?.canvases)
        ? value68.canvases.map((args3) => ({
            ...args3,
            nodes: Array.isArray(args3?.nodes)
              ? args3.nodes.map((args4) => ({ ...args4 }))
              : [],
          }))
        : [],
    },
    map2 = new Map();
  return (
    list13.forEach((value71) => {
      const enabled14 = String(value71?.canvasId || '').trim(),
        enabled15 = String(value71?.nodeId || '').trim();
      if (!enabled14 || !enabled15) return;
      map2.set(enabled14 + '::' + enabled15, value71);
    }),
    value70.canvases.forEach((state3) => {
      const enabled16 = String(state3?.id || '').trim();
      if (!enabled16 || !Array.isArray(state3.nodes)) return;
      state3.nodes = state3.nodes.map((args5) => {
        const value72 = String(args5?.id || '').trim(),
          rhTaskUseOpenapiQuery = map2.get(enabled16 + '::' + value72);
        if (!rhTaskUseOpenapiQuery) return args5;
        if (
          String(rhTaskUseOpenapiQuery?.kind || '')
            .trim()
            .toLowerCase() === 'dreamina'
        ) {
          if (hasDreaminaResultError(args5)) return args5;
          const value73 = String(args5?.jobStatus || '')
            .trim()
            .toLowerCase();
          if (value73 === 'error' || value73 === 'failed') return args5;
          const value74 = {};
          for (const value75 of DREAMINA_RESUME_BACKUP_FIELDS) {
            Object.hasOwn(rhTaskUseOpenapiQuery, value75) && (value74[value75] = rhTaskUseOpenapiQuery[value75]);
          }
          const dreaminaTaskLastRaw =
            Object.hasOwn(rhTaskUseOpenapiQuery, 'dreaminaTaskLastRaw') &&
            rhTaskUseOpenapiQuery.dreaminaTaskLastRaw &&
            typeof rhTaskUseOpenapiQuery.dreaminaTaskLastRaw === 'object' &&
            !Array.isArray(rhTaskUseOpenapiQuery.dreaminaTaskLastRaw)
              ? rhTaskUseOpenapiQuery.dreaminaTaskLastRaw
              : null;
          return {
            ...args5,
            generationStartTime:
              Number(value74.generationStartTime) > 0
                ? Number(value74.generationStartTime)
                : Number(args5?.generationStartTime || 0),
            generationDuration: null,
            dreaminaSubmitId: String(value74.dreaminaSubmitId || '').trim(),
            dreaminaTaskStatus: String(value74.dreaminaTaskStatus || '').trim(),
            dreaminaTaskPhase: String(value74.dreaminaTaskPhase || '').trim(),
            dreaminaTaskLabel: String(value74.dreaminaTaskLabel || '').trim(),
            dreaminaTaskStartedAt: Number(value74.dreaminaTaskStartedAt || 0),
            dreaminaTaskLastCheckedAt: Number(value74.dreaminaTaskLastCheckedAt || 0),
            dreaminaTaskRecovering: true,
            dreaminaTaskLastRaw: dreaminaTaskLastRaw || {},
          };
        }
        if (
          String(rhTaskUseOpenapiQuery?.kind || '')
            .trim()
            .toLowerCase() !== 'runninghub'
        ) {
          if (
            String(rhTaskUseOpenapiQuery?.kind || '')
              .trim()
              .toLowerCase() !== 'async'
          )
            return args5;
          const value76 = String(rhTaskUseOpenapiQuery?.nodeType || '')
              .trim()
              .toLowerCase(),
            value77 = String(args5?.type || '')
              .trim()
              .toLowerCase();
          if (value76 && value77 && value76 !== value77) return args5;
          const asyncTaskProvider2 = inferAsyncProviderByModel(
            args5?.model,
            rhTaskUseOpenapiQuery.asyncTaskProvider ||
              args5?.asyncTaskProvider ||
              args5?.provider ||
              '',
          );
          return {
            ...args5,
            generationStartTime:
              Number(rhTaskUseOpenapiQuery.generationStartTime) > 0
                ? Number(rhTaskUseOpenapiQuery.generationStartTime)
                : Number(args5?.generationStartTime || 0),
            generationDuration: null,
            asyncTaskProvider: asyncTaskProvider2,
            asyncTaskKind: String(rhTaskUseOpenapiQuery.asyncTaskKind || '').trim() || 'image',
            asyncTaskId: String(rhTaskUseOpenapiQuery.asyncTaskId || '').trim(),
            asyncTaskStatus: String(rhTaskUseOpenapiQuery.asyncTaskStatus || '').trim() || 'pending',
            asyncTaskStartedAt: Number(rhTaskUseOpenapiQuery.asyncTaskStartedAt || 0),
            asyncTaskRecovering: true,
          };
        }
        const value78 = String(rhTaskUseOpenapiQuery?.nodeType || '')
            .trim()
            .toLowerCase(),
          value79 = String(args5?.type || '')
            .trim()
            .toLowerCase();
        if (value78 && value79 && value78 !== value79) return args5;
        return {
          ...args5,
          generationStartTime:
            Number(rhTaskUseOpenapiQuery.generationStartTime) > 0
              ? Number(rhTaskUseOpenapiQuery.generationStartTime)
              : Number(args5?.generationStartTime || 0),
          generationDuration: null,
          rhTaskId: String(rhTaskUseOpenapiQuery.rhTaskId || '').trim(),
          rhTaskStatus: String(rhTaskUseOpenapiQuery.rhTaskStatus || '').trim() || 'pending',
          rhTaskStartedAt: Number(rhTaskUseOpenapiQuery.rhTaskStartedAt || 0),
          rhTaskRecovering: true,
          rhTaskUseOpenapiQuery: rhTaskUseOpenapiQuery.rhTaskUseOpenapiQuery === true,
        };
      });
    }),
    value70
  );
}
function buildCanvasRecordSignature(
  id,
  _persistRevHint = id?._persistRevHint,
  _contentPersistRevHint = id?._contentPersistRevHint,
) {
  const visualSnapshot =
      id?.visualSnapshot && typeof id.visualSnapshot === 'object'
        ? {
            schemaVersion: Number(id.visualSnapshot.schemaVersion) || 1,
            srcLength: String(id.visualSnapshot.src || '').length,
            width: Number(id.visualSnapshot.width) || 0,
            height: Number(id.visualSnapshot.height) || 0,
            capturedAt: Number(id.visualSnapshot.capturedAt) || 0,
            visibleNodeCount: Number(id.visualSnapshot.visibleNodeCount) || 0,
            mediaNodeCount: Number(id.visualSnapshot.mediaNodeCount) || 0,
            readyMediaNodeCount: Number(id.visualSnapshot.readyMediaNodeCount) || 0,
          }
        : null,
    value80 = Number.isFinite(_persistRevHint);
  if (Number.isFinite(_contentPersistRevHint))
    return createStableSignature({
      _contentPersistRevHint: _contentPersistRevHint,
      nodesLength: Array.isArray(id?.nodes) ? id.nodes.length : 0,
      edgesLength: Array.isArray(id?.edges) ? id.edges.length : 0,
      assetsLength: Array.isArray(id?.assets) ? id.assets.length : 0,
      visualSnapshot: visualSnapshot,
    });
  if (value80) {
    const box8 =
      id?.viewport && typeof id.viewport === 'object' ? id.viewport : {};
    return createStableSignature({
      _persistRevHint: _persistRevHint,
      viewport: {
        x: Number.isFinite(box8?.x) ? box8.x : 0,
        y: Number.isFinite(box8?.y) ? box8.y : 0,
        zoom: Number.isFinite(box8?.zoom) ? box8.zoom : 1.1,
      },
      nodesLength: Array.isArray(id?.nodes) ? id.nodes.length : 0,
      edgesLength: Array.isArray(id?.edges) ? id.edges.length : 0,
      assetsLength: Array.isArray(id?.assets) ? id.assets.length : 0,
      visualSnapshot: visualSnapshot,
    });
  }
  return createStableSignature({
    id: id?.id ?? null,
    name: id?.name ?? getUntitledCanvasName(),
    nodes: Array.isArray(id?.nodes) ? id.nodes : [],
    edges: Array.isArray(id?.edges) ? id.edges : [],
    viewport:
      id?.viewport && typeof id.viewport === 'object'
        ? id.viewport
        : { x: 0, y: 0, zoom: 1.1 },
    assets: Array.isArray(id?.assets) ? id.assets : [],
    visualSnapshot: visualSnapshot,
  });
}
export function buildWorkspaceShardRecords(value81) {
  const projectId2 = value81?.projectId || 'default_v2_project',
    projectName3 = value81?.projectName || getUntitledProjectName(),
    canvasOrder = Array.isArray(value81?.multiData?.canvases)
      ? value81.multiData.canvases
      : [],
    activeCanvasId2 = value81?.multiData?.activeCanvasId || canvasOrder[0]?.id || null,
    projectContexts = Array.isArray(value81?.multiData?.projectContexts)
      ? value81.multiData.projectContexts
          .filter((value82) => value82?.canvasId)
          .map((args6) => ({ ...args6 }))
      : [],
    workspaceScopeVersion = Number(value81?.workspaceScopeVersion) === 1 ? 1 : 0,
    value83 = value81?.multiDataSanitized === true,
    map3 = new Map(
      (Array.isArray(value81?.persistenceRevision?.canvases)
        ? value81.persistenceRevision.canvases
        : [])
        .filter((value84) => value84?.id && Number.isFinite(value84?.persistRev))
        .map((value85) => [String(value85.id), Number(value85.persistRev)]),
    ),
    map4 = new Map(
      (Array.isArray(value81?.persistenceRevision?.canvases)
        ? value81.persistenceRevision.canvases
        : [])
        .filter((value86) => value86?.id && Number.isFinite(value86?.contentPersistRev))
        .map((value87) => [String(value87.id), Number(value87.contentPersistRev)]),
    ),
    _timestamp = Date.now(),
    metaRecord = {
      cacheVersion: 2,
      projectId: projectId2,
      projectName: projectName3,
      workspaceScopeVersion: workspaceScopeVersion,
      activeCanvasId: activeCanvasId2,
      projectContexts: projectContexts,
      canvasOrder: canvasOrder.map((id2) => ({
        id: id2?.id ?? null,
        name: id2?.name ?? getUntitledCanvasName(),
        viewport:
          id2?.viewport && typeof id2.viewport === 'object'
            ? {
                x: Number(id2.viewport.x) || 0,
                y: Number(id2.viewport.y) || 0,
                zoom: Number(id2.viewport.zoom) || 1.1,
              }
            : { x: 0, y: 0, zoom: 1.1 },
      })),
      _timestamp: _timestamp,
    },
    canvasRecords = canvasOrder.map((id3) => {
      const value88 = String(id3?.id || ''),
        value89 = map3.get(value88),
        value90 = map4.get(value88),
        _persistRevHint2 = Number.isFinite(id3?._persistRevHint)
          ? Number(id3._persistRevHint)
          : value89,
        _contentPersistRevHint2 = Number.isFinite(id3?._contentPersistRevHint)
          ? Number(id3._contentPersistRevHint)
          : value90,
        record2 = {
          id: id3?.id ?? null,
          name: id3?.name ?? getUntitledCanvasName(),
          _persistRevHint: _persistRevHint2,
          _contentPersistRevHint: _contentPersistRevHint2,
          nodes: Array.isArray(id3?.nodes) ? id3.nodes : [],
          edges: Array.isArray(id3?.edges) ? id3.edges : [],
          viewport:
            id3?.viewport && typeof id3.viewport === 'object'
              ? id3.viewport
              : { x: 0, y: 0, zoom: 1.1 },
          assets: Array.isArray(id3?.assets) ? id3.assets : [],
          storyboard3dProjects: Array.isArray(id3?.storyboard3dProjects)
            ? id3.storyboard3dProjects
            : [],
          visualSnapshot:
            id3?.visualSnapshot && typeof id3.visualSnapshot === 'object'
              ? id3.visualSnapshot
              : undefined,
          _timestamp: _timestamp,
        },
        persistedRecord = value83 ? { ...record2 } : sanitizeSerializedCanvasData(record2);
      return (
        value83 && (delete persistedRecord._persistRevHint, delete persistedRecord._contentPersistRevHint),
        {
          key: buildWorkspaceCanvasKey(record2.id),
          record: record2,
          persistedRecord: persistedRecord,
          signature: buildCanvasRecordSignature(persistedRecord, _persistRevHint2, _contentPersistRevHint2),
        }
      );
    });
  return {
    metaRecord: metaRecord,
    metaSignature: createStableSignature({
      cacheVersion: metaRecord.cacheVersion,
      projectId: metaRecord.projectId,
      projectName: metaRecord.projectName,
      workspaceScopeVersion: metaRecord.workspaceScopeVersion,
      activeCanvasId: metaRecord.activeCanvasId,
      projectContexts: metaRecord.projectContexts,
      canvasOrder: metaRecord.canvasOrder,
    }),
    canvasRecords: canvasRecords,
  };
}
export function restoreWorkspacePayloadFromShardRecords(projectId3, value91) {
  // Strict, positional validation: one malformed shard invalidates the whole cache
  // instead of being silently patched into an empty canvas. The 0.8.0 rewrite made
  // this permissive (bad `nodes` became `[]`); the guard is restored here.
  if (
    !Array.isArray(projectId3?.canvasOrder) ||
    !projectId3.canvasOrder.length ||
    !Array.isArray(value91) ||
    value91.length !== projectId3.canvasOrder.length ||
    typeof projectId3.projectId !== 'string' ||
    !projectId3.projectId.trim()
  )
    return null;
  const seenCanvasIds = new Set();
  for (let index = 0; index < projectId3.canvasOrder.length; index += 1) {
    const orderEntry = projectId3.canvasOrder[index],
      canvasId = orderEntry?.id,
      shard = value91[index];
    if (
      typeof canvasId !== 'string' ||
      !canvasId.trim() ||
      seenCanvasIds.has(canvasId) ||
      !shard ||
      typeof shard !== 'object' ||
      Array.isArray(shard) ||
      shard.id !== canvasId ||
      !Array.isArray(shard.nodes) ||
      !Array.isArray(shard.edges) ||
      (shard.assets != null && !Array.isArray(shard.assets)) ||
      (shard.storyboard3dProjects != null && !Array.isArray(shard.storyboard3dProjects))
    )
      return null;
    seenCanvasIds.add(canvasId);
  }
  if (projectId3.activeCanvasId && !seenCanvasIds.has(projectId3.activeCanvasId)) return null;
  const map5 = new Map();
  for (const id4 of value91 || []) {
    if (!id4 || !id4.id) continue;
    map5.set(id4.id, {
      id: id4.id,
      name: id4.name || getUntitledCanvasName(),
      _persistRevHint: Number.isFinite(id4?._persistRevHint)
        ? id4._persistRevHint
        : undefined,
      _contentPersistRevHint: Number.isFinite(id4?._contentPersistRevHint)
        ? id4._contentPersistRevHint
        : undefined,
      nodes: Array.isArray(id4.nodes) ? id4.nodes : [],
      edges: Array.isArray(id4.edges) ? id4.edges : [],
      viewport:
        id4.viewport && typeof id4.viewport === 'object'
          ? id4.viewport
          : { x: 0, y: 0, zoom: 1.1 },
      assets: Array.isArray(id4.assets) ? id4.assets : [],
      storyboard3dProjects: Array.isArray(id4.storyboard3dProjects)
        ? id4.storyboard3dProjects
        : [],
      visualSnapshot:
        id4.visualSnapshot && typeof id4.visualSnapshot === 'object'
          ? id4.visualSnapshot
          : null,
    });
  }
  const canvases2 = [];
  for (const name of projectId3.canvasOrder) {
    const enabled17 = name?.id;
    if (!enabled17) return null;
    const error2 = map5.get(enabled17);
    if (!error2) return null;
    canvases2.push({
      ...error2,
      name: name?.name || error2.name || getUntitledCanvasName(),
      viewport:
        name?.viewport && typeof name.viewport === 'object'
          ? { ...name.viewport }
          : error2.viewport,
    });
  }
  return {
    projectId: projectId3.projectId || 'default_v2_project',
    projectName: projectId3.projectName || getUntitledProjectName(),
    workspaceScopeVersion: Number(projectId3.workspaceScopeVersion) === 1 ? 1 : 0,
    multiData: {
      canvases: canvases2,
      activeCanvasId: projectId3.activeCanvasId || canvases2[0]?.id || null,
      projectContexts: Array.isArray(projectId3.projectContexts)
        ? projectId3.projectContexts.map((args7) => ({ ...args7 }))
        : [],
    },
  };
}
export function buildRecoverySnapshotSignature({
  meta: meta,
  multiData: multiData2,
  persistenceRevision: persistenceRevision = null,
}) {
  const persistenceRevision2 =
    persistenceRevision && typeof persistenceRevision === 'object'
      ? {
          activeCanvasId: persistenceRevision.activeCanvasId || null,
          canvases: (Array.isArray(persistenceRevision.canvases)
            ? persistenceRevision.canvases
            : []).map((id5) => ({
            id: id5?.id || null,
            name: id5?.name || '',
            persistRev: Number.isFinite(id5?.contentPersistRev)
              ? Number(id5.contentPersistRev)
              : Number(id5?.persistRev) || 0,
          })),
        }
      : null;
  return createStableSignature({
    ...(meta || {}),
    ...(persistenceRevision2 ? { persistenceRevision: persistenceRevision2 } : { multiData: multiData2 }),
  });
}
function hasCompleteContentPersistenceRevision(value92) {
  const list14 = Array.isArray(value92?.canvases) ? value92.canvases : [];
  return (
    list14.length > 0 &&
    list14.every((value93) => Number.isFinite(value93?.contentPersistRev))
  );
}
export function shouldWritePeriodicRecoverySnapshot({ isChromeShell: isChromeShell = false } = {}) {
  return isChromeShell !== true;
}
export function createProjectLifecycle({
  store: store,
  CanvasTabManager: CanvasTabManager,
  project: project,
  loadCustomPresets: loadCustomPresets,
  migrateLegacyThumbnailsInMultiData: migrateLegacyThumbnailsInMultiData,
  sanitizeMultiCanvasDataForPersistence: sanitizeMultiCanvasDataForPersistence2,
  commit: commit,
  patchStoreSourceNodeNamesFromFileName: patchStoreSourceNodeNamesFromFileName,
  applySourceNamesFromFileNameToCanvas: applySourceNamesFromFileNameToCanvas,
}) {
  let value94 = '',
    value95 = '';
  const map6 = new Map();
  let value96 = new Set(),
    enabled18 = false,
    value97 = null,
    enabled19 = false,
    value98 = null,
    count9 = 0,
    setTimeout2 = null,
    recoveryWriteWarningShown = false,
    promise = null,
    value99 = '',
    value100 = '',
    value101 = 0,
    value102 = null,
    value103 = false,
    handler3 = () => {};
  function run2() {
    ((value94 = ''), (value95 = ''), map6.clear(), (value96 = new Set()), (enabled18 = false));
  }
  function run3(projectId4) {
    const value104 = {
        projectId: projectId4?.projectId || 'default_v2_project',
        projectName: projectId4?.projectName || getUntitledProjectName(),
        workspaceScopeVersion: Number(projectId4?.workspaceScopeVersion) === 1 ? 1 : 0,
        multiData: projectId4?.multiData || { canvases: [], activeCanvasId: null },
      },
      { metaSignature: metaSignature, canvasRecords: canvasRecords2 } = buildWorkspaceShardRecords(value104);
    ((value94 = value104.projectId),
      (value95 = metaSignature),
      map6.clear(),
      (value96 = new Set()),
      canvasRecords2.forEach(({ record: record3, signature: signature }) => {
        if (!record3?.id) return;
        (map6.set(record3.id, signature), value96.add(record3.id));
      }),
      (enabled18 = true));
  }
  const V2LocalCache = {
    dbName: 'TapNowV2Cache',
    storeName: 'workspace',
    version: 1,
    _dbPromise: null,
    async initDB() {
      if (this._dbPromise) return this._dbPromise;
      return (
        (this._dbPromise = new Promise((handler4, handler5) => {
          const value105 = indexedDB.open(this.dbName, this.version);
          ((value105.onupgradeneeded = (event) => {
            const enabled20 = event.target.result;
            !enabled20.objectStoreNames.contains(this.storeName) &&
              enabled20.createObjectStore(this.storeName);
          }),
            (value105.onsuccess = (event2) => {
              const value106 = event2.target.result;
              ((value106.onversionchange = () => {
                (value106.close(), (this._dbPromise = null));
              }),
                handler4(value106));
            }),
            (value105.onerror = (event3) => {
              ((this._dbPromise = null), handler5(event3.target.error));
            }));
        })),
        this._dbPromise
      );
    },
    async getRecord(value107) {
      const value108 = await this.initDB();
      return new Promise((handler6, handler7) => {
        const value109 = value108.transaction(this.storeName, 'readonly'),
          map7 = value109.objectStore(this.storeName),
          value110 = map7.get(value107);
        ((value110.onsuccess = (event4) => handler6(event4.target.result ?? null)),
          (value110.onerror = (event5) => handler7(event5.target.error)));
      });
    },
    async getRecords(list15) {
      const value111 = await this.initDB();
      return new Promise((value112, value113) => {
        const value114 = value111.transaction(this.storeName, 'readonly'),
          map8 = value114.objectStore(this.storeName),
          value115 = list15.map(
            (value116) =>
              new Promise((handler8, handler9) => {
                const value117 = map8.get(value116);
                ((value117.onsuccess = (event6) => handler8(event6.target.result ?? null)),
                  (value117.onerror = (event7) => handler9(event7.target.error)));
              }),
          );
        Promise.all(value115).then(value112).catch(value113);
      });
    },
    async listKeys() {
      const value118 = await this.initDB();
      return new Promise((handler10, handler11) => {
        const value119 = value118.transaction(this.storeName, 'readonly'),
          value120 = value119.objectStore(this.storeName),
          value121 = value120.getAllKeys();
        ((value121.onsuccess = (event8) => handler10(event8.target.result || [])),
          (value121.onerror = (event9) => handler11(event9.target.error)));
      });
    },
    async save(projectId5) {
      try {
        const value122 = {
            projectId: projectId5?.projectId || 'default_v2_project',
            projectName: projectId5?.projectName || getUntitledProjectName(),
            workspaceScopeVersion: Number(projectId5?.workspaceScopeVersion) === 1 ? 1 : 0,
            multiData: projectId5?.multiData || { canvases: [], activeCanvasId: null },
            multiDataSanitized: projectId5?.multiDataSanitized === true,
            persistenceRevision: projectId5?.persistenceRevision || null,
          },
          {
            metaRecord: metaRecord2,
            metaSignature: metaSignature2,
            canvasRecords: canvasRecords3,
          } = buildWorkspaceShardRecords(value122),
          value123 = await this.initDB(),
          list16 = canvasRecords3.map(({ record: record4 }) => String(record4?.id || '').trim()).filter(Boolean),
          map9 = new Set(list16),
          map10 = new Set(list16.map((value124) => buildWorkspaceCanvasKey(value124))),
          value125 = value94 !== value122.projectId,
          value126 = value125 || !enabled18 || (value96.size === 0 && canvasRecords3.length > 0);
        let list17 = [];
        if (value125) value126 && (await this.listKeys());
        else {
          if (enabled18)
            list17 = Array.from(value96)
              .filter((value127) => !map9.has(value127))
              .map((value128) => buildWorkspaceCanvasKey(value128));
          else {
            if (value126) {
              const list18 = await this.listKeys(),
                list19 = list18.filter((value129) =>
                  String(value129).startsWith(WORKSPACE_CANVAS_KEY_PREFIX),
                );
              list17 = list19.filter((value130) => !map10.has(value130));
            }
          }
        }
        const list20 = canvasRecords3.filter(
            ({ record: record5, signature: signature2 }) =>
              value125 || map6.get(record5.id) !== signature2,
          ),
          enabled21 = value125 || value95 !== metaSignature2;
        if (!enabled21 && list20.length === 0 && list17.length === 0) return;
        return new Promise((handler12, handler13) => {
          const value131 = value123.transaction(this.storeName, 'readwrite'),
            map11 = value131.objectStore(this.storeName);
          (enabled21 && map11.put(metaRecord2, WORKSPACE_META_KEY),
            list20.forEach(({ key: key2, persistedRecord: persistedRecord2 }) => {
              map11.put(persistedRecord2, key2);
            }),
            list17.forEach((value132) => {
              map11.delete(value132);
            }),
            (value131.oncomplete = () => {
              ((value94 = value122.projectId), (value95 = metaSignature2));
              const list21 = new Map();
              (canvasRecords3.forEach(({ record: record6, signature: signature3 }) => {
                if (!record6?.id) return;
                list21.set(record6.id, signature3);
              }),
                map6.clear(),
                (value96 = new Set()),
                list21.forEach((value133, value134) => {
                  (map6.set(value134, value133), value96.add(value134));
                }),
                (enabled18 = true),
                handler12());
            }),
            (value131.onerror = (event10) => handler13(event10.target.error)),
            (value131.onabort = (event11) => handler13(event11.target.error)));
        });
      } catch (value135) {
        console.warn('[V2LocalCache] Save failed:', value135);
      }
    },
    async load() {
      try {
        const metaRecord = await this.getRecord(WORKSPACE_META_KEY);
        if (metaRecord != null) {
          // A meta record that exists but is malformed is a damaged cache, not an
          // absent one, so it must not fall through to the legacy path.
          if (
            metaRecord.cacheVersion !== 2 ||
            !Array.isArray(metaRecord.canvasOrder) ||
            !metaRecord.canvasOrder.length
          )
            throw unsafeRecoveryError();
          const canvasKeys = metaRecord.canvasOrder.map((orderEntry) =>
              buildWorkspaceCanvasKey(orderEntry?.id),
            ),
            shardRecords = await this.getRecords(canvasKeys),
            restored = restoreWorkspacePayloadFromShardRecords(metaRecord, shardRecords);
          if (!restored?.multiData?.canvases?.length) throw unsafeRecoveryError();
          return (run3(restored), restored);
        }
        const legacyRecord = await this.getRecord(LEGACY_WORKSPACE_KEY);
        if (legacyRecord != null) {
          if (
            typeof legacyRecord.projectId !== 'string' ||
            !legacyRecord.projectId.trim() ||
            !Array.isArray(legacyRecord?.multiData?.canvases) ||
            !legacyRecord.multiData.canvases.length ||
            legacyRecord.multiData.canvases.some(
              (canvas) => canvas?.nodes == null || canvas?.edges == null,
            )
          )
            throw unsafeRecoveryError();
          requireProjectDocument(legacyRecord.multiData);
          return (run2(), legacyRecord);
        }
        return (run2(), null);
      } catch (loadError) {
        console.warn('[V2LocalCache] Load failed:', loadError);
        run2();
        // A rejected IndexedDB read cannot prove the cache is absent; fail closed.
        throw unsafeRecoveryError();
      }
    },
    async saveProjectSession(projectName4) {
      const projectId6 = normalizeProjectWorkspaceId(projectName4?.projectId);
      if (!projectId6)
        throw new Error('[V2LocalCache] Project workspace session requires projectId');
      const value142 = {
          projectId: projectId6,
          projectName: projectName4?.projectName || getUntitledProjectName(),
          workspaceScopeVersion: 1,
          multiData: projectName4?.multiData || { canvases: [], activeCanvasId: null },
        },
        { metaRecord: metaRecord3, canvasRecords: canvasRecords4 } = buildWorkspaceShardRecords(value142),
        projectWorkspaceMetaKey = buildProjectWorkspaceMetaKey(projectId6),
        value143 = await this.getRecord(projectWorkspaceMetaKey),
        map12 = new Set(
          canvasRecords4.map(({ record: record7 }) => String(record7?.id || '').trim()).filter(
            Boolean,
          ),
        ),
        list22 = Array.isArray(value143?.canvasOrder)
          ? value143.canvasOrder
              .map((value144) => String(value144?.id || '').trim())
              .filter((value145) => value145 && !map12.has(value145))
              .map((value146) => buildProjectWorkspaceCanvasKey(projectId6, value146))
          : [],
        value147 = await this.initDB();
      return new Promise((handler14, handler15) => {
        const value148 = value147.transaction(this.storeName, 'readwrite'),
          map13 = value148.objectStore(this.storeName);
        (map13.put(
          {
            ...metaRecord3,
            projectId: projectId6,
            sessionVersion: 1,
            hasUnsavedChanges: projectName4?.hasUnsavedChanges !== false,
          },
          projectWorkspaceMetaKey,
        ),
          canvasRecords4.forEach(({ record: record8, persistedRecord: persistedRecord3 }) => {
            map13.put(persistedRecord3, buildProjectWorkspaceCanvasKey(projectId6, record8.id));
          }),
          list22.forEach((value149) => map13.delete(value149)),
          (value148.oncomplete = () => handler14({ success: true, projectId: projectId6 })),
          (value148.onerror = (event12) => handler15(event12.target.error)),
          (value148.onabort = (event13) => handler15(event13.target.error)));
      });
    },
    async loadProjectSession(value150) {
      const projectId7 = normalizeProjectWorkspaceId(value150);
      if (!projectId7) return null;
      try {
        const hasUnsavedChanges = await this.getRecord(buildProjectWorkspaceMetaKey(projectId7));
        if (hasUnsavedChanges?.sessionVersion !== 1 || !Array.isArray(hasUnsavedChanges.canvasOrder)) return null;
        const value151 = await this.getRecords(
            hasUnsavedChanges.canvasOrder.map((value152) =>
              buildProjectWorkspaceCanvasKey(projectId7, value152?.id),
            ),
          ),
          args8 = restoreWorkspacePayloadFromShardRecords(hasUnsavedChanges, value151);
        if (!args8?.multiData?.canvases?.length) return null;
        return {
          ...args8,
          projectId: projectId7,
          hasUnsavedChanges: hasUnsavedChanges.hasUnsavedChanges !== false,
          session: true,
        };
      } catch (value153) {
        return (console.warn('[V2LocalCache] Load project workspace session failed:', value153), null);
      }
    },
    async clearProjectSession(value154) {
      const projectId8 = normalizeProjectWorkspaceId(value154);
      if (!projectId8) return { success: false, reason: 'missing-project-id' };
      try {
        const projectWorkspaceMetaKey2 = buildProjectWorkspaceMetaKey(projectId8),
          value155 = await this.getRecord(projectWorkspaceMetaKey2),
          list23 = Array.isArray(value155?.canvasOrder)
            ? value155.canvasOrder
                .map((value156) => String(value156?.id || '').trim())
                .filter(Boolean)
                .map((value157) => buildProjectWorkspaceCanvasKey(projectId8, value157))
            : [],
          value158 = await this.initDB();
        return new Promise((handler16, handler17) => {
          const value159 = value158.transaction(this.storeName, 'readwrite'),
            map14 = value159.objectStore(this.storeName);
          (map14.delete(projectWorkspaceMetaKey2),
            list23.forEach((value160) => map14.delete(value160)),
            (value159.oncomplete = () => handler16({ success: true, projectId: projectId8 })),
            (value159.onerror = (event14) => handler17(event14.target.error)),
            (value159.onabort = (event15) => handler17(event15.target.error)));
        });
      } catch (error3) {
        return (
          console.warn('[V2LocalCache] Clear project workspace session failed:', error3),
          { success: false, projectId: projectId8, error: error3 }
        );
      }
    },
    async clear() {
      try {
        const value161 = await this.initDB(),
          list24 = await this.listKeys(),
          list25 = list24.filter((value162) => {
            const value163 = String(value162);
            return (
              value163 === LEGACY_WORKSPACE_KEY ||
              value163 === WORKSPACE_META_KEY ||
              value163.startsWith(WORKSPACE_CANVAS_KEY_PREFIX) ||
              value163.startsWith(PROJECT_WORKSPACE_META_KEY_PREFIX) ||
              value163.startsWith(PROJECT_WORKSPACE_CANVAS_KEY_PREFIX)
            );
          });
        return new Promise((handler18, handler19) => {
          const value164 = value161.transaction(this.storeName, 'readwrite'),
            map15 = value164.objectStore(this.storeName);
          (list25.forEach((value165) => map15.delete(value165)),
            (value164.oncomplete = () => {
              (run2(), handler18());
            }),
            (value164.onerror = (event16) => handler19(event16.target.error)),
            (value164.onabort = (event17) => handler19(event17.target.error)));
        });
      } catch (value166) {
        console.warn('[V2LocalCache] Clear failed:', value166);
      }
    },
  };
  window.V2LocalCache = V2LocalCache;
  const projectWorkspaceSessions = Object.freeze({
    save(value167) {
      return V2LocalCache.saveProjectSession(value167);
    },
    load(value168) {
      return V2LocalCache.loadProjectSession(value168);
    },
    clear(value169) {
      return V2LocalCache.clearProjectSession(value169);
    },
    async move(value170, value171, { projectName: projectName = '' } = {}) {
      const projectWorkspaceId = normalizeProjectWorkspaceId(value170),
        projectId9 = normalizeProjectWorkspaceId(value171);
      if (!projectWorkspaceId || !projectId9 || projectWorkspaceId === projectId9) return null;
      const hasUnsavedChanges2 = await V2LocalCache.loadProjectSession(projectWorkspaceId);
      if (!hasUnsavedChanges2) return null;
      const value172 = await V2LocalCache.saveProjectSession({
        ...hasUnsavedChanges2,
        projectId: projectId9,
        projectName: projectName || hasUnsavedChanges2.projectName,
        hasUnsavedChanges: hasUnsavedChanges2.hasUnsavedChanges,
      });
      return (await V2LocalCache.clearProjectSession(projectWorkspaceId), value172);
    },
  });
  function run4(value173) {
    if (typeof performance?.mark !== 'function') return;
    performance.mark(value173);
  }
  function run5(value174, value175, value176) {
    if (typeof performance?.measure !== 'function') return;
    try {
      performance.measure(value174, value175, value176);
    } catch {}
  }
  function run6() {
    if (window.__perfDebug !== true) return;
    if (typeof performance?.getEntriesByName !== 'function') return;
    BOOT_PERF_MEASURE_NAMES.forEach((value177) => {
      const list26 = performance.getEntriesByName(value177),
        enabled22 = list26[list26.length - 1];
      if (!enabled22) return;
      console.log('[perf] ' + value177 + ': ' + enabled22.duration.toFixed(1) + 'ms');
    });
  }
  function run7({
    projectId: projectId10,
    projectName: projectName5,
    multiData: multiData3,
    multiDataSanitized: multiDataSanitized = false,
    persistenceRevision: persistenceRevision = null,
  }) {
    return {
      projectId: projectId10,
      projectName: projectName5,
      workspaceScopeVersion: window._v2WorkspaceProjectScoped === true ? 1 : 0,
      multiData: multiData3 || {},
      multiDataSanitized: multiDataSanitized,
      persistenceRevision: persistenceRevision,
    };
  }
  function run8({
    projectId: projectId11,
    projectName: projectName6,
    multiData: multiData4,
    multiDataSanitized: multiDataSanitized = false,
    persistenceRevision: persistenceRevision = null,
  }) {
    const value178 = run7({
      projectId: projectId11,
      projectName: projectName6,
      multiData: multiData4,
      multiDataSanitized: multiDataSanitized,
      persistenceRevision: persistenceRevision,
    });
    return (writeDreaminaResumeBackupSync(value178), V2LocalCache.save(value178));
  }
  function run9(
    enabled23,
    {
      sanitizeForPersistence: sanitizeForPersistence = false,
      captureVisualSnapshot: captureVisualSnapshot = false,
      includeProjectContexts: includeProjectContexts = false,
    } = {},
  ) {
    if (!enabled23) return null;
    if (typeof enabled23.getMultiDataSnapshot === 'function')
      return enabled23.getMultiDataSnapshot({
        sanitizeForPersistence: sanitizeForPersistence,
        captureVisualSnapshot: captureVisualSnapshot,
        includeProjectContexts: includeProjectContexts,
      });
    if (typeof enabled23.getMultiData === 'function') return enabled23.getMultiData();
    return null;
  }
  function run10() {
    const persistenceRevision3 = CanvasTabManager?.getPersistenceRevisionSnapshot?.() || null;
    if (!persistenceRevision3) return { cacheKey: '', persistenceRevision: null };
    const projectContexts2 =
      typeof CanvasTabManager?.getCanvasProjectContext === 'function'
        ? (persistenceRevision3.canvases || []).map((value179) => ({
            canvasId: String(value179?.id || ''),
            context: CanvasTabManager.getCanvasProjectContext(value179?.id) || null,
          }))
        : null;
    return {
      persistenceRevision: persistenceRevision3,
      cacheKey: createStableSignature({
        persistenceRevision: persistenceRevision3,
        projectContexts: projectContexts2,
        project: project2(),
      }),
    };
  }
  function run11(cacheKey = run10()) {
    const createdAt = Date.now();
    if (
      cacheKey.cacheKey &&
      value102?.cacheKey === cacheKey.cacheKey &&
      createdAt - value102.createdAt <= PERSISTABLE_SNAPSHOT_REUSE_MS
    )
      return value102;
    const value180 = typeof CanvasTabManager?.getPersistableMultiDataSnapshot === 'function',
      value181 = value180
        ? CanvasTabManager.getPersistableMultiDataSnapshot({ includeProjectContexts: true })
        : run9(CanvasTabManager, { sanitizeForPersistence: false, includeProjectContexts: true }),
      multiData5 = value180 ? value181 || {} : sanitizeMultiCanvasDataForPersistence_2(value181 || {}),
      value182 = {
        cacheKey: cacheKey.cacheKey,
        createdAt: createdAt,
        multiData: multiData5,
        persistenceRevision: cacheKey.persistenceRevision,
      };
    return ((value102 = cacheKey.cacheKey ? value182 : null), value182);
  }
  function projectName7() {
    return document.getElementById('projectNameText')?.textContent || getUntitledProjectName();
  }
  function run12() {
    return desktopBridge.project.isAvailable() ? desktopBridge.project : null;
  }
  function lastKnownProjectLastModified() {
    const count10 = Number(window._v2CurrentProjectLastModified || 0);
    return Number.isFinite(count10) && count10 > 0 ? Math.round(count10) : 0;
  }
  function project2() {
    return {
      projectId: window.currentProjectId || 'default_v2_project',
      projectName: projectName7(),
      filename: window._v2CurrentFile || '',
      recentId: window._v2CurrentRecentProjectId || '',
      displayPath: window._v2CurrentProjectDisplayPath || '',
      lastKnownProjectLastModified: lastKnownProjectLastModified(),
      workspaceScopeVersion: window._v2WorkspaceProjectScoped === true ? 1 : 0,
    };
  }
  function run13() {
    return CanvasTabManager?.hasDirtyCanvases?.() === true;
  }
  async function run14(reason2 = 'auto') {
    const value183 = run12();
    if (typeof value183?.writeRecoverySnapshot !== 'function')
      return { success: false, reason: 'api-unavailable' };
    // The compatibility guard must be present before any write. An older host that
    // only exposes the legacy writer would persist a recovery snapshot it cannot
    // interpret, so refuse the write and warn once instead of silently degrading.
    if (typeof value183.writeRecoverySnapshotIfCompatible !== 'function') {
      if (!recoveryWriteWarningShown) {
        recoveryWriteWarningShown = true;
        window.showToast?.(t('projectLifecycle.recoverySnapshotUpgradeRequired'), 'warning');
      }
      return { success: false, code: 'RECOVERY_SNAPSHOT_PROTECTED', reason: 'guard-unavailable' };
    }
    if (!run13()) return { success: false, reason: 'clean' };
    const meta2 = project2(),
      persistenceRevision4 = run10(),
      hasCompleteContentPersistenceRevision2 = hasCompleteContentPersistenceRevision(persistenceRevision4.persistenceRevision);
    let value184 = persistenceRevision4.persistenceRevision
      ? buildRecoverySnapshotSignature({
          meta: meta2,
          multiData: null,
          persistenceRevision: persistenceRevision4.persistenceRevision,
        })
      : '';
    const value185 = Date.now();
    if (
      value184 &&
      value184 === value100 &&
      (hasCompleteContentPersistenceRevision2 || value185 - value101 < RECOVERY_SNAPSHOT_DEDUPE_MS)
    )
      return { success: true, deduped: true };
    const { multiData: multiData6, persistenceRevision: persistenceRevision5 } = run11(persistenceRevision4);
    if (!multiData6?.canvases?.length) return { success: false, reason: 'empty-canvas' };
    value184 ||= buildRecoverySnapshotSignature({
      meta: meta2,
      multiData: multiData6,
      persistenceRevision: persistenceRevision5,
    });
    if (
      value184 &&
      value184 === value100 &&
      (hasCompleteContentPersistenceRevision2 || value185 - value101 < RECOVERY_SNAPSHOT_DEDUPE_MS)
    )
      return { success: true, deduped: true };
    if (promise && value99 === value184) return promise;
    if (promise) return promise.catch(() => null).then(() => run14(reason2));
    return (
      (promise = value183.writeRecoverySnapshotIfCompatible({
        ...meta2,
        reason: reason2,
        multiData: multiData6,
      })
        .then((response2) => {
          if (response2?.code === 'RECOVERY_SNAPSHOT_PROTECTED' && !recoveryWriteWarningShown) {
            recoveryWriteWarningShown = true;
            window.showToast?.(t('projectLifecycle.recoverySnapshotProtected'), 'warning');
          }
          return (
            response2?.success !== false && ((value100 = value184), (value101 = Date.now())),
            response2
          );
        })
        .finally(() => {
          ((promise = null), (value99 = ''));
        })),
      (value99 = value184),
      promise
    );
  }
  function run15(value186 = 'dirty-state') {
    const value187 = run12();
    if (typeof value187?.writeRecoverySnapshot !== 'function') return;
    if (!shouldWritePeriodicRecoverySnapshot({ isChromeShell: desktopBridge.isChromeShell })) return;
    (setTimeout2 !== null && clearTimeout(setTimeout2),
      (setTimeout2 = setTimeout(() => {
        ((setTimeout2 = null),
          run16(
            () => {
              void run14(value186).catch((value188) => {
                console.warn('[projectLifecycle] 写入恢复快照失败:', value188);
              });
            },
            { timeout: 1500 },
          ));
      }, 500)));
  }
  function run17() {
    if (setTimeout2 === null) return;
    (clearTimeout(setTimeout2), (setTimeout2 = null));
  }
  function run18({
    writeRecovery: writeRecovery = false,
    reason: reason = 'dirty-state',
    knownHasUnsavedChanges: knownHasUnsavedChanges = null,
  } = {}) {
    const value189 = run12(),
      hasUnsavedChanges3 = typeof knownHasUnsavedChanges === 'boolean' ? knownHasUnsavedChanges : run13();
    if (typeof value189?.setUnsavedState === 'function') {
      const promise2 = value189.setUnsavedState({
        hasUnsavedChanges: hasUnsavedChanges3,
        projectName: projectName7(),
      });
      promise2 &&
        typeof promise2.catch === 'function' &&
        void promise2.catch((value190) => {
          console.warn('[projectLifecycle] 同步未保存状态失败:', value190);
        });
    }
    if (hasUnsavedChanges3 && writeRecovery) {
      run15(reason);
      return;
    }
    !hasUnsavedChanges3 && run17();
  }
  async function run19() {
    const value191 = run12();
    if (
      typeof value191?.getRecoverySnapshotInfo !== 'function' ||
      typeof value191?.readRecoverySnapshot !== 'function'
    )
      return null;
    try {
      const snapshotInfo = await value191.getRecoverySnapshotInfo(project2());
      // An unreadable or non-boolean answer is not "no snapshot"; treat it as damage
      // so a failed read never degrades into a blank workspace.
      if (snapshotInfo?.invalid || snapshotInfo?.error || typeof snapshotInfo?.exists !== 'boolean')
        throw unsafeRecoveryError();
      if (!snapshotInfo.exists) return null;
      // Never auto-delete an older recovery file.
      if (snapshotInfo.isNewerThanProject !== true) return null;
      const snapshot = await value191.readRecoverySnapshot();
      if (!snapshot?.success) throw unsafeRecoveryError();
      const verifiedData = requireProjectDocument(snapshot.data);
      if (Array.isArray(verifiedData.canvases) && !verifiedData.canvases.length)
        throw unsafeRecoveryError();
      return {
        projectId: snapshot.projectId || window.currentProjectId || 'default_v2_project',
        projectName: snapshot.projectName || getUntitledProjectName(),
        workspaceScopeVersion: Number(snapshot.workspaceScopeVersion) === 1 ? 1 : 0,
        multiData: project.resolveCanvasData(verifiedData),
        recovery: true,
        filename: snapshot.filename || '',
        recentId: snapshot.recentId || '',
        displayPath: snapshot.displayPath || '',
        lastModified: Number(snapshot.lastModified || 0) || 0,
      };
    } catch (recoveryError) {
      console.warn('[projectLifecycle] 读取恢复快照失败:', recoveryError);
      throw unsafeRecoveryError();
    }
  }
  function run20(enabled25) {
    if (!enabled25?.recovery) return;
    ((window._v2CurrentFile = enabled25.filename || ''),
      (window._v2CurrentRecentProjectId = enabled25.recentId || ''),
      (window._v2CurrentProjectDisplayPath = enabled25.displayPath || ''),
      (window._v2CurrentProjectLastModified = Number(enabled25.lastModified || 0) || 0));
  }
  function run21() {
    if (value103) return;
    ((value103 = true),
      (window.__aiCanvasWriteRecoverySnapshotForClose = (value193 = 'window-close') =>
        run14(value193)),
      window.addEventListener('aicanvas:dirty-state-changed', () => {
        run18({ writeRecovery: true, reason: 'dirty-state' });
      }));
  }
  function run22() {
    if (value97) return ((enabled19 = true), value97);
    const run23 = async () => {
      const { multiData: multiData7, persistenceRevision: persistenceRevision6 } = run11(),
        projectId13 = window.currentProjectId,
        projectName8 = projectName7();
      if (!multiData7?.canvases?.length) return;
      await run8({
        projectId: projectId13,
        projectName: projectName8,
        multiData: multiData7,
        multiDataSanitized: true,
        persistenceRevision: persistenceRevision6,
      });
    };
    return (
      (value97 = (async () => {
        try {
          do {
            ((enabled19 = false), await run23());
          } while (enabled19);
        } finally {
          value97 = null;
        }
      })()),
      value97
    );
  }
  function run24(value194) {
    return sanitizeMultiCanvasDataForPersistence2(value194 || {});
  }
  const delayMs2 = 20000,
    delayMs3 = 22000;
  function run16(
    run25,
    {
      timeout: timeout = 1500,
      delayMs: delayMs = 0,
      retryDelayMs: retryDelayMs = WORKSPACE_CACHE_BUSY_RETRY_MS,
      onError: onError = (value195) => {
        console.warn('[projectLifecycle] 后台任务失败:', value195);
      },
    } = {},
  ) {
    if (typeof run25 !== 'function') return null;
    const workspaceCacheIdleScheduler = createWorkspaceCacheIdleScheduler({
      run: run25,
      isBusy: () => isWorkspaceCacheInteractionBusy({ documentRef: document, CanvasTabManager: CanvasTabManager }),
      retryDelayMs: retryDelayMs,
      idleTimeoutMs: timeout,
      onError: onError,
    });
    return (workspaceCacheIdleScheduler.schedule({ delayMs: delayMs }), workspaceCacheIdleScheduler);
  }
  function run26(value196) {
    run16(value196, { timeout: 1500 });
  }
  function run27(value197, { timeout: timeout2, delayMs: delayMs4 } = {}) {
    run16(value197, {
      timeout: timeout2,
      delayMs: delayMs4,
      retryDelayMs: 2000,
      onError(value198) {
        console.warn('[projectLifecycle] 历史图片后台任务失败:', value198);
      },
    });
  }
  function run28() {
    return new Promise((value199) => setTimeout(value199, 0));
  }
  function run29(value200) {
    return new Promise((value201) => {
      setTimeout(value201, Math.max(0, Number(value200) || 0));
    });
  }
  function run30() {
    return new Promise((handler20) => {
      if (typeof window?.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => handler20(), { timeout: INITIAL_REVEAL_IDLE_TIMEOUT_MS });
        return;
      }
      setTimeout(handler20, 48);
    });
  }
  async function run31(value202) {
    let readyCount2 = [],
      value203 = -1,
      stablePollCount2 = 0;
    for (let attempt2 = 0; attempt2 < INITIAL_IMAGE_READY_MAX_ATTEMPTS; attempt2 += 1) {
      const totalCount2 = collectInitialImageRevealEntries(value202, { windowObject: window });
      ((readyCount2 = totalCount2.filter((value204) => value204.ready === true)),
        (stablePollCount2 = readyCount2.length === value203 ? stablePollCount2 + 1 : 0),
        (value203 = readyCount2.length));
      if (
        shouldFinishInitialImageReadinessWait({
          totalCount: totalCount2.length,
          readyCount: readyCount2.length,
          stablePollCount: stablePollCount2,
          attempt: attempt2,
        })
      )
        return readyCount2;
      await run29(INITIAL_IMAGE_READY_POLL_MS);
    }
    return readyCount2;
  }
  function run32({ canvasEl: canvasEl2, afterHidden: afterHidden } = {}) {
    (cancelStartupLoaderGuard(window), handler3(), (handler3 = () => {}));
    if (canvasEl2) canvasEl2.style.transition = '';
    if (window.hideGlobalLoading) window.hideGlobalLoading();
    (run4('loader hidden:end'), run5('loader hidden', 'initApp:start', 'loader hidden:end'));
    if (typeof afterHidden === 'function') afterHidden();
    run6();
  }
  async function run33({
    wrapEl: wrapEl2,
    canvasEl: canvasEl3,
    animate: animate = false,
    imageFirst: imageFirst = true,
    afterHidden: afterHidden2,
  } = {}) {
    const loader4 = document.getElementById('v2-initial-loader'),
      nodes2 = store.getStateRaw?.()?.nodes || {},
      reducedMotion2 = window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
    let value205;
    loader4 &&
      !reducedMotion2 &&
      (loader4.setAttribute?.('data-reveal-ready', 'true'),
      (value205 = run29(INITIAL_PROGRESS_FINISH_MS)));
    const targetCount2 =
      imageFirst && hasInitialCanvasImageNodes(nodes2) && !reducedMotion2 ? await run31(canvasEl3) : [];
    targetCount2.length > 0 && (await run30(), await waitForInitialRevealFrame());
    await value205;
    const shouldUseInitialImageFirstReveal2 = shouldUseInitialImageFirstReveal({
        nodes: nodes2,
        targetCount: targetCount2.length,
        reducedMotion: reducedMotion2,
      }),
      enabled26 = shouldUseInitialImageFirstReveal2
        ? createInitialImageRevealLayer({
            loader: loader4,
            imageTargets: targetCount2,
            documentObject: document,
            windowObject: window,
          })
        : null;
    if (!shouldUseInitialImageFirstReveal2 || !enabled26) {
      if (animate) await run29(80);
      if (canvasEl3) canvasEl3.style.transition = '';
      wrapEl2 &&
        ((wrapEl2.style.transition = animate ? 'opacity 0.2s ease-in-out' : ''),
        (wrapEl2.style.opacity = '1'));
      loader4
        ? ((loader4.style.opacity = '0'),
          (loader4.style.visibility = 'hidden'),
          setTimeout(() => {
            (loader4.remove?.(), wrapEl2?.classList.remove('is-initial-header-locked'));
          }, 400))
        : wrapEl2?.classList.remove('is-initial-header-locked');
      run32({ canvasEl: canvasEl3, afterHidden: afterHidden2 });
      return;
    }
    ((wrapEl2.style.transition = ''),
      (wrapEl2.style.opacity = '1'),
      loader4.classList.add('is-initial-image-reveal-shell'),
      await run29(INITIAL_BRAND_IMAGE_HANDOFF_MS),
      await waitForInitialRevealFrame(),
      loader4.classList.add('is-initial-image-reveal-active'),
      await run29(
        resolveInitialImageRevealDurationMs(targetCount2.length) - INITIAL_BACKGROUND_REVEAL_MS,
      ),
      await waitForInitialRevealFrame(),
      loader4.classList.add('is-initial-background-reveal'),
      await run29(INITIAL_BACKGROUND_REVEAL_MS),
      loader4.classList.add('is-initial-image-reveal-handoff'),
      await run29(INITIAL_IMAGE_LAYER_HANDOFF_MS),
      (loader4.style.visibility = 'hidden'),
      loader4.remove?.(),
      wrapEl2.classList.remove('is-initial-header-locked'),
      run32({ canvasEl: canvasEl3, afterHidden: afterHidden2 }));
  }
  function run34({ projectId: projectId14, projectName: projectName9, multiData: multiData8 }) {
    if (!multiData8?.canvases?.length) return;
    run26(async () => {
      try {
        const { changed: changed, multiData: multiData9 } = await migrateLegacyThumbnailsInMultiData(multiData8);
        if (!changed) return;
        await run8({ projectId: projectId14, projectName: projectName9, multiData: multiData9 });
      } catch (value206) {
        console.warn('[main] 缩略图迁移失败', value206);
      }
    });
  }
  function run35(value207) {
    const value208 = String(value207 || '').trim();
    return /^https?:\/\//i.test(value208) || value208.startsWith('//');
  }
  function run36(value209) {
    const list27 = [];
    for (const nodeId of Object.values(value209 || {})) {
      if (!nodeId || nodeId.type !== 'ai-image') continue;
      const list28 = Array.isArray(nodeId.images) ? nodeId.images : [];
      for (let idx = 0; idx < list28.length; idx += 1) {
        const value210 = list28[idx] || {};
        if (String(value210.localPath || '').trim()) continue;
        const remote = String(
          value210.remoteFallbackUrl ||
            value210.sourceUrl ||
            value210.imageUrl ||
            value210.thumbUrl ||
            '',
        ).trim();
        if (!remote || !run35(remote)) continue;
        list27.push({ nodeId: nodeId.id, idx: idx, remote: remote });
      }
      if (
        list28.length === 0 &&
        !String(nodeId.localPath || '').trim() &&
        run35(
          nodeId.remoteFallbackUrl ||
            nodeId.thumbUrl ||
            nodeId.imageUrl ||
            nodeId.sourceUrl,
        )
      ) {
        const remote2 = String(
          nodeId.remoteFallbackUrl ||
            nodeId.sourceUrl ||
            nodeId.imageUrl ||
            nodeId.thumbUrl ||
            '',
        ).trim();
        if (remote2) list27.push({ nodeId: nodeId.id, idx: -1, remote: remote2 });
      }
    }
    return list27;
  }
  function run37(enabled27, value211) {
    if (!enabled27) return false;
    if (value211.idx >= 0) {
      const value212 = Array.isArray(enabled27.images) ? enabled27.images : [],
        enabled28 = value212[value211.idx];
      if (!enabled28 || String(enabled28.localPath || '').trim()) return false;
      const value213 = String(
        enabled28.remoteFallbackUrl ||
          enabled28.sourceUrl ||
          enabled28.imageUrl ||
          enabled28.thumbUrl ||
          '',
      ).trim();
      return value213 === value211.remote;
    }
    if (String(enabled27.localPath || '').trim()) return false;
    const value214 = String(
      enabled27.remoteFallbackUrl ||
        enabled27.sourceUrl ||
        enabled27.imageUrl ||
        enabled27.thumbUrl ||
        '',
    ).trim();
    return value214 === value211.remote;
  }
  function run38(value215, response3) {
    const value216 =
        typeof response3 === 'string'
          ? String(response3 || '').trim()
          : String(response3?.localUrl || response3?.url || '').trim(),
      localPath =
        typeof response3 === 'string'
          ? normalizeLocalPath(response3)
          : pickResultLocalPath(response3) || normalizeLocalPath(value216);
    if (!localPath) return false;
    const args9 =
        response3 && typeof response3 === 'object' ? buildImageNodeStorageFields(response3) : {},
      args10 = buildCanvasLocalImageFields(
        response3 && typeof response3 === 'object' ? response3 : { localPath: localPath },
      ),
      value217 = store.getStateRaw()?.nodes?.[value215.nodeId];
    if (!run37(value217, value215)) return false;
    const value218 = {};
    if (value215.idx >= 0) {
      const enabled29 = Array.isArray(value217.images) ? value217.images.slice() : [];
      if (!enabled29[value215.idx]) return false;
      ((enabled29[value215.idx] = {
        ...(enabled29[value215.idx] || {}),
        ...args10,
        ...args9,
        remoteFallbackUrl: '',
        localSaveError: '',
        originalWidth:
          Number(response3?.originalWidth || 0) || enabled29[value215.idx]?.originalWidth,
        originalHeight:
          Number(response3?.originalHeight || 0) || enabled29[value215.idx]?.originalHeight,
      }),
        (value218.images = enabled29),
        (value217.mainImageIndex || 0) === value215.idx &&
          (Object.assign(value218, args10),
          Object.assign(value218, args9),
          (value218.remoteFallbackUrl = ''),
          (value218.localSaveError = ''),
          (value218.originalWidth =
            Number(response3?.originalWidth || 0) || value217.originalWidth),
          (value218.originalHeight =
            Number(response3?.originalHeight || 0) || value217.originalHeight)));
    } else
      (Object.assign(value218, args10),
        Object.assign(value218, args9),
        (value218.remoteFallbackUrl = ''),
        (value218.localSaveError = ''),
        (value218.originalWidth =
          Number(response3?.originalWidth || 0) || value217.originalWidth),
        (value218.originalHeight =
          Number(response3?.originalHeight || 0) || value217.originalHeight));
    if (Object.keys(value218).length === 0) return false;
    return (store.updateNodeData(value215.nodeId, value218), true);
  }
  function localPath2(value219) {
    return normalizeLocalPath(value219?.originalLocalPath || value219?.localPath);
  }
  function run39(value220) {
    return {
      displayLocalPath: normalizeLocalPath(value220?.displayLocalPath),
      thumbLocalPath: normalizeLocalPath(value220?.thumbLocalPath),
    };
  }
  function run40(value221) {
    return needsImageDerivatives(value221);
  }
  function run41(value222) {
    const list29 = normalizeLocalPath(value222).toLowerCase();
    return (
      list29.includes('/_derived/') ||
      list29.includes('/derived/') ||
      list29.includes('/videothumbs/')
    );
  }
  function run42(value223) {
    const { displayLocalPath: displayLocalPath, thumbLocalPath: thumbLocalPath } = run39(value223),
      list30 = [displayLocalPath, thumbLocalPath].filter(Boolean);
    return list30.length > 0 && list30.every(run41);
  }
  async function run43(value224) {
    if (typeof project?.checkLocalMediaExists !== 'function') return false;
    const enabled30 = localPath2(value224);
    if (!enabled30) return false;
    const { displayLocalPath: displayLocalPath2, thumbLocalPath: thumbLocalPath2 } = run39(value224),
      list31 = [displayLocalPath2, thumbLocalPath2].filter(Boolean);
    if (list31.length === 0) return false;
    for (const value225 of list31) {
      try {
        if (!(await project.checkLocalMediaExists(value225))) return true;
      } catch {
        return true;
      }
    }
    return false;
  }
  async function run44(value226) {
    if (run40(value226)) return true;
    if (run42(value226)) return false;
    return await run43(value226);
  }
  async function run45(value227) {
    const list32 = [];
    for (const nodeId2 of Object.values(value227 || {})) {
      if (!nodeId2) continue;
      const nodeType = String(nodeId2.type || '').trim();
      if (nodeType === 'source-image') {
        (await run44(nodeId2)) &&
          list32.push({
            nodeId: nodeId2.id,
            idx: -1,
            nodeType: nodeType,
            localPath: localPath2(nodeId2),
          });
        continue;
      }
      if (nodeType !== 'ai-image') continue;
      const list33 = Array.isArray(nodeId2.images) ? nodeId2.images : [];
      if (list33.length > 0) {
        for (let idx2 = 0; idx2 < list33.length; idx2 += 1) {
          const value228 = list33[idx2] || {};
          if (!(await run44(value228))) continue;
          list32.push({
            nodeId: nodeId2.id,
            idx: idx2,
            nodeType: nodeType,
            localPath: localPath2(value228),
          });
        }
        continue;
      }
      (await run44(nodeId2)) &&
        list32.push({
          nodeId: nodeId2.id,
          idx: -1,
          nodeType: nodeType,
          localPath: localPath2(nodeId2),
        });
    }
    return list32;
  }
  function run46(enabled31, value229) {
    if (!enabled31) return false;
    if (value229.idx >= 0) {
      const value230 = Array.isArray(enabled31.images) ? enabled31.images : [],
        enabled32 = value230[value229.idx];
      if (!enabled32) return false;
      return localPath2(enabled32) === value229.localPath;
    }
    return localPath2(enabled31) === value229.localPath;
  }
  function run47(value231, value232) {
    const args11 = buildImageNodeStorageFields(value232);
    if (!args11.displayLocalPath && !args11.thumbLocalPath) return false;
    const value233 = store.getStateRaw()?.nodes?.[value231.nodeId];
    if (!run46(value233, value231)) return false;
    const value234 = {};
    if (value231.idx >= 0) {
      const enabled33 = Array.isArray(value233.images) ? value233.images.slice() : [];
      if (!enabled33[value231.idx]) return false;
      ((enabled33[value231.idx] = {
        ...(enabled33[value231.idx] || {}),
        ...args11,
        originalWidth:
          Number(value232?.originalWidth || 0) || enabled33[value231.idx]?.originalWidth,
        originalHeight:
          Number(value232?.originalHeight || 0) || enabled33[value231.idx]?.originalHeight,
      }),
        (value234.images = enabled33),
        (value233.mainImageIndex || 0) === value231.idx &&
          Object.assign(value234, {
            ...args11,
            originalWidth: Number(value232?.originalWidth || 0) || value233.originalWidth,
            originalHeight: Number(value232?.originalHeight || 0) || value233.originalHeight,
          }));
    } else
      Object.assign(value234, {
        ...args11,
        originalWidth: Number(value232?.originalWidth || 0) || value233.originalWidth,
        originalHeight: Number(value232?.originalHeight || 0) || value233.originalHeight,
      });
    if (Object.keys(value234).length === 0) return false;
    return (store.updateNodeData(value231.nodeId, value234), true);
  }
  async function run48(enabled34, value235 = 10) {
    if (
      typeof project?.saveRemoteImageLocallyDetailed !== 'function' &&
      typeof project?.saveRemoteImageLocally !== 'function'
    )
      return;
    if (!enabled34 || window.currentProjectId !== enabled34) return;
    const count11 = run36(store.getStateRaw()?.nodes || {});
    if (count11.length === 0) return;
    window.showToast?.(
      t('projectLifecycle.historicalAiLocalizationStarted', { count: count11.length }),
      'info',
    );
    let count12 = 0;
    await run28();
    for (let value236 = 0; value236 < count11.length; value236 += value235) {
      if (window.currentProjectId !== enabled34) return;
      const value237 = count11.slice(value236, value236 + value235);
      for (const value238 of value237) {
        if (window.currentProjectId !== enabled34) return;
        try {
          const value239 =
            typeof project.saveRemoteImageLocallyDetailed === 'function'
              ? await project.saveRemoteImageLocallyDetailed(value238.remote, enabled34)
              : await project.saveRemoteImageLocally(value238.remote, enabled34);
          run38(value238, value239) && (count12 += 1);
        } catch {}
      }
      value236 + value235 < count11.length && (await run28());
    }
    if (window.currentProjectId !== enabled34) return;
    count12 > 0 &&
      window.showToast?.(
        t('projectLifecycle.historicalAiLocalizationFixed', { count: count12 }),
        'success',
      );
  }
  async function run49(enabled35, value240 = 10) {
    if (typeof project?.ensureLocalImageDerivatives !== 'function') return;
    if (!enabled35 || window.currentProjectId !== enabled35) return;
    const list34 = await run45(store.getStateRaw()?.nodes || {});
    if (list34.length === 0) return;
    let count13 = 0;
    await run28();
    for (let value241 = 0; value241 < list34.length; value241 += value240) {
      if (window.currentProjectId !== enabled35) return;
      const value242 = list34.slice(value241, value241 + value240);
      for (const value243 of value242) {
        if (window.currentProjectId !== enabled35) return;
        try {
          const value244 = await project.ensureLocalImageDerivatives(value243.localPath);
          run47(value243, value244) && (count13 += 1);
        } catch {}
      }
      value241 + value240 < list34.length && (await run28());
    }
    if (window.currentProjectId !== enabled35) return;
    count13 > 0 &&
      (window._triggerLocalCacheSave?.(),
      window.showToast?.(
        t('projectLifecycle.historicalImageDerivativesFixed', { count: count13 }),
        'success',
      ));
  }
  function run50(enabled36, value245 = 10) {
    if (!enabled36) return;
    (run4('historicalAiLocalization queued:end'),
      run5('historicalAiLocalization queued', 'initApp:start', 'historicalAiLocalization queued:end'),
      run27(() => run48(enabled36, value245), { timeout: 2500, delayMs: delayMs2 }));
  }
  function run51(enabled37, value246 = 10) {
    if (!enabled37) return;
    run27(() => run49(enabled37, value246), { timeout: 3200, delayMs: delayMs3 });
  }
  window._queueLegacyThumbnailMigration = run34;
  function run52() {
    return run22();
  }
  window._triggerLocalCacheSave = run52;
  let value247 = false;
  const workspaceCacheIdleScheduler2 = createWorkspaceCacheIdleScheduler({
    run: run52,
    isBusy: () => isWorkspaceCacheInteractionBusy({ documentRef: document, CanvasTabManager: CanvasTabManager }),
    retryDelayMs: WORKSPACE_CACHE_BUSY_RETRY_MS,
    onError(value248) {
      console.warn('[projectLifecycle] 自动缓存保存失败:', value248);
    },
  });
  function run53() {
    return workspaceCacheIdleScheduler2.schedule({ delayMs: WORKSPACE_CACHE_META_DELAY_MS });
  }
  window._triggerLocalCacheMetaSave = run53;
  function resumeProjectPersistenceAfterHydration() {
    (project.clearProjectPersistenceBlock?.(),
      (window._isAppLoaded = true),
      window._checkEmptyHint?.());
  }
  function flushPendingLocalCacheSaveNow({ pageLifecycle: pageLifecycle = false } = {}) {
    workspaceCacheIdleScheduler2.cancel();
    if (window._isAppLoaded !== true) return null;
    if (!pageLifecycle) return run52();
    const value249 = Date.now();
    if (value98) return value98;
    if (count9 > 0 && value249 - count9 < PAGE_LIFECYCLE_FLUSH_DEDUPE_MS)
      return value97 || Promise.resolve(null);
    const promise3 = run52();
    if (!promise3 || typeof promise3.finally !== 'function')
      return ((count9 = Date.now()), promise3);
    return (
      (value98 = promise3),
      promise3.finally(() => {
        value98 === promise3 && ((count9 = Date.now()), (value98 = null));
      }),
      promise3
    );
  }
  function bindPersistRevisionAutoSave() {
    if (value247) return;
    ((value247 = true), run21());
    let enabled38 = false;
    store.subscribeSelector(
      (value250) => value250._persistRev,
      () => {
        if (!enabled38) {
          enabled38 = true;
          return;
        }
        if (window._isAppLoaded !== true) return;
        (workspaceCacheIdleScheduler2.schedule({ delayMs: WORKSPACE_CACHE_PERSIST_DELAY_MS }),
          run18({ writeRecovery: true, reason: 'persist-rev', knownHasUnsavedChanges: true }));
      },
    );
  }
  function onBeforeUnload() {
    return (
      run13() && void run14('beforeunload').catch(() => {}),
      flushPendingLocalCacheSaveNow({ pageLifecycle: true })
    );
  }
  function onPageHide() {
    return (run13() && void run14('pagehide').catch(() => {}), flushPendingLocalCacheSaveNow({ pageLifecycle: true }));
  }
  function onVisibilityChange() {
    if (document.visibilityState !== 'hidden') {
      count9 = 0;
      return;
    }
    return (
      run13() && void run14('visibility-hidden').catch(() => {}),
      flushPendingLocalCacheSaveNow({ pageLifecycle: true })
    );
  }
  async function initApp() {
    const t2 = t('projectLifecycle.projectPersistenceLoading');
    (project.setProjectPersistenceBlocked?.(t2), (window._isAppLoaded = false));
    const wrapEl3 = document.getElementById('v2-wrap'),
      canvasEl4 = document.getElementById('v2-canvas') || document.querySelector('.v2-canvas'),
      loader5 = document.getElementById('v2-initial-loader'),
      waitForInitialLoaderSequence2 = waitForInitialLoaderSequence({ loader: loader5, windowObject: window });
    (handler3(),
      (handler3 = scheduleInitialLoaderFailOpen({
        loader: loader5,
        wrapEl: wrapEl3,
        canvasEl: canvasEl4,
        timeoutMs: INITIAL_LOADER_MAX_VISIBLE_MS,
        shouldReveal: () => rendererStartupState.snapshot().ready,
        onTimeout: () => {
          (cancelStartupLoaderGuard(window),
            window.hideGlobalLoading?.(),
            console.warn(
              '[startup] Initial loader exceeded ' +
                INITIAL_LOADER_MAX_VISIBLE_MS +
                'ms and was dismissed.',
            ));
        },
      })));
    try {
      (run4('initApp:start'), loadCustomPresets());
      const dreaminaResumeBackupSync = readDreaminaResumeBackupSync(),
        // Validate both persisted sources before a good snapshot can overwrite a
        // damaged cache: the snapshot read may not short-circuit the cache read.
        recoveredProject = await run19(),
        cachedProject = await V2LocalCache.load(),
        projectName10 = recoveredProject || cachedProject;
      if (
        projectName10 &&
        projectName10.multiData &&
        projectName10.multiData.canvases &&
        projectName10.multiData.canvases.length > 0
      ) {
        (store.updateViewport(0, 0, 1),
          run20(projectName10),
          (window.currentProjectId = projectName10.projectId || 'default_v2_project'),
          (window._v2WorkspaceProjectScoped = Number(projectName10.workspaceScopeVersion) === 1));
        const el11 = document.getElementById('projectNameText');
        el11 && (el11.textContent = projectName10.projectName || getUntitledProjectName());
        const multiData10 = project.resolveCanvasData(
          mergeDreaminaResumeBackupIntoMultiData(
            projectName10.multiData,
            dreaminaResumeBackupSync,
            projectName10.projectId || window.currentProjectId,
          ),
        );
        run4('buildHydrationSafeMultiData:start');
        const value252 = run24(multiData10);
        (run4('buildHydrationSafeMultiData:end'),
          run5(
            'buildHydrationSafeMultiData',
            'buildHydrationSafeMultiData:start',
            'buildHydrationSafeMultiData:end',
          ),
          run4('CanvasTabManager.init:start'),
          CanvasTabManager.init(value252, { markClean: false }),
          run4('CanvasTabManager.init:end'),
          run5('CanvasTabManager.init', 'CanvasTabManager.init:start', 'CanvasTabManager.init:end'),
          run34({
            projectId: window.currentProjectId,
            projectName: projectName10.projectName || getUntitledProjectName(),
            multiData: multiData10,
          }),
          resumeProjectPersistenceAfterHydration(),
          run18({ writeRecovery: projectName10.recovery === true, reason: 'startup' }),
          commit(),
          rendererStartupState.complete('project'));
        if (!(await rendererStartupState.settled).ready) return;
        (loader5?.setAttribute?.('data-app-ready', 'true'),
          await waitForInitialLoaderSequence2,
          await run33({
            wrapEl: wrapEl3,
            canvasEl: canvasEl4,
            animate: false,
            afterHidden: () => {
              (run50(window.currentProjectId), run51(window.currentProjectId));
            },
          }));
        return;
      }
      canvasEl4 && ((canvasEl4.style.transition = 'none'), void canvasEl4.offsetHeight);
      store.updateViewport(0, 0, 1);
      window.showGlobalLoading && window.showGlobalLoading(t('projectLifecycle.loadingWorkspaceFiles'));
      const allowMissing = window.currentProjectId || 'default_v2_project';
      ((window.currentProjectId = allowMissing),
        (window._v2WorkspaceProjectScoped = true),
        run4('project.loadProject:start'));
      const value253 = await project.loadProject(allowMissing, {
          allowMissing: allowMissing === 'default_v2_project',
        }),
        multiData11 = mergeDreaminaResumeBackupIntoMultiData(value253, dreaminaResumeBackupSync, allowMissing);
      (run4('project.loadProject:end'),
        run5('project.loadProject', 'project.loadProject:start', 'project.loadProject:end'),
        run4('buildHydrationSafeMultiData:start'));
      const value254 = run24(multiData11);
      (run4('buildHydrationSafeMultiData:end'),
        run5(
          'buildHydrationSafeMultiData',
          'buildHydrationSafeMultiData:start',
          'buildHydrationSafeMultiData:end',
        ),
        run4('CanvasTabManager.init:start'),
        CanvasTabManager.init(value254),
        run4('CanvasTabManager.init:end'),
        run5('CanvasTabManager.init', 'CanvasTabManager.init:start', 'CanvasTabManager.init:end'),
        run34({
          projectId: allowMissing,
          projectName:
            document.getElementById('projectNameText')?.textContent || getDefaultCanvasName(),
          multiData: multiData11,
        }),
        patchStoreSourceNodeNamesFromFileName(),
        resumeProjectPersistenceAfterHydration(),
        run18({ writeRecovery: false, reason: 'startup' }));
      const el12 = document.getElementById('projectNameText');
      el12 && (el12.textContent = getDefaultCanvasName());
      const value255 = CanvasTabManager.getActiveCanvasId?.() || CanvasTabManager._activeId;
      value255 &&
        CanvasTabManager.setCanvasProjectContext?.(
          value255,
          {
            ...(CanvasTabManager.getCanvasProjectContext?.(value255) || {}),
            projectId: allowMissing,
            filename: window._v2CurrentFile || '',
            projectName: getDefaultCanvasName(),
            isTemporary: false,
            workspaceProjectScoped: true,
          },
          { persist: false },
        );
      rendererStartupState.complete('project');
      if (!(await rendererStartupState.settled).ready) return;
      (loader5?.setAttribute?.('data-app-ready', 'true'),
        await waitForInitialLoaderSequence2,
        await run33({
          wrapEl: wrapEl3,
          canvasEl: canvasEl4,
          animate: true,
          afterHidden: () => {
            (run50(allowMissing), run51(allowMissing));
          },
        }));
    } catch (value256) {
      console.error('Failed to init app:', value256);
      const t3 = t('projectLifecycle.projectPersistenceLoadFailed');
      // An unsuccessful read must not leave the previous project identity attached
      // to an empty store, and the user is told which read failed before the blank
      // workspace is revealed.
      (project.setProjectPersistenceBlocked?.(t3),
        (window._isAppLoaded = false),
        (window.currentProjectId = ''),
        (window._v2CurrentFile = ''),
        (window._v2CurrentRecentProjectId = ''),
        (window._v2CurrentProjectDisplayPath = ''),
        (window._v2CurrentProjectLastModified = 0),
        window.showToast?.(
          t(
            value256?.code === 'UNSAFE_PROJECT_RECOVERY'
              ? 'projectLifecycle.recoveryReadFailedNoSave'
              : 'projectLifecycle.projectLoadFailedNoSave',
          ),
          'error',
        ),
        rendererStartupState.fail('project-hydration'));
    }
  }
  function run54(value257) {
    const enabled39 = value257?.dataTransfer?.types;
    return !!enabled39 && Array.from(enabled39).includes('Files');
  }
  function run55(event18) {
    if (!run54(event18)) return false;
    event18.preventDefault();
    if (event18.dataTransfer) event18.dataTransfer.dropEffect = 'copy';
    return true;
  }
  function onDocumentDragEnter(value258) {
    run55(value258);
  }
  function onDocumentDragOver(event19) {
    if (run55(event19)) return;
    event19.preventDefault();
  }
  function onDocumentDrop(event20) {
    event20.preventDefault();
    const filename = event20.dataTransfer.files[0];
    if (!filename) return;
    if (/\.aicpkg$/i.test(filename.name || '')) {
      const run56 = window._v2ImportProjectPackageByPath;
      if (typeof run56 !== 'function') {
        window.showToast?.(t('projectLifecycle.packageUnsupported'), 'error');
        return;
      }
      let enabled40 = '';
      try {
        enabled40 = String(desktopBridge.assetImport.getPathForFile(filename) || '').trim();
      } catch {
        enabled40 = '';
      }
      if (!enabled40) {
        const run57 = window._v2ImportProjectPackageFile;
        if (typeof run57 === 'function') {
          void run57(filename);
          return;
        }
        window.showToast?.(t('projectLifecycle.packagePathMissing'), 'error');
        return;
      }
      void run56(enabled40);
      return;
    }
    if (!isCanvasProjectFileName(filename.name)) return;
    const fileReader = new FileReader();
    ((fileReader.onload = async (event21) => {
      try {
        const verifiedDocument = requireProjectDocument(JSON.parse(event21.target.result));
        if (Array.isArray(verifiedDocument.canvases) && !verifiedDocument.canvases.length)
          throw new Error('空画布存档不能覆盖当前工程');
        const multiData12 = project.resolveCanvasData(verifiedDocument),
          value260 = run24(multiData12),
          error4 =
            value260.canvases.find((value261) => value261.id === value260.activeCanvasId) ||
            value260.canvases[0];
        if (!error4) throw new Error('Project file has no canvas');
        const projectId15 = stripCanvasProjectFileExtension(filename.name) || error4.name,
          value262 =
            CanvasTabManager.findCanvasIdByProjectIdentity?.({
              projectId: projectId15,
              filename: filename.name,
            }) || '';
        if (value262) {
          await CanvasTabManager.switchTo?.(value262);
          return;
        }
        const name2 = buildUniqueCanvasName(projectId15, CanvasTabManager._canvases, {
          fallbackName: getUntitledCanvasName(),
        });
        if ((await CanvasTabManager.addCanvas()) === false) return;
        CanvasTabManager.renameCanvas(CanvasTabManager._activeId, name2);
        const value263 = { ...error4, name: name2 };
        (applySourceNamesFromFileNameToCanvas(value263),
          CanvasTabManager.hydrateActiveCanvasSnapshot(value263),
          CanvasTabManager.setCanvasProjectContext?.(CanvasTabManager._activeId, {
            projectId: projectId15,
            filename: filename.name,
            projectName: name2,
            isTemporary: false,
            workspaceProjectScoped: true,
          }),
          CanvasTabManager.markCanvasClean(CanvasTabManager._activeId),
          commit(),
          resumeProjectPersistenceAfterHydration(),
          CanvasTabManager.renderTabs(),
          run34({ projectId: projectId15, projectName: name2, multiData: multiData12 }),
          run51(projectId15),
          window.showToast?.(t('projectLifecycle.localArchiveLoaded', { name: name2 })));
      } catch (value264) {
        (console.error('[Drop] 读取本地 JSON 失败:', value264),
          window.showToast?.(t('projectLifecycle.jsonArchiveParseFailed'), 'error'));
      }
    }),
      fileReader.readAsText(filename));
  }
  function renameCurrentProject(value265) {
    const projectName11 = String(value265 || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!projectName11) return false;
    const enabled41 = CanvasTabManager.getActiveCanvasId?.() || CanvasTabManager._activeId;
    if (!enabled41) return false;
    CanvasTabManager.renameCanvas?.(enabled41, projectName11);
    const args12 = CanvasTabManager.getCanvasProjectContext?.(enabled41);
    args12 && CanvasTabManager.setCanvasProjectContext?.(enabled41, { ...args12, projectName: projectName11 });
    const el13 = document.getElementById('projectNameText');
    if (el13) el13.textContent = projectName11;
    return (run52(), projectName11);
  }
  function bindHeaderProjectNameAutoSave() {
    const el14 = document.getElementById('projectNameText');
    if (!el14) return;
    const value266 = () => {
      const value267 = renameCurrentProject(el14.textContent);
      if (value267) el14.textContent = value267;
    };
    (el14.addEventListener('blur', value266),
      el14.addEventListener('keydown', (event22) => {
        event22.key === 'Enter' && (event22.preventDefault(), el14.blur());
      }));
  }
  return {
    V2LocalCache: V2LocalCache,
    projectWorkspaceSessions: projectWorkspaceSessions,
    initApp: initApp,
    onBeforeUnload: onBeforeUnload,
    onPageHide: onPageHide,
    onVisibilityChange: onVisibilityChange,
    onDocumentDragEnter: onDocumentDragEnter,
    onDocumentDragOver: onDocumentDragOver,
    onDocumentDrop: onDocumentDrop,
    triggerLocalCacheSave: run52,
    flushPendingLocalCacheSaveNow: flushPendingLocalCacheSaveNow,
    resumeProjectPersistenceAfterHydration: resumeProjectPersistenceAfterHydration,
    renameCurrentProject: renameCurrentProject,
    bindPersistRevisionAutoSave: bindPersistRevisionAutoSave,
    bindHeaderProjectNameAutoSave: bindHeaderProjectNameAutoSave,
  };
}
