import {
  API_CONFIG_CHANGED_EVENT,
  ensureConfig,
  getApiConfigSnapshot,
  isApiConfigLoaded,
} from '../../../api/configApi.js';
import { onLocaleChange, t } from '../../i18n/index.js';
import { openSettingsPanelToField } from '../settings/panelSettings.js';
export function hasConfiguredApi(_0x4ec3bb = {}) {
  return Object['values'](_0x4ec3bb?.['providers'] || {})['some']((_0x9a599b) =>
    [_0x9a599b?.['apiKey'], _0x9a599b?.['modelApiKey']]['some'](
      (_0xb57586) => typeof _0xb57586 === 'string' && _0xb57586['trim']()['length'] > 0x0,
    ),
  );
}
export function createCanvasOnboardingState() {
  let _0x203dae = null,
    _0xc4adfa = ![],
    _0x245e55 = ![];
  return {
    update(_0x3b1539, _0x59c710 = 0x0) {
      _0xc4adfa = hasConfiguredApi(_0x3b1539);
      if (_0x203dae === null) _0x203dae = !_0xc4adfa;
      !_0xc4adfa && ((_0x203dae = !![]), (_0x245e55 = ![]));
      if (_0x203dae && _0xc4adfa && _0x59c710 > 0x0) _0x245e55 = !![];
      return { visible: _0x203dae && !_0x245e55, configured: _0xc4adfa };
    },
    onNodesChanged(_0xa020fc) {
      if (_0x203dae && _0xc4adfa && _0xa020fc > 0x0) _0x245e55 = !![];
      return { visible: _0x203dae === !![] && !_0x245e55, configured: _0xc4adfa };
    },
  };
}
export function initEmptyCanvasOnboarding({ store: _0x1320ec }) {
  const _0x40ec62 = document['querySelector']('#emptyHint .empty-hint-main');
  if (!_0x40ec62 || _0x40ec62['querySelector']('.canvas-onboarding')) return;
  const _0x4ca69e = document['createElement']('div');
  ((_0x4ca69e['className'] = 'canvas-onboarding'),
    (_0x4ca69e['hidden'] = !![]),
    _0x4ca69e['setAttribute']('role', 'group'));
  const _0x498f33 = document['createElement']('button');
  ((_0x498f33['type'] = 'button'),
    (_0x498f33['className'] = 'canvas-onboarding-step canvas-onboarding-connect'));
  const _0x16f38e = document['createElement']('span');
  ((_0x16f38e['className'] = 'canvas-onboarding-divider'), _0x16f38e['setAttribute']('aria-hidden', 'true'));
  const _0x58ee63 = document['createElement']('span');
  ((_0x58ee63['className'] = 'canvas-onboarding-step canvas-onboarding-create'),
    _0x4ca69e['append'](_0x498f33, _0x16f38e, _0x58ee63),
    _0x40ec62['prepend'](_0x4ca69e));
  const _0xca3488 = createCanvasOnboardingState();
  let _0x4a5a19 = { visible: ![], configured: ![] },
    _0x4b265 = ![];
  function _0x2573cc(_0x37b129 = _0x4a5a19) {
    ((_0x4a5a19 = _0x37b129),
      (_0x4ca69e['hidden'] = !_0x37b129['visible']),
      _0x4ca69e['classList']['toggle']('is-configured', _0x37b129['configured']),
      _0x4ca69e['setAttribute']('aria-label', t('emptyHint.onboarding.label')),
      (_0x498f33['textContent'] = t(
        _0x37b129['configured'] ? 'emptyHint.onboarding.connected' : 'emptyHint.onboarding.connect',
      )),
      (_0x498f33['disabled'] = _0x37b129['configured']),
      _0x498f33['setAttribute']('aria-current', _0x37b129['configured'] ? 'false' : 'step'),
      (_0x58ee63['textContent'] = t('emptyHint.onboarding.create')),
      _0x58ee63['setAttribute']('aria-current', _0x37b129['configured'] ? 'step' : 'false'));
  }
  const _0x4d9864 = () => _0x1320ec['getStateRaw']()['_nodeCount'] || 0x0,
    _0x42cf8f = () => {
      if (!_0x4b265 && isApiConfigLoaded())
        _0x2573cc(_0xca3488['update'](getApiConfigSnapshot(), _0x4d9864()));
    },
    _0x4b892c = (_0x201dd6) => {
      if (_0x201dd6['detail']?.['reason'] === 'save-pending') return;
      _0x42cf8f();
    };
  (_0x498f33['addEventListener']('click', (_0x15136d) => {
    (_0x15136d['stopPropagation'](), openSettingsPanelToField({ paneName: 'api-input' }));
  }),
    _0x4ca69e['addEventListener']('dblclick', (_0x26c53d) => _0x26c53d['stopPropagation']()),
    window['addEventListener'](API_CONFIG_CHANGED_EVENT, _0x4b892c));
  const _0x5808b2 = _0x1320ec['subscribeSelector'](
      (_0xc6ac60) => _0xc6ac60['_nodeCount'] || 0x0,
      (_0x27c279) => _0x2573cc(_0xca3488['onNodesChanged'](_0x27c279)),
    ),
    _0x15a3bb = onLocaleChange(() => _0x2573cc());
  return (
    ensureConfig()
      ['then'](_0x42cf8f)
      ['catch'](() => {}),
    () => {
      ((_0x4b265 = !![]),
        window['removeEventListener'](API_CONFIG_CHANGED_EVENT, _0x4b892c),
        _0x5808b2?.(),
        _0x15a3bb(),
        _0x4ca69e['remove']());
    }
  );
}
