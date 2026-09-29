import {
  getVideoCurrentSource,
  playVideoWithRecovery,
} from '../components/video-node/mediaPlaybackRecovery.js';
import {
  attachMediaElementPlaybackSource,
  isMediaElementPlaybackSource,
} from '../services/desktopMediaBlobSource.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
import { t } from '../i18n/index.js';
import {
  claimExternalVideoPlayback,
  releaseExternalVideoPlayback,
} from '../components/shared/hoverVideoPlaybackLifecycle.js';
const PLAYABLE_VIDEO_TYPES = new Set(['source-video', 'video', 'ai-video']),
  GROUP_NODE_TYPE = 'group',
  SYNC_PLAYBACK_CLASS = 'is-sync-video-playing';
function syncPlaybackText(_0x495539, _0x3f1c20 = {}) {
  return t('videoSyncPlayback.' + _0x495539, _0x3f1c20);
}
function normalizeText(_0x333e22) {
  return String(_0x333e22 || '').trim();
}
function toNodeList(_0x27e2e4) {
  if (!_0x27e2e4 || typeof _0x27e2e4 !== 'object') return [];
  return Object.values(_0x27e2e4).filter((_0x2e384a) => _0x2e384a && typeof _0x2e384a === 'object');
}
function compareCanvasOrder(_0x32810b, _0x155584) {
  const _0x206d2f = Number(_0x32810b?.y) || 0,
    _0x2dc99e = Number(_0x155584?.y) || 0;
  if (_0x206d2f !== _0x2dc99e) return _0x206d2f - _0x2dc99e;
  const _0x45f3b0 = Number(_0x32810b?.x) || 0,
    _0x170925 = Number(_0x155584?.x) || 0;
  if (_0x45f3b0 !== _0x170925) return _0x45f3b0 - _0x170925;
  return normalizeText(_0x32810b?.id).localeCompare(normalizeText(_0x155584?.id));
}
function normalizePlayableUrl(_0x56cac5) {
  const _0x1169a3 = normalizeText(_0x56cac5);
  if (!_0x1169a3) return '';
  if (
    _0x1169a3.startsWith('http://') ||
    _0x1169a3.startsWith('https://') ||
    _0x1169a3.startsWith('blob:') ||
    _0x1169a3.startsWith('data:')
  )
    return _0x1169a3;
  const _0xe55bc4 = localPathToUrl(_0x1169a3);
  if (_0xe55bc4) return _0xe55bc4;
  if (_0x1169a3.startsWith('/')) return _0x1169a3;
  return '';
}
function resolveVideoSource(_0x1475c2 = {}) {
  for (const _0x4b514a of [
    'displayLocalPath',
    'localPath',
    'originalLocalPath',
    'src',
    'videoUrl',
    'url',
    'resultUrl',
    'sourceUrl',
  ]) {
    const _0x535676 = normalizePlayableUrl(_0x1475c2?.[_0x4b514a]);
    if (_0x535676) return _0x535676;
  }
  return '';
}
function isUnavailableVideoRecord(_0x3dde48 = {}) {
  return (
    !!normalizeText(_0x3dde48?.error) ||
    _0x3dde48?.mediaUnavailable === true ||
    _0x3dde48?.videoUnavailable === true
  );
}
function getMainVideoRecord(_0x274038) {
  const _0x1a1377 = Array.isArray(_0x274038?.videos) ? _0x274038.videos : [];
  if (_0x1a1377.length === 0) return null;
  const _0x537533 = Number(_0x274038?.mainVideoIndex),
    _0x3f57df = Number.isFinite(_0x537533)
      ? Math.max(0, Math.min(_0x1a1377.length - 1, Math.trunc(_0x537533)))
      : 0;
  return { record: _0x1a1377[_0x3f57df], index: _0x3f57df };
}
function collectVideoEntriesForNode(_0x1856b1) {
  if (!PLAYABLE_VIDEO_TYPES.has(normalizeText(_0x1856b1?.type))) return [];
  if (isUnavailableVideoRecord(_0x1856b1)) return [];
  if (normalizeText(_0x1856b1?.type) === 'ai-video') {
    const _0xb3bce5 = getMainVideoRecord(_0x1856b1);
    if (_0xb3bce5?.record) {
      if (isUnavailableVideoRecord(_0xb3bce5.record)) return [];
      const _0x388cd6 = resolveVideoSource(_0xb3bce5.record) || resolveVideoSource(_0x1856b1);
      return _0x388cd6
        ? [
            {
              nodeId: normalizeText(_0x1856b1.id),
              videoIndex: _0xb3bce5.index,
              source: _0x388cd6,
              node: _0x1856b1,
            },
          ]
        : [];
    }
  }
  const _0x2d4b02 = resolveVideoSource(_0x1856b1);
  return _0x2d4b02
    ? [{ nodeId: normalizeText(_0x1856b1.id), videoIndex: 0, source: _0x2d4b02, node: _0x1856b1 }]
    : [];
}
function buildChildrenByParent(_0x2c62c2) {
  const _0x93361d = new Map();
  for (const _0x3c9900 of toNodeList(_0x2c62c2)) {
    const _0x5e4476 = normalizeText(_0x3c9900?.parentId);
    if (!_0x5e4476) continue;
    if (!_0x93361d.has(_0x5e4476)) _0x93361d.set(_0x5e4476, []);
    _0x93361d.get(_0x5e4476).push(_0x3c9900);
  }
  for (const _0x29efb3 of _0x93361d.values()) {
    _0x29efb3.sort(compareCanvasOrder);
  }
  return _0x93361d;
}
function pushUniqueEntry(_0x429c71, _0x267bb6, _0xbc17b) {
  const _0x762999 = normalizeText(_0xbc17b?.nodeId);
  if (!_0x762999) return;
  const _0x3525b1 = _0x762999 + ':' + (Number(_0xbc17b?.videoIndex) || 0);
  if (_0x267bb6.has(_0x3525b1)) return;
  (_0x267bb6.add(_0x3525b1), _0x429c71.push({ ..._0xbc17b, key: _0x3525b1 }));
}
function collectGroupEntriesInto({
  nodes: _0x3d713d,
  groupId: _0x16954f,
  childrenByParent: _0xa0b124,
  result: _0x225d71,
  seen: _0x31ee5b,
  visitedGroups: _0x3c325d,
}) {
  const _0x1be99b = normalizeText(_0x16954f);
  if (!_0x1be99b || _0x3c325d.has(_0x1be99b)) return;
  _0x3c325d.add(_0x1be99b);
  const _0x19d2ea = _0xa0b124.get(_0x1be99b) || [];
  for (const _0x213710 of _0x19d2ea) {
    const _0x4cded7 = normalizeText(_0x213710?.id);
    if (!_0x4cded7) continue;
    if (normalizeText(_0x213710?.type) === GROUP_NODE_TYPE) {
      collectGroupEntriesInto({
        nodes: _0x3d713d,
        groupId: _0x4cded7,
        childrenByParent: _0xa0b124,
        result: _0x225d71,
        seen: _0x31ee5b,
        visitedGroups: _0x3c325d,
      });
      continue;
    }
    for (const _0x943911 of collectVideoEntriesForNode(_0x3d713d?.[_0x4cded7] || _0x213710)) {
      pushUniqueEntry(_0x225d71, _0x31ee5b, _0x943911);
    }
  }
}
export function collectGroupSyncPlayableVideoEntries(_0x1cd453, _0x2f9d59) {
  const _0x151f3e = _0x1cd453?.[_0x2f9d59];
  if (!_0x151f3e || normalizeText(_0x151f3e?.type) !== GROUP_NODE_TYPE) return [];
  const _0x3d6e4b = [],
    _0x3b4c09 = new Set();
  return (
    collectGroupEntriesInto({
      nodes: _0x1cd453,
      groupId: _0x2f9d59,
      childrenByParent: buildChildrenByParent(_0x1cd453),
      result: _0x3d6e4b,
      seen: _0x3b4c09,
      visitedGroups: new Set(),
    }),
    _0x3d6e4b
  );
}
export function collectSelectedSyncPlayableVideoEntries(_0x252f0f, _0x7627eb = []) {
  const _0x52dd87 = new Set(
    (Array.isArray(_0x7627eb) ? _0x7627eb : []).map((_0x474d4f) => normalizeText(_0x474d4f)).filter(Boolean),
  );
  if (_0x52dd87.size === 0) return [];
  const _0x2dbd13 = [],
    _0x47d05a = new Set(),
    _0x38d6c7 = buildChildrenByParent(_0x252f0f),
    _0x326085 = toNodeList(_0x252f0f)
      .filter((_0x16eb52) => _0x52dd87.has(normalizeText(_0x16eb52?.id)))
      .sort(compareCanvasOrder);
  for (const _0x4cf1b5 of _0x326085) {
    const _0x500975 = normalizeText(_0x4cf1b5?.type);
    if (_0x500975 === GROUP_NODE_TYPE) {
      collectGroupEntriesInto({
        nodes: _0x252f0f,
        groupId: _0x4cf1b5.id,
        childrenByParent: _0x38d6c7,
        result: _0x2dbd13,
        seen: _0x47d05a,
        visitedGroups: new Set(),
      });
      continue;
    }
    for (const _0x521cf5 of collectVideoEntriesForNode(_0x4cf1b5)) {
      pushUniqueEntry(_0x2dbd13, _0x47d05a, _0x521cf5);
    }
  }
  return _0x2dbd13;
}
export function getSelectedSyncPlayableVideoCount(_0x35db66, _0x362408 = []) {
  return collectSelectedSyncPlayableVideoEntries(_0x35db66, _0x362408).length;
}
function findVideoElementForEntry(_0x543552, _0x1cd87e) {
  const _0x207d32 = _0x543552 || globalThis.document;
  if (!_0x207d32 || typeof _0x207d32.getElementById !== 'function') return null;
  const _0xc9764 = _0x207d32.getElementById(normalizeText(_0x1cd87e?.nodeId));
  if (!_0xc9764 || typeof _0xc9764.querySelector !== 'function') return null;
  const _0x3650bf = Math.max(0, Math.trunc(Number(_0x1cd87e?.videoIndex) || 0));
  return (
    _0xc9764.querySelector('video[data-idx="' + _0x3650bf + '"]') ||
    _0xc9764.querySelector('.video-player') ||
    _0xc9764.querySelector('video')
  );
}
function findWrapperForEntry(_0x50dde8, _0x4fe01a) {
  const _0x4a5690 = _0x50dde8 || globalThis.document;
  if (!_0x4a5690 || typeof _0x4a5690.getElementById !== 'function') return null;
  return _0x4a5690.getElementById(normalizeText(_0x4fe01a?.nodeId));
}
function safePause(_0x356d87) {
  try {
    _0x356d87?.pause?.();
  } catch {}
}
function setSyncPlaybackChromeHidden(_0x36903a, _0x5177b6) {
  _0x36903a?.classList?.toggle?.(SYNC_PLAYBACK_CLASS, !!_0x5177b6);
}
function restoreSyncPlaybackChrome(_0x168877) {
  setSyncPlaybackChromeHidden(_0x168877, false);
}
function installSyncPlaybackChromeRestore(_0x445f03, _0xbcd0bb) {
  if (!_0x445f03 || !_0xbcd0bb) return () => {};
  let _0x356fa9 = false;
  const _0x1c07ca = () => {
    if (_0x356fa9) return;
    _0x356fa9 = true;
    for (const _0x28fbd0 of ['pause', 'ended', 'error']) {
      _0x445f03.removeEventListener?.(_0x28fbd0, _0x1c07ca);
    }
    restoreSyncPlaybackChrome(_0xbcd0bb);
  };
  for (const _0x5d4b42 of ['pause', 'ended', 'error']) {
    _0x445f03.addEventListener?.(_0x5d4b42, _0x1c07ca);
  }
  return _0x1c07ca;
}
function pauseOutsideTargetVideos(_0x5356b7, _0xe2ff28) {
  const _0x961175 = _0x5356b7 || globalThis.document;
  if (!_0x961175 || typeof _0x961175.querySelectorAll !== 'function') return;
  const _0x55b855 = new Set(_0xe2ff28.filter(Boolean));
  _0x961175.querySelectorAll('video').forEach((_0x24b80e) => {
    if (_0x55b855.has(_0x24b80e)) return;
    safePause(_0x24b80e);
  });
}
function waitForMetadata(_0x25a4b5, _0xa9f052 = 0x1f4) {
  if (!_0x25a4b5 || Number(_0x25a4b5.readyState || 0) >= 1) return Promise.resolve(true);
  return new Promise((_0x282057) => {
    let _0x5c0af2 = false;
    const _0x47234c = (_0x249737) => {
        if (_0x5c0af2) return;
        ((_0x5c0af2 = true),
          clearTimeout(_0x45f859),
          _0x25a4b5.removeEventListener?.('loadedmetadata', _0x3d41db),
          _0x25a4b5.removeEventListener?.('loadeddata', _0x3d41db),
          _0x25a4b5.removeEventListener?.('error', _0x1058fc),
          _0x282057(_0x249737));
      },
      _0x3d41db = () => _0x47234c(true),
      _0x1058fc = () => _0x47234c(false),
      _0x45f859 = setTimeout(() => _0x47234c(false), _0xa9f052);
    (_0x25a4b5.addEventListener?.('loadedmetadata', _0x3d41db),
      _0x25a4b5.addEventListener?.('loadeddata', _0x3d41db),
      _0x25a4b5.addEventListener?.('error', _0x1058fc));
  });
}
async function ensureVideoSource(_0x4bc5e3, _0xc2a37f, _0x139ad3) {
  if (!_0x4bc5e3) return false;
  const _0xbfec98 = getVideoCurrentSource(_0x4bc5e3),
    _0xc5974e = normalizeText(_0xc2a37f);
  if (!_0xc5974e) return !!_0xbfec98;
  if (_0xbfec98 === _0xc5974e || isMediaElementPlaybackSource(_0x4bc5e3, _0xc5974e)) return true;
  return (
    await _0x139ad3(_0x4bc5e3, _0xc5974e, { preload: 'auto', warmRanges: false, load: false }),
    !!getVideoCurrentSource(_0x4bc5e3)
  );
}
async function prepareVideoForSync(_0x4e4020, _0x2ff11c, _0x46f2f1) {
  safePause(_0x4e4020);
  const _0x307c48 = await ensureVideoSource(_0x4e4020, _0x2ff11c, _0x46f2f1);
  if (!_0x307c48) return false;
  await waitForMetadata(_0x4e4020);
  try {
    _0x4e4020.currentTime = 0;
  } catch {}
  return ((_0x4e4020.loop = false), true);
}
export async function syncPlayVideoEntries({
  entries: entries = [],
  root: root = globalThis.document,
  showToast: showToast = globalThis.window?.showToast,
  playWithRecovery: playWithRecovery = playVideoWithRecovery,
  attachSource: attachSource = attachMediaElementPlaybackSource,
} = {}) {
  const _0x52ab8d = Array.isArray(entries) ? entries : [];
  if (_0x52ab8d.length < 2)
    return (
      showToast?.(syncPlaybackText('fewerThanTwo'), 'warn'),
      { played: 0, total: _0x52ab8d.length, missing: 0, failed: 0 }
    );
  const _0x2eeff5 = _0x52ab8d.map((_0x153635) => {
      const _0xcea50d = findWrapperForEntry(root, _0x153635);
      return { entry: _0x153635, wrapper: _0xcea50d, videoEl: findVideoElementForEntry(root, _0x153635) };
    }),
    _0x127049 = _0x2eeff5.map((_0x3eab80) => _0x3eab80.videoEl).filter(Boolean);
  pauseOutsideTargetVideos(root, _0x127049);
  let _0x8e3fbe = 0,
    _0x1aab6a = 0;
  const _0x468dd0 = [];
  await Promise.all(
    _0x2eeff5.map(async ({ entry: _0x4e0aa0, videoEl: _0x212fc0, wrapper: _0x4dd889 }) => {
      if (!_0x212fc0) {
        _0x8e3fbe += 1;
        return;
      }
      const _0x7fd7d9 = await prepareVideoForSync(_0x212fc0, _0x4e0aa0.source, attachSource);
      if (!_0x7fd7d9) {
        _0x1aab6a += 1;
        return;
      }
      _0x468dd0.push({ entry: _0x4e0aa0, videoEl: _0x212fc0, wrapper: _0x4dd889 });
    }),
  );
  if (_0x468dd0.length < 2) {
    const _0x203617 =
      _0x8e3fbe > 0 ? syncPlaybackText('selectedUnmounted') : syncPlaybackText('fewerThanTwo');
    return (
      showToast?.(_0x203617, 'warn'),
      { played: 0, total: _0x52ab8d.length, missing: _0x8e3fbe, failed: _0x1aab6a }
    );
  }
  const _0xf266e9 = _0x468dd0.map(({ videoEl: _0x10ce4e, wrapper: _0x33c285 }) => {
      return (
        setSyncPlaybackChromeHidden(_0x33c285, true),
        installSyncPlaybackChromeRestore(_0x10ce4e, _0x33c285)
      );
    }),
    _0x476d70 = await Promise.all(
      _0x468dd0.map(({ entry: _0x2cb267, videoEl: _0x3f8444 }, _0x323ffe) =>
        playWithRecovery(_0x3f8444, {
          label: 'sync-video:' + _0x2cb267.nodeId + ':' + _0x2cb267.videoIndex,
          ensureSrc: () => ensureVideoSource(_0x3f8444, _0x2cb267.source, attachSource),
          allowConcurrent: true,
          shouldRecover: () => _0x3f8444.isConnected !== false && !_0x3f8444.paused,
        }).catch(() => {
          return (_0xf266e9[_0x323ffe]?.(), false);
        }),
      ),
    );
  _0x476d70.forEach((_0x3bc9a6, _0xe59c5f) => {
    if (!_0x3bc9a6) _0xf266e9[_0xe59c5f]?.();
  });
  const _0x332c58 = _0x476d70.filter(Boolean).length;
  _0x1aab6a += _0x476d70.length - _0x332c58;
  if (_0x332c58 > 0) showToast?.(syncPlaybackText('playedCount', { count: _0x332c58 }), 'success');
  else
    _0x8e3fbe > 0
      ? showToast?.(syncPlaybackText('selectedUnmounted'), 'warn')
      : showToast?.(syncPlaybackText('none'), 'warn');
  return { played: _0x332c58, total: _0x52ab8d.length, missing: _0x8e3fbe, failed: _0x1aab6a };
}
export function syncPlaySelectedVideos({
  selectedIds: _0x27a865,
  state: _0xd792d9,
  root: root = globalThis.document,
  showToast: showToast = globalThis.window?.showToast,
  ..._0xb3eb85
} = {}) {
  const _0x2c354d = _0xd792d9?.nodes || {};
  return syncPlayVideoEntries({
    entries: collectSelectedSyncPlayableVideoEntries(_0x2c354d, _0x27a865),
    root: root,
    showToast: showToast,
    ..._0xb3eb85,
  });
}
export function syncPlayGroupVideos({
  groupId: _0x559fea,
  state: _0x281723,
  root: root = globalThis.document,
  showToast: showToast = globalThis.window?.showToast,
  ..._0x5c7533
} = {}) {
  const _0x169f66 = _0x281723?.nodes || {};
  return syncPlayVideoEntries({
    entries: collectGroupSyncPlayableVideoEntries(_0x169f66, _0x559fea),
    root: root,
    showToast: showToast,
    ..._0x5c7533,
  });
}
let activeSyncVideoPlaybackSession = null,
  syncVideoPlaybackSessionSequence = 0x0;

