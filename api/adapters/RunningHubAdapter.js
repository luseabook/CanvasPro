import { resolveModelExecution } from '../../src/manifests/index.js';
import { normalizeRatioLabelText } from '../imageRatioPolicy.js';
import { buildImageRequestFromManifest } from './ModelApiManifestNormalizer.js';
import { getRunningHubWorkflowPayloadResolver } from './runninghubWorkflowResolvers/index.js';
import {
  getRunningHubProviderProfileId,
  normalizeRunningHubModelApiProfileId,
  resolveRunningHubModelApiBaseUrl,
} from '../../src/modules/runningHubProviderProfiles.js';
import { normalizeRunningHubInstanceType } from '../../src/modules/runningHubInstanceTypes.js';
import { uploadModelApiMediaInputs } from '../mediaInputUploadRouter.js';
import { createMediaUploadError } from '../mediaUploadErrorDetails.js';
const RH_V54_SOURCE_VIDEO_MISSING_MESSAGE = '未获取到源视频 URL，请重新连接或重新上传源视频后再生成。',
  RH_V54_SOURCE_VIDEO_UPLOAD_FAILED_MESSAGE =
    '源视频上传失败，可能是网络延迟或视频文件暂时无法访问，请稍后重试，或重新上传源视频。',
  RH_VIDEO_FPS_OPTIONS = Object.freeze([16, 24, 30]),
  RH_MIN_VIDEO_RESOLUTION = 0x340,
  RUNNINGHUB_WORKFLOW_DEFAULT_RATIO = '1:1',
  RUNNINGHUB_WORKFLOW_RATIO_SET = new Set([
    '1:1',
    '9:16',
    '16:9',
    '3:4',
    '4:3',
    '3:2',
    '2:3',
    '5:4',
    '4:5',
    '21:9',
  ]);
