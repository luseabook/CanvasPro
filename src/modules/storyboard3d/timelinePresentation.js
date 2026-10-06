const SCROLLERS = [
    '.storyboard-3d-timeline-grid',
    '.storyboard-3d-timeline-toolbar',
    '.storyboard-3d-timeline-key-editor',
    '.storyboard-3d-director-path-points',
  ],
  controlKey = (tag) =>
    JSON.stringify({
      tag: tag?.tagName,
      data: Object.entries(tag?.dataset || {}).sort(([value], [item]) =>
        value.localeCompare(item),
      ),
      clip: tag?.closest?.('[data-director-clip]')?.dataset.directorClip || '',
    });
export function captureTimelinePresentation(el) {
  const shotId = el?.querySelector?.('[data-storyboard-3d-shot-timeline]');
  if (!shotId) return null;
  const key = shotId.ownerDocument.activeElement;
  return {
    shotId: shotId.dataset.shotId,
    details: [...shotId.querySelectorAll('details')].map((text, index) => ({
      index: index,
      text: text.querySelector('summary')?.textContent,
      open: text.open,
    })),
    scroll: SCROLLERS.map((selector) => {
      const top = shotId.querySelector(selector);
      return {
        selector: selector,
        top: top?.scrollTop || 0,
        left: top?.scrollLeft || 0,
      };
    }),
    focus: shotId.contains(key) ? controlKey(key) : null,
    selection:
      typeof key?.selectionStart === 'number' ? [key.selectionStart, key.selectionEnd] : null,
  };
}
export function restoreTimelinePresentation(el2, el3) {
  const el4 = el2?.querySelector?.('[data-storyboard-3d-shot-timeline]');
  if (!el3 || el3.shotId !== el4?.dataset.shotId) return;
  const result = el4.querySelectorAll('details');
  for (const response of el3.details || [])
    if (result[response.index]?.querySelector('summary')?.textContent === response.text)
      result[response.index].open = response.open;
  (el3.focus &&
    queueMicrotask(() => {
      const el5 = el2?.querySelector?.('[data-storyboard-3d-shot-timeline]');
      if (el5?.dataset.shotId !== el3.shotId) return;
      const el6 = [...el5.querySelectorAll('input, select, button, textarea')].find(
          (data) => controlKey(data) === el3.focus,
        ),
        options = el5.ownerDocument.activeElement;
      if (!el6?.isConnected || (options !== el5.ownerDocument.body && options !== el6)) return;
      el6.focus({ preventScroll: true });
      if (el3.selection && typeof el6.selectionStart === 'number')
        el6.setSelectionRange(...el3.selection);
    }),
    el3.scroll.forEach(({ selector: selector2, top: top2, left: left }) => {
      const target = el4.querySelector(selector2);
      target && ((target.scrollTop = top2), (target.scrollLeft = left));
    }));
}
