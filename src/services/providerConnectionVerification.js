export const PASSED_PROVIDER_CONNECTION_STATUS = 'passed';
const VOLCENGINE_SPEECH_CAPABILITY_IDS = new Set(['asr', 'tts', 'audioGeneration']),
  RUNNINGHUB_PROVIDER_IDS = new Set(['runninghub', 'runninghub-international']),
  RUNNINGHUB_CAPABILITY_BY_STEP_ID = Object.freeze({
    auth: 'workflow',
    model: 'modelApi',
    upload: 'modelApi',
  }),
  COMFYUI_CAPABILITY_BY_STEP_ID = Object.freeze({ service: 'local', cloud: 'cloud' });
function normalizeProviderId(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase();
}
function getVerificationStepStatus(response = {}) {
  if (response.ok === true && !response.skipped) return 'passed';
  return response.skipped ? 'unknown' : 'failed';
}
function getRunningHubConfiguredCapabilities(options = {}) {
  const list = [];
  if (String(options?.apiKey || '').trim()) list.push('workflow');
  if (String(options?.modelApiKey || '').trim()) list.push('modelApi');
  return list;
}
function getRunningHubVerificationStatus(options2 = {}, item = {}) {
  const list2 = getRunningHubConfiguredCapabilities(options2);
  if (list2.length === 0) return 'failed';
  const list3 = list2.map((key) => item?.[key]?.status || 'unknown');
  if (list3.every((index) => index === 'passed')) return PASSED_PROVIDER_CONNECTION_STATUS;
  return list3.some((result) => result === 'passed') ? 'partial' : 'failed';
}
function getComfyUiConfiguredCapabilities(options3 = {}) {
  const list4 = ['local'];
  if (String(options3?.cloudApiUrl || '').trim()) list4.push('cloud');
  return list4;
}
function getComfyUiVerificationStatus(options4 = {}, data = {}) {
  const list5 = getComfyUiConfiguredCapabilities(options4);
  if (list5.length === 0) return 'failed';
  const list6 = list5.map((target) => data?.[target]?.status || 'unknown');
  if (list6.every((source) => source === PASSED_PROVIDER_CONNECTION_STATUS))
    return PASSED_PROVIDER_CONNECTION_STATUS;
  return list6.some((next) => next === PASSED_PROVIDER_CONNECTION_STATUS) ? 'partial' : 'failed';
}
function getPreservedRunningHubCapabilities(current, entry) {
  const args = current?.connectionVerification?.capabilities || {};
  if (String(current?.apiUrl || '').trim() !== String(entry?.apiUrl || '').trim()) return {};
  const record = {};
  return (
    String(current?.apiKey || '').trim() === String(entry?.apiKey || '').trim() &&
      args.workflow &&
      (record.workflow = { ...args.workflow }),
    String(current?.modelApiKey || '').trim() === String(entry?.modelApiKey || '').trim() &&
      args.modelApi &&
      (record.modelApi = { ...args.modelApi }),
    record
  );
}
function getPreservedComfyUiCapabilities(payload, handle) {
  const args2 = payload?.connectionVerification?.capabilities || {},
    state = {};
  return (
    String(payload?.apiUrl || '').trim() === String(handle?.apiUrl || '').trim() &&
      args2.local &&
      (state.local = { ...args2.local }),
    String(payload?.cloudApiUrl || '').trim() === String(handle?.cloudApiUrl || '').trim() &&
      args2.cloud &&
      (state.cloud = { ...args2.cloud }),
    state
  );
}
function buildRunningHubConnectionVerification(config, scope, input, verifiedAt) {
  const capabilities = getPreservedRunningHubCapabilities(config, scope),
    list7 = Array.isArray(input?.steps) ? input.steps : [];
  return (
    list7.forEach((output) => {
      const enabled = RUNNINGHUB_CAPABILITY_BY_STEP_ID[output?.id];
      if (!enabled || output?.skipped) return;
      capabilities[enabled] = { status: getVerificationStepStatus(output), verifiedAt: verifiedAt };
    }),
    {
      status: getRunningHubVerificationStatus(scope, capabilities),
      verifiedAt: verifiedAt,
      ...(Object.keys(capabilities).length > 0 ? { capabilities: capabilities } : {}),
    }
  );
}
function buildComfyUiConnectionVerification(value2, value3, value4, verifiedAt2) {
  const capabilities2 = getPreservedComfyUiCapabilities(value2, value3),
    list8 = Array.isArray(value4?.steps) ? value4.steps : [];
  return (
    list8.forEach((value5) => {
      const enabled2 = COMFYUI_CAPABILITY_BY_STEP_ID[value5?.id];
      if (!enabled2 || value5?.skipped) return;
      capabilities2[enabled2] = { status: getVerificationStepStatus(value5), verifiedAt: verifiedAt2 };
    }),
    {
      status: getComfyUiVerificationStatus(value3, capabilities2),
      verifiedAt: verifiedAt2,
      ...(Object.keys(capabilities2).length > 0 ? { capabilities: capabilities2 } : {}),
    }
  );
}
function getProviderConnectionIdentity(options5 = {}, value6 = '') {
  const value7 = String(value6 || '')
      .trim()
      .toLowerCase(),
    handler = (value8) => String(options5?.[value8] || '').trim();
  if (value7 === 'comfyui') return JSON.stringify([handler('apiUrl'), handler('cloudApiUrl')]);
  if (value7 === 'runninghub' || value7 === 'runninghub-international')
    return JSON.stringify([handler('apiUrl'), handler('apiKey'), handler('modelApiKey')]);
  return JSON.stringify([
    handler('apiUrl'),
    handler('apiKey'),
    value7 === 'apimart' ? handler('routeId') : '',
  ]);
}
function isProviderConnectionResultCurrent(value9, value10, value11, value12 = '') {
  const providerId = normalizeProviderId(value11),
    value13 = value9?.providers?.[providerId] || {},
    value14 = value10?.providers?.[providerId] || {},
    value15 = String(value12 || '')
      .trim()
      .toLowerCase();
  if (providerId === 'comfyui' && ['local', 'cloud'].includes(value15)) {
    const value16 = value15 === 'cloud' ? 'cloudApiUrl' : 'apiUrl';
    return String(value13?.[value16] || '').trim() === String(value14?.[value16] || '').trim();
  }
  return (
    getProviderConnectionIdentity(value13, providerId) === getProviderConnectionIdentity(value14, providerId)
  );
}
function joinProviderDiagnosticMessages(error = {}) {
  return [error.message, error.detail]
    .map((value17) => String(value17 || '').trim())
    .filter((value18, value19, list9) => value18 && list9.indexOf(value18) === value19)
    .join(' · ');
}
export function formatProviderDiagnosticDetail(options6 = {}, value20 = {}) {
  const list10 = [],
    value21 = options6.suggestion || options6.summary || options6.error || options6.detail || '';
  if (value21) list10.push(value21);
  if (Array.isArray(options6.steps) && options6.steps.length > 0)
    options6.steps.forEach((response2) => {
      const value22 = response2.skipped
          ? value20.skipped || '跳过'
          : response2.ok
            ? value20.passed || '通过'
            : value20.failed || '失败',
        joinProviderDiagnosticMessages2 = joinProviderDiagnosticMessages(response2);
      list10.push(
        (response2.label || response2.id || value20.step || '步骤') +
          '：' +
          value22 +
          (joinProviderDiagnosticMessages2 ? ' - ' + joinProviderDiagnosticMessages2 : ''),
      );
    });
  else options6.detail && list10.push(options6.detail);
  return list10.filter(Boolean).join('\n');
}
export function isProviderConnectionVerified(options7 = {}, value23 = '') {
  const response3 = options7?.providers?.[normalizeProviderId(value23)]?.connectionVerification;
  return response3?.status === PASSED_PROVIDER_CONNECTION_STATUS;
}
export function shouldPersistProviderConnectionResult(value24 = '', response4 = {}) {
  if (response4?.ok === true) return true;
  const providerId2 = normalizeProviderId(value24);
  if (providerId2 === 'comfyui')
    return (Array.isArray(response4?.steps) ? response4.steps : []).some(
      (enabled3) => COMFYUI_CAPABILITY_BY_STEP_ID[enabled3?.id] && !enabled3?.skipped,
    );
  if (!RUNNINGHUB_PROVIDER_IDS.has(providerId2)) return false;
  return (Array.isArray(response4?.steps) ? response4.steps : []).some(
    (response5) =>
      RUNNINGHUB_CAPABILITY_BY_STEP_ID[response5?.id] &&
      response5?.ok === true &&
      !response5?.skipped,
  );
}
export function reconcileProviderConnectionVerification(options8 = {}, args3 = {}, value25 = '') {
  const value26 = args3 && typeof args3 === 'object' ? { ...args3 } : {},
    providerId3 = normalizeProviderId(value25);
  if (RUNNINGHUB_PROVIDER_IDS.has(providerId3)) {
    const args4 = options8?.connectionVerification;
    if (!args4) return value26;
    const capabilities3 = getPreservedRunningHubCapabilities(options8, value26);
    if (Object.keys(capabilities3).length === 0)
      return (delete value26.connectionVerification, value26);
    return (
      (value26.connectionVerification = {
        ...args4,
        status: getRunningHubVerificationStatus(value26, capabilities3),
        capabilities: capabilities3,
      }),
      value26
    );
  }
  if (providerId3 === 'comfyui') {
    const args5 = options8?.connectionVerification;
    if (!args5) return value26;
    const capabilities4 = getPreservedComfyUiCapabilities(options8, value26);
    if (Object.keys(capabilities4).length === 0)
      return (delete value26.connectionVerification, value26);
    return (
      (value26.connectionVerification = {
        ...args5,
        status: getComfyUiVerificationStatus(value26, capabilities4),
        capabilities: capabilities4,
      }),
      value26
    );
  }
  return (
    getProviderConnectionIdentity(options8, value25) !== getProviderConnectionIdentity(value26, value25) &&
      delete value26.connectionVerification,
    value26
  );
}
export function mergePassedProviderApiConfig(
  options9 = {},
  value27 = {},
  list11 = [],
  value28 = new Map(),
  value29 = {},
) {
  const args6 = options9 && typeof options9 === 'object' ? options9 : {},
    value30 = value27 && typeof value27 === 'object' ? value27 : {},
    providers = { ...(args6.providers || {}) },
    value31 = value30.providers || {},
    map = value28 instanceof Map ? value28 : new Map(),
    verifiedAt3 = Number(value29?.verifiedAt) || Date.now(),
    value32 =
      value29?.providerResults && typeof value29.providerResults === 'object'
        ? value29.providerResults
        : {};
  return (
    list11.forEach((value33) => {
      const providerId4 = normalizeProviderId(value33);
      if (!providerId4) return;
      const args7 = providers[providerId4] || {},
        args8 = { ...args7, ...(value31[providerId4] || {}), ...(map.get(providerId4) || {}) },
        connectionVerification = RUNNINGHUB_PROVIDER_IDS.has(providerId4)
          ? buildRunningHubConnectionVerification(args7, args8, value32[providerId4], verifiedAt3)
          : providerId4 === 'comfyui'
            ? buildComfyUiConnectionVerification(args7, args8, value32[providerId4], verifiedAt3)
            : { status: PASSED_PROVIDER_CONNECTION_STATUS, verifiedAt: verifiedAt3 };
      if (providerId4 === 'volcengine-speech') {
        const providerConnectionIdentity =
            getProviderConnectionIdentity(args7, providerId4) ===
            getProviderConnectionIdentity(args8, providerId4),
          value34 = providerConnectionIdentity
            ? { ...(args7?.connectionVerification?.capabilities || {}) }
            : {},
          list12 = Array.isArray(value32[providerId4]?.steps) ? value32[providerId4].steps : [];
        (list12.forEach((status) => {
          const value35 = String(status?.id || '').trim();
          if (!VOLCENGINE_SPEECH_CAPABILITY_IDS.has(value35)) return;
          value34[value35] = {
            status: status.ok === true ? 'passed' : status.skipped ? 'unknown' : 'failed',
            verifiedAt: verifiedAt3,
          };
        }),
          Object.keys(value34).length > 0 && (connectionVerification.capabilities = value34));
      }
      providers[providerId4] = { ...args8, connectionVerification: connectionVerification };
    }),
    { ...args6, providers: providers }
  );
}
export function mergeCurrentProviderConnectionResults(
  options10 = {},
  value36 = {},
  list13 = [],
  value37 = new Map(),
  value38 = {},
) {
  const value39 = value38?.connectionCapabilities || {},
    appliedProviderIds = [],
    staleProviderIds = [];
  return (
    list13.forEach((value40) => {
      const providerId5 = normalizeProviderId(value40);
      if (!providerId5) return;
      isProviderConnectionResultCurrent(options10, value36, providerId5, value39[providerId5])
        ? appliedProviderIds.push(providerId5)
        : staleProviderIds.push(providerId5);
    }),
    {
      config: mergePassedProviderApiConfig(options10, options10, appliedProviderIds, value37, value38),
      appliedProviderIds: appliedProviderIds,
      staleProviderIds: staleProviderIds,
    }
  );
}
