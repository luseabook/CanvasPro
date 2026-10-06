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
function syncPlaybackText(value, item = {}) {
  return t('videoSyncPlayback.' + value, item);
}
function normalizeText(key) {
  return String(key || '').trim();
}
function toNodeList(enabled) {
  if (!enabled || typeof enabled !== 'object') return [];
  return Object.values(enabled).filter((item2) => item2 && typeof item2 === 'object');
}
function compareCanvasOrder(box, box2) {
  const index = Number(box?.y) || 0,
    result = Number(box2?.y) || 0;
  if (index !== result) return index - result;
  const data = Number(box?.x) || 0,
    options = Number(box2?.x) || 0;
  if (data !== options) return data - options;
  return normalizeText(box?.id).localeCompare(normalizeText(box2?.id));
}
function normalizePlayableUrl(target) {
  const text = normalizeText(target);
  if (!text) return '';
  if (
    text.startsWith('http://') ||
    text.startsWith('https://') ||
    text.startsWith('blob:') ||
    text.startsWith('data:')
  )
    return text;
  const url = localPathToUrl(text);
  if (url) return url;
  if (text.startsWith('/')) return text;
  return '';
}
function resolveVideoSource(options2 = {}) {
  for (const source of [
    'displayLocalPath',
    'localPath',
    'originalLocalPath',
    'src',
    'videoUrl',
    'url',
    'resultUrl',
    'sourceUrl',
  ]) {
    const playableUrl = normalizePlayableUrl(options2?.[source]);
    if (playableUrl) return playableUrl;
  }
  return '';
}
function isUnavailableVideoRecord(options3 = {}) {
  return (
    !!normalizeText(options3?.error) ||
    options3?.mediaUnavailable === true ||
    options3?.videoUnavailable === true
  );
}
function getMainVideoRecord(next) {
  const record = Array.isArray(next?.videos) ? next.videos : [];
  if (record.length === 0) return null;
  const current = Number(next?.mainVideoIndex),
    index2 = Number.isFinite(current) ? Math.max(0, Math.min(record.length - 1, Math.trunc(current))) : 0;
  return { record: record[index2], index: index2 };
}
function collectVideoEntriesForNode(node) {
  if (!PLAYABLE_VIDEO_TYPES.has(normalizeText(node?.type))) return [];
  if (isUnavailableVideoRecord(node)) return [];
  if (normalizeText(node?.type) === 'ai-video') {
    const videoIndex = getMainVideoRecord(node);
    if (videoIndex?.record) {
      if (isUnavailableVideoRecord(videoIndex.record)) return [];
      const source2 = resolveVideoSource(videoIndex.record) || resolveVideoSource(node);
      return source2
        ? [
            {
              nodeId: normalizeText(node.id),
              videoIndex: videoIndex.index,
              source: source2,
              node: node,
            },
          ]
        : [];
    }
  }
  const source3 = resolveVideoSource(node);
  return source3 ? [{ nodeId: normalizeText(node.id), videoIndex: 0, source: source3, node: node }] : [];
}
function buildChildrenByParent(entry) {
  const map = new Map();
  for (const payload of toNodeList(entry)) {
    const text2 = normalizeText(payload?.parentId);
    if (!text2) continue;
    if (!map.has(text2)) map.set(text2, []);
    map.get(text2).push(payload);
  }
  for (const list of map.values()) {
    list.sort(compareCanvasOrder);
  }
  return map;
}
function pushUniqueEntry(list2, map2, args) {
  const text3 = normalizeText(args?.nodeId);
  if (!text3) return;
  const key2 = text3 + ':' + (Number(args?.videoIndex) || 0);
  if (map2.has(key2)) return;
  (map2.add(key2), list2.push({ ...args, key: key2 }));
}
function collectGroupEntriesInto({
  nodes: nodes,
  groupId: groupId,
  childrenByParent: childrenByParent,
  result: result2,
  seen: seen,
  visitedGroups: visitedGroups,
}) {
  const text4 = normalizeText(groupId);
  if (!text4 || visitedGroups.has(text4)) return;
  visitedGroups.add(text4);
  const handle = childrenByParent.get(text4) || [];
  for (const state of handle) {
    const groupId2 = normalizeText(state?.id);
    if (!groupId2) continue;
    if (normalizeText(state?.type) === GROUP_NODE_TYPE) {
      collectGroupEntriesInto({
        nodes: nodes,
        groupId: groupId2,
        childrenByParent: childrenByParent,
        result: result2,
        seen: seen,
        visitedGroups: visitedGroups,
      });
      continue;
    }
    for (const config of collectVideoEntriesForNode(nodes?.[groupId2] || state)) {
      pushUniqueEntry(result2, seen, config);
    }
  }
}
export function collectGroupSyncPlayableVideoEntries(nodes2, groupId3) {
  const enabled2 = nodes2?.[groupId3];
  if (!enabled2 || normalizeText(enabled2?.type) !== GROUP_NODE_TYPE) return [];
  const result3 = [],
    seen2 = new Set();
  return (
    collectGroupEntriesInto({
      nodes: nodes2,
      groupId: groupId3,
      childrenByParent: buildChildrenByParent(nodes2),
      result: result3,
      seen: seen2,
      visitedGroups: new Set(),
    }),
    result3
  );
}
export function collectSelectedSyncPlayableVideoEntries(nodes3, scope = []) {
  const map3 = new Set(
    (Array.isArray(scope) ? scope : []).map((item3) => normalizeText(item3)).filter(Boolean),
  );
  if (map3.size === 0) return [];
  const result4 = [],
    seen3 = new Set(),
    childrenByParent2 = buildChildrenByParent(nodes3),
    toNodeList2 = toNodeList(nodes3)
      .filter((item4) => map3.has(normalizeText(item4?.id)))
      .sort(compareCanvasOrder);
  for (const groupId4 of toNodeList2) {
    const text5 = normalizeText(groupId4?.type);
    if (text5 === GROUP_NODE_TYPE) {
      collectGroupEntriesInto({
        nodes: nodes3,
        groupId: groupId4.id,
        childrenByParent: childrenByParent2,
        result: result4,
        seen: seen3,
        visitedGroups: new Set(),
      });
      continue;
    }
    for (const input of collectVideoEntriesForNode(groupId4)) {
      pushUniqueEntry(result4, seen3, input);
    }
  }
  return result4;
}
export function getSelectedSyncPlayableVideoCount(output, value2 = []) {
  return collectSelectedSyncPlayableVideoEntries(output, value2).length;
}
function findVideoElementForEntry(value3, value4) {
  const enabled3 = value3 || globalThis.document;
  if (!enabled3 || typeof enabled3.getElementById !== 'function') return null;
  const el = enabled3.getElementById(normalizeText(value4?.nodeId));
  if (!el || typeof el.querySelector !== 'function') return null;
  const value5 = Math.max(0, Math.trunc(Number(value4?.videoIndex) || 0));
  return (
    el.querySelector('video[data-idx="' + value5 + '"]') ||
    el.querySelector('.video-player') ||
    el.querySelector('video')
  );
}
function findWrapperForEntry(value6, value7) {
  const enabled4 = value6 || globalThis.document;
  if (!enabled4 || typeof enabled4.getElementById !== 'function') return null;
  return enabled4.getElementById(normalizeText(value7?.nodeId));
}
function safePause(value8) {
  try {
    value8?.pause?.();
  } catch {}
}
function setSyncPlaybackChromeHidden(el2, enabled5) {
  el2?.classList?.toggle?.(SYNC_PLAYBACK_CLASS, !!enabled5);
}
function restoreSyncPlaybackChrome(value9) {
  setSyncPlaybackChromeHidden(value9, false);
}
function installSyncPlaybackChromeRestore(el3, enabled6) {
  if (!el3 || !enabled6) return () => {};
  let value10 = false;
  const value11 = () => {
    if (value10) return;
    value10 = true;
    for (const value12 of ['pause', 'ended', 'error']) {
      el3.removeEventListener?.(value12, value11);
    }
    restoreSyncPlaybackChrome(enabled6);
  };
  for (const value13 of ['pause', 'ended', 'error']) {
    el3.addEventListener?.(value13, value11);
  }
  return value11;
}
function pauseOutsideTargetVideos(value14, list3) {
  const el4 = value14 || globalThis.document;
  if (!el4 || typeof el4.querySelectorAll !== 'function') return;
  const map4 = new Set(list3.filter(Boolean));
  el4.querySelectorAll('video').forEach((item5) => {
    if (map4.has(item5)) return;
    safePause(item5);
  });
}
function waitForMetadata(el5, value15 = 500) {
  if (!el5 || Number(el5.readyState || 0) >= 1) return Promise.resolve(true);
  return new Promise((handler) => {
    let value16 = false;
    const run = (value17) => {
        if (value16) return;
        ((value16 = true),
          clearTimeout(setTimeout2),
          el5.removeEventListener?.('loadedmetadata', value18),
          el5.removeEventListener?.('loadeddata', value18),
          el5.removeEventListener?.('error', value19),
          handler(value17));
      },
      value18 = () => run(true),
      value19 = () => run(false),
      setTimeout2 = setTimeout(() => run(false), value15);
    (el5.addEventListener?.('loadedmetadata', value18),
      el5.addEventListener?.('loadeddata', value18),
      el5.addEventListener?.('error', value19));
  });
}
async function ensureVideoSource(enabled7, value20, handler2) {
  if (!enabled7) return false;
  const videoCurrentSource = getVideoCurrentSource(enabled7),
    text6 = normalizeText(value20);
  if (!text6) return !!videoCurrentSource;
  if (videoCurrentSource === text6 || isMediaElementPlaybackSource(enabled7, text6)) return true;
  return (
    await handler2(enabled7, text6, { preload: 'auto', warmRanges: false, load: false }),
    !!getVideoCurrentSource(enabled7)
  );
}
async function prepareVideoForSync(value21, value22, value23) {
  safePause(value21);
  const videoSource = await ensureVideoSource(value21, value22, value23);
  if (!videoSource) return false;
  await waitForMetadata(value21);
  try {
    value21.currentTime = 0;
  } catch {}
  return ((value21.loop = false), true);
}
export async function syncPlayVideoEntries({
  entries: entries = [],
  root: root = globalThis.document,
  showToast: showToast = globalThis.window?.showToast,
  playWithRecovery: playWithRecovery = playVideoWithRecovery,
  attachSource: attachSource = attachMediaElementPlaybackSource,
} = {}) {
  const total = Array.isArray(entries) ? entries : [];
  if (total.length < 2)
    return (
      showToast?.(syncPlaybackText('fewerThanTwo'), 'warn'),
      { played: 0, total: total.length, missing: 0, failed: 0 }
    );
  const list4 = total.map((entry2) => {
      const wrapper = findWrapperForEntry(root, entry2);
      return { entry: entry2, wrapper: wrapper, videoEl: findVideoElementForEntry(root, entry2) };
    }),
    value24 = list4.map((item6) => item6.videoEl).filter(Boolean);
  pauseOutsideTargetVideos(root, value24);
  let missing = 0,
    failed = 0;
  const list5 = [];
  await Promise.all(
    list4.map(async ({ entry: entry3, videoEl: videoEl, wrapper: wrapper2 }) => {
      if (!videoEl) {
        missing += 1;
        return;
      }
      const prepareVideoForSync2 = await prepareVideoForSync(videoEl, entry3.source, attachSource);
      if (!prepareVideoForSync2) {
        failed += 1;
        return;
      }
      list5.push({ entry: entry3, videoEl: videoEl, wrapper: wrapper2 });
    }),
  );
  if (list5.length < 2) {
    const value25 = missing > 0 ? syncPlaybackText('selectedUnmounted') : syncPlaybackText('fewerThanTwo');
    return (
      showToast?.(value25, 'warn'),
      { played: 0, total: total.length, missing: missing, failed: failed }
    );
  }
  const value26 = list5.map(({ videoEl: videoEl2, wrapper: wrapper3 }) => {
      return (
        setSyncPlaybackChromeHidden(wrapper3, true),
        installSyncPlaybackChromeRestore(videoEl2, wrapper3)
      );
    }),
    list6 = await Promise.all(
      list5.map(({ entry: entry4, videoEl: videoEl3 }, value27) =>
        playWithRecovery(videoEl3, {
          label: 'sync-video:' + entry4.nodeId + ':' + entry4.videoIndex,
          ensureSrc: () => ensureVideoSource(videoEl3, entry4.source, attachSource),
          allowConcurrent: true,
          shouldRecover: () => videoEl3.isConnected !== false && !videoEl3.paused,
        }).catch(() => {
          return (value26[value27]?.(), false);
        }),
      ),
    );
  list6.forEach((enabled8, value28) => {
    if (!enabled8) value26[value28]?.();
  });
  const count = list6.filter(Boolean).length;
  failed += list6.length - count;
  if (count > 0) showToast?.(syncPlaybackText('playedCount', { count: count }), 'success');
  else
    missing > 0
      ? showToast?.(syncPlaybackText('selectedUnmounted'), 'warn')
      : showToast?.(syncPlaybackText('none'), 'warn');
  return { played: count, total: total.length, missing: missing, failed: failed };
}
export function syncPlaySelectedVideos({
  selectedIds: selectedIds,
  state: state2,
  root: root = globalThis.document,
  showToast: showToast = globalThis.window?.showToast,
  ...args2
} = {}) {
  const value29 = state2?.nodes || {};
  return syncPlayVideoEntries({
    entries: collectSelectedSyncPlayableVideoEntries(value29, selectedIds),
    root: root,
    showToast: showToast,
    ...args2,
  });
}
export function syncPlayGroupVideos({
  groupId: groupId5,
  state: state3,
  root: root = globalThis.document,
  showToast: showToast = globalThis.window?.showToast,
  ...args3
} = {}) {
  const value30 = state3?.nodes || {};
  return syncPlayVideoEntries({
    entries: collectGroupSyncPlayableVideoEntries(value30, groupId5),
    root: root,
    showToast: showToast,
    ...args3,
  });
}
let activeSyncVideoPlaybackSession = null,
  syncVideoPlaybackSessionSequence = 0;

