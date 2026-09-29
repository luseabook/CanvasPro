import { extractStoryboardVideoFramesFromServer } from '../../api/storyboardVideoFrameApi.js';
import { waitForVideoFrame } from '../components/videoFrameCapture.js';
import { attachMediaElementPlaybackSource } from '../services/desktopMediaBlobSource.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
const THUMB_METADATA_TIMEOUT_MS = 0x1f40,
  THUMB_SEEK_TIMEOUT_MS = 0x640;
function normalizeText(_0x4f49cc) {
  return String(_0x4f49cc || '')['trim']();
}
function getVideoSource(_0x343dcf) {
  return normalizeText(
    _0x343dcf?.['getAttribute']?.('src') || _0x343dcf?.['currentSrc'] || _0x343dcf?.['src'],
  );
}
function resolveFrameUrl(_0x33bf6f) {
  return (
    normalizeText(_0x33bf6f?.['url'] || _0x33bf6f?.['localUrl']) ||
    localPathToUrl(_0x33bf6f?.['localPath'] || _0x33bf6f?.['path'])
  );
}
function setThumbState(_0x17f1e9, _0x5a8aca) {
  for (const _0x80ab57 of Array['isArray'](_0x17f1e9) ? _0x17f1e9 : []) {
    if (_0x80ab57?.['dataset']) _0x80ab57['dataset']['thumbnailState'] = _0x5a8aca;
    (_0x80ab57?.['classList']?.['add']('video-timeline-thumbnail'),
      _0x80ab57?.['setAttribute']?.('aria-busy', 'false'));
  }
}
function setThumbBackground(_0x198180, _0x54dd3a, _0x4e01f4 = '') {
  const _0x306e5e = normalizeText(_0x54dd3a);
  if (!_0x198180?.['style'] || !_0x306e5e) return ![];
  const _0x26a26e = [_0x306e5e, normalizeText(_0x4e01f4)]
    ['filter'](Boolean)
    ['filter']((_0x106f05, _0x587b9a, _0x2420e3) => _0x2420e3['indexOf'](_0x106f05) === _0x587b9a);
  return (
    (_0x198180['style']['backgroundImage'] = _0x26a26e['map'](
      (_0x538863) => 'url(' + JSON['stringify'](_0x538863) + ')',
    )['join'](',\x20')),
    !![]
  );
}
export function paintVideoTimelineThumbnailUrls(_0x19b03e, _0x3d1e4c, _0xc604e8 = 'ready') {
  const _0x25412a = Array['isArray'](_0x19b03e) ? _0x19b03e : [],
    _0x447c42 = (Array['isArray'](_0x3d1e4c) ? _0x3d1e4c : [_0x3d1e4c])
      ['map'](normalizeText)
      ['filter'](Boolean);
  if (!_0x25412a['length'] || !_0x447c42['length']) return 0x0;
  for (let _0x5b0897 = 0x0; _0x5b0897 < _0x25412a['length']; _0x5b0897 += 0x1) {
    const _0x507f05 = Math['min'](
      _0x447c42['length'] - 0x1,
      Math['floor'](((_0x5b0897 + 0.5) * _0x447c42['length']) / _0x25412a['length']),
    );
    setThumbBackground(_0x25412a[_0x5b0897], _0x447c42[_0x507f05], _0x447c42[0x0]);
  }
  return (setThumbState(_0x25412a, _0xc604e8), _0x25412a['length']);
}
function waitForLoadedMetadata(_0x2d6a73, _0x15e4b7) {
  if (Number(_0x2d6a73?.['readyState'] || 0x0) >= 0x1) return Promise['resolve'](!![]);
  return new Promise((_0x321536, _0x2f63d8) => {
    let _0xe42065 = ![],
      _0x1d87d8 = null;
    const _0x46c873 = () => {
        (_0x2d6a73['removeEventListener']?.('loadedmetadata', _0x36987b),
          _0x2d6a73['removeEventListener']?.('durationchange', _0x36987b),
          _0x2d6a73['removeEventListener']?.('error', _0xa75dde),
          _0x2d6a73['removeEventListener']?.('abort', _0xa75dde));
        if (_0x1d87d8) globalThis['clearTimeout'](_0x1d87d8);
      },
      _0x29daad = (_0x599360) => {
        if (_0xe42065) return;
        ((_0xe42065 = !![]), _0x46c873());
        if (_0x599360) _0x2f63d8(_0x599360);
        else _0x321536(!![]);
      },
      _0x36987b = () => _0x29daad(),
      _0xa75dde = () => _0x29daad(new Error('video thumbnail source failed to load'));
    (_0x2d6a73['addEventListener']?.('loadedmetadata', _0x36987b),
      _0x2d6a73['addEventListener']?.('durationchange', _0x36987b),
      _0x2d6a73['addEventListener']?.('error', _0xa75dde),
      _0x2d6a73['addEventListener']?.('abort', _0xa75dde),
      (_0x1d87d8 = globalThis['setTimeout'](
        () => _0x29daad(new Error('video thumbnail metadata timed out')),
        _0x15e4b7,
      )));
  });
}
function seekVideo(_0x5919cb, _0x3ffd34, _0x3ba5b3) {
  const _0x183ece = Math['max'](0x0, Number(_0x3ffd34) || 0x0);
  if (
    Math['abs']((Number(_0x5919cb?.['currentTime']) || 0x0) - _0x183ece) <= 0.02 &&
    Number(_0x5919cb?.['readyState'] || 0x0) >= 0x2 &&
    _0x5919cb?.['seeking'] !== !![]
  )
    return Promise['resolve'](!![]);
  return new Promise((_0x1e93bb, _0x424668) => {
    let _0x529f3b = ![],
      _0x1ecc8f = null;
    const _0x4f7935 = () => {
        (_0x5919cb['removeEventListener']?.('seeked', _0xeaaee8),
          _0x5919cb['removeEventListener']?.('timeupdate', _0xeaaee8),
          _0x5919cb['removeEventListener']?.('error', _0x322974),
          _0x5919cb['removeEventListener']?.('abort', _0x322974));
        if (_0x1ecc8f) globalThis['clearTimeout'](_0x1ecc8f);
      },
      _0x93e120 = (_0x2a95a0) => {
        if (_0x529f3b) return;
        ((_0x529f3b = !![]), _0x4f7935());
        if (_0x2a95a0) _0x424668(_0x2a95a0);
        else _0x1e93bb(!![]);
      },
      _0xeaaee8 = () => {
        if (_0x5919cb?.['seeking'] !== !![]) _0x93e120();
      },
      _0x322974 = () => _0x93e120(new Error('video\x20thumbnail\x20seek\x20failed'));
    (_0x5919cb['addEventListener']?.('seeked', _0xeaaee8),
      _0x5919cb['addEventListener']?.('timeupdate', _0xeaaee8),
      _0x5919cb['addEventListener']?.('error', _0x322974),
      _0x5919cb['addEventListener']?.('abort', _0x322974),
      (_0x1ecc8f = globalThis['setTimeout'](
        () => _0x93e120(new Error('video thumbnail seek timed out')),
        _0x3ba5b3,
      )));
    try {
      _0x5919cb['currentTime'] = _0x183ece;
    } catch (_0x1186b0) {
      _0x93e120(_0x1186b0 instanceof Error ? _0x1186b0 : new Error(String(_0x1186b0)));
    }
  });
}
export async function extractClientVideoTimelineFrameUrls({
  src: _0x18f833,
  count: _0x2a24f0,
  sampleTimes: _0x11cc19,
  isCurrent: isCurrent = () => !![],
  documentRef: documentRef = globalThis['document'],
  attachMediaSource: attachMediaSource = attachMediaElementPlaybackSource,
  waitForFrame: waitForFrame = waitForVideoFrame,
  onDuration: _0x5427b9,
} = {}) {
  const _0x4dfb07 = normalizeText(_0x18f833),
    _0x22db05 = Array['isArray'](_0x11cc19) ? _0x11cc19['filter'](Number['isFinite']) : null,
    _0xb28c1f = _0x22db05 ? _0x22db05['length'] : Math['max'](0x1, Math['trunc'](Number(_0x2a24f0) || 0x0));
  if (!_0x4dfb07 || !documentRef?.['createElement']) return [];
  const _0x2785df = documentRef['createElement']('video');
  ((_0x2785df['muted'] = !![]),
    (_0x2785df['playsInline'] = !![]),
    (_0x2785df['preload'] = 'auto'),
    (_0x2785df['crossOrigin'] = 'anonymous'),
    _0x2785df['setAttribute']?.('aria-hidden', 'true'));
  _0x2785df['style'] &&
    ((_0x2785df['style']['position'] = 'fixed'),
    (_0x2785df['style']['left'] = '-10000px'),
    (_0x2785df['style']['top'] = '-10000px'),
    (_0x2785df['style']['width'] = '1px'),
    (_0x2785df['style']['height'] = '1px'),
    (_0x2785df['style']['opacity'] = '0'),
    (_0x2785df['style']['pointerEvents'] = 'none'));
  documentRef['body']?.['appendChild']?.(_0x2785df);
  let _0x35fdf0 = null;
  try {
    await attachMediaSource(_0x2785df, _0x4dfb07, { preload: 'auto' });
    if (!getVideoSource(_0x2785df)) throw new Error('video\x20thumbnail\x20source\x20is\x20empty');
    await waitForLoadedMetadata(_0x2785df, THUMB_METADATA_TIMEOUT_MS);
    if (!isCurrent()) return [];
    const _0xdc0040 = await waitForFrame(_0x2785df, { timeoutMs: 0x1388 });
    if (!_0xdc0040) throw new Error('video thumbnail frame timed out');
    const _0x3dd582 = Number(_0x2785df['duration']);
    if (!Number['isFinite'](_0x3dd582) || _0x3dd582 <= 0x0)
      throw new Error('video thumbnail duration is unavailable');
    if (!isCurrent()) return [];
    _0x5427b9?.(_0x3dd582);
    const _0x200cb0 = Math['max'](0x1, Number(_0x2785df['videoWidth']) || 0x1),
      _0x314df0 = Math['max'](0x1, Number(_0x2785df['videoHeight']) || 0x1),
      _0x1ae759 = 0x2c,
      _0x4caa06 = Math['max'](0x1, Math['min'](0xf0, Math['round']((_0x200cb0 / _0x314df0) * _0x1ae759)));
    ((_0x35fdf0 = documentRef['createElement']('canvas')),
      (_0x35fdf0['width'] = _0x4caa06),
      (_0x35fdf0['height'] = _0x1ae759));
    const _0x235825 = _0x35fdf0['getContext']?.('2d', { willReadFrequently: ![] });
    if (!_0x235825) throw new Error('video thumbnail canvas is unavailable');
    const _0x22b422 = [];
    for (let _0x2be2c8 = 0x0; _0x2be2c8 < _0xb28c1f; _0x2be2c8 += 0x1) {
      if (!isCurrent()) return [];
      const _0x1e5e50 = Math['min'](
        Math['max'](0x0, _0x3dd582 - 0.05),
        _0x22db05 ? Math['max'](0x0, _0x22db05[_0x2be2c8]) : ((_0x2be2c8 + 0.5) / _0xb28c1f) * _0x3dd582,
      );
      await seekVideo(_0x2785df, _0x1e5e50, THUMB_SEEK_TIMEOUT_MS);
      const _0x4c979e = await waitForFrame(_0x2785df, { timeoutMs: 0x708 });
      if (!_0x4c979e) throw new Error('video thumbnail frame timed out after seek');
      (_0x235825['clearRect'](0x0, 0x0, _0x4caa06, _0x1ae759),
        _0x235825['drawImage'](_0x2785df, 0x0, 0x0, _0x4caa06, _0x1ae759));
      const _0x1b46d2 = _0x35fdf0['toDataURL']('image/jpeg', 0.72);
      if (!_0x1b46d2) throw new Error('video\x20thumbnail\x20export\x20returned\x20no\x20data');
      _0x22b422['push'](_0x1b46d2);
    }
    return _0x22b422;
  } finally {
    try {
      (_0x2785df['pause']?.(), _0x2785df['removeAttribute']?.('src'), _0x2785df['load']?.());
    } catch {}
    _0x2785df['remove']?.();
    if (_0x35fdf0) _0x35fdf0['width'] = _0x35fdf0['height'] = 0x0;
  }
}
export async function renderVideoTimelineThumbnails({
  src: _0x22ba51,
  posterUrl: _0x390199,
  thumbs: _0x26e489,
  isCurrent: isCurrent = () => !![],
  extractServerFrames: extractServerFrames = extractStoryboardVideoFramesFromServer,
  extractClientFrames: extractClientFrames = extractClientVideoTimelineFrameUrls,
  onDuration: _0x9a1344,
} = {}) {
  const _0x18ec40 = Array['isArray'](_0x26e489) ? _0x26e489 : [],
    _0x512e61 = normalizeText(_0x22ba51),
    _0x2b64d4 = normalizeText(_0x390199),
    _0x3dcea4 = [];
  if (!_0x18ec40['length']) return { source: 'empty', errors: _0x3dcea4 };
  if (!isCurrent()) return { source: 'cancelled', errors: _0x3dcea4 };
  if (_0x2b64d4) paintVideoTimelineThumbnailUrls(_0x18ec40, [_0x2b64d4], 'poster');
  else setThumbState(_0x18ec40, 'loading');
  if (!_0x512e61)
    return (
      setThumbState(_0x18ec40, _0x2b64d4 ? 'poster' : 'failed'),
      { source: _0x2b64d4 ? 'poster' : 'empty', errors: _0x3dcea4 }
    );
  for (const _0x1143f of _0x18ec40) _0x1143f?.['setAttribute']?.('aria-busy', 'true');
  try {
    const _0x42dadb = await extractServerFrames(_0x512e61, {
      maxFrames: _0x18ec40['length'],
      exactCount: !![],
    });
    if (!isCurrent()) return { source: 'cancelled', errors: _0x3dcea4 };
    const _0x3c07b5 = (Array['isArray'](_0x42dadb?.['frames']) ? _0x42dadb['frames'] : [])
      ['map'](resolveFrameUrl)
      ['filter'](Boolean);
    if (!_0x3c07b5['length']) throw new Error('server returned no video thumbnails');
    const _0x3ce842 = Number(_0x42dadb?.['duration']);
    if (Number['isFinite'](_0x3ce842) && _0x3ce842 > 0x0) _0x9a1344?.(_0x3ce842);
    return (
      paintVideoTimelineThumbnailUrls(_0x18ec40, _0x3c07b5, 'server'),
      { source: 'server', errors: _0x3dcea4 }
    );
  } catch (_0x27bf60) {
    _0x3dcea4['push'](_0x27bf60 instanceof Error ? _0x27bf60 : new Error(String(_0x27bf60)));
  }
  if (!isCurrent()) return { source: 'cancelled', errors: _0x3dcea4 };
  try {
    const _0x3bf90e = await extractClientFrames({
      src: _0x512e61,
      count: _0x18ec40['length'],
      isCurrent: isCurrent,
      onDuration: (_0x327b03) => {
        if (isCurrent()) _0x9a1344?.(_0x327b03);
      },
    });
    if (!isCurrent()) return { source: 'cancelled', errors: _0x3dcea4 };
    if (!Array['isArray'](_0x3bf90e) || !_0x3bf90e['some'](Boolean))
      throw new Error('browser\x20returned\x20no\x20video\x20thumbnails');
    return (
      paintVideoTimelineThumbnailUrls(_0x18ec40, _0x3bf90e, 'client'),
      { source: 'client', errors: _0x3dcea4 }
    );
  } catch (_0x4775cd) {
    _0x3dcea4['push'](_0x4775cd instanceof Error ? _0x4775cd : new Error(String(_0x4775cd)));
  }
  if (!isCurrent()) return { source: 'cancelled', errors: _0x3dcea4 };
  return (
    setThumbState(_0x18ec40, _0x2b64d4 ? 'poster' : 'failed'),
    { source: _0x2b64d4 ? 'poster' : 'empty', errors: _0x3dcea4 }
  );
}
