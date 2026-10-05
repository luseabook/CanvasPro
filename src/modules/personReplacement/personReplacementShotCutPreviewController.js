import { localPathToUrl } from '../../utils/localMediaPath.js';
import {
  PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
  PERSON_REPLACEMENT_CUT_MIN_SEC,
  getPersonReplacementShotCutPositionAtTimelineSec,
  getPersonReplacementShotCutTimelineSec,
  getPersonReplacementShotCutTotalDuration,
} from './personReplacementShotCutModel.js';
import { syncPersonReplacementVideoStageFrame } from './personReplacementVideoPresentation.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function normalizeMediaUrl(item) {
  const text = normalizeText(item);
  if (!text) return '';
  return localPathToUrl(text) || text;
}
function clamp(key, index, result, data = index) {
  const options = Number(key);
  return Number['isFinite'](options) ? Math['min'](result, Math['max'](index, options)) : data;
}
export function createPersonReplacementShotCutPreviewController({
  session: session,
  mediaController: mediaController,
  viewportController: viewportController,
  getRoot: getRoot = () => null,
  getProject: getProject = () => ({}),
} = {}) {
  if (!session?.['workspaceState'] || !session?.['playback'])
    throw new TypeError('Shot cut preview requires a playback session.');
  if (!mediaController || !viewportController)
    throw new TypeError('Shot cut preview requires media and viewport owners.');
  const enabled = session['workspaceState'],
    target = session['playback'],
    stopPlayback = () => session['stopPlayback'](),
    isPlaybackActive = (source) => target['isReverseActive']() || source?.['paused'] === ![],
    cancelFrameWait = () => {
      ((enabled['previewSeekToken'] += 1), session['cancelPreviewFrameWait']());
    },
    clearPreviewMetadata = () => session['clearPreviewMetadata'](),
    cancelHoverPreview = () => session['cancelHoverPreview'](),
    syncTimelinePosition = (options2 = {}) => {
      ((enabled['playheadSec'] = Number(options2['timelineSec']) || 0),
        (enabled['previewShotId'] = normalizeText(options2['shotId'])),
        viewportController['syncPlayhead']());
    },
    markFrameReady = (next, enabled2, current) => {
      if (
        !enabled2 ||
        current !== enabled['previewSeekToken'] ||
        enabled['pendingPreviewSeek'] !== enabled2 ||
        next !== getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-video]')
      )
        return ![];
      const entry = Number(enabled2['sourceSec']),
        record = Number(enabled2['presentedSourceSec']),
        payload = Math['max'](0.04, Number(enabled2['toleranceSec']) || 0);
      if (
        enabled2['seeked'] !== !![] ||
        !Number['isFinite'](entry) ||
        !Number['isFinite'](record) ||
        Math['abs'](record - entry) > payload
      )
        return ![];
      return (
        (enabled['pendingPreviewSeek'] = null),
        (enabled['previewFrameReadyToken'] = current),
        (enabled['previewFrameCallbackId'] = null),
        (enabled['previewFrameCallbackVideo'] = null),
        !![]
      );
    },
    armFrameWait = (enabled3, enabled4, handle) => {
      if (
        !enabled3 ||
        !enabled4 ||
        handle !== enabled['previewSeekToken'] ||
        enabled['pendingPreviewSeek'] !== enabled4
      )
        return ![];
      session['cancelPreviewFrameWait']();
      if (typeof enabled3['requestVideoFrameCallback'] !== 'function') return ![];
      try {
        return (
          (enabled['previewFrameCallbackVideo'] = enabled3),
          (enabled['previewFrameCallbackId'] = enabled3['requestVideoFrameCallback']((state, config = {}) => {
            if (handle !== enabled['previewSeekToken']) return;
            ((enabled['previewFrameCallbackId'] = null), (enabled['previewFrameCallbackVideo'] = null));
            const scope = Number(config?.['mediaTime']);
            ((enabled4['presentedSourceSec'] = Number['isFinite'](scope)
              ? scope
              : Number(enabled3['currentTime'])),
              markFrameReady(enabled3, enabled4, handle) && syncPlaybackFromVideo(enabled3));
          })),
          !![]
        );
      } catch {
        return (
          (enabled['previewFrameCallbackId'] = null),
          (enabled['previewFrameCallbackVideo'] = null),
          ![]
        );
      }
    },
    preview = (
      input,
      output,
      {
        timelineSec: timelineSec = null,
        autoplay: autoplay = ![],
        hover: hover = ![],
        preservePlayhead: preservePlayhead = ![],
      } = {},
    ) => {
      const text2 = normalizeText(input),
        project = getProject(),
        value2 = enabled['draft']['find']((value3) => normalizeText(value3?.['shotId']) === text2),
        enabled5 =
          project['shots']['find']((value4) => value4['id'] === text2) ||
          project['shots']['find']((value5) => value5['id'] === normalizeText(value2?.['originShotId'])),
        enabled6 = mediaController['getSourceMediaRef'](enabled5?.['sourceId']),
        el = getRoot(),
        el2 = el?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (!enabled5 || !enabled6 || !el2) return ![];
      const rangeId = value2?.['shotId'] || enabled5['id'],
        value6 = Math['max'](
          PERSON_REPLACEMENT_CUT_MIN_SEC,
          1 / Math['max'](1, Number(value2?.['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS),
        );
      cancelFrameWait();
      const token = enabled['previewSeekToken'],
        value7 = timelineSec !== null && timelineSec !== undefined && Number['isFinite'](Number(timelineSec)),
        value8 = value7
          ? clamp(Number(timelineSec), 0, getPersonReplacementShotCutTotalDuration(enabled['draft']), 0)
          : getPersonReplacementShotCutTimelineSec(enabled['draft'], rangeId, output);
      !hover
        ? ((enabled['hoverPreviewActive'] = ![]),
          (enabled['hoverPreviewTimeSec'] = null),
          (enabled['previewShotId'] = rangeId),
          (enabled['pendingPreviewSeek'] = {
            rangeId: rangeId,
            sourceSec: Number(output) || 0,
            kind: preservePlayhead ? 'boundary-preview' : 'playhead',
            token: token,
            toleranceSec: Math['max'](0.04, value6 * 2),
            seeked: ![],
            presentedSourceSec: Number['NaN'],
          }),
          !preservePlayhead && ((enabled['playheadSec'] = value8), viewportController['syncPlayhead']()),
          el?.['querySelectorAll']?.('[data-person-replacement-cut-shot-index]')?.['forEach']?.((el3) => {
            const value9 = el3['dataset']?.['shotId'] === rangeId;
            (el3['classList']?.['toggle']?.('is-previewing', value9),
              el3['setAttribute']?.('aria-pressed', String(value9)));
            if (value9) el3['setAttribute']?.('data-selected-clip', 'true');
            else el3['removeAttribute']?.('data-selected-clip');
          }))
        : (enabled['pendingPreviewSeek'] = {
            rangeId: rangeId,
            sourceSec: Number(output) || 0,
            kind: 'hover',
            token: token,
            toleranceSec: Math['max'](0.04, value6 * 2),
            seeked: ![],
            presentedSourceSec: Number['NaN'],
          });
      const mediaUrl = normalizeMediaUrl(enabled6),
        enabled7 = el2['dataset']?.['sourceId'] !== enabled5['sourceId'];
      let value10 = ![];
      const run = () => {
          if (!autoplay || value2?.['isReversed'] === !![] || value10) return;
          value10 = !![];
          try {
            const value11 = mediaController['playPreviewVideo'](el2);
            Promise['resolve'](value11)['then'](
              (value12) => {
                if (value12 === ![]) value10 = ![];
              },
              () => {
                value10 = ![];
              },
            );
          } catch {
            value10 = ![];
          }
        },
        handler = () => {
          (clearPreviewMetadata(), syncPersonReplacementVideoStageFrame(el2));
          const value13 = enabled['pendingPreviewSeek'];
          let enabled8 = ![];
          try {
            const value14 = Math['max'](0, Number(output) || 0);
            (!Number['isFinite'](Number(el2['currentTime'])) ||
              Math['abs'](Number(el2['currentTime']) - value14) > 0.02) &&
              ((el2['currentTime'] = value14), (enabled8 = !![]));
          } catch {}
          value13 && !enabled8 && (value13['seeked'] = el2['seeking'] !== !![]);
          let enabled9 = ![];
          value13 && !enabled8 && !enabled7
            ? ((value13['presentedSourceSec'] = Number(el2['currentTime'])),
              markFrameReady(el2, value13, token))
            : (enabled9 = armFrameWait(el2, value13, token));
          value13 &&
            !enabled9 &&
            ((value13['presentedSourceSec'] = Number(el2['currentTime'])),
            markFrameReady(el2, value13, token));
          if (autoplay && value2?.['isReversed'] === !![]) target['startReverse'](el2, value8);
          else run();
        };
      ((el2['preload'] = 'auto'), (el2['muted'] = !enabled['soundEnabled']), clearPreviewMetadata());
      if (enabled7)
        (stopPlayback(),
          mediaController['attachPreviewMedia'](el2, enabled5['sourceId'], mediaUrl),
          el2['addEventListener']?.('loadedmetadata', handler, { once: !![] }),
          (enabled['previewMetadataCleanup'] = () => {
            el2['removeEventListener']?.('loadedmetadata', handler);
          }));
      else
        Number(el2['readyState']) >= 1
          ? handler()
          : (el2['addEventListener']?.('loadedmetadata', handler, { once: !![] }),
            (enabled['previewMetadataCleanup'] = () => {
              el2['removeEventListener']?.('loadedmetadata', handler);
            }),
            run());
      return (autoplay && value2?.['isReversed'] !== !![] && target['startNative'](el2), !![]);
    },
    seekTimeline = (value15, { autoplay: autoplay = ![] } = {}) => {
      if (!enabled['isOpen'] || viewportController['isBusy']() || enabled['isKeyframeCapturing']) return ![];
      const timelineSec2 = getPersonReplacementShotCutPositionAtTimelineSec(enabled['draft'], value15);
      if (timelineSec2['shotIndex'] < 0) return ![];
      return preview(timelineSec2['shotId'], timelineSec2['sourceTimeSec'], {
        timelineSec: timelineSec2['timelineSec'],
        autoplay: autoplay,
      });
    },
    togglePlayback = () => {
      if (!enabled['isOpen'] || viewportController['isBusy']() || enabled['isKeyframeCapturing']) return ![];
      const el4 = getRoot(),
        enabled10 = el4?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (!enabled10) return ![];
      if (isPlaybackActive(enabled10)) return (enabled10['pause']?.(), stopPlayback(), !![]);
      const personReplacementShotCutTotalDuration = getPersonReplacementShotCutTotalDuration(
          enabled['draft'],
        ),
        personReplacementShotCutPositionAtTimelineSec = getPersonReplacementShotCutPositionAtTimelineSec(
          enabled['draft'],
          enabled['playheadSec'],
        ),
        value16 = Math['max'](
          PERSON_REPLACEMENT_CUT_MIN_SEC,
          1 /
            Math['max'](
              1,
              Number(
                enabled['draft'][personReplacementShotCutPositionAtTimelineSec['shotIndex']]?.['outputFps'],
              ) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
            ),
        );
      enabled['playheadSec'] >= personReplacementShotCutTotalDuration - value16 / 2 &&
        (enabled['playheadSec'] = 0);
      ((enabled['hoverPreviewActive'] = ![]), (enabled['hoverPreviewTimeSec'] = null), cancelHoverPreview());
      const el5 = el4?.['querySelector']?.('[data-person-replacement-shot-cut-hover-playhead]');
      return (
        el5 && ((el5['hidden'] = !![]), el5['classList']?.['remove']?.('is-visible')),
        seekTimeline(enabled['playheadSec'], { autoplay: !![] })
      );
    },
    stepTimeline = (value17, value18 = 1) => {
      const personReplacementShotCutPositionAtTimelineSec2 = getPersonReplacementShotCutPositionAtTimelineSec(
          enabled['draft'],
          enabled['playheadSec'],
        ),
        value19 = Math['max'](
          1,
          Number(
            enabled['draft'][personReplacementShotCutPositionAtTimelineSec2['shotIndex']]?.['outputFps'],
          ) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
        );
      return seekTimeline(
        enabled['playheadSec'] +
          ((Number(value17) < 0 ? -1 : 1) * Math['max'](1, Number(value18) || 1)) / value19,
      );
    },
    syncPlaybackFromVideo = (enabled11) => {
      if (!enabled['isOpen'] || !enabled11 || enabled['boundaryDrag']) return;
      const value20 = enabled['pendingPreviewSeek'],
        value21 = value20?.['rangeId'] || enabled['previewShotId'],
        value22 = enabled['draft']['findIndex'](
          (value23) => normalizeText(value23?.['shotId']) === normalizeText(value21),
        ),
        enabled12 = enabled['draft'][value22];
      if (!enabled12) return;
      const value24 = Number(enabled11['currentTime']);
      if (!Number['isFinite'](value24)) return;
      if (target['isReverseActive']()) {
        viewportController['syncPlayhead']();
        return;
      }
      const value25 = Math['max'](
        PERSON_REPLACEMENT_CUT_MIN_SEC,
        1 / Math['max'](1, Number(enabled12['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS),
      );
      if (value20) {
        if (Number(value20['token']) !== enabled['previewSeekToken']) return;
        if (enabled['previewFrameReadyToken'] !== Number(value20['token'])) return;
      }
      if (enabled['hoverPreviewActive'] && enabled11['paused'] !== ![]) return;
      if (value24 >= Number(enabled12['endSec']) - value25 / 2) {
        const enabled13 = enabled['draft'][value22 + 1];
        if (enabled11['paused'] === ![] && enabled13) {
          const timelineSec3 = getPersonReplacementShotCutTimelineSec(
            enabled['draft'],
            enabled13['shotId'],
            enabled13['startSec'],
          );
          preview(enabled13['shotId'], enabled13['startSec'], { timelineSec: timelineSec3, autoplay: !![] });
          return;
        }
        if (!enabled13) {
          ((enabled['playheadSec'] = getPersonReplacementShotCutTotalDuration(enabled['draft'])),
            enabled11['pause']?.(),
            viewportController['syncPlayhead']());
          return;
        }
      }
      ((enabled['playheadSec'] = getPersonReplacementShotCutTimelineSec(
        enabled['draft'],
        enabled12['shotId'],
        value24,
      )),
        viewportController['syncPlayhead']());
    };
  return Object['freeze']({
    armFrameWait: armFrameWait,
    cancelFrameWait: cancelFrameWait,
    cancelHoverPreview: cancelHoverPreview,
    clearPreviewMetadata: clearPreviewMetadata,
    isPlaybackActive: isPlaybackActive,
    markFrameReady: markFrameReady,
    preview: preview,
    seekTimeline: seekTimeline,
    stepTimeline: stepTimeline,
    stopPlayback: stopPlayback,
    syncPlaybackFromVideo: syncPlaybackFromVideo,
    syncTimelinePosition: syncTimelinePosition,
    togglePlayback: togglePlayback,
  });
}
