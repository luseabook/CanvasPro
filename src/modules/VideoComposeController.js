import appStore from '../core/stores/appStore.js';
import { requester } from '../../api/requester.js';
import { t } from '../i18n/index.js';
import { canUseElectronMediaTask, enqueueElectronMediaTask } from '../../api/localMediaTaskApi.js';
import { generateId } from '../core/math.js';
import { commit } from './history.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import {
  buildSourceAudioNodePayload,
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from '../services/fileService.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
import { getOrderedMediaComposeIds, getSelectedMediaComposeKind } from './mediaComposeSelection.js';
const MEDIA_COMPOSE_CONFIG = Object.freeze({
  video: Object.freeze({
    taskKind: 'videoCompose',
    endpoint: '/api/v2/video/compose',
    textKey: 'video',
    resultIdPrefix: 'source-video-compose',
    sourceFields: Object.freeze(['localPath', 'src', 'videoUrl', 'url', 'resultUrl']),
  }),
  audio: Object.freeze({
    taskKind: 'audioCompose',
    endpoint: '/api/v2/audio/compose',
    textKey: 'audio',
    resultIdPrefix: 'source-audio-compose',
    sourceFields: Object.freeze(['localPath', 'audioUrl', 'src', 'url', 'resultUrl']),
  }),
});
function mediaComposeText(_0xf6e7a2, _0x391653, _0x377ef8 = {}) {
  return t('mediaProcessing.compose.' + _0xf6e7a2.textKey + '.' + _0x391653, _0x377ef8);
}
function resolveNodeSrc(_0x185bd2, _0xcec199) {
  const _0x1539d8 = Array.isArray(_0xcec199?.sourceFields) ? _0xcec199.sourceFields : [];
  for (const _0x17206e of _0x1539d8) {
    const _0x25de3b = localPathToUrl(_0x185bd2?.[_0x17206e]);
    if (_0x25de3b) return _0x25de3b;
  }
  return '';
}
function getResultNodeSize(_0x2f4c90, _0x26e56a) {
  if (_0x2f4c90 === 'audio')
    return { width: Number(_0x26e56a?.width || 0) || 0x140, height: Number(_0x26e56a?.height || 0) || 140 };
  return getAutoMediaSizeByShortSide(_0x26e56a?.width || 0x200, _0x26e56a?.height || 0x120);
}
function buildComposedNodePayload(
  _0x204a60,
  _0x524481,
  { id: _0x3be1aa, x: _0x408827, y: _0x3f7f9b, width: _0x49bf91, height: _0x52c1ba, localPath: _0x1841b1 },
) {
  const _0x64ea7 = localPathToUrl(_0x1841b1);
  if (_0x204a60 === 'audio')
    return buildSourceAudioNodePayload({
      id: _0x3be1aa,
      type: 'source-audio',
      x: _0x408827,
      y: _0x3f7f9b,
      width: _0x49bf91,
      height: _0x52c1ba,
      name: mediaComposeText(_0x524481, 'resultName'),
      src: _0x64ea7,
      audioUrl: _0x64ea7,
      localPath: _0x1841b1,
      needsAutoResize: false,
      fixedSize: true,
    });
  return buildSourceMediaNodePayload({
    id: _0x3be1aa,
    type: 'source-video',
    x: _0x408827,
    y: _0x3f7f9b,
    width: _0x49bf91,
    height: _0x52c1ba,
    name: mediaComposeText(_0x524481, 'resultName'),
    src: _0x64ea7,
    localPath: _0x1841b1,
    needsAutoResize: false,
    fixedSize: true,
  });
}
async function runMediaComposeRequest(_0x9c347a, _0x42d573) {
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(
      { kind: _0x9c347a.taskKind, srcs: _0x42d573, args: { srcs: _0x42d573 } },
      { wait: true, timeout: 0x927c0 },
    );
  const _0x2084c2 = await requester({
    url: _0x9c347a.endpoint,
    method: 'POST',
    provider: 'local',
    timeout: 0x493e0,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ srcs: _0x42d573 }),
    allow404Null: true,
    returnMeta: true,
  });
  if (_0x2084c2?.status === 0x194 || _0x2084c2?.data == null)
    throw new Error(mediaComposeText(_0x9c347a, 'missingApi'));
  return _0x2084c2.data || {};
}
async function composeSelectedMedia(_0x2cefb4, _0x5a748, _0x1405e6) {
  const _0x2c9c80 = MEDIA_COMPOSE_CONFIG[_0x1405e6];
  if (!_0x2c9c80) return;
  const _0x55a3aa = appStore.getState(),
    _0x5b77af = _0x55a3aa.nodes || {},
    _0x5ec70f = _0x55a3aa.selectionMeta || {},
    _0x444ede = Array.isArray(_0x2cefb4) ? _0x2cefb4.slice() : [];
  if (getSelectedMediaComposeKind(_0x5b77af, _0x444ede) !== _0x1405e6) {
    window.showToast?.(mediaComposeText(_0x2c9c80, 'minSelection'), 'info');
    return;
  }
  const _0x2a92fa = getOrderedMediaComposeIds(_0x5b77af, _0x444ede, _0x5ec70f),
    _0x27ca05 = _0x2a92fa.map((_0x17f703) => resolveNodeSrc(_0x5b77af[_0x17f703], _0x2c9c80)).filter(Boolean);
  if (_0x27ca05.length < 2) {
    window.showToast?.(mediaComposeText(_0x2c9c80, 'invalidSource'), 'error');
    return;
  }
  _0x5a748 && ((_0x5a748.dataset.loading = 'true'), (_0x5a748.disabled = true));
  window.showToast?.(mediaComposeText(_0x2c9c80, 'progress'), 'info');
  try {
    const _0x4a19d9 = await runMediaComposeRequest(_0x2c9c80, _0x27ca05),
      _0x268872 = pickResultLocalPath(_0x4a19d9);
    if (!_0x4a19d9.success || !_0x268872)
      throw new Error(_0x4a19d9.error || _0x4a19d9.message || mediaComposeText(_0x2c9c80, 'fallback'));
    const _0x1d64b1 = _0x2a92fa[0],
      _0x45f354 = _0x5b77af[_0x1d64b1],
      { width: _0x30a361, height: _0x3b10d6 } = getResultNodeSize(_0x1405e6, _0x45f354),
      _0x419587 = calcSafeSpawnPosNearNode(appStore.getState().nodes, _0x45f354, _0x30a361, _0x3b10d6),
      _0x5a27ef = generateId(_0x2c9c80.resultIdPrefix);
    (appStore.addNode(
      buildComposedNodePayload(_0x1405e6, _0x2c9c80, {
        id: _0x5a27ef,
        x: _0x419587.x,
        y: _0x419587.y,
        width: _0x30a361,
        height: _0x3b10d6,
        localPath: _0x268872,
      }),
    ),
      appStore.setSelectedNodes([_0x5a27ef]),
      commit(),
      window.v2FocusOnNodes?.([..._0x2a92fa, _0x5a27ef]),
      window._triggerLocalCacheSave?.(),
      window.showToast?.(mediaComposeText(_0x2c9c80, 'success'), 'success'));
  } catch (_0x20d641) {
    const _0x3ca89e =
      _0x20d641 instanceof Error
        ? _0x20d641.message
        : String(_0x20d641 || mediaComposeText(_0x2c9c80, 'fallback'));
    window.showToast?.(mediaComposeText(_0x2c9c80, 'failedWithMessage', { message: _0x3ca89e }), 'error');
  } finally {
    _0x5a748 && ((_0x5a748.dataset.loading = 'false'), (_0x5a748.disabled = false));
  }
}
export async function composeSelectedVideos(_0x22f172, _0x4e182b) {
  return composeSelectedMedia(_0x22f172, _0x4e182b, 'video');
}
export async function composeSelectedAudios(_0xb77ba9, _0x486199) {
  return composeSelectedMedia(_0xb77ba9, _0x486199, 'audio');
}

