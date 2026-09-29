import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
} from '../../services/desktopMediaBlobSource.js';
import {
  hasPresentedVideoFrame,
  resetVideoFramePresentation,
  watchVideoFramePresentation,
} from '../../services/videoFramePresentation.js';
import { claimVideoPlaybackOwnership, detachVideoPlaybackRecovery } from './mediaPlaybackRecovery.js';
import { resolveCanvasVideoUrl } from '../../services/canvasMediaLocalService.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
function normalizeSource(_0x22616f) {
  const _0x4e77b4 = String(_0x22616f || '')['trim']();
  if (!_0x4e77b4) return '';
  const _0x3cd7fb = localPathToUrl(_0x4e77b4);
  return _0x3cd7fb || _0x4e77b4;
}
function comparableSource(_0x488a1b) {
  const _0x4739cf = normalizeSource(_0x488a1b);
  if (!_0x4739cf) return '';
  try {
    return new URL(
      _0x4739cf,
      globalThis['location']?.['href'] || globalThis['window']?.['location']?.['href'],
    )['href'];
  } catch {
    return _0x4739cf;
  }
}
export function resolveSourceVideoFullscreenSources(_0x5a95c3 = {}, _0x43bfe0 = '') {
  const _0x4850de = normalizeSource(_0x43bfe0 || resolveCanvasVideoUrl(_0x5a95c3)),
    _0x440225 = comparableSource(_0x4850de),
    _0x134277 = [
      _0x5a95c3?.['originalLocalPath'],
      _0x5a95c3?.['localPath'],
      _0x5a95c3?.['videoLocalPath'],
      _0x5a95c3?.['sourceLocalPath'],
    ];
  let _0x1cdebb = '';
  for (const _0x5250e4 of _0x134277) {
    const _0x42d1be = normalizeSource(_0x5250e4);
    if (!_0x42d1be || comparableSource(_0x42d1be) === _0x440225) continue;
    _0x1cdebb = _0x42d1be;
    break;
  }
  return { previewUrl: _0x4850de, highResolutionUrl: _0x1cdebb };
}
function setPlaybackTime(_0x160f8b, _0x457823) {
  const _0x3a8cb0 = Math['max'](0x0, Number(_0x457823 || 0x0));
  try {
    const _0x3f6762 = Number(_0x160f8b?.['duration'] || 0x0);
    _0x160f8b['currentTime'] =
      Number['isFinite'](_0x3f6762) && _0x3f6762 > 0x0
        ? Math['min'](_0x3a8cb0, Math['max'](0x0, _0x3f6762 - 0.001))
        : _0x3a8cb0;
  } catch {}
}
function requestExclusivePlayback(_0x4bce9c, _0x26b0b8) {
  if (!_0x4bce9c) return ![];
  if (
    !claimVideoPlaybackOwnership(_0x4bce9c, {
      label: _0x26b0b8,
      minBufferAhead: 0.5,
      readyTimeoutMs: 0x15e,
      recoveryDebounceMs: 0x96,
      recoveryCooldownMs: 0x1f4,
      shouldRecover: () => _0x4bce9c['isConnected'] !== ![] && !_0x4bce9c['paused'],
    })
  )
    return ![];
  try {
    const _0x92d5ea = _0x4bce9c['play']?.();
    _0x92d5ea?.['catch']?.(() => {});
  } catch {}
  return !![];
}
export function openSourceVideoFullscreenPreview({
  nodeData: nodeData = {},
  previewUrl: previewUrl = '',
  previewPlaybackUrl: previewPlaybackUrl = '',
  currentTime: currentTime = 0x0,
  muted: muted = !![],
  loop: loop = ![],
  documentObject: documentObject = globalThis['document'],
  attachSource: attachSource = attachMediaElementPlaybackSource,
  watchFrame: watchFrame = watchVideoFramePresentation,
  hasPresentedFrame: hasPresentedFrame = hasPresentedVideoFrame,
  resetFrame: resetFrame = resetVideoFramePresentation,
} = {}) {
  const _0x4418d9 = resolveSourceVideoFullscreenSources(nodeData, previewUrl);
  if (!_0x4418d9['previewUrl'] || !documentObject?.['body']) return null;
  const _0x5d8565 = documentObject['createElement']('div');
  _0x5d8565['classList']['add']('source-video-fullscreen-overlay', 'is-loading');
  let _0x5b6c4c = ![];
  const _0x11ef16 = documentObject['createElement']('div');
  _0x11ef16['classList']['add']('source-video-fullscreen-stage');
  const _0x4b879e = documentObject['createElement']('video');
  (_0x4b879e['classList']['add']('source-video-fullscreen-media', 'is-active'),
    (_0x4b879e['controls'] = !![]),
    (_0x4b879e['loop'] = loop === !![]),
    (_0x4b879e['muted'] = !!muted),
    (_0x4b879e['playsInline'] = !![]),
    (_0x4b879e['preload'] = 'auto'),
    setPlaybackTime(_0x4b879e, currentTime),
    _0x4b879e['addEventListener']?.('loadedmetadata', () => {
      setPlaybackTime(_0x4b879e, currentTime);
    }));
  const _0x110454 = () => {
      if (_0x5b6c4c) return;
      _0x5d8565['classList']['remove']('is-loading', 'is-error');
    },
    _0x18ee03 = () => {
      if (_0x5b6c4c) return;
      (_0x5d8565['classList']['remove']('is-loading'), _0x5d8565['classList']['add']('is-error'));
    },
    _0x13b95e = () => _0x110454();
  let _0x51c09d = ![];
  const _0x12023a = () => {
    if (!_0x5b6c4c && !_0x51c09d && normalizeSource(previewPlaybackUrl)) {
      ((_0x51c09d = !![]),
        _0x5d8565['classList']['add']('is-loading'),
        _0x5d8565['classList']['remove']('is-error'),
        _0x3ed16e(_0x4b879e),
        void _0x6afda1('')['catch'](_0x18ee03));
      return;
    }
    _0x18ee03();
  };
  (_0x4b879e['addEventListener']?.('loadeddata', _0x13b95e),
    _0x4b879e['addEventListener']?.('canplay', _0x13b95e),
    _0x4b879e['addEventListener']?.('playing', _0x13b95e),
    _0x4b879e['addEventListener']?.('error', _0x12023a));
  let _0xc7f64e = null;
  _0x4418d9['highResolutionUrl'] &&
    ((_0xc7f64e = documentObject['createElement']('video')),
    _0xc7f64e['classList']['add']('source-video-fullscreen-media'),
    (_0xc7f64e['controls'] = ![]),
    (_0xc7f64e['loop'] = loop === !![]),
    (_0xc7f64e['muted'] = !!muted),
    (_0xc7f64e['playsInline'] = !![]),
    (_0xc7f64e['preload'] = 'auto'),
    setPlaybackTime(_0xc7f64e, currentTime),
    _0x11ef16['appendChild'](_0xc7f64e));
  (_0x11ef16['appendChild'](_0x4b879e),
    _0x5d8565['appendChild'](_0x11ef16),
    documentObject['body']['appendChild'](_0x5d8565));
  const _0x3ed16e = (_0x168e6a) => {
      if (!_0x168e6a) return;
      (clearDesktopMediaPlaybackSourceMetadata(_0x168e6a), _0x168e6a['removeAttribute']?.('src'));
      try {
        _0x168e6a['load']?.();
      } catch {}
    },
    _0x34ba67 = () => {
      if (_0x5b6c4c) return;
      _0x5b6c4c = !![];
      try {
        _0x4b879e['pause']?.();
      } catch {}
      try {
        _0xc7f64e?.['pause']?.();
      } catch {}
      (detachVideoPlaybackRecovery(_0x4b879e),
        detachVideoPlaybackRecovery(_0xc7f64e),
        resetFrame(_0xc7f64e),
        _0x4b879e['removeEventListener']?.('loadeddata', _0x13b95e),
        _0x4b879e['removeEventListener']?.('canplay', _0x13b95e),
        _0x4b879e['removeEventListener']?.('playing', _0x13b95e),
        _0x4b879e['removeEventListener']?.('error', _0x12023a),
        _0x3ed16e(_0x4b879e),
        _0x3ed16e(_0xc7f64e),
        documentObject['removeEventListener']?.('keydown', _0x197dfd, !![]),
        _0x5d8565['remove']?.());
    },
    _0x197dfd = (_0x571e79) => {
      if (_0x571e79?.['key'] !== 'Escape') return;
      (_0x571e79['preventDefault']?.(), _0x571e79['stopPropagation']?.(), _0x34ba67());
    };
  (_0x5d8565['addEventListener']('click', (_0x252cad) => {
    if (_0x252cad['target'] === _0x5d8565) _0x34ba67();
  }),
    documentObject['addEventListener']?.('keydown', _0x197dfd, !![]));
  function _0x6afda1(_0x3c8f3d = '') {
    const _0x37d629 = normalizeSource(_0x3c8f3d);
    return Promise['resolve'](
      attachSource(_0x4b879e, _0x4418d9['previewUrl'], {
        ...(_0x37d629 ? { playbackUrl: _0x37d629 } : {}),
        preload: 'auto',
        load: !![],
        shouldAssign: () => !_0x5b6c4c,
      }),
    )['then'](() => {
      if (_0x5b6c4c) return ![];
      return (
        setPlaybackTime(_0x4b879e, currentTime),
        requestExclusivePlayback(_0x4b879e, 'source-video:fullscreen:preview'),
        !![]
      );
    });
  }
  void _0x6afda1(previewPlaybackUrl)['catch'](() => {
    if (_0x5b6c4c) return;
    if (!_0x51c09d && normalizeSource(previewPlaybackUrl)) {
      ((_0x51c09d = !![]), _0x3ed16e(_0x4b879e), void _0x6afda1('')['catch'](_0x18ee03));
      return;
    }
    _0x18ee03();
  });
  if (_0xc7f64e) {
    const _0x49e12c = _0xc7f64e;
    let _0x2cb8a1 = ![];
    const _0x9005c6 = () => {
        if (_0x5b6c4c || !hasPresentedFrame(_0x49e12c, _0x4418d9['highResolutionUrl'])) return;
        const _0x2928d4 = Number(_0x4b879e['currentTime'] || 0x0),
          _0x3c007e = Number(_0x49e12c['currentTime'] || 0x0);
        if (Math['abs'](_0x2928d4 - _0x3c007e) > 0.25) {
          (resetFrame(_0x49e12c), setPlaybackTime(_0x49e12c, _0x2928d4), watchFrame(_0x49e12c, _0x9005c6));
          return;
        }
        const _0x4edaab = _0x4b879e['paused'] === ![];
        ((_0x49e12c['controls'] = !![]),
          (_0x49e12c['muted'] = _0x4b879e['muted']),
          _0x49e12c['classList']['add']('is-active'),
          _0x4b879e['classList']['remove']('is-active'));
        _0x4edaab && requestExclusivePlayback(_0x49e12c, 'source-video:fullscreen:original');
        try {
          _0x4b879e['pause']?.();
        } catch {}
      },
      _0x3fa37e = () => {
        _0x2cb8a1 = watchFrame(_0x49e12c, _0x9005c6) || _0x2cb8a1;
      };
    (_0x49e12c['addEventListener']?.('loadedmetadata', () => {
      setPlaybackTime(_0x49e12c, _0x4b879e['currentTime'] || currentTime);
    }),
      void Promise['resolve'](
        attachSource(_0x49e12c, _0x4418d9['highResolutionUrl'], {
          preload: 'auto',
          load: !![],
          onSourceAssigned: _0x3fa37e,
          shouldAssign: () => !_0x5b6c4c,
        }),
      )
        ['then'](() => {
          if (_0x5b6c4c) return;
          if (!_0x2cb8a1) _0x3fa37e();
        })
        ['catch'](() => {}));
  }
  return {
    overlay: _0x5d8565,
    stage: _0x11ef16,
    previewVideo: _0x4b879e,
    highResolutionVideo: _0xc7f64e,
    close: _0x34ba67,
    sources: _0x4418d9,
  };
}
