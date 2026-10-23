import { onLocaleChange, t } from '../i18n/index.js';
import { getInitialShortcuts, getShortcuts } from './shortcuts.js';
const TIP_KEYS = Object.freeze([
  'viewWheelZoom',
  'viewShortcutZoom',
  'viewFocus',
  'viewMinimap',
  'viewSpacePan',
  'viewMiddlePan',
  'createDoubleClick',
  'createLeftPlus',
  'createNote',
  'createTextImage',
  'createVideoAudio',
  'createDragMedia',
  'editSelectAll',
  'editShiftSelect',
  'editBoxSelect',
  'editCopyPaste',
  'editCut',
  'editDelete',
  'editUndoRedo',
  'organizeGroup',
  'organizeAlign',
  'organizeGuides',
  'organizeGrid',
  'organizeResetSize',
  'edgeConnect',
  'edgeCut',
  'edgeScissors',
  'nodeRename',
  'imageTools',
  'imageCopy',
  'videoTools',
  'videoCaptureFrame',
  'audioTools',
  'textTools',
  'sceneTools',
  'sceneCapture',
  'projectSave',
  'projectSettings',
  'settingsShortcuts',
  'hintEsc',
]);
// 每条提示里要填的按键绑定位：提示文案本身写的是占位符（`{shortcut}`、`{copy}` …），
// 具体键位到渲染时才从用户当前的快捷键表里取。这样改了快捷键、换了预设，提示也跟着变。
const TIP_SHORTCUT_ACTIONS = Object.freeze({
  viewShortcutZoom: Object.freeze({ zoomIn: 'zoom-in', zoomOut: 'zoom-out' }),
  viewFocus: Object.freeze({ shortcut: 'fit-all' }),
  viewMinimap: Object.freeze({ shortcut: 'minimap' }),
  viewSpacePan: Object.freeze({ shortcut: 'pan-canvas' }),
  createNote: Object.freeze({ shortcut: 'create-comment-note' }),
  createTextImage: Object.freeze({ text: 'create-ai-text', image: 'create-ai-image' }),
  createVideoAudio: Object.freeze({ video: 'create-ai-video', audio: 'create-ai-audio' }),
  editSelectAll: Object.freeze({ shortcut: 'select-all' }),
  editShiftSelect: Object.freeze({ shortcut: 'multi-select' }),
  editCopyPaste: Object.freeze({ copy: 'copy', paste: 'paste' }),
  editCut: Object.freeze({ shortcut: 'cut' }),
  editDelete: Object.freeze({ shortcut: 'delete' }),
  editUndoRedo: Object.freeze({ undo: 'undo', redo: 'redo' }),
  organizeGroup: Object.freeze({ shortcut: 'group' }),
  organizeAlign: Object.freeze({ shortcut: 'align-feature' }),
  organizeGuides: Object.freeze({ shortcut: 'snap-guides' }),
  organizeGrid: Object.freeze({ shortcut: 'snap-grid' }),
  organizeResetSize: Object.freeze({ shortcut: 'reset-media-size' }),
  edgeCut: Object.freeze({ shortcut: 'cut-edge' }),
  imageCopy: Object.freeze({ shortcut: 'copy-media' }),
  videoCaptureFrame: Object.freeze({ shortcut: 'video-tool-capture-frame' }),
  sceneCapture: Object.freeze({ shortcut: 'panorama-scene-capture' }),
  projectSave: Object.freeze({ shortcut: 'save' }),
  projectSettings: Object.freeze({ shortcut: 'open-settings' }),
});
// 提示里要「一串工具」的情况：把每个动作的键位都列出来，用 / 连成一句。
const TIP_SHORTCUT_ACTION_LISTS = Object.freeze({
  imageTools: Object.freeze([
    'image-tool-matting',
    'image-tool-repaint',
    'image-tool-erase',
    'image-tool-hd',
    'image-tool-expand',
    'image-tool-auto-subject',
    'image-tool-multigrid',
    'image-tool-multiangle',
    'image-tool-annotate',
    'image-tool-crop',
  ]),
  videoTools: Object.freeze([
    'video-tool-clip',
    'video-tool-keying',
    'video-tool-hd',
    'video-tool-fullscreen',
    'video-tool-download',
  ]),
  audioTools: Object.freeze(['audio-tool-clip', 'audio-tool-speed', 'audio-tool-download']),
  textTools: Object.freeze(['text-tool-copy', 'text-tool-fullscreen']),
  sceneTools: Object.freeze([
    'panorama-scene-tool-toggle-mouse',
    'panorama-scene-tool-move',
    'panorama-scene-tool-scale',
    'panorama-scene-tool-rotate',
  ]),
});
function mascotText(value, item = {}) {
  return t('mascot.' + value, item);
}
/**
 * 把一个动作的按键渲染成「Ctrl + G」这样的文本。
 *
 * `keys` 是当前绑定，`alternateKeys` 是备选绑定（同一动作可以有几套），两套都展示、
 * 用 ` / ` 连接并去重。没有绑定时退回「未设置」，不显示空串。
 */