function audioVoiceComposeText(_0x427786,_0x48538a={}){return t('mediaProcessing.compose.audioVoice.'+_0x427786,_0x48538a);}

export function __buildComposedNodePayloadForTest(_0xf78f8c,_0x3b03d7={}){const _0xd67ac8=MEDIA_COMPOSE_CONFIG[_0xf78f8c];if(!_0xd67ac8)throw new Error("Unsupported media compose kind: "+(_0xf78f8c||"unknown"));return buildComposedNodePayload(_0xf78f8c,_0xd67ac8,_0x3b03d7);}

function buildAudioVoiceComposedNodePayload(_0x65215e,{id:_0x1130df,x:_0x409b42,y:_0x2df2ff,width:_0x5cce1b,height:_0x255544,localPath:_0x514b18,result:result={}}){const _0x3139ef=localPathToUrl(_0x514b18);if(_0x65215e==="audio")return buildSourceAudioNodePayload({'id':_0x1130df,'type':"source-audio",'x':_0x409b42,'y':_0x2df2ff,'width':_0x5cce1b,'height':_0x255544,'name':audioVoiceComposeText('audioResultName'),'src':_0x3139ef,'audioUrl':_0x3139ef,'localPath':_0x514b18,'needsAutoResize':![],'fixedSize':!![]});const _0x3882e0=String(result?.['posterLocalPath']||result?.["thumbLocalPath"]||'')["trim"](),_0x3264aa=String(result?.["posterUrl"]||result?.["thumbUrl"]||localPathToUrl(_0x3882e0))["trim"]();return buildSourceMediaNodePayload({'id':_0x1130df,'type':"source-video",'x':_0x409b42,'y':_0x2df2ff,'width':_0x5cce1b,'height':_0x255544,'name':audioVoiceComposeText("videoResultName"),'src':_0x3139ef,'localPath':_0x514b18,'posterLocalPath':_0x3882e0,'thumbLocalPath':String(result?.["thumbLocalPath"]||_0x3882e0)["trim"](),'posterUrl':_0x3264aa,'thumbUrl':String(result?.["thumbUrl"]||_0x3264aa)["trim"](),'videoDuration':Number(result?.["videoDuration"]||result?.["duration"]||0x0)||0x0,'videoWidth':Number(result?.["videoWidth"]||result?.["width"]||0x0)||0x0,'videoHeight':Number(result?.["videoHeight"]||result?.["height"]||0x0)||0x0,'videoFps':Number(result?.["videoFps"]||result?.['fps']||0x0)||0x0,'fps':Number(result?.["fps"]||result?.["videoFps"]||0x0)||0x0,'needsAutoResize':![],'fixedSize':!![]});}

