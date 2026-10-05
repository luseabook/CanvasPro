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
function commentToolbarText(value, item = {}) {
  return t('nodeToolbar.comment.' + value, item);
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
function createColorPopupHtml(key, list, index, result) {
  return (
    '\n    <div class="comment-toolbar-color-popup" data-popup="' +
    key +
    '" aria-label="' +
    index +
    '">\n      ' +
    list
      .map(
        (item2) =>
          '<button\n              class="ftb-btn comment-toolbar-color-item"\n              data-action="' +
          key +
          '"\n              data-value="' +
          item2 +
          '"\n              data-tooltip="' +
          (result[item2] || item2) +
          '"\n              aria-label="' +
          (result[item2] || item2) +
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
function normalizeArgs(toolbarEl) {
  if (toolbarEl && typeof toolbarEl === 'object' && !toolbarEl.nodeType && toolbarEl.toolbarEl)
    return toolbarEl;
  return {
    toolbarEl: toolbarEl?.[0],
    nodeId: toolbarEl?.[1],
    getCurrentStyle: toolbarEl?.[2],
    getNodeSnapshot: toolbarEl?.[4],
  };
}
function setColorDot(el, data) {
  if (!el) return;
  const options = COLOR_SWATCH_TOKEN_MAP[data] || 'var(--white-20)';
  (el.style.setProperty('--comment-toolbar-dot-color', options),
    el.classList.toggle('is-transparent', data === 'transparent'));
}
function getJumpShortcutTooltipText(target) {
  return commentToolbarText('jumpTooltip', { shortcut: formatJumpShortcutLabel(target, I18N.jumpEmpty) });
}
export function bindCommentNoteToolbarEvents(...list2) {
  const {
    toolbarEl: toolbarEl2,
    nodeId: nodeId,
    getCurrentStyle: getCurrentStyle,
    getNodeSnapshot: getNodeSnapshot,
  } = normalizeArgs(list2.length === 1 ? list2[0] : list2);
  if (!toolbarEl2 || !nodeId || typeof getCurrentStyle !== 'function') return null;
  (toolbarEl2.addEventListener('pointerdown', (event) => event.stopPropagation()),
    toolbarEl2.addEventListener('dblclick', (event2) => {
      (event2.preventDefault(), event2.stopPropagation());
    }),
    (toolbarEl2.tabIndex = -1));
  const source = 2;
  let value2 = null,
    enabled = false,
    enabled2 = 0,
    value3 = null;
  const next = toolbarEl2.querySelector('[data-dot="text-color"]'),
    current = toolbarEl2.querySelector('[data-dot="background-color"]'),
    el2 = toolbarEl2.querySelector('.act-convert-markdown'),
    el3 = toolbarEl2.querySelector('.comment-toolbar-jump-wrap'),
    el4 = toolbarEl2.querySelector('.act-jump-shortcut'),
    el5 = toolbarEl2.querySelector('[data-role="jump-binding"]'),
    el6 = toolbarEl2.querySelector('[data-role="jump-zoom-range"]'),
    el7 = toolbarEl2.querySelector('[data-role="jump-zoom-value"]'),
    handler = () => appStore.getStateRaw().nodes?.[nodeId] || null,
    handler2 = () => normalizeCommentNoteJumpShortcut(handler()?.jumpShortcut),
    handler3 = () => handler()?.contentFormat === 'markdown',
    handler4 = () => {
      if (!el2) return;
      const entry = handler3();
      (el2.classList.toggle('is-active', entry),
        el2.setAttribute('data-tooltip', entry ? I18N.convertPlainText : I18N.convertMarkdown),
        el2.setAttribute('aria-label', entry ? I18N.convertPlainText : I18N.convertMarkdown));
    },
    handler5 = () => {
      if (!enabled2) return;
      (clearTimeout(enabled2), (enabled2 = 0));
    },
    handler6 = (record) => {
      if (!el4) return;
      el4.setAttribute('data-tooltip', getJumpShortcutTooltipText(record));
    },
    handler7 = (payload, handle = 1800) => {
      if (!el4) return;
      (handler5(),
        el4.classList.add('is-tooltip-pinned'),
        el4.setAttribute('data-tooltip', payload),
        (enabled2 = window.setTimeout(() => {
          (el4.classList.remove('is-tooltip-pinned'), handler6(handler2().keys), handler5());
        }, handle)));
    },
    handler8 = () => {
      const map = handler2(),
        formatJumpShortcutLabel2 = formatJumpShortcutLabel(map.keys, I18N.jumpEmpty);
      (el5 &&
        ((el5.textContent = enabled ? I18N.jumpHintRecording : formatJumpShortcutLabel2),
        el5.classList.toggle('is-recording', enabled),
        el5.setAttribute('aria-label', enabled ? I18N.jumpHintRecording : formatJumpShortcutLabel2)),
        el4 && !el4.classList.contains('is-tooltip-pinned') && handler6(map.keys),
        el6 && document.activeElement !== el6 && (el6.value = String(map.zoomPercent)),
        el7 && (el7.textContent = map.zoomPercent + '%'),
        el3 && el3.classList.toggle('is-recording', enabled));
    },
    handler9 = (state) => {
      ((enabled = state === true), (window.__commentNoteShortcutRecording = enabled), handler8());
    },
    handler10 = (config) => {
      const scope = getShortcuts?.(),
        label = detectShortcutConflict(scope, '__comment-note-jump__', config);
      if (label) return commentToolbarText('jumpConflictGlobal', { label: label.label });
      const jumpShortcutBinding = buildJumpShortcutBinding(config);
      if (!jumpShortcutBinding) return null;
      const input = appStore.getStateRaw().nodes || {};
      for (const [output, enabled3] of Object.entries(input)) {
        if (!enabled3 || output === nodeId || enabled3.type !== 'comment-note') continue;
        const map2 = normalizeCommentNoteJumpShortcut(enabled3.jumpShortcut),
          jumpShortcutBinding2 = buildJumpShortcutBinding(map2.keys);
        if (jumpShortcutBinding2 && jumpShortcutBinding2 === jumpShortcutBinding)
          return commentToolbarText('jumpConflictOther');
      }
      return null;
    },
    handler11 = (value4, { commitHistory: commitHistory = true } = {}) => {
      const map3 = handler2(),
        jumpShortcut = normalizeCommentNoteJumpShortcut({ ...map3, ...(value4 || {}) });
      if (
        buildJumpShortcutBinding(map3.keys) === buildJumpShortcutBinding(jumpShortcut.keys) &&
        map3.zoomPercent === jumpShortcut.zoomPercent
      ) {
        handler8();
        return;
      }
      (appStore.updateNodeData(nodeId, { jumpShortcut: jumpShortcut }),
        commitHistory && commit(),
        handler8());
    },
    handler12 = () => {
      (value3 && (document.removeEventListener('keydown', value3, true), (value3 = null)), handler9(false));
    },
    handler13 = () => {
      if (enabled) return;
      (handler9(true),
        (value3 = (event3) => {
          if (!enabled) return;
          (event3.preventDefault(), event3.stopImmediatePropagation());
          if (event3.key === 'Escape') {
            (handler12(), handler8());
            return;
          }
          const keys = parseJumpShortcutFromKeydown(event3);
          if (!keys.length) return;
          const value5 = handler10(keys);
          if (value5) {
            (handler7(value5), handler12());
            return;
          }
          (handler11({ keys: keys }), window.showToast?.(I18N.jumpUpdated, 'success'), handler12());
        }),
        document.addEventListener('keydown', value3, true));
    },
    handler14 = () => {
      toolbarEl2
        .querySelectorAll('.comment-toolbar-color-wrap')
        .forEach((el8) => el8.classList.remove('is-open'));
    },
    handler15 = () => {
      if (el3) el3.classList.remove('is-open');
      handler12();
    },
    handler16 = () => {
      ((value2 = null), toolbarEl2.classList.remove('comment-toolbar-popup-open'), handler14(), handler15());
    },
    handler17 = (value6) => {
      ((value2 = value6),
        toolbarEl2.classList.add('comment-toolbar-popup-open'),
        toolbarEl2.querySelectorAll('.comment-toolbar-color-wrap').forEach((el9) => {
          el9.classList.toggle('is-open', el9.dataset.role === value6);
        }),
        el3 && el3.classList.toggle('is-open', value6 === 'jump-shortcut'),
        value6 !== 'jump-shortcut' && handler12(),
        value6 === 'jump-shortcut' && (el5?.focus(), handler8()));
    };
  toolbarEl2.addEventListener('focusout', (value7) => {
    if (!toolbarEl2.contains(value7.relatedTarget)) handler16();
  });
  const run = (value8) => {
      const commentNoteStyle = normalizeCommentNoteStyle(value8 || getCurrentStyle());
      (toolbarEl2
        .querySelectorAll('[data-action="text-color"]')
        .forEach((el10) =>
          el10.classList.toggle('is-active', el10.dataset.value === commentNoteStyle.textColor),
        ),
        toolbarEl2
          .querySelectorAll('[data-action="background-color"]')
          .forEach((el11) =>
            el11.classList.toggle('is-active', el11.dataset.value === commentNoteStyle.backgroundColor),
          ),
        setColorDot(next, commentNoteStyle.textColor),
        setColorDot(current, commentNoteStyle.backgroundColor),
        handler8(),
        handler4());
    },
    handler18 = (args) => {
      const args2 = normalizeCommentNoteStyle(getCurrentStyle()),
        style = normalizeCommentNoteStyle({ ...args2, ...args });
      (appStore.updateNodeData(nodeId, { style: style }), commit());
    },
    handler19 = ({ commitHistory: commitHistory = true } = {}) => {
      if (!el6) return;
      const zoomPercent = normalizeJumpShortcutZoomPercent(el6.value);
      handler11({ zoomPercent: zoomPercent }, { commitHistory: commitHistory });
    };
  return (
    el6?.addEventListener('input', () => handler19({ commitHistory: false })),
    el6?.addEventListener('change', () => handler19({ commitHistory: true })),
    toolbarEl2.addEventListener('click', (event4) => {
      const el12 = event4.target.closest('button');
      if (!el12) return;
      event4.stopPropagation();
      const value9 = el12.dataset.action;
      if (value9 === 'jump-toggle-record') {
        enabled ? handler12() : handler13();
        return;
      }
      if (value9 === 'jump-clear-keys') {
        (handler12(), handler11({ keys: [] }), window.showToast?.(I18N.jumpCleared, 'success'));
        return;
      }
      if (el12.classList.contains('act-jump-shortcut')) {
        if (value2 === 'jump-shortcut') handler16();
        else handler17('jump-shortcut');
        return;
      }
      if (el12.classList.contains('act-convert-markdown')) {
        const value10 = handler(),
          enabled4 = (typeof getNodeSnapshot === 'function' && getNodeSnapshot()) || value10;
        if (!enabled4) return;
        const contentFormat = (value10?.contentFormat || enabled4.contentFormat) !== 'markdown';
        (appStore.updateNodeData(nodeId, {
          content: typeof enabled4.content === 'string' ? enabled4.content : '',
          contentFormat: contentFormat ? 'markdown' : 'plain',
        }),
          commit(),
          window.showToast?.(contentFormat ? I18N.markdownConverted : I18N.plainTextConverted, 'success'),
          handler4(),
          handler16());
        return;
      }
      if (el12.classList.contains('act-font-dec')) {
        const fontSize = normalizeCommentNoteStyle(getCurrentStyle());
        (handler18({ fontSize: fontSize.fontSize - source }), handler16());
        return;
      }
      if (el12.classList.contains('act-font-inc')) {
        const fontSize2 = normalizeCommentNoteStyle(getCurrentStyle());
        (handler18({ fontSize: fontSize2.fontSize + source }), handler16());
        return;
      }
      if (el12.classList.contains('act-delete-node')) {
        (appStore.deleteNodes([nodeId]), commit(), handler16());
        return;
      }
      if (el12.classList.contains('act-text-color')) {
        if (value2 === 'text-color') handler16();
        else handler17('text-color');
        return;
      }
      if (el12.classList.contains('act-bg-color')) {
        if (value2 === 'background-color') handler16();
        else handler17('background-color');
        return;
      }
      const textColor = el12.dataset.value;
      if (value9 === 'text-color' && textColor) {
        (handler18({ textColor: textColor }), handler16());
        return;
      }
      value9 === 'background-color' && textColor && (handler18({ backgroundColor: textColor }), handler16());
    }),
    run(getCurrentStyle()),
    run
  );
}
