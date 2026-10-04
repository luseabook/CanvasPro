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
function asObject(value) {
  return value && typeof value === 'object' && !Array['isArray'](value) ? value : {};
}
function normalizeText(item) {
  return String(item || '')['trim']();
}
function normalizeIndex(key, count) {
  const index = Math['trunc'](Number(key));
  if (!Number['isFinite'](index) || count <= 0x0) return 0x0;
  return Math['max'](0x0, Math['min'](count - 0x1, index));
}
function firstText(...list) {
  return list['map'](normalizeText)['find'](Boolean) || '';
}
function hashText(result) {
  let data = 0x811c9dc5;
  for (const options of String(result || '')) {
    ((data ^= options['charCodeAt'](0x0)), (data = Math['imul'](data, 0x1000193)));
  }
  return (data >>> 0x0)['toString'](0x24);
}
function withoutNodeType(target) {
  const source = { ...asObject(target) };
  return (delete source['type'], source);
}
function getActiveMediaItem(next, current, list2) {
  const list3 = Array['isArray'](next?.[current]) ? next[current] : [],
    entry = list2['map']((record) => next?.[record])['find']((payload) => payload !== undefined);
  return asObject(list3[normalizeIndex(entry, list3['length'])]);
}
function buildCanvasMediaFrameId(handle, state) {
  return 'story-canvas-media-' + hashText(normalizeText(handle) + ':' + normalizeText(state));
}
function findEpisodeContext(
  config,
  {
    binding: binding = {},
    existingFrame: existingFrame = null,
    episodeId: episodeId = '',
    clipId: clipId = '',
  } = {},
) {
  const list4 = Array['isArray'](config?.['episodes']) ? config['episodes'] : [],
    text = firstText(binding['clipFrameClipId'], binding['clipId'], existingFrame?.['clipId'], clipId),
    text2 = firstText(
      binding['clipFrameEpisodeId'],
      binding['episodeId'],
      existingFrame?.['episodeId'],
      episodeId,
    );
  let episode = list4['find']((scope) => normalizeText(scope?.['id']) === text2);
  !episode &&
    text &&
    (episode = list4['find'](
      (input) =>
        Array['isArray'](input?.['clips']) &&
        input['clips']['some']((output) => normalizeText(output?.['id']) === text),
    ));
  episode ||= list4[0x0] || null;
  const list5 = Array['isArray'](episode?.['clips']) ? episode['clips'] : [],
    clip = list5['find']((value2) => normalizeText(value2?.['id']) === text) || list5[0x0] || null;
  return { episode: episode, clip: clip };
}
export function isStoryCanvasMediaNode(options2 = {}) {
  const text3 = normalizeText(options2['type']);
  return IMAGE_NODE_TYPES['has'](text3) || VIDEO_NODE_TYPES['has'](text3);
}
function isStoryWorkspaceClipVideoNode(options3 = {}) {
  return (
    VIDEO_NODE_TYPES['has'](normalizeText(options3['type'])) &&
    normalizeText(options3['storyWorkspaceBinding']?.['kind']) === 'clip-video'
  );
}
export function resolveStoryCanvasNodeMedia(box = {}) {
  const text4 = normalizeText(box['type']);
  if (IMAGE_NODE_TYPES['has'](text4)) {
    const box2 = getActiveMediaItem(box, 'images', ['mainImageIndex', 'activeImageIndex']),
      imageUrl = firstText(
        box2['imageUrl'],
        box2['url'],
        box['imageUrl'],
        box['src'],
        box['url'],
        box2['sourceUrl'],
        box['sourceUrl'],
        box2['thumbUrl'],
        box['thumbUrl'],
      ),
      localPath = firstText(box2['localPath'], box['localPath']),
      originalLocalPath = firstText(box2['originalLocalPath'], box['originalLocalPath']),
      displayLocalPath = firstText(box2['displayLocalPath'], box['displayLocalPath']),
      thumbLocalPath = firstText(box2['thumbLocalPath'], box['thumbLocalPath']);
    if (![imageUrl, localPath, originalLocalPath, displayLocalPath, thumbLocalPath]['some'](Boolean))
      return null;
    return {
      mediaType: STORY_CLIP_MEDIA_TYPE_IMAGE,
      imageUrl: imageUrl,
      sourceUrl: firstText(box2['sourceUrl'], box['sourceUrl'], imageUrl),
      localPath: localPath,
      originalLocalPath: originalLocalPath,
      displayLocalPath: displayLocalPath,
      thumbLocalPath: thumbLocalPath,
      fileName: firstText(box2['fileName'], box2['filename'], box['fileName'], box['filename']),
      width: Number(box2['width'] || box2['originalWidth'] || box['originalWidth'] || box['width']) || 0x0,
      height:
        Number(box2['height'] || box2['originalHeight'] || box['originalHeight'] || box['height']) || 0x0,
    };
  }
  if (VIDEO_NODE_TYPES['has'](text4)) {
    const box3 = getActiveMediaItem(box, 'videos', ['mainVideoIndex', 'activeVideoIndex']),
      videoUrl = firstText(
        box3['videoUrl'],
        box3['url'],
        box['videoUrl'],
        box['src'],
        box['url'],
        box3['sourceUrl'],
        box['sourceUrl'],
      ),
      localPath2 = firstText(box3['localPath'], box['localPath']),
      originalLocalPath2 = firstText(box3['originalLocalPath'], box['originalLocalPath']),
      displayLocalPath2 = firstText(box3['displayLocalPath'], box['displayLocalPath']);
    if (![videoUrl, localPath2, originalLocalPath2, displayLocalPath2]['some'](Boolean)) return null;
    return {
      mediaType: STORY_CLIP_MEDIA_TYPE_VIDEO,
      videoUrl: videoUrl,
      sourceUrl: firstText(box3['sourceUrl'], box['sourceUrl'], videoUrl),
      localPath: localPath2,
      originalLocalPath: originalLocalPath2,
      displayLocalPath: displayLocalPath2,
      thumbUrl: firstText(box3['thumbUrl'], box3['posterUrl'], box['thumbUrl'], box['posterUrl']),
      posterUrl: firstText(box3['posterUrl'], box['posterUrl']),
      thumbLocalPath: firstText(
        box3['thumbLocalPath'],
        box3['posterLocalPath'],
        box['thumbLocalPath'],
        box['posterLocalPath'],
      ),
      posterLocalPath: firstText(box3['posterLocalPath'], box['posterLocalPath']),
      fileName: firstText(box3['fileName'], box3['filename'], box['fileName'], box['filename']),
      width: Number(box3['videoWidth'] || box3['width'] || box['videoWidth'] || box['width']) || 0x0,
      height: Number(box3['videoHeight'] || box3['height'] || box['videoHeight'] || box['height']) || 0x0,
      videoDuration: Math['max'](
        0x0,
        Number(box3['videoDuration'] || box3['duration'] || box['videoDuration'] || box['duration']) || 0x0,
      ),
      videoFps: Math['max'](
        0x0,
        Number(box3['videoFps'] || box3['fps'] || box['videoFps'] || box['fps']) || 0x0,
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
  const endTimeSec = resolveStoryCanvasNodeMedia(node);
  if (!endTimeSec) return null;
  const binding2 = asObject(node['storyWorkspaceBinding']),
    { episode: episode2, clip: clip2 } = findEpisodeContext(projectData, {
      binding: binding2,
      existingFrame: existingFrame,
      episodeId: episodeId,
      clipId: clipId,
    }),
    canvasId2 = normalizeText(canvasId),
    canvasNodeId = normalizeText(node['id']);
  if (!canvasId2 || !canvasNodeId) return null;
  const id2 = firstText(
      binding2['clipFrameId'],
      existingFrame?.['id'],
      buildCanvasMediaFrameId(canvasId2, canvasNodeId),
    ),
    createdAt = Math['max'](0x0, Number(existingFrame?.['createdAt']) || Number(now?.()) || Date['now']());
  return normalizeStoryClipFrame({
    ...asObject(existingFrame),
    ...endTimeSec,
    id: id2,
    name: firstText(node['name'], existingFrame?.['name'], clip2?.['title'], '画布媒体'),
    episodeId: normalizeText(episode2?.['id']),
    episodeTitle: normalizeText(episode2?.['title']),
    clipId: normalizeText(clip2?.['id']),
    clipTitle: firstText(clip2?.['title'], existingFrame?.['clipTitle'], '片段'),
    currentTimeSec: 0x0,
    endTimeSec: endTimeSec['mediaType'] === STORY_CLIP_MEDIA_TYPE_VIDEO ? endTimeSec['videoDuration'] : 0x0,
    sourceKey: 'canvas-node:' + canvasId2 + ':' + canvasNodeId,
    canvasId: canvasId2,
    canvasNodeId: canvasNodeId,
    createdAt: createdAt,
  });
}
export function reconcileStoryCanvasMediaNodes(
  projectData2 = {},
  {
    canvasId: canvasId = '',
    nodes: nodes = [],
    episodeId: episodeId = '',
    clipId: clipId = '',
    now: now = Date['now'],
  } = {},
) {
  if (!projectData2?.['project'] || !Array['isArray'](nodes)) return ![];
  const canvasId3 = normalizeText(canvasId);
  if (!canvasId3 || normalizeText(projectData2['project']['canvasBinding']?.['canvasId']) !== canvasId3)
    return ![];
  const text5 = normalizeText(projectData2['project']['id']),
    storyClipFrames = normalizeStoryClipFrames(projectData2['clipFrames']);
  let list6 = storyClipFrames;
  for (const node2 of nodes) {
    const text6 = normalizeText(node2?.['id']);
    if (!text6) continue;
    const asObject2 = asObject(node2?.['storyWorkspaceBinding']),
      existingFrame2 =
        list6['find'](
          (value3) =>
            normalizeText(value3?.['canvasId']) === canvasId3 &&
            normalizeText(value3?.['canvasNodeId']) === text6,
        ) ||
        list6['find']((value4) => normalizeText(value4?.['id']) === normalizeText(asObject2['clipFrameId'])),
      text7 = normalizeText(asObject2['projectId']);
    if (text7 && text5 && text7 !== text5) {
      if (existingFrame2) list6 = list6['filter']((value5) => value5['id'] !== existingFrame2['id']);
      continue;
    }
    const storyCanvasMediaFrame = buildStoryCanvasMediaFrame({
      canvasId: canvasId3,
      node: node2,
      projectData: projectData2,
      existingFrame: existingFrame2,
      episodeId: episodeId,
      clipId: clipId,
      now: now,
    });
    if (!storyCanvasMediaFrame) {
      if (existingFrame2) list6 = list6['filter']((value6) => value6['id'] !== existingFrame2['id']);
      continue;
    }
    list6 = upsertStoryClipFrame(list6, storyCanvasMediaFrame);
  }
  if (JSON['stringify'](storyClipFrames) === JSON['stringify'](list6)) return ![];
  return ((projectData2['clipFrames'] = list6), !![]);
}
export function buildStoryClipFrameCanvasNodeData({ project: project = {}, frame: frame = {} } = {}) {
  const error = normalizeStoryClipFrame(frame),
    storyClipFrameMediaType = getStoryClipFrameMediaType(error),
    args = {
      name: normalizeText(error['name']) || '片段帧',
      sourceUrl: normalizeText(error['sourceUrl']),
      localPath: normalizeText(error['localPath']),
      originalLocalPath: normalizeText(error['originalLocalPath']),
      displayLocalPath: normalizeText(error['displayLocalPath']),
      thumbLocalPath: normalizeText(error['thumbLocalPath']),
      fileName: normalizeText(error['fileName']),
      storyWorkspaceBinding: {
        projectId: normalizeText(project['id']),
        episodeId: normalizeText(error['episodeId']),
        clipId: normalizeText(error['clipId']),
        kind: 'clip-frame-media',
        canvasScope: 'project',
        clipFrameId: normalizeText(error['id']),
        clipFrameEpisodeId: normalizeText(error['episodeId']),
        clipFrameClipId: normalizeText(error['clipId']),
      },
    };
  if (storyClipFrameMediaType === STORY_CLIP_MEDIA_TYPE_VIDEO)
    return {
      ...args,
      type: 'source-video',
      videoUrl: resolveStoryClipFrameMediaUrl(error),
      thumbUrl: resolveStoryClipFrameImageUrl(error),
      posterUrl: firstText(error['posterUrl'], error['thumbUrl']),
      posterLocalPath: normalizeText(error['posterLocalPath']),
      videoDuration: Number(error['videoDuration']) || 0x0,
      videoFps: Number(error['videoFps']) || 0x0,
    };
  return {
    ...args,
    type: 'source-image',
    imageUrl: resolveStoryClipFrameImageUrl(error),
    needsAutoResize: !![],
  };
}
export function createStoryClipFrameCanvasAdapter({
  canvasTabManager: canvasTabManager,
  createNodeAtCursor: createNodeAtCursor,
  getGraphState: getGraphState,
  updateNodeData: updateNodeData,
  deleteNodes: deleteNodes2 = null,
  getNodeSize: getNodeSize = () => ({ width: 0x200, height: 0x120 }),
  commit: commit = () => {},
} = {}) {
  if (
    typeof canvasTabManager?.['getActiveCanvasId'] !== 'function' ||
    typeof createNodeAtCursor !== 'function' ||
    typeof getGraphState !== 'function' ||
    typeof updateNodeData !== 'function'
  )
    throw new Error('story\x20clip\x20frame\x20canvas\x20adapter\x20dependencies\x20are\x20incomplete');
  const run = (value7) => asObject(getGraphState()?.['nodes'])[normalizeText(value7)] || null;
  return {
    canvasExists(value8) {
      const text8 = normalizeText(value8);
      if (!text8) return ![];
      const value9 = canvasTabManager['getMultiDataSnapshot']?.({ captureVisualSnapshot: ![] }) || {};
      return Array['isArray'](value9['canvases'])
        ? value9['canvases']['some']((value10) => normalizeText(value10?.['id']) === text8)
        : normalizeText(canvasTabManager['getActiveCanvasId']()) === text8;
    },
    async switchCanvas(value11) {
      const text9 = normalizeText(value11);
      if (normalizeText(canvasTabManager['getActiveCanvasId']()) === text9) return !![];
      if (!text9 || typeof canvasTabManager['switchTo'] !== 'function') return ![];
      return (await canvasTabManager['switchTo'](text9)) !== ![];
    },
    nodeExists(value12) {
      return Boolean(run(value12));
    },
    async createMediaNode(error2, { sequenceKey: sequenceKey } = {}) {
      const box4 = asObject(getNodeSize(error2['type'], error2)),
        args2 = createNodeAtCursor(
          error2['type'],
          Number(box4['width']) || 0x200,
          Number(box4['height']) || 0x120,
          error2['name'],
          { placement: 'viewport-center-sequence', sequenceKey: sequenceKey },
        );
      if (!args2?.['id']) throw new Error('创建片段帧画布节点失败');
      return (
        updateNodeData(args2['id'], withoutNodeType(error2)),
        commit(),
        run(args2['id']) || { ...args2, ...withoutNodeType(error2) }
      );
    },
    async updateMediaNode(value13, args3) {
      const id3 = normalizeText(value13);
      if (!id3) return null;
      return (updateNodeData(id3, withoutNodeType(args3)), commit(), run(id3) || { id: id3, ...args3 });
    },
    deleteNodes(list7 = []) {
      if (typeof deleteNodes2 !== 'function') return ![];
      const list8 = (Array['isArray'](list7) ? list7 : [])
        ['map'](normalizeText)
        ['filter']((value14) => value14 && run(value14));
      if (!list8['length']) return ![];
      return (deleteNodes2(list8), commit(), !![]);
    },
  };
}
export async function deleteStoryCanvasMediaNodes({
  canvasId: canvasId = '',
  nodeIds: nodeIds = [],
  adapter: adapter,
} = {}) {
  const list9 = ['canvasExists', 'switchCanvas', 'deleteNodes'];
  if (list9['some']((value15) => typeof adapter?.[value15] !== 'function'))
    throw new Error('deleteStoryCanvasMediaNodes requires a complete canvas adapter');
  const canvasId4 = normalizeText(canvasId),
    list10 = (Array['isArray'](nodeIds) ? nodeIds : [])['map'](normalizeText)['filter'](Boolean);
  if (!canvasId4 || !list10['length'] || !(await adapter['canvasExists'](canvasId4))) return ![];
  if ((await adapter['switchCanvas'](canvasId4)) === ![]) throw new Error('无法切换到关联画布：' + canvasId4);
  return adapter['deleteNodes'](list10, { canvasId: canvasId4 }) !== ![];
}
export async function syncStoryClipFrameToCanvas({
  project: project = {},
  frame: frame = {},
  adapter: adapter2,
} = {}) {
  const list11 = ['canvasExists', 'switchCanvas', 'nodeExists', 'createMediaNode', 'updateMediaNode'];
  if (list11['some']((value16) => typeof adapter2?.[value16] !== 'function'))
    throw new Error('syncStoryClipFrameToCanvas requires a complete canvas adapter');
  const canvasId5 = normalizeText(project['canvasBinding']?.['canvasId']);
  if (!canvasId5 || !(await adapter2['canvasExists'](canvasId5)))
    return { synced: ![], reason: 'canvas-unavailable' };
  if ((await adapter2['switchCanvas'](canvasId5)) === ![])
    throw new Error('无法切换到已绑定的项目画布：' + canvasId5);
  const storyClipFrameCanvasNodeData = buildStoryClipFrameCanvasNodeData({ project: project, frame: frame }),
    text10 = normalizeText(frame['canvasId']) === canvasId5 ? normalizeText(frame['canvasNodeId']) : '',
    enabled = Boolean(text10 && (await adapter2['nodeExists'](text10, canvasId5))),
    node3 = enabled
      ? await adapter2['updateMediaNode'](text10, storyClipFrameCanvasNodeData, { canvasId: canvasId5 })
      : await adapter2['createMediaNode'](storyClipFrameCanvasNodeData, {
          canvasId: canvasId5,
          sequenceKey: 'story-project:' + (normalizeText(project['id']) || canvasId5) + ':clip-frames',
        }),
    nodeId = normalizeText(node3?.['id'] || (enabled ? text10 : ''));
  if (!nodeId) throw new Error('同步片段帧到项目画布失败');
  return {
    synced: !![],
    created: !enabled,
    canvasId: canvasId5,
    nodeId: nodeId,
    node: node3,
    frame: normalizeStoryClipFrame({ ...frame, canvasId: canvasId5, canvasNodeId: nodeId }),
  };
}
