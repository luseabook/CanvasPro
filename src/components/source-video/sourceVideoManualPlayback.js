export function setSourceVideoManualLoopPlayback(_0x4f961f, _0x8e5506) {
  _0x4f961f['_isManualLoopPlayback'] = _0x8e5506 === !![];
  if (!_0x4f961f['_video']) return;
  if (!_0x4f961f['_isManualLoopPlayback']) {
    _0x4f961f['_video']['loop'] = ![];
    return;
  }
  const _0x57a2b8 = _0x4f961f['_getClipRange'](_0x4f961f['_getBaseDuration']());
  _0x4f961f['_video']['loop'] = !_0x57a2b8['active'];
}
export function toggleSourceVideoManualPlayback(
  _0xa0d257,
  { loop: loop = ![], forcePlay: forcePlay = ![] } = {},
) {
  if (!_0xa0d257['_currentSrc']) return;
  const _0xc9d3d8 = _0xa0d257['_ensureVideoElement']();
  if (!_0xc9d3d8) return;
  ((_0xa0d257['_isManualControl'] = !![]),
    _0xa0d257['_syncPlaybackChromeVisibility'](),
    _0xa0d257['_syncRendererPlaybackPin'](),
    _0xa0d257['_autoPlayToken']++);
  if (_0xc9d3d8['paused'] || forcePlay === !![]) {
    ((_0xa0d257['_hoverManualPause'] = ![]), _0xa0d257['_setManualLoopPlayback'](loop === !![]));
    const _0x16a46e = _0xa0d257['_getBaseDuration'](),
      _0x718a6b = _0xa0d257['_getClipRange'](_0x16a46e);
    if (_0x718a6b['active']) {
      const _0xeb7524 = _0xc9d3d8['currentTime'] || 0x0;
      (_0xeb7524 < _0x718a6b['start'] || _0xeb7524 > _0x718a6b['end']) &&
        (_0xc9d3d8['currentTime'] = _0x718a6b['start']);
    } else _0xc9d3d8['ended'] === !![] && (_0xc9d3d8['currentTime'] = 0x0);
    void _0xa0d257['_playVideoWithRecovery']('manual', () => _0xa0d257['_isManualControl'])['then'](
      (_0x218a62) => {
        _0x218a62
          ? _0xa0d257['_flashCenterIndicator']('play')
          : (_0xa0d257['_setManualLoopPlayback'](![]),
            _0xa0d257['_syncPlaybackChromeVisibility'](),
            _0xa0d257['_syncRendererPlaybackPin']());
      },
    );
    return;
  }
  ((_0xa0d257['_hoverManualPause'] = !![]),
    _0xa0d257['_setManualLoopPlayback'](![]),
    _0xc9d3d8['pause'](),
    _0xa0d257['_flashCenterIndicator']('pause'),
    _0xa0d257['_syncRendererPlaybackPin']());
}
