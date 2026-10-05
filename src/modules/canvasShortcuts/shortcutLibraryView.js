import {
  createDefaultShortcutCatalog,
  getAvailableShortcutTemplates,
  resolveShortcutCategory,
} from './shortcutCatalog.js';
import { createShortcutCard } from './shortcutPresentation.js';
import { showContextMenu } from '../interaction/contextMenuPresenter.js';
export function createShortcutLibraryView(ownerRoot, { onActivate: onActivate }) {
  const ownerElement = ownerRoot['querySelector']('.canvas-shortcuts-rail');
  ownerElement['classList']['add']('v2-node-menu-compact');
  const list = createDefaultShortcutCatalog()['items'];
  let args,
    enabled = ![],
    showContextMenu2 = null,
    value = null;
  function close() {
    showContextMenu2?.['close']({ restoreFocus: ![] });
  }
  function run(restoreTarget, autoFocus = ![]) {
    if (value === restoreTarget) {
      close();
      return;
    }
    close();
    const item = restoreTarget['dataset']['shortcutCategory'],
      name = list['find']((key) => key['icon'] === item),
      list2 = [
        { ...name, name: name['name'] + '节点' },
        ...getAvailableShortcutTemplates(args)['filter']((index) => resolveShortcutCategory(index) === item),
      ],
      box = restoreTarget['getBoundingClientRect']();
    ((value = restoreTarget),
      restoreTarget['setAttribute']('aria-expanded', 'true'),
      (showContextMenu2 = showContextMenu(
        box['left'],
        box['top'] - 8,
        list2['map']((label) => {
          const desc = createShortcutCard(label, { preview: !![] });
          return {
            label: label['name'],
            desc: desc['querySelector']('.canvas-shortcut-description')['textContent'],
            iconEl: desc['querySelector']('.canvas-shortcut-icon')['firstElementChild'],
            badge: label['badge'],
            action: () => onActivate(label, restoreTarget),
          };
        }),
        {
          className: 'v2-canvas-ctx-menu v2-node-menu-compact canvas-shortcuts-menu',
          ariaLabel: name['name'] + '模板',
          preferredPlacement: 'top',
          restoreTarget: restoreTarget,
          ownerElement: ownerElement,
          ownerRoot: ownerRoot,
          dismissOnOwnerPointerDown: ![],
          autoFocus: autoFocus,
          onClose: () => {
            (restoreTarget['setAttribute']('aria-expanded', 'false'),
              (value = null),
              (showContextMenu2 = null));
          },
        },
      )));
  }
  return (
    ownerElement['addEventListener']('click', (event) => {
      const enabled2 = event['target']['closest']('[data-shortcut-category]');
      if (!enabled2) return;
      (event['stopPropagation'](), run(enabled2, event['detail'] === 0));
    }),
    ownerElement['addEventListener']('keydown', (event2) => {
      const enabled3 = event2['target']['closest']('[data-shortcut-category]');
      if (!enabled3) return;
      if (event2['key'] === 'Escape') (event2['preventDefault'](), event2['stopPropagation'](), close());
      else {
        if (event2['key'] === 'ArrowUp' || event2['key'] === 'ArrowDown') {
          (event2['preventDefault'](), event2['stopPropagation']());
          if (value === enabled3)
            showContextMenu2?.['menu']['querySelector']('[role="menuitem"]')?.['focus']();
          else run(enabled3, !![]);
        }
      }
    }),
    window['addEventListener']('resize', close),
    {
      close: close,
      render(result) {
        (close(), (args = result));
        const availableShortcutTemplates = getAvailableShortcutTemplates(args)['length'] > 0;
        (ownerRoot['classList']['toggle']('has-template-library', availableShortcutTemplates),
          availableShortcutTemplates
            ? !enabled &&
              (ownerElement['setAttribute']('aria-label', '模板分类'),
              ownerElement['replaceChildren'](
                ...list['map']((error) => {
                  const el = createShortcutCard({
                    ...error,
                    subtitle: '查看' + error['name'] + '模板',
                  });
                  return (
                    delete el['dataset']['shortcutId'],
                    (el['dataset']['shortcutCategory'] = error['icon']),
                    el['setAttribute']('aria-haspopup', 'menu'),
                    el['setAttribute']('aria-expanded', 'false'),
                    el
                  );
                }),
              ))
            : (ownerElement['setAttribute']('aria-label', '快捷方式'),
              ownerElement['replaceChildren'](
                ...args['items']
                  ['filter']((data) => data['enabled'])
                  ['map']((options) => createShortcutCard(options)),
              )),
          (enabled = availableShortcutTemplates));
      },
      resolveItem(el2) {
        return args['items']['find'](
          (target) => target['enabled'] && target['id'] === el2['dataset']['shortcutId'],
        );
      },
    }
  );
}
