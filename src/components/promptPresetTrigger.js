import { onLocaleChange, t } from '../i18n/index.js';
import { isPromptPresetNodeTypeSupported } from '../modules/promptPresets.js';
import { closeSlashMenu, openPromptPresetMenu } from '../modules/slashMenu.js';
const PROMPT_PRESET_BOOK_ICON_HTML = '<span class="prompt-preset-trigger-icon" aria-hidden="true"></span>';
export function createPromptPresetTriggerController({
  panel: _0x4c93f8,
  getPromptEl: _0x31ea29,
  getNodeType: _0x4c1655,
  getNodeId: _0x349245,
  onGenerate: _0x4a31f8,
  openMenu: openMenu = openPromptPresetMenu,
  closeMenu: closeMenu = closeSlashMenu,
} = {}) {
  if (!_0x4c93f8) return { sync() {}, remove() {} };
  const _0x10e6af = _0x4c93f8['ownerDocument'] || globalThis['document'];
  let _0x16bdb9 = _0x4c93f8['querySelector']?.('.prompt-preset-trigger') || null;
  if (!_0x16bdb9) {
    _0x16bdb9 = _0x10e6af?.['createElement']?.('button') || null;
    if (!_0x16bdb9) return { sync() {}, remove() {} };
    ((_0x16bdb9['type'] = 'button'),
      (_0x16bdb9['className'] = 'prompt-preset-trigger'),
      (_0x16bdb9['innerHTML'] = PROMPT_PRESET_BOOK_ICON_HTML),
      _0x16bdb9['setAttribute']('aria-haspopup', 'menu'),
      _0x16bdb9['setAttribute']('aria-expanded', 'false'),
      _0x4c93f8['appendChild'](_0x16bdb9));
  }
  _0x4c93f8['classList']?.['add']('has-prompt-preset-trigger');
  const _0x3a01d9 = (_0x2c1d28) => {
      const _0x5e0f4e = _0x2c1d28 === !![],
        _0x440f1a = _0x4c93f8['classList']?.['contains']?.('is-prompt-expanded') === !![];
      (_0x16bdb9?.['setAttribute']('aria-expanded', String(_0x5e0f4e)),
        _0x16bdb9?.['classList']?.['toggle']?.('is-open', _0x5e0f4e),
        _0x4c93f8['classList']?.['toggle']?.('has-prompt-preset-drawer', _0x5e0f4e && _0x440f1a));
    },
    _0x36257c = () => {
      const _0x34274a = t('promptPresets.triggerLabel');
      ((_0x16bdb9['title'] = _0x34274a), _0x16bdb9['setAttribute']('aria-label', _0x34274a));
      const _0x370476 = isPromptPresetNodeTypeSupported(_0x4c1655?.());
      _0x16bdb9['hidden'] = !_0x370476;
      if (!_0x370476) _0x3a01d9(![]);
    },
    _0x1f7090 = (_0x4ba681) => {
      (_0x4ba681['preventDefault'](), _0x4ba681['stopPropagation']());
    },
    _0x589cfd = (_0x45379f) => {
      (_0x45379f['preventDefault'](), _0x45379f['stopPropagation']());
      if (_0x16bdb9['getAttribute']('aria-expanded') === 'true') {
        closeMenu();
        return;
      }
      const _0x525d1b = _0x31ea29?.(),
        _0x490a8e = _0x4c1655?.();
      if (!_0x525d1b || !isPromptPresetNodeTypeSupported(_0x490a8e)) return;
      const _0x126e65 = _0x4c93f8['classList']?.['contains']?.('is-prompt-expanded') === !![];
      (openMenu({
        promptEl: _0x525d1b,
        nodeType: _0x490a8e,
        nodeId: _0x349245?.(),
        onGenerate: _0x4a31f8,
        anchorEl: _0x16bdb9,
        placement: _0x126e65 ? 'expanded-panel' : 'above-end',
        containerEl: _0x126e65 ? _0x4c93f8 : null,
        onOpenChange: _0x3a01d9,
      }),
        _0x525d1b['focus']?.({ preventScroll: !![] }));
    };
  (_0x16bdb9['addEventListener']('pointerdown', _0x1f7090),
    _0x16bdb9['addEventListener']('mousedown', _0x1f7090),
    _0x16bdb9['addEventListener']('click', _0x589cfd),
    _0x36257c());
  const _0x283e05 = onLocaleChange(_0x36257c),
    _0x291a48 = () => {
      _0x283e05?.();
      if (_0x16bdb9?.['getAttribute']('aria-expanded') === 'true') closeMenu();
      (_0x16bdb9?.['remove']?.(),
        (_0x16bdb9 = null),
        _0x4c93f8['classList']?.['remove']('has-prompt-preset-trigger', 'has-prompt-preset-drawer'));
    };
  return { sync: _0x36257c, remove: _0x291a48 };
}
