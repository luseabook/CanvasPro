import appStore from '../core/stores/appStore.js';
import { hasActiveModalInteraction } from './modalInteractionScope.js';
import { dispatchScopedEscape } from './escapeScope.js';
import {
  getShortcuts,
  handleShortcutKeydown,
  isRecording,
  resolveShortcutActionForEvent,
} from '../modules/shortcuts.js';
import {
  buildJumpShortcutBinding,
  normalizeCommentNoteJumpShortcut,
  parseJumpShortcutFromKeydown,
} from '../modules/commentNoteJumpShortcut.js';
import { hasActiveReadonlyTextSelection } from '../components/aigenText/readonlyTextSelection.js';
import { toggleDevMode } from '../modules/devEntry.js';
import { getSelectedSyncPlayableVideoCount } from '../modules/videoSyncPlayback.js';
import {
  isCanvasPanShortcutHeld,
  releaseCanvasPanShortcut,
  setCanvasPanShortcutHeld,
} from './canvasPanShortcutState.js';
let _listeners = [],
  _settingsShortcutRoot = null;
const ALIGN_HOLD_TRIGGER_MS = 220;
let _alignHoldTimer = null,
  _alignHoldActive = ![],
  _alignHoldKey = '';
const MODIFIER_ALIAS_MAP = Object['freeze']({
    CTRL: 'Ctrl',
    CONTROL: 'Ctrl',
    CMD: 'Ctrl',
    COMMAND: 'Ctrl',
    META: 'Ctrl',
    SHIFT: 'Shift',
    ALT: 'Alt',
    OPTION: 'Alt',
  }),
  NAMED_KEY_ALIAS_MAP = Object['freeze']({
    SPACE: 'Space',
    ESC: 'Escape',
    ESCAPE: 'Escape',
    ENTER: 'Enter',
    TAB: 'Tab',
    DELETE: 'Delete',
    BACKSPACE: 'Backspace',
  }),
  INTERACTION_MODIFIER_SHORTCUTS = new Set(['cut-edge', 'duplicate-with-edges', 'multi-select']),
  ACTIVE_WHITEBOARD_EDITOR_SELECTOR = '.whiteboard-node-component.is-whiteboard-editing';
