import { bindRefThumbOrderDrag } from '../../modules/refThumbDragController.js';
export function escapeRefBarHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
export function createRefThumbContainerElement(children = []) {
  const el = document.createElement('div');
  el.className = 'ref-thumb-container';
  for (const child of children) if (child) el.appendChild(child);
  return el;
}
export function createRefUploadSlot({ refSlot, title = '', label = '' } = {}) {
  const el = document.createElement('div');
  (el.className = 'ref-thumb-wrap ref-upload-slot'),
    (el.dataset.refSlot = refSlot),
    (el.dataset.slot = refSlot),
    (el.dataset.kind = 'image'),
    el.setAttribute('draggable', 'false'),
    el.setAttribute('title', title),
    appendRefUploadLabel(el, label);
  return el;
}
export function createUploadThumbSlot(thumbnailUrl, removeTitle = '') {
  const slot = document.createElement('div');
  (slot.className = 'ref-thumb-wrap ref-upload-slot'), (slot.dataset.refSrc = 'upload');
  const img = document.createElement('img');
  (img.className = 'ref-thumb-media ref-input-thumbnail ref-input-thumbnail--image is-pending'),
    (img.src = String(thumbnailUrl)),
    img.setAttribute('draggable', 'false'),
    img.setAttribute('alt', '');
  const del = document.createElement('button');
  (del.type = 'button'), (del.className = 'ref-upload-delete'), (del.textContent = '×'),
    del.setAttribute('title', removeTitle);
  return (slot.appendChild(img), slot.appendChild(del), slot);
}
export function createUploadReferenceButton(label, title = label) {
  const el = document.createElement('button');
  (el.type = 'button'), (el.className = 'ref-thumb-wrap ref-upload-slot'), el.setAttribute('title', title);
  return appendRefUploadLabel(el, label);
}
export function appendRefUploadLabel(el, label) {
  const span = document.createElement('span');
  span.className = 'ref-upload-label';
  span.textContent = String(label ?? '');
  el.appendChild(span);
  return el;
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
