const _nodeRegistry = new Map();
class _FallbackNodeComponent {
  constructor(_0x1c733c) {
    this.nodeData = _0x1c733c;
  }
  ['mount']() {
    const _0x4ea89a = document.createElement('div');
    return (
      (_0x4ea89a.className = 'v2-node-fallback'),
      (_0x4ea89a.textContent = '[未知节点: ' + this.nodeData.type + ']'),
      _0x4ea89a
    );
  }
  ['update']() {}
}
export function registerNode(_0x52d2ef, _0x464d88) {
  if (typeof _0x52d2ef !== 'string' || !_0x52d2ef)
    throw new TypeError('[registry] registerNode() 第一参数 type 必须是非空字符串');
  if (typeof _0x464d88 !== 'function')
    throw new TypeError('[registry] registerNode() 第二参数 ComponentClass 必须是一个类或构造函数');
  _nodeRegistry.set(_0x52d2ef, _0x464d88);
}
export function getNodeClass(_0x54af1d) {
  return _nodeRegistry.get(_0x54af1d) ?? _FallbackNodeComponent;
}
export function listRegistered() {
  return [..._nodeRegistry.keys()];
}
export function isNodeType(_0xb6163a, _0x3d6567) {
  if (!_0xb6163a || typeof _0xb6163a.type !== 'string') return false;
  if (Array.isArray(_0x3d6567)) return _0x3d6567.includes(_0xb6163a.type);
  return _0xb6163a.type === _0x3d6567;
}