function normalizeShortcutKeyPart(value) {
  const list = String(value ?? '')['trim']();
  if (!list) return '';
  if (list === ' ') return 'Space';
  const item = list['toUpperCase']();
  if (MODIFIER_ALIAS_MAP[item]) return MODIFIER_ALIAS_MAP[item];
  if (NAMED_KEY_ALIAS_MAP[item]) return NAMED_KEY_ALIAS_MAP[item];
  if (list['length'] === 1) return list['toUpperCase']();
  return list[0]['toUpperCase']() + list['slice'](1)['toLowerCase']();
}
function getPanShortcutParts() {
  const key = getShortcuts?.() || {},
    list2 = key?.['pan-canvas']?.['keys'],
    list3 = Array['isArray'](list2) && list2['length'] > 0 ? list2 : ['Space'];
  return new Set(list3['map']((index) => normalizeShortcutKeyPart(index))['filter'](Boolean));
}
function shouldReleasePanShortcut(event) {
  if (!isCanvasPanShortcutHeld()) return ![];
  const result =
      event?.['key'] === ' ' || event?.['code'] === 'Space' ? 'Space' : event?.['key'],
    shortcutKeyPart = normalizeShortcutKeyPart(result);
  if (!shortcutKeyPart) return ![];
  return getPanShortcutParts()['has'](shortcutKeyPart);
}
function isAudioClipModeActive() {
  const el = document['getElementById']('v2-wrap');
  return !!el?.['classList']['contains']('is-audio-clip-mode');
}
function isEscFeatureModeActive(enabled) {
  return (
    !!enabled?.['matting']?.['active'] || !!enabled?.['annotate']?.['active'] || isAudioClipModeActive()
  );
}
function isCommentNoteShortcutRecording() {
  return window['__commentNoteShortcutRecording'] === !![];
}
function dispatchShortcutAction(detail) {
  window['dispatchEvent'](new CustomEvent('shortcut-action', { detail: detail }));
}
function isRepeatSuppressedShortcut(data) {
  const options = String(data || '');
  return (
    options === 'upload-file' ||
    options === 'open-settings' ||
    options === 'panorama-scene-camera-create' ||
    options['startsWith']('panorama-scene-camera-')
  );
}
function isInteractionModifierShortcut(target) {
  return INTERACTION_MODIFIER_SHORTCUTS['has'](String(target || ''));
}
function resolveCommentNoteJumpActionId(enabled2, source) {
  if (!enabled2 || source?.['repeat']) return null;
  const jumpShortcutBinding = buildJumpShortcutBinding(parseJumpShortcutFromKeydown(source));
  if (!jumpShortcutBinding) return null;
  const next = enabled2['nodes'] || {};
  for (const [current, enabled3] of Object['entries'](next)) {
    if (!enabled3 || enabled3['type'] !== 'comment-note') continue;
    const map = normalizeCommentNoteJumpShortcut(enabled3['jumpShortcut']),
      jumpShortcutBinding2 = buildJumpShortcutBinding(map['keys']);
    if (!jumpShortcutBinding2 || jumpShortcutBinding2 !== jumpShortcutBinding) continue;
    return 'comment-note-jump::' + current;
  }
  return null;
}
function _clearAlignHoldState() {
  (_alignHoldTimer && (clearTimeout(_alignHoldTimer), (_alignHoldTimer = null)),
    (_alignHoldActive = ![]),
    (_alignHoldKey = ''));
}
function isEditingText() {
  const entry = document['activeElement'],
    record = entry?.['tagName'];
  return (
    record === 'INPUT' ||
    record === 'TEXTAREA' ||
    entry?.['contentEditable'] === 'true' ||
    entry?.['isContentEditable'] === !![]
  );
}
function handleSettingsKeyDown(event2) {
  if (
    event2['isComposing'] ||
    event2['repeat'] ||
    isRecording() ||
    isCommentNoteShortcutRecording() ||
    isEditingText()
  )
    return;
  if (resolveShortcutActionForEvent(event2, ['open-settings']) !== 'open-settings') return;
  (event2['preventDefault'](), event2['stopPropagation'](), dispatchShortcutAction('open-settings'));
}
function isPlainCopyShortcut(event3) {
  return (
    (event3?.['ctrlKey'] || event3?.['metaKey']) &&
    !event3?.['shiftKey'] &&
    !event3?.['altKey'] &&
    (String(event3?.['key'] || '')['toLowerCase']() === 'c' || event3?.['code'] === 'KeyC')
  );
}
function isActiveWhiteboardEditorTarget(event4) {
  const el2 = event4?.['target'] || document['activeElement'];
  return Boolean(el2?.['closest']?.(ACTIVE_WHITEBOARD_EDITOR_SELECTOR));
}
function isDevModeToggleShortcut(event5) {
  if (
    window['LOCAL_DEV_BUILD'] !== !![] ||
    event5?.['repeat'] ||
    event5?.['ctrlKey'] ||
    event5?.['metaKey'] ||
    event5?.['altKey']
  )
    return ![];
  return (
    event5?.['code'] === 'Backslash' ||
    event5?.['key'] === '\\' ||
    event5?.['key'] === '|' ||
    event5?.['key'] === '、'
  );
}
function hasExpandedMediaClipNode(payload) {
  const handle = payload?.['nodes'] || {};
  return Object['values'](handle)['some'](
    (state) => state?.['type'] === 'media-clip' && state?.['mediaClip']?.['expanded'] === !![],
  );
}
function buildShortcutContext(mattingActive, { audioClipModeActive: audioClipModeActive = ![] } = {}) {
  const list4 = Array['isArray'](mattingActive?.['selectedNodeIds']) ? mattingActive['selectedNodeIds'] : [],
    selectedNodeType = list4['length'] === 1 ? mattingActive?.['nodes']?.[list4[0]]?.['type'] || '' : '',
    config = list4['length'] === 1 ? mattingActive?.['nodes']?.[list4[0]] || null : null,
    scope =
      selectedNodeType === 'panorama-360'
        ? config?.['panorama360Node'] || null
        : config?.['sceneNode'] || null;
  return {
    mattingActive: mattingActive?.['matting']?.['active'],
    annotateActive: mattingActive?.['annotate']?.['active'],
    videoKeyingActive: mattingActive?.['videoKeying']?.['active'],
    featureModeActive:
      !!mattingActive?.['matting']?.['active'] ||
      !!mattingActive?.['annotate']?.['active'] ||
      !!mattingActive?.['videoClip']?.['active'] ||
      !!mattingActive?.['videoKeying']?.['active'] ||
      audioClipModeActive,
    alignFeatureEnabled: mattingActive?.['ui']?.['alignFeatureEnabled'] !== ![],
    selectedNodeType: selectedNodeType,
    selectedSyncPlayableVideoCount: getSelectedSyncPlayableVideoCount(mattingActive?.['nodes'] || {}, list4),
    mediaClipExpandedEditing: hasExpandedMediaClipNode(mattingActive),
    panoramaSceneEditing:
      (selectedNodeType === 'panorama-scene' || selectedNodeType === 'panorama-360') &&
      scope?.['ui']?.['isEditing'] === !![],
    panoramaSceneFlyMode:
      selectedNodeType === 'panorama-scene' &&
      scope?.['ui']?.['isEditing'] === !![] &&
      scope?.['ui']?.['navigationMode'] === 'fly',
  };
}
function isPanoramaSceneNavigationKey(input, enabled4) {
  if (
    !enabled4?.['panoramaSceneEditing'] ||
    input?.['ctrlKey'] ||
    input?.['metaKey'] ||
    input?.['altKey']
  )
    return ![];
  if (input?.['code'] === 'KeyF') return !![];
  return (
    enabled4['panoramaSceneFlyMode'] === !![] &&
    ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE']['includes'](input?.['code'])
  );
}
function handleKeyDown(event6) {
  if (hasActiveModalInteraction()) return;
  if (dispatchScopedEscape(event6)) return;
  if (isRecording()) return;
  if (isCommentNoteShortcutRecording()) return;
  if (
    event6['target']?.['closest']?.('.v2-canvas-ctx-menu') ||
    globalThis['document']?.['querySelector']?.(
      '.v2-canvas-ctx-menu, .v2-material-context-menu, .panorama-scene-object-menu.is-visible',
    )
  )
    return;
  if (isDevModeToggleShortcut(event6) && !isEditingText() && !isActiveWhiteboardEditorTarget(event6)) {
    (event6['preventDefault'](), toggleDevMode());
    return;
  }
  if (document['body']?.['classList']?.['contains']?.('storyboard-3d-editor-open')) return;
  const output = appStore['getStateRaw']();
  if (event6['code'] === 'Escape' && isEscFeatureModeActive(output)) {
    (event6['preventDefault'](),
      event6['stopImmediatePropagation'](),
      dispatchShortcutAction('escape-all'));
    return;
  }
  if (isEditingText()) {
    if (event6['code'] === 'Escape') {
      const { pickConnectMode: pickConnectMode } = appStore['getStateRaw']();
      pickConnectMode &&
        pickConnectMode['active'] &&
        (appStore['setPickConnectMode']({ active: ![] }),
        event6['preventDefault'](),
        event6['stopPropagation']());
    }
    return;
  }
  if (isActiveWhiteboardEditorTarget(event6)) return;
  if (isPlainCopyShortcut(event6) && hasActiveReadonlyTextSelection(document)) return;
  const audioClipModeActive2 = isAudioClipModeActive();
  if (audioClipModeActive2) return;
  if (
    (event6['key'] === ' ' || event6['code'] === 'Space') &&
    !event6['ctrlKey'] &&
    !event6['metaKey'] &&
    !event6['altKey'] &&
    !event6['shiftKey'] &&
    event6['target']?.['closest']?.('button')
  )
    return;
  if (output['videoKeying']?.['active'] || output['videoClip']?.['active']) {
    if (event6['code'] === 'Escape') return;
    (event6['preventDefault'](), event6['stopPropagation']());
    return;
  }
  if (
    output['annotate']?.['active'] &&
    !event6['ctrlKey'] &&
    !event6['metaKey'] &&
    !event6['altKey'] &&
    String(event6['key'] || '')['toUpperCase']() === 'T'
  ) {
    (event6['preventDefault'](),
      event6['stopPropagation'](),
      window['dispatchEvent'](new CustomEvent('shortcut-action', { detail: 'editor-tool-text' })));
    return;
  }
  if (event6['code'] === 'Escape') {
    const { pickConnectMode: pickConnectMode2 } = appStore['getStateRaw']();
    if (pickConnectMode2 && pickConnectMode2['active']) {
      (appStore['setPickConnectMode']({ active: ![] }),
        event6['preventDefault'](),
        event6['stopPropagation']());
      return;
    }
  }
  if (event6['key'] === 'Control') {
    const el3 = document['getElementById']('pick-connect-overlay');
    el3 &&
      el3['style']['display'] !== 'none' &&
      (el3['style']['cursor'] = 'var(--connect-cursor)');
  }
  const value2 = appStore['getStateRaw'](),
    shortcutContext = buildShortcutContext(value2, { audioClipModeActive: audioClipModeActive2 });
  if (isPanoramaSceneNavigationKey(event6, shortcutContext)) {
    event6['preventDefault']();
    return;
  }
  const detail2 = handleShortcutKeydown(event6, shortcutContext);
  if (event6['repeat'] && isRepeatSuppressedShortcut(detail2)) {
    event6['preventDefault']();
    return;
  }
  if (detail2 === 'pan-canvas') {
    event6['preventDefault']();
    !event6['repeat'] && setCanvasPanShortcutHeld(!![]);
    return;
  }
  if (detail2 === 'align-feature') {
    const value3 = String(value2['ui']?.['alignFeatureTriggerMode'] || 'click'),
      value4 = value3 === 'hold' || value3 === 'click' || value3 === 'off' ? value3 : 'click';
    if (value4 === 'off' || shortcutContext['alignFeatureEnabled'] === ![]) return;
    event6['preventDefault']();
    if (value4 === 'click') {
      dispatchShortcutAction('align-feature-toggle');
      return;
    }
    if (event6['repeat']) return;
    (_clearAlignHoldState(),
      (_alignHoldKey = (event6['code'] || '') + '|' + (event6['key'] || '')),
      (_alignHoldTimer = setTimeout(() => {
        ((_alignHoldTimer = null),
          (_alignHoldActive = !![]),
          dispatchShortcutAction('align-feature-hold-start'));
      }, ALIGN_HOLD_TRIGGER_MS)));
    return;
  }
  if (isInteractionModifierShortcut(detail2)) return;
  if (detail2) {
    (event6['preventDefault'](),
      window['dispatchEvent'](new CustomEvent('shortcut-action', { detail: detail2 })));
    return;
  }
  if (!shortcutContext['featureModeActive']) {
    const commentNoteJumpActionId = resolveCommentNoteJumpActionId(value2, event6);
    if (commentNoteJumpActionId) {
      (event6['preventDefault'](), dispatchShortcutAction(commentNoteJumpActionId));
      return;
    }
  }
  const value5 =
    event6['key'] === 'Delete' ||
    event6['key'] === 'Del' ||
    event6['key'] === 'Backspace' ||
    event6['code'] === 'Delete' ||
    event6['code'] === 'Backspace';
  !shortcutContext['featureModeActive'] &&
    value5 &&
    (event6['preventDefault'](), event6['stopPropagation'](), event6['stopImmediatePropagation']());
}
function handleKeyUp(event7) {
  if (_alignHoldKey) {
    const value6 = (event7['code'] || '') + '|' + (event7['key'] || ''),
      value7 =
        value6 === _alignHoldKey ||
        event7['code'] === 'Tab' ||
        String(event7['key'] || '')['toLowerCase']() === 'tab';
    if (value7) {
      const value8 = _alignHoldActive;
      (_clearAlignHoldState(), value8 && dispatchShortcutAction('align-feature-hold-end'));
    }
  }
  shouldReleasePanShortcut(event7) && releaseCanvasPanShortcut();
  if (event7['key'] === 'Control') {
    const el4 = document['getElementById']('pick-connect-overlay');
    el4 && el4['style']['display'] !== 'none' && (el4['style']['cursor'] = '');
  }
}
export function isSpaceHeld() {
  return isCanvasPanShortcutHeld();
}
function handleWindowBlur() {
  (_clearAlignHoldState(), releaseCanvasPanShortcut());
}
export function addShortcutListener(handler) {
  _listeners['push'](handler);
  const value9 = (value10) => handler(value10['detail']);
  return (
    window['addEventListener']('shortcut-action', value9),
    () => {
      const value11 = _listeners['indexOf'](handler);
      (value11 > -1 && _listeners['splice'](value11, 1),
        window['removeEventListener']('shortcut-action', value9));
    }
  );
}
export function initKeyboardService() {
  (window['addEventListener']('keydown', handleKeyDown, !![]),
    window['addEventListener']('keyup', handleKeyUp, !![]),
    window['addEventListener']('blur', handleWindowBlur),
    (_settingsShortcutRoot = document['querySelector']?.('#settingsOverlay .settings-modal')),
    _settingsShortcutRoot?.['addEventListener']('keydown', handleSettingsKeyDown),
    releaseCanvasPanShortcut());
}
export function destroyKeyboardService() {
  (window['removeEventListener']('keydown', handleKeyDown, !![]),
    window['removeEventListener']('keyup', handleKeyUp, !![]),
    window['removeEventListener']('blur', handleWindowBlur),
    _settingsShortcutRoot?.['removeEventListener']('keydown', handleSettingsKeyDown),
    (_settingsShortcutRoot = null),
    _clearAlignHoldState(),
    releaseCanvasPanShortcut());
}
