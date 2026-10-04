import { saveOutputFromUrlToServer } from '../../api/projectsV2Api.js';
import { buildCanvasLocalImageFields } from '../services/canvasMediaLocalService.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
import { saveRemoteImageLocally } from './project.js';
function isRemoteLikeUrl(value) {
  const item = String(value || '').trim();
  return /^https?:\/\//i.test(item) || item.startsWith('blob:') || item.startsWith('data:');
}
export function buildToolbarImageFields({
  localPath: localPath = '',
  resultUrl: resultUrl = '',
  thumbUrl: thumbUrl = '',
  includeSrc: includeSrc = false,
}) {
  const key = { localPath: localPath, imageUrl: resultUrl, sourceUrl: resultUrl, thumbUrl: thumbUrl };
  if (includeSrc) key.src = thumbUrl || resultUrl;
  return buildCanvasLocalImageFields(key, { includeSrc: includeSrc });
}
export async function saveRemoteImageResultLocally(resultUrl2, includeSrc2 = {}) {
  const index = includeSrc2.projectId || 'default_v2_project',
    saveRemoteImageLocally2 = await saveRemoteImageLocally(resultUrl2, index, includeSrc2),
    localPath2 = isRemoteLikeUrl(saveRemoteImageLocally2) ? '' : normalizeLocalPath(saveRemoteImageLocally2),
    thumbUrl2 = localPathToUrl(localPath2) || String(saveRemoteImageLocally2 || '').trim() || resultUrl2;
  return {
    localPath: localPath2,
    thumbUrl: thumbUrl2,
    fields: buildToolbarImageFields({
      localPath: localPath2,
      resultUrl: resultUrl2,
      thumbUrl: thumbUrl2,
      includeSrc: includeSrc2.includeSrc,
    }),
  };
}
export async function saveOutputImageResult(url, includeSrc3 = {}) {
  const result = includeSrc3.resumedImage || null;
  if (result) {
    const fields = buildCanvasLocalImageFields(result, { includeSrc: includeSrc3.includeSrc ?? true }),
      localPath3 = String(fields.localPath || '').trim(),
      thumbUrl3 = String(fields.thumbUrl || fields.imageUrl || fields.src || '').trim();
    return { localPath: localPath3, thumbUrl: thumbUrl3, fields: fields };
  }
  let localPath4 = '',
    thumbUrl4 = url;
  const server = await saveOutputFromUrlToServer({
      url: url,
      ext: includeSrc3.ext || 'png',
      dedupeKey: includeSrc3.dedupeKey || (includeSrc3.taskKey ? includeSrc3.taskKey + ':' + url : undefined),
    }),
    resultLocalPath = pickResultLocalPath(server);
  return (
    resultLocalPath && ((localPath4 = resultLocalPath), (thumbUrl4 = localPathToUrl(localPath4))),
    {
      localPath: localPath4,
      thumbUrl: thumbUrl4,
      fields: buildToolbarImageFields({
        localPath: localPath4,
        resultUrl: url,
        thumbUrl: thumbUrl4,
        includeSrc: includeSrc3.includeSrc ?? true,
      }),
    }
  );
}
