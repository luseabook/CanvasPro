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
export function isBinghuoVideoChannelVisible(_0x171951 = {}) {
  return isModelAllowed(BINGHUO_VIDEO_GATE_MODEL_ID, _0x171951, 'binghuo');
}
export function buildVideoModelMenuHTML({
  activeModel: activeModel = '',
  provider: provider = '',
  subscriptionState: subscriptionState = {},
  allowedModelIds: allowedModelIds = [],
  runningHubWorkflowAllowedModelIds: runningHubWorkflowAllowedModelIds = [],
} = {}) {
  const _0x30d671 = [
      ...new Set(
        (Array['isArray'](allowedModelIds) ? allowedModelIds : [])
          ['map']((_0x2f4e26) => String(_0x2f4e26 || '')['trim']())
          ['filter'](Boolean),
      ),
    ],
    _0x2abb9f = _0x30d671['includes'](String(activeModel || '')['trim']())
      ? String(activeModel || '')['trim']()
      : _0x30d671[0x0] || String(activeModel || '')['trim']() || getDefaultRunningHubVideoWorkflowModelId(),
    _0x3bd183 = buildBinghuoVideoMenuItemsHtml(_0x2abb9f);
  if (_0x30d671['length']) {
    const _0x19d827 = _0x30d671['map']((_0x40b25b) => getModelManifest(_0x40b25b))['filter'](
        (_0x3eaa11) => _0x3eaa11?.['kind'] === 'video',
      ),
      _0x349d9d = _0x19d827['every'](
        (_0x9fd639) => _0x9fd639['provider'] === 'runninghubwf' && _0x9fd639['adapterType'] === 'workflow',
      ),
      _0x9df27d = _0x19d827['every'](
        (_0x497e51) =>
          (['dreamina', 'volcengine', 'apimart']['includes'](_0x497e51?.['provider']) &&
            !!_0x497e51?.['extensions']?.['dreaminaStyleVideo']) ||
          (_0x497e51?.['provider'] === 'runninghub' &&
            _0x497e51?.['adapterType'] === 'modelApi' &&
            _0x497e51?.['extensions']?.['videoMenu']?.['role'] === 'runninghubModel'),
      );
    if (_0x9df27d) {
      const _0xe19657 = new Set(_0x19d827['map']((_0x2c0b20) => _0x2c0b20['provider'])),
        _0x59b8b2 = buildApimartVideoMenuItemsHtml(_0x2abb9f, provider, { allowedModelIds: _0x30d671 }),
        _0x2a71a7 = buildRunningHubVideoModelApiMenuItems(_0x2abb9f, { allowedModelIds: _0x30d671 }),
        _0x3020cb = getModelManifest(_0x2abb9f);
      return renderNodeModelMenu({
        kind: 'video',
        activeModel: _0x2abb9f,
        items: [
          ...(_0xe19657['has']('dreamina')
            ? buildDreaminaOfficialVideoMenuItems()['map']((_0x34d4fe) => ({
                ..._0x34d4fe,
                active:
                  _0x3020cb?.['provider'] === 'dreamina' &&
                  !!_0x3020cb?.['extensions']?.['dreaminaStyleVideo'],
              }))
            : []),
          ...(_0xe19657['has']('volcengine')
            ? buildVolcengineOfficialVideoMenuItems(_0x2abb9f, provider)
            : []),
        ],
        groups: [
          ...(_0x59b8b2
            ? [
                {
                  id: 'apimart-video',
                  headerClass: 'apimart-video-group-header',
                  submenuClass: 'apimart-video-submenu',
                  toggleAttr: 'data-apimart-video-toggle',
                  label: 'APIMart',
                  subtitle: '视频生成模型',
                  iconHtml: buildApimartVideoLogoHTML(0x14),
                  itemsHtml: _0x59b8b2,
                },
              ]
            : []),
          ...(_0x2a71a7
            ? [
                {
                  id: 'runninghub-model',
                  label: 'RunningHub模型',
                  subtitle: '标准模型 API',
                  icon: 'images/RH.png',
                  iconAlt: 'runninghub',
                  itemsHtml: _0x2a71a7,
                },
              ]
            : []),
        ],
      });
    }
    const _0x3a2f16 = _0x19d827['map']((_0x2f8449) => ({
      modelId: _0x2f8449['modelId'],
      provider: _0x2f8449['provider'] || 'runninghubwf',
      label: _0x2f8449['displayName'] || _0x2f8449['modelId'],
      description: _0x2f8449['description'] || '',
      icon: _0x2f8449['icon'] || (_0x349d9d ? 'images/RH.png' : ''),
      iconAlt: _0x2f8449['provider'] || 'video',
      vip: _0x2f8449['vip'] === !![],
    }));
    return renderNodeModelMenu({
      kind: 'video',
      activeModel: _0x2abb9f,
      groups: [
        {
          id: 'runninghub',
          label: _0x349d9d ? 'RunningHUB工作流' : '可用视频模型',
          subtitle: '当前场景可选',
          icon: _0x349d9d ? 'images/RH.png' : '',
          iconAlt: _0x349d9d ? 'runninghub' : 'video',
          items: _0x3a2f16,
        },
      ],
    });
  }
  const _0x28a7ea = buildRhAiAppVideoMenuItems(_0x2abb9f, {
      allowedModelIds: runningHubWorkflowAllowedModelIds,
    }),
    _0x3da75d = buildRunningHubVideoWorkflowMenuItems(_0x2abb9f, {
      allowedModelIds: runningHubWorkflowAllowedModelIds,
    });
  return renderNodeModelMenu({
    kind: 'video',
    activeModel: _0x2abb9f,
    items: [
      ...buildDreaminaOfficialVideoMenuItems(),
      ...buildVolcengineOfficialVideoMenuItems(_0x2abb9f, provider),
    ],
    groups: [
      {
        id: 'grsai-video',
        label: 'GRSAI',
        subtitle: '视频生成模型',
        icon: 'images/grsai.png',
        items: getModelsByKind('video')
          ['filter']((_0x43491f) => _0x43491f['provider'] === 'grsai')
          ['map']((_0x17f44e) => ({
            modelId: _0x17f44e['modelId'],
            provider: _0x17f44e['provider'],
            label: _0x17f44e['displayName'],
            description: _0x17f44e['description'],
            icon: _0x17f44e['icon'],
          })),
      },
      {
        id: 'bailian-video',
        label: '阿里云百炼',
        subtitle: '官方视频生成',
        icon: 'images/qwen.svg',
        items: getModelsByKind('video')
          ['filter']((_0x583613) => _0x583613['provider'] === 'bailian')
          ['map']((_0x2aa0fb) => ({
            modelId: _0x2aa0fb['modelId'],
            provider: _0x2aa0fb['provider'],
            label: _0x2aa0fb['displayName'],
            description: _0x2aa0fb['description'],
            icon: _0x2aa0fb['icon'],
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
        itemsHtml: buildMinimaxVideoMenuItemsHtml(_0x2abb9f),
      },
      {
        id: 'apimart-video',
        headerClass: 'apimart-video-group-header',
        submenuClass: 'apimart-video-submenu',
        toggleAttr: 'data-apimart-video-toggle',
        label: 'APIMart',
        subtitle: '视频生成模型',
        iconHtml: buildApimartVideoLogoHTML(0x14),
        itemsHtml: buildApimartVideoMenuItemsHtml(_0x2abb9f, provider),
      },
      {
        id: 'agnes-video',
        headerClass: 'agnes-video-group-header',
        submenuClass: 'agnes-video-submenu',
        toggleAttr: 'data-agnes-video-toggle',
        label: 'Agnes\x20AI',
        subtitle: 'Video\x20model\x20API',
        iconHtml: buildAgnesVideoLogoHTML(0x14),
        itemsHtml: buildAgnesVideoMenuItemsHtml(_0x2abb9f),
      },
      ...(isBinghuoVideoChannelVisible(subscriptionState) && _0x3bd183
        ? [
            {
              id: 'binghuo-video',
              headerClass: 'binghuo-video-group-header',
              submenuClass: 'binghuo-video-submenu',
              toggleAttr: 'data-binghuo-video-toggle',
              label: '便宜渠道bh',
              subtitle: '授权用户专属视频模型',
              iconHtml: buildBinghuoVideoLogoHTML(0x14),
              itemsHtml: _0x3bd183,
            },
          ]
        : []),
      ...(_0x28a7ea
        ? [
            {
              id: 'rh-ai-app',
              label: 'RH AI应用',
              subtitle: '自定义\x20RunningHub\x20AI\x20App',
              icon: 'images/RH.png',
              iconAlt: 'runninghub',
              itemsHtml: _0x28a7ea,
            },
          ]
        : []),
      ...buildCustomProviderVideoMenuGroups(_0x2abb9f),
      ...buildComfyUiVideoWorkflowMenuGroups(_0x2abb9f),
      ...(_0x3da75d
        ? [
            {
              id: 'runninghub',
              label: 'RunningHUB工作流',
              subtitle: 'AI 工作流',
              icon: 'images/RH.png',
              iconAlt: 'runninghub',
              itemsHtml: _0x3da75d,
            },
          ]
        : []),
      {
        id: 'runninghub-model',
        label: 'RunningHub模型',
        subtitle: '标准模型\x20API',
        icon: 'images/RH.png',
        iconAlt: 'runninghub',
        itemsHtml: buildRunningHubVideoModelApiMenuItems(_0x2abb9f),
      },
    ],
  });
}
export function bindLazyVideoModelMenu({
  trigger: _0x4a2387,
  menu: _0x1da858,
  getActiveModel: _0x3f3878,
  renderMenuHtml: _0x10d361,
  onPrepared: _0x9c1bb,
  documentObject: documentObject = globalThis['document'],
} = {}) {
  let _0x3f6c1b = null;
  const _0x19d8e4 = () => {
      if (!_0x1da858 || typeof _0x10d361 !== 'function') return null;
      const _0x3ed896 = String(_0x3f3878?.() || '')['trim']();
      if (
        _0x1da858['dataset']['lazyMounted'] === '1' &&
        _0x1da858['dataset']['lazyModelId'] === _0x3ed896 &&
        _0x1da858['childElementCount'] > 0x0
      )
        return _0x1da858;
      const _0x4885a9 = documentObject?.['createElement']?.('template');
      if (!_0x4885a9) return null;
      _0x4885a9['innerHTML'] = String(_0x10d361(_0x3ed896) || '')['trim']();
      const _0x3c3736 = _0x4885a9['content']['firstElementChild'];
      return (
        (_0x1da858['innerHTML'] = _0x3c3736?.['innerHTML'] || ''),
        (_0x1da858['dataset']['lazyMounted'] = '1'),
        (_0x1da858['dataset']['lazyModelId'] = _0x3ed896),
        (_0x1da858['dataset']['nodeMenuKind'] = _0x3c3736?.['dataset']?.['nodeMenuKind'] || 'video'),
        _0x3f6c1b?.(),
        (_0x3f6c1b = bindNodeSubmenus(_0x1da858)),
        _0x1da858
      );
    },
    _0x4e40e9 = bindNodeModelMenuPrewarm({
      trigger: _0x4a2387,
      prepare: () => {
        const _0x1c1479 = _0x19d8e4();
        if (_0x1c1479) _0x9c1bb?.(_0x1c1479);
        return _0x1c1479;
      },
    });
  return {
    prepareNow: _0x4e40e9['prepareNow'],
    destroy() {
      (_0x4e40e9['destroy'](), _0x3f6c1b?.(), (_0x3f6c1b = null));
    },
  };
}
export function renderVideoModelTriggerIconHTML({
  model: model = '',
  provider: provider = '',
  providersMeta: providersMeta = {},
  resolveExecution: resolveExecution = (_0x4ef6dc, _0x2a1608) =>
    resolveModelExecution(_0x4ef6dc, { providerHint: _0x2a1608 }) || resolveModelExecution(_0x4ef6dc) || null,
  resolveProviderId: resolveProviderId = (_0x40543c, _0x2bb699, _0x18410e) =>
    normalizeProviderId(_0x18410e?.['modelManifest']?.['provider']) ||
    resolveModelProvider(_0x40543c, _0x2bb699, { allowPrefixInference: ![] }) ||
    '',
} = {}) {
  const _0x1beb94 = resolveExecution(model, provider),
    _0x43aad0 = resolveProviderId(model, provider, _0x1beb94);
  if (_0x43aad0 === 'minimax') return buildMinimaxVideoLogoHTML(0xc);
  if (_0x43aad0 === 'apimart') return buildApimartVideoLogoHTML(0xc);
  if (_0x43aad0 === 'binghuo') return buildBinghuoVideoLogoHTML(0xc);
  if (_0x43aad0 === 'volcengine') return buildVolcengineVideoLogoHTML(0xc);
  if (_0x43aad0 === 'dreamina' || _0x1beb94?.['modelManifest']?.['extensions']?.['dreaminaStyleVideo'])
    return buildDreaminaVideoLogoHTML(0xc);
  if (_0x43aad0 === 'comfyui')
    return getComfyUiVideoWorkflowIconHtml(
      _0x1beb94?.['modelManifest']?.['extensions']?.['videoMenu'] || {},
      0xc,
    );
  if (_0x43aad0 && /^custom_[a-z0-9_-]+$/i['test'](_0x43aad0))
    return buildCustomProviderVideoLogoHTML(_0x1beb94?.['modelManifest'] || {}, 0xc);
  const _0x343afa = _0x43aad0 ? providersMeta?.[_0x43aad0]?.['logoPath'] : null;
  if (_0x343afa)
    return (
      '<img src="' +
      _0x343afa +
      '\x22\x20class=\x22node-menu-icon-small\x22\x20alt=\x22' +
      _0x43aad0 +
      '" loading="eager" decoding="async" fetchpriority="high" draggable="false">'
    );
  return '<div\x20class=\x22node-menu-icon-small\x20node-menu-icon-badge\x20video-model-fallback-icon\x22>VM</div>';
}
