import { getModelsByKind } from '../../manifests/index.js';
import { getTextProviderMenuGroups } from '../../manifests/text/textProviderMenuGroups.js';
import { renderNodeMenuGroup } from '../shared/nodeModelMenu.js';
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function getTextMenuMeta(item) {
  const key = item?.extensions?.textMenu;
  return key && typeof key === 'object' ? key : null;
}
function resolveTextIcon(index) {
  const textMenuMeta = getTextMenuMeta(index);
  if (textMenuMeta?.icon) return textMenuMeta.icon;
  const list = String(index?.modelId || '').toLowerCase();
  if (list.includes('deepseek')) return 'deepseek';
  if (list.includes('gpt')) return 'oa';
  if (list.includes('gemini')) return 'gemini';
  if (list.includes('qwen')) return 'qwen';
  if (list.includes('kimi')) return 'moonshot';
  const result = String(index?.provider || '').toLowerCase();
  if (result === 'runninghub') return 'gemini';
  if (result === 'grsai') return 'grsai';
  if (result === 'ppio') return 'ppio';
  return result === 'apimart' ? 'am' : result || 'am';
}
export function getTextModelMenuItems(data) {
  const options = String(data || '')
    .trim()
    .toLowerCase();
  return getModelsByKind('text')
    .filter(
      (item2) =>
        String(item2?.provider || '').toLowerCase() === options && getTextMenuMeta(item2)?.group === options,
    )
    .sort((item3, target) => {
      const textMenuMeta2 = getTextMenuMeta(item3),
        textMenuMeta3 = getTextMenuMeta(target);
      return (textMenuMeta2?.order || 0) - (textMenuMeta3?.order || 0);
    })
    .map((modelId) => {
      const title = getTextMenuMeta(modelId) || {};
      return Object.freeze({
        modelId: modelId.modelId,
        provider: modelId.provider,
        title: title.title || modelId.displayName,
        subtitle: title.subtitle || modelId.description || '',
        icon: resolveTextIcon(modelId),
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
    Object.entries(TEXT_MODEL_MENU_ITEMS_BY_PROVIDER).map(([source, list2]) => [
      source,
      Object.freeze(list2.map((item4) => item4.modelId)),
    ]),
  ),
);
export const TEXT_MODEL_DISPLAY_NAME_MAP = Object.freeze(
  Object.fromEntries(
    Object.values(TEXT_MODEL_MENU_ITEMS_BY_PROVIDER)
      .flat()
      .map((item5) => [item5.modelId, item5.title]),
  ),
);
export const APIMART_TEXT_MODEL_MENU_ITEMS = Object.freeze(TEXT_MODEL_MENU_ITEMS_BY_PROVIDER.apimart);
export const APIMART_TEXT_MODEL_IDS = Object.freeze(TEXT_MODEL_IDS_BY_PROVIDER.apimart);
export const APIMART_TEXT_MODEL_DISPLAY_NAME_MAP = Object.freeze(
  Object.fromEntries(APIMART_TEXT_MODEL_MENU_ITEMS.map((item6) => [item6.modelId, item6.title])),
);
export const RUNNINGHUB_TEXT_MODEL_MENU_ITEMS = Object.freeze(TEXT_MODEL_MENU_ITEMS_BY_PROVIDER.runninghub);
export const RUNNINGHUB_TEXT_MODEL_IDS = Object.freeze(TEXT_MODEL_IDS_BY_PROVIDER.runninghub);
export const VOLCENGINE_TEXT_MODEL_MENU_ITEMS = Object.freeze(TEXT_MODEL_MENU_ITEMS_BY_PROVIDER.volcengine);
export const VOLCENGINE_TEXT_MODEL_IDS = Object.freeze(TEXT_MODEL_IDS_BY_PROVIDER.volcengine);
export function findTextModelMenuItem(next) {
  const current = String(next || '').trim();
  return (
    Object.values(TEXT_MODEL_MENU_ITEMS_BY_PROVIDER)
      .flat()
      .find((item7) => item7.modelId === current) || null
  );
}
export function buildTextModelIconHTML(entry, record = 20) {
  const count = Math.max(10, Number(record) || 20),
    payload = count <= 12 ? 'text-model-icon-small' : 'text-model-icon';
  if (entry === 'deepseek') return '<img src="images/deepseek.svg" class="' + payload + '" alt="deepseek">';
  if (entry === 'gemini') return '<img src="images/gemini.svg" class="' + payload + '" alt="gemini">';
  if (entry === 'qwen') return '<img src="images/qwen.svg" class="' + payload + '" alt="qwen">';
  if (entry === 'grsai')
    return '<img src="images/grsai.png" class="' + payload + ' text-model-icon-padded" alt="grsai">';
  if (entry === 'ppio') return '<img src="images/ppio.png" class="' + payload + '" alt="ppio">';
  if (entry === 'runninghub') return '<img src="images/RH.png" class="' + payload + '" alt="runninghub">';
  if (entry === 'volcengine')
    return '<img src="images/volcengine.svg" class="' + payload + '" alt="volcengine">';
  if (entry === 'agnes') return '<div class="' + payload + ' text-model-icon-badge">AG</div>';
  if (entry === 'moonshot')
    return '<div class="' + payload + ' text-model-icon-badge text-model-icon-moonshot"><span>M</span></div>';
  if (entry === 'am')
    return '<div class="' + payload + ' text-model-icon-badge text-model-icon-apimart">AM</div>';
  const handle = entry === 'oa' ? 'OA' : 'AM';
  return '<div class="' + payload + ' text-model-icon-badge">' + handle + '</div>';
}
export function buildTextModelSmallIconHTML(state) {
  const textModelMenuItem = findTextModelMenuItem(state);
  return textModelMenuItem ? buildTextModelIconHTML(textModelMenuItem.icon, 12) : '';
}
export function buildTextModelMenuHTML(config, scope) {
  const list3 = TEXT_MODEL_MENU_ITEMS_BY_PROVIDER[String(scope || '').toLowerCase()] || [];
  return list3
    .map(
      ({ modelId: modelId2, provider: provider, title: title2, subtitle: subtitle, icon: icon }) =>
        '\n                  <div class="floating-menu-item node-menu-item ' +
        (config === modelId2 ? 'active' : '') +
        '" data-value="' +
        escapeHtml(modelId2) +
        '" data-provider="' +
        escapeHtml(provider) +
        '">\n                    ' +
        buildTextModelIconHTML(icon, 20) +
        '\n                    <div class="fmi-content">\n                      <div class="fmi-title">' +
        escapeHtml(title2) +
        '</div>\n                      <div class="fmi-sub">' +
        escapeHtml(subtitle) +
        '</div>\n                    </div>\n                  </div>',
    )
    .join('');
}
export function buildTextProviderMenuGroupsHTML(activeModel, input = {}) {
  const map = Array.isArray(input.providers)
    ? new Set(input.providers.map((item8) => String(item8).toLowerCase()))
    : null;
  return getTextProviderMenuGroups()
    .filter((item9) => !map || map.has(item9.id))
    .map((id) =>
      renderNodeMenuGroup(
        {
          id: id.id,
          headerClass: id.id + '-group-header',
          submenuClass: id.id + '-submenu',
          toggleAttr: 'data-' + id.id + '-toggle',
          label: id.label,
          subtitle: id.subtitle,
          iconHtml:
            id.icon === 'runninghub'
              ? '<img src="images/RH.png" class="text-model-icon" alt="runninghub">'
              : buildTextModelIconHTML(id.icon, 20),
          itemsHtml: buildTextModelMenuHTML(activeModel, id.id),
        },
        { activeModel: activeModel },
      ),
    )
    .join('');
}
export function buildApimartTextModelMenuHTML(output) {
  return buildTextModelMenuHTML(output, 'apimart');
}
export function buildRunningHubTextModelMenuHTML(value2) {
  return buildTextModelMenuHTML(value2, 'runninghub');
}
