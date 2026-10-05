import { captureVideoFrameSnapshot, waitForVideoFrame } from '../../components/videoFrameCapture.js';
import {
  countEditablePersonReplacementShotCuts,
  createPersonReplacementShotCutDraft,
  getPersonReplacementShotCutPositionAtTimelineSec,
} from './personReplacementShotCutModel.js';
import { hasSplittablePersonReplacementShotCut } from './personReplacementShotCutRendering.js';
import { togglePersonReplacementShotReverseAtTimelineSec } from './personReplacementShotReverse.js';
const PREVIEW_READY_TIMEOUT_MS = 30000;
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function clone(item) {
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(item);
    } catch {}
  return JSON['parse'](JSON['stringify'](item));
}
export function createPersonReplacementShotCutEditorController({
  session: session,
  previewController: previewController,
  mediaController: mediaController,
  viewportController: viewportController,
  getRoot: getRoot = () => null,
  getProject: getProject = () => ({}),
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis,
  isDestroyed: isDestroyed = () => false,
  requestRender: requestRender = () => {},
  onShotKeyframeSelected: onShotKeyframeSelected = () => {},
  onShotReverseRequested: onShotReverseRequested = () => {},
  hideResultHistoryMenu: hideResultHistoryMenu = () => {},
  scrollShotCardIntoView: scrollShotCardIntoView = () => {},
} = {}) {
  if (!session?.['workspaceState'] || !session?.['playback'])
    throw new TypeError('Shot cut editor requires a session.');
  if (!previewController || !mediaController || !viewportController)
    throw new TypeError('Shot cut editor requires preview, media, and viewport owners.');
  const timelineSec = session['workspaceState'],
    key = session['playback'],
    reset = () => {
      session['close']({ releaseBuffer: false });
    },
    requestReverseChange = (index, isReversed, args = {}) => {
      const onShotReverseRequested2 = onShotReverseRequested({
        ...args,
        shotId: normalizeText(index),
        isReversed: isReversed === true,
      });
      return (onShotReverseRequested2?.['completion']?.['catch']?.(() => {}), onShotReverseRequested2);
    },
    syncReverseDraftToProject = () => {
      const project = getProject();
      for (const result of timelineSec['draft']) {
        const text = normalizeText(result?.['shotId']),
          text2 = normalizeText(result?.['originShotId']),
          enabled =
            project['shots']['find']((data) => data['id'] === text) ||
            project['shots']['find']((options) => options['id'] === text2);
        if (!enabled || Boolean(enabled['isReversed']) === Boolean(result?.['isReversed'])) continue;
        requestReverseChange(enabled['id'], result?.['isReversed'] === true);
      }
    },
    toggleReverse = () => {
      if (!timelineSec['isOpen'] || viewportController['isDraftMutationBusy']()) return false;
      const target = { draft: clone(timelineSec['draft']), undoStack: clone(timelineSec['undoStack']) },
        source = timelineSec['playheadSec'],
        root = getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-video]'),
        autoplay = key['isReverseActive']() || root?.['paused'] === false,
        error = togglePersonReplacementShotReverseAtTimelineSec(
          timelineSec['draft'],
          timelineSec['playheadSec'],
        );
      if (!error || !viewportController['commitDraft'](error['draft'])) return false;
      timelineSec['previewShotId'] = error['position']['shotId'];
      try {
        requestReverseChange(error['position']['shotId'], error['isReversed']);
      } catch (error2) {
        return (
          (timelineSec['draft'] = target['draft']),
          (timelineSec['undoStack'] = target['undoStack']),
          requestRender(),
          previewController['seekTimeline'](source),
          windowObject?.['showToast']?.(error2?.['message'] || '视频倒放失败，请重试。', 'error'),
          false
        );
      }
      return (
        requestRender(),
        previewController['seekTimeline'](source, { autoplay: autoplay }),
        windowObject?.['showToast']?.(error['message'], 'success'),
        true
      );
    },
    splitAtPlayhead = () => {
      if (!timelineSec['isOpen'] || viewportController['isDraftMutationBusy']()) return false;
      if (!session['splitAtPlayhead']())
        return (windowObject?.['showToast']?.('请把播放头放在片段中间再裁剪。', 'warn'), false);
      const personReplacementShotCutPositionAtTimelineSec = getPersonReplacementShotCutPositionAtTimelineSec(
        timelineSec['draft'],
        timelineSec['playheadSec'],
      );
      return (
        (timelineSec['previewShotId'] = personReplacementShotCutPositionAtTimelineSec['shotId']),
        requestRender(),
        previewController['preview'](
          personReplacementShotCutPositionAtTimelineSec['shotId'],
          personReplacementShotCutPositionAtTimelineSec['sourceTimeSec'],
          {
            timelineSec: timelineSec['playheadSec'],
          },
        ),
        true
      );
    },
    mergeSelected = () => {
      if (!timelineSec['isOpen'] || viewportController['isDraftMutationBusy']()) return false;
      if (!session['mergeSelectedRanges']()) return false;
      const next = timelineSec['draft']['find'](
        (current) => normalizeText(current?.['shotId']) === normalizeText(timelineSec['previewShotId']),
      );
      return (
        requestRender(),
        next &&
          previewController['preview'](next['shotId'], next['startSec'], {
            timelineSec: timelineSec['playheadSec'],
          }),
        true
      );
    },
    captureKeyframeAtPlayhead = async () => {
      if (!timelineSec['isOpen'] || viewportController['isBusy']() || timelineSec['isKeyframeCapturing'])
        return false;
      const sourceTimeSec = getPersonReplacementShotCutPositionAtTimelineSec(
          timelineSec['draft'],
          timelineSec['playheadSec'],
        ),
        enabled2 = timelineSec['draft'][sourceTimeSec['shotIndex']],
        el = getRoot(),
        video = el?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (!enabled2 || !video) return (windowObject?.['showToast']?.('当前片段画面不可用。', 'warn'), false);
      const project2 = getProject(),
        shotId = {
          projectId: normalizeText(project2['id']),
          rangeId: normalizeText(enabled2['shotId']),
          originRangeId: normalizeText(enabled2['originShotId'] || enabled2['shotId']),
          sourceId: normalizeText(enabled2['sourceId']),
          sourceTimeSec: sourceTimeSec['sourceTimeSec'],
          timelineSec: sourceTimeSec['timelineSec'],
          seekToken: timelineSec['previewSeekToken'],
          video: video,
        };
      if (
        timelineSec['pendingPreviewSeek'] ||
        timelineSec['previewFrameReadyToken'] !== shotId['seekToken'] ||
        video['seeking'] === true ||
        Math['abs'](Number(video['currentTime']) - shotId['sourceTimeSec']) > 0.04
      )
        return (windowObject?.['showToast']?.('当前画面仍在定位，请稍后再获取关键帧。', 'info'), false);
      timelineSec['isKeyframeCapturing'] = true;
      const list =
        el?.['querySelectorAll']?.(
          [
            "[data-person-replacement-action='capture-shot-keyframe']",
            "[data-person-replacement-action='split-shot-cut']",
            '[data-person-replacement-action=\'toggle-shot-cut-reverse\']',
            '[data-person-replacement-action=\'merge-shot-cuts\']',
            "[data-person-replacement-action='undo-shot-cut']",
            '[data-person-replacement-action=\'reset-shot-cuts\']',
            "[data-person-replacement-action='cancel-shot-cuts']",
            "[data-person-replacement-action='confirm-shot-cuts']",
          ]['join'](', '),
        ) || [];
      list['forEach']((el2) => el2['setAttribute']('disabled', ''));
      const el3 = el?.['querySelector']?.('[data-person-replacement-action=\'capture-shot-keyframe\']');
      (el3?.['setAttribute']?.('aria-busy', 'true'), el3?.['classList']?.['add']?.('is-loading'));
      try {
        const waitForVideoFrame2 = await waitForVideoFrame(video, { timeoutMs: 10000 });
        if (!waitForVideoFrame2) throw new Error('当前视频画面尚未加载完成');
        const type = await captureVideoFrameSnapshot(video, {
            type: 'image/png',
            fileNamePrefix: 'person_replacement_' + (normalizeText(enabled2['shotId']) || 'shot'),
          }),
          handler = windowObject?.['File'] || globalThis['File'];
        let entry = type['blob'];
        if (typeof handler === 'function')
          entry = new handler([type['blob']], type['fileName'], {
            type: type['type'] || 'image/png',
          });
        else
          try {
            Object['defineProperty'](entry, 'name', { configurable: true, value: type['fileName'] });
          } catch {}
        const response = await onShotKeyframeSelected(entry, {
            shotId: shotId['rangeId'],
            originShotId: shotId['originRangeId'],
            keyframeTimeSec: shotId['sourceTimeSec'],
            frame: { width: type['width'], height: type['height'] },
          }),
          keyframeRef = normalizeText(
            response?.['keyframeRef'] ||
              response?.['localPath'] ||
              response?.['imageUrl'] ||
              response?.['url'] ||
              response,
          );
        if (!keyframeRef) throw new Error('关键帧保存结果缺少可用地址');
        if (
          !timelineSec['isOpen'] ||
          normalizeText(getProject()['id']) !== shotId['projectId'] ||
          getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-video]') !== shotId['video']
        )
          return false;
        const enabled3 = timelineSec['draft']['find'](
          (record) => normalizeText(record?.['shotId']) === shotId['rangeId'],
        );
        if (!enabled3 || normalizeText(enabled3['sourceId']) !== shotId['sourceId']) return false;
        return (
          viewportController['commitDraft'](
            timelineSec['draft']['map']((args2) =>
              normalizeText(args2?.['shotId']) === shotId['rangeId']
                ? {
                    ...args2,
                    keyframeRef: keyframeRef,
                    keyframeTimeSec: shotId['sourceTimeSec'],
                    keyframeManuallySelected: true,
                    frame: { width: type['width'], height: type['height'] },
                  }
                : args2,
            ),
          ),
          (timelineSec['previewShotId'] = shotId['rangeId']),
          (timelineSec['playheadSec'] = shotId['timelineSec']),
          (timelineSec['isKeyframeCapturing'] = false),
          windowObject?.['showToast']?.('已将当前关键帧设为该片段的替换帧，应用切口后生效。', 'success'),
          requestRender(),
          previewController['preview'](shotId['rangeId'], shotId['sourceTimeSec'], {
            timelineSec: shotId['timelineSec'],
          }),
          true
        );
      } catch (error3) {
        return (
          windowObject?.['showToast']?.(error3?.['message'] || '获取关键帧失败，请重试。', 'error'),
          false
        );
      } finally {
        timelineSec['isKeyframeCapturing'] && ((timelineSec['isKeyframeCapturing'] = false), requestRender());
      }
    },
    handler2 = () => session['clearMotionTimer'](),
    handler3 = () => session['stopBoundaryDrag'](),
    handler4 = (payload, handler5) => {
      (handler2(),
        (timelineSec['motionTimer'] =
          windowObject?.['setTimeout']?.(() => {
            timelineSec['motionTimer'] = 0;
            if (timelineSec['motion'] !== payload) return;
            handler5();
          }, 560) || 0));
    },
    handler6 = (list2) => {
      reset();
      const project3 = getProject();
      return (
        session['open'](project3, list2),
        (timelineSec['isOpen'] = true),
        (timelineSec['motion'] = 'to-editor'),
        (timelineSec['draft'] = list2),
        (timelineSec['initialDraft'] = clone(list2)),
        (timelineSec['previewShotId'] =
          project3['workspace']['selectedShotId'] || list2[0]?.['shotId'] || ''),
        requestRender(),
        previewController['preview'](
          timelineSec['previewShotId'],
          list2['find']((handle) => handle['shotId'] === timelineSec['previewShotId'])?.['startSec'],
        ),
        handler4('to-editor', () => {
          timelineSec['motion'] = '';
          if (timelineSec['isOpen']) {
            const el4 = getRoot()?.['querySelector']?.('[data-person-replacement-shot-timeline-stage]'),
              el5 = el4?.['querySelector']?.('.person-replacement-shot-timeline-cube');
            (el4?.['classList']?.['remove']?.('is-animating'),
              el4?.['classList']?.['add']?.('is-settled'),
              el5?.['classList']?.['remove']?.('is-flipping-to-editor'));
            const personReplacementShotCutPositionAtTimelineSec2 =
              getPersonReplacementShotCutPositionAtTimelineSec(
                timelineSec['draft'],
                timelineSec['playheadSec'],
              );
            personReplacementShotCutPositionAtTimelineSec2['shotIndex'] >= 0 &&
              previewController['preview'](
                personReplacementShotCutPositionAtTimelineSec2['shotId'],
                personReplacementShotCutPositionAtTimelineSec2['sourceTimeSec'],
                {
                  timelineSec: timelineSec['playheadSec'],
                },
              );
          }
        }),
        true
      );
    },
    handler7 = (enabled4) =>
      Boolean(
        enabled4 &&
        !enabled4['error'] &&
        enabled4['seeking'] !== true &&
        Number(enabled4['readyState']) >= 2 &&
        normalizeText(enabled4['currentSrc'] || enabled4['getAttribute']?.('src') || enabled4['src']),
      ),
    open = () => {
      const project4 = getProject(),
        list3 = createPersonReplacementShotCutDraft(project4);
      if (
        !list3['length'] ||
        (!countEditablePersonReplacementShotCuts(list3) && !hasSplittablePersonReplacementShotCut(list3))
      )
        return (windowObject?.['showToast']?.('当前时间轴没有可调整或新增的切口。', 'warn'), false);
      if (timelineSec['isOpening']) return false;
      const enabled5 = Boolean(documentObject?.['defaultView']?.['HTMLVideoElement']),
        enabled6 = mediaController['preparePreviewVideo']();
      if (!enabled5) return handler6(list3);
      if (!enabled6 || !timelineSec['bufferedVideo'])
        return (windowObject?.['showToast']?.('当前视频片段尚未准备完成。', 'warn'), false);
      if (handler7(timelineSec['bufferedVideo'])) return handler6(list3);
      return ((timelineSec['isOpening'] = true), requestRender(), false);
    },
    watchOpeningVideo = () => {
      (timelineSec['openingCleanup']?.(), (timelineSec['openingCleanup'] = null));
      if (!timelineSec['isOpening']) return false;
      mediaController['preparePreviewVideo']();
      const el6 = timelineSec['bufferedVideo'];
      if (!el6) return false;
      const list4 = ['loadeddata', 'canplay', 'canplaythrough', 'seeked', 'progress'];
      let state = 0;
      const run = () => {
          (state && (windowObject?.['clearTimeout']?.(state), (state = 0)),
            list4['forEach']((config) => {
              el6['removeEventListener']?.(config, handler8);
            }),
            el6['removeEventListener']?.('error', scope),
            el6['removeEventListener']?.('abort', scope));
        },
        handler8 = () => {
          if (!timelineSec['isOpening'] || el6 !== timelineSec['bufferedVideo'] || !handler7(el6)) return;
          (run(),
            (timelineSec['openingCleanup'] = null),
            (timelineSec['isOpening'] = false),
            Promise['resolve']()['then'](() => {
              if (!isDestroyed() && !timelineSec['isOpen']) open();
            }));
        },
        scope = () => {
          if (!timelineSec['isOpening'] || el6 !== timelineSec['bufferedVideo']) return;
          (run(),
            (timelineSec['openingCleanup'] = null),
            (timelineSec['isOpening'] = false),
            mediaController['releaseBufferedVideo'](),
            requestRender(),
            windowObject?.['showToast']?.('裁剪预览视频加载失败，请稍后重试。', 'warn'));
        };
      return (
        list4['forEach']((input) => {
          el6['addEventListener']?.(input, handler8);
        }),
        el6['addEventListener']?.('error', scope),
        el6['addEventListener']?.('abort', scope),
        (state = windowObject?.['setTimeout']?.(scope, PREVIEW_READY_TIMEOUT_MS) || 0),
        (timelineSec['openingCleanup'] = run),
        handler8(),
        true
      );
    },
    close = ({ animate: animate = true, renderWorkspace: renderWorkspace = true } = {}) => {
      if (timelineSec['isOpening']) {
        reset();
        if (renderWorkspace) requestRender();
        return true;
      }
      if (!timelineSec['isOpen'] && !timelineSec['motion']) return false;
      (handler3(), handler2());
      if (!animate) {
        (reset(), hideResultHistoryMenu());
        if (renderWorkspace) requestRender();
        return true;
      }
      timelineSec['motion'] = 'to-timeline';
      if (renderWorkspace) requestRender();
      return (
        handler4('to-timeline', () => {
          (reset(),
            renderWorkspace &&
              (requestRender(), scrollShotCardIntoView(getProject()['workspace']['selectedShotId'])));
        }),
        true
      );
    };
  return Object['freeze']({
    captureKeyframeAtPlayhead: captureKeyframeAtPlayhead,
    close: close,
    mergeSelected: mergeSelected,
    open: open,
    requestReverseChange: requestReverseChange,
    reset: reset,
    splitAtPlayhead: splitAtPlayhead,
    syncReverseDraftToProject: syncReverseDraftToProject,
    toggleReverse: toggleReverse,
    watchOpeningVideo: watchOpeningVideo,
  });
}
