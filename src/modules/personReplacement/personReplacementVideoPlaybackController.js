import { syncPersonReplacementVideoStageFrame } from './personReplacementVideoPresentation.js';
import { createPersonReplacementVideoSyncPlayback } from './personReplacementVideoSyncPlayback.js';
import { createWorkspaceVideoProgressLoop } from '../workspaceVideoPlayback.js';
function normalizeText(_0x119e5c, _0x13c004 = '') {
  const _0x5013c5 = String(_0x119e5c ?? '')['trim']();
  return _0x5013c5 || _0x13c004;
}
function clamp(_0x5ddb85, _0xbe70f2, _0x54ca39, _0x700c76 = _0xbe70f2) {
  const _0x42dedb = Number(_0x5ddb85);
  return Number['isFinite'](_0x42dedb)
    ? Math['min'](_0x54ca39, Math['max'](_0xbe70f2, _0x42dedb))
    : _0x700c76;
}
function formatPlaybackTime(_0x6882a) {
  const _0x171b77 = Math['max'](0x0, Number(_0x6882a) || 0x0),
    _0x3150be = Math['floor'](_0x171b77 / 0x3c);
  return _0x3150be + ':' + String(Math['floor'](_0x171b77 % 0x3c))['padStart'](0x2, '0');
}
export function createPersonReplacementVideoPlaybackController({
  getRoot: _0x2eabdd,
  getProject: _0x396f18,
  getSelectedShot: _0x4199e2,
  createVideoPlayback: _0x2957be,
  videoClipController: videoClipController = null,
  createProgressLoop: createProgressLoop = createWorkspaceVideoProgressLoop,
  createSyncPlayback: createSyncPlayback = createPersonReplacementVideoSyncPlayback,
  syncStageFrame: syncStageFrame = syncPersonReplacementVideoStageFrame,
} = {}) {
  if (
    typeof _0x2eabdd !== 'function' ||
    typeof _0x396f18 !== 'function' ||
    typeof _0x4199e2 !== 'function' ||
    typeof _0x2957be !== 'function'
  )
    throw new Error('person replacement video playback requires workspace adapters');
  const _0x37b42a = new Map(),
    _0x4c83cf = new Map();
  let _0x470b46 = null,
    _0x29b464 = ![],
    _0x596fb9 = null,
    _0x4db384 = ![],
    _0x4127e7 = ![];
  const _0x5c5ffc = () => {
      (_0x470b46?.['destroy']?.(), (_0x470b46 = null));
    },
    _0x141579 = (_0x1f8795) => {
      _0x5c5ffc();
      const _0x256756 = _0x37b42a['get'](_0x1f8795);
      (_0x256756?.['destroy']?.(), _0x37b42a['delete'](_0x1f8795));
    },
    _0x1b0321 = () => {
      (_0x596fb9?.(), (_0x596fb9 = null));
      if (_0x4127e7) return ![];
      const _0x4e85c4 = Array['from'](
          _0x2eabdd()?.['querySelectorAll']?.('[data-person-replacement-video-center-stage]') || [],
        ),
        _0x3f6cce = _0x4e85c4['map']((_0x46e2b5) => {
          const _0xc09d75 = _0x46e2b5['querySelector']?.('[data-person-replacement-video-center-player]');
          if (!_0xc09d75) return null;
          const _0x6d4ef6 = () => {
              const _0x534199 = _0xc09d75['paused'] === ![] && _0xc09d75['ended'] !== !![];
              (_0x46e2b5['classList']?.['toggle']?.('is-playing', _0x534199),
                _0x46e2b5['dataset'] &&
                  (_0x46e2b5['dataset']['personReplacementVideoPlaybackState'] = _0x534199
                    ? 'playing'
                    : 'paused'));
            },
            _0x573017 = ['play', 'playing', 'pause', 'ended', 'emptied'];
          return (
            _0x573017['forEach']((_0x5d649c) => {
              _0xc09d75['addEventListener']?.(_0x5d649c, _0x6d4ef6);
            }),
            _0x6d4ef6(),
            () => {
              _0x573017['forEach']((_0x13f38c) => {
                _0xc09d75['removeEventListener']?.(_0x13f38c, _0x6d4ef6);
              });
            }
          );
        })['filter'](Boolean);
      return (
        (_0x596fb9 = () => {
          _0x3f6cce['forEach']((_0x5eb9b3) => _0x5eb9b3());
        }),
        _0x3f6cce['length'] > 0x0
      );
    },
    _0x742640 = () => {
      _0x5c5ffc();
      if (_0x4127e7) return ![];
      const _0x4fa456 = _0x37b42a['get']('source'),
        _0x519de5 = _0x37b42a['get']('result'),
        _0x25459d = _0x519de5?.['controlsEl']?.['querySelector']?.(
          '[data-person-replacement-video-sync-play]',
        );
      if (!_0x4fa456?.['videoEl'] || !_0x519de5?.['videoEl'] || !_0x25459d) return ![];
      return (
        (_0x470b46 = createSyncPlayback({
          sourceVideo: _0x4fa456['videoEl'],
          resultVideo: _0x519de5['videoEl'],
          sourcePlay: _0x4fa456['play'],
          resultPlay: _0x519de5['play'],
          button: _0x25459d,
          initiallyEnabled: _0x29b464,
          onEnabledChange(_0x4e58a0) {
            _0x29b464 = _0x4e58a0;
          },
        })),
        !![]
      );
    },
    _0x360e72 = ({ closeClip: closeClip = !![] } = {}) => {
      (_0x5c5ffc(),
        Array['from'](_0x37b42a['keys']())['forEach'](_0x141579),
        _0x596fb9?.(),
        (_0x596fb9 = null),
        closeClip && _0x4db384 && (videoClipController?.['exit']?.({ silent: !![] }), (_0x4db384 = ![])));
    },
    _0x1a2545 = ({ roles: roles = ['source', 'result'], reset: reset = !![] } = {}) => {
      if (_0x4127e7) return ![];
      const _0x59c811 = [
        ...new Set(
          (Array['isArray'](roles) ? roles : [])['filter'](
            (_0x5887a8) => _0x5887a8 === 'source' || _0x5887a8 === 'result',
          ),
        ),
      ];
      reset && Array['from'](_0x37b42a['keys']())['forEach'](_0x141579);
      _0x1b0321();
      const _0x377970 = _0x396f18();
      if (_0x377970?.['workspace']?.['view'] !== 'project' || _0x377970['workspace']['step'] !== 0x3)
        return ![];
      const _0xc4f1b5 = _0x2eabdd(),
        _0x3e78c7 = _0x4199e2(_0x377970);
      return (
        _0x59c811['forEach']((_0x148158) => {
          _0x141579(_0x148158);
          const _0x93eb63 = _0xc4f1b5?.['querySelector']?.(
              '[data-person-replacement-video-player="' + _0x148158 + '\x22]',
            ),
            _0x29f51e = _0xc4f1b5?.['querySelector']?.(
              '[data-person-replacement-video-controls=\x22' + _0x148158 + '\x22]',
            ),
            _0x3d8228 = normalizeText(_0x93eb63?.['dataset']?.['personReplacementVideoUrl']);
          if (!_0x93eb63 || !_0x29f51e || !_0x3d8228) return;
          const _0x52b541 = _0x29f51e['querySelector']?.('[data-person-replacement-video-play]'),
            _0x20fd01 = _0x29f51e['querySelector']?.('[data-person-replacement-video-volume]'),
            _0xd88831 = _0x29f51e['querySelector']?.('[data-person-replacement-video-volume-toggle]'),
            _0xb53a55 = _0x29f51e['querySelector']?.('[data-person-replacement-video-progress]'),
            _0x224c28 = _0x29f51e['querySelector']?.('[data-person-replacement-video-progress-fill]'),
            _0x542e67 = _0x29f51e['querySelector']?.('[data-person-replacement-video-time-current]'),
            _0x23abd9 = _0x29f51e['querySelector']?.('[data-person-replacement-video-time-total]'),
            _0x174743 =
              normalizeText(_0x29f51e['dataset']?.['personReplacementVideoLabel']) ||
              (_0x148158 === 'result' ? '替换结果' : '当前片段');
          let _0x414baa = ![];
          const _0x420a43 = _0x4c83cf['get'](_0x148158);
          let _0x2c26c0 = _0x420a43
            ? clamp(Number(_0x420a43['lastAudibleVolume']), 0x0, 0x1, 0x1) || 0x1
            : clamp(Number(_0x93eb63['volume']), 0x0, 0x1, 0x1) || 0x1;
          _0x420a43 &&
            ((_0x93eb63['volume'] = clamp(Number(_0x420a43['volume']), 0x0, 0x1, 0x1)),
            (_0x93eb63['muted'] = _0x420a43['muted'] === !![]));
          const _0x385b9c = () => {
            const _0x23124b = clamp(Number(_0x93eb63['volume']), 0x0, 0x1, 0x0);
            if (_0x93eb63['muted'] !== !![] && _0x23124b > 0x0) _0x2c26c0 = _0x23124b;
            _0x4c83cf['set'](_0x148158, {
              muted: _0x93eb63['muted'] === !![],
              volume: _0x23124b,
              lastAudibleVolume: _0x2c26c0,
            });
          };
          let _0x518e66 = null;
          const _0x240bb0 = _0x2957be({
              videoEl: _0x93eb63,
              sourceUrl: _0x3d8228,
              ownerId: [
                'person-replacement',
                normalizeText(_0x377970['id'], 'project'),
                normalizeText(_0x3e78c7?.['id'], 'shot'),
                _0x148158,
              ]['join'](':'),
              allowConcurrentPlayback: () => _0x470b46?.['isEnabled']?.() === !![],
            }),
            _0x582ba9 = () => {
              const _0xde4a8c = Number(_0x93eb63['duration']),
                _0x30eb08 = Number(_0x93eb63['currentTime']),
                _0x4a1e48 = Number['isFinite'](_0xde4a8c) && _0xde4a8c > 0x0 ? _0xde4a8c : 0x0,
                _0x2fe292 =
                  Number['isFinite'](_0x30eb08) && _0x30eb08 > 0x0
                    ? Math['min'](_0x30eb08, _0x4a1e48 || _0x30eb08)
                    : 0x0;
              return {
                duration: _0x4a1e48,
                currentTime: _0x2fe292,
                ratio: _0x4a1e48 > 0x0 ? clamp(_0x2fe292 / _0x4a1e48, 0x0, 0x1, 0x0) : 0x0,
              };
            },
            _0xf56d1b = ({ duration: _0x8103db, currentTime: _0x2f6c05, ratio: _0x3580f1 }) => {
              if (_0x542e67) _0x542e67['textContent'] = formatPlaybackTime(_0x2f6c05);
              if (_0x23abd9) _0x23abd9['textContent'] = formatPlaybackTime(_0x8103db);
              if (_0x224c28?.['style']) _0x224c28['style']['width'] = _0x3580f1 * 0x64 + '%';
              (_0xb53a55?.['setAttribute']?.('aria-valuenow', String(Math['round'](_0x3580f1 * 0x64))),
                _0xb53a55?.['setAttribute']?.(
                  'aria-valuetext',
                  formatPlaybackTime(_0x2f6c05) + ' / ' + formatPlaybackTime(_0x8103db),
                ));
            },
            _0x538bd4 = () => {
              if (_0x414baa) return;
              _0x385b9c();
              const _0x5712f6 = _0x93eb63['paused'] === ![] && _0x93eb63['ended'] !== !![];
              (_0x52b541?.['classList']?.['toggle']?.('is-playing', _0x5712f6),
                _0x52b541?.['setAttribute']?.('aria-label', '' + (_0x5712f6 ? '暂停' : '播放') + _0x174743),
                _0x52b541?.['removeAttribute']?.('title'));
              const _0x1f7d1a = Math['round'](
                  clamp(_0x93eb63['muted'] ? 0x0 : Number(_0x93eb63['volume']), 0x0, 0x1, 0x0) * 0x64,
                ),
                _0x3ca11b = _0x93eb63['muted'] === !![] || _0x1f7d1a === 0x0;
              _0x20fd01 &&
                ((_0x20fd01['value'] = String(_0x1f7d1a)),
                _0x20fd01['style']?.['setProperty']?.('--story-video-volume-progress', _0x1f7d1a + '%'),
                _0x20fd01['setAttribute']?.('aria-valuetext', _0x1f7d1a + '%'));
              (_0xd88831?.['classList']?.['toggle']?.('is-muted', _0x3ca11b),
                _0xd88831?.['setAttribute']?.('aria-pressed', String(_0x3ca11b)),
                _0xd88831?.['setAttribute']?.('aria-label', '' + (_0x3ca11b ? '恢复' : '静音') + _0x174743));
              if (_0x518e66 == null) _0xf56d1b(_0x582ba9());
            },
            _0x5b9c8b = createProgressLoop({
              videoEl: _0x93eb63,
              onFrame: () => {
                if (_0x518e66 == null) _0xf56d1b(_0x582ba9());
              },
            }),
            _0x1d48b5 = async (_0x563689) => {
              (_0x563689?.['preventDefault']?.(), _0x563689?.['stopPropagation']?.());
              if (_0x470b46?.['isEnabled']?.()) {
                (await _0x470b46['togglePlayback']({ master: _0x148158 }), _0x538bd4());
                return;
              }
              if (_0x93eb63['paused'] === ![]) {
                _0x93eb63['pause']?.();
                return;
              }
              if (_0x93eb63['ended']) _0x93eb63['currentTime'] = 0x0;
              (await _0x240bb0['play'](), _0x538bd4());
            },
            _0x282ba6 = (_0x19fca8) => {
              const _0x5250b1 = Number(_0x93eb63['duration']),
                _0x190aa3 = _0xb53a55?.['getBoundingClientRect']?.();
              if (!(_0x5250b1 > 0x0) || !(Number(_0x190aa3?.['width']) > 0x0)) return ![];
              const _0x3714e8 = clamp(
                (Number(_0x19fca8) - Number(_0x190aa3['left'] || 0x0)) / Number(_0x190aa3['width']),
                0x0,
                0x1,
                0x0,
              );
              return (
                (_0x93eb63['currentTime'] = _0x3714e8 * _0x5250b1),
                _0xf56d1b({ duration: _0x5250b1, currentTime: _0x3714e8 * _0x5250b1, ratio: _0x3714e8 }),
                !![]
              );
            },
            _0x2b74f6 = () => {
              const _0x4c18e9 = _0x518e66;
              _0x518e66 = null;
              if (_0x4c18e9 == null) return;
              try {
                _0xb53a55?.['releasePointerCapture']?.(_0x4c18e9);
              } catch {}
            },
            _0x42a2be = (_0x2e3396) => {
              (_0x2e3396['preventDefault']?.(), _0x2e3396['stopPropagation']?.());
              if (!_0x282ba6(_0x2e3396['clientX'])) return;
              _0x518e66 = _0x2e3396['pointerId'];
              try {
                _0xb53a55?.['setPointerCapture']?.(_0x2e3396['pointerId']);
              } catch {}
            },
            _0x2f86ac = (_0x2cd653) => {
              if (_0x2cd653['pointerId'] !== _0x518e66) return;
              (_0x2cd653['preventDefault']?.(),
                _0x2cd653['stopPropagation']?.(),
                _0x282ba6(_0x2cd653['clientX']));
            },
            _0x4a585a = (_0x214438) => {
              if (_0x214438['pointerId'] !== _0x518e66) return;
              (_0x214438['preventDefault']?.(),
                _0x214438['stopPropagation']?.(),
                _0x282ba6(_0x214438['clientX']),
                _0x2b74f6(),
                _0x538bd4());
            },
            _0x3e6405 = (_0x48b6b6) => {
              if (_0x48b6b6['pointerId'] !== _0x518e66) return;
              (_0x48b6b6['preventDefault']?.(), _0x48b6b6['stopPropagation']?.(), _0x2b74f6(), _0x538bd4());
            },
            _0x1671e1 = (_0x11c47f) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End']['includes'](_0x11c47f['key'])) return;
              const _0x2eb8bf = Number(_0x93eb63['duration']);
              if (!(_0x2eb8bf > 0x0)) return;
              (_0x11c47f['preventDefault']?.(), _0x11c47f['stopPropagation']?.());
              if (_0x11c47f['key'] === 'Home') _0x93eb63['currentTime'] = 0x0;
              else {
                if (_0x11c47f['key'] === 'End') _0x93eb63['currentTime'] = _0x2eb8bf;
                else {
                  const _0x5ac823 = _0x11c47f['key'] === 'ArrowLeft' ? -0x5 : 0x5;
                  _0x93eb63['currentTime'] = clamp(_0x93eb63['currentTime'] + _0x5ac823, 0x0, _0x2eb8bf, 0x0);
                }
              }
              _0x538bd4();
            },
            _0x120d6f = (_0x5817b4) => {
              _0x5817b4['stopPropagation']?.();
              const _0x2dcf6f = clamp(Number(_0x5817b4['currentTarget']?.['value']), 0x0, 0x64, 0x0);
              if (_0x2dcf6f > 0x0) _0x2c26c0 = _0x2dcf6f / 0x64;
              ((_0x93eb63['muted'] = ![]), (_0x93eb63['volume'] = _0x2dcf6f / 0x64), _0x538bd4());
            },
            _0x38a2bc = (_0x493c10) => {
              (_0x493c10?.['preventDefault']?.(), _0x493c10?.['stopPropagation']?.());
              const _0x28fb9e = clamp(Number(_0x93eb63['volume']), 0x0, 0x1, 0x0);
              (_0x93eb63['muted'] !== !![] && _0x28fb9e > 0x0
                ? ((_0x2c26c0 = _0x28fb9e), (_0x93eb63['muted'] = !![]))
                : ((_0x93eb63['volume'] = _0x2c26c0), (_0x93eb63['muted'] = ![])),
                _0x538bd4());
            },
            _0x161e7d = (_0x1c2ea0) => _0x1c2ea0['stopPropagation']?.(),
            _0x2fce68 = [
              'play',
              'pause',
              'timeupdate',
              'loadedmetadata',
              'durationchange',
              'volumechange',
              'ended',
            ],
            _0x1c98d4 = (_0x222f24) => {
              if (_0x222f24['type'] === 'loadedmetadata') syncStageFrame(_0x93eb63);
              _0x538bd4();
              if (_0x222f24['type'] === 'play') _0x5b9c8b['start']();
              else (_0x222f24['type'] === 'pause' || _0x222f24['type'] === 'ended') && _0x5b9c8b['stop']();
            };
          (_0x52b541?.['addEventListener']?.('click', _0x1d48b5),
            _0x93eb63['addEventListener']?.('click', _0x1d48b5),
            _0x20fd01?.['addEventListener']?.('input', _0x120d6f),
            _0xd88831?.['addEventListener']?.('click', _0x38a2bc),
            _0xb53a55?.['addEventListener']?.('pointerdown', _0x42a2be),
            _0xb53a55?.['addEventListener']?.('pointermove', _0x2f86ac),
            _0xb53a55?.['addEventListener']?.('pointerup', _0x4a585a),
            _0xb53a55?.['addEventListener']?.('pointercancel', _0x3e6405),
            _0xb53a55?.['addEventListener']?.('keydown', _0x1671e1),
            _0x29f51e['addEventListener']?.('pointerdown', _0x161e7d),
            _0x2fce68['forEach']((_0x3a0fc6) => {
              _0x93eb63['addEventListener']?.(_0x3a0fc6, _0x1c98d4);
            }),
            syncStageFrame(_0x93eb63),
            void _0x240bb0['warm']()['then'](_0x538bd4, _0x538bd4),
            _0x538bd4(),
            _0x37b42a['set'](_0x148158, {
              videoEl: _0x93eb63,
              controlsEl: _0x29f51e,
              play: () => _0x240bb0['play'](),
              pause: () => _0x93eb63['pause']?.(),
              destroy() {
                (_0x385b9c(),
                  (_0x414baa = !![]),
                  _0x5b9c8b['destroy'](),
                  _0x240bb0['destroy'](),
                  _0x2b74f6(),
                  _0x52b541?.['removeEventListener']?.('click', _0x1d48b5),
                  _0x93eb63['removeEventListener']?.('click', _0x1d48b5),
                  _0x20fd01?.['removeEventListener']?.('input', _0x120d6f),
                  _0xd88831?.['removeEventListener']?.('click', _0x38a2bc),
                  _0xb53a55?.['removeEventListener']?.('pointerdown', _0x42a2be),
                  _0xb53a55?.['removeEventListener']?.('pointermove', _0x2f86ac),
                  _0xb53a55?.['removeEventListener']?.('pointerup', _0x4a585a),
                  _0xb53a55?.['removeEventListener']?.('pointercancel', _0x3e6405),
                  _0xb53a55?.['removeEventListener']?.('keydown', _0x1671e1),
                  _0x29f51e['removeEventListener']?.('pointerdown', _0x161e7d),
                  _0x2fce68['forEach']((_0x2bbf7d) => {
                    _0x93eb63['removeEventListener']?.(_0x2bbf7d, _0x1c98d4);
                  }));
              },
            }));
        }),
        _0x742640(),
        _0x37b42a['size'] > 0x0
      );
    };
  return Object['freeze']({
    bind: _0x1a2545,
    bindCenterIndicators: _0x1b0321,
    destroyRole: _0x141579,
    stop: _0x360e72,
    stopSyncPlayback: _0x5c5ffc,
    toggleSyncEnabled: () => _0x470b46?.['toggleEnabled']?.() ?? ![],
    setClipActive(_0x1d1290) {
      return ((_0x4db384 = _0x1d1290 === !![]), _0x4db384);
    },
    isClipActive: () => _0x4db384,
    destroy() {
      if (_0x4127e7) return;
      (_0x360e72(), (_0x4127e7 = !![]));
    },
  });
}
