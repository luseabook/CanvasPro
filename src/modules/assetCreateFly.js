export function playAssetCreateFly({
  fromElement: fromElement = null,
  fromRect: fromRect = null,
  contentElement: contentElement = null,
  toElement: toElement = null,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const _0x386221 = windowObject?.['matchMedia']?.('(prefers-reduced-motion: reduce)')?.['matches'];
  if (_0x386221 || !documentObject?.['body'] || !toElement) return null;
  const _0x34e381 = fromRect || fromElement?.['getBoundingClientRect']?.(),
    _0x42af7b = toElement['getBoundingClientRect']?.(),
    _0x37f6b6 = contentElement || fromElement;
  if (!_0x37f6b6?.['cloneNode'] || !_0x34e381?.['width'] || !_0x34e381?.['height'] || !_0x42af7b) return null;
  const _0x1e3659 = documentObject['createElement']('div');
  ((_0x1e3659['className'] = 'v2-asset-create-fly'),
    (_0x1e3659['style']['left'] = _0x34e381['left'] + 'px'),
    (_0x1e3659['style']['top'] = _0x34e381['top'] + 'px'),
    (_0x1e3659['style']['width'] = _0x34e381['width'] + 'px'),
    (_0x1e3659['style']['height'] = _0x34e381['height'] + 'px'));
  const _0x10597b = _0x37f6b6['cloneNode'](!![]);
  if (_0x10597b?.['id']) _0x10597b['removeAttribute']('id');
  (_0x1e3659['appendChild'](_0x10597b), documentObject['body']['appendChild'](_0x1e3659));
  if (typeof _0x1e3659['animate'] !== 'function') return (_0x1e3659['remove'](), null);
  const _0x4da8 = _0x34e381['left'] + _0x34e381['width'] / 0x2,
    _0x139762 = _0x34e381['top'] + _0x34e381['height'] / 0x2,
    _0x485069 = _0x42af7b['left'] + _0x42af7b['width'] / 0x2,
    _0x2f96a8 = _0x42af7b['top'] + _0x42af7b['height'] / 0x2,
    _0xdeb296 = _0x1e3659['animate'](
      [
        { transform: 'translate(0,0) scale(1)', opacity: 0x1 },
        {
          transform:
            'translate(' + (_0x485069 - _0x4da8) + 'px,' + (_0x2f96a8 - _0x139762) + 'px)\x20scale(0.12)',
          opacity: 0.2,
        },
      ],
      { duration: 0x208, easing: 'cubic-bezier(0.2,\x200,\x200,\x201)' },
    );
  return (
    (_0xdeb296['onfinish'] = () => {
      (_0x1e3659['remove'](),
        typeof toElement['animate'] === 'function' &&
          toElement['animate'](
            [
              { transform: 'scale(1)', filter: 'brightness(1)' },
              { transform: 'scale(1.08)', filter: 'brightness(1.2)' },
              { transform: 'scale(1)', filter: 'brightness(1)' },
            ],
            { duration: 0x104, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
          ));
    }),
    _0x1e3659
  );
}
