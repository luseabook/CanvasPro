import { API_CONFIG_CHANGED_EVENT, ensureConfig, isApiConfigLoaded } from '../../api/configApi.js';
import { CLI_PROVIDER_STATUS_CHANGED_EVENT } from '../../api/cliProviderApi.js';
import { DREAMINA_CLI_STATUS_CHANGED_EVENT } from '../../api/dreaminaCliApi.js';
import {
  ensureModelGenerationReadiness,
  getModelGenerationReadiness,
} from '../services/modelGenerationReadiness.js';
import {
  getModelProviderProfileIds,
  resolveReadyModelProviderProfileId,
} from './modelProviderProfileSelection.js';
import { t } from '../i18n/index.js';
import { showCliLoginMissingToast } from './cliLoginMissingToast.js';
import { showProviderApiKeyMissingToast } from './providerApiKeyMissingToast.js';
import {
  MODEL_MENU_PREFERENCE_CHANGED_EVENT,
  modelMenuPreferenceStore,
} from '../core/stores/modelMenuPreferenceStore.js';
import { syncModelMenuVisibility } from './modelMenuVisibility.js';
import { syncModelMenuPrices } from '../components/shared/modelMenuPricing.js';
const CREDENTIAL_BUTTON_CLASS = 'is-credential-required',
  CREDENTIAL_BADGE_SELECTOR = '[data-model-credential-badge]',
  CREDENTIAL_MENU_ITEM_SELECTOR = ['.node-menu-item[data-value]', '.node-menu-item[data-credential-model]'][
    'join'
  ](',\x20'),
  CREDENTIAL_STATUS_EVENTS = Object['freeze']([
    API_CONFIG_CHANGED_EVENT,
    CLI_PROVIDER_STATUS_CHANGED_EVENT,
    DREAMINA_CLI_STATUS_CHANGED_EVENT,
    MODEL_MENU_PREFERENCE_CHANGED_EVENT,
  ]),
  CREDENTIAL_STATUS_SUBSCRIPTIONS = new WeakMap(),
  CREDENTIAL_STATUS_REVISIONS = new WeakMap(),
  MODEL_CREDENTIAL_MENU_SYNC_STATES = new WeakMap(),
  MODEL_CREDENTIAL_ITEM_SYNC_STATES = new WeakMap();
