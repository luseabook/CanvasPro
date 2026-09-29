import {
  API_CONFIG_CHANGED_EVENT,
  getApiConfigSnapshot,
  getObjectStorageConfig,
  saveApiConfigToServer,
} from '../../../api/configApi.js';
import {
  normalizeObjectStorageConfig,
  testObjectStorageConnection,
  validateObjectStorageConfig,
} from '../../../api/objectStorageApi.js';
import {
  getObjectStorageProviderProfile,
  isObjectStorageProviderVerified,
  markObjectStorageProviderVerified,
  normalizeObjectStorageSettings,
  serializeObjectStorageSettings,
  updateObjectStorageProviderProfile,
} from '../../../api/objectStorageProfiles.js';
import { t } from '../../i18n/index.js';
const FIELD_IDS = Object['freeze']([
    'objectStorageEndpoint',
    'objectStorageRegion',
    'objectStorageBucket',
    'objectStorageAccessKeyId',
    'objectStorageSecretAccessKey',
    'objectStoragePublicBaseUrl',
  ]),
  PROVIDER_UI = Object['freeze']({
    'cloudflare-r2': Object['freeze']({
      i18nKey: 'cloudflareR2',
      badge: 'R2',
      consoleUrl: 'https://dash.cloudflare.com/?to=%2F%3Aaccount%2Fr2%2Foverview',
      tutorialId: 'a8d21eaa-ee3b-4f44-8820-c6efed668ca9',
      showEndpoint: !![],
      showRegion: ![],
      showAddressingStyle: ![],
      endpointPlaceholder: 'https://<account-id>.r2.cloudflarestorage.com',
      regionPlaceholder: 'auto',
      bucketPlaceholder: 'aicanvas-assets',
      publicUrlPlaceholder: 'https://assets.example.com',
    }),
    'tencent-cos': Object['freeze']({
      i18nKey: 'tencentCos',
      badge: 'COS',
      consoleUrl: 'https://console.cloud.tencent.com/cos',
      tutorialId: '13e4eb99-d4c3-4a0b-b724-ad137708a3b5',
      showEndpoint: ![],
      showRegion: !![],
      showAddressingStyle: ![],
      endpointPlaceholder: '',
      regionPlaceholder: 'ap-guangzhou',
      bucketPlaceholder: 'examplebucket-1250000000',
      publicUrlPlaceholder: 'https://examplebucket-1250000000.cos.ap-guangzhou.myqcloud.com',
    }),
    'aliyun-oss': Object['freeze']({
      i18nKey: 'aliyunOss',
      badge: 'OSS',
      consoleUrl: 'https://oss.console.aliyun.com/overview',
      tutorialUrl: '',
      showEndpoint: ![],
      showRegion: !![],
      showAddressingStyle: ![],
      endpointPlaceholder: '',
      regionPlaceholder: 'cn-hangzhou',
      bucketPlaceholder: 'aicanvas-assets',
      publicUrlPlaceholder: 'https://aicanvas-assets.oss-cn-hangzhou.aliyuncs.com',
    }),
    's3-compatible': Object['freeze']({
      i18nKey: 's3Compatible',
      badge: 'S3',
      consoleUrl: '',
      tutorialUrl: '',
      showEndpoint: !![],
      showRegion: !![],
      showAddressingStyle: !![],
      endpointPlaceholder: 'https://storage.example.com',
      regionPlaceholder: 'us-east-1',
      bucketPlaceholder: 'aicanvas-assets',
      publicUrlPlaceholder: 'https://assets.example.com',
    }),
  });
