const RUNNINGHUB_WORKFLOW_PAYLOAD_RESOLVERS = Object.freeze({
  runninghubVideoV54: resolveRunningHubVideoV54Payload,
  runninghubBerniniVideoReplaceV1: resolveRunningHubBerniniVideoReplaceV1Payload,
  runninghubVideoMatting: resolveRunningHubVideoMattingPayload,
});
export function getRunningHubWorkflowPayloadResolver(_0x26f451) {
  const _0x4cba9d = String(_0x26f451 || '').trim();
  return RUNNINGHUB_WORKFLOW_PAYLOAD_RESOLVERS[_0x4cba9d] || null;
}
async function resolveRunningHubVideoV54Payload({
  executionManifest: _0x4083c7,
  payload: _0x322620,
  finalPrompt: _0x5acbbb,
  apiKey: _0x97a0da,
  ctx: _0x3754ab,
  helpers: _0x5c783b,
}) {
  const _0x5bcabc = _0x4083c7.mapping || {},
    _0x34c309 = [],
    {
      buildOpenApiVideoWorkflowRequest: _0x263ff2,
      getMappedValue: _0x1a7011,
      normalizeRhVideoResolution: _0x238116,
      pushManifestNode: _0x310acc,
      resolveRunningHubFirstImageInput: _0x2bff84,
      resolveRunningHubOptionalVideoInput: _0x1b3d54,
      resolveRunningHubVideoInput: _0x119e2d,
      sourceVideoMissingMessage: _0x2abd06,
      sourceVideoUploadFailedMessage: _0x182a6b,
    } = _0x5c783b,
    _0x1bf5e6 = String(_0x5acbbb || '').trim() || '4K，高质量';
  (_0x310acc(_0x34c309, _0x5bcabc.promptNode, _0x1bf5e6),
    _0x310acc(
      _0x34c309,
      _0x5bcabc.characterIntegrationNode,
      _0x322620.characterIntegration === true ? 'true' : 'false',
    ));
  const _0x1b79ae = String(_0x322620.controlMode || '').trim(),
    _0x4438e7 = _0x1a7011(_0x1b79ae, _0x5bcabc.controlModeNode, '0');
  (_0x310acc(_0x34c309, _0x5bcabc.controlModeNode, _0x4438e7),
    _0x310acc(_0x34c309, _0x5bcabc.resolutionNode, _0x238116(_0x322620.rhVideoResolution)));
  const _0x32293d = Number(_0x322620.frameRate ?? _0x322620.rhVideoFps),
    _0x467782 = Number.isFinite(_0x32293d) ? Math.trunc(_0x32293d) : 24;
  _0x310acc(_0x34c309, _0x5bcabc.fpsNode, _0x467782);
  const _0x34c904 = Number(_0x322620.frameCount ?? _0x322620.rhVideoFrames),
    _0x207de2 = Number.isFinite(_0x34c904) ? Math.max(0, Math.trunc(_0x34c904)) : 77;
  _0x310acc(_0x34c309, _0x5bcabc.sourceVideoNode, _0x207de2, {
    fieldName: _0x5bcabc.sourceVideoNode?.frameCountFieldName,
  });
  const _0x1c39ab = await _0x119e2d(_0x322620, _0x97a0da, {
    missingMessage: _0x2abd06,
    uploadFailedMessage: _0x182a6b,
  });
  _0x310acc(_0x34c309, _0x5bcabc.sourceVideoNode, _0x1c39ab);
  const _0x1d1a0b = await _0x2bff84(_0x322620, _0x97a0da, _0x3754ab);
  _0x1d1a0b && _0x310acc(_0x34c309, _0x5bcabc.refImageNode, _0x1d1a0b);
  const _0x306ede = await _0x1b3d54(_0x322620, _0x97a0da, 'maskVideoUrl');
  _0x306ede && _0x310acc(_0x34c309, _0x5bcabc.maskVideoNode, _0x306ede);
  const _0x4724c2 = await _0x2bff84(_0x322620, _0x97a0da, _0x3754ab, { field: 'firstFrameUrl' });
  _0x4724c2 &&
    (_0x310acc(_0x34c309, _0x5bcabc.firstFrameNode, _0x4724c2),
    _0x310acc(_0x34c309, _0x5bcabc.firstFrameEnabledNode, _0x5bcabc.firstFrameEnabledNode?.value ?? '1'));
  const _0x19eb29 = String(_0x322620.specialMode || _0x322620.rhSpecialMode || ''),
    _0x5e1747 = _0x19eb29 === 'cameraMove',
    _0x3f4f76 = !_0x5e1747 && _0x322620.subtractSubject === true;
  _0x3f4f76 &&
    _0x310acc(_0x34c309, _0x5bcabc.subtractSubjectNode, _0x5bcabc.subtractSubjectNode?.value ?? 'true');
  const _0x3cef95 = !_0x5e1747 && (_0x306ede || _0x3f4f76);
  if (_0x3cef95) {
    const _0x43f8ff = Number(_0x322620.maskExpansion),
      _0x3d0f05 = Number.isFinite(_0x43f8ff) ? _0x43f8ff : (_0x5bcabc.maskExpansionNode?.defaultValue ?? 25);
    (_0x310acc(_0x34c309, _0x5bcabc.maskExpansionNode, _0x3d0f05),
      _0x310acc(
        _0x34c309,
        _0x5bcabc.maskRectNode,
        _0x322620.maskRect === true
          ? (_0x5bcabc.maskRectNode?.trueValue ?? '1')
          : (_0x5bcabc.maskRectNode?.falseValue ?? '0'),
      ),
      _0x310acc(_0x34c309, _0x5bcabc.maskParamsEnabledNode, _0x5bcabc.maskParamsEnabledNode?.value ?? '1'));
  }
  (_0x19eb29 === 'longVideoOverlay' || _0x19eb29 === 'cameraMove') &&
    _0x310acc(_0x34c309, _0x5bcabc.specialModeNode, _0x1a7011(_0x19eb29, _0x5bcabc.specialModeNode, ''));
  _0x19eb29 === 'longVideoOverlay' &&
    _0x310acc(_0x34c309, _0x5bcabc.longVideoOverlayNode, _0x5bcabc.longVideoOverlayNode?.value ?? '1');
  const _0x5ee2df = Number(_0x322620.breastJiggle ?? _0x322620.rhBreastJiggle ?? 0),
    _0x109369 = Number.isFinite(_0x5ee2df) ? Math.max(0, Math.min(1, Math.round(_0x5ee2df * 20) / 20)) : 0;
  return (
    _0x109369 > 0 &&
      (_0x310acc(_0x34c309, _0x5bcabc.breastJiggleNode, Number(_0x109369.toFixed(2))),
      _0x310acc(
        _0x34c309,
        _0x5bcabc.breastJiggleEnabledNode,
        _0x5bcabc.breastJiggleEnabledNode?.value ?? 'true',
      )),
    _0x263ff2({
      executionManifest: _0x4083c7,
      payload: _0x322620,
      apiKey: _0x97a0da,
      nodeInfoList: _0x34c309,
    })
  );
}
function normalizeBerniniInputMode(_0x3913e3) {
  const _0x4513b0 = String(_0x3913e3 || '').trim();
  return ['none', 'image', 'video', 'videoImage', 'videoVideo'].includes(_0x4513b0) ? _0x4513b0 : 'none';
}
function resolveBerniniFunctionForMode(_0xcd19cc, _0x2adc8a = '') {
  const _0x41c4cd = {
      none: ['t2v'],
      image: ['i2v', 'r2v'],
      video: ['v2v', 'mv2v'],
      videoImage: ['vi2v', 'rv2v', 'vrc2v'],
      videoVideo: ['ads2v'],
    },
    _0x808b94 = normalizeBerniniInputMode(_0xcd19cc),
    _0x3a7314 = _0x41c4cd[_0x808b94] || _0x41c4cd.none,
    _0x23541d = String(_0x2adc8a || '').trim();
  return _0x3a7314.includes(_0x23541d) ? _0x23541d : _0x3a7314[0];
}
function resolveBerniniModeValue(_0x14ddf3, _0x52b238 = '') {
  const _0x5625a5 = {
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
  return _0x5625a5[resolveBerniniFunctionForMode(_0x14ddf3, _0x52b238)] || '0';
}
function normalizeBerniniResolutionBase(_0x54d799) {
  const _0x5912ea = Number(_0x54d799);
  return [0x340, 0x400, 0x500, 0x5a0].includes(_0x5912ea) ? _0x5912ea : 0x340;
}
function parseBerniniAspectRatio(_0x3d0056) {
  const _0x29b872 = String(_0x3d0056 || '16:9').trim(),
    _0x15e4bc = _0x29b872.toLowerCase();
  if (_0x29b872 === '自适应' || _0x15e4bc === 'auto' || _0x15e4bc === 'adaptive')
    return { widthRatio: 16, heightRatio: 9 };
  const [_0x4ed65e, _0x3ebafd] = _0x29b872.split(':'),
    _0x260b7c = Number(_0x4ed65e),
    _0x56ba0 = Number(_0x3ebafd);
  if (_0x260b7c > 0 && _0x56ba0 > 0) return { widthRatio: _0x260b7c, heightRatio: _0x56ba0 };
  return { widthRatio: 16, heightRatio: 9 };
}
function resolveBerniniAspectRatioValue(_0x5a7a70 = {}) {
  const _0x599e04 =
      _0x5a7a70.rhBerniniAspectRatio ??
      _0x5a7a70.generationParams?.rhBerniniAspectRatio ??
      _0x5a7a70.resolvedRatioLabel ??
      _0x5a7a70.aspectRatio,
    _0x1f9e99 = String(_0x599e04 || '').trim(),
    _0x29b69e = _0x1f9e99.toLowerCase();
  if (_0x1f9e99 === '自适应' || _0x29b69e === 'auto' || _0x29b69e === 'adaptive')
    return _0x5a7a70.resolvedRatioLabel || _0x5a7a70.aspectRatio || '16:9';
  return _0x599e04;
}
function roundBerniniDimensionToEight(_0x485815) {
  return Math.max(8, Math.round(Number(_0x485815 || 0) / 8) * 8);
}
function resolveBerniniDimensions({ resolutionBase: _0x55afad, aspectRatio: _0x4bc5c8 } = {}) {
  const _0x4cbf09 = normalizeBerniniResolutionBase(_0x55afad),
    { widthRatio: _0xd4936b, heightRatio: _0x48b35a } = parseBerniniAspectRatio(_0x4bc5c8);
  if (_0xd4936b >= _0x48b35a)
    return { width: _0x4cbf09, height: roundBerniniDimensionToEight((_0x4cbf09 * _0x48b35a) / _0xd4936b) };
  return { width: roundBerniniDimensionToEight((_0x4cbf09 * _0xd4936b) / _0x48b35a), height: _0x4cbf09 };
}
async function resolveRunningHubBerniniVideoReplaceV1Payload({
  executionManifest: _0x512193,
  payload: _0x5ba832,
  finalPrompt: _0x1e35ad,
  apiKey: _0x5dfb8a,
  ctx: _0x595a1f,
  helpers: _0x1c5266,
}) {
  const _0x49404a = _0x512193.mapping || {},
    _0x157434 = [],
    {
      buildOpenApiVideoWorkflowRequest: _0x1eb863,
      pushManifestNode: _0x401f7e,
      resolveRunningHubFirstImageInput: _0x5ad108,
      resolveRunningHubOptionalVideoInput: _0x5e7a7c,
      resolveRunningHubVideoInput: _0x246d08,
    } = _0x1c5266;
  let _0x3d693d = '';
  (String(_0x5ba832.videoUrl || '').trim() || _0x5ba832.videoFile) &&
    (_0x3d693d = await _0x246d08(_0x5ba832, _0x5dfb8a, {
      missingMessage: '请接入源视频',
      uploadFailedMessage: '源视频上传失败',
    }));
  const _0x5b219f = await _0x5ad108(_0x5ba832, _0x5dfb8a, _0x595a1f, {
      required: false,
      missingMessage: '请接入参考图像',
    }),
    _0x504ba1 = await _0x5e7a7c(_0x5ba832, _0x5dfb8a, 'referenceVideoUrl'),
    _0x1f6a53 = _0x3d693d
      ? _0x504ba1
        ? 'videoVideo'
        : _0x5b219f
          ? 'videoImage'
          : 'video'
      : _0x5b219f
        ? 'image'
        : 'none';
  if (_0x504ba1 && !_0x3d693d) throw new Error('参考视频需要同时接入源视频');
  const _0x279680 = resolveBerniniModeValue(
      _0x1f6a53,
      _0x5ba832.rhBerniniFunction ?? _0x5ba832.generationParams?.rhBerniniFunction,
    ),
    _0x2fca5f = resolveBerniniDimensions({
      resolutionBase:
        _0x5ba832.rhVideoResolution ??
        _0x5ba832.generationParams?.rhVideoResolution ??
        _0x5ba832.rhBerniniResolutionBase ??
        _0x5ba832.generationParams?.rhBerniniResolutionBase,
      aspectRatio: resolveBerniniAspectRatioValue(_0x5ba832),
    });
  _0x3d693d && _0x401f7e(_0x157434, _0x49404a.sourceVideoNode, _0x3d693d);
  _0x5b219f && _0x1f6a53 !== 'videoVideo' && _0x401f7e(_0x157434, _0x49404a.refImageNode, _0x5b219f);
  _0x401f7e(_0x157434, _0x49404a.modeNode, _0x279680);
  const _0x3cdfc6 = Number(_0x5ba832.rhVideoFps ?? _0x49404a.fpsNode?.value),
    _0x3fcbad = Number.isFinite(_0x3cdfc6) ? Math.trunc(_0x3cdfc6) : 24;
  _0x401f7e(_0x157434, _0x49404a.fpsNode, String(_0x3fcbad));
  const _0x233b31 = Number(_0x5ba832.rhVideoFrames ?? _0x49404a.framesNode?.value),
    _0x575c73 = Number.isFinite(_0x233b31) ? Math.max(0, Math.trunc(_0x233b31)) : 121;
  return (
    _0x401f7e(_0x157434, _0x49404a.framesNode, String(_0x575c73)),
    _0x401f7e(_0x157434, _0x49404a.widthNode, _0x2fca5f.width),
    _0x401f7e(_0x157434, _0x49404a.heightNode, _0x2fca5f.height),
    _0x401f7e(_0x157434, _0x49404a.promptNode, _0x1e35ad || ''),
    _0x1f6a53 === 'videoVideo' && _0x401f7e(_0x157434, _0x49404a.referenceVideoNode, _0x504ba1),
    _0x1eb863({
      executionManifest: _0x512193,
      payload: _0x5ba832,
      apiKey: _0x5dfb8a,
      nodeInfoList: _0x157434,
    })
  );
}
async function resolveRunningHubVideoMattingPayload({
  executionManifest: _0x39c377,
  payload: _0x4b3dc2,
  apiKey: _0x155a16,
  ctx: _0x447e75,
  helpers: _0x672b26,
}) {
  const _0x6e2bf3 = _0x39c377.mapping || {},
    _0x291c68 = [],
    {
      buildTaskCreateVideoWorkflowRequest: _0x45db75,
      normalizeRhVideoFps: _0x1efb7f,
      normalizeRhVideoResolution: _0x4626d7,
      normalizeVideoMattingMaskModeIndex: _0x1b8de9,
      pushManifestNode: _0x434f9f,
    } = _0x672b26,
    _0x2094b3 = String(_0x4b3dc2.maskImageDataUrl || '').trim(),
    _0x5c4218 = String(_0x4b3dc2.videoUrl || '').trim();
  if (!_0x5c4218) throw new Error('请接入源视频');
  const _0x272881 = _0x447e75.processInputVideos;
  if (typeof _0x272881 !== 'function') throw new Error('缺少 RunningHUB 视频上传能力');
  const _0x57bc33 = await _0x272881([_0x5c4218], _0x155a16),
    _0x218bb3 = String(_0x57bc33?.[0] || '').trim();
  if (!_0x218bb3) throw new Error('源视频上传失败');
  if (_0x2094b3) {
    const _0x481c8e = _0x447e75.processInputImages;
    if (typeof _0x481c8e !== 'function') throw new Error('缺少 RunningHUB 图片上传能力');
    const _0xd0135d = await _0x481c8e([_0x2094b3], _0x155a16, { compress: false, provider: 'runninghub' }),
      _0x3504c3 = String(_0xd0135d?.[0] || '').trim();
    if (!_0x3504c3) throw new Error('擦除遮罩上传失败');
    const _0x29485e = Number(_0x4b3dc2.sourceFrameCount ?? _0x4b3dc2.frameCount),
      _0x599ae2 = Number.isFinite(_0x29485e) ? Math.max(1, Math.trunc(_0x29485e)) : 1;
    (_0x434f9f(_0x291c68, _0x6e2bf3.maskVideoNode, _0x218bb3),
      _0x434f9f(_0x291c68, _0x6e2bf3.maskFrameCapNode, String(_0x599ae2)),
      _0x434f9f(
        _0x291c68,
        _0x6e2bf3.maskFpsNode,
        String(_0x1efb7f(_0x4b3dc2.rhVideoFps ?? _0x4b3dc2.frameRate)),
      ),
      _0x434f9f(
        _0x291c68,
        _0x6e2bf3.maskResolutionNode,
        String(_0x4626d7(_0x4b3dc2.rhVideoResolution, 0x400)),
      ),
      _0x434f9f(_0x291c68, _0x6e2bf3.maskImageNode, _0x3504c3));
    const _0x56d751 = _0x4b3dc2.rhInstanceType === 'plus' ? 'plus' : 'default';
    return {
      url: '/api/v2/video/matting/run',
      headers: { 'Content-Type': 'application/json' },
      body: {
        apiKey: _0x155a16,
        appId: _0x6e2bf3.maskAppId,
        nodeInfoList: _0x291c68,
        instanceType: _0x56d751,
        usePersonalQueue: 'false',
      },
      adapterTrace: { source: 'manifest', executionId: _0x39c377.id, modelId: _0x4b3dc2.model },
      isAsync: true,
      taskIdPath: 'taskId',
      useOpenapiQuery: true,
      pollUrlBuilder: () => 'https://www.runninghub.cn/openapi/v2/query',
      resultExtractor: (_0x11cfea) =>
        _0x11cfea.status === 'COMPLETED' && Array.isArray(_0x11cfea.results)
          ? _0x11cfea.results.map((_0x37d9d5) => _0x37d9d5.videoUrl || _0x37d9d5.url).filter(Boolean)
          : [],
    };
  }
  _0x434f9f(_0x291c68, _0x6e2bf3.noMaskVideoNode, _0x218bb3);
  const _0x394171 = _0x4b3dc2.frameRate || _0x4b3dc2.rhVideoFps;
  if (_0x394171) _0x434f9f(_0x291c68, _0x6e2bf3.noMaskFpsNode, String(_0x394171));
  _0x4b3dc2.rhVideoResolution !== undefined &&
    _0x4b3dc2.rhVideoResolution !== null &&
    _0x434f9f(_0x291c68, _0x6e2bf3.noMaskResolutionNode, String(_0x4626d7(_0x4b3dc2.rhVideoResolution)));
  const _0x49f846 = _0x4b3dc2.pos_points ?? _0x4b3dc2.positive ?? '',
    _0xa64dcc = _0x4b3dc2.neg_points ?? _0x4b3dc2.negative ?? '';
  (_0x434f9f(
    _0x291c68,
    _0x6e2bf3.positiveNode,
    Array.isArray(_0x49f846) ? JSON.stringify(_0x49f846) : String(_0x49f846 || ''),
  ),
    _0x434f9f(
      _0x291c68,
      _0x6e2bf3.negativeNode,
      Array.isArray(_0xa64dcc) ? JSON.stringify(_0xa64dcc) : String(_0xa64dcc || ''),
    ));
  const _0x5628f3 = _0x4b3dc2.frameRate || _0x4b3dc2.rhVideoFps || _0x4b3dc2.fps,
    _0xde5efd =
      Number.isFinite(_0x4b3dc2.timeSec) && Number.isFinite(Number(_0x5628f3))
        ? Math.max(0, Math.round(Number(_0x4b3dc2.timeSec) * Number(_0x5628f3)))
        : _0x4b3dc2.frame_index !== undefined && _0x4b3dc2.frame_index !== null
          ? _0x4b3dc2.frame_index
          : 0;
  return (
    _0x434f9f(_0x291c68, _0x6e2bf3.frameIndexNode, String(_0xde5efd)),
    _0x434f9f(_0x291c68, _0x6e2bf3.maskModeNode, _0x1b8de9(_0x4b3dc2.rhMaskMode)),
    _0x45db75({
      executionManifest: _0x39c377,
      payload: _0x4b3dc2,
      apiKey: _0x155a16,
      nodeInfoList: _0x291c68,
    })
  );
}