function getCredentialStatusRevision(_0x3cc726 = globalThis['window']) {
  if (!_0x3cc726?.['addEventListener']) return null;
  let _0x4ef0ef = CREDENTIAL_STATUS_REVISIONS['get'](_0x3cc726);
  if (!_0x4ef0ef) {
    _0x4ef0ef = { revision: 0x0 };
    const _0x58febb = () => {
      _0x4ef0ef['revision'] += 0x1;
    };
    (CREDENTIAL_STATUS_EVENTS['forEach']((_0x37542e) => {
      _0x3cc726['addEventListener'](_0x37542e, _0x58febb, !![]);
    }),
      CREDENTIAL_STATUS_REVISIONS['set'](_0x3cc726, _0x4ef0ef));
  }
  return _0x4ef0ef['revision'];
}
function bindModelCredentialStatusEvents(_0x2ea8c0, _0x28ac33 = globalThis['window']) {
  if (typeof _0x2ea8c0 !== 'function' || !_0x28ac33?.['addEventListener']) return () => {};
  let _0x2631ef = CREDENTIAL_STATUS_SUBSCRIPTIONS['get'](_0x28ac33);
  if (!_0x2631ef) {
    const _0x1c734c = new Set(),
      _0x4d5873 = (_0x4ccb14) => {
        [..._0x1c734c]['forEach']((_0x133044) => _0x133044(_0x4ccb14));
      };
    ((_0x2631ef = { dispatch: _0x4d5873, listeners: _0x1c734c }),
      CREDENTIAL_STATUS_SUBSCRIPTIONS['set'](_0x28ac33, _0x2631ef),
      CREDENTIAL_STATUS_EVENTS['forEach']((_0x105d5a) => {
        _0x28ac33['addEventListener'](_0x105d5a, _0x4d5873);
      }));
  }
  _0x2631ef['listeners']['add'](_0x2ea8c0);
  let _0x1dad3f = !![];
  return () => {
    if (!_0x1dad3f) return;
    ((_0x1dad3f = ![]), _0x2631ef['listeners']['delete'](_0x2ea8c0));
    if (_0x2631ef['listeners']['size'] > 0x0) return;
    (CREDENTIAL_STATUS_EVENTS['forEach']((_0x4dc665) => {
      _0x28ac33['removeEventListener']?.(_0x4dc665, _0x2631ef['dispatch']);
    }),
      CREDENTIAL_STATUS_SUBSCRIPTIONS['delete'](_0x28ac33));
  };
}
function getMenuItemCredentialContext(_0x4da6e4) {
  return {
    modelId: String(_0x4da6e4?.['dataset']?.['credentialModel'] || _0x4da6e4?.['dataset']?.['value'] || '')[
      'trim'
    ](),
    providerId: String(_0x4da6e4?.['dataset']?.['provider'] || '')['trim'](),
  };
}
function showMissingCredential(_0x842765) {
  if (!_0x842765 || _0x842765['status'] !== 'missing') return ![];
  if (_0x842765['requirementType'] === 'cliLogin')
    return (
      showCliLoginMissingToast(_0x842765['message'], {
        providerId: _0x842765['cliProviderId'],
        fieldIds: _0x842765['fieldIds'],
      }),
      !![]
    );
  return (
    showProviderApiKeyMissingToast(_0x842765['message'], {
      providerId: _0x842765['configProviderId'] || _0x842765['providerId'],
      fieldIds: _0x842765['fieldIds'],
      keyType: _0x842765['keyType'],
      adapterType: _0x842765['adapterType'],
      model: _0x842765['modelId'],
    }),
    !![]
  );
}
export function guardModelGenerationCredentials(_0x32e975 = {}) {
  let _0x268f65 = getModelGenerationReadiness(_0x32e975);
  if (_0x268f65['status'] === 'loading' && _0x32e975['waitForConfig'] === !![])
    return ensureModelGenerationReadiness(_0x32e975)['then']((_0x6196ed) => {
      if (_0x6196ed['ready']) return _0x6196ed;
      return (showMissingCredential(_0x6196ed), _0x6196ed);
    });
  if (_0x268f65['status'] === 'loading')
    return { ..._0x268f65, ready: !![], status: 'deferred', reason: 'runtime-check-pending' };
  if (_0x268f65['ready']) return _0x268f65;
  return (showMissingCredential(_0x268f65), _0x268f65);
}
export function resetModelCredentialButtonState(_0x53e657) {
  if (!_0x53e657) return;
  const _0x2f9d2d = _0x53e657['dataset'] || {};
  (_0x53e657['classList']?.['remove'](CREDENTIAL_BUTTON_CLASS),
    _0x2f9d2d['credentialUiApplied'] === 'true' &&
      (_0x2f9d2d['credentialHadTitle'] === 'true'
        ? _0x53e657['setAttribute']?.('title', _0x2f9d2d['credentialOriginalTitle'] || '')
        : _0x53e657['removeAttribute']?.('title'),
      _0x2f9d2d['credentialHadAriaLabel'] === 'true'
        ? _0x53e657['setAttribute']?.('aria-label', _0x2f9d2d['credentialOriginalAriaLabel'] || '')
        : _0x53e657['removeAttribute']?.('aria-label'),
      _0x53e657['style'] && (_0x53e657['style']['cursor'] = _0x2f9d2d['credentialOriginalCursor'] || '')),
    delete _0x2f9d2d['credentialProvider'],
    delete _0x2f9d2d['credentialField'],
    delete _0x2f9d2d['credentialUiApplied'],
    delete _0x2f9d2d['credentialHadTitle'],
    delete _0x2f9d2d['credentialOriginalTitle'],
    delete _0x2f9d2d['credentialHadAriaLabel'],
    delete _0x2f9d2d['credentialOriginalAriaLabel'],
    delete _0x2f9d2d['credentialOriginalCursor']);
}
export function applyModelCredentialButtonState(_0x479850, _0x216e48 = {}) {
  if (!_0x479850) return null;
  const _0x5cda23 = getModelGenerationReadiness(_0x216e48);
  resetModelCredentialButtonState(_0x479850);
  if (_0x5cda23['status'] !== 'missing') return _0x5cda23;
  const _0x283d39 = _0x479850['dataset'] || {};
  return (
    (_0x283d39['credentialUiApplied'] = 'true'),
    (_0x283d39['credentialHadTitle'] = String(_0x479850['hasAttribute']?.('title'))),
    (_0x283d39['credentialOriginalTitle'] = _0x479850['getAttribute']?.('title') || ''),
    (_0x283d39['credentialHadAriaLabel'] = String(_0x479850['hasAttribute']?.('aria-label'))),
    (_0x283d39['credentialOriginalAriaLabel'] = _0x479850['getAttribute']?.('aria-label') || ''),
    (_0x283d39['credentialOriginalCursor'] = _0x479850['style']?.['cursor'] || ''),
    _0x479850['classList']?.['add'](CREDENTIAL_BUTTON_CLASS),
    (_0x283d39['credentialProvider'] = _0x5cda23['configProviderId'] || _0x5cda23['providerId']),
    (_0x283d39['credentialField'] = _0x5cda23['credentialField']),
    (_0x479850['disabled'] = ![]),
    (_0x479850['title'] = _0x5cda23['message']),
    _0x479850['setAttribute']?.('aria-label', _0x5cda23['message']),
    (_0x479850['style']['cursor'] = 'var(--link-cursor)'),
    _0x5cda23
  );
}
export function bindModelCredentialButtonState(_0x9eb56b, _0x5cf687 = {}) {
  if (!_0x9eb56b) return () => {};
  const _0x923855 =
      typeof _0x5cf687['getCredentialOptions'] === 'function'
        ? _0x5cf687['getCredentialOptions']
        : () => _0x5cf687['credentialOptions'] || {},
    _0x378aba = () => {
      if (_0x9eb56b['isConnected'] === ![]) return null;
      if (typeof _0x5cf687['onRefresh'] === 'function') return _0x5cf687['onRefresh'](_0x9eb56b);
      const _0x38b461 = _0x923855();
      if (!_0x38b461) return (resetModelCredentialButtonState(_0x9eb56b), null);
      return applyModelCredentialButtonState(_0x9eb56b, _0x38b461);
    },
    _0x19c937 = bindModelCredentialStatusEvents(_0x378aba, _0x5cf687['windowObject'] || globalThis['window']);
  if (_0x5cf687['syncOnBind'] !== ![]) _0x378aba();
  return _0x19c937;
}
function clearMenuItemCredentialState(_0x137f8b) {
  (_0x137f8b['classList']?.['remove']('needs-model-credential'),
    _0x137f8b['classList']?.['remove']('needs-model-api-authorization'));
  if (_0x137f8b['dataset']['credentialHadTitle'] === 'true')
    _0x137f8b['setAttribute']?.('title', _0x137f8b['dataset']['credentialOriginalTitle'] || '');
  else _0x137f8b['dataset']['credentialStateApplied'] === 'true' && _0x137f8b['removeAttribute']?.('title');
  (delete _0x137f8b['dataset']['credentialMissing'],
    delete _0x137f8b['dataset']['credentialProvider'],
    delete _0x137f8b['dataset']['credentialField'],
    delete _0x137f8b['dataset']['credentialKeyType'],
    delete _0x137f8b['dataset']['credentialFieldIds'],
    delete _0x137f8b['dataset']['credentialMessage'],
    delete _0x137f8b['dataset']['credentialResolvedProviderProfileId'],
    delete _0x137f8b['dataset']['credentialStateApplied'],
    delete _0x137f8b['dataset']['credentialHadTitle'],
    delete _0x137f8b['dataset']['credentialOriginalTitle'],
    _0x137f8b['querySelector']?.(CREDENTIAL_BADGE_SELECTOR)?.['remove']?.());
}
function markMenuItemCredentialMissing(_0x3bb154, _0x1410c3, _0x46eb06) {
  ((_0x3bb154['dataset']['credentialStateApplied'] = 'true'),
    (_0x3bb154['dataset']['credentialHadTitle'] = String(_0x3bb154['hasAttribute']?.('title'))),
    (_0x3bb154['dataset']['credentialOriginalTitle'] = _0x3bb154['getAttribute']?.('title') || ''),
    _0x3bb154['classList']?.['add']('needs-model-credential'));
  const _0xcaacc = _0x1410c3['requirementType'] !== 'cliLogin';
  _0xcaacc && _0x3bb154['classList']?.['add']('needs-model-api-authorization');
  ((_0x3bb154['dataset']['credentialMissing'] = 'true'),
    (_0x3bb154['dataset']['credentialProvider'] = _0x1410c3['configProviderId'] || _0x1410c3['providerId']),
    (_0x3bb154['dataset']['credentialField'] = _0x1410c3['credentialField']),
    (_0x3bb154['dataset']['credentialKeyType'] = _0x1410c3['keyType'] || ''),
    (_0x3bb154['dataset']['credentialFieldIds'] = JSON['stringify'](_0x1410c3['fieldIds'] || [])),
    (_0x3bb154['dataset']['credentialMessage'] = _0x1410c3['message']),
    _0x3bb154['setAttribute']?.('title', _0x1410c3['message']));
  const _0x595f27 = _0x46eb06?.['createElement']?.('span');
  if (!_0x595f27) return;
  ((_0x595f27['className'] = 'floating-menu-badge floating-menu-badge-warning model-credential-badge'),
    (_0x595f27['dataset']['modelCredentialBadge'] = 'true'),
    (_0x595f27['textContent'] = t('settings.apiInput.readiness.requiredShort')),
    _0x3bb154['appendChild']?.(_0x595f27));
}
function getMenuItemCredentialStateSignature(_0x436edb, _0x132c7e) {
  return JSON['stringify']([
    _0x132c7e || '',
    _0x436edb?.['status'] || '',
    _0x436edb?.['reason'] || '',
    _0x436edb?.['requirementType'] || '',
    _0x436edb?.['configProviderId'] || _0x436edb?.['providerId'] || '',
    _0x436edb?.['credentialField'] || '',
    _0x436edb?.['keyType'] || '',
    _0x436edb?.['fieldIds'] || [],
    _0x436edb?.['message'] || '',
    t('settings.apiInput.readiness.requiredShort'),
  ]);
}
function hasExpectedMenuItemCredentialState(_0x5ae9c7, _0x4c7b8b) {
  const _0x1beed7 = _0x4c7b8b?.['status'] === 'missing',
    _0x54e806 = _0x5ae9c7['classList']?.['contains']?.('needs-model-credential') === !![],
    _0x38191f = Boolean(_0x5ae9c7['querySelector']?.(CREDENTIAL_BADGE_SELECTOR));
  return _0x1beed7 ? _0x54e806 && _0x38191f : !_0x54e806 && !_0x38191f;
}
function applyMenuItemCredentialState(_0xbc5dc2, _0x5a6fad, _0x5a950e, _0x4cba44) {
  const _0x1e51b4 = getMenuItemCredentialStateSignature(_0x5a6fad, _0x5a950e);
  if (
    MODEL_CREDENTIAL_ITEM_SYNC_STATES['get'](_0xbc5dc2) === _0x1e51b4 &&
    hasExpectedMenuItemCredentialState(_0xbc5dc2, _0x5a6fad)
  )
    return;
  (clearMenuItemCredentialState(_0xbc5dc2),
    _0x5a950e && (_0xbc5dc2['dataset']['credentialResolvedProviderProfileId'] = _0x5a950e),
    _0x5a6fad?.['status'] === 'missing' && markMenuItemCredentialMissing(_0xbc5dc2, _0x5a6fad, _0x4cba44),
    MODEL_CREDENTIAL_ITEM_SYNC_STATES['set'](_0xbc5dc2, _0x1e51b4));
}
function getMenuItemProviderProfileId(_0x24ea54, _0x3bde76, _0x363d99, _0x4fe468, _0x29e511) {
  const _0x484325 =
      _0x29e511 !== undefined
        ? _0x29e511
        : _0x3bde76['getProviderProfileId']?.({ item: _0x24ea54, modelId: _0x363d99, providerId: _0x4fe468 }),
    _0x1e23b7 = _0x484325 || _0x24ea54['dataset']?.['providerProfileId'] || '',
    _0x3bef38 = getModelProviderProfileIds(_0x363d99);
  if (_0x3bef38['length'] === 0x0) return _0x1e23b7;
  if (_0x3bef38['length'] === 0x1) return _0x3bef38[0x0];
  return resolveReadyModelProviderProfileId(_0x363d99, _0x1e23b7, (_0x3466ac) => {
    const _0x566557 = getModelGenerationReadiness({
      modelId: _0x363d99,
      provider: _0x4fe468,
      providerProfileId: _0x3466ac,
    });
    if (_0x566557['status'] === 'loading') return null;
    return _0x566557['ready'];
  });
}
function getMenuCredentialSyncDescriptor(_0x1d4d46, _0x42f4d9) {
  const _0x4ca91a = [..._0x1d4d46['querySelectorAll'](CREDENTIAL_MENU_ITEM_SELECTOR)],
    _0x1eba5b = _0x42f4d9['windowObject'] || globalThis['window'],
    _0x46a008 = getCredentialStatusRevision(_0x1eba5b);
  if (_0x46a008 === null) return { cacheKey: null, items: _0x4ca91a };
  const _0x5207d3 = _0x42f4d9['getProviderProfileId'];
  if (
    typeof _0x5207d3 === 'function' &&
    _0x5207d3['length'] > 0x0 &&
    typeof _0x42f4d9['getCredentialSyncKey'] !== 'function'
  )
    return { cacheKey: null, items: _0x4ca91a };
  let _0x7c2d40 = '',
    _0x1a3900;
  try {
    const _0x226a1d = _0x5207d3?.();
    ((_0x7c2d40 = String(_0x226a1d || '')),
      (typeof _0x5207d3 !== 'function' || _0x5207d3['length'] === 0x0) && (_0x1a3900 = _0x7c2d40));
  } catch {
    return { cacheKey: null, items: _0x4ca91a };
  }
  const _0x5d5d47 = String(_0x42f4d9['getCredentialSyncKey']?.() || ''),
    _0x448a2f = _0x4ca91a['map']((_0x4dfe19) =>
      [
        _0x4dfe19['dataset']?.['credentialModel'] || '',
        _0x4dfe19['dataset']?.['value'] || '',
        _0x4dfe19['dataset']?.['provider'] || '',
        _0x4dfe19['dataset']?.['providerProfileId'] || '',
      ]['join']('\x1f'),
    )['join']('\x1e'),
    _0x5c3f1d = t('settings.apiInput.readiness.requiredShort');
  return {
    cacheKey: [
      _0x46a008,
      _0x7c2d40,
      _0x5d5d47,
      _0x5c3f1d,
      _0x448a2f,
      modelMenuPreferenceStore['getState']()['hideUnconfigured'],
    ]['join']('\x1d'),
    items: _0x4ca91a,
    sharedProviderProfileId: _0x1a3900,
  };
}
function isSameMenuCredentialSync(_0x18fa60, _0x58aa9e) {
  return Boolean(
    _0x18fa60 &&
    _0x18fa60['cacheKey'] === _0x58aa9e['cacheKey'] &&
    _0x18fa60['items']['length'] === _0x58aa9e['items']['length'] &&
    _0x58aa9e['items']['every']((_0x5c8a59, _0x1ffecc) => _0x18fa60['items'][_0x1ffecc] === _0x5c8a59),
  );
}
export function syncModelCredentialMenu(_0x3ae67e, _0x2a251e = {}) {
  if (!_0x3ae67e?.['querySelectorAll']) return;
  const _0x35af3f = () => {
    const _0x5439e3 = _0x2a251e['documentObject'] || globalThis['document'],
      _0x20dcf4 = getMenuCredentialSyncDescriptor(_0x3ae67e, _0x2a251e);
    syncModelMenuPrices(_0x3ae67e, _0x20dcf4['items']);
    const _0x143d36 = MODEL_CREDENTIAL_MENU_SYNC_STATES['get'](_0x3ae67e);
    if (_0x20dcf4['cacheKey'] !== null && isSameMenuCredentialSync(_0x143d36, _0x20dcf4))
      return _0x143d36['promise'];
    const _0x1eace8 = { cacheKey: _0x20dcf4['cacheKey'], items: _0x20dcf4['items'], promise: null };
    _0x20dcf4['cacheKey'] !== null
      ? MODEL_CREDENTIAL_MENU_SYNC_STATES['set'](_0x3ae67e, _0x1eace8)
      : MODEL_CREDENTIAL_MENU_SYNC_STATES['delete'](_0x3ae67e);
    const _0x25afb9 = () =>
      _0x20dcf4['cacheKey'] === null || MODEL_CREDENTIAL_MENU_SYNC_STATES['get'](_0x3ae67e) === _0x1eace8;
    return (
      (_0x1eace8['promise'] = Promise['resolve']()
        ['then'](() =>
          Promise['all'](
            _0x20dcf4['items']['map'](async (_0x3bce67) => {
              if (!_0x25afb9()) return;
              const { modelId: _0x139737, providerId: _0x38c422 } = getMenuItemCredentialContext(_0x3bce67),
                _0x52ab86 = {
                  modelId: _0x139737,
                  provider: _0x38c422,
                  providerProfileId: getMenuItemProviderProfileId(
                    _0x3bce67,
                    _0x2a251e,
                    _0x139737,
                    _0x38c422,
                    _0x20dcf4['sharedProviderProfileId'],
                  ),
                };
              let _0x5a4080 = getModelGenerationReadiness(_0x52ab86);
              _0x5a4080['reason'] === 'cli-status-loading' &&
                (_0x5a4080 = await ensureModelGenerationReadiness(_0x52ab86)['catch'](() => _0x5a4080));
              if (!_0x25afb9()) return;
              applyMenuItemCredentialState(_0x3bce67, _0x5a4080, _0x52ab86['providerProfileId'], _0x5439e3);
            }),
          ),
        )
        ['then'](() => {
          if (!_0x25afb9()) return MODEL_CREDENTIAL_MENU_SYNC_STATES['get'](_0x3ae67e)?.['promise'];
          syncModelMenuVisibility(_0x3ae67e, _0x20dcf4['items'], _0x2a251e);
        })),
      _0x1eace8['promise']
    );
  };
  if (isApiConfigLoaded()) return _0x35af3f();
  return ensureConfig()
    ['catch'](() => {})
    ['then'](_0x35af3f);
}
export function bindModelCredentialMenu(_0x3a9099, _0x708ac1 = {}) {
  if (!_0x3a9099?.['addEventListener']) return () => {};
  const _0x410313 = _0x708ac1['windowObject'] || globalThis['window'];
  getCredentialStatusRevision(_0x410313);
  const _0xb0aa64 = () => {
      void syncModelCredentialMenu(_0x3a9099, _0x708ac1);
    },
    _0xb32fe = (_0x5ec402) => {
      if (_0x708ac1['guardSelection'] === ![]) return;
      const _0x585412 = _0x5ec402['target']?.['closest']?.(CREDENTIAL_MENU_ITEM_SELECTOR);
      if (!_0x585412 || !_0x3a9099['contains']?.(_0x585412)) return;
      const { modelId: _0x537f21, providerId: _0x279f14 } = getMenuItemCredentialContext(_0x585412),
        _0x802c5c = getMenuItemProviderProfileId(_0x585412, _0x708ac1, _0x537f21, _0x279f14);
      _0x802c5c && (_0x585412['dataset']['credentialResolvedProviderProfileId'] = _0x802c5c);
      const _0x5071e2 = getModelGenerationReadiness({
        modelId: _0x537f21,
        provider: _0x279f14,
        providerProfileId: _0x802c5c,
      });
      if (_0x5071e2['status'] !== 'missing') return;
      (_0x5ec402['preventDefault']?.(),
        _0x5ec402['stopImmediatePropagation']?.(),
        _0x5ec402['stopPropagation']?.(),
        showMissingCredential(_0x5071e2));
    };
  _0x3a9099['addEventListener']('click', _0xb32fe, !![]);
  const _0x130bf7 =
    _0x708ac1['listenConfigChanges'] === ![]
      ? () => {}
      : bindModelCredentialStatusEvents(_0xb0aa64, _0x410313);
  return (
    _0xb0aa64(),
    () => {
      (_0x3a9099['removeEventListener']?.('click', _0xb32fe, !![]), _0x130bf7());
    }
  );
}
