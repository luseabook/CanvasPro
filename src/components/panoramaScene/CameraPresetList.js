import { t } from '../../i18n/index.js';
function panoramaSceneText(value, item = {}) {
  return t('panoramaSceneNode.' + value, item);
}
export function createCameraPresetList() {
  const el = document.createElement('div');
  return ((el.className = 'panorama-camera-dock'), (el.dataset.uiStop = '1'), el);
}
function normalizeCameraSlot(key) {
  const count = Number(key);
  if (!Number.isInteger(count)) return null;
  if (count < 1 || count > 10) return null;
  return count;
}
function resolveCameraSlotEntries(list = []) {
  const list2 = Array.isArray(list) ? list : [],
    map = new Set(),
    list3 = [];
  return (
    list2.forEach((camera) => {
      const slot = normalizeCameraSlot(camera?.slot);
      if (!slot || map.has(slot)) return;
      (map.add(slot), list3.push({ camera: camera, slot: slot }));
    }),
    list2.forEach((camera2) => {
      if (list3.some((item2) => item2.camera?.id === camera2?.id)) return;
      for (let slot2 = 1; slot2 <= 10; slot2 += 1) {
        if (map.has(slot2)) continue;
        (map.add(slot2), list3.push({ camera: camera2, slot: slot2 }));
        break;
      }
    }),
    list3.sort((item3, index) => item3.slot - index.slot)
  );
}
function createCameraButton(
  result,
  data,
  { onActivate: onActivate, onDelete: onDelete, onContextMenu: onContextMenu } = {},
) {
  const { camera: camera3, slot: slot3 } = result,
    el2 = document.createElement('div');
  ((el2.className = 'panorama-camera-dock__item'),
    (el2.dataset.cameraId = camera3.id),
    (el2.dataset.cameraSlot = String(slot3)),
    (el2.tabIndex = 0));
  const options = slot3 >= 1 && slot3 <= 9,
    target = options ? String(slot3) : '';
  el2.setAttribute('aria-label', camera3.name || panoramaSceneText('camera.bookmarkAria', { slot: slot3 }));
  const source = data?.viewport?.activeCameraId === camera3.id,
    next =
      data?.selection?.selectedObjectType === 'camera' && data?.selection?.selectedObjectId === camera3.id;
  (source || next) && el2.classList.add('is-active');
  const el3 = document.createElement('button');
  ((el3.type = 'button'),
    (el3.className = 'panorama-camera-dock__activate'),
    el3.setAttribute('aria-label', el2.getAttribute('aria-label') || ''));
  const el4 = document.createElement('span');
  ((el4.className = 'panorama-camera-dock__number'), (el4.textContent = target), el3.appendChild(el4));
  const el5 = document.createElement('button');
  return (
    (el5.type = 'button'),
    (el5.className = 'panorama-camera-dock__delete'),
    (el5.textContent = '×'),
    (el5.hidden = true),
    el5.setAttribute('aria-label', panoramaSceneText('camera.deleteBookmark')),
    el3.appendChild(el5),
    el3.addEventListener('click', (event) => {
      (event.preventDefault(), event.stopPropagation(), onActivate?.(camera3.id, slot3));
    }),
    el3.addEventListener('keydown', (event2) => {
      if (event2.key !== 'Enter' && event2.key !== ' ') return;
      (event2.preventDefault(), event2.stopPropagation(), onActivate?.(camera3.id, slot3));
    }),
    el2.addEventListener('click', () => onActivate?.(camera3.id, slot3)),
    el2.addEventListener('keydown', (event3) => {
      if (event3.key !== 'Enter' && event3.key !== ' ') return;
      (event3.preventDefault(), onActivate?.(camera3.id, slot3));
    }),
    el2.addEventListener('mouseenter', () => {
      el5.hidden = false;
    }),
    el2.addEventListener('mouseleave', () => {
      el5.hidden = true;
    }),
    el5.addEventListener('click', (event4) => {
      (event4.preventDefault(), event4.stopPropagation(), onDelete?.(camera3.id, slot3));
    }),
    el2.addEventListener('contextmenu', (clientX) => {
      (clientX.preventDefault(),
        clientX.stopPropagation(),
        onContextMenu?.({
          cameraId: camera3.id,
          slot: slot3,
          clientX: clientX.clientX,
          clientY: clientX.clientY,
        }));
    }),
    el2.appendChild(el3),
    el2
  );
}
export function renderCameraPresetList(
  el6,
  current,
  { onActivate: onActivate2, onDelete: onDelete2, onContextMenu: onContextMenu2 } = {},
) {
  if (!el6) return;
  const entry = Array.isArray(current?.cameras) ? current.cameras : [],
    list4 = resolveCameraSlotEntries(entry);
  (el6.replaceChildren(),
    el6.classList.toggle('is-visible', list4.length > 0),
    list4.forEach((item4) => {
      el6.appendChild(
        createCameraButton(item4, current, {
          onActivate: onActivate2,
          onDelete: onDelete2,
          onContextMenu: onContextMenu2,
        }),
      );
    }));
}
