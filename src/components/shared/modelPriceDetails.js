import { computeTooltipPosition } from '../../modules/tooltipUnifier.js';
import { formatPrice, priceText } from '../../services/modelPricingText.js';
import { registerEscapeScope } from '../../services/escapeScope.js';
let nextId = 0x0;
export function bindModelPriceDetails(_0x411619, _0x368f53, _0x24c201) {
  const _0x1133e6 = _0x411619['ownerDocument'],
    _0x3b63d6 = _0x1133e6['defaultView'];
  let _0x4c1d7a = null,
    _0x57303f = null,
    _0x50cb1a = ![],
    _0x225716 = null;
  const _0x2dcc9f = 'model-price-details-' + ++nextId,
    _0x9b1cea = () => {
      if (!_0x4c1d7a) return;
      const _0x375807 = computeTooltipPosition(
        _0x411619['getBoundingClientRect'](),
        _0x4c1d7a['getBoundingClientRect'](),
        { width: _0x3b63d6['innerWidth'], height: _0x3b63d6['innerHeight'] },
      );
      ((_0x4c1d7a['style']['left'] = _0x375807['left'] + 'px'),
        (_0x4c1d7a['style']['top'] = _0x375807['top'] + 'px'));
    },
    _0x22cf44 = () => {
      (clearTimeout(_0x57303f),
        (_0x50cb1a = ![]),
        _0x225716?.(),
        (_0x225716 = null),
        _0x4c1d7a?.['remove'](),
        (_0x4c1d7a = null),
        _0x411619['setAttribute']('aria-expanded', 'false'),
        _0x3b63d6['removeEventListener']('resize', _0x9b1cea),
        _0x3b63d6['removeEventListener']('scroll', _0x9b1cea, !![]),
        _0x1133e6['removeEventListener']('pointerdown', _0x534db1, !![]));
    },
    _0x534db1 = (_0xc4a0) => {
      if (!_0x411619['contains'](_0xc4a0['target']) && !_0x4c1d7a?.['contains'](_0xc4a0['target']))
        _0x22cf44();
    },
    _0x5ba715 = () => {
      if (!_0x50cb1a) _0x57303f = setTimeout(_0x22cf44, 0xb4);
    },
    _0x51471a = () => clearTimeout(_0x57303f),
    _0x572ba4 = () => {
      if (!_0x4c1d7a) return;
      const _0x5dfc48 = _0x368f53(),
        _0x16cee4 = _0x4c1d7a['scrollTop'],
        _0x501db2 = _0x1133e6['createDocumentFragment'](),
        _0x4c6496 = (_0x234a6b, _0xb36c08, _0x47d876) => {
          const _0x1ec1d9 = _0x1133e6['createElement'](_0x234a6b);
          _0x1ec1d9['textContent'] = _0xb36c08;
          if (_0x47d876) _0x1ec1d9['className'] = _0x47d876;
          return (_0x501db2['appendChild'](_0x1ec1d9), _0x1ec1d9);
        };
      _0x4c6496('strong', _0x5dfc48['title'], 'model-price-details-title');
      if (_0x5dfc48['status']) _0x4c6496('p', _0x5dfc48['status'], 'model-price-details-note');
      if (_0x5dfc48['estimate'] !== null && _0x5dfc48['estimate'] !== undefined)
        _0x4c6496(
          'p',
          priceText('total') + '\x20' + formatPrice(_0x5dfc48['estimate'], _0x5dfc48['currency']),
        );
      let _0x2f78da = null;
      for (const _0x54a1f2 of _0x5dfc48['rows'] || []) {
        if (_0x54a1f2['section'] && _0x54a1f2['section'] !== _0x2f78da)
          _0x4c6496('p', _0x54a1f2['section'], 'model-price-details-section');
        _0x2f78da = _0x54a1f2['section'];
        const _0x50664f = _0x4c6496('div', '', 'model-price-details-row'),
          _0x3fd51b = _0x1133e6['createElement']('span');
        _0x3fd51b['textContent'] = _0x54a1f2['label'];
        const _0x17f0aa = _0x1133e6['createElement']('span');
        ((_0x17f0aa['textContent'] =
          formatPrice(_0x54a1f2['amount'], _0x54a1f2['currency'] || _0x5dfc48['currency']) +
          ' · ' +
          _0x54a1f2['unit']),
          _0x50664f['append'](_0x3fd51b, _0x17f0aa));
      }
      for (const _0x4a24b7 of _0x5dfc48['notes'] || []) _0x4c6496('p', _0x4a24b7, 'model-price-details-note');
      (_0x4c1d7a['replaceChildren'](_0x501db2), (_0x4c1d7a['scrollTop'] = _0x16cee4), _0x9b1cea());
    },
    _0x377c6e = () => {
      _0x51471a();
      if (_0x411619['hidden']) return;
      (!_0x4c1d7a &&
        ((_0x4c1d7a = _0x1133e6['createElement']('div')),
        (_0x4c1d7a['id'] = _0x2dcc9f),
        (_0x4c1d7a['className'] = 'model-price-details'),
        _0x4c1d7a['setAttribute']('role', 'region'),
        _0x4c1d7a['setAttribute']('aria-label', priceText('price')),
        (_0x4c1d7a['tabIndex'] = 0x0),
        _0x4c1d7a['addEventListener']('mouseenter', _0x51471a),
        _0x4c1d7a['addEventListener']('mouseleave', _0x5ba715),
        _0x4c1d7a['addEventListener']('focusin', _0x51471a),
        _0x4c1d7a['addEventListener']('focusout', _0x5ba715),
        _0x1133e6['body']['appendChild'](_0x4c1d7a),
        _0x411619['setAttribute']('aria-expanded', 'true'),
        _0x3b63d6['addEventListener']('resize', _0x9b1cea),
        _0x3b63d6['addEventListener']('scroll', _0x9b1cea, !![]),
        _0x1133e6['addEventListener']('pointerdown', _0x534db1, !![]),
        (_0x225716 = registerEscapeScope(() => {
          (_0x411619['focus']({ preventScroll: !![] }), _0x22cf44());
        }))),
        _0x572ba4(),
        _0x24c201());
    },
    _0x32541a = (_0x272a92) => {
      (_0x272a92['preventDefault'](), _0x272a92['stopPropagation'](), _0x377c6e(), (_0x50cb1a = !![]));
    },
    _0x224e28 = (_0x54acbd) => _0x54acbd['stopPropagation']();
  return (
    _0x411619['setAttribute']('aria-controls', _0x2dcc9f),
    _0x411619['setAttribute']('aria-expanded', 'false'),
    _0x411619['addEventListener']('mouseenter', _0x377c6e),
    _0x411619['addEventListener']('mouseleave', _0x5ba715),
    _0x411619['addEventListener']('focus', _0x377c6e),
    _0x411619['addEventListener']('blur', _0x5ba715),
    _0x411619['addEventListener']('click', _0x32541a),
    _0x411619['addEventListener']('pointerdown', _0x224e28),
    {
      render: _0x572ba4,
      close: _0x22cf44,
      destroy() {
        _0x22cf44();
        for (const [_0x25772d, _0x459785] of [
          ['mouseenter', _0x377c6e],
          ['mouseleave', _0x5ba715],
          ['focus', _0x377c6e],
          ['blur', _0x5ba715],
          ['click', _0x32541a],
          ['pointerdown', _0x224e28],
        ])
          _0x411619['removeEventListener'](_0x25772d, _0x459785);
      },
    }
  );
}
