function escapeHtml(value) {
  return String(value ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function renderAttributes(options = {}) {
  return Object['entries'](options || {})
    ['filter'](([, item]) => item !== ![] && item != null)
    ['map'](([key, index]) =>
      index === !![] ? escapeHtml(key) : escapeHtml(key) + '=\x22' + escapeHtml(index) + '\x22',
    )
    ['join']('\x20');
}
const PLAY_ICON =
    '<svg class="story-video-play-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>',
  PAUSE_ICON =
    '<svg class="story-video-pause-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"></path></svg>',
  HIGH_VOLUME_ICON =
    '<svg\x20width=\x2217\x22\x20height=\x2217\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22M11\x205\x206\x209H2v6h4l5\x204z\x22></path><path\x20d=\x22M15.5\x208.5a5\x205\x200\x200\x201\x200\x207\x22></path><path\x20d=\x22M18\x206a8.5\x208.5\x200\x200\x201\x200\x2012\x22></path></svg>';
function clampVolume(result, data = 0x0) {
  const target = Number(result);
  if (!Number['isFinite'](target)) return data;
  return Math['min'](0x1, Math['max'](0x0, target));
}
function resolveVolumeMediaElements(handler) {
  const source = typeof handler === 'function' ? handler() : [];
  return Array['from'](new Set(Array['isArray'](source) ? source : []))['filter'](
    (next) => next && typeof next === 'object',
  );
}
export function bindWorkspaceVideoVolumeControls({
  volumeSlider: volumeSlider,
  volumeToggle: volumeToggle,
  getMediaElements: getMediaElements = () => [],
  defaultVolume: defaultVolume = 0x1,
  getToggleLabel: getToggleLabel,
  onChange: onChange,
} = {}) {
  let current = ![];
  const list = resolveVolumeMediaElements(getMediaElements),
    entry = list['find']((record) => record['muted'] !== !![] && clampVolume(record['volume']) > 0x0),
    payload = list['find']((handle) => clampVolume(handle['volume']) > 0x0),
    clampVolume2 = clampVolume(Number(volumeSlider?.['value']) / 0x64);
  let clampVolume3 =
    clampVolume(entry?.['volume'] ?? payload?.['volume'] ?? clampVolume2, clampVolume(defaultVolume, 0x1)) ||
    clampVolume(defaultVolume, 0x1) ||
    0x1;
  const run = () => {
      const mediaElements = resolveVolumeMediaElements(getMediaElements),
        volume = mediaElements['find'](
          (state) => state['muted'] !== !![] && clampVolume(state['volume']) > 0x0,
        );
      return { mediaElements: mediaElements, volume: volume ? clampVolume(volume['volume']) : 0x0 };
    },
    sync = () => {
      if (current) return;
      const config = run(),
        count = config['mediaElements']['length'] > 0x0 ? config['volume'] : clampVolume2;
      if (count > 0x0) clampVolume3 = count;
      const count2 = Math['round'](count * 0x64),
        scope = count2 === 0x0;
      volumeSlider &&
        ((volumeSlider['value'] = String(count2)),
        volumeSlider['style']?.['setProperty']?.('--story-video-volume-progress', count2 + '%'),
        volumeSlider['setAttribute']?.('aria-valuetext', count2 + '%'));
      (volumeToggle?.['classList']?.['toggle']?.('is-muted', scope),
        volumeToggle?.['setAttribute']?.('aria-pressed', String(scope)));
      if (typeof getToggleLabel === 'function') {
        const input = String(getToggleLabel(scope) || '')['trim']();
        if (input) volumeToggle?.['setAttribute']?.('aria-label', input);
      }
    },
    handler2 = () => {
      (sync(), onChange?.());
    },
    setVolumePercent = (output) => {
      if (current) return ![];
      const clampVolume4 = clampVolume(Number(output) / 0x64);
      if (clampVolume4 > 0x0) clampVolume3 = clampVolume4;
      for (const value2 of resolveVolumeMediaElements(getMediaElements)) {
        ((value2['volume'] = clampVolume4), (value2['muted'] = ![]));
      }
      return (handler2(), !![]);
    },
    toggleMuted = () => {
      if (current) return ![];
      const value3 = run();
      if (value3['volume'] > 0x0) {
        clampVolume3 = value3['volume'];
        for (const value4 of value3['mediaElements']) value4['muted'] = !![];
      } else {
        const value5 = clampVolume3 || 0x1;
        for (const value6 of value3['mediaElements']) {
          ((value6['volume'] = value5), (value6['muted'] = ![]));
        }
      }
      return (handler2(), !![]);
    },
    value7 = (event) => {
      (event?.['stopPropagation']?.(),
        setVolumePercent(event?.['currentTarget']?.['value'] ?? volumeSlider?.['value']));
    },
    value8 = (event2) => {
      (event2?.['preventDefault']?.(), event2?.['stopPropagation']?.(), toggleMuted());
    };
  return (
    volumeSlider?.['addEventListener']?.('input', value7),
    volumeToggle?.['addEventListener']?.('click', value8),
    sync(),
    Object['freeze']({
      sync: sync,
      setVolumePercent: setVolumePercent,
      toggleMuted: toggleMuted,
      dispose() {
        if (current) return;
        ((current = !![]),
          volumeSlider?.['removeEventListener']?.('input', value7),
          volumeToggle?.['removeEventListener']?.('click', value8));
      },
    })
  );
}
function applyElementAttributes(el, value9 = {}) {
  for (const [value10, value11] of Object['entries'](value9 || {})) {
    if (value11 === ![] || value11 == null) continue;
    el['setAttribute'](value10, value11 === !![] ? '' : String(value11));
  }
}
function setDisabled(el2, value12) {
  el2['disabled'] = value12 === !![];
  if (value12) el2['setAttribute']('disabled', '');
}
function appendElementSlot(el3, value13) {
  const value14 = Array['isArray'](value13) ? value13 : [value13];
  for (const enabled of value14) {
    if (!enabled || typeof enabled !== 'object') continue;
    el3['appendChild'](enabled);
  }
}
export function renderWorkspaceVideoPlaybackControls({
  className: className = '',
  label: label = '视频',
  disabled: disabled = ![],
  controlsAttributes: controlsAttributes = {},
  playAttributes: playAttributes = {},
  currentTimeAttributes: currentTimeAttributes = {},
  progressAttributes: progressAttributes = {},
  progressFillAttributes: progressFillAttributes = {},
  totalTimeAttributes: totalTimeAttributes = {},
  volumeAttributes: volumeAttributes = {},
  volumeToggleAttributes: volumeToggleAttributes = {},
  playLabel: playLabel = '播放' + label,
  playTitle: playTitle = '',
  progressLabel: progressLabel = label + '播放进度',
  volumeLabel: volumeLabel = label + '音量',
  volumeToggleLabel: volumeToggleLabel = '静音' + label,
  slots: slots = {},
} = {}) {
  const value15 = ['video-controls', 'story-video-controls', className]['filter'](Boolean)['join']('\x20'),
    renderAttributes2 = renderAttributes(controlsAttributes),
    renderAttributes3 = renderAttributes(playAttributes),
    renderAttributes4 = renderAttributes(currentTimeAttributes),
    renderAttributes5 = renderAttributes(progressAttributes),
    renderAttributes6 = renderAttributes(progressFillAttributes),
    renderAttributes7 = renderAttributes(totalTimeAttributes),
    renderAttributes8 = renderAttributes(volumeAttributes),
    renderAttributes9 = renderAttributes(volumeToggleAttributes),
    value16 = disabled ? ' disabled' : '',
    value17 = disabled ? '-1' : '0',
    value18 = playTitle ? ' title="' + escapeHtml(playTitle) + '\x22' : '';
  return (
    '<div class="' +
    escapeHtml(value15) +
    '\x22' +
    (renderAttributes2 ? '\x20' + renderAttributes2 : '') +
    '>\n    <button type="button" class="video-play-btn story-video-play-btn"' +
    (renderAttributes3 ? '\x20' + renderAttributes3 : '') +
    ' aria-label="' +
    escapeHtml(playLabel) +
    '\x22' +
    value18 +
    value16 +
    '>\n      ' +
    PLAY_ICON +
    '\x0a\x20\x20\x20\x20\x20\x20' +
    PAUSE_ICON +
    '\n    </button>\n    ' +
    (slots['afterPlay'] || '') +
    '\x0a\x20\x20\x20\x20<span\x20class=\x22video-time-current\x22' +
    (renderAttributes4 ? '\x20' + renderAttributes4 : '') +
    '>0:00</span>\n    <div class="media-progress-bar"' +
    (renderAttributes5 ? '\x20' + renderAttributes5 : '') +
    ' role="slider" aria-disabled="' +
    disabled +
    '\x22\x20tabindex=\x22' +
    value17 +
    '" aria-label="' +
    escapeHtml(progressLabel) +
    '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">\n      <div class="media-progress-fill"' +
    (renderAttributes6 ? '\x20' + renderAttributes6 : '') +
    '><div class="media-progress-knob"></div></div>\n    </div>\n    <span class="video-time-total"' +
    (renderAttributes7 ? '\x20' + renderAttributes7 : '') +
    '>0:00</span>\n    ' +
    (slots['beforeVolume'] || '') +
    '\x0a\x20\x20\x20\x20<div\x20class=\x22story-video-volume-control\x22>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-video-volume-toggle\x22' +
    (renderAttributes9 ? '\x20' + renderAttributes9 : '') +
    ' aria-label="' +
    escapeHtml(volumeToggleLabel) +
    '\x22\x20aria-pressed=\x22false\x22' +
    value16 +
    '>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    HIGH_VOLUME_ICON +
    '\n      </button>\n      <input type="range" class="story-video-volume-slider"' +
    (renderAttributes8 ? '\x20' + renderAttributes8 : '') +
    ' min="0" max="100" step="1" value="100" aria-label="' +
    escapeHtml(volumeLabel) +
    '\x22\x20aria-valuetext=\x22100%\x22' +
    value16 +
    '>\n    </div>\n    ' +
    (slots['afterVolume'] || '') +
    '\n  </div>'
  );
}
export function createWorkspaceVideoPlaybackControls(
  el4,
  {
    className: className = '',
    label: label = '视频',
    disabled: disabled = ![],
    controlsAttributes: controlsAttributes = {},
    playAttributes: playAttributes = {},
    currentTimeAttributes: currentTimeAttributes = {},
    progressAttributes: progressAttributes = {},
    progressFillAttributes: progressFillAttributes = {},
    totalTimeAttributes: totalTimeAttributes = {},
    volumeAttributes: volumeAttributes = {},
    volumeToggleAttributes: volumeToggleAttributes = {},
    playLabel: playLabel = '播放' + label,
    playTitle: playTitle = '',
    progressLabel: progressLabel = label + '播放进度',
    volumeLabel: volumeLabel = label + '音量',
    volumeToggleLabel: volumeToggleLabel = '静音' + label,
    slots: slots = {},
  } = {},
) {
  if (!el4?.['createElement']) return null;
  const root = el4['createElement']('div');
  ((root['className'] = ['video-controls', 'story-video-controls', className]
    ['filter'](Boolean)
    ['join']('\x20')),
    applyElementAttributes(root, controlsAttributes));
  const playButton = el4['createElement']('button');
  ((playButton['type'] = 'button'),
    (playButton['className'] = 'video-play-btn\x20story-video-play-btn'),
    (playButton['innerHTML'] = '' + PLAY_ICON + PAUSE_ICON),
    playButton['setAttribute']('aria-label', playLabel));
  if (playTitle) playButton['setAttribute']('title', playTitle);
  (applyElementAttributes(playButton, playAttributes), setDisabled(playButton, disabled));
  const currentTime = el4['createElement']('span');
  ((currentTime['className'] = 'video-time-current'),
    (currentTime['textContent'] = '0:00'),
    applyElementAttributes(currentTime, currentTimeAttributes));
  const progress = el4['createElement']('div');
  ((progress['className'] = 'media-progress-bar'),
    progress['setAttribute']('role', 'slider'),
    progress['setAttribute']('aria-disabled', String(disabled === !![])),
    progress['setAttribute']('tabindex', disabled ? '-1' : '0'),
    progress['setAttribute']('aria-label', progressLabel),
    progress['setAttribute']('aria-valuemin', '0'),
    progress['setAttribute']('aria-valuemax', '100'),
    progress['setAttribute']('aria-valuenow', '0'),
    applyElementAttributes(progress, progressAttributes));
  const progressFill = el4['createElement']('div');
  ((progressFill['className'] = 'media-progress-fill'),
    applyElementAttributes(progressFill, progressFillAttributes));
  const progressKnob = el4['createElement']('div');
  ((progressKnob['className'] = 'media-progress-knob'),
    progressFill['appendChild'](progressKnob),
    progress['appendChild'](progressFill));
  const totalTime = el4['createElement']('span');
  ((totalTime['className'] = 'video-time-total'),
    (totalTime['textContent'] = '0:00'),
    applyElementAttributes(totalTime, totalTimeAttributes));
  const volumeControl = el4['createElement']('div');
  volumeControl['className'] = 'story-video-volume-control';
  const volumeToggle2 = el4['createElement']('button');
  ((volumeToggle2['type'] = 'button'),
    (volumeToggle2['className'] = 'story-video-volume-toggle'),
    (volumeToggle2['innerHTML'] = HIGH_VOLUME_ICON),
    volumeToggle2['setAttribute']('aria-label', volumeToggleLabel),
    volumeToggle2['setAttribute']('aria-pressed', 'false'),
    applyElementAttributes(volumeToggle2, volumeToggleAttributes),
    setDisabled(volumeToggle2, disabled));
  const volume2 = el4['createElement']('input');
  return (
    (volume2['type'] = 'range'),
    (volume2['className'] = 'story-video-volume-slider'),
    (volume2['min'] = '0'),
    (volume2['max'] = '100'),
    (volume2['step'] = '1'),
    (volume2['value'] = '100'),
    volume2['setAttribute']('aria-label', volumeLabel),
    volume2['setAttribute']('aria-valuetext', '100%'),
    applyElementAttributes(volume2, volumeAttributes),
    setDisabled(volume2, disabled),
    volumeControl['appendChild'](volumeToggle2),
    volumeControl['appendChild'](volume2),
    root['appendChild'](playButton),
    appendElementSlot(root, slots['afterPlay']),
    root['appendChild'](currentTime),
    root['appendChild'](progress),
    root['appendChild'](totalTime),
    appendElementSlot(root, slots['beforeVolume']),
    root['appendChild'](volumeControl),
    appendElementSlot(root, slots['afterVolume']),
    {
      root: root,
      playButton: playButton,
      currentTime: currentTime,
      progress: progress,
      progressFill: progressFill,
      progressKnob: progressKnob,
      totalTime: totalTime,
      volumeControl: volumeControl,
      volumeToggle: volumeToggle2,
      volume: volume2,
    }
  );
}
