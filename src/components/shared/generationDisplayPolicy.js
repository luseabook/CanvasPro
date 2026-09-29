import { AI_GENERATION_NODE_SHORT_SIDE } from '../../services/fileService.js';
import {
  getGenerationRatioSizeWithDom,
  pickGenerationRatioSourceEdge,
} from '../../modules/generationRatioSource.js';
import { getModelManifest, resolveModelExecution, resolveModelProvider } from '../../manifests/index.js';
export const AI_IMAGE_MIN_SIZE = 0x96;
export const GENERATION_MANUAL_DISPLAY_SIZE_FIELD = 'manualDisplaySize';
function isAdaptiveImageRatio(_0x3d7e52) {
  const _0x45ee33 = String(_0x3d7e52 || '')['trim'](),
    _0x4ee8dc = _0x45ee33['toLowerCase']();
  return !_0x45ee33 || _0x45ee33 === '自适应' || _0x4ee8dc === 'auto' || _0x4ee8dc === 'adaptive';
}
export function isAdaptiveImageAspectRatioValue(_0x416984) {
  return isAdaptiveImageRatio(_0x416984);
}
function getPlainObject(_0x4458ee) {
  return _0x4458ee && typeof _0x4458ee === 'object' && !Array['isArray'](_0x4458ee) ? { ..._0x4458ee } : {};
}
function readStoreState(_0x53c75e) {
  return typeof _0x53c75e?.['getStateRaw'] === 'function'
    ? _0x53c75e['getStateRaw']()
    : _0x53c75e?.['getState']?.() || {};
}
function getAspectRatioFieldForModel(_0x5e368c) {
  const _0x5cc9c2 =
      getModelManifest(_0x5e368c) || resolveModelExecution(_0x5e368c)?.['modelManifest'] || null,
    _0x31668b = Array['isArray'](_0x5cc9c2?.['uiSchema']?.['fields']) ? _0x5cc9c2['uiSchema']['fields'] : [];
  return (
    _0x31668b['find']((_0x214299) => {
      const _0x4c0cd4 = String(_0x214299?.['id'] || '')['trim'](),
        _0x473a2d = String(_0x214299?.['displayRole'] || '')['trim']();
      return _0x4c0cd4 === 'aspectRatio' || _0x473a2d === 'aspectRatio';
    }) || null
  );
}
export function resolveGenerationModelDisplayAspectRatio({
  modelId: modelId = '',
  generationParams: generationParams = {},
  nodeData: nodeData = {},
} = {}) {
  const _0x3a1c28 = getPlainObject(generationParams),
    _0x59e536 = getAspectRatioFieldForModel(modelId),
    _0x1d6c35 = String(_0x59e536?.['id'] || '')['trim']();
  if (_0x1d6c35 && Object['prototype']['hasOwnProperty']['call'](_0x3a1c28, _0x1d6c35))
    return _0x3a1c28[_0x1d6c35];
  if (Object['prototype']['hasOwnProperty']['call'](_0x3a1c28, 'aspectRatio'))
    return _0x3a1c28['aspectRatio'];
  if (_0x1d6c35 && Object['prototype']['hasOwnProperty']['call'](nodeData, _0x1d6c35))
    return nodeData[_0x1d6c35];
  if (Object['prototype']['hasOwnProperty']['call'](nodeData, 'aspectRatio')) return nodeData['aspectRatio'];
  return _0x59e536?.['defaultValue'];
}
export function isGenerationDisplaySizeManual(_0x504b65 = {}) {
  return _0x504b65?.[GENERATION_MANUAL_DISPLAY_SIZE_FIELD] === !![];
}
export function buildGenerationModelSelectionDisplayPatch({
  store: _0x536888,
  nodeId: nodeId = '',
  nodeData: nodeData = {},
  fallbackNodeData: fallbackNodeData = {},
  modelId: modelId = '',
  generationParams: generationParams = {},
  ratioValue: _0x472115,
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
  getRefKindByNodeType: _0x5333cb,
  inputKinds: _0x4d8597,
  resultMediaElement: _0x457533,
  resultFields: _0x175b36,
  mediaSelector: _0x46ae75,
  respectManualDisplaySize: respectManualDisplaySize = !![],
} = {}) {
  if (respectManualDisplaySize && isGenerationDisplaySizeManual(nodeData)) return {};
  const _0x5d547a =
      _0x472115 !== undefined
        ? _0x472115
        : resolveGenerationModelDisplayAspectRatio({
            modelId: modelId,
            generationParams: generationParams,
            nodeData: nodeData,
          }),
    _0x4190ba = String(_0x5d547a || '')['trim']();
  if (!_0x4190ba) return {};
  const _0x32c1bb = {
      ...(nodeData || {}),
      ...(modelId ? { model: modelId } : {}),
      ...(modelId ? { provider: resolveModelProvider(modelId) || nodeData?.['provider'] } : {}),
      generationParams: getPlainObject(generationParams),
    },
    _0x29fcf0 = buildImageSchemaAspectRatioDisplayPatch({
      store: _0x536888,
      nodeId: nodeId,
      nodeData: _0x32c1bb,
      fallbackNodeData: fallbackNodeData,
      ratioValue: _0x4190ba,
      minSide: minSide,
      getRefKindByNodeType: _0x5333cb,
      inputKinds: _0x4d8597,
      resultMediaElement: _0x457533,
      resultFields: _0x175b36,
      mediaSelector: _0x46ae75,
    });
  if (
    Object['keys'](_0x29fcf0)['length'] === 0x0 &&
    String(nodeData?.['aspectRatio'] || '')['trim']() === _0x4190ba
  )
    return {};
  return { aspectRatio: _0x4190ba, ..._0x29fcf0 };
}
export function buildGenerationModelSelectionPayload({
  payload: payload = {},
  store: _0x342b1f,
  nodeId: nodeId = '',
  nodeData: nodeData = {},
  fallbackNodeData: fallbackNodeData = {},
  modelId: modelId = '',
  generationParams: _0x1f0a93,
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
  getRefKindByNodeType: _0x5d5787,
  inputKinds: _0x20a5ff,
  resultMediaElement: _0x4e2eac,
  resultFields: _0x403312,
  mediaSelector: _0x4e068e,
} = {}) {
  const _0x5620b2 = getPlainObject(payload),
    _0x47de05 = String(modelId || _0x5620b2['model'] || nodeData?.['model'] || '')['trim'](),
    _0x1065b3 =
      _0x1f0a93 !== undefined
        ? getPlainObject(_0x1f0a93)
        : getPlainObject(_0x5620b2['generationParams'] || nodeData?.['generationParams']);
  if (!_0x47de05 || Object['keys'](_0x1065b3)['length'] === 0x0)
    return { payload: _0x5620b2, displayPatch: {} };
  const _0x53ba4a = buildGenerationModelSelectionDisplayPatch({
    store: _0x342b1f,
    nodeId: nodeId,
    nodeData: nodeData,
    fallbackNodeData: fallbackNodeData,
    modelId: _0x47de05,
    generationParams: _0x1065b3,
    minSide: minSide,
    getRefKindByNodeType: _0x5d5787,
    inputKinds: _0x20a5ff,
    resultMediaElement: _0x4e2eac,
    resultFields: _0x403312,
    mediaSelector: _0x4e068e,
  });
  return { payload: { ..._0x5620b2, ..._0x53ba4a }, displayPatch: _0x53ba4a };
}
export function parseImageDisplayAspectRatio(_0x3d87f0) {
  if (isAdaptiveImageRatio(_0x3d87f0)) return null;
  const _0x1fb108 = String(_0x3d87f0 || '')
      ['trim']()
      ['replace'](/[：∶﹕]/g, ':')
      ['replace'](/\s+/g, ''),
    _0x48da47 = _0x1fb108['match'](/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!_0x48da47) return null;
  const _0x2b19ab = Number['parseFloat'](_0x48da47[0x1]),
    _0x16d243 = Number['parseFloat'](_0x48da47[0x2]);
  if (!Number['isFinite'](_0x2b19ab) || !Number['isFinite'](_0x16d243)) return null;
  if (_0x2b19ab <= 0x0 || _0x16d243 <= 0x0) return null;
  return { width: _0x2b19ab, height: _0x16d243, label: _0x2b19ab + ':' + _0x16d243 };
}
export function buildImageDisplayRatioResizePatch({
  nodeData: nodeData = {},
  ratioValue: ratioValue = '',
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
} = {}) {
  const _0x443d03 = parseImageDisplayAspectRatio(ratioValue);
  if (!_0x443d03) return {};
  const _0x5f5b96 = Math['max'](0x1, Math['round'](Number(minSide) || AI_GENERATION_NODE_SHORT_SIDE)),
    _0x3c27d2 = Math['max'](0x1, Math['round'](Number(nodeData?.['width']) || _0x5f5b96)),
    _0x4689d9 = Math['max'](0x1, Math['round'](Number(nodeData?.['height']) || _0x5f5b96)),
    _0xcbd977 = Number['isFinite'](Number(nodeData?.['x'])) ? Number(nodeData['x']) : 0x0,
    _0x2dd32f = Number['isFinite'](Number(nodeData?.['y'])) ? Number(nodeData['y']) : 0x0;
  let _0x4eee8f, _0x5bcdec;
  _0x443d03['width'] >= _0x443d03['height']
    ? ((_0x5bcdec = _0x5f5b96),
      (_0x4eee8f = Math['round']((_0x443d03['width'] / _0x443d03['height']) * _0x5f5b96)))
    : ((_0x4eee8f = _0x5f5b96),
      (_0x5bcdec = Math['round']((_0x443d03['height'] / _0x443d03['width']) * _0x5f5b96)));
  if (_0x4eee8f === _0x3c27d2 && _0x5bcdec === _0x4689d9) return {};
  const _0x385d5d = _0x4eee8f - _0x3c27d2,
    _0x9de4c0 = _0x5bcdec - _0x4689d9;
  return {
    width: _0x4eee8f,
    height: _0x5bcdec,
    x: Math['round'](_0xcbd977 - _0x385d5d / 0x2),
    y: Math['round'](_0x2dd32f - _0x9de4c0),
  };
}
function buildExactRatioLabelForDisplay(_0x40e4ad, _0x4b2482) {
  const _0x4593d6 = Number(_0x40e4ad) || 0x0,
    _0x9ee947 = Number(_0x4b2482) || 0x0;
  if (_0x4593d6 <= 0x0 || _0x9ee947 <= 0x0) return null;
  return _0x4593d6 + ':' + _0x9ee947;
}
function getMediaSizeForRatioDisplay(_0x2c6aff, _0x1cbaf3, _0x186975 = null, _0x45a74b = 'img, video') {
  return (
    getGenerationRatioSizeWithDom({
      nodeId: _0x2c6aff,
      nodeData: _0x1cbaf3,
      edge: _0x186975,
      mediaSelector: _0x45a74b,
      includeNodeFrame: !![],
    }) || { width: 0x0, height: 0x0 }
  );
}
function isAcceptedRatioInputKind(_0x13e769, _0x20c61b, _0x203a7b, _0x1e3cee) {
  const _0x336ea8 = String(_0x13e769?.['refSlot'] || '')['toLowerCase']();
  if (_0x336ea8['includes']('mask')) return ![];
  const _0x22f1ed = _0x20c61b?.[_0x13e769?.['sourceId']],
    _0x2be8b6 = String(_0x22f1ed?.['type'] || ''),
    _0x572c8e = typeof _0x1e3cee === 'function' ? _0x1e3cee(_0x2be8b6) : '';
  if (_0x572c8e && _0x203a7b['has'](_0x572c8e)) return !![];
  const _0x3a740d = _0x2be8b6['toLowerCase']();
  return Array['from'](_0x203a7b)['some'](
    (_0xa211b4) =>
      _0x3a740d === _0xa211b4 || _0x3a740d === 'source-' + _0xa211b4 || _0x3a740d === 'ai-' + _0xa211b4,
  );
}
export function resolveImageSchemaAdaptiveRatioDisplayValue({
  store: _0x21389c,
  nodeId: _0x5ff9ce,
  nodeData: _0x384e85,
  fallbackNodeData: _0x4e1c79,
  getRefKindByNodeType: _0x454db1,
  inputKinds: inputKinds = ['image'],
  resultMediaElement: resultMediaElement = null,
  resultFields: resultFields = [
    'images',
    'localPath',
    'thumbUrl',
    'imageUrl',
    'sourceUrl',
    'thumbId',
    'sourceId',
  ],
  mediaSelector: mediaSelector = 'img, video',
} = {}) {
  const _0x117a3d = readStoreState(_0x21389c),
    _0x3b2612 = _0x117a3d['nodes'] || {},
    _0x50e53e = _0x384e85 || _0x3b2612?.[_0x5ff9ce] || _0x4e1c79 || {},
    _0xc4eb1e = new Set(
      (Array['isArray'](inputKinds) ? inputKinds : ['image'])
        ['map']((_0x5af66d) => String(_0x5af66d || '')['trim']())
        ['filter'](Boolean),
    ),
    _0x5e1bf2 =
      typeof _0x21389c?.['getIncomingEdges'] === 'function' ? _0x21389c['getIncomingEdges'](_0x5ff9ce) : [],
    _0x4b3063 = _0x5e1bf2['filter']((_0x35fc51) =>
      isAcceptedRatioInputKind(_0x35fc51, _0x3b2612, _0xc4eb1e, _0x454db1),
    );
  if (_0x4b3063['length'] > 0x0) {
    const _0x1acc31 = pickGenerationRatioSourceEdge(_0x4b3063, _0x50e53e),
      _0x37b344 = _0x3b2612?.[_0x1acc31?.['sourceId']],
      _0x32f6b5 = getMediaSizeForRatioDisplay(_0x1acc31?.['sourceId'], _0x37b344, _0x1acc31, mediaSelector);
    return buildExactRatioLabelForDisplay(_0x32f6b5['width'], _0x32f6b5['height']) || '1:1';
  }
  const _0x30a225 = resultFields['some']((_0x3dab30) => {
    const _0x6227c7 = _0x50e53e?.[_0x3dab30];
    return Array['isArray'](_0x6227c7) ? _0x6227c7['length'] > 0x0 : Boolean(_0x6227c7);
  });
  if (_0x30a225) {
    const _0x37ec55 =
        resultMediaElement?.['naturalWidth'] ||
        resultMediaElement?.['videoWidth'] ||
        Number(_0x50e53e?.['width']) ||
        0x0,
      _0x2a0a47 =
        resultMediaElement?.['naturalHeight'] ||
        resultMediaElement?.['videoHeight'] ||
        Number(_0x50e53e?.['height']) ||
        0x0;
    return buildExactRatioLabelForDisplay(_0x37ec55, _0x2a0a47) || '1:1';
  }
  return '1:1';
}
export function buildImageSchemaAspectRatioDisplayPatch({
  store: _0x4d6f13,
  nodeId: _0xbc76a6,
  nodeData: _0x283bcd,
  fallbackNodeData: _0x10826d,
  ratioValue: ratioValue = '',
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
  getRefKindByNodeType: _0x569826,
  inputKinds: _0x49587a,
  resultMediaElement: _0x3364b2,
  resultFields: _0xc9ddb5,
  mediaSelector: _0x14ae53,
} = {}) {
  const _0x1b5af1 = readStoreState(_0x4d6f13)['nodes']?.[_0xbc76a6];
  if (!_0x1b5af1 && !_0x283bcd && !_0x10826d) return {};
  const _0x396af8 = _0x283bcd || _0x1b5af1 || _0x10826d || {},
    _0x3c3751 = isAdaptiveImageAspectRatioValue(ratioValue)
      ? resolveImageSchemaAdaptiveRatioDisplayValue({
          store: _0x4d6f13,
          nodeId: _0xbc76a6,
          nodeData: _0x396af8,
          fallbackNodeData: _0x10826d,
          getRefKindByNodeType: _0x569826,
          inputKinds: _0x49587a,
          resultMediaElement: _0x3364b2,
          resultFields: _0xc9ddb5,
          mediaSelector: _0x14ae53,
        })
      : ratioValue;
  return buildImageDisplayRatioResizePatch({ nodeData: _0x396af8, ratioValue: _0x3c3751, minSide: minSide });
}
export const GENERATION_RATIO_RESIZE_ANIMATION_MS = 0x118;
export function armImageSchemaRatioResizeAnimation(
  _0x4c0bef,
  _0x2ea418,
  _0xdd8320 = GENERATION_RATIO_RESIZE_ANIMATION_MS,
) {
  const _0x3613ef =
    typeof document !== 'undefined' && typeof document['getElementById'] === 'function'
      ? document['getElementById'](_0x2ea418)
      : null;
  if (!_0x3613ef || !_0x4c0bef) return;
  const _0x5d5e27 = _0x4c0bef['_ratioAnimWrapperEl'];
  _0x5d5e27 && _0x5d5e27 !== _0x3613ef && _0x5d5e27['classList']?.['remove']('is-ratio-animating');
  ((_0x4c0bef['_ratioAnimWrapperEl'] = _0x3613ef), _0x3613ef['classList']['add']('is-ratio-animating'));
  if (_0x4c0bef['_ratioAnimTimer']) clearTimeout(_0x4c0bef['_ratioAnimTimer']);
  const _0x4fa034 = setTimeout(() => {
    if (_0x4c0bef['_ratioAnimTimer'] !== _0x4fa034) return;
    (_0x3613ef['classList']['remove']('is-ratio-animating'),
      (_0x4c0bef['_ratioAnimTimer'] = null),
      _0x4c0bef['_ratioAnimWrapperEl'] === _0x3613ef && (_0x4c0bef['_ratioAnimWrapperEl'] = null));
  }, _0xdd8320 + 0x50);
  _0x4c0bef['_ratioAnimTimer'] = _0x4fa034;
}
function clearRatioResizePreviewTransform(_0x36d8d7) {
  if (!_0x36d8d7?.['style']) return;
  ((_0x36d8d7['style']['transformOrigin'] = ''), (_0x36d8d7['style']['transform'] = ''));
}
function cancelPendingRatioResizeFlipStart(_0x4d02a3) {
  const _0x244cf0 = _0x4d02a3?.['_ratioFlipStartCancel'];
  _0x4d02a3['_ratioFlipStartCancel'] = null;
  if (typeof _0x244cf0 === 'function') _0x244cf0();
}
export function animateImageSchemaRatioResizeFlip(
  _0x20ad3d,
  {
    nodeId: _0x62b506,
    previewEl: _0x404fba,
    nodeData: _0x572a2c,
    patch: _0x5bd814,
    ms: ms = GENERATION_RATIO_RESIZE_ANIMATION_MS,
    deferStart: deferStart = !![],
    forceLayout: forceLayout = !![],
  } = {},
) {
  if (!_0x20ad3d || !_0x404fba || typeof _0x404fba['animate'] !== 'function') return;
  const _0x40bbf2 = Math['max'](0x1, Number(_0x572a2c?.['width']) || Number(_0x5bd814?.['width']) || 0x1),
    _0xba2b11 = Math['max'](0x1, Number(_0x572a2c?.['height']) || Number(_0x5bd814?.['height']) || 0x1),
    _0x5966d0 = Math['max'](0x1, Number(_0x5bd814?.['width']) || _0x40bbf2),
    _0x4d5ae4 = Math['max'](0x1, Number(_0x5bd814?.['height']) || _0xba2b11);
  if (_0x40bbf2 === _0x5966d0 && _0xba2b11 === _0x4d5ae4) return;
  const _0xa655db = _0x40bbf2 / _0x5966d0,
    _0x1e02cc = _0xba2b11 / _0x4d5ae4,
    _0x92dbbe = 'scaleX(' + _0xa655db + ')\x20scaleY(' + _0x1e02cc + ')',
    _0x5f5bfb = (Number(_0x20ad3d['_ratioFlipGeneration']) || 0x0) + 0x1,
    _0x5d26f5 = _0x20ad3d['_ratioFlipPreviewEl'];
  ((_0x20ad3d['_ratioFlipGeneration'] = _0x5f5bfb), cancelPendingRatioResizeFlipStart(_0x20ad3d));
  const _0x3d1aa2 = _0x20ad3d['_ratioFlipAnim'];
  ((_0x20ad3d['_ratioFlipAnim'] = null), _0x3d1aa2?.['cancel']?.());
  _0x5d26f5 && _0x5d26f5 !== _0x404fba && clearRatioResizePreviewTransform(_0x5d26f5);
  _0x20ad3d['_ratioFlipPreviewEl'] = _0x404fba;
  let _0x3212c8 = null;
  const _0x1c317e = () => {
    if (_0x20ad3d['_ratioFlipAnim'] === _0x3212c8) _0x20ad3d['_ratioFlipAnim'] = null;
    if (_0x20ad3d['_ratioFlipGeneration'] !== _0x5f5bfb) return;
    (clearRatioResizePreviewTransform(_0x404fba),
      _0x20ad3d['_ratioFlipPreviewEl'] === _0x404fba && (_0x20ad3d['_ratioFlipPreviewEl'] = null));
  };
  ((_0x404fba['style']['transition'] = 'none'),
    (_0x404fba['style']['transformOrigin'] = 'bottom center'),
    (_0x404fba['style']['transform'] = _0x92dbbe));
  if (forceLayout) void _0x404fba['offsetWidth'];
  const _0x4919c0 = () => {
    if (_0x20ad3d['_ratioFlipGeneration'] !== _0x5f5bfb) return;
    _0x20ad3d['_ratioFlipStartCancel'] = null;
    if (
      typeof document !== 'undefined' &&
      typeof document['getElementById'] === 'function' &&
      !document['getElementById'](_0x62b506)
    ) {
      _0x1c317e();
      return;
    }
    ((_0x3212c8 = _0x404fba['animate']([{ transform: _0x92dbbe }, { transform: 'none' }], {
      duration: ms,
      easing: 'cubic-bezier(0.25,\x200.46,\x200.45,\x200.94)',
      fill: 'forwards',
    })),
      (_0x20ad3d['_ratioFlipAnim'] = _0x3212c8),
      (_0x3212c8['onfinish'] = _0x1c317e),
      (_0x3212c8['oncancel'] = _0x1c317e));
  };
  if (!deferStart) {
    _0x4919c0();
    return;
  }
  if (typeof requestAnimationFrame === 'function') {
    const _0x1c5a33 = requestAnimationFrame(_0x4919c0);
    _0x20ad3d['_ratioFlipStartCancel'] = () => {
      typeof cancelAnimationFrame === 'function' && cancelAnimationFrame(_0x1c5a33);
    };
    return;
  }
  const _0x41dd94 = setTimeout(_0x4919c0, 0x0);
  _0x20ad3d['_ratioFlipStartCancel'] = () => clearTimeout(_0x41dd94);
}
export function disposeImageSchemaRatioResizeAnimation(
  _0x16ded3,
  { nodeId: _0x1b2c5c, previewEl: _0x22c7ac } = {},
) {
  if (!_0x16ded3) return;
  ((_0x16ded3['_ratioFlipGeneration'] = (Number(_0x16ded3['_ratioFlipGeneration']) || 0x0) + 0x1),
    cancelPendingRatioResizeFlipStart(_0x16ded3));
  const _0x41be9a = _0x16ded3['_ratioFlipAnim'];
  ((_0x16ded3['_ratioFlipAnim'] = null), _0x41be9a?.['cancel']?.());
  const _0x2a54fc = _0x16ded3['_ratioFlipPreviewEl'];
  clearRatioResizePreviewTransform(_0x2a54fc);
  _0x22c7ac && _0x22c7ac !== _0x2a54fc && clearRatioResizePreviewTransform(_0x22c7ac);
  _0x16ded3['_ratioFlipPreviewEl'] = null;
  if (_0x16ded3['_ratioAnimTimer']) clearTimeout(_0x16ded3['_ratioAnimTimer']);
  _0x16ded3['_ratioAnimTimer'] = null;
  const _0x25978f = _0x16ded3['_ratioAnimWrapperEl'];
  _0x25978f?.['classList']?.['remove']('is-ratio-animating');
  const _0x52d2d1 =
    typeof document !== 'undefined' && typeof document['getElementById'] === 'function' && _0x1b2c5c
      ? document['getElementById'](_0x1b2c5c)
      : null;
  (_0x52d2d1 && _0x52d2d1 !== _0x25978f && _0x52d2d1['classList']?.['remove']('is-ratio-animating'),
    (_0x16ded3['_ratioAnimWrapperEl'] = null));
}
export function applyImageSchemaRatioResizeAnimation(
  _0x68cb93,
  {
    nodeId: _0x1eeed0,
    previewEl: _0x30a482,
    nodeData: _0x3b1bcb,
    patch: _0x43046b,
    ms: ms = GENERATION_RATIO_RESIZE_ANIMATION_MS,
  } = {},
) {
  if (!_0x43046b || Object['keys'](_0x43046b)['length'] === 0x0) return;
  (armImageSchemaRatioResizeAnimation(_0x68cb93, _0x1eeed0, ms),
    animateImageSchemaRatioResizeFlip(_0x68cb93, {
      nodeId: _0x1eeed0,
      previewEl: _0x30a482,
      nodeData: _0x3b1bcb,
      patch: _0x43046b,
      ms: ms,
    }));
}
