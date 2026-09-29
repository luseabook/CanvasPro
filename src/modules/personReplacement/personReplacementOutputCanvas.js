import { normalizeImageGenerationResult } from '../../components/aigenImage/imageGenerationResultRenderer.js';
import { normalizeVideoGenerationResult } from '../../components/video-node/videoGenerationResultRenderer.js';
import { localPathToUrl, normalizeLocalPath } from '../../utils/localMediaPath.js';
import { getAutoMediaSizeByShortSide } from '../../services/fileService.js';
import { resolveOutputMediaSize } from '../../services/mediaRatioService.js';
import { buildPersonReplacementPromptPackage } from './personReplacementPromptCompiler.js';
import { materializePersonReplacementGuide } from './personReplacementLocationGuideCanvas.js';
import { createPersonReplacementImagePromptRequestResolver } from './personReplacementImageGeneration.js';
import {
  PERSON_REPLACEMENT_PROMPT_MODE_TEST,
  isPersonReplacementTestModeAvailable,
} from './personReplacementPromptMode.js';
import { calculateGroupNodeBounds } from '../groupNodeLayout.js';
import {
  getPersonReplacementImageResults,
  getPersonReplacementVideoResults,
  resolvePersonReplacementVideoSourceRef,
} from './personReplacementProject.js';
import { resolveGenerationResultSelection } from '../../core/generationResultRenderer.js';
const NODE_GAP = 0x48,
  SECTION_GAP = 0xb4,
  STAGE_GAP = 0x140,
  ASSET_COLUMNS = 0x5,
  STAGE_GROUP_COLORS = Object['freeze']({
    assets: 'var(--indigo)',
    image: 'var(--green)',
    video: 'var(--gold)',
    voice: 'var(--purple)',
    composite: 'var(--cyan)',
  });
