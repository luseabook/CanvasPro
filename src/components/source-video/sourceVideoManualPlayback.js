export function setSourceVideoManualLoopPlayback(enabled, value) {
  enabled['_isManualLoopPlayback'] = value === !![];
  if (!enabled['_video']) return;
  if (!enabled['_isManualLoopPlayback']) {
    enabled['_video']['loop'] = ![];
    return;
  }
  const enabled2 = enabled['_getClipRange'](enabled['_getBaseDuration']());
  enabled['_video']['loop'] = !enabled2['active'];
}
export function toggleSourceVideoManualPlayback(
  enabled3,
  { loop: loop = ![], forcePlay: forcePlay = ![] } = {},
) {
  if (!enabled3['_currentSrc']) return;
  const enabled4 = enabled3['_ensureVideoElement']();
  if (!enabled4) return;
  ((enabled3['_isManualControl'] = !![]),
    enabled3['_syncPlaybackChromeVisibility'](),
    enabled3['_syncRendererPlaybackPin'](),
    enabled3['_autoPlayToken']++);
  if (enabled4['paused'] || forcePlay === !![]) {
    ((enabled3['_hoverManualPause'] = ![]), enabled3['_setManualLoopPlayback'](loop === !![]));
    const item = enabled3['_getBaseDuration'](),
      key = enabled3['_getClipRange'](item);
    if (key['active']) {
      const index = enabled4['currentTime'] || 0x0;
      (index < key['start'] || index > key['end']) && (enabled4['currentTime'] = key['start']);
    } else enabled4['ended'] === !![] && (enabled4['currentTime'] = 0x0);
    void enabled3['_playVideoWithRecovery']('manual', () => enabled3['_isManualControl'])['then'](
      (result) => {
        result
          ? enabled3['_flashCenterIndicator']('play')
          : (enabled3['_setManualLoopPlayback'](![]),
            enabled3['_syncPlaybackChromeVisibility'](),
            enabled3['_syncRendererPlaybackPin']());
      },
    );
    return;
  }
  ((enabled3['_hoverManualPause'] = !![]),
    enabled3['_setManualLoopPlayback'](![]),
    enabled4['pause'](),
    enabled3['_flashCenterIndicator']('pause'),
    enabled3['_syncRendererPlaybackPin']());
}
