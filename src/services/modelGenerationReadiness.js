import { ensureConfig, getProviderConfig, isApiConfigLoaded } from '../../api/configApi.js';
import { fetchCliProviderStatuses, getCachedCliProviderStatus } from '../../api/cliProviderApi.js';
import { fetchDreaminaCliStatusFromServer, getCachedDreaminaCliStatus } from '../../api/dreaminaCliApi.js';
import { normalizeProviderId, resolveModelExecution, resolveModelProvider } from '../manifests/index.js';
import { PROVIDERS_META } from '../modules/providers.js';
import { normalizeModelProviderProfileId } from '../modules/modelProviderProfileSelection.js';
import { resolveRunningHubModelApiProfileId } from '../modules/runningHubProviderProfiles.js';
import {
  autoVerifyProviderConnection,
  getProviderConnectionFailureDetail,
} from './providerConnectionAutoVerification.js';
const CREDENTIAL_FREE_PROVIDERS = new Set(['aicanvas', 'claude-cli']),
  KNOWN_CONFIGURABLE_PROVIDERS = new Set(Object['keys'](PROVIDERS_META || {})),
  CLI_STATUS_REQUESTS = new Map();
function normalizeAdapterType(value) {
  const item = String(value || '')
    ['trim']()
    ['toLowerCase']();
  if (['modelapi', 'model-api', 'model_api']['includes'](item)) return 'modelApi';
  if (['localruntime', 'local-runtime', 'local_runtime']['includes'](item)) return 'localRuntime';
  return item === 'workflow' ? 'workflow' : '';
}
function normalizeProfileId(key) {
  return String(key || '')
    ['trim']()
    ['toLowerCase']();
}
function getResolvedManifestContext(modelManifest = {}) {
  const modelId = String(modelManifest['modelId'] || modelManifest['model'] || '')['trim'](),
    providerHint = String(modelManifest['provider'] || '')['trim'](),
    modelManifest2 =
      modelManifest['modelManifest'] && modelManifest['executionManifest']
        ? {
            modelManifest: modelManifest['modelManifest'],
            executionManifest: modelManifest['executionManifest'],
          }
        : resolveModelExecution(modelId) ||
          (providerHint ? resolveModelExecution(modelId, { providerHint: providerHint }) : null);
  return {
    modelId: modelId,
    modelManifest: modelManifest2?.['modelManifest'] || modelManifest['modelManifest'] || null,
    executionManifest: modelManifest2?.['executionManifest'] || modelManifest['executionManifest'] || null,
  };
}
function resolveProviderId(index, result) {
  return normalizeProviderId(
    result['modelManifest']?.['provider'] ||
      result['executionManifest']?.['provider'] ||
      index['provider'] ||
      resolveModelProvider(result['modelId']),
  );
}
function resolveConfigProviderId({
  providerId: providerId,
  adapterType: adapterType,
  providerProfileId: providerProfileId,
}) {
  const profileId = normalizeProfileId(providerProfileId);
  if (profileId && KNOWN_CONFIGURABLE_PROVIDERS['has'](profileId)) return profileId;
  if (providerId === 'runninghub' && (profileId === 'runninghub' || profileId === 'runninghub-international'))
    return profileId;
  if (providerId === 'runninghub-international') return 'runninghub-international';
  if (providerId === 'runninghubwf')
    return ['runninghub', 'runninghub-international']['includes'](profileId) ? profileId : 'runninghub';
  if (adapterType === 'workflow' && providerId === 'runninghub') return profileId || 'runninghub';
  return providerId;
}
function getCustomProviderDisplayName(data, options) {
  return String(
    data?.['extensions']?.['customProvider']?.['displayName'] ||
      PROVIDERS_META[options]?.['label'] ||
      options ||
      '当前模型服务',
  )['trim']();
}
function resolveCliProviderId(target, source) {
  const providerId2 = normalizeProviderId(source['executionManifest']?.['extensions']?.['cliProvider']);
  if (providerId2) return providerId2;
  if (target === 'dreamina') return 'dreamina';
  if (['openai-cli', 'codex-cli']['includes'](target)) return 'codex';
  return '';
}
function getCliLoginFieldIds(next) {
  if (next === 'dreamina') return ['btnDreaminaAuth', 'dreaminaSettingsCard'];
  if (next === 'codex') return ['btnCodexCliLogin', 'codexCliSettingsCard'];
  return [];
}
function getCliProviderLabel(current, entry) {
  if (current === 'dreamina') return '即梦 CLI';
  if (current === 'codex') return 'OpenAI\x20CLI';
  return entry;
}
function getCredentialFieldIds({
  providerId: providerId3,
  configProviderId: configProviderId,
  credentialField: credentialField,
  connectionCapability: connectionCapability,
}) {
  if (providerId3 === 'comfyui')
    return connectionCapability === 'cloud' ? ['providerUrl-comfyui-cloud'] : ['providerUrl-comfyui'];
  if (providerId3 === 'runninghub' || providerId3 === 'runninghubwf')
    return credentialField === 'modelApiKey'
      ? ['providerKey-' + configProviderId + '-model', 'providerKey-' + configProviderId]
      : ['providerKey-' + configProviderId, 'providerKey-' + configProviderId + '-model'];
  if (/^custom_[a-z0-9_-]+$/i['test'](providerId3)) return ['customProviderApiKey'];
  return ['providerKey-' + (configProviderId || providerId3)];
}
function getModelAuthorizationCapability(options2 = {}) {
  return String(options2['modelManifest']?.['extensions']?.['credentialAuthorization']?.['capability'] || '')[
    'trim'
  ]();
}
function getComfyUiConnectionCapability(record, payload = {}) {
  if (record !== 'comfyui') return '';
  const handle = String(
    payload['executionManifest']?.['extensions']?.['comfyui']?.['baseUrlMode'] ||
      payload['modelManifest']?.['extensions']?.['comfyUiWorkflow']?.['baseUrlMode'] ||
      'local',
  )
    ['trim']()
    ['toLowerCase']();
  return handle === 'cloud' ? 'cloud' : 'local';
}
export function resolveModelCredentialRequirement(options3 = {}) {
  const modelId2 = getResolvedManifestContext(options3),
    providerId4 = resolveProviderId(options3, modelId2),
    adapterType2 = normalizeAdapterType(
      options3['adapterType'] ||
        modelId2['executionManifest']?.['adapterType'] ||
        modelId2['modelManifest']?.['adapterType'],
    ),
    enabled = Boolean(modelId2['modelManifest'] || modelId2['executionManifest']),
    profileId2 = normalizeProfileId(
      options3['providerProfileId'] ||
        options3['rhProviderProfileId'] ||
        options3['payload']?.['providerProfileId'] ||
        options3['payload']?.['rhProviderProfileId'],
    ),
    state =
      profileId2 ||
      (providerId4 === 'runninghubwf' && adapterType2 === 'workflow'
        ? normalizeProfileId(getProviderConfig('runninghubwf')?.['providerProfileId'])
        : ''),
    modelProviderProfileId = normalizeModelProviderProfileId(
      modelId2['modelManifest'] || modelId2['modelId'],
      state,
    ),
    providerProfileId2 =
      modelProviderProfileId ||
      (providerId4 === 'runninghub' && adapterType2 === 'modelApi'
        ? resolveRunningHubModelApiProfileId(
            modelId2['modelManifest']?.['modelId'] || modelId2['modelId'],
            state,
          )
        : enabled
          ? ''
          : state),
    configProviderId2 = resolveConfigProviderId({
      providerId: providerId4,
      adapterType: adapterType2,
      providerProfileId: providerProfileId2,
    }),
    providerLabel = getCustomProviderDisplayName(modelId2['modelManifest'], configProviderId2 || providerId4),
    cliProviderId = resolveCliProviderId(providerId4, modelId2);
  if (options3['credentialRequired'] === ![] || !providerId4)
    return {
      required: ![],
      adapterType: adapterType2,
      providerId: providerId4,
      configProviderId: configProviderId2,
      providerLabel: providerLabel,
      modelId: modelId2['modelId'],
      credentialField: '',
      fieldIds: [],
    };
  if (cliProviderId)
    return {
      required: !![],
      requirementType: 'cliLogin',
      adapterType: adapterType2,
      providerId: providerId4,
      configProviderId: '',
      providerLabel: getCliProviderLabel(cliProviderId, providerLabel),
      cliProviderId: cliProviderId,
      modelId: modelId2['modelId'],
      credentialField: 'cliLogin',
      keyType: 'cliLogin',
      fieldIds: getCliLoginFieldIds(cliProviderId),
    };
  if (adapterType2 === 'localRuntime' || CREDENTIAL_FREE_PROVIDERS['has'](providerId4))
    return {
      required: ![],
      adapterType: adapterType2,
      providerId: providerId4,
      configProviderId: configProviderId2,
      providerLabel: providerLabel,
      modelId: modelId2['modelId'],
      credentialField: '',
      fieldIds: [],
    };
  const enabled2 = /^custom_[a-z0-9_-]+$/i['test'](providerId4);
  if (!enabled && !enabled2 && !KNOWN_CONFIGURABLE_PROVIDERS['has'](providerId4))
    return {
      required: ![],
      adapterType: adapterType2,
      providerId: providerId4,
      configProviderId: configProviderId2,
      providerLabel: providerLabel,
      modelId: modelId2['modelId'],
      credentialField: '',
      fieldIds: [],
    };
  const credentialField2 =
      providerId4 === 'comfyui'
        ? 'apiUrl'
        : ['runninghub', 'runninghub-international']['includes'](providerId4) && adapterType2 === 'modelApi'
          ? 'modelApiKey'
          : 'apiKey',
    keyType =
      credentialField2 === 'modelApiKey'
        ? 'modelApi'
        : credentialField2 === 'apiKey'
          ? adapterType2
          : 'endpoint',
    authorizationCapability = getModelAuthorizationCapability(modelId2),
    connectionCapability2 = getComfyUiConnectionCapability(providerId4, modelId2);
  return {
    required: !![],
    ...(authorizationCapability
      ? { requirementType: 'modelAuthorization', authorizationCapability: authorizationCapability }
      : {}),
    adapterType: adapterType2,
    providerId: providerId4,
    configProviderId: configProviderId2,
    providerLabel: providerLabel,
    providerProfileId: providerProfileId2,
    modelId: modelId2['modelId'],
    credentialField: credentialField2,
    keyType: keyType,
    ...(connectionCapability2 ? { connectionCapability: connectionCapability2 } : {}),
    verificationRequired: !enabled2 && KNOWN_CONFIGURABLE_PROVIDERS['has'](configProviderId2 || providerId4),
    fieldIds: getCredentialFieldIds({
      providerId: providerId4,
      configProviderId: configProviderId2,
      credentialField: credentialField2,
      connectionCapability: connectionCapability2,
    }),
  };
}
function readCredentialValue(config, scope = {}) {
  const input = scope['payload'] || {},
    output = scope['providerConfig'] || {};
  if (config['credentialField'] === 'apiUrl') {
    const value2 = config['connectionCapability'] === 'cloud' ? output['cloudApiUrl'] : output['apiUrl'],
      value3 = config['connectionCapability'] === 'cloud' ? '' : PROVIDERS_META?.['comfyui']?.['defaultUrl'];
    return String(value2 || input['apiUrl'] || input['baseUrl'] || value3 || '')['trim']();
  }
  if (config['credentialField'] === 'modelApiKey')
    return String(output['modelApiKey'] || input['modelApiKey'] || input['apiKey'] || '')['trim']();
  return String(output['apiKey'] || input['apiKey'] || '')['trim']();
}
function buildMissingCredentialMessage(value4) {
  if (value4['credentialField'] === 'cliLogin') return '请先登录 ' + value4['providerLabel'];
  if (value4['credentialField'] === 'apiUrl') return '请先配置 ' + value4['providerLabel'] + ' 服务地址';
  if (value4['credentialField'] === 'modelApiKey')
    return '请先配置 ' + value4['providerLabel'] + ' 模型 API Key';
  if (value4['adapterType'] === 'workflow') return '请先配置 ' + value4['providerLabel'] + ' 工作流 API Key';
  return '请先配置 ' + value4['providerLabel'] + ' API Key';
}
function getProviderConnectionStatus(options4 = {}) {
  return String(options4?.['connectionVerification']?.['status'] || '')
    ['trim']()
    ['toLowerCase']();
}
function isProviderConnectionVerified(options5 = {}) {
  return getProviderConnectionStatus(options5) === 'passed';
}
function getProviderConnectionCapability(options6 = {}) {
  const profileId3 = normalizeProfileId(options6['configProviderId']);
  if (profileId3 === 'comfyui')
    return ['local', 'cloud']['includes'](options6['connectionCapability'])
      ? options6['connectionCapability']
      : 'local';
  if (!['runninghub', 'runninghub-international']['includes'](profileId3)) return '';
  return options6['credentialField'] === 'modelApiKey'
    ? 'modelApi'
    : options6['credentialField'] === 'apiKey'
      ? 'workflow'
      : '';
}
function getProviderConnectionCapabilityStatus(value5, value6 = {}) {
  return String(value6?.['connectionVerification']?.['capabilities']?.[value5]?.['status'] || '')
    ['trim']()
    ['toLowerCase']();
}
function isProviderConnectionCapabilityVerified(value7, value8 = {}) {
  return getProviderConnectionCapabilityStatus(value7, value8) === 'passed';
}
function getConnectionCapabilityLabel(value9 = '') {
  return value9 === 'workflow'
    ? '工作流\x20API\x20Key'
    : value9 === 'modelApi'
      ? '模型 API Key'
      : value9 === 'cloud'
        ? '云端连接'
        : value9 === 'local'
          ? '本地连接'
          : 'API 连接';
}
function buildUnverifiedConnectionMessage(value10, value11 = '') {
  return '请先验证\x20' + value10['providerLabel'] + '\x20' + getConnectionCapabilityLabel(value11);
}
function isModelAuthorizationVerified(value12, value13 = {}) {
  const enabled3 = String(value12?.['authorizationCapability'] || '')['trim']();
  if (!enabled3) return ![];
  return (
    String(value13?.['connectionVerification']?.['capabilities']?.[enabled3]?.['status'] || '')
      ['trim']()
      ['toLowerCase']() === 'passed'
  );
}
function getModelAuthorizationStatus(value14, value15 = {}) {
  const value16 = String(value14?.['authorizationCapability'] || '')['trim']();
  return value16 ? getProviderConnectionCapabilityStatus(value16, value15) : '';
}
export function evaluateModelGenerationReadiness(providerConfig = {}) {
  const message = providerConfig['requirement'] || resolveModelCredentialRequirement(providerConfig);
  if (!message['required'])
    return { ready: !![], status: 'ready', reason: 'credential-not-required', ...message, message: '' };
  if (message['credentialField'] === 'cliLogin') {
    const enabled4 = providerConfig['cliStatus'];
    if (!enabled4 || typeof enabled4 !== 'object' || Array['isArray'](enabled4))
      return { ready: ![], status: 'loading', reason: 'cli-status-loading', ...message, message: '' };
    if (enabled4['loggedIn'] === !![])
      return { ready: !![], status: 'ready', reason: 'cli-login-present', ...message, message: '' };
    return {
      ready: ![],
      status: 'missing',
      reason: 'cli-login-missing',
      ...message,
      message: buildMissingCredentialMessage(message),
    };
  }
  if (
    providerConfig['configLoaded'] === ![] &&
    !providerConfig['providerConfig'] &&
    !providerConfig['payload']
  )
    return { ready: ![], status: 'loading', reason: 'config-loading', ...message, message: '' };
  const credentialValue = readCredentialValue(message, providerConfig);
  if (credentialValue) {
    const value17 =
        providerConfig['providerConfig'] &&
        typeof providerConfig['providerConfig'] === 'object' &&
        !Array['isArray'](providerConfig['providerConfig']),
      enabled5 = value17
        ? Boolean(
            readCredentialValue(message, { providerConfig: providerConfig['providerConfig'], payload: {} }),
          )
        : ![];
    if (message['requirementType'] === 'modelAuthorization') {
      if (value17 && isModelAuthorizationVerified(message, providerConfig['providerConfig']))
        return {
          ready: !![],
          status: 'ready',
          reason: 'model-authorization-verified',
          ...message,
          message: '',
        };
      if (!enabled5)
        return { ready: !![], status: 'ready', reason: 'credential-present', ...message, message: '' };
      if (getModelAuthorizationStatus(message, providerConfig['providerConfig']) === 'failed')
        return {
          ready: ![],
          status: 'missing',
          reason: 'model-authorization-missing',
          ...message,
          message: '请在设置中重新测试 ' + message['providerLabel'] + '，确认当前模型服务已开通',
        };
      return {
        ready: !![],
        status: 'unverified',
        reason: 'model-authorization-unverified',
        ...message,
        message: message['providerLabel'] + ' 将在首次生成时自动验证',
      };
    }
    const message2 = getProviderConnectionCapability(message);
    if (message['verificationRequired'] && value17 && enabled5) {
      const enabled6 = message2
        ? isProviderConnectionCapabilityVerified(message2, providerConfig['providerConfig'])
        : isProviderConnectionVerified(providerConfig['providerConfig']);
      if (!enabled6) {
        const value18 = message2
          ? getProviderConnectionCapabilityStatus(message2, providerConfig['providerConfig'])
          : getProviderConnectionStatus(providerConfig['providerConfig']);
        if (value18 === 'failed') {
          if (
            normalizeProfileId(message['configProviderId']) === 'comfyui' &&
            ['local', 'cloud']['includes'](message2)
          )
            return {
              ready: !![],
              status: 'unverified',
              reason: 'connection-capability-retry-required',
              ...message,
              message: buildUnverifiedConnectionMessage(message, message2) + '失败；本次生成将重新验证',
            };
          return {
            ready: ![],
            status: 'missing',
            reason: 'connection-validation-failed',
            ...message,
            message: message2
              ? message['providerLabel'] +
                '\x20' +
                getConnectionCapabilityLabel(message2) +
                ' 验证失败，请检查 Key 后重试'
              : message['providerLabel'] + ' API 验证失败，请检查 Key 后重试',
          };
        }
        return {
          ready: !![],
          status: 'unverified',
          reason: message2 ? 'connection-capability-unverified' : 'connection-unverified',
          ...message,
          message: buildUnverifiedConnectionMessage(message, message2) + '；首次生成时将自动验证',
        };
      }
    }
    return {
      ready: !![],
      status: 'ready',
      reason:
        message['verificationRequired'] && value17
          ? message2
            ? 'connection-capability-verified'
            : 'connection-verified'
          : 'credential-present',
      ...message,
      message: '',
    };
  }
  return {
    ready: ![],
    status: 'missing',
    reason: 'credential-missing',
    ...message,
    message: buildMissingCredentialMessage(message),
  };
}
export function getModelGenerationReadiness(args = {}) {
  const requirement = resolveModelCredentialRequirement(args);
  if (requirement['credentialField'] === 'cliLogin') {
    const cliStatus =
      requirement['cliProviderId'] === 'dreamina'
        ? getCachedDreaminaCliStatus()
        : getCachedCliProviderStatus(requirement['cliProviderId']);
    return evaluateModelGenerationReadiness({ ...args, requirement: requirement, cliStatus: cliStatus });
  }
  const configLoaded = isApiConfigLoaded(),
    providerConfig2 = configLoaded
      ? getProviderConfig(requirement['configProviderId'] || requirement['providerId'])
      : null;
  return evaluateModelGenerationReadiness({
    ...args,
    requirement: requirement,
    configLoaded: configLoaded,
    providerConfig: providerConfig2,
  });
}
async function ensureCliProviderStatus(value19) {
  const value20 = value19 === 'dreamina' ? getCachedDreaminaCliStatus() : getCachedCliProviderStatus(value19);
  if (value20) return value20;
  if (CLI_STATUS_REQUESTS['has'](value19)) return CLI_STATUS_REQUESTS['get'](value19);
  const value21 =
    value19 === 'dreamina'
      ? fetchDreaminaCliStatusFromServer({ refresh: !![] })
      : fetchCliProviderStatuses()['then'](() => getCachedCliProviderStatus(value19));
  CLI_STATUS_REQUESTS['set'](value19, value21);
  try {
    return await value21;
  } finally {
    CLI_STATUS_REQUESTS['delete'](value19);
  }
}
export async function ensureModelGenerationReadiness(options7 = {}) {
  const message3 = resolveModelCredentialRequirement(options7);
  if (message3['credentialField'] === 'cliLogin')
    return (await ensureCliProviderStatus(message3['cliProviderId']), getModelGenerationReadiness(options7));
  await ensureConfig();
  const response = getModelGenerationReadiness(options7);
  if (options7['autoVerify'] !== !![] || response['status'] !== 'unverified') return response;
  let validationResult;
  try {
    validationResult = await autoVerifyProviderConnection(message3);
  } catch (error) {
    validationResult = { ok: ![], error: error?.['message'] || 'API 连接验证失败' };
  }
  const response2 = getModelGenerationReadiness(options7);
  if (response2['ready'] && response2['status'] !== 'unverified') return response2;
  return {
    ...response2,
    ready: ![],
    status: 'missing',
    reason: 'connection-validation-failed',
    message:
      message3['providerLabel'] + ' 自动验证未通过：' + getProviderConnectionFailureDetail(validationResult),
    validationResult: validationResult,
  };
}
export function createMissingModelCredentialError(response3) {
  const error2 =
      response3?.['status'] === 'missing' ? response3 : evaluateModelGenerationReadiness(response3 || {}),
    error3 = new Error(error2['message'] || '当前模型缺少可用的\x20API\x20Key');
  return (
    (error3['name'] = 'ModelCredentialMissingError'),
    (error3['code'] = 'MODEL_CREDENTIAL_MISSING'),
    (error3['provider'] = error2['providerId']),
    (error3['providerId'] = error2['configProviderId'] || error2['providerId']),
    (error3['keyType'] = error2['keyType']),
    (error3['adapterType'] = error2['adapterType']),
    (error3['model'] = error2['modelId']),
    (error3['fieldIds'] = error2['fieldIds']),
    error3
  );
}
