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
export function normalizeRunningHubModelApiProfileId(_0xb64f9d) {
  const _0x162276 = String(_0xb64f9d || '')
    ['trim']()
    ['toLowerCase']();
  return _0x162276 === RUNNINGHUB_INTERNATIONAL_PROFILE_ID
    ? RUNNINGHUB_INTERNATIONAL_PROFILE_ID
    : RUNNINGHUB_DOMESTIC_PROFILE_ID;
}
export function getRunningHubProviderProfileId(_0x85b531 = {}) {
  const _0x2fe12c = String(_0x85b531?.['providerProfileId'] || '')['trim']();
  return (
    _0x2fe12c ||
    String(_0x85b531?.['rhProviderProfileId'] || '')['trim']() ||
    String(_0x85b531?.['taskProviderProfileId'] || '')['trim']()
  );
}
export function getRunningHubTaskProviderProfileId(_0x44dc48 = {}) {
  return (
    String(_0x44dc48?.['taskProviderProfileId'] || '')['trim']() || getRunningHubProviderProfileId(_0x44dc48)
  );
}
export function resolveRunningHubSiteProfileIdFromUrl(_0x110799) {
  const _0x2c2d62 = String(_0x110799 || '')['match'](/https?:\/\/[^\s'"`\\]+/i);
  if (!_0x2c2d62) return '';
  try {
    const _0x1a5018 = new URL(_0x2c2d62[0x0])['hostname']['toLowerCase']();
    if (/(^|\.)runninghub\.ai$/['test'](_0x1a5018)) return RUNNINGHUB_INTERNATIONAL_PROFILE_ID;
    if (/(^|\.)runninghub\.cn$/['test'](_0x1a5018)) return RUNNINGHUB_DOMESTIC_PROFILE_ID;
  } catch {
    return '';
  }
  return '';
}
export function getRunningHubWorkflowDefaultProfileId(_0x22ab62 = {}) {
  return normalizeRunningHubModelApiProfileId(
    _0x22ab62?.[RUNNINGHUB_WORKFLOW_SETTINGS_KEY]?.[RUNNINGHUB_WORKFLOW_DEFAULT_PROFILE_FIELD],
  );
}
export function applyRunningHubWorkflowDefaultProfileId(
  _0x29f34c = {},
  _0x569bb7 = RUNNINGHUB_DOMESTIC_PROFILE_ID,
) {
  return {
    ...(_0x29f34c || {}),
    [RUNNINGHUB_WORKFLOW_SETTINGS_KEY]: {
      ...(_0x29f34c?.[RUNNINGHUB_WORKFLOW_SETTINGS_KEY] || {}),
      [RUNNINGHUB_WORKFLOW_DEFAULT_PROFILE_FIELD]: normalizeRunningHubModelApiProfileId(_0x569bb7),
    },
  };
}
export function isRunningHubInternationalOnlyModel(_0x366b2c) {
  return RUNNINGHUB_INTERNATIONAL_ONLY_MODEL_ID_SET['has'](String(_0x366b2c || '')['trim']());
}
export function getRunningHubModelApiProfileIds(_0x24ac89) {
  if (isRunningHubInternationalOnlyModel(_0x24ac89)) return RUNNINGHUB_INTERNATIONAL_ONLY_PROFILE_IDS;
  return RUNNINGHUB_MODEL_API_PROFILE_IDS;
}
export function resolveRunningHubModelApiProfileId(_0x580f9a, _0x229c8b) {
  const _0x2390be = getRunningHubModelApiProfileIds(_0x580f9a),
    _0x1124e0 = normalizeRunningHubModelApiProfileId(_0x229c8b);
  return _0x2390be['includes'](_0x1124e0) ? _0x1124e0 : _0x2390be[0x0];
}
export function getRunningHubModelApiProfile(_0x295808) {
  return RUNNINGHUB_MODEL_API_PROFILES[normalizeRunningHubModelApiProfileId(_0x295808)];
}
export function resolveRunningHubModelApiBaseUrl(_0x56e2e1, _0x492246 = '') {
  const _0xe5388a = getRunningHubModelApiProfile(_0x56e2e1);
  return String(_0x492246 || _0xe5388a['apiUrl'])
    ['trim']()
    ['replace'](/\/+$/, '');
}
export function buildRunningHubModelApiUrl(_0xe5eef3, _0x4265a5, _0x2b4d0a = '') {
  const _0x5205d5 = resolveRunningHubModelApiBaseUrl(_0xe5eef3, _0x2b4d0a),
    _0x48aa75 = String(_0x4265a5 || '')['trim']();
  if (!_0x48aa75) return _0x5205d5;
  return _0x5205d5 + '/' + _0x48aa75['replace'](/^\/+/, '');
}
export function remapRunningHubModelApiUrl(_0x15b167, _0x2e84d1, _0x578cb7 = '') {
  const _0x13a9b3 = String(_0x15b167 || '')['trim']();
  if (!_0x13a9b3) return '';
  const _0x1b3b23 = resolveRunningHubModelApiBaseUrl(_0x2e84d1, _0x578cb7);
  try {
    const _0x54deb2 = new URL(_0x13a9b3, _0x1b3b23 + '/'),
      _0x5d4be4 = new URL(_0x1b3b23)['hostname'];
    if (/(^|\.)runninghub\.(?:cn|ai)$/i['test'](_0x54deb2['hostname'])) {
      const _0x32453f = _0x54deb2['hostname']['replace'](/runninghub\.(?:cn|ai)$/i, ''),
        _0x28a617 = _0x5d4be4['endsWith']('.ai') ? 'runninghub.ai' : 'runninghub.cn';
      _0x54deb2['hostname'] = '' + _0x32453f + _0x28a617;
    }
    return _0x54deb2['toString']()['replace'](/\/$/, '');
  } catch {
    return buildRunningHubModelApiUrl(_0x2e84d1, _0x13a9b3, _0x578cb7);
  }
}
