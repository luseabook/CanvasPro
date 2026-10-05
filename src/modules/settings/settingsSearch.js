import { onLocaleChange, t } from '../../i18n/index.js';
import { isModelProviderPubliclyListed } from '../../manifests/modelCatalogVisibility.js';
import { listFocusableElements } from '../../utils/focusTrap.js';
import { setModelServiceSettingsSearchCards } from './modelServiceSettingsNavigator.js';
function isSearchable(value, enabled) {
  const item = value['closest']('[data-model-service-provider]');
  if (item && !isModelProviderPubliclyListed(item['dataset']['modelServiceProvider'])) return ![];
  for (let enabled2 = value; enabled2 && enabled2 !== enabled; enabled2 = enabled2['parentElement']) {
    if (enabled2['hidden'] && !enabled2['classList']['contains']('model-service-provider-detail')) return ![];
    if (
      enabled2['classList']['contains']('dev-mode-only') &&
      !enabled['ownerDocument']['body']['classList']['contains']('dev-mode')
    )
      return ![];
  }
  return !![];
}
export function collectSettingsSearchEntries(key) {
  const index = [];
  return (
    key['querySelectorAll']('.settings-pane:not(#pane-search)')['forEach']((result) => {
      const paneName = result['id']['replace'](/^pane-/, ''),
        category = result['querySelector']('.settings-pane-title')?.['textContent']['trim']() || '',
        target = result['querySelector']('.settings-pane-body') || result;
      (index['push']({
        paneName: paneName,
        category: category,
        title: category,
        description: '',
        target: target,
      }),
        result['querySelectorAll']('.settings-label, .settings-card-title, .sc-label')['forEach']((data) => {
          if (!isSearchable(data, result)) return;
          const target2 =
              result['dataset']['settingsSearchScope'] === 'pane'
                ? target
                : data['closest']('[data-model-service-provider], .settings-section') || target,
            title = data['textContent']['trim'](),
            description = Array['from'](target2['querySelectorAll']('.settings-desc[data-i18n]'))
              ['map']((options) => options['textContent']['trim']())
              ['join'](' '),
            source = data['closest']('.settings-card')
              ?.['querySelector']('.settings-card-title')
              ?.['textContent']['trim'](),
            category2 = source && source !== title ? category + ' · ' + source : category;
          if (title)
            index['push']({
              paneName: paneName,
              category: category2,
              title: title,
              description: description,
              target: target2,
            });
        }));
    }),
    index
  );
}
export function initSettingsSearch({ root: root, activatePane: activatePane }) {
  const enabled3 = root?.['querySelector']?.('#settingsSearchInput'),
    enabled4 = root?.['querySelector']?.('#settingsSearchResults'),
    enabled5 = root?.['querySelector']?.('#settingsSearchStatus');
  if (!enabled3 || !enabled4 || !enabled5) return null;
  let next = 'general',
    enabled6 = ![],
    enabled7 = ![];
  const current = Array['from'](root['querySelectorAll']('.settings-pane:not(#pane-search)')),
    entry = new Set(),
    record = new Map(),
    handler = () => {
      (entry['forEach']((payload) => payload['classList']['remove']('is-settings-search-hidden')),
        entry['clear'](),
        current['forEach']((handle) => handle['classList']['remove']('is-settings-search-match')));
    },
    handler2 = (state, config) => {
      if (config['has'](state)) return;
      for (const scope of state['children']) {
        Array['from'](config)['some']((input) => scope === input || scope['contains'](input))
          ? handler2(scope, config)
          : (scope['classList']['add']('is-settings-search-hidden'), entry['add'](scope));
      }
    },
    clear = ({ restore: restore = !![] } = {}) => {
      ((enabled3['value'] = ''),
        (enabled5['textContent'] = ''),
        handler(),
        root['classList']['remove']('is-settings-searching'));
      if (enabled6) setModelServiceSettingsSearchCards(null);
      if (enabled6 && restore) activatePane(next);
      (record['forEach'](({ top: top, left: left }, output) => {
        ((output['scrollTop'] = top), (output['scrollLeft'] = left));
      }),
        record['clear'](),
        (enabled6 = ![]));
    },
    handler3 = () => {
      if (enabled7) return;
      const enabled8 = enabled3['value']['trim']()['toLocaleLowerCase']();
      if (!enabled8) {
        clear({ restore: !![] });
        return;
      }
      !enabled6 &&
        ((next = root['querySelector']('.settings-nav-item.active')?.['dataset']['pane'] || 'general'),
        current['forEach']((value2) => {
          const top2 = value2['querySelector']('.settings-pane-body');
          if (top2)
            record['set'](top2, {
              top: top2['scrollTop'],
              left: top2['scrollLeft'],
            });
        }),
        (enabled6 = !![]));
      const value3 = enabled8['split'](/\s+/),
        settingsSearchEntries = collectSettingsSearchEntries(root)['filter']((value4) => {
          const value5 = (value4['category'] + ' ' + value4['title'] + ' ' + value4['description'])[
            'toLocaleLowerCase'
          ]();
          return value3['every']((value6) => value5['includes'](value6));
        });
      handler();
      const count = new Set(settingsSearchEntries['map']((value7) => value7['target']));
      count['forEach']((value8) => {
        if (Array['from'](count)['some']((value9) => value9 !== value8 && value9['contains'](value8)))
          count['delete'](value8);
      });
      const value10 = new Set();
      (current['forEach']((value11) => {
        const enabled9 = new Set(Array['from'](count)['filter']((value12) => value11['contains'](value12)));
        if (!enabled9['size']) return;
        (value11['classList']['add']('is-settings-search-match'),
          value11['querySelectorAll']('[data-model-service-provider]')['forEach']((value13) => {
            if (
              Array['from'](enabled9)['some'](
                (value14) => value14 === value13 || value14['contains'](value13),
              )
            )
              value10['add'](value13);
          }));
        const value15 = value11['querySelector']('.settings-pane-body');
        if (value15) handler2(value15, enabled9);
      }),
        setModelServiceSettingsSearchCards(value10),
        root['classList']['add']('is-settings-searching'),
        (enabled4['scrollTop'] = 0),
        (enabled5['textContent'] = count['size']
          ? t('settings.search.count', { count: count['size'] })
          : t('settings.search.empty')),
        activatePane('search'));
    },
    value16 = (value17) => {
      if (value17['defaultPrevented'] || value17['isComposing'] || enabled7) return;
      if (value17['key'] === 'Escape' && enabled6)
        (value17['preventDefault'](),
          value17['stopPropagation'](),
          clear({ restore: !![] }),
          enabled3['focus']({ preventScroll: !![] }));
      else
        value17['key'] === 'ArrowDown' &&
          value17['target'] === enabled3 &&
          enabled6 &&
          (value17['preventDefault'](), listFocusableElements(enabled4)[0]?.['focus']());
    },
    value18 = () => {
      enabled7 = !![];
    },
    value19 = () => {
      ((enabled7 = ![]), handler3());
    };
  (enabled3['addEventListener']('input', handler3),
    enabled3['addEventListener']('compositionstart', value18),
    enabled3['addEventListener']('compositionend', value19),
    enabled3['addEventListener']('keydown', value16),
    enabled4['addEventListener']('keydown', value16));
  const onLocaleChange2 = onLocaleChange(() =>
    queueMicrotask(() => {
      if (enabled6) handler3();
    }),
  );
  return {
    clear: clear,
    destroy() {
      (clear({ restore: !![] }),
        enabled3['removeEventListener']('input', handler3),
        enabled3['removeEventListener']('compositionstart', value18),
        enabled3['removeEventListener']('compositionend', value19),
        enabled3['removeEventListener']('keydown', value16),
        enabled4['removeEventListener']('keydown', value16),
        onLocaleChange2?.());
    },
  };
}
