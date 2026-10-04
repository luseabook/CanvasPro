import {
  renderComfyUiCloudWorkflowLogoHtml,
  renderComfyUiLocalWorkflowLogoHtml,
  renderComfyUiWorkflowLogoHtmlFromIconKind,
} from '../shared/customAiAppLogo.js';
import { buildModelProviderProfileBadgesHtml } from '../shared/modelProviderProfileControl.js';
import { getModelManifest, getModelsByKind } from '../../manifests/index.js';
import {
  APIMART_DREAMINA_VIDEO_DEFAULT_MODEL,
  resolveDreaminaStyleVideoProvider,
  isApimartDreaminaVideoModel,
} from '../../modules/dreaminaVideoModelHelper.js';
import { renderNodeMenuItem } from '../shared/nodeModelMenu.js';
import { translateManifestText } from '../../i18n/manifestText.js';
export const RH_VIDEO_RESOLUTION_OPTIONS = Object.freeze([0x340, 0x400, 0x500, 0x5a0, 0x640, 0x6e0, 0x780]);
const RH_STANDARD_FPS_OPTIONS = Object.freeze([16, 24]),
  RH_V54_FPS_OPTIONS = Object.freeze([16, 24, 30]),
  RH_MIN_VIDEO_RESOLUTION = 0x340;
