import { screenToViewportPoint } from '../../core/math.js';
const motions = new WeakMap(),
  selector = 'article[data-story-replication-episode-id]';
export function settleReplicationCardMotion(el) {
  el?.['querySelectorAll'](selector)['forEach']((value) => {
    (motions['get'](value)?.['cancel'](), motions['delete'](value));
  });
}
export function setReplicationCardDragImage(event, el2) {
  const _screenOriginX = el2['getBoundingClientRect'](),
    box = screenToViewportPoint(event['clientX'], event['clientY'], {
      _screenOriginX: _screenOriginX['left'],
      _screenOriginY: _screenOriginX['top'],
    });
  event['dataTransfer']?.['setDragImage']?.(el2, box['x'], box['y']);
}
export function previewReplicationCardOrder(el3, enabled, enabled2) {
  if (!enabled || !enabled2 || enabled === enabled2) return ![];
  const list = [...el3['querySelectorAll'](selector)],
    item = list['indexOf'](enabled) < list['indexOf'](enabled2),
    key = item ? enabled2['nextElementSibling'] : enabled2;
  if (key === enabled || enabled['nextElementSibling'] === key) return ![];
  const map = new Map(list['map']((el4) => [el4, el4['getBoundingClientRect']()]));
  (settleReplicationCardMotion(el3), el3['insertBefore'](enabled, key));
  if (el3['ownerDocument']['defaultView']['matchMedia']('(prefers-reduced-motion: reduce)')['matches'])
    return !![];
  for (const el5 of list) {
    if (el5 === enabled || !el5['animate']) continue;
    const box2 = map['get'](el5),
      box3 = el5['getBoundingClientRect'](),
      index = box2['left'] - box3['left'],
      result = box2['top'] - box3['top'];
    if (Math['abs'](index) + Math['abs'](result) < 0x1) continue;
    const data = el5['animate'](
      [{ transform: 'translate(' + index + 'px, ' + result + 'px)' }, { transform: 'translate(0, 0)' }],
      { duration: 0xdc, easing: 'cubic-bezier(0.2, 0, 0.2, 1)' },
    );
    (motions['set'](el5, data),
      (data['onfinish'] = () => {
        if (motions['get'](el5) === data) motions['delete'](el5);
      }));
  }
  return !![];
}