async function composeMediaSourcesNearNode({mediaKind:mediaKind='',srcs:srcs=[],anchorNode:anchorNode=null,triggerEl:triggerEl=null}={}){const _0x542bbe=MEDIA_COMPOSE_CONFIG[mediaKind];if(!_0x542bbe)return null;const _0x4de1e4=(Array['isArray'](srcs)?srcs:[])["map"](_0x2d83df=>String(_0x2d83df||'')["trim"]())["filter"](Boolean);if(_0x4de1e4['length']<0x2)return window["showToast"]?.(mediaComposeText(_0x542bbe,'invalidSource'),"error"),null;triggerEl&&(triggerEl["dataset"]["loading"]="true",triggerEl['disabled']=!![]);window['showToast']?.(mediaComposeText(_0x542bbe,'progress'),"info");try{const _0x41744e=await runMediaComposeRequest(_0x542bbe,_0x4de1e4),_0x281f5a=pickResultLocalPath(_0x41744e);if(!_0x41744e['success']||!_0x281f5a)throw new Error(_0x41744e['error']||_0x41744e["message"]||mediaComposeText(_0x542bbe,'fallback'));const _0x4fde85=appStore['getState'](),_0x37bf5c=_0x4fde85["nodes"]||{},{width:_0x29b682,height:_0x135e3d}=getResultNodeSize(mediaKind,anchorNode),_0x526183=calcSafeSpawnPosNearNode(_0x37bf5c,anchorNode||{},_0x29b682,_0x135e3d),_0x4ada44=generateId(_0x542bbe["resultIdPrefix"]);return appStore["addNode"](buildComposedNodePayload(mediaKind,_0x542bbe,{'id':_0x4ada44,'x':_0x526183['x'],'y':_0x526183['y'],'width':_0x29b682,'height':_0x135e3d,'localPath':_0x281f5a,'result':_0x41744e})),appStore['setSelectedNodes']([_0x4ada44]),commit(),window["_triggerLocalCacheSave"]?.(),window["showToast"]?.(mediaComposeText(_0x542bbe,"success"),"success"),{'nodeId':_0x4ada44,'localPath':_0x281f5a,'data':_0x41744e};}catch(_0x42ea93){const _0x2064ee=_0x42ea93 instanceof Error?_0x42ea93["message"]:String(_0x42ea93||mediaComposeText(_0x542bbe,"fallback"));return window['showToast']?.(mediaComposeText(_0x542bbe,'failedWithMessage',{'message':_0x2064ee}),"error"),null;}finally{triggerEl&&(triggerEl['dataset']["loading"]="false",triggerEl["disabled"]=![]);}}

