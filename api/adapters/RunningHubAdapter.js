import { resolveModelExecution } from '../../src/manifests/index.js';
import { normalizeRatioLabelText } from '../imageRatioPolicy.js';
import { buildImageRequestFromManifest } from './ModelApiManifestNormalizer.js';
import { getRunningHubWorkflowPayloadResolver } from './runninghubWorkflowResolvers/index.js';
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
function normalizeRhVideoFps(_0x14c90e) {
  const _0x5ae2c5 = Math.trunc(Number(_0x14c90e));
  return RH_VIDEO_FPS_OPTIONS.includes(_0x5ae2c5) ? _0x5ae2c5 : 24;
}
function normalizeRhVideoResolution(_0x4c16f4, _0x3ea781 = RH_MIN_VIDEO_RESOLUTION) {
  const _0x16c936 = Number(_0x4c16f4);
  return Number.isFinite(_0x16c936) ? Math.max(RH_MIN_VIDEO_RESOLUTION, Math.trunc(_0x16c936)) : _0x3ea781;
}
function normalizeRunningHubWorkflowRatio(_0xfb8a9d) {
  const _0x4940f6 = String(_0xfb8a9d || '').trim();
  if (!_0x4940f6) return RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
  const _0x53c55d = normalizeRatioLabelText(_0x4940f6),
    _0x94552d = _0x53c55d.toLowerCase();
  if (
    _0x94552d === 'auto' ||
    _0x94552d === 'default' ||
    _0x53c55d === '默认' ||
    _0x53c55d === '自适应' ||
    _0x94552d === 'original' ||
    _0x53c55d === '原图比例'
  )
    return RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
  if (!_0x53c55d.includes(':')) return RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
  const [_0x47fd97, _0x3baa08] = _0x53c55d.split(':'),
    _0x113675 = Number.parseFloat(_0x47fd97),
    _0x34fca4 = Number.parseFloat(_0x3baa08);
  if (!(_0x113675 > 0 && _0x34fca4 > 0)) return RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
  const _0x25dc0b = _0x113675 + ':' + _0x34fca4;
  return RUNNINGHUB_WORKFLOW_RATIO_SET.has(_0x25dc0b) ? _0x25dc0b : RUNNINGHUB_WORKFLOW_DEFAULT_RATIO;
}
function normalizeQwenImageEditModeIndex(_0x2ad3a3) {
  const _0x3182d0 = String(_0x2ad3a3 || '')
    .trim()
    .toLowerCase();
  if (_0x3182d0 === '0' || _0x3182d0 === 'qwen2509' || _0x3182d0 === '2509') return '0';
  return '1';
}
function normalizeQwenFirstImageModeIndex(_0x19cad8) {
  const _0x49702b = String(_0x19cad8 || '')
    .trim()
    .toLowerCase();
  if (_0x49702b === '1' || _0x49702b === 'pose' || _0x49702b === '姿势图') return '1';
  if (_0x49702b === '2' || _0x49702b === 'depth' || _0x49702b === '深度图') return '2';
  return '0';
}
function normalizeQwenImageEditQuality(_0x4ef4cc) {
  const _0x3eb73e = String(_0x4ef4cc || '')
    .trim()
    .toUpperCase();
  if (_0x3eb73e === '1.5K') return '1.5K';
  return _0x3eb73e === '1K' ? '1K' : '2K';
}
function resolveQwenImageEditDimensions(_0xd9cb9d, _0x2abe66) {
  const _0x1b7f37 = normalizeQwenImageEditQuality(_0xd9cb9d),
    _0x7fc15a = _0x1b7f37 === '1K' ? 0x400 : _0x1b7f37 === '1.5K' ? 0x600 : 0x780,
    _0x12044a = normalizeRunningHubWorkflowRatio(_0x2abe66),
    [_0x2f137a, _0x5538fb] = _0x12044a.split(':'),
    _0x19411f = Number.parseFloat(_0x2f137a) || 1,
    _0x404afe = Number.parseFloat(_0x5538fb) || 1,
    _0x3899cf = _0x19411f >= _0x404afe,
    _0x3bcccd = _0x3899cf ? _0x7fc15a : (_0x7fc15a * _0x19411f) / _0x404afe,
    _0x3174fe = _0x3899cf ? (_0x7fc15a * _0x404afe) / _0x19411f : _0x7fc15a,
    _0x59435b = 64,
    _0x435d43 = (_0x362684) => Math.max(0x200, Math.round(Number(_0x362684 || 0) / _0x59435b) * _0x59435b);
  return { width: _0x435d43(_0x3bcccd), height: _0x435d43(_0x3174fe) };
}
function normalizeManifestMappedValue(_0x58e9d2, _0x2a6d8a) {
  const _0x31ae5e = String(_0x58e9d2 ?? _0x2a6d8a?.defaultValue ?? '').trim(),
    _0x5bdbf3 = _0x2a6d8a?.valueMap || {};
  return (
    _0x5bdbf3[_0x31ae5e] ||
    _0x5bdbf3[_0x31ae5e.toLowerCase()] ||
    _0x5bdbf3[String(_0x2a6d8a?.defaultValue || '')] ||
    _0x31ae5e
  );
}
function formatManifestPromptNodeValue(_0x378b75, _0x5bc9a0) {
  const _0xa37e31 = String(_0x378b75 || '').trim(),
    _0x2ac679 = String(_0x5bc9a0?.defaultValue ?? ''),
    _0x2d61eb = _0xa37e31 || _0x2ac679;
  if (!_0x2d61eb) return '';
  return '' + String(_0x5bc9a0?.prefix ?? '') + _0x2d61eb + String(_0x5bc9a0?.suffix ?? '');
}
function normalizeManifestImageNode(_0x28bbe2, _0x2aaa30) {
  if (_0x28bbe2 && typeof _0x28bbe2 === 'object' && !Array.isArray(_0x28bbe2))
    return {
      nodeId: String(_0x28bbe2.nodeId || '').trim(),
      fieldName: String(_0x28bbe2.fieldName || 'image').trim() || 'image',
      description: _0x28bbe2.description || '图' + (_0x2aaa30 + 1),
    };
  return { nodeId: String(_0x28bbe2 || '').trim(), fieldName: 'image', description: '图' + (_0x2aaa30 + 1) };
}
function getManifestPayloadPathValue(_0xdf8883, _0x4e426b) {
  const _0x9ccc4b = String(_0x4e426b || '').trim();
  if (!_0x9ccc4b) return undefined;
  return _0x9ccc4b.split('.').reduce((_0x7e75e, _0x4b511e) => {
    if (_0x7e75e === undefined || _0x7e75e === null) return undefined;
    return _0x7e75e[_0x4b511e];
  }, _0xdf8883);
}
function resolveManifestPayloadValue(
  _0x24e964,
  _0x10cf15 = [],
  _0x407d70 = undefined,
  { allowEmpty: allowEmpty = false } = {},
) {
  const _0x44f9de = Array.isArray(_0x10cf15) ? _0x10cf15 : [_0x10cf15];
  for (const _0x44c071 of _0x44f9de.filter(Boolean)) {
    const _0x4ca6d2 = getManifestPayloadPathValue(_0x24e964, _0x44c071);
    if (allowEmpty && _0x4ca6d2 !== undefined && _0x4ca6d2 !== null) return _0x4ca6d2;
    if (_0x4ca6d2 !== undefined && _0x4ca6d2 !== null && String(_0x4ca6d2).trim() !== '') return _0x4ca6d2;
  }
  return _0x407d70;
}
function normalizeManifestValueNodeValue(_0xce841d, _0x4126dc) {
  const _0x3b3130 = [
    ...(Array.isArray(_0x4126dc?.allowedValues) ? _0x4126dc.allowedValues : []),
    ...(isAdvancedModeEnabled() && Array.isArray(_0x4126dc?.advancedAllowedValues)
      ? _0x4126dc.advancedAllowedValues
      : []),
  ]
    .map((_0x2a8687) => Number(_0x2a8687))
    .filter(Number.isFinite);
  if (_0x3b3130.length === 0) return _0xce841d;
  const _0x4eb5c8 = Number(_0xce841d),
    _0x40272b = Number(_0x4126dc?.defaultValue),
    _0x5c49c6 = Number.isFinite(_0x4eb5c8)
      ? _0x4eb5c8
      : Number.isFinite(_0x40272b)
        ? _0x40272b
        : _0x3b3130[0];
  return _0x3b3130.reduce(
    (_0x1ef8c5, _0x303c98) =>
      Math.abs(_0x303c98 - _0x5c49c6) < Math.abs(_0x1ef8c5 - _0x5c49c6) ? _0x303c98 : _0x1ef8c5,
    _0x3b3130[0],
  );
}
async function buildOpenApiAiAppWorkflowRequestFromManifest({
  executionManifest: _0x3160c4,
  payload: _0x4188a9,
  finalPrompt: _0x2b6386,
  finalUrls: _0x32482e,
  apiKey: _0x20d00f,
  ctx: _0x8c57c3,
}) {
  if (!_0x3160c4 || _0x3160c4.adapterType !== 'workflow' || _0x3160c4.submitMode !== 'openapi-v2-ai-app')
    return null;
  const _0x53d2b9 = _0x3160c4.mapping || {},
    _0x46afed = _0x3160c4.validation || {},
    _0x4f2730 = Math.max(1, Number(_0x53d2b9.maxInputImages) || 1),
    _0x369d54 = _0x32482e.filter(Boolean).slice(0, _0x4f2730),
    _0x337505 = Math.max(0, Number(_0x46afed.minInputImages) || 0);
  if (_0x369d54.length < _0x337505)
    throw new Error(_0x46afed.missingInputMessage || '请先添加至少一张参考图再生成');
  const _0x53979a = [],
    _0x2ece1b = Array.isArray(_0x53d2b9.imageNodes) ? _0x53d2b9.imageNodes : [];
  _0x369d54.forEach((_0x40e4cc, _0x5bb3b2) => {
    const _0x540dd0 = normalizeManifestImageNode(_0x2ece1b[_0x5bb3b2], _0x5bb3b2),
      _0x31c5c9 = _0x540dd0.nodeId;
    if (!_0x31c5c9) return;
    _0x53979a.push({
      nodeId: _0x31c5c9,
      fieldName: _0x540dd0.fieldName,
      fieldValue: _0x40e4cc,
      description: _0x540dd0.description,
    });
  });
  const _0x4120ab = Array.isArray(_0x53d2b9.optionalImageNodes) ? _0x53d2b9.optionalImageNodes : [];
  if (_0x4120ab.length > 0) {
    const _0x15f222 = _0x4120ab.map((_0x53840e) =>
        String(resolveManifestPayloadValue(_0x4188a9, _0x53840e.fields, '') || '').trim(),
      ),
      _0x111ad0 =
        _0x8c57c3?.processInputImagesPreserveOrder && _0x15f222.some(Boolean)
          ? await _0x8c57c3.processInputImagesPreserveOrder(_0x15f222, _0x20d00f, {
              compress: false,
              provider: 'runninghub',
            })
          : _0x15f222;
    _0x4120ab.forEach((_0x99bc17, _0x2a379f) => {
      const _0x5ed789 = String(_0x111ad0?.[_0x2a379f] || '').trim();
      if (!_0x5ed789 || !_0x99bc17?.nodeId || !_0x99bc17?.fieldName) return;
      (_0x53979a.push({
        nodeId: String(_0x99bc17.nodeId),
        fieldName: String(_0x99bc17.fieldName),
        fieldValue: _0x5ed789,
        description: _0x99bc17.description || String(_0x99bc17.fieldName),
      }),
        _0x99bc17.enableNode?.nodeId &&
          _0x99bc17.enableNode?.fieldName &&
          _0x53979a.push({
            nodeId: String(_0x99bc17.enableNode.nodeId),
            fieldName: String(_0x99bc17.enableNode.fieldName),
            fieldValue: String(_0x99bc17.enableNode.value ?? 'true'),
            description: _0x99bc17.enableNode.description || String(_0x99bc17.enableNode.fieldName),
          }));
    });
  }
  _0x53d2b9.promptNode?.nodeId &&
    _0x53d2b9.promptNode?.fieldName &&
    _0x53979a.push({
      nodeId: String(_0x53d2b9.promptNode.nodeId),
      fieldName: String(_0x53d2b9.promptNode.fieldName),
      fieldValue: formatManifestPromptNodeValue(_0x2b6386, _0x53d2b9.promptNode),
      description: _0x53d2b9.promptNode.description || '提示词',
    });
  if (_0x53d2b9.dimensionsNode?.nodeId) {
    const _0x5aca76 = resolveQwenImageEditDimensions(
      _0x4188a9.imageSize,
      _0x4188a9.resolvedRatioLabel || _0x4188a9.aspectRatio,
    );
    (_0x53979a.push({
      nodeId: String(_0x53d2b9.dimensionsNode.nodeId),
      fieldName: 'width',
      fieldValue: String(_0x5aca76.width),
      description: 'width',
    }),
      _0x53979a.push({
        nodeId: String(_0x53d2b9.dimensionsNode.nodeId),
        fieldName: 'height',
        fieldValue: String(_0x5aca76.height),
        description: 'height',
      }));
  }
  [_0x53d2b9.firstImageModeNode, _0x53d2b9.editModeNode].forEach((_0x1cfa14) => {
    if (!_0x1cfa14?.nodeId || !_0x1cfa14?.fieldName || !_0x1cfa14?.field) return;
    _0x53979a.push({
      nodeId: String(_0x1cfa14.nodeId),
      fieldName: String(_0x1cfa14.fieldName),
      fieldValue: normalizeManifestMappedValue(_0x4188a9[_0x1cfa14.field], _0x1cfa14),
      description: _0x1cfa14 === _0x53d2b9.firstImageModeNode ? '把第一张图变为' : '模式选择',
    });
  });
  Array.isArray(_0x53d2b9.valueNodes) &&
    _0x53d2b9.valueNodes.forEach((_0x756ec3) => {
      if (!_0x756ec3?.nodeId || !_0x756ec3?.fieldName) return;
      const _0x4787da = [
        _0x756ec3.field,
        ...(Array.isArray(_0x756ec3.fallbackFields) ? _0x756ec3.fallbackFields : []),
      ].filter(Boolean);
      let _0x84153c = '';
      for (const _0x25a423 of _0x4787da) {
        const _0x2aa1bd = getManifestPayloadPathValue(_0x4188a9, _0x25a423);
        if (_0x2aa1bd !== undefined && _0x2aa1bd !== null && String(_0x2aa1bd).trim() !== '') {
          _0x84153c = _0x2aa1bd;
          break;
        }
      }
      if (_0x84153c === '') _0x84153c = _0x756ec3.defaultValue ?? '';
      ((_0x84153c = normalizeManifestValueNodeValue(_0x84153c, _0x756ec3)),
        _0x53979a.push({
          nodeId: String(_0x756ec3.nodeId),
          fieldName: String(_0x756ec3.fieldName),
          fieldValue: String(_0x84153c),
          description: _0x756ec3.description || String(_0x756ec3.fieldName),
        }));
    });
  if (_0x53d2b9.imageCountNode?.nodeId && _0x53d2b9.imageCountNode?.fieldName) {
    const _0x117863 = Number(_0x53d2b9.imageCountNode.offset) || 0;
    _0x53979a.push({
      nodeId: String(_0x53d2b9.imageCountNode.nodeId),
      fieldName: String(_0x53d2b9.imageCountNode.fieldName),
      fieldValue: String(Math.max(0, _0x369d54.length + _0x117863)),
      description: '入参多少张图片',
    });
  }
  const _0x3bdbf4 = _0x4188a9[_0x3160c4.instanceType?.field] === 'plus' ? 'plus' : 'default',
    _0x3f27c8 = String(_0x3160c4.appId || _0x3160c4.workflowId || '').trim();
  return {
    url: '/api/v2/proxy/image',
    headers: { 'Content-Type': 'application/json' },
    body: {
      apiUrl: 'https://www.runninghub.cn/openapi/v2/run/ai-app/' + _0x3f27c8,
      apiKey: _0x20d00f,
      nodeInfoList: _0x53979a,
      instanceType: _0x3bdbf4,
      usePersonalQueue: 'false',
    },
    isAsync: true,
    taskIdPath: _0x3160c4.result?.taskIdPath || 'taskId',
    adapterTrace: { source: 'manifest', executionId: _0x3160c4.id, modelId: _0x4188a9.model },
    pollUrlBuilder: () => 'https://www.runninghub.cn/openapi/v2/query',
    resultExtractor: (_0x1e8d00) => {
      if (_0x1e8d00.status === 'COMPLETED' && Array.isArray(_0x1e8d00.results))
        return _0x1e8d00.results.map((_0x1aeb64) => _0x1aeb64.url || _0x1aeb64.imageUrl).filter(Boolean);
      return [];
    },
  };
}
function normalizeVideoMattingMaskModeIndex(_0x5065f0) {
  const _0x5d17d2 = String(_0x5065f0 || '').trim();
  if (!_0x5d17d2 || _0x5d17d2 === '0') return '0';
  if (_0x5d17d2 === '1') return '1';
  if (_0x5d17d2 === '2') return '2';
  const _0x50b9fd = _0x5d17d2.toLowerCase();
  if (_0x50b9fd === 'sam3') return '1';
  if (_0x50b9fd === 'ma2' || _0x50b9fd === 'matanyone2') return '2';
  return '0';
}
function buildRunningHubVideoResultExtractor() {
  return (_0xe72866) => {
    if (_0xe72866.status === 'COMPLETED' && Array.isArray(_0xe72866.results))
      return _0xe72866.results.map((_0x172293) => _0x172293.videoUrl || _0x172293.url).filter(Boolean);
    return [];
  };
}
function buildOpenApiVideoWorkflowRequest({
  executionManifest: _0x2c4c9f,
  payload: _0x3fb6f6,
  apiKey: _0x4864bb,
  nodeInfoList: _0x23aea4,
}) {
  const _0x43b5a9 = _0x3fb6f6[_0x2c4c9f.instanceType?.field] === 'plus' ? 'plus' : 'default',
    _0x9c7ab7 = String(_0x2c4c9f.appId || _0x2c4c9f.workflowId || '').trim();
  return {
    url: '/api/v2/proxy/image',
    headers: { 'Content-Type': 'application/json' },
    body: {
      apiUrl: 'https://www.runninghub.cn/openapi/v2/run/ai-app/' + _0x9c7ab7,
      apiKey: _0x4864bb,
      nodeInfoList: _0x23aea4,
      instanceType: _0x43b5a9,
      usePersonalQueue: 'false',
    },
    isAsync: true,
    taskIdPath: _0x2c4c9f.result?.taskIdPath || 'taskId',
    adapterTrace: { source: 'manifest', executionId: _0x2c4c9f.id, modelId: _0x3fb6f6.model },
    pollUrlBuilder: () => 'https://www.runninghub.cn/openapi/v2/query',
    resultExtractor: buildRunningHubVideoResultExtractor(),
  };
}
function buildTaskCreateVideoWorkflowRequest({
  executionManifest: _0x6f5153,
  payload: _0x22363f,
  apiKey: _0x1e783c,
  nodeInfoList: _0x18f9c5,
}) {
  const _0x26135e = _0x22363f[_0x6f5153.instanceType?.field] === 'plus' ? 'plus' : 'default';
  return {
    url: '/api/v2/runninghubwf/run',
    apiUrl: 'https://www.runninghub.cn/task/openapi/create',
    headers: { 'Content-Type': 'application/json' },
    body: {
      apiKey: _0x1e783c,
      workflowId: String(_0x6f5153.workflowId || _0x6f5153.appId || ''),
      addMetadata: false,
      nodeInfoList: _0x18f9c5,
      instanceType: _0x26135e,
      usePersonalQueue: 'false',
    },
    isAsync: true,
    taskIdPath: _0x6f5153.result?.taskIdPath || 'taskId',
    adapterTrace: { source: 'manifest', executionId: _0x6f5153.id, modelId: _0x22363f.model },
    pollUrlBuilder: () => 'https://www.runninghub.cn/openapi/v2/query',
    resultExtractor: buildRunningHubVideoResultExtractor(),
  };
}
function pushManifestNode(_0x55f8ba, _0x3c6fd6, _0x338a7b, _0x376eba = {}) {
  if (!_0x3c6fd6?.nodeId || !_0x3c6fd6?.fieldName) return;
  _0x55f8ba.push({
    nodeId: String(_0x3c6fd6.nodeId),
    fieldName: String(_0x376eba.fieldName || _0x3c6fd6.fieldName),
    fieldValue: String(_0x338a7b),
    ...(_0x3c6fd6.description || _0x376eba.description
      ? { description: _0x376eba.description || _0x3c6fd6.description }
      : {}),
  });
}
function getMappedValue(_0xf5bd28, _0x42e525, _0x5b538f = '') {
  const _0x5dc923 = String(_0xf5bd28 ?? '').trim(),
    _0x2b8734 = _0x42e525?.valueMap || {};
  if (_0x5dc923 && _0x2b8734[_0x5dc923] !== undefined) return _0x2b8734[_0x5dc923];
  if (_0x5dc923 && _0x2b8734[_0x5dc923.toLowerCase()] !== undefined)
    return _0x2b8734[_0x5dc923.toLowerCase()];
  return _0x42e525?.defaultValue ?? _0x5b538f;
}
async function resolveRunningHubVideoInput(
  _0xfe0bf7,
  _0x16924d,
  {
    urlField: urlField = 'videoUrl',
    fileField: fileField = 'videoFile',
    missingMessage: missingMessage = '请接入源视频',
    uploadFailedMessage: uploadFailedMessage = '源视频上传失败',
  } = {},
) {
  let _0x3c998e = '';
  const _0x596698 = String(_0xfe0bf7[urlField] || '').trim();
  if (_0x596698) {
    const { processInputVideos: _0xc5188c } = await import('../videoUploadApi.js'),
      _0x308757 = await _0xc5188c([_0x596698], _0x16924d);
    if (_0x308757.length > 0) _0x3c998e = _0x308757[0];
  } else {
    if (_0xfe0bf7[fileField]) {
      const { uploadVideoToRunningHub: _0x1656a9 } = await import('../videoUploadApi.js');
      _0x3c998e = await _0x1656a9(_0xfe0bf7[fileField], _0x16924d);
    }
  }
  if (!_0x3c998e) throw new Error(_0x596698 || _0xfe0bf7[fileField] ? uploadFailedMessage : missingMessage);
  return _0x3c998e;
}
async function resolveRunningHubOptionalVideoInput(_0x7ea084, _0x47646a, _0x1b8305) {
  const _0x3fc7bc = String(_0x7ea084[_0x1b8305] || '').trim();
  if (!_0x3fc7bc) return '';
  const { processInputVideos: _0x5cdc69 } = await import('../videoUploadApi.js'),
    _0x15d50d = await _0x5cdc69([_0x3fc7bc], _0x47646a);
  return String(_0x15d50d?.[0] || '').trim();
}
async function resolveRunningHubAudioInput(
  _0x4a2662,
  _0x2c7ed8,
  {
    urlField: urlField = 'audioUrl',
    fileField: fileField = 'audioFile',
    required: required = false,
    missingMessage: missingMessage = '请接入音频',
  } = {},
) {
  let _0x566212 = '';
  const _0x26553d = String(_0x4a2662[urlField] || '').trim();
  if (_0x26553d) {
    const { processInputAudios: _0x327621 } = await import('../audioUploadApi.js'),
      _0x1da584 = await _0x327621([_0x26553d], _0x2c7ed8);
    if (_0x1da584.length > 0) _0x566212 = _0x1da584[0];
  } else {
    if (_0x4a2662[fileField]) {
      const { uploadAudioToRunningHub: _0x2f6216 } = await import('../audioUploadApi.js');
      _0x566212 = await _0x2f6216(_0x4a2662[fileField], _0x2c7ed8);
    }
  }
  if (required && !_0x566212) throw new Error(missingMessage);
  return _0x566212;
}
async function resolveRunningHubFirstImageInput(
  _0x2dce5b,
  _0x10e764,
  _0x2ec1a4,
  {
    field: field = 'inputUrls',
    required: required = false,
    missingMessage: missingMessage = '请接入参考图',
    compress: compress = true,
  } = {},
) {
  const _0x314c55 = Array.isArray(_0x2dce5b[field])
    ? _0x2dce5b[field]
    : String(_0x2dce5b[field] || '').trim()
      ? [_0x2dce5b[field]]
      : [];
  if (!_0x314c55.length) {
    if (required) throw new Error(missingMessage);
    return '';
  }
  const _0x468974 = await _0x2ec1a4.processInputImages(_0x314c55, _0x10e764, {
      applyInputQualityProfile: compress,
      provider: 'runninghub',
    }),
    _0xcc42b2 = String(_0x468974?.[0] || '').trim();
  if (required && !_0xcc42b2) throw new Error(missingMessage);
  return _0xcc42b2;
}
function hasOwnManifestValue(_0x3632d9, _0x2f5470) {
  return Object.prototype.hasOwnProperty.call(_0x3632d9 || {}, _0x2f5470);
}
function isPresentManifestValue(_0xfb2479) {
  if (_0xfb2479 === undefined || _0xfb2479 === null) return false;
  if (typeof _0xfb2479 === 'string') return _0xfb2479.trim() !== '';
  return true;
}
function normalizeManifestFieldList(_0x38d546, _0x1ec0ea = '') {
  const _0x380157 = _0x38d546?.fields !== undefined ? _0x38d546.fields : _0x38d546?.field,
    _0x5f2da8 = Array.isArray(_0x380157) ? _0x380157 : [_0x380157 || _0x1ec0ea];
  return _0x5f2da8.map((_0x2db898) => String(_0x2db898 || '').trim()).filter(Boolean);
}
function manifestValuesEqual(_0x2c1ed7, _0x216bbe) {
  if (typeof _0x216bbe === 'boolean') {
    const _0x559546 = String(_0x2c1ed7 ?? '')
      .trim()
      .toLowerCase();
    return _0x2c1ed7 === _0x216bbe || _0x559546 === String(_0x216bbe);
  }
  if (typeof _0x216bbe === 'number') return Number(_0x2c1ed7) === _0x216bbe;
  return String(_0x2c1ed7 ?? '').trim() === String(_0x216bbe ?? '').trim();
}
function evaluateManifestWhenRule(_0x31104f, _0x25a606) {
  if (!_0x31104f || typeof _0x31104f !== 'object') return true;
  const _0x141f30 = _0x31104f.field ? getManifestPayloadPathValue(_0x25a606, _0x31104f.field) : undefined,
    _0x47837f = isPresentManifestValue(_0x141f30);
  if (hasOwnManifestValue(_0x31104f, 'exists') && Boolean(_0x31104f.exists) !== _0x47837f) return false;
  if (_0x31104f.truthy === true && !Boolean(_0x141f30)) return false;
  if (_0x31104f.falsy === true && Boolean(_0x141f30)) return false;
  if (hasOwnManifestValue(_0x31104f, 'equals') && !manifestValuesEqual(_0x141f30, _0x31104f.equals))
    return false;
  if (hasOwnManifestValue(_0x31104f, 'notEquals') && manifestValuesEqual(_0x141f30, _0x31104f.notEquals))
    return false;
  if (
    Array.isArray(_0x31104f.in) &&
    !_0x31104f.in.some((_0x3f7fdd) => manifestValuesEqual(_0x141f30, _0x3f7fdd))
  )
    return false;
  if (
    Array.isArray(_0x31104f.notIn) &&
    _0x31104f.notIn.some((_0x501670) => manifestValuesEqual(_0x141f30, _0x501670))
  )
    return false;
  return true;
}
function shouldUseManifestNodeMapping(_0x4f6443, _0x2aed24) {
  const _0x58d2cd = _0x4f6443?.when;
  if (_0x58d2cd === undefined || _0x58d2cd === null) return true;
  if (Array.isArray(_0x58d2cd))
    return _0x58d2cd.every((_0x5e0868) => evaluateManifestWhenRule(_0x5e0868, _0x2aed24));
  return evaluateManifestWhenRule(_0x58d2cd, _0x2aed24);
}
function applyManifestNodeValueMap(_0x5c6d18, _0x3f7fad) {
  const _0x446740 = _0x3f7fad?.valueMap || _0x3f7fad?.values || {},
    _0x51e8de = String(_0x5c6d18 ?? '').trim();
  if (_0x51e8de && _0x446740[_0x51e8de] !== undefined) return _0x446740[_0x51e8de];
  const _0x357028 = _0x51e8de.toLowerCase();
  if (_0x51e8de && _0x446740[_0x357028] !== undefined) return _0x446740[_0x357028];
  return _0x5c6d18;
}
function normalizeManifestTransformSpec(_0x24cf68) {
  if (!_0x24cf68) return { name: '' };
  if (typeof _0x24cf68 === 'string') return { name: _0x24cf68 };
  if (typeof _0x24cf68 === 'object' && !Array.isArray(_0x24cf68))
    return { ..._0x24cf68, name: String(_0x24cf68.name || '').trim() };
  return { name: '' };
}
function clampManifestNumber(_0x15ab53, _0x2ef7c6) {
  let _0x3323b3 = _0x15ab53;
  return (
    Number.isFinite(Number(_0x2ef7c6.min)) && (_0x3323b3 = Math.max(Number(_0x2ef7c6.min), _0x3323b3)),
    Number.isFinite(Number(_0x2ef7c6.max)) && (_0x3323b3 = Math.min(Number(_0x2ef7c6.max), _0x3323b3)),
    _0x3323b3
  );
}
function applyManifestNodeTransform(_0x41c6f1, _0x2dde63) {
  const _0x2541f3 = normalizeManifestTransformSpec(_0x2dde63?.transform);
  switch (_0x2541f3.name) {
    case '':
      return _0x41c6f1;
    case 'trim':
      return String(_0x41c6f1 ?? '').trim();
    case 'string':
      return String(_0x41c6f1 ?? '');
    case 'booleanString': {
      const _0x161c9f = String(_0x41c6f1 ?? '')
        .trim()
        .toLowerCase();
      return _0x41c6f1 === true || _0x161c9f === 'true' || _0x161c9f === '1' ? 'true' : 'false';
    }
    case 'integer': {
      const _0x36789d = Number(_0x41c6f1),
        _0x428681 = Number(_0x2541f3.defaultValue ?? _0x2dde63?.defaultValue ?? 0),
        _0xf8d27a = Number.isFinite(_0x36789d)
          ? Math.trunc(_0x36789d)
          : Number.isFinite(_0x428681)
            ? Math.trunc(_0x428681)
            : 0;
      return clampManifestNumber(_0xf8d27a, _0x2541f3);
    }
    case 'normalizeRhVideoFps':
      return normalizeRhVideoFps(_0x41c6f1);
    case 'normalizeRhVideoResolution':
      return normalizeRhVideoResolution(
        _0x41c6f1,
        Number.isFinite(Number(_0x2541f3.fallback)) ? Number(_0x2541f3.fallback) : RH_MIN_VIDEO_RESOLUTION,
      );
    default:
      throw new Error('Unsupported RunningHub workflow transform: ' + _0x2541f3.name);
  }
}
async function resolveRunningHubManifestVideoInput(_0x2318b3, _0x3e33a8, _0x2430f3) {
  const _0x4b6b15 = String(_0x2430f3?.urlField || _0x2430f3?.field || 'videoUrl').trim(),
    _0x4e2b0b = String(_0x2430f3?.fileField || 'videoFile').trim(),
    _0x507762 = String(_0x2318b3[_0x4b6b15] || '').trim(),
    _0x519345 = _0x2318b3[_0x4e2b0b];
  if (!_0x2430f3?.required && !_0x507762 && !_0x519345) return '';
  return resolveRunningHubVideoInput(_0x2318b3, _0x3e33a8, {
    urlField: _0x4b6b15,
    fileField: _0x4e2b0b,
    missingMessage: _0x2430f3?.missingMessage || '请接入源视频',
    uploadFailedMessage: _0x2430f3?.uploadFailedMessage || '源视频上传失败',
  });
}
async function resolveRunningHubManifestAudioInput(_0x279cb6, _0x301a6e, _0x36d1ad) {
  const _0x6ee73d = String(_0x36d1ad?.urlField || _0x36d1ad?.field || 'audioUrl').trim(),
    _0x71dc32 = String(_0x36d1ad?.fileField || 'audioFile').trim(),
    _0x223e62 = String(_0x279cb6[_0x6ee73d] || '').trim(),
    _0x6ac002 = _0x279cb6[_0x71dc32];
  if (!_0x36d1ad?.required && !_0x223e62 && !_0x6ac002) return '';
  return resolveRunningHubAudioInput(_0x279cb6, _0x301a6e, {
    urlField: _0x6ee73d,
    fileField: _0x71dc32,
    required: _0x36d1ad?.required === true,
    missingMessage: _0x36d1ad?.missingMessage || '请接入音频',
  });
}
async function resolveRunningHubManifestNodeValue({
  item: _0x42d4cd,
  payload: _0x381280,
  finalPrompt: _0xf21045,
  apiKey: _0x27ca18,
  ctx: _0x538bc9,
}) {
  const _0x11d4c3 = String(_0x42d4cd?.source || 'param').trim();
  if (_0x11d4c3 === 'constant')
    return hasOwnManifestValue(_0x42d4cd, 'value') ? _0x42d4cd.value : _0x42d4cd.defaultValue;
  if (_0x11d4c3 === 'prompt') {
    const _0x2379db = resolveManifestPayloadValue(_0x381280, normalizeManifestFieldList(_0x42d4cd), '');
    return isPresentManifestValue(_0x2379db) ? _0x2379db : _0xf21045;
  }
  if (_0x11d4c3 === 'param')
    return resolveManifestPayloadValue(_0x381280, normalizeManifestFieldList(_0x42d4cd), undefined, {
      allowEmpty: _0x42d4cd?.allowEmpty === true,
    });
  if (_0x11d4c3 === 'imageInput')
    return resolveRunningHubFirstImageInput(_0x381280, _0x27ca18, _0x538bc9, {
      field: String(_0x42d4cd?.field || 'inputUrls').trim(),
      required: _0x42d4cd?.required === true,
      missingMessage: _0x42d4cd?.missingMessage || '请接入参考图',
      compress: _0x42d4cd?.compress !== false,
    });
  if (_0x11d4c3 === 'videoInput') return resolveRunningHubManifestVideoInput(_0x381280, _0x27ca18, _0x42d4cd);
  if (_0x11d4c3 === 'audioInput') return resolveRunningHubManifestAudioInput(_0x381280, _0x27ca18, _0x42d4cd);
  throw new Error('Unsupported RunningHub workflow mapping source: ' + _0x11d4c3);
}
async function buildRunningHubNodeInfoListFromManifest({
  mapping: _0xeab81e,
  payload: _0x495ce6,
  finalPrompt: _0x1384e0,
  apiKey: _0x125c7f,
  ctx: _0x2278b4,
}) {
  const _0x3de364 = Array.isArray(_0xeab81e?.nodeInfoList) ? _0xeab81e.nodeInfoList : [];
  if (_0x3de364.length === 0) return null;
  const _0x31bdb3 = [];
  for (const _0x384fbd of _0x3de364) {
    if (!_0x384fbd?.nodeId || !_0x384fbd?.fieldName) continue;
    if (!shouldUseManifestNodeMapping(_0x384fbd, _0x495ce6)) continue;
    const _0x1b956a = await resolveRunningHubManifestNodeValue({
        item: _0x384fbd,
        payload: _0x495ce6,
        finalPrompt: _0x1384e0,
        apiKey: _0x125c7f,
        ctx: _0x2278b4,
      }),
      _0x19cc03 = _0x384fbd?.allowEmpty === true,
      _0x5dd0ba = _0x384fbd?.includeEmpty === true || _0x19cc03,
      _0x20cb6e = hasOwnManifestValue(_0x384fbd, 'defaultValue');
    let _0x38dd2e = _0x1b956a;
    !isPresentManifestValue(_0x38dd2e) &&
      _0x20cb6e &&
      !(_0x19cc03 && _0x38dd2e !== undefined && _0x38dd2e !== null) &&
      (_0x38dd2e = _0x384fbd.defaultValue);
    if (!isPresentManifestValue(_0x38dd2e)) {
      if (_0x5dd0ba) _0x38dd2e = '';
      else {
        if (_0x384fbd.required)
          throw new Error(_0x384fbd.missingMessage || '缺少 RunningHub 节点入参：' + _0x384fbd.fieldName);
        continue;
      }
    }
    ((_0x38dd2e = applyManifestNodeValueMap(_0x38dd2e, _0x384fbd)),
      (_0x38dd2e = applyManifestNodeTransform(_0x38dd2e, _0x384fbd)));
    if (!isPresentManifestValue(_0x38dd2e) && _0x384fbd.required && !_0x5dd0ba)
      throw new Error(_0x384fbd.missingMessage || '缺少 RunningHub 节点入参：' + _0x384fbd.fieldName);
    if (!isPresentManifestValue(_0x38dd2e) && !_0x5dd0ba) continue;
    pushManifestNode(_0x31bdb3, _0x384fbd, _0x38dd2e);
  }
  return _0x31bdb3;
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
  executionManifest: _0x342af3,
  payload: _0x117586,
  finalPrompt: _0x4616f3,
  apiKey: _0x12837a,
  ctx: _0x3f18a8,
}) {
  if (!_0x342af3 || _0x342af3.adapterType !== 'workflow') return null;
  const _0x79380 = _0x342af3.mapping || {},
    _0x17beae = String(_0x342af3.extensions?.payloadResolver || '').trim();
  if (_0x17beae) {
    const _0x18c51a = getRunningHubWorkflowPayloadResolver(_0x17beae);
    if (!_0x18c51a) throw new Error('Unsupported RunningHub workflow payloadResolver: ' + _0x17beae);
    return _0x18c51a({
      executionManifest: _0x342af3,
      payload: _0x117586,
      finalPrompt: _0x4616f3,
      apiKey: _0x12837a,
      ctx: _0x3f18a8,
      helpers: getRunningHubWorkflowResolverHelpers(),
    });
  }
  const _0x309d7f = await buildRunningHubNodeInfoListFromManifest({
    mapping: _0x79380,
    payload: _0x117586,
    finalPrompt: _0x4616f3,
    apiKey: _0x12837a,
    ctx: _0x3f18a8,
  });
  if (!_0x309d7f) return null;
  if (_0x342af3.submitMode === 'openapi-v2-ai-app')
    return buildOpenApiVideoWorkflowRequest({
      executionManifest: _0x342af3,
      payload: _0x117586,
      apiKey: _0x12837a,
      nodeInfoList: _0x309d7f,
    });
  if (_0x342af3.submitMode === 'runninghub-task-create')
    return buildTaskCreateVideoWorkflowRequest({
      executionManifest: _0x342af3,
      payload: _0x117586,
      apiKey: _0x12837a,
      nodeInfoList: _0x309d7f,
    });
  throw new Error('Unsupported RunningHub video workflow submitMode: ' + _0x342af3.submitMode);
}
export async function buildImageRequest(_0x222bde, _0x350e0c, _0x96ad51) {
  if (!_0x222bde.model) throw new Error('未指定模型，无法发起图像生成请求');
  const _0x3b65bc = _0x96ad51.getProviderConfig('runninghubwf'),
    _0x159889 = _0x3b65bc.apiKey || _0x222bde.apiKey;
  if (!_0x159889) throw new Error('API Key 未配置，无法发起 RunningHUB 请求');
  const _0xaebfab = _0x96ad51.processInputImagesPreserveOrder || _0x96ad51.processInputImages,
    _0x336b3b = await _0xaebfab(_0x222bde.inputUrls, _0x159889, {
      applyInputQualityProfile: true,
      provider: 'runninghub',
    }),
    _0x3d3a27 = Array.isArray(_0x336b3b) ? _0x336b3b.map((_0x47cbbe) => String(_0x47cbbe || '').trim()) : [],
    _0x12179e = resolveModelExecution(_0x222bde.model),
    _0x591a85 = await buildOpenApiAiAppWorkflowRequestFromManifest({
      executionManifest: _0x12179e?.executionManifest,
      payload: _0x222bde,
      finalPrompt: _0x350e0c,
      finalUrls: _0x3d3a27,
      apiKey: _0x159889,
      ctx: _0x96ad51,
    });
  if (_0x591a85) return _0x591a85;
  throw new Error('RunningHub workflow manifest missing: ' + _0x222bde.model);
}
export async function buildVideoRequest(_0x3509fd, _0x2da839, _0x524480) {
  const _0x364498 = _0x524480.getProviderConfig('runninghubwf'),
    _0x4149b5 = _0x3509fd.apiKey || _0x364498.apiKey;
  if (!_0x4149b5) throw new Error('API Key 未配置，无法发起 RunningHUB 视频生成请求');
  const _0xf710e3 = resolveModelExecution(_0x3509fd.model),
    _0x5fbe28 = await buildVideoWorkflowRequestFromManifest({
      executionManifest: _0xf710e3?.executionManifest,
      payload: _0x3509fd,
      finalPrompt: _0x2da839,
      apiKey: _0x4149b5,
      ctx: _0x524480,
    });
  if (_0x5fbe28) return _0x5fbe28;
  throw new Error('RunningHub video workflow manifest missing: ' + _0x3509fd.model);
}
export async function buildModelRequest(_0x2a4514, _0x1bdf33, _0x40ebd7) {
  const _0x29afad = await buildImageRequestFromManifest(_0x2a4514, _0x1bdf33, _0x40ebd7, {
    expectedProvider: 'runninghub',
  });
  if (_0x29afad) return _0x29afad;
  throw new Error('RunningHub model API manifest missing: ' + _0x2a4514.model);
}
