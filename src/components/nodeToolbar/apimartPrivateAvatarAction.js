import { submitApimartSeedance2PrivateAvatar } from '../../../api/apimartPrivateAvatarApi.js';
import {
  APIMART_PRIVATE_AVATAR_ASSET_KEY,
  buildApimartPrivateAvatarPatch,
  readApimartPrivateAvatarAsset,
} from '../../modules/apimartPrivateAvatarAssets.js';
import { DEFAULT_APIMART_API_URL } from '../../modules/providers.js';
import { t } from '../../i18n/index.js';
const ACTION_CLASS = '.act-apimart-face-detect';
function faceDetectText(_0x587832, _0xa70167 = {}) {
  return t('nodeToolbar.faceDetect.' + _0x587832, _0xa70167);
}
function getNodeId(_0x50735d = {}) {
  return String(_0x50735d.nodeId || _0x50735d.nodeData?.id || '').trim();
}
function getLatestNodeData(_0x468fb2 = {}) {
  const _0x3e1f7d = getNodeId(_0x468fb2),
    _0x4770a9 = typeof _0x468fb2.getStateSnapshot === 'function' ? _0x468fb2.getStateSnapshot() : {};
  return _0x4770a9?.nodes?.[_0x3e1f7d] || _0x468fb2.getNodeData?.() || _0x468fb2.nodeData || {};
}
function basenameFromUrl(_0x10f1c4) {
  const _0x1a4941 = String(_0x10f1c4 || '').split(/[?#]/, 1)[0],
    _0x43dc26 = _0x1a4941.split(/[\\/]/).filter(Boolean);
  return _0x43dc26[_0x43dc26.length - 1] || '';
}
function resolveLocalPathUrl(_0x1c4125, _0x374b4) {
  const _0x26367b = String(_0x374b4 || '').trim();
  if (!_0x26367b) return '';
  if (/^(https?:|blob:|data:|asset:\/\/)/i.test(_0x26367b)) return _0x26367b;
  if (_0x26367b.startsWith('/')) return _0x26367b;
  return _0x1c4125.localPathToUrl?.(_0x26367b) || _0x26367b;
}
function resolveImageSourceUrl(_0x14f363, _0x3b3f17 = {}) {
  const _0x33ea19 = [
    _0x14f363.resolveCanvasImagePreviewUrl?.(_0x3b3f17),
    _0x3b3f17.originalLocalPath,
    _0x3b3f17.displayLocalPath,
    _0x3b3f17.localPath,
    _0x3b3f17.imageUrl,
    _0x3b3f17.sourceUrl,
    _0x3b3f17.src,
    _0x3b3f17.url,
  ];
  for (const _0x84b2b6 of _0x33ea19) {
    const _0x58ec51 = resolveLocalPathUrl(_0x14f363, _0x84b2b6);
    if (_0x58ec51) return _0x58ec51;
  }
  return '';
}
function resolveVideoSourceUrl(_0x5908c6, _0x59910a = {}) {
  const _0x4ab025 = _0x5908c6._getCurrentVideoUrl?.();
  if (_0x4ab025) return _0x4ab025;
  const _0x448c06 = Array.isArray(_0x59910a.videos) ? _0x59910a.videos : [],
    _0xe7371b = Number.isFinite(Number(_0x59910a.mainVideoIndex))
      ? Math.max(0, Math.trunc(Number(_0x59910a.mainVideoIndex)))
      : 0,
    _0x59656d = _0x448c06[_0xe7371b] || _0x448c06[0] || {},
    _0x35692b = [
      _0x59656d.originalLocalPath,
      _0x59656d.displayLocalPath,
      _0x59656d.localPath,
      _0x59656d.videoUrl,
      _0x59910a.originalLocalPath,
      _0x59910a.displayLocalPath,
      _0x59910a.localPath,
      _0x59910a.videoLocalPath,
      _0x59910a.videoUrl,
      _0x59910a.sourceUrl,
      _0x59910a.src,
      _0x59910a.url,
    ];
  for (const _0x5220d1 of _0x35692b) {
    const _0x28ead8 = resolveLocalPathUrl(_0x5908c6, _0x5220d1);
    if (_0x28ead8) return _0x28ead8;
  }
  return '';
}
function resolveSource(_0x3feca5, _0x547541 = {}) {
  const _0x148d2a = String(_0x3feca5.mediaKind || '').toLowerCase();
  if (_0x148d2a === 'video') {
    const _0x5dc283 = resolveVideoSourceUrl(_0x3feca5, _0x547541);
    return { url: _0x5dc283, assetType: 'Video', sourceKind: 'video' };
  }
  const _0x55b703 = resolveImageSourceUrl(_0x3feca5, _0x547541);
  return { url: _0x55b703, assetType: 'Image', sourceKind: 'image' };
}
function applyButtonState(_0x292467, _0x26bb71) {
  const _0x32f50b = String(_0x26bb71?.status || '')
      .trim()
      .toLowerCase(),
    _0x504db2 = _0x32f50b === 'processing',
    _0x327361 = _0x292467.querySelector?.('svg');
  (_0x292467.classList.toggle('is-provider-asset-pass', _0x32f50b === 'passed'),
    _0x292467.classList.toggle('is-provider-asset-fail', _0x32f50b === 'failed'),
    _0x292467.classList.toggle('is-provider-asset-running', _0x504db2),
    _0x327361?.classList?.toggle?.('v2-spinning', _0x504db2),
    (_0x292467.dataset.loading = _0x504db2 ? 'true' : 'false'),
    (_0x292467.disabled = _0x504db2),
    _0x292467.setAttribute('aria-busy', _0x504db2 ? 'true' : 'false'));
  if (_0x32f50b === 'passed') _0x292467.dataset.tooltip = faceDetectText('passedTooltip');
  else {
    if (_0x32f50b === 'failed')
      _0x292467.dataset.tooltip = _0x26bb71?.error
        ? faceDetectText('failedTooltipWithError', { error: _0x26bb71.error })
        : faceDetectText('failedTooltip');
    else
      _0x32f50b === 'processing'
        ? (_0x292467.dataset.tooltip = faceDetectText('processingTooltip'))
        : (_0x292467.dataset.tooltip = faceDetectText('defaultTooltip'));
  }
}
function persistAsset(_0x5b10a0, _0x594578, _0x260d9a) {
  const _0x5dbd7d = getNodeId(_0x5b10a0);
  if (!_0x5dbd7d) return;
  const _0x30f3fc = buildApimartPrivateAvatarPatch(_0x594578, _0x260d9a);
  (_0x5b10a0.store?.updateNodeData?.(_0x5dbd7d, _0x30f3fc),
    _0x594578 &&
      typeof _0x594578 === 'object' &&
      (_0x594578.providerAssetRefs = _0x30f3fc.providerAssetRefs));
}
export function bindApimartPrivateAvatarAction(_0x166440 = {}) {
  const _0x3b2b89 = _0x166440.toolbarEl?.querySelector?.(ACTION_CLASS);
  if (!_0x3b2b89) return;
  const _0x1ffc16 = getNodeId(_0x166440);
  if (!_0x1ffc16) return;
  const _0x120437 = () => {
    applyButtonState(_0x3b2b89, readApimartPrivateAvatarAsset(getLatestNodeData(_0x166440)));
  };
  _0x120437();
  const _0x110129 =
    typeof _0x166440.store?.subscribeSelector === 'function'
      ? _0x166440.store.subscribeSelector(
          (_0x2f205e) => _0x2f205e.nodes?.[_0x1ffc16]?.providerAssetRefs?.[APIMART_PRIVATE_AVATAR_ASSET_KEY],
          () => _0x120437(),
        )
      : null;
  (_0x3b2b89._cleanupApimartPrivateAvatarState?.(),
    (_0x3b2b89._cleanupApimartPrivateAvatarState = () => _0x110129?.()),
    _0x3b2b89.addEventListener('click', async (_0x4c8395) => {
      (_0x4c8395.preventDefault(), _0x4c8395.stopPropagation());
      if (_0x3b2b89.dataset.loading === 'true') return;
      const _0x32e090 = getLatestNodeData(_0x166440),
        { url: _0x5a106f, assetType: _0x5c4798, sourceKind: _0x3c48fd } = resolveSource(_0x166440, _0x32e090);
      if (!_0x5a106f) {
        (persistAsset(_0x166440, _0x32e090, {
          provider: 'apimart',
          capability: 'seedance2PrivateAvatar',
          status: 'failed',
          error: faceDetectText('missingUrlError'),
        }),
          window.showToast?.(faceDetectText('missingUrlToast'), 'error'),
          _0x120437());
        return;
      }
      (persistAsset(_0x166440, _0x32e090, {
        provider: 'apimart',
        capability: 'seedance2PrivateAvatar',
        status: 'processing',
        sourceUrl: _0x5a106f,
        sourceKind: _0x3c48fd,
        assetType: _0x5c4798,
        checkedAt: new Date().toISOString(),
      }),
        _0x120437());
      const _0x5a601d = _0x166440.ensureConfig,
        _0x221101 = _0x166440.getProviderConfig;
      try {
        await _0x5a601d?.();
        const _0x33047c = _0x221101?.('apimart') || {},
          _0x22564f = String(_0x33047c.apiKey || '').trim(),
          _0x103a81 = String(_0x33047c.apiUrl || DEFAULT_APIMART_API_URL).trim();
        if (!_0x22564f) throw new Error(faceDetectText('apiKeyMissing'));
        window.showToast?.(faceDetectText('running'), 'info');
        const _0x449706 = await submitApimartSeedance2PrivateAvatar({
          apiKey: _0x22564f,
          apiUrl: _0x103a81,
          url: _0x5a106f,
          assetType: _0x5c4798,
          name: basenameFromUrl(_0x5a106f) || _0x3c48fd + '-asset',
        });
        (persistAsset(_0x166440, getLatestNodeData(_0x166440), {
          provider: 'apimart',
          capability: 'seedance2PrivateAvatar',
          status: 'passed',
          assetUrl: _0x449706.assetUrl,
          sourceUrl: _0x5a106f,
          uploadedSourceUrl: _0x449706.sourceUrl || '',
          sourceKind: _0x3c48fd,
          assetType: _0x449706.assetType || _0x5c4798,
          taskId: _0x449706.taskId || '',
          checkedAt: new Date().toISOString(),
        }),
          window.showToast?.(faceDetectText('passedToast'), 'success'));
      } catch (_0x6bb357) {
        const _0x5e5d85 = _0x6bb357?.message || faceDetectText('failedFallback');
        (persistAsset(_0x166440, getLatestNodeData(_0x166440), {
          provider: 'apimart',
          capability: 'seedance2PrivateAvatar',
          status: 'failed',
          sourceUrl: _0x5a106f,
          sourceKind: _0x3c48fd,
          assetType: _0x5c4798,
          checkedAt: new Date().toISOString(),
          error: _0x5e5d85,
        }),
          window.showToast?.(faceDetectText('failedToastWithError', { error: _0x5e5d85 }), 'error'));
      } finally {
        _0x120437();
      }
    }));
}
