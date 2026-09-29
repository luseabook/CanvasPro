function escapeHtml(_0x385875) {
  return String(_0x385875 ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function renderAttributes(_0x62e691 = {}) {
  return Object['entries'](_0x62e691 || {})
    ['filter'](([, _0xd16da0]) => _0xd16da0 !== ![] && _0xd16da0 != null)
    ['map'](([_0x4139fb, _0x1fb3d4]) =>
      _0x1fb3d4 === !![]
        ? escapeHtml(_0x4139fb)
        : escapeHtml(_0x4139fb) + '=\x22' + escapeHtml(_0x1fb3d4) + '\x22',
    )
    ['join']('\x20');
}
const PLAY_ICON =
    '<svg class="story-video-play-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>',
  PAUSE_ICON =
    '<svg class="story-video-pause-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"></path></svg>',
  HIGH_VOLUME_ICON =
    '<svg\x20width=\x2217\x22\x20height=\x2217\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22M11\x205\x206\x209H2v6h4l5\x204z\x22></path><path\x20d=\x22M15.5\x208.5a5\x205\x200\x200\x201\x200\x207\x22></path><path\x20d=\x22M18\x206a8.5\x208.5\x200\x200\x201\x200\x2012\x22></path></svg>';
function clampVolume(_0x269386, _0x24e085 = 0x0) {
  const _0x551cf6 = Number(_0x269386);
  if (!Number['isFinite'](_0x551cf6)) return _0x24e085;
  return Math['min'](0x1, Math['max'](0x0, _0x551cf6));
}
function resolveVolumeMediaElements(_0x5831a1) {
  const _0x34f664 = typeof _0x5831a1 === 'function' ? _0x5831a1() : [];
  return Array['from'](new Set(Array['isArray'](_0x34f664) ? _0x34f664 : []))['filter'](
    (_0x3f7efd) => _0x3f7efd && typeof _0x3f7efd === 'object',
  );
}
export function bindWorkspaceVideoVolumeControls({
  volumeSlider: _0x29e67c,
  volumeToggle: _0x5c30aa,
  getMediaElements: getMediaElements = () => [],
  defaultVolume: defaultVolume = 0x1,
  getToggleLabel: _0x4ef798,
  onChange: _0x316fa9,
} = {}) {
  let _0x25a1b0 = ![];
  const _0x5e859d = resolveVolumeMediaElements(getMediaElements),
    _0x11b8ba = _0x5e859d['find'](
      (_0x45d11c) => _0x45d11c['muted'] !== !![] && clampVolume(_0x45d11c['volume']) > 0x0,
    ),
    _0x1efb7e = _0x5e859d['find']((_0x3f6f1) => clampVolume(_0x3f6f1['volume']) > 0x0),
    _0x40df48 = clampVolume(Number(_0x29e67c?.['value']) / 0x64);
  let _0x37f677 =
    clampVolume(
      _0x11b8ba?.['volume'] ?? _0x1efb7e?.['volume'] ?? _0x40df48,
      clampVolume(defaultVolume, 0x1),
    ) ||
    clampVolume(defaultVolume, 0x1) ||
    0x1;
  const _0x36f6fb = () => {
      const _0x21640c = resolveVolumeMediaElements(getMediaElements),
        _0x4a972a = _0x21640c['find'](
          (_0x5c9d95) => _0x5c9d95['muted'] !== !![] && clampVolume(_0x5c9d95['volume']) > 0x0,
        );
      return { mediaElements: _0x21640c, volume: _0x4a972a ? clampVolume(_0x4a972a['volume']) : 0x0 };
    },
    _0x57e19e = () => {
      if (_0x25a1b0) return;
      const _0x1c3c16 = _0x36f6fb(),
        _0x3e70ad = _0x1c3c16['mediaElements']['length'] > 0x0 ? _0x1c3c16['volume'] : _0x40df48;
      if (_0x3e70ad > 0x0) _0x37f677 = _0x3e70ad;
      const _0x5004b6 = Math['round'](_0x3e70ad * 0x64),
        _0x34689e = _0x5004b6 === 0x0;
      _0x29e67c &&
        ((_0x29e67c['value'] = String(_0x5004b6)),
        _0x29e67c['style']?.['setProperty']?.('--story-video-volume-progress', _0x5004b6 + '%'),
        _0x29e67c['setAttribute']?.('aria-valuetext', _0x5004b6 + '%'));
      (_0x5c30aa?.['classList']?.['toggle']?.('is-muted', _0x34689e),
        _0x5c30aa?.['setAttribute']?.('aria-pressed', String(_0x34689e)));
      if (typeof _0x4ef798 === 'function') {
        const _0x28f947 = String(_0x4ef798(_0x34689e) || '')['trim']();
        if (_0x28f947) _0x5c30aa?.['setAttribute']?.('aria-label', _0x28f947);
      }
    },
    _0x1cbf29 = () => {
      (_0x57e19e(), _0x316fa9?.());
    },
    _0x3cdfb2 = (_0x5ac385) => {
      if (_0x25a1b0) return ![];
      const _0x4d8a77 = clampVolume(Number(_0x5ac385) / 0x64);
      if (_0x4d8a77 > 0x0) _0x37f677 = _0x4d8a77;
      for (const _0x140275 of resolveVolumeMediaElements(getMediaElements)) {
        ((_0x140275['volume'] = _0x4d8a77), (_0x140275['muted'] = ![]));
      }
      return (_0x1cbf29(), !![]);
    },
    _0x181843 = () => {
      if (_0x25a1b0) return ![];
      const _0xe99191 = _0x36f6fb();
      if (_0xe99191['volume'] > 0x0) {
        _0x37f677 = _0xe99191['volume'];
        for (const _0x2f86ca of _0xe99191['mediaElements']) _0x2f86ca['muted'] = !![];
      } else {
        const _0x132d73 = _0x37f677 || 0x1;
        for (const _0x4ab32c of _0xe99191['mediaElements']) {
          ((_0x4ab32c['volume'] = _0x132d73), (_0x4ab32c['muted'] = ![]));
        }
      }
      return (_0x1cbf29(), !![]);
    },
    _0xbcbc8e = (_0x57b96e) => {
      (_0x57b96e?.['stopPropagation']?.(),
        _0x3cdfb2(_0x57b96e?.['currentTarget']?.['value'] ?? _0x29e67c?.['value']));
    },
    _0x41e8ba = (_0x22a470) => {
      (_0x22a470?.['preventDefault']?.(), _0x22a470?.['stopPropagation']?.(), _0x181843());
    };
  return (
    _0x29e67c?.['addEventListener']?.('input', _0xbcbc8e),
    _0x5c30aa?.['addEventListener']?.('click', _0x41e8ba),
    _0x57e19e(),
    Object['freeze']({
      sync: _0x57e19e,
      setVolumePercent: _0x3cdfb2,
      toggleMuted: _0x181843,
      dispose() {
        if (_0x25a1b0) return;
        ((_0x25a1b0 = !![]),
          _0x29e67c?.['removeEventListener']?.('input', _0xbcbc8e),
          _0x5c30aa?.['removeEventListener']?.('click', _0x41e8ba));
      },
    })
  );
}
function applyElementAttributes(_0x5c4b72, _0x10ee3b = {}) {
  for (const [_0x38f712, _0x177553] of Object['entries'](_0x10ee3b || {})) {
    if (_0x177553 === ![] || _0x177553 == null) continue;
    _0x5c4b72['setAttribute'](_0x38f712, _0x177553 === !![] ? '' : String(_0x177553));
  }
}
function setDisabled(_0x1f145d, _0x1fb565) {
  _0x1f145d['disabled'] = _0x1fb565 === !![];
  if (_0x1fb565) _0x1f145d['setAttribute']('disabled', '');
}
function appendElementSlot(_0x2f82b1, _0x3de316) {
  const _0x3ad4ae = Array['isArray'](_0x3de316) ? _0x3de316 : [_0x3de316];
  for (const _0x5a5bfa of _0x3ad4ae) {
    if (!_0x5a5bfa || typeof _0x5a5bfa !== 'object') continue;
    _0x2f82b1['appendChild'](_0x5a5bfa);
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
  const _0x1bebf8 = ['video-controls', 'story-video-controls', className]['filter'](Boolean)['join']('\x20'),
    _0x3175e7 = renderAttributes(controlsAttributes),
    _0x582336 = renderAttributes(playAttributes),
    _0x3bc9cc = renderAttributes(currentTimeAttributes),
    _0x4d401c = renderAttributes(progressAttributes),
    _0x41b675 = renderAttributes(progressFillAttributes),
    _0x16f42f = renderAttributes(totalTimeAttributes),
    _0x578b4e = renderAttributes(volumeAttributes),
    _0x5ebc80 = renderAttributes(volumeToggleAttributes),
    _0x55200e = disabled ? ' disabled' : '',
    _0x24d557 = disabled ? '-1' : '0',
    _0x1a50e9 = playTitle ? ' title="' + escapeHtml(playTitle) + '\x22' : '';
  return (
    '<div class="' +
    escapeHtml(_0x1bebf8) +
    '\x22' +
    (_0x3175e7 ? '\x20' + _0x3175e7 : '') +
    '>\n    <button type="button" class="video-play-btn story-video-play-btn"' +
    (_0x582336 ? '\x20' + _0x582336 : '') +
    ' aria-label="' +
    escapeHtml(playLabel) +
    '\x22' +
    _0x1a50e9 +
    _0x55200e +
    '>\n      ' +
    PLAY_ICON +
    '\x0a\x20\x20\x20\x20\x20\x20' +
    PAUSE_ICON +
    '\n    </button>\n    ' +
    (slots['afterPlay'] || '') +
    '\x0a\x20\x20\x20\x20<span\x20class=\x22video-time-current\x22' +
    (_0x3bc9cc ? '\x20' + _0x3bc9cc : '') +
    '>0:00</span>\n    <div class="media-progress-bar"' +
    (_0x4d401c ? '\x20' + _0x4d401c : '') +
    ' role="slider" aria-disabled="' +
    disabled +
    '\x22\x20tabindex=\x22' +
    _0x24d557 +
    '" aria-label="' +
    escapeHtml(progressLabel) +
    '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">\n      <div class="media-progress-fill"' +
    (_0x41b675 ? '\x20' + _0x41b675 : '') +
    '><div class="media-progress-knob"></div></div>\n    </div>\n    <span class="video-time-total"' +
    (_0x16f42f ? '\x20' + _0x16f42f : '') +
    '>0:00</span>\n    ' +
    (slots['beforeVolume'] || '') +
    '\x0a\x20\x20\x20\x20<div\x20class=\x22story-video-volume-control\x22>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-video-volume-toggle\x22' +
    (_0x5ebc80 ? '\x20' + _0x5ebc80 : '') +
    ' aria-label="' +
    escapeHtml(volumeToggleLabel) +
    '\x22\x20aria-pressed=\x22false\x22' +
    _0x55200e +
    '>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    HIGH_VOLUME_ICON +
    '\n      </button>\n      <input type="range" class="story-video-volume-slider"' +
    (_0x578b4e ? '\x20' + _0x578b4e : '') +
    ' min="0" max="100" step="1" value="100" aria-label="' +
    escapeHtml(volumeLabel) +
    '\x22\x20aria-valuetext=\x22100%\x22' +
    _0x55200e +
    '>\n    </div>\n    ' +
    (slots['afterVolume'] || '') +
    '\n  </div>'
  );
}
export function createWorkspaceVideoPlaybackControls(
  _0x7e9e7,
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
  if (!_0x7e9e7?.['createElement']) return null;
  const _0x594039 = _0x7e9e7['createElement']('div');
  ((_0x594039['className'] = ['video-controls', 'story-video-controls', className]
    ['filter'](Boolean)
    ['join']('\x20')),
    applyElementAttributes(_0x594039, controlsAttributes));
  const _0x4b819f = _0x7e9e7['createElement']('button');
  ((_0x4b819f['type'] = 'button'),
    (_0x4b819f['className'] = 'video-play-btn\x20story-video-play-btn'),
    (_0x4b819f['innerHTML'] = '' + PLAY_ICON + PAUSE_ICON),
    _0x4b819f['setAttribute']('aria-label', playLabel));
  if (playTitle) _0x4b819f['setAttribute']('title', playTitle);
  (applyElementAttributes(_0x4b819f, playAttributes), setDisabled(_0x4b819f, disabled));
  const _0x23339b = _0x7e9e7['createElement']('span');
  ((_0x23339b['className'] = 'video-time-current'),
    (_0x23339b['textContent'] = '0:00'),
    applyElementAttributes(_0x23339b, currentTimeAttributes));
  const _0x576bea = _0x7e9e7['createElement']('div');
  ((_0x576bea['className'] = 'media-progress-bar'),
    _0x576bea['setAttribute']('role', 'slider'),
    _0x576bea['setAttribute']('aria-disabled', String(disabled === !![])),
    _0x576bea['setAttribute']('tabindex', disabled ? '-1' : '0'),
    _0x576bea['setAttribute']('aria-label', progressLabel),
    _0x576bea['setAttribute']('aria-valuemin', '0'),
    _0x576bea['setAttribute']('aria-valuemax', '100'),
    _0x576bea['setAttribute']('aria-valuenow', '0'),
    applyElementAttributes(_0x576bea, progressAttributes));
  const _0x7db81d = _0x7e9e7['createElement']('div');
  ((_0x7db81d['className'] = 'media-progress-fill'),
    applyElementAttributes(_0x7db81d, progressFillAttributes));
  const _0x1977d0 = _0x7e9e7['createElement']('div');
  ((_0x1977d0['className'] = 'media-progress-knob'),
    _0x7db81d['appendChild'](_0x1977d0),
    _0x576bea['appendChild'](_0x7db81d));
  const _0xb162dd = _0x7e9e7['createElement']('span');
  ((_0xb162dd['className'] = 'video-time-total'),
    (_0xb162dd['textContent'] = '0:00'),
    applyElementAttributes(_0xb162dd, totalTimeAttributes));
  const _0x2c1e4e = _0x7e9e7['createElement']('div');
  _0x2c1e4e['className'] = 'story-video-volume-control';
  const _0x19209f = _0x7e9e7['createElement']('button');
  ((_0x19209f['type'] = 'button'),
    (_0x19209f['className'] = 'story-video-volume-toggle'),
    (_0x19209f['innerHTML'] = HIGH_VOLUME_ICON),
    _0x19209f['setAttribute']('aria-label', volumeToggleLabel),
    _0x19209f['setAttribute']('aria-pressed', 'false'),
    applyElementAttributes(_0x19209f, volumeToggleAttributes),
    setDisabled(_0x19209f, disabled));
  const _0x49c142 = _0x7e9e7['createElement']('input');
  return (
    (_0x49c142['type'] = 'range'),
    (_0x49c142['className'] = 'story-video-volume-slider'),
    (_0x49c142['min'] = '0'),
    (_0x49c142['max'] = '100'),
    (_0x49c142['step'] = '1'),
    (_0x49c142['value'] = '100'),
    _0x49c142['setAttribute']('aria-label', volumeLabel),
    _0x49c142['setAttribute']('aria-valuetext', '100%'),
    applyElementAttributes(_0x49c142, volumeAttributes),
    setDisabled(_0x49c142, disabled),
    _0x2c1e4e['appendChild'](_0x19209f),
    _0x2c1e4e['appendChild'](_0x49c142),
    _0x594039['appendChild'](_0x4b819f),
    appendElementSlot(_0x594039, slots['afterPlay']),
    _0x594039['appendChild'](_0x23339b),
    _0x594039['appendChild'](_0x576bea),
    _0x594039['appendChild'](_0xb162dd),
    appendElementSlot(_0x594039, slots['beforeVolume']),
    _0x594039['appendChild'](_0x2c1e4e),
    appendElementSlot(_0x594039, slots['afterVolume']),
    {
      root: _0x594039,
      playButton: _0x4b819f,
      currentTime: _0x23339b,
      progress: _0x576bea,
      progressFill: _0x7db81d,
      progressKnob: _0x1977d0,
      totalTime: _0xb162dd,
      volumeControl: _0x2c1e4e,
      volumeToggle: _0x19209f,
      volume: _0x49c142,
    }
  );
}
