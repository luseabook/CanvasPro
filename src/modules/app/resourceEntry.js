import { buildImageNodeStorageFields } from '../../services/imageDerivativeService.js';
import { pickResultLocalPath, urlToLocalPath } from '../../utils/localMediaPath.js';
import { t } from '../../i18n/index.js';
export function registerResourceUploadEntry({
  store: _0x5778e4,
  uploadFile: _0x3940f0,
  getBaseName: _0x265564,
  getCurrentProjectId: _0x91ad41,
}) {
  const _0x30b1c4 = async (_0x100910) => {
    const _0x3d6676 = _0x100910?.detail?.id,
      _0x4bcace = _0x100910?.detail?.file;
    if (!_0x3d6676 || !_0x4bcace) return;
    const _0x5bc365 = _0x5778e4.getState().nodes[_0x3d6676];
    if (!_0x5bc365) return;
    try {
      const _0x4fff0a = _0x91ad41?.() || 'default_v2_project',
        _0x18ecfb = await _0x3940f0(_0x4bcace, _0x4fff0a),
        _0x7bcef9 = _0x265564(_0x4bcace.name);
      if (_0x7bcef9) _0x5778e4.renameNode(_0x3d6676, _0x7bcef9);
      const _0x3c569f = document.getElementById(_0x3d6676),
        _0x234bdb = _0x3c569f?.__v2_name_el;
      if (_0x234bdb && _0x7bcef9) _0x234bdb.textContent = _0x7bcef9;
      const _0x191c68 = _0x18ecfb.url,
        _0x5f524e = pickResultLocalPath(_0x18ecfb) || urlToLocalPath(_0x191c68);
      _0x5778e4.updateNodeData(_0x3d6676, {
        src: _0x191c68,
        localPath: _0x5f524e,
        assetId: _0x18ecfb.assetId || '',
        originalLocalPath: _0x18ecfb.originalLocalPath || _0x18ecfb.localPath || '',
        posterLocalPath: _0x18ecfb.posterLocalPath || '',
        waveformLocalPath: _0x18ecfb.waveformLocalPath || '',
        derivativeStatus: _0x18ecfb.derivativeStatus || _0x18ecfb.status || '',
        mediaTaskId: _0x18ecfb.mediaTaskId || '',
        mediaTaskKind: _0x18ecfb.mediaTaskKind || '',
        mediaTaskStatus: _0x18ecfb.mediaTaskStatus || '',
        mediaTaskProgress: Number(_0x18ecfb.mediaTaskProgress || 0) || 0,
        mediaTaskError: _0x18ecfb.mediaTaskError || '',
        ...buildImageNodeStorageFields(_0x18ecfb),
        fileName: _0x18ecfb.filename || _0x4bcace.name,
      });
    } catch (_0x240156) {
      (console.error('上传失败:', _0x240156), window.showToast(t('previewUpload.uploadFailed')));
    }
  };
  return (
    window.addEventListener('v2:resource-upload', _0x30b1c4),
    () => window.removeEventListener('v2:resource-upload', _0x30b1c4)
  );
}
