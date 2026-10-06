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
const FIELD_IDS = Object.freeze([
    'objectStorageEndpoint',
    'objectStorageRegion',
    'objectStorageBucket',
    'objectStorageAccessKeyId',
    'objectStorageSecretAccessKey',
    'objectStoragePublicBaseUrl',
  ]),
  PROVIDER_UI = Object.freeze({
    'cloudflare-r2': Object.freeze({
      i18nKey: 'cloudflareR2',
      badge: 'R2',
      consoleUrl: 'https://dash.cloudflare.com/?to=%2F%3Aaccount%2Fr2%2Foverview',
      tutorialId: 'a8d21eaa-ee3b-4f44-8820-c6efed668ca9',
      showEndpoint: true,
      showRegion: false,
      showAddressingStyle: false,
      endpointPlaceholder: 'https://<account-id>.r2.cloudflarestorage.com',
      regionPlaceholder: 'auto',
      bucketPlaceholder: 'aicanvas-assets',
      publicUrlPlaceholder: 'https://assets.example.com',
    }),
    'tencent-cos': Object.freeze({
      i18nKey: 'tencentCos',
      badge: 'COS',
      consoleUrl: 'https://console.cloud.tencent.com/cos',
      tutorialId: '13e4eb99-d4c3-4a0b-b724-ad137708a3b5',
      showEndpoint: false,
      showRegion: true,
      showAddressingStyle: false,
      endpointPlaceholder: '',
      regionPlaceholder: 'ap-guangzhou',
      bucketPlaceholder: 'examplebucket-1250000000',
      publicUrlPlaceholder: 'https://examplebucket-1250000000.cos.ap-guangzhou.myqcloud.com',
    }),
    'aliyun-oss': Object.freeze({
      i18nKey: 'aliyunOss',
      badge: 'OSS',
      consoleUrl: 'https://oss.console.aliyun.com/overview',
      tutorialUrl: '',
      showEndpoint: false,
      showRegion: true,
      showAddressingStyle: false,
      endpointPlaceholder: '',
      regionPlaceholder: 'cn-hangzhou',
      bucketPlaceholder: 'aicanvas-assets',
      publicUrlPlaceholder: 'https://aicanvas-assets.oss-cn-hangzhou.aliyuncs.com',
    }),
    's3-compatible': Object.freeze({
      i18nKey: 's3Compatible',
      badge: 'S3',
      consoleUrl: '',
      tutorialUrl: '',
      showEndpoint: true,
      showRegion: true,
      showAddressingStyle: true,
      endpointPlaceholder: 'https://storage.example.com',
      regionPlaceholder: 'us-east-1',
      bucketPlaceholder: 'aicanvas-assets',
      publicUrlPlaceholder: 'https://assets.example.com',
    }),
  });
