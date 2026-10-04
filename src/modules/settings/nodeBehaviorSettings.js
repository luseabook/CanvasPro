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
  const runtimeRoot = getRuntimeRoot();
  try {
    if (runtimeRoot?.localStorage) return runtimeRoot.localStorage;
  } catch {}
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch {}
  return null;
}
function normalizePercent(value, item) {
  if (value === null || value === undefined || value === '') return item;
  const key = Number(value);
  if (!Number.isFinite(key)) return item;
  return Math.max(0, Math.min(100, Math.round(key)));
}
function readPercentPref(index, result) {
  let runtimeStorage = null;
  try {
    runtimeStorage = getRuntimeStorage()?.getItem(index) ?? null;
  } catch {}
  return normalizePercent(runtimeStorage, result);
}
function writePercentPref(data, options, target) {
  const percent = normalizePercent(options, target);
  try {
    getRuntimeStorage()?.setItem(data, String(percent));
  } catch {}
  return percent;
}
export function readCommentNoteJumpFocusPref() {
  return {
    viewportAlignX:
      readPercentPref(COMMENT_NOTE_JUMP_FOCUS_X_STORAGE_KEY, DEFAULT_COMMENT_NOTE_JUMP_FOCUS_X_PERCENT) / 100,
    viewportAlignY:
      readPercentPref(COMMENT_NOTE_JUMP_FOCUS_Y_STORAGE_KEY, DEFAULT_COMMENT_NOTE_JUMP_FOCUS_Y_PERCENT) / 100,
  };
}
export function applyImageVideoNodeResizePref(source) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('v2-wrap');
  if (!el) return;
  el.classList.toggle('v2-media-node-resize-enabled', source === true);
}
function syncButtonPair(next, current, entry) {
  if (typeof document === 'undefined') return;
  const enabled = entry === true;
  (document.getElementById(next)?.classList.toggle('active', enabled),
    document.getElementById(current)?.classList.toggle('active', !enabled));
}
function normalizePromptEnterBehavior(record) {
  return record === 'newline' ? 'newline' : 'submit';
}
function syncPromptEnterBehaviorButtons(payload) {
  if (typeof document === 'undefined') return;
  const promptEnterBehavior = normalizePromptEnterBehavior(payload);
  document.querySelectorAll('#promptEnterBehaviorGroup .cursor-size-btn').forEach((el2) => {
    el2.classList.toggle('active', el2.dataset.promptEnterBehavior === promptEnterBehavior);
  });
}
function syncNodeAvoidOverlapButtons(handle) {
  if (typeof document === 'undefined') return;
  const state = handle !== false;
  document.querySelectorAll('#nodeAvoidOverlapGroup .cursor-size-btn').forEach((el3) => {
    const config = el3.dataset.avoid === 'on';
    el3.classList.toggle('active', config === state);
  });
}
export function setVideoMetaPref(scope, input = appStore) {
  const output = scope === true;
  return (
    input.setShowVideoMeta(output),
    syncButtonPair('btnVideoMetaOn', 'btnVideoMetaOff', output),
    output
  );
}
export function setImageVideoNodeResizePref(value2, value3 = appStore) {
  const value4 = value2 === true;
  return (
    value3.setImageVideoNodeResizeEnabled(value4),
    applyImageVideoNodeResizePref(value4),
    syncButtonPair('btnMediaNodeResizeOn', 'btnMediaNodeResizeOff', value4),
    value4
  );
}
export function setTitleFollowsCanvasZoomPref(value5, value6 = appStore) {
  const value7 = value5 === true;
  return (
    value6.setTitleFollowsCanvasZoom(value7),
    syncButtonPair('btnTitleFollowsZoomOn', 'btnTitleFollowsZoomOff', value7),
    value7
  );
}
export function setPromptBoxResizePref(value8, value9 = appStore) {
  const value10 = value8 !== false;
  return (
    value9.setPromptBoxResizeEnabled(value10),
    syncButtonPair('btnPromptBoxResizeOn', 'btnPromptBoxResizeOff', value10),
    value10
  );
}
export function setPromptEnterBehaviorPref(value11, value12 = appStore) {
  const promptEnterBehavior2 = normalizePromptEnterBehavior(value11);
  return (
    value12.setPromptEnterBehavior(promptEnterBehavior2),
    syncPromptEnterBehaviorButtons(promptEnterBehavior2),
    promptEnterBehavior2
  );
}
export function applyPromptAttachmentButtonHiddenPref(value13) {
  if (typeof document === 'undefined') return;
  const el4 = document.getElementById('v2-wrap');
  if (!el4) return;
  el4.classList.toggle('prompt-attachment-button-hidden', value13 === true);
}
export function setPromptAttachmentButtonHiddenPref(value14, store = appStore) {
  const value15 = value14 === true;
  return (
    store.setPromptAttachmentButtonHidden(value15),
    applyPromptAttachmentButtonHiddenPref(value15),
    syncButtonPair('btnPromptAttachmentButtonHiddenYes', 'btnPromptAttachmentButtonHiddenNo', value15),
    value15 && store.getState?.()?.pickConnectMode?.active && store.setPickConnectMode?.({ active: false }),
    value15
  );
}
export function setNodeAvoidOverlapPref(value16) {
  const value17 = value16 !== false,
    value18 = typeof window !== 'undefined' ? window : globalThis;
  value18.v2NodeAvoidOverlap = value17;
  try {
    value18?.localStorage?.setItem('v2-node-avoid-overlap', value17 ? '1' : '0');
  } catch {}
  return (syncNodeAvoidOverlapButtons(value17), value17);
}
function initVideoMeta() {
  const el5 = document.getElementById('btnVideoMetaOn'),
    el6 = document.getElementById('btnVideoMetaOff');
  if (!el5 || !el6) return;
  const value19 = appStore.getState(),
    value20 = value19?.ui?.showVideoMeta === true;
  (setVideoMetaPref(value20),
    el5.addEventListener('click', () => setVideoMetaPref(true)),
    el6.addEventListener('click', () => setVideoMetaPref(false)));
}
function initImageVideoNodeResize() {
  const el7 = document.getElementById('btnMediaNodeResizeOn'),
    el8 = document.getElementById('btnMediaNodeResizeOff');
  if (!el7 || !el8) return;
  const value21 = appStore.getState(),
    value22 = value21?.ui?.imageVideoNodeResizeEnabled === true;
  (setImageVideoNodeResizePref(value22),
    el7.addEventListener('click', () => setImageVideoNodeResizePref(true)),
    el8.addEventListener('click', () => setImageVideoNodeResizePref(false)));
}
function initTitleFollowsCanvasZoom() {
  const el9 = document.getElementById('btnTitleFollowsZoomOn'),
    el10 = document.getElementById('btnTitleFollowsZoomOff');
  if (!el9 || !el10) return;
  const value23 = appStore.getState(),
    value24 = value23?.ui?.titleFollowsCanvasZoom === true;
  (setTitleFollowsCanvasZoomPref(value24),
    el9.addEventListener('click', () => setTitleFollowsCanvasZoomPref(true)),
    el10.addEventListener('click', () => setTitleFollowsCanvasZoomPref(false)));
}
function initPromptBoxResize() {
  const el11 = document.getElementById('btnPromptBoxResizeOn'),
    el12 = document.getElementById('btnPromptBoxResizeOff');
  if (!el11 || !el12) return;
  const value25 = appStore.getState(),
    value26 = value25?.ui?.promptBoxResizeEnabled !== false;
  (setPromptBoxResizePref(value26),
    el11.addEventListener('click', () => setPromptBoxResizePref(true)),
    el12.addEventListener('click', () => setPromptBoxResizePref(false)));
}
function initPromptEnterBehavior() {
  const enabled2 = document.getElementById('promptEnterBehaviorGroup');
  if (!enabled2) return;
  const value27 = appStore.getState(),
    promptEnterBehavior3 = normalizePromptEnterBehavior(value27?.ui?.promptEnterBehavior);
  (setPromptEnterBehaviorPref(promptEnterBehavior3),
    document.querySelectorAll('#promptEnterBehaviorGroup .cursor-size-btn').forEach((el13) => {
      el13.addEventListener('click', () => setPromptEnterBehaviorPref(el13.dataset.promptEnterBehavior));
    }));
}
function initPromptAttachmentButtonHidden() {
  const el14 = document.getElementById('btnPromptAttachmentButtonHiddenNo'),
    el15 = document.getElementById('btnPromptAttachmentButtonHiddenYes');
  if (!el14 || !el15) return;
  const value28 = appStore.getState(),
    value29 = value28?.ui?.promptAttachmentButtonHidden === true;
  (setPromptAttachmentButtonHiddenPref(value29),
    el14.addEventListener('click', () => setPromptAttachmentButtonHiddenPref(false)),
    el15.addEventListener('click', () => setPromptAttachmentButtonHiddenPref(true)));
}
function initCommentNoteJumpFocus() {
  const run = ({ sliderId: sliderId, valueId: valueId, storageKey: storageKey, fallback: fallback }) => {
    const el16 = document.getElementById(sliderId),
      el17 = document.getElementById(valueId);
    if (!el16) return;
    const run2 = (value30) => {
      const percent2 = normalizePercent(value30, fallback);
      el16.value = String(percent2);
      if (el17) el17.textContent = percent2 + '%';
      return percent2;
    };
    (run2(readPercentPref(storageKey, fallback)),
      el16.addEventListener('input', (event) => {
        run2(event.target?.value);
      }),
      el16.addEventListener('change', (event2) => {
        run2(writePercentPref(storageKey, event2.target?.value, fallback));
      }));
  };
  (run({
    sliderId: 'commentNoteJumpFocusXSlider',
    valueId: 'commentNoteJumpFocusXValue',
    storageKey: COMMENT_NOTE_JUMP_FOCUS_X_STORAGE_KEY,
    fallback: DEFAULT_COMMENT_NOTE_JUMP_FOCUS_X_PERCENT,
  }),
    run({
      sliderId: 'commentNoteJumpFocusYSlider',
      valueId: 'commentNoteJumpFocusYValue',
      storageKey: COMMENT_NOTE_JUMP_FOCUS_Y_STORAGE_KEY,
      fallback: DEFAULT_COMMENT_NOTE_JUMP_FOCUS_Y_PERCENT,
    }));
}
function initNodeSpacing() {
  const el18 = document.getElementById('nodeSpacingSlider'),
    el19 = document.getElementById('nodeSpacingValue');
  let value31 = parseInt(localStorage.getItem('v2-node-spacing'), 10);
  if (isNaN(value31)) value31 = 120;
  window.v2NodeSpacing = value31;
  if (el18) {
    el18.value = value31;
    if (el19) el19.textContent = value31;
  }
  (el18?.addEventListener('input', (event3) => {
    const value32 = parseInt(event3.target.value, 10);
    if (el19) el19.textContent = value32;
  }),
    el18?.addEventListener('change', (event4) => {
      const value33 = parseInt(event4.target.value, 10);
      ((window.v2NodeSpacing = value33), localStorage.setItem('v2-node-spacing', value33));
    }));
}
function initNodeDirection() {
  const value34 = localStorage.getItem('v2-node-direction') || 'right';
  window.v2NodeDirection = value34;
  const list = document.querySelectorAll('#nodeDirectionGroup .cursor-size-btn');
  list.forEach((el20) => {
    (el20.classList.toggle('active', el20.dataset.dir === value34),
      el20.addEventListener('click', () => {
        (list.forEach((el21) => el21.classList.remove('active')),
          el20.classList.add('active'),
          (window.v2NodeDirection = el20.dataset.dir),
          localStorage.setItem('v2-node-direction', el20.dataset.dir));
      }));
  });
}
function initNodeAvoidOverlap() {
  const value35 = localStorage.getItem('v2-node-avoid-overlap');
  let value36 = true;
  value35 == null
    ? localStorage.setItem('v2-node-avoid-overlap', '1')
    : (value36 = value35 === '1' || value35 === 'true');
  setNodeAvoidOverlapPref(value36);
  const list2 = document.querySelectorAll('#nodeAvoidOverlapGroup .cursor-size-btn');
  list2.forEach((el22) => {
    el22.addEventListener('click', () => {
      setNodeAvoidOverlapPref(el22.dataset.avoid === 'on');
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
