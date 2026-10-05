import {
  getPersonReplacementShotCutPositionAtTimelineSec,
  getPersonReplacementShotCutTotalDuration,
} from './personReplacementShotCutModel.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function clamp(item, key, index, result = key) {
  const data = Number(item);
  return Number['isFinite'](data) ? Math['min'](index, Math['max'](key, data)) : result;
}
export function createPersonReplacementShotCutPlaybackController({
  windowObject: windowObject,
  isEditorOpen: isEditorOpen,
  getDraft: getDraft,
  getProject: getProject,
  syncNativePlayback: syncNativePlayback,
  syncTimelinePosition: syncTimelinePosition,
  previewShotCut: previewShotCut,
} = {}) {
  let options = 0,
    enabled = ![],
    target = null,
    source = 0,
    next = 0,
    enabled2 = ![],
    enabled3 = 0,
    clamp2 = 0;
  const stop = () => {
      ((next += 1), (enabled2 = ![]), (enabled3 = 0), (clamp2 = 0));
      const current = target;
      target = null;
      if (options) {
        try {
          enabled
            ? windowObject?.['clearTimeout']?.(options)
            : windowObject?.['cancelAnimationFrame']?.(options);
        } catch {}
        options = 0;
      }
      enabled = ![];
      if (source && current?.['cancelVideoFrameCallback'])
        try {
          current['cancelVideoFrameCallback'](source);
        } catch {}
      source = 0;
    },
    handler = (enabled4) => {
      if (
        !isEditorOpen() ||
        !enabled4 ||
        enabled4 !== target ||
        enabled4['paused'] !== ![] ||
        enabled4['ended'] === !![]
      )
        return;
      if (options || source) return;
      const entry = next,
        record = () => {
          if (entry !== next || enabled4 !== target || !isEditorOpen()) return;
          ((options = 0),
            (enabled = ![]),
            (source = 0),
            syncNativePlayback(enabled4),
            enabled4['paused'] === ![] && enabled4['ended'] !== !![] && handler(enabled4));
        };
      if (typeof enabled4['requestVideoFrameCallback'] === 'function')
        try {
          source = enabled4['requestVideoFrameCallback'](record);
          return;
        } catch {}
      const run = windowObject?.['requestAnimationFrame'] || globalThis['requestAnimationFrame'];
      typeof run === 'function'
        ? ((enabled = ![]), (options = run(record)))
        : ((enabled = !![]), (options = windowObject?.['setTimeout']?.(record, 16) || 0));
    },
    startNative = (enabled5) => {
      if (!enabled5) return;
      (enabled5 !== target && (stop(), (target = enabled5)), handler(enabled5));
    },
    startReverse = (el, payload) => {
      if (!el || !isEditorOpen()) return ![];
      stop();
      try {
        el['pause']?.();
      } catch {}
      ((target = el), (enabled2 = !![]), (enabled3 = 0));
      const handle = getDraft();
      ((clamp2 = clamp(payload, 0, getPersonReplacementShotCutTotalDuration(handle), 0)),
        (el['muted'] = !![]));
      const state = next,
        handler2 = () => {
          if (state !== next || !enabled2 || el !== target || !isEditorOpen()) return;
          const run2 = windowObject?.['requestAnimationFrame'] || globalThis['requestAnimationFrame'];
          typeof run2 === 'function'
            ? ((enabled = ![]), (options = run2(handler3)))
            : ((enabled = !![]),
              (options = windowObject?.['setTimeout']?.(() => handler3(Date['now']()), 16) || 0));
        },
        handler3 = (config) => {
          ((options = 0), (enabled = ![]));
          if (state !== next || !enabled2 || el !== target || !isEditorOpen()) return;
          const scope = Number['isFinite'](Number(config)) ? Number(config) : Date['now']();
          if (!enabled3) enabled3 = scope;
          const input = Math['max'](0, (scope - enabled3) / 1000),
            output = getDraft(),
            personReplacementShotCutTotalDuration = getPersonReplacementShotCutTotalDuration(output),
            value2 = Math['min'](personReplacementShotCutTotalDuration, clamp2 + input),
            timelineSec = getPersonReplacementShotCutPositionAtTimelineSec(output, value2),
            enabled6 = output[timelineSec['shotIndex']];
          if (!enabled6) {
            stop();
            return;
          }
          if (enabled6['isReversed'] !== !![]) {
            (stop(),
              previewShotCut(timelineSec['shotId'], timelineSec['sourceTimeSec'], {
                timelineSec: timelineSec['timelineSec'],
                autoplay: !![],
              }));
            return;
          }
          const value3 = getProject(),
            value4 =
              value3['shots']['find']((value5) => value5['id'] === timelineSec['shotId']) ||
              value3['shots']['find']((value6) => value6['id'] === normalizeText(enabled6['originShotId']));
          if (el['dataset']?.['sourceId'] !== value4?.['sourceId']) {
            (stop(),
              previewShotCut(timelineSec['shotId'], timelineSec['sourceTimeSec'], {
                timelineSec: timelineSec['timelineSec'],
                autoplay: !![],
              }));
            return;
          }
          syncTimelinePosition(timelineSec);
          try {
            (!Number['isFinite'](Number(el['currentTime'])) ||
              Math['abs'](Number(el['currentTime']) - timelineSec['sourceTimeSec']) > 0.01) &&
              (el['currentTime'] = timelineSec['sourceTimeSec']);
          } catch {}
          if (value2 >= personReplacementShotCutTotalDuration) {
            stop();
            try {
              el['pause']?.();
            } catch {}
            return;
          }
          handler2();
        };
      return (handler2(), !![]);
    };
  return {
    isReverseActive: () => enabled2,
    startNative: startNative,
    startReverse: startReverse,
    stop: stop,
  };
}
