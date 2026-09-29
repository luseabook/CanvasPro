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
function normalizeAdapterType(_0x1fa626) {
  const _0x3ddc1f = String(_0x1fa626 || '')
    ['trim']()
    ['toLowerCase']();
  if (['modelapi', 'model-api', 'model_api']['includes'](_0x3ddc1f)) return 'modelApi';
  if (['localruntime', 'local-runtime', 'local_runtime']['includes'](_0x3ddc1f)) return 'localRuntime';
  return _0x3ddc1f === 'workflow' ? 'workflow' : '';
}
function normalizeProfileId(_0x12be36) {
  return String(_0x12be36 || '')
    ['trim']()
    ['toLowerCase']();
}
function getResolvedManifestContext(_0x43838d = {}) {
  const _0x32151c = String(_0x43838d['modelId'] || _0x43838d['model'] || '')['trim'](),
    _0x30b9f0 = String(_0x43838d['provider'] || '')['trim'](),
    _0x209ae0 =
      _0x43838d['modelManifest'] && _0x43838d['executionManifest']
        ? { modelManifest: _0x43838d['modelManifest'], executionManifest: _0x43838d['executionManifest'] }
        : resolveModelExecution(_0x32151c) ||
          (_0x30b9f0 ? resolveModelExecution(_0x32151c, { providerHint: _0x30b9f0 }) : null);
  return {
    modelId: _0x32151c,
    modelManifest: _0x209ae0?.['modelManifest'] || _0x43838d['modelManifest'] || null,
    executionManifest: _0x209ae0?.['executionManifest'] || _0x43838d['executionManifest'] || null,
  };
}
function resolveProviderId(_0xfa5441, _0x170863) {
  return normalizeProviderId(
    _0x170863['modelManifest']?.['provider'] ||
      _0x170863['executionManifest']?.['provider'] ||
      _0xfa5441['provider'] ||
      resolveModelProvider(_0x170863['modelId']),
  );
}
function resolveConfigProviderId({
  providerId: _0x3b944a,
  adapterType: _0x3a3961,
  providerProfileId: _0x263af,
}) {
  const _0x304ea8 = normalizeProfileId(_0x263af);
  if (_0x304ea8 && KNOWN_CONFIGURABLE_PROVIDERS['has'](_0x304ea8)) return _0x304ea8;
  if (_0x3b944a === 'runninghub' && (_0x304ea8 === 'runninghub' || _0x304ea8 === 'runninghub-international'))
    return _0x304ea8;
  if (_0x3b944a === 'runninghub-international') return 'runninghub-international';
  if (_0x3b944a === 'runninghubwf')
    return ['runninghub', 'runninghub-international']['includes'](_0x304ea8) ? _0x304ea8 : 'runninghub';
  if (_0x3a3961 === 'workflow' && _0x3b944a === 'runninghub') return _0x304ea8 || 'runninghub';
  return _0x3b944a;
}
function getCustomProviderDisplayName(_0x583dce, _0x45c761) {
  return String(
    _0x583dce?.['extensions']?.['customProvider']?.['displayName'] ||
      PROVIDERS_META[_0x45c761]?.['label'] ||
      _0x45c761 ||
      '当前模型服务',
  )['trim']();
}
function resolveCliProviderId(_0x255733, _0x40c7d4) {
  const _0x36966c = normalizeProviderId(_0x40c7d4['executionManifest']?.['extensions']?.['cliProvider']);
  if (_0x36966c) return _0x36966c;
  if (_0x255733 === 'dreamina') return 'dreamina';
  if (['openai-cli', 'codex-cli']['includes'](_0x255733)) return 'codex';
  return '';
}
function getCliLoginFieldIds(_0x3887da) {
  if (_0x3887da === 'dreamina') return ['btnDreaminaAuth', 'dreaminaSettingsCard'];
  if (_0x3887da === 'codex') return ['btnCodexCliLogin', 'codexCliSettingsCard'];
  return [];
}
function getCliProviderLabel(_0x49f8b2, _0x44290c) {
  if (_0x49f8b2 === 'dreamina') return '即梦 CLI';
  if (_0x49f8b2 === 'codex') return 'OpenAI\x20CLI';
  return _0x44290c;
}
function getCredentialFieldIds({
  providerId: _0x3ba4ec,
  configProviderId: _0x1ded5f,
  credentialField: _0x397eee,
  connectionCapability: _0x5d6786,
}) {
  if (_0x3ba4ec === 'comfyui')
    return _0x5d6786 === 'cloud' ? ['providerUrl-comfyui-cloud'] : ['providerUrl-comfyui'];
  if (_0x3ba4ec === 'runninghub' || _0x3ba4ec === 'runninghubwf')
    return _0x397eee === 'modelApiKey'
      ? ['providerKey-' + _0x1ded5f + '-model', 'providerKey-' + _0x1ded5f]
      : ['providerKey-' + _0x1ded5f, 'providerKey-' + _0x1ded5f + '-model'];
  if (/^custom_[a-z0-9_-]+$/i['test'](_0x3ba4ec)) return ['customProviderApiKey'];
  return ['providerKey-' + (_0x1ded5f || _0x3ba4ec)];
}
function getModelAuthorizationCapability(_0x352f74 = {}) {
  return String(
    _0x352f74['modelManifest']?.['extensions']?.['credentialAuthorization']?.['capability'] || '',
  )['trim']();
}
function getComfyUiConnectionCapability(_0x26d332, _0x41ca68 = {}) {
  if (_0x26d332 !== 'comfyui') return '';
  const _0x5431ed = String(
    _0x41ca68['executionManifest']?.['extensions']?.['comfyui']?.['baseUrlMode'] ||
      _0x41ca68['modelManifest']?.['extensions']?.['comfyUiWorkflow']?.['baseUrlMode'] ||
      'local',
  )
    ['trim']()
    ['toLowerCase']();
  return _0x5431ed === 'cloud' ? 'cloud' : 'local';
}
export function resolveModelCredentialRequirement(_0x1005d8 = {}) {
  const _0x5cc7d2 = getResolvedManifestContext(_0x1005d8),
    _0x3fecaa = resolveProviderId(_0x1005d8, _0x5cc7d2),
    _0x3cb81d = normalizeAdapterType(
      _0x1005d8['adapterType'] ||
        _0x5cc7d2['executionManifest']?.['adapterType'] ||
        _0x5cc7d2['modelManifest']?.['adapterType'],
    ),
    _0x59e788 = Boolean(_0x5cc7d2['modelManifest'] || _0x5cc7d2['executionManifest']),
    _0x15b0e3 = normalizeProfileId(
      _0x1005d8['providerProfileId'] ||
        _0x1005d8['rhProviderProfileId'] ||
        _0x1005d8['payload']?.['providerProfileId'] ||
        _0x1005d8['payload']?.['rhProviderProfileId'],
    ),
    _0x216d01 =
      _0x15b0e3 ||
      (_0x3fecaa === 'runninghubwf' && _0x3cb81d === 'workflow'
        ? normalizeProfileId(getProviderConfig('runninghubwf')?.['providerProfileId'])
        : ''),
    _0x1748f8 = normalizeModelProviderProfileId(
      _0x5cc7d2['modelManifest'] || _0x5cc7d2['modelId'],
      _0x216d01,
    ),
    _0x485d7f =
      _0x1748f8 ||
      (_0x3fecaa === 'runninghub' && _0x3cb81d === 'modelApi'
        ? resolveRunningHubModelApiProfileId(
            _0x5cc7d2['modelManifest']?.['modelId'] || _0x5cc7d2['modelId'],
            _0x216d01,
          )
        : _0x59e788
          ? ''
          : _0x216d01),
    _0x282ed8 = resolveConfigProviderId({
      providerId: _0x3fecaa,
      adapterType: _0x3cb81d,
      providerProfileId: _0x485d7f,
    }),
    _0x4636f6 = getCustomProviderDisplayName(_0x5cc7d2['modelManifest'], _0x282ed8 || _0x3fecaa),
    _0x2664a9 = resolveCliProviderId(_0x3fecaa, _0x5cc7d2);
  if (_0x1005d8['credentialRequired'] === ![] || !_0x3fecaa)
    return {
      required: ![],
      adapterType: _0x3cb81d,
      providerId: _0x3fecaa,
      configProviderId: _0x282ed8,
      providerLabel: _0x4636f6,
      modelId: _0x5cc7d2['modelId'],
      credentialField: '',
      fieldIds: [],
    };
  if (_0x2664a9)
    return {
      required: !![],
      requirementType: 'cliLogin',
      adapterType: _0x3cb81d,
      providerId: _0x3fecaa,
      configProviderId: '',
      providerLabel: getCliProviderLabel(_0x2664a9, _0x4636f6),
      cliProviderId: _0x2664a9,
      modelId: _0x5cc7d2['modelId'],
      credentialField: 'cliLogin',
      keyType: 'cliLogin',
      fieldIds: getCliLoginFieldIds(_0x2664a9),
    };
  if (_0x3cb81d === 'localRuntime' || CREDENTIAL_FREE_PROVIDERS['has'](_0x3fecaa))
    return {
      required: ![],
      adapterType: _0x3cb81d,
      providerId: _0x3fecaa,
      configProviderId: _0x282ed8,
      providerLabel: _0x4636f6,
      modelId: _0x5cc7d2['modelId'],
      credentialField: '',
      fieldIds: [],
    };
  const _0xedd76b = /^custom_[a-z0-9_-]+$/i['test'](_0x3fecaa);
  if (!_0x59e788 && !_0xedd76b && !KNOWN_CONFIGURABLE_PROVIDERS['has'](_0x3fecaa))
    return {
      required: ![],
      adapterType: _0x3cb81d,
      providerId: _0x3fecaa,
      configProviderId: _0x282ed8,
      providerLabel: _0x4636f6,
      modelId: _0x5cc7d2['modelId'],
      credentialField: '',
      fieldIds: [],
    };
  const _0x309cba =
      _0x3fecaa === 'comfyui'
        ? 'apiUrl'
        : ['runninghub', 'runninghub-international']['includes'](_0x3fecaa) && _0x3cb81d === 'modelApi'
          ? 'modelApiKey'
          : 'apiKey',
    _0x42171d = _0x309cba === 'modelApiKey' ? 'modelApi' : _0x309cba === 'apiKey' ? _0x3cb81d : 'endpoint',
    _0x406ede = getModelAuthorizationCapability(_0x5cc7d2),
    _0x43c806 = getComfyUiConnectionCapability(_0x3fecaa, _0x5cc7d2);
  return {
    required: !![],
    ...(_0x406ede ? { requirementType: 'modelAuthorization', authorizationCapability: _0x406ede } : {}),
    adapterType: _0x3cb81d,
    providerId: _0x3fecaa,
    configProviderId: _0x282ed8,
    providerLabel: _0x4636f6,
    providerProfileId: _0x485d7f,
    modelId: _0x5cc7d2['modelId'],
    credentialField: _0x309cba,
    keyType: _0x42171d,
    ...(_0x43c806 ? { connectionCapability: _0x43c806 } : {}),
    verificationRequired: !_0xedd76b && KNOWN_CONFIGURABLE_PROVIDERS['has'](_0x282ed8 || _0x3fecaa),
    fieldIds: getCredentialFieldIds({
      providerId: _0x3fecaa,
      configProviderId: _0x282ed8,
      credentialField: _0x309cba,
      connectionCapability: _0x43c806,
    }),
  };
}
function readCredentialValue(_0xebccc4, _0x28701e = {}) {
  const _0x545368 = _0x28701e['payload'] || {},
    _0x18ed0a = _0x28701e['providerConfig'] || {};
  if (_0xebccc4['credentialField'] === 'apiUrl') {
    const _0x4281f0 =
        _0xebccc4['connectionCapability'] === 'cloud' ? _0x18ed0a['cloudApiUrl'] : _0x18ed0a['apiUrl'],
      _0x52bcf0 =
        _0xebccc4['connectionCapability'] === 'cloud' ? '' : PROVIDERS_META?.['comfyui']?.['defaultUrl'];
    return String(_0x4281f0 || _0x545368['apiUrl'] || _0x545368['baseUrl'] || _0x52bcf0 || '')['trim']();
  }
  if (_0xebccc4['credentialField'] === 'modelApiKey')
    return String(_0x18ed0a['modelApiKey'] || _0x545368['modelApiKey'] || _0x545368['apiKey'] || '')[
      'trim'
    ]();
  return String(_0x18ed0a['apiKey'] || _0x545368['apiKey'] || '')['trim']();
}
function buildMissingCredentialMessage(_0x543cba) {
  if (_0x543cba['credentialField'] === 'cliLogin') return '请先登录 ' + _0x543cba['providerLabel'];
  if (_0x543cba['credentialField'] === 'apiUrl')
    return '请先配置 ' + _0x543cba['providerLabel'] + ' 服务地址';
  if (_0x543cba['credentialField'] === 'modelApiKey')
    return '请先配置 ' + _0x543cba['providerLabel'] + ' 模型 API Key';
  if (_0x543cba['adapterType'] === 'workflow')
    return '请先配置 ' + _0x543cba['providerLabel'] + ' 工作流 API Key';
  return '请先配置 ' + _0x543cba['providerLabel'] + ' API Key';
}
function getProviderConnectionStatus(_0x4d48d5 = {}) {
  return String(_0x4d48d5?.['connectionVerification']?.['status'] || '')
    ['trim']()
    ['toLowerCase']();
}
function isProviderConnectionVerified(_0x25d1fa = {}) {
  return getProviderConnectionStatus(_0x25d1fa) === 'passed';
}
function getProviderConnectionCapability(_0x796294 = {}) {
  const _0x5c1a3a = normalizeProfileId(_0x796294['configProviderId']);
  if (_0x5c1a3a === 'comfyui')
    return ['local', 'cloud']['includes'](_0x796294['connectionCapability'])
      ? _0x796294['connectionCapability']
      : 'local';
  if (!['runninghub', 'runninghub-international']['includes'](_0x5c1a3a)) return '';
  return _0x796294['credentialField'] === 'modelApiKey'
    ? 'modelApi'
    : _0x796294['credentialField'] === 'apiKey'
      ? 'workflow'
      : '';
}
function getProviderConnectionCapabilityStatus(_0x2e2f1a, _0x33cb3b = {}) {
  return String(_0x33cb3b?.['connectionVerification']?.['capabilities']?.[_0x2e2f1a]?.['status'] || '')
    ['trim']()
    ['toLowerCase']();
}
function isProviderConnectionCapabilityVerified(_0x2825ca, _0x226b87 = {}) {
  return getProviderConnectionCapabilityStatus(_0x2825ca, _0x226b87) === 'passed';
}
function getConnectionCapabilityLabel(_0x36483a = '') {
  return _0x36483a === 'workflow'
    ? '工作流\x20API\x20Key'
    : _0x36483a === 'modelApi'
      ? '模型 API Key'
      : _0x36483a === 'cloud'
        ? '云端连接'
        : _0x36483a === 'local'
          ? '本地连接'
          : 'API 连接';
}
function buildUnverifiedConnectionMessage(_0x4dd5b3, _0x329a7b = '') {
  return '请先验证\x20' + _0x4dd5b3['providerLabel'] + '\x20' + getConnectionCapabilityLabel(_0x329a7b);
}
function isModelAuthorizationVerified(_0x515fa9, _0x5ece2c = {}) {
  const _0x328d62 = String(_0x515fa9?.['authorizationCapability'] || '')['trim']();
  if (!_0x328d62) return ![];
  return (
    String(_0x5ece2c?.['connectionVerification']?.['capabilities']?.[_0x328d62]?.['status'] || '')
      ['trim']()
      ['toLowerCase']() === 'passed'
  );
}
function getModelAuthorizationStatus(_0x31038c, _0x40e7c2 = {}) {
  const _0x3c75e3 = String(_0x31038c?.['authorizationCapability'] || '')['trim']();
  return _0x3c75e3 ? getProviderConnectionCapabilityStatus(_0x3c75e3, _0x40e7c2) : '';
}
export function evaluateModelGenerationReadiness(_0x53d8a5 = {}) {
  const _0x390764 = _0x53d8a5['requirement'] || resolveModelCredentialRequirement(_0x53d8a5);
  if (!_0x390764['required'])
    return { ready: !![], status: 'ready', reason: 'credential-not-required', ..._0x390764, message: '' };
  if (_0x390764['credentialField'] === 'cliLogin') {
    const _0x1780cd = _0x53d8a5['cliStatus'];
    if (!_0x1780cd || typeof _0x1780cd !== 'object' || Array['isArray'](_0x1780cd))
      return { ready: ![], status: 'loading', reason: 'cli-status-loading', ..._0x390764, message: '' };
    if (_0x1780cd['loggedIn'] === !![])
      return { ready: !![], status: 'ready', reason: 'cli-login-present', ..._0x390764, message: '' };
    return {
      ready: ![],
      status: 'missing',
      reason: 'cli-login-missing',
      ..._0x390764,
      message: buildMissingCredentialMessage(_0x390764),
    };
  }
  if (_0x53d8a5['configLoaded'] === ![] && !_0x53d8a5['providerConfig'] && !_0x53d8a5['payload'])
    return { ready: ![], status: 'loading', reason: 'config-loading', ..._0x390764, message: '' };
  const _0x4210e6 = readCredentialValue(_0x390764, _0x53d8a5);
  if (_0x4210e6) {
    const _0x2b1c08 =
        _0x53d8a5['providerConfig'] &&
        typeof _0x53d8a5['providerConfig'] === 'object' &&
        !Array['isArray'](_0x53d8a5['providerConfig']),
      _0x5e67df = _0x2b1c08
        ? Boolean(
            readCredentialValue(_0x390764, { providerConfig: _0x53d8a5['providerConfig'], payload: {} }),
          )
        : ![];
    if (_0x390764['requirementType'] === 'modelAuthorization') {
      if (_0x2b1c08 && isModelAuthorizationVerified(_0x390764, _0x53d8a5['providerConfig']))
        return {
          ready: !![],
          status: 'ready',
          reason: 'model-authorization-verified',
          ..._0x390764,
          message: '',
        };
      if (!_0x5e67df)
        return { ready: !![], status: 'ready', reason: 'credential-present', ..._0x390764, message: '' };
      if (getModelAuthorizationStatus(_0x390764, _0x53d8a5['providerConfig']) === 'failed')
        return {
          ready: ![],
          status: 'missing',
          reason: 'model-authorization-missing',
          ..._0x390764,
          message: '请在设置中重新测试 ' + _0x390764['providerLabel'] + '，确认当前模型服务已开通',
        };
      return {
        ready: !![],
        status: 'unverified',
        reason: 'model-authorization-unverified',
        ..._0x390764,
        message: _0x390764['providerLabel'] + ' 将在首次生成时自动验证',
      };
    }
    const _0x1971f3 = getProviderConnectionCapability(_0x390764);
    if (_0x390764['verificationRequired'] && _0x2b1c08 && _0x5e67df) {
      const _0x5c4ce9 = _0x1971f3
        ? isProviderConnectionCapabilityVerified(_0x1971f3, _0x53d8a5['providerConfig'])
        : isProviderConnectionVerified(_0x53d8a5['providerConfig']);
      if (!_0x5c4ce9) {
        const _0x609be = _0x1971f3
          ? getProviderConnectionCapabilityStatus(_0x1971f3, _0x53d8a5['providerConfig'])
          : getProviderConnectionStatus(_0x53d8a5['providerConfig']);
        if (_0x609be === 'failed') {
          if (
            normalizeProfileId(_0x390764['configProviderId']) === 'comfyui' &&
            ['local', 'cloud']['includes'](_0x1971f3)
          )
            return {
              ready: !![],
              status: 'unverified',
              reason: 'connection-capability-retry-required',
              ..._0x390764,
              message: buildUnverifiedConnectionMessage(_0x390764, _0x1971f3) + '失败；本次生成将重新验证',
            };
          return {
            ready: ![],
            status: 'missing',
            reason: 'connection-validation-failed',
            ..._0x390764,
            message: _0x1971f3
              ? _0x390764['providerLabel'] +
                '\x20' +
                getConnectionCapabilityLabel(_0x1971f3) +
                ' 验证失败，请检查 Key 后重试'
              : _0x390764['providerLabel'] + ' API 验证失败，请检查 Key 后重试',
          };
        }
        return {
          ready: !![],
          status: 'unverified',
          reason: _0x1971f3 ? 'connection-capability-unverified' : 'connection-unverified',
          ..._0x390764,
          message: buildUnverifiedConnectionMessage(_0x390764, _0x1971f3) + '；首次生成时将自动验证',
        };
      }
    }
    return {
      ready: !![],
      status: 'ready',
      reason:
        _0x390764['verificationRequired'] && _0x2b1c08
          ? _0x1971f3
            ? 'connection-capability-verified'
            : 'connection-verified'
          : 'credential-present',
      ..._0x390764,
      message: '',
    };
  }
  return {
    ready: ![],
    status: 'missing',
    reason: 'credential-missing',
    ..._0x390764,
    message: buildMissingCredentialMessage(_0x390764),
  };
}
export function getModelGenerationReadiness(_0x1ebcf8 = {}) {
  const _0xad4d1e = resolveModelCredentialRequirement(_0x1ebcf8);
  if (_0xad4d1e['credentialField'] === 'cliLogin') {
    const _0xc006aa =
      _0xad4d1e['cliProviderId'] === 'dreamina'
        ? getCachedDreaminaCliStatus()
        : getCachedCliProviderStatus(_0xad4d1e['cliProviderId']);
    return evaluateModelGenerationReadiness({ ..._0x1ebcf8, requirement: _0xad4d1e, cliStatus: _0xc006aa });
  }
  const _0x44a221 = isApiConfigLoaded(),
    _0x3b4d4d = _0x44a221
      ? getProviderConfig(_0xad4d1e['configProviderId'] || _0xad4d1e['providerId'])
      : null;
  return evaluateModelGenerationReadiness({
    ..._0x1ebcf8,
    requirement: _0xad4d1e,
    configLoaded: _0x44a221,
    providerConfig: _0x3b4d4d,
  });
}
async function ensureCliProviderStatus(_0x4d7311) {
  const _0x454f25 =
    _0x4d7311 === 'dreamina' ? getCachedDreaminaCliStatus() : getCachedCliProviderStatus(_0x4d7311);
  if (_0x454f25) return _0x454f25;
  if (CLI_STATUS_REQUESTS['has'](_0x4d7311)) return CLI_STATUS_REQUESTS['get'](_0x4d7311);
  const _0x199788 =
    _0x4d7311 === 'dreamina'
      ? fetchDreaminaCliStatusFromServer({ refresh: !![] })
      : fetchCliProviderStatuses()['then'](() => getCachedCliProviderStatus(_0x4d7311));
  CLI_STATUS_REQUESTS['set'](_0x4d7311, _0x199788);
  try {
    return await _0x199788;
  } finally {
    CLI_STATUS_REQUESTS['delete'](_0x4d7311);
  }
}
export async function ensureModelGenerationReadiness(_0x5d1d4b = {}) {
  const _0x59f5ee = resolveModelCredentialRequirement(_0x5d1d4b);
  if (_0x59f5ee['credentialField'] === 'cliLogin')
    return (
      await ensureCliProviderStatus(_0x59f5ee['cliProviderId']),
      getModelGenerationReadiness(_0x5d1d4b)
    );
  await ensureConfig();
  const _0x327d18 = getModelGenerationReadiness(_0x5d1d4b);
  if (_0x5d1d4b['autoVerify'] !== !![] || _0x327d18['status'] !== 'unverified') return _0x327d18;
  let _0x5212c4;
  try {
    _0x5212c4 = await autoVerifyProviderConnection(_0x59f5ee);
  } catch (_0x11e013) {
    _0x5212c4 = { ok: ![], error: _0x11e013?.['message'] || 'API 连接验证失败' };
  }
  const _0x1dd42b = getModelGenerationReadiness(_0x5d1d4b);
  if (_0x1dd42b['ready'] && _0x1dd42b['status'] !== 'unverified') return _0x1dd42b;
  return {
    ..._0x1dd42b,
    ready: ![],
    status: 'missing',
    reason: 'connection-validation-failed',
    message: _0x59f5ee['providerLabel'] + ' 自动验证未通过：' + getProviderConnectionFailureDetail(_0x5212c4),
    validationResult: _0x5212c4,
  };
}
export function createMissingModelCredentialError(_0x1457c3) {
  const _0x3cb505 =
      _0x1457c3?.['status'] === 'missing' ? _0x1457c3 : evaluateModelGenerationReadiness(_0x1457c3 || {}),
    _0x9eae04 = new Error(_0x3cb505['message'] || '当前模型缺少可用的\x20API\x20Key');
  return (
    (_0x9eae04['name'] = 'ModelCredentialMissingError'),
    (_0x9eae04['code'] = 'MODEL_CREDENTIAL_MISSING'),
    (_0x9eae04['provider'] = _0x3cb505['providerId']),
    (_0x9eae04['providerId'] = _0x3cb505['configProviderId'] || _0x3cb505['providerId']),
    (_0x9eae04['keyType'] = _0x3cb505['keyType']),
    (_0x9eae04['adapterType'] = _0x3cb505['adapterType']),
    (_0x9eae04['model'] = _0x3cb505['modelId']),
    (_0x9eae04['fieldIds'] = _0x3cb505['fieldIds']),
    _0x9eae04
  );
}
