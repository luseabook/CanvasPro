import { createWorkspaceVideoPlayback, createWorkspaceVideoProgressLoop } from '../workspaceVideoPlayback.js';
import { bindWorkspaceVideoVolumeControls } from '../workspaceVideoPlaybackControls.js';
export const createStoryVideoProgressLoop = createWorkspaceVideoProgressLoop;
const STORY_VIDEO_PLAYBACK_ACQUIRE_OPTIONS = Object['freeze']({
  maxBytes: 0x40 * 0x400 * 0x400,
  timeout: 0x1388,
});
let storyVideoPlaybackLeaseSequence = 0x0;
function createStoryVideoPlaybackLeaseOwnerId(_0x5994ed) {
  const _0x37d56e = String(_0x5994ed || '')['trim']();
  if (!_0x37d56e) return '';
  return ((storyVideoPlaybackLeaseSequence += 0x1), _0x37d56e + ':lease:' + storyVideoPlaybackLeaseSequence);
}
export function createStoryVideoPlayback(_0x48ac5d = {}) {
  const _0x548bd4 = String(_0x48ac5d?.['ownerId'] || '')['trim'](),
    _0x269a5b = String(_0x48ac5d?.['diagnosticsLabel'] || '')['trim']() || 'story-video:' + _0x548bd4;
  return createWorkspaceVideoPlayback({
    acquirePlaybackOptions: STORY_VIDEO_PLAYBACK_ACQUIRE_OPTIONS,
    ..._0x48ac5d,
    diagnosticsLabel: _0x269a5b,
    ownerId: createStoryVideoPlaybackLeaseOwnerId(_0x548bd4),
  });
}
export function formatStoryVideoPlaybackTime(_0x283465) {
  const _0x34bbf7 = Math['max'](0x0, Number(_0x283465) || 0x0),
    _0x474c6f = Math['floor'](_0x34bbf7 / 0x3c),
    _0x504ba4 = Math['floor'](_0x34bbf7 % 0x3c);
  return _0x474c6f + ':' + String(_0x504ba4)['padStart'](0x2, '0');
}
export function bindStoryVideoPreviewPlayer(
  _0x1aea9f,
  { projectId: projectId = 'project', episodeId: episodeId = 'episode', clipId: clipId = 'clip' } = {},
) {
  const _0x22832c = _0x1aea9f?.['querySelector']?.('[data-story-video-player]'),
    _0x5c237e = _0x1aea9f?.['querySelector']?.('[data-story-video-controls]');
  if (!_0x22832c || !_0x5c237e) return null;
  const _0x49c3cd = _0x5c237e['querySelector']('[data-story-video-play]'),
    _0x4a930e = _0x5c237e['querySelector']('[data-story-video-volume]'),
    _0x3cff37 = _0x5c237e['querySelector']('[data-story-video-volume-toggle]'),
    _0x3ca839 = _0x5c237e['querySelector']('[data-story-video-progress]'),
    _0x508ab1 = _0x5c237e['querySelector']('[data-story-video-progress-fill]'),
    _0x4420d0 = _0x5c237e['querySelector']('[data-story-video-time-current]'),
    _0x5af13e = _0x5c237e['querySelector']('[data-story-video-time-total]');
  let _0x4b6833 = ![],
    _0x47f7ad = ![],
    _0x342f94 = null;
  const _0x2795b0 = Math['max'](
      0x0,
      Math['trunc'](
        Number(
          _0x22832c['closest']?.('[data-story-video-result-index]')?.['dataset']?.['storyVideoResultIndex'],
        ) || 0x0,
      ),
    ),
    _0x19f399 = createStoryVideoPlayback({
      videoEl: _0x22832c,
      sourceUrl: _0x22832c['dataset']['storyVideoUrl'],
      ownerId: [
        'story-workspace',
        String(projectId || '')['trim']() || 'project',
        String(episodeId || '')['trim']() || 'episode',
        String(clipId || '')['trim']() || 'clip',
        _0x2795b0,
      ]['join'](':'),
    }),
    _0x45d126 = () => {
      const _0x373039 = Number(_0x22832c['duration']),
        _0x21179a = Number(_0x22832c['currentTime']),
        _0x444879 = Number['isFinite'](_0x373039) && _0x373039 > 0x0 ? _0x373039 : 0x0,
        _0x36f0c4 =
          Number['isFinite'](_0x21179a) && _0x21179a > 0x0
            ? Math['min'](_0x21179a, _0x444879 || _0x21179a)
            : 0x0;
      return {
        duration: _0x444879,
        currentTime: _0x36f0c4,
        ratio: _0x444879 > 0x0 ? Math['max'](0x0, Math['min'](0x1, _0x36f0c4 / _0x444879)) : 0x0,
      };
    },
    _0x4e2111 = ({ duration: _0x282aac, currentTime: _0x78f202, ratio: _0x2f4dae }) => {
      if (_0x4420d0) _0x4420d0['textContent'] = formatStoryVideoPlaybackTime(_0x78f202);
      if (_0x5af13e) _0x5af13e['textContent'] = formatStoryVideoPlaybackTime(_0x282aac);
      if (_0x508ab1) _0x508ab1['style']['width'] = _0x2f4dae * 0x64 + '%';
      (_0x3ca839?.['setAttribute']('aria-valuenow', String(Math['round'](_0x2f4dae * 0x64))),
        _0x3ca839?.['setAttribute'](
          'aria-valuetext',
          formatStoryVideoPlaybackTime(_0x78f202) + '\x20/\x20' + formatStoryVideoPlaybackTime(_0x282aac),
        ));
    },
    _0x30af2a = () => {
      if (_0x4b6833 || _0x342f94 != null) return;
      _0x4e2111(_0x45d126());
    },
    _0x3c7c42 = bindWorkspaceVideoVolumeControls({
      volumeSlider: _0x4a930e,
      volumeToggle: _0x3cff37,
      getMediaElements: () => [_0x22832c],
      getToggleLabel: (_0x14d3b1) => (_0x14d3b1 ? '恢复视频' : '静音视频'),
    }),
    _0x4559f8 = () => {
      if (_0x4b6833) return;
      const _0x152fc6 = _0x22832c['paused'] === ![] && _0x22832c['ended'] !== !![];
      (_0x49c3cd?.['classList']['toggle']('is-playing', _0x152fc6),
        _0x49c3cd?.['setAttribute']('aria-label', _0x152fc6 ? '暂停视频' : '播放视频'),
        _0x49c3cd?.['setAttribute']('title', _0x152fc6 ? '暂停视频' : '播放视频'),
        _0x3c7c42['sync'](),
        _0x30af2a());
    },
    _0x15aaec = createStoryVideoProgressLoop({ videoEl: _0x22832c, onFrame: _0x30af2a }),
    _0x5bfb38 = async (_0x19cf95) => {
      (_0x19cf95?.['preventDefault']?.(), _0x19cf95?.['stopPropagation']?.());
      if (_0x22832c['paused'] === ![]) {
        _0x22832c['pause']?.();
        return;
      }
      if (_0x22832c['ended']) _0x22832c['currentTime'] = 0x0;
      (await _0x19f399['play'](), _0x4559f8());
    },
    _0xc0ba13 = (_0x537485) => {
      const _0x1312e1 = Number(_0x22832c['duration']),
        _0x9213b0 = _0x3ca839?.['getBoundingClientRect']?.();
      if (!(_0x1312e1 > 0x0) || !_0x9213b0?.['width']) return ![];
      const _0x393ee6 = Math['max'](
        0x0,
        Math['min'](0x1, (Number(_0x537485) - _0x9213b0['left']) / _0x9213b0['width']),
      );
      return (
        (_0x22832c['currentTime'] = _0x393ee6 * _0x1312e1),
        _0x4e2111({ duration: _0x1312e1, currentTime: _0x393ee6 * _0x1312e1, ratio: _0x393ee6 }),
        !![]
      );
    },
    _0x3eb0b1 = () => {
      const _0x246d4a = _0x342f94;
      _0x342f94 = null;
      if (_0x3ca839) _0x3ca839['dataset']['dragging'] = 'false';
      if (_0x246d4a == null) return;
      try {
        _0x3ca839?.['releasePointerCapture']?.(_0x246d4a);
      } catch {}
    },
    _0x321a24 = (_0x197460) => {
      (_0x197460['preventDefault'](), _0x197460['stopPropagation']());
      if (!_0xc0ba13(_0x197460['clientX'])) return;
      _0x342f94 = _0x197460['pointerId'];
      if (_0x3ca839) _0x3ca839['dataset']['dragging'] = 'true';
      try {
        _0x3ca839?.['setPointerCapture']?.(_0x197460['pointerId']);
      } catch {}
    },
    _0x5e7aeb = (_0x3c0db2) => {
      if (_0x3c0db2['pointerId'] !== _0x342f94) return;
      (_0x3c0db2['preventDefault'](), _0x3c0db2['stopPropagation'](), _0xc0ba13(_0x3c0db2['clientX']));
    },
    _0x542655 = (_0x21f978) => {
      if (_0x21f978['pointerId'] !== _0x342f94) return;
      (_0x21f978['preventDefault'](),
        _0x21f978['stopPropagation'](),
        _0xc0ba13(_0x21f978['clientX']),
        _0x3eb0b1(),
        _0x4559f8());
    },
    _0x561600 = (_0xe7cabb) => {
      if (_0xe7cabb['pointerId'] !== _0x342f94) return;
      (_0xe7cabb['preventDefault'](), _0xe7cabb['stopPropagation'](), _0x3eb0b1(), _0x4559f8());
    },
    _0x9d4c8c = (_0x18e8ab) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End']['includes'](_0x18e8ab['key'])) return;
      const _0x507da8 = Number(_0x22832c['duration']);
      if (!(_0x507da8 > 0x0)) return;
      (_0x18e8ab['preventDefault'](), _0x18e8ab['stopPropagation']());
      if (_0x18e8ab['key'] === 'Home') _0x22832c['currentTime'] = 0x0;
      else {
        if (_0x18e8ab['key'] === 'End') _0x22832c['currentTime'] = _0x507da8;
        else {
          const _0x187a5c = _0x18e8ab['key'] === 'ArrowLeft' ? -0x5 : 0x5;
          _0x22832c['currentTime'] = Math['max'](
            0x0,
            Math['min'](_0x507da8, _0x22832c['currentTime'] + _0x187a5c),
          );
        }
      }
      _0x4559f8();
    },
    _0x346629 = (_0x3dec26) => _0x3dec26['stopPropagation'](),
    _0x56b310 = (_0x39fbf6) => {
      (_0x39fbf6['preventDefault'](), _0x39fbf6['stopPropagation'](), (_0x47f7ad = !![]), void _0x5bfb38());
    },
    _0x4acb9a = (_0x19dfed) => {
      (_0x19dfed['preventDefault'](), _0x19dfed['stopPropagation']());
      if (_0x47f7ad) {
        _0x47f7ad = ![];
        return;
      }
      void _0x5bfb38();
    },
    _0x881199 = ['play', 'pause', 'timeupdate', 'loadedmetadata', 'durationchange', 'volumechange', 'ended'];
  (_0x49c3cd?.['addEventListener']('pointerdown', _0x56b310),
    _0x49c3cd?.['addEventListener']('click', _0x4acb9a),
    _0x22832c['addEventListener']('click', _0x5bfb38),
    _0x3ca839?.['addEventListener']('pointerdown', _0x321a24),
    _0x3ca839?.['addEventListener']('pointermove', _0x5e7aeb),
    _0x3ca839?.['addEventListener']('pointerup', _0x542655),
    _0x3ca839?.['addEventListener']('pointercancel', _0x561600),
    _0x3ca839?.['addEventListener']('keydown', _0x9d4c8c),
    _0x5c237e['addEventListener']('pointerdown', _0x346629));
  const _0x31bb6f = (_0x509d6d) => {
    _0x4559f8();
    if (_0x509d6d['type'] === 'play') _0x15aaec['start']();
    else {
      if (_0x509d6d['type'] === 'pause' || _0x509d6d['type'] === 'ended') _0x15aaec['stop']();
    }
  };
  return (
    _0x881199['forEach']((_0x32c65b) => _0x22832c['addEventListener'](_0x32c65b, _0x31bb6f)),
    void _0x19f399['warm']()['then'](() => {
      (_0x4559f8(), _0x15aaec['start']());
    }, _0x4559f8),
    _0x4559f8(),
    {
      destroy() {
        ((_0x4b6833 = !![]),
          _0x15aaec['destroy'](),
          _0x19f399['destroy'](),
          _0x49c3cd?.['removeEventListener']('pointerdown', _0x56b310),
          _0x49c3cd?.['removeEventListener']('click', _0x4acb9a),
          _0x22832c['removeEventListener']('click', _0x5bfb38),
          _0x3c7c42['dispose'](),
          _0x3eb0b1(),
          _0x3ca839?.['removeEventListener']('pointerdown', _0x321a24),
          _0x3ca839?.['removeEventListener']('pointermove', _0x5e7aeb),
          _0x3ca839?.['removeEventListener']('pointerup', _0x542655),
          _0x3ca839?.['removeEventListener']('pointercancel', _0x561600),
          _0x3ca839?.['removeEventListener']('keydown', _0x9d4c8c),
          _0x5c237e['removeEventListener']('pointerdown', _0x346629),
          _0x881199['forEach']((_0x2da9fa) => _0x22832c['removeEventListener'](_0x2da9fa, _0x31bb6f)));
      },
    }
  );
}
