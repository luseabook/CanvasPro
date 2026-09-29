import { renderComfyUiCloudWorkflowLogoHtml, renderComfyUiLocalWorkflowLogoHtml, renderComfyUiWorkflowLogoHtmlFromIconKind } from '../shared/customAiAppLogo.js';
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
export function escapeHtml(_0x55e2f6) {
  return String(_0x55e2f6 || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
export function buildRunningHubVideoWorkflowMenuItems(_0xd660af) {
  const _0x578549 = getModelsByKind('video').filter(
    (_0x59d3c0) =>
      _0x59d3c0?.provider === 'runninghubwf' &&
      _0x59d3c0?.adapterType === 'workflow' &&
      !(_0x59d3c0?.uiPlacement?.includes('toolbar') && !_0x59d3c0?.uiPlacement?.includes('modelMenu')),
  );
  return _0x578549
    .map((_0x5bd101) => {
      return renderNodeMenuItem(
        {
          modelId: _0x5bd101.modelId,
          provider: _0x5bd101.provider || 'runninghubwf',
          label: _0x5bd101.displayName,
          description: _0x5bd101.description || '',
          icon: _0x5bd101.icon || 'images/RH.png',
          iconAlt: 'runninghub',
          vip: _0x5bd101.vip === true,
        },
        { activeModel: _0xd660af },
      );
    })
    .join('');
}
export function buildRunningHubVideoModelApiMenuItems(_0x224cf1) {
  const _0x3d030d = getModelsByKind('video')
    .filter((_0x37ead0) => {
      if (_0x37ead0?.provider !== 'runninghub') return false;
      if (_0x37ead0?.adapterType !== 'modelApi') return false;
      if (_0x37ead0?.uiPlacement?.includes('toolbar') && !_0x37ead0?.uiPlacement?.includes('modelMenu'))
        return false;
      return getManifestVideoMenu(_0x37ead0)?.role === 'runninghubModel';
    })
    .sort(
      (_0x3a553e, _0x5969f4) =>
        Number(getManifestVideoMenu(_0x3a553e)?.order || 0) -
        Number(getManifestVideoMenu(_0x5969f4)?.order || 0),
    );
  return _0x3d030d
    .map((_0x5da7c3) =>
      renderNodeMenuItem(
        {
          modelId: _0x5da7c3.modelId,
          provider: _0x5da7c3.provider || 'runninghub',
          label: getManifestVideoMenu(_0x5da7c3)?.label || _0x5da7c3.displayName,
          description: getManifestVideoMenu(_0x5da7c3)?.subtitle || _0x5da7c3.description || '',
          icon: _0x5da7c3.icon || 'images/RH.png',
          iconAlt: 'runninghub',
          vip: _0x5da7c3.vip === true,
        },
        { activeModel: _0x224cf1 },
      ),
    )
    .join('');
}
export function getDefaultRunningHubVideoWorkflowModelId() {
  return (
    getModelsByKind('video').find(
      (_0x6e1b06) =>
        _0x6e1b06?.provider === 'runninghubwf' &&
        _0x6e1b06?.adapterType === 'workflow' &&
        !(_0x6e1b06?.uiPlacement?.includes('toolbar') && !_0x6e1b06?.uiPlacement?.includes('modelMenu')),
    )?.modelId || ''
  );
}
export function buildApimartVideoLogoHTML(_0x1b725d = 20) {
  const _0x4a2dea = Number(_0x1b725d) || 20,
    _0x400c7b = _0x4a2dea <= 12 ? 'node-menu-icon-small' : 'node-menu-icon';
  return '<div class="' + _0x400c7b + ' node-menu-icon-badge node-menu-icon-apimart">AM</div>';
}
export function buildAgnesVideoLogoHTML(_0x1f5682 = 20) {
  const _0x4b3d86 = Number(_0x1f5682) || 20,
    _0x1294a0 = _0x4b3d86 <= 12 ? 'node-menu-icon-small' : 'node-menu-icon';
  return '<div class="' + _0x1294a0 + ' node-menu-icon-badge node-menu-icon-badge-dark">AG</div>';
}
export function buildDreaminaVideoLogoHTML(_0x1832a9 = 20) {
  const _0x480fea = Number(_0x1832a9) || 20;
  if (_0x480fea <= 12)
    return '<img src="images/jimeng.png" class="image-model-trigger-icon image-model-trigger-icon-dreamina" alt="dreamina">';
  return '<img src="images/jimeng.png" class="node-menu-icon" alt="dreamina">';
}
export function buildVolcengineVideoLogoHTML(_0x18e658 = 20) {
  const _0x48c9f9 = Number(_0x18e658) || 20,
    _0x174348 = _0x48c9f9 <= 12 ? 'node-menu-icon-small' : 'node-menu-icon';
  return '<img src="images/volcengine.svg" class="' + _0x174348 + '" alt="volcengine">';
}
function getManifestVideoMenu(_0x455ce2) {
  return _0x455ce2?.extensions?.videoMenu || null;
}
function getManifestDreaminaStyleVideo(_0xe1141) {
  return _0xe1141?.extensions?.dreaminaStyleVideo || null;
}
function getVideoManifestByMenuRole(_0x4da221) {
  return (
    getModelsByKind('video')
      .filter((_0x3af4d9) => getManifestVideoMenu(_0x3af4d9)?.role === _0x4da221)
      .sort(
        (_0x551ea5, _0x43ccde) =>
          Number(getManifestVideoMenu(_0x551ea5)?.order || 0) -
          Number(getManifestVideoMenu(_0x43ccde)?.order || 0),
      )[0] || null
  );
}
function getApimartVideoModelMenuManifests() {
  return getModelsByKind('video')
    .filter((_0x1c5c7d) => {
      if (_0x1c5c7d?.provider !== 'apimart') return false;
      if (_0x1c5c7d?.adapterType !== 'modelApi') return false;
      return getManifestVideoMenu(_0x1c5c7d)?.role === 'apimartModel';
    })
    .sort(
      (_0x5c07f9, _0x33a227) =>
        Number(getManifestVideoMenu(_0x5c07f9)?.order || 0) -
        Number(getManifestVideoMenu(_0x33a227)?.order || 0),
    );
}
function getAgnesVideoModelMenuManifests() {
  return getModelsByKind('video')
    .filter((_0x2387d1) => {
      if (_0x2387d1?.provider !== 'agnes') return false;
      if (_0x2387d1?.adapterType !== 'modelApi') return false;
      return getManifestVideoMenu(_0x2387d1)?.role === 'agnesModel';
    })
    .sort(
      (_0x2147ab, _0x2c3df0) =>
        Number(getManifestVideoMenu(_0x2147ab)?.order || 0) -
        Number(getManifestVideoMenu(_0x2c3df0)?.order || 0),
    );
}
export function getDreaminaTaskModelMenuItems(_0x1b0747, _0x1a0c49 = 'dreamina') {
  const _0x1974fe = String(_0x1a0c49 || 'dreamina')
      .trim()
      .toLowerCase(),
    _0x1d863b = String(_0x1b0747 || '').trim();
  return getModelsByKind('video')
    .filter((_0x2087f4) => {
      if (_0x2087f4?.provider !== _0x1974fe) return false;
      const _0xd2cbd1 = getManifestDreaminaStyleVideo(_0x2087f4);
      if (!_0xd2cbd1) return false;
      return Array.isArray(_0xd2cbd1.taskTypes) && _0xd2cbd1.taskTypes.includes(_0x1d863b);
    })
    .sort(
      (_0x9c9887, _0x38b0eb) =>
        Number(getManifestDreaminaStyleVideo(_0x9c9887)?.order || 0) -
        Number(getManifestDreaminaStyleVideo(_0x38b0eb)?.order || 0),
    )
    .map((_0x109f8c) => {
      const _0x42f85a = getManifestDreaminaStyleVideo(_0x109f8c);
      return {
        model: _0x109f8c.modelId,
        title: translateManifestText(_0x42f85a.title || _0x109f8c.displayName || _0x109f8c.modelId),
        subtitle: translateManifestText(
          _0x42f85a.subtitleByTaskType?.[_0x1d863b] || _0x42f85a.subtitle || _0x109f8c.description || '',
        ),
      };
    });
}
export function getDreaminaTaskModelMenuMeta(_0x5cba2b, _0x1454b0 = '') {
  const _0x5223cd = getModelManifest(_0x5cba2b),
    _0x1123bd = resolveDreaminaStyleVideoProvider(_0x5cba2b, _0x1454b0);
  if (!_0x5223cd || _0x5223cd.provider !== _0x1123bd) return null;
  const _0x1ae331 = getManifestDreaminaStyleVideo(_0x5223cd);
  if (!_0x1ae331) return null;
  return {
    title: translateManifestText(_0x1ae331.title || _0x5223cd.displayName || _0x5223cd.modelId),
    subtitle: translateManifestText(_0x1ae331.subtitle || _0x5223cd.description || ''),
  };
}
export function buildDreaminaOfficialVideoMenuItems() {
  const _0x1652ba = getVideoManifestByMenuRole('dreaminaOfficial'),
    _0x4c8f29 = getManifestVideoMenu(_0x1652ba);
  if (!_0x1652ba || !_0x4c8f29) return [];
  return [
    {
      modelId: _0x1652ba.modelId,
      provider: _0x1652ba.provider,
      label: _0x4c8f29.label || _0x1652ba.displayName,
      subtitle: _0x4c8f29.subtitle || _0x1652ba.description || '',
      iconHtml: buildDreaminaVideoLogoHTML(20),
      vip: _0x1652ba.vip === true,
    },
  ];
}
export function buildVolcengineOfficialVideoMenuItems(_0x59d572 = '', _0xeab850 = '') {
  const _0x5c0e3e = getVideoManifestByMenuRole('volcengineOfficial'),
    _0x148f74 = getManifestVideoMenu(_0x5c0e3e);
  if (!_0x5c0e3e || !_0x148f74) return [];
  const _0x329e29 = resolveDreaminaStyleVideoProvider(_0x59d572, _0xeab850),
    _0x4b51e1 = getModelManifest(_0x59d572);
  return [
    {
      modelId: _0x5c0e3e.modelId,
      provider: _0x5c0e3e.provider,
      label: _0x148f74.label || _0x5c0e3e.displayName,
      subtitle: _0x148f74.subtitle || _0x5c0e3e.description || '',
      iconHtml: buildVolcengineVideoLogoHTML(20),
      active: _0x329e29 === 'volcengine' && !!_0x4b51e1?.extensions?.dreaminaStyleVideo,
      vip: _0x5c0e3e.vip === true,
    },
  ];
}
export function buildApimartVideoMenuItemsHtml(_0x30cbbe, _0x55d15e) {
  const _0xa4e66 = getVideoManifestByMenuRole('apimartDreaminaEntry'),
    _0x4d738b = getManifestVideoMenu(_0xa4e66),
    _0x399385 = _0xa4e66?.modelId || APIMART_DREAMINA_VIDEO_DEFAULT_MODEL;
  return [
    renderNodeMenuItem({
      modelId: _0x399385,
      provider: 'apimart',
      label: _0x4d738b?.label || '即梦视频',
      description: _0x4d738b?.subtitle || '',
      iconHtml: buildDreaminaVideoLogoHTML(20),
      active: isApimartDreaminaVideoModel(_0x30cbbe, _0x55d15e),
      attrs: { 'data-apimart-jimeng': '1' },
    }),
    ...getApimartVideoModelMenuManifests().map((_0x3cb88f) => {
      const _0x662d6a = getManifestVideoMenu(_0x3cb88f);
      return renderNodeMenuItem(
        {
          modelId: _0x3cb88f.modelId,
          provider: 'apimart',
          label: _0x3cb88f.displayName,
          description: _0x662d6a?.disabledValue
            ? _0x3cb88f.description || ''
            : _0x662d6a?.subtitle || _0x3cb88f.description || '',
          iconHtml: buildApimartVideoLogoHTML(20),
          vip: _0x3cb88f.vip === true,
          attrs: { 'data-apimart-video-model': '1' },
        },
        { activeModel: _0x30cbbe },
      );
    }),
  ].join('');
}
export function buildAgnesVideoMenuItemsHtml(_0x189c05) {
  return getAgnesVideoModelMenuManifests()
    .map((_0x244482) => {
      const _0x48d6c2 = getManifestVideoMenu(_0x244482);
      return renderNodeMenuItem(
        {
          modelId: _0x244482.modelId,
          provider: 'agnes',
          label: _0x48d6c2?.label || _0x244482.displayName,
          description: _0x48d6c2?.subtitle || _0x244482.description || '',
          iconHtml: buildAgnesVideoLogoHTML(20),
          vip: _0x244482.vip === true,
        },
        { activeModel: _0x189c05 },
      );
    })
    .join('');
}
export function buildDreaminaTaskModelMenuHtml(_0x34428c, _0x1175be, _0x1b2ec0 = 'dreamina') {
  const _0x35e5e1 = resolveDreaminaStyleVideoProvider(_0x34428c, _0x1b2ec0),
    _0x44e669 = getDreaminaTaskModelMenuItems(_0x1175be, _0x35e5e1),
    _0x494384 =
      _0x35e5e1 === 'apimart'
        ? buildApimartVideoLogoHTML(20)
        : _0x35e5e1 === 'volcengine'
          ? buildVolcengineVideoLogoHTML(20)
          : '<img src="images/jimeng.png" class="node-menu-icon" alt="dreamina">';
  if (!_0x44e669.length)
    return renderNodeMenuItem({
      label: '智能多帧',
      description: '暂未开放模型切换',
      iconHtml: _0x494384,
      disabled: true,
    });
  return _0x44e669
    .map((_0x5ba6f2) =>
      renderNodeMenuItem({
        modelId: _0x5ba6f2.model,
        provider: _0x35e5e1,
        label: _0x5ba6f2.title,
        description: _0x5ba6f2.subtitle,
        iconHtml: _0x494384,
        active: _0x34428c === _0x5ba6f2.model,
        attrs: { 'data-dreamina-task-model': '1' },
      }),
    )
    .join('');
}
export function getRhV54FpsOptions() {
  return RH_V54_FPS_OPTIONS;
}
export function normalizeRhStandardFps(_0x5eca88) {
  const _0x57b092 = Number(_0x5eca88);
  return RH_STANDARD_FPS_OPTIONS.includes(_0x57b092) ? _0x57b092 : 24;
}
export function normalizeRhV54Fps(_0x185cd8) {
  const _0x2c79dc = Number(_0x185cd8);
  return getRhV54FpsOptions().includes(_0x2c79dc) ? _0x2c79dc : 24;
}
export function normalizeRhVideoResolution(_0x2e3924) {
  const _0x1f7ee8 = Number(_0x2e3924);
  return Number.isFinite(_0x1f7ee8)
    ? Math.max(RH_MIN_VIDEO_RESOLUTION, Math.trunc(_0x1f7ee8))
    : RH_MIN_VIDEO_RESOLUTION;
}
export function arePlainObjectsEqual(_0x24bd4c, _0x16ed63) {
  return JSON.stringify(_0x24bd4c || {}) === JSON.stringify(_0x16ed63 || {});
}

function isAllowedVideoModel(_0x193af5,_0x12b871=[]){const _0x4e36ed=(Array['isArray'](_0x12b871)?_0x12b871:[])['map'](_0x37a51c=>String(_0x37a51c||'')["trim"]())["filter"](Boolean);return!_0x4e36ed["length"]||_0x4e36ed['includes'](String(_0x193af5||'')["trim"]());}

export function buildRhAiAppVideoMenuItems(_0x11e699,{allowedModelIds:allowedModelIds=[]}={}){const _0x20d146=getModelsByKind("video")['filter'](_0x5bddf4=>_0x5bddf4?.["provider"]==='runninghubwf'&&_0x5bddf4?.["adapterType"]==="workflow"&&_0x5bddf4?.['extensions']?.["rhAiApp"]!==undefined&&String(_0x5bddf4?.["extensions"]?.["rhAiApp"]?.["appKey"]||'')['trim']()&&isAllowedVideoModel(_0x5bddf4?.["modelId"],allowedModelIds)&&!(_0x5bddf4?.["uiPlacement"]?.["includes"]("toolbar")&&!_0x5bddf4?.["uiPlacement"]?.['includes']('modelMenu')))['sort']((_0x402f00,_0x6fa6d4)=>Number(getManifestVideoMenu(_0x402f00)?.["order"]||0x0)-Number(getManifestVideoMenu(_0x6fa6d4)?.["order"]||0x0));return _0x20d146['map'](_0x4d962b=>{const _0x4ba686=getManifestVideoMenu(_0x4d962b);return renderNodeMenuItem({'modelId':_0x4d962b["modelId"],'provider':_0x4d962b["provider"]||"runninghubwf",'label':_0x4ba686?.["label"]||_0x4d962b["displayName"],'description':_0x4ba686?.["subtitle"]||_0x4d962b["description"]||'','icon':_0x4d962b["icon"]||"images/RH.png",'iconAlt':'runninghub','vip':_0x4d962b["vip"]===!![]},{'activeModel':_0x11e699});})['join']('');}

export function buildMinimaxVideoLogoHTML(_0x2b267c=0x14){const _0x456c34=Number(_0x2b267c)||0x14,_0x467f5b=_0x456c34<=0xc?"node-menu-icon-small":"node-menu-icon";return "<img src=\"images/minimax-logo.avif\" class=\""+_0x467f5b+'\x22\x20alt=\x22MiniMAX\x22>';}

export function buildBinghuoVideoLogoHTML(_0x48d4b6=0x14){const _0x3e8ff2=Number(_0x48d4b6)||0x14,_0x20d860=_0x3e8ff2<=0xc?"node-menu-icon-small":"node-menu-icon";return "<div class=\""+_0x20d860+" node-menu-icon-badge\">BH</div>";}

function getCustomProviderMeta(_0x22cbc6){const _0x2fffaa=_0x22cbc6?.["extensions"]?.["customProvider"];return _0x2fffaa&&typeof _0x2fffaa==="object"?_0x2fffaa:null;}

export function buildCustomProviderVideoLogoHTML(_0xc91d0d={},_0x1a04c8=0x14){const _0x3774ac=_0xc91d0d?.["extensions"]?getCustomProviderMeta(_0xc91d0d):_0xc91d0d,_0x4a51da=String(_0x3774ac?.['badge']||'CP')["trim"]()['slice'](0x0,0x2)||'CP',_0x495e40=Number(_0x1a04c8)||0x14,_0x4ed23a=_0x495e40<=0xc?'node-menu-icon-small':"node-menu-icon";return "<div class=\""+_0x4ed23a+" node-menu-icon-badge\">"+escapeHtml(_0x4a51da)+"</div>";}

function getComfyUiVideoWorkflowLogoClassName(_0x502031=0x14){const _0x5affbc=Number(_0x502031)||0x14;return _0x5affbc<=0xc?"node-menu-icon-small":"node-menu-icon";}

export function buildComfyUiCloudVideoLogoHTML(_0x19736f=0x14){return renderComfyUiCloudWorkflowLogoHtml({'className':getComfyUiVideoWorkflowLogoClassName(_0x19736f)});}

export function buildComfyUiLocalVideoLogoHTML(_0x1366fa=0x14){return renderComfyUiLocalWorkflowLogoHtml({'className':getComfyUiVideoWorkflowLogoClassName(_0x1366fa)});}

export function getComfyUiVideoWorkflowIconHtml(_0x51c06b={},_0x5acbb9=0x14){const _0x4451d6=String(_0x51c06b?.["iconKind"]||'')["trim"]();return renderComfyUiWorkflowLogoHtmlFromIconKind(_0x4451d6,{'className':getComfyUiVideoWorkflowLogoClassName(_0x5acbb9)});}

function buildComfyUiVideoWorkflowMenuItems(_0x469d91,_0x2ac369){const _0x516a27=String(_0x2ac369||'')["trim"]();return getModelsByKind('video')["filter"](_0x1077ae=>{const _0x442531=getManifestVideoMenu(_0x1077ae);return _0x1077ae?.['provider']==='comfyui'&&_0x1077ae?.["adapterType"]==="workflow"&&String(_0x1077ae?.["extensions"]?.["comfyUiWorkflow"]?.['appKey']||'')['trim']()&&_0x442531?.["group"]===_0x516a27&&!(_0x1077ae?.['uiPlacement']?.["includes"]('toolbar')&&!_0x1077ae?.["uiPlacement"]?.['includes']("modelMenu"));})['sort']((_0x23df33,_0x14780a)=>Number(getManifestVideoMenu(_0x23df33)?.["order"]||0x0)-Number(getManifestVideoMenu(_0x14780a)?.["order"]||0x0))["map"](_0x397919=>{const _0x37f389=getManifestVideoMenu(_0x397919);return renderNodeMenuItem({'modelId':_0x397919["modelId"],'provider':_0x397919['provider']||"comfyui",'label':_0x37f389?.['label']||_0x397919["displayName"],'description':_0x37f389?.["subtitle"]||_0x397919["description"]||'','iconHtml':getComfyUiVideoWorkflowIconHtml(_0x37f389),'vip':_0x397919['vip']===!![]},{'activeModel':_0x469d91});})["join"]('');}

export function buildComfyUiCloudVideoWorkflowMenuItems(_0x2d6b86){return buildComfyUiVideoWorkflowMenuItems(_0x2d6b86,"comfyUiCloudWorkflow");}

export function buildComfyUiLocalVideoWorkflowMenuItems(_0x46da0d){return buildComfyUiVideoWorkflowMenuItems(_0x46da0d,"comfyUiLocalWorkflow");}

export function buildComfyUiVideoWorkflowMenuGroups(_0xf61d5){const _0x4e583c=buildComfyUiCloudVideoWorkflowMenuItems(_0xf61d5),_0x153228=buildComfyUiLocalVideoWorkflowMenuItems(_0xf61d5);return[..._0x4e583c?[{'id':"comfyui-cloud-workflow",'headerClass':'comfyui-cloud-workflow-group-header','submenuClass':"comfyui-cloud-workflow-submenu",'toggleAttr':'data-comfyui-cloud-workflow-toggle','label':'云端工作流','subtitle':"保存的 ComfyUI 云端工作流",'iconHtml':buildComfyUiCloudVideoLogoHTML(),'itemsHtml':_0x4e583c}]:[],..._0x153228?[{'id':"comfyui-local-workflow",'headerClass':"comfyui-local-workflow-group-header",'submenuClass':'comfyui-local-workflow-submenu','toggleAttr':"data-comfyui-local-workflow-toggle",'label':"本地工作流",'subtitle':"保存的 ComfyUI 本地工作流",'iconHtml':buildComfyUiLocalVideoLogoHTML(),'itemsHtml':_0x153228}]:[]];}

export function buildCustomProviderVideoMenuGroups(_0x43d4ae){const _0x5893c8=new Map();return getModelsByKind('video')['forEach'](_0xacaeb9=>{const _0x4638d6=getManifestVideoMenu(_0xacaeb9),_0x391411=getCustomProviderMeta(_0xacaeb9);if(!_0x4638d6||!_0x391411)return;if(_0x4638d6['role']&&_0x4638d6["role"]!=='customProviderModel')return;const _0x3ffbed=String(_0xacaeb9?.['provider']||_0x4638d6['group']||'')["trim"]();if(!_0x3ffbed)return;!_0x5893c8["has"](_0x3ffbed)&&_0x5893c8["set"](_0x3ffbed,{'providerId':_0x3ffbed,'displayName':_0x391411["displayName"]||_0x3ffbed,'subtitle':_0x4638d6["subtitle"]||'Custom\x20provider','badge':_0x391411["badge"]||_0x4638d6["badge"]||'CP','items':[]}),_0x5893c8["get"](_0x3ffbed)["items"]['push'](_0xacaeb9);}),Array["from"](_0x5893c8["values"]())["map"](_0x1e79e6=>{const _0x408b5e=_0x1e79e6['providerId']["replace"](/[^A-Za-z0-9_-]/g,'-'),_0xbeb9ae={'badge':_0x1e79e6["badge"]};return{'id':"custom-provider-video-"+_0x408b5e,'headerClass':"custom-provider-video-group-header custom-provider-video-group-"+_0x408b5e,'submenuClass':'custom-provider-video-submenu-'+_0x408b5e,'toggleAttr':"data-custom-provider-video-toggle",'label':_0x1e79e6['displayName'],'subtitle':_0x1e79e6["subtitle"],'iconHtml':buildCustomProviderVideoLogoHTML(_0xbeb9ae),'itemsHtml':_0x1e79e6['items']["sort"]((_0x28def9,_0x627a0f)=>Number(getManifestVideoMenu(_0x28def9)?.['order']||0x0)-Number(getManifestVideoMenu(_0x627a0f)?.["order"]||0x0))["map"](_0x80478a=>{const _0x516046=getManifestVideoMenu(_0x80478a);return renderNodeMenuItem({'modelId':_0x80478a['modelId'],'provider':_0x80478a["provider"],'label':_0x516046?.["label"]||_0x80478a["displayName"],'description':_0x516046?.["subtitle"]||_0x80478a['description']||'','iconHtml':buildCustomProviderVideoLogoHTML(_0x80478a),'vip':_0x80478a["vip"]===!![]},{'activeModel':_0x43d4ae});})["join"]('')};});}

function getMinimaxVideoModelMenuManifests(){return getModelsByKind("video")["filter"](_0x222b6c=>{if(_0x222b6c?.["provider"]!=='minimax')return![];if(_0x222b6c?.["adapterType"]!=="modelApi")return![];return getManifestVideoMenu(_0x222b6c)?.['role']==="minimaxOfficialModel";})["sort"]((_0x2aa271,_0x1f51cb)=>Number(getManifestVideoMenu(_0x2aa271)?.["order"]||0x0)-Number(getManifestVideoMenu(_0x1f51cb)?.["order"]||0x0));}

function getBinghuoVideoModelMenuManifests(){return getModelsByKind('video')["filter"](_0x5adfe4=>{if(_0x5adfe4?.['provider']!=='binghuo')return![];if(_0x5adfe4?.['adapterType']!=="modelApi")return![];return getManifestVideoMenu(_0x5adfe4)?.["role"]==='binghuoModel';})["sort"]((_0x25b421,_0x204165)=>Number(getManifestVideoMenu(_0x25b421)?.["order"]||0x0)-Number(getManifestVideoMenu(_0x204165)?.['order']||0x0));}

export function buildMinimaxVideoMenuItemsHtml(_0x4015ca){return getMinimaxVideoModelMenuManifests()["map"](_0x1ef8b8=>{const _0x3afa17=getManifestVideoMenu(_0x1ef8b8);return renderNodeMenuItem({'modelId':_0x1ef8b8['modelId'],'provider':"minimax",'label':_0x3afa17?.["label"]||_0x1ef8b8['displayName'],'description':_0x3afa17?.["subtitle"]||_0x1ef8b8["description"]||'','iconHtml':buildMinimaxVideoLogoHTML(0x14),'badgeHtml':buildModelProviderProfileBadgesHtml(_0x1ef8b8)},{'activeModel':_0x4015ca});})["join"]('');}

export function buildBinghuoVideoMenuItemsHtml(_0xf86c8d){return getBinghuoVideoModelMenuManifests()["map"](_0x363644=>{const _0x3a1a84=getManifestVideoMenu(_0x363644);return renderNodeMenuItem({'modelId':_0x363644['modelId'],'provider':'binghuo','label':_0x3a1a84?.['label']||_0x363644["displayName"],'priceText':_0x3a1a84?.["priceText"]||'','description':_0x3a1a84?.["subtitle"]||_0x363644["description"]||'','iconHtml':buildBinghuoVideoLogoHTML(0x14),'disabled':_0x3a1a84?.["disabled"]===!![]},{'activeModel':_0xf86c8d});})["join"]('');}
