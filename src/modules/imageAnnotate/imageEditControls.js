import { t } from '../../i18n/index.js';
import { normalizeRotationDegrees, getImageRotationLayout, worldToScreen } from '../../core/math.js';
import { positionCanvasEditorToolbar } from '../../components/shared/canvasEditorSurface.js';
import { bindRotationDrag } from './rotationDrag.js';
import { bindEditPopover } from './editPopover.js';
import { scrollElementHorizontallyWithWheel } from '../workspaceHorizontalWheel.js';
const text = (value) => t('imageAnnotate.edit.' + value),
  layoutKeys = new WeakMap();
export function getImageRotation(list = []) {
  return normalizeRotationDegrees(
    list.reduce((item, key) => {
      if (key?.type === 'rotate-image') return item + (Number(key.degrees) || 0);
      if (key?.type === 'flip-horizontal' || key?.type === 'flip-vertical') return -item;
      return item;
    }, 0),
  );
}
export const getEditorRotation = (index) => index._rotationPreview ?? getImageRotation(index._commands);
export const getKeepImageRatio = (list2 = []) =>
  list2.findLast((result) => result?.type === 'keep-image-ratio')?.enabled === true;
export function setImageRotation(enabled, data) {
  if (
    !enabled.active ||
    !enabled._isAnnotateScene() ||
    enabled._draft ||
    !Number.isFinite(Number(data))
  )
    return;
  const degrees = normalizeRotationDegrees(data),
    imageRotation = getImageRotation(enabled._commands);
  if (degrees === imageRotation) return;
  (enabled._removeTextInput(true),
    enabled._commands.push({ type: 'rotate-image', degrees: degrees - imageRotation }),
    (enabled._redoStack = []),
    (enabled._dirty = true),
    enabled._render());
}
export function syncImageEditControls(enabled2) {
  if (!enabled2._isAnnotateScene()) return;
  const editorRotation = getEditorRotation(enabled2),
    keepImageRatio = getKeepImageRatio(enabled2._commands),
    enabled3 = enabled2._imageEditControls,
    el = enabled3?.input;
  if (el && (enabled2._rotationPreview != null || el.ownerDocument.activeElement !== el))
    el.value = String(editorRotation);
  (enabled3?.keepButton.classList.toggle('active', keepImageRatio),
    enabled3?.keepButton.setAttribute('aria-pressed', String(keepImageRatio)),
    enabled2.containerEl?.classList.toggle('is-ratio-locked', keepImageRatio));
  const box = enabled2._view?.node,
    box2 = enabled2._view?.viewport;
  if (!box || !box2 || !enabled2.toolbarEl) return;
  const options = enabled3 && !enabled3.menu.panel.hidden,
    target = options ? enabled3.anchorDegrees : editorRotation,
    source = options ? enabled3.anchorRatio : keepImageRatio,
    next = [
      target,
      source,
      box.x,
      box.y,
      box.width,
      box.height,
      box2.x,
      box2.y,
      box2.zoom,
      box2._screenOriginX,
      box2._screenOriginY,
      window.innerWidth,
      window.innerHeight,
    ].join(':');
  if (layoutKeys.get(enabled2.toolbarEl) === next) return;
  layoutKeys.set(enabled2.toolbarEl, next);
  const box3 = getImageRotationLayout(box.width, box.height, target, source),
    center = worldToScreen(box.x + box.width / 2, box.y + box.height / 2, box2);
  (positionCanvasEditorToolbar(enabled2.toolbarEl, {
    center: center.x,
    top: center.y - (box3.height * box2.zoom) / 2 - enabled2.toolbarEl.offsetHeight - 12,
  }),
    enabled3?.colorMenu.position(),
    enabled3?.menu.position());
}
export function mountImageEditControls(current) {
  const el2 = current.toolbarEl;
  (el2.classList.add('v2-image-edit-toolbar'), el2.setAttribute('aria-label', text('title')));
  const entry = (record) => scrollElementHorizontallyWithWheel(record, el2, { stopPropagation: true });
  (el2.addEventListener('wheel', entry, { passive: false }),
    current.containerEl.classList.add('v2-image-edit-surface'),
    (current._rotationPreview = null));
  const el3 = el2.ownerDocument,
    el4 = el3.createElement('button');
  ((el4.type = 'button'),
    (el4.className = 'v2-annotate-btn icon-only act-image-edit'),
    el4.setAttribute('aria-label', text('title')),
    el4.setAttribute('data-tooltip', text('title')),
    (el4.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="m3 13 4-4 4 4 3-3 3 3M20 8v10a2 2 0 0 1-2 2H8m0-3-3 3 3 3"/></svg>'),
    el2.insertBefore(el4, el2.querySelector('.tool-btn')));
  const el5 = el3.createElement('div');
  ((el5.className = 'v2-image-edit-menu'),
    el5.setAttribute('role', 'dialog'),
    el5.setAttribute('aria-label', text('title')));
  const run = (payload, handle) => {
    const el6 = el3.createElement('button');
    return (
      (el6.type = 'button'),
      (el6.className = 'v2-annotate-btn'),
      (el6.textContent = payload),
      el6.addEventListener('click', handle),
      el5.append(el6),
      el6
    );
  };
  for (const state of ['.act-flip-horizontal', '.act-flip-vertical']) {
    const el7 = el2.querySelector(state),
      config = el7.getAttribute('data-tooltip');
    (el7.classList.remove('icon-only'), el7.removeAttribute('data-tooltip'));
    const el8 = el3.createElement('span');
    ((el8.textContent = config),
      el7.append(el8),
      el7.addEventListener('click', () =>
        state === '.act-flip-horizontal' ? current._flipHorizontal() : current._flipVertical(),
      ),
      el5.append(el7));
  }
  const scope = el3.createElement('label');
  ((scope.className = 'v2-annotate-btn v2-image-edit-angle-wrap'), scope.append(text('rotation')));
  const input = el3.createElement('input');
  ((input.type = 'number'),
    (input.step = '0.1'),
    (input.value = '0'),
    (input.className = 'v2-image-edit-angle'),
    input.setAttribute('aria-label', text('angle')),
    input.setAttribute('data-tooltip', text('dragHint')));
  const run2 = () => {
    if (input.value.trim() && input.validity.valid)
      setImageRotation(current, Number(input.value));
    input.value = String(getImageRotation(current._commands));
  };
  (input.addEventListener('change', run2),
    input.addEventListener('keydown', (event) => {
      (event.stopPropagation(),
        event.key === 'Enter' && (event.preventDefault(), run2(), el5.focus()),
        event.key === 'Escape' &&
          ((input.value = String(getImageRotation(current._commands))), el5.focus()));
    }),
    scope.append(input, '°'),
    el5.append(scope));
  const keepButton = run(text('keepRatio'), () => {
    (current._commands.push({
      type: 'keep-image-ratio',
      enabled: !getKeepImageRatio(current._commands),
    }),
      (current._redoStack = []),
      (current._dirty = true),
      current._render());
  });
  (keepButton.setAttribute('aria-pressed', 'false'),
    run(text('reset'), () => setImageRotation(current, 0)));
  const cancel = () => {
      ((current._rotationPreview = null), current._render());
    },
    handler = bindRotationDrag(input, {
      read: () => getImageRotation(current._commands),
      preview: (output) => {
        ((current._rotationPreview = normalizeRotationDegrees(output)), current._render());
      },
      commit: (value2) => {
        ((current._rotationPreview = null), setImageRotation(current, value2), current._render());
      },
      cancel: cancel,
    }),
    menu = bindEditPopover(el4, el5, {
      onOpen: () => {
        (colorMenu.close(),
          (current._imageEditControls.anchorDegrees = getEditorRotation(current)),
          (current._imageEditControls.anchorRatio = getKeepImageRatio(current._commands)));
      },
      onClose: (event2) => {
        if (!event2 || !el2.contains(event2.target)) syncImageEditControls(current);
      },
    }),
    el9 = current.colorMenuEl;
  el9.classList.add('v2-image-edit-color-menu');
  const colorMenu = bindEditPopover(current.colorWrapEl.querySelector('button'), el9, {
    onOpen: () => menu.close(),
  });
  current._imageEditControls = {
    input: input,
    keepButton: keepButton,
    menu: menu,
    colorMenu: colorMenu,
    closeColorMenu: () => colorMenu.close(),
    destroy() {
      (handler(),
        menu.destroy(),
        colorMenu.destroy(),
        el2.removeEventListener('wheel', entry),
        (current._rotationPreview = null));
    },
  };
}
