import { buildImageNodeStorageFields } from '../../services/imageDerivativeService.js';
import { pickResultLocalPath, urlToLocalPath } from '../../utils/localMediaPath.js';
import { t } from '../../i18n/index.js';
export function registerResourceUploadEntry({
  store: store,
  uploadFile: uploadFile,
  getBaseName: getBaseName,
  getCurrentProjectId: getCurrentProjectId,
}) {
  const async2 = async (value) => {
    const enabled = value?.detail?.id,
      error = value?.detail?.file;
    if (!enabled || !error) return;
    const enabled2 = store.getState().nodes[enabled];
    if (!enabled2) return;
    try {
      const item = getCurrentProjectId?.() || 'default_v2_project',
        assetId = await uploadFile(error, item),
        key = getBaseName(error.name);
      if (key) store.renameNode(enabled, key);
      const index = document.getElementById(enabled),
        el = index?.__v2_name_el;
      if (el && key) el.textContent = key;
      const src = assetId.url,
        localPath = pickResultLocalPath(assetId) || urlToLocalPath(src);
      store.updateNodeData(enabled, {
        src: src,
        localPath: localPath,
        assetId: assetId.assetId || '',
        originalLocalPath: assetId.originalLocalPath || assetId.localPath || '',
        posterLocalPath: assetId.posterLocalPath || '',
        waveformLocalPath: assetId.waveformLocalPath || '',
        derivativeStatus: assetId.derivativeStatus || assetId.status || '',
        mediaTaskId: assetId.mediaTaskId || '',
        mediaTaskKind: assetId.mediaTaskKind || '',
        mediaTaskStatus: assetId.mediaTaskStatus || '',
        mediaTaskProgress: Number(assetId.mediaTaskProgress || 0) || 0,
        mediaTaskError: assetId.mediaTaskError || '',
        ...buildImageNodeStorageFields(assetId),
        fileName: assetId.filename || error.name,
      });
    } catch (result) {
      (console.error('上传失败:', result), window.showToast(t('previewUpload.uploadFailed')));
    }
  };
  return (
    window.addEventListener('v2:resource-upload', async2),
    () => window.removeEventListener('v2:resource-upload', async2)
  );
}