const syncVideoPlaybackStateListeners = new Set();

export function getSyncVideoPlaybackState() {
  const active = activeSyncVideoPlaybackSession?.isCurrent?.() === true;
  return { active: active, loop: active && activeSyncVideoPlaybackSession?.loop === true };
}

function notifySyncVideoPlaybackState() {
  const syncVideoPlaybackState = getSyncVideoPlaybackState();
  for (const run2 of syncVideoPlaybackStateListeners) {
    try {
      run2(syncVideoPlaybackState);
    } catch {}
  }
}

export function subscribeSyncVideoPlaybackState(handler3) {
  if (typeof handler3 !== 'function') return () => {};
  syncVideoPlaybackStateListeners.add(handler3);
  try {
    handler3(getSyncVideoPlaybackState());
  } catch {}
  return () => syncVideoPlaybackStateListeners.delete(handler3);
}

export function resolveCanvasNodePlayableVideoEntry(node2) {
  if (!PLAYABLE_VIDEO_TYPES.has(normalizeText(node2?.type))) return null;
  if (isUnavailableVideoRecord(node2)) return null;
  if (normalizeText(node2?.type) === 'ai-video') {
    const videoIndex2 = getMainVideoRecord(node2);
    if (videoIndex2?.record) {
      if (isUnavailableVideoRecord(videoIndex2.record)) return null;
      const source4 = resolveVideoSource(videoIndex2.record) || resolveVideoSource(node2);
      return source4
        ? {
            nodeId: normalizeText(node2.id),
            videoIndex: videoIndex2.index,
            source: source4,
            node: node2,
            record: videoIndex2.record,
          }
        : null;
    }
  }
  const source5 = resolveVideoSource(node2);
  return source5
    ? {
        nodeId: normalizeText(node2.id),
        videoIndex: 0,
        source: source5,
        node: node2,
        record: node2,
      }
    : null;
}

