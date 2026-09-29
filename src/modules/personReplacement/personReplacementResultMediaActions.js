import { runWorkspaceImageDownloadAction } from '../workspaceImageDownload.js';
import { runWorkspaceVideoDownloadAction } from '../workspaceVideoDownload.js';
function normalizeText(_0x65ada2) {
  return String(_0x65ada2 ?? '')['trim']();
}
function getSelectedShot(_0x156660 = {}) {
  return (
    _0x156660['shots']?.['find'](
      (_0x3e0847) => _0x3e0847['id'] === _0x156660['workspace']?.['selectedShotId'],
    ) || null
  );
}
function buildShotFilenameBase(_0x446351, _0x19482a, _0x3b4d63) {
  const _0x1c18e2 = Math['max'](
    0x0,
    _0x446351['shots']['findIndex']((_0x3ec65d) => _0x3ec65d['id'] === _0x19482a['id']),
  );
  return '镜头片段' + String(_0x1c18e2 + 0x1)['padStart'](0x2, '0') + '-' + _0x3b4d63;
}
function resolveOriginalVideoRef(_0x5c8c5c = {}) {
  const _0x4c52f8 = Array['isArray'](_0x5c8c5c?.['replacementVideo']?.['results'])
      ? _0x5c8c5c['replacementVideo']['results']
      : [],
    _0x2c294c = Math['max'](
      0x0,
      Math['min'](
        _0x4c52f8['length'] - 0x1,
        Math['trunc'](Number(_0x5c8c5c?.['replacementVideo']?.['activeIndex']) || 0x0),
      ),
    ),
    _0x1bbc2f = _0x4c52f8[_0x2c294c] || {};
  return normalizeText(
    _0x1bbc2f['originalLocalPath'] ||
      _0x1bbc2f['localPath'] ||
      _0x1bbc2f['videoUrl'] ||
      _0x1bbc2f['url'] ||
      _0x5c8c5c['resultVideoRef'],
  );
}
export function createPersonReplacementResultMediaActions({
  getProject: _0x95cf9b,
  runIntent: _0x464675,
  downloadImageIntent: _0x599815,
  downloadVideoIntent: _0x3a0b8b,
} = {}) {
  const _0x1f8364 = () => {
      const _0x113829 = _0x95cf9b(),
        _0x550e2a = getSelectedShot(_0x113829),
        _0x486a10 = normalizeText(_0x550e2a?.['replacementImageRef']);
      return _0x550e2a && _0x486a10
        ? {
            imageRef: _0x486a10,
            filenameBase: buildShotFilenameBase(_0x113829, _0x550e2a, '替换图'),
            title: '下载替换图片',
          }
        : null;
    },
    _0x389219 = () => {
      const _0x285fc8 = _0x95cf9b(),
        _0x1a02a7 = getSelectedShot(_0x285fc8),
        _0x1b458d = resolveOriginalVideoRef(_0x1a02a7);
      return _0x1a02a7 && _0x1b458d
        ? {
            videoRef: _0x1b458d,
            filenameBase: buildShotFilenameBase(_0x285fc8, _0x1a02a7, '替换视频'),
            title: '下载替换视频',
          }
        : null;
    },
    _0x24ebb6 = (_0x12d175, _0x5d1f7f, _0x584e46, _0xfce1b) => {
      if (!_0xfce1b) return ![];
      return (
        void _0x12d175(_0x584e46, () =>
          Promise['resolve'](_0x464675(_0x5d1f7f, _0xfce1b, {}, { applyCallbackResult: ![] })),
        ),
        !![]
      );
    };
  return {
    getSelectedReplacementImageDownloadRequest: _0x1f8364,
    getSelectedReplacementVideoDownloadRequest: _0x389219,
    requestImageDownload: (_0x8415e6, _0x554833) =>
      _0x24ebb6(runWorkspaceImageDownloadAction, _0x599815, _0x8415e6, _0x554833),
    requestVideoDownload: (_0x12db71, _0x9cc5c8) =>
      _0x24ebb6(runWorkspaceVideoDownloadAction, _0x3a0b8b, _0x12db71, _0x9cc5c8),
  };
}