export async function composeAudioSourcesNearNode({srcs:srcs=[],anchorNode:anchorNode=null,triggerEl:triggerEl=null}={}){return composeMediaSourcesNearNode({'mediaKind':'audio','srcs':srcs,'anchorNode':anchorNode,'triggerEl':triggerEl});}

export async function composeAudioVoiceTimelineNearNode({sourceKind:sourceKind="video",src:src='',clips:clips=[],durationSec:durationSec=0x0,anchorNode:anchorNode=null,triggerEl:triggerEl=null}={}){const _0x24731b=sourceKind==='audio'?'audio':"video",_0x56e45a=String(src||'')["trim"](),_0x45222c=(Array['isArray'](clips)?clips:[])["filter"](_0x1bae92=>_0x1bae92?.["src"]);if(!_0x56e45a||_0x45222c["length"]<=0x0)return window["showToast"]?.(audioVoiceComposeText("invalidSource"),"error"),null;if(!canUseElectronMediaTask())return window["showToast"]?.(audioVoiceComposeText('missingTask'),"error"),null;triggerEl&&(triggerEl["dataset"]["loading"]="true",triggerEl['disabled']=!![]);window["showToast"]?.(audioVoiceComposeText(_0x24731b==='video'?"videoProgress":"audioProgress"),"info");try{const _0x2ab6ac=await enqueueElectronMediaTask({'kind':'audioVoiceCompose','src':_0x56e45a,'args':{'sourceKind':_0x24731b,'durationSec':durationSec,'clips':_0x45222c}},{'wait':!![],'timeout':0x927c0}),_0x380ee1=pickResultLocalPath(_0x2ab6ac);if(!_0x2ab6ac?.["success"]||!_0x380ee1)throw new Error(_0x2ab6ac?.["error"]||_0x2ab6ac?.["message"]||audioVoiceComposeText('fallback'));const _0x1a1e55=appStore["getState"](),_0xc65869=_0x1a1e55["nodes"]||{},{width:_0x354d4f,height:_0x3caa36}=getResultNodeSize(_0x24731b,anchorNode),_0x222f77=calcSafeSpawnPosNearNode(_0xc65869,anchorNode||{},_0x354d4f,_0x3caa36),_0x2ff7b7=generateId(_0x24731b==="audio"?"source-audio-voice-compose":"source-video-voice-compose");return appStore["addNode"](buildAudioVoiceComposedNodePayload(_0x24731b,{'id':_0x2ff7b7,'x':_0x222f77['x'],'y':_0x222f77['y'],'width':_0x354d4f,'height':_0x3caa36,'localPath':_0x380ee1,'result':_0x2ab6ac})),appStore["setSelectedNodes"]([_0x2ff7b7]),commit(),window["_triggerLocalCacheSave"]?.(),window["showToast"]?.(audioVoiceComposeText(_0x24731b==='video'?"videoSuccess":"audioSuccess"),"success"),{'nodeId':_0x2ff7b7,'localPath':_0x380ee1,'data':_0x2ab6ac};}catch(_0x15d276){const _0x5aed65=_0x15d276 instanceof Error?_0x15d276["message"]:String(_0x15d276||audioVoiceComposeText("fallback"));return window['showToast']?.(audioVoiceComposeText("failedWithMessage",{'message':_0x5aed65}),"error"),null;}finally{triggerEl&&(triggerEl["dataset"]["loading"]="false",triggerEl["disabled"]=![]);}}
