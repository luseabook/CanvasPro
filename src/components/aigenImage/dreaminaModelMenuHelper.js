import { getModelManifest, getModelsByKind } from '../../manifests/index.js';
import { renderNodeMenuGroup, renderNodeMenuItem } from '../shared/nodeModelMenu.js';
import { t } from '../../i18n/index.js';
const DREAMINA_IMAGE_ALLOWED_RATIOS = new Set(['21:9', '16:9', '3:2', '4:3', '1:1', '3:4', '2:3', '9:16']),
  DREAMINA_IMAGE_ADAPTIVE_RATIO_OPTIONS = [
    { label: '21:9', calc: 21 / 9 },
    { label: '16:9', calc: 16 / 9 },
    { label: '3:2', calc: 3 / 2 },
    { label: '4:3', calc: 4 / 3 },
    { label: '1:1', calc: 1 / 1 },
    { label: '3:4', calc: 3 / 4 },
    { label: '2:3', calc: 2 / 3 },
    { label: '9:16', calc: 9 / 16 },
  ],
  DREAMINA_IMAGE_ALLOWED_SIZES = new Set(['2K', '4K']),
  DREAMINA_IMAGE_MENU_ICON_HTML = '<img src="images/jimeng.png" class="node-menu-icon" alt="dreamina">';
