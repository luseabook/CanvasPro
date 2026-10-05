import { syncPersonReplacementVideoStageFrame } from './personReplacementVideoPresentation.js';
import { createPersonReplacementVideoSyncPlayback } from './personReplacementVideoSyncPlayback.js';
import { createWorkspaceVideoProgressLoop } from '../workspaceVideoPlayback.js';
function normalizeText(value, item = '') {
  const key = String(value ?? '')['trim']();
  return key || item;
}
function clamp(index, result, data, options = result) {
  const target = Number(index);
  return Number['isFinite'](target) ? Math['min'](data, Math['max'](result, target)) : options;
}
function formatPlaybackTime(source) {
  const next = Math['max'](0, Number(source) || 0),
    current = Math['floor'](next / 60);
  return current + ':' + String(Math['floor'](next % 60))['padStart'](2, '0');
}
export function createPersonReplacementVideoPlaybackController({
  getRoot: getRoot,
  getProject: getProject,
  getSelectedShot: getSelectedShot,
  createVideoPlayback: createVideoPlayback,
  videoClipController: videoClipController = null,
  createProgressLoop: createProgressLoop = createWorkspaceVideoProgressLoop,
  createSyncPlayback: createSyncPlayback = createPersonReplacementVideoSyncPlayback,
  syncStageFrame: syncStageFrame = syncPersonReplacementVideoStageFrame,
} = {}) {
  if (
    typeof getRoot !== 'function' ||
    typeof getProject !== 'function' ||
    typeof getSelectedShot !== 'function' ||
    typeof createVideoPlayback !== 'function'
  )
    throw new Error('person replacement video playback requires workspace adapters');
  const map = new Map(),
    map2 = new Map();
  let syncPlayback = null,
    initiallyEnabled = false,
    value2 = null,
    enabled = false,
    entry = false;
  const stopSyncPlayback = () => {
      (syncPlayback?.['destroy']?.(), (syncPlayback = null));
    },
    destroyRole = (record) => {
      stopSyncPlayback();
      const payload = map['get'](record);
      (payload?.['destroy']?.(), map['delete'](record));
    },
    bindCenterIndicators = () => {
      (value2?.(), (value2 = null));
      if (entry) return false;
      const list = Array['from'](
          getRoot()?.['querySelectorAll']?.('[data-person-replacement-video-center-stage]') || [],
        ),
        list2 = list['map']((el) => {
          const el2 = el['querySelector']?.('[data-person-replacement-video-center-player]');
          if (!el2) return null;
          const run = () => {
              const handle = el2['paused'] === false && el2['ended'] !== true;
              (el['classList']?.['toggle']?.('is-playing', handle),
                el['dataset'] &&
                  (el['dataset']['personReplacementVideoPlaybackState'] = handle ? 'playing' : 'paused'));
            },
            list3 = ['play', 'playing', 'pause', 'ended', 'emptied'];
          return (
            list3['forEach']((state) => {
              el2['addEventListener']?.(state, run);
            }),
            run(),
            () => {
              list3['forEach']((config) => {
                el2['removeEventListener']?.(config, run);
              });
            }
          );
        })['filter'](Boolean);
      return (
        (value2 = () => {
          list2['forEach']((handler) => handler());
        }),
        list2['length'] > 0
      );
    },
    handler2 = () => {
      stopSyncPlayback();
      if (entry) return false;
      const sourceVideo = map['get']('source'),
        resultVideo = map['get']('result'),
        button = resultVideo?.['controlsEl']?.['querySelector']?.(
          '[data-person-replacement-video-sync-play]',
        );
      if (!sourceVideo?.['videoEl'] || !resultVideo?.['videoEl'] || !button) return false;
      return (
        (syncPlayback = createSyncPlayback({
          sourceVideo: sourceVideo['videoEl'],
          resultVideo: resultVideo['videoEl'],
          sourcePlay: sourceVideo['play'],
          resultPlay: resultVideo['play'],
          button: button,
          initiallyEnabled: initiallyEnabled,
          onEnabledChange(scope) {
            initiallyEnabled = scope;
          },
        })),
        true
      );
    },
    stop = ({ closeClip: closeClip = true } = {}) => {
      (stopSyncPlayback(),
        Array['from'](map['keys']())['forEach'](destroyRole),
        value2?.(),
        (value2 = null),
        closeClip && enabled && (videoClipController?.['exit']?.({ silent: true }), (enabled = false)));
    },
    bind = ({ roles: roles = ['source', 'result'], reset: reset = true } = {}) => {
      if (entry) return false;
      const list4 = [
        ...new Set(
          (Array['isArray'](roles) ? roles : [])['filter'](
            (input) => input === 'source' || input === 'result',
          ),
        ),
      ];
      reset && Array['from'](map['keys']())['forEach'](destroyRole);
      bindCenterIndicators();
      const output = getProject();
      if (output?.['workspace']?.['view'] !== 'project' || output['workspace']['step'] !== 3) return false;
      const el3 = getRoot(),
        value3 = getSelectedShot(output);
      return (
        list4['forEach']((master) => {
          destroyRole(master);
          const muted = el3?.['querySelector']?.(
              '[data-person-replacement-video-player="' + master + '"]',
            ),
            controlsEl = el3?.['querySelector']?.(
              '[data-person-replacement-video-controls="' + master + '"]',
            ),
            sourceUrl = normalizeText(muted?.['dataset']?.['personReplacementVideoUrl']);
          if (!muted || !controlsEl || !sourceUrl) return;
          const el4 = controlsEl['querySelector']?.('[data-person-replacement-video-play]'),
            el5 = controlsEl['querySelector']?.('[data-person-replacement-video-volume]'),
            el6 = controlsEl['querySelector']?.('[data-person-replacement-video-volume-toggle]'),
            el7 = controlsEl['querySelector']?.('[data-person-replacement-video-progress]'),
            el8 = controlsEl['querySelector']?.('[data-person-replacement-video-progress-fill]'),
            el9 = controlsEl['querySelector']?.('[data-person-replacement-video-time-current]'),
            el10 = controlsEl['querySelector']?.('[data-person-replacement-video-time-total]'),
            text =
              normalizeText(controlsEl['dataset']?.['personReplacementVideoLabel']) ||
              (master === 'result' ? '替换结果' : '当前片段');
          let value4 = false;
          const value5 = map2['get'](master);
          let lastAudibleVolume = value5
            ? clamp(Number(value5['lastAudibleVolume']), 0, 1, 1) || 1
            : clamp(Number(muted['volume']), 0, 1, 1) || 1;
          value5 &&
            ((muted['volume'] = clamp(Number(value5['volume']), 0, 1, 1)),
            (muted['muted'] = value5['muted'] === true));
          const run2 = () => {
            const volume = clamp(Number(muted['volume']), 0, 1, 0);
            if (muted['muted'] !== true && volume > 0) lastAudibleVolume = volume;
            map2['set'](master, {
              muted: muted['muted'] === true,
              volume: volume,
              lastAudibleVolume: lastAudibleVolume,
            });
          };
          let value6 = null;
          const value7 = createVideoPlayback({
              videoEl: muted,
              sourceUrl: sourceUrl,
              ownerId: [
                'person-replacement',
                normalizeText(output['id'], 'project'),
                normalizeText(value3?.['id'], 'shot'),
                master,
              ]['join'](':'),
              allowConcurrentPlayback: () => syncPlayback?.['isEnabled']?.() === true,
            }),
            handler3 = () => {
              const count = Number(muted['duration']),
                count2 = Number(muted['currentTime']),
                duration = Number['isFinite'](count) && count > 0 ? count : 0,
                currentTime =
                  Number['isFinite'](count2) && count2 > 0 ? Math['min'](count2, duration || count2) : 0;
              return {
                duration: duration,
                currentTime: currentTime,
                ratio: duration > 0 ? clamp(currentTime / duration, 0, 1, 0) : 0,
              };
            },
            handler4 = ({ duration: duration2, currentTime: currentTime2, ratio: ratio }) => {
              if (el9) el9['textContent'] = formatPlaybackTime(currentTime2);
              if (el10) el10['textContent'] = formatPlaybackTime(duration2);
              if (el8?.['style']) el8['style']['width'] = ratio * 100 + '%';
              (el7?.['setAttribute']?.('aria-valuenow', String(Math['round'](ratio * 100))),
                el7?.['setAttribute']?.(
                  'aria-valuetext',
                  formatPlaybackTime(currentTime2) + ' / ' + formatPlaybackTime(duration2),
                ));
            },
            handler5 = () => {
              if (value4) return;
              run2();
              const value8 = muted['paused'] === false && muted['ended'] !== true;
              (el4?.['classList']?.['toggle']?.('is-playing', value8),
                el4?.['setAttribute']?.('aria-label', '' + (value8 ? '暂停' : '播放') + text),
                el4?.['removeAttribute']?.('title'));
              const count3 = Math['round'](
                  clamp(muted['muted'] ? 0 : Number(muted['volume']), 0, 1, 0) * 100,
                ),
                value9 = muted['muted'] === true || count3 === 0;
              el5 &&
                ((el5['value'] = String(count3)),
                el5['style']?.['setProperty']?.('--story-video-volume-progress', count3 + '%'),
                el5['setAttribute']?.('aria-valuetext', count3 + '%'));
              (el6?.['classList']?.['toggle']?.('is-muted', value9),
                el6?.['setAttribute']?.('aria-pressed', String(value9)),
                el6?.['setAttribute']?.('aria-label', '' + (value9 ? '恢复' : '静音') + text));
              if (value6 == null) handler4(handler3());
            },
            progressLoop = createProgressLoop({
              videoEl: muted,
              onFrame: () => {
                if (value6 == null) handler4(handler3());
              },
            }),
            async2 = async (event) => {
              (event?.['preventDefault']?.(), event?.['stopPropagation']?.());
              if (syncPlayback?.['isEnabled']?.()) {
                (await syncPlayback['togglePlayback']({ master: master }), handler5());
                return;
              }
              if (muted['paused'] === false) {
                muted['pause']?.();
                return;
              }
              if (muted['ended']) muted['currentTime'] = 0;
              (await value7['play'](), handler5());
            },
            handler6 = (value10) => {
              const duration3 = Number(muted['duration']),
                box = el7?.['getBoundingClientRect']?.();
              if (!(duration3 > 0) || !(Number(box?.['width']) > 0)) return false;
              const currentTime3 = clamp(
                (Number(value10) - Number(box['left'] || 0)) / Number(box['width']),
                0,
                1,
                0,
              );
              return (
                (muted['currentTime'] = currentTime3 * duration3),
                handler4({ duration: duration3, currentTime: currentTime3 * duration3, ratio: currentTime3 }),
                true
              );
            },
            handler7 = () => {
              const value11 = value6;
              value6 = null;
              if (value11 == null) return;
              try {
                el7?.['releasePointerCapture']?.(value11);
              } catch {}
            },
            value12 = (event2) => {
              (event2['preventDefault']?.(), event2['stopPropagation']?.());
              if (!handler6(event2['clientX'])) return;
              value6 = event2['pointerId'];
              try {
                el7?.['setPointerCapture']?.(event2['pointerId']);
              } catch {}
            },
            value13 = (event3) => {
              if (event3['pointerId'] !== value6) return;
              (event3['preventDefault']?.(), event3['stopPropagation']?.(), handler6(event3['clientX']));
            },
            value14 = (event4) => {
              if (event4['pointerId'] !== value6) return;
              (event4['preventDefault']?.(),
                event4['stopPropagation']?.(),
                handler6(event4['clientX']),
                handler7(),
                handler5());
            },
            value15 = (event5) => {
              if (event5['pointerId'] !== value6) return;
              (event5['preventDefault']?.(), event5['stopPropagation']?.(), handler7(), handler5());
            },
            value16 = (event6) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End']['includes'](event6['key'])) return;
              const count4 = Number(muted['duration']);
              if (!(count4 > 0)) return;
              (event6['preventDefault']?.(), event6['stopPropagation']?.());
              if (event6['key'] === 'Home') muted['currentTime'] = 0;
              else {
                if (event6['key'] === 'End') muted['currentTime'] = count4;
                else {
                  const value17 = event6['key'] === 'ArrowLeft' ? -5 : 5;
                  muted['currentTime'] = clamp(muted['currentTime'] + value17, 0, count4, 0);
                }
              }
              handler5();
            },
            value18 = (event7) => {
              event7['stopPropagation']?.();
              const clamp2 = clamp(Number(event7['currentTarget']?.['value']), 0, 100, 0);
              if (clamp2 > 0) lastAudibleVolume = clamp2 / 100;
              ((muted['muted'] = false), (muted['volume'] = clamp2 / 100), handler5());
            },
            value19 = (event8) => {
              (event8?.['preventDefault']?.(), event8?.['stopPropagation']?.());
              const clamp3 = clamp(Number(muted['volume']), 0, 1, 0);
              (muted['muted'] !== true && clamp3 > 0
                ? ((lastAudibleVolume = clamp3), (muted['muted'] = true))
                : ((muted['volume'] = lastAudibleVolume), (muted['muted'] = false)),
                handler5());
            },
            value20 = (event9) => event9['stopPropagation']?.(),
            list5 = [
              'play',
              'pause',
              'timeupdate',
              'loadedmetadata',
              'durationchange',
              'volumechange',
              'ended',
            ],
            value21 = (value22) => {
              if (value22['type'] === 'loadedmetadata') syncStageFrame(muted);
              handler5();
              if (value22['type'] === 'play') progressLoop['start']();
              else (value22['type'] === 'pause' || value22['type'] === 'ended') && progressLoop['stop']();
            };
          (el4?.['addEventListener']?.('click', async2),
            muted['addEventListener']?.('click', async2),
            el5?.['addEventListener']?.('input', value18),
            el6?.['addEventListener']?.('click', value19),
            el7?.['addEventListener']?.('pointerdown', value12),
            el7?.['addEventListener']?.('pointermove', value13),
            el7?.['addEventListener']?.('pointerup', value14),
            el7?.['addEventListener']?.('pointercancel', value15),
            el7?.['addEventListener']?.('keydown', value16),
            controlsEl['addEventListener']?.('pointerdown', value20),
            list5['forEach']((value23) => {
              muted['addEventListener']?.(value23, value21);
            }),
            syncStageFrame(muted),
            void value7['warm']()['then'](handler5, handler5),
            handler5(),
            map['set'](master, {
              videoEl: muted,
              controlsEl: controlsEl,
              play: () => value7['play'](),
              pause: () => muted['pause']?.(),
              destroy() {
                (run2(),
                  (value4 = true),
                  progressLoop['destroy'](),
                  value7['destroy'](),
                  handler7(),
                  el4?.['removeEventListener']?.('click', async2),
                  muted['removeEventListener']?.('click', async2),
                  el5?.['removeEventListener']?.('input', value18),
                  el6?.['removeEventListener']?.('click', value19),
                  el7?.['removeEventListener']?.('pointerdown', value12),
                  el7?.['removeEventListener']?.('pointermove', value13),
                  el7?.['removeEventListener']?.('pointerup', value14),
                  el7?.['removeEventListener']?.('pointercancel', value15),
                  el7?.['removeEventListener']?.('keydown', value16),
                  controlsEl['removeEventListener']?.('pointerdown', value20),
                  list5['forEach']((value24) => {
                    muted['removeEventListener']?.(value24, value21);
                  }));
              },
            }));
        }),
        handler2(),
        map['size'] > 0
      );
    };
  return Object['freeze']({
    bind: bind,
    bindCenterIndicators: bindCenterIndicators,
    destroyRole: destroyRole,
    stop: stop,
    stopSyncPlayback: stopSyncPlayback,
    toggleSyncEnabled: () => syncPlayback?.['toggleEnabled']?.() ?? false,
    setClipActive(value25) {
      return ((enabled = value25 === true), enabled);
    },
    isClipActive: () => enabled,
    destroy() {
      if (entry) return;
      (stop(), (entry = true));
    },
  });
}
