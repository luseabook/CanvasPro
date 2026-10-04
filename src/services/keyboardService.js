import appStore from '../core/stores/appStore.js';
import { getShortcuts, handleShortcutKeydown, isRecording } from '../modules/shortcuts.js';
import {
  buildJumpShortcutBinding,
  normalizeCommentNoteJumpShortcut,
  parseJumpShortcutFromKeydown,
} from '../modules/commentNoteJumpShortcut.js';
import { hasActiveReadonlyTextSelection } from '../components/aigenText/readonlyTextSelection.js';
import { getSelectedSyncPlayableVideoCount } from '../modules/videoSyncPlayback.js';
let _spaceHeld = false,
  _listeners = [];
const ALIGN_HOLD_TRIGGER_MS = 220;
let _alignHoldTimer = null,
  _alignHoldActive = false,
  _alignHoldKey = '';
const MODIFIER_ALIAS_MAP = Object.freeze({
    CTRL: 'Ctrl',
    CONTROL: 'Ctrl',
    CMD: 'Ctrl',
    COMMAND: 'Ctrl',
    META: 'Ctrl',
    SHIFT: 'Shift',
    ALT: 'Alt',
    OPTION: 'Alt',
  }),
  NAMED_KEY_ALIAS_MAP = Object.freeze({
    SPACE: 'Space',
    ESC: 'Escape',
    ESCAPE: 'Escape',
    ENTER: 'Enter',
    TAB: 'Tab',
    DELETE: 'Delete',
    BACKSPACE: 'Backspace',
  });
