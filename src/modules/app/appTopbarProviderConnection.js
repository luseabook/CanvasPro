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
function trTemplate(_0x516aac, _0x2f605a = {}) {
  let _0x4d1594 = t(_0x516aac);
  return (
    Object['entries'](_0x2f605a || {})['forEach'](([_0x476e6c, _0x5d2a5e]) => {
      _0x4d1594 = _0x4d1594['split']('{' + _0x476e6c + '}')['join'](String(_0x5d2a5e ?? ''));
    }),
    _0x4d1594
  );
}
function trApiInput(_0x5a35b4, _0x398bbd = {}) {
  return trTemplate('settings.apiInput.' + _0x5a35b4, _0x398bbd);
}
function markNonLoginTextInput(_0x39dac8) {
  if (!_0x39dac8) return;
  ((_0x39dac8['autocomplete'] = 'off'),
    _0x39dac8['setAttribute']('autocomplete', 'off'),
    _0x39dac8['setAttribute']('autocapitalize', 'off'),
    _0x39dac8['setAttribute']('spellcheck', 'false'),
    _0x39dac8['setAttribute']('data-form-type', 'other'));
}
function markApiSecretInput(_0xd82b71) {
  if (!_0xd82b71) return;
  ((_0xd82b71['autocomplete'] = 'new-password'),
    _0xd82b71['setAttribute']('autocomplete', 'new-password'),
    _0xd82b71['setAttribute']('autocapitalize', 'off'),
    _0xd82b71['setAttribute']('spellcheck', 'false'),
    _0xd82b71['setAttribute']('data-lpignore', 'true'),
    _0xd82b71['setAttribute']('data-1p-ignore', 'true'),
    _0xd82b71['setAttribute']('data-form-type', 'other'));
}
function hardenApiCredentialInputs(_0x3f282b = globalThis['document']) {
  (_0x3f282b?.['querySelectorAll']?.('input[type="password"], [data-custom-provider-api-key]')?.['forEach'](
    markApiSecretInput,
  ),
    _0x3f282b?.['querySelectorAll']?.(
      '#providerUrl-openai, #customProviderBaseUrl, [data-custom-provider-base-url]',
    )?.['forEach'](markNonLoginTextInput),
    _0x3f282b?.['querySelectorAll']?.(
      '#customProviderDocumentationUrl, [data-custom-provider-documentation-url]',
    )?.['forEach'](markNonLoginTextInput));
}
export function createProviderSettingsController({
  store: _0x4549e7,
  configPort: configPort = {},
  customProviderPort: customProviderPort = {},
  dreaminaPort: dreaminaPort = {},
  uiPort: uiPort = {},
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const _0x50ad60 = documentObject,
    _0xd96ce0 = windowObject,
    {
      fetchConfig: _0xa6e333,
      getConfigSnapshot: _0x1eaf0d,
      saveConfig: _0x147283,
      testConnections: _0x4d862d,
    } = configPort,
    { refreshManifestModelNodeUis: _0x48dc00, showError: _0x3ba721 } = uiPort;
  let _0x4fcbd4 = {},
    _0x3acf88 = null,
    _0x3ad40e = Promise['resolve'](),
    _0x287e45 = null;
  const _0x134865 = createProviderStatusTooltipController();
  let _0x1bab9a = null;
  const _0x5ef025 = new Set();
  function _0x4b4d05(_0x3a4849) {
    const _0xa89355 = typeof _0x3a4849 === 'string' ? _0x3a4849 : _0x3a4849?.['id'];
    if (_0xa89355) _0x5ef025['add'](_0xa89355);
  }
  function _0x5ba888(_0x59fc36) {
    return !!_0x59fc36 && !_0x5ef025['has'](_0x59fc36['id']);
  }
  function _0x2b288c(_0x4e7da8) {
    ((_0x4fcbd4 = _0x4e7da8 || {}), _0x1bab9a?.['syncConfigSnapshot'](_0x4fcbd4));
  }
  const _0x3fbc29 = createDreaminaLoginSessionController({
    ...dreaminaPort,
    documentObject: documentObject,
    windowObject: windowObject,
  });
  _0x1bab9a = createCustomProviderOnboardingController({
    store: _0x4549e7,
    ...customProviderPort,
    saveApiConfigToServer: _0x147283,
    refreshManifestModelNodeUis: _0x48dc00,
    showError: _0x3ba721,
    syncModelServiceReadinessSummary: _0x369069,
    getConfigSnapshot: () => _0x4fcbd4,
    onConfigSnapshotChange: _0x2b288c,
    documentObject: documentObject,
    windowObject: windowObject,
  });
  const _0x1b412d = new Map(
    Object['entries'](PROVIDERS_META)
      ['filter'](([, _0x2c709b]) => _0x2c709b['apiRoutes'])
      ['map'](([_0x249a99, _0xb1473e]) => [
        _0x249a99,
        createApiRouteSelection({
          buttons: Array['from'](_0x50ad60['querySelectorAll']('[data-' + _0x249a99 + '-route]')),
          urlElement: _0x50ad60['getElementById']('providerRouteUrl-' + _0x249a99),
          routes: _0xb1473e['apiRoutes'],
          resolveConfig: (_0x46798c) => resolveProviderApiRoute(_0x249a99, _0x46798c),
          getButtonRouteId: (_0x52c299) => _0x52c299['getAttribute']('data-' + _0x249a99 + '-route'),
          formatCustomUrl: (_0x1391bc) => trApiInput('route.custom', { value: _0x1391bc }),
        }),
      ]),
  );
  function _0x167079(_0x29ca4c = _0x4fcbd4) {
    const _0x18d38b = (_0x2baac4) =>
        String(_0x2baac4 || '')
          ['trim']()
          ['replace'](/^Bearer\s+/i, ''),
      _0x31be17 = {};
    (Object['entries'](_0x29ca4c?.['providers'] || {})['forEach'](([_0x11c963, _0x2a225d]) => {
      const _0x22f54e = String(_0x11c963 || '')['trim']();
      if (!_0x22f54e || API_PROVIDER_IDS['includes'](_0x22f54e)) return;
      _0x31be17[_0x22f54e] = _0x2a225d && typeof _0x2a225d === 'object' ? { ..._0x2a225d } : _0x2a225d;
    }),
      API_PROVIDER_IDS['forEach']((_0xb91a2) => {
        const _0x2c127c = _0x50ad60['getElementById']('providerUrl-' + _0xb91a2),
          _0x587574 = _0x50ad60['getElementById']('providerKey-' + _0xb91a2),
          _0x528191 = _0x29ca4c?.['providers']?.[_0xb91a2],
          _0x42d60e = _0x528191 && typeof _0x528191 === 'object' ? { ..._0x528191 } : {};
        if (_0x2c127c) _0x42d60e['apiUrl'] = _0x2c127c['value']['trim']();
        if (_0x587574) _0x42d60e['apiKey'] = _0x18d38b(_0x587574['value']);
        if (_0xb91a2 === 'comfyui') {
          const _0xb0ce5b = _0x50ad60['getElementById']('providerUrl-comfyui-cloud');
          ((_0x42d60e['apiUrl'] = normalizeComfyUiFormUrl(_0x42d60e['apiUrl'], COMFYUI_LOCAL_DEFAULT_URL)),
            (_0x42d60e['cloudApiUrl'] = normalizeComfyUiFormUrl(_0xb0ce5b?.['value'] || '')));
        }
        (_0x1b412d['has'](_0xb91a2) &&
          Object['assign'](_0x42d60e, _0x1b412d['get'](_0xb91a2)['collect'](_0x42d60e)),
          (_0x31be17[_0xb91a2] = _0x42d60e));
      }),
      RUNNINGHUB_SETTINGS_PROVIDER_IDS['forEach']((_0xb210e9) => {
        const _0x2ad914 = _0x50ad60['getElementById']('providerKey-' + _0xb210e9 + '-model');
        if (!_0x2ad914) return;
        ((_0x31be17[_0xb210e9] = _0x31be17[_0xb210e9] || {}),
          (_0x31be17[_0xb210e9]['modelApiKey'] = _0x18d38b(_0x2ad914['value'])));
      }),
      API_PROVIDER_IDS['forEach']((_0x14006c) => {
        _0x31be17[_0x14006c] = reconcileProviderConnectionVerification(
          _0x29ca4c?.['providers']?.[_0x14006c] || {},
          _0x31be17[_0x14006c] || {},
          _0x14006c,
        );
      }));
    const _0x31f2e1 = { ...(_0x29ca4c || {}), providers: _0x31be17 };
    return _0x287e45?.['applyToConfig'](_0x31f2e1) || _0x31f2e1;
  }
  function _0x412cb9(_0x2ba5e4) {
    const _0x3bc40f = _0x2ba5e4?.['providers'] || {};
    return API_PROVIDER_IDS['filter']((_0x32a104) => {
      const _0x1d91fd = _0x3bc40f[_0x32a104] || {};
      if (_0x32a104 === 'comfyui')
        return !!String(_0x1d91fd['apiUrl'] || _0x1d91fd['cloudApiUrl'] || '')['trim']();
      return !!String(_0x1d91fd['apiKey'] || _0x1d91fd['modelApiKey'] || '')['trim']();
    });
  }
  function _0x53788b(_0x56ba8c, _0x43e8da) {
    const _0x351bd3 = _0x56ba8c?.['providers']?.[_0x43e8da] || {};
    if (_0x43e8da === 'comfyui')
      return Number(Boolean(String(_0x351bd3['apiUrl'] || _0x351bd3['cloudApiUrl'] || '')['trim']()));
    if (RUNNINGHUB_SETTINGS_PROVIDER_IDS['includes'](_0x43e8da))
      return (
        Number(Boolean(String(_0x351bd3['apiKey'] || '')['trim']())) +
        Number(Boolean(String(_0x351bd3['modelApiKey'] || '')['trim']()))
      );
    return Number(Boolean(String(_0x351bd3['apiKey'] || '')['trim']()));
  }
  function _0x1d917d(_0x23e827) {
    const _0x1f2942 = _0x23e827?.['providers'] || {};
    return Object['keys'](_0x1f2942)['filter']((_0x29a46c) => {
      const _0x1f6e44 = _0x1f2942[_0x29a46c] || {};
      if (_0x29a46c === 'comfyui')
        return !!String(_0x1f6e44['apiUrl'] || _0x1f6e44['cloudApiUrl'] || '')['trim']();
      return !!String(_0x1f6e44['apiKey'] || _0x1f6e44['modelApiKey'] || '')['trim']();
    });
  }
  function _0x53cee2(_0x51cf73, _0x3c8d36) {
    const _0xda7595 = _0x51cf73?.['providers']?.[_0x3c8d36] || {};
    if (_0x3c8d36 === 'comfyui')
      return !!String(_0xda7595['apiUrl'] || _0xda7595['cloudApiUrl'] || '')['trim']();
    return !!String(_0xda7595['apiKey'] || _0xda7595['modelApiKey'] || '')['trim']();
  }
  function _0x46a080(_0x9845d3, _0x2b8b42 = '') {
    const _0x4b5819 = normalizeComfyUiConnectionTarget(_0x2b8b42),
      _0x59fc0e =
        _0x9845d3 === 'comfyui' ? getComfyUiStatusElementId(_0x4b5819) : 'providerTestStatus-' + _0x9845d3,
      _0x50782f = _0x50ad60['getElementById'](_0x59fc0e);
    return (_0x134865['bind'](_0x50782f), _0x50782f);
  }
  function _0x96c62f(_0x190e90) {
    const _0x37e06c = _0x50ad60['getElementById']('providerBalance-' + _0x190e90);
    return (_0x134865['bind'](_0x37e06c), _0x37e06c);
  }
  function _0xf29880(_0x17b5d0, _0x5cc358 = '') {
    const _0x17bdda = normalizeComfyUiConnectionTarget(_0x5cc358);
    if (_0x17b5d0 === 'comfyui' && !_0x17bdda) {
      (_0xf29880(_0x17b5d0, 'local'), _0xf29880(_0x17b5d0, 'cloud'));
      return;
    }
    const _0x5292a9 = _0x46a080(_0x17b5d0, _0x17bdda);
    (_0x5292a9 &&
      (_0x134865['hide'](_0x5292a9),
      (_0x5292a9['hidden'] = !![]),
      (_0x5292a9['textContent'] = ''),
      _0x5292a9['removeAttribute']('title'),
      _0x5292a9['removeAttribute']('data-tooltip'),
      _0x5292a9['removeAttribute']('data-tooltip-source'),
      _0x5292a9['removeAttribute']('data-native-title'),
      _0x5292a9['removeAttribute']('data-provider-test-tooltip'),
      _0x5292a9['removeAttribute']('aria-label'),
      _0x5292a9['removeAttribute']('tabindex'),
      _0x5292a9['setAttribute']('aria-busy', 'false'),
      _0x5292a9['classList']['remove'](...PROVIDER_TEST_STATUS_CLASSES)),
      _0x401c30(_0x17b5d0));
  }
  function _0x5110c3(_0x2fffb7, _0x386908, _0x127407, _0x29e386 = '', _0x1449ac = '') {
    const _0xdce924 = normalizeComfyUiConnectionTarget(_0x1449ac);
    if (_0x2fffb7 === 'comfyui' && !_0xdce924) {
      (_0x5110c3(_0x2fffb7, _0x386908, _0x127407, _0x29e386, 'local'),
        _0x5110c3(_0x2fffb7, _0x386908, _0x127407, _0x29e386, 'cloud'));
      return;
    }
    const _0x1e8ac6 = _0x46a080(_0x2fffb7, _0xdce924);
    if (!_0x1e8ac6) return;
    const _0x5bf404 = String(_0x127407 || '')['trim'](),
      _0x59a124 = String(_0x29e386 || '')['trim']();
    ((_0x1e8ac6['hidden'] = ![]),
      (_0x1e8ac6['textContent'] = _0x5bf404),
      _0x1e8ac6['setAttribute']('aria-busy', String(_0x386908 === 'testing')),
      _0x1e8ac6['removeAttribute']('title'),
      _0x1e8ac6['removeAttribute']('data-tooltip'),
      _0x1e8ac6['removeAttribute']('data-tooltip-source'),
      _0x1e8ac6['removeAttribute']('data-native-title'));
    _0x59a124 && _0x59a124 !== _0x5bf404
      ? (_0x1e8ac6['setAttribute']('data-provider-test-tooltip', _0x59a124),
        _0x1e8ac6['setAttribute']('aria-label', _0x59a124),
        _0x1e8ac6['setAttribute']('tabindex', '0'))
      : (_0x134865['hide'](_0x1e8ac6),
        _0x1e8ac6['removeAttribute']('data-provider-test-tooltip'),
        _0x1e8ac6['removeAttribute']('aria-label'),
        _0x1e8ac6['removeAttribute']('tabindex'));
    _0x1e8ac6['classList']['remove'](...PROVIDER_TEST_STATUS_CLASSES);
    if (_0x386908 === 'success') _0x1e8ac6['classList']['add']('settings-provider-status--success');
    else {
      if (_0x386908 === 'testing') _0x1e8ac6['classList']['add']('settings-provider-status--testing');
      else {
        if (_0x386908 === 'partial') _0x1e8ac6['classList']['add']('settings-provider-status--partial');
        else {
          if (_0x386908 === 'configured')
            _0x1e8ac6['classList']['add']('settings-provider-status--configured');
          else {
            if (_0x386908 === 'unconfigured')
              _0x1e8ac6['classList']['add']('settings-provider-status--unconfigured');
            else _0x1e8ac6['classList']['add']('settings-provider-status--danger');
          }
        }
      }
    }
  }
  function _0x59a2fe(_0x65bc61, _0x338838) {
    if (_0x338838 === 'comfyui') {
      getComfyUiEndpointStatusEntries(_0x65bc61)['forEach'](
        ({ target: _0x5d1492, tone: _0x65a4e5, textKey: _0x525837 }) => {
          _0x5110c3('comfyui', _0x65a4e5, trApiInput(_0x525837), '', _0x5d1492);
        },
      );
      return;
    }
    const _0xeaf2ac = _0x53788b(_0x65bc61, _0x338838),
      _0x2df2b2 = RUNNINGHUB_SETTINGS_PROVIDER_IDS['includes'](_0x338838) ? 0x2 : 0x1;
    if (_0xeaf2ac > 0x0) {
      if (isProviderConnectionVerified(_0x65bc61, _0x338838)) {
        _0x5110c3(_0x338838, 'success', trApiInput('diagnostics.passed'));
        return;
      }
      if (_0x65bc61?.['providers']?.[_0x338838]?.['connectionVerification']?.['status'] === 'partial') {
        _0x5110c3(_0x338838, 'partial', trApiInput('diagnostics.partialPassed'));
        return;
      }
      _0x5110c3(
        _0x338838,
        'configured',
        _0x2df2b2 > 0x1
          ? trApiInput('statuses.configuredCount', { count: _0xeaf2ac, total: _0x2df2b2 })
          : trApiInput('statuses.configured'),
      );
      return;
    }
    _0x5110c3(_0x338838, 'unconfigured', trApiInput('statuses.unconfigured'));
  }
  function _0xadece6(_0x4a3b6f) {
    API_PROVIDER_IDS['forEach']((_0x5b230e) => {
      _0x59a2fe(_0x4a3b6f, _0x5b230e);
    });
  }
  function _0x369069(_0x4c5b2d) {
    const _0x153a8e = _0x50ad60['getElementById']('modelServiceReadinessSummary'),
      _0xf944f6 = _0x50ad60['getElementById']('modelServiceReadinessDesc'),
      _0x30785c = _0x50ad60['getElementById']('modelServiceReadinessStatus');
    if (!_0x153a8e || !_0xf944f6 || !_0x30785c) return;
    const _0x49b2fd = _0x1d917d(_0x4c5b2d)['length'];
    ((_0x153a8e['dataset']['state'] = _0x49b2fd > 0x0 ? 'ready' : 'empty'),
      (_0xf944f6['textContent'] = trApiInput(_0x49b2fd > 0x0 ? 'readiness.ready' : 'readiness.empty', {
        count: _0x49b2fd,
      })),
      (_0x30785c['textContent'] = trApiInput(
        _0x49b2fd > 0x0 ? 'readiness.readyShort' : 'readiness.emptyShort',
        { count: _0x49b2fd },
      )));
  }
  function _0x401c30(_0x221d38) {
    const _0xc8d128 = _0x96c62f(_0x221d38);
    if (!_0xc8d128) return;
    (_0x134865['hide'](_0xc8d128),
      (_0xc8d128['hidden'] = !![]),
      (_0xc8d128['textContent'] = ''),
      _0xc8d128['removeAttribute']('aria-label'),
      _0xc8d128['removeAttribute']('data-provider-test-tooltip'));
  }
  function _0x181cf5(_0x3b2a61, _0x40e799 = null) {
    const _0x118163 = _0x96c62f(_0x3b2a61);
    if (!_0x118163) return;
    const _0x194509 = String(_0x40e799?.['displayText'] || '')['trim']();
    if (!_0x194509) {
      _0x401c30(_0x3b2a61);
      return;
    }
    const _0x500f4f = String(_0x40e799?.['detailText'] || _0x194509)['trim']();
    ((_0x118163['hidden'] = ![]),
      (_0x118163['textContent'] = _0x194509),
      _0x118163['setAttribute']('aria-label', _0x500f4f),
      _0x118163['setAttribute']('data-provider-test-tooltip', _0x500f4f));
  }
  function _0x3ef56c(_0x5a653d) {
    const _0x23acef = Number(_0x5a653d);
    if (!Number['isFinite'](_0x23acef) || _0x23acef <= 0x0) return null;
    return Math['max'](0x1, Math['floor'](_0x23acef));
  }
  function _0x12efdb(_0x385f8d, _0x45166a = null) {
    if (!_0x45166a || typeof _0x45166a !== 'object') return null;
    const _0x19ecb7 = String(_0x385f8d || '')
      ['trim']()
      ['toLowerCase']();
    if (RUNNINGHUB_SETTINGS_PROVIDER_IDS['includes'](_0x19ecb7)) {
      const _0x3d31a0 = _0x3ef56c(_0x45166a['workflowConcurrentLimit']),
        _0xb8e16b = _0x3ef56c(_0x45166a['modelConcurrentLimit']),
        _0x292ebb = {};
      return (
        _0x3d31a0 !== null && (_0x292ebb['workflowConcurrentLimit'] = _0x3d31a0),
        _0xb8e16b !== null && (_0x292ebb['modelConcurrentLimit'] = _0xb8e16b),
        _0x45166a['workflowApiKeyType'] &&
          (_0x292ebb['workflowApiKeyType'] = String(_0x45166a['workflowApiKeyType'] || '')['trim']()),
        _0x45166a['modelApiKeyType'] &&
          (_0x292ebb['modelApiKeyType'] = String(_0x45166a['modelApiKeyType'] || '')['trim']()),
        Object['keys'](_0x292ebb)['length'] ? _0x292ebb : null
      );
    }
    const _0x159aee = _0x3ef56c(_0x45166a['concurrentLimit']);
    return _0x159aee === null ? null : { concurrentLimit: _0x159aee };
  }
  function _0x5baee7(_0x55bf1a = {}) {
    return formatProviderDiagnosticDetail(_0x55bf1a, {
      skipped: trApiInput('diagnostics.skipped'),
      passed: trApiInput('diagnostics.passed'),
      failed: trApiInput('diagnostics.failed'),
      step: trApiInput('diagnostics.step'),
    });
  }
  function _0x179df1(_0x39face = {}) {
    if (_0x39face['partial']) return 'partial';
    if (_0x39face['ok']) return 'success';
    return 'danger';
  }
  function _0x1c4b51(_0x4833c2 = {}) {
    if (_0x4833c2['partial']) return trApiInput('diagnostics.partialPassed');
    if (_0x4833c2['ok']) return trApiInput('diagnostics.passed');
    return trApiInput('diagnostics.notPassed');
  }
  function _0x3a4348() {
    API_PROVIDER_IDS['forEach'](_0xf29880);
  }
  function _0x1ba785() {
    const _0x1e99d2 = (_0x44b4bd) => {
        const _0x54ada3 = _0x167079();
        (_0xf29880(_0x44b4bd),
          _0x59a2fe(_0x54ada3, _0x44b4bd),
          _0x369069(_0x54ada3),
          _0x3acf88?.['schedule']());
      },
      _0x405945 = (_0x37ae74, _0x4209d8) => {
        (_0x37ae74?.['addEventListener']('input', () => {
          (_0x4b4d05(_0x37ae74), _0x1e99d2(_0x4209d8));
        }),
          _0x37ae74?.['addEventListener']('change', () => {
            (_0x4b4d05(_0x37ae74), _0x3acf88?.['persist']()['catch'](() => {}));
          }));
      };
    (API_PROVIDER_IDS['forEach']((_0xa77f25) => {
      const _0x10196c = _0x50ad60['getElementById']('providerUrl-' + _0xa77f25),
        _0xdbc30f = _0x50ad60['getElementById']('providerKey-' + _0xa77f25);
      (_0x405945(_0x10196c, _0xa77f25), _0x405945(_0xdbc30f, _0xa77f25));
    }),
      _0x405945(_0x50ad60['getElementById']('providerUrl-comfyui-cloud'), 'comfyui'),
      _0x1b412d['forEach']((_0x5e7875, _0x385325) => {
        _0x5e7875['bind'](() => {
          (_0x4b4d05('providerRoute-' + _0x385325), _0x1e99d2(_0x385325));
        });
      }),
      RUNNINGHUB_SETTINGS_PROVIDER_IDS['forEach']((_0xe5da99) => {
        _0x405945(_0x50ad60['getElementById']('providerKey-' + _0xe5da99 + '-model'), _0xe5da99);
      }));
  }
  async function _0xc31df5(_0x2eb8c8, _0x51ea29 = {}) {
    if (typeof _0x4d862d !== 'function') {
      _0xd96ce0['showToast']?.(trApiInput('diagnostics.testUnsupported'), 'error');
      return;
    }
    const _0x86405d = await _0x3acf88?.['persist']();
    if (!_0x86405d) return;
    const _0x380514 = String(_0x51ea29?.['providerId'] || '')
        ['trim']()
        ['toLowerCase'](),
      _0x215882 =
        _0x380514 === 'comfyui' ? normalizeComfyUiConnectionTarget(_0x51ea29?.['comfyUiTarget']) : '',
      _0x3f7b3b = _0x380514 ? [_0x380514] : _0x412cb9(_0x86405d);
    _0x380514 ? _0xf29880(_0x380514, _0x215882) : _0x3a4348();
    const _0x2d2aa0 = _0x215882 ? isComfyUiEndpointConfigured(_0x86405d, _0x215882) : !![];
    if (_0x380514 && (!_0x53cee2(_0x86405d, _0x380514) || !_0x2d2aa0)) {
      (_0x59a2fe(_0x86405d, _0x380514),
        _0xd96ce0['showToast']?.(
          trApiInput(_0x380514 === 'comfyui' ? 'diagnostics.fillProviderUrl' : 'diagnostics.fillProviderKey'),
          'warn',
        ));
      return;
    }
    if (_0x3f7b3b['length'] === 0x0) {
      (_0xadece6(_0x86405d),
        _0x369069(_0x86405d),
        _0xd96ce0['showToast']?.(trApiInput('diagnostics.fillOneProviderKey'), 'warn'));
      return;
    }
    _0x3f7b3b['forEach']((_0x20ef71) =>
      _0x5110c3(
        _0x20ef71,
        'testing',
        trApiInput('diagnostics.testing'),
        '',
        _0x20ef71 === 'comfyui' ? _0x215882 : '',
      ),
    );
    const _0x7dc6f4 = _0x2eb8c8?.['querySelector']?.('.settings-btn-label'),
      _0x44503c = _0x7dc6f4?.['textContent'] || _0x2eb8c8?.['textContent'] || trApiInput('testConnection');
    if (_0x2eb8c8) {
      _0x2eb8c8['disabled'] = !![];
      if (_0x7dc6f4) _0x7dc6f4['textContent'] = trApiInput('diagnostics.testingBusy');
      else _0x2eb8c8['textContent'] = trApiInput('diagnostics.testingBusy');
    }
    const _0x20a3b8 = {},
      _0x55fd20 = [],
      _0x44daa6 = [];
    let _0x52d464 = [];
    const _0x43e1d8 = new Map();
    try {
      await Promise['all'](
        _0x3f7b3b['map'](async (_0x1fe536) => {
          try {
            const _0x27fcfe = await _0x4d862d(
              _0x86405d,
              [_0x1fe536],
              _0x1fe536 === 'comfyui' && _0x215882 ? { target: _0x215882 } : {},
            );
            _0x20a3b8[_0x1fe536] = _0x27fcfe?.[_0x1fe536];
          } catch (_0x354258) {
            _0x20a3b8[_0x1fe536] = {
              ok: ![],
              label: _0x1fe536,
              error: _0x354258?.['message'] || trApiInput('diagnostics.testFailed'),
            };
          }
          const _0x1315d5 = _0x20a3b8[_0x1fe536];
          _0x181cf5(_0x1fe536, _0x1315d5?.['balance']);
          const _0x1acb09 = _0x12efdb(_0x1fe536, _0x1315d5?.['balance']);
          if (_0x1acb09) _0x43e1d8['set'](_0x1fe536, _0x1acb09);
          (shouldPersistProviderConnectionResult(_0x1fe536, _0x1315d5) && _0x44daa6['push'](_0x1fe536),
            !_0x1315d5?.['ok'] &&
              _0x55fd20['push']({
                id: _0x1fe536,
                label: _0x1315d5?.['label'] || _0x1fe536,
                error:
                  _0x1315d5?.['suggestion'] ||
                  _0x1315d5?.['summary'] ||
                  _0x1315d5?.['error'] ||
                  trApiInput('diagnostics.testNotPassed'),
              }));
        }),
      );
      if (_0x44daa6['length'] > 0x0) {
        const _0x38834b = _0x167079(typeof _0x1eaf0d === 'function' ? _0x1eaf0d() : _0x4fcbd4),
          _0x48b1db = mergeCurrentProviderConnectionResults(_0x38834b, _0x86405d, _0x44daa6, _0x43e1d8, {
            connectionCapabilities: _0x215882 ? { comfyui: _0x215882 } : {},
            providerResults: _0x20a3b8,
          });
        ((_0x52d464 = _0x48b1db['staleProviderIds']),
          _0x52d464['forEach']((_0x22f097) => {
            (_0x401c30(_0x22f097), _0x59a2fe(_0x48b1db['config'], _0x22f097));
          }));
        try {
          _0x48b1db['appliedProviderIds']['length'] > 0x0 &&
            (await _0x147283(_0x48b1db['config']),
            _0x2b288c(_0x48b1db['config']),
            _0x369069(_0x48b1db['config']),
            _0x48dc00?.());
        } catch (_0x5bc901) {
          console['warn']('[API\x20Config]\x20provider\x20diagnostics\x20save\x20failed:', _0x5bc901);
          const _0x58c7a0 = _0x167079(typeof _0x1eaf0d === 'function' ? _0x1eaf0d() : _0x4fcbd4);
          (_0x3f7b3b['forEach']((_0x383e3d) => {
            (_0x401c30(_0x383e3d), _0x59a2fe(_0x58c7a0, _0x383e3d));
          }),
            _0x369069(_0x58c7a0),
            _0xd96ce0['showToast']?.(
              trApiInput('diagnostics.saveFailed', {
                error: _0x5bc901?.['message'] || trApiInput('diagnostics.unknownError'),
              }),
              'error',
            ));
          return;
        }
      }
      _0x3f7b3b['filter']((_0x86b782) => !_0x52d464['includes'](_0x86b782))['forEach']((_0x53962b) => {
        const _0xef6ce5 = _0x20a3b8[_0x53962b];
        _0x5110c3(
          _0x53962b,
          _0xef6ce5?.['ok'] ? 'success' : _0x179df1(_0xef6ce5),
          _0xef6ce5?.['ok'] ? trApiInput('diagnostics.passed') : _0x1c4b51(_0xef6ce5),
          _0x5baee7(_0xef6ce5) ||
            (_0xef6ce5?.['ok']
              ? trApiInput('diagnostics.testPassed')
              : _0xef6ce5?.['error'] || trApiInput('diagnostics.testNotPassed')),
          _0x53962b === 'comfyui' ? _0x215882 : '',
        );
      });
      const _0x547316 = _0x55fd20['filter'](({ id: _0x220d8f }) => !_0x52d464['includes'](_0x220d8f));
      if (_0x547316['length'] === 0x0 && _0x52d464['length'] === 0x0) {
        const _0x2112e9 = _0x20a3b8[_0x3f7b3b[0x0]],
          _0x41ce0e = _0x380514
            ? trApiInput('diagnostics.providerPassed', { label: _0x2112e9?.['label'] || _0x380514 })
            : trApiInput('diagnostics.allPassed');
        _0xd96ce0['showToast']?.(_0x41ce0e, 'success');
      } else {
        if (_0x547316['length'] > 0x0) {
          const _0x8d22cc = _0x547316[0x0];
          _0xd96ce0['showToast']?.(
            trApiInput('diagnostics.providerFailed', {
              label: _0x8d22cc['label'],
              error: _0x8d22cc['error'],
            }),
            'error',
            0x2328,
          );
        }
      }
    } catch (_0x3b9c07) {
      (_0x3f7b3b['forEach']((_0x173204) =>
        _0x5110c3(
          _0x173204,
          'danger',
          trApiInput('diagnostics.notPassed'),
          _0x3b9c07?.['message'] || trApiInput('diagnostics.testFailed'),
          _0x173204 === 'comfyui' ? _0x215882 : '',
        ),
      ),
        _0xd96ce0['showToast']?.(
          trApiInput('diagnostics.testFailedWithDetail', {
            error: _0x3b9c07?.['message'] || trApiInput('diagnostics.unknownError'),
          }),
          'error',
        ));
    } finally {
      if (_0x2eb8c8) {
        _0x2eb8c8['disabled'] = ![];
        if (_0x7dc6f4) _0x7dc6f4['textContent'] = _0x44503c;
        else _0x2eb8c8['textContent'] = _0x44503c;
      }
    }
  }
  function _0x4a60d8() {
    const _0x17b388 = _0x50ad60['getElementById']('btnApiSave'),
      _0x5e7ed7 = createApiConfigSavePresentation();
    (_0x3fbc29['syncDevVisibility'](),
      (_0x3acf88 = createApiConfigAutoSaveController({
        beforePersist: () => _0x3ad40e,
        collectConfig: _0x167079,
        saveConfig: _0x147283,
        onStateChange: _0x5e7ed7['update'],
        onSaved: (_0x4707f7, { showSuccess: showSuccess = ![] } = {}) => {
          (_0x2b288c(_0x4707f7), _0xadece6(_0x4707f7), _0x369069(_0x4707f7), _0x48dc00?.());
          if (showSuccess) _0xd96ce0['showToast']?.(trApiInput('diagnostics.saveSuccess'));
        },
        onError: (_0x42194f) =>
          _0xd96ce0['showToast']?.(
            trApiInput('diagnostics.saveFailed', {
              error: _0x42194f?.['message'] || trApiInput('diagnostics.unknownError'),
            }),
            'error',
          ),
      })),
      hardenApiCredentialInputs(_0x50ad60),
      _0x287e45?.['destroy']?.(),
      (_0x287e45 = createRunningHubDefaultSiteSettings({
        root: _0x50ad60,
        onSelectionChange: () => {
          (_0x4b4d05('runninghub-default-site'), _0x3acf88?.['persist']()['catch'](() => {}));
        },
      })),
      _0x287e45['bind'](),
      bindModelCatalogProviderCardVisibility({
        store: _0x4549e7,
        card: _0x50ad60['querySelector']('[data-subscription-provider-card=\x22binghuo\x22]'),
        providerId: 'binghuo',
      }),
      (_0x3ad40e = Promise['resolve']()
        ['then'](() => _0xa6e333())
        ['then']((_0x201a29) => {
          if (!_0x201a29 || _0x201a29['error']) return;
          (_0x2b288c(_0x201a29 || {}), _0x287e45?.['loadConfig'](_0x4fcbd4));
          const _0x84ebce = _0x201a29['providers'] || {};
          API_PROVIDER_IDS['forEach']((_0x3b07ee) => {
            const _0x168856 = _0x50ad60['getElementById']('providerUrl-' + _0x3b07ee),
              _0x5ba595 = _0x50ad60['getElementById']('providerKey-' + _0x3b07ee),
              _0xb59fa3 = _0x84ebce[_0x3b07ee] || {};
            if (_0x5ba888(_0x168856) && _0xb59fa3['apiUrl']) _0x168856['value'] = _0xb59fa3['apiUrl'];
            _0x3b07ee === 'comfyui' &&
              _0x5ba888(_0x168856) &&
              !_0xb59fa3['apiUrl'] &&
              (_0x168856['value'] = COMFYUI_LOCAL_DEFAULT_URL);
            if (_0x5ba888(_0x5ba595) && _0xb59fa3['apiKey']) _0x5ba595['value'] = _0xb59fa3['apiKey'];
          });
          const _0x59b134 = _0x50ad60['getElementById']('providerUrl-comfyui-cloud');
          _0x5ba888(_0x59b134) && (_0x59b134['value'] = _0x84ebce['comfyui']?.['cloudApiUrl'] || '');
          (_0x1b412d['forEach']((_0xa85ba9, _0x1c81db) => {
            !_0x5ef025['has']('providerRoute-' + _0x1c81db) &&
              _0xa85ba9['hydrate'](_0x84ebce[_0x1c81db] || {});
          }),
            RUNNINGHUB_SETTINGS_PROVIDER_IDS['forEach']((_0x158f5e) => {
              const _0x540bc8 = _0x50ad60['getElementById']('providerKey-' + _0x158f5e + '-model');
              _0x5ba888(_0x540bc8) &&
                _0x84ebce[_0x158f5e]?.['modelApiKey'] &&
                (_0x540bc8['value'] = _0x84ebce[_0x158f5e]['modelApiKey']);
            }));
          if (!_0x84ebce['grsai']?.['apiKey'] && _0x201a29['apiKey']) {
            const _0x72255a = _0x50ad60['getElementById']('providerKey-grsai');
            if (_0x5ba888(_0x72255a) && !_0x72255a['value']) _0x72255a['value'] = _0x201a29['apiKey'];
          }
          (_0x1bab9a['syncEditorCredentials'](_0x84ebce),
            _0x1bab9a['syncDefaults'](_0x84ebce),
            _0x5ef025['size'] && _0x2b288c(_0x167079(_0x201a29)),
            _0xadece6(_0x4fcbd4),
            _0x369069(_0x4fcbd4),
            _0x48dc00?.());
        })
        ['catch']((_0x310f22) => {
          (console['error']('[API Config] 加载失败:', _0x310f22),
            _0xadece6({}),
            _0x369069({}),
            _0x3ba721?.(
              trApiInput('diagnostics.loadFailed', {
                error: _0x310f22['message'] || trApiInput('diagnostics.unknownError'),
              }),
            ));
        })
        ['finally'](() => {
          _0x3fbc29['syncDevVisibility']() &&
            _0x3fbc29['refreshStatus']({ force: !![], silent: !![] })['catch'](() => {});
        })),
      _0x17b388 &&
        _0x17b388['addEventListener']('click', () => {
          _0x3acf88['persist']({ showSuccess: !![] })['then']((_0xf969d3) => {
            if (!_0xf969d3) return;
            _0x3fbc29['refreshStatus']({ force: !![], silent: !![] })['catch'](() => {});
          });
        }),
      _0xd96ce0['addEventListener']('settings-panel-closed', () => {
        _0x3acf88?.['flush']()['catch'](() => {});
      }),
      _0x50ad60['querySelectorAll']('[data-provider-test]')['forEach']((_0x37afc0) => {
        const _0x2592a4 = String(_0x37afc0['dataset']['providerTest'] || '')['trim']();
        if (!_0x2592a4) return;
        _0x37afc0['addEventListener']('click', () => {
          _0xc31df5(_0x37afc0, {
            providerId: _0x2592a4,
            comfyUiTarget: _0x37afc0['dataset']['comfyuiTestTarget'],
          })['catch'](() => {});
        });
      }),
      _0x1ba785(),
      bindProviderApiKeyGuideTriggers(_0x50ad60),
      bindVolcengineSpeechApiKeyGuideTriggers(_0x50ad60),
      bindRunningHubApiKeyGuideTriggers(_0x50ad60),
      _0x1bab9a['init'](),
      _0x3fbc29['init']());
  }
  return {
    destroy() {
      (_0x3fbc29['destroy'](), _0x287e45?.['destroy']?.());
    },
    init: _0x4a60d8,
    syncModelServiceReadinessSummary: _0x369069,
  };
}