function isAdvancedModeEnabled() {
  return typeof window !== 'undefined' && window.ADVANCED_MODE === true;
}
function normalizeRhVideoFps(value) {
  const item = Math.trunc(Number(value));
  return RH_VIDEO_FPS_OPTIONS.includes(item) ? item : 24;
}
function normalizeRhVideoResolution(key, index = RH_MIN_VIDEO_RESOLUTION) {
  const result = Number(key);
  return Number.isFinite(result) ? Math.max(RH_MIN_VIDEO_RESOLUTION, Math.trunc(result)) : index;
}
function normalizeRunningHubWorkflowRatio(data) {
  const enabled2 = String(data || '').trim();
  if (!enabled2) return RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
  const list = normalizeRatioLabelText(enabled2),
    options = list.toLowerCase();
  if (
    options === 'auto' ||
    options === 'default' ||
    list === '默认' ||
    list === '自适应' ||
    options === 'original' ||
    list === '原图比例'
  )
    return RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
  if (!list.includes(':')) return RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
  const [target, source] = list.split(':'),
    count = Number.parseFloat(target),
    count2 = Number.parseFloat(source);
  if (!(count > 0 && count2 > 0)) return RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
  const next = count + ':' + count2;
  return RUNNINGHUB_WORKFLOW_RATIO_SET.has(next) ? next : RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
}
function normalizeQwenImageEditModeIndex(current) {
  const entry = String(current || '')
    .trim()
    .toLowerCase();
  if (entry === '0' || entry === 'qwen2509' || entry === '2509') return '0';
  return '1';
}
function normalizeQwenFirstImageModeIndex(record) {
  const payload = String(record || '')
    .trim()
    .toLowerCase();
  if (payload === '1' || payload === 'pose' || payload === '姿势图') return '1';
  if (payload === '2' || payload === 'depth' || payload === '深度图') return '2';
  return '0';
}
function normalizeQwenImageEditQuality(handle) {
  const state = String(handle || '')
    .trim()
    .toUpperCase();
  if (state === '1.5K') return '1.5K';
  return state === '1K' ? '1K' : '2K';
}
function resolveQwenImageEditDimensions(config, scope) {
  const qwenImageEditQuality = normalizeQwenImageEditQuality(config),
    input = qwenImageEditQuality === '1K' ? 0x400 : qwenImageEditQuality === '1.5K' ? 0x600 : 0x780,
    runningHubWorkflowRatio = normalizeRunningHubWorkflowRatio(scope),
    [output, value2] = runningHubWorkflowRatio.split(':'),
    value3 = Number.parseFloat(output) || 1,
    value4 = Number.parseFloat(value2) || 1,
    value5 = value3 >= value4,
    value6 = value5 ? input : (input * value3) / value4,
    value7 = value5 ? (input * value4) / value3 : input,
    value8 = 64,
    width = (value9) => Math.max(0x200, Math.round(Number(value9 || 0) / value8) * value8);
  return { width: width(value6), height: width(value7) };
}
function normalizeManifestMappedValue(value10, value11) {
  const value12 = String(value10 ?? value11?.defaultValue ?? '').trim(),
    value13 = value11?.valueMap || {};
  return (
    value13[value12] ||
    value13[value12.toLowerCase()] ||
    value13[String(value11?.defaultValue || '')] ||
    value12
  );
}
function formatManifestPromptNodeValue(value14, value15) {
  const value16 = String(value14 || '').trim(),
    value17 = String(value15?.defaultValue ?? ''),
    enabled3 = value16 || value17;
  if (!enabled3) return '';
  return '' + String(value15?.prefix ?? '') + enabled3 + String(value15?.suffix ?? '');
}
function normalizeManifestImageNode(description, value18) {
  if (description && typeof description === 'object' && !Array.isArray(description))
    return {
      nodeId: String(description.nodeId || '').trim(),
      fieldName: String(description.fieldName || 'image').trim() || 'image',
      description: description.description || '图' + (value18 + 1),
    };
  return { nodeId: String(description || '').trim(), fieldName: 'image', description: '图' + (value18 + 1) };
}
function getManifestPayloadPathValue(value19, value20) {
  const enabled4 = String(value20 || '').trim();
  if (!enabled4) return undefined;
  return enabled4.split('.').reduce((item2, value21) => {
    if (item2 === undefined || item2 === null) return undefined;
    return item2[value21];
  }, value19);
}
function resolveManifestPayloadValue(
  value22,
  value23 = [],
  value24 = undefined,
  { allowEmpty: allowEmpty = false } = {},
) {
  const list2 = Array.isArray(value23) ? value23 : [value23];
  for (const value25 of list2.filter(Boolean)) {
    const manifestPayloadPathValue = getManifestPayloadPathValue(value22, value25);
    if (allowEmpty && manifestPayloadPathValue !== undefined && manifestPayloadPathValue !== null)
      return manifestPayloadPathValue;
    if (
      manifestPayloadPathValue !== undefined &&
      manifestPayloadPathValue !== null &&
      String(manifestPayloadPathValue).trim() !== ''
    )
      return manifestPayloadPathValue;
  }
  return value24;
}
function normalizeManifestValueNodeValue(value26, value27) {
  const list3 = [
    ...(Array.isArray(value27?.allowedValues) ? value27.allowedValues : []),
    ...(isAdvancedModeEnabled() && Array.isArray(value27?.advancedAllowedValues)
      ? value27.advancedAllowedValues
      : []),
  ]
    .map((item3) => Number(item3))
    .filter(Number.isFinite);
  if (list3.length === 0) return value26;
  const value28 = Number(value26),
    value29 = Number(value27?.defaultValue),
    value30 = Number.isFinite(value28) ? value28 : Number.isFinite(value29) ? value29 : list3[0];
  return list3.reduce(
    (item4, value31) => (Math.abs(value31 - value30) < Math.abs(item4 - value30) ? value31 : item4),
    list3[0],
  );
}
async function buildOpenApiAiAppWorkflowRequestFromManifest({
  executionManifest: executionManifest,
  payload: payload2,
  finalPrompt: finalPrompt,
  finalUrls: finalUrls,
  apiKey: apiKey,
  ctx: ctx,
}) {
  if (
    !executionManifest ||
    executionManifest.adapterType !== 'workflow' ||
    executionManifest.submitMode !== 'openapi-v2-ai-app'
  )
    return null;
  const description2 = executionManifest.mapping || {},
    value32 = executionManifest.validation || {},
    value33 = Math.max(1, Number(description2.maxInputImages) || 1),
    list4 = finalUrls.filter(Boolean).slice(0, value33),
    value34 = Math.max(0, Number(value32.minInputImages) || 0);
  if (list4.length < value34) throw new Error(value32.missingInputMessage || '请先添加至少一张参考图再生成');
  const nodeInfoList = [],
    value35 = Array.isArray(description2.imageNodes) ? description2.imageNodes : [];
  list4.forEach((fieldValue, value36) => {
    const fieldName = normalizeManifestImageNode(value35[value36], value36),
      nodeId = fieldName.nodeId;
    if (!nodeId) return;
    nodeInfoList.push({
      nodeId: nodeId,
      fieldName: fieldName.fieldName,
      fieldValue: fieldValue,
      description: fieldName.description,
    });
  });
  const list5 = Array.isArray(description2.optionalImageNodes) ? description2.optionalImageNodes : [];
  if (list5.length > 0) {
    const list6 = list5.map((item5) =>
        String(resolveManifestPayloadValue(payload2, item5.fields, '') || '').trim(),
      ),
      value37 =
        ctx?.processInputImagesPreserveOrder && list6.some(Boolean)
          ? await ctx.processInputImagesPreserveOrder(list6, apiKey, {
              compress: false,
              provider: 'runninghub',
            })
          : list6;
    list5.forEach((description3, value38) => {
      const fieldValue2 = String(value37?.[value38] || '').trim();
      if (!fieldValue2 || !description3?.nodeId || !description3?.fieldName) return;
      (nodeInfoList.push({
        nodeId: String(description3.nodeId),
        fieldName: String(description3.fieldName),
        fieldValue: fieldValue2,
        description: description3.description || String(description3.fieldName),
      }),
        description3.enableNode?.nodeId &&
          description3.enableNode?.fieldName &&
          nodeInfoList.push({
            nodeId: String(description3.enableNode.nodeId),
            fieldName: String(description3.enableNode.fieldName),
            fieldValue: String(description3.enableNode.value ?? 'true'),
            description: description3.enableNode.description || String(description3.enableNode.fieldName),
          }));
    });
  }
  description2.promptNode?.nodeId &&
    description2.promptNode?.fieldName &&
    nodeInfoList.push({
      nodeId: String(description2.promptNode.nodeId),
      fieldName: String(description2.promptNode.fieldName),
      fieldValue: formatManifestPromptNodeValue(finalPrompt, description2.promptNode),
      description: description2.promptNode.description || '提示词',
    });
  if (description2.dimensionsNode?.nodeId) {
    const box = resolveQwenImageEditDimensions(
      payload2.imageSize,
      payload2.resolvedRatioLabel || payload2.aspectRatio,
    );
    (nodeInfoList.push({
      nodeId: String(description2.dimensionsNode.nodeId),
      fieldName: 'width',
      fieldValue: String(box.width),
      description: 'width',
    }),
      nodeInfoList.push({
        nodeId: String(description2.dimensionsNode.nodeId),
        fieldName: 'height',
        fieldValue: String(box.height),
        description: 'height',
      }));
  }
  [description2.firstImageModeNode, description2.editModeNode].forEach((description4) => {
    if (!description4?.nodeId || !description4?.fieldName || !description4?.field) return;
    nodeInfoList.push({
      nodeId: String(description4.nodeId),
      fieldName: String(description4.fieldName),
      fieldValue: normalizeManifestMappedValue(payload2[description4.field], description4),
      description: description4 === description2.firstImageModeNode ? '把第一张图变为' : '模式选择',
    });
  });
  Array.isArray(description2.valueNodes) &&
    description2.valueNodes.forEach((description5) => {
      if (!description5?.nodeId || !description5?.fieldName) return;
      const value39 = [
        description5.field,
        ...(Array.isArray(description5.fallbackFields) ? description5.fallbackFields : []),
      ].filter(Boolean);
      let manifestValueNodeValue = '';
      for (const value40 of value39) {
        const manifestPayloadPathValue2 = getManifestPayloadPathValue(payload2, value40);
        if (
          manifestPayloadPathValue2 !== undefined &&
          manifestPayloadPathValue2 !== null &&
          String(manifestPayloadPathValue2).trim() !== ''
        ) {
          manifestValueNodeValue = manifestPayloadPathValue2;
          break;
        }
      }
      if (manifestValueNodeValue === '') manifestValueNodeValue = description5.defaultValue ?? '';
      ((manifestValueNodeValue = normalizeManifestValueNodeValue(manifestValueNodeValue, description5)),
        nodeInfoList.push({
          nodeId: String(description5.nodeId),
          fieldName: String(description5.fieldName),
          fieldValue: String(manifestValueNodeValue),
          description: description5.description || String(description5.fieldName),
        }));
    });
  if (description2.imageCountNode?.nodeId && description2.imageCountNode?.fieldName) {
    const value41 = Number(description2.imageCountNode.offset) || 0;
    nodeInfoList.push({
      nodeId: String(description2.imageCountNode.nodeId),
      fieldName: String(description2.imageCountNode.fieldName),
      fieldValue: String(Math.max(0, list4.length + value41)),
      description: '入参多少张图片',
    });
  }
  const instanceType = payload2[executionManifest.instanceType?.field] === 'plus' ? 'plus' : 'default',
    value42 = String(executionManifest.appId || executionManifest.workflowId || '').trim();
  return {
    url: '/api/v2/proxy/image',
    headers: { 'Content-Type': 'application/json' },
    body: {
      apiUrl: 'https://www.runninghub.cn/openapi/v2/run/ai-app/' + value42,
      apiKey: apiKey,
      nodeInfoList: nodeInfoList,
      instanceType: instanceType,
      usePersonalQueue: 'false',
    },
    isAsync: true,
    taskIdPath: executionManifest.result?.taskIdPath || 'taskId',
    adapterTrace: { source: 'manifest', executionId: executionManifest.id, modelId: payload2.model },
    pollUrlBuilder: () => 'https://www.runninghub.cn/openapi/v2/query',
    resultExtractor: (response) => {
      if (response.status === 'COMPLETED' && Array.isArray(response.results))
        return response.results.map((response2) => response2.url || response2.imageUrl).filter(Boolean);
      return [];
    },
  };
}
function normalizeVideoMattingMaskModeIndex(value43) {
  const enabled5 = String(value43 || '').trim();
  if (!enabled5 || enabled5 === '0') return '0';
  if (enabled5 === '1') return '1';
  if (enabled5 === '2') return '2';
  const value44 = enabled5.toLowerCase();
  if (value44 === 'sam3') return '1';
  if (value44 === 'ma2' || value44 === 'matanyone2') return '2';
  return '0';
}
function buildRunningHubVideoResultExtractor() {
  return (response3) => {
    if (response3.status === 'COMPLETED' && Array.isArray(response3.results))
      return response3.results.map((response4) => response4.videoUrl || response4.url).filter(Boolean);
    return [];
  };
}
function buildOpenApiVideoWorkflowRequest({
  executionManifest: executionManifest2,
  payload: payload3,
  apiKey: apiKey2,
  nodeInfoList: nodeInfoList2,
}) {
  const instanceType2 = payload3[executionManifest2.instanceType?.field] === 'plus' ? 'plus' : 'default',
    value45 = String(executionManifest2.appId || executionManifest2.workflowId || '').trim();
  return {
    url: '/api/v2/proxy/image',
    headers: { 'Content-Type': 'application/json' },
    body: {
      apiUrl: 'https://www.runninghub.cn/openapi/v2/run/ai-app/' + value45,
      apiKey: apiKey2,
      nodeInfoList: nodeInfoList2,
      instanceType: instanceType2,
      usePersonalQueue: 'false',
    },
    isAsync: true,
    taskIdPath: executionManifest2.result?.taskIdPath || 'taskId',
    adapterTrace: { source: 'manifest', executionId: executionManifest2.id, modelId: payload3.model },
    pollUrlBuilder: () => 'https://www.runninghub.cn/openapi/v2/query',
    resultExtractor: buildRunningHubVideoResultExtractor(),
  };
}
function buildTaskCreateVideoWorkflowRequest({
  executionManifest: executionManifest3,
  payload: payload4,
  apiKey: apiKey3,
  nodeInfoList: nodeInfoList3,
}) {
  const instanceType3 = payload4[executionManifest3.instanceType?.field] === 'plus' ? 'plus' : 'default';
  return {
    url: '/api/v2/runninghubwf/run',
    apiUrl: 'https://www.runninghub.cn/task/openapi/create',
    headers: { 'Content-Type': 'application/json' },
    body: {
      apiKey: apiKey3,
      workflowId: String(executionManifest3.workflowId || executionManifest3.appId || ''),
      addMetadata: false,
      nodeInfoList: nodeInfoList3,
      instanceType: instanceType3,
      usePersonalQueue: 'false',
    },
    isAsync: true,
    taskIdPath: executionManifest3.result?.taskIdPath || 'taskId',
    adapterTrace: { source: 'manifest', executionId: executionManifest3.id, modelId: payload4.model },
    pollUrlBuilder: () => 'https://www.runninghub.cn/openapi/v2/query',
    resultExtractor: buildRunningHubVideoResultExtractor(),
  };
}
function pushManifestNode(list7, enabled6, value46, description6 = {}) {
  if (!enabled6?.nodeId || !enabled6?.fieldName) return;
  list7.push({
    nodeId: String(enabled6.nodeId),
    fieldName: String(description6.fieldName || enabled6.fieldName),
    fieldValue: String(value46),
    ...(enabled6.description || description6.description
      ? { description: description6.description || enabled6.description }
      : {}),
  });
}
function getMappedValue(value47, value48, value49 = '') {
  const value50 = String(value47 ?? '').trim(),
    value51 = value48?.valueMap || {};
  if (value50 && value51[value50] !== undefined) return value51[value50];
  if (value50 && value51[value50.toLowerCase()] !== undefined) return value51[value50.toLowerCase()];
  return value48?.defaultValue ?? value49;
}
async function resolveRunningHubVideoInput(
  value52,
  value53,
  {
    urlField: urlField = 'videoUrl',
    fileField: fileField = 'videoFile',
    missingMessage: missingMessage = '请接入源视频',
    uploadFailedMessage: uploadFailedMessage = '源视频上传失败',
  } = {},
) {
  let enabled7 = '';
  const value54 = String(value52[urlField] || '').trim();
  if (value54) {
    const { processInputVideos: processInputVideos } = await import('../videoUploadApi.js'),
      list8 = await processInputVideos([value54], value53);
    if (list8.length > 0) enabled7 = list8[0];
  } else {
    if (value52[fileField]) {
      const { uploadVideoToRunningHub: uploadVideoToRunningHub } = await import('../videoUploadApi.js');
      enabled7 = await uploadVideoToRunningHub(value52[fileField], value53);
    }
  }
  if (!enabled7) throw new Error(value54 || value52[fileField] ? uploadFailedMessage : missingMessage);
  return enabled7;
}
async function resolveRunningHubOptionalVideoInput(value55, value56, value57) {
  const enabled8 = String(value55[value57] || '').trim();
  if (!enabled8) return '';
  const { processInputVideos: processInputVideos2 } = await import('../videoUploadApi.js'),
    value58 = await processInputVideos2([enabled8], value56);
  return String(value58?.[0] || '').trim();
}
async function resolveRunningHubAudioInput(
  value59,
  value60,
  {
    urlField: urlField = 'audioUrl',
    fileField: fileField = 'audioFile',
    required: required = false,
    missingMessage: missingMessage = '请接入音频',
  } = {},
) {
  let enabled9 = '';
  const value61 = String(value59[urlField] || '').trim();
  if (value61) {
    const { processInputAudios: processInputAudios } = await import('../audioUploadApi.js'),
      list9 = await processInputAudios([value61], value60);
    if (list9.length > 0) enabled9 = list9[0];
  } else {
    if (value59[fileField]) {
      const { uploadAudioToRunningHub: uploadAudioToRunningHub } = await import('../audioUploadApi.js');
      enabled9 = await uploadAudioToRunningHub(value59[fileField], value60);
    }
  }
  if (required && !enabled9) throw new Error(missingMessage);
  return enabled9;
}
async function resolveRunningHubFirstImageInput(
  value62,
  value63,
  value64,
  {
    field: field = 'inputUrls',
    required: required = false,
    missingMessage: missingMessage = '请接入参考图',
    compress: compress = true,
  } = {},
) {
  const list10 = Array.isArray(value62[field])
    ? value62[field]
    : String(value62[field] || '').trim()
      ? [value62[field]]
      : [];
  if (!list10.length) {
    if (required) throw new Error(missingMessage);
    return '';
  }
  const value65 = await value64.processInputImages(list10, value63, {
      applyInputQualityProfile: compress,
      provider: 'runninghub',
    }),
    enabled10 = String(value65?.[0] || '').trim();
  if (required && !enabled10) throw new Error(missingMessage);
  return enabled10;
}
function hasOwnManifestValue(value66, value67) {
  return Object.prototype.hasOwnProperty.call(value66 || {}, value67);
}
function isPresentManifestValue(value68) {
  if (value68 === undefined || value68 === null) return false;
  if (typeof value68 === 'string') return value68.trim() !== '';
  return true;
}
function normalizeManifestFieldList(value69, value70 = '') {
  const value71 = value69?.fields !== undefined ? value69.fields : value69?.field,
    list11 = Array.isArray(value71) ? value71 : [value71 || value70];
  return list11.map((item6) => String(item6 || '').trim()).filter(Boolean);
}
function manifestValuesEqual(value72, value73) {
  if (typeof value73 === 'boolean') {
    const value74 = String(value72 ?? '')
      .trim()
      .toLowerCase();
    return value72 === value73 || value74 === String(value73);
  }
  if (typeof value73 === 'number') return Number(value72) === value73;
  return String(value72 ?? '').trim() === String(value73 ?? '').trim();
}
function evaluateManifestWhenRule(enabled11, value75) {
  if (!enabled11 || typeof enabled11 !== 'object') return true;
  const value76 = enabled11.field ? getManifestPayloadPathValue(value75, enabled11.field) : undefined,
    isPresentManifestValue2 = isPresentManifestValue(value76);
  if (hasOwnManifestValue(enabled11, 'exists') && Boolean(enabled11.exists) !== isPresentManifestValue2)
    return false;
  if (enabled11.truthy === true && !Boolean(value76)) return false;
  if (enabled11.falsy === true && Boolean(value76)) return false;
  if (hasOwnManifestValue(enabled11, 'equals') && !manifestValuesEqual(value76, enabled11.equals))
    return false;
  if (hasOwnManifestValue(enabled11, 'notEquals') && manifestValuesEqual(value76, enabled11.notEquals))
    return false;
  if (Array.isArray(enabled11.in) && !enabled11.in.some((item7) => manifestValuesEqual(value76, item7)))
    return false;
  if (Array.isArray(enabled11.notIn) && enabled11.notIn.some((item8) => manifestValuesEqual(value76, item8)))
    return false;
  return true;
}
function shouldUseManifestNodeMapping(value77, value78) {
  const list12 = value77?.when;
  if (list12 === undefined || list12 === null) return true;
  if (Array.isArray(list12)) return list12.every((item9) => evaluateManifestWhenRule(item9, value78));
  return evaluateManifestWhenRule(list12, value78);
}
function applyManifestNodeValueMap(value79, map) {
  const value80 = map?.valueMap || map?.values || {},
    value81 = String(value79 ?? '').trim();
  if (value81 && value80[value81] !== undefined) return value80[value81];
  const value82 = value81.toLowerCase();
  if (value81 && value80[value82] !== undefined) return value80[value82];
  return value79;
}
function normalizeManifestTransformSpec(name) {
  if (!name) return { name: '' };
  if (typeof name === 'string') return { name: name };
  if (typeof name === 'object' && !Array.isArray(name))
    return { ...name, name: String(name.name || '').trim() };
  return { name: '' };
}
function clampManifestNumber(value83, value84) {
  let value85 = value83;
  return (
    Number.isFinite(Number(value84.min)) && (value85 = Math.max(Number(value84.min), value85)),
    Number.isFinite(Number(value84.max)) && (value85 = Math.min(Number(value84.max), value85)),
    value85
  );
}
function applyManifestNodeTransform(value86, value87) {
  const error = normalizeManifestTransformSpec(value87?.transform);
  switch (error.name) {
    case '':
      return value86;
    case 'trim':
      return String(value86 ?? '').trim();
    case 'string':
      return String(value86 ?? '');
    case 'booleanString': {
      const value88 = String(value86 ?? '')
        .trim()
        .toLowerCase();
      return value86 === true || value88 === 'true' || value88 === '1' ? 'true' : 'false';
    }
    case 'integer': {
      const value89 = Number(value86),
        value90 = Number(error.defaultValue ?? value87?.defaultValue ?? 0),
        value91 = Number.isFinite(value89)
          ? Math.trunc(value89)
          : Number.isFinite(value90)
            ? Math.trunc(value90)
            : 0;
      return clampManifestNumber(value91, error);
    }
    case 'normalizeRhVideoFps':
      return normalizeRhVideoFps(value86);
    case 'normalizeRhVideoResolution':
      return normalizeRhVideoResolution(
        value86,
        Number.isFinite(Number(error.fallback)) ? Number(error.fallback) : RH_MIN_VIDEO_RESOLUTION,
      );
    default:
      throw new Error('Unsupported RunningHub workflow transform: ' + error.name);
  }
}
async function resolveRunningHubManifestVideoInput(value92, value93, missingMessage2) {
  const urlField2 = String(missingMessage2?.urlField || missingMessage2?.field || 'videoUrl').trim(),
    fileField2 = String(missingMessage2?.fileField || 'videoFile').trim(),
    enabled12 = String(value92[urlField2] || '').trim(),
    enabled13 = value92[fileField2];
  if (!missingMessage2?.required && !enabled12 && !enabled13) return '';
  return resolveRunningHubVideoInput(value92, value93, {
    urlField: urlField2,
    fileField: fileField2,
    missingMessage: missingMessage2?.missingMessage || '请接入源视频',
    uploadFailedMessage: missingMessage2?.uploadFailedMessage || '源视频上传失败',
  });
}
async function resolveRunningHubManifestAudioInput(value94, value95, required2) {
  const urlField3 = String(required2?.urlField || required2?.field || 'audioUrl').trim(),
    fileField3 = String(required2?.fileField || 'audioFile').trim(),
    enabled14 = String(value94[urlField3] || '').trim(),
    enabled15 = value94[fileField3];
  if (!required2?.required && !enabled14 && !enabled15) return '';
  return resolveRunningHubAudioInput(value94, value95, {
    urlField: urlField3,
    fileField: fileField3,
    required: required2?.required === true,
    missingMessage: required2?.missingMessage || '请接入音频',
  });
}
async function resolveRunningHubManifestNodeValue({
  item: item10,
  payload: payload5,
  finalPrompt: finalPrompt2,
  apiKey: apiKey4,
  ctx: ctx2,
}) {
  const value96 = String(item10?.source || 'param').trim();
  if (value96 === 'constant')
    return hasOwnManifestValue(item10, 'value') ? item10.value : item10.defaultValue;
  if (value96 === 'prompt') {
    const manifestPayloadValue = resolveManifestPayloadValue(
      payload5,
      normalizeManifestFieldList(item10),
      '',
    );
    return isPresentManifestValue(manifestPayloadValue) ? manifestPayloadValue : finalPrompt2;
  }
  if (value96 === 'param')
    return resolveManifestPayloadValue(payload5, normalizeManifestFieldList(item10), undefined, {
      allowEmpty: item10?.allowEmpty === true,
    });
  if (value96 === 'imageInput')
    return resolveRunningHubFirstImageInput(payload5, apiKey4, ctx2, {
      field: String(item10?.field || 'inputUrls').trim(),
      required: item10?.required === true,
      missingMessage: item10?.missingMessage || '请接入参考图',
      compress: item10?.compress !== false,
    });
  if (value96 === 'videoInput') return resolveRunningHubManifestVideoInput(payload5, apiKey4, item10);
  if (value96 === 'audioInput') return resolveRunningHubManifestAudioInput(payload5, apiKey4, item10);
  throw new Error('Unsupported RunningHub workflow mapping source: ' + value96);
}
async function buildRunningHubNodeInfoListFromManifest({
  mapping: mapping,
  payload: payload6,
  finalPrompt: finalPrompt3,
  apiKey: apiKey5,
  ctx: ctx3,
}) {
  const list13 = Array.isArray(mapping?.nodeInfoList) ? mapping.nodeInfoList : [];
  if (list13.length === 0) return null;
  const value97 = [];
  for (const item11 of list13) {
    if (!item11?.nodeId || !item11?.fieldName) continue;
    if (!shouldUseManifestNodeMapping(item11, payload6)) continue;
    const runningHubManifestNodeValue = await resolveRunningHubManifestNodeValue({
        item: item11,
        payload: payload6,
        finalPrompt: finalPrompt3,
        apiKey: apiKey5,
        ctx: ctx3,
      }),
      value98 = item11?.allowEmpty === true,
      enabled16 = item11?.includeEmpty === true || value98,
      hasOwnManifestValue2 = hasOwnManifestValue(item11, 'defaultValue');
    let manifestNodeValueMap = runningHubManifestNodeValue;
    !isPresentManifestValue(manifestNodeValueMap) &&
      hasOwnManifestValue2 &&
      !(value98 && manifestNodeValueMap !== undefined && manifestNodeValueMap !== null) &&
      (manifestNodeValueMap = item11.defaultValue);
    if (!isPresentManifestValue(manifestNodeValueMap)) {
      if (enabled16) manifestNodeValueMap = '';
      else {
        if (item11.required)
          throw new Error(item11.missingMessage || '缺少 RunningHub 节点入参：' + item11.fieldName);
        continue;
      }
    }
    ((manifestNodeValueMap = applyManifestNodeValueMap(manifestNodeValueMap, item11)),
      (manifestNodeValueMap = applyManifestNodeTransform(manifestNodeValueMap, item11)));
    if (!isPresentManifestValue(manifestNodeValueMap) && item11.required && !enabled16)
      throw new Error(item11.missingMessage || '缺少 RunningHub 节点入参：' + item11.fieldName);
    if (!isPresentManifestValue(manifestNodeValueMap) && !enabled16) continue;
    pushManifestNode(value97, item11, manifestNodeValueMap);
  }
  return value97;
}
function getRunningHubWorkflowResolverHelpers() {
  return {
    buildOpenApiVideoWorkflowRequest: buildOpenApiVideoWorkflowRequest,
    buildTaskCreateVideoWorkflowRequest: buildTaskCreateVideoWorkflowRequest,
    getMappedValue: getMappedValue,
    normalizeRhVideoFps: normalizeRhVideoFps,
    normalizeRhVideoResolution: normalizeRhVideoResolution,
    normalizeVideoMattingMaskModeIndex: normalizeVideoMattingMaskModeIndex,
    pushManifestNode: pushManifestNode,
    resolveRunningHubFirstImageInput: resolveRunningHubFirstImageInput,
    resolveRunningHubOptionalVideoInput: resolveRunningHubOptionalVideoInput,
    resolveRunningHubVideoInput: resolveRunningHubVideoInput,
    sourceVideoMissingMessage: RH_V54_SOURCE_VIDEO_MISSING_MESSAGE,
    sourceVideoUploadFailedMessage: RH_V54_SOURCE_VIDEO_UPLOAD_FAILED_MESSAGE,
  };
}
async function buildVideoWorkflowRequestFromManifest({
  executionManifest: executionManifest4,
  payload: payload7,
  finalPrompt: finalPrompt4,
  apiKey: apiKey6,
  ctx: ctx4,
}) {
  if (!executionManifest4 || executionManifest4.adapterType !== 'workflow') return null;
  const mapping2 = executionManifest4.mapping || {},
    value99 = String(executionManifest4.extensions?.payloadResolver || '').trim();
  if (value99) {
    const run = getRunningHubWorkflowPayloadResolver(value99);
    if (!run) throw new Error('Unsupported RunningHub workflow payloadResolver: ' + value99);
    return run({
      executionManifest: executionManifest4,
      payload: payload7,
      finalPrompt: finalPrompt4,
      apiKey: apiKey6,
      ctx: ctx4,
      helpers: getRunningHubWorkflowResolverHelpers(),
    });
  }
  const nodeInfoList4 = await buildRunningHubNodeInfoListFromManifest({
    mapping: mapping2,
    payload: payload7,
    finalPrompt: finalPrompt4,
    apiKey: apiKey6,
    ctx: ctx4,
  });
  if (!nodeInfoList4) return null;
  if (executionManifest4.submitMode === 'openapi-v2-ai-app')
    return buildOpenApiVideoWorkflowRequest({
      executionManifest: executionManifest4,
      payload: payload7,
      apiKey: apiKey6,
      nodeInfoList: nodeInfoList4,
    });
  if (executionManifest4.submitMode === 'runninghub-task-create')
    return buildTaskCreateVideoWorkflowRequest({
      executionManifest: executionManifest4,
      payload: payload7,
      apiKey: apiKey6,
      nodeInfoList: nodeInfoList4,
    });
  throw new Error('Unsupported RunningHub video workflow submitMode: ' + executionManifest4.submitMode);
}
export async function buildImageRequest(payload8, finalPrompt5, ctx5) {
  if (!payload8.model) throw new Error('未指定模型，无法发起图像生成请求');
  const value100 = ctx5.getProviderConfig('runninghubwf'),
    apiKey7 = value100.apiKey || payload8.apiKey;
  if (!apiKey7) throw new Error('API Key 未配置，无法发起 RunningHUB 请求');
  const run2 = ctx5.processInputImagesPreserveOrder || ctx5.processInputImages,
    list14 = await run2(payload8.inputUrls, apiKey7, {
      applyInputQualityProfile: true,
      provider: 'runninghub',
    }),
    finalUrls2 = Array.isArray(list14) ? list14.map((item12) => String(item12 || '').trim()) : [],
    executionManifest5 = resolveModelExecution(payload8.model),
    openApiAiAppWorkflowRequestFromManifest = await buildOpenApiAiAppWorkflowRequestFromManifest({
      executionManifest: executionManifest5?.executionManifest,
      payload: payload8,
      finalPrompt: finalPrompt5,
      finalUrls: finalUrls2,
      apiKey: apiKey7,
      ctx: ctx5,
    });
  if (openApiAiAppWorkflowRequestFromManifest) return openApiAiAppWorkflowRequestFromManifest;
  throw new Error('RunningHub workflow manifest missing: ' + payload8.model);
}
export async function buildVideoRequest(payload9, finalPrompt6, ctx6) {
  const value101 = ctx6.getProviderConfig('runninghubwf'),
    apiKey8 = payload9.apiKey || value101.apiKey;
  if (!apiKey8) throw new Error('API Key 未配置，无法发起 RunningHUB 视频生成请求');
  const executionManifest6 = resolveModelExecution(payload9.model),
    videoWorkflowRequestFromManifest = await buildVideoWorkflowRequestFromManifest({
      executionManifest: executionManifest6?.executionManifest,
      payload: payload9,
      finalPrompt: finalPrompt6,
      apiKey: apiKey8,
      ctx: ctx6,
    });
  if (videoWorkflowRequestFromManifest) return videoWorkflowRequestFromManifest;
  throw new Error('RunningHub video workflow manifest missing: ' + payload9.model);
}
export async function buildModelRequest(value102, value103, value104) {
  const imageRequestFromManifest = await buildImageRequestFromManifest(value102, value103, value104, {
    expectedProvider: 'runninghub',
  });
  if (imageRequestFromManifest) return imageRequestFromManifest;
  throw new Error('RunningHub model API manifest missing: ' + value102.model);
}
const CUSTOM_AI_APP_MEDIA_NODE_SOURCES = new Set(['imageInput', 'videoInput', 'audioInput']);

