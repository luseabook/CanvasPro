const SOURCE_NODE_LEGACY_DEFAULT_NAMES = Object['freeze']({
  image: Object['freeze'](['图片']),
  video: Object['freeze'](['视频']),
  audio: Object['freeze'](['音频']),
  text: Object['freeze'](['文本']),
  node: Object['freeze'](['节点']),
});
function getDefaultNodeKind(_0x3734e8) {
  const _0x2931fd = String(_0x3734e8 || '');
  if (_0x2931fd['includes']('image')) return 'image';
  if (_0x2931fd['includes']('video')) return 'video';
  if (_0x2931fd['includes']('audio')) return 'audio';
  if (_0x2931fd['includes']('text')) return 'text';
  return 'node';
}
function isSourceNode(_0x59a477) {
  return !!_0x59a477?.['type'] && String(_0x59a477['type'])['startsWith']('source-');
}
export function createSourceNodeNameBackfill({
  graphStore: _0x35df0c,
  getBaseName: _0x5e7d6c,
  translate: _0x27c1cc,
} = {}) {
  const _0x400964 =
    typeof _0x27c1cc === 'function'
      ? _0x27c1cc
      : (_0x165b28) => {
          const _0x22bdd5 = String(_0x165b28 || '')
            ['split']('.')
            ['pop']();
          return _0x22bdd5 || '';
        };
  function _0xf6f216(_0x34518b) {
    return _0x400964('sourceDefaults.' + getDefaultNodeKind(_0x34518b));
  }
  function _0x424f4b(_0x2e8003, _0x28a63b) {
    const _0x1ee995 = String(_0x2e8003 || '');
    if (!_0x1ee995) return !![];
    const _0x4ce298 = getDefaultNodeKind(_0x28a63b);
    return (
      _0x1ee995 === _0xf6f216(_0x28a63b) ||
      SOURCE_NODE_LEGACY_DEFAULT_NAMES[_0x4ce298]?.['includes'](_0x1ee995)
    );
  }
  function _0x4120c5(_0x5192a1) {
    if (!isSourceNode(_0x5192a1)) return _0x5192a1;
    const _0x1f314b = _0x5e7d6c?.(_0x5192a1['fileName']);
    if (!_0x1f314b) return _0x5192a1;
    if (_0x424f4b(_0x5192a1['name'], _0x5192a1['type'])) _0x5192a1['name'] = _0x1f314b;
    return _0x5192a1;
  }
  function _0x36806b(_0x556792) {
    if (!_0x556792 || !_0x556792['nodes']) return _0x556792;
    if (Array['isArray'](_0x556792['nodes'])) return (_0x556792['nodes']['forEach'](_0x4120c5), _0x556792);
    return (
      typeof _0x556792['nodes'] === 'object' && Object['values'](_0x556792['nodes'])['forEach'](_0x4120c5),
      _0x556792
    );
  }
  function _0x314ef9() {
    const _0x557b7d = _0x35df0c?.['getState']?.() || _0x35df0c?.['getStateRaw']?.() || {},
      _0x13cc91 = _0x557b7d['nodes'] || {};
    Object['keys'](_0x13cc91)['forEach']((_0x70b677) => {
      const _0x12f4ac = _0x13cc91[_0x70b677];
      if (!isSourceNode(_0x12f4ac)) return;
      const _0x18e303 = _0x5e7d6c?.(_0x12f4ac['fileName']);
      if (!_0x18e303) return;
      _0x424f4b(_0x12f4ac['name'], _0x12f4ac['type']) && _0x35df0c?.['renameNode']?.(_0x70b677, _0x18e303);
    });
  }
  return {
    applySourceNamesFromFileNameToCanvas: _0x36806b,
    patchStoreSourceNodeNamesFromFileName: _0x314ef9,
  };
}
