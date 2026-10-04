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
function mediaClipText(value, key = {}) {
  return t('mediaClip.' + value, key);
}
export {
  getMediaClipFrameCount,
  getMediaClipTimelineAddSlotLeftPx,
  getMediaClipTimelineContentWidthPx,
  getMediaClipTimelineDisplayDuration,
  shouldLockMediaClipTimelineWheelScroll,
} from './media-clip/mediaClipTimelineModel.js';
export class MediaClipNode {
  constructor(index) {
    ((this.nodeData = index || {}),
      (this.id = this.nodeData.id),
      (this._storyClipNodesContext = this.nodeData.storySequence ? appStore.getStateRaw().nodes : null),
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
  ['_createTimelineInteractionState'](options = {}) {
    return createTimelineInteractionState(options);
  }
  ['_timelineDrag']() {
    return getTimelineDrag(this);
  }
  ['_compactLayoutSize'](result = this._mediaClip) {
    return { width: MEDIA_CLIP_COMPACT_SIZE.width, height: MEDIA_CLIP_COMPACT_SIZE.height };
  }
  ['_nextTimelineDragSessionId']() {
    return nextTimelineDragSessionId(this);
  }
  ['_isTimelineDragSession'](data) {
    return isTimelineDragSession(this, data);
  }
  ['_setTimelineDrag'](value2 = null) {
    return setTimelineDrag(this, value2);
  }
  ['_setTimelineHoverSegment'](target, next, current = '', entry = -1) {
    return setTimelineHoverSegment(this, target, next, current, entry);
  }
  ['_clearTimelineHoverState'](record = this.el) {
    return clearTimelineHoverState(this, record);
  }
  ['mount']() {
    return (
      this.el.addEventListener('pointerdown', (event) => {
        (this._mediaClip.expanded === true ||
          event.target.closest('button, video, audio, .media-clip-menu')) &&
          event.stopPropagation();
      }),
      (this._unsubscribePick = appStore.subscribeSelector?.(
        (active) => ({
          active: active.pickConnectMode?.active === true,
          sourceNodeId: active.pickConnectMode?.sourceNodeId || '',
        }),
        () => this._render(),
      )),
      (this._unsubscribeInputs = appStore.subscribeSelector?.(
        (payload) => buildMediaClipIncomingSignature(payload, this.id),
        () => {
          const handle = this._skipNextIncomingMediaClipRender === true;
          this._skipNextIncomingMediaClipRender = false;
          const state = appStore.getState()?.nodes?.[this.id] || this.nodeData;
          ((this.nodeData = state), this._syncFromStore(state));
          if (handle) return;
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
  ['update'](config) {
    const scope = config || this.nodeData;
    if (this._timelineDrag()) {
      ((this._deferredTimelineDragNodeData = scope),
        (this.nodeData = { ...(scope || {}), mediaClip: this._mediaClip }));
      return;
    }
    if (this._skipNextStoreMediaClipRender && isSameMediaClipState(scope?.mediaClip, this._mediaClip)) {
      ((this._skipNextStoreMediaClipRender = false), (this.nodeData = scope));
      return;
    }
    if (
      (this._timelineSettleTimer || this._timelineSettleRow) &&
      isSameMediaClipState(scope?.mediaClip, this._mediaClip)
    ) {
      ((this._skipNextStoreMediaClipRender = false), (this.nodeData = scope));
      return;
    }
    if (this._isTimelinePresentationOnlyUpdate(scope)) {
      ((this._skipNextStoreMediaClipRender = false),
        (this.nodeData = { ...(scope || {}), mediaClip: this._mediaClip }));
      return;
    }
    ((this._skipNextStoreMediaClipRender = false),
      (this.nodeData = scope),
      this._syncFromStore(this.nodeData),
      this._render());
  }
  ['_isTimelinePresentationOnlyUpdate'](box = {}) {
    if (!box || !Object.prototype.hasOwnProperty.call(box, 'mediaClip')) return false;
    if (!isSameMediaClipState(box.mediaClip, this._mediaClip)) return false;
    const box2 = this.nodeData || {},
      toNumber2 = toNumber(box2.width, MEDIA_CLIP_COMPACT_SIZE.width),
      toNumber3 = toNumber(box2.height, MEDIA_CLIP_COMPACT_SIZE.height),
      toNumber4 = toNumber(box.width, toNumber2),
      toNumber5 = toNumber(box.height, toNumber3);
    return Math.abs(toNumber4 - toNumber2) <= 0.01 && Math.abs(toNumber5 - toNumber3) <= 0.01;
  }
  ['_syncFromStore'](box3) {
    const input = appStore.getState(),
      list = Object.values(input.edges || {})
        .filter((item2) => item2?.targetId === this.id)
        .sort((item3, output) => {
          const toNumber6 = toNumber(item3?.createdAt, 0),
            toNumber7 = toNumber(output?.createdAt, 0);
          if (toNumber6 !== toNumber7) return toNumber6 - toNumber7;
          return normalizeText(item3?.id).localeCompare(normalizeText(output?.id));
        })
        .map((item4) => {
          const args = input.nodes?.[item4.sourceId];
          return args ? { ...args, __mediaClipEdgeId: normalizeText(item4?.id) } : null;
        })
        .filter(Boolean),
      video = list.filter((item5) => {
        const mediaClipInputKind = getMediaClipInputKind(item5);
        return mediaClipInputKind === 'video' || mediaClipInputKind === 'image';
      }),
      audio = list.filter((item6) => getMediaClipInputKind(item6) === 'audio');
    this._sources = {
      video: video[0] || null,
      videos: video,
      audio: audio[0] || null,
      audios: audio,
    };
    const args2 = normalizeMediaClipState(box3, this._sources),
      timelineView = this._timelineViewPersistTimer
        ? normalizeMediaClipTimelineView(this._timelineView)
        : normalizeMediaClipTimelineView(args2.timelineView),
      mediaClip = { ...args2, timelineView: timelineView };
    ((this._timelineView = timelineView),
      (this._timelineScrollLeft = timelineView.scrollLeft),
      (this._mediaClip = mediaClip),
      (this._activeClipIndex = this._clampVideoClipIndex(this._activeClipIndex)),
      (this._selectedClipIndex = this._clampSelectedClipIndex(this._selectedClipIndex)),
      (this._activeAudioClipIndex = this._clampAudioClipIndex(this._activeAudioClipIndex)),
      (this._selectedAudioClipIndex = this._clampSelectedAudioClipIndex(this._selectedAudioClipIndex)));
    const value3 = !!(mediaClip.tracks?.video || mediaClip.tracks?.audio),
      box4 = this._compactLayoutSize(mediaClip),
      box5 = {};
    value3 && toNumber(box3?.width, box4.width) !== box4.width && (box5.width = box4.width);
    value3 && toNumber(box3?.height, box4.height) !== box4.height && (box5.height = box4.height);
    const value4 = { ...box5 };
    !isSameMediaClipState(box3?.mediaClip, mediaClip) && (value4.mediaClip = mediaClip);
    if (Object.keys(value4).length) appStore.updateNodeData(this.id, value4);
    this.nodeData = { ...(box3 || {}), ...box5, mediaClip: mediaClip };
    const value5 =
      mediaClip.tracks?.[mediaClip.activeTrack] || mediaClip.tracks?.video || mediaClip.tracks?.audio;
    value5 &&
      this._playheadSec <= 0 &&
      (this._playheadSec =
        mediaClip.activeTrack === 'video'
          ? this._videoTimelineStart(value5, mediaClip.clips)
          : value5.startSec);
  }
  ['_isPicking']() {
    const value6 = appStore.getState()?.pickConnectMode || {};
    return value6.active === true && value6.sourceNodeId === this.id;
  }
  ['_normalizeMediaClipWithTimelineView'](args3 = {}) {
    const timelineView2 = normalizeMediaClipTimelineView(args3.timelineView || this._timelineView);
    return (
      (this._timelineView = timelineView2),
      (this._timelineScrollLeft = timelineView2.scrollLeft),
      { ...args3, timelineView: timelineView2 }
    );
  }
  ['_updateTimelineView'](args4 = {}, render = {}) {
    const timelineView3 = normalizeMediaClipTimelineView({ ...this._timelineView, ...args4 });
    return (
      (this._timelineView = timelineView3),
      (this._timelineScrollLeft = timelineView3.scrollLeft),
      (this._mediaClip = { ...this._mediaClip, timelineView: timelineView3 }),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      render.persist === true &&
        this._scheduleTimelineViewPersist({ render: render.renderOnPersist !== false }),
      timelineView3
    );
  }
  ['_persistTimelineView'](options2 = {}) {
    const timelineView4 = normalizeMediaClipTimelineView(this._timelineView),
      mediaClip2 = { ...this._mediaClip, timelineView: timelineView4 };
    ((this._timelineView = timelineView4),
      (this._timelineScrollLeft = timelineView4.scrollLeft),
      (this._mediaClip = mediaClip2),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: mediaClip2 }));
    if (options2.render === false) this._skipNextStoreMediaClipRender = true;
    appStore.updateNodeData(this.id, { mediaClip: mediaClip2 });
    if (options2.render !== false) this._render();
  }
  ['_flushTimelineViewPersist'](options3 = {}) {
    if (!this._timelineViewPersistTimer) return false;
    (clearTimeout(this._timelineViewPersistTimer), (this._timelineViewPersistTimer = 0));
    const render2 =
      options3.render === false ? false : options3.render === true || this._timelineViewPersistRender;
    return ((this._timelineViewPersistRender = false), this._persistTimelineView({ render: render2 }), true);
  }
  ['_scheduleTimelineViewPersist'](options4 = {}) {
    if (this._timelineViewPersistTimer) clearTimeout(this._timelineViewPersistTimer);
    ((this._timelineViewPersistRender = this._timelineViewPersistRender || options4.render !== false),
      (this._timelineViewPersistTimer = setTimeout(() => {
        const render3 = this._timelineViewPersistRender;
        ((this._timelineViewPersistTimer = 0),
          (this._timelineViewPersistRender = false),
          this._persistTimelineView({ render: render3 }));
      }, TIMELINE_VIEW_PERSIST_DELAY_MS)));
  }
  ['_setMediaClip'](value7, value8 = false, value9 = {}) {
    const mediaClip3 = this._normalizeMediaClipWithTimelineView(value7);
    ((this._mediaClip = mediaClip3), (this.nodeData = { ...(this.nodeData || {}), mediaClip: mediaClip3 }));
    if (value9.render === false) this._skipNextStoreMediaClipRender = true;
    appStore.updateNodeData(this.id, { mediaClip: mediaClip3 });
    if (value8) commit();
    if (value9.render !== false) this._render();
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
  ['_setMediaClipWithLayout'](value10, value11 = false, value12 = {}) {
    if (value10.expanded === true && value12.claimExpanded !== false) this._claimExpandedEditor();
    else
      value10.expanded !== true &&
        (this._prepareTimelineForCollapse(), this._releaseExpandedEditor(), this._disposePreviewMedia());
    const args5 = this.nodeData || {},
      mediaClip4 = this._normalizeMediaClipWithTimelineView(value10),
      width2 = this._compactLayoutSize(mediaClip4),
      args6 = { width: width2.width, height: width2.height, mediaClip: mediaClip4 };
    ((this._mediaClip = args6.mediaClip), (this.nodeData = { ...args5, ...args6 }));
    if (value12.render === false) this._skipNextStoreMediaClipRender = true;
    appStore.updateNodeData(this.id, args6);
    if (value11) commit();
    if (value12.render !== false) this._render();
  }
  ['_setActiveTrack'](activeTrack, value13 = null, value14 = {}) {
    const enabled = this._mediaClip.tracks?.[activeTrack];
    if (!enabled) return;
    this._pausePreviewPlayback({ updateControls: false });
    const mediaClip5 = { ...this._mediaClip, activeTrack: activeTrack };
    this._playheadSec = value13 == null ? this._playheadSec : value13;
    const value15 = this._mediaClip.activeTrack !== activeTrack;
    ((this._mediaClip = mediaClip5), (this.nodeData = { ...(this.nodeData || {}), mediaClip: mediaClip5 }));
    value15 && appStore.updateNodeData(this.id, { mediaClip: mediaClip5 });
    value15 || value14.forceRender === true
      ? this._render()
      : this._updateTrackVisuals(activeTrack, { syncTimelineWidth: false });
    if (activeTrack === 'video') this._syncVideoPreviewSourceForTimelineSec(this._playheadSec);
    else
      activeTrack === 'audio' &&
        (this._setActiveAudioClipIndex(this._audioClipIndexAtTimelineSec(this._playheadSec)),
        this._syncAudioPreviewSourceForTimelineSec(this._playheadSec));
    this._syncPreviewTime(activeTrack, this._previewSourceSecForTimelineSec(activeTrack, this._playheadSec));
  }
  ['_togglePickConnect'](value16) {
    stopPointer(value16);
    const value17 = this._isPicking();
    if (value17) {
      appStore.setPickConnectMode({ active: false });
      return;
    }
    appStore.setPickConnectMode({ active: true, sourceNodeId: this.id, handleDirection: 'left' });
  }
  ['_setExpanded'](expanded, args7 = {}) {
    const value18 = { ...this._mediaClip, ...args7, expanded: expanded === true };
    this._setMediaClipWithLayout(value18, true);
  }
  ['_splitActiveMaterial'](value19 = this._getPlaybackKind()) {
    const activeTrack2 = value19 === 'audio' ? 'audio' : 'video',
      enabled2 = this._mediaClip.tracks?.[activeTrack2];
    if (!enabled2) return;
    const value20 = this._playheadSec,
      args8 =
        activeTrack2 === 'audio'
          ? splitMediaClipAudioAtTimelineSec(this._mediaClip, value20, generateId('split'))
          : splitMediaClipAtTimelineSec(this._mediaClip, value20, generateId('split'));
    if (isSameMediaClipState(args8, this._mediaClip)) {
      window.showToast?.(mediaClipText('toasts.splitAtMiddle'));
      return;
    }
    if (activeTrack2 === 'audio') {
      const value21 = this._audioClipIndexAtTimelineSec(value20 + 0.001, args8.audioClips);
      ((this._activeAudioClipIndex = value21), (this._selectedAudioClipIndex = value21));
    } else {
      const value22 = this._clipIndexAtTimelineSec(value20 + 0.001, args8.clips);
      ((this._activeClipIndex = value22), (this._selectedClipIndex = value22));
    }
    (this._pausePreviewPlayback({ updateControls: false }),
      this._setMediaClipWithLayout({ ...args8, activeTrack: activeTrack2, expanded: true }, true, {
        render: false,
      }),
      this._rerenderCompactOnly(),
      activeTrack2 === 'audio'
        ? (this._syncAudioPreviewSourceForTimelineSec(value20),
          this._syncPreviewTime('audio', this._audioSourceSecForPlayhead(value20), { immediate: true }))
        : (this._syncVideoPreviewSourceForTimelineSec(value20),
          this._syncPreviewTime('video', this._videoSourceSecForPlayhead(value20), { immediate: true })),
      this._updatePreviewControls());
  }
  ['_splitActiveVideoClip']() {
    this._splitActiveMaterial('video');
  }
  ['_getPlaybackKind']() {
    const value23 = this._mediaClip.activeTrack;
    if (this._mediaClip.tracks?.[value23]) return value23;
    if (this._mediaClip.tracks?.video) return 'video';
    if (this._mediaClip.tracks?.audio) return 'audio';
    return '';
  }
  ['_getPlaybackTrack'](value24 = this._getPlaybackKind()) {
    return value24 ? this._mediaClip.tracks?.[value24] || null : null;
  }
  ['_getVideoClipAtTimelineSec'](
    value25 = this._playheadSec,
    value26 = this._videoTimelineClips(this._mediaClip.tracks?.video),
  ) {
    const list2 = Array.isArray(value26) ? value26 : [];
    if (!list2.length) return null;
    return list2[this._clipIndexAtTimelineSec(value25, list2)] || list2[0];
  }
  ['_videoTimelineStart'](
    value27 = this._mediaClip.tracks?.video,
    value28 = this._videoTimelineClips(value27),
  ) {
    const list3 = Array.isArray(value28) ? value28 : [];
    if (list3.length)
      return list3.reduce(
        (item7, value29) => Math.min(item7, toNumber(value29.timelineStartSec, 0)),
        Number.POSITIVE_INFINITY,
      );
    return toNumber(value27?.startSec, 0);
  }
  ['_timelineDisplayEnd'](value30 = this._getPlaybackKind()) {
    if (value30 === 'video') return this._videoTimelineBaseDuration(this._mediaClip.tracks?.video);
    const value31 = this._mediaClip.tracks?.[value30];
    return toNumber(value31?.endSec || value31?.durationSec, 0);
  }
  ['_getPlaybackMedia'](value32 = this._getPlaybackKind()) {
    return value32 ? this._getPreviewMedia(value32) : null;
  }
  ['_isSecInsideTrack'](enabled3, value33) {
    if (!enabled3) return false;
    const toNumber8 = toNumber(value33, -1);
    return toNumber8 >= toNumber(enabled3.startSec, 0) && toNumber8 <= toNumber(enabled3.endSec, 0);
  }
  ['_cancelPlaybackLoop']() {
    const enabled4 = this._playbackRaf;
    if (!enabled4) return;
    try {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(enabled4);
    } catch {}
    try {
      clearTimeout(enabled4);
    } catch {}
    this._playbackRaf = 0;
  }
  ['_pausePreviewPlayback'](options5 = {}) {
    return pausePreviewPlayback(this, options5);
  }
  ['_resetPlaybackClock'](value34 = this._playheadSec) {
    return resetPlaybackClock(this, value34);
  }
  ['_playbackClockTimelineSec'](value35 = this._playheadSec) {
    return playbackClockTimelineSec(this, value35);
  }
  async ['_preparePreviewMediaForPlayback'](value36, value37 = null) {
    return preparePreviewMediaForPlayback(this, value36, value37);
  }
  ['_togglePreviewPlayback'](value38) {
    return togglePreviewPlayback(this, value38);
  }
  async ['_playPreview']() {
    return playPreview(this);
  }
  async ['_playReplacementAudioFromVideo'](value39) {
    return playReplacementAudioFromVideo(this, value39);
  }
  ['_syncReplacementAudioFromVideo'](value40, value41 = {}) {
    return syncReplacementAudioFromVideo(this, value40, value41);
  }
  ['_startPlaybackLoop'](value42) {
    return startPlaybackLoop(this, value42);
  }
  ['_setPreviewPlayIcon'](value43 = this._previewPlayButton) {
    return setPreviewPlayIcon(this, value43);
  }
  ['_updatePreviewControls']() {
    return updatePreviewControls(this);
  }
  ['_getPreviewMedia'](value44) {
    return value44 === 'audio' ? this._audioPreview : this._videoPreview;
  }
  ['_visualClipKind'](value45 = null, value46 = null) {
    const text = normalizeText(value45?.kind);
    if (text === 'image') return 'image';
    const mediaClipInputKind2 = getMediaClipInputKind(value46 || {});
    return mediaClipInputKind2 === 'image' ? 'image' : 'video';
  }
  ['_getVisualClipContextAtTimelineSec'](value47 = this._playheadSec, value48 = null) {
    const value49 = Array.isArray(value48)
        ? value48
        : this._videoTimelineClips(this._mediaClip.tracks?.video),
      index2 = this._clipIndexAtTimelineSec(value47, value49),
      clip = value49[index2] || this._getVideoClipAtTimelineSec(value47, value49),
      source2 = clip ? this._videoClipSource(clip, index2) : this._sources.video,
      clipKind = this._visualClipKind(clip, source2);
    return { clip: clip, index: index2, source: source2, clipKind: clipKind };
  }
  ['_resolveVideoPreviewSeekTarget']() {
    const toNumber9 = toNumber(this._pendingPreviewSeek?.video, Number.NaN);
    if (Number.isFinite(toNumber9)) return Math.max(0, toNumber9);
    return this._videoSourceSecForPlayhead(this._playheadSec || 0);
  }
  ['_getVideoPreviewContextAtTimelineSec'](value50 = this._playheadSec, value51 = null) {
    const value52 = this._getVisualClipContextAtTimelineSec(value50, value51),
      { clip: clip2, index: index3, source: source3, clipKind: clipKind2 } = value52,
      url = clipKind2 === 'image' ? resolveMediaClipImageUrl(source3) : resolveMediaClipVideoUrl(source3);
    return {
      clip: clip2,
      index: index3,
      clipKind: clipKind2,
      source: source3,
      url: url,
      posterUrl: resolveMediaClipThumbUrl(source3),
      sourceSec: clip2 ? this._videoSourceSecForTimelineSec(value50, value51) : value50,
    };
  }
  ['_syncVideoPreviewSourceForTimelineSec'](value53 = this._playheadSec, value54 = {}) {
    const el = this._videoPreview,
      response = this._getVideoPreviewContextAtTimelineSec(value53, value54.clips);
    if (!response.url) return false;
    if (response.clipKind === 'image') return (this._showPreviewImage(response.source, response.url), true);
    if (!el) return false;
    (this._showPreviewVideo(response.source),
      (el.__mediaClipFallbackHost ??= el.parentElement || null),
      (el.__mediaClipPosterUrl = response.posterUrl));
    if (response.posterUrl) el.poster = response.posterUrl;
    else el.removeAttribute?.('poster');
    this._applyPreviewVideoLayout(el.parentElement, response.source);
    const value55 = this._normalizePreviewSourceIdentity(
        firstNonEmpty(
          el.dataset?.desktopMediaSourceUrl,
          el.dataset?.mediaClipSourceUrl,
          el.getAttribute?.('src'),
          el.currentSrc,
          el.src,
        ),
      ),
      value56 = this._normalizePreviewSourceIdentity(response.url);
    value56 &&
      value55 !== value56 &&
      (this._showVideoSourceSwitchHold(el), el.classList?.add('is-source-switching'));
    const setMediaElementSource2 = setMediaElementSource(el, response.url);
    if (setMediaElementSource2)
      (this._cancelPendingVideoSourceSeek(el, { clearHold: false }),
        this._resetPreviewSeekState('video'),
        (el.__mediaClipPendingSourceSeek = {
          src: normalizeText(response.url),
          sec: Math.max(0, toNumber(response.sourceSec, 0)),
        }),
        el.classList?.add('is-source-switching'));
    else {
      const value57 = this._normalizePreviewSourceIdentity(el.__mediaClipPendingSourceSeek?.src);
      if (value57 && value57 === value56)
        ((el.__mediaClipPendingSourceSeek.sec = Math.max(0, toNumber(response.sourceSec, 0))),
          el.classList?.add('is-source-switching'));
      else !el.__mediaClipWaitingSourceSeek && this._clearVideoSourceSwitchHold(el);
    }
    return ((this._previewVideoSrc = response.url), setMediaElementSource2);
  }
  ['_getAudioClipContextAtTimelineSec'](value58 = this._playheadSec, value59 = {}) {
    const list4 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
      list5 = list4
        .map((clip3, index4) => ({ clip: clip3, index: index4 }))
        .filter(({ clip: clip4 }) =>
          value59.audibleOnly === true ? clip4?.muted !== true && clip4?.disabled !== true : true,
        ),
      toNumber10 = toNumber(value58, 0),
      count = list5.findIndex(({ clip: clip5 }, value60) => {
        const toNumber11 = toNumber(clip5.timelineStartSec, 0),
          value61 = Math.max(toNumber11, toNumber(clip5.timelineEndSec, toNumber11));
        return value60 === list5.length - 1
          ? toNumber10 >= toNumber11 && toNumber10 <= value61
          : toNumber10 >= toNumber11 && toNumber10 < value61;
      }),
      count2 =
        count >= 0 || value59.nearest === false
          ? count
          : this._audioClipIndexAtTimelineSec(
              value58,
              list5.map(({ clip: clip6 }) => clip6),
            ),
      value62 = value59.nearest === false ? null : list5[0] || null,
      value63 = count2 >= 0 ? list5[count2] || null : value62,
      clip7 = value63?.clip || null,
      index5 = value63?.index ?? -1,
      source4 = clip7
        ? this._audioClipSource(clip7, index5)
        : value59.nearest === false
          ? null
          : this._sources.audio;
    return {
      clip: clip7,
      index: index5,
      source: source4,
      url: resolveMediaClipAudioUrl(source4),
      sourceSec: clip7 ? this._audioClipSourceSec(clip7, value58) : value58,
    };
  }
  ['_syncAudioPreviewSourceForTimelineSec'](value64 = this._playheadSec) {
    const enabled5 = this._audioPreview;
    if (!enabled5) return false;
    this._videoPreview &&
      this._mediaClip.tracks?.audio &&
      (this._videoPreview.muted = this.nodeData?.storySequence?.version !== 2);
    const response2 = this._getAudioClipContextAtTimelineSec(value64, {
      audibleOnly: true,
      nearest: false,
    });
    enabled5.volume = Math.max(0, Math.min(1, toNumber(response2.clip?.volume, 1)));
    if (!response2.url) return (setMediaElementSource(enabled5, ''), (this._previewAudioSrc = ''), false);
    const setMediaElementSource3 = setMediaElementSource(enabled5, response2.url);
    if (setMediaElementSource3) this._resetPreviewSeekState('audio');
    return ((this._previewAudioSrc = response2.url), setMediaElementSource3);
  }
  ['_createPreviewSeekState'](args9 = {}) {
    return { lastAppliedSec: null, ...args9 };
  }
  ['_getPreviewSeekState'](value65) {
    if (!this._previewSeekState) this._previewSeekState = {};
    return (
      !this._previewSeekState[value65] && (this._previewSeekState[value65] = this._createPreviewSeekState()),
      this._previewSeekState[value65]
    );
  }
  ['_resetPreviewSeekState'](value66 = '') {
    const list6 = value66 ? [value66] : ['video', 'audio'];
    if (!this._previewSeekState) this._previewSeekState = {};
    list6.forEach((item8) => {
      (this._cancelPreviewSeek(item8), (this._previewSeekState[item8] = this._createPreviewSeekState()));
    });
  }
  ['_cancelPreviewSeek'](value67) {
    const enabled6 = this._previewSeekRaf?.[value67];
    if (!enabled6) return;
    try {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(enabled6);
    } catch {}
    try {
      clearTimeout(enabled6);
    } catch {}
    this._previewSeekRaf[value67] = 0;
  }
  ['_disposePreviewMedia'](enabled7 = '') {
    (!enabled7 || enabled7 === this._getPlaybackKind()) &&
      this._pausePreviewPlayback({ updateControls: false });
    const value68 = !enabled7 || enabled7 === 'video',
      value69 = !enabled7 || enabled7 === 'video' || enabled7 === 'image',
      value70 = !enabled7 || enabled7 === 'audio';
    value68 &&
      (this._resetPreviewSeekState('video'),
      this._clearVideoSourceSwitchHold(this._videoPreview),
      disposeMediaElement(this._videoPreview),
      this._videoPreview?.remove?.(),
      (this._videoPreview = null),
      (this._previewVideoSrc = ''));
    if (value69) {
      (this._imagePreview?.remove?.(), (this._imagePreview = null));
      if (this._previewVisualKind === 'image') this._previewVisualKind = '';
    }
    value70 &&
      (this._resetPreviewSeekState('audio'),
      disposeMediaElement(this._audioPreview),
      this._audioPreview?.remove?.(),
      (this._audioPreview = null),
      (this._previewAudioSrc = ''));
  }
  ['_schedulePreviewSeek'](value71, value72 = {}) {
    if (this._previewSeekRaf[value71]) return;
    const run =
      typeof requestAnimationFrame === 'function'
        ? (value73) => requestAnimationFrame(value73)
        : (value74) => setTimeout(value74, 16);
    this._previewSeekRaf[value71] = run(() => {
      ((this._previewSeekRaf[value71] = 0), this._applyPreviewSeek(value71, value72));
    });
  }
  ['_applyPreviewSeek'](value75, value76 = {}) {
    if (value75 === 'video' && this._previewVisualKind === 'image') {
      this._updatePreviewControls();
      return;
    }
    const enabled8 = value76.immediate === true || value76.allowDuringPlayback === true;
    if ((this._playing || this._playPreviewPending) && !enabled8) {
      ((this._pendingPreviewSeek[value75] = null), this._updatePreviewControls());
      return;
    }
    const el2 = this._getPreviewMedia(value75),
      value77 = Math.max(0, toNumber(this._pendingPreviewSeek[value75], 0));
    if (!el2) return;
    if (el2.readyState < 1) {
      !el2.__mediaClipSeekPending &&
        ((el2.__mediaClipSeekPending = true),
        el2.addEventListener(
          'loadedmetadata',
          () => {
            ((el2.__mediaClipSeekPending = false), this._applyPreviewSeek(value75, value76));
          },
          { once: true },
        ));
      return;
    }
    const value78 = this._getPreviewSeekState(value75),
      enabled9 = value76.immediate === true,
      value79 = Number.isFinite(el2.duration) && el2.duration > 0 ? Math.min(value77, el2.duration) : value77,
      toNumber12 = toNumber(el2.currentTime, value79),
      toNumber13 = toNumber(value78.lastAppliedSec, Number.NaN);
    if (
      !enabled9 &&
      (Math.abs(toNumber12 - value79) < PREVIEW_SCRUB_SEEK_EPSILON_SEC ||
        (Number.isFinite(toNumber13) && Math.abs(value79 - toNumber13) < PREVIEW_SCRUB_SEEK_EPSILON_SEC))
    ) {
      this._updatePreviewControls();
      return;
    }
    try {
      ((el2.currentTime = value79), (value78.lastAppliedSec = value79));
    } catch {}
    this._updatePreviewControls();
  }
  ['_syncPreviewTime'](value80, value81, value82 = {}) {
    const enabled10 = value82.immediate === true || value82.allowDuringPlayback === true;
    if ((this._playing || this._playPreviewPending) && !enabled10) return;
    const value83 = Math.max(0, toNumber(value81, 0));
    this._pendingPreviewSeek[value80] = value83;
    if (value80 === 'video' && this._previewVisualKind === 'image') {
      this._updatePreviewControls();
      return;
    }
    if (!this._getPreviewMedia(value80)) return;
    if (value82.immediate === true) {
      (this._cancelPreviewSeek(value80), this._applyPreviewSeek(value80, { immediate: true }));
      return;
    }
    this._schedulePreviewSeek(value80, value82);
  }
  ['_applyPendingVideoSourceSeek'](el3 = this._videoPreview) {
    const enabled11 = el3?.__mediaClipPendingSourceSeek;
    if (!enabled11 || typeof enabled11 !== 'object') return false;
    const text2 = normalizeText(enabled11.src),
      value84 = this._normalizePreviewSourceIdentity(
        firstNonEmpty(el3.dataset?.desktopMediaSourceUrl, el3.getAttribute?.('src'), el3.currentSrc, el3.src),
      ),
      value85 = this._normalizePreviewSourceIdentity(text2);
    if (value85 && value84 !== value85) return false;
    delete el3.__mediaClipPendingSourceSeek;
    const toNumber14 = toNumber(enabled11.sec, Number.NaN);
    if (!Number.isFinite(toNumber14)) return false;
    return (
      this._syncPreviewTime('video', Math.max(0, toNumber14), { immediate: true }),
      this._waitForPendingVideoSourceSeek(el3, toNumber14),
      true
    );
  }
  ['_normalizePreviewSourceIdentity'](value86) {
    const text3 = normalizeText(value86);
    if (!text3) return '';
    try {
      return new URL(text3, globalThis.location?.href || 'http://127.0.0.1/').href;
    } catch {
      return text3;
    }
  }
  ['_showVideoSourceSwitchHold'](el4 = this._videoPreview) {
    const el5 = el4?.parentElement;
    if (!el5 || !el4) return false;
    this._clearVideoSourceSwitchHold(el4);
    const box6 = document.createElement('canvas');
    box6.className = 'media-clip-source-switch-hold';
    const box7 = el4.getBoundingClientRect?.() || el5.getBoundingClientRect?.() || {},
      value87 = Math.max(1, Math.round(toNumber(el4.videoWidth, 0) || toNumber(box7.width, 0) || 1)),
      value88 = Math.max(1, Math.round(toNumber(el4.videoHeight, 0) || toNumber(box7.height, 0) || 1));
    ((box6.width = value87), (box6.height = value88));
    let value89 = false;
    try {
      const ctx = box6.getContext?.('2d');
      ctx && (ctx.drawImage(el4, 0, 0, value87, value88), (value89 = true));
    } catch {}
    return (
      value89 &&
        (el5.appendChild(box6),
        (el4.__mediaClipSourceSwitchHold = box6),
        (this._videoSourceSwitchHold = box6)),
      value89
    );
  }
  ['_clearVideoSourceSwitchHold'](el6 = this._videoPreview) {
    const el7 = el6?.__mediaClipSourceSwitchHold || this._videoSourceSwitchHold || null;
    (el7?.remove?.(),
      el6 && el7 && el6.__mediaClipSourceSwitchHold === el7 && delete el6.__mediaClipSourceSwitchHold,
      el7 && this._videoSourceSwitchHold === el7 && (this._videoSourceSwitchHold = null),
      el6?.classList?.remove('is-source-switching'));
  }
  ['_cancelPendingVideoSourceSeek'](el8 = this._videoPreview, value90 = {}) {
    if (!el8) return;
    const value91 = el8.__mediaClipSourceSeekFinish;
    if (value91)
      try {
        el8.removeEventListener?.('seeked', value91);
      } catch {}
    const value92 = el8.__mediaClipSourceSeekFallbackTimer;
    if (value92)
      try {
        clearTimeout(value92);
      } catch {}
    (delete el8.__mediaClipWaitingSourceSeek,
      delete el8.__mediaClipSourceSeekFinish,
      delete el8.__mediaClipSourceSeekFallbackTimer,
      delete el8.__mediaClipSourceSeekTargetSec,
      delete el8.__mediaClipSourceSeekToken);
    if (value90.clearHold !== false) this._clearVideoSourceSwitchHold(el8);
  }
  ['_waitForPendingVideoSourceSeek'](el9 = this._videoPreview, value93 = 0) {
    if (!el9) return;
    const value94 = Math.max(0, toNumber(value93, 0));
    el9.__mediaClipSourceSeekTargetSec = value94;
    if (value94 <= PREVIEW_SCRUB_SEEK_EPSILON_SEC) {
      this._finishPendingVideoSourceSeek(el9);
      return;
    }
    if (!el9.__mediaClipWaitingSourceSeek) {
      el9.__mediaClipWaitingSourceSeek = true;
      const value95 = () => this._finishPendingVideoSourceSeek(el9);
      ((el9.__mediaClipSourceSeekFinish = value95),
        el9.addEventListener?.('seeked', value95, { once: true }));
    }
    const value96 = el9.__mediaClipSourceSeekFallbackTimer;
    if (value96)
      try {
        clearTimeout(value96);
      } catch {}
    if (typeof setTimeout === 'function') {
      const toNumber15 = toNumber(el9.__mediaClipSourceSeekToken, 0) + 1;
      ((el9.__mediaClipSourceSeekToken = toNumber15),
        (el9.__mediaClipSourceSeekFallbackTimer = setTimeout(() => {
          if (el9.__mediaClipSourceSeekToken !== toNumber15) return;
          this._finishPendingVideoSourceSeek(el9);
        }, 250)));
    }
  }
  ['_finishPendingVideoSourceSeek'](el10 = this._videoPreview) {
    if (
      !el10?.__mediaClipWaitingSourceSeek &&
      !el10?.__mediaClipSourceSwitchHold &&
      !el10?.classList?.contains?.('is-source-switching')
    )
      return;
    const value97 = el10.__mediaClipSourceSeekFinish;
    if (value97)
      try {
        el10.removeEventListener?.('seeked', value97);
      } catch {}
    const value98 = el10.__mediaClipSourceSeekFallbackTimer;
    if (value98)
      try {
        clearTimeout(value98);
      } catch {}
    (delete el10.__mediaClipWaitingSourceSeek,
      delete el10.__mediaClipSourceSeekFinish,
      delete el10.__mediaClipSourceSeekFallbackTimer,
      delete el10.__mediaClipSourceSeekTargetSec,
      delete el10.__mediaClipSourceSeekToken,
      this._clearVideoSourceSwitchHold(el10));
    if (this._playing)
      try {
        el10.play?.()?.catch?.(() => {});
      } catch {}
    this._updatePreviewControls();
  }
  ['_render']() {
    if (!this.el) return;
    this._removeMaterialMenuPortal();
    const enabled12 = !!(this._mediaClip.tracks?.video || this._mediaClip.tracks?.audio),
      value99 = enabled12 && this._mediaClip.expanded === true;
    value99
      ? this._claimExpandedEditor()
      : ((this._materialMenu = null), this._releaseExpandedEditor(), this._disposePreviewMedia());
    (this.el.replaceChildren(),
      this.el.classList.toggle('is-picking', this._isPicking()),
      this.el.classList.toggle('is-expanded', value99),
      this._syncHostPresentation(value99),
      this._syncDocumentExitListener(value99),
      this._syncMaterialMenuDismissListener(value99 && !!this._materialMenu),
      this._syncDocumentKeyListener(value99),
      this._syncDeleteMaterialShortcutListener(value99));
    if (!enabled12) {
      this.el.appendChild(this._renderEmpty());
      return;
    }
    (value99
      ? this.el.append(this._renderCompact(), this._renderPreviewPanel())
      : this.el.appendChild(this._renderCompact()),
      value99 && this._materialMenu && this._renderMaterialMenuPortal(),
      this._exporting && this._startExportLoading());
  }
  ['_rerenderCompactOnly']() {
    if (!this.el) return false;
    const el11 = this.el.querySelector?.('.media-clip-compact'),
      el12 = el11?.parentNode;
    if (!el11 || !el12) return (this._render(), false);
    this._removeMaterialMenuPortal();
    const el13 = this._renderCompact();
    if (typeof el12.replaceChild === 'function') el12.replaceChild(el13, el11);
    else {
      if (Array.isArray(el12.children)) {
        const count3 = el12.children.indexOf(el11);
        count3 >= 0 &&
          ((el13.parentNode = el12), (el11.parentNode = null), el12.children.splice(count3, 1, el13));
      }
    }
    const value100 = !!(this._mediaClip.tracks?.video || this._mediaClip.tracks?.audio),
      value101 = value100 && this._mediaClip.expanded === true;
    return (
      this._syncDocumentExitListener(value101),
      this._syncMaterialMenuDismissListener(value101 && !!this._materialMenu),
      this._syncDocumentKeyListener(value101),
      this._syncDeleteMaterialShortcutListener(value101),
      value101 && this._materialMenu && this._renderMaterialMenuPortal(),
      true
    );
  }
  ['_syncHostPresentation'](value102) {
    const run2 = () => {
      const el14 = this.el?.closest?.('.v2-node-component') || this.el?.parentElement;
      el14?.style && (el14.style.overflow = 'visible');
      const el15 = document.getElementById(this.id);
      if (!el15?.style) return;
      el15.classList.toggle('media-clip-expanded-host', value102 === true);
      if (value102 === true) {
        el15.style.zIndex = MEDIA_CLIP_EXPANDED_HOST_Z_INDEX;
        return;
      }
      el15.style.zIndex =
        el15.classList.contains('selected') || el15.classList.contains('v2-selected') ? '100' : '10';
    };
    (run2(),
      !this.el?.parentElement && typeof requestAnimationFrame === 'function' && requestAnimationFrame(run2));
  }
  ['_syncDocumentExitListener'](enabled13) {
    if (typeof document === 'undefined') return;
    if (!enabled13) {
      this._onDocumentPointerDown &&
        (document.removeEventListener('pointerdown', this._onDocumentPointerDown, true),
        (this._onDocumentPointerDown = null));
      return;
    }
    if (this._onDocumentPointerDown) return;
    ((this._onDocumentPointerDown = (event2) => {
      if (this._mediaClip.expanded !== true) return;
      const value103 = document.getElementById(this.id);
      if (this.el?.contains?.(event2.target)) return;
      if (this._materialMenuEl?.contains?.(event2.target)) return;
      if (value103?.contains?.(event2.target)) {
        (event2.preventDefault?.(), event2.stopPropagation?.());
        return;
      }
      this._setExpanded(false);
    }),
      document.addEventListener('pointerdown', this._onDocumentPointerDown, true));
  }
  ['_syncMaterialMenuDismissListener'](enabled14) {
    if (typeof document === 'undefined') return;
    if (!enabled14) {
      this._onMaterialMenuPointerDown &&
        (document.removeEventListener('pointerdown', this._onMaterialMenuPointerDown, true),
        (this._onMaterialMenuPointerDown = null));
      return;
    }
    if (this._onMaterialMenuPointerDown) return;
    ((this._onMaterialMenuPointerDown = (event3) => {
      if (!this._materialMenu) return;
      if (event3?.button === 2) return;
      if (this._materialMenuEl?.contains?.(event3.target)) return;
      this._closeMaterialMenu();
    }),
      document.addEventListener('pointerdown', this._onMaterialMenuPointerDown, true));
  }
  ['_removeMaterialMenuPortal']() {
    (this._materialMenuEl?.parentNode?.removeChild?.(this._materialMenuEl), (this._materialMenuEl = null));
  }
  ['_closeMaterialMenu'](options6 = {}) {
    if (!this._materialMenu && !this._materialMenuEl) return;
    ((this._materialMenu = null),
      this._syncMaterialMenuDismissListener(false),
      this._removeMaterialMenuPortal());
    if (options6.render === true) this._render();
  }
  ['_materialMenuHost']() {
    return (
      this.el?.querySelector?.('.media-clip-compact.is-editing') ||
      this.el?.querySelector?.('.media-clip-compact') ||
      this.el ||
      null
    );
  }
  ['_materialMenuLocalPoint'](value104, value105, el16 = this._materialMenuHost()) {
    const box8 = el16?.getBoundingClientRect?.() || { left: 0, top: 0, width: 0, height: 0 },
      layoutWidthPx = readLayoutWidthPx(el16, box8.width || 1),
      toNumber16 =
        toNumber(el16?.offsetHeight, 0) ||
        parseFloat(el16?.style?.getPropertyValue?.('height')) ||
        box8.height ||
        1,
      value106 = box8.width > 0 && layoutWidthPx > 0 ? box8.width / layoutWidthPx : 1,
      value107 = box8.height > 0 && toNumber16 > 0 ? box8.height / toNumber16 : value106;
    return {
      x: (toNumber(value104, box8.left) - toNumber(box8.left, 0)) / (value106 || 1),
      y: (toNumber(value105, box8.top) - toNumber(box8.top, 0)) / (value107 || 1),
    };
  }
  ['_renderMaterialMenuPortal']() {
    if (typeof document === 'undefined' || !this._materialMenu) return;
    const el17 = this._materialMenuHost();
    if (!el17) return;
    const value108 = this._renderMaterialMenu();
    ((this._materialMenuEl = value108),
      el17.appendChild(value108),
      this._positionMaterialMenu(value108, el17));
  }
  ['_positionMaterialMenu'](el18, el19 = this._materialMenuHost()) {
    if (!el18) return;
    const box9 = this._materialMenu || {},
      value109 = 8,
      toNumber17 = toNumber(box9.x ?? box9.left, value109),
      toNumber18 = toNumber(box9.y ?? box9.top, value109),
      box10 = el19?.getBoundingClientRect?.() || { left: 0, top: 0, width: 0, height: 0 },
      layoutWidthPx2 = readLayoutWidthPx(el19, box10.width || 1),
      toNumber19 =
        toNumber(el19?.offsetHeight, 0) ||
        parseFloat(el19?.style?.getPropertyValue?.('height')) ||
        box10.height ||
        1,
      count4 = box10.width > 0 && layoutWidthPx2 > 0 ? box10.width / layoutWidthPx2 : 1,
      count5 = box10.height > 0 && toNumber19 > 0 ? box10.height / toNumber19 : count4,
      toNumber20 = toNumber(el18.offsetWidth, 0),
      toNumber21 = toNumber(el18.offsetHeight, 0),
      count6 = typeof window !== 'undefined' ? toNumber(window.innerWidth, 0) : 0,
      count7 = typeof window !== 'undefined' ? toNumber(window.innerHeight, 0) : 0,
      value110 =
        count6 > 0 && count4 > 0
          ? Math.max(value109, (count6 - box10.left) / count4 - toNumber20 - value109)
          : toNumber17,
      value111 =
        count7 > 0 && count5 > 0
          ? Math.max(value109, (count7 - box10.top) / count5 - toNumber21 - value109)
          : toNumber18;
    ((el18.style.left = Math.min(value110, Math.max(value109, toNumber17)) + 'px'),
      (el18.style.top = Math.min(value111, Math.max(value109, toNumber18)) + 'px'));
  }
  ['_isEditableEventTarget'](el20) {
    return !!el20?.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]');
  }
  ['_syncDocumentKeyListener'](enabled15) {
    if (typeof document === 'undefined') return;
    if (!enabled15) {
      this._onDocumentKeyDown &&
        (document.removeEventListener('keydown', this._onDocumentKeyDown, true),
        (this._onDocumentKeyDown = null));
      return;
    }
    if (this._onDocumentKeyDown) return;
    ((this._onDocumentKeyDown = (value112) => this._handleDocumentKeyDown(value112)),
      document.addEventListener('keydown', this._onDocumentKeyDown, true));
  }
  ['_syncDeleteMaterialShortcutListener'](enabled16) {
    if (typeof window === 'undefined') return;
    if (!enabled16) {
      this._onDeleteMaterialShortcut &&
        (window.removeEventListener(MEDIA_CLIP_DELETE_MATERIAL_EVENT, this._onDeleteMaterialShortcut),
        (this._onDeleteMaterialShortcut = null));
      return;
    }
    if (this._onDeleteMaterialShortcut) return;
    ((this._onDeleteMaterialShortcut = (value113) => {
      const text4 = normalizeText(value113?.detail?.nodeId);
      if (text4 && text4 !== this.id) return;
      if (this._mediaClip.expanded !== true) return;
      this._deleteActiveMaterialFromShortcut();
    }),
      window.addEventListener(MEDIA_CLIP_DELETE_MATERIAL_EVENT, this._onDeleteMaterialShortcut));
  }
  ['_deleteActiveMaterialFromShortcut']() {
    const value114 =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    if (value114 - this._lastDeleteMaterialShortcutAt < 80) return;
    ((this._lastDeleteMaterialShortcutAt = value114), this._deleteActiveMaterial());
  }
  ['_handleDocumentKeyDown'](event4) {
    if (this._mediaClip.expanded !== true) return;
    if (this._isEditableEventTarget(event4?.target)) return;
    const text5 = normalizeText(event4?.key).toLowerCase(),
      text6 = normalizeText(event4?.code);
    if (event4?.key === 'Escape' && this._materialMenu) {
      (event4.preventDefault?.(), event4.stopPropagation?.(), this._closeMaterialMenu());
      return;
    }
    if (event4?.key === ' ' || event4?.code === 'Space') {
      (event4.preventDefault?.(), event4.stopPropagation?.(), event4.stopImmediatePropagation?.());
      !event4?.repeat && void this._togglePreviewPlayback();
      return;
    }
    if (text5 === 'c' && !event4?.ctrlKey && !event4?.metaKey && !event4?.altKey) {
      (event4.preventDefault?.(),
        event4.stopPropagation?.(),
        event4.stopImmediatePropagation?.(),
        this._splitActiveMaterial());
      return;
    }
    (text5 === 'delete' ||
      text5 === 'del' ||
      text5 === 'backspace' ||
      text6 === 'Delete' ||
      text6 === 'Backspace') &&
      (event4.preventDefault?.(),
      event4.stopPropagation?.(),
      event4.stopImmediatePropagation?.(),
      this._deleteActiveMaterialFromShortcut());
  }
  ['_renderPickButton']() {
    const el21 = document.createElement('button');
    ((el21.type = 'button'),
      (el21.className = 'media-clip-pick-btn'),
      el21.classList.toggle('is-active', this._isPicking()));
    const mediaClipText2 = mediaClipText('pick.addByConnection');
    return (
      (el21.title = mediaClipText2),
      el21.setAttribute('aria-label', mediaClipText2),
      el21.appendChild(createConnectCursorIcon()),
      el21.addEventListener('click', (value115) => this._togglePickConnect(value115)),
      el21
    );
  }
  ['_renderEmpty']() {
    const el22 = document.createElement('div');
    el22.className = 'media-clip-empty';
    const el23 = document.createElement('div');
    el23.className = 'media-clip-empty-body';
    const el24 = document.createElement('button');
    ((el24.type = 'button'),
      (el24.className = 'media-clip-pick-btn'),
      el24.classList.toggle('is-active', this._isPicking()));
    const mediaClipText3 = mediaClipText('pick.addByConnection');
    ((el24.title = mediaClipText3),
      el24.setAttribute('aria-label', mediaClipText3),
      el24.appendChild(createConnectCursorIcon()),
      el24.addEventListener('click', (value116) => this._togglePickConnect(value116)),
      el23.appendChild(el24));
    const el25 = document.createElement('div');
    ((el25.className = 'media-clip-empty-copy'), el25.classList.toggle('is-picking', this._isPicking()));
    const el26 = document.createElement('div');
    ((el26.textContent = this._isPicking()
      ? mediaClipText('empty.selectMaterial')
      : mediaClipText('empty.connectHint')),
      el25.appendChild(el26));
    if (this._isPicking()) {
      const el27 = document.createElement('div');
      ((el27.className = 'media-clip-esc'),
        (el27.textContent = mediaClipText('empty.exit')),
        el25.appendChild(el27));
    }
    return (el23.appendChild(el25), el22.appendChild(el23), el22);
  }
  ['_renderCompact']() {
    const enabled17 = this._mediaClip.expanded === true,
      el28 = document.createElement('div');
    ((el28.className = 'media-clip-compact'),
      el28.classList.toggle('is-editing', enabled17),
      el28.classList.toggle('is-menu-open', this._menuOpen === true));
    const value117 = document.createElement('div');
    value117.className = 'media-clip-compact-body';
    const el29 = document.createElement('div');
    ((el29.className = 'media-clip-timeline-scroll'),
      this._primeTimelineScroll(el29),
      el29.addEventListener('click', () => {
        if (this._mediaClip.expanded === true) return;
        this._setExpanded(true);
      }),
      this._bindTimelineScroll(el29));
    const el30 = document.createElement('div');
    ((el30.className = 'media-clip-compact-timeline'), el30.classList.toggle('is-editing', enabled17));
    const timelineWidthPx = this._timelineTrackContentWidth({ compact: !enabled17 }),
      value118 = this._timelineAddSlotLeftPx(timelineWidthPx),
      value119 = this._timelineContentWidth(timelineWidthPx),
      value120 = this._timelineAxisWidthPx();
    (el30.style.setProperty('--media-clip-track-content-width', timelineWidthPx + 'px'),
      el30.style.setProperty('--media-clip-timeline-content-width', value119 + 'px'),
      el30.style.setProperty('--media-clip-add-left', value118 + 'px'),
      el30.style.setProperty('--media-clip-track-axis-width', value120 + 'px'));
    const value121 = this._audioTimelineClips(this._mediaClip.tracks.audio),
      value122 = this._audioLaneCount(value121);
    (this._setAudioLaneCountStyle(el30, value122),
      el30.appendChild(
        this._renderRuler(this._primaryDuration(), { compact: !enabled17, timelineWidthPx: timelineWidthPx }),
      ));
    const el31 = document.createElement('div');
    ((el31.className = 'media-clip-timeline-lane'),
      el31.classList.toggle('has-audio-track', !!this._mediaClip.tracks.audio),
      this._setAudioLaneCountStyle(el31, value122),
      el31.addEventListener('pointerleave', () => {
        if (this._timelineDrag()) return;
        (this._clearTimelineHoverState(el31), this._restoreTimelinePlayheads());
      }));
    const el32 = document.createElement('div');
    ((el32.className = 'media-clip-timeline-tracks'),
      el32.classList.toggle('has-audio-track', !!this._mediaClip.tracks.audio),
      this._setAudioLaneCountStyle(el32, value122));
    this._mediaClip.tracks.audio && el31.appendChild(this._renderAudioLaneControls(value121, value122));
    this._mediaClip.tracks.video &&
      el32.appendChild(this._renderTrack('video', { compact: !enabled17, timelineWidthPx: timelineWidthPx }));
    this._mediaClip.tracks.audio &&
      el32.appendChild(this._renderTrack('audio', { compact: !enabled17, timelineWidthPx: timelineWidthPx }));
    const value123 = this._renderShortcutCropButton(),
      el33 = this._renderPickButton();
    el33.classList.add('media-clip-add-btn');
    const mediaClipText4 = mediaClipText('pick.continueAdd');
    return (
      (el33.title = mediaClipText4),
      el33.setAttribute('aria-label', mediaClipText4),
      el31.append(el32, el33),
      el30.appendChild(el31),
      enabled17 &&
        (this._bindTimelinePointerCursors(el30, el32),
        el30.appendChild(this._renderTimelineCursors(this._primaryDuration()))),
      el29.appendChild(el30),
      this._primeTimelineScroll(el29),
      value117.append(el29),
      el28.append(value117, value123),
      enabled17 &&
        (el28.appendChild(this._renderTimelineHintCarousel()), el28.appendChild(this._renderTimelineTools())),
      el28
    );
  }
  ['_renderAudioLaneControls'](list7 = [], value124 = 1) {
    const el34 = document.createElement('div');
    ((el34.className = 'media-clip-audio-lane-controls'),
      (el34.dataset.uiStop = 'true'),
      this._setAudioLaneCountStyle(el34, value124));
    for (let value125 = 0; value125 < value124; value125 += 1) {
      const list8 = this._audioClipsForLane(value125, list7),
        value126 = this._isAudioLaneMuted(value125, list7),
        el35 = document.createElement('button');
      ((el35.type = 'button'),
        (el35.className = 'media-clip-audio-lane-mute-btn'),
        el35.classList.toggle('is-muted', value126),
        (el35.disabled = list8.length === 0),
        (el35.dataset.audioLaneIndex = String(value125)),
        (el35.dataset.uiStop = 'true'),
        (el35.title = mediaClipText(value126 ? 'audioLane.unmute' : 'audioLane.mute')),
        el35.setAttribute('aria-label', el35.title),
        el35.style.setProperty(
          '--media-clip-audio-lane-top',
          value125 * (MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + MEDIA_CLIP_AUDIO_LANE_GAP_PX) + 'px',
        ));
      const el36 = createMediaClipSvgElement('svg');
      (el36.setAttribute('viewBox', '0 0 24 24'),
        el36.setAttribute('width', '16'),
        el36.setAttribute('height', '16'),
        el36.setAttribute('aria-hidden', 'true'));
      const el37 = createMediaClipSvgElement('path');
      (el37.setAttribute('d', 'M4 9v6h4l5 4V5L8 9H4z'),
        el37.setAttribute('fill', 'currentColor'),
        el36.appendChild(el37));
      const el38 = createMediaClipSvgElement('path');
      (el38.setAttribute(
        'd',
        value126 ? 'M16 9l5 5m0-5l-5 5' : 'M16 8c1.3 1.4 1.3 4.6 0 6M18.5 6c2.4 2.6 2.4 8.4 0 11',
      ),
        el38.setAttribute('fill', 'none'),
        el38.setAttribute('stroke', 'currentColor'),
        el38.setAttribute('stroke-width', '2'),
        el38.setAttribute('stroke-linecap', 'round'),
        el36.appendChild(el38),
        el35.appendChild(el36),
        el35.addEventListener('pointerdown', stopPointer),
        el35.addEventListener('click', (value127) => {
          (stopPointer(value127), this._toggleAudioLaneMuted(value125));
        }),
        el34.appendChild(el35));
    }
    return el34;
  }
  ['_syncAudioLaneControls'](
    value128 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
    value129 = this._audioLaneCount(value128),
  ) {
    const enabled18 = this.el?.querySelector?.('.media-clip-audio-lane-controls');
    if (!enabled18) return;
    const el39 = this._renderAudioLaneControls(value128, value129);
    (this._setAudioLaneCountStyle(enabled18, value129),
      enabled18.replaceChildren?.(...Array.from(el39.children || [])));
  }
  ['_primeTimelineScroll'](enabled19) {
    if (!enabled19) return 0;
    const value130 = Math.max(0, toNumber(this._timelineScrollLeft, this._timelineView?.scrollLeft || 0)),
      viewportWidthPx = this._timelineViewportWidth(),
      trackWidthPx = this._timelineTrackContentWidth(),
      maxScrollPx = Math.max(0, this._timelineContentWidth(trackWidthPx) - viewportWidthPx),
      value131 = this._clampTimelineScrollLeft(enabled19, value130, {
        maxScrollPx: maxScrollPx,
        trackWidthPx: trackWidthPx,
        viewportWidthPx: viewportWidthPx,
      });
    ((this._restoringTimelineScroll = enabled19),
      (enabled19.scrollLeft = value131),
      this._syncTimelineScrollFade(enabled19));
    const value132 = () => {
      this._restoringTimelineScroll === enabled19 && (this._restoringTimelineScroll = null);
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(value132);
    else setTimeout(value132, 0);
    return value131;
  }
  ['_bindTimelineScroll'](scrollLeft) {
    if (!scrollLeft) return;
    (scrollLeft.addEventListener(
      'wheel',
      (event5) => {
        if (event5.ctrlKey || event5.metaKey) {
          this._handleTimelineZoomWheel(scrollLeft, event5);
          return;
        }
        const maxScrollPx2 = Math.max(0, scrollLeft.scrollWidth - scrollLeft.clientWidth);
        if (maxScrollPx2 <= 0) {
          this._mediaClip.expanded === true && (event5.preventDefault(), event5.stopPropagation());
          return;
        }
        const enabled20 = Math.abs(event5.deltaX) > Math.abs(event5.deltaY) ? event5.deltaX : event5.deltaY;
        if (!enabled20) return;
        if (this._shouldLockTimelineWheelScroll(scrollLeft, { maxScrollPx: maxScrollPx2 })) {
          (event5.preventDefault(), event5.stopPropagation());
          Math.abs(scrollLeft.scrollLeft) > 0.5 &&
            ((scrollLeft.scrollLeft = 0),
            this._updateTimelineView({ scrollLeft: 0 }, { persist: true, renderOnPersist: false }));
          this._syncTimelineScrollFade(scrollLeft);
          return;
        }
        (event5.preventDefault(),
          event5.stopPropagation(),
          (scrollLeft.scrollLeft = this._clampTimelineScrollLeft(
            scrollLeft,
            scrollLeft.scrollLeft + enabled20,
            {
              maxScrollPx: maxScrollPx2,
            },
          )),
          this._updateTimelineView(
            { scrollLeft: scrollLeft.scrollLeft },
            { persist: true, renderOnPersist: false },
          ),
          this._syncTimelineScrollFade(scrollLeft));
      },
      { passive: false },
    ),
      scrollLeft.addEventListener('scroll', () => {
        const scrollLeft2 = this._clampTimelineScrollLeft(scrollLeft, scrollLeft.scrollLeft);
        if (Math.abs(scrollLeft2 - scrollLeft.scrollLeft) > 0.5) {
          scrollLeft.scrollLeft = scrollLeft2;
          return;
        }
        (this._updateTimelineView(
          { scrollLeft: scrollLeft2 },
          {
            persist: this._restoringTimelineScroll !== scrollLeft && !this._timelineDrag(),
            renderOnPersist: false,
          },
        ),
          this._syncTimelineScrollFade(scrollLeft));
      }));
    const value133 = () => {
      const maxScrollPx3 = Math.max(0, scrollLeft.scrollWidth - scrollLeft.clientWidth);
      ((this._restoringTimelineScroll = scrollLeft),
        (scrollLeft.scrollLeft = this._clampTimelineScrollLeft(scrollLeft, this._timelineScrollLeft, {
          maxScrollPx: maxScrollPx3,
        })),
        this._syncTimelineScrollFade(scrollLeft));
      const value134 = () => {
        this._restoringTimelineScroll === scrollLeft && (this._restoringTimelineScroll = null);
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(value134);
      else setTimeout(value134, 0);
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(value133);
    else setTimeout(value133, 0);
  }
  ['_shouldLockTimelineWheelScroll'](el40, value135 = {}) {
    if (!el40) return false;
    const maxScrollPx4 = Math.max(0, toNumber(value135.maxScrollPx, el40.scrollWidth - el40.clientWidth)),
      viewportWidthPx2 = Math.max(1, toNumber(value135.viewportWidthPx, el40.clientWidth)),
      trackWidthPx2 = Math.max(0, toNumber(value135.trackWidthPx, this._timelineTrackContentWidth()));
    return shouldLockMediaClipTimelineWheelScroll({
      trackWidthPx: trackWidthPx2,
      viewportWidthPx: viewportWidthPx2,
      maxScrollPx: maxScrollPx4,
    });
  }
  ['_timelineMaterialRangeSec']() {
    const startSec = [],
      handler = (value136, value137) => {
        const startSec2 = Math.max(0, toNumber(value136, 0)),
          endSec = Math.max(startSec2, toNumber(value137, startSec2));
        if (endSec > startSec2) startSec.push({ startSec: startSec2, endSec: endSec });
      },
      value138 = this._mediaClip?.tracks?.video || null,
      list9 = this._videoTimelineClips(value138);
    if (list9.length)
      list9.forEach((item9) => {
        handler(item9.timelineStartSec, item9.timelineEndSec);
      });
    else value138 && handler(value138.startSec, value138.endSec || value138.durationSec);
    const value139 = this._mediaClip?.tracks?.audio || null;
    if (value139) {
      const list10 = this._audioTimelineClips(value139);
      list10.length
        ? list10.forEach((item10) => {
            handler(item10.timelineStartSec, item10.timelineEndSec);
          })
        : handler(value139.startSec, value139.endSec || value139.durationSec);
    }
    if (!startSec.length) return { startSec: 0, endSec: 0 };
    return startSec.reduce(
      (item11, value140) => ({
        startSec: Math.min(item11.startSec, value140.startSec),
        endSec: Math.max(item11.endSec, value140.endSec),
      }),
      { startSec: startSec[0].startSec, endSec: startSec[0].endSec },
    );
  }
  ['_timelineMaterialScrollBounds'](el41, value141 = {}) {
    const value142 = Math.max(
        1,
        toNumber(value141.viewportWidthPx, el41?.clientWidth || this._timelineViewportWidth()),
      ),
      maxScrollLeft = Math.max(0, toNumber(value141.maxScrollPx, (el41?.scrollWidth || 0) - value142));
    if (maxScrollLeft <= 0) return { minScrollLeft: 0, maxScrollLeft: 0 };
    const startSec3 = this._timelineMaterialRangeSec();
    if (!(startSec3.endSec > startSec3.startSec)) return { minScrollLeft: 0, maxScrollLeft: maxScrollLeft };
    const durationSec = getMediaClipTimelineDisplayDuration(
        value141.displayDurationSec ?? this._primaryDuration(),
      ),
      trackWidthPx3 = Math.max(1, toNumber(value141.trackWidthPx, this._timelineTrackContentWidth())),
      mediaClipTimelineRangeRect = getMediaClipTimelineRangeRect({
        startSec: startSec3.startSec,
        endSec: startSec3.endSec,
        durationSec: durationSec,
        trackWidthPx: trackWidthPx3,
        minWidthPct: 0,
      }),
      value143 = Math.max(0, toNumber(mediaClipTimelineRangeRect.leftPx, 0)),
      value144 = Math.max(value143, value143 + toNumber(mediaClipTimelineRangeRect.widthPx, 0)),
      value145 =
        this._timelineAddSlotLeftPx(trackWidthPx3, {
          displayDurationSec: durationSec,
          materialEndSec: startSec3.endSec,
        }) + MEDIA_CLIP_TIMELINE_ADD_SLOT_WIDTH_PX,
      value146 = Math.max(value144, value145),
      value147 = Math.max(0, value144 - value143);
    let minScrollLeft = 0,
      maxScrollLeft2 = maxScrollLeft;
    if (value147 < value142) {
      maxScrollLeft2 = Math.min(maxScrollLeft, value143);
      const value148 = Math.max(0, value146 - value142),
        value149 = Math.max(0, value144 - value142);
      minScrollLeft = Math.min(maxScrollLeft, value148 <= maxScrollLeft2 ? value148 : value149);
    } else
      ((minScrollLeft = Math.min(maxScrollLeft, Math.max(0, value143))),
        (maxScrollLeft2 = Math.min(maxScrollLeft, Math.max(0, value146 - value142))));
    return (
      (minScrollLeft = Math.max(0, Math.min(maxScrollLeft, minScrollLeft))),
      (maxScrollLeft2 = Math.max(minScrollLeft, Math.min(maxScrollLeft, maxScrollLeft2))),
      { minScrollLeft: minScrollLeft, maxScrollLeft: maxScrollLeft2 }
    );
  }
  ['_clampTimelineScrollLeft'](el42, value150 = 0, args10 = {}) {
    if (!el42) return 0;
    const maxScrollPx5 = Math.max(0, toNumber(args10.maxScrollPx, el42.scrollWidth - el42.clientWidth));
    if (this._shouldLockTimelineWheelScroll(el42, { ...args10, maxScrollPx: maxScrollPx5 })) return 0;
    const value151 = this._timelineMaterialScrollBounds(el42, { ...args10, maxScrollPx: maxScrollPx5 });
    return Math.max(value151.minScrollLeft, Math.min(value151.maxScrollLeft, toNumber(value150, 0)));
  }
  ['_handleTimelineZoomWheel'](width3, event6) {
    if (!width3) return;
    const value152 = Number(event6.deltaX) || 0,
      value153 = Number(event6.deltaY) || 0,
      delta = Math.abs(value152) > Math.abs(value153) ? value152 : value153;
    if (!delta) return;
    (event6.preventDefault(), event6.stopPropagation());
    const currentZoom = normalizeMediaClipTimelineView(this._timelineView),
      zoom = getMediaClipTimelineNextZoom({
        currentZoom: currentZoom.zoom,
        delta: delta,
        minZoom: MEDIA_CLIP_TIMELINE_ZOOM_MIN,
        maxZoom: MEDIA_CLIP_TIMELINE_ZOOM_MAX,
      });
    if (Math.abs(zoom - currentZoom.zoom) < 0.001) return;
    const box11 = width3.getBoundingClientRect?.() || { left: 0, width: width3.clientWidth || 0 },
      viewportWidthPx3 = Math.max(1, width3.clientWidth || box11.width || 1),
      anchorX = Math.max(
        0,
        Math.min(
          viewportWidthPx3,
          Number.isFinite(event6.clientX) ? event6.clientX - (box11.left || 0) : viewportWidthPx3 / 2,
        ),
      ),
      value154 = this._timelineTrackContentWidth({ timelineZoom: currentZoom.zoom }),
      mediaClipTimelineDisplayDuration = getMediaClipTimelineDisplayDuration(
        this._primaryDuration({ timelineZoom: currentZoom.zoom }),
      ),
      anchorSec = Math.max(
        0,
        Math.min(
          mediaClipTimelineDisplayDuration,
          ((Math.max(0, width3.scrollLeft || 0) + anchorX) / Math.max(1, value154)) *
            mediaClipTimelineDisplayDuration,
        ),
      );
    this._updateTimelineView({ zoom: zoom }, { persist: false });
    const trackWidthPx4 = this._timelineTrackContentWidth({ timelineZoom: zoom }),
      durationSec2 = getMediaClipTimelineDisplayDuration(this._primaryDuration({ timelineZoom: zoom })),
      nextContentWidthPx = this._timelineContentWidth(trackWidthPx4);
    this._syncTimelineContentWidth(trackWidthPx4);
    this._mediaClip.tracks?.video &&
      this._updateTrackVisuals('video', {
        durationSec: this._videoTimelineDuration(this._mediaClip.tracks.video, null, {
          timelineZoom: zoom,
        }),
        syncTimelineWidth: false,
      });
    this._mediaClip.tracks?.audio &&
      this._updateTrackVisuals('audio', {
        durationSec: this._timelineDurationForKind('audio', { timelineZoom: zoom }),
        syncTimelineWidth: false,
      });
    const maxScrollPx6 = Math.max(0, nextContentWidthPx - viewportWidthPx3),
      scrollLeft3 = this._clampTimelineScrollLeft(
        width3,
        getMediaClipTimelineZoomScrollLeft({
          anchorSec: anchorSec,
          anchorX: anchorX,
          durationSec: durationSec2,
          trackWidthPx: trackWidthPx4,
          nextContentWidthPx: nextContentWidthPx,
          viewportWidthPx: viewportWidthPx3,
        }),
        { trackWidthPx: trackWidthPx4, viewportWidthPx: viewportWidthPx3, maxScrollPx: maxScrollPx6 },
      );
    ((width3.scrollLeft = scrollLeft3),
      this._updateTimelineView({ scrollLeft: scrollLeft3 }, { persist: true, renderOnPersist: false }),
      this._syncTimelineScrollFade(width3));
  }
  ['_syncTimelineScrollFade'](el43) {
    if (!el43) return;
    const maxScrollPx7 = Math.max(0, el43.scrollWidth - el43.clientWidth),
      value155 = this._timelineMaterialScrollBounds(el43, { maxScrollPx: maxScrollPx7 }),
      value156 =
        !this._shouldLockTimelineWheelScroll(el43, { maxScrollPx: maxScrollPx7 }) &&
        value155.maxScrollLeft > value155.minScrollLeft + 1 &&
        el43.scrollLeft < value155.maxScrollLeft - 2;
    el43.classList.toggle('has-right-overflow', value156);
  }
  ['_timelineDragScrollDeltaPx'](value157 = this._timelineDrag()) {
    const enabled21 = value157?.scrollEl;
    if (!enabled21) return 0;
    return toNumber(enabled21.scrollLeft, 0) - toNumber(value157.startScrollLeft, 0);
  }
  ['_timelineDragDeltaPx'](value158 = this._timelineDrag(), event7 = {}) {
    const toNumber22 = toNumber(event7?.clientX, toNumber(value158?.latestClientX, value158?.startX));
    return toNumber22 - toNumber(value158?.startX, toNumber22) + this._timelineDragScrollDeltaPx(value158);
  }
  ['_timelineDragAutoScrollVelocity'](el44, value159) {
    if (!el44 || !Number.isFinite(value159)) return 0;
    const count8 = Math.max(0, el44.scrollWidth - el44.clientWidth);
    if (count8 <= 0) return 0;
    const box12 = el44.getBoundingClientRect?.() || {},
      toNumber23 = toNumber(box12.left, 0),
      value160 = Math.max(1, toNumber(box12.width, el44.clientWidth || 1)),
      toNumber24 = toNumber(box12.right, toNumber23 + value160);
    if (value159 < toNumber23 + TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX) {
      const value161 = Math.max(
        0,
        Math.min(
          1,
          (toNumber23 + TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX - value159) / TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX,
        ),
      );
      return -TIMELINE_DRAG_AUTO_SCROLL_MAX_PX * value161;
    }
    if (value159 > toNumber24 - TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX) {
      const value162 = Math.max(
        0,
        Math.min(
          1,
          (value159 - (toNumber24 - TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX)) / TIMELINE_DRAG_AUTO_SCROLL_EDGE_PX,
        ),
      );
      return TIMELINE_DRAG_AUTO_SCROLL_MAX_PX * value162;
    }
    return 0;
  }
  ['_scheduleTimelineDragAutoScroll'](value163 = this._timelineDrag()) {
    const enabled22 = value163?.scrollEl,
      toNumber25 = toNumber(value163?.latestClientX, Number.NaN);
    if (!enabled22 || !Number.isFinite(toNumber25)) return;
    if (!this._timelineDragAutoScrollVelocity(enabled22, toNumber25)) return;
    if (this._timelineDragAutoScrollRaf) return;
    const value164 = value163.sessionId,
      value165 = () => {
        ((this._timelineDragAutoScrollRaf = 0), this._runTimelineDragAutoScroll(value164));
      };
    this._timelineDragAutoScrollRaf =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(value165)
        : setTimeout(value165, 16);
  }
  ['_stopTimelineDragAutoScroll']() {
    const enabled23 = this._timelineDragAutoScrollRaf;
    if (!enabled23) return;
    try {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(enabled23);
    } catch {}
    try {
      clearTimeout(enabled23);
    } catch {}
    this._timelineDragAutoScrollRaf = 0;
  }
  ['_runTimelineDragAutoScroll'](value166) {
    const enabled24 = this._timelineDrag();
    if (!enabled24 || enabled24.sessionId !== value166) return;
    const el45 = enabled24.scrollEl,
      clientX = toNumber(enabled24.latestClientX, Number.NaN),
      enabled25 = this._timelineDragAutoScrollVelocity(el45, clientX);
    if (!el45 || !enabled25) return;
    const maxScrollPx8 = Math.max(0, el45.scrollWidth - el45.clientWidth),
      toNumber26 = toNumber(el45.scrollLeft, 0),
      scrollLeft4 = this._clampTimelineScrollLeft(el45, toNumber26 + enabled25, {
        maxScrollPx: maxScrollPx8,
      });
    if (Math.abs(scrollLeft4 - toNumber26) <= 0.01) return;
    ((el45.scrollLeft = scrollLeft4),
      this._updateTimelineView({ scrollLeft: scrollLeft4 }, { persist: false, renderOnPersist: false }),
      this._syncTimelineScrollFade(el45),
      this._applyTimelineDragPreviewFromPointer(enabled24, { clientX: clientX }),
      this._scheduleTimelineDragAutoScroll(enabled24));
  }
  ['_persistTimelineDragScroll'](value167 = this._timelineDrag()) {
    const enabled26 = value167?.scrollEl;
    if (!enabled26) return;
    const scrollLeft5 = this._clampTimelineScrollLeft(enabled26, enabled26.scrollLeft);
    (Math.abs(scrollLeft5 - toNumber(enabled26.scrollLeft, 0)) > 0.01 && (enabled26.scrollLeft = scrollLeft5),
      this._syncTimelineScrollFade(enabled26),
      this._updateTimelineView({ scrollLeft: scrollLeft5 }, { persist: true, renderOnPersist: false }));
  }
  ['_renderShortcutCropButton']() {
    const el46 = makeButton(
      'media-clip-tool-crop media-clip-shortcut-crop',
      mediaClipText('tools.splitMaterial'),
      '',
    );
    return (
      (el46.tabIndex = -1),
      el46.setAttribute('aria-hidden', 'true'),
      el46.addEventListener('click', (value168) => {
        (stopPointer(value168), this._splitActiveMaterial());
      }),
      el46
    );
  }
  ['_setDownloadMenuOpen'](value169) {
    this._menuOpen = value169 === true;
    this._materialMenu &&
      ((this._materialMenu = null),
      this._removeMaterialMenuPortal(),
      this._syncMaterialMenuDismissListener(false));
    const el47 = this.el?.querySelector?.('.media-clip-compact');
    el47?.classList?.toggle('is-menu-open', this._menuOpen);
    const el48 = this.el?.querySelector?.('.media-clip-compact-tools');
    if (!el48) return;
    const el49 = el48.querySelector?.('.media-clip-tool-download');
    (el49?.classList?.toggle('is-active', this._menuOpen),
      el48.querySelectorAll?.('.media-clip-menu')?.forEach((el50) => el50.remove?.()),
      this._menuOpen && el48.appendChild(this._renderDownloadMenu()));
  }
  ['_renderTimelineTools']() {
    const el51 = document.createElement('div');
    el51.className = 'media-clip-tools media-clip-compact-tools';
    const el52 = iconButton(
        'media-clip-tool media-clip-tool-crop',
        mediaClipText('tools.splitMaterial'),
        '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
      ),
      el53 = document.createElement('span');
    ((el53.className = 'media-clip-tool-kbd'),
      (el53.textContent = 'C'),
      el52.appendChild(el53),
      el52.addEventListener('click', (value170) => {
        (stopPointer(value170), this._splitActiveMaterial());
      }));
    const el54 = iconButton(
      'media-clip-tool media-clip-tool-download',
      mediaClipText('tools.export'),
      '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    );
    (el54.classList.toggle('is-active', this._menuOpen),
      el54.addEventListener('click', (value171) => {
        (stopPointer(value171), this._setDownloadMenuOpen(!this._menuOpen));
      }),
      el51.append(el52, el54));
    if (this._menuOpen) el51.appendChild(this._renderDownloadMenu());
    return el51;
  }
  ['_renderTimelineHintCarousel']() {
    const el55 = document.createElement('div');
    el55.className = 'media-clip-helper-row';
    const el56 = document.createElement('div');
    el56.className = 'media-clip-helper-left';
    const list11 = [
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
      el55.style.setProperty('--media-clip-helper-count', String(list11.length)),
      list11.forEach((list12, value172) => {
        const el57 = document.createElement('div');
        ((el57.className = 'media-clip-helper-msg'),
          el57.style.setProperty('--media-clip-helper-index', String(value172)),
          list12.forEach(([value173, value174]) => {
            const el58 = document.createElement('span');
            ((el58.className = value173 === 'kbd' ? 'media-clip-helper-kbd' : 'media-clip-helper-text'),
              (el58.textContent = value174),
              el57.appendChild(el58));
          }),
          el56.appendChild(el57));
      }),
      el55.appendChild(el56),
      el55
    );
  }
  ['_renderMaterialMenu']() {
    const value175 = this._materialMenu || {},
      el59 = document.createElement('div');
    ((el59.className = 'v2-canvas-ctx-menu media-clip-material-menu'),
      el59.setAttribute('role', 'menu'),
      (el59.dataset.uiStop = 'true'));
    const run3 = (value176, handler2) => {
        const el60 = document.createElement('div');
        ((el60.className = 'v2-menu-row'), el60.setAttribute('role', 'menuitem'));
        const el61 = document.createElement('span');
        return (
          (el61.textContent = value176),
          el60.appendChild(el61),
          el60.addEventListener('pointerdown', (event8) => {
            if (event8.button !== 0) return;
            (stopPointer(event8), handler2(event8));
          }),
          el60
        );
      },
      value177 = run3(mediaClipText('materialMenu.exportToCanvas'), async () => {
        if (this._exporting === true) return;
        const { kind: kind, clipIndex: clipIndex2 } = this._materialMenu || value175;
        (this._closeMaterialMenu({ render: false }), await this._exportMaterialToCanvas(kind, clipIndex2));
      }),
      el62 =
        value175.kind === 'audio'
          ? this._audioTimelineClips(this._mediaClip.tracks?.audio)[
              Math.max(0, Math.trunc(toNumber(value175.clipIndex, 0)))
            ] || null
          : null,
      value178 = el62
        ? run3(mediaClipText(el62.disabled === true ? 'materialMenu.enable' : 'materialMenu.disable'), () => {
            const { clipIndex: clipIndex3 } = this._materialMenu || value175;
            (this._closeMaterialMenu({ render: false }), this._toggleAudioClipDisabled(clipIndex3));
          })
        : null,
      value179 = run3(mediaClipText('materialMenu.delete'), () => {
        const { kind: kind2, clipIndex: clipIndex4 } = this._materialMenu || value175;
        (this._closeMaterialMenu({ render: false }), this._deleteMaterial(kind2, clipIndex4));
      });
    el59.append(value177);
    if (value178) el59.append(value178);
    return (el59.append(value179), el59);
  }
  ['_renderPreviewPanel']() {
    const value180 = document.createElement('div');
    value180.className = 'media-clip-preview-panel';
    const el63 = this._renderPreview(),
      el64 = makeButton('media-clip-close', mediaClipText('preview.collapse'), '×');
    return (
      el64.addEventListener('click', (value181) => {
        (stopPointer(value181), this._setExpanded(false));
      }),
      el63.appendChild(el64),
      value180.append(el63),
      this._syncPreviewPanelLayout(value180, el63),
      value180
    );
  }
  ['_previewLayoutTokens']() {
    return ['is-landscape', 'is-portrait', 'is-tall-portrait'];
  }
  ['_previewVideoLayoutClasses'](options7 = {}) {
    const box13 = resolveMediaClipDimensions(options7),
      value182 = Math.max(1, toNumber(box13.width, 1)),
      value183 = Math.max(1, toNumber(box13.height, 1)),
      count9 = value182 / value183;
    if (count9 < 1) return count9 <= 0.65 ? ['is-portrait', 'is-tall-portrait'] : ['is-portrait'];
    return ['is-landscape'];
  }
  ['_syncPreviewPanelLayout'](el65, el66) {
    if (!el65?.classList || !el66?.classList) return;
    (this._previewLayoutTokens().forEach((item12) => {
      el65.classList.remove(item12);
    }),
      this._previewLayoutTokens().forEach((item13) => {
        if (el66.classList.contains(item13)) el65.classList.add(item13);
      }));
    const value184 = el66.style?.getPropertyValue?.('--media-clip-preview-aspect-ratio');
    if (value184) el65.style?.setProperty?.('--media-clip-preview-aspect-ratio', value184);
  }
  ['_applyPreviewVideoLayout'](el67, value185 = {}) {
    if (!el67?.classList) return;
    const box14 = resolveMediaClipDimensions(value185),
      value186 = Math.max(1, toNumber(box14.width, 1)),
      value187 = Math.max(1, toNumber(box14.height, 1));
    (this._previewLayoutTokens().forEach((item14) => {
      el67.classList.remove(item14);
    }),
      this._previewVideoLayoutClasses(value185).forEach((item15) => {
        el67.classList.add(item15);
      }),
      el67.style?.setProperty?.('--media-clip-preview-aspect-ratio', value186 + ' / ' + value187),
      this._syncPreviewPanelLayout(el67.closest?.('.media-clip-preview-panel') || el67.parentElement, el67));
  }
  ['_syncPreviewVideoLayoutFromElement'](value188 = this._videoPreview) {
    const width4 = toNumber(value188?.videoWidth, 0),
      height2 = toNumber(value188?.videoHeight, 0);
    if (!(width4 > 0 && height2 > 0)) return;
    this._applyPreviewVideoLayout(value188.parentElement, { width: width4, height: height2 });
  }
  ['_showPreviewImage'](options8 = {}, value189 = '') {
    const el68 = this._ensurePreviewImageElement(),
      text7 = normalizeText(value189) || resolveMediaClipImageUrl(options8);
    if (!el68 || !text7) return false;
    this._previewVisualKind = 'image';
    try {
      this._videoPreview?.pause?.();
    } catch {}
    if (this._videoPreview) this._videoPreview.hidden = true;
    el68.hidden = false;
    if (el68.getAttribute?.('src') !== text7) el68.src = text7;
    return (this._applyPreviewVideoLayout(el68.parentElement, options8), this._updatePreviewControls(), true);
  }
  ['_clearPreviewVideoFallback']() {
    const el69 = this._videoPreview?.parentElement || this.el?.querySelector?.('.media-clip-preview');
    el69?.querySelectorAll?.('.media-clip-video-fallback')?.forEach((el70) => {
      el70.remove?.();
    });
  }
  ['_showPreviewVideo'](options9 = {}) {
    ((this._previewVisualKind = 'video'), this._clearPreviewVideoFallback());
    if (this._imagePreview) this._imagePreview.hidden = true;
    if (this._videoPreview) this._videoPreview.hidden = false;
    this._applyPreviewVideoLayout(this._videoPreview?.parentElement, options9);
  }
  ['_ensurePreviewVideoElement']() {
    if (this._videoPreview) return this._videoPreview;
    const el71 = document.createElement('video');
    ((el71.className = 'media-clip-video-preview'),
      (el71.preload = 'auto'),
      (el71.controls = false),
      el71.removeAttribute('controls'),
      (el71.muted = true),
      (el71.defaultMuted = true),
      (el71.playsInline = true),
      (el71.disablePictureInPicture = true),
      el71.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback'));
    const value190 = () => {
      (this._syncPreviewVideoLayoutFromElement(el71), this._applyPendingVideoSourceSeek(el71));
      if (el71.__mediaClipPendingSourceSeek || el71.__mediaClipWaitingSourceSeek) return;
      if (this._playing) {
        try {
          el71.play?.()?.catch?.(() => {});
        } catch {}
        return;
      }
      const value191 = this._resolveVideoPreviewSeekTarget();
      this._syncPreviewTime('video', value191, { immediate: true });
    };
    return (
      el71.addEventListener('loadedmetadata', value190),
      el71.addEventListener('loadeddata', value190),
      el71.addEventListener('canplay', value190),
      el71.addEventListener('error', () => {
        const el72 = el71.__mediaClipFallbackHost,
          text8 = normalizeText(el71.__mediaClipPosterUrl);
        el72 &&
          text8 &&
          !el72.querySelector('.media-clip-video-fallback') &&
          el72.appendChild(this._renderVideoFallback(text8));
      }),
      (this._videoPreview = el71),
      el71
    );
  }
  ['_ensurePreviewImageElement']() {
    if (this._imagePreview) return this._imagePreview;
    const width5 = document.createElement('img');
    return (
      (width5.className = 'media-clip-image-preview'),
      (width5.alt = ''),
      (width5.draggable = false),
      (width5.hidden = true),
      width5.addEventListener('load', () => {
        this._applyPreviewVideoLayout(width5.parentElement, {
          width: width5.naturalWidth,
          height: width5.naturalHeight,
        });
      }),
      (this._imagePreview = width5),
      width5
    );
  }
  ['_ensurePreviewAudioElement']() {
    if (this._audioPreview) return this._audioPreview;
    const el73 = document.createElement('audio');
    return (
      (el73.className = 'media-clip-audio-element'),
      (el73.controls = false),
      el73.removeAttribute('controls'),
      (el73.preload = 'metadata'),
      el73.addEventListener('loadedmetadata', () => {
        const value192 = this._audioSourceSecForPlayhead(this._playheadSec || 0);
        this._syncPreviewTime('audio', value192, { immediate: true });
      }),
      (this._audioPreview = el73),
      el73
    );
  }
  ['_renderPreviewControls']() {
    const value193 = document.createElement('div');
    value193.className = 'media-clip-preview-controls';
    const el74 = document.createElement('button');
    ((el74.type = 'button'),
      (el74.className = 'media-clip-preview-play'),
      el74.addEventListener('click', (value194) => this._togglePreviewPlayback(value194)));
    const value195 = document.createElement('span');
    return (
      (value195.className = 'media-clip-preview-time'),
      (this._previewPlayButton = el74),
      (this._previewTimeLabel = value195),
      value193.append(el74, value195),
      this._updatePreviewControls(),
      value193
    );
  }
  ['_renderPreview']() {
    const el75 = document.createElement('div');
    ((el75.className = 'media-clip-preview'),
      (this._previewPlayButton = null),
      (this._previewTimeLabel = null));
    const value196 = this._mediaClip.tracks.video,
      value197 = this._mediaClip.tracks.audio;
    if (value196) {
      const response3 = this._getVideoPreviewContextAtTimelineSec(this._playheadSec || 0),
        enabled27 = response3.url,
        value198 = response3.posterUrl;
      this._applyPreviewVideoLayout(el75, response3.source);
      if (!enabled27)
        return (
          this._disposePreviewMedia('video'),
          el75.appendChild(this._renderVideoFallback(value198)),
          el75
        );
      const value199 = this._ensurePreviewVideoElement(),
        value200 = this._ensurePreviewImageElement();
      ((value199.__mediaClipFallbackHost = el75), (value199.__mediaClipPosterUrl = value198));
      if (value198) value199.poster = value198;
      else value199.removeAttribute('poster');
      if (response3.clipKind !== 'image') {
        if (setMediaElementSource(value199, enabled27)) this._resetPreviewSeekState('video');
        this._previewVideoSrc = enabled27;
      }
      const response4 = value197 ? this._getAudioClipContextAtTimelineSec(this._playheadSec || 0) : null,
        value201 = response4?.url || '';
      if (value197) {
        const value202 = this._ensurePreviewAudioElement();
        if (setMediaElementSource(value202, value201)) this._resetPreviewSeekState('audio');
        value202.volume = Math.max(0, Math.min(1, toNumber(response4?.clip?.volume, 1)));
        ((this._previewAudioSrc = value201),
          (value199.muted = this.nodeData?.storySequence?.version !== 2),
          el75.appendChild(value202));
      } else ((value199.muted = false), this._disposePreviewMedia('audio'));
      (el75.appendChild(value200),
        el75.appendChild(value199),
        response3.clipKind === 'image'
          ? this._showPreviewImage(response3.source, enabled27)
          : (this._showPreviewVideo(response3.source),
            this._syncPreviewTime('video', response3.sourceSec, { immediate: true })),
        el75.appendChild(this._renderPreviewControls()));
    } else {
      this._disposePreviewMedia('video');
      const el76 = document.createElement('div');
      ((el76.className = 'media-clip-audio-preview'),
        (el76.textContent = mediaClipText('preview.audioClip')));
      const value203 = this._ensurePreviewAudioElement(),
        response5 = this._getAudioClipContextAtTimelineSec(this._playheadSec || 0),
        value204 = response5?.url || resolveMediaClipAudioUrl(this._sources.audio);
      if (setMediaElementSource(value203, value204)) this._resetPreviewSeekState('audio');
      ((this._previewAudioSrc = value204),
        el76.appendChild(value203),
        el75.appendChild(el76),
        value197 &&
          this._syncPreviewTime('audio', this._audioSourceSecForPlayhead(this._playheadSec || 0), {
            immediate: true,
          }),
        el75.appendChild(this._renderPreviewControls()));
    }
    return el75;
  }
  ['_renderVideoFallback'](value205 = '') {
    const text9 = normalizeText(value205);
    if (text9) {
      const value206 = document.createElement('img');
      return (
        (value206.className = 'media-clip-video-fallback'),
        (value206.src = text9),
        (value206.alt = ''),
        (value206.draggable = false),
        value206
      );
    }
    const value207 = document.createElement('div');
    return ((value207.className = 'media-clip-video-fallback is-empty'), value207);
  }
  ['_estimateTimelineWidth'](options10 = {}) {
    const toNumber27 = toNumber(options10.timelineWidthPx, 0);
    if (toNumber27 > 0) return Math.max(240, toNumber27);
    const toNumber28 = toNumber(this.nodeData?.width, MEDIA_CLIP_COMPACT_SIZE.width),
      value208 = options10.compact === true ? 136 : 116;
    return Math.max(240, toNumber28 - value208);
  }
  ['_timelineViewportWidth']() {
    const toNumber29 = toNumber(this.nodeData?.width, MEDIA_CLIP_COMPACT_SIZE.width);
    return Math.max(240, toNumber29 - 64);
  }
  ['_timelineZoom'](zoom2 = {}) {
    return normalizeMediaClipTimelineView({
      zoom: zoom2.timelineZoom ?? this._timelineView?.zoom ?? this._mediaClip?.timelineView?.zoom,
    }).zoom;
  }
  ['_timelineTrackContentWidth'](options11 = {}) {
    const timelineZoom = this._timelineZoom(options11),
      durationSec3 = this._primaryDuration({ timelineZoom: timelineZoom });
    return getMediaClipTimelineTrackWidthPx({
      durationSec: durationSec3,
      viewportWidthPx: this._timelineViewportWidth(),
      zoom: timelineZoom,
    });
  }
  ['_timelineAxisWidthPx']() {
    return this._mediaClip.tracks?.audio ? MEDIA_CLIP_TIMELINE_AXIS_WIDTH_PX : 0;
  }
  ['_timelineMaterialEndSec']() {
    const value209 = this._mediaClip.tracks?.video,
      count10 = this._videoTimelineMaterialEnd(value209);
    if (count10 > 0) return count10;
    const value210 = this._mediaClip.tracks?.audio;
    if (value210) return this._audioTimelineMaterialEnd(value210);
    return 0;
  }
  ['_timelineAddSlotLeftPx'](trackWidthPx5 = this._timelineTrackContentWidth(), displayDurationSec = {}) {
    return getMediaClipTimelineAddSlotLeftPx({
      trackWidthPx: trackWidthPx5,
      displayDurationSec: displayDurationSec.displayDurationSec ?? this._primaryDuration(),
      materialEndSec: displayDurationSec.materialEndSec ?? this._timelineMaterialEndSec(),
    });
  }
  ['_timelineContentWidth'](trackWidthPx6 = this._timelineTrackContentWidth(), displayDurationSec2 = {}) {
    return (
      this._timelineAxisWidthPx() +
      getMediaClipTimelineContentWidthPx({
        trackWidthPx: trackWidthPx6,
        displayDurationSec: displayDurationSec2.displayDurationSec ?? this._primaryDuration(),
        materialEndSec: displayDurationSec2.materialEndSec ?? this._timelineMaterialEndSec(),
      })
    );
  }
  ['_syncTimelineAddSlotPosition'](value211 = this._timelineTrackContentWidth(), value212 = {}) {
    const value213 = Math.max(240, Math.ceil(toNumber(value211, 0))),
      value214 = this._timelineAddSlotLeftPx(value213, value212),
      value215 = this._timelineContentWidth(value213, value212),
      el77 = this.el?.querySelector?.('.media-clip-compact-timeline');
    if (!el77) return;
    (el77.style.setProperty('--media-clip-add-left', value214 + 'px'),
      el77.style.setProperty('--media-clip-timeline-content-width', value215 + 'px'),
      el77.style.setProperty('--media-clip-track-axis-width', this._timelineAxisWidthPx() + 'px'));
    const el78 = el77.querySelector?.('.media-clip-add-btn');
    if (el78) el78.style.left = this._timelineAxisWidthPx() + value214 + 'px';
  }
  ['_syncTimelineAddSlotForRow'](value216, args11 = {}) {
    const value217 = Math.max(240, readLayoutWidthPx(value216, this._timelineTrackContentWidth()));
    this._syncTimelineCursorLayerForRow(value216);
    const value218 = args11.displayDurationSec ?? args11.durationSec;
    if (Number.isFinite(toNumber(value218, NaN))) {
      const durationSec4 = getMediaClipTimelineDisplayDuration(value218);
      (this._setTimelineRowDuration(value216, durationSec4),
        this._syncTimelineRulerTicks(value217, { ...args11, durationSec: durationSec4 }));
    }
    this._syncTimelineAddSlotPosition(value217, args11);
  }
  ['_syncTimelineContentWidth'](value219 = this._timelineTrackContentWidth(), value220 = {}) {
    const value221 = Math.max(240, Math.ceil(toNumber(value219, 0))),
      el79 = this.el?.querySelector?.('.media-clip-compact-timeline');
    if (!el79) return;
    (el79.style.setProperty('--media-clip-track-content-width', value221 + 'px'),
      el79.style.setProperty('--media-clip-track-axis-width', this._timelineAxisWidthPx() + 'px'),
      this._syncTimelineAddSlotPosition(value221, value220),
      this.el?.querySelectorAll?.('.media-clip-track, .media-clip-ruler')?.forEach((el80) => {
        el80.style.width = value221 + 'px';
      }),
      this._syncTimelineRulerTicks(value221, value220),
      this._syncTimelineScrollFade(this.el?.querySelector?.('.media-clip-timeline-scroll')));
  }
  ['_timelineRulerTicks'](value222, value223, value224 = {}) {
    const mediaClipTimelineDisplayDuration2 = getMediaClipTimelineDisplayDuration(value222);
    return buildMediaClipTimelineTicks(mediaClipTimelineDisplayDuration2, value223);
  }
  ['_populateTimelineRuler'](el81, value225, value226, value227 = {}) {
    if (!el81) return;
    const mediaClipTimelineDisplayDuration3 = getMediaClipTimelineDisplayDuration(value225),
      list13 = this._timelineRulerTicks(mediaClipTimelineDisplayDuration3, value226, value227),
      value228 = mediaClipTimelineDisplayDuration3 + ':' + list13.join(',');
    if (el81.dataset?.tickSignature === value228) return;
    if (el81.dataset) el81.dataset.tickSignature = value228;
    (typeof el81.replaceChildren === 'function' ? el81.replaceChildren() : (el81.textContent = ''),
      list13.forEach((item16) => {
        const el82 = document.createElement('span');
        ((el82.className = 'media-clip-ruler-tick'), (el82.textContent = formatTime(item16)));
        const mediaClipTimelinePercent = getMediaClipTimelinePercent(
          item16,
          mediaClipTimelineDisplayDuration3,
        );
        ((el82.style.left = mediaClipTimelinePercent + '%'), el81.appendChild(el82));
      }));
  }
  ['_syncTimelineRulerTicks'](value229 = this._timelineTrackContentWidth(), value230 = {}) {
    const enabled28 = this.el?.querySelector?.('.media-clip-ruler');
    if (!enabled28) return;
    const value231 = value230.durationSec ?? value230.displayDurationSec ?? this._primaryDuration();
    this._populateTimelineRuler(enabled28, value231, value229, value230);
  }
  ['_renderRuler'](value232, value233 = {}) {
    const mediaClipTimelineDisplayDuration4 = getMediaClipTimelineDisplayDuration(value232),
      value234 = this._estimateTimelineWidth(value233),
      value235 = document.createElement('div');
    return (
      (value235.className = 'media-clip-ruler'),
      this._populateTimelineRuler(value235, mediaClipTimelineDisplayDuration4, value234, value233),
      value235
    );
  }
  ['_renderTimelineCursors'](durationSec5 = this._primaryDuration()) {
    const el83 = document.createElement('div');
    ((el83.className = 'media-clip-timeline-cursors'), el83.setAttribute('aria-hidden', 'true'));
    const value236 = document.createElement('div');
    ((value236.className = 'media-clip-playhead media-clip-timeline-cursor media-clip-timeline-cursor-fixed'),
      this._applyTimelinePlayheadModel(
        value236,
        getMediaClipTimelinePlayheadModel({ playheadSec: this._playheadSec, durationSec: durationSec5 }),
      ));
    const el84 = document.createElement('div');
    return (
      (el84.className =
        'media-clip-hover-playhead media-clip-timeline-cursor media-clip-timeline-cursor-hover'),
      (el84.hidden = true),
      el83.append(value236, el84),
      el83
    );
  }
  ['_timelineCursorKind']() {
    const text10 = normalizeText(this._mediaClip.activeTrack);
    if (text10 && this._mediaClip.tracks?.[text10]) return text10;
    if (this._mediaClip.tracks?.video) return 'video';
    if (this._mediaClip.tracks?.audio) return 'audio';
    return '';
  }
  ['_timelineDurationForKind'](value237 = this._timelineCursorKind(), value238 = {}) {
    const enabled29 = this._mediaClip.tracks?.[value237];
    if (!enabled29) return this._primaryDuration(value238);
    if (value237 === 'video') return this._videoTimelineDuration(enabled29, null, value238);
    if (value237 === 'audio') {
      const value239 = this._mediaClip.tracks?.video;
      return value239
        ? this._videoTimelineDuration(value239, null, value238)
        : this._audioTimelineDuration(enabled29, null, value238);
    }
    return getTrackDuration(enabled29);
  }
  ['_timelinePointerContext'](el85, el86 = null) {
    const el87 = el86?.closest?.('.media-clip-track:not(.is-compact)'),
      value240 = el87?.classList?.contains('media-clip-track-audio')
        ? 'audio'
        : el87?.classList?.contains('media-clip-track-video')
          ? 'video'
          : '',
      kind3 = value240 || this._timelineCursorKind();
    if (!kind3) return null;
    const row = value240 ? el87 : el85?.querySelector?.('.media-clip-track-' + kind3 + ':not(.is-compact)');
    if (!row) return null;
    const value241 = this._timelineDurationForKind(kind3);
    return { kind: kind3, row: row, duration: this._timelineRowDuration(row, value241) };
  }
  ['_isTimelineControlTarget'](el88) {
    return !!el88?.closest?.(
      '.media-clip-pick-btn, .media-clip-tool, .media-clip-menu, .media-clip-material-menu, .media-clip-menu-item, .media-clip-audio-lane-mute-btn, .media-clip-trim',
    );
  }
  ['_timelineEventSegment'](el89) {
    return el89?.closest?.('.media-clip-segment') || null;
  }
  ['_openMaterialMenu'](kind4, value242, event9) {
    if (!kind4 || !event9) return;
    (event9.preventDefault?.(), event9.stopPropagation?.());
    const value243 = this._materialMenuHost(),
      x = this._materialMenuLocalPoint(event9.clientX, event9.clientY, value243);
    ((this._menuOpen = false),
      (this._materialMenu = {
        kind: kind4,
        clipIndex: Math.max(0, Math.trunc(toNumber(value242, 0))),
        x: x.x,
        y: x.y,
      }),
      this._syncMaterialMenuDismissListener(true),
      this._removeMaterialMenuPortal(),
      this._renderMaterialMenuPortal());
  }
  ['_bindTimelinePointerCursors'](el90, enabled30) {
    if (!el90 || !enabled30) return;
    (el90.addEventListener('pointermove', (event10) => {
      if (this._timelineDrag() || this._isTimelineControlTarget(event10.target)) return;
      const enabled31 = this._timelinePointerContext(enabled30, event10.target);
      if (!enabled31) return;
      const playheadSec = this._timelineSecFromPointerEvent(enabled31.row, event10, enabled31.duration);
      this._timelineEventSegment(event10.target)
        ? this._previewTrackPlayhead(enabled31.row, enabled31.kind, playheadSec, enabled31.duration)
        : this._updateTimelineHoverPlayheadVisual(enabled31.row, enabled31.duration, {
            playheadSec: playheadSec,
          });
    }),
      el90.addEventListener('pointerdown', (event11) => {
        if (event11.button !== 0 || this._timelineDrag() || this._isTimelineControlTarget(event11.target))
          return;
        if (this._timelineEventSegment(event11.target)) return;
        const enabled32 = this._timelinePointerContext(enabled30, event11.target);
        if (!enabled32) return;
        this._setTimelinePlayheadFromPointer(enabled32.row, enabled32.kind, event11, enabled32.duration, {
          updateActiveTrack: false,
          updateClipSelection: false,
          selectClip: false,
          syncPreview: false,
        });
      }),
      el90.addEventListener('pointerleave', () => {
        if (this._timelineDrag()) return;
        (this._hideTimelineHoverPlayhead(el90), this._restoreTimelinePlayheads());
      }),
      el90.addEventListener('click', (event12) => {
        if (this._timelineDrag() || this._isTimelineControlTarget(event12.target)) return;
        if (!this._timelineEventSegment(event12.target)) return;
        const enabled33 = this._timelinePointerContext(enabled30, event12.target);
        if (!enabled33) return;
        const value244 = this._timelineSecFromPointerEvent(enabled33.row, event12, enabled33.duration),
          forceRender =
            enabled33.kind === 'video'
              ? this._setActiveClipIndex(this._clipIndexAtTimelineSec(value244))
              : enabled33.kind === 'audio'
                ? this._setActiveAudioClipIndex(this._audioClipIndexAtTimelineSec(value244))
                : false;
        if (enabled33.kind === 'audio') this._selectAudioClipIndex(this._activeAudioClipIndex);
        this._setActiveTrack(enabled33.kind, value244, { forceRender: forceRender });
      }));
  }
  ['_videoSources']() {
    const list14 = Array.isArray(this._sources?.videos) ? this._sources.videos : [];
    if (list14.length) return list14;
    return this._sources?.video ? [this._sources.video] : [];
  }
  ['_firstVideoSource']() {
    return this._videoSources().find((item17) => getMediaClipInputKind(item17) === 'video') || null;
  }
  ['_videoClipSource'](options12 = {}, value245 = 0) {
    const list15 = this._videoSources(),
      text11 = normalizeText(options12.sourceId),
      text12 = normalizeText(options12.sourceKey);
    return (
      list15.find((item18) => normalizeText(item18?.id) === text11) ||
      list15.find((item19) => normalizeText(item19?.__mediaClipEdgeId) === normalizeText(options12.id)) ||
      list15.find((item20) => normalizeText(resolveMediaClipSourceKey(item20)) === text12) ||
      list15[value245] ||
      this._sources?.video ||
      null
    );
  }
  ['_audioSources']() {
    const list16 = Array.isArray(this._sources?.audios) ? this._sources.audios : [];
    if (list16.length) return list16;
    return this._sources?.audio ? [this._sources.audio] : [];
  }
  ['_audioClipSource'](options13 = {}, value246 = 0) {
    const list17 = this._audioSources(),
      text13 = normalizeText(options13.sourceId),
      text14 = normalizeText(options13.sourceKey);
    return (
      list17.find((item21) => normalizeText(item21?.id) === text13) ||
      list17.find((item22) => normalizeText(item22?.__mediaClipEdgeId) === normalizeText(options13.id)) ||
      list17.find((item23) => normalizeText(resolveMediaClipSourceKey(item23)) === text14) ||
      list17[value246] ||
      this._sources?.audio ||
      null
    );
  }
  ['_videoTimelineClips'](sourceKey = null) {
    const list18 = Array.isArray(this._mediaClip?.clips) ? this._mediaClip.clips : [];
    if (list18.length) return list18;
    if (!sourceKey) return [];
    return [
      {
        id: 'video:0',
        sourceKey: sourceKey.sourceKey,
        startSec: sourceKey.startSec,
        endSec: sourceKey.endSec,
        durationSec: sourceKey.durationSec,
        timelineStartSec: sourceKey.startSec,
        timelineEndSec: sourceKey.endSec,
      },
    ];
  }
  ['_audioTimelineClips'](sourceKey2 = null) {
    const list19 = Array.isArray(this._mediaClip?.audioClips) ? this._mediaClip.audioClips : [];
    if (list19.length) return list19;
    if (!sourceKey2) return [];
    const startSec4 = toNumber(sourceKey2.startSec, 0),
      endSec2 = Math.max(startSec4, toNumber(sourceKey2.endSec, startSec4));
    return [
      {
        id: 'audio:0',
        kind: 'audio',
        sourceKey: sourceKey2.sourceKey,
        startSec: startSec4,
        endSec: endSec2,
        durationSec: sourceKey2.durationSec,
        timelineStartSec: startSec4,
        timelineEndSec: endSec2,
        laneIndex: 0,
        muted: false,
        disabled: false,
      },
    ];
  }
  ['_timelineDurationForZoom'](value247 = 0, value248 = {}) {
    const mediaClipTimelineDisplayDuration5 = getMediaClipTimelineDisplayDuration(value247),
      value249 = Math.max(
        mediaClipTimelineDisplayDuration5,
        mediaClipTimelineDisplayDuration5 * TIMELINE_ZOOM_OUT_DISPLAY_MULTIPLIER,
      );
    if (value249 <= mediaClipTimelineDisplayDuration5) return mediaClipTimelineDisplayDuration5;
    const count11 = this._timelineZoom(value248);
    if (count11 >= 1) return mediaClipTimelineDisplayDuration5;
    const value250 = Math.max(0.001, 1 - MEDIA_CLIP_TIMELINE_ZOOM_MIN),
      value251 = Math.max(0, Math.min(1, (1 - count11) / value250));
    return (
      Math.round(
        (mediaClipTimelineDisplayDuration5 + (value249 - mediaClipTimelineDisplayDuration5) * value251) *
          0x3e8,
      ) / 0x3e8
    );
  }
  ['_videoTimelineBaseDuration'](value252 = null, value253 = null) {
    const list20 = Array.isArray(value253) ? value253 : this._videoTimelineClips(value252),
      value254 = this._videoTimelineMaterialEnd(value252, list20),
      count12 = list20.reduce(
        (item24, value255) => Math.min(item24, toNumber(value255?.timelineStartSec, 0)),
        0,
      ),
      value256 = count12 < 0 ? Math.max(0, value254 - count12) : value254;
    if (list20.length) {
      const value257 =
        list20.length === 1
          ? Math.max(toNumber(list20[0]?.durationSec, 0), toNumber(value252?.durationSec, 0))
          : 0;
      return getMediaClipTimelineDisplayDuration(Math.max(value254, value256, value257));
    }
    return getMediaClipTimelineDisplayDuration(
      Math.max(toNumber(value252?.durationSec, 0), getTrackDuration(value252)),
    );
  }
  ['_videoTimelineDuration'](value258 = null, value259 = null, value260 = {}) {
    return this._timelineDurationForZoom(this._videoTimelineBaseDuration(value258, value259), value260);
  }
  ['_timelineSegmentVisualDurationSec'](el91 = null, enabled34 = null) {
    if (!el91 || !enabled34) return 0;
    const count13 = Math.max(0, toNumber(enabled34.timelineStartSec, 0)),
      count14 = Math.max(count13, toNumber(enabled34.timelineEndSec, count13)),
      count15 = Math.max(0, count14 - count13),
      percentValue = parsePercentValue(el91?.style?.left),
      percentValue2 = parsePercentValue(el91?.style?.width),
      percentValue3 = parsePercentValue(el91?.style?.right),
      count16 =
        Number.isFinite(percentValue2) && percentValue2 > 0
          ? percentValue2
          : Number.isFinite(percentValue) && Number.isFinite(percentValue3)
            ? Math.max(0, 100 - percentValue - percentValue3)
            : NaN,
      list21 = [];
    return (
      Number.isFinite(percentValue) &&
        percentValue > 0 &&
        count13 > 0 &&
        list21.push(count13 / (percentValue / 100)),
      Number.isFinite(count16) && count16 > 0 && count15 > 0 && list21.push(count15 / (count16 / 100)),
      Number.isFinite(percentValue) &&
        Number.isFinite(count16) &&
        percentValue + count16 > 0 &&
        count14 > 0 &&
        list21.push(count14 / ((percentValue + count16) / 100)),
      Math.max(0, ...list21.filter((count17) => Number.isFinite(count17) && count17 > 0))
    );
  }
  ['_setTimelineRowDuration'](el92 = null, value261 = 0) {
    if (!el92?.dataset) return;
    el92.dataset.timelineDurationSec = String(getMediaClipTimelineDisplayDuration(value261));
  }
  ['_timelineRowDuration'](el93 = null, value262 = 0) {
    const toNumber30 = toNumber(el93?.dataset?.timelineDurationSec, NaN);
    if (Number.isFinite(toNumber30) && toNumber30 > 0) return getMediaClipTimelineDisplayDuration(toNumber30);
    return getMediaClipTimelineDisplayDuration(value262);
  }
  ['_resolveTimelineDragDuration'](value263, value264 = null, value265 = null, el94 = null, value266 = 0) {
    if (value263 === 'audio') {
      const value267 = Array.isArray(value265) ? value265 : this._audioTimelineClips(value264),
        value268 = this._timelineDurationForKind('audio'),
        value269 = el94?.closest?.('.media-clip-track') || null;
      return this._timelineRowDuration(value269, value268);
    }
    if (value263 !== 'video') return getTrackDuration(value264);
    const value270 = Array.isArray(value265) ? value265 : this._videoTimelineClips(value264),
      value271 = this._videoTimelineDuration(value264, value270),
      value272 = el94?.closest?.('.media-clip-track') || null;
    return this._timelineRowDuration(value272, value271);
  }
  ['_videoTimelineMaterialEnd'](value273 = null, value274 = null) {
    const list22 = Array.isArray(value274) ? value274 : this._videoTimelineClips(value273);
    if (list22.length)
      return list22.reduce((item25, value275) => Math.max(item25, toNumber(value275.timelineEndSec, 0)), 0);
    return Math.max(0, toNumber(value273?.endSec || value273?.durationSec, 0));
  }
  ['_audioTimelineMaterialEnd'](value276 = null, value277 = null) {
    const list23 = Array.isArray(value277) ? value277 : this._audioTimelineClips(value276);
    if (list23.length)
      return list23.reduce((item26, value278) => Math.max(item26, toNumber(value278.timelineEndSec, 0)), 0);
    return Math.max(0, toNumber(value276?.endSec || value276?.durationSec, 0));
  }
  ['_audioTimelineDuration'](value279 = null, value280 = null, value281 = {}) {
    const list24 = Array.isArray(value280) ? value280 : this._audioTimelineClips(value279),
      value282 = this._audioTimelineMaterialEnd(value279, list24),
      value283 =
        list24.length === 1
          ? Math.max(toNumber(list24[0]?.durationSec, 0), toNumber(value279?.durationSec, 0))
          : toNumber(value279?.durationSec, 0);
    return this._timelineDurationForZoom(Math.max(value282, value283), value281);
  }
  ['_clampVideoClipIndex'](value284 = this._activeClipIndex) {
    const value285 = Math.max(0, this._videoTimelineClips(this._mediaClip.tracks?.video).length),
      value286 = Math.max(0, value285 - 1);
    return Math.max(0, Math.min(value286, Math.trunc(toNumber(value284, 0))));
  }
  ['_clampAudioClipIndex'](value287 = this._activeAudioClipIndex) {
    const value288 = Math.max(0, this._audioTimelineClips(this._mediaClip.tracks?.audio).length),
      value289 = Math.max(0, value288 - 1);
    return Math.max(0, Math.min(value289, Math.trunc(toNumber(value287, 0))));
  }
  ['_clipIndexAtTimelineSec'](value290, value291 = this._videoTimelineClips(this._mediaClip.tracks?.video)) {
    const list25 = Array.isArray(value291) ? value291 : [];
    if (!list25.length) return 0;
    const toNumber31 = toNumber(value290, 0),
      count18 = list25.findIndex((item27, value292) => {
        const toNumber32 = toNumber(item27.timelineStartSec, 0),
          value293 = Math.max(toNumber32, toNumber(item27.timelineEndSec, toNumber32));
        return value292 === list25.length - 1
          ? toNumber31 >= toNumber32 && toNumber31 <= value293
          : toNumber31 >= toNumber32 && toNumber31 < value293;
      });
    if (count18 >= 0) return count18;
    let value294 = 0,
      value295 = Number.POSITIVE_INFINITY;
    return (
      list25.forEach((item28, value296) => {
        const toNumber33 = toNumber(item28.timelineStartSec, 0),
          value297 = Math.max(toNumber33, toNumber(item28.timelineEndSec, toNumber33)),
          value298 = toNumber31 < toNumber33 ? toNumber33 - toNumber31 : toNumber31 - value297;
        value298 < value295 && ((value294 = value296), (value295 = value298));
      }),
      value294
    );
  }
  ['_audioClipIndexAtTimelineSec'](
    value299,
    value300 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
  ) {
    const list26 = Array.isArray(value300) ? value300 : [];
    if (!list26.length) return 0;
    const toNumber34 = toNumber(value299, 0),
      count19 = list26.findIndex((item29, value301) => {
        const toNumber35 = toNumber(item29.timelineStartSec, 0),
          value302 = Math.max(toNumber35, toNumber(item29.timelineEndSec, toNumber35));
        return value301 === list26.length - 1
          ? toNumber34 >= toNumber35 && toNumber34 <= value302
          : toNumber34 >= toNumber35 && toNumber34 < value302;
      });
    if (count19 >= 0) return count19;
    let value303 = 0,
      value304 = Number.POSITIVE_INFINITY;
    return (
      list26.forEach((item30, value305) => {
        const toNumber36 = toNumber(item30.timelineStartSec, 0),
          value306 = Math.max(toNumber36, toNumber(item30.timelineEndSec, toNumber36)),
          value307 = toNumber34 < toNumber36 ? toNumber36 - toNumber34 : toNumber34 - value306;
        value307 < value304 && ((value303 = value305), (value304 = value307));
      }),
      value303
    );
  }
  ['_setActiveClipIndex'](value308 = this._activeClipIndex) {
    const value309 = this._clampVideoClipIndex(value308),
      value310 = value309 !== this._activeClipIndex;
    return ((this._activeClipIndex = value309), value310);
  }
  ['_setActiveAudioClipIndex'](value311 = this._activeAudioClipIndex) {
    const value312 = this._clampAudioClipIndex(value311),
      value313 = value312 !== this._activeAudioClipIndex;
    return ((this._activeAudioClipIndex = value312), value313);
  }
  ['_clampSelectedClipIndex'](value314 = this._selectedClipIndex) {
    const value315 = Math.max(0, this._videoTimelineClips(this._mediaClip.tracks?.video).length),
      count20 = Math.trunc(toNumber(value314, -1));
    return count20 >= 0 && count20 < value315 ? count20 : -1;
  }
  ['_clampSelectedAudioClipIndex'](value316 = this._selectedAudioClipIndex) {
    const value317 = Math.max(0, this._audioTimelineClips(this._mediaClip.tracks?.audio).length),
      count21 = Math.trunc(toNumber(value316, -1));
    return count21 >= 0 && count21 < value317 ? count21 : -1;
  }
  ['_selectClipIndex'](value318 = this._activeClipIndex) {
    const value319 = this._clampVideoClipIndex(value318),
      value320 = value319 !== this._selectedClipIndex;
    return ((this._selectedClipIndex = value319), value320);
  }
  ['_selectAudioClipIndex'](value321 = this._activeAudioClipIndex) {
    const value322 = this._clampAudioClipIndex(value321),
      value323 = value322 !== this._selectedAudioClipIndex;
    return ((this._selectedAudioClipIndex = value322), value323);
  }
  ['_patchAudioClipState'](value324 = this._activeAudioClipIndex, value325 = {}) {
    const value326 = Math.max(0, Math.trunc(toNumber(value324, 0))),
      value327 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
      enabled35 = value327[value326];
    if (!enabled35) return false;
    return (
      (this._mediaClip = patchMediaClipAudioClipState(this._mediaClip, value326, value325)),
      this._setActiveAudioClipIndex(value326),
      this._selectAudioClipIndex(value326),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }),
      commit(),
      this._refreshMediaClipTimelineInPlace(),
      true
    );
  }
  ['_toggleAudioClipMuted'](value328 = this._activeAudioClipIndex) {
    const value329 = Math.max(0, Math.trunc(toNumber(value328, 0))),
      muted = this._audioTimelineClips(this._mediaClip.tracks?.audio)[value329];
    if (!muted) return false;
    return this._patchAudioClipState(value329, { muted: muted.muted !== true });
  }
  ['_audioClipsForLane'](value330 = 0, value331 = this._audioTimelineClips(this._mediaClip.tracks?.audio)) {
    const mediaClipAudioLaneIndex = normalizeMediaClipAudioLaneIndex(value330),
      list27 = Array.isArray(value331) ? value331 : [];
    return list27.filter((item31) => this._audioClipLaneIndex(item31) === mediaClipAudioLaneIndex);
  }
  ['_isAudioLaneMuted'](value332 = 0, value333 = this._audioTimelineClips(this._mediaClip.tracks?.audio)) {
    const list28 = this._audioClipsForLane(value332, value333);
    return list28.length > 0 && list28.every((item32) => item32?.muted === true);
  }
  ['_toggleAudioLaneMuted'](value334 = 0) {
    const mediaClipAudioLaneIndex2 = normalizeMediaClipAudioLaneIndex(value334),
      value335 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
      list29 = this._audioClipsForLane(mediaClipAudioLaneIndex2, value335);
    if (!list29.length) return false;
    const value336 = !this._isAudioLaneMuted(mediaClipAudioLaneIndex2, value335);
    this._mediaClip = patchMediaClipAudioLaneMuted(this._mediaClip, mediaClipAudioLaneIndex2, value336);
    const value337 = Math.max(
      0,
      this._mediaClip.audioClips?.findIndex?.(
        (value338) => this._audioClipLaneIndex(value338) === mediaClipAudioLaneIndex2,
      ) ?? 0,
    );
    return (
      this._setActiveAudioClipIndex(value337),
      this._selectAudioClipIndex(value337),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }),
      commit(),
      this._refreshMediaClipTimelineInPlace(),
      true
    );
  }
  ['_toggleAudioClipDisabled'](value339 = this._activeAudioClipIndex) {
    const value340 = Math.max(0, Math.trunc(toNumber(value339, 0))),
      disabled = this._audioTimelineClips(this._mediaClip.tracks?.audio)[value340];
    if (!disabled) return false;
    return this._patchAudioClipState(value340, { disabled: disabled.disabled !== true });
  }
  ['_segmentClipIndex'](el95, value341 = 'video', value342 = null) {
    const text15 = normalizeText(el95?.dataset?.clipId);
    if (text15) {
      const list30 = Array.isArray(value342)
          ? value342
          : value341 === 'audio'
            ? this._mediaClip.audioClips || []
            : this._mediaClip.clips || [],
        count22 = list30.findIndex((item33) => normalizeText(item33?.id) === text15);
      if (count22 >= 0) return count22;
    }
    return Math.max(0, Math.trunc(toNumber(el95?.dataset?.clipIndex, 0)));
  }
  ['_timelineRowForDrag'](value343 = this._timelineDrag()) {
    if (value343?.rowEl) return value343.rowEl;
    const text16 = normalizeText(value343?.kind);
    if (!text16) return null;
    return (
      this.el?.querySelector?.('.media-clip-track-' + text16 + ':not(.is-compact)') ||
      this.el?.querySelector?.('.media-clip-track-' + text16) ||
      null
    );
  }
  ['_videoSourceSecForTimelineSec'](value344 = this._playheadSec, value345 = null) {
    const list31 = Array.isArray(value345)
      ? value345
      : this._videoTimelineClips(this._mediaClip.tracks?.video);
    if (!list31.length) return value344;
    const toNumber37 = toNumber(value344, 0);
    if (list31.length === 1) {
      const value346 = list31[0],
        toNumber38 = toNumber(value346.startSec, 0),
        toNumber39 = toNumber(value346.endSec, toNumber38),
        toNumber40 = toNumber(value346.timelineStartSec, 0),
        toNumber41 = toNumber(value346.timelineEndSec, toNumber40);
      if (toNumber37 >= toNumber40 && toNumber37 <= toNumber41) return toNumber38 + (toNumber37 - toNumber40);
      return Math.max(toNumber38, Math.min(toNumber39, toNumber37));
    }
    const value347 = list31[this._clipIndexAtTimelineSec(toNumber37, list31)] || list31[list31.length - 1],
      toNumber42 = toNumber(value347.timelineStartSec, 0),
      toNumber43 = toNumber(value347.startSec, 0),
      toNumber44 = toNumber(value347.endSec, toNumber43);
    return Math.max(toNumber43, Math.min(toNumber44, toNumber43 + (toNumber37 - toNumber42)));
  }
  ['_videoSourceSecForPlayhead'](value348 = this._playheadSec) {
    return this._videoSourceSecForTimelineSec(value348);
  }
  ['_audioSourceSecForPlayhead'](value349 = this._playheadSec) {
    const list32 = this._audioTimelineClips(this._mediaClip.tracks?.audio);
    if (!list32.length) return value349;
    const toNumber45 = toNumber(value349, 0),
      value350 = list32[this._audioClipIndexAtTimelineSec(toNumber45, list32)] || list32[list32.length - 1],
      toNumber46 = toNumber(value350.timelineStartSec, 0),
      toNumber47 = toNumber(value350.startSec, 0),
      toNumber48 = toNumber(value350.endSec, toNumber47);
    return Math.max(toNumber47, Math.min(toNumber48, toNumber47 + (toNumber45 - toNumber46)));
  }
  ['_audioClipSourceSec'](options14 = {}, value351 = this._playheadSec) {
    const toNumber49 = toNumber(options14.timelineStartSec, 0),
      toNumber50 = toNumber(options14.startSec, 0),
      toNumber51 = toNumber(options14.endSec, toNumber50);
    return Math.max(toNumber50, Math.min(toNumber51, toNumber50 + (toNumber(value351, 0) - toNumber49)));
  }
  ['_audioClipLaneIndex'](options15 = {}) {
    return normalizeMediaClipAudioLaneIndex(options15?.laneIndex);
  }
  ['_audioLaneCount'](value352 = this._audioTimelineClips(this._mediaClip.tracks?.audio), value353 = {}) {
    const list33 = Array.isArray(value352) ? value352 : [],
      value354 = list33.reduce((item34, value355) => Math.max(item34, this._audioClipLaneIndex(value355)), 0),
      value356 = Number.isFinite(Number(value353.previewLaneIndex))
        ? normalizeMediaClipAudioLaneIndex(value353.previewLaneIndex)
        : 0;
    return Math.max(1, Math.min(MEDIA_CLIP_AUDIO_LANE_COUNT_MAX, Math.max(value354, value356) + 1));
  }
  ['_setAudioLaneCountStyle'](el96, value357 = 1) {
    if (!el96?.style) return;
    const value358 = Math.max(
        1,
        Math.min(MEDIA_CLIP_AUDIO_LANE_COUNT_MAX, Math.trunc(toNumber(value357, 1))),
      ),
      value359 =
        value358 * MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + Math.max(0, value358 - 1) * MEDIA_CLIP_AUDIO_LANE_GAP_PX,
      handler3 = (value360, value361) => {
        if (typeof el96.style.setProperty === 'function') el96.style.setProperty(value360, value361);
        else el96.style[value360] = value361;
      };
    (handler3('--media-clip-audio-lane-count', String(value358)),
      handler3('--media-clip-audio-lane-height', MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + 'px'),
      handler3('--media-clip-audio-lane-gap', MEDIA_CLIP_AUDIO_LANE_GAP_PX + 'px'),
      handler3('--media-clip-audio-stack-height', value359 + 'px'));
  }
  ['_setAudioSegmentLaneVisual'](el97, value362 = 0) {
    if (!el97?.style) return;
    const mediaClipAudioLaneIndex3 = normalizeMediaClipAudioLaneIndex(value362),
      value363 = mediaClipAudioLaneIndex3 * (MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + MEDIA_CLIP_AUDIO_LANE_GAP_PX);
    ((el97.dataset.audioLaneIndex = String(mediaClipAudioLaneIndex3)),
      typeof el97.style.setProperty === 'function'
        ? (el97.style.setProperty('--media-clip-audio-lane-index', String(mediaClipAudioLaneIndex3)),
          el97.style.setProperty('--media-clip-audio-lane-top', value363 + 'px'))
        : ((el97.style['--media-clip-audio-lane-index'] = String(mediaClipAudioLaneIndex3)),
          (el97.style['--media-clip-audio-lane-top'] = value363 + 'px')));
  }
  ['_audioLaneIndexFromDrag'](options16 = {}) {
    const mediaClipAudioLaneIndex4 = normalizeMediaClipAudioLaneIndex(options16.startLaneIndex),
      toNumber52 = toNumber(options16.latestClientY, options16.startY) - toNumber(options16.startY, 0);
    if (Math.abs(toNumber52) < MEDIA_CLIP_AUDIO_LANE_DRAG_THRESHOLD_PX) return mediaClipAudioLaneIndex4;
    const value364 = MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + MEDIA_CLIP_AUDIO_LANE_GAP_PX,
      value365 = Math.round(toNumber52 / value364);
    return normalizeMediaClipAudioLaneIndex(mediaClipAudioLaneIndex4 + value365);
  }
  ['_previewSourceSecForTimelineSec'](value366, value367 = this._playheadSec) {
    if (value366 === 'video') return this._videoSourceSecForPlayhead(value367);
    if (value366 === 'audio') return this._audioSourceSecForPlayhead(value367);
    return value367;
  }
  ['_applyTimelineSegmentRect'](el98, value368 = {}) {
    if (!el98) return;
    ((el98.style.left = toNumber(value368.leftPct, 0) + '%'),
      (el98.style.width = toNumber(value368.widthPct, 0) + '%'),
      (el98.style.right = ''));
  }
  ['_applyAudioTimelineSegmentRect'](el99, value369 = {}) {
    if (!el99) return;
    ((el99.style.left = toNumber(value369.leftPct, 0) + '%'),
      (el99.style.right = Math.max(0, 100 - toNumber(value369.rightPct, 0)) + '%'),
      (el99.style.width = 'auto'));
  }
  ['_applyAudioTimelineTrimRect'](value370, value371 = {}) {
    this._applyAudioTimelineSegmentRect(value370, value371);
  }
  ['_timelinePreviewRangeRect'](options17 = {}) {
    const startSec5 = toNumber(options17.startSec, 0),
      endSec3 = Math.max(startSec5, toNumber(options17.endSec, startSec5));
    if (startSec5 >= 0) return getMediaClipTimelineRangeRect(options17);
    const mediaClipTimelineDisplayDuration6 = getMediaClipTimelineDisplayDuration(options17.durationSec),
      leftPct = (startSec5 / mediaClipTimelineDisplayDuration6) * 100,
      rightPct = (endSec3 / mediaClipTimelineDisplayDuration6) * 100;
    return {
      startSec: startSec5,
      endSec: endSec3,
      leftPct: leftPct,
      rightPct: rightPct,
      widthPct: Math.max(0, rightPct - leftPct),
    };
  }
  ['_timelineCursorHost'](el100 = null) {
    return (
      el100?.closest?.('.media-clip-compact-timeline') ||
      this.el?.querySelector?.('.media-clip-compact-timeline') ||
      el100
    );
  }
  ['_syncTimelineCursorLayerForRow'](enabled36 = null) {
    if (!enabled36) return;
    const el101 = this._timelineCursorHost(enabled36),
      value372 = Math.max(240, readLayoutWidthPx(enabled36, this._timelineTrackContentWidth()));
    el101?.style?.setProperty?.('--media-clip-track-content-width', value372 + 'px');
    const el102 = el101?.querySelector?.('.media-clip-timeline-cursors');
    if (el102?.style) el102.style.width = value372 + 'px';
  }
  ['_updateTimelineSegmentLabel'](el103, value373 = 0) {
    const el104 = el103?.querySelector?.('.media-clip-material-label');
    if (!el104) return;
    el104.textContent = formatDurationLabel(value373);
  }
  ['_syncAudioSegmentWaveformViewport'](el105, value374 = {}) {
    const el106 = el105?.querySelector?.('.media-clip-wave-svg');
    if (!el106) return;
    const el107 = el105?.querySelector?.('.media-clip-wave-source') || el106,
      mediaClipWaveformViewport = getMediaClipWaveformViewport(value374),
      formatWaveformPct2 = formatWaveformPct(mediaClipWaveformViewport.widthPct) + '%',
      value375 =
        mediaClipWaveformViewport.marginLeftPct > 0
          ? '-' + formatWaveformPct(mediaClipWaveformViewport.marginLeftPct) + '%'
          : '0';
    (el106.setAttribute('viewBox', getMediaClipWaveformViewBox()),
      el106.setAttribute('width', '100%'),
      el107?.style &&
        ((el107.style.width = formatWaveformPct2),
        (el107.style.marginLeft = value375),
        (el107.style.transform = 'none'),
        (el107.style.transformOrigin = '')),
      el106.style &&
        ((el106.style.width = '100%'),
        (el106.style.marginLeft = '0'),
        (el106.style.transform = 'none'),
        (el106.style.transformOrigin = '')));
  }
  ['_applyVideoTimelinePreview'](el108, value376 = [], durationSec6 = 0) {
    const list34 = Array.isArray(value376) ? value376 : [];
    if (!el108 || !list34.length) return 0;
    let value377 = 0;
    return (
      el108.querySelectorAll?.('.media-clip-segment')?.forEach((item35) => {
        const value378 = this._segmentClipIndex(item35, 'video', list34),
          enabled37 = list34[value378];
        if (!enabled37) return;
        const startSec6 = toNumber(enabled37.timelineStartSec, 0),
          endSec4 = Math.max(startSec6, toNumber(enabled37.timelineEndSec, startSec6)),
          value379 = Math.max(0, endSec4 - startSec6);
        (this._applyTimelineSegmentRect(
          item35,
          this._timelinePreviewRangeRect({ startSec: startSec6, endSec: endSec4, durationSec: durationSec6 }),
        ),
          this._updateTimelineSegmentLabel(item35, value379),
          (value377 += 1));
      }),
      value377
    );
  }
  ['_applyAudioTimelinePreview'](el109, value380 = [], durationSec7 = 0) {
    const list35 = Array.isArray(value380) ? value380 : [];
    if (!el109 || !list35.length) return 0;
    const value381 = this._audioLaneCount(list35);
    (this._setAudioLaneCountStyle(el109, value381),
      this._setAudioLaneCountStyle(el109.parentElement, value381),
      this._setAudioLaneCountStyle(el109.closest?.('.media-clip-timeline-lane'), value381),
      this._setAudioLaneCountStyle(el109.closest?.('.media-clip-compact-timeline'), value381));
    let value382 = 0;
    return (
      el109.querySelectorAll?.('.media-clip-segment')?.forEach((el110) => {
        const value383 = this._segmentClipIndex(el110, 'audio', list35),
          el111 = list35[value383];
        if (!el111) return;
        const startSec7 = toNumber(el111.timelineStartSec, 0),
          endSec5 = Math.max(startSec7, toNumber(el111.timelineEndSec, startSec7)),
          value384 = Math.max(0, endSec5 - startSec7);
        (this._applyAudioTimelineSegmentRect(
          el110,
          this._timelinePreviewRangeRect({ startSec: startSec7, endSec: endSec5, durationSec: durationSec7 }),
        ),
          this._updateTimelineSegmentLabel(el110, value384),
          this._setAudioSegmentLaneVisual(el110, this._audioClipLaneIndex(el111)),
          (el110.dataset.mutedClip = el111.muted === true ? 'true' : 'false'),
          (el110.dataset.disabledClip = el111.disabled === true ? 'true' : 'false'),
          el110.classList?.toggle?.('is-muted', el111.muted === true),
          el110.classList?.toggle?.('is-disabled', el111.disabled === true),
          this._syncAudioSegmentWaveformViewport(el110, el111),
          (value382 += 1));
      }),
      value382
    );
  }
  ['_setTimelinePlayheadFromPointer'](enabled38, activeTrack3, value385, value386 = 0, value387 = {}) {
    if (!enabled38 || !this._mediaClip.tracks?.[activeTrack3]) return false;
    const playheadSec2 = this._timelineSecFromPointerEvent(enabled38, value385, value386);
    this._playheadSec = playheadSec2;
    const value388 = this._mediaClip.activeTrack !== activeTrack3;
    if (activeTrack3 === 'video') {
      if (value387.updateClipSelection !== false) {
        const value389 =
          value387.clipIndex == null
            ? this._clipIndexAtTimelineSec(playheadSec2)
            : Math.max(0, Math.trunc(toNumber(value387.clipIndex, 0)));
        this._setActiveClipIndex(value389);
        if (value387.selectClip !== false) this._selectClipIndex(value389);
      }
      value387.syncPreview !== false && this._syncVideoPreviewSourceForTimelineSec(playheadSec2);
    } else {
      if (activeTrack3 === 'audio') {
        const value390 =
          value387.clipIndex == null
            ? this._audioClipIndexAtTimelineSec(playheadSec2)
            : Math.max(0, Math.trunc(toNumber(value387.clipIndex, 0)));
        this._setActiveAudioClipIndex(value390);
        if (value387.selectClip !== false) this._selectAudioClipIndex(value390);
        value387.syncPreview !== false && this._syncAudioPreviewSourceForTimelineSec(playheadSec2);
      }
    }
    return (
      value388 &&
        value387.updateActiveTrack !== false &&
        ((this._mediaClip = { ...this._mediaClip, activeTrack: activeTrack3 }),
        (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
        value387.persistActiveTrack !== false &&
          appStore.updateNodeData(this.id, { mediaClip: this._mediaClip })),
      this._updateTrackPlayheadVisual(enabled38, value386, { playheadSec: playheadSec2 }),
      value387.syncPreview !== false &&
        this._syncPreviewTime(activeTrack3, this._previewSourceSecForTimelineSec(activeTrack3, playheadSec2)),
      true
    );
  }
  ['_applyTimelinePlayheadModel'](el112, value391 = {}) {
    if (!el112) return;
    el112.style.left = toNumber(value391.leftPct, 0) + '%';
  }
  async ['_loadAudioWaveformPath'](el113, el114, value392 = {}) {
    if (!el113 || !el114) return;
    const mediaClipWaveformUrl = resolveMediaClipWaveformUrl(value392),
      mediaClipAudioUrl = resolveMediaClipAudioUrl(value392);
    if (!mediaClipWaveformUrl && !mediaClipAudioUrl) return;
    const value393 = [mediaClipWaveformUrl, mediaClipAudioUrl, resolveMediaClipSourceKey(value392)].join('|');
    if (el113.dataset) el113.dataset.waveformKey = value393;
    const value394 = {
      width: MEDIA_CLIP_WAVEFORM_WIDTH,
      height: MEDIA_CLIP_WAVEFORM_HEIGHT,
      samples: MEDIA_CLIP_WAVEFORM_SAMPLES,
    };
    let waveformBarsPathFromPersistedUrl = '';
    mediaClipWaveformUrl &&
      (waveformBarsPathFromPersistedUrl = await getWaveformBarsPathFromPersistedUrl(
        mediaClipWaveformUrl,
        value394,
      ));
    !waveformBarsPathFromPersistedUrl &&
      mediaClipAudioUrl &&
      typeof window !== 'undefined' &&
      (waveformBarsPathFromPersistedUrl = await getWaveformBarsPathFromUrl(mediaClipAudioUrl, value394));
    if (!waveformBarsPathFromPersistedUrl) return;
    if (el113.dataset?.waveformKey && el113.dataset.waveformKey !== value393) return;
    if (this.el?.isConnected === false) return;
    (el114.setAttribute('d', waveformBarsPathFromPersistedUrl), el113.classList?.add('has-waveform'));
  }
  ['_renderTrack'](value395, args12 = {}) {
    const startSec8 = this._mediaClip.tracks?.[value395],
      durationSec8 =
        value395 === 'video'
          ? getMediaClipTimelineDisplayDuration(args12.durationSec ?? this._videoTimelineDuration(startSec8))
          : getMediaClipTimelineDisplayDuration(
              args12.durationSec ?? this._timelineDurationForKind(value395),
            ),
      value396 = this._mediaClip.activeTrack === value395,
      value397 = value395 === 'audio' ? this._audioTimelineClips(startSec8) : [],
      value398 = value395 === 'audio' ? this._audioLaneCount(value397) : 1,
      el115 = document.createElement('div');
    ((el115.className = 'media-clip-track media-clip-track-' + value395),
      el115.classList.toggle('is-active', value396),
      el115.classList.toggle('is-compact', args12.compact === true));
    if (value395 === 'audio') {
      ((el115.dataset.audioLaneCount = String(value398)), this._setAudioLaneCountStyle(el115, value398));
      for (let value399 = 0; value399 < value398; value399 += 1) {
        const el116 = document.createElement('div');
        ((el116.className = 'media-clip-audio-lane-guide'),
          (el116.dataset.audioLaneIndex = String(value399)),
          el116.style.setProperty('--media-clip-audio-lane-index', String(value399)),
          el116.style.setProperty(
            '--media-clip-audio-lane-top',
            value399 * (MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + MEDIA_CLIP_AUDIO_LANE_GAP_PX) + 'px',
          ),
          el115.appendChild(el116));
      }
    }
    this._setTimelineRowDuration(el115, durationSec8);
    const toNumber53 = toNumber(args12.timelineWidthPx, 0);
    if (toNumber53 > 0) el115.style.width = Math.max(240, toNumber53) + 'px';
    el115.addEventListener('click', (event13) => {
      event13.stopPropagation();
      if (this._suppressTrackClick) {
        this._suppressTrackClick = false;
        return;
      }
      if (this._isTimelineControlTarget(event13.target)) return;
      if (args12.compact === true) {
        this._setMediaClipWithLayout({ ...this._mediaClip, expanded: true }, true);
        return;
      }
      if (!this._timelineEventSegment(event13.target)) return;
      const value400 = this._timelineRowDuration(el115, durationSec8),
        value401 = this._timelineSecFromPointerEvent(el115, event13, value400),
        forceRender2 =
          value395 === 'video'
            ? this._setActiveClipIndex(this._clipIndexAtTimelineSec(value401))
            : value395 === 'audio'
              ? this._setActiveAudioClipIndex(this._audioClipIndexAtTimelineSec(value401))
              : false;
      if (value395 === 'audio') this._selectAudioClipIndex(this._activeAudioClipIndex);
      this._setActiveTrack(value395, value401, { forceRender: forceRender2 });
    });
    const run4 = (el117, value402) => {
        const el118 = document.createElement('div');
        el118.className = 'media-clip-filmstrip';
        const list36 = collectMediaClipFrameUrls(value402),
          mediaClipFrameCount = getMediaClipFrameCount(this._estimateTimelineWidth(args12), args12);
        if (list36.length > 0)
          for (let value403 = 0; value403 < mediaClipFrameCount; value403 += 1) {
            const el119 = document.createElement('img');
            ((el119.className = 'media-clip-filmstrip-frame'),
              (el119.src = list36[value403 % list36.length]),
              (el119.alt = ''),
              (el119.draggable = false),
              el119.addEventListener('error', () => fillFilmstripPlaceholder(el118, mediaClipFrameCount), {
                once: true,
              }),
              el118.appendChild(el119));
          }
        else fillFilmstripPlaceholder(el118, mediaClipFrameCount);
        el117.appendChild(el118);
      },
      handler4 = (el120, value404 = {}, value405 = null) => {
        const el121 = document.createElement('div');
        el121.className = 'media-clip-wave';
        const el122 = document.createElement('div');
        el122.className = 'media-clip-wave-source';
        const el123 = createMediaClipSvgElement('svg');
        (setMediaClipSvgClass(el123, 'media-clip-wave-svg'),
          el123.setAttribute('width', '100%'),
          el123.setAttribute('height', '100%'),
          el123.setAttribute('viewBox', getMediaClipWaveformViewBox()),
          el123.setAttribute('preserveAspectRatio', 'none'));
        const el124 = createMediaClipSvgElement('path');
        (setMediaClipSvgClass(el124, 'media-clip-wave-path'),
          el124.setAttribute('d', ''),
          el123.appendChild(el124),
          el122.appendChild(el123),
          el121.appendChild(el122),
          el120.appendChild(el121),
          this._syncAudioSegmentWaveformViewport(el120, value404),
          void this._loadAudioWaveformPath(el121, el124, value405));
      },
      handler5 = (el125, value406 = {}) => {
        const el126 = document.createElement('div');
        ((el126.className = 'media-clip-material-selection v2-video-clipselection'),
          (el126.style.left = '0%'),
          (el126.style.width = '100%'));
        const el127 = document.createElement('div');
        el127.className = 'media-clip-material-label v2-video-cliplabel';
        const toNumber54 = toNumber(value406.startSec ?? value406.timelineStartSec, 0),
          toNumber55 = toNumber(value406.endSec ?? value406.timelineEndSec, toNumber54);
        ((el127.textContent = formatDurationLabel(Math.max(0, toNumber55 - toNumber54))),
          el126.append(el127),
          el125.appendChild(el126));
      },
      handler6 = ({
        rect: rect = {},
        source: source = null,
        clipIndex: clipIndex = 0,
        item: item = null,
      }) => {
        const el128 = document.createElement('div');
        el128.className = 'media-clip-segment media-clip-material-strip';
        value395 === 'audio'
          ? this._applyAudioTimelineSegmentRect(el128, rect)
          : this._applyTimelineSegmentRect(el128, rect);
        el128.dataset.clipIndex = String(clipIndex);
        const text17 = normalizeText(item?.id);
        if (text17) el128.dataset.clipId = text17;
        if (value395 === 'video') {
          const value407 = this._visualClipKind(item, source);
          (el128.classList.add('media-clip-segment-' + value407),
            (el128.dataset.mediaKind = value407),
            clipIndex === this._clampVideoClipIndex() && (el128.dataset.activeClip = 'true'),
            clipIndex === this._selectedClipIndex && (el128.dataset.selectedClip = 'true'),
            run4(el128, source));
        } else
          (el128.classList.add('media-clip-segment-audio'),
            (el128.dataset.mediaKind = 'audio'),
            this._setAudioSegmentLaneVisual(el128, this._audioClipLaneIndex(item)),
            (el128.dataset.mutedClip = item?.muted === true ? 'true' : 'false'),
            (el128.dataset.disabledClip = item?.disabled === true ? 'true' : 'false'),
            el128.classList.toggle('is-muted', item?.muted === true),
            el128.classList.toggle('is-disabled', item?.disabled === true),
            clipIndex === this._clampAudioClipIndex() && (el128.dataset.activeClip = 'true'),
            clipIndex === this._selectedAudioClipIndex && (el128.dataset.selectedClip = 'true'),
            handler4(el128, item, source));
        handler5(el128, item || {});
        if (args12.compact !== true) {
          el128.addEventListener('contextmenu', (value408) => {
            const value409 = this._segmentClipIndex(el128, value395);
            if (value395 === 'video')
              (this._setActiveClipIndex(value409),
                this._selectClipIndex(value409),
                this._syncTrackActiveClipChrome(el115, value395));
            else
              value395 === 'audio' &&
                (this._setActiveAudioClipIndex(value409),
                this._selectAudioClipIndex(value409),
                this._syncTrackActiveClipChrome(el115, value395));
            this._openMaterialMenu(value395, value409, value408);
          });
          const value410 = (value411) => {
            if (this._timelineDrag()) return;
            const value412 = this._segmentClipIndex(el128, value395);
            this._setTimelineHoverSegment(el115, el128, value395, value412);
            const value413 = this._timelineRowDuration(el115, durationSec8),
              value414 = this._timelineSecFromPointerEvent(el115, value411, value413);
            this._previewTrackPlayhead(el115, value395, value414, value413);
          };
          (el128.addEventListener('pointerenter', value410),
            el128.addEventListener('pointermove', value410),
            el128.addEventListener('pointerleave', () => {
              if (!this._timelineDrag()) this._clearTimelineHoverState(el115);
              this._restoreTrackPlayhead(el115, value395);
            }),
            el128.addEventListener('pointerdown', (value415) => {
              const clipIndex5 = this._segmentClipIndex(el128, value395);
              if (value395 === 'video')
                (this._setActiveClipIndex(clipIndex5),
                  this._selectClipIndex(clipIndex5),
                  this._syncTrackActiveClipChrome(el115, value395));
              else
                value395 === 'audio' &&
                  (this._setActiveAudioClipIndex(clipIndex5),
                  this._selectAudioClipIndex(clipIndex5),
                  this._syncTrackActiveClipChrome(el115, value395));
              this._startSegmentDrag(value395, value415, { ...args12, clipIndex: clipIndex5 });
            }));
        }
        return (el115.appendChild(el128), el128);
      };
    if (value395 === 'video') {
      const item36 = this._videoTimelineClips(startSec8);
      item36.length
        ? item36.forEach((item37, clipIndex6) => {
            const startSec9 = toNumber(item37.timelineStartSec, 0),
              endSec6 = Math.max(startSec9, toNumber(item37.timelineEndSec, startSec9));
            handler6({
              rect: getMediaClipTimelineRangeRect({
                startSec: startSec9,
                endSec: endSec6,
                durationSec: durationSec8,
              }),
              source: this._videoClipSource(item37, clipIndex6),
              clipIndex: clipIndex6,
              item: item37,
            });
          })
        : handler6({
            rect: getMediaClipTimelineRangeRect({
              startSec: startSec8.startSec,
              endSec: startSec8.endSec,
              durationSec: durationSec8,
            }),
            source: this._videoClipSource(item36[0] || startSec8, 0),
            clipIndex: 0,
            item: item36[0] || startSec8,
          });
    } else {
      const list37 = value397;
      list37.length &&
        list37.forEach((item38, clipIndex7) => {
          const startSec10 = toNumber(item38.timelineStartSec, 0),
            endSec7 = Math.max(startSec10, toNumber(item38.timelineEndSec, startSec10));
          handler6({
            rect: getMediaClipTimelineRangeRect({
              startSec: startSec10,
              endSec: endSec7,
              durationSec: durationSec8,
            }),
            source: this._audioClipSource(item38, clipIndex7),
            clipIndex: clipIndex7,
            item: item38,
          });
        });
    }
    return (!args12.compact && value396 && this._syncTrackActiveClipChrome(el115, value395), el115);
  }
  ['_timelineSecFromPointerEvent'](el129, event14, durationSec9 = 0) {
    const box15 = el129?.getBoundingClientRect?.(),
      trackWidthPx7 = Math.max(1, toNumber(box15?.width, readLayoutWidthPx(el129, 1))),
      trackLeftPx = toNumber(box15?.left, 0);
    return getMediaClipTimelineSecFromClientX(event14?.clientX, {
      durationSec: durationSec9,
      trackLeftPx: trackLeftPx,
      trackWidthPx: trackWidthPx7,
    });
  }
  ['_previewTrackPlayhead'](enabled39, value416, playheadSec3 = 0, value417 = 0) {
    if (!enabled39 || this._playing || this._playPreviewPending) return;
    this._updateTimelineHoverPlayheadVisual(enabled39, value417, { playheadSec: playheadSec3 });
    if (value416 === 'video') this._syncVideoPreviewSourceForTimelineSec(playheadSec3);
    else {
      if (value416 === 'audio') this._syncAudioPreviewSourceForTimelineSec(playheadSec3);
    }
    this._syncPreviewTime(value416, this._previewSourceSecForTimelineSec(value416, playheadSec3));
  }
  ['_syncTimelineHoverPlayheadFromPointer'](enabled40, enabled41, value418 = 0) {
    if (!enabled40 || !enabled41 || this._playing || this._playPreviewPending) return;
    const playheadSec4 = this._timelineSecFromPointerEvent(enabled40, enabled41, value418);
    this._updateTimelineHoverPlayheadVisual(enabled40, value418, { playheadSec: playheadSec4 });
  }
  ['_restoreTrackPlayhead'](enabled42, value419) {
    if (!enabled42 || this._playing || this._playPreviewPending) return;
    (this._hideTimelineHoverPlayhead(enabled42), this._updatePlaybackVisuals(value419));
  }
  ['_restoreTimelinePlayheads']() {
    if (this._playing || this._playPreviewPending) return;
    (this._hideTimelineHoverPlayhead(),
      this._updatePlaybackVisuals('video'),
      this._updatePlaybackVisuals('audio'));
  }
  ['_syncTrackActiveClipChrome'](el130, value420) {
    if (!el130 || el130.classList?.contains('is-compact')) return;
    const enabled43 = this._mediaClip.activeTrack === value420,
      value421 = value420 === 'video' ? this._clampVideoClipIndex() : this._clampAudioClipIndex(),
      value422 = value420 === 'video' ? this._clampSelectedClipIndex() : this._clampSelectedAudioClipIndex(),
      value423 = value420 === 'audio' ? this._mediaClip.audioClips || [] : this._mediaClip.clips || [];
    el130.querySelectorAll('.media-clip-segment').forEach((el131) => {
      const clipIndex8 = this._segmentClipIndex(el131, value420, value423);
      if (value420 === 'video') {
        const text18 = normalizeText(value423[clipIndex8]?.id);
        el131.dataset.clipIndex = String(clipIndex8);
        if (text18) el131.dataset.clipId = text18;
      } else {
        if (value420 === 'audio') {
          const text19 = normalizeText(value423[clipIndex8]?.id);
          el131.dataset.clipIndex = String(clipIndex8);
          if (text19) el131.dataset.clipId = text19;
        }
      }
      const value424 = enabled43 && clipIndex8 === value421,
        value425 = enabled43 && clipIndex8 === value422;
      value424 ? (el131.dataset.activeClip = 'true') : delete el131.dataset.activeClip;
      value425 ? (el131.dataset.selectedClip = 'true') : delete el131.dataset.selectedClip;
      el131.querySelectorAll('.media-clip-trim').forEach((el132) => {
        (!enabled43 || Math.trunc(toNumber(el132.dataset.clipIndex, -1)) !== clipIndex8) && el132.remove();
      });
      if (!enabled43) return;
      el131
        .querySelectorAll('.media-clip-material-selection .media-clip-trim')
        .forEach((el133) => el133.remove());
      const el134 = el131,
        handler7 = (value426) =>
          Array.from(el134.children).some((el135) =>
            el135.classList?.contains('media-clip-trim-' + value426),
          );
      (!handler7('left') &&
        el134.appendChild(this._renderTrimHandle(value420, 'left', { clipIndex: clipIndex8 })),
        !handler7('right') &&
          el134.appendChild(this._renderTrimHandle(value420, 'right', { clipIndex: clipIndex8 })));
    });
  }
  ['_renderTrimHandle'](kind5, side, value427 = {}) {
    const el136 = document.createElement('button');
    ((el136.type = 'button'),
      (el136.className = 'media-clip-trim media-clip-trim-' + side),
      (el136.dataset.clipIndex = String(Math.max(0, Math.trunc(toNumber(value427.clipIndex, 0))))),
      el136.setAttribute('aria-label', mediaClipText(side === 'left' ? 'trim.left' : 'trim.right')));
    const el137 = document.createElement('span');
    return (
      (el137.className = 'media-clip-trim-visual'),
      el137.setAttribute('aria-hidden', 'true'),
      el136.appendChild(el137),
      el136.addEventListener('pointerenter', () => {
        const el138 = el136.closest('.media-clip-segment'),
          value428 = el138?.closest('.media-clip-track') || null;
        (el138?.querySelectorAll?.('.media-clip-trim.is-hovered')?.forEach((el139) => {
          if (el139 !== el136) el139.classList.remove('is-hovered');
        }),
          el136.classList.add('is-hovered'));
        if (el138) this._setTimelineHoverSegment(value428, el138, kind5, value427.clipIndex);
      }),
      el136.addEventListener('pointerleave', () => {
        if (!this._timelineDrag()) el136.classList.remove('is-hovered');
      }),
      el136.addEventListener('pointerdown', (startX) => {
        (stopPointer(startX),
          this._cancelTimelineSettle(),
          this._stopTimelineDragAutoScroll(),
          (this._deferredTimelineDragNodeData = null),
          el136.classList.add('is-hovered'));
        try {
          el136.setPointerCapture?.(startX.pointerId);
        } catch {}
        const value429 = this._mediaClip.tracks?.[kind5],
          clipIndex9 = Math.max(0, Math.trunc(toNumber(value427.clipIndex, 0)));
        if (kind5 === 'video') (this._setActiveClipIndex(clipIndex9), this._selectClipIndex(clipIndex9));
        else
          kind5 === 'audio' &&
            (this._setActiveAudioClipIndex(clipIndex9), this._selectAudioClipIndex(clipIndex9));
        const segmentEl = el136.closest('.media-clip-segment'),
          rowEl = segmentEl?.closest('.media-clip-track') || null,
          laneEl = segmentEl?.closest('.media-clip-timeline-lane') || null,
          scrollEl = segmentEl?.closest('.media-clip-timeline-scroll') || null,
          startClips =
            kind5 === 'audio'
              ? this._audioTimelineClips(value429).map((args13) => ({ ...args13 }))
              : this._videoTimelineClips(value429).map((args14) => ({ ...args14 })),
          durationSec10 = this._resolveTimelineDragDuration(
            kind5,
            value429,
            startClips,
            segmentEl,
            clipIndex9,
          );
        if (segmentEl) this._setTimelineHoverSegment(rowEl, segmentEl, kind5, clipIndex9);
        (segmentEl?.classList.add('is-trimming'),
          rowEl?.classList.add('is-trimming'),
          laneEl?.classList.add('is-trimming'),
          scrollEl?.classList.add('is-trimming'));
        const sessionId = this._nextTimelineDragSessionId();
        this._setTimelineDrag({
          sessionId: sessionId,
          kind: kind5,
          mode: 'trim',
          side: side,
          clipIndex: clipIndex9,
          startX: startX.clientX,
          startTrack: { ...(value429 || {}) },
          startClips: startClips,
          startMediaClip: this._mediaClip,
          durationSec: durationSec10,
          startScrollLeft: toNumber(scrollEl?.scrollLeft, 0),
          latestClientX: startX.clientX,
          segmentEl: segmentEl,
          rowEl: rowEl,
          laneEl: laneEl,
          scrollEl: scrollEl,
          pendingRange: null,
          pendingPlayheadSec: this._playheadSec,
          startPlayheadSec: this._playheadSec,
          hasMoved: false,
        });
        const value430 = (value431) => this._handleTrimDrag(value431, sessionId),
          value432 = (value433) => {
            stopPointer(value433);
            if (!this._isTimelineDragSession(sessionId)) return;
            const durationSec11 = this._timelineDrag();
            this._persistTimelineDragScroll(durationSec11);
            if (durationSec11?.kind === 'video' && durationSec11.pendingRange) {
              const value434 = this._isVideoLeftTrimDrag(durationSec11);
              this._commitVideoTrimDrag(durationSec11, { persist: false });
              const value435 = this._videoTimelineDuration(this._mediaClip.tracks?.video),
                durationSec12 = getMediaClipTimelineDisplayDuration(
                  toNumber(durationSec11.durationSec, toNumber(durationSec11.previewDurationSec, value435)),
                ),
                value436 = durationSec11;
              this._detachDragListeners();
              if (value434) {
                const args15 = {
                  durationSec: durationSec12,
                  persist: true,
                  commitHistory: true,
                  syncTimelineWidthAfterSettle: false,
                };
                this._animateTrackVisualsToCurrentState(durationSec11.rowEl, 'video', { ...args15 });
              } else
                (this._updateTrackVisuals('video', {
                  durationSec: durationSec11.previewDurationSec,
                  syncTimelineWidth: false,
                }),
                  this._persistTimelineMediaClip({ commitHistory: true }));
              this._applyDeferredTimelineDragUpdate(value436);
              return;
            }
            if (durationSec11?.kind === 'audio' && durationSec11.pendingRange) {
              this._commitAudioTrimDrag(durationSec11, { persist: false });
              const value437 = durationSec11;
              (this._detachDragListeners(),
                this._updateTrackVisuals('audio', {
                  durationSec: durationSec11.previewDurationSec,
                  syncTimelineWidth: false,
                }),
                this._persistTimelineMediaClip({ commitHistory: true }),
                this._applyDeferredTimelineDragUpdate(value437));
              return;
            }
            (appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }),
              (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }));
            const value438 = durationSec11;
            (this._detachDragListeners(),
              this._render(),
              commit(),
              this._applyDeferredTimelineDragUpdate(value438));
          };
        ((this._dragMove = value430),
          (this._dragUp = value432),
          window.addEventListener('pointermove', value430, true),
          window.addEventListener('pointerup', value432, { once: true, capture: true }));
      }),
      el136
    );
  }
  ['_detachDragListeners']() {
    if (this._dragMove) window.removeEventListener('pointermove', this._dragMove, true);
    if (this._dragUp) window.removeEventListener('pointerup', this._dragUp, true);
    this._stopTimelineDragAutoScroll();
    const value439 = this._timelineDrag();
    (value439?.segmentEl?.classList.remove('is-dragging'),
      value439?.segmentEl?.classList.remove('is-trimming'),
      value439?.segmentEl?.classList.remove('is-lane-preview'),
      value439?.segmentEl?.querySelectorAll?.('.media-clip-trim.is-hovered')?.forEach((el140) => {
        el140.classList.remove('is-hovered');
      }),
      value439?.rowEl?.classList.remove('is-trimming'),
      value439?.rowEl?.classList.remove('is-preview-dragging'),
      value439?.laneEl?.classList.remove('is-trimming'),
      value439?.laneEl?.classList.remove('is-moving'),
      value439?.timelineEl?.classList.remove('is-moving-material'),
      value439?.scrollEl?.classList.remove('is-trimming'),
      (this._dragMove = null),
      (this._dragUp = null),
      this._setTimelineDrag(null));
  }
  ['_startSegmentDrag'](kind6, startX2, value440 = {}) {
    if (value440.compact === true || startX2.button !== 0) return;
    (stopPointer(startX2),
      this._cancelTimelineSettle(),
      this._stopTimelineDragAutoScroll(),
      (this._deferredTimelineDragNodeData = null));
    const args16 = this._mediaClip.tracks?.[kind6];
    if (!args16) return;
    const rowEl2 = startX2.currentTarget?.closest('.media-clip-track') || null,
      scrollEl2 = rowEl2?.closest?.('.media-clip-timeline-scroll') || null,
      laneEl2 = rowEl2?.closest?.('.media-clip-timeline-lane') || null,
      timelineEl = rowEl2?.closest?.('.media-clip-compact-timeline') || null,
      startClips2 =
        kind6 === 'audio'
          ? this._audioTimelineClips(args16).map((args17) => ({ ...args17 }))
          : this._videoTimelineClips(args16).map((args18) => ({ ...args18 })),
      clipIndex10 = Math.max(0, Math.trunc(toNumber(value440.clipIndex, 0))),
      durationSec13 = this._resolveTimelineDragDuration(
        kind6,
        args16,
        startClips2,
        startX2.currentTarget,
        clipIndex10,
      );
    if (kind6 === 'video')
      (this._setActiveClipIndex(clipIndex10),
        this._selectClipIndex(clipIndex10),
        this._syncTrackActiveClipChrome(startX2.currentTarget?.closest('.media-clip-track'), kind6));
    else
      kind6 === 'audio' &&
        (this._setActiveAudioClipIndex(clipIndex10),
        this._selectAudioClipIndex(clipIndex10),
        this._syncTrackActiveClipChrome(startX2.currentTarget?.closest('.media-clip-track'), kind6));
    try {
      startX2.currentTarget?.setPointerCapture?.(startX2.pointerId);
    } catch {}
    (startX2.currentTarget?.classList.add('is-dragging'), rowEl2?.classList.add('is-preview-dragging'));
    const sessionId2 = this._nextTimelineDragSessionId();
    this._setTimelineDrag({
      sessionId: sessionId2,
      kind: kind6,
      mode: 'move',
      clipIndex: clipIndex10,
      startX: startX2.clientX,
      startY: startX2.clientY,
      startLaneIndex: kind6 === 'audio' ? this._audioClipLaneIndex(startClips2[clipIndex10]) : 0,
      startPlayheadSec: this._playheadSec,
      startTrack: { ...args16 },
      startClips: startClips2,
      startMediaClip: this._mediaClip,
      durationSec: durationSec13,
      startScrollLeft: toNumber(scrollEl2?.scrollLeft, 0),
      latestClientX: startX2.clientX,
      latestClientY: startX2.clientY,
      segmentEl: startX2.currentTarget,
      rowEl: rowEl2,
      laneEl: laneEl2,
      timelineEl: timelineEl,
      scrollEl: scrollEl2,
      pendingDeltaSec: 0,
      pendingLaneIndex: kind6 === 'audio' ? this._audioClipLaneIndex(startClips2[clipIndex10]) : 0,
      hasMoved: false,
    });
    const value441 = (value442) => this._handleTrimDrag(value442, sessionId2),
      value443 = (value444) => {
        stopPointer(value444);
        if (!this._isTimelineDragSession(sessionId2)) return;
        const durationSec14 = this._timelineDrag();
        this._persistTimelineDragScroll(durationSec14);
        if (
          durationSec14?.hasMoved &&
          durationSec14.kind === 'video' &&
          durationSec14.startClips?.[durationSec14.clipIndex]
        ) {
          this._commitVideoSegmentDrag(durationSec14, { persist: false });
          const value445 = durationSec14;
          (this._detachDragListeners(),
            this._animateTrackVisualsToCurrentState(durationSec14.rowEl, 'video', {
              durationSec: durationSec14.previewDurationSec,
              persist: true,
              commitHistory: true,
              syncTimelineWidthAfterSettle: false,
            }),
            this._applyDeferredTimelineDragUpdate(value445));
          return;
        }
        if (
          durationSec14?.hasMoved &&
          durationSec14.kind === 'audio' &&
          durationSec14.startClips?.[durationSec14.clipIndex]
        ) {
          this._commitAudioSegmentDrag(durationSec14, { persist: false });
          const value446 = durationSec14;
          (this._detachDragListeners(),
            this._animateTrackVisualsToCurrentState(durationSec14.rowEl, 'audio', {
              durationSec: durationSec14.previewDurationSec,
              persist: true,
              commitHistory: true,
              syncTimelineWidthAfterSettle: false,
            }),
            this._applyDeferredTimelineDragUpdate(value446));
          return;
        } else
          durationSec14?.hasMoved &&
            (appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }),
            (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
            commit());
        !durationSec14?.hasMoved &&
          ((this._suppressTrackClick = true),
          this._setTimelinePlayheadFromPointer(
            durationSec14?.rowEl,
            durationSec14?.kind,
            value444,
            durationSec14?.durationSec,
            { clipIndex: durationSec14?.clipIndex },
          ));
        const value447 = durationSec14;
        this._detachDragListeners();
        if (durationSec14?.hasMoved) this._render();
        this._applyDeferredTimelineDragUpdate(value447);
      };
    ((this._dragMove = value441),
      (this._dragUp = value443),
      window.addEventListener('pointermove', value441, true),
      window.addEventListener('pointerup', value443, { once: true, capture: true }));
  }
  ['_handleTrimDrag'](event15, value448 = null) {
    const enabled44 = this._timelineDrag();
    if (!enabled44) return;
    if (value448 != null && enabled44.sessionId !== value448) return;
    (stopPointer(event15),
      (enabled44.latestClientX = toNumber(event15?.clientX, enabled44.latestClientX ?? enabled44.startX)),
      (enabled44.latestClientY = toNumber(event15?.clientY, enabled44.latestClientY ?? enabled44.startY)),
      this._applyTimelineDragPreviewFromPointer(enabled44, event15),
      this._scheduleTimelineDragAutoScroll(enabled44));
  }
  ['_applyTimelineDragPreviewFromPointer'](startSec11 = this._timelineDrag(), value449 = {}) {
    if (!startSec11) return;
    const el141 = this._timelineRowForDrag(startSec11),
      durationSec15 =
        startSec11.durationSec ??
        this._resolveTimelineDragDuration(
          startSec11.kind,
          startSec11.startTrack,
          startSec11.startClips,
          startSec11.segmentEl,
          startSec11.clipIndex,
        );
    if (startSec11.mode === 'move') {
      (this._syncTimelineHoverPlayheadFromPointer(el141, value449, durationSec15),
        this._handleSegmentDrag(value449));
      return;
    }
    startSec11.mode === 'trim' && this._hideTimelineHoverPlayhead(el141);
    const box16 = el141?.getBoundingClientRect(),
      trackWidthPx8 = Math.max(1, toNumber(box16?.width, readLayoutWidthPx(el141, 1))),
      mediaClipTimelineDeltaSecFromPx = getMediaClipTimelineDeltaSecFromPx(
        this._timelineDragDeltaPx(startSec11, value449),
        {
          durationSec: durationSec15,
          trackWidthPx: trackWidthPx8,
        },
      );
    if (startSec11.kind === 'video' && startSec11.startClips?.[startSec11.clipIndex]) {
      this._previewVideoTrimDrag(startSec11, mediaClipTimelineDeltaSecFromPx, durationSec15, el141);
      return;
    } else {
      if (startSec11.kind === 'audio' && startSec11.startClips?.[startSec11.clipIndex]) {
        this._previewAudioTrimDrag(startSec11, mediaClipTimelineDeltaSecFromPx, durationSec15, el141);
        return;
      } else {
        const value450 =
          startSec11.side === 'left'
            ? { startSec: startSec11.startTrack.startSec + mediaClipTimelineDeltaSecFromPx }
            : { endSec: startSec11.startTrack.endSec + mediaClipTimelineDeltaSecFromPx };
        this._mediaClip = patchMediaClipTrackRange(this._mediaClip, startSec11.kind, value450);
        const value451 = this._mediaClip.tracks?.[startSec11.kind];
        value451 && (this._playheadSec = startSec11.side === 'left' ? value451.startSec : value451.endSec);
      }
    }
    (!(startSec11.kind === 'audio' && startSec11.startClips?.[startSec11.clipIndex]) &&
      startSec11.kind !== 'video' &&
      this._updateTrackVisuals(startSec11.kind),
      this._syncPreviewTime(
        startSec11.kind,
        this._previewSourceSecForTimelineSec(startSec11.kind, this._playheadSec),
      ));
  }
  ['_previewVideoTrimDrag'](clips, value452 = 0, value453 = 0, value454 = null) {
    const startSec12 = clips?.startClips?.[clips.clipIndex],
      enabled45 = clips?.segmentEl;
    if (!startSec12 || !enabled45) return;
    const args19 =
        clips.side === 'left'
          ? { startSec: startSec12.startSec + value452 }
          : { endSec: startSec12.endSec + value452 },
      startSec13 = clampMediaClipRange({ ...startSec12, ...args19 }, startSec12.durationSec),
      mediaClipTimelineDisplayDuration7 = getMediaClipTimelineDisplayDuration(value453);
    ((clips.pendingRange = { startSec: startSec13.startSec, endSec: startSec13.endSec }),
      (clips.pendingRollRange = null));
    const value455 = {
      ...this._mediaClip,
      clips: clips.startClips,
      tracks: { ...(this._mediaClip.tracks || {}), video: clips.startTrack },
    };
    this._isRollingVideoLeftTrimDrag(clips) && (clips.pendingRollRange = { ...clips.pendingRange });
    const value456 = this._isRollingVideoLeftTrimDrag(clips)
        ? rollMediaClipVisualLeftTrim(value455, clips.clipIndex, clips.pendingRange)
        : this._isVideoLeftTrimDrag(clips)
          ? this._buildVideoLeftTrimPreviewState(clips, startSec13)
          : patchMediaClipClipRange(value455, clips.clipIndex, clips.pendingRange),
      clips2 = value456.clips || clips.startClips,
      durationSec16 = mediaClipTimelineDisplayDuration7,
      value457 = clips2?.[clips.clipIndex] || startSec12;
    clips.pendingRange = {
      startSec: toNumber(value457.startSec, startSec13.startSec),
      endSec: toNumber(value457.endSec, startSec13.endSec),
    };
    const startSec14 = toNumber(value457.timelineStartSec, 0),
      endSec8 = Math.max(startSec14, toNumber(value457.timelineEndSec, startSec14)),
      value458 = Math.max(0, endSec8 - startSec14);
    !this._applyVideoTimelinePreview(value454 || clips.rowEl, clips2, durationSec16) &&
      (this._applyTimelineSegmentRect(
        enabled45,
        this._timelinePreviewRangeRect({ startSec: startSec14, endSec: endSec8, durationSec: durationSec16 }),
      ),
      this._updateTimelineSegmentLabel(enabled45, value458));
    ((clips.previewDurationSec = durationSec16),
      (clips.pendingPlayheadSec = clips.side === 'left' ? startSec14 : endSec8),
      (clips.hasMoved = true));
    const materialEndSec = this._videoTimelineMaterialEnd(value456.tracks?.video, value456.clips);
    (this._syncTimelineAddSlotForRow(value454 || clips.rowEl, {
      displayDurationSec: durationSec16,
      materialEndSec: materialEndSec,
    }),
      this._updateTrackPlayheadVisual(value454 || clips.rowEl, durationSec16, {
        playheadSec: clips.startPlayheadSec,
      }));
    const toNumber56 = toNumber(clips.startPlayheadSec, this._playheadSec);
    (this._syncVideoPreviewSourceForTimelineSec(toNumber56, { clips: clips2 }),
      this._syncPreviewTime('video', this._videoSourceSecForTimelineSec(toNumber56, clips2)));
  }
  ['_previewAudioTrimDrag'](audioClips, value459 = 0, value460 = 0, value461 = null) {
    const startSec15 = audioClips?.startClips?.[audioClips.clipIndex],
      enabled46 = audioClips?.segmentEl;
    if (!startSec15 || !enabled46) return;
    const args20 =
        audioClips.side === 'left'
          ? { startSec: startSec15.startSec + value459 }
          : { endSec: startSec15.endSec + value459 },
      startSec16 = clampMediaClipRange({ ...startSec15, ...args20 }, startSec15.durationSec);
    audioClips.pendingRange = { startSec: startSec16.startSec, endSec: startSec16.endSec };
    const patchMediaClipAudioClipRange2 = patchMediaClipAudioClipRange(
        {
          ...this._mediaClip,
          audioClips: audioClips.startClips,
          tracks: { ...(this._mediaClip.tracks || {}), audio: audioClips.startTrack },
        },
        audioClips.clipIndex,
        audioClips.pendingRange,
      ),
      enabled47 = patchMediaClipAudioClipRange2.audioClips?.[audioClips.clipIndex];
    if (!enabled47) return;
    const durationSec17 = getMediaClipTimelineDisplayDuration(value460),
      startSec17 = toNumber(enabled47.timelineStartSec, 0),
      endSec9 = Math.max(startSec17, toNumber(enabled47.timelineEndSec, startSec17)),
      value462 = Math.max(0, endSec9 - startSec17);
    (!this._applyAudioTimelinePreview(
      value461 || audioClips.rowEl,
      patchMediaClipAudioClipRange2.audioClips,
      durationSec17,
    ) &&
      (this._applyAudioTimelineSegmentRect(
        enabled46,
        getMediaClipTimelineRangeRect({ startSec: startSec17, endSec: endSec9, durationSec: durationSec17 }),
      ),
      this._updateTimelineSegmentLabel(enabled46, value462),
      this._syncAudioSegmentWaveformViewport(enabled46, enabled47)),
      (audioClips.previewDurationSec = durationSec17),
      (audioClips.pendingPlayheadSec = audioClips.side === 'left' ? startSec17 : endSec9),
      (audioClips.hasMoved = true),
      this._updateTrackPlayheadVisual(value461 || audioClips.rowEl, durationSec17, {
        playheadSec: audioClips.startPlayheadSec,
      }),
      this._syncPreviewTime('audio', audioClips.side === 'left' ? startSec16.startSec : startSec16.endSec));
  }
  ['_isVideoLeftTrimDrag'](enabled48 = null) {
    const value463 = Math.max(0, Math.trunc(toNumber(enabled48?.clipIndex, 0)));
    return enabled48?.kind === 'video' && enabled48?.side === 'left' && !!enabled48?.startClips?.[value463];
  }
  ['_isFirstVideoLeftTrimDrag'](value464 = null) {
    return (
      this._isVideoLeftTrimDrag(value464) && Math.max(0, Math.trunc(toNumber(value464?.clipIndex, 0))) === 0
    );
  }
  ['_isRollingVideoLeftTrimDrag'](value465 = null) {
    return (
      this._isVideoLeftTrimDrag(value465) && Math.max(0, Math.trunc(toNumber(value465?.clipIndex, 0))) > 0
    );
  }
  ['_buildVideoLeftTrimPreviewState'](options18 = {}, startSec18 = {}) {
    const list38 = Array.isArray(options18.startClips) ? options18.startClips : [],
      value466 = Math.max(0, Math.trunc(toNumber(options18?.clipIndex, 0))),
      value467 = list38[value466] || {},
      value468 = Math.max(
        0,
        toNumber(startSec18.endSec, value467.endSec) - toNumber(startSec18.startSec, value467.startSec),
      ),
      value469 = Math.max(
        0,
        toNumber(
          value467.timelineEndSec,
          toNumber(value467.timelineStartSec, 0) +
            Math.max(0, toNumber(value467.endSec, 0) - toNumber(value467.startSec, 0)),
        ),
      ),
      value470 = value469 - value468,
      value471 = value470 + value468,
      clips3 = list38.map((args21, value472) =>
        value472 === value466
          ? {
              ...args21,
              startSec: startSec18.startSec,
              endSec: startSec18.endSec,
              timelineStartSec: Math.round(value470 * 0x3e8) / 0x3e8,
              timelineEndSec: Math.round(value471 * 0x3e8) / 0x3e8,
            }
          : { ...args21 },
      );
    return {
      ...this._mediaClip,
      clips: clips3,
      tracks: {
        ...(this._mediaClip.tracks || {}),
        video: { ...(options18.startTrack || {}), startSec: startSec18.startSec, endSec: startSec18.endSec },
      },
    };
  }
  ['_commitVideoTrimDrag'](clips4, value473 = {}) {
    const value474 = clips4.pendingRollRange || clips4.pendingRange,
      rebaseTimelineStart = this._isRollingVideoLeftTrimDrag(clips4),
      value475 = {
        ...this._mediaClip,
        clips: clips4.startClips,
        tracks: { ...(this._mediaClip.tracks || {}), video: clips4.startTrack },
      };
    this._mediaClip = this._isRollingVideoLeftTrimDrag(clips4)
      ? rollMediaClipVisualLeftTrim(value475, clips4.clipIndex, value474, {
          rebaseNegativeTimeline: true,
          rebaseTimelineStart: rebaseTimelineStart,
        })
      : patchMediaClipClipRange(value475, clips4.clipIndex, clips4.pendingRange);
    const text20 = normalizeText(clips4.startClips?.[clips4.clipIndex]?.id),
      count23 = text20
        ? this._mediaClip.clips?.findIndex((item39) => normalizeText(item39?.id) === text20)
        : clips4.clipIndex;
    count23 >= 0 && (this._setActiveClipIndex(count23), this._selectClipIndex(count23));
    const value476 = this._mediaClip.clips?.[count23 >= 0 ? count23 : clips4.clipIndex];
    if (value476) {
      const value477 = this._videoTimelineDuration(this._mediaClip.tracks?.video),
        materialEndSec2 = this._videoTimelineMaterialEnd(this._mediaClip.tracks?.video),
        displayDurationSec3 = getMediaClipTimelineDisplayDuration(
          toNumber(clips4.durationSec, toNumber(clips4.previewDurationSec, value477)),
        ),
        value478 = Math.max(
          0,
          Math.min(displayDurationSec3, toNumber(clips4.startPlayheadSec, this._playheadSec)),
        );
      ((this._playheadSec = value478),
        this._syncTimelineAddSlotForRow(clips4.rowEl, {
          displayDurationSec: displayDurationSec3,
          materialEndSec: materialEndSec2,
        }),
        this._syncVideoPreviewSourceForTimelineSec(this._playheadSec),
        this._syncPreviewTime('video', this._videoSourceSecForPlayhead(this._playheadSec)));
    }
    ((this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      value473.persist !== false && appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }));
  }
  ['_commitAudioTrimDrag'](audioClips2, value479 = {}) {
    const value480 = {
      ...this._mediaClip,
      audioClips: audioClips2.startClips,
      tracks: { ...(this._mediaClip.tracks || {}), audio: audioClips2.startTrack },
    };
    this._mediaClip = patchMediaClipAudioClipRange(value480, audioClips2.clipIndex, audioClips2.pendingRange);
    const text21 = normalizeText(audioClips2.startClips?.[audioClips2.clipIndex]?.id),
      count24 = text21
        ? this._mediaClip.audioClips?.findIndex((item40) => normalizeText(item40?.id) === text21)
        : audioClips2.clipIndex;
    count24 >= 0 && (this._setActiveAudioClipIndex(count24), this._selectAudioClipIndex(count24));
    const value481 = this._timelineDurationForKind('audio'),
      displayDurationSec4 = getMediaClipTimelineDisplayDuration(
        toNumber(audioClips2.durationSec, toNumber(audioClips2.previewDurationSec, value481)),
      );
    ((this._playheadSec = Math.max(
      0,
      Math.min(displayDurationSec4, toNumber(audioClips2.startPlayheadSec, this._playheadSec)),
    )),
      this._syncTimelineAddSlotForRow(audioClips2.rowEl, {
        displayDurationSec: displayDurationSec4,
        materialEndSec: this._timelineMaterialEndSec(),
      }),
      this._syncAudioPreviewSourceForTimelineSec(this._playheadSec),
      this._syncPreviewTime('audio', this._audioSourceSecForPlayhead(this._playheadSec)),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      value479.persist !== false && appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }));
  }
  ['_handleSegmentDrag'](event16) {
    const enabled49 = this._timelineDrag();
    if (!enabled49) return;
    const el142 = this._timelineRowForDrag(enabled49),
      box17 = el142?.getBoundingClientRect(),
      trackWidthPx9 = Math.max(1, toNumber(box17?.width, readLayoutWidthPx(el142, 1))),
      durationSec18 =
        enabled49.durationSec ??
        this._resolveTimelineDragDuration(
          enabled49.kind,
          enabled49.startTrack,
          enabled49.startClips,
          enabled49.segmentEl,
          enabled49.clipIndex,
        ),
      value482 = this._timelineDragDeltaPx(enabled49, event16),
      value483 =
        enabled49.kind === 'audio' && enabled49.mode === 'move'
          ? toNumber(enabled49.latestClientY, toNumber(event16?.clientY, enabled49.startY)) -
            toNumber(enabled49.startY, 0)
          : 0,
      count25 =
        enabled49.kind === 'audio' && enabled49.mode === 'move'
          ? Math.max(Math.abs(value482), Math.abs(value483))
          : Math.abs(value482);
    if (!enabled49.hasMoved && count25 <= 3) return;
    ((enabled49.hasMoved = true),
      enabled49.laneEl?.classList.add('is-moving'),
      enabled49.timelineEl?.classList.add('is-moving-material'),
      (this._suppressTrackClick = true));
    const mediaClipTimelineDeltaSecFromPx2 = getMediaClipTimelineDeltaSecFromPx(value482, {
      durationSec: durationSec18,
      trackWidthPx: trackWidthPx9,
    });
    if (enabled49.kind === 'video' && enabled49.startClips?.[enabled49.clipIndex])
      this._previewVideoSegmentDrag(enabled49, mediaClipTimelineDeltaSecFromPx2, durationSec18);
    else {
      if (enabled49.kind === 'audio' && enabled49.startClips?.[enabled49.clipIndex])
        this._previewAudioSegmentDrag(enabled49, mediaClipTimelineDeltaSecFromPx2, durationSec18);
      else {
        const value484 = {
          ...this._mediaClip,
          tracks: { ...(this._mediaClip.tracks || {}), [enabled49.kind]: enabled49.startTrack },
        };
        this._mediaClip = shiftMediaClipTrackRange(
          value484,
          enabled49.kind,
          mediaClipTimelineDeltaSecFromPx2,
        );
        const value485 = this._mediaClip.tracks?.[enabled49.kind];
        if (value485) {
          const value486 = value485.startSec - enabled49.startTrack.startSec;
          this._playheadSec = Math.max(
            value485.startSec,
            Math.min(value485.endSec, enabled49.startPlayheadSec + value486),
          );
        }
      }
    }
    (!(enabled49.kind === 'audio' && enabled49.startClips?.[enabled49.clipIndex]) &&
      enabled49.kind !== 'video' &&
      this._updateTrackVisuals(enabled49.kind),
      this._syncPreviewTime(
        enabled49.kind,
        this._previewSourceSecForTimelineSec(enabled49.kind, this._playheadSec),
      ));
  }
  ['_previewVideoSegmentDrag'](value487, value488 = 0, value489 = 0) {
    const enabled50 = value487?.segmentEl,
      enabled51 = value487?.startClips?.[value487.clipIndex];
    if (!enabled50 || !enabled51) return;
    const durationSec19 = getMediaClipTimelineDisplayDuration(value489),
      toNumber57 = toNumber(enabled51.timelineStartSec, 0),
      value490 = Math.max(toNumber57, toNumber(enabled51.timelineEndSec, toNumber57)),
      value491 = Math.max(0.1, value490 - toNumber57),
      startSec19 = Math.max(0, Math.min(Math.max(0, durationSec19 - value491), toNumber57 + value488));
    (this._applyTimelineSegmentRect(
      enabled50,
      getMediaClipTimelineRangeRect({
        startSec: startSec19,
        endSec: startSec19 + value491,
        durationSec: durationSec19,
      }),
    ),
      this._updateTimelineSegmentLabel(enabled50, value491),
      (value487.previewDurationSec = durationSec19),
      (value487.pendingDeltaSec = startSec19 - toNumber57));
  }
  ['_previewAudioSegmentDrag'](value492, value493 = 0, value494 = 0) {
    const el143 = value492?.segmentEl,
      enabled52 = value492?.startClips?.[value492.clipIndex];
    if (!el143 || !enabled52) return;
    const durationSec20 = getMediaClipTimelineDisplayDuration(value494),
      toNumber58 = toNumber(enabled52.timelineStartSec, 0),
      value495 = Math.max(toNumber58, toNumber(enabled52.timelineEndSec, toNumber58)),
      value496 = Math.max(0.1, value495 - toNumber58),
      startSec20 = Math.max(0, toNumber58 + value493),
      previewLaneIndex = this._audioLaneIndexFromDrag(value492),
      value497 = this._audioLaneCount(value492.startClips, { previewLaneIndex: previewLaneIndex });
    (this._setAudioSegmentLaneVisual(el143, previewLaneIndex),
      el143.classList?.toggle?.(
        'is-lane-preview',
        previewLaneIndex !== normalizeMediaClipAudioLaneIndex(value492.startLaneIndex),
      ),
      this._setAudioLaneCountStyle(value492.rowEl, value497),
      this._setAudioLaneCountStyle(value492.rowEl?.parentElement, value497),
      this._setAudioLaneCountStyle(value492.laneEl, value497),
      this._setAudioLaneCountStyle(value492.timelineEl, value497),
      this._setAudioLaneCountStyle(
        value492.laneEl?.querySelector?.('.media-clip-audio-lane-controls'),
        value497,
      ),
      this._applyAudioTimelineSegmentRect(
        el143,
        getMediaClipTimelineRangeRect({
          startSec: startSec20,
          endSec: startSec20 + value496,
          durationSec: durationSec20,
        }),
      ),
      this._updateTimelineSegmentLabel(el143, value496),
      (value492.previewDurationSec = durationSec20),
      (value492.pendingDeltaSec = startSec20 - toNumber58),
      (value492.pendingLaneIndex = previewLaneIndex),
      (value492.pendingPlayheadSec = Math.max(
        startSec20,
        Math.min(startSec20 + value496, value492.startPlayheadSec + value492.pendingDeltaSec),
      )));
  }
  ['_commitVideoSegmentDrag'](clips5, value498 = {}) {
    const value499 = {
      ...this._mediaClip,
      clips: clips5.startClips,
      tracks: { ...(this._mediaClip.tracks || {}), video: clips5.startTrack },
    };
    this._mediaClip = moveMediaClipClipOnTimeline(value499, clips5.clipIndex, clips5.pendingDeltaSec);
    const text22 = normalizeText(clips5.startClips?.[clips5.clipIndex]?.id),
      count26 = text22
        ? this._mediaClip.clips?.findIndex((item41) => normalizeText(item41?.id) === text22)
        : -1;
    count26 >= 0 && (this._setActiveClipIndex(count26), this._selectClipIndex(count26));
    const value500 = this._videoTimelineDuration(this._mediaClip.tracks?.video);
    ((this._playheadSec = Math.max(0, Math.min(value500, clips5.startPlayheadSec))),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      value498.persist !== false && appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }));
  }
  ['_commitAudioSegmentDrag'](audioClips3, value501 = {}) {
    const value502 = {
      ...this._mediaClip,
      audioClips: audioClips3.startClips,
      tracks: { ...(this._mediaClip.tracks || {}), audio: audioClips3.startTrack },
    };
    this._mediaClip = moveMediaClipAudioClipOnTimeline(
      value502,
      audioClips3.clipIndex,
      audioClips3.pendingDeltaSec,
      { laneIndex: audioClips3.pendingLaneIndex },
    );
    const text23 = normalizeText(audioClips3.startClips?.[audioClips3.clipIndex]?.id),
      count27 = text23
        ? this._mediaClip.audioClips?.findIndex((item42) => normalizeText(item42?.id) === text23)
        : audioClips3.clipIndex;
    count27 >= 0 && (this._setActiveAudioClipIndex(count27), this._selectAudioClipIndex(count27));
    const value503 = this._timelineDurationForKind('audio');
    ((this._playheadSec = Math.max(0, Math.min(value503, this._playheadSec))),
      this._syncTimelineAddSlotForRow(audioClips3.rowEl, {
        displayDurationSec: audioClips3.previewDurationSec,
        materialEndSec: this._timelineMaterialEndSec(),
      }),
      this._syncAudioPreviewSourceForTimelineSec(this._playheadSec),
      this._syncPreviewTime('audio', this._audioSourceSecForPlayhead(this._playheadSec)),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      value501.persist !== false && appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }));
  }
  ['_flushTimelineSettlePersist']() {
    if (!this._timelineSettlePendingPersist) return;
    const commitHistory = this._timelineSettlePendingCommit;
    ((this._timelineSettlePendingPersist = false),
      (this._timelineSettlePendingCommit = false),
      this._persistTimelineMediaClip({ commitHistory: commitHistory }));
  }
  ['_persistTimelineMediaClip'](options19 = {}) {
    ((this._skipNextStoreMediaClipRender = true),
      appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }));
    if (options19.commitHistory === true) commit();
  }
  ['_applyDeferredTimelineDragUpdate'](value504 = null) {
    const enabled53 = this._deferredTimelineDragNodeData;
    this._deferredTimelineDragNodeData = null;
    if (!enabled53 || this._timelineDrag()) return;
    const value505 = enabled53.mediaClip;
    if (isSameMediaClipState(value505, this._mediaClip)) return;
    if (value504?.startMediaClip && isSameMediaClipState(value505, value504.startMediaClip)) return;
    this.update(enabled53);
  }
  ['_scheduleTimelineSettleRender'](value506, value507 = {}) {
    if (this._timelineSettleTimer) clearTimeout(this._timelineSettleTimer);
    this._timelineSettleRow = value506 || this._timelineSettleRow;
    const value508 = this._timelineSettleVersion;
    ((this._timelineSettlePendingPersist = this._timelineSettlePendingPersist || value507.persist === true),
      (this._timelineSettlePendingCommit =
        this._timelineSettlePendingCommit || value507.commitHistory === true),
      (this._timelineSettleTimer = setTimeout(() => {
        if (value508 !== this._timelineSettleVersion) return;
        this._timelineSettleTimer = 0;
        const el144 = this._timelineSettleRow || value506;
        (el144?.classList.remove('is-settling'),
          (this._timelineSettleRow = null),
          value507.syncTimelineWidthAfterSettle !== false && this._syncTimelineContentWidth(),
          this._flushTimelineSettlePersist());
      }, TIMELINE_SETTLE_ANIMATION_MS)));
  }
  ['_animateTrackVisualsToCurrentState'](value509, value510 = 'video', args22 = {}) {
    const value511 = this._startTimelineSettle(value509),
      commitHistory2 = { ...args22 };
    commitHistory2.persist === true &&
      (this._persistTimelineMediaClip({ commitHistory: commitHistory2.commitHistory === true }),
      (commitHistory2.persist = false),
      (commitHistory2.commitHistory = false));
    const value512 = () => {
      if (value511 !== this._timelineSettleVersion || this._timelineDrag()) return;
      (this._updateTrackVisuals(value510, {
        durationSec: commitHistory2.durationSec,
        syncTimelineWidth: false,
      }),
        this._scheduleTimelineSettleRender(value509, commitHistory2));
    };
    if (typeof requestAnimationFrame === 'function')
      requestAnimationFrame(() => requestAnimationFrame(value512));
    else setTimeout(value512, 0);
  }
  ['_startTimelineSettle'](el145) {
    (this._cancelTimelineSettle(), (this._timelineSettleVersion += 1));
    if (this._timelineSettleTimer) {
      (clearTimeout(this._timelineSettleTimer), (this._timelineSettleTimer = 0));
      const el146 = this._timelineSettleRow || el145;
      (el146?.classList.remove('is-settling'),
        (this._timelineSettleRow = null),
        this._flushTimelineSettlePersist());
    }
    return (
      (this._timelineSettleRow = el145 || null),
      el145?.classList.add('is-settling'),
      el145?.getBoundingClientRect?.(),
      this._timelineSettleVersion
    );
  }
  ['_cancelTimelineSettle'](options20 = {}) {
    this._timelineSettleVersion = toNumber(this._timelineSettleVersion, 0) + 1;
    this._timelineSettleTimer && (clearTimeout(this._timelineSettleTimer), (this._timelineSettleTimer = 0));
    const el147 = this._timelineSettleRow;
    (el147?.classList.remove('is-settling'),
      (this._timelineSettleRow = null),
      options20.flushPersist !== false
        ? this._flushTimelineSettlePersist()
        : ((this._timelineSettlePendingPersist = false), (this._timelineSettlePendingCommit = false)));
  }
  ['_updateTrackPlayheadVisual'](el148, value513 = 0, playheadSec5 = {}) {
    if (!el148) return;
    const durationSec21 = this._timelineRowDuration(el148, value513);
    (this._setTimelineRowDuration(el148, durationSec21), this._syncTimelineCursorLayerForRow(el148));
    const el149 = this._timelineCursorHost(el148),
      enabled54 =
        el149?.querySelector?.('.media-clip-playhead') || el148.querySelector?.('.media-clip-playhead');
    if (!enabled54) return;
    this._applyTimelinePlayheadModel(
      enabled54,
      getMediaClipTimelinePlayheadModel({
        playheadSec: playheadSec5.playheadSec ?? this._playheadSec,
        durationSec: durationSec21,
      }),
    );
  }
  ['_updateTimelineHoverPlayheadVisual'](el150, value514 = 0, playheadSec6 = {}) {
    if (!el150) return;
    const durationSec22 = this._timelineRowDuration(el150, value514);
    (this._setTimelineRowDuration(el150, durationSec22), this._syncTimelineCursorLayerForRow(el150));
    const el151 = this._timelineCursorHost(el150),
      el152 =
        el151?.querySelector?.('.media-clip-hover-playhead') ||
        el150.querySelector?.('.media-clip-hover-playhead');
    if (!el152) return;
    ((el152.hidden = false),
      el152.classList?.add('is-visible'),
      this._applyTimelinePlayheadModel(
        el152,
        getMediaClipTimelinePlayheadModel({
          playheadSec: playheadSec6.playheadSec ?? this._playheadSec,
          durationSec: durationSec22,
        }),
      ));
  }
  ['_hideTimelineHoverPlayhead'](el153 = null) {
    const el154 = this._timelineCursorHost(el153),
      list39 = [],
      list40 = el154?.querySelectorAll
        ? el154.querySelectorAll('.media-clip-hover-playhead')
        : this.el?.querySelectorAll?.('.media-clip-hover-playhead');
    list40?.forEach?.((value515) => list39.push(value515));
    const value516 =
      el154?.querySelector?.('.media-clip-hover-playhead') ||
      el153?.querySelector?.('.media-clip-hover-playhead');
    if (value516 && !list39.includes(value516)) list39.push(value516);
    list39.forEach((el155) => {
      (el155.classList?.remove('is-visible'), (el155.hidden = true));
    });
  }
  ['_clearTimelinePlaybackVisualLocks']() {
    const el156 = this.el;
    (el156?.querySelectorAll?.('.media-clip-compact-timeline')?.forEach((el157) => {
      el157.classList?.remove('is-moving-material');
    }),
      el156?.querySelectorAll?.('.media-clip-timeline-lane')?.forEach((el158) => {
        (el158.classList?.remove('is-moving'), el158.classList?.remove('is-trimming'));
      }),
      el156?.querySelectorAll?.('.media-clip-timeline-scroll')?.forEach((el159) => {
        el159.classList?.remove('is-trimming');
      }),
      el156?.querySelectorAll?.('.media-clip-track')?.forEach((el160) => {
        (el160.classList?.remove('is-trimming'), el160.classList?.remove('is-preview-dragging'));
      }),
      el156?.querySelectorAll?.('.media-clip-segment')?.forEach((el161) => {
        (el161.classList?.remove('is-dragging'), el161.classList?.remove('is-trimming'));
      }));
  }
  ['_updatePlaybackVisuals'](value517) {
    const enabled55 = this._mediaClip.tracks?.[value517],
      enabled56 = this.el?.querySelector('.media-clip-track-' + value517 + ':not(.is-compact)');
    if (!enabled55 || !enabled56) return;
    const value518 = this._timelineDurationForKind(value517);
    this._updateTrackPlayheadVisual(enabled56, value518);
  }
  ['_updateTrackVisuals'](value519, value520 = {}) {
    const enabled57 = this._mediaClip.tracks?.[value519],
      el162 = this.el?.querySelector('.media-clip-track-' + value519 + ':not(.is-compact)');
    if (!enabled57 || !el162) return;
    const durationSec23 =
      value519 === 'video'
        ? getMediaClipTimelineDisplayDuration(value520.durationSec ?? this._videoTimelineDuration(enabled57))
        : getMediaClipTimelineDisplayDuration(
            value520.durationSec ?? this._timelineDurationForKind(value519),
          );
    this._setTimelineRowDuration(el162, durationSec23);
    if (value519 === 'video' && value520.syncTimelineWidth !== false)
      this._syncTimelineContentWidth(undefined, { durationSec: durationSec23 });
    else
      value519 === 'video' && this._syncTimelineAddSlotForRow(el162, { displayDurationSec: durationSec23 });
    if (value519 === 'video' && (this._mediaClip.clips || []).length) {
      const value521 = this._mediaClip.clips || [];
      el162.querySelectorAll('.media-clip-segment').forEach((el163) => {
        const value522 = this._segmentClipIndex(el163, value519, value521),
          enabled58 = value521[value522];
        if (!enabled58) return;
        el163.dataset.clipIndex = String(value522);
        const text24 = normalizeText(enabled58.id);
        if (text24) el163.dataset.clipId = text24;
        const startSec21 = toNumber(enabled58.timelineStartSec, 0),
          endSec10 = Math.max(startSec21, toNumber(enabled58.timelineEndSec, startSec21));
        (this._applyTimelineSegmentRect(
          el163,
          this._timelinePreviewRangeRect({
            startSec: startSec21,
            endSec: endSec10,
            durationSec: durationSec23,
          }),
        ),
          this._updateTimelineSegmentLabel(el163, Math.max(0, endSec10 - startSec21)));
      });
    } else {
      if (value519 === 'audio' && (this._mediaClip.audioClips || []).length) {
        const value523 = this._mediaClip.audioClips || [],
          value524 = this._audioLaneCount(value523);
        (this._setAudioLaneCountStyle(el162, value524),
          this._setAudioLaneCountStyle(el162.parentElement, value524),
          this._setAudioLaneCountStyle(el162.closest?.('.media-clip-timeline-lane'), value524),
          this._setAudioLaneCountStyle(el162.closest?.('.media-clip-compact-timeline'), value524),
          this._syncAudioLaneControls(value523, value524),
          el162.querySelectorAll('.media-clip-segment').forEach((el164) => {
            const value525 = this._segmentClipIndex(el164, value519, value523),
              el165 = value523[value525];
            if (!el165) return;
            el164.dataset.clipIndex = String(value525);
            const text25 = normalizeText(el165.id);
            if (text25) el164.dataset.clipId = text25;
            const startSec22 = toNumber(el165.timelineStartSec, 0),
              endSec11 = Math.max(startSec22, toNumber(el165.timelineEndSec, startSec22));
            (this._applyAudioTimelineSegmentRect(
              el164,
              getMediaClipTimelineRangeRect({
                startSec: startSec22,
                endSec: endSec11,
                durationSec: durationSec23,
              }),
            ),
              this._updateTimelineSegmentLabel(el164, Math.max(0, endSec11 - startSec22)),
              this._setAudioSegmentLaneVisual(el164, this._audioClipLaneIndex(el165)),
              (el164.dataset.mutedClip = el165.muted === true ? 'true' : 'false'),
              (el164.dataset.disabledClip = el165.disabled === true ? 'true' : 'false'),
              el164.classList?.toggle?.('is-muted', el165.muted === true),
              el164.classList?.toggle?.('is-disabled', el165.disabled === true),
              this._syncAudioSegmentWaveformViewport(el164, el165));
          }));
      } else {
        const value526 = el162.querySelector('.media-clip-segment');
        if (value526) {
          const startSec23 = toNumber(enabled57.startSec, 0),
            endSec12 = Math.max(startSec23, toNumber(enabled57.endSec, startSec23));
          value519 === 'audio'
            ? this._applyAudioTimelineSegmentRect(
                value526,
                getMediaClipTimelineRangeRect({
                  startSec: startSec23,
                  endSec: endSec12,
                  durationSec: durationSec23,
                }),
              )
            : this._applyTimelineSegmentRect(
                value526,
                getMediaClipTimelineRangeRect({
                  startSec: startSec23,
                  endSec: endSec12,
                  durationSec: durationSec23,
                }),
              );
          this._updateTimelineSegmentLabel(value526, Math.max(0, endSec12 - startSec23));
          if (value519 === 'audio') this._syncAudioSegmentWaveformViewport(value526, enabled57);
        }
      }
    }
    (this._syncTrackActiveClipChrome(el162, value519), this._updateTrackPlayheadVisual(el162, durationSec23));
  }
  ['_primaryDuration'](options21 = {}) {
    const value527 = this._mediaClip.tracks?.video,
      value528 = this._mediaClip.tracks?.audio;
    return (
      (value527 ? this._videoTimelineDuration(value527, null, options21) : 0) ||
      this._audioTimelineDuration(value528, null, options21) ||
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
    const value529 = this._getPlaybackKind();
    if (value529 === 'video')
      (this._syncVideoPreviewSourceForTimelineSec(this._playheadSec),
        this._syncPreviewTime('video', this._videoSourceSecForPlayhead(this._playheadSec), {
          immediate: true,
        }));
    else
      value529 === 'audio' &&
        (this._setActiveAudioClipIndex(this._audioClipIndexAtTimelineSec(this._playheadSec)),
        this._syncAudioPreviewSourceForTimelineSec(this._playheadSec),
        this._syncPreviewTime('audio', this._audioSourceSecForPlayhead(this._playheadSec), {
          immediate: true,
        }));
    this._updatePreviewControls();
  }
  ['_edgeIdForMaterial'](value530 = 'video', value531 = 0) {
    if (value530 === 'audio') {
      const value532 = this._audioTimelineClips(this._mediaClip.tracks?.audio)[value531],
        value533 = this._audioClipSource(value532, value531);
      return normalizeText(value533?.__mediaClipEdgeId);
    }
    const value534 = this._videoTimelineClips(this._mediaClip.tracks?.video)[value531],
      value535 = this._videoClipSource(value534, value531);
    return normalizeText(value535?.__mediaClipEdgeId);
  }
  ['_deleteActiveMaterial']() {
    const value536 = this._mediaClip.activeTrack === 'audio' ? 'audio' : 'video',
      value537 =
        value536 === 'video'
          ? this._clampSelectedClipIndex(this._selectedClipIndex) >= 0
            ? this._clampSelectedClipIndex(this._selectedClipIndex)
            : this._clampVideoClipIndex(this._activeClipIndex)
          : this._clampSelectedAudioClipIndex(this._selectedAudioClipIndex) >= 0
            ? this._clampSelectedAudioClipIndex(this._selectedAudioClipIndex)
            : this._clampAudioClipIndex(this._activeAudioClipIndex);
    this._deleteMaterial(value536, value537);
  }
  ['_deleteMaterial'](value538 = 'video', value539 = 0) {
    if (this._timelineDrag()) return;
    const value540 = value538 === 'audio' ? 'audio' : 'video',
      value541 = this._mediaClip.activeTrack;
    (this._pausePreviewPlayback({ updateControls: false }), (this._materialMenu = null));
    let activeTrack4 = this._mediaClip,
      value542 = '';
    if (value540 === 'audio') {
      if (!this._mediaClip.tracks?.audio) return;
      const list41 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
        value543 = Math.max(0, Math.min(list41.length - 1, Math.trunc(toNumber(value539, 0)))),
        enabled59 = list41[value543];
      if (!enabled59) return;
      const value544 = this._audioClipSource(enabled59, value543),
        text26 = normalizeText(enabled59.sourceId || value544?.id),
        text27 = normalizeText(enabled59.sourceKey || resolveMediaClipLocalPath(value544));
      ((value542 = this._edgeIdForMaterial('audio', value543)),
        (activeTrack4 = removeMediaClipAudioClip(this._mediaClip, value543)));
      const list42 = Array.isArray(activeTrack4.audioClips) ? activeTrack4.audioClips : [],
        value545 = list42.some((item43) => {
          const text28 = normalizeText(item43?.sourceId),
            text29 = normalizeText(item43?.sourceKey);
          return (text26 && text28 === text26) || (text27 && text29 === text27);
        });
      if (value545) value542 = '';
      ((this._activeAudioClipIndex = list42.length ? Math.max(0, Math.min(list42.length - 1, value543)) : 0),
        (this._selectedAudioClipIndex = list42.length ? this._activeAudioClipIndex : -1),
        (activeTrack4 = {
          ...activeTrack4,
          activeTrack: activeTrack4.tracks?.video ? 'video' : activeTrack4.tracks?.audio ? 'audio' : 'video',
          expanded:
            !!(activeTrack4.tracks?.video || activeTrack4.tracks?.audio) && this._mediaClip.expanded === true,
        }));
    } else {
      const list43 = this._videoTimelineClips(this._mediaClip.tracks?.video),
        value546 = Math.max(0, Math.min(list43.length - 1, Math.trunc(toNumber(value539, 0)))),
        enabled60 = list43[value546];
      if (!enabled60) return;
      const value547 = this._videoClipSource(enabled60, value546),
        text30 = normalizeText(enabled60.sourceId || value547?.id),
        text31 = normalizeText(enabled60.sourceKey || resolveMediaClipLocalPath(value547));
      ((value542 = this._edgeIdForMaterial('video', value546)),
        (activeTrack4 = removeMediaClipClip(this._mediaClip, value546)));
      const list44 = Array.isArray(activeTrack4.clips) ? activeTrack4.clips : [],
        value548 = list44.some((item44) => {
          const text32 = normalizeText(item44?.sourceId),
            text33 = normalizeText(item44?.sourceKey);
          return (text30 && text32 === text30) || (text31 && text33 === text31);
        });
      if (value548) value542 = '';
      ((this._activeClipIndex = list44.length ? Math.max(0, Math.min(list44.length - 1, value546)) : 0),
        (this._selectedClipIndex = list44.length ? this._activeClipIndex : -1),
        (activeTrack4 = {
          ...activeTrack4,
          activeTrack: activeTrack4.tracks?.video ? 'video' : activeTrack4.tracks?.audio ? 'audio' : 'video',
          expanded:
            !!(activeTrack4.tracks?.video || activeTrack4.tracks?.audio) && this._mediaClip.expanded === true,
        }));
    }
    const value549 = activeTrack4.expanded !== true || value541 !== activeTrack4.activeTrack;
    this._setMediaClipWithLayout(activeTrack4, false, { render: false });
    value542 &&
      typeof appStore.removeEdge === 'function' &&
      ((this._skipNextIncomingMediaClipRender = true),
      appStore.removeEdge(value542),
      this._skipNextIncomingMediaClipRender === true && (this._skipNextIncomingMediaClipRender = false));
    commit();
    if (value549) this._render();
    else this._refreshMediaClipTimelineInPlace();
  }
  ['_singleVisualClipExportTrack'](options22 = {}) {
    return singleVisualClipExportTrack(options22);
  }
  ['_exportVisualClips'](value550 = this._mediaClip.tracks?.video) {
    return exportVisualClips(this, value550);
  }
  ['_firstExportVideoSource'](list45 = []) {
    return firstExportVideoSource(this, list45);
  }
  ['_exportVisualDurationSec'](list46 = []) {
    return exportVisualDurationSec(list46);
  }
  ['_exportAudioClips'](value551 = this._mediaClip.tracks?.audio) {
    return exportAudioClips(this, value551);
  }
  ['_exportLoadingTargetElement']() {
    return exportLoadingTargetElement(this);
  }
  ['_startExportLoading'](mediaClipText5 = mediaClipText('export.loading')) {
    return startExportLoading(this, mediaClipText5);
  }
  ['_stopExportLoading']() {
    return stopExportLoading(this);
  }
  ['_waitForExportLoadingFrame']() {
    return waitForExportLoadingFrame();
  }
  async ['_exportMaterialToCanvas'](value552 = 'video', value553 = 0) {
    return exportMaterialToCanvas(this, value552, value553);
  }
  ['_renderDownloadMenu']() {
    return renderDownloadMenu(this);
  }
  async ['_exportAndUse'](value554) {
    return exportAndUse(this, value554);
  }
  ['_resolveOutputNodePosition'](value555, value556) {
    return resolveOutputNodePosition(this, value555, value556);
  }
  ['_addImageOutputNodeFromSource'](options23 = {}, value557 = {}) {
    return addImageOutputNodeFromSource(this, options23, value557);
  }
  ['_addOutputNode'](value558, value559 = {}, value560 = {}) {
    return addOutputNode(this, value558, value559, value560);
  }
}