function getRunningHubWorkflowProfileId(options2 = {}) {
  const runningHubProviderProfileId = getRunningHubProviderProfileId(options2);
  return runningHubProviderProfileId ? normalizeRunningHubModelApiProfileId(runningHubProviderProfileId) : '';
}

function getRunningHubWorkflowBaseUrl(options3 = {}) {
  const value105 = String(options3?.['runningHubApiUrl'] || '')['trim']();
  if (value105) return value105['replace'](/\/+$/, '');
  return resolveRunningHubModelApiBaseUrl(getRunningHubWorkflowProfileId(options3));
}

export function resolveRunningHubWorkflowResourceId(value106, value107 = {}) {
  const runningHubWorkflowProfileId = getRunningHubWorkflowProfileId(value107) || 'runninghub',
    value108 = value106?.['extensions']?.['providerProfileBindings']?.[runningHubWorkflowProfileId],
    value109 = value106?.['submitMode'] === 'runninghub-task-create',
    value110 = value109
      ? value108?.['workflowId'] || value108?.['appId']
      : value108?.['appId'] || value108?.['workflowId'],
    value111 = value109
      ? value106?.['workflowId'] || value106?.['appId']
      : value106?.['appId'] || value106?.['workflowId'];
  return String(value110 || value111 || '')['trim']();
}

