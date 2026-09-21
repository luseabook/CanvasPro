import appStore from '../../core/stores/appStore.js';
import { commit } from '../../modules/history.js';
import { getShortcuts, detectShortcutConflict } from '../../modules/shortcuts.js';
import {
  buildJumpShortcutBinding,
  formatJumpShortcutLabel,
  normalizeCommentNoteJumpShortcut,
  normalizeJumpShortcutZoomPercent,
  parseJumpShortcutFromKeydown,
} from '../../modules/commentNoteJumpShortcut.js';
import { t } from '../../i18n/index.js';
import { registerStaticInnerHTML } from '../../utils/dom.js';
import { normalizeCommentNoteStyle } from '../commentNoteStyle.js';
function commentToolbarText(_0x51341c, _0x3a5503 = {}) {
  return t('nodeToolbar.comment.' + _0x51341c, _0x3a5503);
}
const I18N = {
    fontDec: commentToolbarText('fontDec'),
    fontInc: commentToolbarText('fontInc'),
    convertMarkdown: commentToolbarText('convertMarkdown'),
    convertPlainText: commentToolbarText('convertPlainText'),
    markdownConverted: commentToolbarText('markdownConverted'),
    plainTextConverted: commentToolbarText('plainTextConverted'),
    textColor: commentToolbarText('textColor'),
    bgColor: commentToolbarText('bgColor'),
    deleteNode: commentToolbarText('deleteNode'),
    jumpShortcut: commentToolbarText('jumpShortcut'),
    jumpShortcutRow: commentToolbarText('jumpShortcutRow'),
    jumpClear: commentToolbarText('jumpClear'),
    jumpClearAria: commentToolbarText('jumpClearAria'),
    jumpHintRecording: commentToolbarText('jumpHintRecording'),
    jumpEmpty: commentToolbarText('jumpEmpty'),
    jumpUpdated: commentToolbarText('jumpUpdated'),
    jumpCleared: commentToolbarText('jumpCleared'),
    jumpZoom: commentToolbarText('jumpZoom'),
    textColorLabel: {
      white: commentToolbarText('textColorLabel.white'),
      red: commentToolbarText('textColorLabel.red'),
      orange: commentToolbarText('textColorLabel.orange'),
      yellow: commentToolbarText('textColorLabel.yellow'),
      green: commentToolbarText('textColorLabel.green'),
      blue: commentToolbarText('textColorLabel.blue'),
      purple: commentToolbarText('textColorLabel.purple'),
      cyan: commentToolbarText('textColorLabel.cyan'),
      pink: commentToolbarText('textColorLabel.pink'),
      gray: commentToolbarText('textColorLabel.gray'),
    },
    bgColorLabel: {
      transparent: commentToolbarText('bgColorLabel.transparent'),
      white: commentToolbarText('bgColorLabel.white'),
      red: commentToolbarText('bgColorLabel.red'),
      orange: commentToolbarText('bgColorLabel.orange'),
      yellow: commentToolbarText('bgColorLabel.yellow'),
      green: commentToolbarText('bgColorLabel.green'),
      blue: commentToolbarText('bgColorLabel.blue'),
      purple: commentToolbarText('bgColorLabel.purple'),
      cyan: commentToolbarText('bgColorLabel.cyan'),
      gray: commentToolbarText('bgColorLabel.gray'),
    },
  },
  TEXT_COLOR_OPTIONS = [
    'white',
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'cyan',
    'pink',
    'gray',
  ],
  BACKGROUND_COLOR_OPTIONS = [
    'transparent',
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'cyan',
    'gray',
    'white',
  ],
  SVG_KEYBOARD =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h0M10 9h0M13 9h0M16 9h0M7 12h0M10 12h0M13 12h0M16 12h0M8 15h8"/></svg>',
  SVG_FONT_DEC =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 20 9 7h6l5 13"/><path d="M7.5 13h9"/><path d="M4 5h6"/></svg>',
  SVG_FONT_INC =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 20 9 7h6l5 13"/><path d="M7.5 13h9"/><path d="M19 3v6"/><path d="M16 6h6"/></svg>',
  SVG_MARKDOWN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15V9l3 4 3-4v6"/><path d="M17 9v6"/><path d="m15 13 2 2 2-2"/></svg>',
  SVG_TEXT_COLOR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="m4 20 5-13h6l5 13"/><path d="M7.5 13h9"/><path d="M4 21h16"/></svg>',
  SVG_BG_COLOR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="4" y="5" width="16" height="12" rx="2"/><path d="M4 20h16"/></svg>',
  SVG_DELETE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
  COLOR_SWATCH_TOKEN_MAP = {
    red: 'var(--red)',
    orange: 'var(--gold)',
    yellow: 'var(--warning-text)',
    green: 'var(--green)',
    blue: 'var(--blue)',
    purple: 'var(--purple)',
    cyan: 'var(--cyan)',
    pink: 'var(--group-pink)',
    gray: 'var(--group-slate)',
    white: 'var(--canvas-white)',
    transparent: 'transparent',
  };
