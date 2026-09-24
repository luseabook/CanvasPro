import { deleteOutputFilesFromServer, fetchRemoteBlob, saveOutputToServer } from '../../api/projectsV2Api.js';
import { desktopBridge } from './desktopBridge.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
const DEFAULT_MEDIA_EXTENSIONS = Object['freeze']({ image: 'png', video: 'mp4', audio: 'mp3' }),
  MIME_EXTENSIONS = Object['freeze']({
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
  });
function trimText(_0x26b611) {
  return String(_0x26b611 || '')['trim']();
}
function normalizeKind(_0x3c22ca) {
  const _0x469e83 = trimText(_0x3c22ca)['toLowerCase']();
  if (!Object['prototype']['hasOwnProperty']['call'](DEFAULT_MEDIA_EXTENSIONS, _0x469e83))
    throw new Error('不支持的媒体文件类型');
  return _0x469e83;
}
function normalizeExternalUrl(_0xa7ac0e) {
  const _0x3d0a3a = trimText(_0xa7ac0e);
  if (!_0x3d0a3a) return '';
  if (_0x3d0a3a['startsWith']('//')) {
    const _0x4dd612 = /^https?:$/i['test'](String(globalThis['location']?.['protocol'] || ''))
      ? globalThis['location']['protocol']
      : 'https:';
    return '' + _0x4dd612 + _0x3d0a3a;
  }
  return _0x3d0a3a;
}
function extensionFromFile({ filename: _0x378c88, blob: _0x20a613, kind: _0x116b87 }) {
  const _0x385ad8 = trimText(_0x378c88)['match'](/\.([a-z0-9]{1,10})$/i);
  if (_0x385ad8?.[0x1]) return _0x385ad8[0x1]['toLowerCase']();
  const _0x4a8168 = trimText(_0x20a613?.['type'])['split'](';', 0x1)[0x0]['toLowerCase']();
  return MIME_EXTENSIONS[_0x4a8168] || DEFAULT_MEDIA_EXTENSIONS[_0x116b87] || 'bin';
}
function getDependency(_0xdf5834, _0x30067d, _0x1b8634) {
  return Object['prototype']['hasOwnProperty']['call'](_0xdf5834 || {}, _0x30067d)
    ? _0xdf5834[_0x30067d]
    : _0x1b8634;
}
function canUseCapability(_0x493a69, _0x1b7292, _0x193bf5) {
  const _0x74478b = _0x493a69?.['nodeExport'];
  if (!_0x74478b) return ![];
  if (typeof _0x74478b[_0x1b7292] === 'function') return _0x74478b[_0x1b7292]() === !![];
  return typeof _0x74478b[_0x193bf5] === 'function';
}
function triggerHrefDownload({
  url: _0x2cf88b,
  filename: _0x1f47dd,
  documentRef: documentRef = globalThis['document'],
}) {
  if (!_0x2cf88b || !documentRef?.['createElement']) throw new Error('当前环境无法下载文件');
  const _0x2fbd56 = documentRef['createElement']('a');
  ((_0x2fbd56['href'] = _0x2cf88b),
    (_0x2fbd56['download'] = _0x1f47dd || 'download'),
    (_0x2fbd56['rel'] = 'noopener'),
    (_0x2fbd56['hidden'] = !![]),
    documentRef['body']?.['appendChild']?.(_0x2fbd56),
    _0x2fbd56['click'](),
    _0x2fbd56['remove']?.());
  if (_0x2fbd56['parentNode']) _0x2fbd56['parentNode']['removeChild']?.(_0x2fbd56);
}
function triggerBlobDownload({
  blob: _0x19b4ed,
  filename: _0x305430,
  documentRef: documentRef = globalThis['document'],
  urlApi: urlApi = globalThis['URL'],
  schedule: schedule = globalThis['setTimeout'],
}) {
  if (!_0x19b4ed || typeof urlApi?.['createObjectURL'] !== 'function')
    throw new Error('当前环境无法下载文件');
  const _0x4cacca = urlApi['createObjectURL'](_0x19b4ed);
  try {
    triggerHrefDownload({ url: _0x4cacca, filename: _0x305430, documentRef: documentRef });
  } finally {
    typeof schedule === 'function'
      ? schedule(() => urlApi['revokeObjectURL']?.(_0x4cacca), 0x0)
      : urlApi['revokeObjectURL']?.(_0x4cacca);
  }
}
async function persistBlobAsLocalMedia({ blob: _0x222a99, filename: _0x3b7b66, kind: _0x152943 }, _0x6d4063) {
  const _0x32480b = getDependency(_0x6d4063, 'saveOutputToServer', saveOutputToServer);
  if (typeof _0x32480b !== 'function') throw new Error('当前环境无法暂存媒体文件');
  const _0x1617da = await _0x32480b(_0x222a99, {
      ext: extensionFromFile({ filename: _0x3b7b66, blob: _0x222a99, kind: _0x152943 }),
      subDir: 'desktop-save-staging',
    }),
    _0x17bdcf = pickResultLocalPath(_0x1617da);
  if (!_0x17bdcf) throw new Error('暂存媒体文件后未返回本地路径');
  return { localPath: _0x17bdcf, url: localPathToUrl(_0x17bdcf), staged: !![] };
}
async function cleanupStagedMedia(_0x126a6f, _0x25b05f) {
  const _0x1129ca = (Array['isArray'](_0x126a6f) ? _0x126a6f : [_0x126a6f])
    ['filter']((_0x2af3d4) => _0x2af3d4?.['staged'] === !![] && _0x2af3d4?.['localPath'])
    ['map']((_0x2af256) => _0x2af256['localPath']);
  if (_0x1129ca['length'] === 0x0) return;
  const _0x485fb6 = getDependency(_0x25b05f, 'deleteOutputFilesFromServer', deleteOutputFilesFromServer);
  if (typeof _0x485fb6 !== 'function') return;
  try {
    await _0x485fb6({ localPaths: _0x1129ca });
  } catch (_0x2d8ff3) {
    console['warn']('[downloadSaveService] cleanup staging files failed', _0x2d8ff3);
  }
}
async function resolveDesktopMediaSource(_0x261e64, _0x3f8ccc) {
  const _0x494e88 = normalizeKind(_0x261e64?.['kind']),
    _0x291b53 = normalizeExternalUrl(_0x261e64?.['url']),
    _0x37a18f = normalizeLocalPath(_0x261e64?.['localPath'] || _0x291b53);
  if (_0x37a18f)
    return { kind: _0x494e88, localPath: _0x37a18f, url: localPathToUrl(_0x37a18f), staged: ![] };
  let _0x516c3c = _0x261e64?.['blob'] || null;
  if (!_0x516c3c && /^(?:blob:|data:)/i['test'](_0x291b53)) {
    const _0x43d42c = getDependency(_0x3f8ccc, 'fetchRemoteBlob', fetchRemoteBlob);
    if (typeof _0x43d42c !== 'function') throw new Error('当前环境无法读取临时媒体文件');
    _0x516c3c = await _0x43d42c(_0x291b53);
  }
  if (_0x516c3c)
    return {
      kind: _0x494e88,
      ...(await persistBlobAsLocalMedia(
        { blob: _0x516c3c, filename: _0x261e64?.['filename'], kind: _0x494e88 },
        _0x3f8ccc,
      )),
    };
  if (/^https?:/i['test'](_0x291b53)) return { kind: _0x494e88, localPath: '', url: _0x291b53, staged: ![] };
  throw new Error('没有可保存的媒体文件');
}
function browserMediaUrl(_0x25ecd8) {
  const _0x469059 = normalizeLocalPath(_0x25ecd8?.['localPath'] || _0x25ecd8?.['url']);
  return localPathToUrl(_0x469059) || normalizeExternalUrl(_0x25ecd8?.['url']);
}
export async function saveTextDownload(_0x5bb04e = {}, _0x13bead = {}) {
  const _0x36d1d9 = getDependency(_0x13bead, 'desktopBridge', desktopBridge);
  if (canUseCapability(_0x36d1d9, 'canSaveText', 'saveText'))
    return await _0x36d1d9['nodeExport']['saveText']({
      filename: trimText(_0x5bb04e?.['filename']) || 'export.txt',
      content: String(_0x5bb04e?.['content'] ?? ''),
      mimeType: trimText(_0x5bb04e?.['mimeType']),
      title: trimText(_0x5bb04e?.['title']),
      filterName: trimText(_0x5bb04e?.['filterName']),
    });
  const _0x50c47d = getDependency(_0x13bead, 'Blob', globalThis['Blob']);
  if (typeof _0x50c47d !== 'function') throw new Error('当前环境无法创建下载文件');
  const _0x4aa8c8 = new _0x50c47d([String(_0x5bb04e?.['content'] ?? '')], {
    type: trimText(_0x5bb04e?.['mimeType']) || 'text/plain;charset=utf-8',
  });
  return (
    triggerBlobDownload({
      blob: _0x4aa8c8,
      filename: trimText(_0x5bb04e?.['filename']) || 'export.txt',
      documentRef: getDependency(_0x13bead, 'documentRef', globalThis['document']),
      urlApi: getDependency(_0x13bead, 'urlApi', globalThis['URL']),
      schedule: getDependency(_0x13bead, 'schedule', globalThis['setTimeout']),
    }),
    { success: !![], canceled: ![], mode: 'browser' }
  );
}
export async function saveMediaDownload(_0x51bbf8 = {}, _0x59310b = {}) {
  const _0x461c32 = getDependency(_0x59310b, 'desktopBridge', desktopBridge);
  if (canUseCapability(_0x461c32, 'canSaveMedia', 'saveMedia')) {
    const _0x1a339c = await resolveDesktopMediaSource(_0x51bbf8, _0x59310b),
      _0x139960 = await _0x461c32['nodeExport']['saveMedia']({
        kind: _0x1a339c['kind'],
        localPath: _0x1a339c['localPath'],
        url: _0x1a339c['url'],
        filename: trimText(_0x51bbf8?.['filename']),
        title: trimText(_0x51bbf8?.['title']),
      });
    return (await cleanupStagedMedia(_0x1a339c, _0x59310b), _0x139960);
  }
  return (
    _0x51bbf8?.['blob']
      ? triggerBlobDownload({
          blob: _0x51bbf8['blob'],
          filename: trimText(_0x51bbf8?.['filename']),
          documentRef: getDependency(_0x59310b, 'documentRef', globalThis['document']),
          urlApi: getDependency(_0x59310b, 'urlApi', globalThis['URL']),
          schedule: getDependency(_0x59310b, 'schedule', globalThis['setTimeout']),
        })
      : triggerHrefDownload({
          url: browserMediaUrl(_0x51bbf8),
          filename: trimText(_0x51bbf8?.['filename']),
          documentRef: getDependency(_0x59310b, 'documentRef', globalThis['document']),
        }),
    { success: !![], canceled: ![], mode: 'browser' }
  );
}
export async function saveMediaFilesDownload(_0x21b05d = {}, _0x16a3e8 = {}) {
  const _0x26f1d3 = Array['isArray'](_0x21b05d?.['files']) ? _0x21b05d['files'] : [];
  if (_0x26f1d3['length'] === 0x0) throw new Error('没有可保存的媒体文件');
  const _0x38ddbc = getDependency(_0x16a3e8, 'desktopBridge', desktopBridge);
  if (canUseCapability(_0x38ddbc, 'canSaveMediaFiles', 'saveMediaFiles')) {
    const _0x3fb10d = [],
      _0x379f2e = [];
    for (const _0x2bb70c of _0x26f1d3) {
      const _0x138b25 = await resolveDesktopMediaSource(_0x2bb70c, _0x16a3e8);
      (_0x379f2e['push'](_0x138b25),
        _0x3fb10d['push']({
          kind: _0x138b25['kind'],
          localPath: _0x138b25['localPath'],
          url: _0x138b25['url'],
          filename: trimText(_0x2bb70c?.['filename']),
        }));
    }
    const _0x42cd5f = await _0x38ddbc['nodeExport']['saveMediaFiles']({
      title: trimText(_0x21b05d?.['title']),
      files: _0x3fb10d,
    });
    return (await cleanupStagedMedia(_0x379f2e, _0x16a3e8), _0x42cd5f);
  }
  for (const _0x22f1c7 of _0x26f1d3) {
    await saveMediaDownload(_0x22f1c7, { ..._0x16a3e8, desktopBridge: null });
  }
  return { success: !![], canceled: ![], count: _0x26f1d3['length'], mode: 'browser' };
}
export const __downloadSaveServiceForTest = Object['freeze']({
  cleanupStagedMedia: cleanupStagedMedia,
  resolveDesktopMediaSource: resolveDesktopMediaSource,
  triggerHrefDownload: triggerHrefDownload,
  triggerBlobDownload: triggerBlobDownload,
});
