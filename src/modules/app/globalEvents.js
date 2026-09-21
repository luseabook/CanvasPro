export function registerAppGlobalEvents({
  onBeforeUnload: _0x1f12de,
  onPageHide: _0x4e95c3,
  onVisibilityChange: _0x3c578f,
  onDocumentDragEnter: _0x3aa020,
  onDocumentDragOver: _0x1102f0,
  onDocumentDrop: _0x416016,
  onBoot: _0xc3948,
}) {
  (typeof _0x1f12de === 'function' && window.addEventListener('beforeunload', _0x1f12de),
    typeof _0x4e95c3 === 'function' && window.addEventListener('pagehide', _0x4e95c3),
    typeof _0x3c578f === 'function' && document.addEventListener('visibilitychange', _0x3c578f),
    typeof _0x3aa020 === 'function' && document.addEventListener('dragenter', _0x3aa020),
    typeof _0x1102f0 === 'function' && document.addEventListener('dragover', _0x1102f0),
    typeof _0x416016 === 'function' && document.addEventListener('drop', _0x416016),
    typeof _0xc3948 === 'function' &&
      (document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', _0xc3948, { once: true })
        : _0xc3948()));
}
