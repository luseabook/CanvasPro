import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
} from '../../services/desktopMediaBlobSource.js';
import { createAudioPlaybackProgressController } from '../../utils/audioPlaybackProgress.js';
import {
  getWaveformBarsPathFromPersistedUrl,
  getWaveformBarsPathFromUrl,
} from '../../utils/audioWaveform.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function escapeHtml(item) {
  return String(item ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('\'', '&#39;');
}
function normalizeClassName(key) {
  return normalizeText(key)
    ['split'](/\s+/)
    ['filter']((index) => /^[a-zA-Z0-9_-]+$/['test'](index))
    ['join'](' ');
}
function normalizeWaveformUrl(result) {
  const text = normalizeText(result);
  return localPathToUrl(text) || text;
}
function renderDataAttributes(options = {}) {
  return Object['entries'](options)
    ['filter'](([data]) => /^data-[a-z0-9_.:-]+$/['test'](data))
    ['map'](([target, source]) =>
      source === false || source === null || source === undefined
        ? ''
        : source === ''
          ? target
          : target + '="' + escapeHtml(source) + '"',
    )
    ['filter'](Boolean)
    ['join'](' ');
}
function renderWaveform(enabled = false) {
  return (
    '<div class="waveform ' +
    (enabled ? 'waveform-unplayed' : 'waveform-bg') +
    '"' +
    (enabled ? ' data-audio-playback-wave-progress' : '') +
    '>\n    <svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">\n      <path d="" data-audio-playback-wave-path stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n      <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n    </svg>\n  </div>'
  );
}
export function renderAudioPlaybackSurface({
  audioUrl: audioUrl = '',
  waveformUrl: waveformUrl = '',
  className: className = '',
  playLabel: playLabel = '播放音频',
  pauseLabel: pauseLabel = '暂停音频',
  disabled: disabled = false,
  ariaBusy: ariaBusy = false,
  dataAttributes: dataAttributes = {},
  trailingHtml: trailingHtml = '',
} = {}) {
  const text2 = normalizeText(audioUrl),
    waveformUrl2 = normalizeWaveformUrl(waveformUrl),
    className2 = normalizeClassName(className),
    renderDataAttributes2 = renderDataAttributes(dataAttributes);
  return (
    '<div class="audio-card audio-playback-surface' +
    (className2 ? ' ' + className2 : '') +
    '" data-audio-playback-surface data-audio-playback-play-label="' +
    escapeHtml(playLabel) +
    '" data-audio-playback-pause-label="' +
    escapeHtml(pauseLabel) +
    '"' +
    (waveformUrl2 ? ' data-audio-playback-waveform-url="' + escapeHtml(waveformUrl2) + '"' : '') +
    ' aria-busy="' +
    Boolean(ariaBusy) +
    '"' +
    (renderDataAttributes2 ? ' ' + renderDataAttributes2 : '') +
    '>\n    ' +
    renderWaveform(false) +
    '\n    ' +
    renderWaveform(true) +
    '\n    <div class="media-progress-line" data-audio-playback-progress-line></div>\n    <div class="media-progress-bar" data-audio-playback-progress-bar></div>\n    <div class="audio-controls">\n      <button type="button" class="audio-play-btn" data-audio-playback-toggle aria-label="' +
    escapeHtml(playLabel) +
    '" ' +
    (disabled || !text2 ? 'disabled' : '') +
    '>\n        <svg class="audio-playback-play-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n        <svg class="audio-playback-pause-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>\n      </button>\n      <div class="audio-time-wrap"><span class="audio-time-display" data-audio-playback-time>0:00 / 0:00</span></div>\n    </div>\n    <audio class="audio-player" preload="metadata" data-audio-playback-audio data-audio-playback-url="' +
    escapeHtml(text2) +
    '"></audio>\n    ' +
    String(trailingHtml || '') +
    '\n  </div>'
  );
}
export function createAudioPlaybackSurfaceController(
  wavePlayedEl,
  {
    audioUrl: audioUrl = '',
    waveformUrl: waveformUrl = '',
    preload: preload = 'metadata',
    onBeforePlay: onBeforePlay = () => {},
    onError: onError = () => {},
  } = {},
) {
  const audioEl = wavePlayedEl?.['querySelector']?.('[data-audio-playback-audio]'),
    el = wavePlayedEl?.['querySelector']?.('[data-audio-playback-toggle]'),
    trackEl = wavePlayedEl?.['querySelector']?.('[data-audio-playback-progress-bar]');
  if (!audioEl || !el || !trackEl) return null;
  const text3 = normalizeText(audioUrl || audioEl['dataset']?.['audioPlaybackUrl']),
    waveformUrl3 = normalizeWaveformUrl(waveformUrl || wavePlayedEl['dataset']?.['audioPlaybackWaveformUrl']),
    text4 = normalizeText(wavePlayedEl['dataset']?.['audioPlaybackPlayLabel']) || '播放音频',
    text5 = normalizeText(wavePlayedEl['dataset']?.['audioPlaybackPauseLabel']) || '暂停音频';
  let enabled2 = false,
    next = null;
  const audioPlaybackProgressController = createAudioPlaybackProgressController({
      audioEl: audioEl,
      wavePlayedEl: wavePlayedEl['querySelector']?.('[data-audio-playback-wave-progress]'),
      progressLineEl: wavePlayedEl['querySelector']?.('[data-audio-playback-progress-line]'),
      timeEl: wavePlayedEl['querySelector']?.('[data-audio-playback-time]'),
      trackEl: trackEl,
    })['attach'](),
    ready = text3
      ? attachMediaElementPlaybackSource(audioEl, text3, {
          preload: preload,
          shouldAssign: () => !enabled2 && audioEl['isConnected'] !== false,
        })['catch'](() => '')
      : Promise['resolve'](''),
    list = Array['from'](wavePlayedEl['querySelectorAll']?.('[data-audio-playback-wave-path]') || []);
  void (async () => {
    const current = { width: 200, height: 80, samples: 190 };
    let waveformBarsPathFromPersistedUrl = '';
    waveformUrl3 &&
      (waveformBarsPathFromPersistedUrl = await getWaveformBarsPathFromPersistedUrl(waveformUrl3, current));
    !waveformBarsPathFromPersistedUrl &&
      text3 &&
      (waveformBarsPathFromPersistedUrl = await getWaveformBarsPathFromUrl(text3, current));
    if (enabled2 || !waveformBarsPathFromPersistedUrl || wavePlayedEl['isConnected'] === false) return;
    list['forEach']((el2) => {
      el2['setAttribute']?.('d', waveformBarsPathFromPersistedUrl);
    });
  })();
  const run = () => {
      const entry = audioEl['paused'] === false && audioEl['ended'] !== true;
      (el['classList']?.['toggle']?.('is-playing', entry),
        el['setAttribute']?.('aria-label', entry ? text5 : text4));
    },
    record = (event) => {
      (event['preventDefault']?.(), event['stopPropagation']?.());
      if (audioEl['paused'] === false) {
        audioEl['pause']?.();
        return;
      }
      if (next) return;
      next = (async () => {
        try {
          (onBeforePlay(), await ready);
          if (enabled2 || !text3) return;
          if (audioEl['ended']) audioEl['currentTime'] = 0;
          const promise = audioEl['play']?.();
          promise && typeof promise['then'] === 'function' && (await promise);
        } catch (payload) {
          if (!enabled2) onError(payload);
        } finally {
          next = null;
          if (!enabled2) run();
        }
      })();
    },
    handle = (event2) => {
      const duration = Number(audioEl['duration']),
        box = trackEl['getBoundingClientRect']?.();
      if (!(duration > 0) || !box?.['width']) return;
      const state = Math['max'](
          0,
          Math['min'](1, (Number(event2['clientX']) - box['left']) / box['width']),
        ),
        currentTime = state * duration;
      ((audioEl['currentTime'] = currentTime),
        audioPlaybackProgressController['sync']({
          currentTime: currentTime,
          duration: duration,
          force: true,
          showLine: true,
        }));
    };
  return (
    el['addEventListener']?.('pointerdown', record),
    trackEl['addEventListener']?.('click', handle),
    audioEl['addEventListener']?.('play', run),
    audioEl['addEventListener']?.('pause', run),
    audioEl['addEventListener']?.('ended', run),
    run(),
    {
      audioEl: audioEl,
      ready: ready,
      destroy() {
        ((enabled2 = true),
          audioEl['pause']?.(),
          audioPlaybackProgressController['destroy'](),
          clearDesktopMediaPlaybackSourceMetadata(audioEl),
          el['removeEventListener']?.('pointerdown', record),
          trackEl['removeEventListener']?.('click', handle),
          audioEl['removeEventListener']?.('play', run),
          audioEl['removeEventListener']?.('pause', run),
          audioEl['removeEventListener']?.('ended', run));
      },
    }
  );
}
