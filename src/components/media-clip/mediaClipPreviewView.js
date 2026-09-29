import { t } from '../../i18n/index.js';
import { resolveMediaClipDimensions } from './mediaClipState.js';
import { resolveMediaClipAudioUrl, resolveMediaClipImageUrl } from './mediaClipSourceResolver.js';
import { setMediaElementSource } from './mediaClipMediaElement.js';
import { normalizeText, stopPointer, toNumber } from './mediaClipUtils.js';
import { makeButton } from './mediaClipViewUtils.js';
function mediaClipText(_0x35597f, _0x93c7b1 = {}) {
  return t('mediaClip.' + _0x35597f, _0x93c7b1);
}
export function renderPreviewPanel(_0x2c85ba) {
  const _0x324234 = document['createElement']('div');
  _0x324234['className'] = 'media-clip-preview-panel';
  const _0x242b27 = _0x2c85ba['_renderPreview'](),
    _0x5d7070 = makeButton('media-clip-close', mediaClipText('preview.collapse'), '×');
  return (
    _0x5d7070['addEventListener']('click', (_0x1ebdb6) => {
      (stopPointer(_0x1ebdb6), _0x2c85ba['_setExpanded'](![]));
    }),
    _0x242b27['appendChild'](_0x5d7070),
    _0x324234['append'](_0x242b27),
    _0x2c85ba['_syncPreviewPanelLayout'](_0x324234, _0x242b27),
    _0x324234
  );
}
export function getPreviewLayoutTokens() {
  return ['is-landscape', 'is-portrait', 'is-tall-portrait'];
}
export function getPreviewVideoLayoutClasses(_0x49ea8c = {}) {
  const _0xdd45be = resolveMediaClipDimensions(_0x49ea8c),
    _0x5b7c67 = Math['max'](0x1, toNumber(_0xdd45be['width'], 0x1)),
    _0x479d2c = Math['max'](0x1, toNumber(_0xdd45be['height'], 0x1)),
    _0xe63743 = _0x5b7c67 / _0x479d2c;
  if (_0xe63743 < 0x1) return _0xe63743 <= 0.65 ? ['is-portrait', 'is-tall-portrait'] : ['is-portrait'];
  return ['is-landscape'];
}
export function syncPreviewPanelLayout(_0x281952, _0xed1bff, _0x585e28) {
  if (!_0xed1bff?.['classList'] || !_0x585e28?.['classList']) return;
  (_0x281952['_previewLayoutTokens']()['forEach']((_0x3c4ff4) => {
    _0xed1bff['classList']['remove'](_0x3c4ff4);
  }),
    _0x281952['_previewLayoutTokens']()['forEach']((_0x4c1d0a) => {
      if (_0x585e28['classList']['contains'](_0x4c1d0a)) _0xed1bff['classList']['add'](_0x4c1d0a);
    }));
  const _0x153b13 = _0x585e28['style']?.['getPropertyValue']?.('--media-clip-preview-aspect-ratio');
  _0x153b13 && _0xed1bff['style']?.['setProperty']?.('--media-clip-preview-aspect-ratio', _0x153b13);
}
export function applyPreviewVideoLayout(_0x2d9548, _0x45d746, _0x58432b = {}) {
  if (!_0x45d746?.['classList']) return;
  const _0x416311 = resolveMediaClipDimensions(_0x58432b),
    _0x267340 = Math['max'](0x1, toNumber(_0x416311['width'], 0x1)),
    _0x2cade0 = Math['max'](0x1, toNumber(_0x416311['height'], 0x1));
  (_0x2d9548['_previewLayoutTokens']()['forEach']((_0x5d65b2) => {
    _0x45d746['classList']['remove'](_0x5d65b2);
  }),
    _0x2d9548['_previewVideoLayoutClasses'](_0x58432b)['forEach']((_0x3d61e3) => {
      _0x45d746['classList']['add'](_0x3d61e3);
    }),
    _0x45d746['style']?.['setProperty']?.('--media-clip-preview-aspect-ratio', _0x267340 + ' / ' + _0x2cade0),
    _0x2d9548['_syncPreviewPanelLayout'](
      _0x45d746['closest']?.('.media-clip-preview-panel') || _0x45d746['parentElement'],
      _0x45d746,
    ));
}
export function syncPreviewVideoLayoutFromElement(_0x546d8c, _0x22589f = _0x546d8c['_videoPreview']) {
  const _0x2b0941 = toNumber(_0x22589f?.['videoWidth'], 0x0),
    _0x2b709b = toNumber(_0x22589f?.['videoHeight'], 0x0);
  if (!(_0x2b0941 > 0x0 && _0x2b709b > 0x0)) return;
  _0x546d8c['_applyPreviewVideoLayout'](_0x22589f['parentElement'], { width: _0x2b0941, height: _0x2b709b });
}
export function showPreviewImage(_0x3e67d4, _0x460a60 = {}, _0x4b0715 = '') {
  const _0x1eef32 = _0x3e67d4['_ensurePreviewImageElement'](),
    _0x2b646b = normalizeText(_0x4b0715) || resolveMediaClipImageUrl(_0x460a60);
  if (!_0x1eef32 || !_0x2b646b) return ![];
  _0x3e67d4['_previewVisualKind'] = 'image';
  try {
    _0x3e67d4['_videoPreview']?.['pause']?.();
  } catch {}
  if (_0x3e67d4['_videoPreview']) _0x3e67d4['_videoPreview']['hidden'] = !![];
  _0x1eef32['hidden'] = ![];
  if (_0x1eef32['getAttribute']?.('src') !== _0x2b646b) _0x1eef32['src'] = _0x2b646b;
  return (
    _0x3e67d4['_applyPreviewVideoLayout'](_0x1eef32['parentElement'], _0x460a60),
    _0x3e67d4['_updatePreviewControls'](),
    !![]
  );
}
export function clearPreviewVideoFallback(_0x1af2a4) {
  const _0xf62f46 =
    _0x1af2a4['_videoPreview']?.['parentElement'] ||
    _0x1af2a4['el']?.['querySelector']?.('.media-clip-preview');
  _0xf62f46?.['querySelectorAll']?.('.media-clip-video-fallback')?.['forEach']((_0x12d3dd) => {
    _0x12d3dd['remove']?.();
  });
}
export function showPreviewVideo(_0x2b86ea, _0x18474b = {}) {
  ((_0x2b86ea['_previewVisualKind'] = 'video'), _0x2b86ea['_clearPreviewVideoFallback']());
  if (_0x2b86ea['_imagePreview']) _0x2b86ea['_imagePreview']['hidden'] = !![];
  if (_0x2b86ea['_videoPreview']) _0x2b86ea['_videoPreview']['hidden'] = ![];
  _0x2b86ea['_applyPreviewVideoLayout'](_0x2b86ea['_videoPreview']?.['parentElement'], _0x18474b);
}
export function ensurePreviewVideoElement(_0x537c1a) {
  if (_0x537c1a['_videoPreview']) return _0x537c1a['_videoPreview'];
  const _0x47c425 = document['createElement']('video');
  ((_0x47c425['className'] = 'media-clip-video-preview'),
    (_0x47c425['preload'] = 'auto'),
    (_0x47c425['controls'] = ![]),
    _0x47c425['removeAttribute']('controls'),
    (_0x47c425['muted'] = !![]),
    (_0x47c425['defaultMuted'] = !![]),
    (_0x47c425['playsInline'] = !![]),
    (_0x47c425['disablePictureInPicture'] = !![]),
    _0x47c425['setAttribute']('controlsList', 'nodownload nofullscreen noremoteplayback'));
  const _0x367e32 = () => {
    (_0x537c1a['_syncPreviewVideoLayoutFromElement'](_0x47c425),
      _0x537c1a['_applyPendingVideoSourceSeek'](_0x47c425));
    if (_0x47c425['__mediaClipPendingSourceSeek'] || _0x47c425['__mediaClipWaitingSourceSeek']) return;
    if (_0x537c1a['_playing']) {
      try {
        _0x47c425['play']?.()?.['catch']?.(() => {});
      } catch {}
      return;
    }
    const _0x32ea3f = _0x537c1a['_resolveVideoPreviewSeekTarget']();
    _0x537c1a['_syncPreviewTime']('video', _0x32ea3f, { immediate: !![] });
  };
  return (
    _0x47c425['addEventListener']('loadedmetadata', _0x367e32),
    _0x47c425['addEventListener']('loadeddata', _0x367e32),
    _0x47c425['addEventListener']('canplay', _0x367e32),
    _0x47c425['addEventListener']('error', () => {
      const _0x4735f9 = _0x47c425['__mediaClipFallbackHost'],
        _0x52da49 = normalizeText(_0x47c425['__mediaClipPosterUrl']);
      _0x4735f9 &&
        _0x52da49 &&
        !_0x4735f9['querySelector']('.media-clip-video-fallback') &&
        _0x4735f9['appendChild'](_0x537c1a['_renderVideoFallback'](_0x52da49));
    }),
    (_0x537c1a['_videoPreview'] = _0x47c425),
    _0x47c425
  );
}
export function ensurePreviewImageElement(_0xeea641) {
  if (_0xeea641['_imagePreview']) return _0xeea641['_imagePreview'];
  const _0x8040e6 = document['createElement']('img');
  return (
    (_0x8040e6['className'] = 'media-clip-image-preview'),
    (_0x8040e6['alt'] = ''),
    (_0x8040e6['draggable'] = ![]),
    (_0x8040e6['hidden'] = !![]),
    _0x8040e6['addEventListener']('load', () => {
      _0xeea641['_applyPreviewVideoLayout'](_0x8040e6['parentElement'], {
        width: _0x8040e6['naturalWidth'],
        height: _0x8040e6['naturalHeight'],
      });
    }),
    (_0xeea641['_imagePreview'] = _0x8040e6),
    _0x8040e6
  );
}
export function ensurePreviewAudioElement(_0x1eeca1) {
  if (_0x1eeca1['_audioPreview']) return _0x1eeca1['_audioPreview'];
  const _0x5ee1b2 = document['createElement']('audio');
  return (
    (_0x5ee1b2['className'] = 'media-clip-audio-element'),
    (_0x5ee1b2['controls'] = ![]),
    _0x5ee1b2['removeAttribute']('controls'),
    (_0x5ee1b2['preload'] = 'metadata'),
    _0x5ee1b2['addEventListener']('loadedmetadata', () => {
      const _0x41c8f3 = _0x1eeca1['_audioSourceSecForPlayhead'](_0x1eeca1['_playheadSec'] || 0x0);
      _0x1eeca1['_syncPreviewTime']('audio', _0x41c8f3, { immediate: !![] });
    }),
    (_0x1eeca1['_audioPreview'] = _0x5ee1b2),
    _0x5ee1b2
  );
}
export function renderPreviewControls(_0x3f8822) {
  const _0x1c6848 = document['createElement']('div');
  _0x1c6848['className'] = 'media-clip-preview-controls';
  const _0x4a36ef = document['createElement']('button');
  ((_0x4a36ef['type'] = 'button'),
    (_0x4a36ef['className'] = 'media-clip-preview-play'),
    _0x4a36ef['addEventListener']('click', (_0x2cf365) => _0x3f8822['_togglePreviewPlayback'](_0x2cf365)));
  const _0x49dd9d = document['createElement']('span');
  return (
    (_0x49dd9d['className'] = 'media-clip-preview-time'),
    (_0x3f8822['_previewPlayButton'] = _0x4a36ef),
    (_0x3f8822['_previewTimeLabel'] = _0x49dd9d),
    _0x1c6848['append'](_0x4a36ef, _0x49dd9d),
    _0x3f8822['_updatePreviewControls'](),
    _0x1c6848
  );
}
export function renderPreview(_0x1449c6) {
  const _0x5e492f = document['createElement']('div');
  ((_0x5e492f['className'] = 'media-clip-preview'),
    (_0x1449c6['_previewPlayButton'] = null),
    (_0x1449c6['_previewTimeLabel'] = null));
  const _0x3a2c17 = _0x1449c6['_mediaClip']['tracks']['video'],
    _0x55c4f4 = _0x1449c6['_mediaClip']['tracks']['audio'];
  if (_0x3a2c17) {
    const _0x39fd1f = _0x1449c6['_getVideoPreviewContextAtTimelineSec'](_0x1449c6['_playheadSec'] || 0x0),
      _0x128e89 = _0x39fd1f['url'],
      _0x3ad3e9 = _0x39fd1f['posterUrl'];
    _0x1449c6['_applyPreviewVideoLayout'](_0x5e492f, _0x39fd1f['source']);
    if (!_0x128e89)
      return (
        _0x1449c6['_disposePreviewMedia']('video'),
        _0x5e492f['appendChild'](_0x1449c6['_renderVideoFallback'](_0x3ad3e9)),
        _0x5e492f
      );
    const _0x11eb0f = _0x1449c6['_ensurePreviewVideoElement'](),
      _0x1a8d81 = _0x1449c6['_ensurePreviewImageElement']();
    ((_0x11eb0f['__mediaClipFallbackHost'] = _0x5e492f), (_0x11eb0f['__mediaClipPosterUrl'] = _0x3ad3e9));
    if (_0x3ad3e9) _0x11eb0f['poster'] = _0x3ad3e9;
    else _0x11eb0f['removeAttribute']('poster');
    _0x39fd1f['clipKind'] !== 'image' &&
      (setMediaElementSource(_0x11eb0f, _0x128e89) && _0x1449c6['_resetPreviewSeekState']('video'),
      (_0x1449c6['_previewVideoSrc'] = _0x128e89));
    const _0x21198d = _0x55c4f4
        ? _0x1449c6['_getAudioClipContextAtTimelineSec'](_0x1449c6['_playheadSec'] || 0x0)
        : null,
      _0x319809 = _0x21198d?.['url'] || '';
    if (_0x55c4f4) {
      const _0x3f86bf = _0x1449c6['_ensurePreviewAudioElement']();
      (setMediaElementSource(_0x3f86bf, _0x319809) && _0x1449c6['_resetPreviewSeekState']('audio'),
        (_0x1449c6['_previewAudioSrc'] = _0x319809),
        (_0x11eb0f['muted'] = !![]),
        _0x5e492f['appendChild'](_0x3f86bf));
    } else ((_0x11eb0f['muted'] = ![]), _0x1449c6['_disposePreviewMedia']('audio'));
    (_0x5e492f['appendChild'](_0x1a8d81),
      _0x5e492f['appendChild'](_0x11eb0f),
      _0x39fd1f['clipKind'] === 'image'
        ? _0x1449c6['_showPreviewImage'](_0x39fd1f['source'], _0x128e89)
        : (_0x1449c6['_showPreviewVideo'](_0x39fd1f['source']),
          _0x1449c6['_syncPreviewTime']('video', _0x39fd1f['sourceSec'], { immediate: !![] })),
      _0x5e492f['appendChild'](_0x1449c6['_renderPreviewControls']()));
  } else {
    _0x1449c6['_disposePreviewMedia']('video');
    const _0x12969a = document['createElement']('div');
    ((_0x12969a['className'] = 'media-clip-audio-preview'),
      (_0x12969a['textContent'] = mediaClipText('preview.audioClip')));
    const _0x1a4587 = _0x1449c6['_ensurePreviewAudioElement'](),
      _0x578f51 = _0x1449c6['_getAudioClipContextAtTimelineSec'](_0x1449c6['_playheadSec'] || 0x0),
      _0x4546b1 = _0x578f51?.['url'] || resolveMediaClipAudioUrl(_0x1449c6['_sources']['audio']);
    (setMediaElementSource(_0x1a4587, _0x4546b1) && _0x1449c6['_resetPreviewSeekState']('audio'),
      (_0x1449c6['_previewAudioSrc'] = _0x4546b1),
      _0x12969a['appendChild'](_0x1a4587),
      _0x5e492f['appendChild'](_0x12969a),
      _0x55c4f4 &&
        _0x1449c6['_syncPreviewTime'](
          'audio',
          _0x1449c6['_audioSourceSecForPlayhead'](_0x1449c6['_playheadSec'] || 0x0),
          { immediate: !![] },
        ),
      _0x5e492f['appendChild'](_0x1449c6['_renderPreviewControls']()));
  }
  return _0x5e492f;
}
export function renderVideoFallback(_0x36f62e = '') {
  const _0x19ffd6 = normalizeText(_0x36f62e);
  if (_0x19ffd6) {
    const _0x1922da = document['createElement']('img');
    return (
      (_0x1922da['className'] = 'media-clip-video-fallback'),
      (_0x1922da['src'] = _0x19ffd6),
      (_0x1922da['alt'] = ''),
      (_0x1922da['draggable'] = ![]),
      _0x1922da
    );
  }
  const _0x18e1ff = document['createElement']('div');
  return ((_0x18e1ff['className'] = 'media-clip-video-fallback is-empty'), _0x18e1ff);
}
