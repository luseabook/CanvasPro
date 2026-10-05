import { onLocaleChange, t } from '../i18n/index.js';
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
function mascotText(value, item = {}) {
  return t('mascot.' + value, item);
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
    return ((this._lastIdx = key), mascotText('tips.' + TIP_KEYS[key]));
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
        { once: true },
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
        (this._mascotText.textContent = mascotText('tips.' + TIP_KEYS[this._lastIdx]));
    });
  },
  _bindEvents() {
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
