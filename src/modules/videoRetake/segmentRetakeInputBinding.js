import { findAvailablePosition, generateId } from '../../core/math.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../../services/fileService.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { getNodeSpawnPrefs } from '../nodeSpawn.js';
import { calcSegmentRetakeInputStart } from './segmentRetakeSession.js';
import { t } from '../../i18n/index.js';
export function getSegmentRetakeVideoEdges(_0x213bba, _0x3577b7) {
  const _0x3ae47d = _0x213bba['getState']();
  return _0x213bba['getIncomingEdges'](_0x3577b7)['filter'](
    (_0x3051f) =>
      String(_0x3ae47d['nodes']?.[_0x3051f['sourceId']]?.['type'] || '')['includes']('video') ||
      _0x3051f['refSlot'] === 'referenceVideo',
  );
}
function createClipNode(_0x1a3d46, _0x17a11c, _0x403f2b, _0x15484d) {
  const _0x9ef7c4 = _0x1a3d46['nodes']?.[_0x403f2b['sourceNodeId']] || _0x17a11c,
    _0x2e9636 = getAutoMediaSizeByShortSide(_0x17a11c['width'] || 0x230, _0x17a11c['height'] || 0x13b),
    { spacing: _0xb5ae2e, direction: _0x51a487, avoidOverlap: _0x509f54 } = getNodeSpawnPrefs(),
    _0x3f5877 = calcSegmentRetakeInputStart({
      targetNode: _0x17a11c,
      itemWidth: _0x2e9636['width'],
      itemHeight: _0x2e9636['height'],
      spacing: _0xb5ae2e,
      direction: _0x51a487,
    }),
    _0x870be9 = _0x509f54
      ? findAvailablePosition(
          _0x1a3d46['nodes'],
          _0x3f5877['x'],
          _0x3f5877['y'],
          _0x2e9636['width'],
          _0x2e9636['height'],
          _0xb5ae2e,
          'down',
        )
      : _0x3f5877,
    _0x357f76 = localPathToUrl(_0x15484d['localPath']);
  return buildSourceMediaNodePayload({
    id: generateId('source-video-retake'),
    type: 'source-video',
    x: _0x870be9['x'],
    y: _0x870be9['y'],
    ..._0x2e9636,
    name: t('videoClip.cut.newNodeName', { name: _0x9ef7c4['name'] || t('videoClip.cut.videoFallback') }),
    src: _0x357f76,
    videoUrl: _0x357f76,
    videoThumbSrc: _0x357f76,
    localPath: _0x15484d['localPath'],
    originalLocalPath: _0x15484d['localPath'],
    videoDuration: _0x15484d['durationSec'],
    needsAutoResize: ![],
    fixedSize: !![],
  });
}
export function bindSegmentRetakeInput({
  store: _0x267da5,
  nodeId: _0x59e887,
  nodePatch: _0x5e0a51,
  fullLength: _0x12b2a8,
}) {
  const _0x591f3b = _0x267da5['getState'](),
    _0xcaf27a = _0x591f3b['nodes'][_0x59e887],
    _0x5c922c = _0x5e0a51['segmentRetake'],
    _0x21e40d = _0x5c922c['materializedClip'];
  let _0x667395 = _0x12b2a8
      ? _0x591f3b['nodes'][_0x5c922c['sourceNodeId']]
      : _0x591f3b['nodes'][_0x21e40d?.['nodeId']],
    _0x400990 = null;
  !_0x12b2a8 &&
    (_0x667395?.['type'] !== 'source-video' || _0x667395['localPath'] !== _0x21e40d['localPath']) &&
    ((_0x400990 = createClipNode(_0x591f3b, _0xcaf27a, _0x5c922c, _0x21e40d)), (_0x667395 = _0x400990));
  !_0x12b2a8 && (_0x5c922c['materializedClip'] = { ..._0x21e40d, nodeId: _0x667395['id'] });
  const _0x313ef9 = getSegmentRetakeVideoEdges(_0x267da5, _0x59e887),
    _0x3e3894 = _0x12b2a8
      ? _0x5c922c['sourceMediaKey'] || _0x5c922c['sourceLocalPath'] || _0x5c922c['sourceUrl']
      : _0x21e40d['localPath'],
    _0x47d9e7 = _0x313ef9['find'](
      (_0x313050) =>
        _0x313050['sourceId'] === _0x667395?.['id'] &&
        (!_0x313050['sourceMediaKey'] || _0x313050['sourceMediaKey'] === _0x3e3894),
    ),
    _0x10be39 = _0x667395 ? _0x313ef9['filter']((_0x1a3182) => _0x1a3182 !== _0x47d9e7) : [],
    _0x3f8bc6 =
      _0x667395 && !_0x47d9e7
        ? {
            id: generateId('edge-retake-video'),
            sourceId: _0x667395['id'],
            targetId: _0x59e887,
            refSlot: 'referenceVideo',
            sourceMediaKey: _0x3e3894,
          }
        : null;
  return (
    _0x267da5['batch'](() => {
      if (_0x400990) _0x267da5['addNode'](_0x400990);
      _0x10be39['forEach']((_0x391272) => _0x267da5['removeEdge'](_0x391272['id']));
      if (_0x3f8bc6) _0x267da5['addEdge'](_0x3f8bc6);
      _0x267da5['updateNodeData'](_0x59e887, _0x5e0a51);
    }),
    Boolean(_0x400990 || _0x3f8bc6 || _0x10be39['length'])
  );
}
