import { cutVideoRangeToLocal } from '../../services/videoCutService.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { getSegmentRetakeValidation } from './segmentRetakeSession.js';
import {
  applySegmentRetakeSubmitParameterPolicy,
  decorateSegmentRetakeParameterNodeData,
  isSegmentRetakeModelSupported,
} from './segmentRetakeModelPolicy.js';
import { t } from '../../i18n/index.js';
import { commit } from '../history.js';
import { bindSegmentRetakeInput, getSegmentRetakeVideoEdges } from './segmentRetakeInputBinding.js';
const VALIDATION_I18N_KEY_BY_REASON = Object['freeze']({
  'range-too-short': 'rangeTooShort',
  'range-too-long': 'rangeTooLong',
  'annotation-outside-range': 'annotationOutsideRange',
  'clip-unavailable': 'clipUnavailable',
  'range-changed': 'rangeChanged',
  'unsupported-model': 'unsupportedModel',
});
export function getSegmentRetakeSubmitErrorKey(value) {
  return VALIDATION_I18N_KEY_BY_REASON[String(value || '')] || 'clipUnavailable';
}
export function validateSegmentRetakeSubmitNode(options = {}) {
  const enabled = options?.['segmentRetake'];
  if (!enabled) return { ok: !![], reason: '', isSegmentRetake: ![] };
  if (!isSegmentRetakeModelSupported(options?.['model']))
    return { ok: ![], reason: 'unsupported-model', isSegmentRetake: !![] };
  return { ...getSegmentRetakeValidation(enabled), isSegmentRetake: !![] };
}
function buildClipSignature(options2 = {}) {
  return [
    options2['sourceMediaKey'] || options2['sourceLocalPath'] || options2['sourceUrl'] || '',
    Number(options2['range']?.['startSec']) || 0,
    Number(options2['range']?.['endSec']) || 0,
  ]['join']('|');
}
function isVideoProviderAssetRef(options3 = {}) {
  const item = String(options3['sourceKind'] || options3['kind'] || options3['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return item === 'video';
}
function replaceVideoInputs(enabled2, url, duration) {
  if (!enabled2 || typeof enabled2 !== 'object') return;
  const args = Array['isArray'](enabled2['videoEntries']) ? enabled2['videoEntries'][0] || {} : {};
  ((enabled2['videos'] = [url]),
    (enabled2['videoEntries'] = [{ ...args, url: url, duration: duration }]),
    Array['isArray'](enabled2['videoRefs']) &&
      (enabled2['videoRefs'] = [{ refSlot: 'referenceVideo', url: url }]),
    Array['isArray'](enabled2['providerAssetRefs']) &&
      (enabled2['providerAssetRefs'] = enabled2['providerAssetRefs']['filter'](
        (key) => !isVideoProviderAssetRef(key),
      )));
}
export async function prepareSegmentRetakeSubmit({
  nodeData: nodeData,
  inputMaterials: inputMaterials,
  nodeId: nodeId,
  cutVideoRange: cutVideoRange = cutVideoRangeToLocal,
  getLatestNodeData: getLatestNodeData,
} = {}) {
  const startSec = nodeData?.['segmentRetake'];
  if (!startSec) return { ok: !![], inputMaterials: inputMaterials, nodePatch: null, payloadPatch: null };
  const response = validateSegmentRetakeSubmitNode(nodeData);
  if (!response['ok'])
    return { ...response, inputMaterials: inputMaterials, nodePatch: null, payloadPatch: null };
  const signature = buildClipSignature(startSec),
    src = localPathToUrl(startSec['sourceLocalPath']) || String(startSec['sourceUrl'] || '')['trim'](),
    fullLength =
      Number(startSec['sourceDurationSec']) > 0 &&
      Math['abs'](Number(startSec['range']['startSec'])) <= 0.001 &&
      Math['abs'](Number(startSec['range']['endSec']) - Number(startSec['sourceDurationSec'])) <= 0.001;
  let localPath = '',
    materializedClip = startSec['materializedClip'];
  if (fullLength) materializedClip = null;
  else {
    if (materializedClip?.['signature'] === signature && materializedClip?.['localPath'])
      localPath = String(materializedClip['localPath'])['trim']();
    else {
      const cutVideoRange2 = await cutVideoRange({
        src: src,
        startSec: startSec['range']['startSec'],
        endSec: startSec['range']['endSec'],
        nodeId: nodeId,
      });
      ((localPath = String(cutVideoRange2?.['localPath'] || '')['trim']()),
        (materializedClip = {
          signature: signature,
          localPath: localPath,
          durationSec: Number(startSec['range']['endSec']) - Number(startSec['range']['startSec']),
        }));
    }
  }
  const enabled3 = getLatestNodeData?.();
  if (
    getLatestNodeData &&
    (!enabled3?.['segmentRetake'] || buildClipSignature(enabled3['segmentRetake']) !== signature)
  )
    return {
      ok: ![],
      reason: 'range-changed',
      inputMaterials: inputMaterials,
      nodePatch: null,
      payloadPatch: null,
    };
  const enabled4 = fullLength ? src : localPathToUrl(localPath);
  if (!enabled4)
    return {
      ok: ![],
      reason: 'clip-unavailable',
      inputMaterials: inputMaterials,
      nodePatch: null,
      payloadPatch: null,
    };
  const index = fullLength ? Number(startSec['sourceDurationSec']) : materializedClip['durationSec'];
  return (
    replaceVideoInputs(inputMaterials?.['modelApi'], enabled4, index),
    replaceVideoInputs(inputMaterials?.['dreamina'], enabled4, index),
    {
      ok: !![],
      fullLength: fullLength,
      inputMaterials: inputMaterials,
      nodePatch: {
        segmentRetake: { ...(enabled3?.['segmentRetake'] || startSec), materializedClip: materializedClip },
      },
      payloadPatch: { omniReferenceTaskType: 'edit', videos: [enabled4] },
    }
  );
}
export async function applySegmentRetakeTaskPayload(
  nodeData2,
  {
    inputMaterials: inputMaterials2,
    payload: payload,
    store: store,
    cutVideoRange: cutVideoRange3,
    commitHistory: commitHistory = commit,
  } = {},
) {
  const result = store?.['getStateRaw']?.()?.['nodes'],
    handler = () =>
      JSON['stringify'](
        getSegmentRetakeVideoEdges(store, nodeData2['nodeId'])['map'](
          ({
            id: id,
            sourceId: sourceId,
            targetId: targetId,
            sourceMediaKey: sourceMediaKey,
            refSlot: refSlot,
          }) => ({
            id: id,
            sourceId: sourceId,
            targetId: targetId,
            sourceMediaKey: sourceMediaKey,
            refSlot: refSlot,
          }),
        ),
      ),
    data = nodeData2?.['_data']?.['segmentRetake'] ? handler() : '',
    getLatestNodeData2 = () => {
      if (result && store['getStateRaw']()['nodes'] !== result) return null;
      if (data !== handler()) return null;
      return store['getState']()['nodes']?.[nodeData2?.['nodeId']];
    },
    nodePatch = await prepareSegmentRetakeSubmit({
      nodeData: nodeData2?.['_data'],
      inputMaterials: inputMaterials2,
      nodeId: nodeData2?.['nodeId'],
      cutVideoRange: cutVideoRange3,
      getLatestNodeData: getLatestNodeData2,
    }),
    enabled5 = nodePatch['nodePatch'] ? getLatestNodeData2()?.['segmentRetake'] : null;
  nodePatch['nodePatch'] &&
    (!enabled5 ||
      buildClipSignature(enabled5) !== buildClipSignature(nodePatch['nodePatch']['segmentRetake'])) &&
    ((nodePatch['ok'] = ![]), (nodePatch['reason'] = 'range-changed'));
  if (!nodePatch['ok']) {
    const segmentRetakeSubmitErrorKey = getSegmentRetakeSubmitErrorKey(nodePatch['reason']);
    return (
      globalThis['window']?.['showToast']?.(t('segmentRetake.errors.' + segmentRetakeSubmitErrorKey), 'warn'),
      ![]
    );
  }
  if (nodePatch['nodePatch']) {
    const bindSegmentRetakeInput2 = bindSegmentRetakeInput({
      store: store,
      nodeId: nodeData2['nodeId'],
      nodePatch: nodePatch['nodePatch'],
      fullLength: nodePatch['fullLength'],
    });
    ((nodeData2['_data'] = { ...(nodeData2['_data'] || {}), ...nodePatch['nodePatch'] }),
      bindSegmentRetakeInput2 && (commitHistory(), globalThis['window']?.['_triggerLocalCacheSave']?.()));
  }
  return (
    Object['assign'](payload, nodePatch['payloadPatch'] || {}),
    (nodeData2['_data'] = decorateSegmentRetakeParameterNodeData(nodeData2['_data'] || {})),
    applySegmentRetakeSubmitParameterPolicy(nodeData2['_data'], payload),
    !![]
  );
}
