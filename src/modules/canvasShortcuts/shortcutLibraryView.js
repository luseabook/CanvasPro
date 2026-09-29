import {
  createDefaultShortcutCatalog,
  getAvailableShortcutTemplates,
  resolveShortcutCategory,
} from './shortcutCatalog.js';
import { createShortcutCard } from './shortcutPresentation.js';
import { showContextMenu } from '../interaction/contextMenuPresenter.js';
export function createShortcutLibraryView(_0x40d8ff, { onActivate: _0x24712b }) {
  const _0x48b1a9 = _0x40d8ff['querySelector']('.canvas-shortcuts-rail');
  _0x48b1a9['classList']['add']('v2-node-menu-compact');
  const _0x5d9cf5 = createDefaultShortcutCatalog()['items'];
  let _0x4d4818,
    _0xb416d0 = ![],
    _0x31c9e8 = null,
    _0x3b2b24 = null;
  function _0x2ec9f9() {
    _0x31c9e8?.['close']({ restoreFocus: ![] });
  }
  function _0x461a0b(_0x2e3b07, _0x2c8507 = ![]) {
    if (_0x3b2b24 === _0x2e3b07) {
      _0x2ec9f9();
      return;
    }
    _0x2ec9f9();
    const _0xde0d0 = _0x2e3b07['dataset']['shortcutCategory'],
      _0x419fd7 = _0x5d9cf5['find']((_0xffd416) => _0xffd416['icon'] === _0xde0d0),
      _0x128c88 = [
        { ..._0x419fd7, name: _0x419fd7['name'] + '节点' },
        ...getAvailableShortcutTemplates(_0x4d4818)['filter'](
          (_0x792f81) => resolveShortcutCategory(_0x792f81) === _0xde0d0,
        ),
      ],
      _0x790001 = _0x2e3b07['getBoundingClientRect']();
    ((_0x3b2b24 = _0x2e3b07),
      _0x2e3b07['setAttribute']('aria-expanded', 'true'),
      (_0x31c9e8 = showContextMenu(
        _0x790001['left'],
        _0x790001['top'] - 0x8,
        _0x128c88['map']((_0x39d1d4) => {
          const _0x182bdf = createShortcutCard(_0x39d1d4, { preview: !![] });
          return {
            label: _0x39d1d4['name'],
            desc: _0x182bdf['querySelector']('.canvas-shortcut-description')['textContent'],
            iconEl: _0x182bdf['querySelector']('.canvas-shortcut-icon')['firstElementChild'],
            badge: _0x39d1d4['badge'],
            action: () => _0x24712b(_0x39d1d4, _0x2e3b07),
          };
        }),
        {
          className: 'v2-canvas-ctx-menu v2-node-menu-compact canvas-shortcuts-menu',
          ariaLabel: _0x419fd7['name'] + '模板',
          preferredPlacement: 'top',
          restoreTarget: _0x2e3b07,
          ownerElement: _0x48b1a9,
          ownerRoot: _0x40d8ff,
          dismissOnOwnerPointerDown: ![],
          autoFocus: _0x2c8507,
          onClose: () => {
            (_0x2e3b07['setAttribute']('aria-expanded', 'false'), (_0x3b2b24 = null), (_0x31c9e8 = null));
          },
        },
      )));
  }
  return (
    _0x48b1a9['addEventListener']('click', (_0x38999d) => {
      const _0x57bece = _0x38999d['target']['closest']('[data-shortcut-category]');
      if (!_0x57bece) return;
      (_0x38999d['stopPropagation'](), _0x461a0b(_0x57bece, _0x38999d['detail'] === 0x0));
    }),
    _0x48b1a9['addEventListener']('keydown', (_0x8a47a6) => {
      const _0x4685da = _0x8a47a6['target']['closest']('[data-shortcut-category]');
      if (!_0x4685da) return;
      if (_0x8a47a6['key'] === 'Escape')
        (_0x8a47a6['preventDefault'](), _0x8a47a6['stopPropagation'](), _0x2ec9f9());
      else {
        if (_0x8a47a6['key'] === 'ArrowUp' || _0x8a47a6['key'] === 'ArrowDown') {
          (_0x8a47a6['preventDefault'](), _0x8a47a6['stopPropagation']());
          if (_0x3b2b24 === _0x4685da) _0x31c9e8?.['menu']['querySelector']('[role="menuitem"]')?.['focus']();
          else _0x461a0b(_0x4685da, !![]);
        }
      }
    }),
    window['addEventListener']('resize', _0x2ec9f9),
    {
      close: _0x2ec9f9,
      render(_0x54e32f) {
        (_0x2ec9f9(), (_0x4d4818 = _0x54e32f));
        const _0x370024 = getAvailableShortcutTemplates(_0x4d4818)['length'] > 0x0;
        (_0x40d8ff['classList']['toggle']('has-template-library', _0x370024),
          _0x370024
            ? !_0xb416d0 &&
              (_0x48b1a9['setAttribute']('aria-label', '模板分类'),
              _0x48b1a9['replaceChildren'](
                ..._0x5d9cf5['map']((_0xb8279d) => {
                  const _0x252f7f = createShortcutCard({
                    ..._0xb8279d,
                    subtitle: '查看' + _0xb8279d['name'] + '模板',
                  });
                  return (
                    delete _0x252f7f['dataset']['shortcutId'],
                    (_0x252f7f['dataset']['shortcutCategory'] = _0xb8279d['icon']),
                    _0x252f7f['setAttribute']('aria-haspopup', 'menu'),
                    _0x252f7f['setAttribute']('aria-expanded', 'false'),
                    _0x252f7f
                  );
                }),
              ))
            : (_0x48b1a9['setAttribute']('aria-label', '快捷方式'),
              _0x48b1a9['replaceChildren'](
                ..._0x4d4818['items']
                  ['filter']((_0x3d5283) => _0x3d5283['enabled'])
                  ['map']((_0x55b3aa) => createShortcutCard(_0x55b3aa)),
              )),
          (_0xb416d0 = _0x370024));
      },
      resolveItem(_0x4b3cbb) {
        return _0x4d4818['items']['find'](
          (_0x56d47f) => _0x56d47f['enabled'] && _0x56d47f['id'] === _0x4b3cbb['dataset']['shortcutId'],
        );
      },
    }
  );
}
