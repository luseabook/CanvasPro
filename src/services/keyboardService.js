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
function normalizeShortcutKeyPart(_0xa18730) {
  const _0x45fe80 = String(_0xa18730 ?? '').trim();
  if (!_0x45fe80) return '';
  if (_0x45fe80 === ' ') return 'Space';
  const _0x443ffd = _0x45fe80.toUpperCase();
  if (MODIFIER_ALIAS_MAP[_0x443ffd]) return MODIFIER_ALIAS_MAP[_0x443ffd];
  if (NAMED_KEY_ALIAS_MAP[_0x443ffd]) return NAMED_KEY_ALIAS_MAP[_0x443ffd];
  if (_0x45fe80.length === 1) return _0x45fe80.toUpperCase();
  return _0x45fe80[0].toUpperCase() + _0x45fe80.slice(1).toLowerCase();
}
function getPanShortcutParts() {
  const _0x4efd64 = getShortcuts?.() || {},
    _0xde071 = _0x4efd64?.['pan-canvas']?.keys,
    _0x460d67 = Array.isArray(_0xde071) && _0xde071.length > 0 ? _0xde071 : ['Space'];
  return new Set(_0x460d67.map((_0xf86d4d) => normalizeShortcutKeyPart(_0xf86d4d)).filter(Boolean));
}
function setPanShortcutHeld(_0x3d7e40) {
  ((_spaceHeld = _0x3d7e40 === true), (window._spaceHeld = _spaceHeld));
  const _0x4479bf = document.getElementById('v2-wrap');
  if (_0x4479bf) _0x4479bf.style.cursor = _spaceHeld ? 'var(--grab-cursor)' : '';
}
function shouldReleasePanShortcut(_0x4b74ef) {
  if (!_spaceHeld) return false;
  const _0x5e0188 = _0x4b74ef?.key === ' ' || _0x4b74ef?.code === 'Space' ? 'Space' : _0x4b74ef?.key,
    _0x40c04b = normalizeShortcutKeyPart(_0x5e0188);
  if (!_0x40c04b) return false;
  return getPanShortcutParts().has(_0x40c04b);
}
function isAudioClipModeActive() {
  const _0x25ae05 = document.getElementById('v2-wrap');
  return !!_0x25ae05?.classList.contains('is-audio-clip-mode');
}
function isEscFeatureModeActive(_0x501eeb) {
  return !!_0x501eeb?.matting?.active || !!_0x501eeb?.annotate?.active || isAudioClipModeActive();
}
function isCommentNoteShortcutRecording() {
  return window.__commentNoteShortcutRecording === true;
}
function dispatchShortcutAction(_0x5f371d) {
  window.dispatchEvent(new CustomEvent('shortcut-action', { detail: _0x5f371d }));
}
function isRepeatSuppressedShortcut(_0x50d405) {
  const _0x14da3a = String(_0x50d405 || '');
  return _0x14da3a === 'panorama-scene-camera-create' || _0x14da3a.startsWith('panorama-scene-camera-');
}
function resolveCommentNoteJumpActionId(_0x2dbf79, _0x366a7d) {
  if (!_0x2dbf79 || _0x366a7d?.repeat) return null;
  const _0x13c281 = buildJumpShortcutBinding(parseJumpShortcutFromKeydown(_0x366a7d));
  if (!_0x13c281) return null;
  const _0x4202af = _0x2dbf79.nodes || {};
  for (const [_0x278a3e, _0x54069d] of Object.entries(_0x4202af)) {
    if (!_0x54069d || _0x54069d.type !== 'comment-note') continue;
    const _0x2eccc2 = normalizeCommentNoteJumpShortcut(_0x54069d.jumpShortcut),
      _0x475d9f = buildJumpShortcutBinding(_0x2eccc2.keys);
    if (!_0x475d9f || _0x475d9f !== _0x13c281) continue;
    return 'comment-note-jump::' + _0x278a3e;
  }
  return null;
}
function _clearAlignHoldState() {
  (_alignHoldTimer && (clearTimeout(_alignHoldTimer), (_alignHoldTimer = null)),
    (_alignHoldActive = false),
    (_alignHoldKey = ''));
}
function isEditingText() {
  const _0x2e0838 = document.activeElement,
    _0x4d0622 = _0x2e0838?.tagName;
  return (
    _0x4d0622 === 'INPUT' ||
    _0x4d0622 === 'TEXTAREA' ||
    _0x2e0838?.contentEditable === 'true' ||
    _0x2e0838?.isContentEditable === true
  );
}
function isPlainCopyShortcut(_0x7d857) {
  return (
    (_0x7d857?.ctrlKey || _0x7d857?.metaKey) &&
    !_0x7d857?.shiftKey &&
    !_0x7d857?.altKey &&
    (String(_0x7d857?.key || '').toLowerCase() === 'c' || _0x7d857?.code === 'KeyC')
  );
}
function hasExpandedMediaClipNode(_0x5abd8e) {
  const _0x1cd52a = _0x5abd8e?.nodes || {};
  return Object.values(_0x1cd52a).some(
    (_0x35893b) => _0x35893b?.type === 'media-clip' && _0x35893b?.mediaClip?.expanded === true,
  );
}
function buildShortcutContext(_0xf0e9d8, { audioClipModeActive: audioClipModeActive = false } = {}) {
  const _0x127750 = Array.isArray(_0xf0e9d8?.selectedNodeIds) ? _0xf0e9d8.selectedNodeIds : [],
    _0x453b67 = _0x127750.length === 1 ? _0xf0e9d8?.nodes?.[_0x127750[0]]?.type || '' : '',
    _0x230b28 = _0x127750.length === 1 ? _0xf0e9d8?.nodes?.[_0x127750[0]] || null : null,
    _0x540eac =
      _0x453b67 === 'panorama-360' ? _0x230b28?.panorama360Node || null : _0x230b28?.sceneNode || null;
  return {
    mattingActive: _0xf0e9d8?.matting?.active,
    annotateActive: _0xf0e9d8?.annotate?.active,
    videoKeyingActive: _0xf0e9d8?.videoKeying?.active,
    featureModeActive:
      !!_0xf0e9d8?.matting?.active ||
      !!_0xf0e9d8?.annotate?.active ||
      !!_0xf0e9d8?.videoClip?.active ||
      !!_0xf0e9d8?.videoKeying?.active ||
      audioClipModeActive,
    alignFeatureEnabled: _0xf0e9d8?.ui?.alignFeatureEnabled !== false,
    selectedNodeType: _0x453b67,
    selectedSyncPlayableVideoCount: getSelectedSyncPlayableVideoCount(_0xf0e9d8?.nodes || {}, _0x127750),
    mediaClipExpandedEditing: hasExpandedMediaClipNode(_0xf0e9d8),
    panoramaSceneEditing:
      (_0x453b67 === 'panorama-scene' || _0x453b67 === 'panorama-360') && _0x540eac?.ui?.isEditing === true,
  };
}
function handleKeyDown(_0x3ccf81) {
  if (isCommentNoteShortcutRecording()) return;
  // A modal story editor owns all keys, including Save and Space.
  if (_0x3ccf81.target?.closest?.('.sw-studio, .node-media-export-dialog, .timeline-export-dialog')) return;
  // Capture-phase canvas shortcuts must not delete an embedded editor while typing.
  // Let editors handle their own keys, while keeping Save and canvas-pan shortcuts.
  const whiteboardTarget = _0x3ccf81.target?.closest?.('.wb-node, .cw-node, .sw-node');
  const whiteboardSave = (_0x3ccf81.ctrlKey || _0x3ccf81.metaKey) && String(_0x3ccf81.key).toLowerCase() === 's';
  if (whiteboardTarget && !whiteboardSave && _0x3ccf81.key !== ' ') return;
  const _0x3b6a5a = appStore.getStateRaw();
  if (_0x3ccf81.code === 'Escape' && isEscFeatureModeActive(_0x3b6a5a)) {
    (_0x3ccf81.preventDefault(), _0x3ccf81.stopImmediatePropagation(), dispatchShortcutAction('escape-all'));
    return;
  }
  if (isEditingText()) {
    if (_0x3ccf81.code === 'Escape') {
      const { pickConnectMode: _0x472b9a } = appStore.getStateRaw();
      _0x472b9a &&
        _0x472b9a.active &&
        (appStore.setPickConnectMode({ active: false }),
        _0x3ccf81.preventDefault(),
        _0x3ccf81.stopPropagation());
    }
    return;
  }
  if (isPlainCopyShortcut(_0x3ccf81) && hasActiveReadonlyTextSelection(document)) return;
  const _0x30ee8f = isAudioClipModeActive();
  if (_0x30ee8f) return;
  if (_0x3b6a5a.videoKeying?.active || _0x3b6a5a.videoClip?.active) {
    if (_0x3ccf81.code === 'Escape') return;
    (_0x3ccf81.preventDefault(), _0x3ccf81.stopPropagation());
    return;
  }
  if (
    _0x3b6a5a.annotate?.active &&
    !_0x3ccf81.ctrlKey &&
    !_0x3ccf81.metaKey &&
    !_0x3ccf81.altKey &&
    String(_0x3ccf81.key || '').toUpperCase() === 'T'
  ) {
    (_0x3ccf81.preventDefault(),
      _0x3ccf81.stopPropagation(),
      window.dispatchEvent(new CustomEvent('shortcut-action', { detail: 'editor-tool-text' })));
    return;
  }
  if (_0x3ccf81.code === 'Escape') {
    const { pickConnectMode: _0x3cc99c } = appStore.getStateRaw();
    if (_0x3cc99c && _0x3cc99c.active) {
      (appStore.setPickConnectMode({ active: false }),
        _0x3ccf81.preventDefault(),
        _0x3ccf81.stopPropagation());
      return;
    }
  }
  if (_0x3ccf81.key === 'Control') {
    const _0x16e2da = document.getElementById('pick-connect-overlay');
    _0x16e2da && _0x16e2da.style.display !== 'none' && (_0x16e2da.style.cursor = 'var(--connect-cursor)');
  }
  if (isRecording()) return;
  const _0x3ac1ea = appStore.getStateRaw(),
    _0x5f1396 = buildShortcutContext(_0x3ac1ea, { audioClipModeActive: _0x30ee8f }),
    _0xdf5755 = handleShortcutKeydown(_0x3ccf81, _0x5f1396);
  if (_0x3ccf81.repeat && isRepeatSuppressedShortcut(_0xdf5755)) {
    _0x3ccf81.preventDefault();
    return;
  }
  if (_0xdf5755 === 'pan-canvas') {
    _0x3ccf81.preventDefault();
    !_0x3ccf81.repeat && setPanShortcutHeld(true);
    return;
  }
  if (_0xdf5755 === 'align-feature') {
    const _0x19aaa8 = String(_0x3ac1ea.ui?.alignFeatureTriggerMode || 'click'),
      _0x36aefe = _0x19aaa8 === 'hold' || _0x19aaa8 === 'click' || _0x19aaa8 === 'off' ? _0x19aaa8 : 'click';
    if (_0x36aefe === 'off' || _0x5f1396.alignFeatureEnabled === false) return;
    _0x3ccf81.preventDefault();
    if (_0x36aefe === 'click') {
      dispatchShortcutAction('align-feature-toggle');
      return;
    }
    if (_0x3ccf81.repeat) return;
    (_clearAlignHoldState(),
      (_alignHoldKey = (_0x3ccf81.code || '') + '|' + (_0x3ccf81.key || '')),
      (_alignHoldTimer = setTimeout(() => {
        ((_alignHoldTimer = null),
          (_alignHoldActive = true),
          dispatchShortcutAction('align-feature-hold-start'));
      }, ALIGN_HOLD_TRIGGER_MS)));
    return;
  }
  if (_0xdf5755) {
    (_0x3ccf81.preventDefault(),
      window.dispatchEvent(new CustomEvent('shortcut-action', { detail: _0xdf5755 })));
    return;
  }
  if (!_0x5f1396.featureModeActive) {
    const _0x5a85dd = resolveCommentNoteJumpActionId(_0x3ac1ea, _0x3ccf81);
    if (_0x5a85dd) {
      (_0x3ccf81.preventDefault(), dispatchShortcutAction(_0x5a85dd));
      return;
    }
  }
  const _0x52ed53 =
    _0x3ccf81.key === 'Delete' ||
    _0x3ccf81.key === 'Del' ||
    _0x3ccf81.key === 'Backspace' ||
    _0x3ccf81.code === 'Delete' ||
    _0x3ccf81.code === 'Backspace';
  !_0x5f1396.featureModeActive &&
    _0x52ed53 &&
    (_0x3ccf81.preventDefault(), _0x3ccf81.stopPropagation(), _0x3ccf81.stopImmediatePropagation());
}
function handleKeyUp(_0x4aea04) {
  if (_alignHoldKey) {
    const _0x2a94ef = (_0x4aea04.code || '') + '|' + (_0x4aea04.key || ''),
      _0x426536 =
        _0x2a94ef === _alignHoldKey ||
        _0x4aea04.code === 'Tab' ||
        String(_0x4aea04.key || '').toLowerCase() === 'tab';
    if (_0x426536) {
      const _0x46b387 = _alignHoldActive;
      (_clearAlignHoldState(), _0x46b387 && dispatchShortcutAction('align-feature-hold-end'));
    }
  }
  shouldReleasePanShortcut(_0x4aea04) && setPanShortcutHeld(false);
  if (_0x4aea04.key === 'Control') {
    const _0x32798d = document.getElementById('pick-connect-overlay');
    _0x32798d && _0x32798d.style.display !== 'none' && (_0x32798d.style.cursor = '');
  }
}
export function isSpaceHeld() {
  return _spaceHeld;
}
export function addShortcutListener(_0x57bdc8) {
  _listeners.push(_0x57bdc8);
  const _0x3abdde = (_0x4f5029) => _0x57bdc8(_0x4f5029.detail);
  return (
    window.addEventListener('shortcut-action', _0x3abdde),
    () => {
      const _0x4fbaad = _listeners.indexOf(_0x57bdc8);
      (_0x4fbaad > -1 && _listeners.splice(_0x4fbaad, 1),
        window.removeEventListener('shortcut-action', _0x3abdde));
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
