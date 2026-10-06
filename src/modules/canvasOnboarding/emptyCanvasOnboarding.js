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
      (item) => typeof item === 'string' && item['trim']()['length'] > 0,
    ),
  );
}
export function createCanvasOnboardingState() {
  let visible = null,
    configured = false,
    enabled = false;
  return {
    update(key, count = 0) {
      configured = hasConfiguredApi(key);
      if (visible === null) visible = !configured;
      !configured && ((visible = true), (enabled = false));
      if (visible && configured && count > 0) enabled = true;
      return { visible: visible && !enabled, configured: configured };
    },
    onNodesChanged(count2) {
      if (visible && configured && count2 > 0) enabled = true;
      return { visible: visible === true && !enabled, configured: configured };
    },
  };
}
export function initEmptyCanvasOnboarding({ store: store }) {
  const root = document['querySelector']('#emptyHint .empty-hint-main');
  if (!root || root['querySelector']('.canvas-onboarding')) return;
  const container = document['createElement']('div');
  ((container['className'] = 'canvas-onboarding'),
    (container['hidden'] = true),
    container['setAttribute']('role', 'group'));
  const stepLabel = document['createElement']('span');
  stepLabel['className'] = 'canvas-onboarding-step';
  const actions = document['createElement']('div');
  actions['className'] = 'canvas-onboarding-actions';
  const connectButton = document['createElement']('button');
  ((connectButton['type'] = 'button'),
    (connectButton['className'] = 'canvas-onboarding-step canvas-onboarding-connect'));
  const officialButton = document['createElement']('button');
  ((officialButton['type'] = 'button'),
    (officialButton['className'] = 'canvas-onboarding-connect canvas-onboarding-official'));
  const help = document['createElement']('span');
  help['className'] = 'canvas-onboarding-help';
  const createStep = document['createElement']('span');
  createStep['className'] = 'canvas-onboarding-step canvas-onboarding-create';
  (actions['append'](officialButton, connectButton),
    container['append'](stepLabel, actions, help, createStep),
    root['prepend'](container));
  const canvasOnboardingState = createCanvasOnboardingState();
  let index = { visible: false, configured: false },
    enabled2 = false;
  function run(enabled3 = index) {
    ((index = enabled3),
      (container['hidden'] = !enabled3['visible']),
      root['classList']['toggle']('has-onboarding', enabled3['visible']),
      container['classList']['toggle']('is-configured', enabled3['configured']),
      container['setAttribute']('aria-label', t('emptyHint.onboarding.label')),
      (stepLabel['textContent'] = t('emptyHint.onboarding.chooseService')),
      stepLabel['setAttribute']('aria-current', enabled3['configured'] ? 'false' : 'step'),
      (connectButton['textContent'] = t(
        enabled3['configured'] ? 'emptyHint.onboarding.connected' : 'emptyHint.onboarding.connect',
      )),
      (connectButton['disabled'] = enabled3['configured']),
      (createStep['textContent'] = t('emptyHint.onboarding.create')),
      createStep['setAttribute']('aria-current', enabled3['configured'] ? 'step' : 'false'),
      (help['textContent'] = t('emptyHint.onboarding.serviceHint')),
      (officialButton['textContent'] = t('emptyHint.onboarding.official')),
      (help['hidden'] = officialButton['hidden'] = enabled3['configured']));
  }
  const run2 = () => store['getStateRaw']()['_nodeCount'] || 0,
    handler = () => {
      if (!enabled2 && isApiConfigLoaded())
        run(canvasOnboardingState['update'](getApiConfigSnapshot(), run2()));
    },
    result = (data) => {
      if (data['detail']?.['reason'] === 'save-pending') return;
      handler();
    };
  (connectButton['addEventListener']('click', (event) => {
    (event['stopPropagation'](), openSettingsPanelToField({ paneName: 'api-input' }));
  }),
    officialButton['addEventListener']('click', (event2) => {
      (event2['stopPropagation'](),
        openSettingsPanelToField({
          paneName: 'subscription',
          fieldIds: ['officialAccountPoints', 'officialAccountOpen'],
          select: false,
          highlight: false,
        }));
    }),
    container['addEventListener']('dblclick', (event3) => event3['stopPropagation']()),
    window['addEventListener'](API_CONFIG_CHANGED_EVENT, result));
  const target = store['subscribeSelector'](
      (source) => source['_nodeCount'] || 0,
      (next) => run(canvasOnboardingState['onNodesChanged'](next)),
    ),
    handler2 = onLocaleChange(() => run());
  return (
    ensureConfig()
      ['then'](handler)
      ['catch'](() => {}),
    () => {
      ((enabled2 = true),
        window['removeEventListener'](API_CONFIG_CHANGED_EVENT, result),
        target?.(),
        handler2(),
        root['classList']['remove']('has-onboarding'),
        container['remove']());
    }
  );
}
