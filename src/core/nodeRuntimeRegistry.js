function normalizeNodeId(_0x2a7d8f) {
  return String(_0x2a7d8f || '').trim();
}
function hasGenerationRuntimeMethod(_0x2fbfab = {}) {
  return (
    typeof _0x2fbfab.runGeneration === 'function' ||
    typeof _0x2fbfab.getGenerationStatus === 'function' ||
    typeof _0x2fbfab.cancelGeneration === 'function' ||
    typeof _0x2fbfab.resumeGeneration === 'function'
  );
}
export function createNodeRuntimeRegistry() {
  const _0x5f51a2 = new Map();
  return {
    register(_0x16f264, _0x23f763 = {}) {
      const _0x2a3162 = normalizeNodeId(_0x16f264);
      if (!_0x2a3162 || !_0x23f763 || typeof _0x23f763 !== 'object') return null;
      if (!hasGenerationRuntimeMethod(_0x23f763)) return null;
      return (_0x5f51a2.set(_0x2a3162, _0x23f763), _0x23f763);
    },
    unregister(_0x29a4e0) {
      const _0x1ea6fd = normalizeNodeId(_0x29a4e0);
      if (!_0x1ea6fd) return false;
      return _0x5f51a2.delete(_0x1ea6fd);
    },
    get(_0x1102f3) {
      const _0x40eba6 = normalizeNodeId(_0x1102f3);
      return _0x40eba6 ? _0x5f51a2.get(_0x40eba6) || null : null;
    },
    clear() {
      _0x5f51a2.clear();
    },
  };
}
export const nodeRuntimeRegistry = createNodeRuntimeRegistry();
export default nodeRuntimeRegistry;
