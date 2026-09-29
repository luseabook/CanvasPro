import { bindRefThumbHoverPreview, hideRefThumbHoverPreview } from './refThumbHoverPreview.js';
export function createTaskCenterMediaController(_0x146f73) {
  const _0x364fc4 = new Map();
  let _0x210425 = ![],
    _0x58feae = null;
  const _0x25bda2 = (_0x470954) => {
      (hideRefThumbHoverPreview(_0x470954['wrap']),
        _0x470954['image']['removeAttribute']('src'),
        (_0x470954['image']['hidden'] = !![]),
        (_0x470954['wrap']['dataset']['thumbSrc'] = ''),
        (_0x470954['wrap']['tabIndex'] = -0x1));
    },
    _0xeb4bde = (_0x323aa7) => {
      if (!_0x210425 || !_0x323aa7['inView'] || !_0x323aa7['src'] || _0x323aa7['failed'])
        return _0x25bda2(_0x323aa7);
      ((_0x323aa7['wrap']['dataset']['thumbSrc'] = _0x323aa7['src']), (_0x323aa7['wrap']['tabIndex'] = 0x0));
      if (_0x323aa7['image']['getAttribute']('src') !== _0x323aa7['src'])
        _0x323aa7['image']['setAttribute']('src', _0x323aa7['src']);
      _0x323aa7['image']['hidden'] = ![];
    },
    _0x57a50a =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            (_0x1b0335) => {
              for (const _0x250c3c of _0x1b0335) {
                const _0x3c697e = _0x364fc4['get'](_0x250c3c['target']);
                if (!_0x3c697e) continue;
                ((_0x3c697e['inView'] = _0x250c3c['isIntersecting']), _0xeb4bde(_0x3c697e));
              }
            },
            { root: _0x146f73, threshold: 0x0 },
          )
        : null;
  return {
    sync(_0x47cdf4) {
      const _0x2136da = new Set();
      for (const _0x4ed942 of _0x47cdf4) {
        const { wrap: _0x2227ed, image: _0x4f4965, src: _0x4457f3 } = _0x4ed942['thumbnail'];
        _0x2136da['add'](_0x2227ed);
        let _0x4c4c33 = _0x364fc4['get'](_0x2227ed);
        !_0x4c4c33 &&
          ((_0x4c4c33 = { wrap: _0x2227ed, image: _0x4f4965, src: '', inView: ![], failed: ![] }),
          _0x364fc4['set'](_0x2227ed, _0x4c4c33),
          (_0x4f4965['onerror'] = () => {
            ((_0x4c4c33['failed'] = !![]), _0x25bda2(_0x4c4c33));
          }));
        if (_0x4c4c33['src'] !== _0x4457f3) {
          (_0x25bda2(_0x4c4c33),
            (_0x4c4c33['src'] = _0x4457f3),
            (_0x4c4c33['failed'] = ![]),
            (_0x4c4c33['inView'] = ![]),
            _0x57a50a?.['unobserve'](_0x2227ed));
          if (_0x210425 && _0x4457f3) _0x57a50a?.['observe'](_0x2227ed);
        }
        _0xeb4bde(_0x4c4c33);
      }
      for (const [_0x5f23c4, _0x2e5da5] of _0x364fc4) {
        if (_0x2136da['has'](_0x5f23c4)) continue;
        (_0x25bda2(_0x2e5da5),
          _0x57a50a?.['unobserve'](_0x5f23c4),
          (_0x2e5da5['image']['onerror'] = null),
          _0x364fc4['delete'](_0x5f23c4));
      }
    },
    setVisible(_0x3e2c8b) {
      if (_0x210425 === _0x3e2c8b) return;
      ((_0x210425 = _0x3e2c8b), _0x58feae?.(), (_0x58feae = null), _0x57a50a?.['disconnect']());
      for (const _0x384fd4 of _0x364fc4['values']()) {
        ((_0x384fd4['inView'] = ![]), _0x25bda2(_0x384fd4));
        if (_0x210425 && _0x384fd4['src']) _0x57a50a?.['observe'](_0x384fd4['wrap']);
      }
      if (_0x210425)
        _0x58feae = bindRefThumbHoverPreview(_0x146f73, {
          selector: '.v2-task-thumbnail',
          preload: ![],
          releaseOnHide: !![],
          viewportBounded: !![],
          pauseOnScroll: !![],
        });
    },
  };
}