export function findCanvasVideoElementForEntry(value31, value32) {
  const enabled9 = value31 || globalThis.document;
  if (!enabled9 || typeof enabled9.getElementById !== 'function') return null;
  const el6 = enabled9.getElementById(normalizeText(value32?.nodeId));
  if (!el6 || typeof el6.querySelector !== 'function') return null;
  const value33 = Math.max(0, Math.trunc(Number(value32?.videoIndex) || 0));
  return (
    el6.querySelector('video[data-idx="' + value33 + '"]') ||
    el6.querySelector('.video-player') ||
    el6.querySelector('video')
  );
}

function isSpaceInteraction(event) {
  return event?.code === 'Space' || event?.key === ' ' || event?.key === 'Space';
}

function beginSyncVideoPlaybackSession({
  targets: targets,
  loop: loop = false,
  documentObject: documentObject,
  windowObject: windowObject,
  shouldStopOnPointerEvent: shouldStopOnPointerEvent,
}) {
  const loop2 = loop === true,
    owner = Object.freeze({ kind: 'sync-video-playback', id: ++syncVideoPlaybackSessionSequence });
  let value34 = 'preparing',
    enabled10 = false,
    list7 = targets.filter((value35) => value35.videoEl);
  const map5 = new Map(),
    handler4 = (value36) => {
      const list8 = map5.get(value36) || [];
      map5.delete(value36);
      while (list8.length > 0) list8.pop()?.();
    },
    handler5 = (value37, { pause: pause = false } = {}) => {
      (handler4(value37),
        releaseExternalVideoPlayback(value37.videoEl, owner),
        value37.cleanupChrome?.(),
        (value37.videoEl.loop = false));
      if (pause) safePause(value37.videoEl);
      list7 = list7.filter((value38) => value38 !== value37);
    },
    handler6 = ({ pauseTargets: pauseTargets = true } = {}) => {
      if (enabled10) return false;
      ((enabled10 = true), (value34 = 'stopped'));
      const value39 = activeSyncVideoPlaybackSession === enabled11;
      if (value39) activeSyncVideoPlaybackSession = null;
      (documentObject?.removeEventListener?.('pointerdown', value40, true),
        windowObject?.removeEventListener?.('keydown', value41, true));
      for (const value42 of [...list7]) {
        handler5(value42, { pause: pauseTargets });
      }
      if (value39) notifySyncVideoPlaybackState();
      return true;
    },
    handler7 = (value43, value44, value45) => {
      value43.videoEl.addEventListener?.(value44, value45);
      const list9 = map5.get(value43) || [];
      (list9.push(() => value43.videoEl.removeEventListener?.(value44, value45)),
        map5.set(value43, list9));
    },
    enabled11 = {
      owner: owner,
      loop: loop2,
      isCurrent() {
        return !enabled10 && activeSyncVideoPlaybackSession === enabled11;
      },
      activate(value46) {
        if (!enabled11.isCurrent()) return false;
        const map6 = new Set(value46);
        for (const value47 of [...list7]) {
          if (map6.has(value47)) continue;
          handler5(value47, { pause: true });
        }
        const value48 = loop2 ? 2 : 1;
        if (list7.length < value48) return false;
        value34 = 'active';
        for (const value49 of list7) {
          const value50 = () => {
              if (value34 !== 'active' || !enabled11.isCurrent()) return;
              if (loop2) {
                enabled11.stop();
                return;
              }
              handler5(value49);
              if (list7.length === 0) handler6({ pauseTargets: false });
            },
            value51 = loop2 ? ['pause', 'error'] : ['pause', 'ended', 'error'];
          for (const value52 of value51) {
            handler7(value49, value52, value50);
          }
        }
        const list10 = list7.filter(
          (value53) => value53.videoEl?.paused === true || value53.videoEl?.isConnected === false,
        );
        if (loop2 && list10.length > 0) return (enabled11.stop(), false);
        for (const value54 of list10) handler5(value54);
        if (list7.length === 0) return (handler6({ pauseTargets: false }), false);
        return enabled11.isCurrent();
      },
      stop() {
        return handler6({ pauseTargets: true });
      },
    },
    value40 = (value55) => {
      if (typeof shouldStopOnPointerEvent === 'function')
        try {
          if (shouldStopOnPointerEvent(value55) === false) return;
        } catch {}
      enabled11.stop();
    },
    value41 = (value56) => {
      if (isSpaceInteraction(value56)) enabled11.stop();
    };
  activeSyncVideoPlaybackSession = enabled11;
  for (const value57 of list7) {
    claimExternalVideoPlayback(value57.videoEl, owner);
  }
  return (
    loop2 &&
      (documentObject?.addEventListener?.('pointerdown', value40, true),
      windowObject?.addEventListener?.('keydown', value41, true)),
    notifySyncVideoPlaybackState(),
    enabled11
  );
}

export function stopActiveSyncVideoPlayback() {
  return activeSyncVideoPlaybackSession?.stop?.() === true;
}

export function stopActiveSyncVideoLoopPlayback() {
  if (activeSyncVideoPlaybackSession?.loop !== true) return false;
  return stopActiveSyncVideoPlayback();
}
