import { t } from '../../i18n/index.js';
import { formatCleanupBytes } from '../../services/localAssetCleanupService.js';
const PAGE_SIZE = 50,
  text = (value, item = {}) => t('settings.fileSave.cleanupRuntime.' + value, item);
export function createLocalAssetCleanupList({
  list: list,
  toolbar: toolbar,
  details: details,
  onSelectionChange: onSelectionChange,
}) {
  let response = null,
    page = 0,
    enabled = false;
  const map = new Set(),
    map2 = new Map(),
    el = document['createElement']('span');
  ((el['className'] = 'settings-desc'),
    el['setAttribute']('aria-live', 'polite'),
    toolbar['appendChild'](el));
  function run(key, handler) {
    const el2 = document['createElement']('button');
    return (
      (el2['type'] = 'button'),
      (el2['className'] = 'settings-save-btn settings-btn-ghost'),
      (el2['textContent'] = text(key)),
      (el2['dataset']['cleanupAction'] = key),
      el2['addEventListener']('click', () => {
        if (!el2['disabled']) handler();
      }),
      toolbar['appendChild'](el2),
      el2
    );
  }
  const run2 = () => (response?.['items'] || [])['slice'](page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    selectedItems = () => (response?.['items'] || [])['filter']((index) => map['has'](index['localPath'])),
    el3 = run('selectPage', () => {
      (run2()['forEach']((result) => map['add'](result['localPath'])), run3());
    }),
    el4 = run('clearSelection', () => {
      (map['clear'](), run3());
    }),
    el5 = run('previousPage', () => {
      (page--, run4());
    }),
    el6 = document['createElement']('span');
  ((el6['className'] = 'settings-desc'), toolbar['appendChild'](el6));
  const el7 = run('nextPage', () => {
    (page++, run4());
  });
  function run3() {
    const count = selectedItems(),
      enabled2 = response?.['ok'] === true && response?.['canTrash'] !== false && !enabled;
    ((el['textContent'] = text('selectedSummary', {
      count: count['length'],
      bytes: formatCleanupBytes(
        count['reduce']((data, options) => data + Number(options['size'] || 0), 0),
      ),
    })),
      (el3['disabled'] = !enabled2 || !run2()['length']),
      (el4['disabled'] = enabled || !map['size']),
      (el5['disabled'] = enabled || page === 0),
      (el7['disabled'] = enabled || (page + 1) * PAGE_SIZE >= (response?.['items']?.['length'] || 0)),
      (el6['textContent'] = text('pageSummary', {
        page: page + 1,
        pages: Math['max'](1, Math['ceil']((response?.['items']?.['length'] || 0) / PAGE_SIZE)),
      })));
    for (const [target, el8] of map2) {
      ((el8['checked'] = map['has'](target)), (el8['disabled'] = !enabled2));
    }
    onSelectionChange(enabled2 ? count : []);
  }
  function run4() {
    (map2['clear'](),
      list['replaceChildren'](),
      (list['hidden'] = !response?.['items']?.['length']),
      (toolbar['hidden'] = list['hidden']));
    for (const path of run2()) {
      const el9 = document['createElement']('label');
      el9['className'] = 'settings-local-cleanup-item';
      const el10 = document['createElement']('input');
      ((el10['type'] = 'checkbox'),
        (el10['className'] = 'settings-local-cleanup-checkbox'),
        el10['setAttribute']('aria-label', text('selectFile', { path: path['localPath'] })),
        el10['addEventListener']('change', () => {
          if (el10['disabled']) return;
          if (el10['checked']) map['add'](path['localPath']);
          else map['delete'](path['localPath']);
          run3();
        }),
        map2['set'](path['localPath'], el10));
      const el11 = document['createElement']('div');
      el11['className'] = 'settings-local-cleanup-info';
      const el12 = document['createElement']('div');
      ((el12['className'] = 'settings-local-cleanup-filename'),
        (el12['textContent'] = path['localPath']['split']('/')['pop']()));
      const el13 = document['createElement']('div');
      ((el13['className'] = 'settings-local-cleanup-path'),
        (el13['textContent'] = path['absolutePath'] || path['localPath']),
        (el13['dataset']['tooltip'] = el13['textContent']),
        (el13['dataset']['tooltipOverflow'] = 'true'),
        el11['appendChild'](el12),
        el11['appendChild'](el13));
      const el14 = document['createElement']('span');
      el14['className'] = 'settings-local-cleanup-meta';
      const source = ['image', 'video', 'audio', 'waveform']['includes'](path['kind'])
        ? path['kind']
        : 'media';
      ((el14['textContent'] = text('kinds.' + source) + ' · ' + formatCleanupBytes(path['size'])),
        el9['appendChild'](el10),
        el9['appendChild'](el11),
        el9['appendChild'](el14),
        list['appendChild'](el9));
    }
    ((list['scrollTop'] = 0), run3());
  }
  return {
    selectedItems: selectedItems,
    setBusy(next) {
      ((enabled = next), run3());
    },
    setScan(current) {
      ((response = current), map['clear'](), (page = 0));
      const count2 = response?.['coverage'],
        list2 = response ? [text('scopeNotice')] : [];
      if (count2) {
        list2['push'](
          text('scopeProjects', {
            count: count2['projectFiles'] || 0,
            path: count2['canvasDirectory'] || '—',
          }),
        );
        for (const entry of count2['mediaDirectories'] || [])
          list2['push'](entry['prefix'] + ' → ' + entry['path']);
      }
      for (const error of response?.['warnings'] || [])
        list2['push'](error['source'] + ': ' + error['message']);
      ((details['textContent'] = list2['join']('\n')), (details['hidden'] = !list2['length']), run4());
    },
  };
}
