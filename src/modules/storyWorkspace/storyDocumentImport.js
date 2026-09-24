import { createEpisode, normalizeStoryWorkspace, STORY_LIMITS } from './storyWorkspaceModel.js';

export const DOCUMENT_PREVIEW_LIMIT = 1200000; // UTF-16 units; server limit is 600000 Unicode code points.
export function splitDocumentText(input, limit = STORY_LIMITS.script) {
  if (typeof input !== 'string' || !input.trim()) throw new Error('提取内容为空，不能导入。');
  if (input.length > DOCUMENT_PREVIEW_LIMIT) throw new Error('文档文字过长，请先拆分文档。');
  if (!Number.isInteger(limit) || limit < 2) throw new Error('无效的单集长度限制。');
  const parts = [];
  let start = 0;
  while (start < input.length) {
    let end = Math.min(start + limit, input.length);
    if (end < input.length) {
      const paragraph = input.lastIndexOf('\n\n', end - 2);
      const line = input.lastIndexOf('\n', end - 1);
      if (paragraph > start + limit / 2) end = paragraph + 2;
      else if (line > start + limit / 2) end = line + 1;
      // Never split a valid surrogate pair between episodes.
      const previous = input.charCodeAt(end - 1), next = input.charCodeAt(end);
      if (previous >= 0xd800 && previous <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) end--;
    }
    parts.push(input.slice(start, end)); start = end;
  }
  return parts;
}
export function appendDocumentToWorkspace(workspace, fileName, text) {
  const parts = splitDocumentText(text);
  if (workspace.episodes.length + parts.length > STORY_LIMITS.episodes) throw new Error(`追加后将超过 ${STORY_LIMITS.episodes} 集，请先清理或另建工作室。`);
  const title = String(fileName || '导入文档').replace(/\.(docx|pdf)$/i, '').slice(0, 275) || '导入文档';
  const episodes = parts.map((script, index) => createEpisode(parts.length === 1 ? title : `${title}（文档片段 ${index + 1}）`, script));
  // Validate the whole operation before assigning anything to the active draft.
  const next = normalizeStoryWorkspace({ ...workspace, episodes: [...workspace.episodes, ...episodes] });
  return { workspace: next, episodeId: episodes[0].id, count: episodes.length };
}