function tr(_0xdb320f, _0x32bfcd = {}) {
  let _0x3d24d4 = t('settings.objectStorage.' + _0xdb320f);
  return (
    Object['entries'](_0x32bfcd)['forEach'](([_0x2dee37, _0x14bc60]) => {
      _0x3d24d4 = _0x3d24d4['split']('{' + _0x2dee37 + '}')['join'](String(_0x14bc60 ?? ''));
    }),
    _0x3d24d4
  );
}
function getElements(_0x3289bf = globalThis['document']) {
  if (!_0x3289bf) return {};
  const _0x27b02b = {
    card: _0x3289bf['getElementById']('objectStorageConfigCard'),
    enabledOn: _0x3289bf['getElementById']('btnObjectStorageEnabledOn'),
    enabledOff: _0x3289bf['getElementById']('btnObjectStorageEnabledOff'),
    test: _0x3289bf['getElementById']('btnObjectStorageTest'),
    status: _0x3289bf['getElementById']('objectStorageStatus'),
    providerButtons: Array['from'](_0x3289bf['querySelectorAll']?.('[data-object-storage-provider]') || []),
    providerBadge: _0x3289bf['getElementById']('objectStorageProviderBadge'),
    providerTitle: _0x3289bf['getElementById']('objectStorageProviderTitle'),
    providerConsole: _0x3289bf['getElementById']('objectStorageProviderConsole'),
    providerTutorial: _0x3289bf['getElementById']('objectStorageProviderTutorial'),
    providerDescription: _0x3289bf['getElementById']('objectStorageProviderDescription'),
    endpointField: _0x3289bf['getElementById']('objectStorageEndpointField'),
    regionField: _0x3289bf['getElementById']('objectStorageRegionField'),
    addressingStyleField: _0x3289bf['getElementById']('objectStorageAddressingStyleField'),
    addressingPath: _0x3289bf['getElementById']('objectStorageAddressingPath'),
    addressingVirtualHosted: _0x3289bf['getElementById']('objectStorageAddressingVirtualHosted'),
    accessKeyIdLabel: _0x3289bf['getElementById']('objectStorageAccessKeyIdLabel'),
    secretAccessKeyLabel: _0x3289bf['getElementById']('objectStorageSecretAccessKeyLabel'),
  };
  return (
    FIELD_IDS['forEach']((_0x437688) => {
      _0x27b02b[_0x437688] = _0x3289bf['getElementById'](_0x437688);
    }),
    _0x27b02b
  );
}
function setToggleButtonState(_0xb48034, _0x8baacc) {
  if (!_0xb48034) return;
  (_0xb48034['classList']?.['toggle']('active', _0x8baacc),
    _0xb48034['setAttribute']?.('aria-pressed', _0x8baacc ? 'true' : 'false'));
}
function isObjectStorageBusy(_0x4f5583) {
  return _0x4f5583['card']?.['dataset']?.['objectStorageToggleBusy'] === 'true';
}
export function setObjectStorageFormEnabled(_0xfb5aec, _0x34a2db) {
  const _0x525b20 = _0x34a2db === !![];
  (setToggleButtonState(_0xfb5aec['enabledOn'], _0x525b20),
    setToggleButtonState(_0xfb5aec['enabledOff'], !_0x525b20),
    FIELD_IDS['forEach']((_0x1a72cd) => {
      if (_0xfb5aec[_0x1a72cd]) _0xfb5aec[_0x1a72cd]['disabled'] = isObjectStorageBusy(_0xfb5aec);
    }),
    _0xfb5aec['test'] && (_0xfb5aec['test']['disabled'] = isObjectStorageBusy(_0xfb5aec)),
    _0xfb5aec['card']?.['dataset'] &&
      (_0xfb5aec['card']['dataset']['objectStorageEnabled'] = _0x525b20 ? 'true' : 'false'));
}
function setStatus(_0x192a2c, _0x2e6109, _0x32cbc3) {
  const _0x2b555f = _0x192a2c['status'];
  if (!_0x2b555f) return;
  ((_0x2b555f['textContent'] = String(_0x32cbc3 || '')),
    _0x2b555f['classList']?.['toggle']('is-success', _0x2e6109 === 'success'),
    _0x2b555f['classList']?.['toggle']('is-error', _0x2e6109 === 'error'),
    _0x2b555f['classList']?.['toggle']('is-warning', _0x2e6109 === 'warning'));
}
function setObjectStorageToggleBusy(_0x2653f8, _0x2aadf6) {
  const _0x48574a = _0x2aadf6 === !![];
  if (_0x2653f8['enabledOn']) _0x2653f8['enabledOn']['disabled'] = _0x48574a;
  if (_0x2653f8['enabledOff']) _0x2653f8['enabledOff']['disabled'] = _0x48574a;
  (FIELD_IDS['forEach']((_0x48daa7) => {
    if (_0x2653f8[_0x48daa7]) _0x2653f8[_0x48daa7]['disabled'] = _0x48574a;
  }),
    _0x2653f8['providerButtons']?.['forEach']((_0x13fd7c) => {
      _0x13fd7c['disabled'] = _0x48574a;
    }));
  if (_0x2653f8['addressingPath']) _0x2653f8['addressingPath']['disabled'] = _0x48574a;
  (_0x2653f8['addressingVirtualHosted'] && (_0x2653f8['addressingVirtualHosted']['disabled'] = _0x48574a),
    _0x2653f8['test'] && (_0x2653f8['test']['disabled'] = _0x48574a),
    _0x2653f8['card']?.['dataset'] &&
      (_0x2653f8['card']['dataset']['objectStorageToggleBusy'] = _0x48574a ? 'true' : 'false'),
    _0x48574a
      ? _0x2653f8['card']?.['setAttribute']?.('aria-busy', 'true')
      : _0x2653f8['card']?.['removeAttribute']?.('aria-busy'));
}
function getSelectedProviderId(_0xdb2762, _0x119c2b = {}) {
  const _0x388b89 = _0xdb2762['providerButtons']?.['find'](
    (_0x29c227) =>
      _0x29c227['classList']?.['contains']('is-active') ||
      _0x29c227['getAttribute']?.('aria-pressed') === 'true',
  );
  if (_0x388b89?.['dataset']?.['objectStorageProvider']) return _0x388b89['dataset']['objectStorageProvider'];
  return normalizeObjectStorageSettings(_0x119c2b)['providerId'];
}
function setProviderButtonState(_0x5680c6, _0x26b309, _0xf82062) {
  _0x5680c6['providerButtons']?.['forEach']((_0x44bae8) => {
    const _0x1e89bd = _0x44bae8['dataset']?.['objectStorageProvider'],
      _0x5c3ec5 = _0x1e89bd === _0x26b309,
      _0x52beb2 = isObjectStorageProviderVerified(_0xf82062, _0x1e89bd),
      _0x974efd = PROVIDER_UI[_0x1e89bd];
    (_0x44bae8['classList']?.['toggle']('is-active', _0x5c3ec5),
      _0x44bae8['classList']?.['toggle']('is-verified', _0x52beb2),
      _0x44bae8['setAttribute']?.('aria-pressed', _0x5c3ec5 ? 'true' : 'false'));
    _0x44bae8['dataset'] && (_0x44bae8['dataset']['objectStorageVerified'] = _0x52beb2 ? 'true' : 'false');
    if (_0x974efd) {
      const _0x57eda2 = tr('providers.' + _0x974efd['i18nKey'] + '.title');
      _0x44bae8['setAttribute']?.(
        'aria-label',
        _0x52beb2 ? _0x57eda2 + '，' + tr('status.ready') : _0x57eda2,
      );
    }
  });
}
function setAddressingStyleState(_0x30c3d8, _0x7882c2) {
  const _0x2cfb37 = _0x7882c2 === 'virtual-hosted';
  (setToggleButtonState(_0x30c3d8['addressingPath'], !_0x2cfb37),
    setToggleButtonState(_0x30c3d8['addressingVirtualHosted'], _0x2cfb37));
}
function getAddressingStyle(_0x36346a) {
  return _0x36346a['addressingVirtualHosted']?.['classList']?.['contains']('active')
    ? 'virtual-hosted'
    : 'path';
}
function setHidden(_0x292736, _0x47135c) {
  if (_0x292736) _0x292736['hidden'] = _0x47135c === !![];
}
function setPlaceholder(_0x5b65ca, _0x536004) {
  if (!_0x5b65ca) return;
  ((_0x5b65ca['placeholder'] = String(_0x536004 || '')),
    _0x5b65ca['removeAttribute']?.('data-i18n-placeholder'));
}
function renderProviderPresentation(_0x20625c, _0x47e3c5, _0x105c26) {
  const _0x2286da = PROVIDER_UI[_0x47e3c5] || PROVIDER_UI['cloudflare-r2'],
    _0x401cb0 = 'providers.' + _0x2286da['i18nKey'];
  _0x20625c['providerBadge'] && (_0x20625c['providerBadge']['textContent'] = _0x2286da['badge']);
  _0x20625c['providerTitle'] &&
    ((_0x20625c['providerTitle']['textContent'] = tr(_0x401cb0 + '.title')),
    _0x20625c['providerTitle']['setAttribute']?.(
      'data-i18n',
      'settings.objectStorage.' + _0x401cb0 + '.title',
    ));
  _0x20625c['providerDescription'] &&
    ((_0x20625c['providerDescription']['textContent'] = tr(_0x401cb0 + '.desc')),
    _0x20625c['providerDescription']['setAttribute']?.(
      'data-i18n',
      'settings.objectStorage.' + _0x401cb0 + '.desc',
    ));
  [
    ['accessKeyIdLabel', _0x20625c['accessKeyIdLabel']],
    ['secretAccessKeyLabel', _0x20625c['secretAccessKeyLabel']],
  ]['forEach'](([_0x2e0786, _0x408ac4]) => {
    if (!_0x408ac4) return;
    ((_0x408ac4['textContent'] = tr(_0x401cb0 + '.' + _0x2e0786)),
      _0x408ac4['setAttribute']?.('data-i18n', 'settings.objectStorage.' + _0x401cb0 + '.' + _0x2e0786));
  });
  _0x20625c['providerConsole'] &&
    (setHidden(_0x20625c['providerConsole'], !_0x2286da['consoleUrl']),
    (_0x20625c['providerConsole']['dataset']['externalUrl'] = _0x2286da['consoleUrl']),
    _0x20625c['providerConsole']['setAttribute']?.('data-external-url', _0x2286da['consoleUrl']),
    _0x2286da['consoleUrl']
      ? ((_0x20625c['providerConsole']['textContent'] = tr(_0x401cb0 + '.console')),
        _0x20625c['providerConsole']['setAttribute']?.(
          'data-i18n',
          'settings.objectStorage.' + _0x401cb0 + '.console',
        ))
      : ((_0x20625c['providerConsole']['textContent'] = ''),
        _0x20625c['providerConsole']['removeAttribute']?.('data-i18n')));
  if (_0x20625c['providerTutorial']) {
    (setHidden(_0x20625c['providerTutorial'], !_0x2286da['tutorialId'] && !_0x2286da['tutorialUrl']),
      delete _0x20625c['providerTutorial']['dataset']['externalUrl'],
      delete _0x20625c['providerTutorial']['dataset']['apiTutorialTrigger'],
      _0x20625c['providerTutorial']['removeAttribute']?.('data-external-url'),
      _0x20625c['providerTutorial']['removeAttribute']?.('data-api-tutorial-trigger'));
    if (_0x2286da['tutorialId'])
      _0x20625c['providerTutorial']['dataset']['apiTutorialTrigger'] = _0x2286da['tutorialId'];
    else
      _0x2286da['tutorialUrl'] &&
        (_0x20625c['providerTutorial']['dataset']['externalUrl'] = _0x2286da['tutorialUrl']);
  }
  (setHidden(_0x20625c['endpointField'], !_0x2286da['showEndpoint']),
    setHidden(_0x20625c['regionField'], !_0x2286da['showRegion']),
    setHidden(_0x20625c['addressingStyleField'], !_0x2286da['showAddressingStyle']),
    setPlaceholder(_0x20625c['objectStorageEndpoint'], _0x2286da['endpointPlaceholder']),
    setPlaceholder(_0x20625c['objectStorageRegion'], _0x2286da['regionPlaceholder']),
    setPlaceholder(_0x20625c['objectStorageBucket'], _0x2286da['bucketPlaceholder']),
    setPlaceholder(_0x20625c['objectStoragePublicBaseUrl'], _0x2286da['publicUrlPlaceholder']),
    setAddressingStyleState(_0x20625c, _0x105c26['addressingStyle']));
}
export function collectObjectStorageFormConfig(_0x4f5b55, _0x163492 = getObjectStorageConfig()) {
  const _0x128b1c = normalizeObjectStorageSettings(_0x163492),
    _0x5dabc8 = getSelectedProviderId(_0x4f5b55, _0x128b1c),
    _0x589cf3 = getObjectStorageProviderProfile(_0x128b1c, _0x5dabc8),
    _0x35f99e = updateObjectStorageProviderProfile(_0x128b1c, _0x5dabc8, {
      endpoint: _0x4f5b55['objectStorageEndpoint']?.['value'],
      region: _0x4f5b55['objectStorageRegion']?.['value'],
      bucket: _0x4f5b55['objectStorageBucket']?.['value'],
      accessKeyId: _0x4f5b55['objectStorageAccessKeyId']?.['value'],
      secretAccessKey: _0x4f5b55['objectStorageSecretAccessKey']?.['value'],
      sessionToken: _0x589cf3['sessionToken'],
      publicBaseUrl: _0x4f5b55['objectStoragePublicBaseUrl']?.['value'],
      addressingStyle: getAddressingStyle(_0x4f5b55),
    });
  return serializeObjectStorageSettings({
    ..._0x35f99e,
    enabled: _0x4f5b55['enabledOn']?.['classList']?.['contains']('active') === !![],
  });
}
export function renderObjectStorageForm(_0x3b91c0, _0x1d0f37 = {}) {
  const _0x5d28af = normalizeObjectStorageSettings(_0x1d0f37),
    _0x1779f4 = getObjectStorageProviderProfile(_0x5d28af, _0x5d28af['providerId']);
  (setProviderButtonState(_0x3b91c0, _0x5d28af['providerId'], _0x5d28af),
    renderProviderPresentation(_0x3b91c0, _0x5d28af['providerId'], _0x1779f4),
    _0x3b91c0['objectStorageEndpoint'] &&
      (_0x3b91c0['objectStorageEndpoint']['value'] = _0x1779f4['endpoint']),
    _0x3b91c0['objectStorageRegion'] && (_0x3b91c0['objectStorageRegion']['value'] = _0x1779f4['region']),
    _0x3b91c0['objectStorageBucket'] && (_0x3b91c0['objectStorageBucket']['value'] = _0x1779f4['bucket']),
    _0x3b91c0['objectStorageAccessKeyId'] &&
      (_0x3b91c0['objectStorageAccessKeyId']['value'] = _0x1779f4['accessKeyId']),
    _0x3b91c0['objectStorageSecretAccessKey'] &&
      (_0x3b91c0['objectStorageSecretAccessKey']['value'] = _0x1779f4['secretAccessKey']),
    _0x3b91c0['objectStoragePublicBaseUrl'] &&
      (_0x3b91c0['objectStoragePublicBaseUrl']['value'] = _0x1779f4['publicBaseUrl']),
    setObjectStorageFormEnabled(_0x3b91c0, _0x5d28af['enabled']),
    setStatus(
      _0x3b91c0,
      _0x5d28af['enabled'] ? 'warning' : '',
      _0x5d28af['enabled'] ? tr('status.enabled') : tr('status.disabled'),
    ));
}
function setTestButtonBusy(_0x5322b6, _0x57d424, _0x208dfa, _0x97ff27) {
  if (!_0x5322b6) return;
  (_0x5322b6['classList']?.['toggle']('is-testing', _0x57d424 === !![]),
    _0x5322b6['setAttribute']?.('aria-busy', _0x57d424 ? 'true' : 'false'),
    (_0x5322b6['textContent'] = _0x57d424 ? _0x208dfa : _0x97ff27));
}
export async function saveObjectStorageEnabledState(
  _0x6d148,
  _0x67b676,
  {
    getCurrentConfig: getCurrentConfig = getObjectStorageConfig,
    getCurrentSnapshot: getCurrentSnapshot = getApiConfigSnapshot,
    saveConfig: saveConfig = saveApiConfigToServer,
  } = {},
) {
  if (isObjectStorageBusy(_0x6d148)) return { ok: ![], ignored: !![] };
  const _0x18f144 = getCurrentConfig();
  setObjectStorageFormEnabled(_0x6d148, _0x67b676);
  const _0xaca5cc = collectObjectStorageFormConfig(_0x6d148, _0x18f144);
  if (_0x67b676 && !isObjectStorageProviderVerified(_0xaca5cc, _0xaca5cc['providerId'])) {
    const _0x1e1d7e = serializeObjectStorageSettings({ ..._0xaca5cc, enabled: ![] });
    renderObjectStorageForm(_0x6d148, _0x1e1d7e);
    const _0x1a8508 = tr('status.testRequired');
    return (
      setStatus(_0x6d148, 'warning', _0x1a8508),
      { ok: ![], blocked: !![], message: _0x1a8508, objectStorage: _0x1e1d7e }
    );
  }
  (setObjectStorageToggleBusy(_0x6d148, !![]), setStatus(_0x6d148, 'warning', tr('actions.saving')));
  try {
    const _0x2ca05c = _0x67b676
      ? serializeObjectStorageSettings({ ..._0xaca5cc, enabled: !![] })
      : serializeObjectStorageSettings({ ..._0xaca5cc, enabled: ![] });
    if (_0x67b676) validateObjectStorageConfig(_0x2ca05c);
    await saveConfig({ ...getCurrentSnapshot(), objectStorage: _0x2ca05c });
    const _0x57a444 = _0x67b676 ? tr('status.savedEnabled') : tr('status.savedDisabled');
    return (
      setStatus(_0x6d148, _0x67b676 ? 'success' : '', _0x57a444),
      { ok: !![], message: _0x57a444, objectStorage: _0x2ca05c }
    );
  } catch (_0x22819c) {
    renderObjectStorageForm(_0x6d148, _0x18f144);
    const _0x51bf4d = tr('status.saveFailed', { error: _0x22819c?.['message'] || tr('status.unknownError') });
    return (setStatus(_0x6d148, 'error', _0x51bf4d), { ok: ![], error: _0x22819c, message: _0x51bf4d });
  } finally {
    setObjectStorageToggleBusy(_0x6d148, ![]);
  }
}
export async function saveObjectStorageFieldChanges(
  _0x1ad1c7,
  {
    getCurrentConfig: getCurrentConfig = getObjectStorageConfig,
    getCurrentSnapshot: getCurrentSnapshot = getApiConfigSnapshot,
    saveConfig: saveConfig = saveApiConfigToServer,
  } = {},
) {
  if (isObjectStorageBusy(_0x1ad1c7)) return { ok: ![], ignored: !![] };
  const _0x5dfc04 = getCurrentConfig(),
    _0x340d26 = normalizeObjectStorageSettings(_0x5dfc04)['enabled'];
  (setObjectStorageToggleBusy(_0x1ad1c7, !![]), setStatus(_0x1ad1c7, 'warning', tr('actions.saving')));
  try {
    const _0x54ced1 = collectObjectStorageFormConfig(_0x1ad1c7, _0x5dfc04),
      _0x3a8822 = _0x340d26 && !_0x54ced1['enabled'];
    _0x54ced1['enabled'] && validateObjectStorageConfig(_0x54ced1);
    (await saveConfig({ ...getCurrentSnapshot(), objectStorage: _0x54ced1 }),
      renderObjectStorageForm(_0x1ad1c7, _0x54ced1));
    const _0x166bfc = _0x3a8822 ? tr('status.changedRequiresRetest') : tr('status.saveSuccess');
    return (
      setStatus(_0x1ad1c7, _0x3a8822 ? 'warning' : 'success', _0x166bfc),
      { ok: !![], disabledAfterChange: _0x3a8822, message: _0x166bfc, objectStorage: _0x54ced1 }
    );
  } catch (_0x16602a) {
    renderObjectStorageForm(_0x1ad1c7, _0x5dfc04);
    const _0x515c34 = tr('status.saveFailed', { error: _0x16602a?.['message'] || tr('status.unknownError') });
    return (setStatus(_0x1ad1c7, 'error', _0x515c34), { ok: ![], error: _0x16602a, message: _0x515c34 });
  } finally {
    setObjectStorageToggleBusy(_0x1ad1c7, ![]);
  }
}
export async function saveObjectStorageProviderSelection(
  _0x292656,
  _0x4f977b,
  {
    getCurrentConfig: getCurrentConfig = getObjectStorageConfig,
    getCurrentSnapshot: getCurrentSnapshot = getApiConfigSnapshot,
    saveConfig: saveConfig = saveApiConfigToServer,
  } = {},
) {
  if (
    isObjectStorageBusy(_0x292656) ||
    !Object['prototype']['hasOwnProperty']['call'](PROVIDER_UI, _0x4f977b)
  )
    return { ok: ![], ignored: !![] };
  const _0x236ebf = getCurrentConfig(),
    _0x4621b8 = normalizeObjectStorageSettings(_0x236ebf)['enabled'],
    _0x57d3fa = collectObjectStorageFormConfig(_0x292656, _0x236ebf);
  if (_0x57d3fa['providerId'] === _0x4f977b) return { ok: !![], ignored: !![], objectStorage: _0x57d3fa };
  let _0x2308f1 = serializeObjectStorageSettings({ ..._0x57d3fa, providerId: _0x4f977b, enabled: _0x4621b8 }),
    _0x358ded = _0x4621b8 && !_0x2308f1['enabled'];
  if (_0x2308f1['enabled'])
    try {
      validateObjectStorageConfig(_0x2308f1);
    } catch {
      ((_0x2308f1 = serializeObjectStorageSettings({ ..._0x2308f1, enabled: ![] })), (_0x358ded = !![]));
    }
  (renderObjectStorageForm(_0x292656, _0x2308f1),
    setObjectStorageToggleBusy(_0x292656, !![]),
    setStatus(_0x292656, 'warning', tr('actions.saving')));
  try {
    (await saveConfig({ ...getCurrentSnapshot(), objectStorage: _0x2308f1 }),
      renderObjectStorageForm(_0x292656, _0x2308f1));
    const _0x40662a = PROVIDER_UI[_0x4f977b],
      _0x245f86 = tr('providers.' + _0x40662a['i18nKey'] + '.title'),
      _0x413908 = _0x358ded
        ? tr('status.providerSelectedDisabled', { provider: _0x245f86 })
        : tr('status.providerSelected', { provider: _0x245f86 });
    return (
      setStatus(_0x292656, _0x358ded ? 'warning' : 'success', _0x413908),
      { ok: !![], disabledAfterSelection: _0x358ded, message: _0x413908, objectStorage: _0x2308f1 }
    );
  } catch (_0x26843f) {
    renderObjectStorageForm(_0x292656, _0x236ebf);
    const _0x1ddb19 = tr('status.saveFailed', { error: _0x26843f?.['message'] || tr('status.unknownError') });
    return (setStatus(_0x292656, 'error', _0x1ddb19), { ok: ![], error: _0x26843f, message: _0x1ddb19 });
  } finally {
    setObjectStorageToggleBusy(_0x292656, ![]);
  }
}
export async function verifyObjectStorageConnection(
  _0x22c0cf,
  {
    getCurrentConfig: getCurrentConfig = getObjectStorageConfig,
    getCurrentSnapshot: getCurrentSnapshot = getApiConfigSnapshot,
    testConnection: testConnection = testObjectStorageConnection,
    saveConfig: saveConfig = saveApiConfigToServer,
    now: now = Date['now'],
  } = {},
) {
  if (isObjectStorageBusy(_0x22c0cf)) return { ok: ![], ignored: !![] };
  const _0x45b6fa = tr('actions.test'),
    _0x3dbf3f = getCurrentConfig();
  let _0x2580b8;
  try {
    ((_0x2580b8 = collectObjectStorageFormConfig(_0x22c0cf, _0x3dbf3f)),
      validateObjectStorageConfig(_0x2580b8, { requireEnabled: ![] }),
      setObjectStorageToggleBusy(_0x22c0cf, !![]),
      setTestButtonBusy(_0x22c0cf['test'], !![], tr('actions.testing'), _0x45b6fa),
      setStatus(_0x22c0cf, 'warning', tr('status.testing')));
    const _0x32c6e = await testConnection(_0x2580b8),
      _0x308c8f = serializeObjectStorageSettings(
        markObjectStorageProviderVerified(_0x2580b8, _0x2580b8['providerId'], { verifiedAt: now() }),
      );
    (await saveConfig({ ...getCurrentSnapshot(), objectStorage: _0x308c8f }),
      renderObjectStorageForm(_0x22c0cf, _0x308c8f));
    const _0x533ade = _0x32c6e?.['cleanupOk'] === ![] ? '\x20' + tr('status.testCleanupWarning') : '',
      _0x5575b8 = '' + tr('status.testSuccess') + _0x533ade;
    return (
      setStatus(_0x22c0cf, 'success', _0x5575b8),
      { ok: !![], message: _0x5575b8, objectStorage: _0x308c8f, result: _0x32c6e }
    );
  } catch (_0x21ff07) {
    const _0x1c38e7 = tr('status.testFailed', { error: _0x21ff07?.['message'] || tr('status.unknownError') });
    return (
      setStatus(_0x22c0cf, 'error', _0x1c38e7),
      { ok: ![], error: _0x21ff07, message: _0x1c38e7, objectStorage: _0x2580b8 }
    );
  } finally {
    (setTestButtonBusy(_0x22c0cf['test'], ![], tr('actions.testing'), _0x45b6fa),
      setObjectStorageToggleBusy(_0x22c0cf, ![]));
  }
}
function showToast(_0x2dc280, _0x54fa71 = '') {
  globalThis['window']?.['showToast']?.(_0x2dc280, _0x54fa71);
}
export function initObjectStorageSettings({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const _0x5c195f = getElements(documentObject);
  if (!_0x5c195f['card'] || _0x5c195f['card']['dataset']?.['objectStorageBound'] === 'true') return ![];
  ((_0x5c195f['card']['dataset']['objectStorageBound'] = 'true'),
    renderObjectStorageForm(_0x5c195f, getObjectStorageConfig()));
  const _0x5db83b = async (_0x3c66b6) => {
    const _0x308c02 = await saveObjectStorageEnabledState(_0x5c195f, _0x3c66b6);
    if (_0x308c02['ignored']) return;
    showToast(
      _0x308c02['ok'] ? tr('status.saveSuccess') : _0x308c02['message'],
      _0x308c02['ok'] ? '' : _0x308c02['blocked'] ? 'warning' : 'error',
    );
  };
  (_0x5c195f['enabledOn']?.['addEventListener']('click', () => {
    void _0x5db83b(!![]);
  }),
    _0x5c195f['enabledOff']?.['addEventListener']('click', () => {
      void _0x5db83b(![]);
    }),
    _0x5c195f['providerButtons']?.['forEach']((_0x10a1fc) => {
      _0x10a1fc['addEventListener']?.('click', async () => {
        const _0x5d5894 = await saveObjectStorageProviderSelection(
          _0x5c195f,
          _0x10a1fc['dataset']?.['objectStorageProvider'],
        );
        !_0x5d5894['ok'] && !_0x5d5894['ignored'] && showToast(_0x5d5894['message'], 'error');
      });
    }),
    FIELD_IDS['forEach']((_0x4b4651) => {
      _0x5c195f[_0x4b4651]?.['addEventListener']('change', async () => {
        const _0x51dfd4 = await saveObjectStorageFieldChanges(_0x5c195f);
        !_0x51dfd4['ok'] && !_0x51dfd4['ignored'] && showToast(_0x51dfd4['message'], 'error');
      });
    }));
  const _0x39f2a9 = (_0x3154f4) => {
    (setAddressingStyleState(_0x5c195f, _0x3154f4),
      void saveObjectStorageFieldChanges(_0x5c195f)['then']((_0x3cc6ff) => {
        !_0x3cc6ff['ok'] && !_0x3cc6ff['ignored'] && showToast(_0x3cc6ff['message'], 'error');
      }));
  };
  return (
    _0x5c195f['addressingPath']?.['addEventListener']('click', () => {
      _0x39f2a9('path');
    }),
    _0x5c195f['addressingVirtualHosted']?.['addEventListener']('click', () => {
      _0x39f2a9('virtual-hosted');
    }),
    _0x5c195f['test']?.['addEventListener']('click', async () => {
      const _0x23b6a4 = await verifyObjectStorageConnection(_0x5c195f);
      if (_0x23b6a4['ignored']) return;
      showToast(_0x23b6a4['message'], _0x23b6a4['ok'] ? '' : 'error');
    }),
    windowObject?.['addEventListener']?.(API_CONFIG_CHANGED_EVENT, () => {
      renderObjectStorageForm(_0x5c195f, getObjectStorageConfig());
    }),
    !![]
  );
}
export const __objectStorageSettingsForTest = Object['freeze']({
  FIELD_IDS: FIELD_IDS,
  PROVIDER_UI: PROVIDER_UI,
  getElements: getElements,
});
