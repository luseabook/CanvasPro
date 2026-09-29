import { loadCompletionSoundSettings } from './completionSoundService.js';
import { desktopBridge } from './desktopBridge.js';
import { t } from '../i18n/index.js';
import { ensureVideoResultThumbnail } from '../../api/videoResultThumbnailApi.js';
import { normalizeLocalPath } from '../utils/localMediaPath.js';
const IMAGE_FILE_EXTENSION_RE = /\.(?:png|jpe?g|webp|gif|bmp|avif)$/i,
  clickSubscribers = new Set();
let unsubscribeDesktopClicks = null,
  notificationSequence = 0x0;
function createNotificationReceipt(_0x35dda9) {
  const _0x5cc154 = _0x35dda9 ? 'renderer-' + Date['now']() + '-' + ++notificationSequence : '';
  let _0x16aa97,
    _0x3e26fe = ![];
  function _0x1724a0() {
    _0x3e26fe = !![];
    if (!_0x5cc154 || !_0x16aa97) return;
    void Promise['resolve'](_0x16aa97)
      ['then'](() => getNotificationApi()?.['acknowledge']?.({ notificationId: _0x5cc154 }))
      ['catch'](() => {});
  }
  return {
    notificationId: _0x5cc154,
    setDelivery(_0x831ff7) {
      _0x16aa97 = _0x831ff7;
      if (_0x3e26fe) _0x1724a0();
    },
    acknowledge: _0x1724a0,
  };
}
export function dispatchCompletionClick(_0x54646c) {
  for (const _0x15bde4 of clickSubscribers) {
    try {
      _0x15bde4(_0x54646c);
    } catch (_0x2ea79a) {
      console['warn']('[completionNotification] navigation failed:', _0x2ea79a);
    }
  }
}
function showCompletionToast(_0x3e3544, _0x25b176) {
  const _0x42cc21 = _0x3e3544?.['navigation'];
  if (!['canvas', 'replacement-studio']['includes'](_0x42cc21?.['source'])) return;
  const _0x18c483 = normalizeText(
      _0x3e3544['nodeName'] || _0x3e3544['node']?.['name'] || _0x3e3544['node']?.['title'],
    ),
    _0x203465 =
      normalizeText(_0x3e3544['body']) ||
      (_0x18c483
        ? t('coreServices.completion.notificationNodeBody', { name: _0x18c483 })
        : t('coreServices.completion.notificationBody')),
    _0x345389 = { ..._0x42cc21 };
  globalThis['window']?.['showToast']?.(_0x203465, 'success', 0x2710, {
    ariaLabel: _0x203465 + '，点击查看结果',
    onClick: () => {
      (_0x25b176['acknowledge'](), dispatchCompletionClick(_0x345389));
    },
  });
}
function getNotificationApi() {
  return desktopBridge['notification'];
}
function normalizeText(_0x256d98) {
  return String(_0x256d98 || '')
    ['replace'](/\s+/g, '\x20')
    ['trim']();
}
function normalizeMediaKind(_0x45d602) {
  const _0x38ae14 = normalizeText(_0x45d602)['toLowerCase']();
  if (_0x38ae14 === 'video' || _0x38ae14['includes']('video')) return 'video';
  if (_0x38ae14 === 'image' || _0x38ae14['includes']('image')) return 'image';
  return '';
}
function getPrimaryMediaItem(_0x9334c9 = {}, _0x163e50 = '') {
  const _0xf5bc32 = _0x163e50 === 'video' ? 'videos' : 'images',
    _0x45e037 = _0x163e50 === 'video' ? 'mainVideoIndex' : 'mainImageIndex',
    _0xac422 = Array['isArray'](_0x9334c9?.[_0xf5bc32]) ? _0x9334c9[_0xf5bc32] : [];
  if (_0xac422['length'] === 0x0) return _0x9334c9;
  const _0x4d2c46 = Math['max'](0x0, Math['trunc'](Number(_0x9334c9?.[_0x45e037]) || 0x0)),
    _0x40904e = _0xac422[_0x4d2c46] || _0xac422['find']((_0x43ac56) => _0x43ac56 && !_0x43ac56['error']);
  return _0x40904e && typeof _0x40904e === 'object' ? { ..._0x9334c9, ..._0x40904e } : _0x9334c9;
}
function resolveMediaKind(_0x43be96 = {}, _0xd23553 = {}) {
  const _0x5c1579 = [
    _0x43be96?.['mediaKind'],
    _0xd23553?.['outputType'],
    _0xd23553?.['taskType'],
    _0xd23553?.['type'],
  ];
  for (const _0x22cd99 of _0x5c1579) {
    const _0x1c5aa2 = normalizeMediaKind(_0x22cd99);
    if (_0x1c5aa2) return _0x1c5aa2;
  }
  if (
    Array['isArray'](_0xd23553?.['videos']) ||
    normalizeText(_0xd23553?.['videoUrl'] || _0xd23553?.['outputVideoUrl'])
  )
    return 'video';
  if (
    Array['isArray'](_0xd23553?.['images']) ||
    normalizeText(_0xd23553?.['imageUrl'] || _0xd23553?.['outputUrl'])
  )
    return 'image';
  return '';
}
function resolveImageThumbnailLocalPath(_0x578f34 = {}) {
  const _0x4b83f5 = [
    _0x578f34?.['thumbLocalPath'],
    _0x578f34?.['thumbnailLocalPath'],
    _0x578f34?.['posterLocalPath'],
    _0x578f34?.['displayLocalPath'],
    _0x578f34?.['localPath'],
    _0x578f34?.['originalLocalPath'],
    _0x578f34?.['thumbUrl'],
    _0x578f34?.['thumbnailUrl'],
    _0x578f34?.['posterUrl'],
    _0x578f34?.['imageUrl'],
    _0x578f34?.['sourceUrl'],
    _0x578f34?.['outputUrl'],
  ];
  for (const _0x168ac6 of _0x4b83f5) {
    const _0x5c1f6d = normalizeLocalPath(_0x168ac6);
    if (_0x5c1f6d && IMAGE_FILE_EXTENSION_RE['test'](_0x5c1f6d)) return _0x5c1f6d;
  }
  return '';
}
export async function buildGenerationCompleteNotificationRequest(
  _0x2ec05c = {},
  { ensureVideoThumbnail: ensureVideoThumbnail = ensureVideoResultThumbnail } = {},
) {
  const _0x1a53c5 =
      _0x2ec05c?.['node'] && typeof _0x2ec05c['node'] === 'object' && !Array['isArray'](_0x2ec05c['node'])
        ? _0x2ec05c['node']
        : {},
    _0x579d1d = normalizeText(_0x2ec05c?.['nodeName'] || _0x1a53c5?.['name'] || _0x1a53c5?.['title']),
    _0x950ce6 = resolveMediaKind(_0x2ec05c, _0x1a53c5);
  let _0x385066 = getPrimaryMediaItem(_0x1a53c5, _0x950ce6);
  if (_0x950ce6 === 'video' && typeof ensureVideoThumbnail === 'function')
    try {
      _0x385066 = await ensureVideoThumbnail(_0x385066);
    } catch {}
  const _0x511305 =
      _0x950ce6 === 'image' || _0x950ce6 === 'video' ? resolveImageThumbnailLocalPath(_0x385066) : '',
    _0x405e86 = _0x579d1d
      ? t('coreServices.completion.notificationNodeBody', { name: _0x579d1d })
      : t('coreServices.completion.notificationBody');
  return {
    title: normalizeText(_0x2ec05c?.['title']) || 'updream canvas',
    body: normalizeText(_0x2ec05c?.['body']) || _0x405e86,
    ...(_0x511305 ? { thumbnailLocalPath: _0x511305 } : {}),
    ...(_0x2ec05c?.['navigation'] && typeof _0x2ec05c['navigation'] === 'object'
      ? { navigation: { ..._0x2ec05c['navigation'] } }
      : {}),
    ...(_0x2ec05c['notificationId'] ? { notificationId: _0x2ec05c['notificationId'] } : {}),
  };
}
export function subscribeGenerationCompleteNotificationClicks(_0x842973) {
  if (typeof _0x842973 !== 'function') return () => {};
  return (
    clickSubscribers['add'](_0x842973),
    !unsubscribeDesktopClicks &&
      (unsubscribeDesktopClicks =
        getNotificationApi()?.['onGenerationCompleteClick']?.(dispatchCompletionClick) || (() => {})),
    () => {
      clickSubscribers['delete'](_0x842973);
      if (clickSubscribers['size']) return;
      (unsubscribeDesktopClicks?.(), (unsubscribeDesktopClicks = null));
    }
  );
}
export function showGenerationCompleteNotification(_0x50f4c3 = {}) {
  const _0x50dacf = createNotificationReceipt(_0x50f4c3['navigation']);
  showCompletionToast(_0x50f4c3, _0x50dacf);
  const _0x142f49 = getNotificationApi(),
    _0x330e9d = _0x142f49?.['showGenerationComplete'];
  if (_0x142f49?.['isAvailable']?.() === ![] || typeof _0x330e9d !== 'function')
    return Promise['resolve']({ success: !![], shown: ![], reason: 'unavailable' });
  const _0x5539f5 = (async () => {
    const _0x210bf1 = await loadCompletionSoundSettings();
    if (_0x210bf1['notificationEnabled'] === ![]) return { success: !![], shown: ![], reason: 'disabled' };
    const _0x2bc76c = await buildGenerationCompleteNotificationRequest({
      ..._0x50f4c3,
      notificationId: _0x50dacf['notificationId'],
    });
    return _0x330e9d(_0x2bc76c);
  })();
  return (
    _0x50dacf['setDelivery'](_0x5539f5),
    _0x5539f5 &&
      typeof _0x5539f5['catch'] === 'function' &&
      _0x5539f5['catch']((_0x1bbd9a) => {
        console['warn']('[completionNotification] show failed:', _0x1bbd9a);
      }),
    _0x5539f5
  );
}
export async function showTaskStatusNotification({
  body: _0x4c49ca,
  type: type = 'error',
  navigation: _0x1354b7,
} = {}) {
  const _0x394f11 = _0x1354b7 ? { ..._0x1354b7 } : null,
    _0x4365f8 = createNotificationReceipt(_0x394f11);
  globalThis['window']?.['showToast']?.(
    _0x4c49ca,
    type,
    0x2710,
    _0x394f11
      ? {
          ariaLabel: _0x4c49ca + '，点击查看任务',
          onClick: () => {
            (_0x4365f8['acknowledge'](), dispatchCompletionClick(_0x394f11));
          },
        }
      : {},
  );
  const _0x1997fe = await loadCompletionSoundSettings(),
    _0x4c589f = [];
  _0x1997fe['enabled'] !== ![] &&
    _0x1997fe['volume'] > 0x0 &&
    desktopBridge['notificationSound']['isAvailable']() &&
    _0x4c589f['push'](
      Promise['resolve']()['then'](() => desktopBridge['notificationSound']['play']({ system: !![] })),
    );
  const _0x1f0ab8 = getNotificationApi();
  if (_0x1997fe['notificationEnabled'] !== ![] && _0x1f0ab8?.['isAvailable']?.() !== ![]) {
    const _0x197a81 = Promise['resolve']()['then'](() =>
      _0x1f0ab8?.['showGenerationComplete']?.({
        title: 'updream canvas',
        body: _0x4c49ca,
        ...(_0x394f11 ? { navigation: _0x394f11, notificationId: _0x4365f8['notificationId'] } : {}),
      }),
    );
    (_0x4365f8['setDelivery'](_0x197a81), _0x4c589f['push'](_0x197a81));
  }
  return Promise['allSettled'](_0x4c589f);
}
