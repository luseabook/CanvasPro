import { desktopBridge } from '../../services/desktopBridge.js';
import { isRemoteHttpUrl, resolveCanvasVideoLocalPath } from '../../services/canvasMediaLocalService.js';
function asObject(value) {
  return value && typeof value === 'object' && !Array['isArray'](value) ? value : {};
}
function normalizeText(item) {
  return String(item || '')['trim']();
}
function normalizePositiveInteger(key, index = 1) {
  const count = Number(key);
  return Number['isFinite'](count) && count > 0 ? Math['trunc'](count) : index;
}
function formatSequence(result) {
  return String(normalizePositiveInteger(result))['padStart'](2, '0');
}
function sanitizeFilenamePart(data, options = '剧本') {
  const text = normalizeText(data)
    ['replace'](/[\\/:*?"<>|\x00-\x1F]/g, '_')
    ['replace'](/\s+/g, ' ')
    ['replace'](/[. ]+$/g, '')
    ['slice'](0, 80)
    ['trim']();
  return text || options;
}
function resolveActiveVideoResult(options2 = {}) {
  const asObject2 = asObject(options2['video']),
    list = Array['isArray'](asObject2['results'])
      ? asObject2['results']['filter']((target) => target && typeof target === 'object')
      : [];
  if (!list['length']) return null;
  const source = Number(asObject2['activeIndex']),
    next = Number['isFinite'](source)
      ? Math['max'](0, Math['min'](list['length'] - 1, Math['trunc'](source)))
      : 0,
    current = list[next];
  return normalizeText(current?.['error']) ? null : current;
}
function resolveVideoExportSource(response = {}) {
  const localPath = resolveCanvasVideoLocalPath(response);
  if (localPath) return { localPath: localPath, url: '' };
  const entry = [response['videoUrl'], response['url'], response['displayUrl']];
  for (const record of entry) {
    const url = normalizeText(record);
    if (!isRemoteHttpUrl(url)) continue;
    if (url) return { localPath: '', url: url };
  }
  return null;
}
function createMissingClipEntry(options3 = {}, payload = {}, handle = 0) {
  return {
    nodeId: normalizeText(payload['id']),
    nodeName:
      'E' + formatSequence(options3['number']) + '-C' + formatSequence(payload['number'] || handle + 1),
    nodeType: 'story-clip-video',
    kind: 'video',
    reason: 'NO_ACTIVE_VIDEO',
    detail: '片段没有可导出的当前视频版本',
  };
}
export function buildStoryClipExportItem({
  episode: episode = {},
  clip: clip = {},
  clipIndex: clipIndex = 0,
} = {}) {
  const activeVideoResult = resolveActiveVideoResult(clip),
    localPath2 = activeVideoResult ? resolveVideoExportSource(activeVideoResult) : null;
  if (!localPath2) return null;
  const positiveInteger = normalizePositiveInteger(episode['number'], 1),
    positiveInteger2 = normalizePositiveInteger(clip['number'], clipIndex + 1),
    nodeName = 'E' + formatSequence(positiveInteger) + '-C' + formatSequence(positiveInteger2);
  return {
    nodeId: normalizeText(clip['id']) || nodeName,
    nodeName: nodeName,
    nodeType: 'story-clip-video',
    kind: 'video',
    ...(localPath2['localPath'] ? { localPath: localPath2['localPath'] } : { url: localPath2['url'] }),
    filenameHint: localPath2['localPath'] || localPath2['url'],
  };
}
export function buildStoryClipExportPlan({
  project: project = {},
  episode: episode = {},
  clip: clip = null,
  mode: mode = 'current',
} = {}) {
  const requestedCount =
      mode === 'episode'
        ? Array['isArray'](episode['clips'])
          ? episode['clips']
          : []
        : [clip]['filter'](Boolean),
    items = [],
    skipped = [];
  requestedCount['forEach']((clip2, clipIndex2) => {
    const storyClipExportItem = buildStoryClipExportItem({
      episode: episode,
      clip: clip2,
      clipIndex: clipIndex2,
    });
    if (storyClipExportItem) items['push'](storyClipExportItem);
    else skipped['push'](createMissingClipEntry(episode, clip2, clipIndex2));
  });
  const positiveInteger3 = normalizePositiveInteger(episode['number'], 1),
    filename = sanitizeFilenamePart(project['name'] || project['title'] || project['storyTitle']);
  return {
    mode: mode,
    requestedCount: requestedCount['length'],
    items: items,
    skipped: skipped,
    filename:
      filename +
      '-E' +
      formatSequence(positiveInteger3) +
      '-' +
      (mode === 'episode' ? '全部片段' : '当前片段') +
      '.zip',
  };
}
function getExportSelected(state) {
  if (typeof state === 'function') return state;
  return (config) => desktopBridge['nodeExport']['exportSelected'](config);
}
export async function exportStoryClipVideos({
  project: project = {},
  episode: episode = {},
  clip: clip = null,
  mode: mode = 'current',
  exportSelected: exportSelected,
} = {}) {
  const filename2 = buildStoryClipExportPlan({ project: project, episode: episode, clip: clip, mode: mode });
  if (!filename2['items']['length'])
    throw new Error(mode === 'episode' ? '本集还没有可导出的视频片段' : '当前片段还没有可导出的视频');
  const args = await getExportSelected(exportSelected)({
      filename: filename2['filename'],
      items: filename2['items'],
    }),
    args2 = Array['isArray'](args?.['skipped']) ? args['skipped'] : [],
    skipped2 = [...filename2['skipped'], ...args2];
  return {
    ...args,
    requestedCount: filename2['requestedCount'],
    skipped: skipped2,
    skippedCount: skipped2['length'],
  };
}
