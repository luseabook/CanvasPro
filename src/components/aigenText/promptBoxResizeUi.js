import {
  applyPromptBoxHeight,
  getPromptBoxHeightBounds,
  normalizePromptBoxHeight,
} from '../promptBoxResize.js';
const EDGE_HIT_TOP_OFFSET = 20,
  EDGE_HIT_BOTTOM_OFFSET = 10;
export function syncPromptBoxSizeFromData(enabled, value = enabled?._data) {
  if (!enabled?.promptEl || enabled._isPromptBoxResizing) return;
  const promptBoxHeightBounds = getPromptBoxHeightBounds(enabled._promptPanel),
    promptBoxHeight = normalizePromptBoxHeight(value?.promptBoxHeight, promptBoxHeightBounds);
  applyPromptBoxHeight(enabled.promptEl, promptBoxHeight);
}
export function setupPromptBoxResize(enabled2, { store: store, getStateSnapshot: getStateSnapshot }) {
  if (!enabled2?._promptPanel || enabled2._promptResizeHandle) return;
  enabled2._promptResizeHandle = true;
  const run = () => getStateSnapshot().ui?.promptBoxResizeEnabled !== false,
    handler = (el) => !!el?.closest('.floating-menu, .img-model-menu'),
    handler2 = (item) => {
      const box = enabled2._promptPanel.getBoundingClientRect();
      return item >= box.bottom - EDGE_HIT_TOP_OFFSET && item <= box.bottom + EDGE_HIT_BOTTOM_OFFSET;
    },
    handler3 = (event) => {
      if (!enabled2._promptPanel) return;
      if (!run()) {
        enabled2._promptPanel.classList.remove('is-resize-hover');
        return;
      }
      if (enabled2._isPromptBoxResizing) {
        enabled2._promptPanel.classList.add('is-resize-hover');
        return;
      }
      const key = !handler(event?.target) && handler2(event.clientY);
      enabled2._promptPanel.classList.toggle('is-resize-hover', key);
    };
  (enabled2._promptPanel.addEventListener('pointermove', handler3),
    enabled2._promptPanel.addEventListener('pointerleave', () => {
      !enabled2._isPromptBoxResizing && enabled2._promptPanel?.classList.remove('is-resize-hover');
    }));
  const index = (event2) => {
    if (!enabled2._promptInputWrap || !enabled2.promptEl) return;
    if (!run()) return;
    if (event2.button !== 0) return;
    if (!handler2(event2.clientY)) return;
    if (event2.target?.closest('.prompt-submit') || handler(event2.target)) return;
    (event2.stopPropagation(), event2.preventDefault());
    const promptBoxHeightBounds2 = getPromptBoxHeightBounds(enabled2._promptPanel),
      result = event2.clientY,
      data = enabled2.promptEl.getBoundingClientRect().height;
    ((enabled2._isPromptBoxResizing = true),
      enabled2._promptInputWrap.classList.add('is-resizing'),
      enabled2._promptPanel.classList.add('is-resize-hover'));
    const options = (event3) => {
        event3.preventDefault();
        const promptBoxHeight2 = normalizePromptBoxHeight(
          data + (event3.clientY - result),
          promptBoxHeightBounds2,
        );
        applyPromptBoxHeight(enabled2.promptEl, promptBoxHeight2);
      },
      target = (event4) => {
        (event4.preventDefault(),
          window.removeEventListener('pointermove', options),
          window.removeEventListener('pointerup', target),
          window.removeEventListener('pointercancel', target));
        const promptBoxHeight3 = normalizePromptBoxHeight(
          enabled2.promptEl?.getBoundingClientRect().height,
          promptBoxHeightBounds2,
        );
        (applyPromptBoxHeight(enabled2.promptEl, promptBoxHeight3),
          enabled2._promptInputWrap.classList.remove('is-resizing'),
          (enabled2._isPromptBoxResizing = false),
          enabled2._promptPanel.classList.remove('is-resize-hover'),
          handler3(event4),
          store.updateNodeData(enabled2.nodeId, { promptBoxHeight: promptBoxHeight3 }));
      };
    (window.addEventListener('pointermove', options),
      window.addEventListener('pointerup', target),
      window.addEventListener('pointercancel', target));
  };
  enabled2._promptPanel.addEventListener('pointerdown', index);
}
