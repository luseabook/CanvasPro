import appStore from '../core/stores/appStore.js';
import { generateId } from '../core/math.js';
import { commit } from '../modules/history.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { getWaveformBarsPathFromPersistedUrl, getWaveformBarsPathFromUrl } from '../utils/audioWaveform.js';
import {
  MEDIA_CLIP_COMPACT_SIZE,
  MEDIA_CLIP_AUDIO_LANE_COUNT_MAX,
  MEDIA_CLIP_TIMELINE_ZOOM_MAX,
  MEDIA_CLIP_TIMELINE_ZOOM_MIN,
  buildMediaClipExportPayload,
  buildMediaClipIncomingSignature,
  clampMediaClipRange,
  getMediaClipInputKind,
  moveMediaClipAudioClipOnTimeline,
  moveMediaClipClipOnTimeline,
  normalizeMediaClipAudioLaneIndex,
  normalizeMediaClipTimelineView,
  normalizeMediaClipState,
  patchMediaClipAudioLaneMuted,
  patchMediaClipAudioClipState,
  patchMediaClipAudioClipRange,
  patchMediaClipClipRange,
  patchMediaClipTrackRange,
  removeMediaClipAudioClip,
  removeMediaClipClip,
  resolveMediaClipDimensions,
  resolveMediaClipSourceKey,
  rollMediaClipVisualLeftTrim,
  shiftMediaClipTrackRange,
  splitMediaClipAudioAtTimelineSec,
  splitMediaClipAtTimelineSec,
} from './media-clip/mediaClipState.js';
import {
  MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX,
  buildMediaClipTimelineTicks,
  getMediaClipFrameCount,
  getMediaClipTimelineAddSlotLeftPx,
  getMediaClipTimelineContentWidthPx,
  getMediaClipTimelineDeltaSecFromPx,
  getMediaClipTimelineDisplayDuration,
  getMediaClipTimelineNextZoom,
  getMediaClipTimelinePercent,
  getMediaClipTimelinePlayheadModel,
  getMediaClipTimelineRangeRect,
  getMediaClipTimelineSecFromClientX,
  getMediaClipTimelineTrackWidthPx,
  getMediaClipTimelineZoomScrollLeft,
  shouldLockMediaClipTimelineWheelScroll,
} from './media-clip/mediaClipTimelineModel.js';
import {
  pausePreviewPlayback,
  playbackClockTimelineSec,
  playPreview,
  playReplacementAudioFromVideo,
  preparePreviewMediaForPlayback,
  resetPlaybackClock,
  setPreviewPlayIcon,
  startPlaybackLoop,
  syncReplacementAudioFromVideo,
  togglePreviewPlayback,
  updatePreviewControls,
} from './media-clip/mediaClipPlaybackController.js';
import { disposeMediaElement, setMediaElementSource } from './media-clip/mediaClipMediaElement.js';
import {
  collectMediaClipFrameUrls,
  resolveMediaClipAudioUrl,
  resolveMediaClipImageUrl,
  resolveMediaClipLocalPath,
  resolveMediaClipThumbUrl,
  resolveMediaClipVideoUrl,
  resolveMediaClipWaveformUrl,
} from './media-clip/mediaClipSourceResolver.js';
import {
  firstNonEmpty,
  formatDurationLabel,
  formatTime,
  getTrackDuration,
  isSameMediaClipState,
  normalizeText,
  parsePercentValue,
  readLayoutWidthPx,
  stopPointer,
  toNumber,
} from './media-clip/mediaClipUtils.js';
import {
  MEDIA_CLIP_WAVEFORM_HEIGHT,
  MEDIA_CLIP_WAVEFORM_SAMPLES,
  MEDIA_CLIP_WAVEFORM_WIDTH,
  createConnectCursorIcon,
  createMediaClipSvgElement,
  fillFilmstripPlaceholder,
  formatWaveformPct,
  getMediaClipWaveformViewBox,
  getMediaClipWaveformViewport,
  iconButton,
  makeButton,
  setMediaClipSvgClass,
} from './media-clip/mediaClipViewUtils.js';
import {
  clearTimelineHoverState,
  createTimelineInteractionState,
  getTimelineDrag,
  isTimelineDragSession,
  nextTimelineDragSessionId,
  setTimelineDrag,
  setTimelineHoverSegment,
} from './media-clip/mediaClipTimelineInteractionController.js';
import {
  addImageOutputNodeFromSource,
  addOutputNode,
  exportAndUse,
  exportAudioClips,
  exportLoadingTargetElement,
  exportMaterialToCanvas,
  exportVisualClips,
  exportVisualDurationSec,
  firstExportVideoSource,
  renderDownloadMenu,
  resolveOutputNodePosition,
  singleVisualClipExportTrack,
  startExportLoading,
  stopExportLoading,
  waitForExportLoadingFrame,
} from './media-clip/mediaClipExportController.js';
const TIMELINE_VIEW_PERSIST_DELAY_MS = 180,
  TIMELINE_SETTLE_ANIMATION_MS = 0x168,
  PREVIEW_SCRUB_SEEK_EPSILON_SEC = 0.04,
  TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX = 48,
  TIMELINE_DRAG_AUTO_SCROLL_MAX_PX = 18,
  TIMELINE_ZOOM_OUT_DISPLAY_MULTIPLIER = 4,
  MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX = 30,
  MEDIA_CLIP_AUDIO_LANE_GAP_PX = 6,
  MEDIA_CLIP_AUDIO_LANE_DRAG_THRESHOLD_PX = 18,
  MEDIA_CLIP_TIMELINE_AXIS_WIDTH_PX = 48,
  MEDIA_CLIP_DELETE_MATERIAL_EVENT = 'media-clip-delete-material',
  MEDIA_CLIP_EXPANDED_HOST_Z_INDEX = '12000';
