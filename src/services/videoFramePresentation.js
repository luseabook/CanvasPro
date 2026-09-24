const videoFramePresentationState = new WeakMap();
function normalizeSource(_0x2b9cd5) {
  const _0x518fbe = String(_0x2b9cd5 || '')['trim']();
  if (!_0x518fbe) return '';
  try {
    return new URL(
      _0x518fbe,
      globalThis['location']?.['href'] || globalThis['window']?.['location']?.['href'],
    )['href'];
  } catch {
    return _0x518fbe;
  }
}
export function getVideoPresentationSource(_0x24dbcb) {
  return normalizeSource(
    _0x24dbcb?.['dataset']?.['desktopMediaSourceUrl'] ||
      _0x24dbcb?.['currentSrc'] ||
      _0x24dbcb?.['getAttribute']?.('src') ||
      _0x24dbcb?.['src'],
  );
}
function getDeclaredVideoSource(_0x46cfd9) {
  return normalizeSource(
    _0x46cfd9?.['getAttribute']?.('src') || _0x46cfd9?.['src'] || _0x46cfd9?.['currentSrc'],
  );
}
function cancelPendingFrameCallback(_0x559c02, _0x43224b) {
  if (!_0x43224b || _0x43224b['callbackId'] == null) return;
  try {
    _0x559c02?.['cancelVideoFrameCallback']?.(_0x43224b['callbackId']);
  } catch {}
  _0x43224b['callbackId'] = null;
}
function clearPresentedDataset(_0x4d47f5) {
  if (!_0x4d47f5?.['dataset']) return;
  (delete _0x4d47f5['dataset']['firstFramePresented'],
    delete _0x4d47f5['dataset']['firstFramePresentedAt'],
    delete _0x4d47f5['dataset']['firstFramePresentedSource']);
}
function createSourceState(_0x26dccc, _0x4fcd07) {
  const _0x310788 = videoFramePresentationState['get'](_0x26dccc);
  (cancelPendingFrameCallback(_0x26dccc, _0x310788),
    _0x310788?.['cleanup']?.(),
    clearPresentedDataset(_0x26dccc));
  const _0x45f7dd = {
    source: _0x4fcd07,
    declaredSource: getDeclaredVideoSource(_0x26dccc),
    callbackId: null,
    frameCallbackObserved: ![],
    frameCallbackAt: 0x0,
    presented: ![],
    presentedAt: 0x0,
    metadata: null,
    listeners: new Set(),
  };
  videoFramePresentationState['set'](_0x26dccc, _0x45f7dd);
  const _0x39daca = () => resetVideoFramePresentation(_0x26dccc);
  return (
    _0x26dccc['addEventListener']?.('emptied', _0x39daca),
    (_0x45f7dd['cleanup'] = () => _0x26dccc['removeEventListener']?.('emptied', _0x39daca)),
    _0x45f7dd
  );
}
function readSourceState(_0x50c956) {
  const _0x3dfd78 = getVideoPresentationSource(_0x50c956),
    _0x46f87b = videoFramePresentationState['get'](_0x50c956);
  if (!_0x3dfd78) {
    if (_0x46f87b) createSourceState(_0x50c956, '');
    return { source: '', state: videoFramePresentationState['get'](_0x50c956) || null };
  }
  if (
    !_0x46f87b ||
    _0x46f87b['source'] !== _0x3dfd78 ||
    _0x46f87b['declaredSource'] !== getDeclaredVideoSource(_0x50c956)
  )
    return { source: _0x3dfd78, state: createSourceState(_0x50c956, _0x3dfd78) };
  return { source: _0x3dfd78, state: _0x46f87b };
}
function isCurrentPresentedFrameValid(_0x503122, _0x39a453, _0x3278bc = 0x2) {
  return !!(
    _0x503122 &&
    _0x39a453 &&
    _0x503122['isConnected'] !== ![] &&
    getVideoPresentationSource(_0x503122) === _0x39a453 &&
    videoFramePresentationState['get'](_0x503122)?.['declaredSource'] === getDeclaredVideoSource(_0x503122) &&
    Number(_0x503122['readyState'] || 0x0) >= _0x3278bc &&
    Number(_0x503122['videoWidth'] || 0x0) > 0x0 &&
    Number(_0x503122['videoHeight'] || 0x0) > 0x0 &&
    !_0x503122['error']
  );
}
export function resetVideoFramePresentation(_0x4f780c) {
  if (!_0x4f780c) return;
  const _0x3fc189 = videoFramePresentationState['get'](_0x4f780c);
  (cancelPendingFrameCallback(_0x4f780c, _0x3fc189),
    _0x3fc189?.['cleanup']?.(),
    videoFramePresentationState['delete'](_0x4f780c),
    clearPresentedDataset(_0x4f780c));
}
export function hasPresentedVideoFrame(_0x5dd21e, _0x212ba2 = '') {
  if (!_0x5dd21e) return ![];
  const _0x330ea9 = getVideoPresentationSource(_0x5dd21e),
    _0x4c4656 = normalizeSource(_0x212ba2);
  if (!_0x330ea9 || (_0x4c4656 && _0x330ea9 !== _0x4c4656)) return ![];
  const _0x20393d = videoFramePresentationState['get'](_0x5dd21e);
  return !!(
    _0x20393d?.['presented'] === !![] &&
    _0x20393d['source'] === _0x330ea9 &&
    isCurrentPresentedFrameValid(_0x5dd21e, _0x330ea9, 0x1)
  );
}
export function watchVideoFramePresentation(_0x1b421f, _0x11ee61) {
  if (!_0x1b421f) return ![];
  const { source: _0x2256c2, state: _0x307a0d } = readSourceState(_0x1b421f);
  if (!_0x2256c2 || !_0x307a0d) return ![];
  if (
    !_0x307a0d['presented'] &&
    _0x307a0d['frameCallbackObserved'] &&
    isCurrentPresentedFrameValid(_0x1b421f, _0x2256c2)
  ) {
    ((_0x307a0d['presented'] = !![]), (_0x307a0d['presentedAt'] = _0x307a0d['frameCallbackAt']));
    _0x1b421f['dataset'] &&
      ((_0x1b421f['dataset']['firstFramePresented'] = '1'),
      (_0x1b421f['dataset']['firstFramePresentedAt'] = String(_0x307a0d['presentedAt'])),
      (_0x1b421f['dataset']['firstFramePresentedSource'] = _0x2256c2));
    globalThis['window']?.['__runtimeCompareMark']?.('video-frame-presentation:ready', {
      source: _0x2256c2,
      readyState: Number(_0x1b421f['readyState'] || 0x0),
      videoWidth: Number(_0x1b421f['videoWidth'] || 0x0),
      videoHeight: Number(_0x1b421f['videoHeight'] || 0x0),
    });
    const _0x2e1dd3 = Array['from'](_0x307a0d['listeners']);
    _0x307a0d['listeners']['clear']();
    const _0x414e0f = {
      source: _0x2256c2,
      presentedAt: _0x307a0d['presentedAt'],
      metadata: _0x307a0d['metadata'],
    };
    for (const _0x387160 of _0x2e1dd3) {
      if (videoFramePresentationState['get'](_0x1b421f) !== _0x307a0d) break;
      _0x387160(_0x414e0f);
    }
  }
  if (_0x307a0d['presented'] && isCurrentPresentedFrameValid(_0x1b421f, _0x2256c2))
    return (
      _0x11ee61?.({
        source: _0x2256c2,
        presentedAt: _0x307a0d['presentedAt'],
        metadata: _0x307a0d['metadata'],
      }),
      !![]
    );
  if (typeof _0x11ee61 === 'function') _0x307a0d['listeners']['add'](_0x11ee61);
  if (_0x307a0d['callbackId'] != null) return !![];
  if (typeof _0x1b421f['requestVideoFrameCallback'] !== 'function') return ![];
  return (
    (_0x307a0d['callbackId'] = _0x1b421f['requestVideoFrameCallback']((_0x794c49, _0x1953f8 = {}) => {
      const _0x39f35c = videoFramePresentationState['get'](_0x1b421f);
      if (_0x39f35c !== _0x307a0d) return;
      _0x307a0d['callbackId'] = null;
      const _0x40d82b = !!(
        _0x1b421f?.['isConnected'] !== ![] &&
        getVideoPresentationSource(_0x1b421f) === _0x2256c2 &&
        Number(_0x1b421f?.['videoWidth'] || _0x1953f8['width'] || 0x0) > 0x0 &&
        Number(_0x1b421f?.['videoHeight'] || _0x1953f8['height'] || 0x0) > 0x0 &&
        !_0x1b421f?.['error']
      );
      _0x40d82b &&
        ((_0x307a0d['frameCallbackObserved'] = !![]),
        (_0x307a0d['frameCallbackAt'] = Number(_0x794c49 || 0x0)),
        (_0x307a0d['metadata'] = {
          mediaTime: Number(_0x1953f8['mediaTime'] || 0x0),
          presentedFrames: Number(_0x1953f8['presentedFrames'] || 0x0),
          width: Number(_0x1953f8['width'] || _0x1b421f['videoWidth'] || 0x0),
          height: Number(_0x1953f8['height'] || _0x1b421f['videoHeight'] || 0x0),
        }));
      if (!isCurrentPresentedFrameValid(_0x1b421f, _0x2256c2)) {
        globalThis['window']?.['__runtimeCompareMark']?.('video-frame-presentation:invalid', {
          source: _0x2256c2,
          currentSource: getVideoPresentationSource(_0x1b421f),
          readyState: Number(_0x1b421f?.['readyState'] || 0x0),
          videoWidth: Number(_0x1b421f?.['videoWidth'] || 0x0),
          videoHeight: Number(_0x1b421f?.['videoHeight'] || 0x0),
        });
        return;
      }
      ((_0x307a0d['presented'] = !![]), (_0x307a0d['presentedAt'] = _0x307a0d['frameCallbackAt']));
      _0x1b421f['dataset'] &&
        ((_0x1b421f['dataset']['firstFramePresented'] = '1'),
        (_0x1b421f['dataset']['firstFramePresentedAt'] = String(_0x307a0d['presentedAt'])),
        (_0x1b421f['dataset']['firstFramePresentedSource'] = _0x2256c2));
      globalThis['window']?.['__runtimeCompareMark']?.('video-frame-presentation:ready', {
        source: _0x2256c2,
        readyState: Number(_0x1b421f['readyState'] || 0x0),
        videoWidth: Number(_0x1b421f['videoWidth'] || 0x0),
        videoHeight: Number(_0x1b421f['videoHeight'] || 0x0),
      });
      const _0xa48175 = Array['from'](_0x307a0d['listeners']);
      _0x307a0d['listeners']['clear']();
      const _0x1f40f3 = {
        source: _0x2256c2,
        presentedAt: _0x307a0d['presentedAt'],
        metadata: _0x307a0d['metadata'],
      };
      for (const _0x31c3cc of _0xa48175) {
        if (videoFramePresentationState['get'](_0x1b421f) !== _0x307a0d) break;
        _0x31c3cc(_0x1f40f3);
      }
    })),
    !![]
  );
}
export const __videoFramePresentationForTest = {
  getState(_0x33a769) {
    return videoFramePresentationState['get'](_0x33a769) || null;
  },
};
