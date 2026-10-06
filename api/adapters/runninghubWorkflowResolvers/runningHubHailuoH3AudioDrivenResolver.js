import { translateMinimaxH3EditorAssetMentions } from '../minimaxH3Prompt.js';
import {
  appendRunningHubReferenceMediaInputs,
  normalizeRunningHubReferenceMediaUrls,
} from './runningHubReferenceMediaResolverShared.js';
import { resolveRunningHubHailuoH3OmniDimensions } from './runningHubHailuoH3OmniResolver.js';
function getPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function getPayloadParam(item, key, index) {
  const plainObject = getPlainObject(item?.generationParams);
  if (Object.prototype.hasOwnProperty.call(plainObject, key)) return plainObject[key];
  if (Object.prototype.hasOwnProperty.call(item || {}, key)) return item[key];
  return index;
}
function mergeReferenceInputs(...list) {
  return normalizeRunningHubReferenceMediaUrls(
    list.flatMap((result) => (Array.isArray(result) ? result : [result])),
  );
}
export async function resolveRunningHubHailuoH3AudioDrivenPayload({
  executionManifest: executionManifest,
  payload: payload,
  finalPrompt: finalPrompt,
  apiKey: apiKey,
  ctx: ctx,
  helpers: helpers,
}) {
  const loaderNodes = executionManifest.mapping || {},
    referenceNodeId = loaderNodes.referenceNode || {},
    data = loaderNodes.referenceLimits || {},
    nodeInfoList = [],
    plainObject2 = getPlainObject(payload?.inputUrlsBySlot),
    payload2 = {
      ...payload,
      inputImages: mergeReferenceInputs(payload?.inputImages),
      inputVideos: mergeReferenceInputs(payload?.inputVideos, payload?.videoUrl),
      inputAudios: mergeReferenceInputs(
        payload?.inputAudios,
        plainObject2.audio,
        payload?.audioUrl,
      ),
    };
  (await appendRunningHubReferenceMediaInputs({
    payload: payload2,
    apiKey: apiKey,
    ctx: ctx,
    helpers: helpers,
    nodeInfoList: nodeInfoList,
    specs: [
      {
        kind: 'image',
        payloadField: 'inputImages',
        loaderNodes: loaderNodes.imageLoaderNodes,
        referenceNodeId: referenceNodeId.nodeId,
        referenceFieldPrefixes: [referenceNodeId.imageFieldPrefix],
        slotCount: Number(data.image) || 4,
        maxCount: Number(data.image) || 4,
        maxCountMessage: '海螺H3音频驱动最多支持 4 张图片',
        mappingMissingMessage: '海螺H3音频驱动图片节点映射不完整',
        uploadFailedMessage: '海螺H3音频驱动图片上传失败',
      },
      {
        kind: 'video',
        payloadField: 'inputVideos',
        loaderNodes: loaderNodes.videoLoaderNodes,
        referenceNodeId: referenceNodeId.nodeId,
        referenceFieldPrefixes: [referenceNodeId.videoFieldPrefix],
        slotCount: Number(data.video) || 1,
        maxCount: Number(data.video) || 1,
        maxCountMessage: '海螺H3音频驱动最多支持 1 个视频',
        mappingMissingMessage: '海螺H3音频驱动视频节点映射不完整',
        uploadFailedMessage: '海螺H3音频驱动视频上传失败',
      },
      {
        kind: 'audio',
        payloadField: 'inputAudios',
        loaderNodes: loaderNodes.audioLoaderNodes,
        referenceNodeId: referenceNodeId.nodeId,
        referenceFieldPrefixes: [referenceNodeId.audioFieldPrefix],
        slotCount: Number(data.audio) || 1,
        maxCount: Number(data.audio) || 1,
        minCount: 1,
        maxCountMessage: '海螺H3音频驱动只允许 1 个音频参考',
        minCountMessage: '海螺H3音频驱动必须接入音频参考',
        mappingMissingMessage: '海螺H3音频驱动音频节点映射不完整',
        uploadFailedMessage: '海螺H3音频驱动音频上传失败',
      },
    ],
  }),
    helpers.pushManifestNode(
      nodeInfoList,
      loaderNodes.promptNode,
      translateMinimaxH3EditorAssetMentions(finalPrompt),
    ));
  const box = resolveRunningHubHailuoH3OmniDimensions(payload, loaderNodes);
  return (
    helpers.pushManifestNode(nodeInfoList, loaderNodes.widthNode, box.width),
    helpers.pushManifestNode(nodeInfoList, loaderNodes.heightNode, box.height),
    helpers.pushManifestNode(
      nodeInfoList,
      loaderNodes.accelerationNode,
      helpers.getMappedValue(
        getPayloadParam(
          payload,
          loaderNodes.accelerationNode?.field,
          loaderNodes.accelerationNode?.defaultValue,
        ),
        loaderNodes.accelerationNode,
      ),
    ),
    helpers.buildTaskCreateVideoWorkflowRequest({
      executionManifest: executionManifest,
      payload: payload,
      apiKey: apiKey,
      nodeInfoList: nodeInfoList,
    })
  );
}