function getDreaminaImageMenuMeta(value) {
  const item = value?.extensions?.imageMenu;
  return item && item.group === 'dreamina' ? item : null;
}
function getDreaminaImageManifest(key) {
  const modelManifest = getModelManifest(key);
  return getDreaminaImageMenuMeta(modelManifest) ? modelManifest : null;
}
export function getDreaminaImageModelMenuOptions() {
  return getModelsByKind('image')
    .filter((item2) => getDreaminaImageMenuMeta(item2))
    .sort((item3, index) => {
      const dreaminaImageMenuMeta = getDreaminaImageMenuMeta(item3),
        dreaminaImageMenuMeta2 = getDreaminaImageMenuMeta(index);
      return (dreaminaImageMenuMeta?.order || 0) - (dreaminaImageMenuMeta2?.order || 0);
    })
    .map((model) => {
      const title = getDreaminaImageMenuMeta(model);
      return {
        model: model.modelId,
        title: title.title || model.displayName || model.modelId,
        subtitle: title.subtitle || model.description || '',
        default: title.default === true,
      };
    });
}
export function getDefaultDreaminaImageModelId() {
  const list = getDreaminaImageModelMenuOptions();
  return list.find((item4) => item4.default === true)?.model || list[0]?.model || '';
}
export const DREAMINA_IMAGE_MODEL_VERSIONS = Object.freeze(
  getDreaminaImageModelMenuOptions()
    .map((item5) =>
      String(item5.model || '')
        .replace(/^dreamina\//, '')
        .trim(),
    )
    .filter(Boolean),
);
const DREAMINA_IMAGE_MODEL_VERSION_SET = new Set(DREAMINA_IMAGE_MODEL_VERSIONS);
export function normalizeDreaminaImageModel(result, data) {
  const enabled = String(result || '').trim(),
    options = String(data || '')
      .trim()
      .toLowerCase(),
    dreaminaImageManifest = getDreaminaImageManifest(enabled);
  if (dreaminaImageManifest) return dreaminaImageManifest.modelId;
  if (!enabled && options === 'dreamina') return getDefaultDreaminaImageModelId();
  return enabled;
}
export function getDreaminaImageModelVersion(target, source) {
  const list2 = normalizeDreaminaImageModel(target, source);
  if (!list2.startsWith('dreamina/')) return '';
  const next = list2.slice('dreamina/'.length).trim();
  return DREAMINA_IMAGE_MODEL_VERSION_SET.has(next) ? next : '';
}
export function normalizeDreaminaImageSize(current) {
  const enabled2 = String(current || '')
    .trim()
    .toUpperCase();
  if (!enabled2 || enabled2 === '1K') return '2K';
  if (DREAMINA_IMAGE_ALLOWED_SIZES.has(enabled2)) return enabled2;
  return '2K';
}
export function normalizeDreaminaImageAspectRatio(entry) {
  const enabled3 = String(entry || '').trim();
  if (!enabled3) return enabled3;
  if (enabled3 === 'auto') return '自适应';
  if (enabled3 === '5:4') return '4:3';
  if (enabled3 === '4:5') return '3:4';
  return enabled3;
}
export function isDreaminaImageRatioSupported(record) {
  const enabled4 = String(record || '').trim();
  if (!enabled4 || enabled4 === '自适应' || enabled4 === 'auto') return true;
  return DREAMINA_IMAGE_ALLOWED_RATIOS.has(enabled4);
}
export function pickClosestDreaminaImageAspectRatio(payload, handle) {
  const count = Number(payload),
    count2 = Number(handle);
  if (!(Number.isFinite(count) && count > 0 && Number.isFinite(count2) && count2 > 0)) return '1:1';
  const state = count / count2;
  let config = DREAMINA_IMAGE_ADAPTIVE_RATIO_OPTIONS[0],
    scope = Math.abs(state - config.calc);
  for (let input = 1; input < DREAMINA_IMAGE_ADAPTIVE_RATIO_OPTIONS.length; input += 1) {
    const output = DREAMINA_IMAGE_ADAPTIVE_RATIO_OPTIONS[input],
      value2 = Math.abs(state - output.calc);
    value2 < scope && ((scope = value2), (config = output));
  }
  return config.label;
}
export function buildDreaminaImageNodeNormalizationPatch(value3) {
  const value4 = value3 && typeof value3 === 'object' ? value3 : {};
  if (!isDreaminaImageModel(value4.model, value4.provider)) return null;
  const dreaminaImageModel = normalizeDreaminaImageModel(value4.model, value4.provider),
    dreaminaImageSize = normalizeDreaminaImageSize(value4.imageSize),
    dreaminaImageAspectRatio = normalizeDreaminaImageAspectRatio(value4.aspectRatio),
    value5 = {};
  dreaminaImageModel &&
    dreaminaImageModel !== String(value4.model || '').trim() &&
    (value5.model = dreaminaImageModel);
  String(value4.provider || '')
    .trim()
    .toLowerCase() !== 'dreamina' && (value5.provider = 'dreamina');
  dreaminaImageSize !==
    String(value4.imageSize || '2K')
      .trim()
      .toUpperCase() && (value5.imageSize = dreaminaImageSize);
  if (dreaminaImageAspectRatio && !isDreaminaImageRatioSupported(dreaminaImageAspectRatio))
    value5.aspectRatio = '1:1';
  else
    dreaminaImageAspectRatio &&
      dreaminaImageAspectRatio !== String(value4.aspectRatio || '').trim() &&
      (value5.aspectRatio = dreaminaImageAspectRatio);
  return Object.keys(value5).length > 0 ? value5 : null;
}
export function isDreaminaImageModel(value6, value7) {
  const value8 = String(value6 || '').trim(),
    value9 = String(value7 || '')
      .trim()
      .toLowerCase();
  return value9 === 'dreamina' || value8.startsWith('dreamina/');
}
export function getDreaminaImageTriggerIconHTML() {
  return (
    '<img src="images/jimeng.png" class="image-model-trigger-icon image-model-trigger-icon-dreamina" alt="' +
    t('aigenImage.dreamina.alt') +
    '">'
  );
}
export function getDreaminaImageMenuGroupHTML(value10) {
  const value11 = String(value10 || '').trim(),
    isDreaminaImageModel2 = isDreaminaImageModel(value11, '')
      ? normalizeDreaminaImageModel(value11, 'dreamina')
      : '',
    handler = (modelId) => {
      const active = isDreaminaImageModel2 === modelId.model;
      return renderNodeMenuItem({
        modelId: modelId.model,
        provider: 'dreamina',
        label: modelId.title,
        description: modelId.subtitle,
        iconHtml: DREAMINA_IMAGE_MENU_ICON_HTML,
        active: active,
      });
    };
  return renderNodeMenuGroup({
    id: 'dreamina',
    headerClass: 'dreamina-group-header',
    submenuClass: 'dreamina-submenu',
    toggleAttr: 'data-dreamina-toggle',
    label: t('aigenImage.dreamina.label'),
    subtitle: t('aigenImage.dreamina.subtitle'),
    iconHtml: DREAMINA_IMAGE_MENU_ICON_HTML,
    itemsHtml: getDreaminaImageModelMenuOptions()
      .map((item6) => handler(item6))
      .join(''),
  });
}
export function setDreaminaImageTriggerIcon(enabled5) {
  if (!enabled5) return;
  const enabled6 = enabled5.firstElementChild;
  if (!enabled6) return;
  const value12 = document.createElement('img');
  ((value12.src = 'images/jimeng.png'),
    (value12.className = 'image-model-trigger-icon image-model-trigger-icon-dreamina'),
    enabled6.replaceWith(value12));
}
export function bindDreaminaImageMenu(value13) {
  const {
    modelMenu: modelMenu,
    modelTrigger: modelTrigger,
    modelLabel: modelLabel,
    nodeId: nodeId,
    store: store,
    buildModelPatch: buildModelPatch,
  } = value13 || {};
  if (!modelMenu || !modelTrigger || !modelLabel || !nodeId || !store) return null;
  const header = modelMenu.querySelector('[data-dreamina-toggle]'),
    submenu = modelMenu.querySelector('.dreamina-submenu');
  if (!header || !submenu) return null;
  let setTimeout2 = null;
  const value14 = () => {
      (setTimeout2 && (clearTimeout(setTimeout2), (setTimeout2 = null)), (submenu.style.display = 'flex'));
    },
    value15 = () => {
      if (setTimeout2) clearTimeout(setTimeout2);
      setTimeout2 = setTimeout(() => {
        submenu.style.display = 'none';
      }, 120);
    };
  return (
    header.addEventListener('mouseenter', value14),
    header.addEventListener('mouseleave', value15),
    submenu.addEventListener('mouseenter', value14),
    submenu.addEventListener('mouseleave', value15),
    submenu.querySelectorAll('.floating-menu-item').forEach((el) => {
      el.addEventListener('click', () => {
        const model2 = String(el.dataset.value || getDefaultDreaminaImageModelId()).trim(),
          provider = String(el.dataset.provider || 'dreamina').trim(),
          el2 = el.querySelector('.fmi-title');
        ((modelLabel.textContent = el2 ? el2.textContent : model2),
          modelMenu.querySelectorAll('.floating-menu-item').forEach((el3) => el3.classList.remove('active')),
          el.classList.add('active'),
          modelMenu.classList.remove('show'),
          (submenu.style.display = 'none'));
        const value16 = store.getState?.().nodes?.[nodeId] || {},
          value17 =
            typeof buildModelPatch === 'function'
              ? buildModelPatch(value16, model2, provider)
              : { model: model2, provider: provider };
        (store.updateNodeData(nodeId, value17), setDreaminaImageTriggerIcon(modelTrigger));
      });
    }),
    { header: header, submenu: submenu }
  );
}
