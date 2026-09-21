import { getModelsByKind } from '../../manifests/index.js';
import { getTextProviderMenuGroups } from '../../manifests/text/textProviderMenuGroups.js';
import { renderNodeMenuGroup } from '../shared/nodeModelMenu.js';
function escapeHtml(_0x37fd76) {
  return String(_0x37fd76 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function getTextMenuMeta(_0x20b2e8) {
  const _0x1e5124 = _0x20b2e8?.extensions?.textMenu;
  return _0x1e5124 && typeof _0x1e5124 === 'object' ? _0x1e5124 : null;
}
function resolveTextIcon(_0x143de0) {
  const _0x27434f = getTextMenuMeta(_0x143de0);
  if (_0x27434f?.icon) return _0x27434f.icon;
  const _0xff3725 = String(_0x143de0?.modelId || '').toLowerCase();
  if (_0xff3725.includes('deepseek')) return 'deepseek';
  if (_0xff3725.includes('gpt')) return 'oa';
  if (_0xff3725.includes('gemini')) return 'gemini';
  if (_0xff3725.includes('qwen')) return 'qwen';
  if (_0xff3725.includes('kimi')) return 'moonshot';
  const _0x55cd13 = String(_0x143de0?.provider || '').toLowerCase();
  if (_0x55cd13 === 'runninghub') return 'gemini';
  if (_0x55cd13 === 'grsai') return 'grsai';
  if (_0x55cd13 === 'ppio') return 'ppio';
  return _0x55cd13 === 'apimart' ? 'am' : _0x55cd13 || 'am';
}
export function getTextModelMenuItems(_0xefd974) {
  const _0xee8dc4 = String(_0xefd974 || '')
    .trim()
    .toLowerCase();
  return getModelsByKind('text')
    .filter(
      (_0x5e6a85) =>
        String(_0x5e6a85?.provider || '').toLowerCase() === _0xee8dc4 &&
        getTextMenuMeta(_0x5e6a85)?.group === _0xee8dc4,
    )
    .sort((_0x301586, _0x56f281) => {
      const _0x54e613 = getTextMenuMeta(_0x301586),
        _0x579ddb = getTextMenuMeta(_0x56f281);
      return (_0x54e613?.order || 0) - (_0x579ddb?.order || 0);
    })
    .map((_0x1d8ec9) => {
      const _0x580dd1 = getTextMenuMeta(_0x1d8ec9) || {};
      return Object.freeze({
        modelId: _0x1d8ec9.modelId,
        provider: _0x1d8ec9.provider,
        title: _0x580dd1.title || _0x1d8ec9.displayName,
        subtitle: _0x580dd1.subtitle || _0x1d8ec9.description || '',
        icon: resolveTextIcon(_0x1d8ec9),
      });
    });
}
export const TEXT_MODEL_MENU_ITEMS_BY_PROVIDER = Object.freeze({
  grsai: Object.freeze(getTextModelMenuItems('grsai')),
  ppio: Object.freeze(getTextModelMenuItems('ppio')),
  apimart: Object.freeze(getTextModelMenuItems('apimart')),
  agnes: Object.freeze(getTextModelMenuItems('agnes')),
  runninghub: Object.freeze(getTextModelMenuItems('runninghub')),
  volcengine: Object.freeze(getTextModelMenuItems('volcengine')),
});
export const TEXT_MODEL_IDS_BY_PROVIDER = Object.freeze(
  Object.fromEntries(
    Object.entries(TEXT_MODEL_MENU_ITEMS_BY_PROVIDER).map(([_0x1a56e3, _0x4cd03a]) => [
      _0x1a56e3,
      Object.freeze(_0x4cd03a.map((_0x5c9271) => _0x5c9271.modelId)),
    ]),
  ),
);
export const TEXT_MODEL_DISPLAY_NAME_MAP = Object.freeze(
  Object.fromEntries(
    Object.values(TEXT_MODEL_MENU_ITEMS_BY_PROVIDER)
      .flat()
      .map((_0x873d74) => [_0x873d74.modelId, _0x873d74.title]),
  ),
);
export const APIMART_TEXT_MODEL_MENU_ITEMS = Object.freeze(TEXT_MODEL_MENU_ITEMS_BY_PROVIDER.apimart);
export const APIMART_TEXT_MODEL_IDS = Object.freeze(TEXT_MODEL_IDS_BY_PROVIDER.apimart);
export const APIMART_TEXT_MODEL_DISPLAY_NAME_MAP = Object.freeze(
  Object.fromEntries(APIMART_TEXT_MODEL_MENU_ITEMS.map((_0xb4a48d) => [_0xb4a48d.modelId, _0xb4a48d.title])),
);
export const RUNNINGHUB_TEXT_MODEL_MENU_ITEMS = Object.freeze(TEXT_MODEL_MENU_ITEMS_BY_PROVIDER.runninghub);
export const RUNNINGHUB_TEXT_MODEL_IDS = Object.freeze(TEXT_MODEL_IDS_BY_PROVIDER.runninghub);
export const VOLCENGINE_TEXT_MODEL_MENU_ITEMS = Object.freeze(TEXT_MODEL_MENU_ITEMS_BY_PROVIDER.volcengine);
export const VOLCENGINE_TEXT_MODEL_IDS = Object.freeze(TEXT_MODEL_IDS_BY_PROVIDER.volcengine);
export function findTextModelMenuItem(_0x25d8e4) {
  const _0x40289f = String(_0x25d8e4 || '').trim();
  return (
    Object.values(TEXT_MODEL_MENU_ITEMS_BY_PROVIDER)
      .flat()
      .find((_0x1fbcee) => _0x1fbcee.modelId === _0x40289f) || null
  );
}
export function buildTextModelIconHTML(_0x41b1c2, _0x585db0 = 20) {
  const _0x4bc855 = Math.max(10, Number(_0x585db0) || 20),
    _0x1c0b65 = _0x4bc855 <= 12 ? 'text-model-icon-small' : 'text-model-icon';
  if (_0x41b1c2 === 'deepseek')
    return '<img src="images/deepseek.svg" class="' + _0x1c0b65 + '" alt="deepseek">';
  if (_0x41b1c2 === 'gemini') return '<img src="images/gemini.svg" class="' + _0x1c0b65 + '" alt="gemini">';
  if (_0x41b1c2 === 'qwen') return '<img src="images/qwen.svg" class="' + _0x1c0b65 + '" alt="qwen">';
  if (_0x41b1c2 === 'grsai')
    return '<img src="images/grsai.png" class="' + _0x1c0b65 + ' text-model-icon-padded" alt="grsai">';
  if (_0x41b1c2 === 'ppio') return '<img src="images/ppio.png" class="' + _0x1c0b65 + '" alt="ppio">';
  if (_0x41b1c2 === 'runninghub')
    return '<img src="images/RH.png" class="' + _0x1c0b65 + '" alt="runninghub">';
  if (_0x41b1c2 === 'volcengine')
    return '<img src="images/volcengine.svg" class="' + _0x1c0b65 + '" alt="volcengine">';
  if (_0x41b1c2 === 'agnes') return '<div class="' + _0x1c0b65 + ' text-model-icon-badge">AG</div>';
  if (_0x41b1c2 === 'moonshot')
    return (
      '<div class="' + _0x1c0b65 + ' text-model-icon-badge text-model-icon-moonshot"><span>M</span></div>'
    );
  if (_0x41b1c2 === 'am')
    return '<div class="' + _0x1c0b65 + ' text-model-icon-badge text-model-icon-apimart">AM</div>';
  const _0x1221e1 = _0x41b1c2 === 'oa' ? 'OA' : 'AM';
  return '<div class="' + _0x1c0b65 + ' text-model-icon-badge">' + _0x1221e1 + '</div>';
}
export function buildTextModelSmallIconHTML(_0x263ab1) {
  const _0x3c4558 = findTextModelMenuItem(_0x263ab1);
  return _0x3c4558 ? buildTextModelIconHTML(_0x3c4558.icon, 12) : '';
}
export function buildTextModelMenuHTML(_0x3299cc, _0xadf90b) {
  const _0x5ac7cc = TEXT_MODEL_MENU_ITEMS_BY_PROVIDER[String(_0xadf90b || '').toLowerCase()] || [];
  return _0x5ac7cc
    .map(
      ({ modelId: _0x5ef3fb, provider: _0xd06f09, title: _0x13f4ba, subtitle: _0x4794f7, icon: _0x3e9062 }) =>
        '\n                  <div class="floating-menu-item node-menu-item ' +
        (_0x3299cc === _0x5ef3fb ? 'active' : '') +
        '" data-value="' +
        escapeHtml(_0x5ef3fb) +
        '" data-provider="' +
        escapeHtml(_0xd06f09) +
        '">\n                    ' +
        buildTextModelIconHTML(_0x3e9062, 20) +
        '\n                    <div class="fmi-content">\n                      <div class="fmi-title">' +
        escapeHtml(_0x13f4ba) +
        '</div>\n                      <div class="fmi-sub">' +
        escapeHtml(_0x4794f7) +
        '</div>\n                    </div>\n                  </div>',
    )
    .join('');
}
export function buildTextProviderMenuGroupsHTML(_0x51a4fa, _0x5aab74 = {}) {
  const _0x120f75 = Array.isArray(_0x5aab74.providers)
    ? new Set(_0x5aab74.providers.map((_0x55e5ae) => String(_0x55e5ae).toLowerCase()))
    : null;
  return getTextProviderMenuGroups()
    .filter((_0x5652d7) => !_0x120f75 || _0x120f75.has(_0x5652d7.id))
    .map((_0x2d147a) =>
      renderNodeMenuGroup(
        {
          id: _0x2d147a.id,
          headerClass: _0x2d147a.id + '-group-header',
          submenuClass: _0x2d147a.id + '-submenu',
          toggleAttr: 'data-' + _0x2d147a.id + '-toggle',
          label: _0x2d147a.label,
          subtitle: _0x2d147a.subtitle,
          iconHtml:
            _0x2d147a.icon === 'runninghub'
              ? '<img src="images/RH.png" class="text-model-icon" alt="runninghub">'
              : buildTextModelIconHTML(_0x2d147a.icon, 20),
          itemsHtml: buildTextModelMenuHTML(_0x51a4fa, _0x2d147a.id),
        },
        { activeModel: _0x51a4fa },
      ),
    )
    .join('');
}
export function buildApimartTextModelMenuHTML(_0x1fd368) {
  return buildTextModelMenuHTML(_0x1fd368, 'apimart');
}
export function buildRunningHubTextModelMenuHTML(_0x4b3979) {
  return buildTextModelMenuHTML(_0x4b3979, 'runninghub');
}
