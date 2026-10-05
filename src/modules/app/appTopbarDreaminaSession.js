import { t } from '../../i18n/index.js';
import { openExternalLink } from '../../services/externalLinkService.js';
import { CLI_COMPONENT_CHANGED } from '../../../api/cliComponentApi.js';
const DREAMINA_LOGIN_PAGE_URL = 'https://jimeng.jianying.com/',
  DREAMINA_I18N_PREFIX = 'settings.apiInput.providers.dreamina';
function trTemplate(value, item = {}) {
  let t2 = t(value);
  return (
    Object['entries'](item || {})['forEach'](([key, index]) => {
      t2 = t2['split']('{' + key + '}')['join'](String(index ?? ''));
    }),
    t2
  );
}
function trDreamina(result, data = {}) {
  return trTemplate(DREAMINA_I18N_PREFIX + '.' + result, data);
}
function normalizeDreaminaManualUrlCandidate(options) {
  const enabled = String(options || '')['trim']();
  if (!enabled) return '';
  const target = enabled['replace'](/^[<（(【\["'“‘]+/, '')
    ['replace'](/[>）)】\]"'”’]+$/, '')
    ['replace'](/[，。；;、]+$/, '');
  return /^https?:\/\//['test'](target) ? target : '';
}
export function extractDreaminaManualLinksFromOutputLines(source) {
  const list = Array['isArray'](source) ? source : [],
    list2 = [];
  let enabled2 = '';
  list['forEach']((next) => {
    const list3 = String(next || '');
    if (!enabled2 && list3['includes']('请在浏览器中打开以下链接')) enabled2 = '__PENDING__';
    else enabled2 === '__PENDING__' && (enabled2 = list3['trim']());
    const list4 = list3['match'](/https?:\/\/[^\s]+/g);
    if (!list4) return;
    list4['forEach']((current) => {
      const dreaminaManualUrlCandidate = normalizeDreaminaManualUrlCandidate(current);
      if (dreaminaManualUrlCandidate && !list2['includes'](dreaminaManualUrlCandidate))
        list2['push'](dreaminaManualUrlCandidate);
    });
  });
  const entry = enabled2 && enabled2 !== '__PENDING__' ? normalizeDreaminaManualUrlCandidate(enabled2) : '',
    strictAuthorizeUrl =
      entry ||
      list2['find']((list5) => list5['includes']('/passport/web_login')) ||
      list2['find']((list6) => list6['includes']('/passport/web/web_login')) ||
      '',
    authorizeUrl = list2['find']((list7) => list7['includes']('/dreamina/cli/v1/dreamina_cli_login')) || '',
    record = authorizeUrl || list2['find']((payload) => payload !== DREAMINA_LOGIN_PAGE_URL) || '';
  return {
    authorizeUrl: authorizeUrl || strictAuthorizeUrl || record || '',
    strictAuthorizeUrl: strictAuthorizeUrl,
    callbackUrl: authorizeUrl,
  };
}
export function getDreaminaWebLoginButtonText(enabled3) {
  const enabled4 = enabled3?.['runtime'] || {},
    handle = !!enabled3?.['loggedIn'],
    state = !!enabled4?.['active'];
  if (state) return trDreamina('viewLogin');
  return handle ? trDreamina('relogin') : trDreamina('login');
}
export function getDreaminaQrLoginButtonText(config) {
  const enabled5 = config?.['runtime'] || {},
    scope = !!enabled5?.['active'];
  if (scope) return trDreamina('viewLogin');
  return trDreamina('login');
}
export function getDreaminaStatusSessionKey(input) {
  const output = input?.['runtime'] || {},
    count = Number(output?.['startedAt'] || 0);
  if (count > 0) return 'login:' + count;
  const count2 = Number(output?.['qrVersion'] || 0);
  if (count2 > 0) return 'qr:' + count2;
  return '';
}
export function mergeDreaminaLoginRuntimeStatus(error = {}, runtime = {}) {
  const value2 = String(runtime?.['phase'] || ''),
    loggedIn = ['success', 'reused', 'done']['includes'](value2);
  return {
    ...(error || {}),
    loggedIn: loggedIn ? true : !!error?.['loggedIn'],
    message: String(runtime?.['message'] || '')['trim']() || String(error?.['message'] || '')['trim'](),
    runtime: runtime || {},
  };
}
export function reconcileDreaminaSessionUiState(enabled6, enabled7 = {}) {
  const dreaminaStatusSessionKey = getDreaminaStatusSessionKey(enabled6),
    enabled8 = !!enabled6?.['runtime']?.['active'],
    enabled9 = !!enabled7['manualGuideOpen'] && Number(enabled7['loginLaunchRequestedAt'] || 0) > 0;
  if (dreaminaStatusSessionKey && dreaminaStatusSessionKey !== enabled7['currentSessionKey'])
    return (
      (enabled7['currentSessionKey'] = dreaminaStatusSessionKey),
      (enabled7['dismissedSessionKey'] = ''),
      !enabled9 && ((enabled7['manualGuideOpen'] = false), (enabled7['loginLaunchRequestedAt'] = 0)),
      true
    );
  if (!enabled8 && !dreaminaStatusSessionKey && !enabled9)
    return (
      (enabled7['currentSessionKey'] = ''),
      (enabled7['dismissedSessionKey'] = ''),
      (enabled7['manualGuideOpen'] = false),
      (enabled7['loginLaunchRequestedAt'] = 0),
      true
    );
  return false;
}
export function shouldDreaminaManualGuideOpenByDefault(value3, value4 = '') {
  const enabled10 = value3?.['runtime'] || {},
    value5 = String(enabled10?.['loginMode'] || '');
  if (!enabled10?.['active'] || !['oauth', 'web', 'headless']['includes'](value5)) return false;
  const dreaminaStatusSessionKey2 = getDreaminaStatusSessionKey(value3);
  return !dreaminaStatusSessionKey2 || String(value4 || '') !== dreaminaStatusSessionKey2;
}
export function createDreaminaLoginSessionController({
  fetchDreaminaCliStatusFromServer: fetchDreaminaCliStatusFromServer,
  fetchDreaminaCliLoginRuntimeFromServer: fetchDreaminaCliLoginRuntimeFromServer,
  startDreaminaWebLoginFromServer: startDreaminaWebLoginFromServer,
  importDreaminaLoginResponseFromServer: importDreaminaLoginResponseFromServer,
  logoutDreaminaFromServer: logoutDreaminaFromServer,
  buildDreaminaQrImageUrl: buildDreaminaQrImageUrl,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const settingsCardEl = documentObject,
    value6 = windowObject,
    value7 = 0x55 * 1000,
    enabled11 = {
      pollTimer: null,
      pollInFlight: false,
      pollInFlightGeneration: 0,
      pollGeneration: 0,
      statusRequestGeneration: 0,
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
      loginLaunchRequestedAt: 0,
      observer: null,
    };
  function run() {
    return {
      settingsCardEl: settingsCardEl['getElementById']('dreaminaSettingsCard'),
      statusTextEl: settingsCardEl['getElementById']('dreaminaStatusText'),
      messageTextEl: settingsCardEl['getElementById']('dreaminaStatusMessage'),
      creditTextEl: settingsCardEl['getElementById']('dreaminaCreditText'),
      btnAuthEl: settingsCardEl['getElementById']('btnDreaminaAuth'),
      btnQrAuthEl: settingsCardEl['getElementById']('btnDreaminaQrAuth'),
      btnLogoutEl: settingsCardEl['getElementById']('btnDreaminaLogout'),
      modalOverlayEl: settingsCardEl['getElementById']('dreaminaLoginModal'),
      modalCardEl: settingsCardEl['getElementById']('dreaminaLoginModalCard'),
      modalCloseEl: settingsCardEl['getElementById']('dreaminaModalClose'),
      modalMessageEl: settingsCardEl['getElementById']('dreaminaModalMessage'),
      modalQrWrapEl: settingsCardEl['getElementById']('dreaminaModalQrWrap'),
      modalQrImageEl: settingsCardEl['getElementById']('dreaminaModalQrImage'),
      modalWaitEl: settingsCardEl['getElementById']('dreaminaModalWait'),
      modalWaitTextEl: settingsCardEl['getElementById']('dreaminaModalWaitText'),
      modalRetryEl: settingsCardEl['getElementById']('dreaminaModalRetry'),
      manualGuideEl: settingsCardEl['getElementById']('dreaminaManualGuide'),
      manualAuthUrlEl: settingsCardEl['getElementById']('dreaminaManualAuthUrl'),
      manualImportJsonEl: settingsCardEl['getElementById']('dreaminaManualImportJson'),
      manualOpenAuthEl: settingsCardEl['getElementById']('dreaminaManualOpenAuth'),
      manualCopyAuthEl: settingsCardEl['getElementById']('dreaminaManualCopyAuth'),
      manualImportJsonBtnEl: settingsCardEl['getElementById']('dreaminaManualImportJsonBtn'),
    };
  }
  function syncDevVisibility() {
    const { settingsCardEl: settingsCardEl2 } = run();
    if (!settingsCardEl2) return false;
    const enabled12 = true;
    return (
      (settingsCardEl2['hidden'] = !enabled12),
      !enabled12 && (run2({ force: true, rememberDismissal: false }), run3()),
      enabled12
    );
  }
  function run3() {
    (enabled11['pollTimer'] && (clearTimeout(enabled11['pollTimer']), (enabled11['pollTimer'] = null)),
      (enabled11['pollGeneration'] += 1));
  }
  function run4() {
    const value8 = enabled11['pollGeneration'];
    if (
      enabled11['pollTimer'] ||
      (enabled11['pollInFlight'] && enabled11['pollInFlightGeneration'] === value8)
    )
      return;
    const run5 = async () => {
      if (value8 !== enabled11['pollGeneration']) return;
      enabled11['pollTimer'] = null;
      if (enabled11['pollInFlight'] && enabled11['pollInFlightGeneration'] === value8) return;
      ((enabled11['pollInFlight'] = true), (enabled11['pollInFlightGeneration'] = value8));
      try {
        await run6({ silent: true });
      } finally {
        enabled11['pollInFlightGeneration'] === value8 && (enabled11['pollInFlight'] = false);
        if (value8 !== enabled11['pollGeneration']) return;
        enabled11['lastStatus']?.['runtime']?.['active'] &&
          (enabled11['pollTimer'] = setTimeout(run5, 800));
      }
    };
    void run5();
  }
  function run7() {
    ((enabled11['qrImageLoadError'] = false),
      (enabled11['lastQrImageUrl'] = ''),
      (enabled11['lastQrImageRequestedAt'] = 0),
      (enabled11['lastQrImageLoadedAt'] = 0),
      (enabled11['lastQrImageErrorAt'] = 0),
      (enabled11['lastQrImageErrorMessage'] = ''));
  }
  function run8(value9, value10 = Date['now']()) {
    const list8 = String(value9 || '')['trim']();
    if (!list8) return '';
    const value11 = list8['includes']('?') ? '&' : '?';
    return '' + list8 + value11 + 'cb=' + encodeURIComponent(String(value10));
  }
  function run9(value12, { withCacheBust: withCacheBust = false } = {}) {
    const value13 = Number(value12?.['qrVersion'] || 0),
      enabled13 = buildDreaminaQrImageUrl?.(value13 || Date['now']()) || '';
    if (!enabled13) return '';
    return withCacheBust ? run8(enabled13) : enabled13;
  }
  function run10(value14) {
    const enabled14 = value14?.['runtime'] || {},
      value15 = String(enabled14?.['phase'] || ''),
      value16 = !!enabled14?.['qrAvailable'];
    return value15 === 'qr_ready' && value16 && !!enabled11['qrImageLoadError'];
  }
  function run11(value17) {
    const value18 = value17?.['runtime'] || {};
    return Array['isArray'](value18?.['outputTail']) ? value18['outputTail'] : [];
  }
  function run12(value19) {
    const list9 = run11(value19);
    return list9['some']((value20) => {
      const list10 = String(value20 || '')['toLowerCase']();
      return (
        list10['includes']('自动打开浏览器失败') ||
        list10['includes']('open headless login page') ||
        list10['includes']('executable file not found') ||
        list10['includes']('google-chrome')
      );
    });
  }
  function run13(value21) {
    const value22 = value21?.['runtime'] || {},
      args = extractDreaminaManualLinksFromOutputLines(run11(value21));
    return {
      ...args,
      authorizeUrl: String(value22?.['authorizeUrl'] || '')['trim']() || args['authorizeUrl'],
      callbackUrl: String(value22?.['callbackUrl'] || '')['trim']() || args['callbackUrl'],
    };
  }
  function run14(value23) {
    const {
      manualAuthUrlEl: manualAuthUrlEl,
      manualOpenAuthEl: manualOpenAuthEl,
      manualCopyAuthEl: manualCopyAuthEl,
    } = run();
    if (!manualAuthUrlEl || !manualOpenAuthEl || !manualCopyAuthEl) return;
    const value24 = run13(value23 || enabled11['lastStatus'] || {}),
      enabled15 = String(value24?.['authorizeUrl'] || '')['trim']();
    ((manualAuthUrlEl['value'] = enabled15 || trDreamina('waitingAuthUrl')),
      (manualOpenAuthEl['disabled'] = !enabled15),
      (manualCopyAuthEl['disabled'] = !enabled15));
  }
  function run15(value25) {
    const { manualGuideEl: manualGuideEl } = run();
    if (!manualGuideEl) return;
    (run14(value25 || enabled11['lastStatus'] || {}),
      (manualGuideEl['hidden'] = !enabled11['manualGuideOpen']));
  }
  function run16(value26 = enabled11['lastStatus'] || {}) {
    const value27 = run13(value26);
    return String(value27?.['authorizeUrl'] || '')['trim']();
  }
  async function run17(value28, label) {
    const enabled16 = String(value28 || '')['trim']();
    if (!enabled16)
      return (value6['showToast']?.(trDreamina('missingValue', { label: label }), 'warning'), false);
    try {
      return (await openExternalLink(enabled16, { label: label }), true);
    } catch (value29) {}
    const value30 = await run18(enabled16);
    return (
      value30
        ? value6['showToast']?.(trDreamina('browserOpenFailedCopied', { label: label }), 'warning')
        : value6['showToast']?.(trDreamina('browserOpenFailedCopyFirst', { label: label }), 'warning'),
      false
    );
  }
  async function run19(value31, label2) {
    const enabled17 = String(value31 || '')['trim']();
    if (!enabled17) {
      value6['showToast']?.(trDreamina('missingValue', { label: label2 }), 'warning');
      return;
    }
    const value32 = await run18(enabled17);
    value32
      ? value6['showToast']?.(trDreamina('copySuccess', { label: label2 }), 'success')
      : value6['showToast']?.(trDreamina('copyFailed', { label: label2 }), 'error');
  }
  async function run20() {
    await run17(run16(), trDreamina('authLinkLabel'));
  }
  async function run21() {
    await run19(run16(), trDreamina('authLinkLabel'));
  }
  function run22(value33) {
    const list11 = String(value33 || '')['trim']();
    if (!list11) throw new Error(trDreamina('jsonPasteRequired'));
    const list12 = [];
    list12['push'](list11);
    const value34 = list11['match'](/```(?:json)?\s*([\s\S]*?)```/i);
    value34?.[1] && list12['push'](String(value34[1])['trim']());
    const count3 = list11['indexOf']('{'),
      value35 = list11['lastIndexOf']('}');
    count3 >= 0 && value35 > count3 && list12['push'](list11['slice'](count3, value35 + 1)['trim']());
    for (const enabled18 of list12) {
      if (!enabled18) continue;
      try {
        const enabled19 = JSON['parse'](enabled18);
        if (!enabled19 || typeof enabled19 !== 'object' || Array['isArray'](enabled19))
          throw new Error('INVALID_OBJECT');
        return enabled19;
      } catch (error2) {
        if (error2?.['message'] === 'INVALID_OBJECT') throw new Error(trDreamina('jsonMustBeObject'));
      }
    }
    throw new Error(trDreamina('jsonFormatInvalid'));
  }
  async function run23() {
    if (typeof importDreaminaLoginResponseFromServer !== 'function') {
      value6['showToast']?.(trDreamina('jsonImportUnsupported'), 'error');
      return;
    }
    const { manualImportJsonEl: manualImportJsonEl } = run(),
      value36 = String(manualImportJsonEl?.['value'] || '');
    let value37 = null;
    try {
      value37 = run22(value36);
    } catch (error3) {
      value6['showToast']?.(error3?.['message'] || trDreamina('jsonParseFailed'), 'warning');
      return;
    }
    try {
      const response = await importDreaminaLoginResponseFromServer(value37);
      if (response?.['success'] === false) throw new Error(response?.['message'] || trDreamina('importFailed'));
      (response?.['status'] ? run24(response['status']) : await refreshStatus({ force: true, silent: true }),
        manualImportJsonEl && (manualImportJsonEl['value'] = ''),
        run4(),
        value6['showToast']?.(trDreamina('importedSyncing'), 'success'));
    } catch (error4) {
      value6['showToast']?.(error4?.['message'] || trDreamina('importFailed'), 'error');
    }
  }
  function run25(enabled20, error5 = {}) {
    enabled11['qrImageLoadError'] = !!enabled20;
    if (enabled20) {
      ((enabled11['lastQrImageErrorAt'] = Date['now']()),
        (enabled11['lastQrImageErrorMessage'] =
          String(error5?.['message'] || '')['trim']() || trDreamina('qrLoadFailed')));
      return;
    }
    ((enabled11['lastQrImageLoadedAt'] = Date['now']()),
      (enabled11['lastQrImageErrorAt'] = 0),
      (enabled11['lastQrImageErrorMessage'] = ''));
  }
  function run26(enabled21, value38, enabled22 = {}) {
    if (!enabled21) return false;
    const withCacheBust2 = !!enabled22?.['withCacheBust'],
      enabled23 = run9(value38, { withCacheBust: withCacheBust2 });
    if (!enabled23) return false;
    const value39 = String(enabled21['getAttribute']('src') || '')['trim']();
    if (!withCacheBust2 && value39 === enabled23) return false;
    return (
      (enabled11['lastQrImageUrl'] = enabled23),
      (enabled11['lastQrImageRequestedAt'] = Date['now']()),
      (enabled11['qrImageLoadError'] = false),
      (enabled11['lastQrImageErrorMessage'] = ''),
      (enabled21['src'] = enabled23),
      true
    );
  }
  function run27(el) {
    if (!el || enabled11['qrImageListenersBound']) return;
    (el['addEventListener']('load', () => {
      (run25(false), enabled11['lastStatus'] && run28(enabled11['lastStatus']));
    }),
      el['addEventListener']('error', () => {
        (run25(true, { message: trDreamina('qrLoadFailed') }),
          enabled11['lastStatus'] && run28(enabled11['lastStatus']));
      }),
      (enabled11['qrImageListenersBound'] = true));
  }
  function run29(value40) {
    const count4 = Number(value40?.['startedAt'] || 0);
    if (count4 <= 0) return 0;
    const count5 = Number(value40?.['completedAt'] || 0),
      value41 = count5 > 0 ? count5 : Date['now']();
    return Math['max'](0, value41 - count4);
  }
  function run30(value42) {
    const enabled24 = value42?.['runtime'] || {};
    if (!enabled24?.['active']) return false;
    const value43 = String(enabled24?.['phase'] || '');
    if (!['preparing', 'starting']['includes'](value43)) return false;
    return run29(enabled24) >= value7;
  }
  async function run18(value44) {
    const enabled25 = String(value44 || '');
    if (!enabled25) return false;
    try {
      if (navigator?.['clipboard']?.['writeText'])
        return (await navigator['clipboard']['writeText'](enabled25), true);
    } catch (value45) {}
    try {
      const el2 = settingsCardEl['createElement']('textarea');
      ((el2['value'] = enabled25),
        el2['setAttribute']('readonly', 'readonly'),
        (el2['style']['position'] = 'fixed'),
        (el2['style']['left'] = '-9999px'),
        settingsCardEl['body']?.['appendChild'](el2),
        el2['select']());
      const enabled26 = settingsCardEl['execCommand']('copy');
      return (el2['remove'](), !!enabled26);
    } catch (value46) {
      return false;
    }
  }
  function run31(enabled27) {
    if (!enabled27 || typeof enabled27 !== 'object') return trDreamina('creditPlaceholder');
    const total = Number(enabled27['total_credit'] || 0),
      vip = Number(enabled27['vip_credit'] || 0),
      gift = Number(enabled27['gift_credit'] || 0),
      purchase = Number(enabled27['purchase_credit'] || 0);
    return trDreamina('creditTotal', {
      total: total,
      vip: vip,
      gift: gift,
      purchase: purchase,
    });
  }
  function run32(value47) {
    const value48 = String(value47?.['phase'] || ''),
      count6 = Number(value47?.['completedAt'] || 0),
      enabled28 = count6 > 0 ? value48 + ':' + count6 + ':' + (value47?.['error'] || '') : '';
    if (!enabled28 || enabled28 === enabled11['lastToastKey']) return;
    enabled11['lastToastKey'] = enabled28;
    if (value48 === 'success') {
      value6['showToast']?.(trDreamina('loginSuccess'), 'success');
      return;
    }
    if (value48 === 'reused') {
      value6['showToast']?.(trDreamina('loginReused'), 'info');
      return;
    }
    value48 === 'failed' && value6['showToast']?.(value47?.['error'] || trDreamina('loginFailed'), 'error');
  }
  function run33(enabled29) {
    const enabled30 = enabled29?.['runtime'] || {},
      value49 = !!enabled29?.['loggedIn'],
      value50 = !!enabled30?.['active'],
      value51 = String(enabled30?.['phase'] || '');
    if (value50 && value51 === 'preparing') return trDreamina('statusPreparing');
    if (value50 && ['oauth_ready', 'polling']['includes'](value51)) return trDreamina('statusWaitingAuth');
    if (value50) return trDreamina('statusLoggingIn');
    if (value49) return trDreamina('statusLoggedIn');
    return trDreamina('statusLoggedOut');
  }
  function run34(value52) {
    return getDreaminaStatusSessionKey(value52);
  }
  function run35(value53) {
    reconcileDreaminaSessionUiState(value53, enabled11) && run7();
  }
  function run36() {
    enabled11['modalCloseTimer'] &&
      (clearTimeout(enabled11['modalCloseTimer']), (enabled11['modalCloseTimer'] = null));
  }
  function run37({ clearDismissed: clearDismissed = false } = {}) {
    const { modalOverlayEl: modalOverlayEl } = run();
    if (!modalOverlayEl) return;
    (run36(), clearDismissed && (enabled11['dismissedSessionKey'] = ''), (modalOverlayEl['hidden'] = false));
  }
  function run2({ force: force = false, rememberDismissal: rememberDismissal = true } = {}) {
    const {
      modalOverlayEl: modalOverlayEl2,
      modalQrImageEl: modalQrImageEl,
      manualImportJsonEl: manualImportJsonEl2,
    } = run();
    run36();
    if (rememberDismissal) {
      const value54 = run34(enabled11['lastStatus']);
      value54 && (enabled11['dismissedSessionKey'] = value54);
    }
    if (modalOverlayEl2) modalOverlayEl2['hidden'] = true;
    if (modalQrImageEl) modalQrImageEl['removeAttribute']('src');
    if (manualImportJsonEl2) manualImportJsonEl2['value'] = '';
    ((enabled11['manualGuideOpen'] = false), run15(enabled11['lastStatus'] || {}));
  }
  function run38(value55 = 0) {
    (run36(),
      (enabled11['modalCloseTimer'] = setTimeout(
        () => {
          run2({ force: true, rememberDismissal: false });
        },
        Math['max'](0, Number(value55) || 0),
      )));
  }
  function run39(value56) {
    const value57 = value56?.['runtime'] || {},
      value58 = String(value57?.['phase'] || ''),
      value59 = ['oauth', 'web', 'headless']['includes'](String(value57?.['loginMode'] || '')),
      value60 = run30(value56),
      value61 = run10(value56),
      value62 = run12(value56);
    if (value62) return trDreamina('waitBrowserFailed');
    if (shouldDreaminaManualGuideOpenByDefault(value56, enabled11['dismissedSessionKey']))
      return trDreamina('waitOpenAuth');
    if (value60) return trDreamina('waitPendingTooLong');
    if (value61) return trDreamina('waitQrDeprecated');
    if (value58 === 'failed') return trDreamina('waitFailed');
    if (value58 === 'oauth_ready' || value58 === 'polling') return trDreamina('waitConfirm');
    if (value58 === 'qr_ready') return trDreamina('waitUseOAuth');
    if (value58 === 'success' || value58 === 'reused') return trDreamina('waitDone');
    if (value59) return trDreamina('waitOAuthPreparing');
    return trDreamina('waitPreparing');
  }
  function run28(error6) {
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
    } = run();
    if (!modalMessageEl) return;
    const error7 = error6?.['runtime'] || {},
      value63 = !!error7?.['active'],
      value64 = String(error7?.['phase'] || ''),
      value65 = !!error6?.['loggedIn'],
      enabled31 = ['oauth', 'web', 'headless']['includes'](String(error7?.['loginMode'] || '')),
      value66 = run30(error6),
      enabled32 = !enabled31 && !!error7?.['qrAvailable'] && value64 === 'qr_ready',
      value67 = run10(error6),
      value68 = run12(error6),
      enabled33 = value65 || ['success', 'reused', 'done']['includes'](value64);
    enabled33 && (enabled11['manualGuideOpen'] = false);
    !enabled33 && value68 && (enabled11['manualGuideOpen'] = true);
    const enabled34 = run34(error6),
      shouldDreaminaManualGuideOpenByDefault2 = shouldDreaminaManualGuideOpenByDefault(
        error6,
        enabled11['dismissedSessionKey'],
      );
    !enabled33 && shouldDreaminaManualGuideOpenByDefault2 && (enabled11['manualGuideOpen'] = true);
    const value69 =
      enabled11['manualGuideOpen'] ||
      ((value63 || enabled32) && (!!enabled34 ? enabled11['dismissedSessionKey'] !== enabled34 : true));
    if (value69) run37();
    else
      ['success', 'reused', 'failed', 'done']['includes'](value64)
        ? run38(value64 === 'failed' ? 0 : 600)
        : run2({ force: true, rememberDismissal: false });
    (modalCardEl &&
      modalCardEl['classList']['toggle']('dreamina-login-modal--guide-open', !!enabled11['manualGuideOpen']),
      modalMessageEl &&
        (modalMessageEl['textContent'] = enabled33
          ? trDreamina('modalSynced')
          : value68
            ? trDreamina('modalBrowserFailed')
            : shouldDreaminaManualGuideOpenByDefault2
              ? trDreamina('modalOAuthStarted')
              : value66
                ? trDreamina('modalPendingTooLong')
                : value67
                  ? trDreamina('modalQrAbnormal')
                  : value64 === 'failed'
                    ? trDreamina('modalRetryAuth')
                    : value64 === 'oauth_ready' || value64 === 'polling'
                      ? trDreamina('modalAuthorizeOnPage')
                      : enabled32
                        ? trDreamina('modalScanQr')
                        : String(error7?.['message'] || '')['trim']() ||
                          String(error6?.['message'] || '')['trim']() ||
                          trDreamina('modalProcessing')),
      modalWaitTextEl && (modalWaitTextEl['textContent'] = run39(error6)),
      modalWaitEl && (modalWaitEl['hidden'] = false),
      modalQrWrapEl && (modalQrWrapEl['hidden'] = !enabled32),
      modalQrImageEl2 &&
        (enabled32 ? run26(modalQrImageEl2, error7) : modalQrImageEl2['removeAttribute']('src')),
      modalCloseEl && (modalCloseEl['disabled'] = false),
      modalRetryEl &&
        ((modalRetryEl['hidden'] = false),
        (modalRetryEl['disabled'] = false),
        enabled11['manualGuideOpen']
          ? (modalRetryEl['textContent'] = trDreamina('guideCollapse'))
          : (modalRetryEl['textContent'] = value68 ? trDreamina('guideRecommended') : trDreamina('guide'))),
      manualGuideEl2 && run15(error6));
  }
  function run24(error8) {
    const {
      statusTextEl: statusTextEl,
      messageTextEl: messageTextEl,
      creditTextEl: creditTextEl,
      btnAuthEl: btnAuthEl,
      btnQrAuthEl: btnQrAuthEl,
      btnLogoutEl: btnLogoutEl,
    } = run();
    if (!statusTextEl) return;
    if (!syncDevVisibility()) return;
    const error9 = error8?.['runtime'] || {},
      enabled35 = !!error8?.['loggedIn'],
      value70 = !!error9?.['active'],
      value71 = String(error9?.['phase'] || ''),
      value72 =
        String(error9?.['message'] || '')['trim']() ||
        String(error8?.['message'] || '')['trim']() ||
        trDreamina('notLoggedInHint');
    statusTextEl['textContent'] = run33(error8);
    messageTextEl && (messageTextEl['textContent'] = value72);
    creditTextEl &&
      (creditTextEl['textContent'] = enabled35 ? run31(error8?.['credit']) : trDreamina('creditPlaceholder'));
    btnAuthEl &&
      ((btnAuthEl['disabled'] = false), (btnAuthEl['textContent'] = getDreaminaWebLoginButtonText(error8)));
    btnQrAuthEl &&
      ((btnQrAuthEl['hidden'] = true),
      (btnQrAuthEl['disabled'] = true),
      (btnQrAuthEl['textContent'] = getDreaminaQrLoginButtonText(error8)));
    btnLogoutEl && (btnLogoutEl['disabled'] = value70 || !enabled35);
    if (value70) run4();
    else run3();
    ((enabled11['lastStatus'] = error8), run35(error8), run28(error8), run32(error9));
  }
  async function refreshStatus({ force: force = false, silent: silent = false } = {}) {
    if (!syncDevVisibility()) return null;
    if (typeof fetchDreaminaCliStatusFromServer !== 'function') return null;
    const value73 = ++enabled11['statusRequestGeneration'];
    try {
      const value74 = await fetchDreaminaCliStatusFromServer({ refresh: force });
      if (value73 !== enabled11['statusRequestGeneration']) return value74 || {};
      return (run24(value74 || {}), value74 || {});
    } catch (error10) {
      if (value73 !== enabled11['statusRequestGeneration']) return null;
      if (!silent) {
        const value75 = error10?.['message'] || trDreamina('fetchStatusFailed');
        value6['showToast']?.(value75, 'error');
      }
      return null;
    }
  }
  async function run6({ silent: silent = false } = {}) {
    if (!syncDevVisibility()) return null;
    if (typeof fetchDreaminaCliLoginRuntimeFromServer !== 'function')
      return refreshStatus({ silent: silent });
    try {
      const enabled36 = await fetchDreaminaCliLoginRuntimeFromServer(),
        value76 = String(enabled36?.['phase'] || ''),
        value77 =
          value76 === 'idle' &&
          !enabled36?.['active'] &&
          !Number(enabled36?.['startedAt'] || 0) &&
          Number(enabled11['loginLaunchRequestedAt'] || 0) > 0;
      if (value77) return enabled11['lastStatus'] || null;
      const dreaminaLoginRuntimeStatus = mergeDreaminaLoginRuntimeStatus(
        enabled11['lastStatus'] || {},
        enabled36 || {},
      );
      run24(dreaminaLoginRuntimeStatus);
      const value78 = ['success', 'reused', 'done']['includes'](value76),
        value79 = value78 || value76 === 'failed';
      if (value79) enabled11['loginLaunchRequestedAt'] = 0;
      return (
        value78 && refreshStatus({ force: true, silent: true })['catch'](() => {}),
        dreaminaLoginRuntimeStatus
      );
    } catch (error11) {
      if (!silent) {
        const value80 = error11?.['message'] || trDreamina('fetchStatusFailed');
        value6['showToast']?.(value80, 'error');
      }
      return null;
    }
  }
  async function run40() {
    if (!syncDevVisibility()) return;
    const value81 = enabled11['lastStatus']?.['runtime'] || {};
    if (value81?.['active']) {
      (run37({ clearDismissed: true }),
        (enabled11['manualGuideOpen'] = true),
        run28(enabled11['lastStatus'] || {}));
      return;
    }
    const force2 = !!enabled11['lastStatus']?.['loggedIn'];
    if (typeof startDreaminaWebLoginFromServer !== 'function') return;
    ((enabled11['manualGuideOpen'] = true),
      (enabled11['loginLaunchRequestedAt'] = Date['now']()),
      run37({ clearDismissed: true }));
    try {
      const response2 = await startDreaminaWebLoginFromServer({ force: force2 });
      if (response2?.['success'] === false)
        throw new Error(response2?.['message'] || trDreamina('startFailed'));
      ((enabled11['manualGuideOpen'] = true),
        response2?.['status'] && run24(response2['status']),
        value6['showToast']?.(force2 ? trDreamina('reloginStarted') : trDreamina('loginStarted'), 'info'),
        run4());
    } catch (error12) {
      value6['showToast']?.(error12?.['message'] || trDreamina('startFailed'), 'error');
    }
  }
  async function run41() {
    await run40();
  }
  function run42() {
    ((enabled11['manualGuideOpen'] = !enabled11['manualGuideOpen']), run28(enabled11['lastStatus'] || {}));
  }
  async function run43() {
    if (!syncDevVisibility()) return;
    if (typeof logoutDreaminaFromServer !== 'function') return;
    try {
      const response3 = await logoutDreaminaFromServer();
      if (response3?.['success'] === false)
        throw new Error(response3?.['message'] || trDreamina('logoutFailed'));
      (response3?.['status']
        ? run24(response3['status'])
        : await refreshStatus({ force: true, silent: true }),
        run3(),
        value6['showToast']?.(trDreamina('loggedOut'), 'success'));
    } catch (error13) {
      value6['showToast']?.(error13?.['message'] || trDreamina('logoutFailed'), 'error');
    }
  }
  function init() {
    const {
      btnAuthEl: btnAuthEl2,
      btnQrAuthEl: btnQrAuthEl2,
      btnLogoutEl: btnLogoutEl2,
      modalOverlayEl: modalOverlayEl3,
      modalCloseEl: modalCloseEl2,
      modalQrImageEl: modalQrImageEl3,
      modalRetryEl: modalRetryEl2,
      manualOpenAuthEl: manualOpenAuthEl2,
      manualCopyAuthEl: manualCopyAuthEl2,
      manualImportJsonBtnEl: manualImportJsonBtnEl,
    } = run();
    (run27(modalQrImageEl3),
      btnAuthEl2?.['addEventListener']('click', () => {
        run40()['catch'](() => {});
      }),
      btnQrAuthEl2?.['addEventListener']('click', () => {
        run41()['catch'](() => {});
      }),
      btnLogoutEl2?.['addEventListener']('click', () => {
        run43()['catch'](() => {});
      }),
      modalCloseEl2?.['addEventListener']('click', () => {
        run2({ force: true });
      }),
      modalRetryEl2?.['addEventListener']('click', () => {
        run42();
      }),
      manualOpenAuthEl2?.['addEventListener']('click', () => {
        run20()['catch'](() => {});
      }),
      manualCopyAuthEl2?.['addEventListener']('click', () => {
        run21()['catch'](() => {});
      }),
      manualImportJsonBtnEl?.['addEventListener']('click', () => {
        run23()['catch'](() => {});
      }),
      modalOverlayEl3?.['addEventListener']('click', (event) => {
        if (event['target'] !== modalOverlayEl3) return;
        run2();
      }),
      settingsCardEl['addEventListener']('keydown', (event2) => {
        if (event2['key'] !== 'Escape') return;
        run2();
      }));
    if (settingsCardEl['body']) {
      const mutationObserver = new MutationObserver(() => {
        const value82 = syncDevVisibility();
        value82 && refreshStatus({ force: true, silent: true })['catch'](() => {});
      });
      (enabled11['observer']?.['disconnect']?.(),
        (enabled11['observer'] = mutationObserver),
        mutationObserver['observe'](settingsCardEl['body'], {
          attributes: true,
          attributeFilter: ['class'],
        }));
    }
  }
  const value83 = (value84) => {
    value84['detail']?.['provider'] === 'dreamina' &&
      ['installed', 'missing']['includes'](value84['detail']['phase']) &&
      refreshStatus({ force: true, silent: true })['catch'](() => {});
  };
  return (
    globalThis['window']?.['addEventListener']?.(CLI_COMPONENT_CHANGED, value83),
    {
      destroy() {
        (globalThis['window']?.['removeEventListener']?.(CLI_COMPONENT_CHANGED, value83),
          (enabled11['statusRequestGeneration'] += 1),
          run3(),
          run36(),
          enabled11['observer']?.['disconnect']?.(),
          (enabled11['observer'] = null));
      },
      init: init,
      refreshStatus: refreshStatus,
      syncDevVisibility: syncDevVisibility,
    }
  );
}