export const PERSON_REPLACEMENT_CANVAS_SCOPES = Object['freeze']({ CLIPS: 'clips', PROJECT: 'project' });
export const PERSON_REPLACEMENT_CANVAS_LAYOUT_VERSION = 0x9;
export const PERSON_REPLACEMENT_CANVAS_NODE_SIZES = Object['freeze']({
  'comment-note': Object['freeze']({ width: 0x578, height: 0x120 }),
  group: Object['freeze']({ width: 0x200, height: 0x170 }),
  'source-text': Object['freeze']({ width: 0x2d0, height: 0x1e0 }),
  'source-image': Object['freeze']({ width: 0x120, height: 0x120 }),
  'ai-image': Object['freeze']({ width: 0x120, height: 0x120 }),
  'source-video': Object['freeze']({ width: 0x200, height: 0x120 }),
  'ai-video': Object['freeze']({ width: 0x200, height: 0x120 }),
  'source-audio': Object['freeze']({ width: 0x1a4, height: 0xb4 }),
  'ai-audio': Object['freeze']({ width: 0x1a4, height: 0xb4 }),
});
function asObject(_0x8907fd) {
  return _0x8907fd && typeof _0x8907fd === 'object' && !Array['isArray'](_0x8907fd) ? _0x8907fd : {};
}
function normalizeText(_0xa3818e) {
  return String(_0xa3818e || '')['trim']();
}
export const personReplacementCanvasMaterializationBindingPolicy = Object['freeze']({
  getProjectId(_0x1c3298) {
    return normalizeText(_0x1c3298?.['personReplacementBinding']?.['projectId']);
  },
  findProjectAnchor({ nodes: nodes = [], projectId: _0x2cbbd9 } = {}) {
    const _0x36f884 = normalizeText(_0x2cbbd9);
    if (!_0x36f884) return null;
    const _0x2dfbe3 = (Array['isArray'](nodes) ? nodes : [])['filter'](
      (_0x30f557) => normalizeText(_0x30f557?.['personReplacementBinding']?.['projectId']) === _0x36f884,
    );
    return (
      _0x2dfbe3['find'](
        (_0x5c27ba) =>
          _0x5c27ba?.['personReplacementBinding']?.['kind'] === 'stage-group' &&
          _0x5c27ba?.['personReplacementBinding']?.['stage'] === 'assets',
      ) ||
      _0x2dfbe3['find']((_0x5dc672) => _0x5dc672?.['personReplacementBinding']?.['kind'] === 'stage-group') ||
      _0x2dfbe3['find'](
        (_0x1a4380) => _0x1a4380?.['personReplacementBinding']?.['kind'] === 'project-overview',
      ) ||
      _0x2dfbe3[0x0] ||
      null
    );
  },
});
function normalizePromptDisplayText(_0x3648a3) {
  return String(_0x3648a3 || '')
    ['replace'](/<br\b[^>]*\/?>/gi, '\x0a')
    ['replace'](/<\/(?:div|p|section|article|blockquote|li)>/gi, '\x0a')
    ['replace'](/<li\b[^>]*>/gi, '-\x20')
    ['replace'](/<[^>]+>/g, '')
    ['replace'](/&nbsp;|&#160;/gi, '\x20')
    ['replace'](/&lt;/gi, '<')
    ['replace'](/&gt;/gi, '>')
    ['replace'](/&quot;/gi, '\x22')
    ['replace'](/&#39;|&apos;/gi, '\x27')
    ['replace'](/&amp;/gi, '&')
    ['replace'](/\n{3,}/g, '\x0a\x0a')
    ['trim']();
}
function normalizeList(_0x189b3a) {
  return Array['isArray'](_0x189b3a) ? _0x189b3a['filter'](Boolean) : [];
}
function normalizeScope(_0x2b0898) {
  return _0x2b0898 === PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT']
    ? PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT']
    : PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'];
}
function normalizeWorkspaceStep(_0x5868c6 = {}) {
  const _0x2fc272 = Math['trunc'](
    Number(_0x5868c6['workspace']?.['step']) || Number(_0x5868c6['step']) || 0x1,
  );
  return Math['max'](0x1, Math['min'](0x5, _0x2fc272));
}
function getWorkspaceStepName(_0x452731) {
  return ['', '素材设定', '图像替换', '视频替换', '声音克隆', '合成视频'][
    Math['max'](0x1, Math['min'](0x5, Math['trunc'](Number(_0x452731) || 0x1)))
  ];
}
function formatSequence(_0x14a5e1) {
  return String(_0x14a5e1 + 0x1)['padStart'](0x2, '0');
}
function createPlanEntry(
  _0x4cf0c9,
  _0x2fa9e1,
  _0x37eea6,
  { width: width = 0x0, height: height = 0x0, parentKey: parentKey = '', inputKeys: inputKeys = [] } = {},
) {
  const _0x355233 = normalizeText(_0x2fa9e1?.['type']),
    _0x567f20 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES[_0x355233],
    _0x47fb4f = Number(width) || _0x567f20?.['width'],
    _0x54b8bb = Number(height) || _0x567f20?.['height'];
  if (!_0x355233 || !_0x47fb4f || !_0x54b8bb)
    throw new Error('不支持的人物替换画布节点类型：' + (_0x355233 || 'unknown'));
  return {
    key: _0x4cf0c9,
    type: _0x355233,
    data: _0x2fa9e1,
    width: _0x47fb4f,
    height: _0x54b8bb,
    position: { x: Number(_0x37eea6?.['x']) || 0x0, y: Number(_0x37eea6?.['y']) || 0x0 },
    ...(normalizeText(parentKey) ? { parentKey: normalizeText(parentKey) } : {}),
    ...(normalizeList(inputKeys)['length']
      ? { inputKeys: normalizeList(inputKeys)['map'](normalizeText)['filter'](Boolean) }
      : {}),
  };
}
function buildMediaLocation(_0x4e3463) {
  const _0x3131e3 = normalizeText(_0x4e3463),
    _0x1a7a94 = normalizeLocalPath(_0x3131e3);
  return { localPath: _0x1a7a94, url: localPathToUrl(_0x1a7a94) };
}
function normalizeInlineLocationGuideRef(_0x415afd, _0x42abc6 = ![]) {
  const _0x1d9d2c = normalizeText(_0x415afd);
  return _0x42abc6 && /^data:image\/svg\+xml(?:;|,)/i['test'](_0x1d9d2c) ? _0x1d9d2c : '';
}
function buildBinding(_0x5cd3f1, _0x496ec1 = {}) {
  return { projectId: normalizeText(_0x5cd3f1?.['id']), ...asObject(_0x496ec1) };
}
const PERSON_REPLACEMENT_LOCATION_GUIDE_SUBDIR = 'person-replacement-guides';
function buildInlineSvgSignature(_0x14b3d9) {
  const _0x5f37f1 = normalizeText(_0x14b3d9);
  let _0x3e7249 = 0x811c9dc5;
  for (let _0x338b2d = 0x0; _0x338b2d < _0x5f37f1['length']; _0x338b2d += 0x1) {
    ((_0x3e7249 ^= _0x5f37f1['charCodeAt'](_0x338b2d)), (_0x3e7249 = Math['imul'](_0x3e7249, 0x1000193)));
  }
  return 'svg-' + (_0x3e7249 >>> 0x0)['toString'](0x10)['padStart'](0x8, '0');
}
function buildInlineSvgBlob(_0x41f412) {
  const _0x38c61f = normalizeText(_0x41f412),
    _0x187cd1 = _0x38c61f['indexOf'](','),
    _0x115047 = _0x187cd1 >= 0x0 ? _0x38c61f['slice'](0x0, _0x187cd1) : '',
    _0x4e9b43 = _0x187cd1 >= 0x0 ? _0x38c61f['slice'](_0x187cd1 + 0x1) : '';
  if (!/^data:image\/svg\+xml(?:;|$)/i['test'](_0x115047) || !_0x4e9b43)
    throw new Error('人物定位图不是有效的 SVG 数据');
  const _0x4f028f = globalThis['Blob'];
  if (typeof _0x4f028f !== 'function') throw new Error('当前环境无法保存人物定位图');
  if (/;base64(?:;|$)/i['test'](_0x115047)) {
    const _0x50ae33 = globalThis['atob'];
    if (typeof _0x50ae33 !== 'function') throw new Error('当前环境无法解码人物定位图');
    const _0x4fa579 = _0x50ae33(_0x4e9b43),
      _0x5019f4 = new Uint8Array(_0x4fa579['length']);
    for (let _0x121b67 = 0x0; _0x121b67 < _0x4fa579['length']; _0x121b67 += 0x1) {
      _0x5019f4[_0x121b67] = _0x4fa579['charCodeAt'](_0x121b67);
    }
    return new _0x4f028f([_0x5019f4], { type: 'image/svg+xml' });
  }
  try {
    return new _0x4f028f([decodeURIComponent(_0x4e9b43)], { type: 'image/svg+xml' });
  } catch {
    throw new Error('人物定位图 SVG 数据无法解码');
  }
}
function normalizeSavedLocationGuideRef(_0x1ce1f3 = {}) {
  return normalizeLocalPath(
    _0x1ce1f3?.['originalLocalPath'] ||
      _0x1ce1f3?.['localPath'] ||
      _0x1ce1f3?.['path'] ||
      _0x1ce1f3?.['url'] ||
      '',
  );
}
function applyPersistedLocationGuide(_0x937f7a, _0xf92c1e, _0x457e19, _0x37ecdc, _0x555ead) {
  const _0x187e73 = asObject(_0x937f7a?.['data']),
    _0x414820 = { ...asObject(_0x187e73['personReplacementBinding']), locationGuideSignature: _0x37ecdc };
  _0x937f7a['data'] = {
    ..._0x187e73,
    ...buildPersonReplacementImageCanvasNodeData({
      project: _0xf92c1e,
      imageRef: _0x457e19,
      results: [{ ..._0x555ead, localPath: _0x457e19 }],
      name: _0x187e73['name'],
      type: _0x187e73['type'] || _0x937f7a['type'],
      prompt: _0x187e73['prompt'],
      binding: _0x414820,
    }),
    imageWidth: _0x187e73['imageWidth'],
    imageHeight: _0x187e73['imageHeight'],
  };
}
async function materializePersonReplacementLocationGuides({
  plan: plan = [],
  project: project = {},
  adapter: _0x34947a,
  canReuseCanvas: canReuseCanvas = ![],
  previousNodes: previousNodes = {},
  canvasId: canvasId = '',
  saveOutputBlob: saveOutputBlob = null,
  createLocationGuide: _0x35cfe5,
} = {}) {
  for (const _0x23aa0d of normalizeList(plan)) {
    const _0x12860f = asObject(_0x23aa0d?.['data']?.['personReplacementBinding']);
    if (_0x12860f['locationGuide'] || _0x12860f['annotatedSource']) {
      await materializePersonReplacementGuide({
        entry: _0x23aa0d,
        project: project,
        adapter: _0x34947a,
        canReuseCanvas: canReuseCanvas,
        previousNodes: previousNodes,
        canvasId: canvasId,
        saveOutputBlob: saveOutputBlob,
        buildNodeData: buildPersonReplacementImageCanvasNodeData,
        createLocationGuide: _0x35cfe5,
      });
      continue;
    }
    if (_0x12860f['kind'] !== 'person-location-guide') continue;
    const _0x2aaafb = normalizeText(
      _0x23aa0d?.['data']?.['imageUrl'] || _0x23aa0d?.['data']?.['images']?.[0x0]?.['imageUrl'],
    );
    if (!/^data:image\/svg\+xml(?:;|,)/i['test'](_0x2aaafb)) continue;
    const _0x563848 = buildInlineSvgSignature(_0x2aaafb);
    let _0x4725cd = '',
      _0x9d4815 = {};
    const _0x2bde54 = normalizeText(previousNodes[_0x23aa0d['key']]);
    if (
      canReuseCanvas &&
      _0x2bde54 &&
      typeof _0x34947a?.['getNode'] === 'function' &&
      (await _0x34947a['nodeExists'](_0x2bde54, canvasId))
    ) {
      const _0x409e4a = await _0x34947a['getNode'](_0x2bde54, canvasId);
      ((_0x9d4815 = _0x409e4a?.['images']?.[0x0] || _0x409e4a || {}),
        normalizeText(_0x409e4a?.['personReplacementBinding']?.['locationGuideSignature']) === _0x563848 &&
          (_0x4725cd = normalizeLocalPath(
            _0x409e4a?.['originalLocalPath'] ||
              _0x409e4a?.['localPath'] ||
              _0x409e4a?.['displayLocalPath'] ||
              _0x409e4a?.['images']?.[0x0]?.['originalLocalPath'] ||
              _0x409e4a?.['images']?.[0x0]?.['localPath'] ||
              '',
          )));
    }
    if (!_0x4725cd) {
      if (typeof saveOutputBlob !== 'function') throw new Error('人物定位图本地保存服务不可用');
      const _0x8a7fd4 = await saveOutputBlob(buildInlineSvgBlob(_0x2aaafb), {
        ext: 'svg',
        subDir: PERSON_REPLACEMENT_LOCATION_GUIDE_SUBDIR,
        kind: 'image',
      });
      ((_0x4725cd = normalizeSavedLocationGuideRef(_0x8a7fd4)), (_0x9d4815 = _0x8a7fd4));
      if (!_0x4725cd) throw new Error('人物定位图保存后未返回本地路径');
    }
    applyPersistedLocationGuide(_0x23aa0d, project, _0x4725cd, _0x563848, _0x9d4815);
  }
}
function buildPersonReplacementVideoCanvasNodeData({
  project: project = {},
  videoRef: videoRef = '',
  results: results = [],
  activeIndex: activeIndex = 0x0,
  name: name = '',
  type: type = 'ai-video',
  prompt: prompt = '',
  binding: binding = {},
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  providerProfileIdByModel: providerProfileIdByModel = {},
  generationParams: generationParams = {},
  allowEmpty: allowEmpty = ![],
} = {}) {
  const _0x58033f = buildMediaLocation(videoRef),
    { items: _0x5c84bb, activeIndex: _0x39fbc0 } = resolveGenerationResultSelection(
      normalizeVideoGenerationResult({
        videos: results['length']
          ? results
          : _0x58033f['url']
            ? [{ localPath: _0x58033f['localPath'], videoUrl: _0x58033f['url'] }]
            : [],
      })['items'],
      activeIndex,
    ),
    _0x3d74bf = _0x5c84bb[_0x39fbc0];
  if (!_0x3d74bf?.['videoUrl'] && !allowEmpty)
    throw new Error((normalizeText(name) || '视频') + '缺少可加入画布的媒体地址');
  return {
    type: type,
    name: normalizeText(name) || '人物替换视频',
    prompt: normalizeText(prompt),
    videos: _0x5c84bb,
    mainVideoIndex: _0x39fbc0,
    isVideosExpanded: ![],
    videoUrl: normalizeText(_0x3d74bf?.['videoUrl']),
    localPath: normalizeText(_0x3d74bf?.['localPath']),
    displayLocalPath: normalizeText(_0x3d74bf?.['displayLocalPath']),
    posterLocalPath: normalizeText(_0x3d74bf?.['posterLocalPath']),
    thumbId: normalizeText(_0x3d74bf?.['thumbId']),
    thumbUrl: normalizeText(_0x3d74bf?.['thumbUrl']),
    ...(normalizeText(model) ? { model: normalizeText(model) } : {}),
    ...(normalizeText(provider) ? { provider: normalizeText(provider) } : {}),
    ...(normalizeText(providerProfileId) ? { providerProfileId: normalizeText(providerProfileId) } : {}),
    ...(Object['keys'](asObject(providerProfileIdByModel))['length']
      ? { providerProfileIdByModel: { ...asObject(providerProfileIdByModel) } }
      : {}),
    ...(Object['keys'](asObject(generationParams))['length']
      ? { generationParams: { ...asObject(generationParams) } }
      : {}),
    personReplacementBinding: buildBinding(project, binding),
  };
}
function buildPersonReplacementImageCanvasNodeData({
  project: project = {},
  imageRef: imageRef = '',
  results: results = [],
  activeIndex: activeIndex = 0x0,
  name: name = '',
  type: type = 'ai-image',
  prompt: prompt = '',
  binding: binding = {},
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  providerProfileIdByModel: providerProfileIdByModel = {},
  generationParams: generationParams = {},
  allowEmpty: allowEmpty = ![],
  allowInlineSvg: allowInlineSvg = ![],
} = {}) {
  const _0x1e1020 = buildMediaLocation(imageRef),
    _0x7165ac = normalizeInlineLocationGuideRef(imageRef, allowInlineSvg),
    _0x42e25d = _0x1e1020['url']
      ? normalizeImageGenerationResult({
          images: [
            { localPath: _0x1e1020['localPath'], imageUrl: _0x1e1020['url'], sourceUrl: _0x1e1020['url'] },
          ],
        })['items'][0x0]
      : _0x7165ac
        ? { imageUrl: _0x7165ac, sourceUrl: _0x7165ac, localPath: '' }
        : null,
    { items: _0x44e964, activeIndex: _0x27bab3 } = resolveGenerationResultSelection(
      results['length']
        ? normalizeImageGenerationResult({ images: results })['items']
        : _0x42e25d
          ? [_0x42e25d]
          : [],
      activeIndex,
    ),
    _0x4e76f7 = _0x44e964[_0x27bab3];
  if (!_0x4e76f7?.['imageUrl'] && !allowEmpty)
    throw new Error((normalizeText(name) || '图片') + '缺少可加入画布的媒体地址');
  return {
    type: type,
    name: normalizeText(name) || '人物替换图片',
    prompt: normalizeText(prompt),
    images: _0x44e964,
    mainImageIndex: _0x27bab3,
    isImagesExpanded: ![],
    imageUrl: normalizeText(_0x4e76f7?.['imageUrl']),
    sourceUrl: normalizeText(_0x4e76f7?.['sourceUrl']),
    thumbUrl: normalizeText(_0x4e76f7?.['thumbUrl']),
    localPath: normalizeText(_0x4e76f7?.['localPath']),
    originalLocalPath: normalizeText(_0x4e76f7?.['originalLocalPath']),
    displayLocalPath: normalizeText(_0x4e76f7?.['displayLocalPath']),
    thumbLocalPath: normalizeText(_0x4e76f7?.['thumbLocalPath']),
    sourceId: normalizeText(_0x4e76f7?.['sourceId']),
    thumbId: normalizeText(_0x4e76f7?.['thumbId']),
    ...(normalizeText(model) ? { model: normalizeText(model) } : {}),
    ...(normalizeText(provider) ? { provider: normalizeText(provider) } : {}),
    ...(normalizeText(providerProfileId) ? { providerProfileId: normalizeText(providerProfileId) } : {}),
    ...(Object['keys'](asObject(providerProfileIdByModel))['length']
      ? { providerProfileIdByModel: { ...asObject(providerProfileIdByModel) } }
      : {}),
    ...(Object['keys'](asObject(generationParams))['length']
      ? { generationParams: { ...asObject(generationParams) } }
      : {}),
    personReplacementBinding: buildBinding(project, binding),
  };
}
function resolveShotImageCanvasGeometry(_0x6066eb = {}) {
  const _0x3b9d20 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['ai-image'],
    _0x3f1827 = Math['max'](0x0, Number(_0x6066eb?.['frame']?.['width']) || 0x0),
    _0x3502ec = Math['max'](0x0, Number(_0x6066eb?.['frame']?.['height']) || 0x0);
  if (!(_0x3f1827 > 0x0 && _0x3502ec > 0x0))
    return { width: _0x3b9d20['width'], height: _0x3b9d20['height'], imageWidth: 0x0, imageHeight: 0x0 };
  return {
    ...getAutoMediaSizeByShortSide(_0x3f1827, _0x3502ec),
    imageWidth: _0x3f1827,
    imageHeight: _0x3502ec,
  };
}
function applyImageCanvasGeometry(_0x16e393, _0x29630f, { source: source = ![] } = {}) {
  const _0x200097 = Math['max'](0x0, Number(_0x29630f?.['imageWidth']) || 0x0),
    _0x2063be = Math['max'](0x0, Number(_0x29630f?.['imageHeight']) || 0x0);
  return {
    ..._0x16e393,
    width: Math['max'](0x1, Number(_0x29630f?.['width']) || 0x1),
    height: Math['max'](0x1, Number(_0x29630f?.['height']) || 0x1),
    ...(_0x200097 > 0x0 && _0x2063be > 0x0 ? { imageWidth: _0x200097, imageHeight: _0x2063be } : {}),
    ...(source ? { needsAutoResize: ![] } : {}),
  };
}
function resolveShotVideoCanvasGeometry(_0x4e176c = {}) {
  const _0x5bf7f3 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['ai-video'],
    _0x1785f0 = Math['max'](0x0, Number(_0x4e176c?.['frame']?.['width']) || 0x0),
    _0x524019 = Math['max'](0x0, Number(_0x4e176c?.['frame']?.['height']) || 0x0);
  if (!(_0x1785f0 > 0x0 && _0x524019 > 0x0))
    return { width: _0x5bf7f3['width'], height: _0x5bf7f3['height'], videoWidth: 0x0, videoHeight: 0x0 };
  return {
    ...getAutoMediaSizeByShortSide(_0x1785f0, _0x524019),
    videoWidth: _0x1785f0,
    videoHeight: _0x524019,
  };
}
function applyVideoCanvasGeometry(_0x27d260, _0xc579d5) {
  const _0x3a0992 = Math['max'](0x0, Number(_0xc579d5?.['videoWidth']) || 0x0),
    _0x54232c = Math['max'](0x0, Number(_0xc579d5?.['videoHeight']) || 0x0),
    _0x5af5f0 = Math['max'](0x1, Number(_0xc579d5?.['width']) || 0x1),
    _0x5437d8 = Math['max'](0x1, Number(_0xc579d5?.['height']) || 0x1),
    _0x12c9e8 = _0x3a0992 > 0x0 && _0x54232c > 0x0;
  return {
    ..._0x27d260,
    width: _0x5af5f0,
    height: _0x5437d8,
    ...(_0x12c9e8
      ? {
          naturalWidth: _0x3a0992,
          naturalHeight: _0x54232c,
          videoWidth: _0x3a0992,
          videoHeight: _0x54232c,
          selectedVideoWidth: _0x3a0992,
          selectedVideoHeight: _0x54232c,
          needsAutoResize: ![],
          videos: normalizeList(_0x27d260?.['videos'])['map']((_0x4f421c) => ({
            ..._0x4f421c,
            videoWidth: _0x3a0992,
            videoHeight: _0x54232c,
          })),
        }
      : {}),
  };
}
function resolveAppearanceImageCanvasGeometry(_0x4f8b77 = {}) {
  const _0x16029b = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['ai-image'],
    _0x38ee09 = Math['max'](
      0x0,
      Number(
        _0x4f8b77?.['imageWidth'] ||
          _0x4f8b77?.['naturalWidth'] ||
          _0x4f8b77?.['originalWidth'] ||
          _0x4f8b77?.['width'],
      ) || 0x0,
    ),
    _0x416507 = Math['max'](
      0x0,
      Number(
        _0x4f8b77?.['imageHeight'] ||
          _0x4f8b77?.['naturalHeight'] ||
          _0x4f8b77?.['originalHeight'] ||
          _0x4f8b77?.['height'],
      ) || 0x0,
    );
  if (!(_0x38ee09 > 0x0 && _0x416507 > 0x0))
    return { width: _0x16029b['width'], height: _0x16029b['height'], imageWidth: 0x0, imageHeight: 0x0 };
  return {
    ...getAutoMediaSizeByShortSide(_0x38ee09, _0x416507),
    imageWidth: _0x38ee09,
    imageHeight: _0x416507,
  };
}
async function resolveProjectAppearanceImageSizes(_0x103673 = {}) {
  const _0x38d53b = await Promise['all'](
    normalizeList(_0x103673['characters'])['map'](async (_0x160936) => {
      const _0x2e55e7 = await Promise['all'](
        normalizeList(_0x160936?.['appearances'])['map'](async (_0x564b48) => {
          const _0x874a7 = resolveAppearanceImageCanvasGeometry(_0x564b48);
          if (_0x874a7['imageWidth'] > 0x0 && _0x874a7['imageHeight'] > 0x0) return _0x564b48;
          const _0x1a141d = normalizeText(
            _0x564b48?.['imageUrl'] || _0x564b48?.['imageRef'] || _0x564b48?.['url'],
          );
          if (!_0x1a141d) return _0x564b48;
          const _0x207033 = buildMediaLocation(_0x1a141d),
            _0x45f6d1 = await resolveOutputMediaSize({
              localPath: _0x207033['localPath'],
              imageUrl: _0x207033['url'],
            });
          return _0x45f6d1
            ? { ..._0x564b48, imageWidth: _0x45f6d1['width'], imageHeight: _0x45f6d1['height'] }
            : _0x564b48;
        }),
      );
      return { ..._0x160936, appearances: _0x2e55e7 };
    }),
  );
  return { ..._0x103673, characters: _0x38d53b };
}
async function resolveProjectShotImageSizes(_0x12a268 = {}) {
  const _0x2a0972 = await Promise['all'](
    normalizeList(_0x12a268['shots'])['map'](async (_0x38fbbb) => {
      const _0xd81e69 = resolveShotImageCanvasGeometry(_0x38fbbb);
      if (_0xd81e69['imageWidth'] > 0x0 && _0xd81e69['imageHeight'] > 0x0) return _0x38fbbb;
      const _0x402538 = [
        ...new Set(
          [normalizeText(_0x38fbbb?.['keyframeRef']), normalizeText(_0x38fbbb?.['replacementImageRef'])][
            'filter'
          ](Boolean),
        ),
      ];
      if (!_0x402538['length']) return _0x38fbbb;
      const _0x2420b0 = (
        await Promise['all'](
          _0x402538['map'](async (_0x2a79ab) => {
            const _0x1ad49d = buildMediaLocation(_0x2a79ab);
            return resolveOutputMediaSize({ localPath: _0x1ad49d['localPath'], imageUrl: _0x1ad49d['url'] });
          }),
        )
      )['find'](Boolean);
      return _0x2420b0
        ? {
            ..._0x38fbbb,
            frame: {
              ...asObject(_0x38fbbb?.['frame']),
              width: _0x2420b0['width'],
              height: _0x2420b0['height'],
            },
          }
        : _0x38fbbb;
    }),
  );
  return { ..._0x12a268, shots: _0x2a0972 };
}
function buildPersonReplacementSourceAudioNodeData({
  project: project = {},
  audioRef: audioRef = '',
  name: name = '',
  binding: binding = {},
} = {}) {
  const _0x2b8863 = buildMediaLocation(audioRef);
  if (!_0x2b8863['url']) throw new Error((normalizeText(name) || '音频') + '缺少可加入画布的媒体地址');
  return {
    type: 'source-audio',
    name: normalizeText(name) || '原音频片段',
    fileName: normalizeText(name) || '原音频片段',
    audioUrl: _0x2b8863['url'],
    localPath: _0x2b8863['localPath'],
    personReplacementBinding: buildBinding(project, binding),
  };
}
function buildPersonReplacementAudioCanvasNodeData({
  project: project = {},
  audioRef: audioRef = '',
  name: name = '',
  prompt: prompt = '',
  model: model = '',
  binding: binding = {},
  allowEmpty: allowEmpty = ![],
} = {}) {
  const _0x145e8d = buildMediaLocation(audioRef);
  if (!_0x145e8d['url'] && !allowEmpty)
    throw new Error((normalizeText(name) || '音频') + '缺少可加入画布的媒体地址');
  const _0x57f033 = _0x145e8d['url']
    ? [{ audioUrl: _0x145e8d['url'], src: _0x145e8d['url'], localPath: _0x145e8d['localPath'] }]
    : [];
  return {
    type: 'ai-audio',
    name: normalizeText(name) || '替换音频',
    prompt: normalizeText(prompt),
    audios: _0x57f033,
    mainAudioIndex: 0x0,
    audioUrl: _0x145e8d['url'],
    localPath: _0x145e8d['localPath'],
    ...(normalizeText(model) ? { model: normalizeText(model), audioWorkflowKey: normalizeText(model) } : {}),
    personReplacementBinding: buildBinding(project, binding),
  };
}
function buildStageAnnotationNodeData({
  project: project = {},
  stage: stage = '',
  title: title = '',
  content: content = '',
  isProjectAnchor: isProjectAnchor = ![],
} = {}) {
  const _0x48dde7 = PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'];
  return {
    type: 'comment-note',
    name: normalizeText(title),
    content: normalizeText(content),
    style: { fontSize: 0x28, textColor: 'white', backgroundColor: 'transparent' },
    personReplacementBinding: buildBinding(project, {
      kind: isProjectAnchor ? 'project-overview' : 'stage-annotation',
      stage: normalizeText(stage),
      canvasScope: _0x48dde7,
    }),
  };
}
function getCharacterAppearanceRecords(_0x2c9ba5 = {}) {
  const _0xf9459a = [];
  return (
    normalizeList(_0x2c9ba5['characters'])['forEach']((_0x29d7c6, _0x22d42f) => {
      const _0x4306b4 = normalizeText(_0x29d7c6?.['id']) || 'character-' + (_0x22d42f + 0x1),
        _0x45fbaa = normalizeList(_0x29d7c6?.['appearances']),
        _0x89911c = normalizeList(_0x29d7c6?.['imageRefs'])['map']((_0x16de3d, _0x12122f) => ({
          id: 'image-' + (_0x12122f + 0x1),
          name: _0x12122f === 0x0 ? '基础形象' : '形象 ' + (_0x12122f + 0x1),
          imageUrl: _0x16de3d,
          prompt: _0x29d7c6?.['description'],
        })),
        _0x46cc64 = _0x45fbaa['length']
          ? _0x45fbaa
          : _0x89911c['length']
            ? _0x89911c
            : [{ id: 'base', name: '基础形象', imageUrl: '', prompt: _0x29d7c6?.['description'] }];
      _0x46cc64['forEach']((_0x11687b, _0x205d4b) => {
        const _0x5e318e = normalizeText(_0x11687b?.['id']) || 'appearance-' + (_0x205d4b + 0x1);
        _0xf9459a['push']({
          key: 'asset:' + _0x4306b4 + ':' + _0x5e318e,
          characterId: _0x4306b4,
          appearanceId: _0x5e318e,
          characterName: normalizeText(_0x29d7c6?.['name']) || '目标人物' + (_0x22d42f + 0x1),
          appearanceName: normalizeText(_0x11687b?.['name']),
          imageRef: normalizeText(_0x11687b?.['imageUrl'] || _0x11687b?.['imageRef'] || _0x11687b?.['url']),
          prompt: normalizeText(_0x11687b?.['prompt'] || _0x29d7c6?.['description']),
          imageWidth: Math['max'](
            0x0,
            Number(
              _0x11687b?.['imageWidth'] ||
                _0x11687b?.['naturalWidth'] ||
                _0x11687b?.['originalWidth'] ||
                _0x11687b?.['width'],
            ) || 0x0,
          ),
          imageHeight: Math['max'](
            0x0,
            Number(
              _0x11687b?.['imageHeight'] ||
                _0x11687b?.['naturalHeight'] ||
                _0x11687b?.['originalHeight'] ||
                _0x11687b?.['height'],
            ) || 0x0,
          ),
        });
      });
    }),
    _0xf9459a
  );
}
function appendAssetStage(_0x30e411, _0x55139f, _0x51167b, _0x58072a) {
  const _0x2ca9e1 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['comment-note'],
    _0x277a80 = [];
  for (let _0x567b11 = 0x0; _0x567b11 < _0x58072a['length']; _0x567b11 += ASSET_COLUMNS) {
    const _0xb2944f = _0x58072a['slice'](_0x567b11, _0x567b11 + ASSET_COLUMNS),
      _0x393a96 = _0xb2944f['map']((_0x436736) => ({
        appearance: _0x436736,
        geometry: resolveAppearanceImageCanvasGeometry(_0x436736),
      }));
    _0x277a80['push']({
      items: _0x393a96,
      width: _0x393a96['reduce'](
        (_0x4a48ac, _0x5e6271, _0x16c276) =>
          _0x4a48ac + _0x5e6271['geometry']['width'] + (_0x16c276 > 0x0 ? NODE_GAP : 0x0),
        0x0,
      ),
      height: Math['max'](..._0x393a96['map']((_0x5bc0ad) => _0x5bc0ad['geometry']['height'])),
    });
  }
  _0x30e411['push'](
    createPlanEntry(
      'stage:assets:annotation',
      buildStageAnnotationNodeData({
        project: _0x55139f,
        stage: 'assets',
        title: '阶段 1 · 人物素材',
        content: '人物素材及形象参考图。',
        isProjectAnchor: !![],
      }),
      { x: 0x0, y: _0x51167b },
    ),
  );
  const _0x1f91ce = _0x51167b + _0x2ca9e1['height'] + NODE_GAP;
  let _0x7f92e9 = 0x0;
  return (
    _0x277a80['forEach']((_0x3ba2e9) => {
      let _0x5ac1bd = 0x0;
      (_0x3ba2e9['items']['forEach'](({ appearance: _0x151568, geometry: _0xa29097 }) => {
        (_0x30e411['push'](
          createPlanEntry(
            _0x151568['key'],
            applyImageCanvasGeometry(
              buildPersonReplacementImageCanvasNodeData({
                project: _0x55139f,
                imageRef: _0x151568['imageRef'],
                name: [_0x151568['characterName'], _0x151568['appearanceName']]
                  ['filter'](Boolean)
                  ['join']('\x20·\x20'),
                prompt: _0x151568['prompt'],
                model: _0x55139f['settings']?.['characterImageModelId'],
                provider: _0x55139f['settings']?.['characterImageProvider'],
                providerProfileId: _0x55139f['settings']?.['characterImageProviderProfileId'],
                providerProfileIdByModel: _0x55139f['settings']?.['characterImageProviderProfileIdByModel'],
                generationParams: _0x55139f['settings']?.['characterImageGenerationParams'],
                allowEmpty: !![],
                binding: {
                  characterId: _0x151568['characterId'],
                  appearanceId: _0x151568['appearanceId'],
                  kind: 'character-image',
                  canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
                },
              }),
              _0xa29097,
            ),
            { x: _0x5ac1bd, y: _0x1f91ce + _0x7f92e9 },
            { width: _0xa29097['width'], height: _0xa29097['height'] },
          ),
        ),
          (_0x5ac1bd += _0xa29097['width'] + NODE_GAP));
      }),
        (_0x7f92e9 += _0x3ba2e9['height'] + NODE_GAP));
    }),
    _0x277a80['length'] ? _0x1f91ce + _0x7f92e9 - NODE_GAP : _0x51167b + _0x2ca9e1['height']
  );
}
function buildShotPromptPackage(_0x5298fe, _0x3fd167) {
  const _0x2d8ae2 = buildPersonReplacementPromptPackage({ project: _0x5298fe, shot: _0x3fd167 });
  if (
    _0x2d8ae2['promptMode'] === PERSON_REPLACEMENT_PROMPT_MODE_TEST &&
    !isPersonReplacementTestModeAvailable()
  )
    throw new Error('测试模式仅限开发者，请切回其他替换模式后加入画布。');
  const _0x4fc5f7 = globalThis['document']?.['createElement']
      ? _0x3fd167
      : { ..._0x3fd167, imagePrompt: normalizePromptDisplayText(_0x3fd167?.['imagePrompt']) },
    _0x52d7e5 = createPersonReplacementImagePromptRequestResolver()({
      project: _0x5298fe,
      shot: _0x4fc5f7,
      promptPackage: _0x2d8ae2,
    });
  return {
    ..._0x2d8ae2,
    prompt: _0x52d7e5['requestPrompt'],
    referenceImages: [
      ..._0x2d8ae2['referenceImages'],
      ..._0x52d7e5['promptAssetRefs']['map']((_0xc94f95, _0x45c034) => ({
        ref: _0xc94f95['url'],
        role: 'prompt-reference',
        slot: _0x2d8ae2['referenceImages']['length'] + _0x45c034 + 0x1,
      })),
    ],
  };
}
function resolveAssetKeyForReference(_0x20f5c9, _0x3a961b) {
  const _0x11f432 = normalizeText(_0x20f5c9?.['targetCharacterId']),
    _0x377ce2 = normalizeText(_0x20f5c9?.['targetAppearanceId']),
    _0x537b9d = _0x3a961b['find'](
      (_0x391cc6) =>
        _0x391cc6['characterId'] === _0x11f432 && (!_0x377ce2 || _0x391cc6['appearanceId'] === _0x377ce2),
    );
  if (_0x537b9d) return _0x537b9d['key'];
  const _0x3c0814 = normalizeText(_0x20f5c9?.['ref']);
  return _0x3a961b['find']((_0x1a31b4) => _0x1a31b4['imageRef'] === _0x3c0814)?.['key'] || '';
}
function appendImageReplacementStage(_0x4a37cb, _0x744769, _0x576845, _0x56fbff) {
  const _0x46306d = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['comment-note'],
    _0x49f83e = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['source-text'];
  _0x4a37cb['push'](
    createPlanEntry(
      'stage:image:annotation',
      buildStageAnnotationNodeData({
        project: _0x744769,
        stage: 'image',
        title: '阶段 2 · 图像替换',
        content: '关键帧、人物素材和提示词共同连到替换结果图。',
      }),
      { x: 0x0, y: _0x576845 },
    ),
  );
  let _0x4092ca = _0x576845 + _0x46306d['height'] + NODE_GAP;
  return (
    normalizeList(_0x744769['shots'])['forEach']((_0x1555ee, _0x420f6e) => {
      const _0x1404e4 = normalizeText(_0x1555ee?.['id']) || 'shot-' + (_0x420f6e + 0x1),
        _0x5cabce = formatSequence(_0x420f6e),
        _0x50266c = buildShotPromptPackage(_0x744769, _0x1555ee),
        _0x1385eb = [];
      let _0x563035 = 0x0;
      const _0x4cddb2 = resolveShotImageCanvasGeometry(_0x1555ee),
        _0x3ca7f4 = normalizeText(_0x50266c['referenceImages'][0x0]?.['ref'] || _0x1555ee?.['keyframeRef']);
      if (_0x3ca7f4) {
        const _0x2ee4b7 = 'shot:' + _0x1404e4 + ':keyframe';
        (_0x4a37cb['push'](
          createPlanEntry(
            _0x2ee4b7,
            applyImageCanvasGeometry(
              buildPersonReplacementImageCanvasNodeData({
                project: _0x744769,
                imageRef: _0x3ca7f4,
                name: '镜头片段' + _0x5cabce + ' · 关键帧',
                type: 'source-image',
                binding: {
                  shotId: _0x1404e4,
                  kind: 'source-keyframe',
                  ...(_0x50266c['annotatedSource'] ? { annotatedSource: _0x50266c['annotatedSource'] } : {}),
                  canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
                },
              }),
              _0x4cddb2,
              { source: !![] },
            ),
            { x: _0x563035, y: _0x4092ca },
            { width: _0x4cddb2['width'], height: _0x4cddb2['height'] },
          ),
        ),
          _0x1385eb['push'](_0x2ee4b7),
          (_0x563035 += _0x4cddb2['width'] + NODE_GAP));
      }
      for (const _0x3652bf of normalizeList(_0x50266c['referenceImages'])['filter'](
        (_0x4c15a0) => _0x4c15a0['role'] !== 'source-keyframe',
      )) {
        const _0x2e63ef = resolveAssetKeyForReference(_0x3652bf, _0x56fbff);
        if (_0x2e63ef) {
          if (!_0x1385eb['includes'](_0x2e63ef)) _0x1385eb['push'](_0x2e63ef);
          continue;
        }
        const _0x284127 = _0x3652bf['role'] === 'person-location-guide',
          _0x1aabbd = _0x284127
            ? 'shot:' + _0x1404e4 + ':location-guide'
            : 'shot:' + _0x1404e4 + ':reference:' + _0x3652bf['slot'];
        (_0x4a37cb['push'](
          createPlanEntry(
            _0x1aabbd,
            applyImageCanvasGeometry(
              buildPersonReplacementImageCanvasNodeData({
                project: _0x744769,
                imageRef: _0x3652bf['ref'],
                name: '镜头片段' + _0x5cabce + ' · 图' + _0x3652bf['slot'],
                type: 'source-image',
                allowInlineSvg: _0x284127,
                binding: {
                  shotId: _0x1404e4,
                  kind: _0x3652bf['role'],
                  ...(_0x284127 ? { locationGuide: _0x50266c['locationGuide'] } : {}),
                  canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
                },
              }),
              _0x4cddb2,
              { source: !![] },
            ),
            { x: _0x563035, y: _0x4092ca },
            { width: _0x4cddb2['width'], height: _0x4cddb2['height'] },
          ),
        ),
          _0x1385eb['push'](_0x1aabbd),
          (_0x563035 += _0x4cddb2['width'] + NODE_GAP));
      }
      const _0x396796 = _0x50266c['prompt'],
        _0x3c9210 = 'shot:' + _0x1404e4 + ':prompt';
      (_0x4a37cb['push'](
        createPlanEntry(
          _0x3c9210,
          {
            type: 'source-text',
            name: '镜头片段' + _0x5cabce + '\x20·\x20图像替换提示词',
            content: _0x396796,
            personReplacementBinding: buildBinding(_0x744769, {
              shotId: _0x1404e4,
              kind: 'image-prompt',
              canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
            }),
          },
          { x: _0x563035, y: _0x4092ca },
        ),
      ),
        _0x1385eb['push'](_0x3c9210),
        (_0x563035 += _0x49f83e['width'] + NODE_GAP),
        _0x4a37cb['push'](
          createPlanEntry(
            'shot:' + _0x1404e4 + ':replacement-image',
            applyImageCanvasGeometry(
              buildPersonReplacementImageCanvasNodeData({
                project: _0x744769,
                imageRef: _0x1555ee?.['replacementImageRef'],
                results: getPersonReplacementImageResults(_0x1555ee),
                activeIndex: _0x1555ee?.['replacementImage']?.['activeIndex'],
                name: '镜头片段' + _0x5cabce + ' · 替换结果图',
                prompt: '',
                model: _0x744769['settings']?.['replacementImageModelId'],
                provider: _0x744769['settings']?.['replacementImageProvider'],
                providerProfileId: _0x744769['settings']?.['replacementImageProviderProfileId'],
                providerProfileIdByModel: _0x744769['settings']?.['replacementImageProviderProfileIdByModel'],
                generationParams: _0x744769['settings']?.['replacementImageGenerationParams'],
                allowEmpty: !![],
                binding: {
                  shotId: _0x1404e4,
                  kind: 'replacement-image',
                  canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
                },
              }),
              _0x4cddb2,
            ),
            { x: _0x563035, y: _0x4092ca },
            { width: _0x4cddb2['width'], height: _0x4cddb2['height'], inputKeys: _0x1385eb },
          ),
        ),
        (_0x4092ca += Math['max'](_0x4cddb2['height'], _0x49f83e['height']) + SECTION_GAP));
    }),
    Math['max'](_0x576845 + _0x46306d['height'], _0x4092ca - SECTION_GAP)
  );
}
function appendVideoReplacementStage(_0x4efde6, _0x1571d4, _0x1d0dc4) {
  const _0x3c1f33 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['comment-note'];
  _0x4efde6['push'](
    createPlanEntry(
      'stage:video:annotation',
      buildStageAnnotationNodeData({
        project: _0x1571d4,
        stage: 'video',
        title: '阶段 3 · 视频替换',
        content: '原视频片段与替换结果图共同连到替换视频。',
      }),
      { x: 0x0, y: _0x1d0dc4 },
    ),
  );
  let _0x10cbe9 = _0x1d0dc4 + _0x3c1f33['height'] + NODE_GAP;
  return (
    normalizeList(_0x1571d4['shots'])['forEach']((_0x1d41ed, _0x9f8007) => {
      const _0x714755 = normalizeText(_0x1d41ed?.['id']) || 'shot-' + (_0x9f8007 + 0x1),
        _0x4578a7 = formatSequence(_0x9f8007),
        _0x305136 = [];
      let _0xfd8231 = 0x0;
      const _0x1f9290 = resolveShotVideoCanvasGeometry(_0x1d41ed),
        _0x137e9e =
          resolvePersonReplacementVideoSourceRef(_0x1d41ed) || normalizeText(_0x1d41ed?.['sourceVideoRef']);
      if (_0x137e9e) {
        const _0xd0aacf = 'shot:' + _0x714755 + ':original-video';
        (_0x4efde6['push'](
          createPlanEntry(
            _0xd0aacf,
            applyVideoCanvasGeometry(
              buildPersonReplacementVideoCanvasNodeData({
                project: _0x1571d4,
                videoRef: _0x137e9e,
                name: '镜头片段' + _0x4578a7 + ' · 原视频',
                type: 'source-video',
                binding: {
                  shotId: _0x714755,
                  kind: 'original-video',
                  canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
                },
              }),
              _0x1f9290,
            ),
            { x: _0xfd8231, y: _0x10cbe9 },
            { width: _0x1f9290['width'], height: _0x1f9290['height'] },
          ),
        ),
          _0x305136['push'](_0xd0aacf),
          (_0xfd8231 += _0x1f9290['width'] + NODE_GAP));
      }
      const _0x45a8c2 = 'shot:' + _0x714755 + ':replacement-image';
      (_0x305136['push'](_0x45a8c2),
        _0x4efde6['push'](
          createPlanEntry(
            'shot:' + _0x714755 + ':replacement-video',
            applyVideoCanvasGeometry(
              buildPersonReplacementVideoCanvasNodeData({
                project: _0x1571d4,
                videoRef: _0x1d41ed?.['resultVideoRef'],
                results: getPersonReplacementVideoResults(_0x1d41ed),
                activeIndex: _0x1d41ed?.['replacementVideo']?.['activeIndex'],
                name: '镜头片段' + _0x4578a7 + ' · 替换视频',
                prompt: _0x1d41ed?.['videoPrompt'],
                model: _0x1571d4['settings']?.['replacementModelId'],
                providerProfileId: _0x1571d4['settings']?.['replacementVideoProviderProfileId'],
                providerProfileIdByModel: _0x1571d4['settings']?.['replacementVideoProviderProfileIdByModel'],
                generationParams: _0x1571d4['settings']?.['replacementVideoGenerationParams'],
                allowEmpty: !![],
                binding: {
                  shotId: _0x714755,
                  kind: 'replacement-video',
                  canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
                },
              }),
              _0x1f9290,
            ),
            { x: _0xfd8231, y: _0x10cbe9 },
            { width: _0x1f9290['width'], height: _0x1f9290['height'], inputKeys: _0x305136 },
          ),
        ),
        (_0x10cbe9 += _0x1f9290['height'] + SECTION_GAP));
    }),
    Math['max'](_0x1d0dc4 + _0x3c1f33['height'], _0x10cbe9 - SECTION_GAP)
  );
}
function getVoiceSegments(_0x1c4080 = {}) {
  const _0x5019f0 = [];
  return (
    Object['entries'](asObject(_0x1c4080['audio']?.['voiceStudioState']))['forEach'](
      ([_0xba9e75, _0xa688c7]) => {
        normalizeList(_0xa688c7?.['audioVoiceAnalysis']?.['segments'])['forEach']((_0x57d82d, _0x3ce12b) => {
          _0x5019f0['push']({
            ...asObject(_0x57d82d),
            sourceId: normalizeText(_0xba9e75) || 'source',
            segmentId: normalizeText(_0x57d82d?.['id']) || 'segment-' + (_0x3ce12b + 0x1),
          });
        });
      },
    ),
    _0x5019f0
  );
}
function appendVoiceReplacementStage(_0x309e4c, _0x48fb03, _0x2c760b) {
  const _0x3ffaf5 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['comment-note'],
    _0x4110c0 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['ai-audio'];
  _0x309e4c['push'](
    createPlanEntry(
      'stage:voice:annotation',
      buildStageAnnotationNodeData({
        project: _0x48fb03,
        stage: 'voice',
        title: '阶段 4 · 声音克隆',
        content:
          '使用源音频时，源音频连到替换音频；使用参考音频时，原音频与参考音频共同连到替换音频。总合成音频独立展示。',
      }),
      { x: 0x0, y: _0x2c760b },
    ),
  );
  const _0x27aa4f = _0x2c760b + _0x3ffaf5['height'] + NODE_GAP;
  let _0x3cf89c = _0x27aa4f,
    _0xd4ca75 = _0x2c760b + _0x3ffaf5['height'],
    _0x10d003 = 0x0;
  getVoiceSegments(_0x48fb03)['forEach']((_0x6510bc, _0x3c2594) => {
    const _0x3df0a9 = normalizeText(_0x6510bc['sourceId']),
      _0x130323 = normalizeText(_0x6510bc['segmentId']),
      _0x5a90b5 = formatSequence(_0x3c2594),
      _0x128c56 = [];
    let _0x8d27da = 0x0;
    const _0x1e9b4c = normalizeText(_0x6510bc['sourceAudioLocalPath'] || _0x6510bc['sourceAudioUrl']);
    if (_0x1e9b4c) {
      const _0x459941 = 'voice:' + _0x3df0a9 + ':' + _0x130323 + ':source-audio';
      (_0x309e4c['push'](
        createPlanEntry(
          _0x459941,
          buildPersonReplacementSourceAudioNodeData({
            project: _0x48fb03,
            audioRef: _0x1e9b4c,
            name: '声音片段' + _0x5a90b5 + ' · 原音频片段',
            binding: {
              sourceId: _0x3df0a9,
              segmentId: _0x130323,
              kind: 'source-audio-segment',
              canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
            },
          }),
          { x: _0x8d27da, y: _0x3cf89c },
        ),
      ),
        _0x128c56['push'](_0x459941),
        (_0x8d27da += _0x4110c0['width'] + NODE_GAP));
    }
    const _0x556f6f = normalizeText(_0x6510bc['voiceRefAudioLocalPath'] || _0x6510bc['voiceRefAudioUrl']);
    if (_0x556f6f) {
      const _0x2bb85c = 'voice:' + _0x3df0a9 + ':' + _0x130323 + ':reference-audio';
      (_0x309e4c['push'](
        createPlanEntry(
          _0x2bb85c,
          buildPersonReplacementSourceAudioNodeData({
            project: _0x48fb03,
            audioRef: _0x556f6f,
            name: normalizeText(_0x6510bc['voiceRefName']) || '声音片段' + _0x5a90b5 + ' · 参考音频',
            binding: {
              sourceId: _0x3df0a9,
              segmentId: _0x130323,
              kind: 'reference-audio',
              canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
            },
          }),
          { x: _0x8d27da, y: _0x3cf89c },
        ),
      ),
        _0x128c56['push'](_0x2bb85c),
        (_0x8d27da += _0x4110c0['width'] + NODE_GAP));
    }
    const _0x432e65 = 'voice:' + _0x3df0a9 + ':' + _0x130323 + ':replacement-audio';
    (_0x309e4c['push'](
      createPlanEntry(
        _0x432e65,
        buildPersonReplacementAudioCanvasNodeData({
          project: _0x48fb03,
          audioRef: _0x6510bc['convertedAudioLocalPath'] || _0x6510bc['convertedAudioUrl'],
          name: '声音片段' + _0x5a90b5 + ' · 替换音频',
          prompt: _0x6510bc['targetText'] || _0x6510bc['sourceText'],
          model: _0x6510bc['voiceModelId'],
          allowEmpty: !![],
          binding: {
            sourceId: _0x3df0a9,
            segmentId: _0x130323,
            kind: 'replacement-audio-segment',
            canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
          },
        }),
        { x: _0x8d27da, y: _0x3cf89c },
        { inputKeys: _0x128c56 },
      ),
    ),
      (_0x10d003 = Math['max'](_0x10d003, _0x8d27da + _0x4110c0['width'])),
      (_0xd4ca75 = Math['max'](_0xd4ca75, _0x3cf89c + _0x4110c0['height'])),
      (_0x3cf89c += _0x4110c0['height'] + SECTION_GAP));
  });
  const _0x5f3c76 = normalizeText(_0x48fb03['audio']?.['replacementAudioRef']);
  if (_0x5f3c76) {
    const _0x5ad721 = _0x10d003 ? _0x10d003 + NODE_GAP : 0x0;
    (_0x309e4c['push'](
      createPlanEntry(
        'voice:timeline',
        buildPersonReplacementSourceAudioNodeData({
          project: _0x48fb03,
          audioRef: _0x5f3c76,
          name: '替换音频 · 总合成音频',
          binding: {
            kind: 'replacement-audio-timeline',
            canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
          },
        }),
        { x: _0x5ad721, y: _0x27aa4f },
      ),
    ),
      (_0xd4ca75 = Math['max'](_0xd4ca75, _0x27aa4f + _0x4110c0['height'])));
  }
  return _0xd4ca75;
}
function appendCompositeStage(_0x3dd4f1, _0x7cc246, _0x57498a) {
  const _0x14f8f5 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['comment-note'],
    _0x2049b3 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['source-video'];
  _0x3dd4f1['push'](
    createPlanEntry(
      'stage:composite:annotation',
      buildStageAnnotationNodeData({
        project: _0x7cc246,
        stage: 'composite',
        title: '阶段\x205\x20·\x20最终合成对比',
        content: '原视频与最终替换视频用于效果对比。',
      }),
      { x: 0x0, y: _0x57498a },
    ),
  );
  const _0xc9713c = _0x57498a + _0x14f8f5['height'] + NODE_GAP;
  let _0x247386 = 0x0;
  const _0x4cbdec = normalizeList(_0x7cc246['sources']),
    _0x63d30b = _0x4cbdec['findIndex']((_0x167c39) => normalizeText(_0x167c39?.['videoRef']));
  if (_0x63d30b >= 0x0) {
    const _0xeb160b = _0x4cbdec[_0x63d30b],
      _0x352a32 = normalizeText(_0xeb160b['videoRef']),
      _0x12f86c = normalizeText(_0xeb160b?.['id']) || 'source-' + (_0x63d30b + 0x1);
    (_0x3dd4f1['push'](
      createPlanEntry(
        'project:source:' + _0x12f86c + ':comparison-video',
        buildPersonReplacementVideoCanvasNodeData({
          project: _0x7cc246,
          videoRef: _0x352a32,
          name: '原视频 · 对比',
          type: 'source-video',
          binding: {
            sourceId: _0x12f86c,
            kind: 'comparison-source-video',
            canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
          },
        }),
        { x: _0x247386 * (_0x2049b3['width'] + NODE_GAP), y: _0xc9713c },
      ),
    ),
      (_0x247386 += 0x1));
  }
  const _0x3b84c1 = normalizeText(
    _0x7cc246['output']?.['finalVideoRef'] || _0x7cc246['output']?.['visualMasterRef'],
  );
  return (
    _0x3b84c1 &&
      _0x3dd4f1['push'](
        createPlanEntry(
          'project:composite-output',
          buildPersonReplacementVideoCanvasNodeData({
            project: _0x7cc246,
            videoRef: _0x3b84c1,
            name: (normalizeText(_0x7cc246['title']) || '人物替换项目') + ' · 最终替换视频',
            type: 'source-video',
            binding: { kind: 'composite-output', canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'] },
          }),
          { x: _0x247386 * (_0x2049b3['width'] + NODE_GAP), y: _0xc9713c },
        ),
      ),
    _0xc9713c + _0x2049b3['height']
  );
}
export function buildPersonReplacementOutputCanvasNodeData({
  project: project = {},
  videoRef: videoRef = '',
} = {}) {
  return buildPersonReplacementVideoCanvasNodeData({
    project: project,
    videoRef: videoRef,
    name: (normalizeText(project['title']) || '人物替换项目') + ' · 合成视频',
    type: 'source-video',
    binding: { kind: 'composite-output', canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'] },
  });
}
function buildReplacementClipPlan(_0x451105, _0x74cca2) {
  const _0xe9e051 = [];
  let _0x159630 = 0x0;
  return (
    normalizeList(_0x451105['shots'])['forEach']((_0x1517ce, _0x43a1ca) => {
      const _0x1e57b2 = normalizeText(_0x1517ce?.['resultVideoRef']);
      if (!_0x1e57b2) return;
      const _0x4c3914 = normalizeText(_0x1517ce?.['id']) || 'shot-' + (_0x43a1ca + 0x1),
        _0x1af21c = resolveShotVideoCanvasGeometry(_0x1517ce);
      (_0xe9e051['push'](
        createPlanEntry(
          'shot:' + _0x4c3914 + ':replacement-video',
          applyVideoCanvasGeometry(
            buildPersonReplacementVideoCanvasNodeData({
              project: _0x451105,
              videoRef: _0x1e57b2,
              name: '镜头片段' + formatSequence(_0x43a1ca) + ' · 替换视频',
              results: getPersonReplacementVideoResults(_0x1517ce),
              activeIndex: _0x1517ce?.['replacementVideo']?.['activeIndex'],
              binding: { shotId: _0x4c3914, kind: 'replacement-video', canvasScope: _0x74cca2 },
            }),
            _0x1af21c,
          ),
          { x: _0x159630, y: 0x0 },
          { width: _0x1af21c['width'], height: _0x1af21c['height'] },
        ),
      ),
        (_0x159630 += _0x1af21c['width'] + NODE_GAP));
    }),
    _0xe9e051
  );
}
function getPlanBounds(_0x24d03c) {
  const _0x38c294 = normalizeList(_0x24d03c);
  if (!_0x38c294['length']) return { left: 0x0, top: 0x0, right: 0x0, bottom: 0x0, width: 0x0, height: 0x0 };
  const _0x4e5610 = Math['min'](..._0x38c294['map']((_0x459a37) => _0x459a37['position']['x'])),
    _0x48165f = Math['min'](..._0x38c294['map']((_0x2ab7e4) => _0x2ab7e4['position']['y'])),
    _0x6cec0d = Math['max'](
      ..._0x38c294['map']((_0x493955) => _0x493955['position']['x'] + _0x493955['width']),
    ),
    _0xe3ddde = Math['max'](
      ..._0x38c294['map']((_0x1c9ef1) => _0x1c9ef1['position']['y'] + _0x1c9ef1['height']),
    );
  return {
    left: _0x4e5610,
    top: _0x48165f,
    right: _0x6cec0d,
    bottom: _0xe3ddde,
    width: _0x6cec0d - _0x4e5610,
    height: _0xe3ddde - _0x48165f,
  };
}
function wrapStageEntriesInGroup({
  entries: _0xb16a0f,
  project: _0x10e369,
  stage: _0x54225f,
  name: _0x2dd5b2,
  canvasScope: canvasScope = PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
} = {}) {
  const _0x3decb6 = normalizeList(_0xb16a0f)['filter']((_0x4d866e) => _0x4d866e['type'] !== 'group');
  if (!_0x3decb6['length']) return [];
  const _0x116d2b = 'stage:' + normalizeText(_0x54225f) + ':group',
    _0x308263 = calculateGroupNodeBounds(
      _0x3decb6['map']((_0x3ef99d) => ({
        x: _0x3ef99d['position']['x'],
        y: _0x3ef99d['position']['y'],
        width: _0x3ef99d['width'],
        height: _0x3ef99d['height'],
      })),
    ),
    _0x127571 = createPlanEntry(
      _0x116d2b,
      {
        type: 'group',
        name: normalizeText(_0x2dd5b2),
        color: STAGE_GROUP_COLORS[normalizeText(_0x54225f)] || 'var(--indigo)',
        width: _0x308263['width'],
        height: _0x308263['height'],
        personReplacementBinding: buildBinding(_0x10e369, {
          kind: 'stage-group',
          stage: normalizeText(_0x54225f),
          canvasScope: canvasScope,
        }),
      },
      { x: _0x308263['x'], y: _0x308263['y'] },
      { width: _0x308263['width'], height: _0x308263['height'] },
    );
  return [_0x127571, ..._0x3decb6['map']((_0x3c56e6) => ({ ..._0x3c56e6, parentKey: _0x116d2b }))];
}
function appendHorizontalStage(_0x33baf7, _0x325eba, _0x2498f2) {
  const _0x90ef8b = getPlanBounds(_0x325eba),
    _0x26ab6e = _0x2498f2 - _0x90ef8b['left'],
    _0x1613bb = -_0x90ef8b['top'];
  return (
    _0x33baf7['push'](
      ..._0x325eba['map']((_0x543db3) => ({
        ..._0x543db3,
        position: { x: _0x543db3['position']['x'] + _0x26ab6e, y: _0x543db3['position']['y'] + _0x1613bb },
      })),
    ),
    _0x2498f2 + _0x90ef8b['width'] + STAGE_GAP
  );
}
function buildProjectCanvasPlan(_0x2c778b) {
  const _0x1e5233 = [],
    _0x9a7f51 = getCharacterAppearanceRecords(_0x2c778b),
    _0x2443b4 = normalizeWorkspaceStep(_0x2c778b);
  let _0x45b669 = 0x0;
  const _0x193402 = ({ stage: _0x2a2cc9, name: _0x587388, buildStage: _0x42d519 }) => {
    const _0x18d017 = [];
    _0x42d519(_0x18d017);
    const _0x5c474b = wrapStageEntriesInGroup({
      entries: _0x18d017,
      project: _0x2c778b,
      stage: _0x2a2cc9,
      name: _0x587388,
    });
    _0x45b669 = appendHorizontalStage(_0x1e5233, _0x5c474b, _0x45b669);
  };
  return (
    _0x193402({
      stage: 'assets',
      name: '阶段 1 · 素材设定',
      buildStage: (_0x37384c) => {
        appendAssetStage(_0x37384c, _0x2c778b, 0x0, _0x9a7f51);
      },
    }),
    _0x2443b4 >= 0x2 &&
      _0x193402({
        stage: 'image',
        name: '阶段 2 · 图像替换',
        buildStage: (_0x5eded6) => {
          appendImageReplacementStage(_0x5eded6, _0x2c778b, 0x0, _0x9a7f51);
        },
      }),
    _0x2443b4 >= 0x3 &&
      _0x193402({
        stage: 'video',
        name: '阶段\x203\x20·\x20视频替换',
        buildStage: (_0x3d8e9e) => {
          appendVideoReplacementStage(_0x3d8e9e, _0x2c778b, 0x0);
        },
      }),
    _0x2443b4 >= 0x4 &&
      _0x193402({
        stage: 'voice',
        name: '阶段\x204\x20·\x20声音克隆',
        buildStage: (_0x244290) => {
          appendVoiceReplacementStage(_0x244290, _0x2c778b, 0x0);
        },
      }),
    _0x2443b4 >= 0x5 &&
      _0x193402({
        stage: 'composite',
        name: '阶段 5 · 合成视频',
        buildStage: (_0x4546c6) => {
          appendCompositeStage(_0x4546c6, _0x2c778b, 0x0);
        },
      }),
    _0x1e5233
  );
}
function clonePlanEntryForScope(_0x5c89ff, _0x3af52f, _0x37071b) {
  const _0x27c3bc = asObject(_0x5c89ff['data']?.['personReplacementBinding']),
    _0x36211b = normalizeList(_0x5c89ff['inputKeys'])
      ['map'](normalizeText)
      ['filter']((_0x573c62) => _0x37071b['has'](_0x573c62)),
    _0x3a117f = normalizeText(_0x5c89ff['parentKey']),
    _0x22bef8 = {
      ..._0x5c89ff,
      data: { ..._0x5c89ff['data'], personReplacementBinding: { ..._0x27c3bc, canvasScope: _0x3af52f } },
    };
  (delete _0x22bef8['inputKeys'], delete _0x22bef8['parentKey']);
  if (_0x36211b['length']) _0x22bef8['inputKeys'] = _0x36211b;
  if (_0x3a117f && _0x37071b['has'](_0x3a117f)) _0x22bef8['parentKey'] = _0x3a117f;
  return _0x22bef8;
}
function normalizePlanOrigin(_0x4bd3a8) {
  const _0x428b43 = Math['min'](
      ..._0x4bd3a8['map']((_0x3645b7) => Number(_0x3645b7['position']?.['x']) || 0x0),
    ),
    _0x239c72 = Math['min'](..._0x4bd3a8['map']((_0x349fcc) => Number(_0x349fcc['position']?.['y']) || 0x0));
  return _0x4bd3a8['map']((_0x126e02) => ({
    ..._0x126e02,
    position: {
      x: (Number(_0x126e02['position']?.['x']) || 0x0) - _0x428b43,
      y: (Number(_0x126e02['position']?.['y']) || 0x0) - _0x239c72,
    },
  }));
}
function reflowCurrentVideoPlan(_0x27b734, _0x1e04da) {
  const _0x45e31d = _0x27b734['find']((_0x54fe82) => _0x54fe82['key'] === 'stage:video:annotation'),
    _0x290aa7 = new Map(_0x27b734['map']((_0x5a72c3) => [_0x5a72c3['key'], _0x5a72c3]));
  let _0x28016e = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['comment-note']['height'] + NODE_GAP;
  const _0x9df79a = _0x45e31d ? [{ ..._0x45e31d, position: { x: 0x0, y: 0x0 }, parentKey: '' }] : [];
  return (
    normalizeList(_0x1e04da['shots'])['forEach']((_0x26fa90, _0x1894cc) => {
      const _0x17dea7 = normalizeText(_0x26fa90?.['id']) || 'shot-' + (_0x1894cc + 0x1),
        _0x3682f9 = _0x290aa7['get']('shot:' + _0x17dea7 + ':original-video'),
        _0x110921 = _0x290aa7['get']('shot:' + _0x17dea7 + ':replacement-image'),
        _0xdb4c73 = _0x290aa7['get']('shot:' + _0x17dea7 + ':replacement-video');
      let _0x14f424 = 0x0,
        _0x55ae4b = Math['max'](
          Number(_0x110921?.['height']) || 0x0,
          Number(_0x3682f9?.['height']) || 0x0,
          Number(_0xdb4c73?.['height']) || 0x0,
          PERSON_REPLACEMENT_CANVAS_NODE_SIZES['ai-video']['height'],
        );
      (_0x110921 &&
        (_0x9df79a['push']({ ..._0x110921, position: { x: _0x14f424, y: _0x28016e }, parentKey: '' }),
        (_0x14f424 += _0x110921['width'] + NODE_GAP),
        (_0x55ae4b = Math['max'](_0x55ae4b, _0x110921['height']))),
        _0x3682f9 &&
          (_0x9df79a['push']({ ..._0x3682f9, position: { x: _0x14f424, y: _0x28016e }, parentKey: '' }),
          (_0x14f424 += _0x3682f9['width'] + NODE_GAP)),
        _0xdb4c73 &&
          _0x9df79a['push']({ ..._0xdb4c73, position: { x: _0x14f424, y: _0x28016e }, parentKey: '' }),
        (_0x28016e += _0x55ae4b + SECTION_GAP));
    }),
    normalizePlanOrigin(
      wrapStageEntriesInGroup({
        entries: _0x9df79a,
        project: _0x1e04da,
        stage: 'video',
        name: '阶段 3 · 视频替换',
        canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'],
      }),
    )
  );
}
function buildCurrentInterfacePlan(_0x471448) {
  const _0x2f0c21 = normalizeWorkspaceStep(_0x471448),
    _0x56e0f2 = buildProjectCanvasPlan(_0x471448),
    _0x5e2c1f = (_0x5a587a) => {
      if (_0x2f0c21 === 0x1)
        return _0x5a587a['key']['startsWith']('stage:assets:') || _0x5a587a['key']['startsWith']('asset:');
      if (_0x2f0c21 === 0x2)
        return (
          _0x5a587a['key']['startsWith']('stage:assets:') ||
          _0x5a587a['key']['startsWith']('asset:') ||
          _0x5a587a['key']['startsWith']('stage:image:') ||
          /^shot:[^:]+:(?:keyframe|location-guide|prompt|replacement-image)$/['test'](_0x5a587a['key'])
        );
      if (_0x2f0c21 === 0x3)
        return (
          _0x5a587a['key']['startsWith']('stage:video:') ||
          /^shot:[^:]+:(?:replacement-image|original-video|replacement-video)$/['test'](_0x5a587a['key'])
        );
      if (_0x2f0c21 === 0x4)
        return _0x5a587a['key']['startsWith']('stage:voice:') || _0x5a587a['key']['startsWith']('voice:');
      return ![];
    },
    _0x3bca49 = _0x56e0f2['filter'](_0x5e2c1f),
    _0x87412b = new Set(_0x3bca49['map']((_0x2a473d) => _0x2a473d['key'])),
    _0x1b586a = _0x3bca49['map']((_0x3c5f90) =>
      clonePlanEntryForScope(_0x3c5f90, PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'], _0x87412b),
    );
  return _0x2f0c21 === 0x3 ? reflowCurrentVideoPlan(_0x1b586a, _0x471448) : normalizePlanOrigin(_0x1b586a);
}
export function buildPersonReplacementCanvasPlan({
  project: project = {},
  scope: scope = PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'],
} = {}) {
  const _0x40bc42 = normalizeScope(scope);
  if (_0x40bc42 === PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'])
    return normalizeWorkspaceStep(project) < 0x5
      ? buildCurrentInterfacePlan(project)
      : buildReplacementClipPlan(project, _0x40bc42);
  return buildProjectCanvasPlan(project);
}
function buildPlanLayout(_0x3319ba = []) {
  return Object['fromEntries'](
    normalizeList(_0x3319ba)['map']((_0x423db7) => [
      _0x423db7['key'],
      {
        x: Number(_0x423db7['position']?.['x']) || 0x0,
        y: Number(_0x423db7['position']?.['y']) || 0x0,
        width: Number(_0x423db7['width']) || 0x0,
        height: Number(_0x423db7['height']) || 0x0,
      },
    ]),
  );
}
function hasSameGeometry(_0x6ddced = {}, _0x46c0b9 = {}) {
  return (
    Number(_0x6ddced['x']) === Number(_0x46c0b9['x']) &&
    Number(_0x6ddced['y']) === Number(_0x46c0b9['y']) &&
    Number(_0x6ddced['width']) === Number(_0x46c0b9['width']) &&
    Number(_0x6ddced['height']) === Number(_0x46c0b9['height'])
  );
}
async function shouldReflowManagedNodes({
  plan: plan = [],
  planLayout: planLayout = {},
  previousBinding: previousBinding = {},
  adapter: _0x111e3d,
  canvasId: canvasId = '',
} = {}) {
  const _0x389f4b = asObject(previousBinding['nodes']),
    _0x340b3e = plan['map']((_0x2e2c56) => _0x2e2c56['key']),
    _0x418c20 = Object['keys'](_0x389f4b);
  if (
    _0x340b3e['length'] !== _0x418c20['length'] ||
    _0x340b3e['some']((_0x51de38) => !normalizeText(_0x389f4b[_0x51de38])) ||
    _0x418c20['some']((_0xd95d21) => !(_0xd95d21 in planLayout))
  )
    return !![];
  const _0x5388ac = asObject(previousBinding['layout']);
  if (Object['keys'](_0x5388ac)['length'])
    return _0x340b3e['some'](
      (_0x3248cc) => !hasSameGeometry(asObject(_0x5388ac[_0x3248cc]), asObject(planLayout[_0x3248cc])),
    );
  if (typeof _0x111e3d?.['getNode'] !== 'function') return ![];
  for (const _0xbd8759 of plan) {
    const _0x5a2590 = normalizeText(_0x389f4b[_0xbd8759['key']]);
    if (!_0x5a2590 || !(await _0x111e3d['nodeExists'](_0x5a2590, canvasId))) return !![];
    const _0x41154c = await _0x111e3d['getNode'](_0x5a2590, canvasId);
    if (
      Number(_0x41154c?.['width']) !== Number(_0xbd8759['width']) ||
      Number(_0x41154c?.['height']) !== Number(_0xbd8759['height'])
    )
      return !![];
  }
  return !![];
}
async function rollbackCanvasMutation({
  adapter: _0x38f451,
  canvasId: canvasId = '',
  reused: reused = ![],
  mutationSnapshot: _0x2c75fe,
} = {}) {
  if (!reused && typeof _0x38f451?.['deleteCanvas'] === 'function')
    try {
      const _0x4509b6 = await _0x38f451['deleteCanvas'](canvasId, { skipDirtyConfirm: !![] });
      if (_0x4509b6 !== ![]) return !![];
    } catch {}
  if (typeof _0x38f451?.['restoreMutationSnapshot'] === 'function' && _0x2c75fe)
    try {
      return (await _0x38f451['restoreMutationSnapshot'](_0x2c75fe, { canvasId: canvasId })) !== ![];
    } catch {}
  return ![];
}
export async function syncPersonReplacementCanvas({
  project: project = {},
  scope: scope = PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'],
  adapter: _0x557913,
  saveOutputBlob: saveOutputBlob = null,
  createLocationGuide: _0x441452,
} = {}) {
  const _0x1928dd = [
    'canvasExists',
    'switchCanvas',
    'createCanvas',
    'nodeExists',
    'createNode',
    'updateNode',
  ];
  if (_0x1928dd['some']((_0xd66f73) => typeof _0x557913?.[_0xd66f73] !== 'function'))
    throw new Error('人物替换画布适配器不完整');
  const _0x50ccb8 = normalizeScope(scope),
    _0x3ce8f1 = normalizeWorkspaceStep(project),
    _0x32458e = _0x50ccb8 === PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'] || _0x3ce8f1 <= 0x2,
    _0x4f8ae5 =
      _0x50ccb8 === PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'] || _0x3ce8f1 === 0x2 || _0x3ce8f1 === 0x3,
    [_0x1221d8, _0x566379] = await Promise['all']([
      _0x32458e ? resolveProjectAppearanceImageSizes(project) : project,
      _0x4f8ae5 ? resolveProjectShotImageSizes(project) : project,
    ]),
    _0x42bd3c = { ...project, characters: _0x1221d8['characters'], shots: _0x566379['shots'] },
    _0x41b388 = buildPersonReplacementCanvasPlan({ project: _0x42bd3c, scope: _0x50ccb8 });
  if (!_0x41b388['length']) throw new Error('当前项目还没有可同步到画布的内容。');
  if (
    _0x41b388['some']((_0x5c6f93) => _0x5c6f93['parentKey']) &&
    typeof _0x557913?.['setNodeParent'] !== 'function'
  )
    throw new Error('人物替换画布适配器缺少节点分组能力');
  if (
    _0x41b388['some']((_0x243f10) => normalizeList(_0x243f10['inputKeys'])['length']) &&
    typeof _0x557913?.['connectNodes'] !== 'function'
  )
    throw new Error('人物替换画布适配器缺少节点连线能力');
  const _0x2cde96 = normalizeText(project['title']) || '人物替换项目',
    _0x4219e1 =
      _0x50ccb8 === PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'] && _0x3ce8f1 < 0x5
        ? _0x2cde96 + ' · ' + getWorkspaceStepName(_0x3ce8f1)
        : _0x2cde96,
    _0xd0d13e = asObject(project['output']?.['canvasBinding']),
    _0x130b46 = normalizeText(_0xd0d13e['canvasId']),
    _0x569d28 = normalizeText(_0xd0d13e['scope']) === _0x50ccb8,
    _0x3eaa92 =
      _0x50ccb8 !== PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'] ||
      Math['trunc'](Number(_0xd0d13e['workspaceStep']) || 0x0) === _0x3ce8f1,
    _0x164fe9 =
      Math['trunc'](Number(_0xd0d13e['layoutVersion']) || 0x0) === PERSON_REPLACEMENT_CANVAS_LAYOUT_VERSION,
    _0x551849 = Boolean(
      _0x130b46 && _0x569d28 && _0x3eaa92 && _0x164fe9 && (await _0x557913['canvasExists'](_0x130b46)),
    );
  let _0x7bd8a2 = '';
  if (_0x551849) {
    const _0x2d9b12 = await _0x557913['switchCanvas'](_0x130b46);
    if (_0x2d9b12 === ![]) throw new Error('无法切换到已绑定的人物替换画布：' + _0x130b46);
    _0x7bd8a2 = _0x130b46;
  } else _0x7bd8a2 = normalizeText(await _0x557913['createCanvas'](_0x4219e1));
  if (!_0x7bd8a2) throw new Error('新建人物替换画布后未获得活动画布 ID');
  const _0x385155 = asObject(_0xd0d13e['nodes']),
    _0x4213cd = buildPlanLayout(_0x41b388),
    _0x11fa68 = _0x551849
      ? await shouldReflowManagedNodes({
          plan: _0x41b388,
          planLayout: _0x4213cd,
          previousBinding: _0xd0d13e,
          adapter: _0x557913,
          canvasId: _0x7bd8a2,
        })
      : ![],
    _0x3a3247 = {},
    _0x4238d1 = [];
  let _0x5640a2 = 0x0,
    _0x1dab5a = 0x0,
    _0x50601c = 0x0;
  const _0x43cda5 = 'person-replacement:' + (normalizeText(project['id']) || _0x7bd8a2),
    _0x27e207 = await _0x557913['createMutationSnapshot']?.({ canvasId: _0x7bd8a2 });
  try {
    await materializePersonReplacementLocationGuides({
      plan: _0x41b388,
      project: _0x42bd3c,
      adapter: _0x557913,
      canReuseCanvas: _0x551849,
      previousNodes: _0x385155,
      canvasId: _0x7bd8a2,
      saveOutputBlob: saveOutputBlob,
      createLocationGuide: _0x441452,
    });
    if (_0x551849) {
      const _0xb2e4c1 = [];
      for (const [_0x19998a, _0x28b27c] of Object['entries'](_0x385155)) {
        if (_0x19998a in _0x4213cd) continue;
        const _0x19867c = normalizeText(_0x28b27c);
        _0x19867c && (await _0x557913['nodeExists'](_0x19867c, _0x7bd8a2)) && _0xb2e4c1['push'](_0x19867c);
      }
      if (_0xb2e4c1['length']) {
        if (typeof _0x557913['deleteNodes'] !== 'function')
          throw new Error('人物替换画布适配器缺少托管节点清理能力');
        const _0x230f1b = await _0x557913['deleteNodes']([...new Set(_0xb2e4c1)], { canvasId: _0x7bd8a2 });
        if (_0x230f1b === ![]) throw new Error('清理已失效的人物替换画布节点失败');
        _0x50601c = new Set(_0xb2e4c1)['size'];
      }
    }
    for (const _0x575e56 of _0x41b388) {
      const _0x37f4d5 = normalizeText(_0x385155[_0x575e56['key']]),
        _0xa2b9e9 = Boolean(_0x551849 && _0x37f4d5 && (await _0x557913['nodeExists'](_0x37f4d5, _0x7bd8a2))),
        _0x40e6eb = _0xa2b9e9
          ? await _0x557913['updateNode'](_0x37f4d5, _0x575e56['data'], {
              canvasId: _0x7bd8a2,
              key: _0x575e56['key'],
              type: _0x575e56['type'],
              width: _0x575e56['width'],
              height: _0x575e56['height'],
              ...(_0x11fa68 ? { position: _0x575e56['position'] } : {}),
            })
          : await _0x557913['createNode'](_0x575e56['data'], {
              canvasId: _0x7bd8a2,
              key: _0x575e56['key'],
              type: _0x575e56['type'],
              width: _0x575e56['width'],
              height: _0x575e56['height'],
              position: _0x575e56['position'],
              sequenceKey: _0x43cda5,
              parentNodeId: normalizeText(_0x3a3247[_0x575e56['parentKey']]),
            });
      if (_0xa2b9e9) _0x1dab5a += 0x1;
      else _0x5640a2 += 0x1;
      const _0x2eee62 = normalizeText(_0x40e6eb?.['id'] || (_0xa2b9e9 ? _0x37f4d5 : ''));
      if (!_0x2eee62)
        throw new Error('同步人物替换画布节点失败：' + (_0x575e56['data']['name'] || _0x575e56['key']));
      ((_0x3a3247[_0x575e56['key']] = _0x2eee62),
        _0x4238d1['push']({ ..._0x575e56, nodeId: _0x2eee62, node: _0x40e6eb }));
    }
    for (const _0x7a8a4c of _0x41b388) {
      if (!_0x7a8a4c['parentKey']) continue;
      const _0x586903 = normalizeText(_0x3a3247[_0x7a8a4c['key']]),
        _0x5bf115 = normalizeText(_0x3a3247[_0x7a8a4c['parentKey']]);
      if (!_0x586903 || !_0x5bf115) throw new Error('人物替换画布分组缺少节点：' + _0x7a8a4c['key']);
      const _0x4da7b8 = await _0x557913['setNodeParent'](_0x586903, _0x5bf115, { canvasId: _0x7bd8a2 });
      if (_0x4da7b8 === ![]) throw new Error('人物替换画布节点分组失败：' + _0x7a8a4c['key']);
    }
    for (const _0x36b0ae of _0x41b388) {
      const _0x4a8a0c = normalizeText(_0x3a3247[_0x36b0ae['key']]);
      for (const _0xc4ab61 of normalizeList(_0x36b0ae['inputKeys'])) {
        const _0x7bffd8 = normalizeText(_0x3a3247[_0xc4ab61]);
        if (!_0x7bffd8 || !_0x4a8a0c)
          throw new Error('人物替换画布连线缺少节点：' + _0xc4ab61 + ' → ' + _0x36b0ae['key']);
        const _0x4dde1e = await _0x557913['connectNodes'](_0x7bffd8, _0x4a8a0c, {
          canvasId: _0x7bd8a2,
          sourceKey: _0xc4ab61,
          targetKey: _0x36b0ae['key'],
        });
        if (_0x4dde1e === ![])
          throw new Error('人物替换画布节点连线失败：' + _0xc4ab61 + ' → ' + _0x36b0ae['key']);
      }
    }
    (await _0x557913['renameCanvas']?.(_0x7bd8a2, _0x4219e1),
      _0x557913['commit']?.(),
      typeof _0x557913['focusNodes'] === 'function' &&
        (await _0x557913['focusNodes'](
          _0x4238d1['map']((_0x680864) => _0x680864['nodeId']),
          { padding: 0x50, durationMs: 0x0, maxZoom: 0.2 },
        )));
  } catch (_0x19eeab) {
    await rollbackCanvasMutation({
      adapter: _0x557913,
      canvasId: _0x7bd8a2,
      reused: _0x551849,
      mutationSnapshot: _0x27e207,
    });
    throw _0x19eeab;
  }
  const _0x228eaf = {
    canvasId: _0x7bd8a2,
    scope: _0x50ccb8,
    workspaceStep: _0x3ce8f1,
    layoutVersion: PERSON_REPLACEMENT_CANVAS_LAYOUT_VERSION,
    nodes: _0x3a3247,
    layout: _0x4213cd,
  };
  return {
    canvasId: _0x7bd8a2,
    canvasName: _0x4219e1,
    scope: _0x50ccb8,
    nodes: _0x4238d1,
    reused: _0x551849,
    reflowed: _0x11fa68,
    createdCount: _0x5640a2,
    updatedCount: _0x1dab5a,
    deletedCount: _0x50601c,
    binding: _0x228eaf,
    canvasBinding: _0x228eaf,
  };
}
