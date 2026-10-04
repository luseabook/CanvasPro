import { bindRefThumbOrderDrag } from '../../modules/refThumbDragController.js';
export function escapeRefBarHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
export function formatRefUploadLabel(item) {
  return escapeRefBarHtml(item).replace(/\s+/g, '<br>');
}
export function syncImageRefBarButtonIcon({ refBarEl: refBarEl, pickMode: pickMode, nodeId: nodeId }) {
  const el = refBarEl?.querySelector('.btn-icon');
  if (!el) return;
  pickMode && pickMode.active && pickMode.sourceNodeId === nodeId
    ? ((el.style.opacity = '0'),
      (el.style.transform = 'scale(0.4)'),
      (el.style.transition = 'opacity 0.2s ease, transform 0.2s ease'))
    : ((el.style.opacity = ''), (el.style.transform = ''));
}
export function bindImageRefThumbOrderDrag({ owner: owner, refBar: refBar, store: store, nodeId: nodeId2 }) {
  bindRefThumbOrderDrag({ owner: owner, container: refBar, store: store, nodeId: nodeId2 });
}
