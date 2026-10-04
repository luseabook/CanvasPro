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
  const value = typeof document !== 'undefined' ? document?.['body']?.['classList'] : null;
  return Boolean(
    value?.['contains']?.('is-panning') ||
    value?.['contains']?.('is-zooming') ||
    value?.['contains']?.('is-viewport-animating'),
  );
}
function scheduleRendererViewportMediaPreloadResume(item) {
  clearRendererViewportMediaPreloadResumeTimer();
  const key = Number['isFinite'](Number(item))
    ? Math['max'](0x0, Number(item))
    : DEFAULT_RENDERER_VIEWPORT_MEDIA_PRELOAD_AUTO_RESUME_MS;
  rendererViewportMediaPreloadResumeTimer = setTimeout(() => {
    rendererViewportMediaPreloadResumeTimer = 0x0;
    if (isViewportBodyBusy()) {
      scheduleRendererViewportMediaPreloadResume(ACTIVE_VIEWPORT_RECHECK_MS);
      return;
    }
    syncRendererViewportMediaPreloadPause(![]);
  }, key);
}
export function syncRendererViewportMediaPreloadPause(index, result = {}) {
  const data = index === !![];
  data
    ? scheduleRendererViewportMediaPreloadResume(result['autoResumeMs'])
    : clearRendererViewportMediaPreloadResumeTimer();
  if (rendererViewportMediaPreloadsPaused === data) return;
  ((rendererViewportMediaPreloadsPaused = data),
    setCanvasMediaSchedulerPaused(data, { bypassPriority: 0x3e8, source: 'renderer-viewport' }));
}
export function clearRendererViewportMediaPreloadPause() {
  (clearRendererViewportMediaPreloadResumeTimer(), syncRendererViewportMediaPreloadPause(![]));
}
