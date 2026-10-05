import { onLocaleChange, t } from '../../i18n/index.js';
export function createApiConfigSavePresentation(
  value = globalThis['document'],
  {
    timerHost: timerHost = globalThis['window'] || globalThis,
    successDuration: successDuration = 2000,
  } = {},
) {
  const el = value?.['getElementById']('btnApiSave'),
    el2 = value?.['getElementById']('apiConfigSaveStatus');
  let item = 'auto',
    value2 = null,
    key = 0,
    index = ![];
  const run = () => {
      key += 1;
      if (value2 !== null) timerHost['clearTimeout'](value2);
      value2 = null;
    },
    handler = () => {
      const result = item === 'saving';
      el && ((el['disabled'] = result), el['setAttribute']('aria-busy', String(result)));
      if (!el2) return;
      ((el2['textContent'] = t('settings.saveStatus.' + item)),
        el2['classList']['toggle']('settings-provider-status--testing', result),
        el2['classList']['toggle']('settings-provider-status--success', item === 'saved'),
        el2['classList']['toggle']('settings-provider-status--danger', item === 'error'));
    },
    onLocaleChange2 = onLocaleChange(handler);
  return (
    handler(),
    {
      update(data) {
        if (index) return;
        (run(), (item = data), handler());
        if (item === 'saved') {
          const options = key;
          value2 = timerHost['setTimeout'](() => {
            if (index || key !== options) return;
            ((value2 = null), (item = 'auto'), handler());
          }, successDuration);
        }
      },
      destroy() {
        ((index = !![]), run(), onLocaleChange2?.());
      },
    }
  );
}
