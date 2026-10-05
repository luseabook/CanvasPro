import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
} from '../../services/desktopMediaBlobSource.js';
import { buildPersonReplacementCompositePreviewSnapshot } from './personReplacementCompositePreviewProjection.js';
import { getPersonReplacementShotDurationSec } from './personReplacementShotCutModel.js';
export const PERSON_REPLACEMENT_COMPOSITE_PREWARM_MAX_BYTES = 64 * 1024 * 1024;
export const PERSON_REPLACEMENT_COMPOSITE_PREWARM_TIMEOUT_MS = 5000;
function normalizeText(value, item = '') {
  const key = String(value ?? '')['trim']();
  return key || item;
}
function clamp(index, result, data, options = result) {
  const target = Number(index);
  return Number['isFinite'](target) ? Math['min'](data, Math['max'](result, target)) : options;
}
function formatPreviewTime(source) {
  const next = Math['max'](0, Number(source) || 0),
    current = Math['floor'](next / 60);
  return current + ':' + String(Math['floor'](next % 60))['padStart'](2, '0');
}
export function createPersonReplacementCompositePlaybackBinding({
  root: root,
  project: project,
  getProject: getProject = () => project,
  windowObject: windowObject = globalThis['window'] || globalThis,
  createVideoPlayback: createVideoPlayback,
  originalVideo: originalVideo = null,
  replacementVideo: replacementVideo = null,
  adoptedOriginalPlayback: adoptedOriginalPlayback = null,
  adoptedReplacementPlayback: adoptedReplacementPlayback = null,
} = {}) {
  if (!root || !project || typeof createVideoPlayback !== 'function')
    throw new Error('person replacement composite playback requires workspace adapters');
  const el = root['querySelector']?.('[data-person-replacement-composite-preview]'),
    el2 = root['querySelector']?.('[data-person-replacement-compare-original-audio]'),
    text = normalizeText(el2?.['dataset']?.['personReplacementCompareOriginalAudioUrl']),
    el3 = root['querySelector']?.('[data-person-replacement-compare-replacement-audio]'),
    text2 = normalizeText(el3?.['dataset']?.['personReplacementCompareReplacementAudioUrl']),
    list = Array['from'](
      root['querySelectorAll']?.(
        '[data-person-replacement-compare-playback], ' + '[data-person-replacement-compare-playback-control]',
      ) || [],
    ),
    el4 = root['querySelector']?.('[data-person-replacement-compare-progress]'),
    el5 = root['querySelector']?.('[data-person-replacement-compare-progress-fill]'),
    el6 = root['querySelector']?.('[data-person-replacement-compare-current-time]'),
    el7 = root['querySelector']?.('[data-person-replacement-compare-total-time]'),
    el8 = root['querySelector']?.('[data-person-replacement-compare-volume]'),
    el9 = root['querySelector']?.('[data-person-replacement-compare-volume-toggle]'),
    list2 = [originalVideo, replacementVideo]['filter'](Boolean),
    el10 = replacementVideo || originalVideo;
  if (!el || !el10 || !list2['length']) return null;
  const personReplacementCompositePreviewSnapshot = buildPersonReplacementCompositePreviewSnapshot(project),
    entry = personReplacementCompositePreviewSnapshot['selectedShot'],
    record = personReplacementCompositePreviewSnapshot['previewMode'] === 'full',
    durationSec = record ? personReplacementCompositePreviewSnapshot['composedShots'] : [],
    payload = record
      ? {
          id: 'complete-video',
          startTimeSec: 0,
          durationSec: durationSec['reduce'](
            (handle, state) => handle + getPersonReplacementShotDurationSec(state),
            0,
          ),
        }
      : entry;
  let enabled = ![];
  const map = new Map();
  list2['forEach']((videoEl, config) => {
    const text3 =
        normalizeText(videoEl['dataset']?.['personReplacementCompareVideo']) ||
        (videoEl === replacementVideo ? 'replacement' : 'original'),
      sourceUrl = normalizeText(
        videoEl['dataset']?.['personReplacementCompareVideoUrl'] ||
          videoEl['getAttribute']?.('src') ||
          videoEl['src'],
      );
    if (!sourceUrl) return;
    const scope =
        videoEl === adoptedOriginalPlayback?.['videoEl']
          ? adoptedOriginalPlayback
          : videoEl === adoptedReplacementPlayback?.['videoEl']
            ? adoptedReplacementPlayback
            : null,
      input =
        scope?.['controller'] ||
        createVideoPlayback({
          videoEl: videoEl,
          sourceUrl: sourceUrl,
          ownerId: [
            'person-replacement',
            normalizeText(project['id']) || 'project',
            normalizeText(payload?.['id']) || String(config),
            'composite',
            text3,
          ]['join'](':'),
          allowConcurrentPlayback: !![],
          preferStreamingSource: ![],
          ...(record
            ? {
                acquirePlaybackOptions: {
                  bypassConcurrencyLimit: !![],
                  maxBytes: PERSON_REPLACEMENT_COMPOSITE_PREWARM_MAX_BYTES,
                  timeout: PERSON_REPLACEMENT_COMPOSITE_PREWARM_TIMEOUT_MS,
                },
              }
            : {}),
        });
    (map['set'](videoEl, input), void Promise['resolve'](input['warm']?.())['catch'](() => ![]));
  });
  const output =
      el3 && text2
        ? attachMediaElementPlaybackSource(el3, text2, {
            preload: 'auto',
            shouldAssign: () => !enabled && el3['isConnected'] !== ![],
          })['catch'](() => '')
        : Promise['resolve'](''),
    value2 =
      el2 && text
        ? attachMediaElementPlaybackSource(el2, text, {
            preload: 'auto',
            shouldAssign: () => !enabled && el2['isConnected'] !== ![],
          })['catch'](() => '')
        : Promise['resolve'](''),
    value3 = Math['max'](0, Number(payload?.['startTimeSec']) || 0);
  let value4 = 0,
    value5 = 0,
    value6 = null,
    value7 = 0,
    enabled2 = ![],
    clamp2 = clamp(
      Number(el3?.['volume'] ?? replacementVideo?.['volume'] ?? originalVideo?.['volume']),
      0,
      1,
      1,
    ),
    value8 = clamp2 || 1;
  const run = () => (getProject()?.['audio']?.['previewTrack'] === 'original' ? 'original' : 'replacement'),
    handler = () => {
      const count = Number(el10['duration']);
      if (Number['isFinite'](count) && count > 0) return count;
      return Math['max'](0, Number(payload?.['durationSec']) || 0);
    },
    handler2 = () => {
      const count2 = Number(el10['currentTime']);
      return Number['isFinite'](count2) && count2 > 0 ? count2 : 0;
    },
    handler3 = () => {
      const count3 = handler(),
        value9 = Math['min'](handler2(), count3 || handler2()),
        value10 = count3 > 0 ? clamp(value9 / count3, 0, 1, 0) : 0;
      if (el5?.['style']) el5['style']['width'] = value10 * 100 + '%';
      (el4?.['setAttribute']?.('aria-valuenow', String(Math['round'](value10 * 100))),
        el4?.['setAttribute']?.(
          'aria-valuetext',
          formatPreviewTime(value9) + ' / ' + formatPreviewTime(count3),
        ));
      if (el6) el6['textContent'] = formatPreviewTime(value9);
      if (el7) el7['textContent'] = formatPreviewTime(count3);
    },
    handler4 = () => {
      if (!el8) return;
      const count4 = Math['round'](clamp2 * 100);
      ((el8['value'] = String(count4)),
        el8['style']?.['setProperty']?.('--story-video-volume-progress', count4 + '%'),
        el8['setAttribute']?.('aria-valuetext', count4 + '%'));
      const value11 = count4 === 0;
      (el9?.['classList']?.['toggle']?.('is-muted', value11),
        el9?.['setAttribute']?.('aria-pressed', String(value11)),
        el9?.['setAttribute']?.('aria-label', (value11 ? '恢复' : '静音') + '原视频和替换视频'));
    },
    handler5 = (value12) => {
      const value13 = value3 + Math['max'](0, Number(value12) || 0),
        count5 = Number(el3?.['duration']);
      return Number['isFinite'](count5) && count5 > 0
        ? Math['min'](value13, Math['max'](0, count5 - 0.04))
        : value13;
    },
    handler6 = ({ force: force = ![] } = {}) => {
      const value14 = handler2();
      list2['forEach']((value15) => {
        if (value15 === el10) return;
        const count6 = Math['abs']((Number(value15['currentTime']) || 0) - value14);
        if (force || count6 > 0.1)
          try {
            value15['currentTime'] = value14;
          } catch {}
      });
      if (el3) {
        const value16 = handler5(value14),
          count7 = Math['abs']((Number(el3['currentTime']) || 0) - value16);
        if (force || count7 > 0.12)
          try {
            el3['currentTime'] = value16;
          } catch {}
      }
      if (el2) {
        const count8 = Math['abs']((Number(el2['currentTime']) || 0) - value14);
        if (force || count8 > 0.12)
          try {
            el2['currentTime'] = value14;
          } catch {}
      }
    },
    handler7 = (value17 = run()) => {
      const value18 = value17 === 'original' ? 'original' : 'replacement';
      originalVideo && (originalVideo['muted'] = value18 !== 'original' || Boolean(el2));
      replacementVideo && (replacementVideo['muted'] = value18 !== 'replacement' || Boolean(el3));
      if (el2) el2['muted'] = value18 !== 'original';
      if (el3) el3['muted'] = value18 !== 'replacement';
      el['dataset']['previewTrack'] = value18;
    },
    handler8 = () => el10['paused'] === ![] && el10['ended'] !== !![],
    value19 = (value20) => value20?.['paused'] === ![] && value20?.['ended'] !== !![],
    handler9 = () => {
      const enabled3 = handler8(),
        value21 = enabled2 && !enabled3;
      (el['classList']?.['toggle']?.('is-comparison-playing', enabled3),
        el['classList']?.['toggle']?.('is-comparison-loading', value21),
        list['forEach']((el11) => {
          (el11['classList']?.['toggle']?.('is-playing', enabled3),
            el11['classList']?.['toggle']?.('is-loading', value21),
            el11['setAttribute']?.('aria-pressed', String(enabled3)),
            el11['setAttribute']?.('aria-busy', String(value21)),
            el11['setAttribute']?.(
              'aria-label',
              value21 ? '取消同步播放加载' : enabled3 ? '暂停原视频和替换视频' : '播放原视频和替换视频',
            ));
        }));
      if (value6 == null) handler3();
      handler4();
    },
    handler10 = () => {
      (value4 && (windowObject?.['cancelAnimationFrame']?.(value4), (value4 = 0)),
        value5 && (windowObject?.['clearTimeout']?.(value5), (value5 = 0)));
    },
    handler11 = () => {
      handler10();
      if (enabled || !handler8()) return;
      const value22 = () => {
        ((value4 = 0), (value5 = 0));
        if (enabled || !handler8()) return;
        (handler6(), handler3(), handler11());
      };
      typeof windowObject?.['requestAnimationFrame'] === 'function'
        ? (value4 = windowObject['requestAnimationFrame'](value22))
        : (value5 = windowObject?.['setTimeout']?.(value22, 32) || 0);
    },
    handler12 = ({ cancelPending: cancelPending = !![] } = {}) => {
      if (cancelPending) value7 += 1;
      ((enabled2 = ![]),
        list2['forEach']((value23) => value23['pause']?.()),
        el2?.['pause']?.(),
        el3?.['pause']?.(),
        handler10(),
        handler9());
    },
    handler13 = async () => {
      const value24 = value7 + 1;
      ((value7 = value24), (enabled2 = !![]), handler9());
      const count9 = handler();
      (el10['ended'] || (count9 > 0 && handler2() >= count9 - 0.04)) && (el10['currentTime'] = 0);
      (handler6({ force: !![] }), handler7());
      const list3 = [...list2],
        value25 = run(),
        value26 = value25 === 'original' ? el2 : el3,
        promise = value25 === 'original' ? value2 : output;
      if (value26) list3['push'](value26);
      if (value26 !== el2) el2?.['pause']?.();
      if (value26 !== el3) el3?.['pause']?.();
      const value27 = Promise['allSettled'](
        list2['map']((value28) => {
          const value29 = map['get'](value28);
          try {
            return value29?.['play']?.() ?? value28['play']?.();
          } catch (value30) {
            return Promise['reject'](value30);
          }
        }),
      );
      value26 &&
        list3['includes'](value26) &&
        void promise['then']((enabled4) => {
          if (!enabled4) throw new Error('Selected audio source unavailable');
          if (enabled || value24 !== value7) return ![];
          return value26['play']?.();
        })
          ['then'](() => {
            if (enabled || value24 !== value7) {
              value26['pause']?.();
              return;
            }
            handler6({ force: !![] });
          })
          ['catch'](() => {
            if (enabled || value24 !== value7) return;
            value26['pause']?.();
            const value31 = value25 === 'original' ? originalVideo : replacementVideo;
            if (value31) value31['muted'] = ![];
            handler4();
          });
      const list4 = await value27;
      if (enabled || value24 !== value7) return (list3['forEach']((value32) => value32['pause']?.()), ![]);
      enabled2 = ![];
      const value33 =
        list4['some']((el12) => el12['status'] === 'rejected' || el12['value'] === ![]) ||
        !list2['every'](value19);
      if (value33)
        return (
          handler12({ cancelPending: ![] }),
          windowObject?.['showToast']?.('同步播放失败，请确认视频文件仍然可用。', 'warn'),
          ![]
        );
      return (handler6({ force: !![] }), handler9(), handler11(), !![]);
    },
    togglePlayback = () => {
      if (handler8() || enabled2) return (handler12(), ![]);
      return (void handler13(), !![]);
    },
    handler14 = (value34) => {
      const count10 = handler();
      if (!(count10 > 0)) return ![];
      const clamp3 = clamp(Number(value34), 0, 1, 0);
      return ((el10['currentTime'] = clamp3 * count10), handler6({ force: !![] }), handler3(), !![]);
    },
    handler15 = (value35) => {
      const box = el4?.['getBoundingClientRect']?.();
      if (!(Number(box?.['width']) > 0)) return ![];
      return handler14((Number(value35) - Number(box['left'] || 0)) / Number(box['width']));
    },
    handler16 = () => {
      const value36 = value6;
      value6 = null;
      if (value36 == null) return;
      try {
        el4?.['releasePointerCapture']?.(value36);
      } catch {}
    },
    value37 = (event) => {
      (event['preventDefault']?.(), event['stopPropagation']?.());
      if (!handler15(event['clientX'])) return;
      value6 = event['pointerId'];
      try {
        el4?.['setPointerCapture']?.(event['pointerId']);
      } catch {}
    },
    value38 = (event2) => {
      if (event2['pointerId'] !== value6) return;
      (event2['preventDefault']?.(), event2['stopPropagation']?.(), handler15(event2['clientX']));
    },
    value39 = (event3) => {
      if (event3['pointerId'] !== value6) return;
      (event3['preventDefault']?.(),
        event3['stopPropagation']?.(),
        handler15(event3['clientX']),
        handler16(),
        handler9());
    },
    value40 = (event4) => {
      if (event4['pointerId'] !== value6) return;
      (event4['preventDefault']?.(), event4['stopPropagation']?.(), handler16(), handler9());
    },
    value41 = (event5) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End']['includes'](event5['key'])) return;
      const count11 = handler();
      if (!(count11 > 0)) return;
      (event5['preventDefault']?.(), event5['stopPropagation']?.());
      if (event5['key'] === 'Home') handler14(0);
      else {
        if (event5['key'] === 'End') handler14(1);
        else {
          const value42 = event5['key'] === 'ArrowLeft' ? -5 : 5;
          handler14((handler2() + value42) / count11);
        }
      }
      handler9();
    },
    value43 = (event6) => {
      (event6['stopPropagation']?.(),
        (clamp2 = clamp(Number(event6['currentTarget']?.['value']) / 100, 0, 1, clamp2)));
      if (clamp2 > 0) value8 = clamp2;
      ([...list2, el2, el3]['filter'](Boolean)['forEach']((value44) => {
        value44['volume'] = clamp2;
      }),
        handler4());
    },
    value45 = (event7) => {
      (event7?.['preventDefault']?.(),
        event7?.['stopPropagation']?.(),
        (clamp2 = clamp2 > 0 ? 0 : value8),
        [...list2, el2, el3]['filter'](Boolean)['forEach']((value46) => {
          value46['volume'] = clamp2;
        }),
        handler4());
    },
    value47 = (value48) => {
      if (value48['type'] === 'ended') {
        handler12();
        return;
      }
      handler9();
      if (value48['type'] === 'play' || value48['type'] === 'playing') handler11();
      else value48['type'] === 'pause' && handler10();
    },
    list5 = ['play', 'playing', 'pause', 'ended', 'loadedmetadata', 'durationchange', 'timeupdate', 'seeked'];
  (el4?.['addEventListener']?.('pointerdown', value37),
    el4?.['addEventListener']?.('pointermove', value38),
    el4?.['addEventListener']?.('pointerup', value39),
    el4?.['addEventListener']?.('pointercancel', value40),
    el4?.['addEventListener']?.('keydown', value41),
    el8?.['addEventListener']?.('input', value43),
    el9?.['addEventListener']?.('click', value45),
    list5['forEach']((value49) => {
      el10['addEventListener']?.(value49, value47);
    }),
    handler7(),
    handler3(),
    handler9());
  const run2 = ({ retainVideos: retainVideos = [] } = {}) => {
    if (enabled) return new Map();
    ((enabled = !![]), handler12());
    const map2 = new Map();
    return (
      (Array['isArray'](retainVideos) ? retainVideos : [])['forEach']((value50) => {
        const enabled5 = map['get'](value50);
        if (!enabled5) return;
        (map2['set'](value50, enabled5), map['delete'](value50));
      }),
      map['forEach']((value51) => value51['destroy']?.()),
      map['clear'](),
      handler16(),
      el4?.['removeEventListener']?.('pointerdown', value37),
      el4?.['removeEventListener']?.('pointermove', value38),
      el4?.['removeEventListener']?.('pointerup', value39),
      el4?.['removeEventListener']?.('pointercancel', value40),
      el4?.['removeEventListener']?.('keydown', value41),
      el8?.['removeEventListener']?.('input', value43),
      el9?.['removeEventListener']?.('click', value45),
      list5['forEach']((value52) => {
        el10['removeEventListener']?.(value52, value47);
      }),
      [el2, el3]['filter'](Boolean)['forEach']((value53) => {
        try {
          (value53['removeAttribute']?.('src'),
            clearDesktopMediaPlaybackSourceMetadata(value53),
            (value53['preload'] = 'none'),
            value53['load']?.());
        } catch {}
      }),
      map2
    );
  };
  return Object['freeze']({
    togglePlayback: togglePlayback,
    setTrack(value54) {
      (handler7(value54), handler6({ force: !![] }));
      const value55 = value54 === 'original' ? el2 : el3,
        promise2 = value54 === 'original' ? value2 : output;
      value55 &&
        handler8() &&
        void promise2['then']((enabled6) => {
          if (!enabled6 || enabled || !handler8()) return ![];
          return value55['play']?.();
        })['catch'](() => {
          const value56 = value54 === 'original' ? originalVideo : replacementVideo;
          if (!enabled && value56) value56['muted'] = ![];
        });
      if (value55 !== el2) el2?.['pause']?.();
      if (value55 !== el3) el3?.['pause']?.();
      handler9();
    },
    warmOriginalPlayback(value57 = '') {
      const text4 = normalizeText(value57),
        text5 = normalizeText(originalVideo?.['dataset']?.['personReplacementCompareVideoUrl']),
        enabled7 = originalVideo ? map['get'](originalVideo) : null;
      if (enabled || !enabled7 || !text4 || text4 !== text5) return Promise['resolve'](![]);
      try {
        return Promise['resolve'](enabled7['play']?.())['then'](
          (value58) => {
            if (!enabled) originalVideo['pause']?.();
            return value58 !== ![];
          },
          () => ![],
        );
      } catch {
        return Promise['resolve'](![]);
      }
    },
    retainOriginalPlayback(value59 = '') {
      const text6 = normalizeText(value59),
        sourceUrl2 = normalizeText(originalVideo?.['dataset']?.['personReplacementCompareVideoUrl']);
      if (!originalVideo || !text6 || text6 !== sourceUrl2) return null;
      const map3 = run2({ retainVideos: [originalVideo] }),
        controller = map3['get'](originalVideo);
      return controller ? { sourceUrl: sourceUrl2, videoEl: originalVideo, controller: controller } : null;
    },
    retainFullPlaybacks(options2 = {}) {
      const retainVideos2 = [
        ['original', originalVideo, normalizeText(options2['original'])],
        ['replacement', replacementVideo, normalizeText(options2['replacement'])],
      ]['filter'](
        ([, el13, value60]) =>
          el13 &&
          value60 &&
          value60 === normalizeText(el13['dataset']?.['personReplacementCompareVideoUrl']) &&
          map['has'](el13),
      );
      if (!retainVideos2['length']) return null;
      const map4 = run2({ retainVideos: retainVideos2['map'](([, value61]) => value61) });
      return retainVideos2['reduce']((value62, [value63, videoEl2, sourceUrl3]) => {
        const controller2 = map4['get'](videoEl2);
        return (
          controller2 &&
            (value62[value63] = { sourceUrl: sourceUrl3, videoEl: videoEl2, controller: controller2 }),
          value62
        );
      }, {});
    },
    destroy() {
      run2();
    },
  });
}
