import { desktopBridge } from '../../services/desktopBridge.js';
import { isRemoteHttpUrl, resolveCanvasVideoLocalPath } from '../../services/canvasMediaLocalService.js';
function asObject(_0x106cc6) {
  return _0x106cc6 && typeof _0x106cc6 === 'object' && !Array['isArray'](_0x106cc6) ? _0x106cc6 : {};
}
function normalizeText(_0x1d8bd8) {
  return String(_0x1d8bd8 || '')['trim']();
}
function normalizePositiveInteger(_0x27d2a5, _0x334c7e = 0x1) {
  const _0x22688b = Number(_0x27d2a5);
  return Number['isFinite'](_0x22688b) && _0x22688b > 0x0 ? Math['trunc'](_0x22688b) : _0x334c7e;
}
function formatSequence(_0x100808) {
  return String(normalizePositiveInteger(_0x100808))['padStart'](0x2, '0');
}
function sanitizeFilenamePart(_0x33c0c5, _0x4f2bbb = '剧本') {
  const _0x19dd2 = normalizeText(_0x33c0c5)
    ['replace'](/[\\/:*?"<>|\x00-\x1F]/g, '_')
    ['replace'](/\s+/g, '\x20')
    ['replace'](/[. ]+$/g, '')
    ['slice'](0x0, 0x50)
    ['trim']();
  return _0x19dd2 || _0x4f2bbb;
}
function resolveActiveVideoResult(_0x9e9a78 = {}) {
  const _0x166f3f = asObject(_0x9e9a78['video']),
    _0x1b3a4f = Array['isArray'](_0x166f3f['results'])
      ? _0x166f3f['results']['filter']((_0x51ab1d) => _0x51ab1d && typeof _0x51ab1d === 'object')
      : [];
  if (!_0x1b3a4f['length']) return null;
  const _0x503e9c = Number(_0x166f3f['activeIndex']),
    _0x582409 = Number['isFinite'](_0x503e9c)
      ? Math['max'](0x0, Math['min'](_0x1b3a4f['length'] - 0x1, Math['trunc'](_0x503e9c)))
      : 0x0,
    _0x4e84cc = _0x1b3a4f[_0x582409];
  return normalizeText(_0x4e84cc?.['error']) ? null : _0x4e84cc;
}
function resolveVideoExportSource(_0x553f69 = {}) {
  const _0x32a7c4 = resolveCanvasVideoLocalPath(_0x553f69);
  if (_0x32a7c4) return { localPath: _0x32a7c4, url: '' };
  const _0x223b42 = [_0x553f69['videoUrl'], _0x553f69['url'], _0x553f69['displayUrl']];
  for (const _0x38637b of _0x223b42) {
    const _0x5d4e0c = normalizeText(_0x38637b);
    if (!isRemoteHttpUrl(_0x5d4e0c)) continue;
    if (_0x5d4e0c) return { localPath: '', url: _0x5d4e0c };
  }
  return null;
}
function createMissingClipEntry(_0xc04d81 = {}, _0x446065 = {}, _0x4b511a = 0x0) {
  return {
    nodeId: normalizeText(_0x446065['id']),
    nodeName:
      'E' +
      formatSequence(_0xc04d81['number']) +
      '-C' +
      formatSequence(_0x446065['number'] || _0x4b511a + 0x1),
    nodeType: 'story-clip-video',
    kind: 'video',
    reason: 'NO_ACTIVE_VIDEO',
    detail: '片段没有可导出的当前视频版本',
  };
}
export function buildStoryClipExportItem({
  episode: episode = {},
  clip: clip = {},
  clipIndex: clipIndex = 0x0,
} = {}) {
  const _0x5822b2 = resolveActiveVideoResult(clip),
    _0x207bd4 = _0x5822b2 ? resolveVideoExportSource(_0x5822b2) : null;
  if (!_0x207bd4) return null;
  const _0x31bfab = normalizePositiveInteger(episode['number'], 0x1),
    _0x48f3d2 = normalizePositiveInteger(clip['number'], clipIndex + 0x1),
    _0x3399f2 = 'E' + formatSequence(_0x31bfab) + '-C' + formatSequence(_0x48f3d2);
  return {
    nodeId: normalizeText(clip['id']) || _0x3399f2,
    nodeName: _0x3399f2,
    nodeType: 'story-clip-video',
    kind: 'video',
    ...(_0x207bd4['localPath'] ? { localPath: _0x207bd4['localPath'] } : { url: _0x207bd4['url'] }),
    filenameHint: _0x207bd4['localPath'] || _0x207bd4['url'],
  };
}
export function buildStoryClipExportPlan({
  project: project = {},
  episode: episode = {},
  clip: clip = null,
  mode: mode = 'current',
} = {}) {
  const _0x772e5c =
      mode === 'episode'
        ? Array['isArray'](episode['clips'])
          ? episode['clips']
          : []
        : [clip]['filter'](Boolean),
    _0x28e961 = [],
    _0x2ecc68 = [];
  _0x772e5c['forEach']((_0xd67d5b, _0x549cef) => {
    const _0x49e215 = buildStoryClipExportItem({ episode: episode, clip: _0xd67d5b, clipIndex: _0x549cef });
    if (_0x49e215) _0x28e961['push'](_0x49e215);
    else _0x2ecc68['push'](createMissingClipEntry(episode, _0xd67d5b, _0x549cef));
  });
  const _0x39cc3b = normalizePositiveInteger(episode['number'], 0x1),
    _0x1fae84 = sanitizeFilenamePart(project['name'] || project['title'] || project['storyTitle']);
  return {
    mode: mode,
    requestedCount: _0x772e5c['length'],
    items: _0x28e961,
    skipped: _0x2ecc68,
    filename:
      _0x1fae84 +
      '-E' +
      formatSequence(_0x39cc3b) +
      '-' +
      (mode === 'episode' ? '全部片段' : '当前片段') +
      '.zip',
  };
}
function getExportSelected(_0x24d845) {
  if (typeof _0x24d845 === 'function') return _0x24d845;
  return (_0x489496) => desktopBridge['nodeExport']['exportSelected'](_0x489496);
}
export async function exportStoryClipVideos({
  project: project = {},
  episode: episode = {},
  clip: clip = null,
  mode: mode = 'current',
  exportSelected: _0x186713,
} = {}) {
  const _0x4e1b76 = buildStoryClipExportPlan({ project: project, episode: episode, clip: clip, mode: mode });
  if (!_0x4e1b76['items']['length'])
    throw new Error(mode === 'episode' ? '本集还没有可导出的视频片段' : '当前片段还没有可导出的视频');
  const _0xf559ae = await getExportSelected(_0x186713)({
      filename: _0x4e1b76['filename'],
      items: _0x4e1b76['items'],
    }),
    _0x3fdd34 = Array['isArray'](_0xf559ae?.['skipped']) ? _0xf559ae['skipped'] : [],
    _0x17229b = [..._0x4e1b76['skipped'], ..._0x3fdd34];
  return {
    ..._0xf559ae,
    requestedCount: _0x4e1b76['requestedCount'],
    skipped: _0x17229b,
    skippedCount: _0x17229b['length'],
  };
}
