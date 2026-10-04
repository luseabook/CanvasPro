import { registerStaticInnerHTML } from '../../utils/dom.js';
import { IMAGE_MODELS } from '../../config/modelConfig.js';
import {
  buildImageFunctionModeControlHTML,
  buildImageFunctionModelMenuHTML,
  getImageFunctionModelDisplayName,
  getImageFunctionModelTriggerIconHTML,
} from '../imageFunctionModelMenu.js';
import { renderToolbarUpMenu } from '../imageToolbarUpMenu.js';
import { shouldDisableImageSizeControl } from '../imageModelCapabilities.js';
import { DEBUG_WRENCH_ICON_HTML } from '../../utils/debugRequestPreview.js';
import { t } from '../../i18n/index.js';
function annotateToolbarText(value, item = {}) {
  return t('imageAnnotate.toolbar.' + value, item);
}
const IMAGE_GENERATION_SIZE_OPTIONS = ['1K', '2K', '4K'],
  ANNOTATE_SCENE_TOOLS = Object.freeze(['brush', 'rect', 'bucket', 'text', 'eraser', 'number-label']),
  GENERATION_SCENE_TOOLS = Object.freeze(['brush', 'eraser']);
export const getAnnotateToolbarToolsForScene = (key = 'annotate') => {
  const index = String(key || 'annotate').trim();
  if (index === 'repaint' || index === 'erase') return [...GENERATION_SCENE_TOOLS];
  return [...ANNOTATE_SCENE_TOOLS];
};
const buildGenerationModelMenuHtml = ({
  activeModel: activeModel = '',
  activeProvider: activeProvider = '',
  imageSize: imageSize = '1K',
  modelCatalog: modelCatalog = IMAGE_MODELS,
} = {}) => {
  return buildImageFunctionModelMenuHTML({
    activeModel: activeModel,
    activeProvider: activeProvider,
    modelCatalog: modelCatalog,
  });
};
export const createGenerationToolbarMarkup = ({
  scene: scene = 'annotate',
  promptText: promptText = '',
  imageSize: imageSize = '1K',
  model: model = null,
  provider: provider = null,
  modelCatalog: modelCatalog = IMAGE_MODELS,
  submitTooltip: submitTooltip = annotateToolbarText('generate'),
} = {}) => {
  const imageFunctionModelDisplayName = getImageFunctionModelDisplayName(model, modelCatalog),
    imageFunctionModelTriggerIconHTML = getImageFunctionModelTriggerIconHTML(model, provider),
    disabled = shouldDisableImageSizeControl(model, provider);
  return (
    '\n    ' +
    (scene === 'repaint'
      ? '<div class="v2-annotate-gen-prompt-wrap">\n          <input\n            class="v2-annotate-gen-prompt-input"\n            type="text"\n            value="' +
        String(promptText || '').replace(/"/g, '&quot;') +
        '"\n            placeholder="' +
        annotateToolbarText('repaintPlaceholder') +
        '"\n          >\n        </div>'
      : '') +
    '\n    ' +
    renderToolbarUpMenu({
      fieldId: 'size',
      value: imageSize,
      options: IMAGE_GENERATION_SIZE_OPTIONS.map((value2) => ({
        value: value2,
        label: value2,
        disabled: disabled,
      })),
      triggerClass: 'size-toggle',
      labelClass: 'size-text',
      menuClass: 'v2-expand-menu size-menu image-editor-size-menu',
      itemClass: 'v2-expand-menu-item image-editor-size-item',
      disabled: disabled,
    }) +
    '\n    <div class="v2-expand-wrap">\n      <button class="v2-expand-toolbar-btn model-toggle">\n        <span class="image-function-model-trigger-icon-slot">' +
    imageFunctionModelTriggerIconHTML +
    '</span>\n        <span class="model-text">' +
    imageFunctionModelDisplayName +
    '</span>\n        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n      </button>\n      <div class="floating-menu img-model-menu model-menu">\n        ' +
    buildGenerationModelMenuHtml({
      activeModel: model,
      activeProvider: provider,
      imageSize: imageSize,
      modelCatalog: modelCatalog,
    }) +
    '\n      </div>\n    </div>\n    ' +
    buildImageFunctionModeControlHTML({
      model: model,
      provider: provider,
      imageSize: imageSize,
      wrapClass: 'v2-expand-wrap',
      buttonClass: 'v2-expand-toolbar-btn',
    }) +
    '\n    <button class="v2-expand-toolbar-btn debug-wrench-btn" type="button" title="' +
    annotateToolbarText('debugApiParams') +
    '" aria-label="' +
    annotateToolbarText('debugApiParams') +
    '">\n      ' +
    DEBUG_WRENCH_ICON_HTML +
    '\n    </button>\n    <button class="v2-expand-toolbar-btn go img-gen-btn" title="' +
    submitTooltip +
    '" aria-label="' +
    submitTooltip +
    '">\n      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>\n    </button>\n  '
  );
};
export const ANNOTATE_TOOLBAR_TEMPLATE_ID = 'annotate:toolbar';
registerStaticInnerHTML(
  ANNOTATE_TOOLBAR_TEMPLATE_ID,
  '\n      <button class="v2-annotate-btn icon-only act-cancel" data-i18n-tooltip="imageAnnotate.toolbar.cancel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg></button>\n      <div class="v2-annotate-divider"></div>\n      <button class="v2-annotate-btn icon-only tool-btn active" data-tool="brush" data-i18n-tooltip="imageAnnotate.toolbar.brush"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="rect" data-i18n-tooltip="imageAnnotate.toolbar.rect"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="4" y="6" width="16" height="12" rx="2"/></svg></button>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="bucket" data-i18n-tooltip="imageAnnotate.toolbar.bucket"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 11l-8-8-8.5 8.5a2.12 2.12 0 0 0 0 3l4 4a2.12 2.12 0 0 0 3 0L19 11z"/><path d="M16 14l-3.5 3.5"/><path d="M12 18l-2 2"/><path d="M20 20l-2-2"/></svg></button>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="text" data-i18n-tooltip="imageAnnotate.toolbar.text"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M4 6h16"/><path d="M12 6v12"/><path d="M8 18h8"/></svg></button>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="eraser" data-i18n-tooltip="imageAnnotate.toolbar.eraser"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20 20H7l-5-5a2 2 0 0 1 0-2.83l9.17-9.17a2 2 0 0 1 2.83 0L22 10a2 2 0 0 1 0 2.83L14.83 20"/></svg></button>\n      <div class="v2-annotate-divider"></div>\n      <div class="v2-annotate-colorwrap">\n        <button class="v2-annotate-btn icon-only v2-annotate-color-toggle" data-i18n-tooltip="imageAnnotate.toolbar.color"><span class="v2-annotate-color-dot"></span></button>\n        <div class="v2-annotate-color-menu">\n          <button class="v2-annotate-swatch" data-color="red" data-i18n-tooltip="imageAnnotate.colors.red"></button>\n          <button class="v2-annotate-swatch" data-color="orange" data-i18n-tooltip="imageAnnotate.colors.orange"></button>\n          <button class="v2-annotate-swatch" data-color="yellow" data-i18n-tooltip="imageAnnotate.colors.yellow"></button>\n          <button class="v2-annotate-swatch" data-color="green" data-i18n-tooltip="imageAnnotate.colors.green"></button>\n          <button class="v2-annotate-swatch" data-color="blue" data-i18n-tooltip="imageAnnotate.colors.blue"></button>\n          <button class="v2-annotate-swatch" data-color="purple" data-i18n-tooltip="imageAnnotate.colors.purple"></button>\n          <button class="v2-annotate-swatch" data-color="black" data-i18n-tooltip="imageAnnotate.colors.black"></button>\n          <button class="v2-annotate-swatch" data-color="white" data-i18n-tooltip="imageAnnotate.colors.white"></button>\n        </div>\n      </div>\n      <div class="v2-annotate-size"><span class="v2-annotate-size-value"></span><input class="v2-annotate-size-range" type="range" min="1" max="120" step="1"></div>\n      <div class="v2-annotate-divider"></div>\n      <button class="v2-annotate-btn icon-only tool-btn" data-tool="number-label" data-i18n-tooltip="imageAnnotate.toolbar.numberLabel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="8"/><path d="M11 9l2-1v8"/><path d="M10 16h5"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-flip-horizontal" data-i18n-tooltip="imageAnnotate.toolbar.flipHorizontal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 12h18"/><path d="M7 7v10l-4-5 4-5Z"/><path d="M17 7v10l4-5-4-5Z"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-flip-vertical" data-i18n-tooltip="imageAnnotate.toolbar.flipVertical"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 3v18"/><path d="M7 7h10l-5-4-5 4Z"/><path d="M7 17h10l-5 4-5-4Z"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-undo" data-i18n-tooltip="imageAnnotate.toolbar.undo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 14l-4-4 4-4"/><path d="M5 10h9a6 6 0 1 1 0 12h-3"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-redo" data-i18n-tooltip="imageAnnotate.toolbar.redo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M15 14l4-4-4-4"/><path d="M19 10H10a6 6 0 1 0 0 12h3"/></svg></button>\n      <button class="v2-annotate-btn icon-only act-clear" data-i18n-tooltip="imageAnnotate.toolbar.clear"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 16h10l1-16"/></svg></button>\n      <button class="v2-annotate-btn act-new-board" data-i18n-tooltip="imageAnnotate.toolbar.newBoard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 9v6"/><path d="M9 12h6"/></svg><span data-i18n="imageAnnotate.toolbar.newBoard">新画板</span></button>\n      <button class="v2-annotate-btn v2-annotate-save act-save" data-i18n-tooltip="imageAnnotate.actions.save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v4h8"/></svg><span data-i18n="imageAnnotate.actions.save">保存</span></button>\n    ',
);
