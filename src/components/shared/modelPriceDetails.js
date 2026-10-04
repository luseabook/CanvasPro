import { computeTooltipPosition } from '../../modules/tooltipUnifier.js';
import { formatPrice, priceText } from '../../services/modelPricingText.js';
import { registerEscapeScope } from '../../services/escapeScope.js';
let nextId = 0x0;
export function bindModelPriceDetails(el, handler, handler2) {
  const el2 = el['ownerDocument'],
    width = el2['defaultView'];
  let el3 = null,
    setTimeout2 = null,
    enabled = ![],
    registerEscapeScope2 = null;
  const value = 'model-price-details-' + ++nextId,
    handler3 = () => {
      if (!el3) return;
      const box = computeTooltipPosition(el['getBoundingClientRect'](), el3['getBoundingClientRect'](), {
        width: width['innerWidth'],
        height: width['innerHeight'],
      });
      ((el3['style']['left'] = box['left'] + 'px'), (el3['style']['top'] = box['top'] + 'px'));
    },
    close = () => {
      (clearTimeout(setTimeout2),
        (enabled = ![]),
        registerEscapeScope2?.(),
        (registerEscapeScope2 = null),
        el3?.['remove'](),
        (el3 = null),
        el['setAttribute']('aria-expanded', 'false'),
        width['removeEventListener']('resize', handler3),
        width['removeEventListener']('scroll', handler3, !![]),
        el2['removeEventListener']('pointerdown', item, !![]));
    },
    item = (event) => {
      if (!el['contains'](event['target']) && !el3?.['contains'](event['target'])) close();
    },
    key = () => {
      if (!enabled) setTimeout2 = setTimeout(close, 0xb4);
    },
    handler4 = () => clearTimeout(setTimeout2),
    render = () => {
      if (!el3) return;
      const response = handler(),
        index = el3['scrollTop'],
        el4 = el2['createDocumentFragment'](),
        handler5 = (result, data, options) => {
          const el5 = el2['createElement'](result);
          el5['textContent'] = data;
          if (options) el5['className'] = options;
          return (el4['appendChild'](el5), el5);
        };
      handler5('strong', response['title'], 'model-price-details-title');
      if (response['status']) handler5('p', response['status'], 'model-price-details-note');
      if (response['estimate'] !== null && response['estimate'] !== undefined)
        handler5('p', priceText('total') + '\x20' + formatPrice(response['estimate'], response['currency']));
      let target = null;
      for (const source of response['rows'] || []) {
        if (source['section'] && source['section'] !== target)
          handler5('p', source['section'], 'model-price-details-section');
        target = source['section'];
        const next = handler5('div', '', 'model-price-details-row'),
          el6 = el2['createElement']('span');
        el6['textContent'] = source['label'];
        const el7 = el2['createElement']('span');
        ((el7['textContent'] =
          formatPrice(source['amount'], source['currency'] || response['currency']) + ' · ' + source['unit']),
          next['append'](el6, el7));
      }
      for (const current of response['notes'] || []) handler5('p', current, 'model-price-details-note');
      (el3['replaceChildren'](el4), (el3['scrollTop'] = index), handler3());
    },
    handler6 = () => {
      handler4();
      if (el['hidden']) return;
      (!el3 &&
        ((el3 = el2['createElement']('div')),
        (el3['id'] = value),
        (el3['className'] = 'model-price-details'),
        el3['setAttribute']('role', 'region'),
        el3['setAttribute']('aria-label', priceText('price')),
        (el3['tabIndex'] = 0x0),
        el3['addEventListener']('mouseenter', handler4),
        el3['addEventListener']('mouseleave', key),
        el3['addEventListener']('focusin', handler4),
        el3['addEventListener']('focusout', key),
        el2['body']['appendChild'](el3),
        el['setAttribute']('aria-expanded', 'true'),
        width['addEventListener']('resize', handler3),
        width['addEventListener']('scroll', handler3, !![]),
        el2['addEventListener']('pointerdown', item, !![]),
        (registerEscapeScope2 = registerEscapeScope(() => {
          (el['focus']({ preventScroll: !![] }), close());
        }))),
        render(),
        handler2());
    },
    entry = (event2) => {
      (event2['preventDefault'](), event2['stopPropagation'](), handler6(), (enabled = !![]));
    },
    record = (event3) => event3['stopPropagation']();
  return (
    el['setAttribute']('aria-controls', value),
    el['setAttribute']('aria-expanded', 'false'),
    el['addEventListener']('mouseenter', handler6),
    el['addEventListener']('mouseleave', key),
    el['addEventListener']('focus', handler6),
    el['addEventListener']('blur', key),
    el['addEventListener']('click', entry),
    el['addEventListener']('pointerdown', record),
    {
      render: render,
      close: close,
      destroy() {
        close();
        for (const [payload, handle] of [
          ['mouseenter', handler6],
          ['mouseleave', key],
          ['focus', handler6],
          ['blur', key],
          ['click', entry],
          ['pointerdown', record],
        ])
          el['removeEventListener'](payload, handle);
      },
    }
  );
}
