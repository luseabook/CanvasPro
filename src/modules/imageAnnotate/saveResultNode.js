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