export function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
export function buildRunningHubVideoWorkflowMenuItems(activeModel) {
  const list = getModelsByKind('video').filter(
    (enabled) =>
      enabled?.provider === 'runninghubwf' &&
      enabled?.adapterType === 'workflow' &&
      !(enabled?.uiPlacement?.includes('toolbar') && !enabled?.uiPlacement?.includes('modelMenu')),
  );
  return list
    .map((modelId) => {
      return renderNodeMenuItem(
        {
          modelId: modelId.modelId,
          provider: modelId.provider || 'runninghubwf',
          label: modelId.displayName,
          description: modelId.description || '',
          icon: modelId.icon || 'images/RH.png',
          iconAlt: 'runninghub',
          vip: modelId.vip === true,
        },
        { activeModel: activeModel },
      );
    })
    .join('');
}
export function buildRunningHubVideoModelApiMenuItems(activeModel2) {
  const list2 = getModelsByKind('video')
    .filter((enabled2) => {
      if (enabled2?.provider !== 'runninghub') return false;
      if (enabled2?.adapterType !== 'modelApi') return false;
      if (enabled2?.uiPlacement?.includes('toolbar') && !enabled2?.uiPlacement?.includes('modelMenu'))
        return false;
      return getManifestVideoMenu(enabled2)?.role === 'runninghubModel';
    })
    .sort(
      (item, key) =>
        Number(getManifestVideoMenu(item)?.order || 0) - Number(getManifestVideoMenu(key)?.order || 0),
    );
  return list2
    .map((modelId2) =>
      renderNodeMenuItem(
        {
          modelId: modelId2.modelId,
          provider: modelId2.provider || 'runninghub',
          label: getManifestVideoMenu(modelId2)?.label || modelId2.displayName,
          description: getManifestVideoMenu(modelId2)?.subtitle || modelId2.description || '',
          icon: modelId2.icon || 'images/RH.png',
          iconAlt: 'runninghub',
          vip: modelId2.vip === true,
        },
        { activeModel: activeModel2 },
      ),
    )
    .join('');
}
export function getDefaultRunningHubVideoWorkflowModelId() {
  return (
    getModelsByKind('video').find(
      (enabled3) =>
        enabled3?.provider === 'runninghubwf' &&
        enabled3?.adapterType === 'workflow' &&
        !(enabled3?.uiPlacement?.includes('toolbar') && !enabled3?.uiPlacement?.includes('modelMenu')),
    )?.modelId || ''
  );
}
export function buildApimartVideoLogoHTML(index = 20) {
  const count = Number(index) || 20,
    result = count <= 12 ? 'node-menu-icon-small' : 'node-menu-icon';
  return '<div class="' + result + ' node-menu-icon-badge node-menu-icon-apimart">AM</div>';
}
export function buildAgnesVideoLogoHTML(data = 20) {
  const count2 = Number(data) || 20,
    options = count2 <= 12 ? 'node-menu-icon-small' : 'node-menu-icon';
  return '<div class="' + options + ' node-menu-icon-badge node-menu-icon-badge-dark">AG</div>';
}
export function buildDreaminaVideoLogoHTML(target = 20) {
  const count3 = Number(target) || 20;
  if (count3 <= 12)
    return '<img src="images/jimeng.png" class="image-model-trigger-icon image-model-trigger-icon-dreamina" alt="dreamina">';
  return '<img src="images/jimeng.png" class="node-menu-icon" alt="dreamina">';
}
export function buildVolcengineVideoLogoHTML(source = 20) {
  const count4 = Number(source) || 20,
    next = count4 <= 12 ? 'node-menu-icon-small' : 'node-menu-icon';
  return '<img src="images/volcengine.svg" class="' + next + '" alt="volcengine">';
}
function getManifestVideoMenu(current) {
  return current?.extensions?.videoMenu || null;
}
function getManifestDreaminaStyleVideo(entry) {
  return entry?.extensions?.dreaminaStyleVideo || null;
}
function getVideoManifestByMenuRole(record) {
  return (
    getModelsByKind('video')
      .filter((item2) => getManifestVideoMenu(item2)?.role === record)
      .sort(
        (item3, payload) =>
          Number(getManifestVideoMenu(item3)?.order || 0) - Number(getManifestVideoMenu(payload)?.order || 0),
      )[0] || null
  );
}
function getApimartVideoModelMenuManifests() {
  return getModelsByKind('video')
    .filter((item4) => {
      if (item4?.provider !== 'apimart') return false;
      if (item4?.adapterType !== 'modelApi') return false;
      return getManifestVideoMenu(item4)?.role === 'apimartModel';
    })
    .sort(
      (item5, handle) =>
        Number(getManifestVideoMenu(item5)?.order || 0) - Number(getManifestVideoMenu(handle)?.order || 0),
    );
}
function getAgnesVideoModelMenuManifests() {
  return getModelsByKind('video')
    .filter((item6) => {
      if (item6?.provider !== 'agnes') return false;
      if (item6?.adapterType !== 'modelApi') return false;
      return getManifestVideoMenu(item6)?.role === 'agnesModel';
    })
    .sort(
      (item7, state) =>
        Number(getManifestVideoMenu(item7)?.order || 0) - Number(getManifestVideoMenu(state)?.order || 0),
    );
}
export function getDreaminaTaskModelMenuItems(config, scope = 'dreamina') {
  const input = String(scope || 'dreamina')
      .trim()
      .toLowerCase(),
    output = String(config || '').trim();
  return getModelsByKind('video')
    .filter((item8) => {
      if (item8?.provider !== input) return false;
      const manifestDreaminaStyleVideo = getManifestDreaminaStyleVideo(item8);
      if (!manifestDreaminaStyleVideo) return false;
      return (
        Array.isArray(manifestDreaminaStyleVideo.taskTypes) &&
        manifestDreaminaStyleVideo.taskTypes.includes(output)
      );
    })
    .sort(
      (item9, value2) =>
        Number(getManifestDreaminaStyleVideo(item9)?.order || 0) -
        Number(getManifestDreaminaStyleVideo(value2)?.order || 0),
    )
    .map((model) => {
      const manifestDreaminaStyleVideo2 = getManifestDreaminaStyleVideo(model);
      return {
        model: model.modelId,
        title: translateManifestText(manifestDreaminaStyleVideo2.title || model.displayName || model.modelId),
        subtitle: translateManifestText(
          manifestDreaminaStyleVideo2.subtitleByTaskType?.[output] ||
            manifestDreaminaStyleVideo2.subtitle ||
            model.description ||
            '',
        ),
      };
    });
}
export function getDreaminaTaskModelMenuMeta(value3, value4 = '') {
  const modelManifest = getModelManifest(value3),
    dreaminaStyleVideoProvider = resolveDreaminaStyleVideoProvider(value3, value4);
  if (!modelManifest || modelManifest.provider !== dreaminaStyleVideoProvider) return null;
  const manifestDreaminaStyleVideo3 = getManifestDreaminaStyleVideo(modelManifest);
  if (!manifestDreaminaStyleVideo3) return null;
  return {
    title: translateManifestText(
      manifestDreaminaStyleVideo3.title || modelManifest.displayName || modelManifest.modelId,
    ),
    subtitle: translateManifestText(manifestDreaminaStyleVideo3.subtitle || modelManifest.description || ''),
  };
}
export function buildDreaminaOfficialVideoMenuItems() {
  const modelId3 = getVideoManifestByMenuRole('dreaminaOfficial'),
    label = getManifestVideoMenu(modelId3);
  if (!modelId3 || !label) return [];
  return [
    {
      modelId: modelId3.modelId,
      provider: modelId3.provider,
      label: label.label || modelId3.displayName,
      subtitle: label.subtitle || modelId3.description || '',
      iconHtml: buildDreaminaVideoLogoHTML(20),
      vip: modelId3.vip === true,
    },
  ];
}
export function buildVolcengineOfficialVideoMenuItems(value5 = '', value6 = '') {
  const modelId4 = getVideoManifestByMenuRole('volcengineOfficial'),
    label2 = getManifestVideoMenu(modelId4);
  if (!modelId4 || !label2) return [];
  const active = resolveDreaminaStyleVideoProvider(value5, value6),
    modelManifest2 = getModelManifest(value5);
  return [
    {
      modelId: modelId4.modelId,
      provider: modelId4.provider,
      label: label2.label || modelId4.displayName,
      subtitle: label2.subtitle || modelId4.description || '',
      iconHtml: buildVolcengineVideoLogoHTML(20),
      active: active === 'volcengine' && !!modelManifest2?.extensions?.dreaminaStyleVideo,
      vip: modelId4.vip === true,
    },
  ];
}
export function buildApimartVideoMenuItemsHtml(activeModel3, value7) {
  const videoManifestByMenuRole = getVideoManifestByMenuRole('apimartDreaminaEntry'),
    label3 = getManifestVideoMenu(videoManifestByMenuRole),
    modelId5 = videoManifestByMenuRole?.modelId || APIMART_DREAMINA_VIDEO_DEFAULT_MODEL;
  return [
    renderNodeMenuItem({
      modelId: modelId5,
      provider: 'apimart',
      label: label3?.label || '即梦视频',
      description: label3?.subtitle || '',
      iconHtml: buildDreaminaVideoLogoHTML(20),
      active: isApimartDreaminaVideoModel(activeModel3, value7),
      attrs: { 'data-apimart-jimeng': '1' },
    }),
    ...getApimartVideoModelMenuManifests().map((modelId6) => {
      const description = getManifestVideoMenu(modelId6);
      return renderNodeMenuItem(
        {
          modelId: modelId6.modelId,
          provider: 'apimart',
          label: modelId6.displayName,
          description: description?.disabledValue
            ? modelId6.description || ''
            : description?.subtitle || modelId6.description || '',
          iconHtml: buildApimartVideoLogoHTML(20),
          vip: modelId6.vip === true,
          attrs: { 'data-apimart-video-model': '1' },
        },
        { activeModel: activeModel3 },
      );
    }),
  ].join('');
}
export function buildAgnesVideoMenuItemsHtml(activeModel4) {
  return getAgnesVideoModelMenuManifests()
    .map((modelId7) => {
      const label4 = getManifestVideoMenu(modelId7);
      return renderNodeMenuItem(
        {
          modelId: modelId7.modelId,
          provider: 'agnes',
          label: label4?.label || modelId7.displayName,
          description: label4?.subtitle || modelId7.description || '',
          iconHtml: buildAgnesVideoLogoHTML(20),
          vip: modelId7.vip === true,
        },
        { activeModel: activeModel4 },
      );
    })
    .join('');
}
export function buildDreaminaTaskModelMenuHtml(active2, value8, value9 = 'dreamina') {
  const provider = resolveDreaminaStyleVideoProvider(active2, value9),
    list3 = getDreaminaTaskModelMenuItems(value8, provider),
    iconHtml =
      provider === 'apimart'
        ? buildApimartVideoLogoHTML(20)
        : provider === 'volcengine'
          ? buildVolcengineVideoLogoHTML(20)
          : '<img src="images/jimeng.png" class="node-menu-icon" alt="dreamina">';
  if (!list3.length)
    return renderNodeMenuItem({
      label: '智能多帧',
      description: '暂未开放模型切换',
      iconHtml: iconHtml,
      disabled: true,
    });
  return list3
    .map((modelId8) =>
      renderNodeMenuItem({
        modelId: modelId8.model,
        provider: provider,
        label: modelId8.title,
        description: modelId8.subtitle,
        iconHtml: iconHtml,
        active: active2 === modelId8.model,
        attrs: { 'data-dreamina-task-model': '1' },
      }),
    )
    .join('');
}
export function getRhV54FpsOptions() {
  return RH_V54_FPS_OPTIONS;
}
export function normalizeRhStandardFps(value10) {
  const value11 = Number(value10);
  return RH_STANDARD_FPS_OPTIONS.includes(value11) ? value11 : 24;
}
export function normalizeRhV54Fps(value12) {
  const value13 = Number(value12);
  return getRhV54FpsOptions().includes(value13) ? value13 : 24;
}
export function normalizeRhVideoResolution(value14) {
  const value15 = Number(value14);
  return Number.isFinite(value15)
    ? Math.max(RH_MIN_VIDEO_RESOLUTION, Math.trunc(value15))
    : RH_MIN_VIDEO_RESOLUTION;
}
export function arePlainObjectsEqual(value16, value17) {
  return JSON.stringify(value16 || {}) === JSON.stringify(value17 || {});
}

