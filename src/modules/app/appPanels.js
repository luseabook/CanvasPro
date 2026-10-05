import { showManualUpdateCheck } from '../AutoUpdate.js';
import { showCanvasTutorialPanel } from '../tutorials/tutorialPanel.js';
import { t } from '../../i18n/index.js';
import { initEmptyCanvasShortcuts } from '../canvasShortcuts/emptyCanvasShortcuts.js';
import { initEmptyCanvasOnboarding } from '../canvasOnboarding/emptyCanvasOnboarding.js';
import { beginModalInteraction } from '../../services/modalInteractionScope.js';
export function isSubscriptionAuthorizationClearAvailable(value = globalThis['window']) {
  const item = Boolean(value?.['AI_CANVAS_IS_DEV_BUILD'] || value?.['LOCAL_DEV_BUILD']);
  return item && value?.['DEV_MODE'] === !![];
}
export function resolveSubscriptionStatusMessageKey(response = {}) {
  if (response['loading']) return 'settings.subscription.loading';
  if (String(response['status'] || '')['toLowerCase']() === 'active')
    return response['authorizationTier'] === 'annual-vip'
      ? 'settings.subscription.annualVipAuthorization'
      : 'settings.subscription.vipAuthorization';
  if (response['status'] === 'expired') return 'settings.subscription.expired';
  return 'settings.subscription.inactive';
}
const PINNED_TUTORIAL_VIDEO = Object['freeze']({
    category: 'basic',
    titleKey: 'appPanels.tutorial.usage',
    url: 'https://www.bilibili.com/video/BV1RX5z6gEXq/',
  }),
  PINNED_TUTORIAL_LINK = Object['freeze']({
    titleKey: 'appPanels.tutorial.apiOnboarding',
    url: 'https://i1etb6xynr.feishu.cn/wiki/Q9fdwIl99iqi4LkkKbQcTpvznQ2?from=from_copylink',
  }),
  TUTORIAL_VIDEO_ENTRIES = Object['freeze']([
    { titleKey: 'appPanels.tutorial.storyStudio', url: 'https://www.bilibili.com/video/BV1stKM6mEXT/' },
    {
      titleKey: 'appPanels.tutorial.replacementStudioFullTutorial',
      url: 'https://www.bilibili.com/video/BV1xouC64Eux/',
    },
    {
      titleKey: 'appPanels.tutorial.hailuoH3CharacterReplacement',
      url: 'https://www.bilibili.com/video/BV1cPhc6EEa1/',
    },
    {
      titleKey: 'appPanels.tutorial.minimaxH3MultiPersonLipSync',
      url: 'https://www.bilibili.com/video/BV1XzbJ6EEPK',
    },
    {
      titleKey: 'appPanels.tutorial.minimaxH3AudioDrivenGeneration',
      url: 'https://www.bilibili.com/video/BV1ecbG6wE85/',
    },
    {
      titleKey: 'appPanels.tutorial.fullAudioReferenceVideoGeneration',
      url: 'https://www.bilibili.com/video/BV16wMe6EE3m',
    },
    {
      titleKey: 'appPanels.tutorial.rhAiAppComfyUiIntegration',
      category: 'basic',
      url: 'https://www.bilibili.com/video/BV1VqT764E7d',
    },
    {
      titleKey: 'appPanels.tutorial.scail2VoiceStudioFilmRemix',
      url: 'https://www.bilibili.com/video/BV1nX7n6uEbi/',
    },
    {
      titleKey: 'appPanels.tutorial.seedanceLineCamera',
      url: 'https://www.bilibili.com/video/BV1ZzjL6UEoA/',
    },
    { titleKey: 'appPanels.tutorial.scail2FullReview', url: 'https://www.bilibili.com/video/BV16DJH6jEmk/' },
    {
      titleKey: 'appPanels.tutorial.bernini',
      category: 'basic',
      url: 'https://www.bilibili.com/video/BV1TwEb6gEsC',
    },
    { titleKey: 'appPanels.tutorial.latest', url: 'https://www.bilibili.com/video/BV17soQB7EwB' },
    {
      titleKey: 'appPanels.tutorial.characterReplacement',
      url: 'https://www.bilibili.com/video/BV1YEDKBwEz7',
    },
    { titleKey: 'appPanels.tutorial.panorama', url: 'https://www.bilibili.com/video/BV1FqdyBwEGx' },
  ]);
