import { generateVideo, resumeAsyncVideoTask, resumeRunningHubVideoTask } from '../../../api/aiVideoApi.js';
import {
  cancelTask as cancelTask_2,
  resumeTask as resumeTask_2,
  submitTask as submitTask_2,
} from '../../core/generationTaskRuntime.js';
import {
  createGenerationResumePlan,
  createGenerationSubmitPlan,
} from '../../core/generationExecutionPlan.js';
import { getTaskMessage, resolveGenerationUiState } from '../../core/generationTaskUiState.js';
import {
  buildVideoGenerationResultPatch,
  normalizeVideoGenerationResult,
} from '../../components/video-node/videoGenerationResultRenderer.js';
import { resolveModelExecution, sanitizeModelUiSchemaParams } from '../../manifests/index.js';
import { getGenerationInputRatioMediaSize } from '../generationRatioSource.js';
import { applyVideoAdaptiveAspectRatio } from '../videoAspectRatioExecution.js';
import { getFixedInputSlotConfigFromManifest } from '../fixedInputAssetRefs.js';
const MEDIA_KINDS = Object['freeze'](['image', 'video', 'audio']),
  RECOVERABLE_VIDEO_TASK_STATUSES = new Set(['pending', 'queued', 'recovering', 'running', 'submitting']);