function isImportedRunningHubAiAppManifest(value112) {
  return (
    Boolean(value112?.['extensions']?.['rhAiApp']) &&
    value112['extensions']['rhAiApp']['sourceType'] !== 'runninghub-workflow'
  );
}

function relaxCustomAiAppMediaNodeMappings(args = null, { enabled: enabled = ![] } = {}) {
  if (!enabled || !args || typeof args !== 'object' || Array['isArray'](args)) return args;
  const nodeInfoList5 = Array['isArray'](args['nodeInfoList'])
    ? args['nodeInfoList']['map']((args2) =>
        CUSTOM_AI_APP_MEDIA_NODE_SOURCES['has'](String(args2?.['source'] || '')['trim']())
          ? { ...args2, required: ![] }
          : args2,
      )
    : args['nodeInfoList'];
  return { ...args, nodeInfoList: nodeInfoList5 };
}

function getImageWorkflowLongSideMap(options4 = {}) {
  const value113 =
    options4?.['longSideByImageSize'] && typeof options4['longSideByImageSize'] === 'object'
      ? options4['longSideByImageSize']
      : null;
  return value113 || Object['freeze']({ '1K': 0x400, '1.5K': 0x600, '2K': 0x780 });
}

function resolveImageWorkflowQualityKey(value114, value115 = {}) {
  const imageWorkflowLongSideMap = getImageWorkflowLongSideMap(value115),
    value116 = String(value115?.['defaultImageSize'] || '2K')
      ['trim']()
      ['toUpperCase'](),
    value117 = String(value114 || value116)
      ['trim']()
      ['toUpperCase'](),
    list15 = Object['keys'](imageWorkflowLongSideMap);
  return (
    list15['find']((value118) => String(value118)['trim']()['toUpperCase']() === value117) ||
    list15['find']((value119) => String(value119)['trim']()['toUpperCase']() === value116) ||
    list15[0x0] ||
    '2K'
  );
}

