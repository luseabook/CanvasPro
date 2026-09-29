import { openExternalLink } from '../../services/externalLinkService.js';
import { t } from '../../i18n/index.js';
import { registerManifestBundle, unregisterManifestBundle } from '../../manifests/index.js';
import { trackRuntimeManifestLoad } from '../../manifests/runtimeManifestReadiness.js';
import { CUSTOM_PROVIDER_VIP_MODEL_ID } from '../subscriptionAccess.js';
import {
  applyCustomProviderModelSelectionState,
  captureCustomProviderModelSelectionScroll,
  getCustomProviderModelActionState,
  getCustomProviderModelsBlockingSave,
  getCustomProviderSaveStatus,
  getRememberedCustomProviderConfigs,
  handleCustomProviderResultWheel,
  isCustomProviderAccessAllowed,
  isCustomProviderModelCapabilityRecognized,
  mergeCustomProviderDiscoveryCapabilities,
  mergeCustomProviderRecognizedProfiles,
  resolveCustomProviderDocumentationFailureKey,
  restoreCustomProviderModelSelectionScroll,
  scrollCustomProviderModelListFromWheel,
  stabilizeCustomProviderEditorListHeight,
} from './appTopbarCustomProviderPolicy.js';
import { createCustomProviderEditorShell } from './appTopbarCustomProviderPresentation.js';
import { createProviderStatusTooltipController } from './providerStatusTooltipController.js';
const PROVIDER_TEST_STATUS_CLASSES = [
    'settings-provider-status--testing',
    'settings-provider-status--success',
    'settings-provider-status--partial',
    'settings-provider-status--danger',
    'settings-provider-status--configured',
    'settings-provider-status--unconfigured',
  ],
  CUSTOM_PROVIDER_SELECTABLE_KINDS = ['text', 'image', 'video', 'audio'],
  CUSTOM_PROVIDER_FILTER_KINDS = ['all', ...CUSTOM_PROVIDER_SELECTABLE_KINDS, 'unknown'],
  CUSTOM_PROVIDER_KIND_LABEL_KEYS = {
    all: 'kindAll',
    text: 'kindText',
    image: 'kindImage',
    video: 'kindVideo',
    audio: 'kindAudio',
    embedding: 'kindEmbedding',
    unknown: 'kindUnknown',
  };
