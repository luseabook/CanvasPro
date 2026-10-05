import { resolveDebugImageSource } from '../utils/debugImagePreview.js';
export function renderDebugRequestImages(value, list, item = [], el) {
  const el2 = value['ownerDocument'];
  ((el['hidden'] = !![]), el['replaceChildren'](), value['replaceChildren']());
  let key = 0;
  (item['forEach']((index) => {
    const debugImageSource = resolveDebugImageSource(index['src']);
    if (
      !debugImageSource ||
      index['start'] < key ||
      index['end'] > list['length'] ||
      index['end'] <= index['start']
    )
      return;
    value['append'](el2['createTextNode'](list['slice'](key, index['start'])));
    const result = el2['createElement']('span');
    result['className'] = 'request-debug-image-row';
    const el3 = el2['createElement']('span');
    ((el3['className'] = 'request-debug-thumbnail'),
      (el3['tabIndex'] = 0),
      el3['setAttribute']('role', 'img'),
      el3['setAttribute']('aria-label', index['label'] + ' · ' + index['path']),
      (el3['dataset']['label'] = index['label']),
      (el3['dataset']['state'] = 'loading'));
    const data = el2['createElement']('img');
    ((data['alt'] = ''),
      (data['loading'] = 'lazy'),
      (data['decoding'] = 'async'),
      (data['referrerPolicy'] = 'no-referrer'),
      (data['draggable'] = ![]),
      data['addEventListener']('load', () => {
        el3['dataset']['state'] = 'ready';
      }),
      data['addEventListener']('error', () => {
        ((el3['dataset']['state'] = 'error'),
          el3['setAttribute']('aria-label', index['label'] + ' · 图片加载失败 · ' + index['path']));
      }),
      (data['src'] = debugImageSource),
      el3['append'](data));
    const options = () => {
        if (el3['dataset']['state'] !== 'ready') return;
        const target = data['cloneNode']();
        (target['removeAttribute']('loading'),
          (target['alt'] = index['label']),
          el['replaceChildren'](target),
          (el['hidden'] = ![]));
      },
      source = () => {
        ((el['hidden'] = !![]), el['replaceChildren']());
      };
    (el3['addEventListener']('mouseenter', options),
      el3['addEventListener']('mouseleave', source),
      el3['addEventListener']('focus', options),
      el3['addEventListener']('blur', source));
    const next = el2['createElement']('span');
    ((next['className'] = 'request-debug-image-value'),
      (next['textContent'] = list['slice'](index['start'], index['end'])),
      result['append'](el3, next),
      value['append'](result),
      (key = index['end']));
  }),
    value['append'](el2['createTextNode'](list['slice'](key))));
}
