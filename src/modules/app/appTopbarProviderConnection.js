export * from '../../services/providerConnectionVerification.js';
import { t } from '../../i18n/index.js';
import { PROVIDERS_META, resolveProviderApiRoute } from '../providers.js';
import { createApiRouteSelection } from '../settings/apiRouteSelection.js';
import { bindVolcengineSpeechApiKeyGuideTriggers } from '../volcengineSpeechApiKeyGuide.js';
import { bindRunningHubApiKeyGuideTriggers } from '../runningHubApiKeyGuide.js';
import { bindProviderApiKeyGuideTriggers } from '../providerApiKeyGuide.js';
import {
  formatProviderDiagnosticDetail,
  isProviderConnectionVerified,
  mergeCurrentProviderConnectionResults,
  reconcileProviderConnectionVerification,
  shouldPersistProviderConnectionResult,
} from '../../services/providerConnectionVerification.js';
import { createRunningHubDefaultSiteSettings } from '../settings/runningHubDefaultSiteSettings.js';
import { bindModelCatalogProviderCardVisibility } from './modelCatalogProviderCard.js';
import { createApiConfigAutoSaveController } from './apiConfigAutoSave.js';
import { createApiConfigSavePresentation } from '../settings/apiConfigSavePresentation.js';
import { createProviderStatusTooltipController } from './providerStatusTooltipController.js';
import {
  COMFYUI_LOCAL_DEFAULT_URL,
  getComfyUiEndpointStatusEntries,
  getComfyUiStatusElementId,
  isComfyUiEndpointConfigured,
  normalizeComfyUiConnectionTarget,
  normalizeComfyUiFormUrl,
} from './comfyUiConnectionSettings.js';
import { fetchProviderModelList } from '../../../api/providerModelListApi.js';
import {
  PROVIDER_MODEL_CATALOG_PROVIDER_IDS,
  applyProviderModelCatalog,
  collectEnabledVendorModels,
  inferProviderModelKind,
  isProviderModelCatalogProvider,
  mergeProviderModelCatalog,
  readProviderModelCatalog,
} from '../settings/providerModelCatalog.js';
import {
  readProviderModelCatalogSelection,
  renderProviderModelCatalogPanel,
} from '../settings/providerModelCatalogPanel.js';
import { createProviderModelCatalogBundleRegistry } from './providerModelCatalogRegistration.js';
import { createCustomProviderOnboardingController } from './appTopbarCustomProviderOnboarding.js';
import { createDreaminaLoginSessionController } from './appTopbarDreaminaSession.js';
const RUNNINGHUB_SETTINGS_PROVIDER_IDS = ['runninghub', 'runninghub-international'],
  API_PROVIDER_IDS = [
    'bailian',
    'grsai',
    'openai',
    'ppio',
    'apimart',
    'minimax',
    'minimax-international',
    'agnes-domestic',
    'agnes',
    'binghuo',
    'volcengine',
    'volcengine-speech',
    'runninghub',
    'runninghub-international',
    'comfyui',
  ],
  PROVIDER_TEST_STATUS_CLASSES = [
    'settings-provider-status--testing',
    'settings-provider-status--success',
    'settings-provider-status--partial',
    'settings-provider-status--danger',
    'settings-provider-status--configured',
    'settings-provider-status--unconfigured',
  ];
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
function hardenApiCredentialInputs(el3 = globalThis['document']) {
  (el3?.['querySelectorAll']?.('input[type="password"], [data-custom-provider-api-key]')?.['forEach'](
    markApiSecretInput,
  ),
    el3?.['querySelectorAll']?.(
      '#providerUrl-openai, #customProviderBaseUrl, [data-custom-provider-base-url]',
    )?.['forEach'](markNonLoginTextInput),
    el3?.['querySelectorAll']?.(
      '#customProviderDocumentationUrl, [data-custom-provider-documentation-url]',
    )?.['forEach'](markNonLoginTextInput));
}
export function createProviderSettingsController({
  store: store,
  configPort: configPort = {},
  customProviderPort: customProviderPort = {},
  dreaminaPort: dreaminaPort = {},
  uiPort: uiPort = {},
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const documentObject2 = documentObject,
    el4 = windowObject,
    {
      fetchConfig: fetchConfig,
      getConfigSnapshot: getConfigSnapshot,
      saveConfig: saveConfig,
      testConnections: testConnections,
    } = configPort,
    { refreshManifestModelNodeUis: refreshManifestModelNodeUis, showError: showError } = uiPort;
  let options = {},
    apiConfigAutoSaveController = null,
    target = Promise['resolve'](),
    runningHubDefaultSiteSettings = null;
  const providerStatusTooltipController = createProviderStatusTooltipController();
  let customProviderOnboardingController = null;
  // ── 厂商模型清单：从接口拉取、勾选、动态登记 ─────────────────────────────
  // 内置清单只能覆盖已适配的模型；厂商新增模型时，用户在这里拉一次真实列表即可选用。
  const providerModelCatalogBundleRegistry = createProviderModelCatalogBundleRegistry();
  function run(source = options) {
    try {
      return providerModelCatalogBundleRegistry['sync'](collectEnabledVendorModels(source));
    } catch (next) {
      console['warn']('[Provider Model Catalog] sync failed:', next);
      return { changed: false, registered: 0x0 };
    }
  }
  function run2(providerId, message = {}) {
    const catalog = readProviderModelCatalog(options?.['providers']?.[providerId] || {}),
      statusText = message['statusText'] ?? '';
    return renderProviderModelCatalogPanel({
      documentObject: documentObject2,
      providerId: providerId,
      catalog: catalog,
      statusText:
        statusText ||
        (catalog['models']['length']
          ? trApiInput('models.count', { count: catalog['models']['length'] })
          : ''),
      message: message['message'] || '',
      messageKind: message['messageKind'] || 'info',
    });
  }
  function run3(current) {
    const models = readProviderModelCatalogSelection(documentObject2, current);
    if (models['length'] === 0) return false;
    const entry = String(current || '')['trim']();
    options['providers'] = options['providers'] || {};
    options['providers'][entry] = applyProviderModelCatalog(options['providers'][entry], {
      fetchedAt: new Date()['toISOString'](),
      models: models['map']((id) => ({
        id: id['id'],
        kind: id['kind'] || inferProviderModelKind(entry, id['id']),
        enabled: id['enabled'],
      })),
    });
    return true;
  }
  async function run4(current, el5 = null) {
    const providerId2 = String(current || '')['trim']();
    if (!isProviderModelCatalogProvider(providerId2)) return false;
    const el6 = documentObject2['getElementById']('providerKey-' + providerId2),
      apiKey = String(el6?.['value'] || '')
        ['trim']()
        ['replace'](/^Bearer\s+/i, '');
    if (!apiKey) {
      (el4['showToast']?.(trApiInput('models.needKey'), 'error'), el6?.['focus']?.());
      return false;
    }
    if (el5) el5['disabled'] = true;
    run2(providerId2, {
      statusText: trApiInput('models.fetching'),
      message: trApiInput('models.fetching'),
    });
    try {
      const apiUrl = options?.['providers']?.[providerId2] || {},
        response = await fetchProviderModelList({
          providerId: providerId2,
          apiUrl: apiUrl['apiUrl'],
          apiKey: apiKey,
        });
      if (!response['success']) {
        run2(providerId2, {
          statusText: '',
          message: trApiInput('models.failed') + '：' + response['error'],
          messageKind: 'error',
        });
        return false;
      }
      if (response['models']['length'] === 0) {
        run2(providerId2, {
          statusText: '',
          message: trApiInput('models.empty'),
          messageKind: 'error',
        });
        return false;
      }
      // 拉取只刷新候选清单，不改动已勾选状态；写入配置由“保存选择”完成。
      const models2 = mergeProviderModelCatalog(
        providerId2,
        readProviderModelCatalog(apiUrl)['models'],
        response['models'],
      );
      renderProviderModelCatalogPanel({
        documentObject: documentObject2,
        providerId: providerId2,
        catalog: { fetchedAt: new Date()['toISOString'](), models: models2 },
        statusText: trApiInput('models.count', { count: models2['length'] }),
      });
      return true;
    } finally {
      if (el5) el5['disabled'] = false;
    }
  }
  async function run5(current) {
    const providerId2 = String(current || '')['trim']();
    if (!isProviderModelCatalogProvider(providerId2)) return false;
    if (!run3(providerId2)) return false;
    await apiConfigAutoSaveController?.['persist']();
    const record = run(options);
    refreshManifestModelNodeUis?.();
    const catalog = readProviderModelCatalog(options?.['providers']?.[providerId2] || {}),
      payload = record?.['skipped']?.['length'] || 0;
    run2(providerId2, {
      statusText: trApiInput('models.count', { count: catalog['models']['length'] }),
      message:
        trApiInput('models.saved') +
        (record?.['registered'] ? '（新增 ' + record['registered'] + ' 个）' : '') +
        (payload ? '（' + payload + ' 个需手动接入）' : ''),
      messageKind: 'success',
    });
    return true;
  }

  const map = new Set();
  function run6(handle) {
    const state = typeof handle === 'string' ? handle : handle?.['id'];
    if (state) map['add'](state);
  }
  function run7(enabled) {
    return !!enabled && !map['has'](enabled['id']);
  }
  function onConfigSnapshotChange(config) {
    ((options = config || {}), customProviderOnboardingController?.['syncConfigSnapshot'](options));
  }
  const dreaminaLoginSessionController = createDreaminaLoginSessionController({
    ...dreaminaPort,
    documentObject: documentObject,
    windowObject: windowObject,
  });
  customProviderOnboardingController = createCustomProviderOnboardingController({
    store: store,
    ...customProviderPort,
    saveApiConfigToServer: saveConfig,
    refreshManifestModelNodeUis: refreshManifestModelNodeUis,
    showError: showError,
    syncModelServiceReadinessSummary: syncModelServiceReadinessSummary,
    getConfigSnapshot: () => options,
    onConfigSnapshotChange: onConfigSnapshotChange,
    documentObject: documentObject,
    windowObject: windowObject,
  });
  const map2 = new Map(
    Object['entries'](PROVIDERS_META)
      ['filter'](([, scope]) => scope['apiRoutes'])
      ['map'](([input, routes]) => [
        input,
        createApiRouteSelection({
          buttons: Array['from'](documentObject2['querySelectorAll']('[data-' + input + '-route]')),
          urlElement: documentObject2['getElementById']('providerRouteUrl-' + input),
          routes: routes['apiRoutes'],
          resolveConfig: (output) => resolveProviderApiRoute(input, output),
          getButtonRouteId: (value2) => value2['getAttribute']('data-' + input + '-route'),
          formatCustomUrl: (value3) => trApiInput('route.custom', { value: value3 }),
        }),
      ]),
  );
  function collectConfig(value4 = options) {
    const run8 = (value5) =>
        String(value5 || '')
          ['trim']()
          ['replace'](/^Bearer\s+/i, ''),
      providers = {};
    (Object['entries'](value4?.['providers'] || {})['forEach'](([value6, args]) => {
      const enabled2 = String(value6 || '')['trim']();
      if (!enabled2 || API_PROVIDER_IDS['includes'](enabled2)) return;
      providers[enabled2] = args && typeof args === 'object' ? { ...args } : args;
    }),
      API_PROVIDER_IDS['forEach']((value7) => {
        const el7 = documentObject2['getElementById']('providerUrl-' + value7),
          el8 = documentObject2['getElementById']('providerKey-' + value7),
          args2 = value4?.['providers']?.[value7],
          value8 = args2 && typeof args2 === 'object' ? { ...args2 } : {};
        if (el7) value8['apiUrl'] = el7['value']['trim']();
        if (el8) value8['apiKey'] = run8(el8['value']);
        if (value7 === 'comfyui') {
          const el9 = documentObject2['getElementById']('providerUrl-comfyui-cloud');
          ((value8['apiUrl'] = normalizeComfyUiFormUrl(value8['apiUrl'], COMFYUI_LOCAL_DEFAULT_URL)),
            (value8['cloudApiUrl'] = normalizeComfyUiFormUrl(el9?.['value'] || '')));
        }
        (map2['has'](value7) && Object['assign'](value8, map2['get'](value7)['collect'](value8)),
          (providers[value7] = value8));
      }),
      RUNNINGHUB_SETTINGS_PROVIDER_IDS['forEach']((value9) => {
        const el10 = documentObject2['getElementById']('providerKey-' + value9 + '-model');
        if (!el10) return;
        ((providers[value9] = providers[value9] || {}),
          (providers[value9]['modelApiKey'] = run8(el10['value'])));
      }),
      API_PROVIDER_IDS['forEach']((value10) => {
        providers[value10] = reconcileProviderConnectionVerification(
          value4?.['providers']?.[value10] || {},
          providers[value10] || {},
          value10,
        );
      }));
    const value11 = { ...(value4 || {}), providers: providers };
    return runningHubDefaultSiteSettings?.['applyToConfig'](value11) || value11;
  }
  function run9(value12) {
    const value13 = value12?.['providers'] || {};
    return API_PROVIDER_IDS['filter']((value14) => {
      const value15 = value13[value14] || {};
      if (value14 === 'comfyui') return !!String(value15['apiUrl'] || value15['cloudApiUrl'] || '')['trim']();
      return !!String(value15['apiKey'] || value15['modelApiKey'] || '')['trim']();
    });
  }
  function run10(value16, value17) {
    const value18 = value16?.['providers']?.[value17] || {};
    if (value17 === 'comfyui')
      return Number(Boolean(String(value18['apiUrl'] || value18['cloudApiUrl'] || '')['trim']()));
    if (RUNNINGHUB_SETTINGS_PROVIDER_IDS['includes'](value17))
      return (
        Number(Boolean(String(value18['apiKey'] || '')['trim']())) +
        Number(Boolean(String(value18['modelApiKey'] || '')['trim']()))
      );
    return Number(Boolean(String(value18['apiKey'] || '')['trim']()));
  }
  function run11(value19) {
    const value20 = value19?.['providers'] || {};
    return Object['keys'](value20)['filter']((value21) => {
      const value22 = value20[value21] || {};
      if (value21 === 'comfyui') return !!String(value22['apiUrl'] || value22['cloudApiUrl'] || '')['trim']();
      return !!String(value22['apiKey'] || value22['modelApiKey'] || '')['trim']();
    });
  }
  function run12(value23, value24) {
    const value25 = value23?.['providers']?.[value24] || {};
    if (value24 === 'comfyui') return !!String(value25['apiUrl'] || value25['cloudApiUrl'] || '')['trim']();
    return !!String(value25['apiKey'] || value25['modelApiKey'] || '')['trim']();
  }
  function run13(value26, value27 = '') {
    const comfyUiConnectionTarget = normalizeComfyUiConnectionTarget(value27),
      value28 =
        value26 === 'comfyui'
          ? getComfyUiStatusElementId(comfyUiConnectionTarget)
          : 'providerTestStatus-' + value26,
      value29 = documentObject2['getElementById'](value28);
    return (providerStatusTooltipController['bind'](value29), value29);
  }
  function run14(value30) {
    const value31 = documentObject2['getElementById']('providerBalance-' + value30);
    return (providerStatusTooltipController['bind'](value31), value31);
  }
  function run15(value32, value33 = '') {
    const comfyUiConnectionTarget2 = normalizeComfyUiConnectionTarget(value33);
    if (value32 === 'comfyui' && !comfyUiConnectionTarget2) {
      (run15(value32, 'local'), run15(value32, 'cloud'));
      return;
    }
    const el11 = run13(value32, comfyUiConnectionTarget2);
    (el11 &&
      (providerStatusTooltipController['hide'](el11),
      (el11['hidden'] = !![]),
      (el11['textContent'] = ''),
      el11['removeAttribute']('title'),
      el11['removeAttribute']('data-tooltip'),
      el11['removeAttribute']('data-tooltip-source'),
      el11['removeAttribute']('data-native-title'),
      el11['removeAttribute']('data-provider-test-tooltip'),
      el11['removeAttribute']('aria-label'),
      el11['removeAttribute']('tabindex'),
      el11['setAttribute']('aria-busy', 'false'),
      el11['classList']['remove'](...PROVIDER_TEST_STATUS_CLASSES)),
      run16(value32));
  }
  function run17(value34, value35, value36, value37 = '', value38 = '') {
    const comfyUiConnectionTarget3 = normalizeComfyUiConnectionTarget(value38);
    if (value34 === 'comfyui' && !comfyUiConnectionTarget3) {
      (run17(value34, value35, value36, value37, 'local'),
        run17(value34, value35, value36, value37, 'cloud'));
      return;
    }
    const el12 = run13(value34, comfyUiConnectionTarget3);
    if (!el12) return;
    const value39 = String(value36 || '')['trim'](),
      value40 = String(value37 || '')['trim']();
    ((el12['hidden'] = ![]),
      (el12['textContent'] = value39),
      el12['setAttribute']('aria-busy', String(value35 === 'testing')),
      el12['removeAttribute']('title'),
      el12['removeAttribute']('data-tooltip'),
      el12['removeAttribute']('data-tooltip-source'),
      el12['removeAttribute']('data-native-title'));
    value40 && value40 !== value39
      ? (el12['setAttribute']('data-provider-test-tooltip', value40),
        el12['setAttribute']('aria-label', value40),
        el12['setAttribute']('tabindex', '0'))
      : (providerStatusTooltipController['hide'](el12),
        el12['removeAttribute']('data-provider-test-tooltip'),
        el12['removeAttribute']('aria-label'),
        el12['removeAttribute']('tabindex'));
    el12['classList']['remove'](...PROVIDER_TEST_STATUS_CLASSES);
    if (value35 === 'success') el12['classList']['add']('settings-provider-status--success');
    else {
      if (value35 === 'testing') el12['classList']['add']('settings-provider-status--testing');
      else {
        if (value35 === 'partial') el12['classList']['add']('settings-provider-status--partial');
        else {
          if (value35 === 'configured') el12['classList']['add']('settings-provider-status--configured');
          else {
            if (value35 === 'unconfigured')
              el12['classList']['add']('settings-provider-status--unconfigured');
            else el12['classList']['add']('settings-provider-status--danger');
          }
        }
      }
    }
  }
  function run18(value41, value42) {
    if (value42 === 'comfyui') {
      getComfyUiEndpointStatusEntries(value41)['forEach'](
        ({ target: target2, tone: tone, textKey: textKey }) => {
          run17('comfyui', tone, trApiInput(textKey), '', target2);
        },
      );
      return;
    }
    const count = run10(value41, value42),
      total = RUNNINGHUB_SETTINGS_PROVIDER_IDS['includes'](value42) ? 0x2 : 0x1;
    if (count > 0x0) {
      if (isProviderConnectionVerified(value41, value42)) {
        run17(value42, 'success', trApiInput('diagnostics.passed'));
        return;
      }
      if (value41?.['providers']?.[value42]?.['connectionVerification']?.['status'] === 'partial') {
        run17(value42, 'partial', trApiInput('diagnostics.partialPassed'));
        return;
      }
      run17(
        value42,
        'configured',
        total > 0x1
          ? trApiInput('statuses.configuredCount', { count: count, total: total })
          : trApiInput('statuses.configured'),
      );
      return;
    }
    run17(value42, 'unconfigured', trApiInput('statuses.unconfigured'));
  }
  function run19(value43) {
    API_PROVIDER_IDS['forEach']((value44) => {
      run18(value43, value44);
    });
  }
  function syncModelServiceReadinessSummary(value45) {
    const el13 = documentObject2['getElementById']('modelServiceReadinessSummary'),
      el14 = documentObject2['getElementById']('modelServiceReadinessDesc'),
      el15 = documentObject2['getElementById']('modelServiceReadinessStatus');
    if (!el13 || !el14 || !el15) return;
    const count2 = run11(value45)['length'];
    ((el13['dataset']['state'] = count2 > 0x0 ? 'ready' : 'empty'),
      (el14['textContent'] = trApiInput(count2 > 0x0 ? 'readiness.ready' : 'readiness.empty', {
        count: count2,
      })),
      (el15['textContent'] = trApiInput(count2 > 0x0 ? 'readiness.readyShort' : 'readiness.emptyShort', {
        count: count2,
      })));
  }
  function run16(value46) {
    const el16 = run14(value46);
    if (!el16) return;
    (providerStatusTooltipController['hide'](el16),
      (el16['hidden'] = !![]),
      (el16['textContent'] = ''),
      el16['removeAttribute']('aria-label'),
      el16['removeAttribute']('data-provider-test-tooltip'));
  }
  function run20(value47, value48 = null) {
    const el17 = run14(value47);
    if (!el17) return;
    const enabled3 = String(value48?.['displayText'] || '')['trim']();
    if (!enabled3) {
      run16(value47);
      return;
    }
    const value49 = String(value48?.['detailText'] || enabled3)['trim']();
    ((el17['hidden'] = ![]),
      (el17['textContent'] = enabled3),
      el17['setAttribute']('aria-label', value49),
      el17['setAttribute']('data-provider-test-tooltip', value49));
  }
  function run21(value50) {
    const count3 = Number(value50);
    if (!Number['isFinite'](count3) || count3 <= 0x0) return null;
    return Math['max'](0x1, Math['floor'](count3));
  }
  function run22(value51, enabled4 = null) {
    if (!enabled4 || typeof enabled4 !== 'object') return null;
    const value52 = String(value51 || '')
      ['trim']()
      ['toLowerCase']();
    if (RUNNINGHUB_SETTINGS_PROVIDER_IDS['includes'](value52)) {
      const value53 = run21(enabled4['workflowConcurrentLimit']),
        value54 = run21(enabled4['modelConcurrentLimit']),
        value55 = {};
      return (
        value53 !== null && (value55['workflowConcurrentLimit'] = value53),
        value54 !== null && (value55['modelConcurrentLimit'] = value54),
        enabled4['workflowApiKeyType'] &&
          (value55['workflowApiKeyType'] = String(enabled4['workflowApiKeyType'] || '')['trim']()),
        enabled4['modelApiKeyType'] &&
          (value55['modelApiKeyType'] = String(enabled4['modelApiKeyType'] || '')['trim']()),
        Object['keys'](value55)['length'] ? value55 : null
      );
    }
    const concurrentLimit = run21(enabled4['concurrentLimit']);
    return concurrentLimit === null ? null : { concurrentLimit: concurrentLimit };
  }
  function run23(options2 = {}) {
    return formatProviderDiagnosticDetail(options2, {
      skipped: trApiInput('diagnostics.skipped'),
      passed: trApiInput('diagnostics.passed'),
      failed: trApiInput('diagnostics.failed'),
      step: trApiInput('diagnostics.step'),
    });
  }
  function run24(response2 = {}) {
    if (response2['partial']) return 'partial';
    if (response2['ok']) return 'success';
    return 'danger';
  }
  function run25(response3 = {}) {
    if (response3['partial']) return trApiInput('diagnostics.partialPassed');
    if (response3['ok']) return trApiInput('diagnostics.passed');
    return trApiInput('diagnostics.notPassed');
  }
  function run26() {
    API_PROVIDER_IDS['forEach'](run15);
  }
  function run27() {
    const run28 = (value56) => {
        const value57 = collectConfig();
        (run15(value56),
          run18(value57, value56),
          syncModelServiceReadinessSummary(value57),
          apiConfigAutoSaveController?.['schedule']());
      },
      handler = (el18, value58) => {
        (el18?.['addEventListener']('input', () => {
          (run6(el18), run28(value58));
        }),
          el18?.['addEventListener']('change', () => {
            (run6(el18), apiConfigAutoSaveController?.['persist']()['catch'](() => {}));
          }));
      };
    (API_PROVIDER_IDS['forEach']((value59) => {
      const value60 = documentObject2['getElementById']('providerUrl-' + value59),
        value61 = documentObject2['getElementById']('providerKey-' + value59);
      (handler(value60, value59), handler(value61, value59));
    }),
      handler(documentObject2['getElementById']('providerUrl-comfyui-cloud'), 'comfyui'),
      map2['forEach']((value62, value63) => {
        value62['bind'](() => {
          (run6('providerRoute-' + value63), run28(value63));
        });
      }),
      RUNNINGHUB_SETTINGS_PROVIDER_IDS['forEach']((value64) => {
        handler(documentObject2['getElementById']('providerKey-' + value64 + '-model'), value64);
      }));
  }
  async function run29(el19, value65 = {}) {
    if (typeof testConnections !== 'function') {
      el4['showToast']?.(trApiInput('diagnostics.testUnsupported'), 'error');
      return;
    }
    const enabled5 = await apiConfigAutoSaveController?.['persist']();
    if (!enabled5) return;
    const value66 = String(value65?.['providerId'] || '')
        ['trim']()
        ['toLowerCase'](),
      target3 = value66 === 'comfyui' ? normalizeComfyUiConnectionTarget(value65?.['comfyUiTarget']) : '',
      list = value66 ? [value66] : run9(enabled5);
    value66 ? run15(value66, target3) : run26();
    const enabled6 = target3 ? isComfyUiEndpointConfigured(enabled5, target3) : !![];
    if (value66 && (!run12(enabled5, value66) || !enabled6)) {
      (run18(enabled5, value66),
        el4['showToast']?.(
          trApiInput(value66 === 'comfyui' ? 'diagnostics.fillProviderUrl' : 'diagnostics.fillProviderKey'),
          'warn',
        ));
      return;
    }
    if (list['length'] === 0x0) {
      (run19(enabled5),
        syncModelServiceReadinessSummary(enabled5),
        el4['showToast']?.(trApiInput('diagnostics.fillOneProviderKey'), 'warn'));
      return;
    }
    list['forEach']((value67) =>
      run17(value67, 'testing', trApiInput('diagnostics.testing'), '', value67 === 'comfyui' ? target3 : ''),
    );
    const el20 = el19?.['querySelector']?.('.settings-btn-label'),
      value68 = el20?.['textContent'] || el19?.['textContent'] || trApiInput('testConnection');
    if (el19) {
      el19['disabled'] = !![];
      if (el20) el20['textContent'] = trApiInput('diagnostics.testingBusy');
      else el19['textContent'] = trApiInput('diagnostics.testingBusy');
    }
    const providerResults = {},
      list2 = [],
      list3 = [];
    let list4 = [];
    const map3 = new Map();
    try {
      await Promise['all'](
        list['map'](async (label) => {
          try {
            const value69 = await testConnections(
              enabled5,
              [label],
              label === 'comfyui' && target3 ? { target: target3 } : {},
            );
            providerResults[label] = value69?.[label];
          } catch (error) {
            providerResults[label] = {
              ok: ![],
              label: label,
              error: error?.['message'] || trApiInput('diagnostics.testFailed'),
            };
          }
          const label2 = providerResults[label];
          run20(label, label2?.['balance']);
          const value70 = run22(label, label2?.['balance']);
          if (value70) map3['set'](label, value70);
          (shouldPersistProviderConnectionResult(label, label2) && list3['push'](label),
            !label2?.['ok'] &&
              list2['push']({
                id: label,
                label: label2?.['label'] || label,
                error:
                  label2?.['suggestion'] ||
                  label2?.['summary'] ||
                  label2?.['error'] ||
                  trApiInput('diagnostics.testNotPassed'),
              }));
        }),
      );
      if (list3['length'] > 0x0) {
        const value71 = collectConfig(
            typeof getConfigSnapshot === 'function' ? getConfigSnapshot() : options,
          ),
          currentProviderConnectionResults = mergeCurrentProviderConnectionResults(
            value71,
            enabled5,
            list3,
            map3,
            {
              connectionCapabilities: target3 ? { comfyui: target3 } : {},
              providerResults: providerResults,
            },
          );
        ((list4 = currentProviderConnectionResults['staleProviderIds']),
          list4['forEach']((value72) => {
            (run16(value72), run18(currentProviderConnectionResults['config'], value72));
          }));
        try {
          currentProviderConnectionResults['appliedProviderIds']['length'] > 0x0 &&
            (await saveConfig(currentProviderConnectionResults['config']),
            onConfigSnapshotChange(currentProviderConnectionResults['config']),
            syncModelServiceReadinessSummary(currentProviderConnectionResults['config']),
            refreshManifestModelNodeUis?.());
        } catch (error2) {
          console['warn']('[API\x20Config]\x20provider\x20diagnostics\x20save\x20failed:', error2);
          const value73 = collectConfig(
            typeof getConfigSnapshot === 'function' ? getConfigSnapshot() : options,
          );
          (list['forEach']((value74) => {
            (run16(value74), run18(value73, value74));
          }),
            syncModelServiceReadinessSummary(value73),
            el4['showToast']?.(
              trApiInput('diagnostics.saveFailed', {
                error: error2?.['message'] || trApiInput('diagnostics.unknownError'),
              }),
              'error',
            ));
          return;
        }
      }
      list['filter']((value75) => !list4['includes'](value75))['forEach']((value76) => {
        const response4 = providerResults[value76];
        run17(
          value76,
          response4?.['ok'] ? 'success' : run24(response4),
          response4?.['ok'] ? trApiInput('diagnostics.passed') : run25(response4),
          run23(response4) ||
            (response4?.['ok']
              ? trApiInput('diagnostics.testPassed')
              : response4?.['error'] || trApiInput('diagnostics.testNotPassed')),
          value76 === 'comfyui' ? target3 : '',
        );
      });
      const list5 = list2['filter'](({ id: id2 }) => !list4['includes'](id2));
      if (list5['length'] === 0x0 && list4['length'] === 0x0) {
        const label3 = providerResults[list[0x0]],
          value77 = value66
            ? trApiInput('diagnostics.providerPassed', { label: label3?.['label'] || value66 })
            : trApiInput('diagnostics.allPassed');
        el4['showToast']?.(value77, 'success');
      } else {
        if (list5['length'] > 0x0) {
          const label4 = list5[0x0];
          el4['showToast']?.(
            trApiInput('diagnostics.providerFailed', {
              label: label4['label'],
              error: label4['error'],
            }),
            'error',
            0x2328,
          );
        }
      }
    } catch (error3) {
      (list['forEach']((value78) =>
        run17(
          value78,
          'danger',
          trApiInput('diagnostics.notPassed'),
          error3?.['message'] || trApiInput('diagnostics.testFailed'),
          value78 === 'comfyui' ? target3 : '',
        ),
      ),
        el4['showToast']?.(
          trApiInput('diagnostics.testFailedWithDetail', {
            error: error3?.['message'] || trApiInput('diagnostics.unknownError'),
          }),
          'error',
        ));
    } finally {
      if (el19) {
        el19['disabled'] = ![];
        if (el20) el20['textContent'] = value68;
        else el19['textContent'] = value68;
      }
    }
  }
  function init() {
    const el21 = documentObject2['getElementById']('btnApiSave'),
      onStateChange = createApiConfigSavePresentation();
    (dreaminaLoginSessionController['syncDevVisibility'](),
      (apiConfigAutoSaveController = createApiConfigAutoSaveController({
        beforePersist: () => target,
        collectConfig: collectConfig,
        saveConfig: saveConfig,
        onStateChange: onStateChange['update'],
        onSaved: (value79, { showSuccess: showSuccess = ![] } = {}) => {
          (onConfigSnapshotChange(value79),
            run19(value79),
            syncModelServiceReadinessSummary(value79),
            refreshManifestModelNodeUis?.());
          if (showSuccess) el4['showToast']?.(trApiInput('diagnostics.saveSuccess'));
        },
        onError: (error4) =>
          el4['showToast']?.(
            trApiInput('diagnostics.saveFailed', {
              error: error4?.['message'] || trApiInput('diagnostics.unknownError'),
            }),
            'error',
          ),
      })),
      hardenApiCredentialInputs(documentObject2),
      runningHubDefaultSiteSettings?.['destroy']?.(),
      (runningHubDefaultSiteSettings = createRunningHubDefaultSiteSettings({
        root: documentObject2,
        onSelectionChange: () => {
          (run6('runninghub-default-site'), apiConfigAutoSaveController?.['persist']()['catch'](() => {}));
        },
      })),
      runningHubDefaultSiteSettings['bind'](),
      bindModelCatalogProviderCardVisibility({
        store: store,
        card: documentObject2['querySelector']('[data-subscription-provider-card=\x22binghuo\x22]'),
        providerId: 'binghuo',
      }),
      (target = Promise['resolve']()
        ['then'](() => fetchConfig())
        ['then']((enabled7) => {
          if (!enabled7 || enabled7['error']) return;
          (onConfigSnapshotChange(enabled7 || {}), runningHubDefaultSiteSettings?.['loadConfig'](options));
          const enabled8 = enabled7['providers'] || {};
          API_PROVIDER_IDS['forEach']((value80) => {
            const el22 = documentObject2['getElementById']('providerUrl-' + value80),
              el23 = documentObject2['getElementById']('providerKey-' + value80),
              enabled9 = enabled8[value80] || {};
            if (run7(el22) && enabled9['apiUrl']) el22['value'] = enabled9['apiUrl'];
            value80 === 'comfyui' &&
              run7(el22) &&
              !enabled9['apiUrl'] &&
              (el22['value'] = COMFYUI_LOCAL_DEFAULT_URL);
            if (run7(el23) && enabled9['apiKey']) el23['value'] = enabled9['apiKey'];
          });
          const el24 = documentObject2['getElementById']('providerUrl-comfyui-cloud');
          run7(el24) && (el24['value'] = enabled8['comfyui']?.['cloudApiUrl'] || '');
          (map2['forEach']((value81, value82) => {
            !map['has']('providerRoute-' + value82) && value81['hydrate'](enabled8[value82] || {});
          }),
            RUNNINGHUB_SETTINGS_PROVIDER_IDS['forEach']((value83) => {
              const el25 = documentObject2['getElementById']('providerKey-' + value83 + '-model');
              run7(el25) &&
                enabled8[value83]?.['modelApiKey'] &&
                (el25['value'] = enabled8[value83]['modelApiKey']);
            }));
          if (!enabled8['grsai']?.['apiKey'] && enabled7['apiKey']) {
            const el26 = documentObject2['getElementById']('providerKey-grsai');
            if (run7(el26) && !el26['value']) el26['value'] = enabled7['apiKey'];
          }
          (run(options),
            PROVIDER_MODEL_CATALOG_PROVIDER_IDS['forEach']((value84) => run2(value84)),
            customProviderOnboardingController['syncEditorCredentials'](enabled8),
            customProviderOnboardingController['syncDefaults'](enabled8),
            map['size'] && onConfigSnapshotChange(collectConfig(enabled7)),
            run19(options),
            syncModelServiceReadinessSummary(options),
            refreshManifestModelNodeUis?.());
        })
        ['catch']((error5) => {
          (console['error']('[API Config] 加载失败:', error5),
            run19({}),
            syncModelServiceReadinessSummary({}),
            showError?.(
              trApiInput('diagnostics.loadFailed', {
                error: error5['message'] || trApiInput('diagnostics.unknownError'),
              }),
            ));
        })
        ['finally'](() => {
          dreaminaLoginSessionController['syncDevVisibility']() &&
            dreaminaLoginSessionController['refreshStatus']({ force: !![], silent: !![] })['catch'](() => {});
        })),
      el21 &&
        el21['addEventListener']('click', () => {
          apiConfigAutoSaveController['persist']({ showSuccess: !![] })['then']((enabled10) => {
            if (!enabled10) return;
            dreaminaLoginSessionController['refreshStatus']({ force: !![], silent: !![] })['catch'](() => {});
          });
        }),
      el4['addEventListener']('settings-panel-closed', () => {
        apiConfigAutoSaveController?.['flush']()['catch'](() => {});
      }),
      documentObject2['querySelectorAll']('[data-provider-test]')['forEach']((comfyUiTarget) => {
        const providerId3 = String(comfyUiTarget['dataset']['providerTest'] || '')['trim']();
        if (!providerId3) return;
        comfyUiTarget['addEventListener']('click', () => {
          run29(comfyUiTarget, {
            providerId: providerId3,
            comfyUiTarget: comfyUiTarget['dataset']['comfyuiTestTarget'],
          })['catch'](() => {});
        });
      }),
      documentObject2['querySelectorAll']('[data-provider-models]')['forEach']((el27) => {
        const enabled11 = String(el27['dataset']['providerModels'] || '')['trim']();
        if (!enabled11) return;
        el27['addEventListener']('click', () => {
          run4(enabled11, el27)['catch'](() => {});
        });
      }),
      (documentObject2['getElementById']('pane-api-input') || documentObject2)['addEventListener'](
        'click',
        (event) => {
          const el28 = event?.['target']?.['closest']?.('[data-provider-model-save]');
          if (!el28) return;
          event['preventDefault']?.();
          run5(String(el28['dataset']['providerModelSave'] || '')['trim']())['catch'](() => {});
        },
      ),
      run27(),
      bindProviderApiKeyGuideTriggers(documentObject2),
      bindVolcengineSpeechApiKeyGuideTriggers(documentObject2),
      bindRunningHubApiKeyGuideTriggers(documentObject2),
      customProviderOnboardingController['init'](),
      dreaminaLoginSessionController['init']());
  }
  return {
    destroy() {
      (dreaminaLoginSessionController['destroy'](), runningHubDefaultSiteSettings?.['destroy']?.());
    },
    init: init,
    syncModelServiceReadinessSummary: syncModelServiceReadinessSummary,
  };
}
