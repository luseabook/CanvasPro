import { onLocaleChange, t } from '../../i18n/index.js';
export function createApiConfigSavePresentation(
  _0x40d1ad = globalThis['document'],
  {
    timerHost: timerHost = globalThis['window'] || globalThis,
    successDuration: successDuration = 0x7d0,
  } = {},
) {
  const _0x1e4025 = _0x40d1ad?.['getElementById']('btnApiSave'),
    _0x2e2696 = _0x40d1ad?.['getElementById']('apiConfigSaveStatus');
  let _0x4c7045 = 'auto',
    _0x28b6e8 = null,
    _0x1dc040 = 0x0,
    _0x197b12 = ![];
  const _0x2f83d4 = () => {
      _0x1dc040 += 0x1;
      if (_0x28b6e8 !== null) timerHost['clearTimeout'](_0x28b6e8);
      _0x28b6e8 = null;
    },
    _0x2c9f2f = () => {
      const _0x2e4ea5 = _0x4c7045 === 'saving';
      _0x1e4025 &&
        ((_0x1e4025['disabled'] = _0x2e4ea5), _0x1e4025['setAttribute']('aria-busy', String(_0x2e4ea5)));
      if (!_0x2e2696) return;
      ((_0x2e2696['textContent'] = t('settings.saveStatus.' + _0x4c7045)),
        _0x2e2696['classList']['toggle']('settings-provider-status--testing', _0x2e4ea5),
        _0x2e2696['classList']['toggle']('settings-provider-status--success', _0x4c7045 === 'saved'),
        _0x2e2696['classList']['toggle']('settings-provider-status--danger', _0x4c7045 === 'error'));
    },
    _0x393798 = onLocaleChange(_0x2c9f2f);
  return (
    _0x2c9f2f(),
    {
      update(_0x1d6109) {
        if (_0x197b12) return;
        (_0x2f83d4(), (_0x4c7045 = _0x1d6109), _0x2c9f2f());
        if (_0x4c7045 === 'saved') {
          const _0x4e0824 = _0x1dc040;
          _0x28b6e8 = timerHost['setTimeout'](() => {
            if (_0x197b12 || _0x1dc040 !== _0x4e0824) return;
            ((_0x28b6e8 = null), (_0x4c7045 = 'auto'), _0x2c9f2f());
          }, successDuration);
        }
      },
      destroy() {
        ((_0x197b12 = !![]), _0x2f83d4(), _0x393798?.());
      },
    }
  );
}
