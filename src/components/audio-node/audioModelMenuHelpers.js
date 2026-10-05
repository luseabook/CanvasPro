import {
  renderComfyUiCloudWorkflowLogoHtml,
  renderComfyUiLocalWorkflowLogoHtml,
  renderComfyUiWorkflowLogoHtmlFromIconKind,
} from '../shared/customAiAppLogo.js';
import { escapeNodeMenuHtml } from '../shared/nodeModelMenu.js';
import { buildModelProviderProfileBadgesHtml } from '../shared/modelProviderProfileControl.js';
import { getModelsByKind } from '../../manifests/index.js';
import { renderNodeModelMenu, renderNodeModelTrigger } from '../shared/nodeModelMenu.js';
import { t } from '../../i18n/index.js';
function audioModelMenuText(value, item = {}) {
  return t('audioModelMenu.' + value, item);
}
function getAudioMenuMeta(key) {
  const index = key?.extensions?.audioMenu;
  return index && typeof index === 'object' ? index : null;
}
function isAudioModelMenuManifest(result) {
  const audioMenuMeta = getAudioMenuMeta(result);
  if (audioMenuMeta?.group !== 'runninghubWorkflow') return false;
  if (result?.provider !== 'runninghubwf') return false;
  const list = Array.isArray(result?.uiPlacement) ? result.uiPlacement : ['modelMenu'];
  return !(list.includes('toolbar') && !list.includes('modelMenu'));
}
export function getAudioWorkflowMenuManifests() {
  return getModelsByKind('audio')
    .filter(isAudioModelMenuManifest)
    .sort((item2, data) => {
      const options = Number(getAudioMenuMeta(item2)?.order),
        target = Number(getAudioMenuMeta(data)?.order),
        source = Number.isFinite(options) ? options : 0,
        next = Number.isFinite(target) ? target : 0;
      if (source !== next) return source - next;
      return String(item2.modelId || '').localeCompare(String(data.modelId || ''));
    });
}
export function buildAudioWorkflowItems(validate = {}) {
  return getAudioWorkflowMenuManifests().map((key2) =>
    Object.freeze({
      key: key2.modelId,
      label: key2.displayName,
      subtitle: key2.description || '',
      vip: key2.vip === true,
      validate: validate[key2.modelId] || (() => ''),
    }),
  );
}
export function buildAudioModelMenuHtml({
  activeModel: activeModel = '',
  workflowItems: workflowItems = [],
} = {}) {
  return renderNodeModelMenu({
    kind: 'audio',
    activeModel: activeModel,
    groups: [
      {
        id: 'runninghub',
        label: audioModelMenuText('runninghub.label'),
        subtitle: audioModelMenuText('runninghub.subtitle'),
        icon: 'images/RH.png',
        iconAlt: 'runninghub',
        items: workflowItems.map((modelId) => ({
          modelId: modelId.key,
          label: modelId.label,
          subtitle: modelId.subtitle,
          icon: 'images/RH.png',
          iconAlt: 'runninghub',
          vip: modelId.vip === true,
        })),
      },
    ],
  });
}
export function buildAudioModelTriggerHtml({ label: label = '' } = {}) {
  return renderNodeModelTrigger({
    iconHtml:
      '<img src="images/RH.png" style="width:14px;height:14px;object-fit:contain;border-radius:3px;flex-shrink:0;" alt="runninghub">',
    label: label,
  });
}

function isSavedRhAiAppManifest(current) {
  return Boolean(String(current?.['extensions']?.['rhAiApp']?.['appKey'] || '')['trim']());
}

function isSavedComfyUiWorkflowManifest(entry) {
  return Boolean(String(entry?.['extensions']?.['comfyUiWorkflow']?.['appKey'] || '')['trim']());
}

function buildComfyUiAudioWorkflowIconHtml(record) {
  return renderComfyUiWorkflowLogoHtmlFromIconKind(record, { className: 'node-menu-icon' });
}

function getCustomProviderMeta(payload) {
  const handle = payload?.['extensions']?.['customProvider'];
  return handle && typeof handle === 'object' ? handle : null;
}

function buildCustomProviderAudioLogoHtml(options2 = {}, state = 'node-menu-icon') {
  const config =
    String(options2?.['badge'] || 'CP')
      ['trim']()
      ['slice'](0, 2) || 'CP';
  return (
    '<div class="' +
    escapeNodeMenuHtml(state) +
    ' node-menu-icon-badge">' +
    escapeNodeMenuHtml(config) +
    '</div>'
  );
}

