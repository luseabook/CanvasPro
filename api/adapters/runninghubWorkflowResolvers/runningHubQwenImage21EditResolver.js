const DEFAULT_IMAGE_SIZE = '1K',
  DEFAULT_ASPECT_RATIO = '1:1',
  DEFAULT_LONG_SIDE_BY_IMAGE_SIZE = Object.freeze({ '1K': 1024, '1.5K': 1536, '2K': 1920 });
function getPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function getPayloadParam(item, key, index) {
  const plainObject = getPlainObject(item?.generationParams);
  if (Object.prototype.hasOwnProperty.call(plainObject, key)) return plainObject[key];
  if (Object.prototype.hasOwnProperty.call(item || {}, key)) return item[key];
  return index;
}
function normalizeBoolean(result, data = false) {
  if (result === undefined || result === null || result === '') return data;
  const options = String(result).trim().toLowerCase();
  return result === true || ['true', '1', 'yes', 'on'].includes(options);
}
function isAdaptiveRatio(target) {
  const source = String(target || '')
    .trim()
    .toLowerCase();
  return ['', 'auto', 'adaptive', 'default', '自适应'].includes(source);
}
function resolveAspectRatio(next, current) {
  const entry = String(
    next?.resolvedRatioLabel || next?.generationParams?.resolvedRatioLabel || '',
  ).trim();
  if (entry && !isAdaptiveRatio(entry)) return entry;
  const payloadParam = getPayloadParam(
    next,
    'aspectRatio',
    current.defaultAspectRatio || DEFAULT_ASPECT_RATIO,
  );
  return isAdaptiveRatio(payloadParam)
    ? current.defaultAspectRatio || DEFAULT_ASPECT_RATIO
    : String(payloadParam).trim();
}
function parseAspectRatio(record, payload) {
  const handle = String(record || payload).trim(),
    [state, config] = handle.split(':'),
    widthRatio = Number(state),
    heightRatio = Number(config);
  if (widthRatio > 0 && heightRatio > 0) return { widthRatio: widthRatio, heightRatio: heightRatio };
  if (handle !== payload) return parseAspectRatio(payload, DEFAULT_ASPECT_RATIO);
  return { widthRatio: 1, heightRatio: 1 };
}
function roundDimension(scope, input, output) {
  return Math.max(output, Math.round(Number(scope || 0) / input) * input);
}
export function resolveRunningHubQwenImage21Dimensions(options2 = {}, value2 = {}) {
  const plainObject2 = getPlainObject(value2.dimensionsNode),
    plainObject3 = getPlainObject(plainObject2.longSideByImageSize),
    value3 = String(
      getPayloadParam(options2, 'imageSize', plainObject2.defaultImageSize || DEFAULT_IMAGE_SIZE),
    ).trim(),
    value4 =
      Number(plainObject3[value3]) ||
      Number(DEFAULT_LONG_SIDE_BY_IMAGE_SIZE[value3]) ||
      Number(plainObject3[plainObject2.defaultImageSize || DEFAULT_IMAGE_SIZE]) ||
      DEFAULT_LONG_SIDE_BY_IMAGE_SIZE[DEFAULT_IMAGE_SIZE],
    value5 = plainObject2.defaultAspectRatio || DEFAULT_ASPECT_RATIO,
    { widthRatio: widthRatio2, heightRatio: heightRatio2 } = parseAspectRatio(
      resolveAspectRatio(options2, plainObject2),
      value5,
    ),
    value6 = Math.max(1, Number(plainObject2.align) || 32),
    value7 = Math.max(value6, Number(plainObject2.minDimension) || 512),
    value8 = widthRatio2 >= heightRatio2,
    value9 = value8 ? value4 : (value4 * widthRatio2) / heightRatio2,
    value10 = value8 ? (value4 * heightRatio2) / widthRatio2 : value4;
  return {
    width: roundDimension(value9, value6, value7),
    height: roundDimension(value10, value6, value7),
  };
}
export async function resolveRunningHubQwenImage21EditPayload({
  executionManifest: executionManifest,
  payload: payload2,
  finalPrompt: finalPrompt,
  finalUrls: finalUrls,
  apiKey: apiKey,
  helpers: helpers,
}) {
  const plainObject4 = getPlainObject(executionManifest.mapping),
    list = (Array.isArray(finalUrls) ? finalUrls : [])
      .map((value11) => String(value11 || '').trim())
      .filter(Boolean),
    value12 = Math.max(0, Number(plainObject4.maxInputImages) || 0);
  if (list.length > value12) throw new Error('Qwen Image 2.1 最多支持 ' + value12 + ' 张参考图');
  const list2 = Array.isArray(plainObject4.imageLoaderNodes) ? plainObject4.imageLoaderNodes : [],
    list3 = Array.isArray(plainObject4.conditioningImageNodes)
      ? plainObject4.conditioningImageNodes
      : [];
  if (list2.length < value12 || list3.length < value12)
    throw new Error('Qwen Image 2.1 工作流图片节点映射不完整');
  const nodeInfoList = [];
  list.forEach((value13, value14) => {
    helpers.pushManifestNode(nodeInfoList, list2[value14], value13);
  });
  for (let value15 = list.length; value15 < value12; value15 += 1) {
    helpers.pushManifestNode(nodeInfoList, list3[value15], null);
  }
  const value16 = String(finalPrompt || '').replace(/@(?:图片|图像)(\d+)/gu, '<image$1>');
  helpers.pushManifestNode(nodeInfoList, plainObject4.promptNode, value16);
  const box = resolveRunningHubQwenImage21Dimensions(payload2, plainObject4);
  (helpers.pushManifestNode(nodeInfoList, plainObject4.dimensionsNode?.widthNode, box.width),
    helpers.pushManifestNode(nodeInfoList, plainObject4.dimensionsNode?.heightNode, box.height),
    helpers.pushManifestNode(
      nodeInfoList,
      plainObject4.promptEnhanceNode,
      normalizeBoolean(
        getPayloadParam(
          payload2,
          plainObject4.promptEnhanceNode?.field,
          plainObject4.promptEnhanceNode?.defaultValue ?? false,
        ),
        false,
      ),
    ));
  const enabled = list.length > 0;
  return (
    helpers.pushManifestNode(nodeInfoList, plainObject4.hasImageNode, enabled),
    helpers.pushManifestNode(nodeInfoList, plainObject4.latentSwitchNode, !enabled),
    helpers.buildTaskCreateVideoWorkflowRequest({
      executionManifest: executionManifest,
      payload: payload2,
      apiKey: apiKey,
      nodeInfoList: nodeInfoList,
    })
  );
}
