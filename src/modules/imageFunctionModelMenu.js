import { IMAGE_MODELS, getModelDisplayName, getModelProvider } from '../config/modelConfig.js';
import { bindToolbarUpMenus, renderToolbarUpMenu } from './imageToolbarUpMenu.js';
import {
  NANO_BANANA_FAMILIES,
  getDefaultModeForNanoBananaFamily,
  getNanoBananaModeLabel,
  getNanoBananaModeOptions,
  getNanoBananaSelectionFromModel,
  isNanoBananaFamily,
  resolveNanoBananaModelBySelection,
} from './nanoBananaModeRules.js';
import { CONTROL_CAMERA_MODEL_ID, getModelManifest, getModelsByKind } from '../manifests/index.js';
import { t } from '../i18n/index.js';
const IMAGE_FUNCTION_PROVIDER_META = Object.freeze({
    grsai: Object.freeze({
      name: 'GRSAI',
      icon: 'images/grsai.png',
      get description() {
        return t('imageFunctionMenu.providers.grsai.description');
      },
    }),
    apimart: Object.freeze({
      name: 'APIMart',
      icon: 'AM',
      get description() {
        return t('imageFunctionMenu.providers.apimart.description');
      },
      isTextIcon: true,
      modelIconStrategy: 'provider',
    }),
    runninghub: Object.freeze({
      get name() {
        return t('imageFunctionMenu.providers.runninghub.name');
      },
      icon: 'images/RH.png',
      get description() {
        return t('imageFunctionMenu.providers.runninghub.description');
      },
      modelIconStrategy: 'provider',
    }),
  }),
  IMAGE_FUNCTION_MENU_PROVIDER_BY_GROUP = Object.freeze({
    grsaiModel: 'grsai',
    apimart: 'apimart',
    runninghubModel: 'runninghub',
  }),
  DEFAULT_IMAGE_FUNCTION_PROVIDER = 'runninghub',
  DEFAULT_FREE_ANGLE_PROVIDER = 'runninghubwf',
  DEFAULT_FREE_ANGLE_MODEL = CONTROL_CAMERA_MODEL_ID,
  FREE_ANGLE_ONLY_MODEL_IDS = Object.freeze([CONTROL_CAMERA_MODEL_ID]),
  IMAGE_FUNCTION_ALLOWED_FAMILIES = Object.freeze(
    new Set([
      NANO_BANANA_FAMILIES.NANOBANANA_2,
      NANO_BANANA_FAMILIES.NANOBANANA_PRO,
      NANO_BANANA_FAMILIES.GPT_IMAGE_2,
    ]),
  );
