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
function clone(_0x50dd75) {
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(_0x50dd75);
    } catch {}
  return JSON['parse'](JSON['stringify'](_0x50dd75));
}
function normalizeId(_0x3857ae) {
  return String(_0x3857ae ?? '')['trim']();
}
function resolveProjectIdentity(_0x2f80cd = {}) {
  return normalizeId(_0x2f80cd['id'] || _0x2f80cd['projectId'] || _0x2f80cd['sessionId']);
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
function clampTimelineSec(_0x4eee3b, _0x1ca4d2) {
  const _0xc9a4ad = getPersonReplacementShotCutTotalDuration(_0x4eee3b);
  return Math['min'](_0xc9a4ad, Math['max'](0x0, Number(_0x1ca4d2) || 0x0));
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
  const _0x46fcda = createInitialState();
  let _0x28523e = resolveProjectIdentity(initialProject),
    _0x1de379 = ![],
    _0x15313 = null,
    _0x222f6b = Object['freeze']({});
  const _0xad38a8 = playbackControllerOptions
      ? createPersonReplacementShotCutPlaybackController(playbackControllerOptions)
      : null,
    _0x19323f = () => !_0x1de379,
    _0x3a024f = () => {
      (_0x46fcda['openingCleanup']?.(), (_0x46fcda['openingCleanup'] = null));
    },
    _0x555a58 = () => {
      if (!_0x46fcda['motionTimer']) return ![];
      return (
        windowObject?.['clearTimeout']?.(_0x46fcda['motionTimer']),
        (_0x46fcda['motionTimer'] = 0x0),
        !![]
      );
    },
    _0x42295 = () => {
      (_0x46fcda['boundaryDrag']?.['cleanup']?.(),
        (_0x46fcda['boundaryDrag'] = null),
        onBoundaryDragStopped());
    },
    _0x580833 = () => {
      (_0x46fcda['previewMetadataCleanup']?.(), (_0x46fcda['previewMetadataCleanup'] = null));
    },
    _0x1a8364 = () => {
      (_0x46fcda['bufferedWarmupCleanup']?.(), (_0x46fcda['bufferedWarmupCleanup'] = null));
    },
    _0x2f1613 = () => {
      if (_0x46fcda['hoverPreviewRaf']) {
        try {
          windowObject?.['cancelAnimationFrame']?.(_0x46fcda['hoverPreviewRaf']);
        } catch {}
        try {
          windowObject?.['clearTimeout']?.(_0x46fcda['hoverPreviewRaf']);
        } catch {}
        _0x46fcda['hoverPreviewRaf'] = 0x0;
      }
      _0x46fcda['hoverPreviewRequest'] = null;
    },
    _0x1d40c9 = () => {
      (_0x1a8364(), _0x15313?.(), (_0x15313 = null));
      if (_0x46fcda['bufferedVideo'] !== null) {
        const _0x410559 = _0x46fcda['bufferedVideo'];
        releasePreviewBuffer(_0x410559);
        try {
          _0x410559['pause']?.();
        } catch {}
        try {
          (_0x410559['removeAttribute']?.('src'), _0x410559['load']?.());
        } catch {}
        return (
          (_0x46fcda['bufferedVideo'] = null),
          (_0x46fcda['bufferedSourceId'] = ''),
          (_0x46fcda['bufferedMediaRef'] = ''),
          !![]
        );
      }
      return ![];
    },
    _0x1b0853 = () => {
      (_0xad38a8?.['stop']?.(),
        stopPlayback(),
        (_0x46fcda['hoverPreviewActive'] = ![]),
        (_0x46fcda['hoverPreviewTimeSec'] = null));
    },
    _0x426fc4 = () => {
      const _0x5c7efb = _0x46fcda['previewFrameCallbackVideo'],
        _0x53fa05 = _0x46fcda['previewFrameCallbackId'];
      if (_0x53fa05 != null && _0x5c7efb?.['cancelVideoFrameCallback'])
        try {
          _0x5c7efb['cancelVideoFrameCallback'](_0x53fa05);
        } catch {}
      ((_0x46fcda['previewFrameCallbackId'] = null), (_0x46fcda['previewFrameCallbackVideo'] = null));
    },
    _0x43e633 = ({ releaseBuffer: _0xb56106 = !![] } = {}) => {
      (_0x3a024f(), _0x555a58(), _0x42295(), _0x580833(), _0x1a8364(), _0x2f1613(), _0x426fc4(), _0x1b0853());
      const _0x5d59fd = _0x46fcda['bufferedVideo'],
        _0x4d3390 = _0x46fcda['bufferedSourceId'],
        _0xb15682 = _0x46fcda['bufferedMediaRef'];
      if (_0xb56106) _0x1d40c9();
      const _0x3b8088 = _0x46fcda['smartDetectionToken'] + 0x1,
        _0x2a786b = _0x46fcda['boundPreviewVideos'];
      Object['assign'](_0x46fcda, createInitialState(), {
        smartDetectionToken: _0x3b8088,
        boundPreviewVideos: _0x2a786b,
        ...(!_0xb56106 && _0x5d59fd
          ? { bufferedVideo: _0x5d59fd, bufferedSourceId: _0x4d3390, bufferedMediaRef: _0xb15682 }
          : {}),
      });
    },
    _0x134711 = (_0x121346 = initialProject, _0x420b1c = null) => {
      if (!_0x19323f()) return ![];
      const _0x20cd8e = Array['isArray'](_0x420b1c)
        ? clone(_0x420b1c)
        : createPersonReplacementShotCutDraft(_0x121346);
      if (!_0x20cd8e['length']) return ![];
      ((_0x28523e = resolveProjectIdentity(_0x121346)), _0x1b0853());
      const _0x2e3596 = _0x46fcda['boundPreviewVideos'],
        _0x5c64f3 = _0x46fcda['bufferedVideo'],
        _0x2ccd20 = _0x46fcda['bufferedSourceId'],
        _0x2fb0d6 = _0x46fcda['bufferedMediaRef'];
      return (
        Object['assign'](_0x46fcda, createInitialState(), {
          isOpen: !![],
          draft: _0x20cd8e,
          initialDraft: clone(_0x20cd8e),
          previewShotId: normalizeId(
            _0x121346?.['workspace']?.['selectedShotId'] || _0x20cd8e[0x0]?.['shotId'],
          ),
          soundEnabled: _0x46fcda['soundEnabled'],
          timelineZoom: _0x46fcda['timelineZoom'],
          smartDetectionToken: _0x46fcda['smartDetectionToken'] + 0x1,
          boundPreviewVideos: _0x2e3596,
          ...(_0x5c64f3
            ? { bufferedVideo: _0x5c64f3, bufferedSourceId: _0x2ccd20, bufferedMediaRef: _0x2fb0d6 }
            : {}),
        }),
        !![]
      );
    },
    _0x244132 = ({ releaseBuffer: _0x1185ed = ![] } = {}) => {
      if (!_0x19323f()) return ![];
      const _0x51fd7e = _0x46fcda['isOpen'] || _0x46fcda['isOpening'] || Boolean(_0x46fcda['motion']);
      return (_0x43e633({ releaseBuffer: _0x1185ed }), _0x51fd7e);
    },
    _0x33a3fe = (_0x27ad8c = {}) => {
      if (!_0x19323f()) return ![];
      const _0x49f072 = resolveProjectIdentity(_0x27ad8c);
      if (_0x49f072 === _0x28523e) return ![];
      return ((_0x28523e = _0x49f072), _0x43e633({ releaseBuffer: !![] }), !![]);
    },
    _0x55f0b4 = (_0x438a56, { recordHistory: recordHistory = !![] } = {}) => {
      if (!_0x19323f() || !_0x46fcda['isOpen'] || !Array['isArray'](_0x438a56)) return ![];
      if (JSON['stringify'](_0x46fcda['draft']) === JSON['stringify'](_0x438a56)) return ![];
      if (recordHistory) {
        _0x46fcda['undoStack']['push'](clone(_0x46fcda['draft']));
        if (_0x46fcda['undoStack']['length'] > 0x32) _0x46fcda['undoStack']['shift']();
      }
      _0x46fcda['draft'] = clone(_0x438a56);
      const _0x599c61 = new Set(
        _0x46fcda['draft']['map']((_0x4e11fc) => normalizeId(_0x4e11fc?.['shotId']))['filter'](Boolean),
      );
      return (
        (_0x46fcda['selectedShotIds'] = _0x46fcda['selectedShotIds']['filter']((_0x3a22ab) =>
          _0x599c61['has'](_0x3a22ab),
        )),
        (_0x46fcda['playheadSec'] = clampTimelineSec(_0x46fcda['draft'], _0x46fcda['playheadSec'])),
        !![]
      );
    },
    _0x2ad128 = () => {
      if (!_0x19323f() || !_0x46fcda['isOpen'] || !_0x46fcda['undoStack']['length']) return ![];
      ((_0x46fcda['draft'] = _0x46fcda['undoStack']['pop']()),
        (_0x46fcda['playheadSec'] = clampTimelineSec(_0x46fcda['draft'], _0x46fcda['playheadSec'])));
      const _0x4bdc20 = getPersonReplacementShotCutPositionAtTimelineSec(
        _0x46fcda['draft'],
        _0x46fcda['playheadSec'],
      );
      return (
        (_0x46fcda['previewShotId'] = _0x4bdc20['shotId'] || _0x46fcda['draft'][0x0]?.['shotId'] || ''),
        (_0x46fcda['selectedShotIds'] = []),
        !![]
      );
    },
    _0x3d9fdb = () => {
      if (!_0x19323f() || !_0x46fcda['isOpen']) return ![];
      const _0x339179 = _0x55f0b4(_0x46fcda['initialDraft']);
      if (_0x339179) _0x46fcda['selectedShotIds'] = [];
      return _0x339179;
    },
    _0x170570 = () => {
      if (!_0x19323f() || !_0x46fcda['isOpen']) return ![];
      const _0x3a9332 = splitPersonReplacementShotCutAtTimelineSec(
        _0x46fcda['draft'],
        _0x46fcda['playheadSec'],
      );
      if (_0x3a9332 === _0x46fcda['draft'] || _0x3a9332['length'] === _0x46fcda['draft']['length'])
        return ![];
      const _0x59d22d = getPersonReplacementShotCutPositionAtTimelineSec(_0x3a9332, _0x46fcda['playheadSec']);
      return (
        _0x55f0b4(_0x3a9332),
        (_0x46fcda['previewShotId'] = _0x59d22d['shotId'] || _0x46fcda['previewShotId']),
        (_0x46fcda['selectedShotIds'] = []),
        !![]
      );
    },
    _0x39e5ac = () => {
      if (!_0x19323f() || !_0x46fcda['isOpen']) return ![];
      const _0x11c291 = _0x46fcda['selectedShotIds']
          ['map']((_0x3d7f58) =>
            _0x46fcda['draft']['findIndex'](
              (_0x5c320a) => normalizeId(_0x5c320a?.['shotId']) === normalizeId(_0x3d7f58),
            ),
          )
          ['filter']((_0x327319) => _0x327319 >= 0x0)
          ['sort']((_0x3eed42, _0x4ca775) => _0x3eed42 - _0x4ca775),
        _0x15f847 = _0x11c291[0x0],
        _0x1dce19 = mergePersonReplacementShotCutRanges(_0x46fcda['draft'], _0x46fcda['selectedShotIds'], {
          preferredShotId: _0x46fcda['previewShotId'],
        });
      if (_0x1dce19 === _0x46fcda['draft'] || !_0x55f0b4(_0x1dce19)) return ![];
      const _0x454d8c = _0x46fcda['draft'][_0x15f847];
      return (
        (_0x46fcda['selectedShotIds'] = []),
        (_0x46fcda['previewShotId'] = normalizeId(_0x454d8c?.['shotId'])),
        (_0x46fcda['playheadSec'] = getPersonReplacementShotCutTimelineSec(
          _0x46fcda['draft'],
          _0x454d8c?.['shotId'],
          _0x454d8c?.['startSec'],
        )),
        !![]
      );
    },
    _0x348991 = (_0x44c39c, _0x671ed5, { recordHistory: recordHistory = !![] } = {}) => {
      if (!_0x19323f() || !_0x46fcda['isOpen']) return ![];
      const _0x38df1b = movePersonReplacementShotCutBoundary(_0x46fcda['draft'], _0x44c39c, _0x671ed5);
      return _0x55f0b4(_0x38df1b, { recordHistory: recordHistory });
    },
    _0x486379 = async (_0x251fd8 = _0x46fcda['playheadSec']) => {
      if (!_0x19323f() || !_0x46fcda['isOpen']) return ![];
      const _0x3a213b = clone(_0x46fcda['draft']),
        _0x4c228e = togglePersonReplacementShotReverseAtTimelineSec(_0x46fcda['draft'], _0x251fd8);
      if (!_0x4c228e?.['draft'] || !_0x55f0b4(_0x4c228e['draft'])) return ![];
      const _0x4b64a1 = _0x46fcda['draft'][_0x4c228e['position']?.['shotIndex']];
      try {
        return (
          await onReverseRequested({
            shotId: _0x4c228e['position']?.['shotId'] || _0x4b64a1?.['shotId'] || '',
            originShotId: _0x4b64a1?.['originShotId'] || _0x4b64a1?.['shotId'] || '',
            isReversed: _0x4c228e['isReversed'] === !![],
          }),
          !![]
        );
      } catch (_0x1bbec8) {
        ((_0x46fcda['draft'] = _0x3a213b), _0x46fcda['undoStack']['pop']());
        throw _0x1bbec8;
      }
    },
    _0x3f8f52 = async (_0x10d3d6 = {}) => {
      if (!_0x19323f() || !_0x46fcda['isOpen'] || _0x46fcda['isSmartDetecting']) return ![];
      const _0x7060c2 = ++_0x46fcda['smartDetectionToken'];
      ((_0x46fcda['isSmartDetecting'] = !![]), (_0x46fcda['isSmartDetectOpen'] = ![]));
      try {
        const _0x34bd00 = await onDetectionRequested(_0x10d3d6);
        if (
          _0x1de379 ||
          !_0x46fcda['isOpen'] ||
          _0x7060c2 !== _0x46fcda['smartDetectionToken'] ||
          !Array['isArray'](_0x34bd00) ||
          !_0x34bd00['length']
        )
          return ![];
        return (
          _0x55f0b4(_0x34bd00),
          (_0x46fcda['playheadSec'] = 0x0),
          (_0x46fcda['previewShotId'] = _0x34bd00[0x0]?.['shotId'] || ''),
          (_0x46fcda['selectedShotIds'] = []),
          !![]
        );
      } finally {
        !_0x1de379 && _0x7060c2 === _0x46fcda['smartDetectionToken'] && (_0x46fcda['isSmartDetecting'] = ![]);
      }
    },
    _0x133897 = () => ({
      isOpen: _0x46fcda['isOpen'],
      isOpening: _0x46fcda['isOpening'],
      motion: _0x46fcda['motion'],
      draft: clone(_0x46fcda['draft']),
      initialDraft: clone(_0x46fcda['initialDraft']),
      canUndo: _0x46fcda['undoStack']['length'] > 0x0,
      isSubmitting: _0x46fcda['isSubmitting'],
      isKeyframeCapturing: _0x46fcda['isKeyframeCapturing'],
      isSmartDetectOpen: _0x46fcda['isSmartDetectOpen'],
      isSmartDetecting: _0x46fcda['isSmartDetecting'],
      previewShotId: _0x46fcda['previewShotId'],
      playheadSec: _0x46fcda['playheadSec'],
      hoverPreviewActive: _0x46fcda['hoverPreviewActive'],
      hoverPreviewTimeSec: _0x46fcda['hoverPreviewTimeSec'],
      timelineZoom: _0x46fcda['timelineZoom'],
      soundEnabled: _0x46fcda['soundEnabled'],
      selectedShotIds: [..._0x46fcda['selectedShotIds']],
    }),
    _0x35e168 = (_0x3c248b = {}) => ({
      cutEditorOpen: _0x46fcda['isOpen'],
      cutEditorOpening: _0x46fcda['isOpening'],
      cutEditorMotion: _0x46fcda['motion'],
      cutEditorDraft: _0x46fcda['draft'],
      cutEditorSubmitting: _0x46fcda['isSubmitting'],
      cutEditorKeyframeCapturing: _0x46fcda['isKeyframeCapturing'],
      cutEditorSmartDetectOpen: _0x46fcda['isSmartDetectOpen'],
      cutEditorSmartDetecting: _0x46fcda['isSmartDetecting'],
      cutEditorPreviewShotId: _0x46fcda['previewShotId'],
      cutEditorPlayheadSec: _0x46fcda['playheadSec'],
      cutEditorTimelineZoom: _0x46fcda['timelineZoom'],
      cutEditorSoundEnabled: _0x46fcda['soundEnabled'],
      cutEditorSelectedShotIds: [..._0x46fcda['selectedShotIds']],
      cutEditorBufferedMediaRef: _0x46fcda['bufferedVideo'] ? _0x46fcda['bufferedMediaRef'] : '',
      cutEditorCanUndo: _0x46fcda['undoStack']['length'] > 0x0,
      ..._0x3c248b,
    }),
    _0xe2dafe = () => {
      if (_0x1de379) return;
      (_0x43e633({ releaseBuffer: !![] }), (_0x1de379 = !![]));
    },
    _0x21fa84 = (_0x4df50b = {}) => {
      if (!_0x19323f()) return ![];
      return ((_0x222f6b = Object['freeze']({ ..._0x4df50b })), !![]);
    },
    _0xaedb79 = (_0x3f6cec, _0x83c51d = {}) => {
      if (!_0x19323f()) return ![];
      const _0x5ed7d0 = SHOT_CUT_ACTIONS[normalizeId(_0x3f6cec)];
      if (!_0x5ed7d0) return ![];
      const _0x535478 = _0x222f6b[_0x5ed7d0];
      if (typeof _0x535478 === 'function') _0x535478(_0x83c51d);
      return !![];
    };
  return Object['freeze']({
    open: _0x134711,
    close: _0x244132,
    syncProject: _0x33a3fe,
    dispose: _0xe2dafe,
    commitDraft: _0x55f0b4,
    undo: _0x2ad128,
    resetDraft: _0x3d9fdb,
    splitAtPlayhead: _0x170570,
    mergeSelectedRanges: _0x39e5ac,
    moveBoundary: _0x348991,
    toggleReverse: _0x486379,
    beginSmartDetection: _0x3f8f52,
    getPresentation: _0x133897,
    getWorkspacePresentation: _0x35e168,
    configureActionHandlers: _0x21fa84,
    handleAction: _0xaedb79,
    playback: _0xad38a8,
    stopPlayback: _0x1b0853,
    workspaceState: _0x46fcda,
    clearMotionTimer: _0x555a58,
    stopBoundaryDrag: _0x42295,
    clearPreviewMetadata: _0x580833,
    clearBufferedWarmup: _0x1a8364,
    cancelHoverPreview: _0x2f1613,
    cancelPreviewFrameWait: _0x426fc4,
    setOpening(_0x475b0f) {
      if (_0x19323f()) _0x46fcda['isOpening'] = Boolean(_0x475b0f);
    },
    setMotion(_0x5538bc) {
      if (_0x19323f()) _0x46fcda['motion'] = normalizeId(_0x5538bc);
    },
    setSubmitting(_0x5f4e2f) {
      if (_0x19323f()) _0x46fcda['isSubmitting'] = _0x5f4e2f || ![];
    },
    setKeyframeCapturing(_0x7aa4c9) {
      if (_0x19323f()) _0x46fcda['isKeyframeCapturing'] = Boolean(_0x7aa4c9);
    },
    setSmartDetectOpen(_0x1217e6) {
      if (_0x19323f()) _0x46fcda['isSmartDetectOpen'] = Boolean(_0x1217e6);
    },
    setPreviewShotId(_0x4b265e) {
      if (_0x19323f()) _0x46fcda['previewShotId'] = normalizeId(_0x4b265e);
    },
    setPlayheadSec(_0x3864a0) {
      _0x19323f() && (_0x46fcda['playheadSec'] = clampTimelineSec(_0x46fcda['draft'], _0x3864a0));
    },
    setHoverPreview({ active: active = ![], timeSec: timeSec = null } = {}) {
      if (!_0x19323f()) return;
      ((_0x46fcda['hoverPreviewActive'] = Boolean(active)),
        (_0x46fcda['hoverPreviewTimeSec'] =
          active && Number['isFinite'](Number(timeSec)) ? Number(timeSec) : null));
    },
    setTimelineZoom(_0x171d09) {
      _0x19323f() &&
        (_0x46fcda['timelineZoom'] = Math['max'](0x1, Number(_0x171d09) || DEFAULT_TIMELINE_ZOOM));
    },
    setSoundEnabled(_0x1e37ba) {
      if (_0x19323f()) _0x46fcda['soundEnabled'] = Boolean(_0x1e37ba);
    },
    setSelectedShotIds(_0x20fb6f = []) {
      if (!_0x19323f()) return;
      const _0x573d63 = new Set(
        _0x46fcda['draft']['map']((_0x57b9eb) => normalizeId(_0x57b9eb?.['shotId']))['filter'](Boolean),
      );
      _0x46fcda['selectedShotIds'] = [
        ...new Set(
          (Array['isArray'](_0x20fb6f) ? _0x20fb6f : [])
            ['map'](normalizeId)
            ['filter']((_0x4f6b32) => _0x573d63['has'](_0x4f6b32)),
        ),
      ];
    },
    attachPreviewBuffer(_0x1b786b, _0xc152e4 = null) {
      if (!_0x19323f()) return ![];
      const _0x4f7498 = _0x46fcda['bufferedVideo'] !== _0x1b786b;
      if (_0x4f7498) _0x1d40c9();
      _0x46fcda['bufferedVideo'] = _0x1b786b || null;
      if (typeof _0xc152e4 === 'function') {
        if (!_0x4f7498) _0x15313?.();
        _0x15313 = _0xc152e4;
      } else _0x4f7498 && (_0x15313 = null);
      return Boolean(_0x46fcda['bufferedVideo']);
    },
    releasePreviewBuffer: _0x1d40c9,
  });
}