function createTutorialVideo(category) {
  return {
    category: category['category'] || 'play',
    title: t(category['titleKey']),
    url: category['url'],
  };
}
function createTutorialLink(url) {
  return { title: t(url['titleKey']), url: url['url'] };
}
export function createAppPanels({
  store: store,
  setTextWithLineBreaks: setTextWithLineBreaks,
  executeCommand: executeCommand,
  focusNodes: focusNodes,
  commit: commit,
  getNodeDefaultSize: getNodeDefaultSize,
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
  ensureDeviceId: ensureDeviceId,
  modelCatalogService: modelCatalogService,
  refreshManifestModelNodeUis: refreshManifestModelNodeUis,
  subscriptionIdentityTimeoutMs: subscriptionIdentityTimeoutMs = 15000,
} = {}) {
  const key = 'https://api.ashuoai.com/static/contact/wechat.png',
    index = 'yumengashuo',
    result = 'https://api.ashuoai.com/static/contact/fankui.jpg';
  function run(data) {
    const enabled = String(data || '')['trim']();
    if (!enabled) return '';
    if (/^https?:\/\//i['test'](enabled)) return enabled;
    if (enabled['startsWith']('/')) return enabled;
    return '';
  }
  function run2() {
    return [PINNED_TUTORIAL_VIDEO, ...TUTORIAL_VIDEO_ENTRIES]['map'](createTutorialVideo);
  }
  function run3() {
    return [PINNED_TUTORIAL_LINK]['map'](createTutorialLink);
  }
  function run4() {
    const el = document['getElementById']('subStatusText'),
      el2 = document['getElementById']('subExpireText'),
      el3 = document['getElementById']('subscriptionCdkeyInput'),
      el4 = document['getElementById']('btnSubscriptionActivate'),
      el5 = document['getElementById']('btnSubscriptionClearAuthorization'),
      options = document['getElementById']('subscriptionContactLink'),
      target = document['getElementById']('subscriptionContactReveal'),
      source = document['getElementById']('subscriptionContactWechat'),
      retryScheduleMs = [0, 500, 1200, 2500, 4000],
      next = 700,
      current = Math['max'](1, Number(subscriptionIdentityTimeoutMs) || 15000);
    let entry = 0,
      count = 0,
      record = ![],
      enabled2 = ![];
    function run5(locale = '') {
      return t('settings.subscription.contact', {}, locale ? { locale: locale } : {});
    }
    function run6(payload) {
      const enabled3 = String(payload || '')['trim']();
      if (!enabled3) return !![];
      return enabled3 === run5('zh-CN') || enabled3 === run5('en-US');
    }
    function run7(handle) {
      const state = String(handle || '')['trim']();
      return run6(state) ? run5() : state;
    }
    function run8(config) {
      return String(config ?? '')['replace'](/[&<>"']/g, (scope) => {
        switch (scope) {
          case '&':
            return '&amp;';
          case '<':
            return '&lt;';
          case '>':
            return '&gt;';
          case '"':
            return '&quot;';
          case '\'':
            return '&#39;';
          default:
            return scope;
        }
      });
    }
    function run9(input) {
      const count2 = Number(input);
      if (!Number['isFinite'](count2) || count2 <= 0) return '-';
      try {
        return new Date(count2 * 1000)['toLocaleString']();
      } catch {
        return '-';
      }
    }
    function run10(el6, enabled4, enabled5 = !![]) {
      if (!el6) return;
      el6['replaceChildren']();
      if (!enabled4) {
        el6['hidden'] = !![];
        return;
      }
      el6['hidden'] = !enabled5;
      const el7 = document['createElement']('span');
      ((el7['className'] = 'settings-contact-label'),
        (el7['textContent'] = t('settings.subscription.contactInfo.wechatLabel')));
      const el8 = document['createElement']('input');
      ((el8['type'] = 'text'),
        (el8['className'] = 'settings-contact-copy'),
        (el8['value'] = enabled4),
        (el8['readOnly'] = !![]),
        el8['setAttribute']('aria-label', t('settings.subscription.contactInfo.wechatAria')),
        el8['addEventListener']('focus', () => el8['select']()),
        el8['addEventListener']('click', () => {
          (el8['focus'](), el8['select']());
        }),
        el6['append'](el7, el8));
    }
    function run11(el9, enabled6, output) {
      if (!el9) return;
      (el9['replaceChildren'](), el9['classList']['toggle']('has-contact-image', !!enabled6));
      if (!enabled6) {
        if (output) return;
        const el10 = document['createElement']('span');
        ((el10['className'] = 'settings-contact-fallback'),
          (el10['textContent'] = t('settings.subscription.contactInfo.qrNotConfigured')),
          el9['appendChild'](el10));
        return;
      }
      const el11 = document['createElement']('img');
      ((el11['className'] = 'settings-contact-qr'),
        (el11['alt'] = t('settings.subscription.contactInfo.qrAlt')),
        (el11['loading'] = 'lazy'),
        (el11['decoding'] = 'async'),
        (el11['referrerPolicy'] = 'no-referrer'),
        (el11['src'] = enabled6),
        el11['addEventListener']('error', () => {
          el11['hidden'] = !![];
          const el12 = document['createElement']('div');
          ((el12['className'] = 'settings-contact-hint'),
            (el12['textContent'] = t('settings.subscription.contactInfo.qrLoadFailed')),
            el9['appendChild'](el12),
            el9['classList']['add']('has-contact-error'));
        }),
        el9['appendChild'](el11));
    }
    function run12(el13, el14, value2, value3 = '', value4 = '', el15 = null) {
      if (!el13) return;
      el13['textContent'] = run7(value2);
      const value5 = run(value3 || key),
        enabled7 = String(value4 || index)['trim']();
      el15 && run10(el15, enabled7, el15['hidden'] === ![]);
      run11(el14, value5, !!enabled7);
      if (!el15 && el14 && enabled7) {
        const value6 = document['createElement']('div');
        ((value6['className'] = 'settings-contact-wechat'),
          el14['appendChild'](value6),
          run10(value6, enabled7));
      }
    }
    function run13(el16, el17, el18 = null) {
      if (!el16 || !el17 || el16['dataset']['contactRevealBound'] === '1') return;
      ((el16['dataset']['contactRevealBound'] = '1'),
        el16['addEventListener']('click', () => {
          el17['hidden'] = ![];
          if (el18?.['children']?.['length']) el18['hidden'] = ![];
        }));
    }
    function run14(value7) {
      const value8 = value7 || createDefaultSubscriptionState();
      (el && (el['textContent'] = t(resolveSubscriptionStatusMessageKey(value8))),
        el2 &&
          (el2['textContent'] =
            '' + t('settings.subscription.expirePrefix') + run9(value8['expiresAt'])),
        options &&
          run12(
            options,
            target,
            value8['contactText'],
            value8['contactUrl'] || '',
            value8['contactWechat'] || index,
            source,
          ));
    }
    function run15() {
      if (!el5) return;
      el5['hidden'] = !isSubscriptionAuthorizationClearAvailable(window);
    }
    function run16() {
      return store['getStateRaw']()['subscription'] || createDefaultSubscriptionState();
    }
    function run17(value9) {
      const args = normalizeSubscriptionPayload(value9 || {});
      if (!isSubscriptionActive(args)) return ![];
      const args2 = run16();
      return (
        store['setSubscriptionState']({
          ...args2,
          ...args,
          loading: ![],
          error: null,
          lastSyncAt: Date['now'](),
        }),
        !![]
      );
    }
    function run18() {
      return !!document['getElementById']('subscriptionGateOverlay');
    }
    function run19() {
      if (typeof refreshManifestModelNodeUis !== 'function') return;
      const value10 = refreshManifestModelNodeUis();
      Array['isArray'](value10?.['remountedNodeIds']) &&
        value10['remountedNodeIds']['length'] > 0 &&
        store['invalidateUi']?.();
    }
    async function run20(value11) {
      const value12 = String(window['__aicDeviceId'] || globalThis['__aicDeviceId'] || '')['trim'](),
        value13 = value12 || (typeof ensureDeviceId === 'function' ? await ensureDeviceId(value11) : '');
      return {
        installId: String(value11 || '')['trim'](),
        deviceId: String(value13 || window['__aicDeviceId'] || '')['trim'](),
      };
    }
    function run21(value14) {
      let setTimeout2 = null;
      const value15 = new Promise((value16, handler) => {
        setTimeout2 = setTimeout(() => {
          handler(new Error(t('settings.subscription.syncFailed')));
        }, current);
      });
      return Promise['race']([Promise['resolve']()['then'](value14), value15])['finally'](() => {
        if (setTimeout2 != null) clearTimeout(setTimeout2);
      });
    }
    function run22(value17) {
      return modelCatalogService?.['loadCachedCatalog']?.(value17);
    }
    async function run23(subscriptionState, installId, { force: force = ![] } = {}) {
      const response2 = await modelCatalogService?.['sync']?.({
        subscriptionState: subscriptionState,
        installId: installId?.['installId'],
        deviceId: installId?.['deviceId'],
        force: force,
      });
      return (
        (response2?.['status'] === 'updated' ||
          response2?.['status'] === 'cache-fallback' ||
          response2?.['status'] === 'unauthorized') &&
          run19(),
        response2
      );
    }
    async function run24(options2 = {}) {
      const value18 = ++entry,
        value19 = options2?.['loadModelCatalogCache'] === !![],
        enabled8 = options2?.['syncModelCatalog'] === !![],
        force2 = options2?.['forceModelCatalog'] === !![],
        args3 = run16();
      store['setSubscriptionState']({ ...args3, loading: !![], error: null });
      let args4 = null,
        args5 = null;
      try {
        const value20 = await run21(() => ensureInstallId());
        if (value18 !== entry) return run16();
        if (!String(value20 || '')['trim']())
          return (
            store['setSubscriptionState']({
              loading: ![],
              status: 'none',
              expiresAt: null,
              error: t('settings.subscription.missingInstallIdSync'),
              lastSyncAt: Date['now'](),
            }),
            modelCatalogService?.['clear']?.(),
            run19(),
            run16()
          );
        args4 = await run21(() => run20(value20));
        if (value18 !== entry) return run16();
        args5 = value19 ? run22(args4) : null;
        args5?.['loaded'] &&
          isSubscriptionActive(args5['authorization']) &&
          (store['setSubscriptionState']({
            ...run16(),
            ...args5['authorization'],
            loading: !![],
            error: null,
          }),
          run19());
        const value21 = run16(),
          expiresAt = await pullSubscriptionState(value20, args4?.['deviceId']);
        if (value18 !== entry) return run16();
        return (
          store['setSubscriptionState']({
            ...expiresAt,
            expiresAt: expiresAt?.['expiresAt'] ?? value21?.['expiresAt'] ?? null,
            loading: ![],
            error: null,
            lastSyncAt: Date['now'](),
          }),
          enabled8 && (await run23(run16(), args4, { force: force2 })),
          !enabled8 && !isSubscriptionActive(run16()) && (modelCatalogService?.['clear']?.(), run19()),
          run16()
        );
      } catch (error2) {
        if (value18 !== entry) return run16();
        const response3 =
            value19 && args4
              ? modelCatalogService?.['retainCachedCatalogAfterSubscriptionError']?.({ ...args4, error: error2 })
              : null,
          response4 = response3?.['authorization'] || args5?.['authorization'] || null,
          status = response3?.['status'] === 'cache-fallback' && isSubscriptionActive(response4);
        return (
          store['setSubscriptionState']({
            ...args3,
            ...(status ? response4 : {}),
            status: status ? response4['status'] : 'none',
            expiresAt: status ? response4['expiresAt'] : null,
            loading: ![],
            error: error2?.['message'] || t('settings.subscription.syncFailed'),
            lastSyncAt: Date['now'](),
          }),
          !status ? (modelCatalogService?.['clear']?.(), run19()) : run19(),
          run16()
        );
      }
    }
    async function run25(value22, value23 = {}) {
      const value24 = typeof value23?.['onProgress'] === 'function' ? value23['onProgress'] : null,
        total =
          Array['isArray'](value23?.['retryScheduleMs']) && value23['retryScheduleMs']['length'] > 0
            ? value23['retryScheduleMs']
            : retryScheduleMs,
        enabled9 = String(value22 || '')['trim']();
      if (!enabled9) return (window['showToast']?.(t('settings.subscription.enterCdkey'), 'warn'), ![]);
      const value25 = await run21(() => ensureInstallId());
      if (!String(value25 || '')['trim']())
        return (window['showToast']?.(t('settings.subscription.missingInstallIdActivate'), 'error'), ![]);
      const value26 = await run21(() => run20(value25));
      let error3 = null,
        value27 = null;
      for (let count3 = 0; count3 < 2; count3 += 1) {
        try {
          ((error3 = await submitCdkey(value25, enabled9, value26['deviceId'])), (value27 = null));
          break;
        } catch (value28) {
          value27 = value28;
          if (count3 >= 1) break;
          await new Promise((value29) => setTimeout(value29, next));
        }
      }
      if (value27) throw value27;
      if (!isActivationRequestAccepted(error3)) {
        const value30 = error3?.['message'] || t('settings.subscription.activationFailed');
        return (window['showToast']?.(value30, 'error'), ![]);
      }
      entry += 1;
      if (run17(error3))
        return (
          await run23(run16(), value26, { force: !![] }),
          window['showToast']?.(t('settings.subscription.activated')),
          !![]
        );
      window['showToast']?.(t('settings.subscription.submitted'));
      for (let attempt = 0; attempt < total['length']; attempt += 1) {
        const count4 = total[attempt];
        value24?.({ phase: 'checking', attempt: attempt + 1, total: total['length'] });
        if (count4 > 0) await new Promise((value31) => setTimeout(value31, count4));
        const value32 = await run24({ syncModelCatalog: !![], forceModelCatalog: !![] });
        if (isSubscriptionActive(value32)) return (window['showToast']?.(t('settings.subscription.activated')), !![]);
      }
      const value33 = run16(),
        value34 = String(value33['error'] || error3?.['message'] || '')['trim']();
      return (
        value34
          ? window['showToast']?.(
              t('settings.subscription.serverNotConfirmed') + ' (' + value34 + ')',
              'warning',
            )
          : window['showToast']?.(t('settings.subscription.serverNotConfirmed'), 'warning'),
        ![]
      );
    }
    async function run26() {
      if (!isSubscriptionAuthorizationClearAvailable(window) || typeof clearSubscriptionAuthorization !== 'function') return ![];
      const value35 = window['confirm']?.(t('settings.subscription.clearConfirm'));
      if (value35 === ![]) return ![];
      const value36 = el5?.['textContent'] || t('settings.subscription.clearAuthorization');
      el5 &&
        ((el5['disabled'] = !![]), (el5['textContent'] = t('settings.subscription.clearing')));
      try {
        (await clearSubscriptionAuthorization(), (entry += 1));
        const contactText = run16(),
          args6 = createDefaultSubscriptionState();
        return (
          store['setSubscriptionState']({
            ...args6,
            contactText: contactText['contactText'] || args6['contactText'],
            contactUrl: contactText['contactUrl'] || args6['contactUrl'],
            contactWechat: contactText['contactWechat'] || args6['contactWechat'],
            loading: ![],
            status: 'none',
            expiresAt: null,
            entitledModelKeys: [],
            entitledModelIds: [],
            error: null,
            lastSyncAt: Date['now'](),
            deviceId: '',
          }),
          modelCatalogService?.['clear']?.(),
          run19(),
          window['showToast']?.(t('settings.subscription.clearSuccess')),
          !![]
        );
      } catch (error4) {
        return (
          window['showToast']?.(error4?.['message'] || t('settings.subscription.clearFailed'), 'error'),
          ![]
        );
      } finally {
        el5 && ((el5['disabled'] = ![]), (el5['textContent'] = value36));
      }
    }
    function run27(value37 = DEFAULT_VIP_GATE_MODEL_ID, value38 = '', handler2 = null) {
      if (run18()) return;
      const root = document['createElement']('div');
      ((root['id'] = 'subscriptionGateOverlay'), (root['className'] = 'subscription-gate-overlay'));
      const value39 = run16();
      ((root['innerHTML'] =
        '\n        <div class="subscription-gate-dialog" role="dialog" aria-modal="true" aria-label="' +
        run8(t('settings.subscription.gate.aria')) +
        '">\n          <div class="subscription-gate-title">' +
        run8(t('settings.subscription.gate.title')) +
        '</div>\n          <div class="subscription-gate-desc">' +
        run8(t('settings.subscription.gate.desc')) +
        '</div>\n          <label class="subscription-gate-label" for="gateCdkeyInput">' +
        run8(t('settings.subscription.inputLabel')) +
        '</label>\n          <input type="text" class="settings-input" id="gateCdkeyInput" placeholder="' +
        run8(t('settings.subscription.gate.cdkeyPlaceholder')) +
        '">\n          <details class="subscription-gate-contact">\n            <summary id="gateContactLink"></summary>\n            <div class="subscription-gate-contact-body">\n              <div id="gateContactReveal" class="settings-contact-reveal"></div>\n              <div class="subscription-gate-contact-info">\n                <strong>' +
        run8(t('settings.subscription.gate.scanTitle')) +
        '</strong>\n                <p>' +
        run8(t('settings.subscription.gate.scanHint')) +
        '</p>\n                <div id="gateContactWechat" class="settings-contact-wechat"></div>\n                <button type="button" class="subscription-gate-btn" id="gateCopyWechat">' +
        run8(t('textInputContextMenu.copy')) +
        '</button>\n              </div>\n            </div>\n          </details>\n          <div class="subscription-gate-actions">\n            <button type="button" class="subscription-gate-btn" id="gateCancelBtn">' +
        run8(t('settings.subscription.gate.cancel')) +
        '</button>\n            <button type="button" class="subscription-gate-btn is-primary" id="gateSubmitBtn">' +
        run8(t('settings.subscription.gate.activate')) +
        '</button>\n          </div>\n        </div>\n      '),
        document['body']['appendChild'](root));
      let beginModalInteraction2;
      const onClose = () => {
        (root['remove'](), beginModalInteraction2?.());
      };
      ((beginModalInteraction2 = beginModalInteraction({
        root: root,
        onClose: onClose,
        preferredSelector: '#gateCdkeyInput',
      })),
        root['addEventListener']('click', (event) => {
          if (event['target'] === root) onClose();
        }),
        root['querySelector']('#gateCancelBtn')?.['addEventListener']('click', onClose),
        run12(
          root['querySelector']('#gateContactLink'),
          root['querySelector']('#gateContactReveal'),
          value39['contactText'],
          value39['contactUrl'] || '',
          value39['contactWechat'] || index,
          root['querySelector']('#gateContactWechat'),
        ),
        root['querySelector']('#gateCopyWechat')?.['addEventListener']('click', async () => {
          const el19 = root['querySelector']('#gateContactWechat input');
          try {
            (await navigator['clipboard']['writeText'](el19['value']),
              window['showToast']?.(t('settings.subscription.gate.copied')));
          } catch {
            (el19?.['focus'](),
              el19?.['select'](),
              window['showToast']?.(t('textInputContextMenu.clipboardWriteFailed'), 'error'));
          }
        }));
      const el20 = root['querySelector']('#gateSubmitBtn'),
        el21 = root['querySelector']('#gateCdkeyInput');
      let enabled10 = ![];
      root['querySelector']('#gateSubmitBtn')?.['addEventListener']('click', async () => {
        if (enabled10) return;
        enabled10 = !![];
        const value40 = el20?.['textContent'] || t('settings.subscription.gate.activate');
        el20 &&
          ((el20['disabled'] = !![]),
          (el20['textContent'] = t('settings.subscription.checking') + ' 1/4'));
        if (el21) el21['disabled'] = !![];
        let enabled11 = ![];
        try {
          enabled11 = await run25(el21?.['value'], {
            onProgress: ({ attempt: attempt2, total: total2 }) => {
              if (!el20 || !el20['isConnected']) return;
              el20['textContent'] =
                t('settings.subscription.checking') + ' ' + attempt2 + '/' + total2;
            },
            retryScheduleMs: retryScheduleMs,
          });
        } catch (error5) {
          (window['showToast']?.(error5?.['message'] || t('settings.subscription.gateFailed'), 'error'),
            (enabled11 = ![]));
        }
        if (enabled11) {
          onClose();
          if (typeof handler2 === 'function')
            try {
              handler2();
            } catch {}
          return;
        }
        ((enabled10 = ![]),
          el20 &&
            el20['isConnected'] &&
            ((el20['disabled'] = ![]), (el20['textContent'] = value40)),
          el21 && el21['isConnected'] && ((el21['disabled'] = ![]), el21['focus']()));
      });
    }
    async function run28(value41 = DEFAULT_VIP_GATE_MODEL_ID, value42 = '', error6 = null) {
      const value43 = run16(),
        value44 =
          typeof isModelAllowed === 'function' ? isModelAllowed(value41, value43, value42) : isSubscriptionActive(value43);
      if (value44) {
        const value45 = String(error6?.['message'] || '')['trim']();
        window['showToast']?.(value45 || t('settings.subscription.activeSyncTip'), 'warning');
        try {
          await run24({ syncModelCatalog: !![], forceModelCatalog: !![] });
        } catch {}
        return;
      }
      if (run18()) return;
      run27(value41, value42);
    }
    ((window['openSubscriptionDialog'] = ({
      modelId: modelId = DEFAULT_VIP_GATE_MODEL_ID,
      provider: provider = '',
      onSuccess: onSuccess = null,
    } = {}) => {
      const value46 = run16();
      if (typeof isModelAllowed === 'function' && isModelAllowed(modelId, value46, provider)) return;
      if (run18()) return;
      run27(modelId, provider, onSuccess);
    }),
      (window['isModelAllowedBySubscription'] = (value47, value48 = '') =>
        isModelAllowed(value47, store['getStateRaw']()['subscription'] || {}, value48)),
      (window['getSubscriptionState'] = () => run16()),
      (window['ensureSubscriptionInstallId'] = ensureInstallId),
      (window['refreshSubscriptionState'] = run24),
      (window['handleSubscriptionRequired'] = ({
        modelId: modelId = DEFAULT_VIP_GATE_MODEL_ID,
        provider: provider = '',
        error: error = null,
      } = {}) => run28(modelId, provider, error)));
    el4 &&
      el4['addEventListener']('click', async () => {
        if (el4['disabled']) return;
        const value49 = el4['textContent'] || '';
        ((el4['disabled'] = !![]), (el4['textContent'] = t('settings.subscription.checking')));
        if (el3) el3['disabled'] = !![];
        try {
          const value50 = await run25(el3?.['value'], {
            onProgress: ({ attempt: attempt3, total: total3 }) => {
              el4['textContent'] =
                t('settings.subscription.checking') + ' ' + attempt3 + '/' + total3;
            },
          });
          if (value50 && el3) el3['value'] = '';
        } finally {
          ((el4['disabled'] = ![]), (el4['textContent'] = value49));
          if (el3) el3['disabled'] = ![];
        }
      });
    el5 &&
      (el5['addEventListener']('click', () => {
        void run26();
      }),
      run15(),
      window['addEventListener']?.('aicanvas:runtime-info', run15),
      window['addEventListener']?.('dev-mode-changed', run15));
    (run13(options, target, source),
      store['subscribeSelector'](
        (value51) => value51['subscription'],
        (value52) => run14(value52),
      ));
    const run29 = () => {
      const value53 = Date['now']();
      if (record || value53 - count < 15000) return;
      ((count = value53),
        (record = !![]),
        void run24({ syncModelCatalog: !![] })
          ['catch'](() => {})
          ['finally'](() => {
            record = ![];
          }));
    };
    (window['addEventListener']?.('blur', () => {
      enabled2 = !![];
    }),
      window['addEventListener']?.('focus', () => {
        if (!enabled2) return;
        ((enabled2 = ![]), (count = 0), run29());
      }),
      window['addEventListener']?.('online', run29),
      void run24({ loadModelCatalogCache: !![], syncModelCatalog: !![] }));
  }
  function run30() {
    const el22 = document['getElementById']('aiPanel'),
      el23 = document['getElementById']('aiPanelToggle');
    if (el22 && el23) {
      const value54 = 'http://www.w3.org/2000/svg';
      function run31(value55) {
        el23['replaceChildren']();
        const el24 = document['createElementNS'](value54, 'svg');
        (el24['setAttribute']('width', '14'),
          el24['setAttribute']('height', '14'),
          el24['setAttribute']('viewBox', '0 0 24 24'),
          el24['setAttribute']('fill', 'none'),
          el24['setAttribute']('stroke', 'currentColor'),
          el24['setAttribute']('stroke-width', '2'));
        const el25 = document['createElementNS'](value54, 'polyline');
        (el25['setAttribute']('points', value55 ? '15 18 9 12 15 6' : '9 18 15 12 9 6'),
          el24['appendChild'](el25),
          el23['appendChild'](el24));
      }
      el23['addEventListener']('click', () => {
        (el22['classList']['toggle']('collapsed'),
          run31(el22['classList']['contains']('collapsed')));
      });
    }
    const el26 = document['getElementById']('aiTipGot'),
      el27 = document['getElementById']('aiTipCard');
    el26 &&
      el27 &&
      el26['addEventListener']('click', () => {
        ((el27['style']['opacity'] = '0'),
          (el27['style']['maxHeight'] = '0px'),
          setTimeout(() => el27['remove'](), 320));
      });
    const el28 = document['getElementById']('aiTextarea');
    el28 &&
      el28['addEventListener']('input', () => {
        ((el28['style']['height'] = 'auto'),
          (el28['style']['height'] = Math['min'](el28['scrollHeight'], 120) + 'px'));
      });
    const el29 = document['getElementById']('aiMessages'),
      el30 = document['getElementById']('aiStartBtn'),
      el31 = document['getElementById']('aiStartWrap'),
      el32 = document['getElementById']('aiSend');
    function run32() {
      return [
        t('appPanels.aiAssistant.responses.idea'),
        t('appPanels.aiAssistant.responses.prompt'),
        t('appPanels.aiAssistant.responses.connect'),
        t('appPanels.aiAssistant.responses.optimize'),
      ];
    }
    function run33(value56) {
      if (!el29) return;
      const el33 = document['createElement']('div');
      el33['className'] = 'ai-msg ai';
      const el34 = document['createElement']('div');
      ((el34['className'] = 'ai-msg-avatar'), (el34['textContent'] = 'A'));
      const value57 = document['createElement']('div');
      ((value57['className'] = 'ai-msg-bubble'),
        setTextWithLineBreaks(value57, value56),
        el33['appendChild'](el34),
        el33['appendChild'](value57),
        el29['appendChild'](el33),
        (el29['scrollTop'] = el29['scrollHeight']));
    }
    function run34(value58) {
      if (!el29) return;
      const el35 = document['createElement']('div');
      el35['className'] = 'ai-msg user';
      const el36 = document['createElement']('div');
      ((el36['className'] = 'ai-msg-avatar'),
        (el36['style']['background'] = 'var(--indigo)'),
        (el36['textContent'] = 'U'));
      const value59 = document['createElement']('div');
      ((value59['className'] = 'ai-msg-bubble'),
        setTextWithLineBreaks(value59, value58),
        el35['appendChild'](el36),
        el35['appendChild'](value59),
        el29['appendChild'](el35),
        (el29['scrollTop'] = el29['scrollHeight']));
    }
    function run35() {
      if (!el28) return;
      const enabled12 = el28['value']['trim']();
      if (!enabled12) return;
      (run34(enabled12), (el28['value'] = ''), (el28['style']['height'] = 'auto'));
      if (el31) el31['style']['display'] = 'none';
      const el37 = document['createElement']('div');
      el37['className'] = 'ai-msg ai loading';
      const el38 = document['createElement']('div');
      ((el38['className'] = 'ai-msg-avatar'), (el38['textContent'] = 'A'));
      const el39 = document['createElement']('div');
      el39['className'] = 'ai-msg-bubble';
      for (let count5 = 0; count5 < 3; count5 += 1) {
        const value60 = document['createElement']('span');
        ((value60['className'] = 'dot'), el39['appendChild'](value60));
      }
      (el37['appendChild'](el38),
        el37['appendChild'](el39),
        el29['appendChild'](el37),
        (el29['scrollTop'] = el29['scrollHeight']),
        setTimeout(() => {
          el37['remove']();
          const list = run32(),
            value61 = list[Math['floor'](Math['random']() * list['length'])];
          run33(value61);
        }, 1200));
    }
    el30 &&
      el30['addEventListener']('click', () => {
        if (el31) el31['style']['display'] = 'none';
        run33(t('appPanels.aiAssistant.greeting'));
        if (el28) el28['focus']();
      });
    if (el32) el32['addEventListener']('click', run35);
    el28 &&
      el28['addEventListener']('keydown', (event2) => {
        event2['key'] === 'Enter' &&
          !event2['shiftKey'] &&
          (event2['preventDefault'](), run35());
      });
  }
  function run36() {
    (initEmptyCanvasShortcuts({
      store: store,
      executeCommand: executeCommand,
      focusNodes: focusNodes,
      commit: commit,
      getNodeDefaultSize: getNodeDefaultSize,
    }),
      initEmptyCanvasOnboarding({ store: store }));
  }
  function run37() {
    const el40 = document['getElementById']('aboutOverlay'),
      el41 = document['getElementById']('aboutClose'),
      value62 =
        document['querySelector']('meta[name="app-version"]')?.['getAttribute']('content') || 'V0.0.1',
      el42 = document['getElementById']('aboutVersion');
    if (el42) el42['innerText'] = value62;
    function run38() {
      if (el40) el40['style']['display'] = 'flex';
    }
    function run39() {
      if (el40) el40['style']['display'] = 'none';
    }
    function run40() {
      document['getElementById']('avatarMenu')?.['classList']['remove']('open');
    }
    (document['getElementById']('btnAbout')?.['addEventListener']('click', (event3) => {
      (event3['stopPropagation'](), run40(), run38());
    }),
      document['getElementById']('btnTutorial')?.['addEventListener']('click', (event4) => {
        (event4['stopPropagation'](), run40(), showCanvasTutorialPanel(run2(), run3()));
      }),
      document['addEventListener']('click', (event5) => {
        const el43 = event5['target']['closest']?.('[data-api-tutorial-trigger]'),
          tutorialId = el43?.['dataset']['apiTutorialTrigger'];
        if (!tutorialId) return;
        (event5['preventDefault'](),
          showCanvasTutorialPanel(run2(), run3(), { tutorialId: tutorialId }));
      }),
      document['getElementById']('btnCheckForUpdates')?.['addEventListener']('click', (event6) => {
        (event6['stopPropagation'](), run40(), void showManualUpdateCheck());
      }),
      document['querySelectorAll']('#btnGithubOfficial, #btnFeatureFeedback')['forEach']((el44) => {
        el44['addEventListener']('click', () => {
          run40();
        });
      }),
      el41?.['addEventListener']('click', run39),
      el40?.['addEventListener']('click', (event7) => {
        if (event7['target'] === el40) run39();
      }));
    let count6 = 0,
      setTimeout3 = null;
    el42?.['addEventListener']('click', () => {
      (count6++, clearTimeout(setTimeout3));
      if (count6 >= 7)
        ((count6 = 0),
          (window['DEV_MODE'] = !window['DEV_MODE']),
          document['body']['classList']['toggle']('dev-mode', window['DEV_MODE']),
          window['dispatchEvent'](
            new CustomEvent('dev-mode-changed', { detail: { enabled: window['DEV_MODE'] } }),
          ),
          run39(),
          window['showToast']?.(
            window['DEV_MODE'] ? t('appPanels.devMode.entered') : t('appPanels.devMode.exited'),
          ));
      else
        count6 >= 4 &&
          window['showToast']?.(
            t('appPanels.devMode.clickHint', {
              count: 7 - count6,
              action: window['DEV_MODE']
                ? t('appPanels.devMode.exitAction')
                : t('appPanels.devMode.enterAction'),
            }),
          );
      setTimeout3 = setTimeout(() => {
        count6 = 0;
      }, 2000);
    });
  }
  function run41() {
    const el45 = document['getElementById']('feedbackGroupOverlay'),
      el46 = document['getElementById']('btnFeedbackGroup'),
      el47 = document['getElementById']('feedbackGroupClose'),
      el48 = document['getElementById']('feedbackGroupQrImage'),
      el49 = document['getElementById']('feedbackGroupQrError');
    function run42() {
      document['getElementById']('avatarMenu')?.['classList']['remove']('open');
    }
    function run43() {
      return result;
    }
    function run44() {
      run42();
      if (!el45) return;
      if (el49) el49['hidden'] = !![];
      (el48 &&
        ((el48['hidden'] = ![]),
        (el48['loading'] = 'lazy'),
        (el48['decoding'] = 'async'),
        (el48['referrerPolicy'] = 'no-referrer'),
        (el48['src'] = run43())),
        (el45['hidden'] = ![]),
        el47?.['focus']?.({ preventScroll: !![] }));
    }
    function run45() {
      if (el45) el45['hidden'] = !![];
    }
    (el46?.['addEventListener']('click', (event8) => {
      (event8['stopPropagation'](), run44());
    }),
      el47?.['addEventListener']('click', run45),
      el45?.['addEventListener']('click', (event9) => {
        if (event9['target'] === el45) run45();
      }),
      el48?.['addEventListener']('error', () => {
        el48['hidden'] = !![];
        if (el49) el49['hidden'] = ![];
      }),
      document['addEventListener']('keydown', (event10) => {
        event10['key'] === 'Escape' && el45 && !el45['hidden'] && run45();
      }));
  }
  function init() {
    (run4(), run30(), run36(), run41(), run37());
  }
  return { init: init };
}