function trTemplate(_0x792cd, _0x3ebc52 = {}) {
  let _0x2669ab = t(_0x792cd);
  return (
    Object['entries'](_0x3ebc52 || {})['forEach'](([_0x5b9233, _0x4d5801]) => {
      _0x2669ab = _0x2669ab['split']('{' + _0x5b9233 + '}')['join'](String(_0x4d5801 ?? ''));
    }),
    _0x2669ab
  );
}
function trApiInput(_0x45e5df, _0x1a9122 = {}) {
  return trTemplate('settings.apiInput.' + _0x45e5df, _0x1a9122);
}
function trCustomProvider(_0x5c972f, _0xfc5df = {}) {
  return trApiInput('customProvider.' + _0x5c972f, _0xfc5df);
}
function markNonLoginTextInput(_0x4b1442) {
  if (!_0x4b1442) return;
  ((_0x4b1442['autocomplete'] = 'off'),
    _0x4b1442['setAttribute']('autocomplete', 'off'),
    _0x4b1442['setAttribute']('autocapitalize', 'off'),
    _0x4b1442['setAttribute']('spellcheck', 'false'),
    _0x4b1442['setAttribute']('data-form-type', 'other'));
}
function markApiSecretInput(_0x248302) {
  if (!_0x248302) return;
  ((_0x248302['autocomplete'] = 'new-password'),
    _0x248302['setAttribute']('autocomplete', 'new-password'),
    _0x248302['setAttribute']('autocapitalize', 'off'),
    _0x248302['setAttribute']('spellcheck', 'false'),
    _0x248302['setAttribute']('data-lpignore', 'true'),
    _0x248302['setAttribute']('data-1p-ignore', 'true'),
    _0x248302['setAttribute']('data-form-type', 'other'));
}
export function createCustomProviderOnboardingController({
  store: _0x2f1035,
  saveApiConfigToServer: _0x6ce60a,
  discoverCustomProvider: _0x37fad5,
  analyzeCustomProviderDocumentation: _0x4015c2,
  buildCustomProviderManifestDraft: _0x42e0f6,
  validateCustomProviderManifestDraft: _0x2071fc,
  saveCustomProviderManifestBundle: _0x48a2e5,
  listCustomProviderManifestBundles: _0x1f9b4a,
  deleteCustomProviderManifestBundle: _0x47c6df,
  refreshManifestModelNodeUis: _0x155da5,
  showError: showError = null,
  syncModelServiceReadinessSummary: syncModelServiceReadinessSummary = () => {},
  getConfigSnapshot: getConfigSnapshot = () => ({}),
  onConfigSnapshotChange: onConfigSnapshotChange = () => {},
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const _0x57a604 = documentObject,
    _0x4aef0b = windowObject;
  let _0x6cada3 = getConfigSnapshot() || {};
  const _0x3c8fad = createProviderStatusTooltipController(),
    _0x52560e = new Map();
  function _0x53ff29(_0x1d9aee) {
    ((_0x6cada3 = _0x1d9aee || {}), onConfigSnapshotChange(_0x6cada3));
  }
  function _0x1c4a39() {
    return {
      cardEl: _0x57a604['getElementById']('customProviderDiscoveryCard'),
      statusEl: _0x57a604['getElementById']('customProviderDiscoveryStatus'),
      editorListEl: _0x57a604['getElementById']('customProviderEditors'),
      addBtnEl: _0x57a604['getElementById']('btnCustomProviderAdd'),
      editorEl: _0x57a604['getElementById']('customProviderEditor'),
    };
  }
  const _0x1a7ae7 = {
    activeEditorId: 'custom-provider-editor-1',
    editorSequence: 0x1,
    editorStates: new Map(),
  };
  function _0x46a7d6() {
    const { editorListEl: _0x2c6162 } = _0x1c4a39();
    return Array['from'](_0x2c6162?.['querySelectorAll']?.('[data-custom-provider-editor-id]') || []);
  }
  function _0x20560a(_0x3cdbf9) {
    return {
      baseUrlEl:
        _0x3cdbf9?.['querySelector']?.('[data-custom-provider-base-url]') ||
        _0x57a604['getElementById']('customProviderBaseUrl'),
      apiKeyEl:
        _0x3cdbf9?.['querySelector']?.('[data-custom-provider-api-key]') ||
        _0x57a604['getElementById']('customProviderApiKey'),
      documentationUrlEl:
        _0x3cdbf9?.['querySelector']?.('[data-custom-provider-documentation-url]') ||
        _0x57a604['getElementById']('customProviderDocumentationUrl'),
      documentationFileEl:
        _0x3cdbf9?.['querySelector']?.('[data-custom-provider-documentation-file]') ||
        _0x57a604['querySelector'](
          '#customProviderDiscoveryCard\x20[data-custom-provider-documentation-file]',
        ),
    };
  }
  function _0x28893f(_0x52c47d) {
    return String(_0x52c47d?.['dataset']?.['customProviderEditorId'] || '')['trim']();
  }
  function _0x497e40(_0xd906c3) {
    const _0x38ba47 = _0x28893f(_0xd906c3);
    if (!_0x38ba47)
      return {
        discovery: null,
        provider: null,
        activeKindFilter: 'all',
        selectedModelKeys: new Set(),
        assignedModelKinds: new Map(),
        verifyingModelKeys: new Set(),
        isAddingModels: ![],
        documentationDocument: null,
        titleText: '',
        titleManuallyEdited: ![],
      };
    return (
      !_0x1a7ae7['editorStates']['has'](_0x38ba47) &&
        _0x1a7ae7['editorStates']['set'](_0x38ba47, {
          discovery: null,
          provider: null,
          activeKindFilter: 'all',
          selectedModelKeys: new Set(),
          assignedModelKinds: new Map(),
          verifyingModelKeys: new Set(),
          isAddingModels: ![],
          documentationDocument: null,
          titleText: '',
          titleManuallyEdited: ![],
        }),
      _0x1a7ae7['editorStates']['get'](_0x38ba47)
    );
  }
  function _0xf3935f(_0x1c59fd) {
    return {
      bodyEl: _0x1c59fd?.['querySelector']?.('[data-custom-provider-editor-body]'),
      tabBtnEl: _0x1c59fd?.['querySelector']?.('[data-custom-provider-editor-tab]'),
      deleteBtnEl: _0x1c59fd?.['querySelector']?.('[data-custom-provider-delete]'),
      discoverBtnEl: _0x1c59fd?.['querySelector']?.('[data-custom-provider-discover]'),
      resultEl: _0x1c59fd?.['querySelector']?.('[data-custom-provider-result]'),
      resultInnerEl: _0x1c59fd?.['querySelector']?.('[data-custom-provider-result-inner]'),
      actionsEl: _0x1c59fd?.['querySelector']?.('[data-custom-provider-actions]'),
      saveSelectedBtnEl: _0x1c59fd?.['querySelector']?.('[data-custom-provider-save-selected]'),
      verifyParamsBtnEl: _0x1c59fd?.['querySelector']?.('[data-custom-provider-verify-params]'),
    };
  }
  function _0x9855a8(_0xac29c7 = null) {
    const _0x4087a5 = _0x28893f(_0xac29c7) || _0x1a7ae7['activeEditorId'];
    _0x46a7d6()['forEach']((_0x4595f6) => {
      const _0x31a1ce = _0x28893f(_0x4595f6) === _0x4087a5,
        { bodyEl: _0x36749d, tabBtnEl: _0x2dc714 } = _0xf3935f(_0x4595f6);
      (_0x4595f6['classList']['toggle']('is-active', _0x31a1ce),
        _0x36749d &&
          ((_0x36749d['hidden'] = !_0x31a1ce),
          _0x36749d['setAttribute']('aria-hidden', _0x31a1ce ? 'false' : 'true')),
        _0x2dc714 && _0x2dc714['setAttribute']('aria-selected', _0x31a1ce ? 'true' : 'false'));
    });
  }
  function _0x3719ed(_0x4aa359, _0x508b86 = {}) {
    if (!_0x4aa359) return;
    const _0x4af59c = String(_0x4aa359['dataset']['customProviderEditorId'] || '')['trim']();
    if (!_0x4af59c) return;
    const _0x37e1e9 = _0x1a7ae7['activeEditorId'] !== _0x4af59c,
      { editorListEl: _0x326932 } = _0x1c4a39();
    (stabilizeCustomProviderEditorListHeight(_0x326932),
      (_0x1a7ae7['activeEditorId'] = _0x4af59c),
      _0x9855a8(_0x4aa359),
      stabilizeCustomProviderEditorListHeight(_0x326932));
    if (_0x37e1e9 || _0x508b86['clearStatus']) _0x3c5eb6('', '');
  }
  function _0x36ce14() {
    const _0x4145a0 = _0x46a7d6(),
      _0x4ee989 = _0x4145a0['find'](
        (_0x1b0b89) =>
          String(_0x1b0b89['dataset']['customProviderEditorId'] || '') === _0x1a7ae7['activeEditorId'],
      );
    return (
      _0x4ee989 ||
      _0x4145a0['find']((_0x539c14) => _0x539c14['classList']['contains']('is-active')) ||
      _0x4145a0[0x0] ||
      null
    );
  }
  function _0x2ade32() {
    return _0x20560a(_0x36ce14());
  }
  function _0x398959(_0x31bf22) {
    const _0x417e5c = String(_0x31bf22 || '')['trim']();
    return _0x417e5c ? 'custom-provider:' + _0x417e5c : '';
  }
  function _0x59e3a6(_0x2e09de) {
    return _0x52560e['get'](_0x398959(_0x2e09de)) || null;
  }
  function _0x59b32b(_0x548173) {
    const _0x2247d3 = _0x497e40(_0x548173),
      _0x4e2378 = String(_0x2247d3['provider']?.['providerId'] || '')['trim']();
    if (_0x4e2378) return _0x4e2378;
    return String(_0x48eb16(_0x548173)['providerId'] || '')['trim']();
  }
  function _0x356937(_0x469061) {
    const _0x2f57f1 = _0x59b32b(_0x469061);
    if (!_0x2f57f1) return ![];
    const _0x5468e5 = _0x497e40(_0x469061),
      _0x52d571 = _0x398959(_0x2f57f1);
    return !!_0x5468e5['provider'] || _0x52560e['has'](_0x52d571);
  }
  function _0x19eead(_0x1e5403) {
    return String(_0x1e5403 || '')
      ['trim']()
      ['replace'](/\s+/g, '\x20');
  }
  function _0x5ec5d0(_0x4dad29) {
    const _0x476d73 = _0x46a7d6(),
      _0x2a58c3 = Math['max'](0x0, _0x476d73['indexOf'](_0x4dad29));
    return trCustomProvider('providerDraftTitle', { index: _0x2a58c3 + 0x1 });
  }
  function _0x9ea563(_0x36e232) {
    const _0x4dde7e = _0x497e40(_0x36e232);
    return _0x19eead(_0x4dde7e['titleText']) || _0x5ec5d0(_0x36e232);
  }
  function _0x5be417(_0x5ab038) {
    const _0x453fe8 = _0x5ab038?.['querySelector']?.('[data-custom-provider-editor-title]'),
      _0x123b4c = _0x5ab038?.['querySelector']?.('[data-custom-provider-editor-tab]'),
      _0x25f5ea = _0x9ea563(_0x5ab038);
    (_0x453fe8 && (_0x453fe8['removeAttribute']('data-i18n'), (_0x453fe8['textContent'] = _0x25f5ea)),
      _0x123b4c?.['setAttribute']('aria-label', _0x25f5ea));
  }
  function _0x5d62c5() {
    _0x46a7d6()['forEach']((_0x2e5c9d) => {
      _0x5be417(_0x2e5c9d);
    });
  }
  function _0x421be2(_0x43e207, _0x3adbbb, _0xfad0d5 = {}) {
    if (!_0x43e207) return;
    const _0x5193d9 = _0x497e40(_0x43e207),
      _0xdccfab = _0x19eead(_0x3adbbb);
    _0x5193d9['titleText'] = _0xdccfab;
    if (_0xfad0d5['manual'] === !![]) _0x5193d9['titleManuallyEdited'] = !![];
    else _0xfad0d5['manual'] === ![] && (_0x5193d9['titleManuallyEdited'] = ![]);
    _0x5be417(_0x43e207);
  }
  function _0xb8cb4c(_0xd8d4d5) {
    if (!_0xd8d4d5) return;
    const _0x428221 = _0x497e40(_0xd8d4d5);
    ((_0x428221['titleText'] = ''), (_0x428221['titleManuallyEdited'] = ![]), _0x5be417(_0xd8d4d5));
  }
  function _0x36d676(_0xda21c4, _0x59af20) {
    if (!_0xda21c4) return;
    const _0x2e02ee = _0x497e40(_0xda21c4);
    if (_0x2e02ee['titleManuallyEdited']) return;
    const _0x8eea5c = _0x19eead(_0x59af20);
    if (!_0x8eea5c) return;
    ((_0x2e02ee['titleText'] = _0x8eea5c), _0x5be417(_0xda21c4));
  }
  function _0x12d823(_0x7576d8) {
    if (!_0x7576d8) return;
    const { tabBtnEl: _0x4ca232, deleteBtnEl: _0x5ae764 } = _0xf3935f(_0x7576d8);
    if (!_0x4ca232 || _0x7576d8['querySelector']('[data-custom-provider-editor-title-input]')) return;
    const _0x4d0d1c = _0x497e40(_0x7576d8),
      _0x3ddd40 = _0x4d0d1c['titleText'],
      _0x54230d = !!_0x4d0d1c['titleManuallyEdited'],
      _0x183c6c = _0x9ea563(_0x7576d8),
      _0x1cc6ec = _0x57a604['createElement']('input');
    ((_0x1cc6ec['type'] = 'text'),
      (_0x1cc6ec['className'] = 'custom-provider-editor-title-input'),
      (_0x1cc6ec['dataset']['customProviderEditorTitleInput'] = ''),
      (_0x1cc6ec['value'] = _0x183c6c),
      _0x1cc6ec['setAttribute']('aria-label', _0x183c6c));
    let _0x62f751 = ![];
    const _0x1154ba = (_0x58db37) => {
      if (_0x62f751) return;
      ((_0x62f751 = !![]),
        _0x1cc6ec['removeEventListener']('blur', _0x51e368),
        _0x1cc6ec['removeEventListener']('keydown', _0x361561));
      if (_0x58db37) {
        const _0x108a1b = _0x19eead(_0x1cc6ec['value']);
        _0x108a1b
          ? _0x54230d || _0x108a1b !== _0x183c6c
            ? _0x421be2(_0x7576d8, _0x108a1b, { manual: !![] })
            : ((_0x4d0d1c['titleText'] = _0x3ddd40),
              (_0x4d0d1c['titleManuallyEdited'] = _0x54230d),
              _0x5be417(_0x7576d8))
          : ((_0x4d0d1c['titleText'] = _0x3ddd40),
            (_0x4d0d1c['titleManuallyEdited'] = _0x54230d),
            _0x5be417(_0x7576d8));
      } else
        ((_0x4d0d1c['titleText'] = _0x3ddd40),
          (_0x4d0d1c['titleManuallyEdited'] = _0x54230d),
          _0x5be417(_0x7576d8));
      ((_0x4ca232['hidden'] = ![]), _0x1cc6ec['remove'](), _0x4ca232['focus']?.());
    };
    function _0x51e368() {
      _0x1154ba(!![]);
    }
    function _0x361561(_0xb45205) {
      if (_0xb45205['key'] === 'Enter') (_0xb45205['preventDefault'](), _0x1154ba(!![]));
      else _0xb45205['key'] === 'Escape' && (_0xb45205['preventDefault'](), _0x1154ba(![]));
    }
    (_0x1cc6ec['addEventListener']('blur', _0x51e368),
      _0x1cc6ec['addEventListener']('keydown', _0x361561),
      (_0x4ca232['hidden'] = !![]),
      _0x4ca232['parentElement']?.['insertBefore'](_0x1cc6ec, _0x5ae764 || _0x4ca232['nextSibling']),
      _0x1cc6ec['focus']?.(),
      _0x1cc6ec['select']?.());
  }
  function _0x185155() {
    const _0x4d44be = _0x46a7d6();
    _0x4d44be['forEach']((_0x2d2940) => {
      const { deleteBtnEl: _0x5d6039 } = _0xf3935f(_0x2d2940);
      if (_0x5d6039) _0x5d6039['hidden'] = _0x4d44be['length'] <= 0x1 && !_0x356937(_0x2d2940);
    });
  }
  function _0x52f7f5(_0x124883) {
    const _0x42cd99 = _0x46a7d6();
    if (!_0x124883 || _0x42cd99['length'] <= 0x1) return;
    const _0x131360 = _0x28893f(_0x124883),
      _0x40c0b4 = _0x42cd99['indexOf'](_0x124883),
      _0x2ef036 = _0x42cd99[_0x40c0b4 + 0x1] || _0x42cd99[_0x40c0b4 - 0x1] || null;
    (_0x1a7ae7['editorStates']['delete'](_0x131360),
      _0x124883['remove'](),
      _0x5d62c5(),
      _0x185155(),
      _0x2ef036 && _0x3719ed(_0x2ef036, { clearStatus: !![] }));
  }
  async function _0x522024(_0x5b8cd5) {
    if (typeof _0x6ce60a !== 'function') return;
    const _0x26df45 = String(_0x5b8cd5 || '')['trim']();
    if (!_0x26df45 || !_0x6cada3?.['providers']?.[_0x26df45]) return;
    const _0xc19a47 = { ...(_0x6cada3['providers'] || {}) };
    delete _0xc19a47[_0x26df45];
    const _0x32654d = { ...(_0x6cada3 || {}), providers: _0xc19a47 };
    (await _0x6ce60a(_0x32654d),
      _0x53ff29(_0x32654d),
      syncModelServiceReadinessSummary(_0x32654d),
      _0x155da5?.());
  }
  async function _0x2be850(_0x4289ad) {
    const _0x1e581d = String(_0x4289ad || '')['trim']();
    if (!_0x1e581d) return;
    const _0x41822f = _0x398959(_0x1e581d),
      _0x3ca115 = _0x52560e['get'](_0x41822f);
    if (typeof _0x47c6df === 'function' && _0x41822f)
      try {
        await _0x47c6df(_0x41822f);
      } catch (_0x5ada3f) {
        const _0x492181 = String(_0x5ada3f?.['message'] || _0x5ada3f || '')['toLowerCase']();
        if (!_0x492181['includes']('not found') && !_0x492181['includes']('404')) throw _0x5ada3f;
      }
    if (_0x3ca115) {
      try {
        unregisterManifestBundle(_0x3ca115);
      } catch (_0x5cdf12) {
        console['warn']('[Custom Provider] unregister deleted bundle failed:', _0x5cdf12);
      }
      _0x52560e['delete'](_0x41822f);
    }
    await _0x522024(_0x1e581d);
  }
  function _0x1b364f(_0x2430da) {
    const {
      baseUrlEl: _0x586704,
      apiKeyEl: _0x1d68b4,
      documentationUrlEl: _0x10516c,
      documentationFileEl: _0x59caac,
    } = _0x20560a(_0x2430da);
    if (_0x586704) _0x586704['value'] = '';
    if (_0x1d68b4) _0x1d68b4['value'] = '';
    if (_0x10516c) _0x10516c['value'] = '';
    if (_0x59caac) _0x59caac['value'] = '';
    ((_0x497e40(_0x2430da)['documentationDocument'] = null),
      _0x2430da?.['dataset'] &&
        (delete _0x2430da['dataset']['customProviderProviderId'],
        delete _0x2430da['dataset']['customProviderSyncedBundle']),
      _0x4a601d(_0x2430da),
      _0xb8cb4c(_0x2430da),
      _0x3c5eb6('', ''));
  }
  async function _0x50732f(_0x5d48d8, _0x48247c) {
    if (!_0x5d48d8) return;
    const _0x5a5b4c = _0x356937(_0x5d48d8),
      _0x437ffe = _0x5a5b4c ? _0x59b32b(_0x5d48d8) : '';
    if (_0x48247c) _0x48247c['disabled'] = !![];
    try {
      _0x5a5b4c && (await _0x2be850(_0x437ffe));
      const _0x2f1552 = _0x46a7d6();
      _0x2f1552['length'] <= 0x1
        ? (_0x1b364f(_0x5d48d8), _0x5d62c5(), _0x185155(), _0x3719ed(_0x5d48d8, { clearStatus: !![] }))
        : _0x52f7f5(_0x5d48d8);
      if (_0x437ffe) {
        const _0x512fbf = trCustomProvider('deleteSuccess'),
          _0x1fa542 = getRememberedCustomProviderConfigs(_0x6cada3?.['providers'])['length']
            ? 'configured'
            : 'unconfigured';
        (_0x3c5eb6(_0x1fa542, trApiInput('statuses.' + _0x1fa542)),
          _0x4aef0b['showToast']?.(_0x512fbf, 'success'));
      }
    } catch (_0x168abb) {
      const _0x3ddfa3 = trCustomProvider('deleteFailed', {
        error: _0x168abb?.['message'] || trApiInput('diagnostics.unknownError'),
      });
      (_0x3c5eb6('danger', trApiInput('diagnostics.failed'), _0x3ddfa3),
        _0x4aef0b['showToast']?.(_0x3ddfa3, 'error', 0x2328));
    } finally {
      if (_0x48247c) _0x48247c['disabled'] = ![];
    }
  }
  function _0x452c68() {
    const _0x3a984f = 'custom-provider-editor-' + (_0x1a7ae7['editorSequence'] + 0x1);
    _0x1a7ae7['editorSequence'] += 0x1;
    const _0x3ff8ef = createCustomProviderEditorShell({
        documentObject: _0x57a604,
        editorId: _0x3a984f,
        tutorialLabel: trCustomProvider('tutorial'),
        discoverLabel: trCustomProvider('discover'),
        deleteAriaLabel: trCustomProvider('deleteProviderDraft'),
      }),
      _0x222813 = _0x57a604['createElement']('div');
    ((_0x222813['className'] = 'custom-provider-editor-item-body'),
      (_0x222813['dataset']['customProviderEditorBody'] = ''),
      (_0x222813['hidden'] = !![]),
      _0x222813['setAttribute']('aria-hidden', 'true'));
    const _0x4f0110 = _0x57a604['createElement']('div');
    _0x4f0110['className'] = 'custom-provider-discovery-grid';
    const _0x5d6778 = _0x57a604['createElement']('div');
    _0x5d6778['className'] = 'custom-provider-discovery-field custom-provider-discovery-field--wide';
    const _0x30df3e = _0x2cb1d0('settings-label', trCustomProvider('baseUrl')),
      _0x381104 = _0x57a604['createElement']('input');
    ((_0x381104['type'] = 'text'),
      (_0x381104['className'] = 'settings-input'),
      (_0x381104['placeholder'] = trCustomProvider('baseUrlPlaceholder')),
      (_0x381104['dataset']['customProviderBaseUrl'] = ''),
      markNonLoginTextInput(_0x381104),
      _0x5d6778['append'](_0x30df3e, _0x381104));
    const _0x518bc5 = _0x57a604['createElement']('div');
    _0x518bc5['className'] = 'custom-provider-discovery-field custom-provider-discovery-field--wide';
    const _0x808fa = _0x2cb1d0('settings-label', trCustomProvider('apiKey')),
      _0x21a33c = _0x57a604['createElement']('input');
    ((_0x21a33c['type'] = 'password'),
      (_0x21a33c['className'] = 'settings-input'),
      (_0x21a33c['placeholder'] = trCustomProvider('apiKeyPlaceholder')),
      (_0x21a33c['dataset']['customProviderApiKey'] = ''),
      markApiSecretInput(_0x21a33c),
      _0x518bc5['append'](_0x808fa, _0x21a33c));
    const _0x8dfac8 = _0x57a604['createElement']('div');
    _0x8dfac8['className'] = 'custom-provider-discovery-field custom-provider-discovery-field--wide';
    const _0x5034d8 = _0x2cb1d0('settings-label', trCustomProvider('documentationUrl'));
    _0x5034d8['append'](_0x19d150(trCustomProvider('documentationAgentHint')));
    const _0x3e3e4f = _0x57a604['createElement']('input');
    ((_0x3e3e4f['type'] = 'text'),
      (_0x3e3e4f['className'] = 'settings-input'),
      (_0x3e3e4f['placeholder'] = trCustomProvider('documentationUrlPlaceholder')),
      (_0x3e3e4f['dataset']['customProviderDocumentationUrl'] = ''),
      markNonLoginTextInput(_0x3e3e4f));
    const _0x346215 = _0x57a604['createElement']('div');
    _0x346215['className'] = 'custom-provider-documentation-input-row';
    const _0x74277f = _0x57a604['createElement']('button');
    ((_0x74277f['type'] = 'button'),
      (_0x74277f['className'] =
        'settings-save-btn settings-btn-ghost custom-provider-documentation-file-btn'),
      (_0x74277f['dataset']['customProviderSelectDocument'] = ''),
      (_0x74277f['textContent'] = trCustomProvider('selectDocumentationFile')));
    const _0x21ce16 = _0x57a604['createElement']('input');
    ((_0x21ce16['type'] = 'file'),
      (_0x21ce16['hidden'] = !![]),
      (_0x21ce16['accept'] = '.md,.txt,.json,.yaml,.yml,.html,.htm'),
      (_0x21ce16['dataset']['customProviderDocumentationFile'] = ''),
      _0x346215['append'](_0x3e3e4f, _0x74277f, _0x21ce16),
      _0x8dfac8['append'](_0x5034d8, _0x346215),
      _0x4f0110['append'](_0x5d6778, _0x518bc5, _0x8dfac8));
    const _0x1cbbe5 = _0x57a604['createElement']('div');
    ((_0x1cbbe5['className'] = 'custom-provider-discovery-result'),
      (_0x1cbbe5['dataset']['customProviderResult'] = ''),
      (_0x1cbbe5['hidden'] = !![]),
      _0x1cbbe5['setAttribute']('aria-hidden', 'true'));
    const _0x5c159d = _0x57a604['createElement']('div');
    ((_0x5c159d['className'] = 'custom-provider-discovery-result-inner'),
      (_0x5c159d['dataset']['customProviderResultInner'] = ''),
      _0x1cbbe5['append'](_0x5c159d));
    const _0x295a85 = _0x57a604['createElement']('div');
    ((_0x295a85['className'] = 'custom-provider-discovery-actions'),
      (_0x295a85['dataset']['customProviderActions'] = ''),
      (_0x295a85['hidden'] = !![]));
    const _0x2e1bfe = _0x57a604['createElement']('button');
    ((_0x2e1bfe['type'] = 'button'),
      (_0x2e1bfe['className'] = 'settings-save-btn settings-btn-ghost settings-api-test-btn'),
      (_0x2e1bfe['dataset']['customProviderVerifyParams'] = ''));
    const _0x2dc382 = _0x57a604['querySelector']('[data-provider-test]\x20.settings-btn-icon')?.['cloneNode'](
      !![],
    );
    if (_0x2dc382) _0x2e1bfe['append'](_0x2dc382);
    const _0x34751c = _0x57a604['createElement']('span');
    ((_0x34751c['className'] = 'settings-btn-label'),
      (_0x34751c['dataset']['i18n'] = 'settings.apiInput.customProvider.verifyParameters'),
      (_0x34751c['textContent'] = trCustomProvider('verifyParameters')),
      _0x2e1bfe['append'](_0x34751c),
      (_0x2e1bfe['hidden'] = !![]),
      (_0x2e1bfe['disabled'] = !![]));
    const _0x3af573 = _0x57a604['createElement']('button');
    return (
      (_0x3af573['type'] = 'button'),
      (_0x3af573['className'] = 'settings-save-btn'),
      (_0x3af573['dataset']['customProviderSaveSelected'] = ''),
      (_0x3af573['dataset']['i18n'] = 'settings.apiInput.customProvider.saveModels'),
      (_0x3af573['textContent'] = trCustomProvider('saveModels')),
      (_0x3af573['hidden'] = !![]),
      (_0x3af573['disabled'] = !![]),
      _0x295a85['append'](_0x2e1bfe, _0x3af573),
      _0x222813['append'](_0x4f0110, _0x1cbbe5, _0x295a85),
      _0x3ff8ef['append'](_0x222813),
      _0x3ff8ef
    );
  }
  function _0x41d77f() {
    const _0x403065 = _0x46a7d6();
    (_0x403065['forEach']((_0x160cad, _0x2f050f) => {
      !_0x160cad['dataset']['customProviderEditorId'] &&
        (_0x160cad['dataset']['customProviderEditorId'] = 'custom-provider-editor-' + (_0x2f050f + 0x1));
      const _0x4141ee = String(_0x160cad['dataset']['customProviderEditorId'] || '')['match'](/(\d+)$/);
      _0x4141ee &&
        (_0x1a7ae7['editorSequence'] = Math['max'](
          _0x1a7ae7['editorSequence'],
          Number(_0x4141ee[0x1]) || 0x1,
        ));
    }),
      _0x3719ed(_0x36ce14() || _0x403065[0x0]),
      _0x5d62c5(),
      _0x185155(),
      _0x9855a8(_0x36ce14()));
  }
  function _0x24833d(_0x2845e3) {
    const _0x46768c = String(_0x2845e3 || '')['trim']();
    if (!_0x46768c) return '';
    if (/^[a-z][a-z0-9+.-]*:\/\//i['test'](_0x46768c)) return _0x46768c;
    return 'https://' + _0x46768c;
  }
  function _0xca085d(_0x524689) {
    const _0x2ad7db = _0x24833d(_0x524689);
    if (!_0x2ad7db) return '';
    try {
      return new URL(_0x2ad7db)['hostname']['replace'](/^www\./i, '');
    } catch {
      return String(_0x524689 || '')
        ['trim']()
        ['replace'](/^[a-z][a-z0-9+.-]*:\/\//i, '')
        ['split'](/[/?#]/)[0x0]
        ['replace'](/^www\./i, '');
    }
  }
  function _0xe860e0(_0x41ff96) {
    return _0xca085d(_0x41ff96) || '';
  }
  function _0x2620dc(_0x268af9) {
    const _0x224cad = (_0xca085d(_0x268af9) || String(_0x268af9 || '')['trim']())['toLowerCase'](),
      _0x2a99b6 = _0x224cad['replace'](/[^a-z0-9_-]+/g, '_')
        ['replace'](/^_+|_+$/g, '')
        ['replace'](/_{2,}/g, '_'),
      _0x175b82 = _0x2a99b6 || 'provider';
    return _0x175b82['startsWith']('custom_') ? _0x175b82 : 'custom_' + _0x175b82;
  }
  function _0x13c697(_0x28d167) {
    const _0x42f1ab = _0x497e40(_0x28d167),
      _0x5f0ebe = String(_0x42f1ab['provider']?.['providerId'] || '')['trim']();
    if (_0x5f0ebe) return _0x5f0ebe;
    const _0x3ee5fb = _0x48eb16(_0x28d167);
    return _0x3ee5fb['baseUrl'] ? String(_0x3ee5fb['providerId'] || '')['trim']() : '';
  }
  function _0x2b52a8(_0x468ff5, _0x3921fb) {
    const _0x51e439 = String(_0x3921fb || '')['trim']();
    if (!_0x51e439) return ![];
    return _0x46a7d6()['some']((_0x3849d8) => _0x3849d8 !== _0x468ff5 && _0x13c697(_0x3849d8) === _0x51e439);
  }
  function _0x2146a9(_0x4c344f, _0x39ddbe) {
    if (!_0x2b52a8(_0x4c344f, _0x39ddbe)) return ![];
    const _0x2697fb = trCustomProvider('duplicateProviderDomain'),
      { baseUrlEl: _0x31d7c1 } = _0x20560a(_0x4c344f);
    return (
      _0x3c5eb6('danger', trApiInput('diagnostics.failed'), _0x2697fb),
      _0x4aef0b['showToast']?.(_0x2697fb, 'warn', 0x1b58),
      _0x31d7c1?.['focus']?.(),
      !![]
    );
  }
  function _0x2a7b4a(_0x23c3c8) {
    const _0x596fa0 = String(_0x23c3c8 || 'unknown')
        ['trim']()
        ['toLowerCase'](),
      _0x318bc1 = CUSTOM_PROVIDER_KIND_LABEL_KEYS[_0x596fa0] || CUSTOM_PROVIDER_KIND_LABEL_KEYS['unknown'];
    return trCustomProvider(_0x318bc1);
  }
  function _0x5975b0(_0x884823) {
    return String(_0x884823 || '')
      ['trim']()
      ['toLowerCase']() === 'documented'
      ? trCustomProvider('capabilityDocumented')
      : trCustomProvider('capabilityUnverified');
  }
  function _0x1ef0cf(_0x1ab269) {
    return String(_0x1ab269 || '')
      ['trim']()
      ['toLowerCase']() === 'documented'
      ? trCustomProvider('capabilityDocumentedHint')
      : trCustomProvider('capabilityUnverifiedHint');
  }
  function _0x3c5eb6(_0x1c2653, _0x19cad0, _0x3a00b9 = '') {
    const { statusEl: _0x21cce5 } = _0x1c4a39();
    if (!_0x21cce5) return;
    (_0x3c8fad['bind'](_0x21cce5), _0x21cce5['classList']['remove'](...PROVIDER_TEST_STATUS_CLASSES));
    const _0x4ee257 = String(_0x19cad0 || '')['trim']();
    if (!_0x4ee257) {
      (_0x3c8fad['hide'](_0x21cce5),
        (_0x21cce5['hidden'] = !![]),
        (_0x21cce5['textContent'] = ''),
        delete _0x21cce5['dataset']['detail'],
        _0x21cce5['removeAttribute']('title'),
        _0x21cce5['removeAttribute']('aria-label'),
        _0x21cce5['removeAttribute']('tabindex'),
        _0x21cce5['removeAttribute']('data-provider-test-tooltip'));
      return;
    }
    const _0x5c074f = String(_0x1c2653 || '')['trim']();
    _0x5c074f && _0x21cce5['classList']['add']('settings-provider-status--' + _0x5c074f);
    _0x21cce5['textContent'] = _0x4ee257;
    const _0x1f4a29 = String(_0x3a00b9 || '')['trim']();
    (_0x1f4a29
      ? ((_0x21cce5['dataset']['detail'] = _0x1f4a29),
        _0x21cce5['setAttribute']('data-provider-test-tooltip', _0x1f4a29),
        _0x21cce5['setAttribute']('aria-label', _0x1f4a29),
        _0x21cce5['setAttribute']('tabindex', '0'))
      : (_0x3c8fad['hide'](_0x21cce5),
        delete _0x21cce5['dataset']['detail'],
        _0x21cce5['removeAttribute']('data-provider-test-tooltip'),
        _0x21cce5['removeAttribute']('aria-label'),
        _0x21cce5['removeAttribute']('tabindex')),
      _0x21cce5['removeAttribute']('title'),
      (_0x21cce5['hidden'] = ![]));
  }
  function _0x344b2d(_0x49b4d9, _0x512ae6) {
    if (!_0x49b4d9) return () => {};
    const _0x17ba6b = _0x49b4d9['querySelector']?.('.settings-btn-label'),
      _0x3475d1 = _0x17ba6b?.['textContent'] || _0x49b4d9['textContent'];
    _0x49b4d9['disabled'] = !![];
    if (_0x17ba6b) _0x17ba6b['textContent'] = _0x512ae6;
    else _0x49b4d9['textContent'] = _0x512ae6;
    return () => {
      _0x49b4d9['disabled'] = ![];
      if (_0x17ba6b) _0x17ba6b['textContent'] = _0x3475d1;
      else _0x49b4d9['textContent'] = _0x3475d1;
    };
  }
  function _0x2478df(_0x36a751) {
    const _0x1112ae = String(_0x36a751 || '')
      ['trim']()
      ['toLowerCase']()
      ['match'](/(\.[^.]+)$/);
    return _0x1112ae?.[0x1] || '';
  }
  function _0x48a605(_0xde70fd) {
    const _0x1f5ac4 = _0x497e40(_0xde70fd);
    _0x1f5ac4['documentationDocument'] = null;
    const { documentationFileEl: _0x2a7b25 } = _0x20560a(_0xde70fd);
    if (_0x2a7b25) _0x2a7b25['value'] = '';
  }
  async function _0x39dda3(_0x29d892, _0x46a5a8) {
    const _0x274689 = _0x46a5a8?.['files']?.[0x0];
    if (!_0x29d892 || !_0x274689) return;
    const _0x2de531 = _0x497e40(_0x29d892);
    ((_0x2de531['parameterDraft'] = null),
      (_0x2de531['recognitionInvalidated'] = !![]),
      _0x4f74b3(_0x29d892));
    const _0x53c51a = _0x2478df(_0x274689['name']);
    if (!CUSTOM_PROVIDER_DOCUMENTATION_EXTENSIONS['has'](_0x53c51a)) {
      (_0x48a605(_0x29d892),
        _0x4aef0b['showToast']?.(trCustomProvider('localDocumentationUnsupported'), 'warn'));
      return;
    }
    if (Number(_0x274689['size'] || 0x0) > CUSTOM_PROVIDER_DOCUMENTATION_MAX_BYTES) {
      (_0x48a605(_0x29d892),
        _0x4aef0b['showToast']?.(trCustomProvider('localDocumentationTooLarge'), 'warn'));
      return;
    }
    try {
      const _0x197959 = await _0x274689['text'](),
        _0x327161 = _0x497e40(_0x29d892);
      _0x327161['documentationDocument'] = {
        name: String(_0x274689['name'] || '')['trim'](),
        contentType: String(_0x274689['type'] || '')['trim'](),
        text: _0x197959,
      };
      const { documentationUrlEl: _0x1906fe } = _0x20560a(_0x29d892);
      _0x1906fe &&
        (_0x1906fe['value'] = trCustomProvider('localDocumentationSelected', { name: _0x274689['name'] }));
    } catch (_0x573d6d) {
      (_0x48a605(_0x29d892),
        _0x4aef0b['showToast']?.(
          trCustomProvider('localDocumentationReadFailed', {
            error: _0x573d6d?.['message'] || trApiInput('diagnostics.unknownError'),
          }),
          'error',
        ));
    }
  }
  function _0x48eb16(_0xbe1f75 = _0x36ce14()) {
    const { baseUrlEl: _0x5d0dab, apiKeyEl: _0x12ec62, documentationUrlEl: _0x463cf6 } = _0x20560a(_0xbe1f75),
      _0x14f577 = _0x24833d(_0x5d0dab?.['value']),
      _0x557fa3 = String(_0x12ec62?.['value'] || '')['trim'](),
      _0x1f3376 = _0x497e40(_0xbe1f75),
      _0x3552ee = _0x1f3376['documentationDocument'],
      _0x4e7de7 = _0x3552ee ? '' : String(_0x463cf6?.['value'] || '')['trim'](),
      _0x3809a4 = _0xe860e0(_0x14f577),
      _0x33d046 = _0x2620dc(_0x14f577);
    return {
      name: _0x3809a4,
      providerId: _0x33d046,
      baseUrl: _0x14f577,
      apiKey: _0x557fa3,
      documentationUrl: _0x4e7de7,
      documentationDocument: _0x3552ee,
    };
  }
  function _0x16ad8f(_0x3bdddd = {}) {
    const { baseUrlEl: _0x186e35, apiKeyEl: _0x37c203 } = _0x20560a(_0x46a7d6()[0x0]),
      _0xbacbd9 = _0x3bdddd?.['openai'] || {};
    (_0x186e35 &&
      !String(_0x186e35['value'] || '')['trim']() &&
      _0xbacbd9['apiUrl'] &&
      (_0x186e35['value'] = _0xbacbd9['apiUrl']),
      _0x37c203 &&
        !String(_0x37c203['value'] || '')['trim']() &&
        _0xbacbd9['apiKey'] &&
        (_0x37c203['value'] = _0xbacbd9['apiKey']));
  }
  function _0x2cb1d0(_0x38fed9, _0x2ed30e) {
    const _0x41ffdf = _0x57a604['createElement']('div');
    return (
      (_0x41ffdf['className'] = _0x38fed9),
      (_0x41ffdf['textContent'] = String(_0x2ed30e || '')),
      _0x41ffdf
    );
  }
  function _0x19d150(_0x3e14b3) {
    const _0x5cd574 = String(_0x3e14b3 || '')['trim'](),
      _0x5d76e5 = _0x57a604['createElement']('button');
    return (
      (_0x5d76e5['type'] = 'button'),
      (_0x5d76e5['className'] = 'custom-provider-info-tip'),
      _0x5d76e5['setAttribute']('aria-label', _0x5cd574),
      (_0x5d76e5['textContent'] = '!'),
      (_0x5d76e5['dataset']['tooltip'] = _0x5cd574),
      _0x5d76e5
    );
  }
  function _0x521f6b(_0x26468f = {}) {
    return String(_0x26468f?.['upstreamModelId'] || '')['trim']();
  }
  function _0x22be64(_0x1428cd = {}) {
    const _0x45dce6 = [
        ...(Array['isArray'](_0x1428cd?.['models']) ? _0x1428cd['models'] : []),
        ...(Array['isArray'](_0x1428cd?.['unknown']) ? _0x1428cd['unknown'] : []),
      ],
      _0x3c6ff5 = new Set();
    return _0x45dce6['filter']((_0x399dcc) => {
      const _0x5c9c00 = _0x521f6b(_0x399dcc);
      if (!_0x5c9c00 || _0x3c6ff5['has'](_0x5c9c00)) return ![];
      return (_0x3c6ff5['add'](_0x5c9c00), !![]);
    });
  }
  function _0x49ff66(_0x294a48, _0x47760a = {}) {
    const _0x2c30b1 = String(_0x47760a?.['kind'] || 'unknown')
      ['trim']()
      ['toLowerCase']();
    if (CUSTOM_PROVIDER_SELECTABLE_KINDS['includes'](_0x2c30b1)) return _0x2c30b1;
    const _0x268fc0 = _0x497e40(_0x294a48)['assignedModelKinds']['get'](_0x521f6b(_0x47760a));
    return CUSTOM_PROVIDER_SELECTABLE_KINDS['includes'](_0x268fc0) ? _0x268fc0 : 'unknown';
  }
  function _0x5f0f95(_0x5ea319, _0x28e922 = []) {
    return (Array['isArray'](_0x28e922) ? _0x28e922 : [])['filter']((_0x19fdf7) =>
      CUSTOM_PROVIDER_SELECTABLE_KINDS['includes'](_0x49ff66(_0x5ea319, _0x19fdf7)),
    );
  }
  function _0xf1ed58(_0x3f71b6) {
    const _0x11bdba = _0x497e40(_0x3f71b6);
    ((_0x11bdba['activeKindFilter'] = 'all'),
      (_0x11bdba['selectedModelKeys'] = new Set()),
      (_0x11bdba['assignedModelKinds'] = new Map()),
      (_0x11bdba['verifyingModelKeys'] = new Set()));
  }
  function _0x30e46f(_0x2534da, _0x5507b2 = []) {
    const _0x1a3400 = _0x497e40(_0x2534da),
      _0x27314d = CUSTOM_PROVIDER_FILTER_KINDS['includes'](_0x1a3400['activeKindFilter'])
        ? _0x1a3400['activeKindFilter']
        : 'all',
      _0x5b56c5 = Array['isArray'](_0x5507b2) ? _0x5507b2 : [];
    if (_0x27314d === 'all') return _0x5b56c5;
    return _0x5b56c5['filter'](
      (_0x357b19) =>
        String(_0x357b19?.['kind'] || '')
          ['trim']()
          ['toLowerCase']() === _0x27314d,
    );
  }
  function _0x5a39b1(_0x27a60b = []) {
    const _0x4ab226 = new Map(
      CUSTOM_PROVIDER_FILTER_KINDS['filter']((_0x541a0f) => _0x541a0f !== 'all')['map']((_0xb95617) => [
        _0xb95617,
        0x0,
      ]),
    );
    return (
      (Array['isArray'](_0x27a60b) ? _0x27a60b : [])['forEach']((_0xc2e040) => {
        const _0x5763b9 = String(_0xc2e040?.['kind'] || 'unknown')
          ['trim']()
          ['toLowerCase']();
        _0x4ab226['set'](_0x5763b9, (_0x4ab226['get'](_0x5763b9) || 0x0) + 0x1);
      }),
      _0x4ab226
    );
  }
  function _0x2c91d2(_0x3804e7 = _0x36ce14()) {
    const _0xa3c936 = _0x497e40(_0x3804e7),
      _0xd79f81 = _0xa3c936['discovery'] || {},
      _0x537a5a = _0xa3c936['selectedModelKeys'],
      _0x368f6b = _0x22be64(_0xd79f81);
    return _0x5f0f95(_0x3804e7, _0x368f6b)
      ['filter']((_0x4b912c) => _0x537a5a['has'](_0x521f6b(_0x4b912c)))
      ['map']((_0x1cb385) => ({ ..._0x1cb385, kind: _0x49ff66(_0x3804e7, _0x1cb385) }));
  }
  function _0x5678fd(_0x218a2f) {
    const _0x2ccf6b = _0x48eb16(_0x218a2f);
    return JSON['stringify']([
      _0x2ccf6b['baseUrl'],
      _0x2ccf6b['apiKey'],
      _0x2ccf6b['documentationUrl'],
      _0x2ccf6b['documentationDocument'],
    ]);
  }
  function _0x4c8c0c(_0x460036) {
    const _0x114964 = _0x497e40(_0x460036),
      _0x1ed2d2 = _0x2c91d2(_0x460036),
      _0x184c29 = _0x114964['recognitionInvalidated']
        ? _0x1ed2d2['map']((_0x44d70a) => ({ ..._0x44d70a, capabilityStatus: 'unverified' }))
        : _0x1ed2d2,
      _0x3e64d1 = _0x114964['parameterDraft'];
    if (!_0x3e64d1 || _0x3e64d1['context'] !== _0x5678fd(_0x460036)) return _0x184c29;
    return mergeCustomProviderDiscoveryCapabilities({ models: _0x184c29 }, _0x3e64d1['bundle'])['models'];
  }
  function _0x4f74b3(_0xa94937 = _0x36ce14()) {
    const {
      saveSelectedBtnEl: _0x5424df,
      verifyParamsBtnEl: _0x10dc25,
      actionsEl: _0x522e73,
    } = _0xf3935f(_0xa94937);
    if (!_0x5424df) return;
    const _0x12675b = _0x2c91d2(_0xa94937)['length'],
      _0x2603fc = _0x497e40(_0xa94937),
      _0x1810b9 = !!_0x2603fc['discovery'],
      _0x220fce = _0xa94937?.['dataset']?.['customProviderSyncedBundle'] === 'true',
      _0x1a8e43 = getCustomProviderModelActionState({
        hasDiscovery: _0x1810b9,
        hasSavedBundle: _0x220fce,
        isAddingModels: _0x2603fc['isAddingModels'] === !![],
        selectedCount: _0x12675b,
        unverifiedCount: getCustomProviderModelsBlockingSave(_0x4c8c0c(_0xa94937))['length'],
        busy: _0x2603fc['verifyingModelKeys']['size'] > 0x0 || _0x2603fc['saving'] === !![],
      });
    ((_0x5424df['disabled'] = _0x1a8e43['saveDisabled']),
      (_0x5424df['hidden'] = _0x1a8e43['saveHidden']),
      (_0x5424df['dataset']['i18n'] = 'settings.apiInput.customProvider.' + _0x1a8e43['saveLabelKey']),
      (_0x5424df['textContent'] = trCustomProvider(_0x1a8e43['saveLabelKey'])));
    _0x10dc25 &&
      ((_0x10dc25['hidden'] = _0x1a8e43['verifyHidden']),
      (_0x10dc25['disabled'] = _0x1a8e43['verifyDisabled']));
    if (_0x522e73) _0x522e73['hidden'] = _0x1a8e43['actionsHidden'];
  }
  function _0x4f852b(_0x61c695) {
    if (!_0x61c695 || _0x61c695['hidden']) return;
    (_0x61c695['classList']['remove']('is-open'),
      _0x61c695['setAttribute']('aria-hidden', 'true'),
      _0x4aef0b['setTimeout']?.(() => {
        if (!_0x61c695['classList']['contains']('is-open')) _0x61c695['hidden'] = !![];
      }, 0x104));
  }
  function _0x1aba57(_0xd7d8e) {
    if (!_0xd7d8e) return;
    ((_0xd7d8e['hidden'] = ![]),
      _0xd7d8e['setAttribute']('aria-hidden', 'false'),
      _0x4aef0b['requestAnimationFrame']?.(() => {
        _0xd7d8e['classList']['add']('is-open');
      }) || _0xd7d8e['classList']['add']('is-open'));
  }
  function _0x4a601d(_0x1d20de = _0x36ce14()) {
    const {
      resultEl: _0x5b999a,
      resultInnerEl: _0xd62366,
      saveSelectedBtnEl: _0x542ebd,
      verifyParamsBtnEl: _0x5a9f18,
      actionsEl: _0x4d12ec,
    } = _0xf3935f(_0x1d20de);
    (_0xd62366?.['replaceChildren'](), _0x4f852b(_0x5b999a));
    _0x542ebd && ((_0x542ebd['hidden'] = !![]), (_0x542ebd['disabled'] = !![]));
    if (_0x5a9f18) _0x5a9f18['hidden'] = !![];
    if (_0x4d12ec) _0x4d12ec['hidden'] = !![];
    const _0x926532 = _0x497e40(_0x1d20de);
    ((_0x926532['discovery'] = null),
      (_0x926532['provider'] = null),
      (_0x926532['activeKindFilter'] = 'all'),
      (_0x926532['selectedModelKeys'] = new Set()),
      (_0x926532['assignedModelKinds'] = new Map()),
      (_0x926532['verifyingModelKeys'] = new Set()),
      (_0x926532['isAddingModels'] = ![]));
  }
  function _0x544e92(_0x5704e5, _0x1d21e6 = {}) {
    const _0x6a1af9 = _0x521f6b(_0x1d21e6),
      _0x490989 = _0x497e40(_0x5704e5),
      _0x1dde24 = String(_0x1d21e6?.['kind'] || 'unknown')
        ['trim']()
        ['toLowerCase'](),
      _0x10ce92 = _0x49ff66(_0x5704e5, _0x1d21e6),
      _0xe37b1e = _0x1dde24 === 'unknown' && _0x10ce92 === 'unknown',
      _0x15ad6d = _0x490989['selectedModelKeys']['has'](_0x6a1af9) && !_0xe37b1e,
      _0x1c8981 = _0x490989['verifyingModelKeys']?.['has'](_0x6a1af9) === !![],
      _0x29745f = _0x57a604['createElement']('label');
    ((_0x29745f['className'] = 'custom-provider-model-option'),
      (_0x29745f['dataset']['customProviderModelKey'] = _0x6a1af9),
      (_0x29745f['dataset']['customProviderDetectedKind'] = _0x1dde24));
    const _0x20087a = String(_0x1d21e6?.['capabilityStatus'] || 'unverified')
      ['trim']()
      ['toLowerCase']();
    _0x29745f['dataset']['customProviderCapabilityStatus'] = _0x20087a;
    if (_0x1dde24 === 'unknown') _0x29745f['tabIndex'] = 0x0;
    (_0x29745f['classList']['toggle']('is-selected', _0x15ad6d),
      _0x29745f['classList']['toggle']('is-verifying', _0x1c8981));
    if (_0x1c8981) _0x29745f['setAttribute']('aria-busy', 'true');
    const _0x27290f = _0x57a604['createElement']('input');
    ((_0x27290f['type'] = 'checkbox'),
      (_0x27290f['className'] = 'custom-provider-model-option-checkbox'),
      (_0x27290f['dataset']['customProviderModelCheckbox'] = ''),
      (_0x27290f['checked'] = _0x15ad6d),
      (_0x27290f['disabled'] = _0xe37b1e || _0x1c8981),
      _0x27290f['setAttribute'](
        'aria-label',
        _0xe37b1e ? trCustomProvider('classifyBeforeSelecting') : String(_0x1d21e6['upstreamModelId'] || ''),
      ));
    const _0x248f2b = _0x57a604['createElement']('span');
    ((_0x248f2b['className'] = 'custom-provider-model-option-title'),
      (_0x248f2b['textContent'] = String(_0x1d21e6['upstreamModelId'] || '')),
      _0x29745f['append'](_0x27290f, _0x248f2b));
    const _0x2bfa39 = _0x1d21e6?.['isSaved'] === !![] || isCustomProviderModelCapabilityRecognized(_0x1d21e6);
    if (_0x1c8981) {
      const _0x170e8b = _0x57a604['createElement']('span');
      ((_0x170e8b['className'] = 'custom-provider-model-verifying'),
        _0x170e8b['setAttribute']('aria-label', trCustomProvider('verifyingParameters')),
        (_0x170e8b['title'] = trCustomProvider('verifyingParameters')));
      const _0x561e41 = _0x57a604['createElement']('span');
      ((_0x561e41['className'] = 'custom-provider-model-loading-spinner'),
        _0x561e41['setAttribute']('aria-hidden', 'true'),
        _0x170e8b['append'](_0x561e41),
        _0x29745f['append'](_0x170e8b));
    } else {
      if (_0x2bfa39 && _0x20087a !== 'verified') {
        const _0x164636 = _0x57a604['createElement']('span');
        ((_0x164636['className'] = 'custom-provider-model-kind-tag'),
          _0x164636['classList']['toggle'](
            'is-success',
            isCustomProviderModelCapabilityRecognized(_0x1d21e6),
          ),
          (_0x164636['textContent'] = _0x5975b0(_0x20087a)),
          (_0x164636['title'] = _0x1ef0cf(_0x20087a)),
          _0x29745f['append'](_0x164636));
      }
    }
    if (_0x1dde24 === 'unknown' && _0x10ce92 !== 'unknown') {
      const _0x5d4132 = _0x57a604['createElement']('span');
      ((_0x5d4132['className'] = 'custom-provider-model-kind-tag'),
        (_0x5d4132['textContent'] = _0x2a7b4a(_0x10ce92)),
        _0x29745f['append'](_0x5d4132));
    }
    if (_0x1dde24 === 'unknown') {
      const _0x49a93a = _0x2e9b9e(_0x5704e5, _0x1d21e6);
      _0x29745f['append'](_0x49a93a);
    }
    return _0x29745f;
  }
  function _0x5d0c3b(_0x19b12a, _0x2f5556 = []) {
    const _0x55e131 = _0x5a39b1(_0x2f5556),
      _0x1fd14d = _0x497e40(_0x19b12a),
      _0x2498dc = _0x57a604['createElement']('div');
    return (
      (_0x2498dc['className'] = 'custom-provider-kind-filter-row'),
      CUSTOM_PROVIDER_FILTER_KINDS['forEach']((_0x37a68d) => {
        if (_0x37a68d === 'unknown' && !(_0x55e131['get']('unknown') > 0x0)) return;
        const _0x1a9190 = _0x57a604['createElement']('button');
        ((_0x1a9190['type'] = 'button'),
          (_0x1a9190['className'] = 'custom-provider-kind-filter'),
          (_0x1a9190['dataset']['customProviderKindFilter'] = _0x37a68d),
          _0x1a9190['classList']['toggle']('is-active', _0x37a68d === _0x1fd14d['activeKindFilter']),
          _0x1a9190['setAttribute'](
            'aria-pressed',
            _0x37a68d === _0x1fd14d['activeKindFilter'] ? 'true' : 'false',
          ));
        const _0x186a72 = _0x37a68d === 'all' ? _0x2f5556['length'] : _0x55e131['get'](_0x37a68d) || 0x0;
        ((_0x1a9190['textContent'] = _0x2a7b4a(_0x37a68d) + '\x20' + _0x186a72),
          _0x2498dc['append'](_0x1a9190));
      }),
      _0x2498dc
    );
  }
  function _0x2e9b9e(_0x3a4ea4, _0x34c3d4 = {}) {
    const _0x25c9f5 = _0x521f6b(_0x34c3d4),
      _0x5dc0bf = _0x49ff66(_0x3a4ea4, _0x34c3d4),
      _0x301426 = _0x57a604['createElement']('div');
    ((_0x301426['className'] = 'custom-provider-model-kind-toolbar'),
      (_0x301426['dataset']['customProviderModelKindToolbar'] = _0x25c9f5),
      _0x301426['setAttribute']('aria-label', trCustomProvider('modelKindLabel')));
    const _0x2723bb = _0x57a604['createElement']('span');
    return (
      (_0x2723bb['className'] = 'custom-provider-model-kind-toolbar-label'),
      (_0x2723bb['textContent'] = trCustomProvider('modelKindLabel')),
      _0x301426['append'](_0x2723bb),
      CUSTOM_PROVIDER_SELECTABLE_KINDS['forEach']((_0xdaf1) => {
        const _0x16a815 = _0x57a604['createElement']('button');
        ((_0x16a815['type'] = 'button'),
          (_0x16a815['className'] = 'custom-provider-model-kind-button'),
          (_0x16a815['dataset']['customProviderAssignKind'] = _0xdaf1));
        const _0x2b4873 = _0x5dc0bf === _0xdaf1;
        (_0x16a815['classList']['toggle']('is-active', _0x2b4873),
          _0x16a815['setAttribute']('aria-pressed', String(_0x2b4873)),
          (_0x16a815['textContent'] = _0x2a7b4a(_0xdaf1)),
          _0x301426['append'](_0x16a815));
      }),
      _0x301426
    );
  }
  function _0x222257() {
    const _0x51e734 = _0x57a604['createElement']('div');
    return (
      (_0x51e734['className'] = 'custom-provider-selection-head'),
      _0x51e734['append'](_0x2cb1d0('custom-provider-result-title', trCustomProvider('selectModels'))),
      _0x51e734['append'](_0x19d150(trCustomProvider('selectionHint'))),
      _0x51e734
    );
  }
  function _0x2a36bd(_0x4af632) {
    const _0x48ecf3 = _0x57a604['createElement']('div');
    return (
      (_0x48ecf3['className'] = 'custom-provider-result-heading'),
      _0x48ecf3['append'](
        _0x222257(),
        _0x2cb1d0('custom-provider-result-title custom-provider-result-summary', _0x4af632),
      ),
      _0x48ecf3
    );
  }
  function _0x415581(_0x19a844, _0x1b2e72 = []) {
    const _0x37195d = _0x30e46f(_0x19a844, _0x1b2e72),
      _0x151776 = _0x57a604['createElement']('div');
    ((_0x151776['className'] = 'custom-provider-selection'),
      _0x151776['append'](_0x5d0c3b(_0x19a844, _0x1b2e72)));
    const _0x56ba2a = _0x57a604['createElement']('div');
    ((_0x56ba2a['className'] = 'custom-provider-model-options'),
      _0x56ba2a['classList']['toggle'](
        'has-kind-toolbar',
        _0x37195d['some'](
          (_0x2ca3a5) =>
            String(_0x2ca3a5?.['kind'] || 'unknown')
              ['trim']()
              ['toLowerCase']() === 'unknown',
        ),
      ),
      _0x37195d['forEach']((_0x32e56c) => _0x56ba2a['append'](_0x544e92(_0x19a844, _0x32e56c))));
    if (_0x37195d['length'] > 0x0) _0x151776['append'](_0x56ba2a);
    if (_0x1b2e72['length'] === 0x0)
      _0x151776['append'](_0x2cb1d0('custom-provider-bundle-empty', trCustomProvider('noModelsDiscovered')));
    else
      _0x37195d['length'] === 0x0 &&
        _0x151776['append'](_0x2cb1d0('custom-provider-bundle-empty', trCustomProvider('noModelsInFilter')));
    return _0x151776;
  }
  function _0x2e05e3(_0x581188, _0x1e7c56 = {}, _0x4c4a8f = {}) {
    const { resultEl: _0xb90f37, resultInnerEl: _0x5cf502 } = _0xf3935f(_0x581188);
    if (!_0xb90f37 || !_0x5cf502) return;
    const _0x16b130 = _0x497e40(_0x581188),
      _0xf565f5 = _0x16b130['parameterDraft'],
      _0x159981 = _0x22be64(
        _0xf565f5?.['context'] === _0x5678fd(_0x581188)
          ? mergeCustomProviderDiscoveryCapabilities(_0x1e7c56, _0xf565f5['bundle'], ![])
          : _0x1e7c56,
      ),
      _0x52c300 = Array['isArray'](_0x1e7c56['unknown']) ? _0x1e7c56['unknown'] : [],
      _0x5d270e = _0x5f0f95(_0x581188, _0x159981);
    (_0x5cf502['replaceChildren'](),
      _0x5cf502['append'](
        _0x2a36bd(
          trCustomProvider('resultSummary', {
            count: _0x159981['length'],
            supported: _0x5d270e['length'],
            unknown: _0x52c300['length'],
          }),
        ),
      ),
      _0x5cf502['append'](_0x415581(_0x581188, _0x159981)),
      _0x1aba57(_0xb90f37),
      _0x4f74b3(_0x581188));
  }
  function _0x483393(_0x27f93c, _0x47c2f7 = {}, _0x16187f = {}) {
    const { resultEl: _0x58d19e } = _0xf3935f(_0x27f93c),
      _0x5c6611 = captureCustomProviderModelSelectionScroll(_0x58d19e);
    (_0x2e05e3(_0x27f93c, _0x47c2f7, _0x16187f),
      restoreCustomProviderModelSelectionScroll(_0x58d19e, _0x5c6611));
  }
  function _0x5ee6ea() {
    const { editorListEl: _0x5b1833, addBtnEl: _0x4a99f7 } = _0x1c4a39();
    if (!_0x5b1833) return;
    const _0x49a316 = _0x452c68();
    (_0x5b1833['insertBefore'](_0x49a316, _0x4a99f7 || null),
      _0x5d62c5(),
      _0x185155(),
      _0x3719ed(_0x49a316, { clearResult: !![] }),
      _0x3c5eb6('', ''));
    const { baseUrlEl: _0x249d8 } = _0x20560a(_0x49a316);
    _0x249d8?.['focus']?.();
  }
  function _0x129be6(_0x2fb222 = {}) {
    return String(_0x2fb222?.['sourceId'] || _0x2fb222?.['bundle']?.['sourceId'] || '')['trim']();
  }
  function _0x1d6c96(_0x5686eb) {
    return String(_0x5686eb || '')
      ['replace'](/^custom-provider:/, '')
      ['trim']();
  }
  function _0x1db180(_0x2cb669 = {}) {
    const _0x2db9f3 =
        _0x2cb669?.['bundle'] && typeof _0x2cb669['bundle'] === 'object' ? _0x2cb669['bundle'] : {},
      _0x487804 =
        _0x2db9f3['provider'] && typeof _0x2db9f3['provider'] === 'object' ? _0x2db9f3['provider'] : {},
      _0x270cf4 = _0x1d6c96(_0x129be6(_0x2cb669)),
      _0x1efe6a = String(_0x487804['providerId'] || _0x2cb669['providerId'] || _0x270cf4)['trim'](),
      _0x455d0d = String(_0x487804['baseUrl'] || _0x487804['apiUrl'] || '')['trim'](),
      _0x502800 = String(_0x487804['name'] || _0x2cb669['displayName'] || _0xe860e0(_0x455d0d) || _0x1efe6a)[
        'trim'
      ]();
    return { ..._0x487804, providerId: _0x1efe6a, name: _0x502800, baseUrl: _0x455d0d };
  }
  function _0x1bf18d(_0x33c767) {
    if (!_0x33c767) return '';
    const _0x55efc0 = _0x497e40(_0x33c767);
    return String(
      _0x55efc0['provider']?.['providerId'] || _0x33c767['dataset']?.['customProviderProviderId'] || '',
    )['trim']();
  }
  function _0x59d7fc(_0xcf8a7d) {
    const _0x52c663 = String(_0xcf8a7d || '')['trim']();
    if (!_0x52c663) return null;
    return _0x46a7d6()['find']((_0x236b90) => _0x1bf18d(_0x236b90) === _0x52c663) || null;
  }
  function _0x20c0d7(_0xdf621f) {
    if (!_0xdf621f) return ![];
    const _0x498383 = _0x497e40(_0xdf621f),
      { baseUrlEl: _0x4885bd, apiKeyEl: _0x82a0d7, documentationUrlEl: _0x444560 } = _0x20560a(_0xdf621f);
    return (
      !_0x498383['provider'] &&
      !_0x498383['discovery'] &&
      !_0x498383['titleText'] &&
      !String(_0x4885bd?.['value'] || '')['trim']() &&
      !String(_0x82a0d7?.['value'] || '')['trim']() &&
      !String(_0x444560?.['value'] || '')['trim']() &&
      !_0x498383['documentationDocument']
    );
  }
  function _0xfaf615() {
    return _0x46a7d6()['find'](_0x20c0d7) || null;
  }
  function _0x4d647d() {
    const { editorListEl: _0x1a4c50, addBtnEl: _0xc5f4bb } = _0x1c4a39();
    if (!_0x1a4c50) return null;
    const _0x2a32c9 = _0x452c68();
    return (_0x1a4c50['insertBefore'](_0x2a32c9, _0xc5f4bb || null), _0x2a32c9);
  }
  function _0x2a96cb(_0x24bf32 = {}) {
    return getCustomProviderManifestUpstreamModelId(_0x24bf32);
  }
  function _0x5f21ce(_0x26abbf = {}) {
    const _0x594ddd = Array['isArray'](_0x26abbf?.['models'])
      ? _0x26abbf['models']
          ['map']((_0x2271d7) => {
            const _0x5d3476 = _0x2271d7?.['extensions']?.['customProvider']?.['capability'] || {};
            return {
              upstreamModelId: _0x2a96cb(_0x2271d7),
              kind: String(_0x2271d7?.['kind'] || '')
                ['trim']()
                ['toLowerCase'](),
              isSaved: !![],
              capabilityStatus: String(_0x5d3476?.['status'] || 'unverified')
                ['trim']()
                ['toLowerCase'](),
              capabilitySource: String(_0x5d3476?.['source'] || 'stored-bundle')['trim'](),
            };
          })
          ['filter']((_0x2b9cb3) => _0x2b9cb3['upstreamModelId'] && _0x2b9cb3['kind'])
      : [];
    return { provider: _0x26abbf?.['provider'] || {}, models: _0x594ddd, unknown: [] };
  }
  function _0x9bfd0b(_0x231fa8, _0xf84820 = {}) {
    if (!_0x231fa8) return;
    const _0x30ff5 =
        _0xf84820?.['bundle'] && typeof _0xf84820['bundle'] === 'object' ? _0xf84820['bundle'] : {},
      _0x143c3c = _0x1db180(_0xf84820);
    if (!_0x143c3c['providerId']) return;
    const _0x1bd2a4 = _0x5f21ce(_0x30ff5);
    _0x1bd2a4['provider'] = _0x143c3c;
    const _0x34fe49 = _0x497e40(_0x231fa8),
      _0x4f1da2 = _0x1bf18d(_0x231fa8),
      _0x5813d3 =
        _0x4f1da2 === _0x143c3c['providerId'] &&
        _0x34fe49['titleManuallyEdited'] &&
        _0x19eead(_0x34fe49['titleText']),
      _0x197941 = _0x4f1da2 === _0x143c3c['providerId'] && !!_0x34fe49['documentationDocument'],
      {
        baseUrlEl: _0x2437ce,
        apiKeyEl: _0x476d2d,
        documentationUrlEl: _0x349b86,
        documentationFileEl: _0x28d242,
      } = _0x20560a(_0x231fa8),
      _0x5cf972 = _0x6cada3?.['providers']?.[_0x143c3c['providerId']] || {};
    if (_0x2437ce) _0x2437ce['value'] = _0x143c3c['baseUrl'] || _0x5cf972['apiUrl'] || '';
    if (_0x476d2d) _0x476d2d['value'] = _0x5cf972['apiKey'] || '';
    _0x349b86 &&
      !_0x197941 &&
      (_0x349b86['value'] = String(_0x143c3c['documentationUrl'] || _0x5cf972['documentationUrl'] || '')[
        'trim'
      ]());
    if (!_0x197941) {
      if (_0x28d242) _0x28d242['value'] = '';
      _0x34fe49['documentationDocument'] = null;
    }
    ((_0x231fa8['dataset']['customProviderProviderId'] = _0x143c3c['providerId']),
      (_0x231fa8['dataset']['customProviderSyncedBundle'] = 'true'),
      (_0x34fe49['provider'] = _0x143c3c),
      (_0x34fe49['discovery'] = _0x1bd2a4),
      (_0x34fe49['isAddingModels'] = ![]));
    const _0x4077cc = _0x1bd2a4['unknown']['length'] > 0x0;
    ((_0x34fe49['activeKindFilter'] =
      CUSTOM_PROVIDER_FILTER_KINDS['includes'](_0x34fe49['activeKindFilter']) &&
      (_0x34fe49['activeKindFilter'] !== 'unknown' || _0x4077cc)
        ? _0x34fe49['activeKindFilter']
        : 'all'),
      (_0x34fe49['selectedModelKeys'] = new Set(_0x5f0f95(_0x231fa8, _0x1bd2a4['models'])['map'](_0x521f6b))),
      (_0x34fe49['assignedModelKinds'] = new Map()),
      !_0x5813d3 ? _0x421be2(_0x231fa8, _0x143c3c['name'], { manual: !![] }) : _0x5be417(_0x231fa8),
      _0x2e05e3(_0x231fa8, _0x1bd2a4, _0x143c3c));
  }
  function _0x22d171(_0x17901b) {
    if (!_0x17901b) return;
    if (_0x46a7d6()['length'] <= 0x1) {
      (_0x1b364f(_0x17901b), _0x3719ed(_0x17901b, { clearStatus: !![] }));
      return;
    }
    _0x52f7f5(_0x17901b);
  }
  function _0xe8e188(_0x13f1a3 = []) {
    const { editorListEl: _0xc20841 } = _0x1c4a39();
    if (!_0xc20841) return;
    const _0x1f3f8e = (Array['isArray'](_0x13f1a3) ? _0x13f1a3 : [])['filter'](
        (_0x5a245a) => _0x5a245a?.['bundle'] && _0x1db180(_0x5a245a)['providerId'],
      ),
      _0x3a5bcf = new Set(_0x1f3f8e['map']((_0x5c6847) => _0x1db180(_0x5c6847)['providerId']));
    (_0x1f3f8e['forEach']((_0x4a07f7) => {
      const _0x172963 = _0x1db180(_0x4a07f7),
        _0x3e8fe6 = _0x59d7fc(_0x172963['providerId']) || _0xfaf615() || _0x4d647d();
      _0x9bfd0b(_0x3e8fe6, _0x4a07f7);
    }),
      _0x46a7d6()['forEach']((_0x3147b1) => {
        const _0x242ce9 = _0x1bf18d(_0x3147b1);
        _0x3147b1['dataset']?.['customProviderSyncedBundle'] === 'true' &&
          _0x242ce9 &&
          !_0x3a5bcf['has'](_0x242ce9) &&
          _0x22d171(_0x3147b1);
      }),
      _0x46a7d6()['length'] === 0x0 && _0x4d647d(),
      _0x5d62c5(),
      _0x185155(),
      _0x9855a8(_0x36ce14()));
  }
  function _0xba173(_0x38fbab = {}) {
    (getRememberedCustomProviderConfigs(_0x38fbab)['forEach']((_0x1e6937) => {
      const _0x1b8655 = _0x59d7fc(_0x1e6937['providerId']) || _0xfaf615() || _0x4d647d();
      if (!_0x1b8655) return;
      const _0x1c5113 = _0x497e40(_0x1b8655),
        { baseUrlEl: _0x122dc3, apiKeyEl: _0x3854bf, documentationUrlEl: _0x490eff } = _0x20560a(_0x1b8655);
      if (_0x122dc3) _0x122dc3['value'] = _0x1e6937['baseUrl'];
      if (_0x3854bf) _0x3854bf['value'] = _0x1e6937['apiKey'];
      (_0x490eff &&
        !_0x1c5113['documentationDocument'] &&
        (_0x490eff['value'] = _0x1e6937['documentationUrl']),
        (_0x1b8655['dataset']['customProviderProviderId'] = _0x1e6937['providerId']),
        !_0x1c5113['provider'] &&
          (_0x1c5113['provider'] = {
            providerId: _0x1e6937['providerId'],
            name: _0x1e6937['name'],
            baseUrl: _0x1e6937['baseUrl'],
            documentationUrl: _0x1e6937['documentationUrl'],
          }),
        !_0x1c5113['discovery'] && _0x421be2(_0x1b8655, _0x1e6937['name'], { manual: !![] }));
    }),
      _0x46a7d6()['forEach']((_0x5069e8) => {
        const _0x5d5419 = _0x1bf18d(_0x5069e8);
        if (!_0x5d5419) return;
        const _0x2d63c1 = _0x38fbab?.[_0x5d5419] || {},
          { baseUrlEl: _0x3c1fd7, apiKeyEl: _0x55d7ab, documentationUrlEl: _0x351b9d } = _0x20560a(_0x5069e8);
        if (_0x3c1fd7 && _0x2d63c1['apiUrl']) _0x3c1fd7['value'] = _0x2d63c1['apiUrl'];
        if (_0x55d7ab && _0x2d63c1['apiKey']) _0x55d7ab['value'] = _0x2d63c1['apiKey'];
        _0x351b9d &&
          !_0x497e40(_0x5069e8)['documentationDocument'] &&
          _0x2d63c1['documentationUrl'] &&
          (_0x351b9d['value'] = _0x2d63c1['documentationUrl']);
      }),
      _0x5d62c5(),
      _0x185155(),
      _0x9855a8(_0x36ce14()));
  }
  function _0x2cf6f3(_0x28d419 = {}) {
    const _0x1aa892 = _0x28d419?.['bundle'],
      _0x1f58b9 = String(_0x28d419?.['sourceId'] || _0x1aa892?.['sourceId'] || '')['trim']();
    if (!_0x1f58b9 || !_0x1aa892) return ![];
    let _0x3e58e5 = ![];
    const _0x2bf385 = _0x52560e['get'](_0x1f58b9);
    if (_0x2bf385)
      try {
        (unregisterManifestBundle(_0x2bf385), (_0x3e58e5 = !![]));
      } catch (_0x30294d) {
        console['warn']('[Custom Provider] unregister previous bundle failed:', _0x30294d);
      }
    try {
      (registerManifestBundle(_0x1aa892), _0x52560e['set'](_0x1f58b9, _0x1aa892), (_0x3e58e5 = !![]));
    } catch (_0x247faf) {
      (console['warn']('[Custom Provider] register bundle failed:', _0x247faf),
        _0x52560e['delete'](_0x1f58b9));
    }
    return _0x3e58e5;
  }
  function _0x333f72(_0x5374b9 = []) {
    let _0x40d160 = ![];
    const _0x595d2c = new Set();
    return (
      _0x5374b9['forEach']((_0x4c6416) => {
        const _0x281166 = _0x4c6416?.['bundle'],
          _0x19ddbd = String(_0x4c6416?.['sourceId'] || _0x281166?.['sourceId'] || '')['trim']();
        if (!_0x19ddbd || !_0x281166) return;
        _0x595d2c['add'](_0x19ddbd);
        if (_0x2cf6f3(_0x4c6416)) _0x40d160 = !![];
      }),
      [..._0x52560e['entries']()]['forEach'](([_0x3aed38, _0x40af97]) => {
        if (_0x595d2c['has'](_0x3aed38)) return;
        try {
          (unregisterManifestBundle(_0x40af97), (_0x40d160 = !![]));
        } catch (_0x5348c0) {
          console['warn']('[Custom Provider] unregister stale bundle failed:', _0x5348c0);
        }
        _0x52560e['delete'](_0x3aed38);
      }),
      _0x40d160
    );
  }
  function _0xfa6461(_0x2dc0f2, _0x3159c2, _0x24d17e, _0x4cf1ae = {}) {
    const _0x43368e = _0x3159c2?.['item'] && typeof _0x3159c2['item'] === 'object' ? _0x3159c2['item'] : {},
      _0x8650c =
        _0x43368e?.['bundle'] && typeof _0x43368e['bundle'] === 'object' ? _0x43368e['bundle'] : _0x24d17e,
      _0x55335d = String(_0x43368e?.['sourceId'] || _0x8650c?.['sourceId'] || '')['trim'](),
      _0x26874d = { ..._0x43368e, sourceId: _0x55335d, bundle: _0x8650c },
      _0x44e3cd = _0x497e40(_0x2dc0f2);
    return (
      (_0x44e3cd['discovery'] = mergeCustomProviderDiscoveryCapabilities(_0x44e3cd['discovery'], _0x8650c)),
      (_0x44e3cd['provider'] = {
        ...(_0x44e3cd['provider'] || {}),
        ...(_0x8650c?.['provider'] || {}),
        ...(_0x4cf1ae || {}),
      }),
      (_0x44e3cd['isAddingModels'] = ![]),
      (_0x2dc0f2['dataset']['customProviderProviderId'] = String(_0x44e3cd['provider']?.['providerId'] || '')[
        'trim'
      ]()),
      (_0x2dc0f2['dataset']['customProviderSyncedBundle'] = 'true'),
      _0x2cf6f3(_0x26874d) && _0x155da5?.(),
      _0x8650c
    );
  }
  async function _0x1068f6(_0x2d9d38 = {}) {
    const _0x3b967b = !!_0x2d9d38['silent'];
    if (typeof _0x1f9b4a !== 'function')
      return (!_0x3b967b && _0x3c5eb6('danger', trCustomProvider('apiUnsupported')), []);
    try {
      const _0x38fe15 = await _0x1f9b4a(),
        _0x215632 = Array['isArray'](_0x38fe15?.['items']) ? _0x38fe15['items'] : [],
        _0x2e8c06 = _0x333f72(_0x215632);
      _0xe8e188(_0x215632);
      if (_0x2e8c06) _0x155da5?.();
      if (!_0x3b967b) _0x3c5eb6('', '');
      return _0x215632;
    } catch (_0x1fbb82) {
      const _0x297d44 = trCustomProvider('loadBundlesFailed', {
        error: _0x1fbb82?.['message'] || trApiInput('diagnostics.unknownError'),
      });
      return (
        !_0x3b967b &&
          (_0x3c5eb6('danger', trApiInput('diagnostics.failed'), _0x297d44),
          _0x4aef0b['showToast']?.(_0x297d44, 'error')),
        []
      );
    }
  }
  async function _0x3d844f(_0x37901c = {}, _0xeaefc3 = '') {
    if (typeof _0x6ce60a !== 'function') return;
    const _0x21af96 = String(_0x37901c['providerId'] || '')['trim']();
    if (!_0x21af96) return;
    const _0x42d833 = { ...(_0x6cada3?.['providers'] || {}) };
    _0x42d833[_0x21af96] = {
      ...(_0x42d833[_0x21af96] || {}),
      apiUrl: String(_0x37901c['baseUrl'] || _0x37901c['apiUrl'] || '')['trim'](),
      apiKey: String(_0xeaefc3 || '')['trim'](),
      label: String(_0x37901c['name'] || _0x21af96)['trim'](),
      documentationUrl: String(_0x37901c['documentationUrl'] || '')['trim'](),
    };
    const _0x36ff15 = { ...(_0x6cada3 || {}), providers: _0x42d833 };
    (await _0x6ce60a(_0x36ff15),
      _0x53ff29(_0x36ff15),
      syncModelServiceReadinessSummary(_0x36ff15),
      _0x155da5?.());
  }
  function _0x3ef2b5(_0x17eb08, _0x4f4f1c = {}) {
    return (
      _0x19eead(_0x9ea563(_0x17eb08)) ||
      String(_0x4f4f1c['name'] || '')['trim']() ||
      _0xe860e0(_0x4f4f1c['baseUrl'])
    );
  }
  function _0x1fe8fc(_0x529340 = null) {
    if (typeof _0x4aef0b['openSubscriptionDialog'] === 'function') {
      _0x4aef0b['openSubscriptionDialog']({
        modelId: CUSTOM_PROVIDER_VIP_MODEL_ID,
        provider: 'aicanvas',
        onSuccess: _0x529340,
      });
      return;
    }
    _0x4aef0b['showToast']?.(trCustomProvider('vipRequired'), 'warn');
  }
  function _0x4d20d(_0x9830ba = null) {
    const _0x19233f = _0x2f1035?.['getStateRaw']?.()['subscription'] || {};
    if (isCustomProviderAccessAllowed(_0x19233f)) return !![];
    return (_0x1fe8fc(_0x9830ba), ![]);
  }
  async function _0x321cc3(_0x2d00c4, _0x23a343) {
    if (
      !_0x4d20d(() => {
        _0x321cc3(_0x2d00c4, _0x23a343)['catch'](() => {});
      })
    )
      return;
    if (typeof _0x37fad5 !== 'function') {
      (_0x3c5eb6('danger', trCustomProvider('apiUnsupported')),
        _0x4aef0b['showToast']?.(trCustomProvider('apiUnsupported'), 'error'));
      return;
    }
    _0x3719ed(_0x2d00c4);
    const _0xe8d7f = _0x48eb16(_0x2d00c4);
    if (!_0xe8d7f['baseUrl'] || !_0xe8d7f['apiKey']) {
      const { baseUrlEl: _0x3a013d, apiKeyEl: _0x157dff } = _0x20560a(_0x2d00c4);
      (_0x3c5eb6('danger', trApiInput('diagnostics.failed')),
        _0x4aef0b['showToast']?.(trCustomProvider('fillRequired'), 'warn'));
      if (!_0xe8d7f['baseUrl']) _0x3a013d?.['focus']?.();
      else _0x157dff?.['focus']?.();
      return;
    }
    if (_0x2146a9(_0x2d00c4, _0xe8d7f['providerId'])) return;
    const _0x5527d0 = _0x344b2d(_0x23a343, trCustomProvider('discovering'));
    try {
      _0x3c5eb6('testing', trCustomProvider('discovering'));
      const { documentationDocument: _0x5476b0, ..._0x14d27c } = _0xe8d7f,
        _0x3a199b = _0x59e3a6(_0xe8d7f['providerId']),
        _0x4361fe = await _0x37fad5(_0x14d27c),
        _0x5b20e2 = mergeCustomProviderDiscoveryCapabilities(_0x4361fe, _0x3a199b),
        _0x566155 = {
          ...(_0x5b20e2['provider'] || {}),
          name: _0xe8d7f['name'],
          providerId: _0xe8d7f['providerId'],
          baseUrl: _0x5b20e2['provider']?.['baseUrl'] || _0xe8d7f['baseUrl'],
          documentationUrl: _0xe8d7f['documentationUrl'] || _0x5b20e2['provider']?.['documentationUrl'] || '',
        };
      _0x36d676(_0x2d00c4, _0x566155['name']);
      const _0x163403 = { ..._0x566155, name: _0x3ef2b5(_0x2d00c4, _0x566155) };
      (await _0x3d844f(_0x163403, _0xe8d7f['apiKey']),
        (_0x2d00c4['dataset']['customProviderProviderId'] = _0x163403['providerId']),
        delete _0x2d00c4['dataset']['customProviderSyncedBundle'],
        _0xf1ed58(_0x2d00c4));
      const _0x4ed1db = _0x497e40(_0x2d00c4);
      ((_0x4ed1db['discovery'] = _0x5b20e2),
        (_0x4ed1db['provider'] = _0x163403),
        (_0x4ed1db['isAddingModels'] = !![]),
        (_0x4ed1db['parameterDraft'] = null),
        (_0x4ed1db['recognitionInvalidated'] = ![]));
      const _0x5a53c9 = _0x20560a(_0x2d00c4);
      if (_0x5a53c9['baseUrlEl']) _0x5a53c9['baseUrlEl']['value'] = _0x163403['baseUrl'];
      _0x5a53c9['documentationUrlEl'] &&
        !_0x4ed1db['documentationDocument'] &&
        (_0x5a53c9['documentationUrlEl']['value'] = _0x163403['documentationUrl']);
      (_0x2e05e3(_0x2d00c4, _0x5b20e2, _0x163403), _0x185155());
      const _0x14b0b0 = _0x22be64(_0x5b20e2),
        _0x1118ea = _0x5f0f95(_0x2d00c4, _0x14b0b0)['length'];
      if (_0x1118ea === 0x0) {
        const _0x52205e = trCustomProvider('configSavedNoSupportedModels');
        (_0x3c5eb6('partial', _0x52205e), _0x4aef0b['showToast']?.(_0x52205e, 'warn', 0x2328));
        return;
      }
      _0x3c5eb6(
        _0x5b20e2['warnings']?.['length'] ? 'partial' : 'success',
        trCustomProvider('resultSummary', {
          count: _0x14b0b0['length'],
          supported: _0x1118ea,
          unknown: Array['isArray'](_0x5b20e2['unknown']) ? _0x5b20e2['unknown']['length'] : 0x0,
        }),
        _0x5b20e2['warnings']?.['length'] ? trCustomProvider('sourceIncomplete') : '',
      );
    } catch (_0x1bf7f5) {
      const _0x3c5e09 = trCustomProvider('saveFailed', {
        error: _0x1bf7f5?.['message'] || trApiInput('diagnostics.unknownError'),
      });
      (_0x3c5eb6('danger', trApiInput('diagnostics.failed'), _0x3c5e09),
        _0x4aef0b['showToast']?.(_0x3c5e09, 'error', 0x2328));
    } finally {
      _0x5527d0();
    }
  }
  async function _0x50d0ec(_0x2113a7, _0x3efb9c) {
    const _0x56610f = _0x497e40(_0x2113a7);
    if (_0x56610f['saving'] || _0x56610f['verifyingModelKeys']['size']) return;
    if (getCustomProviderModelsBlockingSave(_0x4c8c0c(_0x2113a7))['length']) {
      _0x4aef0b['showToast']?.(trCustomProvider('recognizeBeforeSave'), 'warn');
      return;
    }
    if (
      !_0x4d20d(() => {
        _0x50d0ec(_0x2113a7, _0x3efb9c)['catch'](() => {});
      })
    )
      return;
    if (
      typeof _0x42e0f6 !== 'function' ||
      typeof _0x2071fc !== 'function' ||
      typeof _0x48a2e5 !== 'function'
    ) {
      (_0x3c5eb6('danger', trCustomProvider('apiUnsupported')),
        _0x4aef0b['showToast']?.(trCustomProvider('apiUnsupported'), 'error'));
      return;
    }
    const _0x3218f8 = _0x2c91d2(_0x2113a7);
    if (_0x3218f8['length'] === 0x0) {
      _0x4aef0b['showToast']?.(trCustomProvider('noModelsSelected'), 'warn');
      return;
    }
    const _0x5c9907 = _0x48eb16(_0x2113a7);
    if (_0x2146a9(_0x2113a7, _0x5c9907['providerId'])) return;
    const _0x2f1da9 = {
        ...(_0x56610f['provider'] || {}),
        name: _0x3ef2b5(_0x2113a7, _0x56610f['provider']),
        providerId:
          _0x5c9907['baseUrl'] === _0x56610f['provider']?.['baseUrl']
            ? _0x56610f['provider']['providerId']
            : _0x5c9907['providerId'],
        baseUrl: _0x5c9907['baseUrl'],
        documentationUrl: _0x5c9907['documentationUrl'],
      },
      _0x16fca6 = _0x59e3a6(_0x2f1da9['providerId']),
      _0x1b7c90 = _0x5678fd(_0x2113a7);
    ((_0x56610f['saving'] = !![]), _0x4f74b3(_0x2113a7));
    const _0x101300 = _0x344b2d(_0x3efb9c, trCustomProvider('validating'));
    try {
      _0x3c5eb6('testing', trCustomProvider('validating'));
      const _0x419f45 = await _0x42e0f6({ provider: _0x2f1da9, models: _0x3218f8 }),
        _0xf3955a = mergeCustomProviderRecognizedProfiles(
          mergeCustomProviderRecognizedProfiles(_0x419f45?.['bundle'], _0x16fca6),
          _0x56610f['parameterDraft']?.['context'] === _0x1b7c90 ? _0x56610f['parameterDraft']['bundle'] : {},
        ),
        _0x5befa1 = Array['isArray'](_0xf3955a?.['models']) ? _0xf3955a['models']['length'] : 0x0;
      if (_0x5befa1 === 0x0) throw new Error(trCustomProvider('noSupportedModels'));
      if (getCustomProviderModelsBlockingSave(_0xf3955a['models'])['length'])
        throw new Error(trCustomProvider('recognizeBeforeSave'));
      const _0x106fd3 = await _0x2071fc(_0xf3955a);
      if (!_0x106fd3?.['ok'])
        throw new Error(
          Array['isArray'](_0x106fd3?.['errors']) && _0x106fd3['errors']['length']
            ? _0x106fd3['errors']['join'](';\x20')
            : trApiInput('diagnostics.failed'),
        );
      const _0x432da6 = _0x106fd3['bundle'] || _0xf3955a;
      if (_0x1b7c90 !== _0x5678fd(_0x2113a7)) throw new Error(trCustomProvider('recognizeBeforeSave'));
      await _0x3d844f(_0x2f1da9, _0x5c9907['apiKey']);
      const _0x4710e7 = await _0x48a2e5(_0x432da6),
        _0x50d189 = _0xfa6461(_0x2113a7, _0x4710e7, _0x432da6, _0x2f1da9);
      _0x483393(_0x2113a7, _0x56610f['discovery'], _0x56610f['provider']);
      const _0x45c543 = getCustomProviderSaveStatus(_0x50d189?.['models']),
        _0x478148 = trCustomProvider(_0x45c543['key'], _0x45c543);
      (_0x3c5eb6('success', _0x478148), _0x4aef0b['showToast']?.(_0x478148, 'success'));
    } catch (_0x4cbd1e) {
      const _0x2c620 = trCustomProvider('saveFailed', {
        error: _0x4cbd1e?.['message'] || trApiInput('diagnostics.unknownError'),
      });
      (_0x3c5eb6('danger', trApiInput('diagnostics.failed'), _0x2c620),
        _0x4aef0b['showToast']?.(_0x2c620, 'error', 0x2328));
    } finally {
      (_0x101300(), (_0x56610f['saving'] = ![]), _0x4f74b3(_0x2113a7));
    }
  }
  function _0x50f75d(_0x4db8e3) {
    const _0x3d9563 = _0x4db8e3?.['message'] || trApiInput('diagnostics.unknownError'),
      _0x311031 = _0x3d9563['includes']('Automatic API documentation discovery failed')
        ? trCustomProvider('documentationAutoDiscoveryFailed')
        : _0x3d9563,
      _0x5248e0 = trCustomProvider('parameterVerificationFailed', { error: _0x311031 });
    console['error']('[Custom Provider] 模型参数验证失败:', _0x4db8e3);
    try {
      _0x3c5eb6('danger', _0x5248e0, _0x311031);
    } catch (_0x524cc3) {
      console['error']('[Custom Provider] 无法更新参数验证状态:', _0x524cc3);
    }
    let _0x4d43df = ![];
    try {
      typeof _0x4aef0b['showToast'] === 'function' &&
        (_0x4aef0b['showToast'](_0x5248e0, 'error', 0x2328), (_0x4d43df = !![]));
    } catch (_0xefb764) {
      console['error']('[Custom Provider] 无法显示参数验证提示:', _0xefb764);
    }
    if (!_0x4d43df)
      try {
        showError?.(_0x5248e0);
      } catch (_0x118205) {
        console['error']('[Custom Provider] 无法显示参数验证错误:', _0x118205);
      }
  }
  async function _0x15a880(_0x391cc9, _0x445c2a) {
    try {
      await _0x48b731(_0x391cc9, _0x445c2a);
    } catch (_0x4f9e58) {
      _0x50f75d(_0x4f9e58);
    }
  }
  async function _0x48b731(_0x1f1868, _0x15b7ae) {
    const _0xffd6ce = _0x497e40(_0x1f1868);
    if (_0xffd6ce['saving'] || _0xffd6ce['verifyingModelKeys']['size']) return;
    if (
      !_0x4d20d(() => {
        _0x15a880(_0x1f1868, _0x15b7ae)['catch'](_0x50f75d);
      })
    )
      return;
    if (
      typeof _0x4015c2 !== 'function' ||
      typeof _0x42e0f6 !== 'function' ||
      typeof _0x2071fc !== 'function' ||
      typeof _0x48a2e5 !== 'function'
    ) {
      (_0x3c5eb6('danger', trCustomProvider('apiUnsupported')),
        _0x4aef0b['showToast']?.(trCustomProvider('apiUnsupported'), 'error'));
      return;
    }
    const _0x4c3807 = _0x48eb16(_0x1f1868),
      _0x2be15d = _0x2c91d2(_0x1f1868);
    if (_0x2be15d['length'] === 0x0) {
      const _0x28397e = trCustomProvider('noModelsSelected');
      (_0x3c5eb6('partial', _0x28397e), _0x4aef0b['showToast']?.(_0x28397e, 'warn'));
      return;
    }
    const _0x2fa5e3 = _0x2be15d;
    if (_0x2146a9(_0x1f1868, _0x4c3807['providerId'])) return;
    const _0x318484 = _0x5678fd(_0x1f1868),
      _0x207006 = {
        ...(_0xffd6ce['provider'] || {}),
        name: _0x3ef2b5(_0x1f1868, _0xffd6ce['provider']),
        providerId:
          _0x4c3807['baseUrl'] === _0xffd6ce['provider']?.['baseUrl']
            ? _0xffd6ce['provider']['providerId']
            : _0x4c3807['providerId'],
        baseUrl: _0x4c3807['baseUrl'],
        documentationUrl: _0x4c3807['documentationUrl'],
      },
      { resultEl: _0x5ba190 } = _0xf3935f(_0x1f1868),
      _0x408385 = captureCustomProviderModelSelectionScroll(_0x5ba190);
    ((_0xffd6ce['parameterDraft'] = null),
      (_0xffd6ce['recognitionInvalidated'] = !![]),
      (_0xffd6ce['verifyingModelKeys'] = new Set(_0x2be15d['map'](_0x521f6b)['filter'](Boolean))),
      _0x2e05e3(_0x1f1868, _0xffd6ce['discovery'], _0xffd6ce['provider']),
      restoreCustomProviderModelSelectionScroll(_0x5ba190, _0x408385));
    const _0x3961b4 = _0x344b2d(_0x15b7ae, trCustomProvider('verifyingParameters'));
    try {
      _0x3c5eb6('testing', trCustomProvider('analyzingDocumentation'));
      const _0x16338b = await _0x4015c2({
        apiKey: _0x4c3807['apiKey'],
        provider: _0x207006,
        models: _0x2fa5e3,
        documentationUrl: _0x4c3807['documentationUrl'],
        documentationDocument: _0x4c3807['documentationDocument'],
      });
      if (_0x16338b?.['agentUnavailable']) throw new Error(trCustomProvider('documentationAgentUnavailable'));
      if (!_0x16338b?.['bundle']) throw new Error(trCustomProvider('documentationNoMatchingProfile'));
      const _0x316a1e = Number(_0x16338b?.['analysis']?.['documentedModels'] || 0x0);
      if (_0x316a1e <= 0x0)
        throw new Error(
          trCustomProvider(resolveCustomProviderDocumentationFailureKey(_0x16338b?.['analysis'])),
        );
      const _0x35cdc2 = await _0x42e0f6({ provider: _0x207006, models: _0x2be15d }),
        _0x1e251f = mergeCustomProviderRecognizedProfiles(_0x35cdc2?.['bundle'], _0x16338b['bundle']),
        _0x5cce65 = await _0x2071fc(_0x1e251f);
      if (!_0x5cce65?.['ok'])
        throw new Error(
          Array['isArray'](_0x5cce65?.['errors']) && _0x5cce65['errors']['length']
            ? _0x5cce65['errors']['join'](';\x20')
            : trApiInput('diagnostics.failed'),
        );
      if (_0x318484 !== _0x5678fd(_0x1f1868)) throw new Error(trCustomProvider('recognizeBeforeSave'));
      const _0x2e0b0f = _0x5cce65['bundle'] || _0x1e251f;
      _0xffd6ce['parameterDraft'] = { context: _0x318484, bundle: _0x2e0b0f };
      const _0x145657 = Array['isArray'](_0x2e0b0f?.['models']) ? _0x2e0b0f['models']['length'] : 0x0,
        _0x385bcc = (Array['isArray'](_0x2e0b0f?.['models']) ? _0x2e0b0f['models'] : [])['filter'](
          isCustomProviderModelCapabilityRecognized,
        )['length'],
        _0x51e359 = Number(_0x16338b?.['analysis']?.['agentRepairAttempts'] || 0x0) > 0x0,
        _0xa4df51 =
          _0x385bcc < _0x145657
            ? _0x51e359
              ? 'parametersVerifiedPartialAfterRepair'
              : 'parametersVerifiedPartial'
            : _0x51e359
              ? 'parametersVerifiedAfterRepair'
              : 'parametersVerified',
        _0x30951d = trCustomProvider(_0xa4df51, { count: _0x145657, documented: _0x385bcc });
      (_0x3c5eb6(_0x385bcc < _0x145657 ? 'partial' : 'success', _0x30951d),
        _0x4aef0b['showToast']?.(
          _0x30951d,
          _0x385bcc < _0x145657 ? 'warn' : 'success',
          _0x385bcc < _0x145657 ? 0x2328 : undefined,
        ));
    } finally {
      ((_0xffd6ce['verifyingModelKeys'] = new Set()),
        _0x2e05e3(_0x1f1868, _0xffd6ce['discovery'], _0xffd6ce['provider']),
        restoreCustomProviderModelSelectionScroll(_0x5ba190, _0x408385),
        _0x3961b4(),
        _0x4f74b3(_0x1f1868));
    }
  }
  function _0x2402bb() {
    const { cardEl: _0x3310d5, editorEl: _0x1c48c7 } = _0x1c4a39();
    if (!_0x3310d5) return;
    (_0x41d77f(),
      _0x1c48c7?.['addEventListener']('input', (_0x502ceb) => {
        if (
          !_0x502ceb['target']?.['matches']?.(
            '[data-custom-provider-base-url], [data-custom-provider-api-key], [data-custom-provider-documentation-url]',
          )
        )
          return;
        const _0x116d6c = _0x502ceb['target']['closest']('[data-custom-provider-editor-id]'),
          _0x5a3518 = _0x497e40(_0x116d6c);
        ((_0x5a3518['parameterDraft'] = null),
          (_0x5a3518['recognitionInvalidated'] = !![]),
          _0x4f74b3(_0x116d6c));
      }),
      _0x1c48c7?.['addEventListener']('focusin', (_0x59c8cb) => {
        const _0x85f799 = _0x59c8cb['target']?.['closest']?.('[data-custom-provider-editor-id]');
        _0x85f799 && _0x1c48c7['contains'](_0x85f799) && _0x3719ed(_0x85f799);
      }),
      _0x1c48c7?.['addEventListener'](
        'wheel',
        (_0x3132df) => handleCustomProviderResultWheel(_0x3132df, _0x1c48c7),
        { passive: ![] },
      ),
      _0x1c48c7?.['addEventListener']('click', (_0x4bf086) => {
        const _0x695d82 = _0x4bf086['target']?.['closest']?.('[data-custom-provider-editor-id]');
        _0x695d82 && _0x1c48c7['contains'](_0x695d82) && _0x3719ed(_0x695d82);
        const _0x4fd473 = _0x4bf086['target']?.['closest']?.('[data-custom-provider-add]');
        if (_0x4fd473 && _0x1c48c7['contains'](_0x4fd473)) {
          _0x5ee6ea();
          return;
        }
        const _0x5aa70b = _0x4bf086['target']?.['closest']?.('[data-custom-provider-delete]');
        if (_0x5aa70b && _0x1c48c7['contains'](_0x5aa70b)) {
          const _0x276358 = _0x5aa70b['closest']('[data-custom-provider-editor-id]');
          _0x50732f(_0x276358, _0x5aa70b)['catch'](() => {});
          return;
        }
        const _0x2787b2 = _0x4bf086['target']?.['closest']?.('[data-custom-provider-select-document]');
        if (_0x2787b2 && _0x1c48c7['contains'](_0x2787b2)) {
          const _0x8ab17c = _0x2787b2['closest']('[data-custom-provider-editor-id]'),
            { documentationFileEl: _0x4a81f3 } = _0x20560a(_0x8ab17c);
          if (_0x4a81f3) _0x4a81f3['value'] = '';
          _0x4a81f3?.['click']?.();
          return;
        }
        const _0x3d89f5 = _0x4bf086['target']?.['closest']?.('[data-custom-provider-discover]');
        if (_0x3d89f5 && _0x1c48c7['contains'](_0x3d89f5)) {
          const _0x4f85f8 = _0x3d89f5['closest']('[data-custom-provider-editor-id]');
          _0x321cc3(_0x4f85f8, _0x3d89f5)['catch'](() => {});
          return;
        }
        const _0x3d7cd5 = _0x4bf086['target']?.['closest']?.('[data-custom-provider-save-selected]');
        if (_0x3d7cd5 && _0x1c48c7['contains'](_0x3d7cd5)) {
          const _0x306c66 = _0x3d7cd5['closest']('[data-custom-provider-editor-id]');
          _0x50d0ec(_0x306c66, _0x3d7cd5)['catch'](() => {});
          return;
        }
        const _0x145e70 = _0x4bf086['target']?.['closest']?.('[data-custom-provider-verify-params]');
        if (_0x145e70 && _0x1c48c7['contains'](_0x145e70)) {
          const _0x3a0817 = _0x145e70['closest']('[data-custom-provider-editor-id]');
          _0x15a880(_0x3a0817, _0x145e70)['catch'](_0x50f75d);
          return;
        }
        const _0x3cd463 = _0x4bf086['target']?.['closest']?.('[data-custom-provider-kind-filter]');
        if (_0x3cd463 && _0x1c48c7['contains'](_0x3cd463)) {
          const _0x467d14 = _0x3cd463['closest']('[data-custom-provider-editor-id]'),
            _0x6bbdb1 = String(_0x3cd463['dataset']['customProviderKindFilter'] || 'all');
          if (!CUSTOM_PROVIDER_FILTER_KINDS['includes'](_0x6bbdb1)) return;
          const _0x5c7c71 = _0x497e40(_0x467d14);
          ((_0x5c7c71['activeKindFilter'] = _0x6bbdb1),
            (_0x5c7c71['provider'] = {
              ...(_0x5c7c71['provider'] || {}),
              name: _0x3ef2b5(_0x467d14, _0x5c7c71['provider']),
            }),
            _0x2e05e3(_0x467d14, _0x5c7c71['discovery'], _0x5c7c71['provider']));
          return;
        }
        const _0x17be7e = _0x4bf086['target']?.['closest']?.('[data-custom-provider-assign-kind]');
        if (_0x17be7e && _0x1c48c7['contains'](_0x17be7e)) {
          (_0x4bf086['preventDefault'](), _0x4bf086['stopPropagation']());
          const _0x42bd0c = _0x17be7e['closest']('[data-custom-provider-editor-id]'),
            _0x5e25ab = _0x17be7e['closest']('[data-custom-provider-model-kind-toolbar]'),
            _0x5d459a = String(_0x5e25ab?.['dataset']['customProviderModelKindToolbar'] || ''),
            _0x9baac9 = String(_0x17be7e['dataset']['customProviderAssignKind'] || '');
          if (!_0x42bd0c || !_0x5d459a || !CUSTOM_PROVIDER_SELECTABLE_KINDS['includes'](_0x9baac9)) return;
          const _0x732455 = _0x497e40(_0x42bd0c);
          (_0x732455['assignedModelKinds']['set'](_0x5d459a, _0x9baac9),
            _0x732455['selectedModelKeys']['add'](_0x5d459a),
            delete _0x42bd0c['dataset']['customProviderSyncedBundle'],
            _0x483393(_0x42bd0c, _0x732455['discovery'], _0x732455['provider']));
          return;
        }
      }),
      _0x1c48c7?.['addEventListener']('dblclick', (_0x157c8e) => {
        const _0x7db82b = _0x157c8e['target']?.['closest']?.('[data-custom-provider-editor-tab]');
        if (!_0x7db82b || !_0x1c48c7['contains'](_0x7db82b)) return;
        const _0x3e531c = _0x7db82b['closest']('[data-custom-provider-editor-id]');
        (_0x3719ed(_0x3e531c), _0x12d823(_0x3e531c));
      }),
      _0x1c48c7['addEventListener']('change', (_0x34de44) => {
        const _0x27af3c = _0x34de44['target']?.['closest']?.('[data-custom-provider-documentation-file]');
        if (_0x27af3c && _0x1c48c7['contains'](_0x27af3c)) {
          const _0x4323f3 = _0x27af3c['closest']('[data-custom-provider-editor-id]');
          _0x39dda3(_0x4323f3, _0x27af3c)['catch'](() => {});
          return;
        }
        const _0x2eeabb = _0x34de44['target']?.['closest']?.('[data-custom-provider-model-checkbox]');
        if (!_0x2eeabb || !_0x1c48c7['contains'](_0x2eeabb)) return;
        const _0x2a4fb1 = _0x2eeabb['closest']('[data-custom-provider-model-key]'),
          _0x420d20 = _0x2eeabb['closest']('[data-custom-provider-editor-id]');
        if (_0x2a4fb1 && _0x420d20) {
          const _0x13d241 = String(_0x2a4fb1['dataset']['customProviderModelKey'] || '');
          if (!_0x13d241) return;
          const _0x391d18 = _0x497e40(_0x420d20),
            _0x43a203 = String(_0x2a4fb1['dataset']['customProviderDetectedKind'] || 'unknown'),
            _0x5cb408 = !!_0x2eeabb['checked'],
            _0xe1a7b9 = applyCustomProviderModelSelectionState(_0x391d18, {
              modelKey: _0x13d241,
              detectedKind: _0x43a203,
              selected: _0x5cb408,
            });
          delete _0x420d20['dataset']['customProviderSyncedBundle'];
          if (_0xe1a7b9) {
            _0x483393(_0x420d20, _0x391d18['discovery'], _0x391d18['provider']);
            return;
          }
          (_0x2a4fb1['classList']['toggle']('is-selected', _0x5cb408), _0x4f74b3(_0x420d20));
        }
      }),
      _0x1c48c7['addEventListener']('input', (_0x240cc5) => {
        const _0x496eb7 = _0x240cc5['target']?.['closest']?.('[data-custom-provider-documentation-url]');
        if (!_0x496eb7 || !_0x1c48c7['contains'](_0x496eb7)) return;
        const _0x127054 = _0x496eb7['closest']('[data-custom-provider-editor-id]');
        _0x497e40(_0x127054)['documentationDocument'] && _0x48a605(_0x127054);
      }),
      trackRuntimeManifestLoad(_0x1068f6({ silent: !![] }))['catch'](() => {}));
  }
  return {
    init: _0x2402bb,
    refreshBundles: _0x1068f6,
    syncConfigSnapshot(_0x5678ae) {
      _0x6cada3 = _0x5678ae || {};
    },
    syncDefaults: _0x16ad8f,
    syncEditorCredentials: _0xba173,
  };
}
