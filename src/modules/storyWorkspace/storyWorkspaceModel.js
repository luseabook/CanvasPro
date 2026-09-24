import { normalizeStoryAssetReference } from './storyAssetMediaModel.js';
import { normalizeStoryMediaRefs } from './storyMediaModel.js';

export const STORY_WORKSPACE_SCHEMA = 'canvas-story-workspace.v1';
export const STORY_WORKSPACE_SIZE = Object.freeze({ width: 460, height: 260 });
export const STORY_LIMITS = Object.freeze({ episodes: 100, assets: 200, shotsPerEpisode: 300, shots: 2000, script: 200000, jsonBytes: 4 * 1024 * 1024 });
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,160}$/;
const RESERVED = new Set(['__proto__', 'prototype', 'constructor']);
export function storyId(prefix = 'story') {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}
function text(value, limit = 20000) {
  if (value == null) return '';
  if (typeof value !== 'string') throw new Error('文本字段必须是字符串');
  if (value.length > limit) throw new Error(`文本超过 ${limit} 字符限制，请拆分后导入`);
  return value;
}
function id(value) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value) || RESERVED.has(value)) throw new Error('无效或缺失的条目 ID');
  return value;
}
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('条目格式错误');
  return value;
}
function list(value, limit, label) {
  if (!Array.isArray(value) || value.length > limit) throw new Error(`${label}必须是数组，最多 ${limit} 项`);
  const seen = new Set();
  for (const entry of value) {
    object(entry); id(entry.id);
    if (seen.has(entry.id)) throw new Error(`${label}包含重复 ID`);
    seen.add(entry.id);
  }
  return value;
}
export function createEpisode(title = '新单集', script = '') {
  return { id: storyId('episode'), title, script, shots: [] };
}
export function createShot(description = '') {
  return { id: storyId('shot'), sceneId: '', characterIds: [], description, dialogue: '', duration: 5,
    size: '中景', characterNotes: '', action: '', mood: '', imagePrompt: '', videoPrompt: '', sound: '' };
}
export function createStoryWorkspace(title = '剧本工作室') {
  return { schemaVersion: STORY_WORKSPACE_SCHEMA, title, synopsis: '', characters: [], scenes: [], episodes: [createEpisode('第 1 集')] };
}
export function createStoryWorkspaceNodeData({ id, x = 0, y = 0, width, height, name = '剧本工作室' } = {}) {
  return { id, type: 'story-workspace', x, y, name,
    width: Math.max(380, Number(width) || STORY_WORKSPACE_SIZE.width),
    height: Math.max(240, Number(height) || STORY_WORKSPACE_SIZE.height), storyWorkspace: createStoryWorkspace(name) };
}
export function normalizeStoryWorkspace(input) {
  const value = object(input);
  if (value.schemaVersion !== STORY_WORKSPACE_SCHEMA) throw new Error('不支持的工作室 JSON 版本；本版只导入 canvas-story-workspace.v1');
  function normalizeAsset(asset) {
    const referenceNodeId = text(asset.referenceNodeId, 300);
    return { id: id(asset.id), name: text(asset.name, 300), description: text(asset.description), referenceNodeId,
      ...(asset.referenceImage !== undefined ? { referenceImage: normalizeStoryAssetReference(asset.referenceImage, referenceNodeId) } : {}) };
  }
  const characters = list(value.characters, STORY_LIMITS.assets, '人物').map(normalizeAsset);
  const scenes = list(value.scenes, STORY_LIMITS.assets, '场景').map(normalizeAsset);
  const characterIds = new Set(characters.map(c => c.id)), sceneIds = new Set(scenes.map(s => s.id));
  let shotCount = 0;
  const episodes = list(value.episodes, STORY_LIMITS.episodes, '单集').map(episode => {
    const shots = list(episode.shots, STORY_LIMITS.shotsPerEpisode, '单集分镜').map(shot => {
      const duration = Number(shot.duration);
      if (!Number.isFinite(duration) || duration <= 0 || duration > 3600) throw new Error('分镜时长须在 0–3600 秒之间，且大于 0');
      if (!Array.isArray(shot.characterIds) || shot.characterIds.some(c => !characterIds.has(c))) throw new Error('分镜引用了不存在的人物');
      if (shot.sceneId && !sceneIds.has(shot.sceneId)) throw new Error('分镜引用了不存在的场景');
      return { id: id(shot.id), sceneId: shot.sceneId || '', characterIds: [...new Set(shot.characterIds)], duration,
        size: text(shot.size, 300), characterNotes: text(shot.characterNotes), description: text(shot.description), dialogue: text(shot.dialogue), action: text(shot.action),
        mood: text(shot.mood, 1000), imagePrompt: text(shot.imagePrompt), videoPrompt: text(shot.videoPrompt), sound: text(shot.sound),
        ...(shot.mediaRefs !== undefined ? { mediaRefs: normalizeStoryMediaRefs(shot.mediaRefs) } : {}) };
    });
    shotCount += shots.length;
    return { id: id(episode.id), title: text(episode.title, 300), script: text(episode.script, STORY_LIMITS.script), shots };
  });
  if (shotCount > STORY_LIMITS.shots) throw new Error('工作室总分镜数超过 2000');
  const result = { schemaVersion: STORY_WORKSPACE_SCHEMA, title: text(value.title, 300), synopsis: text(value.synopsis), characters, scenes, episodes };
  if (new TextEncoder().encode(JSON.stringify(result)).length > STORY_LIMITS.jsonBytes) throw new Error('工作室数据超过 4MB，请拆成多个工作室节点');
  return result;
}
export function parseStoryWorkspaceJson(raw) {
  if (new TextEncoder().encode(raw).length > STORY_LIMITS.jsonBytes) throw new Error('JSON 文件超过 4MB');
  return normalizeStoryWorkspace(JSON.parse(raw.replace(/^\uFEFF/, '')));
}
export function draftShotsFromScript(script) {
  const paragraphs = text(script, STORY_LIMITS.script).replace(/\r\n?/g, '\n').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (!paragraphs.length) throw new Error('请先填写单集正文，以空行分隔段落');
  if (paragraphs.length > STORY_LIMITS.shotsPerEpisode) throw new Error('段落超过 300，请先拆分单集');
  return paragraphs.map(paragraph => createShot(text(paragraph)));
}
export function removeStoryAsset(workspace, kind, assetId) {
  if (!['characters', 'scenes'].includes(kind)) throw new Error('未知资料类型');
  return normalizeStoryWorkspace({ ...workspace, [kind]: workspace[kind].filter(asset => asset.id !== assetId),
    episodes: workspace.episodes.map(episode => ({ ...episode, shots: episode.shots.map(shot => ({ ...shot,
      sceneId: kind === 'scenes' && shot.sceneId === assetId ? '' : shot.sceneId,
      characterIds: kind === 'characters' ? shot.characterIds.filter(id => id !== assetId) : shot.characterIds,
    })) })) });
}
export function duplicateEpisode(episode) {
  return { ...episode, id: storyId('episode'), title: `${episode.title.slice(0, 290)}（副本）`,
    shots: episode.shots.map(shot => {
      const { mediaRefs, ...content } = shot; // A new shot must not inherit another shot's accepted media.
      return { ...content, id: storyId('shot'), characterIds: [...shot.characterIds] };
    }) };
}
export function moveStoryItem(items, itemId, offset) {
  const index = items.findIndex(item => item.id === itemId), target = index + offset;
  if (index < 0 || target < 0 || target >= items.length) return [...items];
  const copy = [...items]; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy;
}
function referenceUrl(asset, nodes) {
  const node = nodes[asset?.referenceNodeId];
  if (!node || node.type !== 'source-image') return '';
  const src = String(node.src || '');
  // Do not propagate javascript:, file:, protocol-relative or transient blob URLs.
  if (/^https?:\/\//i.test(src) || /^\/(?!\/)/.test(src)) return src;
  return '';
}
export function episodeStoryboardRows(workspace, episode, nodes = {}) {
  return episode.shots.map((shot, index) => {
    const characters = shot.characterIds.map(id => workspace.characters.find(c => c.id === id)).filter(Boolean);
    const scene = workspace.scenes.find(s => s.id === shot.sceneId);
    return { '镜号': String(index + 1), '时长': String(shot.duration), '景别': shot.size,
      '场景': scene?.name || '', '画面描述': shot.description, '角色': characters.map(c => c.name).join('、'),
      '角色描述': shot.characterNotes || characters.map(c => `${c.name}：${c.description}`).join('\n'), '角色动作': shot.action, '情绪': shot.mood,
      '角色图': characters.map(c => referenceUrl(c, nodes)).filter(Boolean).join('\n'), '参考': referenceUrl(scene, nodes),
      '图片提示词': shot.imagePrompt || [shot.description, scene?.description, ...characters.map(c => c.description)].filter(Boolean).join('\n'),
      '视频提示词': shot.videoPrompt || [shot.description, shot.action].filter(Boolean).join('\n'), '对白': shot.dialogue, '音效': shot.sound };
  });
}
export function collectStoryboardEpisode(workspace, source) {
  const rows = source?.storyboardScript?.rows;
  if (!Array.isArray(rows) || rows.length > STORY_LIMITS.shotsPerEpisode) throw new Error('源节点无有效分镜表，或分镜超过 300');
  const next = normalizeStoryWorkspace(workspace), episode = createEpisode(String(source.name || '收集的分镜').slice(0, 300));
  function lookup(kind, name) {
    if (!name) return '';
    let asset = next[kind].find(a => a.name === name);
    if (!asset) { asset = { id: storyId(kind), name, description: '', referenceNodeId: '' }; next[kind].push(asset); }
    return asset.id;
  }
  function cell(row, key) {
    const value = row[key];
    if (value == null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
  episode.shots = rows.map(row => {
    object(row);
    const shot = createShot(cell(row, '画面描述'));
    // Non-numeric durations are not silently coerced; the editor can fix them in the source node.
    const duration = cell(row, '时长').trim();
    if (duration && !/^\d+(?:\.\d+)?(?:\s*(?:s|秒))?$/i.test(duration)) throw new Error('源分镜时长需是数字秒数（例如 5 或 5秒），请先在源节点修正');
    shot.duration = duration ? parseFloat(duration) : 5;
    shot.sceneId = lookup('scenes', cell(row, '场景'));
    shot.characterIds = cell(row, '角色').split(/[、,，\n]/).map(n => n.trim()).filter(Boolean).map(name => lookup('characters', name));
    for (const [field, key] of Object.entries({ size: '景别', characterNotes: '角色描述', dialogue: '对白', action: '角色动作', mood: '情绪', imagePrompt: '图片提示词', videoPrompt: '视频提示词', sound: '音效' })) shot[field] = cell(row, key);
    return shot;
  });
  next.episodes.push(episode);
  return { workspace: normalizeStoryWorkspace(next), episodeId: episode.id };
}
export function storyWorkspaceMarkdown(workspace) {
  const parts = [`# ${workspace.title}`, workspace.synopsis, '## 人物', ...workspace.characters.map(c => `### ${c.name}\n${c.description}`),
    '## 场景', ...workspace.scenes.map(s => `### ${s.name}\n${s.description}`)];
  for (const episode of workspace.episodes) {
    parts.push(`## ${episode.title}`, episode.script);
    episodeStoryboardRows(workspace, episode).forEach(row => {
      parts.push(`### 镜头 ${row['镜号']} · ${row['时长']} 秒`, ...Object.entries(row).filter(([key, value]) => value && !['镜号', '时长'].includes(key)).map(([key, value]) => `${key}：${value}`));
    });
  }
  return parts.join('\n\n');
}
export function storyEpisodeCsv(workspace, episode) {
  const rows = episodeStoryboardRows(workspace, episode);
  const columns = ['镜号', '时长', '景别', '场景', '画面描述', '角色', '角色描述', '角色动作', '情绪', '图片提示词', '视频提示词', '对白', '音效'];
  function escape(value) {
    let safe = String(value ?? '');
    if (/^[\s\uFEFF]*[=+@-]/.test(safe)) safe = "'" + safe;
    return '"' + safe.replace(/"/g, '""') + '"';
  }
  return '\uFEFF' + [columns, ...rows.map(row => columns.map(key => row[key]))].map(row => row.map(escape).join(',')).join('\r\n');
}
