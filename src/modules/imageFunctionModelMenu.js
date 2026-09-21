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
export function isImageFreeAngleOnlyModel(_0x581503) {
  const _0x5307b1 = String(_0x581503 || '').trim();
  return FREE_ANGLE_ONLY_MODEL_IDS.includes(_0x5307b1);
}
const escapeHtmlAttr = (_0x1e0dad) =>
    String(_0x1e0dad || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;'),
  escapeHtmlText = (_0x513d69) =>
    String(_0x513d69 || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;'),
  canShowDevOnlyModels = () => typeof window !== 'undefined' && window.DEV_MODE === true;
function buildImageFunctionModelFromManifest(_0x5c21bf) {
  if (!_0x5c21bf) return null;
  const _0x4b922f = _0x5c21bf.extensions?.imageMenu || {},
    _0x1dcc14 = _0x4b922f.icon || _0x5c21bf.icon || 'images/RH.png';
  return {
    id: _0x5c21bf.modelId,
    family: _0x4b922f.family || '',
    name: _0x4b922f.title || _0x5c21bf.displayName || _0x5c21bf.modelId,
    description: _0x4b922f.subtitle || _0x5c21bf.description || '',
    icon: _0x1dcc14,
    isTextIcon:
      _0x4b922f.isTextIcon === true || !/\.(?:png|svg|jpg|jpeg|webp)$/i.test(String(_0x1dcc14 || '')),
  };
}
function getImageFunctionFamily(_0x2a7573) {
  return String(
    _0x2a7573?.extensions?.imageFunctionMenu?.family || _0x2a7573?.extensions?.nanoBanana?.family || '',
  ).trim();
}
function isAllowedImageFunctionManifest(_0x56247c) {
  return IMAGE_FUNCTION_ALLOWED_FAMILIES.has(getImageFunctionFamily(_0x56247c));
}
function isAllowedImageFunctionModel(_0x279b8a) {
  return isAllowedImageFunctionManifest(getModelManifest(_0x279b8a));
}
function buildImageGenerationNodeCatalog() {
  const _0x2b66f5 = {};
  return (
    getModelsByKind('image')
      .map((_0x7b7fd6) => ({ manifest: _0x7b7fd6, imageMenu: _0x7b7fd6?.extensions?.imageMenu || null }))
      .filter(
        ({ manifest: _0x333a4d, imageMenu: _0x49daaf }) =>
          _0x49daaf?.group && isAllowedImageFunctionManifest(_0x333a4d),
      )
      .sort((_0x536df0, _0x27b61b) => {
        const _0x34705d = Number(_0x536df0.imageMenu?.order ?? 0x3e7),
          _0x2a4251 = Number(_0x27b61b.imageMenu?.order ?? 0x3e7);
        return _0x34705d - _0x2a4251;
      })
      .forEach(({ manifest: _0x287049, imageMenu: _0x5ea5a5 }) => {
        const _0xd21564 = IMAGE_FUNCTION_MENU_PROVIDER_BY_GROUP[_0x5ea5a5.group] || _0x287049.provider,
          _0x4840ee = IMAGE_FUNCTION_PROVIDER_META[_0xd21564];
        if (!_0x4840ee) return;
        !_0x2b66f5[_0xd21564] && (_0x2b66f5[_0xd21564] = { ..._0x4840ee, models: [] });
        const _0x16273a = buildImageFunctionModelFromManifest(_0x287049);
        if (_0x16273a) _0x2b66f5[_0xd21564].models.push(_0x16273a);
      }),
    _0x2b66f5
  );
}
function buildFreeAngleOnlyProvider() {
  const _0x40e9ae = FREE_ANGLE_ONLY_MODEL_IDS.map((_0xeeca4) =>
    buildImageFunctionModelFromManifest(getModelManifest(_0xeeca4)),
  ).filter(Boolean);
  return {
    name: t('imageFunctionMenu.providers.runninghubWorkflow.name'),
    icon: 'images/RH.png',
    description: t('imageFunctionMenu.providers.runninghubWorkflow.description'),
    models: _0x40e9ae,
  };
}
export function buildImageFreeAngleModelCatalog() {
  const _0x45c9f2 = buildImageGenerationNodeCatalog(),
    _0x5b95ca = buildFreeAngleOnlyProvider();
  return (_0x5b95ca.models.length > 0 && (_0x45c9f2.runninghubwf = _0x5b95ca), _0x45c9f2);
}
export function getDefaultImageFreeAngleModelState(_0x536ac2 = buildImageFreeAngleModelCatalog()) {
  const _0x2429a2 = _0x536ac2?.[DEFAULT_FREE_ANGLE_PROVIDER]?.models?.find(
    (_0x27250a) => _0x27250a?.id === DEFAULT_FREE_ANGLE_MODEL,
  );
  if (_0x2429a2) return { provider: DEFAULT_FREE_ANGLE_PROVIDER, model: _0x2429a2.id };
  return getDefaultImageFunctionModelState(_0x536ac2);
}
function buildRawImageModelCatalog(_0x13c957 = IMAGE_MODELS) {
  const _0x52c4ec = {};
  return (
    Object.entries(_0x13c957 || {}).forEach(([_0x301d48, _0x18e7b0]) => {
      if (_0x18e7b0?.devOnly && !canShowDevOnlyModels()) return;
      const _0x205c3c = Array.isArray(_0x18e7b0?.models) ? _0x18e7b0.models : [],
        _0x4e9fad = _0x205c3c.filter((_0x387d2f) => {
          if (!_0x387d2f || typeof _0x387d2f !== 'object') return false;
          return _0x387d2f.disabled !== true;
        });
      if (_0x4e9fad.length === 0) return;
      _0x52c4ec[_0x301d48] = { ..._0x18e7b0, models: _0x4e9fad };
    }),
    _0x52c4ec
  );
}
export function buildImageFunctionModelCatalog(_0x4ebb8d = IMAGE_MODELS) {
  if (_0x4ebb8d === IMAGE_MODELS) return buildImageGenerationNodeCatalog();
  return buildRawImageModelCatalog(_0x4ebb8d);
}
export function findImageFunctionProviderByModel(_0x35c2e7, _0x693ab) {
  const _0x514919 = String(_0x693ab || '').trim();
  if (!_0x514919) return null;
  for (const [_0x36fc31, _0x3c302b] of Object.entries(_0x35c2e7 || {})) {
    const _0x5ec6fa = Array.isArray(_0x3c302b?.models) ? _0x3c302b.models : [];
    if (_0x5ec6fa.some((_0x2321ae) => _0x2321ae?.id === _0x514919)) return _0x36fc31;
  }
  const _0x5af7df = getModelProvider(_0x514919);
  return _0x35c2e7?.[_0x5af7df] && isAllowedImageFunctionModel(_0x514919) ? _0x5af7df : null;
}
export function getDefaultImageFunctionModelState(_0x3b5056 = buildImageFunctionModelCatalog()) {
  const _0x5e15ce =
      _0x3b5056?.[DEFAULT_IMAGE_FUNCTION_PROVIDER]?.models?.find(
        (_0x3cdb4c) => _0x3cdb4c?.family === 'nanobanana-pro',
      )?.id || '',
    _0x76f6bf = _0x3b5056?.[DEFAULT_IMAGE_FUNCTION_PROVIDER]?.models?.find(
      (_0x37a499) => _0x37a499?.id === _0x5e15ce,
    );
  if (_0x76f6bf) return { provider: DEFAULT_IMAGE_FUNCTION_PROVIDER, model: _0x76f6bf.id };
  const _0x430f71 = Object.keys(_0x3b5056 || {}),
    _0x4e8ce0 = _0x430f71[0] || Object.keys(IMAGE_MODELS)[0] || '',
    _0x93ce78 = _0x3b5056?.[_0x4e8ce0]?.models?.[0];
  return { provider: _0x4e8ce0 || null, model: _0x93ce78?.id || null };
}
export function getImageFunctionModelDisplayName(_0xd3de72, _0x164919 = buildImageFunctionModelCatalog()) {
  const _0x17e76b = String(_0xd3de72 || '').trim();
  if (!_0x17e76b) return '';
  for (const _0x147846 of Object.values(_0x164919 || {})) {
    const _0x5681f3 = Array.isArray(_0x147846?.models) ? _0x147846.models : [],
      _0x4c8ca1 = _0x5681f3.find((_0x5ee5bd) => _0x5ee5bd?.id === _0x17e76b);
    if (_0x4c8ca1) return _0x4c8ca1.name || _0x4c8ca1.id || _0x17e76b;
  }
  return getModelDisplayName(_0x17e76b);
}
export function getImageFunctionNanoSelection(_0x4f7277, _0xbb26fb = '', _0x22fa6e = '2K') {
  const _0x33ba6f = getNanoBananaSelectionFromModel(_0x4f7277, _0x22fa6e, _0xbb26fb);
  if (!_0x33ba6f || !isNanoBananaFamily(_0x33ba6f.family)) return null;
  if (_0x33ba6f.family === 'gpt-image-2') return null;
  const _0xab3e4b = String(_0xbb26fb || '')
      .trim()
      .toLowerCase(),
    _0x526d6b = String(_0x33ba6f.provider || '')
      .trim()
      .toLowerCase();
  if (_0xab3e4b && _0x526d6b !== _0xab3e4b) return null;
  return _0x33ba6f;
}
export function resolveImageFunctionModelFromMenuItem({
  model: _0x3f578a,
  provider: _0xa88d7d,
  family: _0x490bc5,
  imageSize: imageSize = '2K',
} = {}) {
  const _0x3d9515 = String(_0xa88d7d || '').trim(),
    _0x4f7159 = String(_0x490bc5 || '').trim();
  if (_0x4f7159 && isNanoBananaFamily(_0x4f7159)) {
    const _0x33132f = getDefaultModeForNanoBananaFamily(_0x4f7159, _0x3d9515);
    return {
      model: resolveNanoBananaModelBySelection({
        family: _0x4f7159,
        mode: _0x33132f,
        imageSize: imageSize,
        provider: _0x3d9515,
      }),
      provider: _0x3d9515,
      family: _0x4f7159,
      mode: _0x33132f,
    };
  }
  return { model: String(_0x3f578a || '').trim(), provider: _0x3d9515, family: '', mode: '' };
}
export function resolveImageFunctionModelByMode({
  model: _0x4b66ca,
  provider: _0x18a865,
  imageSize: imageSize = '2K',
  mode: _0x24aa8f,
} = {}) {
  const _0x472ec3 = getImageFunctionNanoSelection(_0x4b66ca, _0x18a865, imageSize);
  if (!_0x472ec3) return null;
  const _0x36704e = String(_0x24aa8f || '').trim();
  if (!_0x36704e) return null;
  return {
    model: resolveNanoBananaModelBySelection({
      family: _0x472ec3.family,
      mode: _0x36704e,
      imageSize: imageSize,
      provider: _0x472ec3.provider,
    }),
    provider: _0x472ec3.provider,
    family: _0x472ec3.family,
    mode: _0x36704e,
  };
}
export function buildImageFunctionModeMenuHTML({
  model: model = '',
  provider: provider = '',
  imageSize: imageSize = '2K',
} = {}) {
  const _0x358dba = getImageFunctionNanoSelection(model, provider, imageSize);
  if (!_0x358dba) return '';
  return renderToolbarUpMenu({
    fieldId: 'mode',
    value: _0x358dba.mode,
    options: getNanoBananaModeOptions(_0x358dba.family, _0x358dba.provider).map((_0xf81312) => ({
      value: _0xf81312.mode,
      label: _0xf81312.label,
      tooltip: _0xf81312.tooltip,
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
  const _0x1a11ee = getImageFunctionNanoSelection(model, provider, imageSize);
  if (!_0x1a11ee) return t('imageFunctionMenu.modes.normal');
  return getNanoBananaModeLabel(_0x1a11ee.family, _0x1a11ee.mode, _0x1a11ee.provider);
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
  const _0xcdb402 = isImageFunctionModeVisible({ model: model, provider: provider, imageSize: imageSize }),
    _0xcfc655 = getImageFunctionModeLabel({ model: model, provider: provider, imageSize: imageSize }),
    _0x1348a9 = getImageFunctionNanoSelection(model, provider, imageSize);
  return (
    '\n    ' +
    renderToolbarUpMenu({
      fieldId: 'mode',
      value: _0x1348a9?.mode || '',
      options: _0x1348a9
        ? getNanoBananaModeOptions(_0x1348a9.family, _0x1348a9.provider).map((_0x14c55b) => ({
            value: _0x14c55b.mode,
            label: _0x14c55b.label,
            tooltip: _0x14c55b.tooltip,
          }))
        : [],
      wrapClass: wrapClass + ' image-function-mode-wrap ' + (_0xcdb402 ? '' : 'is-hidden'),
      buttonClass: buttonClass + ' image-function-mode-toggle',
      labelClass: 'image-function-mode-label',
      menuClass: 'nb-mode-menu image-function-mode-menu',
      openClass: 'show',
      selectedLabel: _0xcfc655,
      itemClass: '',
      itemValueAttrs: ['data-nb-mode'],
    })
  );
}
export function syncImageFunctionModeControl({
  root: _0x1c314c,
  model: _0x328bc8,
  provider: provider = '',
  imageSize: imageSize = '2K',
} = {}) {
  if (!_0x1c314c) return null;
  const _0xcae34b = _0x1c314c.querySelector('.image-function-mode-wrap'),
    _0x36c2e4 = _0x1c314c.querySelector('.image-function-mode-label'),
    _0x5afa51 = _0x1c314c.querySelector('.image-function-mode-menu'),
    _0x1940b2 = isImageFunctionModeVisible({ model: _0x328bc8, provider: provider, imageSize: imageSize });
  _0xcae34b?.classList.toggle('is-hidden', !_0x1940b2);
  _0x36c2e4 &&
    (_0x36c2e4.textContent = getImageFunctionModeLabel({
      model: _0x328bc8,
      provider: provider,
      imageSize: imageSize,
    }));
  if (_0x5afa51) {
    _0x5afa51.innerHTML = buildImageFunctionModeMenuHTML({
      model: _0x328bc8,
      provider: provider,
      imageSize: imageSize,
    });
    if (!_0x1940b2) _0x5afa51.classList.remove('show');
  }
  return getImageFunctionNanoSelection(_0x328bc8, provider, imageSize);
}
export function bindImageFunctionModeMenu({ modeMenu: _0x29858f, onSelect: _0x203be5 } = {}) {
  if (!_0x29858f || typeof _0x203be5 !== 'function') return () => {};
  return bindToolbarUpMenus(_0x29858f, {
    onSelect: ({ value: _0x2c8b8a, item: _0x719459 }) => {
      const _0x4da57b = String(_0x2c8b8a || _0x719459?.dataset?.nbMode || '').trim();
      if (!_0x4da57b) return;
      _0x203be5({ mode: _0x4da57b, item: _0x719459 });
    },
  });
}
function getProviderIconHtml(_0xfe6e7e, _0x402140, _0x2505e1 = '') {
  if (_0xfe6e7e?.isTextIcon)
    return (
      '<span class="image-function-model-icon image-function-model-icon-text ' +
      escapeHtmlAttr(_0x2505e1) +
      '">' +
      escapeHtmlText(_0xfe6e7e.icon) +
      '</span>'
    );
  const _0x2b63d7 = _0xfe6e7e?.icon || '';
  if (!_0x2b63d7) return '';
  return (
    '<img class="image-function-model-icon ' +
    escapeHtmlAttr(_0x2505e1) +
    '" src="' +
    escapeHtmlAttr(_0x2b63d7) +
    '" alt="' +
    escapeHtmlAttr(_0x402140) +
    '">'
  );
}
function getModelIconHtml(_0x174953, _0xe7223e, _0x39329f, _0x29d7f5 = '') {
  if (_0xe7223e?.modelIconStrategy === 'provider')
    return getProviderIconHtml(_0xe7223e, _0x39329f, _0x29d7f5);
  const _0x4882e9 = _0x174953?.icon || _0xe7223e?.icon || '';
  if (_0x174953?.isTextIcon)
    return (
      '<span class="image-function-model-icon image-function-model-icon-text ' +
      escapeHtmlAttr(_0x29d7f5) +
      '">' +
      escapeHtmlText(_0x174953.icon || _0x174953.name || _0xe7223e?.icon || '') +
      '</span>'
    );
  if (_0xe7223e?.isTextIcon && !_0x4882e9)
    return (
      '<span class="image-function-model-icon image-function-model-icon-text ' +
      escapeHtmlAttr(_0x29d7f5) +
      '">' +
      escapeHtmlText(_0xe7223e.icon) +
      '</span>'
    );
  if (!_0x4882e9) return '';
  return (
    '<img class="image-function-model-icon ' +
    escapeHtmlAttr(_0x29d7f5) +
    '" src="' +
    escapeHtmlAttr(_0x4882e9) +
    '" alt="' +
    escapeHtmlAttr(_0x39329f) +
    '">'
  );
}
export function getImageFunctionModelTriggerIconHTML(
  _0x362293,
  _0x54965b = '',
  _0x4df570 = buildImageFunctionModelCatalog(),
) {
  const _0x52c0b9 = _0x4df570,
    _0x1399ef = _0x54965b || findImageFunctionProviderByModel(_0x52c0b9, _0x362293) || 'grsai',
    _0x35118f = _0x52c0b9[_0x1399ef] || _0x52c0b9.grsai;
  return getProviderIconHtml(_0x35118f, _0x1399ef, 'image-function-model-trigger-icon');
}
export function buildImageFunctionModelMenuHTML({
  activeModel: activeModel = '',
  activeProvider: activeProvider = '',
  modelCatalog: modelCatalog = buildImageFunctionModelCatalog(),
} = {}) {
  const _0x280607 = String(activeModel || '').trim(),
    _0x45f9cb = String(activeProvider || '').trim();
  return Object.entries(modelCatalog || {})
    .map(([_0x3a39e0, _0x18ece1]) => {
      const _0x4a9fe2 = _0x18ece1?.devOnly === true;
      if (_0x4a9fe2) return '';
      const _0x92385f = _0x18ece1?.disabled === true,
        _0x35c4bf = getProviderIconHtml(_0x18ece1, _0x3a39e0),
        _0xfe9ba6 = (_0x18ece1.models || [])
          .map((_0x1749a6) => {
            const _0x22d698 = _0x92385f || _0x1749a6?.disabled === true,
              _0x36908e =
                _0x280607 === _0x1749a6.id ||
                (_0x1749a6.family &&
                  getImageFunctionNanoSelection(_0x280607, _0x3a39e0)?.family === _0x1749a6.family) ||
                (!_0x280607 && _0x45f9cb && _0x45f9cb === _0x3a39e0);
            return (
              '\n            <div class="floating-menu-item ' +
              (_0x36908e ? 'active' : '') +
              '" data-value="' +
              escapeHtmlAttr(_0x1749a6.id) +
              '" data-provider="' +
              escapeHtmlAttr(_0x3a39e0) +
              '" ' +
              (_0x1749a6.family
                ? 'data-image-function-family="' + escapeHtmlAttr(_0x1749a6.family) + '"'
                : '') +
              ' ' +
              (_0x22d698 ? 'data-disabled="true"' : '') +
              '>\n              ' +
              getModelIconHtml(_0x1749a6, _0x18ece1, _0x3a39e0) +
              '\n              <div class="fmi-content">\n                <div class="fmi-title">' +
              escapeHtmlText(_0x1749a6.name || _0x1749a6.id) +
              '</div>\n                <div class="fmi-sub">' +
              escapeHtmlText(_0x1749a6.description || _0x18ece1.description || '') +
              '</div>\n              </div>\n              ' +
              (_0x22d698
                ? '<span class="floating-menu-badge floating-menu-badge-danger">不可用</span>'
                : '') +
              '\n            </div>'
            );
          })
          .join('');
      return (
        '\n        <div class="' +
        escapeHtmlAttr(_0x3a39e0) +
        '-group-header floating-menu-item" data-image-function-provider="' +
        escapeHtmlAttr(_0x3a39e0) +
        '" data-' +
        escapeHtmlAttr(_0x3a39e0) +
        '-toggle>\n          ' +
        _0x35c4bf +
        '\n          <div class="fmi-content">\n            <div class="fmi-title">' +
        escapeHtmlText(_0x18ece1.name || _0x3a39e0) +
        '</div>\n            <div class="fmi-sub">' +
        escapeHtmlText(_0x18ece1.description || '') +
        '</div>\n          </div>\n          ' +
        (_0x92385f
          ? '<span class="floating-menu-badge floating-menu-badge-danger floating-menu-badge-inline">不可用</span>'
          : '') +
        '\n          <svg class="image-function-model-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>\n        </div>\n        <div class="' +
        escapeHtmlAttr(_0x3a39e0) +
        '-submenu image-function-model-submenu">\n          ' +
        _0xfe9ba6 +
        '\n        </div>'
      );
    })
    .join('');
}
export function syncImageFunctionModelMenuActive({
  modelMenu: _0x20cd4b,
  model: _0x559d86,
  provider: provider = '',
} = {}) {
  if (!_0x20cd4b) return;
  const _0x4d62fd = String(_0x559d86 || '').trim(),
    _0x48627b = String(provider || '').trim(),
    _0x97c59b = getImageFunctionNanoSelection(_0x4d62fd, _0x48627b);
  _0x20cd4b.querySelectorAll('.floating-menu-item').forEach((_0xa17d8b) => {
    if (!_0xa17d8b.dataset.value) {
      _0xa17d8b.classList.remove('active');
      return;
    }
    const _0x4c68c5 = String(_0xa17d8b.dataset.imageFunctionFamily || '').trim(),
      _0x3d9ac5 =
        _0xa17d8b.dataset.value === _0x4d62fd ||
        (!!_0x4c68c5 &&
          _0x97c59b?.provider === _0xa17d8b.dataset.provider &&
          _0x97c59b?.family === _0x4c68c5) ||
        (!_0x4d62fd && _0x48627b && _0xa17d8b.dataset.provider === _0x48627b);
    _0xa17d8b.classList.toggle('active', _0x3d9ac5);
  });
}
export function closeImageFunctionModelSubmenus(_0x147926) {
  _0x147926?.querySelectorAll('.image-function-model-submenu').forEach((_0x1621bb) => {
    _0x1621bb.style.display = 'none';
  });
}
export function bindImageFunctionModelMenu({
  modelMenu: _0x2b2010,
  onSelect: _0x492bc1,
  closeMenu: _0x10036f,
  onOpenSubmenu: _0x46dcb0,
} = {}) {
  if (!_0x2b2010 || typeof _0x492bc1 !== 'function') return () => {};
  const _0x50ef10 = [];
  let _0x51d970 = 0;
  const _0x53a279 = () => {
      if (_0x51d970) clearTimeout(_0x51d970);
      _0x51d970 = 0;
    },
    _0x578284 = (_0x4a57fc, _0x4c0840 = 120) => {
      (_0x53a279(),
        (_0x51d970 = setTimeout(() => {
          ((_0x4a57fc.style.display = 'none'), (_0x51d970 = 0));
        }, _0x4c0840)));
    };
  _0x2b2010.querySelectorAll('[data-image-function-provider]').forEach((_0x80708e) => {
    const _0x16db84 = _0x80708e.dataset.imageFunctionProvider,
      _0x4db827 = _0x2b2010.querySelector('.' + _0x16db84 + '-submenu');
    if (!_0x4db827) return;
    const _0x9a411d = () => {
        (_0x53a279(),
          closeImageFunctionModelSubmenus(_0x2b2010),
          (_0x4db827.style.display = 'flex'),
          _0x46dcb0?.({ header: _0x80708e, submenu: _0x4db827, providerKey: _0x16db84 }));
      },
      _0x4907b2 = () => _0x578284(_0x4db827);
    (_0x80708e.addEventListener('mouseenter', _0x9a411d),
      _0x80708e.addEventListener('mouseleave', _0x4907b2),
      _0x4db827.addEventListener('mouseenter', _0x9a411d),
      _0x4db827.addEventListener('mouseleave', _0x4907b2),
      _0x50ef10.push(() => {
        (_0x80708e.removeEventListener('mouseenter', _0x9a411d),
          _0x80708e.removeEventListener('mouseleave', _0x4907b2),
          _0x4db827.removeEventListener('mouseenter', _0x9a411d),
          _0x4db827.removeEventListener('mouseleave', _0x4907b2));
      }));
  });
  const _0x1321e2 = (_0x22feca) => {
    const _0x15f673 = _0x22feca.target.closest('.floating-menu-item[data-value]');
    if (!_0x15f673 || !_0x2b2010.contains(_0x15f673)) return;
    _0x22feca.stopPropagation();
    if (_0x15f673.dataset.disabled === 'true') return;
    const _0x45787f = String(_0x15f673.dataset.value || '').trim(),
      _0x586357 = String(_0x15f673.dataset.provider || getModelProvider(_0x45787f) || '').trim(),
      _0x20f709 = resolveImageFunctionModelFromMenuItem({
        model: _0x45787f,
        provider: _0x586357,
        family: _0x15f673.dataset.imageFunctionFamily,
      });
    if (!_0x20f709.model || !_0x20f709.provider) return;
    (_0x492bc1({ ..._0x20f709, item: _0x15f673 }),
      syncImageFunctionModelMenuActive({
        modelMenu: _0x2b2010,
        model: _0x20f709.model,
        provider: _0x20f709.provider,
      }),
      closeImageFunctionModelSubmenus(_0x2b2010),
      _0x10036f?.());
  };
  return (
    _0x2b2010.addEventListener('click', _0x1321e2),
    _0x50ef10.push(() => _0x2b2010.removeEventListener('click', _0x1321e2)),
    () => {
      (_0x53a279(), _0x50ef10.forEach((_0x40b634) => _0x40b634()));
    }
  );
}
export { getModelDisplayName };