const syncVideoPlaybackStateListeners = new Set();

export function getSyncVideoPlaybackState() {
  const _0x88c83a = activeSyncVideoPlaybackSession?.['isCurrent']?.() === !![] ;
  return { active: _0x88c83a, loop: _0x88c83a && activeSyncVideoPlaybackSession?.['loop'] === !![] };
}

function notifySyncVideoPlaybackState() {
  const _0x4b3226 = getSyncVideoPlaybackState();
  for (const _0x3f59ff of syncVideoPlaybackStateListeners) {
    try {
      _0x3f59ff(_0x4b3226);
    } catch {}
  }
}

export function subscribeSyncVideoPlaybackState(_0x4cb2cc) {
  if (typeof _0x4cb2cc !== 'function') return () => {};
  syncVideoPlaybackStateListeners['add'](_0x4cb2cc);
  try {
    _0x4cb2cc(getSyncVideoPlaybackState());
  } catch {}
  return () => syncVideoPlaybackStateListeners['delete'](_0x4cb2cc);
}

export function resolveCanvasNodePlayableVideoEntry(_0x1f34c2) {
  if (!PLAYABLE_VIDEO_TYPES['has'](normalizeText(_0x1f34c2?.['type']))) return null;
  if (isUnavailableVideoRecord(_0x1f34c2)) return null;
  if (normalizeText(_0x1f34c2?.['type']) === 'ai-video') {
    const _0x4325ef = getMainVideoRecord(_0x1f34c2);
    if (_0x4325ef?.['record']) {
      if (isUnavailableVideoRecord(_0x4325ef['record'])) return null;
      const _0x1cda71 = resolveVideoSource(_0x4325ef['record']) || resolveVideoSource(_0x1f34c2);
      return _0x1cda71
        ? {
            nodeId: normalizeText(_0x1f34c2['id']),
            videoIndex: _0x4325ef['index'],
            source: _0x1cda71,
            node: _0x1f34c2,
            record: _0x4325ef['record'],
          }
        : null;
    }
  }
  const _0x465d71 = resolveVideoSource(_0x1f34c2);
  return _0x465d71
    ? {
        nodeId: normalizeText(_0x1f34c2['id']),
        videoIndex: 0x0,
        source: _0x465d71,
        node: _0x1f34c2,
        record: _0x1f34c2,
      }
    : null;
}

