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
export function getSegmentRetakeSubmitErrorKey(_0x4ba329) {
  return VALIDATION_I18N_KEY_BY_REASON[String(_0x4ba329 || '')] || 'clipUnavailable';
}
export function validateSegmentRetakeSubmitNode(_0x467030 = {}) {
  const _0x3d98ed = _0x467030?.['segmentRetake'];
  if (!_0x3d98ed) return { ok: !![], reason: '', isSegmentRetake: ![] };
  if (!isSegmentRetakeModelSupported(_0x467030?.['model']))
    return { ok: ![], reason: 'unsupported-model', isSegmentRetake: !![] };
  return { ...getSegmentRetakeValidation(_0x3d98ed), isSegmentRetake: !![] };
}
function buildClipSignature(_0x400ad4 = {}) {
  return [
    _0x400ad4['sourceMediaKey'] || _0x400ad4['sourceLocalPath'] || _0x400ad4['sourceUrl'] || '',
    Number(_0x400ad4['range']?.['startSec']) || 0x0,
    Number(_0x400ad4['range']?.['endSec']) || 0x0,
  ]['join']('|');
}
function isVideoProviderAssetRef(_0x157335 = {}) {
  const _0x3bc000 = String(_0x157335['sourceKind'] || _0x157335['kind'] || _0x157335['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return _0x3bc000 === 'video';
}
function replaceVideoInputs(_0x37236a, _0x13c855, _0x11d85a) {
  if (!_0x37236a || typeof _0x37236a !== 'object') return;
  const _0x4f36bd = Array['isArray'](_0x37236a['videoEntries']) ? _0x37236a['videoEntries'][0x0] || {} : {};
  ((_0x37236a['videos'] = [_0x13c855]),
    (_0x37236a['videoEntries'] = [{ ..._0x4f36bd, url: _0x13c855, duration: _0x11d85a }]),
    Array['isArray'](_0x37236a['videoRefs']) &&
      (_0x37236a['videoRefs'] = [{ refSlot: 'referenceVideo', url: _0x13c855 }]),
    Array['isArray'](_0x37236a['providerAssetRefs']) &&
      (_0x37236a['providerAssetRefs'] = _0x37236a['providerAssetRefs']['filter'](
        (_0x255f7f) => !isVideoProviderAssetRef(_0x255f7f),
      )));
}
export async function prepareSegmentRetakeSubmit({
  nodeData: _0x250e81,
  inputMaterials: _0x400c03,
  nodeId: _0xdc63ee,
  cutVideoRange: cutVideoRange = cutVideoRangeToLocal,
  getLatestNodeData: _0x41b320,
} = {}) {
  const _0x1e51b8 = _0x250e81?.['segmentRetake'];
  if (!_0x1e51b8) return { ok: !![], inputMaterials: _0x400c03, nodePatch: null, payloadPatch: null };
  const _0x467e83 = validateSegmentRetakeSubmitNode(_0x250e81);
  if (!_0x467e83['ok'])
    return { ..._0x467e83, inputMaterials: _0x400c03, nodePatch: null, payloadPatch: null };
  const _0xb1f0fc = buildClipSignature(_0x1e51b8),
    _0x1dca74 =
      localPathToUrl(_0x1e51b8['sourceLocalPath']) || String(_0x1e51b8['sourceUrl'] || '')['trim'](),
    _0xa78700 =
      Number(_0x1e51b8['sourceDurationSec']) > 0x0 &&
      Math['abs'](Number(_0x1e51b8['range']['startSec'])) <= 0.001 &&
      Math['abs'](Number(_0x1e51b8['range']['endSec']) - Number(_0x1e51b8['sourceDurationSec'])) <= 0.001;
  let _0x5efab3 = '',
    _0x3cd0bd = _0x1e51b8['materializedClip'];
  if (_0xa78700) _0x3cd0bd = null;
  else {
    if (_0x3cd0bd?.['signature'] === _0xb1f0fc && _0x3cd0bd?.['localPath'])
      _0x5efab3 = String(_0x3cd0bd['localPath'])['trim']();
    else {
      const _0x32fa0e = await cutVideoRange({
        src: _0x1dca74,
        startSec: _0x1e51b8['range']['startSec'],
        endSec: _0x1e51b8['range']['endSec'],
        nodeId: _0xdc63ee,
      });
      ((_0x5efab3 = String(_0x32fa0e?.['localPath'] || '')['trim']()),
        (_0x3cd0bd = {
          signature: _0xb1f0fc,
          localPath: _0x5efab3,
          durationSec: Number(_0x1e51b8['range']['endSec']) - Number(_0x1e51b8['range']['startSec']),
        }));
    }
  }
  const _0x4d82e5 = _0x41b320?.();
  if (
    _0x41b320 &&
    (!_0x4d82e5?.['segmentRetake'] || buildClipSignature(_0x4d82e5['segmentRetake']) !== _0xb1f0fc)
  )
    return {
      ok: ![],
      reason: 'range-changed',
      inputMaterials: _0x400c03,
      nodePatch: null,
      payloadPatch: null,
    };
  const _0x21b6db = _0xa78700 ? _0x1dca74 : localPathToUrl(_0x5efab3);
  if (!_0x21b6db)
    return {
      ok: ![],
      reason: 'clip-unavailable',
      inputMaterials: _0x400c03,
      nodePatch: null,
      payloadPatch: null,
    };
  const _0x49f3b6 = _0xa78700 ? Number(_0x1e51b8['sourceDurationSec']) : _0x3cd0bd['durationSec'];
  return (
    replaceVideoInputs(_0x400c03?.['modelApi'], _0x21b6db, _0x49f3b6),
    replaceVideoInputs(_0x400c03?.['dreamina'], _0x21b6db, _0x49f3b6),
    {
      ok: !![],
      fullLength: _0xa78700,
      inputMaterials: _0x400c03,
      nodePatch: {
        segmentRetake: { ...(_0x4d82e5?.['segmentRetake'] || _0x1e51b8), materializedClip: _0x3cd0bd },
      },
      payloadPatch: { omniReferenceTaskType: 'edit', videos: [_0x21b6db] },
    }
  );
}
export async function applySegmentRetakeTaskPayload(
  _0x13d98f,
  {
    inputMaterials: _0x117cec,
    payload: _0xefdfe4,
    store: _0x244ccd,
    cutVideoRange: _0x32feb1,
    commitHistory: commitHistory = commit,
  } = {},
) {
  const _0x4a647c = _0x244ccd?.['getStateRaw']?.()?.['nodes'],
    _0x38c7ea = () =>
      JSON['stringify'](
        getSegmentRetakeVideoEdges(_0x244ccd, _0x13d98f['nodeId'])['map'](
          ({
            id: _0x33af15,
            sourceId: _0x19841c,
            targetId: _0x1079c5,
            sourceMediaKey: _0x323007,
            refSlot: _0x3d504a,
          }) => ({
            id: _0x33af15,
            sourceId: _0x19841c,
            targetId: _0x1079c5,
            sourceMediaKey: _0x323007,
            refSlot: _0x3d504a,
          }),
        ),
      ),
    _0x473480 = _0x13d98f?.['_data']?.['segmentRetake'] ? _0x38c7ea() : '',
    _0xf3afb3 = () => {
      if (_0x4a647c && _0x244ccd['getStateRaw']()['nodes'] !== _0x4a647c) return null;
      if (_0x473480 !== _0x38c7ea()) return null;
      return _0x244ccd['getState']()['nodes']?.[_0x13d98f?.['nodeId']];
    },
    _0x26ae8d = await prepareSegmentRetakeSubmit({
      nodeData: _0x13d98f?.['_data'],
      inputMaterials: _0x117cec,
      nodeId: _0x13d98f?.['nodeId'],
      cutVideoRange: _0x32feb1,
      getLatestNodeData: _0xf3afb3,
    }),
    _0x3423b5 = _0x26ae8d['nodePatch'] ? _0xf3afb3()?.['segmentRetake'] : null;
  _0x26ae8d['nodePatch'] &&
    (!_0x3423b5 ||
      buildClipSignature(_0x3423b5) !== buildClipSignature(_0x26ae8d['nodePatch']['segmentRetake'])) &&
    ((_0x26ae8d['ok'] = ![]), (_0x26ae8d['reason'] = 'range-changed'));
  if (!_0x26ae8d['ok']) {
    const _0x1cf628 = getSegmentRetakeSubmitErrorKey(_0x26ae8d['reason']);
    return (globalThis['window']?.['showToast']?.(t('segmentRetake.errors.' + _0x1cf628), 'warn'), ![]);
  }
  if (_0x26ae8d['nodePatch']) {
    const _0x1aa5bd = bindSegmentRetakeInput({
      store: _0x244ccd,
      nodeId: _0x13d98f['nodeId'],
      nodePatch: _0x26ae8d['nodePatch'],
      fullLength: _0x26ae8d['fullLength'],
    });
    ((_0x13d98f['_data'] = { ...(_0x13d98f['_data'] || {}), ..._0x26ae8d['nodePatch'] }),
      _0x1aa5bd && (commitHistory(), globalThis['window']?.['_triggerLocalCacheSave']?.()));
  }
  return (
    Object['assign'](_0xefdfe4, _0x26ae8d['payloadPatch'] || {}),
    (_0x13d98f['_data'] = decorateSegmentRetakeParameterNodeData(_0x13d98f['_data'] || {})),
    applySegmentRetakeSubmitParameterPolicy(_0x13d98f['_data'], _0xefdfe4),
    !![]
  );
}
