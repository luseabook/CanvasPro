const HANDOFF_CLASS = 'is-canvas-image-handoff',
  HANDOFF_FALLBACK_PROPERTY = '--canvas-image-handoff-fallback',
  HANDOFF_FALLBACK_POSITION_PROPERTY = '--canvas-image-handoff-fallback-position',
  HANDOFF_FALLBACK_SIZE_PROPERTY = '--canvas-image-handoff-fallback-size',
  handoffByImage = new WeakMap();
function readImageSource(_0x20fe49) {
  return String(
    _0x20fe49?.['getAttribute']?.('src') || _0x20fe49?.['currentSrc'] || _0x20fe49?.['src'] || '',
  )['trim']();
}
function isImagePaintReady(_0x2d7c86) {
  return !!(_0x2d7c86?.['complete'] === !![] && Number(_0x2d7c86?.['naturalWidth'] || 0x0) > 0x0);
}
function hasPaintedImageSource(_0x27cf4b, _0x1869d8) {
  return !!(
    _0x1869d8 &&
    _0x27cf4b?.['style']?.['display'] !== 'none' &&
    _0x27cf4b?.['complete'] !== ![] &&
    (_0x27cf4b?.['naturalWidth'] === undefined || Number(_0x27cf4b['naturalWidth'] || 0x0) > 0x0)
  );
}
function readFallbackLayout(_0x365b7e) {
  let _0x266b5e = null;
  if (typeof globalThis['getComputedStyle'] === 'function')
    try {
      _0x266b5e = globalThis['getComputedStyle'](_0x365b7e);
    } catch {}
  const _0xb7b98 = String(_0x365b7e?.['style']?.['objectFit'] || _0x266b5e?.['objectFit'] || 'cover')[
      'trim'
    ](),
    _0x2b9895 = String(_0x365b7e?.['style']?.['objectPosition'] || _0x266b5e?.['objectPosition'] || 'center')[
      'trim'
    ](),
    _0x5afcc3 =
      _0xb7b98 === 'contain' || _0xb7b98 === 'scale-down'
        ? 'contain'
        : _0xb7b98 === 'fill'
          ? '100% 100%'
          : _0xb7b98 === 'none'
            ? 'auto'
            : 'cover';
  return { position: _0x2b9895 || 'center', size: _0x5afcc3 };
}
function removeStateListeners(_0x132b2b, _0x47f9d7) {
  if (!_0x47f9d7 || typeof _0x132b2b?.['removeEventListener'] !== 'function') return;
  (_0x132b2b['removeEventListener']('load', _0x47f9d7['onLoad']),
    _0x132b2b['removeEventListener']('error', _0x47f9d7['onError']));
}
function clearFallbackStyle(_0x1250da) {
  (_0x1250da?.['classList']?.['remove']?.(HANDOFF_CLASS),
    _0x1250da?.['style']?.['removeProperty']?.(HANDOFF_FALLBACK_PROPERTY),
    _0x1250da?.['style']?.['removeProperty']?.(HANDOFF_FALLBACK_POSITION_PROPERTY),
    _0x1250da?.['style']?.['removeProperty']?.(HANDOFF_FALLBACK_SIZE_PROPERTY));
}
function releaseFallbackCallbacks(_0x43eaf0) {
  if (!_0x43eaf0?.['fallbackReleaseCallbacks']?.['size']) return;
  const _0x1a6150 = [..._0x43eaf0['fallbackReleaseCallbacks']];
  _0x43eaf0['fallbackReleaseCallbacks']['clear']();
  for (const _0x58f426 of _0x1a6150) {
    try {
      _0x58f426(_0x43eaf0['fallbackSource']);
    } catch {}
  }
}
function finishHandoff(_0x519e85, _0x23b142, _0x66b0f5 = {}) {
  if (!_0x519e85 || handoffByImage['get'](_0x519e85) !== _0x23b142) return ![];
  return (
    removeStateListeners(_0x519e85, _0x23b142),
    handoffByImage['delete'](_0x519e85),
    clearFallbackStyle(_0x519e85),
    _0x66b0f5['releaseFallback'] !== ![]
      ? releaseFallbackCallbacks(_0x23b142)
      : _0x23b142['fallbackReleaseCallbacks']?.['clear']?.(),
    !![]
  );
}
function schedulePaintedHandoffFinish(_0x476e31, _0x55e1f4) {
  if (
    !_0x476e31 ||
    handoffByImage['get'](_0x476e31) !== _0x55e1f4 ||
    readImageSource(_0x476e31) !== _0x55e1f4['targetSource'] ||
    _0x55e1f4['finishScheduled']
  )
    return;
  _0x55e1f4['finishScheduled'] = !![];
  const _0x3baa04 =
    typeof _0x476e31['decode'] === 'function'
      ? Promise['resolve']()
          ['then'](() => _0x476e31['decode']())
          ['catch'](() => {})
      : Promise['resolve']();
  _0x3baa04['then'](() => {
    if (
      handoffByImage['get'](_0x476e31) !== _0x55e1f4 ||
      readImageSource(_0x476e31) !== _0x55e1f4['targetSource']
    )
      return;
    if (!isImagePaintReady(_0x476e31)) {
      _0x55e1f4['finishScheduled'] = ![];
      return;
    }
    finishHandoff(_0x476e31, _0x55e1f4);
  });
}
function restoreFallbackAfterError(_0x171d07, _0x5d3659) {
  if (
    !_0x171d07 ||
    handoffByImage['get'](_0x171d07) !== _0x5d3659 ||
    readImageSource(_0x171d07) !== _0x5d3659['targetSource']
  )
    return;
  (removeStateListeners(_0x171d07, _0x5d3659), (_0x5d3659['finishScheduled'] = ![]));
  if (!_0x5d3659['fallbackSource']) {
    finishHandoff(_0x171d07, _0x5d3659);
    return;
  }
  if (_0x171d07['dataset']) {
    if (_0x5d3659['fallbackLod']) _0x171d07['dataset']['lodSrc'] = _0x5d3659['fallbackLod'];
    else delete _0x171d07['dataset']['lodSrc'];
  }
  _0x5d3659['targetSource'] = _0x5d3659['fallbackSource'];
  const _0x1b1d74 = () => {
    if (handoffByImage['get'](_0x171d07) !== _0x5d3659) return;
    (removeStateListeners(_0x171d07, _0x5d3659),
      (_0x5d3659['finishScheduled'] = ![]),
      (_0x5d3659['restoredFallback'] = !![]),
      clearFallbackStyle(_0x171d07));
  };
  ((_0x5d3659['onLoad'] = _0x1b1d74),
    (_0x5d3659['onError'] = () => finishHandoff(_0x171d07, _0x5d3659, { releaseFallback: ![] })),
    _0x171d07['addEventListener']?.('load', _0x5d3659['onLoad'], { once: !![] }),
    _0x171d07['addEventListener']?.('error', _0x5d3659['onError'], { once: !![] }),
    (_0x171d07['src'] = _0x5d3659['fallbackSource']),
    isImagePaintReady(_0x171d07) && _0x1b1d74());
}
export function deferCanvasImageDisplayFallbackRelease(_0x1dfacd, _0x37fa55, _0x500ceb) {
  const _0x57a6fc = String(_0x37fa55 || '')['trim'](),
    _0x56894e = _0x1dfacd ? handoffByImage['get'](_0x1dfacd) : null;
  if (
    !_0x57a6fc ||
    !_0x56894e ||
    _0x56894e['fallbackSource'] !== _0x57a6fc ||
    typeof _0x500ceb !== 'function'
  )
    return ![];
  return (_0x56894e['fallbackReleaseCallbacks']['add'](_0x500ceb), !![]);
}
export function clearCanvasImageDisplayHandoff(_0x438e46) {
  if (!_0x438e46) return ![];
  const _0x4a225c = handoffByImage['get'](_0x438e46);
  if (_0x4a225c) return finishHandoff(_0x438e46, _0x4a225c);
  return (clearFallbackStyle(_0x438e46), !!_0x4a225c);
}
export function assignCanvasImageDisplaySource(_0x3dedaf, _0xe4c72) {
  const _0x3d3d4a = String(_0xe4c72 || '')['trim']();
  if (!_0x3dedaf || !_0x3d3d4a) return ![];
  const _0x200841 = readImageSource(_0x3dedaf),
    _0x4615b1 = handoffByImage['get'](_0x3dedaf);
  if (_0x200841 === _0x3d3d4a && (!_0x4615b1 || _0x4615b1['targetSource'] === _0x3d3d4a)) return ![];
  let _0x20bb2c = '',
    _0x5de6c7 = '';
  const _0x29c104 = !!(
    _0x4615b1 &&
    _0x200841 === _0x4615b1['targetSource'] &&
    hasPaintedImageSource(_0x3dedaf, _0x200841) &&
    isImagePaintReady(_0x3dedaf)
  );
  if (_0x29c104) ((_0x20bb2c = _0x200841), (_0x5de6c7 = String(_0x3dedaf?.['dataset']?.['lodSrc'] || '')));
  else {
    if (_0x4615b1?.['fallbackSource'])
      ((_0x20bb2c = _0x4615b1['fallbackSource']), (_0x5de6c7 = _0x4615b1['fallbackLod']));
    else
      hasPaintedImageSource(_0x3dedaf, _0x200841) &&
        ((_0x20bb2c = _0x200841), (_0x5de6c7 = String(_0x3dedaf?.['dataset']?.['lodSrc'] || '')));
  }
  _0x4615b1 && (removeStateListeners(_0x3dedaf, _0x4615b1), handoffByImage['delete'](_0x3dedaf));
  const _0x38e821 =
    _0x4615b1?.['fallbackSource'] === _0x20bb2c
      ? new Set(_0x4615b1['fallbackReleaseCallbacks'] || [])
      : new Set();
  _0x4615b1?.['fallbackReleaseCallbacks']?.['size'] &&
    _0x4615b1['fallbackSource'] !== _0x20bb2c &&
    releaseFallbackCallbacks(_0x4615b1);
  if (!_0x20bb2c) return (clearFallbackStyle(_0x3dedaf), (_0x3dedaf['src'] = _0x3d3d4a), !![]);
  const _0x291204 = {
    fallbackSource: _0x20bb2c,
    fallbackLod: _0x5de6c7,
    targetSource: _0x3d3d4a,
    finishScheduled: ![],
    fallbackReleaseCallbacks: _0x38e821,
    onLoad: null,
    onError: null,
  };
  ((_0x291204['onLoad'] = () => schedulePaintedHandoffFinish(_0x3dedaf, _0x291204)),
    (_0x291204['onError'] = () => restoreFallbackAfterError(_0x3dedaf, _0x291204)),
    handoffByImage['set'](_0x3dedaf, _0x291204),
    _0x3dedaf['style']?.['setProperty']?.(
      HANDOFF_FALLBACK_PROPERTY,
      'url(' + JSON['stringify'](_0x20bb2c) + ')',
    ));
  const _0x1913dc = readFallbackLayout(_0x3dedaf);
  return (
    _0x3dedaf['style']?.['setProperty']?.(HANDOFF_FALLBACK_POSITION_PROPERTY, _0x1913dc['position']),
    _0x3dedaf['style']?.['setProperty']?.(HANDOFF_FALLBACK_SIZE_PROPERTY, _0x1913dc['size']),
    _0x3dedaf['classList']?.['add']?.(HANDOFF_CLASS),
    _0x3dedaf['addEventListener']?.('load', _0x291204['onLoad'], { once: !![] }),
    _0x3dedaf['addEventListener']?.('error', _0x291204['onError'], { once: !![] }),
    (_0x3dedaf['src'] = _0x3d3d4a),
    !![]
  );
}
