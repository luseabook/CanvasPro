import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
} from '../../services/desktopMediaBlobSource.js';
import { buildPersonReplacementCompositePreviewSnapshot } from './personReplacementCompositePreviewProjection.js';
import { getPersonReplacementShotDurationSec } from './personReplacementShotCutModel.js';
export const PERSON_REPLACEMENT_COMPOSITE_PREWARM_MAX_BYTES = 0x40 * 0x400 * 0x400;
export const PERSON_REPLACEMENT_COMPOSITE_PREWARM_TIMEOUT_MS = 0x1388;
function normalizeText(_0x158d33, _0x809a83 = '') {
  const _0x3ca101 = String(_0x158d33 ?? '')['trim']();
  return _0x3ca101 || _0x809a83;
}
function clamp(_0x29f4c9, _0x1b863d, _0x5f17a7, _0x169f23 = _0x1b863d) {
  const _0x87ae8f = Number(_0x29f4c9);
  return Number['isFinite'](_0x87ae8f)
    ? Math['min'](_0x5f17a7, Math['max'](_0x1b863d, _0x87ae8f))
    : _0x169f23;
}
function formatPreviewTime(_0x51d0a3) {
  const _0x404f15 = Math['max'](0x0, Number(_0x51d0a3) || 0x0),
    _0x115536 = Math['floor'](_0x404f15 / 0x3c);
  return _0x115536 + ':' + String(Math['floor'](_0x404f15 % 0x3c))['padStart'](0x2, '0');
}
export function createPersonReplacementCompositePlaybackBinding({
  root: _0x51dc90,
  project: _0x101aac,
  getProject: getProject = () => _0x101aac,
  windowObject: windowObject = globalThis['window'] || globalThis,
  createVideoPlayback: _0x520a43,
  originalVideo: originalVideo = null,
  replacementVideo: replacementVideo = null,
  adoptedOriginalPlayback: adoptedOriginalPlayback = null,
  adoptedReplacementPlayback: adoptedReplacementPlayback = null,
} = {}) {
  if (!_0x51dc90 || !_0x101aac || typeof _0x520a43 !== 'function')
    throw new Error('person\x20replacement\x20composite\x20playback\x20requires\x20workspace\x20adapters');
  const _0x486517 = _0x51dc90['querySelector']?.('[data-person-replacement-composite-preview]'),
    _0x4b3a7f = _0x51dc90['querySelector']?.('[data-person-replacement-compare-original-audio]'),
    _0x32290d = normalizeText(_0x4b3a7f?.['dataset']?.['personReplacementCompareOriginalAudioUrl']),
    _0x571768 = _0x51dc90['querySelector']?.('[data-person-replacement-compare-replacement-audio]'),
    _0xe7efdb = normalizeText(_0x571768?.['dataset']?.['personReplacementCompareReplacementAudioUrl']),
    _0x318432 = Array['from'](
      _0x51dc90['querySelectorAll']?.(
        '[data-person-replacement-compare-playback], ' + '[data-person-replacement-compare-playback-control]',
      ) || [],
    ),
    _0xa1d69 = _0x51dc90['querySelector']?.('[data-person-replacement-compare-progress]'),
    _0x4fb697 = _0x51dc90['querySelector']?.('[data-person-replacement-compare-progress-fill]'),
    _0x12a8bf = _0x51dc90['querySelector']?.('[data-person-replacement-compare-current-time]'),
    _0x16c542 = _0x51dc90['querySelector']?.('[data-person-replacement-compare-total-time]'),
    _0x9d18cb = _0x51dc90['querySelector']?.('[data-person-replacement-compare-volume]'),
    _0x571e08 = _0x51dc90['querySelector']?.('[data-person-replacement-compare-volume-toggle]'),
    _0x1310ae = [originalVideo, replacementVideo]['filter'](Boolean),
    _0x3f818b = replacementVideo || originalVideo;
  if (!_0x486517 || !_0x3f818b || !_0x1310ae['length']) return null;
  const _0x4ce0f8 = buildPersonReplacementCompositePreviewSnapshot(_0x101aac),
    _0x3d8d07 = _0x4ce0f8['selectedShot'],
    _0x25881f = _0x4ce0f8['previewMode'] === 'full',
    _0x3bab01 = _0x25881f ? _0x4ce0f8['composedShots'] : [],
    _0x7e304a = _0x25881f
      ? {
          id: 'complete-video',
          startTimeSec: 0x0,
          durationSec: _0x3bab01['reduce'](
            (_0x33a72c, _0x490661) => _0x33a72c + getPersonReplacementShotDurationSec(_0x490661),
            0x0,
          ),
        }
      : _0x3d8d07;
  let _0x71401 = ![];
  const _0x30a2d5 = new Map();
  _0x1310ae['forEach']((_0x5cee2e, _0x4d4329) => {
    const _0x237e7d =
        normalizeText(_0x5cee2e['dataset']?.['personReplacementCompareVideo']) ||
        (_0x5cee2e === replacementVideo ? 'replacement' : 'original'),
      _0x17caa7 = normalizeText(
        _0x5cee2e['dataset']?.['personReplacementCompareVideoUrl'] ||
          _0x5cee2e['getAttribute']?.('src') ||
          _0x5cee2e['src'],
      );
    if (!_0x17caa7) return;
    const _0x1c2e74 =
        _0x5cee2e === adoptedOriginalPlayback?.['videoEl']
          ? adoptedOriginalPlayback
          : _0x5cee2e === adoptedReplacementPlayback?.['videoEl']
            ? adoptedReplacementPlayback
            : null,
      _0x12f977 =
        _0x1c2e74?.['controller'] ||
        _0x520a43({
          videoEl: _0x5cee2e,
          sourceUrl: _0x17caa7,
          ownerId: [
            'person-replacement',
            normalizeText(_0x101aac['id']) || 'project',
            normalizeText(_0x7e304a?.['id']) || String(_0x4d4329),
            'composite',
            _0x237e7d,
          ]['join'](':'),
          allowConcurrentPlayback: !![],
          preferStreamingSource: ![],
          ...(_0x25881f
            ? {
                acquirePlaybackOptions: {
                  bypassConcurrencyLimit: !![],
                  maxBytes: PERSON_REPLACEMENT_COMPOSITE_PREWARM_MAX_BYTES,
                  timeout: PERSON_REPLACEMENT_COMPOSITE_PREWARM_TIMEOUT_MS,
                },
              }
            : {}),
        });
    (_0x30a2d5['set'](_0x5cee2e, _0x12f977),
      void Promise['resolve'](_0x12f977['warm']?.())['catch'](() => ![]));
  });
  const _0x522ed5 =
      _0x571768 && _0xe7efdb
        ? attachMediaElementPlaybackSource(_0x571768, _0xe7efdb, {
            preload: 'auto',
            shouldAssign: () => !_0x71401 && _0x571768['isConnected'] !== ![],
          })['catch'](() => '')
        : Promise['resolve'](''),
    _0x5034ce =
      _0x4b3a7f && _0x32290d
        ? attachMediaElementPlaybackSource(_0x4b3a7f, _0x32290d, {
            preload: 'auto',
            shouldAssign: () => !_0x71401 && _0x4b3a7f['isConnected'] !== ![],
          })['catch'](() => '')
        : Promise['resolve'](''),
    _0xeeaba1 = Math['max'](0x0, Number(_0x7e304a?.['startTimeSec']) || 0x0);
  let _0x5c068d = 0x0,
    _0x56cd66 = 0x0,
    _0xd5701f = null,
    _0x5d9302 = 0x0,
    _0x323998 = ![],
    _0xe354ec = clamp(
      Number(_0x571768?.['volume'] ?? replacementVideo?.['volume'] ?? originalVideo?.['volume']),
      0x0,
      0x1,
      0x1,
    ),
    _0x5db7c2 = _0xe354ec || 0x1;
  const _0xc43db2 = () =>
      getProject()?.['audio']?.['previewTrack'] === 'original' ? 'original' : 'replacement',
    _0x38e71f = () => {
      const _0x557cc7 = Number(_0x3f818b['duration']);
      if (Number['isFinite'](_0x557cc7) && _0x557cc7 > 0x0) return _0x557cc7;
      return Math['max'](0x0, Number(_0x7e304a?.['durationSec']) || 0x0);
    },
    _0x35a425 = () => {
      const _0x590313 = Number(_0x3f818b['currentTime']);
      return Number['isFinite'](_0x590313) && _0x590313 > 0x0 ? _0x590313 : 0x0;
    },
    _0x2a4fe3 = () => {
      const _0x8d5306 = _0x38e71f(),
        _0xf09099 = Math['min'](_0x35a425(), _0x8d5306 || _0x35a425()),
        _0x230c54 = _0x8d5306 > 0x0 ? clamp(_0xf09099 / _0x8d5306, 0x0, 0x1, 0x0) : 0x0;
      if (_0x4fb697?.['style']) _0x4fb697['style']['width'] = _0x230c54 * 0x64 + '%';
      (_0xa1d69?.['setAttribute']?.('aria-valuenow', String(Math['round'](_0x230c54 * 0x64))),
        _0xa1d69?.['setAttribute']?.(
          'aria-valuetext',
          formatPreviewTime(_0xf09099) + '\x20/\x20' + formatPreviewTime(_0x8d5306),
        ));
      if (_0x12a8bf) _0x12a8bf['textContent'] = formatPreviewTime(_0xf09099);
      if (_0x16c542) _0x16c542['textContent'] = formatPreviewTime(_0x8d5306);
    },
    _0x38ff5f = () => {
      if (!_0x9d18cb) return;
      const _0x5efe78 = Math['round'](_0xe354ec * 0x64);
      ((_0x9d18cb['value'] = String(_0x5efe78)),
        _0x9d18cb['style']?.['setProperty']?.('--story-video-volume-progress', _0x5efe78 + '%'),
        _0x9d18cb['setAttribute']?.('aria-valuetext', _0x5efe78 + '%'));
      const _0x3d0fd8 = _0x5efe78 === 0x0;
      (_0x571e08?.['classList']?.['toggle']?.('is-muted', _0x3d0fd8),
        _0x571e08?.['setAttribute']?.('aria-pressed', String(_0x3d0fd8)),
        _0x571e08?.['setAttribute']?.('aria-label', (_0x3d0fd8 ? '恢复' : '静音') + '原视频和替换视频'));
    },
    _0x2271c0 = (_0xa6e2d6) => {
      const _0x367c74 = _0xeeaba1 + Math['max'](0x0, Number(_0xa6e2d6) || 0x0),
        _0x4d81db = Number(_0x571768?.['duration']);
      return Number['isFinite'](_0x4d81db) && _0x4d81db > 0x0
        ? Math['min'](_0x367c74, Math['max'](0x0, _0x4d81db - 0.04))
        : _0x367c74;
    },
    _0x47b214 = ({ force: force = ![] } = {}) => {
      const _0x304eff = _0x35a425();
      _0x1310ae['forEach']((_0xe027e9) => {
        if (_0xe027e9 === _0x3f818b) return;
        const _0x78d99d = Math['abs']((Number(_0xe027e9['currentTime']) || 0x0) - _0x304eff);
        if (force || _0x78d99d > 0.1)
          try {
            _0xe027e9['currentTime'] = _0x304eff;
          } catch {}
      });
      if (_0x571768) {
        const _0x21a2a6 = _0x2271c0(_0x304eff),
          _0x34921b = Math['abs']((Number(_0x571768['currentTime']) || 0x0) - _0x21a2a6);
        if (force || _0x34921b > 0.12)
          try {
            _0x571768['currentTime'] = _0x21a2a6;
          } catch {}
      }
      if (_0x4b3a7f) {
        const _0x368dde = Math['abs']((Number(_0x4b3a7f['currentTime']) || 0x0) - _0x304eff);
        if (force || _0x368dde > 0.12)
          try {
            _0x4b3a7f['currentTime'] = _0x304eff;
          } catch {}
      }
    },
    _0x32d154 = (_0x12d309 = _0xc43db2()) => {
      const _0x51f20b = _0x12d309 === 'original' ? 'original' : 'replacement';
      originalVideo && (originalVideo['muted'] = _0x51f20b !== 'original' || Boolean(_0x4b3a7f));
      replacementVideo && (replacementVideo['muted'] = _0x51f20b !== 'replacement' || Boolean(_0x571768));
      if (_0x4b3a7f) _0x4b3a7f['muted'] = _0x51f20b !== 'original';
      if (_0x571768) _0x571768['muted'] = _0x51f20b !== 'replacement';
      _0x486517['dataset']['previewTrack'] = _0x51f20b;
    },
    _0x50672d = () => _0x3f818b['paused'] === ![] && _0x3f818b['ended'] !== !![],
    _0x5ae6ba = (_0x429711) => _0x429711?.['paused'] === ![] && _0x429711?.['ended'] !== !![],
    _0x587f61 = () => {
      const _0x33f32c = _0x50672d(),
        _0xc8620 = _0x323998 && !_0x33f32c;
      (_0x486517['classList']?.['toggle']?.('is-comparison-playing', _0x33f32c),
        _0x486517['classList']?.['toggle']?.('is-comparison-loading', _0xc8620),
        _0x318432['forEach']((_0xd50f37) => {
          (_0xd50f37['classList']?.['toggle']?.('is-playing', _0x33f32c),
            _0xd50f37['classList']?.['toggle']?.('is-loading', _0xc8620),
            _0xd50f37['setAttribute']?.('aria-pressed', String(_0x33f32c)),
            _0xd50f37['setAttribute']?.('aria-busy', String(_0xc8620)),
            _0xd50f37['setAttribute']?.(
              'aria-label',
              _0xc8620 ? '取消同步播放加载' : _0x33f32c ? '暂停原视频和替换视频' : '播放原视频和替换视频',
            ));
        }));
      if (_0xd5701f == null) _0x2a4fe3();
      _0x38ff5f();
    },
    _0x1a27f3 = () => {
      (_0x5c068d && (windowObject?.['cancelAnimationFrame']?.(_0x5c068d), (_0x5c068d = 0x0)),
        _0x56cd66 && (windowObject?.['clearTimeout']?.(_0x56cd66), (_0x56cd66 = 0x0)));
    },
    _0x274776 = () => {
      _0x1a27f3();
      if (_0x71401 || !_0x50672d()) return;
      const _0x38631d = () => {
        ((_0x5c068d = 0x0), (_0x56cd66 = 0x0));
        if (_0x71401 || !_0x50672d()) return;
        (_0x47b214(), _0x2a4fe3(), _0x274776());
      };
      typeof windowObject?.['requestAnimationFrame'] === 'function'
        ? (_0x5c068d = windowObject['requestAnimationFrame'](_0x38631d))
        : (_0x56cd66 = windowObject?.['setTimeout']?.(_0x38631d, 0x20) || 0x0);
    },
    _0x20379d = ({ cancelPending: cancelPending = !![] } = {}) => {
      if (cancelPending) _0x5d9302 += 0x1;
      ((_0x323998 = ![]),
        _0x1310ae['forEach']((_0x5319de) => _0x5319de['pause']?.()),
        _0x4b3a7f?.['pause']?.(),
        _0x571768?.['pause']?.(),
        _0x1a27f3(),
        _0x587f61());
    },
    _0x3ea1d5 = async () => {
      const _0x5b2985 = _0x5d9302 + 0x1;
      ((_0x5d9302 = _0x5b2985), (_0x323998 = !![]), _0x587f61());
      const _0x4cacab = _0x38e71f();
      (_0x3f818b['ended'] || (_0x4cacab > 0x0 && _0x35a425() >= _0x4cacab - 0.04)) &&
        (_0x3f818b['currentTime'] = 0x0);
      (_0x47b214({ force: !![] }), _0x32d154());
      const _0x407502 = [..._0x1310ae],
        _0x1546d0 = _0xc43db2(),
        _0x47017f = _0x1546d0 === 'original' ? _0x4b3a7f : _0x571768,
        _0x1b90a0 = _0x1546d0 === 'original' ? _0x5034ce : _0x522ed5;
      if (_0x47017f) _0x407502['push'](_0x47017f);
      if (_0x47017f !== _0x4b3a7f) _0x4b3a7f?.['pause']?.();
      if (_0x47017f !== _0x571768) _0x571768?.['pause']?.();
      const _0xffac1f = Promise['allSettled'](
        _0x1310ae['map']((_0x433928) => {
          const _0x40088f = _0x30a2d5['get'](_0x433928);
          try {
            return _0x40088f?.['play']?.() ?? _0x433928['play']?.();
          } catch (_0x5a6b9e) {
            return Promise['reject'](_0x5a6b9e);
          }
        }),
      );
      _0x47017f &&
        _0x407502['includes'](_0x47017f) &&
        void _0x1b90a0['then']((_0x3b5507) => {
          if (!_0x3b5507) throw new Error('Selected audio source unavailable');
          if (_0x71401 || _0x5b2985 !== _0x5d9302) return ![];
          return _0x47017f['play']?.();
        })
          ['then'](() => {
            if (_0x71401 || _0x5b2985 !== _0x5d9302) {
              _0x47017f['pause']?.();
              return;
            }
            _0x47b214({ force: !![] });
          })
          ['catch'](() => {
            if (_0x71401 || _0x5b2985 !== _0x5d9302) return;
            _0x47017f['pause']?.();
            const _0x58b4a3 = _0x1546d0 === 'original' ? originalVideo : replacementVideo;
            if (_0x58b4a3) _0x58b4a3['muted'] = ![];
            _0x38ff5f();
          });
      const _0x4e8d06 = await _0xffac1f;
      if (_0x71401 || _0x5b2985 !== _0x5d9302)
        return (_0x407502['forEach']((_0x223014) => _0x223014['pause']?.()), ![]);
      _0x323998 = ![];
      const _0x12bbd0 =
        _0x4e8d06['some']((_0x45caf7) => _0x45caf7['status'] === 'rejected' || _0x45caf7['value'] === ![]) ||
        !_0x1310ae['every'](_0x5ae6ba);
      if (_0x12bbd0)
        return (
          _0x20379d({ cancelPending: ![] }),
          windowObject?.['showToast']?.('同步播放失败，请确认视频文件仍然可用。', 'warn'),
          ![]
        );
      return (_0x47b214({ force: !![] }), _0x587f61(), _0x274776(), !![]);
    },
    _0x5dd0c7 = () => {
      if (_0x50672d() || _0x323998) return (_0x20379d(), ![]);
      return (void _0x3ea1d5(), !![]);
    },
    _0xbe45f3 = (_0x1d10a7) => {
      const _0x30586b = _0x38e71f();
      if (!(_0x30586b > 0x0)) return ![];
      const _0x84fb9c = clamp(Number(_0x1d10a7), 0x0, 0x1, 0x0);
      return (
        (_0x3f818b['currentTime'] = _0x84fb9c * _0x30586b),
        _0x47b214({ force: !![] }),
        _0x2a4fe3(),
        !![]
      );
    },
    _0x4b9fd9 = (_0x47c404) => {
      const _0x307007 = _0xa1d69?.['getBoundingClientRect']?.();
      if (!(Number(_0x307007?.['width']) > 0x0)) return ![];
      return _0xbe45f3((Number(_0x47c404) - Number(_0x307007['left'] || 0x0)) / Number(_0x307007['width']));
    },
    _0x1c522e = () => {
      const _0x3f5762 = _0xd5701f;
      _0xd5701f = null;
      if (_0x3f5762 == null) return;
      try {
        _0xa1d69?.['releasePointerCapture']?.(_0x3f5762);
      } catch {}
    },
    _0x30fd48 = (_0x40b76f) => {
      (_0x40b76f['preventDefault']?.(), _0x40b76f['stopPropagation']?.());
      if (!_0x4b9fd9(_0x40b76f['clientX'])) return;
      _0xd5701f = _0x40b76f['pointerId'];
      try {
        _0xa1d69?.['setPointerCapture']?.(_0x40b76f['pointerId']);
      } catch {}
    },
    _0x2c234c = (_0x4493c2) => {
      if (_0x4493c2['pointerId'] !== _0xd5701f) return;
      (_0x4493c2['preventDefault']?.(), _0x4493c2['stopPropagation']?.(), _0x4b9fd9(_0x4493c2['clientX']));
    },
    _0x2c06b0 = (_0x509708) => {
      if (_0x509708['pointerId'] !== _0xd5701f) return;
      (_0x509708['preventDefault']?.(),
        _0x509708['stopPropagation']?.(),
        _0x4b9fd9(_0x509708['clientX']),
        _0x1c522e(),
        _0x587f61());
    },
    _0x316a4b = (_0x3e5076) => {
      if (_0x3e5076['pointerId'] !== _0xd5701f) return;
      (_0x3e5076['preventDefault']?.(), _0x3e5076['stopPropagation']?.(), _0x1c522e(), _0x587f61());
    },
    _0x1cbe1d = (_0x315742) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End']['includes'](_0x315742['key'])) return;
      const _0x561e71 = _0x38e71f();
      if (!(_0x561e71 > 0x0)) return;
      (_0x315742['preventDefault']?.(), _0x315742['stopPropagation']?.());
      if (_0x315742['key'] === 'Home') _0xbe45f3(0x0);
      else {
        if (_0x315742['key'] === 'End') _0xbe45f3(0x1);
        else {
          const _0x3d6531 = _0x315742['key'] === 'ArrowLeft' ? -0x5 : 0x5;
          _0xbe45f3((_0x35a425() + _0x3d6531) / _0x561e71);
        }
      }
      _0x587f61();
    },
    _0x56d714 = (_0x4908ba) => {
      (_0x4908ba['stopPropagation']?.(),
        (_0xe354ec = clamp(Number(_0x4908ba['currentTarget']?.['value']) / 0x64, 0x0, 0x1, _0xe354ec)));
      if (_0xe354ec > 0x0) _0x5db7c2 = _0xe354ec;
      ([..._0x1310ae, _0x4b3a7f, _0x571768]['filter'](Boolean)['forEach']((_0x40388e) => {
        _0x40388e['volume'] = _0xe354ec;
      }),
        _0x38ff5f());
    },
    _0x19f73e = (_0x3f23db) => {
      (_0x3f23db?.['preventDefault']?.(),
        _0x3f23db?.['stopPropagation']?.(),
        (_0xe354ec = _0xe354ec > 0x0 ? 0x0 : _0x5db7c2),
        [..._0x1310ae, _0x4b3a7f, _0x571768]['filter'](Boolean)['forEach']((_0x2cc13f) => {
          _0x2cc13f['volume'] = _0xe354ec;
        }),
        _0x38ff5f());
    },
    _0x59d3b1 = (_0x1f38ff) => {
      if (_0x1f38ff['type'] === 'ended') {
        _0x20379d();
        return;
      }
      _0x587f61();
      if (_0x1f38ff['type'] === 'play' || _0x1f38ff['type'] === 'playing') _0x274776();
      else _0x1f38ff['type'] === 'pause' && _0x1a27f3();
    },
    _0xd2190 = [
      'play',
      'playing',
      'pause',
      'ended',
      'loadedmetadata',
      'durationchange',
      'timeupdate',
      'seeked',
    ];
  (_0xa1d69?.['addEventListener']?.('pointerdown', _0x30fd48),
    _0xa1d69?.['addEventListener']?.('pointermove', _0x2c234c),
    _0xa1d69?.['addEventListener']?.('pointerup', _0x2c06b0),
    _0xa1d69?.['addEventListener']?.('pointercancel', _0x316a4b),
    _0xa1d69?.['addEventListener']?.('keydown', _0x1cbe1d),
    _0x9d18cb?.['addEventListener']?.('input', _0x56d714),
    _0x571e08?.['addEventListener']?.('click', _0x19f73e),
    _0xd2190['forEach']((_0x309c7a) => {
      _0x3f818b['addEventListener']?.(_0x309c7a, _0x59d3b1);
    }),
    _0x32d154(),
    _0x2a4fe3(),
    _0x587f61());
  const _0x429896 = ({ retainVideos: retainVideos = [] } = {}) => {
    if (_0x71401) return new Map();
    ((_0x71401 = !![]), _0x20379d());
    const _0x41cb48 = new Map();
    return (
      (Array['isArray'](retainVideos) ? retainVideos : [])['forEach']((_0x20423f) => {
        const _0x2abe81 = _0x30a2d5['get'](_0x20423f);
        if (!_0x2abe81) return;
        (_0x41cb48['set'](_0x20423f, _0x2abe81), _0x30a2d5['delete'](_0x20423f));
      }),
      _0x30a2d5['forEach']((_0x3e9047) => _0x3e9047['destroy']?.()),
      _0x30a2d5['clear'](),
      _0x1c522e(),
      _0xa1d69?.['removeEventListener']?.('pointerdown', _0x30fd48),
      _0xa1d69?.['removeEventListener']?.('pointermove', _0x2c234c),
      _0xa1d69?.['removeEventListener']?.('pointerup', _0x2c06b0),
      _0xa1d69?.['removeEventListener']?.('pointercancel', _0x316a4b),
      _0xa1d69?.['removeEventListener']?.('keydown', _0x1cbe1d),
      _0x9d18cb?.['removeEventListener']?.('input', _0x56d714),
      _0x571e08?.['removeEventListener']?.('click', _0x19f73e),
      _0xd2190['forEach']((_0x15ddbb) => {
        _0x3f818b['removeEventListener']?.(_0x15ddbb, _0x59d3b1);
      }),
      [_0x4b3a7f, _0x571768]['filter'](Boolean)['forEach']((_0x45bb0b) => {
        try {
          (_0x45bb0b['removeAttribute']?.('src'),
            clearDesktopMediaPlaybackSourceMetadata(_0x45bb0b),
            (_0x45bb0b['preload'] = 'none'),
            _0x45bb0b['load']?.());
        } catch {}
      }),
      _0x41cb48
    );
  };
  return Object['freeze']({
    togglePlayback: _0x5dd0c7,
    setTrack(_0x444427) {
      (_0x32d154(_0x444427), _0x47b214({ force: !![] }));
      const _0x21e30c = _0x444427 === 'original' ? _0x4b3a7f : _0x571768,
        _0x4162aa = _0x444427 === 'original' ? _0x5034ce : _0x522ed5;
      _0x21e30c &&
        _0x50672d() &&
        void _0x4162aa['then']((_0x586835) => {
          if (!_0x586835 || _0x71401 || !_0x50672d()) return ![];
          return _0x21e30c['play']?.();
        })['catch'](() => {
          const _0x26c567 = _0x444427 === 'original' ? originalVideo : replacementVideo;
          if (!_0x71401 && _0x26c567) _0x26c567['muted'] = ![];
        });
      if (_0x21e30c !== _0x4b3a7f) _0x4b3a7f?.['pause']?.();
      if (_0x21e30c !== _0x571768) _0x571768?.['pause']?.();
      _0x587f61();
    },
    warmOriginalPlayback(_0x4613a0 = '') {
      const _0x4cebfd = normalizeText(_0x4613a0),
        _0xcaf503 = normalizeText(originalVideo?.['dataset']?.['personReplacementCompareVideoUrl']),
        _0x5a544e = originalVideo ? _0x30a2d5['get'](originalVideo) : null;
      if (_0x71401 || !_0x5a544e || !_0x4cebfd || _0x4cebfd !== _0xcaf503) return Promise['resolve'](![]);
      try {
        return Promise['resolve'](_0x5a544e['play']?.())['then'](
          (_0x3c1c1b) => {
            if (!_0x71401) originalVideo['pause']?.();
            return _0x3c1c1b !== ![];
          },
          () => ![],
        );
      } catch {
        return Promise['resolve'](![]);
      }
    },
    retainOriginalPlayback(_0x55e68c = '') {
      const _0x2519db = normalizeText(_0x55e68c),
        _0x4a6a2c = normalizeText(originalVideo?.['dataset']?.['personReplacementCompareVideoUrl']);
      if (!originalVideo || !_0x2519db || _0x2519db !== _0x4a6a2c) return null;
      const _0x100430 = _0x429896({ retainVideos: [originalVideo] }),
        _0x3154b0 = _0x100430['get'](originalVideo);
      return _0x3154b0 ? { sourceUrl: _0x4a6a2c, videoEl: originalVideo, controller: _0x3154b0 } : null;
    },
    retainFullPlaybacks(_0x29f7f5 = {}) {
      const _0xb41631 = [
        ['original', originalVideo, normalizeText(_0x29f7f5['original'])],
        ['replacement', replacementVideo, normalizeText(_0x29f7f5['replacement'])],
      ]['filter'](
        ([, _0x3015cc, _0x2a0a35]) =>
          _0x3015cc &&
          _0x2a0a35 &&
          _0x2a0a35 === normalizeText(_0x3015cc['dataset']?.['personReplacementCompareVideoUrl']) &&
          _0x30a2d5['has'](_0x3015cc),
      );
      if (!_0xb41631['length']) return null;
      const _0x230529 = _0x429896({ retainVideos: _0xb41631['map'](([, _0x3f9302]) => _0x3f9302) });
      return _0xb41631['reduce']((_0xb5492e, [_0x2ee175, _0x550857, _0x3674a2]) => {
        const _0x5ec0b5 = _0x230529['get'](_0x550857);
        return (
          _0x5ec0b5 &&
            (_0xb5492e[_0x2ee175] = { sourceUrl: _0x3674a2, videoEl: _0x550857, controller: _0x5ec0b5 }),
          _0xb5492e
        );
      }, {});
    },
    destroy() {
      _0x429896();
    },
  });
}
