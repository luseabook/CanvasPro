import { runWorkspaceImageDownloadAction } from '../workspaceImageDownload.js';
import { runWorkspaceVideoDownloadAction } from '../workspaceVideoDownload.js';
function normalizeText(value) {
  return String(value ?? '').trim();
}
function getSelectedShot(options = {}) {
  return (
    options.shots?.find((item) => item.id === options.workspace?.selectedShotId) || null
  );
}
function buildShotFilenameBase(key, index, result) {
  const data = Math.max(
    0,
    key.shots.findIndex((target) => target.id === index.id),
  );
  return '镜头片段' + String(data + 1).padStart(2, '0') + '-' + result;
}
function resolveOriginalVideoRef(options2 = {}) {
  const list = Array.isArray(options2?.replacementVideo?.results)
      ? options2.replacementVideo.results
      : [],
    source = Math.max(
      0,
      Math.min(
        list.length - 1,
        Math.trunc(Number(options2?.replacementVideo?.activeIndex) || 0),
      ),
    ),
    response = list[source] || {};
  return normalizeText(
    response.originalLocalPath ||
      response.localPath ||
      response.videoUrl ||
      response.url ||
      options2.resultVideoRef,
  );
}
export function createPersonReplacementResultMediaActions({
  getProject: getProject,
  runIntent: runIntent,
  downloadImageIntent: downloadImageIntent,
  downloadVideoIntent: downloadVideoIntent,
} = {}) {
  const getSelectedReplacementImageDownloadRequest = () => {
      const next = getProject(),
        selectedShot = getSelectedShot(next),
        imageRef = normalizeText(selectedShot?.replacementImageRef);
      return selectedShot && imageRef
        ? {
            imageRef: imageRef,
            filenameBase: buildShotFilenameBase(next, selectedShot, '替换图'),
            title: '下载替换图片',
          }
        : null;
    },
    getSelectedReplacementVideoDownloadRequest = () => {
      const current = getProject(),
        selectedShot2 = getSelectedShot(current),
        videoRef = resolveOriginalVideoRef(selectedShot2);
      return selectedShot2 && videoRef
        ? {
            videoRef: videoRef,
            filenameBase: buildShotFilenameBase(current, selectedShot2, '替换视频'),
            title: '下载替换视频',
          }
        : null;
    },
    handler = (handler2, entry, record, enabled) => {
      if (!enabled) return false;
      return (
        void handler2(record, () =>
          Promise.resolve(runIntent(entry, enabled, {}, { applyCallbackResult: false })),
        ),
        true
      );
    };
  return {
    getSelectedReplacementImageDownloadRequest: getSelectedReplacementImageDownloadRequest,
    getSelectedReplacementVideoDownloadRequest: getSelectedReplacementVideoDownloadRequest,
    requestImageDownload: (payload, handle) =>
      handler(runWorkspaceImageDownloadAction, downloadImageIntent, payload, handle),
    requestVideoDownload: (state, config) =>
      handler(runWorkspaceVideoDownloadAction, downloadVideoIntent, state, config),
  };
}
