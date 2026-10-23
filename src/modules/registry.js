const _nodeRegistry = new Map(),
  // 节点类型可以注册自己的连线策略：`canConnect(from, to)` 返回布尔即视为该类型的裁决，
  // 两端都注册了就取交集（都同意才连）。没注册就退回 EdgeController 的通用规则。
  _connectionPolicies = new Map(),
  // 注册时声明 `canCreateConnected: false` 的类型，不允许从它身上拖出「连线即建节点」菜单。
  _connectedCreationBlocked = new Set();
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
export function registerNode(enabled, item, { canConnect, canCreateConnected = true } = {}) {
  if (typeof enabled !== 'string' || !enabled)
    throw new TypeError('[registry] registerNode() 第一参数 type 必须是非空字符串');
  if (typeof item !== 'function')
    throw new TypeError('[registry] registerNode() 第二参数 ComponentClass 必须是一个类或构造函数');
  _nodeRegistry.set(enabled, item);
  if (typeof canConnect === 'function') _connectionPolicies.set(enabled, canConnect);
  else _connectionPolicies.delete(enabled);
  if (canCreateConnected === false) _connectedCreationBlocked.add(enabled);
  else _connectedCreationBlocked.delete(enabled);
}
/**
 * 该类型能否从自己身上拖出「连线即建节点」菜单。未注册过就算允许。
 */
export function canCreateConnectedNode(node) {
  return !_connectedCreationBlocked.has(node?.type);
}
/**
 * 取两端节点的连线裁决。
 *
 * 两端任一注册了策略就参与判断，都返回 `true` 才算通过（多注册一端只会更严）。
 * 两端都没注册时返回 `undefined` —— 调用方据此区分「没人管」与「明确拒绝」。
 */
export function getRegisteredConnectionDecision(from, to) {
  const policies = new Set([
    _connectionPolicies.get(from?.type),
    _connectionPolicies.get(to?.type),
  ]);
  policies.delete(undefined);
  if (!policies.size) return undefined;
  return [...policies].every((policy) => policy(from, to) === true);
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
