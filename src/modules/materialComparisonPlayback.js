import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
  isMediaElementPlaybackSource,
} from '../services/desktopMediaBlobSource.js';
import {
  claimExternalVideoPlayback,
  releaseExternalVideoPlayback,
} from '../components/shared/hoverVideoPlaybackLifecycle.js';
import {
  bindWorkspaceVideoVolumeControls,
  createWorkspaceVideoPlaybackControls,
} from './workspaceVideoPlaybackControls.js';
const PLAYBACK_SYNC_DRIFT_SECONDS = 0.12,
  VIDEO_CURRENT_DATA_READY_STATE = 0x2,
  VIDEO_PLAYBACK_READY_STATE = 0x3,
  LOOP_ICON =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>',
  PANEL_VOLUME_ICON =
    '<svg class="v2-material-comparison-panel-volume-icon is-unmuted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18 6a8.5 8.5 0 0 1 0 12"></path></svg>',
  PANEL_MUTED_ICON =
    '<svg class="v2-material-comparison-panel-volume-icon is-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"></path><path d="m16 9 5 5"></path><path d="m21 9-5 5"></path></svg>';
function clamp(value, item, key) {
  const index = Number(value);
  if (!Number['isFinite'](index)) return item;
  return Math['min'](key, Math['max'](item, index));
}
function formatPlaybackTime(result) {
  const data = Math['max'](0x0, Number(result) || 0x0),
    options = Math['floor'](data / 0x3c),
    target = Math['floor'](data % 0x3c);
  return options + ':' + String(target)['padStart'](0x2, '0');
}
function setPanelError(source) {
  ((source['playbackReady'] = ![]),
    (source['playbackFailed'] = !![]),
    (source['image']['hidden'] = !![]),
    (source['video']['hidden'] = !![]),
    source['panel']['classList']['remove']('is-loading'),
    source['panel']['classList']['add']('is-error'),
    source['panel']['setAttribute']('aria-busy', 'false'));
}
function setPanelVideoPending(next, current) {
  const enabled = String(current || '')['trim']();
  ((next['playbackReady'] = ![]), (next['playbackFailed'] = ![]));
  if (enabled) next['video']['setAttribute']('poster', enabled);
  else next['video']['removeAttribute']?.('poster');
  (next['panel']['classList']['toggle']('is-loading', !enabled),
    next['panel']['classList']['remove']('is-error'),
    next['panel']['setAttribute']('aria-busy', 'true'));
}
function revealPanelVideoFrame(entry) {
  if (Number(entry?.['video']?.['readyState'] || 0x0) < VIDEO_CURRENT_DATA_READY_STATE) return ![];
  return (
    entry['video']['removeAttribute']?.('poster'),
    (entry['video']['poster'] = ''),
    entry['panel']['classList']['remove']('is-loading', 'is-error'),
    !![]
  );
}
function setPanelReady(record) {
  (revealPanelVideoFrame(record),
    (record['playbackReady'] = !![]),
    (record['playbackFailed'] = ![]),
    record['panel']['classList']['remove']('is-loading', 'is-error'),
    record['panel']['setAttribute']('aria-busy', 'false'));
}
function setButtonLabel(el, payload) {
  if (!el) return;
  (el['setAttribute']('aria-label', payload), el['setAttribute']('data-tooltip', payload));
}
function captureAttribute(handle, state) {
  const value2 = handle?.['getAttribute']?.(state) || '',
    present = typeof handle?.['hasAttribute'] === 'function' ? handle['hasAttribute'](state) : value2 !== '';
  return { present: present, value: value2 };
}
function restoreAttribute(el2, config, el3) {
  if (!el2 || !el3) return;
  if (el3['present']) el2['setAttribute']?.(config, el3['value']);
  else el2['removeAttribute']?.(config);
}
function createLoopButton(el4, scope) {
  const el5 = el4?.['createElement']?.('button');
  if (!el5) return null;
  return (
    (el5['type'] = 'button'),
    (el5['className'] = 'v2-material-comparison-loop-button'),
    (el5['innerHTML'] = LOOP_ICON),
    el5['setAttribute']('aria-pressed', 'false'),
    el5['setAttribute']('data-material-comparison-loop', ''),
    setButtonLabel(el5, scope),
    el5
  );
}
function createPanelMuteButton(el6, input, output, value3) {
  const el7 = el6?.['createElement']?.('button');
  if (!el7) return null;
  return (
    (el7['type'] = 'button'),
    (el7['className'] = 'v2-material-comparison-panel-mute'),
    (el7['innerHTML'] = '' + PANEL_VOLUME_ICON + PANEL_MUTED_ICON),
    (el7['hidden'] = !![]),
    (el7['tabIndex'] = -0x1),
    el7['setAttribute']('tabindex', '-1'),
    el7['setAttribute']('aria-pressed', 'false'),
    el7['setAttribute']('data-material-comparison-panel-mute', output),
    setButtonLabel(el7, value3),
    input['panel']['appendChild'](el7),
    (input['muteButton'] = el7),
    el7
  );
}
export function createMaterialComparisonPlaybackController({
  documentObject: documentObject,
  windowObject: windowObject,
  translate: translate,
  overlay: overlay,
  leftPanel: leftPanel,
  rightPanel: rightPanel,
  leftSlot: leftSlot = 'left',
  rightSlot: rightSlot = 'right',
  videoKind: videoKind = 'video',
  getActiveEntry: getActiveEntry,
  onMediaAspect: onMediaAspect,
  onGeometryChange: onGeometryChange,
  videoElementResolver: videoElementResolver = () => null,
  attachVideoSource: attachVideoSource = attachMediaElementPlaybackSource,
  playVideo: playVideo = (value4) => value4?.['play']?.(),
} = {}) {
  const list = [
      [leftSlot, leftPanel],
      [rightSlot, rightPanel],
    ],
    side = (value5) => translate('canvasInteraction.materialComparison.' + value5),
    handler = (value6, value7) =>
      translate(
        value7
          ? 'canvasInteraction.materialComparison.unmutePanelVideo'
          : 'canvasInteraction.materialComparison.mutePanelVideo',
        { side: side(value6) },
      ),
    afterPlay = createLoopButton(
      documentObject,
      translate('canvasInteraction.materialComparison.enableLoop'),
    ),
    value8 = Object['freeze']({ kind: 'material-comparison' });
  for (const [value9, value10] of list) {
    ((value10['fallbackVideo'] = value10['video']),
      (value10['borrowedVideoLease'] = null),
      (value10['unbindVideoEvents'] = null),
      (value10['video']['loop'] = ![]),
      createPanelMuteButton(documentObject, value10, value9, handler(value9, ![])));
  }
  const volumeSlider = createWorkspaceVideoPlaybackControls(documentObject, {
      className: 'v2-material-comparison-playback-controls',
      label: translate('canvasInteraction.materialComparison.playbackLabel'),
      controlsAttributes: { 'data-material-comparison-playback-controls': !![] },
      playAttributes: { 'data-material-comparison-playback': !![] },
      currentTimeAttributes: { 'data-material-comparison-current-time': !![] },
      progressAttributes: { 'data-material-comparison-progress': !![] },
      progressFillAttributes: { 'data-material-comparison-progress-fill': !![] },
      totalTimeAttributes: { 'data-material-comparison-total-time': !![] },
      volumeAttributes: { 'data-material-comparison-volume': !![] },
      volumeToggleAttributes: { 'data-material-comparison-volume-toggle': !![] },
      playLabel: translate('canvasInteraction.materialComparison.playVideos'),
      progressLabel: translate('canvasInteraction.materialComparison.playbackProgress'),
      volumeLabel: translate('canvasInteraction.materialComparison.volume'),
      volumeToggleLabel: translate('canvasInteraction.materialComparison.toggleMute'),
      slots: { afterPlay: afterPlay },
    }),
    root = volumeSlider?.['root'] || null;
  root && ((root['hidden'] = !![]), root['setAttribute']('aria-hidden', 'true'));
  let enabled2 = ![],
    value11 = 0x0,
    value12 = null,
    enabled3 = ![],
    enabled4 = ![],
    value13 = ![],
    bindWorkspaceVideoVolumeControls2 = null;
  const getMediaElements = () => [leftPanel['video'], rightPanel['video']],
    handler2 = (value14) =>
      value14?.['borrowedVideoLease'] ? VIDEO_CURRENT_DATA_READY_STATE : VIDEO_PLAYBACK_READY_STATE,
    handler3 = () =>
      getActiveEntry(leftSlot)?.['kind'] === videoKind && getActiveEntry(rightSlot)?.['kind'] === videoKind,
    handler4 = () =>
      handler3() &&
      list['every'](
        ([, value15]) =>
          value15['playbackReady'] === !![] &&
          Number(value15['video']?.['readyState'] || 0x0) >= handler2(value15),
      ),
    handler5 = () => {
      const list2 = getMediaElements()
        ['map']((value16) => Number(value16?.['duration'] || 0x0))
        ['filter']((count) => Number['isFinite'](count) && count > 0x0);
      return list2['length'] > 0x0 ? Math['min'](...list2) : 0x0;
    },
    handler6 = (value17, value18) => {
      const el8 = value17?.['muteButton'];
      if (!el8) return;
      ((el8['hidden'] = value18 !== !![]),
        (el8['tabIndex'] = value18 === !![] ? 0x0 : -0x1),
        el8['setAttribute']('tabindex', value18 === !![] ? '0' : '-1'));
    },
    onChange = () => {
      for (const [value19, value20] of list) {
        const value21 = value20['video']['muted'] === !![],
          el9 = value20['muteButton'];
        (el9?.['classList']['toggle']('is-muted', value21),
          el9?.['setAttribute']('aria-pressed', String(value21)),
          setButtonLabel(el9, handler(value19, value21)));
      }
    },
    handler7 = () => {
      (onChange(), bindWorkspaceVideoVolumeControls2?.['sync']());
    },
    handler8 = () => {
      if (!afterPlay) return;
      (afterPlay['classList']['toggle']('is-active', enabled3),
        afterPlay['setAttribute']('aria-pressed', String(enabled3)),
        setButtonLabel(
          afterPlay,
          translate(
            enabled3
              ? 'canvasInteraction.materialComparison.disableLoop'
              : 'canvasInteraction.materialComparison.enableLoop',
          ),
        ));
    },
    updatePresentation = () => {
      if (enabled2 || !volumeSlider) return;
      const [value22, value23] = getMediaElements(),
        count2 = handler5(),
        clamp2 = clamp(
          Number(value22?.['currentTime'] || value23?.['currentTime'] || 0x0),
          0x0,
          count2 || Number['MAX_SAFE_INTEGER'],
        ),
        value24 = count2 > 0x0 ? clamp((clamp2 / count2) * 0x64, 0x0, 0x64) : 0x0,
        value25 =
          handler3() &&
          getMediaElements()['some']((value26) => value26?.['paused'] === ![] && value26?.['ended'] !== !![]);
      (volumeSlider['playButton']['classList']['toggle']('is-playing', value25),
        volumeSlider['playButton']['setAttribute']('aria-pressed', String(value25)),
        volumeSlider['playButton']['setAttribute'](
          'aria-label',
          translate(
            value25
              ? 'canvasInteraction.materialComparison.pauseVideos'
              : 'canvasInteraction.materialComparison.playVideos',
          ),
        ),
        (volumeSlider['currentTime']['textContent'] = formatPlaybackTime(clamp2)),
        (volumeSlider['totalTime']['textContent'] = formatPlaybackTime(count2)),
        volumeSlider['progressFill']['style']['setProperty']('width', value24 + '%'),
        volumeSlider['progress']['setAttribute']('aria-valuenow', String(Math['round'](value24))),
        handler7(),
        handler8());
    },
    handler9 = () => {
      if (!volumeSlider || !root) return;
      const enabled5 = handler3(),
        enabled6 = enabled5 && list['some'](([, value27]) => value27['playbackFailed'] === !![]),
        value28 = value13 || (enabled5 && !enabled6 && !handler4());
      (root['classList']['toggle']('is-loading', value28),
        root['setAttribute']('aria-busy', String(value28)),
        volumeSlider['playButton']['setAttribute']('aria-busy', String(value28)),
        (volumeSlider['playButton']['disabled'] = !enabled5 || enabled6 || value28));
    },
    handler10 = (value29) => {
      ((value13 = value29 === !![]), handler9());
    },
    handler11 = (value30, value31) => {
      const value32 = getActiveEntry(value30),
        value33 = String(value32?.['sourceUrl'] || '')['trim']();
      return (
        value32?.['kind'] === videoKind &&
        value31['entryKind'] === videoKind &&
        value31['sourceUrl'] === value33 &&
        isMediaElementPlaybackSource(value31['video'], value33)
      );
    },
    handler12 = (value34, value35) => {
      if (enabled2 || !handler11(value34, value35)) return ![];
      const count3 = Number(value35['video']?.['readyState'] || 0x0);
      return (
        count3 >= 0x1 && onMediaAspect(value34, value35, value35['video']),
        count3 >= VIDEO_CURRENT_DATA_READY_STATE && revealPanelVideoFrame(value35),
        count3 >= handler2(value35)
          ? setPanelReady(value35)
          : ((value35['playbackReady'] = ![]), value35['panel']['setAttribute']('aria-busy', 'true')),
        handler9(),
        updatePresentation(),
        value35['playbackReady'] === !![]
      );
    },
    pause = () => {
      ((value11 += 0x1), (enabled4 = ![]));
      for (const value36 of getMediaElements()) {
        try {
          value36?.['pause']?.();
        } catch {}
      }
      (handler10(![]), updatePresentation());
    },
    handler13 = (el10) => {
      const el11 = el10?.['video'];
      if (!el11) return;
      try {
        el11['pause']?.();
      } catch {}
      ((el11['controls'] = el10['controls']),
        (el11['loop'] = el10['loop']),
        (el11['muted'] = el10['muted']),
        (el11['volume'] = el10['volume']),
        (el11['hidden'] = el10['hidden']),
        (el11['playsInline'] = el10['playsInline']));
      !el10['hadComparisonClass'] && el11['classList']?.['remove']?.('v2-material-comparison-video');
      (restoreAttribute(el11, 'style', el10['styleAttribute']),
        restoreAttribute(el11, 'poster', el10['posterAttribute']));
      if (el10['parent']) {
        const value37 = el10['nextSibling']?.['parentNode'] === el10['parent'] ? el10['nextSibling'] : null;
        try {
          el10['parent']['insertBefore'](el11, value37);
        } catch {
          try {
            el10['parent']['appendChild'](el11);
          } catch {}
        }
      } else el11['remove']?.();
      releaseExternalVideoPlayback(el11, value8);
    },
    handler14 = (value38, value39) => {
      const enabled7 = value39['borrowedVideoLease'];
      if (!enabled7) return ![];
      return (
        value39['unbindVideoEvents']?.(),
        (value39['unbindVideoEvents'] = null),
        (value39['borrowedVideoLease'] = null),
        (value39['video'] = value39['fallbackVideo']),
        handler13(enabled7),
        !enabled2 && (value39['unbindVideoEvents'] = run(value38, value39)),
        !![]
      );
    },
    handler15 = (value40, value41, video) => {
      if (!video || video === value41['fallbackVideo']) return ![];
      const value42 = {
        video: video,
        parent: video['parentNode'] || null,
        nextSibling: video['nextSibling'] || null,
        controls: video['controls'],
        loop: video['loop'],
        muted: video['muted'],
        volume: video['volume'],
        hidden: video['hidden'],
        playsInline: video['playsInline'],
        hadComparisonClass: video['classList']?.['contains']?.('v2-material-comparison-video') === !![],
        styleAttribute: captureAttribute(video, 'style'),
        posterAttribute: captureAttribute(video, 'poster'),
      };
      if (!claimExternalVideoPlayback(video, value8)) return ![];
      try {
        video['pause']?.();
      } catch {}
      ((video['controls'] = ![]),
        (video['loop'] = ![]),
        (video['muted'] = ![]),
        (video['volume'] = 0x1),
        (video['hidden'] = ![]),
        (video['playsInline'] = !![]),
        video['removeAttribute']?.('style'),
        video['classList']?.['add']?.('v2-material-comparison-video'),
        (value41['fallbackVideo']['hidden'] = !![]),
        value41['unbindVideoEvents']?.(),
        (value41['unbindVideoEvents'] = null));
      try {
        typeof value41['panel']['insertBefore'] === 'function'
          ? value41['panel']['insertBefore'](video, value41['badge'] || null)
          : value41['panel']['appendChild'](video);
        if (video['parentNode'] !== value41['panel']) throw new Error('move failed');
      } catch {
        return (
          handler13(value42),
          (value41['video'] = value41['fallbackVideo']),
          (value41['unbindVideoEvents'] = run(value40, value41)),
          ![]
        );
      }
      return (
        (value41['video'] = video),
        (value41['borrowedVideoLease'] = value42),
        (value41['unbindVideoEvents'] = run(value40, value41)),
        !![]
      );
    },
    handler16 = (value43, value44, value45) => {
      if (
        value44['borrowedVideoLease'] &&
        value44['sourceUrl'] === value45 &&
        isMediaElementPlaybackSource(value44['video'], value45)
      )
        return value44['video'];
      let videoElementResolver2 = null;
      try {
        videoElementResolver2 = videoElementResolver(value43) || null;
      } catch {}
      if (!videoElementResolver2 || videoElementResolver2 === value44['fallbackVideo']) return null;
      if (
        list['some'](
          ([, value46]) =>
            value46 !== value44 &&
            value46['borrowedVideoLease'] &&
            value46['video'] === videoElementResolver2,
        )
      )
        return null;
      return isMediaElementPlaybackSource(videoElementResolver2, value45) ? videoElementResolver2 : null;
    },
    handler17 = (value47) => {
      const el12 = value47['fallbackVideo'],
        value48 = !!String(el12?.['currentSrc'] || el12?.['src'] || el12?.['getAttribute']?.('src') || '')[
          'trim'
        ]();
      try {
        el12['pause']?.();
      } catch {}
      (clearDesktopMediaPlaybackSourceMetadata(el12), el12['removeAttribute']?.('src'));
      if (value48)
        try {
          el12['load']?.();
        } catch {}
      (el12['removeAttribute']?.('poster'),
        (el12['poster'] = ''),
        (el12['loop'] = ![]),
        (el12['muted'] = ![]),
        (el12['hidden'] = !![]));
    },
    clearPanelSource = (value49) => {
      const value50 = value49 === leftPanel ? leftSlot : rightSlot;
      ((value49['attachToken'] += 0x1),
        (value49['sourceUrl'] = ''),
        (value49['playbackReady'] = ![]),
        (value49['playbackFailed'] = ![]));
      try {
        value49['video']['pause']?.();
      } catch {}
      (handler14(value50, value49),
        handler17(value49),
        value49['panel']['classList']['remove']('is-loading', 'is-error'),
        value49['panel']['setAttribute']('aria-busy', 'false'),
        handler6(value49, ![]),
        handler7(),
        handler9());
    },
    setPanelSource = (value51, value52, value53) => {
      if (enabled2) return;
      const { image: image } = value52,
        enabled8 = String(value53?.['sourceUrl'] || '')['trim']();
      let value54 = enabled8 ? handler16(value53, value52, enabled8) : null;
      const value55 = value54 || value52['fallbackVideo'],
        enabled9 =
          value52['video'] === value55 &&
          value52['sourceUrl'] === enabled8 &&
          isMediaElementPlaybackSource(value55, enabled8);
      !enabled9 && ((value52['playbackReady'] = ![]), (value52['playbackFailed'] = ![]));
      (pause(),
        (image['hidden'] = !![]),
        image['removeAttribute']?.('src'),
        (value52['entryKind'] = value53['kind']));
      if (!enabled8) {
        (clearPanelSource(value52),
          (value52['entryKind'] = value53['kind']),
          setPanelError(value52),
          handler6(value52, ![]),
          handler9());
        return;
      }
      if (!enabled9) clearPanelSource(value52);
      value52['entryKind'] = value53['kind'];
      value54 && value52['video'] !== value54 && !handler15(value51, value52, value54) && (value54 = null);
      const el13 = value52['video'];
      el13['hidden'] = ![];
      if (value54) {
        value52['sourceUrl'] = enabled8;
        Number(el13['readyState'] || 0x0) < VIDEO_CURRENT_DATA_READY_STATE &&
          setPanelVideoPending(value52, value53?.['thumbnailUrl']);
        handler12(value51, value52);
        return;
      }
      if (enabled9) {
        handler12(value51, value52);
        return;
      }
      (setPanelVideoPending(value52, value53?.['thumbnailUrl']),
        handler9(),
        (value52['sourceUrl'] = enabled8));
      const value56 = ++value52['attachToken'];
      void Promise['resolve'](
        attachVideoSource(el13, enabled8, {
          preload: 'auto',
          load: !![],
          shouldAssign: () =>
            !enabled2 && value52['attachToken'] === value56 && getActiveEntry(value51) === value53,
        }),
      )
        ['then']((value57) => {
          if (enabled2 || value52['attachToken'] !== value56 || getActiveEntry(value51) !== value53) return;
          if (!String(value57 || '')['trim']() && !el13['src'] && !el13['currentSrc']) {
            (setPanelError(value52), handler6(value52, ![]), handler9());
            return;
          }
          handler12(value51, value52);
        })
        ['catch'](() => {
          !enabled2 &&
            value52['attachToken'] === value56 &&
            getActiveEntry(value51) === value53 &&
            (setPanelError(value52), handler6(value52, ![]), handler9());
        });
    },
    syncVisibility = () => {
      if (enabled2) return;
      const enabled10 = handler3();
      overlay['dataset']['comparisonKind'] = enabled10 ? videoKind : 'image';
      for (const [, value58] of list) {
        handler6(value58, enabled10);
      }
      if (!root) {
        onGeometryChange?.();
        return;
      }
      if (!enabled10) pause();
      ((root['hidden'] = !enabled10),
        root['setAttribute']('aria-hidden', String(!enabled10)),
        handler9(),
        updatePresentation(),
        onGeometryChange?.());
    },
    handler18 = (value59) => {
      const count4 = handler5();
      if (!(count4 > 0x0)) return ![];
      const clamp3 = clamp(value59, 0x0, count4);
      for (const value60 of getMediaElements()) {
        try {
          value60['currentTime'] = clamp3;
        } catch {}
      }
      return (updatePresentation(), !![]);
    },
    handler19 = (event) => {
      if (!volumeSlider || !handler3()) return ![];
      const box = volumeSlider['progress']['getBoundingClientRect']?.(),
        count5 = Number(box?.['width'] || 0x0);
      if (!(count5 > 0x0)) return ![];
      const clamp4 = clamp(
        (Number(event?.['clientX'] || 0x0) - Number(box?.['left'] || 0x0)) / count5,
        0x0,
        0x1,
      );
      return handler18(handler5() * clamp4);
    };
  function run2(event2) {
    if (value12 === null) return;
    if (event2?.['pointerId'] != null && event2['pointerId'] !== value12) return;
    (event2?.['preventDefault']?.(),
      event2?.['stopPropagation']?.(),
      windowObject?.['removeEventListener']?.('pointermove', run3, !![]),
      windowObject?.['removeEventListener']?.('pointerup', run2, !![]),
      windowObject?.['removeEventListener']?.('pointercancel', run2, !![]),
      (value12 = null));
  }
  function run3(event3) {
    if (value12 === null) return;
    if (event3?.['pointerId'] != null && event3['pointerId'] !== value12) return;
    (event3['preventDefault']?.(), event3['stopPropagation']?.(), handler19(event3));
  }
  const value61 = (event4) => {
      if (event4?.['button'] != null && event4['button'] !== 0x0) return;
      if (!handler19(event4)) return;
      (event4['preventDefault']?.(),
        event4['stopPropagation']?.(),
        run2(),
        (value12 = event4?.['pointerId'] ?? 0x0),
        windowObject?.['addEventListener']?.('pointermove', run3, !![]),
        windowObject?.['addEventListener']?.('pointerup', run2, !![]),
        windowObject?.['addEventListener']?.('pointercancel', run2, !![]));
    },
    value62 = (event5) => {
      if (event5['key'] !== 'ArrowLeft' && event5['key'] !== 'ArrowRight') return;
      const value63 = Number(leftPanel['video']['currentTime'] || 0x0);
      if (!handler18(value63 + (event5['key'] === 'ArrowRight' ? 0x1 : -0x1))) return;
      (event5['preventDefault']?.(), event5['stopPropagation']?.());
    },
    handler20 = async (value64, { busy: busy = ![] } = {}) => {
      if (enabled2 || !handler4()) return ![];
      const list3 = getMediaElements();
      for (const value65 of list3) {
        try {
          value65['currentTime'] = value64;
        } catch {}
      }
      const value66 = ++value11;
      if (busy) handler10(!![]);
      const list4 = await Promise['all'](
        list3['map']((value67) =>
          Promise['resolve']()
            ['then'](() => playVideo(value67))
            ['then'](() => !![])
            ['catch'](() => ![]),
        ),
      );
      if (enabled2 || value66 !== value11) return ![];
      if (busy) handler10(![]);
      if (!list4['every'](Boolean)) return (pause(), ![]);
      return (updatePresentation(), !![]);
    },
    togglePlayback = async (event6) => {
      (event6?.['preventDefault']?.(), event6?.['stopPropagation']?.());
      if (enabled2 || !handler3()) return;
      const list5 = getMediaElements();
      if (list5['some']((value68) => value68?.['paused'] === ![] && value68?.['ended'] !== !![])) {
        pause();
        return;
      }
      if (!handler4()) {
        handler9();
        return;
      }
      const count6 = handler5();
      let value69 = Math['max'](0x0, Number(leftPanel['video']['currentTime'] || 0x0));
      if (count6 > 0x0 && value69 >= count6 - 0.05) value69 = 0x0;
      await handler20(value69, { busy: !![] });
    },
    handler21 = async () => {
      if (enabled2 || !enabled3 || enabled4 || !handler3()) return;
      enabled4 = !![];
      try {
        await handler20(0x0);
      } finally {
        enabled4 = ![];
      }
    },
    value70 = () => {
      if (enabled3) {
        void handler21();
        return;
      }
      pause();
    },
    value71 = () => {
      if (!handler3()) return;
      const value72 = Number(leftPanel['video']['currentTime'] || 0x0),
        value73 = Number(rightPanel['video']['currentTime'] || 0x0);
      if (
        Number['isFinite'](value72) &&
        Number['isFinite'](value73) &&
        Math['abs'](value72 - value73) > PLAYBACK_SYNC_DRIFT_SECONDS &&
        rightPanel['video']['seeking'] !== !![]
      )
        try {
          rightPanel['video']['currentTime'] = value72;
        } catch {}
      updatePresentation();
    },
    handler22 = (event7, value74) => {
      (event7?.['preventDefault']?.(), event7?.['stopPropagation']?.());
      if (enabled2 || value74?.['entryKind'] !== videoKind) return;
      ((value74['video']['muted'] = value74['video']['muted'] !== !![]), handler7());
    },
    value75 = (event8) => {
      (event8?.['preventDefault']?.(), event8?.['stopPropagation']?.());
      if (enabled2) return;
      ((enabled3 = !enabled3), handler8());
    };
  function run(value76, value77) {
    const el14 = value77['video'];
    if (!el14?.['addEventListener']) return () => {};
    const value78 = () => {
        if (!handler12(value76, value77)) return;
        handler6(value77, handler3());
      },
      value79 = () => {
        !enabled2 &&
          handler11(value76, value77) &&
          (setPanelError(value77), handler6(value77, ![]), handler9());
      },
      value80 = [
        ['loadedmetadata', value78],
        ['loadeddata', value78],
        ['canplay', value78],
        ['error', value79],
        ['play', updatePresentation],
        ['pause', updatePresentation],
        ['ended', value70],
        ['durationchange', updatePresentation],
        ['volumechange', handler7],
        ['timeupdate', value76 === leftSlot ? value71 : updatePresentation],
      ];
    for (const [value81, value82] of value80) {
      el14['addEventListener'](value81, value82);
    }
    return () => {
      for (const [value83, value84] of value80) {
        el14['removeEventListener']?.(value83, value84);
      }
    };
  }
  for (const [value85, value86] of list) {
    ((value86['unbindVideoEvents'] = run(value85, value86)),
      value86['muteButton']?.['addEventListener']('pointerdown', (event9) => {
        event9?.['stopPropagation']?.();
      }),
      value86['muteButton']?.['addEventListener']('click', (value87) => {
        handler22(value87, value86);
      }));
  }
  volumeSlider &&
    ((bindWorkspaceVideoVolumeControls2 = bindWorkspaceVideoVolumeControls({
      volumeSlider: volumeSlider['volume'],
      volumeToggle: volumeSlider['volumeToggle'],
      getMediaElements: getMediaElements,
      onChange: onChange,
    })),
    volumeSlider['playButton']['addEventListener']('click', togglePlayback),
    volumeSlider['progress']['addEventListener']('pointerdown', value61),
    volumeSlider['progress']['addEventListener']('keydown', value62),
    afterPlay?.['addEventListener']('click', value75));
  (handler7(), handler8());
  const dispose = () => {
    if (enabled2) return;
    ((enabled2 = !![]),
      (value11 += 0x1),
      run2(),
      pause(),
      clearPanelSource(leftPanel),
      clearPanelSource(rightPanel),
      bindWorkspaceVideoVolumeControls2?.['dispose']());
  };
  return Object['freeze']({
    root: root,
    controls: volumeSlider,
    setPanelSource: setPanelSource,
    clearPanelSource: clearPanelSource,
    syncVisibility: syncVisibility,
    pause: pause,
    togglePlayback: togglePlayback,
    updatePresentation: updatePresentation,
    dispose: dispose,
  });
}
