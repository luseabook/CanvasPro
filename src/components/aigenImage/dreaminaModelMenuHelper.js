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
function getDreaminaImageMenuMeta(_0x3cca9b) {
  const _0x30e2f8 = _0x3cca9b?.extensions?.imageMenu;
  return _0x30e2f8 && _0x30e2f8.group === 'dreamina' ? _0x30e2f8 : null;
}
function getDreaminaImageManifest(_0x380df5) {
  const _0xc624ce = getModelManifest(_0x380df5);
  return getDreaminaImageMenuMeta(_0xc624ce) ? _0xc624ce : null;
}
export function getDreaminaImageModelMenuOptions() {
  return getModelsByKind('image')
    .filter((_0x1901c8) => getDreaminaImageMenuMeta(_0x1901c8))
    .sort((_0x5ca487, _0xb0d762) => {
      const _0x5d1c82 = getDreaminaImageMenuMeta(_0x5ca487),
        _0x2ba660 = getDreaminaImageMenuMeta(_0xb0d762);
      return (_0x5d1c82?.order || 0) - (_0x2ba660?.order || 0);
    })
    .map((_0x4b427c) => {
      const _0x2849d4 = getDreaminaImageMenuMeta(_0x4b427c);
      return {
        model: _0x4b427c.modelId,
        title: _0x2849d4.title || _0x4b427c.displayName || _0x4b427c.modelId,
        subtitle: _0x2849d4.subtitle || _0x4b427c.description || '',
        default: _0x2849d4.default === true,
      };
    });
}
export function getDefaultDreaminaImageModelId() {
  const _0x34797e = getDreaminaImageModelMenuOptions();
  return _0x34797e.find((_0xbc50e4) => _0xbc50e4.default === true)?.model || _0x34797e[0]?.model || '';
}
export const DREAMINA_IMAGE_MODEL_VERSIONS = Object.freeze(
  getDreaminaImageModelMenuOptions()
    .map((_0x5d7669) =>
      String(_0x5d7669.model || '')
        .replace(/^dreamina\//, '')
        .trim(),
    )
    .filter(Boolean),
);
const DREAMINA_IMAGE_MODEL_VERSION_SET = new Set(DREAMINA_IMAGE_MODEL_VERSIONS);
export function normalizeDreaminaImageModel(_0x5bbd09, _0xa3874d) {
  const _0xc895da = String(_0x5bbd09 || '').trim(),
    _0xf8a14d = String(_0xa3874d || '')
      .trim()
      .toLowerCase(),
    _0x5b1a01 = getDreaminaImageManifest(_0xc895da);
  if (_0x5b1a01) return _0x5b1a01.modelId;
  if (!_0xc895da && _0xf8a14d === 'dreamina') return getDefaultDreaminaImageModelId();
  return _0xc895da;
}
export function getDreaminaImageModelVersion(_0x30e905, _0x1b2284) {
  const _0x38afe4 = normalizeDreaminaImageModel(_0x30e905, _0x1b2284);
  if (!_0x38afe4.startsWith('dreamina/')) return '';
  const _0x3dc74b = _0x38afe4.slice('dreamina/'.length).trim();
  return DREAMINA_IMAGE_MODEL_VERSION_SET.has(_0x3dc74b) ? _0x3dc74b : '';
}
export function normalizeDreaminaImageSize(_0x5568a4) {
  const _0x5a44c7 = String(_0x5568a4 || '')
    .trim()
    .toUpperCase();
  if (!_0x5a44c7 || _0x5a44c7 === '1K') return '2K';
  if (DREAMINA_IMAGE_ALLOWED_SIZES.has(_0x5a44c7)) return _0x5a44c7;
  return '2K';
}
export function normalizeDreaminaImageAspectRatio(_0x4e8a13) {
  const _0x53fa36 = String(_0x4e8a13 || '').trim();
  if (!_0x53fa36) return _0x53fa36;
  if (_0x53fa36 === 'auto') return '自适应';
  if (_0x53fa36 === '5:4') return '4:3';
  if (_0x53fa36 === '4:5') return '3:4';
  return _0x53fa36;
}
export function isDreaminaImageRatioSupported(_0x41fcf4) {
  const _0x55f353 = String(_0x41fcf4 || '').trim();
  if (!_0x55f353 || _0x55f353 === '自适应' || _0x55f353 === 'auto') return true;
  return DREAMINA_IMAGE_ALLOWED_RATIOS.has(_0x55f353);
}
export function pickClosestDreaminaImageAspectRatio(_0x6fa1d, _0x1aa44c) {
  const _0x28ac7b = Number(_0x6fa1d),
    _0x3142aa = Number(_0x1aa44c);
  if (!(Number.isFinite(_0x28ac7b) && _0x28ac7b > 0 && Number.isFinite(_0x3142aa) && _0x3142aa > 0))
    return '1:1';
  const _0x4ad38e = _0x28ac7b / _0x3142aa;
  let _0x536e23 = DREAMINA_IMAGE_ADAPTIVE_RATIO_OPTIONS[0],
    _0x574bf0 = Math.abs(_0x4ad38e - _0x536e23.calc);
  for (let _0xf2478e = 1; _0xf2478e < DREAMINA_IMAGE_ADAPTIVE_RATIO_OPTIONS.length; _0xf2478e += 1) {
    const _0x103208 = DREAMINA_IMAGE_ADAPTIVE_RATIO_OPTIONS[_0xf2478e],
      _0x1f358a = Math.abs(_0x4ad38e - _0x103208.calc);
    _0x1f358a < _0x574bf0 && ((_0x574bf0 = _0x1f358a), (_0x536e23 = _0x103208));
  }
  return _0x536e23.label;
}
export function buildDreaminaImageNodeNormalizationPatch(_0x5b5cf8) {
  const _0x1dfd1e = _0x5b5cf8 && typeof _0x5b5cf8 === 'object' ? _0x5b5cf8 : {};
  if (!isDreaminaImageModel(_0x1dfd1e.model, _0x1dfd1e.provider)) return null;
  const _0x3765c4 = normalizeDreaminaImageModel(_0x1dfd1e.model, _0x1dfd1e.provider),
    _0x50ee67 = normalizeDreaminaImageSize(_0x1dfd1e.imageSize),
    _0x315048 = normalizeDreaminaImageAspectRatio(_0x1dfd1e.aspectRatio),
    _0x3e3abf = {};
  _0x3765c4 && _0x3765c4 !== String(_0x1dfd1e.model || '').trim() && (_0x3e3abf.model = _0x3765c4);
  String(_0x1dfd1e.provider || '')
    .trim()
    .toLowerCase() !== 'dreamina' && (_0x3e3abf.provider = 'dreamina');
  _0x50ee67 !==
    String(_0x1dfd1e.imageSize || '2K')
      .trim()
      .toUpperCase() && (_0x3e3abf.imageSize = _0x50ee67);
  if (_0x315048 && !isDreaminaImageRatioSupported(_0x315048)) _0x3e3abf.aspectRatio = '1:1';
  else
    _0x315048 &&
      _0x315048 !== String(_0x1dfd1e.aspectRatio || '').trim() &&
      (_0x3e3abf.aspectRatio = _0x315048);
  return Object.keys(_0x3e3abf).length > 0 ? _0x3e3abf : null;
}
export function isDreaminaImageModel(_0x5e7acd, _0x53b87d) {
  const _0x23a618 = String(_0x5e7acd || '').trim(),
    _0x7d7046 = String(_0x53b87d || '')
      .trim()
      .toLowerCase();
  return _0x7d7046 === 'dreamina' || _0x23a618.startsWith('dreamina/');
}
export function getDreaminaImageTriggerIconHTML() {
  return (
    '<img src="images/jimeng.png" class="image-model-trigger-icon image-model-trigger-icon-dreamina" alt="' +
    t('aigenImage.dreamina.alt') +
    '">'
  );
}
export function getDreaminaImageMenuGroupHTML(_0xdbeae5) {
  const _0x55cd45 = String(_0xdbeae5 || '').trim(),
    _0x3a2ec7 = isDreaminaImageModel(_0x55cd45, '') ? normalizeDreaminaImageModel(_0x55cd45, 'dreamina') : '',
    _0x56eb47 = (_0x462a91) => {
      const _0x17d5c3 = _0x3a2ec7 === _0x462a91.model;
      return renderNodeMenuItem({
        modelId: _0x462a91.model,
        provider: 'dreamina',
        label: _0x462a91.title,
        description: _0x462a91.subtitle,
        iconHtml: DREAMINA_IMAGE_MENU_ICON_HTML,
        active: _0x17d5c3,
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
      .map((_0x5715e4) => _0x56eb47(_0x5715e4))
      .join(''),
  });
}
export function setDreaminaImageTriggerIcon(_0x459b6e) {
  if (!_0x459b6e) return;
  const _0x1b43e1 = _0x459b6e.firstElementChild;
  if (!_0x1b43e1) return;
  const _0x3c2123 = document.createElement('img');
  ((_0x3c2123.src = 'images/jimeng.png'),
    (_0x3c2123.className = 'image-model-trigger-icon image-model-trigger-icon-dreamina'),
    _0x1b43e1.replaceWith(_0x3c2123));
}
export function bindDreaminaImageMenu(_0x5e6dc3) {
  const {
    modelMenu: _0x5aadd8,
    modelTrigger: _0xb04b9f,
    modelLabel: _0x1f86fc,
    nodeId: _0xfe3d5f,
    store: _0x4df600,
    buildModelPatch: _0x342c26,
  } = _0x5e6dc3 || {};
  if (!_0x5aadd8 || !_0xb04b9f || !_0x1f86fc || !_0xfe3d5f || !_0x4df600) return null;
  const _0x16b78c = _0x5aadd8.querySelector('[data-dreamina-toggle]'),
    _0x59a7bd = _0x5aadd8.querySelector('.dreamina-submenu');
  if (!_0x16b78c || !_0x59a7bd) return null;
  let _0x53e2fb = null;
  const _0x2b159e = () => {
      (_0x53e2fb && (clearTimeout(_0x53e2fb), (_0x53e2fb = null)), (_0x59a7bd.style.display = 'flex'));
    },
    _0x4dfb09 = () => {
      if (_0x53e2fb) clearTimeout(_0x53e2fb);
      _0x53e2fb = setTimeout(() => {
        _0x59a7bd.style.display = 'none';
      }, 120);
    };
  return (
    _0x16b78c.addEventListener('mouseenter', _0x2b159e),
    _0x16b78c.addEventListener('mouseleave', _0x4dfb09),
    _0x59a7bd.addEventListener('mouseenter', _0x2b159e),
    _0x59a7bd.addEventListener('mouseleave', _0x4dfb09),
    _0x59a7bd.querySelectorAll('.floating-menu-item').forEach((_0x2254e8) => {
      _0x2254e8.addEventListener('click', () => {
        const _0x37e8dc = String(_0x2254e8.dataset.value || getDefaultDreaminaImageModelId()).trim(),
          _0xee92ae = String(_0x2254e8.dataset.provider || 'dreamina').trim(),
          _0x5f451d = _0x2254e8.querySelector('.fmi-title');
        ((_0x1f86fc.textContent = _0x5f451d ? _0x5f451d.textContent : _0x37e8dc),
          _0x5aadd8
            .querySelectorAll('.floating-menu-item')
            .forEach((_0x44605b) => _0x44605b.classList.remove('active')),
          _0x2254e8.classList.add('active'),
          _0x5aadd8.classList.remove('show'),
          (_0x59a7bd.style.display = 'none'));
        const _0xab6edd = _0x4df600.getState?.().nodes?.[_0xfe3d5f] || {},
          _0x11db9f =
            typeof _0x342c26 === 'function'
              ? _0x342c26(_0xab6edd, _0x37e8dc, _0xee92ae)
              : { model: _0x37e8dc, provider: _0xee92ae };
        (_0x4df600.updateNodeData(_0xfe3d5f, _0x11db9f), setDreaminaImageTriggerIcon(_0xb04b9f));
      });
    }),
    { header: _0x16b78c, submenu: _0x59a7bd }
  );
}
