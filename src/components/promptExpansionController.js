import { onLocaleChange, t } from '../i18n/index.js';
import { hostPromptFloatingSurfaces } from './promptExpansionFloatingSurfaces.js';
import { beginModalInteraction } from '../services/modalInteractionScope.js';
import { createPromptExpansionMotion } from './promptExpansionMotion.js';
const EXPAND_ICON =
    '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.7\x22\x20stroke-linecap=\x22round\x22\x20stroke-linejoin=\x22round\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22M8\x203H3v5m13-5h5v5M3\x2016v5h5m13-5v5h-5\x22/></svg>',
  COLLAPSE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5"/></svg>';
let activeController = null;
export function createPromptExpansionController({
  panel: _0x1136bd,
  promptEl: _0x329eed,
  mountRoot: _0x17ffb6,
  floatingSurfaceSelector: _0x2e283a,
  externalDialogSelector: _0x281cf4,
  getTitle: _0xa70524,
  flush: _0x164bd5,
  closeMenus: _0x4587ce,
  consumeEscape: _0x7c3ea6,
  onOpen: _0x1cc2e2,
  onClose: _0x6ab89a,
}) {
  const _0x1c4e6a = _0x1136bd['ownerDocument'],
    _0x195df6 = _0x1c4e6a['defaultView'],
    _0x65a5cb = _0x1c4e6a['createElement']('button');
  ((_0x65a5cb['type'] = 'button'),
    (_0x65a5cb['className'] = 'prompt-expand-trigger'),
    _0x65a5cb['setAttribute']('aria-haspopup', 'dialog'),
    _0x1136bd['classList']['add']('has-prompt-expand'),
    _0x1136bd['appendChild'](_0x65a5cb));
  let _0xb12b15 = null,
    _0x40d758 = null,
    _0x207f0c = null,
    _0x11bdb9 = null,
    _0x4857f0 = 0x0,
    _0x579d85 = 0x0,
    _0x29cbea = null,
    _0x1add2f = ![],
    _0x6dfbcd = ![],
    _0x14f175 = ![],
    _0x361ef5 = null;
  const _0x45692c = createPromptExpansionMotion(_0x1136bd);
  function _0x509db6() {
    const _0x433d4f = t(_0xb12b15 ? 'promptExpansion.collapse' : 'promptExpansion.expand');
    ((_0x65a5cb['title'] = _0x433d4f),
      _0x65a5cb['setAttribute']('aria-label', _0x433d4f),
      _0x65a5cb['setAttribute']('aria-expanded', String(!!_0xb12b15)));
    _0x65a5cb['dataset']['expanded'] !== String(!!_0xb12b15) &&
      ((_0x65a5cb['innerHTML'] = _0xb12b15 ? COLLAPSE_ICON : EXPAND_ICON),
      (_0x65a5cb['dataset']['expanded'] = String(!!_0xb12b15)));
    if (_0x11bdb9) _0x11bdb9['textContent'] = _0xa70524?.() || t('promptExpansion.title');
  }
  function _0x2a048b() {
    const _0x4ffe2c = _0x195df6['getSelection']();
    if (
      !_0x4ffe2c?.['rangeCount'] ||
      !_0x329eed['contains'](_0x4ffe2c['anchorNode']) ||
      !_0x329eed['contains'](_0x4ffe2c['focusNode'])
    )
      return;
    _0x29cbea = {
      anchor: _0x4ffe2c['anchorNode'],
      anchorOffset: _0x4ffe2c['anchorOffset'],
      focus: _0x4ffe2c['focusNode'],
      focusOffset: _0x4ffe2c['focusOffset'],
    };
  }
  function _0x14bd79(_0x227e87) {
    _0x329eed['focus']({ preventScroll: !![] });
    if (
      _0x29cbea &&
      _0x329eed['contains'](_0x29cbea['anchor']) &&
      _0x329eed['contains'](_0x29cbea['focus'])
    ) {
      const {
        anchor: _0x576cfb,
        anchorOffset: _0x288e9b,
        focus: _0x21158c,
        focusOffset: _0x31db34,
      } = _0x29cbea;
      _0x195df6['getSelection']()['setBaseAndExtent'](_0x576cfb, _0x288e9b, _0x21158c, _0x31db34);
    }
    _0x329eed['scrollTop'] = _0x227e87;
  }
  function _0x11a6a9() {
    (_0x45692c['cancel'](),
      _0x1136bd['classList']['add']('is-prompt-measuring'),
      _0x1136bd['hidePopover'](),
      _0x1136bd['removeAttribute']('popover'),
      _0x1136bd['classList']['remove']('is-prompt-expanded'),
      (_0x11bdb9['hidden'] = !![]));
    const _0x16169f = _0x1136bd['getBoundingClientRect']();
    return (
      (_0x11bdb9['hidden'] = ![]),
      _0x1136bd['classList']['add']('is-prompt-expanded'),
      _0x1136bd['setAttribute']('popover', 'manual'),
      _0x1136bd['showPopover'](),
      _0x1136bd['classList']['remove']('is-prompt-measuring'),
      _0x14bd79(_0x579d85),
      _0x16169f
    );
  }
  function _0xfa5fd3({
    commit: commit = !![],
    restoreFocus: restoreFocus = !![],
    animate: animate = !![],
  } = {}) {
    if (!_0xb12b15) return;
    if (_0x14f175 && animate && commit && restoreFocus) return;
    (_0x2a048b(), (_0x579d85 = _0x329eed['scrollTop']));
    if (commit) _0x164bd5?.();
    _0x4587ce?.();
    if (
      animate &&
      commit &&
      restoreFocus &&
      _0x1136bd['isConnected'] &&
      _0x1136bd['matches'](':popover-open')
    ) {
      const _0x3cf948 = _0x1136bd['getBoundingClientRect'](),
        _0x76ea06 = _0x11a6a9();
      ((_0x14f175 = !![]),
        _0x45692c['play'](_0x3cf948, _0x76ea06, {
          overlay: _0xb12b15,
          closing: !![],
          onFinish: () => _0xfa5fd3({ commit: commit, restoreFocus: restoreFocus, animate: ![] }),
        }));
      return;
    }
    ((_0x14f175 = ![]),
      _0x45692c['cancel'](),
      _0x207f0c?.({ restoreFocus: ![] }),
      (_0x207f0c = null),
      _0x4587ce?.(),
      _0x40d758?.(),
      (_0x40d758 = null));
    const _0x5edae3 = _0xb12b15;
    _0xb12b15 = null;
    if (activeController === _0x41cd92) activeController = null;
    (_0x11bdb9?.['remove'](), (_0x11bdb9 = null), _0x1136bd['classList']['add']('is-prompt-measuring'));
    if (_0x1136bd['matches'](':popover-open')) _0x1136bd['hidePopover']();
    (_0x1136bd['removeAttribute']('popover'),
      _0x1136bd['removeAttribute']('role'),
      _0x1136bd['removeAttribute']('aria-modal'),
      _0x1136bd['removeAttribute']('aria-label'),
      _0x1136bd['classList']['remove']('is-prompt-expanded', 'is-resize-hover'),
      void _0x1136bd['offsetWidth'],
      _0x1136bd['classList']['remove']('is-prompt-measuring'),
      _0x5edae3['remove'](),
      _0x509db6());
    if (restoreFocus && _0x1136bd['isConnected']) _0x14bd79(_0x4857f0);
    _0x6ab89a?.();
  }
  function _0x19417e() {
    if (_0x6dfbcd || !_0x1136bd['isConnected'] || !_0x329eed['isContentEditable']) return;
    if (_0xb12b15) {
      _0x14f175 &&
        ((_0x14f175 = ![]),
        _0x45692c['play'](_0x1136bd['getBoundingClientRect'](), null, { overlay: _0xb12b15 }));
      return;
    }
    if (!_0x329eed['getClientRects']()['length']) return;
    (activeController?.['close']({ animate: ![] }),
      _0x2a048b(),
      (_0x4857f0 = _0x329eed['scrollTop']),
      _0x164bd5?.(),
      _0x4587ce?.(),
      (_0x361ef5 = _0x1136bd['getBoundingClientRect']()),
      (_0xb12b15 = _0x1c4e6a['createElement']('div')),
      (_0xb12b15['className'] = 'prompt-expansion-overlay'),
      _0xb12b15['addEventListener']('pointerdown', (_0x4c5cf8) => {
        _0x4c5cf8['stopPropagation']();
        if (_0x4c5cf8['target'] === _0xb12b15) _0x4c5cf8['preventDefault']();
      }),
      _0xb12b15['addEventListener']('click', (_0x2ff1da) => _0x2ff1da['stopPropagation']()),
      _0xb12b15['addEventListener']('wheel', (_0x315cbf) => _0x315cbf['stopPropagation'](), {
        passive: !![],
      }),
      _0x17ffb6['appendChild'](_0xb12b15),
      _0x1136bd['classList']['remove']('is-resize-hover'),
      _0x1136bd['classList']['add']('is-prompt-expanded'),
      _0x1136bd['setAttribute']('popover', 'manual'),
      _0x1136bd['setAttribute']('role', 'dialog'),
      _0x1136bd['setAttribute']('aria-modal', 'true'),
      _0x1136bd['setAttribute']('aria-label', t('promptExpansion.title')),
      _0x1136bd['showPopover'](),
      (_0x40d758 = hostPromptFloatingSurfaces(_0x1136bd, _0x2e283a, {
        externalDialogSelector: _0x281cf4,
        onExternalDialog: () => _0xfa5fd3({ restoreFocus: ![] }),
      })),
      (_0x11bdb9 = _0x1c4e6a['createElement']('div')),
      (_0x11bdb9['className'] = 'prompt-expansion-title'),
      _0x1136bd['prepend'](_0x11bdb9),
      (activeController = _0x41cd92),
      _0x509db6(),
      (_0x207f0c = beginModalInteraction({
        root: _0x1136bd,
        onClose: _0xfa5fd3,
        onSuspend: () => _0xfa5fd3({ restoreFocus: ![] }),
        preferredSelector: '.prompt-textarea',
      })),
      _0x14bd79(_0x579d85 || _0x4857f0),
      _0x45692c['play'](_0x361ef5, null, { overlay: _0xb12b15 }),
      _0x1cc2e2?.());
  }
  function _0xa18507(_0x517b65) {
    (_0x2a048b(), _0x517b65['preventDefault'](), _0x517b65['stopPropagation']());
  }
  function _0x1e425e(_0x40539d) {
    (_0x40539d['preventDefault'](), _0x40539d['stopPropagation']());
    if (_0x1add2f) return;
    if (_0x14f175) _0x19417e();
    else {
      if (_0xb12b15) _0xfa5fd3();
      else _0x19417e();
    }
  }
  function _0x13cea2(_0x353080) {
    if (!_0xb12b15) return;
    _0x353080['stopPropagation']();
    if (_0x1add2f || _0x353080['isComposing'] || _0x353080['keyCode'] === 0xe5) {
      if (_0x353080['key'] === 'Escape') _0x353080['preventDefault']();
      return;
    }
    if (_0x353080['defaultPrevented']) return;
    if (_0x353080['key'] === 'Escape') {
      _0x353080['preventDefault']();
      if (_0x7c3ea6?.(_0x353080)) return;
      _0xfa5fd3();
    }
  }
  const _0x1388fb = () => {
      _0x1add2f = !![];
    },
    _0x421d05 = () => {
      _0x1add2f = ![];
    },
    _0x544964 = () => {
      if (_0xb12b15 && !_0x1136bd['matches'](':popover-open')) _0xfa5fd3({ restoreFocus: ![] });
    };
  (_0x65a5cb['addEventListener']('pointerdown', _0xa18507),
    _0x65a5cb['addEventListener']('mousedown', _0xa18507),
    _0x65a5cb['addEventListener']('click', _0x1e425e),
    _0x1136bd['addEventListener']('keydown', _0x13cea2),
    _0x1136bd['addEventListener']('toggle', _0x544964),
    _0x329eed['addEventListener']('compositionstart', _0x1388fb),
    _0x329eed['addEventListener']('compositionend', _0x421d05));
  const _0x2e0de1 = onLocaleChange(_0x509db6),
    _0x41cd92 = {
      open: _0x19417e,
      close: _0xfa5fd3,
      sync: _0x509db6,
      get expanded() {
        return !!_0xb12b15;
      },
      remove() {
        ((_0x6dfbcd = !![]),
          _0xfa5fd3({ commit: ![], restoreFocus: ![] }),
          _0x2e0de1?.(),
          _0x65a5cb['remove'](),
          _0x1136bd['classList']['remove']('has-prompt-expand'),
          _0x1136bd['removeEventListener']('keydown', _0x13cea2),
          _0x1136bd['removeEventListener']('toggle', _0x544964),
          _0x329eed['removeEventListener']('compositionstart', _0x1388fb),
          _0x329eed['removeEventListener']('compositionend', _0x421d05));
      },
    };
  return (_0x509db6(), _0x41cd92);
}