let activeExpandedMediaClipNode = null;
function mediaClipText(_0x2487e7, _0x464164 = {}) {
  return t('mediaClip.' + _0x2487e7, _0x464164);
}
export {
  getMediaClipFrameCount,
  getMediaClipTimelineAddSlotLeftPx,
  getMediaClipTimelineContentWidthPx,
  getMediaClipTimelineDisplayDuration,
  shouldLockMediaClipTimelineWheelScroll,
} from './media-clip/mediaClipTimelineModel.js';
export class MediaClipNode {
  constructor(_0x298e4e) {
    ((this.nodeData = _0x298e4e || {}),
      (this.id = this.nodeData.id),
      (this.el = document.createElement('div')),
      (this.el.className = 'media-clip-node-shell'),
      (this._sources = { video: null, videos: [], audio: null, audios: [] }),
      (this._mediaClip = normalizeMediaClipState(this.nodeData, this._sources)),
      (this._timelineView = normalizeMediaClipTimelineView(this._mediaClip.timelineView)),
      (this._playheadSec = 0),
      (this._exporting = false),
      (this._menuOpen = false),
      (this._materialMenu = null),
      (this._materialMenuEl = null),
      (this._exportLoadingTarget = null),
      (this._unsubscribePick = null),
      (this._unsubscribeInputs = null),
      (this._unsubscribeLocale = null),
      (this._timelineInteractionState = this._createTimelineInteractionState()),
      (this._suppressTrackClick = false),
      (this._activeClipIndex = 0),
      (this._selectedClipIndex = -1),
      (this._activeAudioClipIndex = 0),
      (this._selectedAudioClipIndex = -1),
      (this._timelineScrollLeft = this._timelineView.scrollLeft),
      (this._timelineViewPersistTimer = 0),
      (this._timelineViewPersistRender = false),
      (this._timelineSettleTimer = 0),
      (this._timelineSettleRow = null),
      (this._timelineSettlePendingPersist = false),
      (this._timelineSettlePendingCommit = false),
      (this._timelineSettleVersion = 0),
      (this._timelineDragSessionSeq = 0),
      (this._timelineDragAutoScrollRaf = 0),
      (this._deferredTimelineDragNodeData = null),
      (this._skipNextStoreMediaClipRender = false),
      (this._skipNextIncomingMediaClipRender = false),
      (this._restoringTimelineScroll = null),
      (this._onDocumentPointerDown = null),
      (this._onMaterialMenuPointerDown = null),
      (this._onDocumentKeyDown = null),
      (this._onDeleteMaterialShortcut = null),
      (this._lastDeleteMaterialShortcutAt = Number.NEGATIVE_INFINITY),
      (this._pendingPreviewSeek = { video: null, audio: null }),
      (this._previewSeekRaf = { video: 0, audio: 0 }),
      (this._previewSeekState = {
        video: this._createPreviewSeekState(),
        audio: this._createPreviewSeekState(),
      }),
      (this._playbackRaf = 0),
      (this._playing = false),
      (this._playPreviewPending = null),
      (this._previewVisualKind = ''),
      (this._playbackStartedAtMs = Number.NaN),
      (this._playbackStartSec = 0),
      (this._imagePlaybackStartedAt = 0),
      (this._imagePlaybackStartSec = 0),
      (this._videoPreview = null),
      (this._imagePreview = null),
      (this._audioPreview = null),
      (this._previewPlayButton = null),
      (this._previewTimeLabel = null),
      (this._previewVideoSrc = ''),
      (this._previewAudioSrc = ''));
  }
  ['_createTimelineInteractionState'](_0xd98c71 = {}) {
    return createTimelineInteractionState(_0xd98c71);
  }
  ['_timelineDrag']() {
    return getTimelineDrag(this);
  }
  ['_compactLayoutSize'](_0x39da74 = this._mediaClip) {
    return { width: MEDIA_CLIP_COMPACT_SIZE.width, height: MEDIA_CLIP_COMPACT_SIZE.height };
  }
  ['_nextTimelineDragSessionId']() {
    return nextTimelineDragSessionId(this);
  }
  ['_isTimelineDragSession'](_0x35f61e) {
    return isTimelineDragSession(this, _0x35f61e);
  }
  ['_setTimelineDrag'](_0x6bbe33 = null) {
    return setTimelineDrag(this, _0x6bbe33);
  }
  ['_setTimelineHoverSegment'](_0x597fe8, _0x1d809b, _0x36f6a0 = '', _0x3fb326 = -1) {
    return setTimelineHoverSegment(this, _0x597fe8, _0x1d809b, _0x36f6a0, _0x3fb326);
  }
  ['_clearTimelineHoverState'](_0x47da72 = this.el) {
    return clearTimelineHoverState(this, _0x47da72);
  }
  ['mount']() {
    return (
      this.el.addEventListener('pointerdown', (_0xeb96c9) => {
        (this._mediaClip.expanded === true ||
          _0xeb96c9.target.closest('button, video, audio, .media-clip-menu')) &&
          _0xeb96c9.stopPropagation();
      }),
      (this._unsubscribePick = appStore.subscribeSelector?.(
        (_0x5d84e8) => ({
          active: _0x5d84e8.pickConnectMode?.active === true,
          sourceNodeId: _0x5d84e8.pickConnectMode?.sourceNodeId || '',
        }),
        () => this._render(),
      )),
      (this._unsubscribeInputs = appStore.subscribeSelector?.(
        (_0x5d3cdb) => buildMediaClipIncomingSignature(_0x5d3cdb, this.id),
        () => {
          const _0x492598 = this._skipNextIncomingMediaClipRender === true;
          this._skipNextIncomingMediaClipRender = false;
          const _0x1b3af7 = appStore.getState()?.nodes?.[this.id] || this.nodeData;
          ((this.nodeData = _0x1b3af7), this._syncFromStore(_0x1b3af7));
          if (_0x492598) return;
          this._render();
        },
      )),
      (this._unsubscribeLocale = onLocaleChange(() => this._render())),
      this._syncFromStore(this.nodeData),
      this._render(),
      this.el
    );
  }
  ['unmount']() {
    (this._unsubscribePick?.(),
      this._unsubscribeInputs?.(),
      this._unsubscribeLocale?.(),
      (this._unsubscribePick = null),
      (this._unsubscribeInputs = null),
      (this._unsubscribeLocale = null),
      this._detachDragListeners(),
      this._syncDocumentExitListener(false),
      this._syncMaterialMenuDismissListener(false),
      this._syncDocumentKeyListener(false),
      this._syncDeleteMaterialShortcutListener(false),
      this._removeMaterialMenuPortal(),
      this._stopExportLoading(),
      this._releaseExpandedEditor(),
      this._disposePreviewMedia(),
      this._timelineViewPersistTimer &&
        (clearTimeout(this._timelineViewPersistTimer), (this._timelineViewPersistTimer = 0)),
      this._timelineSettleTimer &&
        (clearTimeout(this._timelineSettleTimer),
        (this._timelineSettleTimer = 0),
        this._timelineSettleRow?.classList.remove('is-settling'),
        this._flushTimelineSettlePersist()),
      (this._timelineSettleRow = null),
      (this._skipNextStoreMediaClipRender = false),
      (this._skipNextIncomingMediaClipRender = false),
      (this._timelineViewPersistRender = false),
      (this._restoringTimelineScroll = null),
      this._stopTimelineDragAutoScroll());
  }
  ['update'](_0x12a243) {
    const _0x10b840 = _0x12a243 || this.nodeData;
    if (this._timelineDrag()) {
      ((this._deferredTimelineDragNodeData = _0x10b840),
        (this.nodeData = { ...(_0x10b840 || {}), mediaClip: this._mediaClip }));
      return;
    }
    if (this._skipNextStoreMediaClipRender && isSameMediaClipState(_0x10b840?.mediaClip, this._mediaClip)) {
      ((this._skipNextStoreMediaClipRender = false), (this.nodeData = _0x10b840));
      return;
    }
    if (
      (this._timelineSettleTimer || this._timelineSettleRow) &&
      isSameMediaClipState(_0x10b840?.mediaClip, this._mediaClip)
    ) {
      ((this._skipNextStoreMediaClipRender = false), (this.nodeData = _0x10b840));
      return;
    }
    if (this._isTimelinePresentationOnlyUpdate(_0x10b840)) {
      ((this._skipNextStoreMediaClipRender = false),
        (this.nodeData = { ...(_0x10b840 || {}), mediaClip: this._mediaClip }));
      return;
    }
    ((this._skipNextStoreMediaClipRender = false),
      (this.nodeData = _0x10b840),
      this._syncFromStore(this.nodeData),
      this._render());
  }
  ['_isTimelinePresentationOnlyUpdate'](_0xb9399 = {}) {
    if (!_0xb9399 || !Object.prototype.hasOwnProperty.call(_0xb9399, 'mediaClip')) return false;
    if (!isSameMediaClipState(_0xb9399.mediaClip, this._mediaClip)) return false;
    const _0x27ff8d = this.nodeData || {},
      _0x40d824 = toNumber(_0x27ff8d.width, MEDIA_CLIP_COMPACT_SIZE.width),
      _0x13180f = toNumber(_0x27ff8d.height, MEDIA_CLIP_COMPACT_SIZE.height),
      _0x12ca3b = toNumber(_0xb9399.width, _0x40d824),
      _0x3eea11 = toNumber(_0xb9399.height, _0x13180f);
    return Math.abs(_0x12ca3b - _0x40d824) <= 0.01 && Math.abs(_0x3eea11 - _0x13180f) <= 0.01;
  }
  ['_syncFromStore'](_0x30c11) {
    const _0x53b0a5 = appStore.getState(),
      _0x169d97 = Object.values(_0x53b0a5.edges || {})
        .filter((_0x39e06f) => _0x39e06f?.targetId === this.id)
        .sort((_0xf79aa4, _0xca266e) => {
          const _0x36733d = toNumber(_0xf79aa4?.createdAt, 0),
            _0x44963c = toNumber(_0xca266e?.createdAt, 0);
          if (_0x36733d !== _0x44963c) return _0x36733d - _0x44963c;
          return normalizeText(_0xf79aa4?.id).localeCompare(normalizeText(_0xca266e?.id));
        })
        .map((_0x346ef7) => {
          const _0x236ac3 = _0x53b0a5.nodes?.[_0x346ef7.sourceId];
          return _0x236ac3 ? { ..._0x236ac3, __mediaClipEdgeId: normalizeText(_0x346ef7?.id) } : null;
        })
        .filter(Boolean),
      _0x531bec = _0x169d97.filter((_0x4f007d) => {
        const _0x1944f9 = getMediaClipInputKind(_0x4f007d);
        return _0x1944f9 === 'video' || _0x1944f9 === 'image';
      }),
      _0x40d558 = _0x169d97.filter((_0x576c4b) => getMediaClipInputKind(_0x576c4b) === 'audio');
    this._sources = {
      video: _0x531bec[0] || null,
      videos: _0x531bec,
      audio: _0x40d558[0] || null,
      audios: _0x40d558,
    };
    const _0xa87bc6 = normalizeMediaClipState(_0x30c11, this._sources),
      _0x47edaf = this._timelineViewPersistTimer
        ? normalizeMediaClipTimelineView(this._timelineView)
        : normalizeMediaClipTimelineView(_0xa87bc6.timelineView),
      _0x51f3c5 = { ..._0xa87bc6, timelineView: _0x47edaf };
    ((this._timelineView = _0x47edaf),
      (this._timelineScrollLeft = _0x47edaf.scrollLeft),
      (this._mediaClip = _0x51f3c5),
      (this._activeClipIndex = this._clampVideoClipIndex(this._activeClipIndex)),
      (this._selectedClipIndex = this._clampSelectedClipIndex(this._selectedClipIndex)),
      (this._activeAudioClipIndex = this._clampAudioClipIndex(this._activeAudioClipIndex)),
      (this._selectedAudioClipIndex = this._clampSelectedAudioClipIndex(this._selectedAudioClipIndex)));
    const _0x555365 = !!(_0x51f3c5.tracks?.video || _0x51f3c5.tracks?.audio),
      _0x2c023d = this._compactLayoutSize(_0x51f3c5),
      _0x422349 = {};
    _0x555365 &&
      toNumber(_0x30c11?.width, _0x2c023d.width) !== _0x2c023d.width &&
      (_0x422349.width = _0x2c023d.width);
    _0x555365 &&
      toNumber(_0x30c11?.height, _0x2c023d.height) !== _0x2c023d.height &&
      (_0x422349.height = _0x2c023d.height);
    const _0x1651b5 = { ..._0x422349 };
    !isSameMediaClipState(_0x30c11?.mediaClip, _0x51f3c5) && (_0x1651b5.mediaClip = _0x51f3c5);
    if (Object.keys(_0x1651b5).length) appStore.updateNodeData(this.id, _0x1651b5);
    this.nodeData = { ...(_0x30c11 || {}), ..._0x422349, mediaClip: _0x51f3c5 };
    const _0x443788 =
      _0x51f3c5.tracks?.[_0x51f3c5.activeTrack] || _0x51f3c5.tracks?.video || _0x51f3c5.tracks?.audio;
    _0x443788 &&
      this._playheadSec <= 0 &&
      (this._playheadSec =
        _0x51f3c5.activeTrack === 'video'
          ? this._videoTimelineStart(_0x443788, _0x51f3c5.clips)
          : _0x443788.startSec);
  }
  ['_isPicking']() {
    const _0x53bf5e = appStore.getState()?.pickConnectMode || {};
    return _0x53bf5e.active === true && _0x53bf5e.sourceNodeId === this.id;
  }
  ['_normalizeMediaClipWithTimelineView'](_0x2b95e4 = {}) {
    const _0xb6412 = normalizeMediaClipTimelineView(_0x2b95e4.timelineView || this._timelineView);
    return (
      (this._timelineView = _0xb6412),
      (this._timelineScrollLeft = _0xb6412.scrollLeft),
      { ..._0x2b95e4, timelineView: _0xb6412 }
    );
  }
  ['_updateTimelineView'](_0x5924d7 = {}, _0xcd2ce9 = {}) {
    const _0x20f9a4 = normalizeMediaClipTimelineView({ ...this._timelineView, ..._0x5924d7 });
    return (
      (this._timelineView = _0x20f9a4),
      (this._timelineScrollLeft = _0x20f9a4.scrollLeft),
      (this._mediaClip = { ...this._mediaClip, timelineView: _0x20f9a4 }),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      _0xcd2ce9.persist === true &&
        this._scheduleTimelineViewPersist({ render: _0xcd2ce9.renderOnPersist !== false }),
      _0x20f9a4
    );
  }
  ['_persistTimelineView'](_0x10c30c = {}) {
    const _0x5df873 = normalizeMediaClipTimelineView(this._timelineView),
      _0xf9d1cf = { ...this._mediaClip, timelineView: _0x5df873 };
    ((this._timelineView = _0x5df873),
      (this._timelineScrollLeft = _0x5df873.scrollLeft),
      (this._mediaClip = _0xf9d1cf),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: _0xf9d1cf }));
    if (_0x10c30c.render === false) this._skipNextStoreMediaClipRender = true;
    appStore.updateNodeData(this.id, { mediaClip: _0xf9d1cf });
    if (_0x10c30c.render !== false) this._render();
  }
  ['_flushTimelineViewPersist'](_0x31efa4 = {}) {
    if (!this._timelineViewPersistTimer) return false;
    (clearTimeout(this._timelineViewPersistTimer), (this._timelineViewPersistTimer = 0));
    const _0x4902f7 =
      _0x31efa4.render === false ? false : _0x31efa4.render === true || this._timelineViewPersistRender;
    return (
      (this._timelineViewPersistRender = false),
      this._persistTimelineView({ render: _0x4902f7 }),
      true
    );
  }
  ['_scheduleTimelineViewPersist'](_0x394246 = {}) {
    if (this._timelineViewPersistTimer) clearTimeout(this._timelineViewPersistTimer);
    ((this._timelineViewPersistRender = this._timelineViewPersistRender || _0x394246.render !== false),
      (this._timelineViewPersistTimer = setTimeout(() => {
        const _0x3e58a8 = this._timelineViewPersistRender;
        ((this._timelineViewPersistTimer = 0),
          (this._timelineViewPersistRender = false),
          this._persistTimelineView({ render: _0x3e58a8 }));
      }, TIMELINE_VIEW_PERSIST_DELAY_MS)));
  }
  ['_setMediaClip'](_0x1cf3e8, _0x52479e = false, _0x172c27 = {}) {
    const _0x7e0fe7 = this._normalizeMediaClipWithTimelineView(_0x1cf3e8);
    ((this._mediaClip = _0x7e0fe7), (this.nodeData = { ...(this.nodeData || {}), mediaClip: _0x7e0fe7 }));
    if (_0x172c27.render === false) this._skipNextStoreMediaClipRender = true;
    appStore.updateNodeData(this.id, { mediaClip: _0x7e0fe7 });
    if (_0x52479e) commit();
    if (_0x172c27.render !== false) this._render();
  }
  ['_claimExpandedEditor']() {
    (activeExpandedMediaClipNode &&
      activeExpandedMediaClipNode !== this &&
      activeExpandedMediaClipNode._collapseFromPeer(),
      (activeExpandedMediaClipNode = this));
  }
  ['_releaseExpandedEditor']() {
    activeExpandedMediaClipNode === this && (activeExpandedMediaClipNode = null);
  }
  ['_collapseFromPeer']() {
    if (this._mediaClip.expanded !== true) return;
    this._setMediaClipWithLayout({ ...this._mediaClip, expanded: false }, false, { claimExpanded: false });
  }
  ['_prepareTimelineForCollapse']() {
    (this._stopTimelineDragAutoScroll(),
      this._cancelTimelineSettle(),
      this._flushTimelineViewPersist({ render: false }),
      (this._deferredTimelineDragNodeData = null));
  }
  ['_setMediaClipWithLayout'](_0x411d58, _0x10773d = false, _0x2c153d = {}) {
    if (_0x411d58.expanded === true && _0x2c153d.claimExpanded !== false) this._claimExpandedEditor();
    else
      _0x411d58.expanded !== true &&
        (this._prepareTimelineForCollapse(), this._releaseExpandedEditor(), this._disposePreviewMedia());
    const _0x3188f4 = this.nodeData || {},
      _0x4a8f72 = this._normalizeMediaClipWithTimelineView(_0x411d58),
      _0x17d979 = this._compactLayoutSize(_0x4a8f72),
      _0x4a53c8 = { width: _0x17d979.width, height: _0x17d979.height, mediaClip: _0x4a8f72 };
    ((this._mediaClip = _0x4a53c8.mediaClip), (this.nodeData = { ..._0x3188f4, ..._0x4a53c8 }));
    if (_0x2c153d.render === false) this._skipNextStoreMediaClipRender = true;
    appStore.updateNodeData(this.id, _0x4a53c8);
    if (_0x10773d) commit();
    if (_0x2c153d.render !== false) this._render();
  }
  ['_setActiveTrack'](_0x432937, _0xb87f71 = null, _0x335343 = {}) {
    const _0x2d026b = this._mediaClip.tracks?.[_0x432937];
    if (!_0x2d026b) return;
    this._pausePreviewPlayback({ updateControls: false });
    const _0x3f73dd = { ...this._mediaClip, activeTrack: _0x432937 };
    this._playheadSec = _0xb87f71 == null ? this._playheadSec : _0xb87f71;
    const _0x2a89e7 = this._mediaClip.activeTrack !== _0x432937;
    ((this._mediaClip = _0x3f73dd), (this.nodeData = { ...(this.nodeData || {}), mediaClip: _0x3f73dd }));
    _0x2a89e7 && appStore.updateNodeData(this.id, { mediaClip: _0x3f73dd });
    _0x2a89e7 || _0x335343.forceRender === true
      ? this._render()
      : this._updateTrackVisuals(_0x432937, { syncTimelineWidth: false });
    if (_0x432937 === 'video') this._syncVideoPreviewSourceForTimelineSec(this._playheadSec);
    else
      _0x432937 === 'audio' &&
        (this._setActiveAudioClipIndex(this._audioClipIndexAtTimelineSec(this._playheadSec)),
        this._syncAudioPreviewSourceForTimelineSec(this._playheadSec));
    this._syncPreviewTime(_0x432937, this._previewSourceSecForTimelineSec(_0x432937, this._playheadSec));
  }
  ['_togglePickConnect'](_0x34f7eb) {
    stopPointer(_0x34f7eb);
    const _0x161227 = this._isPicking();
    if (_0x161227) {
      appStore.setPickConnectMode({ active: false });
      return;
    }
    appStore.setPickConnectMode({ active: true, sourceNodeId: this.id, handleDirection: 'left' });
  }
  ['_setExpanded'](_0x526c46, _0x4422e2 = {}) {
    const _0x1a02f0 = { ...this._mediaClip, ..._0x4422e2, expanded: _0x526c46 === true };
    this._setMediaClipWithLayout(_0x1a02f0, true);
  }
  ['_splitActiveMaterial'](_0x44986a = this._getPlaybackKind()) {
    const _0x5e4c60 = _0x44986a === 'audio' ? 'audio' : 'video',
      _0x420b83 = this._mediaClip.tracks?.[_0x5e4c60];
    if (!_0x420b83) return;
    const _0x181b55 = this._playheadSec,
      _0x2931b1 =
        _0x5e4c60 === 'audio'
          ? splitMediaClipAudioAtTimelineSec(this._mediaClip, _0x181b55, generateId('split'))
          : splitMediaClipAtTimelineSec(this._mediaClip, _0x181b55, generateId('split'));
    if (isSameMediaClipState(_0x2931b1, this._mediaClip)) {
      window.showToast?.(mediaClipText('toasts.splitAtMiddle'));
      return;
    }
    if (_0x5e4c60 === 'audio') {
      const _0x4fc325 = this._audioClipIndexAtTimelineSec(_0x181b55 + 0.001, _0x2931b1.audioClips);
      ((this._activeAudioClipIndex = _0x4fc325), (this._selectedAudioClipIndex = _0x4fc325));
    } else {
      const _0x560d3b = this._clipIndexAtTimelineSec(_0x181b55 + 0.001, _0x2931b1.clips);
      ((this._activeClipIndex = _0x560d3b), (this._selectedClipIndex = _0x560d3b));
    }
    (this._pausePreviewPlayback({ updateControls: false }),
      this._setMediaClipWithLayout({ ..._0x2931b1, activeTrack: _0x5e4c60, expanded: true }, true, {
        render: false,
      }),
      this._rerenderCompactOnly(),
      _0x5e4c60 === 'audio'
        ? (this._syncAudioPreviewSourceForTimelineSec(_0x181b55),
          this._syncPreviewTime('audio', this._audioSourceSecForPlayhead(_0x181b55), { immediate: true }))
        : (this._syncVideoPreviewSourceForTimelineSec(_0x181b55),
          this._syncPreviewTime('video', this._videoSourceSecForPlayhead(_0x181b55), { immediate: true })),
      this._updatePreviewControls());
  }
  ['_splitActiveVideoClip']() {
    this._splitActiveMaterial('video');
  }
  ['_getPlaybackKind']() {
    const _0x5f491e = this._mediaClip.activeTrack;
    if (this._mediaClip.tracks?.[_0x5f491e]) return _0x5f491e;
    if (this._mediaClip.tracks?.video) return 'video';
    if (this._mediaClip.tracks?.audio) return 'audio';
    return '';
  }
  ['_getPlaybackTrack'](_0x17bca4 = this._getPlaybackKind()) {
    return _0x17bca4 ? this._mediaClip.tracks?.[_0x17bca4] || null : null;
  }
  ['_getVideoClipAtTimelineSec'](
    _0x1e7909 = this._playheadSec,
    _0x1d714d = this._videoTimelineClips(this._mediaClip.tracks?.video),
  ) {
    const _0x3be8f1 = Array.isArray(_0x1d714d) ? _0x1d714d : [];
    if (!_0x3be8f1.length) return null;
    return _0x3be8f1[this._clipIndexAtTimelineSec(_0x1e7909, _0x3be8f1)] || _0x3be8f1[0];
  }
  ['_videoTimelineStart'](
    _0x109672 = this._mediaClip.tracks?.video,
    _0x32973e = this._videoTimelineClips(_0x109672),
  ) {
    const _0x1bf52d = Array.isArray(_0x32973e) ? _0x32973e : [];
    if (_0x1bf52d.length)
      return _0x1bf52d.reduce(
        (_0x537da6, _0x13dd10) => Math.min(_0x537da6, toNumber(_0x13dd10.timelineStartSec, 0)),
        Number.POSITIVE_INFINITY,
      );
    return toNumber(_0x109672?.startSec, 0);
  }
  ['_timelineDisplayEnd'](_0x362e8e = this._getPlaybackKind()) {
    if (_0x362e8e === 'video') return this._videoTimelineBaseDuration(this._mediaClip.tracks?.video);
    const _0x199d86 = this._mediaClip.tracks?.[_0x362e8e];
    return toNumber(_0x199d86?.endSec || _0x199d86?.durationSec, 0);
  }
  ['_getPlaybackMedia'](_0x25972b = this._getPlaybackKind()) {
    return _0x25972b ? this._getPreviewMedia(_0x25972b) : null;
  }
  ['_isSecInsideTrack'](_0x8af9ce, _0x2efea5) {
    if (!_0x8af9ce) return false;
    const _0x4ff7c7 = toNumber(_0x2efea5, -1);
    return _0x4ff7c7 >= toNumber(_0x8af9ce.startSec, 0) && _0x4ff7c7 <= toNumber(_0x8af9ce.endSec, 0);
  }
  ['_cancelPlaybackLoop']() {
    const _0x302a52 = this._playbackRaf;
    if (!_0x302a52) return;
    try {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(_0x302a52);
    } catch {}
    try {
      clearTimeout(_0x302a52);
    } catch {}
    this._playbackRaf = 0;
  }
  ['_pausePreviewPlayback'](_0x4a170e = {}) {
    return pausePreviewPlayback(this, _0x4a170e);
  }
  ['_resetPlaybackClock'](_0x31d1ff = this._playheadSec) {
    return resetPlaybackClock(this, _0x31d1ff);
  }
  ['_playbackClockTimelineSec'](_0x20931a = this._playheadSec) {
    return playbackClockTimelineSec(this, _0x20931a);
  }
  async ['_preparePreviewMediaForPlayback'](_0x1c8a1c, _0x135f1b = null) {
    return preparePreviewMediaForPlayback(this, _0x1c8a1c, _0x135f1b);
  }
  ['_togglePreviewPlayback'](_0x3bb96e) {
    return togglePreviewPlayback(this, _0x3bb96e);
  }
  async ['_playPreview']() {
    return playPreview(this);
  }
  async ['_playReplacementAudioFromVideo'](_0x4a463c) {
    return playReplacementAudioFromVideo(this, _0x4a463c);
  }
  ['_syncReplacementAudioFromVideo'](_0x209532, _0x38bc61 = {}) {
    return syncReplacementAudioFromVideo(this, _0x209532, _0x38bc61);
  }
  ['_startPlaybackLoop'](_0x358b89) {
    return startPlaybackLoop(this, _0x358b89);
  }
  ['_setPreviewPlayIcon'](_0x288cba = this._previewPlayButton) {
    return setPreviewPlayIcon(this, _0x288cba);
  }
  ['_updatePreviewControls']() {
    return updatePreviewControls(this);
  }
  ['_getPreviewMedia'](_0x438d2b) {
    return _0x438d2b === 'audio' ? this._audioPreview : this._videoPreview;
  }
  ['_visualClipKind'](_0x2dd569 = null, _0x16b22c = null) {
    const _0x431cad = normalizeText(_0x2dd569?.kind);
    if (_0x431cad === 'image') return 'image';
    const _0x1dd41d = getMediaClipInputKind(_0x16b22c || {});
    return _0x1dd41d === 'image' ? 'image' : 'video';
  }
  ['_getVisualClipContextAtTimelineSec'](_0x4929d8 = this._playheadSec, _0x10e586 = null) {
    const _0x23f3d5 = Array.isArray(_0x10e586)
        ? _0x10e586
        : this._videoTimelineClips(this._mediaClip.tracks?.video),
      _0xb04008 = this._clipIndexAtTimelineSec(_0x4929d8, _0x23f3d5),
      _0xfc30c4 = _0x23f3d5[_0xb04008] || this._getVideoClipAtTimelineSec(_0x4929d8, _0x23f3d5),
      _0x2686a5 = _0xfc30c4 ? this._videoClipSource(_0xfc30c4, _0xb04008) : this._sources.video,
      _0x355753 = this._visualClipKind(_0xfc30c4, _0x2686a5);
    return { clip: _0xfc30c4, index: _0xb04008, source: _0x2686a5, clipKind: _0x355753 };
  }
  ['_resolveVideoPreviewSeekTarget']() {
    const _0xa6ad9c = toNumber(this._pendingPreviewSeek?.video, Number.NaN);
    if (Number.isFinite(_0xa6ad9c)) return Math.max(0, _0xa6ad9c);
    return this._videoSourceSecForPlayhead(this._playheadSec || 0);
  }
  ['_getVideoPreviewContextAtTimelineSec'](_0x50e778 = this._playheadSec, _0x500edf = null) {
    const _0x50ecd8 = this._getVisualClipContextAtTimelineSec(_0x50e778, _0x500edf),
      { clip: _0x1be280, index: _0x1b22f7, source: _0x253982, clipKind: _0x191c76 } = _0x50ecd8,
      _0x1db9dc =
        _0x191c76 === 'image' ? resolveMediaClipImageUrl(_0x253982) : resolveMediaClipVideoUrl(_0x253982);
    return {
      clip: _0x1be280,
      index: _0x1b22f7,
      clipKind: _0x191c76,
      source: _0x253982,
      url: _0x1db9dc,
      posterUrl: resolveMediaClipThumbUrl(_0x253982),
      sourceSec: _0x1be280 ? this._videoSourceSecForTimelineSec(_0x50e778, _0x500edf) : _0x50e778,
    };
  }
  ['_syncVideoPreviewSourceForTimelineSec'](_0x44d758 = this._playheadSec, _0x367daf = {}) {
    const _0x2927d8 = this._videoPreview,
      _0x92e826 = this._getVideoPreviewContextAtTimelineSec(_0x44d758, _0x367daf.clips);
    if (!_0x92e826.url) return false;
    if (_0x92e826.clipKind === 'image')
      return (this._showPreviewImage(_0x92e826.source, _0x92e826.url), true);
    if (!_0x2927d8) return false;
    (this._showPreviewVideo(_0x92e826.source),
      (_0x2927d8.__mediaClipFallbackHost ??= _0x2927d8.parentElement || null),
      (_0x2927d8.__mediaClipPosterUrl = _0x92e826.posterUrl));
    if (_0x92e826.posterUrl) _0x2927d8.poster = _0x92e826.posterUrl;
    else _0x2927d8.removeAttribute?.('poster');
    this._applyPreviewVideoLayout(_0x2927d8.parentElement, _0x92e826.source);
    const _0x23a3f9 = this._normalizePreviewSourceIdentity(
        firstNonEmpty(
          _0x2927d8.dataset?.desktopMediaSourceUrl,
          _0x2927d8.dataset?.mediaClipSourceUrl,
          _0x2927d8.getAttribute?.('src'),
          _0x2927d8.currentSrc,
          _0x2927d8.src,
        ),
      ),
      _0xb0f11e = this._normalizePreviewSourceIdentity(_0x92e826.url);
    _0xb0f11e &&
      _0x23a3f9 !== _0xb0f11e &&
      (this._showVideoSourceSwitchHold(_0x2927d8), _0x2927d8.classList?.add('is-source-switching'));
    const _0x51ebe2 = setMediaElementSource(_0x2927d8, _0x92e826.url);
    if (_0x51ebe2)
      (this._cancelPendingVideoSourceSeek(_0x2927d8, { clearHold: false }),
        this._resetPreviewSeekState('video'),
        (_0x2927d8.__mediaClipPendingSourceSeek = {
          src: normalizeText(_0x92e826.url),
          sec: Math.max(0, toNumber(_0x92e826.sourceSec, 0)),
        }),
        _0x2927d8.classList?.add('is-source-switching'));
    else {
      const _0x8aaadc = this._normalizePreviewSourceIdentity(_0x2927d8.__mediaClipPendingSourceSeek?.src);
      if (_0x8aaadc && _0x8aaadc === _0xb0f11e)
        ((_0x2927d8.__mediaClipPendingSourceSeek.sec = Math.max(0, toNumber(_0x92e826.sourceSec, 0))),
          _0x2927d8.classList?.add('is-source-switching'));
      else !_0x2927d8.__mediaClipWaitingSourceSeek && this._clearVideoSourceSwitchHold(_0x2927d8);
    }
    return ((this._previewVideoSrc = _0x92e826.url), _0x51ebe2);
  }
  ['_getAudioClipContextAtTimelineSec'](_0x482be0 = this._playheadSec, _0x3a0b21 = {}) {
    const _0x406f25 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
      _0xf07d1a = _0x406f25
        .map((_0x30778a, _0x1f5444) => ({ clip: _0x30778a, index: _0x1f5444 }))
        .filter(({ clip: _0x1cf054 }) =>
          _0x3a0b21.audibleOnly === true ? _0x1cf054?.muted !== true && _0x1cf054?.disabled !== true : true,
        ),
      _0x1f136f = toNumber(_0x482be0, 0),
      _0x2926cd = _0xf07d1a.findIndex(({ clip: _0x679eba }, _0x250e2c) => {
        const _0x5743a4 = toNumber(_0x679eba.timelineStartSec, 0),
          _0x2dc236 = Math.max(_0x5743a4, toNumber(_0x679eba.timelineEndSec, _0x5743a4));
        return _0x250e2c === _0xf07d1a.length - 1
          ? _0x1f136f >= _0x5743a4 && _0x1f136f <= _0x2dc236
          : _0x1f136f >= _0x5743a4 && _0x1f136f < _0x2dc236;
      }),
      _0x421cb9 =
        _0x2926cd >= 0 || _0x3a0b21.nearest === false
          ? _0x2926cd
          : this._audioClipIndexAtTimelineSec(
              _0x482be0,
              _0xf07d1a.map(({ clip: _0x59caa6 }) => _0x59caa6),
            ),
      _0x440322 = _0x3a0b21.nearest === false ? null : _0xf07d1a[0] || null,
      _0x22cb15 = _0x421cb9 >= 0 ? _0xf07d1a[_0x421cb9] || null : _0x440322,
      _0x2d44f = _0x22cb15?.clip || null,
      _0x33ac85 = _0x22cb15?.index ?? -1,
      _0x2ca3e8 = _0x2d44f
        ? this._audioClipSource(_0x2d44f, _0x33ac85)
        : _0x3a0b21.nearest === false
          ? null
          : this._sources.audio;
    return {
      clip: _0x2d44f,
      index: _0x33ac85,
      source: _0x2ca3e8,
      url: resolveMediaClipAudioUrl(_0x2ca3e8),
      sourceSec: _0x2d44f ? this._audioClipSourceSec(_0x2d44f, _0x482be0) : _0x482be0,
    };
  }
  ['_syncAudioPreviewSourceForTimelineSec'](_0x541c4b = this._playheadSec) {
    const _0x2a07dc = this._audioPreview;
    if (!_0x2a07dc) return false;
    this._videoPreview && this._mediaClip.tracks?.audio && (this._videoPreview.muted = true);
    const _0x314a0d = this._getAudioClipContextAtTimelineSec(_0x541c4b, {
      audibleOnly: true,
      nearest: false,
    });
    if (!_0x314a0d.url) return (setMediaElementSource(_0x2a07dc, ''), (this._previewAudioSrc = ''), false);
    const _0x38276c = setMediaElementSource(_0x2a07dc, _0x314a0d.url);
    if (_0x38276c) this._resetPreviewSeekState('audio');
    return ((this._previewAudioSrc = _0x314a0d.url), _0x38276c);
  }
  ['_createPreviewSeekState'](_0x199cc9 = {}) {
    return { lastAppliedSec: null, ..._0x199cc9 };
  }
  ['_getPreviewSeekState'](_0x3f835) {
    if (!this._previewSeekState) this._previewSeekState = {};
    return (
      !this._previewSeekState[_0x3f835] &&
        (this._previewSeekState[_0x3f835] = this._createPreviewSeekState()),
      this._previewSeekState[_0x3f835]
    );
  }
  ['_resetPreviewSeekState'](_0x2185c1 = '') {
    const _0x202ce6 = _0x2185c1 ? [_0x2185c1] : ['video', 'audio'];
    if (!this._previewSeekState) this._previewSeekState = {};
    _0x202ce6.forEach((_0xfe9c31) => {
      (this._cancelPreviewSeek(_0xfe9c31),
        (this._previewSeekState[_0xfe9c31] = this._createPreviewSeekState()));
    });
  }
  ['_cancelPreviewSeek'](_0x855cc) {
    const _0xe55f7e = this._previewSeekRaf?.[_0x855cc];
    if (!_0xe55f7e) return;
    try {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(_0xe55f7e);
    } catch {}
    try {
      clearTimeout(_0xe55f7e);
    } catch {}
    this._previewSeekRaf[_0x855cc] = 0;
  }
  ['_disposePreviewMedia'](_0x161206 = '') {
    (!_0x161206 || _0x161206 === this._getPlaybackKind()) &&
      this._pausePreviewPlayback({ updateControls: false });
    const _0xb18132 = !_0x161206 || _0x161206 === 'video',
      _0x18737c = !_0x161206 || _0x161206 === 'video' || _0x161206 === 'image',
      _0x54ec46 = !_0x161206 || _0x161206 === 'audio';
    _0xb18132 &&
      (this._resetPreviewSeekState('video'),
      this._clearVideoSourceSwitchHold(this._videoPreview),
      disposeMediaElement(this._videoPreview),
      this._videoPreview?.remove?.(),
      (this._videoPreview = null),
      (this._previewVideoSrc = ''));
    if (_0x18737c) {
      (this._imagePreview?.remove?.(), (this._imagePreview = null));
      if (this._previewVisualKind === 'image') this._previewVisualKind = '';
    }
    _0x54ec46 &&
      (this._resetPreviewSeekState('audio'),
      disposeMediaElement(this._audioPreview),
      this._audioPreview?.remove?.(),
      (this._audioPreview = null),
      (this._previewAudioSrc = ''));
  }
  ['_schedulePreviewSeek'](_0x33ca64, _0x41e6e7 = {}) {
    if (this._previewSeekRaf[_0x33ca64]) return;
    const _0x4b8d67 =
      typeof requestAnimationFrame === 'function'
        ? (_0x382796) => requestAnimationFrame(_0x382796)
        : (_0x1cdbd0) => setTimeout(_0x1cdbd0, 16);
    this._previewSeekRaf[_0x33ca64] = _0x4b8d67(() => {
      ((this._previewSeekRaf[_0x33ca64] = 0), this._applyPreviewSeek(_0x33ca64, _0x41e6e7));
    });
  }
  ['_applyPreviewSeek'](_0x178a1f, _0x3f8bc1 = {}) {
    if (_0x178a1f === 'video' && this._previewVisualKind === 'image') {
      this._updatePreviewControls();
      return;
    }
    const _0x158f69 = _0x3f8bc1.immediate === true || _0x3f8bc1.allowDuringPlayback === true;
    if ((this._playing || this._playPreviewPending) && !_0x158f69) {
      ((this._pendingPreviewSeek[_0x178a1f] = null), this._updatePreviewControls());
      return;
    }
    const _0x4c3c0c = this._getPreviewMedia(_0x178a1f),
      _0x5bba41 = Math.max(0, toNumber(this._pendingPreviewSeek[_0x178a1f], 0));
    if (!_0x4c3c0c) return;
    if (_0x4c3c0c.readyState < 1) {
      !_0x4c3c0c.__mediaClipSeekPending &&
        ((_0x4c3c0c.__mediaClipSeekPending = true),
        _0x4c3c0c.addEventListener(
          'loadedmetadata',
          () => {
            ((_0x4c3c0c.__mediaClipSeekPending = false), this._applyPreviewSeek(_0x178a1f, _0x3f8bc1));
          },
          { once: true },
        ));
      return;
    }
    const _0x3d5720 = this._getPreviewSeekState(_0x178a1f),
      _0x175278 = _0x3f8bc1.immediate === true,
      _0x15a78d =
        Number.isFinite(_0x4c3c0c.duration) && _0x4c3c0c.duration > 0
          ? Math.min(_0x5bba41, _0x4c3c0c.duration)
          : _0x5bba41,
      _0x5216aa = toNumber(_0x4c3c0c.currentTime, _0x15a78d),
      _0x230378 = toNumber(_0x3d5720.lastAppliedSec, Number.NaN);
    if (
      !_0x175278 &&
      (Math.abs(_0x5216aa - _0x15a78d) < PREVIEW_SCRUB_SEEK_EPSILON_SEC ||
        (Number.isFinite(_0x230378) && Math.abs(_0x15a78d - _0x230378) < PREVIEW_SCRUB_SEEK_EPSILON_SEC))
    ) {
      this._updatePreviewControls();
      return;
    }
    try {
      ((_0x4c3c0c.currentTime = _0x15a78d), (_0x3d5720.lastAppliedSec = _0x15a78d));
    } catch {}
    this._updatePreviewControls();
  }
  ['_syncPreviewTime'](_0x54e56a, _0x728d41, _0x442be5 = {}) {
    const _0x5c875d = _0x442be5.immediate === true || _0x442be5.allowDuringPlayback === true;
    if ((this._playing || this._playPreviewPending) && !_0x5c875d) return;
    const _0x27ef5f = Math.max(0, toNumber(_0x728d41, 0));
    this._pendingPreviewSeek[_0x54e56a] = _0x27ef5f;
    if (_0x54e56a === 'video' && this._previewVisualKind === 'image') {
      this._updatePreviewControls();
      return;
    }
    if (!this._getPreviewMedia(_0x54e56a)) return;
    if (_0x442be5.immediate === true) {
      (this._cancelPreviewSeek(_0x54e56a), this._applyPreviewSeek(_0x54e56a, { immediate: true }));
      return;
    }
    this._schedulePreviewSeek(_0x54e56a, _0x442be5);
  }
  ['_applyPendingVideoSourceSeek'](_0x5cbf5b = this._videoPreview) {
    const _0x123a2e = _0x5cbf5b?.__mediaClipPendingSourceSeek;
    if (!_0x123a2e || typeof _0x123a2e !== 'object') return false;
    const _0x4309e5 = normalizeText(_0x123a2e.src),
      _0x3dc60a = this._normalizePreviewSourceIdentity(
        firstNonEmpty(
          _0x5cbf5b.dataset?.desktopMediaSourceUrl,
          _0x5cbf5b.getAttribute?.('src'),
          _0x5cbf5b.currentSrc,
          _0x5cbf5b.src,
        ),
      ),
      _0x3a5bc3 = this._normalizePreviewSourceIdentity(_0x4309e5);
    if (_0x3a5bc3 && _0x3dc60a !== _0x3a5bc3) return false;
    delete _0x5cbf5b.__mediaClipPendingSourceSeek;
    const _0x356204 = toNumber(_0x123a2e.sec, Number.NaN);
    if (!Number.isFinite(_0x356204)) return false;
    return (
      this._syncPreviewTime('video', Math.max(0, _0x356204), { immediate: true }),
      this._waitForPendingVideoSourceSeek(_0x5cbf5b, _0x356204),
      true
    );
  }
  ['_normalizePreviewSourceIdentity'](_0x3691b7) {
    const _0x3e029d = normalizeText(_0x3691b7);
    if (!_0x3e029d) return '';
    try {
      return new URL(_0x3e029d, globalThis.location?.href || 'http://127.0.0.1/').href;
    } catch {
      return _0x3e029d;
    }
  }
  ['_showVideoSourceSwitchHold'](_0xdd7f23 = this._videoPreview) {
    const _0x34b638 = _0xdd7f23?.parentElement;
    if (!_0x34b638 || !_0xdd7f23) return false;
    this._clearVideoSourceSwitchHold(_0xdd7f23);
    const _0x1c19d0 = document.createElement('canvas');
    _0x1c19d0.className = 'media-clip-source-switch-hold';
    const _0x187830 = _0xdd7f23.getBoundingClientRect?.() || _0x34b638.getBoundingClientRect?.() || {},
      _0x2d017e = Math.max(
        1,
        Math.round(toNumber(_0xdd7f23.videoWidth, 0) || toNumber(_0x187830.width, 0) || 1),
      ),
      _0x43f4c3 = Math.max(
        1,
        Math.round(toNumber(_0xdd7f23.videoHeight, 0) || toNumber(_0x187830.height, 0) || 1),
      );
    ((_0x1c19d0.width = _0x2d017e), (_0x1c19d0.height = _0x43f4c3));
    let _0x1c5c5a = false;
    try {
      const _0x36824f = _0x1c19d0.getContext?.('2d');
      _0x36824f && (_0x36824f.drawImage(_0xdd7f23, 0, 0, _0x2d017e, _0x43f4c3), (_0x1c5c5a = true));
    } catch {}
    return (
      _0x1c5c5a &&
        (_0x34b638.appendChild(_0x1c19d0),
        (_0xdd7f23.__mediaClipSourceSwitchHold = _0x1c19d0),
        (this._videoSourceSwitchHold = _0x1c19d0)),
      _0x1c5c5a
    );
  }
  ['_clearVideoSourceSwitchHold'](_0x455f48 = this._videoPreview) {
    const _0x472397 = _0x455f48?.__mediaClipSourceSwitchHold || this._videoSourceSwitchHold || null;
    (_0x472397?.remove?.(),
      _0x455f48 &&
        _0x472397 &&
        _0x455f48.__mediaClipSourceSwitchHold === _0x472397 &&
        delete _0x455f48.__mediaClipSourceSwitchHold,
      _0x472397 && this._videoSourceSwitchHold === _0x472397 && (this._videoSourceSwitchHold = null),
      _0x455f48?.classList?.remove('is-source-switching'));
  }
  ['_cancelPendingVideoSourceSeek'](_0x2b13c1 = this._videoPreview, _0x35eee0 = {}) {
    if (!_0x2b13c1) return;
    const _0x5e98b6 = _0x2b13c1.__mediaClipSourceSeekFinish;
    if (_0x5e98b6)
      try {
        _0x2b13c1.removeEventListener?.('seeked', _0x5e98b6);
      } catch {}
    const _0x17a271 = _0x2b13c1.__mediaClipSourceSeekFallbackTimer;
    if (_0x17a271)
      try {
        clearTimeout(_0x17a271);
      } catch {}
    (delete _0x2b13c1.__mediaClipWaitingSourceSeek,
      delete _0x2b13c1.__mediaClipSourceSeekFinish,
      delete _0x2b13c1.__mediaClipSourceSeekFallbackTimer,
      delete _0x2b13c1.__mediaClipSourceSeekTargetSec,
      delete _0x2b13c1.__mediaClipSourceSeekToken);
    if (_0x35eee0.clearHold !== false) this._clearVideoSourceSwitchHold(_0x2b13c1);
  }
  ['_waitForPendingVideoSourceSeek'](_0x1fdffe = this._videoPreview, _0x2f0f9b = 0) {
    if (!_0x1fdffe) return;
    const _0x94af50 = Math.max(0, toNumber(_0x2f0f9b, 0));
    _0x1fdffe.__mediaClipSourceSeekTargetSec = _0x94af50;
    if (_0x94af50 <= PREVIEW_SCRUB_SEEK_EPSILON_SEC) {
      this._finishPendingVideoSourceSeek(_0x1fdffe);
      return;
    }
    if (!_0x1fdffe.__mediaClipWaitingSourceSeek) {
      _0x1fdffe.__mediaClipWaitingSourceSeek = true;
      const _0x12043f = () => this._finishPendingVideoSourceSeek(_0x1fdffe);
      ((_0x1fdffe.__mediaClipSourceSeekFinish = _0x12043f),
        _0x1fdffe.addEventListener?.('seeked', _0x12043f, { once: true }));
    }
    const _0x4f9985 = _0x1fdffe.__mediaClipSourceSeekFallbackTimer;
    if (_0x4f9985)
      try {
        clearTimeout(_0x4f9985);
      } catch {}
    if (typeof setTimeout === 'function') {
      const _0x484b06 = toNumber(_0x1fdffe.__mediaClipSourceSeekToken, 0) + 1;
      ((_0x1fdffe.__mediaClipSourceSeekToken = _0x484b06),
        (_0x1fdffe.__mediaClipSourceSeekFallbackTimer = setTimeout(() => {
          if (_0x1fdffe.__mediaClipSourceSeekToken !== _0x484b06) return;
          this._finishPendingVideoSourceSeek(_0x1fdffe);
        }, 250)));
    }
  }
  ['_finishPendingVideoSourceSeek'](_0x3d5f8d = this._videoPreview) {
    if (
      !_0x3d5f8d?.__mediaClipWaitingSourceSeek &&
      !_0x3d5f8d?.__mediaClipSourceSwitchHold &&
      !_0x3d5f8d?.classList?.contains?.('is-source-switching')
    )
      return;
    const _0x446eaa = _0x3d5f8d.__mediaClipSourceSeekFinish;
    if (_0x446eaa)
      try {
        _0x3d5f8d.removeEventListener?.('seeked', _0x446eaa);
      } catch {}
    const _0x1b5af6 = _0x3d5f8d.__mediaClipSourceSeekFallbackTimer;
    if (_0x1b5af6)
      try {
        clearTimeout(_0x1b5af6);
      } catch {}
    (delete _0x3d5f8d.__mediaClipWaitingSourceSeek,
      delete _0x3d5f8d.__mediaClipSourceSeekFinish,
      delete _0x3d5f8d.__mediaClipSourceSeekFallbackTimer,
      delete _0x3d5f8d.__mediaClipSourceSeekTargetSec,
      delete _0x3d5f8d.__mediaClipSourceSeekToken,
      this._clearVideoSourceSwitchHold(_0x3d5f8d));
    if (this._playing)
      try {
        _0x3d5f8d.play?.()?.catch?.(() => {});
      } catch {}
    this._updatePreviewControls();
  }
  ['_render']() {
    if (!this.el) return;
    this._removeMaterialMenuPortal();
    const _0x335a65 = !!(this._mediaClip.tracks?.video || this._mediaClip.tracks?.audio),
      _0x3934d0 = _0x335a65 && this._mediaClip.expanded === true;
    _0x3934d0
      ? this._claimExpandedEditor()
      : ((this._materialMenu = null), this._releaseExpandedEditor(), this._disposePreviewMedia());
    (this.el.replaceChildren(),
      this.el.classList.toggle('is-picking', this._isPicking()),
      this.el.classList.toggle('is-expanded', _0x3934d0),
      this._syncHostPresentation(_0x3934d0),
      this._syncDocumentExitListener(_0x3934d0),
      this._syncMaterialMenuDismissListener(_0x3934d0 && !!this._materialMenu),
      this._syncDocumentKeyListener(_0x3934d0),
      this._syncDeleteMaterialShortcutListener(_0x3934d0));
    if (!_0x335a65) {
      this.el.appendChild(this._renderEmpty());
      return;
    }
    (_0x3934d0
      ? this.el.append(this._renderCompact(), this._renderPreviewPanel())
      : this.el.appendChild(this._renderCompact()),
      _0x3934d0 && this._materialMenu && this._renderMaterialMenuPortal(),
      this._exporting && this._startExportLoading());
  }
  ['_rerenderCompactOnly']() {
    if (!this.el) return false;
    const _0x324a7a = this.el.querySelector?.('.media-clip-compact'),
      _0x474386 = _0x324a7a?.parentNode;
    if (!_0x324a7a || !_0x474386) return (this._render(), false);
    this._removeMaterialMenuPortal();
    const _0x3701f7 = this._renderCompact();
    if (typeof _0x474386.replaceChild === 'function') _0x474386.replaceChild(_0x3701f7, _0x324a7a);
    else {
      if (Array.isArray(_0x474386.children)) {
        const _0x893aa8 = _0x474386.children.indexOf(_0x324a7a);
        _0x893aa8 >= 0 &&
          ((_0x3701f7.parentNode = _0x474386),
          (_0x324a7a.parentNode = null),
          _0x474386.children.splice(_0x893aa8, 1, _0x3701f7));
      }
    }
    const _0x43cd2b = !!(this._mediaClip.tracks?.video || this._mediaClip.tracks?.audio),
      _0xc38b22 = _0x43cd2b && this._mediaClip.expanded === true;
    return (
      this._syncDocumentExitListener(_0xc38b22),
      this._syncMaterialMenuDismissListener(_0xc38b22 && !!this._materialMenu),
      this._syncDocumentKeyListener(_0xc38b22),
      this._syncDeleteMaterialShortcutListener(_0xc38b22),
      _0xc38b22 && this._materialMenu && this._renderMaterialMenuPortal(),
      true
    );
  }
  ['_syncHostPresentation'](_0x28383a) {
    const _0x87efb6 = () => {
      const _0x98921 = this.el?.closest?.('.v2-node-component') || this.el?.parentElement;
      _0x98921?.style && (_0x98921.style.overflow = 'visible');
      const _0x5898e1 = document.getElementById(this.id);
      if (!_0x5898e1?.style) return;
      _0x5898e1.classList.toggle('media-clip-expanded-host', _0x28383a === true);
      if (_0x28383a === true) {
        _0x5898e1.style.zIndex = MEDIA_CLIP_EXPANDED_HOST_Z_INDEX;
        return;
      }
      _0x5898e1.style.zIndex =
        _0x5898e1.classList.contains('selected') || _0x5898e1.classList.contains('v2-selected')
          ? '100'
          : '10';
    };
    (_0x87efb6(),
      !this.el?.parentElement &&
        typeof requestAnimationFrame === 'function' &&
        requestAnimationFrame(_0x87efb6));
  }
  ['_syncDocumentExitListener'](_0x1d86b9) {
    if (typeof document === 'undefined') return;
    if (!_0x1d86b9) {
      this._onDocumentPointerDown &&
        (document.removeEventListener('pointerdown', this._onDocumentPointerDown, true),
        (this._onDocumentPointerDown = null));
      return;
    }
    if (this._onDocumentPointerDown) return;
    ((this._onDocumentPointerDown = (_0x50324f) => {
      if (this._mediaClip.expanded !== true) return;
      const _0x55ebc1 = document.getElementById(this.id);
      if (this.el?.contains?.(_0x50324f.target)) return;
      if (this._materialMenuEl?.contains?.(_0x50324f.target)) return;
      if (_0x55ebc1?.contains?.(_0x50324f.target)) {
        (_0x50324f.preventDefault?.(), _0x50324f.stopPropagation?.());
        return;
      }
      this._setExpanded(false);
    }),
      document.addEventListener('pointerdown', this._onDocumentPointerDown, true));
  }
  ['_syncMaterialMenuDismissListener'](_0x52dcf1) {
    if (typeof document === 'undefined') return;
    if (!_0x52dcf1) {
      this._onMaterialMenuPointerDown &&
        (document.removeEventListener('pointerdown', this._onMaterialMenuPointerDown, true),
        (this._onMaterialMenuPointerDown = null));
      return;
    }
    if (this._onMaterialMenuPointerDown) return;
    ((this._onMaterialMenuPointerDown = (_0xa44d3) => {
      if (!this._materialMenu) return;
      if (_0xa44d3?.button === 2) return;
      if (this._materialMenuEl?.contains?.(_0xa44d3.target)) return;
      this._closeMaterialMenu();
    }),
      document.addEventListener('pointerdown', this._onMaterialMenuPointerDown, true));
  }
  ['_removeMaterialMenuPortal']() {
    (this._materialMenuEl?.parentNode?.removeChild?.(this._materialMenuEl), (this._materialMenuEl = null));
  }
  ['_closeMaterialMenu'](_0x5ddd6b = {}) {
    if (!this._materialMenu && !this._materialMenuEl) return;
    ((this._materialMenu = null),
      this._syncMaterialMenuDismissListener(false),
      this._removeMaterialMenuPortal());
    if (_0x5ddd6b.render === true) this._render();
  }
  ['_materialMenuHost']() {
    return (
      this.el?.querySelector?.('.media-clip-compact.is-editing') ||
      this.el?.querySelector?.('.media-clip-compact') ||
      this.el ||
      null
    );
  }
  ['_materialMenuLocalPoint'](_0x13f6ac, _0x10d1f9, _0x8e91d7 = this._materialMenuHost()) {
    const _0x2b895e = _0x8e91d7?.getBoundingClientRect?.() || { left: 0, top: 0, width: 0, height: 0 },
      _0x29169c = readLayoutWidthPx(_0x8e91d7, _0x2b895e.width || 1),
      _0x255c95 =
        toNumber(_0x8e91d7?.offsetHeight, 0) ||
        parseFloat(_0x8e91d7?.style?.getPropertyValue?.('height')) ||
        _0x2b895e.height ||
        1,
      _0x4d8cc5 = _0x2b895e.width > 0 && _0x29169c > 0 ? _0x2b895e.width / _0x29169c : 1,
      _0x334e2c = _0x2b895e.height > 0 && _0x255c95 > 0 ? _0x2b895e.height / _0x255c95 : _0x4d8cc5;
    return {
      x: (toNumber(_0x13f6ac, _0x2b895e.left) - toNumber(_0x2b895e.left, 0)) / (_0x4d8cc5 || 1),
      y: (toNumber(_0x10d1f9, _0x2b895e.top) - toNumber(_0x2b895e.top, 0)) / (_0x334e2c || 1),
    };
  }
  ['_renderMaterialMenuPortal']() {
    if (typeof document === 'undefined' || !this._materialMenu) return;
    const _0x466394 = this._materialMenuHost();
    if (!_0x466394) return;
    const _0x1f58dc = this._renderMaterialMenu();
    ((this._materialMenuEl = _0x1f58dc),
      _0x466394.appendChild(_0x1f58dc),
      this._positionMaterialMenu(_0x1f58dc, _0x466394));
  }
  ['_positionMaterialMenu'](_0x534b92, _0x53315a = this._materialMenuHost()) {
    if (!_0x534b92) return;
    const _0x31eb81 = this._materialMenu || {},
      _0x4f67af = 8,
      _0x2832c7 = toNumber(_0x31eb81.x ?? _0x31eb81.left, _0x4f67af),
      _0x5590db = toNumber(_0x31eb81.y ?? _0x31eb81.top, _0x4f67af),
      _0x6588c5 = _0x53315a?.getBoundingClientRect?.() || { left: 0, top: 0, width: 0, height: 0 },
      _0x529706 = readLayoutWidthPx(_0x53315a, _0x6588c5.width || 1),
      _0x56136f =
        toNumber(_0x53315a?.offsetHeight, 0) ||
        parseFloat(_0x53315a?.style?.getPropertyValue?.('height')) ||
        _0x6588c5.height ||
        1,
      _0xf8b606 = _0x6588c5.width > 0 && _0x529706 > 0 ? _0x6588c5.width / _0x529706 : 1,
      _0xeebc37 = _0x6588c5.height > 0 && _0x56136f > 0 ? _0x6588c5.height / _0x56136f : _0xf8b606,
      _0x14a073 = toNumber(_0x534b92.offsetWidth, 0),
      _0x3d899d = toNumber(_0x534b92.offsetHeight, 0),
      _0x34135f = typeof window !== 'undefined' ? toNumber(window.innerWidth, 0) : 0,
      _0x3a8169 = typeof window !== 'undefined' ? toNumber(window.innerHeight, 0) : 0,
      _0x4d7f50 =
        _0x34135f > 0 && _0xf8b606 > 0
          ? Math.max(_0x4f67af, (_0x34135f - _0x6588c5.left) / _0xf8b606 - _0x14a073 - _0x4f67af)
          : _0x2832c7,
      _0x5eedbc =
        _0x3a8169 > 0 && _0xeebc37 > 0
          ? Math.max(_0x4f67af, (_0x3a8169 - _0x6588c5.top) / _0xeebc37 - _0x3d899d - _0x4f67af)
          : _0x5590db;
    ((_0x534b92.style.left = Math.min(_0x4d7f50, Math.max(_0x4f67af, _0x2832c7)) + 'px'),
      (_0x534b92.style.top = Math.min(_0x5eedbc, Math.max(_0x4f67af, _0x5590db)) + 'px'));
  }
  ['_isEditableEventTarget'](_0x3e8eb3) {
    return !!_0x3e8eb3?.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]');
  }
  ['_syncDocumentKeyListener'](_0x153391) {
    if (typeof document === 'undefined') return;
    if (!_0x153391) {
      this._onDocumentKeyDown &&
        (document.removeEventListener('keydown', this._onDocumentKeyDown, true),
        (this._onDocumentKeyDown = null));
      return;
    }
    if (this._onDocumentKeyDown) return;
    ((this._onDocumentKeyDown = (_0x34b773) => this._handleDocumentKeyDown(_0x34b773)),
      document.addEventListener('keydown', this._onDocumentKeyDown, true));
  }
  ['_syncDeleteMaterialShortcutListener'](_0x53fb65) {
    if (typeof window === 'undefined') return;
    if (!_0x53fb65) {
      this._onDeleteMaterialShortcut &&
        (window.removeEventListener(MEDIA_CLIP_DELETE_MATERIAL_EVENT, this._onDeleteMaterialShortcut),
        (this._onDeleteMaterialShortcut = null));
      return;
    }
    if (this._onDeleteMaterialShortcut) return;
    ((this._onDeleteMaterialShortcut = (_0x4fc72c) => {
      const _0x31a7c5 = normalizeText(_0x4fc72c?.detail?.nodeId);
      if (_0x31a7c5 && _0x31a7c5 !== this.id) return;
      if (this._mediaClip.expanded !== true) return;
      this._deleteActiveMaterialFromShortcut();
    }),
      window.addEventListener(MEDIA_CLIP_DELETE_MATERIAL_EVENT, this._onDeleteMaterialShortcut));
  }
  ['_deleteActiveMaterialFromShortcut']() {
    const _0x95246c =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    if (_0x95246c - this._lastDeleteMaterialShortcutAt < 80) return;
    ((this._lastDeleteMaterialShortcutAt = _0x95246c), this._deleteActiveMaterial());
  }
  ['_handleDocumentKeyDown'](_0xa99bcf) {
    if (this._mediaClip.expanded !== true) return;
    if (this._isEditableEventTarget(_0xa99bcf?.target)) return;
    const _0x27c8ef = normalizeText(_0xa99bcf?.key).toLowerCase(),
      _0x42a4f6 = normalizeText(_0xa99bcf?.code);
    if (_0xa99bcf?.key === 'Escape' && this._materialMenu) {
      (_0xa99bcf.preventDefault?.(), _0xa99bcf.stopPropagation?.(), this._closeMaterialMenu());
      return;
    }
    if (_0xa99bcf?.key === ' ' || _0xa99bcf?.code === 'Space') {
      (_0xa99bcf.preventDefault?.(), _0xa99bcf.stopPropagation?.(), _0xa99bcf.stopImmediatePropagation?.());
      !_0xa99bcf?.repeat && void this._togglePreviewPlayback();
      return;
    }
    if (_0x27c8ef === 'c' && !_0xa99bcf?.ctrlKey && !_0xa99bcf?.metaKey && !_0xa99bcf?.altKey) {
      (_0xa99bcf.preventDefault?.(),
        _0xa99bcf.stopPropagation?.(),
        _0xa99bcf.stopImmediatePropagation?.(),
        this._splitActiveMaterial());
      return;
    }
    (_0x27c8ef === 'delete' ||
      _0x27c8ef === 'del' ||
      _0x27c8ef === 'backspace' ||
      _0x42a4f6 === 'Delete' ||
      _0x42a4f6 === 'Backspace') &&
      (_0xa99bcf.preventDefault?.(),
      _0xa99bcf.stopPropagation?.(),
      _0xa99bcf.stopImmediatePropagation?.(),
      this._deleteActiveMaterialFromShortcut());
  }
  ['_renderPickButton']() {
    const _0x23db70 = document.createElement('button');
    ((_0x23db70.type = 'button'),
      (_0x23db70.className = 'media-clip-pick-btn'),
      _0x23db70.classList.toggle('is-active', this._isPicking()));
    const _0x40ba3f = mediaClipText('pick.addByConnection');
    return (
      (_0x23db70.title = _0x40ba3f),
      _0x23db70.setAttribute('aria-label', _0x40ba3f),
      _0x23db70.appendChild(createConnectCursorIcon()),
      _0x23db70.addEventListener('click', (_0xf3e7c3) => this._togglePickConnect(_0xf3e7c3)),
      _0x23db70
    );
  }
  ['_renderEmpty']() {
    const _0x48946f = document.createElement('div');
    _0x48946f.className = 'media-clip-empty';
    const _0xa044da = document.createElement('div');
    _0xa044da.className = 'media-clip-empty-body';
    const _0x372ba4 = document.createElement('button');
    ((_0x372ba4.type = 'button'),
      (_0x372ba4.className = 'media-clip-pick-btn'),
      _0x372ba4.classList.toggle('is-active', this._isPicking()));
    const _0x5657c2 = mediaClipText('pick.addByConnection');
    ((_0x372ba4.title = _0x5657c2),
      _0x372ba4.setAttribute('aria-label', _0x5657c2),
      _0x372ba4.appendChild(createConnectCursorIcon()),
      _0x372ba4.addEventListener('click', (_0x3e5b4d) => this._togglePickConnect(_0x3e5b4d)),
      _0xa044da.appendChild(_0x372ba4));
    const _0xba3230 = document.createElement('div');
    ((_0xba3230.className = 'media-clip-empty-copy'),
      _0xba3230.classList.toggle('is-picking', this._isPicking()));
    const _0x508824 = document.createElement('div');
    ((_0x508824.textContent = this._isPicking()
      ? mediaClipText('empty.selectMaterial')
      : mediaClipText('empty.connectHint')),
      _0xba3230.appendChild(_0x508824));
    if (this._isPicking()) {
      const _0x1cc7d3 = document.createElement('div');
      ((_0x1cc7d3.className = 'media-clip-esc'),
        (_0x1cc7d3.textContent = mediaClipText('empty.exit')),
        _0xba3230.appendChild(_0x1cc7d3));
    }
    return (_0xa044da.appendChild(_0xba3230), _0x48946f.appendChild(_0xa044da), _0x48946f);
  }
  ['_renderCompact']() {
    const _0x1a056b = this._mediaClip.expanded === true,
      _0x3f005c = document.createElement('div');
    ((_0x3f005c.className = 'media-clip-compact'),
      _0x3f005c.classList.toggle('is-editing', _0x1a056b),
      _0x3f005c.classList.toggle('is-menu-open', this._menuOpen === true));
    const _0x4354c7 = document.createElement('div');
    _0x4354c7.className = 'media-clip-compact-body';
    const _0x53e870 = document.createElement('div');
    ((_0x53e870.className = 'media-clip-timeline-scroll'),
      this._primeTimelineScroll(_0x53e870),
      _0x53e870.addEventListener('click', () => {
        if (this._mediaClip.expanded === true) return;
        this._setExpanded(true);
      }),
      this._bindTimelineScroll(_0x53e870));
    const _0x1b4939 = document.createElement('div');
    ((_0x1b4939.className = 'media-clip-compact-timeline'),
      _0x1b4939.classList.toggle('is-editing', _0x1a056b));
    const _0x50866e = this._timelineTrackContentWidth({ compact: !_0x1a056b }),
      _0x5806ae = this._timelineAddSlotLeftPx(_0x50866e),
      _0x103cd7 = this._timelineContentWidth(_0x50866e),
      _0x37f9fa = this._timelineAxisWidthPx();
    (_0x1b4939.style.setProperty('--media-clip-track-content-width', _0x50866e + 'px'),
      _0x1b4939.style.setProperty('--media-clip-timeline-content-width', _0x103cd7 + 'px'),
      _0x1b4939.style.setProperty('--media-clip-add-left', _0x5806ae + 'px'),
      _0x1b4939.style.setProperty('--media-clip-track-axis-width', _0x37f9fa + 'px'));
    const _0x5e185b = this._audioTimelineClips(this._mediaClip.tracks.audio),
      _0x3538d5 = this._audioLaneCount(_0x5e185b);
    (this._setAudioLaneCountStyle(_0x1b4939, _0x3538d5),
      _0x1b4939.appendChild(
        this._renderRuler(this._primaryDuration(), { compact: !_0x1a056b, timelineWidthPx: _0x50866e }),
      ));
    const _0x191549 = document.createElement('div');
    ((_0x191549.className = 'media-clip-timeline-lane'),
      _0x191549.classList.toggle('has-audio-track', !!this._mediaClip.tracks.audio),
      this._setAudioLaneCountStyle(_0x191549, _0x3538d5),
      _0x191549.addEventListener('pointerleave', () => {
        if (this._timelineDrag()) return;
        (this._clearTimelineHoverState(_0x191549), this._restoreTimelinePlayheads());
      }));
    const _0x444ce8 = document.createElement('div');
    ((_0x444ce8.className = 'media-clip-timeline-tracks'),
      _0x444ce8.classList.toggle('has-audio-track', !!this._mediaClip.tracks.audio),
      this._setAudioLaneCountStyle(_0x444ce8, _0x3538d5));
    this._mediaClip.tracks.audio &&
      _0x191549.appendChild(this._renderAudioLaneControls(_0x5e185b, _0x3538d5));
    this._mediaClip.tracks.video &&
      _0x444ce8.appendChild(this._renderTrack('video', { compact: !_0x1a056b, timelineWidthPx: _0x50866e }));
    this._mediaClip.tracks.audio &&
      _0x444ce8.appendChild(this._renderTrack('audio', { compact: !_0x1a056b, timelineWidthPx: _0x50866e }));
    const _0x313ee6 = this._renderShortcutCropButton(),
      _0x5b9701 = this._renderPickButton();
    _0x5b9701.classList.add('media-clip-add-btn');
    const _0x81f75f = mediaClipText('pick.continueAdd');
    return (
      (_0x5b9701.title = _0x81f75f),
      _0x5b9701.setAttribute('aria-label', _0x81f75f),
      _0x191549.append(_0x444ce8, _0x5b9701),
      _0x1b4939.appendChild(_0x191549),
      _0x1a056b &&
        (this._bindTimelinePointerCursors(_0x1b4939, _0x444ce8),
        _0x1b4939.appendChild(this._renderTimelineCursors(this._primaryDuration()))),
      _0x53e870.appendChild(_0x1b4939),
      this._primeTimelineScroll(_0x53e870),
      _0x4354c7.append(_0x53e870),
      _0x3f005c.append(_0x4354c7, _0x313ee6),
      _0x1a056b &&
        (_0x3f005c.appendChild(this._renderTimelineHintCarousel()),
        _0x3f005c.appendChild(this._renderTimelineTools())),
      _0x3f005c
    );
  }
  ['_renderAudioLaneControls'](_0x5e47b5 = [], _0x55c37f = 1) {
    const _0x9b8478 = document.createElement('div');
    ((_0x9b8478.className = 'media-clip-audio-lane-controls'),
      (_0x9b8478.dataset.uiStop = 'true'),
      this._setAudioLaneCountStyle(_0x9b8478, _0x55c37f));
    for (let _0x8e5979 = 0; _0x8e5979 < _0x55c37f; _0x8e5979 += 1) {
      const _0x3bf65c = this._audioClipsForLane(_0x8e5979, _0x5e47b5),
        _0x2c8014 = this._isAudioLaneMuted(_0x8e5979, _0x5e47b5),
        _0x241645 = document.createElement('button');
      ((_0x241645.type = 'button'),
        (_0x241645.className = 'media-clip-audio-lane-mute-btn'),
        _0x241645.classList.toggle('is-muted', _0x2c8014),
        (_0x241645.disabled = _0x3bf65c.length === 0),
        (_0x241645.dataset.audioLaneIndex = String(_0x8e5979)),
        (_0x241645.dataset.uiStop = 'true'),
        (_0x241645.title = mediaClipText(_0x2c8014 ? 'audioLane.unmute' : 'audioLane.mute')),
        _0x241645.setAttribute('aria-label', _0x241645.title),
        _0x241645.style.setProperty(
          '--media-clip-audio-lane-top',
          _0x8e5979 * (MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + MEDIA_CLIP_AUDIO_LANE_GAP_PX) + 'px',
        ));
      const _0x344fe9 = createMediaClipSvgElement('svg');
      (_0x344fe9.setAttribute('viewBox', '0 0 24 24'),
        _0x344fe9.setAttribute('width', '16'),
        _0x344fe9.setAttribute('height', '16'),
        _0x344fe9.setAttribute('aria-hidden', 'true'));
      const _0x4c32bf = createMediaClipSvgElement('path');
      (_0x4c32bf.setAttribute('d', 'M4 9v6h4l5 4V5L8 9H4z'),
        _0x4c32bf.setAttribute('fill', 'currentColor'),
        _0x344fe9.appendChild(_0x4c32bf));
      const _0x179322 = createMediaClipSvgElement('path');
      (_0x179322.setAttribute(
        'd',
        _0x2c8014 ? 'M16 9l5 5m0-5l-5 5' : 'M16 8c1.3 1.4 1.3 4.6 0 6M18.5 6c2.4 2.6 2.4 8.4 0 11',
      ),
        _0x179322.setAttribute('fill', 'none'),
        _0x179322.setAttribute('stroke', 'currentColor'),
        _0x179322.setAttribute('stroke-width', '2'),
        _0x179322.setAttribute('stroke-linecap', 'round'),
        _0x344fe9.appendChild(_0x179322),
        _0x241645.appendChild(_0x344fe9),
        _0x241645.addEventListener('pointerdown', stopPointer),
        _0x241645.addEventListener('click', (_0x3fcd17) => {
          (stopPointer(_0x3fcd17), this._toggleAudioLaneMuted(_0x8e5979));
        }),
        _0x9b8478.appendChild(_0x241645));
    }
    return _0x9b8478;
  }
  ['_syncAudioLaneControls'](
    _0x81c05c = this._audioTimelineClips(this._mediaClip.tracks?.audio),
    _0x10c450 = this._audioLaneCount(_0x81c05c),
  ) {
    const _0xe5f806 = this.el?.querySelector?.('.media-clip-audio-lane-controls');
    if (!_0xe5f806) return;
    const _0x1f8248 = this._renderAudioLaneControls(_0x81c05c, _0x10c450);
    (this._setAudioLaneCountStyle(_0xe5f806, _0x10c450),
      _0xe5f806.replaceChildren?.(...Array.from(_0x1f8248.children || [])));
  }
  ['_primeTimelineScroll'](_0x2f8358) {
    if (!_0x2f8358) return 0;
    const _0x4be557 = Math.max(0, toNumber(this._timelineScrollLeft, this._timelineView?.scrollLeft || 0)),
      _0x128622 = this._timelineViewportWidth(),
      _0x319998 = this._timelineTrackContentWidth(),
      _0x2e81dc = Math.max(0, this._timelineContentWidth(_0x319998) - _0x128622),
      _0x35a595 = this._clampTimelineScrollLeft(_0x2f8358, _0x4be557, {
        maxScrollPx: _0x2e81dc,
        trackWidthPx: _0x319998,
        viewportWidthPx: _0x128622,
      });
    ((this._restoringTimelineScroll = _0x2f8358),
      (_0x2f8358.scrollLeft = _0x35a595),
      this._syncTimelineScrollFade(_0x2f8358));
    const _0x5e4d38 = () => {
      this._restoringTimelineScroll === _0x2f8358 && (this._restoringTimelineScroll = null);
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(_0x5e4d38);
    else setTimeout(_0x5e4d38, 0);
    return _0x35a595;
  }
  ['_bindTimelineScroll'](_0x3b2ef5) {
    if (!_0x3b2ef5) return;
    (_0x3b2ef5.addEventListener(
      'wheel',
      (_0x3f7974) => {
        if (_0x3f7974.ctrlKey || _0x3f7974.metaKey) {
          this._handleTimelineZoomWheel(_0x3b2ef5, _0x3f7974);
          return;
        }
        const _0x1ecc07 = Math.max(0, _0x3b2ef5.scrollWidth - _0x3b2ef5.clientWidth);
        if (_0x1ecc07 <= 0) {
          this._mediaClip.expanded === true && (_0x3f7974.preventDefault(), _0x3f7974.stopPropagation());
          return;
        }
        const _0x5cd1b3 =
          Math.abs(_0x3f7974.deltaX) > Math.abs(_0x3f7974.deltaY) ? _0x3f7974.deltaX : _0x3f7974.deltaY;
        if (!_0x5cd1b3) return;
        if (this._shouldLockTimelineWheelScroll(_0x3b2ef5, { maxScrollPx: _0x1ecc07 })) {
          (_0x3f7974.preventDefault(), _0x3f7974.stopPropagation());
          Math.abs(_0x3b2ef5.scrollLeft) > 0.5 &&
            ((_0x3b2ef5.scrollLeft = 0),
            this._updateTimelineView({ scrollLeft: 0 }, { persist: true, renderOnPersist: false }));
          this._syncTimelineScrollFade(_0x3b2ef5);
          return;
        }
        (_0x3f7974.preventDefault(),
          _0x3f7974.stopPropagation(),
          (_0x3b2ef5.scrollLeft = this._clampTimelineScrollLeft(_0x3b2ef5, _0x3b2ef5.scrollLeft + _0x5cd1b3, {
            maxScrollPx: _0x1ecc07,
          })),
          this._updateTimelineView(
            { scrollLeft: _0x3b2ef5.scrollLeft },
            { persist: true, renderOnPersist: false },
          ),
          this._syncTimelineScrollFade(_0x3b2ef5));
      },
      { passive: false },
    ),
      _0x3b2ef5.addEventListener('scroll', () => {
        const _0x4918d4 = this._clampTimelineScrollLeft(_0x3b2ef5, _0x3b2ef5.scrollLeft);
        if (Math.abs(_0x4918d4 - _0x3b2ef5.scrollLeft) > 0.5) {
          _0x3b2ef5.scrollLeft = _0x4918d4;
          return;
        }
        (this._updateTimelineView(
          { scrollLeft: _0x4918d4 },
          {
            persist: this._restoringTimelineScroll !== _0x3b2ef5 && !this._timelineDrag(),
            renderOnPersist: false,
          },
        ),
          this._syncTimelineScrollFade(_0x3b2ef5));
      }));
    const _0x15f05d = () => {
      const _0x27f23e = Math.max(0, _0x3b2ef5.scrollWidth - _0x3b2ef5.clientWidth);
      ((this._restoringTimelineScroll = _0x3b2ef5),
        (_0x3b2ef5.scrollLeft = this._clampTimelineScrollLeft(_0x3b2ef5, this._timelineScrollLeft, {
          maxScrollPx: _0x27f23e,
        })),
        this._syncTimelineScrollFade(_0x3b2ef5));
      const _0x3b6de7 = () => {
        this._restoringTimelineScroll === _0x3b2ef5 && (this._restoringTimelineScroll = null);
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(_0x3b6de7);
      else setTimeout(_0x3b6de7, 0);
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(_0x15f05d);
    else setTimeout(_0x15f05d, 0);
  }
  ['_shouldLockTimelineWheelScroll'](_0x2ebde0, _0x50c1d5 = {}) {
    if (!_0x2ebde0) return false;
    const _0x299dc1 = Math.max(
        0,
        toNumber(_0x50c1d5.maxScrollPx, _0x2ebde0.scrollWidth - _0x2ebde0.clientWidth),
      ),
      _0xc211e5 = Math.max(1, toNumber(_0x50c1d5.viewportWidthPx, _0x2ebde0.clientWidth)),
      _0x3877fa = Math.max(0, toNumber(_0x50c1d5.trackWidthPx, this._timelineTrackContentWidth()));
    return shouldLockMediaClipTimelineWheelScroll({
      trackWidthPx: _0x3877fa,
      viewportWidthPx: _0xc211e5,
      maxScrollPx: _0x299dc1,
    });
  }
  ['_timelineMaterialRangeSec']() {
    const _0x5e77c3 = [],
      _0x46b90c = (_0x348363, _0x45972a) => {
        const _0x28db79 = Math.max(0, toNumber(_0x348363, 0)),
          _0x245d84 = Math.max(_0x28db79, toNumber(_0x45972a, _0x28db79));
        if (_0x245d84 > _0x28db79) _0x5e77c3.push({ startSec: _0x28db79, endSec: _0x245d84 });
      },
      _0x5b3e8d = this._mediaClip?.tracks?.video || null,
      _0x1e0508 = this._videoTimelineClips(_0x5b3e8d);
    if (_0x1e0508.length)
      _0x1e0508.forEach((_0x38724d) => {
        _0x46b90c(_0x38724d.timelineStartSec, _0x38724d.timelineEndSec);
      });
    else _0x5b3e8d && _0x46b90c(_0x5b3e8d.startSec, _0x5b3e8d.endSec || _0x5b3e8d.durationSec);
    const _0x3ce4bc = this._mediaClip?.tracks?.audio || null;
    if (_0x3ce4bc) {
      const _0x10e70a = this._audioTimelineClips(_0x3ce4bc);
      _0x10e70a.length
        ? _0x10e70a.forEach((_0x267d5c) => {
            _0x46b90c(_0x267d5c.timelineStartSec, _0x267d5c.timelineEndSec);
          })
        : _0x46b90c(_0x3ce4bc.startSec, _0x3ce4bc.endSec || _0x3ce4bc.durationSec);
    }
    if (!_0x5e77c3.length) return { startSec: 0, endSec: 0 };
    return _0x5e77c3.reduce(
      (_0x133d3a, _0x484972) => ({
        startSec: Math.min(_0x133d3a.startSec, _0x484972.startSec),
        endSec: Math.max(_0x133d3a.endSec, _0x484972.endSec),
      }),
      { startSec: _0x5e77c3[0].startSec, endSec: _0x5e77c3[0].endSec },
    );
  }
  ['_timelineMaterialScrollBounds'](_0x322071, _0x3812e4 = {}) {
    const _0x204641 = Math.max(
        1,
        toNumber(_0x3812e4.viewportWidthPx, _0x322071?.clientWidth || this._timelineViewportWidth()),
      ),
      _0x2688cb = Math.max(0, toNumber(_0x3812e4.maxScrollPx, (_0x322071?.scrollWidth || 0) - _0x204641));
    if (_0x2688cb <= 0) return { minScrollLeft: 0, maxScrollLeft: 0 };
    const _0x5799f1 = this._timelineMaterialRangeSec();
    if (!(_0x5799f1.endSec > _0x5799f1.startSec)) return { minScrollLeft: 0, maxScrollLeft: _0x2688cb };
    const _0x46a745 = getMediaClipTimelineDisplayDuration(
        _0x3812e4.displayDurationSec ?? this._primaryDuration(),
      ),
      _0xe28ca0 = Math.max(1, toNumber(_0x3812e4.trackWidthPx, this._timelineTrackContentWidth())),
      _0x689a87 = getMediaClipTimelineRangeRect({
        startSec: _0x5799f1.startSec,
        endSec: _0x5799f1.endSec,
        durationSec: _0x46a745,
        trackWidthPx: _0xe28ca0,
        minWidthPct: 0,
      }),
      _0x252794 = Math.max(0, toNumber(_0x689a87.leftPx, 0)),
      _0x5df13d = Math.max(_0x252794, _0x252794 + toNumber(_0x689a87.widthPx, 0)),
      _0x1e79bc =
        this._timelineAddSlotLeftPx(_0xe28ca0, {
          displayDurationSec: _0x46a745,
          materialEndSec: _0x5799f1.endSec,
        }) + MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX,
      _0x4149e0 = Math.max(_0x5df13d, _0x1e79bc),
      _0xbd51dc = Math.max(0, _0x5df13d - _0x252794);
    let _0x4b9380 = 0,
      _0x146043 = _0x2688cb;
    if (_0xbd51dc < _0x204641) {
      _0x146043 = Math.min(_0x2688cb, _0x252794);
      const _0x3b1e82 = Math.max(0, _0x4149e0 - _0x204641),
        _0x3c4d71 = Math.max(0, _0x5df13d - _0x204641);
      _0x4b9380 = Math.min(_0x2688cb, _0x3b1e82 <= _0x146043 ? _0x3b1e82 : _0x3c4d71);
    } else
      ((_0x4b9380 = Math.min(_0x2688cb, Math.max(0, _0x252794))),
        (_0x146043 = Math.min(_0x2688cb, Math.max(0, _0x4149e0 - _0x204641))));
    return (
      (_0x4b9380 = Math.max(0, Math.min(_0x2688cb, _0x4b9380))),
      (_0x146043 = Math.max(_0x4b9380, Math.min(_0x2688cb, _0x146043))),
      { minScrollLeft: _0x4b9380, maxScrollLeft: _0x146043 }
    );
  }
  ['_clampTimelineScrollLeft'](_0x2c799b, _0x1b8e68 = 0, _0x29ab2a = {}) {
    if (!_0x2c799b) return 0;
    const _0x10e3d7 = Math.max(
      0,
      toNumber(_0x29ab2a.maxScrollPx, _0x2c799b.scrollWidth - _0x2c799b.clientWidth),
    );
    if (this._shouldLockTimelineWheelScroll(_0x2c799b, { ..._0x29ab2a, maxScrollPx: _0x10e3d7 })) return 0;
    const _0x4ae2a5 = this._timelineMaterialScrollBounds(_0x2c799b, { ..._0x29ab2a, maxScrollPx: _0x10e3d7 });
    return Math.max(_0x4ae2a5.minScrollLeft, Math.min(_0x4ae2a5.maxScrollLeft, toNumber(_0x1b8e68, 0)));
  }
  ['_handleTimelineZoomWheel'](_0x2312c2, _0x9ccfb2) {
    if (!_0x2312c2) return;
    const _0x55b31b = Number(_0x9ccfb2.deltaX) || 0,
      _0x65ff9c = Number(_0x9ccfb2.deltaY) || 0,
      _0x4eefd5 = Math.abs(_0x55b31b) > Math.abs(_0x65ff9c) ? _0x55b31b : _0x65ff9c;
    if (!_0x4eefd5) return;
    (_0x9ccfb2.preventDefault(), _0x9ccfb2.stopPropagation());
    const _0x34311b = normalizeMediaClipTimelineView(this._timelineView),
      _0x4e7e17 = getMediaClipTimelineNextZoom({
        currentZoom: _0x34311b.zoom,
        delta: _0x4eefd5,
        minZoom: MEDIA_CLIP_TIMELINE_ZOOM_MIN,
        maxZoom: MEDIA_CLIP_TIMELINE_ZOOM_MAX,
      });
    if (Math.abs(_0x4e7e17 - _0x34311b.zoom) < 0.001) return;
    const _0x3474db = _0x2312c2.getBoundingClientRect?.() || { left: 0, width: _0x2312c2.clientWidth || 0 },
      _0x3a67ce = Math.max(1, _0x2312c2.clientWidth || _0x3474db.width || 1),
      _0x226f62 = Math.max(
        0,
        Math.min(
          _0x3a67ce,
          Number.isFinite(_0x9ccfb2.clientX) ? _0x9ccfb2.clientX - (_0x3474db.left || 0) : _0x3a67ce / 2,
        ),
      ),
      _0x52b823 = this._timelineTrackContentWidth({ timelineZoom: _0x34311b.zoom }),
      _0x5a511e = getMediaClipTimelineDisplayDuration(
        this._primaryDuration({ timelineZoom: _0x34311b.zoom }),
      ),
      _0x7978d3 = Math.max(
        0,
        Math.min(
          _0x5a511e,
          ((Math.max(0, _0x2312c2.scrollLeft || 0) + _0x226f62) / Math.max(1, _0x52b823)) * _0x5a511e,
        ),
      );
    this._updateTimelineView({ zoom: _0x4e7e17 }, { persist: false });
    const _0x41a9c7 = this._timelineTrackContentWidth({ timelineZoom: _0x4e7e17 }),
      _0x4b0f88 = getMediaClipTimelineDisplayDuration(this._primaryDuration({ timelineZoom: _0x4e7e17 })),
      _0xcede4 = this._timelineContentWidth(_0x41a9c7);
    this._syncTimelineContentWidth(_0x41a9c7);
    this._mediaClip.tracks?.video &&
      this._updateTrackVisuals('video', {
        durationSec: this._videoTimelineDuration(this._mediaClip.tracks.video, null, {
          timelineZoom: _0x4e7e17,
        }),
        syncTimelineWidth: false,
      });
    this._mediaClip.tracks?.audio &&
      this._updateTrackVisuals('audio', {
        durationSec: this._timelineDurationForKind('audio', { timelineZoom: _0x4e7e17 }),
        syncTimelineWidth: false,
      });
    const _0x3472f1 = Math.max(0, _0xcede4 - _0x3a67ce),
      _0x4d0d39 = this._clampTimelineScrollLeft(
        _0x2312c2,
        getMediaClipTimelineZoomScrollLeft({
          anchorSec: _0x7978d3,
          anchorX: _0x226f62,
          durationSec: _0x4b0f88,
          trackWidthPx: _0x41a9c7,
          nextContentWidthPx: _0xcede4,
          viewportWidthPx: _0x3a67ce,
        }),
        { trackWidthPx: _0x41a9c7, viewportWidthPx: _0x3a67ce, maxScrollPx: _0x3472f1 },
      );
    ((_0x2312c2.scrollLeft = _0x4d0d39),
      this._updateTimelineView({ scrollLeft: _0x4d0d39 }, { persist: true, renderOnPersist: false }),
      this._syncTimelineScrollFade(_0x2312c2));
  }
  ['_syncTimelineScrollFade'](_0xa564fc) {
    if (!_0xa564fc) return;
    const _0x4ae486 = Math.max(0, _0xa564fc.scrollWidth - _0xa564fc.clientWidth),
      _0x3b2c0d = this._timelineMaterialScrollBounds(_0xa564fc, { maxScrollPx: _0x4ae486 }),
      _0x52b6c4 =
        !this._shouldLockTimelineWheelScroll(_0xa564fc, { maxScrollPx: _0x4ae486 }) &&
        _0x3b2c0d.maxScrollLeft > _0x3b2c0d.minScrollLeft + 1 &&
        _0xa564fc.scrollLeft < _0x3b2c0d.maxScrollLeft - 2;
    _0xa564fc.classList.toggle('has-right-overflow', _0x52b6c4);
  }
  ['_timelineDragScrollDeltaPx'](_0x295250 = this._timelineDrag()) {
    const _0x4bcb33 = _0x295250?.scrollEl;
    if (!_0x4bcb33) return 0;
    return toNumber(_0x4bcb33.scrollLeft, 0) - toNumber(_0x295250.startScrollLeft, 0);
  }
  ['_timelineDragDeltaPx'](_0x16fa2e = this._timelineDrag(), _0x49c39c = {}) {
    const _0x269866 = toNumber(_0x49c39c?.clientX, toNumber(_0x16fa2e?.latestClientX, _0x16fa2e?.startX));
    return _0x269866 - toNumber(_0x16fa2e?.startX, _0x269866) + this._timelineDragScrollDeltaPx(_0x16fa2e);
  }
  ['_timelineDragAutoScrollVelocity'](_0x13ea02, _0x4cf8a5) {
    if (!_0x13ea02 || !Number.isFinite(_0x4cf8a5)) return 0;
    const _0x4a45c2 = Math.max(0, _0x13ea02.scrollWidth - _0x13ea02.clientWidth);
    if (_0x4a45c2 <= 0) return 0;
    const _0x41afad = _0x13ea02.getBoundingClientRect?.() || {},
      _0x5dcc58 = toNumber(_0x41afad.left, 0),
      _0x24341c = Math.max(1, toNumber(_0x41afad.width, _0x13ea02.clientWidth || 1)),
      _0x3993b8 = toNumber(_0x41afad.right, _0x5dcc58 + _0x24341c);
    if (_0x4cf8a5 < _0x5dcc58 + TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX) {
      const _0x4afbc3 = Math.max(
        0,
        Math.min(
          1,
          (_0x5dcc58 + TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX - _0x4cf8a5) / TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX,
        ),
      );
      return -TIMELINE_DRAG_AUTO_SCROLL_MAX_PX * _0x4afbc3;
    }
    if (_0x4cf8a5 > _0x3993b8 - TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX) {
      const _0x4cf561 = Math.max(
        0,
        Math.min(
          1,
          (_0x4cf8a5 - (_0x3993b8 - TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX)) / TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX,
        ),
      );
      return TIMELINE_DRAG_AUTO_SCROLL_MAX_PX * _0x4cf561;
    }
    return 0;
  }
  ['_scheduleTimelineDragAutoScroll'](_0x350178 = this._timelineDrag()) {
    const _0x1e21cd = _0x350178?.scrollEl,
      _0x86fb3c = toNumber(_0x350178?.latestClientX, Number.NaN);
    if (!_0x1e21cd || !Number.isFinite(_0x86fb3c)) return;
    if (!this._timelineDragAutoScrollVelocity(_0x1e21cd, _0x86fb3c)) return;
    if (this._timelineDragAutoScrollRaf) return;
    const _0x1e3a87 = _0x350178.sessionId,
      _0x19c182 = () => {
        ((this._timelineDragAutoScrollRaf = 0), this._runTimelineDragAutoScroll(_0x1e3a87));
      };
    this._timelineDragAutoScrollRaf =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(_0x19c182)
        : setTimeout(_0x19c182, 16);
  }
  ['_stopTimelineDragAutoScroll']() {
    const _0x55802e = this._timelineDragAutoScrollRaf;
    if (!_0x55802e) return;
    try {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(_0x55802e);
    } catch {}
    try {
      clearTimeout(_0x55802e);
    } catch {}
    this._timelineDragAutoScrollRaf = 0;
  }
  ['_runTimelineDragAutoScroll'](_0x1ddecb) {
    const _0x59fa03 = this._timelineDrag();
    if (!_0x59fa03 || _0x59fa03.sessionId !== _0x1ddecb) return;
    const _0x54e2c4 = _0x59fa03.scrollEl,
      _0x305525 = toNumber(_0x59fa03.latestClientX, Number.NaN),
      _0x22b08a = this._timelineDragAutoScrollVelocity(_0x54e2c4, _0x305525);
    if (!_0x54e2c4 || !_0x22b08a) return;
    const _0x29738e = Math.max(0, _0x54e2c4.scrollWidth - _0x54e2c4.clientWidth),
      _0x31c242 = toNumber(_0x54e2c4.scrollLeft, 0),
      _0x3c76d5 = this._clampTimelineScrollLeft(_0x54e2c4, _0x31c242 + _0x22b08a, { maxScrollPx: _0x29738e });
    if (Math.abs(_0x3c76d5 - _0x31c242) <= 0.01) return;
    ((_0x54e2c4.scrollLeft = _0x3c76d5),
      this._updateTimelineView({ scrollLeft: _0x3c76d5 }, { persist: false, renderOnPersist: false }),
      this._syncTimelineScrollFade(_0x54e2c4),
      this._applyTimelineDragPreviewFromPointer(_0x59fa03, { clientX: _0x305525 }),
      this._scheduleTimelineDragAutoScroll(_0x59fa03));
  }
  ['_persistTimelineDragScroll'](_0x3ad0e4 = this._timelineDrag()) {
    const _0xfe062 = _0x3ad0e4?.scrollEl;
    if (!_0xfe062) return;
    const _0x343907 = this._clampTimelineScrollLeft(_0xfe062, _0xfe062.scrollLeft);
    (Math.abs(_0x343907 - toNumber(_0xfe062.scrollLeft, 0)) > 0.01 && (_0xfe062.scrollLeft = _0x343907),
      this._syncTimelineScrollFade(_0xfe062),
      this._updateTimelineView({ scrollLeft: _0x343907 }, { persist: true, renderOnPersist: false }));
  }
  ['_renderShortcutCropButton']() {
    const _0x356cc4 = makeButton(
      'media-clip-tool-crop media-clip-shortcut-crop',
      mediaClipText('tools.splitMaterial'),
      '',
    );
    return (
      (_0x356cc4.tabIndex = -1),
      _0x356cc4.setAttribute('aria-hidden', 'true'),
      _0x356cc4.addEventListener('click', (_0x3d282e) => {
        (stopPointer(_0x3d282e), this._splitActiveMaterial());
      }),
      _0x356cc4
    );
  }
  ['_setDownloadMenuOpen'](_0x48670b) {
    this._menuOpen = _0x48670b === true;
    this._materialMenu &&
      ((this._materialMenu = null),
      this._removeMaterialMenuPortal(),
      this._syncMaterialMenuDismissListener(false));
    const _0x3275f2 = this.el?.querySelector?.('.media-clip-compact');
    _0x3275f2?.classList?.toggle('is-menu-open', this._menuOpen);
    const _0x2dcada = this.el?.querySelector?.('.media-clip-compact-tools');
    if (!_0x2dcada) return;
    const _0x17533c = _0x2dcada.querySelector?.('.media-clip-tool-download');
    (_0x17533c?.classList?.toggle('is-active', this._menuOpen),
      _0x2dcada.querySelectorAll?.('.media-clip-menu')?.forEach((_0x27cb2c) => _0x27cb2c.remove?.()),
      this._menuOpen && _0x2dcada.appendChild(this._renderDownloadMenu()));
  }
  ['_renderTimelineTools']() {
    const _0x43d33a = document.createElement('div');
    _0x43d33a.className = 'media-clip-tools media-clip-compact-tools';
    const _0x37e60d = iconButton(
        'media-clip-tool media-clip-tool-crop',
        mediaClipText('tools.splitMaterial'),
        '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
      ),
      _0x43e8f3 = document.createElement('span');
    ((_0x43e8f3.className = 'media-clip-tool-kbd'),
      (_0x43e8f3.textContent = 'C'),
      _0x37e60d.appendChild(_0x43e8f3),
      _0x37e60d.addEventListener('click', (_0x47706b) => {
        (stopPointer(_0x47706b), this._splitActiveMaterial());
      }));
    const _0x4a0f31 = iconButton(
      'media-clip-tool media-clip-tool-download',
      mediaClipText('tools.export'),
      '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    );
    (_0x4a0f31.classList.toggle('is-active', this._menuOpen),
      _0x4a0f31.addEventListener('click', (_0x307bea) => {
        (stopPointer(_0x307bea), this._setDownloadMenuOpen(!this._menuOpen));
      }),
      _0x43d33a.append(_0x37e60d, _0x4a0f31));
    if (this._menuOpen) _0x43d33a.appendChild(this._renderDownloadMenu());
    return _0x43d33a;
  }
  ['_renderTimelineHintCarousel']() {
    const _0x2d49d3 = document.createElement('div');
    _0x2d49d3.className = 'media-clip-helper-row';
    const _0x51db00 = document.createElement('div');
    _0x51db00.className = 'media-clip-helper-left';
    const _0x1e8aa5 = [
      [
        ['kbd', 'Space'],
        ['text', mediaClipText('hints.playPause')],
      ],
      [
        ['kbd', 'C'],
        ['text', mediaClipText('hints.splitAtPlayhead')],
      ],
      [
        ['kbd', 'Delete'],
        ['text', mediaClipText('hints.deleteCurrent')],
      ],
      [
        ['kbd', mediaClipText('hints.dragMaterial')],
        ['text', mediaClipText('hints.adjustOrder')],
      ],
      [
        ['kbd', mediaClipText('hints.dragEdges')],
        ['text', mediaClipText('hints.trimMaterial')],
      ],
      [
        ['kbd', mediaClipText('hints.rightClick')],
        ['text', mediaClipText('hints.exportOrDelete')],
      ],
      [['text', mediaClipText('hints.connectButtonAdd')]],
      [
        ['kbd', 'Ctrl'],
        ['text', mediaClipText('hints.zoomTimeline')],
      ],
    ];
    return (
      _0x2d49d3.style.setProperty('--media-clip-helper-count', String(_0x1e8aa5.length)),
      _0x1e8aa5.forEach((_0x195799, _0xed3e7f) => {
        const _0x1f291b = document.createElement('div');
        ((_0x1f291b.className = 'media-clip-helper-msg'),
          _0x1f291b.style.setProperty('--media-clip-helper-index', String(_0xed3e7f)),
          _0x195799.forEach(([_0x1d41ce, _0x5f0f02]) => {
            const _0x4fe4e9 = document.createElement('span');
            ((_0x4fe4e9.className = _0x1d41ce === 'kbd' ? 'media-clip-helper-kbd' : 'media-clip-helper-text'),
              (_0x4fe4e9.textContent = _0x5f0f02),
              _0x1f291b.appendChild(_0x4fe4e9));
          }),
          _0x51db00.appendChild(_0x1f291b));
      }),
      _0x2d49d3.appendChild(_0x51db00),
      _0x2d49d3
    );
  }
  ['_renderMaterialMenu']() {
    const _0x52fefb = this._materialMenu || {},
      _0xfd7d52 = document.createElement('div');
    ((_0xfd7d52.className = 'v2-canvas-ctx-menu media-clip-material-menu'),
      _0xfd7d52.setAttribute('role', 'menu'),
      (_0xfd7d52.dataset.uiStop = 'true'));
    const _0x738eaf = (_0x50bd02, _0x1e3b52) => {
        const _0x59d321 = document.createElement('div');
        ((_0x59d321.className = 'v2-menu-row'), _0x59d321.setAttribute('role', 'menuitem'));
        const _0x59e4cd = document.createElement('span');
        return (
          (_0x59e4cd.textContent = _0x50bd02),
          _0x59d321.appendChild(_0x59e4cd),
          _0x59d321.addEventListener('pointerdown', (_0xc9f912) => {
            if (_0xc9f912.button !== 0) return;
            (stopPointer(_0xc9f912), _0x1e3b52(_0xc9f912));
          }),
          _0x59d321
        );
      },
      _0x139e8c = _0x738eaf(mediaClipText('materialMenu.exportToCanvas'), async () => {
        if (this._exporting === true) return;
        const { kind: _0x262779, clipIndex: _0xc94f0a } = this._materialMenu || _0x52fefb;
        (this._closeMaterialMenu({ render: false }),
          await this._exportMaterialToCanvas(_0x262779, _0xc94f0a));
      }),
      _0x369735 =
        _0x52fefb.kind === 'audio'
          ? this._audioTimelineClips(this._mediaClip.tracks?.audio)[
              Math.max(0, Math.trunc(toNumber(_0x52fefb.clipIndex, 0)))
            ] || null
          : null,
      _0x1dc7a2 = _0x369735
        ? _0x738eaf(
            mediaClipText(_0x369735.disabled === true ? 'materialMenu.enable' : 'materialMenu.disable'),
            () => {
              const { clipIndex: _0xd56cf2 } = this._materialMenu || _0x52fefb;
              (this._closeMaterialMenu({ render: false }), this._toggleAudioClipDisabled(_0xd56cf2));
            },
          )
        : null,
      _0x84396a = _0x738eaf(mediaClipText('materialMenu.delete'), () => {
        const { kind: _0x4c7bbd, clipIndex: _0x5c58a9 } = this._materialMenu || _0x52fefb;
        (this._closeMaterialMenu({ render: false }), this._deleteMaterial(_0x4c7bbd, _0x5c58a9));
      });
    _0xfd7d52.append(_0x139e8c);
    if (_0x1dc7a2) _0xfd7d52.append(_0x1dc7a2);
    return (_0xfd7d52.append(_0x84396a), _0xfd7d52);
  }
  ['_renderPreviewPanel']() {
    const _0x3c7410 = document.createElement('div');
    _0x3c7410.className = 'media-clip-preview-panel';
    const _0x9ef59d = this._renderPreview(),
      _0x2f9aa2 = makeButton('media-clip-close', mediaClipText('preview.collapse'), '×');
    return (
      _0x2f9aa2.addEventListener('click', (_0x5d4e51) => {
        (stopPointer(_0x5d4e51), this._setExpanded(false));
      }),
      _0x9ef59d.appendChild(_0x2f9aa2),
      _0x3c7410.append(_0x9ef59d),
      this._syncPreviewPanelLayout(_0x3c7410, _0x9ef59d),
      _0x3c7410
    );
  }
  ['_previewLayoutTokens']() {
    return ['is-landscape', 'is-portrait', 'is-tall-portrait'];
  }
  ['_previewVideoLayoutClasses'](_0x5e3e3e = {}) {
    const _0x202f94 = resolveMediaClipDimensions(_0x5e3e3e),
      _0x32d6e2 = Math.max(1, toNumber(_0x202f94.width, 1)),
      _0x1ae189 = Math.max(1, toNumber(_0x202f94.height, 1)),
      _0x5988a2 = _0x32d6e2 / _0x1ae189;
    if (_0x5988a2 < 1) return _0x5988a2 <= 0.65 ? ['is-portrait', 'is-tall-portrait'] : ['is-portrait'];
    return ['is-landscape'];
  }
  ['_syncPreviewPanelLayout'](_0x301bb9, _0x38e814) {
    if (!_0x301bb9?.classList || !_0x38e814?.classList) return;
    (this._previewLayoutTokens().forEach((_0x3057e9) => {
      _0x301bb9.classList.remove(_0x3057e9);
    }),
      this._previewLayoutTokens().forEach((_0x491015) => {
        if (_0x38e814.classList.contains(_0x491015)) _0x301bb9.classList.add(_0x491015);
      }));
    const _0x578f4f = _0x38e814.style?.getPropertyValue?.('--media-clip-preview-aspect-ratio');
    if (_0x578f4f) _0x301bb9.style?.setProperty?.('--media-clip-preview-aspect-ratio', _0x578f4f);
  }
  ['_applyPreviewVideoLayout'](_0x385139, _0xba1db2 = {}) {
    if (!_0x385139?.classList) return;
    const _0x3d059e = resolveMediaClipDimensions(_0xba1db2),
      _0x3710a6 = Math.max(1, toNumber(_0x3d059e.width, 1)),
      _0x59de9e = Math.max(1, toNumber(_0x3d059e.height, 1));
    (this._previewLayoutTokens().forEach((_0x56a509) => {
      _0x385139.classList.remove(_0x56a509);
    }),
      this._previewVideoLayoutClasses(_0xba1db2).forEach((_0x223bfd) => {
        _0x385139.classList.add(_0x223bfd);
      }),
      _0x385139.style?.setProperty?.('--media-clip-preview-aspect-ratio', _0x3710a6 + ' / ' + _0x59de9e),
      this._syncPreviewPanelLayout(
        _0x385139.closest?.('.media-clip-preview-panel') || _0x385139.parentElement,
        _0x385139,
      ));
  }
  ['_syncPreviewVideoLayoutFromElement'](_0x2fca6e = this._videoPreview) {
    const _0x3fd986 = toNumber(_0x2fca6e?.videoWidth, 0),
      _0x4348be = toNumber(_0x2fca6e?.videoHeight, 0);
    if (!(_0x3fd986 > 0 && _0x4348be > 0)) return;
    this._applyPreviewVideoLayout(_0x2fca6e.parentElement, { width: _0x3fd986, height: _0x4348be });
  }
  ['_showPreviewImage'](_0x371bae = {}, _0x12e3f9 = '') {
    const _0x4b7cd3 = this._ensurePreviewImageElement(),
      _0x5b3878 = normalizeText(_0x12e3f9) || resolveMediaClipImageUrl(_0x371bae);
    if (!_0x4b7cd3 || !_0x5b3878) return false;
    this._previewVisualKind = 'image';
    try {
      this._videoPreview?.pause?.();
    } catch {}
    if (this._videoPreview) this._videoPreview.hidden = true;
    _0x4b7cd3.hidden = false;
    if (_0x4b7cd3.getAttribute?.('src') !== _0x5b3878) _0x4b7cd3.src = _0x5b3878;
    return (
      this._applyPreviewVideoLayout(_0x4b7cd3.parentElement, _0x371bae),
      this._updatePreviewControls(),
      true
    );
  }
  ['_clearPreviewVideoFallback']() {
    const _0x4bc947 = this._videoPreview?.parentElement || this.el?.querySelector?.('.media-clip-preview');
    _0x4bc947?.querySelectorAll?.('.media-clip-video-fallback')?.forEach((_0x364379) => {
      _0x364379.remove?.();
    });
  }
  ['_showPreviewVideo'](_0x595bdf = {}) {
    ((this._previewVisualKind = 'video'), this._clearPreviewVideoFallback());
    if (this._imagePreview) this._imagePreview.hidden = true;
    if (this._videoPreview) this._videoPreview.hidden = false;
    this._applyPreviewVideoLayout(this._videoPreview?.parentElement, _0x595bdf);
  }
  ['_ensurePreviewVideoElement']() {
    if (this._videoPreview) return this._videoPreview;
    const _0x2b664b = document.createElement('video');
    ((_0x2b664b.className = 'media-clip-video-preview'),
      (_0x2b664b.preload = 'auto'),
      (_0x2b664b.controls = false),
      _0x2b664b.removeAttribute('controls'),
      (_0x2b664b.muted = true),
      (_0x2b664b.defaultMuted = true),
      (_0x2b664b.playsInline = true),
      (_0x2b664b.disablePictureInPicture = true),
      _0x2b664b.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback'));
    const _0x3cdafe = () => {
      (this._syncPreviewVideoLayoutFromElement(_0x2b664b), this._applyPendingVideoSourceSeek(_0x2b664b));
      if (_0x2b664b.__mediaClipPendingSourceSeek || _0x2b664b.__mediaClipWaitingSourceSeek) return;
      if (this._playing) {
        try {
          _0x2b664b.play?.()?.catch?.(() => {});
        } catch {}
        return;
      }
      const _0x3cecfa = this._resolveVideoPreviewSeekTarget();
      this._syncPreviewTime('video', _0x3cecfa, { immediate: true });
    };
    return (
      _0x2b664b.addEventListener('loadedmetadata', _0x3cdafe),
      _0x2b664b.addEventListener('loadeddata', _0x3cdafe),
      _0x2b664b.addEventListener('canplay', _0x3cdafe),
      _0x2b664b.addEventListener('error', () => {
        const _0x59d829 = _0x2b664b.__mediaClipFallbackHost,
          _0x2d24a1 = normalizeText(_0x2b664b.__mediaClipPosterUrl);
        _0x59d829 &&
          _0x2d24a1 &&
          !_0x59d829.querySelector('.media-clip-video-fallback') &&
          _0x59d829.appendChild(this._renderVideoFallback(_0x2d24a1));
      }),
      (this._videoPreview = _0x2b664b),
      _0x2b664b
    );
  }
  ['_ensurePreviewImageElement']() {
    if (this._imagePreview) return this._imagePreview;
    const _0x3b4650 = document.createElement('img');
    return (
      (_0x3b4650.className = 'media-clip-image-preview'),
      (_0x3b4650.alt = ''),
      (_0x3b4650.draggable = false),
      (_0x3b4650.hidden = true),
      _0x3b4650.addEventListener('load', () => {
        this._applyPreviewVideoLayout(_0x3b4650.parentElement, {
          width: _0x3b4650.naturalWidth,
          height: _0x3b4650.naturalHeight,
        });
      }),
      (this._imagePreview = _0x3b4650),
      _0x3b4650
    );
  }
  ['_ensurePreviewAudioElement']() {
    if (this._audioPreview) return this._audioPreview;
    const _0x2b8b03 = document.createElement('audio');
    return (
      (_0x2b8b03.className = 'media-clip-audio-element'),
      (_0x2b8b03.controls = false),
      _0x2b8b03.removeAttribute('controls'),
      (_0x2b8b03.preload = 'metadata'),
      _0x2b8b03.addEventListener('loadedmetadata', () => {
        const _0x152779 = this._audioSourceSecForPlayhead(this._playheadSec || 0);
        this._syncPreviewTime('audio', _0x152779, { immediate: true });
      }),
      (this._audioPreview = _0x2b8b03),
      _0x2b8b03
    );
  }
  ['_renderPreviewControls']() {
    const _0x4700da = document.createElement('div');
    _0x4700da.className = 'media-clip-preview-controls';
    const _0x36a6c3 = document.createElement('button');
    ((_0x36a6c3.type = 'button'),
      (_0x36a6c3.className = 'media-clip-preview-play'),
      _0x36a6c3.addEventListener('click', (_0x48a1ca) => this._togglePreviewPlayback(_0x48a1ca)));
    const _0x290c3c = document.createElement('span');
    return (
      (_0x290c3c.className = 'media-clip-preview-time'),
      (this._previewPlayButton = _0x36a6c3),
      (this._previewTimeLabel = _0x290c3c),
      _0x4700da.append(_0x36a6c3, _0x290c3c),
      this._updatePreviewControls(),
      _0x4700da
    );
  }
  ['_renderPreview']() {
    const _0x150eba = document.createElement('div');
    ((_0x150eba.className = 'media-clip-preview'),
      (this._previewPlayButton = null),
      (this._previewTimeLabel = null));
    const _0x40f62d = this._mediaClip.tracks.video,
      _0x1661d4 = this._mediaClip.tracks.audio;
    if (_0x40f62d) {
      const _0x213cce = this._getVideoPreviewContextAtTimelineSec(this._playheadSec || 0),
        _0x2eaf74 = _0x213cce.url,
        _0x509a68 = _0x213cce.posterUrl;
      this._applyPreviewVideoLayout(_0x150eba, _0x213cce.source);
      if (!_0x2eaf74)
        return (
          this._disposePreviewMedia('video'),
          _0x150eba.appendChild(this._renderVideoFallback(_0x509a68)),
          _0x150eba
        );
      const _0x5d8c6b = this._ensurePreviewVideoElement(),
        _0x58060f = this._ensurePreviewImageElement();
      ((_0x5d8c6b.__mediaClipFallbackHost = _0x150eba), (_0x5d8c6b.__mediaClipPosterUrl = _0x509a68));
      if (_0x509a68) _0x5d8c6b.poster = _0x509a68;
      else _0x5d8c6b.removeAttribute('poster');
      if (_0x213cce.clipKind !== 'image') {
        if (setMediaElementSource(_0x5d8c6b, _0x2eaf74)) this._resetPreviewSeekState('video');
        this._previewVideoSrc = _0x2eaf74;
      }
      const _0x1046af = _0x1661d4 ? this._getAudioClipContextAtTimelineSec(this._playheadSec || 0) : null,
        _0x3efd22 = _0x1046af?.url || '';
      if (_0x1661d4) {
        const _0x3641ac = this._ensurePreviewAudioElement();
        if (setMediaElementSource(_0x3641ac, _0x3efd22)) this._resetPreviewSeekState('audio');
        ((this._previewAudioSrc = _0x3efd22), (_0x5d8c6b.muted = true), _0x150eba.appendChild(_0x3641ac));
      } else ((_0x5d8c6b.muted = false), this._disposePreviewMedia('audio'));
      (_0x150eba.appendChild(_0x58060f),
        _0x150eba.appendChild(_0x5d8c6b),
        _0x213cce.clipKind === 'image'
          ? this._showPreviewImage(_0x213cce.source, _0x2eaf74)
          : (this._showPreviewVideo(_0x213cce.source),
            this._syncPreviewTime('video', _0x213cce.sourceSec, { immediate: true })),
        _0x150eba.appendChild(this._renderPreviewControls()));
    } else {
      this._disposePreviewMedia('video');
      const _0x1c70b5 = document.createElement('div');
      ((_0x1c70b5.className = 'media-clip-audio-preview'),
        (_0x1c70b5.textContent = mediaClipText('preview.audioClip')));
      const _0x4834f5 = this._ensurePreviewAudioElement(),
        _0x8d8cf2 = this._getAudioClipContextAtTimelineSec(this._playheadSec || 0),
        _0x466d06 = _0x8d8cf2?.url || resolveMediaClipAudioUrl(this._sources.audio);
      if (setMediaElementSource(_0x4834f5, _0x466d06)) this._resetPreviewSeekState('audio');
      ((this._previewAudioSrc = _0x466d06),
        _0x1c70b5.appendChild(_0x4834f5),
        _0x150eba.appendChild(_0x1c70b5),
        _0x1661d4 &&
          this._syncPreviewTime('audio', this._audioSourceSecForPlayhead(this._playheadSec || 0), {
            immediate: true,
          }),
        _0x150eba.appendChild(this._renderPreviewControls()));
    }
    return _0x150eba;
  }
  ['_renderVideoFallback'](_0x21794b = '') {
    const _0x40b132 = normalizeText(_0x21794b);
    if (_0x40b132) {
      const _0x1749ec = document.createElement('img');
      return (
        (_0x1749ec.className = 'media-clip-video-fallback'),
        (_0x1749ec.src = _0x40b132),
        (_0x1749ec.alt = ''),
        (_0x1749ec.draggable = false),
        _0x1749ec
      );
    }
    const _0x180edf = document.createElement('div');
    return ((_0x180edf.className = 'media-clip-video-fallback is-empty'), _0x180edf);
  }
  ['_estimateTimelineWidth'](_0x49c364 = {}) {
    const _0x146eea = toNumber(_0x49c364.timelineWidthPx, 0);
    if (_0x146eea > 0) return Math.max(240, _0x146eea);
    const _0x110bfc = toNumber(this.nodeData?.width, MEDIA_CLIP_COMPACT_SIZE.width),
      _0xb5fb7e = _0x49c364.compact === true ? 136 : 116;
    return Math.max(240, _0x110bfc - _0xb5fb7e);
  }
  ['_timelineViewportWidth']() {
    const _0x4a1824 = toNumber(this.nodeData?.width, MEDIA_CLIP_COMPACT_SIZE.width);
    return Math.max(240, _0x4a1824 - 64);
  }
  ['_timelineZoom'](_0x2bdb41 = {}) {
    return normalizeMediaClipTimelineView({
      zoom: _0x2bdb41.timelineZoom ?? this._timelineView?.zoom ?? this._mediaClip?.timelineView?.zoom,
    }).zoom;
  }
  ['_timelineTrackContentWidth'](_0x417601 = {}) {
    const _0x13baba = this._timelineZoom(_0x417601),
      _0x3c0c2d = this._primaryDuration({ timelineZoom: _0x13baba });
    return getMediaClipTimelineTrackWidthPx({
      durationSec: _0x3c0c2d,
      viewportWidthPx: this._timelineViewportWidth(),
      zoom: _0x13baba,
    });
  }
  ['_timelineAxisWidthPx']() {
    return this._mediaClip.tracks?.audio ? MEDIA_CLIP_TIMELINE_AXIS_WIDTH_PX : 0;
  }
  ['_timelineMaterialEndSec']() {
    const _0x3cf3db = this._mediaClip.tracks?.video,
      _0x1dccb8 = this._videoTimelineMaterialEnd(_0x3cf3db);
    if (_0x1dccb8 > 0) return _0x1dccb8;
    const _0x28eb15 = this._mediaClip.tracks?.audio;
    if (_0x28eb15) return this._audioTimelineMaterialEnd(_0x28eb15);
    return 0;
  }
  ['_timelineAddSlotLeftPx'](_0x1e0455 = this._timelineTrackContentWidth(), _0x18858a = {}) {
    return getMediaClipTimelineAddSlotLeftPx({
      trackWidthPx: _0x1e0455,
      displayDurationSec: _0x18858a.displayDurationSec ?? this._primaryDuration(),
      materialEndSec: _0x18858a.materialEndSec ?? this._timelineMaterialEndSec(),
    });
  }
  ['_timelineContentWidth'](_0x4848d0 = this._timelineTrackContentWidth(), _0x368e3c = {}) {
    return (
      this._timelineAxisWidthPx() +
      getMediaClipTimelineContentWidthPx({
        trackWidthPx: _0x4848d0,
        displayDurationSec: _0x368e3c.displayDurationSec ?? this._primaryDuration(),
        materialEndSec: _0x368e3c.materialEndSec ?? this._timelineMaterialEndSec(),
      })
    );
  }
  ['_syncTimelineAddSlotPosition'](_0x3c0ed0 = this._timelineTrackContentWidth(), _0x1c25b7 = {}) {
    const _0x168f80 = Math.max(240, Math.ceil(toNumber(_0x3c0ed0, 0))),
      _0x4b946c = this._timelineAddSlotLeftPx(_0x168f80, _0x1c25b7),
      _0x2bb6ec = this._timelineContentWidth(_0x168f80, _0x1c25b7),
      _0x3deb89 = this.el?.querySelector?.('.media-clip-compact-timeline');
    if (!_0x3deb89) return;
    (_0x3deb89.style.setProperty('--media-clip-add-left', _0x4b946c + 'px'),
      _0x3deb89.style.setProperty('--media-clip-timeline-content-width', _0x2bb6ec + 'px'),
      _0x3deb89.style.setProperty('--media-clip-track-axis-width', this._timelineAxisWidthPx() + 'px'));
    const _0xef43c6 = _0x3deb89.querySelector?.('.media-clip-add-btn');
    if (_0xef43c6) _0xef43c6.style.left = this._timelineAxisWidthPx() + _0x4b946c + 'px';
  }
  ['_syncTimelineAddSlotForRow'](_0x58a428, _0x594399 = {}) {
    const _0x155f59 = Math.max(240, readLayoutWidthPx(_0x58a428, this._timelineTrackContentWidth()));
    this._syncTimelineCursorLayerForRow(_0x58a428);
    const _0x664c27 = _0x594399.displayDurationSec ?? _0x594399.durationSec;
    if (Number.isFinite(toNumber(_0x664c27, NaN))) {
      const _0x5894f9 = getMediaClipTimelineDisplayDuration(_0x664c27);
      (this._setTimelineRowDuration(_0x58a428, _0x5894f9),
        this._syncTimelineRulerTicks(_0x155f59, { ..._0x594399, durationSec: _0x5894f9 }));
    }
    this._syncTimelineAddSlotPosition(_0x155f59, _0x594399);
  }
  ['_syncTimelineContentWidth'](_0x47959c = this._timelineTrackContentWidth(), _0x5ec6eb = {}) {
    const _0x7ae53e = Math.max(240, Math.ceil(toNumber(_0x47959c, 0))),
      _0x535405 = this.el?.querySelector?.('.media-clip-compact-timeline');
    if (!_0x535405) return;
    (_0x535405.style.setProperty('--media-clip-track-content-width', _0x7ae53e + 'px'),
      _0x535405.style.setProperty('--media-clip-track-axis-width', this._timelineAxisWidthPx() + 'px'),
      this._syncTimelineAddSlotPosition(_0x7ae53e, _0x5ec6eb),
      this.el?.querySelectorAll?.('.media-clip-track, .media-clip-ruler')?.forEach((_0x382b5c) => {
        _0x382b5c.style.width = _0x7ae53e + 'px';
      }),
      this._syncTimelineRulerTicks(_0x7ae53e, _0x5ec6eb),
      this._syncTimelineScrollFade(this.el?.querySelector?.('.media-clip-timeline-scroll')));
  }
  ['_timelineRulerTicks'](_0x3fe5a8, _0x2ac097, _0x23417d = {}) {
    const _0x56ec57 = getMediaClipTimelineDisplayDuration(_0x3fe5a8);
    return buildMediaClipTimelineTicks(_0x56ec57, _0x2ac097);
  }
  ['_populateTimelineRuler'](_0x7e619c, _0x30a890, _0x8e7327, _0x4da7ff = {}) {
    if (!_0x7e619c) return;
    const _0xfd3eac = getMediaClipTimelineDisplayDuration(_0x30a890),
      _0x112b6c = this._timelineRulerTicks(_0xfd3eac, _0x8e7327, _0x4da7ff),
      _0x48efbd = _0xfd3eac + ':' + _0x112b6c.join(',');
    if (_0x7e619c.dataset?.tickSignature === _0x48efbd) return;
    if (_0x7e619c.dataset) _0x7e619c.dataset.tickSignature = _0x48efbd;
    (typeof _0x7e619c.replaceChildren === 'function'
      ? _0x7e619c.replaceChildren()
      : (_0x7e619c.textContent = ''),
      _0x112b6c.forEach((_0xef09e3) => {
        const _0x5ee403 = document.createElement('span');
        ((_0x5ee403.className = 'media-clip-ruler-tick'), (_0x5ee403.textContent = formatTime(_0xef09e3)));
        const _0x2c7204 = getMediaClipTimelinePercent(_0xef09e3, _0xfd3eac);
        ((_0x5ee403.style.left = _0x2c7204 + '%'), _0x7e619c.appendChild(_0x5ee403));
      }));
  }
  ['_syncTimelineRulerTicks'](_0x3cbedd = this._timelineTrackContentWidth(), _0x1abac2 = {}) {
    const _0x499f96 = this.el?.querySelector?.('.media-clip-ruler');
    if (!_0x499f96) return;
    const _0x422a1e = _0x1abac2.durationSec ?? _0x1abac2.displayDurationSec ?? this._primaryDuration();
    this._populateTimelineRuler(_0x499f96, _0x422a1e, _0x3cbedd, _0x1abac2);
  }
  ['_renderRuler'](_0x1d8249, _0x4ab618 = {}) {
    const _0x412a99 = getMediaClipTimelineDisplayDuration(_0x1d8249),
      _0x298b03 = this._estimateTimelineWidth(_0x4ab618),
      _0x5d7d64 = document.createElement('div');
    return (
      (_0x5d7d64.className = 'media-clip-ruler'),
      this._populateTimelineRuler(_0x5d7d64, _0x412a99, _0x298b03, _0x4ab618),
      _0x5d7d64
    );
  }
  ['_renderTimelineCursors'](_0x40b4a1 = this._primaryDuration()) {
    const _0xe2a45a = document.createElement('div');
    ((_0xe2a45a.className = 'media-clip-timeline-cursors'), _0xe2a45a.setAttribute('aria-hidden', 'true'));
    const _0x4a1154 = document.createElement('div');
    ((_0x4a1154.className =
      'media-clip-playhead media-clip-timeline-cursor media-clip-timeline-cursor-fixed'),
      this._applyTimelinePlayheadModel(
        _0x4a1154,
        getMediaClipTimelinePlayheadModel({ playheadSec: this._playheadSec, durationSec: _0x40b4a1 }),
      ));
    const _0x326cd2 = document.createElement('div');
    return (
      (_0x326cd2.className =
        'media-clip-hover-playhead media-clip-timeline-cursor media-clip-timeline-cursor-hover'),
      (_0x326cd2.hidden = true),
      _0xe2a45a.append(_0x4a1154, _0x326cd2),
      _0xe2a45a
    );
  }
  ['_timelineCursorKind']() {
    const _0x520ab0 = normalizeText(this._mediaClip.activeTrack);
    if (_0x520ab0 && this._mediaClip.tracks?.[_0x520ab0]) return _0x520ab0;
    if (this._mediaClip.tracks?.video) return 'video';
    if (this._mediaClip.tracks?.audio) return 'audio';
    return '';
  }
  ['_timelineDurationForKind'](_0x54067d = this._timelineCursorKind(), _0x5cbec1 = {}) {
    const _0x2ac8aa = this._mediaClip.tracks?.[_0x54067d];
    if (!_0x2ac8aa) return this._primaryDuration(_0x5cbec1);
    if (_0x54067d === 'video') return this._videoTimelineDuration(_0x2ac8aa, null, _0x5cbec1);
    if (_0x54067d === 'audio') {
      const _0x7b49d0 = this._mediaClip.tracks?.video;
      return _0x7b49d0
        ? this._videoTimelineDuration(_0x7b49d0, null, _0x5cbec1)
        : this._audioTimelineDuration(_0x2ac8aa, null, _0x5cbec1);
    }
    return getTrackDuration(_0x2ac8aa);
  }
  ['_timelinePointerContext'](_0x2d1c33, _0x6661ae = null) {
    const _0x560ac6 = _0x6661ae?.closest?.('.media-clip-track:not(.is-compact)'),
      _0x166367 = _0x560ac6?.classList?.contains('media-clip-track-audio')
        ? 'audio'
        : _0x560ac6?.classList?.contains('media-clip-track-video')
          ? 'video'
          : '',
      _0x2d48b1 = _0x166367 || this._timelineCursorKind();
    if (!_0x2d48b1) return null;
    const _0x3c3bb2 = _0x166367
      ? _0x560ac6
      : _0x2d1c33?.querySelector?.('.media-clip-track-' + _0x2d48b1 + ':not(.is-compact)');
    if (!_0x3c3bb2) return null;
    const _0xa9f6bf = this._timelineDurationForKind(_0x2d48b1);
    return { kind: _0x2d48b1, row: _0x3c3bb2, duration: this._timelineRowDuration(_0x3c3bb2, _0xa9f6bf) };
  }
  ['_isTimelineControlTarget'](_0x39c00b) {
    return !!_0x39c00b?.closest?.(
      '.media-clip-pick-btn, .media-clip-tool, .media-clip-menu, .media-clip-material-menu, .media-clip-menu-item, .media-clip-audio-lane-mute-btn, .media-clip-trim',
    );
  }
  ['_timelineEventSegment'](_0x10feb2) {
    return _0x10feb2?.closest?.('.media-clip-segment') || null;
  }
  ['_openMaterialMenu'](_0x3e8ae9, _0x40a1d7, _0x2512fb) {
    if (!_0x3e8ae9 || !_0x2512fb) return;
    (_0x2512fb.preventDefault?.(), _0x2512fb.stopPropagation?.());
    const _0xcb5c61 = this._materialMenuHost(),
      _0x422d93 = this._materialMenuLocalPoint(_0x2512fb.clientX, _0x2512fb.clientY, _0xcb5c61);
    ((this._menuOpen = false),
      (this._materialMenu = {
        kind: _0x3e8ae9,
        clipIndex: Math.max(0, Math.trunc(toNumber(_0x40a1d7, 0))),
        x: _0x422d93.x,
        y: _0x422d93.y,
      }),
      this._syncMaterialMenuDismissListener(true),
      this._removeMaterialMenuPortal(),
      this._renderMaterialMenuPortal());
  }
  ['_bindTimelinePointerCursors'](_0x255ce5, _0x2e85c0) {
    if (!_0x255ce5 || !_0x2e85c0) return;
    (_0x255ce5.addEventListener('pointermove', (_0xa0bf1c) => {
      if (this._timelineDrag() || this._isTimelineControlTarget(_0xa0bf1c.target)) return;
      const _0x5ab4d2 = this._timelinePointerContext(_0x2e85c0, _0xa0bf1c.target);
      if (!_0x5ab4d2) return;
      const _0xf6e32a = this._timelineSecFromPointerEvent(_0x5ab4d2.row, _0xa0bf1c, _0x5ab4d2.duration);
      this._timelineEventSegment(_0xa0bf1c.target)
        ? this._previewTrackPlayhead(_0x5ab4d2.row, _0x5ab4d2.kind, _0xf6e32a, _0x5ab4d2.duration)
        : this._updateTimelineHoverPlayheadVisual(_0x5ab4d2.row, _0x5ab4d2.duration, {
            playheadSec: _0xf6e32a,
          });
    }),
      _0x255ce5.addEventListener('pointerdown', (_0x270250) => {
        if (_0x270250.button !== 0 || this._timelineDrag() || this._isTimelineControlTarget(_0x270250.target))
          return;
        if (this._timelineEventSegment(_0x270250.target)) return;
        const _0x4da59c = this._timelinePointerContext(_0x2e85c0, _0x270250.target);
        if (!_0x4da59c) return;
        this._setTimelinePlayheadFromPointer(_0x4da59c.row, _0x4da59c.kind, _0x270250, _0x4da59c.duration, {
          updateActiveTrack: false,
          updateClipSelection: false,
          selectClip: false,
          syncPreview: false,
        });
      }),
      _0x255ce5.addEventListener('pointerleave', () => {
        if (this._timelineDrag()) return;
        (this._hideTimelineHoverPlayhead(_0x255ce5), this._restoreTimelinePlayheads());
      }),
      _0x255ce5.addEventListener('click', (_0xbafe18) => {
        if (this._timelineDrag() || this._isTimelineControlTarget(_0xbafe18.target)) return;
        if (!this._timelineEventSegment(_0xbafe18.target)) return;
        const _0xcc5e09 = this._timelinePointerContext(_0x2e85c0, _0xbafe18.target);
        if (!_0xcc5e09) return;
        const _0x28fb27 = this._timelineSecFromPointerEvent(_0xcc5e09.row, _0xbafe18, _0xcc5e09.duration),
          _0x271755 =
            _0xcc5e09.kind === 'video'
              ? this._setActiveClipIndex(this._clipIndexAtTimelineSec(_0x28fb27))
              : _0xcc5e09.kind === 'audio'
                ? this._setActiveAudioClipIndex(this._audioClipIndexAtTimelineSec(_0x28fb27))
                : false;
        if (_0xcc5e09.kind === 'audio') this._selectAudioClipIndex(this._activeAudioClipIndex);
        this._setActiveTrack(_0xcc5e09.kind, _0x28fb27, { forceRender: _0x271755 });
      }));
  }
  ['_videoSources']() {
    const _0x2f8987 = Array.isArray(this._sources?.videos) ? this._sources.videos : [];
    if (_0x2f8987.length) return _0x2f8987;
    return this._sources?.video ? [this._sources.video] : [];
  }
  ['_firstVideoSource']() {
    return this._videoSources().find((_0x5a4bd2) => getMediaClipInputKind(_0x5a4bd2) === 'video') || null;
  }
  ['_videoClipSource'](_0x2dc629 = {}, _0x560611 = 0) {
    const _0x319c87 = this._videoSources(),
      _0x2c8cb4 = normalizeText(_0x2dc629.sourceId),
      _0x11022a = normalizeText(_0x2dc629.sourceKey);
    return (
      _0x319c87.find((_0x14887f) => normalizeText(_0x14887f?.id) === _0x2c8cb4) ||
      _0x319c87.find(
        (_0x3e6bcc) => normalizeText(_0x3e6bcc?.__mediaClipEdgeId) === normalizeText(_0x2dc629.id),
      ) ||
      _0x319c87.find((_0x51d789) => normalizeText(resolveMediaClipSourceKey(_0x51d789)) === _0x11022a) ||
      _0x319c87[_0x560611] ||
      this._sources?.video ||
      null
    );
  }
  ['_audioSources']() {
    const _0x2448c7 = Array.isArray(this._sources?.audios) ? this._sources.audios : [];
    if (_0x2448c7.length) return _0x2448c7;
    return this._sources?.audio ? [this._sources.audio] : [];
  }
  ['_audioClipSource'](_0x5e0053 = {}, _0x3203fb = 0) {
    const _0x331211 = this._audioSources(),
      _0x4f58f8 = normalizeText(_0x5e0053.sourceId),
      _0x50e0e0 = normalizeText(_0x5e0053.sourceKey);
    return (
      _0x331211.find((_0xcedf0b) => normalizeText(_0xcedf0b?.id) === _0x4f58f8) ||
      _0x331211.find(
        (_0x32dc62) => normalizeText(_0x32dc62?.__mediaClipEdgeId) === normalizeText(_0x5e0053.id),
      ) ||
      _0x331211.find((_0x663b92) => normalizeText(resolveMediaClipSourceKey(_0x663b92)) === _0x50e0e0) ||
      _0x331211[_0x3203fb] ||
      this._sources?.audio ||
      null
    );
  }
  ['_videoTimelineClips'](_0x26b138 = null) {
    const _0xdaa66d = Array.isArray(this._mediaClip?.clips) ? this._mediaClip.clips : [];
    if (_0xdaa66d.length) return _0xdaa66d;
    if (!_0x26b138) return [];
    return [
      {
        id: 'video:0',
        sourceKey: _0x26b138.sourceKey,
        startSec: _0x26b138.startSec,
        endSec: _0x26b138.endSec,
        durationSec: _0x26b138.durationSec,
        timelineStartSec: _0x26b138.startSec,
        timelineEndSec: _0x26b138.endSec,
      },
    ];
  }
  ['_audioTimelineClips'](_0x5b2214 = null) {
    const _0x37957f = Array.isArray(this._mediaClip?.audioClips) ? this._mediaClip.audioClips : [];
    if (_0x37957f.length) return _0x37957f;
    if (!_0x5b2214) return [];
    const _0x27bcdd = toNumber(_0x5b2214.startSec, 0),
      _0x331f51 = Math.max(_0x27bcdd, toNumber(_0x5b2214.endSec, _0x27bcdd));
    return [
      {
        id: 'audio:0',
        kind: 'audio',
        sourceKey: _0x5b2214.sourceKey,
        startSec: _0x27bcdd,
        endSec: _0x331f51,
        durationSec: _0x5b2214.durationSec,
        timelineStartSec: _0x27bcdd,
        timelineEndSec: _0x331f51,
        laneIndex: 0,
        muted: false,
        disabled: false,
      },
    ];
  }
  ['_timelineDurationForZoom'](_0x1ff2c9 = 0, _0x2dc4e8 = {}) {
    const _0x51efc1 = getMediaClipTimelineDisplayDuration(_0x1ff2c9),
      _0x43da25 = Math.max(_0x51efc1, _0x51efc1 * TIMELINE_ZOOM_OUT_DISPLAY_MULTIPLIER);
    if (_0x43da25 <= _0x51efc1) return _0x51efc1;
    const _0x4ae043 = this._timelineZoom(_0x2dc4e8);
    if (_0x4ae043 >= 1) return _0x51efc1;
    const _0x56a03d = Math.max(0.001, 1 - MEDIA_CLIP_TIMELINE_ZOOM_MIN),
      _0x5eb638 = Math.max(0, Math.min(1, (1 - _0x4ae043) / _0x56a03d));
    return Math.round((_0x51efc1 + (_0x43da25 - _0x51efc1) * _0x5eb638) * 0x3e8) / 0x3e8;
  }
  ['_videoTimelineBaseDuration'](_0x2ebcc9 = null, _0x2cf945 = null) {
    const _0x26f264 = Array.isArray(_0x2cf945) ? _0x2cf945 : this._videoTimelineClips(_0x2ebcc9),
      _0x332bf4 = this._videoTimelineMaterialEnd(_0x2ebcc9, _0x26f264),
      _0x3bcff0 = _0x26f264.reduce(
        (_0x2593bf, _0x595cf2) => Math.min(_0x2593bf, toNumber(_0x595cf2?.timelineStartSec, 0)),
        0,
      ),
      _0x19bb16 = _0x3bcff0 < 0 ? Math.max(0, _0x332bf4 - _0x3bcff0) : _0x332bf4;
    if (_0x26f264.length) {
      const _0x31733f =
        _0x26f264.length === 1
          ? Math.max(toNumber(_0x26f264[0]?.durationSec, 0), toNumber(_0x2ebcc9?.durationSec, 0))
          : 0;
      return getMediaClipTimelineDisplayDuration(Math.max(_0x332bf4, _0x19bb16, _0x31733f));
    }
    return getMediaClipTimelineDisplayDuration(
      Math.max(toNumber(_0x2ebcc9?.durationSec, 0), getTrackDuration(_0x2ebcc9)),
    );
  }
  ['_videoTimelineDuration'](_0xe3655 = null, _0x4899bb = null, _0x164f9e = {}) {
    return this._timelineDurationForZoom(this._videoTimelineBaseDuration(_0xe3655, _0x4899bb), _0x164f9e);
  }
  ['_timelineSegmentVisualDurationSec'](_0x2f2627 = null, _0x1fe144 = null) {
    if (!_0x2f2627 || !_0x1fe144) return 0;
    const _0x5c9e68 = Math.max(0, toNumber(_0x1fe144.timelineStartSec, 0)),
      _0x2541f9 = Math.max(_0x5c9e68, toNumber(_0x1fe144.timelineEndSec, _0x5c9e68)),
      _0x5caa5e = Math.max(0, _0x2541f9 - _0x5c9e68),
      _0x2d40e1 = parsePercentValue(_0x2f2627?.style?.left),
      _0x23b7b4 = parsePercentValue(_0x2f2627?.style?.width),
      _0x129339 = parsePercentValue(_0x2f2627?.style?.right),
      _0x227860 =
        Number.isFinite(_0x23b7b4) && _0x23b7b4 > 0
          ? _0x23b7b4
          : Number.isFinite(_0x2d40e1) && Number.isFinite(_0x129339)
            ? Math.max(0, 100 - _0x2d40e1 - _0x129339)
            : NaN,
      _0x23e93b = [];
    return (
      Number.isFinite(_0x2d40e1) &&
        _0x2d40e1 > 0 &&
        _0x5c9e68 > 0 &&
        _0x23e93b.push(_0x5c9e68 / (_0x2d40e1 / 100)),
      Number.isFinite(_0x227860) &&
        _0x227860 > 0 &&
        _0x5caa5e > 0 &&
        _0x23e93b.push(_0x5caa5e / (_0x227860 / 100)),
      Number.isFinite(_0x2d40e1) &&
        Number.isFinite(_0x227860) &&
        _0x2d40e1 + _0x227860 > 0 &&
        _0x2541f9 > 0 &&
        _0x23e93b.push(_0x2541f9 / ((_0x2d40e1 + _0x227860) / 100)),
      Math.max(0, ..._0x23e93b.filter((_0x390f6b) => Number.isFinite(_0x390f6b) && _0x390f6b > 0))
    );
  }
  ['_setTimelineRowDuration'](_0x22c2cc = null, _0x7c8005 = 0) {
    if (!_0x22c2cc?.dataset) return;
    _0x22c2cc.dataset.timelineDurationSec = String(getMediaClipTimelineDisplayDuration(_0x7c8005));
  }
  ['_timelineRowDuration'](_0x5c3b3f = null, _0x558b4c = 0) {
    const _0x407c27 = toNumber(_0x5c3b3f?.dataset?.timelineDurationSec, NaN);
    if (Number.isFinite(_0x407c27) && _0x407c27 > 0) return getMediaClipTimelineDisplayDuration(_0x407c27);
    return getMediaClipTimelineDisplayDuration(_0x558b4c);
  }
  ['_resolveTimelineDragDuration'](
    _0x4efbcc,
    _0x4a0f37 = null,
    _0x40f404 = null,
    _0x53809f = null,
    _0x5c13d8 = 0,
  ) {
    if (_0x4efbcc === 'audio') {
      const _0x3b3510 = Array.isArray(_0x40f404) ? _0x40f404 : this._audioTimelineClips(_0x4a0f37),
        _0x34d02e = this._timelineDurationForKind('audio'),
        _0x1c7ce9 = _0x53809f?.closest?.('.media-clip-track') || null;
      return this._timelineRowDuration(_0x1c7ce9, _0x34d02e);
    }
    if (_0x4efbcc !== 'video') return getTrackDuration(_0x4a0f37);
    const _0x33316f = Array.isArray(_0x40f404) ? _0x40f404 : this._videoTimelineClips(_0x4a0f37),
      _0x37a81b = this._videoTimelineDuration(_0x4a0f37, _0x33316f),
      _0x1ff64f = _0x53809f?.closest?.('.media-clip-track') || null;
    return this._timelineRowDuration(_0x1ff64f, _0x37a81b);
  }
  ['_videoTimelineMaterialEnd'](_0x1b29a4 = null, _0xe4dd79 = null) {
    const _0x123ca9 = Array.isArray(_0xe4dd79) ? _0xe4dd79 : this._videoTimelineClips(_0x1b29a4);
    if (_0x123ca9.length)
      return _0x123ca9.reduce(
        (_0xfecc6b, _0x494aba) => Math.max(_0xfecc6b, toNumber(_0x494aba.timelineEndSec, 0)),
        0,
      );
    return Math.max(0, toNumber(_0x1b29a4?.endSec || _0x1b29a4?.durationSec, 0));
  }
  ['_audioTimelineMaterialEnd'](_0x5972c3 = null, _0x42573c = null) {
    const _0x1a8ff0 = Array.isArray(_0x42573c) ? _0x42573c : this._audioTimelineClips(_0x5972c3);
    if (_0x1a8ff0.length)
      return _0x1a8ff0.reduce(
        (_0xc97a5e, _0x39e350) => Math.max(_0xc97a5e, toNumber(_0x39e350.timelineEndSec, 0)),
        0,
      );
    return Math.max(0, toNumber(_0x5972c3?.endSec || _0x5972c3?.durationSec, 0));
  }
  ['_audioTimelineDuration'](_0x343e2d = null, _0x448b5f = null, _0x5cd11f = {}) {
    const _0x16ead3 = Array.isArray(_0x448b5f) ? _0x448b5f : this._audioTimelineClips(_0x343e2d),
      _0x1f2869 = this._audioTimelineMaterialEnd(_0x343e2d, _0x16ead3),
      _0x5a00d8 =
        _0x16ead3.length === 1
          ? Math.max(toNumber(_0x16ead3[0]?.durationSec, 0), toNumber(_0x343e2d?.durationSec, 0))
          : toNumber(_0x343e2d?.durationSec, 0);
    return this._timelineDurationForZoom(Math.max(_0x1f2869, _0x5a00d8), _0x5cd11f);
  }
  ['_clampVideoClipIndex'](_0x43bb23 = this._activeClipIndex) {
    const _0x2e6a3d = Math.max(0, this._videoTimelineClips(this._mediaClip.tracks?.video).length),
      _0xb167e7 = Math.max(0, _0x2e6a3d - 1);
    return Math.max(0, Math.min(_0xb167e7, Math.trunc(toNumber(_0x43bb23, 0))));
  }
  ['_clampAudioClipIndex'](_0xa96436 = this._activeAudioClipIndex) {
    const _0x508161 = Math.max(0, this._audioTimelineClips(this._mediaClip.tracks?.audio).length),
      _0x3f6e7d = Math.max(0, _0x508161 - 1);
    return Math.max(0, Math.min(_0x3f6e7d, Math.trunc(toNumber(_0xa96436, 0))));
  }
  ['_clipIndexAtTimelineSec'](
    _0x37184a,
    _0x3cdfc9 = this._videoTimelineClips(this._mediaClip.tracks?.video),
  ) {
    const _0x59d85d = Array.isArray(_0x3cdfc9) ? _0x3cdfc9 : [];
    if (!_0x59d85d.length) return 0;
    const _0x24a41e = toNumber(_0x37184a, 0),
      _0x4995c0 = _0x59d85d.findIndex((_0x533109, _0x21838d) => {
        const _0x109528 = toNumber(_0x533109.timelineStartSec, 0),
          _0x6d9cbd = Math.max(_0x109528, toNumber(_0x533109.timelineEndSec, _0x109528));
        return _0x21838d === _0x59d85d.length - 1
          ? _0x24a41e >= _0x109528 && _0x24a41e <= _0x6d9cbd
          : _0x24a41e >= _0x109528 && _0x24a41e < _0x6d9cbd;
      });
    if (_0x4995c0 >= 0) return _0x4995c0;
    let _0x5142d3 = 0,
      _0x7abd06 = Number.POSITIVE_INFINITY;
    return (
      _0x59d85d.forEach((_0x50286f, _0x160729) => {
        const _0x2a7aa8 = toNumber(_0x50286f.timelineStartSec, 0),
          _0xaf1650 = Math.max(_0x2a7aa8, toNumber(_0x50286f.timelineEndSec, _0x2a7aa8)),
          _0x1d488f = _0x24a41e < _0x2a7aa8 ? _0x2a7aa8 - _0x24a41e : _0x24a41e - _0xaf1650;
        _0x1d488f < _0x7abd06 && ((_0x5142d3 = _0x160729), (_0x7abd06 = _0x1d488f));
      }),
      _0x5142d3
    );
  }
  ['_audioClipIndexAtTimelineSec'](
    _0xd3fbfe,
    _0x4e53f2 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
  ) {
    const _0x7a44ff = Array.isArray(_0x4e53f2) ? _0x4e53f2 : [];
    if (!_0x7a44ff.length) return 0;
    const _0x59db72 = toNumber(_0xd3fbfe, 0),
      _0x2abc7d = _0x7a44ff.findIndex((_0x58951e, _0x216342) => {
        const _0x8abc6d = toNumber(_0x58951e.timelineStartSec, 0),
          _0x3d45ad = Math.max(_0x8abc6d, toNumber(_0x58951e.timelineEndSec, _0x8abc6d));
        return _0x216342 === _0x7a44ff.length - 1
          ? _0x59db72 >= _0x8abc6d && _0x59db72 <= _0x3d45ad
          : _0x59db72 >= _0x8abc6d && _0x59db72 < _0x3d45ad;
      });
    if (_0x2abc7d >= 0) return _0x2abc7d;
    let _0x256e5e = 0,
      _0x2da357 = Number.POSITIVE_INFINITY;
    return (
      _0x7a44ff.forEach((_0x5a8bc0, _0x19073e) => {
        const _0x358d0a = toNumber(_0x5a8bc0.timelineStartSec, 0),
          _0x1f190d = Math.max(_0x358d0a, toNumber(_0x5a8bc0.timelineEndSec, _0x358d0a)),
          _0x3de68f = _0x59db72 < _0x358d0a ? _0x358d0a - _0x59db72 : _0x59db72 - _0x1f190d;
        _0x3de68f < _0x2da357 && ((_0x256e5e = _0x19073e), (_0x2da357 = _0x3de68f));
      }),
      _0x256e5e
    );
  }
  ['_setActiveClipIndex'](_0x54527b = this._activeClipIndex) {
    const _0x3ce5f8 = this._clampVideoClipIndex(_0x54527b),
      _0x5d9c6d = _0x3ce5f8 !== this._activeClipIndex;
    return ((this._activeClipIndex = _0x3ce5f8), _0x5d9c6d);
  }
  ['_setActiveAudioClipIndex'](_0x13c926 = this._activeAudioClipIndex) {
    const _0x3531e5 = this._clampAudioClipIndex(_0x13c926),
      _0x55cbb6 = _0x3531e5 !== this._activeAudioClipIndex;
    return ((this._activeAudioClipIndex = _0x3531e5), _0x55cbb6);
  }
  ['_clampSelectedClipIndex'](_0x3ead59 = this._selectedClipIndex) {
    const _0x4a0ca7 = Math.max(0, this._videoTimelineClips(this._mediaClip.tracks?.video).length),
      _0x5ac53c = Math.trunc(toNumber(_0x3ead59, -1));
    return _0x5ac53c >= 0 && _0x5ac53c < _0x4a0ca7 ? _0x5ac53c : -1;
  }
  ['_clampSelectedAudioClipIndex'](_0xf53d14 = this._selectedAudioClipIndex) {
    const _0x6b61fc = Math.max(0, this._audioTimelineClips(this._mediaClip.tracks?.audio).length),
      _0x2bc7aa = Math.trunc(toNumber(_0xf53d14, -1));
    return _0x2bc7aa >= 0 && _0x2bc7aa < _0x6b61fc ? _0x2bc7aa : -1;
  }
  ['_selectClipIndex'](_0x88f22d = this._activeClipIndex) {
    const _0x49437a = this._clampVideoClipIndex(_0x88f22d),
      _0x291223 = _0x49437a !== this._selectedClipIndex;
    return ((this._selectedClipIndex = _0x49437a), _0x291223);
  }
  ['_selectAudioClipIndex'](_0x439b3c = this._activeAudioClipIndex) {
    const _0x3ad73c = this._clampAudioClipIndex(_0x439b3c),
      _0x446e25 = _0x3ad73c !== this._selectedAudioClipIndex;
    return ((this._selectedAudioClipIndex = _0x3ad73c), _0x446e25);
  }
  ['_patchAudioClipState'](_0x5e3975 = this._activeAudioClipIndex, _0x39a4a9 = {}) {
    const _0x3faf1e = Math.max(0, Math.trunc(toNumber(_0x5e3975, 0))),
      _0x3ad75f = this._audioTimelineClips(this._mediaClip.tracks?.audio),
      _0x482268 = _0x3ad75f[_0x3faf1e];
    if (!_0x482268) return false;
    return (
      (this._mediaClip = patchMediaClipAudioClipState(this._mediaClip, _0x3faf1e, _0x39a4a9)),
      this._setActiveAudioClipIndex(_0x3faf1e),
      this._selectAudioClipIndex(_0x3faf1e),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }),
      commit(),
      this._refreshMediaClipTimelineInPlace(),
      true
    );
  }
  ['_toggleAudioClipMuted'](_0x294424 = this._activeAudioClipIndex) {
    const _0x3e08c0 = Math.max(0, Math.trunc(toNumber(_0x294424, 0))),
      _0x17db89 = this._audioTimelineClips(this._mediaClip.tracks?.audio)[_0x3e08c0];
    if (!_0x17db89) return false;
    return this._patchAudioClipState(_0x3e08c0, { muted: _0x17db89.muted !== true });
  }
  ['_audioClipsForLane'](_0x347deb = 0, _0x33b1c3 = this._audioTimelineClips(this._mediaClip.tracks?.audio)) {
    const _0x59a8f8 = normalizeMediaClipAudioLaneIndex(_0x347deb),
      _0x49fb53 = Array.isArray(_0x33b1c3) ? _0x33b1c3 : [];
    return _0x49fb53.filter((_0x5bb0df) => this._audioClipLaneIndex(_0x5bb0df) === _0x59a8f8);
  }
  ['_isAudioLaneMuted'](_0x4200a4 = 0, _0xa75c03 = this._audioTimelineClips(this._mediaClip.tracks?.audio)) {
    const _0x184484 = this._audioClipsForLane(_0x4200a4, _0xa75c03);
    return _0x184484.length > 0 && _0x184484.every((_0x3c8e8e) => _0x3c8e8e?.muted === true);
  }
  ['_toggleAudioLaneMuted'](_0x21f6fb = 0) {
    const _0x2c4149 = normalizeMediaClipAudioLaneIndex(_0x21f6fb),
      _0x499a67 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
      _0xddad1c = this._audioClipsForLane(_0x2c4149, _0x499a67);
    if (!_0xddad1c.length) return false;
    const _0x390dc2 = !this._isAudioLaneMuted(_0x2c4149, _0x499a67);
    this._mediaClip = patchMediaClipAudioLaneMuted(this._mediaClip, _0x2c4149, _0x390dc2);
    const _0x1f39e1 = Math.max(
      0,
      this._mediaClip.audioClips?.findIndex?.(
        (_0x28b3e4) => this._audioClipLaneIndex(_0x28b3e4) === _0x2c4149,
      ) ?? 0,
    );
    return (
      this._setActiveAudioClipIndex(_0x1f39e1),
      this._selectAudioClipIndex(_0x1f39e1),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }),
      commit(),
      this._refreshMediaClipTimelineInPlace(),
      true
    );
  }
  ['_toggleAudioClipDisabled'](_0x33a983 = this._activeAudioClipIndex) {
    const _0x306a2e = Math.max(0, Math.trunc(toNumber(_0x33a983, 0))),
      _0x169f73 = this._audioTimelineClips(this._mediaClip.tracks?.audio)[_0x306a2e];
    if (!_0x169f73) return false;
    return this._patchAudioClipState(_0x306a2e, { disabled: _0x169f73.disabled !== true });
  }
  ['_segmentClipIndex'](_0x1de368, _0xb0b463 = 'video', _0x147597 = null) {
    const _0x3fcada = normalizeText(_0x1de368?.dataset?.clipId);
    if (_0x3fcada) {
      const _0x238e0e = Array.isArray(_0x147597)
          ? _0x147597
          : _0xb0b463 === 'audio'
            ? this._mediaClip.audioClips || []
            : this._mediaClip.clips || [],
        _0x1619f3 = _0x238e0e.findIndex((_0x1f8ccc) => normalizeText(_0x1f8ccc?.id) === _0x3fcada);
      if (_0x1619f3 >= 0) return _0x1619f3;
    }
    return Math.max(0, Math.trunc(toNumber(_0x1de368?.dataset?.clipIndex, 0)));
  }
  ['_timelineRowForDrag'](_0x3712d5 = this._timelineDrag()) {
    if (_0x3712d5?.rowEl) return _0x3712d5.rowEl;
    const _0x4d46b6 = normalizeText(_0x3712d5?.kind);
    if (!_0x4d46b6) return null;
    return (
      this.el?.querySelector?.('.media-clip-track-' + _0x4d46b6 + ':not(.is-compact)') ||
      this.el?.querySelector?.('.media-clip-track-' + _0x4d46b6) ||
      null
    );
  }
  ['_videoSourceSecForTimelineSec'](_0x401736 = this._playheadSec, _0x23017a = null) {
    const _0x1120d7 = Array.isArray(_0x23017a)
      ? _0x23017a
      : this._videoTimelineClips(this._mediaClip.tracks?.video);
    if (!_0x1120d7.length) return _0x401736;
    const _0x5795da = toNumber(_0x401736, 0);
    if (_0x1120d7.length === 1) {
      const _0x2e64f1 = _0x1120d7[0],
        _0x17fe08 = toNumber(_0x2e64f1.startSec, 0),
        _0x2f76bf = toNumber(_0x2e64f1.endSec, _0x17fe08),
        _0x11c9f1 = toNumber(_0x2e64f1.timelineStartSec, 0),
        _0x59210e = toNumber(_0x2e64f1.timelineEndSec, _0x11c9f1);
      if (_0x5795da >= _0x11c9f1 && _0x5795da <= _0x59210e) return _0x17fe08 + (_0x5795da - _0x11c9f1);
      return Math.max(_0x17fe08, Math.min(_0x2f76bf, _0x5795da));
    }
    const _0x28c5b3 =
        _0x1120d7[this._clipIndexAtTimelineSec(_0x5795da, _0x1120d7)] || _0x1120d7[_0x1120d7.length - 1],
      _0x21e301 = toNumber(_0x28c5b3.timelineStartSec, 0),
      _0x1aae43 = toNumber(_0x28c5b3.startSec, 0),
      _0x466bbe = toNumber(_0x28c5b3.endSec, _0x1aae43);
    return Math.max(_0x1aae43, Math.min(_0x466bbe, _0x1aae43 + (_0x5795da - _0x21e301)));
  }
  ['_videoSourceSecForPlayhead'](_0x2337c5 = this._playheadSec) {
    return this._videoSourceSecForTimelineSec(_0x2337c5);
  }
  ['_audioSourceSecForPlayhead'](_0x1732f5 = this._playheadSec) {
    const _0x6ea221 = this._audioTimelineClips(this._mediaClip.tracks?.audio);
    if (!_0x6ea221.length) return _0x1732f5;
    const _0x982808 = toNumber(_0x1732f5, 0),
      _0x4c4184 =
        _0x6ea221[this._audioClipIndexAtTimelineSec(_0x982808, _0x6ea221)] || _0x6ea221[_0x6ea221.length - 1],
      _0x59127d = toNumber(_0x4c4184.timelineStartSec, 0),
      _0x12064e = toNumber(_0x4c4184.startSec, 0),
      _0x17e5d4 = toNumber(_0x4c4184.endSec, _0x12064e);
    return Math.max(_0x12064e, Math.min(_0x17e5d4, _0x12064e + (_0x982808 - _0x59127d)));
  }
  ['_audioClipSourceSec'](_0x4927d2 = {}, _0x327033 = this._playheadSec) {
    const _0x1bdd6d = toNumber(_0x4927d2.timelineStartSec, 0),
      _0x41a73e = toNumber(_0x4927d2.startSec, 0),
      _0x4c028e = toNumber(_0x4927d2.endSec, _0x41a73e);
    return Math.max(_0x41a73e, Math.min(_0x4c028e, _0x41a73e + (toNumber(_0x327033, 0) - _0x1bdd6d)));
  }
  ['_audioClipLaneIndex'](_0x3aad9f = {}) {
    return normalizeMediaClipAudioLaneIndex(_0x3aad9f?.laneIndex);
  }
  ['_audioLaneCount'](_0x3bfed0 = this._audioTimelineClips(this._mediaClip.tracks?.audio), _0x582cd5 = {}) {
    const _0x34ba36 = Array.isArray(_0x3bfed0) ? _0x3bfed0 : [],
      _0x58192a = _0x34ba36.reduce(
        (_0x16bf44, _0x4ca918) => Math.max(_0x16bf44, this._audioClipLaneIndex(_0x4ca918)),
        0,
      ),
      _0x5514d1 = Number.isFinite(Number(_0x582cd5.previewLaneIndex))
        ? normalizeMediaClipAudioLaneIndex(_0x582cd5.previewLaneIndex)
        : 0;
    return Math.max(1, Math.min(MEDIA_CLIP_AUDIO_LANE_COUNT_MAX, Math.max(_0x58192a, _0x5514d1) + 1));
  }
  ['_setAudioLaneCountStyle'](_0xe2451, _0xf01a5e = 1) {
    if (!_0xe2451?.style) return;
    const _0x4a61a6 = Math.max(
        1,
        Math.min(MEDIA_CLIP_AUDIO_LANE_COUNT_MAX, Math.trunc(toNumber(_0xf01a5e, 1))),
      ),
      _0x25ee49 =
        _0x4a61a6 * MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX +
        Math.max(0, _0x4a61a6 - 1) * MEDIA_CLIP_AUDIO_LANE_GAP_PX,
      _0x25830e = (_0x1d8058, _0x22353c) => {
        if (typeof _0xe2451.style.setProperty === 'function')
          _0xe2451.style.setProperty(_0x1d8058, _0x22353c);
        else _0xe2451.style[_0x1d8058] = _0x22353c;
      };
    (_0x25830e('--media-clip-audio-lane-count', String(_0x4a61a6)),
      _0x25830e('--media-clip-audio-lane-height', MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + 'px'),
      _0x25830e('--media-clip-audio-lane-gap', MEDIA_CLIP_AUDIO_LANE_GAP_PX + 'px'),
      _0x25830e('--media-clip-audio-stack-height', _0x25ee49 + 'px'));
  }
  ['_setAudioSegmentLaneVisual'](_0x2edb5b, _0x44e228 = 0) {
    if (!_0x2edb5b?.style) return;
    const _0x48ea42 = normalizeMediaClipAudioLaneIndex(_0x44e228),
      _0x11f541 = _0x48ea42 * (MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + MEDIA_CLIP_AUDIO_LANE_GAP_PX);
    ((_0x2edb5b.dataset.audioLaneIndex = String(_0x48ea42)),
      typeof _0x2edb5b.style.setProperty === 'function'
        ? (_0x2edb5b.style.setProperty('--media-clip-audio-lane-index', String(_0x48ea42)),
          _0x2edb5b.style.setProperty('--media-clip-audio-lane-top', _0x11f541 + 'px'))
        : ((_0x2edb5b.style['--media-clip-audio-lane-index'] = String(_0x48ea42)),
          (_0x2edb5b.style['--media-clip-audio-lane-top'] = _0x11f541 + 'px')));
  }
  ['_audioLaneIndexFromDrag'](_0x4c968d = {}) {
    const _0x4ab6b4 = normalizeMediaClipAudioLaneIndex(_0x4c968d.startLaneIndex),
      _0x43274d = toNumber(_0x4c968d.latestClientY, _0x4c968d.startY) - toNumber(_0x4c968d.startY, 0);
    if (Math.abs(_0x43274d) < MEDIA_CLIP_AUDIO_LANE_DRAG_THRESHOLD_PX) return _0x4ab6b4;
    const _0x14d358 = MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + MEDIA_CLIP_AUDIO_LANE_GAP_PX,
      _0x4f46a4 = Math.round(_0x43274d / _0x14d358);
    return normalizeMediaClipAudioLaneIndex(_0x4ab6b4 + _0x4f46a4);
  }
  ['_previewSourceSecForTimelineSec'](_0x3f3921, _0x258566 = this._playheadSec) {
    if (_0x3f3921 === 'video') return this._videoSourceSecForPlayhead(_0x258566);
    if (_0x3f3921 === 'audio') return this._audioSourceSecForPlayhead(_0x258566);
    return _0x258566;
  }
  ['_applyTimelineSegmentRect'](_0x4c01a4, _0x1d1d25 = {}) {
    if (!_0x4c01a4) return;
    ((_0x4c01a4.style.left = toNumber(_0x1d1d25.leftPct, 0) + '%'),
      (_0x4c01a4.style.width = toNumber(_0x1d1d25.widthPct, 0) + '%'),
      (_0x4c01a4.style.right = ''));
  }
  ['_applyAudioTimelineSegmentRect'](_0x3b66ba, _0x42ea2c = {}) {
    if (!_0x3b66ba) return;
    ((_0x3b66ba.style.left = toNumber(_0x42ea2c.leftPct, 0) + '%'),
      (_0x3b66ba.style.right = Math.max(0, 100 - toNumber(_0x42ea2c.rightPct, 0)) + '%'),
      (_0x3b66ba.style.width = 'auto'));
  }
  ['_applyAudioTimelineTrimRect'](_0x67c650, _0x536c31 = {}) {
    this._applyAudioTimelineSegmentRect(_0x67c650, _0x536c31);
  }
  ['_timelinePreviewRangeRect'](_0x383437 = {}) {
    const _0x484c4d = toNumber(_0x383437.startSec, 0),
      _0x13b812 = Math.max(_0x484c4d, toNumber(_0x383437.endSec, _0x484c4d));
    if (_0x484c4d >= 0) return getMediaClipTimelineRangeRect(_0x383437);
    const _0xadbe42 = getMediaClipTimelineDisplayDuration(_0x383437.durationSec),
      _0x33746b = (_0x484c4d / _0xadbe42) * 100,
      _0x4f8de4 = (_0x13b812 / _0xadbe42) * 100;
    return {
      startSec: _0x484c4d,
      endSec: _0x13b812,
      leftPct: _0x33746b,
      rightPct: _0x4f8de4,
      widthPct: Math.max(0, _0x4f8de4 - _0x33746b),
    };
  }
  ['_timelineCursorHost'](_0x106b19 = null) {
    return (
      _0x106b19?.closest?.('.media-clip-compact-timeline') ||
      this.el?.querySelector?.('.media-clip-compact-timeline') ||
      _0x106b19
    );
  }
  ['_syncTimelineCursorLayerForRow'](_0x257567 = null) {
    if (!_0x257567) return;
    const _0x27ae8d = this._timelineCursorHost(_0x257567),
      _0x44903a = Math.max(240, readLayoutWidthPx(_0x257567, this._timelineTrackContentWidth()));
    _0x27ae8d?.style?.setProperty?.('--media-clip-track-content-width', _0x44903a + 'px');
    const _0x38e369 = _0x27ae8d?.querySelector?.('.media-clip-timeline-cursors');
    if (_0x38e369?.style) _0x38e369.style.width = _0x44903a + 'px';
  }
  ['_updateTimelineSegmentLabel'](_0x26772c, _0x153eda = 0) {
    const _0x5a3e7a = _0x26772c?.querySelector?.('.media-clip-material-label');
    if (!_0x5a3e7a) return;
    _0x5a3e7a.textContent = formatDurationLabel(_0x153eda);
  }
  ['_syncAudioSegmentWaveformViewport'](_0x416897, _0x4b03bf = {}) {
    const _0x4e2df5 = _0x416897?.querySelector?.('.media-clip-wave-svg');
    if (!_0x4e2df5) return;
    const _0x15faa0 = _0x416897?.querySelector?.('.media-clip-wave-source') || _0x4e2df5,
      _0x147367 = getMediaClipWaveformViewport(_0x4b03bf),
      _0x4f179 = formatWaveformPct(_0x147367.widthPct) + '%',
      _0x55f466 = _0x147367.marginLeftPct > 0 ? '-' + formatWaveformPct(_0x147367.marginLeftPct) + '%' : '0';
    (_0x4e2df5.setAttribute('viewBox', getMediaClipWaveformViewBox()),
      _0x4e2df5.setAttribute('width', '100%'),
      _0x15faa0?.style &&
        ((_0x15faa0.style.width = _0x4f179),
        (_0x15faa0.style.marginLeft = _0x55f466),
        (_0x15faa0.style.transform = 'none'),
        (_0x15faa0.style.transformOrigin = '')),
      _0x4e2df5.style &&
        ((_0x4e2df5.style.width = '100%'),
        (_0x4e2df5.style.marginLeft = '0'),
        (_0x4e2df5.style.transform = 'none'),
        (_0x4e2df5.style.transformOrigin = '')));
  }
  ['_applyVideoTimelinePreview'](_0x51ec02, _0x2f0244 = [], _0xa7ee0f = 0) {
    const _0x1fdb7b = Array.isArray(_0x2f0244) ? _0x2f0244 : [];
    if (!_0x51ec02 || !_0x1fdb7b.length) return 0;
    let _0x316dd3 = 0;
    return (
      _0x51ec02.querySelectorAll?.('.media-clip-segment')?.forEach((_0x1ca968) => {
        const _0x5702be = this._segmentClipIndex(_0x1ca968, 'video', _0x1fdb7b),
          _0x194c2f = _0x1fdb7b[_0x5702be];
        if (!_0x194c2f) return;
        const _0x5f28a9 = toNumber(_0x194c2f.timelineStartSec, 0),
          _0x41dbff = Math.max(_0x5f28a9, toNumber(_0x194c2f.timelineEndSec, _0x5f28a9)),
          _0x40559c = Math.max(0, _0x41dbff - _0x5f28a9);
        (this._applyTimelineSegmentRect(
          _0x1ca968,
          this._timelinePreviewRangeRect({ startSec: _0x5f28a9, endSec: _0x41dbff, durationSec: _0xa7ee0f }),
        ),
          this._updateTimelineSegmentLabel(_0x1ca968, _0x40559c),
          (_0x316dd3 += 1));
      }),
      _0x316dd3
    );
  }
  ['_applyAudioTimelinePreview'](_0x2a282b, _0x4e3dcc = [], _0x5e5b6f = 0) {
    const _0xb1ddb7 = Array.isArray(_0x4e3dcc) ? _0x4e3dcc : [];
    if (!_0x2a282b || !_0xb1ddb7.length) return 0;
    const _0x3c2d85 = this._audioLaneCount(_0xb1ddb7);
    (this._setAudioLaneCountStyle(_0x2a282b, _0x3c2d85),
      this._setAudioLaneCountStyle(_0x2a282b.parentElement, _0x3c2d85),
      this._setAudioLaneCountStyle(_0x2a282b.closest?.('.media-clip-timeline-lane'), _0x3c2d85),
      this._setAudioLaneCountStyle(_0x2a282b.closest?.('.media-clip-compact-timeline'), _0x3c2d85));
    let _0x1221a9 = 0;
    return (
      _0x2a282b.querySelectorAll?.('.media-clip-segment')?.forEach((_0x23053f) => {
        const _0x423f79 = this._segmentClipIndex(_0x23053f, 'audio', _0xb1ddb7),
          _0x299edf = _0xb1ddb7[_0x423f79];
        if (!_0x299edf) return;
        const _0x2afc02 = toNumber(_0x299edf.timelineStartSec, 0),
          _0x4d3f4f = Math.max(_0x2afc02, toNumber(_0x299edf.timelineEndSec, _0x2afc02)),
          _0x16d0bd = Math.max(0, _0x4d3f4f - _0x2afc02);
        (this._applyAudioTimelineSegmentRect(
          _0x23053f,
          this._timelinePreviewRangeRect({ startSec: _0x2afc02, endSec: _0x4d3f4f, durationSec: _0x5e5b6f }),
        ),
          this._updateTimelineSegmentLabel(_0x23053f, _0x16d0bd),
          this._setAudioSegmentLaneVisual(_0x23053f, this._audioClipLaneIndex(_0x299edf)),
          (_0x23053f.dataset.mutedClip = _0x299edf.muted === true ? 'true' : 'false'),
          (_0x23053f.dataset.disabledClip = _0x299edf.disabled === true ? 'true' : 'false'),
          _0x23053f.classList?.toggle?.('is-muted', _0x299edf.muted === true),
          _0x23053f.classList?.toggle?.('is-disabled', _0x299edf.disabled === true),
          this._syncAudioSegmentWaveformViewport(_0x23053f, _0x299edf),
          (_0x1221a9 += 1));
      }),
      _0x1221a9
    );
  }
  ['_setTimelinePlayheadFromPointer'](_0x245a91, _0x4e0d6b, _0x56e6ab, _0x2d54d1 = 0, _0x39214a = {}) {
    if (!_0x245a91 || !this._mediaClip.tracks?.[_0x4e0d6b]) return false;
    const _0x56da44 = this._timelineSecFromPointerEvent(_0x245a91, _0x56e6ab, _0x2d54d1);
    this._playheadSec = _0x56da44;
    const _0x297639 = this._mediaClip.activeTrack !== _0x4e0d6b;
    if (_0x4e0d6b === 'video') {
      if (_0x39214a.updateClipSelection !== false) {
        const _0x38b610 =
          _0x39214a.clipIndex == null
            ? this._clipIndexAtTimelineSec(_0x56da44)
            : Math.max(0, Math.trunc(toNumber(_0x39214a.clipIndex, 0)));
        this._setActiveClipIndex(_0x38b610);
        if (_0x39214a.selectClip !== false) this._selectClipIndex(_0x38b610);
      }
      _0x39214a.syncPreview !== false && this._syncVideoPreviewSourceForTimelineSec(_0x56da44);
    } else {
      if (_0x4e0d6b === 'audio') {
        const _0x33cbf8 =
          _0x39214a.clipIndex == null
            ? this._audioClipIndexAtTimelineSec(_0x56da44)
            : Math.max(0, Math.trunc(toNumber(_0x39214a.clipIndex, 0)));
        this._setActiveAudioClipIndex(_0x33cbf8);
        if (_0x39214a.selectClip !== false) this._selectAudioClipIndex(_0x33cbf8);
        _0x39214a.syncPreview !== false && this._syncAudioPreviewSourceForTimelineSec(_0x56da44);
      }
    }
    return (
      _0x297639 &&
        _0x39214a.updateActiveTrack !== false &&
        ((this._mediaClip = { ...this._mediaClip, activeTrack: _0x4e0d6b }),
        (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
        _0x39214a.persistActiveTrack !== false &&
          appStore.updateNodeData(this.id, { mediaClip: this._mediaClip })),
      this._updateTrackPlayheadVisual(_0x245a91, _0x2d54d1, { playheadSec: _0x56da44 }),
      _0x39214a.syncPreview !== false &&
        this._syncPreviewTime(_0x4e0d6b, this._previewSourceSecForTimelineSec(_0x4e0d6b, _0x56da44)),
      true
    );
  }
  ['_applyTimelinePlayheadModel'](_0x2948d6, _0x1e791a = {}) {
    if (!_0x2948d6) return;
    _0x2948d6.style.left = toNumber(_0x1e791a.leftPct, 0) + '%';
  }
  async ['_loadAudioWaveformPath'](_0x311497, _0x1d537b, _0x3fe742 = {}) {
    if (!_0x311497 || !_0x1d537b) return;
    const _0x253dbd = resolveMediaClipWaveformUrl(_0x3fe742),
      _0x2cb395 = resolveMediaClipAudioUrl(_0x3fe742);
    if (!_0x253dbd && !_0x2cb395) return;
    const _0x15f3db = [_0x253dbd, _0x2cb395, resolveMediaClipSourceKey(_0x3fe742)].join('|');
    if (_0x311497.dataset) _0x311497.dataset.waveformKey = _0x15f3db;
    const _0x258ed6 = {
      width: MEDIA_CLIP_WAVEFORM_WIDTH,
      height: MEDIA_CLIP_WAVEFORM_HEIGHT,
      samples: MEDIA_CLIP_WAVEFORM_SAMPLES,
    };
    let _0x4ddb21 = '';
    _0x253dbd && (_0x4ddb21 = await getWaveformBarsPathFromPersistedUrl(_0x253dbd, _0x258ed6));
    !_0x4ddb21 &&
      _0x2cb395 &&
      typeof window !== 'undefined' &&
      (_0x4ddb21 = await getWaveformBarsPathFromUrl(_0x2cb395, _0x258ed6));
    if (!_0x4ddb21) return;
    if (_0x311497.dataset?.waveformKey && _0x311497.dataset.waveformKey !== _0x15f3db) return;
    if (this.el?.isConnected === false) return;
    (_0x1d537b.setAttribute('d', _0x4ddb21), _0x311497.classList?.add('has-waveform'));
  }
  ['_renderTrack'](_0x37014f, _0x5abf49 = {}) {
    const _0xbe2952 = this._mediaClip.tracks?.[_0x37014f],
      _0x5f3970 =
        _0x37014f === 'video'
          ? getMediaClipTimelineDisplayDuration(
              _0x5abf49.durationSec ?? this._videoTimelineDuration(_0xbe2952),
            )
          : getMediaClipTimelineDisplayDuration(
              _0x5abf49.durationSec ?? this._timelineDurationForKind(_0x37014f),
            ),
      _0x14deff = this._mediaClip.activeTrack === _0x37014f,
      _0xb4c4f3 = _0x37014f === 'audio' ? this._audioTimelineClips(_0xbe2952) : [],
      _0x301878 = _0x37014f === 'audio' ? this._audioLaneCount(_0xb4c4f3) : 1,
      _0x2571a2 = document.createElement('div');
    ((_0x2571a2.className = 'media-clip-track media-clip-track-' + _0x37014f),
      _0x2571a2.classList.toggle('is-active', _0x14deff),
      _0x2571a2.classList.toggle('is-compact', _0x5abf49.compact === true));
    if (_0x37014f === 'audio') {
      ((_0x2571a2.dataset.audioLaneCount = String(_0x301878)),
        this._setAudioLaneCountStyle(_0x2571a2, _0x301878));
      for (let _0x2fba55 = 0; _0x2fba55 < _0x301878; _0x2fba55 += 1) {
        const _0x4aae01 = document.createElement('div');
        ((_0x4aae01.className = 'media-clip-audio-lane-guide'),
          (_0x4aae01.dataset.audioLaneIndex = String(_0x2fba55)),
          _0x4aae01.style.setProperty('--media-clip-audio-lane-index', String(_0x2fba55)),
          _0x4aae01.style.setProperty(
            '--media-clip-audio-lane-top',
            _0x2fba55 * (MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + MEDIA_CLIP_AUDIO_LANE_GAP_PX) + 'px',
          ),
          _0x2571a2.appendChild(_0x4aae01));
      }
    }
    this._setTimelineRowDuration(_0x2571a2, _0x5f3970);
    const _0x4b0f53 = toNumber(_0x5abf49.timelineWidthPx, 0);
    if (_0x4b0f53 > 0) _0x2571a2.style.width = Math.max(240, _0x4b0f53) + 'px';
    _0x2571a2.addEventListener('click', (_0x532e5f) => {
      _0x532e5f.stopPropagation();
      if (this._suppressTrackClick) {
        this._suppressTrackClick = false;
        return;
      }
      if (this._isTimelineControlTarget(_0x532e5f.target)) return;
      if (_0x5abf49.compact === true) {
        this._setMediaClipWithLayout({ ...this._mediaClip, expanded: true }, true);
        return;
      }
      if (!this._timelineEventSegment(_0x532e5f.target)) return;
      const _0x5946c5 = this._timelineRowDuration(_0x2571a2, _0x5f3970),
        _0x133657 = this._timelineSecFromPointerEvent(_0x2571a2, _0x532e5f, _0x5946c5),
        _0xc55646 =
          _0x37014f === 'video'
            ? this._setActiveClipIndex(this._clipIndexAtTimelineSec(_0x133657))
            : _0x37014f === 'audio'
              ? this._setActiveAudioClipIndex(this._audioClipIndexAtTimelineSec(_0x133657))
              : false;
      if (_0x37014f === 'audio') this._selectAudioClipIndex(this._activeAudioClipIndex);
      this._setActiveTrack(_0x37014f, _0x133657, { forceRender: _0xc55646 });
    });
    const _0x4789e5 = (_0x5b7c60, _0x5822d6) => {
        const _0x1f00fa = document.createElement('div');
        _0x1f00fa.className = 'media-clip-filmstrip';
        const _0x56ff8b = collectMediaClipFrameUrls(_0x5822d6),
          _0x444131 = getMediaClipFrameCount(this._estimateTimelineWidth(_0x5abf49), _0x5abf49);
        if (_0x56ff8b.length > 0)
          for (let _0x4ff21a = 0; _0x4ff21a < _0x444131; _0x4ff21a += 1) {
            const _0x49f0e8 = document.createElement('img');
            ((_0x49f0e8.className = 'media-clip-filmstrip-frame'),
              (_0x49f0e8.src = _0x56ff8b[_0x4ff21a % _0x56ff8b.length]),
              (_0x49f0e8.alt = ''),
              (_0x49f0e8.draggable = false),
              _0x49f0e8.addEventListener('error', () => fillFilmstripPlaceholder(_0x1f00fa, _0x444131), {
                once: true,
              }),
              _0x1f00fa.appendChild(_0x49f0e8));
          }
        else fillFilmstripPlaceholder(_0x1f00fa, _0x444131);
        _0x5b7c60.appendChild(_0x1f00fa);
      },
      _0x79399a = (_0x3b9d9d, _0x8418be = {}, _0x5ef2f7 = null) => {
        const _0x4caf14 = document.createElement('div');
        _0x4caf14.className = 'media-clip-wave';
        const _0x218edd = document.createElement('div');
        _0x218edd.className = 'media-clip-wave-source';
        const _0x28ee6f = createMediaClipSvgElement('svg');
        (setMediaClipSvgClass(_0x28ee6f, 'media-clip-wave-svg'),
          _0x28ee6f.setAttribute('width', '100%'),
          _0x28ee6f.setAttribute('height', '100%'),
          _0x28ee6f.setAttribute('viewBox', getMediaClipWaveformViewBox()),
          _0x28ee6f.setAttribute('preserveAspectRatio', 'none'));
        const _0x118117 = createMediaClipSvgElement('path');
        (setMediaClipSvgClass(_0x118117, 'media-clip-wave-path'),
          _0x118117.setAttribute('d', ''),
          _0x28ee6f.appendChild(_0x118117),
          _0x218edd.appendChild(_0x28ee6f),
          _0x4caf14.appendChild(_0x218edd),
          _0x3b9d9d.appendChild(_0x4caf14),
          this._syncAudioSegmentWaveformViewport(_0x3b9d9d, _0x8418be),
          void this._loadAudioWaveformPath(_0x4caf14, _0x118117, _0x5ef2f7));
      },
      _0xdbfe0 = (_0x5e6e00, _0x3e57e8 = {}) => {
        const _0x2382be = document.createElement('div');
        ((_0x2382be.className = 'media-clip-material-selection v2-video-clipselection'),
          (_0x2382be.style.left = '0%'),
          (_0x2382be.style.width = '100%'));
        const _0x537de8 = document.createElement('div');
        _0x537de8.className = 'media-clip-material-label v2-video-cliplabel';
        const _0xd68f31 = toNumber(_0x3e57e8.startSec ?? _0x3e57e8.timelineStartSec, 0),
          _0x8a6e8 = toNumber(_0x3e57e8.endSec ?? _0x3e57e8.timelineEndSec, _0xd68f31);
        ((_0x537de8.textContent = formatDurationLabel(Math.max(0, _0x8a6e8 - _0xd68f31))),
          _0x2382be.append(_0x537de8),
          _0x5e6e00.appendChild(_0x2382be));
      },
      _0x5f1ccc = ({
        rect: rect = {},
        source: source = null,
        clipIndex: clipIndex = 0,
        item: item = null,
      }) => {
        const _0x298517 = document.createElement('div');
        _0x298517.className = 'media-clip-segment media-clip-material-strip';
        _0x37014f === 'audio'
          ? this._applyAudioTimelineSegmentRect(_0x298517, rect)
          : this._applyTimelineSegmentRect(_0x298517, rect);
        _0x298517.dataset.clipIndex = String(clipIndex);
        const _0x484658 = normalizeText(item?.id);
        if (_0x484658) _0x298517.dataset.clipId = _0x484658;
        if (_0x37014f === 'video') {
          const _0x23a548 = this._visualClipKind(item, source);
          (_0x298517.classList.add('media-clip-segment-' + _0x23a548),
            (_0x298517.dataset.mediaKind = _0x23a548),
            clipIndex === this._clampVideoClipIndex() && (_0x298517.dataset.activeClip = 'true'),
            clipIndex === this._selectedClipIndex && (_0x298517.dataset.selectedClip = 'true'),
            _0x4789e5(_0x298517, source));
        } else
          (_0x298517.classList.add('media-clip-segment-audio'),
            (_0x298517.dataset.mediaKind = 'audio'),
            this._setAudioSegmentLaneVisual(_0x298517, this._audioClipLaneIndex(item)),
            (_0x298517.dataset.mutedClip = item?.muted === true ? 'true' : 'false'),
            (_0x298517.dataset.disabledClip = item?.disabled === true ? 'true' : 'false'),
            _0x298517.classList.toggle('is-muted', item?.muted === true),
            _0x298517.classList.toggle('is-disabled', item?.disabled === true),
            clipIndex === this._clampAudioClipIndex() && (_0x298517.dataset.activeClip = 'true'),
            clipIndex === this._selectedAudioClipIndex && (_0x298517.dataset.selectedClip = 'true'),
            _0x79399a(_0x298517, item, source));
        _0xdbfe0(_0x298517, item || {});
        if (_0x5abf49.compact !== true) {
          _0x298517.addEventListener('contextmenu', (_0x2f6766) => {
            const _0x330ce4 = this._segmentClipIndex(_0x298517, _0x37014f);
            if (_0x37014f === 'video')
              (this._setActiveClipIndex(_0x330ce4),
                this._selectClipIndex(_0x330ce4),
                this._syncTrackActiveClipChrome(_0x2571a2, _0x37014f));
            else
              _0x37014f === 'audio' &&
                (this._setActiveAudioClipIndex(_0x330ce4),
                this._selectAudioClipIndex(_0x330ce4),
                this._syncTrackActiveClipChrome(_0x2571a2, _0x37014f));
            this._openMaterialMenu(_0x37014f, _0x330ce4, _0x2f6766);
          });
          const _0x5cf3a5 = (_0x2216ac) => {
            if (this._timelineDrag()) return;
            const _0x3e4ca2 = this._segmentClipIndex(_0x298517, _0x37014f);
            this._setTimelineHoverSegment(_0x2571a2, _0x298517, _0x37014f, _0x3e4ca2);
            const _0x13c3ad = this._timelineRowDuration(_0x2571a2, _0x5f3970),
              _0x57edb = this._timelineSecFromPointerEvent(_0x2571a2, _0x2216ac, _0x13c3ad);
            this._previewTrackPlayhead(_0x2571a2, _0x37014f, _0x57edb, _0x13c3ad);
          };
          (_0x298517.addEventListener('pointerenter', _0x5cf3a5),
            _0x298517.addEventListener('pointermove', _0x5cf3a5),
            _0x298517.addEventListener('pointerleave', () => {
              if (!this._timelineDrag()) this._clearTimelineHoverState(_0x2571a2);
              this._restoreTrackPlayhead(_0x2571a2, _0x37014f);
            }),
            _0x298517.addEventListener('pointerdown', (_0x32adf1) => {
              const _0x1a3863 = this._segmentClipIndex(_0x298517, _0x37014f);
              if (_0x37014f === 'video')
                (this._setActiveClipIndex(_0x1a3863),
                  this._selectClipIndex(_0x1a3863),
                  this._syncTrackActiveClipChrome(_0x2571a2, _0x37014f));
              else
                _0x37014f === 'audio' &&
                  (this._setActiveAudioClipIndex(_0x1a3863),
                  this._selectAudioClipIndex(_0x1a3863),
                  this._syncTrackActiveClipChrome(_0x2571a2, _0x37014f));
              this._startSegmentDrag(_0x37014f, _0x32adf1, { ..._0x5abf49, clipIndex: _0x1a3863 });
            }));
        }
        return (_0x2571a2.appendChild(_0x298517), _0x298517);
      };
    if (_0x37014f === 'video') {
      const _0x1f3012 = this._videoTimelineClips(_0xbe2952);
      _0x1f3012.length
        ? _0x1f3012.forEach((_0x1acbce, _0xcfcccf) => {
            const _0x28797c = toNumber(_0x1acbce.timelineStartSec, 0),
              _0x486812 = Math.max(_0x28797c, toNumber(_0x1acbce.timelineEndSec, _0x28797c));
            _0x5f1ccc({
              rect: getMediaClipTimelineRangeRect({
                startSec: _0x28797c,
                endSec: _0x486812,
                durationSec: _0x5f3970,
              }),
              source: this._videoClipSource(_0x1acbce, _0xcfcccf),
              clipIndex: _0xcfcccf,
              item: _0x1acbce,
            });
          })
        : _0x5f1ccc({
            rect: getMediaClipTimelineRangeRect({
              startSec: _0xbe2952.startSec,
              endSec: _0xbe2952.endSec,
              durationSec: _0x5f3970,
            }),
            source: this._videoClipSource(_0x1f3012[0] || _0xbe2952, 0),
            clipIndex: 0,
            item: _0x1f3012[0] || _0xbe2952,
          });
    } else {
      const _0x50cb28 = _0xb4c4f3;
      _0x50cb28.length &&
        _0x50cb28.forEach((_0x362be3, _0x37736c) => {
          const _0x4251fb = toNumber(_0x362be3.timelineStartSec, 0),
            _0x1ad0a1 = Math.max(_0x4251fb, toNumber(_0x362be3.timelineEndSec, _0x4251fb));
          _0x5f1ccc({
            rect: getMediaClipTimelineRangeRect({
              startSec: _0x4251fb,
              endSec: _0x1ad0a1,
              durationSec: _0x5f3970,
            }),
            source: this._audioClipSource(_0x362be3, _0x37736c),
            clipIndex: _0x37736c,
            item: _0x362be3,
          });
        });
    }
    return (
      !_0x5abf49.compact && _0x14deff && this._syncTrackActiveClipChrome(_0x2571a2, _0x37014f),
      _0x2571a2
    );
  }
  ['_timelineSecFromPointerEvent'](_0x36b263, _0x5b0c4c, _0x161dea = 0) {
    const _0x36560a = _0x36b263?.getBoundingClientRect?.(),
      _0x1739e6 = Math.max(1, toNumber(_0x36560a?.width, readLayoutWidthPx(_0x36b263, 1))),
      _0x1a9fe6 = toNumber(_0x36560a?.left, 0);
    return getMediaClipTimelineSecFromClientX(_0x5b0c4c?.clientX, {
      durationSec: _0x161dea,
      trackLeftPx: _0x1a9fe6,
      trackWidthPx: _0x1739e6,
    });
  }
  ['_previewTrackPlayhead'](_0x1d5502, _0x27abd3, _0x2f5956 = 0, _0x55aba7 = 0) {
    if (!_0x1d5502 || this._playing || this._playPreviewPending) return;
    this._updateTimelineHoverPlayheadVisual(_0x1d5502, _0x55aba7, { playheadSec: _0x2f5956 });
    if (_0x27abd3 === 'video') this._syncVideoPreviewSourceForTimelineSec(_0x2f5956);
    else {
      if (_0x27abd3 === 'audio') this._syncAudioPreviewSourceForTimelineSec(_0x2f5956);
    }
    this._syncPreviewTime(_0x27abd3, this._previewSourceSecForTimelineSec(_0x27abd3, _0x2f5956));
  }
  ['_syncTimelineHoverPlayheadFromPointer'](_0x189f69, _0x101a2d, _0x564104 = 0) {
    if (!_0x189f69 || !_0x101a2d || this._playing || this._playPreviewPending) return;
    const _0x63327 = this._timelineSecFromPointerEvent(_0x189f69, _0x101a2d, _0x564104);
    this._updateTimelineHoverPlayheadVisual(_0x189f69, _0x564104, { playheadSec: _0x63327 });
  }
  ['_restoreTrackPlayhead'](_0x23ecbb, _0x2c0c46) {
    if (!_0x23ecbb || this._playing || this._playPreviewPending) return;
    (this._hideTimelineHoverPlayhead(_0x23ecbb), this._updatePlaybackVisuals(_0x2c0c46));
  }
  ['_restoreTimelinePlayheads']() {
    if (this._playing || this._playPreviewPending) return;
    (this._hideTimelineHoverPlayhead(),
      this._updatePlaybackVisuals('video'),
      this._updatePlaybackVisuals('audio'));
  }
  ['_syncTrackActiveClipChrome'](_0x3342e1, _0x4709e2) {
    if (!_0x3342e1 || _0x3342e1.classList?.contains('is-compact')) return;
    const _0x5d7067 = this._mediaClip.activeTrack === _0x4709e2,
      _0x250738 = _0x4709e2 === 'video' ? this._clampVideoClipIndex() : this._clampAudioClipIndex(),
      _0x38a494 =
        _0x4709e2 === 'video' ? this._clampSelectedClipIndex() : this._clampSelectedAudioClipIndex(),
      _0x57da54 = _0x4709e2 === 'audio' ? this._mediaClip.audioClips || [] : this._mediaClip.clips || [];
    _0x3342e1.querySelectorAll('.media-clip-segment').forEach((_0x560501) => {
      const _0x5e8cba = this._segmentClipIndex(_0x560501, _0x4709e2, _0x57da54);
      if (_0x4709e2 === 'video') {
        const _0x309723 = normalizeText(_0x57da54[_0x5e8cba]?.id);
        _0x560501.dataset.clipIndex = String(_0x5e8cba);
        if (_0x309723) _0x560501.dataset.clipId = _0x309723;
      } else {
        if (_0x4709e2 === 'audio') {
          const _0x3b7412 = normalizeText(_0x57da54[_0x5e8cba]?.id);
          _0x560501.dataset.clipIndex = String(_0x5e8cba);
          if (_0x3b7412) _0x560501.dataset.clipId = _0x3b7412;
        }
      }
      const _0x19ab95 = _0x5d7067 && _0x5e8cba === _0x250738,
        _0x4b1c89 = _0x5d7067 && _0x5e8cba === _0x38a494;
      _0x19ab95 ? (_0x560501.dataset.activeClip = 'true') : delete _0x560501.dataset.activeClip;
      _0x4b1c89 ? (_0x560501.dataset.selectedClip = 'true') : delete _0x560501.dataset.selectedClip;
      _0x560501.querySelectorAll('.media-clip-trim').forEach((_0x1fcf5f) => {
        (!_0x5d7067 || Math.trunc(toNumber(_0x1fcf5f.dataset.clipIndex, -1)) !== _0x5e8cba) &&
          _0x1fcf5f.remove();
      });
      if (!_0x5d7067) return;
      _0x560501
        .querySelectorAll('.media-clip-material-selection .media-clip-trim')
        .forEach((_0x4b74b1) => _0x4b74b1.remove());
      const _0x796f17 = _0x560501,
        _0x38504b = (_0x125c14) =>
          Array.from(_0x796f17.children).some((_0x4175bf) =>
            _0x4175bf.classList?.contains('media-clip-trim-' + _0x125c14),
          );
      (!_0x38504b('left') &&
        _0x796f17.appendChild(this._renderTrimHandle(_0x4709e2, 'left', { clipIndex: _0x5e8cba })),
        !_0x38504b('right') &&
          _0x796f17.appendChild(this._renderTrimHandle(_0x4709e2, 'right', { clipIndex: _0x5e8cba })));
    });
  }
  ['_renderTrimHandle'](_0x36b424, _0xce7227, _0xc386c1 = {}) {
    const _0x4f8e00 = document.createElement('button');
    ((_0x4f8e00.type = 'button'),
      (_0x4f8e00.className = 'media-clip-trim media-clip-trim-' + _0xce7227),
      (_0x4f8e00.dataset.clipIndex = String(Math.max(0, Math.trunc(toNumber(_0xc386c1.clipIndex, 0))))),
      _0x4f8e00.setAttribute('aria-label', mediaClipText(_0xce7227 === 'left' ? 'trim.left' : 'trim.right')));
    const _0x6413fe = document.createElement('span');
    return (
      (_0x6413fe.className = 'media-clip-trim-visual'),
      _0x6413fe.setAttribute('aria-hidden', 'true'),
      _0x4f8e00.appendChild(_0x6413fe),
      _0x4f8e00.addEventListener('pointerenter', () => {
        const _0x6d622e = _0x4f8e00.closest('.media-clip-segment'),
          _0x1bc32d = _0x6d622e?.closest('.media-clip-track') || null;
        (_0x6d622e?.querySelectorAll?.('.media-clip-trim.is-hovered')?.forEach((_0xc94b46) => {
          if (_0xc94b46 !== _0x4f8e00) _0xc94b46.classList.remove('is-hovered');
        }),
          _0x4f8e00.classList.add('is-hovered'));
        if (_0x6d622e) this._setTimelineHoverSegment(_0x1bc32d, _0x6d622e, _0x36b424, _0xc386c1.clipIndex);
      }),
      _0x4f8e00.addEventListener('pointerleave', () => {
        if (!this._timelineDrag()) _0x4f8e00.classList.remove('is-hovered');
      }),
      _0x4f8e00.addEventListener('pointerdown', (_0x39df4a) => {
        (stopPointer(_0x39df4a),
          this._cancelTimelineSettle(),
          this._stopTimelineDragAutoScroll(),
          (this._deferredTimelineDragNodeData = null),
          _0x4f8e00.classList.add('is-hovered'));
        try {
          _0x4f8e00.setPointerCapture?.(_0x39df4a.pointerId);
        } catch {}
        const _0x427582 = this._mediaClip.tracks?.[_0x36b424],
          _0x5e422c = Math.max(0, Math.trunc(toNumber(_0xc386c1.clipIndex, 0)));
        if (_0x36b424 === 'video') (this._setActiveClipIndex(_0x5e422c), this._selectClipIndex(_0x5e422c));
        else
          _0x36b424 === 'audio' &&
            (this._setActiveAudioClipIndex(_0x5e422c), this._selectAudioClipIndex(_0x5e422c));
        const _0x569b15 = _0x4f8e00.closest('.media-clip-segment'),
          _0x5f5923 = _0x569b15?.closest('.media-clip-track') || null,
          _0x3d3cce = _0x569b15?.closest('.media-clip-timeline-lane') || null,
          _0x32fb7c = _0x569b15?.closest('.media-clip-timeline-scroll') || null,
          _0x31e743 =
            _0x36b424 === 'audio'
              ? this._audioTimelineClips(_0x427582).map((_0x34b6c9) => ({ ..._0x34b6c9 }))
              : this._videoTimelineClips(_0x427582).map((_0x186d13) => ({ ..._0x186d13 })),
          _0x402e2f = this._resolveTimelineDragDuration(
            _0x36b424,
            _0x427582,
            _0x31e743,
            _0x569b15,
            _0x5e422c,
          );
        if (_0x569b15) this._setTimelineHoverSegment(_0x5f5923, _0x569b15, _0x36b424, _0x5e422c);
        (_0x569b15?.classList.add('is-trimming'),
          _0x5f5923?.classList.add('is-trimming'),
          _0x3d3cce?.classList.add('is-trimming'),
          _0x32fb7c?.classList.add('is-trimming'));
        const _0x2168a2 = this._nextTimelineDragSessionId();
        this._setTimelineDrag({
          sessionId: _0x2168a2,
          kind: _0x36b424,
          mode: 'trim',
          side: _0xce7227,
          clipIndex: _0x5e422c,
          startX: _0x39df4a.clientX,
          startTrack: { ...(_0x427582 || {}) },
          startClips: _0x31e743,
          startMediaClip: this._mediaClip,
          durationSec: _0x402e2f,
          startScrollLeft: toNumber(_0x32fb7c?.scrollLeft, 0),
          latestClientX: _0x39df4a.clientX,
          segmentEl: _0x569b15,
          rowEl: _0x5f5923,
          laneEl: _0x3d3cce,
          scrollEl: _0x32fb7c,
          pendingRange: null,
          pendingPlayheadSec: this._playheadSec,
          startPlayheadSec: this._playheadSec,
          hasMoved: false,
        });
        const _0x2cd218 = (_0x221447) => this._handleTrimDrag(_0x221447, _0x2168a2),
          _0x11088e = (_0x23e736) => {
            stopPointer(_0x23e736);
            if (!this._isTimelineDragSession(_0x2168a2)) return;
            const _0x53e7ca = this._timelineDrag();
            this._persistTimelineDragScroll(_0x53e7ca);
            if (_0x53e7ca?.kind === 'video' && _0x53e7ca.pendingRange) {
              const _0x59d0e5 = this._isVideoLeftTrimDrag(_0x53e7ca);
              this._commitVideoTrimDrag(_0x53e7ca, { persist: false });
              const _0x3b5f7e = this._videoTimelineDuration(this._mediaClip.tracks?.video),
                _0x4005d0 = getMediaClipTimelineDisplayDuration(
                  toNumber(_0x53e7ca.durationSec, toNumber(_0x53e7ca.previewDurationSec, _0x3b5f7e)),
                ),
                _0x3084ce = _0x53e7ca;
              this._detachDragListeners();
              if (_0x59d0e5) {
                const _0x3efea9 = {
                  durationSec: _0x4005d0,
                  persist: true,
                  commitHistory: true,
                  syncTimelineWidthAfterSettle: false,
                };
                this._animateTrackVisualsToCurrentState(_0x53e7ca.rowEl, 'video', { ..._0x3efea9 });
              } else
                (this._updateTrackVisuals('video', {
                  durationSec: _0x53e7ca.previewDurationSec,
                  syncTimelineWidth: false,
                }),
                  this._persistTimelineMediaClip({ commitHistory: true }));
              this._applyDeferredTimelineDragUpdate(_0x3084ce);
              return;
            }
            if (_0x53e7ca?.kind === 'audio' && _0x53e7ca.pendingRange) {
              this._commitAudioTrimDrag(_0x53e7ca, { persist: false });
              const _0x51bdfc = _0x53e7ca;
              (this._detachDragListeners(),
                this._updateTrackVisuals('audio', {
                  durationSec: _0x53e7ca.previewDurationSec,
                  syncTimelineWidth: false,
                }),
                this._persistTimelineMediaClip({ commitHistory: true }),
                this._applyDeferredTimelineDragUpdate(_0x51bdfc));
              return;
            }
            (appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }),
              (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }));
            const _0x458b3c = _0x53e7ca;
            (this._detachDragListeners(),
              this._render(),
              commit(),
              this._applyDeferredTimelineDragUpdate(_0x458b3c));
          };
        ((this._dragMove = _0x2cd218),
          (this._dragUp = _0x11088e),
          window.addEventListener('pointermove', _0x2cd218, true),
          window.addEventListener('pointerup', _0x11088e, { once: true, capture: true }));
      }),
      _0x4f8e00
    );
  }
  ['_detachDragListeners']() {
    if (this._dragMove) window.removeEventListener('pointermove', this._dragMove, true);
    if (this._dragUp) window.removeEventListener('pointerup', this._dragUp, true);
    this._stopTimelineDragAutoScroll();
    const _0x32f031 = this._timelineDrag();
    (_0x32f031?.segmentEl?.classList.remove('is-dragging'),
      _0x32f031?.segmentEl?.classList.remove('is-trimming'),
      _0x32f031?.segmentEl?.classList.remove('is-lane-preview'),
      _0x32f031?.segmentEl?.querySelectorAll?.('.media-clip-trim.is-hovered')?.forEach((_0x25709e) => {
        _0x25709e.classList.remove('is-hovered');
      }),
      _0x32f031?.rowEl?.classList.remove('is-trimming'),
      _0x32f031?.rowEl?.classList.remove('is-preview-dragging'),
      _0x32f031?.laneEl?.classList.remove('is-trimming'),
      _0x32f031?.laneEl?.classList.remove('is-moving'),
      _0x32f031?.timelineEl?.classList.remove('is-moving-material'),
      _0x32f031?.scrollEl?.classList.remove('is-trimming'),
      (this._dragMove = null),
      (this._dragUp = null),
      this._setTimelineDrag(null));
  }
  ['_startSegmentDrag'](_0x39d5c9, _0x57c427, _0x275ba0 = {}) {
    if (_0x275ba0.compact === true || _0x57c427.button !== 0) return;
    (stopPointer(_0x57c427),
      this._cancelTimelineSettle(),
      this._stopTimelineDragAutoScroll(),
      (this._deferredTimelineDragNodeData = null));
    const _0x56248b = this._mediaClip.tracks?.[_0x39d5c9];
    if (!_0x56248b) return;
    const _0x1292e8 = _0x57c427.currentTarget?.closest('.media-clip-track') || null,
      _0x4181f0 = _0x1292e8?.closest?.('.media-clip-timeline-scroll') || null,
      _0x5a32e1 = _0x1292e8?.closest?.('.media-clip-timeline-lane') || null,
      _0x43247b = _0x1292e8?.closest?.('.media-clip-compact-timeline') || null,
      _0x57bad6 =
        _0x39d5c9 === 'audio'
          ? this._audioTimelineClips(_0x56248b).map((_0x34e447) => ({ ..._0x34e447 }))
          : this._videoTimelineClips(_0x56248b).map((_0x237e78) => ({ ..._0x237e78 })),
      _0xad9f52 = Math.max(0, Math.trunc(toNumber(_0x275ba0.clipIndex, 0))),
      _0x3331ee = this._resolveTimelineDragDuration(
        _0x39d5c9,
        _0x56248b,
        _0x57bad6,
        _0x57c427.currentTarget,
        _0xad9f52,
      );
    if (_0x39d5c9 === 'video')
      (this._setActiveClipIndex(_0xad9f52),
        this._selectClipIndex(_0xad9f52),
        this._syncTrackActiveClipChrome(_0x57c427.currentTarget?.closest('.media-clip-track'), _0x39d5c9));
    else
      _0x39d5c9 === 'audio' &&
        (this._setActiveAudioClipIndex(_0xad9f52),
        this._selectAudioClipIndex(_0xad9f52),
        this._syncTrackActiveClipChrome(_0x57c427.currentTarget?.closest('.media-clip-track'), _0x39d5c9));
    try {
      _0x57c427.currentTarget?.setPointerCapture?.(_0x57c427.pointerId);
    } catch {}
    (_0x57c427.currentTarget?.classList.add('is-dragging'), _0x1292e8?.classList.add('is-preview-dragging'));
    const _0x119dbe = this._nextTimelineDragSessionId();
    this._setTimelineDrag({
      sessionId: _0x119dbe,
      kind: _0x39d5c9,
      mode: 'move',
      clipIndex: _0xad9f52,
      startX: _0x57c427.clientX,
      startY: _0x57c427.clientY,
      startLaneIndex: _0x39d5c9 === 'audio' ? this._audioClipLaneIndex(_0x57bad6[_0xad9f52]) : 0,
      startPlayheadSec: this._playheadSec,
      startTrack: { ..._0x56248b },
      startClips: _0x57bad6,
      startMediaClip: this._mediaClip,
      durationSec: _0x3331ee,
      startScrollLeft: toNumber(_0x4181f0?.scrollLeft, 0),
      latestClientX: _0x57c427.clientX,
      latestClientY: _0x57c427.clientY,
      segmentEl: _0x57c427.currentTarget,
      rowEl: _0x1292e8,
      laneEl: _0x5a32e1,
      timelineEl: _0x43247b,
      scrollEl: _0x4181f0,
      pendingDeltaSec: 0,
      pendingLaneIndex: _0x39d5c9 === 'audio' ? this._audioClipLaneIndex(_0x57bad6[_0xad9f52]) : 0,
      hasMoved: false,
    });
    const _0x2fcd63 = (_0x3ecf94) => this._handleTrimDrag(_0x3ecf94, _0x119dbe),
      _0x90058a = (_0x34ddc2) => {
        stopPointer(_0x34ddc2);
        if (!this._isTimelineDragSession(_0x119dbe)) return;
        const _0x1462f2 = this._timelineDrag();
        this._persistTimelineDragScroll(_0x1462f2);
        if (
          _0x1462f2?.hasMoved &&
          _0x1462f2.kind === 'video' &&
          _0x1462f2.startClips?.[_0x1462f2.clipIndex]
        ) {
          this._commitVideoSegmentDrag(_0x1462f2, { persist: false });
          const _0x47628c = _0x1462f2;
          (this._detachDragListeners(),
            this._animateTrackVisualsToCurrentState(_0x1462f2.rowEl, 'video', {
              durationSec: _0x1462f2.previewDurationSec,
              persist: true,
              commitHistory: true,
              syncTimelineWidthAfterSettle: false,
            }),
            this._applyDeferredTimelineDragUpdate(_0x47628c));
          return;
        }
        if (
          _0x1462f2?.hasMoved &&
          _0x1462f2.kind === 'audio' &&
          _0x1462f2.startClips?.[_0x1462f2.clipIndex]
        ) {
          this._commitAudioSegmentDrag(_0x1462f2, { persist: false });
          const _0x515832 = _0x1462f2;
          (this._detachDragListeners(),
            this._animateTrackVisualsToCurrentState(_0x1462f2.rowEl, 'audio', {
              durationSec: _0x1462f2.previewDurationSec,
              persist: true,
              commitHistory: true,
              syncTimelineWidthAfterSettle: false,
            }),
            this._applyDeferredTimelineDragUpdate(_0x515832));
          return;
        } else
          _0x1462f2?.hasMoved &&
            (appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }),
            (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
            commit());
        !_0x1462f2?.hasMoved &&
          ((this._suppressTrackClick = true),
          this._setTimelinePlayheadFromPointer(
            _0x1462f2?.rowEl,
            _0x1462f2?.kind,
            _0x34ddc2,
            _0x1462f2?.durationSec,
            { clipIndex: _0x1462f2?.clipIndex },
          ));
        const _0x13728d = _0x1462f2;
        this._detachDragListeners();
        if (_0x1462f2?.hasMoved) this._render();
        this._applyDeferredTimelineDragUpdate(_0x13728d);
      };
    ((this._dragMove = _0x2fcd63),
      (this._dragUp = _0x90058a),
      window.addEventListener('pointermove', _0x2fcd63, true),
      window.addEventListener('pointerup', _0x90058a, { once: true, capture: true }));
  }
  ['_handleTrimDrag'](_0x5906e2, _0x5bdb21 = null) {
    const _0x3248de = this._timelineDrag();
    if (!_0x3248de) return;
    if (_0x5bdb21 != null && _0x3248de.sessionId !== _0x5bdb21) return;
    (stopPointer(_0x5906e2),
      (_0x3248de.latestClientX = toNumber(_0x5906e2?.clientX, _0x3248de.latestClientX ?? _0x3248de.startX)),
      (_0x3248de.latestClientY = toNumber(_0x5906e2?.clientY, _0x3248de.latestClientY ?? _0x3248de.startY)),
      this._applyTimelineDragPreviewFromPointer(_0x3248de, _0x5906e2),
      this._scheduleTimelineDragAutoScroll(_0x3248de));
  }
  ['_applyTimelineDragPreviewFromPointer'](_0x14f0c7 = this._timelineDrag(), _0x30f5aa = {}) {
    if (!_0x14f0c7) return;
    const _0x373c92 = this._timelineRowForDrag(_0x14f0c7),
      _0x383b0e =
        _0x14f0c7.durationSec ??
        this._resolveTimelineDragDuration(
          _0x14f0c7.kind,
          _0x14f0c7.startTrack,
          _0x14f0c7.startClips,
          _0x14f0c7.segmentEl,
          _0x14f0c7.clipIndex,
        );
    if (_0x14f0c7.mode === 'move') {
      (this._syncTimelineHoverPlayheadFromPointer(_0x373c92, _0x30f5aa, _0x383b0e),
        this._handleSegmentDrag(_0x30f5aa));
      return;
    }
    _0x14f0c7.mode === 'trim' && this._hideTimelineHoverPlayhead(_0x373c92);
    const _0x398a43 = _0x373c92?.getBoundingClientRect(),
      _0x21630f = Math.max(1, toNumber(_0x398a43?.width, readLayoutWidthPx(_0x373c92, 1))),
      _0x495c7b = getMediaClipTimelineDeltaSecFromPx(this._timelineDragDeltaPx(_0x14f0c7, _0x30f5aa), {
        durationSec: _0x383b0e,
        trackWidthPx: _0x21630f,
      });
    if (_0x14f0c7.kind === 'video' && _0x14f0c7.startClips?.[_0x14f0c7.clipIndex]) {
      this._previewVideoTrimDrag(_0x14f0c7, _0x495c7b, _0x383b0e, _0x373c92);
      return;
    } else {
      if (_0x14f0c7.kind === 'audio' && _0x14f0c7.startClips?.[_0x14f0c7.clipIndex]) {
        this._previewAudioTrimDrag(_0x14f0c7, _0x495c7b, _0x383b0e, _0x373c92);
        return;
      } else {
        const _0x4ca500 =
          _0x14f0c7.side === 'left'
            ? { startSec: _0x14f0c7.startTrack.startSec + _0x495c7b }
            : { endSec: _0x14f0c7.startTrack.endSec + _0x495c7b };
        this._mediaClip = patchMediaClipTrackRange(this._mediaClip, _0x14f0c7.kind, _0x4ca500);
        const _0x208319 = this._mediaClip.tracks?.[_0x14f0c7.kind];
        _0x208319 && (this._playheadSec = _0x14f0c7.side === 'left' ? _0x208319.startSec : _0x208319.endSec);
      }
    }
    (!(_0x14f0c7.kind === 'audio' && _0x14f0c7.startClips?.[_0x14f0c7.clipIndex]) &&
      _0x14f0c7.kind !== 'video' &&
      this._updateTrackVisuals(_0x14f0c7.kind),
      this._syncPreviewTime(
        _0x14f0c7.kind,
        this._previewSourceSecForTimelineSec(_0x14f0c7.kind, this._playheadSec),
      ));
  }
  ['_previewVideoTrimDrag'](_0x5c6991, _0x20af83 = 0, _0x2800af = 0, _0x3a5597 = null) {
    const _0x9509f2 = _0x5c6991?.startClips?.[_0x5c6991.clipIndex],
      _0x4c661d = _0x5c6991?.segmentEl;
    if (!_0x9509f2 || !_0x4c661d) return;
    const _0x1e78a3 =
        _0x5c6991.side === 'left'
          ? { startSec: _0x9509f2.startSec + _0x20af83 }
          : { endSec: _0x9509f2.endSec + _0x20af83 },
      _0x534ae7 = clampMediaClipRange({ ..._0x9509f2, ..._0x1e78a3 }, _0x9509f2.durationSec),
      _0x4d045f = getMediaClipTimelineDisplayDuration(_0x2800af);
    ((_0x5c6991.pendingRange = { startSec: _0x534ae7.startSec, endSec: _0x534ae7.endSec }),
      (_0x5c6991.pendingRollRange = null));
    const _0xaf57a4 = {
      ...this._mediaClip,
      clips: _0x5c6991.startClips,
      tracks: { ...(this._mediaClip.tracks || {}), video: _0x5c6991.startTrack },
    };
    this._isRollingVideoLeftTrimDrag(_0x5c6991) &&
      (_0x5c6991.pendingRollRange = { ..._0x5c6991.pendingRange });
    const _0x293237 = this._isRollingVideoLeftTrimDrag(_0x5c6991)
        ? rollMediaClipVisualLeftTrim(_0xaf57a4, _0x5c6991.clipIndex, _0x5c6991.pendingRange)
        : this._isVideoLeftTrimDrag(_0x5c6991)
          ? this._buildVideoLeftTrimPreviewState(_0x5c6991, _0x534ae7)
          : patchMediaClipClipRange(_0xaf57a4, _0x5c6991.clipIndex, _0x5c6991.pendingRange),
      _0x5f0462 = _0x293237.clips || _0x5c6991.startClips,
      _0x22b8c1 = _0x4d045f,
      _0x2761ed = _0x5f0462?.[_0x5c6991.clipIndex] || _0x9509f2;
    _0x5c6991.pendingRange = {
      startSec: toNumber(_0x2761ed.startSec, _0x534ae7.startSec),
      endSec: toNumber(_0x2761ed.endSec, _0x534ae7.endSec),
    };
    const _0x7758b5 = toNumber(_0x2761ed.timelineStartSec, 0),
      _0x3c4708 = Math.max(_0x7758b5, toNumber(_0x2761ed.timelineEndSec, _0x7758b5)),
      _0x28c8ff = Math.max(0, _0x3c4708 - _0x7758b5);
    !this._applyVideoTimelinePreview(_0x3a5597 || _0x5c6991.rowEl, _0x5f0462, _0x22b8c1) &&
      (this._applyTimelineSegmentRect(
        _0x4c661d,
        this._timelinePreviewRangeRect({ startSec: _0x7758b5, endSec: _0x3c4708, durationSec: _0x22b8c1 }),
      ),
      this._updateTimelineSegmentLabel(_0x4c661d, _0x28c8ff));
    ((_0x5c6991.previewDurationSec = _0x22b8c1),
      (_0x5c6991.pendingPlayheadSec = _0x5c6991.side === 'left' ? _0x7758b5 : _0x3c4708),
      (_0x5c6991.hasMoved = true));
    const _0xd2807f = this._videoTimelineMaterialEnd(_0x293237.tracks?.video, _0x293237.clips);
    (this._syncTimelineAddSlotForRow(_0x3a5597 || _0x5c6991.rowEl, {
      displayDurationSec: _0x22b8c1,
      materialEndSec: _0xd2807f,
    }),
      this._updateTrackPlayheadVisual(_0x3a5597 || _0x5c6991.rowEl, _0x22b8c1, {
        playheadSec: _0x5c6991.startPlayheadSec,
      }));
    const _0x38303f = toNumber(_0x5c6991.startPlayheadSec, this._playheadSec);
    (this._syncVideoPreviewSourceForTimelineSec(_0x38303f, { clips: _0x5f0462 }),
      this._syncPreviewTime('video', this._videoSourceSecForTimelineSec(_0x38303f, _0x5f0462)));
  }
  ['_previewAudioTrimDrag'](_0x5e6499, _0x10ee3b = 0, _0x434242 = 0, _0xdc115b = null) {
    const _0x3c1e1c = _0x5e6499?.startClips?.[_0x5e6499.clipIndex],
      _0x473a82 = _0x5e6499?.segmentEl;
    if (!_0x3c1e1c || !_0x473a82) return;
    const _0x3e8c44 =
        _0x5e6499.side === 'left'
          ? { startSec: _0x3c1e1c.startSec + _0x10ee3b }
          : { endSec: _0x3c1e1c.endSec + _0x10ee3b },
      _0x5356b0 = clampMediaClipRange({ ..._0x3c1e1c, ..._0x3e8c44 }, _0x3c1e1c.durationSec);
    _0x5e6499.pendingRange = { startSec: _0x5356b0.startSec, endSec: _0x5356b0.endSec };
    const _0x5ca75a = patchMediaClipAudioClipRange(
        {
          ...this._mediaClip,
          audioClips: _0x5e6499.startClips,
          tracks: { ...(this._mediaClip.tracks || {}), audio: _0x5e6499.startTrack },
        },
        _0x5e6499.clipIndex,
        _0x5e6499.pendingRange,
      ),
      _0x4f969a = _0x5ca75a.audioClips?.[_0x5e6499.clipIndex];
    if (!_0x4f969a) return;
    const _0x1c2eb8 = getMediaClipTimelineDisplayDuration(_0x434242),
      _0x546138 = toNumber(_0x4f969a.timelineStartSec, 0),
      _0x5b3ab6 = Math.max(_0x546138, toNumber(_0x4f969a.timelineEndSec, _0x546138)),
      _0x11b489 = Math.max(0, _0x5b3ab6 - _0x546138);
    (!this._applyAudioTimelinePreview(_0xdc115b || _0x5e6499.rowEl, _0x5ca75a.audioClips, _0x1c2eb8) &&
      (this._applyAudioTimelineSegmentRect(
        _0x473a82,
        getMediaClipTimelineRangeRect({ startSec: _0x546138, endSec: _0x5b3ab6, durationSec: _0x1c2eb8 }),
      ),
      this._updateTimelineSegmentLabel(_0x473a82, _0x11b489),
      this._syncAudioSegmentWaveformViewport(_0x473a82, _0x4f969a)),
      (_0x5e6499.previewDurationSec = _0x1c2eb8),
      (_0x5e6499.pendingPlayheadSec = _0x5e6499.side === 'left' ? _0x546138 : _0x5b3ab6),
      (_0x5e6499.hasMoved = true),
      this._updateTrackPlayheadVisual(_0xdc115b || _0x5e6499.rowEl, _0x1c2eb8, {
        playheadSec: _0x5e6499.startPlayheadSec,
      }),
      this._syncPreviewTime('audio', _0x5e6499.side === 'left' ? _0x5356b0.startSec : _0x5356b0.endSec));
  }
  ['_isVideoLeftTrimDrag'](_0x33a007 = null) {
    const _0x315949 = Math.max(0, Math.trunc(toNumber(_0x33a007?.clipIndex, 0)));
    return _0x33a007?.kind === 'video' && _0x33a007?.side === 'left' && !!_0x33a007?.startClips?.[_0x315949];
  }
  ['_isFirstVideoLeftTrimDrag'](_0x5f1ac7 = null) {
    return (
      this._isVideoLeftTrimDrag(_0x5f1ac7) && Math.max(0, Math.trunc(toNumber(_0x5f1ac7?.clipIndex, 0))) === 0
    );
  }
  ['_isRollingVideoLeftTrimDrag'](_0x1a4d7f = null) {
    return (
      this._isVideoLeftTrimDrag(_0x1a4d7f) && Math.max(0, Math.trunc(toNumber(_0x1a4d7f?.clipIndex, 0))) > 0
    );
  }
  ['_buildVideoLeftTrimPreviewState'](_0x4ccfa3 = {}, _0x37c61c = {}) {
    const _0x288fc5 = Array.isArray(_0x4ccfa3.startClips) ? _0x4ccfa3.startClips : [],
      _0x4052a5 = Math.max(0, Math.trunc(toNumber(_0x4ccfa3?.clipIndex, 0))),
      _0x8b714d = _0x288fc5[_0x4052a5] || {},
      _0x2b57ee = Math.max(
        0,
        toNumber(_0x37c61c.endSec, _0x8b714d.endSec) - toNumber(_0x37c61c.startSec, _0x8b714d.startSec),
      ),
      _0x5378df = Math.max(
        0,
        toNumber(
          _0x8b714d.timelineEndSec,
          toNumber(_0x8b714d.timelineStartSec, 0) +
            Math.max(0, toNumber(_0x8b714d.endSec, 0) - toNumber(_0x8b714d.startSec, 0)),
        ),
      ),
      _0x182f7b = _0x5378df - _0x2b57ee,
      _0x41b0cd = _0x182f7b + _0x2b57ee,
      _0x21fde7 = _0x288fc5.map((_0x54a9c2, _0x143694) =>
        _0x143694 === _0x4052a5
          ? {
              ..._0x54a9c2,
              startSec: _0x37c61c.startSec,
              endSec: _0x37c61c.endSec,
              timelineStartSec: Math.round(_0x182f7b * 0x3e8) / 0x3e8,
              timelineEndSec: Math.round(_0x41b0cd * 0x3e8) / 0x3e8,
            }
          : { ..._0x54a9c2 },
      );
    return {
      ...this._mediaClip,
      clips: _0x21fde7,
      tracks: {
        ...(this._mediaClip.tracks || {}),
        video: { ...(_0x4ccfa3.startTrack || {}), startSec: _0x37c61c.startSec, endSec: _0x37c61c.endSec },
      },
    };
  }
  ['_commitVideoTrimDrag'](_0x3244bd, _0x1c10c6 = {}) {
    const _0x2786b4 = _0x3244bd.pendingRollRange || _0x3244bd.pendingRange,
      _0x45d68d = this._isRollingVideoLeftTrimDrag(_0x3244bd),
      _0x522fe0 = {
        ...this._mediaClip,
        clips: _0x3244bd.startClips,
        tracks: { ...(this._mediaClip.tracks || {}), video: _0x3244bd.startTrack },
      };
    this._mediaClip = this._isRollingVideoLeftTrimDrag(_0x3244bd)
      ? rollMediaClipVisualLeftTrim(_0x522fe0, _0x3244bd.clipIndex, _0x2786b4, {
          rebaseNegativeTimeline: true,
          rebaseTimelineStart: _0x45d68d,
        })
      : patchMediaClipClipRange(_0x522fe0, _0x3244bd.clipIndex, _0x3244bd.pendingRange);
    const _0x5e9441 = normalizeText(_0x3244bd.startClips?.[_0x3244bd.clipIndex]?.id),
      _0xe947aa = _0x5e9441
        ? this._mediaClip.clips?.findIndex((_0x58fea9) => normalizeText(_0x58fea9?.id) === _0x5e9441)
        : _0x3244bd.clipIndex;
    _0xe947aa >= 0 && (this._setActiveClipIndex(_0xe947aa), this._selectClipIndex(_0xe947aa));
    const _0x55ad51 = this._mediaClip.clips?.[_0xe947aa >= 0 ? _0xe947aa : _0x3244bd.clipIndex];
    if (_0x55ad51) {
      const _0x1ad059 = this._videoTimelineDuration(this._mediaClip.tracks?.video),
        _0x126d09 = this._videoTimelineMaterialEnd(this._mediaClip.tracks?.video),
        _0x21a402 = getMediaClipTimelineDisplayDuration(
          toNumber(_0x3244bd.durationSec, toNumber(_0x3244bd.previewDurationSec, _0x1ad059)),
        ),
        _0x5e0faa = Math.max(0, Math.min(_0x21a402, toNumber(_0x3244bd.startPlayheadSec, this._playheadSec)));
      ((this._playheadSec = _0x5e0faa),
        this._syncTimelineAddSlotForRow(_0x3244bd.rowEl, {
          displayDurationSec: _0x21a402,
          materialEndSec: _0x126d09,
        }),
        this._syncVideoPreviewSourceForTimelineSec(this._playheadSec),
        this._syncPreviewTime('video', this._videoSourceSecForPlayhead(this._playheadSec)));
    }
    ((this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      _0x1c10c6.persist !== false && appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }));
  }
  ['_commitAudioTrimDrag'](_0x4b156b, _0x287ab0 = {}) {
    const _0x15b684 = {
      ...this._mediaClip,
      audioClips: _0x4b156b.startClips,
      tracks: { ...(this._mediaClip.tracks || {}), audio: _0x4b156b.startTrack },
    };
    this._mediaClip = patchMediaClipAudioClipRange(_0x15b684, _0x4b156b.clipIndex, _0x4b156b.pendingRange);
    const _0xa813c3 = normalizeText(_0x4b156b.startClips?.[_0x4b156b.clipIndex]?.id),
      _0x1fe8d8 = _0xa813c3
        ? this._mediaClip.audioClips?.findIndex((_0x2a716c) => normalizeText(_0x2a716c?.id) === _0xa813c3)
        : _0x4b156b.clipIndex;
    _0x1fe8d8 >= 0 && (this._setActiveAudioClipIndex(_0x1fe8d8), this._selectAudioClipIndex(_0x1fe8d8));
    const _0x5779dd = this._timelineDurationForKind('audio'),
      _0x17924f = getMediaClipTimelineDisplayDuration(
        toNumber(_0x4b156b.durationSec, toNumber(_0x4b156b.previewDurationSec, _0x5779dd)),
      );
    ((this._playheadSec = Math.max(
      0,
      Math.min(_0x17924f, toNumber(_0x4b156b.startPlayheadSec, this._playheadSec)),
    )),
      this._syncTimelineAddSlotForRow(_0x4b156b.rowEl, {
        displayDurationSec: _0x17924f,
        materialEndSec: this._timelineMaterialEndSec(),
      }),
      this._syncAudioPreviewSourceForTimelineSec(this._playheadSec),
      this._syncPreviewTime('audio', this._audioSourceSecForPlayhead(this._playheadSec)),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      _0x287ab0.persist !== false && appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }));
  }
  ['_handleSegmentDrag'](_0x3ab2ec) {
    const _0x5d44ed = this._timelineDrag();
    if (!_0x5d44ed) return;
    const _0x50955b = this._timelineRowForDrag(_0x5d44ed),
      _0x297458 = _0x50955b?.getBoundingClientRect(),
      _0x2ea405 = Math.max(1, toNumber(_0x297458?.width, readLayoutWidthPx(_0x50955b, 1))),
      _0x1b55f4 =
        _0x5d44ed.durationSec ??
        this._resolveTimelineDragDuration(
          _0x5d44ed.kind,
          _0x5d44ed.startTrack,
          _0x5d44ed.startClips,
          _0x5d44ed.segmentEl,
          _0x5d44ed.clipIndex,
        ),
      _0x27c83e = this._timelineDragDeltaPx(_0x5d44ed, _0x3ab2ec),
      _0x415ed2 =
        _0x5d44ed.kind === 'audio' && _0x5d44ed.mode === 'move'
          ? toNumber(_0x5d44ed.latestClientY, toNumber(_0x3ab2ec?.clientY, _0x5d44ed.startY)) -
            toNumber(_0x5d44ed.startY, 0)
          : 0,
      _0x2c4fef =
        _0x5d44ed.kind === 'audio' && _0x5d44ed.mode === 'move'
          ? Math.max(Math.abs(_0x27c83e), Math.abs(_0x415ed2))
          : Math.abs(_0x27c83e);
    if (!_0x5d44ed.hasMoved && _0x2c4fef <= 3) return;
    ((_0x5d44ed.hasMoved = true),
      _0x5d44ed.laneEl?.classList.add('is-moving'),
      _0x5d44ed.timelineEl?.classList.add('is-moving-material'),
      (this._suppressTrackClick = true));
    const _0x39d43b = getMediaClipTimelineDeltaSecFromPx(_0x27c83e, {
      durationSec: _0x1b55f4,
      trackWidthPx: _0x2ea405,
    });
    if (_0x5d44ed.kind === 'video' && _0x5d44ed.startClips?.[_0x5d44ed.clipIndex])
      this._previewVideoSegmentDrag(_0x5d44ed, _0x39d43b, _0x1b55f4);
    else {
      if (_0x5d44ed.kind === 'audio' && _0x5d44ed.startClips?.[_0x5d44ed.clipIndex])
        this._previewAudioSegmentDrag(_0x5d44ed, _0x39d43b, _0x1b55f4);
      else {
        const _0x15ad32 = {
          ...this._mediaClip,
          tracks: { ...(this._mediaClip.tracks || {}), [_0x5d44ed.kind]: _0x5d44ed.startTrack },
        };
        this._mediaClip = shiftMediaClipTrackRange(_0x15ad32, _0x5d44ed.kind, _0x39d43b);
        const _0x1ff11a = this._mediaClip.tracks?.[_0x5d44ed.kind];
        if (_0x1ff11a) {
          const _0x360de8 = _0x1ff11a.startSec - _0x5d44ed.startTrack.startSec;
          this._playheadSec = Math.max(
            _0x1ff11a.startSec,
            Math.min(_0x1ff11a.endSec, _0x5d44ed.startPlayheadSec + _0x360de8),
          );
        }
      }
    }
    (!(_0x5d44ed.kind === 'audio' && _0x5d44ed.startClips?.[_0x5d44ed.clipIndex]) &&
      _0x5d44ed.kind !== 'video' &&
      this._updateTrackVisuals(_0x5d44ed.kind),
      this._syncPreviewTime(
        _0x5d44ed.kind,
        this._previewSourceSecForTimelineSec(_0x5d44ed.kind, this._playheadSec),
      ));
  }
  ['_previewVideoSegmentDrag'](_0x958a8b, _0x4db1f4 = 0, _0x3974e4 = 0) {
    const _0x311d67 = _0x958a8b?.segmentEl,
      _0x299ed3 = _0x958a8b?.startClips?.[_0x958a8b.clipIndex];
    if (!_0x311d67 || !_0x299ed3) return;
    const _0x1a8253 = getMediaClipTimelineDisplayDuration(_0x3974e4),
      _0x265ef8 = toNumber(_0x299ed3.timelineStartSec, 0),
      _0x16e29e = Math.max(_0x265ef8, toNumber(_0x299ed3.timelineEndSec, _0x265ef8)),
      _0x5bd4db = Math.max(0.1, _0x16e29e - _0x265ef8),
      _0x210b79 = Math.max(0, Math.min(Math.max(0, _0x1a8253 - _0x5bd4db), _0x265ef8 + _0x4db1f4));
    (this._applyTimelineSegmentRect(
      _0x311d67,
      getMediaClipTimelineRangeRect({
        startSec: _0x210b79,
        endSec: _0x210b79 + _0x5bd4db,
        durationSec: _0x1a8253,
      }),
    ),
      this._updateTimelineSegmentLabel(_0x311d67, _0x5bd4db),
      (_0x958a8b.previewDurationSec = _0x1a8253),
      (_0x958a8b.pendingDeltaSec = _0x210b79 - _0x265ef8));
  }
  ['_previewAudioSegmentDrag'](_0x56d31a, _0x2b1327 = 0, _0x4083ca = 0) {
    const _0x161645 = _0x56d31a?.segmentEl,
      _0x5ddadd = _0x56d31a?.startClips?.[_0x56d31a.clipIndex];
    if (!_0x161645 || !_0x5ddadd) return;
    const _0x35e403 = getMediaClipTimelineDisplayDuration(_0x4083ca),
      _0x498c47 = toNumber(_0x5ddadd.timelineStartSec, 0),
      _0x1b25a2 = Math.max(_0x498c47, toNumber(_0x5ddadd.timelineEndSec, _0x498c47)),
      _0x24ae6c = Math.max(0.1, _0x1b25a2 - _0x498c47),
      _0x538c62 = Math.max(0, _0x498c47 + _0x2b1327),
      _0x10af82 = this._audioLaneIndexFromDrag(_0x56d31a),
      _0x5c09e3 = this._audioLaneCount(_0x56d31a.startClips, { previewLaneIndex: _0x10af82 });
    (this._setAudioSegmentLaneVisual(_0x161645, _0x10af82),
      _0x161645.classList?.toggle?.(
        'is-lane-preview',
        _0x10af82 !== normalizeMediaClipAudioLaneIndex(_0x56d31a.startLaneIndex),
      ),
      this._setAudioLaneCountStyle(_0x56d31a.rowEl, _0x5c09e3),
      this._setAudioLaneCountStyle(_0x56d31a.rowEl?.parentElement, _0x5c09e3),
      this._setAudioLaneCountStyle(_0x56d31a.laneEl, _0x5c09e3),
      this._setAudioLaneCountStyle(_0x56d31a.timelineEl, _0x5c09e3),
      this._setAudioLaneCountStyle(
        _0x56d31a.laneEl?.querySelector?.('.media-clip-audio-lane-controls'),
        _0x5c09e3,
      ),
      this._applyAudioTimelineSegmentRect(
        _0x161645,
        getMediaClipTimelineRangeRect({
          startSec: _0x538c62,
          endSec: _0x538c62 + _0x24ae6c,
          durationSec: _0x35e403,
        }),
      ),
      this._updateTimelineSegmentLabel(_0x161645, _0x24ae6c),
      (_0x56d31a.previewDurationSec = _0x35e403),
      (_0x56d31a.pendingDeltaSec = _0x538c62 - _0x498c47),
      (_0x56d31a.pendingLaneIndex = _0x10af82),
      (_0x56d31a.pendingPlayheadSec = Math.max(
        _0x538c62,
        Math.min(_0x538c62 + _0x24ae6c, _0x56d31a.startPlayheadSec + _0x56d31a.pendingDeltaSec),
      )));
  }
  ['_commitVideoSegmentDrag'](_0x1bbc29, _0x42c860 = {}) {
    const _0x253db9 = {
      ...this._mediaClip,
      clips: _0x1bbc29.startClips,
      tracks: { ...(this._mediaClip.tracks || {}), video: _0x1bbc29.startTrack },
    };
    this._mediaClip = moveMediaClipClipOnTimeline(_0x253db9, _0x1bbc29.clipIndex, _0x1bbc29.pendingDeltaSec);
    const _0x458244 = normalizeText(_0x1bbc29.startClips?.[_0x1bbc29.clipIndex]?.id),
      _0x415784 = _0x458244
        ? this._mediaClip.clips?.findIndex((_0x4f7fef) => normalizeText(_0x4f7fef?.id) === _0x458244)
        : -1;
    _0x415784 >= 0 && (this._setActiveClipIndex(_0x415784), this._selectClipIndex(_0x415784));
    const _0xf57387 = this._videoTimelineDuration(this._mediaClip.tracks?.video);
    ((this._playheadSec = Math.max(0, Math.min(_0xf57387, _0x1bbc29.startPlayheadSec))),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      _0x42c860.persist !== false && appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }));
  }
  ['_commitAudioSegmentDrag'](_0x3d7526, _0x22c629 = {}) {
    const _0x497b0c = {
      ...this._mediaClip,
      audioClips: _0x3d7526.startClips,
      tracks: { ...(this._mediaClip.tracks || {}), audio: _0x3d7526.startTrack },
    };
    this._mediaClip = moveMediaClipAudioClipOnTimeline(
      _0x497b0c,
      _0x3d7526.clipIndex,
      _0x3d7526.pendingDeltaSec,
      { laneIndex: _0x3d7526.pendingLaneIndex },
    );
    const _0x2a761f = normalizeText(_0x3d7526.startClips?.[_0x3d7526.clipIndex]?.id),
      _0x17e89f = _0x2a761f
        ? this._mediaClip.audioClips?.findIndex((_0x2cd2dd) => normalizeText(_0x2cd2dd?.id) === _0x2a761f)
        : _0x3d7526.clipIndex;
    _0x17e89f >= 0 && (this._setActiveAudioClipIndex(_0x17e89f), this._selectAudioClipIndex(_0x17e89f));
    const _0x50b195 = this._timelineDurationForKind('audio');
    ((this._playheadSec = Math.max(0, Math.min(_0x50b195, this._playheadSec))),
      this._syncTimelineAddSlotForRow(_0x3d7526.rowEl, {
        displayDurationSec: _0x3d7526.previewDurationSec,
        materialEndSec: this._timelineMaterialEndSec(),
      }),
      this._syncAudioPreviewSourceForTimelineSec(this._playheadSec),
      this._syncPreviewTime('audio', this._audioSourceSecForPlayhead(this._playheadSec)),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      _0x22c629.persist !== false && appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }));
  }
  ['_flushTimelineSettlePersist']() {
    if (!this._timelineSettlePendingPersist) return;
    const _0x2a229f = this._timelineSettlePendingCommit;
    ((this._timelineSettlePendingPersist = false),
      (this._timelineSettlePendingCommit = false),
      this._persistTimelineMediaClip({ commitHistory: _0x2a229f }));
  }
  ['_persistTimelineMediaClip'](_0x9871d2 = {}) {
    ((this._skipNextStoreMediaClipRender = true),
      appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }));
    if (_0x9871d2.commitHistory === true) commit();
  }
  ['_applyDeferredTimelineDragUpdate'](_0xf745f8 = null) {
    const _0x5d67ce = this._deferredTimelineDragNodeData;
    this._deferredTimelineDragNodeData = null;
    if (!_0x5d67ce || this._timelineDrag()) return;
    const _0x34166d = _0x5d67ce.mediaClip;
    if (isSameMediaClipState(_0x34166d, this._mediaClip)) return;
    if (_0xf745f8?.startMediaClip && isSameMediaClipState(_0x34166d, _0xf745f8.startMediaClip)) return;
    this.update(_0x5d67ce);
  }
  ['_scheduleTimelineSettleRender'](_0x2d66c6, _0x5432d0 = {}) {
    if (this._timelineSettleTimer) clearTimeout(this._timelineSettleTimer);
    this._timelineSettleRow = _0x2d66c6 || this._timelineSettleRow;
    const _0x470f56 = this._timelineSettleVersion;
    ((this._timelineSettlePendingPersist = this._timelineSettlePendingPersist || _0x5432d0.persist === true),
      (this._timelineSettlePendingCommit =
        this._timelineSettlePendingCommit || _0x5432d0.commitHistory === true),
      (this._timelineSettleTimer = setTimeout(() => {
        if (_0x470f56 !== this._timelineSettleVersion) return;
        this._timelineSettleTimer = 0;
        const _0x4a6858 = this._timelineSettleRow || _0x2d66c6;
        (_0x4a6858?.classList.remove('is-settling'),
          (this._timelineSettleRow = null),
          _0x5432d0.syncTimelineWidthAfterSettle !== false && this._syncTimelineContentWidth(),
          this._flushTimelineSettlePersist());
      }, TIMELINE_SETTLE_ANIMATION_MS)));
  }
  ['_animateTrackVisualsToCurrentState'](_0xec2665, _0x341048 = 'video', _0x34846e = {}) {
    const _0x27d429 = this._startTimelineSettle(_0xec2665),
      _0xeafba = { ..._0x34846e };
    _0xeafba.persist === true &&
      (this._persistTimelineMediaClip({ commitHistory: _0xeafba.commitHistory === true }),
      (_0xeafba.persist = false),
      (_0xeafba.commitHistory = false));
    const _0x5d6c5c = () => {
      if (_0x27d429 !== this._timelineSettleVersion || this._timelineDrag()) return;
      (this._updateTrackVisuals(_0x341048, { durationSec: _0xeafba.durationSec, syncTimelineWidth: false }),
        this._scheduleTimelineSettleRender(_0xec2665, _0xeafba));
    };
    if (typeof requestAnimationFrame === 'function')
      requestAnimationFrame(() => requestAnimationFrame(_0x5d6c5c));
    else setTimeout(_0x5d6c5c, 0);
  }
  ['_startTimelineSettle'](_0xe70805) {
    (this._cancelTimelineSettle(), (this._timelineSettleVersion += 1));
    if (this._timelineSettleTimer) {
      (clearTimeout(this._timelineSettleTimer), (this._timelineSettleTimer = 0));
      const _0x1d64dd = this._timelineSettleRow || _0xe70805;
      (_0x1d64dd?.classList.remove('is-settling'),
        (this._timelineSettleRow = null),
        this._flushTimelineSettlePersist());
    }
    return (
      (this._timelineSettleRow = _0xe70805 || null),
      _0xe70805?.classList.add('is-settling'),
      _0xe70805?.getBoundingClientRect?.(),
      this._timelineSettleVersion
    );
  }
  ['_cancelTimelineSettle'](_0x565895 = {}) {
    this._timelineSettleVersion = toNumber(this._timelineSettleVersion, 0) + 1;
    this._timelineSettleTimer && (clearTimeout(this._timelineSettleTimer), (this._timelineSettleTimer = 0));
    const _0x31b6d7 = this._timelineSettleRow;
    (_0x31b6d7?.classList.remove('is-settling'),
      (this._timelineSettleRow = null),
      _0x565895.flushPersist !== false
        ? this._flushTimelineSettlePersist()
        : ((this._timelineSettlePendingPersist = false), (this._timelineSettlePendingCommit = false)));
  }
  ['_updateTrackPlayheadVisual'](_0x5d8305, _0xffb36c = 0, _0x994744 = {}) {
    if (!_0x5d8305) return;
    const _0x55341a = this._timelineRowDuration(_0x5d8305, _0xffb36c);
    (this._setTimelineRowDuration(_0x5d8305, _0x55341a), this._syncTimelineCursorLayerForRow(_0x5d8305));
    const _0x2f0d00 = this._timelineCursorHost(_0x5d8305),
      _0x70229 =
        _0x2f0d00?.querySelector?.('.media-clip-playhead') ||
        _0x5d8305.querySelector?.('.media-clip-playhead');
    if (!_0x70229) return;
    this._applyTimelinePlayheadModel(
      _0x70229,
      getMediaClipTimelinePlayheadModel({
        playheadSec: _0x994744.playheadSec ?? this._playheadSec,
        durationSec: _0x55341a,
      }),
    );
  }
  ['_updateTimelineHoverPlayheadVisual'](_0x1d54ba, _0x52d2ce = 0, _0x3ecc91 = {}) {
    if (!_0x1d54ba) return;
    const _0x21d603 = this._timelineRowDuration(_0x1d54ba, _0x52d2ce);
    (this._setTimelineRowDuration(_0x1d54ba, _0x21d603), this._syncTimelineCursorLayerForRow(_0x1d54ba));
    const _0x45e98f = this._timelineCursorHost(_0x1d54ba),
      _0x23a2bf =
        _0x45e98f?.querySelector?.('.media-clip-hover-playhead') ||
        _0x1d54ba.querySelector?.('.media-clip-hover-playhead');
    if (!_0x23a2bf) return;
    ((_0x23a2bf.hidden = false),
      _0x23a2bf.classList?.add('is-visible'),
      this._applyTimelinePlayheadModel(
        _0x23a2bf,
        getMediaClipTimelinePlayheadModel({
          playheadSec: _0x3ecc91.playheadSec ?? this._playheadSec,
          durationSec: _0x21d603,
        }),
      ));
  }
  ['_hideTimelineHoverPlayhead'](_0x562ebf = null) {
    const _0x560bc9 = this._timelineCursorHost(_0x562ebf),
      _0xf7123b = [],
      _0x54e65b = _0x560bc9?.querySelectorAll
        ? _0x560bc9.querySelectorAll('.media-clip-hover-playhead')
        : this.el?.querySelectorAll?.('.media-clip-hover-playhead');
    _0x54e65b?.forEach?.((_0x1f57c) => _0xf7123b.push(_0x1f57c));
    const _0x6c954d =
      _0x560bc9?.querySelector?.('.media-clip-hover-playhead') ||
      _0x562ebf?.querySelector?.('.media-clip-hover-playhead');
    if (_0x6c954d && !_0xf7123b.includes(_0x6c954d)) _0xf7123b.push(_0x6c954d);
    _0xf7123b.forEach((_0x1955f4) => {
      (_0x1955f4.classList?.remove('is-visible'), (_0x1955f4.hidden = true));
    });
  }
  ['_clearTimelinePlaybackVisualLocks']() {
    const _0xb8ac1e = this.el;
    (_0xb8ac1e?.querySelectorAll?.('.media-clip-compact-timeline')?.forEach((_0x4317f7) => {
      _0x4317f7.classList?.remove('is-moving-material');
    }),
      _0xb8ac1e?.querySelectorAll?.('.media-clip-timeline-lane')?.forEach((_0x395477) => {
        (_0x395477.classList?.remove('is-moving'), _0x395477.classList?.remove('is-trimming'));
      }),
      _0xb8ac1e?.querySelectorAll?.('.media-clip-timeline-scroll')?.forEach((_0x83da13) => {
        _0x83da13.classList?.remove('is-trimming');
      }),
      _0xb8ac1e?.querySelectorAll?.('.media-clip-track')?.forEach((_0x4fcceb) => {
        (_0x4fcceb.classList?.remove('is-trimming'), _0x4fcceb.classList?.remove('is-preview-dragging'));
      }),
      _0xb8ac1e?.querySelectorAll?.('.media-clip-segment')?.forEach((_0x374bde) => {
        (_0x374bde.classList?.remove('is-dragging'), _0x374bde.classList?.remove('is-trimming'));
      }));
  }
  ['_updatePlaybackVisuals'](_0x2d8cb9) {
    const _0xeb9f83 = this._mediaClip.tracks?.[_0x2d8cb9],
      _0x1b1669 = this.el?.querySelector('.media-clip-track-' + _0x2d8cb9 + ':not(.is-compact)');
    if (!_0xeb9f83 || !_0x1b1669) return;
    const _0x31a733 = this._timelineDurationForKind(_0x2d8cb9);
    this._updateTrackPlayheadVisual(_0x1b1669, _0x31a733);
  }
  ['_updateTrackVisuals'](_0x329d1e, _0x3022d1 = {}) {
    const _0x1f5472 = this._mediaClip.tracks?.[_0x329d1e],
      _0x371a0c = this.el?.querySelector('.media-clip-track-' + _0x329d1e + ':not(.is-compact)');
    if (!_0x1f5472 || !_0x371a0c) return;
    const _0x31d0f9 =
      _0x329d1e === 'video'
        ? getMediaClipTimelineDisplayDuration(_0x3022d1.durationSec ?? this._videoTimelineDuration(_0x1f5472))
        : getMediaClipTimelineDisplayDuration(
            _0x3022d1.durationSec ?? this._timelineDurationForKind(_0x329d1e),
          );
    this._setTimelineRowDuration(_0x371a0c, _0x31d0f9);
    if (_0x329d1e === 'video' && _0x3022d1.syncTimelineWidth !== false)
      this._syncTimelineContentWidth(undefined, { durationSec: _0x31d0f9 });
    else
      _0x329d1e === 'video' && this._syncTimelineAddSlotForRow(_0x371a0c, { displayDurationSec: _0x31d0f9 });
    if (_0x329d1e === 'video' && (this._mediaClip.clips || []).length) {
      const _0x5a714c = this._mediaClip.clips || [];
      _0x371a0c.querySelectorAll('.media-clip-segment').forEach((_0x33fd11) => {
        const _0x366a5b = this._segmentClipIndex(_0x33fd11, _0x329d1e, _0x5a714c),
          _0x85d36 = _0x5a714c[_0x366a5b];
        if (!_0x85d36) return;
        _0x33fd11.dataset.clipIndex = String(_0x366a5b);
        const _0x229548 = normalizeText(_0x85d36.id);
        if (_0x229548) _0x33fd11.dataset.clipId = _0x229548;
        const _0x11074e = toNumber(_0x85d36.timelineStartSec, 0),
          _0x307541 = Math.max(_0x11074e, toNumber(_0x85d36.timelineEndSec, _0x11074e));
        (this._applyTimelineSegmentRect(
          _0x33fd11,
          this._timelinePreviewRangeRect({ startSec: _0x11074e, endSec: _0x307541, durationSec: _0x31d0f9 }),
        ),
          this._updateTimelineSegmentLabel(_0x33fd11, Math.max(0, _0x307541 - _0x11074e)));
      });
    } else {
      if (_0x329d1e === 'audio' && (this._mediaClip.audioClips || []).length) {
        const _0x4161ef = this._mediaClip.audioClips || [],
          _0xa56c9f = this._audioLaneCount(_0x4161ef);
        (this._setAudioLaneCountStyle(_0x371a0c, _0xa56c9f),
          this._setAudioLaneCountStyle(_0x371a0c.parentElement, _0xa56c9f),
          this._setAudioLaneCountStyle(_0x371a0c.closest?.('.media-clip-timeline-lane'), _0xa56c9f),
          this._setAudioLaneCountStyle(_0x371a0c.closest?.('.media-clip-compact-timeline'), _0xa56c9f),
          this._syncAudioLaneControls(_0x4161ef, _0xa56c9f),
          _0x371a0c.querySelectorAll('.media-clip-segment').forEach((_0x1b84ae) => {
            const _0x40fe75 = this._segmentClipIndex(_0x1b84ae, _0x329d1e, _0x4161ef),
              _0x465e50 = _0x4161ef[_0x40fe75];
            if (!_0x465e50) return;
            _0x1b84ae.dataset.clipIndex = String(_0x40fe75);
            const _0x4700ca = normalizeText(_0x465e50.id);
            if (_0x4700ca) _0x1b84ae.dataset.clipId = _0x4700ca;
            const _0x544e59 = toNumber(_0x465e50.timelineStartSec, 0),
              _0x1edb8c = Math.max(_0x544e59, toNumber(_0x465e50.timelineEndSec, _0x544e59));
            (this._applyAudioTimelineSegmentRect(
              _0x1b84ae,
              getMediaClipTimelineRangeRect({
                startSec: _0x544e59,
                endSec: _0x1edb8c,
                durationSec: _0x31d0f9,
              }),
            ),
              this._updateTimelineSegmentLabel(_0x1b84ae, Math.max(0, _0x1edb8c - _0x544e59)),
              this._setAudioSegmentLaneVisual(_0x1b84ae, this._audioClipLaneIndex(_0x465e50)),
              (_0x1b84ae.dataset.mutedClip = _0x465e50.muted === true ? 'true' : 'false'),
              (_0x1b84ae.dataset.disabledClip = _0x465e50.disabled === true ? 'true' : 'false'),
              _0x1b84ae.classList?.toggle?.('is-muted', _0x465e50.muted === true),
              _0x1b84ae.classList?.toggle?.('is-disabled', _0x465e50.disabled === true),
              this._syncAudioSegmentWaveformViewport(_0x1b84ae, _0x465e50));
          }));
      } else {
        const _0x5954cb = _0x371a0c.querySelector('.media-clip-segment');
        if (_0x5954cb) {
          const _0x4baecb = toNumber(_0x1f5472.startSec, 0),
            _0x39edc8 = Math.max(_0x4baecb, toNumber(_0x1f5472.endSec, _0x4baecb));
          _0x329d1e === 'audio'
            ? this._applyAudioTimelineSegmentRect(
                _0x5954cb,
                getMediaClipTimelineRangeRect({
                  startSec: _0x4baecb,
                  endSec: _0x39edc8,
                  durationSec: _0x31d0f9,
                }),
              )
            : this._applyTimelineSegmentRect(
                _0x5954cb,
                getMediaClipTimelineRangeRect({
                  startSec: _0x4baecb,
                  endSec: _0x39edc8,
                  durationSec: _0x31d0f9,
                }),
              );
          this._updateTimelineSegmentLabel(_0x5954cb, Math.max(0, _0x39edc8 - _0x4baecb));
          if (_0x329d1e === 'audio') this._syncAudioSegmentWaveformViewport(_0x5954cb, _0x1f5472);
        }
      }
    }
    (this._syncTrackActiveClipChrome(_0x371a0c, _0x329d1e),
      this._updateTrackPlayheadVisual(_0x371a0c, _0x31d0f9));
  }
  ['_primaryDuration'](_0x29cef0 = {}) {
    const _0xc6fa6e = this._mediaClip.tracks?.video,
      _0x1949d6 = this._mediaClip.tracks?.audio;
    return (
      (_0xc6fa6e ? this._videoTimelineDuration(_0xc6fa6e, null, _0x29cef0) : 0) ||
      this._audioTimelineDuration(_0x1949d6, null, _0x29cef0) ||
      10
    );
  }
  ['_refreshMediaClipTimelineInPlace']() {
    if (
      this._mediaClip.expanded !== true ||
      !(this._mediaClip.tracks?.video || this._mediaClip.tracks?.audio)
    ) {
      this._render();
      return;
    }
    this._rerenderCompactOnly();
    const _0x1a3096 = this._getPlaybackKind();
    if (_0x1a3096 === 'video')
      (this._syncVideoPreviewSourceForTimelineSec(this._playheadSec),
        this._syncPreviewTime('video', this._videoSourceSecForPlayhead(this._playheadSec), {
          immediate: true,
        }));
    else
      _0x1a3096 === 'audio' &&
        (this._setActiveAudioClipIndex(this._audioClipIndexAtTimelineSec(this._playheadSec)),
        this._syncAudioPreviewSourceForTimelineSec(this._playheadSec),
        this._syncPreviewTime('audio', this._audioSourceSecForPlayhead(this._playheadSec), {
          immediate: true,
        }));
    this._updatePreviewControls();
  }
  ['_edgeIdForMaterial'](_0x466047 = 'video', _0x258a08 = 0) {
    if (_0x466047 === 'audio') {
      const _0x3865bb = this._audioTimelineClips(this._mediaClip.tracks?.audio)[_0x258a08],
        _0x29b3e9 = this._audioClipSource(_0x3865bb, _0x258a08);
      return normalizeText(_0x29b3e9?.__mediaClipEdgeId);
    }
    const _0x19f989 = this._videoTimelineClips(this._mediaClip.tracks?.video)[_0x258a08],
      _0x15d4a7 = this._videoClipSource(_0x19f989, _0x258a08);
    return normalizeText(_0x15d4a7?.__mediaClipEdgeId);
  }
  ['_deleteActiveMaterial']() {
    const _0x253198 = this._mediaClip.activeTrack === 'audio' ? 'audio' : 'video',
      _0x26d875 =
        _0x253198 === 'video'
          ? this._clampSelectedClipIndex(this._selectedClipIndex) >= 0
            ? this._clampSelectedClipIndex(this._selectedClipIndex)
            : this._clampVideoClipIndex(this._activeClipIndex)
          : this._clampSelectedAudioClipIndex(this._selectedAudioClipIndex) >= 0
            ? this._clampSelectedAudioClipIndex(this._selectedAudioClipIndex)
            : this._clampAudioClipIndex(this._activeAudioClipIndex);
    this._deleteMaterial(_0x253198, _0x26d875);
  }
  ['_deleteMaterial'](_0x235fa4 = 'video', _0x4d7573 = 0) {
    if (this._timelineDrag()) return;
    const _0x6a1616 = _0x235fa4 === 'audio' ? 'audio' : 'video',
      _0x1cdb0e = this._mediaClip.activeTrack;
    (this._pausePreviewPlayback({ updateControls: false }), (this._materialMenu = null));
    let _0x2a2a59 = this._mediaClip,
      _0x1397f7 = '';
    if (_0x6a1616 === 'audio') {
      if (!this._mediaClip.tracks?.audio) return;
      const _0x2e6a6f = this._audioTimelineClips(this._mediaClip.tracks?.audio),
        _0x1f5831 = Math.max(0, Math.min(_0x2e6a6f.length - 1, Math.trunc(toNumber(_0x4d7573, 0)))),
        _0x292ef7 = _0x2e6a6f[_0x1f5831];
      if (!_0x292ef7) return;
      const _0x4c581e = this._audioClipSource(_0x292ef7, _0x1f5831),
        _0x467426 = normalizeText(_0x292ef7.sourceId || _0x4c581e?.id),
        _0x20b449 = normalizeText(_0x292ef7.sourceKey || resolveMediaClipLocalPath(_0x4c581e));
      ((_0x1397f7 = this._edgeIdForMaterial('audio', _0x1f5831)),
        (_0x2a2a59 = removeMediaClipAudioClip(this._mediaClip, _0x1f5831)));
      const _0x186227 = Array.isArray(_0x2a2a59.audioClips) ? _0x2a2a59.audioClips : [],
        _0x49697f = _0x186227.some((_0x4455c4) => {
          const _0x1e4161 = normalizeText(_0x4455c4?.sourceId),
            _0xf6e8af = normalizeText(_0x4455c4?.sourceKey);
          return (_0x467426 && _0x1e4161 === _0x467426) || (_0x20b449 && _0xf6e8af === _0x20b449);
        });
      if (_0x49697f) _0x1397f7 = '';
      ((this._activeAudioClipIndex = _0x186227.length
        ? Math.max(0, Math.min(_0x186227.length - 1, _0x1f5831))
        : 0),
        (this._selectedAudioClipIndex = _0x186227.length ? this._activeAudioClipIndex : -1),
        (_0x2a2a59 = {
          ..._0x2a2a59,
          activeTrack: _0x2a2a59.tracks?.video ? 'video' : _0x2a2a59.tracks?.audio ? 'audio' : 'video',
          expanded:
            !!(_0x2a2a59.tracks?.video || _0x2a2a59.tracks?.audio) && this._mediaClip.expanded === true,
        }));
    } else {
      const _0x4078e6 = this._videoTimelineClips(this._mediaClip.tracks?.video),
        _0x4db3e0 = Math.max(0, Math.min(_0x4078e6.length - 1, Math.trunc(toNumber(_0x4d7573, 0)))),
        _0x4c9fe5 = _0x4078e6[_0x4db3e0];
      if (!_0x4c9fe5) return;
      const _0x27d51b = this._videoClipSource(_0x4c9fe5, _0x4db3e0),
        _0x5cbfd5 = normalizeText(_0x4c9fe5.sourceId || _0x27d51b?.id),
        _0x48617e = normalizeText(_0x4c9fe5.sourceKey || resolveMediaClipLocalPath(_0x27d51b));
      ((_0x1397f7 = this._edgeIdForMaterial('video', _0x4db3e0)),
        (_0x2a2a59 = removeMediaClipClip(this._mediaClip, _0x4db3e0)));
      const _0x1af647 = Array.isArray(_0x2a2a59.clips) ? _0x2a2a59.clips : [],
        _0x4b2a1f = _0x1af647.some((_0x36e7ff) => {
          const _0x299ec5 = normalizeText(_0x36e7ff?.sourceId),
            _0x299a62 = normalizeText(_0x36e7ff?.sourceKey);
          return (_0x5cbfd5 && _0x299ec5 === _0x5cbfd5) || (_0x48617e && _0x299a62 === _0x48617e);
        });
      if (_0x4b2a1f) _0x1397f7 = '';
      ((this._activeClipIndex = _0x1af647.length
        ? Math.max(0, Math.min(_0x1af647.length - 1, _0x4db3e0))
        : 0),
        (this._selectedClipIndex = _0x1af647.length ? this._activeClipIndex : -1),
        (_0x2a2a59 = {
          ..._0x2a2a59,
          activeTrack: _0x2a2a59.tracks?.video ? 'video' : _0x2a2a59.tracks?.audio ? 'audio' : 'video',
          expanded:
            !!(_0x2a2a59.tracks?.video || _0x2a2a59.tracks?.audio) && this._mediaClip.expanded === true,
        }));
    }
    const _0x532b8e = _0x2a2a59.expanded !== true || _0x1cdb0e !== _0x2a2a59.activeTrack;
    this._setMediaClipWithLayout(_0x2a2a59, false, { render: false });
    _0x1397f7 &&
      typeof appStore.removeEdge === 'function' &&
      ((this._skipNextIncomingMediaClipRender = true),
      appStore.removeEdge(_0x1397f7),
      this._skipNextIncomingMediaClipRender === true && (this._skipNextIncomingMediaClipRender = false));
    commit();
    if (_0x532b8e) this._render();
    else this._refreshMediaClipTimelineInPlace();
  }
  ['_singleVisualClipExportTrack'](_0x239f0 = {}) {
    return singleVisualClipExportTrack(_0x239f0);
  }
  ['_exportVisualClips'](_0x771348 = this._mediaClip.tracks?.video) {
    return exportVisualClips(this, _0x771348);
  }
  ['_firstExportVideoSource'](_0x566740 = []) {
    return firstExportVideoSource(this, _0x566740);
  }
  ['_exportVisualDurationSec'](_0x4fa41e = []) {
    return exportVisualDurationSec(_0x4fa41e);
  }
  ['_exportAudioClips'](_0x266b8d = this._mediaClip.tracks?.audio) {
    return exportAudioClips(this, _0x266b8d);
  }
  ['_exportLoadingTargetElement']() {
    return exportLoadingTargetElement(this);
  }
  ['_startExportLoading'](_0x282006 = mediaClipText('export.loading')) {
    return startExportLoading(this, _0x282006);
  }
  ['_stopExportLoading']() {
    return stopExportLoading(this);
  }
  ['_waitForExportLoadingFrame']() {
    return waitForExportLoadingFrame();
  }
  async ['_exportMaterialToCanvas'](_0x20283e = 'video', _0x4f9def = 0) {
    return exportMaterialToCanvas(this, _0x20283e, _0x4f9def);
  }
  ['_renderDownloadMenu']() {
    return renderDownloadMenu(this);
  }
  async ['_exportAndUse'](_0x20f9ac) {
    return exportAndUse(this, _0x20f9ac);
  }
  ['_resolveOutputNodePosition'](_0x1691df, _0x3fcf2a) {
    return resolveOutputNodePosition(this, _0x1691df, _0x3fcf2a);
  }
  ['_addImageOutputNodeFromSource'](_0x4b01c5 = {}, _0x44b097 = {}) {
    return addImageOutputNodeFromSource(this, _0x4b01c5, _0x44b097);
  }
  ['_addOutputNode'](_0xc65534, _0x361730 = {}, _0x400319 = {}) {
    return addOutputNode(this, _0xc65534, _0x361730, _0x400319);
  }
}
