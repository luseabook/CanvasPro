import {
  API_CONFIG_CHANGED_EVENT,
  ensureConfig,
  getApiConfigSnapshot,
  isApiConfigLoaded,
} from '../../../api/configApi.js';
import { onLocaleChange, t } from '../../i18n/index.js';
import { openSettingsPanelToField } from '../settings/panelSettings.js';
export function hasConfiguredApi(options = {}) {
  return Object['values'](options?.['providers'] || {})['some']((value) =>
    [value?.['apiKey'], value?.['modelApiKey']]['some'](
      (item) => typeof item === 'string' && item['trim']()['length'] > 0x0,
    ),
  );
}
export function createCanvasOnboardingState() {
  let visible = null,
    configured = ![],
    enabled = ![];
  return {
    update(key, count = 0x0) {
      configured = hasConfiguredApi(key);
      if (visible === null) visible = !configured;
      !configured && ((visible = !![]), (enabled = ![]));
      if (visible && configured && count > 0x0) enabled = !![];
      return { visible: visible && !enabled, configured: configured };
    },
    onNodesChanged(count2) {
      if (visible && configured && count2 > 0x0) enabled = !![];
      return { visible: visible === !![] && !enabled, configured: configured };
    },
  };
}
export function initEmptyCanvasOnboarding({ store: store }) {
  const el = document['querySelector']('#emptyHint .empty-hint-main');
  if (!el || el['querySelector']('.canvas-onboarding')) return;
  const el2 = document['createElement']('div');
  ((el2['className'] = 'canvas-onboarding'), (el2['hidden'] = !![]), el2['setAttribute']('role', 'group'));
  const el3 = document['createElement']('button');
  ((el3['type'] = 'button'), (el3['className'] = 'canvas-onboarding-step canvas-onboarding-connect'));
  const el4 = document['createElement']('span');
  ((el4['className'] = 'canvas-onboarding-divider'), el4['setAttribute']('aria-hidden', 'true'));
  const el5 = document['createElement']('span');
  ((el5['className'] = 'canvas-onboarding-step canvas-onboarding-create'),
    el2['append'](el3, el4, el5),
    el['prepend'](el2));
  const canvasOnboardingState = createCanvasOnboardingState();
  let index = { visible: ![], configured: ![] },
    enabled2 = ![];
  function run(enabled3 = index) {
    ((index = enabled3),
      (el2['hidden'] = !enabled3['visible']),
      el2['classList']['toggle']('is-configured', enabled3['configured']),
      el2['setAttribute']('aria-label', t('emptyHint.onboarding.label')),
      (el3['textContent'] = t(
        enabled3['configured'] ? 'emptyHint.onboarding.connected' : 'emptyHint.onboarding.connect',
      )),
      (el3['disabled'] = enabled3['configured']),
      el3['setAttribute']('aria-current', enabled3['configured'] ? 'false' : 'step'),
      (el5['textContent'] = t('emptyHint.onboarding.create')),
      el5['setAttribute']('aria-current', enabled3['configured'] ? 'step' : 'false'));
  }
  const run2 = () => store['getStateRaw']()['_nodeCount'] || 0x0,
    handler = () => {
      if (!enabled2 && isApiConfigLoaded())
        run(canvasOnboardingState['update'](getApiConfigSnapshot(), run2()));
    },
    result = (data) => {
      if (data['detail']?.['reason'] === 'save-pending') return;
      handler();
    };
  (el3['addEventListener']('click', (event) => {
    (event['stopPropagation'](), openSettingsPanelToField({ paneName: 'api-input' }));
  }),
    el2['addEventListener']('dblclick', (event2) => event2['stopPropagation']()),
    window['addEventListener'](API_CONFIG_CHANGED_EVENT, result));
  const target = store['subscribeSelector'](
      (source) => source['_nodeCount'] || 0x0,
      (next) => run(canvasOnboardingState['onNodesChanged'](next)),
    ),
    handler2 = onLocaleChange(() => run());
  return (
    ensureConfig()
      ['then'](handler)
      ['catch'](() => {}),
    () => {
      ((enabled2 = !![]),
        window['removeEventListener'](API_CONFIG_CHANGED_EVENT, result),
        target?.(),
        handler2(),
        el2['remove']());
    }
  );
}
