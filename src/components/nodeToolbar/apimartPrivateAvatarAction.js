import { submitApimartSeedance2PrivateAvatar } from '../../../api/apimartPrivateAvatarApi.js';
import {
  APIMART_PRIVATE_AVATAR_ASSET_KEY,
  buildApimartPrivateAvatarPatch,
  readApimartPrivateAvatarAsset,
} from '../../modules/apimartPrivateAvatarAssets.js';
import { DEFAULT_APIMART_API_URL } from '../../modules/providers.js';
import { t } from '../../i18n/index.js';
const ACTION_CLASS = '.act-apimart-face-detect';
function faceDetectText(value, item = {}) {
  return t('nodeToolbar.faceDetect.' + value, item);
}
function getNodeId(options = {}) {
  return String(options.nodeId || options.nodeData?.id || '').trim();
}
function getLatestNodeData(options2 = {}) {
  const nodeId = getNodeId(options2),
    key = typeof options2.getStateSnapshot === 'function' ? options2.getStateSnapshot() : {};
  return key?.nodes?.[nodeId] || options2.getNodeData?.() || options2.nodeData || {};
}
function basenameFromUrl(index) {
  const result = String(index || '').split(/[?#]/, 1)[0],
    list = result.split(/[\\/]/).filter(Boolean);
  return list[list.length - 1] || '';
}
function resolveLocalPathUrl(data, target) {
  const enabled = String(target || '').trim();
  if (!enabled) return '';
  if (/^(https?:|blob:|data:|asset:\/\/)/i.test(enabled)) return enabled;
  if (enabled.startsWith('/')) return enabled;
  return data.localPathToUrl?.(enabled) || enabled;
}
function resolveImageSourceUrl(source, response = {}) {
  const next = [
    source.resolveCanvasImagePreviewUrl?.(response),
    response.originalLocalPath,
    response.displayLocalPath,
    response.localPath,
    response.imageUrl,
    response.sourceUrl,
    response.src,
    response.url,
  ];
  for (const current of next) {
    const localPathUrl = resolveLocalPathUrl(source, current);
    if (localPathUrl) return localPathUrl;
  }
  return '';
}
function resolveVideoSourceUrl(entry, response2 = {}) {
  const record = entry._getCurrentVideoUrl?.();
  if (record) return record;
  const payload = Array.isArray(response2.videos) ? response2.videos : [],
    handle = Number.isFinite(Number(response2.mainVideoIndex))
      ? Math.max(0, Math.trunc(Number(response2.mainVideoIndex)))
      : 0,
    state = payload[handle] || payload[0] || {},
    config = [
      state.originalLocalPath,
      state.displayLocalPath,
      state.localPath,
      state.videoUrl,
      response2.originalLocalPath,
      response2.displayLocalPath,
      response2.localPath,
      response2.videoLocalPath,
      response2.videoUrl,
      response2.sourceUrl,
      response2.src,
      response2.url,
    ];
  for (const scope of config) {
    const localPathUrl2 = resolveLocalPathUrl(entry, scope);
    if (localPathUrl2) return localPathUrl2;
  }
  return '';
}
function resolveSource(input, output = {}) {
  const value2 = String(input.mediaKind || '').toLowerCase();
  if (value2 === 'video') {
    const url = resolveVideoSourceUrl(input, output);
    return { url: url, assetType: 'Video', sourceKind: 'video' };
  }
  const url2 = resolveImageSourceUrl(input, output);
  return { url: url2, assetType: 'Image', sourceKind: 'image' };
}
function applyButtonState(el, error) {
  const value3 = String(error?.status || '')
      .trim()
      .toLowerCase(),
    value4 = value3 === 'processing',
    el2 = el.querySelector?.('svg');
  (el.classList.toggle('is-provider-asset-pass', value3 === 'passed'),
    el.classList.toggle('is-provider-asset-fail', value3 === 'failed'),
    el.classList.toggle('is-provider-asset-running', value4),
    el2?.classList?.toggle?.('v2-spinning', value4),
    (el.dataset.loading = value4 ? 'true' : 'false'),
    (el.disabled = value4),
    el.setAttribute('aria-busy', value4 ? 'true' : 'false'));
  if (value3 === 'passed') el.dataset.tooltip = faceDetectText('passedTooltip');
  else {
    if (value3 === 'failed')
      el.dataset.tooltip = error?.error
        ? faceDetectText('failedTooltipWithError', { error: error.error })
        : faceDetectText('failedTooltip');
    else
      value3 === 'processing'
        ? (el.dataset.tooltip = faceDetectText('processingTooltip'))
        : (el.dataset.tooltip = faceDetectText('defaultTooltip'));
  }
}
function persistAsset(value5, value6, value7) {
  const nodeId2 = getNodeId(value5);
  if (!nodeId2) return;
  const apimartPrivateAvatarPatch = buildApimartPrivateAvatarPatch(value6, value7);
  (value5.store?.updateNodeData?.(nodeId2, apimartPrivateAvatarPatch),
    value6 &&
      typeof value6 === 'object' &&
      (value6.providerAssetRefs = apimartPrivateAvatarPatch.providerAssetRefs));
}
export function bindApimartPrivateAvatarAction(options3 = {}) {
  const el3 = options3.toolbarEl?.querySelector?.(ACTION_CLASS);
  if (!el3) return;
  const nodeId3 = getNodeId(options3);
  if (!nodeId3) return;
  const run = () => {
    applyButtonState(el3, readApimartPrivateAvatarAsset(getLatestNodeData(options3)));
  };
  run();
  const value8 =
    typeof options3.store?.subscribeSelector === 'function'
      ? options3.store.subscribeSelector(
          (value9) => value9.nodes?.[nodeId3]?.providerAssetRefs?.[APIMART_PRIVATE_AVATAR_ASSET_KEY],
          () => run(),
        )
      : null;
  (el3._cleanupApimartPrivateAvatarState?.(),
    (el3._cleanupApimartPrivateAvatarState = () => value8?.()),
    el3.addEventListener('click', async (event) => {
      (event.preventDefault(), event.stopPropagation());
      if (el3.dataset.loading === 'true') return;
      const latestNodeData = getLatestNodeData(options3),
        { url: url3, assetType: assetType, sourceKind: sourceKind } = resolveSource(options3, latestNodeData);
      if (!url3) {
        (persistAsset(options3, latestNodeData, {
          provider: 'apimart',
          capability: 'seedance2PrivateAvatar',
          status: 'failed',
          error: faceDetectText('missingUrlError'),
        }),
          window.showToast?.(faceDetectText('missingUrlToast'), 'error'),
          run());
        return;
      }
      (persistAsset(options3, latestNodeData, {
        provider: 'apimart',
        capability: 'seedance2PrivateAvatar',
        status: 'processing',
        sourceUrl: url3,
        sourceKind: sourceKind,
        assetType: assetType,
        checkedAt: new Date().toISOString(),
      }),
        run());
      const value10 = options3.ensureConfig,
        value11 = options3.getProviderConfig;
      try {
        await value10?.();
        const value12 = value11?.('apimart') || {},
          apiKey = String(value12.apiKey || '').trim(),
          apiUrl = String(value12.apiUrl || DEFAULT_APIMART_API_URL).trim();
        if (!apiKey) throw new Error(faceDetectText('apiKeyMissing'));
        window.showToast?.(faceDetectText('running'), 'info');
        const assetUrl = await submitApimartSeedance2PrivateAvatar({
          apiKey: apiKey,
          apiUrl: apiUrl,
          url: url3,
          assetType: assetType,
          name: basenameFromUrl(url3) || sourceKind + '-asset',
        });
        (persistAsset(options3, getLatestNodeData(options3), {
          provider: 'apimart',
          capability: 'seedance2PrivateAvatar',
          status: 'passed',
          assetUrl: assetUrl.assetUrl,
          sourceUrl: url3,
          uploadedSourceUrl: assetUrl.sourceUrl || '',
          sourceKind: sourceKind,
          assetType: assetUrl.assetType || assetType,
          taskId: assetUrl.taskId || '',
          checkedAt: new Date().toISOString(),
        }),
          window.showToast?.(faceDetectText('passedToast'), 'success'));
      } catch (error2) {
        const error3 = error2?.message || faceDetectText('failedFallback');
        (persistAsset(options3, getLatestNodeData(options3), {
          provider: 'apimart',
          capability: 'seedance2PrivateAvatar',
          status: 'failed',
          sourceUrl: url3,
          sourceKind: sourceKind,
          assetType: assetType,
          checkedAt: new Date().toISOString(),
          error: error3,
        }),
          window.showToast?.(faceDetectText('failedToastWithError', { error: error3 }), 'error'));
      } finally {
        run();
      }
    }));
}
