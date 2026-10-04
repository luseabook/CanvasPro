import {
  createPersonReplacementShotCutDraft,
  getPersonReplacementShotCutPositionAtTimelineSec,
  getPersonReplacementShotCutTimelineSec,
  getPersonReplacementShotCutTotalDuration,
  mergePersonReplacementShotCutRanges,
  movePersonReplacementShotCutBoundary,
  splitPersonReplacementShotCutAtTimelineSec,
} from './personReplacementShotCutModel.js';
import { togglePersonReplacementShotReverseAtTimelineSec } from './personReplacementShotReverse.js';
import { createPersonReplacementShotCutPlaybackController } from './personReplacementShotCutPlaybackController.js';
const DEFAULT_TIMELINE_ZOOM = 0x1,
  SHOT_CUT_ACTIONS = Object['freeze']({
    'edit-shot-cuts': 'open',
    'toggle-shot-cut-smart-detect': 'toggleSmartDetect',
    'set-shot-cut-smart-detect-mode': 'setSmartDetectMode',
    'confirm-shot-cut-smart-detect': 'confirmSmartDetect',
    'toggle-shot-cut-sound': 'toggleSound',
    'toggle-shot-cut-reverse': 'toggleReverse',
    'capture-shot-keyframe': 'captureKeyframe',
    'undo-shot-cut': 'undo',
    'reset-shot-cuts': 'reset',
    'cancel-shot-cuts': 'cancel',
    'confirm-shot-cuts': 'confirm',
    'toggle-shot-cut-playback': 'togglePlayback',
    'step-shot-cut': 'step',
    'zoom-shot-cut-timeline': 'zoom',
    'split-shot-cut': 'split',
    'merge-shot-cuts': 'merge',
    'preview-shot-cut': 'preview',
  });