function isAllowedVideoModel(value18, value19 = []) {
  const list4 = (Array['isArray'](value19) ? value19 : [])
    ['map']((value20) => String(value20 || '')['trim']())
    ['filter'](Boolean);
  return !list4['length'] || list4['includes'](String(value18 || '')['trim']());
}

export function buildRhAiAppVideoMenuItems(value21, { allowedModelIds: allowedModelIds = [] } = {}) {
  const list5 = getModelsByKind('video')
    ['filter'](
      (enabled4) =>
        enabled4?.['provider'] === 'runninghubwf' &&
        enabled4?.['adapterType'] === 'workflow' &&
        enabled4?.['extensions']?.['rhAiApp'] !== undefined &&
        String(enabled4?.['extensions']?.['rhAiApp']?.['appKey'] || '')['trim']() &&
        isAllowedVideoModel(enabled4?.['modelId'], allowedModelIds) &&
        !(
          enabled4?.['uiPlacement']?.['includes']('toolbar') &&
          !enabled4?.['uiPlacement']?.['includes']('modelMenu')
        ),
    )
    ['sort'](
      (value22, value23) =>
        Number(getManifestVideoMenu(value22)?.['order'] || 0x0) -
        Number(getManifestVideoMenu(value23)?.['order'] || 0x0),
    );
  return list5['map']((value24) => {
    const manifestVideoMenu = getManifestVideoMenu(value24);
    return renderNodeMenuItem(
      {
        modelId: value24['modelId'],
        provider: value24['provider'] || 'runninghubwf',
        label: manifestVideoMenu?.['label'] || value24['displayName'],
        description: manifestVideoMenu?.['subtitle'] || value24['description'] || '',
        icon: value24['icon'] || 'images/RH.png',
        iconAlt: 'runninghub',
        vip: value24['vip'] === !![],
      },
      { activeModel: value21 },
    );
  })['join']('');
}