export function isImageFreeAngleOnlyModel(value) {
  const item = String(value || '').trim();
  return FREE_ANGLE_ONLY_MODEL_IDS.includes(item);
}
const escapeHtmlAttr = (key) =>
    String(key || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;'),
  escapeHtmlText = (index) =>
    String(index || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;'),
  canShowDevOnlyModels = () => typeof window !== 'undefined' && window.DEV_MODE === true;
function buildImageFunctionModelFromManifest(id) {
  if (!id) return null;
  const family = id.extensions?.imageMenu || {},
    icon = family.icon || id.icon || 'images/RH.png';
  return {
    id: id.modelId,
    family: family.family || '',
    name: family.title || id.displayName || id.modelId,
    description: family.subtitle || id.description || '',
    icon: icon,
    isTextIcon: family.isTextIcon === true || !/\.(?:png|svg|jpg|jpeg|webp)$/i.test(String(icon || '')),
  };
}
function getImageFunctionFamily(result) {
  return String(
    result?.extensions?.imageFunctionMenu?.family || result?.extensions?.nanoBanana?.family || '',
  ).trim();
}
function isAllowedImageFunctionManifest(data) {
  return IMAGE_FUNCTION_ALLOWED_FAMILIES.has(getImageFunctionFamily(data));
}
function isAllowedImageFunctionModel(options) {
  return isAllowedImageFunctionManifest(getModelManifest(options));
}
function buildImageGenerationNodeCatalog() {
  const enabled = {};
  return (
    getModelsByKind('image')
      .map((manifest) => ({ manifest: manifest, imageMenu: manifest?.extensions?.imageMenu || null }))
      .filter(
        ({ manifest: manifest2, imageMenu: imageMenu }) =>
          imageMenu?.group && isAllowedImageFunctionManifest(manifest2),
      )
      .sort((item2, target) => {
        const source = Number(item2.imageMenu?.order ?? 0x3e7),
          next = Number(target.imageMenu?.order ?? 0x3e7);
        return source - next;
      })
      .forEach(({ manifest: manifest3, imageMenu: imageMenu2 }) => {
        const current = IMAGE_FUNCTION_MENU_PROVIDER_BY_GROUP[imageMenu2.group] || manifest3.provider,
          args = IMAGE_FUNCTION_PROVIDER_META[current];
        if (!args) return;
        !enabled[current] && (enabled[current] = { ...args, models: [] });
        const imageFunctionModelFromManifest = buildImageFunctionModelFromManifest(manifest3);
        if (imageFunctionModelFromManifest) enabled[current].models.push(imageFunctionModelFromManifest);
      }),
    enabled
  );
}
function buildFreeAngleOnlyProvider() {
  const models = FREE_ANGLE_ONLY_MODEL_IDS.map((item3) =>
    buildImageFunctionModelFromManifest(getModelManifest(item3)),
  ).filter(Boolean);
  return {
    name: t('imageFunctionMenu.providers.runninghubWorkflow.name'),
    icon: 'images/RH.png',
    description: t('imageFunctionMenu.providers.runninghubWorkflow.description'),
    models: models,
  };
}
export function buildImageFreeAngleModelCatalog() {
  const imageGenerationNodeCatalog = buildImageGenerationNodeCatalog(),
    freeAngleOnlyProvider = buildFreeAngleOnlyProvider();
  return (
    freeAngleOnlyProvider.models.length > 0 &&
      (imageGenerationNodeCatalog.runninghubwf = freeAngleOnlyProvider),
    imageGenerationNodeCatalog
  );
}
export function getDefaultImageFreeAngleModelState(
  imageFreeAngleModelCatalog = buildImageFreeAngleModelCatalog(),
) {
  const model2 = imageFreeAngleModelCatalog?.[DEFAULT_FREE_ANGLE_PROVIDER]?.models?.find(
    (item4) => item4?.id === DEFAULT_FREE_ANGLE_MODEL,
  );
  if (model2) return { provider: DEFAULT_FREE_ANGLE_PROVIDER, model: model2.id };
  return getDefaultImageFunctionModelState(imageFreeAngleModelCatalog);
}
function buildRawImageModelCatalog(entry = IMAGE_MODELS) {
  const record = {};
  return (
    Object.entries(entry || {}).forEach(([payload, args2]) => {
      if (args2?.devOnly && !canShowDevOnlyModels()) return;
      const list = Array.isArray(args2?.models) ? args2.models : [],
        models2 = list.filter((el) => {
          if (!el || typeof el !== 'object') return false;
          return el.disabled !== true;
        });
      if (models2.length === 0) return;
      record[payload] = { ...args2, models: models2 };
    }),
    record
  );
}
export function buildImageFunctionModelCatalog(handle = IMAGE_MODELS) {
  if (handle === IMAGE_MODELS) return buildImageGenerationNodeCatalog();
  return buildRawImageModelCatalog(handle);
}
export function findImageFunctionProviderByModel(state, config) {
  const enabled2 = String(config || '').trim();
  if (!enabled2) return null;
  for (const [scope, input] of Object.entries(state || {})) {
    const list2 = Array.isArray(input?.models) ? input.models : [];
    if (list2.some((item5) => item5?.id === enabled2)) return scope;
  }
  const modelProvider = getModelProvider(enabled2);
  return state?.[modelProvider] && isAllowedImageFunctionModel(enabled2) ? modelProvider : null;
}
export function getDefaultImageFunctionModelState(
  imageFunctionModelCatalog = buildImageFunctionModelCatalog(),
) {
  const output =
      imageFunctionModelCatalog?.[DEFAULT_IMAGE_FUNCTION_PROVIDER]?.models?.find(
        (item6) => item6?.family === 'nanobanana-pro',
      )?.id || '',
    model3 = imageFunctionModelCatalog?.[DEFAULT_IMAGE_FUNCTION_PROVIDER]?.models?.find(
      (item7) => item7?.id === output,
    );
  if (model3) return { provider: DEFAULT_IMAGE_FUNCTION_PROVIDER, model: model3.id };
  const value2 = Object.keys(imageFunctionModelCatalog || {}),
    provider2 = value2[0] || Object.keys(IMAGE_MODELS)[0] || '',
    model4 = imageFunctionModelCatalog?.[provider2]?.models?.[0];
  return { provider: provider2 || null, model: model4?.id || null };
}
export function getImageFunctionModelDisplayName(
  value3,
  imageFunctionModelCatalog2 = buildImageFunctionModelCatalog(),
) {
  const enabled3 = String(value3 || '').trim();
  if (!enabled3) return '';
  for (const value4 of Object.values(imageFunctionModelCatalog2 || {})) {
    const list3 = Array.isArray(value4?.models) ? value4.models : [],
      error = list3.find((item8) => item8?.id === enabled3);
    if (error) return error.name || error.id || enabled3;
  }
  return getModelDisplayName(enabled3);
}
export function getImageFunctionNanoSelection(value5, value6 = '', value7 = '2K') {
  const nanoBananaSelectionFromModel = getNanoBananaSelectionFromModel(value5, value7, value6);
  if (!nanoBananaSelectionFromModel || !isNanoBananaFamily(nanoBananaSelectionFromModel.family)) return null;
  if (nanoBananaSelectionFromModel.family === 'gpt-image-2') return null;
  const value8 = String(value6 || '')
      .trim()
      .toLowerCase(),
    value9 = String(nanoBananaSelectionFromModel.provider || '')
      .trim()
      .toLowerCase();
  if (value8 && value9 !== value8) return null;
  return nanoBananaSelectionFromModel;
}
export function resolveImageFunctionModelFromMenuItem({
  model: model5,
  provider: provider3,
  family: family2,
  imageSize: imageSize = '2K',
} = {}) {
  const provider4 = String(provider3 || '').trim(),
    family3 = String(family2 || '').trim();
  if (family3 && isNanoBananaFamily(family3)) {
    const mode = getDefaultModeForNanoBananaFamily(family3, provider4);
    return {
      model: resolveNanoBananaModelBySelection({
        family: family3,
        mode: mode,
        imageSize: imageSize,
        provider: provider4,
      }),
      provider: provider4,
      family: family3,
      mode: mode,
    };
  }
  return { model: String(model5 || '').trim(), provider: provider4, family: '', mode: '' };
}
export function resolveImageFunctionModelByMode({
  model: model6,
  provider: provider5,
  imageSize: imageSize = '2K',
  mode: mode2,
} = {}) {
  const family4 = getImageFunctionNanoSelection(model6, provider5, imageSize);
  if (!family4) return null;
  const mode3 = String(mode2 || '').trim();
  if (!mode3) return null;
  return {
    model: resolveNanoBananaModelBySelection({
      family: family4.family,
      mode: mode3,
      imageSize: imageSize,
      provider: family4.provider,
    }),
    provider: family4.provider,
    family: family4.family,
    mode: mode3,
  };
}
export function buildImageFunctionModeMenuHTML({
  model: model = '',
  provider: provider = '',
  imageSize: imageSize = '2K',
} = {}) {
  const value10 = getImageFunctionNanoSelection(model, provider, imageSize);
  if (!value10) return '';
  return renderToolbarUpMenu({
    fieldId: 'mode',
    value: value10.mode,
    options: getNanoBananaModeOptions(value10.family, value10.provider).map((value11) => ({
      value: value11.mode,
      label: value11.label,
      tooltip: value11.tooltip,
    })),
    itemClass: '',
    itemsOnly: true,
    itemValueAttrs: ['data-nb-mode'],
  });
}
export function getImageFunctionModeLabel({
  model: model = '',
  provider: provider = '',
  imageSize: imageSize = '2K',
} = {}) {
  const imageFunctionNanoSelection = getImageFunctionNanoSelection(model, provider, imageSize);
  if (!imageFunctionNanoSelection) return t('imageFunctionMenu.modes.normal');
  return getNanoBananaModeLabel(
    imageFunctionNanoSelection.family,
    imageFunctionNanoSelection.mode,
    imageFunctionNanoSelection.provider,
  );
}
export function isImageFunctionModeVisible({
  model: model = '',
  provider: provider = '',
  imageSize: imageSize = '2K',
} = {}) {
  return !!getImageFunctionNanoSelection(model, provider, imageSize);
}
export function buildImageFunctionModeControlHTML({
  model: model = '',
  provider: provider = '',
  imageSize: imageSize = '2K',
  wrapClass: wrapClass = 'v2-expand-wrap',
  buttonClass: buttonClass = 'v2-expand-toolbar-btn',
} = {}) {
  const isImageFunctionModeVisible2 = isImageFunctionModeVisible({
      model: model,
      provider: provider,
      imageSize: imageSize,
    }),
    selectedLabel = getImageFunctionModeLabel({ model: model, provider: provider, imageSize: imageSize }),
    value12 = getImageFunctionNanoSelection(model, provider, imageSize);
  return (
    '\n    ' +
    renderToolbarUpMenu({
      fieldId: 'mode',
      value: value12?.mode || '',
      options: value12
        ? getNanoBananaModeOptions(value12.family, value12.provider).map((value13) => ({
            value: value13.mode,
            label: value13.label,
            tooltip: value13.tooltip,
          }))
        : [],
      wrapClass: wrapClass + ' image-function-mode-wrap ' + (isImageFunctionModeVisible2 ? '' : 'is-hidden'),
      buttonClass: buttonClass + ' image-function-mode-toggle',
      labelClass: 'image-function-mode-label',
      menuClass: 'nb-mode-menu image-function-mode-menu',
      openClass: 'show',
      selectedLabel: selectedLabel,
      itemClass: '',
      itemValueAttrs: ['data-nb-mode'],
    })
  );
}
export function syncImageFunctionModeControl({
  root: root,
  model: model7,
  provider: provider = '',
  imageSize: imageSize = '2K',
} = {}) {
  if (!root) return null;
  const el2 = root.querySelector('.image-function-mode-wrap'),
    el3 = root.querySelector('.image-function-mode-label'),
    el4 = root.querySelector('.image-function-mode-menu'),
    isImageFunctionModeVisible3 = isImageFunctionModeVisible({
      model: model7,
      provider: provider,
      imageSize: imageSize,
    });
  el2?.classList.toggle('is-hidden', !isImageFunctionModeVisible3);
  el3 &&
    (el3.textContent = getImageFunctionModeLabel({
      model: model7,
      provider: provider,
      imageSize: imageSize,
    }));
  if (el4) {
    el4.innerHTML = buildImageFunctionModeMenuHTML({
      model: model7,
      provider: provider,
      imageSize: imageSize,
    });
    if (!isImageFunctionModeVisible3) el4.classList.remove('show');
  }
  return getImageFunctionNanoSelection(model7, provider, imageSize);
}
export function bindImageFunctionModeMenu({ modeMenu: modeMenu, onSelect: onSelect } = {}) {
  if (!modeMenu || typeof onSelect !== 'function') return () => {};
  return bindToolbarUpMenus(modeMenu, {
    onSelect: ({ value: value14, item: item9 }) => {
      const mode4 = String(value14 || item9?.dataset?.nbMode || '').trim();
      if (!mode4) return;
      onSelect({ mode: mode4, item: item9 });
    },
  });
}
function getProviderIconHtml(value15, value16, value17 = '') {
  if (value15?.isTextIcon)
    return (
      '<span class="image-function-model-icon image-function-model-icon-text ' +
      escapeHtmlAttr(value17) +
      '">' +
      escapeHtmlText(value15.icon) +
      '</span>'
    );
  const enabled4 = value15?.icon || '';
  if (!enabled4) return '';
  return (
    '<img class="image-function-model-icon ' +
    escapeHtmlAttr(value17) +
    '" src="' +
    escapeHtmlAttr(enabled4) +
    '" alt="' +
    escapeHtmlAttr(value16) +
    '">'
  );
}
function getModelIconHtml(error2, value18, value19, value20 = '') {
  if (value18?.modelIconStrategy === 'provider') return getProviderIconHtml(value18, value19, value20);
  const enabled5 = error2?.icon || value18?.icon || '';
  if (error2?.isTextIcon)
    return (
      '<span class="image-function-model-icon image-function-model-icon-text ' +
      escapeHtmlAttr(value20) +
      '">' +
      escapeHtmlText(error2.icon || error2.name || value18?.icon || '') +
      '</span>'
    );
  if (value18?.isTextIcon && !enabled5)
    return (
      '<span class="image-function-model-icon image-function-model-icon-text ' +
      escapeHtmlAttr(value20) +
      '">' +
      escapeHtmlText(value18.icon) +
      '</span>'
    );
  if (!enabled5) return '';
  return (
    '<img class="image-function-model-icon ' +
    escapeHtmlAttr(value20) +
    '" src="' +
    escapeHtmlAttr(enabled5) +
    '" alt="' +
    escapeHtmlAttr(value19) +
    '">'
  );
}
export function getImageFunctionModelTriggerIconHTML(
  value21,
  value22 = '',
  imageFunctionModelCatalog3 = buildImageFunctionModelCatalog(),
) {
  const value23 = imageFunctionModelCatalog3,
    value24 = value22 || findImageFunctionProviderByModel(value23, value21) || 'grsai',
    value25 = value23[value24] || value23.grsai;
  return getProviderIconHtml(value25, value24, 'image-function-model-trigger-icon');
}
export function buildImageFunctionModelMenuHTML({
  activeModel: activeModel = '',
  activeProvider: activeProvider = '',
  modelCatalog: modelCatalog = buildImageFunctionModelCatalog(),
} = {}) {
  const enabled6 = String(activeModel || '').trim(),
    value26 = String(activeProvider || '').trim();
  return Object.entries(modelCatalog || {})
    .map(([value27, el5]) => {
      const value28 = el5?.devOnly === true;
      if (value28) return '';
      const value29 = el5?.disabled === true,
        providerIconHtml = getProviderIconHtml(el5, value27),
        value30 = (el5.models || [])
          .map((el6) => {
            const value31 = value29 || el6?.disabled === true,
              value32 =
                enabled6 === el6.id ||
                (el6.family && getImageFunctionNanoSelection(enabled6, value27)?.family === el6.family) ||
                (!enabled6 && value26 && value26 === value27);
            return (
              '\n            <div class="floating-menu-item ' +
              (value32 ? 'active' : '') +
              '" data-value="' +
              escapeHtmlAttr(el6.id) +
              '" data-provider="' +
              escapeHtmlAttr(value27) +
              '" ' +
              (el6.family ? 'data-image-function-family="' + escapeHtmlAttr(el6.family) + '"' : '') +
              ' ' +
              (value31 ? 'data-disabled="true"' : '') +
              '>\n              ' +
              getModelIconHtml(el6, el5, value27) +
              '\n              <div class="fmi-content">\n                <div class="fmi-title">' +
              escapeHtmlText(el6.name || el6.id) +
              '</div>\n                <div class="fmi-sub">' +
              escapeHtmlText(el6.description || el5.description || '') +
              '</div>\n              </div>\n              ' +
              (value31 ? '<span class="floating-menu-badge floating-menu-badge-danger">不可用</span>' : '') +
              '\n            </div>'
            );
          })
          .join('');
      return (
        '\n        <div class="' +
        escapeHtmlAttr(value27) +
        '-group-header floating-menu-item" data-image-function-provider="' +
        escapeHtmlAttr(value27) +
        '" data-' +
        escapeHtmlAttr(value27) +
        '-toggle>\n          ' +
        providerIconHtml +
        '\n          <div class="fmi-content">\n            <div class="fmi-title">' +
        escapeHtmlText(el5.name || value27) +
        '</div>\n            <div class="fmi-sub">' +
        escapeHtmlText(el5.description || '') +
        '</div>\n          </div>\n          ' +
        (value29
          ? '<span class="floating-menu-badge floating-menu-badge-danger floating-menu-badge-inline">不可用</span>'
          : '') +
        '\n          <svg class="image-function-model-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>\n        </div>\n        <div class="' +
        escapeHtmlAttr(value27) +
        '-submenu image-function-model-submenu">\n          ' +
        value30 +
        '\n        </div>'
      );
    })
    .join('');
}
export function syncImageFunctionModelMenuActive({
  modelMenu: modelMenu,
  model: model8,
  provider: provider = '',
} = {}) {
  if (!modelMenu) return;
  const enabled7 = String(model8 || '').trim(),
    value33 = String(provider || '').trim(),
    imageFunctionNanoSelection2 = getImageFunctionNanoSelection(enabled7, value33);
  modelMenu.querySelectorAll('.floating-menu-item').forEach((el7) => {
    if (!el7.dataset.value) {
      el7.classList.remove('active');
      return;
    }
    const enabled8 = String(el7.dataset.imageFunctionFamily || '').trim(),
      value34 =
        el7.dataset.value === enabled7 ||
        (!!enabled8 &&
          imageFunctionNanoSelection2?.provider === el7.dataset.provider &&
          imageFunctionNanoSelection2?.family === enabled8) ||
        (!enabled7 && value33 && el7.dataset.provider === value33);
    el7.classList.toggle('active', value34);
  });
}
export function closeImageFunctionModelSubmenus(el8) {
  el8?.querySelectorAll('.image-function-model-submenu').forEach((el9) => {
    el9.style.display = 'none';
  });
}
export function bindImageFunctionModelMenu({
  modelMenu: modelMenu2,
  onSelect: onSelect2,
  closeMenu: closeMenu,
  onOpenSubmenu: onOpenSubmenu,
} = {}) {
  if (!modelMenu2 || typeof onSelect2 !== 'function') return () => {};
  const list4 = [];
  let setTimeout2 = 0;
  const run = () => {
      if (setTimeout2) clearTimeout(setTimeout2);
      setTimeout2 = 0;
    },
    handler = (el10, value35 = 120) => {
      (run(),
        (setTimeout2 = setTimeout(() => {
          ((el10.style.display = 'none'), (setTimeout2 = 0));
        }, value35)));
    };
  modelMenu2.querySelectorAll('[data-image-function-provider]').forEach((header) => {
    const providerKey = header.dataset.imageFunctionProvider,
      submenu = modelMenu2.querySelector('.' + providerKey + '-submenu');
    if (!submenu) return;
    const value36 = () => {
        (run(),
          closeImageFunctionModelSubmenus(modelMenu2),
          (submenu.style.display = 'flex'),
          onOpenSubmenu?.({ header: header, submenu: submenu, providerKey: providerKey }));
      },
      value37 = () => handler(submenu);
    (header.addEventListener('mouseenter', value36),
      header.addEventListener('mouseleave', value37),
      submenu.addEventListener('mouseenter', value36),
      submenu.addEventListener('mouseleave', value37),
      list4.push(() => {
        (header.removeEventListener('mouseenter', value36),
          header.removeEventListener('mouseleave', value37),
          submenu.removeEventListener('mouseenter', value36),
          submenu.removeEventListener('mouseleave', value37));
      }));
  });
  const value38 = (event) => {
    const family5 = event.target.closest('.floating-menu-item[data-value]');
    if (!family5 || !modelMenu2.contains(family5)) return;
    event.stopPropagation();
    if (family5.dataset.disabled === 'true') return;
    const model9 = String(family5.dataset.value || '').trim(),
      provider6 = String(family5.dataset.provider || getModelProvider(model9) || '').trim(),
      model10 = resolveImageFunctionModelFromMenuItem({
        model: model9,
        provider: provider6,
        family: family5.dataset.imageFunctionFamily,
      });
    if (!model10.model || !model10.provider) return;
    (onSelect2({ ...model10, item: family5 }),
      syncImageFunctionModelMenuActive({
        modelMenu: modelMenu2,
        model: model10.model,
        provider: model10.provider,
      }),
      closeImageFunctionModelSubmenus(modelMenu2),
      closeMenu?.());
  };
  return (
    modelMenu2.addEventListener('click', value38),
    list4.push(() => modelMenu2.removeEventListener('click', value38)),
    () => {
      (run(), list4.forEach((handler2) => handler2()));
    }
  );
}
export { getModelDisplayName };
