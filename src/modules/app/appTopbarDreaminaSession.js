import { t } from '../../i18n/index.js';
import { openExternalLink } from '../../services/externalLinkService.js';
import { CLI_COMPONENT_CHANGED } from '../../../api/cliComponentApi.js';
const DREAMINA_LOGIN_PAGE_URL = 'https://jimeng.jianying.com/',
  DREAMINA_I18N_PREFIX = 'settings.apiInput.providers.dreamina';
function trTemplate(_0x37d5e8, _0x22cd4f = {}) {
  let _0x2c8290 = t(_0x37d5e8);
  return (
    Object['entries'](_0x22cd4f || {})['forEach'](([_0x7270c3, _0x458989]) => {
      _0x2c8290 = _0x2c8290['split']('{' + _0x7270c3 + '}')['join'](String(_0x458989 ?? ''));
    }),
    _0x2c8290
  );
}
function trDreamina(_0xf346fd, _0x24cfae = {}) {
  return trTemplate(DREAMINA_I18N_PREFIX + '.' + _0xf346fd, _0x24cfae);
}
function normalizeDreaminaManualUrlCandidate(_0x3cfa7c) {
  const _0x5b0492 = String(_0x3cfa7c || '')['trim']();
  if (!_0x5b0492) return '';
  const _0xcda608 = _0x5b0492['replace'](/^[<（(【\["'“‘]+/, '')
    ['replace'](/[>）)】\]"'”’]+$/, '')
    ['replace'](/[，。；;、]+$/, '');
  return /^https?:\/\//['test'](_0xcda608) ? _0xcda608 : '';
}
export function extractDreaminaManualLinksFromOutputLines(_0x5c659b) {
  const _0x389fbc = Array['isArray'](_0x5c659b) ? _0x5c659b : [],
    _0x2b8a82 = [];
  let _0x4960ea = '';
  _0x389fbc['forEach']((_0x2b264e) => {
    const _0x2978a2 = String(_0x2b264e || '');
    if (!_0x4960ea && _0x2978a2['includes']('请在浏览器中打开以下链接')) _0x4960ea = '__PENDING__';
    else _0x4960ea === '__PENDING__' && (_0x4960ea = _0x2978a2['trim']());
    const _0x31ad31 = _0x2978a2['match'](/https?:\/\/[^\s]+/g);
    if (!_0x31ad31) return;
    _0x31ad31['forEach']((_0x4feab7) => {
      const _0x1ee19b = normalizeDreaminaManualUrlCandidate(_0x4feab7);
      if (_0x1ee19b && !_0x2b8a82['includes'](_0x1ee19b)) _0x2b8a82['push'](_0x1ee19b);
    });
  });
  const _0x4a68c8 =
      _0x4960ea && _0x4960ea !== '__PENDING__' ? normalizeDreaminaManualUrlCandidate(_0x4960ea) : '',
    _0x32e515 =
      _0x4a68c8 ||
      _0x2b8a82['find']((_0x21023c) => _0x21023c['includes']('/passport/web_login')) ||
      _0x2b8a82['find']((_0x59199e) => _0x59199e['includes']('/passport/web/web_login')) ||
      '',
    _0x19f45a =
      _0x2b8a82['find']((_0xbde52d) => _0xbde52d['includes']('/dreamina/cli/v1/dreamina_cli_login')) || '',
    _0x5491b1 = _0x19f45a || _0x2b8a82['find']((_0x34c78a) => _0x34c78a !== DREAMINA_LOGIN_PAGE_URL) || '';
  return {
    authorizeUrl: _0x19f45a || _0x32e515 || _0x5491b1 || '',
    strictAuthorizeUrl: _0x32e515,
    callbackUrl: _0x19f45a,
  };
}
export function getDreaminaWebLoginButtonText(_0x21524c) {
  const _0x393a8e = _0x21524c?.['runtime'] || {},
    _0x217445 = !!_0x21524c?.['loggedIn'],
    _0x19a4f5 = !!_0x393a8e?.['active'];
  if (_0x19a4f5) return trDreamina('viewLogin');
  return _0x217445 ? trDreamina('relogin') : trDreamina('login');
}
export function getDreaminaQrLoginButtonText(_0x2cb595) {
  const _0x443077 = _0x2cb595?.['runtime'] || {},
    _0x2c485e = !!_0x443077?.['active'];
  if (_0x2c485e) return trDreamina('viewLogin');
  return trDreamina('login');
}
export function getDreaminaStatusSessionKey(_0x3674ec) {
  const _0x5efa61 = _0x3674ec?.['runtime'] || {},
    _0x48abdc = Number(_0x5efa61?.['startedAt'] || 0x0);
  if (_0x48abdc > 0x0) return 'login:' + _0x48abdc;
  const _0x18d053 = Number(_0x5efa61?.['qrVersion'] || 0x0);
  if (_0x18d053 > 0x0) return 'qr:' + _0x18d053;
  return '';
}
export function mergeDreaminaLoginRuntimeStatus(_0x5b0831 = {}, _0x140d6c = {}) {
  const _0x3ac1e3 = String(_0x140d6c?.['phase'] || ''),
    _0x21c063 = ['success', 'reused', 'done']['includes'](_0x3ac1e3);
  return {
    ...(_0x5b0831 || {}),
    loggedIn: _0x21c063 ? !![] : !!_0x5b0831?.['loggedIn'],
    message: String(_0x140d6c?.['message'] || '')['trim']() || String(_0x5b0831?.['message'] || '')['trim'](),
    runtime: _0x140d6c || {},
  };
}
export function reconcileDreaminaSessionUiState(_0x476421, _0xf0d18c = {}) {
  const _0x37a377 = getDreaminaStatusSessionKey(_0x476421),
    _0x28950f = !!_0x476421?.['runtime']?.['active'],
    _0x2d2cf7 = !!_0xf0d18c['manualGuideOpen'] && Number(_0xf0d18c['loginLaunchRequestedAt'] || 0x0) > 0x0;
  if (_0x37a377 && _0x37a377 !== _0xf0d18c['currentSessionKey'])
    return (
      (_0xf0d18c['currentSessionKey'] = _0x37a377),
      (_0xf0d18c['dismissedSessionKey'] = ''),
      !_0x2d2cf7 && ((_0xf0d18c['manualGuideOpen'] = ![]), (_0xf0d18c['loginLaunchRequestedAt'] = 0x0)),
      !![]
    );
  if (!_0x28950f && !_0x37a377 && !_0x2d2cf7)
    return (
      (_0xf0d18c['currentSessionKey'] = ''),
      (_0xf0d18c['dismissedSessionKey'] = ''),
      (_0xf0d18c['manualGuideOpen'] = ![]),
      (_0xf0d18c['loginLaunchRequestedAt'] = 0x0),
      !![]
    );
  return ![];
}
export function shouldDreaminaManualGuideOpenByDefault(_0x51eeb7, _0x2c3dd6 = '') {
  const _0x5437f5 = _0x51eeb7?.['runtime'] || {},
    _0x35c7c0 = String(_0x5437f5?.['loginMode'] || '');
  if (!_0x5437f5?.['active'] || !['oauth', 'web', 'headless']['includes'](_0x35c7c0)) return ![];
  const _0x3da2c6 = getDreaminaStatusSessionKey(_0x51eeb7);
  return !_0x3da2c6 || String(_0x2c3dd6 || '') !== _0x3da2c6;
}
export function createDreaminaLoginSessionController({
  fetchDreaminaCliStatusFromServer: _0x40331b,
  fetchDreaminaCliLoginRuntimeFromServer: _0xf8afbc,
  startDreaminaWebLoginFromServer: _0x5e8c9f,
  importDreaminaLoginResponseFromServer: _0x2d8553,
  logoutDreaminaFromServer: _0x5801e7,
  buildDreaminaQrImageUrl: _0x487c92,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const _0x58380c = documentObject,
    _0x581cb5 = windowObject,
    _0x101314 = 0x55 * 0x3e8,
    _0x37e9f8 = {
      pollTimer: null,
      pollInFlight: ![],
      pollInFlightGeneration: 0x0,
      pollGeneration: 0x0,
      statusRequestGeneration: 0x0,
      lastToastKey: '',
      lastStatus: null,
      modalCloseTimer: null,
      currentSessionKey: '',
      dismissedSessionKey: '',
      qrImageLoadError: ![],
      lastQrImageUrl: '',
      lastQrImageRequestedAt: 0x0,
      lastQrImageLoadedAt: 0x0,
      lastQrImageErrorAt: 0x0,
      lastQrImageErrorMessage: '',
      qrImageListenersBound: ![],
      manualGuideOpen: ![],
      loginLaunchRequestedAt: 0x0,
      observer: null,
    };
  function _0x2e7a44() {
    return {
      settingsCardEl: _0x58380c['getElementById']('dreaminaSettingsCard'),
      statusTextEl: _0x58380c['getElementById']('dreaminaStatusText'),
      messageTextEl: _0x58380c['getElementById']('dreaminaStatusMessage'),
      creditTextEl: _0x58380c['getElementById']('dreaminaCreditText'),
      btnAuthEl: _0x58380c['getElementById']('btnDreaminaAuth'),
      btnQrAuthEl: _0x58380c['getElementById']('btnDreaminaQrAuth'),
      btnLogoutEl: _0x58380c['getElementById']('btnDreaminaLogout'),
      modalOverlayEl: _0x58380c['getElementById']('dreaminaLoginModal'),
      modalCardEl: _0x58380c['getElementById']('dreaminaLoginModalCard'),
      modalCloseEl: _0x58380c['getElementById']('dreaminaModalClose'),
      modalMessageEl: _0x58380c['getElementById']('dreaminaModalMessage'),
      modalQrWrapEl: _0x58380c['getElementById']('dreaminaModalQrWrap'),
      modalQrImageEl: _0x58380c['getElementById']('dreaminaModalQrImage'),
      modalWaitEl: _0x58380c['getElementById']('dreaminaModalWait'),
      modalWaitTextEl: _0x58380c['getElementById']('dreaminaModalWaitText'),
      modalRetryEl: _0x58380c['getElementById']('dreaminaModalRetry'),
      manualGuideEl: _0x58380c['getElementById']('dreaminaManualGuide'),
      manualAuthUrlEl: _0x58380c['getElementById']('dreaminaManualAuthUrl'),
      manualImportJsonEl: _0x58380c['getElementById']('dreaminaManualImportJson'),
      manualOpenAuthEl: _0x58380c['getElementById']('dreaminaManualOpenAuth'),
      manualCopyAuthEl: _0x58380c['getElementById']('dreaminaManualCopyAuth'),
      manualImportJsonBtnEl: _0x58380c['getElementById']('dreaminaManualImportJsonBtn'),
    };
  }
  function _0x28c1fb() {
    const { settingsCardEl: _0x9da0fd } = _0x2e7a44();
    if (!_0x9da0fd) return ![];
    const _0x3be33a = !![];
    return (
      (_0x9da0fd['hidden'] = !_0x3be33a),
      !_0x3be33a && (_0x87872f({ force: !![], rememberDismissal: ![] }), _0x308414()),
      _0x3be33a
    );
  }
  function _0x308414() {
    (_0x37e9f8['pollTimer'] && (clearTimeout(_0x37e9f8['pollTimer']), (_0x37e9f8['pollTimer'] = null)),
      (_0x37e9f8['pollGeneration'] += 0x1));
  }
  function _0x5e6e08() {
    const _0x4c1731 = _0x37e9f8['pollGeneration'];
    if (
      _0x37e9f8['pollTimer'] ||
      (_0x37e9f8['pollInFlight'] && _0x37e9f8['pollInFlightGeneration'] === _0x4c1731)
    )
      return;
    const _0x2f4586 = async () => {
      if (_0x4c1731 !== _0x37e9f8['pollGeneration']) return;
      _0x37e9f8['pollTimer'] = null;
      if (_0x37e9f8['pollInFlight'] && _0x37e9f8['pollInFlightGeneration'] === _0x4c1731) return;
      ((_0x37e9f8['pollInFlight'] = !![]), (_0x37e9f8['pollInFlightGeneration'] = _0x4c1731));
      try {
        await _0x39d25f({ silent: !![] });
      } finally {
        _0x37e9f8['pollInFlightGeneration'] === _0x4c1731 && (_0x37e9f8['pollInFlight'] = ![]);
        if (_0x4c1731 !== _0x37e9f8['pollGeneration']) return;
        _0x37e9f8['lastStatus']?.['runtime']?.['active'] &&
          (_0x37e9f8['pollTimer'] = setTimeout(_0x2f4586, 0x320));
      }
    };
    void _0x2f4586();
  }
  function _0x5746cc() {
    ((_0x37e9f8['qrImageLoadError'] = ![]),
      (_0x37e9f8['lastQrImageUrl'] = ''),
      (_0x37e9f8['lastQrImageRequestedAt'] = 0x0),
      (_0x37e9f8['lastQrImageLoadedAt'] = 0x0),
      (_0x37e9f8['lastQrImageErrorAt'] = 0x0),
      (_0x37e9f8['lastQrImageErrorMessage'] = ''));
  }
  function _0x2f6083(_0x1b63ab, _0x4990f0 = Date['now']()) {
    const _0x34525c = String(_0x1b63ab || '')['trim']();
    if (!_0x34525c) return '';
    const _0x5006de = _0x34525c['includes']('?') ? '&' : '?';
    return '' + _0x34525c + _0x5006de + 'cb=' + encodeURIComponent(String(_0x4990f0));
  }
  function _0x8236e(_0xf930b9, { withCacheBust: withCacheBust = ![] } = {}) {
    const _0x30b68a = Number(_0xf930b9?.['qrVersion'] || 0x0),
      _0x154aed = _0x487c92?.(_0x30b68a || Date['now']()) || '';
    if (!_0x154aed) return '';
    return withCacheBust ? _0x2f6083(_0x154aed) : _0x154aed;
  }
  function _0x2c111b(_0x45c4b9) {
    const _0x3b4eaf = _0x45c4b9?.['runtime'] || {},
      _0x47ebbb = String(_0x3b4eaf?.['phase'] || ''),
      _0x13cbde = !!_0x3b4eaf?.['qrAvailable'];
    return _0x47ebbb === 'qr_ready' && _0x13cbde && !!_0x37e9f8['qrImageLoadError'];
  }
  function _0x5ae502(_0x1456bb) {
    const _0x492a47 = _0x1456bb?.['runtime'] || {};
    return Array['isArray'](_0x492a47?.['outputTail']) ? _0x492a47['outputTail'] : [];
  }
  function _0x33b713(_0x12aaa6) {
    const _0x4ba8ee = _0x5ae502(_0x12aaa6);
    return _0x4ba8ee['some']((_0x380b07) => {
      const _0x2ed24a = String(_0x380b07 || '')['toLowerCase']();
      return (
        _0x2ed24a['includes']('自动打开浏览器失败') ||
        _0x2ed24a['includes']('open headless login page') ||
        _0x2ed24a['includes']('executable file not found') ||
        _0x2ed24a['includes']('google-chrome')
      );
    });
  }
  function _0x32353f(_0x3ff82b) {
    const _0x270537 = _0x3ff82b?.['runtime'] || {},
      _0x5b984f = extractDreaminaManualLinksFromOutputLines(_0x5ae502(_0x3ff82b));
    return {
      ..._0x5b984f,
      authorizeUrl: String(_0x270537?.['authorizeUrl'] || '')['trim']() || _0x5b984f['authorizeUrl'],
      callbackUrl: String(_0x270537?.['callbackUrl'] || '')['trim']() || _0x5b984f['callbackUrl'],
    };
  }
  function _0x2bfc6f(_0x4546b3) {
    const {
      manualAuthUrlEl: _0x2ce08b,
      manualOpenAuthEl: _0x3dfe61,
      manualCopyAuthEl: _0x2a643f,
    } = _0x2e7a44();
    if (!_0x2ce08b || !_0x3dfe61 || !_0x2a643f) return;
    const _0x47e148 = _0x32353f(_0x4546b3 || _0x37e9f8['lastStatus'] || {}),
      _0x133447 = String(_0x47e148?.['authorizeUrl'] || '')['trim']();
    ((_0x2ce08b['value'] = _0x133447 || trDreamina('waitingAuthUrl')),
      (_0x3dfe61['disabled'] = !_0x133447),
      (_0x2a643f['disabled'] = !_0x133447));
  }
  function _0x2cbe94(_0x8fea49) {
    const { manualGuideEl: _0x3ad9e6 } = _0x2e7a44();
    if (!_0x3ad9e6) return;
    (_0x2bfc6f(_0x8fea49 || _0x37e9f8['lastStatus'] || {}),
      (_0x3ad9e6['hidden'] = !_0x37e9f8['manualGuideOpen']));
  }
  function _0x5e1b3a(_0x536fd4 = _0x37e9f8['lastStatus'] || {}) {
    const _0x20b1ea = _0x32353f(_0x536fd4);
    return String(_0x20b1ea?.['authorizeUrl'] || '')['trim']();
  }
  async function _0x3eaee7(_0x343947, _0x7a1c46) {
    const _0x42a0b9 = String(_0x343947 || '')['trim']();
    if (!_0x42a0b9)
      return (_0x581cb5['showToast']?.(trDreamina('missingValue', { label: _0x7a1c46 }), 'warning'), ![]);
    try {
      return (await openExternalLink(_0x42a0b9, { label: _0x7a1c46 }), !![]);
    } catch (_0x256589) {}
    const _0x226c51 = await _0x53e1f1(_0x42a0b9);
    return (
      _0x226c51
        ? _0x581cb5['showToast']?.(trDreamina('browserOpenFailedCopied', { label: _0x7a1c46 }), 'warning')
        : _0x581cb5['showToast']?.(trDreamina('browserOpenFailedCopyFirst', { label: _0x7a1c46 }), 'warning'),
      ![]
    );
  }
  async function _0x49876b(_0x13828a, _0x10b00e) {
    const _0x19d2b2 = String(_0x13828a || '')['trim']();
    if (!_0x19d2b2) {
      _0x581cb5['showToast']?.(trDreamina('missingValue', { label: _0x10b00e }), 'warning');
      return;
    }
    const _0xd49d73 = await _0x53e1f1(_0x19d2b2);
    _0xd49d73
      ? _0x581cb5['showToast']?.(trDreamina('copySuccess', { label: _0x10b00e }), 'success')
      : _0x581cb5['showToast']?.(trDreamina('copyFailed', { label: _0x10b00e }), 'error');
  }
  async function _0x4b7468() {
    await _0x3eaee7(_0x5e1b3a(), trDreamina('authLinkLabel'));
  }
  async function _0x957cca() {
    await _0x49876b(_0x5e1b3a(), trDreamina('authLinkLabel'));
  }
  function _0x5d57e2(_0x241eef) {
    const _0x17a0fd = String(_0x241eef || '')['trim']();
    if (!_0x17a0fd) throw new Error(trDreamina('jsonPasteRequired'));
    const _0x4f86b7 = [];
    _0x4f86b7['push'](_0x17a0fd);
    const _0x26a2a4 = _0x17a0fd['match'](/```(?:json)?\s*([\s\S]*?)```/i);
    _0x26a2a4?.[0x1] && _0x4f86b7['push'](String(_0x26a2a4[0x1])['trim']());
    const _0x4db21c = _0x17a0fd['indexOf']('{'),
      _0x27463d = _0x17a0fd['lastIndexOf']('}');
    _0x4db21c >= 0x0 &&
      _0x27463d > _0x4db21c &&
      _0x4f86b7['push'](_0x17a0fd['slice'](_0x4db21c, _0x27463d + 0x1)['trim']());
    for (const _0x59631b of _0x4f86b7) {
      if (!_0x59631b) continue;
      try {
        const _0x45064e = JSON['parse'](_0x59631b);
        if (!_0x45064e || typeof _0x45064e !== 'object' || Array['isArray'](_0x45064e))
          throw new Error('INVALID_OBJECT');
        return _0x45064e;
      } catch (_0x2b3105) {
        if (_0x2b3105?.['message'] === 'INVALID_OBJECT') throw new Error(trDreamina('jsonMustBeObject'));
      }
    }
    throw new Error(trDreamina('jsonFormatInvalid'));
  }
  async function _0x2b10bf() {
    if (typeof _0x2d8553 !== 'function') {
      _0x581cb5['showToast']?.(trDreamina('jsonImportUnsupported'), 'error');
      return;
    }
    const { manualImportJsonEl: _0x73c0e5 } = _0x2e7a44(),
      _0x198a9b = String(_0x73c0e5?.['value'] || '');
    let _0xe3d09d = null;
    try {
      _0xe3d09d = _0x5d57e2(_0x198a9b);
    } catch (_0xd5c6f3) {
      _0x581cb5['showToast']?.(_0xd5c6f3?.['message'] || trDreamina('jsonParseFailed'), 'warning');
      return;
    }
    try {
      const _0x2df082 = await _0x2d8553(_0xe3d09d);
      if (_0x2df082?.['success'] === ![])
        throw new Error(_0x2df082?.['message'] || trDreamina('importFailed'));
      (_0x2df082?.['status']
        ? _0x57513f(_0x2df082['status'])
        : await _0x2e5bc3({ force: !![], silent: !![] }),
        _0x73c0e5 && (_0x73c0e5['value'] = ''),
        _0x5e6e08(),
        _0x581cb5['showToast']?.(trDreamina('importedSyncing'), 'success'));
    } catch (_0x1b36c7) {
      _0x581cb5['showToast']?.(_0x1b36c7?.['message'] || trDreamina('importFailed'), 'error');
    }
  }
  function _0x518c6b(_0x20f4aa, _0x5335e6 = {}) {
    _0x37e9f8['qrImageLoadError'] = !!_0x20f4aa;
    if (_0x20f4aa) {
      ((_0x37e9f8['lastQrImageErrorAt'] = Date['now']()),
        (_0x37e9f8['lastQrImageErrorMessage'] =
          String(_0x5335e6?.['message'] || '')['trim']() || trDreamina('qrLoadFailed')));
      return;
    }
    ((_0x37e9f8['lastQrImageLoadedAt'] = Date['now']()),
      (_0x37e9f8['lastQrImageErrorAt'] = 0x0),
      (_0x37e9f8['lastQrImageErrorMessage'] = ''));
  }
  function _0x2dc36a(_0x1c9b42, _0x504467, _0x31db98 = {}) {
    if (!_0x1c9b42) return ![];
    const _0x194009 = !!_0x31db98?.['withCacheBust'],
      _0x586313 = _0x8236e(_0x504467, { withCacheBust: _0x194009 });
    if (!_0x586313) return ![];
    const _0x5e77b5 = String(_0x1c9b42['getAttribute']('src') || '')['trim']();
    if (!_0x194009 && _0x5e77b5 === _0x586313) return ![];
    return (
      (_0x37e9f8['lastQrImageUrl'] = _0x586313),
      (_0x37e9f8['lastQrImageRequestedAt'] = Date['now']()),
      (_0x37e9f8['qrImageLoadError'] = ![]),
      (_0x37e9f8['lastQrImageErrorMessage'] = ''),
      (_0x1c9b42['src'] = _0x586313),
      !![]
    );
  }
  function _0x49bf13(_0x27ab71) {
    if (!_0x27ab71 || _0x37e9f8['qrImageListenersBound']) return;
    (_0x27ab71['addEventListener']('load', () => {
      (_0x518c6b(![]), _0x37e9f8['lastStatus'] && _0x49d053(_0x37e9f8['lastStatus']));
    }),
      _0x27ab71['addEventListener']('error', () => {
        (_0x518c6b(!![], { message: trDreamina('qrLoadFailed') }),
          _0x37e9f8['lastStatus'] && _0x49d053(_0x37e9f8['lastStatus']));
      }),
      (_0x37e9f8['qrImageListenersBound'] = !![]));
  }
  function _0x5e749a(_0x2823c2) {
    const _0x50803b = Number(_0x2823c2?.['startedAt'] || 0x0);
    if (_0x50803b <= 0x0) return 0x0;
    const _0x17a3b5 = Number(_0x2823c2?.['completedAt'] || 0x0),
      _0x41d1ee = _0x17a3b5 > 0x0 ? _0x17a3b5 : Date['now']();
    return Math['max'](0x0, _0x41d1ee - _0x50803b);
  }
  function _0x10dcff(_0x351ca6) {
    const _0x31abfb = _0x351ca6?.['runtime'] || {};
    if (!_0x31abfb?.['active']) return ![];
    const _0x24f287 = String(_0x31abfb?.['phase'] || '');
    if (!['preparing', 'starting']['includes'](_0x24f287)) return ![];
    return _0x5e749a(_0x31abfb) >= _0x101314;
  }
  async function _0x53e1f1(_0x1f6a15) {
    const _0x3505c1 = String(_0x1f6a15 || '');
    if (!_0x3505c1) return ![];
    try {
      if (navigator?.['clipboard']?.['writeText'])
        return (await navigator['clipboard']['writeText'](_0x3505c1), !![]);
    } catch (_0x394eac) {}
    try {
      const _0x6278a6 = _0x58380c['createElement']('textarea');
      ((_0x6278a6['value'] = _0x3505c1),
        _0x6278a6['setAttribute']('readonly', 'readonly'),
        (_0x6278a6['style']['position'] = 'fixed'),
        (_0x6278a6['style']['left'] = '-9999px'),
        _0x58380c['body']?.['appendChild'](_0x6278a6),
        _0x6278a6['select']());
      const _0x1a7243 = _0x58380c['execCommand']('copy');
      return (_0x6278a6['remove'](), !!_0x1a7243);
    } catch (_0x2ebf1c) {
      return ![];
    }
  }
  function _0x4783af(_0x53bcd8) {
    if (!_0x53bcd8 || typeof _0x53bcd8 !== 'object') return trDreamina('creditPlaceholder');
    const _0x4447b1 = Number(_0x53bcd8['total_credit'] || 0x0),
      _0x4c4ca6 = Number(_0x53bcd8['vip_credit'] || 0x0),
      _0x518af1 = Number(_0x53bcd8['gift_credit'] || 0x0),
      _0x1bf0ce = Number(_0x53bcd8['purchase_credit'] || 0x0);
    return trDreamina('creditTotal', {
      total: _0x4447b1,
      vip: _0x4c4ca6,
      gift: _0x518af1,
      purchase: _0x1bf0ce,
    });
  }
  function _0x394383(_0x232d72) {
    const _0x29514a = String(_0x232d72?.['phase'] || ''),
      _0x2ab04f = Number(_0x232d72?.['completedAt'] || 0x0),
      _0x597d7a = _0x2ab04f > 0x0 ? _0x29514a + ':' + _0x2ab04f + ':' + (_0x232d72?.['error'] || '') : '';
    if (!_0x597d7a || _0x597d7a === _0x37e9f8['lastToastKey']) return;
    _0x37e9f8['lastToastKey'] = _0x597d7a;
    if (_0x29514a === 'success') {
      _0x581cb5['showToast']?.(trDreamina('loginSuccess'), 'success');
      return;
    }
    if (_0x29514a === 'reused') {
      _0x581cb5['showToast']?.(trDreamina('loginReused'), 'info');
      return;
    }
    _0x29514a === 'failed' &&
      _0x581cb5['showToast']?.(_0x232d72?.['error'] || trDreamina('loginFailed'), 'error');
  }
  function _0x5ee1a2(_0x2303e0) {
    const _0x5360f7 = _0x2303e0?.['runtime'] || {},
      _0x1f61fd = !!_0x2303e0?.['loggedIn'],
      _0x5b835b = !!_0x5360f7?.['active'],
      _0x158a30 = String(_0x5360f7?.['phase'] || '');
    if (_0x5b835b && _0x158a30 === 'preparing') return trDreamina('statusPreparing');
    if (_0x5b835b && ['oauth_ready', 'polling']['includes'](_0x158a30))
      return trDreamina('statusWaitingAuth');
    if (_0x5b835b) return trDreamina('statusLoggingIn');
    if (_0x1f61fd) return trDreamina('statusLoggedIn');
    return trDreamina('statusLoggedOut');
  }
  function _0x1a3c16(_0x22fe7e) {
    return getDreaminaStatusSessionKey(_0x22fe7e);
  }
  function _0x2ada90(_0x56c4b8) {
    reconcileDreaminaSessionUiState(_0x56c4b8, _0x37e9f8) && _0x5746cc();
  }
  function _0x32e5b0() {
    _0x37e9f8['modalCloseTimer'] &&
      (clearTimeout(_0x37e9f8['modalCloseTimer']), (_0x37e9f8['modalCloseTimer'] = null));
  }
  function _0x11f864({ clearDismissed: clearDismissed = ![] } = {}) {
    const { modalOverlayEl: _0x119330 } = _0x2e7a44();
    if (!_0x119330) return;
    (_0x32e5b0(), clearDismissed && (_0x37e9f8['dismissedSessionKey'] = ''), (_0x119330['hidden'] = ![]));
  }
  function _0x87872f({ force: force = ![], rememberDismissal: rememberDismissal = !![] } = {}) {
    const {
      modalOverlayEl: _0x3ebf84,
      modalQrImageEl: _0x1340c3,
      manualImportJsonEl: _0x2f52a9,
    } = _0x2e7a44();
    _0x32e5b0();
    if (rememberDismissal) {
      const _0x136107 = _0x1a3c16(_0x37e9f8['lastStatus']);
      _0x136107 && (_0x37e9f8['dismissedSessionKey'] = _0x136107);
    }
    if (_0x3ebf84) _0x3ebf84['hidden'] = !![];
    if (_0x1340c3) _0x1340c3['removeAttribute']('src');
    if (_0x2f52a9) _0x2f52a9['value'] = '';
    ((_0x37e9f8['manualGuideOpen'] = ![]), _0x2cbe94(_0x37e9f8['lastStatus'] || {}));
  }
  function _0x2273d1(_0x21a71e = 0x0) {
    (_0x32e5b0(),
      (_0x37e9f8['modalCloseTimer'] = setTimeout(
        () => {
          _0x87872f({ force: !![], rememberDismissal: ![] });
        },
        Math['max'](0x0, Number(_0x21a71e) || 0x0),
      )));
  }
  function _0x332593(_0x128312) {
    const _0x4dd2a4 = _0x128312?.['runtime'] || {},
      _0x5a8c1c = String(_0x4dd2a4?.['phase'] || ''),
      _0x461f52 = ['oauth', 'web', 'headless']['includes'](String(_0x4dd2a4?.['loginMode'] || '')),
      _0x7d177 = _0x10dcff(_0x128312),
      _0x3c56b5 = _0x2c111b(_0x128312),
      _0x143b3e = _0x33b713(_0x128312);
    if (_0x143b3e) return trDreamina('waitBrowserFailed');
    if (shouldDreaminaManualGuideOpenByDefault(_0x128312, _0x37e9f8['dismissedSessionKey']))
      return trDreamina('waitOpenAuth');
    if (_0x7d177) return trDreamina('waitPendingTooLong');
    if (_0x3c56b5) return trDreamina('waitQrDeprecated');
    if (_0x5a8c1c === 'failed') return trDreamina('waitFailed');
    if (_0x5a8c1c === 'oauth_ready' || _0x5a8c1c === 'polling') return trDreamina('waitConfirm');
    if (_0x5a8c1c === 'qr_ready') return trDreamina('waitUseOAuth');
    if (_0x5a8c1c === 'success' || _0x5a8c1c === 'reused') return trDreamina('waitDone');
    if (_0x461f52) return trDreamina('waitOAuthPreparing');
    return trDreamina('waitPreparing');
  }
  function _0x49d053(_0x1c5fc4) {
    const {
      modalCardEl: _0x4ef024,
      modalCloseEl: _0x1aeb65,
      modalMessageEl: _0x4a90fb,
      modalQrWrapEl: _0x2c54d3,
      modalQrImageEl: _0x3a7735,
      modalWaitEl: _0x435077,
      modalWaitTextEl: _0x4a00a1,
      modalRetryEl: _0xe0750f,
      manualGuideEl: _0x2c7f81,
    } = _0x2e7a44();
    if (!_0x4a90fb) return;
    const _0x289607 = _0x1c5fc4?.['runtime'] || {},
      _0x53d712 = !!_0x289607?.['active'],
      _0x7c2b45 = String(_0x289607?.['phase'] || ''),
      _0x547d77 = !!_0x1c5fc4?.['loggedIn'],
      _0x9ef8ba = ['oauth', 'web', 'headless']['includes'](String(_0x289607?.['loginMode'] || '')),
      _0x2d64b1 = _0x10dcff(_0x1c5fc4),
      _0x44277d = !_0x9ef8ba && !!_0x289607?.['qrAvailable'] && _0x7c2b45 === 'qr_ready',
      _0x422703 = _0x2c111b(_0x1c5fc4),
      _0x2ef861 = _0x33b713(_0x1c5fc4),
      _0x359dc6 = _0x547d77 || ['success', 'reused', 'done']['includes'](_0x7c2b45);
    _0x359dc6 && (_0x37e9f8['manualGuideOpen'] = ![]);
    !_0x359dc6 && _0x2ef861 && (_0x37e9f8['manualGuideOpen'] = !![]);
    const _0x1786b8 = _0x1a3c16(_0x1c5fc4),
      _0x49d129 = shouldDreaminaManualGuideOpenByDefault(_0x1c5fc4, _0x37e9f8['dismissedSessionKey']);
    !_0x359dc6 && _0x49d129 && (_0x37e9f8['manualGuideOpen'] = !![]);
    const _0x5ad4e9 =
      _0x37e9f8['manualGuideOpen'] ||
      ((_0x53d712 || _0x44277d) && (!!_0x1786b8 ? _0x37e9f8['dismissedSessionKey'] !== _0x1786b8 : !![]));
    if (_0x5ad4e9) _0x11f864();
    else
      ['success', 'reused', 'failed', 'done']['includes'](_0x7c2b45)
        ? _0x2273d1(_0x7c2b45 === 'failed' ? 0x0 : 0x258)
        : _0x87872f({ force: !![], rememberDismissal: ![] });
    (_0x4ef024 &&
      _0x4ef024['classList']['toggle']('dreamina-login-modal--guide-open', !!_0x37e9f8['manualGuideOpen']),
      _0x4a90fb &&
        (_0x4a90fb['textContent'] = _0x359dc6
          ? trDreamina('modalSynced')
          : _0x2ef861
            ? trDreamina('modalBrowserFailed')
            : _0x49d129
              ? trDreamina('modalOAuthStarted')
              : _0x2d64b1
                ? trDreamina('modalPendingTooLong')
                : _0x422703
                  ? trDreamina('modalQrAbnormal')
                  : _0x7c2b45 === 'failed'
                    ? trDreamina('modalRetryAuth')
                    : _0x7c2b45 === 'oauth_ready' || _0x7c2b45 === 'polling'
                      ? trDreamina('modalAuthorizeOnPage')
                      : _0x44277d
                        ? trDreamina('modalScanQr')
                        : String(_0x289607?.['message'] || '')['trim']() ||
                          String(_0x1c5fc4?.['message'] || '')['trim']() ||
                          trDreamina('modalProcessing')),
      _0x4a00a1 && (_0x4a00a1['textContent'] = _0x332593(_0x1c5fc4)),
      _0x435077 && (_0x435077['hidden'] = ![]),
      _0x2c54d3 && (_0x2c54d3['hidden'] = !_0x44277d),
      _0x3a7735 && (_0x44277d ? _0x2dc36a(_0x3a7735, _0x289607) : _0x3a7735['removeAttribute']('src')),
      _0x1aeb65 && (_0x1aeb65['disabled'] = ![]),
      _0xe0750f &&
        ((_0xe0750f['hidden'] = ![]),
        (_0xe0750f['disabled'] = ![]),
        _0x37e9f8['manualGuideOpen']
          ? (_0xe0750f['textContent'] = trDreamina('guideCollapse'))
          : (_0xe0750f['textContent'] = _0x2ef861 ? trDreamina('guideRecommended') : trDreamina('guide'))),
      _0x2c7f81 && _0x2cbe94(_0x1c5fc4));
  }
  function _0x57513f(_0x1c89ea) {
    const {
      statusTextEl: _0x4cc4dc,
      messageTextEl: _0x203267,
      creditTextEl: _0x4572b5,
      btnAuthEl: _0x5e5924,
      btnQrAuthEl: _0x5476a2,
      btnLogoutEl: _0x51943a,
    } = _0x2e7a44();
    if (!_0x4cc4dc) return;
    if (!_0x28c1fb()) return;
    const _0x54ebe3 = _0x1c89ea?.['runtime'] || {},
      _0x41bb42 = !!_0x1c89ea?.['loggedIn'],
      _0x30f299 = !!_0x54ebe3?.['active'],
      _0x51f41a = String(_0x54ebe3?.['phase'] || ''),
      _0x2b81f2 =
        String(_0x54ebe3?.['message'] || '')['trim']() ||
        String(_0x1c89ea?.['message'] || '')['trim']() ||
        trDreamina('notLoggedInHint');
    _0x4cc4dc['textContent'] = _0x5ee1a2(_0x1c89ea);
    _0x203267 && (_0x203267['textContent'] = _0x2b81f2);
    _0x4572b5 &&
      (_0x4572b5['textContent'] = _0x41bb42
        ? _0x4783af(_0x1c89ea?.['credit'])
        : trDreamina('creditPlaceholder'));
    _0x5e5924 &&
      ((_0x5e5924['disabled'] = ![]), (_0x5e5924['textContent'] = getDreaminaWebLoginButtonText(_0x1c89ea)));
    _0x5476a2 &&
      ((_0x5476a2['hidden'] = !![]),
      (_0x5476a2['disabled'] = !![]),
      (_0x5476a2['textContent'] = getDreaminaQrLoginButtonText(_0x1c89ea)));
    _0x51943a && (_0x51943a['disabled'] = _0x30f299 || !_0x41bb42);
    if (_0x30f299) _0x5e6e08();
    else _0x308414();
    ((_0x37e9f8['lastStatus'] = _0x1c89ea), _0x2ada90(_0x1c89ea), _0x49d053(_0x1c89ea), _0x394383(_0x54ebe3));
  }
  async function _0x2e5bc3({ force: force = ![], silent: silent = ![] } = {}) {
    if (!_0x28c1fb()) return null;
    if (typeof _0x40331b !== 'function') return null;
    const _0x162017 = ++_0x37e9f8['statusRequestGeneration'];
    try {
      const _0x2a8435 = await _0x40331b({ refresh: force });
      if (_0x162017 !== _0x37e9f8['statusRequestGeneration']) return _0x2a8435 || {};
      return (_0x57513f(_0x2a8435 || {}), _0x2a8435 || {});
    } catch (_0x5cf8f9) {
      if (_0x162017 !== _0x37e9f8['statusRequestGeneration']) return null;
      if (!silent) {
        const _0x3be03b = _0x5cf8f9?.['message'] || trDreamina('fetchStatusFailed');
        _0x581cb5['showToast']?.(_0x3be03b, 'error');
      }
      return null;
    }
  }
  async function _0x39d25f({ silent: silent = ![] } = {}) {
    if (!_0x28c1fb()) return null;
    if (typeof _0xf8afbc !== 'function') return _0x2e5bc3({ silent: silent });
    try {
      const _0x40d9c8 = await _0xf8afbc(),
        _0xa47f40 = String(_0x40d9c8?.['phase'] || ''),
        _0x38a61b =
          _0xa47f40 === 'idle' &&
          !_0x40d9c8?.['active'] &&
          !Number(_0x40d9c8?.['startedAt'] || 0x0) &&
          Number(_0x37e9f8['loginLaunchRequestedAt'] || 0x0) > 0x0;
      if (_0x38a61b) return _0x37e9f8['lastStatus'] || null;
      const _0x817d06 = mergeDreaminaLoginRuntimeStatus(_0x37e9f8['lastStatus'] || {}, _0x40d9c8 || {});
      _0x57513f(_0x817d06);
      const _0x5844d8 = ['success', 'reused', 'done']['includes'](_0xa47f40),
        _0x3a0df9 = _0x5844d8 || _0xa47f40 === 'failed';
      if (_0x3a0df9) _0x37e9f8['loginLaunchRequestedAt'] = 0x0;
      return (_0x5844d8 && _0x2e5bc3({ force: !![], silent: !![] })['catch'](() => {}), _0x817d06);
    } catch (_0x23979) {
      if (!silent) {
        const _0x15fc1e = _0x23979?.['message'] || trDreamina('fetchStatusFailed');
        _0x581cb5['showToast']?.(_0x15fc1e, 'error');
      }
      return null;
    }
  }
  async function _0x2199b1() {
    if (!_0x28c1fb()) return;
    const _0x1c5b50 = _0x37e9f8['lastStatus']?.['runtime'] || {};
    if (_0x1c5b50?.['active']) {
      (_0x11f864({ clearDismissed: !![] }),
        (_0x37e9f8['manualGuideOpen'] = !![]),
        _0x49d053(_0x37e9f8['lastStatus'] || {}));
      return;
    }
    const _0xef5e3a = !!_0x37e9f8['lastStatus']?.['loggedIn'];
    if (typeof _0x5e8c9f !== 'function') return;
    ((_0x37e9f8['manualGuideOpen'] = !![]),
      (_0x37e9f8['loginLaunchRequestedAt'] = Date['now']()),
      _0x11f864({ clearDismissed: !![] }));
    try {
      const _0x55224e = await _0x5e8c9f({ force: _0xef5e3a });
      if (_0x55224e?.['success'] === ![])
        throw new Error(_0x55224e?.['message'] || trDreamina('startFailed'));
      ((_0x37e9f8['manualGuideOpen'] = !![]),
        _0x55224e?.['status'] && _0x57513f(_0x55224e['status']),
        _0x581cb5['showToast']?.(
          _0xef5e3a ? trDreamina('reloginStarted') : trDreamina('loginStarted'),
          'info',
        ),
        _0x5e6e08());
    } catch (_0x351b6d) {
      _0x581cb5['showToast']?.(_0x351b6d?.['message'] || trDreamina('startFailed'), 'error');
    }
  }
  async function _0x6655d4() {
    await _0x2199b1();
  }
  function _0x3e537a() {
    ((_0x37e9f8['manualGuideOpen'] = !_0x37e9f8['manualGuideOpen']),
      _0x49d053(_0x37e9f8['lastStatus'] || {}));
  }
  async function _0x39e21d() {
    if (!_0x28c1fb()) return;
    if (typeof _0x5801e7 !== 'function') return;
    try {
      const _0x39155b = await _0x5801e7();
      if (_0x39155b?.['success'] === ![])
        throw new Error(_0x39155b?.['message'] || trDreamina('logoutFailed'));
      (_0x39155b?.['status']
        ? _0x57513f(_0x39155b['status'])
        : await _0x2e5bc3({ force: !![], silent: !![] }),
        _0x308414(),
        _0x581cb5['showToast']?.(trDreamina('loggedOut'), 'success'));
    } catch (_0x1fe372) {
      _0x581cb5['showToast']?.(_0x1fe372?.['message'] || trDreamina('logoutFailed'), 'error');
    }
  }
  function _0x231e57() {
    const {
      btnAuthEl: _0x14e277,
      btnQrAuthEl: _0x503bfc,
      btnLogoutEl: _0x2a36e4,
      modalOverlayEl: _0x1f7075,
      modalCloseEl: _0x1cc26b,
      modalQrImageEl: _0x1c628d,
      modalRetryEl: _0x212f9d,
      manualOpenAuthEl: _0x51ac1c,
      manualCopyAuthEl: _0x1b84f0,
      manualImportJsonBtnEl: _0x3f7a78,
    } = _0x2e7a44();
    (_0x49bf13(_0x1c628d),
      _0x14e277?.['addEventListener']('click', () => {
        _0x2199b1()['catch'](() => {});
      }),
      _0x503bfc?.['addEventListener']('click', () => {
        _0x6655d4()['catch'](() => {});
      }),
      _0x2a36e4?.['addEventListener']('click', () => {
        _0x39e21d()['catch'](() => {});
      }),
      _0x1cc26b?.['addEventListener']('click', () => {
        _0x87872f({ force: !![] });
      }),
      _0x212f9d?.['addEventListener']('click', () => {
        _0x3e537a();
      }),
      _0x51ac1c?.['addEventListener']('click', () => {
        _0x4b7468()['catch'](() => {});
      }),
      _0x1b84f0?.['addEventListener']('click', () => {
        _0x957cca()['catch'](() => {});
      }),
      _0x3f7a78?.['addEventListener']('click', () => {
        _0x2b10bf()['catch'](() => {});
      }),
      _0x1f7075?.['addEventListener']('click', (_0xa8c8a6) => {
        if (_0xa8c8a6['target'] !== _0x1f7075) return;
        _0x87872f();
      }),
      _0x58380c['addEventListener']('keydown', (_0x445d0f) => {
        if (_0x445d0f['key'] !== 'Escape') return;
        _0x87872f();
      }));
    if (_0x58380c['body']) {
      const _0x53ad31 = new MutationObserver(() => {
        const _0x1b7fa4 = _0x28c1fb();
        _0x1b7fa4 && _0x2e5bc3({ force: !![], silent: !![] })['catch'](() => {});
      });
      (_0x37e9f8['observer']?.['disconnect']?.(),
        (_0x37e9f8['observer'] = _0x53ad31),
        _0x53ad31['observe'](_0x58380c['body'], { attributes: !![], attributeFilter: ['class'] }));
    }
  }
  const _0x5c201a = (_0x529307) => {
    _0x529307['detail']?.['provider'] === 'dreamina' &&
      ['installed', 'missing']['includes'](_0x529307['detail']['phase']) &&
      _0x2e5bc3({ force: !![], silent: !![] })['catch'](() => {});
  };
  return (
    globalThis['window']?.['addEventListener']?.(CLI_COMPONENT_CHANGED, _0x5c201a),
    {
      destroy() {
        (globalThis['window']?.['removeEventListener']?.(CLI_COMPONENT_CHANGED, _0x5c201a),
          (_0x37e9f8['statusRequestGeneration'] += 0x1),
          _0x308414(),
          _0x32e5b0(),
          _0x37e9f8['observer']?.['disconnect']?.(),
          (_0x37e9f8['observer'] = null));
      },
      init: _0x231e57,
      refreshStatus: _0x2e5bc3,
      syncDevVisibility: _0x28c1fb,
    }
  );
}
