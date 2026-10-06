import { normalizeVideoGenerationResult } from '../../components/video-node/videoGenerationResultRenderer.js';
import { resolveGenerationResultSelection } from '../../core/generationResultRenderer.js';
import { buildStoryClipCanvasBindingKey, buildStoryLinkedCanvasName } from './storyCanvasBinding.js';
function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function normalizeText(item) {
  return String(item || '').trim();
}
export function buildStoryEpisodeCanvasName(options = {}) {
  const count = Number(options.number || 0);
  return [count > 0 ? '第 ' + count + ' 集' : '分集', normalizeText(options.title)]
    .filter(Boolean)
    .join(' · ');
}
export function buildStoryClipCanvasNodeData({
  project: project = {},
  episode: episode = {},
  clip: clip = {},
  modelId: modelId = '',
  provider: provider = '',
  generationParams: generationParams = {},
  generationValidation: generationValidation = null,
} = {}) {
  const asObject2 = asObject(clip.video),
    videos = Array.isArray(asObject2.results) ? asObject2.results : [],
    { items: items, activeIndex: activeIndex } = resolveGenerationResultSelection(
      normalizeVideoGenerationResult({ videos: videos }).items,
      asObject2.activeIndex,
    ),
    key = items[activeIndex] || {},
    count2 = Number(episode.number || 0),
    count3 = Number(clip.number || 0),
    message = normalizeText(generationValidation?.message || generationValidation);
  return {
    type: 'ai-video',
    name: [
      count2 > 0 ? '第 ' + count2 + ' 集' : '分集',
      count3 > 0 ? '片段 ' + count3 : '视频片段',
      normalizeText(clip.title),
      message ? '⚠ 时长需调整' : '',
    ]
      .filter(Boolean)
      .join(' · '),
    prompt: String(clip.prompt || ''),
    model: normalizeText(clip.modelId || clip.generation?.modelId || modelId),
    provider: normalizeText(clip.provider || clip.generation?.provider || provider),
    generationParams: { ...asObject(generationParams), ...asObject(clip.generationParams) },
    storyWorkspaceInputs: { ...asObject(clip.inputs) },
    videos: items,
    mainVideoIndex: activeIndex,
    isVideosExpanded: false,
    videoUrl: normalizeText(key.videoUrl),
    localPath: normalizeText(key.localPath),
    displayLocalPath: normalizeText(key.displayLocalPath),
    posterLocalPath: normalizeText(key.posterLocalPath),
    thumbId: normalizeText(key.thumbId),
    thumbUrl: normalizeText(key.thumbUrl),
    storyWorkspaceBinding: {
      projectId: normalizeText(project.id),
      episodeId: normalizeText(episode.id),
      clipId: normalizeText(clip.id),
      kind: 'clip-video',
      canvasScope: 'project',
    },
    ...(message
      ? { storyWorkspaceValidation: { generation: { status: 'unsupported', message: message } } }
      : {}),
  };
}
export function clearDeletedStoryCanvasBindings(
  enabled = {},
  { canvasId: canvasId = '', nodes: nodes = [] } = {},
) {
  if (!enabled || typeof enabled !== 'object' || Array.isArray(enabled)) return false;
  const map = new Set(
    (Array.isArray(nodes) ? nodes : [])
      .map((index) => normalizeText(index?.id || index))
      .filter(Boolean),
  );
  if (!map.size) return false;
  const text = normalizeText(canvasId),
    handler = (result) => !text || !normalizeText(result) || normalizeText(result) === text;
  let data = false;
  const args = asObject(enabled.project?.canvasBinding);
  if (handler(args.canvasId) && args.nodes) {
    const nodes2 = { ...asObject(args.nodes) };
    for (const [target, source] of Object.entries(nodes2)) {
      if (!map.has(normalizeText(source))) continue;
      (delete nodes2[target], (data = true));
    }
    if (data) enabled.project.canvasBinding = { ...args, nodes: nodes2 };
  }
  for (const next of Array.isArray(enabled.episodes) ? enabled.episodes : []) {
    const text2 = normalizeText(next?.canvasId || next?.canvasBinding?.canvasId);
    if (!handler(text2)) continue;
    for (const current of Array.isArray(next?.clips) ? next.clips : []) {
      const asObject3 = asObject(current?.canvasBinding);
      if (!map.has(normalizeText(asObject3.nodeId))) continue;
      (delete current.canvasBinding, (data = true));
    }
  }
  if (Array.isArray(enabled.clipFrames)) {
    const list = enabled.clipFrames.filter(
      (entry) => !map.has(normalizeText(entry?.canvasNodeId)) || !handler(entry?.canvasId),
    );
    list.length !== enabled.clipFrames.length && ((enabled.clipFrames = list), (data = true));
  }
  return data;
}
export function createStoryEpisodeCanvasAdapter({
  canvasTabManager: canvasTabManager,
  createNodeAtCursor: createNodeAtCursor,
  getGraphState: getGraphState,
  getGraphSnapshot: getGraphSnapshot = null,
  restoreGraphSnapshot: restoreGraphSnapshot = null,
  updateNodeData: updateNodeData,
  deleteNodes: deleteNodes2 = null,
  focusNodes: focusNodes2 = null,
  getVideoNodeSize: getVideoNodeSize = () => ({ width: 1024, height: 576 }),
  commit: commit = () => {},
} = {}) {
  if (
    typeof canvasTabManager?.addCanvas !== 'function' ||
    typeof canvasTabManager?.getActiveCanvasId !== 'function' ||
    typeof createNodeAtCursor !== 'function' ||
    typeof getGraphState !== 'function' ||
    typeof updateNodeData !== 'function'
  )
    throw new Error('story episode canvas adapter dependencies are incomplete');
  const run = (record) => asObject(getGraphState()?.nodes)[normalizeText(record)] || null;
  return {
    canvasExists(payload) {
      const text3 = normalizeText(payload);
      if (!text3) return false;
      const handle = canvasTabManager.getMultiDataSnapshot?.() || {};
      return Array.isArray(handle.canvases)
        ? handle.canvases.some((state) => normalizeText(state?.id) === text3)
        : normalizeText(canvasTabManager.getActiveCanvasId()) === text3;
    },
    async switchCanvas(config) {
      const text4 = normalizeText(config);
      if (!text4) return false;
      if (normalizeText(canvasTabManager.getActiveCanvasId()) === text4) return true;
      if (typeof canvasTabManager.switchTo !== 'function') return false;
      return (await canvasTabManager.switchTo(text4)) !== false;
    },
    async createCanvas(scope) {
      await canvasTabManager.addCanvas();
      const text5 = normalizeText(canvasTabManager.getActiveCanvasId());
      if (!text5) throw new Error('新建项目关联画布后未获得活动画布 ID');
      return (canvasTabManager.renameCanvas?.(text5, scope), text5);
    },
    renameCanvas(input, output) {
      canvasTabManager.renameCanvas?.(input, output);
    },
    nodeExists(value2) {
      return Boolean(run(value2));
    },
    async createVideoNode(error, { sequenceKey: sequenceKey } = {}) {
      const box = asObject(getVideoNodeSize()),
        type2 = createNodeAtCursor(
          'ai-video',
          Number(box.width || 1024),
          Number(box.height || 576),
          error.name,
          { placement: 'viewport-center-sequence', sequenceKey: sequenceKey, skipCommit: true },
        );
      if (!type2?.id) throw new Error('创建分集视频节点失败');
      const { type: type3, ...args2 } = error;
      return (
        updateNodeData(type2.id, args2),
        run(type2.id) || { ...type2, ...args2, type: type2.type || type3 }
      );
    },
    async updateVideoNode(value3, value4) {
      const id2 = normalizeText(value3);
      if (!id2) return null;
      const { type: type4, ...args3 } = value4;
      return (updateNodeData(id2, args3), run(id2) || { id: id2, type: type4 || 'ai-video', ...args3 });
    },
    deleteNodes(list2 = []) {
      if (typeof deleteNodes2 !== 'function') return false;
      const list3 = (Array.isArray(list2) ? list2 : [])
        .map(normalizeText)
        .filter((value5) => value5 && run(value5));
      if (!list3.length) return true;
      return (deleteNodes2([...new Set(list3)]), true);
    },
    createMutationSnapshot() {
      if (typeof getGraphSnapshot !== 'function') return null;
      return getGraphSnapshot();
    },
    restoreMutationSnapshot(enabled2) {
      if (!enabled2 || typeof restoreGraphSnapshot !== 'function') return false;
      return restoreGraphSnapshot(enabled2) !== false;
    },
    async deleteCanvas(value6) {
      const text6 = normalizeText(value6);
      if (!text6 || typeof canvasTabManager?.deleteCanvas !== 'function') return false;
      return (await canvasTabManager.deleteCanvas(text6, { skipDirtyConfirm: true })) !== false;
    },
    focusNodes(list4, value7 = {}) {
      if (typeof focusNodes2 !== 'function') return false;
      const list5 = Array.isArray(list4) ? list4.map(normalizeText).filter(Boolean) : [];
      if (!list5.length) return false;
      return focusNodes2(list5, value7.padding, value7.durationMs, value7);
    },
    commit: commit,
  };
}
async function rollbackStoryEpisodeCanvasMutation({
  adapter: adapter,
  canvasId: canvasId = '',
  reused: reused = false,
  mutationSnapshot: mutationSnapshot,
} = {}) {
  if (!reused && typeof adapter?.deleteCanvas === 'function')
    try {
      if ((await adapter.deleteCanvas(canvasId, { skipDirtyConfirm: true })) !== false) return true;
    } catch {}
  if (mutationSnapshot && typeof adapter?.restoreMutationSnapshot === 'function')
    try {
      return (await adapter.restoreMutationSnapshot(mutationSnapshot, { canvasId: canvasId })) !== false;
    } catch {}
  return false;
}
export async function createStoryEpisodeCanvas({
  project: project = {},
  episode: episode = {},
  modelId: modelId = '',
  provider: provider = '',
  generationParams: generationParams = {},
  resolveClipGenerationSettings: resolveClipGenerationSettings = null,
  adapter: adapter2,
} = {}) {
  const list6 = [
    'canvasExists',
    'switchCanvas',
    'createCanvas',
    'nodeExists',
    'createVideoNode',
    'updateVideoNode',
  ];
  if (list6.some((value8) => typeof adapter2?.[value8] !== 'function'))
    throw new Error('createStoryEpisodeCanvas requires a complete canvas adapter');
  const list7 = Array.isArray(episode.clips) ? episode.clips : [],
    list8 = await Promise.all(
      list7.map(async (clip2) => {
        try {
          const value9 =
            typeof resolveClipGenerationSettings === 'function'
              ? asObject(await resolveClipGenerationSettings(clip2))
              : {};
          return {
            clip: clip2,
            modelId: normalizeText(value9.modelId) || modelId,
            provider: normalizeText(value9.provider) || provider,
            generationParams: Object.keys(asObject(value9.generationParams)).length
              ? value9.generationParams
              : generationParams,
            generationValidation: null,
          };
        } catch (error2) {
          const duration = Number(
              clip2?.durationSec || clip2?.durationSeconds || clip2?.duration,
            ),
            message2 = normalizeText(error2?.message || error2);
          if (!(duration > 0) || !/时长|duration/iu.test(message2)) throw error2;
          return {
            clip: clip2,
            modelId: modelId,
            provider: provider,
            generationParams: { ...asObject(generationParams), duration: duration },
            generationValidation: { message: message2 },
          };
        }
      }),
    ),
    canvasName = buildStoryLinkedCanvasName(project, episode),
    asObject4 = asObject(project.canvasBinding),
    args4 = asObject(asObject4.nodes),
    text7 = normalizeText(asObject4.canvasId),
    value10 =
      text7 && typeof adapter2.canvasExists === 'function' && (await adapter2.canvasExists(text7));
  let canvasId2 = '';
  if (value10) {
    const value11 = await adapter2.switchCanvas?.(text7);
    if (value11 === false) throw new Error('无法切换到已绑定的项目画布：' + text7);
    canvasId2 = text7;
  } else canvasId2 = await adapter2.createCanvas(canvasName);
  const sequenceKey2 =
      'story-project:' +
      (normalizeText(project.id) || canvasId2) +
      ':episode:' +
      (normalizeText(episode.id) || 'episode'),
    nodes3 = [],
    bindings = [],
    nodes4 = value10 ? { ...args4 } : {};
  let createdCount = 0,
    updatedCount = 0,
    deletedCount = 0;
  const list9 = list8.map(({ clip: clip3 }, clipIndex) =>
      buildStoryClipCanvasBindingKey({ episode: episode, clip: clip3, clipIndex: clipIndex }),
    ),
    storyClipCanvasBindingKey = buildStoryClipCanvasBindingKey({
      episode: episode,
      clip: { id: '__story_episode_prefix__' },
    }).replace(/:clip:[^:]+$/u, ':clip:'),
    list10 = Object.keys(args4).filter(
      (value12) => value12.startsWith(storyClipCanvasBindingKey) && !list9.includes(value12),
    ),
    mutationSnapshot2 = await adapter2.createMutationSnapshot?.({ canvasId: canvasId2 });
  try {
    if (value10 && list10.length) {
      const list11 = [];
      for (const value13 of list10) {
        const text8 = normalizeText(args4[value13]);
        text8 && (await adapter2.nodeExists(text8, canvasId2)) && list11.push(text8);
      }
      if (list11.length) {
        if (typeof adapter2.deleteNodes !== 'function')
          throw new Error('剧本分集画布适配器缺少旧节点清理能力');
        const list12 = [...new Set(list11)];
        if ((await adapter2.deleteNodes(list12, { canvasId: canvasId2 })) === false)
          throw new Error('清理已失效的剧本分集画布节点失败');
        deletedCount = list12.length;
      }
      list10.forEach((value14) => {
        delete nodes4[value14];
      });
    }
    for (let value15 = 0; value15 < list8.length; value15 += 1) {
      const modelId2 = list8[value15],
        { clip: clip4 } = modelId2,
        key2 = list9[value15],
        error3 = buildStoryClipCanvasNodeData({
          project: project,
          episode: episode,
          clip: clip4,
          modelId: modelId2.modelId,
          provider: modelId2.provider,
          generationParams: modelId2.generationParams,
          generationValidation: modelId2.generationValidation,
        }),
        text9 = normalizeText(args4[key2]),
        value16 = Boolean(value10 && text9 && (await adapter2.nodeExists(text9, canvasId2)));
      value16
        ? (nodes3.push(
            await adapter2.updateVideoNode(text9, error3, {
              canvasId: canvasId2,
              sequenceKey: sequenceKey2,
            }),
          ),
          (updatedCount += 1))
        : (nodes3.push(
            await adapter2.createVideoNode(error3, { canvasId: canvasId2, sequenceKey: sequenceKey2 }),
          ),
          (createdCount += 1));
      const value17 = nodes3.at(-1),
        nodeId = normalizeText(value17?.id || (value16 ? text9 : ''));
      if (!nodeId) throw new Error('同步本集到项目画布失败：' + (error3.name || key2));
      ((nodes4[key2] = nodeId),
        bindings.push({
          key: key2,
          clipId: normalizeText(clip4.id),
          nodeId: nodeId,
          canvasId: canvasId2,
        }));
    }
    (adapter2.renameCanvas?.(canvasId2, canvasName),
      adapter2.commit?.(),
      typeof adapter2.focusNodes === 'function' &&
        nodes3.length &&
        (await adapter2.focusNodes(
          bindings.map((value18) => value18.nodeId),
          { padding: 80, durationMs: 0, maxZoom: 0.2 },
        )));
  } catch (value19) {
    await rollbackStoryEpisodeCanvasMutation({
      adapter: adapter2,
      canvasId: canvasId2,
      reused: Boolean(value10),
      mutationSnapshot: mutationSnapshot2,
    });
    throw value19;
  }
  const binding = {
    ...(value10 ? asObject4 : {}),
    canvasId: canvasId2,
    nodes: nodes4,
    ...(value10 && asObject4.layout ? { layout: { ...asObject(asObject4.layout) } } : {}),
  };
  return {
    canvasId: canvasId2,
    canvasName: canvasName,
    nodes: nodes3,
    reused: Boolean(value10),
    createdCount: createdCount,
    updatedCount: updatedCount,
    deletedCount: deletedCount,
    bindings: bindings,
    binding: binding,
    canvasBinding: binding,
  };
}
