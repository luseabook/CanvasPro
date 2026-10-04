export function registerAppGlobalEvents({
  onBeforeUnload: onBeforeUnload,
  onPageHide: onPageHide,
  onVisibilityChange: onVisibilityChange,
  onDocumentDragEnter: onDocumentDragEnter,
  onDocumentDragOver: onDocumentDragOver,
  onDocumentDrop: onDocumentDrop,
  onBoot: onBoot,
}) {
  (typeof onBeforeUnload === 'function' && window.addEventListener('beforeunload', onBeforeUnload),
    typeof onPageHide === 'function' && window.addEventListener('pagehide', onPageHide),
    typeof onVisibilityChange === 'function' &&
      document.addEventListener('visibilitychange', onVisibilityChange),
    typeof onDocumentDragEnter === 'function' && document.addEventListener('dragenter', onDocumentDragEnter),
    typeof onDocumentDragOver === 'function' && document.addEventListener('dragover', onDocumentDragOver),
    typeof onDocumentDrop === 'function' && document.addEventListener('drop', onDocumentDrop),
    typeof onBoot === 'function' &&
      (document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', onBoot, { once: true })
        : onBoot()));
}
