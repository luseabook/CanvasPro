import appStore from '../core/stores/appStore.js';
import { setVideoKeyingMediaKeepAlive } from './videoKeyingMediaHelpers.js';
import { videoKeyingText } from './videoKeyingTextHelpers.js';
export const videoKeyingLifecycleMethods = {
  exit({ silent: silent = false, preserveRh: preserveRh = false } = {}) {
    if (!this.active) return;
    const _0x4f1669 = this.nodeId,
      _0x325d3b = this._isRemoveUiMode();
    this.active = false;
    !preserveRh && void this._cancelRhTaskForSourceNode(_0x4f1669);
    this._onKeyingSettingsDocDown &&
      (document.removeEventListener('pointerdown', this._onKeyingSettingsDocDown, true),
      (this._onKeyingSettingsDocDown = null));
    (this._thumbToken++,
      this._sourceToken++,
      appStore.setVideoKeyingState({ active: false, nodeId: null, pos_points: [], neg_points: [] }));
    if (this._playheadRaf) cancelAnimationFrame(this._playheadRaf);
    this._playheadRaf = 0;
    if (this._retryRaf) cancelAnimationFrame(this._retryRaf);
    this._retryRaf = 0;
    if (this.videoEl) {
      setVideoKeyingMediaKeepAlive(this.videoEl, false);
      if (this._onLoadedMeta) this.videoEl.removeEventListener('loadedmetadata', this._onLoadedMeta);
      if (this._onDurationChange) this.videoEl.removeEventListener('durationchange', this._onDurationChange);
    }
    this._onKeyDown &&
      (window.removeEventListener('keydown', this._onKeyDown, true), (this._onKeyDown = null));
    this._onResize && (window.removeEventListener('resize', this._onResize), (this._onResize = null));
    const _0x2f3fe5 = this.trackEl;
    if (_0x2f3fe5 && this._onPointerMove) _0x2f3fe5.removeEventListener('pointermove', this._onPointerMove);
    if (_0x2f3fe5 && this._onPointerUp) _0x2f3fe5.removeEventListener('pointerup', this._onPointerUp);
    if (_0x2f3fe5 && this._onPointerCancel)
      _0x2f3fe5.removeEventListener('pointercancel', this._onPointerCancel);
    if (_0x2f3fe5 && this._onPointerCancel)
      _0x2f3fe5.removeEventListener('lostpointercapture', this._onPointerCancel);
    ((this._onPointerMove = null), (this._onPointerUp = null), (this._onPointerCancel = null));
    this._onDocClick &&
      (document.removeEventListener('pointerdown', this._onDocClick, true), (this._onDocClick = null));
    this.wrapperEl &&
      this._onVideoPlay &&
      (this.wrapperEl.removeEventListener('play', this._onVideoPlay, true),
      this.wrapperEl.removeEventListener('playing', this._onVideoPlay, true));
    ((this._onVideoPlay = null), this._detachMarkLayerListeners());
    if (this._removeCursorRaf) cancelAnimationFrame(this._removeCursorRaf);
    this._removeCursorRaf = 0;
    this._onShortcutsUpdated &&
      (window.removeEventListener('shortcuts-updated', this._onShortcutsUpdated),
      (this._onShortcutsUpdated = null));
    this._unsubscribeLocale && (this._unsubscribeLocale(), (this._unsubscribeLocale = null));
    ((this._onMarkPointerDown = null),
      (this._onMarkPointerMove = null),
      (this._onMarkPointerUp = null),
      (this._onMarkPointerCancel = null),
      (this._onMarkPointerEnter = null),
      (this._onMarkPointerLeave = null),
      (this._renderMarksFn = null),
      this._applyFrozenUI(false),
      this._applyDimMode(false),
      (this.durationSec = 0),
      (this.nodeId = null),
      (this.videoEl = null));
    if (this.markLayerEl) this.markLayerEl.remove();
    this._removeWheelCleanup && (this._removeWheelCleanup(), (this._removeWheelCleanup = null));
    ((this.markLayerEl = null),
      (this.markCanvasEl = null),
      (this.removeMaskCanvasEl = null),
      (this.removeCursorEl = null),
      (this.removeSizeValueEl = null),
      (this.removeSizeRangeEl = null),
      (this._onMarkWheel = null),
      (this._marks = null),
      (this._marksRedo = null),
      (this._removeDraft = null),
      (this._removeDrawPointerId = null),
      (this._removeCursorHover = false),
      (this._removeCursorLast = { x: 0, y: 0 }),
      (this.trackEl = null),
      (this.playheadEl = null),
      (this.cancelBtnEl = null),
      (this.confirmBtnEl = null),
      (this.helperRightEl = null));
    if (this.hintEl) this.hintEl.remove();
    this.hintEl = null;
    if (this.removeToolbarEl) this.removeToolbarEl.remove();
    ((this.removeToolbarEl = null),
      (this.thumbEls = null),
      (this._lastFrameIndex = null),
      (this._lastFrameIndexFps = null),
      (this._lastHelperRightText = null),
      (this._lastConfirmEnabled = null),
      (this.uiMode = 'keying'),
      (this._removePointTool = 'foreground'),
      (this._removeBrushSizePx = 40));
    if (this.barEl) this.barEl.remove();
    ((this.barEl = null),
      (this.wrapperEl = null),
      !silent &&
        window.showToast?.(
          _0x325d3b ? videoKeyingText('toasts.removeClosed') : videoKeyingText('toasts.keyingClosed'),
          'info',
        ));
  },
};
