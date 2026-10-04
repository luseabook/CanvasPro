export const RUNNINGHUB_DOMESTIC_PROFILE_ID = 'runninghub';
export const RUNNINGHUB_INTERNATIONAL_PROFILE_ID = 'runninghub-international';
export const RUNNINGHUB_SITE_PROFILE_IDS = Object['freeze']([
  RUNNINGHUB_DOMESTIC_PROFILE_ID,
  RUNNINGHUB_INTERNATIONAL_PROFILE_ID,
]);
export const RUNNINGHUB_MODEL_API_PROFILE_IDS = RUNNINGHUB_SITE_PROFILE_IDS;
export const RUNNINGHUB_WORKFLOW_SETTINGS_KEY = 'runningHubWorkflow';
export const RUNNINGHUB_WORKFLOW_DEFAULT_PROFILE_FIELD = 'defaultProviderProfileId';
const RUNNINGHUB_INTERNATIONAL_ONLY_PROFILE_IDS = Object['freeze']([RUNNINGHUB_INTERNATIONAL_PROFILE_ID]);
export const RUNNINGHUB_INTERNATIONAL_ONLY_MODEL_IDS = Object['freeze']([
  'runninghub-model/rhart-image-v1',
  'runninghub-model/rhart-image-v1-official',
  'runninghub-model/rhart-image-n-pro',
  'runninghub-model/rhart-image-n-pro-official',
  'runninghub-model/veo3',
  'runninghub-model/youchuan-v6',
  'runninghub-model/youchuan-v7',
  'runninghub-model/youchuan-v81',
  'runninghub-model/rhart-image-n-g31-flash',
  'runninghub-model/rhart-image-n-g31-flash-official',
  'runninghub-model/rhart-image-g',
  'runninghub-model/rhart-text-g-3-pro-preview-cv/image-to-text',
  'runninghub-model/rhart-text-g-3-flash-preview-cv/image-to-text',
  'runninghub-model/rhart-image-g-2',
  'runninghub-model/rhart-image-g-2-official',
  'runninghub/suno-single-v5.5',
  'runninghub/suno-custom-v5.5',
  'runninghub/suno-single-v5',
  'runninghub/suno-custom-v5',
  'runninghub/suno-lyrics',
  'qwen/qwen3-vl-235b-a22b-instruct',
  'google/gemini-3.1-flash-lite-preview',
  'google/gemini-3.5-flash',
  'openai/gpt-5.6-sol',
  'openai/gpt-5.6-terra',
  'openai/gpt-5.5',
  'openai/gpt-5.5-pro',
  'anthropic/claude-fable-5',
  'anthropic/claude-opus-4.8',
  'anthropic/claude-opus-4.7',
]);
const RUNNINGHUB_INTERNATIONAL_ONLY_MODEL_ID_SET = new Set(RUNNINGHUB_INTERNATIONAL_ONLY_MODEL_IDS);
export const RUNNINGHUB_MODEL_API_PROFILES = Object['freeze']({
  [RUNNINGHUB_DOMESTIC_PROFILE_ID]: Object['freeze']({
    id: RUNNINGHUB_DOMESTIC_PROFILE_ID,
    label: 'RunningHUB（国内）',
    shortLabel: '国内',
    switchLabel: 'RunningHUB 国内版',
    credentialLabel: '模型 API Key',
    apiUrl: 'https://www.runninghub.cn',
  }),
  [RUNNINGHUB_INTERNATIONAL_PROFILE_ID]: Object['freeze']({
    id: RUNNINGHUB_INTERNATIONAL_PROFILE_ID,
    label: 'RunningHUB（国际）',
    shortLabel: '国际',
    switchLabel: 'RunningHUB\x20国际版',
    credentialLabel: '模型 API Key',
    apiUrl: 'https://www.runninghub.ai',
  }),
});
export function normalizeRunningHubModelApiProfileId(value) {
  const item = String(value || '')
    ['trim']()
    ['toLowerCase']();
  return item === RUNNINGHUB_INTERNATIONAL_PROFILE_ID
    ? RUNNINGHUB_INTERNATIONAL_PROFILE_ID
    : RUNNINGHUB_DOMESTIC_PROFILE_ID;
}
export function getRunningHubProviderProfileId(options = {}) {
  const key = String(options?.['providerProfileId'] || '')['trim']();
  return (
    key ||
    String(options?.['rhProviderProfileId'] || '')['trim']() ||
    String(options?.['taskProviderProfileId'] || '')['trim']()
  );
}
export function getRunningHubTaskProviderProfileId(options2 = {}) {
  return (
    String(options2?.['taskProviderProfileId'] || '')['trim']() || getRunningHubProviderProfileId(options2)
  );
}
export function resolveRunningHubSiteProfileIdFromUrl(index) {
  const enabled = String(index || '')['match'](/https?:\/\/[^\s'"`\\]+/i);
  if (!enabled) return '';
  try {
    const uRL = new URL(enabled[0x0])['hostname']['toLowerCase']();
    if (/(^|\.)runninghub\.ai$/['test'](uRL)) return RUNNINGHUB_INTERNATIONAL_PROFILE_ID;
    if (/(^|\.)runninghub\.cn$/['test'](uRL)) return RUNNINGHUB_DOMESTIC_PROFILE_ID;
  } catch {
    return '';
  }
  return '';
}
export function getRunningHubWorkflowDefaultProfileId(options3 = {}) {
  return normalizeRunningHubModelApiProfileId(
    options3?.[RUNNINGHUB_WORKFLOW_SETTINGS_KEY]?.[RUNNINGHUB_WORKFLOW_DEFAULT_PROFILE_FIELD],
  );
}
export function applyRunningHubWorkflowDefaultProfileId(
  options4 = {},
  result = RUNNINGHUB_DOMESTIC_PROFILE_ID,
) {
  return {
    ...(options4 || {}),
    [RUNNINGHUB_WORKFLOW_SETTINGS_KEY]: {
      ...(options4?.[RUNNINGHUB_WORKFLOW_SETTINGS_KEY] || {}),
      [RUNNINGHUB_WORKFLOW_DEFAULT_PROFILE_FIELD]: normalizeRunningHubModelApiProfileId(result),
    },
  };
}
export function isRunningHubInternationalOnlyModel(data) {
  return RUNNINGHUB_INTERNATIONAL_ONLY_MODEL_ID_SET['has'](String(data || '')['trim']());
}
export function getRunningHubModelApiProfileIds(target) {
  if (isRunningHubInternationalOnlyModel(target)) return RUNNINGHUB_INTERNATIONAL_ONLY_PROFILE_IDS;
  return RUNNINGHUB_MODEL_API_PROFILE_IDS;
}
export function resolveRunningHubModelApiProfileId(source, next) {
  const list = getRunningHubModelApiProfileIds(source),
    runningHubModelApiProfileId = normalizeRunningHubModelApiProfileId(next);
  return list['includes'](runningHubModelApiProfileId) ? runningHubModelApiProfileId : list[0x0];
}
export function getRunningHubModelApiProfile(current) {
  return RUNNINGHUB_MODEL_API_PROFILES[normalizeRunningHubModelApiProfileId(current)];
}
export function resolveRunningHubModelApiBaseUrl(entry, record = '') {
  const runningHubModelApiProfile = getRunningHubModelApiProfile(entry);
  return String(record || runningHubModelApiProfile['apiUrl'])
    ['trim']()
    ['replace'](/\/+$/, '');
}
export function buildRunningHubModelApiUrl(payload, handle, state = '') {
  const runningHubModelApiBaseUrl = resolveRunningHubModelApiBaseUrl(payload, state),
    enabled2 = String(handle || '')['trim']();
  if (!enabled2) return runningHubModelApiBaseUrl;
  return runningHubModelApiBaseUrl + '/' + enabled2['replace'](/^\/+/, '');
}
export function remapRunningHubModelApiUrl(config, scope, input = '') {
  const enabled3 = String(config || '')['trim']();
  if (!enabled3) return '';
  const runningHubModelApiBaseUrl2 = resolveRunningHubModelApiBaseUrl(scope, input);
  try {
    const uRL2 = new URL(enabled3, runningHubModelApiBaseUrl2 + '/'),
      uRL3 = new URL(runningHubModelApiBaseUrl2)['hostname'];
    if (/(^|\.)runninghub\.(?:cn|ai)$/i['test'](uRL2['hostname'])) {
      const output = uRL2['hostname']['replace'](/runninghub\.(?:cn|ai)$/i, ''),
        value2 = uRL3['endsWith']('.ai') ? 'runninghub.ai' : 'runninghub.cn';
      uRL2['hostname'] = '' + output + value2;
    }
    return uRL2['toString']()['replace'](/\/$/, '');
  } catch {
    return buildRunningHubModelApiUrl(scope, enabled3, input);
  }
}
