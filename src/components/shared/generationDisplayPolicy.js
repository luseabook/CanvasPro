import { AI_GENERATION_NODE_SHORT_SIDE } from '../../services/fileService.js';
import {
  getGenerationRatioSizeWithDom,
  pickGenerationRatioSourceEdge,
} from '../../modules/generationRatioSource.js';
import { getModelManifest, resolveModelExecution, resolveModelProvider } from '../../manifests/index.js';
export const AI_IMAGE_MIN_SIZE = 0x96;
export const GENERATION_MANUAL_DISPLAY_SIZE_FIELD = 'manualDisplaySize';
function isAdaptiveImageRatio(value) {
  const enabled = String(value || '')['trim'](),
    item = enabled['toLowerCase']();
  return !enabled || enabled === '自适应' || item === 'auto' || item === 'adaptive';
}
export function isAdaptiveImageAspectRatioValue(key) {
  return isAdaptiveImageRatio(key);
}
function getPlainObject(args) {
  return args && typeof args === 'object' && !Array['isArray'](args) ? { ...args } : {};
}
function readStoreState(store) {
  return typeof store?.['getStateRaw'] === 'function'
    ? store['getStateRaw']()
    : store?.['getState']?.() || {};
}
function getAspectRatioFieldForModel(index) {
  const modelManifest = getModelManifest(index) || resolveModelExecution(index)?.['modelManifest'] || null,
    list = Array['isArray'](modelManifest?.['uiSchema']?.['fields'])
      ? modelManifest['uiSchema']['fields']
      : [];
  return (
    list['find']((result) => {
      const data = String(result?.['id'] || '')['trim'](),
        options = String(result?.['displayRole'] || '')['trim']();
      return data === 'aspectRatio' || options === 'aspectRatio';
    }) || null
  );
}
export function resolveGenerationModelDisplayAspectRatio({
  modelId: modelId = '',
  generationParams: generationParams = {},
  nodeData: nodeData = {},
} = {}) {
  const plainObject = getPlainObject(generationParams),
    aspectRatioFieldForModel = getAspectRatioFieldForModel(modelId),
    target = String(aspectRatioFieldForModel?.['id'] || '')['trim']();
  if (target && Object['prototype']['hasOwnProperty']['call'](plainObject, target))
    return plainObject[target];
  if (Object['prototype']['hasOwnProperty']['call'](plainObject, 'aspectRatio'))
    return plainObject['aspectRatio'];
  if (target && Object['prototype']['hasOwnProperty']['call'](nodeData, target)) return nodeData[target];
  if (Object['prototype']['hasOwnProperty']['call'](nodeData, 'aspectRatio')) return nodeData['aspectRatio'];
  return aspectRatioFieldForModel?.['defaultValue'];
}
export function isGenerationDisplaySizeManual(options2 = {}) {
  return options2?.[GENERATION_MANUAL_DISPLAY_SIZE_FIELD] === !![];
}
export function buildGenerationModelSelectionDisplayPatch({
  store: store2,
  nodeId: nodeId = '',
  nodeData: nodeData = {},
  fallbackNodeData: fallbackNodeData = {},
  modelId: modelId = '',
  generationParams: generationParams = {},
  ratioValue: ratioValue2,
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
  getRefKindByNodeType: getRefKindByNodeType,
  inputKinds: inputKinds2,
  resultMediaElement: resultMediaElement2,
  resultFields: resultFields2,
  mediaSelector: mediaSelector2,
  respectManualDisplaySize: respectManualDisplaySize = !![],
} = {}) {
  if (respectManualDisplaySize && isGenerationDisplaySizeManual(nodeData)) return {};
  const source =
      ratioValue2 !== undefined
        ? ratioValue2
        : resolveGenerationModelDisplayAspectRatio({
            modelId: modelId,
            generationParams: generationParams,
            nodeData: nodeData,
          }),
    ratioValue3 = String(source || '')['trim']();
  if (!ratioValue3) return {};
  const nodeData2 = {
      ...(nodeData || {}),
      ...(modelId ? { model: modelId } : {}),
      ...(modelId ? { provider: resolveModelProvider(modelId) || nodeData?.['provider'] } : {}),
      generationParams: getPlainObject(generationParams),
    },
    args2 = buildImageSchemaAspectRatioDisplayPatch({
      store: store2,
      nodeId: nodeId,
      nodeData: nodeData2,
      fallbackNodeData: fallbackNodeData,
      ratioValue: ratioValue3,
      minSide: minSide,
      getRefKindByNodeType: getRefKindByNodeType,
      inputKinds: inputKinds2,
      resultMediaElement: resultMediaElement2,
      resultFields: resultFields2,
      mediaSelector: mediaSelector2,
    });
  if (
    Object['keys'](args2)['length'] === 0x0 &&
    String(nodeData?.['aspectRatio'] || '')['trim']() === ratioValue3
  )
    return {};
  return { aspectRatio: ratioValue3, ...args2 };
}
export function buildGenerationModelSelectionPayload({
  payload: payload = {},
  store: store3,
  nodeId: nodeId = '',
  nodeData: nodeData = {},
  fallbackNodeData: fallbackNodeData = {},
  modelId: modelId = '',
  generationParams: generationParams2,
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
  getRefKindByNodeType: getRefKindByNodeType2,
  inputKinds: inputKinds3,
  resultMediaElement: resultMediaElement3,
  resultFields: resultFields3,
  mediaSelector: mediaSelector3,
} = {}) {
  const payload2 = getPlainObject(payload),
    modelId2 = String(modelId || payload2['model'] || nodeData?.['model'] || '')['trim'](),
    generationParams3 =
      generationParams2 !== undefined
        ? getPlainObject(generationParams2)
        : getPlainObject(payload2['generationParams'] || nodeData?.['generationParams']);
  if (!modelId2 || Object['keys'](generationParams3)['length'] === 0x0)
    return { payload: payload2, displayPatch: {} };
  const displayPatch = buildGenerationModelSelectionDisplayPatch({
    store: store3,
    nodeId: nodeId,
    nodeData: nodeData,
    fallbackNodeData: fallbackNodeData,
    modelId: modelId2,
    generationParams: generationParams3,
    minSide: minSide,
    getRefKindByNodeType: getRefKindByNodeType2,
    inputKinds: inputKinds3,
    resultMediaElement: resultMediaElement3,
    resultFields: resultFields3,
    mediaSelector: mediaSelector3,
  });
  return { payload: { ...payload2, ...displayPatch }, displayPatch: displayPatch };
}
export function parseImageDisplayAspectRatio(next) {
  if (isAdaptiveImageRatio(next)) return null;
  const current = String(next || '')
      ['trim']()
      ['replace'](/[：∶﹕]/g, ':')
      ['replace'](/\s+/g, ''),
    enabled2 = current['match'](/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!enabled2) return null;
  const width2 = Number['parseFloat'](enabled2[0x1]),
    height2 = Number['parseFloat'](enabled2[0x2]);
  if (!Number['isFinite'](width2) || !Number['isFinite'](height2)) return null;
  if (width2 <= 0x0 || height2 <= 0x0) return null;
  return { width: width2, height: height2, label: width2 + ':' + height2 };
}
export function buildImageDisplayRatioResizePatch({
  nodeData: nodeData = {},
  ratioValue: ratioValue = '',
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
} = {}) {
  const box = parseImageDisplayAspectRatio(ratioValue);
  if (!box) return {};
  const entry = Math['max'](0x1, Math['round'](Number(minSide) || AI_GENERATION_NODE_SHORT_SIDE)),
    record = Math['max'](0x1, Math['round'](Number(nodeData?.['width']) || entry)),
    handle = Math['max'](0x1, Math['round'](Number(nodeData?.['height']) || entry)),
    state = Number['isFinite'](Number(nodeData?.['x'])) ? Number(nodeData['x']) : 0x0,
    config = Number['isFinite'](Number(nodeData?.['y'])) ? Number(nodeData['y']) : 0x0;
  let width3, height3;
  box['width'] >= box['height']
    ? ((height3 = entry), (width3 = Math['round']((box['width'] / box['height']) * entry)))
    : ((width3 = entry), (height3 = Math['round']((box['height'] / box['width']) * entry)));
  if (width3 === record && height3 === handle) return {};
  const scope = width3 - record,
    input = height3 - handle;
  return {
    width: width3,
    height: height3,
    x: Math['round'](state - scope / 0x2),
    y: Math['round'](config - input),
  };
}
function buildExactRatioLabelForDisplay(output, value2) {
  const count = Number(output) || 0x0,
    count2 = Number(value2) || 0x0;
  if (count <= 0x0 || count2 <= 0x0) return null;
  return count + ':' + count2;
}
function getMediaSizeForRatioDisplay(nodeId2, nodeData3, edge = null, mediaSelector4 = 'img, video') {
  return (
    getGenerationRatioSizeWithDom({
      nodeId: nodeId2,
      nodeData: nodeData3,
      edge: edge,
      mediaSelector: mediaSelector4,
      includeNodeFrame: !![],
    }) || { width: 0x0, height: 0x0 }
  );
}
function isAcceptedRatioInputKind(value3, value4, map, handler) {
  const list2 = String(value3?.['refSlot'] || '')['toLowerCase']();
  if (list2['includes']('mask')) return ![];
  const value5 = value4?.[value3?.['sourceId']],
    value6 = String(value5?.['type'] || ''),
    value7 = typeof handler === 'function' ? handler(value6) : '';
  if (value7 && map['has'](value7)) return !![];
  const value8 = value6['toLowerCase']();
  return Array['from'](map)['some'](
    (value9) => value8 === value9 || value8 === 'source-' + value9 || value8 === 'ai-' + value9,
  );
}
export function resolveImageSchemaAdaptiveRatioDisplayValue({
  store: store4,
  nodeId: nodeId3,
  nodeData: nodeData4,
  fallbackNodeData: fallbackNodeData2,
  getRefKindByNodeType: getRefKindByNodeType3,
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
  const storeState = readStoreState(store4),
    value10 = storeState['nodes'] || {},
    box2 = nodeData4 || value10?.[nodeId3] || fallbackNodeData2 || {},
    value11 = new Set(
      (Array['isArray'](inputKinds) ? inputKinds : ['image'])
        ['map']((value12) => String(value12 || '')['trim']())
        ['filter'](Boolean),
    ),
    list3 = typeof store4?.['getIncomingEdges'] === 'function' ? store4['getIncomingEdges'](nodeId3) : [],
    list4 = list3['filter']((value13) =>
      isAcceptedRatioInputKind(value13, value10, value11, getRefKindByNodeType3),
    );
  if (list4['length'] > 0x0) {
    const generationRatioSourceEdge = pickGenerationRatioSourceEdge(list4, box2),
      value14 = value10?.[generationRatioSourceEdge?.['sourceId']],
      box3 = getMediaSizeForRatioDisplay(
        generationRatioSourceEdge?.['sourceId'],
        value14,
        generationRatioSourceEdge,
        mediaSelector,
      );
    return buildExactRatioLabelForDisplay(box3['width'], box3['height']) || '1:1';
  }
  const value15 = resultFields['some']((value16) => {
    const list5 = box2?.[value16];
    return Array['isArray'](list5) ? list5['length'] > 0x0 : Boolean(list5);
  });
  if (value15) {
    const value17 =
        resultMediaElement?.['naturalWidth'] ||
        resultMediaElement?.['videoWidth'] ||
        Number(box2?.['width']) ||
        0x0,
      value18 =
        resultMediaElement?.['naturalHeight'] ||
        resultMediaElement?.['videoHeight'] ||
        Number(box2?.['height']) ||
        0x0;
    return buildExactRatioLabelForDisplay(value17, value18) || '1:1';
  }
  return '1:1';
}
export function buildImageSchemaAspectRatioDisplayPatch({
  store: store5,
  nodeId: nodeId4,
  nodeData: nodeData5,
  fallbackNodeData: fallbackNodeData3,
  ratioValue: ratioValue = '',
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
  getRefKindByNodeType: getRefKindByNodeType4,
  inputKinds: inputKinds4,
  resultMediaElement: resultMediaElement4,
  resultFields: resultFields4,
  mediaSelector: mediaSelector5,
} = {}) {
  const storeState2 = readStoreState(store5)['nodes']?.[nodeId4];
  if (!storeState2 && !nodeData5 && !fallbackNodeData3) return {};
  const nodeData6 = nodeData5 || storeState2 || fallbackNodeData3 || {},
    ratioValue4 = isAdaptiveImageAspectRatioValue(ratioValue)
      ? resolveImageSchemaAdaptiveRatioDisplayValue({
          store: store5,
          nodeId: nodeId4,
          nodeData: nodeData6,
          fallbackNodeData: fallbackNodeData3,
          getRefKindByNodeType: getRefKindByNodeType4,
          inputKinds: inputKinds4,
          resultMediaElement: resultMediaElement4,
          resultFields: resultFields4,
          mediaSelector: mediaSelector5,
        })
      : ratioValue;
  return buildImageDisplayRatioResizePatch({
    nodeData: nodeData6,
    ratioValue: ratioValue4,
    minSide: minSide,
  });
}
export const GENERATION_RATIO_RESIZE_ANIMATION_MS = 0x118;
export function armImageSchemaRatioResizeAnimation(
  enabled3,
  value19,
  value20 = GENERATION_RATIO_RESIZE_ANIMATION_MS,
) {
  const el =
    typeof document !== 'undefined' && typeof document['getElementById'] === 'function'
      ? document['getElementById'](value19)
      : null;
  if (!el || !enabled3) return;
  const el2 = enabled3['_ratioAnimWrapperEl'];
  el2 && el2 !== el && el2['classList']?.['remove']('is-ratio-animating');
  ((enabled3['_ratioAnimWrapperEl'] = el), el['classList']['add']('is-ratio-animating'));
  if (enabled3['_ratioAnimTimer']) clearTimeout(enabled3['_ratioAnimTimer']);
  const setTimeout2 = setTimeout(() => {
    if (enabled3['_ratioAnimTimer'] !== setTimeout2) return;
    (el['classList']['remove']('is-ratio-animating'),
      (enabled3['_ratioAnimTimer'] = null),
      enabled3['_ratioAnimWrapperEl'] === el && (enabled3['_ratioAnimWrapperEl'] = null));
  }, value20 + 0x50);
  enabled3['_ratioAnimTimer'] = setTimeout2;
}
function clearRatioResizePreviewTransform(el3) {
  if (!el3?.['style']) return;
  ((el3['style']['transformOrigin'] = ''), (el3['style']['transform'] = ''));
}
function cancelPendingRatioResizeFlipStart(value21) {
  const run = value21?.['_ratioFlipStartCancel'];
  value21['_ratioFlipStartCancel'] = null;
  if (typeof run === 'function') run();
}
export function animateImageSchemaRatioResizeFlip(
  enabled4,
  {
    nodeId: nodeId5,
    previewEl: previewEl,
    nodeData: nodeData7,
    patch: patch,
    ms: ms = GENERATION_RATIO_RESIZE_ANIMATION_MS,
    deferStart: deferStart = !![],
    forceLayout: forceLayout = !![],
  } = {},
) {
  if (!enabled4 || !previewEl || typeof previewEl['animate'] !== 'function') return;
  const value22 = Math['max'](0x1, Number(nodeData7?.['width']) || Number(patch?.['width']) || 0x1),
    value23 = Math['max'](0x1, Number(nodeData7?.['height']) || Number(patch?.['height']) || 0x1),
    value24 = Math['max'](0x1, Number(patch?.['width']) || value22),
    value25 = Math['max'](0x1, Number(patch?.['height']) || value23);
  if (value22 === value24 && value23 === value25) return;
  const value26 = value22 / value24,
    value27 = value23 / value25,
    transform = 'scaleX(' + value26 + ')\x20scaleY(' + value27 + ')',
    value28 = (Number(enabled4['_ratioFlipGeneration']) || 0x0) + 0x1,
    value29 = enabled4['_ratioFlipPreviewEl'];
  ((enabled4['_ratioFlipGeneration'] = value28), cancelPendingRatioResizeFlipStart(enabled4));
  const value30 = enabled4['_ratioFlipAnim'];
  ((enabled4['_ratioFlipAnim'] = null), value30?.['cancel']?.());
  value29 && value29 !== previewEl && clearRatioResizePreviewTransform(value29);
  enabled4['_ratioFlipPreviewEl'] = previewEl;
  let value31 = null;
  const run2 = () => {
    if (enabled4['_ratioFlipAnim'] === value31) enabled4['_ratioFlipAnim'] = null;
    if (enabled4['_ratioFlipGeneration'] !== value28) return;
    (clearRatioResizePreviewTransform(previewEl),
      enabled4['_ratioFlipPreviewEl'] === previewEl && (enabled4['_ratioFlipPreviewEl'] = null));
  };
  ((previewEl['style']['transition'] = 'none'),
    (previewEl['style']['transformOrigin'] = 'bottom center'),
    (previewEl['style']['transform'] = transform));
  if (forceLayout) void previewEl['offsetWidth'];
  const run3 = () => {
    if (enabled4['_ratioFlipGeneration'] !== value28) return;
    enabled4['_ratioFlipStartCancel'] = null;
    if (
      typeof document !== 'undefined' &&
      typeof document['getElementById'] === 'function' &&
      !document['getElementById'](nodeId5)
    ) {
      run2();
      return;
    }
    ((value31 = previewEl['animate']([{ transform: transform }, { transform: 'none' }], {
      duration: ms,
      easing: 'cubic-bezier(0.25,\x200.46,\x200.45,\x200.94)',
      fill: 'forwards',
    })),
      (enabled4['_ratioFlipAnim'] = value31),
      (value31['onfinish'] = run2),
      (value31['oncancel'] = run2));
  };
  if (!deferStart) {
    run3();
    return;
  }
  if (typeof requestAnimationFrame === 'function') {
    const requestAnimationFrame2 = requestAnimationFrame(run3);
    enabled4['_ratioFlipStartCancel'] = () => {
      typeof cancelAnimationFrame === 'function' && cancelAnimationFrame(requestAnimationFrame2);
    };
    return;
  }
  const setTimeout3 = setTimeout(run3, 0x0);
  enabled4['_ratioFlipStartCancel'] = () => clearTimeout(setTimeout3);
}
export function disposeImageSchemaRatioResizeAnimation(
  enabled5,
  { nodeId: nodeId6, previewEl: previewEl2 } = {},
) {
  if (!enabled5) return;
  ((enabled5['_ratioFlipGeneration'] = (Number(enabled5['_ratioFlipGeneration']) || 0x0) + 0x1),
    cancelPendingRatioResizeFlipStart(enabled5));
  const value32 = enabled5['_ratioFlipAnim'];
  ((enabled5['_ratioFlipAnim'] = null), value32?.['cancel']?.());
  const value33 = enabled5['_ratioFlipPreviewEl'];
  clearRatioResizePreviewTransform(value33);
  previewEl2 && previewEl2 !== value33 && clearRatioResizePreviewTransform(previewEl2);
  enabled5['_ratioFlipPreviewEl'] = null;
  if (enabled5['_ratioAnimTimer']) clearTimeout(enabled5['_ratioAnimTimer']);
  enabled5['_ratioAnimTimer'] = null;
  const el4 = enabled5['_ratioAnimWrapperEl'];
  el4?.['classList']?.['remove']('is-ratio-animating');
  const el5 =
    typeof document !== 'undefined' && typeof document['getElementById'] === 'function' && nodeId6
      ? document['getElementById'](nodeId6)
      : null;
  (el5 && el5 !== el4 && el5['classList']?.['remove']('is-ratio-animating'),
    (enabled5['_ratioAnimWrapperEl'] = null));
}
export function applyImageSchemaRatioResizeAnimation(
  value34,
  {
    nodeId: nodeId7,
    previewEl: previewEl3,
    nodeData: nodeData8,
    patch: patch2,
    ms: ms = GENERATION_RATIO_RESIZE_ANIMATION_MS,
  } = {},
) {
  if (!patch2 || Object['keys'](patch2)['length'] === 0x0) return;
  (armImageSchemaRatioResizeAnimation(value34, nodeId7, ms),
    animateImageSchemaRatioResizeFlip(value34, {
      nodeId: nodeId7,
      previewEl: previewEl3,
      nodeData: nodeData8,
      patch: patch2,
      ms: ms,
    }));
}
