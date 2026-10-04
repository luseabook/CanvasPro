const _nodeRegistry = new Map();
class _FallbackNodeComponent {
  constructor(value) {
    this.nodeData = value;
  }
  ['mount']() {
    const el = document.createElement('div');
    return (
      (el.className = 'v2-node-fallback'),
      (el.textContent = '[未知节点: ' + this.nodeData.type + ']'),
      el
    );
  }
  ['update']() {}
}
export function registerNode(enabled, item) {
  if (typeof enabled !== 'string' || !enabled)
    throw new TypeError('[registry] registerNode() 第一参数 type 必须是非空字符串');
  if (typeof item !== 'function')
    throw new TypeError('[registry] registerNode() 第二参数 ComponentClass 必须是一个类或构造函数');
  _nodeRegistry.set(enabled, item);
}
export function getNodeClass(key) {
  return _nodeRegistry.get(key) ?? _FallbackNodeComponent;
}
export function listRegistered() {
  return [..._nodeRegistry.keys()];
}
export function isNodeType(enabled2, list) {
  if (!enabled2 || typeof enabled2.type !== 'string') return false;
  if (Array.isArray(list)) return list.includes(enabled2.type);
  return enabled2.type === list;
}
