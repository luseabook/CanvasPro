import {
  bindAIGenImageModelSelector,
  renderAIGenImageModelSelectorMarkup,
} from '../components/aigenImage/modelSelector.js';
import {
  buildModelProviderProfileBadgesHtml,
  createModelProviderProfileControl,
} from '../components/shared/modelProviderProfileControl.js';
import { getModelManifest, sanitizeModelUiSchemaParams } from '../manifests/index.js';
import { buildImageFunctionModelCatalog } from './imageFunctionModelMenu.js';
const EXCLUDED_FIELDS = ['aspectRatio', 'batchSize'];
export function buildImageFunctionMenuGroups(imageFunctionModelCatalog = buildImageFunctionModelCatalog()) {
  return Object['entries'](imageFunctionModelCatalog)['map'](([value, label]) => ({
    id: 'image-function-' + value,
    label: label['name'],
    subtitle: label['description'],
    icon: label['isTextIcon'] ? '' : label['icon'],
    iconHtml: label['iconHtml'],
    items: label['models']['map']((modelId) => {
      const provider = getModelManifest(modelId['id']),
        label2 = provider['extensions']?.['imageMenu'] || {};
      return {
        modelId: modelId['id'],
        provider: provider['provider'],
        label: label2['title'] || provider['displayName'],
        priceText: label2['priceText'],
        description: label2['subtitle'] || provider['description'],
        icon: modelId['isTextIcon'] ? '' : modelId['icon'],
        iconHtml: label['modelIconStrategy'] === 'provider' ? label['iconHtml'] : modelId['iconHtml'],
        badgeHtml: buildModelProviderProfileBadgesHtml(provider, { vip: provider['vip'] === !![] }),
      };
    }),
  }));
}
export function getImageFunctionSelection(modelId2, generationParamsByModel = {}, imageSize = '1K') {
  const provider2 = getModelManifest(modelId2);
  return {
    modelId: modelId2,
    provider: provider2['provider'],
    generationParams: sanitizeModelUiSchemaParams(modelId2, {
      imageSize: imageSize,
      ...(generationParamsByModel['model'] === modelId2 ? generationParamsByModel['generationParams'] : {}),
    }),
    generationParamsByModel: generationParamsByModel['generationParamsByModel'] || {},
    providerProfileId:
      generationParamsByModel['model'] === modelId2 ? generationParamsByModel['providerProfileId'] || '' : '',
    providerProfileIdByModel: generationParamsByModel['providerProfileIdByModel'] || {},
  };
}
export function getImageFunctionRequestSettings(providerProfileId) {
  const generationParams = { ...providerProfileId['generationParams'] };
  return (
    delete generationParams['aspectRatio'],
    delete generationParams['batchSize'],
    {
      generationParams: generationParams,
      providerProfileId: providerProfileId['providerProfileId'] || '',
      ...(generationParams['imageSize'] ? { imageSize: generationParams['imageSize'] } : {}),
    }
  );
}
export function renderImageFunctionControls(args, item) {
  return renderAIGenImageModelSelectorMarkup({
    ...args,
    showSchemaControls: !![],
    showCaret: !![],
    excludeFieldIds: EXCLUDED_FIELDS,
    modelMenuGroups: buildImageFunctionMenuGroups(item),
    className: 'image-function-controls canvas-function-controls',
  });
}
export function bindImageFunctionControls(
  el,
  { selection: selection, onChange: onChange2, onBeforeOpen: onBeforeOpen, onResize: onResize } = {},
) {
  const floatingMenuHost = document['createElement']('div');
  ((floatingMenuHost['className'] = 'image-function-menu-host'),
    document['body']['append'](floatingMenuHost));
  let model = selection,
    el2;
  const bindAIGenImageModelSelector2 = bindAIGenImageModelSelector(el, {
      ...selection,
      showSchemaControls: !![],
      excludeFieldIds: EXCLUDED_FIELDS,
      floatingMenuHost: floatingMenuHost,
      modelSubmenuPlacement: 'viewport-auto-up',
      schemaPopupPlacement: 'portal-auto-up',
      onChange(key) {
        ((model = key), el2?.['sync'](), onChange2?.(key), onResize?.());
      },
    }),
    panel = el['querySelector']('.image-function-controls');
  el2 = createModelProviderProfileControl({
    panel: panel['querySelector']('.img-model-wrap'),
    getNodeData: () => ({ ...model, model: model['modelId'] }),
    onChange: (index) => bindAIGenImageModelSelector2['applyProviderProfilePatch'](index),
  });
  const result = () => onBeforeOpen?.();
  (panel['addEventListener']('ui-schema-menu-before-open', result),
    panel['querySelector']('.img-model-btn-trigger')['addEventListener']('click', result));
  const resizeObserver = new ResizeObserver(() => onResize?.());
  resizeObserver['observe'](panel);
  const data = () => onResize?.();
  return (
    window['addEventListener']('resize', data),
    {
      containsMenuTarget(options) {
        return floatingMenuHost['contains'](options);
      },
      closeMenus() {
        bindAIGenImageModelSelector2['closeMenus']();
      },
      destroy() {
        (resizeObserver['disconnect'](),
          window['removeEventListener']('resize', data),
          el2?.['remove'](),
          bindAIGenImageModelSelector2['destroy'](),
          panel['removeEventListener']('ui-schema-menu-before-open', result),
          panel['querySelector']('.img-model-btn-trigger')['removeEventListener']('click', result),
          floatingMenuHost['remove']());
      },
    }
  );
}
