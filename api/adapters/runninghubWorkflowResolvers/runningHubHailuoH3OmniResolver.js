import { translateMinimaxH3EditorAssetMentions } from '../minimaxH3Prompt.js';
import {
  appendRunningHubReferenceMediaInputs,
  normalizeRunningHubReferenceMediaUrls,
} from './runningHubReferenceMediaResolverShared.js';
const HAILUO_H3_DEFAULT_RATIO = '自适应',
  HAILUO_H3_DEFAULT_QUALITY = 'economy';
function getPlainObject(value) {
  return value && typeof value === 'object' && !Array['isArray'](value) ? value : {};
}
function getPayloadParam(item, key, index) {
  const plainObject = getPlainObject(item?.['generationParams']);
  if (Object['prototype']['hasOwnProperty']['call'](plainObject, key)) return plainObject[key];
  if (Object['prototype']['hasOwnProperty']['call'](item || {}, key)) return item[key];
  return index;
}
function isAdaptiveRatio(result) {
  const data = String(result || '')['trim'](),
    options = data['toLowerCase']();
  return data === '自适应' || options === 'auto' || options === 'adaptive' || options === 'default';
}
function parseAspectRatio(target, source = HAILUO_H3_DEFAULT_RATIO) {
  const next = String(target || source)['trim'](),
    [current, entry] = next['split'](':'),
    widthRatio = Number(current),
    heightRatio = Number(entry);
  if (widthRatio > 0 && heightRatio > 0) return { widthRatio: widthRatio, heightRatio: heightRatio };
  if (next !== source) return parseAspectRatio(source, HAILUO_H3_DEFAULT_RATIO);
  return { widthRatio: 16, heightRatio: 9 };
}
function roundToMultiple(record, payload) {
  const count = Number(payload),
    handle = Number['isFinite'](count) && count > 0 ? count : 32;
  return Math['max'](handle, Math['round'](Number(record || 0) / handle) * handle);
}
function resolveAspectRatio(state, config) {
  const payloadParam = getPayloadParam(
    state,
    'aspectRatio',
    config['defaultAspectRatio'] || HAILUO_H3_DEFAULT_RATIO,
  );
  if (!isAdaptiveRatio(payloadParam)) return payloadParam;
  return (
    state?.['resolvedRatioLabel'] ||
    state?.['generationParams']?.['resolvedRatioLabel'] ||
    config['defaultAspectRatio'] ||
    HAILUO_H3_DEFAULT_RATIO
  );
}
export function resolveRunningHubHailuoH3OmniDimensions(options2 = {}, scope = {}) {
  const input = String(
      getPayloadParam(options2, 'rhHailuoH3Quality', scope['defaultQuality'] || HAILUO_H3_DEFAULT_QUALITY),
    )['trim'](),
    plainObject2 = getPlainObject(scope['qualityLongEdges']),
    output = Number(plainObject2[scope['defaultQuality'] || HAILUO_H3_DEFAULT_QUALITY]) || 960,
    width = Number(plainObject2[input]) || output,
    { widthRatio: widthRatio2, heightRatio: heightRatio2 } = parseAspectRatio(
      resolveAspectRatio(options2, scope),
      scope['defaultAspectRatio'] || HAILUO_H3_DEFAULT_RATIO,
    ),
    value2 = Number(scope['dimensionMultiple']) || 32;
  if (widthRatio2 === heightRatio2) return { width: width, height: width };
  if (widthRatio2 > heightRatio2)
    return { width: width, height: roundToMultiple((width * heightRatio2) / widthRatio2, value2) };
  return { width: roundToMultiple((width * widthRatio2) / heightRatio2, value2), height: width };
}
function resolveSeconds(value3, value4) {
  const value5 = Number(getPayloadParam(value3, 'duration', value4['secondsNode']?.['defaultValue'] ?? 5)),
    value6 = Number(value4['secondsNode']?.['defaultValue']) || 5,
    value7 = Number(value4['secondsNode']?.['min']) || 3,
    value8 = Number(value4['secondsNode']?.['max']) || 15,
    value9 = Number['isFinite'](value5) ? value5 : value6;
  return Math['round'](Math['max'](value7, Math['min'](value8, value9)));
}
function getFrameSources(options3 = {}) {
  const plainObject3 = getPlainObject(options3['inputUrlsBySlot']),
    runningHubReferenceMediaUrls = normalizeRunningHubReferenceMediaUrls(options3['inputImages']),
    firstFrame = String(plainObject3['firstFrame'] || options3['firstFrameUrl'] || '')['trim'](),
    lastFrame = String(plainObject3['lastFrame'] || options3['lastFrameUrl'] || options3['lastFrame'] || '')[
      'trim'
    ](),
    enabled = Boolean(firstFrame || lastFrame);
  return {
    firstFrame: firstFrame || (!enabled ? runningHubReferenceMediaUrls[0] || '' : ''),
    lastFrame: lastFrame || (!enabled ? runningHubReferenceMediaUrls[1] || '' : ''),
  };
}
function resolveReferenceModeValue(value10, value11) {
  const plainObject4 = getPlainObject(value11['modeNode']),
    value12 = String(plainObject4['referenceModelField'] || '')['trim'](),
    value13 = String(plainObject4['referenceModelDefaultValue'] || 'ref2')['trim'](),
    value14 = value12 ? String(getPayloadParam(value10, value12, value13))['trim']() : value13,
    plainObject5 = getPlainObject(plainObject4['referenceValueMap']);
  return plainObject5[value14] ?? plainObject4['referenceValue'] ?? '2';
}
async function appendFrameInputs({
  mapping: mapping,
  payload: payload2,
  apiKey: apiKey,
  ctx: ctx,
  helpers: helpers,
  nodeInfoList: nodeInfoList,
}) {
  const { firstFrame: firstFrame2, lastFrame: lastFrame2 } = getFrameSources(payload2),
    list = [
      { slot: 'firstFrame', url: firstFrame2, loaderNode: mapping['imageLoaderNodes']?.[0] },
      { slot: 'lastFrame', url: lastFrame2, loaderNode: mapping['imageLoaderNodes']?.[1] },
    ]['filter']((response) => response['url']);
  list['forEach']((enabled2) => {
    if (!enabled2['loaderNode']?.['nodeId'] || !enabled2['loaderNode']?.['fieldName'])
      throw new Error('海螺H3 工作流图片加载节点映射不完整');
  });
  const value15 = await helpers['uploadRunningHubMediaInputs'](
    'image',
    list['map']((response2) => response2['url']),
    payload2,
    apiKey,
    ctx,
    { uploadFailedMessage: '首尾帧图片上传失败' },
  );
  list['forEach']((value16, value17) => {
    helpers['pushManifestNode'](nodeInfoList, value16['loaderNode'], value15[value17]);
  });
  if (firstFrame2 && !lastFrame2)
    helpers['pushManifestNode'](
      nodeInfoList,
      {
        nodeId: mapping['firstLastFrameNode']?.['nodeId'],
        fieldName: mapping['firstLastFrameNode']?.['lastFieldName'],
      },
      null,
    );
  else
    !firstFrame2 &&
      lastFrame2 &&
      helpers['pushManifestNode'](
        nodeInfoList,
        {
          nodeId: mapping['firstLastFrameNode']?.['nodeId'],
          fieldName: mapping['firstLastFrameNode']?.['firstFieldName'],
        },
        null,
      );
  return list['length'] > 0
    ? (mapping['modeNode']?.['frameValue'] ?? '1')
    : (mapping['modeNode']?.['textValue'] ?? '0');
}
async function appendReferenceInputs({
  mapping: mapping2,
  payload: payload3,
  apiKey: apiKey2,
  ctx: ctx2,
  helpers: helpers2,
  nodeInfoList: nodeInfoList2,
}) {
  const referenceNodeId = mapping2['referenceNode'] || {};
  return (
    await appendRunningHubReferenceMediaInputs({
      payload: payload3,
      apiKey: apiKey2,
      ctx: ctx2,
      helpers: helpers2,
      nodeInfoList: nodeInfoList2,
      requiredTotal: 1,
      requiredTotalMessage: '海螺H3 全能参考模式至少需要一张图片、一个视频或一段音频',
      specs: [
        {
          kind: 'image',
          payloadField: 'inputImages',
          loaderNodes: mapping2['imageLoaderNodes'],
          referenceNodeId: referenceNodeId['nodeId'],
          referenceFieldPrefixes: [referenceNodeId['imageFieldPrefix']],
          slotCount: 9,
          maxCount: 9,
          maxCountMessage: '海螺H3 全能参考模式最多支持 9 张图片',
          mappingMissingMessage: '海螺H3 工作流图片加载节点映射不完整',
          uploadFailedMessage: '全能参考图片上传失败',
        },
        {
          kind: 'video',
          payloadField: 'inputVideos',
          loaderNodes: mapping2['videoLoaderNodes'],
          referenceNodeId: referenceNodeId['nodeId'],
          referenceFieldPrefixes: [
            referenceNodeId['videoFieldPrefix'],
            referenceNodeId['videoAudioFieldPrefix'],
          ],
          slotCount: 3,
          maxCount: 3,
          maxCountMessage: '海螺H3 全能参考模式最多支持 3 个视频',
          mappingMissingMessage: '海螺H3 工作流视频加载节点映射不完整',
          uploadFailedMessage: '全能参考视频上传失败',
        },
        {
          kind: 'audio',
          payloadField: 'inputAudios',
          loaderNodes: mapping2['audioLoaderNodes'],
          referenceNodeId: referenceNodeId['nodeId'],
          referenceFieldPrefixes: [referenceNodeId['audioFieldPrefix']],
          slotCount: 3,
          maxCount: 3,
          maxCountMessage: '海螺H3 全能参考模式最多支持 3 个音频',
          mappingMissingMessage: '海螺H3 工作流音频加载节点映射不完整',
          uploadFailedMessage: '全能参考音频上传失败',
        },
      ],
    }),
    resolveReferenceModeValue(payload3, mapping2)
  );
}
export async function resolveRunningHubHailuoH3OmniPayload({
  executionManifest: executionManifest,
  payload: payload4,
  finalPrompt: finalPrompt,
  apiKey: apiKey3,
  ctx: ctx3,
  helpers: helpers3,
}) {
  const mapping3 = executionManifest['mapping'] || {},
    nodeInfoList3 = [],
    value18 = String(getPayloadParam(payload4, 'rh_hailuo_h3_mode', 'frames'))['trim'](),
    value19 =
      value18 === 'reference'
        ? await appendReferenceInputs({
            mapping: mapping3,
            payload: payload4,
            apiKey: apiKey3,
            ctx: ctx3,
            helpers: helpers3,
            nodeInfoList: nodeInfoList3,
          })
        : await appendFrameInputs({
            mapping: mapping3,
            payload: payload4,
            apiKey: apiKey3,
            ctx: ctx3,
            helpers: helpers3,
            nodeInfoList: nodeInfoList3,
          }),
    box = resolveRunningHubHailuoH3OmniDimensions(payload4, mapping3);
  (helpers3['pushManifestNode'](
    nodeInfoList3,
    mapping3['promptNode'],
    translateMinimaxH3EditorAssetMentions(finalPrompt),
  ),
    helpers3['pushManifestNode'](nodeInfoList3, mapping3['modeNode'], value19));
  const plainObject6 = getPlainObject(payload4?.['generationParams']);
  return (
    helpers3['pushManifestNode'](
      nodeInfoList3,
      mapping3['accelerationNode'],
      helpers3['getMappedValue'](
        plainObject6[mapping3['accelerationNode']?.['field']],
        mapping3['accelerationNode'],
      ),
    ),
    helpers3['pushManifestNode'](nodeInfoList3, mapping3['secondsNode'], resolveSeconds(payload4, mapping3)),
    helpers3['pushManifestNode'](nodeInfoList3, mapping3['widthNode'], box['width']),
    helpers3['pushManifestNode'](nodeInfoList3, mapping3['heightNode'], box['height']),
    helpers3['buildTaskCreateVideoWorkflowRequest']({
      executionManifest: executionManifest,
      payload: payload4,
      apiKey: apiKey3,
      nodeInfoList: nodeInfoList3,
    })
  );
}
