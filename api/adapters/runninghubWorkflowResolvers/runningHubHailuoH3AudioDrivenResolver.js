import { translateMinimaxH3EditorAssetMentions } from '../minimaxH3Prompt.js';
import {
  appendRunningHubReferenceMediaInputs,
  normalizeRunningHubReferenceMediaUrls,
} from './runningHubReferenceMediaResolverShared.js';
import { resolveRunningHubHailuoH3OmniDimensions } from './runningHubHailuoH3OmniResolver.js';
function getPlainObject(_0x1ea697) {
  return _0x1ea697 && typeof _0x1ea697 === 'object' && !Array['isArray'](_0x1ea697) ? _0x1ea697 : {};
}
function getPayloadParam(_0x13c8e2, _0x4e4588, _0x29c0be) {
  const _0x50e566 = getPlainObject(_0x13c8e2?.['generationParams']);
  if (Object['prototype']['hasOwnProperty']['call'](_0x50e566, _0x4e4588)) return _0x50e566[_0x4e4588];
  if (Object['prototype']['hasOwnProperty']['call'](_0x13c8e2 || {}, _0x4e4588)) return _0x13c8e2[_0x4e4588];
  return _0x29c0be;
}
function mergeReferenceInputs(..._0x510347) {
  return normalizeRunningHubReferenceMediaUrls(
    _0x510347['flatMap']((_0x25d302) => (Array['isArray'](_0x25d302) ? _0x25d302 : [_0x25d302])),
  );
}
export async function resolveRunningHubHailuoH3AudioDrivenPayload({
  executionManifest: _0x43156f,
  payload: _0x1d732e,
  finalPrompt: _0xc1e438,
  apiKey: _0x830b3a,
  ctx: _0x5e8083,
  helpers: _0x3922bb,
}) {
  const _0x263eeb = _0x43156f['mapping'] || {},
    _0x3f30be = _0x263eeb['referenceNode'] || {},
    _0x3663da = _0x263eeb['referenceLimits'] || {},
    _0x4ea74d = [],
    _0x472e31 = getPlainObject(_0x1d732e?.['inputUrlsBySlot']),
    _0x33d542 = {
      ..._0x1d732e,
      inputImages: mergeReferenceInputs(_0x1d732e?.['inputImages']),
      inputVideos: mergeReferenceInputs(_0x1d732e?.['inputVideos'], _0x1d732e?.['videoUrl']),
      inputAudios: mergeReferenceInputs(
        _0x1d732e?.['inputAudios'],
        _0x472e31['audio'],
        _0x1d732e?.['audioUrl'],
      ),
    };
  (await appendRunningHubReferenceMediaInputs({
    payload: _0x33d542,
    apiKey: _0x830b3a,
    ctx: _0x5e8083,
    helpers: _0x3922bb,
    nodeInfoList: _0x4ea74d,
    specs: [
      {
        kind: 'image',
        payloadField: 'inputImages',
        loaderNodes: _0x263eeb['imageLoaderNodes'],
        referenceNodeId: _0x3f30be['nodeId'],
        referenceFieldPrefixes: [_0x3f30be['imageFieldPrefix']],
        slotCount: Number(_0x3663da['image']) || 0x4,
        maxCount: Number(_0x3663da['image']) || 0x4,
        maxCountMessage: '海螺H3音频驱动最多支持 4 张图片',
        mappingMissingMessage: '海螺H3音频驱动图片节点映射不完整',
        uploadFailedMessage: '海螺H3音频驱动图片上传失败',
      },
      {
        kind: 'video',
        payloadField: 'inputVideos',
        loaderNodes: _0x263eeb['videoLoaderNodes'],
        referenceNodeId: _0x3f30be['nodeId'],
        referenceFieldPrefixes: [_0x3f30be['videoFieldPrefix']],
        slotCount: Number(_0x3663da['video']) || 0x1,
        maxCount: Number(_0x3663da['video']) || 0x1,
        maxCountMessage: '海螺H3音频驱动最多支持 1 个视频',
        mappingMissingMessage: '海螺H3音频驱动视频节点映射不完整',
        uploadFailedMessage: '海螺H3音频驱动视频上传失败',
      },
      {
        kind: 'audio',
        payloadField: 'inputAudios',
        loaderNodes: _0x263eeb['audioLoaderNodes'],
        referenceNodeId: _0x3f30be['nodeId'],
        referenceFieldPrefixes: [_0x3f30be['audioFieldPrefix']],
        slotCount: Number(_0x3663da['audio']) || 0x1,
        maxCount: Number(_0x3663da['audio']) || 0x1,
        minCount: 0x1,
        maxCountMessage: '海螺H3音频驱动只允许 1 个音频参考',
        minCountMessage: '海螺H3音频驱动必须接入音频参考',
        mappingMissingMessage: '海螺H3音频驱动音频节点映射不完整',
        uploadFailedMessage: '海螺H3音频驱动音频上传失败',
      },
    ],
  }),
    _0x3922bb['pushManifestNode'](
      _0x4ea74d,
      _0x263eeb['promptNode'],
      translateMinimaxH3EditorAssetMentions(_0xc1e438),
    ));
  const _0x11b7a0 = resolveRunningHubHailuoH3OmniDimensions(_0x1d732e, _0x263eeb);
  return (
    _0x3922bb['pushManifestNode'](_0x4ea74d, _0x263eeb['widthNode'], _0x11b7a0['width']),
    _0x3922bb['pushManifestNode'](_0x4ea74d, _0x263eeb['heightNode'], _0x11b7a0['height']),
    _0x3922bb['pushManifestNode'](
      _0x4ea74d,
      _0x263eeb['accelerationNode'],
      _0x3922bb['getMappedValue'](
        getPayloadParam(
          _0x1d732e,
          _0x263eeb['accelerationNode']?.['field'],
          _0x263eeb['accelerationNode']?.['defaultValue'],
        ),
        _0x263eeb['accelerationNode'],
      ),
    ),
    _0x3922bb['buildTaskCreateVideoWorkflowRequest']({
      executionManifest: _0x43156f,
      payload: _0x1d732e,
      apiKey: _0x830b3a,
      nodeInfoList: _0x4ea74d,
    })
  );
}