function resolveImageWorkflowDimensions(value120, value121, value122 = {}) {
  const imageWorkflowQualityKey = resolveImageWorkflowQualityKey(value120, value122),
    value123 = Number(getImageWorkflowLongSideMap(value122)[imageWorkflowQualityKey]) || 0x780,
    value124 = String(value122?.['defaultAspectRatio'] || RUNNINGHUB_WORKFLOW_DEFAULT_RATIO)['trim'](),
    runningHubWorkflowRatio2 = normalizeRunningHubWorkflowRatio(value121, value124),
    [value125, value126] = runningHubWorkflowRatio2['split'](':'),
    value127 = Number['parseFloat'](value125) || 0x1,
    value128 = Number['parseFloat'](value126) || 0x1,
    value129 = value127 >= value128,
    value130 = value129 ? value123 : (value123 * value127) / value128,
    value131 = value129 ? (value123 * value128) / value127 : value123,
    value132 = Math['max'](0x1, Number(value122?.['align']) || 0x40),
    value133 = Math['max'](0x1, Number(value122?.['minDimension']) || 0x200),
    width2 = (value134) =>
      Math['max'](value133, Math['round'](Number(value134 || 0x0) / value132) * value132);
  return { width: width2(value130), height: width2(value131) };
}

function resolveManifestDimensionsValue(value135, value136, value137, value138) {
  const value139 = [
    ...(Array['isArray'](value136?.[value137 + 'Fields']) ? value136[value137 + 'Fields'] : []),
    value136?.[value137 + 'Field'],
    value137 === 'imageSize' ? 'imageSize' : 'resolvedRatioLabel',
    value137 === 'imageSize' ? 'generationParams.imageSize' : 'aspectRatio',
    value137 === 'aspectRatio' ? 'generationParams.aspectRatio' : '',
  ]['filter'](Boolean);
  return resolveManifestPayloadValue(value135, value139, value138);
}

