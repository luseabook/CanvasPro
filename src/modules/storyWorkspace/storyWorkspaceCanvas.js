import { assertStoryAssetReferences } from './storyAssetMediaModel.js';
import appStore from '../../core/stores/appStore.js';
import { generateId } from '../../core/math.js';
import { createStoryboardScriptNodeData } from '../../core/storyboardScriptFactory.js';
import { commit } from '../history.js';
import { calcSafeSpawnPosNearNode } from '../nodeSpawn.js';
import { episodeStoryboardRows } from './storyWorkspaceModel.js';

export function createEpisodeStoryboardNode(workspaceNodeId, workspace, episodeId, expectedNodes) {
  const state = appStore.getStateRaw(), anchor = state.nodes?.[workspaceNodeId];
  if (!anchor || state.nodes !== expectedNodes) throw new Error('来源画布已改变，请重新打开工作室');
  const episode = workspace.episodes.find(item => item.id === episodeId);
  if (!episode?.shots.length) throw new Error('请先添加分镜或按段落生成草稿');
  assertStoryAssetReferences({ workspace, workspaceNodeId, nodes: state.nodes, episode });
  const rows = episodeStoryboardRows(workspace, episode, state.nodes), referenceImageRefs = [];
  const imageLabels = new Map();
  for (const row of rows) {
    for (const key of ['角色图', '参考']) {
      row[key] = row[key].split('\n').filter(Boolean).map(url => {
        if (!imageLabels.has(url)) {
          const label = `@图片${referenceImageRefs.length + 1}`;
          imageLabels.set(url, label); referenceImageRefs.push({ label, url, type: 'image', source: 'story-workspace' });
        }
        return imageLabels.get(url);
      }).join(' ');
    }
  }
  const position = calcSafeSpawnPosNearNode(state.nodes, anchor, 1024, 576);
  const node = createStoryboardScriptNodeData({ id: generateId('node'), ...position, name: `${workspace.title} · ${episode.title}`,
    storyboardScript: { title: episode.title, rows, referenceImageRefs } });
  node.prompt = [workspace.synopsis, episode.script].filter(Boolean).join('\n\n');
  node.storyWorkspaceSource = { nodeId: workspaceNodeId, episodeId };
  appStore.addNode(node); commit();
  return node.id;
}
