import { bindRefThumbOrderDrag } from '../../modules/refThumbDragController.js';
export function escapeRefBarHtml(_0x281436) {
  return String(_0x281436 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
export function formatRefUploadLabel(_0x3532bf) {
  return escapeRefBarHtml(_0x3532bf).replace(/\s+/g, '<br>');
}
export function syncImageRefBarButtonIcon({ refBarEl: _0x4f9560, pickMode: _0x2f5469, nodeId: _0x421937 }) {
  const _0x4b7df7 = _0x4f9560?.querySelector('.btn-icon');
  if (!_0x4b7df7) return;
  _0x2f5469 && _0x2f5469.active && _0x2f5469.sourceNodeId === _0x421937
    ? ((_0x4b7df7.style.opacity = '0'),
      (_0x4b7df7.style.transform = 'scale(0.4)'),
      (_0x4b7df7.style.transition = 'opacity 0.2s ease, transform 0.2s ease'))
    : ((_0x4b7df7.style.opacity = ''), (_0x4b7df7.style.transform = ''));
}
export function bindImageRefThumbOrderDrag({
  owner: _0x1843d5,
  refBar: _0x5690e2,
  store: _0x51eafd,
  nodeId: _0x1e5ff7,
}) {
  bindRefThumbOrderDrag({ owner: _0x1843d5, container: _0x5690e2, store: _0x51eafd, nodeId: _0x1e5ff7 });
}
