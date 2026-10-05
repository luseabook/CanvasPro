import { onLocaleChange, t } from '../../i18n/index.js';
import { isModelProviderPubliclyListed } from '../../manifests/modelCatalogVisibility.js';
export const MODEL_SERVICE_CATEGORY_IDS = Object['freeze'](['all', 'text', 'image', 'video', 'audio']);
const MODEL_SERVICE_CATEGORY_SET = new Set(MODEL_SERVICE_CATEGORY_IDS),
  PROVIDER_STATUS_TONES = Object['freeze']([
    'testing',
    'success',
    'partial',
    'configured',
    'unconfigured',
    'deprecated',
    'danger',
  ]),
  PROVIDER_STATUS_CLASSES = PROVIDER_STATUS_TONES['map']((value) => 'settings-provider-status--' + value);
let activeNavigator = null;
export function normalizeModelServiceKinds(item) {
  const key = Array['isArray'](item) ? item : String(item || '')['split'](/[\s,]+/);
  return Array['from'](
    new Set(
      key['map']((index) =>
        String(index || '')
          ['trim']()
          ['toLowerCase'](),
      )['filter']((result) => MODEL_SERVICE_CATEGORY_SET['has'](result) && result !== 'all'),
    ),
  );
}
export function modelServiceKindsMatchCategory(data, options = 'all') {
  const target = String(options || 'all')
    ['trim']()
    ['toLowerCase']();
  if (target === 'all') return true;
  return normalizeModelServiceKinds(data)['includes'](target);
}
export function aggregateModelServiceProviderStatus(list = []) {
  const total = list['map']((source) => ({
    text: String(source?.['text'] || '')['trim'](),
    tone: String(source?.['tone'] || '')
      ['trim']()
      ['toLowerCase'](),
  }))['filter']((next) => next['text'] || next['tone']);
  if (!total['length'])
    return {
      text: t('settings.apiInput.readiness.requiredShort'),
      tone: 'unconfigured',
    };
  if (total['length'] === 1) return total[0];
  const count = total['filter']((current) => current['tone'] === 'success')['length'];
  if (count === total['length'])
    return {
      text: t('settings.apiInput.catalog.allRoutesReady'),
      tone: 'success',
    };
  if (count > 0)
    return {
      text: t('settings.apiInput.catalog.routesReady', {
        count: count,
        total: total['length'],
      }),
      tone: 'partial',
    };
  const entry = ['testing', 'partial', 'configured', 'danger', 'deprecated', 'unconfigured'],
    record =
      entry['find']((payload) => total['some']((handle) => handle['tone'] === payload)) || total[0]['tone'];
  return total['find']((state) => state['tone'] === record) || total[0];
}
function readProviderStatusTone(config) {
  return (
    PROVIDER_STATUS_TONES['find']((scope) =>
      config?.['classList']?.['contains']('settings-provider-status--' + scope),
    ) || ''
  );
}
function readCardStatus(input) {
  const output = Array['from'](input?.['querySelectorAll']?.('.settings-provider-status') || [])
    ['filter']((enabled) => !enabled['hidden'] && String(enabled['textContent'] || '')['trim']())
    ['map']((value2) => ({
      text: String(value2['textContent'] || '')['trim'](),
      tone: readProviderStatusTone(value2),
    }));
  return output['length'] ? aggregateModelServiceProviderStatus(output) : null;
}
function getProviderLabel(value3, value4) {
  return (
    String(value4?.['querySelector']?.('.settings-card-title')?.['textContent'] || '')['trim']() || value3
  );
}
function cloneProviderIcon(value5, value6) {
  const value7 = value6?.['querySelector']?.('.settings-card-head'),
    value8 = value7?.['querySelector']?.('.settings-card-icon, .settings-card-badge, svg'),
    value9 = value5['createElement']('span');
  ((value9['className'] = 'model-service-provider-option-icon'),
    value9['setAttribute']('aria-hidden', 'true'));
  if (value8?.['cloneNode']) {
    const value10 = value8['cloneNode'](true);
    (value10['removeAttribute']?.('id'), value9['appendChild'](value10));
  }
  return value9;
}
function getRouteLabel(value11, value12) {
  const value13 = String(value12?.['dataset']?.['modelServiceRouteLabelI18n'] || '')['trim']();
  if (value13) return t(value13);
  if (value11 === 'domestic') return t('settings.apiInput.catalog.routeDomestic');
  if (value11 === 'international') return t('settings.apiInput.catalog.routeInternational');
  return (
    String(value12?.['querySelector']?.('.settings-card-title')?.['textContent'] || '')['trim']() || value11
  );
}
function isCardAvailable(enabled2, enabled3) {
  if (!enabled2 || enabled2['hidden']) return false;
  if (!isModelProviderPubliclyListed(enabled2['dataset']?.['modelServiceProvider'])) return false;
  if (
    enabled2['classList']?.['contains']('dev-mode-only') &&
    !enabled3?.['body']?.['classList']?.['contains']('dev-mode')
  )
    return false;
  return true;
}
function createProviderGroup(value14, id, cards, value15) {
  const wrapper = value14['createElement']('section');
  ((wrapper['className'] = 'model-service-provider-detail'),
    (wrapper['dataset']['modelServiceProviderDetail'] = id),
    (wrapper['hidden'] = true));
  const routeButtons = new Map();
  if (cards['length'] > 1) {
    const value16 = value14['createElement']('div');
    value16['className'] = 'model-service-detail-route-header';
    const value17 = value14['createElement']('span');
    ((value17['className'] = 'model-service-detail-route-label'),
      (value17['dataset']['i18n'] = 'settings.apiInput.catalog.routeLabel'),
      (value17['textContent'] = t('settings.apiInput.catalog.routeLabel')));
    const value18 = value14['createElement']('div');
    ((value18['className'] = 'model-service-detail-route-tabs'),
      value18['setAttribute']('role', 'tablist'),
      value18['setAttribute']('aria-label', t('settings.apiInput.catalog.routeAria')),
      cards['forEach']((card, value19) => {
        const value20 =
            String(card['dataset']['modelServiceRoute'] || '')['trim']() || 'route-' + (value19 + 1),
          button = value14['createElement']('button');
        ((button['type'] = 'button'),
          (button['className'] = 'model-service-detail-route-tab'),
          (button['dataset']['modelServiceRouteTarget'] = value20),
          button['setAttribute']('role', 'tab'),
          button['setAttribute']('aria-selected', 'false'));
        const value21 = card['id'] || 'model-service-route-panel-' + id + '-' + value20,
          value22 = value21 + '-tab';
        ((card['id'] = value21),
          (button['id'] = value22),
          button['setAttribute']('aria-controls', value21),
          card['setAttribute']('role', 'tabpanel'),
          card['setAttribute']('aria-labelledby', value22));
        const name = value14['createElement']('span');
        ((name['className'] = 'model-service-detail-route-name'),
          (name['textContent'] = getRouteLabel(value20, card)));
        const status = value14['createElement']('span');
        ((status['className'] =
          'settings-provider-status model-service-detail-route-status settings-provider-status--unconfigured'),
          (status['textContent'] = t('settings.apiInput.readiness.requiredShort')),
          button['append'](name, status),
          value18['appendChild'](button),
          routeButtons['set'](value20, {
            button: button,
            card: card,
            name: name,
            status: status,
          }));
      }),
      value16['append'](value17, value18),
      wrapper['appendChild'](value16));
  }
  const value23 = value14['createElement']('div');
  return (
    (value23['className'] = 'model-service-provider-card-stage'),
    cards['forEach']((value24) => {
      (value24['classList']['add']('model-service-provider-card'), value23['appendChild'](value24));
    }),
    wrapper['appendChild'](value23),
    value15['appendChild'](wrapper),
    {
      id: id,
      cards: cards,
      kinds: Array['from'](
        new Set(
          cards['flatMap']((value25) => normalizeModelServiceKinds(value25['dataset']['modelServiceKinds'])),
        ),
      ),
      wrapper: wrapper,
      routeButtons: routeButtons,
      activeRouteId: '',
      button: null,
      buttonName: null,
    }
  );
}
function createProviderButton(value26, value27, value28) {
  const value29 = value27['cards'][0],
    value30 = value26['createElement']('button');
  ((value30['type'] = 'button'),
    (value30['className'] = 'model-service-provider-option'),
    (value30['dataset']['modelServiceProviderTarget'] = value27['id']),
    value30['setAttribute']('aria-pressed', 'false'));
  value29['classList']?.['contains']('dev-mode-only') && value30['classList']['add']('dev-mode-only');
  const value31 = value26['createElement']('span');
  ((value31['className'] = 'model-service-provider-option-name'),
    (value31['textContent'] = getProviderLabel(value27['id'], value29)),
    value30['append'](cloneProviderIcon(value26, value29), value31),
    value28['appendChild'](value30),
    (value27['button'] = value30),
    (value27['buttonName'] = value31));
}
function createNavigatorController({
  documentObject: documentObject,
  browserEl: browserEl,
  pickerEl: pickerEl,
  detailsEl: detailsEl,
  groups: groups,
}) {
  let value32 = 'all',
    value33 = '',
    enabled4 = null;
  const value34 = [],
    handler = (value35) => value35['cards']['filter']((value36) => isCardAvailable(value36, documentObject)),
    handler2 = (enabled5, value37) => {
      if (!enabled5) return;
      ((enabled5['textContent'] = value37?.['text'] || t('settings.apiInput.readiness.requiredShort')),
        enabled5['classList']['remove'](...PROVIDER_STATUS_CLASSES),
        enabled5['classList']['add']('settings-provider-status--' + (value37?.['tone'] || 'unconfigured')));
    },
    handler3 = (value38) => {
      const value39 = handler(value38),
        value40 = value39['map'](readCardStatus)['filter'](Boolean),
        aggregateModelServiceProviderStatus2 = aggregateModelServiceProviderStatus(value40),
        value41 = String(value38['buttonName']?.['textContent'] || value38['id'])['trim'](),
        value42 =
          String(aggregateModelServiceProviderStatus2?.['text'] || '')['trim']() ||
          t('settings.apiInput.readiness.requiredShort');
      ((value38['button']['dataset']['modelServiceStatus'] =
        aggregateModelServiceProviderStatus2?.['tone'] || 'unconfigured'),
        (value38['button']['dataset']['tooltip'] = value41 + '：' + value42),
        value38['button']['setAttribute']('aria-label', value41 + '，' + value42),
        value38['button']['classList']['toggle'](
          'is-verified',
          aggregateModelServiceProviderStatus2?.['tone'] === 'success',
        ),
        value38['routeButtons']['forEach'](({ card: card2, status: status2 }) => {
          handler2(
            status2,
            readCardStatus(card2) || {
              text: t('settings.apiInput.readiness.requiredShort'),
              tone: 'unconfigured',
            },
          );
        }));
    },
    activateRoute = (enabled6, value43 = '') => {
      if (!enabled6?.['routeButtons']?.['size']) return false;
      const value44 = Array['from'](enabled6['routeButtons']['entries']())['filter'](([, value45]) =>
          isCardAvailable(value45['card'], documentObject),
        ),
        enabled7 =
          value44['find'](([value46]) => value46 === value43) ||
          value44['find'](([value47]) => value47 === enabled6['activeRouteId']) ||
          value44[0];
      if (!enabled7) return false;
      return (
        (enabled6['activeRouteId'] = enabled7[0]),
        enabled6['routeButtons']['forEach']((value48, value49) => {
          const enabled8 = value49 === enabled6['activeRouteId'],
            isCardAvailable2 = isCardAvailable(value48['card'], documentObject);
          ((value48['button']['hidden'] = !isCardAvailable2),
            value48['button']['classList']['toggle']('is-active', enabled8),
            value48['button']['setAttribute']('aria-selected', enabled8 ? 'true' : 'false'),
            value48['card']['classList']['toggle']('is-route-hidden', !enabled8),
            value48['card']['setAttribute']('aria-hidden', enabled8 ? 'false' : 'true'));
        }),
        true
      );
    },
    handler4 = (value50) =>
      handler(value50)['length'] > 0 && modelServiceKindsMatchCategory(value50['kinds'], value32),
    handler5 = () => groups['find']((value51) => handler4(value51)) || null,
    activateProvider = (value52, value53 = {}) => {
      const enabled9 = groups['find']((value54) => value54['id'] === value52);
      if (!enabled9 || !handler(enabled9)['length']) return false;
      !modelServiceKindsMatchCategory(enabled9['kinds'], value32) &&
        setCategory('all', { preserveProvider: true });
      ((value33 = enabled9['id']),
        groups['forEach']((value55) => {
          const enabled10 = value55['id'] === value33;
          ((value55['wrapper']['hidden'] = !enabled10),
            value55['button']['classList']['toggle']('is-active', enabled10),
            value55['button']['setAttribute']('aria-pressed', enabled10 ? 'true' : 'false'));
        }),
        activateRoute(enabled9, value53['routeId']));
      if (value53['focusButton']) enabled9['button']['focus']?.();
      return true;
    },
    sync = () => {
      groups['forEach']((value56) => {
        ((value56['button']['hidden'] = !handler4(value56)),
          value56['routeButtons']['forEach'](({ button: button2, card: card3 }) => {
            button2['hidden'] = !isCardAvailable(card3, documentObject);
          }),
          handler3(value56));
      });
      if (enabled4) {
        groups['forEach']((value57) => {
          const enabled11 = handler(value57)['filter']((value58) => enabled4['has'](value58));
          ((value57['wrapper']['hidden'] = !enabled11['length']),
            value57['cards']['forEach']((value59) => {
              const enabled12 = enabled11['includes'](value59);
              (value59['classList']['toggle']('is-route-hidden', !enabled12),
                value59['setAttribute']('aria-hidden', enabled12 ? 'false' : 'true'));
            }));
        });
        return;
      }
      const enabled13 = groups['find']((value60) => value60['id'] === value33);
      if (!enabled13 || !handler4(enabled13)) {
        const value61 = handler5();
        if (value61) activateProvider(value61['id']);
        return;
      }
      activateRoute(enabled13, enabled13['activeRouteId']);
    };
  function setCategory(value62, enabled14 = {}) {
    const value63 = MODEL_SERVICE_CATEGORY_SET['has'](value62) ? value62 : 'all';
    ((value32 = value63),
      browserEl['querySelectorAll']?.('[data-model-service-category]')?.['forEach']((value64) => {
        const value65 = value64['dataset']['modelServiceCategory'] === value32;
        (value64['classList']['toggle']('is-active', value65),
          value64['setAttribute']('aria-pressed', value65 ? 'true' : 'false'));
      }),
      groups['forEach']((value66) => {
        value66['button']['hidden'] = !handler4(value66);
      }));
    const enabled15 = groups['find']((value67) => value67['id'] === value33);
    if (!enabled14['preserveProvider'] && (!enabled15 || !handler4(enabled15))) {
      const value68 = handler5();
      if (value68) activateProvider(value68['id']);
    }
  }
  const revealField = (value69) => {
    const enabled16 = value69?.['closest']?.('[data-model-service-provider]');
    if (!enabled16) return false;
    const value70 = String(enabled16['dataset']['modelServiceProvider'] || '')['trim'](),
      routeId = String(enabled16['dataset']['modelServiceRoute'] || '')['trim'](),
      enabled17 = groups['find']((value71) => value71['id'] === value70);
    if (!enabled17) return false;
    return (
      !modelServiceKindsMatchCategory(enabled17['kinds'], value32) &&
        setCategory('all', { preserveProvider: true }),
      activateProvider(value70, { routeId: routeId })
    );
  };
  (browserEl['querySelectorAll']?.('[data-model-service-category]')?.['forEach']((value72) => {
    (value72['addEventListener']('click', () => {
      setCategory(value72['dataset']['modelServiceCategory'] || 'all');
    }),
      value72['addEventListener']('keydown', (value73) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End']['includes'](value73['key'])) return;
        const value74 = Array['from'](browserEl['querySelectorAll']('[data-model-service-category]')),
          value75 = Math['max'](0, value74['indexOf'](value72)),
          value76 =
            value73['key'] === 'Home'
              ? 0
              : value73['key'] === 'End'
                ? value74['length'] - 1
                : (value75 + (value73['key'] === 'ArrowRight' ? 1 : -1) + value74['length']) %
                  value74['length'];
        (value73['preventDefault'](), value74[value76]?.['focus']?.(), value74[value76]?.['click']?.());
      }));
  }),
    groups['forEach']((value77) => {
      (value77['button']['addEventListener']('click', () => {
        activateProvider(value77['id']);
      }),
        value77['routeButtons']['forEach'](({ button: button3 }, value78) => {
          button3['addEventListener']('click', () => activateRoute(value77, value78));
        }));
      if (typeof globalThis['MutationObserver'] === 'function') {
        const value79 = new globalThis['MutationObserver'](() => {
          sync();
        });
        (value77['cards']['forEach']((value80) => {
          value79['observe'](value80, {
            attributes: true,
            attributeFilter: ['hidden', 'class'],
            childList: true,
            subtree: true,
            characterData: true,
          });
        }),
          value34['push'](value79));
      }
    }));
  if (typeof globalThis['MutationObserver'] === 'function' && documentObject['body']) {
    const value81 = new globalThis['MutationObserver'](sync);
    (value81['observe'](documentObject['body'], {
      attributes: true,
      attributeFilter: ['class'],
    }),
      value34['push'](value81));
  }
  const onLocaleChange2 = onLocaleChange(() => {
    globalThis['queueMicrotask']?.(() => {
      groups['forEach']((value82) => {
        ((value82['buttonName']['textContent'] = getProviderLabel(value82['id'], value82['cards'][0])),
          value82['routeButtons']['forEach'](({ card: card4, name: name2 }, value83) => {
            name2['textContent'] = getRouteLabel(value83, card4);
          }),
          handler3(value82));
      });
    });
  });
  sync();
  const value84 = handler5();
  if (value84) activateProvider(value84['id']);
  return (
    browserEl['classList']['add']('is-enhanced'),
    {
      activateProvider: activateProvider,
      activateRoute: activateRoute,
      revealField: revealField,
      setCategory: setCategory,
      setSearchCards(value85) {
        ((enabled4 = value85 === null ? null : new Set(value85)),
          !enabled4 &&
            groups['forEach']((value86) => {
              (value86['cards']['forEach']((value87) => {
                (value87['classList']['remove']('is-route-hidden'),
                  value87['removeAttribute']('aria-hidden'));
              }),
                activateRoute(value86, value86['activeRouteId']),
                (value86['wrapper']['hidden'] = value86['id'] !== value33));
            }),
          sync());
      },
      sync: sync,
      destroy() {
        (value34['forEach']((value88) => value88['disconnect']?.()), onLocaleChange2?.());
        if (activeNavigator === this) activeNavigator = null;
      },
    }
  );
}
export function initModelServiceSettingsNavigator(documentObject2 = globalThis['document']) {
  if (!documentObject2?.['getElementById']) return null;
  const browserEl2 = documentObject2['getElementById']('modelServiceBrowser'),
    pickerEl2 = documentObject2['getElementById']('modelServiceProviderPicker'),
    detailsEl2 = documentObject2['getElementById']('modelServiceProviderDetails');
  if (!browserEl2 || !pickerEl2 || !detailsEl2) return null;
  if (activeNavigator) return activeNavigator;
  const value89 = Array['from'](documentObject2['querySelectorAll']?.('[data-model-service-provider]') || []),
    value90 = new Map();
  value89['forEach']((value91) => {
    const enabled18 = String(value91['dataset']['modelServiceProvider'] || '')['trim']();
    if (!enabled18) return;
    const value92 = value90['get'](enabled18) || [];
    (value92['push'](value91), value90['set'](enabled18, value92));
  });
  const groups2 = Array['from'](value90['entries']())['map'](([value93, value94]) =>
    createProviderGroup(documentObject2, value93, value94, detailsEl2),
  );
  return (
    groups2['forEach']((value95) => createProviderButton(documentObject2, value95, pickerEl2)),
    (activeNavigator = createNavigatorController({
      documentObject: documentObject2,
      browserEl: browserEl2,
      pickerEl: pickerEl2,
      detailsEl: detailsEl2,
      groups: groups2,
    })),
    activeNavigator
  );
}
export function revealModelServiceSettingsField(value96) {
  return activeNavigator?.['revealField']?.(value96) || false;
}
export function setModelServiceSettingsSearchCards(value97) {
  activeNavigator?.['setSearchCards'](value97);
}