function asObject(_0x3a9ba3) {
  return _0x3a9ba3 && typeof _0x3a9ba3 === 'object' && !Array['isArray'](_0x3a9ba3) ? _0x3a9ba3 : {};
}
function normalizeText(_0x181a63) {
  return String(_0x181a63 || '')['trim']();
}
function resolveStoryClipVideoExecution(_0x2fa6b2, _0x3510fa = '') {
  return resolveModelExecution(_0x2fa6b2) || resolveModelExecution(_0x2fa6b2, { providerHint: _0x3510fa });
}
function resolveStoryClipTaskTargetId(_0x32f264 = {}, _0x3cd429 = {}) {
  return (
    normalizeText(_0x32f264['targetId']) ||
    'story-clip:' +
      (normalizeText(_0x32f264['projectId']) || 'project') +
      ':' +
      (normalizeText(_0x32f264['episodeId']) || 'episode') +
      ':' +
      (normalizeText(_0x3cd429['id']) || 'clip')
  );
}
export function getRecoverableStoryClipVideoTask(_0xc3fb4 = {}) {
  const _0x3f3b66 = asObject(_0xc3fb4?.['generation']),
    _0x375f6a = normalizeText(_0x3f3b66['status'])['toLowerCase'](),
    _0x260a5d = normalizeText(_0x3f3b66['taskId']),
    _0x14a28c = normalizeText(_0x3f3b66['modelId'] || _0xc3fb4?.['modelId']);
  if (!RECOVERABLE_VIDEO_TASK_STATUSES['has'](_0x375f6a) || !_0x260a5d || !_0x14a28c) return null;
  const _0xf82c6a = normalizeText(_0x3f3b66['providerProfileId'] || _0xc3fb4?.['providerProfileId']);
  return {
    status: _0x375f6a,
    taskId: _0x260a5d,
    modelId: _0x14a28c,
    provider: normalizeText(_0x3f3b66['provider'] || _0xc3fb4?.['provider']),
    ...(_0xf82c6a ? { providerProfileId: _0xf82c6a } : {}),
    executionId: normalizeText(_0x3f3b66['executionId']),
    startedAt: Number(_0x3f3b66['startedAt'] || 0x0),
    ...(_0x3f3b66['useOpenapiQuery'] === !![] ? { useOpenapiQuery: !![] } : {}),
  };
}
async function resumeVideoGenerationTask(_0x4808c7, _0x10ca56, _0x20bdfd = {}) {
  const _0x3cd4c7 = resolveStoryClipVideoExecution(_0x10ca56?.['model'], _0x10ca56?.['provider']),
    _0x2f411b = _0x3cd4c7?.['modelManifest']
      ? {
          ..._0x10ca56,
          model: _0x3cd4c7['modelManifest']['modelId'],
          provider: _0x3cd4c7['modelManifest']['provider'],
        }
      : _0x10ca56;
  if (_0x3cd4c7?.['executionManifest']?.['adapterType'] === 'workflow')
    return resumeRunningHubVideoTask(_0x4808c7, _0x2f411b, _0x20bdfd);
  return resumeAsyncVideoTask(_0x4808c7, _0x2f411b, _0x20bdfd);
}
function isAsyncStoryClipVideoExecution(_0x25e528, _0xf20773) {
  return (
    _0xf20773?.['adapterType'] === 'modelApi' &&
    (_0x25e528?.['async'] === !![] || Boolean(_0xf20773?.['extensions']?.['taskPolling']))
  );
}
function normalizeInputItem(_0x4ccdcc, _0x7bdf3b, _0x45ae0a) {
  const _0x17f589 = typeof _0x4ccdcc === 'string' ? { url: _0x4ccdcc } : asObject(_0x4ccdcc),
    _0x2ff208 = normalizeText(
      _0x17f589['url'] ||
        _0x17f589['localUrl'] ||
        _0x17f589['imageUrl'] ||
        _0x17f589['videoUrl'] ||
        _0x17f589['audioUrl'] ||
        _0x17f589['localPath'],
    );
  if (!_0x2ff208)
    throw new Error('片段视频的第\x20' + (_0x45ae0a + 0x1) + '\x20个' + _0x7bdf3b + '输入缺少可用地址');
  return {
    ..._0x17f589,
    kind: _0x7bdf3b,
    url: _0x2ff208,
    slotId: normalizeText(_0x17f589['slotId'] || _0x17f589['refSlot']),
  };
}
function normalizeInputs(_0xddd34e = {}) {
  const _0xc756 = asObject(_0xddd34e);
  return Object['fromEntries'](
    MEDIA_KINDS['map']((_0x6a4488) => {
      const _0x2b1953 = _0x6a4488 + 's',
        _0xee7dc3 = _0xc756[_0x6a4488] ?? _0xc756[_0x2b1953] ?? [],
        _0x1feea8 = Array['isArray'](_0xee7dc3) ? _0xee7dc3 : _0xee7dc3 ? [_0xee7dc3] : [];
      return [
        _0x6a4488,
        _0x1feea8['map']((_0x1ad029, _0x1b79da) => normalizeInputItem(_0x1ad029, _0x6a4488, _0x1b79da)),
      ];
    }),
  );
}
function mergePromptAssetInputRefs(_0x45bf03 = {}, _0x28f244 = []) {
  const _0x17e4aa = normalizeInputs(_0x45bf03),
    _0xb76f56 = new Set(
      MEDIA_KINDS['flatMap']((_0x89d0b0) =>
        _0x17e4aa[_0x89d0b0]['map']((_0x86cdb2) => _0x89d0b0 + ':' + normalizeText(_0x86cdb2['url'])),
      ),
    );
  return (
    (Array['isArray'](_0x28f244) ? _0x28f244 : [])['forEach']((_0x2f37c8, _0x5b6777) => {
      const _0x3ca01b = normalizeText(_0x2f37c8?.['type'] || _0x2f37c8?.['kind']);
      if (!MEDIA_KINDS['includes'](_0x3ca01b)) return;
      const _0x247216 = normalizeInputItem(_0x2f37c8, _0x3ca01b, _0x5b6777),
        _0x20e918 = _0x3ca01b + ':' + _0x247216['url'];
      if (_0xb76f56['has'](_0x20e918)) return;
      (_0xb76f56['add'](_0x20e918),
        _0x17e4aa[_0x3ca01b]['push']({
          ..._0x247216,
          slotId: normalizeText(_0x2f37c8?.['refSlot'] || _0x2f37c8?.['slotId']),
        }));
    }),
    _0x17e4aa
  );
}
function resolveKindLimit(_0x16918f, _0x33e882) {
  const _0x243dbf = Number(_0x16918f?.['maxByKind']?.[_0x33e882]);
  if (Number['isFinite'](_0x243dbf)) return Math['max'](0x0, Math['trunc'](_0x243dbf));
  const _0x2ef087 = (_0x16918f?.['fixedSlots'] || [])['filter'](
    (_0x53e00c) => normalizeText(_0x53e00c?.['kind']) === _0x33e882,
  )['length'];
  return _0x2ef087 > 0x0 ? _0x2ef087 : Number['POSITIVE_INFINITY'];
}
function assignFixedSlots(_0x4f4dbf, _0x5da0f8, _0x47fcc8, _0xf73ce5 = {}) {
  const _0x25db3d = Array['isArray'](_0x5da0f8?.['fixedSlots'])
      ? [..._0x5da0f8['fixedSlots']]['sort'](
          (_0x45c722, _0x21d50e) =>
            Number(_0x45c722?.['displayOrder'] || 0x0) - Number(_0x21d50e?.['displayOrder'] || 0x0),
        )
      : [],
    _0x488662 = _0x25db3d['some']((_0x267042) => _0x267042?.['showWhen'] || _0x267042?.['hideWhen']),
    _0x40a9a6 = _0x488662 ? getFixedInputSlotConfigFromManifest(_0xf73ce5, { manifest: _0x4f4dbf }) : null,
    _0x3645c4 = _0x488662
      ? new Set(_0x40a9a6?.['visibleSlots'] || [])
      : new Set(_0x25db3d['map']((_0x384fdd) => normalizeText(_0x384fdd?.['id']))['filter'](Boolean)),
    _0x1166bc = _0x25db3d['filter']((_0x107b4e) => _0x3645c4['has'](normalizeText(_0x107b4e?.['id']))),
    _0xff22ee = new Map(
      _0x25db3d['map']((_0x18e7bb) => [normalizeText(_0x18e7bb?.['id']), _0x18e7bb])['filter'](
        ([_0x7441a]) => _0x7441a,
      ),
    ),
    _0x4d6162 = new Map();
  for (const _0x1ba483 of MEDIA_KINDS) {
    for (const _0x23c13c of _0x47fcc8[_0x1ba483]) {
      if (!_0x23c13c['slotId']) continue;
      const _0x5a0f23 = _0xff22ee['get'](_0x23c13c['slotId']);
      if (!_0x5a0f23) throw new Error('视频模型未声明输入槽“' + _0x23c13c['slotId'] + '”');
      if (normalizeText(_0x5a0f23['kind']) !== _0x1ba483)
        throw new Error(
          '输入槽“' + _0x23c13c['slotId'] + '”只接受 ' + _0x5a0f23['kind'] + '，不能接收\x20' + _0x1ba483,
        );
      if (_0x4d6162['has'](_0x23c13c['slotId']))
        throw new Error('输入槽“' + _0x23c13c['slotId'] + '”只能接入一个素材');
      _0x4d6162['set'](_0x23c13c['slotId'], _0x23c13c);
    }
  }
  for (const _0x241d85 of MEDIA_KINDS) {
    const _0x335822 = _0x1166bc['filter'](
      (_0x593246) =>
        normalizeText(_0x593246?.['kind']) === _0x241d85 &&
        !_0x4d6162['has'](normalizeText(_0x593246?.['id'])),
    );
    for (const _0x12cf9a of _0x47fcc8[_0x241d85]) {
      if (_0x12cf9a['slotId']) continue;
      const _0x5db6ec = _0x335822['shift']();
      if (_0x5db6ec) _0x4d6162['set'](normalizeText(_0x5db6ec['id']), _0x12cf9a);
    }
  }
  for (const _0x514ce6 of _0x1166bc) {
    const _0x147537 = normalizeText(_0x514ce6?.['id']);
    if (_0x514ce6?.['required'] === !![] && _0x147537 && !_0x4d6162['has'](_0x147537))
      throw new Error('视频模型缺少必需输入：' + (normalizeText(_0x514ce6['label']) || _0x147537));
  }
  for (const _0x2ca6f of _0x5da0f8?.['exclusiveGroups'] || []) {
    const _0x49c6b9 = Array['isArray'](_0x2ca6f?.['slots'])
      ? _0x2ca6f['slots']['map'](normalizeText)['filter']((_0x3eb148) => _0x3645c4['has'](_0x3eb148))
      : [];
    if (_0x49c6b9['length'] === 0x0) continue;
    const _0x410b20 = _0x49c6b9['filter']((_0x53837e) => _0x4d6162['has'](_0x53837e))['length'],
      _0x5217ff = Number(_0x2ca6f?.['min']),
      _0x21f9c8 = Number(_0x2ca6f?.['max']),
      _0x4d2db5 = normalizeText(_0x2ca6f?.['label'] || _0x2ca6f?.['id']) || '互斥输入组';
    if (Number['isFinite'](_0x5217ff) && _0x410b20 < _0x5217ff)
      throw new Error(_0x4d2db5 + '至少需要 ' + Math['max'](0x0, Math['trunc'](_0x5217ff)) + ' 个输入');
    if (Number['isFinite'](_0x21f9c8) && _0x410b20 > _0x21f9c8)
      throw new Error(_0x4d2db5 + '最多允许 ' + Math['max'](0x0, Math['trunc'](_0x21f9c8)) + ' 个输入');
  }
  return _0x4d6162;
}
export function validateStoryClipVideoInputs(_0x16c9b0, _0x25ff04 = {}, _0x3ee333 = {}) {
  const _0x59bbfa = asObject(_0x16c9b0?.['inputSlots']),
    _0x4ca51a = new Set(
      (Array['isArray'](_0x59bbfa['allowedKinds']) ? _0x59bbfa['allowedKinds'] : [])
        ['map'](normalizeText)
        ['filter'](Boolean),
    ),
    _0x37cd8f = normalizeInputs(_0x25ff04);
  for (const _0x38e56b of MEDIA_KINDS) {
    const _0x643ae3 = _0x37cd8f[_0x38e56b]['length'];
    if (_0x643ae3 > 0x0 && !_0x4ca51a['has'](_0x38e56b))
      throw new Error(
        '视频模型“' + (_0x16c9b0?.['displayName'] || _0x16c9b0?.['modelId']) + '”不支持' + _0x38e56b + '输入',
      );
    const _0x29d210 = resolveKindLimit(_0x59bbfa, _0x38e56b);
    if (_0x643ae3 > _0x29d210) {
      if (_0x38e56b === 'audio')
        throw new Error('参考音频不能超过\x20' + _0x29d210 + ' 个，当前为 ' + _0x643ae3 + '\x20个');
      throw new Error(
        '视频模型“' +
          (_0x16c9b0?.['displayName'] || _0x16c9b0?.['modelId']) +
          '”最多支持\x20' +
          _0x29d210 +
          '\x20个' +
          _0x38e56b +
          '输入，当前为\x20' +
          _0x643ae3 +
          '\x20个',
      );
    }
    const _0x335d0c = Number(_0x59bbfa?.['minByKind']?.[_0x38e56b]);
    if (Number['isFinite'](_0x335d0c) && _0x643ae3 < _0x335d0c)
      throw new Error(
        '视频模型“' +
          (_0x16c9b0?.['displayName'] || _0x16c9b0?.['modelId']) +
          '”至少需要 ' +
          Math['max'](0x0, Math['trunc'](_0x335d0c)) +
          '\x20个' +
          _0x38e56b +
          '输入',
      );
  }
  return { inputs: _0x37cd8f, assignedSlots: assignFixedSlots(_0x16c9b0, _0x59bbfa, _0x37cd8f, _0x3ee333) };
}
function assignSlotPayloadFields(_0x497985, _0x3e848b) {
  const _0x5ca4ad = {};
  for (const [_0x2ed212, _0x119a1f] of _0x3e848b['entries']()) {
    ((_0x5ca4ad[_0x2ed212] = _0x119a1f['url']), (_0x497985[_0x2ed212] = _0x119a1f['url']));
    if (!_0x2ed212['toLowerCase']()['endsWith']('url')) _0x497985[_0x2ed212 + 'Url'] = _0x119a1f['url'];
  }
  if (Object['keys'](_0x5ca4ad)['length'] > 0x0) _0x497985['inputUrlsBySlot'] = _0x5ca4ad;
}
export function buildStoryClipVideoPayload({
  modelId: _0x284ea3,
  provider: provider = '',
  prompt: prompt = '',
  generationParams: generationParams = {},
  inputs: inputs = {},
  assetInputRefs: assetInputRefs = [],
  installId: installId = '',
  providerProfileId: providerProfileId = '',
} = {}) {
  const _0x354f28 = resolveStoryClipVideoExecution(_0x284ea3, provider);
  if (!_0x354f28?.['modelManifest'] || !_0x354f28?.['executionManifest'])
    throw new Error(
      '视频模型缺少 manifest 或 execution manifest：' + (normalizeText(_0x284ea3) || '(empty)'),
    );
  const { modelManifest: _0x503367, executionManifest: _0x5ba409 } = _0x354f28;
  if (_0x503367['kind'] !== 'video' || _0x5ba409['kind'] !== 'video')
    throw new Error('模型“' + _0x503367['modelId'] + '”不是视频生成模型');
  const _0x5a5a17 = sanitizeModelUiSchemaParams(_0x503367['modelId'], generationParams),
    _0x588c88 = validateStoryClipVideoInputs(_0x503367, mergePromptAssetInputRefs(inputs, assetInputRefs), {
      generationParams: _0x5a5a17,
    }),
    _0x483ae6 = _0x588c88['inputs']['image']['map']((_0x3567a5) => _0x3567a5['url']),
    _0x5d310b = _0x588c88['inputs']['video']['map']((_0x20ca37) => _0x20ca37['url']),
    _0x3d1e11 = _0x588c88['inputs']['audio']['map']((_0x2ee907) => _0x2ee907['url']),
    _0x1753ac = {
      ..._0x5a5a17,
      prompt: String(prompt || ''),
      model: _0x503367['modelId'],
      provider: _0x503367['provider'],
      generationParams: { ..._0x5a5a17 },
      images: _0x483ae6,
      videos: _0x5d310b,
      audios: _0x3d1e11,
      inputUrls: _0x483ae6,
      inputImages: _0x483ae6,
      inputVideos: _0x5d310b,
      inputAudios: _0x3d1e11,
    };
  _0x483ae6[0x0] &&
    ((_0x1753ac['image'] = _0x483ae6[0x0]),
    (_0x1753ac['imageUrl'] = _0x483ae6[0x0]),
    (_0x1753ac['refImageUrl'] = _0x483ae6[0x0]));
  if (_0x5d310b[0x0]) _0x1753ac['videoUrl'] = _0x5d310b[0x0];
  if (_0x3d1e11[0x0]) _0x1753ac['audioUrl'] = _0x3d1e11[0x0];
  if (normalizeText(installId)) _0x1753ac['installId'] = normalizeText(installId);
  normalizeText(providerProfileId) && (_0x1753ac['providerProfileId'] = normalizeText(providerProfileId));
  assignSlotPayloadFields(_0x1753ac, _0x588c88['assignedSlots']);
  const _0x59fd26 = getGenerationInputRatioMediaSize(_0x588c88['inputs'], _0x503367);
  return (
    applyVideoAdaptiveAspectRatio(_0x1753ac, {
      nodeData: { generationParams: _0x5a5a17 },
      modelManifest: _0x503367,
      provider: _0x503367['provider'],
      model: _0x503367['modelId'],
      sourceWidth: _0x59fd26?.['width'] || 0x0,
      sourceHeight: _0x59fd26?.['height'] || 0x0,
    }),
    { payload: _0x1753ac, modelManifest: _0x503367, executionManifest: _0x5ba409 }
  );
}
function getResultKey(_0x16d823) {
  return normalizeText(
    _0x16d823?.['localPath'] ||
      _0x16d823?.['videoUrl'] ||
      _0x16d823?.['displayLocalPath'] ||
      _0x16d823?.['thumbId'] ||
      _0x16d823?.['thumbUrl'],
  );
}
function appendVideoResults(_0x3a0a5a = [], _0x1ed503 = []) {
  const _0x5001ac = Array['isArray'](_0x3a0a5a) ? _0x3a0a5a['map']((_0x413633) => ({ ..._0x413633 })) : [],
    _0x5afa9e = new Set(_0x5001ac['map'](getResultKey)['filter'](Boolean));
  for (const _0x1b8890 of _0x1ed503) {
    const _0x1a9067 = getResultKey(_0x1b8890);
    if (_0x1a9067 && _0x5afa9e['has'](_0x1a9067)) continue;
    _0x5001ac['push']({ ..._0x1b8890 });
    if (_0x1a9067) _0x5afa9e['add'](_0x1a9067);
  }
  return _0x5001ac;
}
function mapRuntimeStatus(_0x4c6382) {
  const _0x2a4efc = resolveGenerationUiState(_0x4c6382);
  if (_0x2a4efc === 'error') return 'failed';
  if (_0x2a4efc === 'submitting' || _0x2a4efc === 'recovering') return 'running';
  return _0x2a4efc;
}
function isShallowRecordEqual(_0x6622a4 = {}, _0x18a9bb = {}) {
  const _0x359f06 = Object['keys'](_0x6622a4),
    _0x357dd7 = Object['keys'](_0x18a9bb);
  return (
    _0x359f06['length'] === _0x357dd7['length'] &&
    _0x359f06['every']((_0x3d6d38) => Object['is'](_0x6622a4[_0x3d6d38], _0x18a9bb[_0x3d6d38]))
  );
}
export function createStoryClipTaskStoreAdapter({
  targetId: _0x51d0e7,
  getClip: _0x364a5d,
  updateClip: _0x53fe53,
  initialTaskNode: initialTaskNode = {},
} = {}) {
  const _0xad75bb = normalizeText(_0x51d0e7);
  if (!_0xad75bb) throw new Error('story clip task store requires targetId');
  if (typeof _0x364a5d !== 'function' || typeof _0x53fe53 !== 'function')
    throw new Error('story clip task store requires getClip() and updateClip()');
  let _0x16dab7 = { id: _0xad75bb, type: 'story-clip-video-task', ...initialTaskNode };
  const _0xb1f656 = (_0x456b29 = {}) => {
    _0x16dab7 = { ..._0x16dab7, ..._0x456b29 };
    const _0x5410aa = asObject(_0x364a5d()),
      _0x36a212 = asObject(_0x5410aa['generation']),
      _0x34e459 = asObject(_0x5410aa['video']),
      _0x30dd7f = Array['isArray'](_0x456b29['videos'])
        ? normalizeVideoGenerationResult({ videos: _0x456b29['videos'] })['items']
        : [],
      _0x236b5d =
        _0x30dd7f['length'] > 0x0
          ? appendVideoResults(_0x34e459['results'], _0x30dd7f)
          : Array['isArray'](_0x34e459['results'])
            ? _0x34e459['results']
            : [],
      _0x39db27 =
        _0x30dd7f['length'] > 0x0
          ? Math['max'](0x0, _0x236b5d['length'] - 0x1)
          : Number(_0x34e459['activeIndex'] || 0x0),
      _0x39cb85 = {
        ..._0x36a212,
        status: mapRuntimeStatus(_0x16dab7),
        taskId: normalizeText(_0x16dab7['rhTaskId'] || _0x16dab7['asyncTaskId'] || _0x16dab7['taskId']),
        provider: normalizeText(_0x16dab7['taskProvider'] || _0x16dab7['provider']),
        providerProfileId: normalizeText(_0x16dab7['providerProfileId']),
        modelId: normalizeText(_0x16dab7['taskModelId'] || _0x16dab7['model']),
        executionId: normalizeText(_0x16dab7['taskExecutionId']),
        useOpenapiQuery: _0x16dab7['rhTaskUseOpenapiQuery'] === !![],
        startedAt: Number(_0x16dab7['generationStartTime'] || 0x0),
        duration:
          _0x16dab7['generationDuration'] === null || _0x16dab7['generationDuration'] === undefined
            ? null
            : Number(_0x16dab7['generationDuration']),
        error: mapRuntimeStatus(_0x16dab7) === 'failed' ? getTaskMessage(_0x16dab7) : '',
      },
      _0x294a6d = { ..._0x34e459, results: _0x236b5d, activeIndex: _0x39db27 };
    if (isShallowRecordEqual(_0x36a212, _0x39cb85) && isShallowRecordEqual(_0x34e459, _0x294a6d)) return ![];
    return (_0x53fe53({ ..._0x5410aa, generation: _0x39cb85, video: _0x294a6d }), !![]);
  };
  return {
    getState: () => ({ nodes: { [_0xad75bb]: _0x16dab7 } }),
    getStateRaw: () => ({ nodes: { [_0xad75bb]: _0x16dab7 } }),
    updateNodeData(_0x25959b, _0x1afeff) {
      if (normalizeText(_0x25959b) !== _0xad75bb)
        throw new Error('unknown story clip task target: ' + _0x25959b);
      _0xb1f656(_0x1afeff);
    },
    addNode(_0x5ab442) {
      if (normalizeText(_0x5ab442?.['id']) !== _0xad75bb)
        throw new Error('invalid story clip task node: ' + (_0x5ab442?.['id'] || ''));
      _0x16dab7 = { ..._0x16dab7, ..._0x5ab442 };
    },
  };
}
export function createStoryClipGenerationController({
  getClip: _0xe05d3d,
  updateClip: _0x4ca72a,
  submitTask: submitTask = submitTask_2,
  resumeTask: resumeTask = resumeTask_2,
  cancelTask: cancelTask = cancelTask_2,
  runVideoGeneration: runVideoGeneration = generateVideo,
  resumeVideoGeneration: resumeVideoGeneration = resumeVideoGenerationTask,
} = {}) {
  if (typeof _0xe05d3d !== 'function' || typeof _0x4ca72a !== 'function')
    throw new Error('story\x20clip\x20generation\x20requires\x20getClip()\x20and\x20updateClip()');
  let _0x49e73f = null;
  async function _0x54a77b(_0x4ad7da = {}) {
    if (_0x49e73f) throw new Error('当前片段已有视频生成任务正在运行');
    const _0x3e5d92 = asObject(_0xe05d3d()),
      _0xfd8463 = resolveStoryClipTaskTargetId(_0x4ad7da, _0x3e5d92),
      _0x41f3ee = buildStoryClipVideoPayload({
        ..._0x4ad7da,
        prompt: _0x4ad7da['prompt'] ?? _0x3e5d92['prompt'],
      }),
      _0x497b98 = createStoryClipTaskStoreAdapter({
        targetId: _0xfd8463,
        getClip: _0xe05d3d,
        updateClip: _0x4ca72a,
        initialTaskNode: {
          model: _0x41f3ee['modelManifest']['modelId'],
          provider: _0x41f3ee['modelManifest']['provider'],
          taskModelId: _0x41f3ee['modelManifest']['modelId'],
          taskProvider: _0x41f3ee['modelManifest']['provider'],
          taskExecutionId: _0x41f3ee['executionManifest']['id'],
          adapterType: _0x41f3ee['executionManifest']['adapterType'],
          providerProfileId: normalizeText(_0x41f3ee['payload']['providerProfileId']),
        },
      }),
      _0xe2be0a = new AbortController();
    _0x49e73f = {
      targetId: _0xfd8463,
      store: _0x497b98,
      abortController: _0xe2be0a,
      modelManifest: _0x41f3ee['modelManifest'],
    };
    const _0x181e9b = isAsyncStoryClipVideoExecution(
      _0x41f3ee['modelManifest'],
      _0x41f3ee['executionManifest'],
    );
    let _0x5cc1e2 = ![];
    const _0x5115e0 = createGenerationSubmitPlan({
      kind: 'video',
      sourceNodeId: _0xfd8463,
      targetNodeId: _0xfd8463,
      trigger: 'story-workspace',
      completionFeedback: ![],
      taskType: 'story-clip-video-generation',
      provider: _0x41f3ee['modelManifest']['provider'],
      adapterType: _0x41f3ee['executionManifest']['adapterType'],
      modelId: _0x41f3ee['modelManifest']['modelId'],
      executionId: _0x41f3ee['executionManifest']['id'],
      payload: _0x41f3ee['payload'],
      cancellable: _0x41f3ee['modelManifest']['cancellable'] === !![],
      resumable: _0x181e9b || _0x41f3ee['executionManifest']['adapterType'] === 'workflow',
      pauseOnAbort: 'afterTaskId',
      async: _0x181e9b,
      submit: (_0x1b4b87, _0x53b419 = {}) =>
        runVideoGeneration(_0x1b4b87, {
          signal: _0x53b419['signal'],
          runningHubWorkflowQueueLease: _0x53b419['runningHubWorkflowQueueLease'],
          onRunningHubWorkflowQueueChange: _0x53b419['onRunningHubWorkflowQueueChange'],
          onTaskId: (_0x1c1e07) => {
            (_0x53b419['onTaskId']?.(_0x1c1e07),
              _0x5cc1e2 && _0x53b419['updateTaskNode']?.({ rhTaskUseOpenapiQuery: !![] }));
          },
          onTaskMeta: ({ taskId: _0x2e184c, useOpenapiQuery: _0x5be382 } = {}) => {
            ((_0x5cc1e2 = _0x5be382 === !![]),
              _0x53b419['onTaskId']?.(_0x2e184c),
              _0x53b419['updateTaskNode']?.({ rhTaskUseOpenapiQuery: _0x5cc1e2 }));
          },
        }),
      resultBuilder: (_0x476da7, _0x184c30) =>
        buildVideoGenerationResultPatch(normalizeVideoGenerationResult(_0x476da7), {
          startedAt: _0x184c30['startedAt'],
          duration: Date['now']() - _0x184c30['startedAt'],
        }),
      failureBuilder: (_0x1ac556) => ({ jobError: normalizeText(_0x1ac556?.['message']) || '视频生成失败' }),
    });
    try {
      const _0x1adfee = await submitTask(_0x5115e0, { store: _0x497b98, abortController: _0xe2be0a });
      if (_0x1adfee?.['status'] !== 'pending' && _0x49e73f?.['targetId'] === _0xfd8463) _0x49e73f = null;
      return _0x1adfee;
    } catch (_0x1f685f) {
      if (_0x49e73f?.['targetId'] === _0xfd8463) _0x49e73f = null;
      throw _0x1f685f;
    }
  }
  async function _0x5cc38c(_0x40037c = {}) {
    if (_0x49e73f) throw new Error('当前片段已有视频生成任务正在运行');
    const _0x269f8d = asObject(_0xe05d3d()),
      _0x575460 = {
        ...(getRecoverableStoryClipVideoTask(_0x269f8d) || {}),
        ...(_0x40037c['taskId'] ? { taskId: normalizeText(_0x40037c['taskId']) } : {}),
        ...(_0x40037c['modelId'] ? { modelId: normalizeText(_0x40037c['modelId']) } : {}),
        ...(_0x40037c['provider'] ? { provider: normalizeText(_0x40037c['provider']) } : {}),
        ...(_0x40037c['providerProfileId']
          ? { providerProfileId: normalizeText(_0x40037c['providerProfileId']) }
          : {}),
        ...(_0x40037c['executionId'] ? { executionId: normalizeText(_0x40037c['executionId']) } : {}),
        ...(_0x40037c['startedAt'] ? { startedAt: Number(_0x40037c['startedAt']) } : {}),
        ...(_0x40037c['useOpenapiQuery'] === !![] ? { useOpenapiQuery: !![] } : {}),
      };
    if (!_0x575460['taskId']) throw new Error('片段视频任务缺少 taskId，无法恢复轮询');
    if (!_0x575460['modelId']) throw new Error('片段视频任务缺少 modelId，无法恢复轮询');
    const _0x2e89a9 = resolveStoryClipVideoExecution(_0x575460['modelId'], _0x575460['provider']);
    if (!_0x2e89a9?.['modelManifest'] || !_0x2e89a9?.['executionManifest'])
      throw new Error('视频模型缺少\x20manifest\x20或\x20execution\x20manifest：' + _0x575460['modelId']);
    const { modelManifest: _0x5f2bf4, executionManifest: _0x42990c } = _0x2e89a9;
    if (_0x5f2bf4['kind'] !== 'video' || _0x42990c['kind'] !== 'video')
      throw new Error('模型“' + _0x5f2bf4['modelId'] + '”不是视频生成模型');
    const _0x444591 = isAsyncStoryClipVideoExecution(_0x5f2bf4, _0x42990c),
      _0xe3db69 = _0x42990c['adapterType'] === 'workflow';
    if (!_0x444591 && !_0xe3db69) throw new Error('视频模型“' + _0x5f2bf4['modelId'] + '”不支持恢复异步任务');
    const _0x32aa03 = resolveStoryClipTaskTargetId(_0x40037c, _0x269f8d),
      _0x5e3cb5 = Number(_0x575460['startedAt'] || Date['now']()),
      _0x144f19 = {
        model: _0x5f2bf4['modelId'],
        provider: _0x5f2bf4['provider'],
        ...(_0x575460['providerProfileId'] ? { providerProfileId: _0x575460['providerProfileId'] } : {}),
      },
      _0x165bd3 = createStoryClipTaskStoreAdapter({
        targetId: _0x32aa03,
        getClip: _0xe05d3d,
        updateClip: _0x4ca72a,
        initialTaskNode: {
          model: _0x5f2bf4['modelId'],
          provider: _0x5f2bf4['provider'],
          taskModelId: _0x5f2bf4['modelId'],
          taskProvider: _0x5f2bf4['provider'],
          taskExecutionId: _0x42990c['id'],
          adapterType: _0x42990c['adapterType'],
          providerProfileId: _0x575460['providerProfileId'],
          generationStartTime: _0x5e3cb5,
          asyncTaskId: _0x575460['taskId'],
          asyncTaskStatus: 'running',
          asyncTaskStartedAt: _0x5e3cb5,
          asyncTaskProvider: _0x5f2bf4['provider'],
          asyncTaskKind: 'video',
          taskResumable: !![],
          rhTaskUseOpenapiQuery: _0x575460['useOpenapiQuery'] === !![],
        },
      }),
      _0x1bdf2c = new AbortController();
    _0x49e73f = {
      targetId: _0x32aa03,
      store: _0x165bd3,
      abortController: _0x1bdf2c,
      modelManifest: _0x5f2bf4,
    };
    const _0x63ddb9 = createGenerationResumePlan({
      kind: 'video',
      sourceNodeId: _0x32aa03,
      targetNodeId: _0x32aa03,
      trigger: 'story-workspace-recovery',
      completionFeedback: ![],
      taskType: 'story-clip-video-generation',
      provider: _0x5f2bf4['provider'],
      adapterType: _0x42990c['adapterType'],
      modelId: _0x5f2bf4['modelId'],
      executionId: _0x42990c['id'],
      payload: _0x144f19,
      taskId: _0x575460['taskId'],
      startedAt: _0x5e3cb5,
      cancellable: _0x5f2bf4['cancellable'] === !![],
      resumable: !![],
      pauseOnAbort: !![],
      async: _0x444591,
      poll: ({ taskId: _0x54e066, payload: _0x3f0726, signal: _0x131959 }) =>
        resumeVideoGeneration(_0x54e066, _0x3f0726, {
          signal: _0x131959,
          useOpenapiQuery: _0x575460['useOpenapiQuery'] === !![],
        }),
      resultBuilder: (_0x5c5590, _0x29e77b) =>
        buildVideoGenerationResultPatch(normalizeVideoGenerationResult(_0x5c5590), {
          startedAt: _0x29e77b['startedAt'],
          duration: Date['now']() - _0x29e77b['startedAt'],
        }),
      failureBuilder: (_0x5a81b9) => ({
        jobError: normalizeText(_0x5a81b9?.['message']) || '视频任务恢复失败',
      }),
    });
    try {
      const _0x3c54dd = await resumeTask(_0x63ddb9, {
        store: _0x165bd3,
        abortController: _0x1bdf2c,
        startedAt: _0x5e3cb5,
      });
      if (_0x3c54dd?.['status'] !== 'pending' && _0x49e73f?.['targetId'] === _0x32aa03) _0x49e73f = null;
      return _0x3c54dd;
    } catch (_0x54769a) {
      if (_0x49e73f?.['targetId'] === _0x32aa03) _0x49e73f = null;
      throw _0x54769a;
    }
  }
  async function _0xfa4662() {
    if (!_0x49e73f) return { ok: ![], reason: 'missing-target' };
    const _0x9f40a3 = _0x49e73f,
      _0x460c19 = await cancelTask(_0x9f40a3['targetId'], {
        store: _0x9f40a3['store'],
        cancellable: _0x9f40a3['modelManifest']?.['cancellable'] === !![],
        abortLocal: !![],
      });
    if (_0x460c19?.['ok'] && _0x49e73f?.['targetId'] === _0x9f40a3['targetId']) _0x49e73f = null;
    return _0x460c19;
  }
  function _0x336d7c() {
    if (!_0x49e73f) return { ok: ![], reason: 'missing-target' };
    const _0x548767 = _0x49e73f['targetId'];
    return (_0x49e73f['abortController']['abort'](), { ok: !![], status: 'pausing', targetId: _0x548767 });
  }
  return {
    generate: _0x54a77b,
    resume: _0x5cc38c,
    cancel: _0xfa4662,
    pause: _0x336d7c,
    getActiveTargetId: () => _0x49e73f?.['targetId'] || '',
  };
}
