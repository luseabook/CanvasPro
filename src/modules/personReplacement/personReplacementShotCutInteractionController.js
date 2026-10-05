import { getMediaClipTimelineRangeRect } from '../../components/media-clip/mediaClipTimelineModel.js';
import { formatDurationLabel } from '../../components/media-clip/mediaClipUtils.js';
import {
  PERSON_REPLACEMENT_CUT_MIN_SEC,
  createPersonReplacementShotCutUpdateRequest,
  getPersonReplacementShotCutDisplayDuration,
  getPersonReplacementShotCutPositionAtTimelineSec,
  getPersonReplacementShotCutTotalDuration,
  hasPersonReplacementShotCutUpdateChanges,
} from './personReplacementShotCutModel.js';
function normalizeText(value, item = '') {
  const key = String(value ?? '')['trim']();
  return key || item;
}
function clone(index) {
  return index && typeof index === 'object' ? JSON['parse'](JSON['stringify'](index)) : index;
}
function clamp(result, data, options, target = data) {
  const source = Number(result);
  return Number['isFinite'](source) ? Math['min'](options, Math['max'](data, source)) : target;
}
export function createPersonReplacementShotCutInteractionController({
  session: session,
  previewController: previewController,
  viewportController: viewportController,
  editorController: editorController,
  getRoot: getRoot = () => null,
  getProject: getProject = () => ({}),
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis,
  isDestroyed: isDestroyed = () => false,
  requestRender: requestRender = () => {},
  onShotCutDetectionRequested: onShotCutDetectionRequested = null,
  onShotCutRangesRequested: onShotCutRangesRequested = null,
  runRequest: runRequest = (next, current) => next?.(current),
  updateSmartClipSettings: updateSmartClipSettings = () => {},
} = {}) {
  if (!session?.['workspaceState'])
    throw new TypeError('Shot cut interactions require a session.');
  if (!previewController || !viewportController || !editorController)
    throw new TypeError('Shot cut interactions require preview, viewport, and editor owners.');
  const timelineSec = session['workspaceState'],
    getTimelineSecFromPointer = (event, el) => {
      const box = el?.['getBoundingClientRect']?.(),
        count = Number(box?.['width']);
      if (!(count > 0)) return timelineSec['playheadSec'];
      const personReplacementShotCutDisplayDuration = getPersonReplacementShotCutDisplayDuration(
          timelineSec['draft'],
        ),
        clamp2 = clamp((Number(event?.['clientX']) - Number(box?.['left'] || 0)) / count, 0, 1, 0);
      return clamp(
        clamp2 * personReplacementShotCutDisplayDuration,
        0,
        getPersonReplacementShotCutTotalDuration(timelineSec['draft']),
        timelineSec['playheadSec'],
      );
    },
    handler = () => {
      if (
        timelineSec['isKeyframeCapturing'] ||
        timelineSec['hoverPreviewRaf'] ||
        !timelineSec['hoverPreviewActive']
      )
        return;
      const entry = () => {
          timelineSec['hoverPreviewRaf'] = 0;
          if (
            timelineSec['isKeyframeCapturing'] ||
            !timelineSec['hoverPreviewActive'] ||
            !timelineSec['isOpen']
          )
            return;
          const root = getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
          if (previewController['isPlaybackActive'](root)) return;
          const record = Number(timelineSec['hoverPreviewRequest']);
          if (!Number['isFinite'](record)) return;
          const timelineSec2 = getPersonReplacementShotCutPositionAtTimelineSec(timelineSec['draft'], record);
          if (timelineSec2['shotIndex'] < 0) return;
          previewController['preview'](timelineSec2['shotId'], timelineSec2['sourceTimeSec'], {
            timelineSec: timelineSec2['timelineSec'],
            hover: true,
          });
        },
        handler2 = windowObject?.['requestAnimationFrame'] || globalThis['requestAnimationFrame'];
      typeof handler2 === 'function'
        ? (timelineSec['hoverPreviewRaf'] = handler2(entry))
        : (timelineSec['hoverPreviewRaf'] = windowObject?.['setTimeout']?.(entry, 16) || 0);
    },
    syncHoverPlayhead = (event2) => {
      const el2 = getRoot(),
        enabled = event2?.['target']?.['closest']?.('[data-person-replacement-shot-cut-timeline]'),
        el3 = el2?.['querySelector']?.('[data-person-replacement-shot-cut-hover-playhead]');
      if (timelineSec['boundaryDrag'] || timelineSec['isKeyframeCapturing'])
        return (
          (timelineSec['hoverPreviewActive'] = false),
          (timelineSec['hoverPreviewTimeSec'] = null),
          previewController['cancelHoverPreview'](),
          el3 && ((el3['hidden'] = true), el3['classList']?.['remove']?.('is-visible')),
          false
        );
      if (!timelineSec['isOpen'] || !enabled || !el3)
        return (el3 && ((el3['hidden'] = true), el3['classList']?.['remove']?.('is-visible')), false);
      const payload = getTimelineSecFromPointer(event2, enabled),
        personReplacementShotCutDisplayDuration2 = getPersonReplacementShotCutDisplayDuration(
          timelineSec['draft'],
        );
      ((el3['hidden'] = false),
        el3['style']?.['setProperty']?.(
          'left',
          (personReplacementShotCutDisplayDuration2 > 0
            ? (payload / personReplacementShotCutDisplayDuration2) * 100
            : 0) + '%',
        ),
        el3['classList']?.['add']?.('is-visible'),
        (timelineSec['hoverPreviewActive'] = true),
        (timelineSec['hoverPreviewTimeSec'] = payload));
      const handle = el2?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      return (
        !previewController['isPlaybackActive'](handle) &&
          ((timelineSec['hoverPreviewRequest'] = payload), handler()),
        true
      );
    },
    hideHoverPlayhead = (event3) => {
      const el4 = getRoot(),
        state = event3?.['target']?.['closest']?.('[data-person-replacement-shot-cut-timeline]');
      if (state && event3?.['relatedTarget'] && state['contains']?.(event3['relatedTarget'])) return false;
      const el5 = el4?.['querySelector']?.('[data-person-replacement-shot-cut-hover-playhead]');
      if (timelineSec['boundaryDrag'])
        return (
          (timelineSec['hoverPreviewActive'] = false),
          (timelineSec['hoverPreviewTimeSec'] = null),
          previewController['cancelHoverPreview'](),
          el5 && ((el5['hidden'] = true), el5['classList']?.['remove']?.('is-visible')),
          false
        );
      const config = timelineSec['hoverPreviewActive'];
      ((timelineSec['hoverPreviewActive'] = false),
        (timelineSec['hoverPreviewTimeSec'] = null),
        previewController['cancelHoverPreview']());
      el5 && ((el5['hidden'] = true), el5['classList']?.['remove']?.('is-visible'));
      const scope = el4?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (config && scope?.['paused'] !== false) {
        const personReplacementShotCutPositionAtTimelineSec =
          getPersonReplacementShotCutPositionAtTimelineSec(timelineSec['draft'], timelineSec['playheadSec']);
        personReplacementShotCutPositionAtTimelineSec['shotIndex'] >= 0 &&
          previewController['preview'](
            personReplacementShotCutPositionAtTimelineSec['shotId'],
            personReplacementShotCutPositionAtTimelineSec['sourceTimeSec'],
            {
              timelineSec: timelineSec['playheadSec'],
            },
          );
      }
      return Boolean(el5 || config);
    },
    syncEditorDom = (value2 = null) => {
      const el6 = getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-track]');
      if (!el6) return;
      const durationSec = getPersonReplacementShotCutTotalDuration(timelineSec['draft']);
      let startSec = 0;
      (timelineSec['draft']['forEach']((input, output) => {
        const value3 = Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, Number(input['durationSec']) || 0),
          mediaClipTimelineRangeRect = getMediaClipTimelineRangeRect({
            startSec: startSec,
            endSec: startSec + value3,
            durationSec: durationSec,
            minWidthPct: 0,
          }),
          el7 = el6['querySelector']?.('[data-person-replacement-cut-shot-index="' + output + '"]');
        (el7?.['style']?.['setProperty']?.('left', mediaClipTimelineRangeRect['leftPct'] + '%'),
          el7?.['style']?.['setProperty']?.('width', mediaClipTimelineRangeRect['widthPct'] + '%'),
          (startSec += value3));
        const el8 = el7?.['querySelector']?.('[data-person-replacement-cut-duration="' + output + '"]');
        el8 && (el8['textContent'] = formatDurationLabel(value3));
      }),
        el6['querySelectorAll']?.('[data-person-replacement-cut-boundary-index]')?.['forEach']?.((el9) => {
          const count2 = Math['trunc'](Number(el9['dataset']?.['personReplacementCutBoundaryIndex'])),
            enabled2 = timelineSec['draft'][count2];
          if (!(count2 > 0) || !enabled2) return;
          (el9['classList']?.['toggle']?.('is-dragging', count2 === value2),
            el9['setAttribute']?.('aria-valuenow', enabled2['startSec']['toFixed'](4)));
        }),
        viewportController['syncPlayhead']());
    },
    applyBoundaryTime = (
      value4,
      value5,
      {
        preview: preview = true,
        active: active = null,
        recordHistory: recordHistory = true,
        preservePlayhead: preservePlayhead = false,
      } = {},
    ) => {
      const value6 = Math['trunc'](Number(value4)),
        value7 = timelineSec['draft'][value6]?.['startSec'],
        enabled3 = session['moveBoundary'](value6, value5, { recordHistory: recordHistory }),
        enabled4 = timelineSec['draft'][value6];
      if (!enabled3 || !enabled4 || enabled4['startSec'] === value7) return (syncEditorDom(active), false);
      return (
        syncEditorDom(active),
        preview &&
          previewController['preview'](enabled4['shotId'], enabled4['startSec'], {
            preservePlayhead: preservePlayhead,
          }),
        true
      );
    },
    handler3 = (event4, value8, el10) => {
      const value9 = Math['trunc'](Number(value8)),
        box2 = el10?.['getBoundingClientRect']?.(),
        count3 = Number(box2?.['width']);
      if (!(count3 > 0)) return timelineSec['draft'][value9]?.['startSec'];
      const personReplacementShotCutDisplayDuration3 = getPersonReplacementShotCutDisplayDuration(
        timelineSec['draft'],
      );
      let count4 = value9 - 1;
      while (
        count4 > 0 &&
        timelineSec['draft'][count4 - 1]?.['sourceId'] === timelineSec['draft'][value9]?.['sourceId']
      ) {
        count4 -= 1;
      }
      const value10 = timelineSec['draft']
          ['slice'](0, count4)
          ['reduce']((value11, value12) => value11 + value12['durationSec'], 0),
        value13 = Number(timelineSec['draft'][count4]?.['startSec']) || 0,
        clamp3 = clamp((Number(event4?.['clientX']) - Number(box2['left'] || 0)) / count3, 0, 1, 0);
      return value13 + clamp3 * personReplacementShotCutDisplayDuration3 - value10;
    },
    beginBoundaryDrag = (event5, el11) => {
      if (!timelineSec['isOpen'] || viewportController['isDraftMutationBusy']() || !el11) return false;
      const active2 = Math['trunc'](Number(el11['dataset']?.['personReplacementCutBoundaryIndex'])),
        enabled5 = el11['closest']?.('[data-person-replacement-shot-cut-track]');
      if (!(active2 > 0) || !enabled5) return false;
      event5['preventDefault']?.();
      try {
        el11['focus']?.({ preventScroll: true });
      } catch {
        el11['focus']?.();
      }
      (session['stopBoundaryDrag'](),
        (timelineSec['hoverPreviewActive'] = false),
        (timelineSec['hoverPreviewTimeSec'] = null),
        previewController['cancelHoverPreview']());
      const el12 = getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-hover-playhead]');
      el12 && ((el12['hidden'] = true), el12['classList']?.['remove']?.('is-visible'));
      (el11['classList']?.['add']?.('is-dragging'),
        documentObject?.['body']?.['classList']?.['add']?.('person-replacement-cut-resizing'));
      try {
        el11['setPointerCapture']?.(event5['pointerId']);
      } catch {}
      const run = (event6) => {
          event6['preventDefault']?.();
          const value14 = applyBoundaryTime(active2, handler3(event6, active2, enabled5), {
            active: active2,
            recordHistory: !timelineSec['boundaryDrag']?.['historyCaptured'],
            preservePlayhead: true,
          });
          if (value14 && timelineSec['boundaryDrag']) timelineSec['boundaryDrag']['historyCaptured'] = true;
        },
        value15 = (event7) => {
          (event7?.['preventDefault']?.(), session['stopBoundaryDrag'](), syncEditorDom());
        },
        cleanup = () => {
          (windowObject?.['removeEventListener']?.('pointermove', run, true),
            windowObject?.['removeEventListener']?.('pointerup', value15, true),
            windowObject?.['removeEventListener']?.('pointercancel', value15, true));
          try {
            el11['releasePointerCapture']?.(event5['pointerId']);
          } catch {}
          el11['classList']?.['remove']?.('is-dragging');
        };
      return (
        (timelineSec['boundaryDrag'] = { boundaryIndex: active2, cleanup: cleanup, historyCaptured: false }),
        windowObject?.['addEventListener']?.('pointermove', run, true),
        windowObject?.['addEventListener']?.('pointerup', value15, true),
        windowObject?.['addEventListener']?.('pointercancel', value15, true),
        run(event5),
        true
      );
    },
    resetDraft = () => {
      if (!timelineSec['isOpen'] || viewportController['isDraftMutationBusy']()) return false;
      if (!session['resetDraft']()) return false;
      try {
        editorController['syncReverseDraftToProject']();
      } catch (error) {
        return (
          windowObject?.['showToast']?.(error?.['message'] || '重置倒放状态失败，请重试。', 'error'),
          false
        );
      }
      const project = getProject();
      return (
        (timelineSec['previewShotId'] =
          project['workspace']['selectedShotId'] || timelineSec['draft'][0]?.['shotId'] || ''),
        requestRender(),
        previewController['preview'](
          timelineSec['previewShotId'],
          timelineSec['draft']['find']((value16) => value16['shotId'] === timelineSec['previewShotId'])?.[
            'startSec'
          ],
        ),
        true
      );
    },
    undoDraft = () => {
      if (!timelineSec['isOpen'] || viewportController['isDraftMutationBusy']()) return false;
      if (!session['undo']()) return false;
      try {
        editorController['syncReverseDraftToProject']();
      } catch (error2) {
        return (
          windowObject?.['showToast']?.(error2?.['message'] || '撤回倒放状态失败，请重试。', 'error'),
          false
        );
      }
      const personReplacementShotCutTotalDuration = getPersonReplacementShotCutTotalDuration(
        timelineSec['draft'],
      );
      timelineSec['playheadSec'] = clamp(
        timelineSec['playheadSec'],
        0,
        personReplacementShotCutTotalDuration,
        0,
      );
      const timelineSec3 = getPersonReplacementShotCutPositionAtTimelineSec(
        timelineSec['draft'],
        timelineSec['playheadSec'],
      );
      return (
        (timelineSec['previewShotId'] =
          timelineSec3['shotId'] || timelineSec['draft'][0]?.['shotId'] || ''),
        requestRender(),
        timelineSec3['shotIndex'] >= 0 &&
          previewController['preview'](timelineSec3['shotId'], timelineSec3['sourceTimeSec'], {
            timelineSec: timelineSec3['timelineSec'],
          }),
        true
      );
    },
    runSmartDetection = () => {
      if (
        !timelineSec['isOpen'] ||
        viewportController['isDraftMutationBusy']() ||
        typeof onShotCutDetectionRequested !== 'function'
      )
        return false;
      ((timelineSec['isSmartDetectOpen'] = false), (timelineSec['isSmartDetecting'] = true));
      const value17 = ++timelineSec['smartDetectionToken'],
        text = normalizeText(getProject()['id']),
        handler4 = () =>
          !isDestroyed() &&
          timelineSec['isOpen'] &&
          value17 === timelineSec['smartDetectionToken'] &&
          normalizeText(getProject()['id']) === text;
      requestRender();
      let onShotCutDetectionRequested2;
      try {
        const mode = getProject();
        onShotCutDetectionRequested2 = onShotCutDetectionRequested(
          { mode: mode['settings']['smartClipMode'], fps: mode['settings']['smartClipFps'] },
          { project: clone(mode) },
        );
      } catch (value18) {
        onShotCutDetectionRequested2 = Promise['reject'](value18);
      }
      return (
        Promise['resolve'](onShotCutDetectionRequested2)
          ['then']((value19) => {
            if (!handler4()) return;
            const list = Array['isArray'](value19?.['ranges']) ? value19['ranges'] : [];
            if (!list['length']) throw new Error('智能检测未返回可用切口');
            const enabled6 = viewportController['commitDraft'](list);
            ((timelineSec['isSmartDetecting'] = false), (timelineSec['isSmartDetectOpen'] = false));
            if (!enabled6) {
              (requestRender(), windowObject?.['showToast']?.('智能检测结果与当前切口一致。', 'info'));
              return;
            }
            ((timelineSec['playheadSec'] = 0),
              (timelineSec['previewShotId'] = list[0]?.['shotId'] || ''),
              requestRender(),
              previewController['preview'](
                timelineSec['previewShotId'],
                Number(list[0]?.['startSec']) || 0,
                {
                  timelineSec: 0,
                },
              ),
              windowObject?.['showToast']?.(
                '智能检测完成，已覆盖为 ' + list['length'] + ' 个片段。',
                'success',
              ));
          })
          ['catch']((error3) => {
            if (!handler4()) return;
            ((timelineSec['isSmartDetecting'] = false),
              (timelineSec['isSmartDetectOpen'] = true),
              requestRender(),
              previewController['preview'](
                timelineSec['previewShotId'],
                timelineSec['draft']['find'](
                  (value20) => value20['shotId'] === timelineSec['previewShotId'],
                )?.['startSec'],
              ),
              windowObject?.['showToast']?.(error3?.['message'] || '智能检测失败，请重试。', 'error'));
          }),
        true
      );
    },
    submitDraft = ({
      submissionKind: submissionKind = 'cuts',
      closeOnSuccess: closeOnSuccess = true,
      rollback: rollback = null,
      successMessage: successMessage = '',
      errorMessage: errorMessage = '镜头切口更新失败，请重试。',
    } = {}) => {
      ((timelineSec['isSubmitting'] = submissionKind), requestRender());
      const project2 = getProject(),
        runRequest2 = runRequest(
          onShotCutRangesRequested,
          createPersonReplacementShotCutUpdateRequest(
            project2['shots'],
            timelineSec['draft'],
            timelineSec['previewShotId'],
          ),
        );
      return (
        Promise['resolve'](runRequest2)
          ['then'](() => {
            ((timelineSec['isSubmitting'] = false),
              closeOnSuccess
                ? editorController['close']({ animate: true, renderWorkspace: true })
                : ((timelineSec['initialDraft'] = clone(timelineSec['draft'])),
                  (timelineSec['undoStack'] = []),
                  requestRender(),
                  previewController['seekTimeline'](timelineSec['playheadSec']),
                  successMessage && windowObject?.['showToast']?.(successMessage, 'success')));
          })
          ['catch']((error4) => {
            ((timelineSec['isSubmitting'] = false),
              rollback &&
                ((timelineSec['draft'] = rollback['draft']),
                (timelineSec['undoStack'] = rollback['undoStack'])),
              requestRender(),
              previewController['seekTimeline'](timelineSec['playheadSec']),
              windowObject?.['showToast']?.(error4?.['message'] || errorMessage, 'error'));
          }),
        true
      );
    },
    confirmDraft = () => {
      const project3 = getProject();
      if (
        !timelineSec['isOpen'] ||
        viewportController['isDraftMutationBusy']() ||
        !hasPersonReplacementShotCutUpdateChanges(project3['shots'], timelineSec['draft'])
      )
        return false;
      return submitDraft();
    };
  return (
    session['configureActionHandlers']({
      open: () => editorController['open'](),
      toggleSmartDetect: () => {
        !timelineSec['isSubmitting'] &&
          !timelineSec['isSmartDetecting'] &&
          ((timelineSec['isSmartDetectOpen'] = !timelineSec['isSmartDetectOpen']),
          session['setSmartDetectOpen'](timelineSec['isSmartDetectOpen']),
          requestRender());
      },
      setSmartDetectMode: ({ target: target2 }) =>
        updateSmartClipSettings(
          { settings: { smartClipMode: target2['dataset']['smartClipMode'] } },
          { notify: true },
        ),
      confirmSmartDetect: () => runSmartDetection(),
      toggleSound: ({ target: target3 }) => viewportController['toggleSound'](target3),
      toggleReverse: () => editorController['toggleReverse'](),
      captureKeyframe: () => {
        void editorController['captureKeyframeAtPlayhead']();
      },
      undo: () => undoDraft(),
      reset: () => resetDraft(),
      cancel: () => editorController['close']({ animate: true, renderWorkspace: true }),
      confirm: () => confirmDraft(),
      togglePlayback: () => previewController['togglePlayback'](),
      step: ({ target: target4 }) =>
        previewController['stepTimeline'](
          Number(target4['dataset']['personReplacementStepDirection']) < 0 ? -1 : 1,
        ),
      zoom: ({ target: target5, event: event8 }) =>
        viewportController['applyTimelineZoom'](target5['dataset']['personReplacementZoomDirection'], {
          clientX: event8['clientX'],
        }),
      split: () => editorController['splitAtPlayhead'](),
      merge: () => editorController['mergeSelected'](),
      preview: ({ target: target6, event: event9 }) => {
        const enabled7 =
          timelineSec['draft'][Math['trunc'](Number(target6['dataset']['personReplacementCutShotIndex']))];
        if (!enabled7) return;
        const value21 = target6['closest']?.('[data-person-replacement-shot-cut-timeline]');
        value21 && Number['isFinite'](Number(event9['clientX']))
          ? previewController['seekTimeline'](getTimelineSecFromPointer(event9, value21))
          : previewController['preview'](enabled7['shotId'], enabled7['startSec']);
      },
    }),
    Object['freeze']({
      applyBoundaryTime: applyBoundaryTime,
      beginBoundaryDrag: beginBoundaryDrag,
      confirmDraft: confirmDraft,
      getTimelineSecFromPointer: getTimelineSecFromPointer,
      hideHoverPlayhead: hideHoverPlayhead,
      resetDraft: resetDraft,
      runSmartDetection: runSmartDetection,
      submitDraft: submitDraft,
      syncEditorDom: syncEditorDom,
      syncHoverPlayhead: syncHoverPlayhead,
      undoDraft: undoDraft,
    })
  );
}
