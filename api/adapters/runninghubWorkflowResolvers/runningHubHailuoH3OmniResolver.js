import { translateMinimaxH3EditorAssetMentions } from '../minimaxH3Prompt.js';
import {
  appendRunningHubReferenceMediaInputs,
  normalizeRunningHubReferenceMediaUrls,
} from './runningHubReferenceMediaResolverShared.js';
const HAILUO_H3_DEFAULT_RATIO = '自适应',
  HAILUO_H3_DEFAULT_QUALITY = 'economy';
function getPlainObject(_0xd56944) {
  return _0xd56944 && typeof _0xd56944 === 'object' && !Array['isArray'](_0xd56944) ? _0xd56944 : {};
}
function getPayloadParam(_0x302681, _0x324a47, _0x4fd473) {
  const _0x1185eb = getPlainObject(_0x302681?.['generationParams']);
  if (Object['prototype']['hasOwnProperty']['call'](_0x1185eb, _0x324a47)) return _0x1185eb[_0x324a47];
  if (Object['prototype']['hasOwnProperty']['call'](_0x302681 || {}, _0x324a47)) return _0x302681[_0x324a47];
  return _0x4fd473;
}
function isAdaptiveRatio(_0x1dde07) {
  const _0x10b010 = String(_0x1dde07 || '')['trim'](),
    _0x3157b9 = _0x10b010['toLowerCase']();
  return (
    _0x10b010 === '自适应' || _0x3157b9 === 'auto' || _0x3157b9 === 'adaptive' || _0x3157b9 === 'default'
  );
}
function parseAspectRatio(_0x34b0d3, _0x2266ff = HAILUO_H3_DEFAULT_RATIO) {
  const _0x1ff935 = String(_0x34b0d3 || _0x2266ff)['trim'](),
    [_0x916e, _0x55d4e4] = _0x1ff935['split'](':'),
    _0x28430b = Number(_0x916e),
    _0xd63c93 = Number(_0x55d4e4);
  if (_0x28430b > 0x0 && _0xd63c93 > 0x0) return { widthRatio: _0x28430b, heightRatio: _0xd63c93 };
  if (_0x1ff935 !== _0x2266ff) return parseAspectRatio(_0x2266ff, HAILUO_H3_DEFAULT_RATIO);
  return { widthRatio: 0x10, heightRatio: 0x9 };
}
function roundToMultiple(_0x31125d, _0x1bbb8d) {
  const _0x354f4c = Number(_0x1bbb8d),
    _0x1f5365 = Number['isFinite'](_0x354f4c) && _0x354f4c > 0x0 ? _0x354f4c : 0x20;
  return Math['max'](_0x1f5365, Math['round'](Number(_0x31125d || 0x0) / _0x1f5365) * _0x1f5365);
}
function resolveAspectRatio(_0x5bd4d2, _0xfb8bca) {
  const _0x2b1fe0 = getPayloadParam(
    _0x5bd4d2,
    'aspectRatio',
    _0xfb8bca['defaultAspectRatio'] || HAILUO_H3_DEFAULT_RATIO,
  );
  if (!isAdaptiveRatio(_0x2b1fe0)) return _0x2b1fe0;
  return (
    _0x5bd4d2?.['resolvedRatioLabel'] ||
    _0x5bd4d2?.['generationParams']?.['resolvedRatioLabel'] ||
    _0xfb8bca['defaultAspectRatio'] ||
    HAILUO_H3_DEFAULT_RATIO
  );
}
export function resolveRunningHubHailuoH3OmniDimensions(_0x80bf1e = {}, _0x28f835 = {}) {
  const _0x3de779 = String(
      getPayloadParam(
        _0x80bf1e,
        'rhHailuoH3Quality',
        _0x28f835['defaultQuality'] || HAILUO_H3_DEFAULT_QUALITY,
      ),
    )['trim'](),
    _0x111c0e = getPlainObject(_0x28f835['qualityLongEdges']),
    _0x33f021 = Number(_0x111c0e[_0x28f835['defaultQuality'] || HAILUO_H3_DEFAULT_QUALITY]) || 0x3c0,
    _0xf0b8dc = Number(_0x111c0e[_0x3de779]) || _0x33f021,
    { widthRatio: _0x1df643, heightRatio: _0x2a0070 } = parseAspectRatio(
      resolveAspectRatio(_0x80bf1e, _0x28f835),
      _0x28f835['defaultAspectRatio'] || HAILUO_H3_DEFAULT_RATIO,
    ),
    _0x1f207e = Number(_0x28f835['dimensionMultiple']) || 0x20;
  if (_0x1df643 === _0x2a0070) return { width: _0xf0b8dc, height: _0xf0b8dc };
  if (_0x1df643 > _0x2a0070)
    return { width: _0xf0b8dc, height: roundToMultiple((_0xf0b8dc * _0x2a0070) / _0x1df643, _0x1f207e) };
  return { width: roundToMultiple((_0xf0b8dc * _0x1df643) / _0x2a0070, _0x1f207e), height: _0xf0b8dc };
}
function resolveSeconds(_0x42f248, _0x328119) {
  const _0x23b027 = Number(
      getPayloadParam(_0x42f248, 'duration', _0x328119['secondsNode']?.['defaultValue'] ?? 0x5),
    ),
    _0xf0096c = Number(_0x328119['secondsNode']?.['defaultValue']) || 0x5,
    _0x4fdb7b = Number(_0x328119['secondsNode']?.['min']) || 0x3,
    _0x4ee9d1 = Number(_0x328119['secondsNode']?.['max']) || 0xf,
    _0x5cf31f = Number['isFinite'](_0x23b027) ? _0x23b027 : _0xf0096c;
  return Math['round'](Math['max'](_0x4fdb7b, Math['min'](_0x4ee9d1, _0x5cf31f)));
}
function getFrameSources(_0x476903 = {}) {
  const _0x39d053 = getPlainObject(_0x476903['inputUrlsBySlot']),
    _0x2683fb = normalizeRunningHubReferenceMediaUrls(_0x476903['inputImages']),
    _0x1abc2c = String(_0x39d053['firstFrame'] || _0x476903['firstFrameUrl'] || '')['trim'](),
    _0x2ea2e6 = String(_0x39d053['lastFrame'] || _0x476903['lastFrameUrl'] || _0x476903['lastFrame'] || '')[
      'trim'
    ](),
    _0x35ae23 = Boolean(_0x1abc2c || _0x2ea2e6);
  return {
    firstFrame: _0x1abc2c || (!_0x35ae23 ? _0x2683fb[0x0] || '' : ''),
    lastFrame: _0x2ea2e6 || (!_0x35ae23 ? _0x2683fb[0x1] || '' : ''),
  };
}
function resolveReferenceModeValue(_0x5bdc06, _0xcf467) {
  const _0x8a933d = getPlainObject(_0xcf467['modeNode']),
    _0x430e9a = String(_0x8a933d['referenceModelField'] || '')['trim'](),
    _0x5b38c3 = String(_0x8a933d['referenceModelDefaultValue'] || 'ref2')['trim'](),
    _0x481f6d = _0x430e9a ? String(getPayloadParam(_0x5bdc06, _0x430e9a, _0x5b38c3))['trim']() : _0x5b38c3,
    _0x8d9956 = getPlainObject(_0x8a933d['referenceValueMap']);
  return _0x8d9956[_0x481f6d] ?? _0x8a933d['referenceValue'] ?? '2';
}
async function appendFrameInputs({
  mapping: _0x4426a7,
  payload: _0x47f36a,
  apiKey: _0x3beb49,
  ctx: _0x127696,
  helpers: _0x40e5dd,
  nodeInfoList: _0x5a3e49,
}) {
  const { firstFrame: _0x48fbfc, lastFrame: _0x100641 } = getFrameSources(_0x47f36a),
    _0x127c3e = [
      { slot: 'firstFrame', url: _0x48fbfc, loaderNode: _0x4426a7['imageLoaderNodes']?.[0x0] },
      { slot: 'lastFrame', url: _0x100641, loaderNode: _0x4426a7['imageLoaderNodes']?.[0x1] },
    ]['filter']((_0x44034d) => _0x44034d['url']);
  _0x127c3e['forEach']((_0x42ad5b) => {
    if (!_0x42ad5b['loaderNode']?.['nodeId'] || !_0x42ad5b['loaderNode']?.['fieldName'])
      throw new Error('海螺H3 工作流图片加载节点映射不完整');
  });
  const _0x52ffeb = await _0x40e5dd['uploadRunningHubMediaInputs'](
    'image',
    _0x127c3e['map']((_0x4a51b1) => _0x4a51b1['url']),
    _0x47f36a,
    _0x3beb49,
    _0x127696,
    { uploadFailedMessage: '首尾帧图片上传失败' },
  );
  _0x127c3e['forEach']((_0x3183af, _0x39b6c1) => {
    _0x40e5dd['pushManifestNode'](_0x5a3e49, _0x3183af['loaderNode'], _0x52ffeb[_0x39b6c1]);
  });
  if (_0x48fbfc && !_0x100641)
    _0x40e5dd['pushManifestNode'](
      _0x5a3e49,
      {
        nodeId: _0x4426a7['firstLastFrameNode']?.['nodeId'],
        fieldName: _0x4426a7['firstLastFrameNode']?.['lastFieldName'],
      },
      null,
    );
  else
    !_0x48fbfc &&
      _0x100641 &&
      _0x40e5dd['pushManifestNode'](
        _0x5a3e49,
        {
          nodeId: _0x4426a7['firstLastFrameNode']?.['nodeId'],
          fieldName: _0x4426a7['firstLastFrameNode']?.['firstFieldName'],
        },
        null,
      );
  return _0x127c3e['length'] > 0x0
    ? (_0x4426a7['modeNode']?.['frameValue'] ?? '1')
    : (_0x4426a7['modeNode']?.['textValue'] ?? '0');
}
async function appendReferenceInputs({
  mapping: _0xc99911,
  payload: _0x38cd29,
  apiKey: _0x3c1a3d,
  ctx: _0x3679b7,
  helpers: _0x216915,
  nodeInfoList: _0x45db3a,
}) {
  const _0x22efd7 = _0xc99911['referenceNode'] || {};
  return (
    await appendRunningHubReferenceMediaInputs({
      payload: _0x38cd29,
      apiKey: _0x3c1a3d,
      ctx: _0x3679b7,
      helpers: _0x216915,
      nodeInfoList: _0x45db3a,
      requiredTotal: 0x1,
      requiredTotalMessage: '海螺H3 全能参考模式至少需要一张图片、一个视频或一段音频',
      specs: [
        {
          kind: 'image',
          payloadField: 'inputImages',
          loaderNodes: _0xc99911['imageLoaderNodes'],
          referenceNodeId: _0x22efd7['nodeId'],
          referenceFieldPrefixes: [_0x22efd7['imageFieldPrefix']],
          slotCount: 0x9,
          maxCount: 0x9,
          maxCountMessage: '海螺H3 全能参考模式最多支持 9 张图片',
          mappingMissingMessage: '海螺H3 工作流图片加载节点映射不完整',
          uploadFailedMessage: '全能参考图片上传失败',
        },
        {
          kind: 'video',
          payloadField: 'inputVideos',
          loaderNodes: _0xc99911['videoLoaderNodes'],
          referenceNodeId: _0x22efd7['nodeId'],
          referenceFieldPrefixes: [_0x22efd7['videoFieldPrefix'], _0x22efd7['videoAudioFieldPrefix']],
          slotCount: 0x3,
          maxCount: 0x3,
          maxCountMessage: '海螺H3 全能参考模式最多支持 3 个视频',
          mappingMissingMessage: '海螺H3\x20工作流视频加载节点映射不完整',
          uploadFailedMessage: '全能参考视频上传失败',
        },
        {
          kind: 'audio',
          payloadField: 'inputAudios',
          loaderNodes: _0xc99911['audioLoaderNodes'],
          referenceNodeId: _0x22efd7['nodeId'],
          referenceFieldPrefixes: [_0x22efd7['audioFieldPrefix']],
          slotCount: 0x3,
          maxCount: 0x3,
          maxCountMessage: '海螺H3 全能参考模式最多支持 3 个音频',
          mappingMissingMessage: '海螺H3 工作流音频加载节点映射不完整',
          uploadFailedMessage: '全能参考音频上传失败',
        },
      ],
    }),
    resolveReferenceModeValue(_0x38cd29, _0xc99911)
  );
}
export async function resolveRunningHubHailuoH3OmniPayload({
  executionManifest: _0x265152,
  payload: _0x13aaa4,
  finalPrompt: _0x1d07c2,
  apiKey: _0x359c02,
  ctx: _0xe02792,
  helpers: _0x3a38f6,
}) {
  const _0x3f65a8 = _0x265152['mapping'] || {},
    _0x7d1f4c = [],
    _0x17aae8 = String(getPayloadParam(_0x13aaa4, 'rh_hailuo_h3_mode', 'frames'))['trim'](),
    _0x13bbfa =
      _0x17aae8 === 'reference'
        ? await appendReferenceInputs({
            mapping: _0x3f65a8,
            payload: _0x13aaa4,
            apiKey: _0x359c02,
            ctx: _0xe02792,
            helpers: _0x3a38f6,
            nodeInfoList: _0x7d1f4c,
          })
        : await appendFrameInputs({
            mapping: _0x3f65a8,
            payload: _0x13aaa4,
            apiKey: _0x359c02,
            ctx: _0xe02792,
            helpers: _0x3a38f6,
            nodeInfoList: _0x7d1f4c,
          }),
    _0x4f76cc = resolveRunningHubHailuoH3OmniDimensions(_0x13aaa4, _0x3f65a8);
  (_0x3a38f6['pushManifestNode'](
    _0x7d1f4c,
    _0x3f65a8['promptNode'],
    translateMinimaxH3EditorAssetMentions(_0x1d07c2),
  ),
    _0x3a38f6['pushManifestNode'](_0x7d1f4c, _0x3f65a8['modeNode'], _0x13bbfa));
  const _0x45b6f7 = getPlainObject(_0x13aaa4?.['generationParams']);
  return (
    _0x3a38f6['pushManifestNode'](
      _0x7d1f4c,
      _0x3f65a8['accelerationNode'],
      _0x3a38f6['getMappedValue'](
        _0x45b6f7[_0x3f65a8['accelerationNode']?.['field']],
        _0x3f65a8['accelerationNode'],
      ),
    ),
    _0x3a38f6['pushManifestNode'](_0x7d1f4c, _0x3f65a8['secondsNode'], resolveSeconds(_0x13aaa4, _0x3f65a8)),
    _0x3a38f6['pushManifestNode'](_0x7d1f4c, _0x3f65a8['widthNode'], _0x4f76cc['width']),
    _0x3a38f6['pushManifestNode'](_0x7d1f4c, _0x3f65a8['heightNode'], _0x4f76cc['height']),
    _0x3a38f6['buildTaskCreateVideoWorkflowRequest']({
      executionManifest: _0x265152,
      payload: _0x13aaa4,
      apiKey: _0x359c02,
      nodeInfoList: _0x7d1f4c,
    })
  );
}
