import {
  STORY_CLIP_MEDIA_TYPE_IMAGE,
  STORY_CLIP_MEDIA_TYPE_VIDEO,
  getStoryClipFrameMediaType,
  normalizeStoryClipFrame,
  normalizeStoryClipFrames,
  resolveStoryClipFrameImageUrl,
  resolveStoryClipFrameMediaUrl,
  upsertStoryClipFrame,
} from './storyClipFrames.js';
const IMAGE_NODE_TYPES = new Set(['source-image', 'ai-image', 'image']),
  VIDEO_NODE_TYPES = new Set(['source-video', 'ai-video', 'video']);
function asObject(_0x1b948b) {
  return _0x1b948b && typeof _0x1b948b === 'object' && !Array['isArray'](_0x1b948b) ? _0x1b948b : {};
}
function normalizeText(_0x207241) {
  return String(_0x207241 || '')['trim']();
}
function normalizeIndex(_0x500ba0, _0x4efd3e) {
  const _0x170f54 = Math['trunc'](Number(_0x500ba0));
  if (!Number['isFinite'](_0x170f54) || _0x4efd3e <= 0x0) return 0x0;
  return Math['max'](0x0, Math['min'](_0x4efd3e - 0x1, _0x170f54));
}
function firstText(..._0x19ee4f) {
  return _0x19ee4f['map'](normalizeText)['find'](Boolean) || '';
}
function hashText(_0x350e98) {
  let _0x4a78be = 0x811c9dc5;
  for (const _0x11f1a5 of String(_0x350e98 || '')) {
    ((_0x4a78be ^= _0x11f1a5['charCodeAt'](0x0)), (_0x4a78be = Math['imul'](_0x4a78be, 0x1000193)));
  }
  return (_0x4a78be >>> 0x0)['toString'](0x24);
}
function withoutNodeType(_0x5ae6c1) {
  const _0x213b30 = { ...asObject(_0x5ae6c1) };
  return (delete _0x213b30['type'], _0x213b30);
}
function getActiveMediaItem(_0x390b47, _0x5c8298, _0xe6be8d) {
  const _0x597f57 = Array['isArray'](_0x390b47?.[_0x5c8298]) ? _0x390b47[_0x5c8298] : [],
    _0x3c6313 = _0xe6be8d['map']((_0x12fe7d) => _0x390b47?.[_0x12fe7d])['find'](
      (_0x39d704) => _0x39d704 !== undefined,
    );
  return asObject(_0x597f57[normalizeIndex(_0x3c6313, _0x597f57['length'])]);
}
function buildCanvasMediaFrameId(_0x13e39b, _0x145e13) {
  return 'story-canvas-media-' + hashText(normalizeText(_0x13e39b) + ':' + normalizeText(_0x145e13));
}
function findEpisodeContext(
  _0x43cd4b,
  {
    binding: binding = {},
    existingFrame: existingFrame = null,
    episodeId: episodeId = '',
    clipId: clipId = '',
  } = {},
) {
  const _0x4094b7 = Array['isArray'](_0x43cd4b?.['episodes']) ? _0x43cd4b['episodes'] : [],
    _0x5477ed = firstText(binding['clipFrameClipId'], binding['clipId'], existingFrame?.['clipId'], clipId),
    _0x289da7 = firstText(
      binding['clipFrameEpisodeId'],
      binding['episodeId'],
      existingFrame?.['episodeId'],
      episodeId,
    );
  let _0x5e1e54 = _0x4094b7['find']((_0x409e5b) => normalizeText(_0x409e5b?.['id']) === _0x289da7);
  !_0x5e1e54 &&
    _0x5477ed &&
    (_0x5e1e54 = _0x4094b7['find'](
      (_0x791ee1) =>
        Array['isArray'](_0x791ee1?.['clips']) &&
        _0x791ee1['clips']['some']((_0x27768a) => normalizeText(_0x27768a?.['id']) === _0x5477ed),
    ));
  _0x5e1e54 ||= _0x4094b7[0x0] || null;
  const _0x1cf869 = Array['isArray'](_0x5e1e54?.['clips']) ? _0x5e1e54['clips'] : [],
    _0x2c7313 =
      _0x1cf869['find']((_0x34b333) => normalizeText(_0x34b333?.['id']) === _0x5477ed) ||
      _0x1cf869[0x0] ||
      null;
  return { episode: _0x5e1e54, clip: _0x2c7313 };
}
export function isStoryCanvasMediaNode(_0x48d70a = {}) {
  const _0x3b5518 = normalizeText(_0x48d70a['type']);
  return IMAGE_NODE_TYPES['has'](_0x3b5518) || VIDEO_NODE_TYPES['has'](_0x3b5518);
}
function isStoryWorkspaceClipVideoNode(_0x2f99ef = {}) {
  return (
    VIDEO_NODE_TYPES['has'](normalizeText(_0x2f99ef['type'])) &&
    normalizeText(_0x2f99ef['storyWorkspaceBinding']?.['kind']) === 'clip-video'
  );
}
export function resolveStoryCanvasNodeMedia(_0x4bbc6d = {}) {
  const _0xda7451 = normalizeText(_0x4bbc6d['type']);
  if (IMAGE_NODE_TYPES['has'](_0xda7451)) {
    const _0x52e2d0 = getActiveMediaItem(_0x4bbc6d, 'images', ['mainImageIndex', 'activeImageIndex']),
      _0x56cabb = firstText(
        _0x52e2d0['imageUrl'],
        _0x52e2d0['url'],
        _0x4bbc6d['imageUrl'],
        _0x4bbc6d['src'],
        _0x4bbc6d['url'],
        _0x52e2d0['sourceUrl'],
        _0x4bbc6d['sourceUrl'],
        _0x52e2d0['thumbUrl'],
        _0x4bbc6d['thumbUrl'],
      ),
      _0x1a0c3f = firstText(_0x52e2d0['localPath'], _0x4bbc6d['localPath']),
      _0x5cff86 = firstText(_0x52e2d0['originalLocalPath'], _0x4bbc6d['originalLocalPath']),
      _0xfb083f = firstText(_0x52e2d0['displayLocalPath'], _0x4bbc6d['displayLocalPath']),
      _0x6c18bd = firstText(_0x52e2d0['thumbLocalPath'], _0x4bbc6d['thumbLocalPath']);
    if (![_0x56cabb, _0x1a0c3f, _0x5cff86, _0xfb083f, _0x6c18bd]['some'](Boolean)) return null;
    return {
      mediaType: STORY_CLIP_MEDIA_TYPE_IMAGE,
      imageUrl: _0x56cabb,
      sourceUrl: firstText(_0x52e2d0['sourceUrl'], _0x4bbc6d['sourceUrl'], _0x56cabb),
      localPath: _0x1a0c3f,
      originalLocalPath: _0x5cff86,
      displayLocalPath: _0xfb083f,
      thumbLocalPath: _0x6c18bd,
      fileName: firstText(
        _0x52e2d0['fileName'],
        _0x52e2d0['filename'],
        _0x4bbc6d['fileName'],
        _0x4bbc6d['filename'],
      ),
      width:
        Number(
          _0x52e2d0['width'] ||
            _0x52e2d0['originalWidth'] ||
            _0x4bbc6d['originalWidth'] ||
            _0x4bbc6d['width'],
        ) || 0x0,
      height:
        Number(
          _0x52e2d0['height'] ||
            _0x52e2d0['originalHeight'] ||
            _0x4bbc6d['originalHeight'] ||
            _0x4bbc6d['height'],
        ) || 0x0,
    };
  }
  if (VIDEO_NODE_TYPES['has'](_0xda7451)) {
    const _0xb5fa7e = getActiveMediaItem(_0x4bbc6d, 'videos', ['mainVideoIndex', 'activeVideoIndex']),
      _0x110357 = firstText(
        _0xb5fa7e['videoUrl'],
        _0xb5fa7e['url'],
        _0x4bbc6d['videoUrl'],
        _0x4bbc6d['src'],
        _0x4bbc6d['url'],
        _0xb5fa7e['sourceUrl'],
        _0x4bbc6d['sourceUrl'],
      ),
      _0x26f0b3 = firstText(_0xb5fa7e['localPath'], _0x4bbc6d['localPath']),
      _0x25f905 = firstText(_0xb5fa7e['originalLocalPath'], _0x4bbc6d['originalLocalPath']),
      _0x366b83 = firstText(_0xb5fa7e['displayLocalPath'], _0x4bbc6d['displayLocalPath']);
    if (![_0x110357, _0x26f0b3, _0x25f905, _0x366b83]['some'](Boolean)) return null;
    return {
      mediaType: STORY_CLIP_MEDIA_TYPE_VIDEO,
      videoUrl: _0x110357,
      sourceUrl: firstText(_0xb5fa7e['sourceUrl'], _0x4bbc6d['sourceUrl'], _0x110357),
      localPath: _0x26f0b3,
      originalLocalPath: _0x25f905,
      displayLocalPath: _0x366b83,
      thumbUrl: firstText(
        _0xb5fa7e['thumbUrl'],
        _0xb5fa7e['posterUrl'],
        _0x4bbc6d['thumbUrl'],
        _0x4bbc6d['posterUrl'],
      ),
      posterUrl: firstText(_0xb5fa7e['posterUrl'], _0x4bbc6d['posterUrl']),
      thumbLocalPath: firstText(
        _0xb5fa7e['thumbLocalPath'],
        _0xb5fa7e['posterLocalPath'],
        _0x4bbc6d['thumbLocalPath'],
        _0x4bbc6d['posterLocalPath'],
      ),
      posterLocalPath: firstText(_0xb5fa7e['posterLocalPath'], _0x4bbc6d['posterLocalPath']),
      fileName: firstText(
        _0xb5fa7e['fileName'],
        _0xb5fa7e['filename'],
        _0x4bbc6d['fileName'],
        _0x4bbc6d['filename'],
      ),
      width:
        Number(
          _0xb5fa7e['videoWidth'] || _0xb5fa7e['width'] || _0x4bbc6d['videoWidth'] || _0x4bbc6d['width'],
        ) || 0x0,
      height:
        Number(
          _0xb5fa7e['videoHeight'] || _0xb5fa7e['height'] || _0x4bbc6d['videoHeight'] || _0x4bbc6d['height'],
        ) || 0x0,
      videoDuration: Math['max'](
        0x0,
        Number(
          _0xb5fa7e['videoDuration'] ||
            _0xb5fa7e['duration'] ||
            _0x4bbc6d['videoDuration'] ||
            _0x4bbc6d['duration'],
        ) || 0x0,
      ),
      videoFps: Math['max'](
        0x0,
        Number(_0xb5fa7e['videoFps'] || _0xb5fa7e['fps'] || _0x4bbc6d['videoFps'] || _0x4bbc6d['fps']) || 0x0,
      ),
    };
  }
  return null;
}
export function buildStoryCanvasMediaFrame({
  canvasId: canvasId = '',
  node: node = {},
  projectData: projectData = {},
  existingFrame: existingFrame = null,
  episodeId: episodeId = '',
  clipId: clipId = '',
  now: now = Date['now'],
} = {}) {
  if (!isStoryCanvasMediaNode(node)) return null;
  if (isStoryWorkspaceClipVideoNode(node)) return null;
  const _0x1288e3 = resolveStoryCanvasNodeMedia(node);
  if (!_0x1288e3) return null;
  const _0x4fb120 = asObject(node['storyWorkspaceBinding']),
    { episode: _0x4e2115, clip: _0x3601bd } = findEpisodeContext(projectData, {
      binding: _0x4fb120,
      existingFrame: existingFrame,
      episodeId: episodeId,
      clipId: clipId,
    }),
    _0x3adec3 = normalizeText(canvasId),
    _0x386ad8 = normalizeText(node['id']);
  if (!_0x3adec3 || !_0x386ad8) return null;
  const _0x6c463c = firstText(
      _0x4fb120['clipFrameId'],
      existingFrame?.['id'],
      buildCanvasMediaFrameId(_0x3adec3, _0x386ad8),
    ),
    _0xda62ea = Math['max'](0x0, Number(existingFrame?.['createdAt']) || Number(now?.()) || Date['now']());
  return normalizeStoryClipFrame({
    ...asObject(existingFrame),
    ..._0x1288e3,
    id: _0x6c463c,
    name: firstText(node['name'], existingFrame?.['name'], _0x3601bd?.['title'], '画布媒体'),
    episodeId: normalizeText(_0x4e2115?.['id']),
    episodeTitle: normalizeText(_0x4e2115?.['title']),
    clipId: normalizeText(_0x3601bd?.['id']),
    clipTitle: firstText(_0x3601bd?.['title'], existingFrame?.['clipTitle'], '片段'),
    currentTimeSec: 0x0,
    endTimeSec: _0x1288e3['mediaType'] === STORY_CLIP_MEDIA_TYPE_VIDEO ? _0x1288e3['videoDuration'] : 0x0,
    sourceKey: 'canvas-node:' + _0x3adec3 + ':' + _0x386ad8,
    canvasId: _0x3adec3,
    canvasNodeId: _0x386ad8,
    createdAt: _0xda62ea,
  });
}
export function reconcileStoryCanvasMediaNodes(
  _0x1bbf92 = {},
  {
    canvasId: canvasId = '',
    nodes: nodes = [],
    episodeId: episodeId = '',
    clipId: clipId = '',
    now: now = Date['now'],
  } = {},
) {
  if (!_0x1bbf92?.['project'] || !Array['isArray'](nodes)) return ![];
  const _0x18cea7 = normalizeText(canvasId);
  if (!_0x18cea7 || normalizeText(_0x1bbf92['project']['canvasBinding']?.['canvasId']) !== _0x18cea7)
    return ![];
  const _0x313e24 = normalizeText(_0x1bbf92['project']['id']),
    _0x12067f = normalizeStoryClipFrames(_0x1bbf92['clipFrames']);
  let _0x2b02f2 = _0x12067f;
  for (const _0x21c0c7 of nodes) {
    const _0xadfc80 = normalizeText(_0x21c0c7?.['id']);
    if (!_0xadfc80) continue;
    const _0x510d35 = asObject(_0x21c0c7?.['storyWorkspaceBinding']),
      _0x4582bf =
        _0x2b02f2['find'](
          (_0x253588) =>
            normalizeText(_0x253588?.['canvasId']) === _0x18cea7 &&
            normalizeText(_0x253588?.['canvasNodeId']) === _0xadfc80,
        ) ||
        _0x2b02f2['find'](
          (_0x43d12e) => normalizeText(_0x43d12e?.['id']) === normalizeText(_0x510d35['clipFrameId']),
        ),
      _0x565879 = normalizeText(_0x510d35['projectId']);
    if (_0x565879 && _0x313e24 && _0x565879 !== _0x313e24) {
      if (_0x4582bf) _0x2b02f2 = _0x2b02f2['filter']((_0x5db935) => _0x5db935['id'] !== _0x4582bf['id']);
      continue;
    }
    const _0x3352d2 = buildStoryCanvasMediaFrame({
      canvasId: _0x18cea7,
      node: _0x21c0c7,
      projectData: _0x1bbf92,
      existingFrame: _0x4582bf,
      episodeId: episodeId,
      clipId: clipId,
      now: now,
    });
    if (!_0x3352d2) {
      if (_0x4582bf) _0x2b02f2 = _0x2b02f2['filter']((_0x33b055) => _0x33b055['id'] !== _0x4582bf['id']);
      continue;
    }
    _0x2b02f2 = upsertStoryClipFrame(_0x2b02f2, _0x3352d2);
  }
  if (JSON['stringify'](_0x12067f) === JSON['stringify'](_0x2b02f2)) return ![];
  return ((_0x1bbf92['clipFrames'] = _0x2b02f2), !![]);
}
export function buildStoryClipFrameCanvasNodeData({ project: project = {}, frame: frame = {} } = {}) {
  const _0x10238a = normalizeStoryClipFrame(frame),
    _0x1dafa5 = getStoryClipFrameMediaType(_0x10238a),
    _0x2d0dd8 = {
      name: normalizeText(_0x10238a['name']) || '片段帧',
      sourceUrl: normalizeText(_0x10238a['sourceUrl']),
      localPath: normalizeText(_0x10238a['localPath']),
      originalLocalPath: normalizeText(_0x10238a['originalLocalPath']),
      displayLocalPath: normalizeText(_0x10238a['displayLocalPath']),
      thumbLocalPath: normalizeText(_0x10238a['thumbLocalPath']),
      fileName: normalizeText(_0x10238a['fileName']),
      storyWorkspaceBinding: {
        projectId: normalizeText(project['id']),
        episodeId: normalizeText(_0x10238a['episodeId']),
        clipId: normalizeText(_0x10238a['clipId']),
        kind: 'clip-frame-media',
        canvasScope: 'project',
        clipFrameId: normalizeText(_0x10238a['id']),
        clipFrameEpisodeId: normalizeText(_0x10238a['episodeId']),
        clipFrameClipId: normalizeText(_0x10238a['clipId']),
      },
    };
  if (_0x1dafa5 === STORY_CLIP_MEDIA_TYPE_VIDEO)
    return {
      ..._0x2d0dd8,
      type: 'source-video',
      videoUrl: resolveStoryClipFrameMediaUrl(_0x10238a),
      thumbUrl: resolveStoryClipFrameImageUrl(_0x10238a),
      posterUrl: firstText(_0x10238a['posterUrl'], _0x10238a['thumbUrl']),
      posterLocalPath: normalizeText(_0x10238a['posterLocalPath']),
      videoDuration: Number(_0x10238a['videoDuration']) || 0x0,
      videoFps: Number(_0x10238a['videoFps']) || 0x0,
    };
  return {
    ..._0x2d0dd8,
    type: 'source-image',
    imageUrl: resolveStoryClipFrameImageUrl(_0x10238a),
    needsAutoResize: !![],
  };
}
export function createStoryClipFrameCanvasAdapter({
  canvasTabManager: _0x24738a,
  createNodeAtCursor: _0x13e793,
  getGraphState: _0x54fed2,
  updateNodeData: _0x1656ce,
  deleteNodes: _0x43eeb2 = null,
  getNodeSize: getNodeSize = () => ({ width: 0x200, height: 0x120 }),
  commit: commit = () => {},
} = {}) {
  if (
    typeof _0x24738a?.['getActiveCanvasId'] !== 'function' ||
    typeof _0x13e793 !== 'function' ||
    typeof _0x54fed2 !== 'function' ||
    typeof _0x1656ce !== 'function'
  )
    throw new Error('story\x20clip\x20frame\x20canvas\x20adapter\x20dependencies\x20are\x20incomplete');
  const _0x14f48f = (_0x496f50) => asObject(_0x54fed2()?.['nodes'])[normalizeText(_0x496f50)] || null;
  return {
    canvasExists(_0x2a10e5) {
      const _0x2ff7e0 = normalizeText(_0x2a10e5);
      if (!_0x2ff7e0) return ![];
      const _0x5c1776 = _0x24738a['getMultiDataSnapshot']?.({ captureVisualSnapshot: ![] }) || {};
      return Array['isArray'](_0x5c1776['canvases'])
        ? _0x5c1776['canvases']['some']((_0x3429b5) => normalizeText(_0x3429b5?.['id']) === _0x2ff7e0)
        : normalizeText(_0x24738a['getActiveCanvasId']()) === _0x2ff7e0;
    },
    async switchCanvas(_0x34d3fe) {
      const _0x221076 = normalizeText(_0x34d3fe);
      if (normalizeText(_0x24738a['getActiveCanvasId']()) === _0x221076) return !![];
      if (!_0x221076 || typeof _0x24738a['switchTo'] !== 'function') return ![];
      return (await _0x24738a['switchTo'](_0x221076)) !== ![];
    },
    nodeExists(_0x495141) {
      return Boolean(_0x14f48f(_0x495141));
    },
    async createMediaNode(_0x33ae74, { sequenceKey: _0x4dbfeb } = {}) {
      const _0x15fd53 = asObject(getNodeSize(_0x33ae74['type'], _0x33ae74)),
        _0x4f1bcc = _0x13e793(
          _0x33ae74['type'],
          Number(_0x15fd53['width']) || 0x200,
          Number(_0x15fd53['height']) || 0x120,
          _0x33ae74['name'],
          { placement: 'viewport-center-sequence', sequenceKey: _0x4dbfeb },
        );
      if (!_0x4f1bcc?.['id']) throw new Error('创建片段帧画布节点失败');
      return (
        _0x1656ce(_0x4f1bcc['id'], withoutNodeType(_0x33ae74)),
        commit(),
        _0x14f48f(_0x4f1bcc['id']) || { ..._0x4f1bcc, ...withoutNodeType(_0x33ae74) }
      );
    },
    async updateMediaNode(_0x33e89b, _0x39901f) {
      const _0x38a796 = normalizeText(_0x33e89b);
      if (!_0x38a796) return null;
      return (
        _0x1656ce(_0x38a796, withoutNodeType(_0x39901f)),
        commit(),
        _0x14f48f(_0x38a796) || { id: _0x38a796, ..._0x39901f }
      );
    },
    deleteNodes(_0x2a9146 = []) {
      if (typeof _0x43eeb2 !== 'function') return ![];
      const _0x5daf0d = (Array['isArray'](_0x2a9146) ? _0x2a9146 : [])
        ['map'](normalizeText)
        ['filter']((_0xcded14) => _0xcded14 && _0x14f48f(_0xcded14));
      if (!_0x5daf0d['length']) return ![];
      return (_0x43eeb2(_0x5daf0d), commit(), !![]);
    },
  };
}
export async function deleteStoryCanvasMediaNodes({
  canvasId: canvasId = '',
  nodeIds: nodeIds = [],
  adapter: _0x2685bc,
} = {}) {
  const _0xafe791 = ['canvasExists', 'switchCanvas', 'deleteNodes'];
  if (_0xafe791['some']((_0x3be2d1) => typeof _0x2685bc?.[_0x3be2d1] !== 'function'))
    throw new Error('deleteStoryCanvasMediaNodes requires a complete canvas adapter');
  const _0x1e8007 = normalizeText(canvasId),
    _0x2abb3e = (Array['isArray'](nodeIds) ? nodeIds : [])['map'](normalizeText)['filter'](Boolean);
  if (!_0x1e8007 || !_0x2abb3e['length'] || !(await _0x2685bc['canvasExists'](_0x1e8007))) return ![];
  if ((await _0x2685bc['switchCanvas'](_0x1e8007)) === ![])
    throw new Error('无法切换到关联画布：' + _0x1e8007);
  return _0x2685bc['deleteNodes'](_0x2abb3e, { canvasId: _0x1e8007 }) !== ![];
}
export async function syncStoryClipFrameToCanvas({
  project: project = {},
  frame: frame = {},
  adapter: _0x4529cc,
} = {}) {
  const _0x1e327e = ['canvasExists', 'switchCanvas', 'nodeExists', 'createMediaNode', 'updateMediaNode'];
  if (_0x1e327e['some']((_0x137cd5) => typeof _0x4529cc?.[_0x137cd5] !== 'function'))
    throw new Error('syncStoryClipFrameToCanvas requires a complete canvas adapter');
  const _0x2e9092 = normalizeText(project['canvasBinding']?.['canvasId']);
  if (!_0x2e9092 || !(await _0x4529cc['canvasExists'](_0x2e9092)))
    return { synced: ![], reason: 'canvas-unavailable' };
  if ((await _0x4529cc['switchCanvas'](_0x2e9092)) === ![])
    throw new Error('无法切换到已绑定的项目画布：' + _0x2e9092);
  const _0x31ebde = buildStoryClipFrameCanvasNodeData({ project: project, frame: frame }),
    _0x3b04b3 = normalizeText(frame['canvasId']) === _0x2e9092 ? normalizeText(frame['canvasNodeId']) : '',
    _0x88d882 = Boolean(_0x3b04b3 && (await _0x4529cc['nodeExists'](_0x3b04b3, _0x2e9092))),
    _0x46d1ee = _0x88d882
      ? await _0x4529cc['updateMediaNode'](_0x3b04b3, _0x31ebde, { canvasId: _0x2e9092 })
      : await _0x4529cc['createMediaNode'](_0x31ebde, {
          canvasId: _0x2e9092,
          sequenceKey: 'story-project:' + (normalizeText(project['id']) || _0x2e9092) + ':clip-frames',
        }),
    _0x119a6a = normalizeText(_0x46d1ee?.['id'] || (_0x88d882 ? _0x3b04b3 : ''));
  if (!_0x119a6a) throw new Error('同步片段帧到项目画布失败');
  return {
    synced: !![],
    created: !_0x88d882,
    canvasId: _0x2e9092,
    nodeId: _0x119a6a,
    node: _0x46d1ee,
    frame: normalizeStoryClipFrame({ ...frame, canvasId: _0x2e9092, canvasNodeId: _0x119a6a }),
  };
}
