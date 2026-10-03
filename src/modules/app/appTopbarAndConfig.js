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
function trTemplate(_0x57eba7, _0x344c47 = {}) {
  let _0x2f6155 = t(_0x57eba7);
  return (
    Object.entries(_0x344c47 || {}).forEach(([_0x434ce2, _0x32f978]) => {
      _0x2f6155 = _0x2f6155.split('{' + _0x434ce2 + '}').join(String(_0x32f978 ?? ''));
    }),
    _0x2f6155
  );
}
function trApiInput(_0x49883d, _0x1c7567 = {}) {
  return trTemplate('settings.apiInput.' + _0x49883d, _0x1c7567);
}
function trDreamina(_0x5c1d85, _0x4dc752 = {}) {
  return trTemplate(DREAMINA_I18N_PREFIX + '.' + _0x5c1d85, _0x4dc752);
}
function normalizeDreaminaManualUrlCandidate(_0x1def27) {
  const _0x80ce81 = String(_0x1def27 || '').trim();
  if (!_0x80ce81) return '';
  const _0x26d542 = _0x80ce81
    .replace(/^[<（(【\["'“‘]+/, '')
    .replace(/[>）)】\]"'”’]+$/, '')
    .replace(/[，。；;、]+$/, '');
  return /^https?:\/\//.test(_0x26d542) ? _0x26d542 : '';
}
export function extractDreaminaManualLinksFromOutputLines(_0x1d4a0e) {
  const _0x217515 = Array.isArray(_0x1d4a0e) ? _0x1d4a0e : [],
    _0x4e837f = [];
  let _0x3dc5de = '';
  _0x217515.forEach((_0x9d9580) => {
    const _0x1e2ca2 = String(_0x9d9580 || '');
    if (!_0x3dc5de && _0x1e2ca2.includes('请在浏览器中打开以下链接')) _0x3dc5de = '__PENDING__';
    else _0x3dc5de === '__PENDING__' && (_0x3dc5de = _0x1e2ca2.trim());
    const _0x9dbb0e = _0x1e2ca2.match(/https?:\/\/[^\s]+/g);
    if (!_0x9dbb0e) return;
    _0x9dbb0e.forEach((_0x368221) => {
      const _0x3e2c1a = normalizeDreaminaManualUrlCandidate(_0x368221);
      if (_0x3e2c1a && !_0x4e837f.includes(_0x3e2c1a)) _0x4e837f.push(_0x3e2c1a);
    });
  });
  const _0xdb684c =
      _0x3dc5de && _0x3dc5de !== '__PENDING__' ? normalizeDreaminaManualUrlCandidate(_0x3dc5de) : '',
    _0x2ef472 =
      _0xdb684c ||
      _0x4e837f.find((_0x26a135) => _0x26a135.includes('/passport/web_login')) ||
      _0x4e837f.find((_0x4c85ee) => _0x4c85ee.includes('/passport/web/web_login')) ||
      '',
    _0xd8c29 = _0x4e837f.find((_0x375f2c) => _0x375f2c.includes('/dreamina/cli/v1/dreamina_cli_login')) || '',
    _0x16b34c = _0xd8c29 || _0x4e837f.find((_0x561990) => _0x561990 !== DREAMINA_LOGIN_PAGE_URL) || '';
  return {
    authorizeUrl: _0xd8c29 || _0x2ef472 || _0x16b34c || '',
    strictAuthorizeUrl: _0x2ef472,
    callbackUrl: _0xd8c29,
  };
}
export function getDreaminaWebLoginButtonText(_0x43a814) {
  const _0x2bac9d = _0x43a814?.runtime || {},
    _0x427dfa = !!_0x43a814?.loggedIn,
    _0x46db1a = !!_0x2bac9d?.active;
  if (_0x46db1a) return trDreamina('viewLogin');
  return _0x427dfa ? trDreamina('relogin') : trDreamina('login');
}
export function getDreaminaQrLoginButtonText(_0x3b4640) {
  const _0x5206e6 = _0x3b4640?.runtime || {},
    _0x4bcc6f = !!_0x5206e6?.active;
  if (_0x4bcc6f) return trDreamina('viewLogin');
  return trDreamina('login');
}
export function getDreaminaStatusSessionKey(_0x10d831) {
  const _0x4b3d53 = _0x10d831?.runtime || {},
    _0x104225 = Number(_0x4b3d53?.startedAt || 0);
  if (_0x104225 > 0) return 'login:' + _0x104225;
  const _0x217759 = Number(_0x4b3d53?.qrVersion || 0);
  if (_0x217759 > 0) return 'qr:' + _0x217759;
  return '';
}
export function shouldDreaminaManualGuideOpenByDefault(_0x4bc349, _0x102040 = '') {
  const _0xb35cd2 = _0x4bc349?.runtime || {},
    _0x3ee7a2 = String(_0xb35cd2?.loginMode || '');
  if (!_0xb35cd2?.active || !['oauth', 'web', 'headless'].includes(_0x3ee7a2)) return false;
  const _0x3036cd = getDreaminaStatusSessionKey(_0x4bc349);
  return !_0x3036cd || String(_0x102040 || '') !== _0x3036cd;
}
export function shouldAutoOpenDreaminaWebAuthLink(_0x5d2230, _0x44967a = {}, _0x9f8794 = Date.now()) {
  const _0xe98f02 = _0x5d2230?.runtime || {},
    _0xcab2ea = String(_0xe98f02?.loginMode || ''),
    _0xf98a59 = String(_0xe98f02?.authorizeUrl || '').trim(),
    _0x36c023 = String(_0xe98f02?.loginPageUrl || '').trim(),
    _0x3a3e10 = String(_0xe98f02?.phase || ''),
    _0x4ac945 = !!_0x5d2230?.loggedIn || ['success', 'reused', 'done'].includes(_0x3a3e10),
    _0x5701b6 = Number(_0x44967a?.webLoginPrimedAt || 0),
    _0x56535f = String(_0x44967a?.autoOpenedManualAuthUrl || '').trim();
  if (!['oauth', 'web', 'headless'].includes(_0xcab2ea) || !_0xe98f02?.active || _0x4ac945) return false;
  if (!_0xf98a59 || _0xf98a59 === _0x36c023) return false;
  if (_0x56535f === _0xf98a59) return false;
  if (_0x5701b6 <= 0) return false;
  return Math.max(0, Number(_0x9f8794 || 0) - _0x5701b6) >= 0x9c4;
}
export function createAppTopbarAndConfig({
  store: _0x215acf,
  fetchApiConfigFromServer: _0x5ae271,
  saveApiConfigToServer: _0x5bc7d1,
  testProviderConnections: _0x581697,
  fetchDreaminaCliStatusFromServer: _0x20929e,
  startDreaminaHeadlessLoginFromServer: _0x3d4c8c,
  startDreaminaHeadlessReloginFromServer: _0x5beec2,
  startDreaminaWebLoginFromServer: _0x5c254a,
  importDreaminaLoginResponseFromServer: _0x57c009,
  logoutDreaminaFromServer: _0x36ac1f,
  buildDreaminaQrImageUrl: _0x14cf38,
  refreshManifestModelNodeUis: _0x5f0a11,
  showError: _0xf820b9,
} = {}) {
  const _0x2bdde1 = 85 * 0x3e8,
    _0x3e0739 = {
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
  let _0x43d0f1 = {};
  // 'agnes-domestic' 是独立厂商（域名与密钥都与国际版不同），必须在这里登记，
  // 否则它的密钥输入框既不会回填也不会被保存。
  const _0x1e2cbf = [
      'grsai',
      'openai',
      'ppio',
      'apimart',
      'agnes-domestic',
      'agnes',
      'volcengine',
      'runninghub',
    ],
    _0x5d49f2 = [
      'settings-provider-status--testing',
      'settings-provider-status--success',
      'settings-provider-status--partial',
      'settings-provider-status--danger',
    ];
  let _0x41e853 = null,
    _0x273e6c = null;
  // ── 厂商模型清单：从接口拉取、勾选、动态登记 ─────────────────────────────
  // 内置清单只覆盖已适配的模型；厂商新增模型时，在这里拉一次真实列表即可选用。
  const _0x4c7a19 = createProviderModelCatalogBundleRegistry();
  function _0x2f9d13(_0x11e0a5 = _0x43d0f1) {
    try {
      return _0x4c7a19.sync(collectEnabledVendorModels(_0x11e0a5));
    } catch (_0x1c3d5e) {
      console.warn('[Provider Model Catalog] sync failed:', _0x1c3d5e);
      return { changed: false, registered: 0 };
    }
  }
  function _0x5a7c9e(_0x2b1e0c, _0x3f5c1d = {}) {
    const _0x3d0f2a = readProviderModelCatalog(_0x43d0f1?.providers?.[_0x2b1e0c] || {}),
      _0x1a2f7f = _0x3f5c1d.statusText ?? '';
    return renderProviderModelCatalogPanel({
      documentObject: document,
      providerId: _0x2b1e0c,
      catalog: _0x3d0f2a,
      statusText:
        _0x1a2f7f ||
        (_0x3d0f2a.models.length ? trApiInput('models.count', { count: _0x3d0f2a.models.length }) : ''),
      message: _0x3f5c1d.message || '',
      messageKind: _0x3f5c1d.messageKind || 'info',
    });
  }
  function _0x5c1f8b(_0x2f0e57) {
    const _0x3c9a1b = readProviderModelCatalogSelection(document, _0x2f0e57);
    if (_0x3c9a1b.length === 0) return false;
    const _0x4f0d69 = String(_0x2f0e57 || '').trim();
    _0x43d0f1.providers = _0x43d0f1.providers || {};
    _0x43d0f1.providers[_0x4f0d69] = applyProviderModelCatalog(_0x43d0f1.providers[_0x4f0d69], {
      fetchedAt: new Date().toISOString(),
      models: _0x3c9a1b.map((_0x4d2f1a) => ({
        id: _0x4d2f1a.id,
        kind: _0x4d2f1a.kind || inferProviderModelKind(_0x4f0d69, _0x4d2f1a.id),
        enabled: _0x4d2f1a.enabled,
      })),
    });
    return true;
  }
  async function _0x1e5a76(_0x2f0e57, _0x5d3a91 = null) {
    const _0x1a2cbe = String(_0x2f0e57 || '').trim();
    if (!isProviderModelCatalogProvider(_0x1a2cbe)) return false;
    const _0x3b1d0e = document.getElementById('providerKey-' + _0x1a2cbe),
      _0x2210af = String(_0x3b1d0e?.value || '')
        .trim()
        .replace(/^Bearer\s+/i, '');
    if (!_0x2210af) {
      (window.showToast?.(trApiInput('models.needKey'), 'warn'), _0x3b1d0e?.focus?.());
      return false;
    }
    if (_0x5d3a91) _0x5d3a91.disabled = true;
    _0x5a7c9e(_0x1a2cbe, {
      statusText: trApiInput('models.fetching'),
      message: trApiInput('models.fetching'),
    });
    try {
      const _0x4f7a1c = _0x43d0f1?.providers?.[_0x1a2cbe] || {},
        _0x5fb8a5 = await fetchProviderModelList({
          providerId: _0x1a2cbe,
          apiUrl: _0x4f7a1c.apiUrl,
          apiKey: _0x2210af,
        });
      if (!_0x5fb8a5.success) {
        _0x5a7c9e(_0x1a2cbe, {
          statusText: '',
          message: trApiInput('models.failed') + '：' + _0x5fb8a5.error,
          messageKind: 'error',
        });
        return false;
      }
      if (_0x5fb8a5.models.length === 0) {
        _0x5a7c9e(_0x1a2cbe, {
          statusText: '',
          message: trApiInput('models.empty'),
          messageKind: 'error',
        });
        return false;
      }
      // 拉取只刷新候选清单，不改动已勾选状态；写入配置由“保存选择”完成。
      const _0x1f9d5f = mergeProviderModelCatalog(
        _0x1a2cbe,
        readProviderModelCatalog(_0x4f7a1c).models,
        _0x5fb8a5.models,
      );
      renderProviderModelCatalogPanel({
        documentObject: document,
        providerId: _0x1a2cbe,
        catalog: { fetchedAt: new Date().toISOString(), models: _0x1f9d5f },
        statusText: trApiInput('models.count', { count: _0x1f9d5f.length }),
      });
      return true;
    } finally {
      if (_0x5d3a91) _0x5d3a91.disabled = false;
    }
  }
  async function _0x4b8e2c(_0x2f0e57) {
    const _0x1a2cbe = String(_0x2f0e57 || '').trim();
    if (!isProviderModelCatalogProvider(_0x1a2cbe)) return false;
    if (!_0x5c1f8b(_0x1a2cbe)) return false;
    const _0x70211a = _0x5b6f5b(),
      _0x211510 = await _0x5bc7d1(_0x70211a);
    if (!_0x211510?.success && _0x211510?.error) {
      window.showToast?.(
        trApiInput('diagnostics.saveFailed', { error: _0x211510.error }),
        'error',
      );
      return false;
    }
    _0x43d0f1 = _0x70211a;
    const _0x2c1c9a = _0x2f9d13(_0x43d0f1);
    _0x5f0a11?.();
    const _0x3d0f2a = readProviderModelCatalog(_0x43d0f1?.providers?.[_0x1a2cbe] || {}),
      // 只有“该模态还没适配”才算需要手动接入；已内置的模型被跳过是正常的。
      _0x5a3f1c = (_0x2c1c9a?.skipped || []).filter((_0x5b0f1e) =>
        String(_0x5b0f1e?.reason || '').startsWith('no-template'),
      ).length;
    _0x5a7c9e(_0x1a2cbe, {
      statusText: trApiInput('models.count', { count: _0x3d0f2a.models.length }),
      message:
        trApiInput('models.saved') +
        (_0x2c1c9a?.registered ? '（新增 ' + _0x2c1c9a.registered + ' 个）' : '') +
        (_0x5a3f1c ? '（' + _0x5a3f1c + ' 个该模态暂未适配）' : ''),
      messageKind: 'success',
    });
    _0x3751c3({ force: true, silent: true }).catch(() => {});
    return true;
  }
  function _0x5ef8ff() {
    return Array.from(document.querySelectorAll('[data-apimart-route]'));
  }
  function _0x526645(_0xeaa331, _0x2a87dd = false) {
    const _0x365864 = document.getElementById('providerRouteUrl-apimart');
    if (!_0x365864) return;
    const _0x45dca4 = String(_0xeaa331 || getApimartApiUrlForRoute(DEFAULT_APIMART_ROUTE_ID)).trim();
    _0x365864.textContent = _0x2a87dd ? trApiInput('route.custom', { value: _0x45dca4 }) : _0x45dca4;
  }
  function _0xb6a5a8() {
    const _0x4d6bc1 = _0x5ef8ff().find((_0x1a5554) => _0x1a5554.classList.contains('is-active')),
      _0x228280 = String(_0x4d6bc1?.dataset?.apimartRoute || '').trim();
    return _0x228280 ? getApimartRouteById(_0x228280) : null;
  }
  function _0x55ee8d(_0x5dfbee, _0x53ee0c = {}) {
    const _0x5f2cee = String(_0x5dfbee || '').trim(),
      _0x2f8c39 = _0x5f2cee ? getApimartRouteById(_0x5f2cee) : null,
      _0x5d332d = String(_0x53ee0c?.customUrl || '').trim();
    (_0x5ef8ff().forEach((_0x76b99) => {
      const _0x52fdc0 = !!_0x2f8c39 && String(_0x76b99.dataset.apimartRoute || '') === _0x2f8c39.id;
      (_0x76b99.classList.toggle('is-active', _0x52fdc0),
        _0x76b99.setAttribute('aria-pressed', _0x52fdc0 ? 'true' : 'false'));
    }),
      _0x526645(_0x2f8c39?.apiUrl || _0x5d332d, !!_0x5d332d && !_0x2f8c39));
  }
  function _0x4edacd(_0xf4591c = {}) {
    const _0x4ef45a = String(_0xf4591c?.apiUrl || '').trim(),
      _0x55f2ec = resolveApimartRouteByApiUrl(_0x4ef45a);
    if (_0x55f2ec) {
      _0x55ee8d(_0x55f2ec.id);
      return;
    }
    const _0x3bbb5a = _0xf4591c?.routeId ? getApimartRouteById(_0xf4591c.routeId) : null;
    if (_0x3bbb5a && !_0x4ef45a) {
      _0x55ee8d(_0x3bbb5a.id);
      return;
    }
    if (_0x4ef45a) {
      _0x55ee8d('', { customUrl: _0x4ef45a });
      return;
    }
    _0x55ee8d(DEFAULT_APIMART_ROUTE_ID);
  }
  function _0x4eb253(_0x2e8fe3 = {}) {
    const _0x374708 = _0x2e8fe3 && typeof _0x2e8fe3 === 'object' ? { ..._0x2e8fe3 } : {},
      _0x100da5 = _0xb6a5a8();
    if (_0x100da5) ((_0x374708.routeId = _0x100da5.id), (_0x374708.apiUrl = _0x100da5.apiUrl));
    else _0x374708.apiUrl && delete _0x374708.routeId;
    return _0x374708;
  }
  function _0x484950() {
    const _0x465d0d = document.getElementById('projectNameText');
    _0x465d0d &&
      (_0x465d0d.addEventListener('keydown', (_0x2403b9) => {
        _0x2403b9.key === 'Enter' && (_0x2403b9.preventDefault(), _0x465d0d.blur());
      }),
      _0x465d0d.addEventListener('click', () => {
        _0x465d0d.focus();
      }));
    const _0x296f1d = document.getElementById('userAvatar'),
      _0x4cccea = document.getElementById('avatarMenu');
    _0x296f1d &&
      _0x4cccea &&
      registerSidebarSubmenu({
        key: 'settings',
        button: _0x296f1d,
        panel: _0x4cccea,
        openClass: 'open',
        isOpen: () => _0x4cccea.classList.contains('open'),
      });
  }
  function _0x3235d6() {
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
  function _0xad0f78() {
    const { settingsCardEl: _0x34b08e } = _0x3235d6();
    if (!_0x34b08e) return false;
    const _0x2aea66 = true;
    return (
      (_0x34b08e.hidden = !_0x2aea66),
      !_0x2aea66 && (_0x53182e({ force: true, rememberDismissal: false }), _0xd65feb()),
      _0x2aea66
    );
  }
  function _0xd65feb() {
    _0x3e0739.pollTimer && (clearInterval(_0x3e0739.pollTimer), (_0x3e0739.pollTimer = null));
  }
  function _0x37a171() {
    if (_0x3e0739.pollTimer) return;
    _0x3e0739.pollTimer = setInterval(() => {
      _0x3751c3({ silent: true }).catch(() => {});
    }, 0x320);
  }
  function _0x4ac46b() {
    ((_0x3e0739.qrImageLoadError = false),
      (_0x3e0739.lastQrImageUrl = ''),
      (_0x3e0739.lastQrImageRequestedAt = 0),
      (_0x3e0739.lastQrImageLoadedAt = 0),
      (_0x3e0739.lastQrImageErrorAt = 0),
      (_0x3e0739.lastQrImageErrorMessage = ''));
  }
  function _0x5d9d2b(_0x11b6d8, _0x311f3c = Date.now()) {
    const _0x60e0cb = String(_0x11b6d8 || '').trim();
    if (!_0x60e0cb) return '';
    const _0x1675b1 = _0x60e0cb.includes('?') ? '&' : '?';
    return '' + _0x60e0cb + _0x1675b1 + 'cb=' + encodeURIComponent(String(_0x311f3c));
  }
  function _0x2d2f7c(_0x4bf6ca, { withCacheBust: withCacheBust = false } = {}) {
    const _0x4ad39a = Number(_0x4bf6ca?.qrVersion || 0),
      _0x244723 = _0x14cf38?.(_0x4ad39a || Date.now()) || '';
    if (!_0x244723) return '';
    return withCacheBust ? _0x5d9d2b(_0x244723) : _0x244723;
  }
  function _0xe9f0e(_0x5199d4) {
    const _0x1bf4bb = _0x5199d4?.runtime || {},
      _0x318b1e = String(_0x1bf4bb?.phase || ''),
      _0x2bd923 = !!_0x1bf4bb?.qrAvailable;
    return _0x318b1e === 'qr_ready' && _0x2bd923 && !!_0x3e0739.qrImageLoadError;
  }
  function _0x52c3e9(_0x29190e) {
    const _0x4c31d8 = _0x29190e?.runtime || {};
    return Array.isArray(_0x4c31d8?.outputTail) ? _0x4c31d8.outputTail : [];
  }
  function _0x12c79d(_0x507368) {
    const _0x28268c = _0x52c3e9(_0x507368);
    return _0x28268c.some((_0x1a479d) => {
      const _0x3510ad = String(_0x1a479d || '').toLowerCase();
      return (
        _0x3510ad.includes('自动打开浏览器失败') ||
        _0x3510ad.includes('open headless login page') ||
        _0x3510ad.includes('executable file not found') ||
        _0x3510ad.includes('google-chrome')
      );
    });
  }
  function _0x2f1b3a(_0x4b2667) {
    const _0x551593 = _0x4b2667?.runtime || {},
      _0x172304 = extractDreaminaManualLinksFromOutputLines(_0x52c3e9(_0x4b2667));
    return {
      ..._0x172304,
      authorizeUrl: String(_0x551593?.authorizeUrl || '').trim() || _0x172304.authorizeUrl,
      callbackUrl: String(_0x551593?.callbackUrl || '').trim() || _0x172304.callbackUrl,
    };
  }
  function _0x5c7612(_0x173f77) {
    const {
      manualLoginUrlEl: _0x595caa,
      manualOpenLoginEl: _0x2dea6b,
      manualCopyLoginEl: _0x49ea26,
      manualAuthUrlEl: _0x272c6c,
      manualOpenAuthEl: _0xdab217,
      manualCopyAuthEl: _0x15e65a,
    } = _0x3235d6();
    if (!_0x595caa || !_0x2dea6b || !_0x49ea26 || !_0x272c6c || !_0xdab217 || !_0x15e65a) return;
    const _0x33a10e = _0x2f1b3a(_0x173f77 || _0x3e0739.lastStatus || {}),
      _0x234d9b = (_0x173f77 || _0x3e0739.lastStatus || {})?.runtime || {},
      _0x71da13 = String(_0x234d9b?.userCode || '').trim();
    ((_0x595caa.value = _0x71da13 || trDreamina('waitingCode')),
      (_0x2dea6b.hidden = true),
      (_0x2dea6b.disabled = true),
      (_0x49ea26.disabled = !_0x71da13));
    const _0x1c1fa2 = String(_0x33a10e?.authorizeUrl || '').trim();
    ((_0x272c6c.value = _0x1c1fa2 || trDreamina('waitingAuthUrl')),
      (_0xdab217.disabled = !_0x1c1fa2),
      (_0x15e65a.disabled = !_0x1c1fa2));
  }
  function _0x5806ba(_0x50f462) {
    const { manualGuideEl: _0x3d90ec } = _0x3235d6();
    if (!_0x3d90ec) return;
    (_0x5c7612(_0x50f462 || _0x3e0739.lastStatus || {}), (_0x3d90ec.hidden = !_0x3e0739.manualGuideOpen));
  }
  function _0x262d1d() {
    return String(_0x3e0739.lastStatus?.runtime?.userCode || '').trim();
  }
  function _0x3f8355(_0xe7bd3e = _0x3e0739.lastStatus || {}) {
    const _0x129289 = _0x2f1b3a(_0xe7bd3e);
    return String(_0x129289?.authorizeUrl || '').trim();
  }
  async function _0xd6a377(_0x933dad, _0x291e25) {
    const _0x425aac = String(_0x933dad || '').trim();
    if (!_0x425aac)
      return (window.showToast?.(trDreamina('missingValue', { label: _0x291e25 }), 'warning'), false);
    try {
      return (await openExternalLink(_0x425aac, { label: _0x291e25 }), true);
    } catch (_0x4624a6) {}
    const _0xa32f2e = await _0x36f164(_0x425aac);
    return (
      _0xa32f2e
        ? window.showToast?.(trDreamina('browserOpenFailedCopied', { label: _0x291e25 }), 'warning')
        : window.showToast?.(trDreamina('browserOpenFailedCopyFirst', { label: _0x291e25 }), 'warning'),
      false
    );
  }
  async function _0x4ed8cb(_0x1d39f4, _0x1abd7d) {
    const _0x4d4fa9 = String(_0x1d39f4 || '').trim();
    if (!_0x4d4fa9) {
      window.showToast?.(trDreamina('missingValue', { label: _0x1abd7d }), 'warning');
      return;
    }
    const _0x1e9796 = await _0x36f164(_0x4d4fa9);
    _0x1e9796
      ? window.showToast?.(trDreamina('copySuccess', { label: _0x1abd7d }), 'success')
      : window.showToast?.(trDreamina('copyFailed', { label: _0x1abd7d }), 'error');
  }
  async function _0x4c82a5() {
    await _0x263d69();
  }
  async function _0x20e964() {
    await _0x4ed8cb(_0x262d1d(), trDreamina('codeLabel'));
  }
  async function _0x263d69() {
    await _0xd6a377(_0x3f8355(), trDreamina('authLinkLabel'));
  }
  async function _0xd6175a() {
    await _0x4ed8cb(_0x3f8355(), trDreamina('authLinkLabel'));
  }
  function _0x257f84(_0x326a5c) {
    const _0x19ba01 = String(_0x326a5c || '').trim();
    if (!_0x19ba01) throw new Error(trDreamina('jsonPasteRequired'));
    const _0x59608c = [];
    _0x59608c.push(_0x19ba01);
    const _0x265da4 = _0x19ba01.match(/```(?:json)?\s*([\s\S]*?)```/i);
    _0x265da4?.[1] && _0x59608c.push(String(_0x265da4[1]).trim());
    const _0x5d7cfc = _0x19ba01.indexOf('{'),
      _0x1bec5e = _0x19ba01.lastIndexOf('}');
    _0x5d7cfc >= 0 &&
      _0x1bec5e > _0x5d7cfc &&
      _0x59608c.push(_0x19ba01.slice(_0x5d7cfc, _0x1bec5e + 1).trim());
    for (const _0x57028d of _0x59608c) {
      if (!_0x57028d) continue;
      try {
        const _0x51eb79 = JSON.parse(_0x57028d);
        if (!_0x51eb79 || typeof _0x51eb79 !== 'object' || Array.isArray(_0x51eb79))
          throw new Error('INVALID_OBJECT');
        return _0x51eb79;
      } catch (_0x5871d2) {
        if (_0x5871d2?.message === 'INVALID_OBJECT') throw new Error(trDreamina('jsonMustBeObject'));
      }
    }
    throw new Error(trDreamina('jsonFormatInvalid'));
  }
  async function _0x7ae70b() {
    if (typeof _0x57c009 !== 'function') {
      window.showToast?.(trDreamina('jsonImportUnsupported'), 'error');
      return;
    }
    const { manualImportJsonEl: _0x4e0199 } = _0x3235d6(),
      _0x230e7a = String(_0x4e0199?.value || '');
    let _0x16174c = null;
    try {
      _0x16174c = _0x257f84(_0x230e7a);
    } catch (_0x59f2a1) {
      window.showToast?.(_0x59f2a1?.message || trDreamina('jsonParseFailed'), 'warning');
      return;
    }
    try {
      const _0x4c87fa = await _0x57c009(_0x16174c);
      if (_0x4c87fa?.success === false) throw new Error(_0x4c87fa?.message || trDreamina('importFailed'));
      (_0x4c87fa?.status ? _0x30db53(_0x4c87fa.status) : await _0x3751c3({ force: true, silent: true }),
        _0x4e0199 && (_0x4e0199.value = ''),
        _0x37a171(),
        window.showToast?.(trDreamina('importedSyncing'), 'success'));
    } catch (_0x1177e3) {
      window.showToast?.(_0x1177e3?.message || trDreamina('importFailed'), 'error');
    }
  }
  function _0x4636db(_0x96931a, _0x12376b = {}) {
    _0x3e0739.qrImageLoadError = !!_0x96931a;
    if (_0x96931a) {
      ((_0x3e0739.lastQrImageErrorAt = Date.now()),
        (_0x3e0739.lastQrImageErrorMessage =
          String(_0x12376b?.message || '').trim() || trDreamina('qrLoadFailed')));
      return;
    }
    ((_0x3e0739.lastQrImageLoadedAt = Date.now()),
      (_0x3e0739.lastQrImageErrorAt = 0),
      (_0x3e0739.lastQrImageErrorMessage = ''));
  }
  function _0x3200e4(_0x12583a, _0x488669, _0x4872d0 = {}) {
    if (!_0x12583a) return false;
    const _0x5ee3e4 = !!_0x4872d0?.withCacheBust,
      _0x59c794 = _0x2d2f7c(_0x488669, { withCacheBust: _0x5ee3e4 });
    if (!_0x59c794) return false;
    const _0x3abf87 = String(_0x12583a.getAttribute('src') || '').trim();
    if (!_0x5ee3e4 && _0x3abf87 === _0x59c794) return false;
    return (
      (_0x3e0739.lastQrImageUrl = _0x59c794),
      (_0x3e0739.lastQrImageRequestedAt = Date.now()),
      (_0x3e0739.qrImageLoadError = false),
      (_0x3e0739.lastQrImageErrorMessage = ''),
      (_0x12583a.src = _0x59c794),
      true
    );
  }
  function _0x3b9750(_0x1a7bdf) {
    if (!_0x1a7bdf || _0x3e0739.qrImageListenersBound) return;
    (_0x1a7bdf.addEventListener('load', () => {
      (_0x4636db(false), _0x3e0739.lastStatus && _0x177b2a(_0x3e0739.lastStatus));
    }),
      _0x1a7bdf.addEventListener('error', () => {
        (_0x4636db(true, { message: trDreamina('qrLoadFailed') }),
          _0x3e0739.lastStatus && _0x177b2a(_0x3e0739.lastStatus));
      }),
      (_0x3e0739.qrImageListenersBound = true));
  }
  function _0x3c808d(_0x2f84b1) {
    const _0x130591 = Number(_0x2f84b1?.startedAt || 0);
    if (_0x130591 <= 0) return 0;
    const _0x516d39 = Number(_0x2f84b1?.completedAt || 0),
      _0x3018a8 = _0x516d39 > 0 ? _0x516d39 : Date.now();
    return Math.max(0, _0x3018a8 - _0x130591);
  }
  function _0x139d04(_0x318113) {
    const _0x7b49bd = _0x318113?.runtime || {};
    if (!_0x7b49bd?.active) return false;
    const _0x4e6022 = String(_0x7b49bd?.phase || '');
    if (!['preparing', 'starting'].includes(_0x4e6022)) return false;
    return _0x3c808d(_0x7b49bd) >= _0x2bdde1;
  }
  async function _0x36f164(_0x51ac54) {
    const _0x44a2f2 = String(_0x51ac54 || '');
    if (!_0x44a2f2) return false;
    try {
      if (navigator?.clipboard?.writeText) return (await navigator.clipboard.writeText(_0x44a2f2), true);
    } catch (_0x1f9b4f) {}
    try {
      const _0x104bc8 = document.createElement('textarea');
      ((_0x104bc8.value = _0x44a2f2),
        _0x104bc8.setAttribute('readonly', 'readonly'),
        (_0x104bc8.style.position = 'fixed'),
        (_0x104bc8.style.left = '-9999px'),
        document.body?.appendChild(_0x104bc8),
        _0x104bc8.select());
      const _0x82da46 = document.execCommand('copy');
      return (_0x104bc8.remove(), !!_0x82da46);
    } catch (_0x5e460d) {
      return false;
    }
  }
  function _0x407b7c(_0x16d388) {
    if (!_0x16d388 || typeof _0x16d388 !== 'object') return trDreamina('creditPlaceholder');
    const _0xd7fb56 = Number(_0x16d388.total_credit || 0),
      _0x34dcad = Number(_0x16d388.vip_credit || 0),
      _0x611048 = Number(_0x16d388.gift_credit || 0),
      _0xd0dddd = Number(_0x16d388.purchase_credit || 0);
    return trDreamina('creditTotal', {
      total: _0xd7fb56,
      vip: _0x34dcad,
      gift: _0x611048,
      purchase: _0xd0dddd,
    });
  }
  function _0x13f746(_0x3f91ad) {
    const _0xf26b66 = String(_0x3f91ad?.phase || ''),
      _0x2fb798 = Number(_0x3f91ad?.completedAt || 0),
      _0x47f7ff = _0x2fb798 > 0 ? _0xf26b66 + ':' + _0x2fb798 + ':' + (_0x3f91ad?.error || '') : '';
    if (!_0x47f7ff || _0x47f7ff === _0x3e0739.lastToastKey) return;
    _0x3e0739.lastToastKey = _0x47f7ff;
    if (_0xf26b66 === 'success') {
      window.showToast?.(trDreamina('loginSuccess'), 'success');
      return;
    }
    if (_0xf26b66 === 'reused') {
      window.showToast?.(trDreamina('loginReused'), 'info');
      return;
    }
    _0xf26b66 === 'failed' && window.showToast?.(_0x3f91ad?.error || trDreamina('loginFailed'), 'error');
  }
  function _0x20ff05(_0x335aa6) {
    const _0x6ccb58 = _0x335aa6?.runtime || {},
      _0x45613c = !!_0x335aa6?.loggedIn,
      _0xac0806 = !!_0x6ccb58?.active,
      _0x203da0 = String(_0x6ccb58?.phase || '');
    if (_0xac0806 && _0x203da0 === 'preparing') return trDreamina('statusPreparing');
    if (_0xac0806 && ['oauth_ready', 'polling'].includes(_0x203da0)) return trDreamina('statusWaitingAuth');
    if (_0xac0806) return trDreamina('statusLoggingIn');
    if (_0x45613c) return trDreamina('statusLoggedIn');
    return trDreamina('statusLoggedOut');
  }
  function _0x3c0565(_0x530f07) {
    return getDreaminaStatusSessionKey(_0x530f07);
  }
  function _0x591857(_0x526972) {
    const _0x7759a2 = _0x3c0565(_0x526972),
      _0x6b1e14 = !!_0x526972?.runtime?.active;
    if (_0x7759a2 && _0x7759a2 !== _0x3e0739.currentSessionKey) {
      ((_0x3e0739.currentSessionKey = _0x7759a2),
        (_0x3e0739.dismissedSessionKey = ''),
        (_0x3e0739.manualGuideOpen = false),
        (_0x3e0739.webLoginPrimedAt = 0),
        (_0x3e0739.autoOpenedManualAuthUrl = ''),
        _0x4ac46b());
      return;
    }
    !_0x6b1e14 &&
      !_0x7759a2 &&
      ((_0x3e0739.currentSessionKey = ''),
      (_0x3e0739.dismissedSessionKey = ''),
      (_0x3e0739.manualGuideOpen = false),
      (_0x3e0739.webLoginPrimedAt = 0),
      (_0x3e0739.autoOpenedManualAuthUrl = ''),
      _0x4ac46b());
  }
  function _0x12a5e0(_0x5dd127) {
    if (!shouldAutoOpenDreaminaWebAuthLink(_0x5dd127, _0x3e0739)) return;
    const _0x177f26 = _0x3f8355(_0x5dd127);
    if (!_0x177f26) return;
    ((_0x3e0739.autoOpenedManualAuthUrl = _0x177f26),
      _0xd6a377(_0x177f26, trDreamina('authLinkLabel')).catch(() => {}));
  }
  function _0x97b8e4() {
    _0x3e0739.modalCloseTimer &&
      (clearTimeout(_0x3e0739.modalCloseTimer), (_0x3e0739.modalCloseTimer = null));
  }
  function _0x25b492({ clearDismissed: clearDismissed = false } = {}) {
    const { modalOverlayEl: _0x3f0dee } = _0x3235d6();
    if (!_0x3f0dee) return;
    (_0x97b8e4(), clearDismissed && (_0x3e0739.dismissedSessionKey = ''), (_0x3f0dee.hidden = false));
  }
  function _0x53182e({ force: force = false, rememberDismissal: rememberDismissal = true } = {}) {
    const {
      modalOverlayEl: _0x506a58,
      modalQrImageEl: _0x5b5666,
      manualImportJsonEl: _0x533e17,
    } = _0x3235d6();
    _0x97b8e4();
    if (rememberDismissal) {
      const _0x2fed61 = _0x3c0565(_0x3e0739.lastStatus);
      _0x2fed61 && (_0x3e0739.dismissedSessionKey = _0x2fed61);
    }
    if (_0x506a58) _0x506a58.hidden = true;
    if (_0x5b5666) _0x5b5666.removeAttribute('src');
    if (_0x533e17) _0x533e17.value = '';
    ((_0x3e0739.manualGuideOpen = false), _0x5806ba(_0x3e0739.lastStatus || {}));
  }
  function _0x564246(_0x281ab7 = 0) {
    (_0x97b8e4(),
      (_0x3e0739.modalCloseTimer = setTimeout(
        () => {
          _0x53182e({ force: true, rememberDismissal: false });
        },
        Math.max(0, Number(_0x281ab7) || 0),
      )));
  }
  function _0x44573b(_0x278ff3) {
    const _0x4c0216 = _0x278ff3?.runtime || {},
      _0x45c683 = String(_0x4c0216?.phase || ''),
      _0xbcf253 = ['oauth', 'web', 'headless'].includes(String(_0x4c0216?.loginMode || '')),
      _0x49309f = _0x139d04(_0x278ff3),
      _0x3cff23 = _0xe9f0e(_0x278ff3),
      _0x28a32c = _0x12c79d(_0x278ff3);
    if (_0x28a32c) return trDreamina('waitBrowserFailed');
    if (shouldDreaminaManualGuideOpenByDefault(_0x278ff3, _0x3e0739.dismissedSessionKey))
      return trDreamina('waitOpenAuth');
    if (_0x49309f) return trDreamina('waitPendingTooLong');
    if (_0x3cff23) return trDreamina('waitQrDeprecated');
    if (_0x45c683 === 'failed') return trDreamina('waitFailed');
    if (_0x45c683 === 'oauth_ready' || _0x45c683 === 'polling') {
      const _0x22e852 = String(_0x4c0216?.userCode || '').trim();
      return _0x22e852 ? trDreamina('waitCode', { code: _0x22e852 }) : trDreamina('waitConfirm');
    }
    if (_0x45c683 === 'qr_ready') return trDreamina('waitUseOAuth');
    if (_0x45c683 === 'success' || _0x45c683 === 'reused') return trDreamina('waitDone');
    if (_0xbcf253) return trDreamina('waitOAuthPreparing');
    return trDreamina('waitPreparing');
  }
  function _0x177b2a(_0x312821) {
    const {
      modalCardEl: _0x12ee3b,
      modalCloseEl: _0x2b5b7a,
      modalMessageEl: _0x15d2a0,
      modalQrWrapEl: _0x535b88,
      modalQrImageEl: _0x19616e,
      modalWaitEl: _0xbdd964,
      modalWaitTextEl: _0x542a63,
      modalRetryEl: _0x198835,
      manualGuideEl: _0x4b62c9,
    } = _0x3235d6();
    if (!_0x15d2a0) return;
    const _0xf4f612 = _0x312821?.runtime || {},
      _0x98ae = !!_0xf4f612?.active,
      _0x403a74 = String(_0xf4f612?.phase || ''),
      _0x1a7659 = !!_0x312821?.loggedIn,
      _0x500fbb = ['oauth', 'web', 'headless'].includes(String(_0xf4f612?.loginMode || '')),
      _0x5cddaf = _0x139d04(_0x312821),
      _0x17715c = !_0x500fbb && !!_0xf4f612?.qrAvailable && _0x403a74 === 'qr_ready',
      _0x1ed5e1 = _0xe9f0e(_0x312821),
      _0x2502c8 = _0x12c79d(_0x312821),
      _0x22de76 = _0x1a7659 || ['success', 'reused', 'done'].includes(_0x403a74);
    _0x22de76 && (_0x3e0739.manualGuideOpen = false);
    !_0x22de76 && _0x2502c8 && (_0x3e0739.manualGuideOpen = true);
    const _0x5b7eed = _0x3c0565(_0x312821),
      _0x48c2d3 = shouldDreaminaManualGuideOpenByDefault(_0x312821, _0x3e0739.dismissedSessionKey);
    !_0x22de76 && _0x48c2d3 && (_0x3e0739.manualGuideOpen = true);
    const _0x42032f =
      _0x3e0739.manualGuideOpen ||
      ((_0x98ae || _0x17715c) && (!!_0x5b7eed ? _0x3e0739.dismissedSessionKey !== _0x5b7eed : true));
    if (_0x42032f) _0x25b492();
    else
      ['success', 'reused', 'failed', 'done'].includes(_0x403a74)
        ? _0x564246(_0x403a74 === 'failed' ? 0 : 0x258)
        : _0x53182e({ force: true, rememberDismissal: false });
    (_0x12ee3b && _0x12ee3b.classList.toggle('dreamina-login-modal--guide-open', !!_0x3e0739.manualGuideOpen),
      _0x15d2a0 &&
        (_0x15d2a0.textContent = _0x22de76
          ? trDreamina('modalSynced')
          : _0x2502c8
            ? trDreamina('modalBrowserFailed')
            : _0x48c2d3
              ? trDreamina('modalOAuthStarted')
              : _0x5cddaf
                ? trDreamina('modalPendingTooLong')
                : _0x1ed5e1
                  ? trDreamina('modalQrAbnormal')
                  : _0x403a74 === 'failed'
                    ? trDreamina('modalRetryAuth')
                    : _0x403a74 === 'oauth_ready' || _0x403a74 === 'polling'
                      ? trDreamina('modalOpenAuthAndCode')
                      : _0x17715c
                        ? trDreamina('modalScanQr')
                        : String(_0xf4f612?.message || '').trim() ||
                          String(_0x312821?.message || '').trim() ||
                          trDreamina('modalProcessing')),
      _0x542a63 && (_0x542a63.textContent = _0x44573b(_0x312821)),
      _0xbdd964 && (_0xbdd964.hidden = false),
      _0x535b88 && (_0x535b88.hidden = !_0x17715c),
      _0x19616e && (_0x17715c ? _0x3200e4(_0x19616e, _0xf4f612) : _0x19616e.removeAttribute('src')),
      _0x2b5b7a && (_0x2b5b7a.disabled = false),
      _0x198835 &&
        ((_0x198835.hidden = false),
        (_0x198835.disabled = false),
        _0x3e0739.manualGuideOpen
          ? (_0x198835.textContent = trDreamina('guideCollapse'))
          : (_0x198835.textContent = _0x2502c8 ? trDreamina('guideRecommended') : trDreamina('guide'))),
      _0x4b62c9 && _0x5806ba(_0x312821));
  }
  function _0x30db53(_0x1acd88) {
    const {
      statusTextEl: _0x49e220,
      messageTextEl: _0x33b92d,
      creditTextEl: _0x572456,
      btnAuthEl: _0x557bd3,
      btnQrAuthEl: _0x670677,
      btnLogoutEl: _0x2b9eb4,
    } = _0x3235d6();
    if (!_0x49e220) return;
    if (!_0xad0f78()) return;
    const _0x3fda50 = _0x1acd88?.runtime || {},
      _0x3dbc37 = !!_0x1acd88?.loggedIn,
      _0x48a329 = !!_0x3fda50?.active,
      _0x5bace5 = String(_0x3fda50?.phase || ''),
      _0x4bda22 =
        String(_0x3fda50?.message || '').trim() ||
        String(_0x1acd88?.message || '').trim() ||
        trDreamina('notLoggedInHint');
    _0x49e220.textContent = _0x20ff05(_0x1acd88);
    _0x33b92d && (_0x33b92d.textContent = _0x4bda22);
    _0x572456 &&
      (_0x572456.textContent = _0x3dbc37 ? _0x407b7c(_0x1acd88?.credit) : trDreamina('creditPlaceholder'));
    _0x557bd3 &&
      ((_0x557bd3.disabled = false), (_0x557bd3.textContent = getDreaminaWebLoginButtonText(_0x1acd88)));
    _0x670677 &&
      ((_0x670677.hidden = true),
      (_0x670677.disabled = true),
      (_0x670677.textContent = getDreaminaQrLoginButtonText(_0x1acd88)));
    _0x2b9eb4 && (_0x2b9eb4.disabled = _0x48a329 || !_0x3dbc37);
    if (_0x48a329) _0x37a171();
    else _0xd65feb();
    ((_0x3e0739.lastStatus = _0x1acd88),
      _0x591857(_0x1acd88),
      _0x177b2a(_0x1acd88),
      _0x12a5e0(_0x1acd88),
      _0x13f746(_0x3fda50));
  }
  async function _0x3751c3({ force: force = false, silent: silent = false } = {}) {
    if (!_0xad0f78()) return null;
    if (typeof _0x20929e !== 'function') return null;
    try {
      const _0x4cdfd3 = await _0x20929e({ refresh: force });
      return (_0x30db53(_0x4cdfd3 || {}), _0x4cdfd3 || {});
    } catch (_0x7ae74e) {
      if (!silent) {
        const _0x392b9d = _0x7ae74e?.message || trDreamina('fetchStatusFailed');
        window.showToast?.(_0x392b9d, 'error');
      }
      return null;
    }
  }
  async function _0x192ea6() {
    if (!_0xad0f78()) return;
    const _0x41ad7c = _0x3e0739.lastStatus?.runtime || {};
    if (_0x41ad7c?.active) {
      (_0x25b492({ clearDismissed: true }),
        (_0x3e0739.manualGuideOpen = true),
        _0x177b2a(_0x3e0739.lastStatus || {}));
      return;
    }
    const _0x56ab38 = !!_0x3e0739.lastStatus?.loggedIn;
    if (typeof _0x5c254a !== 'function') return;
    ((_0x3e0739.manualGuideOpen = true),
      (_0x3e0739.webLoginPrimedAt = Date.now()),
      (_0x3e0739.autoOpenedManualAuthUrl = ''),
      _0x25b492({ clearDismissed: true }));
    try {
      const _0x30f0bf = await _0x5c254a({ force: _0x56ab38 });
      if (_0x30f0bf?.success === false) throw new Error(_0x30f0bf?.message || trDreamina('startFailed'));
      ((_0x3e0739.manualGuideOpen = true),
        _0x30f0bf?.status && _0x30db53(_0x30f0bf.status),
        window.showToast?.(_0x56ab38 ? trDreamina('reloginStarted') : trDreamina('loginStarted'), 'info'),
        _0x37a171());
    } catch (_0x6f1fd8) {
      window.showToast?.(_0x6f1fd8?.message || trDreamina('startFailed'), 'error');
    }
  }
  async function _0x292a3c() {
    await _0x192ea6();
  }
  function _0x48a2e4() {
    ((_0x3e0739.manualGuideOpen = !_0x3e0739.manualGuideOpen), _0x177b2a(_0x3e0739.lastStatus || {}));
  }
  async function _0x5baf99() {
    if (!_0xad0f78()) return;
    if (typeof _0x36ac1f !== 'function') return;
    try {
      const _0x1c38bb = await _0x36ac1f();
      if (_0x1c38bb?.success === false) throw new Error(_0x1c38bb?.message || trDreamina('logoutFailed'));
      (_0x1c38bb?.status ? _0x30db53(_0x1c38bb.status) : await _0x3751c3({ force: true, silent: true }),
        _0xd65feb(),
        window.showToast?.(trDreamina('loggedOut'), 'success'));
    } catch (_0x18a7d0) {
      window.showToast?.(_0x18a7d0?.message || trDreamina('logoutFailed'), 'error');
    }
  }
  function _0x2fb6bc() {
    const {
      btnAuthEl: _0x4c8327,
      btnQrAuthEl: _0x262b4f,
      btnLogoutEl: _0xc2b1c4,
      modalOverlayEl: _0x2aea42,
      modalCloseEl: _0x25fd67,
      modalQrImageEl: _0x35bb2d,
      modalRetryEl: _0x5eab14,
      manualOpenLoginEl: _0x4b5e84,
      manualCopyLoginEl: _0xb0b7d1,
      manualOpenAuthEl: _0x436709,
      manualCopyAuthEl: _0x51b42f,
      manualImportJsonBtnEl: _0x5bbfcd,
    } = _0x3235d6();
    (_0x3b9750(_0x35bb2d),
      _0x4c8327?.addEventListener('click', () => {
        _0x192ea6().catch(() => {});
      }),
      _0x262b4f?.addEventListener('click', () => {
        _0x292a3c().catch(() => {});
      }),
      _0xc2b1c4?.addEventListener('click', () => {
        _0x5baf99().catch(() => {});
      }),
      _0x25fd67?.addEventListener('click', () => {
        _0x53182e({ force: true });
      }),
      _0x5eab14?.addEventListener('click', () => {
        _0x48a2e4();
      }),
      _0x4b5e84?.addEventListener('click', () => {
        _0x4c82a5().catch(() => {});
      }),
      _0xb0b7d1?.addEventListener('click', () => {
        _0x20e964().catch(() => {});
      }),
      _0x436709?.addEventListener('click', () => {
        _0x263d69().catch(() => {});
      }),
      _0x51b42f?.addEventListener('click', () => {
        _0xd6175a().catch(() => {});
      }),
      _0x5bbfcd?.addEventListener('click', () => {
        _0x7ae70b().catch(() => {});
      }),
      _0x2aea42?.addEventListener('click', (_0x5497be) => {
        if (_0x5497be.target !== _0x2aea42) return;
        _0x53182e();
      }),
      document.addEventListener('keydown', (_0x3afe67) => {
        if (_0x3afe67.key !== 'Escape') return;
        _0x53182e();
      }));
    if (document.body) {
      const _0x56cc34 = new MutationObserver(() => {
        const _0x49a459 = _0xad0f78();
        _0x49a459 && _0x3751c3({ force: true, silent: true }).catch(() => {});
      });
      _0x56cc34.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  }
  function _0x5b6f5b() {
    const _0x5c2e2a = (_0x5f2295) =>
        String(_0x5f2295 || '')
          .trim()
          .replace(/^Bearer\s+/i, ''),
      _0x253ce0 = {};
    _0x1e2cbf.forEach((_0x3c77b5) => {
      const _0x3668dc = document.getElementById('providerUrl-' + _0x3c77b5),
        _0x18dafd = document.getElementById('providerKey-' + _0x3c77b5),
        _0x4634ca = _0x43d0f1?.providers?.[_0x3c77b5],
        _0x4702b9 = _0x4634ca && typeof _0x4634ca === 'object' ? { ..._0x4634ca } : {};
      if (_0x3668dc) _0x4702b9.apiUrl = _0x3668dc.value.trim();
      if (_0x18dafd) _0x4702b9.apiKey = _0x5c2e2a(_0x18dafd.value);
      (_0x3c77b5 === 'apimart' && Object.assign(_0x4702b9, _0x4eb253(_0x4702b9)),
        (_0x253ce0[_0x3c77b5] = _0x4702b9));
    });
    const _0xe79c7 = document.getElementById('providerKey-runninghub-model');
    return (
      _0xe79c7 &&
        ((_0x253ce0.runninghub = _0x253ce0.runninghub || {}),
        (_0x253ce0.runninghub.modelApiKey = _0x5c2e2a(_0xe79c7.value))),
      { ...(_0x43d0f1 || {}), providers: _0x253ce0 }
    );
  }
  function _0x388c07(_0x43b98d) {
    const _0x47fcba = _0x43b98d?.providers || {};
    return _0x1e2cbf.filter((_0x5e383d) => {
      const _0x15658c = _0x47fcba[_0x5e383d] || {};
      return !!String(_0x15658c.apiKey || _0x15658c.modelApiKey || '').trim();
    });
  }
  function _0x52be9c(_0x3e0991, _0x43c73a) {
    const _0x526ef1 = _0x3e0991?.providers?.[_0x43c73a] || {};
    return !!String(_0x526ef1.apiKey || _0x526ef1.modelApiKey || '').trim();
  }
  function _0x3d8209(_0x576daa) {
    const _0x51ddba = document.getElementById('providerTestStatus-' + _0x576daa);
    return (_0x3c7114(_0x51ddba), _0x51ddba);
  }
  function _0x311def(_0x3892b7) {
    const _0x192b58 = document.getElementById('providerBalance-' + _0x3892b7);
    return (_0x3c7114(_0x192b58), _0x192b58);
  }
  function _0x2e1e76() {
    if (_0x41e853) return _0x41e853;
    return (
      (_0x41e853 = document.createElement('div')),
      (_0x41e853.className = 'settings-provider-test-tooltip'),
      _0x41e853.setAttribute('role', 'tooltip'),
      (_0x41e853.hidden = true),
      document.body.appendChild(_0x41e853),
      _0x41e853
    );
  }
  function _0x1c68d3(_0x357ada) {
    return String(_0x357ada?.getAttribute('data-provider-test-tooltip') || '').trim();
  }
  function _0x1ff843(_0x102fd3) {
    if (!_0x41e853 || !_0x102fd3) return;
    const _0x511978 = _0x41e853,
      _0x300666 = _0x102fd3.getBoundingClientRect(),
      _0x41be0c = _0x511978.getBoundingClientRect(),
      _0x397950 = 24,
      _0x59a22b = _0x102fd3.closest('.settings-modal')?.getBoundingClientRect().top ?? 0,
      _0x2c5038 = Math.max(_0x397950, _0x59a22b + 10),
      _0x1884c9 = Math.max(_0x397950, window.innerWidth - _0x41be0c.width - _0x397950),
      _0x2d7e2e = Math.min(
        _0x1884c9,
        Math.max(_0x397950, _0x300666.left + _0x300666.width / 2 - _0x41be0c.width / 2),
      ),
      _0x3e2bc8 = Math.max(_0x2c5038, _0x300666.top - _0x41be0c.height - 12),
      _0x422109 = Math.min(
        _0x41be0c.width - 14,
        Math.max(14, _0x300666.left + _0x300666.width / 2 - _0x2d7e2e),
      );
    ((_0x511978.style.left = _0x2d7e2e + 'px'),
      (_0x511978.style.top = _0x3e2bc8 + 'px'),
      _0x511978.style.setProperty('--settings-provider-test-tooltip-arrow-left', _0x422109 + 'px'));
  }
  function _0x271c96(_0x49b067) {
    const _0x2c05ce = _0x1c68d3(_0x49b067);
    if (!_0x2c05ce) return;
    const _0x4f7420 = _0x2e1e76();
    ((_0x273e6c = _0x49b067),
      (_0x4f7420.textContent = _0x2c05ce),
      (_0x4f7420.hidden = false),
      _0x1ff843(_0x49b067),
      _0x4f7420.classList.add('is-visible'));
  }
  function _0x226c2f(_0x19e1eb = null) {
    if (_0x19e1eb && _0x273e6c !== _0x19e1eb) return;
    _0x273e6c = null;
    if (!_0x41e853) return;
    (_0x41e853.classList.remove('is-visible'), (_0x41e853.hidden = true));
  }
  function _0x3c7114(_0x219ec8) {
    if (!_0x219ec8 || _0x219ec8.dataset.providerTestTooltipBound === '1') return;
    ((_0x219ec8.dataset.providerTestTooltipBound = '1'),
      _0x219ec8.addEventListener('pointerenter', () => _0x271c96(_0x219ec8)),
      _0x219ec8.addEventListener('pointerleave', () => _0x226c2f(_0x219ec8)),
      _0x219ec8.addEventListener('focus', () => _0x271c96(_0x219ec8)),
      _0x219ec8.addEventListener('blur', () => _0x226c2f(_0x219ec8)));
  }
  function _0x59583d(_0x6a133e) {
    const _0x4909a5 = _0x3d8209(_0x6a133e);
    (_0x4909a5 &&
      (_0x226c2f(_0x4909a5),
      (_0x4909a5.hidden = true),
      (_0x4909a5.textContent = ''),
      (_0x4909a5.title = ''),
      _0x4909a5.removeAttribute('data-tooltip'),
      _0x4909a5.removeAttribute('data-tooltip-source'),
      _0x4909a5.removeAttribute('data-native-title'),
      _0x4909a5.removeAttribute('data-provider-test-tooltip'),
      _0x4909a5.classList.remove(..._0x5d49f2)),
      _0x1c6d68(_0x6a133e));
  }
  function _0x26fea2(_0x6c2aeb, _0x4b7736, _0x3bde69, _0x26d97a = '') {
    const _0x2bfe48 = _0x3d8209(_0x6c2aeb);
    if (!_0x2bfe48) return;
    ((_0x2bfe48.hidden = false), (_0x2bfe48.textContent = _0x3bde69));
    const _0xc80956 = _0x26d97a || _0x3bde69;
    (_0x2bfe48.removeAttribute('title'),
      _0x2bfe48.removeAttribute('data-tooltip'),
      _0x2bfe48.removeAttribute('data-tooltip-source'),
      _0x2bfe48.removeAttribute('data-native-title'),
      _0x2bfe48.setAttribute('data-provider-test-tooltip', _0xc80956),
      _0x2bfe48.setAttribute('aria-label', _0xc80956),
      _0x2bfe48.classList.remove(..._0x5d49f2));
    if (_0x4b7736 === 'success') _0x2bfe48.classList.add('settings-provider-status--success');
    else {
      if (_0x4b7736 === 'testing') _0x2bfe48.classList.add('settings-provider-status--testing');
      else {
        if (_0x4b7736 === 'partial') _0x2bfe48.classList.add('settings-provider-status--partial');
        else _0x2bfe48.classList.add('settings-provider-status--danger');
      }
    }
  }
  function _0x1c6d68(_0x323875) {
    const _0x4ef4d8 = _0x311def(_0x323875);
    if (!_0x4ef4d8) return;
    (_0x226c2f(_0x4ef4d8),
      (_0x4ef4d8.hidden = true),
      (_0x4ef4d8.textContent = ''),
      _0x4ef4d8.removeAttribute('aria-label'),
      _0x4ef4d8.removeAttribute('data-provider-test-tooltip'));
  }
  function _0x47d449(_0x40e8a6, _0x1df433 = null) {
    const _0x5ef453 = _0x311def(_0x40e8a6);
    if (!_0x5ef453) return;
    const _0x3d4a49 = String(_0x1df433?.displayText || '').trim();
    if (!_0x3d4a49) {
      _0x1c6d68(_0x40e8a6);
      return;
    }
    const _0x596b26 = String(_0x1df433?.detailText || _0x3d4a49).trim();
    ((_0x5ef453.hidden = false),
      (_0x5ef453.textContent = _0x3d4a49),
      _0x5ef453.setAttribute('aria-label', _0x596b26),
      _0x5ef453.setAttribute('data-provider-test-tooltip', _0x596b26));
  }
  function _0x3f4356(_0x104070 = {}) {
    const _0x5e6a = [],
      _0x599460 = _0x104070.suggestion || _0x104070.summary || _0x104070.error || _0x104070.detail || '';
    if (_0x599460) _0x5e6a.push(_0x599460);
    if (Array.isArray(_0x104070.steps) && _0x104070.steps.length > 0)
      _0x104070.steps.forEach((_0x5ba86a) => {
        const _0x1539d9 = _0x5ba86a.skipped
            ? trApiInput('diagnostics.skipped')
            : _0x5ba86a.ok
              ? trApiInput('diagnostics.passed')
              : trApiInput('diagnostics.failed'),
          _0xb552b = _0x5ba86a.message || _0x5ba86a.detail || '';
        _0x5e6a.push(
          (_0x5ba86a.label || _0x5ba86a.id || trApiInput('diagnostics.step')) +
            '：' +
            _0x1539d9 +
            (_0xb552b ? ' - ' + _0xb552b : ''),
        );
      });
    else _0x104070.detail && _0x5e6a.push(_0x104070.detail);
    return _0x5e6a.filter(Boolean).join('\n');
  }
  function _0x179280(_0x2da0da = {}) {
    if (_0x2da0da.ok) return 'success';
    if (_0x2da0da.partial) return 'partial';
    return 'danger';
  }
  function _0x22ece4(_0x26d678 = {}) {
    if (_0x26d678.ok) return trApiInput('diagnostics.passed');
    if (_0x26d678.partial) return trApiInput('diagnostics.partialPassed');
    return trApiInput('diagnostics.notPassed');
  }
  function _0x2b8fa9() {
    _0x1e2cbf.forEach(_0x59583d);
  }
  function _0x138603() {
    (_0x1e2cbf.forEach((_0x40a16a) => {
      const _0x201419 = document.getElementById('providerUrl-' + _0x40a16a),
        _0x522894 = document.getElementById('providerKey-' + _0x40a16a);
      (_0x201419?.addEventListener('input', () => _0x59583d(_0x40a16a)),
        _0x522894?.addEventListener('input', () => _0x59583d(_0x40a16a)));
    }),
      _0x5ef8ff().forEach((_0x140a75) => {
        _0x140a75.addEventListener('click', () => {
          (_0x55ee8d(_0x140a75.dataset.apimartRoute), _0x59583d('apimart'));
        });
      }),
      document
        .getElementById('providerKey-runninghub-model')
        ?.addEventListener('input', () => _0x59583d('runninghub')));
  }
  async function _0x2d6980(_0x5aadd4, _0x2ea1c9 = {}) {
    if (typeof _0x581697 !== 'function') {
      window.showToast?.(trApiInput('diagnostics.testUnsupported'), 'error');
      return;
    }
    const _0x430603 = _0x5b6f5b(),
      _0x2229fc = String(_0x2ea1c9?.providerId || '')
        .trim()
        .toLowerCase(),
      _0x293bf9 = _0x2229fc ? [_0x2229fc] : _0x388c07(_0x430603);
    _0x2229fc ? _0x59583d(_0x2229fc) : _0x2b8fa9();
    if (_0x2229fc && !_0x52be9c(_0x430603, _0x2229fc)) {
      window.showToast?.(trApiInput('diagnostics.fillProviderKey'), 'warn');
      return;
    }
    if (_0x293bf9.length === 0) {
      window.showToast?.(trApiInput('diagnostics.fillOneProviderKey'), 'warn');
      return;
    }
    _0x293bf9.forEach((_0x394312) => _0x26fea2(_0x394312, 'testing', trApiInput('diagnostics.testing')));
    const _0x561143 = _0x5aadd4?.querySelector?.('.settings-btn-label'),
      _0x50d139 = _0x561143?.textContent || _0x5aadd4?.textContent || trApiInput('testConnection');
    if (_0x5aadd4) {
      _0x5aadd4.disabled = true;
      if (_0x561143) _0x561143.textContent = trApiInput('diagnostics.testingBusy');
      else _0x5aadd4.textContent = trApiInput('diagnostics.testingBusy');
    }
    const _0x522c46 = {},
      _0x26af62 = [];
    try {
      await Promise.all(
        _0x293bf9.map(async (_0x34e654) => {
          try {
            const _0x161b44 = await _0x581697(_0x430603, [_0x34e654]);
            _0x522c46[_0x34e654] = _0x161b44?.[_0x34e654];
          } catch (_0x11314f) {
            _0x522c46[_0x34e654] = {
              ok: false,
              label: _0x34e654,
              error: _0x11314f?.message || trApiInput('diagnostics.testFailed'),
            };
          }
          const _0x1f4238 = _0x522c46[_0x34e654];
          (_0x47d449(_0x34e654, _0x1f4238?.balance),
            _0x1f4238?.ok
              ? _0x26fea2(
                  _0x34e654,
                  'success',
                  trApiInput('diagnostics.passed'),
                  _0x3f4356(_0x1f4238) || trApiInput('diagnostics.testPassed'),
                )
              : (_0x26af62.push({
                  label: _0x1f4238?.label || _0x34e654,
                  error:
                    _0x1f4238?.suggestion ||
                    _0x1f4238?.summary ||
                    _0x1f4238?.error ||
                    trApiInput('diagnostics.testNotPassed'),
                }),
                _0x26fea2(
                  _0x34e654,
                  _0x179280(_0x1f4238),
                  _0x22ece4(_0x1f4238),
                  _0x3f4356(_0x1f4238) || _0x1f4238?.error || trApiInput('diagnostics.testNotPassed'),
                )));
        }),
      );
      if (_0x26af62.length === 0) {
        const _0x3f1f15 = _0x522c46[_0x293bf9[0]],
          _0x2ab68a = _0x2229fc
            ? trApiInput('diagnostics.providerPassed', { label: _0x3f1f15?.label || _0x2229fc })
            : trApiInput('diagnostics.allPassed');
        window.showToast?.(_0x2ab68a, 'success');
      } else {
        const _0x1b6dc9 = _0x26af62[0];
        window.showToast?.(
          trApiInput('diagnostics.providerFailed', { label: _0x1b6dc9.label, error: _0x1b6dc9.error }),
          'error',
          0x2328,
        );
      }
    } catch (_0xdff3dd) {
      (_0x293bf9.forEach((_0x18be7c) =>
        _0x26fea2(
          _0x18be7c,
          'danger',
          trApiInput('diagnostics.notPassed'),
          _0xdff3dd?.message || trApiInput('diagnostics.testFailed'),
        ),
      ),
        window.showToast?.(
          trApiInput('diagnostics.testFailedWithDetail', {
            error: _0xdff3dd?.message || trApiInput('diagnostics.unknownError'),
          }),
          'error',
        ));
    } finally {
      if (_0x5aadd4) {
        _0x5aadd4.disabled = false;
        if (_0x561143) _0x561143.textContent = _0x50d139;
        else _0x5aadd4.textContent = _0x50d139;
      }
    }
  }
  function _0x43a7ff() {
    const _0x36e156 = document.getElementById('btnApiSave'),
      _0xc48bc1 = document.getElementById('btnApiTest');
    (_0x5ae271()
      .then((_0x4c1bd1) => {
        if (!_0x4c1bd1 || _0x4c1bd1.error) return;
        _0x43d0f1 = _0x4c1bd1 || {};
        const _0xff95e5 = _0x4c1bd1.providers || {};
        (_0x1e2cbf.forEach((_0x5b438f) => {
          const _0x2c62ea = document.getElementById('providerUrl-' + _0x5b438f),
            _0x4a4414 = document.getElementById('providerKey-' + _0x5b438f),
            _0x2bfeb3 = _0xff95e5[_0x5b438f] || {};
          if (_0x2c62ea && _0x2bfeb3.apiUrl) _0x2c62ea.value = _0x2bfeb3.apiUrl;
          if (_0x4a4414 && _0x2bfeb3.apiKey) _0x4a4414.value = _0x2bfeb3.apiKey;
        }),
          _0x4edacd(_0xff95e5.apimart || {}),
          _0x2f9d13(_0x43d0f1),
          PROVIDER_MODEL_CATALOG_PROVIDER_IDS.forEach((_0x6f31a2) => _0x5a7c9e(_0x6f31a2)));
        const _0xbb0eef = document.getElementById('providerKey-runninghub-model');
        _0xbb0eef &&
          _0xff95e5.runninghub?.modelApiKey &&
          (_0xbb0eef.value = _0xff95e5.runninghub.modelApiKey);
        if (!_0xff95e5.grsai?.apiKey && _0x4c1bd1.apiKey) {
          const _0x2261cd = document.getElementById('providerKey-grsai');
          if (_0x2261cd && !_0x2261cd.value) _0x2261cd.value = _0x4c1bd1.apiKey;
        }
      })
      .catch((_0x986493) => {
        (console.error('[API Config] 加载失败:', _0x986493),
          _0xf820b9?.(
            trApiInput('diagnostics.loadFailed', {
              error: _0x986493.message || trApiInput('diagnostics.unknownError'),
            }),
          ));
      })
      .finally(() => {
        _0xad0f78() && _0x3751c3({ force: true, silent: true }).catch(() => {});
      }),
      _0x36e156 &&
        _0x36e156.addEventListener('click', () => {
          const _0x70211a = _0x5b6f5b();
          _0x5bc7d1(_0x70211a)
            .then((_0x211510) => {
              _0x211510.success || !_0x211510.error
                ? ((_0x43d0f1 = _0x70211a),
                  window.showToast?.(trApiInput('diagnostics.saveSuccess')),
                  _0x3751c3({ force: true, silent: true }).catch(() => {}))
                : window.showToast?.(
                    trApiInput('diagnostics.saveFailed', {
                      error: _0x211510.error || trApiInput('diagnostics.unknownError'),
                    }),
                    'error',
                  );
            })
            .catch((_0x5cc3b9) => {
              window.showToast?.(
                trApiInput('diagnostics.saveFailed', {
                  error: _0x5cc3b9.message || trApiInput('diagnostics.unknownError'),
                }),
                'error',
              );
            });
        }),
      _0xc48bc1?.addEventListener('click', () => {
        _0x2d6980(_0xc48bc1).catch(() => {});
      }),
      document.querySelectorAll('[data-provider-test]').forEach((_0x21c197) => {
        const _0x13ba2a = String(_0x21c197.dataset.providerTest || '').trim();
        if (!_0x13ba2a) return;
        _0x21c197.addEventListener('click', () => {
          _0x2d6980(_0x21c197, { providerId: _0x13ba2a }).catch(() => {});
        });
      }),
      document.querySelectorAll('[data-provider-models]').forEach((_0x3e1a2b) => {
        const _0x1d6f0e = String(_0x3e1a2b.dataset.providerModels || '').trim();
        if (!_0x1d6f0e) return;
        _0x3e1a2b.addEventListener('click', () => {
          _0x1e5a76(_0x1d6f0e, _0x3e1a2b).catch(() => {});
        });
      }),
      (document.getElementById('pane-api-input') || document).addEventListener(
        'click',
        (_0x4bb3c2) => {
          const _0x2ab1d2 = _0x4bb3c2?.target?.closest?.('[data-provider-model-save]');
          if (!_0x2ab1d2) return;
          (_0x4bb3c2.preventDefault?.(),
            _0x4b8e2c(String(_0x2ab1d2.dataset.providerModelSave || '').trim()).catch(() => {}));
        },
      ),
      _0x138603(),
      _0x2fb6bc());
  }
  function _0x52e5c1() {
    (_0x484950(), _0xad0f78(), _0x43a7ff());
  }
  return { init: _0x52e5c1 };
}
