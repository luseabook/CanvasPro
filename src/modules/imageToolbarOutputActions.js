import { saveOutputFromUrlToServer } from '../../api/projectsV2Api.js';
import { buildCanvasLocalImageFields } from '../services/canvasMediaLocalService.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
import { saveRemoteImageLocally } from './project.js';
function isRemoteLikeUrl(_0x282456) {
  const _0x1ff948 = String(_0x282456 || '').trim();
  return /^https?:\/\//i.test(_0x1ff948) || _0x1ff948.startsWith('blob:') || _0x1ff948.startsWith('data:');
}
export function buildToolbarImageFields({
  localPath: localPath = '',
  resultUrl: resultUrl = '',
  thumbUrl: thumbUrl = '',
  includeSrc: includeSrc = false,
}) {
  const _0x50f7eb = { localPath: localPath, imageUrl: resultUrl, sourceUrl: resultUrl, thumbUrl: thumbUrl };
  if (includeSrc) _0x50f7eb.src = thumbUrl || resultUrl;
  return buildCanvasLocalImageFields(_0x50f7eb, { includeSrc: includeSrc });
}
export async function saveRemoteImageResultLocally(_0x886c86, _0x5e814c = {}) {
  const _0x5727e2 = _0x5e814c.projectId || 'default_v2_project',
    _0x436b83 = await saveRemoteImageLocally(_0x886c86, _0x5727e2, _0x5e814c),
    _0x14bc17 = isRemoteLikeUrl(_0x436b83) ? '' : normalizeLocalPath(_0x436b83),
    _0x146caa = localPathToUrl(_0x14bc17) || String(_0x436b83 || '').trim() || _0x886c86;
  return {
    localPath: _0x14bc17,
    thumbUrl: _0x146caa,
    fields: buildToolbarImageFields({
      localPath: _0x14bc17,
      resultUrl: _0x886c86,
      thumbUrl: _0x146caa,
      includeSrc: _0x5e814c.includeSrc,
    }),
  };
}
export async function saveOutputImageResult(_0x14b818, _0x491321 = {}) {
  const _0xbc45d7 = _0x491321.resumedImage || null;
  if (_0xbc45d7) {
    const _0x85b5a2 = buildCanvasLocalImageFields(_0xbc45d7, { includeSrc: _0x491321.includeSrc ?? true }),
      _0x255b75 = String(_0x85b5a2.localPath || '').trim(),
      _0xc617a1 = String(_0x85b5a2.thumbUrl || _0x85b5a2.imageUrl || _0x85b5a2.src || '').trim();
    return { localPath: _0x255b75, thumbUrl: _0xc617a1, fields: _0x85b5a2 };
  }
  let _0x186703 = '',
    _0x1a74f1 = _0x14b818;
  const _0x265399 = await saveOutputFromUrlToServer({
      url: _0x14b818,
      ext: _0x491321.ext || 'png',
      dedupeKey: _0x491321.dedupeKey || (_0x491321.taskKey ? _0x491321.taskKey + ':' + _0x14b818 : undefined),
    }),
    _0x4d8fad = pickResultLocalPath(_0x265399);
  return (
    _0x4d8fad && ((_0x186703 = _0x4d8fad), (_0x1a74f1 = localPathToUrl(_0x186703))),
    {
      localPath: _0x186703,
      thumbUrl: _0x1a74f1,
      fields: buildToolbarImageFields({
        localPath: _0x186703,
        resultUrl: _0x14b818,
        thumbUrl: _0x1a74f1,
        includeSrc: _0x491321.includeSrc ?? true,
      }),
    }
  );
}
