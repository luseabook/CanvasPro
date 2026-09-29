import { buildGenerationStartPatch } from '../../core/generationTaskLifecycle.js';
import { addToolbarPendingResultNodes, persistToolbarResultNodes, updateToolbarResultNode } from '../toolbarPendingResultNodes.js';
import { buildCanvasLocalImageFields } from '../../services/canvasMediaLocalService.js';
import { buildImageGenerationFailurePatch, buildImageGenerationResultPatch } from '../../components/aigenImage/imageGenerationResultRenderer.js';
import appStore from '../../core/stores/appStore.js';
import { generateId } from '../../core/math.js';
import { commit } from '../history.js';
import { calcSafeSpawnPosNearNode } from '../nodeSpawn.js';
import { saveOutputBlob } from '../project.js';
import { buildSourceMediaNodePayload } from '../../services/fileService.js';
import { localPathToUrl, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { t } from '../../i18n/index.js';
function imageAnnotateOutputText(_0x20565b, _0x220fed = {}) {
  return t('imageAnnotate.output.' + _0x20565b, _0x220fed);
}
export const getSavedAnnotateNodeName = (_0x504754, _0x1527be) => {
  const _0x2d78cb = _0x1527be || imageAnnotateOutputText('baseImage');
  if (_0x504754 === 'repaint') return imageAnnotateOutputText('repaintName', { baseName: _0x2d78cb });
  if (_0x504754 === 'erase') return imageAnnotateOutputText('eraseName', { baseName: _0x2d78cb });
  return imageAnnotateOutputText('annotateName', { baseName: _0x2d78cb });
};
export const getSavedAnnotateSuccessLabel = (_0x4b57f2) => {
  if (_0x4b57f2 === 'repaint') return imageAnnotateOutputText('repaintCreated');
  if (_0x4b57f2 === 'erase') return imageAnnotateOutputText('eraseCreated');
  return imageAnnotateOutputText('annotateCreated');
};
export const saveAnnotateExportResult = async ({
  blob: _0x5577d9,
  exportType: _0x1011ee,
  scene: _0x2764fe,
  sourceNodeId: _0xb0c9af,
  baseNode: _0x425ee4,
  notify: notify = (_0x246bc0, _0x289cc8) => window.showToast?.(_0x246bc0, _0x289cc8),
  triggerLocalCacheSave: triggerLocalCacheSave = () => window._triggerLocalCacheSave?.(),
} = {}) => {
  const _0x21cd2c = _0x1011ee === 'image/png' ? 'png' : 'jpg',
    _0x404d39 = generateId('annotate'),
    _0x58608d = new File([_0x5577d9], 'annotate_' + _0x404d39 + '.' + _0x21cd2c, { type: _0x1011ee }),
    _0x31bc0a = await saveOutputBlob(_0x58608d, { ext: _0x21cd2c }),
    _0x2c25a7 = pickResultLocalPath(_0x31bc0a),
    _0x253e9b = localPathToUrl(_0x2c25a7) || String(_0x31bc0a.url || '').trim(),
    _0x24292d = appStore.getState().nodes?.[_0xb0c9af],
    _0x53b539 = _0x24292d || _0x425ee4 || {},
    _0x4c5e01 = _0x53b539.width || 0x104,
    _0x477755 = _0x53b539.height || 0x104,
    _0x22fe84 = calcSafeSpawnPosNearNode(appStore.getState().nodes, _0x53b539, _0x4c5e01, _0x477755),
    _0x57b021 = generateId('source-image');
  return (
    appStore.addNode(
      buildSourceMediaNodePayload({
        id: _0x57b021,
        type: 'source-image',
        x: _0x22fe84.x,
        y: _0x22fe84.y,
        width: _0x4c5e01,
        height: _0x477755,
        name: getSavedAnnotateNodeName(_0x2764fe, _0x53b539.name),
        src: _0x253e9b,
        localPath: _0x2c25a7,
        fileName: _0x31bc0a.filename || _0x58608d.name,
        fixedSize: true,
        needsAutoResize: false,
      }),
    ),
    appStore.setSelectedNodes([_0x57b021]),
    commit(),
    window.v2FocusOnNodes && window.v2FocusOnNodes([_0xb0c9af, _0x57b021]),
    triggerLocalCacheSave(),
    notify(getSavedAnnotateSuccessLabel(_0x2764fe), 'success'),
    { newNodeId: _0x57b021, localPath: _0x2c25a7, srcUrl: _0x253e9b, response: _0x31bc0a }
  );
};

function imageAnnotateActionText(_0xe110e2,_0x1522b3={}){return t("imageAnnotate.actions."+_0xe110e2,_0x1522b3);}

function resolveAnnotateResultBaseNode(_0x56d44d,_0x4f5f46){return appStore["getState"]()["nodes"]?.[_0x56d44d]||_0x4f5f46||{};}

function resolveAnnotateResultLayout(_0x359eb0,_0x1ecdda,_0x14a648){const _0x1a4699=resolveAnnotateResultBaseNode(_0x359eb0,_0x1ecdda),_0x31f4ee=_0x14a648?.["width"]||_0x1a4699["width"]||0x104,_0x36d4e2=_0x14a648?.["height"]||_0x1a4699["height"]||0x104,_0x4f58c8=calcSafeSpawnPosNearNode(appStore['getState']()["nodes"],_0x1a4699,_0x31f4ee,_0x36d4e2);return{'baseNode':_0x1a4699,'width':_0x31f4ee,'height':_0x36d4e2,'x':_0x4f58c8['x'],'y':_0x4f58c8['y']};}

export const createPendingAnnotateExportNode=({scene:_0x1b53ae,sourceNodeId:_0x42cfdc,baseNode:_0x16cb44,startedAt:startedAt=Date["now"](),outputSize:_0x87448d}={})=>{const _0x46d7ca=resolveAnnotateResultLayout(_0x42cfdc,_0x16cb44,_0x87448d),_0x1bfe6e=generateId("source-image"),_0x1b01fd=buildSourceMediaNodePayload({'id':_0x1bfe6e,'type':"source-image",'x':_0x46d7ca['x'],'y':_0x46d7ca['y'],'width':_0x46d7ca["width"],'height':_0x46d7ca["height"],'name':getSavedAnnotateNodeName(_0x1b53ae,_0x46d7ca["baseNode"]["name"]),'src':'','outputText':imageAnnotateActionText("saving"),...buildGenerationStartPatch({'startedAt':startedAt}),'fixedSize':!![],'needsAutoResize':![]});return addToolbarPendingResultNodes({'nodes':[_0x1b01fd]}),{'newNodeId':_0x1bfe6e,'baseNode':_0x46d7ca["baseNode"],'startedAt':startedAt};};

function buildSavedAnnotateResultPatch({scene:_0x140db4,baseNode:_0x258534,saveResult:_0x386ddc,fileName:_0xc5fff3,startedAt:startedAt=0x0}){const _0x1a6545=pickResultLocalPath(_0x386ddc),_0x381459=buildCanvasLocalImageFields({..._0x386ddc,'localPath':_0x1a6545,'imageUrl':_0x386ddc?.["displayUrl"]||_0x386ddc?.['thumbUrl']||localPathToUrl(_0x1a6545)||String(_0x386ddc?.['url']||'')["trim"](),'sourceUrl':_0x386ddc?.["originalUrl"]||_0x386ddc?.["url"]||localPathToUrl(_0x1a6545),'thumbUrl':_0x386ddc?.['thumbUrl'],'fileName':_0xc5fff3},{'includeSrc':!![]}),_0x1b321a=_0x381459["src"]||_0x381459['imageUrl']||localPathToUrl(_0x1a6545)||String(_0x386ddc?.["url"]||'')["trim"](),_0x8ba22f=buildImageGenerationResultPatch({..._0x386ddc,..._0x381459,'imageUrl':_0x381459["imageUrl"]||_0x1b321a,'sourceUrl':_0x381459["sourceUrl"]||_0x1b321a,'thumbUrl':_0x381459["thumbUrl"]||_0x1b321a,'localPath':_0x381459['localPath']||_0x1a6545,'fileName':_0xc5fff3},{'startedAt':startedAt})||{};return{'name':getSavedAnnotateNodeName(_0x140db4,_0x258534?.['name']),..._0x8ba22f,..._0x381459,'src':_0x1b321a,'localPath':_0x381459["localPath"]||_0x1a6545,'fileName':_0xc5fff3,'outputText':'','fixedSize':!![],'needsAutoResize':![]};}

export const markAnnotateExportNodeFailed=({targetNodeId:_0x1eb113,error:_0x22568e,startedAt:startedAt=0x0}={})=>{const _0x566e85=String(_0x1eb113||'')["trim"]();if(!_0x566e85)return![];const _0x1593af=updateToolbarResultNode(_0x566e85,buildImageGenerationFailurePatch({'error':_0x22568e instanceof Error?_0x22568e['message']:String(_0x22568e||''),'startedAt':startedAt})||{});if(_0x1593af)persistToolbarResultNodes();return _0x1593af;};
