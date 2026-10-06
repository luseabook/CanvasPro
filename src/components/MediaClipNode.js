import appStore from '../core/stores/appStore.js';
import { generateId } from '../core/math.js';
import { syncRendererNodePresentationZIndex } from '../core/rendererNodePresentation.js';
import { commit } from '../modules/history.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { getShortcuts, resolveShortcutActionForEvent } from '../modules/shortcuts.js';
import { getWaveformBarsPathFromPersistedUrl, getWaveformBarsPathFromUrl } from '../utils/audioWaveform.js';
import {
  MEDIA_CLIP_COMPACT_SIZE,
  MEDIA_CLIP_AUDIO_LANE_COUNT_MAX,
  MEDIA_CLIP_TIMELINE_ZOOM_MIN,
  buildMediaClipExportPayload,
  buildMediaClipIncomingSignature,
  getMediaClipInputKind,
  normalizeMediaClipAudioLaneIndex,
  normalizeMediaClipTimelineView,
  normalizeMediaClipState,
  patchMediaClipAudioLaneMuted,
  patchMediaClipAudioClipState,
  removeMediaClipAudioClip,
  removeMediaClipClip,
  resolveMediaClipSourceKey,
  splitMediaClipAudioAtTimelineSec,
  splitMediaClipAtTimelineSec,
} from './media-clip/mediaClipState.js';
import {
  buildMediaClipTimelineTicks,
  getMediaClipFrameCount,
  getMediaClipTimelineAddSlotLeftPx,
  getMediaClipTimelineContentWidthPx,
  getMediaClipTimelineDisplayDuration,
  getMediaClipTimelinePercent,
  getMediaClipTimelinePlayheadModel,
  getMediaClipTimelineRangeRect,
  getMediaClipTimelineSecFromClientX,
  getMediaClipTimelineTrackWidthPx,
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
  applyPreviewVideoLayout,
  clearPreviewVideoFallback,
  ensurePreviewAudioElement,
  ensurePreviewImageElement,
  ensurePreviewVideoElement,
  getPreviewLayoutTokens,
  getPreviewVideoLayoutClasses,
  renderPreview,
  renderPreviewControls,
  renderPreviewPanel,
  renderVideoFallback,
  showPreviewImage,
  showPreviewVideo,
  syncPreviewPanelLayout,
  syncPreviewVideoLayoutFromElement,
} from './media-clip/mediaClipPreviewView.js';
import { renderMediaClipMaterialMenu } from './media-clip/mediaClipMaterialMenuView.js';
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
  applyMediaClipTimelineDragPreviewFromPointer,
  commitMediaClipTimelineEdit,
  detachMediaClipTimelineEditDrag,
  handleMediaClipTimelineDrag,
  handleMediaClipTimelineSegmentDrag,
  previewMediaClipTimelineMoveDrag,
  previewMediaClipTimelineTrimDrag,
  renderMediaClipTimelineTrimHandle,
  startMediaClipTimelineSegmentDrag,
} from './media-clip/mediaClipTimelineEditController.js';
import {
  bindTimelineScroll,
  clampTimelineScrollLeft,
  handleTimelineZoomWheel,
  persistTimelineDragScroll,
  primeTimelineScroll,
  runTimelineDragAutoScroll,
  scheduleTimelineDragAutoScroll,
  shouldLockTimelineWheelScroll,
  stopTimelineDragAutoScroll,
  syncTimelineScrollFade,
  timelineDragAutoScrollVelocity,
  timelineDragDeltaPx,
  timelineDragScrollDeltaPx,
  timelineMaterialRangeSec,
  timelineMaterialScrollBounds,
} from './media-clip/mediaClipTimelineViewportController.js';
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
  TIMELINE_SETTLE_ANIMATION_MS = 360,
  PREVIEW_SCRUB_SEEK_EPSILON_SEC = 0.04,
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
      (this._onShortcutsUpdated = null),
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
      (this._onShortcutsUpdated = () => this._rerenderCompactOnly()),
      window.addEventListener('shortcuts-updated', this._onShortcutsUpdated),
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
      this._onShortcutsUpdated &&
        (window.removeEventListener('shortcuts-updated', this._onShortcutsUpdated),
        (this._onShortcutsUpdated = null)),
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
    if (
      this._skipNextStoreMediaClipRender &&
      isSameMediaClipState(scope?.mediaClip, this._mediaClip)
    ) {
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
    const state2 = appStore.getState(),
      list = Object.values(state2.edges || {})
        .filter((input) => input?.targetId === this.id)
        .sort((output, value3) => {
          const toNumber6 = toNumber(output?.createdAt, 0),
            toNumber7 = toNumber(value3?.createdAt, 0);
          if (toNumber6 !== toNumber7) return toNumber6 - toNumber7;
          return normalizeText(output?.id).localeCompare(normalizeText(value3?.id));
        })
        .map((value4) => {
          const args = state2.nodes?.[value4.sourceId];
          return args ? { ...args, __mediaClipEdgeId: normalizeText(value4?.id) } : null;
        })
        .filter(Boolean),
      video = list.filter((value5) => {
        const mediaClipInputKind = getMediaClipInputKind(value5);
        return mediaClipInputKind === 'video' || mediaClipInputKind === 'image';
      }),
      audio = list.filter((value6) => getMediaClipInputKind(value6) === 'audio');
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
      (this._selectedAudioClipIndex = this._clampSelectedAudioClipIndex(
        this._selectedAudioClipIndex,
      )));
    const value7 = !!(mediaClip.tracks?.video || mediaClip.tracks?.audio),
      box4 = this._compactLayoutSize(mediaClip),
      box5 = {};
    value7 &&
      toNumber(box3?.width, box4.width) !== box4.width &&
      (box5.width = box4.width);
    value7 &&
      toNumber(box3?.height, box4.height) !== box4.height &&
      (box5.height = box4.height);
    const value8 = { ...box5 };
    !isSameMediaClipState(box3?.mediaClip, mediaClip) && (value8.mediaClip = mediaClip);
    if (Object.keys(value8).length) appStore.updateNodeData(this.id, value8);
    this.nodeData = { ...(box3 || {}), ...box5, mediaClip: mediaClip };
    const value9 =
      mediaClip.tracks?.[mediaClip.activeTrack] ||
      mediaClip.tracks?.video ||
      mediaClip.tracks?.audio;
    value9 &&
      this._playheadSec <= 0 &&
      (this._playheadSec =
        mediaClip.activeTrack === 'video'
          ? this._videoTimelineStart(value9, mediaClip.clips)
          : value9.startSec);
  }
  ['_isPicking']() {
    const value10 = appStore.getState()?.pickConnectMode || {};
    return value10.active === true && value10.sourceNodeId === this.id;
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
    return (
      (this._timelineViewPersistRender = false),
      this._persistTimelineView({ render: render2 }),
      true
    );
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
  ['_setMediaClip'](value11, value12 = false, value13 = {}) {
    const mediaClip3 = this._normalizeMediaClipWithTimelineView(value11);
    ((this._mediaClip = mediaClip3),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: mediaClip3 }));
    if (value13.render === false) this._skipNextStoreMediaClipRender = true;
    appStore.updateNodeData(this.id, { mediaClip: mediaClip3 });
    if (value12) commit();
    if (value13.render !== false) this._render();
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
  ['_setMediaClipWithLayout'](value14, value15 = false, value16 = {}) {
    if (value14.expanded === true && value16.claimExpanded !== false) this._claimExpandedEditor();
    else
      value14.expanded !== true &&
        (this._prepareTimelineForCollapse(),
        this._releaseExpandedEditor(),
        this._disposePreviewMedia());
    const args5 = this.nodeData || {},
      mediaClip4 = this._normalizeMediaClipWithTimelineView(value14),
      width2 = this._compactLayoutSize(mediaClip4),
      args6 = { width: width2.width, height: width2.height, mediaClip: mediaClip4 };
    ((this._mediaClip = args6.mediaClip), (this.nodeData = { ...args5, ...args6 }));
    if (value16.render === false) this._skipNextStoreMediaClipRender = true;
    appStore.updateNodeData(this.id, args6);
    if (value15) commit();
    if (value16.render !== false) this._render();
  }
  ['_setActiveTrack'](activeTrack, value17 = null, value18 = {}) {
    const enabled = this._mediaClip.tracks?.[activeTrack];
    if (!enabled) return;
    this._pausePreviewPlayback({ updateControls: false });
    const mediaClip5 = { ...this._mediaClip, activeTrack: activeTrack };
    this._playheadSec = value17 == null ? this._playheadSec : value17;
    const value19 = this._mediaClip.activeTrack !== activeTrack;
    ((this._mediaClip = mediaClip5),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: mediaClip5 }));
    value19 && appStore.updateNodeData(this.id, { mediaClip: mediaClip5 });
    value19 || value18.forceRender === true
      ? this._render()
      : this._updateTrackVisuals(activeTrack, { syncTimelineWidth: false });
    if (activeTrack === 'video') this._syncVideoPreviewSourceForTimelineSec(this._playheadSec);
    else
      activeTrack === 'audio' &&
        (this._setActiveAudioClipIndex(this._audioClipIndexAtTimelineSec(this._playheadSec)),
        this._syncAudioPreviewSourceForTimelineSec(this._playheadSec));
    this._syncPreviewTime(
      activeTrack,
      this._previewSourceSecForTimelineSec(activeTrack, this._playheadSec),
    );
  }
  ['_togglePickConnect'](value20) {
    stopPointer(value20);
    const value21 = this._isPicking();
    if (value21) {
      appStore.setPickConnectMode({ active: false });
      return;
    }
    appStore.setPickConnectMode({ active: true, sourceNodeId: this.id, handleDirection: 'left' });
  }
  ['_setExpanded'](expanded, args7 = {}) {
    const value22 = { ...this._mediaClip, ...args7, expanded: expanded === true };
    this._setMediaClipWithLayout(value22, true);
  }
  ['_splitActiveMaterial'](value23 = this._getPlaybackKind()) {
    const activeTrack2 = value23 === 'audio' ? 'audio' : 'video',
      enabled2 = this._mediaClip.tracks?.[activeTrack2];
    if (!enabled2) return;
    const value24 = this._playheadSec,
      args8 =
        activeTrack2 === 'audio'
          ? splitMediaClipAudioAtTimelineSec(this._mediaClip, value24, generateId('split'))
          : splitMediaClipAtTimelineSec(this._mediaClip, value24, generateId('split'));
    if (isSameMediaClipState(args8, this._mediaClip)) {
      window.showToast?.(mediaClipText('toasts.splitAtMiddle'));
      return;
    }
    if (activeTrack2 === 'audio') {
      const value25 = this._audioClipIndexAtTimelineSec(value24 + 0.001, args8.audioClips);
      ((this._activeAudioClipIndex = value25), (this._selectedAudioClipIndex = value25));
    } else {
      const value26 = this._clipIndexAtTimelineSec(value24 + 0.001, args8.clips);
      ((this._activeClipIndex = value26), (this._selectedClipIndex = value26));
    }
    (this._pausePreviewPlayback({ updateControls: false }),
      this._setMediaClipWithLayout({ ...args8, activeTrack: activeTrack2, expanded: true }, true, {
        render: false,
      }),
      this._rerenderCompactOnly(),
      activeTrack2 === 'audio'
        ? (this._syncAudioPreviewSourceForTimelineSec(value24),
          this._syncPreviewTime('audio', this._audioSourceSecForPlayhead(value24), {
            immediate: true,
          }))
        : (this._syncVideoPreviewSourceForTimelineSec(value24),
          this._syncPreviewTime('video', this._videoSourceSecForPlayhead(value24), {
            immediate: true,
          })),
      this._updatePreviewControls());
  }
  ['_splitActiveVideoClip']() {
    this._splitActiveMaterial('video');
  }
  ['_getPlaybackKind']() {
    const value27 = this._mediaClip.activeTrack;
    if (this._mediaClip.tracks?.[value27]) return value27;
    if (this._mediaClip.tracks?.video) return 'video';
    if (this._mediaClip.tracks?.audio) return 'audio';
    return '';
  }
  ['_getPlaybackTrack'](value28 = this._getPlaybackKind()) {
    return value28 ? this._mediaClip.tracks?.[value28] || null : null;
  }
  ['_getVideoClipAtTimelineSec'](
    value29 = this._playheadSec,
    value30 = this._videoTimelineClips(this._mediaClip.tracks?.video),
  ) {
    const list2 = Array.isArray(value30) ? value30 : [];
    if (!list2.length) return null;
    return list2[this._clipIndexAtTimelineSec(value29, list2)] || list2[0];
  }
  ['_videoTimelineStart'](
    value31 = this._mediaClip.tracks?.video,
    value32 = this._videoTimelineClips(value31),
  ) {
    const list3 = Array.isArray(value32) ? value32 : [];
    if (list3.length)
      return list3.reduce(
        (value33, value34) => Math.min(value33, toNumber(value34.timelineStartSec, 0)),
        Number.POSITIVE_INFINITY,
      );
    return toNumber(value31?.startSec, 0);
  }
  ['_timelineDisplayEnd'](value35 = this._getPlaybackKind()) {
    if (value35 === 'video')
      return this._videoTimelineBaseDuration(this._mediaClip.tracks?.video);
    const value36 = this._mediaClip.tracks?.[value35];
    return toNumber(value36?.endSec || value36?.durationSec, 0);
  }
  ['_getPlaybackMedia'](value37 = this._getPlaybackKind()) {
    return value37 ? this._getPreviewMedia(value37) : null;
  }
  ['_isSecInsideTrack'](enabled3, value38) {
    if (!enabled3) return false;
    const toNumber8 = toNumber(value38, -1);
    return (
      toNumber8 >= toNumber(enabled3.startSec, 0) && toNumber8 <= toNumber(enabled3.endSec, 0)
    );
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
  ['_resetPlaybackClock'](value39 = this._playheadSec) {
    return resetPlaybackClock(this, value39);
  }
  ['_playbackClockTimelineSec'](value40 = this._playheadSec) {
    return playbackClockTimelineSec(this, value40);
  }
  async ['_preparePreviewMediaForPlayback'](value41, value42 = null) {
    return preparePreviewMediaForPlayback(this, value41, value42);
  }
  ['_togglePreviewPlayback'](value43) {
    return togglePreviewPlayback(this, value43);
  }
  async ['_playPreview']() {
    return playPreview(this);
  }
  async ['_playReplacementAudioFromVideo'](value44) {
    return playReplacementAudioFromVideo(this, value44);
  }
  ['_syncReplacementAudioFromVideo'](value45, value46 = {}) {
    return syncReplacementAudioFromVideo(this, value45, value46);
  }
  ['_startPlaybackLoop'](value47) {
    return startPlaybackLoop(this, value47);
  }
  ['_setPreviewPlayIcon'](value48 = this._previewPlayButton) {
    return setPreviewPlayIcon(this, value48);
  }
  ['_updatePreviewControls']() {
    return updatePreviewControls(this);
  }
  ['_getPreviewMedia'](value49) {
    return value49 === 'audio' ? this._audioPreview : this._videoPreview;
  }
  ['_visualClipKind'](value50 = null, value51 = null) {
    const text = normalizeText(value50?.kind);
    if (text === 'image') return 'image';
    const mediaClipInputKind2 = getMediaClipInputKind(value51 || {});
    return mediaClipInputKind2 === 'image' ? 'image' : 'video';
  }
  ['_getVisualClipContextAtTimelineSec'](value52 = this._playheadSec, value53 = null) {
    const value54 = Array.isArray(value53)
        ? value53
        : this._videoTimelineClips(this._mediaClip.tracks?.video),
      index2 = this._clipIndexAtTimelineSec(value52, value54),
      clip = value54[index2] || this._getVideoClipAtTimelineSec(value52, value54),
      source2 = clip ? this._videoClipSource(clip, index2) : this._sources.video,
      clipKind = this._visualClipKind(clip, source2);
    return { clip: clip, index: index2, source: source2, clipKind: clipKind };
  }
  ['_resolveVideoPreviewSeekTarget']() {
    const toNumber9 = toNumber(this._pendingPreviewSeek?.video, Number.NaN);
    if (Number.isFinite(toNumber9)) return Math.max(0, toNumber9);
    return this._videoSourceSecForPlayhead(this._playheadSec || 0);
  }
  ['_getVideoPreviewContextAtTimelineSec'](value55 = this._playheadSec, value56 = null) {
    const value57 = this._getVisualClipContextAtTimelineSec(value55, value56),
      { clip: clip2, index: index3, source: source3, clipKind: clipKind2 } = value57,
      url =
        clipKind2 === 'image' ? resolveMediaClipImageUrl(source3) : resolveMediaClipVideoUrl(source3);
    return {
      clip: clip2,
      index: index3,
      clipKind: clipKind2,
      source: source3,
      url: url,
      posterUrl: resolveMediaClipThumbUrl(source3),
      sourceSec: clip2 ? this._videoSourceSecForTimelineSec(value55, value56) : value55,
    };
  }
  ['_syncVideoPreviewSourceForTimelineSec'](value58 = this._playheadSec, value59 = {}) {
    const el = this._videoPreview,
      response = this._getVideoPreviewContextAtTimelineSec(value58, value59.clips);
    if (!response.url) return false;
    if (response.clipKind === 'image')
      return (this._showPreviewImage(response.source, response.url), true);
    if (!el) return false;
    (this._showPreviewVideo(response.source),
      (el.__mediaClipFallbackHost ??= el.parentElement || null),
      (el.__mediaClipPosterUrl = response.posterUrl));
    if (response.posterUrl) el.poster = response.posterUrl;
    else el.removeAttribute?.('poster');
    this._applyPreviewVideoLayout(el.parentElement, response.source);
    const value60 = this._normalizePreviewSourceIdentity(
        firstNonEmpty(
          el.dataset?.desktopMediaSourceUrl,
          el.dataset?.mediaClipSourceUrl,
          el.getAttribute?.('src'),
          el.currentSrc,
          el.src,
        ),
      ),
      value61 = this._normalizePreviewSourceIdentity(response.url);
    value61 &&
      value60 !== value61 &&
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
      const value62 = this._normalizePreviewSourceIdentity(
        el.__mediaClipPendingSourceSeek?.src,
      );
      if (value62 && value62 === value61)
        ((el.__mediaClipPendingSourceSeek.sec = Math.max(
          0,
          toNumber(response.sourceSec, 0),
        )),
          el.classList?.add('is-source-switching'));
      else !el.__mediaClipWaitingSourceSeek && this._clearVideoSourceSwitchHold(el);
    }
    return ((this._previewVideoSrc = response.url), setMediaElementSource2);
  }
  ['_getAudioClipContextAtTimelineSec'](value63 = this._playheadSec, value64 = {}) {
    const list4 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
      list5 = list4.map((clip3, index4) => ({ clip: clip3, index: index4 })).filter(({ clip: clip4 }) =>
        value64.audibleOnly === true
          ? clip4?.muted !== true && clip4?.disabled !== true
          : true,
      ),
      toNumber10 = toNumber(value63, 0),
      count = list5.findIndex(({ clip: clip5 }, value65) => {
        const toNumber11 = toNumber(clip5.timelineStartSec, 0),
          value66 = Math.max(toNumber11, toNumber(clip5.timelineEndSec, toNumber11));
        return value65 === list5.length - 1
          ? toNumber10 >= toNumber11 && toNumber10 <= value66
          : toNumber10 >= toNumber11 && toNumber10 < value66;
      }),
      count2 =
        count >= 0 || value64.nearest === false
          ? count
          : this._audioClipIndexAtTimelineSec(
              value63,
              list5.map(({ clip: clip6 }) => clip6),
            ),
      value67 = value64.nearest === false ? null : list5[0] || null,
      value68 = count2 >= 0 ? list5[count2] || null : value67,
      clip7 = value68?.clip || null,
      index5 = value68?.index ?? -1,
      source4 = clip7
        ? this._audioClipSource(clip7, index5)
        : value64.nearest === false
          ? null
          : this._sources.audio;
    return {
      clip: clip7,
      index: index5,
      source: source4,
      url: resolveMediaClipAudioUrl(source4),
      sourceSec: clip7 ? this._audioClipSourceSec(clip7, value63) : value63,
    };
  }
  ['_syncAudioPreviewSourceForTimelineSec'](value69 = this._playheadSec) {
    const enabled5 = this._audioPreview;
    if (!enabled5) return false;
    this._videoPreview &&
      this._mediaClip.tracks?.audio &&
      (this._videoPreview.muted = true);
    const response2 = this._getAudioClipContextAtTimelineSec(value69, {
      audibleOnly: true,
      nearest: false,
    });
    if (!response2.url)
      return (setMediaElementSource(enabled5, ''), (this._previewAudioSrc = ''), false);
    const setMediaElementSource3 = setMediaElementSource(enabled5, response2.url);
    if (setMediaElementSource3) this._resetPreviewSeekState('audio');
    return ((this._previewAudioSrc = response2.url), setMediaElementSource3);
  }
  ['_createPreviewSeekState'](args9 = {}) {
    return { lastAppliedSec: null, ...args9 };
  }
  ['_getPreviewSeekState'](value70) {
    if (!this._previewSeekState) this._previewSeekState = {};
    return (
      !this._previewSeekState[value70] &&
        (this._previewSeekState[value70] = this._createPreviewSeekState()),
      this._previewSeekState[value70]
    );
  }
  ['_resetPreviewSeekState'](value71 = '') {
    const list6 = value71 ? [value71] : ['video', 'audio'];
    if (!this._previewSeekState) this._previewSeekState = {};
    list6.forEach((value72) => {
      (this._cancelPreviewSeek(value72),
        (this._previewSeekState[value72] = this._createPreviewSeekState()));
    });
  }
  ['_cancelPreviewSeek'](value73) {
    const enabled6 = this._previewSeekRaf?.[value73];
    if (!enabled6) return;
    try {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(enabled6);
    } catch {}
    try {
      clearTimeout(enabled6);
    } catch {}
    this._previewSeekRaf[value73] = 0;
  }
  ['_disposePreviewMedia'](enabled7 = '') {
    (!enabled7 || enabled7 === this._getPlaybackKind()) &&
      this._pausePreviewPlayback({ updateControls: false });
    const value74 = !enabled7 || enabled7 === 'video',
      value75 = !enabled7 || enabled7 === 'video' || enabled7 === 'image',
      value76 = !enabled7 || enabled7 === 'audio';
    value74 &&
      (this._resetPreviewSeekState('video'),
      this._clearVideoSourceSwitchHold(this._videoPreview),
      disposeMediaElement(this._videoPreview),
      this._videoPreview?.remove?.(),
      (this._videoPreview = null),
      (this._previewVideoSrc = ''));
    if (value75) {
      (this._imagePreview?.remove?.(), (this._imagePreview = null));
      if (this._previewVisualKind === 'image') this._previewVisualKind = '';
    }
    value76 &&
      (this._resetPreviewSeekState('audio'),
      disposeMediaElement(this._audioPreview),
      this._audioPreview?.remove?.(),
      (this._audioPreview = null),
      (this._previewAudioSrc = ''));
  }
  ['_schedulePreviewSeek'](value77, value78 = {}) {
    if (this._previewSeekRaf[value77]) return;
    const run =
      typeof requestAnimationFrame === 'function'
        ? (value79) => requestAnimationFrame(value79)
        : (value80) => setTimeout(value80, 16);
    this._previewSeekRaf[value77] = run(() => {
      ((this._previewSeekRaf[value77] = 0), this._applyPreviewSeek(value77, value78));
    });
  }
  ['_applyPreviewSeek'](value81, value82 = {}) {
    if (value81 === 'video' && this._previewVisualKind === 'image') {
      this._updatePreviewControls();
      return;
    }
    const enabled8 = value82.immediate === true || value82.allowDuringPlayback === true;
    if ((this._playing || this._playPreviewPending) && !enabled8) {
      ((this._pendingPreviewSeek[value81] = null), this._updatePreviewControls());
      return;
    }
    const el2 = this._getPreviewMedia(value81),
      value83 = Math.max(0, toNumber(this._pendingPreviewSeek[value81], 0));
    if (!el2) return;
    if (el2.readyState < 1) {
      !el2.__mediaClipSeekPending &&
        ((el2.__mediaClipSeekPending = true),
        el2.addEventListener(
          'loadedmetadata',
          () => {
            ((el2.__mediaClipSeekPending = false), this._applyPreviewSeek(value81, value82));
          },
          { once: true },
        ));
      return;
    }
    const value84 = this._getPreviewSeekState(value81),
      enabled9 = value82.immediate === true,
      value85 =
        Number.isFinite(el2.duration) && el2.duration > 0
          ? Math.min(value83, el2.duration)
          : value83,
      toNumber12 = toNumber(el2.currentTime, value85),
      toNumber13 = toNumber(value84.lastAppliedSec, Number.NaN);
    if (
      !enabled9 &&
      (Math.abs(toNumber12 - value85) < PREVIEW_SCRUB_SEEK_EPSILON_SEC ||
        (Number.isFinite(toNumber13) &&
          Math.abs(value85 - toNumber13) < PREVIEW_SCRUB_SEEK_EPSILON_SEC))
    ) {
      this._updatePreviewControls();
      return;
    }
    try {
      ((el2.currentTime = value85), (value84.lastAppliedSec = value85));
    } catch {}
    this._updatePreviewControls();
  }
  ['_syncPreviewTime'](value86, value87, value88 = {}) {
    const enabled10 = value88.immediate === true || value88.allowDuringPlayback === true;
    if ((this._playing || this._playPreviewPending) && !enabled10) return;
    const value89 = Math.max(0, toNumber(value87, 0));
    this._pendingPreviewSeek[value86] = value89;
    if (value86 === 'video' && this._previewVisualKind === 'image') {
      this._updatePreviewControls();
      return;
    }
    if (!this._getPreviewMedia(value86)) return;
    if (value88.immediate === true) {
      (this._cancelPreviewSeek(value86), this._applyPreviewSeek(value86, { immediate: true }));
      return;
    }
    this._schedulePreviewSeek(value86, value88);
  }
  ['_applyPendingVideoSourceSeek'](el3 = this._videoPreview) {
    const enabled11 = el3?.__mediaClipPendingSourceSeek;
    if (!enabled11 || typeof enabled11 !== 'object') return false;
    const text2 = normalizeText(enabled11.src),
      value90 = this._normalizePreviewSourceIdentity(
        firstNonEmpty(
          el3.dataset?.desktopMediaSourceUrl,
          el3.getAttribute?.('src'),
          el3.currentSrc,
          el3.src,
        ),
      ),
      value91 = this._normalizePreviewSourceIdentity(text2);
    if (value91 && value90 !== value91) return false;
    delete el3.__mediaClipPendingSourceSeek;
    const toNumber14 = toNumber(enabled11.sec, Number.NaN);
    if (!Number.isFinite(toNumber14)) return false;
    return (
      this._syncPreviewTime('video', Math.max(0, toNumber14), { immediate: true }),
      this._waitForPendingVideoSourceSeek(el3, toNumber14),
      true
    );
  }
  ['_normalizePreviewSourceIdentity'](value92) {
    const text3 = normalizeText(value92);
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
      value93 = Math.max(
        1,
        Math.round(toNumber(el4.videoWidth, 0) || toNumber(box7.width, 0) || 1),
      ),
      value94 = Math.max(
        1,
        Math.round(toNumber(el4.videoHeight, 0) || toNumber(box7.height, 0) || 1),
      );
    ((box6.width = value93), (box6.height = value94));
    let value95 = false;
    try {
      const ctx = box6.getContext?.('2d');
      ctx && (ctx.drawImage(el4, 0, 0, value93, value94), (value95 = true));
    } catch {}
    return (
      value95 &&
        (el5.appendChild(box6),
        (el4.__mediaClipSourceSwitchHold = box6),
        (this._videoSourceSwitchHold = box6)),
      value95
    );
  }
  ['_clearVideoSourceSwitchHold'](el6 = this._videoPreview) {
    const el7 = el6?.__mediaClipSourceSwitchHold || this._videoSourceSwitchHold || null;
    (el7?.remove?.(),
      el6 &&
        el7 &&
        el6.__mediaClipSourceSwitchHold === el7 &&
        delete el6.__mediaClipSourceSwitchHold,
      el7 && this._videoSourceSwitchHold === el7 && (this._videoSourceSwitchHold = null),
      el6?.classList?.remove('is-source-switching'));
  }
  ['_cancelPendingVideoSourceSeek'](el8 = this._videoPreview, value96 = {}) {
    if (!el8) return;
    const value97 = el8.__mediaClipSourceSeekFinish;
    if (value97)
      try {
        el8.removeEventListener?.('seeked', value97);
      } catch {}
    const value98 = el8.__mediaClipSourceSeekFallbackTimer;
    if (value98)
      try {
        clearTimeout(value98);
      } catch {}
    (delete el8.__mediaClipWaitingSourceSeek,
      delete el8.__mediaClipSourceSeekFinish,
      delete el8.__mediaClipSourceSeekFallbackTimer,
      delete el8.__mediaClipSourceSeekTargetSec,
      delete el8.__mediaClipSourceSeekToken);
    if (value96.clearHold !== false) this._clearVideoSourceSwitchHold(el8);
  }
  ['_waitForPendingVideoSourceSeek'](el9 = this._videoPreview, value99 = 0) {
    if (!el9) return;
    const value100 = Math.max(0, toNumber(value99, 0));
    el9.__mediaClipSourceSeekTargetSec = value100;
    if (value100 <= PREVIEW_SCRUB_SEEK_EPSILON_SEC) {
      this._finishPendingVideoSourceSeek(el9);
      return;
    }
    if (!el9.__mediaClipWaitingSourceSeek) {
      el9.__mediaClipWaitingSourceSeek = true;
      const value101 = () => this._finishPendingVideoSourceSeek(el9);
      ((el9.__mediaClipSourceSeekFinish = value101),
        el9.addEventListener?.('seeked', value101, { once: true }));
    }
    const value102 = el9.__mediaClipSourceSeekFallbackTimer;
    if (value102)
      try {
        clearTimeout(value102);
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
    const value103 = el10.__mediaClipSourceSeekFinish;
    if (value103)
      try {
        el10.removeEventListener?.('seeked', value103);
      } catch {}
    const value104 = el10.__mediaClipSourceSeekFallbackTimer;
    if (value104)
      try {
        clearTimeout(value104);
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
      value105 = enabled12 && this._mediaClip.expanded === true;
    value105
      ? this._claimExpandedEditor()
      : ((this._materialMenu = null), this._releaseExpandedEditor(), this._disposePreviewMedia());
    (this.el.replaceChildren(),
      this.el.classList.toggle('is-picking', this._isPicking()),
      this.el.classList.toggle('is-expanded', value105),
      this._syncHostPresentation(value105),
      this._syncDocumentExitListener(value105),
      this._syncMaterialMenuDismissListener(value105 && !!this._materialMenu),
      this._syncDocumentKeyListener(value105),
      this._syncDeleteMaterialShortcutListener(value105));
    if (!enabled12) {
      this.el.appendChild(this._renderEmpty());
      return;
    }
    (value105
      ? this.el.append(this._renderCompact(), this._renderPreviewPanel())
      : this.el.appendChild(this._renderCompact()),
      value105 && this._materialMenu && this._renderMaterialMenuPortal(),
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
          ((el13.parentNode = el12),
          (el11.parentNode = null),
          el12.children.splice(count3, 1, el13));
      }
    }
    const value106 = !!(this._mediaClip.tracks?.video || this._mediaClip.tracks?.audio),
      value107 = value106 && this._mediaClip.expanded === true;
    return (
      this._syncDocumentExitListener(value107),
      this._syncMaterialMenuDismissListener(value107 && !!this._materialMenu),
      this._syncDocumentKeyListener(value107),
      this._syncDeleteMaterialShortcutListener(value107),
      value107 && this._materialMenu && this._renderMaterialMenuPortal(),
      true
    );
  }
  ['_syncHostPresentation'](value108) {
    const run2 = () => {
      const el14 = this.el?.closest?.('.v2-node-component') || this.el?.parentElement;
      el14?.style && (el14.style.overflow = 'visible');
      const el15 = document.getElementById(this.id);
      if (!el15?.style) return;
      (el15.classList.toggle('media-clip-expanded-host', value108 === true),
        syncRendererNodePresentationZIndex(
          el15,
          value108 === true
            ? MEDIA_CLIP_EXPANDED_HOST_Z_INDEX
            : el15.classList.contains('selected') ||
                el15.classList.contains('v2-selected')
              ? '100'
              : '10',
        ));
    };
    (run2(),
      !this.el?.parentElement &&
        typeof requestAnimationFrame === 'function' &&
        requestAnimationFrame(run2));
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
      const value109 = document.getElementById(this.id);
      if (this.el?.contains?.(event2.target)) return;
      if (this._materialMenuEl?.contains?.(event2.target)) return;
      if (value109?.contains?.(event2.target)) {
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
    (this._materialMenuEl?.parentNode?.removeChild?.(this._materialMenuEl),
      (this._materialMenuEl = null));
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
  ['_materialMenuLocalPoint'](value110, value111, el16 = this._materialMenuHost()) {
    const box8 = el16?.getBoundingClientRect?.() || {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      },
      layoutWidthPx = readLayoutWidthPx(el16, box8.width || 1),
      toNumber16 =
        toNumber(el16?.offsetHeight, 0) ||
        parseFloat(el16?.style?.getPropertyValue?.('height')) ||
        box8.height ||
        1,
      value112 = box8.width > 0 && layoutWidthPx > 0 ? box8.width / layoutWidthPx : 1,
      value113 = box8.height > 0 && toNumber16 > 0 ? box8.height / toNumber16 : value112;
    return {
      x: (toNumber(value110, box8.left) - toNumber(box8.left, 0)) / (value112 || 1),
      y: (toNumber(value111, box8.top) - toNumber(box8.top, 0)) / (value113 || 1),
    };
  }
  ['_renderMaterialMenuPortal']() {
    if (typeof document === 'undefined' || !this._materialMenu) return;
    const el17 = this._materialMenuHost();
    if (!el17) return;
    const value114 = this._renderMaterialMenu();
    ((this._materialMenuEl = value114),
      el17.appendChild(value114),
      this._positionMaterialMenu(value114, el17));
  }
  ['_positionMaterialMenu'](el18, el19 = this._materialMenuHost()) {
    if (!el18) return;
    const box9 = this._materialMenu || {},
      value115 = 8,
      toNumber17 = toNumber(box9.x ?? box9.left, value115),
      toNumber18 = toNumber(box9.y ?? box9.top, value115),
      box10 = el19?.getBoundingClientRect?.() || {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      },
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
      value116 =
        count6 > 0 && count4 > 0
          ? Math.max(value115, (count6 - box10.left) / count4 - toNumber20 - value115)
          : toNumber17,
      value117 =
        count7 > 0 && count5 > 0
          ? Math.max(value115, (count7 - box10.top) / count5 - toNumber21 - value115)
          : toNumber18;
    ((el18.style.left = Math.min(value116, Math.max(value115, toNumber17)) + 'px'),
      (el18.style.top = Math.min(value117, Math.max(value115, toNumber18)) + 'px'));
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
    ((this._onDocumentKeyDown = (value118) => this._handleDocumentKeyDown(value118)),
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
    ((this._onDeleteMaterialShortcut = (value119) => {
      const text4 = normalizeText(value119?.detail?.nodeId);
      if (text4 && text4 !== this.id) return;
      if (this._mediaClip.expanded !== true) return;
      this._deleteActiveMaterialFromShortcut();
    }),
      window.addEventListener(MEDIA_CLIP_DELETE_MATERIAL_EVENT, this._onDeleteMaterialShortcut));
  }
  ['_deleteActiveMaterialFromShortcut']() {
    const value120 =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    if (value120 - this._lastDeleteMaterialShortcutAt < 80) return;
    ((this._lastDeleteMaterialShortcutAt = value120), this._deleteActiveMaterial());
  }
  ['_handleDocumentKeyDown'](event4) {
    if (this._mediaClip.expanded !== true) return;
    if (this._materialMenuEl) {
      const list7 = Array.from(
          this._materialMenuEl.querySelectorAll?.('[data-shortcut-action]') || [],
        ),
        shortcutActionForEvent = resolveShortcutActionForEvent(
          event4,
          list7.map((el21) => el21.dataset.shortcutAction),
        );
      if (shortcutActionForEvent && event4?.repeat !== true) {
        const value121 = list7.find(
          (el22) => el22.dataset.shortcutAction === shortcutActionForEvent,
        );
        if (typeof value121?.__contextMenuShortcutActivate === 'function') {
          (event4.preventDefault?.(),
            event4.stopPropagation?.(),
            event4.stopImmediatePropagation?.(),
            value121.__contextMenuShortcutActivate(event4));
          return;
        }
      }
    }
    if (this._isEditableEventTarget(event4?.target)) return;
    if (event4?.key === 'Escape' && this._materialMenu) {
      (event4.preventDefault?.(), event4.stopPropagation?.(), this._closeMaterialMenu());
      return;
    }
    if (event4?.key === ' ' || event4?.code === 'Space') {
      (event4.preventDefault?.(),
        event4.stopPropagation?.(),
        event4.stopImmediatePropagation?.());
      !event4?.repeat && void this._togglePreviewPlayback();
      return;
    }
  }
  ['_renderPickButton']() {
    const el23 = document.createElement('button');
    ((el23.type = 'button'),
      (el23.className = 'media-clip-pick-btn'),
      el23.classList.toggle('is-active', this._isPicking()));
    const mediaClipText2 = mediaClipText('pick.addByConnection');
    return (
      (el23.title = mediaClipText2),
      el23.setAttribute('aria-label', mediaClipText2),
      el23.appendChild(createConnectCursorIcon()),
      el23.addEventListener('click', (value122) => this._togglePickConnect(value122)),
      el23
    );
  }
  ['_renderEmpty']() {
    const el24 = document.createElement('div');
    el24.className = 'media-clip-empty';
    const el25 = document.createElement('div');
    el25.className = 'media-clip-empty-body';
    const el26 = document.createElement('button');
    ((el26.type = 'button'),
      (el26.className = 'media-clip-pick-btn'),
      el26.classList.toggle('is-active', this._isPicking()));
    const mediaClipText3 = mediaClipText('pick.addByConnection');
    ((el26.title = mediaClipText3),
      el26.setAttribute('aria-label', mediaClipText3),
      el26.appendChild(createConnectCursorIcon()),
      el26.addEventListener('click', (value123) => this._togglePickConnect(value123)),
      el25.appendChild(el26));
    const el27 = document.createElement('div');
    ((el27.className = 'media-clip-empty-copy'),
      el27.classList.toggle('is-picking', this._isPicking()));
    const el28 = document.createElement('div');
    ((el28.textContent = this._isPicking()
      ? mediaClipText('empty.selectMaterial')
      : mediaClipText('empty.connectHint')),
      el27.appendChild(el28));
    if (this._isPicking()) {
      const el29 = document.createElement('div');
      ((el29.className = 'media-clip-esc'),
        (el29.textContent = mediaClipText('empty.exit')),
        el27.appendChild(el29));
    }
    return (el25.appendChild(el27), el24.appendChild(el25), el24);
  }
  ['_renderCompact']() {
    const enabled17 = this._mediaClip.expanded === true,
      el30 = document.createElement('div');
    ((el30.className = 'media-clip-compact'),
      el30.classList.toggle('is-editing', enabled17),
      el30.classList.toggle('is-menu-open', this._menuOpen === true));
    const value124 = document.createElement('div');
    value124.className = 'media-clip-compact-body';
    const el31 = document.createElement('div');
    ((el31.className = 'media-clip-timeline-scroll'),
      this._primeTimelineScroll(el31),
      el31.addEventListener('click', () => {
        if (this._mediaClip.expanded === true) return;
        this._setExpanded(true);
      }),
      this._bindTimelineScroll(el31));
    const el32 = document.createElement('div');
    ((el32.className = 'media-clip-compact-timeline'),
      el32.classList.toggle('is-editing', enabled17));
    const timelineWidthPx = this._timelineTrackContentWidth({ compact: !enabled17 }),
      value125 = this._timelineAddSlotLeftPx(timelineWidthPx),
      value126 = this._timelineContentWidth(timelineWidthPx),
      value127 = this._timelineAxisWidthPx();
    (el32.style.setProperty('--media-clip-track-content-width', timelineWidthPx + 'px'),
      el32.style.setProperty('--media-clip-timeline-content-width', value126 + 'px'),
      el32.style.setProperty('--media-clip-add-left', value125 + 'px'),
      el32.style.setProperty('--media-clip-track-axis-width', value127 + 'px'));
    const value128 = this._audioTimelineClips(this._mediaClip.tracks.audio),
      value129 = this._audioLaneCount(value128);
    (this._setAudioLaneCountStyle(el32, value129),
      el32.appendChild(
        this._renderRuler(this._primaryDuration(), { compact: !enabled17, timelineWidthPx: timelineWidthPx }),
      ));
    const el33 = document.createElement('div');
    ((el33.className = 'media-clip-timeline-lane'),
      el33.classList.toggle('has-audio-track', !!this._mediaClip.tracks.audio),
      this._setAudioLaneCountStyle(el33, value129),
      el33.addEventListener('pointerleave', () => {
        if (this._timelineDrag()) return;
        (this._clearTimelineHoverState(el33), this._restoreTimelinePlayheads());
      }));
    const el34 = document.createElement('div');
    ((el34.className = 'media-clip-timeline-tracks'),
      el34.classList.toggle('has-audio-track', !!this._mediaClip.tracks.audio),
      this._setAudioLaneCountStyle(el34, value129));
    this._mediaClip.tracks.audio &&
      el33.appendChild(this._renderAudioLaneControls(value128, value129));
    this._mediaClip.tracks.video &&
      el34.appendChild(
        this._renderTrack('video', { compact: !enabled17, timelineWidthPx: timelineWidthPx }),
      );
    this._mediaClip.tracks.audio &&
      el34.appendChild(
        this._renderTrack('audio', { compact: !enabled17, timelineWidthPx: timelineWidthPx }),
      );
    const value130 = this._renderShortcutCropButton(),
      el35 = this._renderPickButton();
    el35.classList.add('media-clip-add-btn');
    const mediaClipText4 = mediaClipText('pick.continueAdd');
    return (
      (el35.title = mediaClipText4),
      el35.setAttribute('aria-label', mediaClipText4),
      el33.append(el34, el35),
      el32.appendChild(el33),
      enabled17 &&
        (this._bindTimelinePointerCursors(el32, el34),
        el32.appendChild(this._renderTimelineCursors(this._primaryDuration()))),
      el31.appendChild(el32),
      this._primeTimelineScroll(el31),
      value124.append(el31),
      el30.append(value124, value130),
      enabled17 &&
        (el30.appendChild(this._renderTimelineHintCarousel()),
        el30.appendChild(this._renderTimelineTools())),
      el30
    );
  }
  ['_renderAudioLaneControls'](list8 = [], value131 = 1) {
    const el36 = document.createElement('div');
    ((el36.className = 'media-clip-audio-lane-controls'),
      (el36.dataset.uiStop = 'true'),
      this._setAudioLaneCountStyle(el36, value131));
    for (let value132 = 0; value132 < value131; value132 += 1) {
      const list9 = this._audioClipsForLane(value132, list8),
        value133 = this._isAudioLaneMuted(value132, list8),
        el37 = document.createElement('button');
      ((el37.type = 'button'),
        (el37.className = 'media-clip-audio-lane-mute-btn'),
        el37.classList.toggle('is-muted', value133),
        (el37.disabled = list9.length === 0),
        (el37.dataset.audioLaneIndex = String(value132)),
        (el37.dataset.uiStop = 'true'),
        (el37.title = mediaClipText(value133 ? 'audioLane.unmute' : 'audioLane.mute')),
        el37.setAttribute('aria-label', el37.title),
        el37.style.setProperty(
          '--media-clip-audio-lane-top',
          value132 * (MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + MEDIA_CLIP_AUDIO_LANE_GAP_PX) + 'px',
        ));
      const el38 = createMediaClipSvgElement('svg');
      (el38.setAttribute('viewBox', '0 0 24 24'),
        el38.setAttribute('width', '16'),
        el38.setAttribute('height', '16'),
        el38.setAttribute('aria-hidden', 'true'));
      const el39 = createMediaClipSvgElement('path');
      (el39.setAttribute('d', 'M4 9v6h4l5 4V5L8 9H4z'),
        el39.setAttribute('fill', 'currentColor'),
        el38.appendChild(el39));
      const el40 = createMediaClipSvgElement('path');
      (el40.setAttribute(
        'd',
        value133 ? 'M16 9l5 5m0-5l-5 5' : 'M16 8c1.3 1.4 1.3 4.6 0 6M18.5 6c2.4 2.6 2.4 8.4 0 11',
      ),
        el40.setAttribute('fill', 'none'),
        el40.setAttribute('stroke', 'currentColor'),
        el40.setAttribute('stroke-width', '2'),
        el40.setAttribute('stroke-linecap', 'round'),
        el38.appendChild(el40),
        el37.appendChild(el38),
        el37.addEventListener('pointerdown', stopPointer),
        el37.addEventListener('click', (value134) => {
          (stopPointer(value134), this._toggleAudioLaneMuted(value132));
        }),
        el36.appendChild(el37));
    }
    return el36;
  }
  ['_syncAudioLaneControls'](
    value135 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
    value136 = this._audioLaneCount(value135),
  ) {
    const enabled18 = this.el?.querySelector?.('.media-clip-audio-lane-controls');
    if (!enabled18) return;
    const el41 = this._renderAudioLaneControls(value135, value136);
    (this._setAudioLaneCountStyle(enabled18, value136),
      enabled18.replaceChildren?.(...Array.from(el41.children || [])));
  }
  ['_primeTimelineScroll'](value137) {
    return primeTimelineScroll(this, value137);
  }
  ['_bindTimelineScroll'](value138) {
    return bindTimelineScroll(this, value138);
  }
  ['_shouldLockTimelineWheelScroll'](value139, value140 = {}) {
    return shouldLockTimelineWheelScroll(this, value139, value140);
  }
  ['_timelineMaterialRangeSec']() {
    return timelineMaterialRangeSec(this);
  }
  ['_timelineMaterialScrollBounds'](value141, value142 = {}) {
    return timelineMaterialScrollBounds(this, value141, value142);
  }
  ['_clampTimelineScrollLeft'](value143, value144 = 0, value145 = {}) {
    return clampTimelineScrollLeft(this, value143, value144, value145);
  }
  ['_handleTimelineZoomWheel'](value146, value147) {
    return handleTimelineZoomWheel(this, value146, value147);
  }
  ['_syncTimelineScrollFade'](value148) {
    return syncTimelineScrollFade(this, value148);
  }
  ['_timelineDragScrollDeltaPx'](value149 = this._timelineDrag()) {
    return timelineDragScrollDeltaPx(this, value149);
  }
  ['_timelineDragDeltaPx'](value150 = this._timelineDrag(), value151 = {}) {
    return timelineDragDeltaPx(this, value150, value151);
  }
  ['_timelineDragAutoScrollVelocity'](value152, value153) {
    return timelineDragAutoScrollVelocity(value152, value153);
  }
  ['_scheduleTimelineDragAutoScroll'](value154 = this._timelineDrag()) {
    return scheduleTimelineDragAutoScroll(this, value154);
  }
  ['_stopTimelineDragAutoScroll']() {
    return stopTimelineDragAutoScroll(this);
  }
  ['_runTimelineDragAutoScroll'](value155) {
    return runTimelineDragAutoScroll(this, value155);
  }
  ['_persistTimelineDragScroll'](value156 = this._timelineDrag()) {
    return persistTimelineDragScroll(this, value156);
  }
  ['_renderShortcutCropButton']() {
    const el42 = makeButton(
      'media-clip-tool-crop media-clip-shortcut-crop',
      mediaClipText('tools.splitMaterial'),
      '',
    );
    return (
      (el42.tabIndex = -1),
      el42.setAttribute('aria-hidden', 'true'),
      el42.addEventListener('click', (value157) => {
        (stopPointer(value157), this._splitActiveMaterial());
      }),
      el42
    );
  }
  ['_setDownloadMenuOpen'](value158) {
    this._menuOpen = value158 === true;
    this._materialMenu &&
      ((this._materialMenu = null),
      this._removeMaterialMenuPortal(),
      this._syncMaterialMenuDismissListener(false));
    const el43 = this.el?.querySelector?.('.media-clip-compact');
    el43?.classList?.toggle('is-menu-open', this._menuOpen);
    const el44 = this.el?.querySelector?.('.media-clip-compact-tools');
    if (!el44) return;
    const el45 = el44.querySelector?.('.media-clip-tool-download');
    (el45?.classList?.toggle('is-active', this._menuOpen),
      el44.querySelectorAll?.('.media-clip-menu')?.forEach((el46) =>
        el46.remove?.(),
      ),
      this._menuOpen && el44.appendChild(this._renderDownloadMenu()));
  }
  ['_renderTimelineTools']() {
    const el47 = document.createElement('div');
    el47.className = 'media-clip-tools media-clip-compact-tools';
    const el48 = iconButton(
        'media-clip-tool media-clip-tool-crop',
        mediaClipText('tools.splitMaterial'),
        '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
      ),
      el49 = document.createElement('span');
    ((el49.className = 'media-clip-tool-kbd'),
      (el49.textContent = this._getShortcutLabel('clip-tool-crop', 'C')),
      el48.appendChild(el49),
      el48.addEventListener('click', (value159) => {
        (stopPointer(value159), this._splitActiveMaterial());
      }));
    const el50 = iconButton(
      'media-clip-tool media-clip-tool-download',
      mediaClipText('tools.export'),
      '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    );
    (el50.classList.toggle('is-active', this._menuOpen),
      el50.addEventListener('click', (value160) => {
        (stopPointer(value160), this._setDownloadMenuOpen(!this._menuOpen));
      }),
      el47.append(el48, el50));
    if (this._menuOpen) el47.appendChild(this._renderDownloadMenu());
    return el47;
  }
  ['_renderTimelineHintCarousel']() {
    const el51 = document.createElement('div');
    el51.className = 'media-clip-helper-row';
    const el52 = document.createElement('div');
    el52.className = 'media-clip-helper-left';
    const list10 = [
      [
        ['kbd', 'Space'],
        ['text', mediaClipText('hints.playPause')],
      ],
      [
        ['kbd', this._getShortcutLabel('clip-tool-crop', 'C')],
        ['text', mediaClipText('hints.splitAtPlayhead')],
      ],
      [
        ['kbd', this._getShortcutLabel('delete', 'Delete')],
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
      el51.style.setProperty('--media-clip-helper-count', String(list10.length)),
      list10.forEach((list11, value161) => {
        const el53 = document.createElement('div');
        ((el53.className = 'media-clip-helper-msg'),
          el53.style.setProperty('--media-clip-helper-index', String(value161)),
          list11.forEach(([value162, value163]) => {
            const el54 = document.createElement('span');
            ((el54.className =
              value162 === 'kbd' ? 'media-clip-helper-kbd' : 'media-clip-helper-text'),
              (el54.textContent = value163),
              el53.appendChild(el54));
          }),
          el52.appendChild(el53));
      }),
      el51.appendChild(el52),
      el51
    );
  }
  ['_getShortcutLabel'](value164, value165 = '') {
    const list12 = getShortcuts()?.[value164]?.keys;
    return Array.isArray(list12) && list12.length > 0 ? list12.join('+') : value165;
  }
  ['_renderMaterialMenu']() {
    return renderMediaClipMaterialMenu(this);
  }
  ['_renderPreviewPanel']() {
    return renderPreviewPanel(this);
  }
  ['_previewLayoutTokens']() {
    return getPreviewLayoutTokens();
  }
  ['_previewVideoLayoutClasses'](options7 = {}) {
    return getPreviewVideoLayoutClasses(options7);
  }
  ['_syncPreviewPanelLayout'](value166, value167) {
    return syncPreviewPanelLayout(this, value166, value167);
  }
  ['_applyPreviewVideoLayout'](value168, value169 = {}) {
    return applyPreviewVideoLayout(this, value168, value169);
  }
  ['_syncPreviewVideoLayoutFromElement'](value170 = this._videoPreview) {
    return syncPreviewVideoLayoutFromElement(this, value170);
  }
  ['_showPreviewImage'](options8 = {}, value171 = '') {
    return showPreviewImage(this, options8, value171);
  }
  ['_clearPreviewVideoFallback']() {
    return clearPreviewVideoFallback(this);
  }
  ['_showPreviewVideo'](options9 = {}) {
    return showPreviewVideo(this, options9);
  }
  ['_ensurePreviewVideoElement']() {
    return ensurePreviewVideoElement(this);
  }
  ['_ensurePreviewImageElement']() {
    return ensurePreviewImageElement(this);
  }
  ['_ensurePreviewAudioElement']() {
    return ensurePreviewAudioElement(this);
  }
  ['_renderPreviewControls']() {
    return renderPreviewControls(this);
  }
  ['_renderPreview']() {
    return renderPreview(this);
  }
  ['_renderVideoFallback'](value172 = '') {
    return renderVideoFallback(value172);
  }
  ['_estimateTimelineWidth'](options10 = {}) {
    const toNumber22 = toNumber(options10.timelineWidthPx, 0);
    if (toNumber22 > 0) return Math.max(240, toNumber22);
    const toNumber23 = toNumber(this.nodeData?.width, MEDIA_CLIP_COMPACT_SIZE.width),
      value173 = options10.compact === true ? 0x88 : 116;
    return Math.max(240, toNumber23 - value173);
  }
  ['_timelineViewportWidth']() {
    const toNumber24 = toNumber(this.nodeData?.width, MEDIA_CLIP_COMPACT_SIZE.width);
    return Math.max(240, toNumber24 - 64);
  }
  ['_timelineZoom'](zoom = {}) {
    return normalizeMediaClipTimelineView({
      zoom:
        zoom.timelineZoom ??
        this._timelineView?.zoom ??
        this._mediaClip?.timelineView?.zoom,
    }).zoom;
  }
  ['_timelineTrackContentWidth'](options11 = {}) {
    const timelineZoom = this._timelineZoom(options11),
      durationSec = this._primaryDuration({ timelineZoom: timelineZoom });
    return getMediaClipTimelineTrackWidthPx({
      durationSec: durationSec,
      viewportWidthPx: this._timelineViewportWidth(),
      zoom: timelineZoom,
    });
  }
  ['_timelineAxisWidthPx']() {
    return this._mediaClip.tracks?.audio ? MEDIA_CLIP_TIMELINE_AXIS_WIDTH_PX : 0;
  }
  ['_timelineMaterialEndSec']() {
    const value174 = this._mediaClip.tracks?.video,
      count8 = this._videoTimelineMaterialEnd(value174);
    if (count8 > 0) return count8;
    const value175 = this._mediaClip.tracks?.audio;
    if (value175) return this._audioTimelineMaterialEnd(value175);
    return 0;
  }
  ['_timelineAddSlotLeftPx'](trackWidthPx = this._timelineTrackContentWidth(), displayDurationSec = {}) {
    return getMediaClipTimelineAddSlotLeftPx({
      trackWidthPx: trackWidthPx,
      displayDurationSec: displayDurationSec.displayDurationSec ?? this._primaryDuration(),
      materialEndSec: displayDurationSec.materialEndSec ?? this._timelineMaterialEndSec(),
    });
  }
  ['_timelineContentWidth'](trackWidthPx2 = this._timelineTrackContentWidth(), displayDurationSec2 = {}) {
    return (
      this._timelineAxisWidthPx() +
      getMediaClipTimelineContentWidthPx({
        trackWidthPx: trackWidthPx2,
        displayDurationSec: displayDurationSec2.displayDurationSec ?? this._primaryDuration(),
        materialEndSec: displayDurationSec2.materialEndSec ?? this._timelineMaterialEndSec(),
      })
    );
  }
  ['_syncTimelineAddSlotPosition'](value176 = this._timelineTrackContentWidth(), value177 = {}) {
    const value178 = Math.max(240, Math.ceil(toNumber(value176, 0))),
      value179 = this._timelineAddSlotLeftPx(value178, value177),
      value180 = this._timelineContentWidth(value178, value177),
      el55 = this.el?.querySelector?.('.media-clip-compact-timeline');
    if (!el55) return;
    (el55.style.setProperty('--media-clip-add-left', value179 + 'px'),
      el55.style.setProperty('--media-clip-timeline-content-width', value180 + 'px'),
      el55.style.setProperty(
        '--media-clip-track-axis-width',
        this._timelineAxisWidthPx() + 'px',
      ));
    const el56 = el55.querySelector?.('.media-clip-add-btn');
    if (el56) el56.style.left = this._timelineAxisWidthPx() + value179 + 'px';
  }
  ['_syncTimelineAddSlotForRow'](value181, args10 = {}) {
    const value182 = Math.max(240, readLayoutWidthPx(value181, this._timelineTrackContentWidth()));
    this._syncTimelineCursorLayerForRow(value181);
    const value183 = args10.displayDurationSec ?? args10.durationSec;
    if (Number.isFinite(toNumber(value183, NaN))) {
      const durationSec2 = getMediaClipTimelineDisplayDuration(value183);
      (this._setTimelineRowDuration(value181, durationSec2),
        this._syncTimelineRulerTicks(value182, { ...args10, durationSec: durationSec2 }));
    }
    this._syncTimelineAddSlotPosition(value182, args10);
  }
  ['_syncTimelineContentWidth'](value184 = this._timelineTrackContentWidth(), value185 = {}) {
    const value186 = Math.max(240, Math.ceil(toNumber(value184, 0))),
      el57 = this.el?.querySelector?.('.media-clip-compact-timeline');
    if (!el57) return;
    (el57.style.setProperty('--media-clip-track-content-width', value186 + 'px'),
      el57.style.setProperty(
        '--media-clip-track-axis-width',
        this._timelineAxisWidthPx() + 'px',
      ),
      this._syncTimelineAddSlotPosition(value186, value185),
      this.el?.querySelectorAll?.('.media-clip-track, .media-clip-ruler')?.forEach((el58) => {
        el58.style.width = value186 + 'px';
      }),
      this._syncTimelineRulerTicks(value186, value185),
      this._syncTimelineScrollFade(this.el?.querySelector?.('.media-clip-timeline-scroll')));
  }
  ['_timelineRulerTicks'](value187, value188, value189 = {}) {
    const mediaClipTimelineDisplayDuration = getMediaClipTimelineDisplayDuration(value187);
    return buildMediaClipTimelineTicks(mediaClipTimelineDisplayDuration, value188);
  }
  ['_populateTimelineRuler'](el59, value190, value191, value192 = {}) {
    if (!el59) return;
    const mediaClipTimelineDisplayDuration2 = getMediaClipTimelineDisplayDuration(value190),
      list13 = this._timelineRulerTicks(mediaClipTimelineDisplayDuration2, value191, value192),
      value193 = mediaClipTimelineDisplayDuration2 + ':' + list13.join(',');
    if (el59.dataset?.tickSignature === value193) return;
    if (el59.dataset) el59.dataset.tickSignature = value193;
    (typeof el59.replaceChildren === 'function'
      ? el59.replaceChildren()
      : (el59.textContent = ''),
      list13.forEach((value194) => {
        const el60 = document.createElement('span');
        ((el60.className = 'media-clip-ruler-tick'),
          (el60.textContent = formatTime(value194)));
        const mediaClipTimelinePercent = getMediaClipTimelinePercent(value194, mediaClipTimelineDisplayDuration2);
        ((el60.style.left = mediaClipTimelinePercent + '%'), el59.appendChild(el60));
      }));
  }
  ['_syncTimelineRulerTicks'](value195 = this._timelineTrackContentWidth(), value196 = {}) {
    const enabled19 = this.el?.querySelector?.('.media-clip-ruler');
    if (!enabled19) return;
    const value197 =
      value196.durationSec ?? value196.displayDurationSec ?? this._primaryDuration();
    this._populateTimelineRuler(enabled19, value197, value195, value196);
  }
  ['_renderRuler'](value198, value199 = {}) {
    const mediaClipTimelineDisplayDuration3 = getMediaClipTimelineDisplayDuration(value198),
      value200 = this._estimateTimelineWidth(value199),
      value201 = document.createElement('div');
    return (
      (value201.className = 'media-clip-ruler'),
      this._populateTimelineRuler(value201, mediaClipTimelineDisplayDuration3, value200, value199),
      value201
    );
  }
  ['_renderTimelineCursors'](durationSec3 = this._primaryDuration()) {
    const el61 = document.createElement('div');
    ((el61.className = 'media-clip-timeline-cursors'),
      el61.setAttribute('aria-hidden', 'true'));
    const value202 = document.createElement('div');
    ((value202.className =
      'media-clip-playhead media-clip-timeline-cursor media-clip-timeline-cursor-fixed'),
      this._applyTimelinePlayheadModel(
        value202,
        getMediaClipTimelinePlayheadModel({ playheadSec: this._playheadSec, durationSec: durationSec3 }),
      ));
    const el62 = document.createElement('div');
    return (
      (el62.className =
        'media-clip-hover-playhead media-clip-timeline-cursor media-clip-timeline-cursor-hover'),
      (el62.hidden = true),
      el61.append(value202, el62),
      el61
    );
  }
  ['_timelineCursorKind']() {
    const text5 = normalizeText(this._mediaClip.activeTrack);
    if (text5 && this._mediaClip.tracks?.[text5]) return text5;
    if (this._mediaClip.tracks?.video) return 'video';
    if (this._mediaClip.tracks?.audio) return 'audio';
    return '';
  }
  ['_timelineDurationForKind'](value203 = this._timelineCursorKind(), value204 = {}) {
    const enabled20 = this._mediaClip.tracks?.[value203];
    if (!enabled20) return this._primaryDuration(value204);
    if (value203 === 'video') return this._videoTimelineDuration(enabled20, null, value204);
    if (value203 === 'audio') {
      const value205 = this._mediaClip.tracks?.video;
      return value205
        ? this._videoTimelineDuration(value205, null, value204)
        : this._audioTimelineDuration(enabled20, null, value204);
    }
    return getTrackDuration(enabled20);
  }
  ['_timelinePointerContext'](el63, el64 = null) {
    const el65 = el64?.closest?.('.media-clip-track:not(.is-compact)'),
      value206 = el65?.classList?.contains('media-clip-track-audio')
        ? 'audio'
        : el65?.classList?.contains('media-clip-track-video')
          ? 'video'
          : '',
      kind = value206 || this._timelineCursorKind();
    if (!kind) return null;
    const row = value206
      ? el65
      : el63?.querySelector?.('.media-clip-track-' + kind + ':not(.is-compact)');
    if (!row) return null;
    const value207 = this._timelineDurationForKind(kind);
    return { kind: kind, row: row, duration: this._timelineRowDuration(row, value207) };
  }
  ['_isTimelineControlTarget'](el66) {
    return !!el66?.closest?.(
      '.media-clip-pick-btn, .media-clip-tool, .media-clip-menu, .media-clip-material-menu, .media-clip-menu-item, .media-clip-audio-lane-mute-btn, .media-clip-trim',
    );
  }
  ['_timelineEventSegment'](el67) {
    return el67?.closest?.('.media-clip-segment') || null;
  }
  ['_openMaterialMenu'](kind2, value208, event5) {
    if (!kind2 || !event5) return;
    (event5.preventDefault?.(), event5.stopPropagation?.());
    const value209 = this._materialMenuHost(),
      x = this._materialMenuLocalPoint(event5.clientX, event5.clientY, value209);
    ((this._menuOpen = false),
      (this._materialMenu = {
        kind: kind2,
        clipIndex: Math.max(0, Math.trunc(toNumber(value208, 0))),
        x: x.x,
        y: x.y,
      }),
      this._syncMaterialMenuDismissListener(true),
      this._removeMaterialMenuPortal(),
      this._renderMaterialMenuPortal());
  }
  ['_bindTimelinePointerCursors'](el68, enabled21) {
    if (!el68 || !enabled21) return;
    (el68.addEventListener('pointermove', (event6) => {
      if (this._timelineDrag() || this._isTimelineControlTarget(event6.target)) return;
      const enabled22 = this._timelinePointerContext(enabled21, event6.target);
      if (!enabled22) return;
      const playheadSec = this._timelineSecFromPointerEvent(
        enabled22.row,
        event6,
        enabled22.duration,
      );
      this._timelineEventSegment(event6.target)
        ? this._previewTrackPlayhead(enabled22.row, enabled22.kind, playheadSec, enabled22.duration)
        : this._updateTimelineHoverPlayheadVisual(enabled22.row, enabled22.duration, {
            playheadSec: playheadSec,
          });
    }),
      el68.addEventListener('pointerdown', (event7) => {
        if (
          event7.button !== 0 ||
          this._timelineDrag() ||
          this._isTimelineControlTarget(event7.target)
        )
          return;
        if (this._timelineEventSegment(event7.target)) return;
        const enabled23 = this._timelinePointerContext(enabled21, event7.target);
        if (!enabled23) return;
        this._setTimelinePlayheadFromPointer(
          enabled23.row,
          enabled23.kind,
          event7,
          enabled23.duration,
          { updateActiveTrack: false, updateClipSelection: false, selectClip: false, syncPreview: false },
        );
      }),
      el68.addEventListener('pointerleave', () => {
        if (this._timelineDrag()) return;
        (this._hideTimelineHoverPlayhead(el68), this._restoreTimelinePlayheads());
      }),
      el68.addEventListener('click', (event8) => {
        if (this._timelineDrag() || this._isTimelineControlTarget(event8.target)) return;
        if (!this._timelineEventSegment(event8.target)) return;
        const enabled24 = this._timelinePointerContext(enabled21, event8.target);
        if (!enabled24) return;
        const value210 = this._timelineSecFromPointerEvent(
            enabled24.row,
            event8,
            enabled24.duration,
          ),
          forceRender =
            enabled24.kind === 'video'
              ? this._setActiveClipIndex(this._clipIndexAtTimelineSec(value210))
              : enabled24.kind === 'audio'
                ? this._setActiveAudioClipIndex(this._audioClipIndexAtTimelineSec(value210))
                : false;
        if (enabled24.kind === 'audio') this._selectAudioClipIndex(this._activeAudioClipIndex);
        this._setActiveTrack(enabled24.kind, value210, { forceRender: forceRender });
      }));
  }
  ['_videoSources']() {
    const list14 = Array.isArray(this._sources?.videos) ? this._sources.videos : [];
    if (list14.length) return list14;
    return this._sources?.video ? [this._sources.video] : [];
  }
  ['_firstVideoSource']() {
    return (
      this._videoSources().find((value211) => getMediaClipInputKind(value211) === 'video') || null
    );
  }
  ['_videoClipSource'](options12 = {}, value212 = 0) {
    const list15 = this._videoSources(),
      text6 = normalizeText(options12.sourceId),
      text7 = normalizeText(options12.sourceKey);
    return (
      list15.find((value213) => normalizeText(value213?.id) === text6) ||
      list15.find(
        (value214) => normalizeText(value214?.__mediaClipEdgeId) === normalizeText(options12.id),
      ) ||
      list15.find((value215) => normalizeText(resolveMediaClipSourceKey(value215)) === text7) ||
      list15[value212] ||
      this._sources?.video ||
      null
    );
  }
  ['_audioSources']() {
    const list16 = Array.isArray(this._sources?.audios) ? this._sources.audios : [];
    if (list16.length) return list16;
    return this._sources?.audio ? [this._sources.audio] : [];
  }
  ['_audioClipSource'](options13 = {}, value216 = 0) {
    const list17 = this._audioSources(),
      text8 = normalizeText(options13.sourceId),
      text9 = normalizeText(options13.sourceKey);
    return (
      list17.find((value217) => normalizeText(value217?.id) === text8) ||
      list17.find(
        (value218) => normalizeText(value218?.__mediaClipEdgeId) === normalizeText(options13.id),
      ) ||
      list17.find((value219) => normalizeText(resolveMediaClipSourceKey(value219)) === text9) ||
      list17[value216] ||
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
    const list19 = Array.isArray(this._mediaClip?.audioClips)
      ? this._mediaClip.audioClips
      : [];
    if (list19.length) return list19;
    if (!sourceKey2) return [];
    const startSec = toNumber(sourceKey2.startSec, 0),
      endSec = Math.max(startSec, toNumber(sourceKey2.endSec, startSec));
    return [
      {
        id: 'audio:0',
        kind: 'audio',
        sourceKey: sourceKey2.sourceKey,
        startSec: startSec,
        endSec: endSec,
        durationSec: sourceKey2.durationSec,
        timelineStartSec: startSec,
        timelineEndSec: endSec,
        laneIndex: 0,
        muted: false,
        disabled: false,
      },
    ];
  }
  ['_timelineDurationForZoom'](value220 = 0, value221 = {}) {
    const mediaClipTimelineDisplayDuration4 = getMediaClipTimelineDisplayDuration(value220),
      value222 = Math.max(mediaClipTimelineDisplayDuration4, mediaClipTimelineDisplayDuration4 * TIMELINE_ZOOM_OUT_DISPLAY_MULTIPLIER);
    if (value222 <= mediaClipTimelineDisplayDuration4) return mediaClipTimelineDisplayDuration4;
    const count9 = this._timelineZoom(value221);
    if (count9 >= 1) return mediaClipTimelineDisplayDuration4;
    const value223 = Math.max(0.001, 1 - MEDIA_CLIP_TIMELINE_ZOOM_MIN),
      value224 = Math.max(0, Math.min(1, (1 - count9) / value223));
    return Math.round((mediaClipTimelineDisplayDuration4 + (value222 - mediaClipTimelineDisplayDuration4) * value224) * 1000) / 1000;
  }
  ['_videoTimelineBaseDuration'](value225 = null, value226 = null) {
    const list20 = Array.isArray(value226) ? value226 : this._videoTimelineClips(value225),
      value227 = this._videoTimelineMaterialEnd(value225, list20),
      count10 = list20.reduce(
        (value228, value229) => Math.min(value228, toNumber(value229?.timelineStartSec, 0)),
        0,
      ),
      value230 = count10 < 0 ? Math.max(0, value227 - count10) : value227;
    if (list20.length) {
      const value231 =
        list20.length === 1
          ? Math.max(
              toNumber(list20[0]?.durationSec, 0),
              toNumber(value225?.durationSec, 0),
            )
          : 0;
      return getMediaClipTimelineDisplayDuration(Math.max(value227, value230, value231));
    }
    return getMediaClipTimelineDisplayDuration(
      Math.max(toNumber(value225?.durationSec, 0), getTrackDuration(value225)),
    );
  }
  ['_videoTimelineDuration'](value232 = null, value233 = null, value234 = {}) {
    return this._timelineDurationForZoom(
      this._videoTimelineBaseDuration(value232, value233),
      value234,
    );
  }
  ['_timelineSegmentVisualDurationSec'](el69 = null, enabled25 = null) {
    if (!el69 || !enabled25) return 0;
    const count11 = Math.max(0, toNumber(enabled25.timelineStartSec, 0)),
      count12 = Math.max(count11, toNumber(enabled25.timelineEndSec, count11)),
      count13 = Math.max(0, count12 - count11),
      percentValue = parsePercentValue(el69?.style?.left),
      percentValue2 = parsePercentValue(el69?.style?.width),
      percentValue3 = parsePercentValue(el69?.style?.right),
      count14 =
        Number.isFinite(percentValue2) && percentValue2 > 0
          ? percentValue2
          : Number.isFinite(percentValue) && Number.isFinite(percentValue3)
            ? Math.max(0, 100 - percentValue - percentValue3)
            : NaN,
      list21 = [];
    return (
      Number.isFinite(percentValue) &&
        percentValue > 0 &&
        count11 > 0 &&
        list21.push(count11 / (percentValue / 100)),
      Number.isFinite(count14) &&
        count14 > 0 &&
        count13 > 0 &&
        list21.push(count13 / (count14 / 100)),
      Number.isFinite(percentValue) &&
        Number.isFinite(count14) &&
        percentValue + count14 > 0 &&
        count12 > 0 &&
        list21.push(count12 / ((percentValue + count14) / 100)),
      Math.max(
        0,
        ...list21.filter((count15) => Number.isFinite(count15) && count15 > 0),
      )
    );
  }
  ['_setTimelineRowDuration'](el70 = null, value235 = 0) {
    if (!el70?.dataset) return;
    el70.dataset.timelineDurationSec = String(getMediaClipTimelineDisplayDuration(value235));
  }
  ['_timelineRowDuration'](el71 = null, value236 = 0) {
    const toNumber25 = toNumber(el71?.dataset?.timelineDurationSec, NaN);
    if (Number.isFinite(toNumber25) && toNumber25 > 0)
      return getMediaClipTimelineDisplayDuration(toNumber25);
    return getMediaClipTimelineDisplayDuration(value236);
  }
  ['_resolveTimelineDragDuration'](
    value237,
    value238 = null,
    value239 = null,
    el72 = null,
    value240 = 0,
  ) {
    if (value237 === 'audio') {
      const value241 = Array.isArray(value239) ? value239 : this._audioTimelineClips(value238),
        value242 = this._timelineDurationForKind('audio'),
        value243 = el72?.closest?.('.media-clip-track') || null;
      return this._timelineRowDuration(value243, value242);
    }
    if (value237 !== 'video') return getTrackDuration(value238);
    const value244 = Array.isArray(value239) ? value239 : this._videoTimelineClips(value238),
      value245 = this._videoTimelineDuration(value238, value244),
      value246 = el72?.closest?.('.media-clip-track') || null;
    return this._timelineRowDuration(value246, value245);
  }
  ['_videoTimelineMaterialEnd'](value247 = null, value248 = null) {
    const list22 = Array.isArray(value248) ? value248 : this._videoTimelineClips(value247);
    if (list22.length)
      return list22.reduce(
        (value249, value250) => Math.max(value249, toNumber(value250.timelineEndSec, 0)),
        0,
      );
    return Math.max(0, toNumber(value247?.endSec || value247?.durationSec, 0));
  }
  ['_audioTimelineMaterialEnd'](value251 = null, value252 = null) {
    const list23 = Array.isArray(value252) ? value252 : this._audioTimelineClips(value251);
    if (list23.length)
      return list23.reduce(
        (value253, value254) => Math.max(value253, toNumber(value254.timelineEndSec, 0)),
        0,
      );
    return Math.max(0, toNumber(value251?.endSec || value251?.durationSec, 0));
  }
  ['_audioTimelineDuration'](value255 = null, value256 = null, value257 = {}) {
    const list24 = Array.isArray(value256) ? value256 : this._audioTimelineClips(value255),
      value258 = this._audioTimelineMaterialEnd(value255, list24),
      value259 =
        list24.length === 1
          ? Math.max(
              toNumber(list24[0]?.durationSec, 0),
              toNumber(value255?.durationSec, 0),
            )
          : toNumber(value255?.durationSec, 0);
    return this._timelineDurationForZoom(Math.max(value258, value259), value257);
  }
  ['_clampVideoClipIndex'](value260 = this._activeClipIndex) {
    const value261 = Math.max(
        0,
        this._videoTimelineClips(this._mediaClip.tracks?.video).length,
      ),
      value262 = Math.max(0, value261 - 1);
    return Math.max(0, Math.min(value262, Math.trunc(toNumber(value260, 0))));
  }
  ['_clampAudioClipIndex'](value263 = this._activeAudioClipIndex) {
    const value264 = Math.max(
        0,
        this._audioTimelineClips(this._mediaClip.tracks?.audio).length,
      ),
      value265 = Math.max(0, value264 - 1);
    return Math.max(0, Math.min(value265, Math.trunc(toNumber(value263, 0))));
  }
  ['_clipIndexAtTimelineSec'](
    value266,
    value267 = this._videoTimelineClips(this._mediaClip.tracks?.video),
  ) {
    const list25 = Array.isArray(value267) ? value267 : [];
    if (!list25.length) return 0;
    const toNumber26 = toNumber(value266, 0),
      count16 = list25.findIndex((value268, value269) => {
        const toNumber27 = toNumber(value268.timelineStartSec, 0),
          value270 = Math.max(toNumber27, toNumber(value268.timelineEndSec, toNumber27));
        return value269 === list25.length - 1
          ? toNumber26 >= toNumber27 && toNumber26 <= value270
          : toNumber26 >= toNumber27 && toNumber26 < value270;
      });
    if (count16 >= 0) return count16;
    let value271 = 0,
      value272 = Number.POSITIVE_INFINITY;
    return (
      list25.forEach((value273, value274) => {
        const toNumber28 = toNumber(value273.timelineStartSec, 0),
          value275 = Math.max(toNumber28, toNumber(value273.timelineEndSec, toNumber28)),
          value276 = toNumber26 < toNumber28 ? toNumber28 - toNumber26 : toNumber26 - value275;
        value276 < value272 && ((value271 = value274), (value272 = value276));
      }),
      value271
    );
  }
  ['_audioClipIndexAtTimelineSec'](
    value277,
    value278 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
  ) {
    const list26 = Array.isArray(value278) ? value278 : [];
    if (!list26.length) return 0;
    const toNumber29 = toNumber(value277, 0),
      count17 = list26.findIndex((value279, value280) => {
        const toNumber30 = toNumber(value279.timelineStartSec, 0),
          value281 = Math.max(toNumber30, toNumber(value279.timelineEndSec, toNumber30));
        return value280 === list26.length - 1
          ? toNumber29 >= toNumber30 && toNumber29 <= value281
          : toNumber29 >= toNumber30 && toNumber29 < value281;
      });
    if (count17 >= 0) return count17;
    let value282 = 0,
      value283 = Number.POSITIVE_INFINITY;
    return (
      list26.forEach((value284, value285) => {
        const toNumber31 = toNumber(value284.timelineStartSec, 0),
          value286 = Math.max(toNumber31, toNumber(value284.timelineEndSec, toNumber31)),
          value287 = toNumber29 < toNumber31 ? toNumber31 - toNumber29 : toNumber29 - value286;
        value287 < value283 && ((value282 = value285), (value283 = value287));
      }),
      value282
    );
  }
  ['_setActiveClipIndex'](value288 = this._activeClipIndex) {
    const value289 = this._clampVideoClipIndex(value288),
      value290 = value289 !== this._activeClipIndex;
    return ((this._activeClipIndex = value289), value290);
  }
  ['_setActiveAudioClipIndex'](value291 = this._activeAudioClipIndex) {
    const value292 = this._clampAudioClipIndex(value291),
      value293 = value292 !== this._activeAudioClipIndex;
    return ((this._activeAudioClipIndex = value292), value293);
  }
  ['_clampSelectedClipIndex'](value294 = this._selectedClipIndex) {
    const value295 = Math.max(
        0,
        this._videoTimelineClips(this._mediaClip.tracks?.video).length,
      ),
      count18 = Math.trunc(toNumber(value294, -1));
    return count18 >= 0 && count18 < value295 ? count18 : -1;
  }
  ['_clampSelectedAudioClipIndex'](value296 = this._selectedAudioClipIndex) {
    const value297 = Math.max(
        0,
        this._audioTimelineClips(this._mediaClip.tracks?.audio).length,
      ),
      count19 = Math.trunc(toNumber(value296, -1));
    return count19 >= 0 && count19 < value297 ? count19 : -1;
  }
  ['_selectClipIndex'](value298 = this._activeClipIndex) {
    const value299 = this._clampVideoClipIndex(value298),
      value300 = value299 !== this._selectedClipIndex;
    return ((this._selectedClipIndex = value299), value300);
  }
  ['_selectAudioClipIndex'](value301 = this._activeAudioClipIndex) {
    const value302 = this._clampAudioClipIndex(value301),
      value303 = value302 !== this._selectedAudioClipIndex;
    return ((this._selectedAudioClipIndex = value302), value303);
  }
  ['_patchAudioClipState'](value304 = this._activeAudioClipIndex, value305 = {}) {
    const value306 = Math.max(0, Math.trunc(toNumber(value304, 0))),
      value307 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
      enabled26 = value307[value306];
    if (!enabled26) return false;
    return (
      (this._mediaClip = patchMediaClipAudioClipState(this._mediaClip, value306, value305)),
      this._setActiveAudioClipIndex(value306),
      this._selectAudioClipIndex(value306),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }),
      commit(),
      this._refreshMediaClipTimelineInPlace(),
      true
    );
  }
  ['_toggleAudioClipMuted'](value308 = this._activeAudioClipIndex) {
    const value309 = Math.max(0, Math.trunc(toNumber(value308, 0))),
      muted = this._audioTimelineClips(this._mediaClip.tracks?.audio)[value309];
    if (!muted) return false;
    return this._patchAudioClipState(value309, { muted: muted.muted !== true });
  }
  ['_audioClipsForLane'](
    value310 = 0,
    value311 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
  ) {
    const mediaClipAudioLaneIndex = normalizeMediaClipAudioLaneIndex(value310),
      list27 = Array.isArray(value311) ? value311 : [];
    return list27.filter((value312) => this._audioClipLaneIndex(value312) === mediaClipAudioLaneIndex);
  }
  ['_isAudioLaneMuted'](
    value313 = 0,
    value314 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
  ) {
    const list28 = this._audioClipsForLane(value313, value314);
    return list28.length > 0 && list28.every((value315) => value315?.muted === true);
  }
  ['_toggleAudioLaneMuted'](value316 = 0) {
    const mediaClipAudioLaneIndex2 = normalizeMediaClipAudioLaneIndex(value316),
      value317 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
      list29 = this._audioClipsForLane(mediaClipAudioLaneIndex2, value317);
    if (!list29.length) return false;
    const value318 = !this._isAudioLaneMuted(mediaClipAudioLaneIndex2, value317);
    this._mediaClip = patchMediaClipAudioLaneMuted(this._mediaClip, mediaClipAudioLaneIndex2, value318);
    const value319 = Math.max(
      0,
      this._mediaClip.audioClips?.findIndex?.(
        (value320) => this._audioClipLaneIndex(value320) === mediaClipAudioLaneIndex2,
      ) ?? 0,
    );
    return (
      this._setActiveAudioClipIndex(value319),
      this._selectAudioClipIndex(value319),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
      appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }),
      commit(),
      this._refreshMediaClipTimelineInPlace(),
      true
    );
  }
  ['_toggleAudioClipDisabled'](value321 = this._activeAudioClipIndex) {
    const value322 = Math.max(0, Math.trunc(toNumber(value321, 0))),
      disabled = this._audioTimelineClips(this._mediaClip.tracks?.audio)[value322];
    if (!disabled) return false;
    return this._patchAudioClipState(value322, { disabled: disabled.disabled !== true });
  }
  ['_segmentClipIndex'](el73, value323 = 'video', value324 = null) {
    const text10 = normalizeText(el73?.dataset?.clipId);
    if (text10) {
      const list30 = Array.isArray(value324)
          ? value324
          : value323 === 'audio'
            ? this._mediaClip.audioClips || []
            : this._mediaClip.clips || [],
        count20 = list30.findIndex((value325) => normalizeText(value325?.id) === text10);
      if (count20 >= 0) return count20;
    }
    return Math.max(0, Math.trunc(toNumber(el73?.dataset?.clipIndex, 0)));
  }
  ['_timelineRowForDrag'](value326 = this._timelineDrag()) {
    if (value326?.rowEl) return value326.rowEl;
    const text11 = normalizeText(value326?.kind);
    if (!text11) return null;
    return (
      this.el?.querySelector?.('.media-clip-track-' + text11 + ':not(.is-compact)') ||
      this.el?.querySelector?.('.media-clip-track-' + text11) ||
      null
    );
  }
  ['_videoSourceSecForTimelineSec'](value327 = this._playheadSec, value328 = null) {
    const list31 = Array.isArray(value328)
      ? value328
      : this._videoTimelineClips(this._mediaClip.tracks?.video);
    if (!list31.length) return value327;
    const toNumber32 = toNumber(value327, 0);
    if (list31.length === 1) {
      const value329 = list31[0],
        toNumber33 = toNumber(value329.startSec, 0),
        toNumber34 = toNumber(value329.endSec, toNumber33),
        toNumber35 = toNumber(value329.timelineStartSec, 0),
        toNumber36 = toNumber(value329.timelineEndSec, toNumber35);
      if (toNumber32 >= toNumber35 && toNumber32 <= toNumber36) return toNumber33 + (toNumber32 - toNumber35);
      return Math.max(toNumber33, Math.min(toNumber34, toNumber32));
    }
    const value330 =
        list31[this._clipIndexAtTimelineSec(toNumber32, list31)] ||
        list31[list31.length - 1],
      toNumber37 = toNumber(value330.timelineStartSec, 0),
      toNumber38 = toNumber(value330.startSec, 0),
      toNumber39 = toNumber(value330.endSec, toNumber38);
    return Math.max(toNumber38, Math.min(toNumber39, toNumber38 + (toNumber32 - toNumber37)));
  }
  ['_videoSourceSecForPlayhead'](value331 = this._playheadSec) {
    return this._videoSourceSecForTimelineSec(value331);
  }
  ['_audioSourceSecForPlayhead'](value332 = this._playheadSec) {
    const list32 = this._audioTimelineClips(this._mediaClip.tracks?.audio);
    if (!list32.length) return value332;
    const toNumber40 = toNumber(value332, 0),
      value333 =
        list32[this._audioClipIndexAtTimelineSec(toNumber40, list32)] ||
        list32[list32.length - 1],
      toNumber41 = toNumber(value333.timelineStartSec, 0),
      toNumber42 = toNumber(value333.startSec, 0),
      toNumber43 = toNumber(value333.endSec, toNumber42);
    return Math.max(toNumber42, Math.min(toNumber43, toNumber42 + (toNumber40 - toNumber41)));
  }
  ['_audioClipSourceSec'](options14 = {}, value334 = this._playheadSec) {
    const toNumber44 = toNumber(options14.timelineStartSec, 0),
      toNumber45 = toNumber(options14.startSec, 0),
      toNumber46 = toNumber(options14.endSec, toNumber45);
    return Math.max(toNumber45, Math.min(toNumber46, toNumber45 + (toNumber(value334, 0) - toNumber44)));
  }
  ['_audioClipLaneIndex'](options15 = {}) {
    return normalizeMediaClipAudioLaneIndex(options15?.laneIndex);
  }
  ['_audioLaneCount'](
    value335 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
    value336 = {},
  ) {
    const list33 = Array.isArray(value335) ? value335 : [],
      value337 = list33.reduce(
        (value338, value339) => Math.max(value338, this._audioClipLaneIndex(value339)),
        0,
      ),
      value340 = Number.isFinite(Number(value336.previewLaneIndex))
        ? normalizeMediaClipAudioLaneIndex(value336.previewLaneIndex)
        : 0;
    return Math.max(
      1,
      Math.min(MEDIA_CLIP_AUDIO_LANE_COUNT_MAX, Math.max(value337, value340) + 1),
    );
  }
  ['_setAudioLaneCountStyle'](el74, value341 = 1) {
    if (!el74?.style) return;
    const value342 = Math.max(
        1,
        Math.min(MEDIA_CLIP_AUDIO_LANE_COUNT_MAX, Math.trunc(toNumber(value341, 1))),
      ),
      value343 =
        value342 * MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX +
        Math.max(0, value342 - 1) * MEDIA_CLIP_AUDIO_LANE_GAP_PX,
      handler = (value344, value345) => {
        if (typeof el74.style.setProperty === 'function')
          el74.style.setProperty(value344, value345);
        else el74.style[value344] = value345;
      };
    (handler('--media-clip-audio-lane-count', String(value342)),
      handler('--media-clip-audio-lane-height', MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + 'px'),
      handler('--media-clip-audio-lane-gap', MEDIA_CLIP_AUDIO_LANE_GAP_PX + 'px'),
      handler('--media-clip-audio-stack-height', value343 + 'px'));
  }
  ['_setAudioSegmentLaneVisual'](el75, value346 = 0) {
    if (!el75?.style) return;
    const mediaClipAudioLaneIndex3 = normalizeMediaClipAudioLaneIndex(value346),
      value347 = mediaClipAudioLaneIndex3 * (MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + MEDIA_CLIP_AUDIO_LANE_GAP_PX);
    ((el75.dataset.audioLaneIndex = String(mediaClipAudioLaneIndex3)),
      typeof el75.style.setProperty === 'function'
        ? (el75.style.setProperty('--media-clip-audio-lane-index', String(mediaClipAudioLaneIndex3)),
          el75.style.setProperty('--media-clip-audio-lane-top', value347 + 'px'))
        : ((el75.style['--media-clip-audio-lane-index'] = String(mediaClipAudioLaneIndex3)),
          (el75.style['--media-clip-audio-lane-top'] = value347 + 'px')));
  }
  ['_audioLaneIndexFromDrag'](options16 = {}) {
    const mediaClipAudioLaneIndex4 = normalizeMediaClipAudioLaneIndex(options16.startLaneIndex),
      toNumber47 =
        toNumber(options16.latestClientY, options16.startY) - toNumber(options16.startY, 0);
    if (Math.abs(toNumber47) < MEDIA_CLIP_AUDIO_LANE_DRAG_THRESHOLD_PX) return mediaClipAudioLaneIndex4;
    const value348 = MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + MEDIA_CLIP_AUDIO_LANE_GAP_PX,
      value349 = Math.round(toNumber47 / value348);
    return normalizeMediaClipAudioLaneIndex(mediaClipAudioLaneIndex4 + value349);
  }
  ['_previewSourceSecForTimelineSec'](value350, value351 = this._playheadSec) {
    if (value350 === 'video') return this._videoSourceSecForPlayhead(value351);
    if (value350 === 'audio') return this._audioSourceSecForPlayhead(value351);
    return value351;
  }
  ['_applyTimelineSegmentRect'](el76, value352 = {}) {
    if (!el76) return;
    ((el76.style.left = toNumber(value352.leftPct, 0) + '%'),
      (el76.style.width = toNumber(value352.widthPct, 0) + '%'),
      (el76.style.right = ''));
  }
  ['_applyAudioTimelineSegmentRect'](el77, value353 = {}) {
    if (!el77) return;
    ((el77.style.left = toNumber(value353.leftPct, 0) + '%'),
      (el77.style.right = Math.max(0, 100 - toNumber(value353.rightPct, 0)) + '%'),
      (el77.style.width = 'auto'));
  }
  ['_applyAudioTimelineTrimRect'](value354, value355 = {}) {
    this._applyAudioTimelineSegmentRect(value354, value355);
  }
  ['_timelinePreviewRangeRect'](options17 = {}) {
    const startSec2 = toNumber(options17.startSec, 0),
      endSec2 = Math.max(startSec2, toNumber(options17.endSec, startSec2));
    if (startSec2 >= 0) return getMediaClipTimelineRangeRect(options17);
    const mediaClipTimelineDisplayDuration5 = getMediaClipTimelineDisplayDuration(options17.durationSec),
      leftPct = (startSec2 / mediaClipTimelineDisplayDuration5) * 100,
      rightPct = (endSec2 / mediaClipTimelineDisplayDuration5) * 100;
    return {
      startSec: startSec2,
      endSec: endSec2,
      leftPct: leftPct,
      rightPct: rightPct,
      widthPct: Math.max(0, rightPct - leftPct),
    };
  }
  ['_timelineCursorHost'](el78 = null) {
    return (
      el78?.closest?.('.media-clip-compact-timeline') ||
      this.el?.querySelector?.('.media-clip-compact-timeline') ||
      el78
    );
  }
  ['_syncTimelineCursorLayerForRow'](enabled27 = null) {
    if (!enabled27) return;
    const el79 = this._timelineCursorHost(enabled27),
      value356 = Math.max(240, readLayoutWidthPx(enabled27, this._timelineTrackContentWidth()));
    el79?.style?.setProperty?.('--media-clip-track-content-width', value356 + 'px');
    const el80 = el79?.querySelector?.('.media-clip-timeline-cursors');
    if (el80?.style) el80.style.width = value356 + 'px';
  }
  ['_updateTimelineSegmentLabel'](el81, value357 = 0) {
    const el82 = el81?.querySelector?.('.media-clip-material-label');
    if (!el82) return;
    el82.textContent = formatDurationLabel(value357);
  }
  ['_syncAudioSegmentWaveformViewport'](el83, value358 = {}) {
    const el84 = el83?.querySelector?.('.media-clip-wave-svg');
    if (!el84) return;
    const el85 = el83?.querySelector?.('.media-clip-wave-source') || el84,
      mediaClipWaveformViewport = getMediaClipWaveformViewport(value358),
      formatWaveformPct2 = formatWaveformPct(mediaClipWaveformViewport.widthPct) + '%',
      value359 =
        mediaClipWaveformViewport.marginLeftPct > 0 ? '-' + formatWaveformPct(mediaClipWaveformViewport.marginLeftPct) + '%' : '0';
    (el84.setAttribute('viewBox', getMediaClipWaveformViewBox()),
      el84.setAttribute('width', '100%'),
      el85?.style &&
        ((el85.style.width = formatWaveformPct2),
        (el85.style.marginLeft = value359),
        (el85.style.transform = 'none'),
        (el85.style.transformOrigin = '')),
      el84.style &&
        ((el84.style.width = '100%'),
        (el84.style.marginLeft = '0'),
        (el84.style.transform = 'none'),
        (el84.style.transformOrigin = '')));
  }
  ['_applyVideoTimelinePreview'](el86, value360 = [], durationSec4 = 0) {
    const list34 = Array.isArray(value360) ? value360 : [];
    if (!el86 || !list34.length) return 0;
    let value361 = 0;
    return (
      el86.querySelectorAll?.('.media-clip-segment')?.forEach((value362) => {
        const value363 = this._segmentClipIndex(value362, 'video', list34),
          enabled28 = list34[value363];
        if (!enabled28) return;
        const startSec3 = toNumber(enabled28.timelineStartSec, 0),
          endSec3 = Math.max(startSec3, toNumber(enabled28.timelineEndSec, startSec3)),
          value364 = Math.max(0, endSec3 - startSec3);
        (this._applyTimelineSegmentRect(
          value362,
          this._timelinePreviewRangeRect({
            startSec: startSec3,
            endSec: endSec3,
            durationSec: durationSec4,
          }),
        ),
          this._updateTimelineSegmentLabel(value362, value364),
          (value361 += 1));
      }),
      value361
    );
  }
  ['_applyAudioTimelinePreview'](el87, value365 = [], durationSec5 = 0) {
    const list35 = Array.isArray(value365) ? value365 : [];
    if (!el87 || !list35.length) return 0;
    const value366 = this._audioLaneCount(list35);
    (this._setAudioLaneCountStyle(el87, value366),
      this._setAudioLaneCountStyle(el87.parentElement, value366),
      this._setAudioLaneCountStyle(el87.closest?.('.media-clip-timeline-lane'), value366),
      this._setAudioLaneCountStyle(el87.closest?.('.media-clip-compact-timeline'), value366));
    let value367 = 0;
    return (
      el87.querySelectorAll?.('.media-clip-segment')?.forEach((el88) => {
        const value368 = this._segmentClipIndex(el88, 'audio', list35),
          el89 = list35[value368];
        if (!el89) return;
        const startSec4 = toNumber(el89.timelineStartSec, 0),
          endSec4 = Math.max(startSec4, toNumber(el89.timelineEndSec, startSec4)),
          value369 = Math.max(0, endSec4 - startSec4);
        (this._applyAudioTimelineSegmentRect(
          el88,
          this._timelinePreviewRangeRect({
            startSec: startSec4,
            endSec: endSec4,
            durationSec: durationSec5,
          }),
        ),
          this._updateTimelineSegmentLabel(el88, value369),
          this._setAudioSegmentLaneVisual(el88, this._audioClipLaneIndex(el89)),
          (el88.dataset.mutedClip = el89.muted === true ? 'true' : 'false'),
          (el88.dataset.disabledClip = el89.disabled === true ? 'true' : 'false'),
          el88.classList?.toggle?.('is-muted', el89.muted === true),
          el88.classList?.toggle?.('is-disabled', el89.disabled === true),
          this._syncAudioSegmentWaveformViewport(el88, el89),
          (value367 += 1));
      }),
      value367
    );
  }
  ['_setTimelinePlayheadFromPointer'](enabled29, activeTrack3, value370, value371 = 0, value372 = {}) {
    if (!enabled29 || !this._mediaClip.tracks?.[activeTrack3]) return false;
    const playheadSec2 = this._timelineSecFromPointerEvent(enabled29, value370, value371);
    this._playheadSec = playheadSec2;
    const value373 = this._mediaClip.activeTrack !== activeTrack3;
    if (activeTrack3 === 'video') {
      if (value372.updateClipSelection !== false) {
        const value374 =
          value372.clipIndex == null
            ? this._clipIndexAtTimelineSec(playheadSec2)
            : Math.max(0, Math.trunc(toNumber(value372.clipIndex, 0)));
        this._setActiveClipIndex(value374);
        if (value372.selectClip !== false) this._selectClipIndex(value374);
      }
      value372.syncPreview !== false && this._syncVideoPreviewSourceForTimelineSec(playheadSec2);
    } else {
      if (activeTrack3 === 'audio') {
        const value375 =
          value372.clipIndex == null
            ? this._audioClipIndexAtTimelineSec(playheadSec2)
            : Math.max(0, Math.trunc(toNumber(value372.clipIndex, 0)));
        this._setActiveAudioClipIndex(value375);
        if (value372.selectClip !== false) this._selectAudioClipIndex(value375);
        value372.syncPreview !== false && this._syncAudioPreviewSourceForTimelineSec(playheadSec2);
      }
    }
    return (
      value373 &&
        value372.updateActiveTrack !== false &&
        ((this._mediaClip = { ...this._mediaClip, activeTrack: activeTrack3 }),
        (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }),
        value372.persistActiveTrack !== false &&
          appStore.updateNodeData(this.id, { mediaClip: this._mediaClip })),
      this._updateTrackPlayheadVisual(enabled29, value371, { playheadSec: playheadSec2 }),
      value372.syncPreview !== false &&
        this._syncPreviewTime(activeTrack3, this._previewSourceSecForTimelineSec(activeTrack3, playheadSec2)),
      true
    );
  }
  ['_applyTimelinePlayheadModel'](el90, value376 = {}) {
    if (!el90) return;
    el90.style.left = toNumber(value376.leftPct, 0) + '%';
  }
  async ['_loadAudioWaveformPath'](el91, el92, value377 = {}) {
    if (!el91 || !el92) return;
    const mediaClipWaveformUrl = resolveMediaClipWaveformUrl(value377),
      mediaClipAudioUrl = resolveMediaClipAudioUrl(value377);
    if (!mediaClipWaveformUrl && !mediaClipAudioUrl) return;
    const value378 = [mediaClipWaveformUrl, mediaClipAudioUrl, resolveMediaClipSourceKey(value377)].join('|');
    if (el91.dataset) el91.dataset.waveformKey = value378;
    const value379 = {
      width: MEDIA_CLIP_WAVEFORM_WIDTH,
      height: MEDIA_CLIP_WAVEFORM_HEIGHT,
      samples: MEDIA_CLIP_WAVEFORM_SAMPLES,
    };
    let waveformBarsPathFromPersistedUrl = '';
    mediaClipWaveformUrl && (waveformBarsPathFromPersistedUrl = await getWaveformBarsPathFromPersistedUrl(mediaClipWaveformUrl, value379));
    !waveformBarsPathFromPersistedUrl &&
      mediaClipAudioUrl &&
      typeof window !== 'undefined' &&
      (waveformBarsPathFromPersistedUrl = await getWaveformBarsPathFromUrl(mediaClipAudioUrl, value379));
    if (!waveformBarsPathFromPersistedUrl) return;
    if (el91.dataset?.waveformKey && el91.dataset.waveformKey !== value378) return;
    if (this.el?.isConnected === false) return;
    (el92.setAttribute('d', waveformBarsPathFromPersistedUrl), el91.classList?.add('has-waveform'));
  }
  ['_renderTrack'](value380, args11 = {}) {
    const startSec5 = this._mediaClip.tracks?.[value380],
      durationSec6 =
        value380 === 'video'
          ? getMediaClipTimelineDisplayDuration(
              args11.durationSec ?? this._videoTimelineDuration(startSec5),
            )
          : getMediaClipTimelineDisplayDuration(
              args11.durationSec ?? this._timelineDurationForKind(value380),
            ),
      value381 = this._mediaClip.activeTrack === value380,
      value382 = value380 === 'audio' ? this._audioTimelineClips(startSec5) : [],
      value383 = value380 === 'audio' ? this._audioLaneCount(value382) : 1,
      el93 = document.createElement('div');
    ((el93.className = 'media-clip-track media-clip-track-' + value380),
      el93.classList.toggle('is-active', value381),
      el93.classList.toggle('is-compact', args11.compact === true));
    if (value380 === 'audio') {
      ((el93.dataset.audioLaneCount = String(value383)),
        this._setAudioLaneCountStyle(el93, value383));
      for (let value384 = 0; value384 < value383; value384 += 1) {
        const el94 = document.createElement('div');
        ((el94.className = 'media-clip-audio-lane-guide'),
          (el94.dataset.audioLaneIndex = String(value384)),
          el94.style.setProperty('--media-clip-audio-lane-index', String(value384)),
          el94.style.setProperty(
            '--media-clip-audio-lane-top',
            value384 * (MEDIA_CLIP_AUDIO_LANE_HEIGHT_PX + MEDIA_CLIP_AUDIO_LANE_GAP_PX) + 'px',
          ),
          el93.appendChild(el94));
      }
    }
    this._setTimelineRowDuration(el93, durationSec6);
    const toNumber48 = toNumber(args11.timelineWidthPx, 0);
    if (toNumber48 > 0) el93.style.width = Math.max(240, toNumber48) + 'px';
    el93.addEventListener('click', (event9) => {
      event9.stopPropagation();
      if (this._suppressTrackClick) {
        this._suppressTrackClick = false;
        return;
      }
      if (this._isTimelineControlTarget(event9.target)) return;
      if (args11.compact === true) {
        this._setMediaClipWithLayout({ ...this._mediaClip, expanded: true }, true);
        return;
      }
      if (!this._timelineEventSegment(event9.target)) return;
      const value385 = this._timelineRowDuration(el93, durationSec6),
        value386 = this._timelineSecFromPointerEvent(el93, event9, value385),
        forceRender2 =
          value380 === 'video'
            ? this._setActiveClipIndex(this._clipIndexAtTimelineSec(value386))
            : value380 === 'audio'
              ? this._setActiveAudioClipIndex(this._audioClipIndexAtTimelineSec(value386))
              : false;
      if (value380 === 'audio') this._selectAudioClipIndex(this._activeAudioClipIndex);
      this._setActiveTrack(value380, value386, { forceRender: forceRender2 });
    });
    const run3 = (el95, value387) => {
        const el96 = document.createElement('div');
        el96.className = 'media-clip-filmstrip';
        const list36 = collectMediaClipFrameUrls(value387),
          mediaClipFrameCount = getMediaClipFrameCount(this._estimateTimelineWidth(args11), args11);
        if (list36.length > 0)
          for (let value388 = 0; value388 < mediaClipFrameCount; value388 += 1) {
            const el97 = document.createElement('img');
            ((el97.className = 'media-clip-filmstrip-frame'),
              (el97.src = list36[value388 % list36.length]),
              (el97.alt = ''),
              (el97.draggable = false),
              el97.addEventListener('error', () => fillFilmstripPlaceholder(el96, mediaClipFrameCount), {
                once: true,
              }),
              el96.appendChild(el97));
          }
        else fillFilmstripPlaceholder(el96, mediaClipFrameCount);
        el95.appendChild(el96);
      },
      handler2 = (el98, value389 = {}, value390 = null) => {
        const el99 = document.createElement('div');
        el99.className = 'media-clip-wave';
        const el100 = document.createElement('div');
        el100.className = 'media-clip-wave-source';
        const el101 = createMediaClipSvgElement('svg');
        (setMediaClipSvgClass(el101, 'media-clip-wave-svg'),
          el101.setAttribute('width', '100%'),
          el101.setAttribute('height', '100%'),
          el101.setAttribute('viewBox', getMediaClipWaveformViewBox()),
          el101.setAttribute('preserveAspectRatio', 'none'));
        const el102 = createMediaClipSvgElement('path');
        (setMediaClipSvgClass(el102, 'media-clip-wave-path'),
          el102.setAttribute('d', ''),
          el101.appendChild(el102),
          el100.appendChild(el101),
          el99.appendChild(el100),
          el98.appendChild(el99),
          this._syncAudioSegmentWaveformViewport(el98, value389),
          void this._loadAudioWaveformPath(el99, el102, value390));
      },
      handler3 = (el103, value391 = {}) => {
        const el104 = document.createElement('div');
        ((el104.className = 'media-clip-material-selection v2-video-clipselection'),
          (el104.style.left = '0%'),
          (el104.style.width = '100%'));
        const el105 = document.createElement('div');
        el105.className = 'media-clip-material-label v2-video-cliplabel';
        const toNumber49 = toNumber(value391.startSec ?? value391.timelineStartSec, 0),
          toNumber50 = toNumber(value391.endSec ?? value391.timelineEndSec, toNumber49);
        ((el105.textContent = formatDurationLabel(Math.max(0, toNumber50 - toNumber49))),
          el104.append(el105),
          el103.appendChild(el104));
      },
      handler4 = ({
        rect: rect = {},
        source: source = null,
        clipIndex: clipIndex = 0,
        item: item = null,
      }) => {
        const el106 = document.createElement('div');
        el106.className = 'media-clip-segment media-clip-material-strip';
        value380 === 'audio'
          ? this._applyAudioTimelineSegmentRect(el106, rect)
          : this._applyTimelineSegmentRect(el106, rect);
        el106.dataset.clipIndex = String(clipIndex);
        const text12 = normalizeText(item?.id);
        if (text12) el106.dataset.clipId = text12;
        if (value380 === 'video') {
          const value392 = this._visualClipKind(item, source);
          (el106.classList.add('media-clip-segment-' + value392),
            (el106.dataset.mediaKind = value392),
            clipIndex === this._clampVideoClipIndex() && (el106.dataset.activeClip = 'true'),
            clipIndex === this._selectedClipIndex && (el106.dataset.selectedClip = 'true'),
            run3(el106, source));
        } else
          (el106.classList.add('media-clip-segment-audio'),
            (el106.dataset.mediaKind = 'audio'),
            this._setAudioSegmentLaneVisual(el106, this._audioClipLaneIndex(item)),
            (el106.dataset.mutedClip = item?.muted === true ? 'true' : 'false'),
            (el106.dataset.disabledClip = item?.disabled === true ? 'true' : 'false'),
            el106.classList.toggle('is-muted', item?.muted === true),
            el106.classList.toggle('is-disabled', item?.disabled === true),
            clipIndex === this._clampAudioClipIndex() && (el106.dataset.activeClip = 'true'),
            clipIndex === this._selectedAudioClipIndex && (el106.dataset.selectedClip = 'true'),
            handler2(el106, item, source));
        handler3(el106, item || {});
        if (args11.compact !== true) {
          el106.addEventListener('contextmenu', (value393) => {
            const value394 = this._segmentClipIndex(el106, value380);
            if (value380 === 'video')
              (this._setActiveClipIndex(value394),
                this._selectClipIndex(value394),
                this._syncTrackActiveClipChrome(el93, value380));
            else
              value380 === 'audio' &&
                (this._setActiveAudioClipIndex(value394),
                this._selectAudioClipIndex(value394),
                this._syncTrackActiveClipChrome(el93, value380));
            this._openMaterialMenu(value380, value394, value393);
          });
          const value395 = (value396) => {
            if (this._timelineDrag()) return;
            const value397 = this._segmentClipIndex(el106, value380);
            this._setTimelineHoverSegment(el93, el106, value380, value397);
            const value398 = this._timelineRowDuration(el93, durationSec6),
              value399 = this._timelineSecFromPointerEvent(el93, value396, value398);
            this._previewTrackPlayhead(el93, value380, value399, value398);
          };
          (el106.addEventListener('pointerenter', value395),
            el106.addEventListener('pointermove', value395),
            el106.addEventListener('pointerleave', () => {
              if (!this._timelineDrag()) this._clearTimelineHoverState(el93);
              this._restoreTrackPlayhead(el93, value380);
            }),
            el106.addEventListener('pointerdown', (value400) => {
              const clipIndex2 = this._segmentClipIndex(el106, value380);
              if (value380 === 'video')
                (this._setActiveClipIndex(clipIndex2),
                  this._selectClipIndex(clipIndex2),
                  this._syncTrackActiveClipChrome(el93, value380));
              else
                value380 === 'audio' &&
                  (this._setActiveAudioClipIndex(clipIndex2),
                  this._selectAudioClipIndex(clipIndex2),
                  this._syncTrackActiveClipChrome(el93, value380));
              this._startSegmentDrag(value380, value400, { ...args11, clipIndex: clipIndex2 });
            }));
        }
        return (el93.appendChild(el106), el106);
      };
    if (value380 === 'video') {
      const item2 = this._videoTimelineClips(startSec5);
      item2.length
        ? item2.forEach((item3, clipIndex3) => {
            const startSec6 = toNumber(item3.timelineStartSec, 0),
              endSec5 = Math.max(startSec6, toNumber(item3.timelineEndSec, startSec6));
            handler4({
              rect: getMediaClipTimelineRangeRect({
                startSec: startSec6,
                endSec: endSec5,
                durationSec: durationSec6,
              }),
              source: this._videoClipSource(item3, clipIndex3),
              clipIndex: clipIndex3,
              item: item3,
            });
          })
        : handler4({
            rect: getMediaClipTimelineRangeRect({
              startSec: startSec5.startSec,
              endSec: startSec5.endSec,
              durationSec: durationSec6,
            }),
            source: this._videoClipSource(item2[0] || startSec5, 0),
            clipIndex: 0,
            item: item2[0] || startSec5,
          });
    } else {
      const list37 = value382;
      list37.length &&
        list37.forEach((item4, clipIndex4) => {
          const startSec7 = toNumber(item4.timelineStartSec, 0),
            endSec6 = Math.max(startSec7, toNumber(item4.timelineEndSec, startSec7));
          handler4({
            rect: getMediaClipTimelineRangeRect({
              startSec: startSec7,
              endSec: endSec6,
              durationSec: durationSec6,
            }),
            source: this._audioClipSource(item4, clipIndex4),
            clipIndex: clipIndex4,
            item: item4,
          });
        });
    }
    return (
      !args11.compact && value381 && this._syncTrackActiveClipChrome(el93, value380),
      el93
    );
  }
  ['_timelineSecFromPointerEvent'](el107, event10, durationSec7 = 0) {
    const box11 = el107?.getBoundingClientRect?.(),
      trackWidthPx3 = Math.max(1, toNumber(box11?.width, readLayoutWidthPx(el107, 1))),
      trackLeftPx = toNumber(box11?.left, 0);
    return getMediaClipTimelineSecFromClientX(event10?.clientX, {
      durationSec: durationSec7,
      trackLeftPx: trackLeftPx,
      trackWidthPx: trackWidthPx3,
    });
  }
  ['_previewTrackPlayhead'](enabled30, value401, playheadSec3 = 0, value402 = 0) {
    if (!enabled30 || this._playing || this._playPreviewPending) return;
    this._updateTimelineHoverPlayheadVisual(enabled30, value402, { playheadSec: playheadSec3 });
    if (value401 === 'video') this._syncVideoPreviewSourceForTimelineSec(playheadSec3);
    else {
      if (value401 === 'audio') this._syncAudioPreviewSourceForTimelineSec(playheadSec3);
    }
    this._syncPreviewTime(value401, this._previewSourceSecForTimelineSec(value401, playheadSec3));
  }
  ['_syncTimelineHoverPlayheadFromPointer'](enabled31, enabled32, value403 = 0) {
    if (!enabled31 || !enabled32 || this._playing || this._playPreviewPending) return;
    const playheadSec4 = this._timelineSecFromPointerEvent(enabled31, enabled32, value403);
    this._updateTimelineHoverPlayheadVisual(enabled31, value403, { playheadSec: playheadSec4 });
  }
  ['_restoreTrackPlayhead'](enabled33, value404) {
    if (!enabled33 || this._playing || this._playPreviewPending) return;
    (this._hideTimelineHoverPlayhead(enabled33), this._updatePlaybackVisuals(value404));
  }
  ['_restoreTimelinePlayheads']() {
    if (this._playing || this._playPreviewPending) return;
    (this._hideTimelineHoverPlayhead(),
      this._updatePlaybackVisuals('video'),
      this._updatePlaybackVisuals('audio'));
  }
  ['_syncTrackActiveClipChrome'](el108, value405) {
    if (!el108 || el108.classList?.contains('is-compact')) return;
    const enabled34 = this._mediaClip.activeTrack === value405,
      value406 = value405 === 'video' ? this._clampVideoClipIndex() : this._clampAudioClipIndex(),
      value407 =
        value405 === 'video' ? this._clampSelectedClipIndex() : this._clampSelectedAudioClipIndex(),
      value408 =
        value405 === 'audio' ? this._mediaClip.audioClips || [] : this._mediaClip.clips || [];
    el108.querySelectorAll('.media-clip-segment').forEach((el109) => {
      const clipIndex5 = this._segmentClipIndex(el109, value405, value408);
      if (value405 === 'video') {
        const text13 = normalizeText(value408[clipIndex5]?.id);
        el109.dataset.clipIndex = String(clipIndex5);
        if (text13) el109.dataset.clipId = text13;
      } else {
        if (value405 === 'audio') {
          const text14 = normalizeText(value408[clipIndex5]?.id);
          el109.dataset.clipIndex = String(clipIndex5);
          if (text14) el109.dataset.clipId = text14;
        }
      }
      const value409 = enabled34 && clipIndex5 === value406,
        value410 = enabled34 && clipIndex5 === value407;
      value409 ? (el109.dataset.activeClip = 'true') : delete el109.dataset.activeClip;
      value410
        ? (el109.dataset.selectedClip = 'true')
        : delete el109.dataset.selectedClip;
      el109.querySelectorAll('.media-clip-trim').forEach((el110) => {
        (!enabled34 || Math.trunc(toNumber(el110.dataset.clipIndex, -1)) !== clipIndex5) &&
          el110.remove();
      });
      if (!enabled34) return;
      el109.querySelectorAll('.media-clip-material-selection .media-clip-trim').forEach(
        (el111) => el111.remove(),
      );
      const el112 = el109,
        handler5 = (value411) =>
          Array.from(el112.children).some((el113) =>
            el113.classList?.contains('media-clip-trim-' + value411),
          );
      (!handler5('left') &&
        el112.appendChild(this._renderTrimHandle(value405, 'left', { clipIndex: clipIndex5 })),
        !handler5('right') &&
          el112.appendChild(this._renderTrimHandle(value405, 'right', { clipIndex: clipIndex5 })));
    });
  }
  ['_renderTrimHandle'](value412, value413, value414 = {}) {
    return renderMediaClipTimelineTrimHandle(this, value412, value413, value414);
  }
  ['_detachDragListeners']() {
    return detachMediaClipTimelineEditDrag(this);
  }
  ['_startSegmentDrag'](value415, value416, value417 = {}) {
    return startMediaClipTimelineSegmentDrag(this, value415, value416, value417);
  }
  ['_handleTrimDrag'](value418, value419 = null) {
    return handleMediaClipTimelineDrag(this, value418, value419);
  }
  ['_applyTimelineDragPreviewFromPointer'](value420 = this._timelineDrag(), value421 = {}) {
    return applyMediaClipTimelineDragPreviewFromPointer(this, value420, value421);
  }
  ['_previewVideoTrimDrag'](value422, value423 = 0, value424 = 0, value425 = null) {
    return previewMediaClipTimelineTrimDrag(this, 'video', value422, value423, value424, value425);
  }
  ['_previewAudioTrimDrag'](value426, value427 = 0, value428 = 0, value429 = null) {
    return previewMediaClipTimelineTrimDrag(this, 'audio', value426, value427, value428, value429);
  }
  ['_commitVideoTrimDrag'](value430, value431 = {}) {
    return commitMediaClipTimelineEdit(this, 'video', 'trim', value430, value431);
  }
  ['_commitAudioTrimDrag'](value432, value433 = {}) {
    return commitMediaClipTimelineEdit(this, 'audio', 'trim', value432, value433);
  }
  ['_handleSegmentDrag'](value434) {
    return handleMediaClipTimelineSegmentDrag(this, value434);
  }
  ['_previewVideoSegmentDrag'](value435, value436 = 0, value437 = 0) {
    return previewMediaClipTimelineMoveDrag(this, 'video', value435, value436, value437);
  }
  ['_previewAudioSegmentDrag'](value438, value439 = 0, value440 = 0) {
    return previewMediaClipTimelineMoveDrag(this, 'audio', value438, value439, value440);
  }
  ['_commitVideoSegmentDrag'](value441, value442 = {}) {
    return commitMediaClipTimelineEdit(this, 'video', 'move', value441, value442);
  }
  ['_commitAudioSegmentDrag'](value443, value444 = {}) {
    return commitMediaClipTimelineEdit(this, 'audio', 'move', value443, value444);
  }
  ['_flushTimelineSettlePersist']() {
    if (!this._timelineSettlePendingPersist) return;
    const commitHistory = this._timelineSettlePendingCommit;
    ((this._timelineSettlePendingPersist = false),
      (this._timelineSettlePendingCommit = false),
      this._persistTimelineMediaClip({ commitHistory: commitHistory }));
  }
  ['_persistTimelineMediaClip'](options18 = {}) {
    ((this._skipNextStoreMediaClipRender = true),
      appStore.updateNodeData(this.id, { mediaClip: this._mediaClip }),
      (this.nodeData = { ...(this.nodeData || {}), mediaClip: this._mediaClip }));
    if (options18.commitHistory === true) commit();
  }
  ['_applyDeferredTimelineDragUpdate'](value445 = null) {
    const enabled35 = this._deferredTimelineDragNodeData;
    this._deferredTimelineDragNodeData = null;
    if (!enabled35 || this._timelineDrag()) return;
    const value446 = enabled35.mediaClip;
    if (isSameMediaClipState(value446, this._mediaClip)) return;
    if (value445?.startMediaClip && isSameMediaClipState(value446, value445.startMediaClip)) return;
    this.update(enabled35);
  }
  ['_scheduleTimelineSettleRender'](value447, value448 = {}) {
    if (this._timelineSettleTimer) clearTimeout(this._timelineSettleTimer);
    this._timelineSettleRow = value447 || this._timelineSettleRow;
    const value449 = this._timelineSettleVersion;
    ((this._timelineSettlePendingPersist =
      this._timelineSettlePendingPersist || value448.persist === true),
      (this._timelineSettlePendingCommit =
        this._timelineSettlePendingCommit || value448.commitHistory === true),
      (this._timelineSettleTimer = setTimeout(() => {
        if (value449 !== this._timelineSettleVersion) return;
        this._timelineSettleTimer = 0;
        const el114 = this._timelineSettleRow || value447;
        (el114?.classList.remove('is-settling'),
          (this._timelineSettleRow = null),
          value448.syncTimelineWidthAfterSettle !== false && this._syncTimelineContentWidth(),
          this._flushTimelineSettlePersist());
      }, TIMELINE_SETTLE_ANIMATION_MS)));
  }
  ['_animateTrackVisualsToCurrentState'](value450, value451 = 'video', args12 = {}) {
    const value452 = this._startTimelineSettle(value450),
      commitHistory2 = { ...args12 };
    commitHistory2.persist === true &&
      (this._persistTimelineMediaClip({ commitHistory: commitHistory2.commitHistory === true }),
      (commitHistory2.persist = false),
      (commitHistory2.commitHistory = false));
    const value453 = () => {
      if (value452 !== this._timelineSettleVersion || this._timelineDrag()) return;
      (this._updateTrackVisuals(value451, {
        durationSec: commitHistory2.durationSec,
        syncTimelineWidth: false,
      }),
        this._scheduleTimelineSettleRender(value450, commitHistory2));
    };
    if (typeof requestAnimationFrame === 'function')
      requestAnimationFrame(() => requestAnimationFrame(value453));
    else setTimeout(value453, 0);
  }
  ['_startTimelineSettle'](el115) {
    (this._cancelTimelineSettle(), (this._timelineSettleVersion += 1));
    if (this._timelineSettleTimer) {
      (clearTimeout(this._timelineSettleTimer), (this._timelineSettleTimer = 0));
      const el116 = this._timelineSettleRow || el115;
      (el116?.classList.remove('is-settling'),
        (this._timelineSettleRow = null),
        this._flushTimelineSettlePersist());
    }
    return (
      (this._timelineSettleRow = el115 || null),
      el115?.classList.add('is-settling'),
      el115?.getBoundingClientRect?.(),
      this._timelineSettleVersion
    );
  }
  ['_cancelTimelineSettle'](options19 = {}) {
    this._timelineSettleVersion = toNumber(this._timelineSettleVersion, 0) + 1;
    this._timelineSettleTimer &&
      (clearTimeout(this._timelineSettleTimer), (this._timelineSettleTimer = 0));
    const el117 = this._timelineSettleRow;
    (el117?.classList.remove('is-settling'),
      (this._timelineSettleRow = null),
      options19.flushPersist !== false
        ? this._flushTimelineSettlePersist()
        : ((this._timelineSettlePendingPersist = false), (this._timelineSettlePendingCommit = false)));
  }
  ['_updateTrackPlayheadVisual'](el118, value454 = 0, playheadSec5 = {}) {
    if (!el118) return;
    const durationSec8 = this._timelineRowDuration(el118, value454);
    (this._setTimelineRowDuration(el118, durationSec8),
      this._syncTimelineCursorLayerForRow(el118));
    const el119 = this._timelineCursorHost(el118),
      enabled36 =
        el119?.querySelector?.('.media-clip-playhead') ||
        el118.querySelector?.('.media-clip-playhead');
    if (!enabled36) return;
    this._applyTimelinePlayheadModel(
      enabled36,
      getMediaClipTimelinePlayheadModel({
        playheadSec: playheadSec5.playheadSec ?? this._playheadSec,
        durationSec: durationSec8,
      }),
    );
  }
  ['_updateTimelineHoverPlayheadVisual'](el120, value455 = 0, playheadSec6 = {}) {
    if (!el120) return;
    const durationSec9 = this._timelineRowDuration(el120, value455);
    (this._setTimelineRowDuration(el120, durationSec9), this._syncTimelineCursorLayerForRow(el120));
    const el121 = this._timelineCursorHost(el120),
      el122 =
        el121?.querySelector?.('.media-clip-hover-playhead') ||
        el120.querySelector?.('.media-clip-hover-playhead');
    if (!el122) return;
    ((el122.hidden = false),
      el122.classList?.add('is-visible'),
      this._applyTimelinePlayheadModel(
        el122,
        getMediaClipTimelinePlayheadModel({
          playheadSec: playheadSec6.playheadSec ?? this._playheadSec,
          durationSec: durationSec9,
        }),
      ));
  }
  ['_hideTimelineHoverPlayhead'](el123 = null) {
    const el124 = this._timelineCursorHost(el123),
      list38 = [],
      list39 = el124?.querySelectorAll
        ? el124.querySelectorAll('.media-clip-hover-playhead')
        : this.el?.querySelectorAll?.('.media-clip-hover-playhead');
    list39?.forEach?.((value456) => list38.push(value456));
    const value457 =
      el124?.querySelector?.('.media-clip-hover-playhead') ||
      el123?.querySelector?.('.media-clip-hover-playhead');
    if (value457 && !list38.includes(value457)) list38.push(value457);
    list38.forEach((el125) => {
      (el125.classList?.remove('is-visible'), (el125.hidden = true));
    });
  }
  ['_clearTimelinePlaybackVisualLocks']() {
    const el126 = this.el;
    (el126?.querySelectorAll?.('.media-clip-compact-timeline')?.forEach((el127) => {
      el127.classList?.remove('is-moving-material');
    }),
      el126?.querySelectorAll?.('.media-clip-timeline-lane')?.forEach((el128) => {
        (el128.classList?.remove('is-moving'), el128.classList?.remove('is-trimming'));
      }),
      el126?.querySelectorAll?.('.media-clip-timeline-scroll')?.forEach((el129) => {
        el129.classList?.remove('is-trimming');
      }),
      el126?.querySelectorAll?.('.media-clip-track')?.forEach((el130) => {
        (el130.classList?.remove('is-trimming'),
          el130.classList?.remove('is-preview-dragging'));
      }),
      el126?.querySelectorAll?.('.media-clip-segment')?.forEach((el131) => {
        (el131.classList?.remove('is-dragging'),
          el131.classList?.remove('is-trimming'));
      }));
  }
  ['_updatePlaybackVisuals'](value458) {
    const enabled37 = this._mediaClip.tracks?.[value458],
      enabled38 = this.el?.querySelector('.media-clip-track-' + value458 + ':not(.is-compact)');
    if (!enabled37 || !enabled38) return;
    const value459 = this._timelineDurationForKind(value458);
    this._updateTrackPlayheadVisual(enabled38, value459);
  }
  ['_updateTrackVisuals'](value460, value461 = {}) {
    const enabled39 = this._mediaClip.tracks?.[value460],
      el132 = this.el?.querySelector('.media-clip-track-' + value460 + ':not(.is-compact)');
    if (!enabled39 || !el132) return;
    const durationSec10 =
      value460 === 'video'
        ? getMediaClipTimelineDisplayDuration(
            value461.durationSec ?? this._videoTimelineDuration(enabled39),
          )
        : getMediaClipTimelineDisplayDuration(
            value461.durationSec ?? this._timelineDurationForKind(value460),
          );
    this._setTimelineRowDuration(el132, durationSec10);
    if (value460 === 'video' && value461.syncTimelineWidth !== false)
      this._syncTimelineContentWidth(undefined, { durationSec: durationSec10 });
    else
      value460 === 'video' &&
        this._syncTimelineAddSlotForRow(el132, { displayDurationSec: durationSec10 });
    if (value460 === 'video' && (this._mediaClip.clips || []).length) {
      const value462 = this._mediaClip.clips || [];
      el132.querySelectorAll('.media-clip-segment').forEach((el133) => {
        const value463 = this._segmentClipIndex(el133, value460, value462),
          enabled40 = value462[value463];
        if (!enabled40) return;
        el133.dataset.clipIndex = String(value463);
        const text15 = normalizeText(enabled40.id);
        if (text15) el133.dataset.clipId = text15;
        const startSec8 = toNumber(enabled40.timelineStartSec, 0),
          endSec7 = Math.max(startSec8, toNumber(enabled40.timelineEndSec, startSec8));
        (this._applyTimelineSegmentRect(
          el133,
          this._timelinePreviewRangeRect({
            startSec: startSec8,
            endSec: endSec7,
            durationSec: durationSec10,
          }),
        ),
          this._updateTimelineSegmentLabel(el133, Math.max(0, endSec7 - startSec8)));
      });
    } else {
      if (value460 === 'audio' && (this._mediaClip.audioClips || []).length) {
        const value464 = this._mediaClip.audioClips || [],
          value465 = this._audioLaneCount(value464);
        (this._setAudioLaneCountStyle(el132, value465),
          this._setAudioLaneCountStyle(el132.parentElement, value465),
          this._setAudioLaneCountStyle(el132.closest?.('.media-clip-timeline-lane'), value465),
          this._setAudioLaneCountStyle(el132.closest?.('.media-clip-compact-timeline'), value465),
          this._syncAudioLaneControls(value464, value465),
          el132.querySelectorAll('.media-clip-segment').forEach((el134) => {
            const value466 = this._segmentClipIndex(el134, value460, value464),
              el135 = value464[value466];
            if (!el135) return;
            el134.dataset.clipIndex = String(value466);
            const text16 = normalizeText(el135.id);
            if (text16) el134.dataset.clipId = text16;
            const startSec9 = toNumber(el135.timelineStartSec, 0),
              endSec8 = Math.max(startSec9, toNumber(el135.timelineEndSec, startSec9));
            (this._applyAudioTimelineSegmentRect(
              el134,
              getMediaClipTimelineRangeRect({
                startSec: startSec9,
                endSec: endSec8,
                durationSec: durationSec10,
              }),
            ),
              this._updateTimelineSegmentLabel(el134, Math.max(0, endSec8 - startSec9)),
              this._setAudioSegmentLaneVisual(el134, this._audioClipLaneIndex(el135)),
              (el134.dataset.mutedClip = el135.muted === true ? 'true' : 'false'),
              (el134.dataset.disabledClip = el135.disabled === true ? 'true' : 'false'),
              el134.classList?.toggle?.('is-muted', el135.muted === true),
              el134.classList?.toggle?.('is-disabled', el135.disabled === true),
              this._syncAudioSegmentWaveformViewport(el134, el135));
          }));
      } else {
        const value467 = el132.querySelector('.media-clip-segment');
        if (value467) {
          const startSec10 = toNumber(enabled39.startSec, 0),
            endSec9 = Math.max(startSec10, toNumber(enabled39.endSec, startSec10));
          value460 === 'audio'
            ? this._applyAudioTimelineSegmentRect(
                value467,
                getMediaClipTimelineRangeRect({
                  startSec: startSec10,
                  endSec: endSec9,
                  durationSec: durationSec10,
                }),
              )
            : this._applyTimelineSegmentRect(
                value467,
                getMediaClipTimelineRangeRect({
                  startSec: startSec10,
                  endSec: endSec9,
                  durationSec: durationSec10,
                }),
              );
          this._updateTimelineSegmentLabel(value467, Math.max(0, endSec9 - startSec10));
          if (value460 === 'audio') this._syncAudioSegmentWaveformViewport(value467, enabled39);
        }
      }
    }
    (this._syncTrackActiveClipChrome(el132, value460),
      this._updateTrackPlayheadVisual(el132, durationSec10));
  }
  ['_primaryDuration'](options20 = {}) {
    const value468 = this._mediaClip.tracks?.video,
      value469 = this._mediaClip.tracks?.audio;
    return (
      (value468 ? this._videoTimelineDuration(value468, null, options20) : 0) ||
      this._audioTimelineDuration(value469, null, options20) ||
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
    const value470 = this._getPlaybackKind();
    if (value470 === 'video')
      (this._syncVideoPreviewSourceForTimelineSec(this._playheadSec),
        this._syncPreviewTime('video', this._videoSourceSecForPlayhead(this._playheadSec), {
          immediate: true,
        }));
    else
      value470 === 'audio' &&
        (this._setActiveAudioClipIndex(this._audioClipIndexAtTimelineSec(this._playheadSec)),
        this._syncAudioPreviewSourceForTimelineSec(this._playheadSec),
        this._syncPreviewTime('audio', this._audioSourceSecForPlayhead(this._playheadSec), {
          immediate: true,
        }));
    this._updatePreviewControls();
  }
  ['_edgeIdForMaterial'](value471 = 'video', value472 = 0) {
    if (value471 === 'audio') {
      const value473 = this._audioTimelineClips(this._mediaClip.tracks?.audio)[value472],
        value474 = this._audioClipSource(value473, value472);
      return normalizeText(value474?.__mediaClipEdgeId);
    }
    const value475 = this._videoTimelineClips(this._mediaClip.tracks?.video)[value472],
      value476 = this._videoClipSource(value475, value472);
    return normalizeText(value476?.__mediaClipEdgeId);
  }
  ['_deleteActiveMaterial']() {
    const value477 = this._mediaClip.activeTrack === 'audio' ? 'audio' : 'video',
      value478 =
        value477 === 'video'
          ? this._clampSelectedClipIndex(this._selectedClipIndex) >= 0
            ? this._clampSelectedClipIndex(this._selectedClipIndex)
            : this._clampVideoClipIndex(this._activeClipIndex)
          : this._clampSelectedAudioClipIndex(this._selectedAudioClipIndex) >= 0
            ? this._clampSelectedAudioClipIndex(this._selectedAudioClipIndex)
            : this._clampAudioClipIndex(this._activeAudioClipIndex);
    this._deleteMaterial(value477, value478);
  }
  ['_deleteMaterial'](value479 = 'video', value480 = 0) {
    if (this._timelineDrag()) return;
    const value481 = value479 === 'audio' ? 'audio' : 'video',
      value482 = this._mediaClip.activeTrack;
    (this._pausePreviewPlayback({ updateControls: false }), (this._materialMenu = null));
    let activeTrack4 = this._mediaClip,
      value483 = '';
    if (value481 === 'audio') {
      if (!this._mediaClip.tracks?.audio) return;
      const list40 = this._audioTimelineClips(this._mediaClip.tracks?.audio),
        value484 = Math.max(
          0,
          Math.min(list40.length - 1, Math.trunc(toNumber(value480, 0))),
        ),
        enabled41 = list40[value484];
      if (!enabled41) return;
      const value485 = this._audioClipSource(enabled41, value484),
        text17 = normalizeText(enabled41.sourceId || value485?.id),
        text18 = normalizeText(enabled41.sourceKey || resolveMediaClipLocalPath(value485));
      ((value483 = this._edgeIdForMaterial('audio', value484)),
        (activeTrack4 = removeMediaClipAudioClip(this._mediaClip, value484)));
      const list41 = Array.isArray(activeTrack4.audioClips) ? activeTrack4.audioClips : [],
        value486 = list41.some((value487) => {
          const text19 = normalizeText(value487?.sourceId),
            text20 = normalizeText(value487?.sourceKey);
          return (text17 && text19 === text17) || (text18 && text20 === text18);
        });
      if (value486) value483 = '';
      ((this._activeAudioClipIndex = list41.length
        ? Math.max(0, Math.min(list41.length - 1, value484))
        : 0),
        (this._selectedAudioClipIndex = list41.length ? this._activeAudioClipIndex : -1),
        (activeTrack4 = {
          ...activeTrack4,
          activeTrack: activeTrack4.tracks?.video
            ? 'video'
            : activeTrack4.tracks?.audio
              ? 'audio'
              : 'video',
          expanded:
            !!(activeTrack4.tracks?.video || activeTrack4.tracks?.audio) &&
            this._mediaClip.expanded === true,
        }));
    } else {
      const list42 = this._videoTimelineClips(this._mediaClip.tracks?.video),
        value488 = Math.max(
          0,
          Math.min(list42.length - 1, Math.trunc(toNumber(value480, 0))),
        ),
        enabled42 = list42[value488];
      if (!enabled42) return;
      const value489 = this._videoClipSource(enabled42, value488),
        text21 = normalizeText(enabled42.sourceId || value489?.id),
        text22 = normalizeText(enabled42.sourceKey || resolveMediaClipLocalPath(value489));
      ((value483 = this._edgeIdForMaterial('video', value488)),
        (activeTrack4 = removeMediaClipClip(this._mediaClip, value488)));
      const list43 = Array.isArray(activeTrack4.clips) ? activeTrack4.clips : [],
        value490 = list43.some((value491) => {
          const text23 = normalizeText(value491?.sourceId),
            text24 = normalizeText(value491?.sourceKey);
          return (text21 && text23 === text21) || (text22 && text24 === text22);
        });
      if (value490) value483 = '';
      ((this._activeClipIndex = list43.length
        ? Math.max(0, Math.min(list43.length - 1, value488))
        : 0),
        (this._selectedClipIndex = list43.length ? this._activeClipIndex : -1),
        (activeTrack4 = {
          ...activeTrack4,
          activeTrack: activeTrack4.tracks?.video
            ? 'video'
            : activeTrack4.tracks?.audio
              ? 'audio'
              : 'video',
          expanded:
            !!(activeTrack4.tracks?.video || activeTrack4.tracks?.audio) &&
            this._mediaClip.expanded === true,
        }));
    }
    const value492 = activeTrack4.expanded !== true || value482 !== activeTrack4.activeTrack;
    this._setMediaClipWithLayout(activeTrack4, false, { render: false });
    value483 &&
      typeof appStore.removeEdge === 'function' &&
      ((this._skipNextIncomingMediaClipRender = true),
      appStore.removeEdge(value483),
      this._skipNextIncomingMediaClipRender === true && (this._skipNextIncomingMediaClipRender = false));
    commit();
    if (value492) this._render();
    else this._refreshMediaClipTimelineInPlace();
  }
  ['_singleVisualClipExportTrack'](options21 = {}) {
    return singleVisualClipExportTrack(options21);
  }
  ['_exportVisualClips'](value493 = this._mediaClip.tracks?.video) {
    return exportVisualClips(this, value493);
  }
  ['_firstExportVideoSource'](list44 = []) {
    return firstExportVideoSource(this, list44);
  }
  ['_exportVisualDurationSec'](list45 = []) {
    return exportVisualDurationSec(list45);
  }
  ['_exportAudioClips'](value494 = this._mediaClip.tracks?.audio) {
    return exportAudioClips(this, value494);
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
  async ['_exportMaterialToCanvas'](value495 = 'video', value496 = 0) {
    return exportMaterialToCanvas(this, value495, value496);
  }
  ['_renderDownloadMenu']() {
    return renderDownloadMenu(this);
  }
  async ['_exportAndUse'](value497) {
    return exportAndUse(this, value497);
  }
  ['_resolveOutputNodePosition'](value498, value499) {
    return resolveOutputNodePosition(this, value498, value499);
  }
  ['_addImageOutputNodeFromSource'](options22 = {}, value500 = {}) {
    return addImageOutputNodeFromSource(this, options22, value500);
  }
  ['_addOutputNode'](value501, value502 = {}, value503 = {}) {
    return addOutputNode(this, value501, value502, value503);
  }
}