export function buildMinimaxVideoLogoHTML(value25 = 0x14) {
  const count5 = Number(value25) || 0x14,
    value26 = count5 <= 0xc ? 'node-menu-icon-small' : 'node-menu-icon';
  return '<img src="images/minimax-logo.avif" class="' + value26 + '\x22\x20alt=\x22MiniMAX\x22>';
}

export function buildBinghuoVideoLogoHTML(value27 = 0x14) {
  const count6 = Number(value27) || 0x14,
    value28 = count6 <= 0xc ? 'node-menu-icon-small' : 'node-menu-icon';
  return '<div class="' + value28 + ' node-menu-icon-badge">BH</div>';
}

function getCustomProviderMeta(value29) {
  const value30 = value29?.['extensions']?.['customProvider'];
  return value30 && typeof value30 === 'object' ? value30 : null;
}

export function buildCustomProviderVideoLogoHTML(options2 = {}, value31 = 0x14) {
  const value32 = options2?.['extensions'] ? getCustomProviderMeta(options2) : options2,
    value33 =
      String(value32?.['badge'] || 'CP')
        ['trim']()
        ['slice'](0x0, 0x2) || 'CP',
    count7 = Number(value31) || 0x14,
    value34 = count7 <= 0xc ? 'node-menu-icon-small' : 'node-menu-icon';
  return '<div class="' + value34 + ' node-menu-icon-badge">' + escapeHtml(value33) + '</div>';
}

function getComfyUiVideoWorkflowLogoClassName(value35 = 0x14) {
  const count8 = Number(value35) || 0x14;
  return count8 <= 0xc ? 'node-menu-icon-small' : 'node-menu-icon';
}

export function buildComfyUiCloudVideoLogoHTML(value36 = 0x14) {
  return renderComfyUiCloudWorkflowLogoHtml({ className: getComfyUiVideoWorkflowLogoClassName(value36) });
}

