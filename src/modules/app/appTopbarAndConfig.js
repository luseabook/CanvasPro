import { registerSidebarSubmenu } from '../sidebarSubmenuController.js';
import { openExternalLink } from '../../services/externalLinkService.js';
import { t } from '../../i18n/index.js';
import {
  DEFAULT_APIMART_ROUTE_ID,
  getApimartApiUrlForRoute,
  getApimartRouteById,
  resolveApimartRouteByApiUrl,
} from '../providers.js';
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
const DREAMINA_LOGIN_PAGE_URL = 'https://jimeng.jianying.com/',
  DREAMINA_I18N_PREFIX = 'settings.apiInput.providers.dreamina';
function trTemplate(value, item = {}) {
  let t2 = t(value);
  return (
    Object.entries(item || {}).forEach(([key, index]) => {
      t2 = t2.split('{' + key + '}').join(String(index ?? ''));
    }),
    t2
  );
}
function trApiInput(result, data = {}) {
  return trTemplate('settings.apiInput.' + result, data);
}
function trDreamina(options, target = {}) {
  return trTemplate(DREAMINA_I18N_PREFIX + '.' + options, target);
}
function normalizeDreaminaManualUrlCandidate(source) {
  const enabled = String(source || '').trim();
  if (!enabled) return '';
  const next = enabled
    .replace(/^[<（(【\["'“‘]+/, '')
    .replace(/[>）)】\]"'”’]+$/, '')
    .replace(/[，。；;、]+$/, '');
  return /^https?:\/\//.test(next) ? next : '';
}
export function extractDreaminaManualLinksFromOutputLines(current) {
  const list = Array.isArray(current) ? current : [],
    list2 = [];
  let enabled2 = '';
  list.forEach((item2) => {
    const list3 = String(item2 || '');
    if (!enabled2 && list3.includes('请在浏览器中打开以下链接')) enabled2 = '__PENDING__';
    else enabled2 === '__PENDING__' && (enabled2 = list3.trim());
    const list4 = list3.match(/https?:\/\/[^\s]+/g);
    if (!list4) return;
    list4.forEach((item3) => {
      const dreaminaManualUrlCandidate = normalizeDreaminaManualUrlCandidate(item3);
      if (dreaminaManualUrlCandidate && !list2.includes(dreaminaManualUrlCandidate))
        list2.push(dreaminaManualUrlCandidate);
    });
  });
  const entry = enabled2 && enabled2 !== '__PENDING__' ? normalizeDreaminaManualUrlCandidate(enabled2) : '',
    strictAuthorizeUrl =
      entry ||
      list2.find((list5) => list5.includes('/passport/web_login')) ||
      list2.find((list6) => list6.includes('/passport/web/web_login')) ||
      '',
    authorizeUrl = list2.find((list7) => list7.includes('/dreamina/cli/v1/dreamina_cli_login')) || '',
    record = authorizeUrl || list2.find((item4) => item4 !== DREAMINA_LOGIN_PAGE_URL) || '';
  return {
    authorizeUrl: authorizeUrl || strictAuthorizeUrl || record || '',
    strictAuthorizeUrl: strictAuthorizeUrl,
    callbackUrl: authorizeUrl,
  };
}
export function getDreaminaWebLoginButtonText(enabled3) {
  const enabled4 = enabled3?.runtime || {},
    payload = !!enabled3?.loggedIn,
    handle = !!enabled4?.active;
  if (handle) return trDreamina('viewLogin');
  return payload ? trDreamina('relogin') : trDreamina('login');
}
export function getDreaminaQrLoginButtonText(state) {
  const enabled5 = state?.runtime || {},
    config = !!enabled5?.active;
  if (config) return trDreamina('viewLogin');
  return trDreamina('login');
}
export function getDreaminaStatusSessionKey(scope) {
  const input = scope?.runtime || {},
    count = Number(input?.startedAt || 0);
  if (count > 0) return 'login:' + count;
  const count2 = Number(input?.qrVersion || 0);
  if (count2 > 0) return 'qr:' + count2;
  return '';
}
export function shouldDreaminaManualGuideOpenByDefault(output, value2 = '') {
  const enabled6 = output?.runtime || {},
    value3 = String(enabled6?.loginMode || '');
  if (!enabled6?.active || !['oauth', 'web', 'headless'].includes(value3)) return false;
  const dreaminaStatusSessionKey = getDreaminaStatusSessionKey(output);
  return !dreaminaStatusSessionKey || String(value2 || '') !== dreaminaStatusSessionKey;
}
export function shouldAutoOpenDreaminaWebAuthLink(enabled7, value4 = {}, value5 = Date.now()) {
  const enabled8 = enabled7?.runtime || {},
    value6 = String(enabled8?.loginMode || ''),
    enabled9 = String(enabled8?.authorizeUrl || '').trim(),
    value7 = String(enabled8?.loginPageUrl || '').trim(),
    value8 = String(enabled8?.phase || ''),
    value9 = !!enabled7?.loggedIn || ['success', 'reused', 'done'].includes(value8),
    count3 = Number(value4?.webLoginPrimedAt || 0),
    value10 = String(value4?.autoOpenedManualAuthUrl || '').trim();
  if (!['oauth', 'web', 'headless'].includes(value6) || !enabled8?.active || value9) return false;
  if (!enabled9 || enabled9 === value7) return false;
  if (value10 === enabled9) return false;
  if (count3 <= 0) return false;
  return Math.max(0, Number(value5 || 0) - count3) >= 0x9c4;
}
export function createAppTopbarAndConfig({
  store: store,
  fetchApiConfigFromServer: fetchApiConfigFromServer,
  saveApiConfigToServer: saveApiConfigToServer,
  testProviderConnections: testProviderConnections,
  fetchDreaminaCliStatusFromServer: fetchDreaminaCliStatusFromServer,
  startDreaminaHeadlessLoginFromServer: startDreaminaHeadlessLoginFromServer,
  startDreaminaHeadlessReloginFromServer: startDreaminaHeadlessReloginFromServer,
  startDreaminaWebLoginFromServer: startDreaminaWebLoginFromServer,
  importDreaminaLoginResponseFromServer: importDreaminaLoginResponseFromServer,
  logoutDreaminaFromServer: logoutDreaminaFromServer,
  buildDreaminaQrImageUrl: buildDreaminaQrImageUrl,
  refreshManifestModelNodeUis: refreshManifestModelNodeUis,
  showError: showError,
} = {}) {
  const value11 = 85 * 0x3e8,
    enabled10 = {
      pollTimer: null,
      lastToastKey: '',
      lastStatus: null,
      modalCloseTimer: null,
      currentSessionKey: '',
      dismissedSessionKey: '',
      qrImageLoadError: false,
      lastQrImageUrl: '',
      lastQrImageRequestedAt: 0,
      lastQrImageLoadedAt: 0,
      lastQrImageErrorAt: 0,
      lastQrImageErrorMessage: '',
      qrImageListenersBound: false,
      manualGuideOpen: false,
      webLoginPrimedAt: 0,
      autoOpenedManualAuthUrl: '',
    };
  let value12 = {};
  // 'agnes-domestic' 是独立厂商（域名与密钥都与国际版不同），必须在这里登记，
  // 否则它的密钥输入框既不会回填也不会被保存。
  const list8 = ['grsai', 'openai', 'ppio', 'apimart', 'agnes-domestic', 'agnes', 'volcengine', 'runninghub'],
    args = [
      'settings-provider-status--testing',
      'settings-provider-status--success',
      'settings-provider-status--partial',
      'settings-provider-status--danger',
    ];
  let el = null,
    value13 = null;
  // ── 厂商模型清单：从接口拉取、勾选、动态登记 ─────────────────────────────
  // 内置清单只覆盖已适配的模型；厂商新增模型时，在这里拉一次真实列表即可选用。
  const providerModelCatalogBundleRegistry = createProviderModelCatalogBundleRegistry();
  function run(value14 = value12) {
    try {
      return providerModelCatalogBundleRegistry.sync(collectEnabledVendorModels(value14));
    } catch (value15) {
      console.warn('[Provider Model Catalog] sync failed:', value15);
      return { changed: false, registered: 0 };
    }
  }
  function run2(providerId, message = {}) {
    const catalog = readProviderModelCatalog(value12?.providers?.[providerId] || {}),
      statusText = message.statusText ?? '';
    return renderProviderModelCatalogPanel({
      documentObject: document,
      providerId: providerId,
      catalog: catalog,
      statusText:
        statusText ||
        (catalog.models.length ? trApiInput('models.count', { count: catalog.models.length }) : ''),
      message: message.message || '',
      messageKind: message.messageKind || 'info',
    });
  }
  function run3(value16) {
    const models = readProviderModelCatalogSelection(document, value16);
    if (models.length === 0) return false;
    const value17 = String(value16 || '').trim();
    value12.providers = value12.providers || {};
    value12.providers[value17] = applyProviderModelCatalog(value12.providers[value17], {
      fetchedAt: new Date().toISOString(),
      models: models.map((id) => ({
        id: id.id,
        kind: id.kind || inferProviderModelKind(value17, id.id),
        enabled: id.enabled,
      })),
    });
    return true;
  }
  async function run4(value16, el2 = null) {
    const providerId2 = String(value16 || '').trim();
    if (!isProviderModelCatalogProvider(providerId2)) return false;
    const el3 = document.getElementById('providerKey-' + providerId2),
      apiKey = String(el3?.value || '')
        .trim()
        .replace(/^Bearer\s+/i, '');
    if (!apiKey) {
      (window.showToast?.(trApiInput('models.needKey'), 'warn'), el3?.focus?.());
      return false;
    }
    if (el2) el2.disabled = true;
    run2(providerId2, {
      statusText: trApiInput('models.fetching'),
      message: trApiInput('models.fetching'),
    });
    try {
      const apiUrl = value12?.providers?.[providerId2] || {},
        response = await fetchProviderModelList({
          providerId: providerId2,
          apiUrl: apiUrl.apiUrl,
          apiKey: apiKey,
        });
      if (!response.success) {
        run2(providerId2, {
          statusText: '',
          message: trApiInput('models.failed') + '：' + response.error,
          messageKind: 'error',
        });
        return false;
      }
      if (response.models.length === 0) {
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
        readProviderModelCatalog(apiUrl).models,
        response.models,
      );
      renderProviderModelCatalogPanel({
        documentObject: document,
        providerId: providerId2,
        catalog: { fetchedAt: new Date().toISOString(), models: models2 },
        statusText: trApiInput('models.count', { count: models2.length }),
      });
      return true;
    } finally {
      if (el2) el2.disabled = false;
    }
  }
  async function run5(value16) {
    const providerId2 = String(value16 || '').trim();
    if (!isProviderModelCatalogProvider(providerId2)) return false;
    if (!run3(providerId2)) return false;
    const value18 = run6(),
      error = await saveApiConfigToServer(value18);
    if (!error?.success && error?.error) {
      window.showToast?.(trApiInput('diagnostics.saveFailed', { error: error.error }), 'error');
      return false;
    }
    value12 = value18;
    const value19 = run(value12);
    refreshManifestModelNodeUis?.();
    const catalog = readProviderModelCatalog(value12?.providers?.[providerId2] || {}),
      // 只有“该模态还没适配”才算需要手动接入；已内置的模型被跳过是正常的。
      value20 = (value19?.skipped || []).filter((item5) =>
        String(item5?.reason || '').startsWith('no-template'),
      ).length;
    run2(providerId2, {
      statusText: trApiInput('models.count', { count: catalog.models.length }),
      message:
        trApiInput('models.saved') +
        (value19?.registered ? '（新增 ' + value19.registered + ' 个）' : '') +
        (value20 ? '（' + value20 + ' 个该模态暂未适配）' : ''),
      messageKind: 'success',
    });
    run7({ force: true, silent: true }).catch(() => {});
    return true;
  }
  function run8() {
    return Array.from(document.querySelectorAll('[data-apimart-route]'));
  }
  function run9(value21, value22 = false) {
    const el4 = document.getElementById('providerRouteUrl-apimart');
    if (!el4) return;
    const value23 = String(value21 || getApimartApiUrlForRoute(DEFAULT_APIMART_ROUTE_ID)).trim();
    el4.textContent = value22 ? trApiInput('route.custom', { value: value23 }) : value23;
  }
  function run10() {
    const el5 = run8().find((el6) => el6.classList.contains('is-active')),
      value24 = String(el5?.dataset?.apimartRoute || '').trim();
    return value24 ? getApimartRouteById(value24) : null;
  }
  function run11(value25, value26 = {}) {
    const value27 = String(value25 || '').trim(),
      enabled11 = value27 ? getApimartRouteById(value27) : null,
      enabled12 = String(value26?.customUrl || '').trim();
    (run8().forEach((el7) => {
      const value28 = !!enabled11 && String(el7.dataset.apimartRoute || '') === enabled11.id;
      (el7.classList.toggle('is-active', value28),
        el7.setAttribute('aria-pressed', value28 ? 'true' : 'false'));
    }),
      run9(enabled11?.apiUrl || enabled12, !!enabled12 && !enabled11));
  }
  function run12(options2 = {}) {
    const customUrl = String(options2?.apiUrl || '').trim(),
      apimartRouteByApiUrl = resolveApimartRouteByApiUrl(customUrl);
    if (apimartRouteByApiUrl) {
      run11(apimartRouteByApiUrl.id);
      return;
    }
    const value29 = options2?.routeId ? getApimartRouteById(options2.routeId) : null;
    if (value29 && !customUrl) {
      run11(value29.id);
      return;
    }
    if (customUrl) {
      run11('', { customUrl: customUrl });
      return;
    }
    run11(DEFAULT_APIMART_ROUTE_ID);
  }
  function run13(args2 = {}) {
    const value30 = args2 && typeof args2 === 'object' ? { ...args2 } : {},
      value31 = run10();
    if (value31) ((value30.routeId = value31.id), (value30.apiUrl = value31.apiUrl));
    else value30.apiUrl && delete value30.routeId;
    return value30;
  }
  function run14() {
    const el8 = document.getElementById('projectNameText');
    el8 &&
      (el8.addEventListener('keydown', (event) => {
        event.key === 'Enter' && (event.preventDefault(), el8.blur());
      }),
      el8.addEventListener('click', () => {
        el8.focus();
      }));
    const button = document.getElementById('userAvatar'),
      panel = document.getElementById('avatarMenu');
    button &&
      panel &&
      registerSidebarSubmenu({
        key: 'settings',
        button: button,
        panel: panel,
        openClass: 'open',
        isOpen: () => panel.classList.contains('open'),
      });
  }
  function run15() {
    return {
      settingsCardEl: document.getElementById('dreaminaSettingsCard'),
      statusTextEl: document.getElementById('dreaminaStatusText'),
      messageTextEl: document.getElementById('dreaminaStatusMessage'),
      creditTextEl: document.getElementById('dreaminaCreditText'),
      btnAuthEl: document.getElementById('btnDreaminaAuth'),
      btnQrAuthEl: document.getElementById('btnDreaminaQrAuth'),
      btnLogoutEl: document.getElementById('btnDreaminaLogout'),
      modalOverlayEl: document.getElementById('dreaminaLoginModal'),
      modalCardEl: document.getElementById('dreaminaLoginModalCard'),
      modalCloseEl: document.getElementById('dreaminaModalClose'),
      modalMessageEl: document.getElementById('dreaminaModalMessage'),
      modalQrWrapEl: document.getElementById('dreaminaModalQrWrap'),
      modalQrImageEl: document.getElementById('dreaminaModalQrImage'),
      modalWaitEl: document.getElementById('dreaminaModalWait'),
      modalWaitTextEl: document.getElementById('dreaminaModalWaitText'),
      modalRetryEl: document.getElementById('dreaminaModalRetry'),
      manualGuideEl: document.getElementById('dreaminaManualGuide'),
      manualLoginUrlEl: document.getElementById('dreaminaManualLoginUrl'),
      manualAuthUrlEl: document.getElementById('dreaminaManualAuthUrl'),
      manualImportJsonEl: document.getElementById('dreaminaManualImportJson'),
      manualOpenLoginEl: document.getElementById('dreaminaManualOpenLogin'),
      manualCopyLoginEl: document.getElementById('dreaminaManualCopyLogin'),
      manualOpenAuthEl: document.getElementById('dreaminaManualOpenAuth'),
      manualCopyAuthEl: document.getElementById('dreaminaManualCopyAuth'),
      manualImportJsonBtnEl: document.getElementById('dreaminaManualImportJsonBtn'),
    };
  }
  function run16() {
    const { settingsCardEl: settingsCardEl } = run15();
    if (!settingsCardEl) return false;
    const enabled13 = true;
    return (
      (settingsCardEl.hidden = !enabled13),
      !enabled13 && (run17({ force: true, rememberDismissal: false }), run18()),
      enabled13
    );
  }
  function run18() {
    enabled10.pollTimer && (clearInterval(enabled10.pollTimer), (enabled10.pollTimer = null));
  }
  function run19() {
    if (enabled10.pollTimer) return;
    enabled10.pollTimer = setInterval(() => {
      run7({ silent: true }).catch(() => {});
    }, 0x320);
  }
  function run20() {
    ((enabled10.qrImageLoadError = false),
      (enabled10.lastQrImageUrl = ''),
      (enabled10.lastQrImageRequestedAt = 0),
      (enabled10.lastQrImageLoadedAt = 0),
      (enabled10.lastQrImageErrorAt = 0),
      (enabled10.lastQrImageErrorMessage = ''));
  }
  function run21(value32, value33 = Date.now()) {
    const list9 = String(value32 || '').trim();
    if (!list9) return '';
    const value34 = list9.includes('?') ? '&' : '?';
    return '' + list9 + value34 + 'cb=' + encodeURIComponent(String(value33));
  }
  function run22(value35, { withCacheBust: withCacheBust = false } = {}) {
    const value36 = Number(value35?.qrVersion || 0),
      enabled14 = buildDreaminaQrImageUrl?.(value36 || Date.now()) || '';
    if (!enabled14) return '';
    return withCacheBust ? run21(enabled14) : enabled14;
  }
  function run23(value37) {
    const enabled15 = value37?.runtime || {},
      value38 = String(enabled15?.phase || ''),
      value39 = !!enabled15?.qrAvailable;
    return value38 === 'qr_ready' && value39 && !!enabled10.qrImageLoadError;
  }
  function run24(value40) {
    const value41 = value40?.runtime || {};
    return Array.isArray(value41?.outputTail) ? value41.outputTail : [];
  }
  function run25(value42) {
    const list10 = run24(value42);
    return list10.some((item6) => {
      const list11 = String(item6 || '').toLowerCase();
      return (
        list11.includes('自动打开浏览器失败') ||
        list11.includes('open headless login page') ||
        list11.includes('executable file not found') ||
        list11.includes('google-chrome')
      );
    });
  }
  function run26(value43) {
    const value44 = value43?.runtime || {},
      args3 = extractDreaminaManualLinksFromOutputLines(run24(value43));
    return {
      ...args3,
      authorizeUrl: String(value44?.authorizeUrl || '').trim() || args3.authorizeUrl,
      callbackUrl: String(value44?.callbackUrl || '').trim() || args3.callbackUrl,
    };
  }
  function run27(value45) {
    const {
      manualLoginUrlEl: manualLoginUrlEl,
      manualOpenLoginEl: manualOpenLoginEl,
      manualCopyLoginEl: manualCopyLoginEl,
      manualAuthUrlEl: manualAuthUrlEl,
      manualOpenAuthEl: manualOpenAuthEl,
      manualCopyAuthEl: manualCopyAuthEl,
    } = run15();
    if (
      !manualLoginUrlEl ||
      !manualOpenLoginEl ||
      !manualCopyLoginEl ||
      !manualAuthUrlEl ||
      !manualOpenAuthEl ||
      !manualCopyAuthEl
    )
      return;
    const value46 = run26(value45 || enabled10.lastStatus || {}),
      value47 = (value45 || enabled10.lastStatus || {})?.runtime || {},
      enabled16 = String(value47?.userCode || '').trim();
    ((manualLoginUrlEl.value = enabled16 || trDreamina('waitingCode')),
      (manualOpenLoginEl.hidden = true),
      (manualOpenLoginEl.disabled = true),
      (manualCopyLoginEl.disabled = !enabled16));
    const enabled17 = String(value46?.authorizeUrl || '').trim();
    ((manualAuthUrlEl.value = enabled17 || trDreamina('waitingAuthUrl')),
      (manualOpenAuthEl.disabled = !enabled17),
      (manualCopyAuthEl.disabled = !enabled17));
  }
  function run28(value48) {
    const { manualGuideEl: manualGuideEl } = run15();
    if (!manualGuideEl) return;
    (run27(value48 || enabled10.lastStatus || {}), (manualGuideEl.hidden = !enabled10.manualGuideOpen));
  }
  function run29() {
    return String(enabled10.lastStatus?.runtime?.userCode || '').trim();
  }
  function run30(value49 = enabled10.lastStatus || {}) {
    const value50 = run26(value49);
    return String(value50?.authorizeUrl || '').trim();
  }
  async function run31(value51, label) {
    const enabled18 = String(value51 || '').trim();
    if (!enabled18)
      return (window.showToast?.(trDreamina('missingValue', { label: label }), 'warning'), false);
    try {
      return (await openExternalLink(enabled18, { label: label }), true);
    } catch (value52) {}
    const value53 = await run32(enabled18);
    return (
      value53
        ? window.showToast?.(trDreamina('browserOpenFailedCopied', { label: label }), 'warning')
        : window.showToast?.(trDreamina('browserOpenFailedCopyFirst', { label: label }), 'warning'),
      false
    );
  }
  async function run33(value54, label2) {
    const enabled19 = String(value54 || '').trim();
    if (!enabled19) {
      window.showToast?.(trDreamina('missingValue', { label: label2 }), 'warning');
      return;
    }
    const value55 = await run32(enabled19);
    value55
      ? window.showToast?.(trDreamina('copySuccess', { label: label2 }), 'success')
      : window.showToast?.(trDreamina('copyFailed', { label: label2 }), 'error');
  }
  async function run34() {
    await run35();
  }
  async function run36() {
    await run33(run29(), trDreamina('codeLabel'));
  }
  async function run35() {
    await run31(run30(), trDreamina('authLinkLabel'));
  }
  async function run37() {
    await run33(run30(), trDreamina('authLinkLabel'));
  }
  function run38(value56) {
    const list12 = String(value56 || '').trim();
    if (!list12) throw new Error(trDreamina('jsonPasteRequired'));
    const list13 = [];
    list13.push(list12);
    const value57 = list12.match(/```(?:json)?\s*([\s\S]*?)```/i);
    value57?.[1] && list13.push(String(value57[1]).trim());
    const count4 = list12.indexOf('{'),
      value58 = list12.lastIndexOf('}');
    count4 >= 0 && value58 > count4 && list13.push(list12.slice(count4, value58 + 1).trim());
    for (const enabled20 of list13) {
      if (!enabled20) continue;
      try {
        const enabled21 = JSON.parse(enabled20);
        if (!enabled21 || typeof enabled21 !== 'object' || Array.isArray(enabled21))
          throw new Error('INVALID_OBJECT');
        return enabled21;
      } catch (error2) {
        if (error2?.message === 'INVALID_OBJECT') throw new Error(trDreamina('jsonMustBeObject'));
      }
    }
    throw new Error(trDreamina('jsonFormatInvalid'));
  }
  async function run39() {
    if (typeof importDreaminaLoginResponseFromServer !== 'function') {
      window.showToast?.(trDreamina('jsonImportUnsupported'), 'error');
      return;
    }
    const { manualImportJsonEl: manualImportJsonEl } = run15(),
      value59 = String(manualImportJsonEl?.value || '');
    let value60 = null;
    try {
      value60 = run38(value59);
    } catch (error3) {
      window.showToast?.(error3?.message || trDreamina('jsonParseFailed'), 'warning');
      return;
    }
    try {
      const response2 = await importDreaminaLoginResponseFromServer(value60);
      if (response2?.success === false) throw new Error(response2?.message || trDreamina('importFailed'));
      (response2?.status ? run40(response2.status) : await run7({ force: true, silent: true }),
        manualImportJsonEl && (manualImportJsonEl.value = ''),
        run19(),
        window.showToast?.(trDreamina('importedSyncing'), 'success'));
    } catch (error4) {
      window.showToast?.(error4?.message || trDreamina('importFailed'), 'error');
    }
  }
  function run41(enabled22, error5 = {}) {
    enabled10.qrImageLoadError = !!enabled22;
    if (enabled22) {
      ((enabled10.lastQrImageErrorAt = Date.now()),
        (enabled10.lastQrImageErrorMessage =
          String(error5?.message || '').trim() || trDreamina('qrLoadFailed')));
      return;
    }
    ((enabled10.lastQrImageLoadedAt = Date.now()),
      (enabled10.lastQrImageErrorAt = 0),
      (enabled10.lastQrImageErrorMessage = ''));
  }
  function run42(enabled23, value61, enabled24 = {}) {
    if (!enabled23) return false;
    const withCacheBust2 = !!enabled24?.withCacheBust,
      enabled25 = run22(value61, { withCacheBust: withCacheBust2 });
    if (!enabled25) return false;
    const value62 = String(enabled23.getAttribute('src') || '').trim();
    if (!withCacheBust2 && value62 === enabled25) return false;
    return (
      (enabled10.lastQrImageUrl = enabled25),
      (enabled10.lastQrImageRequestedAt = Date.now()),
      (enabled10.qrImageLoadError = false),
      (enabled10.lastQrImageErrorMessage = ''),
      (enabled23.src = enabled25),
      true
    );
  }
  function run43(el9) {
    if (!el9 || enabled10.qrImageListenersBound) return;
    (el9.addEventListener('load', () => {
      (run41(false), enabled10.lastStatus && run44(enabled10.lastStatus));
    }),
      el9.addEventListener('error', () => {
        (run41(true, { message: trDreamina('qrLoadFailed') }),
          enabled10.lastStatus && run44(enabled10.lastStatus));
      }),
      (enabled10.qrImageListenersBound = true));
  }
  function run45(value63) {
    const count5 = Number(value63?.startedAt || 0);
    if (count5 <= 0) return 0;
    const count6 = Number(value63?.completedAt || 0),
      value64 = count6 > 0 ? count6 : Date.now();
    return Math.max(0, value64 - count5);
  }
  function run46(value65) {
    const enabled26 = value65?.runtime || {};
    if (!enabled26?.active) return false;
    const value66 = String(enabled26?.phase || '');
    if (!['preparing', 'starting'].includes(value66)) return false;
    return run45(enabled26) >= value11;
  }
  async function run32(value67) {
    const enabled27 = String(value67 || '');
    if (!enabled27) return false;
    try {
      if (navigator?.clipboard?.writeText) return (await navigator.clipboard.writeText(enabled27), true);
    } catch (value68) {}
    try {
      const el10 = document.createElement('textarea');
      ((el10.value = enabled27),
        el10.setAttribute('readonly', 'readonly'),
        (el10.style.position = 'fixed'),
        (el10.style.left = '-9999px'),
        document.body?.appendChild(el10),
        el10.select());
      const enabled28 = document.execCommand('copy');
      return (el10.remove(), !!enabled28);
    } catch (value69) {
      return false;
    }
  }
  function run47(enabled29) {
    if (!enabled29 || typeof enabled29 !== 'object') return trDreamina('creditPlaceholder');
    const total = Number(enabled29.total_credit || 0),
      vip = Number(enabled29.vip_credit || 0),
      gift = Number(enabled29.gift_credit || 0),
      purchase = Number(enabled29.purchase_credit || 0);
    return trDreamina('creditTotal', {
      total: total,
      vip: vip,
      gift: gift,
      purchase: purchase,
    });
  }
  function run48(value70) {
    const value71 = String(value70?.phase || ''),
      count7 = Number(value70?.completedAt || 0),
      enabled30 = count7 > 0 ? value71 + ':' + count7 + ':' + (value70?.error || '') : '';
    if (!enabled30 || enabled30 === enabled10.lastToastKey) return;
    enabled10.lastToastKey = enabled30;
    if (value71 === 'success') {
      window.showToast?.(trDreamina('loginSuccess'), 'success');
      return;
    }
    if (value71 === 'reused') {
      window.showToast?.(trDreamina('loginReused'), 'info');
      return;
    }
    value71 === 'failed' && window.showToast?.(value70?.error || trDreamina('loginFailed'), 'error');
  }
  function run49(enabled31) {
    const enabled32 = enabled31?.runtime || {},
      value72 = !!enabled31?.loggedIn,
      value73 = !!enabled32?.active,
      value74 = String(enabled32?.phase || '');
    if (value73 && value74 === 'preparing') return trDreamina('statusPreparing');
    if (value73 && ['oauth_ready', 'polling'].includes(value74)) return trDreamina('statusWaitingAuth');
    if (value73) return trDreamina('statusLoggingIn');
    if (value72) return trDreamina('statusLoggedIn');
    return trDreamina('statusLoggedOut');
  }
  function run50(value75) {
    return getDreaminaStatusSessionKey(value75);
  }
  function run51(enabled33) {
    const enabled34 = run50(enabled33),
      enabled35 = !!enabled33?.runtime?.active;
    if (enabled34 && enabled34 !== enabled10.currentSessionKey) {
      ((enabled10.currentSessionKey = enabled34),
        (enabled10.dismissedSessionKey = ''),
        (enabled10.manualGuideOpen = false),
        (enabled10.webLoginPrimedAt = 0),
        (enabled10.autoOpenedManualAuthUrl = ''),
        run20());
      return;
    }
    !enabled35 &&
      !enabled34 &&
      ((enabled10.currentSessionKey = ''),
      (enabled10.dismissedSessionKey = ''),
      (enabled10.manualGuideOpen = false),
      (enabled10.webLoginPrimedAt = 0),
      (enabled10.autoOpenedManualAuthUrl = ''),
      run20());
  }
  function run52(value76) {
    if (!shouldAutoOpenDreaminaWebAuthLink(value76, enabled10)) return;
    const enabled36 = run30(value76);
    if (!enabled36) return;
    ((enabled10.autoOpenedManualAuthUrl = enabled36),
      run31(enabled36, trDreamina('authLinkLabel')).catch(() => {}));
  }
  function run53() {
    enabled10.modalCloseTimer &&
      (clearTimeout(enabled10.modalCloseTimer), (enabled10.modalCloseTimer = null));
  }
  function run54({ clearDismissed: clearDismissed = false } = {}) {
    const { modalOverlayEl: modalOverlayEl } = run15();
    if (!modalOverlayEl) return;
    (run53(), clearDismissed && (enabled10.dismissedSessionKey = ''), (modalOverlayEl.hidden = false));
  }
  function run17({ force: force = false, rememberDismissal: rememberDismissal = true } = {}) {
    const {
      modalOverlayEl: modalOverlayEl2,
      modalQrImageEl: modalQrImageEl,
      manualImportJsonEl: manualImportJsonEl2,
    } = run15();
    run53();
    if (rememberDismissal) {
      const value77 = run50(enabled10.lastStatus);
      value77 && (enabled10.dismissedSessionKey = value77);
    }
    if (modalOverlayEl2) modalOverlayEl2.hidden = true;
    if (modalQrImageEl) modalQrImageEl.removeAttribute('src');
    if (manualImportJsonEl2) manualImportJsonEl2.value = '';
    ((enabled10.manualGuideOpen = false), run28(enabled10.lastStatus || {}));
  }
  function run55(value78 = 0) {
    (run53(),
      (enabled10.modalCloseTimer = setTimeout(
        () => {
          run17({ force: true, rememberDismissal: false });
        },
        Math.max(0, Number(value78) || 0),
      )));
  }
  function run56(value79) {
    const value80 = value79?.runtime || {},
      value81 = String(value80?.phase || ''),
      value82 = ['oauth', 'web', 'headless'].includes(String(value80?.loginMode || '')),
      value83 = run46(value79),
      value84 = run23(value79),
      value85 = run25(value79);
    if (value85) return trDreamina('waitBrowserFailed');
    if (shouldDreaminaManualGuideOpenByDefault(value79, enabled10.dismissedSessionKey))
      return trDreamina('waitOpenAuth');
    if (value83) return trDreamina('waitPendingTooLong');
    if (value84) return trDreamina('waitQrDeprecated');
    if (value81 === 'failed') return trDreamina('waitFailed');
    if (value81 === 'oauth_ready' || value81 === 'polling') {
      const code = String(value80?.userCode || '').trim();
      return code ? trDreamina('waitCode', { code: code }) : trDreamina('waitConfirm');
    }
    if (value81 === 'qr_ready') return trDreamina('waitUseOAuth');
    if (value81 === 'success' || value81 === 'reused') return trDreamina('waitDone');
    if (value82) return trDreamina('waitOAuthPreparing');
    return trDreamina('waitPreparing');
  }
  function run44(error6) {
    const {
      modalCardEl: modalCardEl,
      modalCloseEl: modalCloseEl,
      modalMessageEl: modalMessageEl,
      modalQrWrapEl: modalQrWrapEl,
      modalQrImageEl: modalQrImageEl2,
      modalWaitEl: modalWaitEl,
      modalWaitTextEl: modalWaitTextEl,
      modalRetryEl: modalRetryEl,
      manualGuideEl: manualGuideEl2,
    } = run15();
    if (!modalMessageEl) return;
    const error7 = error6?.runtime || {},
      value86 = !!error7?.active,
      value87 = String(error7?.phase || ''),
      value88 = !!error6?.loggedIn,
      enabled37 = ['oauth', 'web', 'headless'].includes(String(error7?.loginMode || '')),
      value89 = run46(error6),
      enabled38 = !enabled37 && !!error7?.qrAvailable && value87 === 'qr_ready',
      value90 = run23(error6),
      value91 = run25(error6),
      enabled39 = value88 || ['success', 'reused', 'done'].includes(value87);
    enabled39 && (enabled10.manualGuideOpen = false);
    !enabled39 && value91 && (enabled10.manualGuideOpen = true);
    const enabled40 = run50(error6),
      shouldDreaminaManualGuideOpenByDefault2 = shouldDreaminaManualGuideOpenByDefault(
        error6,
        enabled10.dismissedSessionKey,
      );
    !enabled39 && shouldDreaminaManualGuideOpenByDefault2 && (enabled10.manualGuideOpen = true);
    const value92 =
      enabled10.manualGuideOpen ||
      ((value86 || enabled38) && (!!enabled40 ? enabled10.dismissedSessionKey !== enabled40 : true));
    if (value92) run54();
    else
      ['success', 'reused', 'failed', 'done'].includes(value87)
        ? run55(value87 === 'failed' ? 0 : 0x258)
        : run17({ force: true, rememberDismissal: false });
    (modalCardEl &&
      modalCardEl.classList.toggle('dreamina-login-modal--guide-open', !!enabled10.manualGuideOpen),
      modalMessageEl &&
        (modalMessageEl.textContent = enabled39
          ? trDreamina('modalSynced')
          : value91
            ? trDreamina('modalBrowserFailed')
            : shouldDreaminaManualGuideOpenByDefault2
              ? trDreamina('modalOAuthStarted')
              : value89
                ? trDreamina('modalPendingTooLong')
                : value90
                  ? trDreamina('modalQrAbnormal')
                  : value87 === 'failed'
                    ? trDreamina('modalRetryAuth')
                    : value87 === 'oauth_ready' || value87 === 'polling'
                      ? trDreamina('modalOpenAuthAndCode')
                      : enabled38
                        ? trDreamina('modalScanQr')
                        : String(error7?.message || '').trim() ||
                          String(error6?.message || '').trim() ||
                          trDreamina('modalProcessing')),
      modalWaitTextEl && (modalWaitTextEl.textContent = run56(error6)),
      modalWaitEl && (modalWaitEl.hidden = false),
      modalQrWrapEl && (modalQrWrapEl.hidden = !enabled38),
      modalQrImageEl2 &&
        (enabled38 ? run42(modalQrImageEl2, error7) : modalQrImageEl2.removeAttribute('src')),
      modalCloseEl && (modalCloseEl.disabled = false),
      modalRetryEl &&
        ((modalRetryEl.hidden = false),
        (modalRetryEl.disabled = false),
        enabled10.manualGuideOpen
          ? (modalRetryEl.textContent = trDreamina('guideCollapse'))
          : (modalRetryEl.textContent = value91 ? trDreamina('guideRecommended') : trDreamina('guide'))),
      manualGuideEl2 && run28(error6));
  }
  function run40(error8) {
    const {
      statusTextEl: statusTextEl,
      messageTextEl: messageTextEl,
      creditTextEl: creditTextEl,
      btnAuthEl: btnAuthEl,
      btnQrAuthEl: btnQrAuthEl,
      btnLogoutEl: btnLogoutEl,
    } = run15();
    if (!statusTextEl) return;
    if (!run16()) return;
    const error9 = error8?.runtime || {},
      enabled41 = !!error8?.loggedIn,
      value93 = !!error9?.active,
      value94 = String(error9?.phase || ''),
      value95 =
        String(error9?.message || '').trim() ||
        String(error8?.message || '').trim() ||
        trDreamina('notLoggedInHint');
    statusTextEl.textContent = run49(error8);
    messageTextEl && (messageTextEl.textContent = value95);
    creditTextEl &&
      (creditTextEl.textContent = enabled41 ? run47(error8?.credit) : trDreamina('creditPlaceholder'));
    btnAuthEl &&
      ((btnAuthEl.disabled = false), (btnAuthEl.textContent = getDreaminaWebLoginButtonText(error8)));
    btnQrAuthEl &&
      ((btnQrAuthEl.hidden = true),
      (btnQrAuthEl.disabled = true),
      (btnQrAuthEl.textContent = getDreaminaQrLoginButtonText(error8)));
    btnLogoutEl && (btnLogoutEl.disabled = value93 || !enabled41);
    if (value93) run19();
    else run18();
    ((enabled10.lastStatus = error8), run51(error8), run44(error8), run52(error8), run48(error9));
  }
  async function run7({ force: force = false, silent: silent = false } = {}) {
    if (!run16()) return null;
    if (typeof fetchDreaminaCliStatusFromServer !== 'function') return null;
    try {
      const value96 = await fetchDreaminaCliStatusFromServer({ refresh: force });
      return (run40(value96 || {}), value96 || {});
    } catch (error10) {
      if (!silent) {
        const value97 = error10?.message || trDreamina('fetchStatusFailed');
        window.showToast?.(value97, 'error');
      }
      return null;
    }
  }
  async function run57() {
    if (!run16()) return;
    const value98 = enabled10.lastStatus?.runtime || {};
    if (value98?.active) {
      (run54({ clearDismissed: true }),
        (enabled10.manualGuideOpen = true),
        run44(enabled10.lastStatus || {}));
      return;
    }
    const force2 = !!enabled10.lastStatus?.loggedIn;
    if (typeof startDreaminaWebLoginFromServer !== 'function') return;
    ((enabled10.manualGuideOpen = true),
      (enabled10.webLoginPrimedAt = Date.now()),
      (enabled10.autoOpenedManualAuthUrl = ''),
      run54({ clearDismissed: true }));
    try {
      const response3 = await startDreaminaWebLoginFromServer({ force: force2 });
      if (response3?.success === false) throw new Error(response3?.message || trDreamina('startFailed'));
      ((enabled10.manualGuideOpen = true),
        response3?.status && run40(response3.status),
        window.showToast?.(force2 ? trDreamina('reloginStarted') : trDreamina('loginStarted'), 'info'),
        run19());
    } catch (error11) {
      window.showToast?.(error11?.message || trDreamina('startFailed'), 'error');
    }
  }
  async function run58() {
    await run57();
  }
  function run59() {
    ((enabled10.manualGuideOpen = !enabled10.manualGuideOpen), run44(enabled10.lastStatus || {}));
  }
  async function run60() {
    if (!run16()) return;
    if (typeof logoutDreaminaFromServer !== 'function') return;
    try {
      const response4 = await logoutDreaminaFromServer();
      if (response4?.success === false) throw new Error(response4?.message || trDreamina('logoutFailed'));
      (response4?.status ? run40(response4.status) : await run7({ force: true, silent: true }),
        run18(),
        window.showToast?.(trDreamina('loggedOut'), 'success'));
    } catch (error12) {
      window.showToast?.(error12?.message || trDreamina('logoutFailed'), 'error');
    }
  }
  function run61() {
    const {
      btnAuthEl: btnAuthEl2,
      btnQrAuthEl: btnQrAuthEl2,
      btnLogoutEl: btnLogoutEl2,
      modalOverlayEl: modalOverlayEl3,
      modalCloseEl: modalCloseEl2,
      modalQrImageEl: modalQrImageEl3,
      modalRetryEl: modalRetryEl2,
      manualOpenLoginEl: manualOpenLoginEl2,
      manualCopyLoginEl: manualCopyLoginEl2,
      manualOpenAuthEl: manualOpenAuthEl2,
      manualCopyAuthEl: manualCopyAuthEl2,
      manualImportJsonBtnEl: manualImportJsonBtnEl,
    } = run15();
    (run43(modalQrImageEl3),
      btnAuthEl2?.addEventListener('click', () => {
        run57().catch(() => {});
      }),
      btnQrAuthEl2?.addEventListener('click', () => {
        run58().catch(() => {});
      }),
      btnLogoutEl2?.addEventListener('click', () => {
        run60().catch(() => {});
      }),
      modalCloseEl2?.addEventListener('click', () => {
        run17({ force: true });
      }),
      modalRetryEl2?.addEventListener('click', () => {
        run59();
      }),
      manualOpenLoginEl2?.addEventListener('click', () => {
        run34().catch(() => {});
      }),
      manualCopyLoginEl2?.addEventListener('click', () => {
        run36().catch(() => {});
      }),
      manualOpenAuthEl2?.addEventListener('click', () => {
        run35().catch(() => {});
      }),
      manualCopyAuthEl2?.addEventListener('click', () => {
        run37().catch(() => {});
      }),
      manualImportJsonBtnEl?.addEventListener('click', () => {
        run39().catch(() => {});
      }),
      modalOverlayEl3?.addEventListener('click', (event2) => {
        if (event2.target !== modalOverlayEl3) return;
        run17();
      }),
      document.addEventListener('keydown', (event3) => {
        if (event3.key !== 'Escape') return;
        run17();
      }));
    if (document.body) {
      const mutationObserver = new MutationObserver(() => {
        const value99 = run16();
        value99 && run7({ force: true, silent: true }).catch(() => {});
      });
      mutationObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  }
  function run6() {
    const run62 = (value100) =>
        String(value100 || '')
          .trim()
          .replace(/^Bearer\s+/i, ''),
      providers = {};
    list8.forEach((item7) => {
      const el11 = document.getElementById('providerUrl-' + item7),
        el12 = document.getElementById('providerKey-' + item7),
        args4 = value12?.providers?.[item7],
        value101 = args4 && typeof args4 === 'object' ? { ...args4 } : {};
      if (el11) value101.apiUrl = el11.value.trim();
      if (el12) value101.apiKey = run62(el12.value);
      (item7 === 'apimart' && Object.assign(value101, run13(value101)), (providers[item7] = value101));
    });
    const el13 = document.getElementById('providerKey-runninghub-model');
    return (
      el13 &&
        ((providers.runninghub = providers.runninghub || {}),
        (providers.runninghub.modelApiKey = run62(el13.value))),
      { ...(value12 || {}), providers: providers }
    );
  }
  function run63(value102) {
    const value103 = value102?.providers || {};
    return list8.filter((item8) => {
      const value104 = value103[item8] || {};
      return !!String(value104.apiKey || value104.modelApiKey || '').trim();
    });
  }
  function run64(value105, value106) {
    const value107 = value105?.providers?.[value106] || {};
    return !!String(value107.apiKey || value107.modelApiKey || '').trim();
  }
  function run65(value108) {
    const value109 = document.getElementById('providerTestStatus-' + value108);
    return (run66(value109), value109);
  }
  function run67(value110) {
    const value111 = document.getElementById('providerBalance-' + value110);
    return (run66(value111), value111);
  }
  function run68() {
    if (el) return el;
    return (
      (el = document.createElement('div')),
      (el.className = 'settings-provider-test-tooltip'),
      el.setAttribute('role', 'tooltip'),
      (el.hidden = true),
      document.body.appendChild(el),
      el
    );
  }
  function run69(value112) {
    return String(value112?.getAttribute('data-provider-test-tooltip') || '').trim();
  }
  function run70(el14) {
    if (!el || !el14) return;
    const el15 = el,
      box = el14.getBoundingClientRect(),
      box2 = el15.getBoundingClientRect(),
      value113 = 24,
      value114 = el14.closest('.settings-modal')?.getBoundingClientRect().top ?? 0,
      value115 = Math.max(value113, value114 + 10),
      value116 = Math.max(value113, window.innerWidth - box2.width - value113),
      value117 = Math.min(value116, Math.max(value113, box.left + box.width / 2 - box2.width / 2)),
      value118 = Math.max(value115, box.top - box2.height - 12),
      value119 = Math.min(box2.width - 14, Math.max(14, box.left + box.width / 2 - value117));
    ((el15.style.left = value117 + 'px'),
      (el15.style.top = value118 + 'px'),
      el15.style.setProperty('--settings-provider-test-tooltip-arrow-left', value119 + 'px'));
  }
  function run71(value120) {
    const enabled42 = run69(value120);
    if (!enabled42) return;
    const el16 = run68();
    ((value13 = value120),
      (el16.textContent = enabled42),
      (el16.hidden = false),
      run70(value120),
      el16.classList.add('is-visible'));
  }
  function run72(value121 = null) {
    if (value121 && value13 !== value121) return;
    value13 = null;
    if (!el) return;
    (el.classList.remove('is-visible'), (el.hidden = true));
  }
  function run66(el17) {
    if (!el17 || el17.dataset.providerTestTooltipBound === '1') return;
    ((el17.dataset.providerTestTooltipBound = '1'),
      el17.addEventListener('pointerenter', () => run71(el17)),
      el17.addEventListener('pointerleave', () => run72(el17)),
      el17.addEventListener('focus', () => run71(el17)),
      el17.addEventListener('blur', () => run72(el17)));
  }
  function run73(value122) {
    const el18 = run65(value122);
    (el18 &&
      (run72(el18),
      (el18.hidden = true),
      (el18.textContent = ''),
      (el18.title = ''),
      el18.removeAttribute('data-tooltip'),
      el18.removeAttribute('data-tooltip-source'),
      el18.removeAttribute('data-native-title'),
      el18.removeAttribute('data-provider-test-tooltip'),
      el18.classList.remove(...args)),
      run74(value122));
  }
  function run75(value123, value124, value125, value126 = '') {
    const el19 = run65(value123);
    if (!el19) return;
    ((el19.hidden = false), (el19.textContent = value125));
    const value127 = value126 || value125;
    (el19.removeAttribute('title'),
      el19.removeAttribute('data-tooltip'),
      el19.removeAttribute('data-tooltip-source'),
      el19.removeAttribute('data-native-title'),
      el19.setAttribute('data-provider-test-tooltip', value127),
      el19.setAttribute('aria-label', value127),
      el19.classList.remove(...args));
    if (value124 === 'success') el19.classList.add('settings-provider-status--success');
    else {
      if (value124 === 'testing') el19.classList.add('settings-provider-status--testing');
      else {
        if (value124 === 'partial') el19.classList.add('settings-provider-status--partial');
        else el19.classList.add('settings-provider-status--danger');
      }
    }
  }
  function run74(value128) {
    const el20 = run67(value128);
    if (!el20) return;
    (run72(el20),
      (el20.hidden = true),
      (el20.textContent = ''),
      el20.removeAttribute('aria-label'),
      el20.removeAttribute('data-provider-test-tooltip'));
  }
  function run76(value129, value130 = null) {
    const el21 = run67(value129);
    if (!el21) return;
    const enabled43 = String(value130?.displayText || '').trim();
    if (!enabled43) {
      run74(value129);
      return;
    }
    const value131 = String(value130?.detailText || enabled43).trim();
    ((el21.hidden = false),
      (el21.textContent = enabled43),
      el21.setAttribute('aria-label', value131),
      el21.setAttribute('data-provider-test-tooltip', value131));
  }
  function run77(options3 = {}) {
    const list14 = [],
      value132 = options3.suggestion || options3.summary || options3.error || options3.detail || '';
    if (value132) list14.push(value132);
    if (Array.isArray(options3.steps) && options3.steps.length > 0)
      options3.steps.forEach((error13) => {
        const value133 = error13.skipped
            ? trApiInput('diagnostics.skipped')
            : error13.ok
              ? trApiInput('diagnostics.passed')
              : trApiInput('diagnostics.failed'),
          value134 = error13.message || error13.detail || '';
        list14.push(
          (error13.label || error13.id || trApiInput('diagnostics.step')) +
            '：' +
            value133 +
            (value134 ? ' - ' + value134 : ''),
        );
      });
    else options3.detail && list14.push(options3.detail);
    return list14.filter(Boolean).join('\n');
  }
  function run78(response5 = {}) {
    if (response5.ok) return 'success';
    if (response5.partial) return 'partial';
    return 'danger';
  }
  function run79(response6 = {}) {
    if (response6.ok) return trApiInput('diagnostics.passed');
    if (response6.partial) return trApiInput('diagnostics.partialPassed');
    return trApiInput('diagnostics.notPassed');
  }
  function run80() {
    list8.forEach(run73);
  }
  function run81() {
    (list8.forEach((item9) => {
      const el22 = document.getElementById('providerUrl-' + item9),
        el23 = document.getElementById('providerKey-' + item9);
      (el22?.addEventListener('input', () => run73(item9)),
        el23?.addEventListener('input', () => run73(item9)));
    }),
      run8().forEach((el24) => {
        el24.addEventListener('click', () => {
          (run11(el24.dataset.apimartRoute), run73('apimart'));
        });
      }),
      document
        .getElementById('providerKey-runninghub-model')
        ?.addEventListener('input', () => run73('runninghub')));
  }
  async function run82(el25, value135 = {}) {
    if (typeof testProviderConnections !== 'function') {
      window.showToast?.(trApiInput('diagnostics.testUnsupported'), 'error');
      return;
    }
    const value136 = run6(),
      value137 = String(value135?.providerId || '')
        .trim()
        .toLowerCase(),
      list15 = value137 ? [value137] : run63(value136);
    value137 ? run73(value137) : run80();
    if (value137 && !run64(value136, value137)) {
      window.showToast?.(trApiInput('diagnostics.fillProviderKey'), 'warn');
      return;
    }
    if (list15.length === 0) {
      window.showToast?.(trApiInput('diagnostics.fillOneProviderKey'), 'warn');
      return;
    }
    list15.forEach((item10) => run75(item10, 'testing', trApiInput('diagnostics.testing')));
    const el26 = el25?.querySelector?.('.settings-btn-label'),
      value138 = el26?.textContent || el25?.textContent || trApiInput('testConnection');
    if (el25) {
      el25.disabled = true;
      if (el26) el26.textContent = trApiInput('diagnostics.testingBusy');
      else el25.textContent = trApiInput('diagnostics.testingBusy');
    }
    const value139 = {},
      list16 = [];
    try {
      await Promise.all(
        list15.map(async (label3) => {
          try {
            const value140 = await testProviderConnections(value136, [label3]);
            value139[label3] = value140?.[label3];
          } catch (error14) {
            value139[label3] = {
              ok: false,
              label: label3,
              error: error14?.message || trApiInput('diagnostics.testFailed'),
            };
          }
          const label4 = value139[label3];
          (run76(label3, label4?.balance),
            label4?.ok
              ? run75(
                  label3,
                  'success',
                  trApiInput('diagnostics.passed'),
                  run77(label4) || trApiInput('diagnostics.testPassed'),
                )
              : (list16.push({
                  label: label4?.label || label3,
                  error:
                    label4?.suggestion ||
                    label4?.summary ||
                    label4?.error ||
                    trApiInput('diagnostics.testNotPassed'),
                }),
                run75(
                  label3,
                  run78(label4),
                  run79(label4),
                  run77(label4) || label4?.error || trApiInput('diagnostics.testNotPassed'),
                )));
        }),
      );
      if (list16.length === 0) {
        const label5 = value139[list15[0]],
          value141 = value137
            ? trApiInput('diagnostics.providerPassed', { label: label5?.label || value137 })
            : trApiInput('diagnostics.allPassed');
        window.showToast?.(value141, 'success');
      } else {
        const label6 = list16[0];
        window.showToast?.(
          trApiInput('diagnostics.providerFailed', { label: label6.label, error: label6.error }),
          'error',
          0x2328,
        );
      }
    } catch (error15) {
      (list15.forEach((item11) =>
        run75(
          item11,
          'danger',
          trApiInput('diagnostics.notPassed'),
          error15?.message || trApiInput('diagnostics.testFailed'),
        ),
      ),
        window.showToast?.(
          trApiInput('diagnostics.testFailedWithDetail', {
            error: error15?.message || trApiInput('diagnostics.unknownError'),
          }),
          'error',
        ));
    } finally {
      if (el25) {
        el25.disabled = false;
        if (el26) el26.textContent = value138;
        else el25.textContent = value138;
      }
    }
  }
  function run83() {
    const el27 = document.getElementById('btnApiSave'),
      el28 = document.getElementById('btnApiTest');
    (fetchApiConfigFromServer()
      .then((enabled44) => {
        if (!enabled44 || enabled44.error) return;
        value12 = enabled44 || {};
        const enabled45 = enabled44.providers || {};
        (list8.forEach((item12) => {
          const el29 = document.getElementById('providerUrl-' + item12),
            el30 = document.getElementById('providerKey-' + item12),
            value142 = enabled45[item12] || {};
          if (el29 && value142.apiUrl) el29.value = value142.apiUrl;
          if (el30 && value142.apiKey) el30.value = value142.apiKey;
        }),
          run12(enabled45.apimart || {}),
          run(value12),
          PROVIDER_MODEL_CATALOG_PROVIDER_IDS.forEach((item13) => run2(item13)));
        const el31 = document.getElementById('providerKey-runninghub-model');
        el31 && enabled45.runninghub?.modelApiKey && (el31.value = enabled45.runninghub.modelApiKey);
        if (!enabled45.grsai?.apiKey && enabled44.apiKey) {
          const el32 = document.getElementById('providerKey-grsai');
          if (el32 && !el32.value) el32.value = enabled44.apiKey;
        }
      })
      .catch((error16) => {
        (console.error('[API Config] 加载失败:', error16),
          showError?.(
            trApiInput('diagnostics.loadFailed', {
              error: error16.message || trApiInput('diagnostics.unknownError'),
            }),
          ));
      })
      .finally(() => {
        run16() && run7({ force: true, silent: true }).catch(() => {});
      }),
      el27 &&
        el27.addEventListener('click', () => {
          const value18 = run6();
          saveApiConfigToServer(value18)
            .then((error) => {
              error.success || !error.error
                ? ((value12 = value18),
                  window.showToast?.(trApiInput('diagnostics.saveSuccess')),
                  run7({ force: true, silent: true }).catch(() => {}))
                : window.showToast?.(
                    trApiInput('diagnostics.saveFailed', {
                      error: error.error || trApiInput('diagnostics.unknownError'),
                    }),
                    'error',
                  );
            })
            .catch((error17) => {
              window.showToast?.(
                trApiInput('diagnostics.saveFailed', {
                  error: error17.message || trApiInput('diagnostics.unknownError'),
                }),
                'error',
              );
            });
        }),
      el28?.addEventListener('click', () => {
        run82(el28).catch(() => {});
      }),
      document.querySelectorAll('[data-provider-test]').forEach((el33) => {
        const providerId3 = String(el33.dataset.providerTest || '').trim();
        if (!providerId3) return;
        el33.addEventListener('click', () => {
          run82(el33, { providerId: providerId3 }).catch(() => {});
        });
      }),
      document.querySelectorAll('[data-provider-models]').forEach((el34) => {
        const enabled46 = String(el34.dataset.providerModels || '').trim();
        if (!enabled46) return;
        el34.addEventListener('click', () => {
          run4(enabled46, el34).catch(() => {});
        });
      }),
      (document.getElementById('pane-api-input') || document).addEventListener('click', (event4) => {
        const el35 = event4?.target?.closest?.('[data-provider-model-save]');
        if (!el35) return;
        (event4.preventDefault?.(),
          run5(String(el35.dataset.providerModelSave || '').trim()).catch(() => {}));
      }),
      run81(),
      run61());
  }
  function init() {
    (run14(), run16(), run83());
  }
  return { init: init };
}
