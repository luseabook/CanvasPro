import { startMediaProgressDragSession } from '../../components/shared/mediaProgressDragSession.js';
export function getRotationDragValue(value, item, key = {}) {
  const index = key['ctrlKey'] ? 0.1 : key['shiftKey'] ? 5 : 1;
  return Math['round']((value + Math['trunc'](item / 6) * index) * 10) / 10;
}
export function bindRotationDrag(el, { read: read, preview: preview, commit: commit, cancel: cancel }) {
  const el2 = el['ownerDocument'],
    target = el2['defaultView'];
  let box = null,
    startMediaProgressDragSession2 = null,
    enabled = false;
  const run = (enabled2 = false) => {
      if (!box) return;
      const result = box;
      ((box = null),
        startMediaProgressDragSession2?.['dispose'](),
        (startMediaProgressDragSession2 = null),
        el2['removeEventListener']('keydown', data, true));
      if (el['hasPointerCapture']?.(result['id'])) el['releasePointerCapture'](result['id']);
      (el['classList']['remove']('is-dragging'), (enabled = result['dragged']));
      if (enabled2) cancel();
      else {
        if (result['dragged']) commit(result['last']);
        else (el['focus'](), el['select']());
      }
    },
    onMove = (event) => {
      if (!box || event['pointerId'] !== box['id']) return;
      const options = event['clientX'] - box['x'];
      if (Math['abs'](options) < 2 && !box['dragged']) return;
      (event['preventDefault'](), (box['dragged'] = true), el['classList']['add']('is-dragging'));
      const source = event['ctrlKey'] ? 'fine' : event['shiftKey'] ? 'snap' : 'normal';
      source !== box['modifier'] &&
        ((box['base'] = box['last']), (box['x'] = event['clientX']), (box['modifier'] = source));
      const rotationDragValue = getRotationDragValue(box['base'], event['clientX'] - box['x'], event);
      if (rotationDragValue === box['last']) return;
      ((box['last'] = rotationDragValue), preview(rotationDragValue));
    },
    onCancel = () => run(true),
    data = (event2) => {
      if (event2['key'] !== 'Escape') return;
      (event2['preventDefault'](), event2['stopImmediatePropagation'](), run(true));
    },
    next = (id) => {
      if (id['button'] !== 0 || el['disabled']) return;
      (id['preventDefault'](), id['stopPropagation'](), run(true), (enabled = false));
      const base = read();
      ((box = {
        id: id['pointerId'],
        x: id['clientX'],
        base: base,
        last: base,
        dragged: false,
        modifier: id['ctrlKey'] ? 'fine' : id['shiftKey'] ? 'snap' : 'normal',
      }),
        el['setPointerCapture']?.(id['pointerId']),
        (startMediaProgressDragSession2 = startMediaProgressDragSession({
          target: target,
          pointerId: id['pointerId'],
          onMove: onMove,
          onEnd: () => run(),
          onCancel: onCancel,
        })),
        el2['addEventListener']('keydown', data, true));
    },
    current = (event3) => {
      if (!enabled) return;
      ((enabled = false), event3['preventDefault'](), event3['stopImmediatePropagation']());
    };
  return (
    el['addEventListener']('pointerdown', next),
    el['addEventListener']('click', current, true),
    () => {
      (run(true),
        el['removeEventListener']('pointerdown', next),
        el['removeEventListener']('click', current, true));
    }
  );
}