function formatShortcutBinding(shortcuts, actionId) {
  const binding = shortcuts?.[actionId],
    groups = [
      ...(Array.isArray(binding?.keys) ? [binding.keys] : []),
      ...(Array.isArray(binding?.alternateKeys) ? binding.alternateKeys : []),
    ]
      .filter((keys) => Array.isArray(keys) && keys.length > 0)
      .map((keys) => keys.join(' + ')),
    formatted = Array.from(new Set(groups));
  return formatted.join(' / ') || t('settings.shortcuts.unset');
}
/**
 * 生成一条吉祥物提示的完整文案。
 *
 * 键位表取当前用户设置；传空/未初始化时退回内置预设，避免启动早期显示一堆空括号。
 * 导出是为了能在测试里直接断言「占位符都被填掉了」。
 */
export function getMascotTipText(key, shortcuts = getShortcuts()) {
  const bindings = Object.keys(shortcuts || {}).length > 0 ? shortcuts : getInitialShortcuts(),
    params = {};
  // 打组这条的动词本身也是可变的（不同预设下叫「编组」或「打组」），单独取。
  if (key === 'organizeGroup') params.action = t('settings.shortcuts.actions.group');
  Object.entries(TIP_SHORTCUT_ACTIONS[key] || {}).forEach(([slot, actionId]) => {
    params[slot] = formatShortcutBinding(bindings, actionId);
  });
  const actionList = TIP_SHORTCUT_ACTION_LISTS[key];
  if (actionList)
    params.shortcuts = Array.from(
      new Set(actionList.map((actionId) => formatShortcutBinding(bindings, actionId)))
    ).join(' / ');
  return mascotText('tips.' + key, params);
}
const MascotManager = {
  _lastIdx: -1,
  _visible: false,
  _rotationTimer: null,
  _fabBtn: null,
  _mascotWrap: null,
  _mascotText: null,
  _mascotFigure: null,
  _unsubscribeLocale: null,
  _bindFabButton: true,
  init(options = {}) {
    ((this._bindFabButton = options.bindFabButton !== false),
      (this._fabBtn = document.getElementById('fabBtn')),
      (this._mascotWrap = document.getElementById('mascotWrap')),
      (this._mascotText = document.getElementById('mascotText')),
      (this._mascotFigure = document.getElementById('mascotFigure')));
    if (!this._fabBtn || !this._mascotWrap || !this._mascotText) return;
    (this._subscribeLocaleChanges(), this._bindEvents());
  },
  _getRandTip() {
    let key;
    do {
      key = Math.floor(Math.random() * TIP_KEYS.length);
    } while (key === this._lastIdx && TIP_KEYS.length > 1);
    return ((this._lastIdx = key), getMascotTipText(TIP_KEYS[key]));
  },
  _updateTip() {
    if (!this._mascotText) return;
    ((this._mascotText.textContent = this._getRandTip()),
      this._mascotText.classList.remove('refresh'),
      void this._mascotText.offsetHeight,
      this._mascotText.classList.add('refresh'),
      this._triggerShake());
  },
  _showMascot() {
    if (this._visible || !this._mascotWrap || !this._mascotText) return;
    ((this._mascotText.textContent = this._getRandTip()),
      this._mascotText.classList.remove('refresh'),
      void this._mascotText.offsetHeight,
      this._mascotText.classList.add('refresh'),
      this._mascotWrap.classList.add('visible'),
      (this._visible = true),
      this._restartIdle(),
      clearInterval(this._rotationTimer),
      (this._rotationTimer = setInterval(() => {
        if (this._visible) this._updateTip();
      }, 8000)));
  },
  _hideMascot() {
    if (!this._visible || !this._mascotWrap) return;
    (this._mascotWrap.classList.remove('visible'),
      (this._visible = false),
      clearInterval(this._rotationTimer));
  },
  _triggerShake() {
    if (!this._mascotFigure) return;
    (this._mascotFigure.classList.remove('shake', 'idle'),
      void this._mascotFigure.offsetHeight,
      this._mascotFigure.classList.add('shake'),
      this._mascotFigure.addEventListener(
        'animationend',
        () => {
          (this._mascotFigure.classList.remove('shake'), this._mascotFigure.classList.add('idle'));
        },
        { once: true }
      ));
  },
  _restartIdle() {
    if (!this._mascotFigure) return;
    (this._mascotFigure.classList.remove('shake'),
      void this._mascotFigure.offsetHeight,
      this._mascotFigure.classList.add('idle'));
  },
  _subscribeLocaleChanges() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => {
      this._visible &&
        this._lastIdx >= 0 &&
        this._mascotText &&
        (this._mascotText.textContent = getMascotTipText(TIP_KEYS[this._lastIdx]));
    });
  },
  _bindEvents() {
    // 快捷键改了要重算当前这条提示：里面嵌着具体键位，不重算就会一直显示旧键位。
    window.addEventListener('shortcuts-updated', () => {
      if (!this._visible || this._lastIdx < 0 || !this._mascotText) return;
      this._mascotText.textContent = getMascotTipText(TIP_KEYS[this._lastIdx]);
    });
    (this._bindFabButton &&
      this._fabBtn.addEventListener('click', (event) => {
        (event.stopPropagation(),
          !this._visible
            ? this._showMascot()
            : (this._updateTip(),
              clearInterval(this._rotationTimer),
              (this._rotationTimer = setInterval(() => {
                if (this._visible) this._updateTip();
              }, 8000))));
      }),
      this._mascotWrap.addEventListener('click', (event2) => {
        (event2.stopPropagation(), this._hideMascot());
      }));
  },
  show() {
    this._showMascot();
  },
  hide() {
    this._hideMascot();
  },
  isVisible() {
    return this._visible;
  },
};
export default MascotManager;
export { MascotManager };
