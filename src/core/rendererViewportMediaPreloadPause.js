import { setCanvasMediaSchedulerPaused } from '../modules/canvasMediaScheduler.js';
const DEFAULT_RENDERER_VIEWPORT_MEDIA_PRELOAD_AUTO_RESUME_MS = 0x384,
  ACTIVE_VIEWPORT_RECHECK_MS = 0xb4;
let rendererViewportMediaPreloadsPaused = ![],
  rendererViewportMediaPreloadResumeTimer = 0x0;
function clearRendererViewportMediaPreloadResumeTimer() {
  if (!rendererViewportMediaPreloadResumeTimer) return;
  (clearTimeout(rendererViewportMediaPreloadResumeTimer), (rendererViewportMediaPreloadResumeTimer = 0x0));
}
function isViewportBodyBusy() {
  const _0x524575 = typeof document !== 'undefined' ? document?.['body']?.['classList'] : null;
  return Boolean(
    _0x524575?.['contains']?.('is-panning') ||
    _0x524575?.['contains']?.('is-zooming') ||
    _0x524575?.['contains']?.('is-viewport-animating'),
  );
}
function scheduleRendererViewportMediaPreloadResume(_0x11b1b0) {
  clearRendererViewportMediaPreloadResumeTimer();
  const _0x4f8028 = Number['isFinite'](Number(_0x11b1b0))
    ? Math['max'](0x0, Number(_0x11b1b0))
    : DEFAULT_RENDERER_VIEWPORT_MEDIA_PRELOAD_AUTO_RESUME_MS;
  rendererViewportMediaPreloadResumeTimer = setTimeout(() => {
    rendererViewportMediaPreloadResumeTimer = 0x0;
    if (isViewportBodyBusy()) {
      scheduleRendererViewportMediaPreloadResume(ACTIVE_VIEWPORT_RECHECK_MS);
      return;
    }
    syncRendererViewportMediaPreloadPause(![]);
  }, _0x4f8028);
}
export function syncRendererViewportMediaPreloadPause(_0x468230, _0x554246 = {}) {
  const _0xe4e0d6 = _0x468230 === !![];
  _0xe4e0d6
    ? scheduleRendererViewportMediaPreloadResume(_0x554246['autoResumeMs'])
    : clearRendererViewportMediaPreloadResumeTimer();
  if (rendererViewportMediaPreloadsPaused === _0xe4e0d6) return;
  ((rendererViewportMediaPreloadsPaused = _0xe4e0d6),
    setCanvasMediaSchedulerPaused(_0xe4e0d6, { bypassPriority: 0x3e8, source: 'renderer-viewport' }));
}
export function clearRendererViewportMediaPreloadPause() {
  (clearRendererViewportMediaPreloadResumeTimer(), syncRendererViewportMediaPreloadPause(![]));
}
