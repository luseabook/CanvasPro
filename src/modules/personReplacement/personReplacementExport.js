import { saveMediaDownload, saveMediaFilesDownload } from '../../services/downloadSaveService.js';
import { localPathToUrl, normalizeLocalPath } from '../../utils/localMediaPath.js';
export const PERSON_REPLACEMENT_EXPORT_MODES = Object['freeze']({
  FINAL_VIDEO: 'final-video',
  CURRENT_CLIP: 'current-clip',
  ALL_REPLACEMENT_CLIPS: 'all-replacement-clips',
  ALL_CLIPS_AND_IMAGES: 'all-clips-and-images',
});
function normalizeText(_0x2f817a) {
  return String(_0x2f817a || '')['trim']();
}
function normalizeMode(_0x5ca83c) {
  const _0x44384b = normalizeText(_0x5ca83c);
  if (Object['values'](PERSON_REPLACEMENT_EXPORT_MODES)['includes'](_0x44384b)) return _0x44384b;
  return PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP'];
}
function formatSequence(_0x2fad7f) {
  return String(_0x2fad7f + 0x1)['padStart'](0x2, '0');
}
function resolveMediaExtension(_0x206d98, _0x185742) {
  const _0x43ec1e = normalizeText(_0x206d98)
    ['replace'](/[?#].*$/, '')
    ['match'](/\.([a-z0-9]{2,10})$/i);
  return normalizeText(_0x43ec1e?.[0x1])['toLowerCase']() || _0x185742;
}
function buildMediaFile({ ref: _0x5cae7b, kind: _0x504086, filename: _0xcadb51 }) {
  const _0x209847 = normalizeText(_0x5cae7b);
  if (!_0x209847) return null;
  const _0x57bd74 = normalizeLocalPath(_0x209847);
  return {
    kind: _0x504086,
    localPath: _0x57bd74,
    url: localPathToUrl(_0x57bd74) || _0x209847,
    filename: _0xcadb51,
  };
}
function buildReplacementVideoFile(_0x3e00a9, _0x4446ab) {
  const _0x25ed57 = normalizeText(_0x3e00a9?.['resultVideoRef']);
  if (!_0x25ed57) return null;
  return buildMediaFile({
    ref: _0x25ed57,
    kind: 'video',
    filename: '镜头片段' + formatSequence(_0x4446ab) + '-替换视频.' + resolveMediaExtension(_0x25ed57, 'mp4'),
  });
}
function buildReplacementImageFile(_0x2189aa, _0xd222ee) {
  const _0x35d054 = normalizeText(_0x2189aa?.['replacementImageRef']);
  if (!_0x35d054) return null;
  return buildMediaFile({
    ref: _0x35d054,
    kind: 'image',
    filename: '镜头片段' + formatSequence(_0xd222ee) + '-替换图.' + resolveMediaExtension(_0x35d054, 'png'),
  });
}
function buildReplacementAudioFile(_0x2434af) {
  const _0x42a5cd = normalizeText(_0x2434af?.['audio']?.['replacementAudioRef']);
  if (!_0x42a5cd) return null;
  return buildMediaFile({
    ref: _0x42a5cd,
    kind: 'audio',
    filename: '替换音频.' + resolveMediaExtension(_0x42a5cd, 'wav'),
  });
}
function buildFinalVideoFile(_0x41de15) {
  const _0x5c7cf6 = normalizeText(_0x41de15?.['output']?.['finalVideoRef']);
  if (!_0x5c7cf6) return null;
  return buildMediaFile({
    ref: _0x5c7cf6,
    kind: 'video',
    filename: '完整视频.' + resolveMediaExtension(_0x5c7cf6, 'mp4'),
  });
}
function createSkippedEntry(_0x4d0ede, _0x4f1a21, _0x4dc95a) {
  return {
    shotId: normalizeText(_0x4d0ede?.['id']),
    shotName: '镜头片段' + formatSequence(_0x4f1a21),
    kind: _0x4dc95a,
  };
}
export function buildPersonReplacementExportPlan({
  project: project = {},
  mode: mode = PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP'],
} = {}) {
  const _0x23bd59 = normalizeMode(mode),
    _0x388b96 = Array['isArray'](project['shots']) ? project['shots'] : [],
    _0x424b4c = [],
    _0x1aab7d = [];
  if (_0x23bd59 === PERSON_REPLACEMENT_EXPORT_MODES['FINAL_VIDEO']) {
    const _0x976aa0 = buildFinalVideoFile(project);
    if (!_0x976aa0) throw new Error('完整视频尚未封装，请先完成视频与音轨合成。');
    _0x424b4c['push'](_0x976aa0);
  } else {
    if (_0x23bd59 === PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP']) {
      const _0x5c4bf6 = normalizeText(project['workspace']?.['selectedShotId']),
        _0x42a642 = _0x388b96['findIndex']((_0x35e838) => normalizeText(_0x35e838?.['id']) === _0x5c4bf6);
      if (_0x42a642 < 0x0) throw new Error('请先选择要导出的镜头片段。');
      const _0x197ca7 = buildReplacementVideoFile(_0x388b96[_0x42a642], _0x42a642);
      if (!_0x197ca7) throw new Error('当前片段还没有可导出的替换视频。');
      _0x424b4c['push'](_0x197ca7);
    } else {
      _0x388b96['forEach']((_0x569ba4, _0x193b96) => {
        const _0x253ac9 = buildReplacementVideoFile(_0x569ba4, _0x193b96);
        if (_0x253ac9) _0x424b4c['push'](_0x253ac9);
        else _0x1aab7d['push'](createSkippedEntry(_0x569ba4, _0x193b96, 'video'));
        if (_0x23bd59 === PERSON_REPLACEMENT_EXPORT_MODES['ALL_CLIPS_AND_IMAGES']) {
          const _0x11ea16 = buildReplacementImageFile(_0x569ba4, _0x193b96);
          if (_0x11ea16) _0x424b4c['push'](_0x11ea16);
          else _0x1aab7d['push'](createSkippedEntry(_0x569ba4, _0x193b96, 'image'));
        }
      });
      const _0x35f625 = buildReplacementAudioFile(project);
      if (_0x35f625) _0x424b4c['push'](_0x35f625);
      if (!_0x424b4c['length'])
        throw new Error(
          _0x23bd59 === PERSON_REPLACEMENT_EXPORT_MODES['ALL_CLIPS_AND_IMAGES']
            ? '当前项目还没有可导出的替换片段、音频或替换图。'
            : '当前项目还没有可导出的替换片段或音频。',
        );
    }
  }
  const _0x24fd77 =
    _0x23bd59 === PERSON_REPLACEMENT_EXPORT_MODES['FINAL_VIDEO']
      ? '导出完整视频'
      : _0x23bd59 === PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP']
        ? '导出当前片段'
        : _0x23bd59 === PERSON_REPLACEMENT_EXPORT_MODES['ALL_REPLACEMENT_CLIPS']
          ? '导出所有替换片段/音频'
          : '导出所有替换结果';
  return { mode: _0x23bd59, title: _0x24fd77, files: _0x424b4c, skipped: _0x1aab7d };
}
export async function exportPersonReplacementMedia({
  project: project = {},
  mode: mode = PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP'],
  saveMedia: saveMedia = saveMediaDownload,
  saveMediaFiles: saveMediaFiles = saveMediaFilesDownload,
} = {}) {
  const _0x40ab61 = buildPersonReplacementExportPlan({ project: project, mode: mode }),
    _0xb0f6dd =
      _0x40ab61['mode'] === PERSON_REPLACEMENT_EXPORT_MODES['FINAL_VIDEO'] ||
      _0x40ab61['mode'] === PERSON_REPLACEMENT_EXPORT_MODES['CURRENT_CLIP']
        ? await saveMedia({ ..._0x40ab61['files'][0x0], title: _0x40ab61['title'] })
        : await saveMediaFiles({ title: _0x40ab61['title'], files: _0x40ab61['files'] });
  return {
    ..._0xb0f6dd,
    mode: _0x40ab61['mode'],
    requestedCount: _0x40ab61['files']['length'] + _0x40ab61['skipped']['length'],
    exportedCount: _0xb0f6dd?.['count'] ?? _0x40ab61['files']['length'],
    skipped: _0x40ab61['skipped'],
    skippedCount: _0x40ab61['skipped']['length'],
  };
}