export function buildComfyUiLocalVideoLogoHTML(value37 = 0x14) {
  return renderComfyUiLocalWorkflowLogoHtml({ className: getComfyUiVideoWorkflowLogoClassName(value37) });
}

export function getComfyUiVideoWorkflowIconHtml(options3 = {}, value38 = 0x14) {
  const value39 = String(options3?.['iconKind'] || '')['trim']();
  return renderComfyUiWorkflowLogoHtmlFromIconKind(value39, {
    className: getComfyUiVideoWorkflowLogoClassName(value38),
  });
}

function buildComfyUiVideoWorkflowMenuItems(value40, value41) {
  const value42 = String(value41 || '')['trim']();
  return getModelsByKind('video')
    ['filter']((enabled5) => {
      const manifestVideoMenu2 = getManifestVideoMenu(enabled5);
      return (
        enabled5?.['provider'] === 'comfyui' &&
        enabled5?.['adapterType'] === 'workflow' &&
        String(enabled5?.['extensions']?.['comfyUiWorkflow']?.['appKey'] || '')['trim']() &&
        manifestVideoMenu2?.['group'] === value42 &&
        !(
          enabled5?.['uiPlacement']?.['includes']('toolbar') &&
          !enabled5?.['uiPlacement']?.['includes']('modelMenu')
        )
      );
    })
    ['sort'](
      (value43, value44) =>
        Number(getManifestVideoMenu(value43)?.['order'] || 0x0) -
        Number(getManifestVideoMenu(value44)?.['order'] || 0x0),
    )
    ['map']((value45) => {
      const manifestVideoMenu3 = getManifestVideoMenu(value45);
      return renderNodeMenuItem(
        {
          modelId: value45['modelId'],
          provider: value45['provider'] || 'comfyui',
          label: manifestVideoMenu3?.['label'] || value45['displayName'],
          description: manifestVideoMenu3?.['subtitle'] || value45['description'] || '',
          iconHtml: getComfyUiVideoWorkflowIconHtml(manifestVideoMenu3),
          vip: value45['vip'] === !![],
        },
        { activeModel: value40 },
      );
    })
    ['join']('');
}

export function buildComfyUiCloudVideoWorkflowMenuItems(value46) {
  return buildComfyUiVideoWorkflowMenuItems(value46, 'comfyUiCloudWorkflow');
}

export function buildComfyUiLocalVideoWorkflowMenuItems(value47) {
  return buildComfyUiVideoWorkflowMenuItems(value47, 'comfyUiLocalWorkflow');
}

export function buildComfyUiVideoWorkflowMenuGroups(value48) {
  const args = buildComfyUiCloudVideoWorkflowMenuItems(value48),
    args2 = buildComfyUiLocalVideoWorkflowMenuItems(value48);
  return [
    ...(args
      ? [
          {
            id: 'comfyui-cloud-workflow',
            headerClass: 'comfyui-cloud-workflow-group-header',
            submenuClass: 'comfyui-cloud-workflow-submenu',
            toggleAttr: 'data-comfyui-cloud-workflow-toggle',
            label: '云端工作流',
            subtitle: '保存的 ComfyUI 云端工作流',
            iconHtml: buildComfyUiCloudVideoLogoHTML(),
            itemsHtml: args,
          },
        ]
      : []),
    ...(args2
      ? [
          {
            id: 'comfyui-local-workflow',
            headerClass: 'comfyui-local-workflow-group-header',
            submenuClass: 'comfyui-local-workflow-submenu',
            toggleAttr: 'data-comfyui-local-workflow-toggle',
            label: '本地工作流',
            subtitle: '保存的 ComfyUI 本地工作流',
            iconHtml: buildComfyUiLocalVideoLogoHTML(),
            itemsHtml: args2,
          },
        ]
      : []),
  ];
}

