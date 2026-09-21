import appStore from '../core/stores/appStore.js';
import { fetchVideoFirstFrameThumbFromServer } from '../../api/videoThumbApi.js';
import { localPathToUrl, urlToLocalPath } from '../utils/localMediaPath.js';
let _token = 0,
  _scheduled = false,
  _rerunRequested = false;
const _VISIBLE_BACKFILL_GROUP_CONCURRENCY = 1,
  _BACKGROUND_BACKFILL_GROUP_CONCURRENCY = 1,
  _BACKGROUND_BACKFILL_DELAY_MS = 0x9c4,
  _BACKGROUND_BATCH_SIZE = 4,
  _BACKGROUND_BATCH_GAP_MS = 0x1c2,
  _PLAYBACK_IDLE_POLL_MS = 0x2ee,
  _PLAYBACK_IDLE_MAX_WAIT_MS = 0x2ee0;
function _resolveLocalVideoPathFromUrl(_0x3a3731) {
  return localPathToUrl(urlToLocalPath(_0x3a3731));
}
function _resolveVideoSrcPath(_0x3b2af8, _0x57cfdf) {
  const _0x2152c8 = localPathToUrl(_0x57cfdf?.localPath || _0x3b2af8?.localPath);
  if (_0x2152c8) return _0x2152c8;
  const _0x2229d2 = String(_0x57cfdf?.videoUrl || _0x3b2af8?.videoUrl || _0x3b2af8?.src || '').trim();
  return _resolveLocalVideoPathFromUrl(_0x2229d2);
}
function _videoSourceKey(_0x23267b) {
  if (!_0x23267b || typeof _0x23267b !== 'object') return '';
  return (
    String(_0x23267b.localPath || '').trim() ||
    String(_0x23267b.videoUrl || '').trim() ||
    String(_0x23267b.src || '').trim() ||
    String(_0x23267b.thumbId || '').trim()
  );
}
function _isUnavailableVideoRecord(_0x1a898c) {
  const _0x26d32c = _videoSourceKey(_0x1a898c);
  if (!_0x26d32c) return false;
  return (
    _0x1a898c?.mediaUnavailable === true &&
    String(_0x1a898c?.mediaUnavailableSource || '').trim() === _0x26d32c
  );
}
function _isAllowedSrcPath(_0x3801d7) {
  const _0x2985de = String(_0x3801d7 || '');
  return _0x2985de.startsWith('/output/') || _0x2985de.startsWith('/data/');
}
function _isNodeVisible(_0x24d759, _0x69bb8e) {
  const _0x488e8d = _0x24d759 || {},
    _0x5baf99 = _0x69bb8e || { x: 0, y: 0, zoom: 1 },
    _0x130d64 = Number(_0x5baf99.zoom) || 1,
    _0x3f9846 = (Number(_0x488e8d.x) || 0) * _0x130d64 + (Number(_0x5baf99.x) || 0),
    _0x3b3c28 = (Number(_0x488e8d.y) || 0) * _0x130d64 + (Number(_0x5baf99.y) || 0),
    _0x2f5c5f = (Number(_0x488e8d.width) || 0) * _0x130d64,
    _0x4b9524 = (Number(_0x488e8d.height) || 0) * _0x130d64,
    _0x57fc96 = 200,
    _0x434d3c = window.innerWidth,
    _0x2fd845 = window.innerHeight;
  return (
    _0x3f9846 + _0x2f5c5f > -_0x57fc96 &&
    _0x3f9846 < _0x434d3c + _0x57fc96 &&
    _0x3b3c28 + _0x4b9524 > -_0x57fc96 &&
    _0x3b3c28 < _0x2fd845 + _0x57fc96
  );
}
function _collectJobs(_0x438aae, _0x23683e) {
  const _0x504b06 = _0x438aae?.nodes || {},
    _0x31f759 = _0x438aae?.viewport || { x: 0, y: 0, zoom: 1 },
    _0x4a4acc = [];
  for (const _0x589c98 of Object.values(_0x504b06)) {
    if (!_0x589c98 || typeof _0x589c98 !== 'object') continue;
    if (_0x23683e === 'visible' && !_isNodeVisible(_0x589c98, _0x31f759)) continue;
    const _0x2404c5 = String(_0x589c98.type || '');
    if (_0x2404c5 === 'ai-video') {
      const _0x2081f7 = Array.isArray(_0x589c98.videos) ? _0x589c98.videos : [];
      if (_0x2081f7.length === 0) continue;
      const _0x582d96 = Number(_0x589c98.mainVideoIndex),
        _0x305fd8 = Number.isFinite(_0x582d96) ? Math.max(0, Math.trunc(_0x582d96)) : 0,
        _0x23f27a = [];
      if (_0x305fd8 >= 0 && _0x305fd8 < _0x2081f7.length) _0x23f27a.push(_0x305fd8);
      for (let _0x380819 = 0; _0x380819 < _0x2081f7.length; _0x380819++)
        if (_0x380819 !== _0x305fd8) _0x23f27a.push(_0x380819);
      for (const _0x475039 of _0x23f27a) {
        const _0xe2b8b = _0x2081f7[_0x475039];
        if (!_0xe2b8b || typeof _0xe2b8b !== 'object') continue;
        if (_isUnavailableVideoRecord(_0xe2b8b)) continue;
        if (String(_0xe2b8b.thumbUrl || '').trim()) continue;
        const _0x14a048 = _resolveVideoSrcPath(_0x589c98, _0xe2b8b);
        if (!_0x14a048 || !_isAllowedSrcPath(_0x14a048)) continue;
        _0x4a4acc.push({ nodeId: _0x589c98.id, idx: _0x475039, srcPath: _0x14a048, kind: 'ai-video' });
      }
      continue;
    }
    if (_0x2404c5 === 'source-video') {
      if (_isUnavailableVideoRecord(_0x589c98)) continue;
      if (String(_0x589c98.thumbUrl || '').trim()) continue;
      const _0x5e8fab = _resolveVideoSrcPath(_0x589c98, null);
      if (!_0x5e8fab || !_isAllowedSrcPath(_0x5e8fab)) continue;
      _0x4a4acc.push({ nodeId: _0x589c98.id, idx: -1, srcPath: _0x5e8fab, kind: 'source-video' });
    }
  }
  return _0x4a4acc;
}
function _groupJobsBySrcPath(_0x31579e) {
  const _0x4b761e = [],
    _0x3a3460 = new Map();
  for (const _0x176922 of _0x31579e || []) {
    const _0x4457ef = String(_0x176922?.srcPath || '').trim();
    if (!_0x4457ef) continue;
    let _0x440163 = _0x3a3460.get(_0x4457ef);
    (!_0x440163 &&
      ((_0x440163 = { srcPath: _0x4457ef, jobs: [] }),
      _0x3a3460.set(_0x4457ef, _0x440163),
      _0x4b761e.push(_0x440163)),
      _0x440163.jobs.push(_0x176922));
  }
  return _0x4b761e;
}
async function _runWithConcurrency(_0x5ec0d0, _0x5cc858, _0x4b946d) {
  const _0x1a837e = Array.isArray(_0x5ec0d0) ? _0x5ec0d0 : [],
    _0x158415 = Math.max(1, Math.trunc(Number(_0x5cc858) || 1));
  if (_0x1a837e.length === 0) return;
  let _0x83dda6 = 0;
  const _0x2446c4 = Math.min(_0x158415, _0x1a837e.length),
    _0x18779f = Array.from({ length: _0x2446c4 }, async () => {
      while (true) {
        const _0x1ede5b = _0x83dda6++;
        if (_0x1ede5b >= _0x1a837e.length) return;
        await _0x4b946d(_0x1a837e[_0x1ede5b], _0x1ede5b);
      }
    });
  await Promise.all(_0x18779f);
}
function _delay(_0x45ad74) {
  return new Promise((_0x5c59b4) => setTimeout(_0x5c59b4, Math.max(0, Number(_0x45ad74) || 0)));
}
function _hasActiveMediaPlayback() {
  const _0x16493b = typeof document !== 'undefined' ? document : null;
  if (!_0x16493b || typeof _0x16493b.querySelectorAll !== 'function') return false;
  const _0x663b45 = _0x16493b.querySelectorAll('video, audio') || [];
  for (const _0x530d8f of _0x663b45) {
    if (!_0x530d8f) continue;
    if (_0x530d8f.paused === false && _0x530d8f.ended !== true) return true;
  }
  return false;
}
async function _waitForPlaybackIdle(_0x149512) {
  let _0x5f4bb5 = 0;
  while (_0x149512 === _token && _hasActiveMediaPlayback()) {
    if (_0x5f4bb5 >= _PLAYBACK_IDLE_MAX_WAIT_MS) return false;
    (await _delay(_PLAYBACK_IDLE_POLL_MS), (_0x5f4bb5 += _PLAYBACK_IDLE_POLL_MS));
  }
  return _0x149512 === _token;
}
async function _fetchThumbUrl(_0x230b9a, _0x6eed5b, _0xfb3f43 = {}) {
  if (_0x6eed5b !== _token) return '';
  const _0x5e9486 = String(_0x230b9a || '').trim();
  if (!_0x5e9486) return '';
  let _0x5b75af = null;
  try {
    _0x5b75af = await fetchVideoFirstFrameThumbFromServer(_0x5e9486, _0xfb3f43);
  } catch {
    _0x5b75af = null;
  }
  if (_0x6eed5b !== _token) return '';
  return String(_0x5b75af?.url || '').trim();
}
async function _applyJob(_0x3fe9be, _0x2024ac, _0x5461cf, _0x25ba5d) {
  if (_0x25ba5d !== _token) return false;
  const _0x205f9c = String(_0x3fe9be?.nodeId || '');
  if (!_0x205f9c) return false;
  const _0x1d83fa = String(_0x2024ac || _0x3fe9be?.srcPath || '').trim(),
    _0x5a7700 = String(_0x5461cf || '').trim();
  if (!_0x1d83fa || !_0x5a7700) return false;
  const _0x5a9a9c = appStore.getStateRaw(),
    _0x1f12f0 = _0x5a9a9c.nodes?.[_0x205f9c];
  if (!_0x1f12f0) return false;
  if (_0x3fe9be.kind === 'source-video') {
    if (String(_0x1f12f0.thumbUrl || '').trim()) return false;
    return (appStore.updateNodeData(_0x205f9c, { videoThumbSrc: _0x1d83fa, thumbUrl: _0x5a7700 }), true);
  }
  if (_0x3fe9be.kind === 'ai-video') {
    const _0x4f3918 = Array.isArray(_0x1f12f0.videos) ? _0x1f12f0.videos : [],
      _0x5c8f70 = Number(_0x3fe9be.idx);
    if (!(_0x5c8f70 >= 0 && _0x5c8f70 < _0x4f3918.length)) return false;
    const _0x5741ec = _0x4f3918[_0x5c8f70];
    if (!_0x5741ec || typeof _0x5741ec !== 'object') return false;
    if (String(_0x5741ec.thumbUrl || '').trim()) return false;
    const _0x27273e = { ..._0x5741ec, thumbUrl: _0x5a7700 },
      _0x9cff59 = _0x4f3918.slice();
    _0x9cff59[_0x5c8f70] = _0x27273e;
    const _0x5de0fc = { videos: _0x9cff59 },
      _0x4288d5 = Number(_0x1f12f0.mainVideoIndex),
      _0x546e08 = Number.isFinite(_0x4288d5) ? Math.max(0, Math.trunc(_0x4288d5)) : 0;
    if (_0x5c8f70 === _0x546e08 && !String(_0x1f12f0.thumbUrl || '').trim()) _0x5de0fc.thumbUrl = _0x5a7700;
    return (appStore.updateNodeData(_0x205f9c, _0x5de0fc), true);
  }
  return false;
}
async function _runPass(_0x4e1966, _0x1df784) {
  if (_0x1df784 !== _token) return;
  const _0x5e687f = appStore.getStateRaw(),
    _0x49c640 = _collectJobs(_0x5e687f, _0x4e1966),
    _0xbe09b2 = _groupJobsBySrcPath(_0x49c640),
    _0x274938 =
      _0x4e1966 === 'visible' ? _VISIBLE_BACKFILL_GROUP_CONCURRENCY : _BACKGROUND_BACKFILL_GROUP_CONCURRENCY,
    _0x3e658e = _0x4e1966 === 'visible' ? _0xbe09b2.length || 1 : _BACKGROUND_BATCH_SIZE;
  for (let _0x48a069 = 0; _0x48a069 < _0xbe09b2.length; _0x48a069 += _0x3e658e) {
    if (_0x1df784 !== _token) return;
    if (_0x4e1966 !== 'visible' && !(await _waitForPlaybackIdle(_0x1df784))) return;
    const _0x202197 = _0xbe09b2.slice(_0x48a069, _0x48a069 + _0x3e658e);
    (await _runWithConcurrency(_0x202197, _0x274938, async (_0x3d43df) => {
      if (_0x1df784 !== _token) return;
      const _0x594f2f = Array.isArray(_0x3d43df.jobs) ? _0x3d43df.jobs[0] : null,
        _0x56f0c8 = await _fetchThumbUrl(_0x3d43df.srcPath, _0x1df784, {
          nodeId: String(_0x594f2f?.nodeId || ''),
          assetId: String(_0x594f2f?.idx ?? ''),
        });
      if (_0x1df784 !== _token || !_0x56f0c8) return;
      for (const _0x4eb589 of _0x3d43df.jobs) {
        if (_0x1df784 !== _token) return;
        await _applyJob(_0x4eb589, _0x3d43df.srcPath, _0x56f0c8, _0x1df784);
      }
      await _delay(0);
    }),
      _0x4e1966 !== 'visible' &&
        _0x48a069 + _0x3e658e < _0xbe09b2.length &&
        (await _delay(_BACKGROUND_BATCH_GAP_MS)));
  }
}
export function startVideoThumbBackfill() {
  _token++;
  const _0x1319a1 = _token;
  if (_scheduled) {
    _rerunRequested = true;
    return;
  }
  ((_scheduled = true),
    setTimeout(async () => {
      try {
        await _runPass('visible', _0x1319a1);
        if (_0x1319a1 !== _token) return;
        await _delay(_BACKGROUND_BACKFILL_DELAY_MS);
        if (_0x1319a1 !== _token) return;
        await _runPass('all', _0x1319a1);
      } finally {
        ((_scheduled = false), _rerunRequested && ((_rerunRequested = false), startVideoThumbBackfill()));
      }
    }, 60));
}
export function __groupBackfillJobsBySrcPathForTest(_0xdd7879) {
  return _groupJobsBySrcPath(_0xdd7879);
}
export async function __runWithConcurrencyForTest(_0x327bdd, _0x36f8ef, _0x50b014) {
  return _runWithConcurrency(_0x327bdd, _0x36f8ef, _0x50b014);
}
export function __hasActiveMediaPlaybackForTest() {
  return _hasActiveMediaPlayback();
}