function getAudioMenuIconHtml(options3 = {}) {
  const scope = String(options3?.['iconKind'] || '')['trim']();
  if (scope === 'comfyUiCloudWorkflowBadge' || scope === 'comfyUiLocalWorkflowBadge')
    return buildComfyUiAudioWorkflowIconHtml(scope);
  if (scope === 'customProviderBadge') return buildCustomProviderAudioLogoHtml(options3);
  return '';
}

const AUDIO_MENU_GROUP_CONFIG = Object['freeze']({
  rhAiApp: Object['freeze']({
    id: 'rhAiApp',
    label: 'RH AI应用',
    subtitle: '自定义 RunningHub AI App',
    icon: 'images/RH.png',
    iconAlt: 'runninghub',
    order: 5,
  }),
  comfyUiCloudWorkflow: Object['freeze']({
    id: 'comfyUiCloudWorkflow',
    label: '云端工作流',
    subtitle: '保存的 ComfyUI 云端工作流',
    iconHtml: renderComfyUiCloudWorkflowLogoHtml({ className: 'node-menu-icon' }),
    order: 6,
  }),
  comfyUiLocalWorkflow: Object['freeze']({
    id: 'comfyUiLocalWorkflow',
    label: '本地工作流',
    subtitle: '保存的 ComfyUI 本地工作流',
    iconHtml: renderComfyUiLocalWorkflowLogoHtml({ className: 'node-menu-icon' }),
    order: 7,
  }),
  runninghubWorkflow: Object['freeze']({
    id: 'runninghub',
    labelKey: 'runninghub.label',
    subtitleKey: 'runninghub.subtitle',
    icon: 'images/RH.png',
    iconAlt: 'runninghub',
    order: 10,
  }),
  runninghubModel: Object['freeze']({
    id: 'runninghubModel',
    label: 'RunningHub模型',
    subtitle: '语音合成 · 音乐创作 · 声音克隆',
    icon: 'images/RH.png',
    iconAlt: 'runninghub',
    order: 15,
  }),
  volcengineSpeech: Object['freeze']({
    id: 'volcengineSpeech',
    label: '火山语音',
    subtitle: '豆包语音大模型',
    icon: 'images/volcengine.svg',
    iconAlt: 'volcengine-speech',
    order: 20,
  }),
});

function getGroupConfig(input) {
  const output = String(input || '')['trim']();
  if (AUDIO_MENU_GROUP_CONFIG[output]) return AUDIO_MENU_GROUP_CONFIG[output];
  return Object['freeze']({
    id: output || 'other',
    label: output || '其他',
    subtitle: '',
    icon: 'images/RH.png',
    iconAlt: output || '',
    order: 100,
  });
}

function getGroupLabel(value2) {
  if (value2['labelKey']) return audioModelMenuText(value2['labelKey']);
  return value2['label'] || value2['id'];
}

function getGroupSubtitle(value3) {
  if (value3['subtitleKey']) return audioModelMenuText(value3['subtitleKey']);
  return value3['subtitle'] || '';
}

function groupWorkflowItems(list2 = []) {
  const map = new Map();
  return (
    list2['forEach']((value4) => {
      const value5 = String(value4?.['group'] || 'runninghubWorkflow'),
        args = getGroupConfig(value5),
        value6 = !AUDIO_MENU_GROUP_CONFIG[value5] && String(value4?.['providerDisplayName'] || '')['trim']();
      (!map['has'](args['id']) &&
        map['set'](args['id'], {
          ...args,
          label: value6 ? value4['providerDisplayName'] : getGroupLabel(args),
          subtitle: value6 ? 'Custom provider' : getGroupSubtitle(args),
          iconHtml: value6
            ? buildCustomProviderAudioLogoHtml({ badge: value4['providerBadge'] || 'CP' })
            : args['iconHtml'],
          icon: value6 ? undefined : args['icon'],
          iconAlt: value6 ? '' : args['iconAlt'],
          order: value6 ? 30 : args['order'],
          items: [],
        }),
        map['get'](args['id'])['items']['push']({
          modelId: value4['key'],
          provider: value4['provider'] || '',
          label: value4['label'],
          subtitle: value4['subtitle'],
          iconHtml: value4['iconHtml'] || undefined,
          icon: value4['icon'] || args['icon'],
          iconAlt: value4['iconAlt'] || args['iconAlt'],
          vip: value4['vip'] === true,
          badgeHtml: buildModelProviderProfileBadgesHtml(value4['key'], { vip: value4['vip'] === true }),
        }));
    }),
    Array['from'](map['values']())['sort']((value7, value8) => {
      const value9 = Number(value7['order']),
        value10 = Number(value8['order']);
      return (Number['isFinite'](value9) ? value9 : 0) - (Number['isFinite'](value10) ? value10 : 0);
    })
  );
}

export function buildAudioWorkflowMenuGroups(list3 = []) {
  return groupWorkflowItems(list3);
}
