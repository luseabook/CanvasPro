import { loadCompletionSoundSettings } from './completionSoundService.js';
import { desktopBridge } from './desktopBridge.js';
import { t } from '../i18n/index.js';
import { ensureVideoResultThumbnail } from '../../api/videoResultThumbnailApi.js';
import { normalizeLocalPath } from '../utils/localMediaPath.js';
const IMAGE_FILE_EXTENSION_RE = /\.(?:png|jpe?g|webp|gif|bmp|avif)$/i,
  clickSubscribers = new Set();
let unsubscribeDesktopClicks = null,
  notificationSequence = 0x0;
function createNotificationReceipt(value) {
  const notificationId = value ? 'renderer-' + Date['now']() + '-' + ++notificationSequence : '';
  let enabled,
    item = ![];
  function acknowledge() {
    item = !![];
    if (!notificationId || !enabled) return;
    void Promise['resolve'](enabled)
      ['then'](() => getNotificationApi()?.['acknowledge']?.({ notificationId: notificationId }))
      ['catch'](() => {});
  }
  return {
    notificationId: notificationId,
    setDelivery(key) {
      enabled = key;
      if (item) acknowledge();
    },
    acknowledge: acknowledge,
  };
}
export function dispatchCompletionClick(index) {
  for (const run of clickSubscribers) {
    try {
      run(index);
    } catch (result) {
      console['warn']('[completionNotification] navigation failed:', result);
    }
  }
}
function showCompletionToast(dom, data) {
  const args = dom?.['navigation'];
  if (!['canvas', 'replacement-studio']['includes'](args?.['source'])) return;
  const name = normalizeText(dom['nodeName'] || dom['node']?.['name'] || dom['node']?.['title']),
    ariaLabel =
      normalizeText(dom['body']) ||
      (name
        ? t('coreServices.completion.notificationNodeBody', { name: name })
        : t('coreServices.completion.notificationBody')),
    options = { ...args };
  globalThis['window']?.['showToast']?.(ariaLabel, 'success', 0x2710, {
    ariaLabel: ariaLabel + '，点击查看结果',
    onClick: () => {
      (data['acknowledge'](), dispatchCompletionClick(options));
    },
  });
}
function getNotificationApi() {
  return desktopBridge['notification'];
}
function normalizeText(target) {
  return String(target || '')
    ['replace'](/\s+/g, '\x20')
    ['trim']();
}
function normalizeMediaKind(source) {
  const list = normalizeText(source)['toLowerCase']();
  if (list === 'video' || list['includes']('video')) return 'video';
  if (list === 'image' || list['includes']('image')) return 'image';
  return '';
}
function getPrimaryMediaItem(args2 = {}, next = '') {
  const current = next === 'video' ? 'videos' : 'images',
    entry = next === 'video' ? 'mainVideoIndex' : 'mainImageIndex',
    list2 = Array['isArray'](args2?.[current]) ? args2[current] : [];
  if (list2['length'] === 0x0) return args2;
  const record = Math['max'](0x0, Math['trunc'](Number(args2?.[entry]) || 0x0)),
    args3 = list2[record] || list2['find']((enabled2) => enabled2 && !enabled2['error']);
  return args3 && typeof args3 === 'object' ? { ...args2, ...args3 } : args2;
}
function resolveMediaKind(options2 = {}, payload = {}) {
  const handle = [options2?.['mediaKind'], payload?.['outputType'], payload?.['taskType'], payload?.['type']];
  for (const state of handle) {
    const mediaKind = normalizeMediaKind(state);
    if (mediaKind) return mediaKind;
  }
  if (
    Array['isArray'](payload?.['videos']) ||
    normalizeText(payload?.['videoUrl'] || payload?.['outputVideoUrl'])
  )
    return 'video';
  if (Array['isArray'](payload?.['images']) || normalizeText(payload?.['imageUrl'] || payload?.['outputUrl']))
    return 'image';
  return '';
}
function resolveImageThumbnailLocalPath(options3 = {}) {
  const config = [
    options3?.['thumbLocalPath'],
    options3?.['thumbnailLocalPath'],
    options3?.['posterLocalPath'],
    options3?.['displayLocalPath'],
    options3?.['localPath'],
    options3?.['originalLocalPath'],
    options3?.['thumbUrl'],
    options3?.['thumbnailUrl'],
    options3?.['posterUrl'],
    options3?.['imageUrl'],
    options3?.['sourceUrl'],
    options3?.['outputUrl'],
  ];
  for (const scope of config) {
    const localPath = normalizeLocalPath(scope);
    if (localPath && IMAGE_FILE_EXTENSION_RE['test'](localPath)) return localPath;
  }
  return '';
}
export async function buildGenerationCompleteNotificationRequest(
  notificationId2 = {},
  { ensureVideoThumbnail: ensureVideoThumbnail = ensureVideoResultThumbnail } = {},
) {
  const error =
      notificationId2?.['node'] &&
      typeof notificationId2['node'] === 'object' &&
      !Array['isArray'](notificationId2['node'])
        ? notificationId2['node']
        : {},
    name2 = normalizeText(notificationId2?.['nodeName'] || error?.['name'] || error?.['title']),
    mediaKind2 = resolveMediaKind(notificationId2, error);
  let primaryMediaItem = getPrimaryMediaItem(error, mediaKind2);
  if (mediaKind2 === 'video' && typeof ensureVideoThumbnail === 'function')
    try {
      primaryMediaItem = await ensureVideoThumbnail(primaryMediaItem);
    } catch {}
  const thumbnailLocalPath =
      mediaKind2 === 'image' || mediaKind2 === 'video'
        ? resolveImageThumbnailLocalPath(primaryMediaItem)
        : '',
    input = name2
      ? t('coreServices.completion.notificationNodeBody', { name: name2 })
      : t('coreServices.completion.notificationBody');
  return {
    title: normalizeText(notificationId2?.['title']) || normalizeText(globalThis.document?.title) || 'Canvas',
    body: normalizeText(notificationId2?.['body']) || input,
    ...(thumbnailLocalPath ? { thumbnailLocalPath: thumbnailLocalPath } : {}),
    ...(notificationId2?.['navigation'] && typeof notificationId2['navigation'] === 'object'
      ? { navigation: { ...notificationId2['navigation'] } }
      : {}),
    ...(notificationId2['notificationId'] ? { notificationId: notificationId2['notificationId'] } : {}),
  };
}
export function subscribeGenerationCompleteNotificationClicks(output) {
  if (typeof output !== 'function') return () => {};
  return (
    clickSubscribers['add'](output),
    !unsubscribeDesktopClicks &&
      (unsubscribeDesktopClicks =
        getNotificationApi()?.['onGenerationCompleteClick']?.(dispatchCompletionClick) || (() => {})),
    () => {
      clickSubscribers['delete'](output);
      if (clickSubscribers['size']) return;
      (unsubscribeDesktopClicks?.(), (unsubscribeDesktopClicks = null));
    }
  );
}
export function showGenerationCompleteNotification(args4 = {}) {
  const notificationId3 = createNotificationReceipt(args4['navigation']);
  showCompletionToast(args4, notificationId3);
  const notificationApi = getNotificationApi(),
    handler = notificationApi?.['showGenerationComplete'];
  if (notificationApi?.['isAvailable']?.() === ![] || typeof handler !== 'function')
    return Promise['resolve']({ success: !![], shown: ![], reason: 'unavailable' });
  const promise = (async () => {
    const completionSoundSettings = await loadCompletionSoundSettings();
    if (completionSoundSettings['notificationEnabled'] === ![])
      return { success: !![], shown: ![], reason: 'disabled' };
    const generationCompleteNotificationRequest = await buildGenerationCompleteNotificationRequest({
      ...args4,
      notificationId: notificationId3['notificationId'],
    });
    return handler(generationCompleteNotificationRequest);
  })();
  return (
    notificationId3['setDelivery'](promise),
    promise &&
      typeof promise['catch'] === 'function' &&
      promise['catch']((value2) => {
        console['warn']('[completionNotification] show failed:', value2);
      }),
    promise
  );
}
export async function showTaskStatusNotification({
  body: body,
  type: type = 'error',
  navigation: navigation,
} = {}) {
  const navigation2 = navigation ? { ...navigation } : null,
    notificationId4 = createNotificationReceipt(navigation2);
  globalThis['window']?.['showToast']?.(
    body,
    type,
    0x2710,
    navigation2
      ? {
          ariaLabel: body + '，点击查看任务',
          onClick: () => {
            (notificationId4['acknowledge'](), dispatchCompletionClick(navigation2));
          },
        }
      : {},
  );
  const completionSoundSettings2 = await loadCompletionSoundSettings(),
    list3 = [];
  completionSoundSettings2['enabled'] !== ![] &&
    completionSoundSettings2['volume'] > 0x0 &&
    desktopBridge['notificationSound']['isAvailable']() &&
    list3['push'](
      Promise['resolve']()['then'](() => desktopBridge['notificationSound']['play']({ system: !![] })),
    );
  const notificationApi2 = getNotificationApi();
  if (
    completionSoundSettings2['notificationEnabled'] !== ![] &&
    notificationApi2?.['isAvailable']?.() !== ![]
  ) {
    const value3 = Promise['resolve']()['then'](() =>
      notificationApi2?.['showGenerationComplete']?.({
        title: normalizeText(globalThis.document?.title) || 'Canvas',
        body: body,
        ...(navigation2
          ? { navigation: navigation2, notificationId: notificationId4['notificationId'] }
          : {}),
      }),
    );
    (notificationId4['setDelivery'](value3), list3['push'](value3));
  }
  return Promise['allSettled'](list3);
}
