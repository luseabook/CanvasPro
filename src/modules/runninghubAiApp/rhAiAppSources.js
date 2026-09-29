export const SOURCE_TYPES = Object['freeze']({
  runninghub: 'runninghub-ai-app',
  runninghubWorkflow: 'runninghub-workflow',
  comfyuiLocal: 'comfyui-local-workflow',
  comfyuiCloud: 'comfyui-cloud-workflow',
});
export const SOURCE_TYPE_KEYS = Object['freeze'](Object['values'](SOURCE_TYPES));
export const COMFYUI_WORKFLOW_STATE_SCOPE = 'comfyui-workflow';
export const COMFY_UI_WORKFLOW_SHARED_SOURCE_META = Object['freeze']({
  label: 'ComfyUI 工作流',
  subtitle: '粘贴 ComfyUI API workflow，选择本地或云端运行环境',
  inputLabel: 'ComfyUI 工作流API',
  inputPlaceholder: '粘贴 ComfyUI API format workflow JSON',
  emptyText: '粘贴 ComfyUI API workflow JSON 后，点击添加组件逐行加入节点组件编辑。',
  saveSuccess: 'ComfyUI 工作流配置已保存',
  saveFailed: 'ComfyUI 工作流配置保存失败',
  deleteSuccess: 'ComfyUI\x20工作流配置已删除',
  createSuccess: 'ComfyUI 工作流节点已创建',
  createFailed: 'ComfyUI 工作流节点创建失败',
});
export const SOURCE_TYPE_META = Object['freeze']({
  [SOURCE_TYPES['runninghub']]: Object['freeze']({
    id: SOURCE_TYPES['runninghub'],
    label: 'RunningHub\x20AI\x20应用',
    panelLabel: 'RunningHub',
    subtitle: '粘贴链接，自动识别 AI 应用或工作流',
    inputLabel: 'RunningHub 请求',
    inputPlaceholder: '也可粘贴 AI 应用 curl 或 JSON',
    emptyText: '粘贴\x20RunningHub\x20AI\x20应用或工作流链接，点击获取配置。',
    saveSuccess: 'RH AI应用配置已保存',
    saveFailed: 'RH\x20AI应用配置保存失败',
    deleteSuccess: 'RH AI应用配置已删除',
    createSuccess: 'RH AI应用节点已创建',
    createFailed: 'RH AI应用节点创建失败',
  }),
  [SOURCE_TYPES['runninghubWorkflow']]: Object['freeze']({
    id: SOURCE_TYPES['runninghubWorkflow'],
    label: 'RunningHub 工作流',
    panelLabel: 'RunningHub',
    subtitle: '粘贴链接，自动识别 AI 应用或工作流',
    inputLabel: '工作流配置',
    inputPlaceholder: '通过上方工作流 ID 获取配置',
    emptyText: '粘贴\x20RunningHub\x20AI\x20应用或工作流链接，点击获取配置。',
    saveSuccess: 'RH 工作流配置已保存',
    createSuccess: 'RH 工作流节点已创建',
  }),
  [SOURCE_TYPES['comfyuiLocal']]: Object['freeze']({
    id: SOURCE_TYPES['comfyuiLocal'],
    ...COMFY_UI_WORKFLOW_SHARED_SOURCE_META,
  }),
  [SOURCE_TYPES['comfyuiCloud']]: Object['freeze']({
    id: SOURCE_TYPES['comfyuiCloud'],
    ...COMFY_UI_WORKFLOW_SHARED_SOURCE_META,
  }),
});
export function normalizeSourceType(_0xdd628d) {
  const _0x3cf1a9 = String(_0xdd628d || '')['trim']();
  return SOURCE_TYPE_KEYS['includes'](_0x3cf1a9) ? _0x3cf1a9 : '';
}
export function getSourceMeta(_0x57581a) {
  return SOURCE_TYPE_META[normalizeSourceType(_0x57581a)] || null;
}
export function isComfyUiSource(_0x3ae0b2) {
  const _0x1d8cfd = normalizeSourceType(_0x3ae0b2);
  return _0x1d8cfd === SOURCE_TYPES['comfyuiLocal'] || _0x1d8cfd === SOURCE_TYPES['comfyuiCloud'];
}
export function getComfyUiBaseUrlMode(_0x2ebc70) {
  return normalizeSourceType(_0x2ebc70) === SOURCE_TYPES['comfyuiCloud'] ? 'cloud' : 'local';
}
export function getComfyUiSourceTypeFromBaseUrlMode(_0x25d8ad) {
  return String(_0x25d8ad || '')
    ['trim']()
    ['toLowerCase']() === 'cloud'
    ? SOURCE_TYPES['comfyuiCloud']
    : SOURCE_TYPES['comfyuiLocal'];
}
export function getComfyUiBaseUrlModeLabel(_0x242825) {
  return getComfyUiBaseUrlMode(_0x242825) === 'cloud' ? '云端' : '本地';
}
export function isRunningHubSource(_0x34fe99) {
  return _0x34fe99 === SOURCE_TYPES['runninghub'] || _0x34fe99 === SOURCE_TYPES['runninghubWorkflow'];
}
