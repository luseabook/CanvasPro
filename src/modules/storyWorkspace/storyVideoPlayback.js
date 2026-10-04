import { createWorkspaceVideoPlayback, createWorkspaceVideoProgressLoop } from '../workspaceVideoPlayback.js';
import { bindWorkspaceVideoVolumeControls } from '../workspaceVideoPlaybackControls.js';
export const createStoryVideoProgressLoop = createWorkspaceVideoProgressLoop;
const STORY_VIDEO_PLAYBACK_ACQUIRE_OPTIONS = Object['freeze']({
  maxBytes: 0x40 * 0x400 * 0x400,
  timeout: 0x1388,
});
let storyVideoPlaybackLeaseSequence = 0x0;
function createStoryVideoPlaybackLeaseOwnerId(value) {
  const enabled = String(value || '')['trim']();
  if (!enabled) return '';
  return ((storyVideoPlaybackLeaseSequence += 0x1), enabled + ':lease:' + storyVideoPlaybackLeaseSequence);
}
export function createStoryVideoPlayback(args = {}) {
  const item = String(args?.['ownerId'] || '')['trim'](),
    diagnosticsLabel = String(args?.['diagnosticsLabel'] || '')['trim']() || 'story-video:' + item;
  return createWorkspaceVideoPlayback({
    acquirePlaybackOptions: STORY_VIDEO_PLAYBACK_ACQUIRE_OPTIONS,
    ...args,
    diagnosticsLabel: diagnosticsLabel,
    ownerId: createStoryVideoPlaybackLeaseOwnerId(item),
  });
}
export function formatStoryVideoPlaybackTime(key) {
  const index = Math['max'](0x0, Number(key) || 0x0),
    result = Math['floor'](index / 0x3c),
    data = Math['floor'](index % 0x3c);
  return result + ':' + String(data)['padStart'](0x2, '0');
}
export function bindStoryVideoPreviewPlayer(
  el,
  { projectId: projectId = 'project', episodeId: episodeId = 'episode', clipId: clipId = 'clip' } = {},
) {
  const videoEl = el?.['querySelector']?.('[data-story-video-player]'),
    el2 = el?.['querySelector']?.('[data-story-video-controls]');
  if (!videoEl || !el2) return null;
  const el3 = el2['querySelector']('[data-story-video-play]'),
    volumeSlider = el2['querySelector']('[data-story-video-volume]'),
    volumeToggle = el2['querySelector']('[data-story-video-volume-toggle]'),
    el4 = el2['querySelector']('[data-story-video-progress]'),
    el5 = el2['querySelector']('[data-story-video-progress-fill]'),
    el6 = el2['querySelector']('[data-story-video-time-current]'),
    el7 = el2['querySelector']('[data-story-video-time-total]');
  let options = ![],
    target = ![],
    source = null;
  const next = Math['max'](
      0x0,
      Math['trunc'](
        Number(
          videoEl['closest']?.('[data-story-video-result-index]')?.['dataset']?.['storyVideoResultIndex'],
        ) || 0x0,
      ),
    ),
    storyVideoPlayback = createStoryVideoPlayback({
      videoEl: videoEl,
      sourceUrl: videoEl['dataset']['storyVideoUrl'],
      ownerId: [
        'story-workspace',
        String(projectId || '')['trim']() || 'project',
        String(episodeId || '')['trim']() || 'episode',
        String(clipId || '')['trim']() || 'clip',
        next,
      ]['join'](':'),
    }),
    handler = () => {
      const count = Number(videoEl['duration']),
        count2 = Number(videoEl['currentTime']),
        duration = Number['isFinite'](count) && count > 0x0 ? count : 0x0,
        currentTime =
          Number['isFinite'](count2) && count2 > 0x0 ? Math['min'](count2, duration || count2) : 0x0;
      return {
        duration: duration,
        currentTime: currentTime,
        ratio: duration > 0x0 ? Math['max'](0x0, Math['min'](0x1, currentTime / duration)) : 0x0,
      };
    },
    handler2 = ({ duration: duration2, currentTime: currentTime2, ratio: ratio }) => {
      if (el6) el6['textContent'] = formatStoryVideoPlaybackTime(currentTime2);
      if (el7) el7['textContent'] = formatStoryVideoPlaybackTime(duration2);
      if (el5) el5['style']['width'] = ratio * 0x64 + '%';
      (el4?.['setAttribute']('aria-valuenow', String(Math['round'](ratio * 0x64))),
        el4?.['setAttribute'](
          'aria-valuetext',
          formatStoryVideoPlaybackTime(currentTime2) + '\x20/\x20' + formatStoryVideoPlaybackTime(duration2),
        ));
    },
    onFrame = () => {
      if (options || source != null) return;
      handler2(handler());
    },
    bindWorkspaceVideoVolumeControls2 = bindWorkspaceVideoVolumeControls({
      volumeSlider: volumeSlider,
      volumeToggle: volumeToggle,
      getMediaElements: () => [videoEl],
      getToggleLabel: (current) => (current ? '恢复视频' : '静音视频'),
    }),
    handler3 = () => {
      if (options) return;
      const entry = videoEl['paused'] === ![] && videoEl['ended'] !== !![];
      (el3?.['classList']['toggle']('is-playing', entry),
        el3?.['setAttribute']('aria-label', entry ? '暂停视频' : '播放视频'),
        el3?.['setAttribute']('title', entry ? '暂停视频' : '播放视频'),
        bindWorkspaceVideoVolumeControls2['sync'](),
        onFrame());
    },
    storyVideoProgressLoop = createStoryVideoProgressLoop({ videoEl: videoEl, onFrame: onFrame }),
    handler4 = async (event) => {
      (event?.['preventDefault']?.(), event?.['stopPropagation']?.());
      if (videoEl['paused'] === ![]) {
        videoEl['pause']?.();
        return;
      }
      if (videoEl['ended']) videoEl['currentTime'] = 0x0;
      (await storyVideoPlayback['play'](), handler3());
    },
    handler5 = (record) => {
      const duration3 = Number(videoEl['duration']),
        box = el4?.['getBoundingClientRect']?.();
      if (!(duration3 > 0x0) || !box?.['width']) return ![];
      const currentTime3 = Math['max'](0x0, Math['min'](0x1, (Number(record) - box['left']) / box['width']));
      return (
        (videoEl['currentTime'] = currentTime3 * duration3),
        handler2({ duration: duration3, currentTime: currentTime3 * duration3, ratio: currentTime3 }),
        !![]
      );
    },
    handler6 = () => {
      const payload = source;
      source = null;
      if (el4) el4['dataset']['dragging'] = 'false';
      if (payload == null) return;
      try {
        el4?.['releasePointerCapture']?.(payload);
      } catch {}
    },
    handle = (event2) => {
      (event2['preventDefault'](), event2['stopPropagation']());
      if (!handler5(event2['clientX'])) return;
      source = event2['pointerId'];
      if (el4) el4['dataset']['dragging'] = 'true';
      try {
        el4?.['setPointerCapture']?.(event2['pointerId']);
      } catch {}
    },
    state = (event3) => {
      if (event3['pointerId'] !== source) return;
      (event3['preventDefault'](), event3['stopPropagation'](), handler5(event3['clientX']));
    },
    config = (event4) => {
      if (event4['pointerId'] !== source) return;
      (event4['preventDefault'](),
        event4['stopPropagation'](),
        handler5(event4['clientX']),
        handler6(),
        handler3());
    },
    scope = (event5) => {
      if (event5['pointerId'] !== source) return;
      (event5['preventDefault'](), event5['stopPropagation'](), handler6(), handler3());
    },
    input = (event6) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End']['includes'](event6['key'])) return;
      const count3 = Number(videoEl['duration']);
      if (!(count3 > 0x0)) return;
      (event6['preventDefault'](), event6['stopPropagation']());
      if (event6['key'] === 'Home') videoEl['currentTime'] = 0x0;
      else {
        if (event6['key'] === 'End') videoEl['currentTime'] = count3;
        else {
          const output = event6['key'] === 'ArrowLeft' ? -0x5 : 0x5;
          videoEl['currentTime'] = Math['max'](0x0, Math['min'](count3, videoEl['currentTime'] + output));
        }
      }
      handler3();
    },
    value2 = (event7) => event7['stopPropagation'](),
    value3 = (event8) => {
      (event8['preventDefault'](), event8['stopPropagation'](), (target = !![]), void handler4());
    },
    value4 = (event9) => {
      (event9['preventDefault'](), event9['stopPropagation']());
      if (target) {
        target = ![];
        return;
      }
      void handler4();
    },
    list = ['play', 'pause', 'timeupdate', 'loadedmetadata', 'durationchange', 'volumechange', 'ended'];
  (el3?.['addEventListener']('pointerdown', value3),
    el3?.['addEventListener']('click', value4),
    videoEl['addEventListener']('click', handler4),
    el4?.['addEventListener']('pointerdown', handle),
    el4?.['addEventListener']('pointermove', state),
    el4?.['addEventListener']('pointerup', config),
    el4?.['addEventListener']('pointercancel', scope),
    el4?.['addEventListener']('keydown', input),
    el2['addEventListener']('pointerdown', value2));
  const value5 = (value6) => {
    handler3();
    if (value6['type'] === 'play') storyVideoProgressLoop['start']();
    else {
      if (value6['type'] === 'pause' || value6['type'] === 'ended') storyVideoProgressLoop['stop']();
    }
  };
  return (
    list['forEach']((value7) => videoEl['addEventListener'](value7, value5)),
    void storyVideoPlayback['warm']()['then'](() => {
      (handler3(), storyVideoProgressLoop['start']());
    }, handler3),
    handler3(),
    {
      destroy() {
        ((options = !![]),
          storyVideoProgressLoop['destroy'](),
          storyVideoPlayback['destroy'](),
          el3?.['removeEventListener']('pointerdown', value3),
          el3?.['removeEventListener']('click', value4),
          videoEl['removeEventListener']('click', handler4),
          bindWorkspaceVideoVolumeControls2['dispose'](),
          handler6(),
          el4?.['removeEventListener']('pointerdown', handle),
          el4?.['removeEventListener']('pointermove', state),
          el4?.['removeEventListener']('pointerup', config),
          el4?.['removeEventListener']('pointercancel', scope),
          el4?.['removeEventListener']('keydown', input),
          el2['removeEventListener']('pointerdown', value2),
          list['forEach']((value8) => videoEl['removeEventListener'](value8, value5)));
      },
    }
  );
}
