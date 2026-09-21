import appStore from '../../core/stores/appStore.js';
const COMMENT_NOTE_JUMP_FOCUS_X_STORAGE_KEY = 'v2-comment-note-jump-focus-x',
  COMMENT_NOTE_JUMP_FOCUS_Y_STORAGE_KEY = 'v2-comment-note-jump-focus-y',
  DEFAULT_COMMENT_NOTE_JUMP_FOCUS_X_PERCENT = 50,
  DEFAULT_COMMENT_NOTE_JUMP_FOCUS_Y_PERCENT = 20;
function getRuntimeRoot() {
  if (typeof window !== 'undefined') return window;
  return globalThis;
}
function getRuntimeStorage() {
  const _0x2173ab = getRuntimeRoot();
  try {
    if (_0x2173ab?.localStorage) return _0x2173ab.localStorage;
  } catch {}
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch {}
  return null;
}
function normalizePercent(_0x5e452f, _0x2d08ed) {
  if (_0x5e452f === null || _0x5e452f === undefined || _0x5e452f === '') return _0x2d08ed;
  const _0x14469f = Number(_0x5e452f);
  if (!Number.isFinite(_0x14469f)) return _0x2d08ed;
  return Math.max(0, Math.min(100, Math.round(_0x14469f)));
}
function readPercentPref(_0x542d3d, _0x24c60f) {
  let _0x7fbe81 = null;
  try {
    _0x7fbe81 = getRuntimeStorage()?.getItem(_0x542d3d) ?? null;
  } catch {}
  return normalizePercent(_0x7fbe81, _0x24c60f);
}
function writePercentPref(_0x8610f, _0x536087, _0x5e23e4) {
  const _0x354d83 = normalizePercent(_0x536087, _0x5e23e4);
  try {
    getRuntimeStorage()?.setItem(_0x8610f, String(_0x354d83));
  } catch {}
  return _0x354d83;
}
export function readCommentNoteJumpFocusPref() {
  return {
    viewportAlignX:
      readPercentPref(COMMENT_NOTE_JUMP_FOCUS_X_STORAGE_KEY, DEFAULT_COMMENT_NOTE_JUMP_FOCUS_X_PERCENT) / 100,
    viewportAlignY:
      readPercentPref(COMMENT_NOTE_JUMP_FOCUS_Y_STORAGE_KEY, DEFAULT_COMMENT_NOTE_JUMP_FOCUS_Y_PERCENT) / 100,
  };
}
export function applyImageVideoNodeResizePref(_0x2416f2) {
  if (typeof document === 'undefined') return;
  const _0xf99069 = document.getElementById('v2-wrap');
  if (!_0xf99069) return;
  _0xf99069.classList.toggle('v2-media-node-resize-enabled', _0x2416f2 === true);
}
function syncButtonPair(_0x4e51d4, _0x26482b, _0x2275f4) {
  if (typeof document === 'undefined') return;
  const _0x184d6f = _0x2275f4 === true;
  (document.getElementById(_0x4e51d4)?.classList.toggle('active', _0x184d6f),
    document.getElementById(_0x26482b)?.classList.toggle('active', !_0x184d6f));
}
function normalizePromptEnterBehavior(_0x575c7f) {
  return _0x575c7f === 'newline' ? 'newline' : 'submit';
}
function syncPromptEnterBehaviorButtons(_0x179e39) {
  if (typeof document === 'undefined') return;
  const _0x238c2d = normalizePromptEnterBehavior(_0x179e39);
  document.querySelectorAll('#promptEnterBehaviorGroup .cursor-size-btn').forEach((_0x23e3dd) => {
    _0x23e3dd.classList.toggle('active', _0x23e3dd.dataset.promptEnterBehavior === _0x238c2d);
  });
}
function syncNodeAvoidOverlapButtons(_0x2b6da6) {
  if (typeof document === 'undefined') return;
  const _0x3c3225 = _0x2b6da6 !== false;
  document.querySelectorAll('#nodeAvoidOverlapGroup .cursor-size-btn').forEach((_0x2570d6) => {
    const _0x1d73c6 = _0x2570d6.dataset.avoid === 'on';
    _0x2570d6.classList.toggle('active', _0x1d73c6 === _0x3c3225);
  });
}
export function setVideoMetaPref(_0x1df58a, _0x5d41d2 = appStore) {
  const _0x12bf43 = _0x1df58a === true;
  return (
    _0x5d41d2.setShowVideoMeta(_0x12bf43),
    syncButtonPair('btnVideoMetaOn', 'btnVideoMetaOff', _0x12bf43),
    _0x12bf43
  );
}
export function setImageVideoNodeResizePref(_0x49d4dc, _0x44b22c = appStore) {
  const _0x33cd73 = _0x49d4dc === true;
  return (
    _0x44b22c.setImageVideoNodeResizeEnabled(_0x33cd73),
    applyImageVideoNodeResizePref(_0x33cd73),
    syncButtonPair('btnMediaNodeResizeOn', 'btnMediaNodeResizeOff', _0x33cd73),
    _0x33cd73
  );
}
export function setTitleFollowsCanvasZoomPref(_0x4ae617, _0x236a72 = appStore) {
  const _0x484fcc = _0x4ae617 === true;
  return (
    _0x236a72.setTitleFollowsCanvasZoom(_0x484fcc),
    syncButtonPair('btnTitleFollowsZoomOn', 'btnTitleFollowsZoomOff', _0x484fcc),
    _0x484fcc
  );
}
export function setPromptBoxResizePref(_0x147be9, _0x1e829a = appStore) {
  const _0x563938 = _0x147be9 !== false;
  return (
    _0x1e829a.setPromptBoxResizeEnabled(_0x563938),
    syncButtonPair('btnPromptBoxResizeOn', 'btnPromptBoxResizeOff', _0x563938),
    _0x563938
  );
}
export function setPromptEnterBehaviorPref(_0x11372f, _0x2431ec = appStore) {
  const _0x2db544 = normalizePromptEnterBehavior(_0x11372f);
  return (_0x2431ec.setPromptEnterBehavior(_0x2db544), syncPromptEnterBehaviorButtons(_0x2db544), _0x2db544);
}
export function applyPromptAttachmentButtonHiddenPref(_0x6d0f5b) {
  if (typeof document === 'undefined') return;
  const _0x715ed = document.getElementById('v2-wrap');
  if (!_0x715ed) return;
  _0x715ed.classList.toggle('prompt-attachment-button-hidden', _0x6d0f5b === true);
}
export function setPromptAttachmentButtonHiddenPref(_0x6251b0, _0x5eb689 = appStore) {
  const _0x2ada3b = _0x6251b0 === true;
  return (
    _0x5eb689.setPromptAttachmentButtonHidden(_0x2ada3b),
    applyPromptAttachmentButtonHiddenPref(_0x2ada3b),
    syncButtonPair('btnPromptAttachmentButtonHiddenYes', 'btnPromptAttachmentButtonHiddenNo', _0x2ada3b),
    _0x2ada3b &&
      _0x5eb689.getState?.()?.pickConnectMode?.active &&
      _0x5eb689.setPickConnectMode?.({ active: false }),
    _0x2ada3b
  );
}
export function setNodeAvoidOverlapPref(_0x5e50f3) {
  const _0x34c725 = _0x5e50f3 !== false,
    _0x303bf1 = typeof window !== 'undefined' ? window : globalThis;
  _0x303bf1.v2NodeAvoidOverlap = _0x34c725;
  try {
    _0x303bf1?.localStorage?.setItem('v2-node-avoid-overlap', _0x34c725 ? '1' : '0');
  } catch {}
  return (syncNodeAvoidOverlapButtons(_0x34c725), _0x34c725);
}
function initVideoMeta() {
  const _0x1b3a0f = document.getElementById('btnVideoMetaOn'),
    _0x2ce4cc = document.getElementById('btnVideoMetaOff');
  if (!_0x1b3a0f || !_0x2ce4cc) return;
  const _0x5e37b7 = appStore.getState(),
    _0x53e1cf = _0x5e37b7?.ui?.showVideoMeta === true;
  (setVideoMetaPref(_0x53e1cf),
    _0x1b3a0f.addEventListener('click', () => setVideoMetaPref(true)),
    _0x2ce4cc.addEventListener('click', () => setVideoMetaPref(false)));
}
function initImageVideoNodeResize() {
  const _0x4d80e7 = document.getElementById('btnMediaNodeResizeOn'),
    _0x3fca23 = document.getElementById('btnMediaNodeResizeOff');
  if (!_0x4d80e7 || !_0x3fca23) return;
  const _0x3e1d45 = appStore.getState(),
    _0x21893a = _0x3e1d45?.ui?.imageVideoNodeResizeEnabled === true;
  (setImageVideoNodeResizePref(_0x21893a),
    _0x4d80e7.addEventListener('click', () => setImageVideoNodeResizePref(true)),
    _0x3fca23.addEventListener('click', () => setImageVideoNodeResizePref(false)));
}
function initTitleFollowsCanvasZoom() {
  const _0x372ffa = document.getElementById('btnTitleFollowsZoomOn'),
    _0x16db4e = document.getElementById('btnTitleFollowsZoomOff');
  if (!_0x372ffa || !_0x16db4e) return;
  const _0x59c798 = appStore.getState(),
    _0x5f0bb2 = _0x59c798?.ui?.titleFollowsCanvasZoom === true;
  (setTitleFollowsCanvasZoomPref(_0x5f0bb2),
    _0x372ffa.addEventListener('click', () => setTitleFollowsCanvasZoomPref(true)),
    _0x16db4e.addEventListener('click', () => setTitleFollowsCanvasZoomPref(false)));
}
function initPromptBoxResize() {
  const _0x3297e9 = document.getElementById('btnPromptBoxResizeOn'),
    _0x4c7e3f = document.getElementById('btnPromptBoxResizeOff');
  if (!_0x3297e9 || !_0x4c7e3f) return;
  const _0x4335f3 = appStore.getState(),
    _0x153f65 = _0x4335f3?.ui?.promptBoxResizeEnabled !== false;
  (setPromptBoxResizePref(_0x153f65),
    _0x3297e9.addEventListener('click', () => setPromptBoxResizePref(true)),
    _0x4c7e3f.addEventListener('click', () => setPromptBoxResizePref(false)));
}
function initPromptEnterBehavior() {
  const _0x30bee8 = document.getElementById('promptEnterBehaviorGroup');
  if (!_0x30bee8) return;
  const _0x36f698 = appStore.getState(),
    _0x20dda6 = normalizePromptEnterBehavior(_0x36f698?.ui?.promptEnterBehavior);
  (setPromptEnterBehaviorPref(_0x20dda6),
    document.querySelectorAll('#promptEnterBehaviorGroup .cursor-size-btn').forEach((_0x36123a) => {
      _0x36123a.addEventListener('click', () =>
        setPromptEnterBehaviorPref(_0x36123a.dataset.promptEnterBehavior),
      );
    }));
}
function initPromptAttachmentButtonHidden() {
  const _0x20b2bb = document.getElementById('btnPromptAttachmentButtonHiddenNo'),
    _0x10896b = document.getElementById('btnPromptAttachmentButtonHiddenYes');
  if (!_0x20b2bb || !_0x10896b) return;
  const _0x2d312c = appStore.getState(),
    _0x4cf764 = _0x2d312c?.ui?.promptAttachmentButtonHidden === true;
  (setPromptAttachmentButtonHiddenPref(_0x4cf764),
    _0x20b2bb.addEventListener('click', () => setPromptAttachmentButtonHiddenPref(false)),
    _0x10896b.addEventListener('click', () => setPromptAttachmentButtonHiddenPref(true)));
}
function initCommentNoteJumpFocus() {
  const _0x4d5959 = ({
    sliderId: _0x3a6986,
    valueId: _0x5d8750,
    storageKey: _0x3f2940,
    fallback: _0xbdb5f3,
  }) => {
    const _0x27fa6c = document.getElementById(_0x3a6986),
      _0x59bb50 = document.getElementById(_0x5d8750);
    if (!_0x27fa6c) return;
    const _0x525ae1 = (_0x4fc161) => {
      const _0x312c5e = normalizePercent(_0x4fc161, _0xbdb5f3);
      _0x27fa6c.value = String(_0x312c5e);
      if (_0x59bb50) _0x59bb50.textContent = _0x312c5e + '%';
      return _0x312c5e;
    };
    (_0x525ae1(readPercentPref(_0x3f2940, _0xbdb5f3)),
      _0x27fa6c.addEventListener('input', (_0x1c4760) => {
        _0x525ae1(_0x1c4760.target?.value);
      }),
      _0x27fa6c.addEventListener('change', (_0xbcf3f) => {
        _0x525ae1(writePercentPref(_0x3f2940, _0xbcf3f.target?.value, _0xbdb5f3));
      }));
  };
  (_0x4d5959({
    sliderId: 'commentNoteJumpFocusXSlider',
    valueId: 'commentNoteJumpFocusXValue',
    storageKey: COMMENT_NOTE_JUMP_FOCUS_X_STORAGE_KEY,
    fallback: DEFAULT_COMMENT_NOTE_JUMP_FOCUS_X_PERCENT,
  }),
    _0x4d5959({
      sliderId: 'commentNoteJumpFocusYSlider',
      valueId: 'commentNoteJumpFocusYValue',
      storageKey: COMMENT_NOTE_JUMP_FOCUS_Y_STORAGE_KEY,
      fallback: DEFAULT_COMMENT_NOTE_JUMP_FOCUS_Y_PERCENT,
    }));
}
function initNodeSpacing() {
  const _0x21727c = document.getElementById('nodeSpacingSlider'),
    _0x44ba03 = document.getElementById('nodeSpacingValue');
  let _0x26d7c3 = parseInt(localStorage.getItem('v2-node-spacing'), 10);
  if (isNaN(_0x26d7c3)) _0x26d7c3 = 120;
  window.v2NodeSpacing = _0x26d7c3;
  if (_0x21727c) {
    _0x21727c.value = _0x26d7c3;
    if (_0x44ba03) _0x44ba03.textContent = _0x26d7c3;
  }
  (_0x21727c?.addEventListener('input', (_0x391be0) => {
    const _0x5dd362 = parseInt(_0x391be0.target.value, 10);
    if (_0x44ba03) _0x44ba03.textContent = _0x5dd362;
  }),
    _0x21727c?.addEventListener('change', (_0x5126a7) => {
      const _0x40af26 = parseInt(_0x5126a7.target.value, 10);
      ((window.v2NodeSpacing = _0x40af26), localStorage.setItem('v2-node-spacing', _0x40af26));
    }));
}
function initNodeDirection() {
  const _0x34d402 = localStorage.getItem('v2-node-direction') || 'right';
  window.v2NodeDirection = _0x34d402;
  const _0xf8eb1b = document.querySelectorAll('#nodeDirectionGroup .cursor-size-btn');
  _0xf8eb1b.forEach((_0x417dd6) => {
    (_0x417dd6.classList.toggle('active', _0x417dd6.dataset.dir === _0x34d402),
      _0x417dd6.addEventListener('click', () => {
        (_0xf8eb1b.forEach((_0x477ed9) => _0x477ed9.classList.remove('active')),
          _0x417dd6.classList.add('active'),
          (window.v2NodeDirection = _0x417dd6.dataset.dir),
          localStorage.setItem('v2-node-direction', _0x417dd6.dataset.dir));
      }));
  });
}
function initNodeAvoidOverlap() {
  const _0x3f8101 = localStorage.getItem('v2-node-avoid-overlap');
  let _0x3fcbb1 = true;
  _0x3f8101 == null
    ? localStorage.setItem('v2-node-avoid-overlap', '1')
    : (_0x3fcbb1 = _0x3f8101 === '1' || _0x3f8101 === 'true');
  setNodeAvoidOverlapPref(_0x3fcbb1);
  const _0x14b364 = document.querySelectorAll('#nodeAvoidOverlapGroup .cursor-size-btn');
  _0x14b364.forEach((_0x1c7d9b) => {
    _0x1c7d9b.addEventListener('click', () => {
      setNodeAvoidOverlapPref(_0x1c7d9b.dataset.avoid === 'on');
    });
  });
}
export function initNodeBehaviorSettings() {
  (initVideoMeta(),
    initImageVideoNodeResize(),
    initTitleFollowsCanvasZoom(),
    initPromptBoxResize(),
    initPromptEnterBehavior(),
    initPromptAttachmentButtonHidden(),
    initCommentNoteJumpFocus(),
    initNodeSpacing(),
    initNodeDirection(),
    initNodeAvoidOverlap());
}
