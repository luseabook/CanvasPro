import { isStoryCanvasMediaNode } from './storyCanvasMediaSync.js';
function normalizeText(_0x217981) {
  return String(_0x217981 || '')['trim']();
}
function getMediaNodeRevision(_0x4908b4 = {}) {
  return (
    normalizeText(_0x4908b4['id']) +
    ':' +
    (Number(_0x4908b4['_bizRev']) || 0x0) +
    ':' +
    normalizeText(_0x4908b4['type'])
  );
}
export function getStoryCanvasMediaNodeSnapshot({
  graphStore: _0x3a499e,
  getActiveCanvasId: _0x2845d7,
} = {}) {
  const _0x5ad84a = _0x3a499e?.['getStateRaw']?.() || _0x3a499e?.['getState']?.() || {};
  return {
    canvasId: normalizeText(_0x2845d7?.()),
    nodes: Object['values'](_0x5ad84a['nodes'] || {})['filter'](isStoryCanvasMediaNode),
  };
}
export function subscribeStoryCanvasMediaNodeChanges({
  graphStore: _0x560cb8,
  getActiveCanvasId: _0x3f2881,
  listener: _0x4b00d6,
} = {}) {
  const _0x2f4d3c =
    typeof _0x560cb8?.['subscribeSelector'] === 'function' ||
    typeof _0x560cb8?.['subscribeRaw'] === 'function';
  if (!_0x2f4d3c || typeof _0x4b00d6 !== 'function')
    throw new Error('story canvas media node subscription dependencies are incomplete');
  let _0x1e4fc4 = '',
    _0x2fdec5 = new Map();
  const _0xcc61a7 = (_0x1904c7 = {}) => {
      const _0x5d67b4 = normalizeText(_0x3f2881?.());
      if (!_0x5d67b4) {
        ((_0x1e4fc4 = ''), (_0x2fdec5 = new Map()));
        return;
      }
      const _0x1a1609 = Object['values'](_0x1904c7['nodes'] || {})['filter'](isStoryCanvasMediaNode),
        _0x51da53 = new Map(
          _0x1a1609['map']((_0x2ff85a) => [normalizeText(_0x2ff85a['id']), getMediaNodeRevision(_0x2ff85a)]),
        );
      let _0x4c1d32 = _0x1a1609;
      if (_0x5d67b4 === _0x1e4fc4) {
        _0x4c1d32 = _0x1a1609['filter'](
          (_0x267a86) => _0x2fdec5['get'](normalizeText(_0x267a86['id'])) !== getMediaNodeRevision(_0x267a86),
        );
        for (const _0x1be7bd of _0x2fdec5['keys']()) {
          if (!_0x51da53['has'](_0x1be7bd)) _0x4c1d32['push']({ id: _0x1be7bd });
        }
      }
      ((_0x1e4fc4 = _0x5d67b4), (_0x2fdec5 = _0x51da53));
      if (!_0x4c1d32['length']) return;
      try {
        _0x4b00d6({ canvasId: _0x5d67b4, nodes: _0x4c1d32 });
      } catch (_0x26f3e7) {
        console['warn']('[storyCanvasNodeSubscription] 媒体节点同步失败', _0x26f3e7);
      }
    },
    _0x295172 = (_0x320527 = {}) =>
      normalizeText(_0x3f2881?.()) + ':' + (Number(_0x320527['_persistRev']) || 0x0);
  if (typeof _0x560cb8['subscribeSelector'] === 'function')
    return _0x560cb8['subscribeSelector'](_0x295172, () =>
      _0xcc61a7(_0x560cb8['getStateRaw']?.() || _0x560cb8['getState']?.() || {}),
    );
  let _0x1f0f52 = null;
  return _0x560cb8['subscribeRaw']((_0x111b6a = {}) => {
    const _0x506115 = _0x295172(_0x111b6a);
    if (_0x506115 === _0x1f0f52) return;
    ((_0x1f0f52 = _0x506115), _0xcc61a7(_0x111b6a));
  });
}
