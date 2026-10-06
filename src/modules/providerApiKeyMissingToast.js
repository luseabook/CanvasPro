import { openSettingsPanelToField } from './settings/panelSettings.js';
const API_KEY_ACTION_LABEL = '去设置',
  PROVIDER_ALIASES = Object.freeze({
    runninghubwf: 'runninghub',
    'runninghub-workflow': 'runninghub',
    'runninghub-model': 'runninghub',
    apimart: 'apimart',
    'agnes-domestic': 'agnes-domestic',
    agnes: 'agnes',
    volcengine: 'volcengine',
    'volcengine-ark': 'volcengine',
    'volcengine-speech': 'volcengine-speech',
    grsai: 'grsai',
    ppio: 'ppio',
    aicanvas: 'aicanvas',
    openai: 'openai',
  }),
  PROVIDER_MESSAGE_PATTERNS = Object.freeze([
    ['runninghub-international', /running\s*hub.*(?:国际版|international)/i],
    ['runninghub', /running\s*hub|runninghub|runninghubwf/i],
    ['apimart', /apimart/i],
    ['volcengine-speech', /火山语音|volcengine[-_\s]*speech/i],
    ['volcengine', /火山方舟|volcengine|ark/i],
    ['grsai', /grsai/i],
    ['ppio', /ppio|派欧/i],
    ['agnes', /agnes/i],
    ['openai', /openai/i],
  ]);
function normalizeProviderId(value) {
  const enabled = String(value || '')
    .trim()
    .toLowerCase();
  if (!enabled) return '';
  return PROVIDER_ALIASES[enabled] || enabled;
}
function isRunningHubModelKeyRequest({
  keyType: keyType,
  adapterType: adapterType,
  model: model,
  message: message,
} = {}) {
  const item = String(keyType || '')
    .trim()
    .toLowerCase();
  if (item === 'model' || item === 'modelapi' || item === 'model-api') return true;
  if (
    String(adapterType || '')
      .trim()
      .toLowerCase() === 'modelapi'
  )
    return true;
  if (
    String(model || '')
      .trim()
      .toLowerCase()
      .startsWith('runninghub-model/')
  )
    return true;
  return /(model\s*api\s*key|模型\s*api\s*(key|密钥)|企业级[-\s]*共享)/i.test(String(message || ''));
}
export function getProviderApiKeyFieldIds(options = {}) {
  const providerId = normalizeProviderId(options.providerId || options.provider);
  if (!providerId) return [];
  if (['runninghub', 'runninghub-international'].includes(providerId)) {
    const key = 'providerKey-' + providerId,
      index = key + '-model';
    return isRunningHubModelKeyRequest(options) ? [index, key] : [key, index];
  }
  return ['providerKey-' + providerId];
}
export function openProviderApiKeySettings(options2 = {}) {
  const fieldIds = Array.isArray(options2.fieldIds)
    ? options2.fieldIds
    : getProviderApiKeyFieldIds(options2);
  return openSettingsPanelToField({
    paneName: 'api-input',
    fieldIds: fieldIds,
    select: true,
    highlight: true,
  });
}
export function showProviderApiKeyMissingToast(result, actionLabel = {}) {
  const message2 = String(result || '').trim() || '请先填写 API Key',
    onAction = () => openProviderApiKeySettings({ ...actionLabel, message: message2 }),
    handler = globalThis.window?.showToast;
  if (typeof handler !== 'function') return (onAction(), true);
  return (
    handler(message2, actionLabel.type || 'warn', actionLabel.duration, {
      actionLabel: actionLabel.actionLabel || API_KEY_ACTION_LABEL,
      onAction: onAction,
    }),
    true
  );
}
export function inferProviderIdFromApiKeyMessage(data) {
  const target = String(data || '').trim(),
    source = target.match(/厂商[:：]\s*([A-Za-z0-9_-]+)/i);
  if (source?.[1]) return normalizeProviderId(source[1]);
  for (const [next, current] of PROVIDER_MESSAGE_PATTERNS) {
    if (current.test(target)) return next;
  }
  return '';
}
export function isApiKeyMissingMessage(entry) {
  const record = String(entry || '').trim();
  if (
    /火山方舟当前账号尚未开通模型/.test(record) ||
    (/has\s+not\s+activated\s+the\s+model/i.test(record) &&
      /activate\s+the\s+model\s+service/i.test(record))
  )
    return true;
  if (!/api\s*key/i.test(record)) return false;
  return /(未配置|未填写|还没填写|请先[^，。]*(?:配置|填写)|先[^，。]*(?:配置|填写)|缺少|未提供|需要配置|missing|not configured|is not configured|not provided|not set|set\s+.*api\s*key|add\s+.*api\s*key|enter\s+.*api\s*key)/i.test(record);
}
export function isApiKeyConfigurationMessage(payload) {
  const handle = String(payload || '').trim();
  if (isApiKeyMissingMessage(handle)) return true;
  if (/请先(?:在设置中)?验证[^，。]*api\s*(?:key\s*)?连接/i.test(handle)) return true;
  if (!/api\s*key/i.test(handle)) return false;
  return /(无效|失效|过期|错误|校验失败|验证失败|认证失败|鉴权失败|未授权|无权限|被禁用|invalid|expired|unauthori[sz]ed|forbidden|denied|authentication|authorization)/i.test(handle);
}
export function showProviderApiKeyMissingToastForError(state, fieldIds2 = {}) {
  const config = String(
      (typeof state?.getUserMessage === 'function' && state.getUserMessage()) ||
        state?.message ||
        state ||
        '',
    ).trim(),
    scope = String(state?.code || '')
      .trim()
      .toUpperCase(),
    input = String(state?.type || '')
      .trim()
      .toUpperCase();
  if (
    String(state?.keyType || '')
      .trim()
      .toLowerCase() === 'clilogin'
  )
    return false;
  if (!isApiKeyConfigurationMessage(config) && scope !== 'MODEL_CREDENTIAL_MISSING' && input !== 'AUTH_ERROR')
    return false;
  const providerId2 =
    normalizeProviderId(fieldIds2.providerId || fieldIds2.provider) ||
    normalizeProviderId(state?.provider || state?.providerId) ||
    inferProviderIdFromApiKeyMessage(config);
  return (
    showProviderApiKeyMissingToast(fieldIds2.message || config, {
      ...fieldIds2,
      providerId: providerId2,
      fieldIds: fieldIds2.fieldIds || state?.fieldIds,
      keyType: fieldIds2.keyType || state?.keyType,
      adapterType: fieldIds2.adapterType || state?.adapterType,
      model: fieldIds2.model || fieldIds2.modelId || state?.model,
    }),
    true
  );
}
