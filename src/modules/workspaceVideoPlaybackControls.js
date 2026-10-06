function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function renderAttributes(options = {}) {
  return Object.entries(options || {})
    .filter(([, item]) => item !== false && item != null)
    .map(([key, index]) =>
      index === true ? escapeHtml(key) : escapeHtml(key) + '="' + escapeHtml(index) + '"',
    )
    .join(' ');
}
const PLAY_ICON =
    '<svg class="story-video-play-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>',
  PAUSE_ICON =
    '<svg class="story-video-pause-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"></path></svg>',
  HIGH_VOLUME_ICON =
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18 6a8.5 8.5 0 0 1 0 12"></path></svg>';
export const WORKSPACE_VIDEO_REPEAT_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>';
function clampVolume(result, data = 0) {
  const target = Number(result);
  if (!Number.isFinite(target)) return data;
  return Math.min(1, Math.max(0, target));
}
function resolveVolumeMediaElements(handler) {
  const source = typeof handler === 'function' ? handler() : [];
  return Array.from(new Set(Array.isArray(source) ? source : [])).filter(
    (next) => next && typeof next === 'object',
  );
}
export function bindWorkspaceVideoVolumeControls({
  volumeSlider: volumeSlider,
  volumeToggle: volumeToggle,
  getMediaElements: getMediaElements = () => [],
  defaultVolume: defaultVolume = 1,
  getToggleLabel: getToggleLabel,
  onChange: onChange,
} = {}) {
  let current = false;
  const list = resolveVolumeMediaElements(getMediaElements),
    entry = list.find((record) => record.muted !== true && clampVolume(record.volume) > 0),
    payload = list.find((handle) => clampVolume(handle.volume) > 0),
    clampVolume2 = clampVolume(Number(volumeSlider?.value) / 100);
  let clampVolume3 =
    clampVolume(entry?.volume ?? payload?.volume ?? clampVolume2, clampVolume(defaultVolume, 1)) ||
    clampVolume(defaultVolume, 1) ||
    1;
  const run = () => {
      const mediaElements = resolveVolumeMediaElements(getMediaElements),
        volume = mediaElements.find(
          (state) => state.muted !== true && clampVolume(state.volume) > 0,
        );
      return { mediaElements: mediaElements, volume: volume ? clampVolume(volume.volume) : 0 };
    },
    sync = () => {
      if (current) return;
      const config = run(),
        count = config.mediaElements.length > 0 ? config.volume : clampVolume2;
      if (count > 0) clampVolume3 = count;
      const count2 = Math.round(count * 100),
        scope = count2 === 0;
      volumeSlider &&
        ((volumeSlider.value = String(count2)),
        volumeSlider.style?.setProperty?.('--story-video-volume-progress', count2 + '%'),
        volumeSlider.setAttribute?.('aria-valuetext', count2 + '%'));
      (volumeToggle?.classList?.toggle?.('is-muted', scope),
        volumeToggle?.setAttribute?.('aria-pressed', String(scope)));
      if (typeof getToggleLabel === 'function') {
        const input = String(getToggleLabel(scope) || '').trim();
        if (input) volumeToggle?.setAttribute?.('aria-label', input);
      }
    },
    handler2 = () => {
      (sync(), onChange?.());
    },
    setVolumePercent = (output) => {
      if (current) return false;
      const clampVolume4 = clampVolume(Number(output) / 100);
      if (clampVolume4 > 0) clampVolume3 = clampVolume4;
      for (const value2 of resolveVolumeMediaElements(getMediaElements)) {
        ((value2.volume = clampVolume4), (value2.muted = false));
      }
      return (handler2(), true);
    },
    toggleMuted = () => {
      if (current) return false;
      const value3 = run();
      if (value3.volume > 0) {
        clampVolume3 = value3.volume;
        for (const value4 of value3.mediaElements) value4.muted = true;
      } else {
        const value5 = clampVolume3 || 1;
        for (const value6 of value3.mediaElements) {
          ((value6.volume = value5), (value6.muted = false));
        }
      }
      return (handler2(), true);
    },
    value7 = (event) => {
      (event?.stopPropagation?.(),
        setVolumePercent(event?.currentTarget?.value ?? volumeSlider?.value));
    },
    value8 = (event2) => {
      (event2?.preventDefault?.(), event2?.stopPropagation?.(), toggleMuted());
    };
  return (
    volumeSlider?.addEventListener?.('input', value7),
    volumeToggle?.addEventListener?.('click', value8),
    sync(),
    Object.freeze({
      sync: sync,
      setVolumePercent: setVolumePercent,
      toggleMuted: toggleMuted,
      dispose() {
        if (current) return;
        ((current = true),
          volumeSlider?.removeEventListener?.('input', value7),
          volumeToggle?.removeEventListener?.('click', value8));
      },
    })
  );
}
function applyElementAttributes(el, value9 = {}) {
  for (const [value10, value11] of Object.entries(value9 || {})) {
    if (value11 === false || value11 == null) continue;
    el.setAttribute(value10, value11 === true ? '' : String(value11));
  }
}
function setDisabled(el2, value12) {
  el2.disabled = value12 === true;
  if (value12) el2.setAttribute('disabled', '');
}
function appendElementSlot(el3, value13) {
  const value14 = Array.isArray(value13) ? value13 : [value13];
  for (const enabled of value14) {
    if (!enabled || typeof enabled !== 'object') continue;
    el3.appendChild(enabled);
  }
}
export function renderWorkspaceVideoPlaybackControls({
  className: className = '',
  label: label = '视频',
  disabled: disabled = false,
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
  const value15 = ['video-controls', 'story-video-controls', className].filter(Boolean).join(' '),
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
    value18 = playTitle ? ' title="' + escapeHtml(playTitle) + '"' : '';
  return (
    '<div class="' +
    escapeHtml(value15) +
    '"' +
    (renderAttributes2 ? ' ' + renderAttributes2 : '') +
    '>\n    <button type="button" class="video-play-btn story-video-play-btn"' +
    (renderAttributes3 ? ' ' + renderAttributes3 : '') +
    ' aria-label="' +
    escapeHtml(playLabel) +
    '"' +
    value18 +
    value16 +
    '>\n      ' +
    PLAY_ICON +
    '\n      ' +
    PAUSE_ICON +
    '\n    </button>\n    ' +
    (slots.afterPlay || '') +
    '\n    <span class="video-time-current"' +
    (renderAttributes4 ? ' ' + renderAttributes4 : '') +
    '>0:00</span>\n    <div class="media-progress-bar"' +
    (renderAttributes5 ? ' ' + renderAttributes5 : '') +
    ' role="slider" aria-disabled="' +
    disabled +
    '" tabindex="' +
    value17 +
    '" aria-label="' +
    escapeHtml(progressLabel) +
    '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">\n      <div class="media-progress-fill"' +
    (renderAttributes6 ? ' ' + renderAttributes6 : '') +
    '><div class="media-progress-knob"></div></div>\n    </div>\n    <span class="video-time-total"' +
    (renderAttributes7 ? ' ' + renderAttributes7 : '') +
    '>0:00</span>\n    ' +
    (slots.beforeVolume || '') +
    '\n    <div class="story-video-volume-control">\n      <button type="button" class="story-video-volume-toggle"' +
    (renderAttributes9 ? ' ' + renderAttributes9 : '') +
    ' aria-label="' +
    escapeHtml(volumeToggleLabel) +
    '" aria-pressed="false"' +
    value16 +
    '>\n        ' +
    HIGH_VOLUME_ICON +
    '\n      </button>\n      <input type="range" class="story-video-volume-slider"' +
    (renderAttributes8 ? ' ' + renderAttributes8 : '') +
    ' min="0" max="100" step="1" value="100" aria-label="' +
    escapeHtml(volumeLabel) +
    '" aria-valuetext="100%"' +
    value16 +
    '>\n    </div>\n    ' +
    (slots.afterVolume || '') +
    '\n  </div>'
  );
}
export function createWorkspaceVideoPlaybackControls(
  el4,
  {
    className: className = '',
    label: label = '视频',
    disabled: disabled = false,
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
  if (!el4?.createElement) return null;
  const root = el4.createElement('div');
  ((root.className = ['video-controls', 'story-video-controls', className]
    .filter(Boolean)
    .join(' ')),
    applyElementAttributes(root, controlsAttributes));
  const playButton = el4.createElement('button');
  ((playButton.type = 'button'),
    (playButton.className = 'video-play-btn story-video-play-btn'),
    (playButton.innerHTML = '' + PLAY_ICON + PAUSE_ICON),
    playButton.setAttribute('aria-label', playLabel));
  if (playTitle) playButton.setAttribute('title', playTitle);
  (applyElementAttributes(playButton, playAttributes), setDisabled(playButton, disabled));
  const currentTime = el4.createElement('span');
  ((currentTime.className = 'video-time-current'),
    (currentTime.textContent = '0:00'),
    applyElementAttributes(currentTime, currentTimeAttributes));
  const progress = el4.createElement('div');
  ((progress.className = 'media-progress-bar'),
    progress.setAttribute('role', 'slider'),
    progress.setAttribute('aria-disabled', String(disabled === true)),
    progress.setAttribute('tabindex', disabled ? '-1' : '0'),
    progress.setAttribute('aria-label', progressLabel),
    progress.setAttribute('aria-valuemin', '0'),
    progress.setAttribute('aria-valuemax', '100'),
    progress.setAttribute('aria-valuenow', '0'),
    applyElementAttributes(progress, progressAttributes));
  const progressFill = el4.createElement('div');
  ((progressFill.className = 'media-progress-fill'),
    applyElementAttributes(progressFill, progressFillAttributes));
  const progressKnob = el4.createElement('div');
  ((progressKnob.className = 'media-progress-knob'),
    progressFill.appendChild(progressKnob),
    progress.appendChild(progressFill));
  const totalTime = el4.createElement('span');
  ((totalTime.className = 'video-time-total'),
    (totalTime.textContent = '0:00'),
    applyElementAttributes(totalTime, totalTimeAttributes));
  const volumeControl = el4.createElement('div');
  volumeControl.className = 'story-video-volume-control';
  const volumeToggle2 = el4.createElement('button');
  ((volumeToggle2.type = 'button'),
    (volumeToggle2.className = 'story-video-volume-toggle'),
    (volumeToggle2.innerHTML = HIGH_VOLUME_ICON),
    volumeToggle2.setAttribute('aria-label', volumeToggleLabel),
    volumeToggle2.setAttribute('aria-pressed', 'false'),
    applyElementAttributes(volumeToggle2, volumeToggleAttributes),
    setDisabled(volumeToggle2, disabled));
  const volume2 = el4.createElement('input');
  return (
    (volume2.type = 'range'),
    (volume2.className = 'story-video-volume-slider'),
    (volume2.min = '0'),
    (volume2.max = '100'),
    (volume2.step = '1'),
    (volume2.value = '100'),
    volume2.setAttribute('aria-label', volumeLabel),
    volume2.setAttribute('aria-valuetext', '100%'),
    applyElementAttributes(volume2, volumeAttributes),
    setDisabled(volume2, disabled),
    volumeControl.appendChild(volumeToggle2),
    volumeControl.appendChild(volume2),
    root.appendChild(playButton),
    appendElementSlot(root, slots.afterPlay),
    root.appendChild(currentTime),
    root.appendChild(progress),
    root.appendChild(totalTime),
    appendElementSlot(root, slots.beforeVolume),
    root.appendChild(volumeControl),
    appendElementSlot(root, slots.afterVolume),
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