function tr(value, item = {}) {
  let t2 = t('settings.objectStorage.' + value);
  return (
    Object.entries(item).forEach(([key, index]) => {
      t2 = t2.split('{' + key + '}').join(String(index ?? ''));
    }),
    t2
  );
}
function getElements(card = globalThis.document) {
  if (!card) return {};
  const result = {
    card: card.getElementById('objectStorageConfigCard'),
    enabledOn: card.getElementById('btnObjectStorageEnabledOn'),
    enabledOff: card.getElementById('btnObjectStorageEnabledOff'),
    test: card.getElementById('btnObjectStorageTest'),
    status: card.getElementById('objectStorageStatus'),
    providerButtons: Array.from(card.querySelectorAll?.('[data-object-storage-provider]') || []),
    providerBadge: card.getElementById('objectStorageProviderBadge'),
    providerTitle: card.getElementById('objectStorageProviderTitle'),
    providerConsole: card.getElementById('objectStorageProviderConsole'),
    providerTutorial: card.getElementById('objectStorageProviderTutorial'),
    providerDescription: card.getElementById('objectStorageProviderDescription'),
    endpointField: card.getElementById('objectStorageEndpointField'),
    regionField: card.getElementById('objectStorageRegionField'),
    addressingStyleField: card.getElementById('objectStorageAddressingStyleField'),
    addressingPath: card.getElementById('objectStorageAddressingPath'),
    addressingVirtualHosted: card.getElementById('objectStorageAddressingVirtualHosted'),
    accessKeyIdLabel: card.getElementById('objectStorageAccessKeyIdLabel'),
    secretAccessKeyLabel: card.getElementById('objectStorageSecretAccessKeyLabel'),
  };
  return (
    FIELD_IDS.forEach((data) => {
      result[data] = card.getElementById(data);
    }),
    result
  );
}
function setToggleButtonState(el, options) {
  if (!el) return;
  (el.classList?.toggle('active', options),
    el.setAttribute?.('aria-pressed', options ? 'true' : 'false'));
}
function isObjectStorageBusy(target) {
  return target.card?.dataset?.objectStorageToggleBusy === 'true';
}
export function setObjectStorageFormEnabled(source, next) {
  const enabled = next === true;
  (setToggleButtonState(source.enabledOn, enabled),
    setToggleButtonState(source.enabledOff, !enabled),
    FIELD_IDS.forEach((current) => {
      if (source[current]) source[current].disabled = isObjectStorageBusy(source);
    }),
    source.test && (source.test.disabled = isObjectStorageBusy(source)),
    source.card?.dataset &&
      (source.card.dataset.objectStorageEnabled = enabled ? 'true' : 'false'));
}
function setStatus(response, entry, record) {
  const el2 = response.status;
  if (!el2) return;
  ((el2.textContent = String(record || '')),
    el2.classList?.toggle('is-success', entry === 'success'),
    el2.classList?.toggle('is-error', entry === 'error'),
    el2.classList?.toggle('is-warning', entry === 'warning'));
}
function setObjectStorageToggleBusy(payload, handle) {
  const state = handle === true;
  if (payload.enabledOn) payload.enabledOn.disabled = state;
  if (payload.enabledOff) payload.enabledOff.disabled = state;
  (FIELD_IDS.forEach((config) => {
    if (payload[config]) payload[config].disabled = state;
  }),
    payload.providerButtons?.forEach((el3) => {
      el3.disabled = state;
    }));
  if (payload.addressingPath) payload.addressingPath.disabled = state;
  (payload.addressingVirtualHosted && (payload.addressingVirtualHosted.disabled = state),
    payload.test && (payload.test.disabled = state),
    payload.card?.dataset &&
      (payload.card.dataset.objectStorageToggleBusy = state ? 'true' : 'false'),
    state
      ? payload.card?.setAttribute?.('aria-busy', 'true')
      : payload.card?.removeAttribute?.('aria-busy'));
}
function getSelectedProviderId(scope, input = {}) {
  const el4 = scope.providerButtons?.find(
    (el5) => el5.classList?.contains('is-active') || el5.getAttribute?.('aria-pressed') === 'true',
  );
  if (el4?.dataset?.objectStorageProvider) return el4.dataset.objectStorageProvider;
  return normalizeObjectStorageSettings(input).providerId;
}
function setProviderButtonState(output, value2, value3) {
  output.providerButtons?.forEach((el6) => {
    const value4 = el6.dataset?.objectStorageProvider,
      value5 = value4 === value2,
      isObjectStorageProviderVerified2 = isObjectStorageProviderVerified(value3, value4),
      value6 = PROVIDER_UI[value4];
    (el6.classList?.toggle('is-active', value5),
      el6.classList?.toggle('is-verified', isObjectStorageProviderVerified2),
      el6.setAttribute?.('aria-pressed', value5 ? 'true' : 'false'));
    el6.dataset &&
      (el6.dataset.objectStorageVerified = isObjectStorageProviderVerified2 ? 'true' : 'false');
    if (value6) {
      const tr2 = tr('providers.' + value6.i18nKey + '.title');
      el6.setAttribute?.(
        'aria-label',
        isObjectStorageProviderVerified2 ? tr2 + '，' + tr('status.ready') : tr2,
      );
    }
  });
}
function setAddressingStyleState(value7, value8) {
  const enabled2 = value8 === 'virtual-hosted';
  (setToggleButtonState(value7.addressingPath, !enabled2),
    setToggleButtonState(value7.addressingVirtualHosted, enabled2));
}
function getAddressingStyle(value9) {
  return value9.addressingVirtualHosted?.classList?.contains('active') ? 'virtual-hosted' : 'path';
}
function setHidden(el7, value10) {
  if (el7) el7.hidden = value10 === true;
}
function setPlaceholder(enabled3, value11) {
  if (!enabled3) return;
  ((enabled3.placeholder = String(value11 || '')), enabled3.removeAttribute?.('data-i18n-placeholder'));
}
function renderProviderPresentation(value12, value13, value14) {
  const enabled4 = PROVIDER_UI[value13] || PROVIDER_UI['cloudflare-r2'],
    value15 = 'providers.' + enabled4.i18nKey;
  value12.providerBadge && (value12.providerBadge.textContent = enabled4.badge);
  value12.providerTitle &&
    ((value12.providerTitle.textContent = tr(value15 + '.title')),
    value12.providerTitle.setAttribute?.('data-i18n', 'settings.objectStorage.' + value15 + '.title'));
  value12.providerDescription &&
    ((value12.providerDescription.textContent = tr(value15 + '.desc')),
    value12.providerDescription.setAttribute?.(
      'data-i18n',
      'settings.objectStorage.' + value15 + '.desc',
    ));
  [
    ['accessKeyIdLabel', value12.accessKeyIdLabel],
    ['secretAccessKeyLabel', value12.secretAccessKeyLabel],
  ].forEach(([value16, el8]) => {
    if (!el8) return;
    ((el8.textContent = tr(value15 + '.' + value16)),
      el8.setAttribute?.('data-i18n', 'settings.objectStorage.' + value15 + '.' + value16));
  });
  value12.providerConsole &&
    (setHidden(value12.providerConsole, !enabled4.consoleUrl),
    (value12.providerConsole.dataset.externalUrl = enabled4.consoleUrl),
    value12.providerConsole.setAttribute?.('data-external-url', enabled4.consoleUrl),
    enabled4.consoleUrl
      ? ((value12.providerConsole.textContent = tr(value15 + '.console')),
        value12.providerConsole.setAttribute?.(
          'data-i18n',
          'settings.objectStorage.' + value15 + '.console',
        ))
      : ((value12.providerConsole.textContent = ''),
        value12.providerConsole.removeAttribute?.('data-i18n')));
  if (value12.providerTutorial) {
    (setHidden(value12.providerTutorial, !enabled4.tutorialId && !enabled4.tutorialUrl),
      delete value12.providerTutorial.dataset.externalUrl,
      delete value12.providerTutorial.dataset.apiTutorialTrigger,
      value12.providerTutorial.removeAttribute?.('data-external-url'),
      value12.providerTutorial.removeAttribute?.('data-api-tutorial-trigger'));
    if (enabled4.tutorialId)
      value12.providerTutorial.dataset.apiTutorialTrigger = enabled4.tutorialId;
    else
      enabled4.tutorialUrl &&
        (value12.providerTutorial.dataset.externalUrl = enabled4.tutorialUrl);
  }
  (setHidden(value12.endpointField, !enabled4.showEndpoint),
    setHidden(value12.regionField, !enabled4.showRegion),
    setHidden(value12.addressingStyleField, !enabled4.showAddressingStyle),
    setPlaceholder(value12.objectStorageEndpoint, enabled4.endpointPlaceholder),
    setPlaceholder(value12.objectStorageRegion, enabled4.regionPlaceholder),
    setPlaceholder(value12.objectStorageBucket, enabled4.bucketPlaceholder),
    setPlaceholder(value12.objectStoragePublicBaseUrl, enabled4.publicUrlPlaceholder),
    setAddressingStyleState(value12, value14.addressingStyle));
}
export function collectObjectStorageFormConfig(endpoint, objectStorageConfig = getObjectStorageConfig()) {
  const objectStorageSettings = normalizeObjectStorageSettings(objectStorageConfig),
    selectedProviderId = getSelectedProviderId(endpoint, objectStorageSettings),
    sessionToken = getObjectStorageProviderProfile(objectStorageSettings, selectedProviderId),
    args = updateObjectStorageProviderProfile(objectStorageSettings, selectedProviderId, {
      endpoint: endpoint.objectStorageEndpoint?.value,
      region: endpoint.objectStorageRegion?.value,
      bucket: endpoint.objectStorageBucket?.value,
      accessKeyId: endpoint.objectStorageAccessKeyId?.value,
      secretAccessKey: endpoint.objectStorageSecretAccessKey?.value,
      sessionToken: sessionToken.sessionToken,
      publicBaseUrl: endpoint.objectStoragePublicBaseUrl?.value,
      addressingStyle: getAddressingStyle(endpoint),
    });
  return serializeObjectStorageSettings({
    ...args,
    enabled: endpoint.enabledOn?.classList?.contains('active') === true,
  });
}
export function renderObjectStorageForm(value17, value18 = {}) {
  const objectStorageSettings2 = normalizeObjectStorageSettings(value18),
    objectStorageProviderProfile = getObjectStorageProviderProfile(
      objectStorageSettings2,
      objectStorageSettings2.providerId,
    );
  (setProviderButtonState(value17, objectStorageSettings2.providerId, objectStorageSettings2),
    renderProviderPresentation(value17, objectStorageSettings2.providerId, objectStorageProviderProfile),
    value17.objectStorageEndpoint &&
      (value17.objectStorageEndpoint.value = objectStorageProviderProfile.endpoint),
    value17.objectStorageRegion &&
      (value17.objectStorageRegion.value = objectStorageProviderProfile.region),
    value17.objectStorageBucket &&
      (value17.objectStorageBucket.value = objectStorageProviderProfile.bucket),
    value17.objectStorageAccessKeyId &&
      (value17.objectStorageAccessKeyId.value = objectStorageProviderProfile.accessKeyId),
    value17.objectStorageSecretAccessKey &&
      (value17.objectStorageSecretAccessKey.value = objectStorageProviderProfile.secretAccessKey),
    value17.objectStoragePublicBaseUrl &&
      (value17.objectStoragePublicBaseUrl.value = objectStorageProviderProfile.publicBaseUrl),
    setObjectStorageFormEnabled(value17, objectStorageSettings2.enabled),
    setStatus(
      value17,
      objectStorageSettings2.enabled ? 'warning' : '',
      objectStorageSettings2.enabled ? tr('status.enabled') : tr('status.disabled'),
    ));
}
function setTestButtonBusy(el9, value19, value20, value21) {
  if (!el9) return;
  (el9.classList?.toggle('is-testing', value19 === true),
    el9.setAttribute?.('aria-busy', value19 ? 'true' : 'false'),
    (el9.textContent = value19 ? value20 : value21));
}
export async function saveObjectStorageEnabledState(
  value22,
  value23,
  {
    getCurrentConfig: getCurrentConfig = getObjectStorageConfig,
    getCurrentSnapshot: getCurrentSnapshot = getApiConfigSnapshot,
    saveConfig: saveConfig = saveApiConfigToServer,
  } = {},
) {
  if (isObjectStorageBusy(value22)) return { ok: false, ignored: true };
  const currentConfig = getCurrentConfig();
  setObjectStorageFormEnabled(value22, value23);
  const args2 = collectObjectStorageFormConfig(value22, currentConfig);
  if (value23 && !isObjectStorageProviderVerified(args2, args2.providerId)) {
    const objectStorage = serializeObjectStorageSettings({ ...args2, enabled: false });
    renderObjectStorageForm(value22, objectStorage);
    const message = tr('status.testRequired');
    return (
      setStatus(value22, 'warning', message),
      { ok: false, blocked: true, message: message, objectStorage: objectStorage }
    );
  }
  (setObjectStorageToggleBusy(value22, true), setStatus(value22, 'warning', tr('actions.saving')));
  try {
    const objectStorage2 = value23
      ? serializeObjectStorageSettings({ ...args2, enabled: true })
      : serializeObjectStorageSettings({ ...args2, enabled: false });
    if (value23) validateObjectStorageConfig(objectStorage2);
    await saveConfig({ ...getCurrentSnapshot(), objectStorage: objectStorage2 });
    const message2 = value23 ? tr('status.savedEnabled') : tr('status.savedDisabled');
    return (
      setStatus(value22, value23 ? 'success' : '', message2),
      { ok: true, message: message2, objectStorage: objectStorage2 }
    );
  } catch (error) {
    renderObjectStorageForm(value22, currentConfig);
    const message3 = tr('status.saveFailed', { error: error?.message || tr('status.unknownError') });
    return (setStatus(value22, 'error', message3), { ok: false, error: error, message: message3 });
  } finally {
    setObjectStorageToggleBusy(value22, false);
  }
}
export async function saveObjectStorageFieldChanges(
  value24,
  {
    getCurrentConfig: getCurrentConfig = getObjectStorageConfig,
    getCurrentSnapshot: getCurrentSnapshot = getApiConfigSnapshot,
    saveConfig: saveConfig = saveApiConfigToServer,
  } = {},
) {
  if (isObjectStorageBusy(value24)) return { ok: false, ignored: true };
  const currentConfig2 = getCurrentConfig(),
    objectStorageSettings3 = normalizeObjectStorageSettings(currentConfig2).enabled;
  (setObjectStorageToggleBusy(value24, true), setStatus(value24, 'warning', tr('actions.saving')));
  try {
    const objectStorage3 = collectObjectStorageFormConfig(value24, currentConfig2),
      disabledAfterChange = objectStorageSettings3 && !objectStorage3.enabled;
    objectStorage3.enabled && validateObjectStorageConfig(objectStorage3);
    (await saveConfig({ ...getCurrentSnapshot(), objectStorage: objectStorage3 }),
      renderObjectStorageForm(value24, objectStorage3));
    const message4 = disabledAfterChange ? tr('status.changedRequiresRetest') : tr('status.saveSuccess');
    return (
      setStatus(value24, disabledAfterChange ? 'warning' : 'success', message4),
      { ok: true, disabledAfterChange: disabledAfterChange, message: message4, objectStorage: objectStorage3 }
    );
  } catch (error2) {
    renderObjectStorageForm(value24, currentConfig2);
    const message5 = tr('status.saveFailed', { error: error2?.message || tr('status.unknownError') });
    return (setStatus(value24, 'error', message5), { ok: false, error: error2, message: message5 });
  } finally {
    setObjectStorageToggleBusy(value24, false);
  }
}
export async function saveObjectStorageProviderSelection(
  value25,
  providerId,
  {
    getCurrentConfig: getCurrentConfig = getObjectStorageConfig,
    getCurrentSnapshot: getCurrentSnapshot = getApiConfigSnapshot,
    saveConfig: saveConfig = saveApiConfigToServer,
  } = {},
) {
  if (isObjectStorageBusy(value25) || !Object.prototype.hasOwnProperty.call(PROVIDER_UI, providerId))
    return { ok: false, ignored: true };
  const currentConfig3 = getCurrentConfig(),
    enabled5 = normalizeObjectStorageSettings(currentConfig3).enabled,
    objectStorage4 = collectObjectStorageFormConfig(value25, currentConfig3);
  if (objectStorage4.providerId === providerId)
    return { ok: true, ignored: true, objectStorage: objectStorage4 };
  let objectStorage5 = serializeObjectStorageSettings({
      ...objectStorage4,
      providerId: providerId,
      enabled: enabled5,
    }),
    disabledAfterSelection = enabled5 && !objectStorage5.enabled;
  if (objectStorage5.enabled)
    try {
      validateObjectStorageConfig(objectStorage5);
    } catch {
      ((objectStorage5 = serializeObjectStorageSettings({ ...objectStorage5, enabled: false })),
        (disabledAfterSelection = true));
    }
  (renderObjectStorageForm(value25, objectStorage5),
    setObjectStorageToggleBusy(value25, true),
    setStatus(value25, 'warning', tr('actions.saving')));
  try {
    (await saveConfig({ ...getCurrentSnapshot(), objectStorage: objectStorage5 }),
      renderObjectStorageForm(value25, objectStorage5));
    const value26 = PROVIDER_UI[providerId],
      provider = tr('providers.' + value26.i18nKey + '.title'),
      message6 = disabledAfterSelection
        ? tr('status.providerSelectedDisabled', { provider: provider })
        : tr('status.providerSelected', { provider: provider });
    return (
      setStatus(value25, disabledAfterSelection ? 'warning' : 'success', message6),
      {
        ok: true,
        disabledAfterSelection: disabledAfterSelection,
        message: message6,
        objectStorage: objectStorage5,
      }
    );
  } catch (error3) {
    renderObjectStorageForm(value25, currentConfig3);
    const message7 = tr('status.saveFailed', { error: error3?.message || tr('status.unknownError') });
    return (setStatus(value25, 'error', message7), { ok: false, error: error3, message: message7 });
  } finally {
    setObjectStorageToggleBusy(value25, false);
  }
}
export async function verifyObjectStorageConnection(
  value27,
  {
    getCurrentConfig: getCurrentConfig = getObjectStorageConfig,
    getCurrentSnapshot: getCurrentSnapshot = getApiConfigSnapshot,
    testConnection: testConnection = testObjectStorageConnection,
    saveConfig: saveConfig = saveApiConfigToServer,
    now: now = Date.now,
  } = {},
) {
  if (isObjectStorageBusy(value27)) return { ok: false, ignored: true };
  const tr3 = tr('actions.test'),
    currentConfig4 = getCurrentConfig();
  let objectStorage6;
  try {
    ((objectStorage6 = collectObjectStorageFormConfig(value27, currentConfig4)),
      validateObjectStorageConfig(objectStorage6, { requireEnabled: false }),
      setObjectStorageToggleBusy(value27, true),
      setTestButtonBusy(value27.test, true, tr('actions.testing'), tr3),
      setStatus(value27, 'warning', tr('status.testing')));
    const result2 = await testConnection(objectStorage6),
      objectStorage7 = serializeObjectStorageSettings(
        markObjectStorageProviderVerified(objectStorage6, objectStorage6.providerId, {
          verifiedAt: now(),
        }),
      );
    (await saveConfig({ ...getCurrentSnapshot(), objectStorage: objectStorage7 }),
      renderObjectStorageForm(value27, objectStorage7));
    const value28 = result2?.cleanupOk === false ? ' ' + tr('status.testCleanupWarning') : '',
      message8 = '' + tr('status.testSuccess') + value28;
    return (
      setStatus(value27, 'success', message8),
      { ok: true, message: message8, objectStorage: objectStorage7, result: result2 }
    );
  } catch (error4) {
    const message9 = tr('status.testFailed', { error: error4?.message || tr('status.unknownError') });
    return (
      setStatus(value27, 'error', message9),
      { ok: false, error: error4, message: message9, objectStorage: objectStorage6 }
    );
  } finally {
    (setTestButtonBusy(value27.test, false, tr('actions.testing'), tr3),
      setObjectStorageToggleBusy(value27, false));
  }
}
function showToast(value29, value30 = '') {
  globalThis.window?.showToast?.(value29, value30);
}
export function initObjectStorageSettings({
  documentObject: documentObject = globalThis.document,
  windowObject: windowObject = globalThis.window,
} = {}) {
  const elements = getElements(documentObject);
  if (!elements.card || elements.card.dataset?.objectStorageBound === 'true') return false;
  ((elements.card.dataset.objectStorageBound = 'true'),
    renderObjectStorageForm(elements, getObjectStorageConfig()));
  const run = async (value31) => {
    const error5 = await saveObjectStorageEnabledState(elements, value31);
    if (error5.ignored) return;
    showToast(
      error5.ok ? tr('status.saveSuccess') : error5.message,
      error5.ok ? '' : error5.blocked ? 'warning' : 'error',
    );
  };
  (elements.enabledOn?.addEventListener('click', () => {
    void run(true);
  }),
    elements.enabledOff?.addEventListener('click', () => {
      void run(false);
    }),
    elements.providerButtons?.forEach((el10) => {
      el10.addEventListener?.('click', async () => {
        const error6 = await saveObjectStorageProviderSelection(
          elements,
          el10.dataset?.objectStorageProvider,
        );
        !error6.ok && !error6.ignored && showToast(error6.message, 'error');
      });
    }),
    FIELD_IDS.forEach((value32) => {
      elements[value32]?.addEventListener('change', async () => {
        const error7 = await saveObjectStorageFieldChanges(elements);
        !error7.ok && !error7.ignored && showToast(error7.message, 'error');
      });
    }));
  const run2 = (value33) => {
    (setAddressingStyleState(elements, value33),
      void saveObjectStorageFieldChanges(elements).then((error8) => {
        !error8.ok && !error8.ignored && showToast(error8.message, 'error');
      }));
  };
  return (
    elements.addressingPath?.addEventListener('click', () => {
      run2('path');
    }),
    elements.addressingVirtualHosted?.addEventListener('click', () => {
      run2('virtual-hosted');
    }),
    elements.test?.addEventListener('click', async () => {
      const error9 = await verifyObjectStorageConnection(elements);
      if (error9.ignored) return;
      showToast(error9.message, error9.ok ? '' : 'error');
    }),
    windowObject?.addEventListener?.(API_CONFIG_CHANGED_EVENT, () => {
      renderObjectStorageForm(elements, getObjectStorageConfig());
    }),
    true
  );
}
export const __objectStorageSettingsForTest = Object.freeze({
  FIELD_IDS: FIELD_IDS,
  PROVIDER_UI: PROVIDER_UI,
  getElements: getElements,
});
