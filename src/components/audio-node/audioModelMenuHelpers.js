import { renderComfyUiCloudWorkflowLogoHtml, renderComfyUiLocalWorkflowLogoHtml, renderComfyUiWorkflowLogoHtmlFromIconKind } from '../shared/customAiAppLogo.js';
import { escapeNodeMenuHtml } from '../shared/nodeModelMenu.js';
import { buildModelProviderProfileBadgesHtml } from '../shared/modelProviderProfileControl.js';
import { getModelsByKind } from '../../manifests/index.js';
import { renderNodeModelMenu, renderNodeModelTrigger } from '../shared/nodeModelMenu.js';
import { t } from '../../i18n/index.js';
function audioModelMenuText(_0x56a8ee, _0x7b39f5 = {}) {
  return t('audioModelMenu.' + _0x56a8ee, _0x7b39f5);
}
function getAudioMenuMeta(_0x178afb) {
  const _0x3453b8 = _0x178afb?.extensions?.audioMenu;
  return _0x3453b8 && typeof _0x3453b8 === 'object' ? _0x3453b8 : null;
}
function isAudioModelMenuManifest(_0x1e2765) {
  const _0x39b243 = getAudioMenuMeta(_0x1e2765);
  if (_0x39b243?.group !== 'runninghubWorkflow') return false;
  if (_0x1e2765?.provider !== 'runninghubwf') return false;
  const _0x17b9b9 = Array.isArray(_0x1e2765?.uiPlacement) ? _0x1e2765.uiPlacement : ['modelMenu'];
  return !(_0x17b9b9.includes('toolbar') && !_0x17b9b9.includes('modelMenu'));
}
export function getAudioWorkflowMenuManifests() {
  return getModelsByKind('audio')
    .filter(isAudioModelMenuManifest)
    .sort((_0x4857e1, _0x59a8c6) => {
      const _0x99dfd1 = Number(getAudioMenuMeta(_0x4857e1)?.order),
        _0x298607 = Number(getAudioMenuMeta(_0x59a8c6)?.order),
        _0x39886e = Number.isFinite(_0x99dfd1) ? _0x99dfd1 : 0,
        _0x5b2069 = Number.isFinite(_0x298607) ? _0x298607 : 0;
      if (_0x39886e !== _0x5b2069) return _0x39886e - _0x5b2069;
      return String(_0x4857e1.modelId || '').localeCompare(String(_0x59a8c6.modelId || ''));
    });
}
export function buildAudioWorkflowItems(_0x39540e = {}) {
  return getAudioWorkflowMenuManifests().map((_0x20ba30) =>
    Object.freeze({
      key: _0x20ba30.modelId,
      label: _0x20ba30.displayName,
      subtitle: _0x20ba30.description || '',
      vip: _0x20ba30.vip === true,
      validate: _0x39540e[_0x20ba30.modelId] || (() => ''),
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
        items: workflowItems.map((_0x468f3b) => ({
          modelId: _0x468f3b.key,
          label: _0x468f3b.label,
          subtitle: _0x468f3b.subtitle,
          icon: 'images/RH.png',
          iconAlt: 'runninghub',
          vip: _0x468f3b.vip === true,
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

function isSavedRhAiAppManifest(_0x32c752){return Boolean(String(_0x32c752?.["extensions"]?.["rhAiApp"]?.["appKey"]||'')["trim"]());}

function isSavedComfyUiWorkflowManifest(_0x41ef0e){return Boolean(String(_0x41ef0e?.["extensions"]?.["comfyUiWorkflow"]?.["appKey"]||'')["trim"]());}

function buildComfyUiAudioWorkflowIconHtml(_0x189d87){return renderComfyUiWorkflowLogoHtmlFromIconKind(_0x189d87,{'className':"node-menu-icon"});}

function getCustomProviderMeta(_0x323544){const _0x12e3f1=_0x323544?.["extensions"]?.["customProvider"];return _0x12e3f1&&typeof _0x12e3f1==="object"?_0x12e3f1:null;}

function buildCustomProviderAudioLogoHtml(_0x32331f={},_0x77b7c='node-menu-icon'){const _0x57da7b=String(_0x32331f?.["badge"]||'CP')["trim"]()['slice'](0x0,0x2)||'CP';return "<div class=\""+escapeNodeMenuHtml(_0x77b7c)+" node-menu-icon-badge\">"+escapeNodeMenuHtml(_0x57da7b)+"</div>";}

function getAudioMenuIconHtml(_0x381a66={}){const _0x2ede92=String(_0x381a66?.['iconKind']||'')["trim"]();if(_0x2ede92==="comfyUiCloudWorkflowBadge"||_0x2ede92==="comfyUiLocalWorkflowBadge")return buildComfyUiAudioWorkflowIconHtml(_0x2ede92);if(_0x2ede92==="customProviderBadge")return buildCustomProviderAudioLogoHtml(_0x381a66);return'';}

const AUDIO_MENU_GROUP_CONFIG=Object['freeze']({'rhAiApp':Object['freeze']({'id':"rhAiApp",'label':"RH AI应用",'subtitle':"自定义 RunningHub AI App",'icon':"images/RH.png",'iconAlt':"runninghub",'order':0x5}),'comfyUiCloudWorkflow':Object["freeze"]({'id':"comfyUiCloudWorkflow",'label':"云端工作流",'subtitle':"保存的 ComfyUI 云端工作流",'iconHtml':renderComfyUiCloudWorkflowLogoHtml({'className':"node-menu-icon"}),'order':0x6}),'comfyUiLocalWorkflow':Object['freeze']({'id':"comfyUiLocalWorkflow",'label':"本地工作流",'subtitle':"保存的 ComfyUI 本地工作流",'iconHtml':renderComfyUiLocalWorkflowLogoHtml({'className':"node-menu-icon"}),'order':0x7}),'runninghubWorkflow':Object["freeze"]({'id':"runninghub",'labelKey':'runninghub.label','subtitleKey':"runninghub.subtitle",'icon':'images/RH.png','iconAlt':"runninghub",'order':0xa}),'runninghubModel':Object['freeze']({'id':"runninghubModel",'label':"RunningHub模型",'subtitle':'语音合成\x20·\x20音乐创作\x20·\x20声音克隆','icon':"images/RH.png",'iconAlt':"runninghub",'order':0xf}),'volcengineSpeech':Object["freeze"]({'id':'volcengineSpeech','label':'火山语音','subtitle':"豆包语音大模型",'icon':"images/volcengine.svg",'iconAlt':'volcengine-speech','order':0x14})});

function getGroupConfig(_0xcd19ed){const _0x4f32b4=String(_0xcd19ed||'')["trim"]();if(AUDIO_MENU_GROUP_CONFIG[_0x4f32b4])return AUDIO_MENU_GROUP_CONFIG[_0x4f32b4];return Object["freeze"]({'id':_0x4f32b4||"other",'label':_0x4f32b4||'其他','subtitle':'','icon':"images/RH.png",'iconAlt':_0x4f32b4||'','order':0x64});}

function getGroupLabel(_0x1647d1){if(_0x1647d1["labelKey"])return audioModelMenuText(_0x1647d1["labelKey"]);return _0x1647d1['label']||_0x1647d1['id'];}

function getGroupSubtitle(_0x36aae2){if(_0x36aae2["subtitleKey"])return audioModelMenuText(_0x36aae2["subtitleKey"]);return _0x36aae2["subtitle"]||'';}

function groupWorkflowItems(_0x500ed8=[]){const _0x320c4a=new Map();return _0x500ed8['forEach'](_0x2f6f17=>{const _0x203719=String(_0x2f6f17?.["group"]||"runninghubWorkflow"),_0x3ce555=getGroupConfig(_0x203719),_0x461502=!AUDIO_MENU_GROUP_CONFIG[_0x203719]&&String(_0x2f6f17?.["providerDisplayName"]||'')["trim"]();!_0x320c4a["has"](_0x3ce555['id'])&&_0x320c4a["set"](_0x3ce555['id'],{..._0x3ce555,'label':_0x461502?_0x2f6f17["providerDisplayName"]:getGroupLabel(_0x3ce555),'subtitle':_0x461502?"Custom provider":getGroupSubtitle(_0x3ce555),'iconHtml':_0x461502?buildCustomProviderAudioLogoHtml({'badge':_0x2f6f17["providerBadge"]||'CP'}):_0x3ce555["iconHtml"],'icon':_0x461502?undefined:_0x3ce555["icon"],'iconAlt':_0x461502?'':_0x3ce555['iconAlt'],'order':_0x461502?0x1e:_0x3ce555["order"],'items':[]}),_0x320c4a["get"](_0x3ce555['id'])['items']["push"]({'modelId':_0x2f6f17["key"],'provider':_0x2f6f17["provider"]||'','label':_0x2f6f17["label"],'subtitle':_0x2f6f17["subtitle"],'iconHtml':_0x2f6f17["iconHtml"]||undefined,'icon':_0x2f6f17["icon"]||_0x3ce555["icon"],'iconAlt':_0x2f6f17["iconAlt"]||_0x3ce555["iconAlt"],'vip':_0x2f6f17['vip']===!![],'badgeHtml':buildModelProviderProfileBadgesHtml(_0x2f6f17["key"],{'vip':_0x2f6f17["vip"]===!![]})});}),Array["from"](_0x320c4a['values']())['sort']((_0x2be58b,_0xfcc2a4)=>{const _0x51a98b=Number(_0x2be58b["order"]),_0x4e6488=Number(_0xfcc2a4["order"]);return(Number["isFinite"](_0x51a98b)?_0x51a98b:0x0)-(Number["isFinite"](_0x4e6488)?_0x4e6488:0x0);});}

export function buildAudioWorkflowMenuGroups(_0xbb6abd=[]){return groupWorkflowItems(_0xbb6abd);}