export function buildCustomProviderVideoMenuGroups(value49) {
  const enabled6 = new Map();
  return (
    getModelsByKind('video')['forEach']((value50) => {
      const manifestVideoMenu4 = getManifestVideoMenu(value50),
        customProviderMeta = getCustomProviderMeta(value50);
      if (!manifestVideoMenu4 || !customProviderMeta) return;
      if (manifestVideoMenu4['role'] && manifestVideoMenu4['role'] !== 'customProviderModel') return;
      const enabled7 = String(value50?.['provider'] || manifestVideoMenu4['group'] || '')['trim']();
      if (!enabled7) return;
      (!enabled6['has'](enabled7) &&
        enabled6['set'](enabled7, {
          providerId: enabled7,
          displayName: customProviderMeta['displayName'] || enabled7,
          subtitle: manifestVideoMenu4['subtitle'] || 'Custom\x20provider',
          badge: customProviderMeta['badge'] || manifestVideoMenu4['badge'] || 'CP',
          items: [],
        }),
        enabled6['get'](enabled7)['items']['push'](value50));
    }),
    Array['from'](enabled6['values']())['map']((value51) => {
      const value52 = value51['providerId']['replace'](/[^A-Za-z0-9_-]/g, '-'),
        value53 = { badge: value51['badge'] };
      return {
        id: 'custom-provider-video-' + value52,
        headerClass: 'custom-provider-video-group-header custom-provider-video-group-' + value52,
        submenuClass: 'custom-provider-video-submenu-' + value52,
        toggleAttr: 'data-custom-provider-video-toggle',
        label: value51['displayName'],
        subtitle: value51['subtitle'],
        iconHtml: buildCustomProviderVideoLogoHTML(value53),
        itemsHtml: value51['items']
          ['sort'](
            (value54, value55) =>
              Number(getManifestVideoMenu(value54)?.['order'] || 0x0) -
              Number(getManifestVideoMenu(value55)?.['order'] || 0x0),
          )
          ['map']((value56) => {
            const manifestVideoMenu5 = getManifestVideoMenu(value56);
            return renderNodeMenuItem(
              {
                modelId: value56['modelId'],
                provider: value56['provider'],
                label: manifestVideoMenu5?.['label'] || value56['displayName'],
                description: manifestVideoMenu5?.['subtitle'] || value56['description'] || '',
                iconHtml: buildCustomProviderVideoLogoHTML(value56),
                vip: value56['vip'] === !![],
              },
              { activeModel: value49 },
            );
          })
          ['join'](''),
      };
    })
  );
}

function getMinimaxVideoModelMenuManifests() {
  return getModelsByKind('video')
    ['filter']((value57) => {
      if (value57?.['provider'] !== 'minimax') return ![];
      if (value57?.['adapterType'] !== 'modelApi') return ![];
      return getManifestVideoMenu(value57)?.['role'] === 'minimaxOfficialModel';
    })
    ['sort'](
      (value58, value59) =>
        Number(getManifestVideoMenu(value58)?.['order'] || 0x0) -
        Number(getManifestVideoMenu(value59)?.['order'] || 0x0),
    );
}

function getBinghuoVideoModelMenuManifests() {
  return getModelsByKind('video')
    ['filter']((value60) => {
      if (value60?.['provider'] !== 'binghuo') return ![];
      if (value60?.['adapterType'] !== 'modelApi') return ![];
      return getManifestVideoMenu(value60)?.['role'] === 'binghuoModel';
    })
    ['sort'](
      (value61, value62) =>
        Number(getManifestVideoMenu(value61)?.['order'] || 0x0) -
        Number(getManifestVideoMenu(value62)?.['order'] || 0x0),
    );
}

export function buildMinimaxVideoMenuItemsHtml(value63) {
  return getMinimaxVideoModelMenuManifests()
    ['map']((value64) => {
      const manifestVideoMenu6 = getManifestVideoMenu(value64);
      return renderNodeMenuItem(
        {
          modelId: value64['modelId'],
          provider: 'minimax',
          label: manifestVideoMenu6?.['label'] || value64['displayName'],
          description: manifestVideoMenu6?.['subtitle'] || value64['description'] || '',
          iconHtml: buildMinimaxVideoLogoHTML(0x14),
          badgeHtml: buildModelProviderProfileBadgesHtml(value64),
        },
        { activeModel: value63 },
      );
    })
    ['join']('');
}

export function buildBinghuoVideoMenuItemsHtml(value65) {
  return getBinghuoVideoModelMenuManifests()
    ['map']((value66) => {
      const manifestVideoMenu7 = getManifestVideoMenu(value66);
      return renderNodeMenuItem(
        {
          modelId: value66['modelId'],
          provider: 'binghuo',
          label: manifestVideoMenu7?.['label'] || value66['displayName'],
          priceText: manifestVideoMenu7?.['priceText'] || '',
          description: manifestVideoMenu7?.['subtitle'] || value66['description'] || '',
          iconHtml: buildBinghuoVideoLogoHTML(0x14),
          disabled: manifestVideoMenu7?.['disabled'] === !![],
        },
        { activeModel: value65 },
      );
    })
    ['join']('');
}
