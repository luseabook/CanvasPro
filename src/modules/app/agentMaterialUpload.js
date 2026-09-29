export function createAgentMaterialUploader({
  canvasNodeFlows: _0x29bc29,
  graphStore: _0x3fbb80,
  getBaseName: _0x52f3c0,
} = {}) {
  return async function _0x46094e(_0xd5ba11) {
    if (!_0xd5ba11?.['type']) return null;
    const _0x547bae = await _0x29bc29?.['createMediaNodeFromBlob']?.(_0xd5ba11, _0xd5ba11['type'], {
      placement: 'viewport-center-sequence',
      sequenceKey: 'agent-upload',
      name: _0x52f3c0?.(_0xd5ba11['name']) || _0xd5ba11['name'] || '',
    });
    if (!_0x547bae) return null;
    const _0x1dffe4 = _0x3fbb80?.['getState']?.() || _0x3fbb80?.['getStateRaw']?.() || {},
      _0x2ae165 = Array['isArray'](_0x1dffe4['selectedNodeIds']) ? _0x1dffe4['selectedNodeIds'] : [],
      _0x528678 = _0x2ae165[_0x2ae165['length'] - 0x1] || '';
    return _0x528678 ? _0x1dffe4['nodes']?.[_0x528678] || null : null;
  };
}
