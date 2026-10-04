import {
  getModelManifest,
  getModelsByKind,
  normalizeProviderId,
  resolveModelExecution,
  resolveModelProvider,
} from '../../manifests/index.js';
import { renderNodeModelMenu } from '../shared/nodeModelMenu.js';
import {
  buildAgnesVideoLogoHTML,
  buildAgnesVideoMenuItemsHtml,
  buildBinghuoVideoLogoHTML,
  buildBinghuoVideoMenuItemsHtml,
  buildApimartVideoLogoHTML,
  buildApimartVideoMenuItemsHtml,
  buildMinimaxVideoLogoHTML,
  buildMinimaxVideoMenuItemsHtml,
  buildComfyUiVideoWorkflowMenuGroups,
  buildCustomProviderVideoLogoHTML,
  buildCustomProviderVideoMenuGroups,
  buildDreaminaOfficialVideoMenuItems,
  buildDreaminaVideoLogoHTML,
  buildRhAiAppVideoMenuItems,
  buildRunningHubVideoModelApiMenuItems,
  buildRunningHubVideoWorkflowMenuItems,
  buildVolcengineOfficialVideoMenuItems,
  buildVolcengineVideoLogoHTML,
  getComfyUiVideoWorkflowIconHtml,
  getDefaultRunningHubVideoWorkflowModelId,
} from './parameterPanelModelHelpers.js';
import { isModelAllowed } from '../../modules/subscriptionAccess.js';
import { bindNodeModelMenuPrewarm, bindNodeSubmenus } from '../shared/nodeFooterControls.js';
export const BINGHUO_VIDEO_GATE_MODEL_ID = 'feature/binghuo_video';
export function isBinghuoVideoChannelVisible(options = {}) {
  return isModelAllowed(BINGHUO_VIDEO_GATE_MODEL_ID, options, 'binghuo');
}
export function buildVideoModelMenuHTML({
  activeModel: activeModel = '',
  provider: provider = '',
  subscriptionState: subscriptionState = {},
  allowedModelIds: allowedModelIds = [],
  runningHubWorkflowAllowedModelIds: runningHubWorkflowAllowedModelIds = [],
} = {}) {
  const allowedModelIds2 = [
      ...new Set(
        (Array['isArray'](allowedModelIds) ? allowedModelIds : [])
          ['map']((value) => String(value || '')['trim']())
          ['filter'](Boolean),
      ),
    ],
    activeModel2 = allowedModelIds2['includes'](String(activeModel || '')['trim']())
      ? String(activeModel || '')['trim']()
      : allowedModelIds2[0x0] ||
        String(activeModel || '')['trim']() ||
        getDefaultRunningHubVideoWorkflowModelId(),
    itemsHtml = buildBinghuoVideoMenuItemsHtml(activeModel2);
  if (allowedModelIds2['length']) {
    const list = allowedModelIds2['map']((item) => getModelManifest(item))['filter'](
        (key) => key?.['kind'] === 'video',
      ),
      label = list['every'](
        (index) => index['provider'] === 'runninghubwf' && index['adapterType'] === 'workflow',
      ),
      result = list['every'](
        (enabled) =>
          (['dreamina', 'volcengine', 'apimart']['includes'](enabled?.['provider']) &&
            !!enabled?.['extensions']?.['dreaminaStyleVideo']) ||
          (enabled?.['provider'] === 'runninghub' &&
            enabled?.['adapterType'] === 'modelApi' &&
            enabled?.['extensions']?.['videoMenu']?.['role'] === 'runninghubModel'),
      );
    if (result) {
      const map = new Set(list['map']((data) => data['provider'])),
        itemsHtml2 = buildApimartVideoMenuItemsHtml(activeModel2, provider, {
          allowedModelIds: allowedModelIds2,
        }),
        itemsHtml3 = buildRunningHubVideoModelApiMenuItems(activeModel2, {
          allowedModelIds: allowedModelIds2,
        }),
        active = getModelManifest(activeModel2);
      return renderNodeModelMenu({
        kind: 'video',
        activeModel: activeModel2,
        items: [
          ...(map['has']('dreamina')
            ? buildDreaminaOfficialVideoMenuItems()['map']((args) => ({
                ...args,
                active:
                  active?.['provider'] === 'dreamina' && !!active?.['extensions']?.['dreaminaStyleVideo'],
              }))
            : []),
          ...(map['has']('volcengine') ? buildVolcengineOfficialVideoMenuItems(activeModel2, provider) : []),
        ],
        groups: [
          ...(itemsHtml2
            ? [
                {
                  id: 'apimart-video',
                  headerClass: 'apimart-video-group-header',
                  submenuClass: 'apimart-video-submenu',
                  toggleAttr: 'data-apimart-video-toggle',
                  label: 'APIMart',
                  subtitle: '视频生成模型',
                  iconHtml: buildApimartVideoLogoHTML(0x14),
                  itemsHtml: itemsHtml2,
                },
              ]
            : []),
          ...(itemsHtml3
            ? [
                {
                  id: 'runninghub-model',
                  label: 'RunningHub模型',
                  subtitle: '标准模型 API',
                  icon: 'images/RH.png',
                  iconAlt: 'runninghub',
                  itemsHtml: itemsHtml3,
                },
              ]
            : []),
        ],
      });
    }
    const items = list['map']((modelId) => ({
      modelId: modelId['modelId'],
      provider: modelId['provider'] || 'runninghubwf',
      label: modelId['displayName'] || modelId['modelId'],
      description: modelId['description'] || '',
      icon: modelId['icon'] || (label ? 'images/RH.png' : ''),
      iconAlt: modelId['provider'] || 'video',
      vip: modelId['vip'] === !![],
    }));
    return renderNodeModelMenu({
      kind: 'video',
      activeModel: activeModel2,
      groups: [
        {
          id: 'runninghub',
          label: label ? 'RunningHUB工作流' : '可用视频模型',
          subtitle: '当前场景可选',
          icon: label ? 'images/RH.png' : '',
          iconAlt: label ? 'runninghub' : 'video',
          items: items,
        },
      ],
    });
  }
  const itemsHtml4 = buildRhAiAppVideoMenuItems(activeModel2, {
      allowedModelIds: runningHubWorkflowAllowedModelIds,
    }),
    itemsHtml5 = buildRunningHubVideoWorkflowMenuItems(activeModel2, {
      allowedModelIds: runningHubWorkflowAllowedModelIds,
    });
  return renderNodeModelMenu({
    kind: 'video',
    activeModel: activeModel2,
    items: [
      ...buildDreaminaOfficialVideoMenuItems(),
      ...buildVolcengineOfficialVideoMenuItems(activeModel2, provider),
    ],
    groups: [
      {
        id: 'grsai-video',
        label: 'GRSAI',
        subtitle: '视频生成模型',
        icon: 'images/grsai.png',
        items: getModelsByKind('video')
          ['filter']((target) => target['provider'] === 'grsai')
          ['map']((modelId2) => ({
            modelId: modelId2['modelId'],
            provider: modelId2['provider'],
            label: modelId2['displayName'],
            description: modelId2['description'],
            icon: modelId2['icon'],
          })),
      },
      {
        id: 'bailian-video',
        label: '阿里云百炼',
        subtitle: '官方视频生成',
        icon: 'images/qwen.svg',
        items: getModelsByKind('video')
          ['filter']((source) => source['provider'] === 'bailian')
          ['map']((modelId3) => ({
            modelId: modelId3['modelId'],
            provider: modelId3['provider'],
            label: modelId3['displayName'],
            description: modelId3['description'],
            icon: modelId3['icon'],
          })),
      },
      {
        id: 'minimax-video',
        headerClass: 'minimax-video-group-header',
        submenuClass: 'minimax-video-submenu',
        toggleAttr: 'data-minimax-video-toggle',
        label: 'MiniMAX官方',
        subtitle: '视频生成模型',
        iconHtml: buildMinimaxVideoLogoHTML(0x14),
        itemsHtml: buildMinimaxVideoMenuItemsHtml(activeModel2),
      },
      {
        id: 'apimart-video',
        headerClass: 'apimart-video-group-header',
        submenuClass: 'apimart-video-submenu',
        toggleAttr: 'data-apimart-video-toggle',
        label: 'APIMart',
        subtitle: '视频生成模型',
        iconHtml: buildApimartVideoLogoHTML(0x14),
        itemsHtml: buildApimartVideoMenuItemsHtml(activeModel2, provider),
      },
      {
        id: 'agnes-video',
        headerClass: 'agnes-video-group-header',
        submenuClass: 'agnes-video-submenu',
        toggleAttr: 'data-agnes-video-toggle',
        label: 'Agnes\x20AI',
        subtitle: 'Video\x20model\x20API',
        iconHtml: buildAgnesVideoLogoHTML(0x14),
        itemsHtml: buildAgnesVideoMenuItemsHtml(activeModel2),
      },
      ...(isBinghuoVideoChannelVisible(subscriptionState) && itemsHtml
        ? [
            {
              id: 'binghuo-video',
              headerClass: 'binghuo-video-group-header',
              submenuClass: 'binghuo-video-submenu',
              toggleAttr: 'data-binghuo-video-toggle',
              label: '便宜渠道bh',
              subtitle: '授权用户专属视频模型',
              iconHtml: buildBinghuoVideoLogoHTML(0x14),
              itemsHtml: itemsHtml,
            },
          ]
        : []),
      ...(itemsHtml4
        ? [
            {
              id: 'rh-ai-app',
              label: 'RH AI应用',
              subtitle: '自定义\x20RunningHub\x20AI\x20App',
              icon: 'images/RH.png',
              iconAlt: 'runninghub',
              itemsHtml: itemsHtml4,
            },
          ]
        : []),
      ...buildCustomProviderVideoMenuGroups(activeModel2),
      ...buildComfyUiVideoWorkflowMenuGroups(activeModel2),
      ...(itemsHtml5
        ? [
            {
              id: 'runninghub',
              label: 'RunningHUB工作流',
              subtitle: 'AI 工作流',
              icon: 'images/RH.png',
              iconAlt: 'runninghub',
              itemsHtml: itemsHtml5,
            },
          ]
        : []),
      {
        id: 'runninghub-model',
        label: 'RunningHub模型',
        subtitle: '标准模型\x20API',
        icon: 'images/RH.png',
        iconAlt: 'runninghub',
        itemsHtml: buildRunningHubVideoModelApiMenuItems(activeModel2),
      },
    ],
  });
}
export function bindLazyVideoModelMenu({
  trigger: trigger,
  menu: menu,
  getActiveModel: getActiveModel,
  renderMenuHtml: renderMenuHtml,
  onPrepared: onPrepared,
  documentObject: documentObject = globalThis['document'],
} = {}) {
  let bindNodeSubmenus2 = null;
  const run = () => {
      if (!menu || typeof renderMenuHtml !== 'function') return null;
      const next = String(getActiveModel?.() || '')['trim']();
      if (
        menu['dataset']['lazyMounted'] === '1' &&
        menu['dataset']['lazyModelId'] === next &&
        menu['childElementCount'] > 0x0
      )
        return menu;
      const el = documentObject?.['createElement']?.('template');
      if (!el) return null;
      el['innerHTML'] = String(renderMenuHtml(next) || '')['trim']();
      const el2 = el['content']['firstElementChild'];
      return (
        (menu['innerHTML'] = el2?.['innerHTML'] || ''),
        (menu['dataset']['lazyMounted'] = '1'),
        (menu['dataset']['lazyModelId'] = next),
        (menu['dataset']['nodeMenuKind'] = el2?.['dataset']?.['nodeMenuKind'] || 'video'),
        bindNodeSubmenus2?.(),
        (bindNodeSubmenus2 = bindNodeSubmenus(menu)),
        menu
      );
    },
    prepareNow = bindNodeModelMenuPrewarm({
      trigger: trigger,
      prepare: () => {
        const current = run();
        if (current) onPrepared?.(current);
        return current;
      },
    });
  return {
    prepareNow: prepareNow['prepareNow'],
    destroy() {
      (prepareNow['destroy'](), bindNodeSubmenus2?.(), (bindNodeSubmenus2 = null));
    },
  };
}
export function renderVideoModelTriggerIconHTML({
  model: model = '',
  provider: provider = '',
  providersMeta: providersMeta = {},
  resolveExecution: resolveExecution = (entry, providerHint) =>
    resolveModelExecution(entry, { providerHint: providerHint }) || resolveModelExecution(entry) || null,
  resolveProviderId: resolveProviderId = (record, payload, handle) =>
    normalizeProviderId(handle?.['modelManifest']?.['provider']) ||
    resolveModelProvider(record, payload, { allowPrefixInference: ![] }) ||
    '',
} = {}) {
  const execution = resolveExecution(model, provider),
    providerId = resolveProviderId(model, provider, execution);
  if (providerId === 'minimax') return buildMinimaxVideoLogoHTML(0xc);
  if (providerId === 'apimart') return buildApimartVideoLogoHTML(0xc);
  if (providerId === 'binghuo') return buildBinghuoVideoLogoHTML(0xc);
  if (providerId === 'volcengine') return buildVolcengineVideoLogoHTML(0xc);
  if (providerId === 'dreamina' || execution?.['modelManifest']?.['extensions']?.['dreaminaStyleVideo'])
    return buildDreaminaVideoLogoHTML(0xc);
  if (providerId === 'comfyui')
    return getComfyUiVideoWorkflowIconHtml(
      execution?.['modelManifest']?.['extensions']?.['videoMenu'] || {},
      0xc,
    );
  if (providerId && /^custom_[a-z0-9_-]+$/i['test'](providerId))
    return buildCustomProviderVideoLogoHTML(execution?.['modelManifest'] || {}, 0xc);
  const state = providerId ? providersMeta?.[providerId]?.['logoPath'] : null;
  if (state)
    return (
      '<img src="' +
      state +
      '\x22\x20class=\x22node-menu-icon-small\x22\x20alt=\x22' +
      providerId +
      '" loading="eager" decoding="async" fetchpriority="high" draggable="false">'
    );
  return '<div\x20class=\x22node-menu-icon-small\x20node-menu-icon-badge\x20video-model-fallback-icon\x22>VM</div>';
}
