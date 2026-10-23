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
const OFFICIAL_VIDEO_MENU_PREFIXES = ['官方热推', '正价', '官推', '官转', '白名单'];
function compareOfficialVideoMenuModels(left, right) {
  // 先按后台下发的推荐位次，再按「官方热推 > 正价 > 官推 > 官转 > 白名单」的档位。
  // 只按名字排会把「官方热推」的模型压到列表末尾，用户找不到主推的那几个。
  const rankDelta =
    Number(left.extensions?.videoMenu?.recommendationRank || 0) -
    Number(right.extensions?.videoMenu?.recommendationRank || 0);
  if (rankDelta) return rankDelta;
  const tierOf = (model) => {
    const tier = OFFICIAL_VIDEO_MENU_PREFIXES.findIndex((prefix) =>
      String(model.displayName || '').startsWith(prefix)
    );
    return tier < 0 ? OFFICIAL_VIDEO_MENU_PREFIXES.length : tier;
  };
  return tierOf(left) - tierOf(right);
}
function buildDreaminaVideoMenuGroups(models) {
  const dreaminaModels = (Array.isArray(models) ? models : []).filter(
    (model) => model.provider === 'dreamina'
  );
  return dreaminaModels.length
    ? [
        {
          id: 'dreamina-canvas-video',
          label: '即梦官方',
          subtitle: '使用即梦账号生成',
          iconHtml: buildDreaminaVideoLogoHTML(20),
          items: dreaminaModels.map((model) => ({
            modelId: model.modelId,
            provider: model.provider,
            label: model.displayName,
            iconHtml: buildDreaminaVideoLogoHTML(20),
          })),
        },
      ]
    : [];
}
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
        (Array.isArray(allowedModelIds) ? allowedModelIds : [])
          .map((value) => String(value || '').trim())
          .filter(Boolean)
      ),
    ],
    activeModel2 = allowedModelIds2.includes(String(activeModel || '').trim())
      ? String(activeModel || '').trim()
      : allowedModelIds2[0] ||
        String(activeModel || '').trim() ||
        getDefaultRunningHubVideoWorkflowModelId(),
    itemsHtml = buildBinghuoVideoMenuItemsHtml(activeModel2);
  if (allowedModelIds2.length) {
    const list = allowedModelIds2
        .map((item) => getModelManifest(item))
        .filter((key) => key?.kind === 'video'),
      label = list.every(
        (index) => index.provider === 'runninghubwf' && index.adapterType === 'workflow'
      ),
      result = list.every(
        (enabled) =>
          (['dreamina', 'volcengine', 'apimart'].includes(enabled?.provider) &&
            !!enabled?.extensions?.dreaminaStyleVideo) ||
          (enabled?.provider === 'runninghub' &&
            enabled?.adapterType === 'modelApi' &&
            enabled?.extensions?.videoMenu?.role === 'runninghubModel')
      );
    if (result) {
      const map = new Set(list.map((data) => data.provider)),
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
          ...(map.has('dreamina')
            ? buildDreaminaOfficialVideoMenuItems().map((args) => ({
                ...args,
                active: active?.provider === 'dreamina' && !!active?.extensions?.dreaminaStyleVideo,
              }))
            : []),
          ...(map.has('volcengine')
            ? buildVolcengineOfficialVideoMenuItems(activeModel2, provider)
            : []),
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
                  iconHtml: buildApimartVideoLogoHTML(20),
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
    const items = list.map((modelId) => ({
      modelId: modelId.modelId,
      provider: modelId.provider || 'runninghubwf',
      label: modelId.displayName || modelId.modelId,
      description: modelId.description || '',
      icon: modelId.icon || (label ? 'images/RH.png' : ''),
      iconAlt: modelId.provider || 'video',
      vip: modelId.vip === true,
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
    // 这里列的是官方目录（含即梦/小云雀/官方模型），标记出来供样式与埋点区分。
    officialCatalog: true,
    activeModel: activeModel2,
    items: [
      ...buildDreaminaOfficialVideoMenuItems(),
      ...buildVolcengineOfficialVideoMenuItems(activeModel2, provider),
    ],
    groups: [
      ...buildDreaminaVideoMenuGroups(getModelsByKind('video')),
      ...(() => {
        const pippitModels = getModelsByKind('video').filter(
          (target) => target.provider === 'pippit'
        );
        return pippitModels.length
          ? [
              {
                id: 'pippit-video',
                label: '小云雀',
                subtitle: '使用小云雀账号生成',
                items: pippitModels.map((model) => ({
                  modelId: model.modelId,
                  provider: model.provider,
                  label: model.displayName,
                })),
              },
            ]
          : [];
      })(),
      ...(() => {
        const officialModels = getModelsByKind('video')
          .filter(
            (target) =>
              target.provider === 'aicanvas' &&
              target.extensions?.videoMenu?.role === 'officialModel'
          )
          .sort(compareOfficialVideoMenuModels);
        return officialModels.length
          ? [
              {
                id: 'aicanvas-video',
                label: 'SHUO Canvas',
                subtitle: '官方模型·消耗积分',
                icon: 'images/favicon.svg',
                items: officialModels.map((model) => ({
                  modelId: model.modelId,
                  provider: model.provider,
                  label: model.displayName,
                  description: model.description,
                  icon: 'images/favicon.svg',
                })),
              },
            ]
          : [];
      })(),
      {
        id: 'grsai-video',
        label: 'GRSAI',
        subtitle: '视频生成模型',
        icon: 'images/grsai.png',
        items: getModelsByKind('video')
          .filter((target) => target.provider === 'grsai')
          .map((modelId2) => ({
            modelId: modelId2.modelId,
            provider: modelId2.provider,
            label: modelId2.displayName,
            description: modelId2.description,
            icon: modelId2.icon,
          })),
      },
      {
        id: 'bailian-video',
        label: '阿里云百炼',
        subtitle: '官方视频生成',
        icon: 'images/qwen.svg',
        items: getModelsByKind('video')
          .filter((source) => source.provider === 'bailian')
          .map((modelId3) => ({
            modelId: modelId3.modelId,
            provider: modelId3.provider,
            label: modelId3.displayName,
            description: modelId3.description,
            icon: modelId3.icon,
          })),
      },
      {
        id: 'minimax-video',
        headerClass: 'minimax-video-group-header',
        submenuClass: 'minimax-video-submenu',
        toggleAttr: 'data-minimax-video-toggle',
        label: 'MiniMAX官方',
        subtitle: '视频生成模型',
        iconHtml: buildMinimaxVideoLogoHTML(20),
        itemsHtml: buildMinimaxVideoMenuItemsHtml(activeModel2),
      },
      {
        id: 'apimart-video',
        headerClass: 'apimart-video-group-header',
        submenuClass: 'apimart-video-submenu',
        toggleAttr: 'data-apimart-video-toggle',
        label: 'APIMart',
        subtitle: '视频生成模型',
        iconHtml: buildApimartVideoLogoHTML(20),
        itemsHtml: buildApimartVideoMenuItemsHtml(activeModel2, provider),
      },
      {
        id: 'agnes-video',
        headerClass: 'agnes-video-group-header',
        submenuClass: 'agnes-video-submenu',
        toggleAttr: 'data-agnes-video-toggle',
        label: 'Agnes AI',
        subtitle: 'Video model API',
        iconHtml: buildAgnesVideoLogoHTML(20),
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
              iconHtml: buildBinghuoVideoLogoHTML(20),
              itemsHtml: itemsHtml,
            },
          ]
        : []),
      ...(itemsHtml4
        ? [
            {
              id: 'rh-ai-app',
              label: 'RH AI应用',
              subtitle: '自定义 RunningHub AI App',
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
        subtitle: '标准模型 API',
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
  documentObject: documentObject = globalThis.document,
} = {}) {
  let bindNodeSubmenus2 = null;
  const run = () => {
      if (!menu || typeof renderMenuHtml !== 'function') return null;
      const next = String(getActiveModel?.() || '').trim();
      if (
        menu.dataset.lazyMounted === '1' &&
        menu.dataset.lazyModelId === next &&
        menu.childElementCount > 0
      )
        return menu;
      const el = documentObject?.createElement?.('template');
      if (!el) return null;
      el.innerHTML = String(renderMenuHtml(next) || '').trim();
      const el2 = el.content.firstElementChild;
      return (
        (menu.innerHTML = el2?.innerHTML || ''),
        (menu.dataset.lazyMounted = '1'),
        (menu.dataset.lazyModelId = next),
        (menu.dataset.nodeMenuKind = el2?.dataset?.nodeMenuKind || 'video'),
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
    prepareNow: prepareNow.prepareNow,
    destroy() {
      (prepareNow.destroy(), bindNodeSubmenus2?.(), (bindNodeSubmenus2 = null));
    },
  };
}
export function renderVideoModelTriggerIconHTML({
  model: model = '',
  provider: provider = '',
  providersMeta: providersMeta = {},
  resolveExecution: resolveExecution = (entry, providerHint) =>
    resolveModelExecution(entry, { providerHint: providerHint }) ||
    resolveModelExecution(entry) ||
    null,
  resolveProviderId: resolveProviderId = (record, payload, handle) =>
    normalizeProviderId(handle?.modelManifest?.provider) ||
    resolveModelProvider(record, payload, { allowPrefixInference: false }) ||
    '',
} = {}) {
  const execution = resolveExecution(model, provider),
    providerId = resolveProviderId(model, provider, execution);
  if (providerId === 'minimax') return buildMinimaxVideoLogoHTML(12);
  if (providerId === 'apimart') return buildApimartVideoLogoHTML(12);
  if (providerId === 'binghuo') return buildBinghuoVideoLogoHTML(12);
  if (providerId === 'volcengine') return buildVolcengineVideoLogoHTML(12);
  if (providerId === 'dreamina' || execution?.modelManifest?.extensions?.dreaminaStyleVideo)
    return buildDreaminaVideoLogoHTML(12);
  if (providerId === 'comfyui')
    return getComfyUiVideoWorkflowIconHtml(
      execution?.modelManifest?.extensions?.videoMenu || {},
      12
    );
  if (providerId && /^custom_[a-z0-9_-]+$/i.test(providerId))
    return buildCustomProviderVideoLogoHTML(execution?.modelManifest || {}, 12);
  const state = providerId ? providersMeta?.[providerId]?.logoPath : null;
  if (state)
    return (
      '<img src="' +
      state +
      '" class="node-menu-icon-small" alt="' +
      providerId +
      '" loading="eager" decoding="async" fetchpriority="high" draggable="false">'
    );
  return '<div class="node-menu-icon-small node-menu-icon-badge video-model-fallback-icon">VM</div>';
}

/**
 * 仅供单测驱动内部纯函数（官方模型排序、即梦分组）。
 * 运行时不要引用：随实现改。
 */
export const _modelSelectorSharedInternalsForTest = {
  OFFICIAL_VIDEO_MENU_PREFIXES,
  compareOfficialVideoMenuModels,
  buildDreaminaVideoMenuGroups,
};
