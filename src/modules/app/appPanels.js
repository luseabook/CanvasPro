import { showTutorialVideoPanel } from '../AutoUpdate.js';
import { t } from '../../i18n/index.js';
export function createAppPanels({
  store: store,
  setTextWithLineBreaks: setTextWithLineBreaks,
  getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
  createDefaultSubscriptionState: createDefaultSubscriptionState,
  isModelAllowed: isModelAllowed,
  isSubscriptionActive: isSubscriptionActive,
  isActivationRequestAccepted: isActivationRequestAccepted,
  normalizeSubscriptionPayload: normalizeSubscriptionPayload,
  ensureInstallId: ensureInstallId,
  pullSubscriptionState: pullSubscriptionState,
  submitCdkey: submitCdkey,
  clearSubscriptionAuthorization: clearSubscriptionAuthorization,
  DEFAULT_VIP_GATE_MODEL_ID: DEFAULT_VIP_GATE_MODEL_ID,
} = {}) {
  const value = 'https://api.ashuoai.com/static/contact/wechat.png',
    item = 'yumengashuo',
    key = 'https://api.ashuoai.com/static/contact/fankui.jpg';
  function run(index) {
    const enabled = String(index || '').trim();
    if (!enabled) return '';
    if (/^https?:\/\//i.test(enabled)) return enabled;
    if (enabled.startsWith('/')) return enabled;
    return '';
  }
  function run2() {
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
  function run3() {
    const el = document.getElementById('subStatusText'),
      el2 = document.getElementById('subExpireText'),
      el3 = document.getElementById('subscriptionCdkeyInput'),
      el4 = document.getElementById('btnSubscriptionActivate'),
      el5 = document.getElementById('btnSubscriptionClearAuthorization'),
      result = document.getElementById('subscriptionContactLink'),
      data = document.getElementById('subscriptionContactReveal'),
      options = document.getElementById('subscriptionContactWechat'),
      retryScheduleMs = [0, 0x1f4, 0x4b0, 0x9c4, 0xfa0],
      target = 0x2bc;
    function run4(locale = '') {
      return t('settings.subscription.contact', {}, locale ? { locale: locale } : {});
    }
    function run5(source) {
      const enabled2 = String(source || '').trim();
      if (!enabled2) return true;
      return enabled2 === run4('zh-CN') || enabled2 === run4('en-US');
    }
    function run6(next) {
      const current = String(next || '').trim();
      return run5(current) ? run4() : current;
    }
    function run7(entry) {
      return String(entry ?? '').replace(/[&<>"']/g, (record) => {
        switch (record) {
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
            return record;
        }
      });
    }
    function run8(payload) {
      const count = Number(payload);
      if (!Number.isFinite(count) || count <= 0) return '-';
      try {
        return new Date(count * 0x3e8).toLocaleString();
      } catch {
        return '-';
      }
    }
    function run9(el6, enabled3, enabled4 = true) {
      if (!el6) return;
      el6.replaceChildren();
      if (!enabled3) {
        el6.hidden = true;
        return;
      }
      el6.hidden = !enabled4;
      const el7 = document.createElement('span');
      ((el7.className = 'settings-contact-label'),
        (el7.textContent = t('settings.subscription.contactInfo.wechatLabel')));
      const el8 = document.createElement('input');
      ((el8.type = 'text'),
        (el8.className = 'settings-contact-copy'),
        (el8.value = enabled3),
        (el8.readOnly = true),
        el8.setAttribute('aria-label', t('settings.subscription.contactInfo.wechatAria')),
        el8.addEventListener('focus', () => el8.select()),
        el8.addEventListener('click', () => {
          (el8.focus(), el8.select());
        }),
        el6.append(el7, el8));
    }
    function run10(el9, enabled5, handle) {
      if (!el9) return;
      (el9.replaceChildren(), el9.classList.toggle('has-contact-image', !!enabled5));
      if (!enabled5) {
        if (handle) return;
        const el10 = document.createElement('span');
        ((el10.className = 'settings-contact-fallback'),
          (el10.textContent = t('settings.subscription.contactInfo.qrNotConfigured')),
          el9.appendChild(el10));
        return;
      }
      const el11 = document.createElement('img');
      ((el11.className = 'settings-contact-qr'),
        (el11.alt = t('settings.subscription.contactInfo.qrAlt')),
        (el11.loading = 'lazy'),
        (el11.decoding = 'async'),
        (el11.referrerPolicy = 'no-referrer'),
        (el11.src = enabled5),
        el11.addEventListener('error', () => {
          el11.hidden = true;
          const el12 = document.createElement('div');
          ((el12.className = 'settings-contact-hint'),
            (el12.textContent = t('settings.subscription.contactInfo.qrLoadFailed')),
            el9.appendChild(el12),
            el9.classList.add('has-contact-error'));
        }),
        el9.appendChild(el11));
    }
    function run11(el13, el14, state, config = '', scope = '', el15 = null) {
      if (!el13) return;
      el13.textContent = run6(state);
      const input = run(config || value),
        enabled6 = String(scope || item).trim();
      el15 && run9(el15, enabled6, el15.hidden === false);
      run10(el14, input, !!enabled6);
      if (!el15 && el14 && enabled6) {
        const output = document.createElement('div');
        ((output.className = 'settings-contact-wechat'), el14.appendChild(output), run9(output, enabled6));
      }
    }
    function run12(el16, el17, el18 = null) {
      if (!el16 || !el17 || el16.dataset.contactRevealBound === '1') return;
      ((el16.dataset.contactRevealBound = '1'),
        el16.addEventListener('click', () => {
          el17.hidden = false;
          if (el18?.children?.length) el18.hidden = false;
        }));
    }
    function run13(value2) {
      const response = value2 || createDefaultSubscriptionState();
      if (el) {
        let t2 = t('settings.subscription.inactive');
        if (response.loading) t2 = t('settings.subscription.loading');
        else {
          if (String(response.status || '').toLowerCase() === 'active')
            t2 = t('settings.subscription.active');
          else response.status === 'expired' && (t2 = t('settings.subscription.expired'));
        }
        el.textContent = t2;
      }
      (el2 && (el2.textContent = '' + t('settings.subscription.expirePrefix') + run8(response.expiresAt)),
        result &&
          run11(
            result,
            data,
            response.contactText,
            response.contactUrl || '',
            response.contactWechat || item,
            options,
          ));
    }
    function run14() {
      return Boolean(window.AI_CANVAS_IS_DEV_BUILD || window.LOCAL_DEV_BUILD);
    }
    function run15() {
      if (!el5) return;
      el5.hidden = !run14();
    }
    function run16() {
      return store.getStateRaw().subscription || createDefaultSubscriptionState();
    }
    function run17(value3) {
      const args = normalizeSubscriptionPayload(value3 || {});
      if (!isSubscriptionActive(args)) return false;
      const args2 = run16();
      return (
        store.setSubscriptionState({
          ...args2,
          ...args,
          loading: false,
          error: null,
          lastSyncAt: Date.now(),
        }),
        true
      );
    }
    function run18() {
      return !!document.getElementById('subscriptionGateOverlay');
    }
    async function run19() {
      const args3 = run16();
      store.setSubscriptionState({ ...args3, loading: true, error: null });
      const value4 = await ensureInstallId();
      if (!String(value4 || '').trim())
        return (
          store.setSubscriptionState({
            loading: false,
            status: 'none',
            expiresAt: null,
            error: t('settings.subscription.missingInstallIdSync'),
            lastSyncAt: Date.now(),
          }),
          run16()
        );
      try {
        const value5 = run16(),
          expiresAt = await pullSubscriptionState(value4);
        return (
          store.setSubscriptionState({
            ...expiresAt,
            expiresAt: expiresAt?.expiresAt ?? value5?.expiresAt ?? null,
            loading: false,
            error: null,
            lastSyncAt: Date.now(),
          }),
          run16()
        );
      } catch (error2) {
        return (
          store.setSubscriptionState({
            status: 'none',
            expiresAt: null,
            loading: false,
            error: error2?.message || t('settings.subscription.syncFailed'),
            lastSyncAt: Date.now(),
          }),
          run16()
        );
      }
    }
    async function run20(value6, value7 = {}) {
      const value8 = typeof value7?.onProgress === 'function' ? value7.onProgress : null,
        total =
          Array.isArray(value7?.retryScheduleMs) && value7.retryScheduleMs.length > 0
            ? value7.retryScheduleMs
            : retryScheduleMs,
        enabled7 = String(value6 || '').trim();
      if (!enabled7) return (window.showToast?.(t('settings.subscription.enterCdkey'), 'warn'), false);
      const value9 = await ensureInstallId();
      if (!String(value9 || '').trim())
        return (window.showToast?.(t('settings.subscription.missingInstallIdActivate'), 'error'), false);
      let error3 = null,
        value10 = null;
      for (let count2 = 0; count2 < 2; count2 += 1) {
        try {
          ((error3 = await submitCdkey(value9, enabled7)), (value10 = null));
          break;
        } catch (value11) {
          value10 = value11;
          if (count2 >= 1) break;
          await new Promise((value12) => setTimeout(value12, target));
        }
      }
      if (value10) throw value10;
      if (!isActivationRequestAccepted(error3)) {
        const value13 = error3?.message || t('settings.subscription.activationFailed');
        return (window.showToast?.(value13, 'error'), false);
      }
      if (run17(error3)) return (window.showToast?.(t('settings.subscription.activated')), true);
      window.showToast?.(t('settings.subscription.submitted'));
      for (let attempt = 0; attempt < total.length; attempt += 1) {
        const count3 = total[attempt];
        value8?.({ phase: 'checking', attempt: attempt + 1, total: total.length });
        if (count3 > 0) await new Promise((value14) => setTimeout(value14, count3));
        const value15 = await run19();
        if (isSubscriptionActive(value15))
          return (window.showToast?.(t('settings.subscription.activated')), true);
      }
      const value16 = run16(),
        value17 = String(value16.error || error3?.message || '').trim();
      return (
        value17
          ? window.showToast?.(
              t('settings.subscription.serverNotConfirmed') + ' (' + value17 + ')',
              'warning',
            )
          : window.showToast?.(t('settings.subscription.serverNotConfirmed'), 'warning'),
        false
      );
    }
    async function run21() {
      if (!run14() || typeof clearSubscriptionAuthorization !== 'function') return false;
      const value18 = window.confirm?.(t('settings.subscription.clearConfirm'));
      if (value18 === false) return false;
      const value19 = el5?.textContent || t('settings.subscription.clearAuthorization');
      el5 && ((el5.disabled = true), (el5.textContent = t('settings.subscription.clearing')));
      try {
        await clearSubscriptionAuthorization();
        const contactText = run16(),
          args4 = createDefaultSubscriptionState();
        return (
          store.setSubscriptionState({
            ...args4,
            contactText: contactText.contactText || args4.contactText,
            contactUrl: contactText.contactUrl || args4.contactUrl,
            contactWechat: contactText.contactWechat || args4.contactWechat,
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
      } catch (error4) {
        return (
          window.showToast?.(error4?.message || t('settings.subscription.clearFailed'), 'error'),
          false
        );
      } finally {
        el5 && ((el5.disabled = false), (el5.textContent = value19));
      }
    }
    function run22(value20 = DEFAULT_VIP_GATE_MODEL_ID, value21 = '', handler = null) {
      if (run18()) return;
      const el19 = document.createElement('div');
      ((el19.id = 'subscriptionGateOverlay'), (el19.className = 'subscription-gate-overlay'));
      const value22 = run16();
      ((el19.innerHTML =
        '\n        <div class="subscription-gate-dialog" role="dialog" aria-modal="true" aria-label="' +
        run7(t('settings.subscription.gate.aria')) +
        '">\n          <div class="subscription-gate-title">' +
        run7(t('settings.subscription.gate.title')) +
        '</div>\n          <div class="subscription-gate-desc">' +
        run7(t('settings.subscription.gate.desc')) +
        '</div>\n          <input type="text" class="settings-input" id="gateCdkeyInput" placeholder="' +
        run7(t('settings.subscription.gate.cdkeyPlaceholder')) +
        '">\n          <div class="settings-subscription-contact">\n            <button type="button" id="gateContactLink" class="settings-getkey settings-contact-trigger"></button>\n            <div id="gateContactReveal" class="settings-contact-reveal" hidden></div>\n          </div>\n          <div class="subscription-gate-actions">\n            <button type="button" class="subscription-gate-btn" id="gateCancelBtn">' +
        run7(t('settings.subscription.gate.cancel')) +
        '</button>\n            <button type="button" class="subscription-gate-btn is-primary" id="gateSubmitBtn">' +
        run7(t('settings.subscription.gate.activate')) +
        '</button>\n          </div>\n        </div>\n      '),
        document.body.appendChild(el19));
      const run23 = () => el19.remove();
      (el19.addEventListener('click', (event) => {
        if (event.target === el19) run23();
      }),
        el19.querySelector('#gateCancelBtn')?.addEventListener('click', run23),
        run11(
          el19.querySelector('#gateContactLink'),
          el19.querySelector('#gateContactReveal'),
          value22.contactText,
          value22.contactUrl || '',
          value22.contactWechat || SUBSCRIPTION_CONTACT_WECHAT_FALLBACK,
        ),
        run12(el19.querySelector('#gateContactLink'), el19.querySelector('#gateContactReveal')));
      const el20 = el19.querySelector('#gateSubmitBtn'),
        el21 = el19.querySelector('#gateCdkeyInput');
      let value23 = false;
      el19.querySelector('#gateSubmitBtn')?.addEventListener('click', async () => {
        if (value23) return;
        value23 = true;
        const value24 = el20?.textContent || t('settings.subscription.gate.activate');
        el20 && ((el20.disabled = true), (el20.textContent = t('settings.subscription.checking') + ' 1/4'));
        if (el21) el21.disabled = true;
        let value25 = false;
        try {
          value25 = await run20(el21?.value, {
            onProgress: ({ attempt: attempt2, total: total2 }) => {
              if (!el20 || !el20.isConnected) return;
              el20.textContent = t('settings.subscription.checking') + ' ' + attempt2 + '/' + total2;
            },
            retryScheduleMs: retryScheduleMs,
          });
        } catch (error5) {
          (window.showToast?.(error5?.message || t('settings.subscription.gateFailed'), 'error'),
            (value25 = false));
        }
        if (value25) {
          run23();
          if (typeof handler === 'function')
            try {
              handler();
            } catch {}
          return;
        }
        ((value23 = false),
          el20 && el20.isConnected && ((el20.disabled = false), (el20.textContent = value24)),
          el21 && el21.isConnected && ((el21.disabled = false), el21.focus()));
      });
    }
    async function run24(value26 = DEFAULT_VIP_GATE_MODEL_ID, value27 = '', error6 = null) {
      const value28 = run16(),
        value29 =
          typeof isModelAllowed === 'function'
            ? isModelAllowed(value26, value28, value27)
            : isSubscriptionActive(value28);
      if (value29) {
        const value30 = String(error6?.message || '').trim();
        window.showToast?.(value30 || t('settings.subscription.activeSyncTip'), 'warning');
        try {
          await run19();
        } catch {}
        return;
      }
      if (run18()) return;
      run22(value26, value27);
    }
    ((window.openSubscriptionDialog = ({
      modelId: modelId = DEFAULT_VIP_GATE_MODEL_ID,
      provider: provider = '',
      onSuccess: onSuccess = null,
    } = {}) => {
      const value31 = run16();
      if (typeof isModelAllowed === 'function' && isModelAllowed(modelId, value31, provider)) return;
      if (run18()) return;
      run22(modelId, provider, onSuccess);
    }),
      (window.isModelAllowedBySubscription = (value32, value33 = '') =>
        isModelAllowed(value32, store.getStateRaw().subscription || {}, value33)),
      (window.getSubscriptionState = () => run16()),
      (window.ensureSubscriptionInstallId = ensureInstallId),
      (window.refreshSubscriptionState = run19),
      (window.handleSubscriptionRequired = ({
        modelId: modelId = DEFAULT_VIP_GATE_MODEL_ID,
        provider: provider = '',
        error: error = null,
      } = {}) => run24(modelId, provider, error)),
      el4 &&
        el4.addEventListener('click', async () => {
          const value34 = await run20(el3?.value);
          if (value34 && el3) el3.value = '';
        }),
      el5 &&
        (el5.addEventListener('click', () => {
          void run21();
        }),
        run15(),
        window.addEventListener?.('aicanvas:runtime-info', run15)),
      run12(result, data, options),
      store.subscribeSelector(
        (value35) => value35.subscription,
        (value36) => run13(value36),
      ),
      void run19());
  }
  function run25() {
    const el22 = document.getElementById('aiPanel'),
      el23 = document.getElementById('aiPanelToggle');
    if (el22 && el23) {
      const value37 = 'http://www.w3.org/2000/svg';
      function run26(value38) {
        el23.replaceChildren();
        const el24 = document.createElementNS(value37, 'svg');
        (el24.setAttribute('width', '14'),
          el24.setAttribute('height', '14'),
          el24.setAttribute('viewBox', '0 0 24 24'),
          el24.setAttribute('fill', 'none'),
          el24.setAttribute('stroke', 'currentColor'),
          el24.setAttribute('stroke-width', '2'));
        const el25 = document.createElementNS(value37, 'polyline');
        (el25.setAttribute('points', value38 ? '15 18 9 12 15 6' : '9 18 15 12 9 6'),
          el24.appendChild(el25),
          el23.appendChild(el24));
      }
      el23.addEventListener('click', () => {
        (el22.classList.toggle('collapsed'), run26(el22.classList.contains('collapsed')));
      });
    }
    const el26 = document.getElementById('aiTipGot'),
      el27 = document.getElementById('aiTipCard');
    el26 &&
      el27 &&
      el26.addEventListener('click', () => {
        ((el27.style.opacity = '0'), (el27.style.maxHeight = '0px'), setTimeout(() => el27.remove(), 0x140));
      });
    const el28 = document.getElementById('aiTextarea');
    el28 &&
      el28.addEventListener('input', () => {
        ((el28.style.height = 'auto'), (el28.style.height = Math.min(el28.scrollHeight, 120) + 'px'));
      });
    const el29 = document.getElementById('aiMessages'),
      el30 = document.getElementById('aiStartBtn'),
      el31 = document.getElementById('aiStartWrap'),
      el32 = document.getElementById('aiSend');
    function run27() {
      return [
        t('appPanels.aiAssistant.responses.idea'),
        t('appPanels.aiAssistant.responses.prompt'),
        t('appPanels.aiAssistant.responses.connect'),
        t('appPanels.aiAssistant.responses.optimize'),
      ];
    }
    function run28(value39) {
      if (!el29) return;
      const el33 = document.createElement('div');
      el33.className = 'ai-msg ai';
      const el34 = document.createElement('div');
      ((el34.className = 'ai-msg-avatar'), (el34.textContent = 'A'));
      const value40 = document.createElement('div');
      ((value40.className = 'ai-msg-bubble'),
        setTextWithLineBreaks(value40, value39),
        el33.appendChild(el34),
        el33.appendChild(value40),
        el29.appendChild(el33),
        (el29.scrollTop = el29.scrollHeight));
    }
    function run29(value41) {
      if (!el29) return;
      const el35 = document.createElement('div');
      el35.className = 'ai-msg user';
      const el36 = document.createElement('div');
      ((el36.className = 'ai-msg-avatar'),
        (el36.style.background = 'var(--indigo)'),
        (el36.textContent = 'U'));
      const value42 = document.createElement('div');
      ((value42.className = 'ai-msg-bubble'),
        setTextWithLineBreaks(value42, value41),
        el35.appendChild(el36),
        el35.appendChild(value42),
        el29.appendChild(el35),
        (el29.scrollTop = el29.scrollHeight));
    }
    function run30() {
      if (!el28) return;
      const enabled8 = el28.value.trim();
      if (!enabled8) return;
      (run29(enabled8), (el28.value = ''), (el28.style.height = 'auto'));
      if (el31) el31.style.display = 'none';
      const el37 = document.createElement('div');
      el37.className = 'ai-msg ai loading';
      const el38 = document.createElement('div');
      ((el38.className = 'ai-msg-avatar'), (el38.textContent = 'A'));
      const el39 = document.createElement('div');
      el39.className = 'ai-msg-bubble';
      for (let count4 = 0; count4 < 3; count4 += 1) {
        const value43 = document.createElement('span');
        ((value43.className = 'dot'), el39.appendChild(value43));
      }
      (el37.appendChild(el38),
        el37.appendChild(el39),
        el29.appendChild(el37),
        (el29.scrollTop = el29.scrollHeight),
        setTimeout(() => {
          el37.remove();
          const list = run27(),
            value44 = list[Math.floor(Math.random() * list.length)];
          run28(value44);
        }, 0x4b0));
    }
    el30 &&
      el30.addEventListener('click', () => {
        if (el31) el31.style.display = 'none';
        run28(t('appPanels.aiAssistant.greeting'));
        if (el28) el28.focus();
      });
    if (el32) el32.addEventListener('click', run30);
    el28 &&
      el28.addEventListener('keydown', (event2) => {
        event2.key === 'Enter' && !event2.shiftKey && (event2.preventDefault(), run30());
      });
  }
  function run31() {
    const el40 = document.getElementById('emptyHint');
    if (!el40) return;
    function run32(count5) {
      if (!window._isAppLoaded) {
        el40.classList.add('hidden');
        return;
      }
      if (count5 === 0) el40.classList.remove('hidden');
      else el40.classList.add('hidden');
    }
    ((window._checkEmptyHint = () => run32(store.getStateRaw()._nodeCount || 0)),
      store.subscribeSelector((value45) => value45._nodeCount || 0, run32),
      run32(store.getStateRaw()._nodeCount || 0));
    const value46 = { text: 'ai-text', image: 'ai-image', video: 'ai-video', 'test-video': 'test-video' };
    el40.querySelectorAll('.pill-btn').forEach((el41) => {
      el41.addEventListener('click', (event3) => {
        event3.stopPropagation();
        const name = el41.dataset.type,
          type = value46[name];
        if (!type) return;
        const box = store.getState().viewport,
          x = (window.innerWidth / 2 - box.x) / box.zoom,
          y = (window.innerHeight / 2 - box.y) / box.zoom,
          id = 'node-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
          box2 =
            typeof getAIGenerationDefaultSizeByType === 'function'
              ? getAIGenerationDefaultSizeByType(type)
              : { width: 0x12c, height: 0x12c },
          width = box2.width,
          height = box2.height;
        (store.addNode({
          id: id,
          type: type,
          x: x - width / 2,
          y: y - height / 2,
          width: width,
          height: height,
          name:
            name === 'text'
              ? t('appPanels.emptyHint.textNode')
              : name === 'image'
                ? t('appPanels.emptyHint.imageNode')
                : t('appPanels.emptyHint.videoNode'),
          needsAutoResize: type === 'ai-image' || type === 'ai-video',
        }),
          store.setSelectedNodes([id]));
      });
    });
  }
  function run33() {
    const el42 = document.getElementById('aboutOverlay'),
      el43 = document.getElementById('aboutClose'),
      value47 = document.querySelector('meta[name="app-version"]')?.getAttribute('content') || 'V0.0.1',
      el44 = document.getElementById('aboutVersion');
    if (el44) el44.innerText = value47;
    function run34() {
      if (el42) el42.style.display = 'flex';
    }
    function run35() {
      if (el42) el42.style.display = 'none';
    }
    function run36() {
      document.getElementById('avatarMenu')?.classList.remove('open');
    }
    (document.getElementById('btnAbout')?.addEventListener('click', (event4) => {
      (event4.stopPropagation(), run36(), run34());
    }),
      document.getElementById('btnTutorial')?.addEventListener('click', (event5) => {
        (event5.stopPropagation(), run36(), showTutorialVideoPanel(run2()));
      }),
      document.querySelectorAll('#btnGithubOfficial, #btnFeatureFeedback').forEach((el45) => {
        el45.addEventListener('click', () => {
          run36();
        });
      }),
      el43?.addEventListener('click', run35),
      el42?.addEventListener('click', (event6) => {
        if (event6.target === el42) run35();
      }));
    let count6 = 0,
      setTimeout2 = null;
    el44?.addEventListener('click', () => {
      (count6++, clearTimeout(setTimeout2));
      if (count6 >= 7)
        ((count6 = 0),
          (window.DEV_MODE = !window.DEV_MODE),
          document.body.classList.toggle('dev-mode', window.DEV_MODE),
          window.dispatchEvent(new CustomEvent('dev-mode-changed', { detail: { enabled: window.DEV_MODE } })),
          run35(),
          window.showToast?.(
            window.DEV_MODE ? t('appPanels.devMode.entered') : t('appPanels.devMode.exited'),
          ));
      else
        count6 >= 4 &&
          window.showToast?.(
            t('appPanels.devMode.clickHint', {
              count: 7 - count6,
              action: window.DEV_MODE
                ? t('appPanels.devMode.exitAction')
                : t('appPanels.devMode.enterAction'),
            }),
          );
      setTimeout2 = setTimeout(() => {
        count6 = 0;
      }, 0x7d0);
    });
  }
  function run37() {
    const el46 = document.getElementById('feedbackGroupOverlay'),
      el47 = document.getElementById('btnFeedbackGroup'),
      el48 = document.getElementById('feedbackGroupClose'),
      el49 = document.getElementById('feedbackGroupQrImage'),
      el50 = document.getElementById('feedbackGroupQrError');
    function run38() {
      document.getElementById('avatarMenu')?.classList.remove('open');
    }
    function run39() {
      return key;
    }
    function run40() {
      run38();
      if (!el46) return;
      if (el50) el50.hidden = true;
      (el49 &&
        ((el49.hidden = false),
        (el49.loading = 'lazy'),
        (el49.decoding = 'async'),
        (el49.referrerPolicy = 'no-referrer'),
        (el49.src = run39())),
        (el46.hidden = false),
        el48?.focus?.({ preventScroll: true }));
    }
    function run41() {
      if (el46) el46.hidden = true;
    }
    (el47?.addEventListener('click', (event7) => {
      (event7.stopPropagation(), run40());
    }),
      el48?.addEventListener('click', run41),
      el46?.addEventListener('click', (event8) => {
        if (event8.target === el46) run41();
      }),
      el49?.addEventListener('error', () => {
        el49.hidden = true;
        if (el50) el50.hidden = false;
      }),
      document.addEventListener('keydown', (event9) => {
        event9.key === 'Escape' && el46 && !el46.hidden && run41();
      }));
  }
  function init() {
    (run3(), run25(), run31(), run37(), run33());
  }
  return { init: init };
}
