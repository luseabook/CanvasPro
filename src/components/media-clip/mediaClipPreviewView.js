import { t } from '../../i18n/index.js';
import { resolveMediaClipDimensions } from './mediaClipState.js';
import { resolveMediaClipAudioUrl, resolveMediaClipImageUrl } from './mediaClipSourceResolver.js';
import { setMediaElementSource } from './mediaClipMediaElement.js';
import { normalizeText, stopPointer, toNumber } from './mediaClipUtils.js';
import { makeButton } from './mediaClipViewUtils.js';
function mediaClipText(value, item = {}) {
  return t('mediaClip.' + value, item);
}
export function renderPreviewPanel(key) {
  const index = document.createElement('div');
  index.className = 'media-clip-preview-panel';
  const el = key._renderPreview(),
    el2 = makeButton('media-clip-close', mediaClipText('preview.collapse'), '×');
  return (
    el2.addEventListener('click', (result) => {
      (stopPointer(result), key._setExpanded(false));
    }),
    el.appendChild(el2),
    index.append(el),
    key._syncPreviewPanelLayout(index, el),
    index
  );
}
export function getPreviewLayoutTokens() {
  return ['is-landscape', 'is-portrait', 'is-tall-portrait'];
}
export function getPreviewVideoLayoutClasses(options = {}) {
  const box = resolveMediaClipDimensions(options),
    data = Math.max(1, toNumber(box.width, 1)),
    target = Math.max(1, toNumber(box.height, 1)),
    count = data / target;
  if (count < 1) return count <= 0.65 ? ['is-portrait', 'is-tall-portrait'] : ['is-portrait'];
  return ['is-landscape'];
}
export function syncPreviewPanelLayout(source, el3, el4) {
  if (!el3?.classList || !el4?.classList) return;
  (source._previewLayoutTokens().forEach((next) => {
    el3.classList.remove(next);
  }),
    source._previewLayoutTokens().forEach((current) => {
      if (el4.classList.contains(current)) el3.classList.add(current);
    }));
  const entry = el4.style?.getPropertyValue?.('--media-clip-preview-aspect-ratio');
  entry && el3.style?.setProperty?.('--media-clip-preview-aspect-ratio', entry);
}
export function applyPreviewVideoLayout(record, el5, payload = {}) {
  if (!el5?.classList) return;
  const box2 = resolveMediaClipDimensions(payload),
    handle = Math.max(1, toNumber(box2.width, 1)),
    state = Math.max(1, toNumber(box2.height, 1));
  (record._previewLayoutTokens().forEach((config) => {
    el5.classList.remove(config);
  }),
    record._previewVideoLayoutClasses(payload).forEach((scope) => {
      el5.classList.add(scope);
    }),
    el5.style?.setProperty?.('--media-clip-preview-aspect-ratio', handle + ' / ' + state),
    record._syncPreviewPanelLayout(
      el5.closest?.('.media-clip-preview-panel') || el5.parentElement,
      el5,
    ));
}
export function syncPreviewVideoLayoutFromElement(input, output = input._videoPreview) {
  const width = toNumber(output?.videoWidth, 0),
    height = toNumber(output?.videoHeight, 0);
  if (!(width > 0 && height > 0)) return;
  input._applyPreviewVideoLayout(output.parentElement, { width: width, height: height });
}
export function showPreviewImage(value2, value3 = {}, value4 = '') {
  const el6 = value2._ensurePreviewImageElement(),
    text = normalizeText(value4) || resolveMediaClipImageUrl(value3);
  if (!el6 || !text) return false;
  value2._previewVisualKind = 'image';
  try {
    value2._videoPreview?.pause?.();
  } catch {}
  if (value2._videoPreview) value2._videoPreview.hidden = true;
  el6.hidden = false;
  if (el6.getAttribute?.('src') !== text) el6.src = text;
  return (
    value2._applyPreviewVideoLayout(el6.parentElement, value3),
    value2._updatePreviewControls(),
    true
  );
}
export function clearPreviewVideoFallback(value5) {
  const el7 =
    value5._videoPreview?.parentElement || value5.el?.querySelector?.('.media-clip-preview');
  el7?.querySelectorAll?.('.media-clip-video-fallback')?.forEach((el8) => {
    el8.remove?.();
  });
}
export function showPreviewVideo(value6, value7 = {}) {
  ((value6._previewVisualKind = 'video'), value6._clearPreviewVideoFallback());
  if (value6._imagePreview) value6._imagePreview.hidden = true;
  if (value6._videoPreview) value6._videoPreview.hidden = false;
  value6._applyPreviewVideoLayout(value6._videoPreview?.parentElement, value7);
}
export function ensurePreviewVideoElement(value8) {
  if (value8._videoPreview) return value8._videoPreview;
  const el9 = document.createElement('video');
  ((el9.className = 'media-clip-video-preview'),
    (el9.preload = 'auto'),
    (el9.controls = false),
    el9.removeAttribute('controls'),
    (el9.muted = true),
    (el9.defaultMuted = true),
    (el9.playsInline = true),
    (el9.disablePictureInPicture = true),
    el9.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback'));
  const value9 = () => {
    (value8._syncPreviewVideoLayoutFromElement(el9), value8._applyPendingVideoSourceSeek(el9));
    if (el9.__mediaClipPendingSourceSeek || el9.__mediaClipWaitingSourceSeek) return;
    if (value8._playing) {
      try {
        el9.play?.()?.catch?.(() => {});
      } catch {}
      return;
    }
    const value10 = value8._resolveVideoPreviewSeekTarget();
    value8._syncPreviewTime('video', value10, { immediate: true });
  };
  return (
    el9.addEventListener('loadedmetadata', value9),
    el9.addEventListener('loadeddata', value9),
    el9.addEventListener('canplay', value9),
    el9.addEventListener('error', () => {
      const el10 = el9.__mediaClipFallbackHost,
        text2 = normalizeText(el9.__mediaClipPosterUrl);
      el10 &&
        text2 &&
        !el10.querySelector('.media-clip-video-fallback') &&
        el10.appendChild(value8._renderVideoFallback(text2));
    }),
    (value8._videoPreview = el9),
    el9
  );
}
export function ensurePreviewImageElement(value11) {
  if (value11._imagePreview) return value11._imagePreview;
  const width2 = document.createElement('img');
  return (
    (width2.className = 'media-clip-image-preview'),
    (width2.alt = ''),
    (width2.draggable = false),
    (width2.hidden = true),
    width2.addEventListener('load', () => {
      value11._applyPreviewVideoLayout(width2.parentElement, {
        width: width2.naturalWidth,
        height: width2.naturalHeight,
      });
    }),
    (value11._imagePreview = width2),
    width2
  );
}
export function ensurePreviewAudioElement(value12) {
  if (value12._audioPreview) return value12._audioPreview;
  const el11 = document.createElement('audio');
  return (
    (el11.className = 'media-clip-audio-element'),
    (el11.controls = false),
    el11.removeAttribute('controls'),
    (el11.preload = 'metadata'),
    el11.addEventListener('loadedmetadata', () => {
      const value13 = value12._audioSourceSecForPlayhead(value12._playheadSec || 0);
      value12._syncPreviewTime('audio', value13, { immediate: true });
    }),
    (value12._audioPreview = el11),
    el11
  );
}
export function renderPreviewControls(value14) {
  const value15 = document.createElement('div');
  value15.className = 'media-clip-preview-controls';
  const el12 = document.createElement('button');
  ((el12.type = 'button'),
    (el12.className = 'media-clip-preview-play'),
    el12.addEventListener('click', (value16) => value14._togglePreviewPlayback(value16)));
  const value17 = document.createElement('span');
  return (
    (value17.className = 'media-clip-preview-time'),
    (value14._previewPlayButton = el12),
    (value14._previewTimeLabel = value17),
    value15.append(el12, value17),
    value14._updatePreviewControls(),
    value15
  );
}
export function renderPreview(value18) {
  const el13 = document.createElement('div');
  ((el13.className = 'media-clip-preview'),
    (value18._previewPlayButton = null),
    (value18._previewTimeLabel = null));
  const value19 = value18._mediaClip.tracks.video,
    value20 = value18._mediaClip.tracks.audio;
  if (value19) {
    const response = value18._getVideoPreviewContextAtTimelineSec(value18._playheadSec || 0),
      enabled = response.url,
      value21 = response.posterUrl;
    value18._applyPreviewVideoLayout(el13, response.source);
    if (!enabled)
      return (
        value18._disposePreviewMedia('video'),
        el13.appendChild(value18._renderVideoFallback(value21)),
        el13
      );
    const value22 = value18._ensurePreviewVideoElement(),
      value23 = value18._ensurePreviewImageElement();
    ((value22.__mediaClipFallbackHost = el13), (value22.__mediaClipPosterUrl = value21));
    if (value21) value22.poster = value21;
    else value22.removeAttribute('poster');
    response.clipKind !== 'image' &&
      (setMediaElementSource(value22, enabled) && value18._resetPreviewSeekState('video'),
      (value18._previewVideoSrc = enabled));
    const response2 = value20
        ? value18._getAudioClipContextAtTimelineSec(value18._playheadSec || 0)
        : null,
      value24 = response2?.url || '';
    if (value20) {
      const value25 = value18._ensurePreviewAudioElement();
      (setMediaElementSource(value25, value24) && value18._resetPreviewSeekState('audio'),
        (value18._previewAudioSrc = value24),
        (value22.muted = true),
        el13.appendChild(value25));
    } else ((value22.muted = false), value18._disposePreviewMedia('audio'));
    (el13.appendChild(value23),
      el13.appendChild(value22),
      response.clipKind === 'image'
        ? value18._showPreviewImage(response.source, enabled)
        : (value18._showPreviewVideo(response.source),
          value18._syncPreviewTime('video', response.sourceSec, { immediate: true })),
      el13.appendChild(value18._renderPreviewControls()));
  } else {
    value18._disposePreviewMedia('video');
    const el14 = document.createElement('div');
    ((el14.className = 'media-clip-audio-preview'),
      (el14.textContent = mediaClipText('preview.audioClip')));
    const value26 = value18._ensurePreviewAudioElement(),
      response3 = value18._getAudioClipContextAtTimelineSec(value18._playheadSec || 0),
      value27 = response3?.url || resolveMediaClipAudioUrl(value18._sources.audio);
    (setMediaElementSource(value26, value27) && value18._resetPreviewSeekState('audio'),
      (value18._previewAudioSrc = value27),
      el14.appendChild(value26),
      el13.appendChild(el14),
      value20 &&
        value18._syncPreviewTime(
          'audio',
          value18._audioSourceSecForPlayhead(value18._playheadSec || 0),
          { immediate: true },
        ),
      el13.appendChild(value18._renderPreviewControls()));
  }
  return el13;
}
export function renderVideoFallback(value28 = '') {
  const text3 = normalizeText(value28);
  if (text3) {
    const value29 = document.createElement('img');
    return (
      (value29.className = 'media-clip-video-fallback'),
      (value29.src = text3),
      (value29.alt = ''),
      (value29.draggable = false),
      value29
    );
  }
  const value30 = document.createElement('div');
  return ((value30.className = 'media-clip-video-fallback is-empty'), value30);
}