function normalizeShortcutKeyPart(value) {
  const list = String(value ?? '').trim();
  if (!list) return '';
  if (list === ' ') return 'Space';
  const item = list.toUpperCase();
  if (MODIFIER_ALIAS_MAP[item]) return MODIFIER_ALIAS_MAP[item];
  if (NAMED_KEY_ALIAS_MAP[item]) return NAMED_KEY_ALIAS_MAP[item];
  if (list.length === 1) return list.toUpperCase();
  return list[0].toUpperCase() + list.slice(1).toLowerCase();
}
function getPanShortcutParts() {
  const key = getShortcuts?.() || {},
    list2 = key?.['pan-canvas']?.keys,
    list3 = Array.isArray(list2) && list2.length > 0 ? list2 : ['Space'];
  return new Set(list3.map((item2) => normalizeShortcutKeyPart(item2)).filter(Boolean));
}
function setPanShortcutHeld(index) {
  ((_spaceHeld = index === true), (window._spaceHeld = _spaceHeld));
  const el = document.getElementById('v2-wrap');
  if (el) el.style.cursor = _spaceHeld ? 'var(--grab-cursor)' : '';
}
function shouldReleasePanShortcut(event) {
  if (!_spaceHeld) return false;
  const result = event?.key === ' ' || event?.code === 'Space' ? 'Space' : event?.key,
    shortcutKeyPart = normalizeShortcutKeyPart(result);
  if (!shortcutKeyPart) return false;
  return getPanShortcutParts().has(shortcutKeyPart);
}
function isAudioClipModeActive() {
  const el2 = document.getElementById('v2-wrap');
  return !!el2?.classList.contains('is-audio-clip-mode');
}
function isEscFeatureModeActive(enabled) {
  return !!enabled?.matting?.active || !!enabled?.annotate?.active || isAudioClipModeActive();
}
function isCommentNoteShortcutRecording() {
  return window.__commentNoteShortcutRecording === true;
}
function dispatchShortcutAction(detail) {
  window.dispatchEvent(new CustomEvent('shortcut-action', { detail: detail }));
}
function isRepeatSuppressedShortcut(data) {
  const options = String(data || '');
  return options === 'panorama-scene-camera-create' || options.startsWith('panorama-scene-camera-');
}
function resolveCommentNoteJumpActionId(enabled2, target) {
  if (!enabled2 || target?.repeat) return null;
  const jumpShortcutBinding = buildJumpShortcutBinding(parseJumpShortcutFromKeydown(target));
  if (!jumpShortcutBinding) return null;
  const source = enabled2.nodes || {};
  for (const [next, enabled3] of Object.entries(source)) {
    if (!enabled3 || enabled3.type !== 'comment-note') continue;
    const map = normalizeCommentNoteJumpShortcut(enabled3.jumpShortcut),
      jumpShortcutBinding2 = buildJumpShortcutBinding(map.keys);
    if (!jumpShortcutBinding2 || jumpShortcutBinding2 !== jumpShortcutBinding) continue;
    return 'comment-note-jump::' + next;
  }
  return null;
}
function _clearAlignHoldState() {
  (_alignHoldTimer && (clearTimeout(_alignHoldTimer), (_alignHoldTimer = null)),
    (_alignHoldActive = false),
    (_alignHoldKey = ''));
}
function isEditingText() {
  const current = document.activeElement,
    entry = current?.tagName;
  return (
    entry === 'INPUT' ||
    entry === 'TEXTAREA' ||
    current?.contentEditable === 'true' ||
    current?.isContentEditable === true
  );
}
function isPlainCopyShortcut(event2) {
  return (
    (event2?.ctrlKey || event2?.metaKey) &&
    !event2?.shiftKey &&
    !event2?.altKey &&
    (String(event2?.key || '').toLowerCase() === 'c' || event2?.code === 'KeyC')
  );
}
function hasExpandedMediaClipNode(record) {
  const payload = record?.nodes || {};
  return Object.values(payload).some(
    (item3) => item3?.type === 'media-clip' && item3?.mediaClip?.expanded === true,
  );
}
function buildShortcutContext(mattingActive, { audioClipModeActive: audioClipModeActive = false } = {}) {
  const list4 = Array.isArray(mattingActive?.selectedNodeIds) ? mattingActive.selectedNodeIds : [],
    selectedNodeType = list4.length === 1 ? mattingActive?.nodes?.[list4[0]]?.type || '' : '',
    handle = list4.length === 1 ? mattingActive?.nodes?.[list4[0]] || null : null,
    state = selectedNodeType === 'panorama-360' ? handle?.panorama360Node || null : handle?.sceneNode || null;
  return {
    mattingActive: mattingActive?.matting?.active,
    annotateActive: mattingActive?.annotate?.active,
    videoKeyingActive: mattingActive?.videoKeying?.active,
    featureModeActive:
      !!mattingActive?.matting?.active ||
      !!mattingActive?.annotate?.active ||
      !!mattingActive?.videoClip?.active ||
      !!mattingActive?.videoKeying?.active ||
      audioClipModeActive,
    alignFeatureEnabled: mattingActive?.ui?.alignFeatureEnabled !== false,
    selectedNodeType: selectedNodeType,
    selectedSyncPlayableVideoCount: getSelectedSyncPlayableVideoCount(mattingActive?.nodes || {}, list4),
    mediaClipExpandedEditing: hasExpandedMediaClipNode(mattingActive),
    panoramaSceneEditing:
      (selectedNodeType === 'panorama-scene' || selectedNodeType === 'panorama-360') &&
      state?.ui?.isEditing === true,
  };
}
function handleKeyDown(event3) {
  if (isCommentNoteShortcutRecording()) return;
  // A modal story editor owns all keys, including Save and Space.
  if (event3.target?.closest?.('.sw-studio, .node-media-export-dialog, .timeline-export-dialog')) return;
  // Capture-phase canvas shortcuts must not delete an embedded editor while typing.
  // Let editors handle their own keys, while keeping Save and canvas-pan shortcuts.
  const whiteboardTarget = event3.target?.closest?.('.wb-node, .cw-node, .sw-node');
  const whiteboardSave = (event3.ctrlKey || event3.metaKey) && String(event3.key).toLowerCase() === 's';
  if (whiteboardTarget && !whiteboardSave && event3.key !== ' ') return;
  const config = appStore.getStateRaw();
  if (event3.code === 'Escape' && isEscFeatureModeActive(config)) {
    (event3.preventDefault(), event3.stopImmediatePropagation(), dispatchShortcutAction('escape-all'));
    return;
  }
  if (isEditingText()) {
    if (event3.code === 'Escape') {
      const { pickConnectMode: pickConnectMode } = appStore.getStateRaw();
      pickConnectMode &&
        pickConnectMode.active &&
        (appStore.setPickConnectMode({ active: false }), event3.preventDefault(), event3.stopPropagation());
    }
    return;
  }
  if (isPlainCopyShortcut(event3) && hasActiveReadonlyTextSelection(document)) return;
  const audioClipModeActive2 = isAudioClipModeActive();
  if (audioClipModeActive2) return;
  if (config.videoKeying?.active || config.videoClip?.active) {
    if (event3.code === 'Escape') return;
    (event3.preventDefault(), event3.stopPropagation());
    return;
  }
  if (
    config.annotate?.active &&
    !event3.ctrlKey &&
    !event3.metaKey &&
    !event3.altKey &&
    String(event3.key || '').toUpperCase() === 'T'
  ) {
    (event3.preventDefault(),
      event3.stopPropagation(),
      window.dispatchEvent(new CustomEvent('shortcut-action', { detail: 'editor-tool-text' })));
    return;
  }
  if (event3.code === 'Escape') {
    const { pickConnectMode: pickConnectMode2 } = appStore.getStateRaw();
    if (pickConnectMode2 && pickConnectMode2.active) {
      (appStore.setPickConnectMode({ active: false }), event3.preventDefault(), event3.stopPropagation());
      return;
    }
  }
  if (event3.key === 'Control') {
    const el3 = document.getElementById('pick-connect-overlay');
    el3 && el3.style.display !== 'none' && (el3.style.cursor = 'var(--connect-cursor)');
  }
  if (isRecording()) return;
  const scope = appStore.getStateRaw(),
    shortcutContext = buildShortcutContext(scope, { audioClipModeActive: audioClipModeActive2 }),
    detail2 = handleShortcutKeydown(event3, shortcutContext);
  if (event3.repeat && isRepeatSuppressedShortcut(detail2)) {
    event3.preventDefault();
    return;
  }
  if (detail2 === 'pan-canvas') {
    event3.preventDefault();
    !event3.repeat && setPanShortcutHeld(true);
    return;
  }
  if (detail2 === 'align-feature') {
    const input = String(scope.ui?.alignFeatureTriggerMode || 'click'),
      output = input === 'hold' || input === 'click' || input === 'off' ? input : 'click';
    if (output === 'off' || shortcutContext.alignFeatureEnabled === false) return;
    event3.preventDefault();
    if (output === 'click') {
      dispatchShortcutAction('align-feature-toggle');
      return;
    }
    if (event3.repeat) return;
    (_clearAlignHoldState(),
      (_alignHoldKey = (event3.code || '') + '|' + (event3.key || '')),
      (_alignHoldTimer = setTimeout(() => {
        ((_alignHoldTimer = null),
          (_alignHoldActive = true),
          dispatchShortcutAction('align-feature-hold-start'));
      }, ALIGN_HOLD_TRIGGER_MS)));
    return;
  }
  if (detail2) {
    (event3.preventDefault(), window.dispatchEvent(new CustomEvent('shortcut-action', { detail: detail2 })));
    return;
  }
  if (!shortcutContext.featureModeActive) {
    const commentNoteJumpActionId = resolveCommentNoteJumpActionId(scope, event3);
    if (commentNoteJumpActionId) {
      (event3.preventDefault(), dispatchShortcutAction(commentNoteJumpActionId));
      return;
    }
  }
  const value2 =
    event3.key === 'Delete' ||
    event3.key === 'Del' ||
    event3.key === 'Backspace' ||
    event3.code === 'Delete' ||
    event3.code === 'Backspace';
  !shortcutContext.featureModeActive &&
    value2 &&
    (event3.preventDefault(), event3.stopPropagation(), event3.stopImmediatePropagation());
}
function handleKeyUp(event4) {
  if (_alignHoldKey) {
    const value3 = (event4.code || '') + '|' + (event4.key || ''),
      value4 =
        value3 === _alignHoldKey || event4.code === 'Tab' || String(event4.key || '').toLowerCase() === 'tab';
    if (value4) {
      const value5 = _alignHoldActive;
      (_clearAlignHoldState(), value5 && dispatchShortcutAction('align-feature-hold-end'));
    }
  }
  shouldReleasePanShortcut(event4) && setPanShortcutHeld(false);
  if (event4.key === 'Control') {
    const el4 = document.getElementById('pick-connect-overlay');
    el4 && el4.style.display !== 'none' && (el4.style.cursor = '');
  }
}
export function isSpaceHeld() {
  return _spaceHeld;
}
export function addShortcutListener(handler) {
  _listeners.push(handler);
  const value6 = (value7) => handler(value7.detail);
  return (
    window.addEventListener('shortcut-action', value6),
    () => {
      const value8 = _listeners.indexOf(handler);
      (value8 > -1 && _listeners.splice(value8, 1), window.removeEventListener('shortcut-action', value6));
    }
  );
}
export function initKeyboardService() {
  (window.addEventListener('keydown', handleKeyDown, true),
    document.addEventListener('keyup', handleKeyUp),
    window.addEventListener('blur', _clearAlignHoldState),
    (_spaceHeld = false),
    (window._spaceHeld = false));
}
export function destroyKeyboardService() {
  (window.removeEventListener('keydown', handleKeyDown, true),
    document.removeEventListener('keyup', handleKeyUp),
    window.removeEventListener('blur', _clearAlignHoldState),
    _clearAlignHoldState(),
    setPanShortcutHeld(false));
}
