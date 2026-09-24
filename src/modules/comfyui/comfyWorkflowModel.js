export const COMFY_NODE_SIZE = Object.freeze({ width: 760, height: 640 });
export const ACTIVE_STATES = new Set(['submitting', 'queued', 'running', 'unknown']);
const ID = /^[a-zA-Z0-9_-]{1,128}$/;
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);

export function parseComfyWorkflow(input) {
  const parsed = typeof input === 'string' ? JSON.parse(input) : input;
  const prompt = parsed?.prompt && typeof parsed.prompt === 'object' ? parsed.prompt : parsed;
  if (!prompt || Array.isArray(prompt) || typeof prompt !== 'object' || !Object.keys(prompt).length || Object.keys(prompt).length > 500) {
    throw new Error('需要 ComfyUI 的 API 格式工作流（1–500 个节点）');
  }
  const result = JSON.parse(JSON.stringify(prompt));
  for (const [id, node] of Object.entries(result)) {
    if (!ID.test(id) || FORBIDDEN.has(id) || !node || typeof node.class_type !== 'string' || !node.class_type ||
        !node.inputs || Array.isArray(node.inputs) || typeof node.inputs !== 'object') {
      throw new Error('工作流格式不正确：请在 ComfyUI 导出 API 格式，而不是普通界面 JSON');
    }
    for (const [key, value] of Object.entries(node.inputs)) {
      if (FORBIDDEN.has(key)) throw new Error('工作流包含不支持的字段名');
      if (Array.isArray(value)) {
        if (value.length !== 2 || !Object.hasOwn(result, String(value[0])) || !Number.isInteger(value[1]) || value[1] < 0) throw new Error(`节点 ${id} 存在无效连线`);
      } else if (value !== null && typeof value === 'object') throw new Error(`节点 ${id} 的嵌套对象参数暂不支持`);
      else if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('参数不能是非有限数字');
    }
  }
  if (JSON.stringify(result).length > 2 * 1024 * 1024) throw new Error('工作流超过 2MB 限制');
  return result;
}
export function editableInputs(prompt) {
  const result = [];
  for (const [nodeId, node] of Object.entries(prompt || {})) {
    for (const [input, value] of Object.entries(node.inputs || {})) {
      if (['string', 'number', 'boolean'].includes(typeof value)) result.push({ nodeId, input, value,
        title: String(node._meta?.title || node.class_type || nodeId),
        isImage: node.class_type === 'LoadImage' && input === 'image' });
    }
  }
  return result;
}
export function patchWorkflowInput(prompt, nodeId, input, value) {
  if (!Object.hasOwn(prompt || {}, nodeId) || !Object.hasOwn(prompt[nodeId].inputs, input)) throw new Error('参数不存在');
  const before = prompt[nodeId].inputs[input];
  if (!['string', 'number', 'boolean'].includes(typeof before) || typeof value !== typeof before) throw new Error('参数类型不匹配');
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('请输入有效数字');
  return { ...prompt, [nodeId]: { ...prompt[nodeId], inputs: { ...prompt[nodeId].inputs, [input]: value } } };
}
export function createComfyWorkflowNodeData({ id, x = 0, y = 0, width, height, name = 'ComfyUI 工作流' } = {}) {
  return { id, type: 'comfyui-workflow', x, y, name,
    width: Math.max(520, Number(width) || COMFY_NODE_SIZE.width),
    height: Math.max(480, Number(height) || COMFY_NODE_SIZE.height),
    comfyWorkflow: { version: 1, endpoint: 'http://127.0.0.1:8188', workflow: null, workflowName: '', job: null } };
}
export function newRequestId() {
  return globalThis.crypto?.randomUUID?.() || `comfy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
export function resultNodeId(requestId, fileKey) {
  // Stable across retries, so retrying a partially saved batch does not duplicate nodes.
  return `comfy-output-${requestId}-${fileKey}`;
}
