import {
  normalizePersonReplacementAssetDetailSplitRatio,
  normalizePersonReplacementCompositeSidebarWidth,
  normalizePersonReplacementLayout,
} from './personReplacementProjectSession.js';
function normalizeText(_0x182798) {
  return String(_0x182798 ?? '')['trim']();
}
export function renderPersonReplacementLayoutSplitter(_0x25490c, _0x32c2d6, _0x1f3f59 = {}) {
  const _0x5e2f2b = _0x25490c === 'asset-detail',
    _0x27d40f = _0x25490c === 'center' || _0x5e2f2b,
    _0x7b43ac = _0x5e2f2b
      ? normalizePersonReplacementAssetDetailSplitRatio(_0x32c2d6['assetDetailSplitRatio'])
      : _0x25490c === 'center'
        ? _0x32c2d6['centerTop']
        : _0x32c2d6[_0x25490c],
    _0x4c80a0 = _0x5e2f2b ? 0x20 : _0x25490c === 'center' ? 0x26 : _0x25490c === 'left' ? 0x12 : 0x18,
    _0x51d385 = _0x5e2f2b ? 0x44 : _0x25490c === 'center' ? 0x52 : _0x25490c === 'left' ? 0x26 : 0x2a,
    _0x5b2139 =
      _0x1f3f59['label'] ||
      (_0x5e2f2b
        ? '调整形象预览与提示词区域高度'
        : _0x25490c === 'center'
          ? '调整中间上下区域高度'
          : _0x25490c === 'left'
            ? '调整左侧素材栏宽度'
            : '调整右侧生成栏宽度'),
    _0x29a2b5 = _0x5e2f2b ? ' data-person-replacement-asset-detail-splitter' : '';
  return (
    '<div class="person-replacement-layout-splitter panel-resize-handle panel-resize-handle--transient ' +
    (_0x27d40f ? 'panel-resize-handle--horizontal is-horizontal' : 'is-vertical') +
    ' is-' +
    _0x25490c +
    '" data-person-replacement-layout-splitter="' +
    _0x25490c +
    '\x22' +
    _0x29a2b5 +
    ' role="separator" aria-orientation="' +
    (_0x27d40f ? 'horizontal' : 'vertical') +
    '" aria-label="' +
    _0x5b2139 +
    '\x22\x20aria-valuemin=\x22' +
    _0x4c80a0 +
    '" aria-valuemax="' +
    _0x51d385 +
    '" aria-valuenow="' +
    Math['round'](_0x7b43ac) +
    '\x22\x20tabindex=\x220\x22></div>'
  );
}
export function applyPersonReplacementCompositeSidebarWidthToLayout(_0x4b10ac, _0x19e005, _0x32f336) {
  const _0xbb420e = normalizePersonReplacementCompositeSidebarWidth(_0x32f336);
  return (
    _0x4b10ac?.['style']?.['setProperty']?.('--person-replacement-composite-sidebar-width', _0xbb420e + 'px'),
    _0x19e005?.['setAttribute']?.('aria-valuenow', String(Math['round'](_0xbb420e))),
    _0xbb420e
  );
}
export function createPersonReplacementLayoutResizeController({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
  getProject: _0x4f87aa,
  commitLayoutChange: _0x2f59c8,
} = {}) {
  if (typeof _0x4f87aa !== 'function' || typeof _0x2f59c8 !== 'function')
    throw new TypeError('Person replacement layout resize requires project and commit adapters.');
  let _0xb7beb2 = null;
  const _0x4863e6 = () => {
      (_0xb7beb2?.(), (_0xb7beb2 = null));
    },
    _0x5613ee = (_0x82760b, _0x204c95) => {
      if (!_0x82760b || !_0x204c95) return ![];
      if (
        _0x82760b['isPrimary'] === ![] ||
        (Number['isFinite'](_0x82760b['button']) && _0x82760b['button'] !== 0x0)
      )
        return ![];
      const _0x387e3b = normalizeText(_0x204c95['dataset']?.['personReplacementLayoutSplitter']);
      if (!['left', 'center', 'right', 'asset-detail']['includes'](_0x387e3b)) return ![];
      const _0xb3a36e = _0x387e3b === 'asset-detail',
        _0x4b04c5 = _0x387e3b === 'center',
        _0xed5bd3 = _0x4b04c5 || _0xb3a36e,
        _0x402091 = _0xb3a36e
          ? _0x204c95['closest']?.('[data-person-replacement-asset-detail-layout]')
          : _0x4b04c5
            ? _0x204c95['closest']?.('.person-replacement-middle-layout') ||
              _0x204c95['closest']?.('.person-replacement-generation-panel')
            : _0x204c95['closest']?.('[data-person-replacement-layout]'),
        _0x10ef26 = _0x204c95['closest']?.('[data-person-replacement-layout]'),
        _0x57d5a0 = _0x402091?.['getBoundingClientRect']?.(),
        _0x31fd3d = _0xed5bd3 ? Number(_0x57d5a0?.['height']) : Number(_0x57d5a0?.['width']);
      if (!(_0x31fd3d > 0x0)) return ![];
      (_0x82760b['preventDefault']?.(), _0x82760b['stopPropagation']?.(), _0x4863e6());
      const _0x578dd5 = _0x82760b['pointerId'];
      try {
        _0x204c95['setPointerCapture']?.(_0x578dd5);
      } catch {}
      (_0x204c95['classList']?.['add']?.('is-active'),
        documentObject?.['body']?.['classList']?.['add']?.('person-replacement-layout-resizing'));
      const _0x293df7 = (_0x4eaed2) =>
        !Number['isFinite'](Number(_0x578dd5)) ||
        !Number['isFinite'](Number(_0x4eaed2?.['pointerId'])) ||
        Number(_0x4eaed2['pointerId']) === Number(_0x578dd5);
      let _0x2560ab = null,
        _0x481fd6 = 0x0;
      const _0x51a512 = (_0x140cba) => {
          if (!_0x140cba) return;
          const _0x13cafd = _0xed5bd3 ? _0x140cba['clientY'] : _0x140cba['clientX'],
            _0x49a344 = _0xed5bd3 ? _0x57d5a0['top'] : _0x57d5a0['left'],
            _0x2a6324 = ((Number(_0x13cafd) - Number(_0x49a344 || 0x0)) / _0x31fd3d) * 0x64,
            _0x25afc9 = Math['round']((_0x387e3b === 'right' ? 0x64 - _0x2a6324 : _0x2a6324) * 0x64) / 0x64,
            _0x2a6783 = _0x4f87aa();
          if (_0xb3a36e) {
            const _0xe3ec08 = normalizePersonReplacementAssetDetailSplitRatio(_0x25afc9);
            ((_0x2a6783['workspace']['assetDetailSplitRatio'] = _0xe3ec08),
              _0x402091['style']?.['setProperty']?.('--person-replacement-asset-detail-top', _0xe3ec08 + '%'),
              _0x204c95['setAttribute']?.('aria-valuenow', String(Math['round'](_0xe3ec08))));
            return;
          }
          const _0x2d4097 = _0x2a6783['workspace']['replacementLayout'],
            _0x1722cc = normalizePersonReplacementLayout({
              ..._0x2d4097,
              ...(_0x387e3b === 'center' ? { centerTop: _0x25afc9 } : { [_0x387e3b]: _0x25afc9 }),
            });
          ((_0x2a6783['workspace']['replacementLayout'] = _0x1722cc),
            _0x387e3b === 'center'
              ? _0x10ef26?.['style']?.['setProperty']?.(
                  '--person-replacement-center-top',
                  _0x1722cc['centerTop'] + '%',
                )
              : _0x402091['style']?.['setProperty']?.(
                  '--person-replacement-' + _0x387e3b + '-width',
                  _0x1722cc[_0x387e3b] + '%',
                ),
            _0x204c95['setAttribute']?.(
              'aria-valuenow',
              String(Math['round'](_0x1722cc[_0x387e3b === 'center' ? 'centerTop' : _0x387e3b])),
            ));
        },
        _0x55f161 = () => {
          _0x481fd6 = 0x0;
          const _0x58f19c = _0x2560ab;
          ((_0x2560ab = null), _0x51a512(_0x58f19c));
        },
        _0xed58ab = (_0x51849c) => {
          if (!_0x293df7(_0x51849c)) return;
          _0x2560ab = { clientX: _0x51849c?.['clientX'], clientY: _0x51849c?.['clientY'] };
          if (_0x481fd6) return;
          const _0x53ca69 = windowObject?.['requestAnimationFrame'];
          if (typeof _0x53ca69 === 'function') {
            _0x481fd6 = _0x53ca69['call'](windowObject, _0x55f161);
            return;
          }
          _0x55f161();
        },
        _0x589054 = (_0x3360a5) => {
          if (!_0x293df7(_0x3360a5)) return;
          const _0x18dff9 = _0xed5bd3 ? Number(_0x3360a5?.['clientY']) : Number(_0x3360a5?.['clientX']);
          (Number['isFinite'](_0x18dff9) &&
            (_0x2560ab = { clientX: _0x3360a5?.['clientX'], clientY: _0x3360a5?.['clientY'] }),
            _0x481fd6 &&
              typeof windowObject?.['cancelAnimationFrame'] === 'function' &&
              windowObject['cancelAnimationFrame'](_0x481fd6),
            _0x55f161(),
            _0x4863e6(),
            _0x2f59c8(_0x387e3b));
        },
        _0x13a338 = () => {
          _0x481fd6 &&
            typeof windowObject?.['cancelAnimationFrame'] === 'function' &&
            windowObject['cancelAnimationFrame'](_0x481fd6);
          ((_0x481fd6 = 0x0),
            (_0x2560ab = null),
            _0x204c95['classList']?.['remove']?.('is-active'),
            documentObject?.['body']?.['classList']?.['remove']?.('person-replacement-layout-resizing'));
          try {
            _0x204c95['releasePointerCapture']?.(_0x578dd5);
          } catch {}
          (windowObject?.['removeEventListener']?.('pointermove', _0xed58ab, !![]),
            windowObject?.['removeEventListener']?.('pointerup', _0x589054, !![]),
            windowObject?.['removeEventListener']?.('pointercancel', _0x589054, !![]));
          if (_0xb7beb2 === _0x13a338) _0xb7beb2 = null;
        };
      return (
        (_0xb7beb2 = _0x13a338),
        windowObject?.['addEventListener']?.('pointermove', _0xed58ab, !![]),
        windowObject?.['addEventListener']?.('pointerup', _0x589054, !![]),
        windowObject?.['addEventListener']?.('pointercancel', _0x589054, !![]),
        _0xed58ab(_0x82760b),
        !![]
      );
    };
  return Object['freeze']({ begin: _0x5613ee, destroy: _0x4863e6, stop: _0x4863e6 });
}
