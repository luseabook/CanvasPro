const RUNNINGHUB_WORKFLOW_PAYLOAD_RESOLVERS = Object.freeze({
  runninghubVideoV54: resolveRunningHubVideoV54Payload,
  runninghubBerniniVideoReplaceV1: resolveRunningHubBerniniVideoReplaceV1Payload,
  runninghubVideoMatting: resolveRunningHubVideoMattingPayload,
});
export function getRunningHubWorkflowPayloadResolver(value) {
  const item = String(value || '').trim();
  return RUNNINGHUB_WORKFLOW_PAYLOAD_RESOLVERS[item] || null;
}
async function resolveRunningHubVideoV54Payload({
  executionManifest: executionManifest,
  payload: payload,
  finalPrompt: finalPrompt,
  apiKey: apiKey,
  ctx: ctx,
  helpers: helpers,
}) {
  const fieldName = executionManifest.mapping || {},
    nodeInfoList = [],
    {
      buildOpenApiVideoWorkflowRequest: buildOpenApiVideoWorkflowRequest,
      getMappedValue: getMappedValue,
      normalizeRhVideoResolution: normalizeRhVideoResolution,
      pushManifestNode: pushManifestNode,
      resolveRunningHubFirstImageInput: resolveRunningHubFirstImageInput,
      resolveRunningHubOptionalVideoInput: resolveRunningHubOptionalVideoInput,
      resolveRunningHubVideoInput: resolveRunningHubVideoInput,
      sourceVideoMissingMessage: sourceVideoMissingMessage,
      sourceVideoUploadFailedMessage: sourceVideoUploadFailedMessage,
    } = helpers,
    key = String(finalPrompt || '').trim() || '4K，高质量';
  (pushManifestNode(nodeInfoList, fieldName.promptNode, key),
    pushManifestNode(
      nodeInfoList,
      fieldName.characterIntegrationNode,
      payload.characterIntegration === true ? 'true' : 'false',
    ));
  const index = String(payload.controlMode || '').trim(),
    result = getMappedValue(index, fieldName.controlModeNode, '0');
  (pushManifestNode(nodeInfoList, fieldName.controlModeNode, result),
    pushManifestNode(
      nodeInfoList,
      fieldName.resolutionNode,
      normalizeRhVideoResolution(payload.rhVideoResolution),
    ));
  const data = Number(payload.frameRate ?? payload.rhVideoFps),
    options = Number.isFinite(data) ? Math.trunc(data) : 24;
  pushManifestNode(nodeInfoList, fieldName.fpsNode, options);
  const target = Number(payload.frameCount ?? payload.rhVideoFrames),
    source = Number.isFinite(target) ? Math.max(0, Math.trunc(target)) : 77;
  pushManifestNode(nodeInfoList, fieldName.sourceVideoNode, source, {
    fieldName: fieldName.sourceVideoNode?.frameCountFieldName,
  });
  const next = await resolveRunningHubVideoInput(payload, apiKey, {
    missingMessage: sourceVideoMissingMessage,
    uploadFailedMessage: sourceVideoUploadFailedMessage,
  });
  pushManifestNode(nodeInfoList, fieldName.sourceVideoNode, next);
  const current = await resolveRunningHubFirstImageInput(payload, apiKey, ctx);
  current && pushManifestNode(nodeInfoList, fieldName.refImageNode, current);
  const entry = await resolveRunningHubOptionalVideoInput(payload, apiKey, 'maskVideoUrl');
  entry && pushManifestNode(nodeInfoList, fieldName.maskVideoNode, entry);
  const record = await resolveRunningHubFirstImageInput(payload, apiKey, ctx, { field: 'firstFrameUrl' });
  record &&
    (pushManifestNode(nodeInfoList, fieldName.firstFrameNode, record),
    pushManifestNode(
      nodeInfoList,
      fieldName.firstFrameEnabledNode,
      fieldName.firstFrameEnabledNode?.value ?? '1',
    ));
  const handle = String(payload.specialMode || payload.rhSpecialMode || ''),
    enabled = handle === 'cameraMove',
    state = !enabled && payload.subtractSubject === true;
  state &&
    pushManifestNode(
      nodeInfoList,
      fieldName.subtractSubjectNode,
      fieldName.subtractSubjectNode?.value ?? 'true',
    );
  const config = !enabled && (entry || state);
  if (config) {
    const scope = Number(payload.maskExpansion),
      input = Number.isFinite(scope) ? scope : (fieldName.maskExpansionNode?.defaultValue ?? 25);
    (pushManifestNode(nodeInfoList, fieldName.maskExpansionNode, input),
      pushManifestNode(
        nodeInfoList,
        fieldName.maskRectNode,
        payload.maskRect === true
          ? (fieldName.maskRectNode?.trueValue ?? '1')
          : (fieldName.maskRectNode?.falseValue ?? '0'),
      ),
      pushManifestNode(
        nodeInfoList,
        fieldName.maskParamsEnabledNode,
        fieldName.maskParamsEnabledNode?.value ?? '1',
      ));
  }
  (handle === 'longVideoOverlay' || handle === 'cameraMove') &&
    pushManifestNode(
      nodeInfoList,
      fieldName.specialModeNode,
      getMappedValue(handle, fieldName.specialModeNode, ''),
    );
  handle === 'longVideoOverlay' &&
    pushManifestNode(
      nodeInfoList,
      fieldName.longVideoOverlayNode,
      fieldName.longVideoOverlayNode?.value ?? '1',
    );
  const output = Number(payload.breastJiggle ?? payload.rhBreastJiggle ?? 0),
    count = Number.isFinite(output) ? Math.max(0, Math.min(1, Math.round(output * 20) / 20)) : 0;
  return (
    count > 0 &&
      (pushManifestNode(nodeInfoList, fieldName.breastJiggleNode, Number(count.toFixed(2))),
      pushManifestNode(
        nodeInfoList,
        fieldName.breastJiggleEnabledNode,
        fieldName.breastJiggleEnabledNode?.value ?? 'true',
      )),
    buildOpenApiVideoWorkflowRequest({
      executionManifest: executionManifest,
      payload: payload,
      apiKey: apiKey,
      nodeInfoList: nodeInfoList,
    })
  );
}
function normalizeBerniniInputMode(value2) {
  const value3 = String(value2 || '').trim();
  return ['none', 'image', 'video', 'videoImage', 'videoVideo'].includes(value3) ? value3 : 'none';
}
function resolveBerniniFunctionForMode(value4, value5 = '') {
  const value6 = {
      none: ['t2v'],
      image: ['i2v', 'r2v'],
      video: ['v2v', 'mv2v'],
      videoImage: ['vi2v', 'rv2v', 'vrc2v'],
      videoVideo: ['ads2v'],
    },
    berniniInputMode = normalizeBerniniInputMode(value4),
    list = value6[berniniInputMode] || value6.none,
    value7 = String(value5 || '').trim();
  return list.includes(value7) ? value7 : list[0];
}
function resolveBerniniModeValue(value8, value9 = '') {
  const value10 = {
    t2v: '0',
    i2v: '1',
    v2v: '2',
    r2v: '3',
    vi2v: '4',
    rv2v: '5',
    ads2v: '6',
    vrc2v: '7',
    mv2v: '8',
  };
  return value10[resolveBerniniFunctionForMode(value8, value9)] || '0';
}
function normalizeBerniniResolutionBase(value11) {
  const value12 = Number(value11);
  return [0x340, 0x400, 0x500, 0x5a0].includes(value12) ? value12 : 0x340;
}
function parseBerniniAspectRatio(value13) {
  const value14 = String(value13 || '16:9').trim(),
    value15 = value14.toLowerCase();
  if (value14 === '自适应' || value15 === 'auto' || value15 === 'adaptive')
    return { widthRatio: 16, heightRatio: 9 };
  const [value16, value17] = value14.split(':'),
    widthRatio = Number(value16),
    heightRatio = Number(value17);
  if (widthRatio > 0 && heightRatio > 0) return { widthRatio: widthRatio, heightRatio: heightRatio };
  return { widthRatio: 16, heightRatio: 9 };
}
function resolveBerniniAspectRatioValue(options2 = {}) {
  const value18 =
      options2.rhBerniniAspectRatio ??
      options2.generationParams?.rhBerniniAspectRatio ??
      options2.resolvedRatioLabel ??
      options2.aspectRatio,
    value19 = String(value18 || '').trim(),
    value20 = value19.toLowerCase();
  if (value19 === '自适应' || value20 === 'auto' || value20 === 'adaptive')
    return options2.resolvedRatioLabel || options2.aspectRatio || '16:9';
  return value18;
}
function roundBerniniDimensionToEight(value21) {
  return Math.max(8, Math.round(Number(value21 || 0) / 8) * 8);
}
function resolveBerniniDimensions({ resolutionBase: resolutionBase, aspectRatio: aspectRatio } = {}) {
  const width = normalizeBerniniResolutionBase(resolutionBase),
    { widthRatio: widthRatio2, heightRatio: heightRatio2 } = parseBerniniAspectRatio(aspectRatio);
  if (widthRatio2 >= heightRatio2)
    return { width: width, height: roundBerniniDimensionToEight((width * heightRatio2) / widthRatio2) };
  return { width: roundBerniniDimensionToEight((width * widthRatio2) / heightRatio2), height: width };
}
async function resolveRunningHubBerniniVideoReplaceV1Payload({
  executionManifest: executionManifest2,
  payload: payload2,
  finalPrompt: finalPrompt2,
  apiKey: apiKey2,
  ctx: ctx2,
  helpers: helpers2,
}) {
  const value22 = executionManifest2.mapping || {},
    nodeInfoList2 = [],
    {
      buildOpenApiVideoWorkflowRequest: buildOpenApiVideoWorkflowRequest2,
      pushManifestNode: pushManifestNode2,
      resolveRunningHubFirstImageInput: resolveRunningHubFirstImageInput2,
      resolveRunningHubOptionalVideoInput: resolveRunningHubOptionalVideoInput2,
      resolveRunningHubVideoInput: resolveRunningHubVideoInput2,
    } = helpers2;
  let enabled2 = '';
  (String(payload2.videoUrl || '').trim() || payload2.videoFile) &&
    (enabled2 = await resolveRunningHubVideoInput2(payload2, apiKey2, {
      missingMessage: '请接入源视频',
      uploadFailedMessage: '源视频上传失败',
    }));
  const value23 = await resolveRunningHubFirstImageInput2(payload2, apiKey2, ctx2, {
      required: false,
      missingMessage: '请接入参考图像',
    }),
    value24 = await resolveRunningHubOptionalVideoInput2(payload2, apiKey2, 'referenceVideoUrl'),
    value25 = enabled2
      ? value24
        ? 'videoVideo'
        : value23
          ? 'videoImage'
          : 'video'
      : value23
        ? 'image'
        : 'none';
  if (value24 && !enabled2) throw new Error('参考视频需要同时接入源视频');
  const berniniModeValue = resolveBerniniModeValue(
      value25,
      payload2.rhBerniniFunction ?? payload2.generationParams?.rhBerniniFunction,
    ),
    box = resolveBerniniDimensions({
      resolutionBase:
        payload2.rhVideoResolution ??
        payload2.generationParams?.rhVideoResolution ??
        payload2.rhBerniniResolutionBase ??
        payload2.generationParams?.rhBerniniResolutionBase,
      aspectRatio: resolveBerniniAspectRatioValue(payload2),
    });
  enabled2 && pushManifestNode2(nodeInfoList2, value22.sourceVideoNode, enabled2);
  value23 && value25 !== 'videoVideo' && pushManifestNode2(nodeInfoList2, value22.refImageNode, value23);
  pushManifestNode2(nodeInfoList2, value22.modeNode, berniniModeValue);
  const value26 = Number(payload2.rhVideoFps ?? value22.fpsNode?.value),
    value27 = Number.isFinite(value26) ? Math.trunc(value26) : 24;
  pushManifestNode2(nodeInfoList2, value22.fpsNode, String(value27));
  const value28 = Number(payload2.rhVideoFrames ?? value22.framesNode?.value),
    value29 = Number.isFinite(value28) ? Math.max(0, Math.trunc(value28)) : 121;
  return (
    pushManifestNode2(nodeInfoList2, value22.framesNode, String(value29)),
    pushManifestNode2(nodeInfoList2, value22.widthNode, box.width),
    pushManifestNode2(nodeInfoList2, value22.heightNode, box.height),
    pushManifestNode2(nodeInfoList2, value22.promptNode, finalPrompt2 || ''),
    value25 === 'videoVideo' && pushManifestNode2(nodeInfoList2, value22.referenceVideoNode, value24),
    buildOpenApiVideoWorkflowRequest2({
      executionManifest: executionManifest2,
      payload: payload2,
      apiKey: apiKey2,
      nodeInfoList: nodeInfoList2,
    })
  );
}
async function resolveRunningHubVideoMattingPayload({
  executionManifest: executionManifest3,
  payload: payload3,
  apiKey: apiKey3,
  ctx: ctx3,
  helpers: helpers3,
}) {
  const appId = executionManifest3.mapping || {},
    nodeInfoList3 = [],
    {
      buildTaskCreateVideoWorkflowRequest: buildTaskCreateVideoWorkflowRequest,
      normalizeRhVideoFps: normalizeRhVideoFps,
      normalizeRhVideoResolution: normalizeRhVideoResolution2,
      normalizeVideoMattingMaskModeIndex: normalizeVideoMattingMaskModeIndex,
      pushManifestNode: pushManifestNode3,
    } = helpers3,
    value30 = String(payload3.maskImageDataUrl || '').trim(),
    enabled3 = String(payload3.videoUrl || '').trim();
  if (!enabled3) throw new Error('请接入源视频');
  const run = ctx3.processInputVideos;
  if (typeof run !== 'function') throw new Error('缺少 RunningHUB 视频上传能力');
  const value31 = await run([enabled3], apiKey3),
    enabled4 = String(value31?.[0] || '').trim();
  if (!enabled4) throw new Error('源视频上传失败');
  if (value30) {
    const run2 = ctx3.processInputImages;
    if (typeof run2 !== 'function') throw new Error('缺少 RunningHUB 图片上传能力');
    const value32 = await run2([value30], apiKey3, { compress: false, provider: 'runninghub' }),
      enabled5 = String(value32?.[0] || '').trim();
    if (!enabled5) throw new Error('擦除遮罩上传失败');
    const value33 = Number(payload3.sourceFrameCount ?? payload3.frameCount),
      value34 = Number.isFinite(value33) ? Math.max(1, Math.trunc(value33)) : 1;
    (pushManifestNode3(nodeInfoList3, appId.maskVideoNode, enabled4),
      pushManifestNode3(nodeInfoList3, appId.maskFrameCapNode, String(value34)),
      pushManifestNode3(
        nodeInfoList3,
        appId.maskFpsNode,
        String(normalizeRhVideoFps(payload3.rhVideoFps ?? payload3.frameRate)),
      ),
      pushManifestNode3(
        nodeInfoList3,
        appId.maskResolutionNode,
        String(normalizeRhVideoResolution2(payload3.rhVideoResolution, 0x400)),
      ),
      pushManifestNode3(nodeInfoList3, appId.maskImageNode, enabled5));
    const instanceType = payload3.rhInstanceType === 'plus' ? 'plus' : 'default';
    return {
      url: '/api/v2/video/matting/run',
      headers: { 'Content-Type': 'application/json' },
      body: {
        apiKey: apiKey3,
        appId: appId.maskAppId,
        nodeInfoList: nodeInfoList3,
        instanceType: instanceType,
        usePersonalQueue: 'false',
      },
      adapterTrace: { source: 'manifest', executionId: executionManifest3.id, modelId: payload3.model },
      isAsync: true,
      taskIdPath: 'taskId',
      useOpenapiQuery: true,
      pollUrlBuilder: () => 'https://www.runninghub.cn/openapi/v2/query',
      resultExtractor: (response) =>
        response.status === 'COMPLETED' && Array.isArray(response.results)
          ? response.results.map((response2) => response2.videoUrl || response2.url).filter(Boolean)
          : [],
    };
  }
  pushManifestNode3(nodeInfoList3, appId.noMaskVideoNode, enabled4);
  const value35 = payload3.frameRate || payload3.rhVideoFps;
  if (value35) pushManifestNode3(nodeInfoList3, appId.noMaskFpsNode, String(value35));
  payload3.rhVideoResolution !== undefined &&
    payload3.rhVideoResolution !== null &&
    pushManifestNode3(
      nodeInfoList3,
      appId.noMaskResolutionNode,
      String(normalizeRhVideoResolution2(payload3.rhVideoResolution)),
    );
  const value36 = payload3.pos_points ?? payload3.positive ?? '',
    value37 = payload3.neg_points ?? payload3.negative ?? '';
  (pushManifestNode3(
    nodeInfoList3,
    appId.positiveNode,
    Array.isArray(value36) ? JSON.stringify(value36) : String(value36 || ''),
  ),
    pushManifestNode3(
      nodeInfoList3,
      appId.negativeNode,
      Array.isArray(value37) ? JSON.stringify(value37) : String(value37 || ''),
    ));
  const value38 = payload3.frameRate || payload3.rhVideoFps || payload3.fps,
    value39 =
      Number.isFinite(payload3.timeSec) && Number.isFinite(Number(value38))
        ? Math.max(0, Math.round(Number(payload3.timeSec) * Number(value38)))
        : payload3.frame_index !== undefined && payload3.frame_index !== null
          ? payload3.frame_index
          : 0;
  return (
    pushManifestNode3(nodeInfoList3, appId.frameIndexNode, String(value39)),
    pushManifestNode3(
      nodeInfoList3,
      appId.maskModeNode,
      normalizeVideoMattingMaskModeIndex(payload3.rhMaskMode),
    ),
    buildTaskCreateVideoWorkflowRequest({
      executionManifest: executionManifest3,
      payload: payload3,
      apiKey: apiKey3,
      nodeInfoList: nodeInfoList3,
    })
  );
}
