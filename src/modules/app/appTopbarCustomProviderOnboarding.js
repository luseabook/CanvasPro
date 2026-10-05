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
function trTemplate(value, item = {}) {
  let t2 = t(value);
  return (
    Object['entries'](item || {})['forEach'](([key, index]) => {
      t2 = t2['split']('{' + key + '}')['join'](String(index ?? ''));
    }),
    t2
  );
}
function trApiInput(result, data = {}) {
  return trTemplate('settings.apiInput.' + result, data);
}
function trCustomProvider(options, target = {}) {
  return trApiInput('customProvider.' + options, target);
}
function markNonLoginTextInput(el) {
  if (!el) return;
  ((el['autocomplete'] = 'off'),
    el['setAttribute']('autocomplete', 'off'),
    el['setAttribute']('autocapitalize', 'off'),
    el['setAttribute']('spellcheck', 'false'),
    el['setAttribute']('data-form-type', 'other'));
}
function markApiSecretInput(el2) {
  if (!el2) return;
  ((el2['autocomplete'] = 'new-password'),
    el2['setAttribute']('autocomplete', 'new-password'),
    el2['setAttribute']('autocapitalize', 'off'),
    el2['setAttribute']('spellcheck', 'false'),
    el2['setAttribute']('data-lpignore', 'true'),
    el2['setAttribute']('data-1p-ignore', 'true'),
    el2['setAttribute']('data-form-type', 'other'));
}
export function createCustomProviderOnboardingController({
  store: store,
  saveApiConfigToServer: saveApiConfigToServer,
  discoverCustomProvider: discoverCustomProvider,
  analyzeCustomProviderDocumentation: analyzeCustomProviderDocumentation,
  buildCustomProviderManifestDraft: buildCustomProviderManifestDraft,
  validateCustomProviderManifestDraft: validateCustomProviderManifestDraft,
  saveCustomProviderManifestBundle: saveCustomProviderManifestBundle,
  listCustomProviderManifestBundles: listCustomProviderManifestBundles,
  deleteCustomProviderManifestBundle: deleteCustomProviderManifestBundle,
  refreshManifestModelNodeUis: refreshManifestModelNodeUis,
  showError: showError = null,
  syncModelServiceReadinessSummary: syncModelServiceReadinessSummary = () => {},
  getConfigSnapshot: getConfigSnapshot = () => ({}),
  onConfigSnapshotChange: onConfigSnapshotChange = () => {},
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const cardEl = documentObject,
    source = windowObject;
  let configSnapshot = getConfigSnapshot() || {};
  const providerStatusTooltipController = createProviderStatusTooltipController(),
    map = new Map();
  function run(next) {
    ((configSnapshot = next || {}), onConfigSnapshotChange(configSnapshot));
  }
  function run2() {
    return {
      cardEl: cardEl['getElementById']('customProviderDiscoveryCard'),
      statusEl: cardEl['getElementById']('customProviderDiscoveryStatus'),
      editorListEl: cardEl['getElementById']('customProviderEditors'),
      addBtnEl: cardEl['getElementById']('btnCustomProviderAdd'),
      editorEl: cardEl['getElementById']('customProviderEditor'),
    };
  }
  const enabled = {
    activeEditorId: 'custom-provider-editor-1',
    editorSequence: 1,
    editorStates: new Map(),
  };
  function run3() {
    const { editorListEl: editorListEl } = run2();
    return Array['from'](editorListEl?.['querySelectorAll']?.('[data-custom-provider-editor-id]') || []);
  }
  function run4(baseUrlEl) {
    return {
      baseUrlEl:
        baseUrlEl?.['querySelector']?.('[data-custom-provider-base-url]') ||
        cardEl['getElementById']('customProviderBaseUrl'),
      apiKeyEl:
        baseUrlEl?.['querySelector']?.('[data-custom-provider-api-key]') ||
        cardEl['getElementById']('customProviderApiKey'),
      documentationUrlEl:
        baseUrlEl?.['querySelector']?.('[data-custom-provider-documentation-url]') ||
        cardEl['getElementById']('customProviderDocumentationUrl'),
      documentationFileEl:
        baseUrlEl?.['querySelector']?.('[data-custom-provider-documentation-file]') ||
        cardEl['querySelector']('#customProviderDiscoveryCard [data-custom-provider-documentation-file]'),
    };
  }
  function run5(el3) {
    return String(el3?.['dataset']?.['customProviderEditorId'] || '')['trim']();
  }
  function run6(current) {
    const enabled2 = run5(current);
    if (!enabled2)
      return {
        discovery: null,
        provider: null,
        activeKindFilter: 'all',
        selectedModelKeys: new Set(),
        assignedModelKinds: new Map(),
        verifyingModelKeys: new Set(),
        isAddingModels: false,
        documentationDocument: null,
        titleText: '',
        titleManuallyEdited: false,
      };
    return (
      !enabled['editorStates']['has'](enabled2) &&
        enabled['editorStates']['set'](enabled2, {
          discovery: null,
          provider: null,
          activeKindFilter: 'all',
          selectedModelKeys: new Set(),
          assignedModelKinds: new Map(),
          verifyingModelKeys: new Set(),
          isAddingModels: false,
          documentationDocument: null,
          titleText: '',
          titleManuallyEdited: false,
        }),
      enabled['editorStates']['get'](enabled2)
    );
  }
  function run7(bodyEl) {
    return {
      bodyEl: bodyEl?.['querySelector']?.('[data-custom-provider-editor-body]'),
      tabBtnEl: bodyEl?.['querySelector']?.('[data-custom-provider-editor-tab]'),
      deleteBtnEl: bodyEl?.['querySelector']?.('[data-custom-provider-delete]'),
      discoverBtnEl: bodyEl?.['querySelector']?.('[data-custom-provider-discover]'),
      resultEl: bodyEl?.['querySelector']?.('[data-custom-provider-result]'),
      resultInnerEl: bodyEl?.['querySelector']?.('[data-custom-provider-result-inner]'),
      actionsEl: bodyEl?.['querySelector']?.('[data-custom-provider-actions]'),
      saveSelectedBtnEl: bodyEl?.['querySelector']?.('[data-custom-provider-save-selected]'),
      verifyParamsBtnEl: bodyEl?.['querySelector']?.('[data-custom-provider-verify-params]'),
    };
  }
  function run8(value2 = null) {
    const entry = run5(value2) || enabled['activeEditorId'];
    run3()['forEach']((el4) => {
      const enabled3 = run5(el4) === entry,
        { bodyEl: bodyEl2, tabBtnEl: tabBtnEl } = run7(el4);
      (el4['classList']['toggle']('is-active', enabled3),
        bodyEl2 &&
          ((bodyEl2['hidden'] = !enabled3),
          bodyEl2['setAttribute']('aria-hidden', enabled3 ? 'false' : 'true')),
        tabBtnEl && tabBtnEl['setAttribute']('aria-selected', enabled3 ? 'true' : 'false'));
    });
  }
  function run9(el5, record = {}) {
    if (!el5) return;
    const enabled4 = String(el5['dataset']['customProviderEditorId'] || '')['trim']();
    if (!enabled4) return;
    const payload = enabled['activeEditorId'] !== enabled4,
      { editorListEl: editorListEl2 } = run2();
    (stabilizeCustomProviderEditorListHeight(editorListEl2),
      (enabled['activeEditorId'] = enabled4),
      run8(el5),
      stabilizeCustomProviderEditorListHeight(editorListEl2));
    if (payload || record['clearStatus']) run10('', '');
  }
  function run11() {
    const list = run3(),
      handle = list['find'](
        (el6) => String(el6['dataset']['customProviderEditorId'] || '') === enabled['activeEditorId'],
      );
    return handle || list['find']((el7) => el7['classList']['contains']('is-active')) || list[0] || null;
  }
  function run12() {
    return run4(run11());
  }
  function run13(state) {
    const config = String(state || '')['trim']();
    return config ? 'custom-provider:' + config : '';
  }
  function run14(scope) {
    return map['get'](run13(scope)) || null;
  }
  function run15(input) {
    const output = run6(input),
      value3 = String(output['provider']?.['providerId'] || '')['trim']();
    if (value3) return value3;
    return String(run16(input)['providerId'] || '')['trim']();
  }
  function run17(value4) {
    const enabled5 = run15(value4);
    if (!enabled5) return false;
    const enabled6 = run6(value4),
      value5 = run13(enabled5);
    return !!enabled6['provider'] || map['has'](value5);
  }
  function run18(value6) {
    return String(value6 || '')
      ['trim']()
      ['replace'](/\s+/g, ' ');
  }
  function run19(value7) {
    const list2 = run3(),
      index2 = Math['max'](0, list2['indexOf'](value7));
    return trCustomProvider('providerDraftTitle', { index: index2 + 1 });
  }
  function run20(value8) {
    const value9 = run6(value8);
    return run18(value9['titleText']) || run19(value8);
  }
  function run21(el8) {
    const el9 = el8?.['querySelector']?.('[data-custom-provider-editor-title]'),
      el10 = el8?.['querySelector']?.('[data-custom-provider-editor-tab]'),
      value10 = run20(el8);
    (el9 && (el9['removeAttribute']('data-i18n'), (el9['textContent'] = value10)),
      el10?.['setAttribute']('aria-label', value10));
  }
  function run22() {
    run3()['forEach']((value11) => {
      run21(value11);
    });
  }
  function run23(enabled7, value12, value13 = {}) {
    if (!enabled7) return;
    const value14 = run6(enabled7),
      value15 = run18(value12);
    value14['titleText'] = value15;
    if (value13['manual'] === true) value14['titleManuallyEdited'] = true;
    else value13['manual'] === false && (value14['titleManuallyEdited'] = false);
    run21(enabled7);
  }
  function run24(enabled8) {
    if (!enabled8) return;
    const value16 = run6(enabled8);
    ((value16['titleText'] = ''), (value16['titleManuallyEdited'] = false), run21(enabled8));
  }
  function run25(enabled9, value17) {
    if (!enabled9) return;
    const value18 = run6(enabled9);
    if (value18['titleManuallyEdited']) return;
    const enabled10 = run18(value17);
    if (!enabled10) return;
    ((value18['titleText'] = enabled10), run21(enabled9));
  }
  function run26(el11) {
    if (!el11) return;
    const { tabBtnEl: tabBtnEl2, deleteBtnEl: deleteBtnEl } = run7(el11);
    if (!tabBtnEl2 || el11['querySelector']('[data-custom-provider-editor-title-input]')) return;
    const enabled11 = run6(el11),
      value19 = enabled11['titleText'],
      value20 = !!enabled11['titleManuallyEdited'],
      value21 = run20(el11),
      el12 = cardEl['createElement']('input');
    ((el12['type'] = 'text'),
      (el12['className'] = 'custom-provider-editor-title-input'),
      (el12['dataset']['customProviderEditorTitleInput'] = ''),
      (el12['value'] = value21),
      el12['setAttribute']('aria-label', value21));
    let value22 = false;
    const run27 = (value23) => {
      if (value22) return;
      ((value22 = true),
        el12['removeEventListener']('blur', run28),
        el12['removeEventListener']('keydown', run29));
      if (value23) {
        const value24 = run18(el12['value']);
        value24
          ? value20 || value24 !== value21
            ? run23(el11, value24, { manual: true })
            : ((enabled11['titleText'] = value19), (enabled11['titleManuallyEdited'] = value20), run21(el11))
          : ((enabled11['titleText'] = value19), (enabled11['titleManuallyEdited'] = value20), run21(el11));
      } else ((enabled11['titleText'] = value19), (enabled11['titleManuallyEdited'] = value20), run21(el11));
      ((tabBtnEl2['hidden'] = false), el12['remove'](), tabBtnEl2['focus']?.());
    };
    function run28() {
      run27(true);
    }
    function run29(event) {
      if (event['key'] === 'Enter') (event['preventDefault'](), run27(true));
      else event['key'] === 'Escape' && (event['preventDefault'](), run27(false));
    }
    (el12['addEventListener']('blur', run28),
      el12['addEventListener']('keydown', run29),
      (tabBtnEl2['hidden'] = true),
      tabBtnEl2['parentElement']?.['insertBefore'](el12, deleteBtnEl || tabBtnEl2['nextSibling']),
      el12['focus']?.(),
      el12['select']?.());
  }
  function run30() {
    const list3 = run3();
    list3['forEach']((value25) => {
      const { deleteBtnEl: deleteBtnEl2 } = run7(value25);
      if (deleteBtnEl2) deleteBtnEl2['hidden'] = list3['length'] <= 1 && !run17(value25);
    });
  }
  function run31(el13) {
    const list4 = run3();
    if (!el13 || list4['length'] <= 1) return;
    const value26 = run5(el13),
      value27 = list4['indexOf'](el13),
      value28 = list4[value27 + 1] || list4[value27 - 1] || null;
    (enabled['editorStates']['delete'](value26),
      el13['remove'](),
      run22(),
      run30(),
      value28 && run9(value28, { clearStatus: true }));
  }
  async function run32(value29) {
    if (typeof saveApiConfigToServer !== 'function') return;
    const enabled12 = String(value29 || '')['trim']();
    if (!enabled12 || !configSnapshot?.['providers']?.[enabled12]) return;
    const providers = { ...(configSnapshot['providers'] || {}) };
    delete providers[enabled12];
    const value30 = { ...(configSnapshot || {}), providers: providers };
    (await saveApiConfigToServer(value30),
      run(value30),
      syncModelServiceReadinessSummary(value30),
      refreshManifestModelNodeUis?.());
  }
  async function run33(value31) {
    const enabled13 = String(value31 || '')['trim']();
    if (!enabled13) return;
    const value32 = run13(enabled13),
      value33 = map['get'](value32);
    if (typeof deleteCustomProviderManifestBundle === 'function' && value32)
      try {
        await deleteCustomProviderManifestBundle(value32);
      } catch (error) {
        const list5 = String(error?.['message'] || error || '')['toLowerCase']();
        if (!list5['includes']('not found') && !list5['includes']('404')) throw error;
      }
    if (value33) {
      try {
        unregisterManifestBundle(value33);
      } catch (value34) {
        console['warn']('[Custom Provider] unregister deleted bundle failed:', value34);
      }
      map['delete'](value32);
    }
    await run32(enabled13);
  }
  function run34(el14) {
    const {
      baseUrlEl: baseUrlEl2,
      apiKeyEl: apiKeyEl,
      documentationUrlEl: documentationUrlEl,
      documentationFileEl: documentationFileEl,
    } = run4(el14);
    if (baseUrlEl2) baseUrlEl2['value'] = '';
    if (apiKeyEl) apiKeyEl['value'] = '';
    if (documentationUrlEl) documentationUrlEl['value'] = '';
    if (documentationFileEl) documentationFileEl['value'] = '';
    ((run6(el14)['documentationDocument'] = null),
      el14?.['dataset'] &&
        (delete el14['dataset']['customProviderProviderId'],
        delete el14['dataset']['customProviderSyncedBundle']),
      run35(el14),
      run24(el14),
      run10('', ''));
  }
  async function run36(enabled14, el15) {
    if (!enabled14) return;
    const value35 = run17(enabled14),
      value36 = value35 ? run15(enabled14) : '';
    if (el15) el15['disabled'] = true;
    try {
      value35 && (await run33(value36));
      const list6 = run3();
      list6['length'] <= 1
        ? (run34(enabled14), run22(), run30(), run9(enabled14, { clearStatus: true }))
        : run31(enabled14);
      if (value36) {
        const trCustomProvider2 = trCustomProvider('deleteSuccess'),
          rememberedCustomProviderConfigs = getRememberedCustomProviderConfigs(configSnapshot?.['providers'])[
            'length'
          ]
            ? 'configured'
            : 'unconfigured';
        (run10(rememberedCustomProviderConfigs, trApiInput('statuses.' + rememberedCustomProviderConfigs)),
          source['showToast']?.(trCustomProvider2, 'success'));
      }
    } catch (error2) {
      const trCustomProvider3 = trCustomProvider('deleteFailed', {
        error: error2?.['message'] || trApiInput('diagnostics.unknownError'),
      });
      (run10('danger', trApiInput('diagnostics.failed'), trCustomProvider3),
        source['showToast']?.(trCustomProvider3, 'error', 9000));
    } finally {
      if (el15) el15['disabled'] = false;
    }
  }
  function run37() {
    const editorId = 'custom-provider-editor-' + (enabled['editorSequence'] + 1);
    enabled['editorSequence'] += 1;
    const customProviderEditorShell = createCustomProviderEditorShell({
        documentObject: cardEl,
        editorId: editorId,
        tutorialLabel: trCustomProvider('tutorial'),
        discoverLabel: trCustomProvider('discover'),
        deleteAriaLabel: trCustomProvider('deleteProviderDraft'),
      }),
      el16 = cardEl['createElement']('div');
    ((el16['className'] = 'custom-provider-editor-item-body'),
      (el16['dataset']['customProviderEditorBody'] = ''),
      (el16['hidden'] = true),
      el16['setAttribute']('aria-hidden', 'true'));
    const value37 = cardEl['createElement']('div');
    value37['className'] = 'custom-provider-discovery-grid';
    const value38 = cardEl['createElement']('div');
    value38['className'] = 'custom-provider-discovery-field custom-provider-discovery-field--wide';
    const value39 = run38('settings-label', trCustomProvider('baseUrl')),
      el17 = cardEl['createElement']('input');
    ((el17['type'] = 'text'),
      (el17['className'] = 'settings-input'),
      (el17['placeholder'] = trCustomProvider('baseUrlPlaceholder')),
      (el17['dataset']['customProviderBaseUrl'] = ''),
      markNonLoginTextInput(el17),
      value38['append'](value39, el17));
    const value40 = cardEl['createElement']('div');
    value40['className'] = 'custom-provider-discovery-field custom-provider-discovery-field--wide';
    const value41 = run38('settings-label', trCustomProvider('apiKey')),
      el18 = cardEl['createElement']('input');
    ((el18['type'] = 'password'),
      (el18['className'] = 'settings-input'),
      (el18['placeholder'] = trCustomProvider('apiKeyPlaceholder')),
      (el18['dataset']['customProviderApiKey'] = ''),
      markApiSecretInput(el18),
      value40['append'](value41, el18));
    const value42 = cardEl['createElement']('div');
    value42['className'] = 'custom-provider-discovery-field custom-provider-discovery-field--wide';
    const value43 = run38('settings-label', trCustomProvider('documentationUrl'));
    value43['append'](run39(trCustomProvider('documentationAgentHint')));
    const el19 = cardEl['createElement']('input');
    ((el19['type'] = 'text'),
      (el19['className'] = 'settings-input'),
      (el19['placeholder'] = trCustomProvider('documentationUrlPlaceholder')),
      (el19['dataset']['customProviderDocumentationUrl'] = ''),
      markNonLoginTextInput(el19));
    const value44 = cardEl['createElement']('div');
    value44['className'] = 'custom-provider-documentation-input-row';
    const el20 = cardEl['createElement']('button');
    ((el20['type'] = 'button'),
      (el20['className'] = 'settings-save-btn settings-btn-ghost custom-provider-documentation-file-btn'),
      (el20['dataset']['customProviderSelectDocument'] = ''),
      (el20['textContent'] = trCustomProvider('selectDocumentationFile')));
    const el21 = cardEl['createElement']('input');
    ((el21['type'] = 'file'),
      (el21['hidden'] = true),
      (el21['accept'] = '.md,.txt,.json,.yaml,.yml,.html,.htm'),
      (el21['dataset']['customProviderDocumentationFile'] = ''),
      value44['append'](el19, el20, el21),
      value42['append'](value43, value44),
      value37['append'](value38, value40, value42));
    const el22 = cardEl['createElement']('div');
    ((el22['className'] = 'custom-provider-discovery-result'),
      (el22['dataset']['customProviderResult'] = ''),
      (el22['hidden'] = true),
      el22['setAttribute']('aria-hidden', 'true'));
    const el23 = cardEl['createElement']('div');
    ((el23['className'] = 'custom-provider-discovery-result-inner'),
      (el23['dataset']['customProviderResultInner'] = ''),
      el22['append'](el23));
    const el24 = cardEl['createElement']('div');
    ((el24['className'] = 'custom-provider-discovery-actions'),
      (el24['dataset']['customProviderActions'] = ''),
      (el24['hidden'] = true));
    const el25 = cardEl['createElement']('button');
    ((el25['type'] = 'button'),
      (el25['className'] = 'settings-save-btn settings-btn-ghost settings-api-test-btn'),
      (el25['dataset']['customProviderVerifyParams'] = ''));
    const value45 = cardEl['querySelector']('[data-provider-test] .settings-btn-icon')?.['cloneNode'](
      true,
    );
    if (value45) el25['append'](value45);
    const el26 = cardEl['createElement']('span');
    ((el26['className'] = 'settings-btn-label'),
      (el26['dataset']['i18n'] = 'settings.apiInput.customProvider.verifyParameters'),
      (el26['textContent'] = trCustomProvider('verifyParameters')),
      el25['append'](el26),
      (el25['hidden'] = true),
      (el25['disabled'] = true));
    const el27 = cardEl['createElement']('button');
    return (
      (el27['type'] = 'button'),
      (el27['className'] = 'settings-save-btn'),
      (el27['dataset']['customProviderSaveSelected'] = ''),
      (el27['dataset']['i18n'] = 'settings.apiInput.customProvider.saveModels'),
      (el27['textContent'] = trCustomProvider('saveModels')),
      (el27['hidden'] = true),
      (el27['disabled'] = true),
      el24['append'](el25, el27),
      el16['append'](value37, el22, el24),
      customProviderEditorShell['append'](el16),
      customProviderEditorShell
    );
  }
  function run40() {
    const list7 = run3();
    (list7['forEach']((el28, value46) => {
      !el28['dataset']['customProviderEditorId'] &&
        (el28['dataset']['customProviderEditorId'] = 'custom-provider-editor-' + (value46 + 1));
      const value47 = String(el28['dataset']['customProviderEditorId'] || '')['match'](/(\d+)$/);
      value47 &&
        (enabled['editorSequence'] = Math['max'](enabled['editorSequence'], Number(value47[1]) || 1));
    }),
      run9(run11() || list7[0]),
      run22(),
      run30(),
      run8(run11()));
  }
  function run41(value48) {
    const enabled15 = String(value48 || '')['trim']();
    if (!enabled15) return '';
    if (/^[a-z][a-z0-9+.-]*:\/\//i['test'](enabled15)) return enabled15;
    return 'https://' + enabled15;
  }
  function run42(value49) {
    const enabled16 = run41(value49);
    if (!enabled16) return '';
    try {
      return new URL(enabled16)['hostname']['replace'](/^www\./i, '');
    } catch {
      return String(value49 || '')
        ['trim']()
        ['replace'](/^[a-z][a-z0-9+.-]*:\/\//i, '')
        ['split'](/[/?#]/)[0]
        ['replace'](/^www\./i, '');
    }
  }
  function run43(value50) {
    return run42(value50) || '';
  }
  function run44(value51) {
    const value52 = (run42(value51) || String(value51 || '')['trim']())['toLowerCase'](),
      value53 = value52['replace'](/[^a-z0-9_-]+/g, '_')
        ['replace'](/^_+|_+$/g, '')
        ['replace'](/_{2,}/g, '_'),
      value54 = value53 || 'provider';
    return value54['startsWith']('custom_') ? value54 : 'custom_' + value54;
  }
  function run45(value55) {
    const value56 = run6(value55),
      value57 = String(value56['provider']?.['providerId'] || '')['trim']();
    if (value57) return value57;
    const value58 = run16(value55);
    return value58['baseUrl'] ? String(value58['providerId'] || '')['trim']() : '';
  }
  function run46(value59, value60) {
    const enabled17 = String(value60 || '')['trim']();
    if (!enabled17) return false;
    return run3()['some']((value61) => value61 !== value59 && run45(value61) === enabled17);
  }
  function run47(value62, value63) {
    if (!run46(value62, value63)) return false;
    const trCustomProvider4 = trCustomProvider('duplicateProviderDomain'),
      { baseUrlEl: baseUrlEl3 } = run4(value62);
    return (
      run10('danger', trApiInput('diagnostics.failed'), trCustomProvider4),
      source['showToast']?.(trCustomProvider4, 'warn', 7000),
      baseUrlEl3?.['focus']?.(),
      true
    );
  }
  function run48(value64) {
    const value65 = String(value64 || 'unknown')
        ['trim']()
        ['toLowerCase'](),
      value66 = CUSTOM_PROVIDER_KIND_LABEL_KEYS[value65] || CUSTOM_PROVIDER_KIND_LABEL_KEYS['unknown'];
    return trCustomProvider(value66);
  }
  function run49(value67) {
    return String(value67 || '')
      ['trim']()
      ['toLowerCase']() === 'documented'
      ? trCustomProvider('capabilityDocumented')
      : trCustomProvider('capabilityUnverified');
  }
  function run50(value68) {
    return String(value68 || '')
      ['trim']()
      ['toLowerCase']() === 'documented'
      ? trCustomProvider('capabilityDocumentedHint')
      : trCustomProvider('capabilityUnverifiedHint');
  }
  function run10(value69, value70, value71 = '') {
    const { statusEl: statusEl } = run2();
    if (!statusEl) return;
    (providerStatusTooltipController['bind'](statusEl),
      statusEl['classList']['remove'](...PROVIDER_TEST_STATUS_CLASSES));
    const enabled18 = String(value70 || '')['trim']();
    if (!enabled18) {
      (providerStatusTooltipController['hide'](statusEl),
        (statusEl['hidden'] = true),
        (statusEl['textContent'] = ''),
        delete statusEl['dataset']['detail'],
        statusEl['removeAttribute']('title'),
        statusEl['removeAttribute']('aria-label'),
        statusEl['removeAttribute']('tabindex'),
        statusEl['removeAttribute']('data-provider-test-tooltip'));
      return;
    }
    const value72 = String(value69 || '')['trim']();
    value72 && statusEl['classList']['add']('settings-provider-status--' + value72);
    statusEl['textContent'] = enabled18;
    const value73 = String(value71 || '')['trim']();
    (value73
      ? ((statusEl['dataset']['detail'] = value73),
        statusEl['setAttribute']('data-provider-test-tooltip', value73),
        statusEl['setAttribute']('aria-label', value73),
        statusEl['setAttribute']('tabindex', '0'))
      : (providerStatusTooltipController['hide'](statusEl),
        delete statusEl['dataset']['detail'],
        statusEl['removeAttribute']('data-provider-test-tooltip'),
        statusEl['removeAttribute']('aria-label'),
        statusEl['removeAttribute']('tabindex')),
      statusEl['removeAttribute']('title'),
      (statusEl['hidden'] = false));
  }
  function run51(el29, value74) {
    if (!el29) return () => {};
    const el30 = el29['querySelector']?.('.settings-btn-label'),
      value75 = el30?.['textContent'] || el29['textContent'];
    el29['disabled'] = true;
    if (el30) el30['textContent'] = value74;
    else el29['textContent'] = value74;
    return () => {
      el29['disabled'] = false;
      if (el30) el30['textContent'] = value75;
      else el29['textContent'] = value75;
    };
  }
  function run52(value76) {
    const value77 = String(value76 || '')
      ['trim']()
      ['toLowerCase']()
      ['match'](/(\.[^.]+)$/);
    return value77?.[1] || '';
  }
  function run53(value78) {
    const value79 = run6(value78);
    value79['documentationDocument'] = null;
    const { documentationFileEl: documentationFileEl2 } = run4(value78);
    if (documentationFileEl2) documentationFileEl2['value'] = '';
  }
  async function run54(enabled19, value80) {
    const name = value80?.['files']?.[0];
    if (!enabled19 || !name) return;
    const value81 = run6(enabled19);
    ((value81['parameterDraft'] = null), (value81['recognitionInvalidated'] = true), run55(enabled19));
    const value82 = run52(name['name']);
    if (!CUSTOM_PROVIDER_DOCUMENTATION_EXTENSIONS['has'](value82)) {
      (run53(enabled19), source['showToast']?.(trCustomProvider('localDocumentationUnsupported'), 'warn'));
      return;
    }
    if (Number(name['size'] || 0) > CUSTOM_PROVIDER_DOCUMENTATION_MAX_BYTES) {
      (run53(enabled19), source['showToast']?.(trCustomProvider('localDocumentationTooLarge'), 'warn'));
      return;
    }
    try {
      const text = await name['text'](),
        value83 = run6(enabled19);
      value83['documentationDocument'] = {
        name: String(name['name'] || '')['trim'](),
        contentType: String(name['type'] || '')['trim'](),
        text: text,
      };
      const { documentationUrlEl: documentationUrlEl2 } = run4(enabled19);
      documentationUrlEl2 &&
        (documentationUrlEl2['value'] = trCustomProvider('localDocumentationSelected', {
          name: name['name'],
        }));
    } catch (error3) {
      (run53(enabled19),
        source['showToast']?.(
          trCustomProvider('localDocumentationReadFailed', {
            error: error3?.['message'] || trApiInput('diagnostics.unknownError'),
          }),
          'error',
        ));
    }
  }
  function run16(value84 = run11()) {
    const {
        baseUrlEl: baseUrlEl4,
        apiKeyEl: apiKeyEl2,
        documentationUrlEl: documentationUrlEl3,
      } = run4(value84),
      baseUrl = run41(baseUrlEl4?.['value']),
      apiKey = String(apiKeyEl2?.['value'] || '')['trim'](),
      value85 = run6(value84),
      documentationDocument = value85['documentationDocument'],
      documentationUrl = documentationDocument ? '' : String(documentationUrlEl3?.['value'] || '')['trim'](),
      name2 = run43(baseUrl),
      providerId = run44(baseUrl);
    return {
      name: name2,
      providerId: providerId,
      baseUrl: baseUrl,
      apiKey: apiKey,
      documentationUrl: documentationUrl,
      documentationDocument: documentationDocument,
    };
  }
  function syncDefaults(options2 = {}) {
    const { baseUrlEl: baseUrlEl5, apiKeyEl: apiKeyEl3 } = run4(run3()[0]),
      value86 = options2?.['openai'] || {};
    (baseUrlEl5 &&
      !String(baseUrlEl5['value'] || '')['trim']() &&
      value86['apiUrl'] &&
      (baseUrlEl5['value'] = value86['apiUrl']),
      apiKeyEl3 &&
        !String(apiKeyEl3['value'] || '')['trim']() &&
        value86['apiKey'] &&
        (apiKeyEl3['value'] = value86['apiKey']));
  }
  function run38(value87, value88) {
    const el31 = cardEl['createElement']('div');
    return ((el31['className'] = value87), (el31['textContent'] = String(value88 || '')), el31);
  }
  function run39(value89) {
    const value90 = String(value89 || '')['trim'](),
      el32 = cardEl['createElement']('button');
    return (
      (el32['type'] = 'button'),
      (el32['className'] = 'custom-provider-info-tip'),
      el32['setAttribute']('aria-label', value90),
      (el32['textContent'] = '!'),
      (el32['dataset']['tooltip'] = value90),
      el32
    );
  }
  function run56(options3 = {}) {
    return String(options3?.['upstreamModelId'] || '')['trim']();
  }
  function run57(options4 = {}) {
    const list8 = [
        ...(Array['isArray'](options4?.['models']) ? options4['models'] : []),
        ...(Array['isArray'](options4?.['unknown']) ? options4['unknown'] : []),
      ],
      map2 = new Set();
    return list8['filter']((value91) => {
      const enabled20 = run56(value91);
      if (!enabled20 || map2['has'](enabled20)) return false;
      return (map2['add'](enabled20), true);
    });
  }
  function kind(value92, value93 = {}) {
    const value94 = String(value93?.['kind'] || 'unknown')
      ['trim']()
      ['toLowerCase']();
    if (CUSTOM_PROVIDER_SELECTABLE_KINDS['includes'](value94)) return value94;
    const value95 = run6(value92)['assignedModelKinds']['get'](run56(value93));
    return CUSTOM_PROVIDER_SELECTABLE_KINDS['includes'](value95) ? value95 : 'unknown';
  }
  function run58(value96, value97 = []) {
    return (Array['isArray'](value97) ? value97 : [])['filter']((value98) =>
      CUSTOM_PROVIDER_SELECTABLE_KINDS['includes'](kind(value96, value98)),
    );
  }
  function run59(value99) {
    const value100 = run6(value99);
    ((value100['activeKindFilter'] = 'all'),
      (value100['selectedModelKeys'] = new Set()),
      (value100['assignedModelKinds'] = new Map()),
      (value100['verifyingModelKeys'] = new Set()));
  }
  function run60(value101, value102 = []) {
    const value103 = run6(value101),
      value104 = CUSTOM_PROVIDER_FILTER_KINDS['includes'](value103['activeKindFilter'])
        ? value103['activeKindFilter']
        : 'all',
      list9 = Array['isArray'](value102) ? value102 : [];
    if (value104 === 'all') return list9;
    return list9['filter'](
      (value105) =>
        String(value105?.['kind'] || '')
          ['trim']()
          ['toLowerCase']() === value104,
    );
  }
  function run61(list10 = []) {
    const map3 = new Map(
      CUSTOM_PROVIDER_FILTER_KINDS['filter']((value106) => value106 !== 'all')['map']((value107) => [
        value107,
        0,
      ]),
    );
    return (
      (Array['isArray'](list10) ? list10 : [])['forEach']((value108) => {
        const value109 = String(value108?.['kind'] || 'unknown')
          ['trim']()
          ['toLowerCase']();
        map3['set'](value109, (map3['get'](value109) || 0) + 1);
      }),
      map3
    );
  }
  function run62(value110 = run11()) {
    const value111 = run6(value110),
      value112 = value111['discovery'] || {},
      map4 = value111['selectedModelKeys'],
      value113 = run57(value112);
    return run58(value110, value113)
      ['filter']((value114) => map4['has'](run56(value114)))
      ['map']((args) => ({ ...args, kind: kind(value110, args) }));
  }
  function run63(value115) {
    const value116 = run16(value115);
    return JSON['stringify']([
      value116['baseUrl'],
      value116['apiKey'],
      value116['documentationUrl'],
      value116['documentationDocument'],
    ]);
  }
  function run64(value117) {
    const value118 = run6(value117),
      list11 = run62(value117),
      models = value118['recognitionInvalidated']
        ? list11['map']((args2) => ({ ...args2, capabilityStatus: 'unverified' }))
        : list11,
      enabled21 = value118['parameterDraft'];
    if (!enabled21 || enabled21['context'] !== run63(value117)) return models;
    return mergeCustomProviderDiscoveryCapabilities({ models: models }, enabled21['bundle'])['models'];
  }
  function run55(el33 = run11()) {
    const {
      saveSelectedBtnEl: saveSelectedBtnEl,
      verifyParamsBtnEl: verifyParamsBtnEl,
      actionsEl: actionsEl,
    } = run7(el33);
    if (!saveSelectedBtnEl) return;
    const selectedCount = run62(el33)['length'],
      isAddingModels = run6(el33),
      hasDiscovery = !!isAddingModels['discovery'],
      hasSavedBundle = el33?.['dataset']?.['customProviderSyncedBundle'] === 'true',
      customProviderModelActionState = getCustomProviderModelActionState({
        hasDiscovery: hasDiscovery,
        hasSavedBundle: hasSavedBundle,
        isAddingModels: isAddingModels['isAddingModels'] === true,
        selectedCount: selectedCount,
        unverifiedCount: getCustomProviderModelsBlockingSave(run64(el33))['length'],
        busy: isAddingModels['verifyingModelKeys']['size'] > 0 || isAddingModels['saving'] === true,
      });
    ((saveSelectedBtnEl['disabled'] = customProviderModelActionState['saveDisabled']),
      (saveSelectedBtnEl['hidden'] = customProviderModelActionState['saveHidden']),
      (saveSelectedBtnEl['dataset']['i18n'] =
        'settings.apiInput.customProvider.' + customProviderModelActionState['saveLabelKey']),
      (saveSelectedBtnEl['textContent'] = trCustomProvider(customProviderModelActionState['saveLabelKey'])));
    verifyParamsBtnEl &&
      ((verifyParamsBtnEl['hidden'] = customProviderModelActionState['verifyHidden']),
      (verifyParamsBtnEl['disabled'] = customProviderModelActionState['verifyDisabled']));
    if (actionsEl) actionsEl['hidden'] = customProviderModelActionState['actionsHidden'];
  }
  function run65(el34) {
    if (!el34 || el34['hidden']) return;
    (el34['classList']['remove']('is-open'),
      el34['setAttribute']('aria-hidden', 'true'),
      source['setTimeout']?.(() => {
        if (!el34['classList']['contains']('is-open')) el34['hidden'] = true;
      }, 260));
  }
  function run66(el35) {
    if (!el35) return;
    ((el35['hidden'] = false),
      el35['setAttribute']('aria-hidden', 'false'),
      source['requestAnimationFrame']?.(() => {
        el35['classList']['add']('is-open');
      }) || el35['classList']['add']('is-open'));
  }
  function run35(value119 = run11()) {
    const {
      resultEl: resultEl,
      resultInnerEl: resultInnerEl,
      saveSelectedBtnEl: saveSelectedBtnEl2,
      verifyParamsBtnEl: verifyParamsBtnEl2,
      actionsEl: actionsEl2,
    } = run7(value119);
    (resultInnerEl?.['replaceChildren'](), run65(resultEl));
    saveSelectedBtnEl2 && ((saveSelectedBtnEl2['hidden'] = true), (saveSelectedBtnEl2['disabled'] = true));
    if (verifyParamsBtnEl2) verifyParamsBtnEl2['hidden'] = true;
    if (actionsEl2) actionsEl2['hidden'] = true;
    const value120 = run6(value119);
    ((value120['discovery'] = null),
      (value120['provider'] = null),
      (value120['activeKindFilter'] = 'all'),
      (value120['selectedModelKeys'] = new Set()),
      (value120['assignedModelKinds'] = new Map()),
      (value120['verifyingModelKeys'] = new Set()),
      (value120['isAddingModels'] = false));
  }
  function run67(value121, value122 = {}) {
    const value123 = run56(value122),
      value124 = run6(value121),
      value125 = String(value122?.['kind'] || 'unknown')
        ['trim']()
        ['toLowerCase'](),
      value126 = kind(value121, value122),
      enabled22 = value125 === 'unknown' && value126 === 'unknown',
      value127 = value124['selectedModelKeys']['has'](value123) && !enabled22,
      value128 = value124['verifyingModelKeys']?.['has'](value123) === true,
      el36 = cardEl['createElement']('label');
    ((el36['className'] = 'custom-provider-model-option'),
      (el36['dataset']['customProviderModelKey'] = value123),
      (el36['dataset']['customProviderDetectedKind'] = value125));
    const value129 = String(value122?.['capabilityStatus'] || 'unverified')
      ['trim']()
      ['toLowerCase']();
    el36['dataset']['customProviderCapabilityStatus'] = value129;
    if (value125 === 'unknown') el36['tabIndex'] = 0;
    (el36['classList']['toggle']('is-selected', value127),
      el36['classList']['toggle']('is-verifying', value128));
    if (value128) el36['setAttribute']('aria-busy', 'true');
    const el37 = cardEl['createElement']('input');
    ((el37['type'] = 'checkbox'),
      (el37['className'] = 'custom-provider-model-option-checkbox'),
      (el37['dataset']['customProviderModelCheckbox'] = ''),
      (el37['checked'] = value127),
      (el37['disabled'] = enabled22 || value128),
      el37['setAttribute'](
        'aria-label',
        enabled22 ? trCustomProvider('classifyBeforeSelecting') : String(value122['upstreamModelId'] || ''),
      ));
    const el38 = cardEl['createElement']('span');
    ((el38['className'] = 'custom-provider-model-option-title'),
      (el38['textContent'] = String(value122['upstreamModelId'] || '')),
      el36['append'](el37, el38));
    const value130 = value122?.['isSaved'] === true || isCustomProviderModelCapabilityRecognized(value122);
    if (value128) {
      const el39 = cardEl['createElement']('span');
      ((el39['className'] = 'custom-provider-model-verifying'),
        el39['setAttribute']('aria-label', trCustomProvider('verifyingParameters')),
        (el39['title'] = trCustomProvider('verifyingParameters')));
      const el40 = cardEl['createElement']('span');
      ((el40['className'] = 'custom-provider-model-loading-spinner'),
        el40['setAttribute']('aria-hidden', 'true'),
        el39['append'](el40),
        el36['append'](el39));
    } else {
      if (value130 && value129 !== 'verified') {
        const el41 = cardEl['createElement']('span');
        ((el41['className'] = 'custom-provider-model-kind-tag'),
          el41['classList']['toggle']('is-success', isCustomProviderModelCapabilityRecognized(value122)),
          (el41['textContent'] = run49(value129)),
          (el41['title'] = run50(value129)),
          el36['append'](el41));
      }
    }
    if (value125 === 'unknown' && value126 !== 'unknown') {
      const el42 = cardEl['createElement']('span');
      ((el42['className'] = 'custom-provider-model-kind-tag'),
        (el42['textContent'] = run48(value126)),
        el36['append'](el42));
    }
    if (value125 === 'unknown') {
      const value131 = run68(value121, value122);
      el36['append'](value131);
    }
    return el36;
  }
  function run69(value132, list12 = []) {
    const map5 = run61(list12),
      value133 = run6(value132),
      value134 = cardEl['createElement']('div');
    return (
      (value134['className'] = 'custom-provider-kind-filter-row'),
      CUSTOM_PROVIDER_FILTER_KINDS['forEach']((value135) => {
        if (value135 === 'unknown' && !(map5['get']('unknown') > 0)) return;
        const el43 = cardEl['createElement']('button');
        ((el43['type'] = 'button'),
          (el43['className'] = 'custom-provider-kind-filter'),
          (el43['dataset']['customProviderKindFilter'] = value135),
          el43['classList']['toggle']('is-active', value135 === value133['activeKindFilter']),
          el43['setAttribute']('aria-pressed', value135 === value133['activeKindFilter'] ? 'true' : 'false'));
        const value136 = value135 === 'all' ? list12['length'] : map5['get'](value135) || 0;
        ((el43['textContent'] = run48(value135) + ' ' + value136), value134['append'](el43));
      }),
      value134
    );
  }
  function run68(value137, value138 = {}) {
    const value139 = run56(value138),
      value140 = kind(value137, value138),
      el44 = cardEl['createElement']('div');
    ((el44['className'] = 'custom-provider-model-kind-toolbar'),
      (el44['dataset']['customProviderModelKindToolbar'] = value139),
      el44['setAttribute']('aria-label', trCustomProvider('modelKindLabel')));
    const el45 = cardEl['createElement']('span');
    return (
      (el45['className'] = 'custom-provider-model-kind-toolbar-label'),
      (el45['textContent'] = trCustomProvider('modelKindLabel')),
      el44['append'](el45),
      CUSTOM_PROVIDER_SELECTABLE_KINDS['forEach']((value141) => {
        const el46 = cardEl['createElement']('button');
        ((el46['type'] = 'button'),
          (el46['className'] = 'custom-provider-model-kind-button'),
          (el46['dataset']['customProviderAssignKind'] = value141));
        const value142 = value140 === value141;
        (el46['classList']['toggle']('is-active', value142),
          el46['setAttribute']('aria-pressed', String(value142)),
          (el46['textContent'] = run48(value141)),
          el44['append'](el46));
      }),
      el44
    );
  }
  function run70() {
    const value143 = cardEl['createElement']('div');
    return (
      (value143['className'] = 'custom-provider-selection-head'),
      value143['append'](run38('custom-provider-result-title', trCustomProvider('selectModels'))),
      value143['append'](run39(trCustomProvider('selectionHint'))),
      value143
    );
  }
  function run71(value144) {
    const value145 = cardEl['createElement']('div');
    return (
      (value145['className'] = 'custom-provider-result-heading'),
      value145['append'](
        run70(),
        run38('custom-provider-result-title custom-provider-result-summary', value144),
      ),
      value145
    );
  }
  function run72(value146, list13 = []) {
    const list14 = run60(value146, list13),
      value147 = cardEl['createElement']('div');
    ((value147['className'] = 'custom-provider-selection'), value147['append'](run69(value146, list13)));
    const el47 = cardEl['createElement']('div');
    ((el47['className'] = 'custom-provider-model-options'),
      el47['classList']['toggle'](
        'has-kind-toolbar',
        list14['some'](
          (value148) =>
            String(value148?.['kind'] || 'unknown')
              ['trim']()
              ['toLowerCase']() === 'unknown',
        ),
      ),
      list14['forEach']((value149) => el47['append'](run67(value146, value149))));
    if (list14['length'] > 0) value147['append'](el47);
    if (list13['length'] === 0)
      value147['append'](run38('custom-provider-bundle-empty', trCustomProvider('noModelsDiscovered')));
    else
      list14['length'] === 0 &&
        value147['append'](run38('custom-provider-bundle-empty', trCustomProvider('noModelsInFilter')));
    return value147;
  }
  function run73(value150, value151 = {}, value152 = {}) {
    const { resultEl: resultEl2, resultInnerEl: resultInnerEl2 } = run7(value150);
    if (!resultEl2 || !resultInnerEl2) return;
    const value153 = run6(value150),
      value154 = value153['parameterDraft'],
      count = run57(
        value154?.['context'] === run63(value150)
          ? mergeCustomProviderDiscoveryCapabilities(value151, value154['bundle'], false)
          : value151,
      ),
      unknown = Array['isArray'](value151['unknown']) ? value151['unknown'] : [],
      supported = run58(value150, count);
    (resultInnerEl2['replaceChildren'](),
      resultInnerEl2['append'](
        run71(
          trCustomProvider('resultSummary', {
            count: count['length'],
            supported: supported['length'],
            unknown: unknown['length'],
          }),
        ),
      ),
      resultInnerEl2['append'](run72(value150, count)),
      run66(resultEl2),
      run55(value150));
  }
  function run74(value155, value156 = {}, value157 = {}) {
    const { resultEl: resultEl3 } = run7(value155),
      captureCustomProviderModelSelectionScroll2 = captureCustomProviderModelSelectionScroll(resultEl3);
    (run73(value155, value156, value157),
      restoreCustomProviderModelSelectionScroll(resultEl3, captureCustomProviderModelSelectionScroll2));
  }
  function run75() {
    const { editorListEl: editorListEl3, addBtnEl: addBtnEl } = run2();
    if (!editorListEl3) return;
    const value158 = run37();
    (editorListEl3['insertBefore'](value158, addBtnEl || null),
      run22(),
      run30(),
      run9(value158, { clearResult: true }),
      run10('', ''));
    const { baseUrlEl: baseUrlEl6 } = run4(value158);
    baseUrlEl6?.['focus']?.();
  }
  function run76(options5 = {}) {
    return String(options5?.['sourceId'] || options5?.['bundle']?.['sourceId'] || '')['trim']();
  }
  function run77(value159) {
    return String(value159 || '')
      ['replace'](/^custom-provider:/, '')
      ['trim']();
  }
  function run78(options6 = {}) {
    const value160 = options6?.['bundle'] && typeof options6['bundle'] === 'object' ? options6['bundle'] : {},
      error4 = value160['provider'] && typeof value160['provider'] === 'object' ? value160['provider'] : {},
      value161 = run77(run76(options6)),
      providerId2 = String(error4['providerId'] || options6['providerId'] || value161)['trim'](),
      baseUrl2 = String(error4['baseUrl'] || error4['apiUrl'] || '')['trim'](),
      name3 = String(error4['name'] || options6['displayName'] || run43(baseUrl2) || providerId2)['trim']();
    return { ...error4, providerId: providerId2, name: name3, baseUrl: baseUrl2 };
  }
  function run79(el48) {
    if (!el48) return '';
    const value162 = run6(el48);
    return String(
      value162['provider']?.['providerId'] || el48['dataset']?.['customProviderProviderId'] || '',
    )['trim']();
  }
  function run80(value163) {
    const enabled23 = String(value163 || '')['trim']();
    if (!enabled23) return null;
    return run3()['find']((value164) => run79(value164) === enabled23) || null;
  }
  function run81(enabled24) {
    if (!enabled24) return false;
    const enabled25 = run6(enabled24),
      {
        baseUrlEl: baseUrlEl7,
        apiKeyEl: apiKeyEl4,
        documentationUrlEl: documentationUrlEl4,
      } = run4(enabled24);
    return (
      !enabled25['provider'] &&
      !enabled25['discovery'] &&
      !enabled25['titleText'] &&
      !String(baseUrlEl7?.['value'] || '')['trim']() &&
      !String(apiKeyEl4?.['value'] || '')['trim']() &&
      !String(documentationUrlEl4?.['value'] || '')['trim']() &&
      !enabled25['documentationDocument']
    );
  }
  function run82() {
    return run3()['find'](run81) || null;
  }
  function run83() {
    const { editorListEl: editorListEl4, addBtnEl: addBtnEl2 } = run2();
    if (!editorListEl4) return null;
    const value165 = run37();
    return (editorListEl4['insertBefore'](value165, addBtnEl2 || null), value165);
  }
  function upstreamModelId(options7 = {}) {
    return getCustomProviderManifestUpstreamModelId(options7);
  }
  function run84(provider = {}) {
    const models2 = Array['isArray'](provider?.['models'])
      ? provider['models']
          ['map']((value166) => {
            const response = value166?.['extensions']?.['customProvider']?.['capability'] || {};
            return {
              upstreamModelId: upstreamModelId(value166),
              kind: String(value166?.['kind'] || '')
                ['trim']()
                ['toLowerCase'](),
              isSaved: true,
              capabilityStatus: String(response?.['status'] || 'unverified')
                ['trim']()
                ['toLowerCase'](),
              capabilitySource: String(response?.['source'] || 'stored-bundle')['trim'](),
            };
          })
          ['filter']((value167) => value167['upstreamModelId'] && value167['kind'])
      : [];
    return { provider: provider?.['provider'] || {}, models: models2, unknown: [] };
  }
  function run85(el49, value168 = {}) {
    if (!el49) return;
    const value169 = value168?.['bundle'] && typeof value168['bundle'] === 'object' ? value168['bundle'] : {},
      error5 = run78(value168);
    if (!error5['providerId']) return;
    const value170 = run84(value169);
    value170['provider'] = error5;
    const enabled26 = run6(el49),
      value171 = run79(el49),
      enabled27 =
        value171 === error5['providerId'] &&
        enabled26['titleManuallyEdited'] &&
        run18(enabled26['titleText']),
      enabled28 = value171 === error5['providerId'] && !!enabled26['documentationDocument'],
      {
        baseUrlEl: baseUrlEl8,
        apiKeyEl: apiKeyEl5,
        documentationUrlEl: documentationUrlEl5,
        documentationFileEl: documentationFileEl3,
      } = run4(el49),
      value172 = configSnapshot?.['providers']?.[error5['providerId']] || {};
    if (baseUrlEl8) baseUrlEl8['value'] = error5['baseUrl'] || value172['apiUrl'] || '';
    if (apiKeyEl5) apiKeyEl5['value'] = value172['apiKey'] || '';
    documentationUrlEl5 &&
      !enabled28 &&
      (documentationUrlEl5['value'] = String(
        error5['documentationUrl'] || value172['documentationUrl'] || '',
      )['trim']());
    if (!enabled28) {
      if (documentationFileEl3) documentationFileEl3['value'] = '';
      enabled26['documentationDocument'] = null;
    }
    ((el49['dataset']['customProviderProviderId'] = error5['providerId']),
      (el49['dataset']['customProviderSyncedBundle'] = 'true'),
      (enabled26['provider'] = error5),
      (enabled26['discovery'] = value170),
      (enabled26['isAddingModels'] = false));
    const value173 = value170['unknown']['length'] > 0;
    ((enabled26['activeKindFilter'] =
      CUSTOM_PROVIDER_FILTER_KINDS['includes'](enabled26['activeKindFilter']) &&
      (enabled26['activeKindFilter'] !== 'unknown' || value173)
        ? enabled26['activeKindFilter']
        : 'all'),
      (enabled26['selectedModelKeys'] = new Set(run58(el49, value170['models'])['map'](run56))),
      (enabled26['assignedModelKinds'] = new Map()),
      !enabled27 ? run23(el49, error5['name'], { manual: true }) : run21(el49),
      run73(el49, value170, error5));
  }
  function run86(enabled29) {
    if (!enabled29) return;
    if (run3()['length'] <= 1) {
      (run34(enabled29), run9(enabled29, { clearStatus: true }));
      return;
    }
    run31(enabled29);
  }
  function run87(list15 = []) {
    const { editorListEl: editorListEl5 } = run2();
    if (!editorListEl5) return;
    const list16 = (Array['isArray'](list15) ? list15 : [])['filter'](
        (value174) => value174?.['bundle'] && run78(value174)['providerId'],
      ),
      map6 = new Set(list16['map']((value175) => run78(value175)['providerId']));
    (list16['forEach']((value176) => {
      const value177 = run78(value176),
        value178 = run80(value177['providerId']) || run82() || run83();
      run85(value178, value176);
    }),
      run3()['forEach']((el50) => {
        const value179 = run79(el50);
        el50['dataset']?.['customProviderSyncedBundle'] === 'true' &&
          value179 &&
          !map6['has'](value179) &&
          run86(el50);
      }),
      run3()['length'] === 0 && run83(),
      run22(),
      run30(),
      run8(run11()));
  }
  function syncEditorCredentials(options8 = {}) {
    (getRememberedCustomProviderConfigs(options8)['forEach']((providerId3) => {
      const el51 = run80(providerId3['providerId']) || run82() || run83();
      if (!el51) return;
      const enabled30 = run6(el51),
        { baseUrlEl: baseUrlEl9, apiKeyEl: apiKeyEl6, documentationUrlEl: documentationUrlEl6 } = run4(el51);
      if (baseUrlEl9) baseUrlEl9['value'] = providerId3['baseUrl'];
      if (apiKeyEl6) apiKeyEl6['value'] = providerId3['apiKey'];
      (documentationUrlEl6 &&
        !enabled30['documentationDocument'] &&
        (documentationUrlEl6['value'] = providerId3['documentationUrl']),
        (el51['dataset']['customProviderProviderId'] = providerId3['providerId']),
        !enabled30['provider'] &&
          (enabled30['provider'] = {
            providerId: providerId3['providerId'],
            name: providerId3['name'],
            baseUrl: providerId3['baseUrl'],
            documentationUrl: providerId3['documentationUrl'],
          }),
        !enabled30['discovery'] && run23(el51, providerId3['name'], { manual: true }));
    }),
      run3()['forEach']((value180) => {
        const enabled31 = run79(value180);
        if (!enabled31) return;
        const value181 = options8?.[enabled31] || {},
          {
            baseUrlEl: baseUrlEl10,
            apiKeyEl: apiKeyEl7,
            documentationUrlEl: documentationUrlEl7,
          } = run4(value180);
        if (baseUrlEl10 && value181['apiUrl']) baseUrlEl10['value'] = value181['apiUrl'];
        if (apiKeyEl7 && value181['apiKey']) apiKeyEl7['value'] = value181['apiKey'];
        documentationUrlEl7 &&
          !run6(value180)['documentationDocument'] &&
          value181['documentationUrl'] &&
          (documentationUrlEl7['value'] = value181['documentationUrl']);
      }),
      run22(),
      run30(),
      run8(run11()));
  }
  function run88(options9 = {}) {
    const enabled32 = options9?.['bundle'],
      enabled33 = String(options9?.['sourceId'] || enabled32?.['sourceId'] || '')['trim']();
    if (!enabled33 || !enabled32) return false;
    let value182 = false;
    const value183 = map['get'](enabled33);
    if (value183)
      try {
        (unregisterManifestBundle(value183), (value182 = true));
      } catch (value184) {
        console['warn']('[Custom Provider] unregister previous bundle failed:', value184);
      }
    try {
      (registerManifestBundle(enabled32), map['set'](enabled33, enabled32), (value182 = true));
    } catch (value185) {
      (console['warn']('[Custom Provider] register bundle failed:', value185), map['delete'](enabled33));
    }
    return value182;
  }
  function run89(list17 = []) {
    let value186 = false;
    const map7 = new Set();
    return (
      list17['forEach']((value187) => {
        const enabled34 = value187?.['bundle'],
          enabled35 = String(value187?.['sourceId'] || enabled34?.['sourceId'] || '')['trim']();
        if (!enabled35 || !enabled34) return;
        map7['add'](enabled35);
        if (run88(value187)) value186 = true;
      }),
      [...map['entries']()]['forEach'](([value188, value189]) => {
        if (map7['has'](value188)) return;
        try {
          (unregisterManifestBundle(value189), (value186 = true));
        } catch (value190) {
          console['warn']('[Custom Provider] unregister stale bundle failed:', value190);
        }
        map['delete'](value188);
      }),
      value186
    );
  }
  function run90(el52, value191, value192, value193 = {}) {
    const args3 = value191?.['item'] && typeof value191['item'] === 'object' ? value191['item'] : {},
      bundle = args3?.['bundle'] && typeof args3['bundle'] === 'object' ? args3['bundle'] : value192,
      sourceId = String(args3?.['sourceId'] || bundle?.['sourceId'] || '')['trim'](),
      value194 = { ...args3, sourceId: sourceId, bundle: bundle },
      value195 = run6(el52);
    return (
      (value195['discovery'] = mergeCustomProviderDiscoveryCapabilities(value195['discovery'], bundle)),
      (value195['provider'] = {
        ...(value195['provider'] || {}),
        ...(bundle?.['provider'] || {}),
        ...(value193 || {}),
      }),
      (value195['isAddingModels'] = false),
      (el52['dataset']['customProviderProviderId'] = String(value195['provider']?.['providerId'] || '')[
        'trim'
      ]()),
      (el52['dataset']['customProviderSyncedBundle'] = 'true'),
      run88(value194) && refreshManifestModelNodeUis?.(),
      bundle
    );
  }
  async function refreshBundles(enabled36 = {}) {
    const enabled37 = !!enabled36['silent'];
    if (typeof listCustomProviderManifestBundles !== 'function')
      return (!enabled37 && run10('danger', trCustomProvider('apiUnsupported')), []);
    try {
      const value196 = await listCustomProviderManifestBundles(),
        value197 = Array['isArray'](value196?.['items']) ? value196['items'] : [],
        value198 = run89(value197);
      run87(value197);
      if (value198) refreshManifestModelNodeUis?.();
      if (!enabled37) run10('', '');
      return value197;
    } catch (error6) {
      const trCustomProvider5 = trCustomProvider('loadBundlesFailed', {
        error: error6?.['message'] || trApiInput('diagnostics.unknownError'),
      });
      return (
        !enabled37 &&
          (run10('danger', trApiInput('diagnostics.failed'), trCustomProvider5),
          source['showToast']?.(trCustomProvider5, 'error')),
        []
      );
    }
  }
  async function run91(error7 = {}, value199 = '') {
    if (typeof saveApiConfigToServer !== 'function') return;
    const enabled38 = String(error7['providerId'] || '')['trim']();
    if (!enabled38) return;
    const providers2 = { ...(configSnapshot?.['providers'] || {}) };
    providers2[enabled38] = {
      ...(providers2[enabled38] || {}),
      apiUrl: String(error7['baseUrl'] || error7['apiUrl'] || '')['trim'](),
      apiKey: String(value199 || '')['trim'](),
      label: String(error7['name'] || enabled38)['trim'](),
      documentationUrl: String(error7['documentationUrl'] || '')['trim'](),
    };
    const value200 = { ...(configSnapshot || {}), providers: providers2 };
    (await saveApiConfigToServer(value200),
      run(value200),
      syncModelServiceReadinessSummary(value200),
      refreshManifestModelNodeUis?.());
  }
  function name4(value201, error8 = {}) {
    return run18(run20(value201)) || String(error8['name'] || '')['trim']() || run43(error8['baseUrl']);
  }
  function run92(onSuccess = null) {
    if (typeof source['openSubscriptionDialog'] === 'function') {
      source['openSubscriptionDialog']({
        modelId: CUSTOM_PROVIDER_VIP_MODEL_ID,
        provider: 'aicanvas',
        onSuccess: onSuccess,
      });
      return;
    }
    source['showToast']?.(trCustomProvider('vipRequired'), 'warn');
  }
  function run93(value202 = null) {
    const value203 = store?.['getStateRaw']?.()['subscription'] || {};
    if (isCustomProviderAccessAllowed(value203)) return true;
    return (run92(value202), false);
  }
  async function run94(el53, value204) {
    if (
      !run93(() => {
        run94(el53, value204)['catch'](() => {});
      })
    )
      return;
    if (typeof discoverCustomProvider !== 'function') {
      (run10('danger', trCustomProvider('apiUnsupported')),
        source['showToast']?.(trCustomProvider('apiUnsupported'), 'error'));
      return;
    }
    run9(el53);
    const name5 = run16(el53);
    if (!name5['baseUrl'] || !name5['apiKey']) {
      const { baseUrlEl: baseUrlEl11, apiKeyEl: apiKeyEl8 } = run4(el53);
      (run10('danger', trApiInput('diagnostics.failed')),
        source['showToast']?.(trCustomProvider('fillRequired'), 'warn'));
      if (!name5['baseUrl']) baseUrlEl11?.['focus']?.();
      else apiKeyEl8?.['focus']?.();
      return;
    }
    if (run47(el53, name5['providerId'])) return;
    const run95 = run51(value204, trCustomProvider('discovering'));
    try {
      run10('testing', trCustomProvider('discovering'));
      const { documentationDocument: documentationDocument2, ...args4 } = name5,
        value205 = run14(name5['providerId']),
        value206 = await discoverCustomProvider(args4),
        baseUrl3 = mergeCustomProviderDiscoveryCapabilities(value206, value205),
        error9 = {
          ...(baseUrl3['provider'] || {}),
          name: name5['name'],
          providerId: name5['providerId'],
          baseUrl: baseUrl3['provider']?.['baseUrl'] || name5['baseUrl'],
          documentationUrl: name5['documentationUrl'] || baseUrl3['provider']?.['documentationUrl'] || '',
        };
      run25(el53, error9['name']);
      const value207 = { ...error9, name: name4(el53, error9) };
      (await run91(value207, name5['apiKey']),
        (el53['dataset']['customProviderProviderId'] = value207['providerId']),
        delete el53['dataset']['customProviderSyncedBundle'],
        run59(el53));
      const enabled39 = run6(el53);
      ((enabled39['discovery'] = baseUrl3),
        (enabled39['provider'] = value207),
        (enabled39['isAddingModels'] = true),
        (enabled39['parameterDraft'] = null),
        (enabled39['recognitionInvalidated'] = false));
      const value208 = run4(el53);
      if (value208['baseUrlEl']) value208['baseUrlEl']['value'] = value207['baseUrl'];
      value208['documentationUrlEl'] &&
        !enabled39['documentationDocument'] &&
        (value208['documentationUrlEl']['value'] = value207['documentationUrl']);
      (run73(el53, baseUrl3, value207), run30());
      const count2 = run57(baseUrl3),
        supported2 = run58(el53, count2)['length'];
      if (supported2 === 0) {
        const trCustomProvider6 = trCustomProvider('configSavedNoSupportedModels');
        (run10('partial', trCustomProvider6), source['showToast']?.(trCustomProvider6, 'warn', 9000));
        return;
      }
      run10(
        baseUrl3['warnings']?.['length'] ? 'partial' : 'success',
        trCustomProvider('resultSummary', {
          count: count2['length'],
          supported: supported2,
          unknown: Array['isArray'](baseUrl3['unknown']) ? baseUrl3['unknown']['length'] : 0,
        }),
        baseUrl3['warnings']?.['length'] ? trCustomProvider('sourceIncomplete') : '',
      );
    } catch (error10) {
      const trCustomProvider7 = trCustomProvider('saveFailed', {
        error: error10?.['message'] || trApiInput('diagnostics.unknownError'),
      });
      (run10('danger', trApiInput('diagnostics.failed'), trCustomProvider7),
        source['showToast']?.(trCustomProvider7, 'error', 9000));
    } finally {
      run95();
    }
  }
  async function run96(value209, value210) {
    const value211 = run6(value209);
    if (value211['saving'] || value211['verifyingModelKeys']['size']) return;
    if (getCustomProviderModelsBlockingSave(run64(value209))['length']) {
      source['showToast']?.(trCustomProvider('recognizeBeforeSave'), 'warn');
      return;
    }
    if (
      !run93(() => {
        run96(value209, value210)['catch'](() => {});
      })
    )
      return;
    if (
      typeof buildCustomProviderManifestDraft !== 'function' ||
      typeof validateCustomProviderManifestDraft !== 'function' ||
      typeof saveCustomProviderManifestBundle !== 'function'
    ) {
      (run10('danger', trCustomProvider('apiUnsupported')),
        source['showToast']?.(trCustomProvider('apiUnsupported'), 'error'));
      return;
    }
    const models3 = run62(value209);
    if (models3['length'] === 0) {
      source['showToast']?.(trCustomProvider('noModelsSelected'), 'warn');
      return;
    }
    const providerId4 = run16(value209);
    if (run47(value209, providerId4['providerId'])) return;
    const provider2 = {
        ...(value211['provider'] || {}),
        name: name4(value209, value211['provider']),
        providerId:
          providerId4['baseUrl'] === value211['provider']?.['baseUrl']
            ? value211['provider']['providerId']
            : providerId4['providerId'],
        baseUrl: providerId4['baseUrl'],
        documentationUrl: providerId4['documentationUrl'],
      },
      value212 = run14(provider2['providerId']),
      value213 = run63(value209);
    ((value211['saving'] = true), run55(value209));
    const run97 = run51(value210, trCustomProvider('validating'));
    try {
      run10('testing', trCustomProvider('validating'));
      const value214 = await buildCustomProviderManifestDraft({ provider: provider2, models: models3 }),
        customProviderRecognizedProfiles = mergeCustomProviderRecognizedProfiles(
          mergeCustomProviderRecognizedProfiles(value214?.['bundle'], value212),
          value211['parameterDraft']?.['context'] === value213 ? value211['parameterDraft']['bundle'] : {},
        ),
        count3 = Array['isArray'](customProviderRecognizedProfiles?.['models'])
          ? customProviderRecognizedProfiles['models']['length']
          : 0;
      if (count3 === 0) throw new Error(trCustomProvider('noSupportedModels'));
      if (getCustomProviderModelsBlockingSave(customProviderRecognizedProfiles['models'])['length'])
        throw new Error(trCustomProvider('recognizeBeforeSave'));
      const response2 = await validateCustomProviderManifestDraft(customProviderRecognizedProfiles);
      if (!response2?.['ok'])
        throw new Error(
          Array['isArray'](response2?.['errors']) && response2['errors']['length']
            ? response2['errors']['join']('; ')
            : trApiInput('diagnostics.failed'),
        );
      const value215 = response2['bundle'] || customProviderRecognizedProfiles;
      if (value213 !== run63(value209)) throw new Error(trCustomProvider('recognizeBeforeSave'));
      await run91(provider2, providerId4['apiKey']);
      const value216 = await saveCustomProviderManifestBundle(value215),
        value217 = run90(value209, value216, value215, provider2);
      run74(value209, value211['discovery'], value211['provider']);
      const event2 = getCustomProviderSaveStatus(value217?.['models']),
        trCustomProvider8 = trCustomProvider(event2['key'], event2);
      (run10('success', trCustomProvider8), source['showToast']?.(trCustomProvider8, 'success'));
    } catch (error11) {
      const trCustomProvider9 = trCustomProvider('saveFailed', {
        error: error11?.['message'] || trApiInput('diagnostics.unknownError'),
      });
      (run10('danger', trApiInput('diagnostics.failed'), trCustomProvider9),
        source['showToast']?.(trCustomProvider9, 'error', 9000));
    } finally {
      (run97(), (value211['saving'] = false), run55(value209));
    }
  }
  function run98(error12) {
    const list18 = error12?.['message'] || trApiInput('diagnostics.unknownError'),
      error13 = list18['includes']('Automatic API documentation discovery failed')
        ? trCustomProvider('documentationAutoDiscoveryFailed')
        : list18,
      trCustomProvider10 = trCustomProvider('parameterVerificationFailed', { error: error13 });
    console['error']('[Custom Provider] 模型参数验证失败:', error12);
    try {
      run10('danger', trCustomProvider10, error13);
    } catch (value218) {
      console['error']('[Custom Provider] 无法更新参数验证状态:', value218);
    }
    let enabled40 = false;
    try {
      typeof source['showToast'] === 'function' &&
        (source['showToast'](trCustomProvider10, 'error', 9000), (enabled40 = true));
    } catch (value219) {
      console['error']('[Custom Provider] 无法显示参数验证提示:', value219);
    }
    if (!enabled40)
      try {
        showError?.(trCustomProvider10);
      } catch (value220) {
        console['error']('[Custom Provider] 无法显示参数验证错误:', value220);
      }
  }
  async function run99(value221, value222) {
    try {
      await run100(value221, value222);
    } catch (value223) {
      run98(value223);
    }
  }
  async function run100(value224, value225) {
    const value226 = run6(value224);
    if (value226['saving'] || value226['verifyingModelKeys']['size']) return;
    if (
      !run93(() => {
        run99(value224, value225)['catch'](run98);
      })
    )
      return;
    if (
      typeof analyzeCustomProviderDocumentation !== 'function' ||
      typeof buildCustomProviderManifestDraft !== 'function' ||
      typeof validateCustomProviderManifestDraft !== 'function' ||
      typeof saveCustomProviderManifestBundle !== 'function'
    ) {
      (run10('danger', trCustomProvider('apiUnsupported')),
        source['showToast']?.(trCustomProvider('apiUnsupported'), 'error'));
      return;
    }
    const providerId5 = run16(value224),
      models4 = run62(value224);
    if (models4['length'] === 0) {
      const trCustomProvider11 = trCustomProvider('noModelsSelected');
      (run10('partial', trCustomProvider11), source['showToast']?.(trCustomProvider11, 'warn'));
      return;
    }
    const models5 = models4;
    if (run47(value224, providerId5['providerId'])) return;
    const context = run63(value224),
      provider3 = {
        ...(value226['provider'] || {}),
        name: name4(value224, value226['provider']),
        providerId:
          providerId5['baseUrl'] === value226['provider']?.['baseUrl']
            ? value226['provider']['providerId']
            : providerId5['providerId'],
        baseUrl: providerId5['baseUrl'],
        documentationUrl: providerId5['documentationUrl'],
      },
      { resultEl: resultEl4 } = run7(value224),
      captureCustomProviderModelSelectionScroll3 = captureCustomProviderModelSelectionScroll(resultEl4);
    ((value226['parameterDraft'] = null),
      (value226['recognitionInvalidated'] = true),
      (value226['verifyingModelKeys'] = new Set(models4['map'](run56)['filter'](Boolean))),
      run73(value224, value226['discovery'], value226['provider']),
      restoreCustomProviderModelSelectionScroll(resultEl4, captureCustomProviderModelSelectionScroll3));
    const run101 = run51(value225, trCustomProvider('verifyingParameters'));
    try {
      run10('testing', trCustomProvider('analyzingDocumentation'));
      const enabled41 = await analyzeCustomProviderDocumentation({
        apiKey: providerId5['apiKey'],
        provider: provider3,
        models: models5,
        documentationUrl: providerId5['documentationUrl'],
        documentationDocument: providerId5['documentationDocument'],
      });
      if (enabled41?.['agentUnavailable']) throw new Error(trCustomProvider('documentationAgentUnavailable'));
      if (!enabled41?.['bundle']) throw new Error(trCustomProvider('documentationNoMatchingProfile'));
      const count4 = Number(enabled41?.['analysis']?.['documentedModels'] || 0);
      if (count4 <= 0)
        throw new Error(
          trCustomProvider(resolveCustomProviderDocumentationFailureKey(enabled41?.['analysis'])),
        );
      const value227 = await buildCustomProviderManifestDraft({ provider: provider3, models: models4 }),
        customProviderRecognizedProfiles2 = mergeCustomProviderRecognizedProfiles(
          value227?.['bundle'],
          enabled41['bundle'],
        ),
        response3 = await validateCustomProviderManifestDraft(customProviderRecognizedProfiles2);
      if (!response3?.['ok'])
        throw new Error(
          Array['isArray'](response3?.['errors']) && response3['errors']['length']
            ? response3['errors']['join']('; ')
            : trApiInput('diagnostics.failed'),
        );
      if (context !== run63(value224)) throw new Error(trCustomProvider('recognizeBeforeSave'));
      const bundle2 = response3['bundle'] || customProviderRecognizedProfiles2;
      value226['parameterDraft'] = { context: context, bundle: bundle2 };
      const count5 = Array['isArray'](bundle2?.['models']) ? bundle2['models']['length'] : 0,
        documented = (Array['isArray'](bundle2?.['models']) ? bundle2['models'] : [])['filter'](
          isCustomProviderModelCapabilityRecognized,
        )['length'],
        value228 = Number(enabled41?.['analysis']?.['agentRepairAttempts'] || 0) > 0,
        value229 =
          documented < count5
            ? value228
              ? 'parametersVerifiedPartialAfterRepair'
              : 'parametersVerifiedPartial'
            : value228
              ? 'parametersVerifiedAfterRepair'
              : 'parametersVerified',
        trCustomProvider12 = trCustomProvider(value229, { count: count5, documented: documented });
      (run10(documented < count5 ? 'partial' : 'success', trCustomProvider12),
        source['showToast']?.(
          trCustomProvider12,
          documented < count5 ? 'warn' : 'success',
          documented < count5 ? 9000 : undefined,
        ));
    } finally {
      ((value226['verifyingModelKeys'] = new Set()),
        run73(value224, value226['discovery'], value226['provider']),
        restoreCustomProviderModelSelectionScroll(resultEl4, captureCustomProviderModelSelectionScroll3),
        run101(),
        run55(value224));
    }
  }
  function init() {
    const { cardEl: cardEl2, editorEl: editorEl } = run2();
    if (!cardEl2) return;
    (run40(),
      editorEl?.['addEventListener']('input', (event3) => {
        if (
          !event3['target']?.['matches']?.(
            '[data-custom-provider-base-url], [data-custom-provider-api-key], [data-custom-provider-documentation-url]',
          )
        )
          return;
        const value230 = event3['target']['closest']('[data-custom-provider-editor-id]'),
          value231 = run6(value230);
        ((value231['parameterDraft'] = null), (value231['recognitionInvalidated'] = true), run55(value230));
      }),
      editorEl?.['addEventListener']('focusin', (event4) => {
        const value232 = event4['target']?.['closest']?.('[data-custom-provider-editor-id]');
        value232 && editorEl['contains'](value232) && run9(value232);
      }),
      editorEl?.['addEventListener'](
        'wheel',
        (value233) => handleCustomProviderResultWheel(value233, editorEl),
        { passive: false },
      ),
      editorEl?.['addEventListener']('click', (event5) => {
        const value234 = event5['target']?.['closest']?.('[data-custom-provider-editor-id]');
        value234 && editorEl['contains'](value234) && run9(value234);
        const value235 = event5['target']?.['closest']?.('[data-custom-provider-add]');
        if (value235 && editorEl['contains'](value235)) {
          run75();
          return;
        }
        const el54 = event5['target']?.['closest']?.('[data-custom-provider-delete]');
        if (el54 && editorEl['contains'](el54)) {
          const value236 = el54['closest']('[data-custom-provider-editor-id]');
          run36(value236, el54)['catch'](() => {});
          return;
        }
        const el55 = event5['target']?.['closest']?.('[data-custom-provider-select-document]');
        if (el55 && editorEl['contains'](el55)) {
          const value237 = el55['closest']('[data-custom-provider-editor-id]'),
            { documentationFileEl: documentationFileEl4 } = run4(value237);
          if (documentationFileEl4) documentationFileEl4['value'] = '';
          documentationFileEl4?.['click']?.();
          return;
        }
        const el56 = event5['target']?.['closest']?.('[data-custom-provider-discover]');
        if (el56 && editorEl['contains'](el56)) {
          const value238 = el56['closest']('[data-custom-provider-editor-id]');
          run94(value238, el56)['catch'](() => {});
          return;
        }
        const el57 = event5['target']?.['closest']?.('[data-custom-provider-save-selected]');
        if (el57 && editorEl['contains'](el57)) {
          const value239 = el57['closest']('[data-custom-provider-editor-id]');
          run96(value239, el57)['catch'](() => {});
          return;
        }
        const el58 = event5['target']?.['closest']?.('[data-custom-provider-verify-params]');
        if (el58 && editorEl['contains'](el58)) {
          const value240 = el58['closest']('[data-custom-provider-editor-id]');
          run99(value240, el58)['catch'](run98);
          return;
        }
        const el59 = event5['target']?.['closest']?.('[data-custom-provider-kind-filter]');
        if (el59 && editorEl['contains'](el59)) {
          const value241 = el59['closest']('[data-custom-provider-editor-id]'),
            value242 = String(el59['dataset']['customProviderKindFilter'] || 'all');
          if (!CUSTOM_PROVIDER_FILTER_KINDS['includes'](value242)) return;
          const value243 = run6(value241);
          ((value243['activeKindFilter'] = value242),
            (value243['provider'] = {
              ...(value243['provider'] || {}),
              name: name4(value241, value243['provider']),
            }),
            run73(value241, value243['discovery'], value243['provider']));
          return;
        }
        const el60 = event5['target']?.['closest']?.('[data-custom-provider-assign-kind]');
        if (el60 && editorEl['contains'](el60)) {
          (event5['preventDefault'](), event5['stopPropagation']());
          const el61 = el60['closest']('[data-custom-provider-editor-id]'),
            el62 = el60['closest']('[data-custom-provider-model-kind-toolbar]'),
            enabled42 = String(el62?.['dataset']['customProviderModelKindToolbar'] || ''),
            value244 = String(el60['dataset']['customProviderAssignKind'] || '');
          if (!el61 || !enabled42 || !CUSTOM_PROVIDER_SELECTABLE_KINDS['includes'](value244)) return;
          const value245 = run6(el61);
          (value245['assignedModelKinds']['set'](enabled42, value244),
            value245['selectedModelKeys']['add'](enabled42),
            delete el61['dataset']['customProviderSyncedBundle'],
            run74(el61, value245['discovery'], value245['provider']));
          return;
        }
      }),
      editorEl?.['addEventListener']('dblclick', (event6) => {
        const el63 = event6['target']?.['closest']?.('[data-custom-provider-editor-tab]');
        if (!el63 || !editorEl['contains'](el63)) return;
        const value246 = el63['closest']('[data-custom-provider-editor-id]');
        (run9(value246), run26(value246));
      }),
      editorEl['addEventListener']('change', (event7) => {
        const el64 = event7['target']?.['closest']?.('[data-custom-provider-documentation-file]');
        if (el64 && editorEl['contains'](el64)) {
          const value247 = el64['closest']('[data-custom-provider-editor-id]');
          run54(value247, el64)['catch'](() => {});
          return;
        }
        const el65 = event7['target']?.['closest']?.('[data-custom-provider-model-checkbox]');
        if (!el65 || !editorEl['contains'](el65)) return;
        const el66 = el65['closest']('[data-custom-provider-model-key]'),
          el67 = el65['closest']('[data-custom-provider-editor-id]');
        if (el66 && el67) {
          const modelKey = String(el66['dataset']['customProviderModelKey'] || '');
          if (!modelKey) return;
          const value248 = run6(el67),
            detectedKind = String(el66['dataset']['customProviderDetectedKind'] || 'unknown'),
            selected = !!el65['checked'],
            customProviderModelSelectionState = applyCustomProviderModelSelectionState(value248, {
              modelKey: modelKey,
              detectedKind: detectedKind,
              selected: selected,
            });
          delete el67['dataset']['customProviderSyncedBundle'];
          if (customProviderModelSelectionState) {
            run74(el67, value248['discovery'], value248['provider']);
            return;
          }
          (el66['classList']['toggle']('is-selected', selected), run55(el67));
        }
      }),
      editorEl['addEventListener']('input', (event8) => {
        const el68 = event8['target']?.['closest']?.('[data-custom-provider-documentation-url]');
        if (!el68 || !editorEl['contains'](el68)) return;
        const value249 = el68['closest']('[data-custom-provider-editor-id]');
        run6(value249)['documentationDocument'] && run53(value249);
      }),
      trackRuntimeManifestLoad(refreshBundles({ silent: true }))['catch'](() => {}));
  }
  return {
    init: init,
    refreshBundles: refreshBundles,
    syncConfigSnapshot(value250) {
      configSnapshot = value250 || {};
    },
    syncDefaults: syncDefaults,
    syncEditorCredentials: syncEditorCredentials,
  };
}
