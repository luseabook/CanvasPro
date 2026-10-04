export function createPromptExpansionMotion(el) {
  const value = el['ownerDocument']['defaultView'];
  let value2 = null,
    value3 = null;
  function cancel() {
    const item = value2;
    ((value2 = null), item?.['cancel'](), value3?.['cancel'](), (value3 = null));
  }
  function play(box, key, { overlay: overlay, closing: closing = ![], onFinish: onFinish } = {}) {
    const index = overlay ? value['getComputedStyle'](overlay)['opacity'] : '1';
    cancel();
    if (value['matchMedia']('(prefers-reduced-motion: reduce)')['matches']) {
      onFinish?.();
      return;
    }
    const box2 = el['getBoundingClientRect'](),
      box3 = key || box2;
    if (!box2['width'] || !box2['height'] || !box?.['width'] || !box3['width']) {
      onFinish?.();
      return;
    }
    const transform = (box4) =>
        'translate(' +
        (box4['x'] - box2['x']) +
        'px,\x20' +
        (box4['y'] - box2['y']) +
        'px) scale(' +
        box4['width'] / box2['width'] +
        ',\x20' +
        box4['height'] / box2['height'] +
        ')',
      result = {
        duration: closing ? 0xf0 : 0x140,
        easing: 'cubic-bezier(0.22,\x201,\x200.36,\x201)',
        fill: 'both',
      },
      data = el['animate'](
        [
          { transform: transform(box), transformOrigin: '0\x200', filter: 'blur(0px)' },
          { offset: 0.35, filter: 'blur(1.5px)' },
          { transform: transform(box3), transformOrigin: '0 0', filter: 'blur(0px)' },
        ],
        result,
      );
    ((data['id'] = 'prompt-expansion'),
      (value2 = data),
      overlay && (value3 = overlay['animate']({ opacity: closing ? [index, 0x0] : [0x0, 0x1] }, result)),
      data['finished']
        ['then'](() => {
          if (value2 !== data) return;
          (cancel(), onFinish?.());
        })
        ['catch'](() => {}));
  }
  return { play: play, cancel: cancel };
}
