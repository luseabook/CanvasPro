import { subscribeAssetUpdates } from './assetUpdateService.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function resolveVideoPlaybackRef(response = {}) {
  const text = normalizeText(response?.['videoProxyStatus'])['toLowerCase'](),
    text2 = normalizeText(response?.['displayLocalPath'] || response?.['displayUrl']);
  if (text2) return text2;
  if (text === 'not_required')
    return normalizeText(
      response?.['displayLocalPath'] ||
        response?.['displayUrl'] ||
        response?.['localPath'] ||
        response?.['originalLocalPath'] ||
        response?.['url'] ||
        response?.['originalUrl'],
    );
  return '';
}
function isFailedAsset(response2 = {}) {
  return [response2?.['status'], response2?.['derivativeStatus'], response2?.['mediaTaskStatus']]['some'](
    (item) => ['failed', 'cancelled']['includes'](normalizeText(item)['toLowerCase']()),
  );
}
function isReadyAsset(response3 = {}) {
  const text3 = normalizeText(response3?.['derivativeStatus'] || response3?.['status'])['toLowerCase']();
  return text3 === 'ready' && Boolean(resolveVideoPlaybackRef(response3));
}
function needsCanonicalVideoPreparation(response4 = {}) {
  return (
    Boolean(normalizeText(response4?.['assetId'])) &&
    [response4?.['videoProxyStatus'], response4?.['status'], response4?.['derivativeStatus']]['some']((key) =>
      ['waiting', 'processing']['includes'](normalizeText(key)['toLowerCase']()),
    )
  );
}
function createPreparationError(options = {}) {
  return new Error(normalizeText(options?.['mediaTaskError']) || '视频转码失败，请更换视频后重试');
}
export async function prepareImportedVideoAsset(
  args = {},
  {
    subscribeToAssetUpdates: subscribeToAssetUpdates = subscribeAssetUpdates,
    timeoutMs: timeoutMs = 120000,
  } = {},
) {
  const args2 = args && typeof args === 'object' ? { ...args } : {};
  if (isFailedAsset(args2)) throw createPreparationError(args2);
  if (isReadyAsset(args2) || !needsCanonicalVideoPreparation(args2)) return args2;
  const text4 = normalizeText(args2['assetId']);
  return new Promise((index, result) => {
    let data = false,
      handler = null,
      target = null;
    const run = () => {
        if (data) return;
        ((data = true), globalThis['clearTimeout'](target));
        if (typeof handler === 'function') handler();
      },
      handler2 = (handler3, source) => {
        (run(), handler3(source));
      };
    target = globalThis['setTimeout'](
      () => {
        handler2(result, new Error('视频仍在转码，请稍后重试'));
      },
      Math['max'](1, Number(timeoutMs) || 120000),
    );
    try {
      ((handler = subscribeToAssetUpdates((args3 = {}) => {
        if (normalizeText(args3?.['assetId']) !== text4) return;
        const next = { ...args2, ...args3 };
        if (isFailedAsset(next)) {
          handler2(result, createPreparationError(next));
          return;
        }
        if (isReadyAsset(next)) handler2(index, next);
      })),
        typeof handler !== 'function' && handler2(result, new Error('当前环境无法监听视频转码结果')));
    } catch (current) {
      handler2(result, current);
    }
  });
}
export const importedVideoAssetInternals = Object['freeze']({
  isReadyAsset: isReadyAsset,
  needsCanonicalVideoPreparation: needsCanonicalVideoPreparation,
  resolveVideoPlaybackRef: resolveVideoPlaybackRef,
});
