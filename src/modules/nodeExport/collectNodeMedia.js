import { normalizeLocalPath } from '../../utils/localMediaPath.js';
import { NODE_MEDIA_EXPORT_LIMITS, normalizeMediaExportItems, safeExportName } from './nodeMediaExportModel.js';

const KINDS = Object.freeze({
  'source-image': 'image', image: 'image', 'ai-image': 'image', storyboard: 'image',
  'source-video': 'video', video: 'video', 'ai-video': 'video',
  'source-audio': 'audio', audio: 'audio', 'ai-audio': 'audio',
});

export function collectNodeMedia(nodes, selectedIds) {
  if (!Array.isArray(selectedIds) || selectedIds.length > NODE_MEDIA_EXPORT_LIMITS.items) {
    throw new Error('每次最多选择 100 个节点');
  }
  const items = [], skipped = [];
  for (const nodeId of new Set(selectedIds)) {
    const node = nodes?.[nodeId], kind = KINDS[node?.type];
    const name = safeExportName(node?.name || node?.fileName || nodeId);
    let reason = '';
    if (!node) reason = '节点已不存在';
    else if (!kind) reason = '不是可导出的图片、视频或音频结果节点';
    else if (node.isGenerating || ['waiting', 'processing'].includes(node.mediaTaskStatus)) reason = '媒体仍在生成或处理中';
    if (reason) { skipped.push({ nodeId, name, reason }); continue; }
    // Prefer original bytes. Never silently substitute a poster, waveform or thumbnail.
    const candidates = [node.originalLocalPath, node.localPath, node[`${kind}Url`],
      node.src, node.url, node.resultUrl, node.sourceUrl];
    const source = candidates.find(value => typeof value === 'string' && value.trim()) || '';
    const localPath = normalizeLocalPath(source);
    try {
      const [item] = normalizeMediaExportItems({ items: [{ nodeId, name, kind, localPath }] });
      items.push(item);
    } catch {
      skipped.push({ nodeId, name, reason: '无可用本地原媒体，或路径/扩展名不受支持；不会下载远程媒体' });
    }
  }
  return { items: items.length ? normalizeMediaExportItems({ items }) : [], skipped };
}
