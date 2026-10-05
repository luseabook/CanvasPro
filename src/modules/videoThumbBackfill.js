import appStore from '../core/stores/appStore.js';
import { fetchVideoFirstFrameThumbFromServer } from '../../api/videoThumbApi.js';
import { localPathToUrl, urlToLocalPath } from '../utils/localMediaPath.js';
let _token = 0,
  _scheduled = false,
  _rerunRequested = false;
const _VISIBLE_BACKFILL_GROUP_CONCURRENCY = 1,
  _BACKGROUND_BACKFILL_GROUP_CONCURRENCY = 1,
  _BACKGROUND_BACKFILL_DELAY_MS = 2500,
  _BACKGROUND_BATCH_SIZE = 4,
  _BACKGROUND_BATCH_GAP_MS = 450,
  _PLAYBACK_IDLE_POLL_MS = 750,
  _PLAYBACK_IDLE_MAX_WAIT_MS = 12000;
function _resolveLocalVideoPathFromUrl(value) {
  return localPathToUrl(urlToLocalPath(value));
}
function _resolveVideoSrcPath(item, key) {
  const url = localPathToUrl(key?.localPath || item?.localPath);
  if (url) return url;
  const index = String(key?.videoUrl || item?.videoUrl || item?.src || '').trim();
  return _resolveLocalVideoPathFromUrl(index);
}
function _videoSourceKey(enabled) {
  if (!enabled || typeof enabled !== 'object') return '';
  return (
    String(enabled.localPath || '').trim() ||
    String(enabled.videoUrl || '').trim() ||
    String(enabled.src || '').trim() ||
    String(enabled.thumbId || '').trim()
  );
}
function _isUnavailableVideoRecord(result) {
  const _videoSourceKey2 = _videoSourceKey(result);
  if (!_videoSourceKey2) return false;
  return (
    result?.mediaUnavailable === true &&
    String(result?.mediaUnavailableSource || '').trim() === _videoSourceKey2
  );
}
function _isAllowedSrcPath(data) {
  const options = String(data || '');
  return options.startsWith('/output/') || options.startsWith('/data/');
}
function _isNodeVisible(target, source) {
  const box = target || {},
    box2 = source || { x: 0, y: 0, zoom: 1 },
    next = Number(box2.zoom) || 1,
    current = (Number(box.x) || 0) * next + (Number(box2.x) || 0),
    entry = (Number(box.y) || 0) * next + (Number(box2.y) || 0),
    record = (Number(box.width) || 0) * next,
    payload = (Number(box.height) || 0) * next,
    handle = 200,
    state = window.innerWidth,
    config = window.innerHeight;
  return (
    current + record > -handle &&
    current < state + handle &&
    entry + payload > -handle &&
    entry < config + handle
  );
}
function _collectJobs(scope, input) {
  const output = scope?.nodes || {},
    value2 = scope?.viewport || { x: 0, y: 0, zoom: 1 },
    list = [];
  for (const nodeId of Object.values(output)) {
    if (!nodeId || typeof nodeId !== 'object') continue;
    if (input === 'visible' && !_isNodeVisible(nodeId, value2)) continue;
    const value3 = String(nodeId.type || '');
    if (value3 === 'ai-video') {
      const list2 = Array.isArray(nodeId.videos) ? nodeId.videos : [];
      if (list2.length === 0) continue;
      const value4 = Number(nodeId.mainVideoIndex),
        count = Number.isFinite(value4) ? Math.max(0, Math.trunc(value4)) : 0,
        list3 = [];
      if (count >= 0 && count < list2.length) list3.push(count);
      for (let value5 = 0; value5 < list2.length; value5++) if (value5 !== count) list3.push(value5);
      for (const idx of list3) {
        const enabled2 = list2[idx];
        if (!enabled2 || typeof enabled2 !== 'object') continue;
        if (_isUnavailableVideoRecord(enabled2)) continue;
        if (String(enabled2.thumbUrl || '').trim()) continue;
        const srcPath = _resolveVideoSrcPath(nodeId, enabled2);
        if (!srcPath || !_isAllowedSrcPath(srcPath)) continue;
        list.push({ nodeId: nodeId.id, idx: idx, srcPath: srcPath, kind: 'ai-video' });
      }
      continue;
    }
    if (value3 === 'source-video') {
      if (_isUnavailableVideoRecord(nodeId)) continue;
      if (String(nodeId.thumbUrl || '').trim()) continue;
      const srcPath2 = _resolveVideoSrcPath(nodeId, null);
      if (!srcPath2 || !_isAllowedSrcPath(srcPath2)) continue;
      list.push({ nodeId: nodeId.id, idx: -1, srcPath: srcPath2, kind: 'source-video' });
    }
  }
  return list;
}
function _groupJobsBySrcPath(value6) {
  const list4 = [],
    map = new Map();
  for (const value7 of value6 || []) {
    const srcPath3 = String(value7?.srcPath || '').trim();
    if (!srcPath3) continue;
    let enabled3 = map.get(srcPath3);
    (!enabled3 &&
      ((enabled3 = { srcPath: srcPath3, jobs: [] }), map.set(srcPath3, enabled3), list4.push(enabled3)),
      enabled3.jobs.push(value7));
  }
  return list4;
}
async function _runWithConcurrency(value8, value9, handler) {
  const list5 = Array.isArray(value8) ? value8 : [],
    value10 = Math.max(1, Math.trunc(Number(value9) || 1));
  if (list5.length === 0) return;
  let value11 = 0;
  const length = Math.min(value10, list5.length),
    value12 = Array.from({ length: length }, async () => {
      while (true) {
        const value13 = value11++;
        if (value13 >= list5.length) return;
        await handler(list5[value13], value13);
      }
    });
  await Promise.all(value12);
}
function _delay(value14) {
  return new Promise((value15) => setTimeout(value15, Math.max(0, Number(value14) || 0)));
}
function _hasActiveMediaPlayback() {
  const el = typeof document !== 'undefined' ? document : null;
  if (!el || typeof el.querySelectorAll !== 'function') return false;
  const value16 = el.querySelectorAll('video, audio') || [];
  for (const enabled4 of value16) {
    if (!enabled4) continue;
    if (enabled4.paused === false && enabled4.ended !== true) return true;
  }
  return false;
}
async function _waitForPlaybackIdle(value17) {
  let value18 = 0;
  while (value17 === _token && _hasActiveMediaPlayback()) {
    if (value18 >= _PLAYBACK_IDLE_MAX_WAIT_MS) return false;
    (await _delay(_PLAYBACK_IDLE_POLL_MS), (value18 += _PLAYBACK_IDLE_POLL_MS));
  }
  return value17 === _token;
}
async function _fetchThumbUrl(value19, value20, value21 = {}) {
  if (value20 !== _token) return '';
  const enabled5 = String(value19 || '').trim();
  if (!enabled5) return '';
  let response = null;
  try {
    response = await fetchVideoFirstFrameThumbFromServer(enabled5, value21);
  } catch {
    response = null;
  }
  if (value20 !== _token) return '';
  return String(response?.url || '').trim();
}
async function _applyJob(value22, value23, value24, value25) {
  if (value25 !== _token) return false;
  const enabled6 = String(value22?.nodeId || '');
  if (!enabled6) return false;
  const videoThumbSrc = String(value23 || value22?.srcPath || '').trim(),
    thumbUrl = String(value24 || '').trim();
  if (!videoThumbSrc || !thumbUrl) return false;
  const value26 = appStore.getStateRaw(),
    enabled7 = value26.nodes?.[enabled6];
  if (!enabled7) return false;
  if (value22.kind === 'source-video') {
    if (String(enabled7.thumbUrl || '').trim()) return false;
    return (appStore.updateNodeData(enabled6, { videoThumbSrc: videoThumbSrc, thumbUrl: thumbUrl }), true);
  }
  if (value22.kind === 'ai-video') {
    const list6 = Array.isArray(enabled7.videos) ? enabled7.videos : [],
      count2 = Number(value22.idx);
    if (!(count2 >= 0 && count2 < list6.length)) return false;
    const args = list6[count2];
    if (!args || typeof args !== 'object') return false;
    if (String(args.thumbUrl || '').trim()) return false;
    const value27 = { ...args, thumbUrl: thumbUrl },
      videos = list6.slice();
    videos[count2] = value27;
    const value28 = { videos: videos },
      value29 = Number(enabled7.mainVideoIndex),
      value30 = Number.isFinite(value29) ? Math.max(0, Math.trunc(value29)) : 0;
    if (count2 === value30 && !String(enabled7.thumbUrl || '').trim()) value28.thumbUrl = thumbUrl;
    return (appStore.updateNodeData(enabled6, value28), true);
  }
  return false;
}
async function _runPass(value31, value32) {
  if (value32 !== _token) return;
  const value33 = appStore.getStateRaw(),
    _collectJobs2 = _collectJobs(value33, value31),
    list7 = _groupJobsBySrcPath(_collectJobs2),
    value34 =
      value31 === 'visible' ? _VISIBLE_BACKFILL_GROUP_CONCURRENCY : _BACKGROUND_BACKFILL_GROUP_CONCURRENCY,
    value35 = value31 === 'visible' ? list7.length || 1 : _BACKGROUND_BATCH_SIZE;
  for (let value36 = 0; value36 < list7.length; value36 += value35) {
    if (value32 !== _token) return;
    if (value31 !== 'visible' && !(await _waitForPlaybackIdle(value32))) return;
    const value37 = list7.slice(value36, value36 + value35);
    (await _runWithConcurrency(value37, value34, async (value38) => {
      if (value32 !== _token) return;
      const value39 = Array.isArray(value38.jobs) ? value38.jobs[0] : null,
        _fetchThumbUrl2 = await _fetchThumbUrl(value38.srcPath, value32, {
          nodeId: String(value39?.nodeId || ''),
          assetId: String(value39?.idx ?? ''),
        });
      if (value32 !== _token || !_fetchThumbUrl2) return;
      for (const value40 of value38.jobs) {
        if (value32 !== _token) return;
        await _applyJob(value40, value38.srcPath, _fetchThumbUrl2, value32);
      }
      await _delay(0);
    }),
      value31 !== 'visible' && value36 + value35 < list7.length && (await _delay(_BACKGROUND_BATCH_GAP_MS)));
  }
}
export function startVideoThumbBackfill() {
  _token++;
  const value41 = _token;
  if (_scheduled) {
    _rerunRequested = true;
    return;
  }
  ((_scheduled = true),
    setTimeout(async () => {
      try {
        await _runPass('visible', value41);
        if (value41 !== _token) return;
        await _delay(_BACKGROUND_BACKFILL_DELAY_MS);
        if (value41 !== _token) return;
        await _runPass('all', value41);
      } finally {
        ((_scheduled = false), _rerunRequested && ((_rerunRequested = false), startVideoThumbBackfill()));
      }
    }, 60));
}
export function __groupBackfillJobsBySrcPathForTest(value42) {
  return _groupJobsBySrcPath(value42);
}
export async function __runWithConcurrencyForTest(value43, value44, value45) {
  return _runWithConcurrency(value43, value44, value45);
}
export function __hasActiveMediaPlaybackForTest() {
  return _hasActiveMediaPlayback();
}