function createColorPopupHtml(_0x509496, _0x4f0004, _0x185915, _0x1bc028) {
  return (
    '\n    <div class="comment-toolbar-color-popup" data-popup="' +
    _0x509496 +
    '" aria-label="' +
    _0x185915 +
    '">\n      ' +
    _0x4f0004
      .map(
        (_0x5e8700) =>
          '<button\n              class="ftb-btn comment-toolbar-color-item"\n              data-action="' +
          _0x509496 +
          '"\n              data-value="' +
          _0x5e8700 +
          '"\n              data-tooltip="' +
          (_0x1bc028[_0x5e8700] || _0x5e8700) +
          '"\n              aria-label="' +
          (_0x1bc028[_0x5e8700] || _0x5e8700) +
          '"\n            ></button>',
      )
      .join('') +
    '\n    </div>\n  '
  );
}
function createJumpPopupHtml() {
  return (
    '\n    <div class="comment-toolbar-jump-popup" data-popup="jump-shortcut" aria-label="' +
    I18N.jumpShortcut +
    '">\n      <div class="comment-toolbar-jump-binding-row">\n        <span class="comment-toolbar-jump-binding-label">' +
    I18N.jumpShortcutRow +
    '</span>\n        <div class="comment-toolbar-jump-binding-anchor">\n          <button class="comment-toolbar-jump-binding" data-action="jump-toggle-record" data-role="jump-binding" type="button">' +
    I18N.jumpEmpty +
    '</button>\n          <button class="comment-toolbar-jump-clear-btn" data-action="jump-clear-keys" data-tooltip="' +
    I18N.jumpClear +
    '" aria-label="' +
    I18N.jumpClearAria +
    '" type="button">&times;</button>\n        </div>\n      </div>\n      <label class="comment-toolbar-jump-zoom-field">\n        <span class="comment-toolbar-jump-zoom-label">' +
    I18N.jumpZoom +
    '</span>\n        <input\n          class="comment-toolbar-jump-zoom-input"\n          data-role="jump-zoom-range"\n          type="range"\n          min="0"\n          max="100"\n          step="1"\n        />\n        <span class="comment-toolbar-jump-zoom-unit" data-role="jump-zoom-value">50%</span>\n      </label>\n    </div>\n  '
  );
}
export const COMMENT_NOTE_TOOLBAR_HTML =
  '\n<div class="node-floating-toolbar v2-comment-toolbar">\n  <div class="comment-toolbar-jump-wrap" data-role="jump-shortcut">\n    <button class="ftb-btn icon-only act-jump-shortcut comment-toolbar-jump-trigger" data-tooltip="' +
  I18N.jumpShortcut +
  ' | ' +
  I18N.jumpEmpty +
  '" aria-label="' +
  I18N.jumpShortcut +
  '">' +
  SVG_KEYBOARD +
  '</button>\n    ' +
  createJumpPopupHtml() +
  '\n  </div>\n  <span class="comment-toolbar-divider" aria-hidden="true">|</span>\n  <button class="ftb-btn icon-only act-convert-markdown" data-tooltip="' +
  I18N.convertMarkdown +
  '" aria-label="' +
  I18N.convertMarkdown +
  '">' +
  SVG_MARKDOWN +
  '</button>\n  <button class="ftb-btn icon-only act-font-dec" data-tooltip="' +
  I18N.fontDec +
  '" aria-label="' +
  I18N.fontDec +
  '">' +
  SVG_FONT_DEC +
  '</button>\n  <button class="ftb-btn icon-only act-font-inc" data-tooltip="' +
  I18N.fontInc +
  '" aria-label="' +
  I18N.fontInc +
  '">' +
  SVG_FONT_INC +
  '</button>\n\n  <div class="comment-toolbar-color-wrap" data-role="text-color">\n    <button class="ftb-btn icon-only act-text-color comment-toolbar-color-trigger" data-tooltip="' +
  I18N.textColor +
  '" aria-label="' +
  I18N.textColor +
  '">\n      ' +
  SVG_TEXT_COLOR +
  '\n      <span class="comment-toolbar-color-dot" data-dot="text-color"></span>\n    </button>\n    ' +
  createColorPopupHtml('text-color', TEXT_COLOR_OPTIONS, I18N.textColor, I18N.textColorLabel) +
  '\n  </div>\n\n  <div class="comment-toolbar-color-wrap" data-role="background-color">\n    <button class="ftb-btn icon-only act-bg-color comment-toolbar-color-trigger" data-tooltip="' +
  I18N.bgColor +
  '" aria-label="' +
  I18N.bgColor +
  '">\n      ' +
  SVG_BG_COLOR +
  '\n      <span class="comment-toolbar-color-dot" data-dot="background-color"></span>\n    </button>\n    ' +
  createColorPopupHtml('background-color', BACKGROUND_COLOR_OPTIONS, I18N.bgColor, I18N.bgColorLabel) +
  '\n  </div>\n\n  <button class="ftb-btn icon-only act-delete-node comment-toolbar-danger" data-tooltip="' +
  I18N.deleteNode +
  '" aria-label="' +
  I18N.deleteNode +
  '">' +
  SVG_DELETE +
  '</button>\n</div>\n';