function clone(value) {
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(value);
    } catch {}
  return JSON['parse'](JSON['stringify'](value));
}
function normalizeId(item) {
  return String(item ?? '')['trim']();
}
function resolveProjectIdentity(options = {}) {
  return normalizeId(options['id'] || options['projectId'] || options['sessionId']);
}
function createInitialState() {
  return {
    isOpen: ![],
    isOpening: ![],
    motion: '',
    draft: [],
    initialDraft: [],
    undoStack: [],
    isSubmitting: ![],
    isKeyframeCapturing: ![],
    isSmartDetectOpen: ![],
    isSmartDetecting: ![],
    smartDetectionToken: 0x0,
    previewShotId: '',
    playheadSec: 0x0,
    hoverPreviewActive: ![],
    hoverPreviewTimeSec: null,
    timelineZoom: DEFAULT_TIMELINE_ZOOM,
    soundEnabled: ![],
    selectedShotIds: [],
    openingCleanup: null,
    motionTimer: 0x0,
    boundaryDrag: null,
    previewMetadataCleanup: null,
    bufferedWarmupCleanup: null,
    pendingPreviewSeek: null,
    hoverPreviewRaf: 0x0,
    hoverPreviewRequest: null,
    playheadElement: null,
    clockElement: null,
    bufferedVideo: null,
    bufferedSourceId: '',
    bufferedMediaRef: '',
    boundPreviewVideos: new WeakSet(),
    previewSeekToken: 0x0,
    previewFrameReadyToken: 0x0,
    previewFrameCallbackId: null,
    previewFrameCallbackVideo: null,
  };
}
function clampTimelineSec(key, index) {
  const personReplacementShotCutTotalDuration = getPersonReplacementShotCutTotalDuration(key);
  return Math['min'](personReplacementShotCutTotalDuration, Math['max'](0x0, Number(index) || 0x0));
}
export function createPersonReplacementShotCutSession({
  initialProject: initialProject = {},
  windowObject: windowObject = globalThis,
  releasePreviewBuffer: releasePreviewBuffer = () => {},
  stopPlayback: stopPlayback = () => {},
  playbackControllerOptions: playbackControllerOptions = null,
  onBoundaryDragStopped: onBoundaryDragStopped = () => {},
  onReverseRequested: onReverseRequested = () => {},
  onDetectionRequested: onDetectionRequested = () => [],
} = {}) {
  const soundEnabled = createInitialState();
  let projectIdentity = resolveProjectIdentity(initialProject),
    enabled = ![],
    value2 = null,
    result = Object['freeze']({});
  const playback = playbackControllerOptions
      ? createPersonReplacementShotCutPlaybackController(playbackControllerOptions)
      : null,
    handler = () => !enabled,
    handler2 = () => {
      (soundEnabled['openingCleanup']?.(), (soundEnabled['openingCleanup'] = null));
    },
    clearMotionTimer = () => {
      if (!soundEnabled['motionTimer']) return ![];
      return (
        windowObject?.['clearTimeout']?.(soundEnabled['motionTimer']),
        (soundEnabled['motionTimer'] = 0x0),
        !![]
      );
    },
    stopBoundaryDrag = () => {
      (soundEnabled['boundaryDrag']?.['cleanup']?.(),
        (soundEnabled['boundaryDrag'] = null),
        onBoundaryDragStopped());
    },
    clearPreviewMetadata = () => {
      (soundEnabled['previewMetadataCleanup']?.(), (soundEnabled['previewMetadataCleanup'] = null));
    },
    clearBufferedWarmup = () => {
      (soundEnabled['bufferedWarmupCleanup']?.(), (soundEnabled['bufferedWarmupCleanup'] = null));
    },
    cancelHoverPreview = () => {
      if (soundEnabled['hoverPreviewRaf']) {
        try {
          windowObject?.['cancelAnimationFrame']?.(soundEnabled['hoverPreviewRaf']);
        } catch {}
        try {
          windowObject?.['clearTimeout']?.(soundEnabled['hoverPreviewRaf']);
        } catch {}
        soundEnabled['hoverPreviewRaf'] = 0x0;
      }
      soundEnabled['hoverPreviewRequest'] = null;
    },
    releasePreviewBuffer2 = () => {
      (clearBufferedWarmup(), value2?.(), (value2 = null));
      if (soundEnabled['bufferedVideo'] !== null) {
        const data = soundEnabled['bufferedVideo'];
        releasePreviewBuffer(data);
        try {
          data['pause']?.();
        } catch {}
        try {
          (data['removeAttribute']?.('src'), data['load']?.());
        } catch {}
        return (
          (soundEnabled['bufferedVideo'] = null),
          (soundEnabled['bufferedSourceId'] = ''),
          (soundEnabled['bufferedMediaRef'] = ''),
          !![]
        );
      }
      return ![];
    },
    stopPlayback2 = () => {
      (playback?.['stop']?.(),
        stopPlayback(),
        (soundEnabled['hoverPreviewActive'] = ![]),
        (soundEnabled['hoverPreviewTimeSec'] = null));
    },
    cancelPreviewFrameWait = () => {
      const target = soundEnabled['previewFrameCallbackVideo'],
        source = soundEnabled['previewFrameCallbackId'];
      if (source != null && target?.['cancelVideoFrameCallback'])
        try {
          target['cancelVideoFrameCallback'](source);
        } catch {}
      ((soundEnabled['previewFrameCallbackId'] = null), (soundEnabled['previewFrameCallbackVideo'] = null));
    },
    handler3 = ({ releaseBuffer: releaseBuffer = !![] } = {}) => {
      (handler2(),
        clearMotionTimer(),
        stopBoundaryDrag(),
        clearPreviewMetadata(),
        clearBufferedWarmup(),
        cancelHoverPreview(),
        cancelPreviewFrameWait(),
        stopPlayback2());
      const bufferedVideo = soundEnabled['bufferedVideo'],
        bufferedSourceId = soundEnabled['bufferedSourceId'],
        bufferedMediaRef = soundEnabled['bufferedMediaRef'];
      if (releaseBuffer) releasePreviewBuffer2();
      const smartDetectionToken = soundEnabled['smartDetectionToken'] + 0x1,
        boundPreviewVideos = soundEnabled['boundPreviewVideos'];
      Object['assign'](soundEnabled, createInitialState(), {
        smartDetectionToken: smartDetectionToken,
        boundPreviewVideos: boundPreviewVideos,
        ...(!releaseBuffer && bufferedVideo
          ? {
              bufferedVideo: bufferedVideo,
              bufferedSourceId: bufferedSourceId,
              bufferedMediaRef: bufferedMediaRef,
            }
          : {}),
      });
    },
    open = (next = initialProject, current = null) => {
      if (!handler()) return ![];
      const draft = Array['isArray'](current) ? clone(current) : createPersonReplacementShotCutDraft(next);
      if (!draft['length']) return ![];
      ((projectIdentity = resolveProjectIdentity(next)), stopPlayback2());
      const boundPreviewVideos2 = soundEnabled['boundPreviewVideos'],
        bufferedVideo2 = soundEnabled['bufferedVideo'],
        bufferedSourceId2 = soundEnabled['bufferedSourceId'],
        bufferedMediaRef2 = soundEnabled['bufferedMediaRef'];
      return (
        Object['assign'](soundEnabled, createInitialState(), {
          isOpen: !![],
          draft: draft,
          initialDraft: clone(draft),
          previewShotId: normalizeId(next?.['workspace']?.['selectedShotId'] || draft[0x0]?.['shotId']),
          soundEnabled: soundEnabled['soundEnabled'],
          timelineZoom: soundEnabled['timelineZoom'],
          smartDetectionToken: soundEnabled['smartDetectionToken'] + 0x1,
          boundPreviewVideos: boundPreviewVideos2,
          ...(bufferedVideo2
            ? {
                bufferedVideo: bufferedVideo2,
                bufferedSourceId: bufferedSourceId2,
                bufferedMediaRef: bufferedMediaRef2,
              }
            : {}),
        }),
        !![]
      );
    },
    close = ({ releaseBuffer: releaseBuffer2 = ![] } = {}) => {
      if (!handler()) return ![];
      const entry = soundEnabled['isOpen'] || soundEnabled['isOpening'] || Boolean(soundEnabled['motion']);
      return (handler3({ releaseBuffer: releaseBuffer2 }), entry);
    },
    syncProject = (options2 = {}) => {
      if (!handler()) return ![];
      const projectIdentity2 = resolveProjectIdentity(options2);
      if (projectIdentity2 === projectIdentity) return ![];
      return ((projectIdentity = projectIdentity2), handler3({ releaseBuffer: !![] }), !![]);
    },
    commitDraft = (record, { recordHistory: recordHistory = !![] } = {}) => {
      if (!handler() || !soundEnabled['isOpen'] || !Array['isArray'](record)) return ![];
      if (JSON['stringify'](soundEnabled['draft']) === JSON['stringify'](record)) return ![];
      if (recordHistory) {
        soundEnabled['undoStack']['push'](clone(soundEnabled['draft']));
        if (soundEnabled['undoStack']['length'] > 0x32) soundEnabled['undoStack']['shift']();
      }
      soundEnabled['draft'] = clone(record);
      const map = new Set(
        soundEnabled['draft']['map']((payload) => normalizeId(payload?.['shotId']))['filter'](Boolean),
      );
      return (
        (soundEnabled['selectedShotIds'] = soundEnabled['selectedShotIds']['filter']((handle) =>
          map['has'](handle),
        )),
        (soundEnabled['playheadSec'] = clampTimelineSec(soundEnabled['draft'], soundEnabled['playheadSec'])),
        !![]
      );
    },
    undo = () => {
      if (!handler() || !soundEnabled['isOpen'] || !soundEnabled['undoStack']['length']) return ![];
      ((soundEnabled['draft'] = soundEnabled['undoStack']['pop']()),
        (soundEnabled['playheadSec'] = clampTimelineSec(soundEnabled['draft'], soundEnabled['playheadSec'])));
      const personReplacementShotCutPositionAtTimelineSec = getPersonReplacementShotCutPositionAtTimelineSec(
        soundEnabled['draft'],
        soundEnabled['playheadSec'],
      );
      return (
        (soundEnabled['previewShotId'] =
          personReplacementShotCutPositionAtTimelineSec['shotId'] ||
          soundEnabled['draft'][0x0]?.['shotId'] ||
          ''),
        (soundEnabled['selectedShotIds'] = []),
        !![]
      );
    },
    resetDraft = () => {
      if (!handler() || !soundEnabled['isOpen']) return ![];
      const state = commitDraft(soundEnabled['initialDraft']);
      if (state) soundEnabled['selectedShotIds'] = [];
      return state;
    },
    splitAtPlayhead = () => {
      if (!handler() || !soundEnabled['isOpen']) return ![];
      const list = splitPersonReplacementShotCutAtTimelineSec(
        soundEnabled['draft'],
        soundEnabled['playheadSec'],
      );
      if (list === soundEnabled['draft'] || list['length'] === soundEnabled['draft']['length']) return ![];
      const personReplacementShotCutPositionAtTimelineSec2 = getPersonReplacementShotCutPositionAtTimelineSec(
        list,
        soundEnabled['playheadSec'],
      );
      return (
        commitDraft(list),
        (soundEnabled['previewShotId'] =
          personReplacementShotCutPositionAtTimelineSec2['shotId'] || soundEnabled['previewShotId']),
        (soundEnabled['selectedShotIds'] = []),
        !![]
      );
    },
    mergeSelectedRanges = () => {
      if (!handler() || !soundEnabled['isOpen']) return ![];
      const config = soundEnabled['selectedShotIds']
          ['map']((scope) =>
            soundEnabled['draft']['findIndex'](
              (input) => normalizeId(input?.['shotId']) === normalizeId(scope),
            ),
          )
          ['filter']((count) => count >= 0x0)
          ['sort']((output, value3) => output - value3),
        value4 = config[0x0],
        personReplacementShotCutRanges = mergePersonReplacementShotCutRanges(
          soundEnabled['draft'],
          soundEnabled['selectedShotIds'],
          {
            preferredShotId: soundEnabled['previewShotId'],
          },
        );
      if (
        personReplacementShotCutRanges === soundEnabled['draft'] ||
        !commitDraft(personReplacementShotCutRanges)
      )
        return ![];
      const value5 = soundEnabled['draft'][value4];
      return (
        (soundEnabled['selectedShotIds'] = []),
        (soundEnabled['previewShotId'] = normalizeId(value5?.['shotId'])),
        (soundEnabled['playheadSec'] = getPersonReplacementShotCutTimelineSec(
          soundEnabled['draft'],
          value5?.['shotId'],
          value5?.['startSec'],
        )),
        !![]
      );
    },
    moveBoundary = (value6, value7, { recordHistory: recordHistory = !![] } = {}) => {
      if (!handler() || !soundEnabled['isOpen']) return ![];
      const movePersonReplacementShotCutBoundary2 = movePersonReplacementShotCutBoundary(
        soundEnabled['draft'],
        value6,
        value7,
      );
      return commitDraft(movePersonReplacementShotCutBoundary2, { recordHistory: recordHistory });
    },
    toggleReverse = async (value8 = soundEnabled['playheadSec']) => {
      if (!handler() || !soundEnabled['isOpen']) return ![];
      const clone2 = clone(soundEnabled['draft']),
        shotId = togglePersonReplacementShotReverseAtTimelineSec(soundEnabled['draft'], value8);
      if (!shotId?.['draft'] || !commitDraft(shotId['draft'])) return ![];
      const originShotId = soundEnabled['draft'][shotId['position']?.['shotIndex']];
      try {
        return (
          await onReverseRequested({
            shotId: shotId['position']?.['shotId'] || originShotId?.['shotId'] || '',
            originShotId: originShotId?.['originShotId'] || originShotId?.['shotId'] || '',
            isReversed: shotId['isReversed'] === !![],
          }),
          !![]
        );
      } catch (value9) {
        ((soundEnabled['draft'] = clone2), soundEnabled['undoStack']['pop']());
        throw value9;
      }
    },
    beginSmartDetection = async (options3 = {}) => {
      if (!handler() || !soundEnabled['isOpen'] || soundEnabled['isSmartDetecting']) return ![];
      const value10 = ++soundEnabled['smartDetectionToken'];
      ((soundEnabled['isSmartDetecting'] = !![]), (soundEnabled['isSmartDetectOpen'] = ![]));
      try {
        const list2 = await onDetectionRequested(options3);
        if (
          enabled ||
          !soundEnabled['isOpen'] ||
          value10 !== soundEnabled['smartDetectionToken'] ||
          !Array['isArray'](list2) ||
          !list2['length']
        )
          return ![];
        return (
          commitDraft(list2),
          (soundEnabled['playheadSec'] = 0x0),
          (soundEnabled['previewShotId'] = list2[0x0]?.['shotId'] || ''),
          (soundEnabled['selectedShotIds'] = []),
          !![]
        );
      } finally {
        !enabled &&
          value10 === soundEnabled['smartDetectionToken'] &&
          (soundEnabled['isSmartDetecting'] = ![]);
      }
    },
    getPresentation = () => ({
      isOpen: soundEnabled['isOpen'],
      isOpening: soundEnabled['isOpening'],
      motion: soundEnabled['motion'],
      draft: clone(soundEnabled['draft']),
      initialDraft: clone(soundEnabled['initialDraft']),
      canUndo: soundEnabled['undoStack']['length'] > 0x0,
      isSubmitting: soundEnabled['isSubmitting'],
      isKeyframeCapturing: soundEnabled['isKeyframeCapturing'],
      isSmartDetectOpen: soundEnabled['isSmartDetectOpen'],
      isSmartDetecting: soundEnabled['isSmartDetecting'],
      previewShotId: soundEnabled['previewShotId'],
      playheadSec: soundEnabled['playheadSec'],
      hoverPreviewActive: soundEnabled['hoverPreviewActive'],
      hoverPreviewTimeSec: soundEnabled['hoverPreviewTimeSec'],
      timelineZoom: soundEnabled['timelineZoom'],
      soundEnabled: soundEnabled['soundEnabled'],
      selectedShotIds: [...soundEnabled['selectedShotIds']],
    }),
    getWorkspacePresentation = (args = {}) => ({
      cutEditorOpen: soundEnabled['isOpen'],
      cutEditorOpening: soundEnabled['isOpening'],
      cutEditorMotion: soundEnabled['motion'],
      cutEditorDraft: soundEnabled['draft'],
      cutEditorSubmitting: soundEnabled['isSubmitting'],
      cutEditorKeyframeCapturing: soundEnabled['isKeyframeCapturing'],
      cutEditorSmartDetectOpen: soundEnabled['isSmartDetectOpen'],
      cutEditorSmartDetecting: soundEnabled['isSmartDetecting'],
      cutEditorPreviewShotId: soundEnabled['previewShotId'],
      cutEditorPlayheadSec: soundEnabled['playheadSec'],
      cutEditorTimelineZoom: soundEnabled['timelineZoom'],
      cutEditorSoundEnabled: soundEnabled['soundEnabled'],
      cutEditorSelectedShotIds: [...soundEnabled['selectedShotIds']],
      cutEditorBufferedMediaRef: soundEnabled['bufferedVideo'] ? soundEnabled['bufferedMediaRef'] : '',
      cutEditorCanUndo: soundEnabled['undoStack']['length'] > 0x0,
      ...args,
    }),
    dispose = () => {
      if (enabled) return;
      (handler3({ releaseBuffer: !![] }), (enabled = !![]));
    },
    configureActionHandlers = (args2 = {}) => {
      if (!handler()) return ![];
      return ((result = Object['freeze']({ ...args2 })), !![]);
    },
    handleAction = (value11, value12 = {}) => {
      if (!handler()) return ![];
      const enabled2 = SHOT_CUT_ACTIONS[normalizeId(value11)];
      if (!enabled2) return ![];
      const run = result[enabled2];
      if (typeof run === 'function') run(value12);
      return !![];
    };
  return Object['freeze']({
    open: open,
    close: close,
    syncProject: syncProject,
    dispose: dispose,
    commitDraft: commitDraft,
    undo: undo,
    resetDraft: resetDraft,
    splitAtPlayhead: splitAtPlayhead,
    mergeSelectedRanges: mergeSelectedRanges,
    moveBoundary: moveBoundary,
    toggleReverse: toggleReverse,
    beginSmartDetection: beginSmartDetection,
    getPresentation: getPresentation,
    getWorkspacePresentation: getWorkspacePresentation,
    configureActionHandlers: configureActionHandlers,
    handleAction: handleAction,
    playback: playback,
    stopPlayback: stopPlayback2,
    workspaceState: soundEnabled,
    clearMotionTimer: clearMotionTimer,
    stopBoundaryDrag: stopBoundaryDrag,
    clearPreviewMetadata: clearPreviewMetadata,
    clearBufferedWarmup: clearBufferedWarmup,
    cancelHoverPreview: cancelHoverPreview,
    cancelPreviewFrameWait: cancelPreviewFrameWait,
    setOpening(value13) {
      if (handler()) soundEnabled['isOpening'] = Boolean(value13);
    },
    setMotion(value14) {
      if (handler()) soundEnabled['motion'] = normalizeId(value14);
    },
    setSubmitting(value15) {
      if (handler()) soundEnabled['isSubmitting'] = value15 || ![];
    },
    setKeyframeCapturing(value16) {
      if (handler()) soundEnabled['isKeyframeCapturing'] = Boolean(value16);
    },
    setSmartDetectOpen(value17) {
      if (handler()) soundEnabled['isSmartDetectOpen'] = Boolean(value17);
    },
    setPreviewShotId(value18) {
      if (handler()) soundEnabled['previewShotId'] = normalizeId(value18);
    },
    setPlayheadSec(value19) {
      handler() && (soundEnabled['playheadSec'] = clampTimelineSec(soundEnabled['draft'], value19));
    },
    setHoverPreview({ active: active = ![], timeSec: timeSec = null } = {}) {
      if (!handler()) return;
      ((soundEnabled['hoverPreviewActive'] = Boolean(active)),
        (soundEnabled['hoverPreviewTimeSec'] =
          active && Number['isFinite'](Number(timeSec)) ? Number(timeSec) : null));
    },
    setTimelineZoom(value20) {
      handler() &&
        (soundEnabled['timelineZoom'] = Math['max'](0x1, Number(value20) || DEFAULT_TIMELINE_ZOOM));
    },
    setSoundEnabled(value21) {
      if (handler()) soundEnabled['soundEnabled'] = Boolean(value21);
    },
    setSelectedShotIds(list3 = []) {
      if (!handler()) return;
      const map2 = new Set(
        soundEnabled['draft']['map']((value22) => normalizeId(value22?.['shotId']))['filter'](Boolean),
      );
      soundEnabled['selectedShotIds'] = [
        ...new Set(
          (Array['isArray'](list3) ? list3 : [])
            ['map'](normalizeId)
            ['filter']((value23) => map2['has'](value23)),
        ),
      ];
    },
    attachPreviewBuffer(value24, value25 = null) {
      if (!handler()) return ![];
      const enabled3 = soundEnabled['bufferedVideo'] !== value24;
      if (enabled3) releasePreviewBuffer2();
      soundEnabled['bufferedVideo'] = value24 || null;
      if (typeof value25 === 'function') {
        if (!enabled3) value2?.();
        value2 = value25;
      } else enabled3 && (value2 = null);
      return Boolean(soundEnabled['bufferedVideo']);
    },
    releasePreviewBuffer: releasePreviewBuffer2,
  });
}