function normalizeManifestDimensionNode(description7, value140, description8) {
  if (description7 && typeof description7 === 'object' && !Array['isArray'](description7))
    return {
      nodeId: String(description7['nodeId'] || '')['trim'](),
      fieldName: String(description7['fieldName'] || description8)['trim']() || description8,
      description: description7['description'] || description8,
    };
  return {
    nodeId: String(value140?.['nodeId'] || '')['trim'](),
    fieldName: String(
      description8 === 'width'
        ? value140?.['widthFieldName'] || 'width'
        : value140?.['heightFieldName'] || 'height',
    )['trim'](),
    description: description8,
  };
}

function pushManifestDimensionsNodes(list16, value141, box2) {
  const manifestDimensionNode = normalizeManifestDimensionNode(value141?.['widthNode'], value141, 'width'),
    manifestDimensionNode2 = normalizeManifestDimensionNode(value141?.['heightNode'], value141, 'height');
  [
    [manifestDimensionNode, box2['width']],
    [manifestDimensionNode2, box2['height']],
  ]['forEach'](([nodeId2, value142]) => {
    if (!nodeId2['nodeId'] || !nodeId2['fieldName']) return;
    list16['push']({
      nodeId: nodeId2['nodeId'],
      fieldName: nodeId2['fieldName'],
      fieldValue: String(value142),
      description: nodeId2['description'],
    });
  });
}