registerStaticInnerHTML('toolbar:comment-note', COMMENT_NOTE_TOOLBAR_HTML);
function normalizeArgs(_0xbfc3fb) {
  if (_0xbfc3fb && typeof _0xbfc3fb === 'object' && !_0xbfc3fb.nodeType && _0xbfc3fb.toolbarEl)
    return _0xbfc3fb;
  return {
    toolbarEl: _0xbfc3fb?.[0],
    nodeId: _0xbfc3fb?.[1],
    getCurrentStyle: _0xbfc3fb?.[2],
    getNodeSnapshot: _0xbfc3fb?.[4],
  };
}
function setColorDot(_0x4dfed2, _0x53830c) {
  if (!_0x4dfed2) return;
  const _0x2b9fc2 = COLOR_SWATCH_TOKEN_MAP[_0x53830c] || 'var(--white-20)';
  (_0x4dfed2.style.setProperty('--comment-toolbar-dot-color', _0x2b9fc2),
    _0x4dfed2.classList.toggle('is-transparent', _0x53830c === 'transparent'));
}
function getJumpShortcutTooltipText(_0x3c4063) {
  return commentToolbarText('jumpTooltip', { shortcut: formatJumpShortcutLabel(_0x3c4063, I18N.jumpEmpty) });
}
export function bindCommentNoteToolbarEvents(..._0x43444e) {
  const {
    toolbarEl: _0x4dde22,
    nodeId: _0x517faf,
    getCurrentStyle: _0x493f36,
    getNodeSnapshot: _0x460bc3,
  } = normalizeArgs(_0x43444e.length === 1 ? _0x43444e[0] : _0x43444e);
  if (!_0x4dde22 || !_0x517faf || typeof _0x493f36 !== 'function') return null;
  (_0x4dde22.addEventListener('pointerdown', (_0x5ca1da) => _0x5ca1da.stopPropagation()),
    _0x4dde22.addEventListener('dblclick', (_0x548232) => {
      (_0x548232.preventDefault(), _0x548232.stopPropagation());
    }),
    (_0x4dde22.tabIndex = -1));
  const _0xa78453 = 2;
  let _0x3c4ae8 = null,
    _0x3c6860 = false,
    _0xf0ce33 = 0,
    _0x5595c3 = null;
  const _0x305970 = _0x4dde22.querySelector('[data-dot="text-color"]'),
    _0x8e56c7 = _0x4dde22.querySelector('[data-dot="background-color"]'),
    _0x10a1fd = _0x4dde22.querySelector('.act-convert-markdown'),
    _0x477f74 = _0x4dde22.querySelector('.comment-toolbar-jump-wrap'),
    _0x3d6235 = _0x4dde22.querySelector('.act-jump-shortcut'),
    _0x21d152 = _0x4dde22.querySelector('[data-role="jump-binding"]'),
    _0x352f7d = _0x4dde22.querySelector('[data-role="jump-zoom-range"]'),
    _0x40a290 = _0x4dde22.querySelector('[data-role="jump-zoom-value"]'),
    _0x2ca4cf = () => appStore.getStateRaw().nodes?.[_0x517faf] || null,
    _0x3c0bc8 = () => normalizeCommentNoteJumpShortcut(_0x2ca4cf()?.jumpShortcut),
    _0x1c316c = () => _0x2ca4cf()?.contentFormat === 'markdown',
    _0x1c9c46 = () => {
      if (!_0x10a1fd) return;
      const _0x499c7a = _0x1c316c();
      (_0x10a1fd.classList.toggle('is-active', _0x499c7a),
        _0x10a1fd.setAttribute('data-tooltip', _0x499c7a ? I18N.convertPlainText : I18N.convertMarkdown),
        _0x10a1fd.setAttribute('aria-label', _0x499c7a ? I18N.convertPlainText : I18N.convertMarkdown));
    },
    _0x156695 = () => {
      if (!_0xf0ce33) return;
      (clearTimeout(_0xf0ce33), (_0xf0ce33 = 0));
    },
    _0x21996f = (_0x5ed972) => {
      if (!_0x3d6235) return;
      _0x3d6235.setAttribute('data-tooltip', getJumpShortcutTooltipText(_0x5ed972));
    },
    _0xd14bf9 = (_0x10ad98, _0x14f545 = 0x708) => {
      if (!_0x3d6235) return;
      (_0x156695(),
        _0x3d6235.classList.add('is-tooltip-pinned'),
        _0x3d6235.setAttribute('data-tooltip', _0x10ad98),
        (_0xf0ce33 = window.setTimeout(() => {
          (_0x3d6235.classList.remove('is-tooltip-pinned'), _0x21996f(_0x3c0bc8().keys), _0x156695());
        }, _0x14f545)));
    },
    _0x5d22ab = () => {
      const _0x470641 = _0x3c0bc8(),
        _0xc8dc05 = formatJumpShortcutLabel(_0x470641.keys, I18N.jumpEmpty);
      (_0x21d152 &&
        ((_0x21d152.textContent = _0x3c6860 ? I18N.jumpHintRecording : _0xc8dc05),
        _0x21d152.classList.toggle('is-recording', _0x3c6860),
        _0x21d152.setAttribute('aria-label', _0x3c6860 ? I18N.jumpHintRecording : _0xc8dc05)),
        _0x3d6235 && !_0x3d6235.classList.contains('is-tooltip-pinned') && _0x21996f(_0x470641.keys),
        _0x352f7d &&
          document.activeElement !== _0x352f7d &&
          (_0x352f7d.value = String(_0x470641.zoomPercent)),
        _0x40a290 && (_0x40a290.textContent = _0x470641.zoomPercent + '%'),
        _0x477f74 && _0x477f74.classList.toggle('is-recording', _0x3c6860));
    },
    _0x10a1e9 = (_0x2f9ea0) => {
      ((_0x3c6860 = _0x2f9ea0 === true), (window.__commentNoteShortcutRecording = _0x3c6860), _0x5d22ab());
    },
    _0xf708bc = (_0x5bc1ab) => {
      const _0x2eafde = getShortcuts?.(),
        _0x40cc7e = detectShortcutConflict(_0x2eafde, '__comment-note-jump__', _0x5bc1ab);
      if (_0x40cc7e) return commentToolbarText('jumpConflictGlobal', { label: _0x40cc7e.label });
      const _0x363270 = buildJumpShortcutBinding(_0x5bc1ab);
      if (!_0x363270) return null;
      const _0x548437 = appStore.getStateRaw().nodes || {};
      for (const [_0x1e6447, _0x1d2428] of Object.entries(_0x548437)) {
        if (!_0x1d2428 || _0x1e6447 === _0x517faf || _0x1d2428.type !== 'comment-note') continue;
        const _0x51b2a7 = normalizeCommentNoteJumpShortcut(_0x1d2428.jumpShortcut),
          _0x218281 = buildJumpShortcutBinding(_0x51b2a7.keys);
        if (_0x218281 && _0x218281 === _0x363270) return commentToolbarText('jumpConflictOther');
      }
      return null;
    },
    _0x45a6c6 = (_0x435e14, { commitHistory: commitHistory = true } = {}) => {
      const _0x53e872 = _0x3c0bc8(),
        _0x5af5c8 = normalizeCommentNoteJumpShortcut({ ..._0x53e872, ...(_0x435e14 || {}) });
      if (
        buildJumpShortcutBinding(_0x53e872.keys) === buildJumpShortcutBinding(_0x5af5c8.keys) &&
        _0x53e872.zoomPercent === _0x5af5c8.zoomPercent
      ) {
        _0x5d22ab();
        return;
      }
      (appStore.updateNodeData(_0x517faf, { jumpShortcut: _0x5af5c8 }),
        commitHistory && commit(),
        _0x5d22ab());
    },
    _0x2af8a2 = () => {
      (_0x5595c3 && (document.removeEventListener('keydown', _0x5595c3, true), (_0x5595c3 = null)),
        _0x10a1e9(false));
    },
    _0x2c6138 = () => {
      if (_0x3c6860) return;
      (_0x10a1e9(true),
        (_0x5595c3 = (_0x476e88) => {
          if (!_0x3c6860) return;
          (_0x476e88.preventDefault(), _0x476e88.stopImmediatePropagation());
          if (_0x476e88.key === 'Escape') {
            (_0x2af8a2(), _0x5d22ab());
            return;
          }
          const _0x57dc21 = parseJumpShortcutFromKeydown(_0x476e88);
          if (!_0x57dc21.length) return;
          const _0x340682 = _0xf708bc(_0x57dc21);
          if (_0x340682) {
            (_0xd14bf9(_0x340682), _0x2af8a2());
            return;
          }
          (_0x45a6c6({ keys: _0x57dc21 }), window.showToast?.(I18N.jumpUpdated, 'success'), _0x2af8a2());
        }),
        document.addEventListener('keydown', _0x5595c3, true));
    },
    _0x28d99d = () => {
      _0x4dde22
        .querySelectorAll('.comment-toolbar-color-wrap')
        .forEach((_0x5d0ec9) => _0x5d0ec9.classList.remove('is-open'));
    },
    _0x2beedb = () => {
      if (_0x477f74) _0x477f74.classList.remove('is-open');
      _0x2af8a2();
    },
    _0x2a4498 = () => {
      ((_0x3c4ae8 = null),
        _0x4dde22.classList.remove('comment-toolbar-popup-open'),
        _0x28d99d(),
        _0x2beedb());
    },
    _0x120ee2 = (_0xa65414) => {
      ((_0x3c4ae8 = _0xa65414),
        _0x4dde22.classList.add('comment-toolbar-popup-open'),
        _0x4dde22.querySelectorAll('.comment-toolbar-color-wrap').forEach((_0x33f2a7) => {
          _0x33f2a7.classList.toggle('is-open', _0x33f2a7.dataset.role === _0xa65414);
        }),
        _0x477f74 && _0x477f74.classList.toggle('is-open', _0xa65414 === 'jump-shortcut'),
        _0xa65414 !== 'jump-shortcut' && _0x2af8a2(),
        _0xa65414 === 'jump-shortcut' && (_0x21d152?.focus(), _0x5d22ab()));
    };
  _0x4dde22.addEventListener('focusout', (_0x32215e) => {
    if (!_0x4dde22.contains(_0x32215e.relatedTarget)) _0x2a4498();
  });
  const _0x23411a = (_0x394549) => {
      const _0xf9f054 = normalizeCommentNoteStyle(_0x394549 || _0x493f36());
      (_0x4dde22
        .querySelectorAll('[data-action="text-color"]')
        .forEach((_0x35298e) =>
          _0x35298e.classList.toggle('is-active', _0x35298e.dataset.value === _0xf9f054.textColor),
        ),
        _0x4dde22
          .querySelectorAll('[data-action="background-color"]')
          .forEach((_0x781f6c) =>
            _0x781f6c.classList.toggle('is-active', _0x781f6c.dataset.value === _0xf9f054.backgroundColor),
          ),
        setColorDot(_0x305970, _0xf9f054.textColor),
        setColorDot(_0x8e56c7, _0xf9f054.backgroundColor),
        _0x5d22ab(),
        _0x1c9c46());
    },
    _0x326222 = (_0x10b61f) => {
      const _0x51985d = normalizeCommentNoteStyle(_0x493f36()),
        _0x3ee007 = normalizeCommentNoteStyle({ ..._0x51985d, ..._0x10b61f });
      (appStore.updateNodeData(_0x517faf, { style: _0x3ee007 }), commit());
    },
    _0x24c96a = ({ commitHistory: commitHistory = true } = {}) => {
      if (!_0x352f7d) return;
      const _0x184200 = normalizeJumpShortcutZoomPercent(_0x352f7d.value);
      _0x45a6c6({ zoomPercent: _0x184200 }, { commitHistory: commitHistory });
    };
  return (
    _0x352f7d?.addEventListener('input', () => _0x24c96a({ commitHistory: false })),
    _0x352f7d?.addEventListener('change', () => _0x24c96a({ commitHistory: true })),
    _0x4dde22.addEventListener('click', (_0x2cc3e1) => {
      const _0x50a3ed = _0x2cc3e1.target.closest('button');
      if (!_0x50a3ed) return;
      _0x2cc3e1.stopPropagation();
      const _0x55c2d0 = _0x50a3ed.dataset.action;
      if (_0x55c2d0 === 'jump-toggle-record') {
        _0x3c6860 ? _0x2af8a2() : _0x2c6138();
        return;
      }
      if (_0x55c2d0 === 'jump-clear-keys') {
        (_0x2af8a2(), _0x45a6c6({ keys: [] }), window.showToast?.(I18N.jumpCleared, 'success'));
        return;
      }
      if (_0x50a3ed.classList.contains('act-jump-shortcut')) {
        if (_0x3c4ae8 === 'jump-shortcut') _0x2a4498();
        else _0x120ee2('jump-shortcut');
        return;
      }
      if (_0x50a3ed.classList.contains('act-convert-markdown')) {
        const _0x31f153 = _0x2ca4cf(),
          _0xaf490c = (typeof _0x460bc3 === 'function' && _0x460bc3()) || _0x31f153;
        if (!_0xaf490c) return;
        const _0x1ed125 = (_0x31f153?.contentFormat || _0xaf490c.contentFormat) !== 'markdown';
        (appStore.updateNodeData(_0x517faf, {
          content: typeof _0xaf490c.content === 'string' ? _0xaf490c.content : '',
          contentFormat: _0x1ed125 ? 'markdown' : 'plain',
        }),
          commit(),
          window.showToast?.(_0x1ed125 ? I18N.markdownConverted : I18N.plainTextConverted, 'success'),
          _0x1c9c46(),
          _0x2a4498());
        return;
      }
      if (_0x50a3ed.classList.contains('act-font-dec')) {
        const _0x584879 = normalizeCommentNoteStyle(_0x493f36());
        (_0x326222({ fontSize: _0x584879.fontSize - _0xa78453 }), _0x2a4498());
        return;
      }
      if (_0x50a3ed.classList.contains('act-font-inc')) {
        const _0x4a8d65 = normalizeCommentNoteStyle(_0x493f36());
        (_0x326222({ fontSize: _0x4a8d65.fontSize + _0xa78453 }), _0x2a4498());
        return;
      }
      if (_0x50a3ed.classList.contains('act-delete-node')) {
        (appStore.deleteNodes([_0x517faf]), commit(), _0x2a4498());
        return;
      }
      if (_0x50a3ed.classList.contains('act-text-color')) {
        if (_0x3c4ae8 === 'text-color') _0x2a4498();
        else _0x120ee2('text-color');
        return;
      }
      if (_0x50a3ed.classList.contains('act-bg-color')) {
        if (_0x3c4ae8 === 'background-color') _0x2a4498();
        else _0x120ee2('background-color');
        return;
      }
      const _0x545062 = _0x50a3ed.dataset.value;
      if (_0x55c2d0 === 'text-color' && _0x545062) {
        (_0x326222({ textColor: _0x545062 }), _0x2a4498());
        return;
      }
      _0x55c2d0 === 'background-color' &&
        _0x545062 &&
        (_0x326222({ backgroundColor: _0x545062 }), _0x2a4498());
    }),
    _0x23411a(_0x493f36()),
    _0x23411a
  );
}
