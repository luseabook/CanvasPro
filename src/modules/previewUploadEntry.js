import appStore from '../core/stores/appStore.js';
import { t } from '../i18n/index.js';
import { uploadFile } from './project.js';
import { isPreviewModeEnabled } from './previewMode.js';
import {
  applyUploadedPreviewAudioResult,
  applyUploadedPreviewImageResult,
  applyUploadedPreviewVideoResult,
} from './previewUploadResult.js';
const PREVIEW_UPLOAD_TYPES = {
  image: {
    accept: 'image/*',
    mimePrefix: 'image/',
    labelKey: 'previewUpload.types.image',
    successMessageKey: 'previewUpload.success.image',
    applyResult: applyUploadedPreviewImageResult,
    nodeTypes: new Set(['source-image', 'image', 'ai-image']),
  },
  video: {
    accept: 'video/*',
    mimePrefix: 'video/',
    labelKey: 'previewUpload.types.video',
    successMessageKey: 'previewUpload.success.video',
    applyResult: applyUploadedPreviewVideoResult,
    nodeTypes: new Set(['source-video', 'video', 'ai-video']),
  },
  audio: {
    accept: 'audio/*',
    mimePrefix: 'audio/',
    labelKey: 'previewUpload.types.audio',
    successMessageKey: 'previewUpload.success.audio',
    applyResult: applyUploadedPreviewAudioResult,
    nodeTypes: new Set(['ai-audio']),
  },
};
function previewUploadText(_0x9878e6, _0xd3920c = {}) {
  return t('previewUpload.' + _0x9878e6, _0xd3920c);
}
function getPreviewUploadTypeLabel(_0x469858) {
  return t(_0x469858.labelKey);
}
function getPreviewUploadSuccessMessage(_0x323497) {
  return t(_0x323497.successMessageKey);
}
function getState(_0x514a3d) {
  return _0x514a3d?.getState?.() || {};
}
function getToast(_0x330a84) {
  return typeof _0x330a84 === 'function' ? _0x330a84 : globalThis.window?.showToast;
}
function setButtonBusy(_0x2e013f, _0x3d845a) {
  if (!_0x2e013f) return;
  if (_0x3d845a) {
    !_0x2e013f.dataset.previewUploadLabel &&
      (_0x2e013f.dataset.previewUploadLabel = _0x2e013f.textContent || previewUploadText('upload'));
    ((_0x2e013f.disabled = true), (_0x2e013f.textContent = previewUploadText('uploading')));
    return;
  }
  ((_0x2e013f.disabled = false),
    (_0x2e013f.textContent = _0x2e013f.dataset.previewUploadLabel || previewUploadText('upload')));
}
export function resolvePreviewUploadTarget(_0xd67159 = {}) {
  const _0x3c2747 = Array.isArray(_0xd67159.selectedNodeIds) ? _0xd67159.selectedNodeIds.filter(Boolean) : [];
  if (_0x3c2747.length !== 1) return { ok: false, message: previewUploadText('selectSingleNode') };
  const _0x42dc44 = _0x3c2747[0],
    _0x36ccd3 = _0xd67159.nodes?.[_0x42dc44];
  if (!_0x36ccd3) return { ok: false, message: previewUploadText('selectedNodeMissing') };
  const _0x208c11 = String(_0x36ccd3.type || '').trim();
  for (const [_0x3849b5, _0x1816e1] of Object.entries(PREVIEW_UPLOAD_TYPES)) {
    if (!_0x1816e1.nodeTypes.has(_0x208c11)) continue;
    return {
      ok: true,
      kind: _0x3849b5,
      nodeId: _0x42dc44,
      node: _0x36ccd3,
      accept: _0x1816e1.accept,
      mimePrefix: _0x1816e1.mimePrefix,
      label: getPreviewUploadTypeLabel(_0x1816e1),
      successMessage: getPreviewUploadSuccessMessage(_0x1816e1),
      applyResult: _0x1816e1.applyResult,
    };
  }
  return { ok: false, message: previewUploadText('unsupportedNode') };
}
export async function handlePreviewUploadFile({
  file: _0x1d4bf1,
  button: button = null,
  storeApi: storeApi = appStore,
  uploadFileImpl: uploadFileImpl = uploadFile,
  showToast: showToast = null,
  getProjectId: getProjectId = () => globalThis.window?.currentProjectId || 'default_v2_project',
  applyResults: applyResults = {},
} = {}) {
  const _0x42b715 = getToast(showToast),
    _0x5d3910 = resolvePreviewUploadTarget(getState(storeApi));
  if (!_0x5d3910.ok) return (_0x42b715?.(_0x5d3910.message, 'warn'), false);
  if (!_0x1d4bf1) return false;
  if (!String(_0x1d4bf1.type || '').startsWith(_0x5d3910.mimePrefix))
    return (_0x42b715?.(previewUploadText('invalidFileType', { label: _0x5d3910.label }), 'error'), false);
  setButtonBusy(button, true);
  try {
    const _0x2d0a09 = await uploadFileImpl(_0x1d4bf1, getProjectId()),
      _0x56e87d = applyResults[_0x5d3910.kind] || _0x5d3910.applyResult;
    return (
      _0x56e87d({ nodeId: _0x5d3910.nodeId, uploadRes: _0x2d0a09, fileName: _0x1d4bf1.name }),
      _0x42b715?.(_0x5d3910.successMessage, 'success'),
      true
    );
  } catch (_0x5ba80f) {
    return (_0x42b715?.(_0x5ba80f?.message || previewUploadText('uploadFailed'), 'error'), false);
  } finally {
    setButtonBusy(button, false);
  }
}
export function bindPreviewUploadEntry({
  button: _0x5dba32,
  input: _0x4c3ae4,
  storeApi: storeApi = appStore,
  uploadFileImpl: uploadFileImpl = uploadFile,
  showToast: showToast = null,
  getProjectId: _0x14aef5,
  applyResults: _0xdb71b,
} = {}) {
  if (!_0x5dba32 || !_0x4c3ae4) return null;
  const _0x193157 = getToast(showToast),
    _0x443307 = () => {
      if (!isPreviewModeEnabled()) return;
      const _0x3a0705 = resolvePreviewUploadTarget(getState(storeApi));
      if (!_0x3a0705.ok) {
        _0x193157?.(_0x3a0705.message, 'warn');
        return;
      }
      ((_0x4c3ae4.accept = _0x3a0705.accept), (_0x4c3ae4.value = ''), _0x4c3ae4.click?.());
    },
    _0x506ddb = async () => {
      const _0x535bc8 = _0x4c3ae4.files?.[0];
      if (!_0x535bc8) return;
      try {
        await handlePreviewUploadFile({
          file: _0x535bc8,
          button: _0x5dba32,
          storeApi: storeApi,
          uploadFileImpl: uploadFileImpl,
          showToast: showToast,
          getProjectId: _0x14aef5,
          applyResults: _0xdb71b,
        });
      } finally {
        _0x4c3ae4.value = '';
      }
    };
  return (
    _0x5dba32.addEventListener('click', _0x443307),
    _0x4c3ae4.addEventListener('change', _0x506ddb),
    () => {
      (_0x5dba32.removeEventListener?.('click', _0x443307),
        _0x4c3ae4.removeEventListener?.('change', _0x506ddb));
    }
  );
}
