import { modelMenuPreferenceStore } from '../core/stores/modelMenuPreferenceStore.js';
import { getModelGenerationReadiness } from '../services/modelGenerationReadiness.js';
import { getModelProviderProfileIds } from './modelProviderProfileSelection.js';
import { openProviderApiKeySettings } from './providerApiKeyMissingToast.js';
import { t } from '../i18n/index.js';
import { getCachedCliProviderStatus } from '../../api/cliProviderApi.js';
import { getCachedDreaminaCliStatus } from '../../api/dreaminaCliApi.js';
const previousDisplay = new WeakMap(),
  filteredMenus = new WeakSet();
function setHidden(_0x4f678d, _0x1a589f) {
  if (!_0x4f678d?.['style'] || !_0x4f678d?.['dataset']) return;
  if (_0x1a589f) {
    if (!previousDisplay['has'](_0x4f678d)) previousDisplay['set'](_0x4f678d, _0x4f678d['style']['display']);
    ((_0x4f678d['dataset']['modelMenuHidden'] = 'true'), (_0x4f678d['style']['display'] = 'none'));
  } else
    previousDisplay['has'](_0x4f678d) &&
      ((_0x4f678d['style']['display'] = previousDisplay['get'](_0x4f678d)),
      previousDisplay['delete'](_0x4f678d),
      delete _0x4f678d['dataset']['modelMenuHidden']);
}
export function isModelMenuEntryUnconfigured(_0x31111c, _0x2ff963 = getModelGenerationReadiness) {
  const _0xc0dded = getModelProviderProfileIds(_0x31111c['modelId']);
  return (_0xc0dded['length'] ? _0xc0dded : [_0x31111c['providerProfileId']])['every']((_0x14bbc7) => {
    const _0x323e5a = _0x2ff963({ ..._0x31111c, providerProfileId: _0x14bbc7 });
    if (_0x323e5a['reason'] === 'cli-login-missing') {
      const _0x26c437 =
        _0x323e5a['cliProviderId'] === 'dreamina'
          ? getCachedDreaminaCliStatus()
          : getCachedCliProviderStatus(_0x323e5a['cliProviderId']);
      return !_0x26c437?.['authConfigured'] && !_0x26c437?.['error'];
    }
    return _0x323e5a['reason'] === 'credential-missing';
  });
}
export function syncModelMenuVisibility(_0x99eaa6, _0x94f072, _0x1a991e = {}) {
  const _0x5a983c = modelMenuPreferenceStore['getState']()['hideUnconfigured'];
  if (!_0x5a983c && !filteredMenus['has'](_0x99eaa6)) return;
  if (_0x5a983c) filteredMenus['add'](_0x99eaa6);
  else filteredMenus['delete'](_0x99eaa6);
  _0x94f072['forEach']((_0x1379a0) => {
    setHidden(
      _0x1379a0,
      _0x5a983c &&
        isModelMenuEntryUnconfigured({
          modelId: String(_0x1379a0['dataset']?.['credentialModel'] || _0x1379a0['dataset']?.['value'] || ''),
          provider: String(_0x1379a0['dataset']?.['provider'] || ''),
          providerProfileId: _0x1379a0['dataset']?.['providerProfileId'] || '',
        }),
    );
  });
  const _0x4c153f = [..._0x99eaa6['querySelectorAll']('[data-node-menu-submenu]')];
  _0x4c153f['reverse']()['forEach']((_0x298084) => {
    const _0x2767e1 = _0x99eaa6['querySelector']?.(_0x298084['dataset']?.['nodeMenuSubmenu']);
    if (!_0x2767e1) return;
    const _0x240a4d = _0x94f072['filter']((_0x457b5b) => _0x2767e1['contains'](_0x457b5b)),
      _0x3b31e2 =
        _0x5a983c &&
        (_0x240a4d['length'] > 0x0
          ? _0x240a4d['every']((_0x539518) => _0x539518['dataset']?.['modelMenuHidden'] === 'true')
          : Boolean(_0x298084['dataset']?.['credentialProvider']) &&
            isModelMenuEntryUnconfigured({
              modelId: '',
              provider: _0x298084['dataset']['credentialProvider'],
            }));
    (setHidden(_0x298084, _0x3b31e2),
      _0x3b31e2 && ((_0x2767e1['style']['display'] = 'none'), _0x2767e1['classList']?.['remove']('open')));
  });
  let _0x3c3e2c = _0x99eaa6['querySelector']?.('[data-model-menu-empty]');
  const _0xb086dd =
    _0x5a983c &&
    _0x94f072['length'] > 0x0 &&
    _0x94f072['every']((_0x45b2ca) => _0x45b2ca['dataset']?.['modelMenuHidden'] === 'true');
  if (_0xb086dd && !_0x3c3e2c) {
    const _0x3fb722 = _0x1a991e['documentObject'] || _0x99eaa6['ownerDocument'] || globalThis['document'];
    ((_0x3c3e2c = _0x3fb722?.['createElement']?.('button')),
      _0x3c3e2c &&
        ((_0x3c3e2c['type'] = 'button'),
        (_0x3c3e2c['className'] = 'floating-menu-item\x20model-menu-configuration-empty'),
        (_0x3c3e2c['dataset']['modelMenuEmpty'] = 'true'),
        _0x3c3e2c['addEventListener']('click', (_0x13c9a3) => {
          (_0x13c9a3['stopPropagation'](),
            openProviderApiKeySettings({ fieldIds: ['hideUnconfiguredProviders'] }));
        }),
        _0x99eaa6['appendChild'](_0x3c3e2c)));
  }
  _0x3c3e2c &&
    ((_0x3c3e2c['textContent'] =
      t('settings.apiInput.catalog.noConfiguredModels') +
      ' · ' +
      t('settings.apiInput.catalog.configureModels')),
    (_0x3c3e2c['hidden'] = !_0xb086dd),
    (_0x3c3e2c['style']['display'] = _0xb086dd ? '' : 'none'));
}