function buildRunningHubImageResultExtractor() {
  return (response5) => {
    if (response5['status'] === 'COMPLETED' && Array['isArray'](response5['results']))
      return response5['results']
        ['map']((response6) => response6['url'] || response6['imageUrl'])
        ['filter'](Boolean);
    return [];
  };
}

function buildOpenApiImageWorkflowRequest({
  executionManifest: executionManifest7,
  payload: payload10,
  apiKey: apiKey9,
  nodeInfoList: nodeInfoList6,
}) {
  const instanceType4 = normalizeRunningHubInstanceType(
      payload10[executionManifest7['instanceType']?.['field']],
    ),
    runningHubWorkflowResourceId = resolveRunningHubWorkflowResourceId(executionManifest7, payload10);
  return {
    url: '/api/v2/proxy/image',
    headers: { 'Content-Type': 'application/json' },
    body: {
      apiUrl:
        getRunningHubWorkflowBaseUrl(payload10) + '/openapi/v2/run/ai-app/' + runningHubWorkflowResourceId,
      apiKey: apiKey9,
      nodeInfoList: nodeInfoList6,
      instanceType: instanceType4,
      usePersonalQueue: 'false',
    },
    isAsync: !![],
    taskIdPath: executionManifest7['result']?.['taskIdPath'] || 'taskId',
    adapterTrace: { source: 'manifest', executionId: executionManifest7['id'], modelId: payload10['model'] },
    pollUrlBuilder: () => getRunningHubWorkflowBaseUrl(payload10) + '/openapi/v2/query',
    resultExtractor: buildRunningHubImageResultExtractor(),
  };
}

async function uploadRunningHubMediaInputs(
  kind,
  value143,
  value144,
  apiKey10,
  value145,
  { uploadFailedMessage: uploadFailedMessage = 'RunningHUB\x20素材上传失败' } = {},
) {
  try {
    return await uploadModelApiMediaInputs(kind, value143, value145, {
      apiKey: apiKey10,
      apiUrl: getRunningHubWorkflowBaseUrl(value144),
      fallbackProvider: 'runninghub',
      strictUpload: !![],
    });
  } catch (value146) {
    throw createMediaUploadError(value146, { kind: kind, label: uploadFailedMessage });
  }
}
