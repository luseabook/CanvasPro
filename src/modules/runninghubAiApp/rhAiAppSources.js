export const SOURCE_TYPES = Object.freeze({
  runninghub: 'runninghub-ai-app',
  runninghubWorkflow: 'runninghub-workflow',
  comfyuiLocal: 'comfyui-local-workflow',
  comfyuiCloud: 'comfyui-cloud-workflow',
});
export const SOURCE_TYPE_KEYS = Object.freeze(Object.values(SOURCE_TYPES));
export const COMFYUI_WORKFLOW_STATE_SCOPE = 'comfyui-workflow';
export const COMFY_UI_WORKFLOW_SHARED_SOURCE_META = Object.freeze({
  label: 'ComfyUI 工作流',
  subtitle: '粘贴 ComfyUI API workflow，选择本地或云端运行环境',
  inputLabel: 'ComfyUI 工作流API',
  inputPlaceholder: '粘贴 ComfyUI API format workflow JSON',
  emptyText: '粘贴 ComfyUI API workflow JSON 后，点击添加组件逐行加入节点组件编辑。',
  saveSuccess: 'ComfyUI 工作流配置已保存',
  saveFailed: 'ComfyUI 工作流配置保存失败',
  deleteSuccess: 'ComfyUI 工作流配置已删除',
  createSuccess: 'ComfyUI 工作流节点已创建',
  createFailed: 'ComfyUI 工作流节点创建失败',
});
export const SOURCE_TYPE_META = Object.freeze({
  [SOURCE_TYPES.runninghub]: Object.freeze({
    id: SOURCE_TYPES.runninghub,
    label: 'RunningHub AI 应用',
    panelLabel: 'RunningHub',
    subtitle: '粘贴链接，自动识别 AI 应用或工作流',
    inputLabel: 'RunningHub 请求',
    inputPlaceholder: '也可粘贴 AI 应用 curl 或 JSON',
    emptyText: '粘贴 RunningHub AI 应用或工作流链接，点击获取配置。',
    saveSuccess: 'RH AI应用配置已保存',
    saveFailed: 'RH AI应用配置保存失败',
    deleteSuccess: 'RH AI应用配置已删除',
    createSuccess: 'RH AI应用节点已创建',
    createFailed: 'RH AI应用节点创建失败',
  }),
  [SOURCE_TYPES.runninghubWorkflow]: Object.freeze({
    id: SOURCE_TYPES.runninghubWorkflow,
    label: 'RunningHub 工作流',
    panelLabel: 'RunningHub',
    subtitle: '粘贴链接，自动识别 AI 应用或工作流',
    inputLabel: '工作流配置',
    inputPlaceholder: '通过上方工作流 ID 获取配置',
    emptyText: '粘贴 RunningHub AI 应用或工作流链接，点击获取配置。',
    saveSuccess: 'RH 工作流配置已保存',
    createSuccess: 'RH 工作流节点已创建',
  }),
  [SOURCE_TYPES.comfyuiLocal]: Object.freeze({
    id: SOURCE_TYPES.comfyuiLocal,
    ...COMFY_UI_WORKFLOW_SHARED_SOURCE_META,
  }),
  [SOURCE_TYPES.comfyuiCloud]: Object.freeze({
    id: SOURCE_TYPES.comfyuiCloud,
    ...COMFY_UI_WORKFLOW_SHARED_SOURCE_META,
  }),
});
export function normalizeSourceType(value) {
  const item = String(value || '').trim();
  return SOURCE_TYPE_KEYS.includes(item) ? item : '';
}
export function getSourceMeta(key) {
  return SOURCE_TYPE_META[normalizeSourceType(key)] || null;
}
export function isComfyUiSource(index) {
  const sourceType = normalizeSourceType(index);
  return sourceType === SOURCE_TYPES.comfyuiLocal || sourceType === SOURCE_TYPES.comfyuiCloud;
}
export function getComfyUiBaseUrlMode(result) {
  return normalizeSourceType(result) === SOURCE_TYPES.comfyuiCloud ? 'cloud' : 'local';
}
export function getComfyUiSourceTypeFromBaseUrlMode(data) {
  return String(data || '')
    .trim()
    .toLowerCase() === 'cloud'
    ? SOURCE_TYPES.comfyuiCloud
    : SOURCE_TYPES.comfyuiLocal;
}
export function getComfyUiBaseUrlModeLabel(options) {
  return getComfyUiBaseUrlMode(options) === 'cloud' ? '云端' : '本地';
}
export function isRunningHubSource(target) {
  return target === SOURCE_TYPES.runninghub || target === SOURCE_TYPES.runninghubWorkflow;
}