export function findCanvasVideoElementForEntry(_0x4d2ef1, _0x1d3e50) {
  const _0x2a9a09 = _0x4d2ef1 || globalThis['document'];
  if (!_0x2a9a09 || typeof _0x2a9a09['getElementById'] !== 'function') return null;
  const _0x1faf86 = _0x2a9a09['getElementById'](normalizeText(_0x1d3e50?.['nodeId']));
  if (!_0x1faf86 || typeof _0x1faf86['querySelector'] !== 'function') return null;
  const _0x45701c = Math['max'](0x0, Math['trunc'](Number(_0x1d3e50?.['videoIndex']) || 0x0));
  return (
    _0x1faf86['querySelector']('video[data-idx="' + _0x45701c + '\x22]') ||
    _0x1faf86['querySelector']('.video-player') ||
    _0x1faf86['querySelector']('video')
  );
}

function isSpaceInteraction(_0x53e5c7) {
  return _0x53e5c7?.['code'] === 'Space' || _0x53e5c7?.['key'] === '\x20' || _0x53e5c7?.['key'] === 'Space';
}

function beginSyncVideoPlaybackSession({
  targets: _0x1a583d,
  loop: loop = ![],
  documentObject: _0x49be61,
  windowObject: _0x3ce1f3,
  shouldStopOnPointerEvent: _0x3858fc,
}) {
  const _0x33d5f6 = loop === !![],
    _0x2eae9f = Object['freeze']({ kind: 'sync-video-playback', id: ++syncVideoPlaybackSessionSequence });
  let _0x14b0f6 = 'preparing',
    _0x1cf430 = ![],
    _0x112cda = _0x1a583d['filter']((_0x1e4556) => _0x1e4556['videoEl']);
  const _0x1bafeb = new Map(),
    _0x289aeb = (_0x1bbff8) => {
      const _0x440767 = _0x1bafeb['get'](_0x1bbff8) || [];
      _0x1bafeb['delete'](_0x1bbff8);
      while (_0x440767['length'] > 0x0) _0x440767['pop']()?.();
    },
    _0x22c78a = (_0x3a4785, { pause: pause = ![] } = {}) => {
      (_0x289aeb(_0x3a4785),
        releaseExternalVideoPlayback(_0x3a4785['videoEl'], _0x2eae9f),
        _0x3a4785['cleanupChrome']?.(),
        (_0x3a4785['videoEl']['loop'] = ![]));
      if (pause) safePause(_0x3a4785['videoEl']);
      _0x112cda = _0x112cda['filter']((_0x22cd76) => _0x22cd76 !== _0x3a4785);
    },
    _0x1cda29 = ({ pauseTargets: pauseTargets = !![] } = {}) => {
      if (_0x1cf430) return ![];
      ((_0x1cf430 = !![]), (_0x14b0f6 = 'stopped'));
      const _0x3b856f = activeSyncVideoPlaybackSession === _0x5acc7c;
      if (_0x3b856f) activeSyncVideoPlaybackSession = null;
      (_0x49be61?.['removeEventListener']?.('pointerdown', _0x26dab2, !![]),
        _0x3ce1f3?.['removeEventListener']?.('keydown', _0x3cb1cc, !![]));
      for (const _0x178504 of [..._0x112cda]) {
        _0x22c78a(_0x178504, { pause: pauseTargets });
      }
      if (_0x3b856f) notifySyncVideoPlaybackState();
      return !![];
    },
    _0x45d152 = (_0x38bab8, _0x3701ae, _0xaa25ca) => {
      _0x38bab8['videoEl']['addEventListener']?.(_0x3701ae, _0xaa25ca);
      const _0x5a5ea4 = _0x1bafeb['get'](_0x38bab8) || [];
      (_0x5a5ea4['push'](() => _0x38bab8['videoEl']['removeEventListener']?.(_0x3701ae, _0xaa25ca)),
        _0x1bafeb['set'](_0x38bab8, _0x5a5ea4));
    },
    _0x5acc7c = {
      owner: _0x2eae9f,
      loop: _0x33d5f6,
      isCurrent() {
        return !_0x1cf430 && activeSyncVideoPlaybackSession === _0x5acc7c;
      },
      activate(_0x51f115) {
        if (!_0x5acc7c['isCurrent']()) return ![];
        const _0x2d44f7 = new Set(_0x51f115);
        for (const _0x20431d of [..._0x112cda]) {
          if (_0x2d44f7['has'](_0x20431d)) continue;
          _0x22c78a(_0x20431d, { pause: !![] });
        }
        const _0x5e7a90 = _0x33d5f6 ? 0x2 : 0x1;
        if (_0x112cda['length'] < _0x5e7a90) return ![];
        _0x14b0f6 = 'active';
        for (const _0x570d80 of _0x112cda) {
          const _0x431fd = () => {
              if (_0x14b0f6 !== 'active' || !_0x5acc7c['isCurrent']()) return;
              if (_0x33d5f6) {
                _0x5acc7c['stop']();
                return;
              }
              _0x22c78a(_0x570d80);
              if (_0x112cda['length'] === 0x0) _0x1cda29({ pauseTargets: ![] });
            },
            _0x555e9c = _0x33d5f6 ? ['pause', 'error'] : ['pause', 'ended', 'error'];
          for (const _0x360435 of _0x555e9c) {
            _0x45d152(_0x570d80, _0x360435, _0x431fd);
          }
        }
        const _0x14159c = _0x112cda['filter'](
          (_0x28716d) =>
            _0x28716d['videoEl']?.['paused'] === !![] || _0x28716d['videoEl']?.['isConnected'] === ![],
        );
        if (_0x33d5f6 && _0x14159c['length'] > 0x0) return (_0x5acc7c['stop'](), ![]);
        for (const _0x41f9b3 of _0x14159c) _0x22c78a(_0x41f9b3);
        if (_0x112cda['length'] === 0x0) return (_0x1cda29({ pauseTargets: ![] }), ![]);
        return _0x5acc7c['isCurrent']();
      },
      stop() {
        return _0x1cda29({ pauseTargets: !![] });
      },
    },
    _0x26dab2 = (_0x4e5cdc) => {
      if (typeof _0x3858fc === 'function')
        try {
          if (_0x3858fc(_0x4e5cdc) === ![]) return;
        } catch {}
      _0x5acc7c['stop']();
    },
    _0x3cb1cc = (_0x58f252) => {
      if (isSpaceInteraction(_0x58f252)) _0x5acc7c['stop']();
    };
  activeSyncVideoPlaybackSession = _0x5acc7c;
  for (const _0x18760a of _0x112cda) {
    claimExternalVideoPlayback(_0x18760a['videoEl'], _0x2eae9f);
  }
  return (
    _0x33d5f6 &&
      (_0x49be61?.['addEventListener']?.('pointerdown', _0x26dab2, !![]),
      _0x3ce1f3?.['addEventListener']?.('keydown', _0x3cb1cc, !![])),
    notifySyncVideoPlaybackState(),
    _0x5acc7c
  );
}

export function stopActiveSyncVideoPlayback() {
  return activeSyncVideoPlaybackSession?.['stop']?.() === !![] ;
}

export function stopActiveSyncVideoLoopPlayback() {
  if (activeSyncVideoPlaybackSession?.['loop'] !== !![]) return ![];
  return stopActiveSyncVideoPlayback();
}
