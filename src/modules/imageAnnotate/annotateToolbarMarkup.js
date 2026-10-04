import { registerStaticInnerHTML } from '../../utils/dom.js';
import { renderImageFunctionControls } from '../imageFunctionControls.js';
import { DEBUG_WRENCH_ICON_HTML } from '../../utils/debugRequestPreview.js';
import { t } from '../../i18n/index.js';
import { renderCanvasEditorSubmitButton } from '../../components/shared/canvasEditorSurface.js';
import { escapeNodeMenuHtml } from '../../components/shared/nodeModelMenu.js';
function annotateToolbarText(value, item = {}) {
  return t('imageAnnotate.toolbar.' + value, item);
}
const ANNOTATE_SCENE_TOOLS = Object['freeze'](['brush', 'rect', 'bucket', 'text', 'eraser', 'number-label']),
  GENERATION_SCENE_TOOLS = Object['freeze'](['brush', 'eraser']);
export const getAnnotateToolbarToolsForScene = (key = 'annotate') => {
  const index = String(key || 'annotate')['trim']();
  if (index === 'repaint' || index === 'erase') return [...GENERATION_SCENE_TOOLS];
  return [...ANNOTATE_SCENE_TOOLS];
};
export const createGenerationToolbarMarkup = ({
  scene: scene = 'annotate',
  promptText: promptText = '',
  selection: selection,
  modelCatalog: modelCatalog,
  submitTooltip: submitTooltip = annotateToolbarText('generate'),
} = {}) => {
  return (
    '\n    <div class="v2-local-edit-modes" role="group" aria-label="' +
    t('imageAnnotate.localEdit.mode') +
    '">\n      ' +
    ['repaint', 'erase']
      ['map'](
        (result) =>
          '<button type="button"\n        class="v2-annotate-btn' +
          (scene === result ? ' active' : '') +
          '\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20data-local-edit-scene=\x22' +
          result +
          '" aria-pressed="' +
          (scene === result) +
          '\x22>' +
          t('imageAnnotate.localEdit.' + result) +
          '</button>',
      )
      ['join']('') +
    '\x0a\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20<div\x20class=\x22v2-annotate-gen-prompt-wrap\x22' +
    (scene === 'erase' ? ' hidden' : '') +
    '>\n          <input class="v2-annotate-gen-prompt-input" type="text"\n            aria-label="' +
    t('imageAnnotate.localEdit.prompt') +
    '\x22\x20value=\x22' +
    escapeNodeMenuHtml(String(promptText || '')) +
    '\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20placeholder=\x22' +
    annotateToolbarText('repaintPlaceholder') +
    '">\n    </div>\n    ' +
    renderImageFunctionControls(selection, modelCatalog) +
    '\n    <button class="v2-expand-toolbar-btn debug-wrench-btn" type="button" title="' +
    annotateToolbarText('debugApiParams') +
    '" aria-label="' +
    annotateToolbarText('debugApiParams') +
    '">\n      ' +
    DEBUG_WRENCH_ICON_HTML +
    '\n    </button>\n    ' +
    renderCanvasEditorSubmitButton(submitTooltip) +
    '\n  '
  );
};
export const ANNOTATE_TOOLBAR_TEMPLATE_ID = 'annotate:toolbar';
registerStaticInnerHTML(
  ANNOTATE_TOOLBAR_TEMPLATE_ID,
  '\n      <button class="v2-annotate-btn icon-only act-cancel" data-i18n-tooltip="imageAnnotate.toolbar.cancel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg></button>\n      <div class="v2-annotate-divider"></div>\n      <button class="v2-annotate-btn icon-only tool-btn active" data-tool="brush" data-i18n-tooltip="imageAnnotate.toolbar.brush"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="rect" data-i18n-tooltip="imageAnnotate.toolbar.rect"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="4" y="6" width="16" height="12" rx="2"/></svg></button>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="bucket" data-i18n-tooltip="imageAnnotate.toolbar.bucket"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 11l-8-8-8.5 8.5a2.12 2.12 0 0 0 0 3l4 4a2.12 2.12 0 0 0 3 0L19 11z"/><path d="M16 14l-3.5 3.5"/><path d="M12 18l-2 2"/><path d="M20 20l-2-2"/></svg></button>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="text" data-i18n-tooltip="imageAnnotate.toolbar.text"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M4 6h16"/><path d="M12 6v12"/><path d="M8 18h8"/></svg></button>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="eraser" data-i18n-tooltip="imageAnnotate.toolbar.eraser"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20 20H7l-5-5a2 2 0 0 1 0-2.83l9.17-9.17a2 2 0 0 1 2.83 0L22 10a2 2 0 0 1 0 2.83L14.83 20"/></svg></button>\n      <div class="v2-annotate-divider"></div>\n      <div class="v2-annotate-colorwrap">\n        <button class="v2-annotate-btn icon-only v2-annotate-color-toggle" data-i18n-tooltip="imageAnnotate.toolbar.color"><span class="v2-annotate-color-dot"></span></button>\n        <div class="v2-annotate-color-menu">\n          <button class="v2-annotate-swatch" data-color="red" data-i18n-tooltip="imageAnnotate.colors.red"></button>\n          <button class="v2-annotate-swatch" data-color="orange" data-i18n-tooltip="imageAnnotate.colors.orange"></button>\n          <button class="v2-annotate-swatch" data-color="yellow" data-i18n-tooltip="imageAnnotate.colors.yellow"></button>\n          <button class="v2-annotate-swatch" data-color="green" data-i18n-tooltip="imageAnnotate.colors.green"></button>\n          <button class="v2-annotate-swatch" data-color="blue" data-i18n-tooltip="imageAnnotate.colors.blue"></button>\n          <button class="v2-annotate-swatch" data-color="purple" data-i18n-tooltip="imageAnnotate.colors.purple"></button>\n          <button class="v2-annotate-swatch" data-color="black" data-i18n-tooltip="imageAnnotate.colors.black"></button>\n          <button class="v2-annotate-swatch" data-color="white" data-i18n-tooltip="imageAnnotate.colors.white"></button>\n        </div>\n      </div>\n      <div class="v2-annotate-size"><span class="v2-annotate-size-value"></span><input class="v2-annotate-size-range" type="range" min="1" max="120" step="1"></div>\n      <div class="v2-annotate-divider"></div>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="number-label" data-i18n-tooltip="imageAnnotate.toolbar.numberLabel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="8"/><path d="M11 9l2-1v8"/><path d="M10 16h5"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-flip-horizontal" data-i18n-tooltip="imageAnnotate.toolbar.flipHorizontal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 12h18"/><path d="M7 7v10l-4-5 4-5Z"/><path d="M17 7v10l4-5-4-5Z"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-flip-vertical" data-i18n-tooltip="imageAnnotate.toolbar.flipVertical"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 3v18"/><path d="M7 7h10l-5-4-5 4Z"/><path d="M7 17h10l-5 4-5-4Z"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-undo" data-i18n-tooltip="imageAnnotate.toolbar.undo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 14l-4-4 4-4"/><path d="M5 10h9a6 6 0 1 1 0 12h-3"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-redo" data-i18n-tooltip="imageAnnotate.toolbar.redo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M15 14l4-4-4-4"/><path d="M19 10H10a6 6 0 1 0 0 12h3"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-clear" data-i18n-tooltip="imageAnnotate.toolbar.clear"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 16h10l1-16"/></svg></button>\n      <button class="v2-annotate-btn act-new-board"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 9v6"/><path d="M9 12h6"/></svg><span data-i18n="imageAnnotate.toolbar.newBoard">新画板</span></button>\n      <button class="v2-annotate-btn v2-annotate-save act-save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v4h8"/></svg><span data-i18n="imageAnnotate.actions.save">保存</span></button>\n    ',
);
