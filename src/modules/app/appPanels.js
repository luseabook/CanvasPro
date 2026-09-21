import { showTutorialVideoPanel } from '../AutoUpdate.js';
import { t } from '../../i18n/index.js';
export function createAppPanels({
  store: _0xfb393f,
  setTextWithLineBreaks: _0xd69fa3,
  getAIGenerationDefaultSizeByType: _0x191cfc,
  createDefaultSubscriptionState: _0x3c36eb,
  isModelAllowed: _0x5ea7df,
  isSubscriptionActive: _0x6c98b0,
  isActivationRequestAccepted: _0xa37438,
  normalizeSubscriptionPayload: _0x5a7448,
  ensureInstallId: _0x557ec9,
  pullSubscriptionState: _0x2a95a0,
  submitCdkey: _0xf47c9e,
  clearSubscriptionAuthorization: _0x139885,
  DEFAULT_VIP_GATE_MODEL_ID: _0x83f922,
} = {}) {
  const _0x57b751 = 'https://api.ashuoai.com/static/contact/wechat.png',
    _0x37b1a4 = 'yumengashuo',
    _0x3d29d7 = 'https://api.ashuoai.com/static/contact/fankui.jpg';
  function _0x2359a2(_0x53d358) {
    const _0x498287 = String(_0x53d358 || '').trim();
    if (!_0x498287) return '';
    if (/^https?:\/\//i.test(_0x498287)) return _0x498287;
    if (_0x498287.startsWith('/')) return _0x498287;
    return '';
  }
  function _0x58519b() {
    return [
      { title: t('appPanels.tutorial.bernini'), url: 'https://www.bilibili.com/video/BV1TwEb6gEsC' },
      { title: t('appPanels.tutorial.usage'), url: 'https://www.bilibili.com/video/BV1RX5z6gEXq/' },
      { title: t('appPanels.tutorial.latest'), url: 'https://www.bilibili.com/video/BV17soQB7EwB' },
      {
        title: t('appPanels.tutorial.scail2FullReview'),
        url: 'https://www.bilibili.com/video/BV16DJH6jEmk/',
      },
      {
        title: t('appPanels.tutorial.characterReplacement'),
        url: 'https://www.bilibili.com/video/BV1YEDKBwEz7',
      },
      { title: t('appPanels.tutorial.panorama'), url: 'https://www.bilibili.com/video/BV1FqdyBwEGx' },
    ];
  }
  function _0x372097() {
    const _0xcee6c4 = document.getElementById('subStatusText'),
      _0x39f48e = document.getElementById('subExpireText'),
      _0x2649b0 = document.getElementById('subscriptionCdkeyInput'),
      _0x311bbb = document.getElementById('btnSubscriptionActivate'),
      _0x513dc1 = document.getElementById('btnSubscriptionClearAuthorization'),
      _0x333fa8 = document.getElementById('subscriptionContactLink'),
      _0x11a9d4 = document.getElementById('subscriptionContactReveal'),
      _0x2d60e5 = document.getElementById('subscriptionContactWechat'),
      _0xf0b340 = [0, 0x1f4, 0x4b0, 0x9c4, 0xfa0],
      _0x367601 = 0x2bc;
    function _0x39a272(_0x2b2868 = '') {
      return t('settings.subscription.contact', {}, _0x2b2868 ? { locale: _0x2b2868 } : {});
    }
    function _0x3a6473(_0x39c48e) {
      const _0x54091a = String(_0x39c48e || '').trim();
      if (!_0x54091a) return true;
      return _0x54091a === _0x39a272('zh-CN') || _0x54091a === _0x39a272('en-US');
    }
    function _0x55cbef(_0x4d0c17) {
      const _0x10c437 = String(_0x4d0c17 || '').trim();
      return _0x3a6473(_0x10c437) ? _0x39a272() : _0x10c437;
    }
    function _0x2788ee(_0x1235a5) {
      return String(_0x1235a5 ?? '').replace(/[&<>"']/g, (_0x143468) => {
        switch (_0x143468) {
          case '&':
            return '&amp;';
          case '<':
            return '&lt;';
          case '>':
            return '&gt;';
          case '"':
            return '&quot;';
          case "'":
            return '&#39;';
          default:
            return _0x143468;
        }
      });
    }
    function _0x14e40c(_0x29dac8) {
      const _0x268bae = Number(_0x29dac8);
      if (!Number.isFinite(_0x268bae) || _0x268bae <= 0) return '-';
      try {
        return new Date(_0x268bae * 0x3e8).toLocaleString();
      } catch {
        return '-';
      }
    }
    function _0x5ab20d(_0x1caced, _0x5a1241, _0x5e214f = true) {
      if (!_0x1caced) return;
      _0x1caced.replaceChildren();
      if (!_0x5a1241) {
        _0x1caced.hidden = true;
        return;
      }
      _0x1caced.hidden = !_0x5e214f;
      const _0x36add1 = document.createElement('span');
      ((_0x36add1.className = 'settings-contact-label'),
        (_0x36add1.textContent = t('settings.subscription.contactInfo.wechatLabel')));
      const _0x4b5683 = document.createElement('input');
      ((_0x4b5683.type = 'text'),
        (_0x4b5683.className = 'settings-contact-copy'),
        (_0x4b5683.value = _0x5a1241),
        (_0x4b5683.readOnly = true),
        _0x4b5683.setAttribute('aria-label', t('settings.subscription.contactInfo.wechatAria')),
        _0x4b5683.addEventListener('focus', () => _0x4b5683.select()),
        _0x4b5683.addEventListener('click', () => {
          (_0x4b5683.focus(), _0x4b5683.select());
        }),
        _0x1caced.append(_0x36add1, _0x4b5683));
    }
    function _0x4dd777(_0x42455f, _0x4c82f5, _0x905517) {
      if (!_0x42455f) return;
      (_0x42455f.replaceChildren(), _0x42455f.classList.toggle('has-contact-image', !!_0x4c82f5));
      if (!_0x4c82f5) {
        if (_0x905517) return;
        const _0x36ec58 = document.createElement('span');
        ((_0x36ec58.className = 'settings-contact-fallback'),
          (_0x36ec58.textContent = t('settings.subscription.contactInfo.qrNotConfigured')),
          _0x42455f.appendChild(_0x36ec58));
        return;
      }
      const _0xb5b498 = document.createElement('img');
      ((_0xb5b498.className = 'settings-contact-qr'),
        (_0xb5b498.alt = t('settings.subscription.contactInfo.qrAlt')),
        (_0xb5b498.loading = 'lazy'),
        (_0xb5b498.decoding = 'async'),
        (_0xb5b498.referrerPolicy = 'no-referrer'),
        (_0xb5b498.src = _0x4c82f5),
        _0xb5b498.addEventListener('error', () => {
          _0xb5b498.hidden = true;
          const _0xf28e90 = document.createElement('div');
          ((_0xf28e90.className = 'settings-contact-hint'),
            (_0xf28e90.textContent = t('settings.subscription.contactInfo.qrLoadFailed')),
            _0x42455f.appendChild(_0xf28e90),
            _0x42455f.classList.add('has-contact-error'));
        }),
        _0x42455f.appendChild(_0xb5b498));
    }
    function _0x50ad07(_0x53ed6a, _0x1633b3, _0x74238f, _0x302f2a = '', _0x5682a9 = '', _0x194e45 = null) {
      if (!_0x53ed6a) return;
      _0x53ed6a.textContent = _0x55cbef(_0x74238f);
      const _0x24bb90 = _0x2359a2(_0x302f2a || _0x57b751),
        _0x606c48 = String(_0x5682a9 || _0x37b1a4).trim();
      _0x194e45 && _0x5ab20d(_0x194e45, _0x606c48, _0x194e45.hidden === false);
      _0x4dd777(_0x1633b3, _0x24bb90, !!_0x606c48);
      if (!_0x194e45 && _0x1633b3 && _0x606c48) {
        const _0x3f4b10 = document.createElement('div');
        ((_0x3f4b10.className = 'settings-contact-wechat'),
          _0x1633b3.appendChild(_0x3f4b10),
          _0x5ab20d(_0x3f4b10, _0x606c48));
      }
    }
    function _0x2b1d62(_0x511898, _0x33be9a, _0x13467c = null) {
      if (!_0x511898 || !_0x33be9a || _0x511898.dataset.contactRevealBound === '1') return;
      ((_0x511898.dataset.contactRevealBound = '1'),
        _0x511898.addEventListener('click', () => {
          _0x33be9a.hidden = false;
          if (_0x13467c?.children?.length) _0x13467c.hidden = false;
        }));
    }
    function _0x340374(_0x2c77fc) {
      const _0x35d6d4 = _0x2c77fc || _0x3c36eb();
      if (_0xcee6c4) {
        let _0x26ebdb = t('settings.subscription.inactive');
        if (_0x35d6d4.loading) _0x26ebdb = t('settings.subscription.loading');
        else {
          if (String(_0x35d6d4.status || '').toLowerCase() === 'active')
            _0x26ebdb = t('settings.subscription.active');
          else _0x35d6d4.status === 'expired' && (_0x26ebdb = t('settings.subscription.expired'));
        }
        _0xcee6c4.textContent = _0x26ebdb;
      }
      (_0x39f48e &&
        (_0x39f48e.textContent =
          '' + t('settings.subscription.expirePrefix') + _0x14e40c(_0x35d6d4.expiresAt)),
        _0x333fa8 &&
          _0x50ad07(
            _0x333fa8,
            _0x11a9d4,
            _0x35d6d4.contactText,
            _0x35d6d4.contactUrl || '',
            _0x35d6d4.contactWechat || _0x37b1a4,
            _0x2d60e5,
          ));
    }
    function _0x8314ed() {
      return Boolean(window.AI_CANVAS_IS_DEV_BUILD || window.LOCAL_DEV_BUILD);
    }
    function _0x2bfcba() {
      if (!_0x513dc1) return;
      _0x513dc1.hidden = !_0x8314ed();
    }
    function _0x1bd3d3() {
      return _0xfb393f.getStateRaw().subscription || _0x3c36eb();
    }
    function _0x9b3bc4(_0x83923d) {
      const _0x2f5ce8 = _0x5a7448(_0x83923d || {});
      if (!_0x6c98b0(_0x2f5ce8)) return false;
      const _0x2c1ca9 = _0x1bd3d3();
      return (
        _0xfb393f.setSubscriptionState({
          ..._0x2c1ca9,
          ..._0x2f5ce8,
          loading: false,
          error: null,
          lastSyncAt: Date.now(),
        }),
        true
      );
    }
    function _0x1289b9() {
      return !!document.getElementById('subscriptionGateOverlay');
    }
    async function _0x3bf00b() {
      const _0x24d91e = _0x1bd3d3();
      _0xfb393f.setSubscriptionState({ ..._0x24d91e, loading: true, error: null });
      const _0x4a965d = await _0x557ec9();
      if (!String(_0x4a965d || '').trim())
        return (
          _0xfb393f.setSubscriptionState({
            loading: false,
            status: 'none',
            expiresAt: null,
            error: t('settings.subscription.missingInstallIdSync'),
            lastSyncAt: Date.now(),
          }),
          _0x1bd3d3()
        );
      try {
        const _0x21783c = _0x1bd3d3(),
          _0x5b981d = await _0x2a95a0(_0x4a965d);
        return (
          _0xfb393f.setSubscriptionState({
            ..._0x5b981d,
            expiresAt: _0x5b981d?.expiresAt ?? _0x21783c?.expiresAt ?? null,
            loading: false,
            error: null,
            lastSyncAt: Date.now(),
          }),
          _0x1bd3d3()
        );
      } catch (_0x2da8db) {
        return (
          _0xfb393f.setSubscriptionState({
            status: 'none',
            expiresAt: null,
            loading: false,
            error: _0x2da8db?.message || t('settings.subscription.syncFailed'),
            lastSyncAt: Date.now(),
          }),
          _0x1bd3d3()
        );
      }
    }
    async function _0x5cad8d(_0x5f4ce1, _0x4a9394 = {}) {
      const _0x347cec = typeof _0x4a9394?.onProgress === 'function' ? _0x4a9394.onProgress : null,
        _0x19d498 =
          Array.isArray(_0x4a9394?.retryScheduleMs) && _0x4a9394.retryScheduleMs.length > 0
            ? _0x4a9394.retryScheduleMs
            : _0xf0b340,
        _0x32ea43 = String(_0x5f4ce1 || '').trim();
      if (!_0x32ea43) return (window.showToast?.(t('settings.subscription.enterCdkey'), 'warn'), false);
      const _0x1bcf03 = await _0x557ec9();
      if (!String(_0x1bcf03 || '').trim())
        return (window.showToast?.(t('settings.subscription.missingInstallIdActivate'), 'error'), false);
      let _0x497134 = null,
        _0x133c84 = null;
      for (let _0x5cec24 = 0; _0x5cec24 < 2; _0x5cec24 += 1) {
        try {
          ((_0x497134 = await _0xf47c9e(_0x1bcf03, _0x32ea43)), (_0x133c84 = null));
          break;
        } catch (_0x272429) {
          _0x133c84 = _0x272429;
          if (_0x5cec24 >= 1) break;
          await new Promise((_0x3cf302) => setTimeout(_0x3cf302, _0x367601));
        }
      }
      if (_0x133c84) throw _0x133c84;
      if (!_0xa37438(_0x497134)) {
        const _0x4e0fae = _0x497134?.message || t('settings.subscription.activationFailed');
        return (window.showToast?.(_0x4e0fae, 'error'), false);
      }
      if (_0x9b3bc4(_0x497134)) return (window.showToast?.(t('settings.subscription.activated')), true);
      window.showToast?.(t('settings.subscription.submitted'));
      for (let _0x492b6d = 0; _0x492b6d < _0x19d498.length; _0x492b6d += 1) {
        const _0x3c5e09 = _0x19d498[_0x492b6d];
        _0x347cec?.({ phase: 'checking', attempt: _0x492b6d + 1, total: _0x19d498.length });
        if (_0x3c5e09 > 0) await new Promise((_0xa28ef5) => setTimeout(_0xa28ef5, _0x3c5e09));
        const _0x39926f = await _0x3bf00b();
        if (_0x6c98b0(_0x39926f)) return (window.showToast?.(t('settings.subscription.activated')), true);
      }
      const _0x36ee96 = _0x1bd3d3(),
        _0x2402d8 = String(_0x36ee96.error || _0x497134?.message || '').trim();
      return (
        _0x2402d8
          ? window.showToast?.(
              t('settings.subscription.serverNotConfirmed') + ' (' + _0x2402d8 + ')',
              'warning',
            )
          : window.showToast?.(t('settings.subscription.serverNotConfirmed'), 'warning'),
        false
      );
    }
    async function _0x1f8db4() {
      if (!_0x8314ed() || typeof _0x139885 !== 'function') return false;
      const _0x3c0caa = window.confirm?.(t('settings.subscription.clearConfirm'));
      if (_0x3c0caa === false) return false;
      const _0x46459f = _0x513dc1?.textContent || t('settings.subscription.clearAuthorization');
      _0x513dc1 &&
        ((_0x513dc1.disabled = true), (_0x513dc1.textContent = t('settings.subscription.clearing')));
      try {
        await _0x139885();
        const _0x48b201 = _0x1bd3d3(),
          _0x68c52b = _0x3c36eb();
        return (
          _0xfb393f.setSubscriptionState({
            ..._0x68c52b,
            contactText: _0x48b201.contactText || _0x68c52b.contactText,
            contactUrl: _0x48b201.contactUrl || _0x68c52b.contactUrl,
            contactWechat: _0x48b201.contactWechat || _0x68c52b.contactWechat,
            loading: false,
            status: 'none',
            expiresAt: null,
            entitledModelKeys: [],
            entitledModelIds: [],
            error: null,
            lastSyncAt: Date.now(),
            deviceId: '',
          }),
          window.showToast?.(t('settings.subscription.clearSuccess')),
          true
        );
      } catch (_0x473daf) {
        return (
          window.showToast?.(_0x473daf?.message || t('settings.subscription.clearFailed'), 'error'),
          false
        );
      } finally {
        _0x513dc1 && ((_0x513dc1.disabled = false), (_0x513dc1.textContent = _0x46459f));
      }
    }
    function _0x3c2511(_0x4febc7 = _0x83f922, _0x46433a = '', _0x2ef7d0 = null) {
      if (_0x1289b9()) return;
      const _0x5a8b0e = document.createElement('div');
      ((_0x5a8b0e.id = 'subscriptionGateOverlay'), (_0x5a8b0e.className = 'subscription-gate-overlay'));
      const _0x43af8f = _0x1bd3d3();
      ((_0x5a8b0e.innerHTML =
        '\n        <div class="subscription-gate-dialog" role="dialog" aria-modal="true" aria-label="' +
        _0x2788ee(t('settings.subscription.gate.aria')) +
        '">\n          <div class="subscription-gate-title">' +
        _0x2788ee(t('settings.subscription.gate.title')) +
        '</div>\n          <div class="subscription-gate-desc">' +
        _0x2788ee(t('settings.subscription.gate.desc')) +
        '</div>\n          <input type="text" class="settings-input" id="gateCdkeyInput" placeholder="' +
        _0x2788ee(t('settings.subscription.gate.cdkeyPlaceholder')) +
        '">\n          <div class="settings-subscription-contact">\n            <button type="button" id="gateContactLink" class="settings-getkey settings-contact-trigger"></button>\n            <div id="gateContactReveal" class="settings-contact-reveal" hidden></div>\n          </div>\n          <div class="subscription-gate-actions">\n            <button type="button" class="subscription-gate-btn" id="gateCancelBtn">' +
        _0x2788ee(t('settings.subscription.gate.cancel')) +
        '</button>\n            <button type="button" class="subscription-gate-btn is-primary" id="gateSubmitBtn">' +
        _0x2788ee(t('settings.subscription.gate.activate')) +
        '</button>\n          </div>\n        </div>\n      '),
        document.body.appendChild(_0x5a8b0e));
      const _0x3b6d11 = () => _0x5a8b0e.remove();
      (_0x5a8b0e.addEventListener('click', (_0x4bc345) => {
        if (_0x4bc345.target === _0x5a8b0e) _0x3b6d11();
      }),
        _0x5a8b0e.querySelector('#gateCancelBtn')?.addEventListener('click', _0x3b6d11),
        _0x50ad07(
          _0x5a8b0e.querySelector('#gateContactLink'),
          _0x5a8b0e.querySelector('#gateContactReveal'),
          _0x43af8f.contactText,
          _0x43af8f.contactUrl || '',
          _0x43af8f.contactWechat || SUBSCRIPTION_CONTACT_WECHAT_FALLBACK,
        ),
        _0x2b1d62(
          _0x5a8b0e.querySelector('#gateContactLink'),
          _0x5a8b0e.querySelector('#gateContactReveal'),
        ));
      const _0x211f7c = _0x5a8b0e.querySelector('#gateSubmitBtn'),
        _0x4414b9 = _0x5a8b0e.querySelector('#gateCdkeyInput');
      let _0x51bf50 = false;
      _0x5a8b0e.querySelector('#gateSubmitBtn')?.addEventListener('click', async () => {
        if (_0x51bf50) return;
        _0x51bf50 = true;
        const _0x13e8e1 = _0x211f7c?.textContent || t('settings.subscription.gate.activate');
        _0x211f7c &&
          ((_0x211f7c.disabled = true),
          (_0x211f7c.textContent = t('settings.subscription.checking') + ' 1/4'));
        if (_0x4414b9) _0x4414b9.disabled = true;
        let _0x388007 = false;
        try {
          _0x388007 = await _0x5cad8d(_0x4414b9?.value, {
            onProgress: ({ attempt: _0x2a2485, total: _0x4bf632 }) => {
              if (!_0x211f7c || !_0x211f7c.isConnected) return;
              _0x211f7c.textContent = t('settings.subscription.checking') + ' ' + _0x2a2485 + '/' + _0x4bf632;
            },
            retryScheduleMs: _0xf0b340,
          });
        } catch (_0x38715b) {
          (window.showToast?.(_0x38715b?.message || t('settings.subscription.gateFailed'), 'error'),
            (_0x388007 = false));
        }
        if (_0x388007) {
          _0x3b6d11();
          if (typeof _0x2ef7d0 === 'function')
            try {
              _0x2ef7d0();
            } catch {}
          return;
        }
        ((_0x51bf50 = false),
          _0x211f7c &&
            _0x211f7c.isConnected &&
            ((_0x211f7c.disabled = false), (_0x211f7c.textContent = _0x13e8e1)),
          _0x4414b9 && _0x4414b9.isConnected && ((_0x4414b9.disabled = false), _0x4414b9.focus()));
      });
    }
    async function _0x5208c3(_0x3c4974 = _0x83f922, _0x32b63f = '', _0x488fab = null) {
      const _0x2b26a8 = _0x1bd3d3(),
        _0x2306e0 =
          typeof _0x5ea7df === 'function' ? _0x5ea7df(_0x3c4974, _0x2b26a8, _0x32b63f) : _0x6c98b0(_0x2b26a8);
      if (_0x2306e0) {
        const _0x14ca9c = String(_0x488fab?.message || '').trim();
        window.showToast?.(_0x14ca9c || t('settings.subscription.activeSyncTip'), 'warning');
        try {
          await _0x3bf00b();
        } catch {}
        return;
      }
      if (_0x1289b9()) return;
      _0x3c2511(_0x3c4974, _0x32b63f);
    }
    ((window.openSubscriptionDialog = ({
      modelId: modelId = _0x83f922,
      provider: provider = '',
      onSuccess: onSuccess = null,
    } = {}) => {
      const _0x3ca6a9 = _0x1bd3d3();
      if (typeof _0x5ea7df === 'function' && _0x5ea7df(modelId, _0x3ca6a9, provider)) return;
      if (_0x1289b9()) return;
      _0x3c2511(modelId, provider, onSuccess);
    }),
      (window.isModelAllowedBySubscription = (_0x4ce433, _0x3ff3cc = '') =>
        _0x5ea7df(_0x4ce433, _0xfb393f.getStateRaw().subscription || {}, _0x3ff3cc)),
      (window.getSubscriptionState = () => _0x1bd3d3()),
      (window.ensureSubscriptionInstallId = _0x557ec9),
      (window.refreshSubscriptionState = _0x3bf00b),
      (window.handleSubscriptionRequired = ({
        modelId: modelId = _0x83f922,
        provider: provider = '',
        error: error = null,
      } = {}) => _0x5208c3(modelId, provider, error)),
      _0x311bbb &&
        _0x311bbb.addEventListener('click', async () => {
          const _0x5e0240 = await _0x5cad8d(_0x2649b0?.value);
          if (_0x5e0240 && _0x2649b0) _0x2649b0.value = '';
        }),
      _0x513dc1 &&
        (_0x513dc1.addEventListener('click', () => {
          void _0x1f8db4();
        }),
        _0x2bfcba(),
        window.addEventListener?.('aicanvas:runtime-info', _0x2bfcba)),
      _0x2b1d62(_0x333fa8, _0x11a9d4, _0x2d60e5),
      _0xfb393f.subscribeSelector(
        (_0x4add56) => _0x4add56.subscription,
        (_0x2d93f8) => _0x340374(_0x2d93f8),
      ),
      void _0x3bf00b());
  }
  function _0x2f34a1() {
    const _0x5c6cd4 = document.getElementById('aiPanel'),
      _0x27b475 = document.getElementById('aiPanelToggle');
    if (_0x5c6cd4 && _0x27b475) {
      const _0x3ee78d = 'http://www.w3.org/2000/svg';
      function _0x1459c7(_0x4c5754) {
        _0x27b475.replaceChildren();
        const _0x2ade78 = document.createElementNS(_0x3ee78d, 'svg');
        (_0x2ade78.setAttribute('width', '14'),
          _0x2ade78.setAttribute('height', '14'),
          _0x2ade78.setAttribute('viewBox', '0 0 24 24'),
          _0x2ade78.setAttribute('fill', 'none'),
          _0x2ade78.setAttribute('stroke', 'currentColor'),
          _0x2ade78.setAttribute('stroke-width', '2'));
        const _0x4c6224 = document.createElementNS(_0x3ee78d, 'polyline');
        (_0x4c6224.setAttribute('points', _0x4c5754 ? '15 18 9 12 15 6' : '9 18 15 12 9 6'),
          _0x2ade78.appendChild(_0x4c6224),
          _0x27b475.appendChild(_0x2ade78));
      }
      _0x27b475.addEventListener('click', () => {
        (_0x5c6cd4.classList.toggle('collapsed'), _0x1459c7(_0x5c6cd4.classList.contains('collapsed')));
      });
    }
    const _0x15d4b7 = document.getElementById('aiTipGot'),
      _0x14082b = document.getElementById('aiTipCard');
    _0x15d4b7 &&
      _0x14082b &&
      _0x15d4b7.addEventListener('click', () => {
        ((_0x14082b.style.opacity = '0'),
          (_0x14082b.style.maxHeight = '0px'),
          setTimeout(() => _0x14082b.remove(), 0x140));
      });
    const _0x2506ea = document.getElementById('aiTextarea');
    _0x2506ea &&
      _0x2506ea.addEventListener('input', () => {
        ((_0x2506ea.style.height = 'auto'),
          (_0x2506ea.style.height = Math.min(_0x2506ea.scrollHeight, 120) + 'px'));
      });
    const _0x54321e = document.getElementById('aiMessages'),
      _0x29e097 = document.getElementById('aiStartBtn'),
      _0x32d11d = document.getElementById('aiStartWrap'),
      _0x1d220f = document.getElementById('aiSend');
    function _0x4449e3() {
      return [
        t('appPanels.aiAssistant.responses.idea'),
        t('appPanels.aiAssistant.responses.prompt'),
        t('appPanels.aiAssistant.responses.connect'),
        t('appPanels.aiAssistant.responses.optimize'),
      ];
    }
    function _0x55a358(_0x3d6d7e) {
      if (!_0x54321e) return;
      const _0x43abe4 = document.createElement('div');
      _0x43abe4.className = 'ai-msg ai';
      const _0xe7a68b = document.createElement('div');
      ((_0xe7a68b.className = 'ai-msg-avatar'), (_0xe7a68b.textContent = 'A'));
      const _0x221e13 = document.createElement('div');
      ((_0x221e13.className = 'ai-msg-bubble'),
        _0xd69fa3(_0x221e13, _0x3d6d7e),
        _0x43abe4.appendChild(_0xe7a68b),
        _0x43abe4.appendChild(_0x221e13),
        _0x54321e.appendChild(_0x43abe4),
        (_0x54321e.scrollTop = _0x54321e.scrollHeight));
    }
    function _0x43fdc5(_0x579a31) {
      if (!_0x54321e) return;
      const _0x528b8f = document.createElement('div');
      _0x528b8f.className = 'ai-msg user';
      const _0x5dfd46 = document.createElement('div');
      ((_0x5dfd46.className = 'ai-msg-avatar'),
        (_0x5dfd46.style.background = 'var(--indigo)'),
        (_0x5dfd46.textContent = 'U'));
      const _0x5b0844 = document.createElement('div');
      ((_0x5b0844.className = 'ai-msg-bubble'),
        _0xd69fa3(_0x5b0844, _0x579a31),
        _0x528b8f.appendChild(_0x5dfd46),
        _0x528b8f.appendChild(_0x5b0844),
        _0x54321e.appendChild(_0x528b8f),
        (_0x54321e.scrollTop = _0x54321e.scrollHeight));
    }
    function _0x223ca6() {
      if (!_0x2506ea) return;
      const _0x5b91ab = _0x2506ea.value.trim();
      if (!_0x5b91ab) return;
      (_0x43fdc5(_0x5b91ab), (_0x2506ea.value = ''), (_0x2506ea.style.height = 'auto'));
      if (_0x32d11d) _0x32d11d.style.display = 'none';
      const _0xbfd9d2 = document.createElement('div');
      _0xbfd9d2.className = 'ai-msg ai loading';
      const _0x566ee1 = document.createElement('div');
      ((_0x566ee1.className = 'ai-msg-avatar'), (_0x566ee1.textContent = 'A'));
      const _0xdbf73f = document.createElement('div');
      _0xdbf73f.className = 'ai-msg-bubble';
      for (let _0x5490fb = 0; _0x5490fb < 3; _0x5490fb += 1) {
        const _0x583217 = document.createElement('span');
        ((_0x583217.className = 'dot'), _0xdbf73f.appendChild(_0x583217));
      }
      (_0xbfd9d2.appendChild(_0x566ee1),
        _0xbfd9d2.appendChild(_0xdbf73f),
        _0x54321e.appendChild(_0xbfd9d2),
        (_0x54321e.scrollTop = _0x54321e.scrollHeight),
        setTimeout(() => {
          _0xbfd9d2.remove();
          const _0x27c711 = _0x4449e3(),
            _0x242174 = _0x27c711[Math.floor(Math.random() * _0x27c711.length)];
          _0x55a358(_0x242174);
        }, 0x4b0));
    }
    _0x29e097 &&
      _0x29e097.addEventListener('click', () => {
        if (_0x32d11d) _0x32d11d.style.display = 'none';
        _0x55a358(t('appPanels.aiAssistant.greeting'));
        if (_0x2506ea) _0x2506ea.focus();
      });
    if (_0x1d220f) _0x1d220f.addEventListener('click', _0x223ca6);
    _0x2506ea &&
      _0x2506ea.addEventListener('keydown', (_0x173e37) => {
        _0x173e37.key === 'Enter' && !_0x173e37.shiftKey && (_0x173e37.preventDefault(), _0x223ca6());
      });
  }
  function _0x2c856e() {
    const _0x5e550 = document.getElementById('emptyHint');
    if (!_0x5e550) return;
    function _0x28564c(_0x4435ab) {
      if (!window._isAppLoaded) {
        _0x5e550.classList.add('hidden');
        return;
      }
      if (_0x4435ab === 0) _0x5e550.classList.remove('hidden');
      else _0x5e550.classList.add('hidden');
    }
    ((window._checkEmptyHint = () => _0x28564c(_0xfb393f.getStateRaw()._nodeCount || 0)),
      _0xfb393f.subscribeSelector((_0x2f0998) => _0x2f0998._nodeCount || 0, _0x28564c),
      _0x28564c(_0xfb393f.getStateRaw()._nodeCount || 0));
    const _0x4fc5e7 = { text: 'ai-text', image: 'ai-image', video: 'ai-video', 'test-video': 'test-video' };
    _0x5e550.querySelectorAll('.pill-btn').forEach((_0xb4eeb9) => {
      _0xb4eeb9.addEventListener('click', (_0x5a1954) => {
        _0x5a1954.stopPropagation();
        const _0x4d690f = _0xb4eeb9.dataset.type,
          _0x1ddd4d = _0x4fc5e7[_0x4d690f];
        if (!_0x1ddd4d) return;
        const _0x1df47c = _0xfb393f.getState().viewport,
          _0xc4bd64 = (window.innerWidth / 2 - _0x1df47c.x) / _0x1df47c.zoom,
          _0x30c3af = (window.innerHeight / 2 - _0x1df47c.y) / _0x1df47c.zoom,
          _0x1fbc5d = 'node-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
          _0x5d92d8 =
            typeof _0x191cfc === 'function' ? _0x191cfc(_0x1ddd4d) : { width: 0x12c, height: 0x12c },
          _0x5fc2fd = _0x5d92d8.width,
          _0xc44532 = _0x5d92d8.height;
        (_0xfb393f.addNode({
          id: _0x1fbc5d,
          type: _0x1ddd4d,
          x: _0xc4bd64 - _0x5fc2fd / 2,
          y: _0x30c3af - _0xc44532 / 2,
          width: _0x5fc2fd,
          height: _0xc44532,
          name:
            _0x4d690f === 'text'
              ? t('appPanels.emptyHint.textNode')
              : _0x4d690f === 'image'
                ? t('appPanels.emptyHint.imageNode')
                : t('appPanels.emptyHint.videoNode'),
          needsAutoResize: _0x1ddd4d === 'ai-image' || _0x1ddd4d === 'ai-video',
        }),
          _0xfb393f.setSelectedNodes([_0x1fbc5d]));
      });
    });
  }
  function _0x2bf494() {
    const _0x1f9392 = document.getElementById('aboutOverlay'),
      _0x184017 = document.getElementById('aboutClose'),
      _0x918d0e = document.querySelector('meta[name="app-version"]')?.getAttribute('content') || 'V0.0.1',
      _0x1d926d = document.getElementById('aboutVersion');
    if (_0x1d926d) _0x1d926d.innerText = _0x918d0e;
    function _0x5083a7() {
      if (_0x1f9392) _0x1f9392.style.display = 'flex';
    }
    function _0x3d8f14() {
      if (_0x1f9392) _0x1f9392.style.display = 'none';
    }
    function _0x32108d() {
      document.getElementById('avatarMenu')?.classList.remove('open');
    }
    (document.getElementById('btnAbout')?.addEventListener('click', (_0x141af0) => {
      (_0x141af0.stopPropagation(), _0x32108d(), _0x5083a7());
    }),
      document.getElementById('btnTutorial')?.addEventListener('click', (_0x374370) => {
        (_0x374370.stopPropagation(), _0x32108d(), showTutorialVideoPanel(_0x58519b()));
      }),
      document.querySelectorAll('#btnGithubOfficial, #btnFeatureFeedback').forEach((_0x432b11) => {
        _0x432b11.addEventListener('click', () => {
          _0x32108d();
        });
      }),
      _0x184017?.addEventListener('click', _0x3d8f14),
      _0x1f9392?.addEventListener('click', (_0x490c7c) => {
        if (_0x490c7c.target === _0x1f9392) _0x3d8f14();
      }));
    let _0x58efb9 = 0,
      _0x5096a5 = null;
    _0x1d926d?.addEventListener('click', () => {
      (_0x58efb9++, clearTimeout(_0x5096a5));
      if (_0x58efb9 >= 7)
        ((_0x58efb9 = 0),
          (window.DEV_MODE = !window.DEV_MODE),
          document.body.classList.toggle('dev-mode', window.DEV_MODE),
          window.dispatchEvent(new CustomEvent('dev-mode-changed', { detail: { enabled: window.DEV_MODE } })),
          _0x3d8f14(),
          window.showToast?.(
            window.DEV_MODE ? t('appPanels.devMode.entered') : t('appPanels.devMode.exited'),
          ));
      else
        _0x58efb9 >= 4 &&
          window.showToast?.(
            t('appPanels.devMode.clickHint', {
              count: 7 - _0x58efb9,
              action: window.DEV_MODE
                ? t('appPanels.devMode.exitAction')
                : t('appPanels.devMode.enterAction'),
            }),
          );
      _0x5096a5 = setTimeout(() => {
        _0x58efb9 = 0;
      }, 0x7d0);
    });
  }
  function _0xdb21f0() {
    const _0x31c417 = document.getElementById('feedbackGroupOverlay'),
      _0x11d923 = document.getElementById('btnFeedbackGroup'),
      _0x125eae = document.getElementById('feedbackGroupClose'),
      _0x20d8f9 = document.getElementById('feedbackGroupQrImage'),
      _0x29a116 = document.getElementById('feedbackGroupQrError');
    function _0x558244() {
      document.getElementById('avatarMenu')?.classList.remove('open');
    }
    function _0x10f332() {
      return _0x3d29d7;
    }
    function _0xf45734() {
      _0x558244();
      if (!_0x31c417) return;
      if (_0x29a116) _0x29a116.hidden = true;
      (_0x20d8f9 &&
        ((_0x20d8f9.hidden = false),
        (_0x20d8f9.loading = 'lazy'),
        (_0x20d8f9.decoding = 'async'),
        (_0x20d8f9.referrerPolicy = 'no-referrer'),
        (_0x20d8f9.src = _0x10f332())),
        (_0x31c417.hidden = false),
        _0x125eae?.focus?.({ preventScroll: true }));
    }
    function _0x3c0e7f() {
      if (_0x31c417) _0x31c417.hidden = true;
    }
    (_0x11d923?.addEventListener('click', (_0x1c9b48) => {
      (_0x1c9b48.stopPropagation(), _0xf45734());
    }),
      _0x125eae?.addEventListener('click', _0x3c0e7f),
      _0x31c417?.addEventListener('click', (_0x3e8049) => {
        if (_0x3e8049.target === _0x31c417) _0x3c0e7f();
      }),
      _0x20d8f9?.addEventListener('error', () => {
        _0x20d8f9.hidden = true;
        if (_0x29a116) _0x29a116.hidden = false;
      }),
      document.addEventListener('keydown', (_0x3c0c1e) => {
        _0x3c0c1e.key === 'Escape' && _0x31c417 && !_0x31c417.hidden && _0x3c0e7f();
      }));
  }
  function _0x4005ab() {
    (_0x372097(), _0x2f34a1(), _0x2c856e(), _0xdb21f0(), _0x2bf494());
  }
  return { init: _0x4005ab };
}
